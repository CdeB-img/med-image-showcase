/* eslint-disable @typescript-eslint/no-explicit-any -- frozen H1 execution crosses immutable owner and trace ledgers */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { logicalDigest } from "@/features/knowledge-engine";
import { executeScientificThinkingEngine, SCIENTIFIC_THINKING_ENGINE_VERSION, type ScientificThinkingInput } from "@/features/scientific-thinking";
import { invokeScientificThinkingForProject } from "@/features/protocol-designer/product-scientific-thinking-owner-runtime";
import { rehydrateProductOwnerResultLedger } from "@/features/protocol-designer/product-owner-result-ledger";
import {
  createScientificExecutionTraceLedger,
  createScientificRunTraceRecorder,
  listScientificRunEvents,
} from "@/features/protocol-designer/scientific-execution-trace";
import type { FrozenInputPack, HumanReviewCase } from "./authoring";
import { runDeterministicChecks } from "./deterministic-checker";

const ROOT = resolve(import.meta.dirname, "../../..");
const OUT = resolve(ROOT, "validation/w1-qual-01h1-st");
const stable = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const read = <T>(name: string) => JSON.parse(readFileSync(resolve(OUT, name), "utf8")) as T;
const write = (name: string, value: unknown) => writeFileSync(resolve(OUT, name), stable(value), "utf8");
const sha = (path: string) => `sha256-${createHash("sha256").update(readFileSync(path)).digest("hex")}`;

const freeze = read<any>("campaign-freeze.json");
const caseRegistry = read<any>("case-registry.json");
const envelopeRegistry = read<any>("human-review-envelope-registry.json");
const inputRegistry = read<any>("frozen-input-registry.json");
const parentageAudit = read<any>("parentage-audit.json");
const humanTemplate = read<any>("human-adjudication-template.json");

const observedRegistryDigests = {
  caseRegistry: logicalDigest(caseRegistry),
  humanReviewEnvelopeRegistry: logicalDigest(envelopeRegistry),
  frozenInputRegistry: logicalDigest(inputRegistry),
  parentageAudit: logicalDigest(parentageAudit),
  humanAdjudicationTemplate: logicalDigest(humanTemplate),
};
if (stable(observedRegistryDigests) !== stable(freeze.registryDigests)) throw new Error("H1_FROZEN_REGISTRY_MODIFIED");
if (sha(resolve(OUT, "tools/authoring.ts")) !== freeze.authoringDigest) throw new Error("H1_AUTHORING_MODIFIED_AFTER_FREEZE");
if (sha(resolve(OUT, "tools/deterministic-checker.ts")) !== freeze.deterministicChecker.digest) throw new Error("H1_CHECKER_MODIFIED_AFTER_FREEZE");
for (const item of Object.values(freeze.stRuntime) as Array<{ path: string; sha256: string }>) {
  if (sha(resolve(ROOT, item.path)) !== item.sha256) throw new Error(`H1_ST_RUNTIME_MODIFIED:${item.path}`);
}
if (SCIENTIFIC_THINKING_ENGINE_VERSION !== freeze.stVersion || freeze.status !== "H1_CAMPAIGN_FREEZE_READY" || freeze.observationOccurred !== false || freeze.mutableAfterObservation !== false) throw new Error("H1_FREEZE_NOT_READY");

const cases = caseRegistry.cases as HumanReviewCase[];
const packs = inputRegistry.packs as FrozenInputPack[];

const terminalStageFor = (error: string | null, ownerInvocationCount: number) => {
  if (!error) return null;
  if (error.includes("STALE")) return "STALE_VALIDATION" as const;
  if (ownerInvocationCount > 0) return "SCIENTIFIC_THINKING_ENGINE" as const;
  if (error.includes("PROJECT_SNAPSHOT") || error.includes("PROJECT_BINDING")) return "PROJECT_CONTEXT" as const;
  if (error.includes("LEDGER") || error.includes("DEPENDENCY") || error.includes("NOT_FOUND")) return "OWNER_RESULT_PERSISTENCE" as const;
  return "KNOWLEDGE_TO_ST_HANDOFF" as const;
};

