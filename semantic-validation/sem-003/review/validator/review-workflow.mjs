import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";

const VALIDATOR_ROOT = path.dirname(fileURLToPath(import.meta.url));
export const REVIEW_ROOT = path.resolve(VALIDATOR_ROOT, "..");
export const REPOSITORY_ROOT = path.resolve(REVIEW_ROOT, "../../..");
const CORPUS_ROOT = path.resolve(REVIEW_ROOT, "../corpus");
const EVALUATOR_ROOT = path.resolve(REVIEW_ROOT, "../evaluator");

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const clone = (value) => structuredClone(value);
const stableJson = (value) => `${JSON.stringify(value, null, 2)}\n`;
export const sha256 = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");
export const sha256File = (filePath) => sha256(fs.readFileSync(filePath));
const error = (code, location, message) => ({ code, location, message });

const listJson = (directory) =>
  fs.existsSync(directory)
    ? fs
        .readdirSync(directory)
        .filter((file) => file.endsWith(".json"))
        .sort()
        .map((file) => readJson(path.join(directory, file)))
    : [];

const loadPairs = (directory) => {
  const files = fs.readdirSync(directory).sort();
  return {
    cases: files
      .filter((file) => file.endsWith(".case.json"))
      .map((file) => readJson(path.join(directory, file))),
    envelopes: files
      .filter((file) => file.endsWith(".envelope.json"))
      .map((file) => readJson(path.join(directory, file))),
  };
};

export const loadReviewPackage = (root = REVIEW_ROOT) => {
  const development = loadPairs(path.join(CORPUS_ROOT, "development"));
  const calibration = loadPairs(path.join(CORPUS_ROOT, "calibration"));
  const cases = [...development.cases, ...calibration.cases];
  const envelopes = [...development.envelopes, ...calibration.envelopes];
  return {
    root,
    cases,
    envelopes,
    development,
    calibration,
    reviewQueue: readJson(path.join(CORPUS_ROOT, "registry/review-queue.json")),
    corpusRegistry: readJson(path.join(CORPUS_ROOT, "registry/corpus-registry.json")),
    parentage: readJson(
      path.join(CORPUS_ROOT, "registry/parentage-contamination-summary.json"),
    ),
    evaluatorIdentity: readJson(path.join(EVALUATOR_ROOT, "registry/evaluator-identity.json")),
    evaluatorTestMatrix: readJson(path.join(EVALUATOR_ROOT, "artifacts/test-matrix.json")),
    units: listJson(path.join(root, "review-units")).filter(
      (entry) =>
        entry.contractType === "SEM003B3_HUMAN_REVIEW_UNIT" ||
        entry.contractType === "SEM003B3_SIMULATED_REVIEW_UNIT",
    ),
    decisions: listJson(path.join(root, "decision-records")).filter(
      (entry) => entry.contractType === "SEM003B3_HUMAN_REFERENCE_DECISION_RECORD",
    ),
    simulatedReviews: listJson(path.join(root, "decision-records")).filter(
      (entry) =>
        entry.contractType ===
        "SEM003B3_SIMULATED_PLURALISTIC_EXPERT_REVIEW_RECORD",
    ),
    manifest: readJson(path.join(root, "artifacts/review-unit-manifest.json")),
    progress: readJson(path.join(root, "artifacts/review-progress.json")),
    calibrationGates: readJson(
      path.join(root, "artifacts/calibration-gate-status.json"),
    ),
    equivalenceStatus: readJson(
      path.join(root, "artifacts/equivalence-review-status.json"),
    ),
    versionRegistry: readJson(
      path.join(root, "artifacts/reference-version-registry.json"),
    ),
    revisionLineage: readJson(
      path.join(root, "artifacts/reference-revision-lineage.json"),
    ),
    calibrationReferenceSet: readJson(
      path.join(root, "artifacts/calibration-reference-set.json"),
    ),
    antiOverfitting: readJson(
      path.join(root, "artifacts/anti-overfitting-audit.json"),
    ),
  };
};

const decisionSchema = readJson(
  path.join(REVIEW_ROOT, "contracts/human-decision-record.schema.json"),
);
const ajv = new Ajv({ allErrors: true, jsonPointers: true });
const validateDecisionSchema = ajv.compile(decisionSchema);
const simulatedReviewSchema = readJson(
  path.join(
    REVIEW_ROOT,
    "contracts/simulated-pluralistic-review-record.schema.json",
  ),
);
const validateSimulatedReviewSchema = ajv.compile(simulatedReviewSchema);

const ALLOWED_DECISIONS = {
  SCIENTIFIC_REFERENCE: new Set([
    "ACCEPT",
    "ACCEPT_WITH_REVISION",
    "REJECT",
    "NEEDS_SPECIALIST_REVIEW",
  ]),
  METHODOLOGICAL_REFERENCE: new Set([
    "ACCEPT",
    "ACCEPT_WITH_REVISION",
    "REJECT",
    "NEEDS_SPECIALIST_REVIEW",
    "NOT_REQUIRED",
  ]),
  AMBIGUITY: new Set([
    "AMBIGUITY_CONFIRMED",
    "AMBIGUITY_REVISED",
    "NOT_ACTUALLY_AMBIGUOUS",
    "SPECIALIST_REVIEW_REQUIRED",
  ]),
  PARENTAGE: new Set([
    "PARENTAGE_CLEAR",
    "RELATED_VISIBLE_CASE",
    "CONTAMINATED_FOR_CALIBRATION",
    "PARENTAGE_REVIEW_UNRESOLVED",
  ]),
  CALIBRATION_ADMISSION: new Set(["APPROVE", "DO_NOT_APPROVE", "DEFER"]),
  SEMANTIC_EQUIVALENCE: new Set([
    "SEMANTICALLY_EQUIVALENT",
    "NONCRITICAL_VARIATION",
    "NOT_EQUIVALENT",
    "NOT_ADJUDICABLE",
  ]),
};

