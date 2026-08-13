import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TOOL_ROOT = path.dirname(fileURLToPath(import.meta.url));

export const RESTART_ROOT = path.resolve(TOOL_ROOT, "..");
export const SEM003_ROOT = path.resolve(RESTART_ROOT, "../..");
export const REPOSITORY_ROOT = path.resolve(SEM003_ROOT, "../../..");
export const CALIBRATION_CORPUS_ROOT = path.resolve(SEM003_ROOT, "corpus/calibration");
export const EVALUATOR_ROOT = path.resolve(SEM003_ROOT, "evaluator");
export const REVIEW_ROOT = path.resolve(SEM003_ROOT, "review");
export const FIXTURE_ROOT = path.resolve(RESTART_ROOT, "fixtures");
export const DECISION_ROOT = path.resolve(RESTART_ROOT, "decisions");
export const PRECOMMITMENT_ROOT = path.resolve(RESTART_ROOT, "precommitment");
export const RESULT_ROOT = path.resolve(RESTART_ROOT, "results");
export const ARTIFACT_ROOT = path.resolve(RESTART_ROOT, "artifacts");

export const EVALUATOR_VERSION = "1.1.0";
export const EVALUATOR_CONFIGURATION_DIGEST =
  "b05bc0ac66cb3e4dc5f135ba278cac8cadebe7443e57b1003dca580c9bd0e9bd";
export const FREEZE_TIMESTAMP = "2026-08-13T22:00:00.000Z";
export const BASELINE_HEAD = "1ed85df";

export const REFERENCE_SET_PATH = path.resolve(
  REVIEW_ROOT,
  "artifacts/calibration-reference-set.json",
);
export const B3_REVIEW_RECORD_PATH = path.resolve(
  REVIEW_ROOT,
  "decision-records/sem003b3-simulated-pluralistic-expert-review.json",
);
export const B3_EQUIVALENCE_PATH = path.resolve(
  REVIEW_ROOT,
  "artifacts/equivalence-review-status.json",
);
export const PROPERTY_REGISTRY_PATH = path.resolve(
  EVALUATOR_ROOT,
  "registry/property-registry.json",
);
export const FAILURE_REGISTRY_PATH = path.resolve(
  EVALUATOR_ROOT,
  "registry/failure-disposition-registry.json",
);
export const EVALUATOR_IDENTITY_PATH = path.resolve(
  EVALUATOR_ROOT,
  "registry/evaluator-identity.json",
);

export const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
export const stableJson = (value) => `${JSON.stringify(value, null, 2)}\n`;
export const sha256 = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");
export const fileSha256 = (filePath) => sha256(fs.readFileSync(filePath));
export const relative = (filePath) => path.relative(REPOSITORY_ROOT, filePath);

export const writeJson = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, stableJson(value));
};

export const assertJsonEquals = (filePath, value) => {
  const expected = stableJson(value);
  if (!fs.existsSync(filePath) || fs.readFileSync(filePath, "utf8") !== expected) {
    throw new Error(`Frozen artifact differs from its precommitted source: ${relative(filePath)}`);
  }
};

const elementType = (kind) =>
  ({
    EXPLICIT_CONCEPT: "CONTENT",
    RELATION: "RELATION",
    COMPARISON: "RELATION",
    TIMING: "TIMING",
    POLARITY: "POLARITY",
    UNKNOWN: "UNKNOWN",
    AMBIGUITY: "AMBIGUITY",
    CORRECTION: "CORRECTION",
    PROVENANCE: "PROVENANCE",
    OWNERSHIP: "OWNERSHIP",
    OTHER: "OTHER",
  })[kind] || "OTHER";

const elementState = (kind) =>
  ({ UNKNOWN: "OPEN_UNKNOWN", AMBIGUITY: "OPEN_AMBIGUITY", PROVENANCE: "HISTORICAL" })[
    kind
  ] || "CURRENT";

const epistemicStatus = (kind) =>
  ({ UNKNOWN: "UNKNOWN", AMBIGUITY: "AMBIGUOUS" })[kind] || "EXPLICIT_USER_STATED";

const elementIdFor = (obligationId) =>
  `element-${obligationId.replace(/^req-/, "")}`.slice(0, 96);

const caseSlug = (caseId) => caseId.replace("SEM3-CAL-", "").toLowerCase();
const candidateCaseSlug = (caseId) => caseId.replace("SEM3-CAL-", "CAL-");

