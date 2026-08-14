import { canonicalizeSemanticReconstruction, createDegradedSemanticModel } from "../src/features/scientific-semantic-reconstruction/canonical.js";
import { runSemanticCriticCycles } from "../src/features/scientific-semantic-reconstruction/coverage.js";
import { GeminiScientificSemanticProvider } from "../src/features/scientific-semantic-reconstruction/provider.js";
import { legacySemanticModelToContribution } from "../src/features/scientific-interpretation/legacy-adapter.js";
import type { ScientificInterpretationConversation } from "../src/features/scientific-interpretation/contracts.js";
import { SCIENTIFIC_SEMANTIC_SCHEMA_VERSION, type SemanticReconstructionRequest } from "../src/features/scientific-semantic-reconstruction/types.js";

export const executeLegacySemRollback = async (input: {
  conversation: ScientificInterpretationConversation;
  apiKey: string | null;
  model: string | null;
}) => {
  const request: SemanticReconstructionRequest = {
    schemaVersion: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
    sessionId: input.conversation.conversationId,
    language: input.conversation.language,
    messages: input.conversation.turns.map((turn) => ({
      messageId: turn.turnId,
      role: turn.role,
      content: turn.content,
      createdAt: turn.createdAt ?? new Date().toISOString(),
    })),
    previousModel: null,
  };
  if (!input.apiKey || !input.model) return legacySemanticModelToContribution(createDegradedSemanticModel(request));
  try {
    const provider = new GeminiScientificSemanticProvider({ apiKey: input.apiKey, model: input.model, maxAttempts: 2 });
    const reconstruction = await provider.reconstruct(request);
    const critique = await runSemanticCriticCycles(provider, request, reconstruction.candidate);
    const critic = critique.critics.at(-1);
    const criticCallId = critique.callIds.at(-1);
    if (!critic || !criticCallId) return legacySemanticModelToContribution(createDegradedSemanticModel(request));
    return legacySemanticModelToContribution(canonicalizeSemanticReconstruction({
      request,
      candidate: critique.candidate,
      critic,
      metadata: provider.metadata,
      reconstructionCallId: reconstruction.callId,
      criticCallId,
      criticCallIds: critique.callIds,
      critics: critique.critics,
      reconstructionAttempts: reconstruction.attempts,
      criticAttempts: critique.attempts,
    }));
  } catch {
    return legacySemanticModelToContribution(createDegradedSemanticModel(request));
  }
};
