import { describe, expect, it } from "vitest";
import { stableStringify } from "@/features/knowledge-engine/canonical";
import { executeResearchProjectConstruction } from "@/features/research-project-construction";
import { makeProjectInput } from "@/features/research-project-construction/__tests__/fixtures";
import {
  analyzeBiostatisticsPlanningImpact,
  buildBiostatisticsPlanningContribution,
  buildDataAnalysisPlanningContext,
  buildDataManagementPlanningContribution,
  buildStudyDataPlanContribution,
  validatePlanningContribution,
  type BiostatisticsPlanningOptions,
  type DimensioningAssumption,
} from "..";

const fixture = (explicit = false, withoutObjectives = false) => {
  const project = executeResearchProjectConstruction(makeProjectInput({
    outcomes: ["fraction d’éjection ventriculaire gauche"],
    timings: ["T0", "T1"],
    designDeclarations: ["suivi longitudinal", "comparaison de deux groupes"],
    centers: ["multicentrique"],
    objectives: !withoutObjectives,
  }));
  const context = buildDataAnalysisPlanningContext(project);
  const perVariable = Object.fromEntries(project.variables.map((item) => [item.variableId, "explicit"]));
  const data = buildStudyDataPlanContribution(context, { plannedSources: perVariable, plannedMethods: perVariable, units: perVariable, valueDomains: perVariable });
  const dm = buildDataManagementPlanningContribution(context, data, { collectionStrategy: "explicit" });
  const requirement = project.analysisRequirements[0];
  const dimensioningAssumptions: DimensioningAssumption[] = project.sizingRequirements.inputs.map((item) => ({
    assumptionId: `assumption:${item.name}`,
    parameter: item.name,
    proposedValue: 1,
    unit: "explicit",
    sourceType: "PROJECT_DECISION",
    sourceReference: "decision:explicit",
    evidence: ["decision:explicit"],
    owner: "HUMAN",
    status: "KNOWN",
    uncertainty: [],
    limitations: [],
  }));
  const options: BiostatisticsPlanningOptions = explicit && requirement ? {
    roles: { [requirement.requirementId]: "PRIMARY" },
    estimands: { [requirement.requirementId]: { endpointId: requirement.endpointIds[0] ?? null, variableIds: requirement.variableIds, contrast: "explicit contrast", summaryMeasure: "explicit summary" } },
    methods: { [requirement.requirementId]: { methodFamily: "explicit family", model: "explicit model", source: "HUMAN_CONTRIBUTION" } },
    populationRules: { [requirement.requirementId]: { inclusionRule: "explicit inclusion" } },
    assumptions: { [requirement.requirementId]: [{ category: "distribution", statement: "explicit assumption", sourceRef: "decision:explicit" }] },
    diagnostics: { [requirement.requirementId]: [{ purpose: "check assumption", definition: "explicit diagnostic" }] },
    missingDataStrategies: { [requirement.requirementId]: "explicit missing-data strategy" },
    intercurrentEvents: { [requirement.requirementId]: [{ event: "explicit event", strategy: "explicit strategy" }] },
    multiplicity: { [requirement.requirementId]: { applicable: false } },
    sensitivities: [{ primaryAnalysisRequirementId: requirement.requirementId, fragilityTested: "explicit fragility", changedElements: ["assumption"], constantElements: ["estimand"] }],
    dimensioningAssumptions,
    expectedOutputs: { [requirement.requirementId]: [{ role: "PRIMARY", target: "explicit target", outputType: "ESTIMATE" }] },
  } : {};
  const bio = buildBiostatisticsPlanningContribution(context, data, dm, options);
  return { project, context, data, dm, bio, requirement, options };
};

const run = (title: string, cases: Array<[string, () => void]>) => describe(title, () => it.each(cases)("%s", (_name, check) => check()));

