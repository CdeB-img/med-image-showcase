import { appendFileSync, readFileSync } from "node:fs";

import { canonicalizeSemanticReconstruction } from "../../../src/features/scientific-semantic-reconstruction/canonical.js";
import {
  buildSemanticCoverage,
  preserveContextualMeasurementAmbiguities,
  runSemanticCriticCycles,
} from "../../../src/features/scientific-semantic-reconstruction/coverage.js";
import { GeminiScientificSemanticProvider } from "../../../src/features/scientific-semantic-reconstruction/provider.js";
import {
  SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
  SEMANTIC_CRITIC_CHECKS,
  type ScientificSemanticModel,
  type SemanticCriticResult,
  type SemanticReconstructionCandidate,
  type SemanticReconstructionRequest,
} from "../../../src/features/scientific-semantic-reconstruction/types.js";

type ConversationTurn = { turnId: string; role: "USER" | "ASSISTANT"; content: string };
type BranchInput = { previousModel: ScientificSemanticModel | null };
type Input = {
  mode: "PAIR" | "FULL" | "SINGLE";
  phase: string;
  scenarioId: string;
  roundId: string;
  operationKey: string;
  ledgerPath: string;
  sessionId: string;
  conversationTurns: ConversationTurn[];
  full?: BranchInput;
  single?: BranchInput;
};

const MODEL = "gemini-3.5-flash-lite";
const FIXED_CREATED_AT = "2026-08-14T00:00:00.000Z";

const utcNow = () => new Date().toISOString();
const readEvents = (path: string) => {
  try {
    return readFileSync(path, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line));
  } catch {
    return [];
  }
};
const append = (path: string, value: unknown) => appendFileSync(path, `${JSON.stringify(value)}\n`, "utf8");

const waitForPacing = async (path: string) => {
  while (true) {
    const now = Date.now();
    const recent = readEvents(path)
      .filter((event: any) => event.event === "RESERVED")
      .map((event: any) => Date.parse(event.reservedAt))
      .filter((stamp: number) => Number.isFinite(stamp) && now - stamp < 60_000)
      .sort((left: number, right: number) => left - right);
    if (recent.length < 10) return;
    await new Promise((resolve) => setTimeout(resolve, Math.max(100, 60_050 - (now - recent[0]))));
  }
};

const createProvider = (input: Input, configurationId: string) => {
  const identicalRequestStarts = new Map<string, number>();
  const ledgerFetch: typeof fetch = async (url, init) => {
    await waitForPacing(input.ledgerPath);
    const events = readEvents(input.ledgerPath);
    const reservations = events.filter((event: any) => event.event === "RESERVED");
    if (reservations.length >= 320) throw new Error("PROVIDER_DAILY_BUDGET_HARD_STOP");
    const body = typeof init?.body === "string" ? init.body : "";
    const structuredRepair = body.includes("structuredValidationCorrection");
    const critic = body.includes("criticCycle");
    const operation = structuredRepair
      ? (critic ? "SEM_CRITIC_STRUCTURED_REPAIR" : "SEM_RECONSTRUCTION_STRUCTURED_REPAIR")
      : (critic ? "SEM_CRITIC" : "SEM_RECONSTRUCTION");
    const identicalStarts = identicalRequestStarts.get(body) ?? 0;
    identicalRequestStarts.set(body, identicalStarts + 1);
    const reservation = {
      event: "RESERVED",
      requestNumber: reservations.length + 1,
      operationKey: `${input.operationKey}:${configurationId}:${operation}:${reservations.length + 1}`,
      configurationId,
      phase: input.phase,
      scenarioId: input.scenarioId,
      round: input.roundId,
      operation,
      reservedAt: utcNow(),
      provider: "GOOGLE_GEMINI",
      model: MODEL,
      temperature: null,
      status: "RESERVED",
      retry: identicalStarts,
    };
    append(input.ledgerPath, reservation);
    const startedAt = utcNow();
    try {
      const response = await fetch(url, init);
      append(input.ledgerPath, {
        event: "COMPLETED",
        requestNumber: reservation.requestNumber,
        operationKey: reservation.operationKey,
        configurationId,
        phase: input.phase,
        scenarioId: input.scenarioId,
        round: input.roundId,
        operation,
        startedAt,
        completedAt: utcNow(),
        provider: "GOOGLE_GEMINI",
        model: MODEL,
        status: response.ok ? "SUCCEEDED" : `HTTP_${response.status}`,
        success: response.ok,
        retry: reservation.retry,
        error: response.ok ? null : `HTTP ${response.status}`,
      });
      return response;
    } catch (caught) {
      append(input.ledgerPath, {
        event: "COMPLETED",
        requestNumber: reservation.requestNumber,
        operationKey: reservation.operationKey,
        configurationId,
        phase: input.phase,
        scenarioId: input.scenarioId,
        round: input.roundId,
        operation,
        startedAt,
        completedAt: utcNow(),
        provider: "GOOGLE_GEMINI",
        model: MODEL,
        status: "FAILED",
        success: false,
        retry: reservation.retry,
        error: caught instanceof Error ? caught.message.slice(0, 1600) : String(caught).slice(0, 1600),
      });
      throw caught;
    }
  };
  const provider = new GeminiScientificSemanticProvider({
    apiKey: process.env.GEMINI_API_KEY ?? "",
    model: MODEL,
    maxAttempts: 2,
    retryBaseMs: 60_000,
    maxRetryDelayMs: 60_000,
    retryJitterRatio: 0,
    fetchImpl: ledgerFetch,
  });
  return provider;
};

