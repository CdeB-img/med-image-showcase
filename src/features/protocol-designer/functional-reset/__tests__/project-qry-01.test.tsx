import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { executeProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import type {
  ScientificInterpretationContributionEnvelope,
  ScientificInterpretationTurn,
} from "@/features/scientific-interpretation/contracts";
import type { ProductBridgeRequest } from "@/features/protocol-designer/product-bridge";
import { ProductBridgeClientError } from "@/features/protocol-designer/product-bridge-client";
import type { ResearchProjectOwnerProjection } from "@/features/research-project-construction";
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
} from "./functional-reset-fixtures";

const runtime = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@/features/protocol-designer/product-bridge-client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/protocol-designer/product-bridge-client")>();
  return { ...original, requestProtocolDesignerBridge: runtime.request };
});

const INITIAL_CONTINUATION = "Quel critère d’éligibilité souhaitez-vous préciser ?";
const UPDATE_CONTINUATION = "Quel autre point utile souhaitez-vous préciser ?";
const UPDATE_RAW = "L’âge maximal sera 75 ans.";

const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
const stored = () => JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!) as FunctionalResetSession;
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

const installNominalRuntime = (options: { failInitialContinuation?: boolean; duplicateReply?: string } = {}) => {
  let continuationCount = 0;
  runtime.request.mockImplementation(async (request: {
    requestKind?: ProductBridgeRequest["requestKind"];
    conversation: { turns: ScientificInterpretationTurn[] };
    currentProject: ResearchProjectOwnerProjection | null;
  }) => {
    if (request.requestKind === "POST_ADOPTION_QRY_CONTINUATION") {
      continuationCount += 1;
      if (options.failInitialContinuation && continuationCount === 1) {
        throw new ProductBridgeClientError("PRODUCT_BRIDGE_UNAVAILABLE", "Mediation unavailable");
      }
      return responseWithoutPersistentDelta(
        request.conversation.turns,
        options.duplicateReply ?? (request.currentProject?.revision === 1 ? INITIAL_CONTINUATION : UPDATE_CONTINUATION),
      );
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
  fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));
};

const createInitialProject = async () => {
  submit(COLCHICINE_03A_INITIAL);
  await acceptPendingReview();
  await screen.findByText("Projet créé.");
  await waitFor(() => expect(stored().bridgeTraces.at(-1)?.requestKind).toBe("POST_ADOPTION_QRY_CONTINUATION"));
  return stored();
};

const updateProject = async () => {
  submit(UPDATE_RAW);
  await acceptPendingReview();
  await screen.findByText("Projet mis à jour.");
  await screen.findByText(UPDATE_CONTINUATION);
  return stored();
};

describe("PROJECT-QRY-01 — post-adoption continuation presentation", () => {
  beforeEach(() => {
    window.localStorage.clear();
    runtime.request.mockReset();
  });
  afterEach(cleanup);

  it("Q01 initial Project creation invokes post-adoption QRY mediation", async () => {
    installNominalRuntime();
    renderDemo();
    const session = await createInitialProject();
    expect(runtime.request.mock.calls.filter(([request]) => request.requestKind === "POST_ADOPTION_QRY_CONTINUATION")).toHaveLength(1);
    expect(session.queryNavigation?.status).toBe("QUESTION_READY");
  });

  it("Q02 an existing Project update invokes the same post-adoption corridor", async () => {
    installNominalRuntime();
    renderDemo();
    await createInitialProject();
    await updateProject();
    expect(runtime.request.mock.calls.filter(([request]) => request.requestKind === "POST_ADOPTION_QRY_CONTINUATION")).toHaveLength(2);
  });

  it("Q03 both paths bind QRY and mediation to the adopted Project version and digest", async () => {
    installNominalRuntime();
    renderDemo();
    const created = await createInitialProject();
    const initialRequest = runtime.request.mock.calls.find(([request]) => request.requestKind === "POST_ADOPTION_QRY_CONTINUATION")?.[0];
    expect(initialRequest.conversation.interactionContext).toMatchObject({
      projectVersion: created.project?.versionId,
      projectDigest: created.project?.projectDigest,
    });
    const updated = await updateProject();
    const updateRequest = runtime.request.mock.calls.filter(([request]) => request.requestKind === "POST_ADOPTION_QRY_CONTINUATION").at(-1)?.[0];
    expect(updateRequest.conversation.interactionContext).toMatchObject({
      projectVersion: updated.project?.versionId,
      projectDigest: updated.project?.projectDigest,
    });
  });

  it("Q04 the initial active need survives the handoff unchanged", async () => {
    installNominalRuntime();
    renderDemo();
    const session = await createInitialProject();
    const request = runtime.request.mock.calls.find(([candidate]) => candidate.requestKind === "POST_ADOPTION_QRY_CONTINUATION")?.[0];
    expect(request.conversation.interactionContext.informationNeedRefs).toEqual(session.queryNavigation?.currentAction?.navigationNeedRefs);
    expect(request.conversation.interactionContext.sourceActionRef).toBe(session.queryNavigation?.currentAction?.selectedActionId);
  });

  it("Q05 a failed natural mediation still returns the QRY-owned standard continuation after creation", async () => {
    installNominalRuntime({ failInitialContinuation: true });
    renderDemo();
    const session = await createInitialProject();
    const fallback = session.queryNavigation?.standardQuestion?.text;
    expect(fallback).toBeTruthy();
    expect(await screen.findByText(fallback!)).toBeInTheDocument();
    expect(session.bridgeTraces.at(-1)).toMatchObject({
      requestKind: "POST_ADOPTION_QRY_CONTINUATION",
      continuationPresentationSource: "QRY_STANDARD_FALLBACK",
      continuationMediationFailure: "PRODUCT_BRIDGE_UNAVAILABLE",
      calls: 0,
      projectVersionAfter: session.project?.versionId,
    });
  });

  it("Q06 a mediated continuation is returned after an existing Project update", async () => {
    installNominalRuntime();
    renderDemo();
    await createInitialProject();
    const session = await updateProject();
    expect(await screen.findByText(UPDATE_CONTINUATION)).toBeInTheDocument();
    expect(session.bridgeTraces.at(-1)?.continuationPresentationSource).toBe("GEMINI_MEDIATED");
  });

  it("Q07 each continuation occurs after its Project creation or update feedback", async () => {
    installNominalRuntime();
    renderDemo();
    const created = await createInitialProject();
    expect(created.entries.findIndex((entry) => entry.kind === "TEXT" && entry.content === INITIAL_CONTINUATION))
      .toBeGreaterThan(created.entries.findIndex((entry) => entry.kind === "TEXT" && entry.content === "Projet créé."));
    const updated = await updateProject();
    expect(updated.entries.findIndex((entry) => entry.kind === "TEXT" && entry.content === UPDATE_CONTINUATION))
      .toBeGreaterThan(updated.entries.findIndex((entry) => entry.kind === "TEXT" && entry.content === "Projet mis à jour."));
  });

  it("Q08 review cleanup preserves the continuation entry", async () => {
    installNominalRuntime();
    renderDemo();
    const session = await createInitialProject();
    expect(session.entries.some((entry) => entry.kind === "REVIEW" && entry.status === "CONFIRMED")).toBe(true);
    expect(session.entries.some((entry) => entry.kind === "TEXT" && entry.content === INITIAL_CONTINUATION)).toBe(true);
  });

  it("Q09 workspace reload preserves the visible continuation", async () => {
    installNominalRuntime();
    const first = renderDemo();
    await createInitialProject();
    first.unmount();
    renderDemo();
    expect(await screen.findByText(INITIAL_CONTINUATION)).toBeInTheDocument();
  });

  it("Q10 owner-governed pre-Project realization keeps message identities unique despite repeated provider text", async () => {
    installNominalRuntime({ duplicateReply: "Même contenu visible." });
    renderDemo();
    const session = await createInitialProject();
    expect(session.entries.filter((entry) => entry.kind === "TEXT" && entry.content === "Même contenu visible.")).toHaveLength(1);
    expect(session.entries.some((entry) => entry.kind === "TEXT" && entry.content.includes("Je conserve conjointement"))).toBe(true);
    expect(new Set(session.entries.map((entry) => entry.entryId)).size).toBe(session.entries.length);
    expect(await screen.findAllByText("Même contenu visible.")).toHaveLength(1);
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

  it("Q13 the nominal continuation remains one short principal question", async () => {
    installNominalRuntime();
    renderDemo();
    const session = await createInitialProject();
    const lastEntry = session.entries.at(-1);
    const content = lastEntry?.kind === "TEXT" ? lastEntry.content : "";
    expect(content.length).toBeLessThanOrEqual(240);
    expect((content.match(/\?/g) ?? [])).toHaveLength(1);
  });

  it("Q14 post-adoption continuation performs no Project write", async () => {
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
    await screen.findByText("Projet créé.");
    const projectAfterDecision = JSON.stringify(stored().project);
    expect(resolveContinuation).not.toBeNull();
    resolveContinuation!(responseWithoutPersistentDelta(stored().runtimeTurns, INITIAL_CONTINUATION));
    await screen.findByText(INITIAL_CONTINUATION);
    expect(JSON.stringify(stored().project)).toBe(projectAfterDecision);
    expect(stored().bridgeTraces.at(-1)).toMatchObject({ persistentExtractionCalled: false, calls: 1 });
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
      evaluatePersistentDelta: false,
    };
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: INITIAL_CONTINUATION }] } }],
      responseId: "qry-01-continuation",
    }), { status: 200, headers: { "content-type": "application/json" } })) as unknown as typeof fetch;
    const result = await executeProtocolDesignerBridge({ body: request, apiKey: "test-key", openAiApiKey: "unused", fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result.body).toMatchObject({
      assistantReply: INITIAL_CONTINUATION,
      persistentExtraction: { called: false, status: "NOT_REQUESTED" },
      observability: { conversationProvider: "GOOGLE_GEMINI", extractionProvider: null, calls: 1, projectWrites: 0 },
    });
  });

  it("Q16 Project and continuation remain exact after session reload", async () => {
    installNominalRuntime();
    renderDemo();
    const before = await createInitialProject();
    const reloaded = loadFunctionalResetSession(window.localStorage);
    expect(JSON.stringify(reloaded.project)).toBe(JSON.stringify(before.project));
    expect(reloaded.entries.at(-1)).toMatchObject({ kind: "TEXT", role: "NOXIA", content: INITIAL_CONTINUATION });
    expect(reloaded.queryNavigation).toMatchObject({
      projectVersion: reloaded.project?.versionId,
      projectDigest: reloaded.project?.projectDigest,
    });
    expect(within(screen.getByTestId("functional-research-project")).getByText("Version 1")).toBeInTheDocument();
  });

  it("QRY-03 E01-E05 schedules mediation from the committed adoption event", async () => {
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
        return responseWithoutPersistentDelta(request.conversation.turns, INITIAL_CONTINUATION);
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
    await screen.findByText(INITIAL_CONTINUATION);

    expect(adoptionCommittedBeforeRequest).toBe(true);
    expect(continuationRequests).toBe(1);
  });
});
