import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { confirmResearchProjectContribution } from "@/features/research-project-construction";
import { buildFunctionalResetQueryNavigation } from "@/features/query-navigation";
import type { ProductBridgeRequest, ProductBridgeResponse } from "../../product-bridge";
import { createFunctionalResetSession } from "../session";
import type { PostAdoptionContinuationJob } from "../post-adoption-continuation";
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
