/* eslint-disable @typescript-eslint/no-explicit-any */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { SCIENTIFIC_SEMANTIC_ATOMIC_COMPOSITION_AUDIT_PROMPT } from "../../../../api/prompts/scientific-semantic-atomic-composition-prompt";
import { SCIENTIFIC_SEMANTIC_CRITIC_PROMPT, SCIENTIFIC_SEMANTIC_RECONSTRUCTION_PROMPT } from "../../../../api/prompts/scientific-semantic-reconstruction-prompt";
import {
  compileAtomicCompositionRepairs,
  enforceAtomicCompositionAcceptanceConsistency,
  parseSemanticAtomicCompositionAudit,
  SEMANTIC_ATOMIC_COMPOSITION_AUDIT_JSON_SCHEMA,
} from "../atomic-composition";
import { canonicalizeSemanticReconstruction } from "../canonical";
import { evaluateSemanticCase } from "../competence";
import { DEVELOPMENT_CASES } from "../competence-fixtures";
import { applyCriticRepairs } from "../coverage";
import { verifySemanticModelWithKnowledge } from "../knowledge";
import { SEMANTIC_CRITIC_JSON_SCHEMA, SEMANTIC_RECONSTRUCTION_JSON_SCHEMA } from "../schema";
import { SCIENTIFIC_SEMANTIC_SCHEMA_VERSION, type SemanticConversationMessage } from "../types";

const ROOT = process.cwd();
const BASE_DIRECTORY = path.resolve(ROOT, "semantic-validation/sem-001r3");
const DIRECTORY = path.resolve(ROOT, "semantic-validation/sem-001r3b");
const MODEL_ID = "gemini-3.5-flash-lite";
const readJson = <T>(target: string): T => JSON.parse(readFileSync(target, "utf8")) as T;
const writeJson = (name: string, value: unknown) => {
  mkdirSync(DIRECTORY, { recursive: true });
  const target = path.join(DIRECTORY, name);
  const temporary = target + ".tmp";
  writeFileSync(temporary, JSON.stringify(value, null, 2) + "\n", { encoding: "utf8", mode: 0o600 });
  renameSync(temporary, target);
};

const baseResults = readJson<any[]>(path.join(BASE_DIRECTORY, "development-results.json"));
const r3cResults = readJson<any[]>(path.join(DIRECTORY, "live-critic-results.json"));
const r3gResults = readJson<any[]>(path.join(DIRECTORY, "targeted-r3g-results.json"));
const r3gDecision = readJson<any>(path.join(DIRECTORY, "targeted-r3g-gate-decision.json"));
const r3gConfiguration = readJson<any>(path.join(DIRECTORY, "configuration-verification-r3g.json"));
if (r3gDecision.decision !== "R3G_PRIMARY_GATE_PASSED_SECONDARY_REPAIR_REQUIRED") throw new Error("SEM001R3H_R3G_DECISION_NOT_ELIGIBLE");
const primaryCaseId = r3gDecision.primary.caseId as string;
const targetCaseId = r3gDecision.secondary.caseId as string;
const primaryResult = r3gResults.find((item) => item.caseId === primaryCaseId);
const targetResult = r3gResults.find((item) => item.caseId === targetCaseId);
if (!primaryResult || primaryResult.finalStatus !== "PASS" || !targetResult?.audit) throw new Error("SEM001R3H_REQUIRED_R3G_ARTIFACT_MISSING");

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
  compositeMethodOwner: logicalDigest(readFileSync(path.resolve(ROOT, "src/features/scientific-semantic-reconstruction/atomic-composition.ts"), "utf8")),
};
const frozenContracts = [
  "reconstructionPrompt", "criticPrompt", "baseProviderSchema", "canonicalizer", "coverageAndRepair", "evaluator",
  "developmentCorpus", "developmentGold", "atomicCompositionPrompt", "providerTransportSchema",
] as const;
const checks = frozenContracts.map((contract) => ({
  contract,
  expected: r3gConfiguration.currentDigests[contract],
  observed: currentDigests[contract],
  pass: r3gConfiguration.currentDigests[contract] === currentDigests[contract],
}));
checks.push({
  contract: "compositeMethodOwner" as any,
  expected: "changed from R3G owner" as any,
  observed: currentDigests.compositeMethodOwner,
  pass: currentDigests.compositeMethodOwner !== r3gConfiguration.currentDigests.atomicClassificationOwner,
});
checks.push({
  contract: "primaryGatePreserved" as any,
  expected: "PASS with all semantic gates at 1 and no blocker" as any,
  observed: logicalDigest(primaryResult),
  pass: primaryResult.metric.explicitObjectRecall === 1 && primaryResult.metric.explicitRelationRecall === 1
    && primaryResult.metric.criticalSemanticRecall === 1 && primaryResult.metric.absoluteBlockers.length === 0,
});
checks.push({
  contract: "targetAuditReusable" as any,
  expected: "schema-valid R3G audit" as any,
  observed: targetResult.audit.auditId,
  pass: Boolean(parseSemanticAtomicCompositionAudit(targetResult.audit)),
});
const configuration = {
  campaign: "SEM-001R3H",
  verifiedAt: new Date().toISOString(),
  decision: checks.every((item) => item.pass) ? "R3H_CONFIGURATION_VERIFIED" : "STOP_CONFIGURATION_DRIFT",
  allowedMutation: "EXPLICIT_COMPOSITE_METHOD_LOSS_OWNER_ONLY",
  currentDigests,
  checks,
};
writeJson("configuration-verification-r3h.json", configuration);
writeJson("stage-invalidation-r3h.json", {
  campaign: "SEM-001R3H",
  rule: "Only deterministic composite-method acceptance, compilation, canonicalization, routing, and target evaluation are invalidated.",
  rows: [
    { stage: "RECONSTRUCTION", affectedCases: "none", llmRequired: false, disposition: "30_COMPLETE_REUSED" },
    { stage: "BASE_CRITIC_1_3", affectedCases: "none", llmRequired: false, disposition: "COMPLETE_REUSED" },
    { stage: "PRIMARY_TARGET", affectedCases: [primaryCaseId], llmRequired: false, disposition: "CLOSED_UNCHANGED" },
    { stage: "TARGET_ATOMIC_AUDIT", affectedCases: [targetCaseId], llmRequired: false, disposition: "VALID_R3G_AUDIT_REUSED" },
    { stage: "COMPOSITE_REQUIREMENT_ACCEPTANCE_GUARD", affectedCases: [targetCaseId], llmRequired: false, disposition: "FIRST_INVALIDATED_STAGE" },
    { stage: "TARGET_DOWNSTREAM", affectedCases: [targetCaseId], llmRequired: false, disposition: "REPLAYED" },
    { stage: "REMAINING_DEVELOPMENT", affectedCases: "24 cases", llmRequired: false, disposition: "NOT_AUTHORIZED" },
    { stage: "HOLDOUT", affectedCases: "30 cases", llmRequired: false, disposition: "NOT_STARTED_FORBIDDEN" },
  ],
});
if (configuration.decision !== "R3H_CONFIGURATION_VERIFIED") throw new Error("SEM001R3H_CONFIGURATION_DRIFT_STOP");

