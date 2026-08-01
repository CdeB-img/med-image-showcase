import { relationEndpointConstraints } from "./constraints.mjs";
import { relationDefinitions } from "./schema.mjs";
import { hasDirectedCycle } from "./validate.mjs";

const inverseByType = Object.freeze({
  IS_A: "HAS_SUBTYPE",
  PART_OF: "HAS_PART",
  APPLIES_TO: "HAS_APPLICABLE_SUBJECT",
  MEASURES: "MEASURED_BY",
  USES: "USED_BY",
  SUPPORTS: "SUPPORTED_BY",
  PRODUCES: "PRODUCED_BY",
  DOCUMENTS: "DOCUMENTED_BY",
  IMPLEMENTED_BY: "IMPLEMENTS",
  HAS_FEATURE: "FEATURE_OF",
  HAS_VERSION: "VERSION_OF",
  REQUIRES: "REQUIRED_BY",
  COMPATIBLE_WITH: "COMPATIBLE_WITH",
  INCOMPATIBLE_WITH: "INCOMPATIBLE_WITH",
  DERIVED_FROM: "SOURCE_OF_DERIVATION",
  SUPERSEDES: "SUPERSEDED_BY",
  REFERENCES: "REFERENCED_BY",
  RELATED_TO: "RELATED_TO",
});

const symmetricTypes = new Set(["COMPATIBLE_WITH", "INCOMPATIBLE_WITH", "RELATED_TO"]);
const hierarchyTypes = new Set(["IS_A", "PART_OF"]);

export const familyPairCardinalities = Object.freeze({
  IS_A: Object.freeze({ "*->*": "N:N" }),
  PART_OF: Object.freeze({
    "Organ->BodySystem": "N:1",
    "Region->Organ": "N:N",
    "Sequence->SequenceFamily": "N:N",
    "Equipment->Manufacturer": "N:1",
    "EquipmentGeneration->Equipment": "N:1",
    "SoftwareVersion->EquipmentGeneration": "N:N",
    "*->*": "N:N",
  }),
});

export const formalRelationDefinitions = Object.freeze(Object.fromEntries(Object.entries(relationDefinitions).map(([relationType, definition]) => [relationType, Object.freeze({
  relationType,
  domain: Object.freeze([...(relationEndpointConstraints[relationType]?.sourceFamilies ?? [])]),
  codomain: Object.freeze([...(relationEndpointConstraints[relationType]?.targetFamilies ?? [])]),
  inverse: Object.freeze({ relationType: inverseByType[relationType] ?? null, materialized: false }),
  cardinalityByFamilyPair: familyPairCardinalities[relationType] ?? Object.freeze({ "*->*": definition.cardinality }),
  symmetric: symmetricTypes.has(relationType),
  transitive: hierarchyTypes.has(relationType) || relationType === "SUPERSEDES",
  reflexive: false,
  exclusiveWith: relationType === "COMPATIBLE_WITH" ? Object.freeze(["INCOMPATIBLE_WITH"]) : relationType === "INCOMPATIBLE_WITH" ? Object.freeze(["COMPATIBLE_WITH"]) : Object.freeze([]),
  temporalCompatibility: ["SUPERSEDES", "HAS_VERSION"].includes(relationType) ? "VERSION_AWARE" : "OPTIONAL_CONTEXT",
  cyclesAllowed: !definition.acyclic,
  cycleGroup: hierarchyTypes.has(relationType) ? "hierarchy" : relationType === "DERIVED_FROM" ? "derivation" : relationType === "SUPERSEDES" ? "version" : null,
  evidenceStatus: ["DOCUMENTS", "REFERENCES"].includes(relationType) ? "MENTION_ONLY" : ["APPLIES_TO", "MEASURES", "DERIVED_FROM", "SUPPORTS"].includes(relationType) ? "REQUIRES_SCIENTIFIC_REVIEW" : "STRUCTURAL_OR_OPERATIONAL",
  simplifiedProjection: ["IS_A", "PART_OF", "REFERENCES", "RELATED_TO"].includes(relationType) ? relationType : null,
})])));

export const getFamilyPairCardinality = (relationType, sourceFamily, targetFamily) => {
  const rules = formalRelationDefinitions[relationType]?.cardinalityByFamilyPair;
  return rules?.[`${sourceFamily}->${targetFamily}`] ?? rules?.["*->*"] ?? null;
};

export const validateFormalRelations = ({ relations = [], entities = [] } = {}) => {
  const errors = [];
  const warnings = [];
  const entityById = new Map(entities.map((entity) => [entity.entityId, entity]));
  const pairTargets = new Map();
  for (const relation of relations) {
    const definition = formalRelationDefinitions[relation.relationType];
    const source = entityById.get(relation.sourceId);
    const target = entityById.get(relation.targetId);
    if (!definition) errors.push({ code: "UNKNOWN_FORMAL_RELATION", relationId: relation.relationId });
    if (!source || !target) {
      errors.push({ code: "FORMAL_RELATION_ORPHAN", relationId: relation.relationId });
      continue;
    }
    if (!definition.domain.includes(source.entityType)) errors.push({ code: "FORMAL_DOMAIN_VIOLATION", relationId: relation.relationId, sourceFamily: source.entityType });
    if (!definition.codomain.includes(target.entityType)) errors.push({ code: "FORMAL_CODOMAIN_VIOLATION", relationId: relation.relationId, targetFamily: target.entityType });
    const cardinality = getFamilyPairCardinality(relation.relationType, source.entityType, target.entityType);
    if (cardinality === "N:1") {
      const key = `${relation.relationType}:${source.entityType}->${target.entityType}:${relation.sourceId}`;
      const targets = pairTargets.get(key) ?? new Set();
      targets.add(relation.targetId);
      pairTargets.set(key, targets);
    }
  }
  for (const [key, targets] of pairTargets) if (targets.size > 1) errors.push({ code: "FAMILY_PAIR_CARDINALITY_VIOLATION", key, targetIds: [...targets].sort() });
  for (const cycleGroup of ["hierarchy", "derivation", "version"]) {
    const edges = relations.filter((relation) => formalRelationDefinitions[relation.relationType]?.cycleGroup === cycleGroup);
    if (hasDirectedCycle(edges)) errors.push({ code: "COMBINED_RELATION_CYCLE", cycleGroup, relationIds: edges.map((edge) => edge.relationId).sort() });
  }
  return { valid: errors.length === 0, errors, warnings };
};
