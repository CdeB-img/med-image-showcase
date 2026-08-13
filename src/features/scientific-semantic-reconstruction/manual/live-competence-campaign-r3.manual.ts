import { copyFileSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnv } from "vite";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { SCIENTIFIC_SEMANTIC_CRITIC_PROMPT, SCIENTIFIC_SEMANTIC_RECONSTRUCTION_PROMPT } from "../../../../api/prompts/scientific-semantic-reconstruction-prompt";
import { canonicalizeSemanticReconstruction } from "../canonical";
import { evaluateSemanticCampaign, evaluateSemanticCase, semanticMeaningMatches, type SemanticCaseMetrics } from "../competence";
import { DEVELOPMENT_CASES, HOLDOUT_CASES, type SemanticCompetenceCase } from "../competence-fixtures";
import { runSemanticCriticCycles, type CriticRepairDiagnostic } from "../coverage";
import { verifySemanticModelWithKnowledge } from "../knowledge";
import { GeminiScientificSemanticProvider, SemanticProviderError } from "../provider";
import { SEMANTIC_CRITIC_JSON_SCHEMA, SEMANTIC_RECONSTRUCTION_JSON_SCHEMA } from "../schema";
import {
  SCIENTIFIC_SEMANTIC_MODEL_VERSION,
  SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
  SEMANTIC_CRITIC_PROMPT_VERSION,
  SEMANTIC_RECONSTRUCTION_PROMPT_VERSION,
  type ScientificSemanticModel,
  type SemanticConversationMessage,
  type SemanticCriticResult,
  type SemanticProviderAttempt,
  type SemanticReconstructionCandidate,
} from "../types";
import { RollingWindowRequestLimiter } from "./rolling-rate-limiter";

const MODEL_ID = "gemini-3.5-flash-lite";
const MAX_REQUESTS_PER_MINUTE = 5;
const CONCURRENCY = 1;
const WINDOW_MS = 60_000;
const TIMEOUT_MS = 90_000;
const MAX_ATTEMPTS = 4;
const RETRY_BASE_MS = 10_000;
const MAX_RETRY_DELAY_MS = 80_000;
const EVALUATOR_VERSION = "SEM-001-EVALUATOR-1.2";
const CAMPAIGN_VERSION = "SEM-001R3-CAMPAIGN-1.0";
const FROZEN_HOLDOUT_CORPUS_DIGEST = "ke1-08392b87b2cc140b";
const FROZEN_GOLD_FRAME_DIGEST = "ke1-34ef12e65473a7f2";
const FROZEN_VALIDATION_FILE_DIGEST = "ke1-ad6dfe2f629e2343";
const ARTIFACT_DIRECTORY = path.resolve(process.cwd(), "semantic-validation/sem-001r3");
const DEVELOPMENT = process.argv.includes("--development");
const HOLDOUT = process.argv.includes("--holdout");
const RESUME = process.argv.includes("--resume");
const NEW_DEVELOPMENT = process.argv.includes("--new-development");
const maxCasesArgument = process.argv.find((item) => item.startsWith("--max-cases="));
const MAX_CASES = maxCasesArgument ? Number(maxCasesArgument.split("=")[1]) : null;
const developmentCaseIdsArgument = process.argv.find((item) => item.startsWith("--case-ids="));
const DEVELOPMENT_CASE_IDS = developmentCaseIdsArgument ? new Set(developmentCaseIdsArgument.split("=")[1].split(",").filter(Boolean)) : null;

if (DEVELOPMENT === HOLDOUT) throw new Error("SEM001R3_EXACTLY_ONE_SPLIT_REQUIRED");
if (MAX_CASES !== null && (!DEVELOPMENT || !Number.isInteger(MAX_CASES) || MAX_CASES < 1)) throw new Error("SEM001R3_MAX_CASES_DEVELOPMENT_ONLY");
if (DEVELOPMENT_CASE_IDS && !DEVELOPMENT) throw new Error("SEM001R3_CASE_IDS_DEVELOPMENT_ONLY");

type ModelAudit = {
  endpoint: "v1beta/models";
  httpStatus: number;
  apiName: string;
  modelId: string;
  displayName: string;
  version: string;
  supportedGenerationMethods: string[];
  inputTokenLimit: number | null;
  outputTokenLimit: number | null;
  structuredOutputsSupportedByOfficialDocumentation: true;
};

type OperationTrace = {
  operation: "RECONSTRUCTION" | "CRITIC";
  turn: number;
  cycle: number | null;
  callId: string | null;
  structuredDigest: string | null;
  attempts: SemanticProviderAttempt[];
};

type CriticImpactCase = {
  caseId: string;
  beforeCriticObjectRecall: number;
  afterCriticObjectRecall: number;
  beforeCriticRelationRecall: number;
  afterCriticRelationRecall: number;
  issuesDetected: number;
  repairsProposed: number;
  repairsAccepted: number;
  repairsRejected: number;
  newUnsupportedInferences: number;
  falsePositiveCritic: boolean;
  criticAccepted: boolean;
  criticCycles: number;
  terminalReason: string;
};

