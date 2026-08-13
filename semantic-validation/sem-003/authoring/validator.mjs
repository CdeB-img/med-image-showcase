import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Ajv from "ajv";

const AUTHORING_ROOT = path.dirname(fileURLToPath(import.meta.url));

export const EXPOSURE_STATUSES = Object.freeze([
  "DESIGN_ONLY",
  "DEVELOPMENT_VISIBLE",
  "CALIBRATION_VISIBLE",
]);

export const SCENARIO_CATEGORIES = Object.freeze([
  "COMPLETE_SCIENTIFIC_REQUEST",
  "UNDER_SPECIFIED_REQUEST",
  "ELLIPSIS",
  "NECESSARY_IMPLICIT",
  "STRONG_CONTEXTUAL_IMPLICIT",
  "KNOWLEDGE_CANDIDATE",
  "SCIENTIFIC_AMBIGUITY",
  "COMPARISON_AND_TIMING",
  "NEGATION_AND_NON_CAUSALITY",
  "MULTI_TURN_CORRECTION",
  "CHANGE_OF_MIND",
  "METHOD_VERSUS_MEASUREMENT",
  "PHENOMENON_VERSUS_OBSERVABLE",
  "INTERVENTION_AND_IMAGING",
  "MULTIDIMENSIONAL_REQUEST",
]);

const SAFETY_PROPERTIES = Object.freeze([
  "PROPERTY_EXPLICIT_CONTENT_PRESERVED",
  "PROPERTY_EXPLICIT_RELATIONS_PRESERVED",
  "PROPERTY_POLARITY_AND_CONDITIONALITY_PRESERVED",
  "PROPERTY_COMPARISON_AND_TIMING_PRESERVED",
  "PROPERTY_CORRECTION_PROPAGATED_WITH_HISTORY",
  "PROPERTY_NO_UNSUPPORTED_CAUSAL_PROMOTION",
  "PROPERTY_CONTEXTUAL_INFERENCE_NOT_USER_FACT",
  "PROPERTY_KNOWLEDGE_SUPPORT_NOT_PROJECT_TRUTH",
  "PROPERTY_AMBIGUITY_AND_UNKNOWN_PRESERVED",
  "PROPERTY_NO_UNSUPPORTED_INVENTION",
  "PROPERTY_OWNER_AND_ADOPTION_BOUNDARIES_PRESERVED",
  "PROPERTY_PROVENANCE_RECONSTRUCTIBLE",
]);

const UNDERSTANDING_PROPERTIES = Object.freeze([
  "PROPERTY_MISSING_CRITICAL_INFORMATION_DETECTED",
  "PROPERTY_CONCEPTUAL_PLAN_SEPARATION",
  "PROPERTY_SEMANTIC_EQUIVALENCE_RECOGNIZED",
  "PROPERTY_CLARIFICATION_HAS_DECISIONAL_VALUE",
  "PROPERTY_NONCRITICAL_FORM_VARIATION_ALLOWED",
]);

const ENRICHMENT_PROPERTIES = Object.freeze([
  "PROPERTY_CONTEXTUAL_CANDIDATE_RELEVANCE",
]);

export const SEM002_PROPERTY_REGISTRY = Object.freeze(
  Object.fromEntries([
    ...SAFETY_PROPERTIES.map((propertyId) => [
      propertyId,
      {
        family: "SAFETY_FIDELITY_INVARIANT",
        evaluationMode: "RUN_LEVEL",
        absolute: true,
        compensable: false,
      },
    ]),
    ...UNDERSTANDING_PROPERTIES.map((propertyId) => [
      propertyId,
      {
        family: "SCIENTIFIC_UNDERSTANDING_COMPETENCE",
        evaluationMode: "DISTRIBUTION",
        absolute: false,
        compensable: false,
      },
    ]),
    ...ENRICHMENT_PROPERTIES.map((propertyId) => [
      propertyId,
      {
        family: "CONTEXTUAL_ENRICHMENT",
        evaluationMode: "DISTRIBUTION",
        absolute: false,
        compensable: false,
      },
    ]),
  ]),
);

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const caseSchema = readJson(path.join(AUTHORING_ROOT, "case.schema.json"));
const envelopeSchema = readJson(
  path.join(AUTHORING_ROOT, "acceptance-envelope.schema.json"),
);

