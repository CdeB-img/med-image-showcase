import { entities, relations } from "./catalog.mjs";
import { competencyCases, validateCompetencyModel } from "./competency-cases.mjs";
import { evaluateEntityCompleteness, familyCompletenessProfiles } from "./completeness-profiles.mjs";
import { validateFormalRelations } from "./formal-relations.mjs";
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
  historicalSources,
  inactiveHistoricalRelations,
  publicationVersions,
  publicationWorks,
  relationMigrationEntries,
  scientificAssertionIdentities,
  scientificAssertionRevisions,
  scientificEvidenceLinks,
  sourceIdentities,
  sourceRevisions,
  sourceSnapshot,
} from "./migration/migrated-knowledge.mjs";
import { sha256Digest } from "./migration/stable-json.mjs";
import { resolveRelationId } from "./migration/relation-id-resolver.mjs";
import { scientificModelContracts } from "./scientific-model-factories.mjs";
import { validateContractRecord, validateScientificAssertionRevisions, validateSourceModel, validateVersionedRecords } from "./scientific-model-validate.mjs";
import { createStructuredLiteratureSynthesis } from "./structured-synthesis.mjs";
import { validateKnowledgeGraph } from "./validate.mjs";
import {
  scientificAssertionIdentities as corpusAssertionIdentities,
  scientificAssertionRevisions as corpusAssertionRevisions,
  scientificEvidenceLinks as corpusEvidenceLinks,
} from "./scientific-corpus/assertions.mjs";
import {
  scientificCorpusConceptDesignations,
  scientificCorpusConceptIdentities,
  scientificCorpusEntityRevisions,
} from "./scientific-corpus/concepts.mjs";
import { internalScientificProjections } from "./scientific-corpus/projections.mjs";
import {
  scientificSourceIdentities as corpusSourceIdentities,
  scientificSourceRevisions as corpusSourceRevisions,
} from "./scientific-corpus/sources.mjs";
import { validateScientificCorpus } from "./scientific-corpus/validate.mjs";

const classificationValues = new Set(["STRUCTURAL_SAFE", "SCIENTIFIC_CANDIDATE", "EVIDENCE_MENTION", "WORKFLOW_AMBIGUOUS", "SEMANTICALLY_INCORRECT", "UNRESOLVED"]);

export const validateKnowledgeGraphStructure = ({ root = process.cwd() } = {}) => {
  const legacy = validateKnowledgeGraph({ root });
  const versioning = validateVersionedRecords({ identities: conceptIdentities, revisions: entityRevisions });
  const publicationVersioning = validateVersionedRecords({ identities: publicationWorks, revisions: publicationVersions, identityType: "PublicationWork", revisionType: "PublicationVersion" });
  const designationErrors = conceptDesignations.flatMap((designation) => validateContractRecord(designation, "ConceptDesignation").errors);
  const corpusVersioning = validateVersionedRecords({ identities: scientificCorpusConceptIdentities, revisions: scientificCorpusEntityRevisions });
  const corpusDesignationErrors = scientificCorpusConceptDesignations.flatMap((designation) => validateContractRecord(designation, "ConceptDesignation").errors);
  const errors = [...legacy.errors, ...versioning.errors, ...publicationVersioning.errors, ...designationErrors, ...corpusVersioning.errors, ...corpusDesignationErrors];
  if (new Set(conceptIdentities.map((identity) => identity.stableId)).size !== conceptIdentities.length) errors.push({ code: "DUPLICATE_CONCEPT_IDENTITY" });
  if (new Set(conceptDesignations.map((designation) => designation.designationId)).size !== conceptDesignations.length) errors.push({ code: "DUPLICATE_DESIGNATION_ID" });
  return {
    structureValid: errors.length === 0,
    errors,
    warnings: legacy.warnings,
    counts: { historicalEntities: entities.length, historicalRelations: relations.length, conceptIdentities: conceptIdentities.length, entityRevisions: entityRevisions.length, designations: conceptDesignations.length, corpusConceptIdentities: scientificCorpusConceptIdentities.length, corpusEntityRevisions: scientificCorpusEntityRevisions.length, corpusDesignations: scientificCorpusConceptDesignations.length },
  };
};

