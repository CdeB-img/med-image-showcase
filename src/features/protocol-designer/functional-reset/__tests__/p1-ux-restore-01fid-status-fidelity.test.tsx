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
import {
  FUNCTIONAL_RESET_STORAGE_KEY,
  createFunctionalResetSession,
  loadFunctionalResetSession,
  persistFunctionalResetSession,
} from "../session";
import { makeFunctionalResetContribution } from "./functional-reset-fixtures";

const TURN: ScientificInterpretationTurn = {
  turnId: "turn:p1-ux-restore-01fid:generic",
  role: "USER",
  content: "Je veux structurer un projet avec plusieurs dimensions indépendantes.",
};

type ItemInput = {
  id: string;
  type: string;
  content: string;
  sourceText?: string | null;
  epistemicStatus?: string;
  epistemicState?: "KNOWN" | "ASSUMED" | "UNKNOWN" | "WITHHELD";
  ownership?: string;
};

const contributionWith = (
  inputs: readonly ItemInput[],
  turn: ScientificInterpretationTurn = TURN,
): ScientificInterpretationContributionEnvelope => {
  const base = makeFunctionalResetContribution([turn]);
  const template = base.scientificContent.candidateObjects[0]!;
  const items: ScientificContributionItem[] = inputs.map((input) => ({
    ...template,
    itemId: input.id,
    semanticIdentity: input.id,
    proposedType: input.type,
    content: input.content,
    studyRole: null,
    evidenceRefs: [],
    previousItemIds: [],
    epistemicBoundary: {
      ...template.epistemicBoundary,
      ownership: input.ownership ?? "USER",
      epistemicStatus: input.epistemicStatus ?? "EXPLICIT_USER_STATED",
      epistemicState: input.epistemicState ?? "KNOWN",
      adoptionStatus: "CANDIDATE",
      activeState: true,
      sourceTurnIds: [turn.turnId],
      sourceText: input.sourceText === undefined ? input.content : input.sourceText,
    },
  }));
  return {
    ...base,
    identity: {
      ...base.identity,
      contributionId: `contribution:p1-ux-restore-01fid:${turn.turnId}`,
      contributionDigest: `digest:p1-ux-restore-01fid:${turn.turnId}`,
    },
    source: {
      ...base.source,
      originalRequest: turn.content,
      turns: [turn],
      sourceRefs: [turn.turnId],
    },
    scientificContent: {
      ...base.scientificContent,
      normalizedUnderstanding: null,
      explicitStatements: [],
      candidateObjects: items,
      candidateRelations: [],
      inferredContext: [],
      contextualCandidates: [],
      negationsAndConstraints: [],
      temporalElements: [],
      ambiguities: [],
      unknowns: [],
      missingInformation: [],
      correctionsAndSupersessions: [],
      openDecisions: [],
      clarificationNeeds: [],
    },
  };
};

const objectReview = (contribution: ScientificInterpretationContributionEnvelope, id: string) => {
  const candidate = prepareResearchProjectContributionCandidate(contribution, null);
  const changeRef = candidate.canonicalChangeSet.objectChanges
    .find((change) => change.candidate?.sourceItemRefs.includes(id))?.changeRef;
  const item = candidate.humanReviewProjection.sections
    .flatMap((section) => section.items)
    .find((review) => review.changeKind === "OBJECT" && review.changeRef === changeRef);
  if (!item) throw new Error(`REVIEW_ITEM_NOT_FOUND:${id}`);
  return { candidate, item };
};

