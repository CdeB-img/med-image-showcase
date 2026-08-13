/* eslint-disable @typescript-eslint/no-explicit-any */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnv } from "vite";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { SCIENTIFIC_SEMANTIC_ATOMIC_COMPOSITION_AUDIT_PROMPT } from "../../../../api/prompts/scientific-semantic-atomic-composition-prompt";
import { SCIENTIFIC_SEMANTIC_CRITIC_PROMPT, SCIENTIFIC_SEMANTIC_RECONSTRUCTION_PROMPT } from "../../../../api/prompts/scientific-semantic-reconstruction-prompt";
import { canonicalizeSemanticReconstruction } from "../canonical";
import {
  compileAtomicCompositionRepairs,
  enforceAtomicCompositionAcceptanceConsistency,
  parseSemanticAtomicCompositionAudit,
  SEMANTIC_ATOMIC_COMPOSITION_AUDIT_JSON_SCHEMA,
} from "../atomic-composition";
import { evaluateSemanticCase } from "../competence";
import { DEVELOPMENT_CASES } from "../competence-fixtures";
import { applyCriticRepairs } from "../coverage";
import { verifySemanticModelWithKnowledge } from "../knowledge";
import { GeminiScientificSemanticProvider, SemanticProviderError } from "../provider";
import { SEMANTIC_CRITIC_JSON_SCHEMA, SEMANTIC_RECONSTRUCTION_JSON_SCHEMA } from "../schema";
import { SCIENTIFIC_SEMANTIC_SCHEMA_VERSION, type SemanticConversationMessage } from "../types";
import { RollingWindowRequestLimiter } from "./rolling-rate-limiter";

const ROOT = process.cwd();
const BASE_DIRECTORY = path.resolve(ROOT, "semantic-validation/sem-001r3");
const DIRECTORY = path.resolve(ROOT, "semantic-validation/sem-001r3b");
const MODEL_ID = "gemini-3.5-flash-lite";
const VERIFY_ONLY = process.argv.includes("--verify-only");
const REPLAY_PRIMARY = process.argv.includes("--replay-primary-target");
const RUN_SECONDARY = process.argv.includes("--secondary-target");
if ([VERIFY_ONLY, REPLAY_PRIMARY, RUN_SECONDARY].filter(Boolean).length !== 1) throw new Error("SEM001R3G_EXACTLY_ONE_PHASE_REQUIRED");

const readJson = <T>(target: string): T => JSON.parse(readFileSync(target, "utf8")) as T;
const writeJson = (name: string, value: unknown) => {
  mkdirSync(DIRECTORY, { recursive: true });
  const target = path.join(DIRECTORY, name);
  const temporary = target + ".tmp";
  writeFileSync(temporary, JSON.stringify(value, null, 2) + "\n", { encoding: "utf8", mode: 0o600 });
  renameSync(temporary, target);
};
const exists = (target: string) => { try { readFileSync(target); return true; } catch { return false; } };

const baseResults = readJson<any[]>(path.join(BASE_DIRECTORY, "development-results.json"));
const r3cResults = readJson<any[]>(path.join(DIRECTORY, "live-critic-results.json"));
const r3eInvalidation = readJson<any>(path.join(DIRECTORY, "stage-invalidation-r3e.json"));
const r3fConfiguration = readJson<any>(path.join(DIRECTORY, "configuration-verification-r3f.json"));
const recoveredAuditArtifact = readJson<any>(path.join(DIRECTORY, "recovered-valid-audit-r3e.json"));
const targetIds = Array.from(new Set<string>(
  (r3eInvalidation.rows as any[]).flatMap((row: any): unknown[] => Array.isArray(row.affectedCases) ? row.affectedCases : [])
    .filter((caseId: unknown): caseId is string => typeof caseId === "string" && DEVELOPMENT_CASES.some((fixture) => fixture.caseId === caseId)),
));
const primaryTargetId = recoveredAuditArtifact.caseId as string;
const secondaryTargetId = targetIds.find((caseId) => caseId !== primaryTargetId);
if (!secondaryTargetId) throw new Error("SEM001R3G_SECONDARY_TARGET_NOT_DISCOVERED");

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
  providerTransportSchema: logicalDigest(SEMANTIC_ATOMIC_COMPOSITION_AUDIT_JSON_SCHEMA),
  atomicClassificationOwner: logicalDigest(readFileSync(path.resolve(ROOT, "src/features/scientific-semantic-reconstruction/atomic-composition.ts"), "utf8")),
};
const goldFramesUnchanged = baseResults.length === 30 && baseResults.every((base) =>
  DEVELOPMENT_CASES.some((fixture) => fixture.caseId === base.caseId && logicalDigest(fixture.gold) === base.goldFrameDigest));
