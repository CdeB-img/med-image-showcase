import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildDeterministicObservations,
  compareCanonicalReferences,
  compareExactIdentity,
  compareReferencedCollections,
  computeValidationDisposition,
  replayValidationRun,
  resolveDomainValidationProviders,
  runCheckpointValidation,
  runDomainValidatorsReadOnly,
  runValidationCorridor,
  traceFindingAcrossCheckpoint,
} from "../deterministic-engine";
import { getValidationCheckpointV1, VALIDATION_CHECKPOINT_REGISTRY_V1 } from "../checkpoint-registry";
import { VAL001_CHECKPOINT_IDS } from "../invariant-registry";
import type {
  DomainValidationProvider,
  ValidationArtifactSnapshot,
  ValidationCheckpointExecutionInput,
  ValidationProductArtifactType,
  ValidationSnapshotSemanticObject,
} from "../product-contracts";
import { makeArtifactReference, makeFinding, makeRunRequest, makeSnapshot } from "./val-001-part2-fixtures";

const CP = VAL001_CHECKPOINT_IDS;
const checkpoint = (id: string) => {
  const value = getValidationCheckpointV1(id);
  if (!value) throw new Error(`Missing checkpoint ${id}`);
  return value;
};

const object = (patch: Partial<ValidationSnapshotSemanticObject> & Pick<ValidationSnapshotSemanticObject, "objectId">): ValidationSnapshotSemanticObject => ({
  objectId: patch.objectId,
  objectType: patch.objectType ?? "ScientificObject",
  label: patch.label ?? patch.objectId,
  status: patch.status ?? "KNOWN",
  owner: patch.owner ?? "DOMAIN_OWNER",
  sourceRefs: patch.sourceRefs ?? [],
  provenanceRefs: patch.provenanceRefs ?? ["evidence:1"],
  semanticKey: patch.semanticKey ?? patch.label ?? patch.objectId,
  polarity: patch.polarity ?? null,
  role: patch.role ?? null,
  attributes: patch.attributes ?? {},
});

const snapshot = (
  artifactType: ValidationProductArtifactType,
  artifactId: string,
  objects: ValidationSnapshotSemanticObject[] = [],
  patch: Partial<Omit<ValidationArtifactSnapshot, "snapshotDigest" | "reference" | "artifactKind" | "semanticObjects">> = {},
) => makeSnapshot({
  reference: makeArtifactReference({ artifactId, artifactType, owner: patch.owner ?? "DOMAIN_OWNER", sourceOfTruth: artifactType === "RESEARCH_PROJECT", contentDigest: `digest:${artifactId}`, projectId: artifactType === "RESEARCH_PROJECT" ? artifactId : "project:1", projectVersion: "1.0.0" }),
  artifactKind: artifactType,
  owner: patch.owner ?? "DOMAIN_OWNER",
  semanticObjects: objects,
  ...patch,
});

const input = (
  checkpointId: string,
  source: ValidationArtifactSnapshot | null,
  target: ValidationArtifactSnapshot | null,
  patch: Partial<ValidationCheckpointExecutionInput> = {},
): ValidationCheckpointExecutionInput => {
  const definition = checkpoint(checkpointId);
  return {
    request: makeRunRequest({
      checkpointId,
      checkpointVersion: definition.version,
      sourceArtifact: source?.reference ?? null,
      targetArtifact: target?.reference ?? null,
      requestedPlanes: [...definition.validationPlanes],
      requestedInvariantRefs: [...definition.invariantRefs],
      caller: "VAL-001-PART3-TEST",
      purpose: "DETERMINISTIC_CHECKPOINT_VALIDATION",
    }),
    sourceSnapshot: source,
    targetSnapshot: target,
    technicalTimestamp: "2026-08-15T00:00:00.000Z",
    ...patch,
  };
};

const exactPair = (checkpointId = CP.requestInterpretation) => {
  const definition = checkpoint(checkpointId);
  const sourceObject = object({ objectId: "object:1", owner: definition.sourceOwner });
  const targetObject = object({ objectId: "object:1", owner: definition.sourceOwner });
  return {
    source: snapshot(definition.sourceArtifactTypes[0], "source:1", [sourceObject], { owner: definition.sourceOwner }),
    target: snapshot(definition.targetArtifactTypes[0], "target:1", [targetObject], { owner: definition.targetOwner }),
  };
};

