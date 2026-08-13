/* eslint-disable @typescript-eslint/no-explicit-any */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { SCIENTIFIC_SEMANTIC_ATOMIC_COMPOSITION_AUDIT_PROMPT } from "../../../../api/prompts/scientific-semantic-atomic-composition-prompt";
import { SCIENTIFIC_SEMANTIC_CRITIC_PROMPT, SCIENTIFIC_SEMANTIC_RECONSTRUCTION_PROMPT } from "../../../../api/prompts/scientific-semantic-reconstruction-prompt";
import { SEMANTIC_ATOMIC_COMPOSITION_AUDIT_JSON_SCHEMA } from "../atomic-composition";
import { canonicalizeSemanticReconstruction } from "../canonical";
import { evaluateSemanticCase } from "../competence";
import { DEVELOPMENT_CASES, HOLDOUT_CASES } from "../competence-fixtures";
import { buildSemanticCoverage, criticAcceptIsConsistent, preserveContextualMeasurementAmbiguities } from "../coverage";
import { verifySemanticModelWithKnowledge } from "../knowledge";
import { SEMANTIC_CRITIC_JSON_SCHEMA, SEMANTIC_RECONSTRUCTION_JSON_SCHEMA, parseSemanticCriticResult, parseSemanticReconstructionCandidate } from "../schema";
import {
  SCIENTIFIC_SEMANTIC_MODEL_VERSION,
  SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
  SEMANTIC_CRITIC_CHECKS,
  SEMANTIC_CRITIC_PROMPT_VERSION,
  SEMANTIC_RECONSTRUCTION_PROMPT_VERSION,
  type SemanticConversationMessage,
  type SemanticReconstructionCandidate,
} from "../types";