const requestFor = (input: Input, previousModel: ScientificSemanticModel | null): SemanticReconstructionRequest => ({
  schemaVersion: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
  sessionId: input.sessionId,
  language: "fr",
  messages: input.conversationTurns.map((turn) => ({
    messageId: turn.turnId,
    role: turn.role === "USER" ? "USER" : "NOXIA",
    content: turn.content,
    createdAt: FIXED_CREATED_AT,
  })),
  previousModel,
});

const deterministicCritic = (
  request: SemanticReconstructionRequest,
  candidate: SemanticReconstructionCandidate,
): SemanticCriticResult => {
  const coverage = buildSemanticCoverage(request, candidate);
  const complete = coverage.explicit.status === "COMPLETE"
    && coverage.relations.status === "COMPLETE"
    && coverage.taxonomy.status === "COMPLETE"
    && coverage.integrity.status === "COMPLETE";
  return {
    criticId: "EXP-SEM-ABLATION-02-DETERMINISTIC-NO-LLM-CRITIC",
    verdict: complete ? "ACCEPT" : "CLARIFICATION_REQUIRED",
    checklist: SEMANTIC_CRITIC_CHECKS.map((check) => ({
      check,
      result: complete ? "PASS" : "NOT_APPLICABLE",
      evidence: complete
        ? "Deterministic coverage, relation, taxonomy and integrity reports are complete."
        : "No semantic critic was executed; deterministic reports remain visible.",
    })),
    missingExplicitSourceFragments: [],
    issues: [],
    proposedRepairs: [],
    criticSummary: complete
      ? "Single-pass deterministic reports complete; no semantic critic was executed."
      : "Single-pass deterministic reports incomplete; no semantic critic or repair was executed.",
  };
};

const runSingle = (
  input: Input,
  request: SemanticReconstructionRequest,
  initialCandidate: SemanticReconstructionCandidate,
  reconstructionCallId: string,
  reconstructionAttempts: any[],
) => {
  const candidate = preserveContextualMeasurementAmbiguities(request, initialCandidate);
  const critic = deterministicCritic(request, candidate);
  const model = canonicalizeSemanticReconstruction({
    request,
    candidate,
    critic,
    metadata: { provider: "GOOGLE_GEMINI", model: MODEL, temperature: null },
    reconstructionCallId,
    criticCallId: "deterministic-no-critic",
    criticCallIds: [],
    critics: [],
    reconstructionAttempts,
    criticAttempts: [],
  });
  return {
    status: "SUCCESS",
    model,
    initialReconstruction: initialCandidate,
    deterministicCoverage: buildSemanticCoverage(request, candidate),
    semanticCriticExecuted: false,
  };
};

