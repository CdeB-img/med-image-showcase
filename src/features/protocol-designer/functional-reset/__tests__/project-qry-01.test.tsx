import { loadFunctionalResetSession as readPersistedSessionForTest } from "@/features/protocol-designer/functional-reset/session";
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderDiagnosticWorkspace as render } from "./diagnostic-workspace-test-render";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { executeProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import { productHybridProviderGate } from "../../../../../api/scientific-interpretation-provider";
import { currentGovernedNavigationInput } from "@/features/query-navigation/current-navigation-evidence";
import { mockBridgeProviderFetch } from "./pass3a-bridge-provider-test-fixtures";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import type {
  ScientificInterpretationContributionEnvelope,
  ScientificInterpretationTurn,
} from "@/features/scientific-interpretation/contracts";
import type { ProductBridgeRequest, ProductBridgeResponse } from "@/features/protocol-designer/product-bridge";
import { ProductBridgeClientError } from "@/features/protocol-designer/product-bridge-client";
import {
  FUNCTIONAL_RESET_STORAGE_KEY,
  loadFunctionalResetSession,
  resolvePostAdoptionQueryContinuation,
  type FunctionalResetSession,
} from "../session";
import {
  COLCHICINE_03A_INITIAL,
  makeFunctionalResetBridgeResponse,
  makeFunctionalResetContribution,
  makeGovernedPostAdoptionResponse,
} from "./functional-reset-fixtures";

const runtime = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@/features/protocol-designer/product-bridge-client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/protocol-designer/product-bridge-client")>();
  return { ...original, requestProtocolDesignerBridge: runtime.request };
});

const UPDATE_RAW = "L’âge maximal sera 75 ans.";

const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
const stored = () => readPersistedSessionForTest(window.localStorage, FUNCTIONAL_RESET_STORAGE_KEY, true) as FunctionalResetSession;
const lastVisibleNoxiaText = (session: FunctionalResetSession) => {
  const entry = [...session.entries].reverse().find((candidate) => candidate.kind === "TEXT" && candidate.role === "NOXIA");
  if (!entry || entry.kind !== "TEXT") throw new Error("EXPECTED_VISIBLE_NOXIA_TEXT");
  return entry.content;
};
const submit = (content: string) => {
  fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: content } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
};

const populationUpdateContribution = (
  turns: ScientificInterpretationTurn[],
): ScientificInterpretationContributionEnvelope => {
  const userTurns = turns.filter((turn) => turn.role === "USER");
  const source = userTurns.at(-1)!;
  const base = makeFunctionalResetContribution([source]);
  return {
    ...base,
    identity: {
      ...base.identity,
      contributionId: `contribution:population-update:${source.turnId}`,
      previousContributionId: null,
      contributionDigest: `digest:population-update:${source.turnId}`,
    },
    source: {
      ...base.source,
      originalRequest: source.content,
      turns: [...turns],
      sourceRefs: [source.turnId],
    },
    scientificContent: {
      ...base.scientificContent,
      normalizedUnderstanding: "Âge maximal de la population : 75 ans.",
      candidateObjects: [{
        itemId: `criterion:age:${source.turnId}`,
        semanticIdentity: "population:eligibility:age:max",
        proposedType: "POPULATION_CRITERION",
        content: "Âge maximal : 75 ans",
        polarity: "AFFIRMED",
        studyRole: null,
        confidence: 1,
        epistemicBoundary: {
          ownership: "USER",
          epistemicState: "KNOWN",
          epistemicStatus: "EXPLICIT_USER_STATED",
          adoptionStatus: "CANDIDATE",
          activeState: true,
          sourceTurnIds: [source.turnId],
          sourceText: source.content,
        },
      }],
      candidateRelations: [],
      temporalElements: [],
      correctionsAndSupersessions: [],
    },
  };
};

const responseWithoutPersistentDelta = (turns: ScientificInterpretationTurn[], assistantReply: string) =>
  makeFunctionalResetBridgeResponse(turns, null, assistantReply);

