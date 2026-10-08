import { assertStudioIntent, StudioFinalizationIntentError, type StudioFinalizationIntent,
  type StudioFinalizationFrozenInput, type StudioFinalizationHumanDecision } from "./studio-finalization-intent.js";
import type { StudioScientificAssessment } from "../scientific-thinking/studio-contribution.js";
import type { WorkingDraftPreparation } from "../protocol-designer/functional-reset/project-preparation-contract.js";

export const createStudioFinalizationIntentClient = (operation: <T>(command: Record<string, unknown>) => Promise<T>, projectId: string) => {
  const execute = async (command: Record<string, unknown>) => {
    const intent = assertStudioIntent(await operation<StudioFinalizationIntent>(command));
    if (intent.frozen.sourceProject.projectId !== projectId || command.intentId && command.intentId !== intent.finalizationIntentId)
      throw new StudioFinalizationIntentError("STUDIO_INTENT_RESPONSE_INVALID", 503);
    return intent;
  };
  return {
    create: (frozen: StudioFinalizationFrozenInput) => execute({ operation: "DOC_ARCHIVE_STUDIO_INTENT_CREATE", frozen }),
    get: (intentId: string) => execute({ operation: "DOC_ARCHIVE_STUDIO_INTENT_GET", intentId }),
    recoverForSave: async (save: Readonly<{ revisionId: string; saveSequence: number; contentDigest: string }>) => {
      const intent = await operation<StudioFinalizationIntent | null>({ operation: "DOC_ARCHIVE_STUDIO_INTENT_RECOVER_SAVE", ...save });
      if (!intent) return null;
      assertStudioIntent(intent);
      if (intent.frozen.sourceProject.projectId !== projectId || intent.frozen.workingRevisionId !== save.revisionId
        || intent.frozen.workingRevisionSaveSequence !== save.saveSequence || intent.frozen.workingRevisionContentDigest !== save.contentDigest)
        throw new StudioFinalizationIntentError("STUDIO_INTENT_RESPONSE_INVALID", 503);
      return intent;
    },
    waitForAssessment: (intentId: string, expectedSequence: number) => execute({ operation: "DOC_ARCHIVE_STUDIO_INTENT_WAIT", intentId, expectedSequence }),
    assess: (intentId: string, expectedSequence: number, assessment: StudioScientificAssessment) => execute({ operation: "DOC_ARCHIVE_STUDIO_INTENT_ASSESS", intentId, expectedSequence, assessment }),
    linkPreparation: (intentId: string, expectedSequence: number, preparation: WorkingDraftPreparation) => execute({ operation: "DOC_ARCHIVE_STUDIO_INTENT_PREPARATION", intentId, expectedSequence, preparation }),
    resolveAdoption: (intentId: string, expectedSequence: number, decision: StudioFinalizationHumanDecision) => execute({ operation: "DOC_ARCHIVE_STUDIO_INTENT_ADOPTION", intentId, expectedSequence, decision }),
  };
};