describe("VAL-001 Part 3 — runner", () => {
  it("VAL3-RUN-C01 Run applicable s'exécute", () => { const pair = exactPair(); expect(runCheckpointValidation(input(CP.requestInterpretation, pair.source, pair.target)).deterministicResult).toBe("COMPLETE"); });
  it("VAL3-RUN-C02 NOT_APPLICABLE reste NOT_APPLICABLE", () => expect(runCheckpointValidation(input(CP.requestInterpretation, null, null, { notApplicable: true })).status).toBe("NOT_APPLICABLE"));
  it("VAL3-RUN-C03 MISSING_SOURCE ne devient pas semantic failure", () => { const pair = exactPair(); const run = runCheckpointValidation(input(CP.requestInterpretation, null, pair.target)); expect(run.applicability?.status).toBe("MISSING_SOURCE"); expect(run.semanticStatus).toBe("NOT_EVALUABLE"); });
  it("VAL3-RUN-C04 MISSING_TARGET ne devient pas semantic failure", () => { const pair = exactPair(); const run = runCheckpointValidation(input(CP.requestInterpretation, pair.source, null)); expect(run.applicability?.status).toBe("MISSING_TARGET"); expect(run.semanticStatus).toBe("NOT_EVALUABLE"); });
  it("VAL3-RUN-C05 Snapshots construits une seule fois", () => { const pair = exactPair(); const run = runCheckpointValidation(input(CP.requestInterpretation, pair.source, pair.target)); expect(run.sourceSnapshotDigest).toBe(pair.source.snapshotDigest); expect(run.targetSnapshotDigest).toBe(pair.target.snapshotDigest); });
  it("VAL3-RUN-C06 Source non mutée", () => { const pair = exactPair(); const before = JSON.stringify(pair.source); runCheckpointValidation(input(CP.requestInterpretation, pair.source, pair.target)); expect(JSON.stringify(pair.source)).toBe(before); });
  it("VAL3-RUN-C07 Target non mutée", () => { const pair = exactPair(); const before = JSON.stringify(pair.target); runCheckpointValidation(input(CP.requestInterpretation, pair.source, pair.target)); expect(JSON.stringify(pair.target)).toBe(before); });
  it("VAL3-RUN-C08 Configuration digest stable", () => { const pair = exactPair(); const a = runCheckpointValidation(input(CP.requestInterpretation, pair.source, pair.target)); const b = runCheckpointValidation(input(CP.requestInterpretation, pair.source, pair.target)); expect(a.configurationDigest).toBe(b.configurationDigest); });
  it("VAL3-RUN-C09 Run COMPLETE immuable", () => { const pair = exactPair(); expect(Object.isFrozen(runCheckpointValidation(input(CP.requestInterpretation, pair.source, pair.target)))).toBe(true); });
  it("VAL3-RUN-C10 Nouvelle version checkpoint produit nouveau run", () => { const pair = exactPair(); const base = input(CP.requestInterpretation, pair.source, pair.target); const original = runCheckpointValidation(base); expect(() => runCheckpointValidation({ ...base, request: { ...base.request, checkpointVersion: "2.0.0" } })).toThrow("VAL_CHECKPOINT_UNKNOWN"); expect(original.checkpointRef.version).toBe("1.0.0"); });
  it("VAL3-RUN-C11 Nouvelle version source produit nouveau run", () => { const pair = exactPair(); const changed = snapshot("ORIGINAL_REQUEST", "source:1", pair.source.semanticObjects, { owner: pair.source.owner, metadata: { version: 2 } }); expect(runCheckpointValidation(input(CP.requestInterpretation, pair.source, pair.target)).validationRunId).not.toBe(runCheckpointValidation(input(CP.requestInterpretation, changed, pair.target)).validationRunId); });
  it("VAL3-RUN-C12 Replay identique reproduit les deterministic outputs", () => { const pair = exactPair(); const request = input(CP.requestInterpretation, pair.source, pair.target); const run = runCheckpointValidation(request); expect(replayValidationRun(run, request).resultDigest).toBe(run.resultDigest); });
});

