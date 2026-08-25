import { FAILURE_TAXONOMY, FIRST_DIVERGENT_STAGES } from "./contracts";

export type ValidationFinding = { code: string; blocking: boolean; evidence: string };

export const validateHarnessDefinition = (input: {
  taxonomy: readonly string[];
  stages: readonly string[];
  unitTestsPassed: number;
  unitTestsTotal: number;
}) => {
  const findings: ValidationFinding[] = [];
  for (const required of FAILURE_TAXONOMY) if (!input.taxonomy.includes(required)) findings.push({ code: "MISSING_FAILURE_CLASS", blocking: true, evidence: required });
  for (const required of FIRST_DIVERGENT_STAGES) if (!input.stages.includes(required)) findings.push({ code: "MISSING_FIRST_DIVERGENT_STAGE", blocking: true, evidence: required });
  if (input.unitTestsPassed !== input.unitTestsTotal || input.unitTestsTotal < 10) findings.push({ code: "HARNESS_UNIT_TESTS_INCOMPLETE", blocking: true, evidence: `${input.unitTestsPassed}/${input.unitTestsTotal}` });
  return { valid: findings.every((item) => !item.blocking), findings };
};

export const validatePreparedCampaign = (input: {
  campaignId: string;
  expectedCampaignId: string;
  cases: Array<{ caseId: string; parentageStatus: string; authoredBeforeObservation: boolean }>;
  envelopeCaseIds: string[];
  packCaseIds: string[];
  knowledgeGateCases: Array<{ caseId: string; status: string; usableForStCharacterization: string }>;
  freezeReady: boolean;
}) => {
  const findings: ValidationFinding[] = [];
  if (input.campaignId !== input.expectedCampaignId) findings.push({ code: "CAMPAIGN_ID_MISMATCH", blocking: true, evidence: input.campaignId });
  if (input.cases.length < 10 || input.cases.length > 16) findings.push({ code: "CASE_COUNT_OUTSIDE_PREDECLARED_RANGE", blocking: true, evidence: String(input.cases.length) });
  for (const item of input.cases) {
    if (!item.authoredBeforeObservation) findings.push({ code: "CASE_AUTHORED_AFTER_OBSERVATION", blocking: true, evidence: item.caseId });
    if (["TOO_CLOSE", "EXACT_OR_NEAR_DUPLICATE"].includes(item.parentageStatus)) findings.push({ code: "INADMISSIBLE_PARENTAGE", blocking: true, evidence: item.caseId });
    if (!input.envelopeCaseIds.includes(item.caseId)) findings.push({ code: "ACCEPTANCE_ENVELOPE_MISSING", blocking: true, evidence: item.caseId });
    if (!input.packCaseIds.includes(item.caseId)) findings.push({ code: "FROZEN_INPUT_MISSING", blocking: true, evidence: item.caseId });
    const gate = input.knowledgeGateCases.find((candidate) => candidate.caseId === item.caseId);
    if (!gate || gate.status !== "USABLE" || gate.usableForStCharacterization !== "YES") findings.push({ code: "KNOWLEDGE_INPUT_NOT_USABLE", blocking: true, evidence: item.caseId });
  }
  if (!input.freezeReady) findings.push({ code: "CHARACTERIZATION_FREEZE_NOT_READY", blocking: true, evidence: input.campaignId });
  return { valid: findings.every((item) => !item.blocking), findings };
};

export const validateCompletedCampaign = (input: {
  caseIds: string[];
  primaryResults: Array<{ caseId: string; traceQualificationComplete: string }>;
  replayResults: Array<{ caseId: string; deterministic: boolean }>;
  qualifyingPasses: number;
  rerolls: number;
  runtimeRepairs: number;
  harnessRepairsAfterExposure: number;
}) => {
  const findings: ValidationFinding[] = [];
  if (input.qualifyingPasses !== 1) findings.push({ code: "QUALIFYING_PASS_COUNT_INVALID", blocking: true, evidence: String(input.qualifyingPasses) });
  if (input.rerolls !== 0 || input.runtimeRepairs !== 0 || input.harnessRepairsAfterExposure !== 0) findings.push({ code: "POST_EXPOSURE_MUTATION_OR_REROLL", blocking: true, evidence: `${input.rerolls}/${input.runtimeRepairs}/${input.harnessRepairsAfterExposure}` });
  for (const caseId of input.caseIds) {
    const result = input.primaryResults.find((candidate) => candidate.caseId === caseId);
    if (!result) findings.push({ code: "PRIMARY_RESULT_MISSING", blocking: true, evidence: caseId });
    else if (result.traceQualificationComplete !== "YES") findings.push({ code: "TRACE_INCOMPLETE", blocking: true, evidence: caseId });
  }
  if (input.replayResults.length < 3) findings.push({ code: "REPLAY_SELECTION_INSUFFICIENT", blocking: true, evidence: String(input.replayResults.length) });
  for (const replay of input.replayResults) if (!replay.deterministic) findings.push({ code: "NON_DETERMINISTIC_BEHAVIOR", blocking: true, evidence: replay.caseId });
  return { valid: findings.every((item) => !item.blocking), findings };
};