const REVIEW_TYPE_TO_QUEUE_TYPE = {
  SCIENTIFIC_REFERENCE: "SCIENTIFIC_REVIEW_REQUIRED",
  METHODOLOGICAL_REFERENCE: "METHODOLOGICAL_REVIEW_REQUIRED",
  AMBIGUITY: "AMBIGUITY_ADJUDICATION_REQUIRED",
  PARENTAGE: "PARENTAGE_REVIEW_REQUIRED",
  CALIBRATION_ADMISSION: "CALIBRATION_REVIEW_REQUIRED",
};

export const validateHumanDecisionRecord = (record, review = loadReviewPackage()) => {
  const errors = [];
  if (!validateDecisionSchema(record)) {
    errors.push(
      ...validateDecisionSchema.errors.map((entry) =>
        error(
          "HUMAN_DECISION_SCHEMA_INVALID",
          entry.dataPath || "/",
          entry.message,
        ),
      ),
    );
    return { valid: false, errors };
  }

  const caseById = new Map(review.cases.map((entry) => [entry.caseId, entry]));
  const envelopeByCaseId = new Map(
    review.envelopes.map((entry) => [entry.caseId, entry]),
  );
  const unitById = new Map(review.units.map((entry) => [entry.reviewUnitId, entry]));
  const reviewItemById = new Map(
    review.reviewQueue.items.map((entry) => [entry.reviewId, entry]),
  );
  const benchmarkCase = caseById.get(record.caseId);
  const envelope = envelopeByCaseId.get(record.caseId);
  const unit = unitById.get(record.reviewUnitId);

  if (!benchmarkCase) {
    errors.push(error("HUMAN_DECISION_UNKNOWN_CASE", record.caseId, "unknown Case"));
  }
  if (!unit) {
    errors.push(
      error("HUMAN_DECISION_UNKNOWN_REVIEW_UNIT", record.reviewUnitId, "unknown Review Unit"),
    );
  } else if (unit.caseId !== record.caseId) {
    errors.push(
      error(
        "HUMAN_DECISION_REVIEW_UNIT_CASE_MISMATCH",
        record.reviewUnitId,
        "Review Unit belongs to another Case",
      ),
    );
  }
  if (!ALLOWED_DECISIONS[record.reviewType]?.has(record.decision)) {
    errors.push(
      error(
        "HUMAN_DECISION_DISPOSITION_INVALID",
        record.decision,
        `decision is not valid for ${record.reviewType}`,
      ),
    );
  }
  if (
    record.reviewType === "CALIBRATION_ADMISSION" &&
    record.recommendedDisposition === null
  ) {
    errors.push(
      error(
        "CALIBRATION_RECOMMENDED_DISPOSITION_REQUIRED",
        record.decisionId,
        "Calibration admission must name the recommended exposure disposition",
      ),
    );
  }
  const dispositionByAdmissionDecision = {
    APPROVE: "CALIBRATION_VISIBLE",
    DO_NOT_APPROVE: "REJECTED",
    DEFER: "NEEDS_SPECIALIST_REVIEW",
  };
  if (
    record.reviewType === "CALIBRATION_ADMISSION" &&
    record.recommendedDisposition !== null &&
    dispositionByAdmissionDecision[record.decision] !== record.recommendedDisposition
  ) {
    errors.push(
      error(
        "CALIBRATION_RECOMMENDED_DISPOSITION_INCONSISTENT",
        record.decisionId,
        "recommended disposition must match the admission decision",
      ),
    );
  }
  if (
    record.reviewType !== "CALIBRATION_ADMISSION" &&
    record.recommendedDisposition !== null
  ) {
    errors.push(
      error(
        "RECOMMENDED_DISPOSITION_SCOPE_INVALID",
        record.decisionId,
        "recommended disposition belongs only to Calibration admission review",
      ),
    );
  }
  if (benchmarkCase && record.sourceCaseVersion !== benchmarkCase.version) {
    errors.push(
      error(
        "HUMAN_DECISION_SOURCE_CASE_VERSION_MISMATCH",
        record.caseId,
        "source Case version differs from the current reference",
      ),
    );
  }
  if (envelope && record.sourceEnvelopeVersion !== envelope.version) {
    errors.push(
      error(
        "HUMAN_DECISION_SOURCE_ENVELOPE_VERSION_MISMATCH",
        record.caseId,
        "source Acceptance Envelope version differs from the current reference",
      ),
    );
  }
  if (/CODEX|AUTOMAT|SYSTEM/i.test(`${record.reviewerRef} ${record.reviewerRole}`)) {
    errors.push(
      error(
        "AUTOMATIC_SCIENTIFIC_APPROVAL_FORBIDDEN",
        record.decisionId,
        "Codex or an automated system cannot be recorded as the human reviewer",
      ),
    );
  }

  const expectedQueueType = REVIEW_TYPE_TO_QUEUE_TYPE[record.reviewType];
  for (const reviewItemId of record.reviewItemIds) {
    const item = reviewItemById.get(reviewItemId);
    if (!item) {
      errors.push(
        error("HUMAN_DECISION_UNKNOWN_REVIEW_ITEM", reviewItemId, "unknown Review Queue item"),
      );
      continue;
    }
    if (item.caseId !== record.caseId || item.reviewType !== expectedQueueType) {
      errors.push(
        error(
          "HUMAN_DECISION_UNRELATED_REVIEW_ITEM",
          reviewItemId,
          "decision cannot close an unrelated review item",
        ),
      );
    }
  }
  if (expectedQueueType && record.reviewItemIds.length === 0) {
    errors.push(
      error(
        "HUMAN_DECISION_REVIEW_ITEM_REQUIRED",
        record.decisionId,
        "this review type must reference its Review Queue item",
      ),
    );
  }
  if (!expectedQueueType && record.reviewItemIds.length > 0) {
    errors.push(
      error(
        "EQUIVALENCE_DECISION_CANNOT_CLOSE_QUEUE_ITEM",
        record.decisionId,
        "equivalence adjudication is additional to the B1 Review Queue",
      ),
    );
  }

  const revisionRequired = new Set([
    "ACCEPT_WITH_REVISION",
    "AMBIGUITY_REVISED",
  ]).has(record.decision);
  if (revisionRequired && !record.revision) {
    errors.push(
      error(
        "HUMAN_DECISION_REVISION_DETAILS_REQUIRED",
        record.decisionId,
        "a revision decision requires a complete deterministic revision plan",
      ),
    );
  }
  if (!revisionRequired && record.revision) {
    errors.push(
      error(
        "HUMAN_DECISION_UNEXPECTED_REVISION",
        record.decisionId,
        "a non-revision disposition cannot mutate a reference",
      ),
    );
  }
  if (record.conflictDeclared === "NOT_RECORDED") {
    errors.push(
      error(
        "HUMAN_DECISION_CONFLICT_INFORMATION_MISSING",
        record.decisionId,
        "conflict information must be recorded",
      ),
    );
  }
  if (record.independenceDeclaration === "NOT_RECORDED") {
    errors.push(
      error(
        "HUMAN_DECISION_INDEPENDENCE_INFORMATION_MISSING",
        record.decisionId,
        "reviewer independence for the stated scope must be recorded",
      ),
    );
  }

  return { valid: errors.length === 0, errors };
};

