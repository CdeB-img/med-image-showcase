import { entities as currentEntities, relations as currentRelations } from "../catalog.mjs";
import { evaluateEntityCompleteness } from "../completeness-profiles.mjs";
import {
  createConceptIdentity,
  createContractRecord,
  createDeterministicId,
  createEntityRevision,
  createPublicationVersion,
  createPublicationWork,
  createSourceIdentity,
  createSourceRevision,
} from "../scientific-model-factories.mjs";
import { sha256Digest } from "./stable-json.mjs";
import snapshot from "./snapshots/knowledge-graph-v1.0.0-before-migration.json" with { type: "json" };
import relationIdMigrations from "./relation-id-migrations.json" with { type: "json" };

const sorted = (values, key) => [...values].sort((left, right) => String(left[key]).localeCompare(String(right[key])));

export const sourceSnapshot = Object.freeze(snapshot);
export const historicalEntities = Object.freeze(snapshot.data.entities);
export const historicalRelations = Object.freeze(snapshot.data.relations);
export const historicalSources = Object.freeze(snapshot.data.sources);
export const historicalPublications = Object.freeze(snapshot.data.publications);
export const historicalBiomarkerProfiles = Object.freeze(snapshot.data.biomarkerProfiles);

const mapEntityStatus = (status) => ({ active: "ACTIVE", unresolved_reference: "DRAFT", deprecated: "OBSOLETE", obsolete: "OBSOLETE" })[status] ?? "DRAFT";
const completenessFor = (entity) => Object.freeze({
  CATALOG: evaluateEntityCompleteness({ entity, usage: "CATALOG" }),
  SCIENTIFIC: evaluateEntityCompleteness({ entity, usage: "SCIENTIFIC" }),
  COMPARISON: evaluateEntityCompleteness({ entity, usage: "COMPARISON" }),
  SEO: evaluateEntityCompleteness({ entity, usage: "SEO" }),
});

export const conceptIdentities = Object.freeze(sorted(historicalEntities.map((entity) => createConceptIdentity({
  stableId: entity.entityId,
  entityType: entity.entityType,
  sourceRefs: entity.sourceRefs,
})), "stableId"));

export const entityRevisions = Object.freeze(sorted(historicalEntities.map((entity) => {
  const propertyNulls = Object.entries(entity.properties ?? {}).filter(([, value]) => value === null).map(([field]) => `properties.${field}`);
  return createEntityRevision({
    stableId: entity.entityId,
    revisionId: `${entity.entityId}:revision:1`,
    status: mapEntityStatus(entity.status),
    payload: entity,
    unresolvedFields: [...propertyNulls, "scientificValidation"],
    completeness: completenessFor(entity),
    sourceRefs: entity.sourceRefs,
  });
}), "revisionId"));

export const entityMigrationEntries = Object.freeze(sorted(historicalEntities.map((entity) => ({
  oldId: entity.entityId,
  stableId: entity.entityId,
  revisionId: `${entity.entityId}:revision:1`,
  identityPreserved: true,
  historicalDigest: sha256Digest(entity),
  migratedPayloadDigest: sha256Digest(entity),
  status: "MIGRATED_WITH_UNKNOWN_VALUES_PRESERVED",
})), "oldId"));

const designationTypeForPreferred = (entity) => entity.entityType === "Abbreviation" ? "ABBREVIATION" : entity.entityType === "Synonym" ? "SYNONYM" : "PREFERRED";
export const conceptDesignations = Object.freeze(sorted(historicalEntities.flatMap((entity) => [
  createContractRecord("ConceptDesignation", {
    designationId: createDeterministicId("noxia:radiology:designation", { entityId: entity.entityId, value: entity.preferredLabel, designationType: designationTypeForPreferred(entity), preferred: true }),
    entityId: entity.entityId,
    value: entity.preferredLabel,
    language: null,
    locale: null,
    designationType: designationTypeForPreferred(entity),
    preferred: true,
    context: null,
    sourceRef: entity.sourceRefs[0],
    validFrom: null,
    validUntil: null,
    status: "ACTIVE",
  }),
  ...(entity.aliases ?? []).map((alias) => createContractRecord("ConceptDesignation", {
    designationId: createDeterministicId("noxia:radiology:designation", { entityId: entity.entityId, value: alias, designationType: "SYNONYM", preferred: false }),
    entityId: entity.entityId,
    value: alias,
    language: null,
    locale: null,
    designationType: "SYNONYM",
    preferred: false,
    context: null,
    sourceRef: entity.sourceRefs[0],
    validFrom: null,
    validUntil: null,
    status: "ACTIVE",
  })),
]), "designationId"));

