import { logicalDigest, stableStringify, uniqueSorted } from "@/features/knowledge-engine/canonical";
import type { ResearchProjectDesignResult } from "@/features/research-project-construction/types";
import {
  DATA_ANALYSIS_CONTRIBUTION_ENVELOPE_TYPE,
  DATA_ANALYSIS_PLANNING_VERSION,
  type CanonicalReference,
  type DataAnalysisPlanningContext,
  type DataAnalysisPlanningContribution,
  type PlanningContributionPayload,
  type PlanningContributionType,
  type PlanningDiagnostic,
  type PlanningProvenance,
  type PlanningValidationResult,
  type ProposedProjectObjectChange,
} from "./types";

const ref = <K extends string>(project: Readonly<ResearchProjectDesignResult>, objectKind: K, objectId: string): CanonicalReference<K> => ({
  objectKind,
  objectId,
  objectVersion: project.candidateVersion.versionId,
  owner: objectKind === "CanonicalVariable" || objectKind === "ExpectedVariableOccasion" || objectKind === "DataNeed" ? "RESEARCH_PROJECT" : objectKind === "MeasurementDefinition" || objectKind === "ObservableProperty" || objectKind === "BiomarkerRole" ? "OBS-001_OR_DOMAIN" : "RESEARCH_PROJECT",
  sourceProjectId: project.documentHandoff.projectId,
  sourceProjectVersion: project.candidateVersion.versionId,
});

export const planningProvenance = (project: Readonly<ResearchProjectDesignResult>, owner: string, sourceRefs: string[], limitations: string[] = []): PlanningProvenance => ({
  sourceRefs: uniqueSorted(sourceRefs),
  sourceProjectId: project.documentHandoff.projectId,
  sourceProjectVersion: project.candidateVersion.versionId,
  owner,
  evidence: uniqueSorted([`project-digest:${project.resultDigest}`, ...sourceRefs]),
  limitations: uniqueSorted(limitations),
});

export const canonicalPlanningValue = <T>(value: T): T => JSON.parse(stableStringify(value)) as T;
export const digestPlanningValue = (value: unknown) => logicalDigest(canonicalPlanningValue(value));

export const buildDataAnalysisPlanningContext = (project: Readonly<ResearchProjectDesignResult>): DataAnalysisPlanningContext => {
  const variableRefs = project.variables.map((item) => ref(project, "CanonicalVariable", item.variableId));
  const expectedOccasionRefs = project.variables.flatMap((variable) => variable.timingIds.map((timingId) => ref(project, "ExpectedVariableOccasion", `${variable.variableId}@${timingId}`)));
  const measurementRefs = uniqueSorted(project.variables.map((item) => item.sourceRef).filter(Boolean));
  const material = {
    projectId: project.documentHandoff.projectId,
    projectVersion: project.candidateVersion.versionId,
    projectDigest: project.resultDigest,
    variables: variableRefs.map((item) => item.objectId),
    occasions: expectedOccasionRefs.map((item) => item.objectId),
  };
  return Object.freeze({
    contractVersion: DATA_ANALYSIS_PLANNING_VERSION,
    contextId: `data-analysis-context:${logicalDigest(material)}`,
    contextDigest: logicalDigest(material),
    project,
    projectRef: ref(project, "ResearchProject", project.documentHandoff.projectId),
    objectiveRefs: project.objectives.map((item) => ref(project, "Objective", item.objectiveId)),
    hypothesisRefs: project.hypotheses.map((item) => ref(project, "Hypothesis", item.hypothesisId)),
    endpointRefs: project.endpointCandidates.map((item) => ref(project, "Endpoint", item.endpointId)),
    populationRefs: [ref(project, "Population", project.populationDesign.populationId)],
    variableRefs,
    expectedOccasionRefs,
    observablePropertyRefs: [],
    measurementDefinitionRefs: measurementRefs.map((id) => ref(project, "MeasurementDefinition", id)),
    biomarkerRoleRefs: [],
    declaredDecisions: [...project.documentHandoff.humanDecisions],
    projectionOnly: true,
    sourceOfTruth: false,
    projectWriteAuthorized: false,
    unknowns: uniqueSorted(project.missingInformation),
    limitations: uniqueSorted(project.limitations),
  });
};

export const buildStudyDataPlanningInputFromProject = buildDataAnalysisPlanningContext;

