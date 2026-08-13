import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";

const VALIDATOR_ROOT = path.dirname(fileURLToPath(import.meta.url));
const BLIND_ROOT = path.dirname(VALIDATOR_ROOT);
const REPOSITORY_ROOT = path.resolve(BLIND_ROOT, "../../..");
const readJson = (target) => JSON.parse(fs.readFileSync(target, "utf8"));
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const sha256File = (target) => sha256(fs.readFileSync(target));
const relative = (target) => path.relative(BLIND_ROOT, target).split(path.sep).join("/");
const filesWithSuffix = (directory, suffix) => fs
  .readdirSync(directory)
  .filter((entry) => entry.endsWith(suffix))
  .sort()
  .map((entry) => path.join(directory, entry));
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const unique = (values) => new Set(values).size === values.length;
const digestEntries = (files) => files.map((target) => ({ path: relative(target), sha256: sha256File(target) }));
const packageDigest = (entries) => sha256(JSON.stringify(entries));
const getKeys = (value, result = new Set()) => {
  if (Array.isArray(value)) value.forEach((entry) => getKeys(entry, result));
  else if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      result.add(key);
      getKeys(entry, result);
    }
  }
  return result;
};

export const CHECK_IDS = Object.freeze(Array.from({ length: 30 }, (_, index) => `C${String(index + 1).padStart(2, "0")}`));

