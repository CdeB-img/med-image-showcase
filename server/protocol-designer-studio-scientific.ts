import { logicalDigest } from "../src/features/knowledge-engine/canonical.js";
import { createStudioReconciliationRequest } from "../src/features/document-projection/studio-reconciliation.js";
import type { StudioReconciliationRequest } from "../src/features/document-projection/studio-reconciliation-contract.js";
import type { ResearchProjectOwnerProjection } from "../src/features/research-project-construction/contribution-owner-boundary.js";
import type { DocumentArchiveAccess, DocumentArchiveStore } from "./protocol-designer-document-archive.js";
import { studioPreparationReference } from "../src/features/protocol-designer/studio-preparation-transport.js";
import type { StudioFinalizationIntent } from "../src/features/document-projection/studio-finalization-intent.js";

/** Verify the durable checkpoint before exposing its native request to either
 * admission or recovery. The authorized intent owner resolves the exact save. */
export const studioIntentPreparationRequest = (intent: StudioFinalizationIntent, access: DocumentArchiveAccess) => {
  const cp = intent.resolution.preparation?.checkpoint;
  const source = cp?.request.studioPreparationSource;
  if (intent.state !== "SCIENTIFIC_PREPARATION_REQUIRED" || !cp || !source || !intent.resolution.assessment
    || cp.sessionId !== access.identity.sessionId || cp.projectId !== access.project.projectId
    || cp.preparationId !== cp.request.observabilityContext?.clientRequestId
    || cp.request.observabilityContext?.sessionId !== cp.sessionId
    || cp.requestDigest !== logicalDigest(cp.request)
    || source.finalizationIntentId !== intent.finalizationIntentId
    || logicalDigest(source.request) !== logicalDigest(intent.frozen.scientificSources.request)
    || logicalDigest(source.assessment) !== logicalDigest(intent.resolution.assessment))
    throw new Error("STUDIO_PREPARATION_REFERENCE_INVALID");
  return cp.request;
};

/** Lossless resolution, not projection/summarization. No caller-supplied
 * scientific field can override the existing durable checkpoint. */
export const resolveStudioPreparationTransport = async (archive: DocumentArchiveStore, access: DocumentArchiveAccess,
  project: ResearchProjectOwnerProjection, body: Record<string, unknown>) => {
  if (Object.keys(body).sort().join(",") !== "apiVersion,currentProject,observabilityContext,studioPreparationRef"
    || body.apiVersion !== "1.0.0" || !archive.finalizationIntents
    || !body.studioPreparationRef || typeof body.studioPreparationRef !== "object")
    throw new Error("STUDIO_PREPARATION_REFERENCE_INVALID");
  const ref = body.studioPreparationRef as Record<string, unknown>;
  if (Object.keys(ref).sort().join(",") !== "contract,finalizationIntentId,preparationId,requestDigest"
    || typeof ref.finalizationIntentId !== "string") throw new Error("STUDIO_PREPARATION_REFERENCE_INVALID");
  const intent = await archive.finalizationIntents.get(access, ref.finalizationIntentId);
  const native = studioIntentPreparationRequest(intent, access);
  if (logicalDigest(ref) !== logicalDigest(studioPreparationReference(native))
    || logicalDigest(body.observabilityContext) !== logicalDigest(native.observabilityContext)
    || logicalDigest(project) !== logicalDigest(native.currentProject)) throw new Error("STUDIO_PREPARATION_REFERENCE_STALE");
  return structuredClone(native);
};

/** DOC verifies saved native bytes/anchors, not their scientific meaning. */
export const verifySavedStudioScientificSource = async (archive: DocumentArchiveStore, access: DocumentArchiveAccess,
  project: ResearchProjectOwnerProjection, request: StudioReconciliationRequest, finalizationIntentId?: string) => {
  if (!archive.workingRevisions) throw new Error("DOC_REVISION_UNAVAILABLE");
  if (finalizationIntentId) {
    if (!archive.finalizationIntents) throw new Error("STUDIO_INTENT_UNAVAILABLE");
    const intent = await archive.finalizationIntents.get(access, finalizationIntentId);
    if (intent.state === "BLOCKED" || logicalDigest(intent.frozen.scientificSources.request) !== logicalDigest(request))
      throw new Error("STUDIO_INTENT_SOURCE_INVALID");
  }
  const { revision } = finalizationIntentId
    ? await archive.workingRevisions.getSave(access, { revisionId: request.workingRevisionId,
      saveSequence: request.workingRevisionSaveSequence, contentDigest: request.workingRevisionContentDigest })
    : await archive.workingRevisions.get(access, request.workingRevisionId);
  const source = await archive.body(access, revision.baseGenerationId);
  const projectionSource = source.body.native.family === "DRCI"
    ? await archive.body(access, source.body.native.value.protocolProjectionId) : undefined;
  const expected = await createStudioReconciliationRequest({ revision, source, projectionSource, currentProject: project,
    scientificState: request.scientificState });
  if (logicalDigest(expected) !== logicalDigest(request)) throw new Error("STUDIO_RECONCILIATION_STALE");
};
