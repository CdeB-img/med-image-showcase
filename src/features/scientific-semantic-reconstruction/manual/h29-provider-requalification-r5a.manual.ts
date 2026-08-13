/* eslint-disable @typescript-eslint/no-explicit-any */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnv } from "vite";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { SCIENTIFIC_SEMANTIC_ATOMIC_COMPOSITION_AUDIT_PROMPT } from "../../../../api/prompts/scientific-semantic-atomic-composition-prompt";
import { SCIENTIFIC_SEMANTIC_CRITIC_PROMPT, SCIENTIFIC_SEMANTIC_RECONSTRUCTION_PROMPT } from "../../../../api/prompts/scientific-semantic-reconstruction-prompt";
import { SEMANTIC_ATOMIC_COMPOSITION_AUDIT_JSON_SCHEMA } from "../atomic-composition";
import { DEVELOPMENT_CASES, HOLDOUT_CASES } from "../competence-fixtures";
import { buildSemanticCoverage } from "../coverage";
import { GeminiScientificSemanticProvider, SemanticProviderError } from "../provider";
import { SEMANTIC_CRITIC_JSON_SCHEMA, SEMANTIC_RECONSTRUCTION_JSON_SCHEMA } from "../schema";
import {
  SCIENTIFIC_SEMANTIC_MODEL_VERSION,
  SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
  SEMANTIC_CRITIC_PROMPT_VERSION,
  SEMANTIC_RECONSTRUCTION_PROMPT_VERSION,
  type SemanticConversationMessage,
  type SemanticProviderFailureCategory,
  type SemanticReconstructionRequest,
} from "../types";
import { RollingWindowRequestLimiter } from "./rolling-rate-limiter";

const ROOT = process.cwd();
const SOURCE_DIRECTORY = path.resolve(ROOT, "semantic-validation/sem-001r5");
const DIRECTORY = path.resolve(ROOT, "semantic-validation/sem-001r5a");
const TARGET = path.join(DIRECTORY, "h29-provider-requalification.json");
const RAW_DIRECTORY = path.join(DIRECTORY, "h29-provider-raw-responses");
const MODEL_ID = "gemini-3.5-flash-lite";
const MAX_ATTEMPTS_PER_OPERATION = 5;
const TRANSIENT_WAIT_MS = 60_000;

