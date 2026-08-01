import {
  SCIENTIFIC_ASSERTION_NAMESPACE,
  assertionContextCombinationModes,
  assertionContextDefinitions,
  assertionContextVariantFields,
  assertionEvidenceRequiredFields,
  assertionPredicateDefinitions,
  confidenceLevels,
  contextReferenceRules,
  evidenceLevels,
  evidenceStances,
  scientificAssertionRequiredFields,
  scientificAssertionStatuses,
  scientificSourceRequiredFields,
  scientificSourceStatuses,
  scientificSourceTypes,
} from "./assertion-schema.mjs";

const isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const isDateString = (value) => typeof value === "string" && value.length > 0 && !Number.isNaN(Date.parse(value));
const isVersion = (value) => typeof value === "string" && /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/u.test(value);

const hasDirectedCycle = (edges) => {
  const childrenById = new Map();
  for (const edge of edges) {
    const children = childrenById.get(edge.sourceId) ?? [];
    children.push(edge.targetId);
    childrenById.set(edge.sourceId, children);
  }
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

const addMissingFields = (item, fields, errors, code, id) => {
  for (const field of fields) if (!(field in item)) errors.push({ code, id, field });
};

const validateDateRange = ({ id, validFrom, validUntil, errors, codePrefix }) => {
  if (validFrom !== null && !isDateString(validFrom)) errors.push({ code: `invalid-${codePrefix}-valid-from`, id, value: validFrom });
  if (validUntil !== null && !isDateString(validUntil)) errors.push({ code: `invalid-${codePrefix}-valid-until`, id, value: validUntil });
  if (isDateString(validFrom) && isDateString(validUntil) && Date.parse(validFrom) > Date.parse(validUntil)) {
    errors.push({ code: `invalid-${codePrefix}-validity-range`, id, validFrom, validUntil });
  }
};

const validateContextShape = ({ assertion, errors, entityById }) => {
  for (const [contextField, definition] of Object.entries(assertionContextDefinitions)) {
    const value = assertion[contextField];
    if (value === null || value === undefined) continue;
    if (!isRecord(value)) {
      errors.push({ code: "invalid-assertion-context", assertionId: assertion.assertionId, contextField });
      continue;
    }
    for (const field of definition.requiredFields) {
      if (!(field in value)) errors.push({ code: "missing-assertion-context-field", assertionId: assertion.assertionId, contextField, field });
    }
    for (const field of definition.arrayFields) {
      if (field in value && !Array.isArray(value[field])) errors.push({ code: "invalid-assertion-context-list", assertionId: assertion.assertionId, contextField, field });
      else if (field !== "variants" && Array.isArray(value[field]) && value[field].some((item) => typeof item !== "string" || item.length === 0)) errors.push({ code: "invalid-assertion-context-list-value", assertionId: assertion.assertionId, contextField, field });
    }
  }

  if (isRecord(assertion.context)) {
    const included = new Set(assertion.context.includeEntityIds ?? []);
    const excluded = new Set(assertion.context.excludeEntityIds ?? []);
    for (const entityId of included) {
      if (excluded.has(entityId)) errors.push({ code: "incompatible-context-inclusion", assertionId: assertion.assertionId, entityId });
      if (!entityById.has(entityId)) errors.push({ code: "unknown-context-entity", assertionId: assertion.assertionId, contextField: "context", entityId });
    }
    for (const entityId of excluded) if (!entityById.has(entityId)) errors.push({ code: "unknown-context-entity", assertionId: assertion.assertionId, contextField: "context", entityId });
    if (!assertionContextCombinationModes.includes(assertion.context.combination)) errors.push({ code: "invalid-context-combination", assertionId: assertion.assertionId, combination: assertion.context.combination });
    const contextIds = new Set();
    for (const [index, variant] of (assertion.context.variants ?? []).entries()) {
      if (!isRecord(variant)) {
        errors.push({ code: "invalid-context-variant", assertionId: assertion.assertionId, index });
        continue;
      }
      for (const field of assertionContextVariantFields) if (!(field in variant)) errors.push({ code: "missing-context-variant-field", assertionId: assertion.assertionId, index, field });
      if (!variant.contextId || contextIds.has(variant.contextId)) errors.push({ code: variant.contextId ? "duplicate-context-variant-id" : "missing-context-variant-id", assertionId: assertion.assertionId, contextId: variant.contextId, index });
      else contextIds.add(variant.contextId);
      validateContextShape({
        assertion: {
          assertionId: `${assertion.assertionId}#${variant.contextId ?? index}`,
          context: null,
          population: variant.population ?? null,
          clinicalContext: variant.clinicalContext ?? null,
          technicalContext: variant.technicalContext ?? null,
          workflowContext: variant.workflowContext ?? null,
          equipmentContext: variant.equipmentContext ?? null,
          softwareContext: variant.softwareContext ?? null,
          sequenceContext: variant.sequenceContext ?? null,
          fieldStrength: variant.fieldStrength ?? null,
          contrastAgent: variant.contrastAgent ?? null,
          measurementMethod: variant.measurementMethod ?? null,
        },
        errors,
        entityById,
      });
    }
  }

  if (isRecord(assertion.population)) {
    const included = new Set(assertion.population.inclusionCriteria ?? []);
    for (const criterion of assertion.population.exclusionCriteria ?? []) {
      if (included.has(criterion)) errors.push({ code: "incompatible-population-criterion", assertionId: assertion.assertionId, criterion });
    }
  }

  if (isRecord(assertion.clinicalContext)) {
    const indications = new Set(assertion.clinicalContext.indicationIds ?? []);
    for (const entityId of assertion.clinicalContext.contraindicationIds ?? []) {
      if (indications.has(entityId)) errors.push({ code: "incompatible-clinical-context", assertionId: assertion.assertionId, entityId });
    }
  }

  if (isRecord(assertion.fieldStrength)) {
    if (typeof assertion.fieldStrength.value !== "number" || assertion.fieldStrength.value <= 0) {
      errors.push({ code: "invalid-field-strength", assertionId: assertion.assertionId, value: assertion.fieldStrength.value });
    }
    if (assertion.fieldStrength.unit !== "T") errors.push({ code: "invalid-field-strength-unit", assertionId: assertion.assertionId, unit: assertion.fieldStrength.unit });
  }

  for (const rule of contextReferenceRules) {
    const context = assertion[rule.contextField];
    if (context === null || context === undefined || !isRecord(context)) continue;
    const references = context[rule.property];
    if (!Array.isArray(references)) {
      errors.push({ code: "invalid-context-reference-list", assertionId: assertion.assertionId, contextField: rule.contextField, property: rule.property });
      continue;
    }
    for (const entityId of references) {
      const entity = entityById.get(entityId);
      if (!entity) errors.push({ code: "unknown-context-entity", assertionId: assertion.assertionId, contextField: rule.contextField, property: rule.property, entityId });
      else if (!rule.allowedFamilies.includes(entity.entityType)) errors.push({ code: "invalid-context-entity-family", assertionId: assertion.assertionId, contextField: rule.contextField, property: rule.property, entityId, entityType: entity.entityType });
    }
  }
};

export const validateScientificAssertionLayer = ({
  entities = [],
  assertions = [],
  sources = [],
  evidenceLinks = [],
  asOf = new Date().toISOString(),
} = {}) => {
  const errors = [];
  const warnings = [];
  const contradictions = [];
  const obsoleteAssertions = [];
  const entityById = new Map(entities.map((entity) => [entity.entityId, entity]));
  const assertionById = new Map();
  const sourceById = new Map();
  const evidenceById = new Map();

  for (const source of sources) {
    addMissingFields(source, scientificSourceRequiredFields, errors, "missing-scientific-source-field", source.sourceId);
    if (!source.sourceId || sourceById.has(source.sourceId)) errors.push({ code: source.sourceId ? "duplicate-scientific-source-id" : "missing-scientific-source-id", sourceId: source.sourceId });
    else sourceById.set(source.sourceId, source);
    if (!scientificSourceTypes.includes(source.sourceType)) errors.push({ code: "invalid-scientific-source-type", sourceId: source.sourceId, sourceType: source.sourceType });
    if (!scientificSourceStatuses.includes(source.status)) errors.push({ code: "invalid-scientific-source-status", sourceId: source.sourceId, status: source.status });
    if (!isVersion(source.version)) errors.push({ code: "invalid-scientific-source-version", sourceId: source.sourceId, version: source.version });
    if (typeof source.title !== "string" || source.title.trim().length === 0) errors.push({ code: "invalid-scientific-source-title", sourceId: source.sourceId });
    if (!isDateString(source.createdAt) || !isDateString(source.updatedAt)) errors.push({ code: "invalid-scientific-source-timestamp", sourceId: source.sourceId });
    validateDateRange({ id: source.sourceId, validFrom: source.validFrom, validUntil: source.validUntil, errors, codePrefix: "scientific-source" });
    if (source.publicationEntityId !== null) {
      const publication = entityById.get(source.publicationEntityId);
      if (!publication) errors.push({ code: "unknown-source-publication", sourceId: source.sourceId, publicationId: source.publicationEntityId });
      else if (publication.entityType !== "Publication") errors.push({ code: "invalid-source-publication-family", sourceId: source.sourceId, publicationId: source.publicationEntityId, entityType: publication.entityType });
    }
  }

  for (const assertion of assertions) {
    addMissingFields(assertion, scientificAssertionRequiredFields, errors, "missing-scientific-assertion-field", assertion.assertionId);
    if (!assertion.assertionId || assertionById.has(assertion.assertionId)) errors.push({ code: assertion.assertionId ? "duplicate-scientific-assertion-id" : "missing-scientific-assertion-id", assertionId: assertion.assertionId });
    else assertionById.set(assertion.assertionId, assertion);
    if (assertion.assertionId && !assertion.assertionId.startsWith(`${SCIENTIFIC_ASSERTION_NAMESPACE}:`)) errors.push({ code: "invalid-scientific-assertion-namespace", assertionId: assertion.assertionId });
    if (!entityById.has(assertion.subjectEntityId)) errors.push({ code: "orphan-assertion-subject", assertionId: assertion.assertionId, subjectEntityId: assertion.subjectEntityId });
    if (!entityById.has(assertion.objectEntityId)) errors.push({ code: "orphan-assertion-object", assertionId: assertion.assertionId, objectEntityId: assertion.objectEntityId });
    if (!assertionPredicateDefinitions[assertion.predicate]) errors.push({ code: "unknown-assertion-predicate", assertionId: assertion.assertionId, predicate: assertion.predicate });
    if (typeof assertion.statement !== "string" || assertion.statement.trim().length === 0) errors.push({ code: "invalid-assertion-statement", assertionId: assertion.assertionId });
    if (!Array.isArray(assertion.limitations)) errors.push({ code: "invalid-assertion-limitations", assertionId: assertion.assertionId });
    if (!confidenceLevels.includes(assertion.confidence)) errors.push({ code: "invalid-assertion-confidence", assertionId: assertion.assertionId, confidence: assertion.confidence });
    if (!evidenceLevels.includes(assertion.evidenceLevel)) errors.push({ code: "invalid-assertion-evidence-level", assertionId: assertion.assertionId, evidenceLevel: assertion.evidenceLevel });
    if (!scientificAssertionStatuses.includes(assertion.status)) errors.push({ code: "invalid-scientific-assertion-status", assertionId: assertion.assertionId, status: assertion.status });
    if (!isVersion(assertion.version)) errors.push({ code: "invalid-scientific-assertion-version", assertionId: assertion.assertionId, version: assertion.version });
    if (!isDateString(assertion.createdAt) || !isDateString(assertion.updatedAt)) errors.push({ code: "invalid-scientific-assertion-timestamp", assertionId: assertion.assertionId });
    if (["ACTIVE", "CONTESTED"].includes(assertion.status) && !assertion.reviewer) errors.push({ code: "unreviewed-active-assertion", assertionId: assertion.assertionId });
    if (!Array.isArray(assertion.sourceIds) || assertion.sourceIds.length === 0) errors.push({ code: "assertion-without-source", assertionId: assertion.assertionId });
    else for (const sourceId of assertion.sourceIds) if (!sourceById.has(sourceId)) errors.push({ code: "missing-assertion-source", assertionId: assertion.assertionId, sourceId });
    if (!Array.isArray(assertion.publicationIds)) errors.push({ code: "invalid-assertion-publications", assertionId: assertion.assertionId });
    else for (const publicationId of assertion.publicationIds) {
      const publication = entityById.get(publicationId);
      if (!publication) errors.push({ code: "unknown-assertion-publication", assertionId: assertion.assertionId, publicationId });
      else if (publication.entityType !== "Publication") errors.push({ code: "invalid-assertion-publication-family", assertionId: assertion.assertionId, publicationId, entityType: publication.entityType });
    }
    validateDateRange({ id: assertion.assertionId, validFrom: assertion.validFrom, validUntil: assertion.validUntil, errors, codePrefix: "assertion" });
    validateContextShape({ assertion, errors, entityById });

    const expired = isDateString(assertion.validUntil) && Date.parse(assertion.validUntil) < Date.parse(asOf);
    if (["SUPERSEDED", "OBSOLETE", "RETRACTED"].includes(assertion.status) || expired) {
      obsoleteAssertions.push({ assertionId: assertion.assertionId, status: assertion.status, expired });
      warnings.push({ code: "obsolete-assertion", assertionId: assertion.assertionId, status: assertion.status, expired });
    }
  }

  for (const evidence of evidenceLinks) {
    addMissingFields(evidence, assertionEvidenceRequiredFields, errors, "missing-assertion-evidence-field", evidence.evidenceId);
    if (!evidence.evidenceId || evidenceById.has(evidence.evidenceId)) errors.push({ code: evidence.evidenceId ? "duplicate-assertion-evidence-id" : "missing-assertion-evidence-id", evidenceId: evidence.evidenceId });
    else evidenceById.set(evidence.evidenceId, evidence);
    const assertion = assertionById.get(evidence.assertionId);
    const source = sourceById.get(evidence.sourceId);
    if (!assertion) errors.push({ code: "orphan-assertion-evidence", evidenceId: evidence.evidenceId, assertionId: evidence.assertionId });
    if (!source) errors.push({ code: "missing-evidence-source", evidenceId: evidence.evidenceId, sourceId: evidence.sourceId });
    if (!evidenceStances.includes(evidence.stance)) errors.push({ code: "invalid-evidence-stance", evidenceId: evidence.evidenceId, stance: evidence.stance });
    if (!evidenceLevels.includes(evidence.evidenceLevel)) errors.push({ code: "invalid-evidence-level", evidenceId: evidence.evidenceId, evidenceLevel: evidence.evidenceLevel });
    if (!confidenceLevels.includes(evidence.confidence)) errors.push({ code: "invalid-evidence-confidence", evidenceId: evidence.evidenceId, confidence: evidence.confidence });
    if (!scientificSourceStatuses.includes(evidence.status)) errors.push({ code: "invalid-assertion-evidence-status", evidenceId: evidence.evidenceId, status: evidence.status });
    if (!isVersion(evidence.version)) errors.push({ code: "invalid-assertion-evidence-version", evidenceId: evidence.evidenceId, version: evidence.version });
    if (!isDateString(evidence.createdAt) || !isDateString(evidence.updatedAt)) errors.push({ code: "invalid-assertion-evidence-timestamp", evidenceId: evidence.evidenceId });
    if (!Array.isArray(evidence.limitations)) errors.push({ code: "invalid-evidence-limitations", evidenceId: evidence.evidenceId });
    if (evidence.context !== null && !isRecord(evidence.context)) errors.push({ code: "invalid-evidence-context", evidenceId: evidence.evidenceId });
    if (evidence.publicationId !== null) {
      const publication = entityById.get(evidence.publicationId);
      if (!publication) errors.push({ code: "unknown-evidence-publication", evidenceId: evidence.evidenceId, publicationId: evidence.publicationId });
      else if (publication.entityType !== "Publication") errors.push({ code: "invalid-evidence-publication-family", evidenceId: evidence.evidenceId, publicationId: evidence.publicationId, entityType: publication.entityType });
    }
    if (assertion && !assertion.sourceIds.includes(evidence.sourceId)) errors.push({ code: "evidence-source-not-declared-by-assertion", evidenceId: evidence.evidenceId, assertionId: assertion.assertionId, sourceId: evidence.sourceId });
    if (assertion && evidence.publicationId !== null && !assertion.publicationIds.includes(evidence.publicationId)) errors.push({ code: "evidence-publication-not-declared-by-assertion", evidenceId: evidence.evidenceId, assertionId: assertion.assertionId, publicationId: evidence.publicationId });
    if (source?.publicationEntityId && evidence.publicationId && source.publicationEntityId !== evidence.publicationId) errors.push({ code: "evidence-source-publication-mismatch", evidenceId: evidence.evidenceId, sourceId: source.sourceId });
  }

  for (const assertion of assertions) {
    const assertionEvidence = evidenceLinks.filter((evidence) => evidence.assertionId === assertion.assertionId);
    for (const sourceId of assertion.sourceIds ?? []) {
      if (!assertionEvidence.some((evidence) => evidence.sourceId === sourceId)) errors.push({ code: "assertion-source-without-evidence-link", assertionId: assertion.assertionId, sourceId });
    }
    for (const publicationId of assertion.publicationIds ?? []) {
      if (!assertionEvidence.some((evidence) => evidence.publicationId === publicationId)) errors.push({ code: "assertion-publication-without-evidence-link", assertionId: assertion.assertionId, publicationId });
    }
    const activeEvidence = assertionEvidence.filter((evidence) => evidence.status === "ACTIVE");
    const supportingEvidenceIds = activeEvidence.filter((evidence) => evidence.stance === "SUPPORTS").map((evidence) => evidence.evidenceId).sort();
    const refutingEvidenceIds = activeEvidence.filter((evidence) => evidence.stance === "REFUTES").map((evidence) => evidence.evidenceId).sort();
    if (supportingEvidenceIds.length > 0 && refutingEvidenceIds.length > 0) {
      contradictions.push({ assertionId: assertion.assertionId, supportingEvidenceIds, refutingEvidenceIds });
      if (assertion.status !== "CONTESTED") warnings.push({ code: "unmarked-assertion-contradiction", assertionId: assertion.assertionId });
    } else if (assertion.status === "CONTESTED") warnings.push({ code: "contested-assertion-without-opposing-evidence", assertionId: assertion.assertionId });
  }

  const activeAssertions = assertions.filter((assertion) => !["SUPERSEDED", "OBSOLETE", "RETRACTED"].includes(assertion.status));
  for (let index = 0; index < activeAssertions.length; index += 1) {
    const left = activeAssertions[index];
    const oppositePredicate = assertionPredicateDefinitions[left.predicate]?.oppositePredicate;
    if (!oppositePredicate) continue;
    const leftContext = JSON.stringify([left.context, left.population, left.clinicalContext, left.technicalContext, left.workflowContext, left.equipmentContext, left.softwareContext, left.sequenceContext, left.fieldStrength, left.contrastAgent, left.measurementMethod]);
    for (const right of activeAssertions.slice(index + 1)) {
      if (right.subjectEntityId !== left.subjectEntityId || right.objectEntityId !== left.objectEntityId || right.predicate !== oppositePredicate) continue;
      const rightContext = JSON.stringify([right.context, right.population, right.clinicalContext, right.technicalContext, right.workflowContext, right.equipmentContext, right.softwareContext, right.sequenceContext, right.fieldStrength, right.contrastAgent, right.measurementMethod]);
      if (leftContext === rightContext) contradictions.push({ type: "opposite-predicates", assertionIds: [left.assertionId, right.assertionId].sort(), predicates: [left.predicate, right.predicate].sort() });
    }
  }

  const cycleGroups = new Map();
  for (const assertion of assertions) {
    const definition = assertionPredicateDefinitions[assertion.predicate];
    if (!definition?.acyclic) continue;
    const group = definition.cycleGroup ?? assertion.predicate;
    const edges = cycleGroups.get(group) ?? [];
    edges.push({ sourceId: assertion.subjectEntityId, targetId: assertion.objectEntityId, assertionId: assertion.assertionId });
    cycleGroups.set(group, edges);
  }
  for (const [cycleGroup, edges] of cycleGroups) {
    if (hasDirectedCycle(edges)) errors.push({ code: "forbidden-assertion-cycle", cycleGroup, assertionIds: edges.map((edge) => edge.assertionId).sort() });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    contradictions,
    obsoleteAssertions,
    counts: {
      assertions: assertions.length,
      sources: sources.length,
      evidenceLinks: evidenceLinks.length,
      contradictions: contradictions.length,
      obsoleteAssertions: obsoleteAssertions.length,
    },
  };
};
