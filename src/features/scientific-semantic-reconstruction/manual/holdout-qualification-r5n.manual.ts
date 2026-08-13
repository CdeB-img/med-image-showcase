/* eslint-disable @typescript-eslint/no-explicit-any */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnv } from "vite";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { SCIENTIFIC_SEMANTIC_ATOMIC_COMPOSITION_AUDIT_PROMPT } from "../../../../api/prompts/scientific-semantic-atomic-composition-prompt";
import { SCIENTIFIC_SEMANTIC_CRITIC_PROMPT, SCIENTIFIC_SEMANTIC_RECONSTRUCTION_PROMPT } from "../../../../api/prompts/scientific-semantic-reconstruction-prompt";
import {
  runSemanticAtomicCompositionCycles,
  SEMANTIC_ATOMIC_COMPOSITION_AUDIT_JSON_SCHEMA,
  type SemanticAtomicCompositionProvider,
} from "../atomic-composition";
import { canonicalizeSemanticReconstruction } from "../canonical";
import { evaluateSemanticCampaign, evaluateSemanticCase, type SemanticCaseMetrics } from "../competence";
import { DEVELOPMENT_CASES, HOLDOUT_CASES, type SemanticCompetenceCase } from "../competence-fixtures";
import { runSemanticCriticCycles } from "../coverage";
import { verifySemanticModelWithKnowledge } from "../knowledge";
import { GeminiScientificSemanticProvider, SemanticProviderError } from "../provider";
import { SEMANTIC_CRITIC_JSON_SCHEMA, SEMANTIC_RECONSTRUCTION_JSON_SCHEMA } from "../schema";
import {
  SCIENTIFIC_SEMANTIC_MODEL_VERSION,
  SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
  SEMANTIC_CRITIC_PROMPT_VERSION,
  SEMANTIC_RECONSTRUCTION_PROMPT_VERSION,
  type ScientificSemanticModel,
  type ScientificSemanticProvider,
  type SemanticConversationMessage,
  type SemanticProviderAttempt,
  type SemanticProviderFailureCategory,
  type SemanticReconstructionRequest,
} from "../types";
import { RollingWindowRequestLimiter } from "./rolling-rate-limiter";

const ROOT = process.cwd();
const DIRECTORY = path.resolve(ROOT, "semantic-validation/sem-001r5n");
const CAMPAIGN = "SEM-001R5N-CLOSURE";
const CASE_DIRECTORY = path.join(DIRECTORY, "case-checkpoints");
const RAW_DIRECTORY = path.join(DIRECTORY, "closure-raw-provider-responses");
const STRUCTURED_DIRECTORY = path.join(DIRECTORY, "closure-structured-output-incidents");
const FREEZE_PATH = path.join(DIRECTORY, "legacy-qualification-freeze-candidate.json");
const H29_RESULT_PATH = path.join(DIRECTORY, "h29-result.json");
const ARBITRATIONS_PATH = path.resolve(ROOT, "semantic-validation/sem-001r5b/human-arbitrations-and-gold-changes.json");
const MODEL_ID = "gemini-3.5-flash-lite";
const PROVIDER = "GOOGLE_GEMINI";
const EXPECTED_CONFIGURATION_NAME = "SEM_LEGACY_R5N";
const EXPECTED_CONFIGURATION_DIGEST = "ke1-dddaa50feb99591b";
const GOVERNED_UNRESOLVED_CASE_IDS = new Set(["SEM-H10", "SEM-H17", "SEM-H28", "SEM-H30"]);
const MAX_REQUEST_STARTS_PER_MINUTE = 5;
const MAX_ATTEMPTS_PER_OPERATION = 5;
const TRANSIENT_WAIT_MS = 60_000;
const TIMEOUT_MS = 90_000;
const PREPARE = process.argv.includes("--prepare");
const RUN = process.argv.includes("--run") || process.argv.includes("--resume");
if (PREPARE === RUN) throw new Error("SEM001R5N_EXACTLY_ONE_PHASE_REQUIRED");

