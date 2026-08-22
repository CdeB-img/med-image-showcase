import { join } from "node:path";
import { FileScientificInterpretationEvidenceStore } from "./scientific-interpretation-evidence-store.js";
import { GeminiSemanticCriticProvider } from "./scientific-interpretation-provider.js";
import {
  buildSemanticCriticResult,
  parseSemanticCriticProviderOutput,
  semanticCriticUnavailable,
} from "../src/features/scientific-interpretation/semantic-critic.js";
import {
  SEMANTIC_CRITIC_API_VERSION,
  parseSemanticCriticApiRequest,
  type SemanticCriticApiResponse,
} from "../src/features/scientific-interpretation/semantic-critic-transport.js";

type ApiRequest = { method?: string; body?: unknown };
type ApiResponse = { status(code: number): ApiResponse; setHeader(name: string, value: string): void; json(value: unknown): void };

const send = (response: ApiResponse, body: SemanticCriticApiResponse) => {
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.status(200).json(body);
};

export const handleScientificInterpretationCritic = async (request: ApiRequest, response: ApiResponse) => {
  if (request.method !== "POST") {
    response.status(405).json({ error: { code: "METHOD_NOT_ALLOWED", message: "Méthode non autorisée." } });
    return;
  }
  const parsed = parseSemanticCriticApiRequest(request.body);
  if (!parsed) {
    response.status(400).json({ error: { code: "INVALID_REQUEST", message: "Contrat Semantic Critic invalide." } });
    return;
  }
  const apiKey = process.env.GEMINI_API_KEY?.trim() ?? "";
  const model = process.env.GEMINI_MODEL?.trim() ?? "";
  if (!apiKey || !model) {
    send(response, {
      apiVersion: SEMANTIC_CRITIC_API_VERSION,
      critic: semanticCriticUnavailable({ contribution: parsed.contribution, groundingContext: parsed.groundingContext, candidate: parsed.candidate, message: "SEMANTIC_CRITIC_PROVIDER_CONFIGURATION_MISSING" }),
      providerAttempts: 0,
      retries: 0,
      invalidStructuredOutputs: 0,
    });
    return;
  }
  const store = new FileScientificInterpretationEvidenceStore(process.env.SCIENTIFIC_INTERPRETATION_EVIDENCE_DIR?.trim() || join("/tmp", "noxia-scientific-interpretation"));
  try {
    const execution = await new GeminiSemanticCriticProvider({ apiKey, model, maxAttempts: 2 }).execute({ contribution: parsed.contribution, groundingContext: parsed.groundingContext, candidate: parsed.candidate });
    const raw = await store.persistAtomically({ operationId: execution.operationId, payload: execution.rawOutput });
    const retries = execution.attempts.filter((attempt) => attempt.outcome === "FAILED" && attempt.retryable).length;
    if (execution.technicalFailure) {
      send(response, {
        apiVersion: SEMANTIC_CRITIC_API_VERSION,
        critic: semanticCriticUnavailable({ contribution: parsed.contribution, groundingContext: parsed.groundingContext, candidate: parsed.candidate, message: execution.technicalFailure }),
        providerAttempts: execution.attempts.length,
        retries,
        invalidStructuredOutputs: 0,
      });
      return;
    }
    try {
      const providerResult = parseSemanticCriticProviderOutput(execution.rawOutput);
      send(response, {
        apiVersion: SEMANTIC_CRITIC_API_VERSION,
        critic: buildSemanticCriticResult({
          contribution: parsed.contribution,
          groundingContext: parsed.groundingContext,
          candidate: parsed.candidate,
          providerResult,
          provider: execution.provider,
          model: execution.model,
          rawOutputRef: raw.rawOutputRef,
        }),
        providerAttempts: execution.attempts.length,
        retries,
        invalidStructuredOutputs: 0,
      });
    } catch (error) {
      send(response, {
        apiVersion: SEMANTIC_CRITIC_API_VERSION,
        critic: semanticCriticUnavailable({ contribution: parsed.contribution, groundingContext: parsed.groundingContext, candidate: parsed.candidate, message: error instanceof Error ? error.message : "SEMANTIC_CRITIC_STRUCTURED_OUTPUT_INVALID" }),
        providerAttempts: execution.attempts.length,
        retries,
        invalidStructuredOutputs: 1,
      });
    }
  } catch (error) {
    send(response, {
      apiVersion: SEMANTIC_CRITIC_API_VERSION,
      critic: semanticCriticUnavailable({ contribution: parsed.contribution, groundingContext: parsed.groundingContext, candidate: parsed.candidate, message: error instanceof Error ? error.message : "SEMANTIC_CRITIC_UNAVAILABLE" }),
      providerAttempts: 0,
      retries: 0,
      invalidStructuredOutputs: 0,
    });
  }
};

export default handleScientificInterpretationCritic;
