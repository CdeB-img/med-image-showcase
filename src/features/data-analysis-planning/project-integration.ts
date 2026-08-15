import type { HumanDecisionEnvelope } from "@/features/protocol-designer/human-decision";
import type { ResearchProjectDesignResult } from "@/features/research-project-construction/types";
import { canonicalReference, canonicalPlanningValue, digestPlanningValue, validatePlanningContribution } from "./contracts";
import {
  DATA_ANALYSIS_PLANNING_VERSION,
  type BiostatisticsPlanningPayload,
  type DataAnalysisPlanningContribution,
  type DataManagementPlanningPayload,
  type PlanningDiagnostic,
  type PlanningReadiness,
  type ProjectDataAnalysisState,
  type ProjectDataAnalysisView,
  type StudyDataPlanningPayload,
} from "./types";

export type ProjectPlanningDecisionResult =
  | { applied: true; project: ResearchProjectDesignResult; priorProject: ResearchProjectDesignResult; findings: PlanningDiagnostic[] }
  | { applied: false; project: ResearchProjectDesignResult; findings: PlanningDiagnostic[] };

const finding = (code: string, message: string, targets: string[] = []): PlanningDiagnostic => ({
  code,
  severity: "ERROR",
  message,
  targetRefs: targets,
  owner: "RESEARCH_PROJECT",
  blockingLevel: "BLOCKING_FOR_ANALYSIS_PLAN",
  autoFixed: false,
});

export const contributionDecisionProvenance = (contribution: Readonly<DataAnalysisPlanningContribution>) => [
  `contribution:${contribution.contributionId}`,
  `contribution-digest:${contribution.integrity.contributionDigest}`,
  `content-digest:${contribution.integrity.contentDigest}`,
  `source-project:${contribution.sourceProjectId}@${contribution.sourceProjectVersion}`,
];

const readState = (project: Readonly<ResearchProjectDesignResult>): ProjectDataAnalysisState => {
  const candidate = project.dataAnalysisPlanningState as Partial<ProjectDataAnalysisState> | undefined;
  if (candidate?.stateVersion === DATA_ANALYSIS_PLANNING_VERSION && candidate.sourceProjectId === project.documentHandoff.projectId) {
    return {
      stateVersion: DATA_ANALYSIS_PLANNING_VERSION,
      sourceProjectId: candidate.sourceProjectId,
      sourceProjectVersion: candidate.sourceProjectVersion ?? project.candidateVersion.versionId,
      adoptedObjects: canonicalPlanningValue(candidate.adoptedObjects ?? {}),
      adoptedPlanSnapshots: canonicalPlanningValue(candidate.adoptedPlanSnapshots ?? {}),
      decisions: canonicalPlanningValue(candidate.decisions ?? []),
      contributionRefs: canonicalPlanningValue(candidate.contributionRefs ?? []),
      audit: canonicalPlanningValue(candidate.audit ?? []),
    };
  }
  return {
    stateVersion: DATA_ANALYSIS_PLANNING_VERSION,
    sourceProjectId: project.documentHandoff.projectId,
    sourceProjectVersion: project.candidateVersion.versionId,
    adoptedObjects: {},
    adoptedPlanSnapshots: {},
    decisions: [],
    contributionRefs: [],
    audit: [],
  };
};

