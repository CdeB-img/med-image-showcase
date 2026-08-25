/* eslint-disable @typescript-eslint/no-explicit-any -- executes frozen heterogeneous campaign evidence */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { logicalDigest, stableStringify } from "@/features/knowledge-engine";
import { runFrozenScientificThinkingCase } from "../../harness/runner";
import { validateCompletedCampaign } from "../../harness/validator";

const ROOT = resolve(import.meta.dirname, "../../../..");
const OUT = resolve(ROOT, "validation/w1-qual-01r2-st/campaign-c");
const HARNESS = resolve(ROOT, "validation/w1-qual-01r2-st/harness");
const stable = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const read = <T>(name: string) => JSON.parse(readFileSync(resolve(OUT, name), "utf8")) as T;
const write = (name: string, value: unknown) => writeFileSync(resolve(OUT, name), stable(value), "utf8");
const sha = (path: string) => `sha256-${createHash("sha256").update(readFileSync(path)).digest("hex")}`;

const harnessFreeze = JSON.parse(readFileSync(resolve(HARNESS, "harness-freeze.json"), "utf8")) as any;
for (const [name, expected] of Object.entries(harnessFreeze.sourceDigests as Record<string, string>)) {
  const observed = sha(resolve(HARNESS, name));
  if (observed !== expected) throw new Error(`FROZEN_HARNESS_MODIFIED_AFTER_R2_FREEZE:${name}:${expected}:${observed}`);
}
const freeze = read<any>("characterization-freeze.json");
const caseRegistry = read<any>("case-registry.json");
const envelopeRegistry = read<any>("acceptance-envelope-registry.json");
const inputRegistry = read<any>("frozen-input-registry.json");
const parentageAudit = read<any>("parentage-audit.json");
const knowledgeGate = read<any>("knowledge-input-quality-gate.json");
const observedDigests = {
  caseRegistry: logicalDigest(caseRegistry),
  acceptanceEnvelopeRegistry: logicalDigest(envelopeRegistry),
  frozenInputRegistry: logicalDigest(inputRegistry),
  parentageAudit: logicalDigest(parentageAudit),
  knowledgeInputQualityGate: logicalDigest(knowledgeGate),
};
if (stableStringify(observedDigests) !== stableStringify(freeze.registryDigests)) throw new Error("CAMPAIGN_C_FROZEN_REGISTRY_DIGEST_MISMATCH");
if (freeze.harnessDigest !== harnessFreeze.harnessDigest || freeze.evaluatorDigest !== harnessFreeze.evaluatorDigest) throw new Error("CAMPAIGN_C_HARNESS_BINDING_MISMATCH");
if (freeze.status !== "CHARACTERIZATION_FREEZE_READY" || freeze.observationOccurred !== false || freeze.mutableAfterObservation !== false) throw new Error("CAMPAIGN_C_FREEZE_NOT_READY");

const cases = caseRegistry.cases as any[];
const envelopes = envelopeRegistry.envelopes as any[];
const packs = inputRegistry.packs as any[];
const packValid = (pack: any) => logicalDigest({
  version: pack.version,
  sourceCase: pack.sourceCase,
  provenance: pack.provenance,
  purpose: pack.purpose,
  controlledStaleRecipe: pack.controlledStaleRecipe,
  knowledgeGateBinding: pack.knowledgeGateBinding,
  payload: pack.payload,
}) === pack.digest;

const primaryResults = cases.map((caseItem, index) => {
  const envelope = envelopes.find((item) => item.caseId === caseItem.caseId);
  const pack = packs.find((item) => item.sourceCase === caseItem.caseId);
  if (!envelope || !pack) throw new Error(`CAMPAIGN_C_FROZEN_MATERIAL_MISSING:${caseItem.caseId}`);
  const minute = String(index).padStart(2, "0");
  return runFrozenScientificThinkingCase({
    campaignId: freeze.campaignId,
    caseItem,
    envelope,
    pack,
    startedAt: `2026-08-26T10:${minute}:00.000Z`,
    completedAt: `2026-08-26T10:${minute}:01.000Z`,
    replay: false,
    frozenInputValid: packValid(pack),
  });
});

