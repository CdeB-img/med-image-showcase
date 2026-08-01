import {
  SCIENTIFIC_KNOWLEDGE_GRAPH_VERSION,
  applicabilityContextContract,
  contextDimensionContract,
  evidenceLinkContract,
  equipmentContracts,
  protocolContracts,
  quantitativeContracts,
  researchContracts,
  standardContracts,
  terminologyContracts,
  versioningContracts,
  workflowContracts,
} from "./scientific-model-schema.mjs";
import { sha256Digest } from "./migration/stable-json.mjs";

export const SCIENTIFIC_MODEL_BASELINE_AT = "2026-07-31T00:00:00.000Z";

const deepFreeze = (value) => {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return Object.freeze(value.map(deepFreeze));
  return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, deepFreeze(nested)])));
};

const revisionFields = ({ stableId, revisionId, revisionNumber = 1, status = "ACTIVE", validFrom = null, validUntil = null, supersedesRevisionId = null, correctedByRevisionId = null, retractedByRevisionId = null, createdAt = SCIENTIFIC_MODEL_BASELINE_AT, updatedAt = createdAt, sourceRefs = [] }) => ({
  stableId,
  revisionId,
  revisionNumber,
  status,
  validFrom,
  validUntil,
  supersedesRevisionId,
  correctedByRevisionId,
  retractedByRevisionId,
  createdAt,
  updatedAt,
  sourceRefs: [...sourceRefs],
});

const contracts = Object.freeze({
  ...versioningContracts,
  ...quantitativeContracts,
  ...protocolContracts,
  ...equipmentContracts,
  ...terminologyContracts,
  ...workflowContracts,
  ...researchContracts,
  ...standardContracts,
  EvidenceLink: evidenceLinkContract,
  ContextDimension: contextDimensionContract,
  ApplicabilityContext: applicabilityContextContract,
});

export const createContractRecord = (typeName, values = {}) => {
  const selected = contracts[typeName];
  if (!selected) throw new Error(`Unknown scientific model contract: ${typeName}`);
  const record = { recordType: typeName, ...values };
  for (const field of selected.requiredFields) if (!(field in record)) record[field] = null;
  return deepFreeze(record);
};

export const createConceptIdentity = ({ stableId, entityType, sourceRefs = [], createdAt = SCIENTIFIC_MODEL_BASELINE_AT, externalIdentityRefs = [] }) => createContractRecord("ConceptIdentity", {
  stableId,
  entityType,
  createdAt,
  sourceRefs: [...sourceRefs],
  externalIdentityRefs: [...externalIdentityRefs],
});

export const createEntityRevision = ({ stableId, revisionId = `${stableId}:revision:1`, revisionNumber = 1, status = "ACTIVE", payload, unresolvedFields = [], completeness = null, sourceRefs = [], ...period }) => createContractRecord("EntityRevision", {
  ...revisionFields({ stableId, revisionId, revisionNumber, status, sourceRefs, ...period }),
  payload,
  unresolvedFields: [...unresolvedFields],
  completeness,
});

export const createSourceIdentity = ({ stableId, sourceType, canonicalUri = null, createdAt = SCIENTIFIC_MODEL_BASELINE_AT }) => createContractRecord("SourceIdentity", {
  stableId,
  sourceType,
  canonicalUri,
  createdAt,
});

export const createSourceRevision = ({
  stableId,
  revisionId = `${stableId}:revision:1`,
  revisionNumber = 1,
  sourceType,
  title,
  authority = null,
  authors = null,
  publicationDate = null,
  version = null,
  doi = null,
  pmid = null,
  url = null,
  repositoryPath = null,
  locator = null,
  section = null,
  page = null,
  paragraph = null,
  digest = null,
  language = null,
  status = "ACTIVE",
  retrievedAt = null,
  sourceRefs = [],
  metadata = {},
  completeness = null,
  ...period
}) => createContractRecord("SourceRevision", {
  ...revisionFields({ stableId, revisionId, revisionNumber, status, sourceRefs, ...period }),
  sourceType,
  title,
  authority,
  authors,
  publicationDate,
  version,
  doi,
  pmid,
  url,
  repositoryPath,
  locator,
  section,
  page,
  paragraph,
  digest,
  language,
  retrievedAt,
  metadata: { ...metadata },
  completeness,
});

export const createPublicationWork = ({ stableId, title, sourceRefs = [], workType = null, createdAt = SCIENTIFIC_MODEL_BASELINE_AT }) => createContractRecord("PublicationWork", {
  stableId,
  title,
  createdAt,
  sourceRefs: [...sourceRefs],
  workType,
});