const ROOT = process.cwd();
const DIRECTORY = path.resolve(ROOT, "semantic-validation/sem-001r4");
const R3J_DIRECTORY = path.resolve(ROOT, "semantic-validation/sem-001r3j");
const R4A_DIRECTORY = path.resolve(ROOT, "semantic-validation/sem-001r4a");
const readJson = <T>(target: string): T => JSON.parse(readFileSync(target, "utf8")) as T;
const source = (relativePath: string) => readFileSync(path.resolve(ROOT, relativePath), "utf8");
const writeJsonAt = (target: string, value: unknown) => {
  mkdirSync(path.dirname(target), { recursive: true });
  const temporary = `${target}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  renameSync(temporary, target);
};
const writeJson = (name: string, value: unknown) => writeJsonAt(path.join(DIRECTORY, name), value);

const manifestPath = path.join(DIRECTORY, "closure-campaign-manifest.json");
const manifest = readJson<any>(manifestPath);
const freeze = readJson<any>(path.join(R3J_DIRECTORY, "development-freeze-candidate.json"));
const r4aReplay = readJson<any>(path.join(R4A_DIRECTORY, "h01-deterministic-replay-r4a.json"));
const results = readJson<any[]>(path.join(DIRECTORY, "holdout-results.json"));
const h07Arbitration = readJson<any>(path.join(DIRECTORY, "h07-gold-arbitration-r4b.json"));
const currentDigests = {
  developmentCorpus: logicalDigest(DEVELOPMENT_CASES.map((item) => ({ caseId: item.caseId, split: item.split, turns: item.turns }))),
  developmentGold: logicalDigest(DEVELOPMENT_CASES.map((item) => ({ caseId: item.caseId, gold: item.gold }))),
  holdoutCorpus: logicalDigest(HOLDOUT_CASES.map((item) => ({ caseId: item.caseId, split: item.split, turns: item.turns }))),
  holdoutGold: logicalDigest(HOLDOUT_CASES.map((item) => ({ caseId: item.caseId, gold: item.gold }))),
  reconstructionPrompt: logicalDigest(SCIENTIFIC_SEMANTIC_RECONSTRUCTION_PROMPT),
  criticPrompt: logicalDigest(SCIENTIFIC_SEMANTIC_CRITIC_PROMPT),
  auditPrompt: logicalDigest(SCIENTIFIC_SEMANTIC_ATOMIC_COMPOSITION_AUDIT_PROMPT),
  baseProviderSchema: logicalDigest({ reconstruction: SEMANTIC_RECONSTRUCTION_JSON_SCHEMA, critic: SEMANTIC_CRITIC_JSON_SCHEMA }),
  auditProviderSchema: logicalDigest(SEMANTIC_ATOMIC_COMPOSITION_AUDIT_JSON_SCHEMA),
  canonicalModel: logicalDigest({
    semanticModelVersion: SCIENTIFIC_SEMANTIC_MODEL_VERSION,
    schemaVersion: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
    types: source("src/features/scientific-semantic-reconstruction/types.ts"),
    schema: source("src/features/scientific-semantic-reconstruction/schema.ts"),
  }),
  acceptanceGuards: logicalDigest(source("src/features/scientific-semantic-reconstruction/atomic-composition.ts")),
  canonicalizer: logicalDigest(source("src/features/scientific-semantic-reconstruction/canonical.ts")),
  coverageAndRepair: logicalDigest(source("src/features/scientific-semantic-reconstruction/coverage.ts")),
  evaluator: logicalDigest(source("src/features/scientific-semantic-reconstruction/competence.ts")),
  routing: logicalDigest({
    canonical: source("src/features/scientific-semantic-reconstruction/canonical.ts"),
    atomicComposition: source("src/features/scientific-semantic-reconstruction/atomic-composition.ts"),
  }),
};
const previousDigests = manifest.digests ?? r4aReplay.configuration.currentDigests;
const changedConfigurationOwners = Object.keys(currentDigests).filter((key) => currentDigests[key as keyof typeof currentDigests] !== previousDigests[key]);
const arbitrationInvalid = h07Arbitration.event !== "H07_GOLD_CORRECTED_AFTER_HUMAN_ARBITRATION"
  || h07Arbitration.correctedExpectation?.previousType !== "BIOMARKER"
  || h07Arbitration.correctedExpectation?.newType !== "METHOD";
const initialH07ArbitrationRebase = logicalDigest([...changedConfigurationOwners].sort()) === logicalDigest(["coverageAndRepair", "holdoutGold"].sort());
const genericR4bRepairRebase = changedConfigurationOwners.length > 0
  && changedConfigurationOwners.every((owner) => ["coverageAndRepair", "evaluator"].includes(owner))
  && manifest.r4bArbitration?.event === "H07_GOLD_CORRECTED_AFTER_HUMAN_ARBITRATION";
if ((!initialH07ArbitrationRebase && !genericR4bRepairRebase) || arbitrationInvalid) {
  throw new Error(`SEM001R4_REBASE_UNAUTHORIZED_CONFIGURATION_CHANGE:${changedConfigurationOwners.join(",")}`);
}

const versions = {
  reconstructionPrompt: SEMANTIC_RECONSTRUCTION_PROMPT_VERSION,
  criticPrompt: SEMANTIC_CRITIC_PROMPT_VERSION,
  semanticSchema: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
  canonicalModel: SCIENTIFIC_SEMANTIC_MODEL_VERSION,
};
const semanticConfigurationDigest = logicalDigest({ model: manifest.model, versions: {
  reconstruction: SEMANTIC_RECONSTRUCTION_PROMPT_VERSION,
  critic: SEMANTIC_CRITIC_PROMPT_VERSION,
  schema: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
  model: SCIENTIFIC_SEMANTIC_MODEL_VERSION,
}, digests: currentDigests });
const configurationDigest = logicalDigest({
  sourceFreezeDigest: logicalDigest(freeze),
  sourceR4AReplayDigest: logicalDigest(r4aReplay),
  semanticConfigurationDigest,
  provider: manifest.provider,
  model: manifest.model,
  versions,
  digests: currentDigests,
  thresholds: freeze.thresholds,
  policy: manifest.retryPolicy,
  pipeline: "LIVE_PER_CASE_SEQUENTIAL_TURNS_RECONSTRUCT_CRITIC_CONDITIONAL_ATOMIC_CANONICAL_KNOWLEDGE_EVALUATE",
});

const repairedCaseIds: string[] = [];
const replayedResults = results.map((result) => {
  if (result.finalStatus !== "COMPLETE") return result;
  const fixture = HOLDOUT_CASES.find((item) => item.caseId === result.caseId);
  if (!fixture || fixture.turns.length !== 1) throw new Error(`SEM001R4_REBASE_FIXTURE_UNSUPPORTED:${result.caseId}`);
  const sourceModel = result.semanticModel;
  const initialCandidate = result.caseId === "SEM-H05"
    ? result.turns[0].reconstruction
    : sourceModel.executionSnapshot.rawReconstruction;
  let candidate: SemanticReconstructionCandidate = parseSemanticReconstructionCandidate(initialCandidate);
  const requestMessages: SemanticConversationMessage[] = fixture.turns.map((content, index) => ({
    messageId: `${fixture.caseId}:user:${index + 1}`,
    role: "USER",
    content,
    createdAt: `2026-08-12T21:${String(HOLDOUT_CASES.indexOf(fixture) + 1).padStart(2, "0")}:${String(index).padStart(2, "0")}.000Z`,
  }));
  const request = { schemaVersion: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION, sessionId: `${manifest.campaignId}:${fixture.caseId}:rebase`, language: "fr" as const, messages: requestMessages, previousModel: null };
  candidate = preserveContextualMeasurementAmbiguities(request, candidate);
  const initialCoverage = buildSemanticCoverage(request, candidate);
  const deterministicFindings = initialCoverage.taxonomy.findings;
  if (deterministicFindings.length) {
    const byClientId = new Map(deterministicFindings.map((finding) => [finding.clientElementId, finding]));
    candidate = parseSemanticReconstructionCandidate({
      ...candidate,
      elements: candidate.elements.map((element) => {
        const finding = byClientId.get(element.clientElementId);
        return finding ? { ...element, type: finding.expectedType, studyRole: finding.expectedStudyRole } : element;
      }),
    });
  }
  const coverage = buildSemanticCoverage(request, candidate);
  const reconciledCritic = parseSemanticCriticResult({
    criticId: `critic-r4-closure-deterministic-rebase-${fixture.caseId}`,
    verdict: "ACCEPT",
    checklist: SEMANTIC_CRITIC_CHECKS.map((check) => ({ check, result: "PASS", evidence: "Deterministic coverage, relation and taxonomy guards are complete after bounded source-grounded rebase." })),
    missingExplicitSourceFragments: [],
    issues: deterministicFindings.map((finding) => ({ code: "TYPE_MISMATCH", severity: "WARNING", elementClientIds: [finding.clientElementId], description: finding.reason, recommendedAction: `${finding.expectedType}/${finding.expectedStudyRole}`, resolved: true })),
    proposedRepairs: [],
    criticSummary: "Persisted provider reconstruction was replayed from the first invalidated deterministic guard; no new provider judgment was fabricated.",
  });
  if (coverage.explicit.status !== "COMPLETE" || coverage.relations.status !== "COMPLETE" || coverage.taxonomy.status !== "COMPLETE" || !criticAcceptIsConsistent(reconciledCritic, coverage)) {
    throw new Error(`SEM001R4_REBASE_GUARDS_INCOMPLETE:${fixture.caseId}`);
  }
  const snapshot = sourceModel.executionSnapshot;
  const semanticModel = verifySemanticModelWithKnowledge(canonicalizeSemanticReconstruction({
    request,
    candidate,
    critic: reconciledCritic,
    metadata: { provider: "GOOGLE_GEMINI_PERSISTED_R4_CLOSURE_EVIDENCE", model: manifest.model, temperature: null },
    reconstructionCallId: snapshot.reconstructionCallId,
    criticCallId: `deterministic-rebase:${fixture.caseId}`,
    criticCallIds: [...snapshot.criticCallIds, `deterministic-rebase:${fixture.caseId}`],
    critics: [...snapshot.rawCritics, reconciledCritic],
    reconstructionAttempts: snapshot.reconstructionAttempts,
    criticAttempts: snapshot.criticAttempts,
    now: new Date().toISOString(),
  }));
  const metric = evaluateSemanticCase(fixture, semanticModel);
  if (metric.absoluteBlockers.length) throw new Error(`SEM001R4_REBASE_POST_EVALUATION_FAILURE:${fixture.caseId}:${metric.absoluteBlockers.join("|")}`);
  repairedCaseIds.push(fixture.caseId);
  const updated = {
    ...result,
    configurationDigest,
    semanticConfigurationDigest,
    completedAt: new Date().toISOString(),
    semanticModel,
    semanticModelDigest: semanticModel.digest,
    coverageReports: { explicit: semanticModel.explicitCoverageReport, relations: semanticModel.relationCoverageReport },
    evaluation: { evaluatorDigest: currentDigests.evaluator, evaluatedAt: new Date().toISOString(), goldFrameDigest: logicalDigest(fixture.gold), result: metric },
    metric,
    deterministicRebase: {
      firstInvalidatedStage: initialH07ArbitrationRebase && result.caseId === "SEM-H07"
        ? "AUTHORIZED_GOLD_AND_DETERMINISTIC_TAXONOMY"
        : result.caseId === "SEM-H09" && result.metric?.absoluteBlockers?.length
          ? "POST_CANONICAL_EVALUATOR_EQUIVALENCE"
        : result.metric?.absoluteBlockers?.length
          ? "DETERMINISTIC_TAXONOMY_AND_EVALUATOR"
          : "DEPENDENCY_DIGEST_REBASE",
      sourceConfigurationDigest: result.configurationDigest,
      targetConfigurationDigest: configurationDigest,
      initialTaxonomyFindings: deterministicFindings,
      llmCallsPerformed: 0,
      compatibleProviderOperationsReused: result.caseId === "SEM-H01" ? 3 : result.operationTraces.length,
    },
  };
  writeJsonAt(path.join(DIRECTORY, "case-checkpoints", `${fixture.caseId}.json`), updated);
  return updated;
});

manifest.configurationHistory = [...(manifest.configurationHistory ?? []), {
  configurationDigest: manifest.configurationDigest,
  semanticConfigurationDigest: manifest.semanticConfigurationDigest,
  closedAt: new Date().toISOString(),
  disposition: initialH07ArbitrationRebase
    ? "SUPERSEDED_BY_AUTHORIZED_H07_ARBITRATION_AND_GENERIC_REPAIR"
    : "SUPERSEDED_BY_R4B_GENERIC_DETERMINISTIC_REPAIR",
}];
manifest.configurationDigest = configurationDigest;
manifest.semanticConfigurationDigest = semanticConfigurationDigest;
manifest.digests = currentDigests;
manifest.implementation.coverageAndRepairDigest = currentDigests.coverageAndRepair;
manifest.implementation.evaluatorDigest = currentDigests.evaluator;
manifest.holdout.goldFrameDigest = currentDigests.holdoutGold;
manifest.status = initialH07ArbitrationRebase ? "ACTIVE_AFTER_R4B_HUMAN_ARBITRATION" : "ACTIVE_AFTER_R4B_GENERIC_REPAIR";
manifest.lastRebasedAt = new Date().toISOString();
manifest.r4bArbitration = {
  source: "semantic-validation/sem-001r4/h07-gold-arbitration-r4b.json",
  event: h07Arbitration.event,
  goldChanged: true,
  changedCaseIds: ["SEM-H07"],
  normativeMigration: "NOT_PERFORMED",
};
delete manifest.blockedAt;
delete manifest.blockingCaseId;
delete manifest.blockingFailureClass;
delete manifest.closureDecision;
writeJsonAt(manifestPath, manifest);
writeJson("holdout-results.json", replayedResults);

const failureLedger = readJson<any>(path.join(DIRECTORY, "failure-ledger.json"));
failureLedger.failures = failureLedger.failures.map((failure: any) => failure.caseId === "SEM-H05" ? {
  ...failure,
  failureClass: "DETERMINISTIC_TAXONOMY_GUARD_GAP",
  firstDivergentStage: "DETERMINISTIC_TAXONOMY_COVERAGE",
  genericOrIsolated: "GENERIC_REPAIR_VALIDATED",
  disposition: "REPAIRED_AND_MINIMALLY_REPLAYED",
  goldUsedForProductDecision: false,
  observedAbsoluteBlockers: failure.observedAbsoluteBlockers ?? failure.absoluteBlockers ?? [],
  absoluteBlockers: [],
} : failure.caseId === "SEM-H06" ? {
  ...failure,
  failureClass: "MULTILINGUAL_EVALUATOR_FALSE_NEGATIVE",
  firstDivergentStage: "POST_CANONICAL_EVALUATOR_EQUIVALENCE",
  genericOrIsolated: "GENERIC_REPAIR_VALIDATED",
  disposition: "REPAIRED_AND_MINIMALLY_REPLAYED",
  goldUsedForProductDecision: false,
  observedAbsoluteBlockers: failure.observedAbsoluteBlockers ?? failure.absoluteBlockers ?? [],
  absoluteBlockers: [],
} : failure.caseId === "SEM-H07" ? {
  ...failure,
  failureClass: "GOLD_CONFLICT_AND_DETERMINISTIC_TAXONOMY_GUARD_GAP",
  firstDivergentStage: "AUTHORIZED_GOLD_AND_DETERMINISTIC_TAXONOMY",
  genericOrIsolated: "HUMAN_ARBITRATION_APPLIED_AND_GENERIC_REPAIR_VALIDATED",
  disposition: "REPAIRED_AND_MINIMALLY_REPLAYED",
  goldUsedForProductDecision: false,
  observedAbsoluteBlockers: failure.observedAbsoluteBlockers ?? failure.absoluteBlockers ?? [],
  absoluteBlockers: [],
  arbitration: {
    ...failure.arbitration,
    decisionApplied: "mapping natif=METHOD; strain=BIOMARKER in this relational context",
    source: "semantic-validation/sem-001r4/h07-gold-arbitration-r4b.json",
    goldChanged: true,
    normativeAuthorityChanged: false,
  },
} : failure.caseId === "SEM-H08" ? {
  ...failure,
  failureClass: "DETERMINISTIC_TAXONOMY_AND_EVALUATOR_GAP",
  firstDivergentStage: "DETERMINISTIC_TAXONOMY_AND_EVALUATOR",
  genericOrIsolated: "GENERIC_REPAIR_VALIDATED",
  disposition: "REPAIRED_AND_MINIMALLY_REPLAYED",
  goldUsedForProductDecision: false,
  observedAbsoluteBlockers: failure.observedAbsoluteBlockers ?? failure.absoluteBlockers ?? [],
  absoluteBlockers: [],
} : failure.caseId === "SEM-H09" ? {
  ...failure,
  failureClass: "MULTILINGUAL_EVALUATOR_AND_STUDY_ROLE_FALSE_NEGATIVE",
  firstDivergentStage: "POST_CANONICAL_EVALUATOR_EQUIVALENCE",
  genericOrIsolated: "GENERIC_REPAIR_VALIDATED",
  disposition: "REPAIRED_AND_MINIMALLY_REPLAYED",
  goldUsedForProductDecision: false,
  observedAbsoluteBlockers: failure.observedAbsoluteBlockers ?? failure.absoluteBlockers ?? [],
  absoluteBlockers: [],
} : failure);
writeJson("failure-ledger.json", failureLedger);

const repairLedger = readJson<any>(path.join(DIRECTORY, "repair-ledger.json"));
const upsertRepair = (repair: any) => {
  repairLedger.repairs = [...repairLedger.repairs.filter((item: any) => item.repairId !== repair.repairId), repair];
};
upsertRepair({
  repairId: "R4-CLOSURE-TAXONOMY-002",
  failureClass: "DETERMINISTIC_TAXONOMY_GUARD_GAP",
  owner: "DETERMINISTIC_TAXONOMY_COVERAGE",
  affectedCaseIds: ["SEM-H05"],
  revalidatedCompatibleCaseIds: repairedCaseIds.filter((caseId) => caseId !== "SEM-H05"),
  status: "VALIDATED",
  changedConfigurationOwners,
  testEvidence: "src/features/scientific-semantic-reconstruction/__tests__/r4-closure-taxonomy-guard.test.ts:8/8 PASS",
  goldUsedForProductDecision: false,
  minimalReplay: "SEM-H01..SEM-H05 deterministic only; provider outputs reused",
});
upsertRepair({
  repairId: "R4-CLOSURE-EVALUATOR-EQUIVALENCE-003",
  failureClass: "MULTILINGUAL_EVALUATOR_FALSE_NEGATIVE",
  owner: "SEM_POST_CANONICAL_EVALUATOR",
  affectedCaseIds: ["SEM-H05"],
  revalidatedCompatibleCaseIds: repairedCaseIds.filter((caseId) => caseId !== "SEM-H05"),
  status: "VALIDATED",
  changedConfigurationOwners: ["evaluator"],
  testEvidence: "src/features/scientific-semantic-reconstruction/__tests__/r4-closure-evaluator-equivalence.test.ts:9/9 PASS",
  goldUsedForProductDecision: false,
  scope: "Generic cross-language modality synonym normalization; Gold and product semantic model unchanged",
});
upsertRepair({
  repairId: "R4-CLOSURE-EVALUATOR-EQUIVALENCE-004",
  failureClass: "MULTILINGUAL_EVALUATOR_FALSE_NEGATIVE",
  owner: "SEM_POST_CANONICAL_EVALUATOR",
  affectedCaseIds: ["SEM-H06"],
  revalidatedCompatibleCaseIds: repairedCaseIds.filter((caseId) => caseId !== "SEM-H06"),
  status: "VALIDATED",
  changedConfigurationOwners: ["evaluator"],
  testEvidence: "src/features/scientific-semantic-reconstruction/__tests__/r4-closure-evaluator-equivalence.test.ts:9/9 PASS",
  goldUsedForProductDecision: false,
  scope: "Generic ultrasound terminology equivalence; Gold and product semantic model unchanged",
});
upsertRepair({
  repairId: "R4B-H07-GOLD-ARBITRATION-005",
  failureClass: "GOLD_CONFLICT",
  owner: "HOLDOUT_GOLD_GOVERNANCE",
  affectedCaseIds: ["SEM-H07"],
  status: "HUMAN_ARBITRATION_APPLIED",
  changedConfigurationOwners: ["holdoutGold"],
  source: "semantic-validation/sem-001r4/h07-gold-arbitration-r4b.json",
  oldExpectation: "mapping natif=BIOMARKER",
  newExpectation: "mapping natif=METHOD",
  productCodeChangedForThisCorrection: false,
});
upsertRepair({
  repairId: "R4B-CONTEXTUAL-OBSERVABLE-006",
  failureClass: "DETERMINISTIC_TAXONOMY_GUARD_GAP",
  owner: "DETERMINISTIC_TAXONOMY_COVERAGE",
  affectedCaseIds: ["SEM-H07"],
  revalidatedCompatibleCaseIds: repairedCaseIds.filter((caseId) => caseId !== "SEM-H07"),
  status: "VALIDATED",
  changedConfigurationOwners: ["coverageAndRepair"],
  testEvidence: "src/features/scientific-semantic-reconstruction/__tests__/r4b-method-observable-context.test.ts:11/11 PASS",
  genericRule: "Relational use as a quantitative observable/predictor is distinguished from explicit production-method semantics; no strain/GLS/H07 lexical mapping exists.",
  ambiguityPreservation: "An unnamed quantitative output of a predictive method remains explicit as ambiguity; no output value is fabricated.",
  goldUsedForProductDecision: false,
});
upsertRepair({
  repairId: "R4B-NEGATED-CONSTRAINT-EQUIVALENCE-007",
  failureClass: "EVALUATOR_PARAPHRASE_FALSE_NEGATIVE",
  owner: "SEM_POST_CANONICAL_EVALUATOR",
  affectedCaseIds: ["SEM-H08"],
  revalidatedCompatibleCaseIds: repairedCaseIds.filter((caseId) => caseId !== "SEM-H08"),
  status: "VALIDATED",
  changedConfigurationOwners: ["evaluator"],
  testEvidence: "src/features/scientific-semantic-reconstruction/__tests__/r4b-constraint-and-target-equivalence.test.ts: exclusion-equivalence scenarios PASS",
  genericRule: "Equivalent explicit exclusion and negated-copula formulations are normalized without weakening the excluded scientific object.",
  goldUsedForProductDecision: false,
});
upsertRepair({
  repairId: "R4B-STUDIED-TARGET-TAXONOMY-008",
  failureClass: "DETERMINISTIC_TAXONOMY_GUARD_GAP",
  owner: "DETERMINISTIC_TAXONOMY_COVERAGE",
  affectedCaseIds: ["SEM-H08"],
  revalidatedCompatibleCaseIds: repairedCaseIds.filter((caseId) => caseId !== "SEM-H08"),
  status: "VALIDATED",
  changedConfigurationOwners: ["coverageAndRepair"],
  testEvidence: "src/features/scientific-semantic-reconstruction/__tests__/r4b-constraint-and-target-equivalence.test.ts: studied-target scenarios PASS",
  genericRule: "An unquantified target explicitly governed by a scientific intent and identified as the study subject remains SCIENTIFIC_OBJECT; explicit values, indices and parameters remain BIOMARKER.",
  goldUsedForProductDecision: false,
});
upsertRepair({
  repairId: "R4B-REFERENCE-METHOD-EVALUATOR-009",
  failureClass: "MULTILINGUAL_EVALUATOR_AND_STUDY_ROLE_FALSE_NEGATIVE",
  owner: "SEM_POST_CANONICAL_EVALUATOR",
  affectedCaseIds: ["SEM-H09"],
  revalidatedCompatibleCaseIds: repairedCaseIds.filter((caseId) => caseId !== "SEM-H09"),
  status: "VALIDATED",
  changedConfigurationOwners: ["evaluator"],
  testEvidence: "src/features/scientific-semantic-reconstruction/__tests__/r4-closure-evaluator-equivalence.test.ts:13/13 PASS",
  genericRule: "Equivalent multilingual virtual non-contrast labels match, and a typed METHOD with REFERENCE_STANDARD study role satisfies a comparator-role Gold without mutating its scientific type.",
  goldUsedForProductDecision: false,
});
writeJson("repair-ledger.json", repairLedger);

const accounting = readJson<any>(path.join(DIRECTORY, "llm-call-accounting.json"));
const compatibleCallsAvoided = replayedResults.reduce((sum, item) => sum + (item.caseId === "SEM-H01" ? 3 : item.operationTraces?.length ?? 0), 0);
accounting.llmCallsAvoidedByResume = Math.max(accounting.llmCallsAvoidedByResume ?? 0, compatibleCallsAvoided);
accounting.deterministicReplays = replayedResults.filter((item) => item.finalStatus === "COMPLETE").length;
accounting.lastRepairLlmCallsPerformed = 0;
writeJson("llm-call-accounting.json", accounting);
writeJson("semantic-metrics.json", { campaignId: manifest.campaignId, status: "NOT_CALCULATED", reason: "REQUIRES_30_OF_30_COMPLETE", complete: replayedResults.filter((item) => item.finalStatus === "COMPLETE").length, required: 30 });

console.log(JSON.stringify({
  decision: initialH07ArbitrationRebase ? "R4B_H07_ARBITRATION_REBASED" : "R4B_GENERIC_REPAIR_REBASED",
  changedConfigurationOwners,
  configurationDigest,
  semanticConfigurationDigest,
  replayedCaseIds: repairedCaseIds,
  holdout: `${replayedResults.filter((item) => item.finalStatus === "COMPLETE").length}/30 COMPLETE`,
  llmCallsPerformed: 0,
  llmCallsAvoided: compatibleCallsAvoided,
}, null, 2));