const readJson = <T>(target: string): T => JSON.parse(readFileSync(target, "utf8")) as T;
const exists = (target: string) => { try { readFileSync(target); return true; } catch { return false; } };
const writeJsonAt = (target: string, value: unknown) => {
  mkdirSync(path.dirname(target), { recursive: true });
  const temporary = `${target}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  renameSync(temporary, target);
};
const writeJson = (name: string, value: unknown) => writeJsonAt(path.join(DIRECTORY, name), value);
const source = (relativePath: string) => readFileSync(path.resolve(ROOT, relativePath), "utf8");
const safeMessage = (caught: unknown) => caught instanceof Error ? caught.message : "UNKNOWN_FAILURE";
const relativeArtifact = (target: string) => path.relative(ROOT, target);

const freeze = readJson<any>(FREEZE_PATH);
const h29Result = readJson<any>(H29_RESULT_PATH);
const humanArbitrations = readJson<any>(ARBITRATIONS_PATH);
const currentDigests = () => ({
  developmentCorpus: logicalDigest(DEVELOPMENT_CASES.map((item) => ({ caseId: item.caseId, split: item.split, turns: item.turns }))),
  developmentGold: logicalDigest(DEVELOPMENT_CASES.map((item) => ({ caseId: item.caseId, gold: item.gold }))),
  holdoutCorpus: logicalDigest(HOLDOUT_CASES.map((item) => ({ caseId: item.caseId, split: item.split, turns: item.turns }))),
  holdoutGold: logicalDigest(HOLDOUT_CASES.map((item) => ({ caseId: item.caseId, gold: item.gold }))),
  reconstructionPrompt: logicalDigest(SCIENTIFIC_SEMANTIC_RECONSTRUCTION_PROMPT),
  criticPrompt: logicalDigest(SCIENTIFIC_SEMANTIC_CRITIC_PROMPT),
  auditPrompt: logicalDigest(SCIENTIFIC_SEMANTIC_ATOMIC_COMPOSITION_AUDIT_PROMPT),
  baseProviderSchema: logicalDigest({ reconstruction: SEMANTIC_RECONSTRUCTION_JSON_SCHEMA, critic: SEMANTIC_CRITIC_JSON_SCHEMA }),
  providerContract: logicalDigest(source("src/features/scientific-semantic-reconstruction/provider.ts")),
  auditProviderSchema: logicalDigest(SEMANTIC_ATOMIC_COMPOSITION_AUDIT_JSON_SCHEMA),
  canonicalModel: logicalDigest({
    semanticModelVersion: SCIENTIFIC_SEMANTIC_MODEL_VERSION,
    schemaVersion: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
    types: source("src/features/scientific-semantic-reconstruction/types.ts"),
    schema: source("src/features/scientific-semantic-reconstruction/schema.ts"),
  }),
  acceptanceGuards: logicalDigest(source("src/features/scientific-semantic-reconstruction/atomic-composition.ts")),
  canonicalizer: logicalDigest(source("src/features/scientific-semantic-reconstruction/canonical.ts")),
  coverageAndIntegrity: logicalDigest(source("src/features/scientific-semantic-reconstruction/coverage.ts")),
  relationOwnership: logicalDigest(source("src/features/scientific-semantic-reconstruction/relation-ownership.ts")),
  evaluator: logicalDigest(source("src/features/scientific-semantic-reconstruction/competence.ts")),
  routing: logicalDigest({
    canonical: source("src/features/scientific-semantic-reconstruction/canonical.ts"),
    atomicComposition: source("src/features/scientific-semantic-reconstruction/atomic-composition.ts"),
  }),
});

const versions = {
  reconstructionPrompt: SEMANTIC_RECONSTRUCTION_PROMPT_VERSION,
  criticPrompt: SEMANTIC_CRITIC_PROMPT_VERSION,
  semanticSchema: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
  canonicalModel: SCIENTIFIC_SEMANTIC_MODEL_VERSION,
};
const policy = {
  concurrency: 1,
  maxRequestStartsPerRollingMinute: MAX_REQUEST_STARTS_PER_MINUTE,
  rollingWindowMs: 60_000,
  maximumAttemptsPerLlmOperation: MAX_ATTEMPTS_PER_OPERATION,
  transientWaitMs: TRANSIENT_WAIT_MS,
  retryAfterHasPriority: true,
  structuredCorrection: "FROZEN_PROVIDER_CONTRACT_ONLY",
  systemicCircuitBreaker: "3 independent exhausted operations with comparable provider failure",
};
const digests = currentDigests();
const semanticConfigurationDigest = logicalDigest({ model: MODEL_ID, versions: {
  reconstruction: SEMANTIC_RECONSTRUCTION_PROMPT_VERSION,
  critic: SEMANTIC_CRITIC_PROMPT_VERSION,
  schema: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
  model: SCIENTIFIC_SEMANTIC_MODEL_VERSION,
}, digests });
const thresholdsDigest = logicalDigest(freeze.configurationMaterial.thresholds);
const expectedDigests = freeze.configurationMaterial?.digests ?? {};
const checks = [
  { contract: "Configuration name", expected: EXPECTED_CONFIGURATION_NAME, observed: freeze.configurationName, pass: freeze.configurationName === EXPECTED_CONFIGURATION_NAME },
  { contract: "Configuration digest", expected: EXPECTED_CONFIGURATION_DIGEST, observed: freeze.configurationDigest, pass: freeze.configurationDigest === EXPECTED_CONFIGURATION_DIGEST && logicalDigest(freeze.configurationMaterial) === EXPECTED_CONFIGURATION_DIGEST },
  { contract: "Freeze candidate", expected: "PROPOSED_NOT_ACTIVATED", observed: freeze.status, pass: freeze.status === "PROPOSED_NOT_ACTIVATED" },
  { contract: "Provider", expected: PROVIDER, observed: freeze.configurationMaterial?.provider?.provider, pass: freeze.configurationMaterial?.provider?.provider === PROVIDER },
  { contract: "Model ID", expected: MODEL_ID, observed: freeze.configurationMaterial?.provider?.model, pass: freeze.configurationMaterial?.provider?.model === MODEL_ID },
  { contract: "Versions", expected: freeze.configurationMaterial?.versions, observed: versions, pass: logicalDigest(freeze.configurationMaterial?.versions) === logicalDigest(versions) },
  { contract: "H29 decision", expected: "H29_PASS", observed: h29Result.decision, pass: h29Result.decision === "H29_PASS" },
  { contract: "H29 configuration", expected: EXPECTED_CONFIGURATION_DIGEST, observed: h29Result.configurationDigest, pass: h29Result.configurationDigest === EXPECTED_CONFIGURATION_DIGEST },
  { contract: "H29 blockers", expected: [], observed: h29Result.metric?.absoluteBlockers, pass: Array.isArray(h29Result.metric?.absoluteBlockers) && h29Result.metric.absoluteBlockers.length === 0 },
  { contract: "Human arbitration set", expected: "ke1-900fba5c2229f7f8", observed: humanArbitrations.decisionsDigest, pass: humanArbitrations.decisionsDigest === "ke1-900fba5c2229f7f8" },
  { contract: "Thresholds", expected: thresholdsDigest, observed: logicalDigest(freeze.configurationMaterial.thresholds), pass: Boolean(freeze.configurationMaterial.thresholds) },
  { contract: "Holdout identities", expected: 30, observed: HOLDOUT_CASES.length, pass: HOLDOUT_CASES.length === 30 && new Set(HOLDOUT_CASES.map((item) => item.caseId)).size === 30 },
  ...Object.entries(digests).map(([key, observed]) => ({ contract: key, expected: expectedDigests[key] ?? null, observed, pass: expectedDigests[key] === observed })),
];
const configurationDecision = checks.every((item) => item.pass) ? "R5N_CLOSURE_CONFIGURATION_VERIFIED" : "R5N_CLOSURE_BLOCKED_BY_CONFIGURATION_DRIFT";
const configurationVerification = {
  campaign: CAMPAIGN,
  verifiedAt: new Date().toISOString(),
  decision: configurationDecision,
  sourceFreeze: relativeArtifact(FREEZE_PATH),
  sourceFreezeDigest: logicalDigest(freeze),
  sourceH29Result: relativeArtifact(H29_RESULT_PATH),
  sourceH29ResultDigest: logicalDigest(h29Result),
  sourceHumanArbitrations: relativeArtifact(ARBITRATIONS_PATH),
  sourceHumanArbitrationsDigest: logicalDigest(humanArbitrations),
  provider: PROVIDER,
  model: MODEL_ID,
  configurationDigest: EXPECTED_CONFIGURATION_DIGEST,
  semanticConfigurationDigest,
  currentDigests: digests,
  thresholdsDigest,
  checks,
  goldAccessBoundary: "DIGESTS_VERIFIED_BEFORE_PROVIDER; GOLD CONTENT USED ONLY BY POST_CANONICAL_EVALUATOR",
};
writeJson("configuration-verification-closure.json", configurationVerification);

if (configurationDecision !== "R5N_CLOSURE_CONFIGURATION_VERIFIED") {
  writeJson("qualification-summary.json", {
    campaign: CAMPAIGN,
    decision: "SCIENTIFIC_SEMANTIC_RECONSTRUCTION_NOT_READY",
    holdout: "0/30 COMPLETE",
    officialMetrics: "NOT_CALCULATED",
    failedChecks: checks.filter((item) => !item.pass),
    providerCalls: 0,
  });
  console.log(JSON.stringify({ decision: "SCIENTIFIC_SEMANTIC_RECONSTRUCTION_NOT_READY", reason: "CONFIGURATION_DRIFT", failedChecks: checks.filter((item) => !item.pass) }, null, 2));
  process.exit(4);
}

const configurationDigest = EXPECTED_CONFIGURATION_DIGEST;
const activatedAt = new Date().toISOString();
const activationPath = path.join(DIRECTORY, "qualification-freeze-activation.json");
if (!exists(activationPath)) writeJsonAt(activationPath, {
  campaign: CAMPAIGN,
  activatedAt,
  decision: "R5N_QUALIFYING_FREEZE_ACTIVATED_FOR_FULL_HOLDOUT",
  configurationName: EXPECTED_CONFIGURATION_NAME,
  configurationDigest,
  sourceFreeze: relativeArtifact(FREEZE_PATH),
  sourceFreezeDigest: logicalDigest(freeze),
  sourceH29Result: relativeArtifact(H29_RESULT_PATH),
  sourceH29ResultDigest: logicalDigest(h29Result),
  h29Decision: h29Result.decision,
  provider: PROVIDER,
  model: MODEL_ID,
  digests,
  thresholds: freeze.configurationMaterial.thresholds,
  humanArbitrations: {
    source: relativeArtifact(ARBITRATIONS_PATH),
    digest: logicalDigest(humanArbitrations),
    decisionsDigest: humanArbitrations.decisionsDigest,
    unresolvedLegacyMappings: freeze.unresolvedLegacyMappings,
  },
  qualificationScope: "SEM_LEGACY_COMPETENCE",
  pd003V2Compliance: "NOT_CLAIMED",
  noMixedConfigurationEvidence: true,
});
const manifestPath = path.join(DIRECTORY, "closure-campaign-manifest.json");
let manifest: any;
if (exists(manifestPath)) {
  manifest = readJson<any>(manifestPath);
  if (manifest.configurationDigest !== configurationDigest) throw new Error("SEM001R5N_CLOSURE_MANIFEST_CONFIGURATION_DRIFT");
} else {
  const startedAt = new Date().toISOString();
  manifest = {
    campaignId: `sem-001r5n-closure-${startedAt.replace(/[:.]/g, "-")}-${configurationDigest}`,
    campaign: CAMPAIGN,
    status: "ACTIVE_FULL_HOLDOUT",
    startTimestamp: startedAt,
    sourceActivation: relativeArtifact(activationPath),
    sourceActivationDigest: logicalDigest(readJson<any>(activationPath)),
    sourceFreeze: relativeArtifact(FREEZE_PATH),
    sourceFreezeDigest: logicalDigest(freeze),
    sourceH29Result: relativeArtifact(H29_RESULT_PATH),
    sourceH29ResultDigest: logicalDigest(h29Result),
    digests,
    configurationDigest,
    semanticConfigurationDigest,
    holdout: {
      count: 30,
      caseIds: HOLDOUT_CASES.map((item) => item.caseId),
      corpusDigest: digests.holdoutCorpus,
      goldFrameDigest: digests.holdoutGold,
    },
    provider: PROVIDER,
    model: MODEL_ID,
    temperature: null,
    versions,
    prompts: {
      reconstruction: { version: SEMANTIC_RECONSTRUCTION_PROMPT_VERSION, digest: digests.reconstructionPrompt },
      critic: { version: SEMANTIC_CRITIC_PROMPT_VERSION, digest: digests.criticPrompt },
      audit: { version: "SEM-001-ATOMIC-COMPOSITION-AUDIT-1.0", digest: digests.auditPrompt },
    },
    schemas: {
      providerBase: digests.baseProviderSchema,
      providerAudit: digests.auditProviderSchema,
      internalAndCanonicalModel: digests.canonicalModel,
    },
    implementation: {
      canonicalModelVersion: SCIENTIFIC_SEMANTIC_MODEL_VERSION,
      acceptanceGuardsAndAtomicCompilerDigest: digests.acceptanceGuards,
      coverageAndIntegrityDigest: digests.coverageAndIntegrity,
      relationOwnershipDigest: digests.relationOwnership,
      providerContractDigest: digests.providerContract,
      canonicalizerDigest: digests.canonicalizer,
      evaluatorDigest: digests.evaluator,
      routingDigest: digests.routing,
    },
    thresholds: freeze.configurationMaterial.thresholds,
    rateLimiter: { concurrency: 1, maximumStarts: 5, rollingWindowMs: 60_000 },
    retryPolicy: policy,
    goldUse: "POST_CANONICAL_EVALUATION_ONLY",
    noDevelopmentOutputReuse: true,
    callLlmOnlyIfRequired: true,
    compatibleCheckpointReuse: ["SEM-H29"],
    governedNonExecutableCases: [...GOVERNED_UNRESOLVED_CASE_IDS],
    incompatibleHistoricalEvidenceExcluded: true,
    humanArbitrations: {
      source: relativeArtifact(ARBITRATIONS_PATH),
      digest: logicalDigest(humanArbitrations),
      decisionsDigest: humanArbitrations.decisionsDigest,
      unresolvedLegacyMappings: freeze.unresolvedLegacyMappings,
      ordinaryEngineFailureDisposition: "HUMAN_ARBITRATION_REQUIRED_IF_ACTIVE_CONTRADICTION_REAPPEARS",
    },
    pd003V2Compliance: "NOT_CLAIMED",
  };
  writeJsonAt(manifestPath, manifest);
  const h29Fixture = HOLDOUT_CASES.find((item) => item.caseId === "SEM-H29");
  if (!h29Fixture) throw new Error("SEM001R5N_H29_FIXTURE_MISSING");
  const seededH29 = {
    campaign: CAMPAIGN,
    campaignId: manifest.campaignId,
    caseId: "SEM-H29",
    split: "HOLDOUT",
    configurationDigest,
    semanticConfigurationDigest,
    goldFrameDigest: logicalDigest(h29Fixture.gold),
    originalRequest: h29Fixture.turns,
    goldUse: "POST_CANONICAL_EVALUATION_ONLY",
    finalStatus: "COMPLETE",
    startedAt: h29Result.startedAt,
    completedAt: h29Result.completedAt,
    turns: h29Result.turns,
    operationTraces: [],
    semanticModel: h29Result.semanticModel,
    semanticModelDigest: h29Result.semanticModelDigest,
    coverageReports: { explicit: h29Result.semanticModel?.explicitCoverageReport, relations: h29Result.semanticModel?.relationCoverageReport },
    evaluation: { evaluatorDigest: digests.evaluator, evaluatedAt: h29Result.completedAt, goldFrameDigest: logicalDigest(h29Fixture.gold), result: h29Result.metric },
    metric: h29Result.metric,
    reuse: { source: relativeArtifact(H29_RESULT_PATH), compatibleConfigurationDigest: configurationDigest, llmOperationsAvoided: h29Result.llmOperations, providerRequestStartsAvoided: h29Result.providerRequestStarts, deterministicReplays: 0 },
    error: null,
  };
  const governedUnresolved = HOLDOUT_CASES.filter((item) => GOVERNED_UNRESOLVED_CASE_IDS.has(item.caseId)).map((item) => ({
    campaign: CAMPAIGN,
    campaignId: manifest.campaignId,
    caseId: item.caseId,
    split: "HOLDOUT",
    configurationDigest,
    semanticConfigurationDigest,
    goldFrameDigest: logicalDigest(item.gold),
    originalRequest: item.turns,
    goldUse: "NOT_EVALUATED_GOVERNED_LEGACY_MAPPING_EXCLUSION",
    finalStatus: "UNRESOLVED_BY_LEGACY_MODEL",
    startedAt: null,
    completedAt: startedAt,
    turns: [],
    operationTraces: [],
    semanticModel: null,
    semanticModelDigest: null,
    coverageReports: null,
    evaluation: null,
    metric: null,
    governedDisposition: {
      authority: relativeArtifact(ARBITRATIONS_PATH),
      decisionsDigest: humanArbitrations.decisionsDigest,
      classification: "UNRESOLVED_BY_LEGACY_MODEL",
      engineFailure: false,
      qualificationDenominator: "EXCLUDED_BEFORE_EXECUTION",
      pd003V2Compliance: "NOT_CLAIMED",
    },
    error: null,
  }));
  writeJsonAt(path.join(CASE_DIRECTORY, "SEM-H29.json"), seededH29);
  governedUnresolved.forEach((item) => writeJsonAt(path.join(CASE_DIRECTORY, `${item.caseId}.json`), item));
  writeJson("holdout-results.json", [seededH29, ...governedUnresolved]);
  writeJson("semantic-metrics.json", { campaignId: manifest.campaignId, status: "NOT_CALCULATED", reason: "REQUIRES_26_OF_26_ASSESSABLE_COMPLETE", evaluatedComplete: 1, evaluatedRequired: 26, governedUnresolved: 4, terminal: 5, total: 30 });
  writeJson("failure-ledger.json", { campaign: CAMPAIGN, campaignId: manifest.campaignId, failures: [] });
  writeJson("repair-ledger.json", { campaign: CAMPAIGN, campaignId: manifest.campaignId, repairs: [], policy: "REPAIR_ONLY_GENERIC_NON_NORMATIVE_DEFECTS_IN_SUCCESSOR_CONFIGURATION" });
  writeJson("llm-call-accounting.json", { campaign: CAMPAIGN, campaignId: manifest.campaignId, provider: PROVIDER, model: MODEL_ID, llmCallsPerformed: 0, retries: 0, llmCallsAvoidedByResume: h29Result.providerRequestStarts, compatibleProviderOperationsReused: h29Result.llmOperations, completedCasesReusedOnResume: 1, deterministicReplays: 0, noSecretsStored: true });
}

if (PREPARE) {
  console.log(JSON.stringify({ decision: "R5N_QUALIFYING_FREEZE_ACTIVATED_READY_FOR_FULL_HOLDOUT", campaignId: manifest.campaignId, configurationDigest, holdout: "5/30 TERMINAL", evaluated: "1/26 COMPLETE", governedUnresolved: [...GOVERNED_UNRESOLVED_CASE_IDS], compatibleCheckpoint: "SEM-H29", resumeAt: "SEM-H01", providerCalls: 0, callsAvoided: h29Result.providerRequestStarts }, null, 2));
  process.exit(0);
}

const assertFrozenConfiguration = () => {
  const now = currentDigests();
  const changed = Object.keys(digests).filter((key) => (now as any)[key] !== (digests as any)[key]);
  if (changed.length || logicalDigest(freeze.configurationMaterial.thresholds) !== thresholdsDigest || logicalDigest(freeze.configurationMaterial) !== configurationDigest || freeze.configurationMaterial?.provider?.model !== MODEL_ID) {
    throw new Error(`SEM001R5N_CLOSURE_CONFIGURATION_MUTATED_AFTER_MANIFEST:${changed.join(",") || "THRESHOLD_OR_MODEL"}`);
  }
};
assertFrozenConfiguration();

const environment = loadEnv("development", ROOT, "");
const apiKey = environment.GEMINI_API_KEY?.trim();
if (!apiKey) {
  writeJson("qualification-summary.json", { campaign: CAMPAIGN, campaignId: manifest.campaignId, decision: "R5F_BLOCKED_BY_PROVIDER", holdout: "5/30 TERMINAL", officialMetrics: "NOT_CALCULATED", reason: "GEMINI_API_KEY_MISSING", providerCalls: 0 });
  console.log(JSON.stringify({ decision: "R5F_BLOCKED_BY_PROVIDER", reason: "GEMINI_API_KEY_MISSING", holdout: "5/30 TERMINAL" }, null, 2));
  process.exit(3);
}

const diagnosticsPath = path.join(DIRECTORY, "provider-diagnostics.json");
const providerDiagnostics: any = exists(diagnosticsPath) ? readJson<any>(diagnosticsPath) : {
  campaign: CAMPAIGN,
  campaignId: manifest.campaignId,
  provider: PROVIDER,
  model: MODEL_ID,
  noSecretsStored: true,
  policy,
  runs: [],
  attempts: [],
  structuredOutputIncidents: [],
};
const resultsPath = path.join(DIRECTORY, "holdout-results.json");
let results: any[] = exists(resultsPath) ? readJson<any[]>(resultsPath) : [];
const completedBeforeRun = results.filter((item) => item.finalStatus === "COMPLETE" && item.configurationDigest === configurationDigest);
const retainedStarts = providerDiagnostics.attempts.filter((item: any) => item.startedAt).map((item: any) => item.startedAt);
const limiter = new RollingWindowRequestLimiter({
  maxRequests: MAX_REQUEST_STARTS_PER_MINUTE,
  windowMs: 60_000,
  safetyMarginMs: 500,
  initialStarts: retainedStarts,
  initialTotalStarts: providerDiagnostics.attempts.length,
});
const runId = `sem-001r5n-closure-${new Date().toISOString().replace(/[:.]/g, "-")}`;
providerDiagnostics.runs.push({ runId, startedAt: new Date().toISOString(), completedCaseIdsAtResume: completedBeforeRun.map((item) => item.caseId) });
const checkpointDiagnostics = () => writeJsonAt(diagnosticsPath, providerDiagnostics);
checkpointDiagnostics();

type OperationContext = {
  caseId: string;
  stage: "RECONSTRUCTION" | "CRITIC" | "ATOMIC_COMPOSITION_AUDIT";
  turn: number;
  cycle: number | null;
  operationAttempt: number;
  requestStarts: number;
  recordIndexes: number[];
};
let activeOperation: OperationContext | null = null;
let rawSequence = providerDiagnostics.attempts.length;

class OperationStartBudgetError extends Error {
  constructor() { super("SEM001R4_OPERATION_REQUEST_START_BUDGET_EXHAUSTED"); }
}

const beforeAttempt = async () => {
  if (!activeOperation) throw new Error("SEM001R4_PROVIDER_START_OUTSIDE_OPERATION");
  if (activeOperation.requestStarts >= MAX_ATTEMPTS_PER_OPERATION) throw new OperationStartBudgetError();
  await limiter.acquire();
  activeOperation.requestStarts += 1;
  rawSequence += 1;
  const index = providerDiagnostics.attempts.length;
  activeOperation.recordIndexes.push(index);
  providerDiagnostics.attempts.push({
    runId,
    caseId: activeOperation.caseId,
    stage: activeOperation.stage,
    turn: activeOperation.turn,
    cycle: activeOperation.cycle,
    operationAttempt: activeOperation.operationAttempt,
    attempt: activeOperation.requestStarts,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    providerStatus: null,
    httpStatus: null,
    providerErrorCode: null,
    category: null,
    waitDuration: 0,
    finalDisposition: "IN_FLIGHT",
    rawArtifact: null,
  });
  checkpointDiagnostics();
};

const instrumentedFetch: typeof fetch = async (input, init) => {
  const response = await fetch(input, init);
  if (activeOperation) {
    const recordIndex = activeOperation.recordIndexes.at(-1);
    if (recordIndex !== undefined) {
      const rawTarget = path.join(RAW_DIRECTORY, `${String(rawSequence).padStart(4, "0")}-${activeOperation.caseId}-${activeOperation.stage.toLowerCase()}-t${activeOperation.turn}-c${activeOperation.cycle ?? 0}.json`);
      const rawBody = await response.clone().text();
      writeJsonAt(rawTarget, {
        security: "LOCAL_MODE_0600_NO_REQUEST_HEADERS_NO_SECRET",
        campaignId: manifest.campaignId,
        caseId: activeOperation.caseId,
        stage: activeOperation.stage,
        turn: activeOperation.turn,
        cycle: activeOperation.cycle,
        provider: PROVIDER,
        model: MODEL_ID,
        httpStatus: response.status,
        capturedAt: new Date().toISOString(),
        rawStructuredResponse: rawBody,
      });
      providerDiagnostics.attempts[recordIndex].rawArtifact = relativeArtifact(rawTarget);
      checkpointDiagnostics();
    }
  }
  return response;
};

const baseProvider = new GeminiScientificSemanticProvider({
  apiKey,
  model: MODEL_ID,
  timeoutMs: TIMEOUT_MS,
  maxAttempts: 1,
  beforeAttempt,
  fetchImpl: instrumentedFetch,
});

const transient = (category: SemanticProviderFailureCategory) => ["RATE_LIMIT", "TIMEOUT", "NETWORK", "SERVER_ERROR"].includes(category);
const waitFor = (caught: SemanticProviderError) => caught.category === "RATE_LIMIT" && caught.details?.retryAfterMs !== null && caught.details?.retryAfterMs !== undefined
  ? Math.max(TRANSIENT_WAIT_MS, caught.details.retryAfterMs)
  : TRANSIENT_WAIT_MS;
const comparableFailure = (caught: SemanticProviderError) => caught.category === "RATE_LIMIT"
  ? `RATE_LIMIT:${caught.details?.providerCode ?? "NONE"}`
  : ["SERVER_ERROR", "TIMEOUT", "NETWORK"].includes(caught.category)
    ? `TRANSIENT_UNAVAILABLE:${caught.details?.httpStatus ?? "NONE"}`
    : caught.category;

const finalizeRecords = (
  context: OperationContext,
  attempts: SemanticProviderAttempt[],
  terminal: "SUCCESS" | "RETRY_SCHEDULED" | "PROVIDER_CAPACITY_FAILURE" | "NON_RETRYABLE_FAILURE",
  waitDuration = 0,
) => {
  const unresolved = context.recordIndexes.filter((index) => providerDiagnostics.attempts[index]?.finalDisposition === "IN_FLIGHT");
  attempts.forEach((attempt, offset) => {
    const index = unresolved[offset];
    if (index === undefined) return;
    const isLast = offset === attempts.length - 1;
    providerDiagnostics.attempts[index] = {
      ...providerDiagnostics.attempts[index],
      startedAt: attempt.requestStarted,
      finishedAt: attempt.requestFinished,
      providerStatus: attempt.providerStatus,
      httpStatus: attempt.httpStatus,
      providerErrorCode: attempt.providerCode,
      category: attempt.category,
      waitDuration: isLast ? waitDuration : 0,
      finalDisposition: isLast ? terminal : "STRUCTURED_REGENERATION",
    };
  });
  checkpointDiagnostics();
};

const persistStructuredIncident = (context: OperationContext, disposition: string, diagnostic: any) => {
  const records = context.recordIndexes.map((index) => providerDiagnostics.attempts[index]);
  const target = path.join(STRUCTURED_DIRECTORY, `${context.caseId}-${context.stage.toLowerCase()}-t${context.turn}-c${context.cycle ?? 0}-${String(providerDiagnostics.structuredOutputIncidents.length + 1).padStart(2, "0")}.json`);
  const incident = {
    campaignId: manifest.campaignId,
    caseId: context.caseId,
    stage: context.stage,
    turn: context.turn,
    cycle: context.cycle,
    provider: PROVIDER,
    model: MODEL_ID,
    promptVersion: context.stage === "RECONSTRUCTION" ? SEMANTIC_RECONSTRUCTION_PROMPT_VERSION : context.stage === "CRITIC" ? SEMANTIC_CRITIC_PROMPT_VERSION : "SEM-001-ATOMIC-COMPOSITION-AUDIT-1.0",
    schemaDigest: context.stage === "ATOMIC_COMPOSITION_AUDIT" ? digests.auditProviderSchema : digests.baseProviderSchema,
    classification: diagnostic?.structuredOutputClassification ?? "MODEL_STRUCTURE_NON_COMPLIANCE",
    validationPaths: diagnostic?.validationIssues ?? [],
    disposition,
    rawStructuredResponseArtifacts: records.map((item: any) => item.rawArtifact).filter(Boolean),
    noParserFabrication: true,
    recordedAt: new Date().toISOString(),
  };
  writeJsonAt(target, incident);
  providerDiagnostics.structuredOutputIncidents.push({ ...incident, artifact: relativeArtifact(target) });
  checkpointDiagnostics();
};

const executeProviderOperation = async <T extends { attempts?: SemanticProviderAttempt[] }>(
  operation: Omit<OperationContext, "operationAttempt" | "requestStarts" | "recordIndexes">,
  invoke: () => Promise<T>,
): Promise<T> => {
  const context: OperationContext = { ...operation, operationAttempt: 0, requestStarts: 0, recordIndexes: [] };
  const accumulated: SemanticProviderAttempt[] = [];
  while (context.requestStarts < MAX_ATTEMPTS_PER_OPERATION) {
    context.operationAttempt += 1;
    activeOperation = context;
    try {
      const result = await invoke();
      const attempts = result.attempts ?? [];
      finalizeRecords(context, attempts, "SUCCESS");
      accumulated.push(...attempts);
      if (attempts.length > 1) persistStructuredIncident(context, "RECOVERED_BY_FROZEN_STRUCTURED_CORRECTION", null);
      activeOperation = null;
      return { ...result, attempts: accumulated };
    } catch (caught) {
      if (caught instanceof OperationStartBudgetError) {
        const unresolved = context.recordIndexes.filter((index) => providerDiagnostics.attempts[index]?.finalDisposition === "IN_FLIGHT");
        unresolved.forEach((index) => { providerDiagnostics.attempts[index].finishedAt = new Date().toISOString(); providerDiagnostics.attempts[index].category = "INVALID_STRUCTURED_OUTPUT"; providerDiagnostics.attempts[index].finalDisposition = "NON_RETRYABLE_FAILURE"; });
        persistStructuredIncident(context, "FAILED_OPERATION_START_BUDGET_EXHAUSTED", null);
        activeOperation = null;
        throw new SemanticProviderError("INVALID_STRUCTURED_OUTPUT", accumulated, null, { rawProviderOutput: null, validationIssues: [{ path: "root", code: "operation_attempt_budget", message: "Frozen operation request-start budget exhausted before structured correction." }] });
      }
      if (!(caught instanceof SemanticProviderError)) { activeOperation = null; throw caught; }
      const attempts = caught.attempts ?? [];
      accumulated.push(...attempts);
      if (caught.category === "INVALID_STRUCTURED_OUTPUT") {
        finalizeRecords(context, attempts, "NON_RETRYABLE_FAILURE");
        persistStructuredIncident(context, "FAILED_AFTER_FROZEN_STRUCTURED_CORRECTION", caught.diagnostic);
        activeOperation = null;
        throw new SemanticProviderError(caught.category, accumulated, caught.details, caught.diagnostic);
      }
      const retryable = transient(caught.category);
      const canRetry = retryable && context.requestStarts < MAX_ATTEMPTS_PER_OPERATION;
      const waitDuration = canRetry ? waitFor(caught) : 0;
      finalizeRecords(context, attempts, canRetry ? "RETRY_SCHEDULED" : retryable ? "PROVIDER_CAPACITY_FAILURE" : "NON_RETRYABLE_FAILURE", waitDuration);
      if (!canRetry) {
        activeOperation = null;
        throw new SemanticProviderError(caught.category, accumulated, caught.details, caught.diagnostic);
      }
      activeOperation = null;
      await new Promise<void>((resolve) => setTimeout(resolve, waitDuration));
    }
  }
  activeOperation = null;
  throw new SemanticProviderError("SERVER_ERROR", accumulated, { httpStatus: 503, providerStatus: "OPERATION_ATTEMPTS_EXHAUSTED", providerCode: null, providerError: "Maximum attempts exhausted.", retryable: true, retryAfterMs: null });
};

const resilientProvider: ScientificSemanticProvider = {
  metadata: baseProvider.metadata,
  reconstruct: (request) => executeProviderOperation({ caseId: request.sessionId.split(":").at(-1) ?? "UNKNOWN", stage: "RECONSTRUCTION", turn: request.messages.filter((item) => item.role === "USER").length, cycle: null }, () => baseProvider.reconstruct(request)),
  critique: (request, candidate, coverage) => executeProviderOperation({ caseId: request.sessionId.split(":").at(-1) ?? "UNKNOWN", stage: "CRITIC", turn: request.messages.filter((item) => item.role === "USER").length, cycle: coverage.cycle }, () => baseProvider.critique(request, candidate, coverage)),
};
const resilientAuditProvider: SemanticAtomicCompositionProvider = {
  metadata: baseProvider.metadata,
  auditAtomicComposition: (request, candidate, cycle) => executeProviderOperation({ caseId: request.sessionId.split(":").at(-1) ?? "UNKNOWN", stage: "ATOMIC_COMPOSITION_AUDIT", turn: request.messages.filter((item) => item.role === "USER").length, cycle }, () => baseProvider.auditAtomicComposition(request, candidate, cycle)),
};

const genericAuditActivation = (candidate: any) => {
  const inventoryById = new Map<string, any>(candidate.semanticInventory.explicitFragments.map((item: any) => [item.inventoryItemId, item]));
  const aggregateAtomic = candidate.elements.find((element: any) => element.epistemicStatus === "EXPLICIT_USER_STATED" && element.inventoryItemIds.length === 1
    && /\b(?:et|ou|vs|versus)\b/i.test(element.sourceText ?? "")
    && ((element.sourceText ?? "").match(/\d+(?:[,.]\d+)?\s*[A-Za-z]+/g)?.length ?? 0) >= 2);
  const elements = candidate.elements.filter((item: any) => item.epistemicStatus === "EXPLICIT_USER_STATED");
  let compositePair: { left: any; right: any } | null = null;
  for (const left of elements.filter((item: any) => ["MODALITY", "METHOD"].includes(item.type))) {
    for (const right of elements.filter((item: any) => ["TIMING", "CONSTRAINT"].includes(item.type))) {
      const leftInventory = left.inventoryItemIds.flatMap((id: string) => [inventoryById.get(id)]).filter(Boolean);
      const rightIds = new Set(right.inventoryItemIds);
      const linked = leftInventory.some((item: any) => item.linkedInventoryItemIds.some((id: string) => rightIds.has(id)));
      const alreadyComposite = elements.some((item: any) => item.type === "METHOD" && left.inventoryItemIds.every((id: string) => item.inventoryItemIds.includes(id)) && right.inventoryItemIds.every((id: string) => item.inventoryItemIds.includes(id)));
      if (linked && !alreadyComposite) compositePair = { left, right };
    }
  }
  if (aggregateAtomic) return { activated: true, class: "ATOMIC_AGGREGATE", evidence: { elementClientId: aggregateAtomic.clientElementId, sourceText: aggregateAtomic.sourceText } };
  if (compositePair) return { activated: true, class: "LINKED_METHOD_ACQUISITION_COMPOSITE", evidence: { left: compositePair.left.clientElementId, right: compositePair.right.clientElementId } };
  return { activated: false, class: "NONE", evidence: null };
};

const operationTracesFrom = (operation: string, turn: number, cycles: any, callIds: string[], cycleAttempts: SemanticProviderAttempt[][], values: any[]) => values.map((value, index) => ({
  operation,
  turn,
  cycle: index + 1,
  callId: callIds[index],
  structuredDigest: logicalDigest(value),
  attempts: cycleAttempts[index] ?? [],
  terminalReason: cycles.terminalReason,
}));
const writeCase = (result: any) => writeJsonAt(path.join(CASE_DIRECTORY, `${result.caseId}.json`), result);
const checkpointResults = () => {
  results.sort((left, right) => left.caseId.localeCompare(right.caseId));
  writeJsonAt(resultsPath, results);
};
const failures: any[] = exists(path.join(DIRECTORY, "failure-ledger.json")) ? readJson<any>(path.join(DIRECTORY, "failure-ledger.json")).failures ?? [] : [];
const exhaustedComparableFailures = new Map<string, Set<string>>();
let stopDecision: string | null = null;
let stopReason: string | null = null;

for (const fixture of HOLDOUT_CASES) {
  assertFrozenConfiguration();
  if (results.some((item) => item.caseId === fixture.caseId && ["COMPLETE", "UNRESOLVED_BY_LEGACY_MODEL"].includes(item.finalStatus) && item.configurationDigest === configurationDigest)) {
    console.log(`SEM-R5N-CLOSURE ${fixture.caseId} RESUMED_TERMINAL`);
    continue;
  }
  const startedAt = new Date().toISOString();
  const result: any = {
    campaign: CAMPAIGN,
    campaignId: manifest.campaignId,
    caseId: fixture.caseId,
    split: fixture.split,
    configurationDigest,
    semanticConfigurationDigest,
    goldFrameDigest: logicalDigest(fixture.gold),
    originalRequest: fixture.turns,
    goldUse: "POST_CANONICAL_EVALUATION_ONLY",
    finalStatus: "RUNNING",
    startedAt,
    completedAt: null,
    turns: [],
    operationTraces: [],
    semanticModel: null,
    semanticModelDigest: null,
    coverageReports: null,
    evaluation: null,
    metric: null,
    error: null,
  };
  const messages: SemanticConversationMessage[] = [];
  let semanticModel: ScientificSemanticModel | null = null;
  try {
    for (let turnIndex = 0; turnIndex < fixture.turns.length; turnIndex += 1) {
      messages.push({
        messageId: `${fixture.caseId}:user:${turnIndex + 1}`,
        role: "USER",
        content: fixture.turns[turnIndex],
        createdAt: `2026-08-12T21:${String(HOLDOUT_CASES.indexOf(fixture) + 1).padStart(2, "0")}:${String(turnIndex).padStart(2, "0")}.000Z`,
      });
      const request: SemanticReconstructionRequest = {
        schemaVersion: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
        sessionId: `${manifest.campaignId}:${fixture.caseId}`,
        language: "fr",
        messages: [...messages],
        previousModel: semanticModel,
      };
      const reconstruction = await resilientProvider.reconstruct(request);
      result.operationTraces.push({ operation: "RECONSTRUCTION", turn: turnIndex + 1, cycle: null, callId: reconstruction.callId, structuredDigest: logicalDigest(reconstruction.candidate), attempts: reconstruction.attempts ?? [], deterministicSchemaValidation: "PASS" });
      const critique = await runSemanticCriticCycles(resilientProvider, request, reconstruction.candidate);
      result.operationTraces.push(...operationTracesFrom("CRITIC", turnIndex + 1, critique, critique.callIds, critique.cycleAttempts, critique.critics));
      if (!critique.accepted) throw new Error(`SEM001R4_CRITIC_NOT_ACCEPTED:${critique.terminalReason}`);
      let finalCandidate = critique.candidate;
      const auditActivation = genericAuditActivation(finalCandidate);
      let audited: any = null;
      if (auditActivation.activated) {
        audited = await runSemanticAtomicCompositionCycles(resilientAuditProvider, request, finalCandidate);
        result.operationTraces.push(...operationTracesFrom("ATOMIC_COMPOSITION_AUDIT", turnIndex + 1, audited, audited.callIds, audited.cycleAttempts, audited.audits));
        if (!audited.accepted) throw new Error(`SEM001R4_AUDIT_NOT_ACCEPTED:${audited.terminalReason}`);
        finalCandidate = audited.candidate;
      }
      const finalCritic = critique.critics.at(-1);
      const finalCriticCallId = critique.callIds.at(-1);
      if (!finalCritic || !finalCriticCallId) throw new Error("SEM001R4_CRITIC_RESULT_MISSING");
      semanticModel = verifySemanticModelWithKnowledge(canonicalizeSemanticReconstruction({
        request,
        candidate: finalCandidate,
        critic: finalCritic,
        metadata: baseProvider.metadata,
        reconstructionCallId: reconstruction.callId,
        criticCallId: finalCriticCallId,
        criticCallIds: critique.callIds,
        critics: critique.critics,
        reconstructionAttempts: reconstruction.attempts ?? [],
        criticAttempts: critique.attempts,
      }));
      result.turns.push({
        turn: turnIndex + 1,
        requestMessageIds: request.messages.map((item) => item.messageId),
        reconstruction: reconstruction.candidate,
        reconstructionDigest: logicalDigest(reconstruction.candidate),
        critics: critique.critics,
        criticTerminalReason: critique.terminalReason,
        criticRepairs: critique.repairDiagnostics,
        conditionalAuditActivation: auditActivation,
        conditionalAudits: audited?.audits ?? [],
        auditTerminalReason: audited?.terminalReason ?? "NOT_APPLICABLE",
        auditAcceptanceDiagnostics: audited?.acceptanceDiagnostics ?? [],
        auditCompilationDiagnostics: audited?.compilationDiagnostics ?? [],
        auditRepairDiagnostics: audited?.repairDiagnostics ?? [],
        canonicalModel: semanticModel,
        canonicalModelDigest: semanticModel.digest,
        knowledgeVerification: semanticModel.knowledgeSnapshot ?? "NOT_APPLICABLE",
      });
      messages.push({ messageId: `${fixture.caseId}:noxia:${turnIndex + 1}`, role: "NOXIA", content: semanticModel.summaryForUser, createdAt: semanticModel.updatedAt });
    }
    if (!semanticModel) throw new Error("SEM001R4_CANONICAL_MODEL_MISSING");
    result.semanticModel = semanticModel;
    result.semanticModelDigest = semanticModel.digest;
    result.coverageReports = { explicit: semanticModel.explicitCoverageReport, relations: semanticModel.relationCoverageReport };
    result.finalStatus = "CANONICAL_COMPLETE_EVALUATION_PENDING";
    writeCase(result);
    const metric = evaluateSemanticCase(fixture, semanticModel);
    result.metric = metric;
    result.evaluation = { evaluatorDigest: digests.evaluator, evaluatedAt: new Date().toISOString(), goldFrameDigest: logicalDigest(fixture.gold), result: metric };
    result.finalStatus = "COMPLETE";
    result.completedAt = new Date().toISOString();
    if (metric.absoluteBlockers.length) {
      const first = metric.absoluteBlockers[0];
      const failureClass = first.startsWith("RELATION_LOST") ? "RELATION_COVERAGE_FAILURE"
        : first.startsWith("FORBIDDEN_INFERENCE") ? "MODEL_REASONING_FAILURE"
          : first === "CORRECTION_NOT_PROPAGATED" || first === "MULTI_TURN_CONTEXT_LOST" || first === "GENERIC_DOMAIN_COLLAPSE" ? "MODEL_REASONING_FAILURE"
            : first.startsWith("EXPLICIT_") ? "OBJECT_COVERAGE_FAILURE" : "UNKNOWN";
      failures.push({
        caseId: fixture.caseId,
        originalRequest: fixture.turns,
        metricFailures: metric,
        absoluteBlockers: metric.absoluteBlockers,
        firstDivergentStage: "POST_CANONICAL_HOLDOUT_EVALUATION",
        failureClass,
        genericOrIsolated: "ISOLATED_UNTIL_SEPARATE_REPAIR_CAMPAIGN",
        recommendedOwner: failureClass === "RELATION_COVERAGE_FAILURE" ? "SEM_RELATION_COVERAGE_OWNER" : failureClass === "OBJECT_COVERAGE_FAILURE" ? "SEM_OBJECT_COVERAGE_OWNER" : "SEM_PROMPT_OR_MODEL_REASONING_OWNER",
      });
    }
  } catch (caught) {
    result.completedAt = new Date().toISOString();
    if (caught instanceof SemanticProviderError) {
      const providerCapacity = transient(caught.category) || caught.category === "QUOTA";
      result.finalStatus = providerCapacity ? "PROVIDER_CAPACITY_FAILURE" : "FAILED";
      result.error = {
        category: caught.category,
        failureClass: providerCapacity ? "PROVIDER_FAILURE" : caught.category === "INVALID_STRUCTURED_OUTPUT" ? "STRUCTURED_OUTPUT_FAILURE" : "PROVIDER_FAILURE",
        httpStatus: caught.details?.httpStatus ?? null,
        providerStatus: caught.details?.providerStatus ?? null,
        providerErrorCode: caught.details?.providerCode ?? null,
        message: caught.details?.providerError ?? caught.message,
        diagnostic: caught.diagnostic,
      };
      failures.push({
        caseId: fixture.caseId,
        originalRequest: fixture.turns,
        metricFailures: null,
        absoluteBlockers: [],
        firstDivergentStage: activeOperation?.stage ?? "LLM_PROVIDER_OPERATION",
        failureClass: result.error.failureClass,
        genericOrIsolated: "ISOLATED_UNTIL_CROSS_OPERATION_PROVIDER_REVIEW",
        recommendedOwner: result.error.failureClass === "STRUCTURED_OUTPUT_FAILURE" ? "SEM_STRUCTURED_OUTPUT_CONTRACT" : "SEM_PROVIDER",
        error: result.error,
      });
      if (providerCapacity) {
        const signature = comparableFailure(caught);
        const cases = exhaustedComparableFailures.get(signature) ?? new Set<string>();
        cases.add(fixture.caseId);
        exhaustedComparableFailures.set(signature, cases);
        if (caught.category === "QUOTA" || cases.size >= 3) {
          stopDecision = "R5F_BLOCKED_BY_PROVIDER";
          stopReason = caught.category === "QUOTA" ? "DAILY_PROVIDER_CAPACITY_EXHAUSTED" : `STOP_PROVIDER_CAPACITY:${signature}:3_INDEPENDENT_EXHAUSTED_OPERATIONS`;
        }
      }
    } else {
      result.finalStatus = "FAILED";
      result.error = { category: "SEMANTIC_PIPELINE_FAILURE", failureClass: safeMessage(caught).includes("CRITIC") ? "CRITIC_FAILURE" : safeMessage(caught).includes("AUDIT") ? "COMPOSITION_FAILURE" : safeMessage(caught).includes("CANONICAL") ? "CANONICALIZATION_FAILURE" : "UNKNOWN", message: safeMessage(caught) };
      failures.push({
        caseId: fixture.caseId,
        originalRequest: fixture.turns,
        metricFailures: null,
        absoluteBlockers: [],
        firstDivergentStage: result.error.failureClass === "CRITIC_FAILURE" ? "BASE_CRITIC_OR_ACCEPTANCE_GUARD" : result.error.failureClass === "COMPOSITION_FAILURE" ? "CONDITIONAL_ATOMIC_COMPOSITION_AUDIT" : "SEMANTIC_PIPELINE",
        failureClass: result.error.failureClass,
        genericOrIsolated: "ISOLATED_UNTIL_SEPARATE_REPAIR_CAMPAIGN",
        recommendedOwner: result.error.failureClass === "CRITIC_FAILURE" ? "SEM_CRITIC_OWNER" : result.error.failureClass === "COMPOSITION_FAILURE" ? "SEM_ATOMIC_COMPOSITION_OWNER" : "SEM_PIPELINE_OWNER",
        error: result.error,
      });
    }
  }
  writeCase(result);
  results = [...results.filter((item) => item.caseId !== fixture.caseId), result];
  checkpointResults();
  writeJson("failure-ledger.json", { campaign: CAMPAIGN, campaignId: manifest.campaignId, failures });
  console.log(`SEM-R5N-CLOSURE ${fixture.caseId} ${result.finalStatus} evaluated=${results.filter((item) => item.finalStatus === "COMPLETE").length}/26 terminal=${results.filter((item) => ["COMPLETE", "UNRESOLVED_BY_LEGACY_MODEL", "FAILED", "PROVIDER_CAPACITY_FAILURE"].includes(item.finalStatus)).length}/30 starts=${providerDiagnostics.attempts.length}`);
  if (stopDecision) break;
}

const completed = results.filter((item) => item.finalStatus === "COMPLETE" && item.configurationDigest === configurationDigest && item.semanticModel);
const assessableFixtures = HOLDOUT_CASES.filter((item) => !GOVERNED_UNRESOLVED_CASE_IDS.has(item.caseId));
let aggregate: any = null;
let detailedMetrics: any = null;
if (completed.length === assessableFixtures.length) {
  const models = new Map<string, ScientificSemanticModel>(completed.map((item) => [item.caseId, item.semanticModel]));
  const perCase = assessableFixtures.map((fixture) => evaluateSemanticCase(fixture, models.get(fixture.caseId)!));
  aggregate = evaluateSemanticCampaign(assessableFixtures, models);
  const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 1;
  const selectedMetrics = (selected: SemanticCompetenceCase[]) => {
    const ids = new Set(selected.map((item) => item.caseId));
    return perCase.filter((item) => ids.has(item.caseId));
  };
  const positive = (name: keyof SemanticCaseMetrics, selected = assessableFixtures) => {
    const values = selectedMetrics(selected);
    const numerator = values.reduce((sum, item) => sum + Number(item[name]), 0);
    return { numerator, denominator: values.length, score: average(values.map((item) => Number(item[name]))), caseIdsInError: values.filter((item) => Number(item[name]) !== 1).map((item) => item.caseId) };
  };
  const negative = (name: keyof SemanticCaseMetrics) => {
    const numerator = perCase.reduce((sum, item) => sum + Number(item[name]), 0);
    return { numerator, denominator: perCase.length, score: numerator / perCase.length, caseIdsInError: perCase.filter((item) => Number(item[name]) !== 0).map((item) => item.caseId) };
  };
  const byType = (type: string) => assessableFixtures.filter((item) => item.gold.requiredExplicitObjects.some((object) => object.type === type));
  const correctionCases = assessableFixtures.filter((item) => item.gold.correction);
  const multiTurnCases = assessableFixtures.filter((item) => item.turns.length > 1);
  detailedMetrics = {
    criticalSemanticRecall: positive("criticalSemanticRecall"),
    explicitObjectRecall: positive("explicitObjectRecall"),
    explicitRelationRecall: positive("explicitRelationRecall"),
    comparatorPreservation: positive("comparatorPreserved", byType("COMPARATOR")),
    interventionPreservation: positive("interventionPreserved", byType("INTERVENTION")),
    modalityPreservation: positive("modalityPreserved", byType("MODALITY")),
    semanticDriftRate: negative("semanticDriftRate"),
    unsupportedInferenceRate: negative("unsupportedInferenceRate"),
    criticalUnsupportedInferenceRate: negative("criticalUnsupportedInferenceCount"),
    ellipsisDetectionRate: positive("ellipsisDetectionRate"),
    ambiguityPreservationRate: positive("ambiguityPreservationRate"),
    unnecessaryClarificationRate: negative("unnecessaryClarificationRate"),
    routeCorrectness: positive("routeCorrect"),
    correctionPropagationRate: positive("correctionPropagation", correctionCases),
    multiTurnContextPreservation: positive("multiTurnContextPreserved", multiTurnCases),
    genericDomainCollapseRate: negative("genericDomainCollapse"),
  };
  writeJson("semantic-metrics.json", { campaign: CAMPAIGN, campaignId: manifest.campaignId, status: "CALCULATED_26_OF_26_ASSESSABLE", evaluatedCases: assessableFixtures.map((item) => item.caseId), governedUnresolvedCases: [...GOVERNED_UNRESOLVED_CASE_IDS], aggregate, detailedMetrics, perCase, thresholds: freeze.configurationMaterial.thresholds });
  if (!aggregate.passesSem001Thresholds || aggregate.absoluteBlockers.length) {
    stopReason = "HOLDOUT_THRESHOLDS_OR_ABSOLUTE_BLOCKERS_FAILED";
  }
} else {
  writeJson("semantic-metrics.json", { campaign: CAMPAIGN, campaignId: manifest.campaignId, status: "NOT_CALCULATED", reason: "REQUIRES_26_OF_26_ASSESSABLE_COMPLETE", evaluatedComplete: completed.length, evaluatedRequired: assessableFixtures.length, governedUnresolved: GOVERNED_UNRESOLVED_CASE_IDS.size, total: 30 });
}

const attempts = providerDiagnostics.attempts;
const priorClosureAccounting = exists(path.join(DIRECTORY, "llm-call-accounting.json"))
  ? readJson<any>(path.join(DIRECTORY, "llm-call-accounting.json"))
  : null;
const compatibleAvoidedCalls = h29Result.providerRequestStarts + completedBeforeRun.filter((item) => item.caseId !== "SEM-H29").reduce((sum, item) => sum + (item.operationTraces ?? []).reduce((traceSum: number, trace: any) => traceSum + Math.max(1, trace.attempts?.length ?? 0), 0), 0);
const accounting = {
  campaign: CAMPAIGN,
  campaignId: manifest.campaignId,
  provider: PROVIDER,
  model: MODEL_ID,
  actualRequestStarts: attempts.length,
  llmCallsPerformed: attempts.length,
  retries: attempts.filter((item: any) => item.finalDisposition === "RETRY_SCHEDULED").length,
  structuredRegenerations: attempts.filter((item: any) => item.finalDisposition === "STRUCTURED_REGENERATION").length,
  providerCapacityFailures: attempts.filter((item: any) => item.finalDisposition === "PROVIDER_CAPACITY_FAILURE").length,
  completedCasesReusedOnResume: completedBeforeRun.length,
  llmCallsAvoidedByResume: Math.max(priorClosureAccounting?.llmCallsAvoidedByResume ?? 0, compatibleAvoidedCalls),
  compatibleProviderOperationsReused: Math.max(priorClosureAccounting?.compatibleProviderOperationsReused ?? 0, h29Result.llmOperations),
  deterministicReplays: priorClosureAccounting?.deterministicReplays ?? 0,
  governedUnresolvedCasesNotCalled: [...GOVERNED_UNRESOLVED_CASE_IDS],
  historicalNonR5lCallsExcludedFromClosure: true,
  developmentOutputsReusedAsHoldoutResults: 0,
  conditionalAuditCases: results.filter((item) => item.turns?.some((turn: any) => turn.conditionalAuditActivation?.activated)).map((item) => item.caseId),
  noSecretsStored: true,
};
writeJson("llm-call-accounting.json", accounting);
const providerBlocked = failures.some((item) => item.failureClass === "PROVIDER_FAILURE");
const terminalCaseCount = new Set(results.filter((item) => item.configurationDigest === configurationDigest && ["COMPLETE", "UNRESOLVED_BY_LEGACY_MODEL", "FAILED", "PROVIDER_CAPACITY_FAILURE"].includes(item.finalStatus)).map((item) => item.caseId)).size;
const finalDecision = stopDecision
  ?? (completed.length === assessableFixtures.length && terminalCaseCount === 30 && aggregate?.passesSem001Thresholds && !aggregate.absoluteBlockers.length
    ? "HOLDOUT_GATE_PASSED_READY_FOR_FINAL_VALIDATIONS"
    : providerBlocked
      ? "R5F_BLOCKED_BY_PROVIDER"
      : "RELATION_OWNERSHIP_STABILIZED_SEM_CLOSURE_CONTINUING");
if (finalDecision === "HOLDOUT_GATE_PASSED_READY_FOR_FINAL_VALIDATIONS") {
  writeJson("holdout-qualification-freeze.json", {
    campaign: CAMPAIGN,
    campaignId: manifest.campaignId,
    frozenAt: new Date().toISOString(),
    decision: finalDecision,
    configurationDigest,
    semanticConfigurationDigest,
    sourceFreezeDigest: logicalDigest(freeze),
    digests,
    versions,
    provider: PROVIDER,
    model: MODEL_ID,
    thresholds: freeze.configurationMaterial.thresholds,
    holdout: { terminal: 30, total: 30, evaluatedComplete: 26, evaluatedRequired: 26, governedUnresolved: [...GOVERNED_UNRESOLVED_CASE_IDS], resultDigest: logicalDigest(completed.map((item) => ({ caseId: item.caseId, semanticModelDigest: item.semanticModelDigest, metric: item.metric }))) },
    aggregate,
    detailedMetrics,
    accounting,
    absoluteBlockers: [],
    downstreamLiveValidation: "NOT_STARTED_BY_MANDATE",
  });
}
const summary = {
  campaign: CAMPAIGN,
  campaignId: manifest.campaignId,
  decision: finalDecision,
  decisionReason: stopReason,
  holdout: `${terminalCaseCount}/30 TERMINAL; ${completed.length}/26 ASSESSABLE COMPLETE; ${GOVERNED_UNRESOLVED_CASE_IDS.size} UNRESOLVED_BY_LEGACY_MODEL`,
  officialMetrics: completed.length === assessableFixtures.length ? "CALCULATED_26_OF_26_ASSESSABLE" : "NOT_CALCULATED",
  aggregate,
  absoluteBlockers: completed.length === assessableFixtures.length ? aggregate?.absoluteBlockers ?? [] : failures.flatMap((item) => item.absoluteBlockers ?? []),
  llm: accounting,
  providerIncidents: attempts.filter((item: any) => !["SUCCESS", "IN_FLIGHT"].includes(item.finalDisposition)),
  technicalValidations: "PENDING_POST_CAMPAIGN",
  finalLiveValidation: "NOT_STARTED_BY_MANDATE",
  completedAt: new Date().toISOString(),
};
writeJson("qualification-summary.json", summary);
const currentRun = providerDiagnostics.runs.find((item: any) => item.runId === runId);
if (currentRun) { currentRun.completedAt = new Date().toISOString(); currentRun.decision = finalDecision; currentRun.complete = completed.length; }
checkpointDiagnostics();
console.log(JSON.stringify(summary, null, 2));
process.exit(finalDecision === "HOLDOUT_GATE_PASSED_READY_FOR_FINAL_VALIDATIONS" ? 0 : finalDecision === "R5F_BLOCKED_BY_PROVIDER" ? 3 : 2);