const SIMULATED_ALLOWED_DECISIONS = Object.freeze({
  SCIENTIFIC_REFERENCE: new Set([
    "SIMULATED_ACCEPT",
    "SIMULATED_ACCEPT_WITH_REVISION",
    "SIMULATED_REJECT",
    "SIMULATED_SPECIALIST_UNCERTAINTY",
  ]),
  METHODOLOGICAL_REFERENCE: new Set([
    "SIMULATED_ACCEPT",
    "SIMULATED_ACCEPT_WITH_REVISION",
    "SIMULATED_REJECT",
    "SIMULATED_SPECIALIST_UNCERTAINTY",
  ]),
  AMBIGUITY: new Set([
    "SIMULATED_AMBIGUITY_CONFIRMED",
    "SIMULATED_AMBIGUITY_REVISED",
    "SIMULATED_NOT_ACTUALLY_AMBIGUOUS",
  ]),
  PARENTAGE: new Set([
    "SIMULATED_PARENTAGE_CLEAR",
    "SIMULATED_RELATED_VISIBLE_CASE",
    "SIMULATED_CONTAMINATED",
    "SIMULATED_PARENTAGE_UNRESOLVED",
  ]),
  CALIBRATION_ADMISSION: new Set([
    "SIMULATED_APPROVE_FOR_CALIBRATION",
    "SIMULATED_REJECT",
    "SIMULATED_SPECIALIST_UNCERTAINTY",
  ]),
  SEMANTIC_EQUIVALENCE: new Set([
    "SIMULATED_SEMANTICALLY_EQUIVALENT",
    "SIMULATED_NONCRITICAL_VARIATION",
    "SIMULATED_NOT_EQUIVALENT",
    "SIMULATED_NOT_ADJUDICABLE",
  ]),
});

