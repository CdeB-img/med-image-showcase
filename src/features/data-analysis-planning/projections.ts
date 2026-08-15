import type { ResearchProjectDesignResult } from "@/features/research-project-construction/types";
import { digestPlanningValue, readOnlyValidationHandoff } from "./contracts";
import { buildProjectDataAnalysisView } from "./project-integration";
import type { DataAnalysisPlanningContribution, PlanningContributionType, ProjectDataAnalysisView } from "./types";

export type DataAnalysisProjectionStatus = "GENERATABLE" | "PARTIALLY_GENERATABLE" | "BLOCKED" | "NOT_GENERATABLE" | "NOT_APPLICABLE";

export type DataAnalysisTemplateBlockInput = {
  blockId: "PROTOCOL_DATA_AND_ANALYSIS" | "DATA_MANAGEMENT_PLAN" | "CRF_SPECIFICATION" | "DATA_DICTIONARY" | "SCHEDULE_OF_ACTIVITIES" | "SAP" | "STATISTICAL_METHODS";
  label: string;
  status: DataAnalysisProjectionStatus;
  sourceProjectVersion: string;
  sourceObjectRefs: string[];
  structuredContent: unknown;
  missing: string[];
  decisionsRequired: string[];
  limitations: string[];
  projectionOnly: true;
  sourceOfTruth: false;
};

export type DataAnalysisDocumentProjectionInput = {
  projectionId: string;
  projectionType: "PROTOCOL_DATA_AND_ANALYSIS" | "DATA_MANAGEMENT_PLAN" | "CRF_SPECIFICATION" | "DATA_DICTIONARY" | "SCHEDULE_OF_ACTIVITIES" | "SAP" | "STATISTICAL_METHODS";
  projectId: string;
  projectVersion: string;
  blocks: DataAnalysisTemplateBlockInput[];
  status: DataAnalysisProjectionStatus;
  decisionRefs: string[];
  provenance: string[];
  projectionOnly: true;
  sourceOfTruth: false;
  documentWriteAuthorized: false;
};

const statusFor = (present: boolean, blocked: boolean, missing: string[], notApplicable = false): DataAnalysisProjectionStatus => {
  if (notApplicable) return "NOT_APPLICABLE";
  if (!present) return "NOT_GENERATABLE";
  if (blocked) return "BLOCKED";
  return missing.length ? "PARTIALLY_GENERATABLE" : "GENERATABLE";
};

const logicalAnalysisStatus = (status: "GENERATABLE" | "GENERATABLE_WITH_LIMITATIONS" | "NOT_GENERATABLE" | "NOT_APPLICABLE" | "BLOCKED" | undefined): DataAnalysisProjectionStatus => status === "GENERATABLE" ? "GENERATABLE" : status === "GENERATABLE_WITH_LIMITATIONS" ? "PARTIALLY_GENERATABLE" : status === "NOT_APPLICABLE" ? "NOT_APPLICABLE" : status === "BLOCKED" ? "BLOCKED" : "NOT_GENERATABLE";

export const buildDataManagementTemplateInput = (view: Readonly<ProjectDataAnalysisView>): DataAnalysisTemplateBlockInput[] => {
  const plan = view.dataManagement;
  const missing = plan ? [...plan.readiness.blockingItems, ...plan.readiness.warningItems] : ["Data Management Plan non adopté dans cette version Project."];
  const common = { sourceProjectVersion: view.projectVersion, missing, decisionsRequired: plan?.readiness.decisionsRequired ?? [], limitations: plan?.readiness.limitations ?? [], projectionOnly: true as const, sourceOfTruth: false as const };
  return [
    { ...common, blockId: "DATA_MANAGEMENT_PLAN", label: "Data Management Plan", status: statusFor(Boolean(plan), plan?.readiness.overallStatus === "BLOCKED", missing), sourceObjectRefs: plan ? [plan.definition.definitionId] : [], structuredContent: plan?.definition ?? null },
    { ...common, blockId: "CRF_SPECIFICATION", label: "CRF Specification", status: statusFor(Boolean(plan), false, missing), sourceObjectRefs: plan ? [plan.logicalCRF.projectionId] : [], structuredContent: plan?.logicalCRF ?? null },
    { ...common, blockId: "DATA_DICTIONARY", label: "Data Dictionary", status: statusFor(Boolean(plan), false, missing), sourceObjectRefs: plan ? [plan.logicalDataDictionary.projectionId] : [], structuredContent: plan?.logicalDataDictionary ?? null },
    { ...common, blockId: "SCHEDULE_OF_ACTIVITIES", label: "Schedule of Activities", status: statusFor(Boolean(plan), false, missing), sourceObjectRefs: plan ? [plan.logicalScheduleOfActivities.projectionId] : [], structuredContent: plan?.logicalScheduleOfActivities ?? null },
  ];
};