const readJson = <T>(target: string): T => JSON.parse(readFileSync(target, "utf8")) as T;
const exists = (target: string) => { try { readFileSync(target); return true; } catch { return false; } };
const writeJson = (target: string, value: unknown) => {
  mkdirSync(path.dirname(target), { recursive: true });
  const temporary = `${target}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  renameSync(temporary, target);
};
const source = (relativePath: string) => readFileSync(path.resolve(ROOT, relativePath), "utf8");
const priorAttempt = exists(TARGET) ? readJson<any>(TARGET) : null;
const expected = readJson<any>(path.join(SOURCE_DIRECTORY, "configuration-verification-closure.json"));
const checkpoint = readJson<any>(path.join(SOURCE_DIRECTORY, "case-checkpoints/SEM-H29.json"));
const fixture = HOLDOUT_CASES.find((item) => item.caseId === "SEM-H29");
if (!fixture || fixture.turns.length !== 2) throw new Error("SEM001R5A_H29_FIXTURE_INVALID");
const firstTurnModel = checkpoint.turns?.[0]?.canonicalModel;
const firstTurnModelDigest = checkpoint.turns?.[0]?.canonicalModelDigest;
if (!firstTurnModel || !firstTurnModelDigest || checkpoint.turns?.length !== 1) throw new Error("SEM001R5A_H29_FIRST_TURN_CHECKPOINT_MISSING");

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
const changedOwnersFromR5 = Object.keys(currentDigests).filter((key) => currentDigests[key as keyof typeof currentDigests] !== expected.currentDigests?.[key]);
const immutableInputsPreserved = currentDigests.developmentCorpus === expected.currentDigests?.developmentCorpus
  && currentDigests.developmentGold === expected.currentDigests?.developmentGold
  && currentDigests.holdoutCorpus === expected.currentDigests?.holdoutCorpus
  && currentDigests.holdoutGold === expected.currentDigests?.holdoutGold;
const firstTurnRequest: SemanticReconstructionRequest = {
  schemaVersion: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
  sessionId: "sem-001r5a-checkpoint-audit:SEM-H29",
  language: "fr",
  messages: [{ messageId: "SEM-H29:user:1", role: "USER", content: fixture.turns[0], createdAt: "2026-08-12T21:29:00.000Z" }],
  previousModel: null,
};
const firstTurnCoverage = buildSemanticCoverage(firstTurnRequest, checkpoint.turns[0].reconstruction);
const firstTurnCompatible = firstTurnCoverage.explicit.status === "COMPLETE"
  && firstTurnCoverage.relations.status === "COMPLETE"
  && firstTurnCoverage.taxonomy.status === "COMPLETE"
  && firstTurnCoverage.integrity.status === "COMPLETE";
if (!immutableInputsPreserved || !firstTurnCompatible) {
  writeJson(TARGET, {
    campaign: "SEM-001R5A",
    caseId: "SEM-H29",
    decision: "R5A_BLOCKED_BY_CONFIGURATION_DRIFT",
    immutableInputsPreserved,
    firstTurnCoverage,
    changedOwnersFromR5,
    providerCalls: 0,
  });
  console.log(JSON.stringify(readJson(TARGET), null, 2));
  process.exit(4);
}
if (process.argv.includes("--verify-checkpoint")) {
  const verification = {
    campaign: "SEM-001R5A",
    caseId: "SEM-H29",
    decision: "H29_FIRST_TURN_CHECKPOINT_COMPATIBLE_FOR_TARGETED_PROVIDER_REQUALIFICATION",
    immutableInputsPreserved,
    changedConfigurationOwnersFromR5: changedOwnersFromR5,
    semanticModelDigest: firstTurnModelDigest,
    currentDeterministicCoverage: firstTurnCoverage,
    providerCalls: 0,
  };
  writeJson(path.join(DIRECTORY, "h29-checkpoint-compatibility.json"), verification);
  console.log(JSON.stringify(verification, null, 2));
  process.exit(0);
}

const environment = loadEnv("development", ROOT, "");
const apiKey = environment.GEMINI_API_KEY?.trim();
if (!apiKey) {
  writeJson(TARGET, {
    campaign: "SEM-001R5A",
    caseId: "SEM-H29",
    decision: "R5A_BLOCKED_BY_PROVIDER",
    reason: "GEMINI_API_KEY_MISSING",
    providerCalls: 0,
  });
  console.log(JSON.stringify(readJson(TARGET), null, 2));
  process.exit(3);
}

const limiter = new RollingWindowRequestLimiter({ maxRequests: 5, windowMs: 60_000, safetyMarginMs: 500 });
const attempts: any[] = [];
let requestStarts = 0;
let rawSequence = 0;
const instrumentedFetch: typeof fetch = async (input, init) => {
  requestStarts += 1;
  if (requestStarts > 2) throw new Error("SEM001R5A_H29_STRUCTURED_REQUEST_BUDGET_EXCEEDED");
  const response = await fetch(input, init);
  const rawBody = await response.clone().text();
  rawSequence += 1;
  writeJson(path.join(RAW_DIRECTORY, `${String(rawSequence).padStart(2, "0")}-reconstruction-turn-2.json`), {
    security: "LOCAL_MODE_0600_NO_REQUEST_HEADERS_NO_SECRET",
    campaign: "SEM-001R5A",
    caseId: "SEM-H29",
    stage: "RECONSTRUCTION",
    turn: 2,
    provider: "GOOGLE_GEMINI",
    model: MODEL_ID,
    httpStatus: response.status,
    capturedAt: new Date().toISOString(),
    rawStructuredResponse: rawBody,
  });
  return response;
};

const provider = new GeminiScientificSemanticProvider({
  apiKey,
  model: MODEL_ID,
  timeoutMs: 90_000,
  maxAttempts: 1,
  beforeAttempt: () => limiter.acquire(),
  fetchImpl: instrumentedFetch,
});
const transient = (category: SemanticProviderFailureCategory) => ["RATE_LIMIT", "TIMEOUT", "NETWORK", "SERVER_ERROR"].includes(category);
const retryWait = (caught: SemanticProviderError) => caught.category === "RATE_LIMIT" && caught.details?.retryAfterMs
  ? Math.max(TRANSIENT_WAIT_MS, caught.details.retryAfterMs)
  : TRANSIENT_WAIT_MS;

const messages: SemanticConversationMessage[] = [
  { messageId: "SEM-H29:user:1", role: "USER", content: fixture.turns[0], createdAt: "2026-08-12T21:29:00.000Z" },
  { messageId: "SEM-H29:noxia:1", role: "NOXIA", content: firstTurnModel.summaryForUser, createdAt: firstTurnModel.updatedAt },
  { messageId: "SEM-H29:user:2", role: "USER", content: fixture.turns[1], createdAt: "2026-08-12T21:29:01.000Z" },
];
const request: SemanticReconstructionRequest = {
  schemaVersion: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
  sessionId: "sem-001r5a-targeted:SEM-H29",
  language: "fr",
  messages,
  previousModel: firstTurnModel,
};

let result: Awaited<ReturnType<typeof provider.reconstruct>> | null = null;
let terminalError: SemanticProviderError | null = null;
for (let operationAttempt = 1; operationAttempt <= MAX_ATTEMPTS_PER_OPERATION; operationAttempt += 1) {
  const startedAt = new Date().toISOString();
  try {
    result = await provider.reconstruct(request);
    attempts.push({ operationAttempt, startedAt, completedAt: new Date().toISOString(), providerStatus: "SUCCESS", waitDuration: 0, finalDisposition: "SUCCESS", requestStarts: result.attempts.length });
    terminalError = null;
    break;
  } catch (caught) {
    if (!(caught instanceof SemanticProviderError)) throw caught;
    terminalError = caught;
    const canRetry = transient(caught.category) && operationAttempt < MAX_ATTEMPTS_PER_OPERATION;
    const waitDuration = canRetry ? retryWait(caught) : 0;
    attempts.push({
      operationAttempt,
      startedAt,
      completedAt: new Date().toISOString(),
      providerStatus: caught.details?.providerStatus ?? caught.category,
      httpStatus: caught.details?.httpStatus ?? null,
      providerErrorCode: caught.details?.providerCode ?? null,
      waitDuration,
      finalDisposition: canRetry ? "RETRY_SCHEDULED" : caught.category === "INVALID_STRUCTURED_OUTPUT" ? "REPRODUCED_FAILURE" : transient(caught.category) ? "PROVIDER_CAPACITY_FAILURE" : "NON_RETRYABLE_FAILURE",
      requestStarts: caught.attempts.length,
    });
    if (!canRetry) break;
    requestStarts = 0;
    await new Promise<void>((resolve) => setTimeout(resolve, waitDuration));
  }
}

const decision = result
  ? "PASS"
  : terminalError?.category === "INVALID_STRUCTURED_OUTPUT"
    ? "REPRODUCED_FAILURE"
    : terminalError && transient(terminalError.category)
      ? "R5A_BLOCKED_BY_PROVIDER"
      : "REPRODUCED_FAILURE";
const artifact = {
  campaign: "SEM-001R5A",
  caseId: "SEM-H29",
  scope: "TARGETED_PROVIDER_STRUCTURED_OUTPUT_REQUALIFICATION_ONLY",
  sourceConfiguration: "semantic-validation/sem-001r5/configuration-verification-closure.json",
  sourceConfigurationDigest: expected.semanticConfigurationDigest,
  r5aSemanticConfigurationDigest: logicalDigest({
    model: MODEL_ID,
    versions: {
      reconstruction: SEMANTIC_RECONSTRUCTION_PROMPT_VERSION,
      critic: SEMANTIC_CRITIC_PROMPT_VERSION,
      schema: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
      model: SCIENTIFIC_SEMANTIC_MODEL_VERSION,
    },
    digests: currentDigests,
  }),
  changedConfigurationOwnersFromR5: changedOwnersFromR5,
  immutableInputsPreserved,
  sourceCheckpoint: "semantic-validation/sem-001r5/case-checkpoints/SEM-H29.json",
  reusedCheckpoint: { turn: 1, semanticModelDigest: firstTurnModelDigest, compatible: firstTurnCompatible, currentDeterministicCoverage: firstTurnCoverage },
  provider: "GOOGLE_GEMINI",
  model: MODEL_ID,
  promptVersion: SEMANTIC_RECONSTRUCTION_PROMPT_VERSION,
  criticPromptVersion: SEMANTIC_CRITIC_PROMPT_VERSION,
  decision,
  candidateDigest: result ? logicalDigest(result.candidate) : null,
  structuredCorrectionUsed: Boolean(result && result.attempts.length > 1) || terminalError?.category === "INVALID_STRUCTURED_OUTPUT",
  providerCalls: rawSequence,
  providerRequestStartsAttempted: attempts.reduce((sum, item) => sum + item.requestStarts, 0),
  operationAttempts: attempts,
  priorSandboxNetworkAttempt: priorAttempt?.decision === "R5A_BLOCKED_BY_PROVIDER" ? priorAttempt : null,
  diagnostic: terminalError?.diagnostic ?? null,
  exclusions: ["NO_FULL_HOLDOUT", "NO_GOLD_EVALUATION", "NO_PRODUCT_REPAIR", "NO_CRITIC_CALL", "NO_CANONICAL_REPLAY"],
  completedAt: new Date().toISOString(),
};
writeJson(TARGET, artifact);
console.log(JSON.stringify(artifact, null, 2));
process.exit(decision === "PASS" ? 0 : decision === "R5A_BLOCKED_BY_PROVIDER" ? 3 : 2);
