/* eslint-disable @typescript-eslint/no-explicit-any */
import { copyFileSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnv } from "vite";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import {
  SCIENTIFIC_SEMANTIC_ATOMIC_COMPOSITION_AUDIT_PROMPT,
  SEMANTIC_ATOMIC_COMPOSITION_AUDIT_PROMPT_VERSION,
} from "../../../../api/prompts/scientific-semantic-atomic-composition-prompt";
import { SCIENTIFIC_SEMANTIC_CRITIC_PROMPT, SCIENTIFIC_SEMANTIC_RECONSTRUCTION_PROMPT } from "../../../../api/prompts/scientific-semantic-reconstruction-prompt";
import { canonicalizeSemanticReconstruction } from "../canonical";
import {
  runSemanticAtomicCompositionCycles,
  SEMANTIC_ATOMIC_COMPOSITION_AUDIT_JSON_SCHEMA,
  SEMANTIC_ATOMIC_COMPOSITION_AUDIT_SCHEMA_VERSION,
} from "../atomic-composition";
import { evaluateSemanticCase } from "../competence";
import { DEVELOPMENT_CASES } from "../competence-fixtures";
import { applyCriticRepairs } from "../coverage";
import { verifySemanticModelWithKnowledge } from "../knowledge";
import { GeminiScientificSemanticProvider, SemanticProviderError } from "../provider";
import { SEMANTIC_CRITIC_JSON_SCHEMA, SEMANTIC_RECONSTRUCTION_JSON_SCHEMA } from "../schema";
import {
  SCIENTIFIC_SEMANTIC_MODEL_VERSION,
  SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
  SEMANTIC_CRITIC_PROMPT_VERSION,
  SEMANTIC_RECONSTRUCTION_PROMPT_VERSION,
  type SemanticConversationMessage,
} from "../types";
import {
  R3dResilientAtomicCompositionProvider,
  R3D_MAX_ATTEMPTS_PER_LLM_OPERATION,
  R3D_TRANSIENT_WAIT_MS,
  type R3dProviderAttemptTrace,
} from "./r3d-provider-resilience";
import { RollingWindowRequestLimiter } from "./rolling-rate-limiter";

const ROOT = process.cwd();
const BASE_DIRECTORY = path.resolve(ROOT, "semantic-validation/sem-001r3");
const CONTINUATION_DIRECTORY = path.resolve(ROOT, "semantic-validation/sem-001r3b");
const MODEL_ID = "gemini-3.5-flash-lite";
const TARGET_IDS = [["SEM", "D21"].join("-"), ["SEM", "D28"].join("-")] as const;
const ATOMIC_TARGET_ID = TARGET_IDS[0];
const COMPOSITION_TARGET_ID = TARGET_IDS[1];
const PRIOR_COMPATIBLE_IDS = [["SEM", "D02"].join("-"), ["SEM", "D16"].join("-"), ["SEM", "D19"].join("-"), ATOMIC_TARGET_ID, ["SEM", "D23"].join("-"), COMPOSITION_TARGET_ID];
const VERIFY_ONLY = process.argv.includes("--verify-only");
const TARGETED = process.argv.includes("--targeted");
if (VERIFY_ONLY === TARGETED) throw new Error("SEM001R3D_EXACTLY_ONE_PHASE_REQUIRED");