const checks = [
  ["reconstructionPrompt", r3fConfiguration.currentDigests.reconstructionPrompt, currentDigests.reconstructionPrompt],
  ["criticPrompt", r3fConfiguration.currentDigests.criticPrompt, currentDigests.criticPrompt],
  ["baseProviderSchema", r3fConfiguration.currentDigests.baseProviderSchema, currentDigests.baseProviderSchema],
  ["canonicalizer", r3fConfiguration.currentDigests.canonicalizer, currentDigests.canonicalizer],
  ["coverageAndRepair", r3fConfiguration.currentDigests.coverageAndRepair, currentDigests.coverageAndRepair],
  ["evaluator", r3fConfiguration.currentDigests.evaluator, currentDigests.evaluator],
  ["developmentCorpus", r3fConfiguration.currentDigests.developmentCorpus, currentDigests.developmentCorpus],
  ["developmentGold", r3fConfiguration.currentDigests.developmentGold, currentDigests.developmentGold],
  ["atomicCompositionPrompt", r3fConfiguration.currentDigests.atomicCompositionPrompt, currentDigests.atomicCompositionPrompt],
  ["providerTransportSchema", r3fConfiguration.currentDigests.providerTransportSchema, currentDigests.providerTransportSchema],
].map(([contract, expected, observed]) => ({ contract, expected, observed, pass: expected === observed }));
checks.push({ contract: "developmentGoldFrames", expected: "30 unchanged", observed: goldFramesUnchanged ? "30 unchanged" : "DRIFT", pass: goldFramesUnchanged });
checks.push({
  contract: "atomicClassificationOwner",
  expected: "changed from R3F owner",
  observed: currentDigests.atomicClassificationOwner,
  pass: currentDigests.atomicClassificationOwner !== r3fConfiguration.currentDigests.acceptanceGuardOwner,
});
checks.push({
  contract: "recoveredPrimaryAudit",
  expected: "schema-valid reusable audit",
  observed: recoveredAuditArtifact.audit?.auditId ?? "MISSING",
  pass: Boolean(parseSemanticAtomicCompositionAudit(recoveredAuditArtifact.audit)),
});
const configuration = {
  campaign: "SEM-001R3G", verifiedAt: new Date().toISOString(),
  decision: checks.every((item) => item.pass) ? "R3G_CONFIGURATION_VERIFIED" : "STOP_CONFIGURATION_DRIFT",
  allowedMutation: "ATOMIC_AUDIT_TO_CANONICAL_CLASSIFICATION_OWNER_ONLY", currentDigests, checks,
};
writeJson("configuration-verification-r3g.json", configuration);
writeJson("stage-invalidation-r3g.json", {
  campaign: "SEM-001R3G",
  rule: "Only canonical interpretation of source-grounded atomic findings and deterministic downstream products are invalidated.",
  rows: [
    { stage: "RECONSTRUCTION", affectedCases: "none", llmRequired: false, disposition: "30_COMPLETE_REUSED" },
    { stage: "BASE_CRITIC_1_3", affectedCases: "none", llmRequired: false, disposition: "12_COMPLETE_REUSED" },
    { stage: "PRIMARY_ATOMIC_AUDIT", affectedCases: [primaryTargetId], llmRequired: false, disposition: "VALID_R3E_AUDIT_REUSED" },
    { stage: "AUDIT_TO_CANONICAL_CLASSIFICATION", beforeDigest: r3fConfiguration.currentDigests.acceptanceGuardOwner, afterDigest: currentDigests.atomicClassificationOwner, affectedCases: [primaryTargetId, secondaryTargetId], llmRequired: false, disposition: "GENERIC_OWNER_REPAIRED" },
    { stage: "PRIMARY_DOWNSTREAM", affectedCases: [primaryTargetId], llmRequired: false, disposition: REPLAY_PRIMARY ? "REPLAYED_FROM_FIRST_INVALIDATED_STAGE" : "PENDING_OR_COMPLETE" },
    { stage: "SECONDARY_ATOMIC_AUDIT", affectedCases: [secondaryTargetId], llmRequired: true, maximumCalls: 1, disposition: RUN_SECONDARY ? "ONE_TARGETED_EXECUTION" : "GATE_CLOSED_UNTIL_PRIMARY_PASS" },
    { stage: "REMAINING_DEVELOPMENT", affectedCases: "24 cases", llmRequired: false, disposition: "NOT_AUTHORIZED" },
    { stage: "HOLDOUT", affectedCases: "30 cases", llmRequired: false, disposition: "NOT_STARTED_FORBIDDEN" },
  ],
});
if (configuration.decision !== "R3G_CONFIGURATION_VERIFIED") throw new Error("SEM001R3G_CONFIGURATION_DRIFT_STOP");
if (VERIFY_ONLY) {
  console.log(JSON.stringify({ decision: configuration.decision, targets: { primaryTargetId, secondaryTargetId }, checks }, null, 2));
  process.exit(0);
}

