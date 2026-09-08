import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import {
  languageGatewayContextBoundary,
  type LanguageProjectionRequest,
  type LanguageProjectionResponse,
} from "@/features/protocol-designer/conversation-language-gateway";
import { ProductBridgeClientError } from "@/features/protocol-designer/product-bridge-client";
import type { ProductBridgeRequest, ProductBridgeResponse } from "@/features/protocol-designer/product-bridge";
import { FUNCTIONAL_RESET_STORAGE_KEY, type FunctionalResetSession } from "../session";
import {
  COLCHICINE_03A_INITIAL,
  makeFunctionalResetBridgeResponse,
  makeFunctionalResetContribution,
} from "./functional-reset-fixtures";

const runtime = vi.hoisted(() => ({ bridge: vi.fn(), language: vi.fn(), reviewFails: false }));
vi.mock("../ContributionReview", async (importOriginal) => {
  const original = await importOriginal<typeof import("../ContributionReview")>();
  return { ...original, default: (props: Parameters<typeof original.default>[0]) => {
    if (runtime.reviewFails) throw new Error("TEST_WORKSPACE_REVIEW_RENDER_FAILURE");
    return <original.default {...props} />;
  } };
});
vi.mock("@/features/protocol-designer/product-bridge-client", () => ({
  ProductBridgeClientError: class ProductBridgeClientError extends Error {
    constructor(readonly code: string, message: string, readonly diagnostic: unknown = null) { super(message); }
  },
  requestProtocolDesignerBridge: runtime.bridge,
  requestConversationLanguageProjection: runtime.language,
}));

const ENGLISH_SOURCE = "We want to build a multicenter study comparing colchicine with placebo after myocardial infarction. We want to assess inflammation and myocardial lesions with cardiac MRI.";
const ENGLISH_VISIBLE = "The proposed working structure is available separately for your review. No Project has been adopted.";
const MODIFICATION = "Je veux compléter cette étude : l’âge maximal sera de 75 ans et l’IRM sera réalisée entre J3 et J5.";
const NO_NETWORK = vi.fn(() => { throw new Error("PASS3A_UI_LIFECYCLE_NETWORK_FORBIDDEN"); });
const stored = (): FunctionalResetSession => JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!);
const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
const submit = (content: string) => {
  fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: content } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
};

// Explicit local fixture of an already validated extraction; no live output,
// no extraction execution, and no claim that a provider produced these objects.
const validatedResponse = (request: ProductBridgeRequest): ProductBridgeResponse => {
  const userTurns = request.conversation.turns.filter((turn) => turn.role === "USER");
  const contribution = makeFunctionalResetContribution(userTurns);
  contribution.source.conversationId = request.conversation.conversationId;
  contribution.runtimeEvidence.provider = "TEST_FIXTURE_NO_PROVIDER_CALL";
  const response = makeFunctionalResetBridgeResponse(request.conversation.turns, contribution);
  return {
    ...response,
    persistentExtraction: {
      ...response.persistentExtraction,
      validation: {
        valid: true, blocks: [], noOps: [], normalizations: [],
        acceptedChanges: [], acceptedRelations: [], acceptedTemporalQualifications: [], acceptedExpectedVariableOccasions: [],
      },
    },
  };
};

const languageResponse = (request: LanguageProjectionRequest): LanguageProjectionResponse => {
  const translatedText = request.projectionKind === "INPUT_TO_FRENCH" ? COLCHICINE_03A_INITIAL : ENGLISH_VISIBLE;
  const contextBoundary = languageGatewayContextBoundary({ sourceText: request.sourceText, protectedOpaqueLiterals: request.protectedOpaqueLiterals ?? [] });
  return {
    apiVersion: "1.0.0", operation: "LANGUAGE_PROJECTION",
    projection: {
      contract: "CONVERSATION_LANGUAGE_PROJECTION", contractVersion: "1.4.0",
      projectionId: `local-fixture-projection:${request.projectionIdentityDigest}`,
      projectionKind: request.projectionKind,
      sourceTextDigest: logicalDigest(request.sourceText),
      sourceLanguage: request.sourceLanguageHint.toLowerCase(), targetLanguage: request.targetLanguage.toLowerCase(),
      translatedText, translatedTextDigest: logicalDigest(translatedText), translatedTextLanguage: request.targetLanguage.toLowerCase(),
      providerResultDigest: logicalDigest({ translatedText, projectionKind: request.projectionKind }),
      status: "SUCCEEDED", supportStatus: "SUPPORTED", qualificationStatus: "QUALIFIED",
      provider: "OPENAI", model: "gpt-5.6-luna", providerResponseId: `local-fixture:${request.projectionKind}`,
      reasoningEffort: "low", usage: { input_tokens: 100, output_tokens: 30, reasoning_tokens: 8, cached_tokens: 0 },
      contextBoundary, providerCalls: 1, translationContractVersion: "1.4.0",
      ambiguityPreserved: true, limitations: [], invariants: [],
      createdAt: "2026-09-08T12:00:00.000Z", projectWriteAuthorized: false, scientificDecisionAuthorized: false,
    },
    observability: {
      provider: "OPENAI", model: "gpt-5.6-luna", reasoningEffort: "low",
      providerResponseId: `local-fixture:${request.projectionKind}`,
      usage: { input_tokens: 100, output_tokens: 30, reasoning_tokens: 8, cached_tokens: 0 },
      contextBoundary, calls: 1, latencyMs: 1,
    },
  };
};

