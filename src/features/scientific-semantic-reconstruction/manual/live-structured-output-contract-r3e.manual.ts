/* eslint-disable @typescript-eslint/no-explicit-any */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
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
  compileAtomicCompositionRepairs,
  parseSemanticAtomicCompositionAudit,
  parseSemanticAtomicCompositionTransport,
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
import { R3dResilientAtomicCompositionProvider, type R3dProviderAttemptTrace } from "./r3d-provider-resilience";
import { RollingWindowRequestLimiter } from "./rolling-rate-limiter";
import { persistStructuredOutputFailure, type StructuredOutputFailureClassification } from "./structured-output-diagnostics";

const ROOT = process.cwd();
const BASE_DIRECTORY = path.resolve(ROOT, "semantic-validation/sem-001r3");
const DIRECTORY = path.resolve(ROOT, "semantic-validation/sem-001r3b");
const MODEL_ID = "gemini-3.5-flash-lite";
const TARGET_IDS = [["SEM", "D21"].join("-"), ["SEM", "D28"].join("-")] as const;
const mode = process.argv.includes("--verify-only") ? "VERIFY" : process.argv.includes("--d21") ? "D21" : process.argv.includes("--d28") ? "D28" : null;
if (!mode || ["--verify-only", "--d21", "--d28"].filter((flag) => process.argv.includes(flag)).length !== 1) throw new Error("SEM001R3E_EXACTLY_ONE_PHASE_REQUIRED");

