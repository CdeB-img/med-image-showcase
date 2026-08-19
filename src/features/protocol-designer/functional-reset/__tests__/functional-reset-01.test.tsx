import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import type {
  ContributionEpistemicBoundary,
  ScientificContributionItem,
  ScientificInterpretationContributionEnvelope,
  ScientificInterpretationTurn,
} from "@/features/scientific-interpretation/contracts";
import { FUNCTIONAL_RESET_STORAGE_KEY } from "../session";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";

const runtime = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@/features/scientific-interpretation/client", () => ({
  requestScientificInterpretationRuntime: runtime.request,
}));

const INITIAL = "Je veux étudier l’effet de la colchicine après infarctus du myocarde, notamment sur l’inflammation et les lésions en IRM, dans une étude multicentrique comparant colchicine et placebo. Je veux également prévoir des biomarqueurs sanguins et mesurer la taille de l’infarctus à l’IRM.";
const MODIFICATION = "Je veux faire l’IRM entre J3 et J5 et limiter l’âge à 75 ans.";

const boundary = (turnId: string): ContributionEpistemicBoundary => ({
  ownership: "SCIENTIFIC_INTERPRETATION",
  epistemicStatus: "EXPLICIT_USER_STATED",
  adoptionStatus: "CANDIDATE",
  activeState: true,
  sourceTurnIds: [turnId],
  sourceText: null,
});

const item = (itemId: string, proposedType: string, content: string, turnId: string, studyRole: string | null = null): ScientificContributionItem => ({
  itemId,
  semanticIdentity: itemId,
  proposedType,
  content,
  polarity: "AFFIRMED",
  studyRole,
  confidence: 1,
  epistemicBoundary: boundary(turnId),
});

const contribution = (turns: ScientificInterpretationTurn[]): ScientificInterpretationContributionEnvelope => {
  const firstTurn = turns[0]!.turnId;
  const lastTurn = turns.at(-1)!.turnId;
  const initialItems = [
    item("condition:idm", "CONDITION", "infarctus du myocarde", firstTurn),
    item("intervention:colchicine", "INTERVENTION", "colchicine", firstTurn, "INTERVENTION_ARM"),
    item("comparator:placebo", "COMPARATOR", "placebo", firstTurn, "COMPARATOR_ARM"),
    item("design:multicentric", "STUDY_DESIGN", "étude multicentrique", firstTurn),
    item("modality:mri", "MODALITY", "IRM", firstTurn),
    item("measure:inflammation", "MEASURED_VARIABLE", "inflammation", firstTurn),
    item("measure:lesions", "MEASURED_VARIABLE", "lésions myocardiques", firstTurn),
    item("biomarker:blood", "BIOMARKER", "biomarqueurs sanguins", firstTurn),
    item("endpoint:infarct-size", "ENDPOINT", "taille de l’infarctus", firstTurn),
  ];
  const modificationItems = turns.length > 1 ? [
    item("timing:mri", "TEMPORAL_ELEMENT", "IRM entre J3 et J5", lastTurn),
    item("criterion:age", "POPULATION_CRITERION", "âge maximal 75 ans", lastTurn),
  ] : [];
  const allItems = [...initialItems, ...modificationItems];
  const contributionId = turns.length > 1 ? "contribution:colchicine-v2" : "contribution:colchicine-v1";
  return {
    contract: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ENVELOPE",
    contractNature: "RUNTIME_CONTRIBUTION_NOT_PD003_ROOT",
    identity: {
      contributionId,
      previousContributionId: turns.length > 1 ? "contribution:colchicine-v1" : null,
      contractVersion: "1.0.0",
      runtimeId: "HYBRID_PRIMARY_STRUCTURED",
      runtimeVersion: "1.3.6",
      createdAt: "2026-08-19T10:00:00.000Z",
      contributionDigest: `${contributionId}:digest`,
    },
    source: {
      conversationId: "conversation:test",
      originalRequest: turns.at(-1)!.content,
      turns,
      sourceRefs: turns.map((turn) => turn.turnId),
      rawOutputRef: "raw:test",
      rawOutputDigest: "raw:digest",
    },
    runtimeEvidence: {
      provider: "TEST",
      model: "TEST",
      promptDigest: "prompt",
      schemaDigest: "schema",
      configurationDigest: "configuration",
      technicalStatus: "STRUCTURED_CONTRACT_VALID",
      parseStatus: "PARSED",
      validationErrors: [],
    },
    scientificContent: {
      normalizedUnderstanding: turns.length > 1
        ? "Conserver l’étude confirmée et ajouter une IRM entre J3 et J5 avec un âge maximal de 75 ans."
        : "Évaluer l’effet de la colchicine après infarctus du myocarde, dans une étude multicentrique versus placebo, avec mesures IRM et biologiques.",
      routeProposal: null,
      explicitStatements: [],
      candidateObjects: allItems.filter((value) => value.proposedType !== "TEMPORAL_ELEMENT"),
      candidateRelations: [{
        relationId: "relation:comparison",
        relationType: "COMPARES_WITH",
        sourceItemId: "intervention:colchicine",
        targetItemId: "comparator:placebo",
        polarity: "AFFIRMED",
        confidence: 1,
        epistemicBoundary: boundary(firstTurn),
      }],
      inferredContext: [],
      contextualCandidates: [],
      negationsAndConstraints: [],
      temporalElements: modificationItems.filter((value) => value.proposedType === "TEMPORAL_ELEMENT"),
      ambiguities: [],
      unknowns: [],
      missingInformation: [],
      correctionsAndSupersessions: [],
      openDecisions: [],
      clarificationNeeds: [],
    },
    epistemicBoundary: {
      candidateIsAdopted: false,
      knowledgeSupportIsProjectDecision: false,
      projectOwnershipTransferred: false,
      humanDecisionEnvelopeRef: null,
    },
    mapping: [],
    audit: { deterministicFindings: [], semanticAuditFindings: [], unresolvedFindings: [] },
    decisionBoundary: {
      decisionRequired: true,
      decisionEnvelopeRef: null,
      permittedHumanDispositions: ["ACCEPT_WORKING_BASIS", "REJECT", "DEFER", "REOPEN", "PARTIAL_SELECTION", "ROUTE_TO_SPECIALIST"],
      projectWriteAuthorized: false,
    },
  };
};