export const fixtureFileName = (candidate) =>
  `${candidate.candidateId.replace("SEM3-EVAL-CAND-", "").toLowerCase()}.candidate.json`;

export const decisionFileName = (record) =>
  `${record.recordId.replace("SEM3-ADR-", "").toLowerCase()}.decision.json`;

export const resultFileName = (candidate) =>
  `${candidate.candidateId.replace("SEM3-EVAL-CAND-", "").toLowerCase()}.result.json`;

export const loadCalibrationPairs = () => {
  const referenceSet = readJson(REFERENCE_SET_PATH);
  if (
    referenceSet.status !== "READY_FOR_B4_DEVELOPMENT_CALIBRATION" ||
    referenceSet.cases.length !== 10 ||
    referenceSet.realHumanReferenceReview !== "NOT_PERFORMED" ||
    referenceSet.finalPD011ReferenceEligibility !== "NO" ||
    referenceSet.blindEligibility !== "NO"
  ) {
    throw new Error("B3 Calibration Reference Set no longer matches the bounded B4 authority");
  }
  return referenceSet.cases.map((entry) => {
    const slug = caseSlug(entry.caseId);
    const casePath = path.resolve(CALIBRATION_CORPUS_ROOT, `${slug}.case.json`);
    const envelopePath = path.resolve(CALIBRATION_CORPUS_ROOT, `${slug}.envelope.json`);
    const benchmarkCase = readJson(casePath);
    const envelope = readJson(envelopePath);
    if (
      benchmarkCase.caseId !== entry.caseId ||
      benchmarkCase.version !== entry.caseVersion ||
      envelope.caseId !== entry.caseId ||
      envelope.version !== entry.envelopeVersion ||
      benchmarkCase.exposure.exposureStatus !== "CALIBRATION_VISIBLE" ||
      benchmarkCase.exposure.eligibleForCalibration !== true ||
      benchmarkCase.exposure.eligibleForBlindQualification !== false ||
      fileSha256(casePath) !== entry.digests.caseSha256 ||
      fileSha256(envelopePath) !== entry.digests.acceptanceEnvelopeSha256
    ) {
      throw new Error(`Calibration reference binding changed: ${entry.caseId}`);
    }
    return { entry, benchmarkCase, envelope, casePath, envelopePath };
  });
};

export const buildBaselineCandidate = (pair, suffix = "BASELINE") => ({
  schemaVersion: "1.1.0",
  contractType: "BENCHMARK_EVALUATION_CANDIDATE",
  purpose: "SCIENTIFIC_UNDERSTANDING_EVALUATOR_CALIBRATION",
  candidateId: `SEM3-EVAL-CAND-${candidateCaseSlug(pair.benchmarkCase.caseId)}-${suffix}`,
  caseId: pair.benchmarkCase.caseId,
  caseVersion: pair.benchmarkCase.version,
  envelopeId: pair.envelope.envelopeId,
  envelopeVersion: pair.envelope.version,
  evaluationMode: "CALIBRATION_SYNTHETIC",
  sourceType: "B4_SYNTHETIC_CALIBRATION",
  structureProfile: "CONSOLIDATED",
  executionStatus: "COMPLETED",
  semanticElements: pair.envelope.required.map((obligation) => ({
    elementId: elementIdFor(obligation.obligationId),
    semanticKey: obligation.semanticKey,
    elementType: elementType(obligation.kind),
    state: elementState(obligation.kind),
    epistemicStatus: epistemicStatus(obligation.kind),
    adoptionStatus: "NOT_ADOPTED",
    owner: "B4_SYNTHETIC_CALIBRATION_REPRESENTATION_ONLY",
    sourceRefs: [obligation.sourceLocator],
    provenanceRefs: [`${pair.benchmarkCase.caseId}.source.provenance`],
  })),
  obligationMappings: pair.envelope.required.map((obligation) => ({
    obligationId: obligation.obligationId,
    status: "PRESERVED",
    evidenceType: "EXPLICIT_NORMALIZED_MAPPING",
    candidateElementRefs: [elementIdFor(obligation.obligationId)],
  })),
  prohibitionSignals: pair.envelope.prohibited.map((prohibition) => ({
    prohibitionId: prohibition.prohibitionId,
    status: "ABSENT",
    evidenceRefs: [`${pair.envelope.envelopeId}.prohibited.${prohibition.prohibitionId}`],
  })),
  optionalCandidateMappings: pair.envelope.optionalRelevant.map((candidate) => ({
    candidateId: candidate.candidateId,
    status: "ABSENT",
    epistemicStatus: "NOT_APPLICABLE",
    evidenceRefs: [`${pair.envelope.envelopeId}.optionalRelevant.${candidate.candidateId}`],
  })),
  ambiguityMappings: pair.envelope.admissibleAmbiguities.map((ambiguity) => ({
    ambiguityId: ambiguity.ambiguityId,
    status: "PRESERVED_OPEN",
    evidenceRefs: [
      `${pair.envelope.envelopeId}.admissibleAmbiguities.${ambiguity.ambiguityId}`,
    ],
  })),
  clarificationMapping: {
    status: pair.envelope.expectedClarification.status === "REQUIRED" ? "PRESENT" : "ABSENT",
    decisionImpactMapping: "REQUIRES_HUMAN_ADJUDICATION",
    evidenceRefs: [`${pair.envelope.envelopeId}.expectedClarification`],
  },
  ownershipMappings: pair.envelope.ownershipBoundaries.map((boundary) => ({
    boundaryId: boundary.boundaryId,
    status: "PRESERVED",
    evidenceRefs: [`${pair.envelope.envelopeId}.ownershipBoundaries.${boundary.boundaryId}`],
  })),
  provenanceSummary: {
    status: "RECONSTRUCTIBLE",
    sourceRequestReconstructible: true,
    historyReconstructible: true,
    evidenceRefs: [
      `${pair.benchmarkCase.caseId}.source.sourceRequest`,
      `${pair.benchmarkCase.caseId}.source.provenance`,
    ],
  },
  adjudicationClaims: [],
});

