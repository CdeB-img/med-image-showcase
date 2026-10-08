import { assertStudioIntent, StudioFinalizationIntentError, type StudioFinalizationIntent,
  type StudioFinalizationFrozenInput, type StudioFinalizationHumanDecision } from "./studio-finalization-intent.js";
import type { StudioScientificAssessment } from "../scientific-thinking/studio-contribution.js";
import type { WorkingDraftPreparation } from "../protocol-designer/functional-reset/project-preparation-contract.js";
import type { StudioPreparationEvidence } from "../protocol-designer/studio-preparation-transport.js";

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
    readPreparation: async (intentId: string): Promise<StudioPreparationEvidence> => {
      const evidence = await operation<StudioPreparationEvidence>({ operation: "DOC_ARCHIVE_STUDIO_INTENT_READ_PREPARATION", intentId });
      if (!evidence || !["NOT_FOUND", "IN_PROGRESS", "UNKNOWN", "FAILED", "COMPLETED"].includes(evidence.state)
        || evidence.state === "COMPLETED" && !evidence.response?.workingDraftUpdate)
        throw new StudioFinalizationIntentError("STUDIO_INTENT_PREPARATION_RESULT_INVALID", 503);
      return evidence;
    },
    recoverActive: async (revisionId: string) => {
      const intent = await operation<StudioFinalizationIntent | null>({ operation: "DOC_ARCHIVE_STUDIO_INTENT_RECOVER_ACTIVE", revisionId });
      if (intent && (assertStudioIntent(intent).frozen.workingRevisionId !== revisionId || intent.frozen.sourceProject.projectId !== projectId))
        throw new StudioFinalizationIntentError("STUDIO_INTENT_RESPONSE_INVALID", 503);
      return intent;
    },
    recoverForBase: async (baseGenerationId: string, logicalDocumentRef: string) => {
      const intent = await operation<StudioFinalizationIntent | null>({ operation: "DOC_ARCHIVE_STUDIO_INTENT_RECOVER_BASE", baseGenerationId, logicalDocumentRef });
      if (intent && (assertStudioIntent(intent).frozen.baseGenerationId !== baseGenerationId
        || intent.frozen.logicalDocumentRef !== logicalDocumentRef || intent.frozen.sourceProject.projectId !== projectId))
        throw new StudioFinalizationIntentError("STUDIO_INTENT_RESPONSE_INVALID", 503);
      return intent;
    },
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
    recordHumanDecision: (intentId: string, expectedSequence: number, decision: StudioFinalizationHumanDecision) => execute({ operation: "DOC_ARCHIVE_STUDIO_INTENT_DECISION", intentId, expectedSequence, decision }),
    prepareDocuments: (intentId: string, expectedSequence: number, source: import("./drci-draft-contract.js").DrciDraftSource) =>
      execute({ operation: "DOC_ARCHIVE_STUDIO_INTENT_DOCUMENTS", intentId, expectedSequence, source }),
    finalizeDocuments: (intentId: string) => execute({ operation: "DOC_ARCHIVE_STUDIO_INTENT_FINALIZE", intentId }),
    retryDocuments: (intentId: string, expectedSequence: number) => execute({ operation: "DOC_ARCHIVE_STUDIO_INTENT_RETRY_DOCUMENTS", intentId, expectedSequence }),
  };
};