const replaySelection = freeze.replaySelection as Array<{ caseId: string; role: string }>;
const replayRuns = replaySelection.map((selection, index) => {
  const caseItem = cases.find((item) => item.caseId === selection.caseId);
  const envelope = envelopes.find((item) => item.caseId === selection.caseId);
  const pack = packs.find((item) => item.sourceCase === selection.caseId);
  if (!caseItem || !envelope || !pack) throw new Error(`CAMPAIGN_C_REPLAY_MATERIAL_MISSING:${selection.caseId}`);
  const minute = String(index).padStart(2, "0");
  const replay = runFrozenScientificThinkingCase({
    campaignId: freeze.campaignId,
    caseItem,
    envelope,
    pack,
    startedAt: `2026-08-26T11:${minute}:00.000Z`,
    completedAt: `2026-08-26T11:${minute}:01.000Z`,
    replay: true,
    frozenInputValid: packValid(pack),
  });
  const primary = primaryResults.find((item) => item.caseId === selection.caseId)!;
  const deterministic = replay.outputDigest === primary.outputDigest
    && replay.status === primary.status
    && replay.error === primary.error
    && replay.executionOutcome.kind === primary.executionOutcome.kind
    && stableStringify(replay.candidateCounts) === stableStringify(primary.candidateCounts)
    && stableStringify(replay.evaluations) === stableStringify(primary.evaluations);
  return {
    caseId: selection.caseId,
    role: selection.role,
    primaryRunId: primary.traceRunId,
    replayRunId: replay.traceRunId,
    deterministic,
    primaryLogicalOutputDigest: primary.outputDigest,
    replayLogicalOutputDigest: replay.outputDigest,
    primaryError: primary.error,
    replayError: replay.error,
    primaryOutcome: primary.executionOutcome.kind,
    replayOutcome: replay.executionOutcome.kind,
    replay,
  };
});

const validation = validateCompletedCampaign({
  caseIds: cases.map((item) => item.caseId),
  primaryResults: primaryResults.map((item) => ({
    caseId: item.caseId,
    traceQualificationComplete: item.traceQualificationComplete,
    executionOutcome: item.executionOutcome,
    ownerInvocationCount: item.qualificationTrace.ownerInvocationCount,
    ownerResultCount: item.qualificationTrace.ownerResultCount,
    expectedExecutionMode: cases.find((candidate) => candidate.caseId === item.caseId).expectedExecutionMode,
  })),
  replayResults: replayRuns.map((item) => ({ caseId: item.caseId, deterministic: item.deterministic })),
  qualifyingPasses: 1,
  rerolls: 0,
  runtimeRepairs: 0,
  harnessRepairsAfterExposure: 0,
});

const terminalCounts = {
  ownerResultTerminations: primaryResults.filter((item) => item.executionOutcome.kind === "OWNER_RESULT_PRODUCED").length,
  expectedPreOwnerRejections: cases.filter((item) => item.expectedExecutionMode === "PRE_OWNER_REJECTION_EXPECTED").length,
  expectedPreOwnerRejectionsCorrect: primaryResults.filter((item) => item.executionOutcome.kind === "EXPECTED_PRE_OWNER_REJECTION").length,
  unexpectedPreOwnerFailures: primaryResults.filter((item) => item.executionOutcome.kind === "UNEXPECTED_PRE_OWNER_FAILURE").length,
  ownerExecutionFailures: primaryResults.filter((item) => item.executionOutcome.kind === "OWNER_EXECUTION_FAILURE").length,
  nonAdjudicableTechnicalFailures: primaryResults.filter((item) => item.executionOutcome.kind === "NON_ADJUDICABLE_TECHNICAL_FAILURE").length,
};
const ownerCritical = primaryResults.flatMap((item) => item.evaluations
  .filter((evaluation: any) => evaluation.critical && evaluation.outcome === "VIOLATED")
  .map((evaluation: any) => ({ caseId: item.caseId, ...evaluation })));
