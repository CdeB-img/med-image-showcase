import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import type { ProductBridgeRequest, ProductBridgeResponse } from "@/features/protocol-designer/product-bridge";
import {
  behaviorContribution,
  behaviorItem,
} from "./p1-behavior-01a-contract-fixtures";
import { makeFunctionalResetBridgeResponse } from "./functional-reset-fixtures";
import {
  FUNCTIONAL_RESET_STORAGE_KEY,
  type FunctionalResetSession,
} from "../session";
import { buildStudyDeliverablePortfolio } from "@/features/document-projection";

const runtime = vi.hoisted(() => ({ bridge: vi.fn(), language: vi.fn() }));
vi.mock("@/features/protocol-designer/product-bridge-client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/protocol-designer/product-bridge-client")>();
  return {
    ...original,
    requestProtocolDesignerBridge: runtime.bridge,
    requestConversationLanguageProjection: runtime.language,
  };
});

const INITIAL = "je souhaite étudier les thrombus intraventriculaires gauches post IDM. ils sont souvent ratés a l'échographies et plus visibles à l'IRM. je voudrais donc faire un double protocole. évaluer le nombre de thrombus manqués à l'écho et detectés à l'IRM et évaluer le devenir clinique des patientss atteints de thrombus intra VG. pour cela nous allons nous concentrer sur les sus décalage ST antérieur";
const CORRECTED = "Je corrige et reformule le projet : je veux construire une étude sur les thrombus intra-VG après infarctus antérieur, avec deux objectifs distincts : évaluer les thrombus manqués à l’échographie et détectés à l’IRM ; évaluer le devenir clinique à 12 mois des patients atteints de thrombus intra-VG. La population est celle des patients avec sus-décalage ST antérieur.";
const STRUCTURE = "Je veux construire une étude unique à deux volets coordonnés pour conserver ces deux objectifs distincts.";
const FIRST_OBJECTIVE = "Évaluer les thrombus manqués à l’échographie et détectés à l’IRM";
const SECOND_OBJECTIVE = "Évaluer le devenir clinique à 12 mois des patients atteints de thrombus intra-VG";

const stored = () => JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!) as FunctionalResetSession;
const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
const submit = (text: string) => {
  fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
};

const fixtureResponse = (request: ProductBridgeRequest): ProductBridgeResponse => {
  const userTurns = request.conversation.turns.filter((turn) => turn.role === "USER");
  const turn = userTurns.at(-1)!;
  const isStructureUpdate = Boolean(request.currentProject);
  const contribution = behaviorContribution({
    contributionId: `contribution:v1-thrombus:${userTurns.length}`,
    previousContributionId: request.currentProject?.contributionRef ?? null,
    turns: [turn],
    candidateObjects: isStructureUpdate ? [
      behaviorItem({
        itemId: "study-design:coordinated-two-cohort",
        proposedType: "STUDY_DESIGN",
        content: "Étude unique à deux volets coordonnés",
        turnId: turn.turnId,
      }),
    ] : [
      behaviorItem({ itemId: "objective:detection", proposedType: "OBJECTIVE", content: FIRST_OBJECTIVE, turnId: turn.turnId, sourceText: FIRST_OBJECTIVE }),
      behaviorItem({ itemId: "objective:clinical-outcome", proposedType: "OBJECTIVE", content: userTurns.length === 1 ? "Évaluer le devenir clinique des patients atteints de thrombus intra-VG" : SECOND_OBJECTIVE, turnId: turn.turnId }),
      behaviorItem({ itemId: "population:anterior-st-elevation", proposedType: "POPULATION", content: "Patients avec sus-décalage ST antérieur", turnId: turn.turnId }),
      behaviorItem({ itemId: "condition:post-myocardial-infarction", proposedType: "CONDITION", content: "Thrombus intra-VG après infarctus antérieur", turnId: turn.turnId }),
      behaviorItem({ itemId: "modality:echocardiography", proposedType: "MODALITY", content: "échographie", turnId: turn.turnId }),
      behaviorItem({ itemId: "modality:mri", proposedType: "MODALITY", content: "IRM", turnId: turn.turnId }),
    ],
  });
  contribution.source.conversationId = request.conversation.conversationId;
  const response = makeFunctionalResetBridgeResponse(
    request.conversation.turns,
    contribution,
    "Je vous présente une première structure réversible pour revue.",
  );
  return {
    ...response,
    observability: {
      ...response.observability,
      model: "LOCAL_V1_THROMBUS_FIXTURE",
      conversationLatencyMs: 0,
      extractionLatencyMs: 0,
      conversationCalls: 0,
      conversationResponseReceived: false,
      calls: 0,
    },
  };
};