const ajv = new Ajv({
  allErrors: true,
  jsonPointers: true,
  schemaId: "auto",
});

const validateCaseSchema = ajv.compile(caseSchema);
const validateEnvelopeSchema = ajv.compile(envelopeSchema);

const error = (code, location, message) => ({ code, location, message });

const schemaErrors = (kind, id, errors = []) =>
  errors.map((entry) =>
    error(
      `${kind}_SCHEMA_INVALID`,
      `${id}${entry.dataPath || "/"}`,
      entry.message || "schema validation failed",
    ),
  );

const duplicateValues = (values) => {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
};

const sameMembers = (left, right) => {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((entry) => rightSet.has(entry));
};

const allowedTransition = (fromStatus, toStatus) => {
  if (fromStatus === null) return EXPOSURE_STATUSES.includes(toStatus);
  if (fromStatus === "DESIGN_ONLY") {
    return ["DEVELOPMENT_VISIBLE", "CALIBRATION_VISIBLE"].includes(toStatus);
  }
  return false;
};

const validateExposure = (benchmarkCase, errors) => {
  const history = benchmarkCase.exposure.exposureHistory;
  let previousStatus = null;

  for (const [index, event] of history.entries()) {
    if (event.fromStatus !== previousStatus) {
      errors.push(
        error(
          "EXPOSURE_HISTORY_DISCONTINUITY",
          `${benchmarkCase.caseId}.exposure.exposureHistory[${index}]`,
          `fromStatus must be ${String(previousStatus)}`,
        ),
      );
    }
    if (!allowedTransition(event.fromStatus, event.toStatus)) {
      errors.push(
        error(
          "EXPOSURE_TRANSITION_FORBIDDEN",
          `${benchmarkCase.caseId}.exposure.exposureHistory[${index}]`,
          `${String(event.fromStatus)} -> ${event.toStatus} is not allowed by SEM-003B`,
        ),
      );
    }
    previousStatus = event.toStatus;
  }

  if (previousStatus !== benchmarkCase.exposure.exposureStatus) {
    errors.push(
      error(
        "EXPOSURE_CURRENT_STATUS_MISMATCH",
        `${benchmarkCase.caseId}.exposure.exposureStatus`,
        "current exposureStatus must equal the last exposure event",
      ),
    );
  }

  if (
    benchmarkCase.exposure.exposureStatus === "CALIBRATION_VISIBLE" &&
    !benchmarkCase.exposure.eligibleForCalibration
  ) {
    errors.push(
      error(
        "CALIBRATION_ELIGIBILITY_REQUIRED",
        `${benchmarkCase.caseId}.exposure.eligibleForCalibration`,
        "CALIBRATION_VISIBLE requires an approved calibration gate",
      ),
    );
  }

  if (
    benchmarkCase.purpose === "AUTHORING_PROTOCOL_VALIDATION_ONLY" &&
    (benchmarkCase.exposure.exposureStatus !== "DEVELOPMENT_VISIBLE" ||
      benchmarkCase.exposure.eligibleForCalibration ||
      benchmarkCase.exposure.eligibleForBlindQualification)
  ) {
    errors.push(
      error(
        "VALIDATION_FIXTURE_EXPOSURE_INVALID",
        `${benchmarkCase.caseId}.exposure`,
        "authoring validation fixtures must be DEVELOPMENT_VISIBLE and ineligible for calibration and blind qualification",
      ),
    );
  }
};

