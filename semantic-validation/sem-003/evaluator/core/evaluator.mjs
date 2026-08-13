import { assertContract } from "./contracts.mjs";
import { loadEvaluatorIdentity } from "./identity.mjs";
import {
  ABSOLUTE_PROPERTY_IDS,
  PROPERTY_ORDER,
  PROPERTY_REGISTRY,
} from "./registry.mjs";
import { validateAuthoringPackage } from "../../authoring/validator.mjs";
import {
  applyAdjudicationDecision,
  prepareAdjudicationDecisions,
} from "./adjudication.mjs";

const STATISTICAL_PROPERTIES = new Set(
  PROPERTY_ORDER.filter((propertyId) => !PROPERTY_REGISTRY[propertyId].absolute),
);

const EQUIVALENCE_PROPERTIES = new Set([
  "PROPERTY_SEMANTIC_EQUIVALENCE_RECOGNIZED",
  "PROPERTY_NONCRITICAL_FORM_VARIATION_ALLOWED",
]);

const toSlug = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const unique = (values) => [...new Set(values)];

const indexUnique = (entries, key, label) => {
  const index = new Map();
  const duplicates = [];
  for (const entry of entries) {
    const value = entry[key];
    if (index.has(value)) duplicates.push(`${label}:${value}`);
    index.set(value, entry);
  }
  return { index, duplicates };
};

const contractError = (code, message, details = []) => {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
};

const assertEvaluationBindings = (input) => {
  const {
    benchmarkCase,
    acceptanceEnvelope,
    candidateOutput,
    evaluationMode,
    benchmarkSet,
  } = input;
  if (benchmarkSet !== "BLIND") {
    const authoring = validateAuthoringPackage({
      cases: [benchmarkCase],
      envelopes: [acceptanceEnvelope],
    });
    if (!authoring.valid) {
      throw contractError(
        "AUTHORING_REFERENCE_INVALID",
        "Case and Acceptance Envelope are not a valid SEM-003B authoring pair",
        authoring.errors,
      );
    }
  }

  const mismatches = [];
  if (acceptanceEnvelope.caseId !== benchmarkCase.caseId) mismatches.push("envelope.caseId");
  if (candidateOutput.caseId !== benchmarkCase.caseId) mismatches.push("candidate.caseId");
  if (candidateOutput.caseVersion !== benchmarkCase.version) mismatches.push("candidate.caseVersion");
  if (candidateOutput.envelopeId !== acceptanceEnvelope.envelopeId) mismatches.push("candidate.envelopeId");
  if (candidateOutput.envelopeVersion !== acceptanceEnvelope.version) mismatches.push("candidate.envelopeVersion");
  if (candidateOutput.evaluationMode !== evaluationMode) mismatches.push("candidate.evaluationMode");
  if (benchmarkCase.reference.acceptanceEnvelopeId !== acceptanceEnvelope.envelopeId) {
    mismatches.push("case.reference.acceptanceEnvelopeId");
  }
  if (mismatches.length > 0) {
    throw contractError(
      "EVALUATION_BINDING_MISMATCH",
      `Evaluation input bindings differ: ${mismatches.join(", ")}`,
      mismatches,
    );
  }

  if (
    evaluationMode === "DEVELOPMENT_SYNTHETIC" &&
    (candidateOutput.sourceType !== "EVALUATOR_DEVELOPMENT_SYNTHETIC" ||
      candidateOutput.purpose !== "SCIENTIFIC_UNDERSTANDING_EVALUATOR_DEVELOPMENT" ||
      benchmarkCase.purpose !== "DEVELOPMENT_AUTHORING" ||
      benchmarkCase.exposure.exposureStatus !== "DEVELOPMENT_VISIBLE")
  ) {
    throw contractError(
      "DEVELOPMENT_MODE_BOUNDARY_VIOLATION",
      "DEVELOPMENT_SYNTHETIC accepts only exposed Development cases and synthetic evaluator candidates",
    );
  }
  if (
    evaluationMode === "CALIBRATION_SYNTHETIC" &&
    (candidateOutput.sourceType !== "B4_SYNTHETIC_CALIBRATION" ||
      candidateOutput.purpose !== "SCIENTIFIC_UNDERSTANDING_EVALUATOR_CALIBRATION" ||
      benchmarkCase.purpose !== "CALIBRATION_AUTHORING" ||
      benchmarkCase.exposure.exposureStatus !== "CALIBRATION_VISIBLE" ||
      benchmarkCase.exposure.eligibleForCalibration !== true ||
      benchmarkCase.exposure.eligibleForBlindQualification !== false)
  ) {
    throw contractError(
      "CALIBRATION_MODE_BOUNDARY_VIOLATION",
      "CALIBRATION_SYNTHETIC accepts only visible Calibration references and explicitly synthetic B4 candidates",
    );
  }
  if (
    evaluationMode === "FUTURE_SEM_RUNTIME" &&
    (benchmarkSet !== "BLIND" ||
      benchmarkCase.contractType !== "SEM003C_BLIND_BENCHMARK_CASE" ||
      benchmarkCase.purpose !== "BLIND_QUALIFICATION_AUTHORING" ||
      benchmarkCase.exposure.exposureStatus !== "BLIND_SEALED" ||
      benchmarkCase.exposure.eligibleForBlindQualification !== true ||
      acceptanceEnvelope.contractType !== "SEM003C_BLIND_ACCEPTANCE_ENVELOPE" ||
      candidateOutput.sourceType !== "FUTURE_SEM_RUNTIME_OUTPUT" ||
      candidateOutput.purpose !==
        "SCIENTIFIC_UNDERSTANDING_EVALUATOR_BLIND_QUALIFICATION")
  ) {
    throw contractError(
      "RUNTIME_MODE_BOUNDARY_VIOLATION",
      "FUTURE_SEM_RUNTIME requires a sealed Blind reference, a Blind Qualification candidate, and a future runtime adapter output",
    );
  }
  if (
    evaluationMode === "HUMAN_ADJUDICATION" &&
    candidateOutput.sourceType !== "HUMAN_ADJUDICATED_OUTPUT"
  ) {
    throw contractError(
      "HUMAN_MODE_BOUNDARY_VIOLATION",
      "HUMAN_ADJUDICATION requires an explicitly human-adjudicated candidate binding",
    );
  }
};

