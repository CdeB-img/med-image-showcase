import {
  assertionPolarities,
  contextDimensionNames,
  contextOperators,
  documentStatuses,
  evidenceLinkTypes,
  evidenceQualities,
  evidenceSourceTypes,
  reviewerStatuses,
  revisionStatuses,
  scientificAssertionTypes,
  scientificMaturities,
  sourceCompletenessProfiles,
  sourceTypes,
  versioningContracts,
} from "./scientific-model-schema.mjs";
import { scientificModelContracts } from "./scientific-model-factories.mjs";

const isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const isTimestamp = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value));
const hasValue = (value) => value !== null && value !== undefined && (!(typeof value === "string") || value.trim().length > 0) && (!Array.isArray(value) || value.length > 0);

export const validateContractRecord = (record, typeName = record?.recordType) => {
  const errors = [];
  const contract = scientificModelContracts[typeName];
  if (!contract) return { valid: false, errors: [{ code: "UNKNOWN_CONTRACT", typeName }] };
  if (!isRecord(record)) return { valid: false, errors: [{ code: "INVALID_RECORD", typeName }] };
  for (const field of contract.requiredFields) if (!(field in record)) errors.push({ code: "MISSING_CONTRACT_FIELD", typeName, field });
  return { valid: errors.length === 0, errors };
};

const validateRevision = (record, errors, typeName) => {
  if (!record.stableId || !record.revisionId) errors.push({ code: "MISSING_REVISION_IDENTITY", typeName, stableId: record.stableId, revisionId: record.revisionId });
  if (record.stableId === record.revisionId) errors.push({ code: "STABLE_AND_REVISION_ID_COLLISION", typeName, stableId: record.stableId });
  if (!Number.isInteger(record.revisionNumber) || record.revisionNumber < 1) errors.push({ code: "INVALID_REVISION_NUMBER", typeName, revisionId: record.revisionId });
  if ("status" in record && !revisionStatuses.includes(record.status) && !documentStatuses.includes(record.status)) errors.push({ code: "INVALID_REVISION_STATUS", typeName, revisionId: record.revisionId, status: record.status });
  for (const field of ["validFrom", "validUntil"]) if (record[field] !== null && !isTimestamp(record[field])) errors.push({ code: "INVALID_VALIDITY_TIMESTAMP", typeName, revisionId: record.revisionId, field });
  if (isTimestamp(record.validFrom) && isTimestamp(record.validUntil) && Date.parse(record.validFrom) > Date.parse(record.validUntil)) errors.push({ code: "INVALID_VALIDITY_PERIOD", typeName, revisionId: record.revisionId });
  for (const field of ["createdAt", "updatedAt"]) if (!isTimestamp(record[field])) errors.push({ code: "INVALID_REVISION_TIMESTAMP", typeName, revisionId: record.revisionId, field });
};

export const validateVersionedRecords = ({ identities = [], revisions = [], identityType = "ConceptIdentity", revisionType = "EntityRevision" } = {}) => {
  const errors = [];
  const identityIds = new Set();
  const revisionIds = new Set();
  for (const identity of identities) {
    errors.push(...validateContractRecord(identity, identityType).errors);
    if (!identity.stableId || identityIds.has(identity.stableId)) errors.push({ code: identity.stableId ? "DUPLICATE_STABLE_ID" : "MISSING_STABLE_ID", stableId: identity.stableId, identityType });
    else identityIds.add(identity.stableId);
  }
  for (const revision of revisions) {
    errors.push(...validateContractRecord(revision, revisionType).errors);
    validateRevision(revision, errors, revisionType);
    if (!identityIds.has(revision.stableId)) errors.push({ code: "ORPHAN_REVISION", revisionId: revision.revisionId, stableId: revision.stableId });
    if (revisionIds.has(revision.revisionId)) errors.push({ code: "DUPLICATE_REVISION_ID", revisionId: revision.revisionId });
    revisionIds.add(revision.revisionId);
    for (const referenceField of ["supersedesRevisionId", "correctedByRevisionId", "retractedByRevisionId"]) {
      const targetRevisionId = revision[referenceField];
      if (targetRevisionId !== null && targetRevisionId === revision.revisionId) errors.push({ code: "SELF_REVISION_REFERENCE", revisionId: revision.revisionId, referenceField });
    }
  }
  return { valid: errors.length === 0, errors, counts: { identities: identities.length, revisions: revisions.length } };
};

export const evaluateSourceCompleteness = (sourceRevision) => {
  const selected = sourceCompletenessProfiles[sourceRevision.sourceType];
  if (!selected) return { valid: false, missing: ["sourceType"], satisfiedOneOf: false, state: "INSUFFICIENT" };
  const missing = selected.required.filter((field) => !hasValue(sourceRevision[field]));
  const satisfiedOneOf = selected.oneOf.every((alternatives) => alternatives.some((field) => hasValue(sourceRevision[field])));
  return { valid: missing.length === 0 && satisfiedOneOf, missing, satisfiedOneOf, state: missing.length === 0 && satisfiedOneOf ? "COMPLETE" : "PARTIAL" };
};

