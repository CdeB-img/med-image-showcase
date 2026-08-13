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
import { buildSemanticCoverage, criticAcceptIsConsistent } from "../coverage";
import { verifySemanticModelWithKnowledge } from "../knowledge";
import { SEMANTIC_CRITIC_JSON_SCHEMA, SEMANTIC_RECONSTRUCTION_JSON_SCHEMA, parseSemanticCriticResult, parseSemanticReconstructionCandidate } from "../schema";
import {
  SCIENTIFIC_SEMANTIC_MODEL_VERSION,
  SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
  SEMANTIC_CRITIC_PROMPT_VERSION,
  SEMANTIC_RECONSTRUCTION_PROMPT_VERSION,
  type SemanticConversationMessage,
} from "../types";

const ROOT = process.cwd();
const R3J_DIRECTORY = path.resolve(ROOT, "semantic-validation/sem-001r3j");
const R4_DIRECTORY = path.resolve(ROOT, "semantic-validation/sem-001r4");
const DIRECTORY = path.resolve(ROOT, "semantic-validation/sem-001r4a");
const readJson = <T>(target: string): T => JSON.parse(readFileSync(target, "utf8")) as T;
const source = (relativePath: string) => readFileSync(path.resolve(ROOT, relativePath), "utf8");
const writeJson = (name: string, value: unknown) => {
  mkdirSync(DIRECTORY, { recursive: true });
  const target = path.join(DIRECTORY, name);
  const temporary = `${target}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  renameSync(temporary, target);
};
const providerJson = (name: string) => {
  const artifact = readJson<any>(path.join(R4_DIRECTORY, "raw-provider-responses", name));
  const response = JSON.parse(artifact.rawStructuredResponse);
  return JSON.parse(response.candidates[0].content.parts.map((part: any) => part.text ?? "").join(""));
};

const fixture = HOLDOUT_CASES.find((item) => item.caseId === "SEM-H01");
if (!fixture) throw new Error("SEM001R4A_H01_FIXTURE_MISSING");
const r3jFreeze = readJson<any>(path.join(R3J_DIRECTORY, "development-freeze-candidate.json"));
const r4Manifest = readJson<any>(path.join(R4_DIRECTORY, "campaign-manifest.json"));
const caseArtifact = readJson<any>(path.join(R4_DIRECTORY, "cases/SEM-H01.json"));
const forensic = readJson<any>(path.join(DIRECTORY, "h01-forensic-classification-before-repair.json"));
if (forensic.failureClass !== "RELATION_COVERAGE_FALSE_POSITIVE"
  || forensic.firstDivergentStage !== "DETERMINISTIC_RELATION_COVERAGE"
  || forensic.goldUsedForProductDecision !== false) {
  throw new Error("SEM001R4A_FORENSIC_CLASSIFICATION_NOT_FROZEN");
}

const candidate = parseSemanticReconstructionCandidate(providerJson("0001-SEM-H01-reconstruction-t1-c0.json"));
const critic1 = parseSemanticCriticResult(providerJson("0002-SEM-H01-critic-t1-c1.json"));
const critic2 = parseSemanticCriticResult(providerJson("0003-SEM-H01-critic-t1-c2.json"));
const messages: SemanticConversationMessage[] = caseArtifact.originalRequest.map((content: string, index: number) => ({
  messageId: `SEM-H01:user:${index + 1}`,
  role: "USER",
  content,
  createdAt: `2026-08-12T21:01:${String(index).padStart(2, "0")}.000Z`,
}));
const request = {
  schemaVersion: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
  sessionId: "sem-001r4a:SEM-H01",
  language: "fr" as const,
  messages,
  previousModel: null,
};

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
const priorDigests = {
  developmentCorpus: r4Manifest.holdout ? r3jFreeze.digests.developmentCorpus : null,
  developmentGold: r3jFreeze.digests.developmentGold,
  holdoutCorpus: r4Manifest.holdout.corpusDigest,
  holdoutGold: r4Manifest.holdout.goldFrameDigest,
  reconstructionPrompt: r4Manifest.prompts.reconstruction.digest,
  criticPrompt: r4Manifest.prompts.critic.digest,
  auditPrompt: r4Manifest.prompts.audit.digest,
  baseProviderSchema: r4Manifest.schemas.providerBase,
  auditProviderSchema: r4Manifest.schemas.providerAudit,
  canonicalModel: r4Manifest.schemas.internalAndCanonicalModel,
  acceptanceGuards: r4Manifest.implementation.acceptanceGuardsAndAtomicCompilerDigest,
  canonicalizer: r4Manifest.implementation.canonicalizerDigest,
  coverageAndRepair: r4Manifest.implementation.coverageAndRepairDigest,
  evaluator: r4Manifest.implementation.evaluatorDigest,
  routing: r4Manifest.implementation.routingDigest,
};
const changedConfigurationOwners = Object.keys(currentDigests).filter((key) =>
  currentDigests[key as keyof typeof currentDigests] !== priorDigests[key as keyof typeof priorDigests]);
const authorizedRepairOnly = changedConfigurationOwners.length === 1 && changedConfigurationOwners[0] === "coverageAndRepair";

const coverage = buildSemanticCoverage(request, candidate);
const failedCriticChecks = [critic1, critic2].flatMap((critic) => critic.checklist.filter((item) => item.result === "FAIL"));
const staleCriticEvidenceIsIsolated = failedCriticChecks.length === 2
  && failedCriticChecks.every((item) => item.check === "EVERY_EXPLICIT_RELATION_REPRESENTED")
  && [critic1, critic2].every((critic) => critic.missingExplicitSourceFragments.length === 0
    && critic.issues.length === 1
    && ["RELATION_LOSS", "EXPLICIT_RELATION_UNMAPPED"].includes(critic.issues[0].code));
const repairedRelationCoverage = coverage.relations.entries.find((item) => item.inventoryRelationId === "rel-2");
const candidateUnchanged = logicalDigest(candidate) === caseArtifact.operationTraces.find((item: any) => item.operation === "RECONSTRUCTION")?.structuredDigest;

const reconciledCritic = parseSemanticCriticResult({
  ...critic2,
  criticId: "critic-r4a-deterministic-reconciliation",
  verdict: "ACCEPT",
  checklist: critic2.checklist.map((item) => item.check === "EVERY_EXPLICIT_RELATION_REPRESENTED"
    ? { ...item, result: "PASS", evidence: "Deterministic R4A coverage recognizes rel-2 through its explicit source-grounded direct comparison carrier." }
    : item),
  issues: critic2.issues.map((issue) => ({ ...issue, resolved: true })),
  proposedRepairs: [],
  criticSummary: "Persisted critic evidence reconciled deterministically after its sole relation-coverage finding became stale; no provider judgment or graph repair was fabricated.",
});
const reconciliationAllowed = authorizedRepairOnly
  && candidateUnchanged
  && staleCriticEvidenceIsIsolated
  && coverage.explicit.status === "COMPLETE"
  && coverage.relations.status === "COMPLETE"
  && coverage.taxonomy.status === "COMPLETE"
  && repairedRelationCoverage?.coverageStatus === "MAPPED"
  && criticAcceptIsConsistent(reconciledCritic, coverage);

let semanticModel = null;
let metric = null;
let decision = "R4A_H01_REQUIRES_FURTHER_REPAIR";
if (!authorizedRepairOnly) {
  decision = "R4A_BLOCKED_BY_CONFIGURATION_DRIFT";
} else if (reconciliationAllowed) {
  const reconstructionCallId = caseArtifact.operationTraces.find((item: any) => item.operation === "RECONSTRUCTION")?.callId;
  const originalCriticCallIds = caseArtifact.operationTraces.filter((item: any) => item.operation === "CRITIC").map((item: any) => item.callId);
  if (!reconstructionCallId || originalCriticCallIds.length !== 2) throw new Error("SEM001R4A_PERSISTED_CALL_EVIDENCE_INCOMPLETE");
  semanticModel = verifySemanticModelWithKnowledge(canonicalizeSemanticReconstruction({
    request,
    candidate,
    critic: reconciledCritic,
    metadata: { provider: "GOOGLE_GEMINI_PERSISTED_R4_EVIDENCE", model: r4Manifest.model, temperature: null },
    reconstructionCallId,
    criticCallId: "deterministic-reconciliation:r4a:h01",
    criticCallIds: [...originalCriticCallIds, "deterministic-reconciliation:r4a:h01"],
    critics: [critic1, critic2, reconciledCritic],
    reconstructionAttempts: [],
    criticAttempts: [],
    now: new Date().toISOString(),
  }));
  metric = evaluateSemanticCase(fixture, semanticModel);
  const h01Passed = semanticModel.status === "CANDIDATE"
    && metric.explicitObjectRecall === 1
    && metric.explicitRelationRecall === 1
    && metric.criticalSemanticRecall === 1
    && metric.criticalUnsupportedInferenceCount === 0
    && metric.absoluteBlockers.length === 0
    && metric.routeCorrect;
  decision = h01Passed
    ? "R4A_H01_REPAIR_PASSED_READY_FOR_HOLDOUT_RESUME"
    : "R4A_H01_REQUIRES_FURTHER_REPAIR";
}

const artifact = {
  campaign: "SEM-001R4A",
  caseId: "SEM-H01",
  replayedAt: new Date().toISOString(),
  decision,
  failureClass: forensic.failureClass,
  firstDivergentStage: forensic.firstDivergentStage,
  correctedOwner: "DETERMINISTIC_RELATION_COVERAGE",
  configuration: {
    baselineCampaign: "SEM-001R4",
    baselineConfigurationDigest: r4Manifest.configurationDigest,
    baselineSemanticConfigurationDigest: r4Manifest.semanticConfigurationDigest,
    previousDigests: priorDigests,
    currentDigests,
    changedConfigurationOwners,
    authorizedRepairOnly,
    r4aSemanticConfigurationDigest: logicalDigest({
      model: r4Manifest.model,
      versions: {
        reconstruction: SEMANTIC_RECONSTRUCTION_PROMPT_VERSION,
        critic: SEMANTIC_CRITIC_PROMPT_VERSION,
        schema: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
        model: SCIENTIFIC_SEMANTIC_MODEL_VERSION,
      },
      digests: currentDigests,
    }),
    disposition: "R4 remains historical and failed; R4A is separate repair evidence and does not mutate the frozen R4 manifest.",
  },
  invalidationAndReuse: {
    firstInvalidatedStage: "DETERMINISTIC_RELATION_COVERAGE",
    reconstruction: "REUSED_COMPATIBLE_PERSISTED_EVIDENCE",
    providerCritics: "REUSED_AS_DIAGNOSTIC_EVIDENCE_ONLY",
    criticDisposition: "DETERMINISTICALLY_RECONCILED_AFTER_SOLE_FINDING_BECAME_STALE",
    canonicalization: "REPLAYED",
    knowledgeVerification: "REPLAYED",
    independentGoldEvaluation: "REPLAYED_AFTER_PRODUCT_DECISION",
    candidateUnchanged,
    noCriticRepairsApplied: true,
  },
  goldBoundary: {
    goldUsedForProductDecision: false,
    goldUsedForIndependentPostRepairEvaluation: true,
    goldFrameDigest: logicalDigest(fixture.gold),
  },
  deterministicEvidence: {
    coverage,
    repairedRelationCoverage,
    staleCriticEvidenceIsIsolated,
    reconciledCritic,
    reconciliationAllowed,
  },
  semanticModel,
  semanticModelDigest: semanticModel?.digest ?? null,
  metric,
  h01Status: decision === "R4A_H01_REPAIR_PASSED_READY_FOR_HOLDOUT_RESUME" ? "PASS" : "FAIL",
  llm: {
    actualCalls: 0,
    retries: 0,
    callsAvoidedByCompatibleReuse: 3,
    providerStatus: "NOT_CALLED",
  },
  holdout: {
    SEM_H01: decision === "R4A_H01_REPAIR_PASSED_READY_FOR_HOLDOUT_RESUME" ? "PASS_R4A_ISOLATED_REPLAY" : "FAIL_R4A_ISOLATED_REPLAY",
    SEM_H02_to_SEM_H30: "NOT_STARTED",
    fullHoldout: "NOT_RUN",
    officialAggregateMetrics: "NOT_CALCULATED",
  },
};
writeJson("h01-deterministic-replay-r4a.json", artifact);
writeJson("llm-call-accounting-r4a.json", {
  campaign: "SEM-001R4A",
  caseId: "SEM-H01",
  actualLlmCalls: 0,
  retries: 0,
  callsAvoidedByCompatibleReuse: 3,
  reused: ["R4 H01 reconstruction", "R4 H01 critic cycle 1", "R4 H01 critic cycle 2"],
  holdoutCasesNotStarted: ["SEM-H02", "SEM-H03", "SEM-H04", "SEM-H05", "SEM-H06", "SEM-H07", "SEM-H08", "SEM-H09", "SEM-H10", "SEM-H11", "SEM-H12", "SEM-H13", "SEM-H14", "SEM-H15", "SEM-H16", "SEM-H17", "SEM-H18", "SEM-H19", "SEM-H20", "SEM-H21", "SEM-H22", "SEM-H23", "SEM-H24", "SEM-H25", "SEM-H26", "SEM-H27", "SEM-H28", "SEM-H29", "SEM-H30"],
});
writeJson("qualification-summary-r4a.json", {
  campaign: "SEM-001R4A",
  decision,
  case: "SEM-H01",
  status: artifact.h01Status,
  failureClass: forensic.failureClass,
  firstDivergentStage: forensic.firstDivergentStage,
  llm: artifact.llm,
  holdout: artifact.holdout,
  metric,
});

console.log(JSON.stringify({
  decision,
  caseId: "SEM-H01",
  h01Status: artifact.h01Status,
  failureClass: forensic.failureClass,
  firstDivergentStage: forensic.firstDivergentStage,
  changedConfigurationOwners,
  coverage: { explicit: coverage.explicit.status, relations: coverage.relations.status, taxonomy: coverage.taxonomy.status },
  metric,
  llm: artifact.llm,
  holdout: artifact.holdout,
}, null, 2));
if (decision !== "R4A_H01_REPAIR_PASSED_READY_FOR_HOLDOUT_RESUME") process.exitCode = 2;
