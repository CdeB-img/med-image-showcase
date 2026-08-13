import assert from "node:assert/strict";
import test from "node:test";

import {
  buildReferenceRevision,
  evaluateCalibrationGate,
  loadReviewPackage,
  promoteCalibrationCaseAtomically,
  validateHumanDecisionRecord,
  validateReviewPackage,
  validateSimulatedReviewRecord,
} from "./review-workflow.mjs";

const review = loadReviewPackage();
const queueTypeByDecisionType = {
  SCIENTIFIC_REFERENCE: "SCIENTIFIC_REVIEW_REQUIRED",
  METHODOLOGICAL_REFERENCE: "METHODOLOGICAL_REVIEW_REQUIRED",
  AMBIGUITY: "AMBIGUITY_ADJUDICATION_REQUIRED",
  PARENTAGE: "PARENTAGE_REVIEW_REQUIRED",
  CALIBRATION_ADMISSION: "CALIBRATION_REVIEW_REQUIRED",
};

const unitFor = (caseId) => review.units.find((entry) => entry.caseId === caseId);
const caseFor = (caseId) => review.cases.find((entry) => entry.caseId === caseId);
const envelopeFor = (caseId) =>
  review.envelopes.find((entry) => entry.caseId === caseId);
const registryFor = (caseId) =>
  review.corpusRegistry.entries.find((entry) => entry.caseId === caseId);

const makeDecision = ({
  unit,
  reviewType,
  decision,
  reviewer = "A",
  conflictDeclared = "NO_CONFLICT_DECLARED",
  revision,
}) => ({
  schemaVersion: "1.0.0",
  contractType: "SEM003B3_HUMAN_REFERENCE_DECISION_RECORD",
  decisionId: `SEM3B3-HDR-TEST-${unit.caseId.replace(/^SEM3-/, "")}-${reviewType.replaceAll("_", "-")}-${reviewer}`,
  caseId: unit.caseId,
  reviewUnitId: unit.reviewUnitId,
  reviewType,
  reviewerRef: `REVIEWER-R${reviewer}`,
  reviewerRole: "Test fixture representing a human role; never persisted as evidence",
  competencies: ["SCIENTIFIC_DOMAIN", "METHODOLOGICAL_SEM"],
  decision,
  recommendedDisposition:
    reviewType === "CALIBRATION_ADMISSION" ? "CALIBRATION_VISIBLE" : null,
  rationale: "Synthetic in-memory validator fixture; this is not a scientific decision.",
  scope: "Validator behavior only",
  createdAt: "2026-08-13T20:00:00.000Z",
  conflictDeclared,
  independenceDeclaration: "INDEPENDENT_FOR_STATED_SCOPE",
  sourceCaseVersion: unit.sourceVersions.case,
  sourceEnvelopeVersion: unit.sourceVersions.acceptanceEnvelope,
  reviewItemIds: unit.openReviewPoints
    .filter(
      (entry) => entry.reviewType === queueTypeByDecisionType[reviewType],
    )
    .map((entry) => entry.reviewId),
  evidenceReviewed: [unit.sourcePaths.case, unit.sourcePaths.acceptanceEnvelope],
  supersedes: null,
  ...(revision ? { revision } : {}),
  authority: "HUMAN_REFERENCE_REVIEW",
  status: "FINAL",
});

const completeCalibrationDecisions = (unit) => {
  const decisions = [
    makeDecision({ unit, reviewType: "SCIENTIFIC_REFERENCE", decision: "ACCEPT", reviewer: "A" }),
    makeDecision({ unit, reviewType: "SCIENTIFIC_REFERENCE", decision: "ACCEPT", reviewer: "B" }),
    makeDecision({ unit, reviewType: "SCIENTIFIC_REFERENCE", decision: "ACCEPT", reviewer: "C" }),
    makeDecision({ unit, reviewType: "PARENTAGE", decision: "PARENTAGE_CLEAR", reviewer: "D" }),
    makeDecision({ unit, reviewType: "CALIBRATION_ADMISSION", decision: "APPROVE", reviewer: "E" }),
  ];
  if (unit.reviewTypes.includes("METHODOLOGICAL_REVIEW_REQUIRED")) {
    decisions.push(
      makeDecision({
        unit,
        reviewType: "METHODOLOGICAL_REFERENCE",
        decision: "ACCEPT",
        reviewer: "F",
      }),
    );
  }
  if (unit.reviewTypes.includes("AMBIGUITY_ADJUDICATION_REQUIRED")) {
    decisions.push(
      makeDecision({
        unit,
        reviewType: "AMBIGUITY",
        decision: "AMBIGUITY_CONFIRMED",
        reviewer: "G",
      }),
    );
  }
  return decisions;
};