export const validateBlindSet = () => {
  const checks = [];
  const check = (id, label, pass, evidence) => checks.push({ id, label, pass: Boolean(pass), evidence });
  const caseFiles = filesWithSuffix(path.join(BLIND_ROOT, "sealed-reference", "cases"), ".case.json");
  const envelopeFiles = filesWithSuffix(path.join(BLIND_ROOT, "sealed-reference", "envelopes"), ".envelope.json");
  const inputFiles = filesWithSuffix(path.join(BLIND_ROOT, "input", "cases"), ".input.json");
  const cases = caseFiles.map(readJson);
  const envelopes = envelopeFiles.map(readJson);
  const inputs = inputFiles.map(readJson);
  const manifest = readJson(path.join(BLIND_ROOT, "artifacts", "blind-set-manifest.json"));
  const inputManifest = readJson(path.join(BLIND_ROOT, "artifacts", "blind-input-manifest.json"));
  const referenceManifest = readJson(path.join(BLIND_ROOT, "artifacts", "sealed-reference-manifest.json"));
  const preparation = readJson(path.join(BLIND_ROOT, "artifacts", "sem003d-execution-preparation.json"));
  const antiLeakage = readJson(path.join(BLIND_ROOT, "artifacts", "anti-leakage-audit.json"));
  const registry = readJson(path.join(BLIND_ROOT, "registry", "blind-registry.json"));
  const coverage = readJson(path.join(BLIND_ROOT, "coverage", "blind-coverage-matrix.json"));
  const parentage = readJson(path.join(BLIND_ROOT, "review", "blind-parentage-review.json"));
  const referenceReview = readJson(path.join(BLIND_ROOT, "review", "blind-reference-review.json"));
  const evaluatorIdentity = readJson(path.resolve(BLIND_ROOT, "../evaluator/registry/evaluator-identity.json"));
  const evaluatorFreeze = readJson(path.resolve(BLIND_ROOT, "../evaluator/registry/evaluator-post-b4r-freeze-manifest.json"));

  const ajv = new Ajv({ allErrors: true, format: "full" });
  const validateCase = ajv.compile(readJson(path.join(BLIND_ROOT, "contracts", "blind-case.schema.json")));
  const validateEnvelope = ajv.compile(readJson(path.join(BLIND_ROOT, "contracts", "blind-acceptance-envelope.schema.json")));
  const validateInput = ajv.compile(readJson(path.join(BLIND_ROOT, "contracts", "blind-runtime-input.schema.json")));
  const caseSchemaPass = cases.length === 15 && cases.every((entry) => validateCase(entry));
  check("C01", "Case schema valid", caseSchemaPass, `${cases.length}/15 blind Cases valid`);

  const envelopeByCaseId = new Map(envelopes.map((entry) => [entry.caseId, entry]));
  const envelopeSchemaPass = envelopes.length === 15 && envelopes.every((entry) => validateEnvelope(entry)) && cases.every((entry) => {
    const envelope = envelopeByCaseId.get(entry.caseId);
    return envelope?.envelopeId === entry.reference.acceptanceEnvelopeId &&
      same(envelope.properties.map((property) => property.propertyId).sort(), [...entry.reference.applicableSEM002Properties].sort());
  });
  check("C02", "Acceptance Envelope schema valid", envelopeSchemaPass, `${envelopes.length}/15 envelopes valid and cross-linked`);

  const visibleCases = [];
  for (const set of ["development", "calibration"]) {
    const directory = path.join(REPOSITORY_ROOT, "semantic-validation", "sem-003", "corpus", set);
    for (const target of filesWithSuffix(directory, ".case.json")) visibleCases.push(readJson(target));
  }
  const legacyIds = fs.readdirSync(path.join(REPOSITORY_ROOT, "semantic-validation", "sem-001r5p", "case-checkpoints"))
    .filter((entry) => /^SEM-H\d{2}\.json$/.test(entry))
    .map((entry) => entry.slice(0, -5));
  const allIds = [...cases.map((entry) => entry.caseId), ...visibleCases.map((entry) => entry.caseId), ...legacyIds];
  check("C03", "No duplicate IDs across Development, Calibration and H01-H30", unique(allIds), `${allIds.length} IDs are unique`);

  const parentageNoDerivation = parentage.reviewUnits.every((entry) =>
    entry.translationOrParaphrase === false &&
    entry.superficialPathologySwap === false &&
    entry.exposedScenarioRecombination === false &&
    entry.peerBlindDistinct === true,
  );
  const provenanceNoCaseRefs = cases.every((entry) =>
    entry.source.provenance.originType === "SYNTHETIC_AUTHORED" &&
    entry.source.provenance.inspirationRefs.every((ref) => !/SEM3-(DEV|CAL|EX)|SEM-H\d{2}/.test(ref)),
  );
  check("C04", "No exposed derivation", parentageNoDerivation && provenanceNoCaseRefs, "No translation, paraphrase, pathology swap, recombination or exposed case source reference");

  check("C05", "Parentage complete", parentage.reviewUnits.length === 15 && parentage.reviewUnits.every((entry) => entry.status === "BLIND_PARENTAGE_CLEAR"), `${parentage.summary.blindParentageClear}/15 BLIND_PARENTAGE_CLEAR`);
  check("C06", "No contaminated case sealed", cases.every((entry) => entry.exposure.exposureStatus === "BLIND_SEALED" && entry.exposure.parentageStatus === "BLIND_PARENTAGE_CLEAR" && entry.exposure.contaminationReview.status === "CLEAR"), "All sealed cases are parentage-clear and contamination-clear");

  const forbiddenInputKeys = new Set(["required", "prohibited", "acceptableSemanticVariants", "optionalRelevant", "admissibleAmbiguities", "expectedClarification", "ownershipBoundaries", "properties", "adjudication", "acceptanceEnvelopeId", "reference"]);
  const inputKeys = new Set(inputs.flatMap((entry) => [...getKeys(entry)]));
  const inputSchemaPass = inputs.every((entry) => validateInput(entry));
  check("C07", "Input package contains no Acceptance Envelope", inputSchemaPass && [...forbiddenInputKeys].every((key) => !inputKeys.has(key)), "15 runtime inputs contain only source payload fields");
  check("C08", "Input package contains no reference", inputManifest.containsReferenceJudgments === false && inputManifest.containsAcceptanceEnvelopes === false && !inputFiles.some((target) => /envelope|reference/i.test(path.basename(target))), "Input manifest denies references and envelopes");
  check("C09", "Sealed package contains every reference", envelopes.length === cases.length && referenceManifest.files.filter((entry) => entry.path.endsWith(".case.json")).length === 15 && referenceManifest.files.filter((entry) => entry.path.endsWith(".envelope.json")).length === 15, "15 Cases and 15 Envelopes present in sealed reference manifest");

  const inputDigests = new Set(inputManifest.files.map((entry) => entry.sha256));
  const referenceDigests = new Set(referenceManifest.files.map((entry) => entry.sha256));
  check("C10", "Distinct and reconstructible digests", inputDigests.size === inputManifest.files.length && referenceDigests.size === referenceManifest.files.length && manifest.inputPackageDigest !== manifest.referencePackageDigest, "Per-file and package digests are distinct");

  const resultsDirectoryAbsent = !fs.existsSync(path.join(BLIND_ROOT, "results"));
  check("C11", "No SEM result present", resultsDirectoryAbsent && inputManifest.containsSEMResults === false && antiLeakage.semOutputUsedForAuthoring === false, "No results directory and no SEM output used");
  check("C12", "Qualification not executed", manifest.qualificationStatus === "NOT_YET_EXECUTED" && registry.entries.every((entry) => entry.qualificationStatus === "NOT_YET_EXECUTED"), "Manifest and registry remain NOT_YET_EXECUTED");

  const inputGenerator = fs.readFileSync(path.join(BLIND_ROOT, "authoring", "generate-blind-input.mjs"), "utf8");
  const referenceGenerator = fs.readFileSync(path.join(BLIND_ROOT, "sealed-reference", "generate-blind-references.mjs"), "utf8");
  check("C13", "Immutability after seal", manifest.immutableAfterSeal === true && registry.immutableAfterSeal === true && inputGenerator.includes("IMMUTABLE_BLIND_SET") && referenceGenerator.includes("IMMUTABLE_BLIND_SET") && cases.every((entry) => entry.exposure.exposureHistory.some((event) => event.toStatus === "BLIND_SEALED")), "Manifests, exposure history and authoring guards enforce post-seal immutability");

  check("C14", "No blind case is Development or Calibration visible", cases.every((entry) => !["DEVELOPMENT_VISIBLE", "CALIBRATION_VISIBLE"].includes(entry.exposure.exposureStatus)), "All blind cases are BLIND_SEALED only");
  check("C15", "No visible case is BLIND_SEALED", visibleCases.every((entry) => entry.exposure.exposureStatus !== "BLIND_SEALED"), `${visibleCases.length} visible corpus cases remain non-blind`);
  check("C16", "Evaluator version 1.1.0", manifest.evaluatorTarget.version === "1.1.0" && evaluatorIdentity.version === "1.1.0", "Evaluator target and identity are 1.1.0");
  check("C17", "Evaluator digest exact", manifest.evaluatorTarget.configurationDigest === "b05bc0ac66cb3e4dc5f135ba278cac8cadebe7443e57b1003dca580c9bd0e9bd" && evaluatorIdentity.configurationDigest === manifest.evaluatorTarget.configurationDigest, "Evaluator digest matches frozen B4R identity");
  check("C18", "Evaluator unchanged", evaluatorFreeze.evaluatorVersion === "1.1.0" && evaluatorFreeze.configurationDigest === manifest.evaluatorTarget.configurationDigest && !fs.existsSync(path.join(BLIND_ROOT, "evaluator")), "Blind package neither owns nor shadows evaluator files");
  check("C19", "No SEM-output provenance", cases.every((entry) => entry.source.provenance.originType !== "SEM_OUTPUT") && antiLeakage.semOutputUsedForAuthoring === false, "All cases are SYNTHETIC_AUTHORED before SEM output");
  check("C20", "Simulated reviewers never represented as human", referenceReview.reviewUnits.every((unit) => unit.reviewerDecisions.every((decision) => decision.reviewerType === "SIMULATED_REVIEW_ROLE" && decision.realHumanReviewer === false)), "Three simulated roles per case, zero human identity claim");
  check("C21", "Human review status exact", referenceReview.realHumanReferenceReview === "NOT_PERFORMED" && manifest.realHumanReferenceReview === "NOT_PERFORMED", "REAL_HUMAN_REFERENCE_REVIEW = NOT_PERFORMED");
  check("C22", "No final PD-011 claim", referenceReview.finalPD011ReferenceEligibility === "NO" && manifest.finalPD011ReferenceEligibility === "NO" && registry.entries.every((entry) => entry.finalPD011ReferenceEligibility === "NO"), "FINAL_PD011_REFERENCE_ELIGIBILITY = NO");

  const actualDomainGroups = {};
  const actualCategories = {};
  const actualProperties = Object.fromEntries(Object.keys(coverage.propertyCoverage).map((propertyId) => [propertyId, 0]));
  let actualMulti = 0;
  for (const benchmarkCase of cases) {
    actualDomainGroups[benchmarkCase.scientificScope.domainGroup] = (actualDomainGroups[benchmarkCase.scientificScope.domainGroup] || 0) + 1;
    actualCategories[benchmarkCase.scientificScope.scenarioCategory] = (actualCategories[benchmarkCase.scientificScope.scenarioCategory] || 0) + 1;
    if (benchmarkCase.source.conversationTurns.length > 1) actualMulti += 1;
    for (const propertyId of benchmarkCase.reference.applicableSEM002Properties) actualProperties[propertyId] += 1;
  }
  check("C23", "Coverage matrix reflects actual corpus", same(actualDomainGroups, coverage.domainGroups) && same(actualCategories, coverage.scenarioCategoryCoverage) && same(actualProperties, coverage.propertyCoverage) && actualMulti === coverage.conversationStructure.multiTurnCases && Object.values(actualProperties).every((count) => count > 0), "6 cardiovascular, 5 other imaging, 4 transversal; 15 categories and 18 properties covered");

  const recomputedInputEntries = digestEntries(inputFiles);
  const parentagePath = path.join(BLIND_ROOT, "review", "blind-parentage-review.json");
  const referenceReviewPath = path.join(BLIND_ROOT, "review", "blind-reference-review.json");
  const recomputedReferenceEntries = digestEntries([...caseFiles, ...envelopeFiles, parentagePath, referenceReviewPath]);
  const manifestCaseDigestsPass = manifest.cases.every((entry) => {
    const registryEntry = registry.entries.find((candidate) => candidate.caseId === entry.caseId);
    return registryEntry && entry.inputDigest === registryEntry.input.sha256 && entry.caseDigest === registryEntry.reference.caseSha256 && entry.envelopeDigest === registryEntry.reference.envelopeSha256;
  });
  check("C24", "Manifests and digests valid", same(inputManifest.files, recomputedInputEntries) && same(referenceManifest.files, recomputedReferenceEntries) && inputManifest.inputPackageDigest === packageDigest(recomputedInputEntries) && referenceManifest.referencePackageDigest === packageDigest(recomputedReferenceEntries) && manifest.inputPackageDigest === inputManifest.inputPackageDigest && manifest.referencePackageDigest === referenceManifest.referencePackageDigest && manifest.coverageDigest === sha256File(path.join(BLIND_ROOT, "coverage", "blind-coverage-matrix.json")) && manifestCaseDigestsPass, "All file, package, coverage and case digests reconstruct");

  check("C25", "SEM-003D plan executes nothing", preparation.contractType === "SEM003D_EXECUTION_PREPARATION_ONLY" && preparation.status === "PREPARED_NOT_EXECUTED" && preparation.execute === false, "Preparation-only manifest; no run or provider execution");
  check("C26", "No P13-P18 threshold created", coverage.p13ToP18Thresholds === "UNRESOLVED_FOR_FINAL_PD011_DECISION" && preparation.p13ToP18FinalDecision === "UNRESOLVED_FOR_FINAL_PD011_DECISION" && preparation.thresholds === "NO_NEW_THRESHOLD_CREATED_BY_SEM003C", "P13-P18 final decision and thresholds remain unresolved under PD-011");
  check("C27", "No composite metric", coverage.aggregateScore === null && coverage.compositeMetric === false, "No aggregate or composite score");
  check("C28", "No rule derived from SEM output", antiLeakage.semOutputUsedForAuthoring === false && referenceReview.semOutputObserved === false && cases.every((entry) => !/SEM output was used/i.test(entry.source.sourceContext)), "Authoring, references and rules predate every SEM output");

  const calibrationFixturesRoot = path.join(REPOSITORY_ROOT, "semantic-validation", "sem-003", "calibration", "restart-v1.1.0", "fixtures");
  const calibrationFixtureDigests = new Set(filesWithSuffix(calibrationFixturesRoot, ".json").map(sha256File));
  const visibleSourceRequests = new Set(visibleCases.map((entry) => entry.source.sourceRequest));
  const noCopiedFixture = inputFiles.every((target) => !calibrationFixtureDigests.has(sha256File(target))) && inputs.every((entry) => !visibleSourceRequests.has(entry.sourceRequest));
  check("C29", "No Calibration fixture copied", noCopiedFixture && antiLeakage.developmentOrCalibrationFixtureCopied === false, "No input digest matches a Calibration fixture and no source request matches a visible case");

  check("C30", "Seal only after all gates green", manifest.sealStatus === "SEALED_FOR_SEM003D" && manifest.allSealGatesGreen === true && checks.every((entry) => entry.pass), "C01-C29 green before final seal assertion");
  return { decision: checks.every((entry) => entry.pass) ? "PASS" : "FAIL", checks };
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = validateBlindSet();
  console.log(JSON.stringify({ decision: result.decision, passed: result.checks.filter((entry) => entry.pass).length, total: result.checks.length, failures: result.checks.filter((entry) => !entry.pass) }, null, 2));
  if (result.decision !== "PASS") process.exitCode = 1;
}