const fixture = DEVELOPMENT_CASES.find((item) => item.caseId === targetCaseId);
const base = baseResults.find((item) => item.caseId === targetCaseId);
const prior = r3cResults.find((item) => item.caseId === targetCaseId && item.finalStatus === "COMPLETE");
if (!fixture || !base?.reconstructionCandidate || !prior?.semanticModel || !prior?.critics?.length) throw new Error("SEM001R3H_COMPATIBLE_CHECKPOINT_MISSING");
const request = {
  schemaVersion: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
  sessionId: "sem-001r3h:" + targetCaseId,
  language: "fr" as const,
  previousModel: null,
  messages: fixture.turns.map((content, index): SemanticConversationMessage => ({
    messageId: targetCaseId + ":user:" + (index + 1),
    role: "USER",
    content,
    createdAt: "2026-08-12T18:" + String(index).padStart(2, "0") + ":00.000Z",
  })),
};
let candidate = structuredClone(base.reconstructionCandidate);
const replayedCriticDiagnostics: any[] = [];
for (const critic of prior.critics) {
  if (!critic.proposedRepairs.length) continue;
  const replayed = applyCriticRepairs(request, candidate, critic.proposedRepairs);
  if (replayed.diagnostics.some((item) => item.status !== "ACCEPTED")) throw new Error("SEM001R3H_BASE_CRITIC_REPLAY_DIVERGED");
  candidate = replayed.candidate;
  replayedCriticDiagnostics.push(...replayed.diagnostics);
}
const componentSnapshot = candidate.elements
  .filter((element) => targetResult.audit.compositionReports[0].sourceInventoryItemIds.some((id: string) => element.inventoryItemIds.includes(id)))
  .map((element) => logicalDigest(element));