run("DATA-ANALYSIS-INTEGRATION-001 Part 4 — AnalysisSpecification", [
  ["DAI4-AS-C01 builder is deterministic", () => expect(fixture().bio.integrity.contentDigest).toBe(fixture().bio.integrity.contentDigest)],
  ["DAI4-AS-C02 Project is never mutated", () => { const { project, context, data, dm } = fixture(); const before = stableStringify(project); buildBiostatisticsPlanningContribution(context, data, dm); expect(stableStringify(project)).toBe(before); }],
  ["DAI4-AS-C03 specification keeps Project version", () => { const { project, bio } = fixture(); expect(bio.content.analysisSpecifications.every((item) => item.sourceProjectVersion === project.candidateVersion.versionId)).toBe(true); }],
  ["DAI4-AS-C04 Objective reference is mandatory", () => expect(fixture(false, true).bio.content.diagnostics.some((item) => item.code === "ANALYSIS_WITHOUT_OBJECTIVE")).toBe(true)],
  ["DAI4-AS-C05 CanonicalVariable reference is preserved", () => { const { project, bio } = fixture(); const ids = new Set(project.variables.map((item) => item.variableId)); expect(bio.content.analysisSpecifications.flatMap((item) => item.targetVariableRefs).every((item) => ids.has(item.objectId))).toBe(true); }],
  ["DAI4-AS-C06 column name does not create Variable", () => expect(stableStringify(fixture().bio)).not.toContain("BASELINE_LVEF")],
  ["DAI4-AS-C07 Endpoint and Estimand remain distinct", () => { const spec = fixture(true).bio.content.analysisSpecifications[0]!; expect(spec.estimand?.estimandId).not.toBe(spec.endpointRefs[0]?.objectId); }],
  ["DAI4-AS-C08 Estimand and Model remain distinct", () => { const spec = fixture(true).bio.content.analysisSpecifications[0]!; expect(spec.estimand?.estimandId).not.toBe(spec.method.methodDefinitionId); }],
  ["DAI4-AS-C09 partial specification contains no invention", () => { const spec = fixture().bio.content.analysisSpecifications[0]!; expect(spec.method).toMatchObject({ methodFamily: null, model: null, status: "UNKNOWN" }); }],
  ["DAI4-AS-C10 non constructible analysis emits diagnostic", () => expect(fixture(false, true).bio.content.analysisSpecifications).toEqual([])],
  ["DAI4-AS-C11 PRIMARY is never inferred from order", () => expect(fixture().bio.content.analysisSpecifications.every((item) => item.role === "UNDECIDED")).toBe(true)],
  ["DAI4-AS-C12 POST_HOC stays POST_HOC", () => { const base = fixture(); const id = base.requirement!.requirementId; const bio = buildBiostatisticsPlanningContribution(base.context, base.data, base.dm, { roles: { [id]: "POST_HOC" } }); expect(bio.content.analysisSpecifications[0]?.role).toBe("POST_HOC"); }],
  ["DAI4-AS-C13 EXPLORATORY does not become PRIMARY", () => { const base = fixture(); const id = base.requirement!.requirementId; const bio = buildBiostatisticsPlanningContribution(base.context, base.data, base.dm, { roles: { [id]: "EXPLORATORY" } }); expect(bio.content.analysisSpecifications[0]?.role).toBe("EXPLORATORY"); }],
  ["DAI4-AS-C14 no DatasetRelease instance is created", () => expect(stableStringify(fixture().bio)).not.toContain('"objectKind":"DatasetRelease"')],
  ["DAI4-AS-C15 no AnalysisDataset instance is created", () => expect(stableStringify(fixture().bio)).not.toContain('"objectKind":"AnalysisDataset"')],
]);