describe("P1-UX-RESTORE-01FID — generic status fidelity", () => {
  it.each([
    {
      name: "A — explicit and sufficiently specified",
      item: { id: "design:alpha", type: "STUDY_DESIGN", content: "Cadre alpha", epistemicState: "KNOWN" as const },
      expectedStatus: "Déclaré",
      expectedSpecification: undefined,
    },
    {
      name: "B — explicit but incomplete",
      item: { id: "design:beta", type: "STUDY_DESIGN", content: "Cadre bêta", epistemicState: "UNKNOWN" as const },
      expectedStatus: "Déclaré",
      expectedSpecification: "Détails à préciser",
    },
    {
      name: "C — interpreted candidate and incomplete",
      item: { id: "design:gamma", type: "STUDY_DESIGN", content: "Cadre gamma", epistemicStatus: "INFERRED_CANDIDATE", epistemicState: "UNKNOWN" as const, ownership: "OWNER" },
      expectedStatus: "Interprété — à confirmer",
      expectedSpecification: "Détails à préciser",
    },
  ])("preserves both axes for $name", ({ item, expectedStatus, expectedSpecification }) => {
    const contribution = contributionWith([item]);
    const projected = objectReview(contribution, item.id);

    expect(projected.item.statusLabel).toBe(expectedStatus);
    expect(projected.item.specificationLabel).toBe(expectedSpecification);
    expect(projected.candidate.humanReviewProjection.openPoints.some((point) => point.sourceChangeRefs.includes(projected.item.changeRef)))
      .toBe(expectedSpecification !== undefined);
  });

  it("D — keeps a genuinely absent dimension open without inventing a value", () => {
    const candidate = prepareResearchProjectContributionCandidate(contributionWith([{
      id: "objective:known",
      type: "OBJECTIVE",
      content: "Évaluer le résultat alpha",
    }]), null);
    const population = candidate.humanReviewProjection.openPoints.find((point) => point.projectSectionId === "POPULATION");

    expect(population).toMatchObject({ source: "SECTION_COMPLETENESS", sectionState: "TO_CLARIFY", knownContentPresent: false });
    expect(candidate.proposedSections.find((section) => section.sectionId === "POPULATION")).toMatchObject({ elements: [] });
  });

  it("E — reports a partially known broad section without presenting it as unknown", () => {
    const candidate = prepareResearchProjectContributionCandidate(contributionWith([{
      id: "modality:known",
      type: "MODALITY",
      content: "Méthode alpha",
      epistemicState: "KNOWN",
    }]), null);
    const imaging = candidate.humanReviewProjection.openPoints.find((point) => point.projectSectionId === "IMAGING");

    expect(imaging).toMatchObject({
      source: "SECTION_COMPLETENESS",
      sectionState: "PARTIAL",
      knownContentPresent: true,
    });
    expect(imaging?.content).toContain("éléments compris, détails à préciser");
  });

  it("derives partially known broad sections from review items when the Project section has no projected element", () => {
    const candidate = prepareResearchProjectContributionCandidate(contributionWith([{
      id: "measure:known-child",
      type: "CANONICAL_VARIABLE",
      content: "Mesure alpha",
      epistemicState: "KNOWN",
    }]), null);
    const measurements = candidate.humanReviewProjection.openPoints
      .find((point) => point.projectSectionId === "MEASUREMENTS");

    expect(measurements).toMatchObject({
      source: "SECTION_COMPLETENESS",
      sectionState: "TO_CLARIFY",
      knownContentPresent: true,
    });
    expect(measurements?.content).toContain("éléments compris, détails à préciser");
  });

  it("F — does not leak status between independent dimensions", () => {
    const contribution = contributionWith([
      { id: "design:known", type: "STUDY_DESIGN", content: "Cadre connu", epistemicState: "KNOWN" },
      { id: "measure:incomplete", type: "CANONICAL_VARIABLE", content: "Mesure incomplète", epistemicState: "UNKNOWN" },
      { id: "objective:interpreted", type: "OBJECTIVE", content: "Objectif interprété", epistemicStatus: "INFERRED_CANDIDATE", epistemicState: "ASSUMED", ownership: "OWNER" },
    ]);
    const candidate = prepareResearchProjectContributionCandidate(contribution, null);
    const reviews = new Map(candidate.humanReviewProjection.sections.flatMap((section) => section.items)
      .filter((item) => item.changeKind === "OBJECT")
      .map((item) => [item.projectSectionId === "MEASUREMENTS" ? "measurement" : item.content, item]));

    expect([...reviews.values()].find((item) => item.content.includes("Cadre connu"))).toMatchObject({ statusLabel: "Déclaré", specificationLabel: undefined });
    expect(reviews.get("measurement")).toMatchObject({ statusLabel: "Déclaré", specificationLabel: "Détails à préciser" });
    expect([...reviews.values()].find((item) => item.content.includes("Objectif interprété"))).toMatchObject({ statusLabel: "Interprété — à confirmer", specificationLabel: undefined });
  });

  it("renders origin and incompleteness as independent labels in both Standard review projections", () => {
    const source = contributionWith([{
      id: "measure:projection",
      type: "CANONICAL_VARIABLE",
      content: "Mesure delta reformulée",
      sourceText: "mesure delta",
      epistemicState: "UNKNOWN",
    }]);
    const candidate = prepareResearchProjectContributionCandidate(source, null);

    render(<UnderstandingReviewCard contribution={source} status="PENDING" onConfirm={vi.fn()} onCorrect={vi.fn()} onAdd={vi.fn()} presentationOnly />);
    const understanding = screen.getByTestId("understanding-review-card");
    expect(within(understanding).getByText("Mesure delta reformulée").parentElement).toHaveTextContent("ReformuléDétails à préciser");

    render(<ContributionReview contribution={source} candidate={candidate} status="PENDING" onConfirm={vi.fn()} onCorrect={vi.fn()} onReject={vi.fn()} />);
    const review = screen.getByTestId("functional-contribution-review");
    expect(within(review).getByText("Mesure delta reformulée").parentElement).toHaveTextContent("ReformuléDétails à préciser");
  });

  it("invalidates a persisted pre-fidelity review projection so the current generic projection is rebuilt", () => {
    const source = contributionWith([{
      id: "measure:persisted",
      type: "CANONICAL_VARIABLE",
      content: "Mesure persistée",
    }]);
    const candidate = prepareResearchProjectContributionCandidate(source, null);
    const session = createFunctionalResetSession("2026-08-30T20:00:00.000Z");
    persistFunctionalResetSession(window.localStorage, {
      ...session,
      entries: [{
        entryId: "entry:persisted-review",
        kind: "REVIEW",
        role: "NOXIA",
        contribution: source,
        candidate,
        status: "PENDING",
        decision: null,
        createdAt: "2026-08-30T20:00:00.000Z",
      }],
    });
    const persisted = JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!) as {
      entries: Array<{ candidate: { humanReviewProjection: { contractVersion: string } } }>;
    };
    persisted.entries[0]!.candidate.humanReviewProjection.contractVersion = "1.0.0";
    window.localStorage.setItem(FUNCTIONAL_RESET_STORAGE_KEY, JSON.stringify(persisted));

    const loaded = loadFunctionalResetSession(window.localStorage);
    const review = loaded.entries.find((entry) => entry.kind === "REVIEW");
    expect(review).toMatchObject({ kind: "REVIEW", contribution: source });
    expect(review?.kind === "REVIEW" ? review.candidate : null).toBeUndefined();
    window.localStorage.removeItem(FUNCTIONAL_RESET_STORAGE_KEY);
  });

  it("keeps the CEC dimensions understood while their specification remains incomplete", () => {
    const cecTurn: ScientificInterpretationTurn = {
      turnId: "turn:p1-ux-restore-01fid:cec-regression",
      role: "USER",
      content: "je veux créer une étude se basant sur le principe que suite a circulation extra corporelle la troponine augmente et qu'il y a donc atteinte des myocites. je voudrais étudier cette atteinte à l'irm pour explorer ce domaine afin de voir s'il y a de réelles lésions visibles en rehaussement tardif ou si l'on peut observer une modification de l'ECV ou de la contractilité",
    };
    const source = contributionWith([
      { id: "context:cec", type: "PROJECT_INFORMATION", content: "Contexte après circulation extracorporelle", epistemicState: "UNKNOWN" },
      { id: "variable:lge", type: "CANONICAL_VARIABLE", content: "Lésions visibles en rehaussement tardif", epistemicState: "UNKNOWN" },
      { id: "variable:ecv", type: "CANONICAL_VARIABLE", content: "Modification de l’ECV", epistemicState: "UNKNOWN" },
      { id: "variable:contractility", type: "CANONICAL_VARIABLE", content: "Modification de la contractilité", epistemicState: "UNKNOWN" },
    ], cecTurn);
    const candidate = prepareResearchProjectContributionCandidate(source, null);
    const items = candidate.humanReviewProjection.sections.flatMap((section) => section.items)
      .filter((item) => item.changeKind === "OBJECT");

    for (const term of ["circulation extracorporelle", "rehaussement tardif", "ECV", "contractilité"]) {
      const item = items.find((candidateItem) => candidateItem.content.includes(term));
      expect(item).toMatchObject({ statusLabel: "Déclaré", specificationLabel: "Détails à préciser" });
      expect(item?.statusLabel).not.toBe("À préciser");
    }
    const measurementOpenPoints = candidate.humanReviewProjection.openPoints
      .filter((point) => point.projectSectionId === "MEASUREMENTS");
    expect(measurementOpenPoints.length).toBeGreaterThan(0);
    expect(measurementOpenPoints.every((point) => point.knownContentPresent)).toBe(true);
    expect(measurementOpenPoints.some((point) => point.content === "mesures et critère principal")).toBe(false);
  });
});