const statisticalDecision = (propertyAlias, outcome) => {
  if (["P15", "P17"].includes(propertyAlias)) {
    if (outcome === "SATISFIED") return "EQUIVALENT";
    if (outcome === "VIOLATED") return "NON_EQUIVALENT";
  }
  return outcome;
};

const packetIdFor = (candidate, alias) =>
  `SEM3-ADJ-${candidate.candidateId.replace("SEM3-EVAL-CAND-", "")}-${alias}`;

export const buildDecisionRecords = ({ candidate, pair, propertyRegistry, outcomes }) => {
  const applicable = new Set(pair.envelope.properties.map((entry) => entry.propertyId));
  return propertyRegistry.properties
    .filter((property) => !property.absolute && applicable.has(property.id))
    .map((property) => {
      const requested = outcomes[property.id] || "SATISFIED";
      const decision = requested === "ACCEPTABLE_WITH_RESERVE"
        ? "ACCEPTABLE_WITH_RESERVE"
        : statisticalDecision(property.alias, requested);
      return {
        schemaVersion: "1.0.0",
        contractType: "BENCHMARK_EVALUATION_ADJUDICATION_DECISION_RECORD",
        recordId: `SEM3-ADR-B4-${candidate.candidateId.replace("SEM3-EVAL-CAND-", "")}-${property.alias}`,
        decision,
        rationale:
          "Precommitted simulated calibration classification derived from the frozen Acceptance Envelope; this tests governed Level 2 decision consumption and is not a human or PD-011 judgment.",
        authorityClass: "SIMULATED_PLURALISTIC_EXPERT_REVIEW",
        evidenceBasis: "SIMULATED_EXPERT_REVIEW_EVIDENCE",
        sourceDecisionId: `SEM3B4-PRECOMMIT-${candidate.candidateId}-${property.alias}`,
        reviewBasis: "SIMULATED_PLURALISTIC_EXPERT_REVIEW",
        eligibility: {
          developmentEvaluatorTesting: true,
          developmentCalibration: true,
          formalIndependentQualification: false,
          blindReferenceAdmission: false,
          pd011FinalEvidence: false,
        },
        provenance: {
          sourceRecordRef: `${relative(REFERENCE_SET_PATH)}#${pair.entry.reviewUnitId}`,
          recordedAt: FREEZE_TIMESTAMP,
          realHumanReview: false,
        },
        target: {
          scope: "ADJUDICATION_PACKET",
          caseId: pair.benchmarkCase.caseId,
          candidateIds: [candidate.candidateId],
          packetIds: [packetIdFor(candidate, property.alias)],
          propertyIds: [property.id],
        },
        status: "FINAL",
      };
    });
};

