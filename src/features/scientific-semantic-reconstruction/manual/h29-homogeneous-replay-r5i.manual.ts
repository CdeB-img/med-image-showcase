/* eslint-disable @typescript-eslint/no-explicit-any */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnv } from "vite";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { SCIENTIFIC_SEMANTIC_ATOMIC_COMPOSITION_AUDIT_PROMPT } from "../../../../api/prompts/scientific-semantic-atomic-composition-prompt";
import { SCIENTIFIC_SEMANTIC_CRITIC_PROMPT, SCIENTIFIC_SEMANTIC_RECONSTRUCTION_PROMPT } from "../../../../api/prompts/scientific-semantic-reconstruction-prompt";
import { SEMANTIC_ATOMIC_COMPOSITION_AUDIT_JSON_SCHEMA } from "../atomic-composition";
import { canonicalizeSemanticReconstruction } from "../canonical";
import { evaluateSemanticCase } from "../competence";
import { DEVELOPMENT_CASES, HOLDOUT_CASES } from "../competence-fixtures";
import { runSemanticCriticCycles } from "../coverage";
import { verifySemanticModelWithKnowledge } from "../knowledge";
import { GeminiScientificSemanticProvider, SemanticProviderError } from "../provider";
import { SEMANTIC_CRITIC_JSON_SCHEMA, SEMANTIC_RECONSTRUCTION_JSON_SCHEMA } from "../schema";
import {
  SCIENTIFIC_SEMANTIC_MODEL_VERSION,
  SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
  SEMANTIC_CRITIC_PROMPT_VERSION,
  SEMANTIC_RECONSTRUCTION_PROMPT_VERSION,
  type ScientificSemanticModel,
  type ScientificSemanticProvider,
  type SemanticConversationMessage,
  type SemanticProviderAttempt,
  type SemanticProviderFailureCategory,
  type SemanticReconstructionRequest,
} from "../types";
import { RollingWindowRequestLimiter } from "./rolling-rate-limiter";

const ROOT = process.cwd();
const DIRECTORY = path.resolve(ROOT, "semantic-validation/sem-001r5i");
const RAW_DIRECTORY = path.join(DIRECTORY, "raw-provider-responses");
const FREEZE_PATH = path.join(DIRECTORY, "legacy-qualification-freeze-candidate.json");
const RESULT_PATH = path.join(DIRECTORY, "h29-result.json");
const PROVIDER_ATTEMPTS_PATH = path.join(DIRECTORY, "provider-attempts.json");
const MODEL_ID = "gemini-3.5-flash-lite";
const PROVIDER = "GOOGLE_GEMINI";
const EXPECTED_CONFIGURATION_NAME = "SEM_LEGACY_R5I";
const EXPECTED_CONFIGURATION_DIGEST = "ke1-b054ba08b89e02ec";
const MAX_STARTS_PER_ROLLING_MINUTE = 5;
const MAX_ATTEMPTS_PER_OPERATION = 5;
const TRANSIENT_WAIT_MS = 60_000;
const TIMEOUT_MS = 90_000;

