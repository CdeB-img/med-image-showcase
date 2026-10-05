import { projectContinuationBridgeTrace } from "./bridge-trace-projection";
import type { Dispatch, SetStateAction } from "react";
import { resolvePostAdoptionContinuationJob, type PostAdoptionContinuationJob } from "./post-adoption-continuation";
import { useEffect } from "react";
import type { ProviderCallRecord } from "@/features/protocol-designer/provider-call-observability";
import { GOVERNED_REALIZATION_SYSTEM_INSTRUCTION } from "@/features/query-navigation/governed-conversation-realization";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { recordGovernedConversationTrace, recordPostAdoptionGovernedLocalRealization, recordProductErrorBoundary } from "./end-to-end-trace-adapter";
import { appendFunctionalResetProviderCallRecords, createConversationEntryId, type ConversationEntry, type FunctionalResetSession } from "./session";
import { isStudyDesignQueryDispatch } from "./study-design-standard";
import { isScientificThinkingQueryDispatch } from "./scientific-thinking-standard";
import { isObservabilityQueryDispatch } from "./observability-standard";
import { isImagingQueryDispatch } from "./imaging-standard";
import { isBiostatisticsQueryDispatch } from "./biostatistics-standard";
import { isCanonicalStudyDataQueryDispatch } from "./canonical-study-data-standard";
import { isDataManagementQueryDispatch } from "./data-management-standard";
import { providerRecordsFromError } from "../conversation-language-effects";
import { appendBridgeTrace } from "./bridge-trace-projection";