const expectationRow = ({ candidate, pair, role, expected, decisions = [] }) => ({
  fixture: relative(path.resolve(FIXTURE_ROOT, fixtureFileName(candidate))),
  caseId: pair.benchmarkCase.caseId,
  candidateId: candidate.candidateId,
  evaluationMode: "CALIBRATION_SYNTHETIC",
  role,
  expected,
  decisionRecords: decisions.map((record) =>
    relative(path.resolve(DECISION_ROOT, decisionFileName(record))),
  ),
});

export const buildPrecommittedCalibration = () => {
  const pairs = loadCalibrationPairs();
  const propertyRegistry = readJson(PROPERTY_REGISTRY_PATH);
  const fixtures = [];
  const decisions = [];
  const expectations = [];

  const add = ({ pair, candidate, role, expected, outcomes = null }) => {
    const candidateDecisions = outcomes
      ? buildDecisionRecords({ candidate, pair, propertyRegistry, outcomes })
      : [];
    fixtures.push({ pair, candidate, role, decisions: candidateDecisions });
    decisions.push(...candidateDecisions);
    expectations.push(
      expectationRow({ candidate, pair, role, expected, decisions: candidateDecisions }),
    );
  };

  for (const pair of pairs) {
    const candidate = buildBaselineCandidate(pair);
    add({
      pair,
      candidate,
      role: "REFERENCE_CONFORMANT_POSITIVE",
      outcomes: {},
      expected: {
        level1: "PASS",
        level2: "ADJUDICATION_DECISION_APPLIED",
        disposition: "ACCEPTABLE_SEMANTIC_EQUIVALENT",
        absoluteViolationCount: 0,
        openAdjudicationPacketCount: 0,
      },
    });
  }

  for (const property of propertyRegistry.properties.filter((entry) => entry.absolute)) {
    const pair = pairs.find(
      (entry) =>
        entry.envelope.prohibited.some((item) => item.propertyIds.includes(property.id)) ||
        entry.envelope.required.some((item) => item.propertyIds.includes(property.id)),
    );
    if (!pair) throw new Error(`No Calibration reference exercises ${property.alias}`);
    const candidate = buildBaselineCandidate(pair, `NEGATIVE-${property.alias}`);
    candidate.structureProfile = "NEAR_REFERENCE_WITH_SEMANTIC_DEFECT";
    const prohibition = pair.envelope.prohibited.find((item) =>
      item.propertyIds.includes(property.id),
    );
    if (prohibition) {
      const signal = candidate.prohibitionSignals.find(
        (item) => item.prohibitionId === prohibition.prohibitionId,
      );
      signal.status = "PRESENT";
      signal.evidenceRefs.push(`b4-precommit.target.${property.id}`);
    } else {
      const obligation = pair.envelope.required.find((item) =>
        item.propertyIds.includes(property.id),
      );
      const mapping = candidate.obligationMappings.find(
        (item) => item.obligationId === obligation.obligationId,
      );
      mapping.status = "OMITTED";
      mapping.candidateElementRefs = [];
    }
    add({
      pair,
      candidate,
      role: "ABSOLUTE_INVARIANT_NEGATIVE",
      expected: {
        level1: "FAIL",
        disposition: "SEMANTIC_FAILURE",
        targetPropertyId: property.id,
        targetPropertyJudgment: "VIOLATED",
        falsePassForbidden: true,
      },
    });
  }

  for (const property of propertyRegistry.properties.filter((entry) => !entry.absolute)) {
    const pair = pairs.find((entry) =>
      entry.envelope.properties.some((item) => item.propertyId === property.id),
    );
    if (!pair) throw new Error(`No Calibration reference exercises ${property.alias}`);
    for (const outcome of ["SATISFIED", "VIOLATED"]) {
      const candidate = buildBaselineCandidate(pair, `${outcome}-${property.alias}`);
      candidate.structureProfile = "NOVEL_REQUIRES_ADJUDICATION";
      candidate.adjudicationClaims.push({
        claimId: `claim-${property.alias.toLowerCase()}-${outcome.toLowerCase()}`,
        propertyIds: [property.id],
        description:
          "Precommitted Level 2 calibration probe; scientific content is not promoted beyond the frozen reference.",
        basis: "NOVEL_REQUIRES_ADJUDICATION",
        evidenceRefs: [
          `${pair.envelope.envelopeId}.properties.${property.id}`,
          `${candidate.candidateId}.semanticElements`,
        ],
      });
      add({
        pair,
        candidate,
        role: `LEVEL2_${outcome}_PROBE`,
        outcomes: { [property.id]: outcome },
        expected: {
          level1: "PASS",
          level2: "ADJUDICATION_DECISION_APPLIED",
          disposition:
            outcome === "SATISFIED"
              ? "ACCEPTABLE_SEMANTIC_EQUIVALENT"
              : "SEMANTIC_FAILURE",
          targetPropertyId: property.id,
          targetPropertyJudgment: outcome,
          openAdjudicationPacketCount: 0,
        },
      });
    }
  }

  const p17 = propertyRegistry.properties.find((entry) => entry.alias === "P17");
  const p17Pair = pairs.find((entry) =>
    entry.envelope.properties.some((item) => item.propertyId === p17.id),
  );
  const reserveCandidate = buildBaselineCandidate(p17Pair, "RESERVE-P17");
  reserveCandidate.structureProfile = "NOVEL_REQUIRES_ADJUDICATION";
  reserveCandidate.adjudicationClaims.push({
    claimId: "claim-p17-acceptable-with-reserve",
    propertyIds: [p17.id],
    description: "Precommitted noncritical form-variation disposition probe.",
    basis: "NOVEL_REQUIRES_ADJUDICATION",
    evidenceRefs: [`${p17Pair.envelope.envelopeId}.properties.${p17.id}`],
  });
  add({
    pair: p17Pair,
    candidate: reserveCandidate,
    role: "LEVEL2_ACCEPTABLE_WITH_RESERVE_PROBE",
    outcomes: { [p17.id]: "ACCEPTABLE_WITH_RESERVE" },
    expected: {
      level1: "PASS",
      level2: "ADJUDICATION_DECISION_APPLIED",
      disposition: "ACCEPTABLE_NONCRITICAL_VARIATION",
      targetPropertyId: p17.id,
      targetPropertyJudgment: "SATISFIED",
      openAdjudicationPacketCount: 0,
    },
  });

  const boundaryPair = pairs[0];
  for (const [suffix, executionStatus, structureProfile, disposition, level1] of [
    ["SAFE-FAIL-CLOSED", "SAFE_FAIL_CLOSED", "FAIL_CLOSED", "SAFE_FAIL_CLOSED", "PASS"],
    ["PROVIDER-FAILURE", "PROVIDER_FAILURE", "NOT_AVAILABLE", "PROVIDER_EXECUTION_FAILURE", "NOT_EVALUABLE"],
    ["NOT-EVALUABLE", "NOT_EVALUABLE", "NOT_AVAILABLE", "NOT_EVALUABLE", "NOT_EVALUABLE"],
  ]) {
    const candidate = buildBaselineCandidate(boundaryPair, suffix);
    candidate.executionStatus = executionStatus;
    candidate.structureProfile = structureProfile;
    add({
      pair: boundaryPair,
      candidate,
      role: "BOUNDARY_DISPOSITION",
      expected: { level1, disposition, semanticPassForbidden: true },
    });
  }

  return { pairs, propertyRegistry, fixtures, decisions, expectations };
};

