import { describe, expect, it } from "vitest";
import { stableStringify } from "@/features/knowledge-engine/canonical";
import { executeResearchProjectConstruction } from "@/features/research-project-construction";
import { makeProjectInput } from "@/features/research-project-construction/__tests__/fixtures";
import {
  analyzeDataManagementPlanningImpact,
  analyzeDataPlanningImpact,
  buildDataAnalysisPlanningContext,
  buildDataManagementPlanningContribution,
  buildStudyDataPlanContribution,
  validatePlanningContribution,
} from "..";

const setup = (complete = false) => {
  const project = executeResearchProjectConstruction(makeProjectInput({
    outcomes: ["volume ventriculaire indexé"],
    timings: ["T0", "T1"],
    availableData: ["mesure attendue à T0 et T1"],
    designDeclarations: ["suivi longitudinal"],
  }));
  const context = buildDataAnalysisPlanningContext(project);
  const options = complete ? Object.fromEntries(project.variables.map((variable) => [variable.variableId, "déclaré"])) : {};
  const data = buildStudyDataPlanContribution(context, {
    plannedSources: options,
    plannedMethods: options,
    units: complete ? Object.fromEntries(project.variables.map((variable) => [variable.variableId, "mL/m²"])) : {},
    valueDomains: complete ? Object.fromEntries(project.variables.map((variable) => [variable.variableId, "quantitatif continu"])) : {},
  });
  const dm = buildDataManagementPlanningContribution(context, data, complete ? {
    collectionStrategy: "Collecte structurée planifiée",
    sourceHandling: "Sources déclarées conservées",
    policies: { QUERY: "Définition planifiée", CORRECTION: "Définition planifiée", RECONCILIATION: "Définition planifiée", TRANSFORMATION: "Définition planifiée", SNAPSHOT: "Définition planifiée", FREEZE: "Définition planifiée", LOCK: "Définition planifiée", RELEASE: "Définition planifiée" },
  } : {});
  return { project, context, data, dm };
};

describe("DATA-ANALYSIS-INTEGRATION-001 Part 3 — Study Data Plan", () => {
  const tests: Array<[string, () => void]> = [
    ["DAI3-DATA-C01 builder is deterministic", () => expect(setup().data.integrity.contentDigest).toBe(setup().data.integrity.contentDigest)],
    ["DAI3-DATA-C02 Project remains unchanged", () => { const { project, context } = setup(); const before = stableStringify(project); buildStudyDataPlanContribution(context); expect(stableStringify(project)).toBe(before); }],
    ["DAI3-DATA-C03 DataNeeds remain candidates", () => expect(setup().data.content.dataNeeds.every((item) => item.status === "CANDIDATE")).toBe(true)],
    ["DAI3-DATA-C04 DataNeeds retain Objective refs", () => expect(setup().data.content.dataNeeds.every((item) => item.objectiveRefs.length > 0)).toBe(true)],
    ["DAI3-DATA-C05 CanonicalVariable identity is Project identity", () => { const { project, data } = setup(); expect(data.content.canonicalVariables.map((item) => item.variableRef.objectId)).toEqual(project.variables.map((item) => item.variableId)); }],
    ["DAI3-DATA-C06 no per-occasion Variable identity", () => { const { data } = setup(); expect(new Set(data.content.canonicalVariables.map((item) => item.variableRef.objectId)).size).toBe(data.content.canonicalVariables.length); }],
    ["DAI3-DATA-C07 Expected occasions reference Variables", () => { const { data } = setup(); const refs = new Set(data.content.canonicalVariables.map((item) => item.variableRef.objectId)); expect(data.content.expectedVariableOccasions.every((item) => refs.has(item.variableRef.objectId))).toBe(true); }],
    ["DAI3-DATA-C08 Expected occasions are not occurrences", () => expect(stableStringify(setup().data.content.expectedVariableOccasions)).not.toContain("VariableOccurrence")],
    ["DAI3-DATA-C09 Expected occasions remain unrealized", () => expect(setup().data.content.expectedVariableOccasions.every((item) => item.status === "EXPECTED_NOT_REALIZED")).toBe(true)],
    ["DAI3-DATA-C10 planned source remains separate", () => expect(setup().data.content.plannedSources.every((item) => Object.prototype.hasOwnProperty.call(item, "value"))).toBe(true)],
    ["DAI3-DATA-C11 planned method remains separate", () => expect(setup().data.content.plannedMethods.every((item) => Object.prototype.hasOwnProperty.call(item, "value"))).toBe(true)],
    ["DAI3-DATA-C12 unknown method is visible", () => expect(setup().data.content.plannedMethods.some((item) => item.status === "UNKNOWN")).toBe(true)],
    ["DAI3-DATA-C13 unknown unit is visible", () => expect(setup().data.content.canonicalVariables.some((item) => item.unit === null)).toBe(true)],
    ["DAI3-DATA-C14 unknown domain is visible", () => expect(setup().data.content.canonicalVariables.some((item) => item.valueDomain === null)).toBe(true)],
    ["DAI3-DATA-C15 decision requirements have no default", () => expect(setup().data.content.decisionsRequired.every((item) => item.defaultOption === "NONE")).toBe(true)],
    ["DAI3-DATA-C16 readiness is detailed", () => expect(Object.keys(setup().data.content.readiness.domainStatuses).length).toBeGreaterThan(3)],
    ["DAI3-DATA-C17 complete explicit inputs improve readiness", () => expect(setup(true).data.content.readiness.unknownCount).toBeLessThan(setup(false).data.content.readiness.unknownCount)],
    ["DAI3-DATA-C18 contribution passes validation", () => expect(validatePlanningContribution(setup().data).valid).toBe(true)],
    ["DAI3-DATA-C19 impact never applies changes", () => expect(analyzeDataPlanningImpact(setup().data, setup(true).data).every((item) => item.automaticallyApplied === false)).toBe(true)],
    ["DAI3-DATA-C20 no realized value is created", () => expect(stableStringify(setup().data)).not.toMatch(/observedValue|realizedValue|patientId/)],
  ];
  it.each(tests)("%s", (_name, check) => check());
});

