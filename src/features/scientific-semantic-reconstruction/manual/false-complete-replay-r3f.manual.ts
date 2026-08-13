/* eslint-disable @typescript-eslint/no-explicit-any */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { SCIENTIFIC_SEMANTIC_ATOMIC_COMPOSITION_AUDIT_PROMPT } from "../../../../api/prompts/scientific-semantic-atomic-composition-prompt";
import { SCIENTIFIC_SEMANTIC_CRITIC_PROMPT, SCIENTIFIC_SEMANTIC_RECONSTRUCTION_PROMPT } from "../../../../api/prompts/scientific-semantic-reconstruction-prompt";
import { canonicalizeSemanticReconstruction } from "../canonical";
import {
  compileAtomicCompositionRepairs,
  enforceAtomicCompositionAcceptanceConsistency,
  parseSemanticAtomicCompositionAudit,
  SEMANTIC_ATOMIC_COMPOSITION_ACCEPTANCE_GUARD_VERSION,
  SEMANTIC_ATOMIC_COMPOSITION_AUDIT_JSON_SCHEMA,
} from "../atomic-composition";
import { evaluateSemanticCase } from "../competence";
import { DEVELOPMENT_CASES } from "../competence-fixtures";
import { applyCriticRepairs } from "../coverage";
import { verifySemanticModelWithKnowledge } from "../knowledge";
import { SEMANTIC_CRITIC_JSON_SCHEMA, SEMANTIC_RECONSTRUCTION_JSON_SCHEMA } from "../schema";
import { SCIENTIFIC_SEMANTIC_SCHEMA_VERSION, type SemanticConversationMessage } from "../types";

const ROOT = process.cwd();
const BASE_DIRECTORY = path.resolve(ROOT, "semantic-validation/sem-001r3");
const DIRECTORY = path.resolve(ROOT, "semantic-validation/sem-001r3b");
const VERIFY_ONLY = process.argv.includes("--verify-only");
const REPLAY_PRIMARY_TARGET = process.argv.includes("--replay-primary-target");
if (VERIFY_ONLY === REPLAY_PRIMARY_TARGET) throw new Error("SEM001R3F_EXACTLY_ONE_PHASE_REQUIRED");

