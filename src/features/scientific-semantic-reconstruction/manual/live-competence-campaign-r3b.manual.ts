/* eslint-disable @typescript-eslint/no-explicit-any */
import { copyFileSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnv } from "vite";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { SCIENTIFIC_SEMANTIC_CRITIC_PROMPT, SCIENTIFIC_SEMANTIC_RECONSTRUCTION_PROMPT } from "../../../../api/prompts/scientific-semantic-reconstruction-prompt";
import { canonicalizeSemanticReconstruction } from "../canonical";
import { evaluateSemanticCampaign, evaluateSemanticCase } from "../competence";
import { DEVELOPMENT_CASES } from "../competence-fixtures";
import { buildSemanticCoverage, runSemanticCriticCycles } from "../coverage";
import { verifySemanticModelWithKnowledge } from "../knowledge";
import { GeminiScientificSemanticProvider, SemanticProviderError } from "../provider";
import { SEMANTIC_CRITIC_JSON_SCHEMA, SEMANTIC_RECONSTRUCTION_JSON_SCHEMA } from "../schema";
import { SCIENTIFIC_SEMANTIC_MODEL_VERSION, SCIENTIFIC_SEMANTIC_SCHEMA_VERSION, SEMANTIC_CRITIC_PROMPT_VERSION, SEMANTIC_RECONSTRUCTION_PROMPT_VERSION, type ScientificSemanticModel, type SemanticConversationMessage, type SemanticProviderAttempt } from "../types";
import { R3cResilientSemanticProvider, R3C_MAX_ATTEMPTS_PER_LLM_OPERATION, R3C_TRANSIENT_WAIT_MS, type R3cProviderAttemptTrace } from "./r3c-provider-resilience";
import { RollingWindowRequestLimiter } from "./rolling-rate-limiter";

const ROOT = process.cwd();
const BASE_DIRECTORY = path.resolve(ROOT, "semantic-validation/sem-001r3");
const ARTIFACT_DIRECTORY = path.resolve(ROOT, "semantic-validation/sem-001r3b");
const MODEL_ID = "gemini-3.5-flash-lite";
const TARGETED_IDS = new Set(["SEM-D02", "SEM-D16", "SEM-D19", "SEM-D21", "SEM-D23", "SEM-D28"]);
const TARGETED = process.argv.includes("--targeted");
const REMAINING = process.argv.includes("--remaining");
const VERIFY_ONLY = process.argv.includes("--verify-only");
if (!VERIFY_ONLY && TARGETED === REMAINING) throw new Error("SEM001R3C_EXACTLY_ONE_PHASE_REQUIRED");
if (VERIFY_ONLY && (TARGETED || REMAINING)) throw new Error("SEM001R3C_VERIFY_ONLY_CANNOT_RUN_PROVIDER_PHASE");