export const buildMeasurementProtocol = () => ({
  schemaVersion: "1.0.0",
  contractType: "SEM003B4_MEASUREMENT_PROTOCOL",
  protocolId: "SEM003B4-MEASUREMENT-PROTOCOL-EVALUATOR-1-1-0",
  version: "1.0.0",
  status: "FROZEN_BEFORE_FIRST_CALIBRATION_OBSERVATION",
  frozenAt: FREEZE_TIMESTAMP,
  evaluator: {
    version: EVALUATOR_VERSION,
    configurationDigest: EVALUATOR_CONFIGURATION_DIGEST,
    deterministicInThisCalibration: true,
    repetitionsPerFixture: 1,
    repetitionRationale:
      "The calibrated component is deterministic and each repeated execution would be information-identical.",
  },
  unitOfJudgment: "CANDIDATE_AGAINST_FROZEN_ACCEPTANCE_ENVELOPE",
  families: {
    safetyFidelity: {
      properties: ["P01", "P02", "P03", "P04", "P05", "P06", "P07", "P08", "P09", "P10", "P11", "P12"],
      rule: "ABSOLUTE_NONCOMPENSABLE",
      measures: [
        "targetedCriticalViolationDetection",
        "absoluteInvariantFalsePassCount",
        "referenceConformantAbsolutePreservation",
      ],
    },
    scientificUnderstanding: {
      properties: ["P13", "P14", "P15", "P16", "P17"],
      rule: "SIMULATED_LEVEL2_MECHANIC_ONLY",
      threshold: "THRESHOLD_NOT_YET_ADMITTED",
      measures: ["precommittedDecisionConsumptionAgreement", "openPacketCount"],
    },
    contextualEnrichment: {
      properties: ["P18"],
      rule: "SIMULATED_LEVEL2_MECHANIC_ONLY",
      threshold: "THRESHOLD_NOT_YET_ADMITTED",
      measures: ["precommittedDecisionConsumptionAgreement", "epistemicBoundaryPreservation"],
    },
  },
  equivalence: {
    source: relative(B3_EQUIVALENCE_PATH),
    pairCount: 5,
    requiredDisposition: "ACCEPTABLE_SEMANTIC_EQUIVALENT",
    authorityClass: "SIMULATED_PLURALISTIC_EXPERT_REVIEW",
    humanEvidence: false,
  },
  dispositions: {
    registry: relative(FAILURE_REGISTRY_PATH),
    measuredSeparately: true,
    providerFailure:
      "Synthetic boundary-contract exercise only; no provider is invoked and no provider reliability rate is inferred.",
    notEvaluable: "Never counted as PASS or removed from denominators.",
    safeFailClosed: "Reported separately and never counted as scientific understanding success.",
  },
  metrics: {
    noCompositeScore: true,
    allFixturesCounted: true,
    denominatorsFrozenByFixtureRole: true,
    nonEvaluableVisible: true,
    deterministicStability: "Verified by replay digest equality, not by duplicated observations.",
  },
  terminalRule: {
    readyForIndependentBlindConstructionRequires: [
      "all frozen bindings and digests valid",
      "all P01-P12 targeted negatives detected",
      "zero false PASS on P01-P12 targeted negatives",
      "all reference-conformant absolute mappings preserved",
      "all simulated Level 2 decisions consumed as precommitted",
      "all five B3 equivalence decisions accepted without structural-form rejection",
      "NOT_EVALUABLE remains distinct from PASS",
      "all disposition boundary probes remain distinct",
      "no post-observation mutation",
      "no open evaluator repair",
    ],
    positiveDecision:
      "SEM003B4_EVALUATOR_CALIBRATED_READY_FOR_INDEPENDENT_BLIND_CONSTRUCTION",
    evaluatorDefectDecision: "SEM003B4_EVALUATOR_REPAIR_REQUIRED",
    insufficientProtocolDecision: "SEM003B4_MEASUREMENT_PROTOCOL_NOT_READY",
    normativeConflictDecision: "SEM003B4_REQUIRES_NORMATIVE_ARBITRATION",
  },
  boundaries: {
    executionMode: "CALIBRATION_SYNTHETIC",
    candidateSourceType: "B4_SYNTHETIC_CALIBRATION",
    llmProviderCalls: 0,
    semRuntimeExecuted: false,
    blindCreated: false,
    realHumanReferenceReview: "NOT_PERFORMED",
    finalPD011ReferenceEligibility: "NO",
    blindEligibility: "NO",
    semQualification: "NOT_CLAIMED",
  },
});

