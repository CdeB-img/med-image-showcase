// Full pure consumer chain, not a synthetic replacement of currentNavigation.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildFunctionalResetQueryNavigation } from "../functional-reset-progression";
import { currentGovernedNavigationInput } from "../current-navigation-evidence";
import { buildCurrentTurnNavigation, currentCandidateSelectedScopeEvidence } from "../current-turn-navigation";
import { prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import type { PersistentDeltaValidation } from "@/features/protocol-designer/product-bridge";
import { behaviorTurn, behaviorItem, behaviorContribution, adoptBehaviorContribution }
  from "@/features/protocol-designer/functional-reset/__tests__/p1-behavior-01a-contract-fixtures";

const AT = "2026-09-08T15:00:00.000Z";
const network = vi.fn(() => { throw new Error("PROVIDER_FORBIDDEN_IN_CURRENT_SCOPE_TEST"); });
const passedValidation = (): PersistentDeltaValidation => ({ valid: true, acceptedChanges: [], acceptedRelations: [],
  acceptedTemporalQualifications: [], acceptedExpectedVariableOccasions: [], blocks: [], noOps: [], normalizations: [] });

const fixture = () => {
  const first = behaviorTurn("scope:first", "La question scientifique est représentée, le design et la population avec critères sont explicitement définis. L’intervention reste à discuter.");
  const initial = behaviorContribution({ contributionId: "scope:initial", turns: [first], candidateObjects: [
    behaviorItem({ itemId: "scope:question", proposedType: "SCIENTIFIC_QUESTION", content: "Comparer les stratégies explicitement discutées", turnId: first.turnId }),
    behaviorItem({ itemId: "scope:design", proposedType: "STUDY_DESIGN", content: "essai parallèle", turnId: first.turnId }),
    behaviorItem({ itemId: "scope:population", proposedType: "POPULATION", content: "Participants présentant la condition clinique alpha", turnId: first.turnId }),
    behaviorItem({ itemId: "scope:eligibility", proposedType: "ELIGIBILITY_CRITERION", content: "âge minimal : 18 ans", turnId: first.turnId }),
    behaviorItem({ itemId: "scope:inclusion", proposedType: "INCLUSION_CRITERION", content: "inclusion : diagnostic confirmé", turnId: first.turnId }),
    behaviorItem({ itemId: "scope:exclusion", proposedType: "EXCLUSION_CRITERION", content: "exclusion : contre-indication documentée", turnId: first.turnId }),
    // Isolate one existing Standard need. These setup statements are not a scientific gold.
    behaviorItem({ itemId: "scope:comparator", proposedType: "COMPARATOR", content: "Comparateur bêta", turnId: first.turnId }),
    behaviorItem({ itemId: "scope:imaging", proposedType: "IMAGING_MODALITY", content: "IRM, rôle et acquisition définis", turnId: first.turnId }),
    behaviorItem({ itemId: "scope:measure", proposedType: "OUTCOME", content: "Critère principal : résultat alpha", turnId: first.turnId }),
    behaviorItem({ itemId: "scope:time", proposedType: "VISIT", content: "Visite de mesure définie", turnId: first.turnId }),
    behaviorItem({ itemId: "scope:analysis", proposedType: "ANALYSIS_PLAN", content: "Plan d’analyse défini", turnId: first.turnId }),
  ] });
  const project = adoptBehaviorContribution(initial, null, 1);
  const navigation = buildFunctionalResetQueryNavigation({ project, recordedAt: AT });
  expect(navigation.currentAction?.actionCategory).toBe("CLARIFY_BY_ADAPTIVE_EXCHANGE");
  expect(navigation.selection.selected?.affectedBranchRefs).toContain("project-facet:INTERVENTION:INTERVENTION");
  const current = currentGovernedNavigationInput({ project, navigation });
  expect(current).toBeDefined();
  return { project, navigation, current: current! };
};

const invoke = (scope: ReturnType<typeof fixture>, itemType: string, itemContent: string, epistemicState: "KNOWN" | "UNKNOWN" = "KNOWN") => {
  const turn = behaviorTurn(`scope:answer:${itemType}:${epistemicState}`, itemContent);
  const contribution = behaviorContribution({ contributionId: `scope:contribution:${itemType}:${epistemicState}`,
    turns: [turn], candidateObjects: [behaviorItem({ itemId: `scope:item:${itemType}`, proposedType: itemType,
      content: itemContent, turnId: turn.turnId, epistemicState })] });
  const candidate = prepareResearchProjectContributionCandidate(contribution, scope.project);
  expect(candidate.status).toBe("CANDIDATE_PENDING_HUMAN_CONFIRMATION");
  const result = buildCurrentTurnNavigation({ sourceTurnRef: turn.turnId, sourceText: turn.content,
    candidate, contribution, validation: passedValidation(), currentProject: scope.project,
    currentNavigation: scope.current, requestKind: "USER_TURN",
    interaction: { interactionRef: scope.navigation.currentPresentation!.presentationId,
      sourceActionRef: scope.navigation.currentAction!.selectedActionId, owner: "QUERY_NAVIGATION",
      purpose: scope.navigation.currentPresentation!.intent, expectedResponseKind: "QRY_INFORMATION_RESPONSE",
      targetRefs: [scope.navigation.currentAction!.targetRef],
      informationNeedRefs: [...scope.navigation.currentAction!.navigationNeedRefs],
      projectRef: scope.project.projectId, projectVersion: scope.project.versionId, projectDigest: scope.project.projectDigest },
  });
  return { result, candidate, contribution };
};

describe("Pass3A existing Standard needs → candidate review dependency", () => {
  beforeEach(() => { network.mockClear(); vi.stubGlobal("fetch", network); });
  afterEach(() => { expect(network).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });

  it("binds grouped impacts to the actual grouped action without weakening the consumer gate", () => {
    const { current } = fixture();
    expect(current.selected.impacts.length).toBeGreaterThan(0);
    expect(current.selected.impacts.every((impact) => impact.candidateRef === current.selected.candidateId)).toBe(true);
  });

  it("suspends the old same-scope ASK for candidate review without declaring its need resolved", () => {
    const scope = fixture();
    const before = JSON.stringify({ project: scope.project, navigation: scope.navigation });
    const { result } = invoke(scope, "INTERVENTION", "L’intervention est le traitement alpha.");
    expect(result.excludedNativeReasons).toContain("CURRENT_CANDIDATE_AFFECTS_SELECTED_SCOPE_REQUIRES_REVIEW");
    expect(result.excludedNativeReasons).not.toContain("MATERIAL_IMPACT_NOT_IN_CAPTURED_ACTION");
    expect(result.envelope.action).toBe("PROPOSE");
    expect(result.currentCandidateScopeEvidence.affected.map((item) => item.needRef))
      .toEqual(scope.current.selected.navigationNeedRefs);
    expect(result.currentCandidateScopeEvidence.needResolutionDeclared).toBe(false);
    expect(scope.current.selected.navigationNeedRefs.some((ref) => result.envelope.alreadyProvidedInformationRefs.includes(ref))).toBe(false);
    expect(JSON.stringify({ project: scope.project, navigation: scope.navigation })).toBe(before);
  });

  it("keeps the actual high-value Standard ASK available for an unrelated current candidate", () => {
    const scope = fixture();
    const { result } = invoke(scope, "VISIT", "Une visite clinique complémentaire est prévue.");
    expect(result.currentCandidateScopeEvidence.affected).toEqual([]);
    expect(result.excludedNativeReasons).not.toContain("MATERIAL_IMPACT_NOT_IN_CAPTURED_ACTION");
    expect(result.excludedNativeReasons).not.toContain("CURRENT_CANDIDATE_AFFECTS_SELECTED_SCOPE_REQUIRES_REVIEW");
    expect(result.highValueNextActionAvailable).toBe(true);
    expect(result.selection.selected?.candidateId).toBe(scope.current.selected.candidateId);
    expect(result.envelope.action).toBe("ASK_QUESTION");
  });

  it("does not turn UNKNOWN into an explicit answer or hidden resolution", () => {
    const scope = fixture();
    const { result } = invoke(scope, "INTERVENTION", "Le choix de l’intervention reste inconnu.", "UNKNOWN");
    expect(result.currentCandidateScopeEvidence.affected).toEqual([]);
    expect(result.excludedNativeReasons).not.toContain("CURRENT_CANDIDATE_AFFECTS_SELECTED_SCOPE_REQUIRES_REVIEW");
    expect(result.currentCandidateScopeEvidence.needResolutionDeclared).toBe(false);
  });

  it("cannot map an opaque needId by lexical mentions when no structured scope binding exists", () => {
    const scope = fixture();
    const { candidate } = invoke(scope, "INTERVENTION", "L’intervention est le traitement alpha.");
    const result = currentCandidateSelectedScopeEvidence({ candidate, selected: scope.current.selected, informationNeedScopes: [] });
    expect(result.affected).toEqual([]);
    expect(result.needResolutionDeclared).toBe(false);
  });
});
