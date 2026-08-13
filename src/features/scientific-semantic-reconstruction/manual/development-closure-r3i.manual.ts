/* eslint-disable @typescript-eslint/no-explicit-any */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnv } from "vite";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { SCIENTIFIC_SEMANTIC_ATOMIC_COMPOSITION_AUDIT_PROMPT } from "../../../../api/prompts/scientific-semantic-atomic-composition-prompt";
import { SCIENTIFIC_SEMANTIC_CRITIC_PROMPT, SCIENTIFIC_SEMANTIC_RECONSTRUCTION_PROMPT } from "../../../../api/prompts/scientific-semantic-reconstruction-prompt";
import {
  compileAtomicCompositionRepairs,
  enforceAtomicCompositionAcceptanceConsistency,
  parseSemanticAtomicCompositionAudit,
  runSemanticAtomicCompositionCycles,
  SEMANTIC_ATOMIC_COMPOSITION_AUDIT_JSON_SCHEMA,
} from "../atomic-composition";
import { canonicalizeSemanticReconstruction } from "../canonical";
import { evaluateSemanticCampaign, evaluateSemanticCase, type SemanticCaseMetrics } from "../competence";
import { DEVELOPMENT_CASES, HOLDOUT_CASES, type SemanticCompetenceCase } from "../competence-fixtures";
import { applyCriticRepairs, buildSemanticCoverage, runSemanticCriticCycles } from "../coverage";
import { verifySemanticModelWithKnowledge } from "../knowledge";
import { GeminiScientificSemanticProvider, SemanticProviderError } from "../provider";
import { SEMANTIC_CRITIC_JSON_SCHEMA, SEMANTIC_RECONSTRUCTION_JSON_SCHEMA } from "../schema";
import {
  SCIENTIFIC_SEMANTIC_MODEL_VERSION,
  SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
  SEMANTIC_CRITIC_PROMPT_VERSION,
  SEMANTIC_RECONSTRUCTION_PROMPT_VERSION,
  type ScientificSemanticModel,
  type SemanticConversationMessage,
} from "../types";
import { R3cResilientSemanticProvider, R3C_MAX_ATTEMPTS_PER_LLM_OPERATION, R3C_TRANSIENT_WAIT_MS, type R3cProviderAttemptTrace } from "./r3c-provider-resilience";
import { R3dResilientAtomicCompositionProvider, type R3dProviderAttemptTrace } from "./r3d-provider-resilience";
import { RollingWindowRequestLimiter } from "./rolling-rate-limiter";

const ROOT = process.cwd();
const BASE_DIRECTORY = path.resolve(ROOT, "semantic-validation/sem-001r3");
const CONTINUITY_DIRECTORY = path.resolve(ROOT, "semantic-validation/sem-001r3b");
const DIRECTORY = path.resolve(ROOT, "semantic-validation/sem-001r3i");
const MODEL_ID = "gemini-3.5-flash-lite";
const CLOSED_IDS = new Set(["SEM-D02", "SEM-D16", "SEM-D19", "SEM-D21", "SEM-D23", "SEM-D28"]);
const INVENTORY_ONLY = process.argv.includes("--inventory");
const RUN = process.argv.includes("--run");
if (INVENTORY_ONLY === RUN) throw new Error("SEM001R3I_EXACTLY_ONE_PHASE_REQUIRED");

