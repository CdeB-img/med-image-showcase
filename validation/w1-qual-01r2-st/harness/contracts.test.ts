/* eslint-disable @typescript-eslint/no-explicit-any -- tests inspect immutable historical JSON fixtures */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { adjudicateCase } from "../../w1-qual-01r1-st/harness/contracts";
import { evaluateCampaignCase as evaluateR1CampaignCase } from "../../w1-qual-01r1-st/harness/evaluator";
import {
  deriveExecutionOutcome,
  evaluateKnowledgeInputGate,
  evaluateTraceCompleteness,
  EXECUTION_OUTCOME_KINDS,
  EXPECTED_EXECUTION_MODES,
  TERMINAL_TRACE_STAGES,
  type ExpectedExecutionMode,
} from "./contracts";
import { runFrozenScientificThinkingCase } from "./runner";
import {
  validateExecutionOutcomeEvidence,
  validateHarnessDefinition,
} from "./validator";

const exposedRoot = resolve(import.meta.dirname, "../../w1-qual-01r1-st/campaign-b");
const exposed = {
  cases: JSON.parse(readFileSync(resolve(exposedRoot, "case-registry.json"), "utf8")).cases as any[],
  envelopes: JSON.parse(readFileSync(resolve(exposedRoot, "acceptance-envelope-registry.json"), "utf8")).envelopes as any[],
  inputs: JSON.parse(readFileSync(resolve(exposedRoot, "frozen-input-registry.json"), "utf8")).packs as any[],
};
const staleIndex = exposed.cases.findIndex((item) => item.staleExpected);
const validIndex = exposed.cases.findIndex((item) => item.positiveOpportunity && item.mechanisticObligation);
if (staleIndex < 0 || validIndex < 0) throw new Error("R2_EXPOSED_META_FIXTURES_MISSING");

const r2Case = (index: number, mode: ExpectedExecutionMode, codes: string[]) => ({
  ...exposed.cases[index],
  expectedExecutionMode: mode,
  expectedRejectionCodes: codes,
});
const r2Envelope = (index: number, mode: ExpectedExecutionMode) => ({
  ...exposed.envelopes[index],
  expectedExecutionMode: mode,
  ownerResultRequired: mode === "OWNER_EXECUTION_REQUIRED",
});
const run = (input: {
  index: number;
  mode: ExpectedExecutionMode;
  codes?: string[];
  pack?: (typeof exposed.inputs)[number];
  runtime?: () => never;
}) => runFrozenScientificThinkingCase({
  campaignId: "W1-QUAL-01R2-HARNESS-META",
  caseItem: r2Case(input.index, input.mode, input.codes ?? []),
  envelope: r2Envelope(input.index, input.mode),
  pack: input.pack ?? exposed.inputs[input.index],
  startedAt: "2026-08-26T08:00:00.000Z",
  completedAt: "2026-08-26T08:00:01.000Z",
  replay: false,
  frozenInputValid: true,
  runtime: input.runtime,
});

