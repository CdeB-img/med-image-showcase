import { offlineArchiveClient, resetOfflineArchiveClients } from "@/features/document-projection/__tests__/offline-archive-client";
import { archivedProtocol, openArchivedProtocolPreview, requestTechnicalProjection } from "@/features/document-projection/__tests__/archive-ui-test-adapter";
import { loadFunctionalResetSession as readPersistedSessionForTest } from "@/features/protocol-designer/functional-reset/session";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import { HYBRID_PRIMARY_RUNTIME_VERSION } from "@/features/scientific-interpretation/hybrid-primary";
import type {
  ScientificInterpretationContributionEnvelope,
  ScientificInterpretationTurn,
} from "@/features/scientific-interpretation/contracts";
import { FUNCTIONAL_RESET_STORAGE_KEY } from "../session";
import {
  COLCHICINE_03A_INITIAL,
  COLCHICINE_03A_MODIFICATION,
  makeFunctionalResetBridgeResponse,
  makeFunctionalResetBridgeResponseForRequest,
  makeFunctionalResetContribution,
} from "./functional-reset-fixtures";

vi.mock("@/features/document-projection/generation-archive-client", async original => ({ ...await original<object>(), createDocumentArchiveClient: offlineArchiveClient }));
const runtime = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@/features/protocol-designer/product-bridge-client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/features/protocol-designer/product-bridge-client")>(),
  requestProtocolDesignerBridge: runtime.request,
}));

const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);

const submit = (content: string) => {
  fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: content } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
};

const waitForProposal = () => screen.findByTestId("functional-contribution-review");

const confirm = async () => {
  const callsBefore = runtime.request.mock.calls.length;
  const revisionBefore = storedSession().project?.revision ?? 0;
  fireEvent.click(screen.getByRole("button", { name: "Confirmer les choix et enregistrer" }));
  await waitFor(() => expect(storedSession().project?.revision).toBe(revisionBefore + 1));
  expect(runtime.request).toHaveBeenCalledTimes(callsBefore);
};

const storedSession = () => readPersistedSessionForTest(window.localStorage, FUNCTIONAL_RESET_STORAGE_KEY, true);

