import { copyFileSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnv } from "vite";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { SCIENTIFIC_SEMANTIC_CRITIC_PROMPT, SCIENTIFIC_SEMANTIC_RECONSTRUCTION_PROMPT } from "../../../../api/prompts/scientific-semantic-reconstruction-prompt";
import { canonicalizeSemanticReconstruction } from "../canonical";
import { buildSemanticCoverage } from "../coverage";
import { evaluateSemanticCampaign, evaluateSemanticCase, type SemanticCaseMetrics } from "../competence";
import { HOLDOUT_CASES } from "../competence-fixtures";
import { verifySemanticModelWithKnowledge } from "../knowledge";
import { GeminiScientificSemanticProvider, SemanticProviderError } from "../provider";
import { SEMANTIC_CRITIC_JSON_SCHEMA, SEMANTIC_RECONSTRUCTION_JSON_SCHEMA } from "../schema";
import {
  SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
  SEMANTIC_CRITIC_PROMPT_VERSION,
  SEMANTIC_RECONSTRUCTION_PROMPT_VERSION,
  type ScientificSemanticModel,
  type SemanticConversationMessage,
  type SemanticProviderAttempt,
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
const EVALUATOR_VERSION = "SEM-001-EVALUATOR-1.1";
const CAMPAIGN_VERSION = "SEM-001R2-CAMPAIGN-1.1";
const ARTIFACT_DIRECTORY = path.resolve(process.cwd(), "semantic-validation/sem-001r2");
const RESUME = process.argv.includes("--resume");
const NEW_CAMPAIGN = process.argv.includes("--new-campaign");

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

type CampaignManifest = {
  campaignVersion: typeof CAMPAIGN_VERSION;
  campaignId: string;
  configurationDigest: string;
  caseIds: string[];
  holdoutCorpusDigest: string;
  goldFrameDigest: string;
  validationFileDigest: string;
  provider: "GOOGLE_GEMINI";
  model: ModelAudit;
  reconstructionPromptVersion: typeof SEMANTIC_RECONSTRUCTION_PROMPT_VERSION;
  criticPromptVersion: typeof SEMANTIC_CRITIC_PROMPT_VERSION;
  reconstructionPromptDigest: string;
  criticPromptDigest: string;
  schemaVersion: typeof SCIENTIFIC_SEMANTIC_SCHEMA_VERSION;
  providerSchemaDigest: string;
  temperature: null;
  samplingParameters: "NOT_APPLICABLE_DEPRECATED_AND_OMITTED";
  thresholds: Record<string, number>;
  semanticEvaluatorVersion: typeof EVALUATOR_VERSION;
  requestPolicy: {
    concurrency: 1;
    maxRequestsPerMinute: 5;
    rollingWindowMs: 60_000;
    timeoutMs: number;
    maxAttemptsPerOperation: number;
    retryBaseMs: number;
    maxRetryDelayMs: number;
  };
  providerLimits: {
    source: "USER_CONFIRMED_GOOGLE_AI_STUDIO";
    rpm: 15;
    rpd: 500;
    remainingQuotaExposedByModelsApi: false;
    minimumMainRequests: 60;
    expectedMainRequestsForCurrentMultiTurnCorpus: number;
  };
  supersedesCampaignId: string | null;
  predecessorOutcome: "INVALIDATED_AFTER_GENERIC_CORRECTION" | null;
  startedAt: string;
};

type OperationTrace = {
  operation: "RECONSTRUCTION" | "CRITIC";
  turn: number;
  callId: string | null;
  structuredDigest: string | null;
  attempts: SemanticProviderAttempt[];
};

type CampaignCaseResult = {
  caseId: string;
  goldFrameDigest: string;
  semanticPromptVersion: typeof SEMANTIC_RECONSTRUCTION_PROMPT_VERSION;
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
  canonicalModelDigest: string | null;
  semanticModel: ScientificSemanticModel | null;
  error: {
    category: string;
    failureClass: "PROVIDER_CAPACITY_FAILURE" | "STRUCTURED_OUTPUT_FAILURE" | "SEMANTIC_PIPELINE_FAILURE";
    httpStatus: number | null;
    providerStatus: string | null;
    providerCode: string | null;
    message: string;
  } | null;
};

type StructuredFailure = {
  caseId: string;
  operation: "RECONSTRUCTION" | "CRITIC" | "CANONICALIZATION";
  category: string;
  rawProviderOutput: string | null;
  validationIssues: Array<{ path: string; code: string; message: string }>;
  providerSchemaDigest: string;
  canonicalSchemaVersion: string;
  recordedAt: string;
};

type EvaluatedSemanticFailure = {
  caseId: string;
  classification: "PROMPT_FAILURE" | "MODEL_REASONING_FAILURE" | "CANONICALIZATION_FAILURE" | "CRITIC_FAILURE" | "KNOWLEDGE_ALIGNMENT_FAILURE" | "GOLD_FRAME_ISSUE" | "EVALUATOR_FAILURE" | "DOWNSTREAM_FAILURE";
  blocker: string;
  canonicalModelDigest: string;
};

const environment = loadEnv("development", process.cwd(), "");
const apiKey = environment.GEMINI_API_KEY?.trim();

const artifactPath = (name: string) => path.join(ARTIFACT_DIRECTORY, name);
const writeJson = (name: string, value: unknown) => {
  mkdirSync(ARTIFACT_DIRECTORY, { recursive: true });
  const target = artifactPath(name);
  const temporary = `${target}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  renameSync(temporary, target);
};
const readJson = <T>(name: string): T => JSON.parse(readFileSync(artifactPath(name), "utf8")) as T;
const exists = (name: string) => {
  try { readFileSync(artifactPath(name)); return true; } catch { return false; }
};
const archiveCurrentCampaign = () => {
  if (!exists("campaign-manifest.json")) return null;
  const previous = readJson<CampaignManifest>("campaign-manifest.json");
  const historyDirectory = path.join(ARTIFACT_DIRECTORY, "history", previous.campaignId);
  mkdirSync(historyDirectory, { recursive: true });
  for (const name of readdirSync(ARTIFACT_DIRECTORY).filter((item) => item.endsWith(".json"))) {
    copyFileSync(artifactPath(name), path.join(historyDirectory, name));
  }
  return previous.campaignId;
};
const safeMessage = (caught: unknown) => caught instanceof Error ? caught.message.slice(0, 800) : "UNKNOWN_PROVIDER_FAILURE";
const totalAttempts = (traces: OperationTrace[]) => traces.reduce((sum, item) => sum + item.attempts.length, 0);
const expectedMainRequests = HOLDOUT_CASES.reduce((sum, fixture) => sum + fixture.turns.length * 2, 0);

const thresholds = {
  criticalSemanticRecall: 0.98,
  explicitObjectRecall: 0.98,
  explicitRelationRecall: 0.95,
  comparatorPreservation: 1,
  interventionPreservation: 1,
  modalityPreservation: 1,
  criticalUnsupportedInferenceRate: 0,
  genericDomainCollapseRate: 0,
  correctionPropagationRate: 1,
  multiTurnCriticalContextLoss: 0,
};

const auditModel = async (): Promise<ModelAudit> => {
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000", { headers: { "x-goog-api-key": apiKey! } });
  const body = await response.json().catch(() => null) as { models?: Array<{ name?: string; displayName?: string; version?: string; supportedGenerationMethods?: string[]; inputTokenLimit?: number; outputTokenLimit?: number }>; error?: { status?: string; message?: string } } | null;
  const model = body?.models?.find((item) => item.name === `models/${MODEL_ID}`);
  if (!response.ok || !model || !model.supportedGenerationMethods?.includes("generateContent")) {
    throw new Error(response.ok ? "GEMINI_3_5_FLASH_LITE_UNAVAILABLE" : `MODEL_AUDIT_FAILED:${body?.error?.status ?? response.status}`);
  }
  return {
    endpoint: "v1beta/models",
    httpStatus: response.status,
    apiName: model.name!,
    modelId: MODEL_ID,
    displayName: model.displayName ?? "Gemini 3.5 Flash Lite",
    version: model.version ?? "NOT_EXPOSED",
    supportedGenerationMethods: model.supportedGenerationMethods,
    inputTokenLimit: model.inputTokenLimit ?? null,
    outputTokenLimit: model.outputTokenLimit ?? null,
    structuredOutputsSupportedByOfficialDocumentation: true,
  };
};

const configurationMaterial = (model: ModelAudit) => ({
  campaignVersion: CAMPAIGN_VERSION as typeof CAMPAIGN_VERSION,
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
  providerSchemaDigest: logicalDigest({ reconstruction: SEMANTIC_RECONSTRUCTION_JSON_SCHEMA, critic: SEMANTIC_CRITIC_JSON_SCHEMA }),
  temperature: null,
  samplingParameters: "NOT_APPLICABLE_DEPRECATED_AND_OMITTED" as const,
  thresholds,
  semanticEvaluatorVersion: EVALUATOR_VERSION as typeof EVALUATOR_VERSION,
  requestPolicy: {
    concurrency: CONCURRENCY as 1,
    maxRequestsPerMinute: MAX_REQUESTS_PER_MINUTE as 5,
    rollingWindowMs: WINDOW_MS as 60_000,
    timeoutMs: TIMEOUT_MS,
    maxAttemptsPerOperation: MAX_ATTEMPTS,
    retryBaseMs: RETRY_BASE_MS,
    maxRetryDelayMs: MAX_RETRY_DELAY_MS,
  },
  providerLimits: {
    source: "USER_CONFIRMED_GOOGLE_AI_STUDIO" as const,
    rpm: 15 as const,
    rpd: 500 as const,
    remainingQuotaExposedByModelsApi: false as const,
    minimumMainRequests: 60 as const,
    expectedMainRequestsForCurrentMultiTurnCorpus: expectedMainRequests,
  },
});

const metricDetails = (caseMetrics: SemanticCaseMetrics[]) => {
  const detail = (name: keyof SemanticCaseMetrics, desired: "ONE" | "ZERO", relevant = caseMetrics) => {
    const values = relevant.map((item) => Number(item[name]));
    return {
      numerator: values.reduce((sum, value) => sum + value, 0),
      denominator: values.length,
      score: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 1,
      casesInError: relevant.filter((item) => desired === "ONE" ? Number(item[name]) < 1 : Number(item[name]) > 0).map((item) => item.caseId),
    };
  };
  const fixturesForType = (type: string) => new Set(HOLDOUT_CASES.filter((fixture) => fixture.gold.requiredExplicitObjects.some((item) => item.type === type)).map((fixture) => fixture.caseId));
  const subset = (ids: Set<string>) => caseMetrics.filter((item) => ids.has(item.caseId));
  return {
    explicitObjectRecall: detail("explicitObjectRecall", "ONE"),
    explicitRelationRecall: detail("explicitRelationRecall", "ONE"),
    criticalSemanticRecall: detail("criticalSemanticRecall", "ONE"),
    comparatorPreservation: detail("comparatorPreserved", "ONE", subset(fixturesForType("COMPARATOR"))),
    interventionPreservation: detail("interventionPreserved", "ONE", subset(fixturesForType("INTERVENTION"))),
    modalityPreservation: detail("modalityPreserved", "ONE", subset(fixturesForType("MODALITY"))),
    semanticDriftRate: detail("semanticDriftRate", "ZERO"),
    unsupportedInferenceRate: detail("unsupportedInferenceRate", "ZERO"),
    criticalUnsupportedInferenceRate: detail("criticalUnsupportedInferenceCount", "ZERO"),
    ellipsisDetectionRate: detail("ellipsisDetectionRate", "ONE"),
    ambiguityPreservationRate: detail("ambiguityPreservationRate", "ONE"),
    unnecessaryClarificationRate: detail("unnecessaryClarificationRate", "ZERO"),
    routeCorrectness: detail("routeCorrect", "ONE"),
    correctionPropagationRate: detail("correctionPropagation", "ONE", caseMetrics.filter((item) => HOLDOUT_CASES.find((fixture) => fixture.caseId === item.caseId)?.gold.correction)),
    multiTurnContextPreservation: detail("multiTurnContextPreserved", "ONE", caseMetrics.filter((item) => (HOLDOUT_CASES.find((fixture) => fixture.caseId === item.caseId)?.turns.length ?? 0) > 1)),
    genericDomainCollapseRate: detail("genericDomainCollapse", "ZERO"),
  };
};

if (!apiKey) {
  console.log(JSON.stringify({ status: "NOT_DEMONSTRATED", reason: "GEMINI_API_KEY_MISSING" }, null, 2));
  process.exitCode = 2;
} else {
  if (RESUME && NEW_CAMPAIGN) throw new Error("SEM001R2_RESUME_AND_NEW_CAMPAIGN_ARE_MUTUALLY_EXCLUSIVE");
  const campaignStartedMs = Date.now();
  const modelAudit = await auditModel();
  const material = configurationMaterial(modelAudit);
  const configurationDigest = logicalDigest(material);
  let manifest: CampaignManifest;
  let caseResults: CampaignCaseResult[] = [];
  let structuredFailures: StructuredFailure[] = [];
  let evaluatedSemanticFailures: EvaluatedSemanticFailure[] = [];

  if (RESUME) {
    if (!exists("campaign-manifest.json")) throw new Error("SEM001R2_RESUME_MANIFEST_MISSING");
    manifest = readJson<CampaignManifest>("campaign-manifest.json");
    if (manifest.configurationDigest !== configurationDigest) throw new Error("INVALID_MIXED_CAMPAIGN");
    if (exists("case-results.json")) caseResults = readJson<CampaignCaseResult[]>("case-results.json");
    if (exists("semantic-failures.json")) structuredFailures = readJson<StructuredFailure[]>("semantic-failures.json");
  } else {
    if (exists("campaign-manifest.json") && !NEW_CAMPAIGN) throw new Error("SEM001R2_CAMPAIGN_EXISTS_USE_RESUME_OR_NEW_CAMPAIGN");
    const supersedesCampaignId = NEW_CAMPAIGN ? archiveCurrentCampaign() : null;
    const startedAt = new Date(campaignStartedMs).toISOString();
    manifest = {
      ...material,
      campaignId: `sem-001r2-${startedAt.replace(/[:.]/g, "-")}-${configurationDigest}`,
      configurationDigest,
      supersedesCampaignId,
      predecessorOutcome: supersedesCampaignId ? "INVALIDATED_AFTER_GENERIC_CORRECTION" : null,
      startedAt,
    };
    writeJson("campaign-manifest.json", manifest);
    writeJson("case-results.json", []);
    writeJson("provider-diagnostics.json", { campaignId: manifest.campaignId, modelAudit, requestPolicy: manifest.requestPolicy, totalRequestStarts: 0, retries: 0, observed429: 0, providerErrors: [], status: "RUNNING" });
    writeJson("semantic-metrics.json", { campaignId: manifest.campaignId, status: "NOT_CALCULATED", reason: "REQUIRES_30_OF_30_COMPLETE" });
    writeJson("semantic-failures.json", []);
    writeJson("img-comparison-invariants.json", { campaignId: manifest.campaignId, status: "PENDING" });
    writeJson("browser-live-validation.json", { campaignId: manifest.campaignId, status: "PENDING", requiredModel: MODEL_ID });
    writeJson("downstream-live-diagnostics.json", { campaignId: manifest.campaignId, status: "PENDING", requiredModel: MODEL_ID });
    writeJson("qualification-summary.json", { campaignId: manifest.campaignId, status: "RUNNING", decision: "SCIENTIFIC_SEMANTIC_RECONSTRUCTION_NOT_READY" });
  }

  const priorAttempts = caseResults.flatMap((item) => item.operationTraces.flatMap((trace) => trace.attempts));
  const limiter = new RollingWindowRequestLimiter({
    maxRequests: MAX_REQUESTS_PER_MINUTE,
    windowMs: WINDOW_MS,
    safetyMarginMs: 500,
    initialStarts: priorAttempts.map((item) => item.requestStarted),
    initialTotalStarts: priorAttempts.length,
  });
  const provider = new GeminiScientificSemanticProvider({
    apiKey,
    model: MODEL_ID,
    timeoutMs: TIMEOUT_MS,
    maxAttempts: MAX_ATTEMPTS,
    retryBaseMs: RETRY_BASE_MS,
    maxRetryDelayMs: MAX_RETRY_DELAY_MS,
    retryJitterRatio: 0.2,
    beforeAttempt: () => limiter.acquire(),
  });
  const models = new Map<string, ScientificSemanticModel>(caseResults.filter((item) => item.finalStatus === "COMPLETE" && item.semanticModel).map((item) => [item.caseId, item.semanticModel!]));

  const checkpoint = (status: "RUNNING" | "COMPLETE" | "INCOMPLETE") => {
    writeJson("case-results.json", caseResults.sort((left, right) => left.caseId.localeCompare(right.caseId)));
    writeJson("semantic-failures.json", [...structuredFailures, ...evaluatedSemanticFailures]);
    const providerErrors = caseResults.filter((item) => item.error?.failureClass === "PROVIDER_CAPACITY_FAILURE").map((item) => ({ caseId: item.caseId, ...item.error }));
    writeJson("provider-diagnostics.json", {
      campaignId: manifest.campaignId,
      modelAudit,
      providerLimits: manifest.providerLimits,
      requestPolicy: manifest.requestPolicy,
      limiter: limiter.snapshot(),
      totalRequestStarts: limiter.snapshot().totalStarts,
      retries: caseResults.reduce((sum, item) => sum + item.retryCount, 0),
      observed429: caseResults.filter((item) => item.error?.httpStatus === 429).length,
      providerErrors,
      status,
      updatedAt: new Date().toISOString(),
    });
  };

  let stopForCapacity = false;
  for (const fixture of HOLDOUT_CASES) {
    if (models.has(fixture.caseId)) {
      console.log(`SEM-R2 ${fixture.caseId} RESUMED_COMPLETE`);
      continue;
    }
    const caseStartedMs = Date.now();
    let semanticModel: ScientificSemanticModel | null = null;
    const messages: SemanticConversationMessage[] = [];
    const operationTraces: OperationTrace[] = [];
    const result: CampaignCaseResult = {
      caseId: fixture.caseId,
      goldFrameDigest: logicalDigest(fixture.gold),
      semanticPromptVersion: SEMANTIC_RECONSTRUCTION_PROMPT_VERSION,
      criticPromptVersion: SEMANTIC_CRITIC_PROMPT_VERSION,
      provider: "GOOGLE_GEMINI",
      model: MODEL_ID,
      requestStarted: new Date(caseStartedMs).toISOString(),
      completedAt: null,
      reconstructionStatus: "NOT_STARTED",
      criticStatus: "NOT_STARTED",
      canonicalizationStatus: "NOT_STARTED",
      evaluationStatus: "NOT_READY",
      finalStatus: "FAILED",
      retryCount: 0,
      latencyMs: 0,
      operationTraces,
      canonicalModelDigest: null,
      semanticModel: null,
      error: null,
    };

    try {
      for (let turnIndex = 0; turnIndex < fixture.turns.length; turnIndex += 1) {
        messages.push({ messageId: `${fixture.caseId}:user:${turnIndex + 1}`, role: "USER", content: fixture.turns[turnIndex], createdAt: `2026-08-11T12:${String(HOLDOUT_CASES.indexOf(fixture) + 1).padStart(2, "0")}:${String(turnIndex).padStart(2, "0")}.000Z` });
        const request = { schemaVersion: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION, sessionId: `${manifest.campaignId}:${fixture.caseId}`, language: "fr" as const, messages: [...messages], previousModel: semanticModel };

        let reconstruction;
        try {
          reconstruction = await provider.reconstruct(request);
          result.reconstructionStatus = "SUCCESS";
          operationTraces.push({ operation: "RECONSTRUCTION", turn: turnIndex + 1, callId: reconstruction.callId, structuredDigest: logicalDigest(reconstruction.candidate), attempts: reconstruction.attempts ?? [] });
        } catch (caught) {
          result.reconstructionStatus = "FAILED";
          if (caught instanceof SemanticProviderError) {
            operationTraces.push({ operation: "RECONSTRUCTION", turn: turnIndex + 1, callId: null, structuredDigest: null, attempts: caught.attempts });
            if (caught.category === "INVALID_STRUCTURED_OUTPUT") structuredFailures.push({ caseId: fixture.caseId, operation: "RECONSTRUCTION", category: caught.category, rawProviderOutput: caught.diagnostic?.rawProviderOutput ?? null, validationIssues: caught.diagnostic?.validationIssues ?? [], providerSchemaDigest: manifest.providerSchemaDigest, canonicalSchemaVersion: manifest.schemaVersion, recordedAt: new Date().toISOString() });
          }
          throw caught;
        }

        let critique;
        try {
          critique = await provider.critique(request, reconstruction.candidate, { ...buildSemanticCoverage(request, reconstruction.candidate), cycle: 1 });
          result.criticStatus = "SUCCESS";
          operationTraces.push({ operation: "CRITIC", turn: turnIndex + 1, callId: critique.callId, structuredDigest: logicalDigest(critique.critic), attempts: critique.attempts ?? [] });
        } catch (caught) {
          result.criticStatus = "FAILED";
          if (caught instanceof SemanticProviderError) {
            operationTraces.push({ operation: "CRITIC", turn: turnIndex + 1, callId: null, structuredDigest: null, attempts: caught.attempts });
            if (caught.category === "INVALID_STRUCTURED_OUTPUT") structuredFailures.push({ caseId: fixture.caseId, operation: "CRITIC", category: caught.category, rawProviderOutput: caught.diagnostic?.rawProviderOutput ?? null, validationIssues: caught.diagnostic?.validationIssues ?? [], providerSchemaDigest: manifest.providerSchemaDigest, canonicalSchemaVersion: manifest.schemaVersion, recordedAt: new Date().toISOString() });
          }
          throw caught;
        }

        try {
          semanticModel = verifySemanticModelWithKnowledge(canonicalizeSemanticReconstruction({
            request,
            candidate: reconstruction.candidate,
            critic: critique.critic,
            metadata: provider.metadata,
            reconstructionCallId: reconstruction.callId,
            criticCallId: critique.callId,
            reconstructionAttempts: reconstruction.attempts,
            criticAttempts: critique.attempts,
          }));
          result.canonicalizationStatus = "SUCCESS";
        } catch (caught) {
          result.canonicalizationStatus = "FAILED";
          structuredFailures.push({ caseId: fixture.caseId, operation: "CANONICALIZATION", category: "CANONICALIZATION_FAILURE", rawProviderOutput: null, validationIssues: [{ path: "canonical", code: "canonicalization_failure", message: safeMessage(caught) }], providerSchemaDigest: manifest.providerSchemaDigest, canonicalSchemaVersion: manifest.schemaVersion, recordedAt: new Date().toISOString() });
          throw caught;
        }
        messages.push({ messageId: `${fixture.caseId}:noxia:${turnIndex + 1}`, role: "NOXIA", content: semanticModel.summaryForUser, createdAt: semanticModel.updatedAt });
      }

      if (!semanticModel) throw new Error("NO_SEMANTIC_MODEL_PRODUCED");
      result.semanticModel = semanticModel;
      result.canonicalModelDigest = semanticModel.digest;
      result.evaluationStatus = "READY";
      result.finalStatus = "COMPLETE";
      result.completedAt = new Date().toISOString();
      models.set(fixture.caseId, semanticModel);
    } catch (caught) {
      if (caught instanceof SemanticProviderError) {
        const capacity = ["RATE_LIMIT", "QUOTA", "TIMEOUT", "NETWORK", "SERVER_ERROR"].includes(caught.category);
        result.error = {
          category: caught.category,
          failureClass: capacity ? "PROVIDER_CAPACITY_FAILURE" : "STRUCTURED_OUTPUT_FAILURE",
          httpStatus: caught.details?.httpStatus ?? null,
          providerStatus: caught.details?.providerStatus ?? null,
          providerCode: caught.details?.providerCode ?? null,
          message: caught.details?.providerError ?? caught.message,
        };
        stopForCapacity = capacity;
      } else {
        result.error = { category: "SEMANTIC_PIPELINE_FAILURE", failureClass: "SEMANTIC_PIPELINE_FAILURE", httpStatus: null, providerStatus: null, providerCode: null, message: safeMessage(caught) };
      }
    }

    result.retryCount = Math.max(0, totalAttempts(operationTraces) - operationTraces.length);
    result.latencyMs = Date.now() - caseStartedMs;
    caseResults = [...caseResults.filter((item) => item.caseId !== fixture.caseId), result];
    checkpoint("RUNNING");
    console.log(`SEM-R2 ${result.caseId} ${result.finalStatus} ${result.latencyMs}ms retries=${result.retryCount} requests=${limiter.snapshot().totalStarts}`);
    if (stopForCapacity) {
      console.log(`SEM-R2 STOP_FOR_PROVIDER_CAPACITY resumeWith=--resume case=${result.caseId}`);
      break;
    }
  }

  const completeResults = caseResults.filter((item) => item.finalStatus === "COMPLETE" && item.semanticModel);
  const complete = completeResults.length === HOLDOUT_CASES.length;
  let metrics: ReturnType<typeof evaluateSemanticCampaign> | null = null;
  if (complete) {
    const completeModels = new Map(completeResults.map((item) => [item.caseId, item.semanticModel!]));
    metrics = evaluateSemanticCampaign(HOLDOUT_CASES, completeModels);
    const perCase = HOLDOUT_CASES.map((fixture) => evaluateSemanticCase(fixture, completeModels.get(fixture.caseId)!));
    writeJson("semantic-metrics.json", { campaignId: manifest.campaignId, status: "CALCULATED_ON_30_OF_30", aggregate: metrics, details: metricDetails(perCase), perCase });
    evaluatedSemanticFailures = perCase.flatMap((item) => item.absoluteBlockers.map((blocker): EvaluatedSemanticFailure => ({
      caseId: item.caseId,
      classification: blocker.startsWith("FORBIDDEN_INFERENCE") || blocker === "CORRECTION_NOT_PROPAGATED" || blocker === "MULTI_TURN_CONTEXT_LOST" || blocker === "GENERIC_DOMAIN_COLLAPSE"
        ? "MODEL_REASONING_FAILURE"
        : "PROMPT_FAILURE",
      blocker,
      canonicalModelDigest: completeModels.get(item.caseId)!.digest,
    })));
  } else {
    writeJson("semantic-metrics.json", { campaignId: manifest.campaignId, status: "NOT_CALCULATED", reason: "REQUIRES_30_OF_30_COMPLETE", completeCount: completeResults.length, expectedCount: HOLDOUT_CASES.length });
  }

  const durationMs = Date.now() - campaignStartedMs;
  checkpoint(complete ? "COMPLETE" : "INCOMPLETE");
  const summary = {
    campaignId: manifest.campaignId,
    status: !complete ? "NOT_DEMONSTRATED" : metrics?.passesSem001Thresholds ? "PASS" : "FAIL",
    decision: complete && metrics?.passesSem001Thresholds ? "CAMPAIGN_QUALIFIED_PENDING_BROWSER_AND_DOWNSTREAM" : "SCIENTIFIC_SEMANTIC_RECONSTRUCTION_NOT_READY",
    provider: manifest.provider,
    model: manifest.model,
    completeCount: completeResults.length,
    expectedCount: HOLDOUT_CASES.length,
    totalRequestStarts: limiter.snapshot().totalStarts,
    retries: caseResults.reduce((sum, item) => sum + item.retryCount, 0),
    observed429: caseResults.filter((item) => item.error?.httpStatus === 429).length,
    durationMs,
    durationSeconds: Math.round(durationMs / 1_000),
    metricsCalculated: complete,
    thresholdsPassed: metrics?.passesSem001Thresholds ?? false,
    resumeAvailable: !complete,
    resumeCommand: !complete ? "npm run test:semantic:live -- --resume" : null,
    completedAt: new Date().toISOString(),
  };
  writeJson("qualification-summary.json", summary);
  console.log(JSON.stringify(summary, null, 2));
  if (!complete) process.exitCode = 2;
  else if (!metrics?.passesSem001Thresholds) process.exitCode = 1;
}