const validateEnvelopeContract = (envelope, errors) => {
  const requiredIds = envelope.required.map((entry) => entry.obligationId);
  const prohibitedIds = envelope.prohibited.map((entry) => entry.prohibitionId);
  const variantIds = envelope.acceptableSemanticVariants.map(
    (entry) => entry.variantId,
  );
  const optionalIds = envelope.optionalRelevant.map((entry) => entry.candidateId);
  const ambiguityIds = envelope.admissibleAmbiguities.map(
    (entry) => entry.ambiguityId,
  );
  const ownershipIds = envelope.ownershipBoundaries.map(
    (entry) => entry.boundaryId,
  );
  const propertyIds = envelope.properties.map((entry) => entry.propertyId);
  const representationIds = envelope.evaluationDemonstrations.map(
    (entry) => entry.representationId,
  );

  for (const [name, values] of Object.entries({
    requiredIds,
    prohibitedIds,
    variantIds,
    optionalIds,
    ambiguityIds,
    ownershipIds,
    propertyIds,
    representationIds,
  })) {
    for (const duplicate of duplicateValues(values)) {
      errors.push(
        error(
          "DUPLICATE_LOCAL_ID",
          `${envelope.envelopeId}.${name}`,
          `duplicate identifier ${duplicate}`,
        ),
      );
    }
  }

  const requiredKeys = new Set(
    envelope.required.map((entry) => entry.semanticKey),
  );
  const prohibitedKeys = new Set(
    envelope.prohibited.map((entry) => entry.semanticKey),
  );
  const optionalKeys = new Set(
    envelope.optionalRelevant.map((entry) => entry.semanticKey),
  );

  for (const semanticKey of requiredKeys) {
    if (prohibitedKeys.has(semanticKey)) {
      errors.push(
        error(
          "REQUIRED_PROHIBITED_CONTRADICTION",
          `${envelope.envelopeId}.${semanticKey}`,
          "the same semanticKey cannot be REQUIRED and PROHIBITED",
        ),
      );
    }
    if (optionalKeys.has(semanticKey)) {
      errors.push(
        error(
          "REQUIRED_OPTIONAL_CONTRADICTION",
          `${envelope.envelopeId}.${semanticKey}`,
          "the same semanticKey cannot be REQUIRED and OPTIONAL_RELEVANT",
        ),
      );
    }
  }

  for (const obligation of envelope.required) {
    if (
      obligation.sourceClassification === "PROMOTED_FROM_OPTIONAL" &&
      !obligation.promotionJustification
    ) {
      errors.push(
        error(
          "OPTIONAL_PROMOTION_JUSTIFICATION_REQUIRED",
          `${envelope.envelopeId}.${obligation.obligationId}`,
          "promotion from OPTIONAL_RELEVANT to REQUIRED needs an explicit justification",
        ),
      );
    }
  }

  const requiredIdSet = new Set(requiredIds);
  for (const variant of envelope.acceptableSemanticVariants) {
    for (const obligationId of variant.preservedObligationIds) {
      if (!requiredIdSet.has(obligationId)) {
        errors.push(
          error(
            "UNKNOWN_OBLIGATION_REFERENCE",
            `${envelope.envelopeId}.${variant.variantId}`,
            `unknown required obligation ${obligationId}`,
          ),
        );
      }
    }
  }

  const propertyIdSet = new Set(propertyIds);
  for (const entry of [...envelope.required, ...envelope.prohibited]) {
    for (const propertyId of entry.propertyIds) {
      if (!propertyIdSet.has(propertyId)) {
        errors.push(
          error(
            "UNDECLARED_PROPERTY_REFERENCE",
            `${envelope.envelopeId}.${entry.semanticKey}`,
            `${propertyId} is referenced but not declared by the envelope`,
          ),
        );
      }
    }
  }

  for (const declaration of envelope.properties) {
    const normative = SEM002_PROPERTY_REGISTRY[declaration.propertyId];
    if (!normative) {
      errors.push(
        error(
          "UNKNOWN_SEM002_PROPERTY",
          `${envelope.envelopeId}.${declaration.propertyId}`,
          "property is not defined by SEM-002",
        ),
      );
      continue;
    }
    for (const field of [
      "family",
      "evaluationMode",
      "absolute",
      "compensable",
    ]) {
      if (declaration[field] !== normative[field]) {
        errors.push(
          error(
            "SEM002_PROPERTY_CLASSIFICATION_MISMATCH",
            `${envelope.envelopeId}.${declaration.propertyId}.${field}`,
            `expected ${String(normative[field])}`,
          ),
        );
      }
    }
  }
};