export const mergeMeasurementReferencesIntoDataPlanningContext = (
  context: Readonly<DataAnalysisPlanningContext>,
  refs: ReadonlyArray<{ kind: "ObservableProperty" | "MeasurementDefinition" | "BiomarkerRole"; id: string; version: string; owner: string }>,
): DataAnalysisPlanningContext => {
  const toRef = <K extends "ObservableProperty" | "MeasurementDefinition" | "BiomarkerRole">(item: { kind: K; id: string; version: string; owner: string }): CanonicalReference<K> => ({
    objectKind: item.kind,
    objectId: item.id,
    objectVersion: item.version,
    owner: item.owner,
    sourceProjectId: context.projectRef.objectId,
    sourceProjectVersion: context.projectRef.objectVersion,
  });
  const next = {
    ...context,
    observablePropertyRefs: refs.filter((item) => item.kind === "ObservableProperty").map((item) => toRef(item as typeof item & { kind: "ObservableProperty" })),
    measurementDefinitionRefs: refs.filter((item) => item.kind === "MeasurementDefinition").map((item) => toRef(item as typeof item & { kind: "MeasurementDefinition" })),
    biomarkerRoleRefs: refs.filter((item) => item.kind === "BiomarkerRole").map((item) => toRef(item as typeof item & { kind: "BiomarkerRole" })),
  };
  return Object.freeze({ ...next, contextDigest: digestPlanningValue({ prior: context.contextDigest, refs }) });
};

export const buildDataManagementPlanningInput = (context: Readonly<DataAnalysisPlanningContext>) => Object.freeze({
  context,
  inputId: `dm-planning-input:${digestPlanningValue({ project: context.projectRef, variables: context.variableRefs, occasions: context.expectedOccasionRefs })}`,
  projectionOnly: true as const,
  projectWriteAuthorized: false as const,
});

export const buildBiostatisticsPlanningInput = (context: Readonly<DataAnalysisPlanningContext>, dataManagementRef: string | null = null) => Object.freeze({
  context,
  dataManagementRef,
  inputId: `bio-planning-input:${digestPlanningValue({ project: context.projectRef, variables: context.variableRefs, endpoints: context.endpointRefs, dataManagementRef })}`,
  projectionOnly: true as const,
  projectWriteAuthorized: false as const,
});

export const proposedChange = (input: Omit<ProposedProjectObjectChange, "changeId" | "status" | "projectWriteAuthorized">): ProposedProjectObjectChange => ({
  ...input,
  changeId: `planning-change:${digestPlanningValue({ operation: input.operation, objectKind: input.objectKind, objectId: input.objectId, value: input.value, sourceProjectVersion: input.sourceProjectVersion })}`,
  status: "PROPOSED",
  projectWriteAuthorized: false,
});

export const createPlanningContribution = <T extends PlanningContributionPayload>(input: {
  type: PlanningContributionType;
  project: Readonly<ResearchProjectDesignResult>;
  content: T;
  changes: ProposedProjectObjectChange[];
  owner: string;
  sourceRefs: string[];
  limitations?: string[];
  version?: string;
}): DataAnalysisPlanningContribution<T> => {
  const content = canonicalPlanningValue(input.content);
  const contentDigest = digestPlanningValue(content);
  const identityMaterial = {
    type: input.type,
    sourceProjectId: input.project.documentHandoff.projectId,
    sourceProjectVersion: input.project.candidateVersion.versionId,
    sourceProjectDigest: input.project.resultDigest,
    contentDigest,
    changes: input.changes,
  };
  const contributionDigest = digestPlanningValue(identityMaterial);
  return Object.freeze({
    envelopeType: DATA_ANALYSIS_CONTRIBUTION_ENVELOPE_TYPE,
    envelopeVersion: DATA_ANALYSIS_PLANNING_VERSION,
    contributionId: `data-analysis-contribution:${contributionDigest}`,
    contributionType: input.type,
    contributionVersion: input.version ?? "1.0.0",
    sourceProjectId: input.project.documentHandoff.projectId,
    sourceProjectVersion: input.project.candidateVersion.versionId,
    sourceProjectDigest: input.project.resultDigest,
    content,
    proposedChanges: canonicalPlanningValue(input.changes),
    governance: {
      owner: input.owner,
      status: "CANDIDATE_NOT_ADOPTED" as const,
      humanDecisionRequired: true as const,
      projectWriteAuthorized: false as const,
      realizedTimeAuthorized: false as const,
    },
    integrity: { contentDigest, contributionDigest, canonicalization: "KNOWLEDGE_ENGINE_STABLE_STRINGIFY" as const },
    provenance: planningProvenance(input.project, input.owner, input.sourceRefs, input.limitations),
  });
};