const technicalBlockers = primaryResults.filter((item) => item.caseVerdict === "NON_ADJUDICABLE");
const humanArbitrations = primaryResults.filter((item) => item.caseVerdict === "HUMAN_ARBITRATION_REQUIRED");
const nonCriticalLimitations = primaryResults.flatMap((item) => item.evaluations
  .filter((evaluation: any) => !evaluation.critical && ["PARTIALLY_SATISFIED", "VIOLATED"].includes(evaluation.outcome))
  .map((evaluation: any) => ({ caseId: item.caseId, ...evaluation })));
const campaignValid = validation.valid && technicalBlockers.length === 0;
const characterization = !campaignValid ? "NOT_ADJUDICATED"
  : humanArbitrations.length ? "HUMAN_ARBITRATION_REQUIRED"
    : ownerCritical.length || terminalCounts.ownerExecutionFailures ? "OWNER_REPAIR_REQUIRED"
      : nonCriticalLimitations.length ? "CHARACTERIZED_WITH_LIMITATIONS"
        : "CHARACTERIZED_WITHIN_BOUNDED_SCOPE";

const positiveCases = cases.filter((item) => item.negativeExpectationMode === "CANDIDATE_REQUIRED");
const positiveCovered = primaryResults.filter((result) => {
  const caseItem = positiveCases.find((item) => item.caseId === result.caseId);
  return caseItem && result.candidateCounts.hypotheses > 0 && result.candidateCounts.objectives > 0 && result.caseVerdict !== "NON_ADJUDICABLE";
}).length;
const negativeOrConditional = cases.filter((item) => item.negativeExpectationMode !== "CANDIDATE_REQUIRED");
const negativeOrConditionalCorrect = primaryResults.filter((result) => {
  const caseItem = negativeOrConditional.find((item) => item.caseId === result.caseId);
  const check = result.evaluations.find((item: any) => item.checkId === "NEGATIVE_EXPECTATION");
  return caseItem && check?.outcome === "SATISFIED";
}).length;
const failureClassCount = (failureClass: string) => ownerCritical.filter((item) => item.failureClass === failureClass).length;
const epistemicSafety = {
  unsupportedHypothesis: failureClassCount("UNSUPPORTED_HYPOTHESIS"),
  evidencePromotion: failureClassCount("EVIDENCE_PROMOTION"),
  knowledgeGapLoss: failureClassCount("KNOWLEDGE_GAP_LOSS"),
  contradictionLoss: failureClassCount("CONTRADICTION_LOSS"),
  projectQuestionDrift: failureClassCount("PROJECT_QUESTION_DRIFT"),
  lineageBreak: failureClassCount("LINEAGE_BREAK"),
  ownershipLeak: failureClassCount("OWNERSHIP_LEAK"),
  projectWrites: primaryResults.reduce((sum, item) => sum + item.projectWrites, 0),
  staleProtectionFailure: primaryResults.filter((item) => cases.find((candidate) => candidate.caseId === item.caseId)?.staleExpected && item.executionOutcome.kind !== "EXPECTED_PRE_OWNER_REJECTION").length,
};
const traceMetrics = {
  qualifyingCases: cases.length,
  traceCompleteCases: primaryResults.filter((item) => item.traceQualificationComplete === "YES").length,
  ownerInvocationsExpected: cases.filter((item) => item.expectedExecutionMode === "OWNER_EXECUTION_REQUIRED").length,
  ownerInvocationsObserved: primaryResults.reduce((sum, item) => sum + item.qualificationTrace.ownerInvocationCount, 0),
  preOwnerRejectionsExpected: terminalCounts.expectedPreOwnerRejections,
  preOwnerRejectionsObserved: terminalCounts.expectedPreOwnerRejectionsCorrect,
};