const repositorySourceType = () => "REPOSITORY_PAGE";
const repositorySourceIdentities = historicalSources.map((source) => createSourceIdentity({ stableId: source.sourceId, sourceType: repositorySourceType() }));
const repositorySourceRevisions = historicalSources.map((source) => createSourceRevision({
  stableId: source.sourceId,
  revisionId: `${source.sourceId}:revision:1`,
  sourceType: repositorySourceType(),
  title: source.label,
  repositoryPath: source.path,
  version: source.version,
  digest: sha256Digest(source),
  status: "ACTIVE",
  sourceRefs: [source.sourceId],
  metadata: { historicalKind: source.kind },
}));

const publicationSourceId = (publication) => `source:publication:${publication.entityId.split(":").at(-1)}`;
const publicationSourceIdentities = historicalPublications.map((publication) => createSourceIdentity({ stableId: publicationSourceId(publication), sourceType: "SCIENTIFIC_PUBLICATION" }));
const publicationSourceRevisions = historicalPublications.map((publication) => createSourceRevision({
  stableId: publicationSourceId(publication),
  revisionId: `${publicationSourceId(publication)}:revision:1`,
  sourceType: "SCIENTIFIC_PUBLICATION",
  title: publication.preferredLabel,
  authority: publication.properties?.journal ?? null,
  authors: publication.properties?.authors ?? null,
  publicationDate: publication.properties?.year === null || publication.properties?.year === undefined ? null : String(publication.properties.year),
  version: null,
  doi: publication.properties?.doi ?? null,
  pmid: publication.properties?.pmid ?? null,
  repositoryPath: "src/pages/ReferencesPublications.tsx",
  locator: publication.preferredLabel,
  digest: sha256Digest(publication),
  language: null,
  status: "ACTIVE",
  sourceRefs: publication.sourceRefs,
  metadata: { publicationEntityId: publication.entityId },
}));

export const sourceIdentities = Object.freeze(sorted([...repositorySourceIdentities, ...publicationSourceIdentities], "stableId"));
export const sourceRevisions = Object.freeze(sorted([...repositorySourceRevisions, ...publicationSourceRevisions], "revisionId"));

export const publicationWorks = Object.freeze(sorted(historicalPublications.map((publication) => createPublicationWork({
  stableId: publication.entityId,
  title: publication.preferredLabel,
  sourceRefs: publication.sourceRefs,
  workType: publication.properties?.publicationType ?? null,
})), "stableId"));

export const publicationVersions = Object.freeze(sorted(historicalPublications.map((publication) => createPublicationVersion({
  stableId: publication.entityId,
  revisionId: `${publication.entityId}:version:1`,
  title: publication.preferredLabel,
  doi: publication.properties?.doi ?? null,
  pmid: publication.properties?.pmid ?? null,
  authors: publication.properties?.authors ?? null,
  journal: publication.properties?.journal ?? null,
  year: publication.properties?.year ?? null,
  publicationType: publication.properties?.publicationType ?? null,
  documentStatus: "CURRENT",
  sourceRefs: publication.sourceRefs,
})), "revisionId"));

export const publicationCorrectionAudit = Object.freeze({
  candidateId: "candidate:publication-correction:pone-0167668:pone-0161855",
  correctionPublicationId: "noxia:radiology:publication:pone-0167668",
  possibleOriginalPublicationId: "noxia:radiology:publication:pone-0161855",
  evidence: "Titles and distinct DOI values are present in the repository registry, but no explicit repository relation identifies the corrected work.",
  decision: "CANDIDATE_NOT_APPLIED",
  evidenceLinkCreated: false,
  reason: "CORRECTS requires an explicit source locator demonstrating both document identities.",
});

const entityById = new Map(currentEntities.map((entity) => [entity.entityId, entity]));
const currentByLegacyId = new Map(currentRelations.flatMap((relation) => relation.legacyRelationIds.map((legacyId) => [legacyId, relation])));
const idMigrationByOldId = new Map(relationIdMigrations.entries.map((entry) => [entry.oldId, entry]));