export const validateSimulatedReviewRecord = (
  record,
  review = loadReviewPackage(),
) => {
  const errors = [];
  if (!validateSimulatedReviewSchema(record)) {
    errors.push(
      ...validateSimulatedReviewSchema.errors.map((entry) =>
        error(
          "SIMULATED_REVIEW_SCHEMA_INVALID",
          entry.dataPath || "/",
          entry.message,
        ),
      ),
    );
    return { valid: false, errors };
  }

  const roleIds = record.roles.map((entry) => entry.reviewerId);
  if (new Set(roleIds).size !== 3) {
    errors.push(
      error(
        "SIMULATED_REVIEW_ROLE_DUPLICATION",
        record.reviewId,
        "the three simulated roles must be distinct",
      ),
    );
  }
  if (
    record.realHumanReviewPerformed ||
    record.pd011IndependentReferencePanelSatisfied ||
    record.finalQualificationEligibility ||
    record.blindEligibility
  ) {
    errors.push(
      error(
        "SIMULATED_EVIDENCE_PROMOTION_FORBIDDEN",
        record.reviewId,
        "simulated evidence cannot become human, formal independent or blind evidence",
      ),
    );
  }

  const caseById = new Map(review.cases.map((entry) => [entry.caseId, entry]));
  const reviewedCaseIds = new Set();
  for (const unit of record.reviewUnits) {
    if (reviewedCaseIds.has(unit.caseId)) {
      errors.push(
        error(
          "SIMULATED_REVIEW_DUPLICATE_CASE",
          unit.caseId,
          "a Case may appear only once in the simulated review",
        ),
      );
    }
    reviewedCaseIds.add(unit.caseId);
    const benchmarkCase = caseById.get(unit.caseId);
    if (!benchmarkCase) {
      errors.push(
        error("SIMULATED_REVIEW_UNKNOWN_CASE", unit.caseId, "unknown Case"),
      );
      continue;
    }
    if (
      new Set(unit.roleOpinions.map((entry) => entry.reviewerId)).size !== 3 ||
      !roleIds.every((reviewerId) =>
        unit.roleOpinions.some((entry) => entry.reviewerId === reviewerId),
      )
    ) {
      errors.push(
        error(
          "SIMULATED_REVIEW_ROLE_COVERAGE_INVALID",
          unit.caseId,
          "every Review Unit needs one separate opinion from each simulated role",
        ),
      );
    }
    if (
      new Set(unit.roleOpinions.map((entry) => entry.analysis)).size !== 3
    ) {
      errors.push(
        error(
          "SIMULATED_REVIEW_ANALYSIS_DUPLICATION",
          unit.caseId,
          "pluralistic review requires three role-specific analyses, not duplicated text",
        ),
      );
    }
    for (const [reviewType, decision] of Object.entries(
      unit.consensus.decisions,
    )) {
      if (!SIMULATED_ALLOWED_DECISIONS[reviewType]?.has(decision)) {
        errors.push(
          error(
            "SIMULATED_REVIEW_DISPOSITION_INVALID",
            `${unit.caseId}.${reviewType}`,
            decision,
          ),
        );
      }
    }
    if (
      unit.candidateSet === "CALIBRATION" &&
      (unit.consensus.referenceDisposition !== "CALIBRATION_VISIBLE" ||
        unit.consensus.referenceReviewBasis !==
          "SIMULATED_PLURALISTIC_EXPERT_REVIEW" ||
        unit.consensus.eligibleForFormalIndependentQualification ||
        unit.consensus.eligibleForBlindQualification)
    ) {
      errors.push(
        error(
          "SIMULATED_CALIBRATION_DISPOSITION_INVALID",
          unit.caseId,
          "development-calibration visibility must retain formal and blind ineligibility",
        ),
      );
    }
  }

  const expectedCases = new Set([
    ...review.calibration.cases.map((entry) => entry.caseId),
    ...review.evaluatorTestMatrix.rows
      .filter((entry) => entry.fixture.includes("-distributed.candidate.json"))
      .map((entry) => entry.caseId),
  ]);
  if (
    expectedCases.size !== reviewedCaseIds.size ||
    [...expectedCases].some((caseId) => !reviewedCaseIds.has(caseId))
  ) {
    errors.push(
      error(
        "SIMULATED_REVIEW_SCOPE_INCOMPLETE",
        record.reviewId,
        "the review must cover all ten Calibration references and five Development equivalence pairs",
      ),
    );
  }

  return { valid: errors.length === 0, errors };
};

const parseSemver = (value) => value.split(".").map(Number);
const greaterVersion = (next, current) => {
  const left = parseSemver(next);
  const right = parseSemver(current);
  for (let index = 0; index < 3; index += 1) {
    if (left[index] > right[index]) return true;
    if (left[index] < right[index]) return false;
  }
  return false;
};

const decodePointerPart = (value) => value.replace(/~1/g, "/").replace(/~0/g, "~");
const replaceAtPointer = (document, pointer, replacementValue) => {
  const parts = pointer.split("/").slice(1).map(decodePointerPart);
  if (parts.length === 0) throw new Error("root replacement is forbidden");
  let owner = document;
  for (const part of parts.slice(0, -1)) {
    if (owner === null || typeof owner !== "object" || !(part in owner)) {
      throw new Error(`unknown JSON pointer segment ${part}`);
    }
    owner = owner[part];
  }
  const finalPart = parts.at(-1);
  if (owner === null || typeof owner !== "object" || !(finalPart in owner)) {
    throw new Error(`unknown JSON pointer target ${pointer}`);
  }
  owner[finalPart] = clone(replacementValue);
};