const runCase = (caseItem: HumanReviewCase, pack: FrozenInputPack, replay: boolean, ordinal: number) => {
  const minute = String(ordinal).padStart(2, "0");
  const startedAt = `2026-08-26T${replay ? "15" : "14"}:${minute}:00.000Z`;
  const completedAt = `2026-08-26T${replay ? "15" : "14"}:${minute}:01.000Z`;
  const runId = `scientific-run:${caseRegistry.campaignId}:${caseItem.caseId}:${replay ? "replay" : "primary"}`;
  const recorder = createScientificRunTraceRecorder({
    ledger: createScientificExecutionTraceLedger(`session:${caseRegistry.campaignId}:${caseItem.caseId}:${replay ? "replay" : "primary"}`),
    runId,
    projectSnapshot: pack.payload.projectSnapshot,
    initiatorContext: { kind: replay ? "REPLAY_ANALYSIS" : "TEST_HARNESS", initiatorRef: `${caseRegistry.campaignId}:${caseItem.caseId}:${replay ? "replay" : "primary"}` },
    startedAt,
    createdAt: startedAt,
  });
  let invocation: any | null = null;
  let error: string | null = null;
  let ownerInvocationCount = 0;
  let startedOwnerRequest: ScientificThinkingInput | null = null;
  const instrumentedRuntime = (request: ScientificThinkingInput) => {
    ownerInvocationCount += 1;
    startedOwnerRequest = structuredClone(request);
    return executeScientificThinkingEngine(request);
  };
  try {
    invocation = invokeScientificThinkingForProject({
      project: structuredClone(pack.payload.project),
      projectSnapshot: structuredClone(pack.payload.projectSnapshot),
      knowledgeResultId: pack.payload.knowledgeResultId,
      ledger: rehydrateProductOwnerResultLedger(pack.payload.ledger as any),
      callerRef: `${caseRegistry.campaignId}:${caseItem.caseId}:${replay ? "replay" : "primary"}`,
      purpose: caseItem.purpose,
      startedAt,
      completedAt,
      retainedAt: completedAt,
      runtime: instrumentedRuntime,
      monotonicNow: () => 0,
      trace: recorder,
    });
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "UNKNOWN_ERROR";
  }
  if (!error && invocation?.result === null && invocation?.observation?.failureCode) error = invocation.observation.failureCode;
  const terminalStage = terminalStageFor(error, ownerInvocationCount);
  const traceRun = error ? recorder.fail(completedAt, error, terminalStage ?? "UNKNOWN_STAGE") : recorder.complete(completedAt);
  const traceLedger = recorder.getLedger();
  const traceEvents = listScientificRunEvents({ ledger: traceLedger, runId });
  const traceEventTypes = traceEvents.map((item) => item.eventType);
  const ownerResultCount = invocation?.result ? 1 : 0;
  const output = invocation?.result?.nativePayload ?? null;
  const request = invocation?.request?.nativeInput ?? startedOwnerRequest;
  const deterministic = runDeterministicChecks({ caseItem, pack, invocation, error, ownerInvocationCount, ownerResultCount, traceEventTypes });
  const expectedRejection = caseItem.expectedExecution === "PRE_OWNER_REJECTION_EXPECTED" && error === caseItem.expectedRejectionCode && ownerInvocationCount === 0 && ownerResultCount === 0;
  const terminalOutcome = expectedRejection ? "EXPECTED_PRE_OWNER_REJECTION"
    : !error && ownerInvocationCount === 1 && ownerResultCount === 1 ? "OWNER_RESULT_PRODUCED"
      : ownerInvocationCount > 0 ? "OWNER_EXECUTION_FAILURE" : "TECHNICAL_PRE_OWNER_FAILURE";
  const candidateCounts = {
    questions: output?.questions?.length ?? 0,
    hypotheses: output?.hypotheses?.length ?? 0,
    objectives: output?.objectives?.length ?? 0,
    mechanisms: output?.mechanisms?.length ?? 0,
    alternatives: output?.alternatives?.length ?? 0,
    scientificModels: output?.scientificModels?.length ?? 0,
  };
  return {
    caseId: caseItem.caseId,
    executionKind: replay ? "PRESELECTED_DETERMINISM_REPLAY" : "H1_PRIMARY_ONE_PASS",
    inputPackDigest: pack.digest,
    runId,
    startedAt,
    completedAt,
    durationMs: 1000,
    expectedExecution: caseItem.expectedExecution,
    expectedOwnerResult: caseItem.expectedExecution === "OWNER_EXECUTION_REQUIRED",
    stInvoked: ownerInvocationCount === 1,
    ownerInvocationCount,
    ownerResultProduced: ownerResultCount === 1,
    ownerResultCount,
    terminalOutcome,
    terminalStage,
    error,
    requestRef: request?.requestId ?? null,
    requestDigest: request ? logicalDigest(request) : null,
    stRequest: request,
    ownerResultRef: invocation?.result ? `${invocation.result.resultId}@${invocation.result.resultVersion}` : null,
    resultDigest: output?.outputDigest ?? null,
    candidateCounts,
    stOutput: output,
    ownerResultMetadata: invocation?.result ? {
      resultId: invocation.result.resultId,
      resultVersion: invocation.result.resultVersion,
      owner: invocation.result.owner,
      capabilityId: invocation.result.capabilityId,
      sourceProjectRef: invocation.result.sourceProjectRef,
      sourceProjectVersion: invocation.result.sourceProjectVersion,
      sourceProjectDigest: invocation.result.sourceProjectDigest,
      sourceSnapshotDigest: invocation.result.sourceSnapshotDigest,
      projectWriteAuthorized: invocation.result.projectWriteAuthorized,
      evidenceRefs: invocation.result.evidenceRefs,
      gaps: invocation.result.gaps,
      limitations: invocation.result.limitations,
      provenance: invocation.result.provenance,
      dependencies: invocation.entry.dependencies,
    } : null,
    projectWrites: invocation?.projectWrites ?? 0,
    providerCalls: 0,
    llmCalls: 0,
    externalNetworkCalls: 0,
    privateReasoningStored: false,
    trace: {
      run: traceRun,
      ledgerDigest: traceLedger.ledgerDigest,
      eventCount: traceEvents.length,
      eventTypes: traceEventTypes,
      eventRefs: traceEvents.map((item) => item.eventId),
      events: traceEvents,
      complete: deterministic.globalControls.TRACE_INCOMPLETE === "PASS",
    },
    deterministic,
    firstDivergentTechnicalStage: deterministic.technicalFailure ? terminalStage ?? "DETERMINISTIC_CHECKER" : null,
    scientificJudgmentPerformed: false,
    humanReviewStatus: "PENDING",
  };
};

