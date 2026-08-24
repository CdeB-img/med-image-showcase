import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import type { ScientificInterpretationTurn } from "@/features/scientific-interpretation/contracts";
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

  it("shows the natural reply and creates no Project candidate for a pure conversation turn", async () => {
    runtime.request.mockImplementationOnce(async ({ conversation }: { conversation: { turns: ScientificInterpretationTurn[] } }) => makeFunctionalResetBridgeResponse(
      conversation.turns,
      null,
      "Cette question sert à vérifier si le projet est monocentrique ou multicentrique, ce qui change sa faisabilité.",
    ));
    renderDemo();
    submit("Pourquoi tu me demandes le nombre de centres ?");
    expect(await screen.findByText(/Cette question sert à vérifier/)).toBeInTheDocument();
    expect(screen.queryByTestId("functional-contribution-review")).toBeNull();
    expect(stored().project).toBeNull();
    expect(stored().bridgeTraces.at(-1)).toMatchObject({
      persistentExtractionCalled: false,
      projectChangeSetCandidate: null,
      calls: 1,
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
    expect(within(firstReview).getByText(/COMPARES_WITH/)).toBeInTheDocument();
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
    expect(within(reloadedReview).getByText(/COMPARES_WITH/)).toBeInTheDocument();
    expect(screen.queryByText("L’espace Protocol Designer a rencontré une erreur d’affichage.")).toBeNull();
  });

  it("passes the exact active QRY question as context while the natural explanation remains the visible reply", async () => {
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
    const entriesBefore = before.entries.length;

    submit("je ne comprends pas");
    expect(await screen.findByText(/Je reformule : je cherche à comprendre/)).toBeInTheDocument();
    const request = runtime.request.mock.calls.at(-1)?.[0];
    expect(request.conversation.interactionContext.purpose).toContain("Question actuellement présentée au chercheur");
    const after = stored();
    expect(request.conversation.interactionContext.purpose).toContain(after.queryNavigation.standardQuestion.text);
    expect(after.entries).toHaveLength(entriesBefore + 2);
    expect(after.entries.at(-1).content).toContain("Je reformule");
    expect(after.entries.filter((entry: { kind: string; content?: string }) => entry.kind === "TEXT" && entry.content === questionBefore)).toHaveLength(0);
    expect(after.queryNavigation.currentAction.selectedActionId).toBe(needBefore);
    expect(after.queryNavigation.memory.responses.at(-1).disposition).toBe("REQUEST_CLARIFICATION");
    expect(JSON.stringify(after.project)).toBe(projectBefore);
    expect(after.bridgeTraces.at(-1)).toMatchObject({ persistentExtractionCalled: false, projectVersionBefore: before.project.versionId, projectVersionAfter: before.project.versionId });
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
});
