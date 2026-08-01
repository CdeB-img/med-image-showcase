import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { entities, relations } from "./catalog.mjs";
import { competencyCases, validateCompetencyModel } from "./competency-cases.mjs";
import { evaluateEntityCompleteness, familyCompletenessProfiles } from "./completeness-profiles.mjs";
import { formalRelationDefinitions, getFamilyPairCardinality, validateFormalRelations } from "./formal-relations.mjs";
import {
  activeStructuralRelations,
  biomarkerProfileMigrations,
  conceptDesignations,
  conceptIdentities,
  deferredHistoricalRelations,
  entityMigrationEntries,
  entityRevisions,
  historicalEntities,
  historicalPublications,
  historicalRelations,
  inactiveHistoricalRelations,
  publicationCorrectionAudit,
  publicationVersions,
  publicationWorks,
  relationMigrationEntries,
  scientificAssertionRevisions,
  scientificEvidenceLinks,
  sourceIdentities,
  sourceRevisions,
  sourceSnapshot,
} from "./migration/migrated-knowledge.mjs";
import { createKnowledgeGraphMigrationManifest } from "./migration/manifest.mjs";
import { createKnowledgeGraphSnapshot, validateFrozenKnowledgeGraphSnapshot } from "./migration/snapshot.mjs";
import { stableStringify } from "./migration/stable-json.mjs";
import { resolveRelation, resolveRelationId } from "./migration/relation-id-resolver.mjs";
import {
  validateCompetencyCases,
  validateFamilyCompleteness,
  validateKnowledgeGraphSemantics,
  validateKnowledgeGraphStructure,
  validateMigrationIntegrity,
  validateProjectionReadiness,
  validateScientificAssertions,
  validateScientificKnowledgeGraph,
  validateScientificProvenance,
} from "./multilayer-validation.mjs";
import {
  SCIENTIFIC_MODEL_BASELINE_AT,
  createApplicabilityContext,
  createConceptIdentity,
  createContextDimension,
  createContractRecord,
  createEntityRevision,
  createEvidenceLink,
  createScientificAssertionIdentity,
  createScientificAssertionRevision,
  createSourceIdentity,
  createSourceRevision,
  scientificModelContracts,
} from "./scientific-model-factories.mjs";
import {
  contextDimensionNames,
  evidenceQualities,
  evidenceSourceTypes,
  scientificMaturities,
  sourceCompletenessProfiles,
} from "./scientific-model-schema.mjs";
import {
  evaluateSourceCompleteness,
  validateContextDimension,
  validateQuantitativeRecord,
  validateScientificAssertionRevisions,
  validateSourceModel,
  validateVersionedRecords,
} from "./scientific-model-validate.mjs";
import { createStructuredLiteratureSynthesis } from "./structured-synthesis.mjs";

const root = process.cwd();
const T = SCIENTIFIC_MODEL_BASELINE_AT;
const syntheticSourceIdentity = createSourceIdentity({ stableId: "synthetic:web:source", sourceType: "INTERNAL_DOCUMENT" });
const syntheticSourceRevision = createSourceRevision({
  stableId: syntheticSourceIdentity.stableId,
  sourceType: "INTERNAL_DOCUMENT",
  title: "Synthetic web-only source",
  repositoryPath: "synthetic/fixture-only.md",
  digest: "synthetic-digest",
  sourceRefs: [syntheticSourceIdentity.stableId],
});
const syntheticAssertionIdentity = (stableId, assertionType) => createScientificAssertionIdentity({ stableId, assertionType, sourceRefs: [syntheticSourceIdentity.stableId] });
const syntheticAssertion = (overrides = {}) => createScientificAssertionRevision({
  stableId: overrides.stableId ?? "synthetic:web:assertion:base",
  assertionType: overrides.assertionType ?? "EntityObjectAssertion",
  subjectEntityId: overrides.subjectEntityId ?? "synthetic:web:concept:subject",
  predicate: overrides.predicate ?? "ASSOCIATED_WITH",
  objectEntityId: Object.hasOwn(overrides, "objectEntityId") ? overrides.objectEntityId : "synthetic:web:concept:object",
  literalValue: overrides.literalValue ?? null,
  quantitativeValue: overrides.quantitativeValue ?? null,
  normativeStatement: overrides.normativeStatement ?? null,
  context: overrides.context ?? null,
  polarity: overrides.polarity ?? "POSITIVE",
  confidence: overrides.confidence ?? "MODERATE",
  evidenceQuality: overrides.evidenceQuality ?? "MODERATE",
  scientificMaturity: overrides.scientificMaturity ?? "PRELIMINARY",
  sourceRefs: [syntheticSourceIdentity.stableId],
  limitations: overrides.limitations ?? ["SYNTHETIC_FIXTURE_ONLY"],
  ...overrides,
});
const syntheticEvidence = (assertionRevisionId, relationType, suffix = relationType.toLowerCase()) => createEvidenceLink({
  evidenceLinkId: `synthetic:web:evidence:${suffix}`,
  sourceRevisionId: syntheticSourceRevision.revisionId,
  assertionRevisionId,
  relationType,
  evidenceSourceType: "INTERNAL_DOCUMENT",
  evidenceQuality: "MODERATE",
  confidence: "MODERATE",
});