describe("DATA-ANALYSIS-INTEGRATION-001 Part 3 — Data Management", () => {
  const tests: Array<[string, () => void]> = [
    ["DAI3-DM-C01 builder is deterministic", () => expect(setup().dm.integrity.contentDigest).toBe(setup().dm.integrity.contentDigest)],
    ["DAI3-DM-C02 DataManagementDefinition is candidate", () => expect(setup().dm.content.definition.status).toBe("CANDIDATE")],
    ["DAI3-DM-C03 DataCollectionSpecification is candidate", () => expect(setup().dm.content.collectionSpecification.status).toBe("CANDIDATE")],
    ["DAI3-DM-C04 field identity differs from Variable identity", () => expect(setup().dm.content.collectionSpecification.fields.every((item) => item.fieldDefinitionId !== item.canonicalVariableRef.objectId)).toBe(true)],
    ["DAI3-DM-C05 field retains CanonicalVariable identity", () => { const { data, dm } = setup(); expect(dm.content.collectionSpecification.fields.map((item) => item.canonicalVariableRef.objectId)).toEqual(data.content.canonicalVariables.map((item) => item.variableRef.objectId)); }],
    ["DAI3-DM-C06 CRF is projection-only", () => expect(setup().dm.content.logicalCRF).toMatchObject({ projectionOnly: true, sourceOfTruth: false, projectWriteAuthorized: false })],
    ["DAI3-DM-C07 Data Dictionary is projection-only", () => expect(setup().dm.content.logicalDataDictionary).toMatchObject({ projectionOnly: true, sourceOfTruth: false, projectWriteAuthorized: false })],
    ["DAI3-DM-C08 SoA is projection-only", () => expect(setup().dm.content.logicalScheduleOfActivities).toMatchObject({ projectionOnly: true, sourceOfTruth: false, projectWriteAuthorized: false })],
    ["DAI3-DM-C09 CRF fields preserve Variables", () => expect(setup().dm.content.logicalCRF.fields.every((item) => item.canonicalVariableRef.objectKind === "CanonicalVariable")).toBe(true)],
    ["DAI3-DM-C10 Data Dictionary does not recreate Variables", () => { const { data, dm } = setup(); expect(dm.content.logicalDataDictionary.variableRefs.map((item) => item.objectId)).toEqual(data.content.canonicalVariables.map((item) => item.variableRef.objectId)); }],
    ["DAI3-DM-C11 SoA carries occasions", () => expect(setup().dm.content.logicalScheduleOfActivities.occasionRefs.length).toBe(setup().data.content.expectedVariableOccasions.length)],
    ["DAI3-DM-C12 query policy is a definition", () => expect(setup(true).dm.content.definition.policies.find((item) => item.kind === "QUERY")?.definition).toBeTruthy()],
    ["DAI3-DM-C13 correction policy is a definition", () => expect(setup(true).dm.content.definition.policies.find((item) => item.kind === "CORRECTION")?.status).toBe("KNOWN")],
    ["DAI3-DM-C14 reconciliation policy is a definition", () => expect(setup().dm.content.definition.policies.some((item) => item.kind === "RECONCILIATION")).toBe(true)],
    ["DAI3-DM-C15 transformation policy is a definition", () => expect(setup().dm.content.definition.policies.some((item) => item.kind === "TRANSFORMATION")).toBe(true)],
    ["DAI3-DM-C16 snapshot policy is a definition", () => expect(setup().dm.content.definition.policies.some((item) => item.kind === "SNAPSHOT")).toBe(true)],
    ["DAI3-DM-C17 freeze policy is a definition", () => expect(setup().dm.content.definition.policies.some((item) => item.kind === "FREEZE")).toBe(true)],
    ["DAI3-DM-C18 lock policy is a definition", () => expect(setup().dm.content.definition.policies.some((item) => item.kind === "LOCK")).toBe(true)],
    ["DAI3-DM-C19 release policy is a definition", () => expect(setup().dm.content.definition.policies.some((item) => item.kind === "RELEASE")).toBe(true)],
    ["DAI3-DM-C20 DatasetReleaseRequirement is not DatasetRelease", () => expect(setup().dm.content.datasetReleaseRequirements.every((item) => item.releaseStatus === "DESIGN_PHASE_ABSENT")).toBe(true)],
    ["DAI3-DM-C21 release absence is deferred", () => expect(setup().dm.content.datasetReleaseRequirements.every((item) => item.blockingLevel === "DEFERRED_TO_REALIZED_TIME")).toBe(true)],
    ["DAI3-DM-C22 unknown policies remain decisions", () => expect(setup().dm.content.decisionsRequired.some((item) => item.questionIntent.includes("POLICY"))).toBe(true)],
    ["DAI3-DM-C23 readiness is detailed", () => expect(Object.keys(setup().dm.content.readiness.domainStatuses)).toContain("policies")],
    ["DAI3-DM-C24 impact never applies changes", () => expect(analyzeDataManagementPlanningImpact(setup().dm, setup(true).dm).every((item) => item.automaticallyApplied === false)).toBe(true)],
    ["DAI3-DM-C25 contribution passes validation", () => expect(validatePlanningContribution(setup().dm).valid).toBe(true)],
  ];
  it.each(tests)("%s", (_name, check) => check());
});