const primaryRuns = cases.map((caseItem, index) => {
  const pack = packs.find((item) => item.sourceCase === caseItem.caseId);
  if (!pack) throw new Error(`H1_PACK_MISSING:${caseItem.caseId}`);
  return runCase(caseItem, pack, false, index + 1);
});

const replaySelection = freeze.replaySelection as Array<{ caseId: string; role: string }>;
const replayRuns = replaySelection.map((selection, index) => {
  const caseItem = cases.find((item) => item.caseId === selection.caseId);
  const pack = packs.find((item) => item.sourceCase === selection.caseId);
  if (!caseItem || !pack) throw new Error(`H1_REPLAY_INPUT_MISSING:${selection.caseId}`);
  const replay = runCase(caseItem, pack, true, index + 1);
  const primary = primaryRuns.find((item) => item.caseId === selection.caseId)!;
  const deterministic = primary.resultDigest === replay.resultDigest
    && primary.terminalOutcome === replay.terminalOutcome
    && primary.error === replay.error
    && stable(primary.candidateCounts) === stable(replay.candidateCounts)
    && stable(primary.deterministic.globalControls) === stable(replay.deterministic.globalControls);
  return {
    caseId: selection.caseId,
    role: selection.role,
    primaryRunId: primary.runId,
    replayRunId: replay.runId,
    primaryResultDigest: primary.resultDigest,
    replayResultDigest: replay.resultDigest,
    primaryTerminalOutcome: primary.terminalOutcome,
    replayTerminalOutcome: replay.terminalOutcome,
    deterministic,
    scientificJudgmentPerformed: false,
    replay,
  };
});