export const validateAuthoringPackage = ({ cases, envelopes }) => {
  const errors = [];

  for (const benchmarkCase of cases) {
    if (!validateCaseSchema(benchmarkCase)) {
      errors.push(
        ...schemaErrors(
          "CASE",
          benchmarkCase.caseId || "unknown-case",
          validateCaseSchema.errors,
        ),
      );
    }
  }

  for (const envelope of envelopes) {
    if (!validateEnvelopeSchema(envelope)) {
      errors.push(
        ...schemaErrors(
          "ENVELOPE",
          envelope.envelopeId || "unknown-envelope",
          validateEnvelopeSchema.errors,
        ),
      );
    }
  }

  if (errors.some((entry) => entry.code.endsWith("SCHEMA_INVALID"))) {
    return {
      valid: false,
      errors,
      counts: { cases: cases.length, envelopes: envelopes.length },
      scope: "STRUCTURAL_AND_CONTRACTUAL_ONLY",
    };
  }

  for (const duplicate of duplicateValues(cases.map((entry) => entry.caseId))) {
    errors.push(
      error("DUPLICATE_CASE_ID", duplicate, "caseId must be globally unique"),
    );
  }
  for (const duplicate of duplicateValues(
    envelopes.map((entry) => entry.envelopeId),
  )) {
    errors.push(
      error(
        "DUPLICATE_ENVELOPE_ID",
        duplicate,
        "envelopeId must be globally unique",
      ),
    );
  }

  const envelopeById = new Map(
    envelopes.map((entry) => [entry.envelopeId, entry]),
  );
  const caseById = new Map(cases.map((entry) => [entry.caseId, entry]));

  for (const benchmarkCase of cases) {
    validateExposure(benchmarkCase, errors);
    const envelope = envelopeById.get(
      benchmarkCase.reference.acceptanceEnvelopeId,
    );
    if (!envelope) {
      errors.push(
        error(
          "MISSING_ACCEPTANCE_ENVELOPE",
          benchmarkCase.caseId,
          `missing ${benchmarkCase.reference.acceptanceEnvelopeId}`,
        ),
      );
      continue;
    }
    if (envelope.caseId !== benchmarkCase.caseId) {
      errors.push(
        error(
          "CASE_ENVELOPE_CROSS_REFERENCE_MISMATCH",
          benchmarkCase.caseId,
          `${envelope.envelopeId} points to ${envelope.caseId}`,
        ),
      );
    }
    const envelopeProperties = envelope.properties.map(
      (entry) => entry.propertyId,
    );
    if (
      !sameMembers(
        benchmarkCase.reference.applicableSEM002Properties,
        envelopeProperties,
      )
    ) {
      errors.push(
        error(
          "CASE_ENVELOPE_PROPERTY_MISMATCH",
          benchmarkCase.caseId,
          "Case and Acceptance Envelope must declare the same SEM-002 property set",
        ),
      );
    }
  }

  for (const envelope of envelopes) {
    validateEnvelopeContract(envelope, errors);
    const benchmarkCase = caseById.get(envelope.caseId);
    if (!benchmarkCase) {
      errors.push(
        error(
          "MISSING_CASE",
          envelope.envelopeId,
          `missing ${envelope.caseId}`,
        ),
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    counts: { cases: cases.length, envelopes: envelopes.length },
    scope: "STRUCTURAL_AND_CONTRACTUAL_ONLY",
    scientificJudgmentPerformed: false,
  };
};

export const loadAuthoringPackage = (
  examplesRoot = path.join(AUTHORING_ROOT, "examples"),
) => {
  const entries = fs.readdirSync(examplesRoot).sort();
  const cases = entries
    .filter((entry) => entry.endsWith(".case.json"))
    .map((entry) => readJson(path.join(examplesRoot, entry)));
  const envelopes = entries
    .filter((entry) => entry.endsWith(".envelope.json"))
    .map((entry) => readJson(path.join(examplesRoot, entry)));
  return { cases, envelopes };
};

export const validateBundledExamples = () =>
  validateAuthoringPackage(loadAuthoringPackage());

const invokedPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : null;

if (invokedPath === import.meta.url) {
  const result = validateBundledExamples();
  console.log(JSON.stringify(result, null, 2));
  if (!result.valid) process.exitCode = 1;
}