export const validateKnowledgeGraphSemantics = () => {
  const formal = validateFormalRelations({ relations: activeStructuralRelations, entities });
  const errors = [...formal.errors];
  const warnings = [...formal.warnings];
  for (const migration of relationMigrationEntries) {
    if (!classificationValues.has(migration.category)) errors.push({ code: "UNKNOWN_RELATION_CLASSIFICATION", oldId: migration.oldId, category: migration.category });
    if (migration.assertionCreated) errors.push({ code: "AUTOMATIC_ASSERTION_FORBIDDEN", oldId: migration.oldId });
  }
  const anatomicallyFalse = relationMigrationEntries.find((entry) => entry.sourceEntityId.endsWith(":region:thoracic") && entry.targetEntityId.endsWith(":organ:lung") && entry.relationType === "PART_OF");
  if (!anatomicallyFalse || anatomicallyFalse.active || anatomicallyFalse.category !== "SEMANTICALLY_INCORRECT") errors.push({ code: "THORAX_LUNG_RELATION_NOT_DISABLED" });
  const dicomReduction = relationMigrationEntries.find((entry) => entry.relationType === "COMPATIBLE_WITH" && entry.sourceEntityId.endsWith(":format:dicom") && entry.targetEntityId.endsWith(":standard:dicom"));
  if (!dicomReduction || dicomReduction.active) errors.push({ code: "DICOM_REDUCTION_NOT_DISABLED" });
  if (activeStructuralRelations.some((relation) => !relation)) errors.push({ code: "ACTIVE_RELATION_NOT_RESOLVED" });
  return {
    semanticsValid: errors.length === 0,
    errors,
    warnings,
    counts: {
      classified: relationMigrationEntries.length,
      activeStructural: activeStructuralRelations.length,
      deferred: deferredHistoricalRelations.length,
      disabled: inactiveHistoricalRelations.length,
      categories: Object.fromEntries([...classificationValues].map((category) => [category, relationMigrationEntries.filter((entry) => entry.category === category).length])),
    },
  };
};

export const validateScientificAssertions = () => {
  const validation = validateScientificAssertionRevisions({
    assertionIdentities: corpusAssertionIdentities,
    assertionRevisions: corpusAssertionRevisions,
    evidenceLinks: corpusEvidenceLinks,
    sourceRevisions: corpusSourceRevisions,
  });
  return {
    scientificValid: validation.valid,
    errors: validation.errors,
    warnings: [...validation.warnings, { code: "SCIENTIFIC_HUMAN_REVIEW_PENDING", reason: "P4 assertions are source-localized and structurally reviewed, but none is automatically declared VERIFIED." }],
    contradictions: validation.contradictions,
    counts: validation.counts,
  };
};

export const validateScientificProvenance = () => {
  const validation = validateSourceModel({ sourceIdentities: [...sourceIdentities, ...corpusSourceIdentities], sourceRevisions: [...sourceRevisions, ...corpusSourceRevisions] });
  return {
    provenanceValid: validation.valid,
    errors: validation.errors,
    warnings: [{ code: "BIBLIOGRAPHIC_UNKNOWN_VALUES_PRESERVED", reason: "Null or explicitly incomplete bibliographic fields remain visible; abbreviated author citations are not represented as complete lists." }],
    completeness: validation.completeness,
    counts: validation.counts,
  };
};

export const validateFamilyCompleteness = () => {
  const assessments = entities.map((entity) => ({
    entityId: entity.entityId,
    entityType: entity.entityType,
    CATALOG: evaluateEntityCompleteness({ entity, usage: "CATALOG" }),
    SCIENTIFIC: evaluateEntityCompleteness({ entity, usage: "SCIENTIFIC" }),
    COMPARISON: evaluateEntityCompleteness({ entity, usage: "COMPARISON" }),
    GLOSSARY: evaluateEntityCompleteness({ entity, usage: "GLOSSARY", relationCapabilities: ["CONCEPT_DESIGNATION"] }),
    SEO: evaluateEntityCompleteness({ entity, usage: "SEO" }),
  }));
  const errors = assessments.filter((assessment) => assessment.CATALOG.state === "INSUFFICIENT").map((assessment) => ({ code: "CATALOG_INSUFFICIENT", entityId: assessment.entityId }));
  const familySummary = Object.fromEntries(Object.keys(familyCompletenessProfiles).map((family) => {
    const familyAssessments = assessments.filter((assessment) => assessment.entityType === family);
    return [family, {
      entityCount: familyAssessments.length,
      catalogComplete: familyAssessments.filter((assessment) => assessment.CATALOG.state === "COMPLETE").length,
      scientificComplete: familyAssessments.filter((assessment) => assessment.SCIENTIFIC.state === "COMPLETE").length,
      comparisonComplete: familyAssessments.filter((assessment) => assessment.COMPARISON.state === "COMPLETE").length,
      state: familyAssessments.length === 0 ? "EMPTY" : familyAssessments.every((assessment) => assessment.CATALOG.state === "COMPLETE") ? "CATALOG_READY" : "PARTIAL",
    }];
  }));
  return {
    coverageValid: errors.length === 0,
    errors,
    warnings: assessments.filter((assessment) => assessment.SCIENTIFIC.state !== "COMPLETE").map((assessment) => ({ code: "SCIENTIFIC_ENRICHMENT_REQUIRED", entityId: assessment.entityId })),
    assessments,
    familySummary,
  };
};

