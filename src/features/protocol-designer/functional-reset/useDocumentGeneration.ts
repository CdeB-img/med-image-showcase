import type { Dispatch, SetStateAction, MutableRefObject } from "react";
import { isDrciDraftPackCurrent, prepareDrciDraftSource } from "@/features/document-projection/drci-draft-pack";
import { nextDocumentGenerationVersion } from "@/features/document-projection/history";
import { DOC_ARCHIVE_CONTRACT, documentNativeIdentity } from "@/features/document-projection/generation-persistence";
import { useRef } from "react";
import { ProductBridgeClientError, requestProtocolDesignerBridge } from "@/features/protocol-designer/product-bridge-client";
import { type ProductBridgeRequest } from "@/features/protocol-designer/product-bridge";
import type { ProviderCallRecord } from "@/features/protocol-designer/provider-call-observability";
import { authorizeResearchProjectDocumentHandoff } from "@/features/research-project-construction";
import { buildCanonicalCrfPackage, markFunctionalResetDocumentFailure, refreshFunctionalResetDocumentPortfolio } from "@/features/document-projection";
import { recordDocumentProjectionTrace, recordProductErrorBoundary } from "./end-to-end-trace-adapter";
import { appendFunctionalResetProviderCallRecords, createTurnId, saveFunctionalResetWorkspaceSession, type SessionSave, type FunctionalResetSession } from "./session";
import { acquireDocumentKnowledge } from "./documentary-conversation";

