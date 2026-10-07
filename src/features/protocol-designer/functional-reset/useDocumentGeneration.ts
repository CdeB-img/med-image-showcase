import type { Dispatch, SetStateAction, MutableRefObject } from "react";
import { isDrciDraftPackCurrent, prepareDrciDraftSource, validateDrciHandoff } from "@/features/document-projection/drci-draft-pack";
import { DOC_ARCHIVE_CONTRACT, documentNativeIdentity, isDocumentGenerationRef, type DocumentGenerationRef } from "@/features/document-projection/generation-persistence";
import { createDocumentArchiveClient } from "@/features/document-projection/generation-archive-client";
import { hasCurrentArchivedGeneration, hydrateDocumentCommandSession, persistTemplateGeneration, publishArchivedTemplate,
  readCurrentArchivedGeneration, publishArchivedGeneration, failedDocumentRetryProjection } from "@/features/document-projection/generation-session";
import { useRef } from "react";
import { ProductBridgeClientError, requestProtocolDesignerBridge } from "@/features/protocol-designer/product-bridge-client";
import { type ProductBridgeRequest } from "@/features/protocol-designer/product-bridge";
import type { ProviderCallRecord } from "@/features/protocol-designer/provider-call-observability";
import { authorizeResearchProjectDocumentHandoff } from "@/features/research-project-construction";
import { buildCanonicalCrfPackage, markFunctionalResetDocumentFailure, refreshFunctionalResetDocumentPortfolio, unloadFunctionalResetDocumentPortfolio } from "@/features/document-projection";
import { recordDocumentProjectionTrace, recordProductErrorBoundary } from "./end-to-end-trace-adapter";
import { appendFunctionalResetProviderCallRecords, createTurnId, saveFunctionalResetWorkspaceSession, type SessionSave, type FunctionalResetSession } from "./session";
import { acquireDocumentKnowledge } from "./documentary-conversation";

export type DocumentGenerationStage = "PREPARING" | "WRITING" | "VERIFYING_ARCHIVE";