write("independent-results.json", {
  contract: "W1_QUAL_01R2_ST_CAMPAIGN_C_INDEPENDENT_RESULTS",
  version: "1.0.0",
  campaignId: freeze.campaignId,
  campaignFreezeDigest: freeze.freezeDigest,
  campaignValid,
  qualifyingPasses: 1,
  primaryExecutions: primaryResults.length,
  rerolls: 0,
  runtimeRepairs: 0,
  harnessRepairsAfterExposure: 0,
  results: primaryResults,
});
write("obligation-adjudication.json", {
  contract: "W1_QUAL_01R2_ST_CAMPAIGN_C_OBLIGATION_ADJUDICATION",
  version: "1.0.0",
  campaignId: freeze.campaignId,
  results: primaryResults.map((item) => ({ caseId: item.caseId, caseVerdict: item.caseVerdict, executionOutcome: item.executionOutcome.kind, ownerCharacterizationStatus: item.ownerCharacterizationStatus, evaluations: item.evaluations })),
  counts: {
    obligations: primaryResults.reduce((sum, item) => sum + item.evaluations.length, 0),
    satisfied: primaryResults.flatMap((item) => item.evaluations).filter((item: any) => item.outcome === "SATISFIED").length,
    notApplicable: primaryResults.flatMap((item) => item.evaluations).filter((item: any) => item.outcome === "NOT_APPLICABLE").length,
    violated: primaryResults.flatMap((item) => item.evaluations).filter((item: any) => item.outcome === "VIOLATED").length,
    nonAdjudicable: primaryResults.flatMap((item) => item.evaluations).filter((item: any) => item.outcome === "NON_ADJUDICABLE").length,
    criticalViolations: ownerCritical.length,
  },
});
write("terminal-outcome-results.json", {
  contract: "W1_QUAL_01R2_ST_CAMPAIGN_C_TERMINAL_OUTCOMES",
  version: "1.0.0",
  campaignId: freeze.campaignId,
  ...terminalCounts,
  cases: primaryResults.map((item) => ({ caseId: item.caseId, kind: item.executionOutcome.kind, ownerInvocationCount: item.qualificationTrace.ownerInvocationCount, ownerResultCount: item.qualificationTrace.ownerResultCount, failureClass: item.executionOutcome.failureClass, ownerRepairRequired: item.executionOutcome.ownerRepairRequired })),
});
write("failure-registry.json", {
  contract: "W1_QUAL_01R2_ST_CAMPAIGN_C_FAILURE_REGISTRY",
  version: "1.0.0",
  campaignId: freeze.campaignId,
  failures: [
    ...technicalBlockers.map((item) => ({ caseId: item.caseId, class: item.failureClass, firstDivergentStage: item.firstDivergentStage, owner: "TECHNICAL_STAGE_NOT_ST" })),
    ...ownerCritical.map((item) => ({ caseId: item.caseId, class: item.failureClass, firstDivergentStage: item.firstDivergentStage, owner: "SCIENTIFIC_THINKING" })),
  ],
  counts: { technical: technicalBlockers.length, ownerCritical: ownerCritical.length, humanArbitration: humanArbitrations.length },
});
write("determinism-replay-results.json", {
  contract: "W1_QUAL_01R2_ST_CAMPAIGN_C_DETERMINISM_REPLAY_RESULTS",
  version: "1.0.0",
  campaignId: freeze.campaignId,
  preselectedBeforeObservation: true,
  replays: replayRuns,
  counts: { selected: replayRuns.length, stable: replayRuns.filter((item) => item.deterministic).length, divergent: replayRuns.filter((item) => !item.deterministic).length },
  status: replayRuns.every((item) => item.deterministic) ? "STABLE" : "NON_DETERMINISTIC_BEHAVIOR",
});
write("trace-index.json", {
  contract: "W1_QUAL_01R2_ST_CAMPAIGN_C_TRACE_INDEX",
  version: "1.0.0",
  campaignId: freeze.campaignId,
  metrics: traceMetrics,
  primaryRuns: primaryResults.map((item) => ({ caseId: item.caseId, runId: item.traceRunId, ledgerDigest: item.traceLedgerDigest, eventRefs: item.traceEventRefs, eventTypes: item.qualificationTrace.traceEventTypes, traceQualificationComplete: item.traceQualificationComplete, executionOutcome: item.executionOutcome.kind, ownerInvocationCount: item.qualificationTrace.ownerInvocationCount, ownerResultCount: item.qualificationTrace.ownerResultCount, requestRef: item.requestRef, resultRef: item.outputResultRef, error: item.error, rejectionStage: item.qualificationTrace.rejectionStage })),
  replayRuns: replayRuns.map((item) => ({ caseId: item.caseId, runId: item.replayRunId, deterministic: item.deterministic })),
  privateChainOfThoughtRecorded: false,
});
write("characterization-summary.json", {
  contract: "W1_QUAL_01R2_ST_CAMPAIGN_C_CHARACTERIZATION_SUMMARY",
  version: "1.0.0",
  campaignId: freeze.campaignId,
  campaignStatus: campaignValid ? "COMPLETE" : "INVALID",
  harnessStatus: "READY",
  referenceStatus: "VALID",
  ownerCharacterizationStatus: characterization,
  campaignValid,
  terminalCounts,
  candidateCoverage: { opportunities: positiveCases.length, covered: positiveCovered },
  negativeConditionalSafety: { cases: negativeOrConditional.length, correct: negativeOrConditionalCorrect },
  epistemicSafety,
  trace: traceMetrics,
  determinism: { replays: replayRuns.length, stable: replayRuns.filter((item) => item.deterministic).length },
  limitations: [
    "Thirteen bounded synthetic cases do not establish universal scientific validity or PD-011 qualification.",
    "Reasoning Books are contextual references; their corpus coverage is not asserted complete.",
    "Controlled assembled-loop characterization remains not performed.",
  ],
});

