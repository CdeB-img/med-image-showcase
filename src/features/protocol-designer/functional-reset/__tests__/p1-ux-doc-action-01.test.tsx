import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import {
  createEmptyFunctionalResetDocumentPortfolio,
  refreshFunctionalResetDocumentPortfolio,
  type FunctionalResetDocumentPortfolio,
} from "@/features/document-projection";
import { buildFunctionalResetQueryNavigation } from "@/features/query-navigation/functional-reset-progression";
import { authorizeResearchProjectDocumentHandoff, type ResearchProjectOwnerProjection } from "@/features/research-project-construction";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import {
  recognizeProductDocumentAction,
  type ProductDocumentAction,
} from "../product-entry-routing";
import {
  createFunctionalResetSession,
  FUNCTIONAL_RESET_STORAGE_KEY,
  persistFunctionalResetSession,
  type FunctionalResetSession,
} from "../session";
import {
  adoptBehaviorContribution,
  behaviorAuthority,
  behaviorContribution,
  behaviorItem,
  behaviorTurn,
} from "./p1-behavior-01a-contract-fixtures";

const runtime = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@/features/protocol-designer/product-bridge-client", () => ({
  requestProtocolDesignerBridge: runtime.request,
}));

const AT = "2026-09-01T11:00:00.000Z";
const initialTurn = behaviorTurn(
  "turn:p1-ux-doc-action:initial",
  "Construire une étude générique répondant à la question Q dans la population P.",
);

const projectV1 = () => adoptBehaviorContribution(behaviorContribution({
  contributionId: "contribution:p1-ux-doc-action:v1",
  turns: [initialTurn],
  candidateObjects: [
    behaviorItem({ itemId: "question:q", proposedType: "SCIENTIFIC_QUESTION", content: "La caractéristique E est-elle associée au résultat R dans la population P ?", turnId: initialTurn.turnId }),
    behaviorItem({ itemId: "objective:q", proposedType: "OBJECTIVE", content: "Estimer l’association entre E et R", studyRole: "PRIMARY_OBJECTIVE", turnId: initialTurn.turnId }),
    behaviorItem({ itemId: "population:p", proposedType: "POPULATION", content: "Population P définie par la condition C, avec âge, éligibilité, critères d’inclusion et d’exclusion explicites", turnId: initialTurn.turnId }),
    behaviorItem({ itemId: "intervention:x", proposedType: "INTERVENTION", content: "Intervention X", turnId: initialTurn.turnId }),
    behaviorItem({ itemId: "comparator:c", proposedType: "COMPARATOR", content: "Comparateur C", turnId: initialTurn.turnId }),
    behaviorItem({ itemId: "measurement:r", proposedType: "MEASUREMENT", content: "Critère principal R", studyRole: "PRIMARY_ENDPOINT", turnId: initialTurn.turnId }),
    behaviorItem({ itemId: "imaging:m", proposedType: "ACQUISITION", content: "Modalité IRM et rôle d’acquisition", turnId: initialTurn.turnId }),
    behaviorItem({ itemId: "analysis:a", proposedType: "ANALYSIS", content: "Objectif d’analyse statistique de l’association", turnId: initialTurn.turnId }),
  ],
  temporalElements: [
    behaviorItem({ itemId: "time:t1", proposedType: "TIMEPOINT", content: "Mesure à T1", turnId: initialTurn.turnId }),
  ],
}), null, 1);

const projectV2 = (current: ResearchProjectOwnerProjection) => {
  const turn = behaviorTurn("turn:p1-ux-doc-action:update", "Ajouter la mesure M au projet.");
  return adoptBehaviorContribution(behaviorContribution({
    contributionId: "contribution:p1-ux-doc-action:v2",
    previousContributionId: current.contributionRef,
    turns: [turn],
    candidateObjects: [
      behaviorItem({ itemId: "measurement:m", proposedType: "CANONICAL_VARIABLE", content: "Mesure M", turnId: turn.turnId }),
    ],
  }), current, 2);
};

const protocolFor = (project: ResearchProjectOwnerProjection) => refreshFunctionalResetDocumentPortfolio({
  project,
  previous: createEmptyFunctionalResetDocumentPortfolio(),
  handoffDecision: authorizeResearchProjectDocumentHandoff({ project, authority: behaviorAuthority, confirmedAt: AT }),
  requestedAt: AT,
  generateProtocol: true,
});

