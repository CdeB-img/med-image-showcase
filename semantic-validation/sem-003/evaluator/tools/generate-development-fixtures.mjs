import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeEvaluatorIdentity } from "../core/versioning.mjs";

const TOOL_ROOT = path.dirname(fileURLToPath(import.meta.url));
const EVALUATOR_ROOT = path.resolve(TOOL_ROOT, "..");
const REPOSITORY_ROOT = path.resolve(EVALUATOR_ROOT, "../../..");
const DEVELOPMENT_ROOT = path.resolve(EVALUATOR_ROOT, "../corpus/development");
const FIXTURE_ROOT = path.resolve(EVALUATOR_ROOT, "fixtures/development");
const REGISTRY_ROOT = path.resolve(EVALUATOR_ROOT, "registry");
const ARTIFACT_ROOT = path.resolve(EVALUATOR_ROOT, "artifacts");
const SEM002_PATH = path.resolve(
  EVALUATOR_ROOT,
  "../../sem-002/scientific-understanding-competence-contract.json",
);

const EVALUATOR_VERSION = "1.0.0";
const CHECK_ONLY = process.argv.includes("--check");

const SEM003_PROPERTY_ORDER = Object.freeze([
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
  "PROPERTY_MISSING_CRITICAL_INFORMATION_DETECTED",
  "PROPERTY_CONCEPTUAL_PLAN_SEPARATION",
  "PROPERTY_SEMANTIC_EQUIVALENCE_RECOGNIZED",
  "PROPERTY_CLARIFICATION_HAS_DECISIONAL_VALUE",
  "PROPERTY_NONCRITICAL_FORM_VARIATION_ALLOWED",
  "PROPERTY_CONTEXTUAL_CANDIDATE_RELEVANCE",
]);

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const stableJson = (value) => `${JSON.stringify(value, null, 2)}\n`;
const relative = (filePath) => path.relative(REPOSITORY_ROOT, filePath);

const writeOrCheck = (filePath, value) => {
  const serialized = stableJson(value);
  if (CHECK_ONLY) {
    if (!fs.existsSync(filePath) || fs.readFileSync(filePath, "utf8") !== serialized) {
      throw new Error(`Generated evaluator artifact is stale: ${relative(filePath)}`);
    }
    return;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, serialized);
};

const propertyAlias = (index) => `P${String(index + 1).padStart(2, "0")}`;

const buildPropertyRegistry = () => {
  const sem002 = readJson(SEM002_PATH);
  if (sem002.document.version !== "1.0" || sem002.properties.length !== 18) {
    throw new Error("SEM-002 machine projection no longer matches the admitted 18-property contract");
  }
  const propertyById = new Map(sem002.properties.map((property) => [property.id, property]));
  if (
    SEM003_PROPERTY_ORDER.length !== sem002.properties.length ||
    SEM003_PROPERTY_ORDER.some((propertyId) => !propertyById.has(propertyId))
  ) {
    throw new Error("SEM-003 P01-P18 aliases do not cover the admitted SEM-002 property registry");
  }
  const properties = SEM003_PROPERTY_ORDER.map((propertyId, index) => {
    const property = propertyById.get(propertyId);
    return {
      id: property.id,
      alias: propertyAlias(index),
      dimension: property.dimension,
      family: property.family,
      scope: property.scope,
      criticality: property.criticality,
      sourceEvaluationMode: property.evaluationMode,
      evaluationScope:
        property.absoluteOrStatistical === "ABSOLUTE"
          ? "ABSOLUTE_RUN_LEVEL"
          : "STATISTICAL_PROPERTY_MECHANIC_ONLY",
      absolute: property.absoluteOrStatistical === "ABSOLUTE",
      compensable: false,
      qualificationOwner: property.qualificationOwner,
      failureClass: property.failureClass,
      permittedCheckTypes: [
        "DETERMINISTIC_CHECK",
        "REFERENCE_DECLARED_CHECK",
        "ADJUDICATION_CHECK",
      ],
    };
  });
  const familyCounts = Object.fromEntries(
    sem002.propertyFamilies.map((family) => [
      family.id,
      properties.filter((property) => property.family === family.id).length,
    ]),
  );
  for (const family of sem002.propertyFamilies) {
    if (familyCounts[family.id] !== family.propertyCount) {
      throw new Error(`SEM-002 property family count mismatch for ${family.id}`);
    }
  }
  return {
    schemaVersion: "1.0.0",
    contractType: "BENCHMARK_EVALUATION_PROPERTY_REGISTRY",
    source: relative(SEM002_PATH),
    sourceDocument: sem002.document.sourceMaster,
    sourceVersion: sem002.document.version,
    derivedWithoutNormativeMutation: true,
    propertyCount: properties.length,
    familyCounts,
    properties,
  };
};

