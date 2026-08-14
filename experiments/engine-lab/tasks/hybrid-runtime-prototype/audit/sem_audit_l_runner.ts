import { createHash } from "node:crypto";
import { readFileSync, renameSync, writeFileSync } from "node:fs";

import { SCIENTIFIC_SEMANTIC_RECONSTRUCTION_PROMPT } from "../../../../../api/prompts/scientific-semantic-reconstruction-prompt.js";

type Input = {
  experimentId: string;
  requestNumber: number;
  operationKey: string;
  scenario: string;
  turn: string;
  model: string;
  rawPath: string;
  conversationTurns: Array<{ turnId: string; role: "USER" | "ASSISTANT"; content: string }>;
  candidateState: unknown;
  deterministicFindings: unknown[];
  promptVersion: string;
};

const stable = (value: unknown) => JSON.stringify(value, Object.keys(value as any).sort());
const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const now = () => new Date().toISOString();

const auditSchema = {
  type: "object",
  additionalProperties: false,
  required: ["findings"],
  properties: {
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "findingId", "findingClass", "sourceEvidence", "candidatePointer", "auditJudgment",
          "rationale", "severity", "resolutionOwner", "confidence", "status", "origin",
          "structuralOnly", "confirmsFindingIds",
        ],
        properties: {
          findingId: { type: "string" },
          findingClass: { type: "string" },
          sourceEvidence: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["turnId", "sourceText"],
              properties: { turnId: { type: "string" }, sourceText: { type: "string" } },
            },
          },
          candidatePointer: { type: "string" },
          auditJudgment: { type: "string", enum: ["NEW", "CONFIRMED", "REJECTED", "UNRESOLVED"] },
          rationale: { type: "string" },
          severity: { type: "string", enum: ["INFO", "MINOR", "MAJOR", "CRITICAL"] },
          resolutionOwner: { type: "string" },
          confidence: { anyOf: [{ type: "number", minimum: 0, maximum: 1 }, { type: "null" }] },
          status: { type: "string", enum: ["OPEN", "ACKNOWLEDGED", "REJECTED", "RESOLVED"] },
          origin: { type: "string", enum: ["SEM_AUDIT_L"] },
          structuralOnly: { type: "boolean" },
          confirmsFindingIds: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
};

const auditInstructions = `
SEM-AUDIT-L experimental second-reader mode. Use the SEM Single scientific distinctions above, but do not reconstruct or replace state.
Read the full conversation, the immutable Pydantic primary candidate, and deterministic findings.
Return findings only. A finding may CONFIRM or REJECT a deterministic finding, or report a NEW semantic issue.
Never mutate the candidate, decide for the Project, adopt an endpoint, or add unsupported context.
Check explicit retention, direction and force of relations, polarity/non-causality, correction/supersession, timing, ownership, candidate versus adoption, local versus general scope, ambiguity and missing information.
Every sourceEvidence excerpt must be exact text from its declared conversation turn. candidatePointer must identify the candidate location.
CRITICAL is reserved for unsafe scientific distortion such as lost explicit negation, causal promotion, Project adoption, active rejected state, critical relation inversion or unsupported decision. MAJOR denotes a material semantic gap. Structural-only issues must be flagged.
Use short verifiable rationale only; no chain of thought.
`.trim();

const rawRecord = (input: Input, body: unknown, status: number, persistedAt: string) => ({
  experimentId: input.experimentId,
  requestNumber: input.requestNumber,
  operationKey: input.operationKey,
  configuration: "SEM_AUDIT_L",
  scenario: input.scenario,
  turn: input.turn,
  role: "SEMANTIC_AUDITOR",
  provider: "GOOGLE_GEMINI",
  model: input.model,
  temperature: null,
  promptVersion: input.promptVersion,
  promptDigest: digest(`${SCIENTIFIC_SEMANTIC_RECONSTRUCTION_PROMPT}\n${auditInstructions}`),
  schemaVersion: "SEM_AUDIT_L_BATCH_0.1.0-experimental",
  schemaDigest: digest(auditSchema),
  requestPayloadDigest: digest({
    conversationTurns: input.conversationTurns,
    candidateState: input.candidateState,
    deterministicFindings: input.deterministicFindings,
  }),
  providerStartedAt: persistedAt,
  rawPersistedAt: persistedAt,
  httpStatus: status,
  rawResponse: body,
  rawDigest: digest(body),
  parseResult: "PENDING",
  validationErrors: [],
  validationCompletedAt: null,
});

const writeAtomic = (path: string, value: unknown) => {
  const temporary = `${path}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(temporary, path);
};

const responseText = (value: any) => value?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text ?? "").join("") ?? "";

const main = async () => {
  const input = JSON.parse(readFileSync(0, "utf8")) as Input;
  const apiKey = process.env.GEMINI_API_KEY ?? "";
  if (!apiKey) throw new Error("GEMINI_API_KEY_REQUIRED");
  const payload = {
    conversationTurns: input.conversationTurns,
    immutablePrimaryCandidate: input.candidateState,
    deterministicFindings: input.deterministicFindings,
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  let response: Response;
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(input.model)}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: `${SCIENTIFIC_SEMANTIC_RECONSTRUCTION_PROMPT}\n\n${auditInstructions}` }] },
        contents: [{ role: "user", parts: [{ text: JSON.stringify(payload) }] }],
        generationConfig: { responseMimeType: "application/json", responseJsonSchema: auditSchema },
      }),
      signal: controller.signal,
    });
  } catch (caught) {
    clearTimeout(timeout);
    const body = { networkException: caught instanceof Error ? caught.message : String(caught) };
    const persistedAt = now();
    writeAtomic(input.rawPath, rawRecord(input, body, 0, persistedAt));
    process.stdout.write(`${JSON.stringify({ status: "NETWORK_FAILURE", rawOutputRef: input.rawPath, error: body.networkException })}\n`);
    return;
  }
  clearTimeout(timeout);
  const body = await response.json().catch(() => ({ invalidJsonResponseBody: true }));
  const persistedAt = now();
  const record = rawRecord(input, body, response.status, persistedAt);
  writeAtomic(input.rawPath, record);
  if (!response.ok) {
    process.stdout.write(`${JSON.stringify({ status: "HTTP_FAILURE", httpStatus: response.status, rawOutputRef: input.rawPath, error: body })}\n`);
    return;
  }
  const text = responseText(body);
  try {
    const parsed = JSON.parse(text);
    writeAtomic(input.rawPath, { ...record, parseResult: "JSON_PARSED_PENDING_SCHEMA", validationCompletedAt: now() });
    process.stdout.write(`${JSON.stringify({ status: "SUCCESS", rawOutputRef: input.rawPath, parsed })}\n`);
  } catch (caught) {
    writeAtomic(input.rawPath, {
      ...record,
      parseResult: "PARSING_FAILURE",
      validationErrors: [{ errorType: "JSON_PARSE", message: caught instanceof Error ? caught.message : String(caught) }],
      validationCompletedAt: now(),
    });
    process.stdout.write(`${JSON.stringify({ status: "PARSING_FAILURE", rawOutputRef: input.rawPath, error: String(caught) })}\n`);
  }
};

void main().catch((caught) => {
  process.stderr.write(`${caught instanceof Error ? caught.stack ?? caught.message : String(caught)}\n`);
  process.exitCode = 1;
});