const atrialUnit = unitFor("SEM3-CAL-ATRIAL-FIBROSIS-ABLATION");
const rhythmUnit = unitFor("SEM3-CAL-CARDIO-RHYTHM-REMODELING");

test("B3-C01 — every Review Unit references a real versioned Case pair", () => {
  const result = validateReviewPackage(review);
  assert.equal(result.valid, true, JSON.stringify(result.errors, null, 2));
  assert.equal(result.counts.reviewUnits, 25);
});

test("B3-C02 — all ten Calibration candidates have a Review Unit", () => {
  const calibrationIds = new Set(review.calibration.cases.map((entry) => entry.caseId));
  const unitIds = new Set(
    review.units.filter((entry) => entry.candidateSet === "CALIBRATION").map((entry) => entry.caseId),
  );
  assert.equal(unitIds.size, 10);
  assert.deepEqual(unitIds, calibrationIds);
});

test("B3-C03 — the five B2 equivalence pairs have an adjudication Review Unit", () => {
  const units = review.units.filter((entry) => entry.equivalencePair);
  assert.equal(units.length, 5);
  assert.ok(
    units.every(
      (entry) =>
        entry.equivalencePair.level1Observation.candidateA === "PASS" &&
        entry.equivalencePair.level1Observation.candidateB === "PASS",
    ),
  );
  assert.ok(
    units.every(
      (entry) =>
        entry.equivalencePair.status ===
        "SIMULATED_EXPERT_CONSENSUS_RECORDED",
    ),
  );
});

test("B3-C04 — a human decision records reviewer provenance, scope and rationale", () => {
  const record = makeDecision({
    unit: atrialUnit,
    reviewType: "SCIENTIFIC_REFERENCE",
    decision: "ACCEPT",
  });
  const result = validateHumanDecisionRecord(record, review);
  assert.equal(result.valid, true, JSON.stringify(result.errors, null, 2));
  assert.match(record.reviewerRef, /^REVIEWER-/);
  assert.ok(record.rationale.length > 0 && record.scope.length > 0);
});

test("B3-C05 — a decision for an unknown Case is rejected", () => {
  const record = makeDecision({
    unit: atrialUnit,
    reviewType: "SCIENTIFIC_REFERENCE",
    decision: "ACCEPT",
  });
  record.caseId = "SEM3-CAL-UNKNOWN-CASE";
  const result = validateHumanDecisionRecord(record, review);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((entry) => entry.code === "HUMAN_DECISION_UNKNOWN_CASE"));
});

test("B3-C06 — a decision cannot close a Review Queue item from another Case", () => {
  const record = makeDecision({
    unit: atrialUnit,
    reviewType: "SCIENTIFIC_REFERENCE",
    decision: "ACCEPT",
  });
  record.reviewItemIds = [review.reviewQueue.items.find((entry) => entry.caseId !== atrialUnit.caseId).reviewId];
  const result = validateHumanDecisionRecord(record, review);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((entry) => entry.code === "HUMAN_DECISION_UNRELATED_REVIEW_ITEM"));
});

test("B3-C07 — ACCEPT_WITH_REVISION creates increased reference versions", () => {
  const benchmarkCase = caseFor(atrialUnit.caseId);
  const envelope = envelopeFor(atrialUnit.caseId);
  const decision = makeDecision({
    unit: atrialUnit,
    reviewType: "SCIENTIFIC_REFERENCE",
    decision: "ACCEPT_WITH_REVISION",
    revision: {
      resultingCaseVersion: "1.0.1",
      resultingEnvelopeVersion: "1.0.0",
      reason: "Bounded test revision",
      changes: [{ target: "CASE", jsonPointer: "/title", replacementValue: `${benchmarkCase.title} revised` }],
    },
  });
  const result = buildReferenceRevision({ benchmarkCase, envelope, decision });
  assert.equal(result.resulting.benchmarkCase.version, "1.0.1");
  assert.equal(result.resulting.envelope.version, "1.0.0");
});