describe("FUNCTIONAL-RESET-03A — boucle conversationnelle Project", () => {
  beforeEach(() => {
    window.localStorage.clear(); resetOfflineArchiveClients();
    runtime.request.mockReset();
    runtime.request.mockImplementation(async (request) => makeFunctionalResetBridgeResponseForRequest(request));
  });
  afterEach(cleanup);

  it("FR03A-C01 — une première phrase produit une structure lisible", async () => {
    renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    await waitForProposal();

    const proposal = screen.getByTestId("functional-contribution-review");
    for (const label of ["Design", "Intervention / comparateur", "Évaluations / critère principal"]) {
      expect(within(proposal).getByText(label)).toBeInTheDocument();
    }
    // CURRENT_SEMANTIC_INVARIANT: original science unchanged; technical evidence is Expert-only.
    fireEvent.click(screen.getByLabelText("Plus d’options"));
    fireEvent.click(screen.getByRole("button", { name: "Diagnostic technique" }));
    fireEvent.click(within(proposal).getByText("Voir les détails"));
    await screen.findByTestId("review-audit-detail");
    for (const label of ["Population", "Design", "Intervention / comparateur", "Évaluations / critère principal"]) {
      expect(within(proposal).getAllByText(label).length).toBeGreaterThan(0);
    }
    for (const value of ["Infarctus du myocarde", "Colchicine", "Placebo", "Étude multicentrique", "IRM", "Inflammation", "Lésions myocardiques"]) {
      expect(within(proposal).getAllByText(value).length).toBeGreaterThan(0);
    }
    expect(within(proposal).queryByText(/biomarqueurs sanguins|taille de l’infarctus/i)).toBeNull();
  });

  it("FR03A-C02 — la Contribution reste candidate avant confirmation", async () => {
    renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    await waitForProposal();

    const session = storedSession();
    expect(session.project).toBeNull();
    expect(session.pendingContribution).toMatchObject({
      identity: {
        runtimeId: "HYBRID_PRIMARY_STRUCTURED",
        runtimeVersion: HYBRID_PRIMARY_RUNTIME_VERSION,
      },
      epistemicBoundary: { candidateIsAdopted: false, projectOwnershipTransferred: false },
      decisionBoundary: { projectWriteAuthorized: false },
    });
    expect(screen.getByRole("button", { name: "Confirmer les choix et enregistrer" })).toBeInTheDocument();
  });

  it("FR03A-C03 — la confirmation crée le Project via la frontière existante", async () => {
    renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    await waitForProposal();
    await confirm();

    expect(await screen.findByText("Choix enregistrés dans le projet.")).toBeInTheDocument();
    expect(storedSession().project).toMatchObject({
      boundary: "PRJ_001_CONTRIBUTION_INTAKE_ADAPTER",
      owner: "RESEARCH_PROJECT",
      revision: 1,
      confirmationDecision: { status: "ADOPTED", mandate: "PROJECT_OWNER", engineSource: "RESEARCH_PROJECT" },
    });
    expect(storedSession().pendingContribution).toBeNull();
  });

  it("FR03A-C04 — une modification conversationnelle crée une nouvelle version Project", async () => {
    renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    await waitForProposal();
    await confirm();
    const versionOne = storedSession().project!.versionId;

    submit(COLCHICINE_03A_MODIFICATION);
    await screen.findByTestId("standard-update-review-summary");
    await confirm();

    const project = storedSession().project!;
    expect(project).toMatchObject({ revision: 2, previousVersionId: versionOne });
    const contents = project.sections.flatMap((section) => section.elements.map((element) => element.content));
    expect(contents).toEqual(expect.arrayContaining(["Âge maximal : 75 ans", "IRM : J3–J5", "colchicine", "placebo", "inflammation", "lésions myocardiques"]));
    expect(screen.getAllByText("Choix enregistrés dans le projet.")).toHaveLength(2);
  });

  it("FR03A-C05 — plusieurs modifications dans une réponse sont supportées", async () => {
    renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    await waitForProposal();
    await confirm();

    submit(COLCHICINE_03A_MODIFICATION);
    const proposal = await screen.findByTestId("standard-update-review-summary");
    expect(within(proposal).getByText("Population")).toBeInTheDocument();
    expect(within(proposal).getByText("Calendrier")).toBeInTheDocument();
    expect(within(proposal).getByText("Âge maximal : 75 ans")).toBeInTheDocument();
    expect(within(proposal).getByText("IRM : J3–J5")).toBeInTheDocument();
  });

  it("FR03A-C06 — une réponse partielle conserve les inconnues sans les promouvoir dans le Project", async () => {
    renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    await waitForProposal();
    await confirm();

    runtime.request.mockImplementationOnce(async ({ conversation }: { conversation: { turns: ScientificInterpretationTurn[] } }) => makeFunctionalResetBridgeResponse(
      conversation.turns,
      null,
      "Ce point reste ouvert dans le projet. Nous pouvons le laisser indéterminé pour le moment.",
    ));
    submit("Le critère principal reste à définir.");
    await screen.findByText(/Ce point reste ouvert dans le projet/);
    expect(screen.queryByRole("button", { name: "Confirmer les choix et enregistrer" })).toBeNull();

    const session = storedSession();
    expect(session.project?.revision).toBe(1);
    expect(session.project!.sections.flatMap((section) => section.elements)).toEqual(expect.arrayContaining([
      expect.objectContaining({ content: "colchicine" }),
      expect.objectContaining({ content: "placebo" }),
    ]));
    expect(session.project!.sections.flatMap((section) => section.elements)).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ content: "critère principal encore à définir" }),
    ]));
    expect(session.queryNavigation?.owner).toBe("QUERY_NAVIGATION");
  });

  it("FR03A-C07 — le Project Panel reste visible dans la boucle", async () => {
    renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    await waitForProposal();
    await confirm();

    const project = screen.getByTestId("functional-research-project");
    expect(project).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Conversation" })).toBeInTheDocument();
  });

  it("FR03A-C08 — aucun vocabulaire moteur n’apparaît en Standard", async () => {
    renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    await waitForProposal();
    await confirm();

    const visibleProduct = screen.getByTestId("functional-reset-workspace").textContent ?? "";
    expect(visibleProduct).not.toMatch(/\b(?:enum|candidate state|owner|digest|handoff|gate|branch|pattern|DOC-\d+|TMP-\d+|Guided Intake|Actor|Mandate)\b/i);
  });

  it("FR03A-C09 — le Protocol Preview reste une projection DOC", async () => {
    renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    await waitForProposal();
    await confirm();
    const project = screen.getByTestId("functional-research-project");
    await requestTechnicalProjection();

    const preview = await openArchivedProtocolPreview();
    expect(within(preview).getByRole("heading", { name: "PROTOCOLE DE TRAVAIL" })).toBeInTheDocument();
    for (const heading of ["Question scientifique", "Objectifs", "Population", "Design", "Intervention", "Comparateur", "Imagerie", "Mesures", "Temporalité", "Analyse", "Points restant à préciser"]) {
      expect(within(preview).getByRole("heading", { name: heading })).toBeInTheDocument();
    }
    for (const value of [/colchicine/i, /placebo/i, /IRM/i, /inflammation/i, /lésions/i]) {
      expect(within(preview).getAllByText(value).length).toBeGreaterThan(0);
    }
    expect(preview.textContent).not.toMatch(/DOC-\d+|TMP-\d+|projectDigest|handoff|owner/i);

    const session = storedSession();
    expect(session.documents.owner).toBe("DOC-001");
    expect(session.documents.projections).toEqual([]);
    expect(await archivedProtocol(session)).toMatchObject({
      projectionType: "PROTOCOL",
      ownership: { structure: "TMP-001", content: "RESEARCH_PROJECT_AND_UPSTREAM_OWNERS", editorialForm: "DOC-001" },
      source: { projectVersion: session.project!.versionId },
      boundary: "READ_ONLY_PROJECTION_NOT_PROJECT_TRUTH_NOT_CLINICAL_PROTOCOL",
    });
  });

  it("FR03A-C10 — le pont conversationnel remplace l'appel SEM nominal", async () => {
    expect(HYBRID_PRIMARY_RUNTIME_VERSION).toBe("1.3.10");
    renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    await waitForProposal();

    expect(runtime.request).toHaveBeenCalledWith(expect.objectContaining({
      currentProject: null,
      evaluatePersistentDelta: true,
      conversation: expect.objectContaining({ language: "fr" }),
    }));
    expect(storedSession().pendingContribution).not.toBeNull();
  });
});
