import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import type { ScientificInterpretationContributionEnvelope, ScientificInterpretationTurn } from "@/features/scientific-interpretation/contracts";
import { FUNCTIONAL_RESET_STORAGE_KEY, shouldMediatePostAdoptionQuery } from "../session";
import {
  COLCHICINE_03A_INITIAL,
  makeFunctionalResetBridgeResponse,
  makeFunctionalResetContribution,
} from "./functional-reset-fixtures";

const runtime = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@/features/protocol-designer/product-bridge-client", () => ({
  requestProtocolDesignerBridge: runtime.request,
}));

const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
const submit = (content: string) => {
  fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: content } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
};
const stored = () => JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!);

const singleObjectContribution = (
  turns: ScientificInterpretationTurn[],
  contributionId: string,
  itemId: string,
  proposedType: string,
  content: string,
  studyRole: string | null = null,
): ScientificInterpretationContributionEnvelope => {
  const userTurns = turns.filter((turn) => turn.role === "USER");
  const source = userTurns.at(-1)!;
  const base = makeFunctionalResetContribution(userTurns);
  const object = {
    itemId,
    semanticIdentity: itemId,
    proposedType,
    content,
    polarity: "AFFIRMED",
    studyRole,
    confidence: 1,
    epistemicBoundary: {
      ownership: "USER",
      epistemicState: "KNOWN" as const,
      epistemicStatus: "EXPLICIT_USER_STATED",
      adoptionStatus: "CANDIDATE",
      activeState: true,
      sourceTurnIds: [source.turnId],
      sourceText: source.content,
    },
  };
  return {
    ...base,
    identity: { ...base.identity, contributionId, contributionDigest: `${contributionId}:digest` },
    source: { ...base.source, originalRequest: source.content, turns: [...turns], sourceRefs: [source.turnId] },
    scientificContent: {
      ...base.scientificContent,
      normalizedUnderstanding: content,
      candidateObjects: [object],
      candidateRelations: [],
      temporalElements: [],
      correctionsAndSupersessions: [],
    },
  };
};

const acceptInitialProject = async () => {
  submit(COLCHICINE_03A_INITIAL);
  await screen.findByTestId("functional-contribution-review");
  fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));
  expect(await within(screen.getByTestId("functional-research-project")).findByText("Version 1")).toBeInTheDocument();
};

const noChangeResponse = (turns: ScientificInterpretationTurn[], assistantReply: string) => {
  const response = makeFunctionalResetBridgeResponse(turns, null, assistantReply);
  return {
    ...response,
    persistentExtraction: {
      called: true,
      status: "NO_CHANGE" as const,
      candidate: { contract: "PERSISTENT_PROJECT_DELTA_CANDIDATE" as const, contractVersion: "0.1.0" as const, projectWriteAuthorized: false as const, changes: [] },
      validation: { valid: true, acceptedChanges: [], blocks: [], noOps: [] },
      contribution: null,
    },
    observability: { ...response.observability, calls: 2 as const, extractionLatencyMs: 10 },
  };
};

