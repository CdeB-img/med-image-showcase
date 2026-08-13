import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { loadCorpus, validateCorpus } from "./corpus-validator.mjs";

const cloneCorpus = () => structuredClone(loadCorpus());
const codes = (result) => new Set(result.errors.map((entry) => entry.code));

describe("SEM-003B1 corpus validator", () => {
  test("accepts every Case, Acceptance Envelope and cross-reference", () => {
    const result = validateCorpus();
    assert.equal(result.valid, true);
    assert.deepEqual(result.counts, {
      developmentCases: 15,
      calibrationCandidates: 10,
      cases: 25,
      envelopes: 25,
      totalConversationTurns: 134,
      reviewItems: 62,
    });
    assert.equal(result.scientificJudgmentPerformed, false);
    assert.equal(result.semRuntimeExecuted, false);
    assert.equal(result.providerCalls, 0);
  });

  test("rejects a duplicated caseId", () => {
    const corpus = cloneCorpus();
    corpus.cases[1].caseId = corpus.cases[0].caseId;
    assert(codes(validateCorpus(corpus)).has("AUTHORING_DUPLICATE_CASE_ID"));
  });

  test("rejects a version mismatch", () => {
    const corpus = cloneCorpus();
    corpus.registry.entries[0].version = "9.9.9";
    assert(codes(validateCorpus(corpus)).has("VERSION_MISMATCH"));
  });

  test("rejects a Development case eligible for blind qualification", () => {
    const corpus = cloneCorpus();
    corpus.development.cases[0].exposure.eligibleForBlindQualification = true;
    const resultCodes = codes(validateCorpus(corpus));
    assert(resultCodes.has("AUTHORING_CASE_SCHEMA_INVALID"));
    assert(resultCodes.has("DEVELOPMENT_EXPOSURE_INVALID"));
  });

  test("keeps simulated Calibration references visible but blind-ineligible", () => {
    const corpus = cloneCorpus();
    corpus.calibration.cases[0].exposure.eligibleForCalibration = false;
    assert(
      codes(validateCorpus(corpus)).has(
        "CALIBRATION_DEVELOPMENT_REFERENCE_GATE_INVALID",
      ),
    );
  });

  test("rejects H01-H30 as source material", () => {
    const corpus = cloneCorpus();
    corpus.cases[0].source.provenance.originalSource = "Derived from H12";
    assert(codes(validateCorpus(corpus)).has("HISTORICAL_LEGACY_SOURCE_REFERENCE_FORBIDDEN"));
  });

  test("rejects an exposed SEM-003 example reused for Calibration", () => {
    const corpus = cloneCorpus();
    corpus.calibration.cases[0].source.provenance.originalSource = "Derived from SEM3-EX-UNDER-SPECIFIED";
    assert(codes(validateCorpus(corpus)).has("EXPOSED_EXAMPLE_REUSED_FOR_CALIBRATION"));
  });

  test("limits evaluator demonstrations to five Development cases", () => {
    const corpus = cloneCorpus();
    const demonstration = corpus.development.envelopes.find(
      (entry) => entry.evaluationDemonstrations.length > 0,
    ).evaluationDemonstrations;
    const sixthEnvelope = corpus.development.envelopes.find(
      (entry) => entry.evaluationDemonstrations.length === 0,
    );
    sixthEnvelope.evaluationDemonstrations = structuredClone(demonstration);
    assert(
      codes(validateCorpus(corpus)).has(
        "EVALUATOR_DEMONSTRATION_CASE_LIMIT_EXCEEDED",
      ),
    );
  });

  test("rejects evaluator demonstrations in Calibration candidates", () => {
    const corpus = cloneCorpus();
    const demonstration = corpus.development.envelopes.find(
      (entry) => entry.evaluationDemonstrations.length > 0,
    ).evaluationDemonstrations;
    corpus.calibration.envelopes[0].evaluationDemonstrations =
      structuredClone(demonstration);
    assert(
      codes(validateCorpus(corpus)).has(
        "CALIBRATION_EVALUATOR_DEMONSTRATION_FORBIDDEN",
      ),
    );
  });

  test("rejects an unknown SEM-002 property", () => {
    const corpus = cloneCorpus();
    corpus.cases[0].reference.applicableSEM002Properties[0] = "PROPERTY_UNKNOWN";
    assert(codes(validateCorpus(corpus)).has("AUTHORING_CASE_SCHEMA_INVALID"));
  });

  test("rejects REQUIRED and OPTIONAL_RELEVANT sharing one semanticKey", () => {
    const corpus = cloneCorpus();
    const envelope = corpus.envelopes[0];
    envelope.optionalRelevant[0].semanticKey = envelope.required[0].semanticKey;
    assert(codes(validateCorpus(corpus)).has("AUTHORING_REQUIRED_OPTIONAL_CONTRADICTION"));
  });

  test("rejects a PROHIBITED item with an unknown failure class", () => {
    const corpus = cloneCorpus();
    corpus.envelopes[0].prohibited[0].failureClass = "NOT_A_FAILURE_CLASS";
    assert(codes(validateCorpus(corpus)).has("AUTHORING_ENVELOPE_SCHEMA_INVALID"));
  });

  test("rejects non-contiguous conversation turns", () => {
    const corpus = cloneCorpus();
    const multiTurnCase = corpus.cases.find(
      (benchmarkCase) => benchmarkCase.source.conversationTurns.length > 1,
    );
    assert(multiTurnCase);
    multiTurnCase.source.conversationTurns[1].turnId = "turn-9";
    assert(codes(validateCorpus(corpus)).has("CONVERSATION_TURN_ORDER_INVALID"));
  });

  test("requires correction cases to preserve current and historical state", () => {
    const corpus = cloneCorpus();
    const caseId = corpus.registry.entries.find((entry) =>
      entry.features.includes("CORRECTION"),
    ).caseId;
    const envelope = corpus.envelopes.find((entry) => entry.caseId === caseId);
    envelope.required = envelope.required.filter(
      (entry) => !entry.semanticKey.endsWith(".historical-state"),
    );
    assert(codes(validateCorpus(corpus)).has("CORRECTION_STATE_REPRESENTATION_MISSING"));
  });

  test("detects a stale coverage matrix", () => {
    const corpus = cloneCorpus();
    corpus.coverage.summary.totalCases = 999;
    assert(codes(validateCorpus(corpus)).has("COVERAGE_SUMMARY_MISMATCH"));
  });

  test("detects stale Case and Acceptance Envelope digests", () => {
    const corpus = cloneCorpus();
    corpus.registry.entries[0].digests.caseSha256 = "0".repeat(64);
    corpus.registry.entries[0].digests.acceptanceEnvelopeSha256 = "1".repeat(64);
    const resultCodes = codes(validateCorpus(corpus));
    assert(resultCodes.has("CASE_DIGEST_MISMATCH"));
    assert(resultCodes.has("ENVELOPE_DIGEST_MISMATCH"));
  });

  test("detects a stale manifest artifact digest", () => {
    const corpus = cloneCorpus();
    corpus.manifest.artifacts.coverage.sha256 = "0".repeat(64);
    assert(codes(validateCorpus(corpus)).has("MANIFEST_ARTIFACT_DIGEST_MISMATCH"));
  });

  test("detects an incomplete corpus file inventory", () => {
    const corpus = cloneCorpus();
    corpus.manifest.fileInventory.pop();
    assert(codes(validateCorpus(corpus)).has("MANIFEST_FILE_INVENTORY_MISMATCH"));
  });

  test("requires scientific, calibration and parentage reviews for every Calibration candidate", () => {
    const corpus = cloneCorpus();
    const caseId = corpus.calibration.cases[0].caseId;
    corpus.reviewQueue.items = corpus.reviewQueue.items.filter(
      (item) =>
        item.caseId !== caseId || item.reviewType !== "PARENTAGE_REVIEW_REQUIRED",
    );
    assert(codes(validateCorpus(corpus)).has("CALIBRATION_REVIEW_QUEUE_INCOMPLETE"));
  });

  test("rejects a declared contamination blocker", () => {
    const corpus = cloneCorpus();
    corpus.parentage.interSetOverlap.contaminationBlockerCount = 1;
    assert(codes(validateCorpus(corpus)).has("CONTAMINATION_BLOCKER_PRESENT"));
  });
});