const classifyRelation = (relation) => {
  const sourceFamily = entityById.get(relation.sourceId)?.entityType;
  const targetFamily = entityById.get(relation.targetId)?.entityType;
  if (relation.relationType === "PART_OF" && sourceFamily === "Region" && targetFamily === "Organ" && relation.sourceId.endsWith(":thoracic") && relation.targetId.endsWith(":lung")) return {
    category: "SEMANTICALLY_INCORRECT",
    decision: "DISABLED_FROM_ACTIVE_PROJECTION",
    justification: "A thoracic region is not a component of the lung; the historical statement is retained for audit and requires a sourced anatomical remodel.",
    migrationApplied: true,
    active: false,
  };
  if (relation.relationType === "COMPATIBLE_WITH" && sourceFamily === "Format" && targetFamily === "Standard") return {
    category: "SEMANTICALLY_INCORRECT",
    decision: "REPLACED_BY_UNPOPULATED_STANDARD_CONTRACT",
    justification: "DICOM cannot be reduced to a format-to-standard compatibility edge; the old edge is preserved but excluded from the active projection.",
    migrationApplied: true,
    active: false,
  };
  if ((relation.relationType === "USES" && sourceFamily === "Workflow" && targetFamily === "Workflow") || (relation.relationType === "IMPLEMENTED_BY" && sourceFamily === "Pipeline" && targetFamily === "Workflow")) return {
    category: "WORKFLOW_AMBIGUOUS",
    decision: "DEFERRED_FOR_WORKFLOW_ORDERING_REVIEW",
    justification: "The historical edge may encode ordering or implementation; WorkflowStep and WorkflowTransition semantics cannot be inferred safely.",
    migrationApplied: false,
    active: false,
  };
  if (relation.relationType === "DOCUMENTS" || (relation.relationType === "APPLIES_TO" && sourceFamily === "Publication") || (relation.relationType === "REFERENCES" && ["Publication", "Guideline", "Recommendation"].includes(sourceFamily))) return {
    category: "EVIDENCE_MENTION",
    decision: "PRESERVED_AS_MENTION_CANDIDATE_WITHOUT_EVIDENCE_LINK",
    justification: "The repository establishes a documentary mention only; no assertion revision exists to receive an EvidenceLink.",
    migrationApplied: false,
    active: false,
  };
  if (["APPLIES_TO", "MEASURES", "DERIVED_FROM", "PRODUCES"].includes(relation.relationType)) return {
    category: "SCIENTIFIC_CANDIDATE",
    decision: "DEFERRED_PENDING_SOURCE_LEVEL_ASSERTION_REVIEW",
    justification: "The edge may contain scientific meaning but lacks a reviewed assertion, context and evidence locator.",
    migrationApplied: false,
    active: false,
  };
  if (relation.relationType === "SUPPORTS") return {
    category: sourceFamily === "Study" ? "EVIDENCE_MENTION" : "UNRESOLVED",
    decision: sourceFamily === "Study" ? "PRESERVED_AS_MENTION_CANDIDATE_WITHOUT_EVIDENCE_LINK" : "DEFERRED_OVERLOADED_SUPPORTS_SEMANTICS",
    justification: "SUPPORTS is overloaded in the historical graph and cannot be treated as scientific support without a source-to-assertion EvidenceLink.",
    migrationApplied: false,
    active: false,
  };
  if (relation.relationType === "IMPLEMENTED_BY" && sourceFamily === "CoreLab") return {
    category: "UNRESOLVED",
    decision: "DEFERRED_PENDING_WORKFLOW_VERSION",
    justification: "The implementation target must be attached to a versioned workflow, not inferred from a concept-level edge.",
    migrationApplied: false,
    active: false,
  };
  if (["PART_OF", "IS_A", "HAS_FEATURE", "HAS_VERSION", "RELATED_TO"].includes(relation.relationType) || (relation.relationType === "REFERENCES" && ["Terminology", "Synonym", "Abbreviation", "Definition"].includes(sourceFamily)) || (relation.relationType === "USES" && !(sourceFamily === "Workflow" && targetFamily === "Workflow")) || (relation.relationType === "IMPLEMENTED_BY" && sourceFamily === "ResearchProject")) return {
    category: "STRUCTURAL_SAFE",
    decision: "MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION",
    justification: "The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references.",
    migrationApplied: true,
    active: true,
  };
  return {
    category: "UNRESOLVED",
    decision: "DEFERRED_WITHOUT_SEMANTIC_PROMOTION",
    justification: "No deterministic non-scientific migration rule applies.",
    migrationApplied: false,
    active: false,
  };
};