export const buildReferenceRevision = ({ benchmarkCase, envelope, decision }) => {
  if (!decision.revision) throw new Error("revision plan required");
  if (
    !greaterVersion(decision.revision.resultingCaseVersion, benchmarkCase.version) &&
    !greaterVersion(decision.revision.resultingEnvelopeVersion, envelope.version)
  ) {
    throw new Error("at least one resulting reference version must increase");
  }
  const originalCase = clone(benchmarkCase);
  const originalEnvelope = clone(envelope);
  const originalDigests = {
    caseSha256: sha256(stableJson(originalCase)),
    envelopeSha256: sha256(stableJson(originalEnvelope)),
  };
  const resultingCase = clone(benchmarkCase);
  const resultingEnvelope = clone(envelope);
  for (const change of decision.revision.changes) {
    replaceAtPointer(
      change.target === "CASE" ? resultingCase : resultingEnvelope,
      change.jsonPointer,
      change.replacementValue,
    );
  }
  resultingCase.version = decision.revision.resultingCaseVersion;
  resultingEnvelope.version = decision.revision.resultingEnvelopeVersion;
  const resultingDigests = {
    caseSha256: sha256(stableJson(resultingCase)),
    envelopeSha256: sha256(stableJson(resultingEnvelope)),
  };
  return {
    previous: { benchmarkCase: originalCase, envelope: originalEnvelope },
    resulting: { benchmarkCase: resultingCase, envelope: resultingEnvelope },
    lineage: {
      caseId: benchmarkCase.caseId,
      decisionId: decision.decisionId,
      previousCaseVersion: benchmarkCase.version,
      resultingCaseVersion: resultingCase.version,
      previousEnvelopeVersion: envelope.version,
      resultingEnvelopeVersion: resultingEnvelope.version,
      reason: decision.revision.reason,
      timestamp: decision.createdAt,
      originalDigests,
      resultingDigests,
    },
  };
};

const accepted = (record) => new Set(["ACCEPT", "ACCEPT_WITH_REVISION"]).has(record.decision);
const conflictAcceptable = (record) =>
  new Set(["NO_CONFLICT_DECLARED", "CONFLICT_DECLARED_AND_MANAGED"]).has(
    record.conflictDeclared,
  );

export const evaluateCalibrationGate = ({ benchmarkCase, unit, decisions }) => {
  const unmet = [];
  if (benchmarkCase.purpose !== "CALIBRATION_AUTHORING") {
    unmet.push("DEVELOPMENT_CASE_CANNOT_BECOME_CALIBRATION");
  }
  if (benchmarkCase.exposure.eligibleForBlindQualification) {
    unmet.push("BLIND_ELIGIBILITY_FORBIDDEN");
  }
  const applicable = decisions.filter(
    (record) => record.caseId === benchmarkCase.caseId,
  );
  const scientific = applicable.filter(
    (record) =>
      record.reviewType === "SCIENTIFIC_REFERENCE" &&
      accepted(record) &&
      record.independenceDeclaration === "INDEPENDENT_FOR_STATED_SCOPE",
  );
  const independentScientificReviewers = new Set(scientific.map((record) => record.reviewerRef));
  if (independentScientificReviewers.size < 3) {
    unmet.push("PLURALISTIC_SCIENTIFIC_REFERENCE_REVIEW_REQUIRED");
  }
  if (!scientific.some((record) => record.competencies.includes("SCIENTIFIC_DOMAIN"))) {
    unmet.push("SCIENTIFIC_DOMAIN_COMPETENCE_REQUIRED");
  }
  const requiredTypes = new Set(unit.reviewTypes);
  if (
    requiredTypes.has("METHODOLOGICAL_REVIEW_REQUIRED") &&
    !applicable.some(
      (record) => record.reviewType === "METHODOLOGICAL_REFERENCE" && accepted(record),
    )
  ) {
    unmet.push("METHODOLOGICAL_REVIEW_REQUIRED");
  }
  if (
    requiredTypes.has("AMBIGUITY_ADJUDICATION_REQUIRED") &&
    !applicable.some(
      (record) =>
        record.reviewType === "AMBIGUITY" &&
        new Set([
          "AMBIGUITY_CONFIRMED",
          "AMBIGUITY_REVISED",
          "NOT_ACTUALLY_AMBIGUOUS",
        ]).has(record.decision),
    )
  ) {
    unmet.push("AMBIGUITY_DISPOSITION_REQUIRED");
  }
  if (
    !applicable.some(
      (record) => record.reviewType === "PARENTAGE" && record.decision === "PARENTAGE_CLEAR",
    )
  ) {
    unmet.push("PARENTAGE_REVIEW_REQUIRED");
  }
  if (
    !applicable.some(
      (record) => record.reviewType === "CALIBRATION_ADMISSION" && record.decision === "APPROVE",
    )
  ) {
    unmet.push("CALIBRATION_APPROVAL_REQUIRED");
  }
  if (applicable.some((record) => !conflictAcceptable(record))) {
    unmet.push("REVIEWER_CONFLICT_UNRESOLVED");
  }
  if (
    applicable.some((record) =>
      new Set([
        "REJECT",
        "NEEDS_SPECIALIST_REVIEW",
        "SPECIALIST_REVIEW_REQUIRED",
        "CONTAMINATED_FOR_CALIBRATION",
        "PARENTAGE_REVIEW_UNRESOLVED",
        "DO_NOT_APPROVE",
        "DEFER",
      ]).has(record.decision),
    )
  ) {
    unmet.push("OPEN_REJECTION_DEFERRAL_OR_SPECIALIST_REVIEW");
  }
  return {
    ready: unmet.length === 0,
    disposition: unmet.length === 0 ? "REFERENCE_SET_READY_FOR_CALIBRATION" : "NOT_READY",
    unmet: [...new Set(unmet)],
  };
};

