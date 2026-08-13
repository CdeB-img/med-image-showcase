import { SCIENTIFIC_SEMANTIC_SCHEMA_VERSION, type SemanticReconstructionRequest, type SemanticReconstructionResponse } from "./types";

export class SemanticClientError extends Error {
  constructor(public readonly code: string, message: string) { super(message); }
}

export const requestSemanticReconstruction = async (request: Omit<SemanticReconstructionRequest, "schemaVersion">): Promise<SemanticReconstructionResponse> => {
  const response = await fetch("/api/scientific-semantic", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...request, schemaVersion: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION }),
    credentials: "same-origin",
  });
  const value = await response.json().catch(() => null);
  if (!response.ok) throw new SemanticClientError(value?.error?.code ?? "API_UNAVAILABLE", value?.error?.message ?? "Reconstruction sémantique indisponible.");
  if (!value?.model || !["LIVE_LLM", "DEGRADED"].includes(value.mode)) throw new SemanticClientError("INVALID_PROVIDER_RESPONSE", "Réponse sémantique invalide.");
  return value as SemanticReconstructionResponse;
};
