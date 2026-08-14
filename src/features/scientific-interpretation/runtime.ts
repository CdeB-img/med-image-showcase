import { compareScientificInterpretationContributions, type ScientificInterpretationShadowComparison } from "./shadow-comparison";
import {
  DEFAULT_SCIENTIFIC_INTERPRETATION_MODE,
  ScientificInterpretationTechnicalError,
  type AuthorizedScientificInterpretationContext,
  type ScientificInterpretationContributionEnvelope,
  type ScientificInterpretationConversation,
  type ScientificInterpretationMode,
  type ScientificInterpretationRuntime,
} from "./contracts";

export type ScientificInterpretationExecution = {
  mode: ScientificInterpretationMode;
  activeContribution: ScientificInterpretationContributionEnvelope;
  shadowContribution: ScientificInterpretationContributionEnvelope | null;
  comparison: ScientificInterpretationShadowComparison | null;
  fallbackUsed: boolean;
  projectWrites: 0;
  uiStateMutatedByShadow: false;
  diagnostics: string[];
};

const technicalFallbackEligible = (error: unknown) => error instanceof ScientificInterpretationTechnicalError
  && ["PROVIDER_FAILURE", "TRANSPORT_FAILURE", "RAW_PERSISTENCE_FAILURE", "PARSING_FAILURE", "SCHEMA_FAILURE", "CONTRIBUTION_MAPPING_FAILURE"].includes(error.failureClass);

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
    const activeContribution = await input.legacyRuntime.interpret(input.conversation, input.previousState, input.authorizedContext);
    return { mode, activeContribution, shadowContribution: null, comparison: null, fallbackUsed: false, projectWrites: 0, uiStateMutatedByShadow: false, diagnostics: [] };
  }
  if (!input.hybridRuntime) throw new ScientificInterpretationTechnicalError("CONTRIBUTION_MAPPING_FAILURE", "HYBRID_RUNTIME_REQUIRED");
  if (mode === "HYBRID_SHADOW") {
    const activeContribution = await input.legacyRuntime.interpret(input.conversation, input.previousState, input.authorizedContext);
    try {
      const shadowContribution = await input.hybridRuntime.interpret(input.conversation, input.previousState, input.authorizedContext);
      return { mode, activeContribution, shadowContribution, comparison: compareScientificInterpretationContributions(activeContribution, shadowContribution), fallbackUsed: false, projectWrites: 0, uiStateMutatedByShadow: false, diagnostics: [] };
    } catch (error) {
      return { mode, activeContribution, shadowContribution: null, comparison: null, fallbackUsed: false, projectWrites: 0, uiStateMutatedByShadow: false, diagnostics: [error instanceof Error ? error.message : "HYBRID_SHADOW_FAILURE"] };
    }
  }
  try {
    const activeContribution = await input.hybridRuntime.interpret(input.conversation, input.previousState, input.authorizedContext);
    return { mode, activeContribution, shadowContribution: null, comparison: null, fallbackUsed: false, projectWrites: 0, uiStateMutatedByShadow: false, diagnostics: [] };
  } catch (error) {
    if (!technicalFallbackEligible(error)) throw error;
    const activeContribution = await input.legacyRuntime.interpret(input.conversation, input.previousState, input.authorizedContext);
    return { mode, activeContribution, shadowContribution: null, comparison: null, fallbackUsed: true, projectWrites: 0, uiStateMutatedByShadow: false, diagnostics: [error instanceof Error ? error.message : "HYBRID_TECHNICAL_FAILURE"] };
  }
};