const readJson = <T>(target: string): T => JSON.parse(readFileSync(target, "utf8")) as T;
const exists = (target: string) => { try { readFileSync(target); return true; } catch { return false; } };
const writeJsonAt = (target: string, value: unknown) => {
  mkdirSync(path.dirname(target), { recursive: true });
  const temporary = `${target}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  renameSync(temporary, target);
};
const source = (relativePath: string) => readFileSync(path.resolve(ROOT, relativePath), "utf8");
const relativeArtifact = (target: string) => path.relative(ROOT, target);
const freeze = readJson<any>(FREEZE_PATH);
const fixture = HOLDOUT_CASES.find((item) => item.caseId === "SEM-H29");
if (!fixture || fixture.turns.length !== 2) throw new Error("SEM001R5I_H29_FIXTURE_INVALID");

const currentDigests = {
  developmentCorpus: logicalDigest(DEVELOPMENT_CASES.map((item) => ({ caseId: item.caseId, split: item.split, turns: item.turns }))),
  developmentGold: logicalDigest(DEVELOPMENT_CASES.map((item) => ({ caseId: item.caseId, gold: item.gold }))),
  holdoutCorpus: logicalDigest(HOLDOUT_CASES.map((item) => ({ caseId: item.caseId, split: item.split, turns: item.turns }))),
  holdoutGold: logicalDigest(HOLDOUT_CASES.map((item) => ({ caseId: item.caseId, gold: item.gold }))),
  reconstructionPrompt: logicalDigest(SCIENTIFIC_SEMANTIC_RECONSTRUCTION_PROMPT),
  criticPrompt: logicalDigest(SCIENTIFIC_SEMANTIC_CRITIC_PROMPT),
  auditPrompt: logicalDigest(SCIENTIFIC_SEMANTIC_ATOMIC_COMPOSITION_AUDIT_PROMPT),
  baseProviderSchema: logicalDigest({ reconstruction: SEMANTIC_RECONSTRUCTION_JSON_SCHEMA, critic: SEMANTIC_CRITIC_JSON_SCHEMA }),
  providerContract: logicalDigest(source("src/features/scientific-semantic-reconstruction/provider.ts")),
  auditProviderSchema: logicalDigest(SEMANTIC_ATOMIC_COMPOSITION_AUDIT_JSON_SCHEMA),
  canonicalModel: logicalDigest({
    semanticModelVersion: SCIENTIFIC_SEMANTIC_MODEL_VERSION,
    schemaVersion: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
    types: source("src/features/scientific-semantic-reconstruction/types.ts"),
    schema: source("src/features/scientific-semantic-reconstruction/schema.ts"),
  }),
  acceptanceGuards: logicalDigest(source("src/features/scientific-semantic-reconstruction/atomic-composition.ts")),
  canonicalizer: logicalDigest(source("src/features/scientific-semantic-reconstruction/canonical.ts")),
  coverageAndIntegrity: logicalDigest(source("src/features/scientific-semantic-reconstruction/coverage.ts")),
  relationOwnership: logicalDigest(source("src/features/scientific-semantic-reconstruction/relation-ownership.ts")),
  evaluator: logicalDigest(source("src/features/scientific-semantic-reconstruction/competence.ts")),
  routing: logicalDigest({
    canonical: source("src/features/scientific-semantic-reconstruction/canonical.ts"),
    atomicComposition: source("src/features/scientific-semantic-reconstruction/atomic-composition.ts"),
  }),
};
const expectedDigests = freeze.configurationMaterial?.digests ?? {};
const digestChecks = Object.entries(currentDigests).map(([owner, observed]) => ({ owner, expected: expectedDigests[owner] ?? null, observed, pass: expectedDigests[owner] === observed }));
const configurationVerification = {
  campaign: "SEM-001R5I",
  verifiedAt: new Date().toISOString(),
  configurationName: freeze.configurationName,
  expectedConfigurationName: EXPECTED_CONFIGURATION_NAME,
  expectedConfigurationDigest: EXPECTED_CONFIGURATION_DIGEST,
  recordedConfigurationDigest: freeze.configurationDigest,
  recomputedConfigurationDigest: logicalDigest(freeze.configurationMaterial),
  status: freeze.status,
  provider: freeze.configurationMaterial?.provider?.provider,
  model: freeze.configurationMaterial?.provider?.model,
  digestChecks,
  decision: "PENDING",
};
const configurationPass = configurationVerification.configurationName === EXPECTED_CONFIGURATION_NAME
  && configurationVerification.recordedConfigurationDigest === EXPECTED_CONFIGURATION_DIGEST
  && configurationVerification.recomputedConfigurationDigest === EXPECTED_CONFIGURATION_DIGEST
  && configurationVerification.status === "PROPOSED_NOT_ACTIVATED"
  && configurationVerification.provider === PROVIDER
  && configurationVerification.model === MODEL_ID
  && digestChecks.every((item) => item.pass);
configurationVerification.decision = configurationPass ? "R5I_CONFIGURATION_VERIFIED_FOR_H29" : "R5I_BLOCKED_BY_CONFIGURATION_DRIFT";
writeJsonAt(path.join(DIRECTORY, "configuration-verification.json"), configurationVerification);
if (!configurationPass) {
  writeJsonAt(RESULT_PATH, { campaign: "SEM-001R5I", caseId: fixture.caseId, decision: "R5I_BLOCKED_BY_CONFIGURATION_DRIFT", configurationVerification, llmOperations: 0, providerRequestStarts: 0 });
  console.log(JSON.stringify(readJson(RESULT_PATH), null, 2));
  process.exit(4);
}

if (process.argv.includes("--verify")) {
  console.log(JSON.stringify(configurationVerification, null, 2));
  process.exit(0);
}

if (exists(RESULT_PATH)) {
  const prior = readJson<any>(RESULT_PATH);
  if (prior.decision === "H29_PASS" && prior.configurationDigest === EXPECTED_CONFIGURATION_DIGEST) {
    console.log(JSON.stringify({ decision: "H29_RESUMED_COMPLETE", artifact: relativeArtifact(RESULT_PATH), llmOperations: 0, providerRequestStarts: 0 }, null, 2));
    process.exit(0);
  }
}

const environment = loadEnv("development", ROOT, "");
const apiKey = environment.GEMINI_API_KEY?.trim();
if (!apiKey) {
  writeJsonAt(RESULT_PATH, { campaign: "SEM-001R5I", caseId: fixture.caseId, decision: "SEM_LEGACY_CLOSURE_BLOCKED_BY_PROVIDER", reason: "GEMINI_API_KEY_MISSING", llmOperations: 0, providerRequestStarts: 0 });
  console.log(JSON.stringify(readJson(RESULT_PATH), null, 2));
  process.exit(3);
}

type AttemptTrace = {
  caseId: string;
  stage: "RECONSTRUCTION" | "CRITIC";
  turn: number;
  cycle: number | null;
  operation: number;
  operationAttempt: number;
  requestStart: number;
  startedAt: string | null;
  completedAt: string | null;
  providerStatus: string | null;
  httpStatus: number | null;
  providerErrorCode: string | null;
  category: string | null;
  waitDuration: number;
  finalDisposition: string;
  rawArtifact: string | null;
};
type OperationContext = {
  caseId: string;
  stage: "RECONSTRUCTION" | "CRITIC";
  turn: number;
  cycle: number | null;
  operation: number;
  operationAttempt: number;
  requestStarts: number;
  traceIndexes: number[];
};
const limiter = new RollingWindowRequestLimiter({ maxRequests: MAX_STARTS_PER_ROLLING_MINUTE, windowMs: 60_000, safetyMarginMs: 500 });
const attemptTraces: AttemptTrace[] = [];
const structuredOutputIncidents: any[] = [];
let activeOperation: OperationContext | null = null;
let operationSequence = 0;
let rawSequence = 0;

const checkpointAttempts = () => writeJsonAt(PROVIDER_ATTEMPTS_PATH, {
  campaign: "SEM-001R5I",
  configurationName: EXPECTED_CONFIGURATION_NAME,
  configurationDigest: EXPECTED_CONFIGURATION_DIGEST,
  provider: PROVIDER,
  model: MODEL_ID,
  policy: { concurrency: 1, maximumStartsPerRollingMinute: 5, maximumAttemptsPerOperation: 5, transientWaitMs: TRANSIENT_WAIT_MS },
  attempts: attemptTraces,
  structuredOutputIncidents,
  noSecretsStored: true,
});

const beforeAttempt = async () => {
  if (!activeOperation) throw new Error("SEM001R5I_PROVIDER_START_OUTSIDE_OPERATION");
  if (activeOperation.requestStarts >= MAX_ATTEMPTS_PER_OPERATION) throw new Error("SEM001R5I_OPERATION_REQUEST_START_BUDGET_EXHAUSTED");
  await limiter.acquire();
  activeOperation.requestStarts += 1;
  rawSequence += 1;
  activeOperation.traceIndexes.push(attemptTraces.length);
  attemptTraces.push({
    caseId: activeOperation.caseId,
    stage: activeOperation.stage,
    turn: activeOperation.turn,
    cycle: activeOperation.cycle,
    operation: activeOperation.operation,
    operationAttempt: activeOperation.operationAttempt,
    requestStart: activeOperation.requestStarts,
    startedAt: new Date().toISOString(),
    completedAt: null,
    providerStatus: null,
    httpStatus: null,
    providerErrorCode: null,
    category: null,
    waitDuration: 0,
    finalDisposition: "IN_FLIGHT",
    rawArtifact: null,
  });
  checkpointAttempts();
};

const instrumentedFetch: typeof fetch = async (input, init) => {
  const response = await fetch(input, init);
  if (activeOperation) {
    const traceIndex = activeOperation.traceIndexes.at(-1);
    if (traceIndex !== undefined) {
      const target = path.join(RAW_DIRECTORY, `${String(rawSequence).padStart(3, "0")}-${activeOperation.caseId}-${activeOperation.stage.toLowerCase()}-t${activeOperation.turn}-c${activeOperation.cycle ?? 0}.json`);
      const rawBody = await response.clone().text();
      writeJsonAt(target, {
        security: "LOCAL_MODE_0600_NO_REQUEST_HEADERS_NO_SECRET",
        campaign: "SEM-001R5I",
        configurationDigest: EXPECTED_CONFIGURATION_DIGEST,
        caseId: activeOperation.caseId,
        stage: activeOperation.stage,
        turn: activeOperation.turn,
        cycle: activeOperation.cycle,
        provider: PROVIDER,
        model: MODEL_ID,
        httpStatus: response.status,
        capturedAt: new Date().toISOString(),
        rawStructuredResponse: rawBody,
      });
      attemptTraces[traceIndex].rawArtifact = relativeArtifact(target);
      checkpointAttempts();
    }
  }
  return response;
};

const baseProvider = new GeminiScientificSemanticProvider({ apiKey, model: MODEL_ID, timeoutMs: TIMEOUT_MS, maxAttempts: 1, beforeAttempt, fetchImpl: instrumentedFetch });
const transient = (category: SemanticProviderFailureCategory) => ["RATE_LIMIT", "TIMEOUT", "NETWORK", "SERVER_ERROR"].includes(category);
const retryWait = (caught: SemanticProviderError) => caught.category === "RATE_LIMIT" && caught.details?.retryAfterMs !== null && caught.details?.retryAfterMs !== undefined
  ? Math.max(TRANSIENT_WAIT_MS, caught.details.retryAfterMs)
  : TRANSIENT_WAIT_MS;

const finalizeAttemptTraces = (context: OperationContext, attempts: SemanticProviderAttempt[], disposition: string, waitDuration = 0) => {
  const unresolved = context.traceIndexes.filter((index) => attemptTraces[index]?.finalDisposition === "IN_FLIGHT");
  attempts.forEach((attempt, offset) => {
    const index = unresolved[offset];
    if (index === undefined) return;
    const last = offset === attempts.length - 1;
    attemptTraces[index] = {
      ...attemptTraces[index],
      startedAt: attempt.requestStarted,
      completedAt: attempt.requestFinished,
      providerStatus: attempt.providerStatus,
      httpStatus: attempt.httpStatus,
      providerErrorCode: attempt.providerCode,
      category: attempt.category,
      waitDuration: last ? waitDuration : 0,
      finalDisposition: last ? disposition : "STRUCTURED_REGENERATION",
    };
  });
  checkpointAttempts();
};

const executeOperation = async <T extends { attempts?: SemanticProviderAttempt[] }>(
  operation: Omit<OperationContext, "operation" | "operationAttempt" | "requestStarts" | "traceIndexes">,
  invoke: () => Promise<T>,
): Promise<T> => {
  operationSequence += 1;
  if (operationSequence > 6) throw new Error("SEM001R5I_H29_LLM_OPERATION_BUDGET_EXCEEDED");
  const context: OperationContext = { ...operation, operation: operationSequence, operationAttempt: 0, requestStarts: 0, traceIndexes: [] };
  const accumulated: SemanticProviderAttempt[] = [];
  while (context.requestStarts < MAX_ATTEMPTS_PER_OPERATION) {
    context.operationAttempt += 1;
    activeOperation = context;
    try {
      const result = await invoke();
      const attempts = result.attempts ?? [];
      accumulated.push(...attempts);
      finalizeAttemptTraces(context, attempts, "SUCCESS");
      if (attempts.length > 1) structuredOutputIncidents.push({ caseId: context.caseId, stage: context.stage, turn: context.turn, cycle: context.cycle, disposition: "RECOVERED_BY_BOUNDED_STRUCTURED_REGENERATION", requestStarts: attempts.length });
      activeOperation = null;
      return { ...result, attempts: accumulated };
    } catch (caught) {
      if (!(caught instanceof SemanticProviderError)) { activeOperation = null; throw caught; }
      const attempts = caught.attempts ?? [];
      accumulated.push(...attempts);
      if (caught.category === "INVALID_STRUCTURED_OUTPUT") {
        finalizeAttemptTraces(context, attempts, "STRUCTURED_OUTPUT_FAILURE");
        structuredOutputIncidents.push({ caseId: context.caseId, stage: context.stage, turn: context.turn, cycle: context.cycle, disposition: "FAILED_AFTER_BOUNDED_STRUCTURED_REGENERATION", diagnostic: caught.diagnostic });
        checkpointAttempts();
        activeOperation = null;
        throw new SemanticProviderError(caught.category, accumulated, caught.details, caught.diagnostic);
      }
      const canRetry = transient(caught.category) && context.requestStarts < MAX_ATTEMPTS_PER_OPERATION;
      const waitDuration = canRetry ? retryWait(caught) : 0;
      finalizeAttemptTraces(context, attempts, canRetry ? "RETRY_SCHEDULED" : transient(caught.category) ? "PROVIDER_CAPACITY_FAILURE" : "NON_RETRYABLE_FAILURE", waitDuration);
      if (!canRetry) { activeOperation = null; throw new SemanticProviderError(caught.category, accumulated, caught.details, caught.diagnostic); }
      activeOperation = null;
      await new Promise<void>((resolve) => setTimeout(resolve, waitDuration));
    }
  }
  activeOperation = null;
  throw new SemanticProviderError("SERVER_ERROR", accumulated, { httpStatus: 503, providerStatus: "OPERATION_ATTEMPTS_EXHAUSTED", providerCode: null, providerError: "Maximum request starts exhausted.", retryable: true, retryAfterMs: null });
};

const provider: ScientificSemanticProvider = {
  metadata: baseProvider.metadata,
  reconstruct: (request) => executeOperation({ caseId: fixture.caseId, stage: "RECONSTRUCTION", turn: request.messages.filter((item) => item.role === "USER").length, cycle: null }, () => baseProvider.reconstruct(request)),
  critique: (request, candidate, coverage) => executeOperation({ caseId: fixture.caseId, stage: "CRITIC", turn: request.messages.filter((item) => item.role === "USER").length, cycle: coverage.cycle }, () => baseProvider.critique(request, candidate, coverage)),
};

const startedAt = new Date().toISOString();
const result: any = {
  campaign: "SEM-001R5I",
  caseId: fixture.caseId,
  configurationName: EXPECTED_CONFIGURATION_NAME,
  configurationDigest: EXPECTED_CONFIGURATION_DIGEST,
  chain: "HOMOGENEOUS_R5I_NO_PRIOR_RESULT_REUSE",
  sourceFreeze: relativeArtifact(FREEZE_PATH),
  sourceFreezeDigest: logicalDigest(freeze),
  provider: PROVIDER,
  model: MODEL_ID,
  promptVersions: { reconstruction: SEMANTIC_RECONSTRUCTION_PROMPT_VERSION, critic: SEMANTIC_CRITIC_PROMPT_VERSION },
  schemaVersion: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
  semanticModelVersion: SCIENTIFIC_SEMANTIC_MODEL_VERSION,
  startedAt,
  completedAt: null,
  decision: "RUNNING",
  turns: [],
  metric: null,
  firstDivergentStage: null,
  failureClass: null,
  error: null,
};
const messages: SemanticConversationMessage[] = [];
let semanticModel: ScientificSemanticModel | null = null;
try {
  for (let turnIndex = 0; turnIndex < fixture.turns.length; turnIndex += 1) {
    messages.push({ messageId: `${fixture.caseId}:user:${turnIndex + 1}`, role: "USER", content: fixture.turns[turnIndex], createdAt: `2026-08-13T10:29:0${turnIndex}.000Z` });
    const request: SemanticReconstructionRequest = {
      schemaVersion: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
      sessionId: `sem-001r5i:${fixture.caseId}`,
      language: "fr",
      messages: [...messages],
      previousModel: semanticModel,
    };
    const reconstruction = await provider.reconstruct(request);
    const critique = await runSemanticCriticCycles(provider, request, reconstruction.candidate);
    if (!critique.accepted) {
      result.firstDivergentStage = `TURN_${turnIndex + 1}_CRITIC`;
      result.failureClass = "CRITIC_FAILURE";
      throw new Error(`SEM001R5I_CRITIC_NOT_ACCEPTED:${critique.terminalReason}`);
    }
    const finalCritic = critique.critics.at(-1);
    const finalCriticCallId = critique.callIds.at(-1);
    if (!finalCritic || !finalCriticCallId) throw new Error("SEM001R5I_CRITIC_RESULT_MISSING");
    semanticModel = verifySemanticModelWithKnowledge(canonicalizeSemanticReconstruction({
      request,
      candidate: critique.candidate,
      critic: finalCritic,
      metadata: baseProvider.metadata,
      reconstructionCallId: reconstruction.callId,
      criticCallId: finalCriticCallId,
      criticCallIds: critique.callIds,
      critics: critique.critics,
      reconstructionAttempts: reconstruction.attempts ?? [],
      criticAttempts: critique.attempts,
    }));
    result.turns.push({
      turn: turnIndex + 1,
      requestMessageIds: request.messages.map((item) => item.messageId),
      reconstruction: reconstruction.candidate,
      reconstructionDigest: logicalDigest(reconstruction.candidate),
      critics: critique.critics,
      criticTerminalReason: critique.terminalReason,
      criticRepairs: critique.repairDiagnostics,
      canonicalModel: semanticModel,
      canonicalModelDigest: semanticModel.digest,
    });
    messages.push({ messageId: `${fixture.caseId}:noxia:${turnIndex + 1}`, role: "NOXIA", content: semanticModel.summaryForUser, createdAt: semanticModel.updatedAt });
  }
  if (!semanticModel) throw new Error("SEM001R5I_CANONICAL_MODEL_MISSING");
  const metric = evaluateSemanticCase(fixture, semanticModel);
  result.metric = metric;
  result.semanticModel = semanticModel;
  result.semanticModelDigest = semanticModel.digest;
  const passes = metric.absoluteBlockers.length === 0
    && metric.explicitObjectRecall === 1
    && metric.explicitRelationRecall === 1
    && metric.criticalSemanticRecall === 1
    && metric.modalityPreserved
    && metric.correctionPropagation
    && metric.multiTurnContextPreserved
    && metric.criticalUnsupportedInferenceCount === 0
    && !metric.genericDomainCollapse;
  result.decision = passes ? "H29_PASS" : "H29_FAIL";
  if (!passes) {
    result.firstDivergentStage = "POST_CANONICAL_HOLDOUT_EVALUATION";
    result.failureClass = metric.absoluteBlockers.some((item: string) => item.startsWith("RELATION_LOST")) ? "RELATION_COVERAGE_FAILURE"
      : metric.absoluteBlockers.some((item: string) => item.startsWith("EXPLICIT_")) ? "OBJECT_COVERAGE_FAILURE"
        : metric.absoluteBlockers.includes("CORRECTION_NOT_PROPAGATED") || metric.absoluteBlockers.includes("MULTI_TURN_CONTEXT_LOST") ? "MODEL_REASONING_FAILURE"
          : "EVALUATOR_FAILURE";
  }
} catch (caught) {
  if (caught instanceof SemanticProviderError) {
    result.decision = transient(caught.category) || caught.category === "QUOTA" ? "SEM_LEGACY_CLOSURE_BLOCKED_BY_PROVIDER" : "H29_FAIL";
    result.firstDivergentStage ??= activeOperation ? `${activeOperation.stage}_TURN_${activeOperation.turn}` : "LLM_PROVIDER_OPERATION";
    result.failureClass = caught.category === "INVALID_STRUCTURED_OUTPUT" ? "STRUCTURED_OUTPUT_FAILURE" : "PROVIDER_FAILURE";
    result.error = { category: caught.category, httpStatus: caught.details?.httpStatus ?? null, providerStatus: caught.details?.providerStatus ?? null, providerErrorCode: caught.details?.providerCode ?? null, message: caught.details?.providerError ?? caught.message, diagnostic: caught.diagnostic };
  } else {
    result.decision = "H29_FAIL";
    result.firstDivergentStage ??= "SEMANTIC_PIPELINE";
    result.failureClass ??= "CONFIGURATION_FAILURE";
    result.error = { message: caught instanceof Error ? caught.message : "UNKNOWN_FAILURE" };
  }
}
result.completedAt = new Date().toISOString();
result.llmOperations = operationSequence;
result.providerRequestStarts = attemptTraces.length;
result.retries = attemptTraces.filter((item) => item.finalDisposition === "RETRY_SCHEDULED").length;
result.structuredOutputIncidents = structuredOutputIncidents.length;
writeJsonAt(RESULT_PATH, result);
checkpointAttempts();
writeJsonAt(path.join(DIRECTORY, "llm-call-accounting.json"), {
  campaign: "SEM-001R5I",
  caseId: fixture.caseId,
  configurationName: EXPECTED_CONFIGURATION_NAME,
  configurationDigest: EXPECTED_CONFIGURATION_DIGEST,
  llmOperations: operationSequence,
  providerRequestStarts: attemptTraces.length,
  retries: result.retries,
  structuredOutputIncidents: structuredOutputIncidents.length,
  qualifyingResultCallsAvoidedByReuse: 0,
  historicalArtifactsRetainedAuditOnly: true,
  noSecretsStored: true,
});
console.log(JSON.stringify({ decision: result.decision, caseId: fixture.caseId, configurationDigest: EXPECTED_CONFIGURATION_DIGEST, llmOperations: operationSequence, providerRequestStarts: attemptTraces.length, retries: result.retries, structuredOutputIncidents: structuredOutputIncidents.length, metric: result.metric, artifact: relativeArtifact(RESULT_PATH), error: result.error }, null, 2));
process.exit(result.decision === "H29_PASS" ? 0 : result.decision === "SEM_LEGACY_CLOSURE_BLOCKED_BY_PROVIDER" ? 3 : 2);