const decisionToJudgment = (decision) => {
  if (["SATISFIED", "EQUIVALENT", "ACCEPTABLE_WITH_RESERVE"].includes(decision)) {
    return "SATISFIED";
  }
  if (["VIOLATED", "NON_EQUIVALENT"].includes(decision)) return "VIOLATED";
  return "NOT_EVALUABLE";
};

const permittedDecisionsFor = (propertyId) =>
  EQUIVALENCE_PROPERTIES.has(propertyId)
    ? ["EQUIVALENT", "ACCEPTABLE_WITH_RESERVE", "NON_EQUIVALENT", "NOT_ADJUDICABLE"]
    : ["SATISFIED", "VIOLATED", "NOT_ADJUDICABLE"];

const makePacket = ({ benchmarkCase, candidateOutput, property, obligationRefs, evidenceRefs }) => ({
  schemaVersion: "1.0.0",
  contractType: "BENCHMARK_EVALUATION_ADJUDICATION_PACKET",
  packetId: `SEM3-ADJ-${candidateOutput.candidateId.replace("SEM3-EVAL-CAND-", "")}-${property.alias}`,
  caseId: benchmarkCase.caseId,
  candidateId: candidateOutput.candidateId,
  propertyIds: [property.id],
  reason:
    "The contractual mappings do not establish the non-trivial scientific judgment required by this property.",
  sourceRequestRef: `${benchmarkCase.caseId}.source.sourceRequest`,
  obligationRefs: unique(obligationRefs),
  candidateEvidenceRefs: unique(evidenceRefs),
  decisionRequested:
    "Judge the property against the Acceptance Envelope without changing the reference or promoting candidate content.",
  permittedDecisions: permittedDecisionsFor(property.id),
  potentialFailureClasses: [property.failureClass],
  status: "OPEN",
});