const inspectedDocuments = (project: ResearchProjectOwnerProjection) => refreshFunctionalResetDocumentPortfolio({
  project,
  previous: createEmptyFunctionalResetDocumentPortfolio(),
  requestedAt: AT,
});

const sessionFor = (
  project: ResearchProjectOwnerProjection | null,
  documents: FunctionalResetDocumentPortfolio = createEmptyFunctionalResetDocumentPortfolio(),
) => {
  const session = createFunctionalResetSession(AT);
  const queryNavigation = project ? buildFunctionalResetQueryNavigation({ project, recordedAt: AT }) : null;
  const hydrated: FunctionalResetSession = {
    ...session,
    projectId: project?.projectId ?? session.projectId,
    project,
    queryNavigation,
    documents,
  };
  persistFunctionalResetSession(window.localStorage, hydrated);
  return hydrated;
};

const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);

const submit = (content: string) => {
  fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: content } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
};

const stored = () => JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!) as FunctionalResetSession;

describe("P1-UX-DOC-ACTION-01 — natural-language protocol actions", () => {
  beforeEach(() => {
    window.localStorage.clear();
    runtime.request.mockReset();
    runtime.request.mockRejectedValue(new Error("PRODUCT_DOCUMENT_ACTION_MUST_NOT_CALL_PROVIDER"));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("recognizes only the finite unambiguous product-command family", () => {
    const cases: Array<[string, ProductDocumentAction]> = [
      ["affiche le protocole", "OPEN_CURRENT_PROTOCOL"],
      ["montre-moi le protocole", "OPEN_CURRENT_PROTOCOL"],
      ["ouvre le protocole", "OPEN_CURRENT_PROTOCOL"],
      ["ok affiche le protocole partiel", "OPEN_CURRENT_PROTOCOL"],
      ["montre-moi l’aperçu du protocole", "OPEN_CURRENT_PROTOCOL"],
      ["crée un aperçu du protocole", "CREATE_PROTOCOL"],
      ["génère le protocole partiel", "CREATE_PROTOCOL"],
      ["affiche-moi un premier protocole de travail", "CREATE_PROTOCOL"],
      ["actualise le protocole", "REGENERATE_PROTOCOL"],
      ["mets à jour l’aperçu", "REGENERATE_PROTOCOL"],
      ["régénère le protocole avec la dernière version du projet", "REGENERATE_PROTOCOL"],
      ["télécharge le protocole", "DOWNLOAD_PROTOCOL"],
    ];
    cases.forEach(([source, expected]) => expect(recognizeProductDocumentAction(source), source).toBe(expected));

    for (const scientific of [
      "je voudrais modifier le protocole pour ajouter une IRM à J5",
      "je veux ajouter une IRM au protocole",
      "dans le protocole je veux exclure les patients de plus de 80 ans",
      "le protocole devrait comparer deux groupes",
      "je voudrais faire un protocole prospectif",
      "que doit contenir le protocole ?",
    ]) {
      expect(recognizeProductDocumentAction(scientific), scientific).toBeNull();
    }
  });

  it.each([
    "ok affiche le protocole partiel",
    "montre-moi l’aperçu du protocole",
  ])("opens P1 for an explicit display command without consuming QRY or invoking extraction: %s", async (command) => {
    const project = projectV1();
    const documents = protocolFor(project);
    const p1 = documents.projections.at(-1)!;
    const before = sessionFor(project, documents);
    expect(before.queryNavigation?.currentAction?.affectedDecisionRefs).toContain("project-section:DESIGN");
    renderDemo();

    submit(command);

    expect(await screen.findByTestId("functional-protocol-preview")).toBeInTheDocument();
    await waitFor(() => expect(stored().openDocumentProjectionId).toBe(p1.projectionId));
    const after = stored();
    expect(runtime.request).not.toHaveBeenCalled();
    expect(after.project?.versionId).toBe(project.versionId);
    expect(after.project?.projectDigest).toBe(project.projectDigest);
    expect(after.documents.projections).toEqual(documents.projections);
    expect(after.queryNavigation).toEqual(before.queryNavigation);
    expect(after.runtimeTurns).toEqual(before.runtimeTurns);
    expect(after.bridgeTraces).toEqual(before.bridgeTraces);
    expect(after.pendingContribution).toBeNull();
    expect(after.entries.at(-1)).toMatchObject({ role: "NOXIA", content: "Voici la version actuelle du protocole." });
  });

  it("leaves a scientific protocol modification on the normal conversation corridor", async () => {
    const project = projectV1();
    const before = sessionFor(project, protocolFor(project));
    renderDemo();

    submit("je veux ajouter une IRM au protocole");

    await waitFor(() => expect(runtime.request).toHaveBeenCalledTimes(1));
    const after = stored();
    expect(after.runtimeTurns).toHaveLength(before.runtimeTurns.length + 1);
    expect(after.runtimeTurns.at(-1)).toMatchObject({ role: "USER", content: "je veux ajouter une IRM au protocole" });
    expect(after.openDocumentProjectionId).toBeNull();
    expect(after.documents.projections).toEqual(before.documents.projections);
  });

  it("creates one P1 from an explicit text authorization by reusing the existing handoff", async () => {
    const project = projectV1();
    const before = sessionFor(project, inspectedDocuments(project));
    renderDemo();

    submit("crée un aperçu du protocole");

    expect(await screen.findByTestId("functional-protocol-preview")).toBeInTheDocument();
    await waitFor(() => expect(stored().documents.projections).toHaveLength(1));
    const after = stored();
    const p1 = after.documents.projections[0]!;
    expect(runtime.request).not.toHaveBeenCalled();
    expect(p1.source.projectVersion).toBe(project.versionId);
    expect(p1.humanDecisions.filter((decision) => decision.gateId === "PRJ-GATE-DOCUMENT-WORKING-PROJECTION")).toHaveLength(1);
    expect(after.project).toEqual(before.project);
    expect(after.queryNavigation).toEqual(before.queryNavigation);
    expect(after.runtimeTurns).toEqual(before.runtimeTurns);
    expect(after.bridgeTraces).toEqual(before.bridgeTraces);
  });

  it("regenerates stale P1 as P2 while preserving P1 and Project v2", async () => {
    const firstProject = projectV1();
    const documentsV1 = protocolFor(firstProject);
    const p1 = documentsV1.projections[0]!;
    const currentProject = projectV2(firstProject);
    const stale = refreshFunctionalResetDocumentPortfolio({
      project: currentProject,
      previous: documentsV1,
      requestedAt: "2026-09-01T11:02:00.000Z",
    });
    const before = sessionFor(currentProject, stale);
    renderDemo();

    submit("actualise le protocole");

    expect(await screen.findByTestId("functional-protocol-preview")).toBeInTheDocument();
    await waitFor(() => expect(stored().documents.projections).toHaveLength(2));
    const after = stored();
    const p2 = after.documents.projections[1]!;
    expect(runtime.request).not.toHaveBeenCalled();
    expect(after.documents.projections[0]).toEqual(p1);
    expect(p2.projectionId).not.toBe(p1.projectionId);
    expect(p2.priorProjectionId).toBe(p1.projectionId);
    expect(p2.source.projectVersion).toBe(currentProject.versionId);
    expect(after.project).toEqual(before.project);
    expect(after.queryNavigation).toEqual(before.queryNavigation);
    expect(after.runtimeTurns).toEqual(before.runtimeTurns);
    expect(after.bridgeTraces).toEqual(before.bridgeTraces);
  });

  it("returns the existing no-Project product state without provider, QRY or fake document", async () => {
    const before = sessionFor(null);
    renderDemo();

    submit("affiche le protocole");

    expect(await screen.findByText("Un Research Project confirmé est nécessaire avant de pouvoir afficher un aperçu du protocole.")).toBeInTheDocument();
    await waitFor(() => expect(stored().entries.length).toBe(before.entries.length + 2));
    const after = stored();
    expect(runtime.request).not.toHaveBeenCalled();
    expect(after.project).toBeNull();
    expect(after.queryNavigation).toBeNull();
    expect(after.documents.projections).toEqual([]);
    expect(after.runtimeTurns).toEqual(before.runtimeTurns);
    expect(after.bridgeTraces).toEqual(before.bridgeTraces);
  });

  it("keeps download deterministic and provider-free while deferring browser download orchestration", async () => {
    const project = projectV1();
    const documents = protocolFor(project);
    sessionFor(project, documents);
    renderDemo();

    submit("télécharge le protocole");

    const preview = await screen.findByTestId("functional-protocol-preview");
    expect(within(preview).getByRole("button", { name: "Télécharger le protocole (.html)" })).toBeInTheDocument();
    expect(runtime.request).not.toHaveBeenCalled();
  });
});