const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);

describe("FUNCTIONAL-RESET-01 — nominal Protocol Designer", () => {
  beforeEach(() => {
    window.localStorage.clear();
    runtime.request.mockReset();
    runtime.request.mockImplementation(async ({ conversation }: { conversation: { turns: ScientificInterpretationTurn[] } }) => ({ contribution: contribution(conversation.turns) }));
  });
  afterEach(cleanup);

  it("starts with one conversation, one Project panel and honest document states", () => {
    renderDemo();
    expect(screen.getByTestId("functional-reset-workspace")).toBeInTheDocument();
    expect(screen.getByText(/Décris-moi le projet de recherche/)).toHaveTextContent(/Tu peux partir d’une idée simple/);
    expect(screen.getByLabelText("Votre message")).toBeInTheDocument();
    const project = screen.getByTestId("functional-research-project");
    for (const label of ["Question", "Population", "Design", "Intervention", "Comparateur", "Imagerie", "Mesures / biomarqueurs", "Analyse", "Documents"]) {
      expect(within(project).getByText(label)).toBeInTheDocument();
    }
    expect(within(project).getByText("Pas encore générable")).toBeInTheDocument();
    expect(within(project).getByText("Informations insuffisantes")).toBeInTheDocument();
    expect(within(project).getByText("Analyse non définie")).toBeInTheDocument();
    expect(screen.queryByText(/Actor|Mandate|Branch|Gate|Guided Intake|Orientation/)).toBeNull();
  });

  it("creates and then updates the Project through two explicit confirmations", async () => {
    const firstRender = renderDemo();
    const composer = screen.getByLabelText("Votre message");
    fireEvent.change(composer, { target: { value: INITIAL } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    expect(await screen.findByRole("heading", { name: "Voici ce que j’ai compris" })).toBeInTheDocument();
    expect(runtime.request).toHaveBeenLastCalledWith(expect.objectContaining({ previousContribution: null }));
    expect(screen.getByText("lésions myocardiques")).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!).project).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));

    const project = screen.getByTestId("functional-research-project");
    expect(within(project).getByText("Version 1")).toBeInTheDocument();
    const firstProject = JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!).project;
    expect(firstProject).toMatchObject({
      contract: "RESEARCH_PROJECT_CONSTRUCTION_OWNER_PROJECTION",
      boundary: "PRJ_001_CONTRIBUTION_INTAKE_ADAPTER",
      owner: "RESEARCH_PROJECT",
      canonicalV2Status: "NO_SCIENTIFIC_OBJECT_PROMOTION_CLAIMED",
      contractAdaptation: { adaptationScope: "USER_CONFIRMED_PROJECT_INFORMATION_ONLY_NO_DESIGN_FREEZE_NO_PD003_V2_CANONICAL_PROMOTION" },
      llmProjectWrites: 0,
      confirmationDecision: { status: "ADOPTED", actor: expect.any(String), mandate: "PROJECT_OWNER", engineSource: "RESEARCH_PROJECT" },
    });
    expect(firstProject.specializedResponsibilities).toEqual(expect.arrayContaining([
      expect.objectContaining({ owner: "SCIENTIFIC_THINKING", state: "RETAINED_OUTSIDE_NOMINAL_UX" }),
      expect.objectContaining({ owner: "IMAGING", state: "PENDING_SPECIALIST_CONTRIBUTION" }),
    ]));
    expect(firstProject.sections.flatMap((section: { elements: Array<{ canonicalPromotion: string }> }) => section.elements).every((element: { canonicalPromotion: string }) => element.canonicalPromotion === "NOT_PERFORMED")).toBe(true);
    for (const value of ["colchicine", "placebo", "infarctus du myocarde", "étude multicentrique", "IRM", "inflammation", "lésions myocardiques", "biomarqueurs sanguins", "taille de l’infarctus"]) {
      expect(within(project).getByText(value)).toBeInTheDocument();
    }

    fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: MODIFICATION } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    expect(await screen.findByText("J’ai compris deux modifications :")).toBeInTheDocument();
    expect(screen.getByText("• IRM entre J3 et J5")).toBeInTheDocument();
    expect(screen.getByText("• âge maximal 75 ans")).toBeInTheDocument();
    expect(runtime.request).toHaveBeenLastCalledWith(expect.objectContaining({ previousContribution: expect.objectContaining({ identity: expect.objectContaining({ contributionId: "contribution:colchicine-v1" }) }) }));
    fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));

    expect(within(project).getByText("Version 2")).toBeInTheDocument();
    expect(within(project).getByText("IRM entre J3 et J5")).toBeInTheDocument();
    expect(within(project).getByText("âge maximal 75 ans")).toBeInTheDocument();
    expect(within(project).getByText("biomarqueurs sanguins")).toBeInTheDocument();
    expect(within(project).getByText("taille de l’infarctus")).toBeInTheDocument();

    firstRender.unmount();
    renderDemo();
    const reloaded = screen.getByTestId("functional-research-project");
    expect(within(reloaded).getByText("Version 2")).toBeInTheDocument();
    expect(within(reloaded).getByText("âge maximal 75 ans")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Recommencer" }));
    await waitFor(() => expect(within(screen.getByTestId("functional-research-project")).queryByText("Version 2")).toBeNull());
    expect(screen.getByText(/Décris-moi le projet de recherche/)).toBeInTheDocument();
    expect(within(screen.getByTestId("functional-research-project")).queryByText("colchicine")).toBeNull();
  });

  it("keeps the product usable when the runtime fails", async () => {
    runtime.request.mockRejectedValueOnce(new Error("Interprétation scientifique indisponible."));
    renderDemo();
    fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: "Une idée de projet" } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Interprétation scientifique indisponible");
    expect(screen.getByLabelText("Votre message")).toBeInTheDocument();
    expect(screen.getByTestId("functional-research-project")).toBeInTheDocument();
  });
});