const summaryFromJudgment = (judgment, evidenceRefs = []) => ({
  status: judgment === "SATISFIED" ? "PRESERVED" : judgment,
  evidenceRefs: unique(evidenceRefs),
  adjudicationRequired: judgment === "ADJUDICATION_REQUIRED",
});

export const evaluateScientificUnderstanding = (input) => {
  assertContract("evaluationInput", input);
  assertEvaluationBindings(input);

  const { benchmarkCase, acceptanceEnvelope, candidateOutput, evaluationMode } = input;
  const identity = loadEvaluatorIdentity();
  const envelopePropertyIds = new Set(
    acceptanceEnvelope.properties.map((entry) => entry.propertyId),
  );
  const candidateElementIds = new Set(
    candidateOutput.semanticElements.map((entry) => entry.elementId),
  );
  const obligationMappings = indexUnique(
    candidateOutput.obligationMappings,
    "obligationId",
    "obligation",
  );
  const prohibitionSignals = indexUnique(
    candidateOutput.prohibitionSignals,
    "prohibitionId",
    "prohibition",
  );
  const optionalMappings = indexUnique(
    candidateOutput.optionalCandidateMappings,
    "candidateId",
    "optional",
  );
  const ambiguityMappings = indexUnique(
    candidateOutput.ambiguityMappings,
    "ambiguityId",
    "ambiguity",
  );
  const ownershipMappings = indexUnique(
    candidateOutput.ownershipMappings,
    "boundaryId",
    "ownership",
  );
  const preparedDecisions = prepareAdjudicationDecisions({
    adjudicationDecisionRecords: input.adjudicationDecisionRecords || [],
    humanDecisionRecords: input.humanDecisionRecords || [],
    evaluationMode,
    benchmarkCase,
    candidateOutput,
  });
  const appliedDecisions = [];

  let findingSequence = 0;
  const findings = [];
  const addFinding = ({ stage, code, failureClass, propertyIds, referenceId, message }) => {
    findingSequence += 1;
    const finding = {
      findingId: `finding-${String(findingSequence).padStart(3, "0")}-${toSlug(referenceId)}`,
      stage,
      code,
      failureClass,
      propertyIds: unique(propertyIds),
      referenceId,
      message,
      isFirstCause: false,
      downstreamOf: null,
    };
    findings.push(finding);
    return finding;
  };

  if (candidateOutput.executionStatus === "PROVIDER_FAILURE") {
    addFinding({
      stage: "EXECUTION",
      code: "PROVIDER_OUTPUT_UNAVAILABLE",
      failureClass: "PROVIDER_EXECUTION_FAILURE",
      propertyIds: [],
      referenceId: "candidate.executionStatus",
      message: "The synthetic boundary fixture declares that no semantic output is available from the provider.",
    });
  } else if (candidateOutput.executionStatus === "NOT_EVALUABLE") {
    addFinding({
      stage: "EXECUTION",
      code: "CANDIDATE_OUTPUT_NOT_EVALUABLE",
      failureClass: "QUALIFICATION_PROTOCOL_FAILURE",
      propertyIds: [],
      referenceId: "candidate.executionStatus",
      message: "The candidate output is explicitly unavailable for a scientifically defensible judgment.",
    });
  }

  for (const duplicate of [
    ...obligationMappings.duplicates,
    ...prohibitionSignals.duplicates,
    ...optionalMappings.duplicates,
    ...ambiguityMappings.duplicates,
    ...ownershipMappings.duplicates,
  ]) {
    addFinding({
      stage: "CONTRACT",
      code: "DUPLICATE_CANDIDATE_MAPPING",
      failureClass: "QUALIFICATION_PROTOCOL_FAILURE",
      propertyIds: [],
      referenceId: duplicate,
      message: "A normalized candidate mapping identifier is duplicated.",
    });
  }

  const requiredIds = new Set(acceptanceEnvelope.required.map((entry) => entry.obligationId));
  const prohibitedIds = new Set(acceptanceEnvelope.prohibited.map((entry) => entry.prohibitionId));
  const optionalIds = new Set(acceptanceEnvelope.optionalRelevant.map((entry) => entry.candidateId));
  const ambiguityIds = new Set(acceptanceEnvelope.admissibleAmbiguities.map((entry) => entry.ambiguityId));
  const ownershipIds = new Set(acceptanceEnvelope.ownershipBoundaries.map((entry) => entry.boundaryId));

  const unknownMappings = [
    ...[...obligationMappings.index.keys()].filter((id) => !requiredIds.has(id)).map((id) => `obligation:${id}`),
    ...[...prohibitionSignals.index.keys()].filter((id) => !prohibitedIds.has(id)).map((id) => `prohibition:${id}`),
    ...[...optionalMappings.index.keys()].filter((id) => !optionalIds.has(id)).map((id) => `optional:${id}`),
    ...[...ambiguityMappings.index.keys()].filter((id) => !ambiguityIds.has(id)).map((id) => `ambiguity:${id}`),
    ...[...ownershipMappings.index.keys()].filter((id) => !ownershipIds.has(id)).map((id) => `ownership:${id}`),
  ];
  for (const unknown of unknownMappings) {
    addFinding({
      stage: "CONTRACT",
      code: "UNKNOWN_REFERENCE_MAPPING",
      failureClass: "QUALIFICATION_PROTOCOL_FAILURE",
      propertyIds: [],
      referenceId: unknown,
      message: "The candidate references an identifier absent from the Acceptance Envelope.",
    });
  }

  for (const obligation of acceptanceEnvelope.required) {
    const mapping = obligationMappings.index.get(obligation.obligationId);
    if (!mapping || mapping.status === "NOT_EVALUABLE") {
      addFinding({
        stage: "LEVEL_1",
        code: "REQUIRED_OBLIGATION_NOT_EVALUABLE",
        failureClass: "QUALIFICATION_PROTOCOL_FAILURE",
        propertyIds: obligation.propertyIds,
        referenceId: obligation.obligationId,
        message: "A required obligation has no evaluable normalized mapping.",
      });
      continue;
    }
    for (const elementRef of mapping.candidateElementRefs) {
      if (!candidateElementIds.has(elementRef)) {
        addFinding({
          stage: "CONTRACT",
          code: "UNKNOWN_CANDIDATE_ELEMENT_REFERENCE",
          failureClass: "QUALIFICATION_PROTOCOL_FAILURE",
          propertyIds: obligation.propertyIds,
          referenceId: elementRef,
          message: "An obligation mapping points to an unknown candidate element.",
        });
      }
    }
    if (["OMITTED", "CONTRADICTED"].includes(mapping.status)) {
      for (const propertyId of obligation.propertyIds) {
        addFinding({
          stage: "LEVEL_1",
          code:
            mapping.status === "OMITTED"
              ? "REQUIRED_OBLIGATION_OMITTED"
              : "REQUIRED_OBLIGATION_CONTRADICTED",
          failureClass: PROPERTY_REGISTRY[propertyId].failureClass,
          propertyIds: [propertyId],
          referenceId: obligation.obligationId,
          message: `The normalized candidate marks a required obligation as ${mapping.status}.`,
        });
      }
    }
  }

  for (const prohibition of acceptanceEnvelope.prohibited) {
    const signal = prohibitionSignals.index.get(prohibition.prohibitionId);
    if (!signal || signal.status === "NOT_EVALUABLE") {
      addFinding({
        stage: "LEVEL_1",
        code: "PROHIBITION_NOT_EVALUABLE",
        failureClass: "QUALIFICATION_PROTOCOL_FAILURE",
        propertyIds: prohibition.propertyIds,
        referenceId: prohibition.prohibitionId,
        message: "A prohibited condition has no evaluable normalized signal.",
      });
    } else if (signal.status === "PRESENT") {
      addFinding({
        stage: "LEVEL_1",
        code: "PROHIBITED_SEMANTIC_CONDITION_PRESENT",
        failureClass: prohibition.failureClass,
        propertyIds: prohibition.propertyIds,
        referenceId: prohibition.prohibitionId,
        message: "The normalized candidate explicitly triggers a prohibited semantic condition.",
      });
    }
  }

  for (const ambiguity of acceptanceEnvelope.admissibleAmbiguities) {
    const mapping = ambiguityMappings.index.get(ambiguity.ambiguityId);
    if (mapping?.status === "CLOSED_WITHOUT_SUPPORT") {
      addFinding({
        stage: "LEVEL_1",
        code: "ADMISSIBLE_AMBIGUITY_CLOSED_WITHOUT_SUPPORT",
        failureClass: "MISSING_INFORMATION_FAILURE",
        propertyIds: ["PROPERTY_AMBIGUITY_AND_UNKNOWN_PRESERVED"],
        referenceId: ambiguity.ambiguityId,
        message: "A reference-declared ambiguity was closed without supporting evidence.",
      });
    }
  }

  for (const boundary of acceptanceEnvelope.ownershipBoundaries) {
    const mapping = ownershipMappings.index.get(boundary.boundaryId);
    if (mapping?.status === "VIOLATED") {
      addFinding({
        stage: "LEVEL_1",
        code: "OWNERSHIP_BOUNDARY_VIOLATED",
        failureClass: "OWNERSHIP_BOUNDARY_FAILURE",
        propertyIds: ["PROPERTY_OWNER_AND_ADOPTION_BOUNDARIES_PRESERVED"],
        referenceId: boundary.boundaryId,
        message: "A declared ownership or adoption boundary is explicitly violated.",
      });
    }
  }

  if (candidateOutput.provenanceSummary.status === "BROKEN") {
    addFinding({
      stage: "LEVEL_1",
      code: "PROVENANCE_NOT_RECONSTRUCTIBLE",
      failureClass: "PROVENANCE_FAILURE",
      propertyIds: ["PROPERTY_PROVENANCE_RECONSTRUCTIBLE"],
      referenceId: "candidate.provenanceSummary",
      message: "The normalized candidate declares broken source or history reconstructibility.",
    });
  }

  const absoluteLevel1ViolationPresent = findings.some(
    (finding) =>
      finding.stage === "LEVEL_1" &&
      finding.failureClass !== "QUALIFICATION_PROTOCOL_FAILURE" &&
      finding.propertyIds.some((propertyId) => ABSOLUTE_PROPERTY_IDS.includes(propertyId)),
  );

  const propertyJudgments = [];
  const adjudicationPackets = [];
  for (const propertyId of PROPERTY_ORDER) {
    const property = PROPERTY_REGISTRY[propertyId];
    if (!envelopePropertyIds.has(propertyId)) {
      propertyJudgments.push({
        propertyId,
        alias: property.alias,
        family: property.family,
        evaluationScope: property.evaluationScope,
        checkType: "DETERMINISTIC_CHECK",
        judgment: "NOT_APPLICABLE",
        applicable: false,
        compensable: false,
        failureClass: property.failureClass,
        firstCause: null,
        evidenceTrace: [],
        downstreamFindings: [],
        adjudicationPacketId: null,
      });
      continue;
    }

    if (
      ["PROVIDER_FAILURE", "NOT_EVALUABLE"].includes(candidateOutput.executionStatus) ||
      (candidateOutput.executionStatus === "SAFE_FAIL_CLOSED" &&
        STATISTICAL_PROPERTIES.has(propertyId))
    ) {
      propertyJudgments.push({
        propertyId,
        alias: property.alias,
        family: property.family,
        evaluationScope: property.evaluationScope,
        checkType: "DETERMINISTIC_CHECK",
        judgment: "NOT_EVALUABLE",
        applicable: true,
        compensable: false,
        failureClass: property.failureClass,
        firstCause: null,
        evidenceTrace: ["candidate.executionStatus"],
        downstreamFindings: [],
        adjudicationPacketId: null,
      });
      continue;
    }

    const propertyFindings = findings.filter((finding) =>
      finding.propertyIds.includes(propertyId),
    );
    const violation = propertyFindings.find((finding) =>
      [
        "REQUIRED_OBLIGATION_OMITTED",
        "REQUIRED_OBLIGATION_CONTRADICTED",
        "PROHIBITED_SEMANTIC_CONDITION_PRESENT",
        "ADMISSIBLE_AMBIGUITY_CLOSED_WITHOUT_SUPPORT",
        "OWNERSHIP_BOUNDARY_VIOLATED",
        "PROVENANCE_NOT_RECONSTRUCTIBLE",
      ].includes(finding.code),
    );
    const notEvaluable = propertyFindings.find((finding) =>
      finding.failureClass === "QUALIFICATION_PROTOCOL_FAILURE",
    );
    const relevantObligations = acceptanceEnvelope.required
      .filter((entry) => entry.propertyIds.includes(propertyId))
      .map((entry) => entry.obligationId);
    const relevantProhibitions = acceptanceEnvelope.prohibited
      .filter((entry) => entry.propertyIds.includes(propertyId))
      .map((entry) => entry.prohibitionId);
    const evidenceTrace = [
      ...relevantObligations.map((id) => `acceptanceEnvelope.required.${id}`),
      ...relevantProhibitions.map((id) => `acceptanceEnvelope.prohibited.${id}`),
    ];
    const explicitAdjudicationClaim = candidateOutput.adjudicationClaims.find((claim) =>
      claim.propertyIds.includes(propertyId),
    );

    let judgment;
    let checkType;
    let packet = null;
    if (violation) {
      judgment = "VIOLATED";
      checkType = "DETERMINISTIC_CHECK";
    } else if (notEvaluable) {
      judgment = "NOT_EVALUABLE";
      checkType = "DETERMINISTIC_CHECK";
    } else if (absoluteLevel1ViolationPresent && STATISTICAL_PROPERTIES.has(propertyId)) {
      judgment = "NOT_EVALUABLE";
      checkType = "DETERMINISTIC_CHECK";
    } else if (STATISTICAL_PROPERTIES.has(propertyId) || explicitAdjudicationClaim) {
      checkType = explicitAdjudicationClaim?.basis === "REFERENCE_DECLARED"
        ? "REFERENCE_DECLARED_CHECK"
        : "ADJUDICATION_CHECK";
      packet = makePacket({
        benchmarkCase,
        candidateOutput,
        property,
        obligationRefs: relevantObligations,
        evidenceRefs: [
          ...evidenceTrace,
          ...(explicitAdjudicationClaim?.evidenceRefs || []),
        ],
      });
      const appliedDecision = applyAdjudicationDecision({
        prepared: preparedDecisions,
        packet,
        propertyId,
      });
      if (appliedDecision) {
        judgment = decisionToJudgment(appliedDecision.decision);
        packet.status = "RESOLVED";
        packet.decisionRecordId = appliedDecision.recordId;
        appliedDecisions.push(appliedDecision);
      } else {
        judgment = "ADJUDICATION_REQUIRED";
      }
      adjudicationPackets.push(packet);
    } else if (relevantObligations.length + relevantProhibitions.length === 0) {
      checkType = "ADJUDICATION_CHECK";
      packet = makePacket({
        benchmarkCase,
        candidateOutput,
        property,
        obligationRefs: [],
        evidenceRefs: [],
      });
      judgment = "ADJUDICATION_REQUIRED";
      adjudicationPackets.push(packet);
    } else {
      judgment = "SATISFIED";
      checkType = candidateOutput.declaredVariantId
        ? "REFERENCE_DECLARED_CHECK"
        : "DETERMINISTIC_CHECK";
    }

    if (judgment === "VIOLATED" && packet?.decisionRecordId) {
      addFinding({
        stage: "LEVEL_2",
        code: "ADJUDICATION_PROPERTY_VIOLATION",
        failureClass: property.failureClass,
        propertyIds: [propertyId],
        referenceId: packet.decisionRecordId,
        message: "A governed adjudication decision records this property as violated.",
      });
    }

    propertyJudgments.push({
      propertyId,
      alias: property.alias,
      family: property.family,
      evaluationScope: property.evaluationScope,
      checkType,
      judgment,
      applicable: true,
      compensable: false,
      failureClass: property.failureClass,
      firstCause: violation
        ? {
            code: violation.code,
            stage: violation.stage,
            referenceId: violation.referenceId,
            message: violation.message,
          }
        : null,
      evidenceTrace: unique([
        ...evidenceTrace,
        ...(explicitAdjudicationClaim?.evidenceRefs || []),
        ...appliedDecisions
          .filter((entry) => entry.packetId === packet?.packetId)
          .map((entry) => `adjudicationDecision:${entry.sourceDecisionId}`),
      ]),
      downstreamFindings: propertyFindings
        .filter((finding) => finding !== violation)
        .map((finding) => finding.findingId),
      adjudicationPacketId: packet?.packetId || null,
    });
  }

  preparedDecisions.assertAllConsumed();

  let firstCause = findings[0] || null;
  if (firstCause) {
    firstCause.isFirstCause = true;
    for (const finding of findings.slice(1)) finding.downstreamOf = firstCause.findingId;
  }

  const criticalViolations = findings.filter(
    (finding) =>
      finding.stage === "LEVEL_1" &&
      finding.propertyIds.some((propertyId) => ABSOLUTE_PROPERTY_IDS.includes(propertyId)) &&
      finding.failureClass !== "QUALIFICATION_PROTOCOL_FAILURE",
  );
  const hasViolation = propertyJudgments.some((entry) => entry.judgment === "VIOLATED");
  const hasNotEvaluable = propertyJudgments.some((entry) => entry.judgment === "NOT_EVALUABLE");
  const openPackets = adjudicationPackets.filter((packet) => packet.status === "OPEN");
  const appliedHumanDecisions = appliedDecisions.filter(
    (decision) => decision.authorityClass === "HUMAN_ADJUDICATION",
  );

  let disposition;
  if (candidateOutput.executionStatus === "PROVIDER_FAILURE") {
    disposition = "PROVIDER_EXECUTION_FAILURE";
  } else if (candidateOutput.executionStatus === "SAFE_FAIL_CLOSED") {
    disposition = "SAFE_FAIL_CLOSED";
  } else if (candidateOutput.executionStatus === "NOT_EVALUABLE") {
    disposition = "NOT_EVALUABLE";
  } else if (hasViolation) {
    disposition = "SEMANTIC_FAILURE";
  } else if (hasNotEvaluable || openPackets.length > 0) {
    disposition = "NOT_EVALUABLE";
  } else if (
    appliedDecisions.some((record) => record.decision === "ACCEPTABLE_WITH_RESERVE")
  ) {
    disposition = "ACCEPTABLE_NONCRITICAL_VARIATION";
  } else {
    disposition = "ACCEPTABLE_SEMANTIC_EQUIVALENT";
  }

  const level1CriticalVector = propertyJudgments
    .filter((entry) => ABSOLUTE_PROPERTY_IDS.includes(entry.propertyId))
    .map((entry) => ({ propertyId: entry.propertyId, judgment: entry.judgment }));
  const level1Status = candidateOutput.executionStatus === "PROVIDER_FAILURE"
    ? "NOT_EVALUABLE"
    : criticalViolations.length > 0
      ? "FAIL"
      : findings.some((finding) => finding.failureClass === "QUALIFICATION_PROTOCOL_FAILURE")
        ? "NOT_EVALUABLE"
        : "PASS";
  const level2Status = openPackets.length > 0
    ? "ADJUDICATION_REQUIRED"
    : appliedDecisions.length > 0 && appliedHumanDecisions.length === appliedDecisions.length
      ? "HUMAN_DECISION_APPLIED"
      : appliedDecisions.length > 0
        ? "ADJUDICATION_DECISION_APPLIED"
      : hasNotEvaluable
        ? "NOT_EVALUABLE"
        : "ADJUDICATION_NOT_REQUIRED";

  const propertyJudgment = (propertyId) =>
    propertyJudgments.find((entry) => entry.propertyId === propertyId)?.judgment ||
    "NOT_APPLICABLE";
  const propertyEvidence = (propertyId) =>
    propertyJudgments.find((entry) => entry.propertyId === propertyId)?.evidenceTrace || [];

  let equivalenceClassification = "NOT_ASSESSED";
  if (hasViolation) equivalenceClassification = "NOT_EQUIVALENT";
  else if (
    ["DISTRIBUTED_EQUIVALENT", "NOVEL_REQUIRES_ADJUDICATION"].includes(
      candidateOutput.structureProfile,
    )
  ) {
    equivalenceClassification = openPackets.length > 0
      ? "REQUIRES_ADJUDICATION"
      : "DECLARED_EQUIVALENT";
  } else if (candidateOutput.structureProfile === "CONSOLIDATED") {
    equivalenceClassification = openPackets.length > 0
      ? "REQUIRES_ADJUDICATION"
      : "NONCRITICAL_FORM_VARIATION";
  }

  const result = {
    schemaVersion: "1.1.0",
    contractType: "BENCHMARK_EVALUATION_RESULT",
    evaluationId: input.evaluationId,
    evaluatorIdentity: {
      version: identity.version,
      configurationDigest: identity.configurationDigest,
    },
    mode: evaluationMode,
    caseId: benchmarkCase.caseId,
    candidateId: candidateOutput.candidateId,
    disposition,
    level1: {
      status: level1Status,
      checkCount: findings.filter((finding) => finding.stage === "LEVEL_1").length,
      criticalVector: level1CriticalVector,
    },
    level2: {
      status: level2Status,
      adjudicationPackets,
      appliedDecisions,
    },
    propertyJudgments,
    criticalViolations,
    findings,
    firstCause,
    equivalence: {
      classification: equivalenceClassification,
      structureProfile: candidateOutput.structureProfile,
      referenceVariantId: candidateOutput.declaredVariantId || null,
      requiresHumanDecision: openPackets.length > 0,
      requiresIndependentQualificationEvidence: appliedDecisions.some(
        (decision) => !decision.eligibility.formalIndependentQualification,
      ),
    },
    clarification: summaryFromJudgment(
      propertyJudgment("PROPERTY_CLARIFICATION_HAS_DECISIONAL_VALUE"),
      propertyEvidence("PROPERTY_CLARIFICATION_HAS_DECISIONAL_VALUE"),
    ),
    enrichment: summaryFromJudgment(
      propertyJudgment("PROPERTY_CONTEXTUAL_CANDIDATE_RELEVANCE"),
      propertyEvidence("PROPERTY_CONTEXTUAL_CANDIDATE_RELEVANCE"),
    ),
    ownership: summaryFromJudgment(
      propertyJudgment("PROPERTY_OWNER_AND_ADOPTION_BOUNDARIES_PRESERVED"),
      propertyEvidence("PROPERTY_OWNER_AND_ADOPTION_BOUNDARIES_PRESERVED"),
    ),
    provenance: summaryFromJudgment(
      propertyJudgment("PROPERTY_PROVENANCE_RECONSTRUCTIBLE"),
      propertyEvidence("PROPERTY_PROVENANCE_RECONSTRUCTIBLE"),
    ),
    evidenceTrace: unique([
      `${benchmarkCase.caseId}@${benchmarkCase.version}`,
      `${acceptanceEnvelope.envelopeId}@${acceptanceEnvelope.version}`,
      `${candidateOutput.candidateId}@${candidateOutput.schemaVersion}`,
      ...appliedDecisions.map(
        (decision) => `adjudicationDecision:${decision.sourceDecisionId}`,
      ),
      ...propertyJudgments.flatMap((entry) => entry.evidenceTrace),
    ]),
  };

  assertContract("evaluationResult", result);
  return result;
};