export const createPublicationVersion = ({ stableId, revisionId = `${stableId}:version:1`, revisionNumber = 1, title, doi = null, pmid = null, authors = null, journal = null, year = null, publicationType = null, documentStatus = "UNKNOWN", sourceRefs = [], ...period }) => createContractRecord("PublicationVersion", {
  ...revisionFields({ stableId, revisionId, revisionNumber, status: documentStatus === "RETRACTED" ? "RETRACTED" : "ACTIVE", sourceRefs, ...period }),
  title,
  doi,
  pmid,
  authors,
  journal,
  year,
  publicationType,
  documentStatus,
});

export const createScientificAssertionIdentity = ({ stableId, assertionType, sourceRefs = [], createdAt = SCIENTIFIC_MODEL_BASELINE_AT }) => createContractRecord("ScientificAssertionIdentity", {
  stableId,
  assertionType,
  createdAt,
  sourceRefs: [...sourceRefs],
});

export const createScientificAssertionRevision = ({
  stableId,
  revisionId = `${stableId}:revision:1`,
  revisionNumber = 1,
  assertionType,
  subjectEntityId,
  predicate,
  objectEntityId = null,
  literalValue = null,
  quantitativeValue = null,
  normativeStatement = null,
  scope = null,
  context = null,
  population = null,
  method = null,
  temporalContext = null,
  applicability = null,
  limitations = [],
  polarity = "UNKNOWN",
  status = "DRAFT",
  confidence = "UNKNOWN",
  evidenceQuality = "UNKNOWN",
  scientificMaturity = "HYPOTHESIS",
  sourceRefs = [],
  reviewer = null,
  reviewerStatus = "UNREVIEWED",
  reviewState = "DRAFT",
  reviewType = null,
  humanReviewed = false,
  statement = null,
  modality = null,
  sequence = null,
  fieldStrength = null,
  facets = {},
  ...period
}) => createContractRecord("ScientificAssertionRevision", {
  ...revisionFields({ stableId, revisionId, revisionNumber, status, sourceRefs, ...period }),
  assertionType,
  subjectEntityId,
  predicate,
  objectEntityId,
  literalValue,
  quantitativeValue,
  normativeStatement,
  scope,
  context,
  population,
  method,
  temporalContext,
  applicability,
  limitations: [...limitations],
  polarity,
  confidence,
  evidenceQuality,
  scientificMaturity,
  reviewer,
  reviewerStatus,
  reviewState,
  reviewType,
  humanReviewed,
  statement,
  modality,
  sequence,
  fieldStrength,
  facets: { ...facets },
});

export const createEvidenceLink = ({
  evidenceLinkId,
  sourceRevisionId,
  assertionRevisionId,
  relationType = "UNRESOLVED_EVIDENCE_LINK",
  locator = null,
  extractedStatement = null,
  applicability = null,
  confidence = "UNKNOWN",
  evidenceSourceType = "INTERNAL_DOCUMENT",
  evidenceQuality = "UNKNOWN",
  reviewerStatus = "UNREVIEWED",
  createdAt = SCIENTIFIC_MODEL_BASELINE_AT,
  reviewer = null,
  limitations = [],
  version = SCIENTIFIC_KNOWLEDGE_GRAPH_VERSION,
  analyticalSummary = null,
  extraction = null,
  reviewType = null,
  reviewedAt = null,
  sourceRefs = [],
}) => createContractRecord("EvidenceLink", {
  evidenceLinkId,
  sourceRevisionId,
  assertionRevisionId,
  relationType,
  locator,
  extractedStatement,
  applicability,
  confidence,
  evidenceSourceType,
  evidenceQuality,
  reviewerStatus,
  createdAt,
  reviewer,
  limitations: [...limitations],
  version,
  analyticalSummary,
  extraction,
  reviewType,
  reviewedAt,
  sourceRefs: [...sourceRefs],
});

export const createContextDimension = ({ dimension, operator = "UNKNOWN", value = null, values = [], range = null, condition = null, unit = null, unknownState = operator === "NOT_APPLICABLE" ? "NOT_APPLICABLE" : operator === "UNKNOWN" ? "UNKNOWN" : null, sourceRefs = [] }) => createContractRecord("ContextDimension", {
  dimension,
  operator,
  value,
  values: [...values],
  range,
  condition,
  unit,
  unknownState,
  sourceRefs: [...sourceRefs],
});

export const createApplicabilityContext = ({ contextId, combination = "ALL_OF", dimensions = [], exclusions = [], status = "DRAFT", version = SCIENTIFIC_KNOWLEDGE_GRAPH_VERSION, label = null, sourceRefs = [] }) => createContractRecord("ApplicabilityContext", {
  contextId,
  combination,
  dimensions: [...dimensions],
  exclusions: [...exclusions],
  status,
  version,
  label,
  sourceRefs: [...sourceRefs],
});

export const createDeterministicId = (namespace, material) => `${namespace}:${sha256Digest(material)}`;

export const scientificModelContracts = contracts;
