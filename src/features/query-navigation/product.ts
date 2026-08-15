import type { ResearchProjectDesignResult } from "@/features/research-project-construction/types";
import { buildQueryNavigationContext } from "./adapters";
import { makeQueryNavigationId } from "./canonical";
import { selectNextAction } from "./engine";
import { buildQuestionPresentationRequest, buildSelectedNavigationAction, canPresentNavigationAction, createQueryNavigationMemory } from "./lifecycle";
import type { QueryNavigationSourceState, ValidationGateSignal } from "./contracts";
import type { QueryNavigationMemory } from "./lifecycle-contracts";
import type { QueryNavigationProductProjection, QueryNavigationProductStatus } from "./product-contracts";

const defaultValidationGates = (): ValidationGateSignal[] => [{
  gateId: "V1_READY",
  status: "NOT_EVALUABLE",
  runRefs: [],
  findingRefs: [],
  reviewRequestRefs: [],
  affectedBranchRefs: ["project:v1-readiness"],
  owner: "VAL-001",
  reason: "Aucun historique transverse persisté de ValidationRuns n’est attaché à cette session.",
}];

export const buildProjectQueryNavigationSourceState = (project: Readonly<ResearchProjectDesignResult>, validationGates: ValidationGateSignal[] = defaultValidationGates()): QueryNavigationSourceState => ({
  projectUnknowns: project.adaptiveQuestions.filter((item) => !item.answeredValue).map((item) => ({
    ref: item.questionId,
    version: project.candidateVersion.versionId,
    intent: item.label,
    owner: "RESEARCH_PROJECT",
    decisionRefs: [item.decisionBlock],
    branchRefs: [item.decisionBlock],
    knownOptions: item.suggestedAnswers.map((answer) => answer.value),
  })),
  projectAmbiguities: [],
  projectContradictions: project.contradictions.map((value, index) => ({
    ref: `project-contradiction:${index + 1}`,
    version: project.candidateVersion.versionId,
    intent: value,
    owner: "RESEARCH_PROJECT",
    decisionRefs: project.decisionsRequired.filter((item) => item.status === "PENDING").map((item) => item.gateId),
    branchRefs: ["project:construction"],
  })),
  dataNeeds: [],
  planningDecisionRequirements: [],
  validationFindings: [],
  validationHumanReviews: [],
  validationSemanticReviews: [],
  validationGates: structuredClone(validationGates),
  readiness: project.localReadiness.map((item) => ({
    readinessId: `project-readiness:${item.domain}`,
    owner: item.domain,
    sourceVersion: project.candidateVersion.versionId,
    status: item.state === "READY" || item.state === "READY_WITH_OPEN_ITEMS" || item.state === "READY_WITH_LIMITATIONS" ? "READY" : item.state === "NOT_APPLICABLE" ? "NOT_APPLICABLE" : item.state === "BLOCKED" ? "BLOCKER" : item.state === "SPECIALIZED_ENGINE_REQUIRED" ? "DECISION_REQUIRED" : "UNKNOWN",
    affectedBranchRefs: [`project-domain:${item.domain}`],
    decisionRefs: [],
    reason: item.openItems.join(" ") || item.requirementsSatisfied.join(" ") || item.state,
    sourceRef: `project-readiness:${item.domain}`,
  })),
  documentGenerability: project.projectionReadiness.filter((item) => item.projection === "Protocol").map((item) => ({
    projectionRef: "projection:protocol",
    sourceVersion: project.candidateVersion.versionId,
    status: item.availability === "READY_FOR_PROJECTION" ? "GENERATABLE" : item.availability === "PARTIALLY_GENERATABLE" ? "PARTIALLY_GENERATABLE" : item.availability === "STRUCTURE_ONLY" ? "NOT_GENERATABLE" : "NOT_GENERATABLE",
    owner: "DOC-001",
    affectedBranchRefs: ["projection:protocol"],
    reason: item.missing.join(" ") || item.notice,
    ruleRef: null,
    resumeCondition: item.missing.join(" ") || null,
  })),
  knowledgeGaps: project.missingInformation.filter((value) => !project.adaptiveQuestions.some((question) => question.label === value)).map((value, index) => ({
    ref: `project-knowledge-gap:${index + 1}`,
    version: project.candidateVersion.versionId,
    owner: "KNOWLEDGE",
    intent: value,
    decisionRefs: [],
    branchRefs: ["project:knowledge"],
    evidenceGap: true,
  })),
  dependencies: project.dependencies.map((item) => ({
    dependencyId: item.dependencyId,
    prerequisiteRef: item.from,
    dependentRef: item.to,
    kind: "PROJECT_GRAPH",
    status: item.changeEffect === "PRESERVED" || item.changeEffect === "UNAFFECTED_DEMONSTRATED" ? "SATISFIED" : "OPEN",
    sourceRef: item.dependencyId,
  })),
});