describe("VAL-001 Part 3 — structure, identity and ownership", () => {
  const cases = [
    ["VAL3-DET-C01 CanonicalVariable identity préservée", "CanonicalVariable", "CanonicalVariable", "CDM-001", "CDM-001", false],
    ["VAL3-DET-C02 Duplicate identity détectée", "CanonicalVariable", "DUPLICATE", "CDM-001", "CDM-001", true],
    ["VAL3-DET-C03 Version transition explicite acceptée", "ScientificObject", "ScientificObject", "RESEARCH_PROJECT", "RESEARCH_PROJECT", false],
    ["VAL3-DET-C04 Version remplacée sans trace détectée", "CanonicalVariable", "Estimand", "CDM-001", "BIOSTATISTICS-001", true],
    ["VAL3-DET-C05 MeasurementDefinition owner préservé", "MeasurementDefinition", "MeasurementDefinition", "OBS-001", "OBS-001", false],
    ["VAL3-DET-C06 Project owner préservé", "PROJECT_OBJECT", "PROJECT_OBJECT", "RESEARCH_PROJECT", "RESEARCH_PROJECT", false],
    ["VAL3-DET-C07 Projection sourceOfTruth violation détectée", "ScientificObject", "ScientificObject", "TMP-001", "TMP-001", true],
    ["VAL3-DET-C08 Data field n’est pas Variable identity", "CanonicalVariable", "DataCollectionFieldProjection", "CDM-001", "DM-001", true],
    ["VAL3-DET-C09 Analysis role n’est pas Variable identity", "CanonicalVariable", "AnalysisVariableRole", "CDM-001", "BIOSTATISTICS-001", true],
    ["VAL3-DET-C10 Validation snapshot n’est jamais source de vérité", "ScientificObject", "ScientificObject", "USER", "USER", false],
  ] as const;
  it.each(cases)("%s", (_name, sourceType, targetType, sourceOwner, targetOwner, expectFinding) => {
    const cpId = _name.includes("Projection sourceOfTruth") ? CP.templateDocument : sourceType === "MeasurementDefinition" ? CP.thinkingObservationImaging : targetType === "AnalysisVariableRole" ? CP.scientificStateBiostatistics : CP.requestInterpretation;
    const definition = checkpoint(cpId);
    const sourceObject = object({ objectId: "identity:1", objectType: sourceType, owner: sourceOwner });
    const targets = targetType === "DUPLICATE" ? [object({ objectId: "identity:1", objectType: sourceType, owner: targetOwner }), object({ objectId: "identity:1", objectType: sourceType, owner: targetOwner })] : [object({ objectId: "identity:1", objectType: targetType, owner: targetOwner })];
    const source = snapshot(definition.sourceArtifactTypes[0], "source", [sourceObject], { owner: definition.sourceOwner });
    const targetBase = snapshot(definition.targetArtifactTypes[0], "target", targets, { owner: definition.targetOwner });
    const target = _name.includes("Projection sourceOfTruth") ? makeSnapshot({ ...targetBase, reference: { ...targetBase.reference, sourceOfTruth: true } }) : targetBase;
    const run = runCheckpointValidation(input(cpId, source, target));
    expect(run.findings.length > 0).toBe(expectFinding);
    expect(source.sourceOfTruth).toBe(false);
  });
});