const governedContinuationReceipt = async (request: ProductBridgeRequest, text?: string) => {
  const visibleText = text ?? makeGovernedPostAdoptionResponse(request).assistantReply;
  const result = await executeProtocolDesignerBridge({ body: { ...request, apiVersion: "1.0.0" }, apiKey: "MOCK_NO_NETWORK",
    fetchImpl: mockBridgeProviderFetch({ geminiText: visibleText }) });
  if (result.status !== 200 || !("assistantReply" in result.body)) throw new Error("MOCK_GOVERNED_RECEIPT_FAILED");
  return result.body as ProductBridgeResponse;
};

const installNominalRuntime = (options: { failInitialContinuation?: boolean; duplicateReply?: string } = {}) => {
  let continuationCount = 0;
  runtime.request.mockImplementation(async (request: ProductBridgeRequest) => {
    if (request.requestKind === "POST_ADOPTION_QRY_CONTINUATION") {
      continuationCount += 1;
      if (options.failInitialContinuation && continuationCount === 1) {
        throw new ProductBridgeClientError("PRODUCT_BRIDGE_UNAVAILABLE", "Mediation unavailable");
      }
      return governedContinuationReceipt(request);
    }
    const contribution = request.currentProject
      ? populationUpdateContribution(request.conversation.turns)
      : makeFunctionalResetContribution(request.conversation.turns.filter((turn) => turn.role === "USER"));
    return makeFunctionalResetBridgeResponse(
      request.conversation.turns,
      contribution,
      options.duplicateReply ?? (request.currentProject
        ? "Je vous présente cette modification pour confirmation."
        : "Je vous présente cette première structure pour confirmation."),
    );
  });
};

const acceptPendingReview = async () => {
  await screen.findByTestId("functional-contribution-review");
  fireEvent.click(screen.getByRole("button", { name: "Confirmer les choix et enregistrer" }));
};

const createInitialProject = async () => {
  submit(COLCHICINE_03A_INITIAL);
  await acceptPendingReview();
  await waitFor(() => expect(stored().project?.revision).toBe(1));
  return stored();
};

const updateProject = async () => {
  submit(UPDATE_RAW);
  await acceptPendingReview();
  await waitFor(() => expect(stored().project?.revision).toBe(2));
  return stored();
};