run("DATA-ANALYSIS-INTEGRATION-001 Part 4 — Estimand Variables Population", [
  ["DAI4-EVP-C01 absent Estimand remains unknown", () => expect(fixture().bio.content.analysisSpecifications.every((item) => item.estimand === null)).toBe(true)],
  ["DAI4-EVP-C02 Estimand does not copy Endpoint identity", () => { const spec = fixture(true).bio.content.analysisSpecifications[0]!; expect(spec.estimand?.estimandId).not.toEqual(spec.endpointRefs[0]?.objectId); }],
  ["DAI4-EVP-C03 role assignment references CanonicalVariable", () => expect(fixture().bio.content.analysisSpecifications.flatMap((item) => item.variableRoles).every((item) => item.variableRef.objectKind === "CanonicalVariable")).toBe(true)],
  ["DAI4-EVP-C04 analytical role does not modify Variable", () => { const { project, bio } = fixture(); expect(project.variables.map((item) => item.variableId)).toEqual(bio.content.analysisSpecifications.flatMap((item) => item.targetVariableRefs.map((ref) => ref.objectId)).filter((id, index, all) => all.indexOf(id) === index)); }],
  ["DAI4-EVP-C05 same Variable can have roles in analyses", () => { const assignments = fixture().bio.content.analysisSpecifications.flatMap((item) => item.variableRoles); expect(assignments.every((item) => item.analysisSpecificationRef)).toBe(true); }],
  ["DAI4-EVP-C06 AnalysisPopulation does not mutate Project", () => expect(fixture().bio.content.analysisSpecifications.every((item) => item.population?.mutatesProjectPopulation === false)).toBe(true)],
  ["DAI4-EVP-C07 analytical exclusion deletes nothing", () => expect(fixture(true).bio.proposedChanges.every((item) => item.operation !== "PROPOSE_REMOVE_RELATION")).toBe(true)],
  ["DAI4-EVP-C08 temporal selection keeps occasion refs", () => expect(fixture().bio.content.analysisSpecifications.flatMap((item) => item.variableRoles).every((item) => Array.isArray(item.temporalRefs))).toBe(true)],
  ["DAI4-EVP-C09 MeasurementDefinition remains external", () => expect(fixture().data.content.canonicalVariables.every((item) => item.measurementDefinitionRef === null || item.measurementDefinitionRef.owner !== "BIOSTATISTICS")).toBe(true)],
  ["DAI4-EVP-C10 OBS limitations remain visible upstream", () => expect(fixture().data.content.canonicalVariables.every((item) => item.provenance.limitations.length > 0)).toBe(true)],
]);

run("DATA-ANALYSIS-INTEGRATION-001 Part 4 — Method Missingness Multiplicity", [
  ["DAI4-MMM-C01 unknown method remains unknown", () => expect(fixture().bio.content.analysisSpecifications.every((item) => item.method.status === "UNKNOWN")).toBe(true)],
  ["DAI4-MMM-C02 no method chosen from Variable type", () => expect(fixture().bio.content.analysisSpecifications.every((item) => item.method.methodFamily === null)).toBe(true)],
  ["DAI4-MMM-C03 no method chosen from DOC-002", () => expect(stableStringify(fixture().bio)).not.toContain("DOC-002_METHOD")],
  ["DAI4-MMM-C04 assumptions are never auto-satisfied", () => expect(fixture(true).bio.content.analysisSpecifications.every((item) => item.assumptions.automaticallySatisfied === false)).toBe(true)],
  ["DAI4-MMM-C05 DiagnosticPlan executes nothing", () => expect(fixture(true).bio.content.analysisSpecifications.every((item) => item.diagnostics.executionAuthorized === false)).toBe(true)],
  ["DAI4-MMM-C06 missingness strategy keeps CDM owner", () => expect(fixture().bio.content.analysisSpecifications.every((item) => item.missingDataStrategy.factualMissingnessOwner === "CDM-001")).toBe(true)],
  ["DAI4-MMM-C07 no real imputation", () => expect(fixture().bio.content.analysisSpecifications.every((item) => item.missingDataStrategy.imputationExecuted === false)).toBe(true)],
  ["DAI4-MMM-C08 NOT_APPLICABLE is distinct from missing", () => expect(fixture().bio.content.analysisSpecifications[0]?.missingDataStrategy.status).toBe("UNKNOWN")],
  ["DAI4-MMM-C09 intercurrent event is distinct", () => expect(fixture(true).bio.content.analysisSpecifications.flatMap((item) => item.intercurrentEvents).every((item) => item.distinctFromMissingness === true)).toBe(true)],
  ["DAI4-MMM-C10 undefined multiplicity stays open", () => expect(fixture().bio.content.analysisSpecifications.every((item) => item.multiplicity.status === "UNKNOWN")).toBe(true)],
  ["DAI4-MMM-C11 no multiplicity procedure invented", () => expect(fixture().bio.content.analysisSpecifications.every((item) => item.multiplicity.procedure === null)).toBe(true)],
  ["DAI4-MMM-C12 sensitivity keeps primary reference", () => expect(fixture(true).bio.content.analysisSpecifications.flatMap((item) => item.sensitivityAnalyses).every((item) => item.primaryAnalysisSpecificationRef)).toBe(true)],
  ["DAI4-MMM-C13 sensitivity never replaces primary", () => expect(fixture(true).bio.content.analysisSpecifications.flatMap((item) => item.sensitivityAnalyses).every((item) => item.role === "SENSITIVITY")).toBe(true)],
]);