test("B3-C08 — a reference revision preserves the previous objects immutably", () => {
  const benchmarkCase = caseFor(atrialUnit.caseId);
  const envelope = envelopeFor(atrialUnit.caseId);
  const originalCase = structuredClone(benchmarkCase);
  const originalEnvelope = structuredClone(envelope);
  const decision = makeDecision({
    unit: atrialUnit,
    reviewType: "SCIENTIFIC_REFERENCE",
    decision: "ACCEPT_WITH_REVISION",
    revision: {
      resultingCaseVersion: "1.0.1",
      resultingEnvelopeVersion: "1.0.0",
      reason: "Bounded test revision",
      changes: [{ target: "CASE", jsonPointer: "/title", replacementValue: "Revised test title" }],
    },
  });
  buildReferenceRevision({ benchmarkCase, envelope, decision });
  assert.deepEqual(benchmarkCase, originalCase);
  assert.deepEqual(envelope, originalEnvelope);
});

test("B3-C09 — a reference revision records lineage and before/after digests", () => {
  const benchmarkCase = caseFor(atrialUnit.caseId);
  const envelope = envelopeFor(atrialUnit.caseId);
  const decision = makeDecision({
    unit: atrialUnit,
    reviewType: "SCIENTIFIC_REFERENCE",
    decision: "ACCEPT_WITH_REVISION",
    revision: {
      resultingCaseVersion: "1.0.1",
      resultingEnvelopeVersion: "1.0.0",
      reason: "Bounded test revision",
      changes: [{ target: "CASE", jsonPointer: "/title", replacementValue: "Revised test title" }],
    },
  });
  const { lineage } = buildReferenceRevision({ benchmarkCase, envelope, decision });
  assert.equal(lineage.decisionId, decision.decisionId);
  assert.notEqual(lineage.originalDigests.caseSha256, lineage.resultingDigests.caseSha256);
  assert.equal(lineage.previousCaseVersion, "1.0.0");
  assert.equal(lineage.resultingCaseVersion, "1.0.1");
});

test("B3-C10 — Calibration needs plural scientific evidence and all applicable gates", () => {
  const gate = evaluateCalibrationGate({
    benchmarkCase: caseFor(atrialUnit.caseId),
    unit: atrialUnit,
    decisions: completeCalibrationDecisions(atrialUnit),
  });
  assert.equal(gate.ready, true, gate.unmet.join(", "));
});

test("B3-C11 — missing parentage review blocks Calibration", () => {
  const decisions = completeCalibrationDecisions(atrialUnit).filter(
    (entry) => entry.reviewType !== "PARENTAGE",
  );
  const gate = evaluateCalibrationGate({ benchmarkCase: caseFor(atrialUnit.caseId), unit: atrialUnit, decisions });
  assert.equal(gate.ready, false);
  assert.ok(gate.unmet.includes("PARENTAGE_REVIEW_REQUIRED"));
});

test("B3-C12 — applicable methodological review cannot be bypassed", () => {
  const decisions = completeCalibrationDecisions(rhythmUnit).filter(
    (entry) => entry.reviewType !== "METHODOLOGICAL_REFERENCE",
  );
  const gate = evaluateCalibrationGate({ benchmarkCase: caseFor(rhythmUnit.caseId), unit: rhythmUnit, decisions });
  assert.equal(gate.ready, false);
  assert.ok(gate.unmet.includes("METHODOLOGICAL_REVIEW_REQUIRED"));
});

test("B3-C13 — an unresolved applicable ambiguity blocks Calibration", () => {
  const decisions = completeCalibrationDecisions(atrialUnit).filter(
    (entry) => entry.reviewType !== "AMBIGUITY",
  );
  const gate = evaluateCalibrationGate({ benchmarkCase: caseFor(atrialUnit.caseId), unit: atrialUnit, decisions });
  assert.equal(gate.ready, false);
  assert.ok(gate.unmet.includes("AMBIGUITY_DISPOSITION_REQUIRED"));
});

test("B3-C14 — unresolved reviewer conflict information blocks Calibration", () => {
  const decisions = completeCalibrationDecisions(atrialUnit);
  decisions[0].conflictDeclared = "NOT_RECORDED";
  const gate = evaluateCalibrationGate({ benchmarkCase: caseFor(atrialUnit.caseId), unit: atrialUnit, decisions });
  assert.equal(gate.ready, false);
  assert.ok(gate.unmet.includes("REVIEWER_CONFLICT_UNRESOLVED"));
});

