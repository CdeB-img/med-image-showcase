import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertContract } from "./contracts.mjs";

const CORE_ROOT = path.dirname(fileURLToPath(import.meta.url));
const CAPABILITY_PATH = path.resolve(
  CORE_ROOT,
  "../registry/adjudication-authority-capabilities.json",
);

export const ADJUDICATION_AUTHORITY_CAPABILITIES = Object.freeze(
  JSON.parse(fs.readFileSync(CAPABILITY_PATH, "utf8")),
);

const capabilityByAuthority = new Map(
  ADJUDICATION_AUTHORITY_CAPABILITIES.authorities.map((entry) => [
    entry.authorityClass,
    entry,
  ]),
);

const usageByMode = Object.freeze({
  DEVELOPMENT_SYNTHETIC: "DEVELOPMENT_EVALUATOR_TESTING",
  CALIBRATION_SYNTHETIC: "DEVELOPMENT_CALIBRATION",
  HUMAN_ADJUDICATION: "GOVERNED_HUMAN_ADJUDICATION",
});

const eligibilityKeyByUsage = Object.freeze({
  DEVELOPMENT_EVALUATOR_TESTING: "developmentEvaluatorTesting",
  DEVELOPMENT_CALIBRATION: "developmentCalibration",
});

const contractError = (code, message, details = []) => {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
};

const genericFromLegacyHumanRecord = ({ record, benchmarkCase, candidateOutput }) => ({
  schemaVersion: "1.0.0",
  contractType: "BENCHMARK_EVALUATION_ADJUDICATION_DECISION_RECORD",
  recordId: record.recordId.replace("SEM3-HDR-", "SEM3-ADR-LEGACY-HUMAN-"),
  decision: record.decision,
  rationale: record.rationale,
  authorityClass: "HUMAN_ADJUDICATION",
  evidenceBasis: "HUMAN_REVIEW_EVIDENCE",
  sourceDecisionId: record.recordId,
  reviewBasis: "HUMAN_ADJUDICATION",
  eligibility: {
    developmentEvaluatorTesting: true,
    developmentCalibration: false,
    formalIndependentQualification: false,
    blindReferenceAdmission: false,
    pd011FinalEvidence: false,
  },
  provenance: {
    sourceRecordRef: `evaluationInput.humanDecisionRecords.${record.recordId}`,
    recordedAt: record.decidedAt,
    realHumanReview: true,
  },
  target: {
    scope: "ADJUDICATION_PACKET",
    caseId: benchmarkCase.caseId,
    candidateIds: [candidateOutput.candidateId],
    packetIds: [record.packetId],
    propertyIds: [],
  },
  status: "FINAL",
});

const assertAuthorityBoundary = (record, evaluationMode) => {
  const capability = capabilityByAuthority.get(record.authorityClass);
  if (!capability) {
    throw contractError(
      "ADJUDICATION_AUTHORITY_UNSUPPORTED",
      `Unsupported adjudication authority ${record.authorityClass}`,
    );
  }
  const usage = usageByMode[evaluationMode];
  if (!usage || !capability.allowedOperationalUses.includes(usage)) {
    throw contractError(
      "ADJUDICATION_AUTHORITY_USAGE_FORBIDDEN",
      `${record.authorityClass} is not allowed for ${evaluationMode}`,
    );
  }
  const eligibilityKey = eligibilityKeyByUsage[usage];
  if (eligibilityKey && record.eligibility[eligibilityKey] !== true) {
    throw contractError(
      "ADJUDICATION_RECORD_NOT_ELIGIBLE_FOR_USAGE",
      `${record.recordId} is not eligible for ${usage}`,
    );
  }
  if (
    record.authorityClass === "SIMULATED_PLURALISTIC_EXPERT_REVIEW" &&
    (record.provenance.realHumanReview ||
      record.eligibility.formalIndependentQualification ||
      record.eligibility.blindReferenceAdmission ||
      record.eligibility.pd011FinalEvidence)
  ) {
    throw contractError(
      "SIMULATED_AUTHORITY_PROMOTION_FORBIDDEN",
      "Simulated adjudication cannot be relabeled as human, blind, independent, or PD-011 final evidence",
    );
  }
};

export const prepareAdjudicationDecisions = ({
  adjudicationDecisionRecords = [],
  humanDecisionRecords = [],
  evaluationMode,
  benchmarkCase,
  candidateOutput,
}) => {
  const records = [
    ...adjudicationDecisionRecords,
    ...humanDecisionRecords.map((record) => {
      assertContract("humanDecisionRecord", record);
      return genericFromLegacyHumanRecord({ record, benchmarkCase, candidateOutput });
    }),
  ];
  const byPacketId = new Map();

  for (const record of records) {
    const isLegacy = record.recordId.startsWith("SEM3-ADR-LEGACY-HUMAN-");
    if (!isLegacy) assertContract("adjudicationDecisionRecord", record);
    assertAuthorityBoundary(record, evaluationMode);
    if (record.target.caseId !== benchmarkCase.caseId) {
      throw contractError(
        "ADJUDICATION_CASE_BINDING_MISMATCH",
        `${record.recordId} targets another benchmark case`,
      );
    }
    if (!record.target.candidateIds.includes(candidateOutput.candidateId)) {
      throw contractError(
        "ADJUDICATION_CANDIDATE_BINDING_MISMATCH",
        `${record.recordId} does not target ${candidateOutput.candidateId}`,
      );
    }
    for (const packetId of record.target.packetIds) {
      if (byPacketId.has(packetId)) {
        throw contractError(
          "DUPLICATE_ADJUDICATION_PACKET_DECISION",
          `Multiple decisions target ${packetId}`,
        );
      }
      byPacketId.set(packetId, { record, packetId });
    }
  }

  return {
    byPacketId,
    consumedPacketIds: new Set(),
    assertAllConsumed() {
      const unused = [...byPacketId.keys()].filter(
        (packetId) => !this.consumedPacketIds.has(packetId),
      );
      if (unused.length > 0) {
        throw contractError(
          "ADJUDICATION_TARGET_NOT_PRODUCED",
          "Decision records target adjudication packets absent from this evaluation",
          unused,
        );
      }
    },
  };
};

export const applyAdjudicationDecision = ({ prepared, packet, propertyId }) => {
  const binding = prepared.byPacketId.get(packet.packetId);
  if (!binding) return null;
  const { record } = binding;
  if (record.target.propertyIds.length > 0 && !record.target.propertyIds.includes(propertyId)) {
    throw contractError(
      "ADJUDICATION_PROPERTY_BINDING_MISMATCH",
      `${record.recordId} does not cover ${propertyId}`,
    );
  }
  prepared.consumedPacketIds.add(packet.packetId);
  return {
    recordId: record.recordId,
    packetId: packet.packetId,
    decision: record.decision,
    authorityClass: record.authorityClass,
    evidenceBasis: record.evidenceBasis,
    sourceDecisionId: record.sourceDecisionId,
    reviewBasis: record.reviewBasis,
    eligibility: { ...record.eligibility },
    provenance: { ...record.provenance },
  };
};
