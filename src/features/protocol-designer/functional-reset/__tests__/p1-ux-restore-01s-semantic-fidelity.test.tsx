import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import UnderstandingReviewCard from "@/features/protocol-designer/conversation/UnderstandingReviewCard";
import type {
  ScientificContributionItem,
  ScientificInterpretationContributionEnvelope,
  ScientificInterpretationTurn,
} from "@/features/scientific-interpretation/contracts";
import { prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import ContributionReview from "../ContributionReview";
import { makeFunctionalResetContribution } from "./functional-reset-fixtures";

const TURN: ScientificInterpretationTurn = {
  turnId: "turn:p1-ux-restore-01s:non-cardiac",
  role: "USER",
  content: "Je veux étudier si une exposition répétée à la chaleur favorise la déshydratation, en observant la température cutanée. La population et l’analyse détaillée restent à définir.",
};

const contribution = (): ScientificInterpretationContributionEnvelope => {
  const base = makeFunctionalResetContribution([TURN]);
  const template = base.scientificContent.candidateObjects[0]!;
  const item = (input: {
    id: string;
    type: string;
    content: string;
    sourceText: string | null;
    status?: string;
    state?: "KNOWN" | "ASSUMED" | "UNKNOWN";
    ownership?: string;
    role?: string | null;
  }): ScientificContributionItem => ({
    ...template,
    itemId: input.id,
    semanticIdentity: input.id,
    proposedType: input.type,
    content: input.content,
    studyRole: input.role ?? null,
    evidenceRefs: [],
    previousItemIds: [],
    epistemicBoundary: {
      ...template.epistemicBoundary,
      ownership: input.ownership ?? "USER",
      epistemicState: input.state ?? "KNOWN",
      epistemicStatus: input.status ?? "EXPLICIT_USER_STATED",
      adoptionStatus: "CANDIDATE",
      activeState: true,
      sourceTurnIds: [TURN.turnId],
      sourceText: input.sourceText,
    },
  });
  return {
    ...base,
    identity: {
      ...base.identity,
      contributionId: "contribution:p1-ux-restore-01s:non-cardiac",
      contributionDigest: "contribution:p1-ux-restore-01s:non-cardiac:digest",
    },
    scientificContent: {
      ...base.scientificContent,
      normalizedUnderstanding: null,
      candidateObjects: [
        item({ id: "design:exploratory", type: "STUDY_DESIGN", content: "Étude exploratoire", sourceText: "étudier" }),
        item({ id: "context:heat", type: "PROJECT_INFORMATION", content: "Exposition répétée à la chaleur", sourceText: "exposition répétée à la chaleur" }),
        item({ id: "hypothesis:dehydration", type: "HYPOTHESIS", content: "L’exposition répétée à la chaleur peut favoriser la déshydratation", sourceText: "si une exposition répétée à la chaleur favorise la déshydratation" }),
        item({ id: "condition:dehydration", type: "CONDITION", content: "Déshydratation", sourceText: "déshydratation" }),
        item({ id: "objective:observe", type: "OBJECTIVE", content: "Explorer ce phénomène par observation de la température cutanée", sourceText: "en observant la température cutanée" }),
        item({ id: "variable:skin-temperature", type: "CANONICAL_VARIABLE", content: "Température cutanée", sourceText: "température cutanée", role: "MEASUREMENT" }),
        item({ id: "need:characterization", type: "DATA_NEED", content: "Caractérisation du phénomène", sourceText: "étudier si une exposition répétée à la chaleur favorise la déshydratation" }),
        item({ id: "unknown:season", type: "PROJECT_INFORMATION", content: "Cadre saisonnier à préciser", sourceText: null, status: "UNKNOWN", state: "UNKNOWN", ownership: "NOXIA" }),
      ],
      explicitStatements: [],
      candidateRelations: [],
      inferredContext: [],
      contextualCandidates: [],
      temporalElements: [],
      unknowns: [],
      missingInformation: [],
      correctionsAndSupersessions: [],
    },
  };
};

describe("P1-UX-RESTORE-01S — semantic fidelity", () => {
  it("keeps scientific roles distinct in the working understanding", () => {
    render(<UnderstandingReviewCard
      contribution={contribution()}
      status="PENDING"
      onConfirm={vi.fn()}
      onCorrect={vi.fn()}
      onAdd={vi.fn()}
      presentationOnly
    />);
    const review = screen.getByTestId("understanding-review-card");

    expect(within(review).getByText("Hypothèse de départ")).toBeInTheDocument();
    expect(within(review).getByText("Pathologie / condition")).toBeInTheDocument();
    expect(within(review).getByText("Contexte du projet")).toBeInTheDocument();
    expect(within(review).getByText("Objectif")).toBeInTheDocument();
    expect(within(review).getByText("Éléments à observer ou mesurer")).toBeInTheDocument();
    expect(within(review).getByText("Besoin de données")).toBeInTheDocument();
    expect(review).not.toHaveTextContent("Mesures et biomarqueurs");
    expect(review).not.toHaveTextContent("Mesures / biomarqueurs");
    expect(within(review).getByText("Cadre saisonnier à préciser").nextSibling).toHaveTextContent("À préciser");
  });

  it("does not turn condition, context, hypothesis, data need or measurement intent into another Project field", () => {
    const source = contribution();
    const candidate = prepareResearchProjectContributionCandidate(source, null);
    const population = candidate.proposedSections.find((section) => section.sectionId === "POPULATION")!;
    const question = candidate.proposedSections.find((section) => section.sectionId === "QUESTION")!;
    const analysis = candidate.proposedSections.find((section) => section.sectionId === "ANALYSIS")!;

    expect(population).toMatchObject({ state: "TO_CLARIFY", elements: [] });
    expect(question).toMatchObject({ state: "TO_CLARIFY", elements: [] });
    expect(analysis).toMatchObject({ state: "TO_CLARIFY", elements: [] });
    expect(candidate.canonicalChangeSet.objectChanges.map((change) => change.candidate?.objectType)).toEqual(expect.arrayContaining([
      "PROJECT_INFORMATION",
      "HYPOTHESIS",
      "CONDITION",
      "OBJECTIVE",
      "CANONICAL_VARIABLE",
      "DATA_NEED",
    ]));

    const sections = new Map(candidate.humanReviewProjection.sections.map((section) => [section.label, section]));
    expect(sections.get("Hypothèse de départ")?.items[0]?.content).toContain("déshydratation");
    expect(sections.get("Pathologie / condition")?.items[0]?.content).toBe("Déshydratation");
    expect(sections.get("Contexte du projet")?.items.map((item) => item.content)).toEqual(expect.arrayContaining([
      "Exposition répétée à la chaleur",
      expect.stringContaining("Cadre saisonnier à préciser"),
    ]));
    expect(sections.get("Objectif")?.items[0]?.content).toContain("Explorer");
    expect(sections.get("Éléments à observer ou mesurer")?.items[0]?.content).toBe("Température cutanée");
    expect(sections.get("Besoin de données")?.items[0]?.content).toBe("Caractérisation du phénomène");
    expect(sections.get("Analyse")).toBeUndefined();

    render(<ContributionReview contribution={source} candidate={candidate} status="PENDING" onConfirm={vi.fn()} onCorrect={vi.fn()} onReject={vi.fn()} />);
    const rendered = screen.getByTestId("functional-contribution-review");
    expect(rendered).toHaveTextContent("Question de recherche à préciser.");
    expect(rendered).toHaveTextContent("question de recherche");
    expect(rendered).toHaveTextContent("population précise");
    expect(rendered).toHaveTextContent("Cadre saisonnier à préciser — détails à préciser");
    expect(within(screen.getByRole("region", { name: "Points encore ouverts" })).queryByText("analyse", { exact: true }))
      .not.toBeInTheDocument();
    expect(rendered).not.toHaveTextContent("Projet portant sur Déshydratation");
  });
});