export const validateCompetencyCases = () => {
  const validation = validateCompetencyModel(competencyCases);
  const corpus = validateScientificCorpus({ inspectGit: false });
  const corpusErrors = corpus.layers.queryAndSynthesis.errors;
  const resolvedByP4 = new Set([
    "ecv-publication-query-3t",
    "ct-ecv-publication-query",
    "molli-sasha-comparison",
    "corrected-publication-history",
    "controversy-two-publications",
    "quantitative-biomarker-fact-sheet",
  ]);
  const p4Results = corpus.layers.queryAndSynthesis.queryResults;
  return {
    ...validation,
    competencyValid: validation.valid && corpusErrors.length === 0,
    errors: [...validation.results.filter((result) => !result.modelRepresentable), ...corpusErrors],
    warnings: validation.results.filter((result) => !result.dataPresent && !resolvedByP4.has(result.caseId)).map((result) => ({ code: "COMPETENCY_DATA_GAP", caseId: result.caseId, gaps: result.gaps })),
    corpusQueries: corpus.layers.queryAndSynthesis.counts,
    p4Competency: {
      ecv3T: p4Results.ecv3T.dataPresent,
      ctEcv: p4Results.ecvCt.dataPresent,
      molliSasha: p4Results.molliSasha.dataPresent,
      correctedPublicationHistory: { assertionPresent: corpusAssertionRevisions.some((assertion) => assertion.predicate === "CORRECTS") },
      contradiction: { preserved: p4Results.contradictions.contradictions.length > 0 },
      quantitativeModel: { sourcedRecords: scientificModelContracts.DerivedMeasurement ? 3 : 0, thresholdsInvented: false },
      humanVerifiedAssertions: corpusAssertionRevisions.filter((assertion) => assertion.reviewState === "VERIFIED" && assertion.humanReviewed).length,
    },
  };
};

export const validateMigrationIntegrity = () => {
  const errors = [];
  if (historicalEntities.length !== 118 || conceptIdentities.length !== 118 || entityRevisions.length !== 118 || entityMigrationEntries.length !== 118) errors.push({ code: "ENTITY_COUNT_MISMATCH" });
  if (historicalRelations.length !== 93 || relationMigrationEntries.length !== 93) errors.push({ code: "RELATION_COUNT_MISMATCH" });
  if (historicalPublications.length !== 9 || publicationWorks.length !== 9 || publicationVersions.length !== 9) errors.push({ code: "PUBLICATION_COUNT_MISMATCH" });
  if (biomarkerProfileMigrations.length !== 13) errors.push({ code: "BIOMARKER_PROFILE_COUNT_MISMATCH" });
  if (historicalSources.length !== 24) errors.push({ code: "SOURCE_COUNT_MISMATCH" });
  const historicalEntityIds = new Set(historicalEntities.map((entity) => entity.entityId));
  if (conceptIdentities.some((identity) => !historicalEntityIds.has(identity.stableId))) errors.push({ code: "ENTITY_IDENTITY_NOT_PRESERVED" });
  for (const entry of entityMigrationEntries) if (entry.historicalDigest !== entry.migratedPayloadDigest) errors.push({ code: "ENTITY_PAYLOAD_DRIFT", oldId: entry.oldId });
  for (const entry of relationMigrationEntries) if (!entry.newId || resolveRelationId(entry.oldId) !== entry.newId) errors.push({ code: "LEGACY_RELATION_NOT_RESOLVABLE", oldId: entry.oldId });
  if (new Set(relationMigrationEntries.map((entry) => entry.newId)).size !== 93) errors.push({ code: "MIGRATED_RELATION_ID_COLLISION" });
  if (relationMigrationEntries.some((entry) => entry.assertionCreated)) errors.push({ code: "UNSOURCED_ASSERTION_CREATED" });
  if (biomarkerProfileMigrations.some((profile) => profile.emptyArraysTreatedAsComplete || profile.scientificAssertionCreated)) errors.push({ code: "FALSE_BIOMARKER_COMPLETENESS" });
  const afterMaterial = {
    conceptIdentityIds: conceptIdentities.map((identity) => identity.stableId),
    entityRevisionIds: entityRevisions.map((revision) => revision.revisionId),
    relationMigrationIds: relationMigrationEntries.map((entry) => [entry.oldId, entry.newId, entry.category, entry.active]),
    publicationVersionIds: publicationVersions.map((version) => version.revisionId),
    biomarkerIds: biomarkerProfileMigrations.map((profile) => profile.biomarkerId),
  };
  return {
    migrationIntegrityValid: errors.length === 0,
    errors,
    warnings: [{ code: "LEGACY_REGISTRIES_RETAINED", reason: "The source snapshot and original registries remain readable for rollback." }],
    digests: { before: sourceSnapshot.digests.contract, after: sha256Digest(afterMaterial) },
    counts: { entities: conceptIdentities.length, relations: relationMigrationEntries.length, publications: publicationVersions.length, biomarkerProfiles: biomarkerProfileMigrations.length },
  };
};

