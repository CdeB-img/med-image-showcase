import { describe, expect, it } from "vitest";
import { stableStringify } from "@/features/knowledge-engine/canonical";
import { executeResearchProjectConstruction } from "@/features/research-project-construction";
import { makeProjectInput } from "@/features/research-project-construction/__tests__/fixtures";
import {
  buildBiostatisticsPlanningInput,
  buildDataAnalysisPlanningContext,
  buildDataManagementPlanningInput,
  canonicalPlanningValue,
  createPlanningContribution,
  digestPlanningValue,
  mergeMeasurementReferencesIntoDataPlanningContext,
  proposedChange,
  readOnlyValidationHandoff,
  validatePlanningContribution,
  type StudyDataPlanningPayload,
} from "..";

const project = () => executeResearchProjectConstruction(makeProjectInput({
  outcomes: ["fraction d’éjection ventriculaire gauche"],
  timings: ["T0", "T1"],
  methods: ["IRM cardiaque"],
}));

const readiness: StudyDataPlanningPayload["readiness"] = {
  overallStatus: "INCOMPLETE",
  domainStatuses: { variables: "PARTIAL" },
  blockingCount: 0,
  warningCount: 1,
  unknownCount: 1,
  blockingItems: [],
  warningItems: ["Fixture partielle"],
  decisionsRequired: ["Décision requise"],
  limitations: ["Design-time uniquement"],
};

const payload = (): StudyDataPlanningPayload => ({
  dataNeeds: [],
  canonicalVariables: [],
  expectedVariableOccasions: [],
  plannedSources: [],
  plannedMethods: [],
  readiness,
  decisionsRequired: [],
  diagnostics: [],
});

const contribution = () => {
  const source = project();
  const provenance = {
    sourceRefs: [source.variables[0]?.variableId ?? "variable:unknown"],
    sourceProjectId: source.documentHandoff.projectId,
    sourceProjectVersion: source.candidateVersion.versionId,
    owner: "RESEARCH_PROJECT",
    evidence: [`project-digest:${source.resultDigest}`],
    limitations: [],
  };
  const change = proposedChange({
    operation: "PROPOSE_CREATE",
    objectKind: "CanonicalVariable",
    objectId: source.variables[0]?.variableId ?? "variable:unknown",
    sourceProjectVersion: source.candidateVersion.versionId,
    value: { label: "fraction d’éjection ventriculaire gauche" },
    provenance,
  });
  return createPlanningContribution({ type: "STUDY_DATA_PLAN", project: source, content: payload(), changes: [change], owner: "RESEARCH_PROJECT", sourceRefs: provenance.sourceRefs });
};

