import { describe, expect, it } from "vitest";
import { buildCurrentTurnNavigation, type CurrentGovernedNavigationInput } from "../current-turn-navigation";
import { selectNextAction } from "../engine";
import { validateNavigationSelection } from "../validation";
import { makeContext, TWO_OPTIONS_STATE, USER_UNKNOWN_STATE } from "./fixtures";
import { contributionFromPersistentDelta, validatePersistentProjectDelta } from "@/features/protocol-designer/product-bridge";
import { prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import {
  adoptBehaviorContribution, behaviorContribution, behaviorItem, behaviorTurn,
} from "../../protocol-designer/functional-reset/__tests__/p1-behavior-01a-contract-fixtures";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation/contracts";

const fixture = (comparison = false) => {
  const initialTurn = behaviorTurn("candidate-native:initial", "Nous souhaitons étudier le phénomène alpha.");
  const initial = behaviorContribution({ contributionId: "candidate-native:initial-contribution", turns: [initialTurn],
    candidateObjects: [behaviorItem({ itemId: "objective:alpha", proposedType: "OBJECTIVE", content: "Étudier le phénomène alpha", sourceText: "étudier le phénomène alpha", turnId: initialTurn.turnId })] });
  const project = adoptBehaviorContribution(initial, null, 1);
  const turn = behaviorTurn("candidate-native:current", "Une visite de contrôle est prévue.");
  const conversation: ScientificInterpretationConversation = { conversationId: "conversation:candidate-native", language: "fr", turns: [turn] };
  const checked = validatePersistentProjectDelta({
    changes: [{ operation: "ADD", candidateRef: "visit:control", semanticIdentity: "VISIT:control", proposedType: "VISIT", content: "Visite de contrôle", sourceText: turn.content,
      polarity: "AFFIRMED", epistemicState: "KNOWN", epistemicStatus: "EXPLICIT_USER_STATED", assertionKind: "USER_STATED", evidenceRefs: [] }],
    relations: [], temporalQualifications: [], expectedVariableOccasions: [],
  }, turn.content, project, conversation);
  expect(checked.validation).toMatchObject({ valid: true, blocks: [] });
  const contribution = contributionFromPersistentDelta({ candidate: checked.candidate!, conversation, currentProject: project, createdAt: turn.createdAt! })!;
  const candidate = prepareResearchProjectContributionCandidate(contribution, project);
  const nativeSelection = selectNextAction(makeContext(comparison ? TWO_OPTIONS_STATE : USER_UNKNOWN_STATE, { projectRef: project.projectId, projectVersion: project.versionId }));
  expect(validateNavigationSelection(nativeSelection).valid).toBe(true);
  const selected = nativeSelection.selected!;
  const currentNavigation: CurrentGovernedNavigationInput = {
    projectId: project.projectId, projectVersion: project.versionId, projectDigest: project.projectDigest,
    selectedActionRef: selected.candidateId, sourceStateDigest: nativeSelection.context.sourceStateDigest, selected,
    authorizedContent: [{ ref: selected.targetRef, text: selected.explanation, status: "UNKNOWN" }], alreadyProvidedInformationRefs: [],
  };
  const interaction: ScientificInterpretationConversation["interactionContext"] = {
    interactionRef: "candidate-native:interaction", sourceActionRef: selected.candidateId, owner: "QUERY_NAVIGATION", purpose: selected.explanation,
    expectedResponseKind: "QRY_INFORMATION_RESPONSE", targetRefs: [selected.targetRef], informationNeedRefs: selected.navigationNeedRefs,
    projectRef: project.projectId, projectVersion: project.versionId, projectDigest: project.projectDigest,
  };
  return {
    sourceTurnRef: turn.turnId, sourceText: turn.content, candidate, contribution, validation: checked.validation,
    currentProject: project, currentNavigation, interaction, requestKind: "USER_TURN" as const,
  };
};

const check = (input: Parameters<typeof buildCurrentTurnNavigation>[0]) => {
  const result = buildCurrentTurnNavigation(input);
  expect(validateNavigationSelection(result.selection)).toMatchObject({ valid: true, issues: [] });
  expect(result.candidateAdopted).toBe(false);
  expect(result.envelope.projectWriteAuthorized).toBe(false);
  return result;
};

describe("PASS3A — enough for a candidate and a useful next action may coexist", () => {
  it("compares real alternatives and retains the candidate when current high-value clarification wins", () => {
    const input = fixture();
    const candidateBefore = JSON.stringify(input.candidate);
    const projectBefore = JSON.stringify(input.currentProject);
    const result = check(input);
    expect(result.selection.context.sufficiencyEvidenceRefs).toContain(input.candidate.contributionRef);
    expect(result.selection.candidates).toHaveLength(2);
    expect(result.selection.selected!.candidateId).toBe(input.currentNavigation.selected.candidateId);
    expect(result.envelope.action).toBe("ASK_QUESTION");
    expect(result.envelope.selectedInformationNeedRef).toBe(input.currentNavigation.selected.navigationNeedRefs[0]);
    expect(result.envelope.candidateRef).toBe(input.candidate.contributionRef);
    expect(result.envelope.purpose).toBe(input.currentNavigation.selected.explanation);
    expect(result.envelope.authorizedContent).toEqual(input.currentNavigation.authorizedContent);
    expect(JSON.stringify(input.candidate)).toBe(candidateBefore);
    expect(JSON.stringify(input.currentProject)).toBe(projectBefore);
  });

  it("retains a native comparison with actual alternatives instead of always presenting the new candidate", () => {
    const input = fixture(true);
    const result = check(input);
    expect(result.selection.candidates).toHaveLength(2);
    expect(result.selection.selected!.actionCategory).toBe("COMPARE_OPTIONS");
    expect(result.envelope.actionCategory).toBe("COMPARE_OPTIONS");
    expect(result.envelope.action).toBe("PROPOSE");
    expect(result.envelope.targetRefs).toEqual(expect.arrayContaining(input.currentNavigation.selected.knownOptionRefs));
    expect(result.envelope.candidateRef).toBe(input.candidate.contributionRef);
  });

  it("retains the already-answered native question as an ineligible alternative, not as the visible WHAT", () => {
    const input = fixture();
    input.currentNavigation = { ...input.currentNavigation, alreadyProvidedInformationRefs: [input.currentNavigation.selected.targetRef] };
    const result = check(input);
    const native = result.selection.candidates.find((item) => item.candidateId === input.currentNavigation.selected.candidateId)!;
    expect(native.eligibility).toBe("INELIGIBLE");
    expect(native.eligibilityReasons).toContain("INFORMATION_ALREADY_EXPLICITLY_PROVIDED");
    expect(result.envelope.action).toBe("PROPOSE");
    expect(result.envelope.selectedInformationNeedRef).toBeNull();
    expect(result.envelope.candidateRef).toBe(input.candidate.contributionRef);
  });

  it.each(["UNKNOWN", "NO_DECISION_EFFECT"] as const)("does not ask on %s discrimination even if a candidate exists", (discrimination) => {
    const input = fixture();
    input.currentNavigation = { ...input.currentNavigation, selected: { ...input.currentNavigation.selected,
      informationValue: { ...input.currentNavigation.selected.informationValue, discrimination } } };
    const result = check(input);
    expect(result.envelope.action).toBe("PROPOSE");
    expect(result.selection.candidates.find((item) => item.candidateId === input.currentNavigation.selected.candidateId)!.eligibility).toBe("INELIGIBLE");
  });

  it("does not convert an unrepresented impact into a material question", () => {
    const input = fixture();
    input.currentNavigation = { ...input.currentNavigation, selected: { ...input.currentNavigation.selected, impacts: [] } };
    const result = check(input);
    expect(result.envelope.action).toBe("PROPOSE");
    expect(result.selection.candidates.find((item) => item.candidateId === input.currentNavigation.selected.candidateId)!.eligibilityReasons)
      .toContain("MATERIAL_IMPACT_NOT_IN_CAPTURED_ACTION");
  });

  it("does not resolve equal non-dominated alternatives by array order or incidental identity", () => {
    const input = fixture(true);
    const baseline = check({ ...input, currentNavigation: undefined, interaction: undefined });
    input.currentNavigation = { ...input.currentNavigation, selected: { ...input.currentNavigation.selected,
      informationValue: { ...baseline.selection.selected!.informationValue }, dependencies: [] } };
    const result = check(input);
    expect(result.selection.nonDominated).toHaveLength(2);
    expect(result.selection.selected).toBeNull();
    expect(result.selection.trace.arbitraryTieBreakUsed).toBe(false);
    expect(result.envelope.action).toBe("RESPOND");
    expect(result.envelope.actionCategory).toBeNull();
    expect(result.envelope.selectedInformationNeedRef).toBeNull();
    expect(result.envelope.candidateRef).toBe(input.candidate.contributionRef);
  });

  it("still treats a USER_TURN explanation without a new candidate as a response, not a repeated QRY prompt", () => {
    const input = fixture();
    const result = check({ ...input, sourceText: "Pourquoi cette question ?", candidate: null, contribution: null, validation: null });
    expect(result.envelope.action).toBe("RESPOND");
    expect(result.envelope.selectedInformationNeedRef).toBeNull();
  });

  it("does not add an unbound native alternative to a valid candidate", () => {
    const input = fixture();
    input.currentNavigation = { ...input.currentNavigation, projectDigest: "stale:digest" };
    const result = check(input);
    expect(result.selection.candidates).toHaveLength(1);
    expect(result.envelope.action).toBe("PROPOSE");
    expect(result.envelope.selectedInformationNeedRef).toBeNull();
  });
});