const loadDevelopmentPairs = () => {
  const files = fs.readdirSync(DEVELOPMENT_ROOT).sort();
  const cases = files
    .filter((file) => file.endsWith(".case.json"))
    .map((file) => readJson(path.join(DEVELOPMENT_ROOT, file)));
  const envelopes = files
    .filter((file) => file.endsWith(".envelope.json"))
    .map((file) => readJson(path.join(DEVELOPMENT_ROOT, file)));
  const envelopeByCaseId = new Map(envelopes.map((entry) => [entry.caseId, entry]));
  const pairs = cases.map((benchmarkCase) => ({
    benchmarkCase,
    envelope: envelopeByCaseId.get(benchmarkCase.caseId),
  }));
  if (
    pairs.length !== 15 ||
    pairs.some(
      ({ benchmarkCase, envelope }) =>
        !envelope ||
        benchmarkCase.purpose !== "DEVELOPMENT_AUTHORING" ||
        benchmarkCase.exposure.exposureStatus !== "DEVELOPMENT_VISIBLE",
    )
  ) {
    throw new Error("Evaluator development requires exactly 15 exposed Development pairs");
  }
  return pairs;
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
  ({
    UNKNOWN: "OPEN_UNKNOWN",
    AMBIGUITY: "OPEN_AMBIGUITY",
    PROVENANCE: "HISTORICAL",
  })[kind] || "CURRENT";

const epistemicStatus = (kind) =>
  ({
    UNKNOWN: "UNKNOWN",
    AMBIGUITY: "AMBIGUOUS",
  })[kind] || "EXPLICIT_USER_STATED";

const candidateSuffix = (caseId) => caseId.replace("SEM3-DEV-", "");
const elementIdFor = (obligationId, prefix = "element") =>
  `${prefix}-${obligationId.replace(/^req-/, "")}`.slice(0, 96);

const buildBaselineCandidate = ({ benchmarkCase, envelope }, suffix = "BASELINE") => {
  const candidateId = `SEM3-EVAL-CAND-${candidateSuffix(benchmarkCase.caseId)}-${suffix}`;
  return {
    schemaVersion: "1.0.0",
    contractType: "BENCHMARK_EVALUATION_CANDIDATE",
    purpose: "SCIENTIFIC_UNDERSTANDING_EVALUATOR_DEVELOPMENT",
    candidateId,
    caseId: benchmarkCase.caseId,
    caseVersion: benchmarkCase.version,
    envelopeId: envelope.envelopeId,
    envelopeVersion: envelope.version,
    evaluationMode: "DEVELOPMENT_SYNTHETIC",
    sourceType: "EVALUATOR_DEVELOPMENT_SYNTHETIC",
    structureProfile: "CONSOLIDATED",
    executionStatus: "COMPLETED",
    semanticElements: envelope.required.map((obligation) => ({
      elementId: elementIdFor(obligation.obligationId),
      semanticKey: obligation.semanticKey,
      elementType: elementType(obligation.kind),
      state: elementState(obligation.kind),
      epistemicStatus: epistemicStatus(obligation.kind),
      adoptionStatus: "NOT_ADOPTED",
      owner: "BENCHMARK_SYNTHETIC_REPRESENTATION_ONLY",
      sourceRefs: [obligation.sourceLocator],
      provenanceRefs: [`${benchmarkCase.caseId}.source.provenance`],
    })),
    obligationMappings: envelope.required.map((obligation) => ({
      obligationId: obligation.obligationId,
      status: "PRESERVED",
      evidenceType: "EXPLICIT_NORMALIZED_MAPPING",
      candidateElementRefs: [elementIdFor(obligation.obligationId)],
    })),
    prohibitionSignals: envelope.prohibited.map((prohibition) => ({
      prohibitionId: prohibition.prohibitionId,
      status: "ABSENT",
      evidenceRefs: [`${envelope.envelopeId}.prohibited.${prohibition.prohibitionId}`],
    })),
    optionalCandidateMappings: envelope.optionalRelevant.map((candidate) => ({
      candidateId: candidate.candidateId,
      status: "ABSENT",
      epistemicStatus: "NOT_APPLICABLE",
      evidenceRefs: [`${envelope.envelopeId}.optionalRelevant.${candidate.candidateId}`],
    })),
    ambiguityMappings: envelope.admissibleAmbiguities.map((ambiguity) => ({
      ambiguityId: ambiguity.ambiguityId,
      status: "PRESERVED_OPEN",
      evidenceRefs: [`${envelope.envelopeId}.admissibleAmbiguities.${ambiguity.ambiguityId}`],
    })),
    clarificationMapping: {
      status: envelope.expectedClarification.status === "REQUIRED" ? "PRESENT" : "ABSENT",
      decisionImpactMapping: "REQUIRES_HUMAN_ADJUDICATION",
      evidenceRefs: [`${envelope.envelopeId}.expectedClarification`],
    },
    ownershipMappings: envelope.ownershipBoundaries.map((boundary) => ({
      boundaryId: boundary.boundaryId,
      status: "PRESERVED",
      evidenceRefs: [`${envelope.envelopeId}.ownershipBoundaries.${boundary.boundaryId}`],
    })),
    provenanceSummary: {
      status: "RECONSTRUCTIBLE",
      sourceRequestReconstructible: true,
      historyReconstructible: true,
      evidenceRefs: [
        `${benchmarkCase.caseId}.source.sourceRequest`,
        `${benchmarkCase.caseId}.source.provenance`,
      ],
    },
    adjudicationClaims: [],
  };
};

const buildDistributedCandidate = (pair) => {
  const candidate = buildBaselineCandidate(pair, "DISTRIBUTED");
  const demonstration = pair.envelope.evaluationDemonstrations.find(
    (entry) => entry.representationId === "representation-b",
  );
  const variant = pair.envelope.acceptableSemanticVariants[0];
  if (!demonstration || !variant) {
    throw new Error(`Distributed development fixture lacks reference declarations: ${pair.benchmarkCase.caseId}`);
  }
  candidate.structureProfile = "DISTRIBUTED_EQUIVALENT";
  candidate.referenceDemonstrationId = demonstration.representationId;
  candidate.declaredVariantId = variant.variantId;
  candidate.semanticElements = candidate.semanticElements
    .map((element) => ({ ...element, elementId: element.elementId.replace("element-", "element-distributed-") }))
    .reverse();
  const elementRefMap = new Map(
    candidate.semanticElements.map((element) => [
      element.semanticKey,
      element.elementId,
    ]),
  );
  candidate.obligationMappings = pair.envelope.required
    .slice()
    .reverse()
    .map((obligation) => ({
      obligationId: obligation.obligationId,
      status: "PRESERVED",
      evidenceType: "REFERENCE_DECLARED_VARIANT",
      candidateElementRefs: [elementRefMap.get(obligation.semanticKey)],
    }));
  candidate.adjudicationClaims.push({
    claimId: "claim-reference-declared-equivalence",
    propertyIds: [
      "PROPERTY_SEMANTIC_EQUIVALENCE_RECOGNIZED",
      "PROPERTY_NONCRITICAL_FORM_VARIATION_ALLOWED",
    ].filter((propertyId) =>
      pair.envelope.properties.some((entry) => entry.propertyId === propertyId),
    ),
    description: "The candidate uses the reference-declared distributed form while preserving explicit obligation mappings.",
    basis: "REFERENCE_DECLARED",
    evidenceRefs: [
      `${pair.envelope.envelopeId}.acceptableSemanticVariants.${variant.variantId}`,
      `${pair.envelope.envelopeId}.evaluationDemonstrations.${demonstration.representationId}`,
    ],
  });
  return candidate;
};

const buildInvariantNegative = (pair, property, alias) => {
  const candidate = buildBaselineCandidate(pair, `NEGATIVE-${alias}`);
  candidate.structureProfile = "NEAR_REFERENCE_WITH_SEMANTIC_DEFECT";
  const prohibition = pair.envelope.prohibited.find((entry) =>
    entry.propertyIds.includes(property.id),
  );
  if (prohibition) {
    const signal = candidate.prohibitionSignals.find(
      (entry) => entry.prohibitionId === prohibition.prohibitionId,
    );
    signal.status = "PRESENT";
    signal.evidenceRefs.push(`synthetic-negative.${property.id}`);
    return candidate;
  }
  const obligation = pair.envelope.required.find((entry) =>
    entry.propertyIds.includes(property.id),
  );
  if (!obligation) throw new Error(`No Development evidence can exercise ${property.id}`);
  const mapping = candidate.obligationMappings.find(
    (entry) => entry.obligationId === obligation.obligationId,
  );
  mapping.status = "OMITTED";
  mapping.candidateElementRefs = [];
  return candidate;
};

const buildAdjudicationCandidate = (pair, property) => {
  const candidate = buildBaselineCandidate(pair, `ADJUDICATION-${property.alias}`);
  candidate.structureProfile = "NOVEL_REQUIRES_ADJUDICATION";
  candidate.adjudicationClaims.push({
    claimId: `claim-${property.alias.toLowerCase()}-requires-adjudication`,
    propertyIds: [property.id],
    description: "The normalized representation leaves a non-trivial scientific property judgment to governed human adjudication.",
    basis: "NOVEL_REQUIRES_ADJUDICATION",
    evidenceRefs: [
      `${pair.envelope.envelopeId}.properties.${property.id}`,
      `${candidate.candidateId}.semanticElements`,
    ],
  });
  return candidate;
};

const fixtureFileName = (candidate) =>
  `${candidate.candidateId.replace("SEM3-EVAL-CAND-", "").toLowerCase()}.candidate.json`;

const buildFixtures = (pairs, propertyRegistry) => {
  const fixtures = [];
  const matrix = [];
  const baselineByCaseId = new Map();

  for (const pair of pairs) {
    const candidate = buildBaselineCandidate(pair);
    fixtures.push({ pair, candidate, role: "BASELINE_POSITIVE" });
    baselineByCaseId.set(pair.benchmarkCase.caseId, candidate);
    matrix.push({
      fixture: `fixtures/development/${fixtureFileName(candidate)}`,
      caseId: pair.benchmarkCase.caseId,
      candidateId: candidate.candidateId,
      mode: "DEVELOPMENT_SYNTHETIC",
      expected: {
        level1: "PASS",
        level2: "ADJUDICATION_REQUIRED",
        disposition: "NOT_EVALUABLE",
      },
      purpose: "Positive explicit mapping for all applicable absolute properties; statistical properties remain governed adjudication mechanics.",
    });
  }

  const demonstrationPairs = pairs.filter(
    (pair) => pair.envelope.evaluationDemonstrations.length > 0,
  );
  if (demonstrationPairs.length !== 5) {
    throw new Error("Exactly five Development cases must provide evaluator demonstrations");
  }
  for (const pair of demonstrationPairs) {
    const candidate = buildDistributedCandidate(pair);
    fixtures.push({ pair, candidate, role: "STRUCTURAL_EQUIVALENCE_PAIR" });
    matrix.push({
      fixture: `fixtures/development/${fixtureFileName(candidate)}`,
      caseId: pair.benchmarkCase.caseId,
      candidateId: candidate.candidateId,
      mode: "DEVELOPMENT_SYNTHETIC",
      expected: {
        level1: "PASS",
        level2: "ADJUDICATION_REQUIRED",
        disposition: "NOT_EVALUABLE",
        noSemanticFailureDueToForm: true,
        criticalVectorMatchesCandidateId: baselineByCaseId.get(pair.benchmarkCase.caseId).candidateId,
      },
      purpose: "Different structure with the same explicit critical obligation vector; form alone must not cause rejection.",
    });
  }

  const absoluteProperties = propertyRegistry.properties.filter((property) => property.absolute);
  for (const property of absoluteProperties) {
    const pair = pairs.find(
      (entry) =>
        entry.envelope.prohibited.some((item) => item.propertyIds.includes(property.id)) ||
        entry.envelope.required.some((item) => item.propertyIds.includes(property.id)),
    );
    if (!pair) throw new Error(`No Development case declares absolute property ${property.id}`);
    const candidate = buildInvariantNegative(pair, property, property.alias);
    fixtures.push({ pair, candidate, role: "ABSOLUTE_INVARIANT_NEGATIVE", targetProperty: property.id });
    matrix.push({
      fixture: `fixtures/development/${fixtureFileName(candidate)}`,
      caseId: pair.benchmarkCase.caseId,
      candidateId: candidate.candidateId,
      mode: "DEVELOPMENT_SYNTHETIC",
      expected: {
        level1: "FAIL",
        disposition: "SEMANTIC_FAILURE",
        propertyId: property.id,
        propertyJudgment: "VIOLATED",
      },
      purpose: "Structurally close candidate with one explicit reference-declared semantic defect.",
    });
  }

  const statisticalProperties = propertyRegistry.properties.filter((property) => !property.absolute);
  for (const property of statisticalProperties) {
    const pair = pairs.find((entry) =>
      entry.envelope.properties.some((item) => item.propertyId === property.id),
    );
    if (!pair) throw new Error(`No Development case declares statistical property ${property.id}`);
    const candidate = buildAdjudicationCandidate(pair, property);
    fixtures.push({ pair, candidate, role: "STATISTICAL_ADJUDICATION_MECHANIC", targetProperty: property.id });
    matrix.push({
      fixture: `fixtures/development/${fixtureFileName(candidate)}`,
      caseId: pair.benchmarkCase.caseId,
      candidateId: candidate.candidateId,
      mode: "DEVELOPMENT_SYNTHETIC",
      expected: {
        level1: "PASS",
        level2: "ADJUDICATION_REQUIRED",
        disposition: "NOT_EVALUABLE",
        propertyId: property.id,
        propertyJudgment: "ADJUDICATION_REQUIRED",
      },
      purpose: "Judgment mechanics only; no statistical threshold, score, or scientific decision is computed.",
    });
  }

  const boundaryPair = pairs[0];
  for (const [suffix, executionStatus, structureProfile, disposition] of [
    ["SAFE-FAIL-CLOSED", "SAFE_FAIL_CLOSED", "FAIL_CLOSED", "SAFE_FAIL_CLOSED"],
    ["PROVIDER-FAILURE", "PROVIDER_FAILURE", "NOT_AVAILABLE", "PROVIDER_EXECUTION_FAILURE"],
    ["NOT-EVALUABLE", "NOT_EVALUABLE", "NOT_AVAILABLE", "NOT_EVALUABLE"],
  ]) {
    const candidate = buildBaselineCandidate(boundaryPair, suffix);
    candidate.executionStatus = executionStatus;
    candidate.structureProfile = structureProfile;
    fixtures.push({ pair: boundaryPair, candidate, role: "BOUNDARY_DISPOSITION" });
    matrix.push({
      fixture: `fixtures/development/${fixtureFileName(candidate)}`,
      caseId: boundaryPair.benchmarkCase.caseId,
      candidateId: candidate.candidateId,
      mode: "DEVELOPMENT_SYNTHETIC",
      expected: { disposition },
      purpose: "Boundary disposition remains separate from semantic success and from aggregate competence.",
    });
  }

  return { fixtures, matrix, baselineByCaseId };
};

const buildCoverage = async ({ pairs, fixtures, matrix, propertyRegistry }) => {
  const { evaluateScientificUnderstanding } = await import("../core/evaluator.mjs");
  const results = fixtures.map(({ pair, candidate }) =>
    evaluateScientificUnderstanding({
      schemaVersion: "1.0.0",
      contractType: "BENCHMARK_EVALUATION_INPUT",
      evaluationId: `SEM3-EVAL-${candidate.candidateId.replace("SEM3-EVAL-CAND-", "")}`,
      evaluationMode: "DEVELOPMENT_SYNTHETIC",
      benchmarkCase: pair.benchmarkCase,
      acceptanceEnvelope: pair.envelope,
      candidateOutput: candidate,
    }),
  );
  const usedCases = new Set(fixtures.map((entry) => entry.pair.benchmarkCase.caseId));
  const observedFailureClasses = new Set(
    results.flatMap((result) => result.findings.map((finding) => finding.failureClass)),
  );
  const observedDispositions = new Set(results.map((result) => result.disposition));
  const failureRegistry = readJson(
    path.resolve(REGISTRY_ROOT, "failure-disposition-registry.json"),
  );
  const positiveProperties = new Set(
    results.flatMap((result) =>
      result.propertyJudgments
        .filter((judgment) => judgment.judgment === "SATISFIED")
        .map((judgment) => judgment.propertyId),
    ),
  );
  const negativeProperties = new Set(
    results.flatMap((result) =>
      result.propertyJudgments
        .filter((judgment) => judgment.judgment === "VIOLATED")
        .map((judgment) => judgment.propertyId),
    ),
  );
  const adjudicationProperties = new Set(
    results.flatMap((result) =>
      result.propertyJudgments
        .filter((judgment) => judgment.judgment === "ADJUDICATION_REQUIRED")
        .map((judgment) => judgment.propertyId),
    ),
  );
  return {
    schemaVersion: "1.0.0",
    contractType: "SEM003_EVALUATOR_DEVELOPMENT_COVERAGE",
    evaluatorVersion: EVALUATOR_VERSION,
    evaluatorConfigurationDigest: readJson(
      path.resolve(REGISTRY_ROOT, "evaluator-identity.json"),
    ).configurationDigest,
    modeExecuted: "DEVELOPMENT_SYNTHETIC",
    calibrationCaseContentAccessedForEvaluatorTuning: false,
    calibrationExecuted: false,
    development: {
      casesAvailable: pairs.length,
      casesUsed: usedCases.size,
      caseIdsUsed: [...usedCases].sort(),
      caseIdsUnused: pairs
        .map((pair) => pair.benchmarkCase.caseId)
        .filter((caseId) => !usedCases.has(caseId)),
    },
    candidates: {
      total: fixtures.length,
      baselinePositive: fixtures.filter((entry) => entry.role === "BASELINE_POSITIVE").length,
      structuralEquivalence: fixtures.filter((entry) => entry.role === "STRUCTURAL_EQUIVALENCE_PAIR").length,
      nearStructureCriticalFailure: fixtures.filter((entry) => entry.role === "ABSOLUTE_INVARIANT_NEGATIVE").length,
      statisticalAdjudicationMechanic: fixtures.filter((entry) => entry.role === "STATISTICAL_ADJUDICATION_MECHANIC").length,
      boundaryDispositions: fixtures.filter((entry) => entry.role === "BOUNDARY_DISPOSITION").length,
    },
    properties: {
      recognized: propertyRegistry.properties.length,
      positiveFixtureCoverage: [...positiveProperties].sort(),
      negativeFixtureCoverage: [...negativeProperties].sort(),
      adjudicationFixtureCoverage: [...adjudicationProperties].sort(),
      absolutePositiveAndNegative: propertyRegistry.properties
        .filter((property) => property.absolute)
        .every(
          (property) =>
            positiveProperties.has(property.id) && negativeProperties.has(property.id),
        ),
      statisticalMechanicsCovered: propertyRegistry.properties
        .filter((property) => !property.absolute)
        .every((property) => adjudicationProperties.has(property.id)),
    },
    failureClasses: {
      recognized: failureRegistry.failureClasses.length,
      observedInSyntheticFixtures: [...observedFailureClasses].sort(),
      unobservedButContractuallySupported: failureRegistry.failureClasses.filter(
        (failureClass) => !observedFailureClasses.has(failureClass),
      ),
    },
    dispositions: {
      recognized: failureRegistry.dispositions.length,
      observedInDevelopmentSynthetic: [...observedDispositions].sort(),
      supportedButNotExecutedWithoutHumanDecision: failureRegistry.dispositions.filter(
        (disposition) => !observedDispositions.has(disposition),
      ),
    },
    testMatrixRows: matrix.length,
    gaps: [
      "Human scientific reference review remains required.",
      "Human methodological review remains required.",
      "The five declared equivalence pairs remain open for human adjudication.",
      "The evaluator has not been calibrated or qualified under PD-011.",
      "FUTURE_SEM_RUNTIME and HUMAN_ADJUDICATION modes are implemented as contracts but were not executed.",
      "No threshold, N value, aggregate score, blind package, or qualification decision exists.",
    ],
  };
};

const main = async () => {
  const propertyRegistry = buildPropertyRegistry();
  writeOrCheck(path.resolve(REGISTRY_ROOT, "property-registry.json"), propertyRegistry);

  const pairs = loadDevelopmentPairs();
  const { fixtures, matrix } = buildFixtures(pairs, propertyRegistry);
  const expectedFixtureFiles = new Set(
    fixtures.map(({ candidate }) => fixtureFileName(candidate)),
  );
  if (!CHECK_ONLY) {
    for (const file of fs.readdirSync(FIXTURE_ROOT)) {
      if (file.endsWith(".candidate.json") && !expectedFixtureFiles.has(file)) {
        fs.unlinkSync(path.resolve(FIXTURE_ROOT, file));
      }
    }
  }
  for (const { candidate } of fixtures) {
    writeOrCheck(path.resolve(FIXTURE_ROOT, fixtureFileName(candidate)), candidate);
  }
  writeOrCheck(path.resolve(ARTIFACT_ROOT, "test-matrix.json"), {
    schemaVersion: "1.0.0",
    contractType: "SEM003_EVALUATOR_DEVELOPMENT_TEST_MATRIX",
    evaluatorMode: "DEVELOPMENT_SYNTHETIC",
    rows: matrix,
  });

  const identity = computeEvaluatorIdentity();
  writeOrCheck(path.resolve(REGISTRY_ROOT, "evaluator-identity.json"), identity);
  const coverage = await buildCoverage({ pairs, fixtures, matrix, propertyRegistry });
  writeOrCheck(path.resolve(ARTIFACT_ROOT, "evaluator-coverage.json"), coverage);

  process.stdout.write(
    `SEM-003 evaluator fixtures ${CHECK_ONLY ? "verified" : "generated"}: ${fixtures.length} candidates, ${matrix.length} matrix rows, ${propertyRegistry.properties.length} properties\n`,
  );
};

await main();