const makeState = (caseId: string) => {
  const fixture = DEVELOPMENT_CASES.find((item) => item.caseId === caseId);
  const base = baseResults.find((item) => item.caseId === caseId);
  const prior = r3cResults.find((item) => item.caseId === caseId && item.finalStatus === "COMPLETE");
  if (!fixture || !base?.reconstructionCandidate || !prior?.semanticModel || !prior?.critics?.length) throw new Error("SEM001R3G_COMPATIBLE_CHECKPOINT_MISSING:" + caseId);
  const request = {
    schemaVersion: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION, sessionId: "sem-001r3g:" + caseId, language: "fr" as const, previousModel: null,
    messages: fixture.turns.map((content, index): SemanticConversationMessage => ({
      messageId: caseId + ":user:" + (index + 1), role: "USER", content,
      createdAt: "2026-08-12T17:" + String(index).padStart(2, "0") + ":00.000Z",
    })),
  };
  let candidate = structuredClone(base.reconstructionCandidate);
  const replayedCriticDiagnostics: any[] = [];
  for (const critic of prior.critics) {
    if (!critic.proposedRepairs.length) continue;
    const applied = applyCriticRepairs(request, candidate, critic.proposedRepairs);
    if (applied.diagnostics.some((item) => item.status !== "ACCEPTED")) throw new Error("SEM001R3G_R3C_REPAIR_REPLAY_DIVERGED:" + caseId);
    candidate = applied.candidate;
    replayedCriticDiagnostics.push(...applied.diagnostics);
  }
  return { fixture, prior, request, candidate, replayedCriticDiagnostics };
};
const makeModel = (state: ReturnType<typeof makeState>, candidate: any, metadata = { provider: "GOOGLE_GEMINI", model: MODEL_ID, temperature: null }) => {
  const snapshot = state.prior.semanticModel.executionSnapshot;
  return verifySemanticModelWithKnowledge(canonicalizeSemanticReconstruction({
    request: state.request, candidate, critic: state.prior.critics.at(-1), metadata,
    reconstructionCallId: snapshot?.reconstructionCallId ?? "r3-reconstruction-reused",
    criticCallId: snapshot?.criticCallId ?? "r3c-critic-reused",
    criticCallIds: snapshot?.criticCallIds ?? [], critics: state.prior.critics,
    reconstructionAttempts: snapshot?.reconstructionAttempts ?? [], criticAttempts: snapshot?.criticAttempts ?? [],
  }));
};
const primaryGate = (metric: any) => metric.explicitObjectRecall === 1 && metric.explicitRelationRecall === 1
  && metric.criticalSemanticRecall === 1 && metric.absoluteBlockers.length === 0 && metric.criticalUnsupportedInferenceCount === 0;