type CampaignCaseResult = {
  caseId: string;
  split: SemanticCompetenceCase["split"];
  goldFrameDigest: string;
  reconstructionPromptVersion: typeof SEMANTIC_RECONSTRUCTION_PROMPT_VERSION;
  criticPromptVersion: typeof SEMANTIC_CRITIC_PROMPT_VERSION;
  provider: "GOOGLE_GEMINI";
  model: typeof MODEL_ID;
  requestStarted: string;
  completedAt: string | null;
  reconstructionStatus: "NOT_STARTED" | "SUCCESS" | "FAILED";
  criticStatus: "NOT_STARTED" | "SUCCESS" | "FAILED";
  canonicalizationStatus: "NOT_STARTED" | "SUCCESS" | "FAILED";
  evaluationStatus: "NOT_READY" | "READY";
  finalStatus: "COMPLETE" | "FAILED";
  retryCount: number;
  latencyMs: number;
  operationTraces: OperationTrace[];
  reconstructionCandidate: SemanticReconstructionCandidate | null;
  critics: SemanticCriticResult[];
  repairDiagnostics: CriticRepairDiagnostic[];
  criticTerminalReason: string | null;
  semanticModel: ScientificSemanticModel | null;
  beforeCriticModel: ScientificSemanticModel | null;
  criticImpact: CriticImpactCase | null;
  error: { category: string; failureClass: string; httpStatus: number | null; providerStatus: string | null; providerCode: string | null; message: string } | null;
};

type CampaignManifest = {
  campaignVersion: typeof CAMPAIGN_VERSION;
  campaignId: string;
  configurationDigest: string;
  developmentRunId: string;
  caseIds: string[];
  holdoutCorpusDigest: typeof FROZEN_HOLDOUT_CORPUS_DIGEST;
  goldFrameDigest: typeof FROZEN_GOLD_FRAME_DIGEST;
  validationFileDigest: typeof FROZEN_VALIDATION_FILE_DIGEST;
  provider: "GOOGLE_GEMINI";
  model: ModelAudit;
  reconstructionPromptVersion: typeof SEMANTIC_RECONSTRUCTION_PROMPT_VERSION;
  criticPromptVersion: typeof SEMANTIC_CRITIC_PROMPT_VERSION;
  reconstructionPromptDigest: string;
  criticPromptDigest: string;
  schemaVersion: typeof SCIENTIFIC_SEMANTIC_SCHEMA_VERSION;
  canonicalModelVersion: typeof SCIENTIFIC_SEMANTIC_MODEL_VERSION;
  providerSchemaDigest: string;
  canonicalizerDigest: string;
  coverageAndRepairDigest: string;
  evaluatorDigest: string;
  semanticEvaluatorVersion: typeof EVALUATOR_VERSION;
  temperature: null;
  samplingParameters: "NOT_APPLICABLE_DEPRECATED_AND_OMITTED";
  thresholds: typeof thresholds;
  requestPolicy: typeof requestPolicy;
  startedAt: string;
};

const environment = loadEnv("development", process.cwd(), "");
const apiKey = environment.GEMINI_API_KEY?.trim();
const fixtures = DEVELOPMENT ? DEVELOPMENT_CASES : HOLDOUT_CASES;
const resultsFile = DEVELOPMENT ? "development-results.json" : "case-results.json";
const metricsFile = DEVELOPMENT ? "development-metrics.json" : "semantic-metrics.json";
const runLabel = DEVELOPMENT ? "SEM-R3-DEV" : "SEM-R3-HOLDOUT";

const thresholds = {
  criticalSemanticRecall: .98,
  explicitObjectRecall: .98,
  explicitRelationRecall: .95,
  comparatorPreservation: 1,
  interventionPreservation: 1,
  modalityPreservation: 1,
  criticalUnsupportedInferenceRate: 0,
  genericDomainCollapseRate: 0,
  correctionPropagationRate: 1,
  multiTurnCriticalContextLoss: 0,
} as const;
const requestPolicy = {
  concurrency: CONCURRENCY,
  maxRequestsPerMinute: MAX_REQUESTS_PER_MINUTE,
  rollingWindowMs: WINDOW_MS,
  timeoutMs: TIMEOUT_MS,
  maxAttemptsPerOperation: MAX_ATTEMPTS,
  retryBaseMs: RETRY_BASE_MS,
  maxRetryDelayMs: MAX_RETRY_DELAY_MS,
} as const;

