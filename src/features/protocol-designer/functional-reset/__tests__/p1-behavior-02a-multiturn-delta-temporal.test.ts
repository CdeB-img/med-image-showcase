import { describe, expect, it } from "vitest";
import {
  contributionFromPersistentDelta,
  validatePersistentProjectDelta,
  type PersistentProjectDeltaChange,
} from "@/features/protocol-designer/product-bridge";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation/contracts";
import {
  ensureCanonicalProjectState,
  prepareResearchProjectContributionCandidate,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import {
  adoptBehaviorContribution,
  behaviorContribution,
  behaviorItem,
  behaviorTurn,
} from "./p1-behavior-01a-contract-fixtures";

const projectWithItems = (items: ReadonlyArray<{
  itemId: string;
  content: string;
}>) => {
  const turn = behaviorTurn("turn:p1-behavior-02a:initial", "Le projet contient plusieurs mesures distinctes.");
  const contribution = behaviorContribution({
    contributionId: "contribution:p1-behavior-02a:initial",
    turns: [turn],
    candidateObjects: items.map((item) => behaviorItem({
      ...item,
      proposedType: "CANONICAL_VARIABLE",
      turnId: turn.turnId,
    })),
  });
  return adoptBehaviorContribution(contribution, null, 1);
};

const removalChange = (
  project: ResearchProjectOwnerProjection,
  objectId: string,
  raw: string,
  candidateRef: string,
): PersistentProjectDeltaChange => {
  const target = ensureCanonicalProjectState(project).objects.find((object) => (
    object.objectId === objectId && object.actuality === "CURRENT"
  ));
  if (!target) throw new Error(`TEST_PROJECT_OBJECT_NOT_FOUND:${objectId}`);
  return {
    operation: "REMOVE",
    sourceText: raw,
    targetSectionId: target.sectionId === "QUESTION" ? "ANALYSIS" : target.sectionId,
    targetProjectRef: target.objectId,
    content: target.content,
    candidateRef,
    semanticIdentity: target.objectId,
    proposedType: target.objectType,
    polarity: "NEGATED",
    epistemicStatus: "EXPLICIT_USER_STATED",
    epistemicState: "KNOWN",
    assertionKind: "USER_STATED",
    evidenceRefs: [],
  };
};

const pendingRemoval = (
  project: ResearchProjectOwnerProjection,
  raw: string,
  changes: PersistentProjectDeltaChange[],
) => {
  const conversation: ScientificInterpretationConversation = {
    conversationId: "conversation:p1-behavior-02a",
    language: "fr",
    turns: [{ turnId: "turn:p1-behavior-02a:remove", role: "USER", content: raw }],
  };
  const checked = validatePersistentProjectDelta({
    changes,
    relations: [],
    temporalQualifications: [],
    expectedVariableOccasions: [],
  }, raw, project, conversation);
  expect(checked.validation.blocks).toEqual([]);
  const contribution = contributionFromPersistentDelta({
    candidate: checked.candidate!,
    conversation,
    currentProject: project,
    createdAt: "2026-08-31T12:02:00.000Z",
  });
  expect(contribution).not.toBeNull();
  return {
    contribution: contribution!,
    candidate: prepareResearchProjectContributionCandidate(contribution!, project),
  };
};

describe("P1-BEHAVIOR-02A — generic multi-turn delta identity", () => {
  it("D1-A/B — projects one semantic removal once when one inactive item travels through contribution aliases", () => {
    const project = projectWithItems([{ itemId: "variable:x", content: "mesure X" }]);
    const raw = "Je retire la mesure X.";
    const result = pendingRemoval(project, raw, [
      removalChange(project, "variable:x", raw, "candidate:remove:variable:x"),
    ]);

    const contributionAliases = [
      ...result.contribution.scientificContent.candidateObjects,
      ...result.contribution.scientificContent.correctionsAndSupersessions,
    ].filter((item) => item.semanticIdentity === "variable:x");
    expect(contributionAliases).toHaveLength(2);
    expect(new Set(contributionAliases.map((item) => item.itemId))).toEqual(new Set(["candidate:remove:variable:x"]));
    expect(result.candidate.changeSet.changes.filter((change) => change.operation === "REMOVE")).toHaveLength(1);
    expect(result.candidate.canonicalChangeSet.objectChanges.filter((change) => (
      change.operation === "REMOVE" && change.objectId === "variable:x"
    ))).toHaveLength(1);
    expect(result.candidate.humanReviewProjection.sections.flatMap((section) => section.items).filter((item) => (
      item.operation === "REMOVE" && item.content.toLocaleLowerCase("fr-FR").includes("mesure x")
    ))).toHaveLength(1);
  });

  it("D1-C — retains two removals for distinct canonical identities with similar labels", () => {
    const project = projectWithItems([
      { itemId: "variable:x:systolic", content: "mesure X systolique" },
      { itemId: "variable:x:diastolic", content: "mesure X diastolique" },
    ]);
    const raw = "Je retire les deux mesures X, systolique et diastolique.";
    const result = pendingRemoval(project, raw, [
      removalChange(project, "variable:x:systolic", raw, "candidate:remove:variable:x:systolic"),
      removalChange(project, "variable:x:diastolic", raw, "candidate:remove:variable:x:diastolic"),
    ]);

    const removals = result.candidate.canonicalChangeSet.objectChanges.filter((change) => change.operation === "REMOVE");
    expect(removals.map((change) => change.objectId).sort()).toEqual([
      "variable:x:diastolic",
      "variable:x:systolic",
    ]);
    expect(result.candidate.humanReviewProjection.sections.flatMap((section) => section.items)
      .filter((item) => item.operation === "REMOVE")).toHaveLength(2);
  });
});