export const validateProjectionReadiness = () => {
  const requiredWebContracts = ["ConceptIdentity", "EntityRevision", "ScientificAssertionRevision", "SourceRevision", "EvidenceLink", "ApplicabilityContext", "ConceptDesignation", "MeasurementDefinition", "ProtocolConcept", "EquipmentModel", "WorkflowConcept", "Study", "Dataset", "Algorithm"];
  const missingContracts = requiredWebContracts.filter((contractName) => !scientificModelContracts[contractName]);
  const synthesis = createStructuredLiteratureSynthesis({ query: {}, assertionRevisions: corpusAssertionRevisions, evidenceLinks: corpusEvidenceLinks, sourceRevisions: corpusSourceRevisions });
  const schemaReady = missingContracts.length === 0 && synthesis.generatedEditorialText === false && synthesis.statisticalMetaAnalysisPerformed === false;
  const internalDataReady = corpusAssertionRevisions.length > 0 && corpusEvidenceLinks.length > 0 && internalScientificProjections.length > 0;
  return {
    projectionReady: schemaReady,
    internalScientificCorpusReady: internalDataReady,
    publicScientificContentReady: false,
    errors: missingContracts.map((contractName) => ({ code: "MISSING_WEB_PROJECTION_CONTRACT", contractName })),
    warnings: [{ code: "PUBLIC_PROJECTION_BLOCKED_PENDING_HUMAN_REVIEW", reason: "The sourced internal corpus is ready, but no scientific human review or editorial approval has occurred." }],
    projections: {
      editorialPages: { schemaReady, dataReady: false },
      literatureSyntheses: { schemaReady, dataReady: internalDataReady, internalOnly: true },
      technicalFactSheets: { schemaReady, dataReady: internalDataReady, internalOnly: true },
      comparisons: { schemaReady, dataReady: internalDataReady, internalOnly: true },
      glossary: { schemaReady, dataReady: conceptDesignations.length > 0 },
      navigation: { schemaReady, dataReady: activeStructuralRelations.length > 0 },
      seo: { schemaReady, dataReady: false, requiresEditorialApproval: true },
      knowledgeState: { schemaReady, dataReady: internalDataReady, internalOnly: true },
    },
  };
};

export const validateScientificKnowledgeGraph = ({ root = process.cwd() } = {}) => {
  const structure = validateKnowledgeGraphStructure({ root });
  const semantics = validateKnowledgeGraphSemantics();
  const scientific = validateScientificAssertions();
  const provenance = validateScientificProvenance();
  const coverage = validateFamilyCompleteness();
  const competency = validateCompetencyCases();
  const migration = validateMigrationIntegrity();
  const projection = validateProjectionReadiness();
  return {
    graphVersion: "2.1.0-web-p4-ecv-t1",
    perimeter: "NOXIA_PUBLIC_WEBSITE_SCIENTIFIC_DOCUMENTARY_KNOWLEDGE",
    structureValid: structure.structureValid,
    semanticsValid: semantics.semanticsValid,
    scientificValid: scientific.scientificValid,
    provenanceValid: provenance.provenanceValid,
    coverageValid: coverage.coverageValid,
    competencyValid: competency.competencyValid,
    migrationIntegrityValid: migration.migrationIntegrityValid,
    projectionReady: projection.projectionReady,
    publicScientificContentReady: projection.publicScientificContentReady,
    internalScientificCorpusReady: projection.internalScientificCorpusReady,
    layers: { structure, semantics, scientific, provenance, coverage, competency, migration, projection },
  };
};