export function useDocumentGeneration(input: {
  latestSessionRef: MutableRefObject<FunctionalResetSession>; setSession: Dispatch<SetStateAction<FunctionalResetSession>>;
  administration: Parameters<typeof refreshFunctionalResetDocumentPortfolio>[0]["administration"]; projectionMode: "STANDARD" | "EXPERT";
  onSessionChange?: SessionSave;
  setDocumentSaveWarning: (message: string | null) => void; setDeliverableWorkspaceOpen: (open: boolean) => void;
  setDocumentGenerationVersion: (version: number) => void; setDocumentGenerationStartedAt: (at: number | null) => void;
  setDocumentGenerationElapsed: (seconds: number) => void; setDocumentGenerationComplete: (complete: boolean) => void;
  setDocumentGenerationPending: (pending: boolean) => void;
}) {
  const { latestSessionRef, setSession, administration, projectionMode, onSessionChange, setDocumentSaveWarning, setDeliverableWorkspaceOpen,
    setDocumentGenerationVersion, setDocumentGenerationStartedAt, setDocumentGenerationElapsed, setDocumentGenerationComplete, setDocumentGenerationPending } = input;
  const documentRecoveryRef = useRef<{ projectDigest: string; resume: () => Promise<void> } | null>(null);
  const documentGenerationInFlightRef = useRef(false);
  async function requestProtocolProjection(
    requestedEvidence?: ReturnType<typeof acquireDocumentKnowledge>,
    sourceSession: FunctionalResetSession = latestSessionRef.current,
  ) {
    if (!sourceSession.project) return;
    const now = new Date().toISOString();
    try {
      // A valid empty Knowledge result is allowed. Integrity, binding and
      // privacy failures must retain their native error instead of pretending
      // that no literature was found.
      const evidence = requestedEvidence ?? acquireDocumentKnowledge(sourceSession, now);
      const decision = authorizeResearchProjectDocumentHandoff({
        project: sourceSession.project,
        authority: sourceSession.projectAuthority,
        confirmedAt: now,
      });
      const documents = refreshFunctionalResetDocumentPortfolio({
        knowledgeLibrary: evidence?.sourceLibrary,
        administration,
        project: sourceSession.project,
        previous: sourceSession.documents,
        handoffDecision: decision,
        requestedAt: now,
        generateProtocol: true,
      });
      const protocol = documents.projections.at(-1) ?? null;
      if (!protocol || documents.lastFailure) throw new Error(documents.lastFailure?.message ?? "DOC_PROTOCOL_PROJECTION_NOT_CREATED");
      if (import.meta.env.VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME === "TERRA") {
        if (documentGenerationInFlightRef.current) return;
        const turnId = createTurnId();
        const nativeRequest: Omit<ProductBridgeRequest, "apiVersion"> = { requestKind: "USER_TURN",
            // DOC consumes the adopted Project, not the scientific transcript.
            // Keep the original last user turn for request correlation only.
            conversation: { conversationId: sourceSession.conversationId, language: "fr", turns: sourceSession.runtimeTurns.filter(turn => turn.role === "USER").slice(-1) },
            currentProject: sourceSession.project, evaluatePersistentDelta: false,
            documentDraftRequest: prepareDrciDraftSource({ handoffDecision: decision, protocolProjection: protocol, crf: buildCanonicalCrfPackage(sourceSession.project) }),
            observabilityContext: { sessionId: sourceSession.sessionId, conversationId: sourceSession.conversationId,
              turnId, clientRequestId: `drci-draft:${turnId}`, testSessionId: null } };
        // Keep the exact request, including handoff time and payload, for a
        // transport recovery. The durable owner decides whether dispatch is safe.
        const resume = async () => {
          if (documentGenerationInFlightRef.current || latestSessionRef.current.project?.projectDigest !== sourceSession.project?.projectDigest) return;
          documentGenerationInFlightRef.current = true;
          setDocumentGenerationVersion(nextDocumentGenerationVersion(sourceSession.drciDraftPacks ?? [], sourceSession.project!.projectId));
          setDocumentGenerationStartedAt(Date.now());
          setDocumentGenerationElapsed(0);
          setDocumentGenerationComplete(false);
          setDocumentGenerationPending(true);
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
              || receipt.generation.persistenceState !== "COMMITTED"
              || receipt.generation.generationId !== documentNativeIdentity({ family: "DRCI", value: pack })
              || receipt.generation.project.projectId !== latest.project.projectId
              || receipt.generation.project.projectVersion !== latest.project.versionId
              || receipt.generation.project.projectDigest !== latest.project.projectDigest) throw new Error("DOC_ARCHIVE_COMMIT_NOT_VERIFIED");
            const nextSession: FunctionalResetSession = { ...latest, ...(evidence ?? {}), documents,
              drciDraftPacks: [...latest.drciDraftPacks ?? [], pack], openDocumentProjectionId: null,
              documentArchive: { contract: DOC_ARCHIVE_CONTRACT, projectId: latest.project.projectId, historyState: "NOT_LOADED",
                currentGenerationId: receipt.generation.generationId, currentProjectionId: null, pendingRequestId: null,
                legacyCoverageVerified: false },
              documentRetryUnsafe: false,
              entries: latest.entries,
              updatedAt: now };
            const saved = (await saveFunctionalResetWorkspaceSession(window.localStorage, nextSession, onSessionChange)).scientificPersisted;
            setDocumentSaveWarning(saved ? null : "Documents enregistrés dans l’archive ; lien local non enregistré dans ce navigateur. Les versions restent récupérables depuis l’archive du projet.");
            latestSessionRef.current = nextSession; setSession(nextSession);
            setDeliverableWorkspaceOpen(true);
            setDocumentGenerationComplete(true);
          } catch (error) {
            if (error instanceof ProductBridgeClientError) records.push(...error.observability?.providerCalls ?? []);
            // Only a transport failure exposes retrieval. Terminal/UNKNOWN
            // results must not be turned into a fresh paid generation.
            documentRecoveryRef.current = error instanceof TypeError
              || error instanceof ProductBridgeClientError && ["DOC_ARCHIVE_PERSISTENCE_FAILED", "DOC_ARCHIVE_LEDGER_FINALIZATION_FAILED"].includes(error.code)
              ? { projectDigest: sourceSession.project!.projectDigest, resume } : null;
            const failedDocuments = markFunctionalResetDocumentFailure(sourceSession.project, documents, error, records);
            setSession(current => current.sessionId !== sourceSession.sessionId
              || current.project?.projectDigest !== sourceSession.project?.projectDigest ? current : ({ ...current, ...(evidence ?? {}), documents: failedDocuments,
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
        documents,
        documentRetryUnsafe: false,
        openDocumentProjectionId: protocol.projectionId,
        scientificExecutionTraceLedger,
        entries: current.entries,
        updatedAt: now,
      };
      });
    } catch (error) {
      const documents = markFunctionalResetDocumentFailure(sourceSession.project, sourceSession.documents, error);
      setSession((current) => {
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
    }
  };

  return { requestProtocolProjection, documentRecoveryRef };
}