describe("DATA-ANALYSIS-INTEGRATION-001 Part 2 — contracts and handoffs", () => {
  const checks: Array<[string, () => void]> = [
    ["DAI2-C01 canonical context is deterministic", () => expect(buildDataAnalysisPlanningContext(project()).contextDigest).toBe(buildDataAnalysisPlanningContext(project()).contextDigest)],
    ["DAI2-C02 context is a read-only projection", () => expect(buildDataAnalysisPlanningContext(project())).toMatchObject({ projectionOnly: true, sourceOfTruth: false, projectWriteAuthorized: false })],
    ["DAI2-C03 Project identity is preserved", () => { const source = project(); expect(buildDataAnalysisPlanningContext(source).projectRef.objectId).toBe(source.documentHandoff.projectId); }],
    ["DAI2-C04 Project version is preserved", () => { const source = project(); expect(buildDataAnalysisPlanningContext(source).projectRef.objectVersion).toBe(source.candidateVersion.versionId); }],
    ["DAI2-C05 Objective references are typed", () => expect(buildDataAnalysisPlanningContext(project()).objectiveRefs.every((item) => item.objectKind === "Objective")).toBe(true)],
    ["DAI2-C06 Hypothesis references are typed", () => expect(buildDataAnalysisPlanningContext(project()).hypothesisRefs.every((item) => item.objectKind === "Hypothesis")).toBe(true)],
    ["DAI2-C07 Endpoint references are typed", () => expect(buildDataAnalysisPlanningContext(project()).endpointRefs.every((item) => item.objectKind === "Endpoint")).toBe(true)],
    ["DAI2-C08 Population reference keeps Project owner", () => expect(buildDataAnalysisPlanningContext(project()).populationRefs[0]?.owner).toBe("RESEARCH_PROJECT")],
    ["DAI2-C09 Variables map without alternate identity", () => { const source = project(); expect(buildDataAnalysisPlanningContext(source).variableRefs.map((item) => item.objectId)).toEqual(source.variables.map((item) => item.variableId)); }],
    ["DAI2-C10 Expected occasions do not create occurrences", () => expect(stableStringify(buildDataAnalysisPlanningContext(project()))).not.toContain("VariableOccurrence")],
    ["DAI2-C11 Measurement references remain externally owned", () => expect(buildDataAnalysisPlanningContext(project()).measurementDefinitionRefs.every((item) => item.owner === "OBS-001_OR_DOMAIN")).toBe(true)],
    ["DAI2-C12 explicit measurement merge is deterministic", () => { const context = buildDataAnalysisPlanningContext(project()); const refs = [{ kind: "MeasurementDefinition" as const, id: "MD-1", version: "1", owner: "OBS-001" }]; expect(mergeMeasurementReferencesIntoDataPlanningContext(context, refs).contextDigest).toBe(mergeMeasurementReferencesIntoDataPlanningContext(context, refs).contextDigest); }],
    ["DAI2-C13 measurement merge preserves ownership", () => { const merged = mergeMeasurementReferencesIntoDataPlanningContext(buildDataAnalysisPlanningContext(project()), [{ kind: "ObservableProperty", id: "OP-1", version: "1", owner: "OBS-001" }]); expect(merged.observablePropertyRefs[0]?.owner).toBe("OBS-001"); }],
    ["DAI2-C14 DM handoff never authorizes writes", () => expect(buildDataManagementPlanningInput(buildDataAnalysisPlanningContext(project())).projectWriteAuthorized).toBe(false)],
    ["DAI2-C15 Biostatistics handoff never authorizes writes", () => expect(buildBiostatisticsPlanningInput(buildDataAnalysisPlanningContext(project())).projectWriteAuthorized).toBe(false)],
    ["DAI2-C16 handoff IDs are stable", () => { const context = buildDataAnalysisPlanningContext(project()); expect(buildDataManagementPlanningInput(context).inputId).toBe(buildDataManagementPlanningInput(context).inputId); }],
    ["DAI2-C17 canonicalisation ignores object key order", () => expect(canonicalPlanningValue({ b: 2, a: 1 })).toEqual({ a: 1, b: 2 })],
    ["DAI2-C18 digest ignores object key order", () => expect(digestPlanningValue({ b: 2, a: 1 })).toBe(digestPlanningValue({ a: 1, b: 2 }))],
    ["DAI2-C19 contribution envelope is canonical", () => expect(contribution().envelopeType).toBe("DATA_ANALYSIS_PLANNING_CONTRIBUTION_ENVELOPE")],
    ["DAI2-C20 contribution is never adopted", () => expect(contribution().governance.status).toBe("CANDIDATE_NOT_ADOPTED")],
    ["DAI2-C21 contribution requires human decision", () => expect(contribution().governance.humanDecisionRequired).toBe(true)],
    ["DAI2-C22 contribution cannot write Project", () => expect(contribution().governance.projectWriteAuthorized).toBe(false)],
    ["DAI2-C23 contribution cannot create realized state", () => expect(contribution().governance.realizedTimeAuthorized).toBe(false)],
    ["DAI2-C24 contribution digest is reproducible", () => expect(contribution().integrity.contributionDigest).toBe(contribution().integrity.contributionDigest)],
    ["DAI2-C25 content digest is reproducible", () => expect(contribution().integrity.contentDigest).toBe(digestPlanningValue(contribution().content))],
    ["DAI2-C26 proposed changes remain proposed", () => expect(contribution().proposedChanges[0]?.status).toBe("PROPOSED")],
    ["DAI2-C27 proposed changes cannot write", () => expect(contribution().proposedChanges[0]?.projectWriteAuthorized).toBe(false)],
    ["DAI2-C28 proposed operation is explicit", () => expect(contribution().proposedChanges[0]?.operation).toBe("PROPOSE_CREATE")],
    ["DAI2-C29 source Project digest is retained", () => { const source = project(); const item = contribution(); expect(item.sourceProjectDigest).toBe(source.resultDigest); }],
    ["DAI2-C30 source Project version is retained", () => { const source = project(); expect(createPlanningContribution({ type: "STUDY_DATA_PLAN", project: source, content: payload(), changes: [], owner: "RESEARCH_PROJECT", sourceRefs: [] }).sourceProjectVersion).toBe(source.candidateVersion.versionId); }],
    ["DAI2-C31 valid contribution passes", () => expect(validatePlanningContribution(contribution()).valid).toBe(true)],
    ["DAI2-C32 tampered content fails closed", () => { const item = contribution(); const invalid = { ...item, content: { ...item.content, diagnostics: [{ code: "TAMPER" }] } } as typeof item; expect(validatePlanningContribution(invalid).findings.some((finding) => finding.code === "CONTENT_DIGEST_MISMATCH")).toBe(true); }],
    ["DAI2-C33 tampered identity fails closed", () => { const item = contribution(); const invalid = { ...item, integrity: { ...item.integrity, contributionDigest: "bad" } }; expect(validatePlanningContribution(invalid).findings.some((finding) => finding.code === "CONTRIBUTION_DIGEST_MISMATCH")).toBe(true); }],
    ["DAI2-C34 mismatched change version fails closed", () => { const item = contribution(); const invalid = { ...item, proposedChanges: item.proposedChanges.map((change) => ({ ...change, sourceProjectVersion: "other" })) }; expect(validatePlanningContribution(invalid).findings.some((finding) => finding.code === "CHANGE_PROJECT_VERSION_MISMATCH")).toBe(true); }],
    ["DAI2-C35 VariableOccurrence is rejected", () => { const item = contribution(); const invalid = { ...item, proposedChanges: item.proposedChanges.map((change) => ({ ...change, objectKind: "VariableOccurrence" })) }; expect(validatePlanningContribution(invalid).findings.some((finding) => finding.code === "REALIZED_OBJECT_FORBIDDEN_AT_DESIGN_TIME")).toBe(true); }],
    ["DAI2-C36 DatasetRelease is rejected", () => { const item = contribution(); const invalid = { ...item, proposedChanges: item.proposedChanges.map((change) => ({ ...change, objectKind: "DatasetRelease" })) }; expect(validatePlanningContribution(invalid).valid).toBe(false); }],
    ["DAI2-C37 AnalysisExecution is rejected", () => { const item = contribution(); const invalid = { ...item, proposedChanges: item.proposedChanges.map((change) => ({ ...change, objectKind: "AnalysisExecution" })) }; expect(validatePlanningContribution(invalid).valid).toBe(false); }],
    ["DAI2-C38 AnalysisResult is rejected", () => { const item = contribution(); const invalid = { ...item, proposedChanges: item.proposedChanges.map((change) => ({ ...change, objectKind: "AnalysisResult" })) }; expect(validatePlanningContribution(invalid).valid).toBe(false); }],
    ["DAI2-C39 duplicate scientific target is rejected", () => { const item = contribution(); const invalid = { ...item, proposedChanges: [item.proposedChanges[0]!, item.proposedChanges[0]!] }; expect(validatePlanningContribution(invalid).findings.some((finding) => finding.code === "DUPLICATE_PROPOSED_TARGET")).toBe(true); }],
    ["DAI2-C40 findings never auto-fix", () => { const item = contribution(); const invalid = { ...item, integrity: { ...item.integrity, contributionDigest: "bad" } }; expect(validatePlanningContribution(invalid).findings.every((finding) => finding.autoFixed === false)).toBe(true); }],
    ["DAI2-C41 VAL handoff is projection-only", () => expect(readOnlyValidationHandoff(contribution()).projectionOnly).toBe(true)],
    ["DAI2-C42 VAL handoff cannot write", () => expect(readOnlyValidationHandoff(contribution()).projectWriteAuthorized).toBe(false)],
    ["DAI2-C43 VAL handoff retains digest", () => { const item = contribution(); expect(readOnlyValidationHandoff(item).sourceDigest).toBe(item.integrity.contributionDigest); }],
    ["DAI2-C44 VAL handoff reports no silent loss", () => expect(readOnlyValidationHandoff(contribution()).lost).toEqual([])],
    ["DAI2-C45 UNKNOWN remains visible", () => expect(buildDataAnalysisPlanningContext(project()).unknowns).toEqual(project().missingInformation)],
    ["DAI2-C46 Project limitations remain visible", () => expect(buildDataAnalysisPlanningContext(project()).limitations).toEqual(project().limitations)],
    ["DAI2-C47 Project object is not mutated by context", () => { const source = project(); const before = stableStringify(source); buildDataAnalysisPlanningContext(source); expect(stableStringify(source)).toBe(before); }],
    ["DAI2-C48 Project object is not mutated by contribution", () => { const source = project(); const before = stableStringify(source); createPlanningContribution({ type: "STUDY_DATA_PLAN", project: source, content: payload(), changes: [], owner: "RESEARCH_PROJECT", sourceRefs: [] }); expect(stableStringify(source)).toBe(before); }],
    ["DAI2-C49 no patient data is introduced", () => expect(stableStringify(contribution())).not.toMatch(/patientId|subjectId|participantId/)],
    ["DAI2-C50 no provider contract is introduced", () => expect(stableStringify(contribution())).not.toMatch(/Gemini|OpenAI|providerRequest/i)],
  ];

  it.each(checks)("%s", (_name, check) => check());
});
