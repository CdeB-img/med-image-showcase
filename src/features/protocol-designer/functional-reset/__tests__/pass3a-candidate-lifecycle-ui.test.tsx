import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
import { prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import { buildCurrentTurnNavigation } from "@/features/query-navigation/current-turn-navigation";
import { realizeGovernedConversation } from "@/features/query-navigation/governed-conversation-realization";
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
const LIVE_FIRST_TURN = "je veux faire une étude évaluant l'effet de méthodes de reperfusion post IDM avec mise en place immédiate ou différée d'un stent afin d'évaluer l'efficacité sur la viabilité myocardique. avec donc deux groupes en double aveugle, une IRM a J3-6 évaluant la cinétique segmentaire, le strain, le T1/T2, le précoce et tardif le critere de jugement principale étant la taille des lésions microvasculaire a 3min post injection";
const DEGRADED_REPLY = "J’ai identifié plusieurs éléments dans votre projet. Voici ce que j’ai compris ; vous pouvez les corriger avant toute confirmation.";
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

const liveFirstTurnConformanceFailure = (request: ProductBridgeRequest): ProductBridgeResponse => {
  const contribution = makeFunctionalResetContribution(request.conversation.turns.filter((turn) => turn.role === "USER"));
  const source = request.conversation.turns.filter((turn) => turn.role === "USER").at(-1)!;
  const template = contribution.scientificContent.candidateObjects[0]!;
  const explicit = (itemId: string, proposedType: string, content: string, studyRole: string | null = null) => ({
    ...template, itemId, semanticIdentity: itemId, proposedType, content, studyRole,
    epistemicBoundary: { ...template.epistemicBoundary, sourceTurnIds: [source.turnId] },
  });
  contribution.identity.contributionId = "contribution:live-standard-first-turn";
  contribution.identity.contributionDigest = "contribution:live-standard-first-turn:digest";
  contribution.source.conversationId = request.conversation.conversationId;
  contribution.source.originalRequest = LIVE_FIRST_TURN;
  contribution.runtimeEvidence.provider = "TEST_FIXTURE_NO_PROVIDER_CALL";
  contribution.scientificContent.normalizedUnderstanding = LIVE_FIRST_TURN;
  contribution.scientificContent.candidateObjects = [
    explicit("condition:post-idm", "CONDITION", "post IDM"),
    explicit("intervention:stent-immediate", "INTERVENTION", "mise en place immédiate d'un stent", "INTERVENTION_ARM"),
    explicit("comparator:stent-delayed", "COMPARATOR", "mise en place différée d'un stent", "COMPARATOR_ARM"),
    explicit("design:two-groups-double-blind", "STUDY_DESIGN", "deux groupes en double aveugle"),
    explicit("measure:segmental-motion", "MEASURED_VARIABLE", "cinétique segmentaire"),
    explicit("measure:strain", "MEASURED_VARIABLE", "strain"),
    explicit("measure:t1-t2", "MEASURED_VARIABLE", "T1/T2"),
    explicit("measure:microvascular-lesions", "MEASURED_VARIABLE", "Taille des lésions microvasculaires"),
    explicit("endpoint:microvascular-lesions", "ENDPOINT", "Taille des lésions microvasculaires à 3 min post-injection", "PRIMARY_ENDPOINT"),
  ];
  contribution.scientificContent.ambiguities = [
    explicit("ambiguity:early-late", "AMBIGUITY", "Quand vous dites « précoce et tardif », parlez-vous du rehaussement précoce et tardif après injection ?"),
  ];
  contribution.scientificContent.candidateRelations = [{
    ...contribution.scientificContent.candidateRelations[0]!,
    relationId: "relation:immediate-vs-delayed",
    sourceItemId: "intervention:stent-immediate",
    targetItemId: "comparator:stent-delayed",
    epistemicBoundary: { ...template.epistemicBoundary, sourceTurnIds: [source.turnId] },
  }];
  contribution.scientificContent.temporalElements = [
    explicit("timing:mri-j3-j6", "TEMPORAL_ELEMENT", "IRM a J3-6"),
  ];
  const validation = {
    valid: true, blocks: [], noOps: [], normalizations: [],
    acceptedChanges: [], acceptedRelations: [], acceptedTemporalQualifications: [], acceptedExpectedVariableOccasions: [],
  };
  const candidate = prepareResearchProjectContributionCandidate(contribution, request.currentProject);
  const navigation = buildCurrentTurnNavigation({
    sourceTurnRef: source.turnId, sourceText: source.content,
    candidate, contribution, validation, currentProject: request.currentProject,
    preProjectNavigation: request.preProjectNavigation,
    interaction: request.conversation.interactionContext,
    currentNavigation: request.currentNavigation,
    boundedReferentContext: request.boundedReferentContext,
    boundedInteraction: request.boundedInteraction,
    requestKind: request.requestKind,
  });
  const governedRealization = realizeGovernedConversation({
    envelope: navigation.envelope,
    providerReply: "J’ai adopté cette proposition.",
    requireProviderClaim: true,
    localWhatText: navigation.localWhatText,
  });
  const response = makeFunctionalResetBridgeResponse(request.conversation.turns, contribution, governedRealization.assistantReply);
  return {
    ...response,
    currentTurnNavigation: navigation,
    governedRealization,
    conversationFailure: {
      stage: "CONFORMANCE",
      code: governedRealization.conformance.diagnostics[0] ?? "HOW_CONFORMANCE_REJECTED",
      message: "La formulation de cette étape n’a pas abouti. La proposition validée reste conservée sans adoption.",
      provider: null,
    },
    persistentExtraction: { ...response.persistentExtraction, validation },
    observability: { ...response.observability, conversationCalls: 1, conversationResponseReceived: true },
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

  it("HOW failure presents the retained validated candidate through the deterministic degraded path", async () => {
    runtime.bridge.mockImplementation(async (request: ProductBridgeRequest): Promise<ProductBridgeResponse> => ({
      ...validatedResponse(request), assistantReply: "",
      conversationFailure: { stage: "HOW", code: "CONVERSATION_PROVIDER_FAILURE", message: "La formulation n’a pas abouti.", provider: null },
    }));
    renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    await screen.findByTestId("functional-contribution-review");
    await waitFor(() => expect(stored().retainedContributionCandidates?.[0].downstreamState).toBe("PRESENTED"));
    const state = stored();
    expect(state.retainedContributionCandidates![0]).toMatchObject({ presentedAt: expect.any(String), failure: null });
    expect(state.pendingContribution?.identity.contributionId).toBe(state.retainedContributionCandidates![0].candidateRef);
    expect(state.entries.filter((entry) => entry.kind === "REVIEW")).toHaveLength(1);
    expect(screen.getByText(DEGRADED_REPLY)).toBeInTheDocument();
    const stages = state.scientificExecutionTraceLedger.events.map((event) => event.common?.stage ?? event.eventType);
    expect(stages.indexOf("PROJECT_CANDIDATE_VALIDATED")).toBeGreaterThanOrEqual(0);
    expect(stages).not.toContain("ERROR_BOUNDARY");
    expect(runtime.bridge).toHaveBeenCalledTimes(1);
    expect(runtime.language).not.toHaveBeenCalled();
    expectNonAdopted(state);
  });

  it("keeps the exact live first turn reviewable when Gemini HOW is rejected by conformance", async () => {
    runtime.bridge.mockImplementation(async (request: ProductBridgeRequest) => liveFirstTurnConformanceFailure(request));
    renderDemo();
    submit(LIVE_FIRST_TURN);

    await screen.findByTestId("functional-contribution-review");
    await waitFor(() => expect(stored().retainedContributionCandidates?.[0].downstreamState).toBe("PRESENTED"));
    const state = stored();
    const retained = state.retainedContributionCandidates![0];
    expect(state.runtimeTurns.find((turn) => turn.role === "USER")?.content).toBe(LIVE_FIRST_TURN);
    expect(retained.validation).toMatchObject({ valid: true, blocks: [] });
    expect(retained.candidate.humanReviewProjection.sections.flatMap((section) => section.items.map((item) => item.content)))
      .toEqual(expect.arrayContaining([
      "post IDM",
      "mise en place immédiate d'un stent",
      "mise en place différée d'un stent",
      "deux groupes en double aveugle",
      "cinétique segmentaire",
      "strain",
      "T1/T2",
      "Taille des lésions microvasculaires",
      "Taille des lésions microvasculaires à 3 min post-injection",
      "+ IRM : J3–J6",
      ]));
    expect(retained.contribution.scientificContent.ambiguities.map((item) => item.content)).toContain(
      "Quand vous dites « précoce et tardif », parlez-vous du rehaussement précoce et tardif après injection ?",
    );
    expect(screen.getByText(DEGRADED_REPLY)).toBeInTheDocument();
    const summary = screen.getByTestId("standard-initial-review-summary");
    expect(summary).toHaveTextContent(/post IDM/i);
    expect(summary).toHaveTextContent(/mise en place immédiate d'un stent/i);
    expect(summary).toHaveTextContent(/mise en place différée d'un stent/i);
    expect(summary).toHaveTextContent("IRM : J3–J6");
    expect(summary).toHaveTextContent(/cinétique segmentaire/i);
    expect(summary).toHaveTextContent(/strain/i);
    expect(summary).toHaveTextContent("T1/T2");
    expect(summary).toHaveTextContent("Critère principalTaille des lésions microvasculaires à 3 min post-injection");
    expect(summary).toHaveTextContent("Quand vous dites « précoce et tardif », parlez-vous du rehaussement précoce et tardif après injection ?");
    expect(summary.textContent?.match(/Taille des lésions microvasculaires/gu)).toHaveLength(1);
    const primaryEndpointItem = retained.candidate.humanReviewProjection.sections
      .flatMap((section) => section.items)
      .find((item) => item.scientificRole === "PRIMARY_ENDPOINT");
    expect(primaryEndpointItem).toMatchObject({
      objectType: "ENDPOINT",
      scientificRole: "PRIMARY_ENDPOINT",
      content: "Taille des lésions microvasculaires à 3 min post-injection",
    });
    expect(retained.candidate.humanReviewProjection.sections.find((section) => section.label === "Critère principal")?.items)
      .toContainEqual(expect.objectContaining({ changeRef: primaryEndpointItem?.changeRef }));
    const details = screen.getByTestId("functional-review-details") as HTMLDetailsElement;
    expect(details.open).toBe(false);
    expect(screen.queryByTestId("understanding-review-card")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Voir les détails"));
    expect(details.open).toBe(true);
    expect(details).toContainElement(await screen.findByTestId("understanding-review-card"));
    expect(screen.getAllByText("Taille des lésions microvasculaires")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Cela correspond à mon projet" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Décrire une correction" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Refuser cette proposition" })).toBeEnabled();
    expect(state.project).toBeNull();
    expect(retained.humanDecision).toBeNull();
    expect(retained.candidate.projectWriteAuthorized).toBe(false);
    expect(runtime.bridge).toHaveBeenCalledTimes(1);
    expect(runtime.language).not.toHaveBeenCalled();
    expectNonAdopted(state);
    expect(screen.getByTestId("project-global-progress")).toHaveTextContent("Avancement indicatif0 %");

    fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));
    await waitFor(() => expect(stored().project?.revision).toBe(1));
    expect(screen.queryByText("L’espace Protocol Designer a rencontré une erreur d’affichage.")).not.toBeInTheDocument();
    const adopted = stored().project!;
    expect(adopted.canonicalState?.decisionLedger).toHaveLength(1);
    expect(adopted.llmProjectWrites).toBe(0);
    const projectPanel = screen.getByTestId("functional-research-project");
    expect(projectPanel).toHaveTextContent("Version 1");
    for (const label of ["Question scientifique", "Objectifs", "Hypothèses", "Population", "Design", "Intervention / exposition", "Comparateur", "Critères / endpoints", "Imagerie / méthodes / mesures", "Temporalité / visites", "Données / variables", "Analyses", "Contraintes / faisabilité"]) {
      expect(within(projectPanel).getAllByText(label).length).toBeGreaterThanOrEqual(2);
    }
    expect(screen.queryByText("Voir toutes les rubriques du projet")).not.toBeInTheDocument();
    expect(screen.getByTestId("project-group-endpoints")).toHaveTextContent("Principal :Taille des lésions microvasculaires à 3 min post-injection");
    expect(projectPanel).toHaveTextContent("Non généré");
    expect(projectPanel).not.toHaveTextContent("Construction en cours");
    expect(Number(screen.getByRole("progressbar", { name: /Avancement indicatif du Research Project/ }).getAttribute("aria-valuenow"))).toBeGreaterThan(0);
    expect(within(projectPanel).getByTestId("project-cockpit-counts")).toHaveTextContent(/\d+ décisions? confirmées? · \d+ points? matériels? ouverts?/);
    expect(within(projectPanel).getByTestId("project-next-useful-decision")).toHaveTextContent("Prochaine décision utile");
    expect(screen.queryByRole("button", { name: "Cela correspond à mon projet" })).not.toBeInTheDocument();
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

  it("keeps an older presented candidate unchanged while presenting a newer validated candidate after HOW failure", async () => {
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
    submit(MODIFICATION);
    await waitFor(() => expect(stored().retainedContributionCandidates).toHaveLength(2));
    await waitFor(() => expect(stored().retainedContributionCandidates![1].downstreamState).toBe("PRESENTED"));
    const after = stored();
    expect(JSON.stringify(after.retainedContributionCandidates![0])).toBe(oldCandidate);
    expect(after.entries.find((entry) => entry.entryId === oldReview.entryId)).toEqual(oldReview);
    expect(after.pendingContribution?.identity.contributionId).toBe(after.retainedContributionCandidates![1].candidateRef);
    expect(after.entries.filter((entry) => entry.kind === "REVIEW")).toHaveLength(2);
    expect(screen.getAllByTestId("functional-contribution-review")).toHaveLength(2);
    expect(after.retainedContributionCandidates![1]).toMatchObject({ presentedAt: expect.any(String), humanDecision: null, actuality: "CURRENT", failure: null });
    expect(after.retainedContributionCandidates![0].actuality).toBe("CURRENT");
    expect(runtime.bridge).toHaveBeenCalledTimes(2);
    expect(runtime.language).not.toHaveBeenCalled();
    expectNonAdopted(after);
  });
});
