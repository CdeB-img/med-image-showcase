import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  ScientificContributionItem,
  ScientificInterpretationContributionEnvelope,
  ScientificInterpretationTurn,
} from "@/features/scientific-interpretation/contracts";
import {
  confirmResearchProjectContribution,
  prepareResearchProjectContributionCandidate,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import ContributionReview from "../ContributionReview";
import {
  CHANGESET_AGE_TIMING,
  CHANGESET_INITIAL,
  CHANGESET_READD,
  CHANGESET_REMOVE,
  CHANGESET_REPEAT_REMOVE,
  CHANGESET_REPLACE_AGE,
  CHANGESET_SCOPE,
  makeFunctionalReset03A1Contribution,
} from "./functional-reset-03a1-fixtures";

const authority = {
  actorRef: "functional-reset-03a2:researcher",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const initialTurn: ScientificInterpretationTurn = {
  turnId: "turn:fr03a2:initial",
  role: "USER",
  content: CHANGESET_INITIAL,
  createdAt: "2026-08-21T09:00:00.000Z",
};

const turn = (turnId: string, content: string): ScientificInterpretationTurn => ({
  turnId,
  role: "USER",
  content,
  createdAt: "2026-08-21T09:01:00.000Z",
});

const initialContribution = () => makeFunctionalReset03A1Contribution([initialTurn]);

const projectFrom = (contribution = initialContribution()) => confirmResearchProjectContribution({
  contribution,
  current: null,
  projectId: "research-project:fr03a2",
  authority,
  confirmedAt: "2026-08-21T09:00:30.000Z",
});

const evidenceItem = (
  target: ScientificContributionItem,
  currentTurn: ScientificInterpretationTurn,
  input: Partial<ScientificContributionItem>,
): ScientificContributionItem => ({
  ...structuredClone(target),
  itemId: input.itemId ?? `negation:${target.itemId}`,
  semanticIdentity: input.semanticIdentity ?? `${target.semanticIdentity ?? target.itemId}-rejection`,
  proposedType: input.proposedType === undefined ? target.proposedType : input.proposedType,
  content: input.content ?? currentTurn.content,
  polarity: input.polarity === undefined ? "NEGATED" : input.polarity,
  studyRole: input.studyRole === undefined ? target.studyRole : input.studyRole,
  previousItemIds: input.previousItemIds ?? [target.itemId],
  epistemicBoundary: {
    ...target.epistemicBoundary,
    epistemicStatus: input.polarity === "UNKNOWN" ? "UNKNOWN" : "REJECTED_BY_USER",
    activeState: true,
    sourceTurnIds: [currentTurn.turnId],
    sourceText: currentTurn.content,
  },
});

const removalContribution = (input: {
  semanticIdentity: string;
  content: string;
  raw?: string;
  targetItemId?: string;
}): ScientificInterpretationContributionEnvelope => {
  const contribution = structuredClone(initialContribution());
  const target = contribution.scientificContent.candidateObjects.find((item) => item.semanticIdentity === input.semanticIdentity)!;
  const removalTurn = turn(`turn:fr03a2:remove:${input.semanticIdentity}`, input.raw ?? `Retirer ${input.content} de l’étude.`);
  target.epistemicBoundary.activeState = false;
  const targetRef = input.targetItemId ?? target.itemId;
  contribution.identity.contributionId = `contribution:fr03a2:remove:${input.semanticIdentity}`;
  contribution.identity.previousContributionId = contribution.source.conversationId;
  contribution.identity.contributionDigest = `${contribution.identity.contributionId}:digest`;
  contribution.source.originalRequest = removalTurn.content;
  contribution.source.turns = [initialTurn, removalTurn];
  contribution.source.sourceRefs = [initialTurn.turnId, removalTurn.turnId];
  contribution.scientificContent.negationsAndConstraints = [evidenceItem(target, removalTurn, {
    itemId: `negation:${input.semanticIdentity}`,
    previousItemIds: [targetRef],
  })];
  contribution.scientificContent.correctionsAndSupersessions = [evidenceItem(target, removalTurn, {
    itemId: `correction:${input.semanticIdentity}`,
    semanticIdentity: input.semanticIdentity,
    proposedType: null,
    polarity: null,
    studyRole: null,
    previousItemIds: [input.semanticIdentity],
  })];
  return contribution;
};

const confirmAgainst = (
  contribution: ScientificInterpretationContributionEnvelope,
  current: ResearchProjectOwnerProjection,
  confirmedAt = "2026-08-21T09:02:00.000Z",
) => confirmResearchProjectContribution({ contribution, current, projectId: current.projectId, authority, confirmedAt });

const contents = (project: ResearchProjectOwnerProjection, sectionId: string) => project.sections
  .find((section) => section.sectionId === sectionId)?.elements.map((element) => element.content) ?? [];

afterEach(() => cleanup());

describe("FUNCTIONAL-RESET-03A2 — semantic REMOVE resolution", () => {
  it("FR03A2-C01 — explicit removal of an active biomarker produces REMOVE", () => {
    const current = projectFrom();
    const contribution = removalContribution({
      semanticIdentity: "blood-biomarkers",
      content: "biomarqueurs sanguins",
      raw: "Finalement je ne veux plus utiliser les biomarqueurs sanguins.",
    });
    const effective = prepareResearchProjectContributionCandidate(contribution, current).changeSet.changes
      .filter((change) => change.operation !== "NO_CHANGE");
    expect(effective).toEqual([expect.objectContaining({
      operation: "REMOVE",
      targetSectionId: "MEASUREMENTS",
      presentation: "− Biomarqueurs sanguins",
    })]);
  });

  it("FR03A2-C02 — REMOVE is visible before Project mutation", () => {
    const current = projectFrom();
    const contribution = removalContribution({ semanticIdentity: "blood-biomarkers", content: "biomarqueurs sanguins" });
    const candidate = prepareResearchProjectContributionCandidate(contribution, current);
    const currentSnapshot = JSON.stringify(current);
    render(<ContributionReview contribution={contribution} candidate={candidate} status="PENDING" onConfirm={vi.fn()} onCorrect={vi.fn()} />);
    const review = screen.getByTestId("functional-contribution-review");
    expect(within(review).getByText("Mesures / biomarqueurs")).toBeInTheDocument();
    expect(within(review).getByText("− Biomarqueurs sanguins")).toBeInTheDocument();
    expect(within(review).getByRole("button", { name: "Cela correspond à mon projet" })).toBeInTheDocument();
    expect(JSON.stringify(current)).toBe(currentSnapshot);
    expect(contents(current, "MEASUREMENTS")).toContain("biomarqueurs sanguins");
  });

  it("FR03A2-C03 — Project changes only after confirmation", () => {
    const current = projectFrom();
    const contribution = removalContribution({ semanticIdentity: "blood-biomarkers", content: "biomarqueurs sanguins" });
    prepareResearchProjectContributionCandidate(contribution, current);
    expect(current.revision).toBe(1);
    expect(contents(current, "MEASUREMENTS")).toContain("biomarqueurs sanguins");
    const confirmed = confirmAgainst(contribution, current);
    expect(confirmed).toMatchObject({ revision: 2, previousVersionId: current.versionId, contributionRef: contribution.identity.contributionId });
    expect(confirmed.confirmationDecision.status).toBe("ADOPTED");
    expect(contents(confirmed, "MEASUREMENTS")).not.toContain("biomarqueurs sanguins");
  });

  it("FR03A2-C04 — removed object disappears without affecting sibling measurements", () => {
    const current = projectFrom();
    const confirmed = confirmAgainst(removalContribution({ semanticIdentity: "inflammation", content: "inflammation" }), current);
    expect(contents(confirmed, "MEASUREMENTS")).not.toContain("inflammation");
    expect(contents(confirmed, "MEASUREMENTS")).toEqual(expect.arrayContaining([
      "lésions en IRM",
      "biomarqueurs sanguins",
      "taille de l’infarctus",
    ]));

    const comparatorRemoved = confirmAgainst(removalContribution({ semanticIdentity: "placebo", content: "placebo" }), current);
    expect(contents(comparatorRemoved, "COMPARATOR")).toEqual([]);
    expect(contents(comparatorRemoved, "INTERVENTION")).toContain("colchicine");
  });

  it("FR03A2-C05 — repeated removal produces NO_CHANGE", () => {
    const contribution = removalContribution({ semanticIdentity: "blood-biomarkers", content: "biomarqueurs sanguins" });
    const removed = confirmAgainst(contribution, projectFrom());
    const repeated = prepareResearchProjectContributionCandidate(contribution, removed);
    expect(repeated.changeSet).toMatchObject({ status: "NO_NET_CHANGE", effectiveChangeCount: 0 });
    expect(confirmAgainst(contribution, removed)).toBe(removed);
  });

  it("FR03A2-C06 — re-add produces ADD", () => {
    const removal = removalContribution({ semanticIdentity: "blood-biomarkers", content: "biomarqueurs sanguins" });
    const removed = confirmAgainst(removal, projectFrom());
    const readd = structuredClone(initialContribution());
    const readdTurn = turn("turn:fr03a2:readd", "Finalement je veux remettre les biomarqueurs sanguins.");
    const biomarker = readd.scientificContent.candidateObjects.find((item) => item.semanticIdentity === "blood-biomarkers")!;
    biomarker.epistemicBoundary.sourceTurnIds = [readdTurn.turnId];
    biomarker.epistemicBoundary.sourceText = readdTurn.content;
    readd.identity.contributionId = "contribution:fr03a2:readd";
    readd.identity.contributionDigest = "contribution:fr03a2:readd:digest";
    readd.source.turns = [initialTurn, readdTurn];
    readd.source.sourceRefs = [initialTurn.turnId, readdTurn.turnId];
    const candidate = prepareResearchProjectContributionCandidate(readd, removed);
    expect(candidate.changeSet.changes.filter((change) => change.operation !== "NO_CHANGE")).toEqual([
      expect.objectContaining({ operation: "ADD", presentation: "+ Biomarqueurs sanguins" }),
    ]);
    expect(contents(confirmAgainst(readd, removed), "MEASUREMENTS")).toContain("biomarqueurs sanguins");
  });

  it("FR03A2-C07 — negating a relation does not remove its endpoint objects", () => {
    const current = projectFrom();
    const contribution = structuredClone(initialContribution());
    const relation = contribution.scientificContent.candidateRelations[0]!;
    const removalTurn = turn("turn:fr03a2:relation", "Je ne souhaite pas comparer colchicine et placebo.");
    relation.epistemicBoundary.activeState = false;
    contribution.identity.contributionId = "contribution:fr03a2:relation";
    contribution.identity.contributionDigest = "contribution:fr03a2:relation:digest";
    contribution.source.turns = [initialTurn, removalTurn];
    contribution.source.sourceRefs = [initialTurn.turnId, removalTurn.turnId];
    const target = contribution.scientificContent.candidateObjects.find((item) => item.semanticIdentity === "colchicine")!;
    contribution.scientificContent.negationsAndConstraints = [evidenceItem(target, removalTurn, {
      itemId: "negation:comparison",
      semanticIdentity: "colchicine-placebo-comparison-rejection",
      proposedType: "CONSTRAINT",
      studyRole: "CONSTRAINT",
      previousItemIds: [relation.relationId],
    })];
    contribution.scientificContent.correctionsAndSupersessions = [];
    const effective = prepareResearchProjectContributionCandidate(contribution, current).changeSet.changes
      .filter((change) => change.operation !== "NO_CHANGE");
    expect(effective).toEqual([expect.objectContaining({ operation: "REMOVE", targetSectionId: "ANALYSIS" })]);
    const confirmed = confirmAgainst(contribution, current);
    expect(contents(confirmed, "INTERVENTION")).toContain("colchicine");
    expect(contents(confirmed, "COMPARATOR")).toContain("placebo");
    expect(contents(confirmed, "ANALYSIS")).toEqual([]);
  });

  it("FR03A2-C08 — uncertain wording does not produce REMOVE", () => {
    const current = projectFrom();
    const contribution = structuredClone(initialContribution());
    const uncertainTurn = turn("turn:fr03a2:unknown", "Je ne sais pas si je veux des biomarqueurs sanguins.");
    const target = contribution.scientificContent.candidateObjects.find((item) => item.semanticIdentity === "blood-biomarkers")!;
    contribution.identity.contributionId = "contribution:fr03a2:unknown";
    contribution.identity.contributionDigest = "contribution:fr03a2:unknown:digest";
    contribution.source.turns = [initialTurn, uncertainTurn];
    contribution.source.sourceRefs = [initialTurn.turnId, uncertainTurn.turnId];
    contribution.scientificContent.unknowns = [evidenceItem(target, uncertainTurn, {
      itemId: "unknown:blood-biomarkers",
      semanticIdentity: "blood-biomarkers-selection-unknown",
      proposedType: "DECISION",
      polarity: "UNKNOWN",
      studyRole: "DECISION",
      previousItemIds: [],
    })];
    contribution.scientificContent.negationsAndConstraints = [];
    contribution.scientificContent.correctionsAndSupersessions = [];
    expect(prepareResearchProjectContributionCandidate(contribution, current).changeSet.changes
      .some((change) => change.operation === "REMOVE")).toBe(false);
    expect(contents(current, "MEASUREMENTS")).toContain("biomarqueurs sanguins");
  });

  it("FR03A2-C09 — semantic identity resolution does not rely solely on raw string equality", () => {
    const current = structuredClone(projectFrom());
    const biomarker = current.sections.find((section) => section.sectionId === "MEASUREMENTS")!.elements
      .find((element) => element.elementId === "blood-biomarkers")!;
    biomarker.elementId = "legacy:blood-marker";
    biomarker.content = "marqueurs biologiques circulants";
    biomarker.sourceItemIds = ["legacy-object:biomarker"];
    const contribution = removalContribution({
      semanticIdentity: "blood-biomarkers",
      content: "biomarqueurs sanguins",
      targetItemId: "runtime-object:biomarker",
    });
    const effective = prepareResearchProjectContributionCandidate(contribution, current).changeSet.changes
      .filter((change) => change.operation !== "NO_CHANGE");
    expect(effective).toEqual([expect.objectContaining({ operation: "REMOVE", previousElement: expect.objectContaining({ content: "marqueurs biologiques circulants" }) })]);
  });

  it("FR03A2-C10 — RESET-03A1 age, timing and replace behavior remains PASS", () => {
    const sequence = [
      CHANGESET_INITIAL,
      CHANGESET_AGE_TIMING,
      CHANGESET_SCOPE,
      CHANGESET_REMOVE,
      CHANGESET_REPEAT_REMOVE,
      CHANGESET_READD,
      CHANGESET_REPLACE_AGE,
    ];
    let project: ResearchProjectOwnerProjection | null = null;
    for (let stage = 1; stage <= sequence.length; stage += 1) {
      const turns = sequence.slice(0, stage).map((content, index) => turn(`turn:changeset:${index + 1}`, content));
      const contribution = makeFunctionalReset03A1Contribution(turns);
      project = confirmResearchProjectContribution({
        contribution,
        current: project,
        projectId: "research-project:fr03a2:regression",
        authority,
        confirmedAt: `2026-08-21T10:0${stage}:00.000Z`,
      });
    }
    expect(project!.revision).toBe(5);
    expect(contents(project!, "POPULATION")).toContain("Âge maximal : 80 ans");
    expect(contents(project!, "POPULATION")).not.toContain("Âge maximal : 75 ans");
    expect(contents(project!, "TEMPORALITY")).toEqual(["IRM : J3–J5"]);
    expect(contents(project!, "MEASUREMENTS")).toContain("biomarqueurs sanguins");
  });
});
