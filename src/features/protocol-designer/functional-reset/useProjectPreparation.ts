import { useEffect, useRef, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { ProductBridgeClientError, readWorkingDraftPreparation, requestProtocolDesignerBridge } from "../product-bridge-client";
import type { ProviderCallRecord } from "../provider-call-observability";
import { createProductTraceRunId, type ScientificTraceCaptureConfiguration } from "../scientific-execution-trace";
import { recordProductErrorBoundary } from "./end-to-end-trace-adapter";
import { activeProjectPreparation, addProjectPreparation, captureProjectPreparation, consumeProjectPreparation,
  preparationCheckpointValid, transitionProjectPreparation } from "./project-preparation-lifecycle";
import { appendFunctionalResetProviderCallRecords, persistFunctionalResetSession, type FunctionalResetSession } from "./session";

type Options = {
  enabled: boolean; session: FunctionalResetSession; latest: MutableRefObject<FunctionalResetSession>;
  setSession: Dispatch<SetStateAction<FunctionalResetSession>>;
  save?: (session: FunctionalResetSession) => boolean | void;
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
    try {
      if (options.current.save) {
        if (options.current.save(prepared) === false) throw new Error("SAVE_FAILED");
      } else persistFunctionalResetSession(window.localStorage, prepared);
    } catch {
      update(source.sessionId, () => transitionProjectPreparation(prepared, id, "FAILED", "WORKING_DRAFT_PREPARATION_SAVE_FAILED"));
      return;
    }
    update(source.sessionId, () => prepared);
    const records: ProviderCallRecord[] = [];
    try {
      const response = await requestProtocolDesignerBridge(preparation.checkpoint.request);
      records.push(...response.observability.providerCalls ?? []);
      update(source.sessionId, state => consumeProjectPreparation(state, id, response));
    } catch (error) {
      if (error instanceof ProductBridgeClientError) records.push(...error.observability?.providerCalls ?? []);
      const durableFailure = [...records].reverse().find(record => record.status === "FAILED" && record.durableFailure)?.durableFailure;
      const knownProviderFailure = durableFailure?.bodyRead && ["incomplete", "failed"].includes(durableFailure.providerResponseStatus ?? "");
      const code = durableFailure?.providerResponseStatus === "incomplete" && durableFailure.incompleteReason === "max_output_tokens"
        ? "WORKING_DRAFT_INCOMPLETE_MAX_OUTPUT_TOKENS" : error instanceof ProductBridgeClientError ? error.preparationFailureCode ?? error.code : "WORKING_DRAFT_FAILED";
      const unknown = !knownProviderFailure && (code.includes("UNKNOWN_AFTER_DISPATCH") || code.includes("TIMEOUT") || code.includes("NETWORK_FAILURE")
        || ["UNKNOWN_AFTER_DISPATCH", "COUNT_UNKNOWN_AFTER_DISPATCH"].includes(durableFailure?.lastConfirmedDurableState ?? "")
        || records.some(record => record.status === "FAILED" && ["TIMEOUT", "NETWORK_FAILURE"].includes(record.failureReason ?? "")));
      update(source.sessionId, state => {
        let next = transitionProjectPreparation(state, id, unknown ? "UNKNOWN/INTERRUPTED" : "FAILED", code);
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
  useEffect(() => {
    if (!enabled) return;
    const initial = latest.current;
    const preparation = activeProjectPreparation(initial);
    if (!preparation?.checkpoint || !preparation.recovery) return;
    const id = preparation.checkpoint.preparationId;
    if (!preparationCheckpointValid(initial, preparation.checkpoint)) {
      updateRef.current(initial.sessionId, s => transitionProjectPreparation(s, id, "FAILED", "PREPARATION_CHECKPOINT_MISMATCH"));
      return;
    }
    const controller = new AbortController();
    let alive = true;
    const read = async () => {
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
        updateRef.current(initial.sessionId, state => result.state === "COMPLETED"
          ? consumeProjectPreparation(state, id, result.result)
          : transitionProjectPreparation(state, id, result.state === "FAILED" ? "FAILED" : "UNKNOWN/INTERRUPTED",
            result.state === "FAILED" ? result.errorCode : "WORKING_DRAFT_RECOVERY_UNKNOWN"));
        return;
      }
      if (alive) updateRef.current(initial.sessionId, s => transitionProjectPreparation(s, id, "UNKNOWN/INTERRUPTED", "WORKING_DRAFT_RECOVERY_OBSERVATION_ENDED"));
    };
    void read().catch(error => {
      if (alive) updateRef.current(initial.sessionId, s => transitionProjectPreparation(s, id, "UNKNOWN/INTERRUPTED",
        error instanceof ProductBridgeClientError ? error.code : "WORKING_DRAFT_RECOVERY_UNAVAILABLE"));
    });
    return () => { alive = false; controller.abort(); };
  }, [enabled, session.sessionId, latest]);
  return { start, busy: activeProjectPreparation(session)?.status === "PREPARING" };
}
