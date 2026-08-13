import { readFileSync } from "node:fs";

import { GeminiScientificSemanticProvider } from "../../../src/features/scientific-semantic-reconstruction/provider.js";
import { processScientificSemanticHttp } from "../../../src/features/scientific-semantic-reconstruction/server.js";
import { SCIENTIFIC_SEMANTIC_SCHEMA_VERSION } from "../../../src/features/scientific-semantic-reconstruction/types.js";

type ComparativeCaseInput = {
  schemaVersion: "1.0.0";
  contractType: "COMPARATIVE_SCIENTIFIC_CONVERSATION";
  caseId: string;
  caseVersion: string;
  language: "fr" | "en";
  conversationTurns: Array<{ messageId: string; role: "USER" | "NOXIA"; content: string }>;
};

export const BASELINE_ID = "SEM003C1-SEM-CURRENT-01";
export const PROVIDER = "GOOGLE_GEMINI";
export const MODEL = "gemini-3.5-flash-lite";

export const executeCurrentSem = async (input: ComparativeCaseInput, apiKey: string) => {
  if (!apiKey.trim()) throw new Error("GEMINI_API_KEY is required by an execution campaign");
  const provider = new GeminiScientificSemanticProvider({ apiKey, model: MODEL, maxAttempts: 1 });
  const createdAt = new Date().toISOString();
  const body = {
    schemaVersion: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
    sessionId: `sem003c1-${input.caseId}`,
    language: input.language,
    messages: input.conversationTurns.map((turn) => ({ ...turn, createdAt })),
    previousModel: null,
  };
  const response = await processScientificSemanticHttp(
    { method: "POST", headers: { "content-type": "application/json" }, body, ip: `sem003c1-${input.caseId}` },
    { provider },
  );
  if (response.status !== 200 || !("model" in response.body)) throw new Error(`SEM baseline failed with HTTP ${response.status}`);
  return response.body;
};

const runFromStdin = async () => {
  const input = JSON.parse(readFileSync(0, "utf8")) as ComparativeCaseInput;
  const output = await executeCurrentSem(input, process.env.GEMINI_API_KEY ?? "");
  process.stdout.write(`${JSON.stringify(output)}\n`);
};

if (process.argv[1]?.endsWith("sem_current.ts") && process.env.SEM003C1_VALIDATE_ONLY !== "1") {
  void runFromStdin();
}