export const buildFrozenArtifacts = () => {
  const data = buildPrecommittedCalibration();
  const measurementProtocol = buildMeasurementProtocol();
  const fixtureDigests = data.fixtures.map(({ candidate, role }) => ({
    path: relative(path.resolve(FIXTURE_ROOT, fixtureFileName(candidate))),
    candidateId: candidate.candidateId,
    role,
    sha256: sha256(stableJson(candidate)),
  }));
  const decisionDigests = data.decisions.map((record) => ({
    path: relative(path.resolve(DECISION_ROOT, decisionFileName(record))),
    recordId: record.recordId,
    sha256: sha256(stableJson(record)),
  }));
  const expectationManifest = {
    schemaVersion: "1.0.0",
    contractType: "SEM003B4_FIXTURE_EXPECTATION_MANIFEST",
    status: "FROZEN_BEFORE_FIRST_CALIBRATION_OBSERVATION",
    frozenAt: FREEZE_TIMESTAMP,
    evaluatorVersion: EVALUATOR_VERSION,
    evaluatorConfigurationDigest: EVALUATOR_CONFIGURATION_DIGEST,
    calibrationFixtureCount: data.expectations.length,
    rows: data.expectations,
    interpretationBoundary:
      "Expectations test deterministic evaluator behavior against frozen visible references; they are not new Golds and are ineligible for blind or PD-011 final evidence.",
  };
  const baselineManifest = {
    schemaVersion: "1.0.0",
    contractType: "SEM003B4_RESTART_CALIBRATION_FREEZE_MANIFEST",
    restartId: "SEM003B4-RESTART-EVALUATOR-1-1-0",
    status: "FROZEN_BEFORE_FIRST_CALIBRATION_OBSERVATION",
    frozenAt: FREEZE_TIMESTAMP,
    baselineHead: BASELINE_HEAD,
    previousInterruptedPreflight: {
      evaluatorVersion: "1.0.0",
      decision: "SEM003B4_EVALUATOR_REPAIR_REQUIRED",
      preservedAt: "semantic-validation/sem-003/calibration",
      activeCalibrationEvidence: false,
    },
    activeEvaluator: {
      version: EVALUATOR_VERSION,
      configurationDigest: EVALUATOR_CONFIGURATION_DIGEST,
      identityPath: relative(EVALUATOR_IDENTITY_PATH),
      identitySha256: fileSha256(EVALUATOR_IDENTITY_PATH),
      mutationAuthorizedAfterFreeze: false,
    },
    referenceSet: {
      path: relative(REFERENCE_SET_PATH),
      sha256: fileSha256(REFERENCE_SET_PATH),
      caseCount: data.pairs.length,
      cases: data.pairs.map((pair) => ({
        caseId: pair.benchmarkCase.caseId,
        caseVersion: pair.benchmarkCase.version,
        envelopeId: pair.envelope.envelopeId,
        envelopeVersion: pair.envelope.version,
        casePath: relative(pair.casePath),
        caseSha256: fileSha256(pair.casePath),
        envelopePath: relative(pair.envelopePath),
        envelopeSha256: fileSha256(pair.envelopePath),
        exposureStatus: pair.benchmarkCase.exposure.exposureStatus,
      })),
      reviewBasis: "SIMULATED_PLURALISTIC_EXPERT_REVIEW",
      realHumanReferenceReview: "NOT_PERFORMED",
      finalPD011ReferenceEligibility: "NO",
      blindEligibility: "NO",
    },
    adjudicationSet: [
      { path: relative(B3_REVIEW_RECORD_PATH), sha256: fileSha256(B3_REVIEW_RECORD_PATH) },
      { path: relative(B3_EQUIVALENCE_PATH), sha256: fileSha256(B3_EQUIVALENCE_PATH) },
    ],
    protocols: {
      candidateGeneration:
        "Frozen deterministic mapping from each required/prohibited/optional/ambiguity/ownership/provenance declaration; no evaluator output is read during generation.",
      expectedPropertyMapping:
        "Only properties declared applicable by each frozen Acceptance Envelope are exercised; no exhaustive Gold topology is imposed.",
      measurementProtocol: relative(
        path.resolve(PRECOMMITMENT_ROOT, "measurement-protocol.json"),
      ),
      repetitionsPerFixture: 1,
      nonEvaluableTreatment: "VISIBLE_SEPARATE_NOT_PASS",
      dispositionTaxonomy: relative(FAILURE_REGISTRY_PATH),
      failureTaxonomy: relative(FAILURE_REGISTRY_PATH),
    },
    frozenArtifacts: {
      fixtureCount: fixtureDigests.length,
      decisionRecordCount: decisionDigests.length,
      fixtureDigests,
      decisionDigests,
      expectationManifestSha256: sha256(stableJson(expectationManifest)),
      measurementProtocolSha256: sha256(stableJson(measurementProtocol)),
    },
    observation: {
      calibrationCandidateExecuted: false,
      resultObserved: false,
      resultsPath: relative(RESULT_ROOT),
    },
    boundaries: measurementProtocol.boundaries,
  };
  return { ...data, expectationManifest, measurementProtocol, baselineManifest };
};