export const applyDataAnalysisPlanningDecisionToProject = (
  project: Readonly<ResearchProjectDesignResult>,
  contribution: Readonly<DataAnalysisPlanningContribution>,
  decision: Readonly<HumanDecisionEnvelope>,
): ProjectPlanningDecisionResult => {
  const findings = [...validatePlanningContribution(contribution).findings];
  if (project.candidateVersion.status === "FROZEN_BY_HUMAN") findings.push(finding("FROZEN_PROJECT_IMMUTABLE", "Une version Project gelée est immuable ; une nouvelle version doit être ouverte avant adoption."));
  if (contribution.sourceProjectId !== project.documentHandoff.projectId) findings.push(finding("PROJECT_ID_MISMATCH", "La Contribution ne cible pas ce Research Project."));
  if (contribution.sourceProjectVersion !== project.candidateVersion.versionId || decision.projectVersion !== project.candidateVersion.versionId) findings.push(finding("STALE_PROJECT_VERSION", "La Contribution ou la décision cible une version Project obsolète."));
  if (contribution.sourceProjectDigest !== project.resultDigest) findings.push(finding("STALE_PROJECT_DIGEST", "Le Project a changé depuis la création de la Contribution."));
  if (findings.some((item) => item.code === "STALE_PROJECT_VERSION" || item.code === "STALE_PROJECT_DIGEST")) findings.push(finding("STALE_PLANNING_CONTRIBUTION", "La Contribution est obsolète et doit être reconstruite depuis la version Project courante."));
  if (decision.engineSource !== "RESEARCH_PROJECT") findings.push(finding("INVALID_DECISION_OWNER", "La décision d’adoption doit appartenir au Research Project."));
  if (!decision.actor?.trim() || !decision.mandate?.trim() || !decision.timestamp) findings.push(finding("HUMAN_AUTHORITY_REQUIRED", "Acteur, mandat et horodatage humains sont obligatoires."));
  if (!["ADOPTED", "REJECTED", "DEFERRED"].includes(decision.status)) findings.push(finding("ENGAGING_DECISION_REQUIRED", "Une décision ADOPTED, REJECTED ou DEFERRED est requise."));
  const requiredProvenance = contributionDecisionProvenance(contribution);
  if (!requiredProvenance.every((item) => decision.provenance.includes(item))) findings.push(finding("CONTRIBUTION_PROVENANCE_MISMATCH", "La décision ne prouve pas l’identité intégrale de la Contribution."));

  const allowedTargets = new Set(contribution.proposedChanges.map((item) => item.objectId));
  const selectedTargets = [...new Set(decision.targets)];
  if (!selectedTargets.length) findings.push(finding("DECISION_TARGET_REQUIRED", "La décision doit identifier au moins un objet proposé."));
  const invalidTargets = selectedTargets.filter((target) => !allowedTargets.has(target));
  if (invalidTargets.length) findings.push(finding("INVALID_DECISION_TARGET", "La décision cible un objet absent de la Contribution.", invalidTargets));
  if (findings.some((item) => item.severity === "ERROR")) return { applied: false, project: project as ResearchProjectDesignResult, findings: [...findings, finding("ATOMIC_ADOPTION_REJECTED", "Aucune écriture Project partielle n’a été effectuée.")] };

  const priorState = readState(project);
  const selected = contribution.proposedChanges.filter((change) => selectedTargets.includes(change.objectId));
  const adoptedObjects = { ...priorState.adoptedObjects };
  if (decision.status === "ADOPTED") selected.forEach((change) => { adoptedObjects[`${change.objectKind}:${change.objectId}`] = canonicalPlanningValue(change.value); });
  const adoptedPlanSnapshots = { ...priorState.adoptedPlanSnapshots };
  if (decision.status === "ADOPTED" && selected.length === contribution.proposedChanges.length) adoptedPlanSnapshots[contribution.contributionType] = canonicalPlanningValue(contribution.content);
  const resultingProjectVersion = `project-data-analysis:${digestPlanningValue({ prior: project.candidateVersion.versionId, decision: decision.decisionId, decisionVersion: decision.version, contribution: contribution.integrity.contributionDigest, targets: selectedTargets, disposition: decision.status })}`;
  const priorRef = priorState.contributionRefs.find((item) => item.contributionId === contribution.contributionId);
  const contributionRef = {
    contributionId: contribution.contributionId,
    contributionDigest: contribution.integrity.contributionDigest,
    adoptedTargetIds: decision.status === "ADOPTED" ? selectedTargets : priorRef?.adoptedTargetIds ?? [],
    rejectedTargetIds: decision.status === "REJECTED" ? selectedTargets : priorRef?.rejectedTargetIds ?? [],
    deferredTargetIds: decision.status === "DEFERRED" ? selectedTargets : priorRef?.deferredTargetIds ?? [],
  };
  const state: ProjectDataAnalysisState = {
    stateVersion: DATA_ANALYSIS_PLANNING_VERSION,
    sourceProjectId: project.documentHandoff.projectId,
    sourceProjectVersion: resultingProjectVersion,
    adoptedObjects,
    adoptedPlanSnapshots,
    decisions: [...priorState.decisions.filter((item) => item.decisionId !== decision.decisionId || item.version !== decision.version), canonicalPlanningValue(decision)],
    contributionRefs: [...priorState.contributionRefs.filter((item) => item.contributionId !== contribution.contributionId), contributionRef],
    audit: [...priorState.audit, {
      eventId: `data-analysis-audit:${digestPlanningValue({ decision: decision.decisionId, version: decision.version, contribution: contribution.contributionId })}`,
      decisionId: decision.decisionId,
      priorProjectVersion: project.candidateVersion.versionId,
      resultingProjectVersion,
      targetIds: selectedTargets,
      disposition: decision.status,
      provenance: requiredProvenance,
    }],
  };
  const resultDigest = digestPlanningValue({ priorDigest: project.resultDigest, dataAnalysisPlanningState: state, decision: decision.decisionId });
  const next: ResearchProjectDesignResult = {
    ...canonicalPlanningValue(project),
    resultId: `research-project-design-result:${resultDigest}`,
    resultDigest,
    candidateVersion: {
      ...project.candidateVersion,
      versionId: resultingProjectVersion,
      priorVersion: project.candidateVersion.versionId,
      status: "CANDIDATE_NOT_FROZEN",
      objectRefs: [...new Set([...project.candidateVersion.objectRefs, ...selected.map((item) => `${item.objectKind}:${item.objectId}`)])].sort(),
      decisionRecordIds: [...new Set([...project.candidateVersion.decisionRecordIds, decision.decisionId])].sort(),
      changesFromPrevious: [...new Set([...project.candidateVersion.changesFromPrevious, ...selected.map((item) => item.changeId)])].sort(),
      frozenAt: null,
      actor: null,
      mandateRef: null,
    },
    documentHandoff: {
      ...project.documentHandoff,
      status: "NOT_READY",
      candidateVersionRef: resultingProjectVersion,
      decisionRecordIds: [...new Set([...project.documentHandoff.decisionRecordIds, decision.decisionId])].sort(),
      humanDecisions: [...project.documentHandoff.humanDecisions.filter((item) => item.decisionId !== decision.decisionId || item.version !== decision.version), canonicalPlanningValue(decision)],
      blockedBy: [...new Set([...project.documentHandoff.blockedBy, "PROJECT_VERSION_NOT_FROZEN"])].sort(),
    },
    dataAnalysisPlanningState: state,
  };
  return { applied: true, project: next, priorProject: project as ResearchProjectDesignResult, findings };
};

