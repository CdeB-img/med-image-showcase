import { appendFileSync, readFileSync } from "node:fs";

import { GeminiScientificSemanticProvider } from "../../../src/features/scientific-semantic-reconstruction/provider.js";
import { processScientificSemanticHttp } from "../../../src/features/scientific-semantic-reconstruction/server.js";
import { SCIENTIFIC_SEMANTIC_SCHEMA_VERSION } from "../../../src/features/scientific-semantic-reconstruction/types.js";

type Input = {
  caseId: string;
  language: "fr" | "en";
  conversationTurns: Array<{ messageId: string; role: "USER" | "NOXIA"; content: string }>;
  ledgerPath: string;
  scenario: string;
  roundId: string;
  operationKey: string;
};

const utcNow = () => new Date().toISOString();
const parseEvents = (path: string) => {
  try { return readFileSync(path, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line)); }
  catch { return []; }
};
const append = (path: string, value: unknown) => appendFileSync(path, `${JSON.stringify(value)}\n`, "utf8");

const waitForPacing = async (path: string) => {
  while (true) {
    const now = Date.now();
    const recent = parseEvents(path)
      .filter((item: any) => item.event === "RESERVED")
      .map((item: any) => Date.parse(item.reservedAt))
      .filter((stamp: number) => Number.isFinite(stamp) && now - stamp < 60_000)
      .sort((a: number, b: number) => a - b);
    if (recent.length < 10) return;
    await new Promise((resolve) => setTimeout(resolve, Math.max(100, 60_050 - (now - recent[0]))));
  }
};

const reserve = async (input: Input, operation: string) => {
  await waitForPacing(input.ledgerPath);
  const events = parseEvents(input.ledgerPath);
  const count = events.filter((item: any) => item.event === "RESERVED").length;
  const phaseCount = events.filter((item: any) => item.event === "RESERVED" && item.scenario === input.scenario).length;
  if (input.scenario === "SMOKE" && phaseCount >= 25) throw new Error("PHASE_A_PROVIDER_CALL_CAP_REACHED");
  if (count >= 135 || 357 + count >= 492) throw new Error("PROVIDER_DAILY_BUDGET_HARD_STOP");
  const value = {
    event: "RESERVED", requestNumber: count + 1,
    operationKey: `${input.operationKey}:${operation}:${count + 1}`,
    baselineOrSimulator: "EXP-SEM-INTERACTIVE-SEM-CURRENT",
    scenario: input.scenario, round: input.roundId, operation,
    reservedAt: utcNow(), provider: "GOOGLE_GEMINI", model: "gemini-3.5-flash-lite",
    status: "RESERVED", retry: 0,
  };
  append(input.ledgerPath, value);
  return value;
};

const main = async () => {
  const input = JSON.parse(readFileSync(0, "utf8")) as Input;
  let currentOperation = "SEM_PROVIDER_OPERATION";
  const ledgerFetch: typeof fetch = async (url, init) => {
    const reservation = await reserve(input, currentOperation);
    const startedAt = utcNow();
    try {
      const response = await fetch(url, init);
      append(input.ledgerPath, {
        event: "COMPLETED", requestNumber: reservation.requestNumber,
        operationKey: reservation.operationKey, baselineOrSimulator: reservation.baselineOrSimulator,
        scenario: input.scenario, round: input.roundId, operation: currentOperation,
        startedAt, completedAt: utcNow(), provider: "GOOGLE_GEMINI", model: "gemini-3.5-flash-lite",
        status: response.ok ? "SUCCEEDED" : `HTTP_${response.status}`, success: response.ok,
        retry: 0, error: response.ok ? null : `HTTP ${response.status}`,
      });
      return response;
    } catch (caught) {
      append(input.ledgerPath, {
        event: "COMPLETED", requestNumber: reservation.requestNumber,
        operationKey: reservation.operationKey, baselineOrSimulator: reservation.baselineOrSimulator,
        scenario: input.scenario, round: input.roundId, operation: currentOperation,
        startedAt, completedAt: utcNow(), provider: "GOOGLE_GEMINI", model: "gemini-3.5-flash-lite",
        status: "FAILED", success: false, retry: 0,
        error: caught instanceof Error ? caught.message.slice(0, 1200) : String(caught).slice(0, 1200),
      });
      throw caught;
    }
  };
  const provider = new GeminiScientificSemanticProvider({
    apiKey: process.env.GEMINI_API_KEY ?? "", model: "gemini-3.5-flash-lite",
    maxAttempts: 1, fetchImpl: async (url, init) => {
      const body = typeof init?.body === "string" ? init.body : "";
      currentOperation = body.includes("criticCycle") ? "SEM_CRITIC" : "SEM_RECONSTRUCTION";
      return ledgerFetch(url, init);
    },
  });
  const createdAt = utcNow();
  const response = await processScientificSemanticHttp({
    method: "POST", headers: { "content-type": "application/json" }, ip: `interactive-${input.caseId}`,
    body: {
      schemaVersion: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
      sessionId: `interactive-${input.caseId}`,
      language: input.language,
      messages: input.conversationTurns.map((turn) => ({ ...turn, createdAt })),
      previousModel: null,
    },
  }, { provider });
  process.stdout.write(`${JSON.stringify(response.body)}\n`);
};

void main().catch((caught) => {
  process.stderr.write(`${caught instanceof Error ? caught.stack ?? caught.message : String(caught)}\n`);
  process.exitCode = 1;
});