run("DATA-ANALYSIS-INTEGRATION-001 Part 4 — Dimensionnement", [
  ["DAI4-DIM-C01 canonical Dimensionnement is reused", () => expect(fixture().bio.proposedChanges.some((item) => item.objectKind === "Dimensionnement")).toBe(true)],
  ["DAI4-DIM-C02 no SampleSize identity", () => expect(stableStringify(fixture().bio)).not.toMatch(/SampleSizeDefinition|SampleSizePlan|SampleSizeResult/)],
  ["DAI4-DIM-C03 no effect value invented", () => expect(fixture().bio.content.dimensionnement.assumptions.every((item) => item.proposedValue === null)).toBe(true)],
  ["DAI4-DIM-C04 no variance invented", () => expect(fixture().bio.content.dimensionnement.assumptions.filter((item) => /variance/i.test(item.parameter)).every((item) => item.proposedValue === null)).toBe(true)],
  ["DAI4-DIM-C05 no rate invented", () => expect(fixture().bio.content.dimensionnement.assumptions.filter((item) => /taux/i.test(item.parameter)).every((item) => item.proposedValue === null)).toBe(true)],
  ["DAI4-DIM-C06 no alpha invented", () => expect(fixture().bio.content.dimensionnement.assumptions.filter((item) => /alpha/i.test(item.parameter)).every((item) => item.proposedValue === null)).toBe(true)],
  ["DAI4-DIM-C07 no power invented", () => expect(fixture().bio.content.dimensionnement.assumptions.filter((item) => /puissance/i.test(item.parameter)).every((item) => item.proposedValue === null)).toBe(true)],
  ["DAI4-DIM-C08 every assumption has owner", () => expect(fixture().bio.content.dimensionnement.assumptions.every((item) => item.owner)).toBe(true)],
  ["DAI4-DIM-C09 unknown assumption has explicit source type", () => expect(fixture().bio.content.dimensionnement.assumptions.every((item) => item.sourceType === "UNKNOWN")).toBe(true)],
  ["DAI4-DIM-C10 incomplete inputs block dimensioning", () => expect(fixture().bio.content.dimensionnement.readiness).toBe("INCOMPLETE")],
  ["DAI4-DIM-C11 complete explicit inputs are ready for calculation", () => expect(fixture(true).bio.content.dimensionnement.readiness).toBe("READY_FOR_CALCULATION")],
  ["DAI4-DIM-C12 ready still has no calculated N", () => expect(fixture(true).bio.content.dimensionnement.calculatedSampleSize).toBeNull()],
  ["DAI4-DIM-C13 scenarios remain candidates", () => expect(fixture(true).bio.content.dimensionnement.scenarios.every((item) => item.adoptionStatus === "CANDIDATE")).toBe(true)],
]);