const secondaryGate = (metric: any) => metric.explicitObjectRecall === 1 && metric.criticalSemanticRecall === 1
  && metric.absoluteBlockers.length === 0 && metric.criticalUnsupportedInferenceCount === 0 && metric.routeCorrect === true;
const resultsPath = path.join(DIRECTORY, "targeted-r3g-results.json");
let results = exists(resultsPath) ? readJson<any[]>(resultsPath) : [];
const baseCriticCalls = r3cResults.reduce((total, item) => total + (item.critics?.length ?? 0), 0);
const avoidedCalls = baseResults.length + baseCriticCalls + 1;

if (REPLAY_PRIMARY) {
  const state = makeState(primaryTargetId);
  const originalAudit = parseSemanticAtomicCompositionAudit(recoveredAuditArtifact.audit);
  const guarded = enforceAtomicCompositionAcceptanceConsistency(state.candidate, originalAudit);
  const compiled = compileAtomicCompositionRepairs(state.request, state.candidate, guarded.audit);
  const applied = applyCriticRepairs(state.request, state.candidate, compiled.repairs);
  if (!guarded.changed || guarded.acceptAllowed || !compiled.repairs.length || applied.diagnostics.some((item) => item.status !== "ACCEPTED")) throw new Error("SEM001R3G_PRIMARY_REPAIR_REJECTED");
  const postRepair = enforceAtomicCompositionAcceptanceConsistency(applied.candidate, originalAudit);
  const semanticModel = makeModel(state, applied.candidate);
  const metric = evaluateSemanticCase(state.fixture, semanticModel);
  const pass = postRepair.acceptAllowed && primaryGate(metric);
  const aggregateId = originalAudit.atomicityReports[0].subjectInventoryItemIds[0];
  const result = {
    campaign: "SEM-001R3G", caseId: primaryTargetId, executedAt: new Date().toISOString(), finalStatus: pass ? "PASS" : "FAIL",
    firstInvalidatedStage: "AUDIT_TO_CANONICAL_CLASSIFICATION", llmCalls: 0,
    reused: { reconstruction: true, baseCritic: true, validAtomicAudit: true },
    originalAudit, guardedAudit: guarded.audit, acceptanceDiagnostics: [...guarded.diagnostics, ...postRepair.diagnostics],
    classificationDiagnostics: compiled.classifications, compilationDiagnostics: compiled.diagnostics,
    replayedCriticDiagnostics: state.replayedCriticDiagnostics, repairDiagnostics: applied.diagnostics,
    aggregatePreserved: logicalDigest(state.candidate.semanticInventory.explicitFragments.find((item: any) => item.inventoryItemId === aggregateId))
      === logicalDigest(applied.candidate.semanticInventory.explicitFragments.find((item: any) => item.inventoryItemId === aggregateId)),
    semanticModel, metric,
  };
  results = [...results.filter((item) => item.caseId !== primaryTargetId), result].sort((left, right) => left.caseId.localeCompare(right.caseId));
  writeJson("targeted-r3g-results.json", results);
  const decision = pass ? "R3G_D21_GATE_PASSED_D28_AUTHORIZED" : "R3G_ATOMIC_CLASSIFICATION_REQUIRES_FURTHER_WORK";
  writeJson("targeted-r3g-gate-decision.json", {
    campaign: "SEM-001R3G", decision, primary: { caseId: primaryTargetId, status: result.finalStatus, metric },
    secondary: { caseId: secondaryTargetId, status: pass ? "AUTHORIZED_NOT_RUN" : "NOT_RUN_GATE_CLOSED" },
    remainingDevelopment: "NOT_AUTHORIZED", holdout: "NOT_STARTED_FORBIDDEN",
  });
  writeJson("llm-call-accounting-r3g.json", {
    campaign: "SEM-001R3G", actualLlmCalls: 0, callsAvoidedByCompatibleReuse: avoidedCalls,
    avoidedDetail: { reconstruction: baseResults.length, baseCritic: baseCriticCalls, validPrimaryAudit: 1 },
    providerRetries: 0, structuredRegenerations: 0, secondaryAudit: pass ? "AUTHORIZED_NOT_RUN" : "NOT_RUN_GATE_CLOSED", holdoutCalls: 0,
  });
  writeJson("qualification-summary-r3g.json", {
    campaign: "SEM-001R3G", decision, primary: result.finalStatus, secondary: pass ? "AUTHORIZED_NOT_RUN" : "NOT_RUN_GATE_CLOSED",
    llm: { actualCalls: 0, callsAvoided: avoidedCalls }, holdout: "NOT_STARTED_FORBIDDEN",
  });
  console.log(JSON.stringify({ decision, caseId: primaryTargetId, metric, aggregatePreserved: result.aggregatePreserved, postRepairAuditAccepted: postRepair.acceptAllowed, llm: { actualCalls: 0, callsAvoided: avoidedCalls }, nextGate: pass ? "RUN_SECONDARY_TARGET_ONCE" : "STOP" }, null, 2));
  process.exit(pass ? 0 : 2);
}

