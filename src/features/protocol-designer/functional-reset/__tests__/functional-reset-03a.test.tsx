import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
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
  makeFunctionalResetContribution,
} from "./functional-reset-fixtures";

const runtime = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@/features/scientific-interpretation/client", () => ({
  requestScientificInterpretationRuntime: runtime.request,
}));

const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);

const submit = (content: string) => {
  fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: content } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
};

const waitForProposal = () => screen.findByRole("heading", {
  name: "J’ai suffisamment d’éléments pour vous proposer une première structure d’étude.",
});

const confirm = () => fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));

const storedSession = () => JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!) as {
  pendingContribution: ScientificInterpretationContributionEnvelope | null;
  currentContribution: ScientificInterpretationContributionEnvelope | null;
  project: {
    boundary: string;
    owner: string;
    revision: number;
    versionId: string;
    previousVersionId: string | null;
    confirmationDecision: { status: string; mandate: string; engineSource: string };
    sections: Array<{ label: string; elements: Array<{ content: string; sourcePolarity: string | null }> }>;
  } | null;
  documents: {
    owner: string;
    projections: Array<{
      projectionType: string;
      ownership: { structure: string; content: string; editorialForm: string };
      source: { projectVersion: string };
      boundary: string;
    }>;
  };
};

describe("FUNCTIONAL-RESET-03A — boucle conversationnelle Project", () => {
  beforeEach(() => {
    window.localStorage.clear();
    runtime.request.mockReset();
    runtime.request.mockImplementation(async ({ conversation }: { conversation: { turns: ScientificInterpretationTurn[] } }) => ({
      contribution: makeFunctionalResetContribution(conversation.turns),
    }));
  });
  afterEach(cleanup);

  it("FR03A-C01 — une première phrase produit une structure lisible", async () => {
    renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    await waitForProposal();

    const proposal = screen.getByTestId("functional-contribution-review");
    for (const label of ["Projet", "Population", "Design", "Intervention", "Comparateur", "Imagerie", "Mesures / biomarqueurs", "Points encore ouverts"]) {
      expect(within(proposal).getByText(label)).toBeInTheDocument();
    }
    for (const value of ["infarctus du myocarde", "colchicine", "placebo", "étude multicentrique", "IRM", "inflammation", "lésions myocardiques"]) {
      expect(within(proposal).getByText(value)).toBeInTheDocument();
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
      identity: { runtimeId: "HYBRID_PRIMARY_STRUCTURED", runtimeVersion: "1.3.6" },
      epistemicBoundary: { candidateIsAdopted: false, projectOwnershipTransferred: false },
      decisionBoundary: { projectWriteAuthorized: false },
    });
    expect(screen.getByRole("button", { name: "Cela correspond à mon projet" })).toBeInTheDocument();
  });

  it("FR03A-C03 — la confirmation crée le Project via la frontière existante", async () => {
    renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    await waitForProposal();
    confirm();

    expect(await screen.findByText(/Projet créé\./)).toBeInTheDocument();
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
    confirm();
    const versionOne = storedSession().project!.versionId;

    submit(COLCHICINE_03A_MODIFICATION);
    await screen.findByText("J’ai compris deux modifications :");
    confirm();

    const project = storedSession().project!;
    expect(project).toMatchObject({ revision: 2, previousVersionId: versionOne });
    const contents = project.sections.flatMap((section) => section.elements.map((element) => element.content));
    expect(contents).toEqual(expect.arrayContaining(["âge maximal 75 ans", "IRM entre J3 et J5", "colchicine", "placebo", "inflammation", "lésions myocardiques"]));
    expect(await screen.findByText(/Projet mis à jour\./)).toBeInTheDocument();
  });

  it("FR03A-C05 — plusieurs modifications dans une réponse sont supportées", async () => {
    renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    await waitForProposal();
    confirm();

    submit(COLCHICINE_03A_MODIFICATION);
    const heading = await screen.findByText("J’ai compris deux modifications :");
    const proposal = heading.closest("section")!;
    expect(within(proposal).getByText("Population")).toBeInTheDocument();
    expect(within(proposal).getByText("Temporalité")).toBeInTheDocument();
    expect(within(proposal).getByText("• âge maximal 75 ans")).toBeInTheDocument();
    expect(within(proposal).getByText("• IRM entre J3 et J5")).toBeInTheDocument();
  });

  it("FR03A-C06 — une réponse partielle conserve les inconnues", async () => {
    renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    await waitForProposal();
    confirm();

    runtime.request.mockImplementationOnce(async ({ conversation }: { conversation: { turns: ScientificInterpretationTurn[] } }) => {
      const contribution = makeFunctionalResetContribution(conversation.turns);
      const turnId = conversation.turns.at(-1)!.turnId;
      return {
        contribution: {
          ...contribution,
          scientificContent: {
            ...contribution.scientificContent,
            normalizedUnderstanding: "Le critère principal reste à définir.",
            unknowns: [{
              itemId: "unknown:primary-endpoint",
              semanticIdentity: "unknown:primary-endpoint",
              proposedType: "ENDPOINT",
              content: "critère principal encore à définir",
              polarity: "UNKNOWN",
              studyRole: null,
              confidence: 1,
              epistemicBoundary: {
                ownership: "SCIENTIFIC_INTERPRETATION",
                epistemicStatus: "UNKNOWN",
                adoptionStatus: "CANDIDATE",
                activeState: true,
                sourceTurnIds: [turnId],
                sourceText: "Le critère principal reste à définir.",
              },
            }],
          },
        },
      };
    });
    submit("Le critère principal reste à définir.");
    await screen.findByText(/critère principal encore à définir/);
    confirm();

    const session = storedSession();
    expect(session.currentContribution?.scientificContent.unknowns).toEqual([
      expect.objectContaining({ content: "critère principal encore à définir", polarity: "UNKNOWN" }),
    ]);
    expect(session.project!.sections.flatMap((section) => section.elements)).toEqual(expect.arrayContaining([
      expect.objectContaining({ content: "critère principal encore à définir", sourcePolarity: "UNKNOWN" }),
      expect.objectContaining({ content: "colchicine" }),
      expect.objectContaining({ content: "placebo" }),
    ]));
  });

  it("FR03A-C07 — le Project Panel reste visible dans la boucle", async () => {
    renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    await waitForProposal();
    confirm();

    const project = screen.getByTestId("functional-research-project");
    expect(project).toBeInTheDocument();
    expect(project.parentElement).toHaveClass("lg:sticky");
    expect(screen.getByRole("region", { name: "Conversation" })).toBeInTheDocument();
  });

  it("FR03A-C08 — aucun vocabulaire moteur n’apparaît en Standard", async () => {
    renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    await waitForProposal();
    confirm();

    const visibleProduct = screen.getByTestId("functional-reset-workspace").textContent ?? "";
    expect(visibleProduct).not.toMatch(/\b(?:enum|candidate state|owner|digest|handoff|gate|branch|pattern|DOC-\d+|TMP-\d+|Guided Intake|Actor|Mandate)\b/i);
  });

  it("FR03A-C09 — le Protocol Preview reste une projection DOC", async () => {
    renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    await waitForProposal();
    confirm();
    const project = screen.getByTestId("functional-research-project");
    fireEvent.click(within(project).getByRole("button", { name: "Créer l’aperçu" }));

    const preview = await screen.findByTestId("functional-protocol-preview");
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
    expect(session.documents.projections.at(-1)).toMatchObject({
      projectionType: "PROTOCOL",
      ownership: { structure: "TMP-001", content: "RESEARCH_PROJECT_AND_UPSTREAM_OWNERS", editorialForm: "DOC-001" },
      source: { projectVersion: session.project!.versionId },
      boundary: "READ_ONLY_PROJECTION_NOT_PROJECT_TRUTH_NOT_CLINICAL_PROTOCOL",
    });
  });

  it("FR03A-C10 — Scientific Interpretation reste inchangé", async () => {
    expect(HYBRID_PRIMARY_RUNTIME_VERSION).toBe("1.3.6");
    renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    await waitForProposal();

    expect(runtime.request).toHaveBeenCalledWith(expect.objectContaining({
      previousContribution: null,
      conversation: expect.objectContaining({ language: "fr" }),
    }));
    expect(storedSession().pendingContribution?.identity).toMatchObject({
      runtimeId: "HYBRID_PRIMARY_STRUCTURED",
      runtimeVersion: HYBRID_PRIMARY_RUNTIME_VERSION,
    });
  });
});