test("B3-C15 — a fully satisfied gate promotes Case, registry and queue atomically", () => {
  const result = promoteCalibrationCaseAtomically({
    benchmarkCase: caseFor(atrialUnit.caseId),
    registryEntry: registryFor(atrialUnit.caseId),
    reviewQueue: review.reviewQueue,
    unit: atrialUnit,
    decisions: completeCalibrationDecisions(atrialUnit),
    occurredAt: "2026-08-14T08:00:00.000Z",
  });
  assert.equal(result.applied, true);
  assert.equal(result.benchmarkCase.exposure.exposureStatus, "CALIBRATION_VISIBLE");
  assert.equal(result.registryEntry.exposureStatus, "CALIBRATION_VISIBLE");
  assert.equal(
    result.reviewQueue.items.filter((entry) => entry.caseId === atrialUnit.caseId).every((entry) => entry.status === "RESOLVED"),
    true,
  );
});

test("B3-C16 — a rejected reference can never become Calibration-visible", () => {
  const decisions = completeCalibrationDecisions(atrialUnit);
  decisions.push(makeDecision({ unit: atrialUnit, reviewType: "SCIENTIFIC_REFERENCE", decision: "REJECT", reviewer: "Z" }));
  const result = promoteCalibrationCaseAtomically({
    benchmarkCase: caseFor(atrialUnit.caseId), registryEntry: registryFor(atrialUnit.caseId), reviewQueue: review.reviewQueue,
    unit: atrialUnit, decisions, occurredAt: "2026-08-14T08:00:00.000Z",
  });
  assert.equal(result.applied, false);
});

test("B3-C17 — specialist review required keeps the candidate DESIGN_ONLY", () => {
  const decisions = completeCalibrationDecisions(atrialUnit).filter((entry) => entry.reviewType !== "AMBIGUITY");
  decisions.push(makeDecision({ unit: atrialUnit, reviewType: "AMBIGUITY", decision: "SPECIALIST_REVIEW_REQUIRED", reviewer: "Z" }));
  const gate = evaluateCalibrationGate({ benchmarkCase: caseFor(atrialUnit.caseId), unit: atrialUnit, decisions });
  assert.equal(gate.ready, false);
  assert.ok(gate.unmet.includes("OPEN_REJECTION_DEFERRAL_OR_SPECIALIST_REVIEW"));
});

test("B3-C18 — a Development Case cannot be promoted to Calibration", () => {
  const unit = unitFor("SEM3-DEV-CT-FUNCTIONAL-ESTIMATE-ROLE");
  const gate = evaluateCalibrationGate({ benchmarkCase: caseFor(unit.caseId), unit, decisions: [] });
  assert.equal(gate.ready, false);
  assert.ok(gate.unmet.includes("DEVELOPMENT_CASE_CANNOT_BECOME_CALIBRATION"));
});

test("B3-C19 — Calibration promotion never creates blind eligibility", () => {
  const result = promoteCalibrationCaseAtomically({
    benchmarkCase: caseFor(atrialUnit.caseId), registryEntry: registryFor(atrialUnit.caseId), reviewQueue: review.reviewQueue,
    unit: atrialUnit, decisions: completeCalibrationDecisions(atrialUnit), occurredAt: "2026-08-14T08:00:00.000Z",
  });
  assert.equal(result.applied, true);
  assert.equal(result.benchmarkCase.exposure.eligibleForBlindQualification, false);
});

test("B3-C20 — applying a future promotion preserves the original Review Queue history", () => {
  const original = structuredClone(review.reviewQueue);
  promoteCalibrationCaseAtomically({
    benchmarkCase: caseFor(atrialUnit.caseId), registryEntry: registryFor(atrialUnit.caseId), reviewQueue: review.reviewQueue,
    unit: atrialUnit, decisions: completeCalibrationDecisions(atrialUnit), occurredAt: "2026-08-14T08:00:00.000Z",
  });
  assert.deepEqual(review.reviewQueue, original);
});