const outputFiles = [
  "independent-results.json", "obligation-adjudication.json", "terminal-outcome-results.json", "failure-registry.json",
  "determinism-replay-results.json", "trace-index.json", "characterization-summary.json",
];
const outputDigests = Object.fromEntries(outputFiles.map((name) => [name, logicalDigest(read<any>(name))]));
const manifestMaterial = {
  campaignId: freeze.campaignId,
  freezeDigest: freeze.freezeDigest,
  harnessVersion: freeze.harnessVersion,
  harnessDigest: freeze.harnessDigest,
  stVersion: freeze.stVersion,
  outputDigests,
  validation,
  characterization,
};
write("campaign-manifest.json", {
  contract: "W1_QUAL_01R2_ST_CAMPAIGN_C_MANIFEST",
  version: "1.0.0",
  ...manifestMaterial,
  manifestDigest: logicalDigest(manifestMaterial),
  level: "LEVEL_3_IMPLEMENTATION_EVIDENCE",
  normative: false,
  llmCalls: 0,
  externalNetworkCalls: 0,
  pubmedCalls: 0,
  projectWrites: epistemicSafety.projectWrites,
  privateChainOfThoughtRecorded: false,
  campaignValid,
});

if (!validation.valid) throw new Error(`CAMPAIGN_C_COMPLETED_VALIDATION_FAILED:${stable(validation.findings)}`);
if (technicalBlockers.length) throw new Error(`CAMPAIGN_C_TECHNICAL_BLOCKER_AFTER_FREEZE:${technicalBlockers.map((item) => item.caseId).join(",")}`);

console.log(stable({
  phase: "C_EXECUTE",
  campaignId: freeze.campaignId,
  campaignValid,
  characterization,
  terminalCounts,
  candidateCoverage: `${positiveCovered}/${positiveCases.length}`,
  negativeConditionalSafety: `${negativeOrConditionalCorrect}/${negativeOrConditional.length}`,
  epistemicSafety,
  trace: traceMetrics,
  determinism: `${replayRuns.filter((item) => item.deterministic).length}/${replayRuns.length}`,
  obligationCriticalViolations: ownerCritical.length,
  machineValidation: validation,
}));
