import type { Dispatch, SetStateAction, MutableRefObject } from "react";
import { isDrciDraftPackCurrent, prepareDrciDraftSource, validateDrciHandoff } from "@/features/document-projection/drci-draft-pack";
import { DOC_ARCHIVE_CONTRACT, documentNativeIdentity, isDocumentGenerationRef, type DocumentGenerationRef } from "@/features/document-projection/generation-persistence";
import { createDocumentArchiveClient } from "@/features/document-projection/generation-archive-client";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { hasCurrentArchivedGeneration, hydrateDocumentCommandSession, persistTemplateGeneration, publishArchivedTemplate,
  readCurrentArchivedGeneration, publishArchivedGeneration, failedDocumentRetryProjection } from "@/features/document-projection/generation-session";
import { useEffect, useRef, useState } from "react";
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
  const recoveryInFlightRef = useRef(false);
  const dispatchedRequestRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const [recoveryObservation, setRecoveryObservation] = useState(0);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);
  // Read/materialize the existing admission only. This function deliberately
  // cannot call requestProtocolDesignerBridge or create a generation intent.
  async function recoverPendingDocument(isMounted = () => mountedRef.current): Promise<"IN_PROGRESS" | "DONE"> {
    const source = latestSessionRef.current, identity = source.documentArchive?.pendingRecovery;
    if (recoveryInFlightRef.current) return "IN_PROGRESS";
    if (documentCommandInFlightRef.current) return "DONE";
    if (!source.documentArchive?.pendingRequestId) return "DONE";
    recoveryInFlightRef.current = true;
    setDocumentGenerationVersion(null); setDocumentGenerationPending(true);
    setDocumentGenerationStartedAt(Date.now()); setDocumentGenerationElapsed(0);
    setDocumentGenerationComplete(false); setDocumentGenerationStage("VERIFYING_ARCHIVE");
    const matches = (current: FunctionalResetSession) => current.sessionId === source.sessionId
      && current.project?.projectId === source.project?.projectId && current.project?.versionId === source.project?.versionId
      && current.project?.projectDigest === source.project?.projectDigest;
    let inProgress = false;
    try {
      if (!identity || !source.project || identity.requestId !== source.documentArchive.pendingRequestId
        || identity.project.projectId !== source.project.projectId || identity.project.projectVersion !== source.project.versionId
        || identity.project.projectDigest !== source.project.projectDigest) throw new Error("DOC_ARCHIVE_RECOVERY_BINDING_INVALID");
      const recovered = await createDocumentArchiveClient(source.sessionId, source.project).recover(identity);
      if (!isMounted() || !matches(latestSessionRef.current)) return "DONE";
      if (recovered.state === "IN_PROGRESS") { inProgress = true; return "IN_PROGRESS"; }
      if (recovered.state === "UNKNOWN") throw new Error("DOC_ARCHIVE_RECOVERY_UNKNOWN");
      const current = latestSessionRef.current;
      const next = recovered.state === "COMMITTED"
        ? publishArchivedGeneration(current, recovered.receipt.generation, identity.projectionId)
        : { ...current, documentArchive: { ...current.documentArchive!, pendingRequestId: null, pendingRecovery: null },
          documentRetryUnsafe: false, documents: markFunctionalResetDocumentFailure(current.project!, current.documents,
            new Error(recovered.errorCode ?? "DOC_ARCHIVE_PROVIDER_FAILED")) };
      const saved = await saveFunctionalResetWorkspaceSession(window.localStorage, next, onSessionChange);
      if (!isMounted() || !matches(latestSessionRef.current)) return "DONE";
      // Preserve conversation updates while publishing only the DOC result/link.
      const latest = latestSessionRef.current;
      const published = recovered.state === "COMMITTED"
        ? publishArchivedGeneration(latest, recovered.receipt.generation, identity.projectionId)
        : { ...latest, documents: next.documents, documentArchive: next.documentArchive, documentRetryUnsafe: false };
      latestSessionRef.current = published; setSession(published);
      documentRecoveryRef.current = null;
      if (recovered.state === "COMMITTED") {
        setDocumentGenerationVersion(recovered.receipt.generation.displayVersion);
        setDeliverableWorkspaceOpen(true); setDocumentGenerationComplete(true);
      }
      setDocumentSaveWarning(saved.scientificPersisted ? null : "Lien local non enregistré ; la génération durable reste récupérable.");
    } catch (error) {
      if (isMounted() && matches(latestSessionRef.current)) {
        const current = latestSessionRef.current;
        const failed = { ...current, documentRetryUnsafe: true,
          documents: current.project ? markFunctionalResetDocumentFailure(current.project, current.documents, error) : current.documents };
        latestSessionRef.current = failed; setSession(failed);
        const nativeCode = error instanceof Error && /^[A-Z][A-Z0-9_:.-]{0,159}$/.test(error.message)
          ? error.message : "DOC_ARCHIVE_RECOVERY_UNAVAILABLE";
        setDocumentSaveWarning(`La finalisation ne peut pas être vérifiée (${nativeCode}). La demande d’origine est conservée ; aucune nouvelle rédaction n’est lancée.`);
        documentRecoveryRef.current = { projectDigest: source.project?.projectDigest ?? "", resume: resumePendingDocument };
      }
    } finally {
      recoveryInFlightRef.current = false;
      if (isMounted() && !inProgress) setDocumentGenerationPending(false);
    }
    return "DONE";
  }
  async function resumePendingDocument() {
    if (await recoverPendingDocument() === "IN_PROGRESS" && mountedRef.current) setRecoveryObservation(value => value + 1);
  }
  const recoveryRunner = useRef(recoverPendingDocument);
  recoveryRunner.current = recoverPendingDocument;
  const pendingRequestId = latestSessionRef.current.documentArchive?.pendingRequestId;
  const currentProjectDigest = latestSessionRef.current.project?.projectDigest;
  useEffect(() => {
    if (!pendingRequestId || pendingRequestId === dispatchedRequestRef.current && recoveryObservation === 0 || documentCommandInFlightRef.current) return;
    let mounted = true, timer: ReturnType<typeof setTimeout> | undefined;
    const read = async () => {
      const state = await recoveryRunner.current(() => mounted);
      // Observation only while the durable owner says genuinely in-flight.
      if (mounted && state === "IN_PROGRESS") timer = setTimeout(() => { void read(); }, 2000);
    };
    void read();
    return () => { mounted = false; clearTimeout(timer); };
  }, [pendingRequestId, currentProjectDigest, recoveryObservation]);
  async function requestProtocolProjection(
    requestedEvidence?: ReturnType<typeof acquireDocumentKnowledge>,
    sourceSession: FunctionalResetSession = latestSessionRef.current,
  ) {
    if (sourceSession.documentArchive?.pendingRequestId) { await resumePendingDocument(); return; }
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
      // Restore the authorization from the immutable source itself, not the
      // refreshed presentation portfolio. The durable scope owner still checks
      // the exact model/payload/configuration/contract before reusing a result.
      const documents = retryProjection ? { ...loaded.documents, handoffDecision: decision, lastFailure: null } : refreshFunctionalResetDocumentPortfolio({
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
        const recoveryIdentity = { requestId: nativeRequest.observabilityContext!.clientRequestId,
          project: { projectId: sourceSession.project.projectId, projectVersion: sourceSession.project.versionId, projectDigest: sourceSession.project.projectDigest },
          projectionId: protocol.projectionId, handoffDigest: logicalDigest(decision) };
        // Persist the immutable source link and admission identity BEFORE dispatch.
        // Fail closed if local scientific persistence cannot retain this linkage.
        const latestBeforeDispatch = latestSessionRef.current;
        if (latestBeforeDispatch.sessionId !== sourceSession.sessionId || latestBeforeDispatch.project?.versionId !== sourceSession.project.versionId
          || latestBeforeDispatch.project?.projectDigest !== sourceSession.project.projectDigest) throw new Error("DOC_ARCHIVE_RECOVERY_BINDING_INVALID");
        const pendingSession = { ...documentaryContext(latestBeforeDispatch),
          documentArchive: { ...templateSession.documentArchive!, currentGenerationId: latestBeforeDispatch.documentArchive?.currentGenerationId ?? null,
            currentGeneration: latestBeforeDispatch.documentArchive?.currentGeneration, pendingRequestId: recoveryIdentity.requestId, pendingRecovery: recoveryIdentity } };
        dispatchedRequestRef.current = recoveryIdentity.requestId;
        if (!(await saveFunctionalResetWorkspaceSession(window.localStorage, pendingSession, onSessionChange)).scientificPersisted)
          throw new Error("DOC_ARCHIVE_RECOVERY_IDENTITY_NOT_PERSISTED");
        latestSessionRef.current = { ...documentaryContext(latestSessionRef.current), documentArchive: pendingSession.documentArchive };
        setSession(latestSessionRef.current);
        // This closure performs the initial explicit dispatch only. Recovery
        // uses the persisted admission link and the non-provider archive path.
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
            const retrievalAllowed = error instanceof TypeError
              || error instanceof ProductBridgeClientError && ["DOC_ARCHIVE_PERSISTENCE_FAILED", "DOC_ARCHIVE_LEDGER_FINALIZATION_FAILED"].includes(error.code);
            const recoverable = retrievalAllowed || error instanceof ProductBridgeClientError && error.code.includes("UNKNOWN_AFTER_DISPATCH");
            documentRecoveryRef.current = retrievalAllowed
              ? { projectDigest: sourceSession.project!.projectDigest, resume: resumePendingDocument } : null;
            const failedDocuments = markFunctionalResetDocumentFailure(sourceSession.project, templateSession.documents, error, records);
            setSession(current => current.sessionId !== sourceSession.sessionId
              || current.project?.projectDigest !== sourceSession.project?.projectDigest ? current : ({ ...current, ...(evidence ?? {}), documents: failedDocuments,
              documentArchive: { ...templateSession.documentArchive!, currentGenerationId: current.documentArchive?.currentGenerationId ?? null,
                currentGeneration: current.documentArchive?.currentGeneration, pendingRequestId: recoverable ? recoveryIdentity.requestId : null,
                pendingRecovery: recoverable ? recoveryIdentity : null },
              documentRetryUnsafe: recoverable,
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
