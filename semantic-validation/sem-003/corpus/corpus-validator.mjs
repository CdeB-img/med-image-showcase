import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateAuthoringPackage } from "../authoring/validator.mjs";

const CORPUS_ROOT = path.dirname(fileURLToPath(import.meta.url));

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const sha256File = (filePath) =>
  crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
const error = (code, location, message) => ({ code, location, message });
const listFilesRecursive = (directory) =>
  fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? listFilesRecursive(entryPath) : [entryPath];
    })
    .sort();

const loadDirectoryPairs = (directory) => {
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

export const loadCorpus = (root = CORPUS_ROOT) => {
  const development = loadDirectoryPairs(path.join(root, "development"));
  const calibration = loadDirectoryPairs(path.join(root, "calibration"));
  return {
    root,
    development,
    calibration,
    cases: [...development.cases, ...calibration.cases],
    envelopes: [...development.envelopes, ...calibration.envelopes],
    registry: readJson(path.join(root, "registry", "corpus-registry.json")),
    coverage: readJson(path.join(root, "coverage", "coverage-matrix.json")),
    reviewQueue: readJson(path.join(root, "registry", "review-queue.json")),
    parentage: readJson(
      path.join(root, "registry", "parentage-contamination-summary.json"),
    ),
    manifest: readJson(path.join(root, "registry", "corpus-manifest.json")),
  };
};

const countBy = (values) => {
  const result = {};
  for (const value of values) result[value] = (result[value] || 0) + 1;
  return Object.fromEntries(Object.entries(result).sort(([left], [right]) => left.localeCompare(right)));
};

const sameObject = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const sameRecord = (left, right) => {
  const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])];
  return keys.every((key) => left[key] === right[key]);
};