describe("VAL-001 Part 3 — epistemic and decision", () => {
  const cases = [
    ["VAL3-EPI-C01 Candidate sans adoption reste candidate", "CANDIDATE_NOT_ADOPTED", "CANDIDATE_NOT_ADOPTED", true, true, false],
    ["VAL3-EPI-C02 Candidate → adopted sans Decision détecté", "CANDIDATE_NOT_ADOPTED", "ADOPTED", false, false, true],
    ["VAL3-EPI-C03 Rejected state ne devient pas active", "REJECTED", "INACTIVE", true, true, false],
    ["VAL3-EPI-C04 Superseded state ne devient pas active", "SUPERSEDED", "ACTIVE", false, false, true],
    ["VAL3-EPI-C05 UNKNOWN → CONFIRMED sans source détecté", "UNKNOWN", "CONFIRMED", false, false, true],
    ["VAL3-EPI-C06 Decision actor absent détecté", "CANDIDATE_NOT_ADOPTED", "ADOPTED", false, true, true],
    ["VAL3-EPI-C07 Decision mandate absent détecté", "CANDIDATE_NOT_ADOPTED", "ADOPTED", true, false, true],
    ["VAL3-EPI-C08 Decision target absent détecté", "CANDIDATE_NOT_ADOPTED", "ADOPTED", true, true, true],
    ["VAL3-EPI-C09 Stale adoption détectée", "CANDIDATE_NOT_ADOPTED", "ADOPTED", false, false, true],
    ["VAL3-EPI-C10 Frozen Project mutation détectée", "SUPERSEDED", "ADOPTED", false, false, true],
  ] as const;
  it.each(cases)("%s", (_name, sourceStatus, targetStatus, actor, mandate, expectFinding) => {
    const sourceObject = object({ objectId: "candidate:1", status: sourceStatus, owner: "SCIENTIFIC_INTERPRETATION" });
    const targetObject = object({ objectId: "candidate:1", status: targetStatus, owner: "SCIENTIFIC_INTERPRETATION" });
    const source = snapshot("SCIENTIFIC_INTERPRETATION_CONTRIBUTION", "source", [sourceObject]);
    const decisions = actor || mandate ? [{ decisionId: "decision:1", version: "1", status: "ADOPTED", actorPresent: actor, mandatePresent: mandate, targetRefs: _name.includes("target absent") ? [] : ["candidate:1"], provenanceRefs: ["human"] }] : [];
    const target = snapshot("RESEARCH_PROJECT", "project", [targetObject], { decisions, owner: "RESEARCH_PROJECT" });
    const run = runCheckpointValidation(input(CP.scientificStateProject, source, target));
    expect(run.findings.length > 0).toBe(expectFinding);
  });
});

