import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  loadAuthoringPackage,
  validateAuthoringPackage,
} from "./validator.mjs";

const validPackage = () => structuredClone(loadAuthoringPackage());

const errorCodes = (result) => result.errors.map((entry) => entry.code);

describe("SEM-003 benchmark authoring validator", () => {
  it("accepts the three structural authoring examples and their cross-references", () => {
    const result = validateAuthoringPackage(validPackage());

    assert.equal(result.valid, true);
    assert.deepEqual(result.counts, { cases: 3, envelopes: 3 });
    assert.equal(result.scope, "STRUCTURAL_AND_CONTRACTUAL_ONLY");
    assert.equal(result.scientificJudgmentPerformed, false);
  });

  it("rejects a missing required field", () => {
    const authoringPackage = validPackage();
    delete authoringPackage.cases[0].title;

    const result = validateAuthoringPackage(authoringPackage);

    assert.equal(result.valid, false);
    assert.ok(errorCodes(result).includes("CASE_SCHEMA_INVALID"));
  });

  it("rejects a wrong field type", () => {
    const authoringPackage = validPackage();
    authoringPackage.cases[0].source.sourceRequest = 42;

    const result = validateAuthoringPackage(authoringPackage);

    assert.equal(result.valid, false);
    assert.ok(errorCodes(result).includes("CASE_SCHEMA_INVALID"));
  });

  it("rejects duplicate Case identities", () => {
    const authoringPackage = validPackage();
    authoringPackage.cases.push(structuredClone(authoringPackage.cases[0]));

    const result = validateAuthoringPackage(authoringPackage);

    assert.equal(result.valid, false);
    assert.ok(errorCodes(result).includes("DUPLICATE_CASE_ID"));
  });

  it("rejects a Case whose Acceptance Envelope does not exist", () => {
    const authoringPackage = validPackage();
    authoringPackage.envelopes = authoringPackage.envelopes.slice(1);

    const result = validateAuthoringPackage(authoringPackage);

    assert.equal(result.valid, false);
    assert.ok(errorCodes(result).includes("MISSING_ACCEPTANCE_ENVELOPE"));
  });

  it("rejects an unknown SEM-002 property", () => {
    const authoringPackage = validPackage();
    authoringPackage.cases[0].reference.applicableSEM002Properties[0] =
      "PROPERTY_NOT_DEFINED_BY_SEM002";

    const result = validateAuthoringPackage(authoringPackage);

    assert.equal(result.valid, false);
    assert.ok(errorCodes(result).includes("CASE_SCHEMA_INVALID"));
  });

  it("rejects BLIND_SEALED during SEM-003B", () => {
    const authoringPackage = validPackage();
    authoringPackage.cases[0].exposure.exposureStatus = "BLIND_SEALED";
    authoringPackage.cases[0].exposure.exposureHistory[0].toStatus =
      "BLIND_SEALED";

    const result = validateAuthoringPackage(authoringPackage);

    assert.equal(result.valid, false);
    assert.ok(errorCodes(result).includes("CASE_SCHEMA_INVALID"));
  });

  it("rejects an impossible exposure transition", () => {
    const authoringPackage = validPackage();
    authoringPackage.cases[0].exposure.exposureStatus = "CALIBRATION_VISIBLE";
    authoringPackage.cases[0].exposure.eligibleForCalibration = true;
    authoringPackage.cases[0].purpose = "CALIBRATION_AUTHORING";
    authoringPackage.cases[0].exposure.exposureHistory.push({
      eventId: "exposure-illegal-development-to-calibration",
      fromStatus: "DEVELOPMENT_VISIBLE",
      toStatus: "CALIBRATION_VISIBLE",
      occurredAt: "2026-08-13T13:00:00.000Z",
      actorRole: "test",
      reason: "negative transition test",
    });

    const result = validateAuthoringPackage(authoringPackage);

    assert.equal(result.valid, false);
    assert.ok(errorCodes(result).includes("EXPOSURE_TRANSITION_FORBIDDEN"));
  });

  it("rejects a DEVELOPMENT_VISIBLE fixture declared eligible for blind qualification", () => {
    const authoringPackage = validPackage();
    authoringPackage.cases[0].exposure.eligibleForBlindQualification = true;

    const result = validateAuthoringPackage(authoringPackage);

    assert.equal(result.valid, false);
    assert.ok(errorCodes(result).includes("CASE_SCHEMA_INVALID"));
  });

  it("rejects the same semantic obligation in REQUIRED and PROHIBITED", () => {
    const authoringPackage = validPackage();
    authoringPackage.envelopes[0].prohibited[0].semanticKey =
      authoringPackage.envelopes[0].required[0].semanticKey;

    const result = validateAuthoringPackage(authoringPackage);

    assert.equal(result.valid, false);
    assert.ok(
      errorCodes(result).includes("REQUIRED_PROHIBITED_CONTRADICTION"),
    );
  });

  it("rejects a semantic variant that references an unknown obligation", () => {
    const authoringPackage = validPackage();
    authoringPackage.envelopes[0].acceptableSemanticVariants[0].preservedObligationIds.push(
      "req-does-not-exist",
    );

    const result = validateAuthoringPackage(authoringPackage);

    assert.equal(result.valid, false);
    assert.ok(errorCodes(result).includes("UNKNOWN_OBLIGATION_REFERENCE"));
  });

  it("rejects an obligation without criticality", () => {
    const authoringPackage = validPackage();
    delete authoringPackage.envelopes[0].required[0].criticality;

    const result = validateAuthoringPackage(authoringPackage);

    assert.equal(result.valid, false);
    assert.ok(errorCodes(result).includes("ENVELOPE_SCHEMA_INVALID"));
  });

  it("rejects missing Case provenance", () => {
    const authoringPackage = validPackage();
    delete authoringPackage.cases[0].source.provenance;

    const result = validateAuthoringPackage(authoringPackage);

    assert.equal(result.valid, false);
    assert.ok(errorCodes(result).includes("CASE_SCHEMA_INVALID"));
  });

  it("rejects a compensable absolute SEM-002 property", () => {
    const authoringPackage = validPackage();
    authoringPackage.envelopes[0].properties[0].compensable = true;

    const result = validateAuthoringPackage(authoringPackage);

    assert.equal(result.valid, false);
    assert.ok(
      errorCodes(result).includes("SEM002_PROPERTY_CLASSIFICATION_MISMATCH"),
    );
  });

  it("rejects promotion from OPTIONAL_RELEVANT to REQUIRED without justification", () => {
    const authoringPackage = validPackage();
    authoringPackage.envelopes[0].required[0].sourceClassification =
      "PROMOTED_FROM_OPTIONAL";

    const result = validateAuthoringPackage(authoringPackage);

    assert.equal(result.valid, false);
    assert.ok(
      errorCodes(result).includes(
        "OPTIONAL_PROMOTION_JUSTIFICATION_REQUIRED",
      ),
    );
  });
});
