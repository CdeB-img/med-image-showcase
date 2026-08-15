import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { stableStringify } from "@/features/knowledge-engine/canonical";
import { createHumanDecisionCandidate, engageHumanDecision } from "@/features/protocol-designer/human-decision";
import { executeResearchProjectConstruction } from "@/features/research-project-construction";
import type { ResearchProjectDesignResult } from "@/features/research-project-construction/types";
import { makeProjectInput } from "@/features/research-project-construction/__tests__/fixtures";
import {
  applyDataAnalysisPlanningDecisionToProject,
  buildBiostatisticsPlanningContribution,
  buildDataAnalysisDocumentProjectionInputs,
  buildDataAnalysisPlanningContext,
  buildDataAnalysisValidationObservation,
  buildDataManagementPlanningContribution,
  buildProjectDataAnalysisView,
  buildStudyDataPlanContribution,
  contributionDecisionProvenance,
  validatePlanningContribution,
  type DataAnalysisPlanningContribution,
  type PlanningContributionType,
} from "..";

const project = () => executeResearchProjectConstruction(makeProjectInput({ outcomes: ["marqueur quantitatif"], timings: ["T0", "T1"], designDeclarations: ["suivi longitudinal"] }));
const contributions = (value: ResearchProjectDesignResult) => {
  const context = buildDataAnalysisPlanningContext(value);
  const data = buildStudyDataPlanContribution(context);
  const dm = buildDataManagementPlanningContribution(context, data);
  const bio = buildBiostatisticsPlanningContribution(context, data, dm);
  return { context, data, dm, bio };
};
const humanDecision = (value: ResearchProjectDesignResult, contribution: DataAnalysisPlanningContribution, targets = contribution.proposedChanges.map((item) => item.objectId)) => engageHumanDecision(createHumanDecisionCandidate({ decisionId: `closure:${contribution.contributionType}:${value.candidateVersion.versionId}`, gateId: `DAI-${contribution.contributionType}`, scope: [contribution.contributionType], targets, provenance: contributionDecisionProvenance(contribution), engineSource: "RESEARCH_PROJECT", projectVersion: value.candidateVersion.versionId }), { status: "ADOPTED", actor: "Closure reviewer", mandate: "DAI-001 closure", timestamp: "2026-08-15T00:00:00.000Z" });
const adopt = (value: ResearchProjectDesignResult, type: PlanningContributionType) => {
  const built = contributions(value);
  const contribution = type === "STUDY_DATA_PLAN" ? built.data : type === "DATA_MANAGEMENT_PLAN" ? built.dm : built.bio;
  const result = applyDataAnalysisPlanningDecisionToProject(value, contribution, humanDecision(value, contribution));
  if (!result.applied) throw new Error(result.findings.map((item) => item.code).join(","));
  return result.project;
};
const complete = () => adopt(adopt(adopt(project(), "STUDY_DATA_PLAN"), "DATA_MANAGEMENT_PLAN"), "BIOSTATISTICS_PLAN");
const productionSource = ["../types.ts", "../contracts.ts", "../study-data.ts", "../data-management.ts", "../biostatistics.ts", "../project-integration.ts", "../projections.ts"].map((path) => readFileSync(new URL(path, import.meta.url), "utf8")).join("\n");