// The current owner explicitly removed automatic speaker selection on Project
// writes. Qualify retained QRY + explicit mediation, not the superseded auto-call.
describe("PROJECT-QRY-01 — retained navigation, explicit mediation and no adoption-triggered speaker", () => {
  beforeEach(() => {
    // Test-only transport gate: isolated mocked requests must not wait on the live rolling quota.
    vi.spyOn(productHybridProviderGate, "run").mockImplementation((operation) => operation());
    window.localStorage.clear();
    runtime.request.mockReset();
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it("Q01 initial Project creation preserves QRY without automatically invoking mediation", async () => {
    installNominalRuntime();
    renderDemo();
    const session = await createInitialProject();
    expect(runtime.request.mock.calls.filter(([request]) => request.requestKind === "POST_ADOPTION_QRY_CONTINUATION")).toHaveLength(0);
    expect(session.queryNavigation?.status).toBe("QUESTION_READY");
  });

  it("Q02 an existing Project update does not automatically select a speaker either", async () => {
    installNominalRuntime();
    renderDemo();
    await createInitialProject();
    await updateProject();
    expect(runtime.request.mock.calls.filter(([request]) => request.requestKind === "POST_ADOPTION_QRY_CONTINUATION")).toHaveLength(0);
  });

  it("S3 / Q03 both paths bind retained QRY to the adopted Project and preserve it through reload", async () => {
    installNominalRuntime();
    renderDemo();
    const created = await createInitialProject();
    const frozenV1=JSON.stringify(created.project);
    expect(created.queryNavigation).toMatchObject({
      projectVersion: created.project?.versionId,
      projectDigest: created.project?.projectDigest,
    });
    const updated = await updateProject();
    expect(updated.queryNavigation).toMatchObject({
      projectVersion: updated.project?.versionId,
      projectDigest: updated.project?.projectDigest,
    });
    expect(JSON.stringify(created.project)).toBe(frozenV1);
    const beforeReload = stored();
    const callCount = runtime.request.mock.calls.length;
    const restored = loadFunctionalResetSession(window.localStorage);
    expect(restored.project).toEqual(beforeReload.project);
    expect(restored.queryNavigation).toEqual(beforeReload.queryNavigation);
    expect(created.project?.revision).toBe(1);
    expect(updated.project?.revision).toBe(2);
    cleanup(); renderDemo();
    expect(stored().queryNavigation).toEqual(beforeReload.queryNavigation);
    expect(runtime.request).toHaveBeenCalledTimes(callCount);
  });

  it("Q04 the initial active need survives the handoff unchanged", async () => {
    installNominalRuntime();
    renderDemo();
    const session = await createInitialProject();
    const current = currentGovernedNavigationInput({project:session.project!,navigation:session.queryNavigation!})!;
    expect(current.selected.navigationNeedRefs).toEqual(session.queryNavigation?.currentAction?.navigationNeedRefs);
    expect(current.selectedActionRef).toBe(session.queryNavigation?.currentAction?.selectedActionId);
  });

  it("Q05 even an unavailable mediation mock is never called merely by adopting", async () => {
    installNominalRuntime({ failInitialContinuation: true });
    renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    await acceptPendingReview();
    await waitFor(() => expect(stored().project?.revision).toBe(1));
    const session = stored();
    expect(session.project?.revision).toBe(1);
    expect(session.bridgeTraces.some((trace) => trace.requestKind === "POST_ADOPTION_QRY_CONTINUATION")).toBe(false);
    expect(session.entries.some((entry) => entry.kind === "TEXT" && entry.content === session.queryNavigation?.standardQuestion?.text)).toBe(false);
  });

  it("Q06 an existing Project update returns an adoption receipt, not unsolicited mediation", async () => {
    installNominalRuntime();
    renderDemo();
    await createInitialProject();
    const session = await updateProject();
    expect(await screen.findAllByText(lastVisibleNoxiaText(session))).toHaveLength(2);
    expect(lastVisibleNoxiaText(session)).toBe("Choix enregistrés dans le projet.");
    expect(session.bridgeTraces.some(t=>t.requestKind==='POST_ADOPTION_QRY_CONTINUATION')).toBe(false);
  });

  it("Q07 each adoption receipt occurs after its confirmed Review", async () => {
    installNominalRuntime();
    renderDemo();
    const created = await createInitialProject();
    const initialContinuation = lastVisibleNoxiaText(created);
    expect(created.entries.findIndex((entry) => entry.kind === "TEXT" && entry.content === initialContinuation))
      .toBeGreaterThan(created.entries.findIndex((entry) => entry.kind === "REVIEW" && entry.status==='CONFIRMED'));
    const updated = await updateProject();
    const updatedContinuation = lastVisibleNoxiaText(updated);
    expect([...updated.entries].reverse().findIndex((entry) => entry.kind === "TEXT" && entry.content === updatedContinuation))
      .toBeLessThan([...updated.entries].reverse().findIndex((entry) => entry.kind === "REVIEW" && entry.status==='CONFIRMED'));
  });

  it("Q08 review cleanup preserves the continuation entry", async () => {
    installNominalRuntime();
    renderDemo();
    const session = await createInitialProject();
    expect(session.entries.some((entry) => entry.kind === "REVIEW" && entry.status === "CONFIRMED")).toBe(true);
    expect(lastVisibleNoxiaText(session)).toBe("Choix enregistrés dans le projet.");
  });

  it("Q09 workspace reload preserves the visible continuation", async () => {
    installNominalRuntime();
    const first = renderDemo();
    const session = await createInitialProject();
    const continuation = lastVisibleNoxiaText(session);
    first.unmount();
    renderDemo();
    expect(await screen.findByText(continuation)).toBeInTheDocument();
  });

  it("Q10 an adoption receipt neither repeats the provider nor invents a new scientific question", async () => {
    installNominalRuntime({ duplicateReply: "Même contenu visible." });
    renderDemo();
    const session = await createInitialProject();
    expect(session.entries.filter((entry) => entry.kind === "TEXT" && entry.content === "Même contenu visible.")).toHaveLength(0);
    expect(lastVisibleNoxiaText(session)).toBe("Choix enregistrés dans le projet.");
    expect(new Set(session.entries.map((entry) => entry.entryId)).size).toBe(session.entries.length);
    expect(runtime.request).toHaveBeenCalledTimes(1);
  });

  it("Q11 no continuation is created when QRY has no useful need", () => {
    expect(resolvePostAdoptionQueryContinuation({ currentAction: null, currentPresentation: null, standardQuestion: null }, "Question inventée ?")).toBeNull();
  });

  it("Q12 a topic switch leaves the unresolved QRY need unchanged", async () => {
    installNominalRuntime();
    renderDemo();
    const before = await createInitialProject();
    const needBefore = before.queryNavigation?.currentAction?.selectedActionId;
    runtime.request.mockImplementationOnce(async (request: { conversation: { turns: ScientificInterpretationTurn[] } }) =>
      responseWithoutPersistentDelta(request.conversation.turns, "Bien sûr. Nous pouvons parler d’un autre point."));
    submit("Je souhaite parler d’un autre point pour l’instant.");
    await screen.findByText("Bien sûr. Nous pouvons parler d’un autre point.");
    expect(stored().queryNavigation?.currentAction?.selectedActionId).toBe(needBefore);
    expect(stored().pendingContribution).toBeNull();
  });

  it("Q13 the adoption receipt is compact and does not manufacture an ASK action", async () => {
    installNominalRuntime();
    renderDemo();
    const session = await createInitialProject();
    const lastEntry = session.entries.at(-1);
    const content = lastEntry?.kind === "TEXT" ? lastEntry.content : "";
    expect(content.length).toBeLessThanOrEqual(240);
    expect((content.match(/\?/g) ?? [])).toHaveLength(0);
  });

  it("Q14 QRY derivation and reload perform no additional Project write or provider call", async () => {
    let resolveContinuation: ((value: ReturnType<typeof responseWithoutPersistentDelta>) => void) | null = null;
    runtime.request.mockImplementation(async (request: {
      requestKind?: ProductBridgeRequest["requestKind"];
      conversation: { turns: ScientificInterpretationTurn[] };
    }) => request.requestKind === "POST_ADOPTION_QRY_CONTINUATION"
      ? new Promise((resolve) => { resolveContinuation = resolve; })
      : makeFunctionalResetBridgeResponse(request.conversation.turns, makeFunctionalResetContribution(request.conversation.turns.filter((turn) => turn.role === "USER"))));
    renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    await acceptPendingReview();
    await waitFor(() => expect(stored().project?.revision).toBe(1));
    const projectAfterDecision = JSON.stringify(stored().project);
    expect(resolveContinuation).toBeNull();
    currentGovernedNavigationInput({project:stored().project!,navigation:stored().queryNavigation!});
    loadFunctionalResetSession(window.localStorage);
    expect(JSON.stringify(stored().project)).toBe(projectAfterDecision);
    expect(runtime.request).toHaveBeenCalledTimes(1);
  });

  it("Q15 continuation routing invokes Gemini conversation only and never Terra extraction", async () => {
    installNominalRuntime();
    renderDemo();
    const session = await createInitialProject();
    const request: ProductBridgeRequest = {
      apiVersion: "1.0.0",
      requestKind: "POST_ADOPTION_QRY_CONTINUATION",
      conversation: {
        conversationId: session.conversationId,
        language: "fr",
        turns: session.runtimeTurns,
        interactionContext: {
          interactionRef: session.queryNavigation!.currentPresentation!.presentationId,
          sourceActionRef: session.queryNavigation!.currentAction!.selectedActionId,
          owner: "QUERY_NAVIGATION",
          purpose: session.queryNavigation!.standardQuestion!.text,
          expectedResponseKind: "QRY_INFORMATION_RESPONSE",
          targetRefs: [session.queryNavigation!.currentAction!.targetRef],
          informationNeedRefs: session.queryNavigation!.currentAction!.navigationNeedRefs,
          projectRef: session.project!.projectId,
          projectVersion: session.project!.versionId,
          projectDigest: session.project!.projectDigest,
        },
      },
      currentProject: session.project,
      currentNavigation: currentGovernedNavigationInput({ project: session.project!, navigation: session.queryNavigation! }) ?? undefined,
      evaluatePersistentDelta: false,
    };
    const routingReply = makeGovernedPostAdoptionResponse(request).assistantReply;
    const fetchImpl = mockBridgeProviderFetch({ geminiText: routingReply, geminiResponseId: "qry-01-continuation" });
    const result = await executeProtocolDesignerBridge({ body: request, apiKey: "test-key", openAiApiKey: "unused", fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result.body).toMatchObject({
      assistantReply: routingReply,
      persistentExtraction: { called: false, status: "NOT_REQUESTED" },
      observability: { conversationProvider: "GOOGLE_GEMINI", extractionProvider: null, calls: 1, projectWrites: 0 },
    });
  });

  it("Q16 Project and continuation remain exact after session reload", async () => {
    installNominalRuntime();
    renderDemo();
    const before = await createInitialProject();
    const continuation = lastVisibleNoxiaText(before);
    const reloaded = loadFunctionalResetSession(window.localStorage);
    expect(JSON.stringify(reloaded.project)).toBe(JSON.stringify(before.project));
    expect(reloaded.entries.at(-1)).toMatchObject({ kind: "TEXT", role: "NOXIA", content: continuation });
    expect(reloaded.queryNavigation).toMatchObject({
      projectVersion: reloaded.project?.versionId,
      projectDigest: reloaded.project?.projectDigest,
    });
    expect(within(screen.getByTestId("functional-research-project")).getByText("Version 1")).toBeInTheDocument();
  });

  it("QRY-03 E01-E05 persists adoption without scheduling an autonomous scientific speaker", async () => {
    let adoptionCommittedBeforeRequest = false;
    let continuationRequests = 0;
    runtime.request.mockImplementation(async (request: {
      requestKind?: ProductBridgeRequest["requestKind"];
      conversation: { turns: ScientificInterpretationTurn[] };
    }) => {
      if (request.requestKind === "POST_ADOPTION_QRY_CONTINUATION") {
        continuationRequests += 1;
        const committed = stored();
        adoptionCommittedBeforeRequest = Boolean(
          committed.project?.revision === 1
          && committed.entries.some((entry) => entry.kind === "TEXT" && entry.content === "Projet créé.")
          && committed.entries.some((entry) => entry.kind === "REVIEW" && entry.status === "CONFIRMED"),
        );
        return governedContinuationReceipt(request as ProductBridgeRequest);
      }
      return makeFunctionalResetBridgeResponse(
        request.conversation.turns,
        makeFunctionalResetContribution(request.conversation.turns.filter((turn) => turn.role === "USER")),
        "Je vous présente cette première structure pour confirmation.",
      );
    });

    renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    await acceptPendingReview();
    await waitFor(() => expect(stored().project?.revision).toBe(1));
    expect(lastVisibleNoxiaText(stored())).toBe("Choix enregistrés dans le projet.");

    expect(adoptionCommittedBeforeRequest).toBe(false);
    expect(continuationRequests).toBe(0);
  });
});