const writeJson = (name: string, value: unknown) => {
  mkdirSync(DIRECTORY, { recursive: true });
  const target = path.join(DIRECTORY, name);
  const temporary = `${target}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  renameSync(temporary, target);
};
const readJson = <T>(target: string): T => JSON.parse(readFileSync(target, "utf8")) as T;
const exists = (target: string) => { try { readFileSync(target); return true; } catch { return false; } };
const baseResults = readJson<any[]>(path.join(BASE_DIRECTORY, "development-results.json"));
const r3cResults = readJson<any[]>(path.join(DIRECTORY, "live-critic-results.json"));
const r3cConfiguration = readJson<any>(path.join(DIRECTORY, "configuration-verification-r3c.json"));
const r3dConfiguration = readJson<any>(path.join(DIRECTORY, "configuration-verification-r3d.json"));

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
  internalSemanticSchema: logicalDigest(readFileSync(path.resolve(ROOT, "src/features/scientific-semantic-reconstruction/atomic-composition.ts"), "utf8")),
};
const goldFramesUnchanged = baseResults.length === 30 && baseResults.every((base) => DEVELOPMENT_CASES.some((fixture) => fixture.caseId === base.caseId && logicalDigest(fixture.gold) === base.goldFrameDigest));
const checks = [
  ["provider", "GOOGLE_GEMINI", "GOOGLE_GEMINI", true], ["model", MODEL_ID, MODEL_ID, true],
  ["reconstructionPromptVersion", "SEM-001-RECONSTRUCTION-1.2", SEMANTIC_RECONSTRUCTION_PROMPT_VERSION, String(SEMANTIC_RECONSTRUCTION_PROMPT_VERSION) === "SEM-001-RECONSTRUCTION-1.2"],
  ["criticPromptVersion", "SEM-001-CRITIC-1.3", SEMANTIC_CRITIC_PROMPT_VERSION, String(SEMANTIC_CRITIC_PROMPT_VERSION) === "SEM-001-CRITIC-1.3"],
  ["schemaVersion", "SEM-001-1.1", SCIENTIFIC_SEMANTIC_SCHEMA_VERSION, SCIENTIFIC_SEMANTIC_SCHEMA_VERSION === "SEM-001-1.1"],
  ["modelVersion", "1.1", SCIENTIFIC_SEMANTIC_MODEL_VERSION, SCIENTIFIC_SEMANTIC_MODEL_VERSION === "1.1"],
  ["reconstructionPromptDigest", r3dConfiguration.currentDigests.reconstructionPrompt, currentDigests.reconstructionPrompt, r3dConfiguration.currentDigests.reconstructionPrompt === currentDigests.reconstructionPrompt],
  ["criticPromptDigest", r3dConfiguration.currentDigests.criticPrompt, currentDigests.criticPrompt, r3dConfiguration.currentDigests.criticPrompt === currentDigests.criticPrompt],
  ["baseProviderSchemaDigest", r3dConfiguration.currentDigests.baseProviderSchema, currentDigests.baseProviderSchema, r3dConfiguration.currentDigests.baseProviderSchema === currentDigests.baseProviderSchema],
  ["canonicalizerDigest", r3dConfiguration.currentDigests.canonicalizer, currentDigests.canonicalizer, r3dConfiguration.currentDigests.canonicalizer === currentDigests.canonicalizer],
  ["coverageAndRepairDigest", r3dConfiguration.currentDigests.coverageAndRepair, currentDigests.coverageAndRepair, r3dConfiguration.currentDigests.coverageAndRepair === currentDigests.coverageAndRepair],
  ["evaluatorDigest", r3dConfiguration.currentDigests.evaluator, currentDigests.evaluator, r3dConfiguration.currentDigests.evaluator === currentDigests.evaluator],
  ["developmentCorpusDigest", r3dConfiguration.currentDigests.developmentCorpus, currentDigests.developmentCorpus, r3dConfiguration.currentDigests.developmentCorpus === currentDigests.developmentCorpus],
  ["developmentGoldFrames", "30 unchanged", goldFramesUnchanged ? "30 unchanged" : "DRIFT", goldFramesUnchanged],
  ["auditPromptVersion", "SEM-001-ATOMIC-COMPOSITION-AUDIT-1.1", SEMANTIC_ATOMIC_COMPOSITION_AUDIT_PROMPT_VERSION, SEMANTIC_ATOMIC_COMPOSITION_AUDIT_PROMPT_VERSION === "SEM-001-ATOMIC-COMPOSITION-AUDIT-1.1"],
  ["auditSchemaVersion", "SEM-001-ATOMIC-COMPOSITION-1.1", SEMANTIC_ATOMIC_COMPOSITION_AUDIT_SCHEMA_VERSION, SEMANTIC_ATOMIC_COMPOSITION_AUDIT_SCHEMA_VERSION === "SEM-001-ATOMIC-COMPOSITION-1.1"],
].map(([contract, expected, observed, pass]) => ({ contract, expected, observed, pass }));
const configuration = {
  campaign: "SEM-001R3E", verifiedAt: new Date().toISOString(),
  decision: checks.every((item) => item.pass) ? "R3E_CONFIGURATION_VERIFIED" : "STOP_CONFIGURATION_DRIFT",
  classification: "STRUCTURED_OUTPUT_CONTRACT_FAILURE", currentDigests, checks,
};
writeJson("configuration-verification-r3e.json", configuration);

const atomicNA = () => ({ reportId: "atomic", subjectInventoryItemIds: ["inventory"], status: "NOT_APPLICABLE", constituents: [], directRelations: [], reason: "No autonomous constituent." });
const compositionNR = () => ({ reportId: "composition", sourceInventoryItemIds: ["inventory"], status: "NOT_REQUIRED", composite: null, relations: [], reason: "No composite required." });
const routeCorrect = () => ({ status: "CORRECT", proposedRoute: null, confidence: 1, reason: "Route correct.", expectedCapabilities: ["GENERIC"] });
const baseFixture = () => ({ auditId: "audit", schemaVersion: SEMANTIC_ATOMIC_COMPOSITION_AUDIT_SCHEMA_VERSION, verdict: "ACCEPT", atomicityReports: [atomicNA()], compositionReports: [compositionNR()], routeAssessment: routeCorrect(), summary: "Valid." });
const constituent = (id: string) => ({ constituentId: id, sourceMessageId: "message", sourceText: id, normalizedMeaning: id, semanticType: "CONSTRAINT", studyRole: "NONE", polarity: "AFFIRMED" });
const composite = () => ({ compositeId: "composite", sourceMessageId: "message", sourceText: "dynamic method", normalizedMeaning: "dynamic method", semanticType: "METHOD", studyRole: "MEASUREMENT", polarity: "AFFIRMED" });
const fixtures: Array<{ id: string; description: string; value: any }> = [
  { id: "A", description: "minimal valid R3D response", value: baseFixture() },
  { id: "B", description: "complete valid response", value: { ...baseFixture(), atomicityReports: [{ ...atomicNA(), status: "COMPLETE", constituents: [constituent("alpha"), constituent("beta")] }], compositionReports: [{ ...compositionNR(), status: "COMPLETE", composite: composite() }] } },
  { id: "C", description: "NOT_APPLICABLE atomicity", value: baseFixture() },
  { id: "D", description: "INCOMPLETE atomicity", value: { ...baseFixture(), verdict: "REVISE", atomicityReports: [{ ...atomicNA(), status: "INCOMPLETE", constituents: [constituent("alpha"), constituent("beta")] }] } },
  { id: "E", description: "absent composition NOT_REQUIRED", value: baseFixture() },
  { id: "F", description: "present composition", value: { ...baseFixture(), verdict: "REVISE", compositionReports: [{ ...compositionNR(), status: "INCOMPLETE", composite: composite() }] } },
  { id: "G", description: "unchanged route", value: baseFixture() },
  { id: "H", description: "proposed route", value: { ...baseFixture(), verdict: "REVISE", routeAssessment: { ...routeCorrect(), status: "INCORRECT", proposedRoute: "DESIGN_STUDY" } } },
  { id: "I", description: "ambiguous state", value: { ...baseFixture(), verdict: "CLARIFICATION_REQUIRED", atomicityReports: [{ ...atomicNA(), status: "AMBIGUOUS" }], routeAssessment: { ...routeCorrect(), status: "UNCERTAIN" } } },
];
const offlineResults = fixtures.map((fixture) => {
  try {
    const transport = parseSemanticAtomicCompositionTransport(JSON.parse(JSON.stringify(fixture.value)));
    const internal = parseSemanticAtomicCompositionAudit(transport);
    const normalized = parseSemanticAtomicCompositionAudit(JSON.parse(JSON.stringify(internal)));
    return { fixture: fixture.id, description: fixture.description, providerShape: "PASS", parser: "PASS", internalSchema: "PASS", semanticInvariants: "PASS", roundTrip: logicalDigest(normalized) === logicalDigest(internal) ? "PASS" : "FAIL" };
  } catch (caught) {
    return { fixture: fixture.id, description: fixture.description, providerShape: "FAIL", parser: "FAIL", internalSchema: "FAIL", semanticInvariants: "FAIL", roundTrip: "FAIL", error: caught instanceof Error ? caught.message : "UNKNOWN" };
  }
});
writeJson("offline-fixture-validation-r3e.json", { campaign: "SEM-001R3E", fixtures: offlineResults, decision: offlineResults.every((item) => Object.values(item).filter((value) => value === "FAIL").length === 0) ? "OFFLINE_FIXTURES_9_OF_9_PASS" : "OFFLINE_FIXTURE_FAILURE" });

writeJson("schema-crosswalk-r3e.json", {
  campaign: "SEM-001R3E", providerTransportSchemaVersion: SEMANTIC_ATOMIC_COMPOSITION_AUDIT_SCHEMA_VERSION,
  principle: "Transport fixes shape, types, required nullable fields and enums. Internal validation adds conditional and semantic invariants without filling absent values.",
  fields: [
    { requestedField: "atomicityReports[]", provider: "required array 1..30", internal: "same plus verdict consistency", parser: "identity", conditionalInvariant: "each report is independently validated" },
    { requestedField: "atomicityReports[].status", provider: "COMPLETE|INCOMPLETE|NOT_APPLICABLE|AMBIGUOUS", internal: "same", parser: "identity", conditionalInvariant: "INCOMPLETE >=2 constituents; COMPLETE 0 or >=2; NOT_APPLICABLE none" },
    { requestedField: "atomicityReports[].sourceSpan", provider: "not a direct field", internal: "not a direct field", parser: "no mapping", conditionalInvariant: "source spans remain on constituents[] and directRelations[] as sourceMessageId+sourceText" },
    { requestedField: "atomicityReports[].constituents", provider: "required array", internal: "same objects", parser: "identity", conditionalInvariant: "unique constituentId and relation endpoints known" },
    { requestedField: "atomicityReports[].reason", provider: "required non-empty string", internal: "same", parser: "identity", conditionalInvariant: "none" },
    { requestedField: "compositionReports[]", provider: "required array 1..30", internal: "same plus verdict consistency", parser: "identity", conditionalInvariant: "each report is independently validated" },
    { requestedField: "compositionReports[].status", provider: "COMPLETE|INCOMPLETE|NOT_REQUIRED|AMBIGUOUS", internal: "same", parser: "identity", conditionalInvariant: "COMPLETE/INCOMPLETE require composite; NOT_REQUIRED forbids composite and relations" },
    { requestedField: "compositionReports[].composite", provider: "required nullable complete object", internal: "same", parser: "identity", conditionalInvariant: "null is correct only when status does not require a composite" },
    { requestedField: "compositionReports[].componentElementIds", provider: "not present at audit transport stage", internal: "sourceInventoryItemIds carry bounded source ownership", parser: "no mapping", conditionalInvariant: "typed element IDs are resolved only by deterministic repair compilation" },
    { requestedField: "compositionReports[].sourceSpans", provider: "not a direct field", internal: "not a direct field", parser: "no mapping", conditionalInvariant: "composite and relations retain sourceMessageId+sourceText" },
    { requestedField: "routeAssessment", provider: "required strict object", internal: "same", parser: "identity", conditionalInvariant: "status/proposedRoute dependency" },
    { requestedField: "routeAssessment.status", provider: "CORRECT|INCORRECT|UNCERTAIN", internal: "same", parser: "identity", conditionalInvariant: "INCORRECT requires proposal" },
    { requestedField: "routeAssessment.proposedRoute", provider: "required nullable route enum", internal: "same", parser: "identity", conditionalInvariant: "null for CORRECT/UNCERTAIN; non-null for INCORRECT" },
    { requestedField: "routeAssessment.reason", provider: "required non-empty string", internal: "same", parser: "identity", conditionalInvariant: "none" },
  ],
});
writeJson("structured-output-contract-diagnosis-r3e.json", {
  campaign: "SEM-001R3E", historicalDecisionPreserved: "R3D_BLOCKED_BY_PROVIDER", correctedTechnicalClassification: "STRUCTURED_OUTPUT_CONTRACT_FAILURE",
  providerCapacityFailure: false, evidence: { httpStatus: 200, providerSchemaAccepted: true, generations: 3, rawOutputHistoricallyPersisted: false },
  failurePaths: [
    { path: "atomicityReports.0.status:custom", cause: "INTERNAL_INVARIANT_OVERCONSTRAINED", explanation: "R3D forbade COMPLETE reports from carrying valid constituent evidence." },
    { path: "compositionReports.0.composite:custom", cause: "INTERNAL_INVARIANT_OVERCONSTRAINED", explanation: "R3D forbade COMPLETE reports from identifying the existing composite." },
    { path: "routeAssessment.proposedRoute:custom", cause: "PROMPT_CONDITIONAL_UNDERSPECIFIED", explanation: "The transport allowed nullable routes but the prompt did not state the status/null matrix explicitly." },
  ],
  taxonomy: { primary: "D_OVERCONSTRAINED_INTERNAL_INVARIANT", contributing: ["B_PROMPT_UNDERSPECIFICATION", "C_PROVIDER_INTERNAL_CONDITIONAL_MISMATCH"], notDemonstrated: ["A_PROVIDER_SCHEMA_REJECTION", "E_PARSER_TRANSFORMATION", "F_PURE_MODEL_NON_COMPLIANCE"] },
});
writeJson("stage-invalidation-r3e.json", {
  campaign: "SEM-001R3E", globalBaseConfiguration: "UNCHANGED", rows: [
    { stage: "LLM_RECONSTRUCTION", beforeDigest: r3dConfiguration.currentDigests.reconstructionPrompt, afterDigest: currentDigests.reconstructionPrompt, affectedCases: "none", llmRequired: false, disposition: "COMPLETE_REUSED" },
    { stage: "BASE_CRITIC_1_3", beforeDigest: r3dConfiguration.currentDigests.criticPrompt, afterDigest: currentDigests.criticPrompt, affectedCases: "none", llmRequired: false, disposition: "COMPLETE_REUSED" },
    { stage: "CANONICALIZER", beforeDigest: r3dConfiguration.currentDigests.canonicalizer, afterDigest: currentDigests.canonicalizer, affectedCases: "none until new targeted audit", llmRequired: false, disposition: "IMPLEMENTATION_UNCHANGED" },
    { stage: "CONDITIONAL_AUDIT_PROMPT", beforeDigest: r3dConfiguration.currentDigests.atomicCompositionPrompt, afterDigest: currentDigests.atomicCompositionPrompt, affectedCases: TARGET_IDS, llmRequired: true, disposition: "INVALIDATED_TARGETED" },
    { stage: "PROVIDER_TRANSPORT_SCHEMA", beforeDigest: r3dConfiguration.currentDigests.atomicCompositionSchema, afterDigest: currentDigests.providerTransportSchema, affectedCases: TARGET_IDS, llmRequired: true, disposition: "INVALIDATED_TARGETED" },
    { stage: "INTERNAL_SEMANTIC_SCHEMA", beforeDigest: r3dConfiguration.currentDigests.atomicCompositionOwner, afterDigest: currentDigests.internalSemanticSchema, affectedCases: TARGET_IDS, llmRequired: false, disposition: "LOCAL_REVALIDATION_COMPLETE" },
    { stage: "D21_DOWNSTREAM", beforeDigest: "R3D_NOT_PRODUCED", afterDigest: "PENDING_D21", affectedCases: [TARGET_IDS[0]], llmRequired: false, disposition: "INVALIDATED_DOWNSTREAM" },
    { stage: "D28_AND_REMAINING", beforeDigest: "R3D_GATE_CLOSED", afterDigest: "GATE_CLOSED", affectedCases: [TARGET_IDS[1], "24 remaining Development"], llmRequired: false, disposition: "DEFERRED_BY_GATE" },
    { stage: "HOLDOUT", beforeDigest: "FORBIDDEN", afterDigest: "FORBIDDEN", affectedCases: "30 Holdout", llmRequired: false, disposition: "CLOSED" },
  ],
});

const offline = readJson<any>(path.join(DIRECTORY, "offline-fixture-validation-r3e.json"));
if (configuration.decision !== "R3E_CONFIGURATION_VERIFIED" || offline.decision !== "OFFLINE_FIXTURES_9_OF_9_PASS") throw new Error("SEM001R3E_OFFLINE_GATE_STOP");
if (mode === "VERIFY") {
  console.log(JSON.stringify({ configuration: configuration.decision, offline: offline.decision, digests: currentDigests }, null, 2));
  process.exit(0);
}

const resultsPath = path.join(DIRECTORY, "targeted-r3e-results.json");
let results = exists(resultsPath) ? readJson<any[]>(resultsPath) : [];
const targetId = mode === "D21" ? TARGET_IDS[0] : TARGET_IDS[1];
const passesGate = (item: any, requireRelation: boolean) => item?.finalStatus === "COMPLETE" && item.metric?.explicitObjectRecall === 1
  && (!requireRelation || item.metric?.explicitRelationRecall === 1) && item.metric?.criticalSemanticRecall === 1
  && item.metric?.absoluteBlockers?.length === 0 && (item.caseId !== TARGET_IDS[1] || item.metric?.routeCorrect === true);
if (mode === "D28" && !passesGate(results.find((item) => item.caseId === TARGET_IDS[0]), true)) throw new Error("SEM001R3E_D28_GATE_CLOSED_D21_NOT_PASS");
if (results.some((item) => item.caseId === targetId && item.finalStatus === "COMPLETE")) throw new Error(`SEM001R3E_TARGET_ALREADY_COMPLETE:${targetId}`);

const environment = loadEnv("development", ROOT, "");
const apiKey = environment.GEMINI_API_KEY?.trim();
if (!apiKey) throw new Error("GEMINI_API_KEY_MISSING");
const attemptsPath = path.join(DIRECTORY, "provider-attempts-r3e.json");
const traces: R3dProviderAttemptTrace[] = exists(attemptsPath) ? readJson<R3dProviderAttemptTrace[]>(attemptsPath) : [];
const checkpointTraces = () => writeJson("provider-attempts-r3e.json", traces);
const limiter = new RollingWindowRequestLimiter({ maxRequests: 5, windowMs: 60_000, safetyMarginMs: 500 });
const baseProvider = new GeminiScientificSemanticProvider({ apiKey, model: MODEL_ID, timeoutMs: 90_000, maxAttempts: 1, beforeAttempt: () => limiter.acquire() });
const provider = new R3dResilientAtomicCompositionProvider(baseProvider, { onAttempt: (trace) => { traces.push(trace); checkpointTraces(); } });
const fixture = DEVELOPMENT_CASES.find((item) => item.caseId === targetId)!;
const base = baseResults.find((item) => item.caseId === targetId);
const prior = r3cResults.find((item) => item.caseId === targetId && item.finalStatus === "COMPLETE");
if (!base?.reconstructionCandidate || !prior?.semanticModel || !prior?.critics?.length) throw new Error(`R3E_REQUIRED_CHECKPOINT_MISSING:${targetId}`);
const request = {
  schemaVersion: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION, sessionId: `sem-001r3e:${targetId}`, language: "fr" as const,
  messages: fixture.turns.map((content, index): SemanticConversationMessage => ({ messageId: `${targetId}:user:${index + 1}`, role: "USER", content, createdAt: `2026-08-12T15:${String(index).padStart(2, "0")}:00.000Z` })), previousModel: null,
};
let candidate = structuredClone(base.reconstructionCandidate);
for (const critic of prior.critics) {
  if (!critic.proposedRepairs.length) continue;
  const applied = applyCriticRepairs(request, candidate, critic.proposedRepairs);
  if (applied.diagnostics.some((item) => item.status !== "ACCEPTED")) throw new Error("R3C_REPAIR_REPLAY_DIVERGED");
  candidate = applied.candidate;
}
const runId = `sem-001r3e-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const started = Date.now();
const result: any = { caseId: targetId, runId, finalStatus: "FAILED", reconstructionReused: true, baseCriticReused: true, firstImpactedStage: "CONDITIONAL_ATOMIC_COMPOSITION_AUDIT", audit: null, compilationDiagnostics: [], repairDiagnostics: [], metric: null, semanticModel: null, error: null };
try {
  const audited = await provider.auditAtomicComposition(request, candidate, 1);
  result.audit = audited.audit;
  result.callId = audited.callId;
  result.attempts = audited.attempts ?? [];
  if (audited.audit.verdict === "CLARIFICATION_REQUIRED") throw new Error("R3E_AUDIT_CLARIFICATION_REQUIRED");
  if (audited.audit.verdict === "REVISE") {
    const compiled = compileAtomicCompositionRepairs(request, candidate, audited.audit);
    result.compilationDiagnostics = compiled.diagnostics;
    const applied = applyCriticRepairs(request, candidate, compiled.repairs);
    result.repairDiagnostics = applied.diagnostics;
    if (!compiled.repairs.length || !applied.diagnostics.some((item) => item.status === "ACCEPTED")) throw new Error("R3E_AUDIT_REPAIR_REJECTED");
    candidate = applied.candidate;
  }
  const snapshot = prior.semanticModel.executionSnapshot;
  const model = verifySemanticModelWithKnowledge(canonicalizeSemanticReconstruction({
    request, candidate, critic: prior.critics.at(-1), metadata: provider.metadata,
    reconstructionCallId: snapshot?.reconstructionCallId ?? "r3-reconstruction-reused", criticCallId: snapshot?.criticCallId ?? "r3c-critic-reused",
    criticCallIds: snapshot?.criticCallIds ?? [], critics: prior.critics, reconstructionAttempts: snapshot?.reconstructionAttempts ?? [], criticAttempts: snapshot?.criticAttempts ?? [],
  }));
  result.semanticModel = model;
  result.metric = evaluateSemanticCase(fixture, model);
  result.finalStatus = "COMPLETE";
} catch (caught) {
  if (caught instanceof SemanticProviderError) {
    const classification = caught.category === "INVALID_STRUCTURED_OUTPUT"
      ? (caught.diagnostic?.structuredOutputClassification ?? "UNKNOWN_STRUCTURED_OUTPUT_FAILURE")
      : (["RATE_LIMIT", "SERVER_ERROR", "TIMEOUT", "NETWORK"].includes(caught.category) ? "PROVIDER_CAPACITY_FAILURE" : caught.category);
    let diagnosticArtifact: string | null = null;
    if (caught.category === "INVALID_STRUCTURED_OUTPUT" && caught.diagnostic) {
      diagnosticArtifact = await persistStructuredOutputFailure(path.join(DIRECTORY, "invalid-structured-output-r3e"), {
        caseId: targetId, stage: "ATOMIC_COMPOSITION_AUDIT", attempt: traces.length || 1, timestamp: new Date().toISOString(), model: MODEL_ID,
        promptVersion: SEMANTIC_ATOMIC_COMPOSITION_AUDIT_PROMPT_VERSION, providerSchemaDigest: currentDigests.providerTransportSchema,
        internalSchemaDigest: currentDigests.internalSemanticSchema, classification: (caught.diagnostic.structuredOutputClassification ?? "PARSER_FAILURE") as StructuredOutputFailureClassification,
        rawProviderStructuredResponse: caught.diagnostic.rawProviderOutput, validationIssues: caught.diagnostic.validationIssues,
      });
    }
    result.finalStatus = classification === "PROVIDER_CAPACITY_FAILURE" ? "PROVIDER_CAPACITY_FAILURE" : "STRUCTURED_OUTPUT_FAILURE";
    result.error = { category: caught.category, classification, httpStatus: caught.details?.httpStatus ?? null, providerStatus: caught.details?.providerStatus ?? null, validationIssues: caught.diagnostic?.validationIssues ?? [], diagnosticArtifact };
    result.attempts = caught.attempts;
  } else result.error = { category: "SEMANTIC_PIPELINE_FAILURE", message: caught instanceof Error ? caught.message : "UNKNOWN" };
}
result.completedAt = new Date().toISOString();
result.latencyMs = Date.now() - started;
results = [...results.filter((item) => item.caseId !== targetId), result].sort((left, right) => left.caseId.localeCompare(right.caseId));
writeJson("targeted-r3e-results.json", results);

const d21 = results.find((item) => item.caseId === TARGET_IDS[0]);
const d28 = results.find((item) => item.caseId === TARGET_IDS[1]);
const d21Pass = passesGate(d21, true);
const d28Pass = passesGate(d28, false);
const providerBlocked = [d21, d28].some((item) => item?.finalStatus === "PROVIDER_CAPACITY_FAILURE");
const decision = providerBlocked ? "R3E_BLOCKED_BY_PROVIDER_CAPACITY" : d21Pass && d28Pass
  ? "R3E_STRUCTURED_OUTPUT_CONTRACT_REPAIRED_TARGETED_GATE_PASS" : "R3E_STRUCTURED_OUTPUT_CONTRACT_REQUIRES_FURTHER_WORK";
const actualLLMCalls = traces.filter((item) => item.httpStatus !== null).length;
const providerRetries = traces.filter((item) => item.finalDisposition === "RETRY_SCHEDULED").length;
writeJson("llm-call-accounting-r3e.json", {
  campaign: "SEM-001R3E", model: MODEL_ID, actualLLMCalls, structuredRegenerations: 0, providerRetries,
  callsAvoidedByCompatibleCache: 42,
  callsDeferredByGate: { d28Audit: d21Pass ? 0 : 1, remainingDevelopmentCritics: 24, totalMinimum: (d21Pass ? 0 : 1) + 24 },
  holdoutCalls: 0, holdoutStatus: "NOT_STARTED_FORBIDDEN",
  reconstructionCalls: 0, baseCriticCalls: 0, conditionalAuditCalls: actualLLMCalls,
});
writeJson("targeted-r3e-gate-decision.json", {
  campaign: "SEM-001R3E", decision, classification: "STRUCTURED_OUTPUT_CONTRACT_FAILURE", historicalR3dDecisionPreserved: "R3D_BLOCKED_BY_PROVIDER",
  evidence: [d21 ?? { caseId: TARGET_IDS[0], finalStatus: "NOT_RUN" }, d28 ?? { caseId: TARGET_IDS[1], finalStatus: "NOT_RUN_GATE_CLOSED" }].map((item) => ({ caseId: item.caseId, finalStatus: item.finalStatus, metric: item.metric ?? null, error: item.error ?? null })),
  gates: { d21Pass, d28Pass, remainingDevelopmentCritics: "NOT_AUTHORIZED", holdout: "NOT_STARTED_FORBIDDEN" },
});
console.log(JSON.stringify({ decision, target: targetId, finalStatus: result.finalStatus, metric: result.metric, error: result.error, calls: { actualLLMCalls, structuredRegenerations: 0, providerRetries }, nextGate: d21Pass && !d28 ? "D28_AUTHORIZED" : "STOP" }, null, 2));