const readJson = <T>(target: string): T => JSON.parse(readFileSync(target, "utf8")) as T;
const exists = (target: string) => { try { readFileSync(target); return true; } catch { return false; } };
const writeJson = (name: string, value: unknown) => {
  mkdirSync(DIRECTORY, { recursive: true });
  const target = path.join(DIRECTORY, name);
  const temporary = `${target}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  renameSync(temporary, target);
};

const source = (relativePath: string) => readFileSync(path.resolve(ROOT, relativePath), "utf8");
const baseResults = readJson<any[]>(path.join(BASE_DIRECTORY, "development-results.json"));
const r3cResults = readJson<any[]>(path.join(CONTINUITY_DIRECTORY, "live-critic-results.json"));
const r3gResults = readJson<any[]>(path.join(CONTINUITY_DIRECTORY, "targeted-r3g-results.json"));
const r3hResults = readJson<any[]>(path.join(CONTINUITY_DIRECTORY, "targeted-r3h-results.json"));
const r3hGate = readJson<any>(path.join(CONTINUITY_DIRECTORY, "targeted-r3h-gate-decision.json"));
const r3hConfiguration = readJson<any>(path.join(CONTINUITY_DIRECTORY, "configuration-verification-r3h.json"));
const recoveredD21Audit = readJson<any>(path.join(CONTINUITY_DIRECTORY, "recovered-valid-audit-r3e.json"));

const currentDigests = {
  developmentCorpus: logicalDigest(DEVELOPMENT_CASES.map((item) => ({ caseId: item.caseId, split: item.split, turns: item.turns }))),
  developmentGold: logicalDigest(DEVELOPMENT_CASES.map((item) => ({ caseId: item.caseId, gold: item.gold }))),
  holdoutCorpus: logicalDigest(HOLDOUT_CASES.map((item) => ({ caseId: item.caseId, split: item.split, turns: item.turns }))),
  holdoutGold: logicalDigest(HOLDOUT_CASES.map((item) => ({ caseId: item.caseId, gold: item.gold }))),
  reconstructionPrompt: logicalDigest(SCIENTIFIC_SEMANTIC_RECONSTRUCTION_PROMPT),
  criticPrompt: logicalDigest(SCIENTIFIC_SEMANTIC_CRITIC_PROMPT),
  auditPrompt: logicalDigest(SCIENTIFIC_SEMANTIC_ATOMIC_COMPOSITION_AUDIT_PROMPT),
  baseProviderSchema: logicalDigest({ reconstruction: SEMANTIC_RECONSTRUCTION_JSON_SCHEMA, critic: SEMANTIC_CRITIC_JSON_SCHEMA }),
  auditProviderSchema: logicalDigest(SEMANTIC_ATOMIC_COMPOSITION_AUDIT_JSON_SCHEMA),
  canonicalModel: logicalDigest({ semanticModelVersion: SCIENTIFIC_SEMANTIC_MODEL_VERSION, schemaVersion: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION, types: source("src/features/scientific-semantic-reconstruction/types.ts"), schema: source("src/features/scientific-semantic-reconstruction/schema.ts") }),
  acceptanceGuards: logicalDigest(source("src/features/scientific-semantic-reconstruction/atomic-composition.ts")),
  canonicalizer: logicalDigest(source("src/features/scientific-semantic-reconstruction/canonical.ts")),
  coverageAndRepair: logicalDigest(source("src/features/scientific-semantic-reconstruction/coverage.ts")),
  evaluator: logicalDigest(source("src/features/scientific-semantic-reconstruction/competence.ts")),
  routing: logicalDigest({ canonical: source("src/features/scientific-semantic-reconstruction/canonical.ts"), atomicComposition: source("src/features/scientific-semantic-reconstruction/atomic-composition.ts") }),
};
const semanticConfigurationDigest = logicalDigest({
  model: MODEL_ID,
  versions: { reconstruction: SEMANTIC_RECONSTRUCTION_PROMPT_VERSION, critic: SEMANTIC_CRITIC_PROMPT_VERSION, schema: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION, model: SCIENTIFIC_SEMANTIC_MODEL_VERSION },
  digests: currentDigests,
});

const configurationChecks = [
  { contract: "R3H gate", expected: "R3H_TARGETED_DEVELOPMENT_REPAIRS_PASSED", observed: r3hGate.decision, pass: r3hGate.decision === "R3H_TARGETED_DEVELOPMENT_REPAIRS_PASSED" },
  { contract: "R3H configuration", expected: "R3H_CONFIGURATION_VERIFIED", observed: r3hConfiguration.decision, pass: r3hConfiguration.decision === "R3H_CONFIGURATION_VERIFIED" },
  { contract: "model ID", expected: MODEL_ID, observed: MODEL_ID, pass: baseResults.every((item) => item.model === MODEL_ID) },
  { contract: "Development corpus", expected: r3hConfiguration.currentDigests.developmentCorpus, observed: currentDigests.developmentCorpus, pass: currentDigests.developmentCorpus === r3hConfiguration.currentDigests.developmentCorpus },
  { contract: "Development Gold", expected: r3hConfiguration.currentDigests.developmentGold, observed: currentDigests.developmentGold, pass: currentDigests.developmentGold === r3hConfiguration.currentDigests.developmentGold },
  { contract: "reconstruction prompt", expected: r3hConfiguration.currentDigests.reconstructionPrompt, observed: currentDigests.reconstructionPrompt, pass: currentDigests.reconstructionPrompt === r3hConfiguration.currentDigests.reconstructionPrompt },
  { contract: "critic prompt", expected: r3hConfiguration.currentDigests.criticPrompt, observed: currentDigests.criticPrompt, pass: currentDigests.criticPrompt === r3hConfiguration.currentDigests.criticPrompt },
  { contract: "base provider schema", expected: r3hConfiguration.currentDigests.baseProviderSchema, observed: currentDigests.baseProviderSchema, pass: currentDigests.baseProviderSchema === r3hConfiguration.currentDigests.baseProviderSchema },
  { contract: "canonicalizer", expected: r3hConfiguration.currentDigests.canonicalizer, observed: currentDigests.canonicalizer, pass: currentDigests.canonicalizer === r3hConfiguration.currentDigests.canonicalizer },
  { contract: "coverage and repair", expected: r3hConfiguration.currentDigests.coverageAndRepair, observed: currentDigests.coverageAndRepair, pass: currentDigests.coverageAndRepair === r3hConfiguration.currentDigests.coverageAndRepair },
  { contract: "evaluator", expected: r3hConfiguration.currentDigests.evaluator, observed: currentDigests.evaluator, pass: currentDigests.evaluator === r3hConfiguration.currentDigests.evaluator },
  { contract: "audit prompt", expected: r3hConfiguration.currentDigests.atomicCompositionPrompt, observed: currentDigests.auditPrompt, pass: currentDigests.auditPrompt === r3hConfiguration.currentDigests.atomicCompositionPrompt },
  { contract: "audit provider schema", expected: r3hConfiguration.currentDigests.providerTransportSchema, observed: currentDigests.auditProviderSchema, pass: currentDigests.auditProviderSchema === r3hConfiguration.currentDigests.providerTransportSchema },
  { contract: "acceptance guard owner", expected: r3hConfiguration.currentDigests.compositeMethodOwner, observed: currentDigests.acceptanceGuards, pass: currentDigests.acceptanceGuards === r3hConfiguration.currentDigests.compositeMethodOwner },
  { contract: "Development cases", expected: 30, observed: DEVELOPMENT_CASES.length, pass: DEVELOPMENT_CASES.length === 30 && new Set(DEVELOPMENT_CASES.map((item) => item.caseId)).size === 30 },
  { contract: "Holdout identity only", expected: 30, observed: HOLDOUT_CASES.length, pass: HOLDOUT_CASES.length === 30 && new Set(HOLDOUT_CASES.map((item) => item.caseId)).size === 30 },
  { contract: "reconstruction checkpoints", expected: "30/30 COMPLETE", observed: `${baseResults.filter((item) => item.finalStatus === "COMPLETE" && item.reconstructionCandidate).length}/30`, pass: baseResults.length === 30 && baseResults.every((item) => item.finalStatus === "COMPLETE" && item.reconstructionCandidate && DEVELOPMENT_CASES.some((fixture) => fixture.caseId === item.caseId && logicalDigest(fixture.gold) === item.goldFrameDigest)) },
  { contract: "closed base critics", expected: "6/6 COMPLETE", observed: `${r3cResults.filter((item) => CLOSED_IDS.has(item.caseId) && item.finalStatus === "COMPLETE").length}/6`, pass: r3cResults.length === 6 && r3cResults.every((item) => CLOSED_IDS.has(item.caseId) && item.finalStatus === "COMPLETE" && item.critics?.length) },
  { contract: "D21 deterministic closure", expected: "PASS", observed: r3gResults.find((item) => item.caseId === "SEM-D21")?.finalStatus ?? "MISSING", pass: r3gResults.find((item) => item.caseId === "SEM-D21")?.finalStatus === "PASS" },
  { contract: "D28 current closure", expected: "PASS", observed: r3hResults.find((item) => item.caseId === "SEM-D28")?.finalStatus ?? "MISSING", pass: r3hResults.find((item) => item.caseId === "SEM-D28")?.finalStatus === "PASS" },
  { contract: "provider resilience", expected: "5 attempts; >=60s; concurrency 1", observed: `${R3C_MAX_ATTEMPTS_PER_LLM_OPERATION} attempts; ${R3C_TRANSIENT_WAIT_MS}ms; concurrency 1`, pass: R3C_MAX_ATTEMPTS_PER_LLM_OPERATION === 5 && R3C_TRANSIENT_WAIT_MS === 60_000 },
];
const configurationVerification = {
  campaign: "SEM-001R3I",
  verifiedAt: new Date().toISOString(),
  decision: configurationChecks.every((item) => item.pass) ? "R3I_CONFIGURATION_VERIFIED" : "R3I_BLOCKED_BY_CONFIGURATION_DRIFT",
  semanticConfigurationDigest,
  model: MODEL_ID,
  currentDigests,
  checks: configurationChecks,
  holdout: "IDENTITY_DIGESTED_NOT_EXECUTED",
};
writeJson("configuration-verification-r3i.json", configurationVerification);

type StageClassification = "REUSE_COMPATIBLE" | "DETERMINISTIC_RECOMPUTE" | "LLM_REQUIRED" | "INVALID";
const classify = (caseId: string) => {
  const base = baseResults.find((item) => item.caseId === caseId);
  const closed = CLOSED_IDS.has(caseId);
  const d21 = caseId === "SEM-D21";
  const compatible = configurationVerification.decision === "R3I_CONFIGURATION_VERIFIED" && Boolean(base?.reconstructionCandidate);
  const invalid: StageClassification = "INVALID";
  return {
    caseId,
    reconstruction: { status: base?.finalStatus ?? "MISSING", classification: compatible ? "REUSE_COMPATIBLE" as StageClassification : invalid, digest: base?.reconstructionCandidate ? logicalDigest(base.reconstructionCandidate) : null },
    baseCritic: { status: closed ? "COMPLETE" : "NOT_RUN_CURRENT_CONFIGURATION", classification: compatible ? (closed ? "REUSE_COMPATIBLE" : "LLM_REQUIRED") as StageClassification : invalid, digest: closed ? logicalDigest(r3cResults.find((item) => item.caseId === caseId)?.critics) : null },
    atomicCompositionAudit: {
      status: d21 ? "COMPLETE_REUSABLE" : caseId === "SEM-D28" ? "COMPLETE_REUSABLE" : closed ? "NOT_APPLICABLE" : "CONDITIONAL_NOT_ACTIVATED",
      classification: compatible ? (d21 || caseId === "SEM-D28" || closed ? "REUSE_COMPATIBLE" : "LLM_REQUIRED") as StageClassification : invalid,
      executionCondition: closed ? "NONE" : "GENERIC_ATOMIC_OR_COMPOSITE_ACTIVATION_ONLY",
    },
    canonicalization: { status: closed ? "COMPLETE" : "BLOCKED_BY_CRITIC", classification: compatible ? (d21 || !closed ? "DETERMINISTIC_RECOMPUTE" : "REUSE_COMPATIBLE") as StageClassification : invalid },
    evaluation: { status: closed ? "COMPLETE" : "BLOCKED_BY_CRITIC", classification: compatible ? (d21 || !closed ? "DETERMINISTIC_RECOMPUTE" : "REUSE_COMPATIBLE") as StageClassification : invalid },
    metrics: { status: closed ? "COMPLETE" : "BLOCKED_BY_CRITIC", classification: compatible ? (d21 || !closed ? "DETERMINISTIC_RECOMPUTE" : "REUSE_COMPATIBLE") as StageClassification : invalid },
    dependencyDigests: currentDigests,
    r3hCompatible: compatible,
  };
};
const checkpointInventory = {
  campaign: "SEM-001R3I",
  generatedAt: new Date().toISOString(),
  configurationDecision: configurationVerification.decision,
  semanticConfigurationDigest,
  caseCount: DEVELOPMENT_CASES.length,
  cases: DEVELOPMENT_CASES.map((item) => classify(item.caseId)),
};
writeJson("development-r3i-checkpoint-inventory.json", checkpointInventory);

const callPlan = {
  campaign: "SEM-001R3I",
  generatedAt: new Date().toISOString(),
  mustPrecedeProviderExecution: true,
  configurationDecision: configurationVerification.decision,
  semanticConfigurationDigest,
  caseCount: 30,
  provider: "GOOGLE_GEMINI",
  model: MODEL_ID,
  concurrency: 1,
  maxRequestStartsPerRollingMinute: 5,
  required: {
    reconstructionOperations: 0,
    criticCases: 24,
    criticSuccessfulOperationsLow: 24,
    criticSuccessfulOperationsHigh: 48,
    conditionalAuditCasesPreauthorized: 0,
    conditionalAuditCasesMaximumAfterGenericActivation: 24,
    conditionalAuditSuccessfulOperationsLow: 0,
    conditionalAuditSuccessfulOperationsHigh: 48,
    deterministicCasePipelines: 25,
    deterministicStageExecutions: 125,
  },
  retryPolicy: { maximumAttemptsPerLlmOperation: 5, minimumTransientWaitMs: 60_000, retryAfterHasPriority: true, systemicCircuitBreaker: "3 independent exhausted operations with comparable provider failure" },
  callsAvoidedByCompatibleCache: 44,
  avoidedDetail: { reconstruction: 30, closedBaseCritic: 12, validConditionalAudits: 2 },
  consumptionEstimate: {
    successfulLlmOperationsLow: 24,
    successfulLlmOperationsHigh: 96,
    boundedRequestStartsLow: 24,
    boundedRequestStartsHighIncludingRetriesAndStructuredCorrections: 720,
    note: "The high bound is a safety bound, not a quota target; fail-closed provider classification and the generic audit gate prevent speculative consumption.",
  },
  holdout: { cases: 30, callsAuthorized: 0, status: "NOT_STARTED_FORBIDDEN" },
};
writeJson("development-r3i-call-plan.json", callPlan);

if (configurationVerification.decision !== "R3I_CONFIGURATION_VERIFIED") {
  writeJson("qualification-summary-r3i.json", { campaign: "SEM-001R3I", decision: "R3I_BLOCKED_BY_CONFIGURATION_DRIFT", development: "NOT_RUN", holdout: "NOT_STARTED_FORBIDDEN" });
  console.log(JSON.stringify({ decision: "R3I_BLOCKED_BY_CONFIGURATION_DRIFT", failedChecks: configurationChecks.filter((item) => !item.pass) }, null, 2));
  process.exit(4);
}
if (INVENTORY_ONLY) {
  console.log(JSON.stringify({ decision: "R3I_INVENTORY_AND_CALL_PLAN_COMPLETE", cases: 30, calls: callPlan.required, avoided: callPlan.callsAvoidedByCompatibleCache }, null, 2));
  process.exit(0);
}

const inventoryPath = path.join(DIRECTORY, "development-r3i-checkpoint-inventory.json");
const callPlanPath = path.join(DIRECTORY, "development-r3i-call-plan.json");
if (!exists(inventoryPath) || !exists(callPlanPath)) throw new Error("SEM001R3I_PRE_PROVIDER_PLAN_MISSING");
if (readJson<any>(inventoryPath).semanticConfigurationDigest !== semanticConfigurationDigest || readJson<any>(callPlanPath).semanticConfigurationDigest !== semanticConfigurationDigest) {
  throw new Error("SEM001R3I_PRE_PROVIDER_PLAN_CONFIGURATION_DRIFT");
}

const makeRequest = (fixture: SemanticCompetenceCase, base: any) => ({
  schemaVersion: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
  sessionId: `sem-001r3i:${fixture.caseId}`,
  language: "fr" as const,
  messages: fixture.turns.map((content, index): SemanticConversationMessage => ({
    messageId: `${fixture.caseId}:user:${index + 1}`,
    role: "USER",
    content,
    createdAt: `2026-08-12T19:${String(index).padStart(2, "0")}:00.000Z`,
  })),
  previousModel: fixture.turns.length > 1 ? base.semanticModel : null,
});

const makeModel = (request: ReturnType<typeof makeRequest>, candidate: any, critics: any[], metadata: any, base: any, callIds: string[] = [], attempts: any[] = []) =>
  verifySemanticModelWithKnowledge(canonicalizeSemanticReconstruction({
    request,
    candidate,
    critic: critics.at(-1),
    metadata,
    reconstructionCallId: base.operationTraces?.find((trace: any) => trace.operation === "RECONSTRUCTION")?.callId ?? "r3-reconstruction-reused",
    criticCallId: callIds.at(-1) ?? "r3i-critic-reused",
    criticCallIds: callIds,
    critics,
    reconstructionAttempts: [],
    criticAttempts: attempts,
  }));

const replayCriticCandidate = (base: any, prior: any, request: ReturnType<typeof makeRequest>) => {
  let candidate = structuredClone(base.reconstructionCandidate);
  const diagnostics: any[] = [];
  for (const critic of prior.critics) {
    if (!critic.proposedRepairs.length) continue;
    const applied = applyCriticRepairs(request, candidate, critic.proposedRepairs);
    if (applied.diagnostics.some((item) => item.status !== "ACCEPTED")) throw new Error(`SEM001R3I_CRITIC_REPLAY_DIVERGED:${prior.caseId}`);
    candidate = applied.candidate;
    diagnostics.push(...applied.diagnostics);
  }
  return { candidate, diagnostics };
};

const recomputeD21 = () => {
  const fixture = DEVELOPMENT_CASES.find((item) => item.caseId === "SEM-D21")!;
  const base = baseResults.find((item) => item.caseId === fixture.caseId)!;
  const prior = r3cResults.find((item) => item.caseId === fixture.caseId)!;
  const request = makeRequest(fixture, base);
  const replayed = replayCriticCandidate(base, prior, request);
  const audit = parseSemanticAtomicCompositionAudit(recoveredD21Audit.audit);
  const guarded = enforceAtomicCompositionAcceptanceConsistency(replayed.candidate, audit, request);
  const compiled = compileAtomicCompositionRepairs(request, replayed.candidate, guarded.audit);
  const applied = applyCriticRepairs(request, replayed.candidate, compiled.repairs);
  const postRepair = enforceAtomicCompositionAcceptanceConsistency(applied.candidate, audit, request);
  if (!guarded.changed || guarded.acceptAllowed || !compiled.repairs.length || applied.diagnostics.some((item) => item.status !== "ACCEPTED") || !postRepair.acceptAllowed) {
    throw new Error("SEM001R3I_D21_DETERMINISTIC_RECOMPUTE_FAILED");
  }
  const model = makeModel(request, applied.candidate, prior.critics, { provider: "GOOGLE_GEMINI", model: MODEL_ID, temperature: null }, base, prior.semanticModel.executionSnapshot?.criticCallIds ?? []);
  return {
    campaign: "SEM-001R3I", caseId: fixture.caseId, finalStatus: "COMPLETE", completionMode: "DETERMINISTIC_RECOMPUTE",
    semanticConfigurationDigest, reconstructionReused: true, baseCriticReused: true, conditionalAuditReused: true,
    auditActivation: { activated: true, reason: "R3H_CLOSED_TARGET_REPLAY_FROM_FIRST_DETERMINISTIC_INVALIDATION" },
    critics: prior.critics, operationTraces: [], replayedCriticDiagnostics: replayed.diagnostics,
    acceptanceDiagnostics: [...guarded.diagnostics, ...postRepair.diagnostics], compilationDiagnostics: compiled.diagnostics,
    repairDiagnostics: applied.diagnostics, semanticModel: model, metric: evaluateSemanticCase(fixture, model), completedAt: new Date().toISOString(), error: null,
  };
};

const seedClosedResults = () => DEVELOPMENT_CASES.filter((item) => CLOSED_IDS.has(item.caseId)).map((fixture) => {
  if (fixture.caseId === "SEM-D21") return recomputeD21();
  if (fixture.caseId === "SEM-D28") {
    const prior = r3hResults.find((item) => item.caseId === fixture.caseId);
    if (!prior?.semanticModel || prior.finalStatus !== "PASS") throw new Error("SEM001R3I_D28_CHECKPOINT_MISSING");
    return { ...prior, campaign: "SEM-001R3I", finalStatus: "COMPLETE", completionMode: "REUSE_COMPATIBLE", semanticConfigurationDigest, operationTraces: [], completedAt: prior.executedAt, error: null };
  }
  const prior = r3cResults.find((item) => item.caseId === fixture.caseId);
  if (!prior?.semanticModel || prior.finalStatus !== "COMPLETE") throw new Error(`SEM001R3I_CLOSED_CHECKPOINT_MISSING:${fixture.caseId}`);
  return { ...prior, campaign: "SEM-001R3I", completionMode: "REUSE_COMPATIBLE", semanticConfigurationDigest, operationTraces: [], error: null };
});

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

const priorResultsPath = path.join(DIRECTORY, "development-results.json");
let results: any[] = exists(priorResultsPath) ? readJson<any[]>(priorResultsPath).filter((item) => item.semanticConfigurationDigest === semanticConfigurationDigest && item.finalStatus === "COMPLETE") : [];
for (const seed of seedClosedResults()) if (!results.some((item) => item.caseId === seed.caseId)) results.push(seed);
const checkpointResults = () => {
  results.sort((left, right) => left.caseId.localeCompare(right.caseId));
  writeJson("development-results.json", results);
};
checkpointResults();

const environment = loadEnv("development", ROOT, "");
const apiKey = environment.GEMINI_API_KEY?.trim();
if (!apiKey) throw new Error("GEMINI_API_KEY_MISSING");
const diagnosticsPath = path.join(DIRECTORY, "provider-diagnostics-r3i.json");
const providerDiagnostics: any = exists(diagnosticsPath) ? readJson<any>(diagnosticsPath) : {
  campaign: "SEM-001R3I", provider: "GOOGLE_GEMINI", model: MODEL_ID, noSecretsStored: true,
  policy: { concurrency: 1, maxRequestStartsPerRollingMinute: 5, maxAttemptsPerOperation: 5, transientWaitMs: 60_000, structuredCorrections: "EXISTING_PROVIDER_CONTRACT_ONLY" },
  runs: [], attempts: [],
};
const statePath = path.join(DIRECTORY, "provider-run-state-r3i.json");
const priorState = exists(statePath) ? readJson<any>(statePath) : null;
const tracedStarts = providerDiagnostics.attempts.map((item: any) => item.startedAt).filter(Boolean);
const limiter = new RollingWindowRequestLimiter({
  maxRequests: 5, windowMs: 60_000, safetyMarginMs: 500,
  initialStarts: priorState?.limiter?.retainedStarts ?? tracedStarts,
  initialTotalStarts: Math.max(tracedStarts.length, priorState?.limiter?.totalStarts ?? 0),
});
const runId = `sem-001r3i-${new Date().toISOString().replace(/[:.]/g, "-")}`;
providerDiagnostics.runs.push({ runId, startedAt: new Date().toISOString(), pendingCaseIds: DEVELOPMENT_CASES.filter((item) => !CLOSED_IDS.has(item.caseId) && !results.some((result) => result.caseId === item.caseId)).map((item) => item.caseId) });
const checkpointDiagnostics = () => writeJson("provider-diagnostics-r3i.json", providerDiagnostics);
checkpointDiagnostics();
const onAttempt = (trace: R3cProviderAttemptTrace | R3dProviderAttemptTrace) => { providerDiagnostics.attempts.push({ runId, ...trace }); checkpointDiagnostics(); };
const baseProvider = new GeminiScientificSemanticProvider({ apiKey, model: MODEL_ID, timeoutMs: 90_000, maxAttempts: 1, beforeAttempt: () => limiter.acquire() });
const criticProvider = new R3cResilientSemanticProvider(baseProvider, { onAttempt });
const auditProvider = new R3dResilientAtomicCompositionProvider(baseProvider, { onAttempt });
const exhaustedComparableFailures = new Map<string, Set<string>>();
let stopForProvider = false;
let stopReason: string | null = null;
const comparableFailure = (category: string) => category === "RATE_LIMIT" ? "RATE_LIMIT" : ["SERVER_ERROR", "TIMEOUT", "NETWORK"].includes(category) ? "TRANSIENT_UNAVAILABLE" : category;

for (const fixture of DEVELOPMENT_CASES.filter((item) => !CLOSED_IDS.has(item.caseId))) {
  if (results.some((item) => item.caseId === fixture.caseId && item.finalStatus === "COMPLETE")) continue;
  const base = baseResults.find((item) => item.caseId === fixture.caseId);
  if (!base?.reconstructionCandidate) throw new Error(`SEM001R3I_RECONSTRUCTION_CHECKPOINT_MISSING:${fixture.caseId}`);
  const request = makeRequest(fixture, base);
  const startedAt = Date.now();
  const result: any = {
    campaign: "SEM-001R3I", caseId: fixture.caseId, finalStatus: "FAILED", completionMode: "LLM_CRITIC_THEN_DETERMINISTIC",
    semanticConfigurationDigest, reconstructionReused: true, baseCriticReused: false, conditionalAuditReused: false,
    operationTraces: [], critics: [], audits: [], repairDiagnostics: [], auditActivation: null,
    semanticModel: null, metric: null, completedAt: null, error: null,
  };
  try {
    const critique = await runSemanticCriticCycles(criticProvider, request, structuredClone(base.reconstructionCandidate));
    result.critics = critique.critics;
    result.repairDiagnostics = critique.repairDiagnostics;
    result.criticTerminalReason = critique.terminalReason;
    critique.critics.forEach((critic, index) => result.operationTraces.push({ operation: "CRITIC", cycle: index + 1, callId: critique.callIds[index], structuredDigest: logicalDigest(critic), attempts: critique.cycleAttempts[index] ?? [] }));
    if (!critique.accepted) throw new Error(`SEM001R3I_CRITIC_NOT_ACCEPTED:${critique.terminalReason}`);
    let finalCandidate = critique.candidate;
    result.auditActivation = genericAuditActivation(finalCandidate);
    if (result.auditActivation.activated) {
      const audited = await runSemanticAtomicCompositionCycles(auditProvider, request, finalCandidate);
      result.audits = audited.audits;
      result.auditTerminalReason = audited.terminalReason;
      result.acceptanceDiagnostics = audited.acceptanceDiagnostics;
      result.compilationDiagnostics = audited.compilationDiagnostics;
      result.repairDiagnostics.push(...audited.repairDiagnostics);
      audited.audits.forEach((audit, index) => result.operationTraces.push({ operation: "ATOMIC_COMPOSITION_AUDIT", cycle: index + 1, callId: audited.callIds[index], structuredDigest: logicalDigest(audit), attempts: audited.cycleAttempts[index] ?? [] }));
      if (!audited.accepted) throw new Error(`SEM001R3I_AUDIT_NOT_ACCEPTED:${audited.terminalReason}`);
      finalCandidate = audited.candidate;
    }
    const callIds = critique.callIds;
    const model = makeModel(request, finalCandidate, critique.critics, baseProvider.metadata, base, callIds, critique.attempts);
    result.semanticModel = model;
    result.metric = evaluateSemanticCase(fixture, model);
    result.finalStatus = "COMPLETE";
    result.completedAt = new Date().toISOString();
  } catch (caught) {
    if (caught instanceof SemanticProviderError) {
      const capacity = ["RATE_LIMIT", "SERVER_ERROR", "TIMEOUT", "NETWORK"].includes(caught.category);
      result.finalStatus = capacity ? "PROVIDER_CAPACITY_FAILURE" : "FAILED";
      result.error = {
        category: caught.category, httpStatus: caught.details?.httpStatus ?? null, providerStatus: caught.details?.providerStatus ?? null,
        providerErrorCode: caught.details?.providerCode ?? null, diagnostic: caught.diagnostic,
      };
      if (capacity) {
        const signature = comparableFailure(caught.category);
        const cases = exhaustedComparableFailures.get(signature) ?? new Set<string>();
        cases.add(fixture.caseId);
        exhaustedComparableFailures.set(signature, cases);
        if (cases.size >= 3) { stopForProvider = true; stopReason = `STOP_PROVIDER_CAPACITY:${signature}:3_INDEPENDENT_EXHAUSTED_OPERATIONS`; }
      } else if (caught.category === "QUOTA") { stopForProvider = true; stopReason = "DAILY_PROVIDER_CAPACITY_EXHAUSTED"; }
      else if (caught.category !== "INVALID_STRUCTURED_OUTPUT") { stopForProvider = true; stopReason = `NON_RETRYABLE_PROVIDER_FAILURE:${caught.category}`; }
    } else {
      result.error = { category: "SEMANTIC_PIPELINE_FAILURE", message: caught instanceof Error ? caught.message : "UNKNOWN" };
      if (result.error.message.includes("CRITIC_ACCEPT_INCONSISTENT_WITH_COVERAGE")) {
        result.deterministicCoverageAtDivergence = buildSemanticCoverage(request, structuredClone(base.reconstructionCandidate));
      }
    }
  }
  result.latencyMs = Date.now() - startedAt;
  results = [...results.filter((item) => item.caseId !== fixture.caseId), result];
  checkpointResults();
  writeJson("provider-run-state-r3i.json", { runId, semanticConfigurationDigest, limiter: limiter.snapshot(), stoppedForProvider: stopForProvider, stopReason, exhaustedComparableFailures: Object.fromEntries([...exhaustedComparableFailures].map(([key, value]) => [key, [...value]])) });
  console.log(`${fixture.caseId} ${result.finalStatus} critic=${result.critics.length} audit=${result.audits.length} starts=${limiter.snapshot().totalStarts}`);
  if (stopForProvider) break;
}

const currentRun = providerDiagnostics.runs.find((item: any) => item.runId === runId);
if (currentRun) { currentRun.completedAt = new Date().toISOString(); currentRun.stoppedForProvider = stopForProvider; currentRun.stopReason = stopReason; }
checkpointDiagnostics();
checkpointResults();

const completed = results.filter((item) => item.finalStatus === "COMPLETE" && item.semanticConfigurationDigest === semanticConfigurationDigest);
const providerAttempts = providerDiagnostics.attempts.filter((item: any) => item.runId === runId || item.campaign === "SEM-001R3I");
const actualRequestStarts = providerDiagnostics.attempts.length;
const actualLlmCalls = providerDiagnostics.attempts.filter((item: any) => item.category !== "NETWORK").length;
const retries = providerDiagnostics.attempts.filter((item: any) => item.finalDisposition === "RETRY_SCHEDULED").length;
const structuredRegenerations = providerDiagnostics.attempts.filter((item: any) => item.finalDisposition === "STRUCTURED_REGENERATION").length;
const developmentIncompleteCases = Math.max(0, 30 - completed.length);
const callsDeferred = stopForProvider
  ? DEVELOPMENT_CASES.filter((fixture) => !CLOSED_IDS.has(fixture.caseId) && !results.some((item) => item.caseId === fixture.caseId)).length
  : 0;
writeJson("llm-call-accounting-r3i.json", {
  campaign: "SEM-001R3I", provider: "GOOGLE_GEMINI", model: MODEL_ID, actualRequestStarts, actualLlmCalls,
  retries, structuredRegenerations, callsAvoidedByCompatibleCache: 44,
  avoidedDetail: { reconstruction: 30, closedBaseCritic: 12, validConditionalAudits: 2 },
  callsDeferredInDevelopment: callsDeferred, developmentIncompleteCases, holdoutCasesDeferred: 30, holdoutCalls: 0,
  conditionalAuditCasesActivated: results.filter((item) => item.auditActivation?.activated && !CLOSED_IDS.has(item.caseId)).map((item) => item.caseId),
  incidents: providerDiagnostics.attempts.filter((item: any) => item.finalDisposition !== "SUCCESS"),
  distinction: "Request starts, likely consumed LLM calls, retries, cache avoidance and Holdout deferral are reported separately.",
});

const thresholds = {
  criticalSemanticRecall: { operator: ">=", value: .98 }, explicitObjectRecall: { operator: ">=", value: .98 }, explicitRelationRecall: { operator: ">=", value: .95 },
  comparatorPreservation: { operator: "=", value: 1 }, interventionPreservation: { operator: "=", value: 1 }, modalityPreservation: { operator: "=", value: 1 },
  criticalUnsupportedInferenceRate: { operator: "=", value: 0 }, genericDomainCollapseRate: { operator: "=", value: 0 }, correctionPropagationRate: { operator: "=", value: 1 }, multiTurnCriticalContextLoss: { operator: "=", value: 0 },
};

const failureClass = (metric: SemanticCaseMetrics | null, error: any) => {
  if (error?.category === "INVALID_STRUCTURED_OUTPUT") return "STRUCTURED_OUTPUT_FAILURE";
  if (error?.category && ["RATE_LIMIT", "SERVER_ERROR", "TIMEOUT", "NETWORK", "QUOTA"].includes(error.category)) return "PROVIDER_FAILURE";
  if (error?.message?.includes("CRITIC")) return "CRITIC_FAILURE";
  if (error?.message?.includes("AUDIT")) return "COMPOSITION_FAILURE";
  if (!metric) return "UNKNOWN";
  if (metric.criticalUnsupportedInferenceCount > 0) return "POLARITY_FAILURE";
  if (metric.absoluteBlockers.some((item) => item.startsWith("RELATION_LOST"))) return "RELATION_COVERAGE_FAILURE";
  if (metric.absoluteBlockers.some((item) => item.startsWith("EXPLICIT_METHOD_LOST"))) return "COMPOSITION_FAILURE";
  if (metric.absoluteBlockers.some((item) => item.startsWith("EXPLICIT_"))) return "OBJECT_COVERAGE_FAILURE";
  if (!metric.routeCorrect) return "ROUTING_FAILURE";
  return "UNKNOWN";
};

if (completed.length !== 30) {
  const failures = DEVELOPMENT_CASES.filter((fixture) => !completed.some((item) => item.caseId === fixture.caseId)).map((fixture) => {
    const result = results.find((item) => item.caseId === fixture.caseId);
    return {
      caseId: fixture.caseId, metricFailure: result?.metric ?? null, absoluteBlocker: result?.metric?.absoluteBlockers ?? [],
      firstDivergentStage: result?.error?.category === "INVALID_STRUCTURED_OUTPUT" ? "LLM_STRUCTURED_OUTPUT" : result?.criticTerminalReason === "CRITIC_ACCEPT_INCONSISTENT_WITH_COVERAGE" ? "BASE_CRITIC_ACCEPTANCE_CONSISTENCY" : result?.critics?.length ? "CRITIC_OR_CONDITIONAL_AUDIT" : "LLM_CRITIC",
      failureClass: failureClass(result?.metric ?? null, result?.error), genericOrIsolated: developmentIncompleteCases === 1 ? "ISOLATED_1_OF_24_CURRENT_CRITICS" : "MULTIPLE_CURRENT_CRITIC_FAILURES",
      recommendedOwner: result?.error?.category === "INVALID_STRUCTURED_OUTPUT" ? "SEM_STRUCTURED_OUTPUT_CONTRACT" : result?.error?.category === "SEMANTIC_PIPELINE_FAILURE" ? "SEM_CRITIC_PROMPT_OR_ACCEPTANCE_CONTRACT" : result?.error?.category ? "SEM_PROVIDER" : "SEM_CRITIC_OR_COMPOSITION_OWNER",
      deterministicCoverageAtDivergence: result?.deterministicCoverageAtDivergence ?? null,
      error: result?.error ?? { category: "NOT_EXECUTED" },
    };
  });
  const decision = stopForProvider || failures.some((item) => item.failureClass === "PROVIDER_FAILURE") ? "R3I_BLOCKED_BY_PROVIDER" : "R3I_DEVELOPMENT_REQUIRES_FURTHER_REPAIR";
  writeJson("development-metrics-detailed-r3i.json", { status: "NOT_CALCULATED", complete: completed.length, required: 30, reason: "Official aggregate metrics require 30/30 configuration-compatible cases." });
  writeJson("development-failures-r3i.json", { campaign: "SEM-001R3I", decision, failures, disposition: "STOP_FOR_HUMAN_REVIEW" });
  writeJson("qualification-summary-r3i.json", { campaign: "SEM-001R3I", decision, development: `${completed.length}/30 COMPLETE`, llm: { actualLlmCalls, actualRequestStarts, retries, avoided: 44, deferred: callsDeferred }, holdout: "NOT_STARTED_FORBIDDEN" });
  console.log(JSON.stringify({ decision, development: `${completed.length}/30 COMPLETE`, failures }, null, 2));
  process.exit(decision === "R3I_BLOCKED_BY_PROVIDER" ? 3 : 2);
}

const models = new Map<string, ScientificSemanticModel>(completed.map((item) => [item.caseId, item.semanticModel]));
const aggregate = evaluateSemanticCampaign(DEVELOPMENT_CASES, models);
const caseMetrics = DEVELOPMENT_CASES.map((fixture) => evaluateSemanticCase(fixture, models.get(fixture.caseId)!));
const positiveMetric = (name: keyof SemanticCaseMetrics, selected = DEVELOPMENT_CASES) => {
  const ids = new Set(selected.map((item) => item.caseId));
  const values = caseMetrics.filter((item) => ids.has(item.caseId));
  const numerator = values.reduce((sum, item) => sum + Number(item[name]), 0);
  return { numerator, denominator: values.length, score: values.length ? numerator / values.length : 1, errorCases: values.filter((item) => Number(item[name]) !== 1).map((item) => item.caseId) };
};
const negativeMetric = (name: keyof SemanticCaseMetrics) => {
  const numerator = caseMetrics.reduce((sum, item) => sum + Number(item[name]), 0);
  return { numerator, denominator: caseMetrics.length, score: numerator / caseMetrics.length, errorCases: caseMetrics.filter((item) => Number(item[name]) !== 0).map((item) => item.caseId) };
};
const selectType = (type: string) => DEVELOPMENT_CASES.filter((fixture) => fixture.gold.requiredExplicitObjects.some((item) => item.type === type));
const correctionCases = DEVELOPMENT_CASES.filter((fixture) => fixture.gold.correction);
const multiTurnCases = DEVELOPMENT_CASES.filter((fixture) => fixture.turns.length > 1);
const detailedMetrics = {
  criticalSemanticRecall: positiveMetric("criticalSemanticRecall"), explicitObjectRecall: positiveMetric("explicitObjectRecall"), explicitRelationRecall: positiveMetric("explicitRelationRecall"),
  comparatorPreservation: positiveMetric("comparatorPreserved", selectType("COMPARATOR")), interventionPreservation: positiveMetric("interventionPreserved", selectType("INTERVENTION")), modalityPreservation: positiveMetric("modalityPreserved", selectType("MODALITY")),
  semanticDriftRate: negativeMetric("semanticDriftRate"), unsupportedInferenceRate: negativeMetric("unsupportedInferenceRate"), criticalUnsupportedInferenceRate: negativeMetric("criticalUnsupportedInferenceCount"),
  ellipsisDetectionRate: positiveMetric("ellipsisDetectionRate"), ambiguityPreservationRate: positiveMetric("ambiguityPreservationRate"), unnecessaryClarificationRate: negativeMetric("unnecessaryClarificationRate"),
  routeCorrectness: positiveMetric("routeCorrect"), correctionPropagationRate: positiveMetric("correctionPropagation", correctionCases), multiTurnContextPreservation: positiveMetric("multiTurnContextPreserved", multiTurnCases),
  genericDomainCollapseRate: negativeMetric("genericDomainCollapse"),
};
writeJson("development-metrics-detailed-r3i.json", { status: "CALCULATED_30_OF_30", aggregate, detailedMetrics, perCase: caseMetrics, thresholds });

const semanticFailures = caseMetrics.filter((metric) => metric.absoluteBlockers.length || metric.criticalUnsupportedInferenceCount > 0).map((metric) => ({
  caseId: metric.caseId, metricFailure: metric, absoluteBlocker: metric.absoluteBlockers,
  firstDivergentStage: metric.absoluteBlockers.some((item) => item.startsWith("RELATION_LOST")) ? "RELATION_COVERAGE" : "OBJECT_OR_COMPOSITION_COVERAGE",
  failureClass: failureClass(metric, null), genericOrIsolated: "ISOLATED_UNTIL_CROSS_CASE_REVIEW", recommendedOwner: "SEM_COVERAGE_OR_COMPOSITION_OWNER",
}));
if (!aggregate.passesSem001Thresholds) {
  writeJson("development-failures-r3i.json", { campaign: "SEM-001R3I", decision: "R3I_DEVELOPMENT_REQUIRES_FURTHER_REPAIR", failures: semanticFailures, disposition: "STOP_FOR_HUMAN_REVIEW" });
  writeJson("qualification-summary-r3i.json", { campaign: "SEM-001R3I", decision: "R3I_DEVELOPMENT_REQUIRES_FURTHER_REPAIR", development: "30/30 COMPLETE", aggregate, llm: { actualLlmCalls, actualRequestStarts, retries, avoided: 44, deferred: 0 }, holdout: "NOT_STARTED_FORBIDDEN" });
  console.log(JSON.stringify({ decision: "R3I_DEVELOPMENT_REQUIRES_FURTHER_REPAIR", development: "30/30 COMPLETE", aggregate, failures: semanticFailures }, null, 2));
  process.exit(2);
}

writeJson("development-freeze-candidate.json", {
  campaign: "SEM-001R3I", status: "PROPOSED_NOT_ACTIVATED", createdAt: new Date().toISOString(), decisionBasis: "30/30 Development COMPLETE and unchanged SEM-001 thresholds passed",
  modelId: MODEL_ID, versions: { reconstructionPrompt: SEMANTIC_RECONSTRUCTION_PROMPT_VERSION, criticPrompt: SEMANTIC_CRITIC_PROMPT_VERSION, semanticSchema: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION, canonicalModel: SCIENTIFIC_SEMANTIC_MODEL_VERSION },
  digests: currentDigests, thresholds, aggregateMetricsDigest: logicalDigest(aggregate), detailedMetricsDigest: logicalDigest(detailedMetrics), semanticConfigurationDigest,
  development: { cases: 30, status: "COMPLETE", resultDigest: logicalDigest(results.map((item) => ({ caseId: item.caseId, semanticModelDigest: item.semanticModel.digest, metric: item.metric }))) },
  holdout: { cases: 30, status: "NOT_STARTED_FORBIDDEN", executionEvidence: null, humanAuthorizationRequired: true },
});
writeJson("qualification-summary-r3i.json", {
  campaign: "SEM-001R3I", decision: "R3I_DEVELOPMENT_GATE_PASSED_READY_FOR_HOLDOUT_AUTHORIZATION", development: "30/30 COMPLETE", aggregate, detailedMetrics,
  llm: { actualLlmCalls, actualRequestStarts, retries, structuredRegenerations, avoided: 44, deferredDevelopment: 0, deferredHoldoutCases: 30 },
  providerIncidents: providerDiagnostics.attempts.filter((item: any) => item.finalDisposition !== "SUCCESS"), holdout: "NOT_STARTED_FORBIDDEN", freezeCandidate: "development-freeze-candidate.json",
});
console.log(JSON.stringify({ decision: "R3I_DEVELOPMENT_GATE_PASSED_READY_FOR_HOLDOUT_AUTHORIZATION", development: "30/30 COMPLETE", aggregate, llm: { actualLlmCalls, actualRequestStarts, retries, avoided: 44 }, holdout: "NOT_STARTED_FORBIDDEN" }, null, 2));