test("B3-C21 — every resolved queue item cites its human decision", () => {
  const result = promoteCalibrationCaseAtomically({
    benchmarkCase: caseFor(atrialUnit.caseId), registryEntry: registryFor(atrialUnit.caseId), reviewQueue: review.reviewQueue,
    unit: atrialUnit, decisions: completeCalibrationDecisions(atrialUnit), occurredAt: "2026-08-14T08:00:00.000Z",
  });
  const resolved = result.reviewQueue.items.filter((entry) => entry.caseId === atrialUnit.caseId);
  assert.ok(
    resolved.every(
      (entry) =>
        entry.decisionIds.length > 0 &&
        entry.rationales.length === entry.decisionIds.length &&
        entry.resultingVersion,
    ),
  );
});

test("B3-C22 — Level 1 PASS never infers the simulated semantic disposition", () => {
  assert.equal(review.equivalenceStatus.pairs.length, 5);
  assert.ok(
    review.equivalenceStatus.pairs.every(
      (entry) =>
        entry.status === "SIMULATED_EXPERT_CONSENSUS_RECORDED" &&
        entry.disposition === "SIMULATED_SEMANTICALLY_EQUIVALENT" &&
        entry.independentQualificationEvidence === false,
    ),
  );
  assert.equal(review.equivalenceStatus.resolved, 5);
});

test("B3-C23 — simulated review is never recorded as human approval", () => {
  assert.equal(review.decisions.length, 0);
  assert.equal(review.simulatedReviews.length, 1);
  assert.equal(review.progress.counts.realHumanDecisionsRecorded, 0);
  assert.equal(review.manifest.counts.realHumanDecisionsRecorded, 0);
  assert.equal(review.simulatedReviews[0].realHumanReviewPerformed, false);
});

test("B3-C24 — Calibration content was not used to tune the evaluator", () => {
  assert.equal(review.antiOverfitting.calibrationContentUsedForEvaluatorTuning, false);
  assert.equal(review.evaluatorIdentity.version, "1.0.0");
  assert.equal(review.evaluatorIdentity.configurationDigest, "13f2e4d0b57e200b53e3db52a4fa74cc346a0b65e82b96ac12ca82ba435767b5");
});

test("B3-C25 — packet preparation invokes neither SEM runtime nor provider", () => {
  assert.equal(review.antiOverfitting.semModified, false);
  assert.equal(review.antiOverfitting.semExecuted, false);
  assert.equal(review.antiOverfitting.llmProviderCalls, 0);
});

test("B3-C26 — all three simulated roles review every priority unit separately", () => {
  const record = review.simulatedReviews[0];
  const result = validateSimulatedReviewRecord(record, review);
  assert.equal(result.valid, true, JSON.stringify(result.errors, null, 2));
  assert.equal(record.roles.length, 3);
  assert.equal(record.reviewUnits.length, 15);
  assert.ok(
    record.reviewUnits.every(
      (unit) =>
        unit.roleOpinions.length === 3 &&
        new Set(unit.roleOpinions.map((entry) => entry.reviewerId)).size === 3,
    ),
  );
});

test("B3-C27 — all ten Calibration references are visible only for development calibration", () => {
  assert.equal(review.calibrationGates.calibrationVisible, 10);
  assert.equal(review.calibrationGates.designOnly, 0);
  assert.ok(
    review.calibrationGates.cases.every(
      (entry) =>
        entry.referenceReviewBasis ===
          "SIMULATED_PLURALISTIC_EXPERT_REVIEW" &&
        entry.realHumanReferenceReview === "NOT_PERFORMED" &&
        entry.finalPD011ReferenceEligibility === "NO" &&
        entry.eligibleForBlindQualification === false,
    ),
  );
});

test("B3-C28 — ovarian ultrasound correction is the only versioned reference revision", () => {
  assert.equal(review.revisionLineage.revisions.length, 1);
  const revision = review.revisionLineage.revisions[0];
  assert.equal(revision.caseId, "SEM3-CAL-OVARIAN-ULTRASOUND-AMBIGUITY");
  assert.equal(revision.previous.caseVersion, "1.0.0");
  assert.equal(revision.resulting.caseVersion, "1.0.1");
  assert.deepEqual(revision.semanticScopePreserved, [
    "détection",
    "caractérisation",
    "suivi",
  ]);
});

test("B3-C29 — B3 prepares but does not execute B4 Calibration", () => {
  assert.equal(
    review.calibrationReferenceSet.status,
    "READY_FOR_B4_DEVELOPMENT_CALIBRATION",
  );
  assert.equal(
    review.calibrationReferenceSet.calibrationExecutionAuthorizedInB3,
    false,
  );
  assert.equal(review.antiOverfitting.calibrationExecuted, false);
});