const technicalFailures = primaryRuns.filter((item) => item.deterministic.technicalFailure || !["OWNER_RESULT_PRODUCED", "EXPECTED_PRE_OWNER_REJECTION"].includes(item.terminalOutcome));
const traceComplete = primaryRuns.filter((item) => item.trace.complete).length;
const globalControlNames = [
  "UNSUPPORTED_STRUCTURAL_PROMOTION", "KNOWLEDGE_GAP_LOSS", "CONTRADICTION_LOSS", "PROJECT_QUESTION_DRIFT",
  "LINEAGE_BREAK", "OWNERSHIP_LEAK", "PROJECT_WRITES", "STALE_PROTECTION_FAILURE", "TRACE_INCOMPLETE",
] as const;
const globalSummary = Object.fromEntries(globalControlNames.map((name) => {
  const outcomes = primaryRuns.map((item) => item.deterministic.globalControls[name]);
  return [name, {
    pass: outcomes.filter((item) => item === "PASS").length,
    fail: outcomes.filter((item) => item === "FAIL").length,
    notApplicable: outcomes.filter((item) => item === "NOT_APPLICABLE").length,
    verdict: outcomes.includes("FAIL") ? "FAIL" : "PASS",
  }];
}));
const humanPending = humanTemplate.cases.filter((item: any) => Object.entries(item).filter(([key]) => /^H[1-8]$/.test(key)).every(([, value]) => value === "PENDING")).length;
const packetReady = primaryRuns.length === cases.length
  && primaryRuns.every((item) => item.executionKind === "H1_PRIMARY_ONE_PASS")
  && technicalFailures.length === 0
  && traceComplete === cases.length
  && replayRuns.length === 3
  && replayRuns.every((item) => item.deterministic)
  && humanPending === cases.length;

const executionResults = {
  contract: "W1_QUAL_01H1_ST_EXECUTION_RESULTS",
  version: "1.0.0",
  campaignId: caseRegistry.campaignId,
  campaignFreezeDigest: freeze.freezeDigest,
  primaryExecutionPolicy: "EXACTLY_ONE_PER_CASE_NO_REROLL_NO_REPAIR",
  primaryExecutions: primaryRuns.length,
  rerolls: 0,
  repairs: 0,
  stRuntimeModified: false,
  results: primaryRuns,
};
const deterministicChecks = {
  contract: "W1_QUAL_01H1_ST_DETERMINISTIC_CHECKS",
  version: "1.0.0",
  campaignId: caseRegistry.campaignId,
  scientificPassProduced: false,
  scientificJudgmentPerformed: false,
  cases: primaryRuns.map((item) => ({ caseId: item.caseId, technicalFailure: item.deterministic.technicalFailure, checks: item.deterministic.checks, globalControls: item.deterministic.globalControls })),
  globalSummary,
  counts: {
    checks: primaryRuns.reduce((sum, item) => sum + item.deterministic.checks.length, 0),
    pass: primaryRuns.flatMap((item) => item.deterministic.checks).filter((item) => item.outcome === "PASS").length,
    fail: primaryRuns.flatMap((item) => item.deterministic.checks).filter((item) => item.outcome === "FAIL").length,
    notApplicable: primaryRuns.flatMap((item) => item.deterministic.checks).filter((item) => item.outcome === "NOT_APPLICABLE").length,
  },
};
const terminalOutcomes = {
  contract: "W1_QUAL_01H1_ST_TERMINAL_OUTCOMES",
  version: "1.0.0",
  campaignId: caseRegistry.campaignId,
  cases: primaryRuns.map((item) => ({ caseId: item.caseId, expectedExecution: item.expectedExecution, terminalOutcome: item.terminalOutcome, error: item.error, stInvoked: item.stInvoked, ownerResultProduced: item.ownerResultProduced, firstDivergentTechnicalStage: item.firstDivergentTechnicalStage })),
  counts: {
    ownerResultsProduced: primaryRuns.filter((item) => item.terminalOutcome === "OWNER_RESULT_PRODUCED").length,
    expectedPreOwnerRejections: primaryRuns.filter((item) => item.terminalOutcome === "EXPECTED_PRE_OWNER_REJECTION").length,
    unexpectedFailures: technicalFailures.length,
  },
};
const determinismReplays = {
  contract: "W1_QUAL_01H1_ST_DETERMINISM_REPLAYS",
  version: "1.0.0",
  campaignId: caseRegistry.campaignId,
  preselectedBeforeObservation: true,
  selection: replaySelection,
  replays: replayRuns,
  counts: { selected: replayRuns.length, stable: replayRuns.filter((item) => item.deterministic).length, divergent: replayRuns.filter((item) => !item.deterministic).length },
};
const traceIndex = {
  contract: "W1_QUAL_01H1_ST_TRACE_INDEX",
  version: "1.0.0",
  campaignId: caseRegistry.campaignId,
  traceLedgerVersion: freeze.traceVersion.ledger,
  traceEventSchemaVersion: freeze.traceVersion.eventSchema,
  primaryRuns: primaryRuns.map((item) => ({ caseId: item.caseId, runId: item.runId, ledgerDigest: item.trace.ledgerDigest, eventCount: item.trace.eventCount, eventTypes: item.trace.eventTypes, eventRefs: item.trace.eventRefs, complete: item.trace.complete, requestRef: item.requestRef, ownerResultRef: item.ownerResultRef, resultDigest: item.resultDigest, terminalOutcome: item.terminalOutcome, durationMs: item.durationMs, error: item.error, firstDivergentTechnicalStage: item.firstDivergentTechnicalStage })),
  replayRuns: replayRuns.map((item) => ({ caseId: item.caseId, role: item.role, runId: item.replayRunId, deterministic: item.deterministic, ledgerDigest: item.replay.trace.ledgerDigest, eventRefs: item.replay.trace.eventRefs })),
  counts: { primaryRuns: primaryRuns.length, completePrimaryRuns: traceComplete, replayRuns: replayRuns.length },
  privateChainOfThoughtRecorded: false,
};

