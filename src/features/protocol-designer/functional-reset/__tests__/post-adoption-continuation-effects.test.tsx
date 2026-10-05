import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { confirmResearchProjectContribution } from "@/features/research-project-construction";
import { buildFunctionalResetQueryNavigation } from "@/features/query-navigation";
import type { ProductBridgeRequest, ProductBridgeResponse } from "../../product-bridge";
import { createFunctionalResetSession } from "../session";
import { resolvePostAdoptionContinuationJob, type PostAdoptionContinuationJob, type PostAdoptionContinuationResult } from "../post-adoption-continuation";
import { projectContinuationBridgeTrace } from "../bridge-trace-projection";
import { captureProductBridgeTraceText } from "../../scientific-execution-trace";
import { projectHumanDecisionForBridgeTrace, type ProductBridgeTrace } from "../session";
import { usePostAdoptionContinuation } from "../usePostAdoptionContinuation";
import { COLCHICINE_INITIAL, makeFunctionalResetContribution, makeGovernedPostAdoptionResponse } from "./functional-reset-fixtures";

const bridge = vi.hoisted(() => vi.fn());
vi.mock("../../product-bridge-client", async original => ({ ...await original<object>(), requestProtocolDesignerBridge: bridge }));
afterEach(() => { cleanup(); bridge.mockReset(); vi.unstubAllGlobals(); });

// CURRENT_STRUCTURAL_INVARIANT: cleanup prevents all component callbacks;
// the existing scientific fixture supplies a legitimate governed QRY question.
it("does not apply, persist or redispatch a delayed bridge response after unmount", async () => {
  const network = vi.fn(() => { throw new Error("REAL_PROVIDER_FORBIDDEN"); });
  vi.stubGlobal("fetch", network);
  const session = createFunctionalResetSession("2026-10-05T12:00:00.000Z");
  const userTurn = { turnId: "continuation-user", role: "USER" as const, content: COLCHICINE_INITIAL, createdAt: session.createdAt };
  const project = confirmResearchProjectContribution({ contribution: makeFunctionalResetContribution([userTurn]), current: null,
    projectId: session.projectId, authority: session.projectAuthority, confirmedAt: session.createdAt });
  const queryNavigation = buildFunctionalResetQueryNavigation({ project, previous: null, recordedAt: session.updatedAt });
  const job: PostAdoptionContinuationJob = { sessionId: session.sessionId, conversationId: session.conversationId, project, queryNavigation,
    ownerResultLedger: session.knowledgeOwnerLedger, scientificExecutionTraceLedger: session.scientificExecutionTraceLedger,
    runtimeTurns: [userTurn], feedback: "Préparer la prochaine question utile.", traceRunId: null };
  let resolve!: (response: ProductBridgeResponse) => void;
  const deferred = new Promise<ProductBridgeResponse>(done => { resolve = done; });
  bridge.mockReturnValue(deferred);
  const setSession = vi.fn(), setBusy = vi.fn(), setPostAdoptionContinuationJob = vi.fn();
  const view = renderHook(() => usePostAdoptionContinuation({ postAdoptionContinuationJob: job, setSession, setBusy, setPostAdoptionContinuationJob }));
  await waitFor(() => expect(bridge).toHaveBeenCalledTimes(1));
  const request = bridge.mock.calls[0][0] as ProductBridgeRequest;
  expect(request.requestKind).toBe("POST_ADOPTION_QRY_CONTINUATION");
  expect(request.evaluatePersistentDelta).toBe(false);
  view.unmount();
  await act(async () => { resolve(makeGovernedPostAdoptionResponse(request)); await deferred; });
  expect(setSession).not.toHaveBeenCalled();
  expect(setBusy).not.toHaveBeenCalled();
  expect(setPostAdoptionContinuationJob).not.toHaveBeenCalled();
  expect(bridge).toHaveBeenCalledTimes(1);
  expect(network).not.toHaveBeenCalled();
});

