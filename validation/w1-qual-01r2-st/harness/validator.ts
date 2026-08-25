import {
  EXECUTION_OUTCOME_KINDS,
  EXPECTED_EXECUTION_MODES,
  TERMINAL_TRACE_STAGES,
  type CharacterizationExecutionOutcome,
  type ExpectedExecutionMode,
} from "./contracts";

export type ValidationFinding = { code: string; blocking: boolean; evidence: string };

export const validateHarnessDefinition = (input: {
  outcomeKinds: readonly string[];
  executionModes: readonly string[];
  terminalStages: readonly string[];
  unitTestsPassed: number;
  unitTestsTotal: number;
}) => {
  const findings: ValidationFinding[] = [];
  for (const required of EXECUTION_OUTCOME_KINDS) {
    if (!input.outcomeKinds.includes(required)) findings.push({ code: "MISSING_EXECUTION_OUTCOME_KIND", blocking: true, evidence: required });
  }
  for (const required of EXPECTED_EXECUTION_MODES) {
    if (!input.executionModes.includes(required)) findings.push({ code: "MISSING_EXPECTED_EXECUTION_MODE", blocking: true, evidence: required });
  }
  for (const required of TERMINAL_TRACE_STAGES) {
    if (!input.terminalStages.includes(required)) findings.push({ code: "MISSING_TERMINAL_TRACE_STAGE", blocking: true, evidence: required });
  }
  if (input.unitTestsPassed !== input.unitTestsTotal || input.unitTestsTotal < 12) {
    findings.push({ code: "HARNESS_UNIT_TESTS_INCOMPLETE", blocking: true, evidence: `${input.unitTestsPassed}/${input.unitTestsTotal}` });
  }
  return { valid: findings.every((item) => !item.blocking), findings };
};

export const validateExecutionOutcomeEvidence = (input: {
  expectedExecutionMode: ExpectedExecutionMode;
  ownerResultRequired: boolean;
  ownerInvocationCount: number;
  ownerResultCount: number;
  outcome: CharacterizationExecutionOutcome;
  firstDivergentStage: string | null;
}) => {
  const findings: ValidationFinding[] = [];
  if (input.expectedExecutionMode === "PRE_OWNER_REJECTION_EXPECTED" && input.ownerResultRequired) {
    findings.push({ code: "EXPECTED_PRE_OWNER_REJECTION_CANNOT_REQUIRE_OWNER_RESULT", blocking: true, evidence: input.expectedExecutionMode });
  }
  if (input.ownerResultCount === 0 && input.outcome.evidencePromotion) {
    findings.push({ code: "ABSENT_OWNER_RESULT_CANNOT_AUTOMATICALLY_SIGNAL_EVIDENCE_PROMOTION", blocking: true, evidence: input.outcome.kind });
  }
  if (input.ownerInvocationCount === 0 && ["SCIENTIFIC_THINKING_ENGINE", "ST_ENGINE"].includes(input.firstDivergentStage ?? "")) {
    findings.push({ code: "ZERO_INVOCATION_CANNOT_DIVERGE_AT_ST_ENGINE", blocking: true, evidence: input.firstDivergentStage ?? "null" });
  }
  if (input.outcome.kind === "EXPECTED_PRE_OWNER_REJECTION" && (
    input.ownerInvocationCount !== 0
    || input.ownerResultCount !== 0
    || input.outcome.failureClass !== null
    || input.outcome.ownerRepairRequired
  )) {
    findings.push({ code: "EXPECTED_PRE_OWNER_REJECTION_TERMINAL_STATE_INVALID", blocking: true, evidence: JSON.stringify(input.outcome) });
  }
  return { valid: findings.every((item) => !item.blocking), findings };
};