export const validateSourceModel = ({ sourceIdentities = [], sourceRevisions = [] } = {}) => {
  const validation = validateVersionedRecords({ identities: sourceIdentities, revisions: sourceRevisions, identityType: "SourceIdentity", revisionType: "SourceRevision" });
  const errors = [...validation.errors];
  const completeness = [];
  for (const identity of sourceIdentities) if (!sourceTypes.includes(identity.sourceType)) errors.push({ code: "INVALID_SOURCE_TYPE", sourceId: identity.stableId, sourceType: identity.sourceType });
  for (const revision of sourceRevisions) {
    if (!sourceTypes.includes(revision.sourceType)) errors.push({ code: "INVALID_SOURCE_TYPE", revisionId: revision.revisionId, sourceType: revision.sourceType });
    const assessment = evaluateSourceCompleteness(revision);
    completeness.push({ sourceRevisionId: revision.revisionId, ...assessment });
    if (!assessment.valid) errors.push({ code: "INCOMPLETE_SOURCE_PROFILE", revisionId: revision.revisionId, missing: assessment.missing, satisfiedOneOf: assessment.satisfiedOneOf });
  }
  return { valid: errors.length === 0, errors, completeness, counts: validation.counts };
};

export const validateContextDimension = (dimension) => {
  const errors = [...validateContractRecord(dimension, "ContextDimension").errors];
  if (!contextDimensionNames.includes(dimension.dimension)) errors.push({ code: "INVALID_CONTEXT_DIMENSION", dimension: dimension.dimension });
  if (!contextOperators.includes(dimension.operator)) errors.push({ code: "INVALID_CONTEXT_OPERATOR", operator: dimension.operator });
  const populated = {
    EXACT: hasValue(dimension.value),
    ANY_OF: Array.isArray(dimension.values) && dimension.values.length > 0,
    ALL_OF: Array.isArray(dimension.values) && dimension.values.length > 0,
    EXCLUDES: Array.isArray(dimension.values) && dimension.values.length > 0,
    RANGE: isRecord(dimension.range) && hasValue(dimension.range.min) && hasValue(dimension.range.max),
    CONDITION: hasValue(dimension.condition),
    UNKNOWN: dimension.unknownState === "UNKNOWN" || dimension.unknownState === "UNRESOLVED" || dimension.unknownState === "UNSOURCED",
    NOT_APPLICABLE: dimension.unknownState === "NOT_APPLICABLE",
  }[dimension.operator];
  if (!populated) errors.push({ code: "CONTEXT_OPERATOR_PAYLOAD_MISMATCH", dimension: dimension.dimension, operator: dimension.operator });
  return { valid: errors.length === 0, errors };
};

const conclusionCount = (assertion) => [assertion.objectEntityId, assertion.literalValue, assertion.quantitativeValue, assertion.normativeStatement].filter(hasValue).length;

