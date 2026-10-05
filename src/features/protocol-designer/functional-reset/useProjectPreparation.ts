import { useEffect, useRef, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { ProductBridgeClientError, readWorkingDraftPreparation, requestProtocolDesignerBridge } from "../product-bridge-client";
import type { ProviderCallRecord } from "../provider-call-observability";
import { createProductTraceRunId, type ScientificTraceCaptureConfiguration } from "../scientific-execution-trace";
import { recordProductErrorBoundary } from "./end-to-end-trace-adapter";
import { activeProjectPreparation, addProjectPreparation, captureProjectPreparation, consumeProjectPreparation,
  preparationCheckpointValid, transitionProjectPreparation } from "./project-preparation-lifecycle";
import { appendFunctionalResetProviderCallRecords, saveFunctionalResetWorkspaceSession, type FunctionalResetSession, type SessionSave } from "./session";
import { preflightWorkingDraftKnowledgeSource } from "../../scientific-thinking/contextual-reasoning-input";
import { recordProjectPreparationTrace } from "./project-preparation-trace";

type Options = {
  enabled: boolean; session: FunctionalResetSession; latest: MutableRefObject<FunctionalResetSession>;
  setSession: Dispatch<SetStateAction<FunctionalResetSession>>;
  save?: SessionSave;
  captureConfiguration: ScientificTraceCaptureConfiguration;
};
/** Coordinates effects only. The persisted session preparation owns every transition. */
export function useProjectPreparation({ enabled, session, latest, setSession, save, captureConfiguration }: Options) {
  const mounted = useRef(true);
  const options = useRef({ save, captureConfiguration });
  options.current = { save, captureConfiguration };
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const update = (sessionId: string, transform: (state: FunctionalResetSession) => FunctionalResetSession) => {
    if (!mounted.current || latest.current.sessionId !== sessionId) return;
    const next = transform(latest.current);
    latest.current = next;
    setSession(next);
  };
  const start = async () => {
    const source = latest.current;
    if (!enabled || activeProjectPreparation(source)) return;
    let preparation: ReturnType<typeof captureProjectPreparation>;
    try { preparation = captureProjectPreparation(source); }
    catch { return; } // UI requires a completed Chat turn before enabling this command.
    if (!preparation.checkpoint || source.workingDraftPreparations?.some(p => p.checkpoint?.preparationId === preparation.checkpoint!.preparationId)) return;
    const id = preparation.checkpoint.preparationId;
    const prepared = addProjectPreparation(source, preparation);
    let preflightFailed = false;
    try { preflightWorkingDraftKnowledgeSource(preparation.checkpoint.request); }
    catch { preflightFailed = true; }
    const beforeDispatch = preflightFailed
      ? transitionProjectPreparation(recordProjectPreparationTrace(prepared, preparation.checkpoint,
        "WORKING_DRAFT_VALIDATION", "FAILED", { code: "WORKING_DRAFT_KNOWLEDGE_SOURCE_INVALID",
          failureFunction: "preflightWorkingDraftKnowledgeSource", failureInvariant: "WORKING_DRAFT_KNOWLEDGE_SOURCE",
          attribution: "ROOT_CAUSE_PROVEN" }), id, "FAILED", "WORKING_DRAFT_KNOWLEDGE_SOURCE_INVALID") : prepared;
    // Publish the captured checkpoint before yielding to async persistence.
    // It prevents duplicate clicks and lets later conversation stay outside
    // this frozen scope; persistence must still succeed before any dispatch.
    update(source.sessionId, () => beforeDispatch);
    if (!(await saveFunctionalResetWorkspaceSession(window.localStorage, beforeDispatch, options.current.save)).scientificPersisted) {
      update(source.sessionId, state => transitionProjectPreparation(recordProjectPreparationTrace(state,
        preparation.checkpoint!, "WORKING_DRAFT_VALIDATION", "FAILED", {
          code: "WORKING_DRAFT_PREPARATION_SAVE_FAILED", failureFunction: "persistFunctionalResetSession",
          failureInvariant: "PRE_DISPATCH_CHECKPOINT_PERSISTED", attribution: "ROOT_CAUSE_PROVEN",
        }), id, "FAILED", "WORKING_DRAFT_PREPARATION_SAVE_FAILED"));
      return;
    }
    if (!mounted.current || latest.current.sessionId !== source.sessionId) return;
    if (preflightFailed) return;
    const records: ProviderCallRecord[] = [];
    let bridgeResponseReceived = false;
    try {
      const response = await requestProtocolDesignerBridge(preparation.checkpoint.request);
      bridgeResponseReceived = true;
      records.push(...response.observability.providerCalls ?? []);
      update(source.sessionId, state => {
        let next = state;
        for (const record of records) next = recordProjectPreparationTrace(next, preparation.checkpoint!,
          "PROVIDER_RESPONSE_RECEIVED", record.status === "FAILED" ? "FAILED" : "SUCCEEDED", {
            code: record.status === "FAILED" ? "PROVIDER_OPERATION_FAILED" : "PROVIDER_OPERATION_SUCCEEDED",
            metadata: { providerCallId: record.callId, invocationId: record.durableFailure?.operationKey ?? null,
              providerHttpStatus: record.durableFailure?.providerHttpStatus ?? null,
              generationProvider: record.durableFailure?.generationProvider ?? null },
            ...(record.status === "FAILED" ? { failureFunction: "providerOperation",
              failureInvariant: "PROVIDER_OPERATION_SUCCEEDED", attribution: record.durableFailure ? "ROOT_CAUSE_PROVEN" as const : "SYMPTOM_ONLY" as const } : {}),
          });
        return consumeProjectPreparation(next, id, response);
      });
    } catch (error) {
      if (error instanceof ProductBridgeClientError) records.push(...error.observability?.providerCalls ?? []);
      const durableFailure = [...records].reverse().find(record => record.status === "FAILED" && record.durableFailure)?.durableFailure;
      const knownProviderFailure = durableFailure?.bodyRead && ["incomplete", "failed"].includes(durableFailure.providerResponseStatus ?? "");
      // A lost browser response does not determine the durable operation's
      // outcome. Only the existing bound recovery read may resolve it.
      const responseUnverified = !(error instanceof ProductBridgeClientError) && !bridgeResponseReceived;
      const code = durableFailure?.providerResponseStatus === "incomplete"
        ? durableFailure.incompleteReason === "max_output_tokens"
          ? "WORKING_DRAFT_INCOMPLETE_MAX_OUTPUT_TOKENS" : "WORKING_DRAFT_PROVIDER_INCOMPLETE"
        : error instanceof ProductBridgeClientError ? error.preparationFailureCode ?? error.code
          : responseUnverified ? "WORKING_DRAFT_RESPONSE_UNVERIFIED" : "WORKING_DRAFT_FAILED";
      const unknown = responseUnverified || !knownProviderFailure && (code.includes("UNKNOWN_AFTER_DISPATCH") || code.includes("TIMEOUT") || code.includes("NETWORK_FAILURE")
        || ["UNKNOWN_AFTER_DISPATCH", "COUNT_UNKNOWN_AFTER_DISPATCH"].includes(durableFailure?.lastConfirmedDurableState ?? "")
        || records.some(record => record.status === "FAILED" && ["TIMEOUT", "NETWORK_FAILURE"].includes(record.failureReason ?? "")));
      update(source.sessionId, state => {
        let next = transitionProjectPreparation(state, id, unknown ? "UNKNOWN/INTERRUPTED" : "FAILED", code);
        const collision = error instanceof ProductBridgeClientError && code === "WORKING_DRAFT_EXPLICIT_DECISION_HIDDEN_BY_ARBITRATION"
          ? error.preparationFailureDiagnostic : null;
        if (collision) next = recordProjectPreparationTrace(next, preparation.checkpoint!, "WORKING_DRAFT_VALIDATION", "FAILED", {
          code, failureFunction: "acceptWorkingDraftUpdate", failureInvariant: "EXPLICIT_DECISION_REVIEW_COVERAGE",
          attribution: "ROOT_CAUSE_PROVEN", metadata: { errorSubtype: "ARBITRATION_HIDES_EXPLICIT_DECISION",
            explicitDecisionId: collision.explicitDecisionId, arbitrationId: collision.arbitrationId,
            atomBindingStatus: collision.atomBindingStatus },
        });
        if (responseUnverified) next = recordProjectPreparationTrace(next, preparation.checkpoint!,
          "CLIENT_RESPONSE_CONSUMED", "UNKNOWN", { code: "CLIENT_RESPONSE_NOT_CONSUMED",
            metadata: { boundedStatus: "SERVER_OUTCOME_UNVERIFIED" } });
        for (const record of records) {
          const received = record.durableFailure?.providerHttpStatus === 200
            && record.durableFailure.providerResponseStatus === "incomplete"
            && record.durableFailure.headersReceived === true && record.durableFailure.bodyRead === true;
          next = recordProjectPreparationTrace(next, preparation.checkpoint!,
          "PROVIDER_RESPONSE_RECEIVED", received || record.status === "SUCCEEDED" ? "SUCCEEDED" : "FAILED", {
            code: received ? "PROVIDER_RESPONSE_RECEIVED" : record.status === "FAILED" ? "PROVIDER_OPERATION_FAILED" : "PROVIDER_OPERATION_SUCCEEDED",
            metadata: { providerCallId: record.callId, invocationId: record.durableFailure?.operationKey ?? null,
              providerHttpStatus: record.durableFailure?.providerHttpStatus ?? null,
              generationProvider: record.durableFailure?.generationProvider ?? null },
            ...(!received && record.status === "FAILED" ? { failureFunction: "providerOperation",
              failureInvariant: "PROVIDER_OPERATION_SUCCEEDED", attribution: record.durableFailure ? "ROOT_CAUSE_PROVEN" as const : "SYMPTOM_ONLY" as const } : {}),
          });
        }
        if (error instanceof ProductBridgeClientError && code === "STUDY_PROPOSAL_OPTION_BINDING_INVALID") {
          const binding = error.optionBindingFailureDiagnostic;
          next = recordProjectPreparationTrace(next, preparation.checkpoint!, "WORKING_DRAFT_VALIDATION", "FAILED", {
            code, failureFunction: "assertStudyProposalOptionBindings", failureInvariant: binding?.missingAtomRef
              ? "EVERY_OPTION_ATOM_REF_RESOLVES" : "STUDY_PROPOSAL_OPTION_BINDINGS_VALID",
            attribution: binding ? "ROOT_CAUSE_PROVEN" : "SYMPTOM_ONLY", metadata: {
              errorCode: code, arbitrationId: binding?.arbitrationId ?? null, optionId: binding?.optionId ?? null,
              missingAtomRef: binding?.missingAtomRef ?? null, recommended: binding?.recommended ?? null,
              humanSelected: binding?.humanSelected ?? null, referenceOrigin: binding?.referenceOrigin ?? "UNKNOWN",
            },
          });
        }
        if (knownProviderFailure && durableFailure?.providerResponseStatus === "incomplete")
          next = recordProjectPreparationTrace(next, preparation.checkpoint!, "PROVIDER_RESULT_VALIDATION", "FAILED", {
            code, failureFunction: "callOpenAIResponses", failureInvariant: "PROVIDER_RESULT_COMPLETED",
            attribution: "ROOT_CAUSE_PROVEN", metadata: {
              providerHttpStatus: durableFailure.providerHttpStatus, providerResponseStatus: "incomplete",
              incompleteReason: durableFailure.incompleteReason, financialSettlement:
                ["INCOMPLETE_CONTENT_FILTERED", "INCOMPLETE_MAX_OUTPUT_TOKENS", "INCOMPLETE_OTHER"]
                  .includes(durableFailure.lastConfirmedDurableState) ? "SETTLED" : "UNSETTLED",
              productResult: "UNUSABLE",
            },
          });
        if (code === "PUBLIC_SESSION_BUDGET_CLOSED" || code === "PUBLIC_SESSION_BUDGET_REJECTED")
          next = recordProjectPreparationTrace(next, preparation.checkpoint!, "ADMISSION_REJECTED", "FAILED", {
            code, failureFunction: "durableProviderAdmission", failureInvariant: "SESSION_BUDGET_ACCEPTED",
            attribution: "ROOT_CAUSE_PROVEN" });
        if (durableFailure) try {
          next = { ...next, scientificExecutionTraceLedger: recordProductErrorBoundary({
            ledger: next.scientificExecutionTraceLedger, traceRunId: createProductTraceRunId(source.sessionId, preparation.sourceTurnRef),
            turnId: preparation.sourceTurnRef, conversationId: source.conversationId,
            startedAt: preparation.checkpoint!.capturedAt, failedAt: new Date().toISOString(),
            owner: "CONVERSATION_MODEL", responsibilityOwner: "DURABLE_PROVIDER_GUARD", executor: "POSTGRES_DURABLE_PROVIDER_GUARD",
            componentId: "WORKING_DRAFT_PROVIDER_OPERATION", componentVersion: "1.0.0", provider: durableFailure.generationProvider,
            code: durableFailure.structuredErrorCode ?? code, category: "OWNER_RUNTIME", project: source.project,
            durableFailure, captureConfiguration: options.current.captureConfiguration,
          }) };
        } catch { /* Trace capture is observational. */ }
        return next;
      });
    } finally {
      update(source.sessionId, state => appendFunctionalResetProviderCallRecords(state, { turnId: preparation.sourceTurnRef,
        traceRunId: createProductTraceRunId(source.sessionId, preparation.sourceTurnRef), requestKind: "USER_TURN", records }));
    }
  };
  const updateRef = useRef(update); updateRef.current = update;
  const active = activeProjectPreparation(session);
  const recoveryKey = active?.status === "UNKNOWN/INTERRUPTED" ? active.checkpoint?.preparationId ?? null : null;
  useEffect(() => {
    if (!enabled) return;
    const initial = latest.current;
    const preparation = activeProjectPreparation(initial);
    if (!preparation?.checkpoint || !preparation.recovery) return;
    const id = preparation.checkpoint.preparationId;
    if (!preparationCheckpointValid(initial, preparation.checkpoint)) {
      updateRef.current(initial.sessionId, s => transitionProjectPreparation(recordProjectPreparationTrace(s,
        preparation.checkpoint!, "WORKING_DRAFT_VALIDATION", "FAILED", {
          code: "PREPARATION_CHECKPOINT_MISMATCH", failureFunction: "preparationCheckpointValid",
          failureInvariant: "IMMUTABLE_PREPARATION_CHECKPOINT", attribution: "ROOT_CAUSE_PROVEN",
        }), id, "FAILED", "PREPARATION_CHECKPOINT_MISMATCH"));
      return;
    }
    const controller = new AbortController();
    let alive = true;
    const read = async () => {
      updateRef.current(initial.sessionId, state => recordProjectPreparationTrace(state, preparation.checkpoint!,
        "DURABLE_RECOVERY_STARTED", "STARTED", { code: "BOUND_PREPARATION_RECOVERY_READ" }));
      // This is bounded observation of an existing operation, never an execution retry.
      for (let poll = 0; poll < 150 && alive; poll += 1) {
        if (latest.current.sessionId !== initial.sessionId
          || latest.current.workingDraftPreparations?.find(p => p.checkpoint?.preparationId === id)?.decision !== "PENDING") return;
        const result = await readWorkingDraftPreparation({ sessionId: initial.sessionId, clientRequestId: id,
          sourceTurnRef: preparation.sourceTurnRef, sourceResponseRef: preparation.recovery!.sourceResponseRef,
          compositionResponseRef: preparation.recovery!.compositionResponseRef }, controller.signal);
        if (!alive) return;
        if (result.state === "IN_PROGRESS") {
          await new Promise<void>(resolve => window.setTimeout(resolve, 2000));
          continue;
        }
        updateRef.current(initial.sessionId, state => {
          const observed = recordProjectPreparationTrace(state, preparation.checkpoint!, "DURABLE_RECOVERY_COMPLETED",
            result.state === "COMPLETED" ? "SUCCEEDED" : result.state === "FAILED" ? "FAILED" : "UNKNOWN", {
              code: result.state === "COMPLETED" ? "DURABLE_OPERATION_COMPLETED"
                : result.state === "FAILED" ? "DURABLE_OPERATION_FAILED" : "DURABLE_OPERATION_UNKNOWN",
              ...(result.state === "FAILED" ? { failureFunction: "readWorkingDraftPreparation",
                failureInvariant: "DURABLE_OPERATION_SUCCEEDED", attribution: "SYMPTOM_ONLY" as const } : {}),
            });
          return result.state === "COMPLETED"
            ? consumeProjectPreparation(observed, id, result.result, "DURABLE_RECOVERY")
            : transitionProjectPreparation(observed, id, result.state === "FAILED" ? "FAILED" : "UNKNOWN/INTERRUPTED",
              result.state === "FAILED" ? result.errorCode : "WORKING_DRAFT_RECOVERY_UNKNOWN");
        });
        return;
      }
      if (alive) updateRef.current(initial.sessionId, s => transitionProjectPreparation(s, id, "UNKNOWN/INTERRUPTED", "WORKING_DRAFT_RECOVERY_OBSERVATION_ENDED"));
    };
    void read().catch(error => {
      if (alive) updateRef.current(initial.sessionId, s => transitionProjectPreparation(s, id, "UNKNOWN/INTERRUPTED",
        error instanceof ProductBridgeClientError ? error.code : "WORKING_DRAFT_RECOVERY_UNAVAILABLE"));
    });
    return () => { alive = false; controller.abort(); };
  }, [enabled, session.sessionId, latest, recoveryKey]);
  return { start, busy: activeProjectPreparation(session)?.status === "PREPARING" };
}