export const relationMigrationEntries = Object.freeze(sorted(historicalRelations.map((historicalRelation) => {
  const current = currentByLegacyId.get(historicalRelation.relationId);
  const identityMigration = idMigrationByOldId.get(historicalRelation.relationId);
  const classification = classifyRelation(historicalRelation);
  return Object.freeze({
    oldId: historicalRelation.relationId,
    newId: current?.relationId ?? identityMigration?.newId ?? null,
    relationType: historicalRelation.relationType,
    sourceEntityId: historicalRelation.sourceId,
    targetEntityId: historicalRelation.targetId,
    sourceRefs: historicalRelation.sourceRefs,
    category: classification.category,
    decision: classification.decision,
    justification: classification.justification,
    migrationApplied: classification.migrationApplied,
    active: classification.active,
    assertionCreated: false,
    historicalDigest: sha256Digest(historicalRelation),
    migratedIdentityDigest: current?.relationIdentityDigest ?? identityMigration?.digest ?? null,
    historicalRecord: historicalRelation,
  });
}), "oldId"));

export const activeStructuralRelations = Object.freeze(relationMigrationEntries.filter((entry) => entry.active).map((entry) => currentRelations.find((relation) => relation.relationId === entry.newId)));
export const inactiveHistoricalRelations = Object.freeze(relationMigrationEntries.filter((entry) => entry.category === "SEMANTICALLY_INCORRECT"));
export const deferredHistoricalRelations = Object.freeze(relationMigrationEntries.filter((entry) => !entry.active && entry.category !== "SEMANTICALLY_INCORRECT"));
export const relationAmbiguities = Object.freeze(relationMigrationEntries.filter((entry) => ["WORKFLOW_AMBIGUOUS", "UNRESOLVED"].includes(entry.category)));

const biomarkerById = new Map(historicalEntities.filter((entity) => entity.entityType === "Biomarker").map((entity) => [entity.entityId, entity]));
export const biomarkerProfileMigrations = Object.freeze(sorted(Object.entries(historicalBiomarkerProfiles).map(([biomarkerId, profile]) => {
  const entity = biomarkerById.get(biomarkerId);
  const candidateClassifications = new Set(["Biomarker"]);
  if (profile.measurementIds.length > 0) candidateClassifications.add("Measurement");
  if (/endpoint/iu.test(entity?.description ?? "")) candidateClassifications.add("Endpoint");
  if (/quantification/iu.test(entity?.preferredLabel ?? "")) candidateClassifications.add("Measurement");
  return Object.freeze({
    biomarkerId,
    historicalClassification: "Biomarker",
    proposedClassifications: [...candidateClassifications],
    appliedClassification: "Biomarker",
    classificationDecision: candidateClassifications.size === 1 ? "PRESERVED_FROM_HISTORICAL_REGISTRY" : "PRESERVED_PENDING_SCIENTIFIC_REVIEW",
    historicalProfile: profile,
    gaps: Object.freeze([
      ...(profile.evidenceIds.length === 0 ? ["NO_EVIDENCE_LINK"] : []),
      ...(profile.limitations.length === 0 ? ["LIMITATIONS_NOT_DOCUMENTED"] : []),
      ...(profile.interpretationStatus === "NOT_MODELED_FROM_CURRENT_SOURCE" ? ["INTERPRETATION_NOT_MODELED"] : []),
      "NO_VERIFIED_SCIENTIFIC_ASSERTION",
    ]),
    completeness: Object.freeze({ CATALOG: "COMPLETE", SCIENTIFIC: "INSUFFICIENT" }),
    scientificAssertionCreated: false,
    emptyArraysTreatedAsComplete: false,
  });
}), "biomarkerId"));

export const scientificAssertionIdentities = Object.freeze([]);
export const scientificAssertionRevisions = Object.freeze([]);
export const scientificEvidenceLinks = Object.freeze([]);

export const migratedKnowledgeGraph = Object.freeze({
  version: "2.0.0",
  migrationMode: "NON_DESTRUCTIVE_PARALLEL_PROJECTION",
  sourceSnapshotId: snapshot.snapshotId,
  conceptIdentities,
  entityRevisions,
  conceptDesignations,
  sourceIdentities,
  sourceRevisions,
  publicationWorks,
  publicationVersions,
  relationMigrationEntries,
  activeStructuralRelations,
  inactiveHistoricalRelations,
  deferredHistoricalRelations,
  biomarkerProfileMigrations,
  scientificAssertionIdentities,
  scientificAssertionRevisions,
  scientificEvidenceLinks,
});