const emptyReadiness = (): PlanningReadiness => ({
  overallStatus: "BLOCKED",
  domainStatuses: {},
  blockingCount: 1,
  warningCount: 0,
  unknownCount: 1,
  blockingItems: ["Aucun plan Data & Analysis adopté."],
  warningItems: [],
  decisionsRequired: [],
  limitations: ["La vue reste une projection du Research Project."],
});

export const buildProjectDataAnalysisView = (project: Readonly<ResearchProjectDesignResult>): ProjectDataAnalysisView => {
  const state = readState(project);
  const data = (state.adoptedPlanSnapshots.STUDY_DATA_PLAN ?? null) as StudyDataPlanningPayload | null;
  const dataManagement = (state.adoptedPlanSnapshots.DATA_MANAGEMENT_PLAN ?? null) as DataManagementPlanningPayload | null;
  const biostatistics = (state.adoptedPlanSnapshots.BIOSTATISTICS_PLAN ?? null) as BiostatisticsPlanningPayload | null;
  const readinesses = [data?.readiness, dataManagement?.readiness, biostatistics?.readiness].filter((item): item is PlanningReadiness => Boolean(item));
  const readiness = readinesses.length ? {
    overallStatus: readinesses.some((item) => item.overallStatus === "BLOCKED") ? "BLOCKED" as const : readinesses.some((item) => item.overallStatus === "INCOMPLETE") ? "INCOMPLETE" as const : readinesses.some((item) => item.overallStatus === "READY_WITH_OPEN_DECISIONS") ? "READY_WITH_OPEN_DECISIONS" as const : "READY" as const,
    domainStatuses: Object.assign({}, ...readinesses.map((item) => item.domainStatuses)),
    blockingCount: readinesses.reduce((sum, item) => sum + item.blockingCount, 0),
    warningCount: readinesses.reduce((sum, item) => sum + item.warningCount, 0),
    unknownCount: readinesses.reduce((sum, item) => sum + item.unknownCount, 0),
    blockingItems: [...new Set(readinesses.flatMap((item) => item.blockingItems))].sort(),
    warningItems: [...new Set(readinesses.flatMap((item) => item.warningItems))].sort(),
    decisionsRequired: [...new Set(readinesses.flatMap((item) => item.decisionsRequired))].sort(),
    limitations: [...new Set(readinesses.flatMap((item) => item.limitations))].sort(),
  } : emptyReadiness();
  return {
    projectionId: `project-data-analysis-view:${digestPlanningValue({ project: project.documentHandoff.projectId, version: project.candidateVersion.versionId, state })}`,
    projectRef: canonicalReference(project, "ResearchProject", project.documentHandoff.projectId),
    projectVersion: project.candidateVersion.versionId,
    data,
    dataManagement,
    biostatistics,
    decisions: state.decisions,
    contributionRefs: state.contributionRefs,
    readiness,
    unknowns: [...new Set([...project.missingInformation, ...readiness.blockingItems, ...readiness.decisionsRequired])].sort(),
    limitations: [...new Set([...project.limitations, ...readiness.limitations])].sort(),
    projectionOnly: true,
    sourceOfTruth: false,
  };
};
