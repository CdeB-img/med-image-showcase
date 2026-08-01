import { entityFamilies } from "./schema.mjs";
import { completenessUsages } from "./scientific-model-schema.mjs";

const profile = (requiredFields, requiredRelations, minimumProvenance, validationLevel, warnings = [], blockingErrors = []) => Object.freeze({
  requiredFields: Object.freeze(requiredFields),
  requiredRelations: Object.freeze(requiredRelations),
  minimumProvenance,
  validationLevel,
  warnings: Object.freeze(warnings),
  blockingErrors: Object.freeze(blockingErrors),
});

const baseByUsage = Object.freeze({
  CATALOG: profile(["entityId", "entityType", "preferredLabel", "description", "sourceRefs"], [], "REPOSITORY_SOURCE", "STRUCTURE"),
  EDITORIAL: profile(["preferredLabel", "description", "sourceRefs"], [], "REPOSITORY_SOURCE", "SEMANTICS", ["PUBLICATION_REVIEW_REQUIRED"]),
  SCIENTIFIC: profile(["preferredLabel", "sourceRefs"], ["SCIENTIFIC_ASSERTION", "EVIDENCE_LINK"], "SOURCE_REVISION_WITH_LOCATOR", "SCIENTIFIC", ["UNKNOWN_VALUES_ALLOWED"], ["NO_VERIFIED_ASSERTION"]),
  COMPARISON: profile(["preferredLabel", "sourceRefs"], ["CONTEXTUAL_ATTRIBUTE_ASSERTION"], "SOURCE_REVISION", "SCIENTIFIC", [], ["NO_COMPARABLE_ATTRIBUTES"]),
  GLOSSARY: profile(["preferredLabel", "description", "sourceRefs"], ["CONCEPT_DESIGNATION"], "REPOSITORY_SOURCE", "SEMANTICS", ["LANGUAGE_MAY_BE_UNKNOWN"]),
  NAVIGATION: profile(["preferredLabel", "sourceRefs"], ["ACTIVE_STRUCTURAL_RELATION"], "REPOSITORY_SOURCE", "SEMANTICS", ["ORPHAN_CONCEPTS_MAY_REMAIN_SEARCHABLE"]),
  SEO: profile(["preferredLabel", "description", "sourceRefs"], [], "REPOSITORY_SOURCE", "EDITORIAL_REVIEW", ["PUBLICATION_AND_INDEXATION_REVIEW_REQUIRED"]),
  KNOWLEDGE_STATE: profile(["preferredLabel", "sourceRefs"], ["SCIENTIFIC_ASSERTION", "EVIDENCE_LINK", "STRUCTURED_SYNTHESIS"], "REVIEWED_SOURCE_REVISION", "SCIENTIFIC", [], ["NO_REVIEWED_EVIDENCE_SYNTHESIS"]),
});

const specialization = Object.freeze({
  Publication: {
    SCIENTIFIC: profile(["preferredLabel", "properties", "sourceRefs"], ["PUBLICATION_VERSION"], "SCIENTIFIC_PUBLICATION_SOURCE", "PROVENANCE", ["DOI_PMID_AUTHORS_MAY_BE_UNKNOWN"]),
  },
  Protocol: {
    EDITORIAL: profile(["preferredLabel", "description", "sourceRefs"], ["PROTOCOL_CONCEPT"], "SOURCE_REVISION", "SEMANTICS", ["DOCUMENTARY_ONLY"], []),
  },
  Equipment: {
    COMPARISON: profile(["preferredLabel", "sourceRefs"], ["CAPABILITY_STATEMENT"], "MANUFACTURER_OR_PUBLICATION_SOURCE", "SCIENTIFIC", ["DOCUMENTARY_ONLY"], ["NO_SOURCED_CAPABILITY_STATEMENT"]),
  },
  SoftwareVersion: {
    COMPARISON: profile(["preferredLabel", "sourceRefs"], ["CAPABILITY_STATEMENT"], "MANUFACTURER_OR_PUBLICATION_SOURCE", "SCIENTIFIC", ["DOCUMENTARY_ONLY"], ["NO_SOURCED_CAPABILITY_STATEMENT"]),
  },
  Dataset: {
    EDITORIAL: profile(["preferredLabel", "description", "sourceRefs"], ["DATASET_DOCUMENTARY_CONCEPT"], "SOURCE_REVISION", "SEMANTICS", ["DOCUMENTARY_ONLY"]),
  },
});

export const familyCompletenessProfiles = Object.freeze(Object.fromEntries(entityFamilies.map((family) => [family, Object.freeze(Object.fromEntries(completenessUsages.map((usage) => [usage, specialization[family]?.[usage] ?? baseByUsage[usage]])))])));

const hasValue = (value) => value !== null && value !== undefined && (!(typeof value === "string") || value.trim().length > 0) && (!Array.isArray(value) || value.length > 0);

export const evaluateEntityCompleteness = ({ entity, usage = "CATALOG", relationCapabilities = [] } = {}) => {
  const selected = familyCompletenessProfiles[entity.entityType]?.[usage];
  if (!selected) return { state: "NOT_APPLICABLE", missingFields: [], missingRelations: [], warnings: ["UNKNOWN_FAMILY_OR_USAGE"], blockingErrors: [] };
  const missingFields = selected.requiredFields.filter((field) => !hasValue(entity[field]));
  const missingRelations = selected.requiredRelations.filter((required) => !relationCapabilities.includes(required));
  const blockingErrors = [...selected.blockingErrors];
  const state = missingFields.length > 0 ? "INSUFFICIENT" : missingRelations.length > 0 || blockingErrors.length > 0 ? "PARTIAL" : "COMPLETE";
  return { state, missingFields, missingRelations, warnings: [...selected.warnings], blockingErrors };
};