const originalAudit = parseSemanticAtomicCompositionAudit(targetResult.audit);
const guarded = enforceAtomicCompositionAcceptanceConsistency(candidate, originalAudit, request);
const compiled = compileAtomicCompositionRepairs(request, candidate, guarded.audit);
const applied = applyCriticRepairs(request, candidate, compiled.repairs);
if (!guarded.changed || guarded.acceptAllowed || !compiled.repairs.length || applied.diagnostics.some((item) => item.status !== "ACCEPTED")) {
  throw new Error("SEM001R3H_COMPOSITE_REPAIR_REJECTED");
}
const postRepair = enforceAtomicCompositionAcceptanceConsistency(applied.candidate, originalAudit, request);
const snapshot = prior.semanticModel.executionSnapshot;
const semanticModel = verifySemanticModelWithKnowledge(canonicalizeSemanticReconstruction({
  request,
  candidate: applied.candidate,
  critic: prior.critics.at(-1),
  metadata: { provider: "GOOGLE_GEMINI", model: MODEL_ID, temperature: null },
  reconstructionCallId: snapshot?.reconstructionCallId ?? "r3-reconstruction-reused",
  criticCallId: snapshot?.criticCallId ?? "r3c-critic-reused",
  criticCallIds: snapshot?.criticCallIds ?? [],
  critics: prior.critics,
  reconstructionAttempts: snapshot?.reconstructionAttempts ?? [],
  criticAttempts: snapshot?.criticAttempts ?? [],
}));
const metric = evaluateSemanticCase(fixture, semanticModel);
const semanticGate = metric.explicitObjectRecall === 1 && metric.explicitRelationRecall === 1
  && metric.criticalSemanticRecall === 1 && metric.criticalUnsupportedInferenceCount === 0 && metric.absoluteBlockers.length === 0;
const fullGate = semanticGate && metric.routeCorrect === true;
const decision = fullGate
  ? "R3H_TARGETED_DEVELOPMENT_REPAIRS_PASSED"
  : semanticGate
    ? "R3H_COMPOSITE_REPAIR_PASSED_ROUTING_REPAIR_REQUIRED"
    : "R3H_COMPOSITE_REPAIR_REQUIRES_FURTHER_WORK";
const componentsPreserved = candidate.elements
  .filter((element) => targetResult.audit.compositionReports[0].sourceInventoryItemIds.some((id: string) => element.inventoryItemIds.includes(id)))
  .map((element) => logicalDigest(element))
  .every((digest: string) => componentSnapshot.includes(digest));
const result = {
  campaign: "SEM-001R3H",
  caseId: targetCaseId,
  executedAt: new Date().toISOString(),
  finalStatus: fullGate ? "PASS" : "FAIL",
  firstInvalidatedStage: "COMPOSITE_REQUIREMENT_ACCEPTANCE_GUARD",
  llmCalls: 0,
  reused: { reconstruction: true, baseCritic: true, validAtomicAudit: true },
  originalAudit,
  guardedAudit: guarded.audit,
  acceptanceDiagnostics: [...guarded.diagnostics, ...postRepair.diagnostics],
  compilationDiagnostics: compiled.diagnostics,
  replayedCriticDiagnostics,
  repairDiagnostics: applied.diagnostics,
  componentsPreserved,
  postRepairAuditAccepted: postRepair.acceptAllowed,
  semanticModel,
  metric,
};
writeJson("targeted-r3h-results.json", [result]);
writeJson("targeted-r3h-gate-decision.json", {
  campaign: "SEM-001R3H",
  decision,
  primary: { caseId: primaryCaseId, status: "CLOSED_UNCHANGED", metric: primaryResult.metric },
  target: { caseId: targetCaseId, status: result.finalStatus, metric },
  remainingDevelopment: "NOT_AUTHORIZED",
  holdout: "NOT_STARTED_FORBIDDEN",
});
const baseCriticCalls = r3cResults.reduce((total, item) => total + (item.critics?.length ?? 0), 0);
const callsAvoided = baseResults.length + baseCriticCalls + 1;
writeJson("llm-call-accounting-r3h.json", {
  campaign: "SEM-001R3H",
  actualLlmCalls: 0,
  callsAvoidedByCompatibleReuse: callsAvoided,
  avoidedDetail: { reconstruction: baseResults.length, baseCritic: baseCriticCalls, validTargetAudit: 1 },
  providerRetries: 0,
  structuredRegenerations: 0,
  holdoutCalls: 0,
});
writeJson("provider-attempts-r3h.json", []);
writeJson("qualification-summary-r3h.json", {
  campaign: "SEM-001R3H",
  decision,
  primary: "CLOSED_UNCHANGED",
  target: result.finalStatus,
  metric,
  llm: { actualCalls: 0, callsAvoided },
  holdout: "NOT_STARTED_FORBIDDEN",
});
console.log(JSON.stringify({ decision, caseId: targetCaseId, metric, componentsPreserved, postRepairAuditAccepted: postRepair.acceptAllowed, llm: { actualCalls: 0, callsAvoided }, holdout: "NOT_STARTED_FORBIDDEN" }, null, 2));
process.exit(fullGate ? 0 : 2);