// CURRENT_STRUCTURAL_INVARIANT: frozen field-presence/identity/capture oracle.
// No scientific assertion is replaced by this boundary equivalence test.
const beforeContinuation = (job: PostAdoptionContinuationJob, continuation: PostAdoptionContinuationResult): ProductBridgeTrace => ({
          turnId: continuation.turn.turnId,
          traceRunId: continuation.kind !== "QUESTION"
            ? continuation.kind === "KNOWLEDGE" ? continuation.traceRunId ?? undefined : continuation.interaction.traceRunId ?? undefined
            : job.traceRunId ?? undefined,
          requestKind: "POST_ADOPTION_QRY_CONTINUATION" as const,
          raw: captureProductBridgeTraceText({ value: job.feedback, field: "SOURCE_TEXT" }),
          assistantReply: captureProductBridgeTraceText({ value: continuation.content, field: "ASSISTANT_REPLY" }),
          persistentExtractionCalled: false,
          persistentExtractionStatus: "NOT_REQUESTED" as const,
          providerArtifact: null,
          wireCandidate: null,
          persistentCandidate: null,
          deterministicValidation: null,
          projectChangeSetCandidate: null,
          canonicalProjectChangeSetCandidate: null,
          humanReviewProjection: null,
          humanDecision: projectHumanDecisionForBridgeTrace(job.project.confirmationDecision),
          projectVersionBefore: job.project.versionId,
          projectVersionAfter: job.project.versionId,
          qryNeedBefore: null,
          qryNeedAfter: (continuation.kind === "STUDY_DESIGN" ? continuation.navigation : job.queryNavigation).currentAction?.navigationNeedRefs[0] ?? null,
          provider: continuation.provider,
          model: continuation.model,
          conversationLatencyMs: continuation.latencyMs,
          extractionLatencyMs: null,
          calls: continuation.calls,
          continuationPresentationSource: continuation.presentationSource,
          continuationMediationFailure: continuation.mediationFailure,
        });

it("preserves continuation projection, decision binding and absent/null TRACE metadata", async () => {
  const session = createFunctionalResetSession("2026-10-05T12:00:00.000Z");
  const userTurn = { turnId: "continuation-user", role: "USER" as const, content: COLCHICINE_INITIAL, createdAt: session.createdAt };
  const project = confirmResearchProjectContribution({ contribution: makeFunctionalResetContribution([userTurn]), current: null,
    projectId: session.projectId, authority: session.projectAuthority, confirmedAt: session.createdAt });
  const queryNavigation = buildFunctionalResetQueryNavigation({ project, previous: null, recordedAt: session.updatedAt });
  bridge.mockImplementation(async (request: ProductBridgeRequest) => makeGovernedPostAdoptionResponse(request));
  for (const traceRunId of [null, "continuation-trace"]) {
    const job: PostAdoptionContinuationJob = { sessionId: session.sessionId, conversationId: session.conversationId, project, queryNavigation,
      ownerResultLedger: session.knowledgeOwnerLedger, scientificExecutionTraceLedger: session.scientificExecutionTraceLedger,
      runtimeTurns: [userTurn], feedback: "Préparer la prochaine question utile.", traceRunId };
    const continuation = await resolvePostAdoptionContinuationJob(job, () => {});
    if (!continuation) throw new Error("EXPECTED_EXISTING_CONTINUATION");
    const projected = projectContinuationBridgeTrace(job, continuation);
    expect(projected).toStrictEqual(beforeContinuation(job, continuation));
    expect(projected.humanDecision).toStrictEqual(projectHumanDecisionForBridgeTrace(project.confirmationDecision));
    expect(projected.traceRunId).toBe(traceRunId ?? undefined);
    expect(projected).not.toHaveProperty("conversationFailure");
    expect(projected.projectWriteCount).toBeUndefined();
  }
});