const expectNonAdopted = (state: FunctionalResetSession) => {
  expect(state.project).toBeNull();
  for (const retained of state.retainedContributionCandidates ?? []) {
    expect(retained.candidate.projectWriteAuthorized).toBe(false);
    expect(retained.contribution.epistemicBoundary.candidateIsAdopted).toBe(false);
    expect(retained.humanDecision).toBeNull();
    expect(retained.baseProject).toBeNull();
    const source = state.runtimeTurns.find((turn) => turn.turnId === retained.sourceTurnRef);
    expect(source?.role).toBe("USER");
    expect(retained.sourceDigest).toBe(logicalDigest(source!.content));
  }
  expect(NO_NETWORK).not.toHaveBeenCalled();
};

describe("PASS3A — candidate survival across real Workspace consumer boundaries", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/protocol-designer/demo?traceCaptureLevel=LEVEL_2_DIAGNOSTIC");
    window.localStorage.clear();
    runtime.bridge.mockReset();
    runtime.language.mockReset();
    runtime.reviewFails = false;
    NO_NETWORK.mockClear();
    vi.stubGlobal("fetch", NO_NETWORK);
    runtime.bridge.mockImplementation(async (request: ProductBridgeRequest) => validatedResponse(request));
    runtime.language.mockImplementation(async (request: LanguageProjectionRequest) => languageResponse(request));
    vi.spyOn(console, "debug").mockImplementation(() => undefined);
  });
  afterEach(() => { cleanup(); expect(NO_NETWORK).not.toHaveBeenCalled(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("successful HOW and presentation records PRESENTED without adopting the Project", async () => {
    renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    await screen.findByTestId("functional-contribution-review");
    await waitFor(() => expect(stored().retainedContributionCandidates?.[0].downstreamState).toBe("PRESENTED"));
    const state = stored();
    expect(state.retainedContributionCandidates).toHaveLength(1);
    expect(state.retainedContributionCandidates![0]).toMatchObject({ presentedAt: expect.any(String), failure: null });
    expect(state.entries.filter((entry) => entry.kind === "REVIEW")).toHaveLength(1);
    expect(state.pendingContribution?.identity.contributionId).toBe(state.retainedContributionCandidates![0].candidateRef);
    expect(runtime.bridge).toHaveBeenCalledTimes(1);
    expect(runtime.language).not.toHaveBeenCalled();
    expectNonAdopted(state);
  });

  it("a real review render failure retains the unseen candidate and never remounts it automatically", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    runtime.reviewFails = true;
    renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    await waitFor(() => expect(stored().retainedContributionCandidates?.[0].downstreamState).toBe("DOWNSTREAM_FAILED_NOT_PRESENTED"));
    const state = stored();
    expect(state.retainedContributionCandidates![0]).toMatchObject({ presentedAt: null,
      failure: { stage: "PRESENTATION", code: "CONTRIBUTION_REVIEW_PRESENTATION_FAILED" } });
    expect(state.scientificExecutionTraceLedger.events.some((event) => event.common?.stage === "HUMAN_REVIEW_PRESENTED")).toBe(false);
    expect(state.pendingContribution).toBeNull();
    expect(state.entries.filter((entry) => entry.kind === "REVIEW")).toHaveLength(1);
    expectNonAdopted(state);
    cleanup();
    runtime.reviewFails = false;
    renderDemo();
    await Promise.resolve();
    expect(screen.queryByTestId("functional-contribution-review")).not.toBeInTheDocument();
    expect(stored().retainedContributionCandidates).toEqual(state.retainedContributionCandidates);
    expect(runtime.bridge).toHaveBeenCalledTimes(1);
    expect(runtime.language).not.toHaveBeenCalled();
  });

  it("HOW failure partial receipt retains the validated candidate unseen and creates no Human Review", async () => {
    runtime.bridge.mockImplementation(async (request: ProductBridgeRequest): Promise<ProductBridgeResponse> => ({
      ...validatedResponse(request), assistantReply: "",
      conversationFailure: { stage: "HOW", code: "CONVERSATION_PROVIDER_FAILURE", message: "La formulation n’a pas abouti.", provider: null },
    }));
    renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    await waitFor(() => expect(stored().retainedContributionCandidates?.[0].downstreamState).toBe("DOWNSTREAM_FAILED_NOT_PRESENTED"));
    const state = stored();
    expect(state.retainedContributionCandidates![0]).toMatchObject({ presentedAt: null, failure: { stage: "HOW", code: "CONVERSATION_PROVIDER_FAILURE" } });
    expect(state.pendingContribution).toBeNull();
    expect(state.entries.filter((entry) => entry.kind === "REVIEW")).toHaveLength(0);
    expect(screen.queryByTestId("functional-contribution-review")).toBeNull();
    const stages = state.scientificExecutionTraceLedger.events.map((event) => event.common?.stage ?? event.eventType);
    expect(stages.indexOf("PROJECT_CANDIDATE_VALIDATED")).toBeGreaterThanOrEqual(0);
    expect(stages.indexOf("PROJECT_CANDIDATE_VALIDATED")).toBeLessThan(stages.indexOf("ERROR_BOUNDARY"));
    expect(runtime.bridge).toHaveBeenCalledTimes(1);
    expect(runtime.language).not.toHaveBeenCalled();
    expectNonAdopted(state);
  });

  it("localization failure after successful HOW retains the exact original source and no presented candidate", async () => {
    runtime.language.mockImplementation(async (request: LanguageProjectionRequest) => {
      if (request.projectionKind === "OUTPUT_FROM_FRENCH") throw new ProductBridgeClientError("LANGUAGE_PROJECTION_PROVIDER_FAILURE", "La projection linguistique n’a pas abouti.");
      return languageResponse(request);
    });
    renderDemo();
    submit(ENGLISH_SOURCE);
    await waitFor(() => expect(stored().retainedContributionCandidates?.[0].downstreamState).toBe("DOWNSTREAM_FAILED_NOT_PRESENTED"));
    const state = stored();
    const retained = state.retainedContributionCandidates![0];
    expect(retained).toMatchObject({ presentedAt: null, sourceDigest: logicalDigest(ENGLISH_SOURCE), failure: { stage: "LOCALIZATION", code: "LANGUAGE_PROJECTION_PROVIDER_FAILURE" } });
    expect(state.pendingContribution).toBeNull();
    expect(state.entries.filter((entry) => entry.kind === "REVIEW")).toHaveLength(0);
    expect(screen.queryByTestId("functional-contribution-review")).toBeNull();
    const stages = state.scientificExecutionTraceLedger.events.map((event) => event.common?.stage ?? event.eventType);
    expect(stages.indexOf("PROJECT_CANDIDATE_VALIDATED")).toBeGreaterThanOrEqual(0);
    expect(stages.indexOf("PROJECT_CANDIDATE_VALIDATED")).toBeLessThan(stages.indexOf("LANGUAGE_PROJECTION_FAILED"));
    expect(stages.indexOf("LANGUAGE_PROJECTION_FAILED")).toBeLessThan(stages.indexOf("ERROR_BOUNDARY"));
    expect(runtime.bridge).toHaveBeenCalledTimes(1);
    expect(runtime.language).toHaveBeenCalledTimes(2);
    expect(runtime.language.mock.calls.map(([request]) => request.projectionKind)).toEqual(["INPUT_TO_FRENCH", "OUTPUT_FROM_FRENCH"]);
    expectNonAdopted(state);
  });

  it("an older presented pending candidate survives a newer HOW failure without a fabricated replacement", async () => {
    runtime.bridge.mockImplementation(async (request: ProductBridgeRequest): Promise<ProductBridgeResponse> => {
      const response = validatedResponse(request);
      return request.conversation.turns.filter((turn) => turn.role === "USER").length === 1 ? response : {
        ...response, assistantReply: "",
        conversationFailure: { stage: "HOW", code: "SECOND_TURN_HOW_FAILURE", message: "La nouvelle formulation n’a pas abouti.", provider: null },
      };
    });
    renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    await screen.findByTestId("functional-contribution-review");
    await waitFor(() => expect(stored().retainedContributionCandidates).toHaveLength(1));
    const before = stored();
    const oldCandidate = JSON.stringify(before.retainedContributionCandidates![0]);
    const oldReview = before.entries.find((entry) => entry.kind === "REVIEW")!;
    const oldPending = JSON.stringify(before.pendingContribution);
    submit(MODIFICATION);
    await waitFor(() => expect(stored().retainedContributionCandidates).toHaveLength(2));
    await waitFor(() => expect(stored().retainedContributionCandidates![1].downstreamState).toBe("DOWNSTREAM_FAILED_NOT_PRESENTED"));
    const after = stored();
    expect(JSON.stringify(after.retainedContributionCandidates![0])).toBe(oldCandidate);
    expect(after.entries.find((entry) => entry.entryId === oldReview.entryId)).toEqual(oldReview);
    expect(JSON.stringify(after.pendingContribution)).toBe(oldPending);
    expect(after.entries.filter((entry) => entry.kind === "REVIEW")).toHaveLength(1);
    expect(screen.getAllByTestId("functional-contribution-review")).toHaveLength(1);
    expect(after.retainedContributionCandidates![1]).toMatchObject({ presentedAt: null, humanDecision: null, actuality: "CURRENT", failure: { code: "SECOND_TURN_HOW_FAILURE" } });
    expect(after.retainedContributionCandidates![0].actuality).toBe("CURRENT");
    expect(runtime.bridge).toHaveBeenCalledTimes(2);
    expect(runtime.language).not.toHaveBeenCalled();
    expectNonAdopted(after);
  });
});
