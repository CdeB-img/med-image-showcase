import { SCIENTIFIC_ASSERTION_LAYER_VERSION } from "./assertion-schema.mjs";

const pushUnique = (values, value) => {
  if (!values.includes(value)) values.push(value);
};

const hasContext = (assertion) => [
  "context",
  "population",
  "clinicalContext",
  "technicalContext",
  "workflowContext",
  "equipmentContext",
  "softwareContext",
  "sequenceContext",
  "fieldStrength",
  "contrastAgent",
  "measurementMethod",
].some((field) => assertion[field] !== null && assertion[field] !== undefined);

export const synthesizeScientificAssertion = ({
  assertion,
  evidenceLinks = [],
  sources = [],
  updatedAt = new Date().toISOString(),
} = {}) => {
  const sourceById = new Map(sources.map((source) => [source.sourceId, source]));
  const activeEvidence = evidenceLinks.filter((evidence) => evidence.assertionId === assertion.assertionId && evidence.status === "ACTIVE");
  const byStance = Object.fromEntries(["SUPPORTS", "REFUTES", "QUALIFIES", "NEUTRAL"].map((stance) => [
    stance,
    activeEvidence.filter((evidence) => evidence.stance === stance),
  ]));
  const controversyDetected = byStance.SUPPORTS.length > 0 && byStance.REFUTES.length > 0;
  const consensusEvidence = activeEvidence.filter((evidence) => sourceById.get(evidence.sourceId)?.sourceType === "Consensus");
  const primaryEvidence = activeEvidence.filter((evidence) => sourceById.get(evidence.sourceId)?.sourceType === "PrimarySource");
  const weakPoints = [];
  const openQuestions = [];

  if (activeEvidence.length === 0) pushUnique(weakPoints, "NO_ACTIVE_EVIDENCE");
  if (primaryEvidence.length === 0) pushUnique(weakPoints, "NO_PRIMARY_SOURCE");
  if (!assertion.reviewer) pushUnique(weakPoints, "UNREVIEWED");
  if (assertion.confidence === "UNASSESSED") pushUnique(weakPoints, "CONFIDENCE_UNASSESSED");
  if (assertion.evidenceLevel === "UNASSESSED") pushUnique(weakPoints, "EVIDENCE_LEVEL_UNASSESSED");
  if (!hasContext(assertion)) pushUnique(weakPoints, "CONTEXT_UNSPECIFIED");
  if (assertion.limitations.length === 0) pushUnique(weakPoints, "LIMITATIONS_NOT_RECORDED");
  if (controversyDetected) pushUnique(openQuestions, "UNRESOLVED_CONTRADICTION");
  if (consensusEvidence.length === 0) pushUnique(openQuestions, "CONSENSUS_NOT_RECORDED");
  if (activeEvidence.length === 0) pushUnique(openQuestions, "EVIDENCE_REQUIRED");

  let knowledgeStatus = "UNASSESSED";
  if (["OBSOLETE", "RETRACTED", "SUPERSEDED"].includes(assertion.status)) knowledgeStatus = assertion.status;
  else if (controversyDetected) knowledgeStatus = "CONTESTED";
  else if (byStance.SUPPORTS.length > 0) knowledgeStatus = "SUPPORTED";
  else if (byStance.REFUTES.length > 0) knowledgeStatus = "REFUTED";
  else if (byStance.QUALIFIES.length > 0) knowledgeStatus = "QUALIFIED";

  return Object.freeze({
    assertionId: assertion.assertionId,
    stateOfKnowledge: Object.freeze({
      status: knowledgeStatus,
      assertionStatus: assertion.status,
      supportingEvidenceIds: Object.freeze(byStance.SUPPORTS.map((evidence) => evidence.evidenceId).sort()),
      refutingEvidenceIds: Object.freeze(byStance.REFUTES.map((evidence) => evidence.evidenceId).sort()),
      qualifyingEvidenceIds: Object.freeze(byStance.QUALIFIES.map((evidence) => evidence.evidenceId).sort()),
      neutralEvidenceIds: Object.freeze(byStance.NEUTRAL.map((evidence) => evidence.evidenceId).sort()),
    }),
    controversies: Object.freeze({
      detected: controversyDetected,
      supportingEvidenceCount: byStance.SUPPORTS.length,
      refutingEvidenceCount: byStance.REFUTES.length,
      evidenceIds: Object.freeze([...byStance.SUPPORTS, ...byStance.REFUTES].map((evidence) => evidence.evidenceId).sort()),
    }),
    consensus: Object.freeze({
      detected: consensusEvidence.length > 0,
      evidenceIds: Object.freeze(consensusEvidence.map((evidence) => evidence.evidenceId).sort()),
      sourceIds: Object.freeze(consensusEvidence.map((evidence) => evidence.sourceId).sort()),
    }),
    weakPoints: Object.freeze(weakPoints.sort()),
    openQuestions: Object.freeze(openQuestions.sort()),
    history: Object.freeze({
      assertionVersion: assertion.version,
      assertionStatus: assertion.status,
      validFrom: assertion.validFrom,
      validUntil: assertion.validUntil,
      evidenceEvents: Object.freeze(activeEvidence
        .map((evidence) => Object.freeze({
          evidenceId: evidence.evidenceId,
          sourceId: evidence.sourceId,
          stance: evidence.stance,
          evidenceLevel: evidence.evidenceLevel,
          version: evidence.version,
          status: evidence.status,
          updatedAt: evidence.updatedAt,
        }))
        .sort((left, right) => left.updatedAt.localeCompare(right.updatedAt))),
    }),
    confidence: Object.freeze({
      declared: assertion.confidence,
      evidenceLevel: assertion.evidenceLevel,
      activeEvidenceCount: activeEvidence.length,
      primaryEvidenceCount: primaryEvidence.length,
      consensusEvidenceCount: consensusEvidence.length,
      contested: controversyDetected,
    }),
    version: SCIENTIFIC_ASSERTION_LAYER_VERSION,
    updatedAt,
  });
};

export const synthesizeScientificAssertionRegistry = ({
  assertions = [],
  evidenceLinks = [],
  sources = [],
  updatedAt,
} = {}) => Object.freeze(Object.fromEntries(assertions.map((assertion) => [
  assertion.assertionId,
  synthesizeScientificAssertion({ assertion, evidenceLinks, sources, updatedAt }),
])));
