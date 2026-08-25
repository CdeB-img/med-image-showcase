import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { logicalDigest } from "@/features/knowledge-engine";

const ROOT = resolve(import.meta.dirname, "../../../..");
const OUT = resolve(ROOT, "validation/w1-qual-01r1-st/campaign-b");
const stable = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const read = <T>(name: string) => JSON.parse(readFileSync(resolve(OUT, name), "utf8")) as T;
const write = (name: string, value: unknown) => writeFileSync(resolve(OUT, name), stable(value), "utf8");
const campaignId = "W1-QUAL-01R1-ST-2026-08-25-B";
const freeze = read<Record<string, unknown>>("characterization-freeze.json");
const cases = read<{ cases: Array<{ caseId: string; replayPredeclared: boolean; replayRole: string | null; negativeExpectationMode: string }> }>("case-registry.json").cases;

const blocker = {
  failureId: "W1-QUAL-01R1-B-HARNESS-STALE-NULL-STATE-01",
  failureClass: "CHARACTERIZATION_HARNESS_DEFECT",
  firstDivergentStage: "CHARACTERIZATION_HARNESS",
  responsibleOwner: "W1_QUAL_01R1_CHARACTERIZATION_HARNESS",
  detectedAt: "PRE_EXECUTION_STATIC_PREFLIGHT_AFTER_CAMPAIGN_FREEZE",
  affectedCaseClass: "B13_STALE_KNOWLEDGE",
  observedWithoutStRuntimeInvocation: true,
  defect: "The frozen EPISTEMIC_SAFETY evaluator treats an absent pre-runtime OwnerResult as projectWriteAuthorized!=false and undefined selectedQuestionCandidate as promoted, producing a false EVIDENCE_PROMOTION / OWNER_REPAIR_REQUIRED verdict after a correct STALE_KNOWLEDGE_RESULT rejection.",
  deterministicEvidence: {
    syntheticState: "invocation=null,error=STALE_KNOWLEDGE_RESULT,TRACE_COMPLETE=YES",
    observedCaseVerdict: "CRITICAL_VIOLATION",
    observedOwnerCharacterizationStatus: "OWNER_REPAIR_REQUIRED",
    observedEvaluation: {
      checkId: "EPISTEMIC_SAFETY",
      outcome: "VIOLATED",
      evidence: ["primaryUnsupported=false", "promotion=true", "projectWriteAuthorized=false"],
    },
    correctDisposition: "HARNESS_DEFECT_OWNER_NOT_ADJUDICATED",
  },
  stDefectEstablished: false,
  ownerRepairAuthorized: false,
  postFreezeHarnessRepairPerformed: false,
  campaignBExecutionAuthorized: false,
};
write("preexecution-harness-failure-adjudication.json", {
  contract: "W1_QUAL_01R1_ST_CAMPAIGN_B_PREEXECUTION_HARNESS_FAILURE_ADJUDICATION",
  version: "1.0.0",
  campaignId,
  campaignFreezeDigest: freeze.freezeDigest,
  blocker,
  campaignStatus: "BLOCKED_BY_CHARACTERIZATION_HARNESS",
  harnessStatus: "NOT_READY",
  referenceStatus: "VALID",
  ownerCharacterizationStatus: "NOT_ADJUDICATED",
  campaignBIndependentEvidenceStatus: "INVALID_BEFORE_FIRST_OWNER_INVOCATION",
  campaignBInputsNowExposedToHarnessForensics: true,
  futureIndependentNumeratorReuseAuthorized: false,
  globalDecision: "W1_QUAL_01R1_BLOCKED_BY_CHARACTERIZATION_HARNESS",
  nextAuthorizedMission: "W1-QUAL-01R2_ST_CHARACTERIZATION_HARNESS_REPAIR",
});