run("DATA-ANALYSIS-INTEGRATION-001 Part 4 — projections", [
  ["DAI4-PROJ-C01 Analysis Plan is projection-only", () => expect(fixture().bio.content.logicalAnalysisPlan).toMatchObject({ projectionOnly: true, sourceOfTruth: false, projectWriteAuthorized: false })],
  ["DAI4-PROJ-C02 SAP is projection-only", () => expect(fixture().bio.content.logicalSAP).toMatchObject({ projectionOnly: true, sourceOfTruth: false, projectWriteAuthorized: false })],
  ["DAI4-PROJ-C03 Methods is projection-only", () => expect(fixture().bio.content.logicalStatisticalMethods).toMatchObject({ projectionOnly: true, sourceOfTruth: false, projectWriteAuthorized: false })],
  ["DAI4-PROJ-C04 output catalog is projection-only", () => expect(fixture().bio.content.logicalExpectedOutputCatalog).toMatchObject({ projectionOnly: true, sourceOfTruth: false, projectWriteAuthorized: false })],
  ["DAI4-PROJ-C05 unknown method makes SAP not generatable", () => expect(fixture().bio.content.logicalSAP.status).toBe("NOT_GENERATABLE")],
  ["DAI4-PROJ-C06 unknown method reason is explicit", () => expect(fixture().bio.content.logicalSAP.missingObjects).toContain("StatisticalMethodDefinition")],
  ["DAI4-PROJ-C07 explicit method enables bounded SAP", () => expect(fixture(true).bio.content.logicalSAP.status).not.toBe("NOT_GENERATABLE")],
  ["DAI4-PROJ-C08 outputs have no values", () => expect(fixture(true).bio.content.analysisSpecifications.flatMap((item) => item.expectedOutputs).every((item) => item.value === null)).toBe(true)],
  ["DAI4-PROJ-C09 output catalog needs explicit outputs", () => expect(fixture().bio.content.logicalExpectedOutputCatalog.status).toBe("NOT_GENERATABLE")],
  ["DAI4-PROJ-C10 projection keeps Variable refs", () => expect(fixture().bio.content.logicalAnalysisPlan.canonicalVariableRefs.every((item) => item.objectKind === "CanonicalVariable")).toBe(true)],
]);

run("DATA-ANALYSIS-INTEGRATION-001 Part 4 — boundaries", [
  ["DAI4-BND-C01 no AnalysisDataset", () => expect(stableStringify(fixture().bio)).not.toContain('"objectKind":"AnalysisDataset"')],
  ["DAI4-BND-C02 no AnalysisExecution", () => expect(stableStringify(fixture().bio)).not.toContain('"objectKind":"AnalysisExecution"')],
  ["DAI4-BND-C03 no AnalysisResult", () => expect(stableStringify(fixture().bio)).not.toContain('"objectKind":"AnalysisResult"')],
  ["DAI4-BND-C04 no imputation execution", () => expect(stableStringify(fixture().bio)).not.toContain("ImputationExecution")],
  ["DAI4-BND-C05 no randomization execution", () => expect(stableStringify(fixture().bio)).not.toContain("RandomizationExecution")],
  ["DAI4-BND-C06 no interim result", () => expect(stableStringify(fixture().bio)).not.toContain("InterimResult")],
  ["DAI4-BND-C07 no sample-size calculation", () => expect(fixture().bio.content.dimensionnement.calculatedSampleSize).toBeNull()],
  ["DAI4-BND-C08 no statistical significance claim", () => expect(stableStringify(fixture().bio)).not.toMatch(/statistically significant|p-value/i)],
  ["DAI4-BND-C09 no causal promotion", () => expect(stableStringify(fixture().bio)).not.toContain("CAUSAL_CONCLUSION")],
  ["DAI4-BND-C10 no provider", () => expect(stableStringify(fixture().bio)).not.toMatch(/Gemini|OpenAI|providerRequest/)],
  ["DAI4-BND-C11 no patient data", () => expect(stableStringify(fixture().bio)).not.toMatch(/patientId|subjectId|participantId/)],
  ["DAI4-BND-C12 no Project write", () => expect(fixture().bio.governance.projectWriteAuthorized).toBe(false)],
  ["DAI4-BND-C13 decision defaults are NONE", () => expect(fixture().bio.content.decisionsRequired.every((item) => item.defaultOption === "NONE")).toBe(true)],
  ["DAI4-BND-C14 impact is review-only", () => expect(analyzeBiostatisticsPlanningImpact(fixture().bio, fixture(true).bio).every((item) => item.automaticallyApplied === false)).toBe(true)],
  ["DAI4-BND-C15 contribution validates", () => expect(validatePlanningContribution(fixture().bio).valid).toBe(true)],
  ["DAI4-BND-C16 no source authority is redefined", () => expect(fixture().bio.content.analysisSpecifications.every((item) => item.missingDataStrategy.factualMissingnessOwner === "CDM-001")).toBe(true)],
]);