const artifactPath = (name: string) => path.join(ARTIFACT_DIRECTORY, name);
const exists = (name: string) => { try { readFileSync(artifactPath(name)); return true; } catch { return false; } };
const readJson = <T>(name: string): T => JSON.parse(readFileSync(artifactPath(name), "utf8")) as T;
const writeJson = (name: string, value: unknown) => {
  mkdirSync(ARTIFACT_DIRECTORY, { recursive: true });
  const target = artifactPath(name);
  const temporary = `${target}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  renameSync(temporary, target);
};
const safeMessage = (caught: unknown) => caught instanceof Error ? caught.message.slice(0, 800) : "UNKNOWN_FAILURE";
const totalAttempts = (traces: OperationTrace[]) => traces.reduce((sum, trace) => sum + trace.attempts.length, 0);
const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const auditModel = async (): Promise<ModelAudit> => {
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000", { headers: { "x-goog-api-key": apiKey! } });
  const body = await response.json().catch(() => null) as { models?: Array<{ name?: string; displayName?: string; version?: string; supportedGenerationMethods?: string[]; inputTokenLimit?: number; outputTokenLimit?: number }>; error?: { status?: string } } | null;
  const model = body?.models?.find((item) => item.name === `models/${MODEL_ID}`);
  if (!response.ok || !model?.supportedGenerationMethods?.includes("generateContent")) throw new Error(response.ok ? "GEMINI_3_5_FLASH_LITE_UNAVAILABLE" : `MODEL_AUDIT_FAILED:${body?.error?.status ?? response.status}`);
  return {
    endpoint: "v1beta/models", httpStatus: response.status, apiName: model.name!, modelId: MODEL_ID,
    displayName: model.displayName ?? "Gemini 3.5 Flash Lite", version: model.version ?? "NOT_EXPOSED",
    supportedGenerationMethods: model.supportedGenerationMethods, inputTokenLimit: model.inputTokenLimit ?? null,
    outputTokenLimit: model.outputTokenLimit ?? null, structuredOutputsSupportedByOfficialDocumentation: true,
  };
};

const freezeMaterial = (model: ModelAudit) => ({
  campaignVersion: CAMPAIGN_VERSION,
  caseIds: HOLDOUT_CASES.map((item) => item.caseId),
  holdoutCorpusDigest: logicalDigest(HOLDOUT_CASES.map((item) => ({ caseId: item.caseId, turns: item.turns, split: item.split }))),
  goldFrameDigest: logicalDigest(HOLDOUT_CASES.map((item) => ({ caseId: item.caseId, gold: item.gold }))),
  validationFileDigest: logicalDigest(HOLDOUT_CASES),
  provider: "GOOGLE_GEMINI" as const,
  model,
  reconstructionPromptVersion: SEMANTIC_RECONSTRUCTION_PROMPT_VERSION,
  criticPromptVersion: SEMANTIC_CRITIC_PROMPT_VERSION,
  reconstructionPromptDigest: logicalDigest(SCIENTIFIC_SEMANTIC_RECONSTRUCTION_PROMPT),
  criticPromptDigest: logicalDigest(SCIENTIFIC_SEMANTIC_CRITIC_PROMPT),
  schemaVersion: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
  canonicalModelVersion: SCIENTIFIC_SEMANTIC_MODEL_VERSION,
  providerSchemaDigest: logicalDigest({ reconstruction: SEMANTIC_RECONSTRUCTION_JSON_SCHEMA, critic: SEMANTIC_CRITIC_JSON_SCHEMA }),
  canonicalizerDigest: logicalDigest(readFileSync(path.resolve(process.cwd(), "src/features/scientific-semantic-reconstruction/canonical.ts"), "utf8")),
  coverageAndRepairDigest: logicalDigest(readFileSync(path.resolve(process.cwd(), "src/features/scientific-semantic-reconstruction/coverage.ts"), "utf8")),
  evaluatorDigest: logicalDigest(readFileSync(path.resolve(process.cwd(), "src/features/scientific-semantic-reconstruction/competence.ts"), "utf8")),
  semanticEvaluatorVersion: EVALUATOR_VERSION,
  temperature: null,
  samplingParameters: "NOT_APPLICABLE_DEPRECATED_AND_OMITTED" as const,
  thresholds,
  requestPolicy,
});

const frozenDigestsValid = (material: ReturnType<typeof freezeMaterial>) => material.holdoutCorpusDigest === FROZEN_HOLDOUT_CORPUS_DIGEST
  && material.goldFrameDigest === FROZEN_GOLD_FRAME_DIGEST
  && material.validationFileDigest === FROZEN_VALIDATION_FILE_DIGEST;

const emptyCritic = (): SemanticCriticResult => ({
  criticId: "pre-critic-metric-only",
  verdict: "ACCEPT",
  checklist: [
    "EVERY_EXPLICIT_OBJECT_REPRESENTED", "EVERY_COMPARATOR_REPRESENTED", "EVERY_INTERVENTION_REPRESENTED", "EVERY_MODALITY_REPRESENTED",
    "EVERY_EXPLICIT_RELATION_REPRESENTED", "NO_INCOMPATIBLE_OBJECT_TYPE", "NO_EXPLICIT_RELATION_WEAKENED", "NO_INFERENCE_PROMOTED",
    "NO_AMBIGUITY_HIDDEN", "NO_NEGATION_REVERSED_OR_IGNORED", "NO_TIMING_LOST", "NO_UNSUPPORTED_OUTCOME_ENDPOINT_PROMOTION",
    "NO_SPECIFIC_CONCEPT_GENERALIZED", "NO_IMPORTANT_FRAGMENT_UNREPRESENTED",
    "ROUTE_MATCHES_COMPLETE_SEMANTIC_MODEL",
  ].map((check) => ({ check: check as SemanticCriticResult["checklist"][number]["check"], result: "PASS", evidence: "Metric-only pre-critic snapshot." })),
  missingExplicitSourceFragments: [], issues: [], proposedRepairs: [], criticSummary: "Metric-only pre-critic snapshot.",
});

const preCriticMetricCandidate = (request: { messages: SemanticConversationMessage[] }, candidate: SemanticReconstructionCandidate) => {
  const metricCandidate = structuredClone(candidate);
  const exactSpan = (messageId: string | null, sourceText: string | null) => Boolean(
    messageId && sourceText && request.messages.some((message) => message.role === "USER" && message.messageId === messageId && message.content.includes(sourceText)),
  );
  const downgraded = new Set<string>();
  metricCandidate.elements = metricCandidate.elements.map((element) => {
    if (element.epistemicStatus !== "EXPLICIT_USER_STATED" || exactSpan(element.sourceMessageId, element.sourceText)) return element;
    downgraded.add(element.clientElementId);
    return { ...element, sourceMessageId: null, sourceText: null, epistemicStatus: "INFERRED_CANDIDATE" as const, confidence: Math.min(element.confidence, .5), inferenceReason: "PRE_CRITIC_EXPLICIT_SOURCE_SPAN_INVALID", requiresConfirmation: true };
  });
  metricCandidate.relations = metricCandidate.relations.map((relation) => downgraded.has(relation.sourceClientElementId) || downgraded.has(relation.targetClientElementId)
    ? { ...relation, epistemicStatus: "INFERRED_CANDIDATE" as const, confidence: Math.min(relation.confidence, .5), inferenceReason: "PRE_CRITIC_ENDPOINT_SOURCE_SPAN_INVALID", requiresConfirmation: true }
    : relation);
  return metricCandidate;
};

const metricDetails = (caseMetrics: SemanticCaseMetrics[], sourceFixtures: SemanticCompetenceCase[]) => {
  const detail = (name: keyof SemanticCaseMetrics, desired: "ONE" | "ZERO", relevant = caseMetrics) => {
    const values = relevant.map((item) => Number(item[name]));
    return { numerator: values.reduce((sum, value) => sum + value, 0), denominator: values.length, score: values.length ? average(values) : 1, casesInError: relevant.filter((item) => desired === "ONE" ? Number(item[name]) < 1 : Number(item[name]) > 0).map((item) => item.caseId) };
  };
  const subsetForType = (type: string) => {
    const ids = new Set(sourceFixtures.filter((fixture) => fixture.gold.requiredExplicitObjects.some((item) => item.type === type)).map((item) => item.caseId));
    return caseMetrics.filter((item) => ids.has(item.caseId));
  };
  return {
    explicitObjectRecall: detail("explicitObjectRecall", "ONE"), explicitRelationRecall: detail("explicitRelationRecall", "ONE"), criticalSemanticRecall: detail("criticalSemanticRecall", "ONE"),
    comparatorPreservation: detail("comparatorPreserved", "ONE", subsetForType("COMPARATOR")), interventionPreservation: detail("interventionPreserved", "ONE", subsetForType("INTERVENTION")), modalityPreservation: detail("modalityPreserved", "ONE", subsetForType("MODALITY")),
    semanticDriftRate: detail("semanticDriftRate", "ZERO"), unsupportedInferenceRate: detail("unsupportedInferenceRate", "ZERO"), criticalUnsupportedInferenceRate: detail("criticalUnsupportedInferenceCount", "ZERO"),
    ellipsisDetectionRate: detail("ellipsisDetectionRate", "ONE"), ambiguityPreservationRate: detail("ambiguityPreservationRate", "ONE"), unnecessaryClarificationRate: detail("unnecessaryClarificationRate", "ZERO"), routeCorrectness: detail("routeCorrect", "ONE"),
    correctionPropagationRate: detail("correctionPropagation", "ONE", caseMetrics.filter((item) => sourceFixtures.find((fixture) => fixture.caseId === item.caseId)?.gold.correction)),
    multiTurnContextPreservation: detail("multiTurnContextPreserved", "ONE", caseMetrics.filter((item) => (sourceFixtures.find((fixture) => fixture.caseId === item.caseId)?.turns.length ?? 0) > 1)), genericDomainCollapseRate: detail("genericDomainCollapse", "ZERO"),
  };
};

const classifyBlocker = (blocker: string, model: ScientificSemanticModel) => {
  if (blocker.startsWith("EXPLICIT_")) {
    const meaning = blocker.slice(blocker.indexOf(":") + 1);
    const presentWrongType = model.elements.some((element) => element.epistemicStatus === "EXPLICIT_USER_STATED" && [element.canonicalMeaning, element.sourceSpan?.text ?? ""].some((value) => semanticMeaningMatches(value, meaning)));
    return presentWrongType ? "TAXONOMY_FAILURE" : "OBJECT_COVERAGE_FAILURE";
  }
  if (blocker.startsWith("RELATION_LOST")) return "RELATION_COVERAGE_FAILURE";
  if (blocker.startsWith("FORBIDDEN_INFERENCE")) return "MODEL_REASONING_FAILURE";
  if (blocker === "CORRECTION_NOT_PROPAGATED" || blocker === "MULTI_TURN_CONTEXT_LOST" || blocker === "GENERIC_DOMAIN_COLLAPSE") return "MODEL_REASONING_FAILURE";
  return "EVALUATOR_FAILURE";
};

const writeDiagnostics = (runId: string, sourceFixtures: SemanticCompetenceCase[], results: CampaignCaseResult[], perCase: SemanticCaseMetrics[]) => {
  const byId = new Map(results.map((item) => [item.caseId, item]));
  const semanticFailures = perCase.flatMap((metric) => metric.absoluteBlockers.map((blocker) => ({
    caseId: metric.caseId,
    blocker,
    classification: classifyBlocker(blocker, byId.get(metric.caseId)!.semanticModel!),
    canonicalModelDigest: byId.get(metric.caseId)!.semanticModel!.digest,
  })));
  const criticFailures = results.filter((item) => !item.criticImpact?.criticAccepted).map((item) => ({
    caseId: item.caseId,
    blocker: `CRITIC_NOT_ACCEPTED:${item.criticImpact?.terminalReason ?? "MISSING"}`,
    classification: item.criticImpact?.repairsRejected ? "CRITIC_REPAIR_FAILURE" : "CRITIC_FAILURE",
    canonicalModelDigest: item.semanticModel?.digest ?? "NONE",
  }));
  const failures = [...semanticFailures, ...criticFailures];
  writeJson("semantic-failures.json", failures);
  writeJson("taxonomy-diagnostics.json", { runId, failures: failures.filter((item) => item.classification === "TAXONOMY_FAILURE").map((failure) => ({ ...failure, actual: byId.get(failure.caseId)?.semanticModel?.elements.filter((element) => element.epistemicStatus === "EXPLICIT_USER_STATED").map((element) => ({ meaning: element.canonicalMeaning, type: element.type, studyRole: element.studyRole, polarity: element.polarity })) })) });
  writeJson("relation-diagnostics.json", { runId, failures: failures.filter((item) => item.classification === "RELATION_COVERAGE_FAILURE"), coverage: results.map((item) => ({ caseId: item.caseId, report: item.semanticModel?.relationCoverageReport })) });
  writeJson("polarity-diagnostics.json", { runId, failures: failures.filter((item) => ["POLARITY_FAILURE", "MODEL_REASONING_FAILURE"].includes(item.classification) && item.blocker.startsWith("FORBIDDEN_INFERENCE")), negatedElements: results.flatMap((item) => item.semanticModel?.elements.filter((element) => element.polarity === "NEGATED").map((element) => ({ caseId: item.caseId, type: element.type, meaning: element.canonicalMeaning })) ?? []) });
  writeJson("route-diagnostics.json", { runId, cases: perCase.map((metric) => ({ caseId: metric.caseId, routeCorrect: metric.routeCorrect, actual: byId.get(metric.caseId)?.semanticModel?.routeProposal.route, allowed: sourceFixtures.find((fixture) => fixture.caseId === metric.caseId)?.gold.allowedRoutes })).filter((item) => !item.routeCorrect) });
  const impact = results.map((item) => item.criticImpact!).filter(Boolean);
  writeJson("critic-impact.json", {
    runId,
    aggregate: {
      beforeCriticObjectRecall: average(impact.map((item) => item.beforeCriticObjectRecall)), afterCriticObjectRecall: average(impact.map((item) => item.afterCriticObjectRecall)),
      beforeCriticRelationRecall: average(impact.map((item) => item.beforeCriticRelationRecall)), afterCriticRelationRecall: average(impact.map((item) => item.afterCriticRelationRecall)),
      issuesDetected: impact.reduce((sum, item) => sum + item.issuesDetected, 0), repairsProposed: impact.reduce((sum, item) => sum + item.repairsProposed, 0),
      repairsAccepted: impact.reduce((sum, item) => sum + item.repairsAccepted, 0), repairsRejected: impact.reduce((sum, item) => sum + item.repairsRejected, 0),
      newUnsupportedInferences: impact.reduce((sum, item) => sum + item.newUnsupportedInferences, 0), falsePositiveCriticRate: impact.filter((item) => item.falsePositiveCritic).length / Math.max(1, impact.length),
      criticAcceptanceRate: impact.filter((item) => item.criticAccepted).length / Math.max(1, impact.length),
    },
    perCase: impact,
  });
  return failures;
};

if (!apiKey) {
  console.log(JSON.stringify({ status: "NOT_DEMONSTRATED", reason: "GEMINI_API_KEY_MISSING" }, null, 2));
  process.exitCode = 2;
} else {
  if (RESUME && NEW_DEVELOPMENT) throw new Error("SEM001R3_RESUME_AND_NEW_DEVELOPMENT_MUTUALLY_EXCLUSIVE");
  if (HOLDOUT && NEW_DEVELOPMENT) throw new Error("SEM001R3_NEW_DEVELOPMENT_INVALID_FOR_HOLDOUT");
  const startedMs = Date.now();
  const modelAudit = await auditModel();
  const material = freezeMaterial(modelAudit);
  if (!frozenDigestsValid(material)) throw new Error("SEM001R3_FROZEN_GOLD_OR_HOLDOUT_DIGEST_CHANGED");
  mkdirSync(ARTIFACT_DIRECTORY, { recursive: true });

  let runId: string;
  let manifest: CampaignManifest | null = null;
  let caseResults: CampaignCaseResult[] = [];

  if (DEVELOPMENT) {
    if (exists(resultsFile) && !RESUME && !NEW_DEVELOPMENT) throw new Error("SEM001R3_DEVELOPMENT_EXISTS_USE_RESUME_OR_NEW_DEVELOPMENT");
    if (NEW_DEVELOPMENT && exists(resultsFile)) {
      const prior = readJson<CampaignCaseResult[]>(resultsFile);
      const previousRun = prior[0]?.requestStarted.replace(/[:.]/g, "-") ?? new Date().toISOString().replace(/[:.]/g, "-");
      const historyDirectory = path.join(ARTIFACT_DIRECTORY, "history", `development-${previousRun}`);
      mkdirSync(historyDirectory, { recursive: true });
      for (const name of readdirSync(ARTIFACT_DIRECTORY).filter((item) => item.startsWith("development-") || ["critic-impact.json", "taxonomy-diagnostics.json", "relation-diagnostics.json", "polarity-diagnostics.json", "route-diagnostics.json"].includes(item))) copyFileSync(artifactPath(name), path.join(historyDirectory, name));
    }
    caseResults = RESUME && exists(resultsFile) ? readJson<CampaignCaseResult[]>(resultsFile) : [];
    runId = caseResults[0]?.requestStarted ? `sem-001r3-development-${caseResults[0].requestStarted.replace(/[:.]/g, "-")}` : `sem-001r3-development-${new Date(startedMs).toISOString().replace(/[:.]/g, "-")}`;
  } else {
    if (!exists("development-results.json") || !exists("development-metrics.json")) throw new Error("SEM001R3_DEVELOPMENT_30_OF_30_REQUIRED_BEFORE_HOLDOUT");
    const developmentResults = readJson<CampaignCaseResult[]>("development-results.json");
    if (developmentResults.filter((item) => item.finalStatus === "COMPLETE").length !== DEVELOPMENT_CASES.length) throw new Error("SEM001R3_DEVELOPMENT_INCOMPLETE");
    const developmentRunId = `sem-001r3-development-${developmentResults[0].requestStarted.replace(/[:.]/g, "-")}`;
    const configurationDigest = logicalDigest({ ...material, developmentRunId });
    if (RESUME) {
      if (!exists("campaign-manifest.json")) throw new Error("SEM001R3_HOLDOUT_MANIFEST_MISSING");
      manifest = readJson<CampaignManifest>("campaign-manifest.json");
      if (manifest.configurationDigest !== configurationDigest) throw new Error("SEM001R3_INVALID_MIXED_CAMPAIGN");
      caseResults = exists(resultsFile) ? readJson<CampaignCaseResult[]>(resultsFile) : [];
    } else {
      if (exists("campaign-manifest.json")) throw new Error("SEM001R3_HOLDOUT_ALREADY_STARTED_USE_RESUME");
      const startedAt = new Date(startedMs).toISOString();
      manifest = { ...material, campaignId: `sem-001r3-${startedAt.replace(/[:.]/g, "-")}-${configurationDigest}`, configurationDigest, developmentRunId, startedAt } as CampaignManifest;
      writeJson("campaign-manifest.json", manifest);
      writeJson(resultsFile, []);
      writeJson(metricsFile, { campaignId: manifest.campaignId, status: "NOT_CALCULATED", reason: "REQUIRES_30_OF_30_COMPLETE" });
    }
    runId = manifest.campaignId;
  }

  const priorAttempts = caseResults.flatMap((item) => item.operationTraces.flatMap((trace) => trace.attempts));
  const limiter = new RollingWindowRequestLimiter({ maxRequests: MAX_REQUESTS_PER_MINUTE, windowMs: WINDOW_MS, safetyMarginMs: 500, initialStarts: priorAttempts.map((item) => item.requestStarted), initialTotalStarts: priorAttempts.length });
  const provider = new GeminiScientificSemanticProvider({ apiKey, model: MODEL_ID, timeoutMs: TIMEOUT_MS, maxAttempts: MAX_ATTEMPTS, retryBaseMs: RETRY_BASE_MS, maxRetryDelayMs: MAX_RETRY_DELAY_MS, retryJitterRatio: .2, beforeAttempt: () => limiter.acquire() });
  const models = new Map(caseResults.filter((item) => item.finalStatus === "COMPLETE" && item.semanticModel).map((item) => [item.caseId, item.semanticModel!]));

  const checkpoint = (status: "RUNNING" | "COMPLETE" | "INCOMPLETE") => {
    writeJson(resultsFile, caseResults.sort((left, right) => left.caseId.localeCompare(right.caseId)));
    writeJson("provider-diagnostics.json", { runId, split: DEVELOPMENT ? "DEVELOPMENT_CASES" : "HOLDOUT_CASES", modelAudit, requestPolicy, limiter: limiter.snapshot(), totalRequestStarts: limiter.snapshot().totalStarts, retries: caseResults.reduce((sum, item) => sum + item.retryCount, 0), observed429: caseResults.filter((item) => item.error?.httpStatus === 429).length, providerErrors: caseResults.filter((item) => item.error), status, updatedAt: new Date().toISOString() });
  };

  let stopForCapacity = false;
  let attemptedThisRun = 0;
  for (const fixture of fixtures) {
    if (DEVELOPMENT_CASE_IDS && !DEVELOPMENT_CASE_IDS.has(fixture.caseId)) continue;
    if (models.has(fixture.caseId)) { console.log(`${runLabel} ${fixture.caseId} RESUMED_COMPLETE`); continue; }
    if (MAX_CASES !== null && attemptedThisRun >= MAX_CASES) break;
    attemptedThisRun += 1;
    const caseStartedMs = Date.now();
    const traces: OperationTrace[] = [];
    const messages: SemanticConversationMessage[] = [];
    let semanticModel: ScientificSemanticModel | null = null;
    let beforeCriticModel: ScientificSemanticModel | null = null;
    let impact: CriticImpactCase | null = null;
    const result: CampaignCaseResult = {
      caseId: fixture.caseId, split: fixture.split, goldFrameDigest: logicalDigest(fixture.gold), reconstructionPromptVersion: SEMANTIC_RECONSTRUCTION_PROMPT_VERSION,
      criticPromptVersion: SEMANTIC_CRITIC_PROMPT_VERSION, provider: "GOOGLE_GEMINI", model: MODEL_ID, requestStarted: new Date(caseStartedMs).toISOString(), completedAt: null,
      reconstructionStatus: "NOT_STARTED", criticStatus: "NOT_STARTED", canonicalizationStatus: "NOT_STARTED", evaluationStatus: "NOT_READY", finalStatus: "FAILED",
      retryCount: 0, latencyMs: 0, operationTraces: traces, reconstructionCandidate: null, critics: [], repairDiagnostics: [], criticTerminalReason: null, semanticModel: null, beforeCriticModel: null, criticImpact: null, error: null,
    };

    try {
      for (let turnIndex = 0; turnIndex < fixture.turns.length; turnIndex += 1) {
        messages.push({ messageId: `${fixture.caseId}:user:${turnIndex + 1}`, role: "USER", content: fixture.turns[turnIndex], createdAt: `2026-08-11T12:${String(fixtures.indexOf(fixture) + 1).padStart(2, "0")}:${String(turnIndex).padStart(2, "0")}.000Z` });
        const request = { schemaVersion: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION, sessionId: `${runId}:${fixture.caseId}`, language: "fr" as const, messages: [...messages], previousModel: semanticModel };
        const reconstruction = await provider.reconstruct(request);
        result.reconstructionCandidate = reconstruction.candidate;
        result.reconstructionStatus = "SUCCESS";
        traces.push({ operation: "RECONSTRUCTION", turn: turnIndex + 1, cycle: null, callId: reconstruction.callId, structuredDigest: logicalDigest(reconstruction.candidate), attempts: reconstruction.attempts ?? [] });

        const criticCycles = await runSemanticCriticCycles(provider, request, reconstruction.candidate);
        result.criticStatus = "SUCCESS";
        result.critics = criticCycles.critics;
        result.repairDiagnostics = criticCycles.repairDiagnostics;
        result.criticTerminalReason = criticCycles.terminalReason;
        criticCycles.critics.forEach((critic, index) => traces.push({ operation: "CRITIC", turn: turnIndex + 1, cycle: index + 1, callId: criticCycles.callIds[index], structuredDigest: logicalDigest(critic), attempts: criticCycles.cycleAttempts[index] ?? [] }));
        const finalCritic = criticCycles.critics.at(-1);
        const finalCriticCallId = criticCycles.callIds.at(-1);
        if (!finalCritic || !finalCriticCallId) throw new Error("SEM001R3_CRITIC_RESULT_MISSING");
        if (!criticCycles.accepted) throw new Error(`SEM001R3_CRITIC_NOT_ACCEPTED:${criticCycles.terminalReason}`);

        if (turnIndex === fixture.turns.length - 1) {
          beforeCriticModel = canonicalizeSemanticReconstruction({ request, candidate: preCriticMetricCandidate(request, reconstruction.candidate), critic: emptyCritic(), metadata: provider.metadata, reconstructionCallId: reconstruction.callId, criticCallId: "pre-critic-metric-only", reconstructionAttempts: reconstruction.attempts });
        }
        semanticModel = verifySemanticModelWithKnowledge(canonicalizeSemanticReconstruction({
          request, candidate: criticCycles.candidate, critic: finalCritic, metadata: provider.metadata, reconstructionCallId: reconstruction.callId,
          criticCallId: finalCriticCallId, criticCallIds: criticCycles.callIds, critics: criticCycles.critics,
          reconstructionAttempts: reconstruction.attempts, criticAttempts: criticCycles.attempts,
        }));
        result.canonicalizationStatus = "SUCCESS";

        if (turnIndex === fixture.turns.length - 1 && beforeCriticModel) {
          const before = evaluateSemanticCase(fixture, beforeCriticModel);
          const after = evaluateSemanticCase(fixture, semanticModel);
          const beforeUnsupported = beforeCriticModel.elements.filter((item) => item.epistemicStatus === "UNSUPPORTED_CANDIDATE").length;
          const afterUnsupported = semanticModel.elements.filter((item) => item.epistemicStatus === "UNSUPPORTED_CANDIDATE").length;
          impact = {
            caseId: fixture.caseId, beforeCriticObjectRecall: before.explicitObjectRecall, afterCriticObjectRecall: after.explicitObjectRecall,
            beforeCriticRelationRecall: before.explicitRelationRecall, afterCriticRelationRecall: after.explicitRelationRecall,
            issuesDetected: criticCycles.critics.reduce((sum, critic) => sum + critic.issues.length, 0), repairsProposed: criticCycles.critics.reduce((sum, critic) => sum + critic.proposedRepairs.length, 0),
            repairsAccepted: criticCycles.repairDiagnostics.filter((item) => item.status === "ACCEPTED").length, repairsRejected: criticCycles.repairDiagnostics.filter((item) => item.status === "REJECTED").length,
            newUnsupportedInferences: Math.max(0, afterUnsupported - beforeUnsupported), falsePositiveCritic: before.absoluteBlockers.length === 0 && criticCycles.critics[0].verdict !== "ACCEPT",
            criticAccepted: criticCycles.accepted, criticCycles: criticCycles.critics.length, terminalReason: criticCycles.terminalReason,
          };
        }
        messages.push({ messageId: `${fixture.caseId}:noxia:${turnIndex + 1}`, role: "NOXIA", content: semanticModel.summaryForUser, createdAt: semanticModel.updatedAt });
      }

      if (!semanticModel || !beforeCriticModel || !impact) throw new Error("SEM001R3_MODEL_OR_IMPACT_MISSING");
      result.semanticModel = semanticModel; result.beforeCriticModel = beforeCriticModel; result.criticImpact = impact;
      result.evaluationStatus = "READY"; result.finalStatus = "COMPLETE"; result.completedAt = new Date().toISOString(); models.set(fixture.caseId, semanticModel);
    } catch (caught) {
      if (caught instanceof SemanticProviderError) {
        const capacity = ["RATE_LIMIT", "QUOTA", "TIMEOUT", "NETWORK", "SERVER_ERROR"].includes(caught.category);
        result.error = { category: caught.category, failureClass: capacity ? "PROVIDER_CAPACITY_FAILURE" : "STRUCTURED_OUTPUT_FAILURE", httpStatus: caught.details?.httpStatus ?? null, providerStatus: caught.details?.providerStatus ?? null, providerCode: caught.details?.providerCode ?? null, message: caught.details?.providerError ?? caught.message };
        stopForCapacity = capacity;
      } else result.error = { category: "SEMANTIC_PIPELINE_FAILURE", failureClass: "SEMANTIC_PIPELINE_FAILURE", httpStatus: null, providerStatus: null, providerCode: null, message: safeMessage(caught) };
    }
    result.retryCount = Math.max(0, totalAttempts(traces) - traces.length);
    result.latencyMs = Date.now() - caseStartedMs;
    caseResults = [...caseResults.filter((item) => item.caseId !== fixture.caseId), result];
    checkpoint("RUNNING");
    console.log(`${runLabel} ${fixture.caseId} ${result.finalStatus} ${result.latencyMs}ms requests=${limiter.snapshot().totalStarts}`);
    if (stopForCapacity) break;
  }

  const completeResults = caseResults.filter((item) => item.finalStatus === "COMPLETE" && item.semanticModel);
  const complete = completeResults.length === fixtures.length;
  let aggregate: ReturnType<typeof evaluateSemanticCampaign> | null = null;
  let failures: ReturnType<typeof writeDiagnostics> = [];
  if (complete) {
    const completeModels = new Map(completeResults.map((item) => [item.caseId, item.semanticModel!]));
    aggregate = evaluateSemanticCampaign(fixtures, completeModels);
    const perCase = fixtures.map((fixture) => evaluateSemanticCase(fixture, completeModels.get(fixture.caseId)!));
    writeJson(metricsFile, { runId, status: "CALCULATED_ON_30_OF_30", aggregate, details: metricDetails(perCase, fixtures), perCase });
    failures = writeDiagnostics(runId, fixtures, completeResults, perCase);
  } else writeJson(metricsFile, { runId, status: "NOT_CALCULATED", reason: "REQUIRES_30_OF_30_COMPLETE", completeCount: completeResults.length, expectedCount: fixtures.length });

  const criticFunctional = completeResults.every((item) => item.criticImpact?.criticAccepted);
  const semanticGate = Boolean(complete && aggregate?.passesSem001Thresholds && failures.length === 0 && criticFunctional);
  checkpoint(complete ? "COMPLETE" : "INCOMPLETE");
  if (HOLDOUT) writeJson("img-invariants.json", { campaignId: runId, status: semanticGate ? "PENDING_TARGETED_VALIDATION" : "BLOCKED_BY_SEMANTIC_GATE" });
  const summary = {
    runId, split: DEVELOPMENT ? "DEVELOPMENT_CASES" : "HOLDOUT_CASES", status: !complete ? "NOT_DEMONSTRATED" : semanticGate ? "SEMANTIC_GATES_PASS" : "FAIL",
    decision: DEVELOPMENT ? "DEVELOPMENT_ONLY_NOT_QUALIFYING" : semanticGate ? "QUALIFIED_PENDING_BROWSER_AND_DOWNSTREAM" : "SCIENTIFIC_SEMANTIC_RECONSTRUCTION_NOT_READY",
    completeCount: completeResults.length, expectedCount: fixtures.length, totalRequestStarts: limiter.snapshot().totalStarts,
    retries: caseResults.reduce((sum, item) => sum + item.retryCount, 0), observed429: caseResults.filter((item) => item.error?.httpStatus === 429).length,
    metricsCalculated: complete, thresholdsPassed: aggregate?.passesSem001Thresholds ?? false, absoluteBlockerCount: failures.length,
    criticFunctional, semanticGate, durationMs: Date.now() - startedMs, completedAt: new Date().toISOString(),
  };
  if (DEVELOPMENT) writeJson("development-summary.json", summary);
  else writeJson("qualification-summary.json", summary);
  console.log(JSON.stringify(summary, null, 2));
  if (!complete) process.exitCode = 2;
  else if (HOLDOUT && !semanticGate) process.exitCode = 1;
}