const independentResults = {
  contract: "W1_QUAL_01R1_ST_CAMPAIGN_B_INDEPENDENT_RESULTS",
  version: "1.0.0",
  campaignId,
  campaignValid: false,
  qualifyingPasses: 0,
  stRuntimeInvocations: 0,
  results: [],
  blockedBy: blocker.failureId,
  note: "No ST output was observed; no owner result can be adjudicated.",
};
const adjudication = {
  contract: "W1_QUAL_01R1_ST_CAMPAIGN_B_OBLIGATION_ADJUDICATION",
  version: "1.0.0",
  campaignId,
  ownerObligationsAdjudicated: 0,
  adjudications: [],
  ownerVerdict: "NOT_ADJUDICATED",
  blockedBy: blocker.failureId,
};
const failureRegistry = {
  contract: "W1_QUAL_01R1_ST_CAMPAIGN_B_FAILURE_REGISTRY",
  version: "1.0.0",
  campaignId,
  failures: [blocker],
  counts: { harness: 1, reference: 0, frozenInput: 0, trace: 0, stOwner: 0, humanArbitration: 0 },
  initialArchitecturalOrOwnerFailureEstablished: false,
};
const replay = {
  contract: "W1_QUAL_01R1_ST_CAMPAIGN_B_DETERMINISM_REPLAY_RESULTS",
  version: "1.0.0",
  campaignId,
  selectionMadeBeforeObservation: true,
  selected: cases.filter((item) => item.replayPredeclared).map((item) => ({ caseId: item.caseId, role: item.replayRole })),
  replaysPerformed: 0,
  stableReplays: 0,
  results: [],
  status: "NOT_PERFORMED_CAMPAIGN_BLOCKED_BEFORE_OWNER_INVOCATION",
};
const traceIndex = {
  contract: "W1_QUAL_01R1_ST_CAMPAIGN_B_TRACE_INDEX",
  version: "1.0.0",
  campaignId,
  qualifyingRuns: 0,
  traceCompleteRuns: 0,
  replayRuns: 0,
  traceItems: [],
  privateChainOfThoughtRecorded: false,
  status: "NO_OWNER_RUNS_CAMPAIGN_BLOCKED_BY_FROZEN_HARNESS",
};
const summary = {
  contract: "W1_QUAL_01R1_ST_CAMPAIGN_B_CHARACTERIZATION_SUMMARY",
  version: "1.0.0",
  campaignId,
  campaignStatus: "BLOCKED_BY_CHARACTERIZATION_HARNESS",
  harnessStatus: "NOT_READY",
  referenceStatus: "VALID",
  ownerCharacterizationStatus: "NOT_ADJUDICATED",
  campaignValid: false,
  qualifyingPasses: 0,
  rerolls: 0,
  runtimeRepairs: 0,
  harnessRepairsAfterFreeze: 0,
  stRuntimeInvocations: 0,
  casesAuthoredAndFrozen: cases.length,
  casesAdjudicated: 0,
  candidateCoverage: { supportedCandidateOpportunities: null, supportedCandidateOpportunitiesCovered: null, status: "NOT_MEASURED" },
  negativeSafety: {
    strictNoCandidateCases: cases.filter((item) => item.negativeExpectationMode === "STRICT_NO_CANDIDATE_EXPECTED").length,
    strictNoCandidateCasesCorrect: null,
    conditionalCandidateAllowedCases: cases.filter((item) => item.negativeExpectationMode === "CONDITIONAL_CANDIDATE_ALLOWED").length,
    conditionalCandidateAllowedCasesValid: null,
    clarificationOrGapCases: cases.filter((item) => item.negativeExpectationMode === "CLARIFICATION_OR_GAP_EXPECTED").length,
    clarificationOrGapCasesCorrect: null,
    status: "NOT_MEASURED",
  },
  epistemicSafety: {
    unsupportedHypothesis: null, evidencePromotion: null, knowledgeGapLoss: null, contradictionLoss: null,
    projectQuestionDrift: null, lineageBreak: null, ownershipLeak: null, projectWrites: null, staleProtectionFailure: null,
    status: "NOT_MEASURED_NO_QUALIFYING_RUN",
  },
  trace: { qualifyingRuns: 0, traceCompleteRuns: 0 },
  determinism: { selected: 3, performed: 0, stable: 0, status: "NOT_PERFORMED" },
  scientificThinkingCharacterization: "NOT_ADJUDICATED",
  w1IndividualOwnerCharacterizationReady: false,
  controlledLoopCharacterizationReady: false,
  wave1Complete: false,
  wave2Authorized: false,
  nextAuthorizedMission: "W1-QUAL-01R2_ST_CHARACTERIZATION_HARNESS_REPAIR",
  globalDecision: "W1_QUAL_01R1_BLOCKED_BY_CHARACTERIZATION_HARNESS",
};

write("independent-results.json", independentResults);
write("obligation-adjudication.json", adjudication);
write("failure-registry.json", failureRegistry);
write("determinism-replay-results.json", replay);
write("trace-index.json", traceIndex);
write("characterization-summary.json", summary);

const manifestMaterial = {
  campaignId,
  campaignFreezeDigest: freeze.freezeDigest,
  frozenArtifacts: {
    cases: logicalDigest(read("case-registry.json")),
    envelopes: logicalDigest(read("acceptance-envelope-registry.json")),
    inputs: logicalDigest(read("frozen-input-registry.json")),
    parentage: logicalDigest(read("parentage-audit.json")),
    knowledgeGate: logicalDigest(read("knowledge-input-quality-gate.json")),
  },
  outputs: {
    results: logicalDigest(independentResults),
    adjudication: logicalDigest(adjudication),
    failures: logicalDigest(failureRegistry),
    replay: logicalDigest(replay),
    trace: logicalDigest(traceIndex),
    summary: logicalDigest(summary),
  },
  blockerDigest: logicalDigest(blocker),
};
write("campaign-manifest.json", {
  contract: "W1_QUAL_01R1_ST_CAMPAIGN_B_MANIFEST",
  version: "1.0.0",
  ...manifestMaterial,
  manifestDigest: logicalDigest(manifestMaterial),
  campaignNature: "EXPOSED_PREEXECUTION_HARNESS_FAILURE_EVIDENCE",
  independentStCharacterizationEvidence: false,
  qualifyingPasses: 0,
  rerolls: 0,
  stRuntimeRepairs: 0,
  postFreezeHarnessRepairs: 0,
  llmCalls: 0,
  externalNetworkCalls: 0,
  pubmedCalls: 0,
  regulatoryNetworkCalls: 0,
  finalDecision: "W1_QUAL_01R1_BLOCKED_BY_CHARACTERIZATION_HARNESS",
});

console.log(stable({ campaignId, blocker: blocker.failureId, stRuntimeInvocations: 0, qualifyingPasses: 0, decision: "W1_QUAL_01R1_BLOCKED_BY_CHARACTERIZATION_HARNESS" }));