export const promoteCalibrationCaseAtomically = ({
  benchmarkCase,
  registryEntry,
  reviewQueue,
  unit,
  decisions,
  occurredAt,
}) => {
  const gate = evaluateCalibrationGate({ benchmarkCase, unit, decisions });
  if (!gate.ready) return { applied: false, gate };

  const nextCase = clone(benchmarkCase);
  const nextRegistryEntry = clone(registryEntry);
  const nextQueue = clone(reviewQueue);
  nextCase.exposure.exposureStatus = "CALIBRATION_VISIBLE";
  nextCase.exposure.eligibleForCalibration = true;
  nextCase.exposure.eligibleForBlindQualification = false;
  nextCase.exposure.exposureHistory.push({
    eventId: `exposure-${benchmarkCase.caseId.toLowerCase()}-calibration-visible`,
    fromStatus: "DESIGN_ONLY",
    toStatus: "CALIBRATION_VISIBLE",
    occurredAt,
    actorRole: "HUMAN_REFERENCE_REVIEW",
    reason: "Atomic consequence of traceable human decisions; not a calibration result.",
  });
  nextRegistryEntry.exposureStatus = "CALIBRATION_VISIBLE";
  nextRegistryEntry.calibrationDisposition = "APPROVED_FOR_CALIBRATION";
  nextRegistryEntry.parentageStatus = "PARENTAGE_CLEAR";
  nextRegistryEntry.contaminationStatus = "CLEAR";

  const resolutionByReviewId = new Map();
  for (const decision of decisions.filter((entry) => entry.caseId === benchmarkCase.caseId)) {
    for (const reviewItemId of decision.reviewItemIds) {
      const linked = resolutionByReviewId.get(reviewItemId) || [];
      linked.push(decision);
      resolutionByReviewId.set(reviewItemId, linked);
    }
  }
  nextQueue.items = nextQueue.items.map((item) => {
    const linkedDecisions = resolutionByReviewId.get(item.reviewId);
    if (!linkedDecisions) return item;
    return {
      ...item,
      status: "RESOLVED",
      decisionIds: linkedDecisions.map((decision) => decision.decisionId).sort(),
      resolvedAt: linkedDecisions
        .map((decision) => decision.createdAt)
        .sort()
        .at(-1),
      resultingVersion: benchmarkCase.version,
      dispositions: linkedDecisions.map((decision) => decision.decision),
      rationales: linkedDecisions.map((decision) => decision.rationale),
    };
  });
  return {
    applied: true,
    gate,
    benchmarkCase: nextCase,
    registryEntry: nextRegistryEntry,
    reviewQueue: nextQueue,
  };
};