write("execution-results.json", executionResults);
write("deterministic-checks.json", deterministicChecks);
write("terminal-outcomes.json", terminalOutcomes);
write("determinism-replays.json", determinismReplays);
write("trace-index.json", traceIndex);

const outputFiles = ["execution-results.json", "deterministic-checks.json", "terminal-outcomes.json", "determinism-replays.json", "trace-index.json"];
const outputDigests = Object.fromEntries(outputFiles.map((name) => [name, logicalDigest(read<any>(name))]));
const manifestMaterial = {
  campaignId: caseRegistry.campaignId,
  freezeDigest: freeze.freezeDigest,
  gitHeadAtFreeze: freeze.gitHead,
  stVersion: freeze.stVersion,
  stRuntimeModified: false,
  cases: cases.length,
  primaryRuns: primaryRuns.length,
  replayRuns: replayRuns.length,
  traceComplete,
  humanAdjudicationCompleted: 0,
  humanAdjudicationPending: humanPending,
  technicalFailures: technicalFailures.length,
  outputDigests,
  finalDecision: packetReady ? "W1_QUAL_01H1_ST_HUMAN_REVIEW_PACKET_READY" : "W1_QUAL_01H1_REVIEW_PACKET_NOT_READY",
};
const campaignManifest = {
  contract: "W1_QUAL_01H1_ST_CAMPAIGN_MANIFEST",
  version: "1.0.0",
  ...manifestMaterial,
  manifestDigest: logicalDigest(manifestMaterial),
  level: "LEVEL_3_IMPLEMENTATION_EVIDENCE",
  normative: false,
  automatedScientificAdjudication: false,
  scientificThinkingCharacterized: false,
  scientificPassClaimed: false,
  pd011QualificationClaimed: false,
  projectWrites: primaryRuns.reduce((sum, item) => sum + item.projectWrites, 0),
  llmCalls: 0,
  providerCalls: 0,
  externalNetworkCalls: 0,
  privateChainOfThoughtRecorded: false,
  humanReviewPacketReady: packetReady,
};
write("campaign-manifest.json", campaignManifest);

if (!packetReady) throw new Error(`H1_REVIEW_PACKET_NOT_READY:${stable({ technicalFailures: technicalFailures.map((item) => item.caseId), traceComplete, replays: determinismReplays.counts, humanPending, globalSummary })}`);

console.log(stable({
  phase: "H1_EXECUTE",
  campaignId: caseRegistry.campaignId,
  finalDecision: campaignManifest.finalDecision,
  primaryRuns: primaryRuns.length,
  terminalOutcomes: terminalOutcomes.counts,
  deterministicChecks: deterministicChecks.counts,
  trace: traceIndex.counts,
  replays: determinismReplays.counts,
  humanAdjudication: { completed: 0, pending: humanPending },
  stRuntimeModified: false,
}));