const primary = results.find((item) => item.caseId === primaryTargetId);
if (!primary || primary.finalStatus !== "PASS" || !primaryGate(primary.metric)) throw new Error("SEM001R3G_SECONDARY_GATE_CLOSED");
if (results.some((item) => item.caseId === secondaryTargetId)) throw new Error("SEM001R3G_SECONDARY_ALREADY_EXECUTED");
const state = makeState(secondaryTargetId);
const environment = loadEnv("development", ROOT, "");
const apiKey = environment.GEMINI_API_KEY?.trim();
if (!apiKey) throw new Error("GEMINI_API_KEY_MISSING");
const limiter = new RollingWindowRequestLimiter({ maxRequests: 5, windowMs: 60_000, safetyMarginMs: 500 });
const provider = new GeminiScientificSemanticProvider({ apiKey, model: MODEL_ID, timeoutMs: 90_000, maxAttempts: 1, beforeAttempt: () => limiter.acquire() });
const traces: any[] = [];
const result: any = {
  campaign: "SEM-001R3G", caseId: secondaryTargetId, executedAt: new Date().toISOString(), finalStatus: "FAILED",
  firstInvalidatedStage: "CONDITIONAL_ATOMIC_COMPOSITION_AUDIT", llmCalls: 0,
  reused: { reconstruction: true, baseCritic: true }, audit: null, error: null,
};
try {
  const audited = await provider.auditAtomicComposition(state.request, state.candidate, 1);
  const attempts = audited.attempts ?? [];
  result.llmCalls = attempts.length || 1;
  traces.push(...(attempts.length ? attempts : [{ attempt: 1, requestStarted: result.executedAt, requestFinished: new Date().toISOString(), httpStatus: 200, providerStatus: null, providerCode: null }]));
  const guarded = enforceAtomicCompositionAcceptanceConsistency(state.candidate, audited.audit);
  result.audit = audited.audit;
  result.guardedAudit = guarded.audit;
  result.callId = audited.callId;
  result.acceptanceDiagnostics = guarded.diagnostics;
  let candidateAfterAudit = state.candidate;
  if (!guarded.acceptAllowed) {
    if (guarded.audit.verdict === "CLARIFICATION_REQUIRED") throw new Error("SEM001R3G_SECONDARY_CLARIFICATION_REQUIRED");
    const compiled = compileAtomicCompositionRepairs(state.request, candidateAfterAudit, guarded.audit);
    result.classificationDiagnostics = compiled.classifications;
    result.compilationDiagnostics = compiled.diagnostics;
    const applied = applyCriticRepairs(state.request, candidateAfterAudit, compiled.repairs);
    result.repairDiagnostics = applied.diagnostics;
    if (!compiled.repairs.length || applied.diagnostics.some((item) => item.status !== "ACCEPTED")) throw new Error("SEM001R3G_SECONDARY_REPAIR_REJECTED");
    candidateAfterAudit = applied.candidate;
  }
  const semanticModel = makeModel(state, candidateAfterAudit, provider.metadata);
  const metric = evaluateSemanticCase(state.fixture, semanticModel);
  result.semanticModel = semanticModel;
  result.metric = metric;
  result.finalStatus = secondaryGate(metric) ? "PASS" : "FAIL";
} catch (caught) {
  if (caught instanceof SemanticProviderError) {
    result.llmCalls = caught.attempts.length || 1;
    traces.push(...caught.attempts);
    result.error = {
      category: caught.category, httpStatus: caught.details?.httpStatus ?? null,
      providerStatus: caught.details?.providerStatus ?? null, providerErrorCode: caught.details?.providerCode ?? null,
      validationIssues: caught.diagnostic?.validationIssues ?? [],
    };
  } else {
    result.error = { category: "SEMANTIC_PIPELINE_FAILURE", message: caught instanceof Error ? caught.message : "UNKNOWN" };
  }
}
writeJson("provider-attempts-r3g.json", traces.map((attempt, index) => ({
  caseId: secondaryTargetId, stage: "ATOMIC_COMPOSITION_AUDIT", attempt: index + 1,
  startedAt: attempt.requestStarted ?? result.executedAt, providerStatus: attempt.providerStatus ?? null,
  httpStatus: attempt.httpStatus ?? null, providerErrorCode: attempt.providerCode ?? null,
  waitDuration: 0, finalDisposition: result.finalStatus === "PASS" || result.finalStatus === "FAIL" ? "SUCCESS" : "SINGLE_ATTEMPT_FAILURE",
})));
results = [...results, result].sort((left, right) => left.caseId.localeCompare(right.caseId));
writeJson("targeted-r3g-results.json", results);
const secondaryPass = result.finalStatus === "PASS" && secondaryGate(result.metric);
const decision = secondaryPass ? "R3G_TARGETED_SEMANTIC_REPAIR_PASSED" : "R3G_PRIMARY_GATE_PASSED_SECONDARY_REPAIR_REQUIRED";
const actualLlmCalls = results.reduce((total, item) => total + (item.llmCalls ?? 0), 0);
writeJson("targeted-r3g-gate-decision.json", {
  campaign: "SEM-001R3G", decision,
  primary: { caseId: primaryTargetId, status: primary.finalStatus, metric: primary.metric },
  secondary: { caseId: secondaryTargetId, status: result.finalStatus, metric: result.metric ?? null, error: result.error },
  remainingDevelopment: "NOT_AUTHORIZED", holdout: "NOT_STARTED_FORBIDDEN",
});
writeJson("llm-call-accounting-r3g.json", {
  campaign: "SEM-001R3G", actualLlmCalls, callsAvoidedByCompatibleReuse: avoidedCalls,
  avoidedDetail: { reconstruction: baseResults.length, baseCritic: baseCriticCalls, validPrimaryAudit: 1 },
  providerRetries: 0, structuredRegenerations: 0, secondaryAudit: "EXECUTED_ONCE", holdoutCalls: 0,
});
writeJson("qualification-summary-r3g.json", {
  campaign: "SEM-001R3G", decision, primary: primary.finalStatus, secondary: result.finalStatus,
  llm: { actualCalls: actualLlmCalls, callsAvoided: avoidedCalls, retries: 0 },
  holdout: "NOT_STARTED_FORBIDDEN", remainingDevelopment: "24_NOT_AUTHORIZED",
});
console.log(JSON.stringify({
  decision, primary: { caseId: primaryTargetId, metric: primary.metric },
  secondary: { caseId: secondaryTargetId, finalStatus: result.finalStatus, metric: result.metric ?? null, error: result.error },
  llm: { actualCalls: actualLlmCalls, callsAvoided: avoidedCalls }, nextGate: "STOP",
}, null, 2));
process.exit(secondaryPass ? 0 : 3);