describe("P3M-Web deterministic migration", () => {
  it("1. creates deterministic snapshots", () => {
    const left = createKnowledgeGraphSnapshot({ root, gitSha: sourceSnapshot.data.gitSha });
    const right = createKnowledgeGraphSnapshot({ root, gitSha: sourceSnapshot.data.gitSha });
    expect(stableStringify(left)).toBe(stableStringify(right));
  });

  it("2. validates the frozen pre-migration snapshot", () => {
    expect(validateFrozenKnowledgeGraphSnapshot(sourceSnapshot)).toMatchObject({ valid: true, errors: [] });
  });

  it("3. preserves every historical entity", () => {
    expect(historicalEntities).toHaveLength(118);
    expect(conceptIdentities).toHaveLength(118);
    expect(entityRevisions).toHaveLength(118);
    expect(entityMigrationEntries.every((entry) => entry.historicalDigest === entry.migratedPayloadDigest)).toBe(true);
  });

  it("4. preserves every historical relation in the inventory", () => {
    expect(historicalRelations).toHaveLength(93);
    expect(relationMigrationEntries).toHaveLength(93);
  });

  it("5. gives every migrated relation a collision-free v2 identity", () => {
    expect(new Set(relationMigrationEntries.map((entry) => entry.newId)).size).toBe(93);
    expect(relationMigrationEntries.every((entry) => entry.newId.includes(":relation:v2:"))).toBe(true);
  });

  it("6. resolves all legacy relation IDs", () => {
    for (const entry of relationMigrationEntries) expect(resolveRelationId(entry.oldId)).toBe(entry.newId);
  });

  it("7. resolves both a legacy ID and its current relation", () => {
    const entry = relationMigrationEntries[0];
    expect(resolveRelation(entry.oldId)?.relationId).toBe(entry.newId);
    expect(resolveRelation(entry.newId)?.relationId).toBe(entry.newId);
  });

  it("8. separates stable concept identity from revision identity", () => {
    for (const revision of entityRevisions) expect(revision.revisionId).not.toBe(revision.stableId);
  });

  it("9. accepts a valid revision period", () => {
    const identity = createConceptIdentity({ stableId: "synthetic:web:concept:validity", entityType: "Biomarker", sourceRefs: ["synthetic:web:source"] });
    const revision = createEntityRevision({ stableId: identity.stableId, payload: {}, sourceRefs: identity.sourceRefs, validFrom: "2025-01-01T00:00:00.000Z", validUntil: "2026-01-01T00:00:00.000Z" });
    expect(validateVersionedRecords({ identities: [identity], revisions: [revision] }).valid).toBe(true);
  });

  it("10. rejects an inverted revision period", () => {
    const identity = createConceptIdentity({ stableId: "synthetic:web:concept:invalid-validity", entityType: "Biomarker", sourceRefs: ["synthetic:web:source"] });
    const revision = createEntityRevision({ stableId: identity.stableId, payload: {}, sourceRefs: identity.sourceRefs, validFrom: "2026-01-01T00:00:00.000Z", validUntil: "2025-01-01T00:00:00.000Z" });
    expect(validateVersionedRecords({ identities: [identity], revisions: [revision] }).errors).toEqual(expect.arrayContaining([expect.objectContaining({ code: "INVALID_VALIDITY_PERIOD" })]));
  });

  it("11. versions every migrated source", () => {
    expect(sourceIdentities).toHaveLength(33);
    expect(sourceRevisions).toHaveLength(33);
    expect(validateSourceModel({ sourceIdentities, sourceRevisions }).valid).toBe(true);
  });

  it("12. applies category-specific source completeness", () => {
    expect(Object.keys(sourceCompletenessProfiles)).toEqual(expect.arrayContaining(["REPOSITORY_PAGE", "SCIENTIFIC_PUBLICATION", "MANUFACTURER_DOCUMENTATION"]));
    expect(evaluateSourceCompleteness(syntheticSourceRevision).valid).toBe(true);
  });

  it("13. keeps evidence dimensions separate", () => {
    expect(evidenceSourceTypes).toContain("META_ANALYSIS");
    expect(evidenceQualities).toEqual(["UNKNOWN", "VERY_LOW", "LOW", "MODERATE", "HIGH"]);
    expect(scientificMaturities).toContain("ESTABLISHED");
  });

  it("14. validates an entity-object assertion", () => {
    const assertion = syntheticAssertion();
    const result = validateScientificAssertionRevisions({ assertionIdentities: [syntheticAssertionIdentity(assertion.stableId, assertion.assertionType)], assertionRevisions: [assertion], evidenceLinks: [syntheticEvidence(assertion.revisionId, "SUPPORTS")], sourceRevisions: [syntheticSourceRevision] });
    expect(result.valid).toBe(true);
  });

  it("15. validates a literal assertion without objectEntityId", () => {
    const assertion = syntheticAssertion({ stableId: "synthetic:web:assertion:literal", assertionType: "LiteralValueAssertion", objectEntityId: null, literalValue: "Synthetic literal" });
    expect(validateScientificAssertionRevisions({ assertionIdentities: [syntheticAssertionIdentity(assertion.stableId, assertion.assertionType)], assertionRevisions: [assertion], evidenceLinks: [syntheticEvidence(assertion.revisionId, "SUPPORTS", "literal")], sourceRevisions: [syntheticSourceRevision] }).valid).toBe(true);
  });

  it("16. validates a quantitative assertion without objectEntityId", () => {
    const assertion = syntheticAssertion({ stableId: "synthetic:web:assertion:quantity", assertionType: "QuantitativeAssertion", objectEntityId: null, quantitativeValue: { value: 42, unit: "synthetic-unit", unitRequired: true } });
    expect(validateScientificAssertionRevisions({ assertionIdentities: [syntheticAssertionIdentity(assertion.stableId, assertion.assertionType)], assertionRevisions: [assertion], evidenceLinks: [syntheticEvidence(assertion.revisionId, "SUPPORTS", "quantity")], sourceRevisions: [syntheticSourceRevision] }).valid).toBe(true);
  });

  it("17. rejects a required quantitative unit when absent", () => {
    const assertion = syntheticAssertion({ stableId: "synthetic:web:assertion:no-unit", assertionType: "QuantitativeAssertion", objectEntityId: null, quantitativeValue: { value: 42, unit: null, unitRequired: true } });
    const result = validateScientificAssertionRevisions({ assertionIdentities: [syntheticAssertionIdentity(assertion.stableId, assertion.assertionType)], assertionRevisions: [assertion], evidenceLinks: [], sourceRevisions: [] });
    expect(result.errors).toEqual(expect.arrayContaining([expect.objectContaining({ code: "QUANTITATIVE_UNIT_REQUIRED" })]));
  });

  it("18. validates a documentary compatibility assertion", () => {
    const assertion = syntheticAssertion({ stableId: "synthetic:web:assertion:compatibility", assertionType: "CompatibilityAssertion", predicate: "COMPATIBLE_WITH" });
    expect(validateScientificAssertionRevisions({ assertionIdentities: [syntheticAssertionIdentity(assertion.stableId, assertion.assertionType)], assertionRevisions: [assertion], evidenceLinks: [syntheticEvidence(assertion.revisionId, "QUALIFIES", "compatibility")], sourceRevisions: [syntheticSourceRevision] }).valid).toBe(true);
  });

  it("19. validates a cited recommendation without objectEntityId", () => {
    const assertion = syntheticAssertion({ stableId: "synthetic:web:assertion:recommendation", assertionType: "RecommendationAssertion", objectEntityId: null, normativeStatement: { text: "Synthetic recommendation", issuer: "Synthetic issuer" } });
    expect(validateScientificAssertionRevisions({ assertionIdentities: [syntheticAssertionIdentity(assertion.stableId, assertion.assertionType)], assertionRevisions: [assertion], evidenceLinks: [syntheticEvidence(assertion.revisionId, "SUPPORTS", "recommendation")], sourceRevisions: [syntheticSourceRevision] }).valid).toBe(true);
  });

  it("20. validates a negative assertion", () => {
    const assertion = syntheticAssertion({ stableId: "synthetic:web:assertion:negative", assertionType: "NegativeAssertion", polarity: "NEGATIVE" });
    expect(validateScientificAssertionRevisions({ assertionIdentities: [syntheticAssertionIdentity(assertion.stableId, assertion.assertionType)], assertionRevisions: [assertion], evidenceLinks: [syntheticEvidence(assertion.revisionId, "SUPPORTS", "negative")], sourceRevisions: [syntheticSourceRevision] }).valid).toBe(true);
  });

  for (const [index, relationType] of ["SUPPORTS", "REFUTES", "QUALIFIES", "MENTIONS"].entries()) {
    it(`${21 + index}. validates EvidenceLink ${relationType}`, () => {
      const assertion = syntheticAssertion({ stableId: `synthetic:web:assertion:${relationType.toLowerCase()}` });
      const result = validateScientificAssertionRevisions({ assertionIdentities: [syntheticAssertionIdentity(assertion.stableId, assertion.assertionType)], assertionRevisions: [assertion], evidenceLinks: [syntheticEvidence(assertion.revisionId, relationType, `${relationType.toLowerCase()}-single`)], sourceRevisions: [syntheticSourceRevision] });
      expect(result.valid).toBe(true);
    });
  }

  it("25. retains and detects contradictory evidence", () => {
    const assertion = syntheticAssertion({ stableId: "synthetic:web:assertion:contradiction" });
    const links = [syntheticEvidence(assertion.revisionId, "SUPPORTS", "contradiction-support"), syntheticEvidence(assertion.revisionId, "REFUTES", "contradiction-refute")];
    const result = validateScientificAssertionRevisions({ assertionIdentities: [syntheticAssertionIdentity(assertion.stableId, assertion.assertionType)], assertionRevisions: [assertion], evidenceLinks: links, sourceRevisions: [syntheticSourceRevision] });
    expect(result.valid).toBe(true);
    expect(result.contradictions).toHaveLength(1);
  });

  for (const [index, [operator, payload]] of [
    ["EXACT", { value: "synthetic" }],
    ["ANY_OF", { values: ["a", "b"] }],
    ["ALL_OF", { values: ["a", "b"] }],
    ["EXCLUDES", { values: ["x"] }],
    ["RANGE", { range: { min: 1.5, max: 3 }, unit: "T" }],
    ["CONDITION", { condition: "synthetic-only" }],
    ["UNKNOWN", { unknownState: "UNKNOWN" }],
    ["NOT_APPLICABLE", { unknownState: "NOT_APPLICABLE" }],
  ].entries()) {
    it(`${26 + index}. validates context operator ${operator}`, () => {
      const dimension = createContextDimension({ dimension: "fieldStrength", operator, ...payload });
      expect(validateContextDimension(dimension).valid).toBe(true);
    });
  }

  it("34. supports all web scientific context dimensions", () => {
    expect(contextDimensionNames).toEqual(expect.arrayContaining(["population", "disease", "modality", "manufacturer", "equipmentModel", "softwareVersion", "fieldStrength", "sequence", "protocol", "measurementMethod", "temporality"]));
  });

  it("35. validates a measurement with unit and method", () => {
    const measurement = createContractRecord("MeasurementDefinition", { stableId: "synthetic:web:measurement", revisionId: "synthetic:web:measurement:revision:1", status: "DRAFT", quantity: "synthetic quantity", unit: "synthetic unit", method: "synthetic method", sourceRefs: ["synthetic:web:source"] });
    expect(validateQuantitativeRecord(measurement, { unitRequired: true }).valid).toBe(true);
  });

  it("36. rejects a measurement without a required unit", () => {
    const measurement = createContractRecord("MeasurementDefinition", { stableId: "synthetic:web:measurement:no-unit", revisionId: "synthetic:web:measurement:no-unit:revision:1", status: "DRAFT", quantity: "synthetic quantity", unit: null, method: "synthetic method", sourceRefs: ["synthetic:web:source"] });
    expect(validateQuantitativeRecord(measurement, { unitRequired: true }).errors).toEqual(expect.arrayContaining([expect.objectContaining({ code: "UNIT_REQUIRED" })]));
  });

  it("37. represents a documentary protocol revision", () => {
    const record = createContractRecord("ProtocolDescriptionRevision", { stableId: "synthetic:web:protocol", revisionId: "synthetic:web:protocol:revision:1", revisionNumber: 1, summary: "Synthetic", context: null, publishedParameters: [], describedVariants: [], sourceRefs: ["synthetic:web:source"], status: "DRAFT", validFrom: null, validUntil: null, createdAt: T, updatedAt: T });
    expect(record.recordType).toBe("ProtocolDescriptionRevision");
  });

  it("38. excludes executable protocol fallbacks and exceptions", () => {
    expect(scientificModelContracts.FallbackRule).toBeUndefined();
    expect(scientificModelContracts.ExceptionRule).toBeUndefined();
  });

  it("39. represents documentary equipment context", () => {
    expect(scientificModelContracts.EquipmentModel).toBeDefined();
    expect(scientificModelContracts.CapabilityStatement).toBeDefined();
    expect(scientificModelContracts.SoftwareVersion).toBeDefined();
  });

  it("40. excludes installed equipment and operational licenses", () => {
    expect(scientificModelContracts.InstalledEquipment).toBeUndefined();
    expect(scientificModelContracts.HardwareConfiguration).toBeUndefined();
    expect(scientificModelContracts.License).toBeUndefined();
  });

  it("41. represents documentary workflow and CoreLab descriptions", () => {
    expect(scientificModelContracts.WorkflowDescriptionRevision).toBeDefined();
    expect(scientificModelContracts.CoreLabDescriptionRevision).toBeDefined();
  });

  it("42. excludes executable workflow objects", () => {
    for (const name of ["WorkflowTransition", "WorkflowRole", "AcceptanceCriterion", "QualityControlRule"]) expect(scientificModelContracts[name]).toBeUndefined();
  });

  it("43. represents published studies, datasets and algorithms lightly", () => {
    for (const name of ["Study", "Dataset", "Algorithm"]) expect(scientificModelContracts[name]).toBeDefined();
  });

  it("44. excludes internal dataset and deployed-model machinery", () => {
    for (const name of ["StudyArm", "DatasetSplit", "ConsentProfile", "ModelVersion", "EvaluationResult"]) expect(scientificModelContracts[name]).toBeUndefined();
  });

  it("45. migrates preferred labels and aliases to contextual designations", () => {
    expect(conceptDesignations.length).toBeGreaterThan(118);
    expect(new Set(conceptDesignations.map((designation) => designation.designationId)).size).toBe(conceptDesignations.length);
    expect(conceptDesignations.every((designation) => Object.hasOwn(designation, "language") && Object.hasOwn(designation, "context"))).toBe(true);
  });

  it("46. allows the same designation string for several concepts", () => {
    const first = createContractRecord("ConceptDesignation", { designationId: "synthetic:web:designation:a", entityId: "synthetic:web:concept:a", value: "ADC", language: "fr", locale: "fr-FR", designationType: "ACRONYM", preferred: false, context: { domain: "radiology" }, sourceRef: "synthetic:web:source", validFrom: null, validUntil: null });
    const second = createContractRecord("ConceptDesignation", { ...first, designationId: "synthetic:web:designation:b", entityId: "synthetic:web:concept:b", context: { domain: "other" } });
    expect(first.value).toBe(second.value);
    expect(first.entityId).not.toBe(second.entityId);
  });

  it("47. keeps external terminology codes optional", () => {
    expect(scientificModelContracts.ExternalIdentifier).toBeDefined();
    expect(conceptIdentities.every((identity) => identity.externalIdentityRefs.length === 0)).toBe(true);
  });

  it("48. applies relation cardinality by family pair", () => {
    expect(getFamilyPairCardinality("PART_OF", "Organ", "BodySystem")).toBe("N:1");
    expect(getFamilyPairCardinality("PART_OF", "Region", "Organ")).toBe("N:N");
    expect(getFamilyPairCardinality("IS_A", "Biomarker", "Biomarker")).toBe("N:N");
  });

  it("49. defines inverses for every structural relation type", () => {
    for (const definition of Object.values(formalRelationDefinitions)) expect(definition.inverse).toHaveProperty("relationType");
  });

  it("50. detects combined hierarchy cycles", () => {
    const syntheticEntities = [{ entityId: "synthetic:organ", entityType: "Organ" }, { entityId: "synthetic:system", entityType: "BodySystem" }];
    const syntheticRelations = [{ relationId: "synthetic:r1", relationType: "PART_OF", sourceId: "synthetic:organ", targetId: "synthetic:system" }, { relationId: "synthetic:r2", relationType: "IS_A", sourceId: "synthetic:system", targetId: "synthetic:organ" }];
    expect(validateFormalRelations({ relations: syntheticRelations, entities: syntheticEntities }).errors).toEqual(expect.arrayContaining([expect.objectContaining({ code: "COMBINED_RELATION_CYCLE" })]));
  });

  it("51. classifies all 93 historical relations", () => {
    const allowed = ["STRUCTURAL_SAFE", "SCIENTIFIC_CANDIDATE", "EVIDENCE_MENTION", "WORKFLOW_AMBIGUOUS", "SEMANTICALLY_INCORRECT", "UNRESOLVED"];
    expect(relationMigrationEntries).toHaveLength(93);
    expect(relationMigrationEntries.every((entry) => allowed.includes(entry.category))).toBe(true);
  });

  it("52. never creates an assertion from a historical relation", () => {
    expect(relationMigrationEntries.every((entry) => entry.assertionCreated === false)).toBe(true);
    expect(scientificAssertionRevisions).toEqual([]);
    expect(scientificEvidenceLinks).toEqual([]);
  });

  it("53. disables the false thoracic-region-to-lung relation", () => {
    const relation = relationMigrationEntries.find((entry) => entry.sourceEntityId.endsWith(":region:thoracic") && entry.targetEntityId.endsWith(":organ:lung"));
    expect(relation).toMatchObject({ category: "SEMANTICALLY_INCORRECT", active: false });
  });

  it("54. disables the reductive DICOM compatibility relation", () => {
    const relation = relationMigrationEntries.find((entry) => entry.relationType === "COMPATIBLE_WITH" && entry.sourceEntityId.endsWith(":format:dicom"));
    expect(relation).toMatchObject({ category: "SEMANTICALLY_INCORRECT", active: false });
  });

  it("55. retains ambiguous workflow relations for review", () => {
    expect(deferredHistoricalRelations.some((entry) => entry.category === "WORKFLOW_AMBIGUOUS")).toBe(true);
  });

  it("56. migrates all 9 publications with explicit null unknowns", () => {
    expect(historicalPublications).toHaveLength(9);
    expect(publicationWorks).toHaveLength(9);
    expect(publicationVersions).toHaveLength(9);
    expect(publicationVersions.every((publication) => Object.hasOwn(publication, "doi") && Object.hasOwn(publication, "pmid") && Object.hasOwn(publication, "authors"))).toBe(true);
  });

  it("57. leaves the possible PLOS correction link unapplied", () => {
    expect(publicationCorrectionAudit).toMatchObject({ decision: "CANDIDATE_NOT_APPLIED", evidenceLinkCreated: false });
  });

  it("58. requalifies all 13 biomarker profiles without fake completeness", () => {
    expect(biomarkerProfileMigrations).toHaveLength(13);
    expect(biomarkerProfileMigrations.every((profile) => profile.emptyArraysTreatedAsComplete === false && profile.scientificAssertionCreated === false)).toBe(true);
  });

  it("59. marks migrated biomarker profiles scientifically insufficient", () => {
    expect(biomarkerProfileMigrations.every((profile) => profile.completeness.SCIENTIFIC === "INSUFFICIENT")).toBe(true);
  });

  it("60. evaluates family completeness by public-site usage", () => {
    expect(Object.keys(familyCompletenessProfiles.Biomarker)).toEqual(expect.arrayContaining(["CATALOG", "EDITORIAL", "SCIENTIFIC", "COMPARISON", "GLOSSARY", "NAVIGATION", "SEO", "KNOWLEDGE_STATE"]));
    expect(evaluateEntityCompleteness({ entity: entities[0], usage: "CATALOG" }).state).toBe("COMPLETE");
  });

  it("61. exposes independent multilayer validation results", () => {
    const result = validateScientificKnowledgeGraph({ root });
    expect(result).toMatchObject({ structureValid: true, semanticsValid: true, scientificValid: true, provenanceValid: true, coverageValid: true, competencyValid: true, migrationIntegrityValid: true, projectionReady: true, publicScientificContentReady: false });
  });

  it("62. validates every layer independently", () => {
    expect(validateKnowledgeGraphStructure({ root }).structureValid).toBe(true);
    expect(validateKnowledgeGraphSemantics().semanticsValid).toBe(true);
    expect(validateScientificAssertions().scientificValid).toBe(true);
    expect(validateScientificProvenance().provenanceValid).toBe(true);
    expect(validateFamilyCompleteness().coverageValid).toBe(true);
    expect(validateCompetencyCases().competencyValid).toBe(true);
    expect(validateMigrationIntegrity().migrationIntegrityValid).toBe(true);
    expect(validateProjectionReadiness().projectionReady).toBe(true);
  });

  it("63. makes IRM/ECV representable without claiming missing data", () => {
    const result = validateCompetencyModel().results.find((item) => item.caseId === "ecv-publication-query-3t");
    expect(result).toMatchObject({ modelRepresentable: true, dataPresent: false, verifiedAssertions: false });
  });

  it("64. makes CT/ECV representable without claiming missing data", () => {
    const result = validateCompetencyModel().results.find((item) => item.caseId === "ct-ecv-publication-query");
    expect(result).toMatchObject({ modelRepresentable: true, dataPresent: false, verifiedAssertions: false });
  });

  it("65. makes documentary protocol queries representable", () => {
    expect(validateCompetencyModel().results.find((item) => item.caseId === "myocarditis-protocol-descriptions").modelRepresentable).toBe(true);
  });

  it("66. makes MOLLI/SASHA comparisons representable", () => {
    expect(validateCompetencyModel().results.find((item) => item.caseId === "molli-sasha-comparison").modelRepresentable).toBe(true);
  });

  it("67. makes platform limitation pages representable", () => {
    expect(validateCompetencyModel().results.find((item) => item.caseId === "platform-limitations").modelRepresentable).toBe(true);
  });

  it("68. makes controversies and knowledge history representable", () => {
    const results = validateCompetencyModel().results;
    expect(results.find((item) => item.caseId === "controversy-two-publications").modelRepresentable).toBe(true);
    expect(results.find((item) => item.caseId === "corrected-publication-history").modelRepresentable).toBe(true);
  });

  it("69. makes glossary, quantitative sheets and DICOM trees representable", () => {
    const results = validateCompetencyModel().results;
    for (const id of ["multilingual-polysemous-glossary", "quantitative-biomarker-fact-sheet", "dicom-documentary-tree"]) expect(results.find((item) => item.caseId === id).modelRepresentable).toBe(true);
  });

  it("70. produces deterministic structured literature synthesis", () => {
    const assertion = syntheticAssertion({ stableId: "synthetic:web:assertion:synthesis" });
    const link = syntheticEvidence(assertion.revisionId, "SUPPORTS", "synthesis-support");
    const input = { query: { subjectEntityIds: [assertion.subjectEntityId] }, assertionRevisions: [assertion], evidenceLinks: [link], sourceRevisions: [syntheticSourceRevision] };
    expect(stableStringify(createStructuredLiteratureSynthesis(input))).toBe(stableStringify(createStructuredLiteratureSynthesis(input)));
  });

  it("71. retains favorable, unfavorable and qualified evidence", () => {
    const assertion = syntheticAssertion({ stableId: "synthetic:web:assertion:synthesis-evidence" });
    const links = [syntheticEvidence(assertion.revisionId, "SUPPORTS", "syn-support"), syntheticEvidence(assertion.revisionId, "REFUTES", "syn-refute"), syntheticEvidence(assertion.revisionId, "QUALIFIES", "syn-qualify")];
    const synthesis = createStructuredLiteratureSynthesis({ assertionRevisions: [assertion], evidenceLinks: links, sourceRevisions: [syntheticSourceRevision] });
    expect(synthesis.favorableAssertions).toHaveLength(1);
    expect(synthesis.unfavorableAssertions).toHaveLength(1);
    expect(synthesis.qualifications).toHaveLength(1);
    expect(synthesis.contradictions).toHaveLength(1);
  });

  it("72. refuses to declare consensus without an explicit rule", () => {
    const synthesis = createStructuredLiteratureSynthesis({ assertionRevisions: [], evidenceLinks: [], sourceRevisions: [] });
    expect(synthesis.consensus).toMatchObject({ detected: false, ruleApplied: false, reason: "NO_EXPLICIT_CONSENSUS_RULE" });
  });

  it("73. never invents a statistical meta-analysis or editorial text", () => {
    const synthesis = createStructuredLiteratureSynthesis({});
    expect(synthesis.statisticalMetaAnalysisPerformed).toBe(false);
    expect(synthesis.generatedEditorialText).toBe(false);
  });

  it("74. generates a deterministic validated migration manifest", () => {
    const left = createKnowledgeGraphMigrationManifest({ root });
    const right = createKnowledgeGraphMigrationManifest({ root });
    expect(left.manifestDigest).toBe(right.manifestDigest);
    expect(left.status).toBe("VALIDATED_SAFE_WEB_MIGRATION_READY_FOR_SOURCED_ENRICHMENT");
  });

  it("75. keeps active, deferred and disabled relations collectively exhaustive", () => {
    expect(activeStructuralRelations.length + deferredHistoricalRelations.length + inactiveHistoricalRelations.length).toBe(93);
  });

  it("76. writes the P3M-Web report without replacing P3", () => {
    const reportPath = join(root, "docs/p3m-web-migration-report.md");
    expect(existsSync(reportPath)).toBe(true);
    const report = readFileSync(reportPath, "utf8");
    expect(report).toContain("Le rapport destructif P3 existant reste valable");
    expect(report.trim().endsWith("SCIENTIFIC KNOWLEDGE GRAPH MIGRÉ ET VALIDÉ — PASSER À L’ENRICHISSEMENT SOURCÉ")).toBe(true);
  });

  it("77. leaves public pages and components unchanged", () => {
    const changed = execFileSync("git", ["diff", "--name-only", "--", "src/pages", "src/components"], { cwd: root, encoding: "utf8" });
    expect(changed.trim()).toBe("");
  });

  it("78. leaves routes, SEO, sitemap and robots unchanged", () => {
    const changed = execFileSync("git", ["diff", "--name-only", "--", "src/App.tsx", "index.html", "public/sitemap.xml", "public/robots.txt"], { cwd: root, encoding: "utf8" });
    expect(changed.trim()).toBe("");
  });

  it("79. does not import product, PACS, viewer, SaaS, Auth or Stripe modules", () => {
    const files = execFileSync("rg", ["--files", "src/knowledge-graph"], { cwd: root, encoding: "utf8" }).trim().split("\n");
    const source = files.filter((file) => file.endsWith(".mjs")).map((file) => readFileSync(join(root, file), "utf8")).join("\n");
    const importSpecifiers = [...source.matchAll(/from\s+["']([^"']+)["']/gu)].map((match) => match[1]);
    const forbiddenImports = importSpecifiers.filter((specifier) => /(?:^|[\/_-])(?:supabase|stripe|pacs|viewer|auth)(?:[\/_.-]|$)/iu.test(specifier));
    expect(forbiddenImports).toEqual([]);
  });

  it("80. leaves editorial-engine clean", () => {
    const editorialEngine = "/Users/charles/Documents/Projets/editorial-engine";
    if (!existsSync(editorialEngine)) return;
    const status = execFileSync("git", ["status", "--porcelain"], { cwd: editorialEngine, encoding: "utf8" });
    expect(status.trim()).toBe("");
  });

  it("81. creates no commit during migration", () => {
    const currentHead = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
    expect(currentHead).toBe(sourceSnapshot.data.gitSha);
  });

  it("82. keeps git diff free of whitespace errors", () => {
    expect(() => execFileSync("git", ["diff", "--check"], { cwd: root, encoding: "utf8" })).not.toThrow();
  });

  it("83. keeps the real migrated scientific registries free of fixtures", () => {
    expect(scientificAssertionRevisions).toEqual([]);
    expect(scientificEvidenceLinks).toEqual([]);
    expect(sourceRevisions.some((source) => source.stableId.startsWith("synthetic:"))).toBe(false);
  });

  it("84. declares every competency fixture documentary and non-executable", () => {
    expect(competencyCases.every((item) => item.fixturePolicy === "SYNTHETIC_REPRESENTABILITY_FIXTURE_ONLY" && item.executableProductBehavior === false)).toBe(true);
  });

  it("85. keeps schema readiness distinct from public content readiness", () => {
    const result = validateProjectionReadiness();
    expect(result.projectionReady).toBe(true);
    expect(result.publicScientificContentReady).toBe(false);
    expect(result.projections.seo.requiresEditorialApproval).toBe(true);
  });

  it("86. preserves unknown publication values as null", () => {
    const unknown = publicationVersions.find((publication) => publication.doi === null || publication.pmid === null || publication.authors === null);
    expect(unknown).toBeDefined();
    expect([unknown.doi, unknown.pmid, unknown.authors]).toContain(null);
  });

  it("87. never calls empty evidence and limitation arrays complete", () => {
    for (const profile of biomarkerProfileMigrations) {
      if (profile.historicalProfile.evidenceIds.length === 0) expect(profile.gaps).toContain("NO_EVIDENCE_LINK");
      if (profile.historicalProfile.limitations.length === 0) expect(profile.gaps).toContain("LIMITATIONS_NOT_DOCUMENTED");
    }
  });

  it("88. contains no operational contracts in the web model", () => {
    const forbidden = ["InstalledEquipment", "HardwareConfiguration", "License", "FallbackRule", "ExceptionRule", "WorkflowTransition", "WorkflowRole", "AcceptanceCriterion", "QualityControlRule", "StudyArm", "DatasetSplit", "ConsentProfile", "ModelVersion", "EvaluationResult"];
    expect(forbidden.filter((name) => scientificModelContracts[name])).toEqual([]);
  });

  it("89. keeps repository migration counts exact", () => {
    expect({ entities: entities.length, relations: relations.length, publications: historicalPublications.length, biomarkers: biomarkerProfileMigrations.length }).toEqual({ entities: 118, relations: 93, publications: 9, biomarkers: 13 });
  });
});