describe("DATA-ANALYSIS-INTEGRATION-001 Part 6 — closure gates", () => {
  it("DAI-CLOSE-C01 Parts 2–5 are present", () => expect(["buildDataAnalysisPlanningContext", "buildStudyDataPlanContribution", "buildDataManagementPlanningContribution", "buildBiostatisticsPlanningContribution", "applyDataAnalysisPlanningDecisionToProject"].every((symbol) => productionSource.includes(symbol))).toBe(true));
  it("DAI-CLOSE-C02 Study Data Plan is usable", () => expect(validatePlanningContribution(contributions(project()).data).valid).toBe(true));
  it("DAI-CLOSE-C03 Data Management Planning is usable", () => expect(validatePlanningContribution(contributions(project()).dm).valid).toBe(true));
  it("DAI-CLOSE-C04 Biostatistics Planning is usable", () => expect(validatePlanningContribution(contributions(project()).bio).valid).toBe(true));
  it("DAI-CLOSE-C05 Human Decision is required", () => { const value = project(); const contribution = contributions(value).data; const pending = createHumanDecisionCandidate({ decisionId: "closure:pending", gateId: "DAI", scope: ["DATA"], targets: contribution.proposedChanges.map((item) => item.objectId), provenance: contributionDecisionProvenance(contribution), engineSource: "RESEARCH_PROJECT", projectVersion: value.candidateVersion.versionId }); expect(applyDataAnalysisPlanningDecisionToProject(value, contribution, pending).applied).toBe(false); });
  it("DAI-CLOSE-C06 Project mutation is atomic", () => { const value = project(); const contribution = contributions(value).data; const result = applyDataAnalysisPlanningDecisionToProject(value, contribution, humanDecision(value, contribution, [contribution.proposedChanges[0]!.objectId, "invalid"])); expect(result.applied).toBe(false); expect(value.dataAnalysisPlanningState).toBeUndefined(); });
  it("DAI-CLOSE-C07 Stale contribution is rejected", () => { const value = project(); const contribution = contributions(value).data; const changed = { ...value, resultDigest: "changed" }; const result = applyDataAnalysisPlanningDecisionToProject(changed, contribution, humanDecision(value, contribution)); expect(result.applied).toBe(false); expect(result.findings.some((item) => item.code === "STALE_PLANNING_CONTRIBUTION")).toBe(true); });
  it("DAI-CLOSE-C08 Project freeze is respected", () => { const value = project(); const frozen = { ...value, candidateVersion: { ...value.candidateVersion, status: "FROZEN_BY_HUMAN" as const } }; const contribution = contributions(frozen).data; expect(applyDataAnalysisPlanningDecisionToProject(frozen, contribution, humanDecision(frozen, contribution)).applied).toBe(false); });
  it("DAI-CLOSE-C09 Project state is reconstructible after reload", () => { const value = complete(); const restored = JSON.parse(JSON.stringify(value)) as ResearchProjectDesignResult; expect(buildProjectDataAnalysisView(restored)).toEqual(buildProjectDataAnalysisView(value)); });
  it("DAI-CLOSE-C10 CanonicalVariable identity is preserved end-to-end", () => { const value = complete(); const ids = value.variables.map((item) => item.variableId); const output = stableStringify(buildDataAnalysisDocumentProjectionInputs(value)); ids.forEach((id) => expect(output).toContain(id)); expect(output).not.toContain("_COPY"); });
  it("DAI-CLOSE-C11 OBS ownership is preserved", () => expect(contributions(project()).data.content.canonicalVariables.every((item) => item.measurementDefinitionRef === null || item.measurementDefinitionRef.owner !== "DATA_ANALYSIS_PLANNING")).toBe(true));
  it("DAI-CLOSE-C12 CDM ownership is preserved", () => expect(contributions(project()).bio.content.analysisSpecifications.every((item) => item.missingDataStrategy.factualMissingnessOwner === "CDM-001")).toBe(true));
  it("DAI-CLOSE-C13 Data Management ownership is preserved", () => expect(contributions(project()).dm.content.definition.provenance.owner).toBe("DATA_MANAGEMENT"));
  it("DAI-CLOSE-C14 Biostatistics ownership is preserved", () => expect(contributions(project()).bio.content.analysisSpecifications.every((item) => item.provenance.owner === "BIOSTATISTICS")).toBe(true));
  it("DAI-CLOSE-C15 TMP and DOC remain projections", () => expect(buildDataAnalysisDocumentProjectionInputs(complete()).every((item) => item.projectionOnly && !item.sourceOfTruth && !item.documentWriteAuthorized)).toBe(true));
  it("DAI-CLOSE-C16 Unknowns remain explicit", () => expect(buildProjectDataAnalysisView(complete()).unknowns.length).toBeGreaterThan(0));
  it("DAI-CLOSE-C17 No statistical method is selected automatically", () => expect(contributions(project()).bio.content.analysisSpecifications.every((item) => item.method.methodFamily === null && item.method.model === null)).toBe(true));
  it("DAI-CLOSE-C18 No dimensioning assumption is invented", () => expect(contributions(project()).bio.content.dimensionnement.assumptions.every((item) => item.proposedValue === null && item.status === "UNKNOWN")).toBe(true));
  it("DAI-CLOSE-C19 No statistical calculation is performed", () => { const bio = contributions(project()).bio.content; expect(bio.dimensionnement.calculatedSampleSize).toBeNull(); expect(bio.analysisSpecifications.flatMap((item) => item.expectedOutputs).every((item) => item.value === null)).toBe(true); });
  it("DAI-CLOSE-C20 No realized-time object is constructed", () => { const text = stableStringify(contributions(project())); ["VariableOccurrence", "AnalysisExecution", "AnalysisResult", "DatasetRelease", "DataQuery", "DataLock"].forEach((name) => expect(text).not.toContain(`"objectKind":"${name}"`)); });
  it("DAI-CLOSE-C21 No patient data is present", () => expect(productionSource).not.toMatch(/patientId|patientName|PatientBirthDate|PatientID/));
  it("DAI-CLOSE-C22 No provider call exists", () => expect(productionSource).not.toMatch(/Gemini|OpenAI|fetch\s*\(|generateContent\s*\(/));
  it("DAI-CLOSE-C23 SEM remains closed", () => expect(productionSource).not.toMatch(/scientific-semantic-reconstruction|SEM_FULL|AUDIT_L/));
  it("DAI-CLOSE-C24 No QRY implementation is created", () => expect(productionSource).not.toMatch(/from\s+["'][^"']*query-engine|executeQuery\s*\(/));
  it("DAI-CLOSE-C25 No VAL-001 implementation is created", () => expect(buildDataAnalysisValidationObservation(contributions(project()).data)).toMatchObject({ projectionOnly: true, projectWriteAuthorized: false, executionAuthorized: false }));
  it("DAI-CLOSE-C26 No UX-001 implementation is created", () => expect(productionSource).not.toContain("UX-001"));
  it("DAI-CLOSE-C27 Project Data Analysis document projections are functional", () => expect(buildDataAnalysisDocumentProjectionInputs(complete()).map((item) => item.projectionType)).toEqual(expect.arrayContaining(["PROTOCOL_DATA_AND_ANALYSIS", "DATA_MANAGEMENT_PLAN", "CRF_SPECIFICATION", "DATA_DICTIONARY", "SCHEDULE_OF_ACTIVITIES", "SAP"])));
  it("DAI-CLOSE-C28 NOT_GENERATABLE is preserved honestly", () => expect(buildDataAnalysisDocumentProjectionInputs(complete()).find((item) => item.projectionType === "SAP")?.status).toBe("NOT_GENERATABLE"));
  it("DAI-CLOSE-C29 All contribution contracts validate locally", () => { const built = contributions(project()); expect([built.data, built.dm, built.bio].every((item) => validatePlanningContribution(item).valid)).toBe(true); });
  it("DAI-CLOSE-C30 No DAI global-regression mechanism is introduced", () => expect(productionSource).not.toMatch(/Math\.random\s*\(|Date\.now\s*\(|new\s+Date\s*\(/));
});