export function usePostAdoptionContinuation(input: {
  postAdoptionContinuationJob: PostAdoptionContinuationJob | null;
  setSession: Dispatch<SetStateAction<FunctionalResetSession>>; setBusy: (busy: boolean) => void;
  setPostAdoptionContinuationJob: Dispatch<SetStateAction<PostAdoptionContinuationJob | null>>;
}) {
  const { postAdoptionContinuationJob, setSession, setBusy, setPostAdoptionContinuationJob } = input;
  useEffect(() => {
    if (!postAdoptionContinuationJob) return;
    let active = true;
    const job = postAdoptionContinuationJob;
    const observedProviderCalls: ProviderCallRecord[] = [];
    let observationTurnId = job.runtimeTurns.at(-1)?.turnId ?? `continuation:${job.project.versionId}`;
    void resolvePostAdoptionContinuationJob(job, (records) => { observedProviderCalls.push(...records); }).then((continuation) => {
      if (!active || !continuation) return;
      observationTurnId = continuation.turn.turnId;
      const continuedAt = continuation.turn.createdAt;
      setSession((current) => {
        let scientificExecutionTraceLedger = continuation.kind !== "QUESTION"
          ? continuation.traceLedger : current.scientificExecutionTraceLedger;
        if (continuation.kind === "QUESTION" && job.traceRunId
          && scientificExecutionTraceLedger.runBindings.some((binding) => binding.runId === job.traceRunId)) {
          const receipt = continuation.nativeReceipt;
          const source = job.runtimeTurns.find((turn) => turn.turnId === receipt.currentTurnNavigation?.envelope.sourceTurnRef);
          const nativeTrace = recordGovernedConversationTrace({
            ledger: scientificExecutionTraceLedger, traceRunId: job.traceRunId,
            conversationId: current.conversationId, sourceDigest: source ? logicalDigest(source.content) : "UNKNOWN",
            observedAt: continuedAt, response: receipt,
            providerContext: JSON.stringify(receipt.currentTurnNavigation!.envelope),
            systemInstruction: GOVERNED_REALIZATION_SYSTEM_INSTRUCTION,
          });
          scientificExecutionTraceLedger = nativeTrace.ledger;
          if (receipt.conversationFailure) scientificExecutionTraceLedger = recordProductErrorBoundary({
            ledger: scientificExecutionTraceLedger, traceRunId: job.traceRunId,
            turnId: continuation.turn.turnId, conversationId: current.conversationId,
            startedAt: receipt.stageTimestamps?.howRequestedAt ?? continuedAt, failedAt: continuedAt,
            owner: "QUERY_NAVIGATION", responsibilityOwner: "QUERY_NAVIGATION",
            executor: "GOVERNED_CONVERSATION_REALIZATION", componentId: "GOVERNED_CONVERSATION_REALIZATION",
            componentVersion: receipt.currentTurnNavigation!.envelope.contractVersion,
            provider: nativeTrace.realizationOutcome.attemptedProvider,
            code: receipt.conversationFailure.code, category: "BOUNDARY_REJECTION",
            project: job.project, realizationOutcome: nativeTrace.realizationOutcome,
          });
          scientificExecutionTraceLedger = recordPostAdoptionGovernedLocalRealization({
            ledger: scientificExecutionTraceLedger, traceRunId: job.traceRunId,
            conversationId: current.conversationId, turnId: continuation.turn.turnId,
            response: receipt, realized: continuation, nativeOutcome: nativeTrace.realizationOutcome,
          });
        }
        const conversationEntry: ConversationEntry = continuation.kind === "STUDY_DESIGN" && continuation.proposal.options.length
          ? {
            entryId: createConversationEntryId(),
            kind: "STUDY_DESIGN_PROPOSAL",
            role: "NOXIA",
            presentation: continuation.presentation,
            createdAt: continuedAt,
          }
          : continuation.kind === "OBSERVABILITY"
            ? {
              entryId: createConversationEntryId(),
              kind: "OBSERVABILITY_PROPOSAL",
              role: "NOXIA",
              presentation: continuation.presentation,
              createdAt: continuedAt,
            }
          : continuation.kind === "IMAGING"
            ? {
              entryId: createConversationEntryId(),
              kind: "IMAGING_PROPOSAL",
              role: "NOXIA",
              presentation: continuation.presentation,
              createdAt: continuedAt,
            }
          : continuation.kind === "BIOSTATISTICS"
            ? {
              entryId: createConversationEntryId(),
              kind: "BIOSTATISTICS_PROPOSAL",
              role: "NOXIA",
              presentation: continuation.presentation,
              createdAt: continuedAt,
            }
          : continuation.kind === "CDM"
            ? {
              entryId: createConversationEntryId(),
              kind: "CDM_RESULT",
              role: "NOXIA",
              presentation: continuation.presentation,
              createdAt: continuedAt,
            }
          : continuation.kind === "DATA_MANAGEMENT"
            ? {
              entryId: createConversationEntryId(),
              kind: "DATA_MANAGEMENT_RESULT",
              role: "NOXIA",
              presentation: continuation.presentation,
              createdAt: continuedAt,
            }
          : {
            entryId: createConversationEntryId(),
            kind: "TEXT",
            role: "NOXIA",
            content: continuation.content,
            createdAt: continuedAt,
          };
        return {
        ...current,
        queryNavigation: continuation.kind === "STUDY_DESIGN" ? continuation.navigation : current.queryNavigation,
        studyDesignInteraction: continuation.kind === "STUDY_DESIGN" ? continuation.interaction : current.studyDesignInteraction,
        scientificThinkingInteraction: continuation.kind === "SCIENTIFIC_THINKING" ? continuation.interaction : current.scientificThinkingInteraction,
        observabilityInteraction: continuation.kind === "OBSERVABILITY" ? continuation.interaction : current.observabilityInteraction,
        imagingInteraction: continuation.kind === "IMAGING" ? continuation.interaction : current.imagingInteraction,
        biostatisticsInteraction: continuation.kind === "BIOSTATISTICS" ? continuation.interaction : current.biostatisticsInteraction,
        canonicalStudyDataInteraction: continuation.kind === "CDM" ? continuation.interaction : current.canonicalStudyDataInteraction,
        dataManagementInteraction: continuation.kind === "DATA_MANAGEMENT" ? continuation.interaction : current.dataManagementInteraction,
        knowledgeOwnerLedger: continuation.kind !== "QUESTION" ? continuation.ownerResultLedger : current.knowledgeOwnerLedger,
        runtimeTurns: [...job.runtimeTurns, continuation.turn],
        entries: [...current.entries, conversationEntry],
        bridgeTraces: appendBridgeTrace(current.bridgeTraces, projectContinuationBridgeTrace(job, continuation)),
        scientificExecutionTraceLedger,
        updatedAt: continuedAt,
      };
      });
    }).catch((error: unknown) => {
      if (!active) return;
      observedProviderCalls.push(...providerRecordsFromError(error));
      const failedAt = new Date().toISOString();
      setSession((current) => ({
        ...current,
        entries: [...current.entries, {
          entryId: createConversationEntryId(),
          kind: "ERROR",
          role: "NOXIA",
          content: isScientificThinkingQueryDispatch(job.queryNavigation)
            ? "Les propositions scientifiques n’ont pas pu être préparées à partir de cette version du projet. Le projet reste inchangé."
            : isObservabilityQueryDispatch(job.queryNavigation)
              ? "Les besoins d’observation et de mesure n’ont pas pu être qualifiés à partir de cette version du projet. Le projet reste inchangé."
            : isImagingQueryDispatch(job.queryNavigation)
              ? "La stratégie d’imagerie n’a pas pu être préparée à partir de cette version du projet. Le projet reste inchangé."
            : isBiostatisticsQueryDispatch(job.queryNavigation)
              ? "Les stratégies analytiques n’ont pas pu être préparées à partir de cette version du projet. Le projet reste inchangé."
            : isCanonicalStudyDataQueryDispatch(job.queryNavigation)
              ? "Les données attendues n’ont pas pu être représentées à partir de cette version du projet. Le projet reste inchangé."
            : isDataManagementQueryDispatch(job.queryNavigation)
              ? "La gestion opérationnelle des données n’a pas pu être préparée à partir du résultat courant. Le projet reste inchangé."
            : isStudyDesignQueryDispatch(job.queryNavigation)
              ? "Les stratégies d’étude n’ont pas pu être préparées à partir de cette version du projet. Le projet reste inchangé."
              : "NOXIA n’a pas pu présenter la prochaine étape. Vous pouvez poursuivre librement.",
          createdAt: failedAt,
        }],
        updatedAt: failedAt,
      }));
      if (import.meta.env.DEV) console.error("NOXIA_POST_ADOPTION_CONTINUATION_FAILURE", error);
    }).finally(() => {
      if (!active) return;
      setSession((current) => appendFunctionalResetProviderCallRecords(current, {
        turnId: observationTurnId, traceRunId: job.traceRunId ?? undefined,
        requestKind: "POST_ADOPTION_QRY_CONTINUATION", records: observedProviderCalls,
      }));
      setPostAdoptionContinuationJob((current) => current === job ? null : current);
      setBusy(false);
    });
    return () => { active = false; };
  }, [postAdoptionContinuationJob, setSession, setPostAdoptionContinuationJob, setBusy]);

}