const readJson = <T>(target: string): T => JSON.parse(readFileSync(target, "utf8")) as T;
const writeJson = (name: string, value: unknown) => {
  mkdirSync(DIRECTORY, { recursive: true });
  const target = path.join(DIRECTORY, name);
  const temporary = `${target}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  renameSync(temporary, target);
};

const baseResults = readJson<any[]>(path.join(BASE_DIRECTORY, "development-results.json"));
const r3cResults = readJson<any[]>(path.join(DIRECTORY, "live-critic-results.json"));
const r3eConfiguration = readJson<any>(path.join(DIRECTORY, "configuration-verification-r3e.json"));
const r3eInvalidation = readJson<any>(path.join(DIRECTORY, "stage-invalidation-r3e.json"));
const recoveredR3e = readJson<any>(path.join(DIRECTORY, "recovered-valid-audit-r3e.json"));
const successfulAttempt = readJson<any[]>(path.join(DIRECTORY, "provider-attempts-r3e.json"));
const targetedCaseIds = Array.from(new Set<string>(
  (r3eInvalidation.rows as any[]).flatMap((row: any): unknown[] => Array.isArray(row.affectedCases) ? row.affectedCases : [])
    .filter((caseId: unknown): caseId is string => typeof caseId === "string" && DEVELOPMENT_CASES.some((fixture) => fixture.caseId === caseId)),
));
const secondaryTargetCaseId = targetedCaseIds.find((caseId) => caseId !== recoveredR3e.caseId);
if (!secondaryTargetCaseId) throw new Error("SEM001R3F_SECONDARY_TARGET_NOT_DISCOVERED");
const verifiedSecondaryTargetCaseId: string = secondaryTargetCaseId;
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
  acceptanceGuardOwner: logicalDigest(readFileSync(path.resolve(ROOT, "src/features/scientific-semantic-reconstruction/atomic-composition.ts"), "utf8")),
};
const goldFramesUnchanged = baseResults.length === 30 && baseResults.every((base) => DEVELOPMENT_CASES.some((fixture) => fixture.caseId === base.caseId && logicalDigest(fixture.gold) === base.goldFrameDigest));
const successfulPrimaryAttempt = successfulAttempt.find((item) => item.caseId === recoveredR3e.caseId && item.httpStatus === 200 && item.finalDisposition === "SUCCESS");
const checks = [
  ["reconstructionPrompt", r3eConfiguration.currentDigests.reconstructionPrompt, currentDigests.reconstructionPrompt],
  ["criticPrompt", r3eConfiguration.currentDigests.criticPrompt, currentDigests.criticPrompt],
  ["baseProviderSchema", r3eConfiguration.currentDigests.baseProviderSchema, currentDigests.baseProviderSchema],
  ["canonicalizer", r3eConfiguration.currentDigests.canonicalizer, currentDigests.canonicalizer],
  ["coverageAndRepair", r3eConfiguration.currentDigests.coverageAndRepair, currentDigests.coverageAndRepair],
  ["evaluator", r3eConfiguration.currentDigests.evaluator, currentDigests.evaluator],
  ["developmentCorpus", r3eConfiguration.currentDigests.developmentCorpus, currentDigests.developmentCorpus],
  ["developmentGold", r3eConfiguration.currentDigests.developmentGold, currentDigests.developmentGold],
  ["atomicCompositionPrompt", r3eConfiguration.currentDigests.atomicCompositionPrompt, currentDigests.atomicCompositionPrompt],
  ["providerTransportSchema", r3eConfiguration.currentDigests.providerTransportSchema, currentDigests.providerTransportSchema],
].map(([contract, expected, observed]) => ({ contract, expected, observed, pass: expected === observed }));
checks.push({ contract: "developmentGoldFrames", expected: "30 unchanged", observed: goldFramesUnchanged ? "30 unchanged" : "DRIFT", pass: goldFramesUnchanged });
checks.push({ contract: "recoveredR3eAudit", expected: "schema-valid audit with matching HTTP 200 trace", observed: successfulPrimaryAttempt ? recoveredR3e.audit.auditId : "MISSING", pass: Boolean(successfulPrimaryAttempt && parseSemanticAtomicCompositionAudit(recoveredR3e.audit)) });
const configuration = {
  campaign: "SEM-001R3F", verifiedAt: new Date().toISOString(), decision: checks.every((item) => item.pass) ? "R3F_CONFIGURATION_VERIFIED" : "STOP_CONFIGURATION_DRIFT",
  acceptanceGuardVersion: SEMANTIC_ATOMIC_COMPOSITION_ACCEPTANCE_GUARD_VERSION, baselineArtifactContradiction: {
    status: "EXPLICITLY_RECONCILED",
    explanation: "A sandbox process started before the successful R3E request completed later and overwrote the targeted result. The successful HTTP 200 trace, report addendum and structured session output agree on the recovered audit.",
    lateOverwriteNotCountedAsProviderConsumption: true,
  }, currentDigests, checks,
};
writeJson("configuration-verification-r3f.json", configuration);
writeJson("stage-invalidation-r3f.json", {
  campaign: "SEM-001R3F", rule: "Only acceptance consistency and its downstream deterministic products are invalidated.", rows: [
    { stage: "RECONSTRUCTION", beforeDigest: r3eConfiguration.currentDigests.reconstructionPrompt, afterDigest: currentDigests.reconstructionPrompt, affectedCases: "none", llmRequired: false, disposition: "COMPLETE_REUSED" },
    { stage: "BASE_CRITIC_1_3", beforeDigest: r3eConfiguration.currentDigests.criticPrompt, afterDigest: currentDigests.criticPrompt, affectedCases: "none", llmRequired: false, disposition: "COMPLETE_REUSED" },
    { stage: "R3E_AUDIT", beforeDigest: logicalDigest(recoveredR3e.audit), afterDigest: logicalDigest(recoveredR3e.audit), affectedCases: [recoveredR3e.caseId], llmRequired: false, disposition: "VALID_REUSED" },
    { stage: "ACCEPTANCE_CONSISTENCY_GUARD", beforeDigest: "R3E_GUARD_ABSENT", afterDigest: currentDigests.acceptanceGuardOwner, affectedCases: [recoveredR3e.caseId, verifiedSecondaryTargetCaseId], llmRequired: false, disposition: "NEW_DETERMINISTIC_GUARD" },
    { stage: "REPAIR_COMPILATION_AND_DOWNSTREAM", beforeDigest: "R3E_FALSE_COMPLETE_NO_REPAIR", afterDigest: currentDigests.acceptanceGuardOwner, affectedCases: [recoveredR3e.caseId], llmRequired: false, disposition: REPLAY_PRIMARY_TARGET ? "INVALIDATED_AND_REPLAYED_DETERMINISTICALLY" : "INVALIDATED_PENDING_DETERMINISTIC_REPLAY" },
    { stage: "SECONDARY_TARGET", beforeDigest: "GATE_CLOSED", afterDigest: "GATE_CLOSED_UNTIL_PRIMARY_TARGET_PASS", affectedCases: [verifiedSecondaryTargetCaseId], llmRequired: false, disposition: "DEFERRED" },
    { stage: "REMAINING_DEVELOPMENT", beforeDigest: "24_DEFERRED", afterDigest: "24_DEFERRED", affectedCases: "24 cases", llmRequired: false, disposition: "DEFERRED_BY_TARGETED_GATE" },
    { stage: "HOLDOUT", beforeDigest: "FORBIDDEN", afterDigest: "FORBIDDEN", affectedCases: "30 Holdout cases", llmRequired: false, disposition: "CLOSED" },
  ],
});
if (configuration.decision !== "R3F_CONFIGURATION_VERIFIED") throw new Error("SEM001R3F_CONFIGURATION_DRIFT_STOP");
if (VERIFY_ONLY) {
  console.log(JSON.stringify({ decision: configuration.decision, acceptanceGuardVersion: SEMANTIC_ATOMIC_COMPOSITION_ACCEPTANCE_GUARD_VERSION, checks }, null, 2));
  process.exit(0);
}

const fixture = DEVELOPMENT_CASES.find((item) => item.caseId === recoveredR3e.caseId);
const base = baseResults.find((item) => item.caseId === recoveredR3e.caseId);
const prior = r3cResults.find((item) => item.caseId === recoveredR3e.caseId && item.finalStatus === "COMPLETE");
if (!fixture || !base?.reconstructionCandidate || !prior?.semanticModel || !prior?.critics?.length) throw new Error("R3F_PRIMARY_TARGET_COMPATIBLE_CHECKPOINT_MISSING");
const request = {
  schemaVersion: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION, sessionId: `sem-001r3f:${recoveredR3e.caseId}`, language: "fr" as const, previousModel: null,
  messages: fixture.turns.map((content, index): SemanticConversationMessage => ({ messageId: `${fixture.caseId}:user:${index + 1}`, role: "USER", content, createdAt: `2026-08-12T16:${String(index).padStart(2, "0")}:00.000Z` })),
};
let candidate = structuredClone(base.reconstructionCandidate);
const replayedCriticDiagnostics: any[] = [];
for (const critic of prior.critics) {
  if (!critic.proposedRepairs.length) continue;
  const applied = applyCriticRepairs(request, candidate, critic.proposedRepairs);
  if (applied.diagnostics.some((item) => item.status !== "ACCEPTED")) throw new Error("R3F_R3C_REPAIR_REPLAY_DIVERGED");
  candidate = applied.candidate;
  replayedCriticDiagnostics.push(...applied.diagnostics);
}
const originalAudit = parseSemanticAtomicCompositionAudit(recoveredR3e.audit);
const guarded = enforceAtomicCompositionAcceptanceConsistency(candidate, originalAudit);
const compiled = compileAtomicCompositionRepairs(request, candidate, guarded.audit);
const applied = applyCriticRepairs(request, candidate, compiled.repairs);
const acceptedRepairs = applied.diagnostics.filter((item) => item.status === "ACCEPTED");
if (!guarded.changed || guarded.acceptAllowed || !acceptedRepairs.length || applied.diagnostics.some((item) => item.status !== "ACCEPTED")) throw new Error("R3F_DETERMINISTIC_GUARD_OR_REPAIR_FAILED");
candidate = applied.candidate;
const snapshot = prior.semanticModel.executionSnapshot;
const semanticModel = verifySemanticModelWithKnowledge(canonicalizeSemanticReconstruction({
  request, candidate, critic: prior.critics.at(-1), metadata: { provider: "GOOGLE_GEMINI", model: "gemini-3.5-flash-lite", temperature: null },
  reconstructionCallId: snapshot?.reconstructionCallId ?? "r3-reconstruction-reused", criticCallId: snapshot?.criticCallId ?? "r3c-critic-reused",
  criticCallIds: snapshot?.criticCallIds ?? [], critics: prior.critics, reconstructionAttempts: snapshot?.reconstructionAttempts ?? [], criticAttempts: snapshot?.criticAttempts ?? [],
}));
const metric = evaluateSemanticCase(fixture, semanticModel);
const primaryTargetPass = metric.explicitObjectRecall === 1 && metric.explicitRelationRecall === 1 && metric.criticalSemanticRecall === 1
  && metric.absoluteBlockers.length === 0 && metric.criticalUnsupportedInferenceCount === 0;
const result = {
  campaign: "SEM-001R3F", caseId: recoveredR3e.caseId, replayedAt: new Date().toISOString(), finalStatus: primaryTargetPass ? "PASS" : "FAIL",
  llmCalls: 0, reconstructionReused: true, baseCriticReused: true, r3eAuditReused: true,
  originalAudit, guardedAudit: guarded.audit, acceptanceDiagnostics: guarded.diagnostics, replayedCriticDiagnostics,
  compilationDiagnostics: compiled.diagnostics, repairDiagnostics: applied.diagnostics, semanticModel, metric,
};
writeJson("targeted-r3f-results.json", [result]);
const decision = primaryTargetPass ? "R3F_TARGETED_ATOMIC_COMPOSITION_GATE_PASSED" : "R3F_TARGETED_REPAIR_REQUIRES_FURTHER_WORK";
const previouslyCompatibleCaseIds = r3cResults.filter((item) => {
  const priorMetric = item.metric;
  return priorMetric?.explicitObjectRecall === 1 && priorMetric?.explicitRelationRecall === 1 && priorMetric?.criticalSemanticRecall === 1
    && priorMetric.absoluteBlockers?.length === 0 && priorMetric.criticalUnsupportedInferenceCount === 0;
}).map((item) => item.caseId);
const compatibleCaseIds = Array.from(new Set([
  ...previouslyCompatibleCaseIds,
  ...(primaryTargetPass ? [recoveredR3e.caseId] : []),
]));
writeJson("targeted-r3f-gate-decision.json", {
  campaign: "SEM-001R3F", decision,
  targets: {
    [recoveredR3e.caseId]: { status: result.finalStatus, metric },
    [verifiedSecondaryTargetCaseId]: { status: primaryTargetPass ? "AUTHORIZED_NOT_RUN" : "NOT_RUN_GATE_CLOSED" },
  },
  developmentCompatibleCount: compatibleCaseIds.length, compatibleCaseIds,
  holdout: "NOT_STARTED_FORBIDDEN", nextGate: primaryTargetPass ? "RUN_SECONDARY_TARGET" : "STOP_PRIMARY_TARGET_FAILED",
});
const baseCriticCallsAvoided = r3cResults.reduce((total, item) => total + (item.critics?.length ?? 0), 0);
const callsAvoidedByCompatibleReuse = baseResults.length + baseCriticCallsAvoided + 1;
const remainingDevelopmentCount = DEVELOPMENT_CASES.length - r3cResults.length;
writeJson("llm-call-accounting-r3f.json", {
  campaign: "SEM-001R3F", actualLlmCalls: 0, providerRetries: 0, structuredRegenerations: 0,
  callsAvoidedByCompatibleReuse, avoidedDetail: { reconstruction: baseResults.length, baseCritic: baseCriticCallsAvoided, validR3eAudit: 1 },
  callsDeferredByGate: { secondaryTargetAudit: primaryTargetPass ? 0 : 1, remainingDevelopmentCritics: remainingDevelopmentCount, totalMinimum: (primaryTargetPass ? 0 : 1) + remainingDevelopmentCount },
  holdoutCalls: 0, holdoutStatus: "NOT_STARTED_FORBIDDEN",
});
writeJson("qualification-summary-r3f.json", {
  campaign: "SEM-001R3F", decision,
  targeted: { [recoveredR3e.caseId]: result.finalStatus, [verifiedSecondaryTargetCaseId]: primaryTargetPass ? "AUTHORIZED_NOT_RUN" : "NOT_RUN_GATE_CLOSED" },
  development: { compatible: compatibleCaseIds.length, expected: DEVELOPMENT_CASES.length },
  llm: { actualCalls: 0, callsAvoided: callsAvoidedByCompatibleReuse, retries: 0 }, holdout: "NOT_STARTED_FORBIDDEN",
});
console.log(JSON.stringify({
  decision,
  targets: { [recoveredR3e.caseId]: result.finalStatus, [verifiedSecondaryTargetCaseId]: primaryTargetPass ? "AUTHORIZED_NOT_RUN" : "NOT_RUN_GATE_CLOSED" },
  metric,
  developmentCompatibleCount: compatibleCaseIds.length,
  llm: { actualCalls: 0, callsAvoided: callsAvoidedByCompatibleReuse, retries: 0 },
  nextGate: primaryTargetPass ? "RUN_SECONDARY_TARGET" : "STOP_PRIMARY_TARGET_FAILED",
}, null, 2));
