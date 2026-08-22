import {
  SEMANTIC_CRITIC_API_VERSION,
  isSemanticCriticApiResponse,
  type SemanticCriticApiRequest,
  type SemanticCriticApiResponse,
} from "./semantic-critic-transport";

export const requestSemanticCritic = async (
  request: Omit<SemanticCriticApiRequest, "apiVersion">,
): Promise<SemanticCriticApiResponse> => {
  const response = await fetch("/api/scientific-interpretation-critic", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...request, apiVersion: SEMANTIC_CRITIC_API_VERSION }),
    credentials: "same-origin",
  });
  const value = await response.json().catch(() => null);
  if (!response.ok || !isSemanticCriticApiResponse(value)) throw new Error(value?.error?.message ?? "SEMANTIC_CRITIC_INVALID_RESPONSE");
  return value;
};