describe("W1-QUAL-01R2 harness terminal semantics", () => {
  it("reproduces the frozen R1 2.0.0 stale null-state defect as exposed development evidence", () => {
    const caseItem = exposed.cases[staleIndex];
    const result = evaluateR1CampaignCase({
      caseItem,
      envelope: exposed.envelopes[staleIndex],
      invocation: null,
      error: "STALE_KNOWLEDGE_RESULT",
      frozenInputValid: true,
      trace: {
        caseId: caseItem.caseId,
        project: { projectId: "P", projectVersion: "P:2", projectDigest: "PD2" },
        knowledgeResultRef: "K@1",
        knowledgeResultDigest: "KD",
        stRequestRef: "NOT_CREATED:STALE_KNOWLEDGE_RESULT:ST_REQUEST",
        stRequestDigest: "RD",
        stVersion: "1.2.1",
        stResultRef: "NOT_CREATED:STALE_KNOWLEDGE_RESULT:ST_RESULT",
        stResultDigest: "SD",
        status: "FAILED",
        candidateStructure: { questions: 0, hypotheses: 0, objectives: 0, mechanisms: 0, alternatives: 0, scientificModels: 0 },
        gaps: [], limitations: [], contradictions: [], firstDivergentStage: "STALE_VALIDATION", durationMs: 1, replayRefs: [],
      },
    });
    expect(result.caseVerdict).toBe("CRITICAL_VIOLATION");
    expect(result.evaluations).toContainEqual(expect.objectContaining({ checkId: "EPISTEMIC_SAFETY", outcome: "VIOLATED", failureClass: "EVIDENCE_PROMOTION" }));
  });

  it("routes valid input to one owner execution and one OwnerResult", () => {
    const result = run({ index: validIndex, mode: "OWNER_EXECUTION_REQUIRED" });
    expect(result.executionOutcome.kind).toBe("OWNER_RESULT_PRODUCED");
    expect(result.qualificationTrace.ownerInvocationCount).toBe(1);
    expect(result.qualificationTrace.ownerResultCount).toBe(1);
  });

  it("adjudicates stale input as an expected pre-owner rejection", () => {
    const result = run({ index: staleIndex, mode: "PRE_OWNER_REJECTION_EXPECTED", codes: ["STALE_KNOWLEDGE_RESULT"] });
    expect(result.executionOutcome).toEqual(expect.objectContaining({ kind: "EXPECTED_PRE_OWNER_REJECTION", ownerResult: "ABSENT_EXPECTED", failureClass: null, ownerRepairRequired: false }));
    expect(result.caseVerdict).toBe("FULLY_SATISFIED");
    expect(result.qualificationTrace.ownerInvocationCount).toBe(0);
    expect(result.qualificationTrace.ownerResultCount).toBe(0);
  });

  it("adjudicates Project ID mismatch before owner execution", () => {
    const pack = structuredClone(exposed.inputs[validIndex]);
    pack.payload.project.projectId = "project:intentional-id-mismatch";
    const result = run({ index: validIndex, mode: "PRE_OWNER_REJECTION_EXPECTED", codes: ["SCIENTIFIC_THINKING_PRODUCT_PROJECT_SNAPSHOT_MISMATCH"], pack });
    expect(result.executionOutcome.kind).toBe("EXPECTED_PRE_OWNER_REJECTION");
    expect(result.qualificationTrace.rejectionStage).toBe("PROJECT_CONTEXT");
  });

  it("adjudicates Project digest mismatch before owner execution", () => {
    const pack = structuredClone(exposed.inputs[validIndex]);
    pack.payload.project.projectDigest = "ke1-intentional-project-digest-mismatch";
    const result = run({ index: validIndex, mode: "PRE_OWNER_REJECTION_EXPECTED", codes: ["SCIENTIFIC_THINKING_PRODUCT_PROJECT_SNAPSHOT_MISMATCH"], pack });
    expect(result.executionOutcome.kind).toBe("EXPECTED_PRE_OWNER_REJECTION");
    expect(result.qualificationTrace.rejectionStage).toBe("PROJECT_CONTEXT");
  });

  it("adjudicates a Knowledge dependency mismatch before owner execution", () => {
    const pack = structuredClone(exposed.inputs[validIndex]);
    pack.payload.knowledgeResultId = "knowledge-result:intentional-missing-dependency";
    const result = run({ index: validIndex, mode: "PRE_OWNER_REJECTION_EXPECTED", codes: ["PRODUCT_KNOWLEDGE_OWNER_RESULT_NOT_FOUND"], pack });
    expect(result.executionOutcome.kind).toBe("EXPECTED_PRE_OWNER_REJECTION");
    expect(result.qualificationTrace.rejectionStage).toBe("OWNER_REQUEST_VALIDATION");
  });

  it("does not require an OwnerResult when a pre-owner rejection was expected", () => {
    const result = run({ index: staleIndex, mode: "PRE_OWNER_REJECTION_EXPECTED", codes: ["STALE_KNOWLEDGE_RESULT"] });
    expect(result.outputResultRef).toBeNull();
    expect(result.outputDigest).toBeNull();
    expect(result.traceQualificationComplete).toBe("YES");
  });

  it("does not invent evidence promotion for an absent expected OwnerResult", () => {
    const result = run({ index: staleIndex, mode: "PRE_OWNER_REJECTION_EXPECTED", codes: ["STALE_KNOWLEDGE_RESULT"] });
    expect(result.executionOutcome.evidencePromotion).toBe(false);
    expect(result.evaluations.filter((item) => item.failureClass === "EVIDENCE_PROMOTION" && item.outcome === "VIOLATED")).toHaveLength(0);
  });

  it("does not invent owner repair for an expected pre-owner rejection", () => {
    const result = run({ index: staleIndex, mode: "PRE_OWNER_REJECTION_EXPECTED", codes: ["STALE_KNOWLEDGE_RESULT"] });
    expect(result.executionOutcome.ownerRepairRequired).toBe(false);
    expect(result.ownerCharacterizationStatus).not.toBe("OWNER_REPAIR_REQUIRED");
  });

  it("does not emit a fake ST owner-execution event before a stale rejection", () => {
    const result = run({ index: staleIndex, mode: "PRE_OWNER_REJECTION_EXPECTED", codes: ["STALE_KNOWLEDGE_RESULT"] });
    expect(result.qualificationTrace.traceEventTypes).not.toContain("OWNER_INVOCATION_STARTED");
    expect(result.qualificationTrace.traceEventTypes).not.toContain("OWNER_INVOCATION_FAILED");
    expect(result.qualificationTrace.traceEventTypes).toContain("STALE_RESULT_REJECTED");
  });

  it("makes an unexpected request-building failure non-adjudicable without owner repair", () => {
    const outcome = deriveExecutionOutcome({
      expectedExecutionMode: "OWNER_EXECUTION_REQUIRED", expectedRejectionCodes: [], errorCode: "REQUEST_BUILDER_FAILED",
      rejectionStage: "OWNER_REQUEST_VALIDATION", ownerInvocationCount: 0, ownerResultCount: 0, traceEventTypes: ["HANDOFF_REJECTED"],
      projectWrites: 0, ownerResultMutations: 0, technicalAttributionKnown: true,
    });
    expect(outcome).toEqual(expect.objectContaining({ kind: "UNEXPECTED_PRE_OWNER_FAILURE", caseStatus: "NON_ADJUDICABLE", ownerRepairRequired: false }));
  });

  it("distinguishes a real owner runtime failure after valid entry", () => {
    const result = run({ index: validIndex, mode: "OWNER_EXECUTION_REQUIRED", runtime: () => { throw new Error("SYNTHETIC_OWNER_RUNTIME_FAILURE"); } });
    expect(result.executionOutcome).toEqual(expect.objectContaining({ kind: "OWNER_EXECUTION_FAILURE", ownerRepairRequired: true, firstDivergentStage: "SCIENTIFIC_THINKING_ENGINE" }));
    expect(result.qualificationTrace.ownerInvocationCount).toBe(1);
    expect(result.qualificationTrace.ownerResultCount).toBe(0);
  });

  it("sends a clean OwnerResult to scientific adjudication", () => {
    const result = run({ index: validIndex, mode: "OWNER_EXECUTION_REQUIRED" });
    expect(result.executionOutcome.caseStatus).toBe("READY_FOR_SCIENTIFIC_ADJUDICATION");
    expect(result.evaluations.some((item) => item.outcome === "NON_ADJUDICABLE")).toBe(false);
  });

  it("keeps campaign, harness, reference and owner status planes independent", () => {
    const harness = adjudicateCase({ harnessDefect: true, referenceDefect: false, frozenInputValid: true, traceComplete: true, scientificConflictRequiresHuman: false, validOwnerCriticalViolation: false, nonCriticalLimitations: false });
    const reference = adjudicateCase({ harnessDefect: false, referenceDefect: true, frozenInputValid: true, traceComplete: true, scientificConflictRequiresHuman: false, validOwnerCriticalViolation: false, nonCriticalLimitations: false });
    expect(harness.status).toEqual(expect.objectContaining({ campaignStatus: "BLOCKED_BY_CHARACTERIZATION_HARNESS", harnessStatus: "NOT_READY", referenceStatus: "VALID", ownerCharacterizationStatus: "NOT_ADJUDICATED" }));
    expect(reference.status).toEqual(expect.objectContaining({ harnessStatus: "READY", referenceStatus: "DEFECT", ownerCharacterizationStatus: "NOT_ADJUDICATED" }));
  });

  it("admits an intentionally stale Knowledge fixture only for a fail-closed test", () => {
    const gate = evaluateKnowledgeInputGate({
      expectedProject: { projectId: "P", projectVersion: "P:1", projectDigest: "PD1" },
      observedProject: { projectId: "P", projectVersion: "P:1", projectDigest: "PD1" },
      resultRef: "K@1", resultDigest: "KD", provenanceRefs: ["RB"], applicabilityRepresented: true,
      sourceRefs: ["S"], evidenceRefs: ["E"], evidenceRequired: true,
      gapsExpected: [], gapsObserved: [], limitationsExpected: [], limitationsObserved: [], contradictionsExpected: [], contradictionsObserved: [],
      preEncodedStDecision: false, stale: true, purposeCoherent: true, frozen: true, digestValid: true,
      testPurpose: "FAIL_CLOSED_PRE_OWNER_REJECTION",
    });
    expect(gate.status).toBe("INTENTIONALLY_INVALID_FOR_FAIL_CLOSED_TEST");
    expect(gate.validForDeclaredTestPurpose).toBe("YES");
  });

  it("fails closed on the three prohibited machine-evidence combinations", () => {
    const expected = deriveExecutionOutcome({
      expectedExecutionMode: "PRE_OWNER_REJECTION_EXPECTED", expectedRejectionCodes: ["STALE"], errorCode: "STALE", rejectionStage: "STALE_VALIDATION",
      ownerInvocationCount: 0, ownerResultCount: 0, traceEventTypes: ["STALE_RESULT_REJECTED"], projectWrites: 0, ownerResultMutations: 0, technicalAttributionKnown: true,
    });
    const ownerRequired = validateExecutionOutcomeEvidence({ expectedExecutionMode: "PRE_OWNER_REJECTION_EXPECTED", ownerResultRequired: true, ownerInvocationCount: 0, ownerResultCount: 0, outcome: expected, firstDivergentStage: null });
    const promotion = validateExecutionOutcomeEvidence({ expectedExecutionMode: "PRE_OWNER_REJECTION_EXPECTED", ownerResultRequired: false, ownerInvocationCount: 0, ownerResultCount: 0, outcome: { ...expected, evidencePromotion: true }, firstDivergentStage: null });
    const fakeStage = validateExecutionOutcomeEvidence({ expectedExecutionMode: "PRE_OWNER_REJECTION_EXPECTED", ownerResultRequired: false, ownerInvocationCount: 0, ownerResultCount: 0, outcome: expected, firstDivergentStage: "ST_ENGINE" });
    expect(ownerRequired.valid).toBe(false);
    expect(promotion.valid).toBe(false);
    expect(fakeStage.valid).toBe(false);
  });

  it("freezes all five outcome classes and passes the definition validator", () => {
    const validation = validateHarnessDefinition({ outcomeKinds: EXECUTION_OUTCOME_KINDS, executionModes: EXPECTED_EXECUTION_MODES, terminalStages: TERMINAL_TRACE_STAGES, unitTestsPassed: 17, unitTestsTotal: 17 });
    expect(validation.valid).toBe(true);
    expect(EXECUTION_OUTCOME_KINDS).toHaveLength(5);
  });

  it("requires explicit rejection evidence while allowing null request and result refs", () => {
    const result = run({ index: staleIndex, mode: "PRE_OWNER_REJECTION_EXPECTED", codes: ["STALE_KNOWLEDGE_RESULT"] });
    expect(evaluateTraceCompleteness(result.qualificationTrace)).toEqual(expect.objectContaining({ traceQualificationComplete: "YES", caseAdjudicable: true }));
    expect(evaluateTraceCompleteness({ ...result.qualificationTrace, rejectionCode: null })).toEqual(expect.objectContaining({ traceQualificationComplete: "NO", caseAdjudicable: false }));
  });
});
