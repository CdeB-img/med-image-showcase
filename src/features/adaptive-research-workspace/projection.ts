import { logicalDigest } from "@/features/knowledge-engine/canonical";
import type { ProjectDataAnalysisView } from "@/features/data-analysis-planning/types";
import type { QueryNavigationProductProjection } from "@/features/query-navigation/product-contracts";
import type { ResearchProjectDesignResult } from "@/features/research-project-construction/types";
import type { ValidationProductSummary } from "@/features/validation-architecture/product-gates";
import type { AdaptiveResearchWorkspaceProjection, WorkspaceAttentionItem, WorkspaceDocumentSummary, WorkspaceDomainSummary, WorkspaceSemanticState } from "./contracts";

const domainState = (state: ResearchProjectDesignResult["localReadiness"][number]["state"]): WorkspaceSemanticState => {
  if (state === "READY") return "ADOPTED";
  if (state === "READY_WITH_OPEN_ITEMS" || state === "READY_WITH_LIMITATIONS" || state === "PARTIAL") return "WARNING";
  if (state === "NOT_APPLICABLE") return "NOT_APPLICABLE";
  if (state === "BLOCKED") return "BLOCKING";
  return "NOT_EVALUABLE";
};

const documentState = (availability: ResearchProjectDesignResult["projectionReadiness"][number]["availability"]): WorkspaceDocumentSummary["state"] => {
  if (availability === "READY_FOR_PROJECTION") return "GENERATABLE";
  if (availability === "PARTIALLY_GENERATABLE") return "PARTIALLY_GENERATABLE";
  return "NOT_GENERATABLE";
};

const attention = (project: Readonly<ResearchProjectDesignResult>, navigation: Readonly<QueryNavigationProductProjection>, validation: Readonly<ValidationProductSummary>): WorkspaceAttentionItem[] => {
  const decisions = project.decisionsRequired.filter((item) => item.status === "PENDING").map((item) => ({
    attentionId: `workspace-attention:decision:${item.gateId}`,
    kind: "ACTION_REQUIRED" as const,
    sourceRef: item.gateId,
    sourceType: "PROJECT_DECISION" as const,
    owner: "RESEARCH_PROJECT",
    semanticState: "CANDIDATE" as const,
    label: item.label,
    summary: item.reason,
    targetRef: `project-decision:${item.gateId}`,
    relatedActionRef: navigation.selectedAction?.selectedActionId ?? null,
    blocking: false,
    actionable: true,
    provenanceRefs: [item.gateId],
    limitations: [],
  }));
  const unknowns = project.missingInformation.map((value, index) => ({
    attentionId: `workspace-attention:unknown:${index + 1}`,
    kind: "UNKNOWN" as const,
    sourceRef: `project-unknown:${index + 1}`,
    sourceType: "PROJECT_UNKNOWN" as const,
    owner: "RESEARCH_PROJECT",
    semanticState: "UNKNOWN" as const,
    label: "Information à préciser",
    summary: value,
    targetRef: "project:unknowns",
    relatedActionRef: navigation.selectedAction?.selectedActionId ?? null,
    blocking: false,
    actionable: true,
    provenanceRefs: project.provenance.sourceRefs,
    limitations: [],
  }));
  const contradictions = project.contradictions.map((value, index) => ({
    attentionId: `workspace-attention:contradiction:${index + 1}`,
    kind: "BLOCKING" as const,
    sourceRef: `project-contradiction:${index + 1}`,
    sourceType: "PROJECT_CONTRADICTION" as const,
    owner: "RESEARCH_PROJECT",
    semanticState: "BLOCKING" as const,
    label: "Contradiction à arbitrer",
    summary: value,
    targetRef: "project:contradictions",
    relatedActionRef: navigation.selectedAction?.selectedActionId ?? null,
    blocking: true,
    actionable: true,
    provenanceRefs: project.provenance.sourceRefs,
    limitations: [],
  }));
  const blockers: WorkspaceAttentionItem[] = validation.blockers.map((item) => ({
    attentionId: `workspace-attention:val:${item.findingRef}`,
    kind: "BLOCKING" as const,
    sourceRef: item.findingRef,
    sourceType: "VAL_FINDING" as const,
    owner: "VAL-001",
    semanticState: "BLOCKING" as const,
    label: `Validation · ${item.context}`,
    summary: item.message,
    targetRef: `validation:${item.findingRef}`,
    relatedActionRef: navigation.selectedAction?.selectedActionId ?? null,
    blocking: true,
    actionable: true,
    provenanceRefs: [item.findingRef],
    limitations: [],
  }));
  const reviews = validation.reviewsRequired.map((item) => ({
    attentionId: `workspace-attention:review:${item.requestRef}`,
    kind: "REVIEW_REQUIRED" as const,
    sourceRef: item.requestRef,
    sourceType: "VAL_REVIEW" as const,
    owner: item.owner,
    semanticState: "CANDIDATE" as const,
    label: "Revue humaine requise",
    summary: item.message,
    targetRef: `validation-review:${item.requestRef}`,
    relatedActionRef: navigation.selectedAction?.selectedActionId ?? null,
    blocking: false,
    actionable: true,
    provenanceRefs: [item.requestRef],
    limitations: [],
  }));
  if (validation.status === "NOT_EVALUABLE") blockers.push({
    attentionId: "workspace-attention:validation-not-evaluable",
    kind: "TECHNICAL_PREREQUISITE",
    sourceRef: "VAL-001:CURRENT_PRODUCT_STATE",
    sourceType: "VAL_GATE",
    owner: "VAL-001",
    semanticState: "NOT_EVALUABLE",
    label: "Validation non évaluable",
    summary: "Aucun historique transverse de ValidationRuns n’est disponible. Ce prérequis système n’est pas une question scientifique.",
    targetRef: "validation:summary",
    relatedActionRef: navigation.selectedAction?.selectedActionId ?? null,
    blocking: false,
    actionable: false,
    provenanceRefs: validation.gates.map((gate) => gate.gateId),
    limitations: ["NO_PERSISTED_TRANSVERSE_VALIDATION_RUN"],
  });
  return [...contradictions, ...blockers, ...reviews, ...decisions, ...unknowns];
};