describe("DATA-ANALYSIS-INTEGRATION-001 Part 3 — boundaries", () => {
  const tests: Array<[string, () => void]> = [
    ["DAI3-BND-C01 no VariableOccurrence", () => expect(stableStringify(setup())).not.toContain('"objectKind":"VariableOccurrence"')],
    ["DAI3-BND-C02 no DataIngestionRecord", () => expect(stableStringify(setup().dm)).not.toContain("DataIngestionRecord")],
    ["DAI3-BND-C03 no DataQualityFinding", () => expect(stableStringify(setup().dm)).not.toContain("DataQualityFinding")],
    ["DAI3-BND-C04 no DataQuery", () => expect(stableStringify(setup().dm)).not.toContain('"objectKind":"DataQuery"')],
    ["DAI3-BND-C05 no DataCorrectionRecord", () => expect(stableStringify(setup().dm)).not.toContain("DataCorrectionRecord")],
    ["DAI3-BND-C06 no ReconciliationRecord", () => expect(stableStringify(setup().dm)).not.toContain("ReconciliationRecord")],
    ["DAI3-BND-C07 no TransformationExecution", () => expect(stableStringify(setup().dm)).not.toContain("TransformationExecution")],
    ["DAI3-BND-C08 no DataSnapshot", () => expect(stableStringify(setup().dm)).not.toContain('"objectKind":"DataSnapshot"')],
    ["DAI3-BND-C09 no DataFreeze", () => expect(stableStringify(setup().dm)).not.toContain('"objectKind":"DataFreeze"')],
    ["DAI3-BND-C10 no DataLock", () => expect(stableStringify(setup().dm)).not.toContain('"objectKind":"DataLock"')],
    ["DAI3-BND-C11 no DatasetRelease instance", () => expect(stableStringify(setup().dm)).not.toContain('"objectKind":"DatasetRelease"')],
    ["DAI3-BND-C12 no Project direct write", () => expect(setup().dm.governance.projectWriteAuthorized).toBe(false)],
    ["DAI3-BND-C13 no provider", () => expect(stableStringify(setup())).not.toMatch(/Gemini|OpenAI|providerRequest/)],
    ["DAI3-BND-C14 no patient data", () => expect(stableStringify(setup())).not.toMatch(/patientId|subjectId|participantId/)],
    ["DAI3-BND-C15 no automatic default option", () => expect([...setup().data.content.decisionsRequired, ...setup().dm.content.decisionsRequired].every((item) => item.defaultOption === "NONE")).toBe(true)],
  ];
  it.each(tests)("%s", (_name, check) => check());
});
