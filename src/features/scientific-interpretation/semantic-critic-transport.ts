import type { ScientificInterpretationContributionEnvelope } from "./contracts.js";
import type { SemanticCriticCandidateSnapshot, SemanticCriticGroundingContext, SemanticCriticResult } from "./semantic-critic.js";

export const SEMANTIC_CRITIC_API_VERSION = "1.0.0" as const;

export type SemanticCriticApiRequest = {
  apiVersion: typeof SEMANTIC_CRITIC_API_VERSION;
  contribution: ScientificInterpretationContributionEnvelope;
  groundingContext: SemanticCriticGroundingContext;
  candidate: SemanticCriticCandidateSnapshot;
};

export type SemanticCriticApiResponse = {
  apiVersion: typeof SEMANTIC_CRITIC_API_VERSION;
  critic: SemanticCriticResult;
  providerAttempts: number;
  retries: number;
  invalidStructuredOutputs: number;
};

export const parseSemanticCriticApiRequest = (value: unknown): SemanticCriticApiRequest | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const contribution = record.contribution as Record<string, unknown> | undefined;
  const contributionSource = contribution?.source as Record<string, unknown> | undefined;
  const groundingContext = record.groundingContext as Record<string, unknown> | undefined;
  const rawUserMessage = groundingContext?.rawUserMessage as Record<string, unknown> | undefined;
  const candidate = record.candidate as Record<string, unknown> | undefined;
  if (record.apiVersion !== SEMANTIC_CRITIC_API_VERSION
    || contribution?.contract !== "SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ENVELOPE"
    || !contribution.cognitiveBoundary
    || groundingContext?.lifecycle !== "EPHEMERAL_TRACEABLE_NON_AUTHORITATIVE"
    || rawUserMessage?.role !== "USER"
    || typeof rawUserMessage.turnId !== "string"
    || typeof rawUserMessage.content !== "string"
    || !Array.isArray(groundingContext.relevantConversationTurns)
    || !groundingContext.relevantConversationTurns.some((turn) => {
      if (!turn || typeof turn !== "object") return false;
      const item = turn as Record<string, unknown>;
      return item.turnId === rawUserMessage.turnId && item.role === "USER" && item.content === rawUserMessage.content;
    })
    || !Array.isArray(contributionSource?.turns)
    || !contributionSource.turns.some((turn) => {
      if (!turn || typeof turn !== "object") return false;
      const item = turn as Record<string, unknown>;
      return item.turnId === rawUserMessage.turnId && item.role === "USER" && item.content === rawUserMessage.content;
    })
    || typeof candidate?.candidateRef !== "string"
    || typeof candidate.candidateDigest !== "string"
    || !Array.isArray(candidate.changes)
    || candidate.projectWriteAuthorized !== false) return null;
  return value as SemanticCriticApiRequest;
};

export const isSemanticCriticApiResponse = (value: unknown): value is SemanticCriticApiResponse => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const critic = record.critic as Record<string, unknown> | undefined;
  return record.apiVersion === SEMANTIC_CRITIC_API_VERSION
    && critic?.contract === "NOXIA_SEMANTIC_INTEGRATION_CRITIC"
    && ["FAITHFUL", "FAILED", "SEMANTIC_CRITIC_UNAVAILABLE"].includes(String(critic.status))
    && critic.authoritative === false;
};