export const buildAdaptiveResearchWorkspaceProjection = (input: {
  project: Readonly<ResearchProjectDesignResult>;
  navigation: Readonly<QueryNavigationProductProjection>;
  validation: Readonly<ValidationProductSummary>;
  dataAnalysis: Readonly<ProjectDataAnalysisView>;
}): AdaptiveResearchWorkspaceProjection => {
  const { project, navigation, validation, dataAnalysis } = input;
  const domains: WorkspaceDomainSummary[] = project.localReadiness.map((item) => ({
    domainId: item.domain,
    label: item.domain.replace(/_/g, " ").toLocaleLowerCase("fr-FR"),
    owner: item.domain,
    state: domainState(item.state),
    summary: item.openItems.join(" · ") || item.requirementsSatisfied.join(" · ") || item.state,
    targetRef: `project-domain:${item.domain}`,
    sourceRefs: [`project-readiness:${item.domain}`],
    openItemCount: item.openItems.length,
  }));
  domains.push({
    domainId: "DATA_ANALYSIS",
    label: "données et analyses",
    owner: "DAI-001",
    state: dataAnalysis.readiness.overallStatus === "READY" ? "ADOPTED" : dataAnalysis.readiness.overallStatus === "BLOCKED" ? "BLOCKING" : "WARNING",
    summary: dataAnalysis.readiness.blockingItems.join(" · ") || dataAnalysis.readiness.warningItems.join(" · ") || "Vue Data & Analysis disponible.",
    targetRef: "workspace:data-analysis",
    sourceRefs: [dataAnalysis.projectionId],
    openItemCount: dataAnalysis.readiness.blockingCount + dataAnalysis.readiness.warningCount + dataAnalysis.readiness.unknownCount,
  });
  const documents = project.projectionReadiness.map((item) => ({
    projection: item.projection,
    owner: "DOC-001" as const,
    state: documentState(item.availability),
    sourceRef: `project-projection-readiness:${item.projection}`,
    missing: [...item.missing],
    targetRef: `document:${item.projection.toLocaleLowerCase("fr-FR").replace(/ /g, "-")}`,
    projectVersion: project.candidateVersion.versionId,
    stale: false,
  }));
  const sourceDigests = [project.resultDigest, navigation.sourceStateDigest, dataAnalysis.projectionId, ...validation.gates.map((gate) => gate.evaluationDigest)];
  const workspaceProjectionId = `adaptive-research-workspace:${logicalDigest({ project: project.resultId, version: project.candidateVersion.versionId, sourceDigests })}`;
  return {
    workspaceProjectionId,
    projectionVersion: "1.0.0",
    sourceProjectRef: project.resultId,
    sourceProjectVersion: project.candidateVersion.versionId,
    sourceProjectDigest: project.resultDigest,
    project: {
      question: project.scientificQuestion.text,
      state: project.candidateVersion.status === "FROZEN_BY_HUMAN" ? "ADOPTED" : "CANDIDATE",
      designSummary: project.selectedStudyDesignCandidate
        ? project.studyDesignCandidates.find((item) => item.designId === project.selectedStudyDesignCandidate?.designId)?.label ?? "Plan adopté"
        : `${project.studyDesignCandidates.length} stratégie(s) candidate(s), aucune sélection automatique`,
      branchRefs: project.impactGraph.nodes.map((item) => item.nodeId),
      limitations: [...project.limitations],
    },
    navigation: {
      projectionRef: navigation.projectionId,
      sourceStateDigest: navigation.sourceStateDigest,
      status: navigation.status,
      selectedActionRef: navigation.selectedAction?.selectedActionId ?? null,
      alternatives: navigation.alternatives.map((item) => ({ candidateRef: item.candidateId, label: item.actionLabel })),
      whyNow: navigation.summary.whyNow,
      deferAllowed: navigation.summary.deferAllowed,
      systemPrerequisite: navigation.summary.systemPrerequisite,
    },
    attention: attention(project, navigation, validation),
    domains,
    documents,
    validation: {
      status: validation.status,
      blockerCount: validation.blockers.length,
      reviewCount: validation.reviewsRequired.length,
      gateRefs: validation.gates.map((gate) => gate.gateId),
    },
    trace: {
      decisionRefs: [...project.candidateVersion.decisionRecordIds],
      provenanceRefs: [...project.provenance.sourceRefs],
      validationRefs: validation.gates.map((gate) => gate.evaluationDigest),
      navigationRefs: [navigation.projectionId, navigation.explanation.traceRef],
      sourceDigests,
    },
    limitations: [...new Set([...project.limitations, ...validation.limitations, "NAVIGATION_MEMORY_SESSION_SCOPED"])],
    projectionOnly: true,
    sourceOfTruth: false,
    projectWriteAuthorized: false,
    validationWriteAuthorized: false,
    queryWriteAuthorized: false,
    documentWriteAuthorized: false,
    providerCalls: 0,
    globalProgressScore: null,
  };
};

export const inspectWorkspaceProjectionFreshness = (projection: Readonly<AdaptiveResearchWorkspaceProjection>, project: Readonly<ResearchProjectDesignResult>) => ({
  fresh: projection.sourceProjectVersion === project.candidateVersion.versionId && projection.sourceProjectDigest === project.resultDigest,
  state: projection.sourceProjectVersion === project.candidateVersion.versionId && projection.sourceProjectDigest === project.resultDigest ? "CURRENT" as const : "STALE" as const,
  expectedProjectVersion: project.candidateVersion.versionId,
  observedProjectVersion: projection.sourceProjectVersion,
});

export const computeWorkspaceVisibility = (mode: "STANDARD" | "EXPERT") => ({
  projectSummary: true,
  nextAction: true,
  attention: true,
  domainSummaries: true,
  documents: true,
  sourceRefs: mode === "EXPERT",
  owners: mode === "EXPERT",
  versions: mode === "EXPERT",
  digests: mode === "EXPERT",
  queryTrace: mode === "EXPERT",
  validationEvidence: mode === "EXPERT",
});