const writeJson = (name: string, value: unknown) => {
  mkdirSync(CONTINUATION_DIRECTORY, { recursive: true });
  const target = path.join(CONTINUATION_DIRECTORY, name);
  const temporary = `${target}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  renameSync(temporary, target);
};
const readJson = <T>(target: string): T => JSON.parse(readFileSync(target, "utf8")) as T;
const exists = (target: string) => { try { readFileSync(target); return true; } catch { return false; } };
const baseResults = readJson<any[]>(path.join(BASE_DIRECTORY, "development-results.json"));
const r3cResults = readJson<any[]>(path.join(CONTINUATION_DIRECTORY, "live-critic-results.json"));
const r3cStagePlan = readJson<any>(path.join(CONTINUATION_DIRECTORY, "stage-invalidation-plan.json"));
const r3cConfiguration = readJson<any>(path.join(CONTINUATION_DIRECTORY, "configuration-verification-r3c.json"));

const currentDigests = {
  reconstructionPrompt: logicalDigest(SCIENTIFIC_SEMANTIC_RECONSTRUCTION_PROMPT),
  criticPrompt: logicalDigest(SCIENTIFIC_SEMANTIC_CRITIC_PROMPT),
  baseProviderSchema: logicalDigest({ reconstruction: SEMANTIC_RECONSTRUCTION_JSON_SCHEMA, critic: SEMANTIC_CRITIC_JSON_SCHEMA }),
  canonicalizer: logicalDigest(readFileSync(path.resolve(ROOT, "src/features/scientific-semantic-reconstruction/canonical.ts"), "utf8")),
  coverageAndRepair: logicalDigest(readFileSync(path.resolve(ROOT, "src/features/scientific-semantic-reconstruction/coverage.ts"), "utf8")),
  evaluator: logicalDigest(readFileSync(path.resolve(ROOT, "src/features/scientific-semantic-reconstruction/competence.ts"), "utf8")),
  developmentCorpus: logicalDigest(DEVELOPMENT_CASES.map((item) => ({ caseId: item.caseId, split: item.split, turns: item.turns }))),
  developmentGold: logicalDigest(DEVELOPMENT_CASES.map((item) => ({ caseId: item.caseId, gold: item.gold }))),
  atomicCompositionPrompt: logicalDigest(SCIENTIFIC_SEMANTIC_ATOMIC_COMPOSITION_AUDIT_PROMPT),
  atomicCompositionSchema: logicalDigest(SEMANTIC_ATOMIC_COMPOSITION_AUDIT_JSON_SCHEMA),
  atomicCompositionOwner: logicalDigest(readFileSync(path.resolve(ROOT, "src/features/scientific-semantic-reconstruction/atomic-composition.ts"), "utf8")),
};
const expectedBase = r3cStagePlan.r3bStageVersions;
const priorCompatibleCount = PRIOR_COMPATIBLE_IDS.filter((caseId) => r3cResults.some((item) => item.caseId === caseId && item.finalStatus === "COMPLETE")).length;
const goldFramesUnchanged = baseResults.length === 30 && baseResults.every((base) => DEVELOPMENT_CASES.some((fixture) => fixture.caseId === base.caseId && logicalDigest(fixture.gold) === base.goldFrameDigest));
const configurationChecks = [
  { contract: "R3C checkpoint", expected: "CONFIGURATION_IDENTITY_VERIFIED", observed: r3cConfiguration.decision, pass: r3cConfiguration.decision === "CONFIGURATION_IDENTITY_VERIFIED" },
  { contract: "provider", expected: "GOOGLE_GEMINI", observed: "GOOGLE_GEMINI", pass: true },
  { contract: "modelId", expected: MODEL_ID, observed: MODEL_ID, pass: true },
  { contract: "reconstructionPromptVersion", expected: "SEM-001-RECONSTRUCTION-1.2", observed: SEMANTIC_RECONSTRUCTION_PROMPT_VERSION, pass: String(SEMANTIC_RECONSTRUCTION_PROMPT_VERSION) === "SEM-001-RECONSTRUCTION-1.2" },
  { contract: "baseCriticPromptVersion", expected: "SEM-001-CRITIC-1.3", observed: SEMANTIC_CRITIC_PROMPT_VERSION, pass: String(SEMANTIC_CRITIC_PROMPT_VERSION) === "SEM-001-CRITIC-1.3" },
  { contract: "reconstructionPromptDigest", expected: r3cConfiguration.currentDigests.reconstructionPrompt, observed: currentDigests.reconstructionPrompt, pass: currentDigests.reconstructionPrompt === r3cConfiguration.currentDigests.reconstructionPrompt },
  { contract: "baseCriticPromptDigest", expected: r3cConfiguration.currentDigests.criticPrompt, observed: currentDigests.criticPrompt, pass: currentDigests.criticPrompt === r3cConfiguration.currentDigests.criticPrompt },
  { contract: "schemaVersion", expected: "SEM-001-1.1", observed: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION, pass: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION === "SEM-001-1.1" },
  { contract: "canonicalModelVersion", expected: "1.1", observed: SCIENTIFIC_SEMANTIC_MODEL_VERSION, pass: SCIENTIFIC_SEMANTIC_MODEL_VERSION === "1.1" },
  { contract: "baseProviderSchemaDigest", expected: expectedBase.providerSchemaDigest, observed: currentDigests.baseProviderSchema, pass: currentDigests.baseProviderSchema === expectedBase.providerSchemaDigest },
  { contract: "canonicalizerDigest", expected: r3cConfiguration.currentDigests.canonicalizer, observed: currentDigests.canonicalizer, pass: currentDigests.canonicalizer === r3cConfiguration.currentDigests.canonicalizer },
  { contract: "coverageAndRepairDigest", expected: expectedBase.coverageDigest, observed: currentDigests.coverageAndRepair, pass: currentDigests.coverageAndRepair === expectedBase.coverageDigest },
  { contract: "evaluatorDigest", expected: expectedBase.evaluatorDigest, observed: currentDigests.evaluator, pass: currentDigests.evaluator === expectedBase.evaluatorDigest },
  { contract: "developmentCount", expected: 30, observed: DEVELOPMENT_CASES.length, pass: DEVELOPMENT_CASES.length === 30 },
  { contract: "developmentCorpusDigest", expected: r3cConfiguration.currentDigests.developmentCorpus, observed: currentDigests.developmentCorpus, pass: currentDigests.developmentCorpus === r3cConfiguration.currentDigests.developmentCorpus },
  { contract: "developmentGoldFrames", expected: "30 unchanged per-case digests", observed: goldFramesUnchanged ? "30/30" : "DRIFT", pass: goldFramesUnchanged },
  { contract: "targetCases", expected: 2, observed: DEVELOPMENT_CASES.filter((item) => TARGET_IDS.includes(item.caseId as typeof TARGET_IDS[number])).length, pass: TARGET_IDS.every((caseId) => DEVELOPMENT_CASES.some((item) => item.caseId === caseId)) },
  { contract: "priorCompatibleCases", expected: 6, observed: priorCompatibleCount, pass: priorCompatibleCount === 6 },
  { contract: "auditPromptVersion", expected: "SEM-001-ATOMIC-COMPOSITION-AUDIT-1.0", observed: SEMANTIC_ATOMIC_COMPOSITION_AUDIT_PROMPT_VERSION, pass: String(SEMANTIC_ATOMIC_COMPOSITION_AUDIT_PROMPT_VERSION) === "SEM-001-ATOMIC-COMPOSITION-AUDIT-1.0" },
  { contract: "auditSchemaVersion", expected: "SEM-001-ATOMIC-COMPOSITION-1.0", observed: SEMANTIC_ATOMIC_COMPOSITION_AUDIT_SCHEMA_VERSION, pass: String(SEMANTIC_ATOMIC_COMPOSITION_AUDIT_SCHEMA_VERSION) === "SEM-001-ATOMIC-COMPOSITION-1.0" },
  { contract: "retryPolicy", expected: "5 attempts; 60s transient wait; concurrency 1", observed: `${R3D_MAX_ATTEMPTS_PER_LLM_OPERATION} attempts; ${R3D_TRANSIENT_WAIT_MS}ms; concurrency 1`, pass: R3D_MAX_ATTEMPTS_PER_LLM_OPERATION === 5 && R3D_TRANSIENT_WAIT_MS === 60_000 },
];
const configurationVerification = {
  campaign: "SEM-001R3D", verifiedAt: new Date().toISOString(),
  decision: configurationChecks.every((item) => item.pass) ? "R3D_CONFIGURATION_VERIFIED" : "STOP_CONFIGURATION_DRIFT",
  interpretation: "The base critic remains version 1.3. The atomicity/composition audit is an additive conditional stage, so unchanged base checkpoints are not globally invalidated.",
  currentDigests, checks: configurationChecks,
};
writeJson("configuration-verification-r3d.json", configurationVerification);

const stageInvalidation = {
  campaign: "SEM-001R3D", calculatedAt: new Date().toISOString(),
  decisionRule: "Invalidate only the new conditional audit and its downstream products for the two independently evidenced structural failures.",
  globalBaseConfiguration: "UNCHANGED",
  stages: [
    { stage: 1, name: "LLM_RECONSTRUCTION", scope: "30 Development cases", disposition: "COMPLETE_REUSED", llmRequired: false, reason: "Prompt, schema, model and candidate digests are unchanged." },
    { stage: 2, name: "BASE_LLM_CRITIC_1_3", scope: "6 R3C compatible cases", disposition: "COMPLETE_REUSED", llmRequired: false, reason: "The base critic prompt and schema are unchanged." },
    { stage: "2b", name: "CONDITIONAL_ATOMIC_COMPOSITION_AUDIT", scope: TARGET_IDS, disposition: "INVALIDATED_REQUIRED", llmRequired: true, reason: "Independent evaluation evidence identifies an atomic inventory gap and a composite-object gap." },
    { stage: "2b", name: "CONDITIONAL_ATOMIC_COMPOSITION_AUDIT", scope: "four other R3C-compatible cases", disposition: "NOT_APPLICABLE", llmRequired: false, reason: "No atomicity/composition defect was established; this is a demand-driven bounded control, not a global critic replacement." },
    { stage: 3, name: "CANONICALIZATION", scope: TARGET_IDS, disposition: "INVALIDATED_DOWNSTREAM", llmRequired: false, reason: "Depends on the repaired candidate." },
    { stage: 4, name: "COVERAGE_AND_REPAIRS", scope: TARGET_IDS, disposition: "INVALIDATED_DOWNSTREAM", llmRequired: false, reason: "Depends on new source-grounded inventory objects and relations." },
    { stage: 5, name: "EVALUATION", scope: TARGET_IDS, disposition: "INVALIDATED_DOWNSTREAM", llmRequired: false, reason: "Evaluator is unchanged but must assess the new canonical model." },
    { stage: 6, name: "CASE_METRICS", scope: TARGET_IDS, disposition: "INVALIDATED_DOWNSTREAM", llmRequired: false, reason: "Metrics depend on the re-evaluated models." },
    { stage: 2, name: "REMAINING_DEVELOPMENT_CRITIC", scope: "24 cases", disposition: "DEFERRED_BY_TARGETED_GATE", llmRequired: false, reason: "The targeted gate must pass first." },
    { stage: "HOLDOUT", name: "HUMAN_HOLDOUT", scope: "30 cases", disposition: "FORBIDDEN", llmRequired: false, reason: "Development is not globally qualified." },
  ],
};
writeJson("stage-invalidation-r3d.json", stageInvalidation);
if (configurationVerification.decision !== "R3D_CONFIGURATION_VERIFIED") throw new Error("SEM001R3D_CONFIGURATION_DRIFT_STOP");
if (VERIFY_ONLY) {
  console.log(JSON.stringify({ configurationVerification, stageInvalidation }, null, 2));
  process.exit(0);
}

const environment = loadEnv("development", ROOT, "");
const apiKey = environment.GEMINI_API_KEY?.trim();
if (!apiKey) throw new Error("GEMINI_API_KEY_MISSING");
const resultsPath = path.join(CONTINUATION_DIRECTORY, "targeted-r3d-results.json");
let results = exists(resultsPath) ? readJson<any[]>(resultsPath) : [];
const priorStatePath = path.join(CONTINUATION_DIRECTORY, "provider-run-state-r3d.json");
const priorState = exists(priorStatePath) ? readJson<any>(priorStatePath) : null;
const tracedPriorStarts = results.flatMap((result) => result.operationTraces.flatMap((trace: any) => trace.attempts.map((attempt: any) => attempt.requestStarted)));
const limiter = new RollingWindowRequestLimiter({ maxRequests: 5, windowMs: 60_000, safetyMarginMs: 500, initialStarts: priorState?.limiter?.retainedStarts ?? tracedPriorStarts, initialTotalStarts: Math.max(tracedPriorStarts.length, priorState?.limiter?.totalStarts ?? 0) });
const runId = `sem-001r3d-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const historyDirectory = path.join(CONTINUATION_DIRECTORY, "history", runId);
mkdirSync(historyDirectory, { recursive: true });
for (const name of ["targeted-r3d-results.json", "provider-diagnostics-r3d.json", "llm-call-accounting-r3d.json", "targeted-r3d-gate-decision.json"]) {
  const source = path.join(CONTINUATION_DIRECTORY, name);
  if (exists(source)) copyFileSync(source, path.join(historyDirectory, name));
}
const providerDiagnosticsPath = path.join(CONTINUATION_DIRECTORY, "provider-diagnostics-r3d.json");
const providerDiagnostics: any = exists(providerDiagnosticsPath) ? readJson<any>(providerDiagnosticsPath) : {
  campaign: "SEM-001R3D", provider: "GOOGLE_GEMINI", model: MODEL_ID, noSecretsStored: true,
  resiliencePolicy: { maxAttemptsPerLlmOperation: 5, transientWaitMs: 60_000, concurrency: 1, structuredCorrectionGenerations: 2 }, runs: [], attempts: [],
};
providerDiagnostics.runs.push({ runId, phase: "TARGETED", startedAt: new Date().toISOString(), selectedCases: TARGET_IDS });
const checkpointProviderDiagnostics = () => writeJson("provider-diagnostics-r3d.json", providerDiagnostics);
checkpointProviderDiagnostics();
const baseProvider = new GeminiScientificSemanticProvider({ apiKey, model: MODEL_ID, timeoutMs: 90_000, maxAttempts: 1, beforeAttempt: () => limiter.acquire() });
const provider = new R3dResilientAtomicCompositionProvider(baseProvider, { onAttempt: (trace: R3dProviderAttemptTrace) => { providerDiagnostics.attempts.push({ runId, ...trace }); checkpointProviderDiagnostics(); } });

const makeRequest = (fixture: (typeof DEVELOPMENT_CASES)[number]) => ({
  schemaVersion: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
  sessionId: `sem-001r3d:${fixture.caseId}`,
  language: "fr" as const,
  messages: fixture.turns.map((content, index): SemanticConversationMessage => ({ messageId: `${fixture.caseId}:user:${index + 1}`, role: "USER", content, createdAt: `2026-08-12T12:${String(index).padStart(2, "0")}:00.000Z` })),
  previousModel: null,
});
const replayR3cCandidate = (base: any, prior: any, request: ReturnType<typeof makeRequest>) => {
  let current = structuredClone(base.reconstructionCandidate);
  const diagnostics: any[] = [];
  for (const critic of prior.critics) {
    if (!critic.proposedRepairs.length) continue;
    const applied = applyCriticRepairs(request, current, critic.proposedRepairs);
    current = applied.candidate;
    diagnostics.push(...applied.diagnostics);
  }
  if (diagnostics.some((item) => item.status !== "ACCEPTED")) throw new Error("R3C_REPAIR_REPLAY_DIVERGED");
  return { candidate: current, diagnostics };
};
const checkpoint = () => { results.sort((left, right) => left.caseId.localeCompare(right.caseId)); writeJson("targeted-r3d-results.json", results); };

let systemicProviderFailure = false;
let stopReason: string | null = null;
let independentCapacityFailures = 0;
for (const fixture of DEVELOPMENT_CASES.filter((item) => TARGET_IDS.includes(item.caseId as typeof TARGET_IDS[number]))) {
  if (results.some((item) => item.caseId === fixture.caseId && item.finalStatus === "COMPLETE")) continue;
  const base = baseResults.find((item) => item.caseId === fixture.caseId);
  const prior = r3cResults.find((item) => item.caseId === fixture.caseId && item.finalStatus === "COMPLETE");
  if (!base?.reconstructionCandidate || !prior?.semanticModel || !prior?.critics?.length) throw new Error(`R3D_REQUIRED_CHECKPOINT_MISSING:${fixture.caseId}`);
  const request = makeRequest(fixture);
  const replayed = replayR3cCandidate(base, prior, request);
  const startedAt = Date.now();
  const result: any = {
    caseId: fixture.caseId, runId, finalStatus: "FAILED", reconstructionReused: true, baseCriticReused: true,
    firstImpactedStage: "2b", requestStarted: new Date(startedAt).toISOString(), completedAt: null,
    baseCandidateDigest: logicalDigest(replayed.candidate), auditPromptVersion: SEMANTIC_ATOMIC_COMPOSITION_AUDIT_PROMPT_VERSION,
    auditPromptDigest: currentDigests.atomicCompositionPrompt, auditSchemaVersion: SEMANTIC_ATOMIC_COMPOSITION_AUDIT_SCHEMA_VERSION,
    operationTraces: [], audits: [], compilationDiagnostics: [], repairDiagnostics: [], semanticModel: null, metric: null, error: null,
  };
  try {
    const audited = await runSemanticAtomicCompositionCycles(provider, request, replayed.candidate);
    result.audits = audited.audits;
    result.compilationDiagnostics = audited.compilationDiagnostics;
    result.repairDiagnostics = audited.repairDiagnostics;
    result.auditTerminalReason = audited.terminalReason;
    audited.audits.forEach((audit, index) => result.operationTraces.push({ operation: "ATOMIC_COMPOSITION_AUDIT", cycle: index + 1, callId: audited.callIds[index], structuredDigest: logicalDigest(audit), attempts: audited.cycleAttempts[index] ?? [] }));
    if (!audited.accepted) throw new Error(`R3D_AUDIT_NOT_ACCEPTED:${audited.terminalReason}`);
    const snapshot = prior.semanticModel.executionSnapshot;
    const finalCritic = prior.critics.at(-1)!;
    const model = verifySemanticModelWithKnowledge(canonicalizeSemanticReconstruction({
      request, candidate: audited.candidate, critic: finalCritic, metadata: provider.metadata,
      reconstructionCallId: snapshot?.reconstructionCallId ?? "r3-reconstruction-reused",
      criticCallId: snapshot?.criticCallId ?? "r3c-critic-reused",
      criticCallIds: snapshot?.criticCallIds ?? [], critics: prior.critics,
      reconstructionAttempts: snapshot?.reconstructionAttempts ?? [], criticAttempts: snapshot?.criticAttempts ?? [],
    }));
    result.semanticModel = model;
    result.metric = evaluateSemanticCase(fixture, model);
    result.finalStatus = "COMPLETE";
    result.completedAt = new Date().toISOString();
    independentCapacityFailures = 0;
  } catch (caught) {
    if (caught instanceof SemanticProviderError) {
      result.operationTraces.push({ operation: "ATOMIC_COMPOSITION_AUDIT", cycle: null, callId: null, structuredDigest: null, attempts: caught.attempts });
      result.error = {
        category: caught.category,
        httpStatus: caught.details?.httpStatus ?? null,
        providerStatus: caught.details?.providerStatus ?? null,
        message: caught.message,
        diagnostic: caught.diagnostic,
      };
      const capacityFailure = ["RATE_LIMIT", "SERVER_ERROR", "TIMEOUT", "NETWORK"].includes(caught.category);
      result.finalStatus = capacityFailure ? "PROVIDER_CAPACITY_FAILURE" : "FAILED";
      if (capacityFailure) independentCapacityFailures += 1;
      else { systemicProviderFailure = true; stopReason = caught.category === "QUOTA" ? "DAILY_PROVIDER_CAPACITY_EXHAUSTED" : `NON_RETRYABLE_PROVIDER_FAILURE:${caught.category}`; }
    } else result.error = { category: "SEMANTIC_PIPELINE_FAILURE", message: caught instanceof Error ? caught.message : "UNKNOWN" };
  }
  result.latencyMs = Date.now() - startedAt;
  results = [...results.filter((item) => item.caseId !== fixture.caseId), result];
  if (result.finalStatus !== "COMPLETE") writeFileSync(path.join(historyDirectory, `${fixture.caseId}-failed-attempt-snapshot.json`), `${JSON.stringify(result, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  checkpoint();
  console.log(`${fixture.caseId} ${result.finalStatus} calls=${result.operationTraces.reduce((sum: number, trace: any) => sum + trace.attempts.length, 0)} total=${limiter.snapshot().totalStarts}`);
  if (systemicProviderFailure) break;
}
if (independentCapacityFailures >= TARGET_IDS.length) { systemicProviderFailure = true; stopReason = "SYSTEMIC_PROVIDER_UNAVAILABILITY_ACROSS_BOTH_TARGETS"; }
const currentRun = providerDiagnostics.runs.find((item: any) => item.runId === runId);
if (currentRun) { currentRun.completedAt = new Date().toISOString(); currentRun.stopped = systemicProviderFailure; currentRun.stopReason = stopReason; currentRun.independentCapacityFailures = independentCapacityFailures; }
checkpointProviderDiagnostics();

const evidence = TARGET_IDS.map((caseId) => {
  const item = results.find((candidate) => candidate.caseId === caseId);
  return {
    caseId, finalStatus: item?.finalStatus ?? "NOT_RUN", explicitObjectRecall: item?.metric?.explicitObjectRecall ?? null,
    explicitRelationRecall: item?.metric?.explicitRelationRecall ?? null, criticalSemanticRecall: item?.metric?.criticalSemanticRecall ?? null,
    routeCorrect: item?.metric?.routeCorrect ?? null, absoluteBlockers: item?.metric?.absoluteBlockers ?? null, providerError: item?.error ?? null,
    auditTerminalReason: item?.auditTerminalReason ?? null,
  };
});
const atomicPass = evidence.find((item) => item.caseId === ATOMIC_TARGET_ID)?.finalStatus === "COMPLETE"
  && evidence.find((item) => item.caseId === ATOMIC_TARGET_ID)?.explicitObjectRecall === 1
  && evidence.find((item) => item.caseId === ATOMIC_TARGET_ID)?.explicitRelationRecall === 1
  && evidence.find((item) => item.caseId === ATOMIC_TARGET_ID)?.criticalSemanticRecall === 1
  && evidence.find((item) => item.caseId === ATOMIC_TARGET_ID)?.absoluteBlockers?.length === 0;
const compositionPass = evidence.find((item) => item.caseId === COMPOSITION_TARGET_ID)?.finalStatus === "COMPLETE"
  && evidence.find((item) => item.caseId === COMPOSITION_TARGET_ID)?.explicitObjectRecall === 1
  && evidence.find((item) => item.caseId === COMPOSITION_TARGET_ID)?.explicitRelationRecall === 1
  && evidence.find((item) => item.caseId === COMPOSITION_TARGET_ID)?.criticalSemanticRecall === 1
  && evidence.find((item) => item.caseId === COMPOSITION_TARGET_ID)?.routeCorrect === true
  && evidence.find((item) => item.caseId === COMPOSITION_TARGET_ID)?.absoluteBlockers?.length === 0;
const providerBlocked = evidence.some((item) => item.finalStatus === "PROVIDER_CAPACITY_FAILURE") || systemicProviderFailure;
const decision = providerBlocked ? "R3D_BLOCKED_BY_PROVIDER" : atomicPass && compositionPass ? "R3D_TARGETED_GATE_PASS" : "R3D_TARGETED_GATE_REQUIRES_FURTHER_WORK";
writeJson("targeted-r3d-gate-decision.json", {
  campaign: "SEM-001R3D", decidedAt: new Date().toISOString(), decision, evidence,
  conditions: { atomicInventoryTargetPass: atomicPass, semanticCompositionTargetPass: compositionPass, noAbsoluteBlockers: evidence.every((item) => item.absoluteBlockers?.length === 0), routesCorrect: evidence.every((item) => item.routeCorrect === true) },
  remainingDevelopmentCriticCallsAuthorized: decision === "R3D_TARGETED_GATE_PASS", remainingDevelopmentCriticCallsExecuted: 0, holdout: "FORBIDDEN",
});

const attempts = providerDiagnostics.attempts as R3dProviderAttemptTrace[];
const actualCalls = attempts.filter((item) => item.category !== "NETWORK").length;
const transportAttemptsBlockedBeforeProvider = attempts.filter((item) => item.category === "NETWORK").length;
const retries = attempts.filter((item) => item.finalDisposition === "RETRY_SCHEDULED" && item.category !== "NETWORK").length;
const localTransportRetries = attempts.filter((item) => item.finalDisposition === "RETRY_SCHEDULED" && item.category === "NETWORK").length;
const structuredRegenerations = attempts.filter((item) => item.finalDisposition === "STRUCTURED_REGENERATION").length;
writeJson("llm-call-accounting-r3d.json", {
  campaign: "SEM-001R3D", provider: "GOOGLE_GEMINI", model: MODEL_ID, concurrency: 1, maxRequestsPerRollingMinute: 5,
  actualLlmCalls: actualCalls, retries, structuredRegenerations, reconstructionCalls: 0, baseCriticCalls: 0,
  atomicCompositionAuditCalls: actualCalls, transportAttemptsBlockedBeforeProvider, localTransportRetries, callsAvoidedByReuseOrCache: 42,
  avoidedDetail: { reconstructionCheckpoints: 30, baseCriticProviderCallsAcrossSixCompatibleCases: 12 },
  callsNotRequiredForFourCompatibleCases: 4, targetedAuditOperationsDeferredByGate: 1, remainingDevelopmentCriticCallsDeferred: 24, holdoutCalls: 0,
  distinction: "Compatible checkpoint reuse, conditionally inapplicable audits and gate-deferred calls are counted separately.",
});
writeJson("provider-run-state-r3d.json", {
  phase: "TARGETED", runId, selectedCases: TARGET_IDS, limiter: limiter.snapshot(), stoppedForProvider: systemicProviderFailure, stopReason,
  auditPromptVersion: SEMANTIC_ATOMIC_COMPOSITION_AUDIT_PROMPT_VERSION, auditPromptDigest: currentDigests.atomicCompositionPrompt,
  auditSchemaVersion: SEMANTIC_ATOMIC_COMPOSITION_AUDIT_SCHEMA_VERSION, auditSchemaDigest: currentDigests.atomicCompositionSchema,
  resumeCondition: systemicProviderFailure ? "Resume only with unchanged R3D prompt, schema, model and checkpoint digests." : null,
});
const compatibleCaseIds = PRIOR_COMPATIBLE_IDS;
writeJson("six-case-compatibility-r3d.json", {
  campaign: "SEM-001R3D", status: decision === "R3D_TARGETED_GATE_PASS" ? "6_OF_6_CONFIGURATION_COMPATIBLE" : "4_OF_6_BASE_COMPATIBLE_TWO_TARGETS_NOT_QUALIFIED",
  cases: compatibleCaseIds.map((caseId) => TARGET_IDS.includes(caseId as typeof TARGET_IDS[number])
    ? { caseId, baseCritic: "COMPLETE_REUSED", conditionalAudit: results.find((item) => item.caseId === caseId)?.finalStatus === "COMPLETE" ? "COMPLETE" : "NOT_QUALIFIED", metric: results.find((item) => item.caseId === caseId)?.metric ?? null }
    : { caseId, baseCritic: "COMPLETE_REUSED", conditionalAudit: "NOT_APPLICABLE", metric: r3cResults.find((item) => item.caseId === caseId)?.metric ?? null }),
});
writeJson("qualification-summary-r3d.json", {
  campaign: "SEM-001R3D", decision, targeted: { complete: evidence.filter((item) => item.finalStatus === "COMPLETE").length, expected: 2, atomicPass, compositionPass },
  development: { configurationCompatible: decision === "R3D_TARGETED_GATE_PASS" ? 6 : 4, expectedAtThisGate: 6, remainingCriticCallsDeferred: 24 },
  llm: { actualCalls, retries, structuredRegenerations, transportAttemptsBlockedBeforeProvider, localTransportRetries, callsAvoidedByReuseOrCache: 42 }, provider: { name: "GOOGLE_GEMINI", model: MODEL_ID, stopped: systemicProviderFailure, stopReason },
  holdout: "NOT_STARTED_FORBIDDEN", remainingDevelopment: "NOT_EXECUTED",
});
console.log(JSON.stringify({ decision, evidence, llm: { actualCalls, retries, structuredRegenerations, callsAvoidedByReuseOrCache: 42 }, holdout: "NOT_STARTED_FORBIDDEN" }, null, 2));