const diagnostic = (code: string, message: string, targetRefs: string[] = [], severity: PlanningDiagnostic["severity"] = "ERROR"): PlanningDiagnostic => ({
  code,
  severity,
  message,
  targetRefs,
  owner: "DATA_ANALYSIS_PLANNING",
  blockingLevel: severity === "ERROR" ? "BLOCKING_FOR_ANALYSIS_PLAN" : "UNKNOWN_NON_BLOCKING",
  autoFixed: false,
});

const forbiddenRealizedKinds = new Set([
  "VariableOccurrence", "DataIngestionRecord", "DataQualityFinding", "DataQuery", "DataCorrectionRecord", "ReconciliationRecord", "TransformationExecution", "DataSnapshot", "DataFreeze", "DataLock", "DatasetRelease", "AnalysisDataset", "AnalysisExecution", "AnalysisResult",
]);

export const validatePlanningContribution = (contribution: Readonly<DataAnalysisPlanningContribution>): PlanningValidationResult => {
  const findings: PlanningDiagnostic[] = [];
  if (contribution.envelopeType !== DATA_ANALYSIS_CONTRIBUTION_ENVELOPE_TYPE) findings.push(diagnostic("INVALID_CONTRIBUTION_ENVELOPE", "Le type d’enveloppe canonique est absent."));
  if (contribution.governance.projectWriteAuthorized) findings.push(diagnostic("CONTRIBUTION_PROJECT_WRITE_FORBIDDEN", "Une Contribution ne peut jamais autoriser une écriture Project."));
  if (contribution.governance.realizedTimeAuthorized) findings.push(diagnostic("REALIZED_TIME_FORBIDDEN", "Une Contribution DAI-001 reste strictement design-time."));
  if (digestPlanningValue(contribution.content) !== contribution.integrity.contentDigest) findings.push(diagnostic("CONTENT_DIGEST_MISMATCH", "Le digest du contenu ne correspond pas à la canonicalisation."));
  const expectedContributionDigest = digestPlanningValue({
    type: contribution.contributionType,
    sourceProjectId: contribution.sourceProjectId,
    sourceProjectVersion: contribution.sourceProjectVersion,
    sourceProjectDigest: contribution.sourceProjectDigest,
    contentDigest: contribution.integrity.contentDigest,
    changes: contribution.proposedChanges,
  });
  if (expectedContributionDigest !== contribution.integrity.contributionDigest) findings.push(diagnostic("CONTRIBUTION_DIGEST_MISMATCH", "L’identité de la Contribution n’est pas reproductible."));
  contribution.proposedChanges.forEach((change) => {
    if (change.sourceProjectVersion !== contribution.sourceProjectVersion) findings.push(diagnostic("CHANGE_PROJECT_VERSION_MISMATCH", "Une proposition cible une autre version Project.", [change.changeId]));
    if (forbiddenRealizedKinds.has(change.objectKind)) findings.push(diagnostic("REALIZED_OBJECT_FORBIDDEN_AT_DESIGN_TIME", `L’objet ${change.objectKind} est interdit dans DAI-001.`, [change.objectId]));
    if (change.projectWriteAuthorized) findings.push(diagnostic("PROPOSED_CHANGE_DIRECT_WRITE_FORBIDDEN", "Une ProposedProjectObjectChange reste non exécutable.", [change.changeId]));
  });
  const duplicateTargets = contribution.proposedChanges.map((item) => `${item.objectKind}:${item.objectId}`).filter((value, index, all) => all.indexOf(value) !== index);
  if (duplicateTargets.length) findings.push(diagnostic("DUPLICATE_PROPOSED_TARGET", "Une identité scientifique est proposée plusieurs fois.", uniqueSorted(duplicateTargets)));
  return { valid: findings.every((item) => item.severity !== "ERROR"), findings };
};

export const readOnlyValidationHandoff = (contribution: Readonly<DataAnalysisPlanningContribution>) => ({
  sourceRef: contribution.contributionId,
  sourceVersion: contribution.contributionVersion,
  sourceDigest: contribution.integrity.contributionDigest,
  preserved: contribution.proposedChanges.map((item) => `${item.objectKind}:${item.objectId}`),
  added: [],
  lost: [],
  weakened: [],
  strengthened: [],
  nonmapped: [],
  decisions: contribution.proposedChanges.map((item) => item.changeId),
  provenance: contribution.provenance,
  limitations: contribution.provenance.limitations,
  projectionOnly: true as const,
  projectWriteAuthorized: false as const,
});