export const buildBiostatisticsTemplateInput = (view: Readonly<ProjectDataAnalysisView>): DataAnalysisTemplateBlockInput[] => {
  const plan = view.biostatistics;
  const missing = plan ? [...plan.readiness.blockingItems, ...plan.readiness.warningItems] : ["Biostatistics Plan non adopté dans cette version Project."];
  const common = { sourceProjectVersion: view.projectVersion, missing, decisionsRequired: plan?.readiness.decisionsRequired ?? [], limitations: plan?.readiness.limitations ?? [], projectionOnly: true as const, sourceOfTruth: false as const };
  return [
    { ...common, blockId: "SAP", label: "Statistical Analysis Plan", status: logicalAnalysisStatus(plan?.logicalSAP.status), sourceObjectRefs: plan ? [plan.logicalSAP.projectionId] : [], structuredContent: plan?.logicalSAP ?? null },
    { ...common, blockId: "STATISTICAL_METHODS", label: "Statistical Methods", status: logicalAnalysisStatus(plan?.logicalStatisticalMethods.status), sourceObjectRefs: plan ? [plan.logicalStatisticalMethods.projectionId] : [], structuredContent: plan?.logicalStatisticalMethods ?? null },
  ];
};

export const buildDataAnalysisDocumentProjectionInputs = (project: Readonly<ResearchProjectDesignResult>): DataAnalysisDocumentProjectionInput[] => {
  const view = buildProjectDataAnalysisView(project);
  const blocks = [...buildDataManagementTemplateInput(view), ...buildBiostatisticsTemplateInput(view)];
  const individual: DataAnalysisDocumentProjectionInput[] = blocks.map((block) => ({
    projectionId: `data-analysis-document:${digestPlanningValue({ project: project.documentHandoff.projectId, version: view.projectVersion, block: block.blockId, content: block.structuredContent })}`,
    projectionType: block.blockId,
    projectId: project.documentHandoff.projectId,
    projectVersion: view.projectVersion,
    blocks: [block],
    status: block.status,
    decisionRefs: view.decisions.map((item) => item.decisionId),
    provenance: [`project:${project.documentHandoff.projectId}@${view.projectVersion}`, ...block.sourceObjectRefs],
    projectionOnly: true,
    sourceOfTruth: false,
    documentWriteAuthorized: false,
  }));
  const protocolStatus: DataAnalysisProjectionStatus = blocks.some((item) => item.status === "BLOCKED") ? "BLOCKED" : blocks.some((item) => item.status === "NOT_GENERATABLE") ? "PARTIALLY_GENERATABLE" : blocks.some((item) => item.status === "PARTIALLY_GENERATABLE") ? "PARTIALLY_GENERATABLE" : "GENERATABLE";
  return [{
    projectionId: `data-analysis-document:${digestPlanningValue({ project: project.documentHandoff.projectId, version: view.projectVersion, type: "PROTOCOL_DATA_AND_ANALYSIS", blocks })}`,
    projectionType: "PROTOCOL_DATA_AND_ANALYSIS" as const,
    projectId: project.documentHandoff.projectId,
    projectVersion: view.projectVersion,
    blocks,
    status: protocolStatus,
    decisionRefs: view.decisions.map((item) => item.decisionId),
    provenance: [`project:${project.documentHandoff.projectId}@${view.projectVersion}`, ...blocks.flatMap((item) => item.sourceObjectRefs)],
    projectionOnly: true as const,
    sourceOfTruth: false as const,
    documentWriteAuthorized: false as const,
  }, ...individual];
};

export const buildDataAnalysisValidationObservation = (contribution: Readonly<DataAnalysisPlanningContribution>) => ({
  ...readOnlyValidationHandoff(contribution),
  validationPurpose: "DATA_ANALYSIS_DESIGN_TIME_OBSERVATION" as const,
  contributionType: contribution.contributionType as PlanningContributionType,
  realizedDataRequired: false as const,
  executionAuthorized: false as const,
});