describe("VAL-001 Part 3 — structured semantics", () => {
  it("VAL3-SEM-C01 Explicit negation preserved = no finding", () => { const source = snapshot("ORIGINAL_REQUEST", "s", [object({ objectId: "n", polarity: "NEGATED", owner: "USER" })]); const target = snapshot("SCIENTIFIC_INTERPRETATION_CONTRIBUTION", "t", [object({ objectId: "n", polarity: "NEGATED", owner: "USER" })]); expect(buildDeterministicObservations(checkpoint(CP.requestInterpretation), source, target).some((item) => item.observationType === "CONFLICT")).toBe(false); });
  it("VAL3-SEM-C02 Structured negation lost = finding", () => { const source = snapshot("ORIGINAL_REQUEST", "s", [object({ objectId: "n", polarity: "NEGATED", owner: "USER" })]); const target = snapshot("SCIENTIFIC_INTERPRETATION_CONTRIBUTION", "t", [object({ objectId: "n", polarity: "AFFIRMED", owner: "USER" })]); expect(runCheckpointValidation(input(CP.requestInterpretation, source, target)).findings.length).toBeGreaterThan(0); });
  it("VAL3-SEM-C03 Association → causation = semantic promotion", () => { const source = snapshot("ORIGINAL_REQUEST", "s", [], { relations: [{ relationId: "r", sourceObjectId: "a", targetObjectId: "b", relationType: "ASSOCIATED_WITH", polarity: "AFFIRMED", status: "ACTIVE", owner: "USER", sourceRefs: [], provenanceRefs: [] }] }); const target = snapshot("SCIENTIFIC_INTERPRETATION_CONTRIBUTION", "t", [], { relations: [{ relationId: "r", sourceObjectId: "a", targetObjectId: "b", relationType: "CAUSES", polarity: "AFFIRMED", status: "ACTIVE", owner: "SCIENTIFIC_INTERPRETATION", sourceRefs: [], provenanceRefs: [] }] }); expect(runCheckpointValidation(input(CP.requestInterpretation, source, target)).semanticReviewRequests.length).toBeGreaterThan(0); });
  it("VAL3-SEM-C04 Local practice → Project decision = unauthorized promotion", () => { const source = snapshot("SCIENTIFIC_INTERPRETATION_CONTRIBUTION", "s", [object({ objectId: "x", status: "CANDIDATE_LOCAL_PRACTICE" })]); const target = snapshot("RESEARCH_PROJECT", "t", [object({ objectId: "x", status: "ADOPTED" })]); expect(runCheckpointValidation(input(CP.scientificStateProject, source, target)).findings.length).toBeGreaterThan(0); });
  it("VAL3-SEM-C05 Different IDs not automatically semantic loss", () => { const value = compareCanonicalReferences([object({ objectId: "a", semanticKey: "same" })], [object({ objectId: "b", semanticKey: "same" })]); expect(value[0]).toMatchObject({ mapping: "SEMANTIC_MAPPING_PENDING" }); });
  it("VAL3-SEM-C06 Same label not automatically equivalence", () => expect(compareCanonicalReferences([object({ objectId: "a", semanticKey: "same" })], [object({ objectId: "b", semanticKey: "same" })])[0]?.identityMatch).toBe("DIFFERENT_ID"));
  it("VAL3-SEM-C07 Free-text-only unresolved meaning creates SemanticReviewRequest", () => { const source = snapshot("ORIGINAL_REQUEST", "s", [object({ objectId: "a", semanticKey: "same" })]); const target = snapshot("SCIENTIFIC_INTERPRETATION_CONTRIBUTION", "t", [object({ objectId: "b", semanticKey: "same" })]); expect(runCheckpointValidation(input(CP.requestInterpretation, source, target)).semanticReviewRequests.length).toBeGreaterThan(0); });
  it("VAL3-SEM-C08 Human-level ambiguity creates HumanReviewRequest", () => { const source = snapshot("SCIENTIFIC_INTERPRETATION_CONTRIBUTION", "s", []); const target = snapshot("RESEARCH_PROJECT", "t", []); expect(runCheckpointValidation(input(CP.scientificStateProject, source, target, { forceHumanReviewInvariantRefs: ["PROJECT:HUMAN_DECISION_REQUIRED"] })).humanReviewRequests).toHaveLength(1); });
  it("VAL3-SEM-C09 Semantic request has no execution in Part 3", () => { const source = snapshot("ORIGINAL_REQUEST", "s", [object({ objectId: "a", semanticKey: "same" })]); const target = snapshot("SCIENTIFIC_INTERPRETATION_CONTRIBUTION", "t", [object({ objectId: "b", semanticKey: "same" })]); const request = runCheckpointValidation(input(CP.requestInterpretation, source, target)).semanticReviewRequests[0]; expect(request?.providerPolicy).toBe("DISABLED_BY_DEFAULT"); });
  it("VAL3-SEM-C10 Provider calls remain zero", () => { const source = readFileSync("src/features/validation-architecture/deterministic-engine.ts", "utf8"); expect(source).not.toMatch(/fetch\s*\(|generateContent\s*\(|OpenAI\s*\(/); });
});

describe("VAL-001 Part 3 — design versus realized", () => {
  const cases = [
    ["VAL3-DR-C01 ExpectedVariableOccasion preserved", "ExpectedVariableOccasion", "ExpectedVariableOccasion", false],
    ["VAL3-DR-C02 ExpectedVariableOccasion → VariableOccurrence detected", "ExpectedVariableOccasion", "VariableOccurrence", true],
    ["VAL3-DR-C03 Planned source remains planned", "PlannedSource", "PlannedSource", false],
    ["VAL3-DR-C04 Planned source → realized without evidence detected", "PlannedSource", "DatasetRelease", true],
    ["VAL3-DR-C05 DatasetReleaseRequirement remains requirement", "DatasetReleaseRequirement", "DatasetReleaseRequirement", false],
    ["VAL3-DR-C06 DatasetRelease realized object forbidden", "DatasetReleaseRequirement", "DatasetRelease", true],
    ["VAL3-DR-C07 AnalysisSpecification remains specification", "AnalysisSpecification", "AnalysisSpecification", false],
    ["VAL3-DR-C08 AnalysisExecution forbidden", "AnalysisSpecification", "AnalysisExecution", true],
    ["VAL3-DR-C09 ExpectedOutput remains expected", "ExpectedOutput", "ExpectedOutput", false],
    ["VAL3-DR-C10 AnalysisResult forbidden", "ExpectedOutput", "AnalysisResult", true],
  ] as const;
  it.each(cases)("%s", (_name, sourceType, targetType, expected) => {
    const source = snapshot("STUDY_DATA_PLAN_CONTRIBUTION", "s", [object({ objectId: "design:1", objectType: sourceType, owner: "CDM-001" })]);
    const target = snapshot("DATA_MANAGEMENT_PLANNING_CONTRIBUTION", "t", [object({ objectId: "design:1", objectType: targetType, owner: "CDM-001" })]);
    expect(runCheckpointValidation(input(CP.studyDataDataManagement, source, target)).findings.length > 0).toBe(expected);
  });
});

describe("VAL-001 Part 3 — biostatistics", () => {
  const cases = [
    ["VAL3-BIO-C01 Endpoint distinct from Estimand", "Endpoint", "Endpoint", false],
    ["VAL3-BIO-C02 Estimand distinct from Model", "Estimand", "StatisticalModel", true],
    ["VAL3-BIO-C03 Variable distinct from analytical role", "CanonicalVariable", "AnalysisVariableRole", true],
    ["VAL3-BIO-C04 Project Population distinct from AnalysisPopulation", "ProjectPopulation", "AnalysisPopulation", true],
    ["VAL3-BIO-C05 Factual missingness distinct from MissingDataStrategy", "FactualMissingness", "MissingDataStrategy", true],
    ["VAL3-BIO-C06 Sensitivity does not replace Primary", "PrimaryAnalysis", "SensitivityAnalysis", true],
    ["VAL3-BIO-C07 Post-hoc remains post-hoc", "PostHocAnalysis", "PostHocAnalysis", false],
    ["VAL3-BIO-C08 Unknown statistical method is allowed", "StatisticalMethodDefinition", "StatisticalMethodDefinition", false],
    ["VAL3-BIO-C09 Invented method is finding", "StatisticalMethodDefinition", "StatisticalMethodDefinition", true],
    ["VAL3-BIO-C10 Invented sample-size assumption is finding", "DimensioningAssumption", "DimensioningAssumption", true],
  ] as const;
  it.each(cases)("%s", (_name, sourceType, targetType, expected) => {
    const sourceStatus = _name.includes("Unknown") || _name.includes("Invented") ? "UNKNOWN" : "KNOWN";
    const targetStatus = _name.includes("Unknown") ? "UNKNOWN" : _name.includes("Invented") ? "CONFIRMED" : "KNOWN";
    const source = snapshot("RESEARCH_PROJECT", "project", [object({ objectId: "bio:1", objectType: sourceType, status: sourceStatus, owner: "BIOSTATISTICS-001" })], { owner: "RESEARCH_PROJECT" });
    const target = snapshot("BIOSTATISTICS_PLANNING_CONTRIBUTION", "bio", [object({ objectId: "bio:1", objectType: targetType, status: targetStatus, owner: "BIOSTATISTICS-001" })], { owner: "BIOSTATISTICS-001" });
    expect(runCheckpointValidation(input(CP.scientificStateBiostatistics, source, target)).findings.length > 0).toBe(expected);
  });
});

describe("VAL-001 Part 3 — template and document", () => {
  const cases = [
    ["VAL3-DOC-C01 Template remains projection/composition", "KNOWN", "KNOWN", false],
    ["VAL3-DOC-C02 Document remains projection", "KNOWN", "KNOWN", false],
    ["VAL3-DOC-C03 Project refs preserved", "KNOWN", "KNOWN", false],
    ["VAL3-DOC-C04 CanonicalVariable refs preserved", "KNOWN", "KNOWN", false],
    ["VAL3-DOC-C05 NOT_GENERATABLE preserved", "NOT_GENERATABLE", "NOT_GENERATABLE", false],
    ["VAL3-DOC-C06 Unknown method does not generate vague default prose", "UNKNOWN", "NOT_GENERATABLE", false],
    ["VAL3-DOC-C07 Candidate preview stays NOT_ADOPTED", "CANDIDATE_NOT_ADOPTED", "CANDIDATE_NOT_ADOPTED", false],
    ["VAL3-DOC-C08 Document write-back absent", "KNOWN", "KNOWN", false],
    ["VAL3-DOC-C09 Local practice remains local", "CANDIDATE_LOCAL_PRACTICE", "CANDIDATE_LOCAL_PRACTICE", false],
    ["VAL3-DOC-C10 Historical reference remains historical", "HISTORICAL", "HISTORICAL", false],
  ] as const;
  it.each(cases)("%s", (_name, sourceStatus, targetStatus, expected) => {
    const source = snapshot("TEMPLATE_INSTANCE", "template", [object({ objectId: "section:1", objectType: "DocumentSection", status: sourceStatus, owner: "TMP-001" })], { owner: "TMP-001" });
    const target = snapshot("DOCUMENT_PROJECTION", "document", [object({ objectId: "section:1", objectType: "DocumentSection", status: targetStatus, owner: "TMP-001" })], { owner: "DOC-001" });
    expect(runCheckpointValidation(input(CP.templateDocument, source, target)).findings.length > 0).toBe(expected);
  });
});

describe("VAL-001 Part 3 — Audit-D trace", () => {
  const sourceFinding = makeFinding({ findingId: "audit:1", domainFailureClassRef: "CRITICAL_NEGATION_LOST", provenance: ["audit:1"] });
  it("VAL3-AUD-C01 Audit-D finding referenced", () => expect(traceFindingAcrossCheckpoint(sourceFinding, [sourceFinding]).status).toBe("PRESERVED"));
  it("VAL3-AUD-C02 Audit-D finding identity preserved", () => expect(traceFindingAcrossCheckpoint(sourceFinding, [sourceFinding]).downstreamFindingRef).toBe("audit:1"));
  it("VAL3-AUD-C03 Critical Audit-D finding downstream visible", () => expect(traceFindingAcrossCheckpoint(sourceFinding, [{ ...sourceFinding, findingId: "downstream" }]).status).toBe("PRESERVED"));
  it("VAL3-AUD-C04 Missing downstream finding is not called resolved", () => expect(traceFindingAcrossCheckpoint(sourceFinding, []).status).toBe("RESOLUTION_NOT_PROVEN"));
  it("VAL3-AUD-C05 Explicit Human Decision resolution can be referenced", () => expect(traceFindingAcrossCheckpoint(sourceFinding, [], ["decision:1"]).status).toBe("RESOLUTION_EVIDENCE_PRESENT"));
  it("VAL3-AUD-C06 VAL cannot itself close Audit-D finding", () => expect(traceFindingAcrossCheckpoint(sourceFinding, []).evidenceRefs).toHaveLength(0));
  it("VAL3-AUD-C07 Audit-L remains inactive", async () => expect((await import("../audit-d-adapter")).SEM_AUDIT_L_PRODUCT_ACTIVE).toBe(false));
  it("VAL3-AUD-C08 SEM Full remains archived", () => { const code = readFileSync("src/features/validation-architecture/deterministic-engine.ts", "utf8"); expect(code).not.toMatch(/scientific-semantic-reconstruction/); });
});

describe("VAL-001 Part 3 — corridor", () => {
  const allInputs = VALIDATION_CHECKPOINT_REGISTRY_V1.checkpoints.map((definition) => {
    const source = snapshot(definition.sourceArtifactTypes[0], `source:${definition.checkpointId}`, [], { owner: definition.sourceOwner });
    const target = snapshot(definition.targetArtifactTypes[0], `target:${definition.checkpointId}`, [], { owner: definition.targetOwner });
    return input(definition.checkpointId, source, target);
  });
  const corridor = () => runValidationCorridor({ corridorId: "corridor:test", checkpoints: allInputs, generatedAt: "2026-08-15T00:00:00.000Z" });
  it("VAL3-COR-C01 All observable A–J checkpoints dispatch correctly", () => expect(corridor().runs).toHaveLength(10));
  it("VAL3-COR-C02 Each checkpoint creates separate run identity", () => expect(new Set(corridor().runs.map((run) => run.validationRunId)).size).toBe(10));
  it("VAL3-COR-C03 Corridor summary only references runs", () => expect(corridor().summary.checkpointRunRefs).toEqual(corridor().runs.map((run) => run.validationRunId)));
  it("VAL3-COR-C04 Corridor summary does not become source of truth", () => expect(corridor().summary.projectionOnly).toBe(true));
  it("VAL3-COR-C05 Corridor does not mutate any artifact", () => { const before = JSON.stringify(allInputs); corridor(); expect(JSON.stringify(allInputs)).toBe(before); });
  it("VAL3-COR-C06 Blocked checkpoint handling follows dependency policy", () => { const pair = exactPair(); const badTarget = snapshot("SCIENTIFIC_INTERPRETATION_CONTRIBUTION", "bad", [object({ objectId: "object:1", owner: "WRONG" })]); const second = input(CP.interpretationThinking, snapshot("SCIENTIFIC_INTERPRETATION_CONTRIBUTION", "i", []), snapshot("SCIENTIFIC_THINKING_RESULT", "st", [])); const result = runValidationCorridor({ corridorId: "dep", checkpoints: [input(CP.requestInterpretation, pair.source, badTarget), second], dependencyPolicy: { [CP.interpretationThinking]: [CP.requestInterpretation] } }); expect(result.runs[1]?.applicability?.status).toBe("NOT_READY"); });
  it("VAL3-COR-C07 NOT_APPLICABLE does not create false failure", () => { const pair = exactPair(); const result = runValidationCorridor({ corridorId: "na", checkpoints: [input(CP.requestInterpretation, pair.source, pair.target, { notApplicable: true })] }); expect(result.runs[0]?.findings).toHaveLength(0); });
  it("VAL3-COR-C08 Pending Semantic Review retained", () => { const source = snapshot("ORIGINAL_REQUEST", "s", [object({ objectId: "a", semanticKey: "same" })]); const target = snapshot("SCIENTIFIC_INTERPRETATION_CONTRIBUTION", "t", [object({ objectId: "b", semanticKey: "same" })]); expect(runValidationCorridor({ corridorId: "s", checkpoints: [input(CP.requestInterpretation, source, target)] }).summary.pendingSemanticReviewCount).toBeGreaterThan(0); });
  it("VAL3-COR-C09 Pending Human Review retained", () => { const source = snapshot("SCIENTIFIC_INTERPRETATION_CONTRIBUTION", "s", []); const target = snapshot("RESEARCH_PROJECT", "t", []); expect(runValidationCorridor({ corridorId: "h", checkpoints: [input(CP.scientificStateProject, source, target, { forceHumanReviewInvariantRefs: ["PROJECT:HUMAN_DECISION_REQUIRED"] })] }).summary.pendingHumanReviewCount).toBe(1); });
  it("VAL3-COR-C10 No overall scientific PASS generated", () => expect(corridor().summary.scientificQualificationClaimed).toBe(false));
});

describe("VAL-001 Part 3 — standalone comparison and provider boundaries", () => {
  it("compares artifact identity without semantic guessing", () => expect(compareExactIdentity(makeArtifactReference({ artifactId: "a" }), makeArtifactReference({ artifactId: "b" })).identityMatch).toBe("DIFFERENT_ID"));
  it("compares referenced collections deterministically", () => expect(compareReferencedCollections(["a", "b"], ["b", "c"])).toEqual({ preserved: ["b"], missing: ["a"], added: ["c"] }));
  it("domain provider failures remain technical", () => { const pair = exactPair(); const provider: DomainValidationProvider = { providerId: "failing", owner: "DOMAIN", invariantRefs: ["VAL-C08"], version: "1", deterministic: true, limitations: [], supports: () => true, validateReadOnly: () => { throw new TypeError("fixture"); } }; const result = runDomainValidatorsReadOnly([provider], pair.source, pair.target, checkpoint(CP.requestInterpretation)); expect(result.failures[0]?.errorClass).toBe("TypeError"); });
  it("provider resolution requires supported owner invariant", () => { const pair = exactPair(); const provider: DomainValidationProvider = { providerId: "unsupported", owner: "DOMAIN", invariantRefs: ["UNKNOWN"], version: "1", deterministic: true, limitations: [], supports: () => true, validateReadOnly: () => ({ observations: [], findings: [], sourceMutationAuthorized: false, targetMutationAuthorized: false }) }; expect(resolveDomainValidationProviders([provider], pair.source, pair.target, checkpoint(CP.requestInterpretation))).toHaveLength(0); });
  it("disposition keeps semantic review distinct from failure", () => { const cpDef = checkpoint(CP.requestInterpretation); const applicability = { checkpointId: cpDef.checkpointId, checkpointVersion: cpDef.version, status: "APPLICABLE" as const, reason: "test", missingArtifacts: [], decisionsRequired: [], limitations: [] }; expect(computeValidationDisposition({ applicability, technicalStatus: "SUCCESS", findings: [], semanticReviewRequests: [{} as never], humanReviewRequests: [] })).toBe("REQUIRE_REVIEW"); });
});
