import { entityFamilies, relationDefinitions } from "./schema.mjs";

export const protocolShape = Object.freeze([
  "modalityIds",
  "orderedSequenceIds",
  "duration",
  "preparation",
  "indicationIds",
  "contraindicationIds",
  "measurementIds",
  "biomarkerIds",
  "diseaseIds",
  "publicationIds",
]);

export const biomarkerProfileShape = Object.freeze([
  "modalityIds",
  "sequenceIds",
  "measurementIds",
  "diseaseIds",
  "evidenceIds",
  "publicationIds",
  "limitations",
  "interpretationStatus",
]);

export const publicationShape = Object.freeze([
  "doi",
  "pmid",
  "authors",
  "journal",
  "year",
  "publicationType",
  "evidenceLevel",
]);

export const equipmentLineage = Object.freeze({
  manufacturer: "Manufacturer",
  equipment: "Equipment",
  generation: "EquipmentGeneration",
  softwareVersion: "SoftwareVersion",
  feature: "Feature",
  allowedRelations: ["PART_OF", "HAS_VERSION", "HAS_FEATURE", "COMPATIBLE_WITH", "INCOMPATIBLE_WITH"],
});

export const relationEndpointConstraints = Object.freeze({
  IS_A: { sourceFamilies: entityFamilies, targetFamilies: entityFamilies },
  PART_OF: { sourceFamilies: ["Organ", "Region", "Sequence", "Equipment", "EquipmentGeneration", "SoftwareVersion"], targetFamilies: ["BodySystem", "Organ", "SequenceFamily", "Manufacturer", "Equipment", "EquipmentGeneration"] },
  APPLIES_TO: { sourceFamilies: ["Modality", "Sequence", "Biomarker", "Publication", "Protocol", "Workflow"], targetFamilies: ["BodySystem", "Organ", "Region", "Disease", "ClinicalQuestion", "Modality"] },
  MEASURES: { sourceFamilies: ["Modality", "Sequence", "Pipeline", "Protocol", "Tool"], targetFamilies: ["Biomarker", "Measurement"] },
  USES: { sourceFamilies: ["Workflow", "Pipeline", "Viewer", "Protocol", "Sequence"], targetFamilies: ["Modality", "Sequence", "Workflow", "Pipeline", "Tool", "Format", "Standard", "Feature"] },
  SUPPORTS: { sourceFamilies: ["Workflow", "Viewer", "Tool", "Service", "Study", "CoreLab"], targetFamilies: ["Workflow", "Pipeline", "CoreLab", "ClinicalQuestion", "Feature"] },
  PRODUCES: { sourceFamilies: ["Workflow", "Pipeline", "Tool"], targetFamilies: ["Measurement", "Dataset", "Biomarker", "Format"] },
  DOCUMENTS: { sourceFamilies: ["Publication", "Guideline", "Recommendation", "Study"], targetFamilies: entityFamilies },
  IMPLEMENTED_BY: { sourceFamilies: ["Workflow", "Pipeline", "ResearchProject", "CoreLab", "Service"], targetFamilies: ["Workflow", "Pipeline", "Tool", "Viewer", "SoftwareVersion"] },
  HAS_FEATURE: { sourceFamilies: ["Viewer", "Tool", "Equipment", "SoftwareVersion"], targetFamilies: ["Feature"] },
  HAS_VERSION: { sourceFamilies: ["Equipment", "EquipmentGeneration", "Tool"], targetFamilies: ["SoftwareVersion", "EquipmentGeneration"] },
  REQUIRES: { sourceFamilies: ["Protocol", "Workflow", "Pipeline", "Service"], targetFamilies: entityFamilies },
  COMPATIBLE_WITH: { sourceFamilies: ["Format", "Equipment", "SoftwareVersion", "Tool", "Pipeline"], targetFamilies: ["Standard", "Format", "Equipment", "SoftwareVersion", "Tool", "Pipeline"] },
  INCOMPATIBLE_WITH: { sourceFamilies: ["Equipment", "SoftwareVersion", "Format", "Tool", "Pipeline"], targetFamilies: ["Equipment", "SoftwareVersion", "Format", "Tool", "Pipeline"] },
  DERIVED_FROM: { sourceFamilies: ["Measurement", "Dataset", "Biomarker", "Pipeline"], targetFamilies: ["Biomarker", "Measurement", "Dataset", "Format"] },
  SUPERSEDES: { sourceFamilies: entityFamilies, targetFamilies: entityFamilies },
  REFERENCES: { sourceFamilies: ["Publication", "Guideline", "Recommendation", "Terminology", "Synonym", "Abbreviation", "Definition"], targetFamilies: entityFamilies },
  RELATED_TO: { sourceFamilies: entityFamilies, targetFamilies: entityFamilies },
});

export const constraints = Object.freeze([
  {
    constraintId: "identity-immutable",
    description: "Every entityId is unique, namespaced and immutable within a graph version.",
    appliesTo: "Entity",
  },
  {
    constraintId: "known-entity-family",
    description: "Every entityType belongs to the canonical family taxonomy.",
    appliesTo: "Entity",
    allowedValues: entityFamilies,
  },
  {
    constraintId: "source-provenance",
    description: "Every entity and relation has at least one repository source reference.",
    appliesTo: "Entity|Relation",
  },
  {
    constraintId: "evidence-qualification",
    description: "Every entity and relation uses one canonical evidence status.",
    appliesTo: "Entity|Relation",
  },
  {
    constraintId: "relation-contract",
    description: "Every relation uses a typed, versioned relation definition and valid endpoint identities.",
    appliesTo: "Relation",
    allowedValues: Object.keys(relationDefinitions),
  },
  {
    constraintId: "relation-endpoint-families",
    description: "Every relation endpoint matches the canonical source and target family constraints for its relation type.",
    appliesTo: "Relation",
    model: relationEndpointConstraints,
  },
  {
    constraintId: "relation-cardinality",
    description: "Relation cardinality is evaluated for each source-family to target-family pair; IS_A and PART_OF have no global N:1 assumption.",
    appliesTo: "Relation",
  },
  {
    constraintId: "acyclic-structural-relations",
    description: "IS_A, PART_OF, DERIVED_FROM and SUPERSEDES cannot form directed cycles.",
    appliesTo: "Relation",
  },
  {
    constraintId: "designation-context",
    description: "A normalized designation may resolve to several concepts; language, locale, type and context disambiguate it.",
    appliesTo: "Entity",
  },
  {
    constraintId: "publication-shape",
    description: "Publication records retain DOI, PMID, title, authors, journal, year, type, evidence level, version and status; absent source data is explicit null.",
    appliesTo: "Publication",
    requiredProperties: publicationShape,
  },
  {
    constraintId: "protocol-declarative-shape",
    description: "A future protocol is declarative and carries modality, ordered sequences, duration, preparation, indications, contraindications, measurements, biomarkers, diseases and references.",
    appliesTo: "Protocol",
    requiredProperties: protocolShape,
  },
  {
    constraintId: "biomarker-profile-shape",
    description: "A biomarker profile is derived from canonical relations and explicitly tracks modalities, sequences, measures, diseases, evidence, publications, limitations and interpretation status.",
    appliesTo: "Biomarker",
    requiredProperties: biomarkerProfileShape,
  },
  {
    constraintId: "equipment-lineage",
    description: "Future equipment records follow manufacturer → equipment → generation → software version → feature/compatibility without product-specific logic.",
    appliesTo: "Manufacturer|Equipment|EquipmentGeneration|SoftwareVersion|Feature",
    model: equipmentLineage,
  },
]);