const runFull = async (
  provider: ReturnType<typeof createProvider>,
  request: SemanticReconstructionRequest,
  initialCandidate: SemanticReconstructionCandidate,
  reconstructionCallId: string,
  reconstructionAttempts: any[],
) => {
  const critique = await runSemanticCriticCycles(provider, request, initialCandidate);
  const finalCritic = critique.critics.at(-1);
  const finalCriticCallId = critique.callIds.at(-1);
  if (!finalCritic || !finalCriticCallId) throw new Error("SEMANTIC_CRITIC_RESULT_MISSING");
  const model = canonicalizeSemanticReconstruction({
    request,
    candidate: critique.candidate,
    critic: finalCritic,
    metadata: provider.metadata,
    reconstructionCallId,
    criticCallId: finalCriticCallId,
    criticCallIds: critique.callIds,
    critics: critique.critics,
    reconstructionAttempts,
    criticAttempts: critique.attempts,
  });
  return {
    status: "SUCCESS",
    model,
    initialReconstruction: initialCandidate,
    postCriticCandidate: critique.candidate,
    criticCycles: critique,
    semanticCriticExecuted: true,
  };
};

const safe = async (fn: () => Promise<unknown> | unknown) => {
  try {
    return await fn();
  } catch (caught) {
    return {
      status: "FAILED",
      error: caught instanceof Error ? caught.stack ?? caught.message : String(caught),
    };
  }
};

const main = async () => {
  const input = JSON.parse(readFileSync(0, "utf8")) as Input;
  const output: Record<string, unknown> = {
    mode: input.mode,
    pairedFirstReconstruction: input.mode === "PAIR",
  };

  if (input.mode === "PAIR") {
    if (!input.full || !input.single) throw new Error("PAIR_REQUIRES_BOTH_BRANCHES");
    const request = requestFor(input, input.full.previousModel);
    const provider = createProvider(input, "SEM_SHARED_FIRST_RECONSTRUCTION");
    const reconstruction = await provider.reconstruct(request);
    output.SEM_SINGLE_PASS = await safe(() => runSingle(
      input,
      request,
      structuredClone(reconstruction.candidate),
      reconstruction.callId,
      reconstruction.attempts,
    ));
    output.SEM_FULL = await safe(() => runFull(
      provider,
      request,
      structuredClone(reconstruction.candidate),
      reconstruction.callId,
      reconstruction.attempts,
    ));
  } else if (input.mode === "FULL") {
    if (!input.full) throw new Error("FULL_BRANCH_REQUIRED");
    const request = requestFor(input, input.full.previousModel);
    const provider = createProvider(input, "SEM_FULL");
    const reconstruction = await provider.reconstruct(request);
    output.SEM_FULL = await safe(() => runFull(
      provider,
      request,
      reconstruction.candidate,
      reconstruction.callId,
      reconstruction.attempts,
    ));
  } else {
    if (!input.single) throw new Error("SINGLE_BRANCH_REQUIRED");
    const request = requestFor(input, input.single.previousModel);
    const provider = createProvider(input, "SEM_SINGLE_PASS");
    const reconstruction = await provider.reconstruct(request);
    output.SEM_SINGLE_PASS = await safe(() => runSingle(
      input,
      request,
      reconstruction.candidate,
      reconstruction.callId,
      reconstruction.attempts,
    ));
  }

  process.stdout.write(`${JSON.stringify(output)}\n`);
};

void main().catch((caught) => {
  process.stderr.write(`${caught instanceof Error ? caught.stack ?? caught.message : String(caught)}\n`);
  process.exitCode = 1;
});