export const validateCorpus = (corpus = loadCorpus()) => {
  const errors = [];
  const repositoryRoot = path.resolve(corpus.root, "../../..");
  const authoring = validateAuthoringPackage({
    cases: corpus.cases,
    envelopes: corpus.envelopes,
  });
  errors.push(
    ...authoring.errors.map((entry) => ({
      ...entry,
      code: `AUTHORING_${entry.code}`,
    })),
  );

  const caseById = new Map(corpus.cases.map((entry) => [entry.caseId, entry]));
  const envelopeByCaseId = new Map(
    corpus.envelopes.map((entry) => [entry.caseId, entry]),
  );
  const registryById = new Map(
    corpus.registry.entries.map((entry) => [entry.caseId, entry]),
  );

  if (corpus.registry.entries.length !== corpus.cases.length) {
    errors.push(
      error(
        "REGISTRY_CASE_COUNT_MISMATCH",
        "registry.entries",
        "registry entry count must match Case count",
      ),
    );
  }

  for (const benchmarkCase of corpus.cases) {
    const registryEntry = registryById.get(benchmarkCase.caseId);
    if (!registryEntry) {
      errors.push(
        error("REGISTRY_ENTRY_MISSING", benchmarkCase.caseId, "Case is missing from registry"),
      );
      continue;
    }
    if (registryEntry.version !== benchmarkCase.version) {
      errors.push(
        error("VERSION_MISMATCH", benchmarkCase.caseId, "Case and registry versions differ"),
      );
    }

    const turnIds = benchmarkCase.source.conversationTurns.map((entry) => entry.turnId);
    const expectedTurnIds = turnIds.map((_, index) => `turn-${index + 1}`);
    if (!sameObject(turnIds, expectedTurnIds)) {
      errors.push(
        error(
          "CONVERSATION_TURN_ORDER_INVALID",
          benchmarkCase.caseId,
          "conversation turns must be contiguous and ordered from turn-1",
        ),
      );
    }
    if (registryEntry.turnCount !== turnIds.length) {
      errors.push(
        error(
          "REGISTRY_TURN_COUNT_MISMATCH",
          benchmarkCase.caseId,
          "registry turnCount must match the Case",
        ),
      );
    }

    const serializedSource = JSON.stringify({
      sourceRequest: benchmarkCase.source.sourceRequest,
      provenance: benchmarkCase.source.provenance,
    });
    if (/\bH(?:0[1-9]|[12][0-9]|30)\b/.test(serializedSource)) {
      errors.push(
        error(
          "HISTORICAL_LEGACY_SOURCE_REFERENCE_FORBIDDEN",
          benchmarkCase.caseId,
          "H01-H30 cannot be used as source material",
        ),
      );
    }

    if (
      benchmarkCase.purpose === "DEVELOPMENT_AUTHORING" &&
      (benchmarkCase.exposure.exposureStatus !== "DEVELOPMENT_VISIBLE" ||
        benchmarkCase.exposure.eligibleForBlindQualification)
    ) {
      errors.push(
        error(
          "DEVELOPMENT_EXPOSURE_INVALID",
          benchmarkCase.caseId,
          "Development cases must be DEVELOPMENT_VISIBLE and blind-ineligible",
        ),
      );
    }

    if (
      benchmarkCase.purpose === "CALIBRATION_AUTHORING" &&
      (benchmarkCase.exposure.exposureStatus !== "CALIBRATION_VISIBLE" ||
        !benchmarkCase.exposure.eligibleForCalibration ||
        benchmarkCase.exposure.eligibleForBlindQualification ||
        benchmarkCase.reviewStatus !== "APPROVED_FOR_CALIBRATION" ||
        benchmarkCase.exposure.parentageStatus !== "PARENTAGE_CLEAR" ||
        benchmarkCase.exposure.contaminationReview.status !== "CLEAR" ||
        registryEntry.calibrationDisposition !==
          "APPROVED_FOR_DEVELOPMENT_CALIBRATION_ONLY" ||
        registryEntry.referenceReviewBasis !==
          "SIMULATED_PLURALISTIC_EXPERT_REVIEW" ||
        registryEntry.finalPD011ReferenceEligibility !== "NO" ||
        registryEntry.blindEligibility !== "NO")
    ) {
      errors.push(
        error(
          "CALIBRATION_DEVELOPMENT_REFERENCE_GATE_INVALID",
          benchmarkCase.caseId,
          "Calibration references admitted from simulated review must be visible only for development calibration and remain ineligible for formal independent or blind qualification",
        ),
      );
    }

    if (
      benchmarkCase.purpose === "CALIBRATION_AUTHORING" &&
      envelopeByCaseId.get(benchmarkCase.caseId)?.reviewStatus !==
        "APPROVED_FOR_CALIBRATION"
    ) {
      errors.push(
        error(
          "CALIBRATION_ENVELOPE_REVIEW_STATUS_INVALID",
          benchmarkCase.caseId,
          "Calibration Case and Acceptance Envelope must share the admitted development-calibration review status",
        ),
      );
    }

    if (
      benchmarkCase.purpose === "CALIBRATION_AUTHORING" &&
      JSON.stringify(benchmarkCase).includes("SEM3-EX-")
    ) {
      errors.push(
        error(
          "EXPOSED_EXAMPLE_REUSED_FOR_CALIBRATION",
          benchmarkCase.caseId,
          "Calibration candidates cannot derive from exposed SEM-003 examples",
        ),
      );
    }

    if (registryEntry.features.includes("CORRECTION")) {
      const envelope = envelopeByCaseId.get(benchmarkCase.caseId);
      const semanticKeys = new Set(envelope.required.map((entry) => entry.semanticKey));
      const prefix = `${benchmarkCase.caseId.toLowerCase()}.`;
      if (
        !semanticKeys.has(`${prefix}current-state`) ||
        !semanticKeys.has(`${prefix}historical-state`)
      ) {
        errors.push(
          error(
            "CORRECTION_STATE_REPRESENTATION_MISSING",
            benchmarkCase.caseId,
            "correction cases must distinguish current and historical state",
          ),
        );
      }
    }

    const casePath = path.join(repositoryRoot, registryEntry.paths.case);
    const envelopePath = path.join(repositoryRoot, registryEntry.paths.acceptanceEnvelope);
    const actualCaseDigest = sha256File(casePath);
    const actualEnvelopeDigest = sha256File(envelopePath);
    if (actualCaseDigest !== registryEntry.digests.caseSha256) {
      errors.push(error("CASE_DIGEST_MISMATCH", benchmarkCase.caseId, "Case digest is stale"));
    }
    if (actualEnvelopeDigest !== registryEntry.digests.acceptanceEnvelopeSha256) {
      errors.push(
        error(
          "ENVELOPE_DIGEST_MISMATCH",
          benchmarkCase.caseId,
          "Acceptance Envelope digest is stale",
        ),
      );
    }
    const expectedPairDigest = crypto
      .createHash("sha256")
      .update(`${actualCaseDigest}:${actualEnvelopeDigest}`)
      .digest("hex");
    if (expectedPairDigest !== registryEntry.digests.pairSha256) {
      errors.push(error("PAIR_DIGEST_MISMATCH", benchmarkCase.caseId, "pair digest is stale"));
    }
  }

  const developmentSources = corpus.development.cases.map((entry) =>
    entry.source.sourceRequest.toLocaleLowerCase("fr"),
  );
  const calibrationSources = corpus.calibration.cases.map((entry) =>
    entry.source.sourceRequest.toLocaleLowerCase("fr"),
  );
  for (const source of calibrationSources) {
    if (developmentSources.includes(source)) {
      errors.push(
        error(
          "INTER_SET_SOURCE_DUPLICATE",
          "calibration",
          "Development and Calibration cannot share the same source request",
        ),
      );
    }
  }

  const demonstrationEnvelopes = corpus.envelopes.filter(
    (entry) => entry.evaluationDemonstrations.length > 0,
  );
  if (demonstrationEnvelopes.length > 5) {
    errors.push(
      error(
        "EVALUATOR_DEMONSTRATION_CASE_LIMIT_EXCEEDED",
        "envelopes.evaluationDemonstrations",
        "no more than five Development cases may contain evaluator demonstrations",
      ),
    );
  }
  const calibrationCaseIds = new Set(
    corpus.calibration.cases.map((entry) => entry.caseId),
  );
  for (const envelope of demonstrationEnvelopes) {
    if (calibrationCaseIds.has(envelope.caseId)) {
      errors.push(
        error(
          "CALIBRATION_EVALUATOR_DEMONSTRATION_FORBIDDEN",
          envelope.caseId,
          "Calibration candidates cannot contain evaluator demonstrations",
        ),
      );
    }
  }

  const categoryCounts = countBy(
    corpus.registry.entries.flatMap((entry) => [
      entry.scenarioCategory,
      ...entry.secondaryCategories,
    ]),
  );
  const propertyCounts = countBy(
    corpus.registry.entries.flatMap((entry) => entry.applicableProperties),
  );
  if (!sameRecord(categoryCounts, corpus.coverage.categoryCounts)) {
    errors.push(
      error(
        "COVERAGE_CATEGORY_MISMATCH",
        "coverage.categoryCounts",
        "category coverage does not match registry",
      ),
    );
  }
  if (!sameRecord(propertyCounts, corpus.coverage.propertyCounts)) {
    errors.push(
      error(
        "COVERAGE_PROPERTY_MISMATCH",
        "coverage.propertyCounts",
        "property coverage does not match registry",
      ),
    );
  }

  const expectedSummary = {
    totalCases: corpus.cases.length,
    developmentCases: corpus.development.cases.length,
    calibrationDesignOnly: corpus.calibration.cases.filter(
      (entry) => entry.exposure.exposureStatus === "DESIGN_ONLY",
    ).length,
    calibrationVisible: corpus.calibration.cases.filter(
      (entry) => entry.exposure.exposureStatus === "CALIBRATION_VISIBLE",
    ).length,
    totalConversationTurns: corpus.cases.reduce(
      (sum, entry) => sum + entry.source.conversationTurns.length,
      0,
    ),
    singleTurnCases: corpus.cases.filter(
      (entry) => entry.source.conversationTurns.length === 1,
    ).length,
    multiTurnCases: corpus.cases.filter(
      (entry) => entry.source.conversationTurns.length > 1,
    ).length,
    multiTurnContextDependentCases: corpus.registry.entries.filter(
      (entry) => entry.multiTurnContextDependent,
    ).length,
    casesOverSevenTurns: corpus.cases.filter(
      (entry) => entry.source.conversationTurns.length > 7,
    ).length,
  };
  if (!sameObject(expectedSummary, corpus.coverage.summary)) {
    errors.push(
      error(
        "COVERAGE_SUMMARY_MISMATCH",
        "coverage.summary",
        "coverage summary does not match corpus files",
      ),
    );
  }

  for (const [artifactName, artifact] of Object.entries(corpus.manifest.artifacts)) {
    const artifactPath = path.join(repositoryRoot, artifact.path);
    if (sha256File(artifactPath) !== artifact.sha256) {
      errors.push(
        error(
          "MANIFEST_ARTIFACT_DIGEST_MISMATCH",
          artifactName,
          `${artifact.path} digest does not match manifest`,
        ),
      );
    }
  }

  const manifestRelativePath = path.relative(
    repositoryRoot,
    path.join(corpus.root, "registry", "corpus-manifest.json"),
  );
  const actualInventoryPaths = listFilesRecursive(corpus.root)
    .map((filePath) => path.relative(repositoryRoot, filePath))
    .filter((filePath) => filePath !== manifestRelativePath)
    .sort();
  const declaredInventoryPaths = corpus.manifest.fileInventory
    .map((entry) => entry.path)
    .sort();
  if (!sameObject(actualInventoryPaths, declaredInventoryPaths)) {
    errors.push(
      error(
        "MANIFEST_FILE_INVENTORY_MISMATCH",
        "manifest.fileInventory",
        "manifest must list every corpus file except itself, without extra paths",
      ),
    );
  }
  for (const artifact of corpus.manifest.fileInventory) {
    const artifactPath = path.join(repositoryRoot, artifact.path);
    if (!fs.existsSync(artifactPath) || sha256File(artifactPath) !== artifact.sha256) {
      errors.push(
        error(
          "MANIFEST_FILE_INVENTORY_DIGEST_MISMATCH",
          artifact.path,
          "inventoried file digest does not match manifest",
        ),
      );
    }
  }

  for (const calibrationCase of corpus.calibration.cases) {
    const types = new Set(
      corpus.reviewQueue.items
        .filter((item) => item.caseId === calibrationCase.caseId)
        .map((item) => item.reviewType),
    );
    for (const requiredType of [
      "SCIENTIFIC_REVIEW_REQUIRED",
      "CALIBRATION_REVIEW_REQUIRED",
      "PARENTAGE_REVIEW_REQUIRED",
    ]) {
      if (!types.has(requiredType)) {
        errors.push(
          error(
            "CALIBRATION_REVIEW_QUEUE_INCOMPLETE",
            calibrationCase.caseId,
            `missing ${requiredType}`,
          ),
        );
      }
    }
  }

  if (corpus.parentage.sourceReuse.historicalH01H30) {
    errors.push(
      error("HISTORICAL_REUSE_DECLARED", "parentage", "H01-H30 reuse must remain false"),
    );
  }
  if (corpus.parentage.sourceReuse.sem002OrSem003ExampleAsCalibration) {
    errors.push(
      error(
        "EXPOSED_EXAMPLE_REUSE_DECLARED",
        "parentage",
        "exposed examples cannot be Calibration sources",
      ),
    );
  }
  if (corpus.parentage.interSetOverlap.contaminationBlockerCount !== 0) {
    errors.push(
      error(
        "CONTAMINATION_BLOCKER_PRESENT",
        "parentage",
        "contamination blockers require STOP",
      ),
    );
  }

  const forbiddenStatuses = new Set(["BLIND_SEALED", "QUALIFICATION_EXECUTED"]);
  for (const benchmarkCase of corpus.cases) {
    if (forbiddenStatuses.has(benchmarkCase.exposure.exposureStatus)) {
      errors.push(
        error(
          "FORBIDDEN_EXPOSURE_STATUS",
          benchmarkCase.caseId,
          benchmarkCase.exposure.exposureStatus,
        ),
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    counts: {
      developmentCases: corpus.development.cases.length,
      calibrationCandidates: corpus.calibration.cases.length,
      cases: corpus.cases.length,
      envelopes: corpus.envelopes.length,
      totalConversationTurns: expectedSummary.totalConversationTurns,
      reviewItems: corpus.reviewQueue.items.length,
    },
    scope: "STRUCTURAL_AND_CONTRACTUAL_ONLY",
    scientificJudgmentPerformed: false,
    semRuntimeExecuted: false,
    providerCalls: 0,
  };
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = validateCorpus();
  console.log(JSON.stringify(result, null, 2));
  if (!result.valid) process.exitCode = 1;
}