export function useDocumentGeneration(input: {
  latestSessionRef: MutableRefObject<FunctionalResetSession>; setSession: Dispatch<SetStateAction<FunctionalResetSession>>;
  administration: Parameters<typeof refreshFunctionalResetDocumentPortfolio>[0]["administration"]; projectionMode: "STANDARD" | "EXPERT";
  onSessionChange?: SessionSave;
  setDocumentSaveWarning: (message: string | null) => void; setDeliverableWorkspaceOpen: (open: boolean) => void;
  setDocumentGenerationVersion: (version: number | null) => void; setDocumentGenerationStartedAt: (at: number | null) => void;
  setDocumentGenerationElapsed: (seconds: number) => void; setDocumentGenerationComplete: (complete: boolean) => void;
  setDocumentGenerationPending: (pending: boolean) => void;
  setDocumentGenerationStage: (stage: DocumentGenerationStage) => void;
}) {
  const { latestSessionRef, setSession, administration, projectionMode, onSessionChange, setDocumentSaveWarning, setDeliverableWorkspaceOpen,
    setDocumentGenerationVersion, setDocumentGenerationStartedAt, setDocumentGenerationElapsed, setDocumentGenerationComplete, setDocumentGenerationPending, setDocumentGenerationStage } = input;
  const documentRecoveryRef = useRef<{ projectDigest: string; resume: () => Promise<void> } | null>(null);
  const documentGenerationInFlightRef = useRef(false);
  const documentCommandInFlightRef = useRef(false);
  async function requestProtocolProjection(
    requestedEvidence?: ReturnType<typeof acquireDocumentKnowledge>,
    sourceSession: FunctionalResetSession = latestSessionRef.current,
  ) {
    if (!sourceSession.project || documentCommandInFlightRef.current || sourceSession.documentRetryUnsafe
      || import.meta.env.VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME === "TERRA" && hasCurrentArchivedGeneration(sourceSession)) return;
    documentCommandInFlightRef.current = true;
    setDocumentGenerationVersion(null);
    setDocumentGenerationPending(true);
    setDocumentGenerationStage("PREPARING");
    setDocumentGenerationStartedAt(Date.now());
    setDocumentGenerationElapsed(0);
    setDocumentGenerationComplete(false);
    const now = new Date().toISOString();
    const client = createDocumentArchiveClient(sourceSession.sessionId, sourceSession.project);
    let committedGeneration: DocumentGenerationRef | null = null;
    let currentProjectionId = sourceSession.documentArchive?.currentProjectionId ?? null;
    let preparedDocuments: FunctionalResetSession["documents"] | null = null;
    let documentEvidence: ReturnType<typeof acquireDocumentKnowledge> | undefined;
    const documentaryContext = (current: FunctionalResetSession): FunctionalResetSession => ({ ...current,
      ...(preparedDocuments ? { documents: preparedDocuments } : {}),
      // Do not overwrite a Knowledge update made by a concurrent conversation.
      ...(current.knowledgeOwnerLedger === sourceSession.knowledgeOwnerLedger
        && current.sourceLibrary === sourceSession.sourceLibrary ? documentEvidence : {}),
    });
    // Both normal delivery and post-commit errors converge on this metadata
    // read. No provider dispatch, body preload or second generation is involved.
    const reconcile = async (completion = true) => {
      if (completion) setDocumentGenerationStage("VERIFYING_ARCHIVE");
      let generation: DocumentGenerationRef | null;
      let warning: string | null = null;
      try { generation = await readCurrentArchivedGeneration(sourceSession, client); }
      catch {
        // A verified server commit remains authoritative even if a subsequent
        // metadata read is temporarily unavailable.
        generation = committedGeneration;
        warning = "Documents archivés ; l’historique n’a pas pu être rafraîchi pour le moment.";
      }
      generation ??= committedGeneration;
      const latest = latestSessionRef.current;
      if (!generation || latest.sessionId !== sourceSession.sessionId
        || latest.project?.projectDigest !== sourceSession.project?.projectDigest
        || latest.project?.versionId !== sourceSession.project?.versionId) return false;
      const next = publishArchivedGeneration(documentaryContext(latest), generation, currentProjectionId);
      try {
        if (!(await saveFunctionalResetWorkspaceSession(window.localStorage, next, onSessionChange)).scientificPersisted)
          warning = "Documents enregistrés dans l’archive ; lien local non enregistré dans ce navigateur. Les versions restent récupérables depuis l’archive du projet.";
      } catch {
        warning = "Documents enregistrés dans l’archive ; lien local non enregistré dans ce navigateur. Les versions restent récupérables depuis l’archive du projet.";
      }
      // Conversation may progress during the local save. Rebase only the DOC
      // pointer on the latest session, without overwriting those new turns.
      const current = latestSessionRef.current;
      if (current.sessionId !== sourceSession.sessionId || current.project?.projectDigest !== generation.project.projectDigest
        || current.project?.versionId !== generation.project.projectVersion) return false;
      const published = publishArchivedGeneration(documentaryContext(current), generation, currentProjectionId);
      latestSessionRef.current = published; setSession(published);
      documentRecoveryRef.current = null;
      setDocumentSaveWarning(warning); setDocumentGenerationVersion(generation.displayVersion);
      setDeliverableWorkspaceOpen(true); setDocumentGenerationComplete(true);
      return true;
    };
    try {
      if (import.meta.env.VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME === "TERRA") {
        // Fresh metadata, not bodies: a missing/stale local pointer must not
        // generate again after reload or after another tab completed DOC.
        if (await reconcile(false)) return;
      }
      const loaded = await hydrateDocumentCommandSession(sourceSession, client);
      // A valid empty Knowledge result is allowed. Integrity, binding and
      // privacy failures must retain their native error instead of pretending
      // that no literature was found.
      const retryProjection = requestedEvidence ? null : failedDocumentRetryProjection(loaded, administration);
      const evidence = retryProjection ? undefined : requestedEvidence ?? acquireDocumentKnowledge(sourceSession, now);
      const decision = retryProjection ? validateDrciHandoff(sourceSession.project,
        retryProjection.humanDecisions.find(item => item.gateId === "PRJ-GATE-DOCUMENT-WORKING-PROJECTION")) : authorizeResearchProjectDocumentHandoff({
        project: sourceSession.project,
        authority: sourceSession.projectAuthority,
        confirmedAt: now,
      });
      const documents = retryProjection ? { ...loaded.documents, lastFailure: null } : refreshFunctionalResetDocumentPortfolio({
        knowledgeLibrary: evidence?.sourceLibrary,
        administration,
        project: sourceSession.project,
        previous: loaded.documents,
        handoffDecision: decision,
        requestedAt: now,
        generateProtocol: true,
      });
      const protocol = documents.projections.at(-1) ?? null;
      if (!protocol || documents.lastFailure) throw new Error(documents.lastFailure?.message ?? "DOC_PROTOCOL_PROJECTION_NOT_CREATED");
      const templateSession = retryProjection ? { ...sourceSession, documents: unloadFunctionalResetDocumentPortfolio(documents, protocol) }
        : publishArchivedTemplate({ ...sourceSession, documents }, protocol, await persistTemplateGeneration(sourceSession, protocol, client));
      currentProjectionId = templateSession.documentArchive?.currentProjectionId ?? protocol.projectionId;
      preparedDocuments = templateSession.documents;
      documentEvidence = evidence;
      if (import.meta.env.VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME === "TERRA") {
        if (documentGenerationInFlightRef.current) return;
        const turnId = createTurnId();
        const nativeRequest: Omit<ProductBridgeRequest, "apiVersion"> = { requestKind: "USER_TURN",
            // DOC consumes the adopted Project, not the scientific transcript.
            // Keep the original last user turn for request correlation only.
            // A concurrent/later Chat turn is not a changed DOC source. Reuse
            // the existing correlation turn captured before the failed handoff;
            // never reconstruct prose or remove later turns from the session.
            conversation: { conversationId: sourceSession.conversationId, language: "fr", turns: sourceSession.runtimeTurns
              .filter(turn => turn.role === "USER" && (!retryProjection || Date.parse(turn.createdAt) <= Date.parse(retryProjection.requestedAt))).slice(-1) },
            currentProject: sourceSession.project, evaluatePersistentDelta: false,
            documentDraftRequest: prepareDrciDraftSource({ handoffDecision: decision, protocolProjection: protocol, crf: buildCanonicalCrfPackage(sourceSession.project) }),
            observabilityContext: { sessionId: sourceSession.sessionId, conversationId: sourceSession.conversationId,
              turnId, clientRequestId: `drci-draft:${sourceSession.project.projectDigest}:${turnId}`, testSessionId: null } };
        // Keep the exact request, including handoff time and payload, for a
        // transport recovery. The durable owner decides whether dispatch is safe.
        const resume = async () => {
          if (documentGenerationInFlightRef.current || latestSessionRef.current.project?.projectDigest !== sourceSession.project?.projectDigest) return;
          documentGenerationInFlightRef.current = true;
          setDocumentGenerationVersion(null);
          setDocumentGenerationStartedAt(Date.now());
          setDocumentGenerationElapsed(0);
          setDocumentGenerationComplete(false);
          setDocumentGenerationPending(true);
          setDocumentGenerationStage("WRITING");
          const records: ProviderCallRecord[] = [];
          try {
            const response = await requestProtocolDesignerBridge(nativeRequest);
            documentRecoveryRef.current = null;
            records.push(...response.observability.providerCalls ?? []);
            const latest = latestSessionRef.current;
            const pack = response.documentDraftPack;
            if (!pack || !latest.project || latest.sessionId !== sourceSession.sessionId || !isDrciDraftPackCurrent(pack, latest.project))
              throw new Error("Le projet a changé pendant la rédaction. Aucune version documentaire courante n’a été enregistrée.");
            const receipt = response.documentPersistenceReceipt;
            if (!receipt || receipt.contract !== DOC_ARCHIVE_CONTRACT || receipt.requestId !== nativeRequest.observabilityContext?.clientRequestId
              || !isDocumentGenerationRef(receipt.generation, latest.project.projectId)
              || receipt.generation.persistenceState !== "COMMITTED"
              || receipt.generation.generationId !== documentNativeIdentity({ family: "DRCI", value: pack })
              || receipt.generation.project.projectId !== latest.project.projectId
              || receipt.generation.project.projectVersion !== latest.project.versionId
              || receipt.generation.project.projectDigest !== latest.project.projectDigest) throw new Error("DOC_ARCHIVE_COMMIT_NOT_VERIFIED");
            committedGeneration = receipt.generation;
            if (!await reconcile()) throw new Error("DOC_ARCHIVE_PROJECT_BINDING_INVALID");
          } catch (error) {
            if (error instanceof ProductBridgeClientError) records.push(...error.observability?.providerCalls ?? []);
            if (await reconcile()) return;
            // Only a transport failure exposes retrieval. Terminal/UNKNOWN
            // results must not be turned into a fresh paid generation.
            documentRecoveryRef.current = error instanceof TypeError
              || error instanceof ProductBridgeClientError && ["DOC_ARCHIVE_PERSISTENCE_FAILED", "DOC_ARCHIVE_LEDGER_FINALIZATION_FAILED"].includes(error.code)
              ? { projectDigest: sourceSession.project!.projectDigest, resume } : null;
            const failedDocuments = markFunctionalResetDocumentFailure(sourceSession.project, templateSession.documents, error, records);
            setSession(current => current.sessionId !== sourceSession.sessionId
              || current.project?.projectDigest !== sourceSession.project?.projectDigest ? current : ({ ...current, ...(evidence ?? {}), documents: failedDocuments,
              documentArchive: { ...templateSession.documentArchive!, currentGenerationId: current.documentArchive?.currentGenerationId ?? null,
                currentGeneration: current.documentArchive?.currentGeneration },
              documentRetryUnsafe: error instanceof ProductBridgeClientError && error.code.includes("UNKNOWN_AFTER_DISPATCH"),
              updatedAt: now }));
          } finally {
            setSession(current => appendFunctionalResetProviderCallRecords(current, { turnId, requestKind: "USER_TURN", records }));
            documentGenerationInFlightRef.current = false;
            setDocumentGenerationPending(false);
          }
        };
        await resume();
        return;
      }
      setSession((current) => {
        const correlatedTrace = [...current.bridgeTraces]
          .reverse()
          .find((trace) => trace.traceRunId && trace.projectVersionAfter === sourceSession.project?.versionId);
        const scientificExecutionTraceLedger = recordDocumentProjectionTrace({
          ledger: current.scientificExecutionTraceLedger,
          traceRunId: correlatedTrace?.traceRunId,
          conversationId: current.conversationId,
          recordedAt: now,
          project: sourceSession.project!,
          decision,
          projection: protocol,
          projectionMode,
        });
        return {
        ...current,
        ...(evidence ?? {}),
        documents: templateSession.documents,
        documentArchive: templateSession.documentArchive,
        drciDraftPacks: [],
        documentRetryUnsafe: false,
        openDocumentProjectionId: null,
        scientificExecutionTraceLedger,
        entries: current.entries,
        updatedAt: now,
      };
      });
      setDeliverableWorkspaceOpen(true);
    } catch (error) {
      if (import.meta.env.VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME === "TERRA" && await reconcile()) return;
      const documents = markFunctionalResetDocumentFailure(sourceSession.project, sourceSession.documents, error);
      setSession((current) => {
        if (current.sessionId !== sourceSession.sessionId || current.project?.projectDigest !== sourceSession.project?.projectDigest
          || current.project?.versionId !== sourceSession.project?.versionId) return current;
        const correlatedTrace = [...current.bridgeTraces]
          .reverse()
          .find((trace) => trace.traceRunId && trace.projectVersionAfter === sourceSession.project?.versionId);
        const scientificExecutionTraceLedger = correlatedTrace?.traceRunId
          ? recordProductErrorBoundary({
            ledger: current.scientificExecutionTraceLedger,
            traceRunId: correlatedTrace.traceRunId,
            turnId: correlatedTrace.turnId,
            conversationId: current.conversationId,
            startedAt: now,
            failedAt: now,
            owner: "DOC",
            responsibilityOwner: "DOC-001",
            executor: "FUNCTIONAL_RESET_DOCUMENT_BOUNDARY",
            componentId: "DOC-001",
            componentVersion: "1.0.0",
            provider: "NONE",
            code: "DOCUMENT_PROJECTION_BOUNDARY_FAILED",
            category: "BOUNDARY_REJECTION",
            sourceDigest: sourceSession.project!.projectDigest,
            project: sourceSession.project!,
          })
          : current.scientificExecutionTraceLedger;
        return {
        ...current,
        documents,
        scientificExecutionTraceLedger,
        entries: current.entries,
        updatedAt: now,
      };
      });
    } finally { documentCommandInFlightRef.current = false; setDocumentGenerationPending(false); }
  };

  return { requestProtocolProjection, documentRecoveryRef };
}
