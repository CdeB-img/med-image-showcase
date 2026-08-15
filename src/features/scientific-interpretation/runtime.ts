import { compareScientificInterpretationContributions, type ScientificInterpretationShadowComparison } from "./shadow-comparison.js";
import { canonicalizeScientificContribution } from "./canonical.js";
import {
  DEFAULT_SCIENTIFIC_INTERPRETATION_MODE,
  ScientificInterpretationTechnicalError,
  type AuthorizedScientificInterpretationContext,
  type ScientificInterpretationContributionEnvelope,
  type ScientificInterpretationConversation,
  type ScientificInterpretationMode,
  type ScientificInterpretationRuntime,
} from "./contracts.js";

export type ScientificInterpretationExecution = {
  mode: ScientificInterpretationMode;
  activeContribution: ScientificInterpretationContributionEnvelope;
  shadowContribution: ScientificInterpretationContributionEnvelope | null;
  comparison: ScientificInterpretationShadowComparison | null;
  fallbackUsed: boolean;
  fallback: {
    failureClass: "PROVIDER_FAILURE" | "TRANSPORT_FAILURE" | "PARSING_FAILURE" | "STRUCTURED_CONTRACT_FAILURE" | "HYBRID_RUNTIME_UNAVAILABLE";
    message: string;
    rawOutputRef: string | null;
    operationId: string | null;
  } | null;
  projectWrites: 0;
  uiStateMutatedByShadow: false;
  diagnostics: string[];
};

const technicalFallbackEligible = (error: unknown) => error instanceof ScientificInterpretationTechnicalError
  && ["PROVIDER_FAILURE", "TRANSPORT_FAILURE", "PARSING_FAILURE", "STRUCTURED_CONTRACT_FAILURE", "HYBRID_RUNTIME_UNAVAILABLE"].includes(error.failureClass);

const noFallback = {
  fallbackUsed: false as const,
  fallback: null,
  projectWrites: 0 as const,
  uiStateMutatedByShadow: false as const,
};

export const applyScientificInterpretationInteractionBoundary = (
  contribution: ScientificInterpretationContributionEnvelope,
  previousState: ScientificInterpretationContributionEnvelope | null | undefined,
  conversation: ScientificInterpretationConversation,
): ScientificInterpretationContributionEnvelope => {
  if (conversation.interactionContext?.expectedResponseKind !== "ROUTE_INTENT" || !previousState) return contribution;
  const { contributionDigest: _contributionDigest, ...identity } = contribution.identity;
  return canonicalizeScientificContribution({
    ...structuredClone(contribution),
    identity,
    scientificContent: {
      ...structuredClone(previousState.scientificContent),
      routeProposal: contribution.scientificContent.routeProposal,
    },
    epistemicBoundary: structuredClone(previousState.epistemicBoundary),
    mapping: structuredClone(previousState.mapping),
    audit: structuredClone(previousState.audit),
    decisionBoundary: structuredClone(previousState.decisionBoundary),
  });
};

export const executeScientificInterpretation = async (input: {
  conversation: ScientificInterpretationConversation;
  legacyRuntime: ScientificInterpretationRuntime;
  hybridRuntime?: ScientificInterpretationRuntime;
  mode?: ScientificInterpretationMode;
  previousState?: ScientificInterpretationContributionEnvelope | null;
  authorizedContext?: AuthorizedScientificInterpretationContext;
}): Promise<ScientificInterpretationExecution> => {
  const mode = input.mode ?? DEFAULT_SCIENTIFIC_INTERPRETATION_MODE;
  if (mode === "LEGACY_ACTIVE") {
    const activeContribution = applyScientificInterpretationInteractionBoundary(
      await input.legacyRuntime.interpret(input.conversation, input.previousState, input.authorizedContext),
      input.previousState,
      input.conversation,
    );
    return { mode, activeContribution, shadowContribution: null, comparison: null, ...noFallback, diagnostics: [] };
  }
  if (!input.hybridRuntime) throw new ScientificInterpretationTechnicalError("HYBRID_RUNTIME_UNAVAILABLE", "HYBRID_RUNTIME_REQUIRED");
  if (mode === "HYBRID_SHADOW") {
    const activeContribution = applyScientificInterpretationInteractionBoundary(
      await input.legacyRuntime.interpret(input.conversation, input.previousState, input.authorizedContext),
      input.previousState,
      input.conversation,
    );
    try {
      const shadowContribution = applyScientificInterpretationInteractionBoundary(
        await input.hybridRuntime.interpret(input.conversation, input.previousState, input.authorizedContext),
        input.previousState,
        input.conversation,
      );
      return { mode, activeContribution, shadowContribution, comparison: compareScientificInterpretationContributions(activeContribution, shadowContribution), ...noFallback, diagnostics: [] };
    } catch (error) {
      return { mode, activeContribution, shadowContribution: null, comparison: null, ...noFallback, diagnostics: [error instanceof Error ? error.message : "HYBRID_SHADOW_FAILURE"] };
    }
  }
  try {
    const activeContribution = applyScientificInterpretationInteractionBoundary(
      await input.hybridRuntime.interpret(input.conversation, input.previousState, input.authorizedContext),
      input.previousState,
      input.conversation,
    );
    return { mode, activeContribution, shadowContribution: null, comparison: null, ...noFallback, diagnostics: [] };
  } catch (error) {
    if (!technicalFallbackEligible(error)) throw error;
    const activeContribution = applyScientificInterpretationInteractionBoundary(
      await input.legacyRuntime.interpret(input.conversation, input.previousState, input.authorizedContext),
      input.previousState,
      input.conversation,
    );
    const technical = error as ScientificInterpretationTechnicalError;
    return {
      mode,
      activeContribution,
      shadowContribution: null,
      comparison: null,
      fallbackUsed: true,
      fallback: {
        failureClass: technical.failureClass as ScientificInterpretationExecution["fallback"] extends infer F ? F extends { failureClass: infer C } ? C : never : never,
        message: technical.message,
        rawOutputRef: technical.rawOutputRef,
        operationId: technical.operationId,
      },
      projectWrites: 0,
      uiStateMutatedByShadow: false,
      diagnostics: [technical.message],
    };
  }
};