describe("V1 — verticale Standard continue thrombus intra-VG", () => {
  beforeEach(() => {
    window.localStorage.clear();
    runtime.bridge.mockReset();
    runtime.language.mockReset();
    runtime.bridge.mockImplementation(async (request: ProductBridgeRequest) => fixtureResponse(request));
    vi.spyOn(console, "debug").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("V1_THROMBUS_NETWORK_FORBIDDEN"); }));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("goes from free text to useful science, human revisions, versioned Project and an exportable working protocol", async () => {
    renderDemo();

    submit(INITIAL);
    expect((await screen.findAllByText(/Souhaitez-vous réunir les objectifs/)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Évaluer les thrombus manqués à l’échographie et détectés à l’IRM/).length).toBeGreaterThan(0);
    const firstReview = await screen.findByTestId("functional-contribution-review");
    expect(within(firstReview).getByText(FIRST_OBJECTIVE)).toBeInTheDocument();
    expect(stored().project).toBeNull();
    expect(stored().bridgeTraces.at(-1)?.preProjectTrace?.points.find((point) => point.point === "ASK_VS_PROPOSE_DECISION")).toMatchObject({
      action: "ASK_QUESTION",
      owner: "QUERY_NAVIGATION",
    });

    fireEvent.click(screen.getByRole("button", { name: "Refuser cette proposition" }));
    await screen.findByText("Proposition refusée. Le Research Project est inchangé.");
    expect(stored().project).toBeNull();

    submit(CORRECTED);
    expect((await screen.findAllByText(/Évaluer le devenir clinique à 12 mois/)).length).toBeGreaterThan(0);
    await waitFor(() => expect(screen.getAllByTestId("functional-contribution-review")).toHaveLength(2));
    fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));
    await screen.findByText("Projet créé.");
    await waitFor(() => expect(stored().project?.revision).toBe(1));
    await waitFor(() => expect(screen.getAllByText(/Souhaitez-vous réunir les objectifs/).length).toBeGreaterThanOrEqual(2));
    expect(stored().scientificThinkingInteraction).toMatchObject({ status: "ACTIVE", projectWriteAuthorized: false });

    submit(STRUCTURE);
    await waitFor(() => expect(screen.getAllByTestId("functional-contribution-review")).toHaveLength(3));
    fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));
    await screen.findByText("Projet mis à jour.");
    await waitFor(() => expect(stored().project?.revision).toBe(2));
    const project = stored().project!;
    const currentObjects = project.canonicalState.objects.filter((object) => object.actuality === "CURRENT");
    expect(currentObjects.filter((object) => object.objectType === "OBJECTIVE").map((object) => object.content)).toEqual([FIRST_OBJECTIVE, SECOND_OBJECTIVE]);
    expect(currentObjects).toContainEqual(expect.objectContaining({ objectType: "STUDY_DESIGN", content: "Étude unique à deux volets coordonnés" }));

    submit("Affiche-moi un premier protocole de travail.");
    const preview = await screen.findByTestId("functional-protocol-preview");
    expect(within(preview).getByText("PROTOCOLE DE TRAVAIL")).toBeInTheDocument();
    expect(within(preview).getByText(/Research Project version 2/)).toBeInTheDocument();
    expect(within(preview).getByRole("button", { name: "Télécharger le protocole (.html)" })).toBeInTheDocument();
    expect(preview.textContent).toContain(FIRST_OBJECTIVE);
    expect(preview.textContent).toContain(SECOND_OBJECTIVE);

    const session = stored();
    const protocolProjection = session.documents.projections.find((projection) => projection.source.projectVersion === project.versionId)!;
    const portfolio = buildStudyDeliverablePortfolio({ project, protocolProjection, generatedAt: protocolProjection.requestedAt });
    const synopsis = portfolio.artifacts.find((item) => item.kind === "PROTOCOL_SYNOPSIS")!;
    expect(synopsis.files[0]?.content).toContain(FIRST_OBJECTIVE);
    expect(synopsis.files[0]?.content).toContain(SECOND_OBJECTIVE);
    expect(synopsis.files[0]?.content).not.toContain("fibrose myocardique");
    expect(portfolio.artifacts.find((item) => item.kind === "IMAGING_CORE_LAB_MANUAL")).toMatchObject({ status: "PARTIAL" });
    expect(portfolio.artifacts.find((item) => item.kind === "CRF")).toMatchObject({ status: "MISSING_DECISION" });

    fireEvent.click(within(preview).getByRole("button", { name: "Retour à la conversation" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Ouvrir les livrables de l’étude" })[0]!);
    expect(await screen.findByTestId("study-deliverable-workspace")).toHaveTextContent(FIRST_OBJECTIVE);

    expect(runtime.language).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(document.body.textContent).not.toMatch(/ownerResultRef|traceRunId|SCIENTIFIC_THINKING_PROPOSAL|QUERY_NAVIGATION/);
  });
});
