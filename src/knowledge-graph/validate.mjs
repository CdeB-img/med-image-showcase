import { existsSync } from "node:fs";
import { join } from "node:path";
import { constraints, biomarkerProfileShape, publicationShape, protocolShape, relationEndpointConstraints } from "./constraints.mjs";
import { entities, relations } from "./catalog.mjs";
import { registries, biomarkerProfiles } from "./registries.mjs";
import {
  KNOWLEDGE_GRAPH_NAMESPACE,
  acyclicRelationTypes,
  entityFamilies,
  entityStatuses,
  evidenceStatuses,
  relationTypes,
  relationDefinitions,
  registryNames,
  visibilities,
} from "./schema.mjs";
import { sources, sourceById } from "./sources.mjs";
import { assertionEvidence, scientificAssertions, scientificSources } from "./assertion-catalog.mjs";
import { legacyScientificRelationTypes } from "./assertion-schema.mjs";
import { validateScientificAssertionLayer } from "./assertion-validate.mjs";
import { createRelationIdentity, RELATION_IDENTITY_VERSION } from "./relation-identity.mjs";

const normalizeTerm = (value) => value.normalize("NFKD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("fr-FR").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const requiredIdentityFields = ["entityId", "namespace", "preferredLabel", "aliases", "description", "status", "version", "visibility", "sourceRefs", "evidenceStatus", "createdFrom", "updatedAt"];
const requiredRelationFields = ["relationId", "relationIdentityVersion", "relationIdentityDigest", "identityDiscriminator", "legacyRelationIds", "relationType", "sourceId", "targetId", "description", "status", "version", "sourceRefs", "evidenceStatus", "createdFrom", "updatedAt"];

export const hasDirectedCycle = (edges) => {
  const childrenById = new Map();
  for (const edge of edges) (childrenById.get(edge.sourceId) ?? childrenById.set(edge.sourceId, []).get(edge.sourceId)).push(edge.targetId);
  const visiting = new Set();
  const visited = new Set();
  const visit = (id) => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    const cyclic = (childrenById.get(id) ?? []).some(visit);
    visiting.delete(id);
    visited.add(id);
    return cyclic;
  };
  return [...childrenById.keys()].some(visit);
};