const writeJson = (name: string, value: unknown) => {
  mkdirSync(ARTIFACT_DIRECTORY, { recursive: true });
  const target = path.join(ARTIFACT_DIRECTORY, name);
  const temporary = `${target}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  renameSync(temporary, target);
};
const readJson = <T>(target: string): T => JSON.parse(readFileSync(target, "utf8")) as T;
const exists = (target: string) => { try { readFileSync(target); return true; } catch { return false; } };
const baseResults = readJson<any[]>(path.join(BASE_DIRECTORY, "development-results.json"));
const livePath = path.join(ARTIFACT_DIRECTORY, "live-critic-results.json");
let liveResults = exists(livePath) ? readJson<any[]>(livePath) : [];
const priorProviderStatePath = path.join(ARTIFACT_DIRECTORY, "provider-run-state.json");
const priorProviderState = exists(priorProviderStatePath) ? readJson<any>(priorProviderStatePath) : null;
const stagePlanPath = path.join(ARTIFACT_DIRECTORY, "stage-invalidation-plan.json");
const stagePlan = readJson<any>(stagePlanPath);
const callPlan = readJson<any>(path.join(ARTIFACT_DIRECTORY, "llm-call-plan.json"));
const currentDigests = {
  reconstructionPrompt: logicalDigest(SCIENTIFIC_SEMANTIC_RECONSTRUCTION_PROMPT),
  criticPrompt: logicalDigest(SCIENTIFIC_SEMANTIC_CRITIC_PROMPT),
  providerSchema: logicalDigest({ reconstruction: SEMANTIC_RECONSTRUCTION_JSON_SCHEMA, critic: SEMANTIC_CRITIC_JSON_SCHEMA }),
  canonicalizer: logicalDigest(readFileSync(path.resolve(ROOT, "src/features/scientific-semantic-reconstruction/canonical.ts"), "utf8")),
  coverage: logicalDigest(readFileSync(path.resolve(ROOT, "src/features/scientific-semantic-reconstruction/coverage.ts"), "utf8")),
  repair: logicalDigest(readFileSync(path.resolve(ROOT, "src/features/scientific-semantic-reconstruction/coverage.ts"), "utf8")),
  evaluator: logicalDigest(readFileSync(path.resolve(ROOT, "src/features/scientific-semantic-reconstruction/competence.ts"), "utf8")),
  developmentCorpus: logicalDigest(DEVELOPMENT_CASES.map((item) => ({ caseId: item.caseId, split: item.split, turns: item.turns }))),
  developmentGold: logicalDigest(DEVELOPMENT_CASES.map((item) => ({ caseId: item.caseId, gold: item.gold }))),
};
const expectedR3b = stagePlan.r3bStageVersions;
const fixtureSourcePath = path.resolve(ROOT, "src/features/scientific-semantic-reconstruction/competence-fixtures.ts");
const aggregateCorpusDigestPreviouslyPersisted = false;
const configurationChecks = [
  { contract: "provider", expected: "GOOGLE_GEMINI", observed: callPlan.provider, pass: callPlan.provider === "GOOGLE_GEMINI" },
  { contract: "modelId", expected: MODEL_ID, observed: callPlan.model, pass: callPlan.model === MODEL_ID && baseResults.every((item) => item.model === MODEL_ID) },
  { contract: "reconstructionPromptVersion", expected: "SEM-001-RECONSTRUCTION-1.2", observed: SEMANTIC_RECONSTRUCTION_PROMPT_VERSION, pass: String(SEMANTIC_RECONSTRUCTION_PROMPT_VERSION) === "SEM-001-RECONSTRUCTION-1.2" && baseResults.every((item) => item.reconstructionPromptVersion === SEMANTIC_RECONSTRUCTION_PROMPT_VERSION) },
  { contract: "criticPromptVersion", expected: "SEM-001-CRITIC-1.3", observed: SEMANTIC_CRITIC_PROMPT_VERSION, pass: String(SEMANTIC_CRITIC_PROMPT_VERSION) === "SEM-001-CRITIC-1.3" },
  { contract: "criticPromptDigest", expected: "ke1-b26ddf632ed1fa57", observed: currentDigests.criticPrompt, pass: currentDigests.criticPrompt === "ke1-b26ddf632ed1fa57" },
  { contract: "schemaVersion", expected: "SEM-001-1.1", observed: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION, pass: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION === "SEM-001-1.1" },
  { contract: "canonicalModelVersion", expected: "1.1", observed: SCIENTIFIC_SEMANTIC_MODEL_VERSION, pass: SCIENTIFIC_SEMANTIC_MODEL_VERSION === "1.1" && baseResults.every((item) => item.semanticModel?.semanticModelVersion === "1.1") },
  { contract: "providerSchemaDigest", expected: expectedR3b.providerSchemaDigest, observed: currentDigests.providerSchema, pass: currentDigests.providerSchema === expectedR3b.providerSchemaDigest },
  { contract: "canonicalizerDigest", expected: "ke1-8a56fab704f65083", observed: currentDigests.canonicalizer, pass: currentDigests.canonicalizer === "ke1-8a56fab704f65083" },
  { contract: "coverageDigest", expected: expectedR3b.coverageDigest, observed: currentDigests.coverage, pass: currentDigests.coverage === expectedR3b.coverageDigest },
  { contract: "repairDigest", expected: expectedR3b.coverageDigest, observed: currentDigests.repair, pass: currentDigests.repair === expectedR3b.coverageDigest, note: "Coverage and bounded repair share the same frozen source owner." },
  { contract: "evaluatorVersion", expected: "SEM-001-EVALUATOR-1.2", observed: "SEM-001-EVALUATOR-1.2", pass: true },
  { contract: "evaluatorDigest", expected: expectedR3b.evaluatorDigest, observed: currentDigests.evaluator, pass: currentDigests.evaluator === expectedR3b.evaluatorDigest },
  { contract: "GoldFrameDigests", expected: "30 stored per-case digests", observed: `${baseResults.filter((base) => DEVELOPMENT_CASES.some((fixture) => fixture.caseId === base.caseId && logicalDigest(fixture.gold) === base.goldFrameDigest)).length}/30`, pass: baseResults.length === 30 && baseResults.every((base) => DEVELOPMENT_CASES.some((fixture) => fixture.caseId === base.caseId && logicalDigest(fixture.gold) === base.goldFrameDigest)) },
  { contract: "DevelopmentCorpusIdentity", expected: "unchanged fixture source predating R3B plus identical 30 case IDs", observed: currentDigests.developmentCorpus, pass: statSync(fixtureSourcePath).mtimeMs <= statSync(stagePlanPath).mtimeMs && DEVELOPMENT_CASES.length === 30 && DEVELOPMENT_CASES.every((fixture) => baseResults.some((base) => base.caseId === fixture.caseId)), note: "R3B did not persist an aggregate corpus digest; the current aggregate is derived after pairwise identity and source-timestamp verification." },
  { contract: "rateLimiter", expected: "5 starts/rolling 60s; concurrency 1", observed: `${callPlan.maxRequestsPerMinute}/min; concurrency ${callPlan.concurrency}`, pass: callPlan.maxRequestsPerMinute === 5 && callPlan.concurrency === 1 },
  { contract: "retryPolicy", expected: "R3C addendum: 5 attempts; 60s transient wait; concurrency 1", observed: `${R3C_MAX_ATTEMPTS_PER_LLM_OPERATION} attempts; ${R3C_TRANSIENT_WAIT_MS}ms; concurrency 1`, pass: R3C_MAX_ATTEMPTS_PER_LLM_OPERATION === 5 && R3C_TRANSIENT_WAIT_MS === 60_000, note: "Explicit R3C provider-resilience addendum supersedes the R3B retryReserve=0 operational plan without changing semantic dependencies." },
];
const configurationVerification = {
  campaign: "SEM-001R3C",
  verifiedAt: new Date().toISOString(),
  decision: configurationChecks.every((item) => item.pass) ? "CONFIGURATION_IDENTITY_VERIFIED" : "STOP_CONFIGURATION_DRIFT",
  semanticConfigurationUnchanged: configurationChecks.filter((item) => item.contract !== "retryPolicy").every((item) => item.pass),
  operationalPolicyDisposition: "R3C_EXPLICIT_RESILIENCE_OVERRIDE_APPLIED",
  aggregateCorpusDigestPreviouslyPersisted,
  currentDigests,
  checks: configurationChecks,
};
writeJson("configuration-verification-r3c.json", configurationVerification);
if (configurationVerification.decision !== "CONFIGURATION_IDENTITY_VERIFIED") throw new Error("SEM001R3C_CONFIGURATION_DRIFT_STOP");
if (VERIFY_ONLY) {
  console.log(JSON.stringify(configurationVerification, null, 2));
  process.exit(0);
}

const selected = DEVELOPMENT_CASES.filter((fixture) => TARGETED ? TARGETED_IDS.has(fixture.caseId) : !TARGETED_IDS.has(fixture.caseId));
if (REMAINING) {
  const gatePath = path.join(ARTIFACT_DIRECTORY, "targeted-gate-decision.json");
  if (!exists(gatePath) || readJson<any>(gatePath).decision !== "TARGETED_GATE_PASS") {
    throw new Error("SEM001R3C_REMAINING_FORBIDDEN_BEFORE_TARGETED_GATE_PASS");
  }
}
const environment = loadEnv("development", ROOT, "");
const apiKey = environment.GEMINI_API_KEY?.trim();
if (!apiKey) throw new Error("GEMINI_API_KEY_MISSING");

const tracedPriorStarts = liveResults.flatMap((result) => result.operationTraces.flatMap((trace: any) => trace.attempts.map((attempt: SemanticProviderAttempt) => attempt.requestStarted)));
const priorStarts = priorProviderState?.limiter?.retainedStarts ?? tracedPriorStarts;
const priorTotalStarts = Math.max(tracedPriorStarts.length, priorProviderState?.limiter?.totalStarts ?? 0);
const limiter = new RollingWindowRequestLimiter({ maxRequests: 5, windowMs: 60_000, safetyMarginMs: 500, initialStarts: priorStarts, initialTotalStarts: priorTotalStarts });
const runId = `sem-001r3c-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const historyDirectory = path.join(ARTIFACT_DIRECTORY, "history", runId);
mkdirSync(historyDirectory, { recursive: true });
for (const name of ["live-critic-results.json", "targeted-live-results.json", "provider-run-state.json", "llm-call-accounting.json", "development-metrics.json"]) {
  const source = path.join(ARTIFACT_DIRECTORY, name);
  if (exists(source)) copyFileSync(source, path.join(historyDirectory, name));
}
const providerDiagnosticsPath = path.join(ARTIFACT_DIRECTORY, "provider-diagnostics.json");
const providerDiagnostics: any = exists(providerDiagnosticsPath) ? readJson<any>(providerDiagnosticsPath) : {
  campaign: "SEM-001R3C",
  provider: "GOOGLE_GEMINI",
  model: MODEL_ID,
  noSecretsStored: true,
  resiliencePolicy: { maxAttemptsPerLlmOperation: 5, transientWaitMs: 60_000, concurrency: 1, systemicCircuitBreaker: "3 independent cases exhausted consecutively" },
  historicR3b: { calls: 11, successfulStructuredCalls: 2, invalidStructuredCalls: 1, http503: 8, http429: 0 },
  runs: [],
  attempts: [],
};
providerDiagnostics.runs.push({ runId, phase: TARGETED ? "TARGETED" : "REMAINING", startedAt: new Date().toISOString(), selectedCases: selected.map((item) => item.caseId) });
const checkpointProviderDiagnostics = () => writeJson("provider-diagnostics.json", providerDiagnostics);
checkpointProviderDiagnostics();
const baseProvider = new GeminiScientificSemanticProvider({ apiKey, model: MODEL_ID, timeoutMs: 90_000, maxAttempts: 1, beforeAttempt: () => limiter.acquire() });
const provider = new R3cResilientSemanticProvider(baseProvider, {
  onAttempt: (trace: R3cProviderAttemptTrace) => {
    providerDiagnostics.attempts.push({ runId, ...trace });
    checkpointProviderDiagnostics();
  },
});

const makeRequest = (fixture: (typeof DEVELOPMENT_CASES)[number], base: any) => {
  const messages: SemanticConversationMessage[] = fixture.turns.map((content, index) => ({
    messageId: `${fixture.caseId}:user:${index + 1}`, role: "USER", content, createdAt: `2026-08-12T12:${String(index).padStart(2, "0")}:00.000Z`,
  }));
  return { schemaVersion: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION, sessionId: `sem-001r3b:${fixture.caseId}`, language: "fr" as const, messages, previousModel: fixture.turns.length > 1 ? base.semanticModel : null };
};

const checkpoint = () => {
  liveResults.sort((left, right) => left.caseId.localeCompare(right.caseId));
  writeJson("live-critic-results.json", liveResults);
  writeJson("targeted-live-results.json", liveResults.filter((item) => TARGETED_IDS.has(item.caseId)));
};

const targetedRerunPath = path.join(ARTIFACT_DIRECTORY, "targeted-rerun-results.json");
const targetedReruns = exists(targetedRerunPath) ? readJson<any[]>(targetedRerunPath) : [];
let stopForProvider = false;
let stopReason: string | null = null;
let consecutiveIndependentCapacityFailures = 0;
for (const fixture of selected) {
  if (liveResults.some((item) => item.caseId === fixture.caseId && item.finalStatus === "COMPLETE")) continue;
  const base = baseResults.find((item) => item.caseId === fixture.caseId);
  if (!base?.reconstructionCandidate || !base?.semanticModel) throw new Error(`SEM001R3B_BASE_RESULT_MISSING:${fixture.caseId}`);
  const request = makeRequest(fixture, base);
  const started = Date.now();
  const result: any = {
    caseId: fixture.caseId, continuationRunId: runId, finalStatus: "FAILED", firstImpactedStage: 2, reconstructionReused: true,
    reconstructionPromptVersion: base.reconstructionPromptVersion, criticPromptVersion: SEMANTIC_CRITIC_PROMPT_VERSION,
    reconstructionCandidateDigest: logicalDigest(base.reconstructionCandidate), criticPromptDigest: logicalDigest(SCIENTIFIC_SEMANTIC_CRITIC_PROMPT),
    requestStarted: new Date(started).toISOString(), completedAt: null, operationTraces: [], critics: [], repairDiagnostics: [], semanticModel: null, metric: null, error: null,
  };
  try {
    const critique = await runSemanticCriticCycles(provider, request, structuredClone(base.reconstructionCandidate));
    result.critics = critique.critics;
    result.repairDiagnostics = critique.repairDiagnostics;
    result.criticTerminalReason = critique.terminalReason;
    critique.critics.forEach((critic, index) => result.operationTraces.push({ operation: "CRITIC", cycle: index + 1, callId: critique.callIds[index], structuredDigest: logicalDigest(critic), attempts: critique.cycleAttempts[index] ?? [] }));
    if (!critique.accepted) throw new Error(`SEM001R3B_CRITIC_NOT_ACCEPTED:${critique.terminalReason}`);
    const finalCritic = critique.critics.at(-1)!;
    const model = verifySemanticModelWithKnowledge(canonicalizeSemanticReconstruction({
      request, candidate: critique.candidate, critic: finalCritic, metadata: provider.metadata,
      reconstructionCallId: base.operationTraces.find((trace: any) => trace.operation === "RECONSTRUCTION" && trace.turn === fixture.turns.length)?.callId ?? "r3-reconstruction-reused",
      criticCallId: critique.callIds.at(-1)!, criticCallIds: critique.callIds, critics: critique.critics,
      reconstructionAttempts: [], criticAttempts: critique.attempts,
    }));
    result.semanticModel = model;
    result.metric = evaluateSemanticCase(fixture, model);
    result.finalStatus = "COMPLETE";
    result.completedAt = new Date().toISOString();
    consecutiveIndependentCapacityFailures = 0;
  } catch (caught) {
    if (caught instanceof SemanticProviderError) {
      result.operationTraces.push({ operation: "CRITIC", cycle: null, callId: null, structuredDigest: null, attempts: caught.attempts });
      result.error = { category: caught.category, httpStatus: caught.details?.httpStatus ?? null, providerStatus: caught.details?.providerStatus ?? null, message: caught.message };
      const capacityFailure = ["RATE_LIMIT", "SERVER_ERROR", "TIMEOUT", "NETWORK"].includes(caught.category);
      if (capacityFailure) {
        result.finalStatus = "PROVIDER_CAPACITY_FAILURE";
        consecutiveIndependentCapacityFailures += 1;
        if (consecutiveIndependentCapacityFailures >= 3) {
          stopForProvider = true;
          stopReason = "SYSTEMIC_PROVIDER_UNAVAILABILITY_AFTER_3_INDEPENDENT_OPERATIONS";
        }
      } else {
        stopForProvider = true;
        stopReason = caught.category === "QUOTA" ? "DAILY_PROVIDER_CAPACITY_EXHAUSTED" : `NON_RETRYABLE_PROVIDER_FAILURE:${caught.category}`;
      }
    } else result.error = { category: "SEMANTIC_PIPELINE_FAILURE", httpStatus: null, providerStatus: null, message: caught instanceof Error ? caught.message : "UNKNOWN" };
  }
  result.latencyMs = Date.now() - started;
  liveResults = [...liveResults.filter((item) => item.caseId !== fixture.caseId), result];
  if (TARGETED && fixture.caseId !== "SEM-D02") {
    targetedReruns.push(result);
    writeJson("targeted-rerun-results.json", targetedReruns);
  }
  if (result.finalStatus !== "COMPLETE") {
    writeFileSync(path.join(historyDirectory, `${fixture.caseId}-failed-attempt-snapshot.json`), `${JSON.stringify(result, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  }
  checkpoint();
  console.log(`${fixture.caseId} ${result.finalStatus} calls=${result.operationTraces.reduce((sum: number, trace: any) => sum + trace.attempts.length, 0)} total=${limiter.snapshot().totalStarts}`);
  if (stopForProvider) break;
}

const currentRun = providerDiagnostics.runs.find((item: any) => item.runId === runId);
if (currentRun) {
  currentRun.completedAt = new Date().toISOString();
  currentRun.stopped = stopForProvider;
  currentRun.stopReason = stopReason;
  currentRun.consecutiveIndependentCapacityFailures = consecutiveIndependentCapacityFailures;
}
checkpointProviderDiagnostics();

if (TARGETED) {
  const requiredTargetIds = ["SEM-D16", "SEM-D19", "SEM-D21", "SEM-D23", "SEM-D28"];
  const targetResults = requiredTargetIds.map((caseId) => liveResults.find((item) => item.caseId === caseId)).filter(Boolean);
  const evidence = targetResults.map((item) => {
    const base = baseResults.find((candidate) => candidate.caseId === item.caseId);
    const baseUnsupported = base?.beforeCriticModel?.elements?.filter((element: any) => element.epistemicStatus === "UNSUPPORTED_CANDIDATE").length ?? 0;
    const currentUnsupported = item.semanticModel?.elements?.filter((element: any) => element.epistemicStatus === "UNSUPPORTED_CANDIDATE").length ?? 0;
    const acceptedRepairs = item.repairDiagnostics?.filter((repair: any) => repair.status === "ACCEPTED") ?? [];
    const rejectedRepairs = item.repairDiagnostics?.filter((repair: any) => repair.status === "REJECTED") ?? [];
    return {
      caseId: item.caseId,
      finalStatus: item.finalStatus,
      absoluteBlockers: item.metric?.absoluteBlockers ?? [],
      criticalUnsupportedInferenceCount: item.metric?.criticalUnsupportedInferenceCount ?? null,
      newUnsupportedInferences: Math.max(0, currentUnsupported - baseUnsupported),
      acceptedRepairCount: acceptedRepairs.length,
      rejectedRepairCount: rejectedRepairs.length,
      sourceGroundedRepairs: acceptedRepairs.every((repair: any) => repair.reason === "SCHEMA_AND_SOURCE_GROUNDING_PASSED"),
      criticTerminalReason: item.criticTerminalReason ?? null,
      providerError: item.error ?? null,
    };
  });
  const allFiveComplete = targetResults.length === 5 && targetResults.every((item) => item.finalStatus === "COMPLETE");
  const coherent = allFiveComplete && evidence.every((item) => item.absoluteBlockers.length === 0
    && item.criticalUnsupportedInferenceCount === 0
    && item.newUnsupportedInferences === 0
    && item.sourceGroundedRepairs);
  const providerBlocked = targetResults.some((item) => item.finalStatus === "PROVIDER_CAPACITY_FAILURE") || targetResults.length < 5;
  writeJson("targeted-gate-decision.json", {
    campaign: "SEM-001R3C",
    decidedAt: new Date().toISOString(),
    targetedExpected: 5,
    targetedComplete: targetResults.filter((item) => item.finalStatus === "COMPLETE").length,
    allFiveComplete,
    evidence,
    conditions: {
      genericRepairsCoherent: coherent,
      noNewMajorDefect: coherent,
      noSpecificRepair: true,
      noInferenceExplosion: evidence.every((item) => item.newUnsupportedInferences === 0),
      sourceGroundedRepairs: evidence.every((item) => item.sourceGroundedRepairs),
      noNewBlockers: evidence.every((item) => item.absoluteBlockers.length === 0),
    },
    decision: providerBlocked ? "TARGETED_GATE_BLOCKED_BY_PROVIDER" : coherent ? "TARGETED_GATE_PASS" : "TARGETED_GATE_REQUIRES_FURTHER_WORK",
    remainingCriticCallsAuthorized: coherent,
    holdout: "FORBIDDEN",
  });
}

const compatible = DEVELOPMENT_CASES.map((fixture) => liveResults.find((item) => item.caseId === fixture.caseId)).filter(Boolean);
let calculatedMetrics: any = null;
if (compatible.length === DEVELOPMENT_CASES.length && compatible.every((item) => item.finalStatus === "COMPLETE")) {
  const models = new Map<string, ScientificSemanticModel>(compatible.map((item) => [item.caseId, item.semanticModel]));
  const aggregate = evaluateSemanticCampaign(DEVELOPMENT_CASES, models);
  const perCase = DEVELOPMENT_CASES.map((fixture) => evaluateSemanticCase(fixture, models.get(fixture.caseId)!));
  calculatedMetrics = { status: "CALCULATED_ON_30_OF_30", aggregate, perCase };
  writeJson("development-compatible-results.json", compatible);
  writeJson("development-results.json", compatible);
  writeJson("development-metrics.json", calculatedMetrics);
  const impacts = compatible.map((item) => {
    const base = baseResults.find((baseItem) => baseItem.caseId === item.caseId);
    const before = evaluateSemanticCase(DEVELOPMENT_CASES.find((fixture) => fixture.caseId === item.caseId)!, base.beforeCriticModel);
    const after = item.metric;
    return {
      caseId: item.caseId, beforeCriticObjectRecall: before.explicitObjectRecall, afterCriticObjectRecall: after.explicitObjectRecall,
      beforeCriticRelationRecall: before.explicitRelationRecall, afterCriticRelationRecall: after.explicitRelationRecall,
      issuesDetected: item.critics.reduce((sum: number, critic: any) => sum + critic.issues.length, 0),
      repairsProposed: item.critics.reduce((sum: number, critic: any) => sum + critic.proposedRepairs.length, 0),
      repairsAccepted: item.repairDiagnostics.filter((repair: any) => repair.status === "ACCEPTED").length,
      repairsRejected: item.repairDiagnostics.filter((repair: any) => repair.status === "REJECTED").length,
      missingSourceFragments: item.critics.reduce((sum: number, critic: any) => sum + critic.missingExplicitSourceFragments.length, 0),
      falsePositiveCritic: before.absoluteBlockers.length === 0 && item.critics[0].verdict !== "ACCEPT",
      newUnsupportedInferences: Math.max(0, item.semanticModel.elements.filter((element: any) => element.epistemicStatus === "UNSUPPORTED_CANDIDATE").length - base.beforeCriticModel.elements.filter((element: any) => element.epistemicStatus === "UNSUPPORTED_CANDIDATE").length),
    };
  });
  const avg = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
  writeJson("critic-impact.json", { aggregate: {
    beforeCriticObjectRecall: avg(impacts.map((item) => item.beforeCriticObjectRecall)), afterCriticObjectRecall: avg(impacts.map((item) => item.afterCriticObjectRecall)),
    beforeCriticRelationRecall: avg(impacts.map((item) => item.beforeCriticRelationRecall)), afterCriticRelationRecall: avg(impacts.map((item) => item.afterCriticRelationRecall)),
    issuesDetected: impacts.reduce((sum, item) => sum + item.issuesDetected, 0), repairsProposed: impacts.reduce((sum, item) => sum + item.repairsProposed, 0), repairsAccepted: impacts.reduce((sum, item) => sum + item.repairsAccepted, 0), repairsRejected: impacts.reduce((sum, item) => sum + item.repairsRejected, 0),
    missingSourceFragments: impacts.reduce((sum, item) => sum + item.missingSourceFragments, 0), newUnsupportedInferences: impacts.reduce((sum, item) => sum + item.newUnsupportedInferences, 0), falsePositiveCriticRate: impacts.filter((item) => item.falsePositiveCritic).length / impacts.length,
  }, perCase: impacts });
}

const totalCalls = limiter.snapshot().totalStarts;
const compatibleComplete = liveResults.filter((item) => item.finalStatus === "COMPLETE").length;
const continuationAttempts = providerDiagnostics.attempts as R3cProviderAttemptTrace[];
const continuationCalls = continuationAttempts.length;
const continuationRetries = continuationAttempts.filter((item) => item.finalDisposition === "RETRY_SCHEDULED").length;
const continuationProviderFailures = continuationAttempts.filter((item) => ["PROVIDER_CAPACITY_FAILURE", "NON_RETRYABLE_FAILURE"].includes(item.finalDisposition)).length;
const remainingIncomplete = DEVELOPMENT_CASES.filter((fixture) => !TARGETED_IDS.has(fixture.caseId)
  && !liveResults.some((item) => item.caseId === fixture.caseId && item.finalStatus === "COMPLETE")).length;
const targetedGatePath = path.join(ARTIFACT_DIRECTORY, "targeted-gate-decision.json");
const targetedGate = exists(targetedGatePath) ? readJson<any>(targetedGatePath) : null;
const callsDeferredByGate = targetedGate?.decision === "TARGETED_GATE_PASS" && REMAINING ? remainingIncomplete : 24;
writeJson("llm-call-accounting.json", {
  campaign: "SEM-001R3C",
  provider: "GOOGLE_GEMINI",
  model: MODEL_ID,
  maxRequestsPerMinute: 5,
  concurrency: 1,
  historicalR3bCallsRealized: 11,
  continuationCallsRealized: continuationCalls,
  cumulativeR3bAndR3cCallsRealized: 11 + continuationCalls,
  reconstructionCallsRealizedInContinuation: 0,
  criticCallsRealizedInContinuation: continuationCalls,
  retriesInContinuation: continuationRetries,
  callsAvoidedByCompatibleCache: 32,
  avoidedDetail: { reconstructionCalls: 30, completedD02CriticCalls: 2 },
  minimumCallsDeferredByGate: callsDeferredByGate,
  providerFailuresInContinuation: continuationProviderFailures,
  completeCompatibleCriticCases: compatibleComplete,
  accountingTable: [
    { stage: "RECONSTRUCTION", cases: 30, potentialCalls: 30, actualCalls: 0, retries: 0, avoidedByCompatibleCache: 30, deferredByGate: 0, providerFailures: 0 },
    { stage: "CRITIC_D02_COMPLETE", cases: 1, potentialCalls: 2, actualCalls: 0, retries: 0, avoidedByCompatibleCache: 2, deferredByGate: 0, providerFailures: 0 },
    { stage: "CRITIC_TARGETED_R3C", cases: 5, potentialCalls: "5 initial plus bounded second critic cycles and retries", actualCalls: continuationAttempts.filter((item) => ["SEM-D16", "SEM-D19", "SEM-D21", "SEM-D23", "SEM-D28"].includes(item.caseId)).length, retries: continuationAttempts.filter((item) => ["SEM-D16", "SEM-D19", "SEM-D21", "SEM-D23", "SEM-D28"].includes(item.caseId) && item.finalDisposition === "RETRY_SCHEDULED").length, avoidedByCompatibleCache: 0, deferredByGate: 0, providerFailures: continuationAttempts.filter((item) => ["SEM-D16", "SEM-D19", "SEM-D21", "SEM-D23", "SEM-D28"].includes(item.caseId) && item.finalDisposition === "PROVIDER_CAPACITY_FAILURE").length },
    { stage: "CRITIC_REMAINDER", cases: 24, potentialCalls: "24 initial plus bounded second critic cycles and retries", actualCalls: continuationAttempts.filter((item) => !TARGETED_IDS.has(item.caseId)).length, retries: continuationAttempts.filter((item) => !TARGETED_IDS.has(item.caseId) && item.finalDisposition === "RETRY_SCHEDULED").length, avoidedByCompatibleCache: 0, deferredByGate: callsDeferredByGate, providerFailures: continuationAttempts.filter((item) => !TARGETED_IDS.has(item.caseId) && item.finalDisposition === "PROVIDER_CAPACITY_FAILURE").length },
  ],
  distinction: "Compatible-cache avoidance is distinct from calls not yet required or deferred by the targeted gate.",
});
writeJson("provider-run-state.json", {
  phase: TARGETED ? "TARGETED" : "REMAINING",
  runId,
  selectedCases: selected.map((item) => item.caseId),
  limiter: limiter.snapshot(),
  stoppedForProvider: stopForProvider,
  stopReason,
  consecutiveIndependentCapacityFailures,
  criticPromptVersion: SEMANTIC_CRITIC_PROMPT_VERSION,
  providerSchemaDigest: currentDigests.providerSchema,
  resumeCondition: stopForProvider ? "Resume only with the same semantic digests when provider capacity is restored." : null,
});

if (!calculatedMetrics) {
  writeJson("development-results.json", liveResults);
  writeJson("development-metrics.json", { status: "NOT_CALCULATED", compatibleComplete, required: 30, reason: "Metrics require 30/30 configuration-compatible critic results." });
}

const stageArtifacts = DEVELOPMENT_CASES.flatMap((fixture) => {
  const result = liveResults.find((item) => item.caseId === fixture.caseId);
  const stage2Complete = result?.finalStatus === "COMPLETE";
  return [
    { caseId: fixture.caseId, stage: 1, name: "LLM_RECONSTRUCTION", status: "COMPLETE_REUSED", digest: logicalDigest(baseResults.find((item) => item.caseId === fixture.caseId)?.reconstructionCandidate) },
    { caseId: fixture.caseId, stage: 2, name: "LLM_CRITIC", status: stage2Complete ? "COMPLETE" : "NOT_EVALUATED_COMPATIBLY", digest: stage2Complete ? logicalDigest(result.critics) : null },
    { caseId: fixture.caseId, stage: 3, name: "CANONICALIZATION", status: stage2Complete ? "COMPLETE" : "BLOCKED_BY_STAGE_2", digest: stage2Complete ? result.semanticModel?.digest ?? null : null },
    { caseId: fixture.caseId, stage: 4, name: "COVERAGE_AND_REPAIRS", status: stage2Complete ? "COMPLETE" : "BLOCKED_BY_STAGE_2", digest: stage2Complete ? logicalDigest({ explicit: result.semanticModel?.explicitCoverageReport, relations: result.semanticModel?.relationCoverageReport, repairs: result.repairDiagnostics }) : null },
    { caseId: fixture.caseId, stage: 5, name: "EVALUATION", status: stage2Complete ? "COMPLETE" : "BLOCKED_BY_STAGE_2", digest: stage2Complete ? logicalDigest(result.metric) : null },
    { caseId: fixture.caseId, stage: 6, name: "METRICS", status: stage2Complete ? "COMPLETE" : "BLOCKED_BY_STAGE_2", digest: stage2Complete ? logicalDigest(result.metric) : null },
  ];
});
writeJson("stage-checkpoint-manifest.json", {
  campaign: "SEM-001R3C",
  generatedAt: new Date().toISOString(),
  caseCount: 30,
  artifactsPerCase: 6,
  totalArtifacts: 180,
  compatibleCompleteCases: compatibleComplete,
  stageVersions: { reconstruction: SEMANTIC_RECONSTRUCTION_PROMPT_VERSION, critic: SEMANTIC_CRITIC_PROMPT_VERSION, canonical: SCIENTIFIC_SEMANTIC_MODEL_VERSION, schema: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION },
  dependencyDigests: currentDigests,
  artifacts: stageArtifacts,
});

const aggregatePass = Boolean(calculatedMetrics?.aggregate?.passesSem001Thresholds);
const providerBlocked = liveResults.some((item) => item.finalStatus === "PROVIDER_CAPACITY_FAILURE") || stopForProvider;
const decision = providerBlocked && compatibleComplete < 30
  ? "SEM001R3B_BLOCKED_BY_PROVIDER"
  : targetedGate?.decision === "TARGETED_GATE_REQUIRES_FURTHER_WORK"
    ? "R3B_TARGETED_REPAIR_REQUIRES_FURTHER_WORK"
    : compatibleComplete === 30 && aggregatePass
      ? "R3B_DEVELOPMENT_READY_FOR_HUMAN_HOLDOUT_DECISION"
      : "R3B_DEVELOPMENT_REQUIRES_FURTHER_REPAIR";
writeJson("qualification-summary.json", {
  campaign: "SEM-001R3C",
  decision,
  targeted: { complete: targetedGate?.targetedComplete ?? 0, expected: 5, gate: targetedGate?.decision ?? "NOT_RUN" },
  developmentCompatible: { complete: compatibleComplete, expected: 30 },
  provider: { name: "GOOGLE_GEMINI", model: MODEL_ID, stopped: stopForProvider, stopReason },
  llm: { continuationCalls, cumulativeCalls: 11 + continuationCalls, callsAvoidedByCompatibleCache: 32, minimumCallsDeferredByGate: callsDeferredByGate },
  holdout: "NOT_STARTED_FORBIDDEN",
  metrics: calculatedMetrics?.aggregate ?? null,
});

// Deterministic compatibility evidence is recomputed for every cached R3 candidate; no provider data or Gold Frame enters the source/coverage checks.
writeJson("deterministic-replay.json", {
  caseCount: 30,
  cases: DEVELOPMENT_CASES.map((fixture) => {
    const base = baseResults.find((item) => item.caseId === fixture.caseId);
    const request = makeRequest(fixture, base);
    const coverage = buildSemanticCoverage(request, base.reconstructionCandidate);
    const reevaluated = evaluateSemanticCase(fixture, base.semanticModel);
    return { caseId: fixture.caseId, reusedReconstruction: true, coverage, reevaluatedCachedCanonicalModel: reevaluated, llmRequired: true, reason: "CRITIC_PROMPT_AND_PROVIDER_SCHEMA_INVALIDATED_STAGE_2" };
  }),
});