export const validateScientificAssertionRevisions = ({ assertionIdentities = [], assertionRevisions = [], evidenceLinks = [], sourceRevisions = [] } = {}) => {
  const versionValidation = validateVersionedRecords({ identities: assertionIdentities, revisions: assertionRevisions, identityType: "ScientificAssertionIdentity", revisionType: "ScientificAssertionRevision" });
  const errors = [...versionValidation.errors];
  const warnings = [];
  const contradictions = [];
  const assertionByRevision = new Map(assertionRevisions.map((record) => [record.revisionId, record]));
  const sourceRevisionIds = new Set(sourceRevisions.map((record) => record.revisionId));
  for (const assertion of assertionRevisions) {
    if (!scientificAssertionTypes.includes(assertion.assertionType)) errors.push({ code: "INVALID_ASSERTION_TYPE", revisionId: assertion.revisionId, assertionType: assertion.assertionType });
    if (!assertionPolarities.includes(assertion.polarity)) errors.push({ code: "INVALID_ASSERTION_POLARITY", revisionId: assertion.revisionId, polarity: assertion.polarity });
    if (!evidenceQualities.includes(assertion.evidenceQuality)) errors.push({ code: "INVALID_EVIDENCE_QUALITY", revisionId: assertion.revisionId });
    if (!scientificMaturities.includes(assertion.scientificMaturity)) errors.push({ code: "INVALID_SCIENTIFIC_MATURITY", revisionId: assertion.revisionId });
    const conclusions = conclusionCount(assertion);
    if (conclusions !== 1) errors.push({ code: "ASSERTION_CONCLUSION_CARDINALITY", revisionId: assertion.revisionId, conclusions });
    if (["EntityObjectAssertion", "ApplicabilityAssertion", "CompatibilityAssertion"].includes(assertion.assertionType) && !hasValue(assertion.objectEntityId)) errors.push({ code: "ENTITY_OBJECT_REQUIRED", revisionId: assertion.revisionId });
    if (assertion.assertionType === "LiteralValueAssertion" && !hasValue(assertion.literalValue)) errors.push({ code: "LITERAL_VALUE_REQUIRED", revisionId: assertion.revisionId });
    if (assertion.assertionType === "QuantitativeAssertion") {
      if (!isRecord(assertion.quantitativeValue) || !hasValue(assertion.quantitativeValue.value)) errors.push({ code: "QUANTITATIVE_VALUE_REQUIRED", revisionId: assertion.revisionId });
      if (assertion.quantitativeValue?.unitRequired === true && !hasValue(assertion.quantitativeValue.unit)) errors.push({ code: "QUANTITATIVE_UNIT_REQUIRED", revisionId: assertion.revisionId });
    }
    if (assertion.assertionType === "RecommendationAssertion" && !hasValue(assertion.normativeStatement)) errors.push({ code: "NORMATIVE_STATEMENT_REQUIRED", revisionId: assertion.revisionId });
    if (assertion.context?.dimensions) for (const dimension of assertion.context.dimensions) errors.push(...validateContextDimension(dimension).errors.map((error) => ({ ...error, assertionRevisionId: assertion.revisionId })));
  }
  const linksByAssertion = new Map();
  const linkIds = new Set();
  for (const link of evidenceLinks) {
    errors.push(...validateContractRecord(link, "EvidenceLink").errors);
    if (!link.evidenceLinkId || linkIds.has(link.evidenceLinkId)) errors.push({ code: link.evidenceLinkId ? "DUPLICATE_EVIDENCE_LINK" : "MISSING_EVIDENCE_LINK_ID", evidenceLinkId: link.evidenceLinkId });
    linkIds.add(link.evidenceLinkId);
    if (!assertionByRevision.has(link.assertionRevisionId)) errors.push({ code: "ORPHAN_EVIDENCE_ASSERTION", evidenceLinkId: link.evidenceLinkId });
    if (!sourceRevisionIds.has(link.sourceRevisionId)) errors.push({ code: "ORPHAN_EVIDENCE_SOURCE", evidenceLinkId: link.evidenceLinkId });
    if (!evidenceLinkTypes.includes(link.relationType)) errors.push({ code: "INVALID_EVIDENCE_LINK_TYPE", evidenceLinkId: link.evidenceLinkId });
    if (!evidenceSourceTypes.includes(link.evidenceSourceType)) errors.push({ code: "INVALID_EVIDENCE_SOURCE_TYPE", evidenceLinkId: link.evidenceLinkId });
    if (!evidenceQualities.includes(link.evidenceQuality)) errors.push({ code: "INVALID_LINK_EVIDENCE_QUALITY", evidenceLinkId: link.evidenceLinkId });
    if (!reviewerStatuses.includes(link.reviewerStatus)) errors.push({ code: "INVALID_REVIEWER_STATUS", evidenceLinkId: link.evidenceLinkId });
    const assertionLinks = linksByAssertion.get(link.assertionRevisionId) ?? [];
    assertionLinks.push(link);
    linksByAssertion.set(link.assertionRevisionId, assertionLinks);
  }
  for (const assertion of assertionRevisions) {
    const links = linksByAssertion.get(assertion.revisionId) ?? [];
    const supporting = links.filter((link) => link.relationType === "SUPPORTS").map((link) => link.evidenceLinkId).sort();
    const refuting = links.filter((link) => link.relationType === "REFUTES").map((link) => link.evidenceLinkId).sort();
    if (supporting.length > 0 && refuting.length > 0) contradictions.push({ assertionRevisionId: assertion.revisionId, supporting, refuting });
    if (links.length === 0) warnings.push({ code: "ASSERTION_WITHOUT_EVIDENCE_LINK", assertionRevisionId: assertion.revisionId });
  }
  return { valid: errors.length === 0, errors, warnings, contradictions, counts: { ...versionValidation.counts, evidenceLinks: evidenceLinks.length } };
};

export const validateQuantitativeRecord = (record, { unitRequired = false } = {}) => {
  const errors = [...validateContractRecord(record, record.recordType).errors];
  if (!Object.hasOwn(record, "quantity") || !hasValue(record.quantity)) errors.push({ code: "QUANTITY_REQUIRED", recordId: record.stableId });
  if (unitRequired && !hasValue(record.unit)) errors.push({ code: "UNIT_REQUIRED", recordId: record.stableId });
  if (!hasValue(record.method)) errors.push({ code: "METHOD_REQUIRED", recordId: record.stableId });
  return { valid: errors.length === 0, errors };
};

export const versioningContractNames = Object.freeze(Object.keys(versioningContracts));