export const validateKnowledgeGraph = ({ root = process.cwd() } = {}) => {
  const errors = [];
  const warnings = [];
  const entityIds = new Set();
  const relationIds = new Set();
  const terms = new Map();
  const entityById = new Map();
  const targetsByNToOneSource = new Map();

  for (const source of sources) {
    if (!source.sourceId || !source.path) errors.push({ code: "invalid-source", sourceId: source.sourceId });
    else if (!existsSync(join(root, source.path))) errors.push({ code: "missing-source-file", sourceId: source.sourceId, path: source.path });
  }

  for (const item of entities) {
    for (const field of requiredIdentityFields) if (!(field in item)) errors.push({ code: "missing-entity-field", entityId: item.entityId, field });
    if (entityIds.has(item.entityId)) errors.push({ code: "duplicate-entity-id", entityId: item.entityId });
    entityIds.add(item.entityId);
    entityById.set(item.entityId, item);
    if (!item.entityId.startsWith(`${KNOWLEDGE_GRAPH_NAMESPACE}:`)) errors.push({ code: "invalid-namespace", entityId: item.entityId });
    if (!entityFamilies.includes(item.entityType)) errors.push({ code: "unknown-entity-family", entityId: item.entityId, entityType: item.entityType });
    if (!entityStatuses.includes(item.status)) errors.push({ code: "invalid-entity-status", entityId: item.entityId });
    if (!visibilities.includes(item.visibility)) errors.push({ code: "invalid-visibility", entityId: item.entityId });
    if (!evidenceStatuses.includes(item.evidenceStatus)) errors.push({ code: "invalid-entity-evidence", entityId: item.entityId });
    if (!Array.isArray(item.aliases) || !Array.isArray(item.sourceRefs) || item.sourceRefs.length === 0) errors.push({ code: "invalid-entity-provenance", entityId: item.entityId });
    if (!item.sourceRefs?.every((sourceId) => sourceById[sourceId])) errors.push({ code: "unknown-entity-source", entityId: item.entityId });
    if (item.createdFrom !== item.sourceRefs?.[0]) errors.push({ code: "invalid-entity-created-from", entityId: item.entityId });
    for (const term of [item.preferredLabel, ...item.aliases]) {
      const normalized = normalizeTerm(term);
      if (!normalized) errors.push({ code: "empty-term", entityId: item.entityId });
      const previous = terms.get(normalized);
      if (previous && previous !== item.entityId) warnings.push({
        code: "polysemous-designation",
        term,
        entityIds: [previous, item.entityId].sort(),
        reason: "Global string uniqueness is intentionally not enforced; resolve through ConceptDesignation context.",
      });
      if (!previous) terms.set(normalized, item.entityId);
    }
    if (item.entityType === "Publication") {
      for (const property of publicationShape) if (!(property in item.properties)) errors.push({ code: "missing-publication-property", entityId: item.entityId, property });
    }
    if (item.entityType === "Protocol") {
      for (const property of protocolShape) if (!(property in item.properties)) errors.push({ code: "missing-protocol-property", entityId: item.entityId, property });
    }
  }

  for (const item of relations) {
    for (const field of requiredRelationFields) if (!(field in item)) errors.push({ code: "missing-relation-field", relationId: item.relationId, field });
    if (relationIds.has(item.relationId)) errors.push({ code: "duplicate-relation-id", relationId: item.relationId });
    relationIds.add(item.relationId);
    if (!relationTypes.includes(item.relationType)) errors.push({ code: "unknown-relation-type", relationId: item.relationId });
    if (!entityIds.has(item.sourceId) || !entityIds.has(item.targetId)) errors.push({ code: "unknown-relation-endpoint", relationId: item.relationId });
    if (item.sourceId === item.targetId) errors.push({ code: "self-relation", relationId: item.relationId });
    if (!item.sourceRefs?.length || !item.sourceRefs.every((sourceId) => sourceById[sourceId])) errors.push({ code: "invalid-relation-provenance", relationId: item.relationId });
    if (!evidenceStatuses.includes(item.evidenceStatus)) errors.push({ code: "invalid-relation-evidence", relationId: item.relationId });
    if (item.createdFrom !== item.sourceRefs?.[0]) errors.push({ code: "invalid-relation-created-from", relationId: item.relationId });
    const expectedIdentity = createRelationIdentity({ relationType: item.relationType, sourceEntityId: item.sourceId, targetEntityId: item.targetId, discriminator: item.identityDiscriminator });
    if (item.relationIdentityVersion !== RELATION_IDENTITY_VERSION || item.relationId !== expectedIdentity.relationId || item.relationIdentityDigest !== expectedIdentity.relationIdentityDigest) {
      errors.push({ code: "invalid-relation-identity", relationId: item.relationId, expectedRelationId: expectedIdentity.relationId });
    }
    if (!Array.isArray(item.legacyRelationIds) || item.legacyRelationIds.length === 0) errors.push({ code: "missing-legacy-relation-id", relationId: item.relationId });
    const endpointConstraint = relationEndpointConstraints[item.relationType];
    const sourceEntity = entityById.get(item.sourceId);
    const targetEntity = entityById.get(item.targetId);
    if (endpointConstraint && sourceEntity && !endpointConstraint.sourceFamilies.includes(sourceEntity.entityType)) {
      errors.push({ code: "invalid-relation-source-family", relationId: item.relationId, entityType: sourceEntity.entityType });
    }
    if (endpointConstraint && targetEntity && !endpointConstraint.targetFamilies.includes(targetEntity.entityType)) {
      errors.push({ code: "invalid-relation-target-family", relationId: item.relationId, entityType: targetEntity.entityType });
    }
    if (relationDefinitions[item.relationType]?.cardinality === "N:1") {
      const key = `${item.relationType}:${item.sourceId}`;
      const targets = targetsByNToOneSource.get(key) ?? new Set();
      targets.add(item.targetId);
      targetsByNToOneSource.set(key, targets);
    }
  }

  for (const [key, targets] of targetsByNToOneSource) if (targets.size > 1) errors.push({ code: "cardinality-violation", key, targetIds: [...targets].sort() });

  for (const relationType of acyclicRelationTypes) {
    if (hasDirectedCycle(relations.filter((item) => item.relationType === relationType))) errors.push({ code: "relation-cycle", relationType });
  }

  for (const [biomarkerId, profile] of Object.entries(biomarkerProfiles)) {
    for (const property of biomarkerProfileShape) if (!(property in profile)) errors.push({ code: "invalid-biomarker-profile", biomarkerId, property });
  }

  for (const registryName of registryNames) if (!registries[registryName]) errors.push({ code: "missing-registry", registryName });
  if (constraints.length === 0) errors.push({ code: "missing-constraints" });
  if (entities.filter((item) => item.entityType === "Manufacturer").length === 0) warnings.push({ code: "coverage-gap", family: "Manufacturer", reason: "No manufacturer is sourced in the repository." });
  if (entities.filter((item) => item.entityType === "Equipment").length === 0) warnings.push({ code: "coverage-gap", family: "Equipment", reason: "No equipment model is sourced in the repository." });
  if (entities.filter((item) => item.entityType === "Protocol").length === 0) warnings.push({ code: "coverage-gap", family: "Protocol", reason: "No declarative protocol is sourced in the repository." });
  if (entities.filter((item) => item.entityType === "Dataset").length === 0) warnings.push({ code: "coverage-gap", family: "Dataset", reason: "No named dataset is sourced in the repository." });

  const assertionLayer = validateScientificAssertionLayer({
    entities,
    assertions: scientificAssertions,
    sources: scientificSources,
    evidenceLinks: assertionEvidence,
  });
  for (const error of assertionLayer.errors) errors.push({ ...error, layer: "scientific-assertions" });
  for (const warning of assertionLayer.warnings) warnings.push({ ...warning, layer: "scientific-assertions" });

  const legacyAssertionCandidateCount = relations.filter((item) => legacyScientificRelationTypes.includes(item.relationType)).length;
  if (legacyAssertionCandidateCount > 0 && scientificAssertions.length === 0) warnings.push({
    code: "scientific-assertion-migration-pending",
    candidateRelationCount: legacyAssertionCandidateCount,
    reason: "Legacy relations are retained unchanged until a separately reviewed scientific migration.",
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    assertionLayer,
    counts: {
      entities: entities.length,
      relations: relations.length,
      constraints: constraints.length,
      sources: sources.length,
      scientificAssertions: scientificAssertions.length,
      scientificSources: scientificSources.length,
      assertionEvidence: assertionEvidence.length,
      legacyAssertionCandidates: legacyAssertionCandidateCount,
    },
  };
};
