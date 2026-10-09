import { activeWorkingRevisionSchema, DocumentWorkingRevisionError, workingRevisionResultSchema, workingRevisionContentDigest,
  type DocumentWorkingRevisionClient, type DocumentWorkingRevisionResult } from "./working-revision.js";

/** Transport is the existing archive capability boundary, not a second fetch/auth path. */
export const createDocumentWorkingRevisionClient = (
  operation: <T>(command: Record<string, unknown>) => Promise<T>, projectId: string,
): DocumentWorkingRevisionClient => {
  const execute = async (command: Record<string, unknown>): Promise<DocumentWorkingRevisionResult> => {
    const value = await operation<unknown>(command);
    const parsed = workingRevisionResultSchema.safeParse(value);
    if (!parsed.success || command.operation !== "DOC_ARCHIVE_REVISION_OPEN" && parsed.data.revision.revisionId !== command.revisionId
      || parsed.data.revision.project.projectId !== projectId
      || parsed.data.revision.contentDigest !== workingRevisionContentDigest(parsed.data.revision.content)
      || command.operation === "DOC_ARCHIVE_REVISION_GET_SAVE" && (parsed.data.revision.saveSequence !== command.saveSequence
        || parsed.data.revision.contentDigest !== command.contentDigest)
      || parsed.data.baseState.stale !== (!parsed.data.baseState.projectCurrent || !parsed.data.baseState.generationCurrent)
      || ["DOC_ARCHIVE_REVISION_CREATE", "DOC_ARCHIVE_REVISION_OPEN"].includes(String(command.operation)) && (parsed.data.revision.baseGenerationId !== command.baseGenerationId
        || parsed.data.revision.baseGenerationBodyDigest !== command.baseGenerationBodyDigest
        || parsed.data.revision.identitySource.nativeDocumentRef !== command.nativeDocumentRef
        || parsed.data.revision.status !== "ACTIVE")
      || command.operation === "DOC_ARCHIVE_REVISION_SAVE" && (parsed.data.revision.status !== "ACTIVE"
        || parsed.data.revision.contentDigest !== workingRevisionContentDigest(command.content)
        || ![command.expectedSaveSequence, Number(command.expectedSaveSequence) + 1].includes(parsed.data.revision.saveSequence))
      || command.operation === "DOC_ARCHIVE_REVISION_ABANDON" && (parsed.data.revision.status !== "ABANDONED"
        || ![command.expectedSaveSequence, Number(command.expectedSaveSequence) + 1].includes(parsed.data.revision.saveSequence)))
      throw new DocumentWorkingRevisionError("DOC_REVISION_RESPONSE_INVALID", 503);
    return parsed.data as DocumentWorkingRevisionResult;
  };
  return {
    active: async () => {
      const value = await operation<unknown>({ operation: "DOC_ARCHIVE_REVISION_ACTIVE" });
      const parsed = activeWorkingRevisionSchema.array().max(100).safeParse(value);
      if (!parsed.success || new Set(parsed.data.map(item => item.revisionId)).size !== parsed.data.length)
        throw new DocumentWorkingRevisionError("DOC_REVISION_RESPONSE_INVALID", 503);
      return parsed.data;
    },
    open: input => execute({ operation: "DOC_ARCHIVE_REVISION_OPEN", ...input }),
    create: input => execute({ operation: "DOC_ARCHIVE_REVISION_CREATE", ...input }),
    get: revisionId => execute({ operation: "DOC_ARCHIVE_REVISION_GET", revisionId }),
    getSave: input => execute({ operation: "DOC_ARCHIVE_REVISION_GET_SAVE", ...input }),
    save: input => execute({ operation: "DOC_ARCHIVE_REVISION_SAVE", ...input }),
    abandon: input => execute({ operation: "DOC_ARCHIVE_REVISION_ABANDON", ...input }),
  };
};
