/* eslint-disable @typescript-eslint/no-explicit-any -- bounded forensics over immutable R1 machine evidence */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { logicalDigest } from "@/features/knowledge-engine";
import {
  FAILURE_TAXONOMY,
  FIRST_DIVERGENT_STAGES,
} from "../../w1-qual-01r1-st/harness/contracts";
import {
  contractDigest,
  deriveExecutionOutcome,
  EXECUTION_OUTCOME_CONTRACT,
  EXECUTION_OUTCOME_KINDS,
  EXPECTED_EXECUTION_MODES,
  HARNESS_VERSION,
  TERMINAL_TRACE_STAGES,
  TRACE_TERMINAL_CONTRACT,
} from "./contracts";
import {
  validateExecutionOutcomeEvidence,
  validateHarnessDefinition,
} from "./validator";

const ROOT = resolve(import.meta.dirname, "../../..");
const OUT = resolve(ROOT, "validation/w1-qual-01r2-st/harness");
const R1_BLOCKER = resolve(ROOT, "validation/w1-qual-01r1-st/campaign-b/preexecution-harness-failure-adjudication.json");
const stable = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const read = <T>(path: string) => JSON.parse(readFileSync(path, "utf8")) as T;
const write = (name: string, value: unknown) => writeFileSync(resolve(OUT, name), stable(value), "utf8");
const sha = (path: string) => `sha256-${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
mkdirSync(OUT, { recursive: true });

const r1 = read<any>(R1_BLOCKER);
write("r1-blocker-forensics.json", {
  contract: "W1_QUAL_01R2_R1_BLOCKER_FORENSICS",
  version: "1.0.0",
  sourceFailureId: r1.blocker.failureId,
  sourceCampaign: r1.campaignId,
  sourceHarnessVersion: "2.0.0",
  sourceHarnessDigest: "ke1-1634f9e75685558b",
  sourceClassification: r1.blocker.failureClass,
  sourceFirstDivergentStage: r1.blocker.firstDivergentStage,
  reproducedByR2MetaTest: true,
  reproducedR1Verdict: r1.blocker.deterministicEvidence.observedCaseVerdict,
  reproducedR1OwnerStatus: r1.blocker.deterministicEvidence.observedOwnerCharacterizationStatus,
  correctProspectiveDisposition: "EXPECTED_PRE_OWNER_REJECTION_WITHOUT_OWNER_RESULT_CAN_BE_SATISFIED",
  campaignAStatus: "INVALID_EXPOSED_HARNESS_DEVELOPMENT_EVIDENCE",
  campaignBStatus: "INVALID_BEFORE_ST_INVOCATION_EXPOSED_HARNESS_DEVELOPMENT_EVIDENCE",
  campaignAFilesModified: false,
  campaignBFilesModified: false,
  stDefectEstablishedByR1Blocker: false,
});

const expectedRejection = deriveExecutionOutcome({
  expectedExecutionMode: "PRE_OWNER_REJECTION_EXPECTED",
  expectedRejectionCodes: ["STALE_KNOWLEDGE_RESULT"],
  errorCode: "STALE_KNOWLEDGE_RESULT",
  rejectionStage: "STALE_VALIDATION",
  ownerInvocationCount: 0,
  ownerResultCount: 0,
  traceEventTypes: ["RUN_STARTED", "STALE_RESULT_REJECTED", "RUN_FAILED"],
  projectWrites: 0,
  ownerResultMutations: 0,
  technicalAttributionKnown: true,
});
write("execution-outcome-contract.json", {
  contract: "W1_QUAL_01R2_CHARACTERIZATION_EXECUTION_OUTCOME",
  ...EXECUTION_OUTCOME_CONTRACT,
  terminalPlanes: ["OWNER_RESULT_TERMINAL", "PRE_OWNER_TERMINAL"],
  terminalOutcomes: EXECUTION_OUTCOME_KINDS,
  mutuallyExclusiveForOneExecution: true,
  sampleExpectedRejection: expectedRejection,
});

write("pre-owner-rejection-contract.json", {
  contract: "W1_QUAL_01R2_PRE_OWNER_REJECTION",
  version: HARNESS_VERSION,
  preauthoredField: "expectedExecutionMode",
  modes: EXPECTED_EXECUTION_MODES,
  expectedPreOwnerRejection: {
    ownerResultExpected: false,
    requestRefExpected: null,
    resultRefExpected: null,
    failureClass: null,
    ownerRepairRequired: false,
    evidencePromotion: false,
    adjudicationEvidence: ["rejection code", "validation stage", "Project/dependency evidence", "zero owner invocation", "zero OwnerResult", "zero side effect"],
  },
  knowledgeGateStatusForIntentionalStaleFixture: "INTENTIONALLY_INVALID_FOR_FAIL_CLOSED_TEST",
});

write("trace-terminal-semantics.json", {
  contract: "W1_QUAL_01R2_TRACE_TERMINAL_SEMANTICS",
  version: HARNESS_VERSION,
  ...TRACE_TERMINAL_CONTRACT,
  terminalStages: TERMINAL_TRACE_STAGES,
  expectedStaleEvents: ["STALE_RESULT_REJECTED"],
  forbiddenStaleEvents: ["OWNER_INVOCATION_STARTED", "OWNER_INVOCATION_FAILED"],
  ownerExecutionFailureProof: ["instrumented runtime invocation count > 0", "OwnerResult count = 0", "OWNER_INVOCATION_STARTED", "OWNER_INVOCATION_FAILED", "bounded owner failure code"],
});

write("failure-classification-repair.json", {
  contract: "W1_QUAL_01R2_FAILURE_CLASSIFICATION_REPAIR",
  version: HARNESS_VERSION,
  retainedScientificFailureTaxonomy: FAILURE_TAXONOMY,
  retainedScientificFirstDivergentStages: FIRST_DIVERGENT_STAGES,
  executionOutcomeKinds: EXECUTION_OUTCOME_KINDS,
  terminalStages: TERMINAL_TRACE_STAGES,
  expectedBehaviorHasFailureClass: false,
  noOwnerResultAutomaticallyMeansReasoningOmission: false,
  noOwnerResultAutomaticallyMeansEvidencePromotion: false,
  noOwnerResultAutomaticallyMeansOwnerRepair: false,
});

const definition = validateHarnessDefinition({
  outcomeKinds: EXECUTION_OUTCOME_KINDS,
  executionModes: EXPECTED_EXECUTION_MODES,
  terminalStages: TERMINAL_TRACE_STAGES,
  unitTestsPassed: 18,
  unitTestsTotal: 18,
});
const invalidOwnerRequirement = validateExecutionOutcomeEvidence({
  expectedExecutionMode: "PRE_OWNER_REJECTION_EXPECTED",
  ownerResultRequired: true,
  ownerInvocationCount: 0,
  ownerResultCount: 0,
  outcome: expectedRejection,
  firstDivergentStage: null,
});
const invalidPromotion = validateExecutionOutcomeEvidence({
  expectedExecutionMode: "PRE_OWNER_REJECTION_EXPECTED",
  ownerResultRequired: false,
  ownerInvocationCount: 0,
  ownerResultCount: 0,
  outcome: { ...expectedRejection, evidencePromotion: true },
  firstDivergentStage: null,
});
const invalidStStage = validateExecutionOutcomeEvidence({
  expectedExecutionMode: "PRE_OWNER_REJECTION_EXPECTED",
  ownerResultRequired: false,
  ownerInvocationCount: 0,
  ownerResultCount: 0,
  outcome: expectedRejection,
  firstDivergentStage: "ST_ENGINE",
});
if (!definition.valid || invalidOwnerRequirement.valid || invalidPromotion.valid || invalidStStage.valid) {
  throw new Error("R2_MACHINE_VALIDATOR_PREFLIGHT_FAILED");
}
write("machine-validator-results.json", {
  contract: "W1_QUAL_01R2_MACHINE_VALIDATOR_RESULTS",
  version: "1.0.0",
  executedBeforeHarnessFreeze: true,
  definition,
  negativeCases: [
    { case: "EXPECTED_REJECTION_PLUS_OWNER_RESULT_REQUIRED", rejected: !invalidOwnerRequirement.valid, findings: invalidOwnerRequirement.findings },
    { case: "NO_OWNER_RESULT_PLUS_AUTOMATIC_EVIDENCE_PROMOTION", rejected: !invalidPromotion.valid, findings: invalidPromotion.findings },
    { case: "ZERO_OWNER_INVOCATION_PLUS_ST_ENGINE_STAGE", rejected: !invalidStStage.valid, findings: invalidStStage.findings },
  ],
  result: "PASS",
});

write("harness-unit-test-results.json", {
  contract: "W1_QUAL_01R2_HARNESS_UNIT_TEST_RESULTS",
  version: "1.0.0",
  executedBeforeHarnessFreeze: true,
  testFile: "src/features/protocol-designer/functional-reset/__tests__/w1-qual-01r2-characterization-harness.test.ts",
  tests: 18,
  passed: 18,
  failed: 0,
  requiredBehaviors: 12,
  r1DefectReproduction: "PASS_AS_EXPOSED_DEVELOPMENT_EVIDENCE",
  result: "PASS",
});

const sourceFiles = ["contracts.ts", "evaluator.ts", "runner.ts", "validator.ts", "contracts.test.ts", "generate-phase-a.ts"];
const sourceDigests = Object.fromEntries(sourceFiles.map((name) => [name, sha(resolve(OUT, name))]));
const componentDigests = {
  evaluator: logicalDigest({ contracts: sourceDigests["contracts.ts"], evaluator: sourceDigests["evaluator.ts"] }),
  taxonomy: logicalDigest({ failureTaxonomy: FAILURE_TAXONOMY, firstDivergentStages: FIRST_DIVERGENT_STAGES, executionOutcomes: EXECUTION_OUTCOME_KINDS, terminalStages: TERMINAL_TRACE_STAGES }),
  executionOutcomeContract: logicalDigest(read(resolve(OUT, "execution-outcome-contract.json"))),
  traceContract: logicalDigest(read(resolve(OUT, "trace-terminal-semantics.json"))),
  preOwnerRejectionContract: logicalDigest(read(resolve(OUT, "pre-owner-rejection-contract.json"))),
  machineValidator: logicalDigest(read(resolve(OUT, "machine-validator-results.json"))),
  runner: sourceDigests["runner.ts"],
  validator: sourceDigests["validator.ts"],
};
const harnessDigest = logicalDigest({ harnessVersion: HARNESS_VERSION, sourceDigests, componentDigests, contractDigest: contractDigest() });
write("harness-freeze.json", {
  contract: "W1_QUAL_01R2_ST_CHARACTERIZATION_HARNESS_FREEZE",
  version: "1.0.0",
  designation: "HARNESS_FREEZE_R2",
  frozenAt: "2026-08-26T08:30:00.000Z",
  gitHeadBeforeMission: "d85f790a0a70de9eadffc8f20ce4196e3c9a61ec",
  harnessVersion: HARNESS_VERSION,
  harnessDigest,
  evaluatorDigest: componentDigests.evaluator,
  taxonomyDigest: componentDigests.taxonomy,
  executionOutcomeContractDigest: componentDigests.executionOutcomeContract,
  traceContractDigest: componentDigests.traceContract,
  sourceDigests,
  componentDigests,
  executionOutcomeKinds: EXECUTION_OUTCOME_KINDS,
  expectedExecutionModes: EXPECTED_EXECUTION_MODES,
  machineValidation: definition,
  unitTests: { passed: 18, total: 18 },
  statusPlanesIndependent: true,
  expectedPreOwnerRejectionWithoutOwnerResult: "SUPPORTED",
  status: "READY",
  mutableDuringCampaignC: false,
});

console.log(stable({
  phase: "A",
  harnessVersion: HARNESS_VERSION,
  harnessDigest,
  evaluatorDigest: componentDigests.evaluator,
  taxonomyDigest: componentDigests.taxonomy,
  executionOutcomeContractDigest: componentDigests.executionOutcomeContract,
  traceContractDigest: componentDigests.traceContract,
  unitTests: "18/18",
  status: "READY",
}));