const productStatus = (
  selection: ReturnType<typeof selectNextAction>,
  selected: ReturnType<typeof buildSelectedNavigationAction> | null,
  selectedCandidate: ReturnType<typeof selectNextAction>["selected"],
): QueryNavigationProductStatus => {
  if (selection.trace.outcome === "REFUSED") return "REFUSED";
  if (selection.trace.outcome === "SUFFICIENT_FOR_CURRENT_STEP") return "SUFFICIENT_FOR_CURRENT_STEP";
  if (selection.trace.outcome === "DEFERRED") return "DEFERRED";
  if (selection.trace.outcome === "BLOCKED") return "BLOCKED";
  if (selection.trace.outcome === "NO_ACTIONABLE_CANDIDATE") return "NO_ACTIONABLE_CANDIDATE";
  if (!selected && selection.nonDominated.length > 1) return "MULTIPLE_OPTIONS";
  if (selected?.actionCategory === "REQUEST_HUMAN_DECISION" || selected?.actionCategory === "COMPARE_OPTIONS") return "WAITING_FOR_HUMAN_REVIEW";
  if (selectedCandidate?.capabilityRef === "VALIDATION_RUNTIME") return "NOT_EVALUABLE";
  if (selected?.owner === "VAL-001" && selected.actionCategory === "TRIGGER_METHODOLOGICAL_REVIEW") return "NOT_EVALUABLE";
  return selected ? "READY_TO_PRESENT" : "NO_ACTIONABLE_CANDIDATE";
};

export const buildQueryNavigationProductProjection = (
  project: Readonly<ResearchProjectDesignResult>,
  memory = createQueryNavigationMemory(project.resultId, project.candidateVersion.versionId),
  chosenCandidateRef: string | null = null,
  validationGates?: ValidationGateSignal[],
): QueryNavigationProductProjection => {
  const sourceState = buildProjectQueryNavigationSourceState(project, validationGates);
  const context = buildQueryNavigationContext({
    projectRef: project.resultId,
    projectVersion: project.candidateVersion.versionId,
    sourceState,
    currentUsageRef: "PROTOCOL_DESIGNER_PROJECT_SURFACE",
    limitations: ["NAVIGATION_MEMORY_SESSION_SCOPED", "NO_PERSISTED_TRANSVERSE_VALIDATION_RUN_ASSUMED"],
  });
  const selection = selectNextAction(context);
  const chosenCandidate = chosenCandidateRef ? selection.nonDominated.find((candidate) => candidate.candidateId === chosenCandidateRef) ?? null : selection.selected;
  const selectedAction = chosenCandidate ? buildSelectedNavigationAction(selection, chosenCandidate) : null;
  const presentable = selectedAction && canPresentNavigationAction(selectedAction, memory) && ["CLARIFY_BY_ADAPTIVE_EXCHANGE", "COMPARE_OPTIONS", "REQUEST_HUMAN_DECISION"].includes(selectedAction.actionCategory);
  const questionPresentation = presentable ? buildQuestionPresentationRequest(selectedAction, chosenCandidate!) : null;
  const status = productStatus(selection, selectedAction, chosenCandidate);
  const selectedCandidate = chosenCandidate ?? null;
  const isSystemPrerequisite = selectedCandidate?.capabilityRef === "VALIDATION_RUNTIME";
  return {
    projectionVersion: "1.0.0",
    projectionId: makeQueryNavigationId("qry-product", { contextRef: context.contextId, memoryDigest: memory.digest, chosenCandidateRef }),
    projectRef: project.resultId,
    projectVersion: project.candidateVersion.versionId,
    sourceStateDigest: context.sourceStateDigest,
    status,
    summary: {
      status,
      actionLabel: selectedCandidate?.actionLabel ?? null,
      targetRef: selectedCandidate?.targetRef ?? null,
      owner: selectedCandidate?.owner ?? null,
      reason: selectedCandidate?.explanation ?? selection.trace.explanations.join(" "),
      whyNow: selectedCandidate?.explanation ?? "Plusieurs actions restent non dominées.",
      unlockConsequences: selectedCandidate?.impacts.filter((impact) => impact.kind === "DOWNSTREAM").map((impact) => impact.consequence) ?? [],
      affectedDecisionRefs: selectedCandidate?.affectedDecisionRefs ?? [],
      affectedBranchRefs: selectedCandidate?.affectedBranchRefs ?? [],
      deferAllowed: Boolean(selectedCandidate && selectedCandidate.actionCategory !== "REFUSE_PROTOCOL_PROJECTION"),
      deferConsequence: selectedCandidate?.deferConsequence ?? null,
      alternativeCount: selection.nonDominated.length,
      systemPrerequisite: isSystemPrerequisite,
    },
    selectedAction,
    alternatives: selection.nonDominated.map((item) => structuredClone(item)),
    questionPresentation,
    answerContract: questionPresentation?.expectedAnswerKind ?? null,
    selection,
    memory: structuredClone(memory),
    explanation: {
      pd009RuleRefs: selectedCandidate?.pd009RuleRefs ?? [],
      eligibility: selectedCandidate?.eligibilityReasons ?? [],
      informationValue: selectedCandidate?.informationValue ?? null,
      dependencies: selectedCandidate?.dependencies.map((item) => item.dependencyId) ?? [],
      impacts: selectedCandidate?.impacts.map((item) => item.impactId) ?? [],
      dominance: structuredClone(selection.trace.dominanceEdges),
      traceRef: selection.trace.traceId,
      traceDigest: selection.trace.digest,
      validationRefs: sourceState.validationGates.flatMap((gate) => [gate.gateId, ...gate.runRefs, ...gate.findingRefs, ...gate.reviewRequestRefs]),
      provenanceRefs: selectedCandidate?.provenance.sourceRefs ?? [],
      limitations: [...context.limitations, ...(selectedCandidate?.provenance.limitations ?? [])],
    },
    projectionOnly: true,
    sourceOfTruth: false,
    projectWriteAuthorized: false,
    providerCalls: 0,
    pd011QualificationClaimed: false,
  };
};