export const validateReviewPackage = (review = loadReviewPackage()) => {
  const errors = [];
  const caseById = new Map(review.cases.map((entry) => [entry.caseId, entry]));
  const envelopeByCaseId = new Map(
    review.envelopes.map((entry) => [entry.caseId, entry]),
  );
  const registryById = new Map(
    review.corpusRegistry.entries.map((entry) => [entry.caseId, entry]),
  );
  const reviewItemById = new Map(
    review.reviewQueue.items.map((entry) => [entry.reviewId, entry]),
  );
  const unitIds = new Set();
  const linkedReviewItems = new Map();

  for (const unit of review.units) {
    if (unitIds.has(unit.reviewUnitId)) {
      errors.push(error("DUPLICATE_REVIEW_UNIT_ID", unit.reviewUnitId, "duplicate Review Unit"));
    }
    unitIds.add(unit.reviewUnitId);
    const benchmarkCase = caseById.get(unit.caseId);
    const envelope = envelopeByCaseId.get(unit.caseId);
    const registryEntry = registryById.get(unit.caseId);
    if (!benchmarkCase || !envelope || !registryEntry) {
      errors.push(
        error("REVIEW_UNIT_UNKNOWN_CASE", unit.reviewUnitId, "Review Unit must reference a real Case pair"),
      );
      continue;
    }
    if (
      unit.sourceVersions.case !== benchmarkCase.version ||
      unit.sourceVersions.acceptanceEnvelope !== envelope.version
    ) {
      errors.push(
        error("REVIEW_UNIT_SOURCE_VERSION_MISMATCH", unit.reviewUnitId, "source versions are stale"),
      );
    }
    if (
      unit.sourceDigests.caseSha256 !== registryEntry.digests.caseSha256 ||
      unit.sourceDigests.acceptanceEnvelopeSha256 !==
        registryEntry.digests.acceptanceEnvelopeSha256
    ) {
      errors.push(
        error("REVIEW_UNIT_SOURCE_DIGEST_MISMATCH", unit.reviewUnitId, "source digests are stale"),
      );
    }
    for (const reviewItemId of unit.reviewItemIds) {
      const item = reviewItemById.get(reviewItemId);
      if (!item || item.caseId !== unit.caseId) {
        errors.push(
          error("REVIEW_UNIT_REVIEW_ITEM_MISMATCH", reviewItemId, "Review item does not belong to unit Case"),
        );
      }
      linkedReviewItems.set(reviewItemId, (linkedReviewItems.get(reviewItemId) || 0) + 1);
    }
    if (unit.humanSheetPath && !fs.existsSync(path.join(REPOSITORY_ROOT, unit.humanSheetPath))) {
      errors.push(
        error("REVIEW_UNIT_HUMAN_SHEET_MISSING", unit.reviewUnitId, unit.humanSheetPath),
      );
    }
  }

  for (const calibrationCase of review.calibration.cases) {
    if (!review.units.some((unit) => unit.caseId === calibrationCase.caseId)) {
      errors.push(
        error("CALIBRATION_REVIEW_UNIT_MISSING", calibrationCase.caseId, "Calibration Case needs a Review Unit"),
      );
    }
  }
  const equivalenceRows = review.evaluatorTestMatrix.rows.filter((row) =>
    row.fixture.includes("-distributed.candidate.json"),
  );
  for (const row of equivalenceRows) {
    const unit = review.units.find((entry) => entry.caseId === row.caseId);
    if (!unit?.equivalencePair) {
      errors.push(
        error("EQUIVALENCE_REVIEW_UNIT_MISSING", row.caseId, "B2 equivalence pair needs a Review Unit"),
      );
    }
  }
  for (const item of review.reviewQueue.items) {
    if (linkedReviewItems.get(item.reviewId) !== 1) {
      errors.push(
        error(
          "REVIEW_QUEUE_ITEM_LINKAGE_INVALID",
          item.reviewId,
          "each original Review Queue item must link to exactly one Review Unit",
        ),
      );
    }
  }

  const decisionIds = new Set();
  for (const decision of review.decisions) {
    if (decisionIds.has(decision.decisionId)) {
      errors.push(error("DUPLICATE_HUMAN_DECISION_ID", decision.decisionId, "duplicate decisionId"));
    }
    decisionIds.add(decision.decisionId);
    errors.push(...validateHumanDecisionRecord(decision, review).errors);
  }

  if (review.decisions.length !== 0) {
    errors.push(
      error(
        "REAL_HUMAN_DECISION_UNEXPECTED",
        "decision-records",
        "this operation records simulated review evidence only",
      ),
    );
  }
  if (review.simulatedReviews.length !== 1) {
    errors.push(
      error(
        "SIMULATED_REVIEW_RECORD_COUNT_INVALID",
        "decision-records",
        "exactly one simulated pluralistic review record is required",
      ),
    );
  } else {
    errors.push(
      ...validateSimulatedReviewRecord(review.simulatedReviews[0], review).errors,
    );
  }

  const simulatedDecisionCount = review.simulatedReviews.reduce(
    (sum, record) =>
      sum +
      record.reviewUnits.reduce(
        (unitSum, unit) =>
          unitSum + Object.keys(unit.consensus.decisions).length,
        0,
      ),
    0,
  );

  const progressCounts = Object.fromEntries(
    ["OPEN", "RESOLVED", "DEFERRED", "REJECTED", "SUPERSEDED"].map(
      (status) => [
        status.toLowerCase(),
        review.progress.items.filter((entry) => entry.status === status).length,
      ],
    ),
  );
  if (
    review.progress.counts.open !== progressCounts.open ||
    review.progress.counts.resolved !== progressCounts.resolved ||
    review.progress.counts.deferred !== progressCounts.deferred ||
    review.progress.counts.simulatedDecisionsRecorded !==
      simulatedDecisionCount ||
    review.progress.counts.realHumanDecisionsRecorded !== 0
  ) {
    errors.push(
      error("REVIEW_PROGRESS_COUNT_MISMATCH", "review-progress", "progress counts are stale"),
    );
  }
  if (
    review.manifest.counts.reviewUnits !== review.units.length ||
    review.manifest.counts.calibrationReviewUnits !== review.calibration.cases.length ||
    review.manifest.counts.equivalenceReviewUnits !== equivalenceRows.length ||
    review.manifest.counts.originalReviewQueueItems !== review.reviewQueue.items.length ||
    review.manifest.counts.simulatedDecisionsRecorded !== simulatedDecisionCount ||
    review.manifest.counts.calibrationVisible !== review.calibration.cases.length
  ) {
    errors.push(
      error("REVIEW_UNIT_MANIFEST_COUNT_MISMATCH", "review-unit-manifest", "manifest counts are stale"),
    );
  }

  for (const gate of review.calibrationGates.cases) {
    const benchmarkCase = caseById.get(gate.caseId);
    if (
      !benchmarkCase ||
      benchmarkCase.exposure.exposureStatus !== "CALIBRATION_VISIBLE" ||
      !benchmarkCase.exposure.eligibleForCalibration ||
      benchmarkCase.exposure.eligibleForBlindQualification ||
      gate.status !== "CALIBRATION_VISIBLE_SIMULATED_REVIEW" ||
      !gate.promotionApplied ||
      gate.referenceReviewBasis !==
        "SIMULATED_PLURALISTIC_EXPERT_REVIEW" ||
      gate.realHumanReferenceReview !== "NOT_PERFORMED" ||
      gate.finalPD011ReferenceEligibility !== "NO" ||
      gate.unmetDevelopmentCalibrationGates.length !== 0
    ) {
      errors.push(
        error(
          "CALIBRATION_GATE_STATE_INVALID",
          gate.caseId,
          "simulated review may open development calibration only and must preserve formal and blind exclusions",
        ),
      );
    }
  }
  if (
    review.equivalenceStatus.pairs.some(
      (pair) =>
        pair.status !== "SIMULATED_EXPERT_CONSENSUS_RECORDED" ||
        pair.disposition !== "SIMULATED_SEMANTICALLY_EQUIVALENT" ||
        pair.independentQualificationEvidence,
    )
  ) {
    errors.push(
      error(
        "EQUIVALENCE_SIMULATED_ADJUDICATION_INVALID",
        "equivalence-status",
        "Level 1 cannot infer equivalence; the simulated disposition must remain non-independent Development evidence",
      ),
    );
  }
  if (review.antiOverfitting.calibrationContentUsedForEvaluatorTuning !== false) {
    errors.push(
      error("CALIBRATION_TUNING_BOUNDARY_VIOLATED", "anti-overfitting", "Calibration cannot tune evaluator"),
    );
  }
  if (
    review.antiOverfitting.semModified ||
    review.antiOverfitting.semExecuted ||
    review.antiOverfitting.llmProviderCalls !== 0
  ) {
    errors.push(
      error("SEM_RUNTIME_BOUNDARY_VIOLATED", "anti-overfitting", "SEM/provider must remain untouched"),
    );
  }
  if (
    review.calibration.cases.some(
      (entry) =>
        entry.exposure.exposureStatus !== "CALIBRATION_VISIBLE" ||
        !entry.exposure.eligibleForCalibration ||
        entry.exposure.eligibleForBlindQualification,
    )
  ) {
    errors.push(
      error(
        "CALIBRATION_REFERENCE_EXPOSURE_INVALID",
        "calibration",
        "simulated references must be CALIBRATION_VISIBLE while remaining blind-ineligible",
      ),
    );
  }

  const versionByCase = new Map(review.versionRegistry.references.map((entry) => [entry.caseId, entry]));
  for (const benchmarkCase of review.cases) {
    const entry = versionByCase.get(benchmarkCase.caseId);
    const registryEntry = registryById.get(benchmarkCase.caseId);
    if (
      !entry ||
      entry.currentCaseVersion !== benchmarkCase.version ||
      entry.currentEnvelopeVersion !== envelopeByCaseId.get(benchmarkCase.caseId).version ||
      entry.caseSha256 !== registryEntry.digests.caseSha256 ||
      entry.envelopeSha256 !== registryEntry.digests.acceptanceEnvelopeSha256 ||
      (benchmarkCase.caseId ===
      "SEM3-CAL-OVARIAN-ULTRASOUND-AMBIGUITY"
        ? entry.resultingVersions.length !== 1 ||
          entry.previousVersions.length !== 1 ||
          entry.currentCaseVersion !== "1.0.1" ||
          entry.currentEnvelopeVersion !== "1.0.1"
        : entry.resultingVersions.length !== 0)
    ) {
      errors.push(
        error("REFERENCE_VERSION_REGISTRY_MISMATCH", benchmarkCase.caseId, "version registry is stale"),
      );
    }
  }

  if (
    review.revisionLineage.revisions.length !== 1 ||
    review.revisionLineage.revisions[0].caseId !==
      "SEM3-CAL-OVARIAN-ULTRASOUND-AMBIGUITY" ||
    review.revisionLineage.revisions[0].resulting.caseSha256 !==
      registryById.get("SEM3-CAL-OVARIAN-ULTRASOUND-AMBIGUITY")?.digests
        .caseSha256 ||
    review.revisionLineage.revisions[0].resulting.envelopeSha256 !==
      registryById.get("SEM3-CAL-OVARIAN-ULTRASOUND-AMBIGUITY")?.digests
        .acceptanceEnvelopeSha256
  ) {
    errors.push(
      error(
        "REFERENCE_REVISION_LINEAGE_INVALID",
        "reference-revision-lineage",
        "the ovarian-ultrasound correction needs one complete before/after lineage",
      ),
    );
  }

  if (
    review.calibrationReferenceSet.cases.length !== review.calibration.cases.length ||
    review.calibrationReferenceSet.status !==
      "READY_FOR_B4_DEVELOPMENT_CALIBRATION" ||
    review.calibrationReferenceSet.referenceReviewBasis !==
      "SIMULATED_PLURALISTIC_EXPERT_REVIEW" ||
    review.calibrationReferenceSet.realHumanReferenceReview !==
      "NOT_PERFORMED" ||
    review.calibrationReferenceSet.finalPD011ReferenceEligibility !== "NO" ||
    review.calibrationReferenceSet.blindEligibility !== "NO" ||
    review.calibrationReferenceSet.calibrationExecutionAuthorizedInB3
  ) {
    errors.push(
      error(
        "CALIBRATION_REFERENCE_SET_INVALID",
        "calibration-reference-set",
        "the set must be B4-ready only and remain outside formal independent and blind qualification",
      ),
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    counts: {
      reviewUnits: review.units.length,
      calibrationReviewUnits: review.calibration.cases.length,
      equivalenceReviewUnits: equivalenceRows.length,
      originalReviewQueueItems: review.reviewQueue.items.length,
      simulatedReviewRecords: review.simulatedReviews.length,
      simulatedReviewerPersonas:
        review.simulatedReviews[0]?.roles.length || 0,
      simulatedDecisionsRecorded: simulatedDecisionCount,
      realHumanDecisionsRecorded: review.decisions.length,
      queueOpen: progressCounts.open,
      queueResolved: progressCounts.resolved,
      queueDeferred: progressCounts.deferred,
      calibrationVisible: review.calibration.cases.filter(
        (entry) => entry.exposure.exposureStatus === "CALIBRATION_VISIBLE",
      ).length,
    },
    scope: "STRUCTURE_TRACEABILITY_AND_GATE_CONSISTENCY_ONLY",
    simulatedScientificJudgmentPerformed: true,
    realHumanScientificJudgmentPerformed: false,
    calibrationPerformed: false,
    semRuntimeExecuted: false,
    providerCalls: 0,
  };
};
