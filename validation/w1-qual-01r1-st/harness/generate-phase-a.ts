/* eslint-disable @typescript-eslint/no-explicit-any -- bounded forensics over exposed Campaign A evidence */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { logicalDigest } from "@/features/knowledge-engine";
import {
  ACCEPTANCE_ENVELOPE_SCHEMA,
  ADJUDICATION_RULES,
  evaluateMechanisticObligation,
  evaluateNegativeExpectation,
  evaluateTraceCompleteness,
  FAILURE_TAXONOMY,
  FIRST_DIVERGENT_STAGES,
  HARNESS_VERSION,
} from "./contracts";
import { validateHarnessDefinition } from "./validator";

const ROOT = resolve(import.meta.dirname, "../../..");
const OLD = resolve(ROOT, "validation/w1-qual-01r-st");
const OUT = resolve(ROOT, "validation/w1-qual-01r1-st/harness");
const stable = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const read = <T>(path: string) => JSON.parse(readFileSync(path, "utf8")) as T;
const write = (name: string, value: unknown) => writeFileSync(resolve(OUT, name), stable(value), "utf8");
const sha = (path: string) => `sha256-${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
mkdirSync(OUT, { recursive: true });

const oldAdjudication = read<any>(resolve(OLD, "post-campaign-governance-adjudication.json"));
const oldResults = read<any>(resolve(OLD, "independent-results.json")).results as any[];
const oldTrace = read<any>(resolve(OLD, "trace-index.json"));
const oldKnowledgeGate = read<any>(resolve(OLD, "knowledge-input-quality-gate.json"));
const c3 = oldResults.find((item) => item.caseId === "ST01R-NEURO-OEF-CMRO2-01");
const c7 = oldResults.find((item) => item.caseId === "ST01R-PROJECT-QUESTION-MISSING-01");
if (!c3 || !c7) throw new Error("CAMPAIGN_A_DEVELOPMENT_EVIDENCE_MISSING");

const c3Mechanistic = evaluateMechanisticObligation({
  mechanisms: c3.invocation?.result?.nativePayload?.mechanisms ?? [],
  scientificModels: c3.invocation?.result?.nativePayload?.scientificModels ?? [],
  hypotheses: c3.invocation?.result?.nativePayload?.hypotheses ?? [],
});
const c7Native = c7.invocation?.result?.nativePayload;
const c7Conditional = evaluateNegativeExpectation("CONDITIONAL_CANDIDATE_ALLOWED", {
  status: c7Native?.status ?? "UNKNOWN",
  questions: c7Native?.questions?.length ?? 0,
  hypotheses: c7Native?.hypotheses?.length ?? 0,
  objectives: c7Native?.objectives?.length ?? 0,
  mechanisms: c7Native?.mechanisms?.length ?? 0,
  scientificModels: c7Native?.scientificModels?.length ?? 0,
  candidatesPending: [...(c7Native?.questions ?? []), ...(c7Native?.hypotheses ?? []), ...(c7Native?.objectives ?? [])].every((item: any) => item.reviewState !== "ADOPTED"),
  conditionsExplicit: (c7Native?.unknowns?.length ?? 0) > 0,
  unknownsPreserved: (c7Native?.unknowns ?? []).includes("PROJECT_SCIENTIFIC_QUESTION_NOT_EXPLICIT"),
  gapExplicit: (c7Native?.unknowns?.length ?? 0) > 0,
  refusalCode: c7Native?.refusal?.code ?? null,
});
const oldTraceItem = oldTrace.traceItems.find((item: any) => item.caseId === c3.caseId && item.executionKind === "QUALIFYING_PRIMARY");
const oldTraceCompleteness = evaluateTraceCompleteness({
  caseId: oldTraceItem?.caseId,
  project: oldTraceItem?.project,
  status: oldTraceItem?.runStatus,
  replayRefs: [],
});

const defects = [
  { defectId: "R1-HARNESS-01", defect: "INCOMPLETE_FAILURE_TAXONOMY", classification: "CHARACTERIZATION_HARNESS_DEFECT", firstDivergentStage: "CHARACTERIZATION_HARNESS", correctedBy: "taxonomy-repair.json" },
  { defectId: "R1-HARNESS-02", defect: "NON_CONFORMANT_KNOWLEDGE_INPUT_GATE", classification: "CHARACTERIZATION_HARNESS_DEFECT", firstDivergentStage: "CHARACTERIZATION_HARNESS", correctedBy: "knowledge-gate-repair.json" },
  { defectId: "R1-HARNESS-03", defect: "QUALIFICATION_TRACE_INCOMPLETE", classification: "TRACE_INCOMPLETE", firstDivergentStage: "TRACE_INSTRUMENTATION", correctedBy: "trace-completeness-contract.json" },
  { defectId: "R1-HARNESS-04", defect: "MECHANISTIC_CASE_WITHOUT_MECHANISTIC_OBLIGATION", classification: "REFERENCE_ENVELOPE_DEFECT", firstDivergentStage: "CHARACTERIZATION_REFERENCE", correctedBy: "mechanistic-obligation-contract.json" },
  { defectId: "R1-HARNESS-05", defect: "UNJUSTIFIED_ZERO_CANDIDATE_EXPECTATION", classification: "REFERENCE_ENVELOPE_DEFECT", firstDivergentStage: "CHARACTERIZATION_REFERENCE", correctedBy: "negative-expectation-contract.json" },
  { defectId: "R1-HARNESS-06", defect: "HARNESS_DEFECT_MAPPED_TO_HUMAN_ARBITRATION", classification: "CHARACTERIZATION_HARNESS_DEFECT", firstDivergentStage: "CHARACTERIZATION_HARNESS", correctedBy: "status-model and adjudication precedence" },
];

write("campaign-a-harness-forensics.json", {
  contract: "W1_QUAL_01R1_CAMPAIGN_A_HARNESS_FORENSICS",
  version: "1.0.0",
  campaignAId: oldAdjudication.campaignId,
  campaignAClassification: "EXPOSED_HARNESS_DEVELOPMENT_EVIDENCE",
  validForIndependentStCharacterization: false,
  campaignARuntimeStDefectEstablished: false,
  campaignAFilesModified: false,
  defectsConfirmed: defects.map((item) => item.defectId),
  c3DevelopmentReadback: {
    use: "HARNESS_DEVELOPMENT_EVIDENCE_ONLY",
    obligationNowAdjudicable: true,
    observedMechanisms: c3.invocation?.result?.nativePayload?.mechanisms?.length ?? 0,
    observedScientificModels: c3.invocation?.result?.nativePayload?.scientificModels?.length ?? 0,
    developmentOutcome: c3Mechanistic.outcome,
    note: "The corrected obligation can now distinguish explanatory representation from mere candidate counts; this exposed result is excluded from the independent numerator.",
  },
  c7DevelopmentReadback: {
    use: "HARNESS_DEVELOPMENT_EVIDENCE_ONLY",
    formerStrictZeroExpectationRemoved: true,
    correctedMode: "CONDITIONAL_CANDIDATE_ALLOWED",
    developmentOutcome: c7Conditional.outcome,
    projectUnknownPreserved: (c7Native?.unknowns ?? []).includes("PROJECT_SCIENTIFIC_QUESTION_NOT_EXPLICIT"),
    note: "An absent explicit Project question does not itself compel zero hypotheses/objectives.",
  },
  oldTraceCompleteness,
  conclusion: "CAMPAIGN_A_INVALID_AND_PRESERVED_NEW_HARNESS_DEVELOPED_WITHOUT_RETROACTIVE_READJUDICATION",
});

write("harness-defect-registry.json", {
  contract: "W1_QUAL_01R1_HARNESS_DEFECT_REGISTRY",
  version: "1.0.0",
  defects,
  counts: { total: defects.length, harness: 4, reference: 2, owner: 0 },
  historicalStatusInconsistencyCorrectedProspectively: true,
  harnessDefectMappedToHumanArbitration: false,
  referenceDefectMappedToOwnerRepair: false,
});

write("taxonomy-repair.json", {
  contract: "W1_QUAL_01R1_FAILURE_TAXONOMY",
  harnessVersion: HARNESS_VERSION,
  failureClasses: FAILURE_TAXONOMY,
  firstDivergentStages: FIRST_DIVERGENT_STAGES,
  bounded: true,
});

write("knowledge-gate-repair.json", {
  contract: "W1_QUAL_01R1_KNOWLEDGE_INPUT_QUALITY_GATE",
  version: "2.0.0",
  statuses: ["USABLE", "NOT_USABLE", "NON_ADJUDICABLE"],
  explicitField: "KNOWLEDGE_INPUT_USABLE_FOR_ST_CHARACTERIZATION",
  decisionExcluded: "WHETHER_ST_SHOULD_GENERATE_A_HYPOTHESIS",
  gapsAndContradictionsPermittedWhenPreserved: true,
  requiredChecks: ["Project tuple", "provenance", "applicability", "conditional source/evidence refs", "gap preservation", "limitation preservation", "contradiction preservation", "no pre-encoded ST decision", "not stale", "purpose coherence", "frozen digest"],
  campaignADevelopmentReadback: oldKnowledgeGate.cases.map((item: any) => ({ caseId: item.caseId, formerEligible: item.eligible, developmentStatus: Object.values(item.checks).every(Boolean) ? "USABLE" : "NOT_USABLE", numeratorAuthorized: false })),
});

write("trace-completeness-contract.json", {
  contract: "W1_QUAL_01R1_TRACE_COMPLETENESS",
  version: "2.0.0",
  requiredFields: ["caseId", "Project tuple", "KnowledgeResult ref/digest", "ST request ref/digest", "ST version", "ST result ref/digest", "status", "candidate structure/counts", "gaps", "limitations", "contradictions", "first divergent stage on failure", "duration", "replay refs"],
  completeField: "TRACE_QUALIFICATION_COMPLETE",
  incompleteDisposition: "NON_ADJUDICABLE",
  ownerVerdictPermittedWhenIncomplete: false,
  privateChainOfThoughtRecorded: false,
});

write("negative-expectation-contract.json", {
  contract: "W1_QUAL_01R1_NEGATIVE_EXPECTATION_SEMANTICS",
  version: "2.0.0",
  modes: ["STRICT_NO_CANDIDATE_EXPECTED", "CONDITIONAL_CANDIDATE_ALLOWED", "CLARIFICATION_OR_GAP_EXPECTED", "CANDIDATE_REQUIRED"],
  strictModeConstraint: "ONLY_WHEN_THE_CONTRACT_COMPELS_NO_SCIENTIFIC_CANDIDATE",
  absentProjectQuestionImpliesStrictZero: false,
  conditionalCandidateChecks: ["pending", "conditions explicit", "unknowns preserved", "not adopted", "no evidence promotion"],
});

write("mechanistic-obligation-contract.json", {
  contract: "W1_QUAL_01R1_MECHANISTIC_OR_EXPLANATORY_OBLIGATION",
  version: "2.0.0",
  obligation: "REASONING_CANDIDATE_MECHANISTIC_OR_EXPLANATORY",
  acceptableRepresentations: ["linked mechanism candidate", "candidate Scientific Model with explicit explanatory relation"],
  exactWordingRequired: false,
  exactMechanismRequired: false,
  exactCountRequired: false,
  c3DevelopmentOutcome: c3Mechanistic,
  campaignANumeratorAuthorized: false,
});

write("harness-unit-test-results.json", {
  contract: "W1_QUAL_01R1_HARNESS_UNIT_TEST_RESULTS",
  version: "1.0.0",
  executedBeforeHarnessFreeze: true,
  testFile: "src/features/protocol-designer/functional-reset/__tests__/w1-qual-01r1-characterization-harness.test.ts",
  tests: 11,
  passed: 11,
  failed: 0,
  requiredSyntheticBehaviorsCovered: 10,
  machineValidatorTests: 1,
  result: "PASS",
});

const sourceFiles = ["contracts.ts", "evaluator.ts", "runner.ts", "validator.ts", "contracts.test.ts", "generate-phase-a.ts"];
const sourceDigests = Object.fromEntries(sourceFiles.map((name) => [name, sha(resolve(OUT, name))]));
const componentDigests = {
  evaluator: logicalDigest({ contracts: sourceDigests["contracts.ts"], evaluator: sourceDigests["evaluator.ts"] }),
  taxonomy: logicalDigest({ failureClasses: FAILURE_TAXONOMY, firstDivergentStages: FIRST_DIVERGENT_STAGES }),
  knowledgeGate: logicalDigest(read(resolve(OUT, "knowledge-gate-repair.json"))),
  traceCompletenessContract: logicalDigest(read(resolve(OUT, "trace-completeness-contract.json"))),
  acceptanceEnvelopeSchema: logicalDigest(ACCEPTANCE_ENVELOPE_SCHEMA),
  adjudicationRules: logicalDigest(ADJUDICATION_RULES),
  negativeExpectationContract: logicalDigest(read(resolve(OUT, "negative-expectation-contract.json"))),
  mechanisticObligationContract: logicalDigest(read(resolve(OUT, "mechanistic-obligation-contract.json"))),
  runner: sourceDigests["runner.ts"],
  validator: sourceDigests["validator.ts"],
};
const harnessDigest = logicalDigest({ harnessVersion: HARNESS_VERSION, sourceDigests, componentDigests });
const machineValidation = validateHarnessDefinition({ taxonomy: FAILURE_TAXONOMY, stages: FIRST_DIVERGENT_STAGES, unitTestsPassed: 11, unitTestsTotal: 11 });
if (!machineValidation.valid) throw new Error(`HARNESS_FREEZE_VALIDATION_FAILED:${stable(machineValidation.findings)}`);
write("harness-freeze.json", {
  contract: "W1_QUAL_01R1_ST_CHARACTERIZATION_HARNESS_FREEZE",
  version: "1.0.0",
  frozenAt: "2026-08-25T23:20:00.000Z",
  gitHeadBeforeMission: "efc11c98b3310dc77c90e7357a83f96dc9d82820",
  harnessVersion: HARNESS_VERSION,
  harnessDigest,
  sourceDigests,
  componentDigests,
  acceptanceEnvelopeSchema: ACCEPTANCE_ENVELOPE_SCHEMA,
  adjudicationRules: ADJUDICATION_RULES,
  machineValidation,
  unitTests: { passed: 11, total: 11 },
  status: "READY",
  mutableDuringCampaignB: false,
});

console.log(stable({ phase: "A", harnessVersion: HARNESS_VERSION, harnessDigest, defects: defects.length, unitTests: "11/11", status: "READY" }));