describe("MINIMAL PRODUCT BRIDGE — real Functional Reset wiring", () => {
  beforeEach(() => {
    window.localStorage.clear();
    runtime.request.mockReset();
  });
  afterEach(cleanup);

  it("F15 does not request a continuation when QRY has no useful action", () => {
    expect(shouldMediatePostAdoptionQuery({ currentAction: null, currentPresentation: null, standardQuestion: null })).toBe(false);
  });

  it("routes an explanatory turn through local Knowledge and creates no Project candidate", async () => {
    renderDemo();
    submit("Pourquoi tu me demandes le nombre de centres ?");
    expect(await screen.findByTestId("product-understand-knowledge-response")).toBeInTheDocument();
    expect(screen.queryByTestId("functional-contribution-review")).toBeNull();
    expect(runtime.request).not.toHaveBeenCalled();
    expect(stored().project).toBeNull();
    expect(stored().bridgeTraces.at(-1)).toMatchObject({
      provider: "KNOWLEDGE",
      persistentExtractionCalled: false,
      projectChangeSetCandidate: null,
      calls: 0,
      projectVersionBefore: null,
      projectVersionAfter: null,
    });
  });

  it("requires an explicit accept or reject decision and preserves reload", async () => {
    runtime.request.mockImplementation(async ({ conversation }: { conversation: { turns: ScientificInterpretationTurn[] } }) => makeFunctionalResetBridgeResponse(
      conversation.turns,
      makeFunctionalResetContribution(conversation.turns),
      "Je comprends que vous souhaitez comparer la colchicine au placebo après infarctus.",
    ));
    const first = renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    const firstReview = await screen.findByTestId("functional-contribution-review");
    expect(within(firstReview).getByText(/comparaison avec/)).toBeInTheDocument();
    expect(firstReview).not.toHaveTextContent("COMPARES_WITH");
    expect(stored().entries.find((entry: { kind: string }) => entry.kind === "REVIEW").candidate.humanReviewProjection).toMatchObject({
      status: "COMPLETE",
      missingChangeRefs: [],
    });
    expect(stored().project).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Refuser cette proposition" }));
    expect(await screen.findByText("Proposition refusée. Le Research Project est inchangé.")).toBeInTheDocument();
    expect(stored().project).toBeNull();
    expect(stored().entries.find((entry: { kind: string }) => entry.kind === "REVIEW")).toMatchObject({
      status: "REJECTED",
      decision: { status: "REJECTED", mandate: "PROJECT_OWNER" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Recommencer" }));
    submit(COLCHICINE_03A_INITIAL);
    await screen.findByTestId("functional-contribution-review");
    fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));
    const projectPanel = screen.getByTestId("functional-research-project");
    expect(await within(projectPanel).findByText("Version 1")).toBeInTheDocument();
    expect(stored().project).toMatchObject({ revision: 1, llmProjectWrites: 0, confirmationDecision: { status: "ADOPTED" } });

    first.unmount();
    renderDemo();
    expect(within(screen.getByTestId("functional-research-project")).getByText("Version 1")).toBeInTheDocument();
  });

  it("reloads a persisted pre-review-projection session without crashing the workspace", async () => {
    runtime.request.mockImplementation(async ({ conversation }: { conversation: { turns: ScientificInterpretationTurn[] } }) => makeFunctionalResetBridgeResponse(
      conversation.turns,
      makeFunctionalResetContribution(conversation.turns),
      "Je comprends que vous souhaitez comparer la colchicine au placebo après infarctus.",
    ));
    const first = renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    await screen.findByTestId("functional-contribution-review");
    const legacy = stored();
    const review = legacy.entries.find((entry: { kind: string }) => entry.kind === "REVIEW");
    delete review.candidate.humanReviewProjection;
    window.localStorage.setItem(FUNCTIONAL_RESET_STORAGE_KEY, JSON.stringify(legacy));

    first.unmount();
    renderDemo();
    const reloadedReview = await screen.findByTestId("functional-contribution-review");
    expect(within(reloadedReview).getByText(/comparaison avec/)).toBeInTheDocument();
    expect(reloadedReview).not.toHaveTextContent("COMPARES_WITH");
    expect(screen.queryByText("L’espace Protocol Designer a rencontré une erreur d’affichage.")).toBeNull();
  });

  it("preserves the exact active QRY while an explanatory turn uses transversal Knowledge", async () => {
    runtime.request.mockImplementation(async ({ conversation }: { conversation: { turns: ScientificInterpretationTurn[] } }) => {
      const latest = conversation.turns.at(-1)?.content;
      return latest === COLCHICINE_03A_INITIAL
        ? makeFunctionalResetBridgeResponse(conversation.turns)
        : makeFunctionalResetBridgeResponse(
          conversation.turns,
          null,
          "Je reformule : je cherche à comprendre comment les participants seront répartis entre les groupes.",
        );
    });
    renderDemo();
    await acceptInitialProject();
    const before = stored();
    const questionBefore = before.queryNavigation.standardQuestion.text;
    const needBefore = before.queryNavigation.currentAction.selectedActionId;
    const projectBefore = JSON.stringify(before.project);
    const queryBefore = JSON.stringify(before.queryNavigation);
    const entriesBefore = before.entries.length;
    runtime.request.mockClear();

    submit("je ne comprends pas");
    expect(await screen.findByTestId("product-understand-knowledge-response")).toBeInTheDocument();
    const after = stored();
    expect(runtime.request).not.toHaveBeenCalled();
    expect(after.entries).toHaveLength(entriesBefore + 2);
    expect(after.entries.filter((entry: { kind: string; content?: string }) => entry.kind === "TEXT" && entry.content === questionBefore)).toHaveLength(0);
    expect(after.queryNavigation.currentAction.selectedActionId).toBe(needBefore);
    expect(JSON.stringify(after.queryNavigation)).toBe(queryBefore);
    expect(JSON.stringify(after.project)).toBe(projectBefore);
    expect(after.bridgeTraces.at(-1)).toMatchObject({ provider: "KNOWLEDGE", calls: 0, persistentExtractionCalled: false, projectVersionBefore: before.project.versionId, projectVersionAfter: before.project.versionId });
    expect(after.bridgeTraces.at(-1).knowledgeResultRef).toMatch(/^knowledge-result:/);
  });

  it("F11–F13 recomputes QRY after adoption and displays a mediated continuation below the confirmation", async () => {
    runtime.request.mockImplementation(async (request: { requestKind?: string; conversation: { turns: ScientificInterpretationTurn[] } }) => request.requestKind === "POST_ADOPTION_QRY_CONTINUATION"
      ? noChangeResponse(request.conversation.turns, "Quel mode de répartition souhaitez-vous entre les groupes ?")
      : makeFunctionalResetBridgeResponse(
        request.conversation.turns,
        makeFunctionalResetContribution(request.conversation.turns),
        "Je retiens une comparaison entre la colchicine et le placebo.",
      ));
    renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    await screen.findByTestId("functional-contribution-review");
    fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));

    expect(await screen.findByText("Projet créé.")).toBeInTheDocument();
    expect(await screen.findByText("Quel mode de répartition souhaitez-vous entre les groupes ?")).toBeInTheDocument();
    const after = stored();
    const feedbackIndex = after.entries.findIndex((entry: { content?: string }) => entry.content === "Projet créé.");
    const continuationIndex = after.entries.findIndex((entry: { content?: string }) => entry.content === "Quel mode de répartition souhaitez-vous entre les groupes ?");
    expect(continuationIndex).toBeGreaterThan(feedbackIndex);
    expect(after.queryNavigation).toMatchObject({
      projectVersion: after.project.versionId,
      projectDigest: after.project.projectDigest,
      currentAction: { navigationNeedRefs: expect.any(Array) },
    });
    const continuationRequest = runtime.request.mock.calls.find(([request]) => request.requestKind === "POST_ADOPTION_QRY_CONTINUATION")?.[0];
    expect(continuationRequest).toMatchObject({
      currentProject: { versionId: after.project.versionId },
      evaluatePersistentDelta: false,
      conversation: {
        interactionContext: {
          owner: "QUERY_NAVIGATION",
          projectVersion: after.project.versionId,
          informationNeedRefs: after.queryNavigation.currentAction.navigationNeedRefs,
        },
      },
    });
    expect(after.bridgeTraces.at(-1)).toMatchObject({
      requestKind: "POST_ADOPTION_QRY_CONTINUATION",
      persistentExtractionCalled: false,
      qryNeedAfter: after.queryNavigation.currentAction.navigationNeedRefs[0],
      projectVersionAfter: after.project.versionId,
    });
  });

  it("keeps an unresolved QRY active while a topic switch and NO_CHANGE receive a natural reply", async () => {
    runtime.request.mockImplementation(async ({ conversation }: { conversation: { turns: ScientificInterpretationTurn[] } }) => {
      const latest = conversation.turns.at(-1)?.content;
      return latest === COLCHICINE_03A_INITIAL
        ? makeFunctionalResetBridgeResponse(conversation.turns)
        : noChangeResponse(conversation.turns, "Bien sûr. Parlons de la population : quels participants souhaitez-vous inclure ou exclure ?");
    });
    renderDemo();
    await acceptInitialProject();
    const before = stored();
    const queryBefore = JSON.stringify(before.queryNavigation);
    const projectBefore = JSON.stringify(before.project);

    submit("je voudrais parler de la population");
    expect(await screen.findByText(/Bien sûr. Parlons de la population/)).toBeInTheDocument();
    const after = stored();
    expect(after.entries.at(-1).content).toContain("Parlons de la population");
    expect(JSON.stringify(after.queryNavigation)).toBe(queryBefore);
    expect(JSON.stringify(after.project)).toBe(projectBefore);
    expect(after.pendingContribution).toBeNull();
    expect(after.bridgeTraces.at(-1)).toMatchObject({
      persistentExtractionCalled: true,
      persistentExtractionStatus: "NO_CHANGE",
      projectChangeSetCandidate: null,
      projectVersionBefore: before.project.versionId,
      projectVersionAfter: before.project.versionId,
      qryNeedBefore: before.queryNavigation.currentAction.navigationNeedRefs[0],
      qryNeedAfter: before.queryNavigation.currentAction.navigationNeedRefs[0],
    });
  });

  it("H03-P01/P02 stages successive pre-creation contributions into one canonical Human Review", async () => {
    runtime.request.mockImplementation(async ({ conversation }: { conversation: { turns: ScientificInterpretationTurn[] } }) => {
      const latest = conversation.turns.at(-1)?.content ?? "";
      const contribution = latest.includes("CT et IRM")
        ? singleObjectContribution(conversation.turns, "contribution:ct-mri", "acquisition:ct", "ACQUISITION", "Acquisition CT")
        : singleObjectContribution(conversation.turns, "contribution:reference", "analysis:ex-vivo", "ANALYSIS_SPECIFICATION", "Référence anatomique ex vivo", "REFERENCE_STANDARD");
      return makeFunctionalResetBridgeResponse(conversation.turns, contribution, "Je vous présente cette contribution pour confirmation.");
    });
    renderDemo();

    submit("Je veux construire une étude : je comparerai le CT et IRM.");
    expect((await screen.findAllByText("Acquisition CT")).length).toBeGreaterThan(0);
    submit("Dans cette étude, la méthode anatomique ex vivo sera la référence.");

    expect((await screen.findAllByText("Référence anatomique ex vivo")).length).toBeGreaterThan(0);
    const reviews = await screen.findAllByTestId("functional-contribution-review");
    expect(reviews).toHaveLength(1);
    expect(within(reviews[0]!).getByText("Acquisition CT")).toBeInTheDocument();
    expect(within(reviews[0]!).getByText("Référence anatomique ex vivo")).toBeInTheDocument();
    expect(stored().pendingContribution.identity.runtimeId).toBe("MINIMAL_PRODUCT_BRIDGE_INITIAL_PROJECT_STAGING");

    fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));
    expect(await within(screen.getByTestId("functional-research-project")).findByText("Version 1")).toBeInTheDocument();
    expect(JSON.stringify(stored().project)).toContain("Acquisition CT");
    expect(JSON.stringify(stored().project)).toContain("Référence anatomique ex vivo");
  });

  it("H03-P07/P08 makes blocked persistence visible and preserves Project truth", async () => {
    runtime.request.mockImplementationOnce(async ({ conversation }: { conversation: { turns: ScientificInterpretationTurn[] } }) => {
      const response = makeFunctionalResetBridgeResponse(conversation.turns, null, "Je comprends la correction demandée.");
      return {
        ...response,
        persistentExtraction: {
          ...response.persistentExtraction,
          called: true,
          status: "BLOCKED" as const,
          failure: {
            code: "PERSISTENT_VALIDATION_BLOCKED" as const,
            message: "La contribution persistante ne respecte pas le contrat canonique.",
            details: ["change:0:PROJECT_REF_INVALID"],
            provider: null,
          },
        },
        observability: { ...response.observability, calls: 2 as const, extractionLatencyMs: 8 },
      };
    });
    renderDemo();
    submit("Je modifie cette référence dans mon protocole d’étude.");
    expect(await screen.findByText(/premi[èe]re compr[ée]hension structur[ée]e/u)).toBeInTheDocument();
    expect(screen.queryByText("Je comprends la correction demandée.")).toBeNull();
    expect(await screen.findByText(/proposition persistante est bloquée/)).toHaveAttribute("role", "alert");
    expect(stored().project).toBeNull();
    expect(stored().bridgeTraces.at(-1)).toMatchObject({
      persistentExtractionStatus: "BLOCKED",
      persistentExtractionFailure: { code: "PERSISTENT_VALIDATION_BLOCKED", details: ["change:0:PROJECT_REF_INVALID"] },
      projectVersionBefore: null,
      projectVersionAfter: null,
    });
  });
});