export const validatePreparedCampaign = (input: {
  campaignId: string;
  expectedCampaignId: string;
  cases: Array<{
    caseId: string;
    parentageStatus: string;
    authoredBeforeObservation: boolean;
    expectedExecutionMode: ExpectedExecutionMode;
  }>;
  envelopeCases: Array<{
    caseId: string;
    expectedExecutionMode: ExpectedExecutionMode;
    ownerResultRequired: boolean;
  }>;
  packCaseIds: string[];
  knowledgeGateCases: Array<{ caseId: string; status: string; validForDeclaredTestPurpose: string }>;
  freezeReady: boolean;
}) => {
  const findings: ValidationFinding[] = [];
  if (input.campaignId !== input.expectedCampaignId) findings.push({ code: "CAMPAIGN_ID_MISMATCH", blocking: true, evidence: input.campaignId });
  if (input.cases.length < 10 || input.cases.length > 16) findings.push({ code: "CASE_COUNT_OUTSIDE_PREDECLARED_RANGE", blocking: true, evidence: String(input.cases.length) });
  for (const item of input.cases) {
    if (!item.authoredBeforeObservation) findings.push({ code: "CASE_AUTHORED_AFTER_OBSERVATION", blocking: true, evidence: item.caseId });
    if (["TOO_CLOSE", "EXACT_OR_NEAR_DUPLICATE"].includes(item.parentageStatus)) findings.push({ code: "INADMISSIBLE_PARENTAGE", blocking: true, evidence: item.caseId });
    const envelope = input.envelopeCases.find((candidate) => candidate.caseId === item.caseId);
    if (!envelope) findings.push({ code: "ACCEPTANCE_ENVELOPE_MISSING", blocking: true, evidence: item.caseId });
    else {
      if (envelope.expectedExecutionMode !== item.expectedExecutionMode) findings.push({ code: "EXECUTION_MODE_MISMATCH", blocking: true, evidence: item.caseId });
      if (item.expectedExecutionMode === "PRE_OWNER_REJECTION_EXPECTED" && envelope.ownerResultRequired) findings.push({ code: "EXPECTED_PRE_OWNER_REJECTION_CANNOT_REQUIRE_OWNER_RESULT", blocking: true, evidence: item.caseId });
      if (item.expectedExecutionMode === "OWNER_EXECUTION_REQUIRED" && !envelope.ownerResultRequired) findings.push({ code: "OWNER_EXECUTION_REQUIRES_OWNER_RESULT_EXPECTATION", blocking: true, evidence: item.caseId });
    }
    if (!input.packCaseIds.includes(item.caseId)) findings.push({ code: "FROZEN_INPUT_MISSING", blocking: true, evidence: item.caseId });
    const gate = input.knowledgeGateCases.find((candidate) => candidate.caseId === item.caseId);
    const expectedGateStatus = item.expectedExecutionMode === "OWNER_EXECUTION_REQUIRED"
      ? "USABLE"
      : "INTENTIONALLY_INVALID_FOR_FAIL_CLOSED_TEST";
    if (!gate || gate.status !== expectedGateStatus || gate.validForDeclaredTestPurpose !== "YES") {
      findings.push({ code: "KNOWLEDGE_INPUT_INVALID_FOR_DECLARED_TEST_PURPOSE", blocking: true, evidence: item.caseId });
    }
  }
  if (!input.freezeReady) findings.push({ code: "CHARACTERIZATION_FREEZE_NOT_READY", blocking: true, evidence: input.campaignId });
  return { valid: findings.every((item) => !item.blocking), findings };
};

export const validateCompletedCampaign = (input: {
  caseIds: string[];
  primaryResults: Array<{
    caseId: string;
    traceQualificationComplete: string;
    executionOutcome: CharacterizationExecutionOutcome;
    ownerInvocationCount: number;
    ownerResultCount: number;
    expectedExecutionMode: ExpectedExecutionMode;
  }>;
  replayResults: Array<{ caseId: string; deterministic: boolean }>;
  qualifyingPasses: number;
  rerolls: number;
  runtimeRepairs: number;
  harnessRepairsAfterExposure: number;
}) => {
  const findings: ValidationFinding[] = [];
  if (input.qualifyingPasses !== 1) findings.push({ code: "QUALIFYING_PASS_COUNT_INVALID", blocking: true, evidence: String(input.qualifyingPasses) });
  if (input.rerolls !== 0 || input.runtimeRepairs !== 0 || input.harnessRepairsAfterExposure !== 0) {
    findings.push({ code: "POST_EXPOSURE_MUTATION_OR_REROLL", blocking: true, evidence: `${input.rerolls}/${input.runtimeRepairs}/${input.harnessRepairsAfterExposure}` });
  }
  for (const caseId of input.caseIds) {
    const result = input.primaryResults.find((candidate) => candidate.caseId === caseId);
    if (!result) findings.push({ code: "PRIMARY_RESULT_MISSING", blocking: true, evidence: caseId });
    else {
      if (result.traceQualificationComplete !== "YES") findings.push({ code: "TRACE_INCOMPLETE", blocking: true, evidence: caseId });
      const outcomeValidation = validateExecutionOutcomeEvidence({
        expectedExecutionMode: result.expectedExecutionMode,
        ownerResultRequired: result.expectedExecutionMode === "OWNER_EXECUTION_REQUIRED",
        ownerInvocationCount: result.ownerInvocationCount,
        ownerResultCount: result.ownerResultCount,
        outcome: result.executionOutcome,
        firstDivergentStage: result.executionOutcome.firstDivergentStage,
      });
      findings.push(...outcomeValidation.findings.map((item) => ({ ...item, evidence: `${caseId}:${item.evidence}` })));
    }
  }
  if (input.replayResults.length < 3) findings.push({ code: "REPLAY_SELECTION_INSUFFICIENT", blocking: true, evidence: String(input.replayResults.length) });
  for (const replay of input.replayResults) if (!replay.deterministic) findings.push({ code: "NON_DETERMINISTIC_BEHAVIOR", blocking: true, evidence: replay.caseId });
  return { valid: findings.every((item) => !item.blocking), findings };
};
