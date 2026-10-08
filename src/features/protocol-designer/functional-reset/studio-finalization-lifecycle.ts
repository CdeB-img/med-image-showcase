/** Coordination through native DOC/ST/preparation/PRJ owners. No React state,
 * UI command, provider dispatch or generation writer is present here. */
import { logicalDigest } from "../../knowledge-engine/canonical";
import { freezeScientificPreparationSources } from "../../scientific-thinking/preparation-source-set";
import { createStudioReconciliationRequest } from "../../document-projection/studio-reconciliation";
import { assertStudioIntentSave, createStudioIntentHumanDecision, type StudioFinalizationIntent,
  type StudioFinalizationFrozenInput, type StudioFinalizationHumanDecision } from "../../document-projection/studio-finalization-intent";
import type { DocumentWorkingRevision } from "../../document-projection/working-revision";
import type { DocumentGenerationBody, DocumentGenerationRef } from "../../document-projection/generation-persistence";
import { captureStudioScientificState } from "./studio-scientific-context";
import { buildScientificDiscussionContext } from "./contribution-discussion-context";
import { captureStudioProjectPreparation, preparationCheckpointValid } from "./project-preparation-lifecycle";
import { sourceBackedVersionSelection } from "./useVersionProduction";
import { stageProjectConfirmation } from "./project-review-decision";
import type { FunctionalResetSession } from "./session";

export const freezeStudioFinalizationWork = async (input: {
  session: FunctionalResetSession; revision: DocumentWorkingRevision;
  source: { ref: DocumentGenerationRef; body: DocumentGenerationBody };
  projectionSource?: { ref: DocumentGenerationRef; body: DocumentGenerationBody };
}): Promise<StudioFinalizationFrozenInput> => {
  const { session, revision } = input;
  if (!session.project) throw new Error("STUDIO_PREPARATION_PROJECT_REQUIRED");
  const scientificState = captureStudioScientificState(session);
  const request = await createStudioReconciliationRequest({ ...input, currentProject: session.project, scientificState });
  const discussion = buildScientificDiscussionContext({ retained: session.retainedContributionCandidates ?? [], retention: session.scientificDiscussionRetention,
      studyProposal: session.studyProposal, currentProject: session.project, conversationId: session.conversationId,
      runtimeTurns: session.runtimeTurns });
  return { workingRevisionId: revision.revisionId, workingRevisionSaveSequence: revision.saveSequence,
    workingRevisionContentDigest: revision.contentDigest, logicalDocumentRef: revision.logicalDocumentRef,
    baseGenerationId: revision.baseGenerationId, baseGenerationBodyDigest: revision.baseGenerationBodyDigest, baseProject: revision.project,
    sourceProject: { projectId: session.project.projectId, projectVersion: session.project.versionId, projectDigest: session.project.projectDigest },
    scientificSources: freezeScientificPreparationSources({ project: session.project, request, discussion, proposal: session.studyProposal }),
    preparationContext: { conversation: session.runtimeTurns.map(turn => ({ turnId: turn.turnId, digest: logicalDigest(turn) })),
      previousDraft: structuredClone(session.workingDraft ?? null) } };
};
export const captureStudioIntentPreparation = (intent: StudioFinalizationIntent, session: FunctionalResetSession,
  historicalSave: DocumentWorkingRevision, now = new Date().toISOString()) => {
  assertStudioIntentSave(intent, historicalSave);
  if (!intent.resolution.assessment || intent.state !== "SCIENTIFIC_PREPARATION_REQUIRED"
    && intent.state !== "WAITING_FOR_HUMAN_DECISION") throw new Error("STUDIO_INTENT_PREPARATION_NOT_REQUIRED");
  const source = { request: intent.frozen.scientificSources.request, assessment: intent.resolution.assessment,
    finalizationIntentId: intent.finalizationIntentId };
  return captureStudioProjectPreparation(session, source, historicalSave, now, {
    sources: intent.frozen.scientificSources, ...intent.frozen.preparationContext });
};
export const studioIntentAdoptionSelection = (intent: StudioFinalizationIntent, session: FunctionalResetSession) => {
  const preparation = intent.resolution.preparation;
  if (!preparation?.result) throw new Error("STUDIO_INTENT_PREPARATION_NOT_READY");
  return sourceBackedVersionSelection(session, preparation);
};
/** Reattach a durable, already qualified native checkpoint, never redispatch it.
 * Late scientific/session state is kept; only this checkpoint slot is restored. */
export const restoreStudioIntentPreparation = (intent: StudioFinalizationIntent, session: FunctionalResetSession): FunctionalResetSession => {
  const preparation = intent.resolution.preparation;
  if (!preparation?.checkpoint) return session;
  if (!preparationCheckpointValid(session, preparation.checkpoint)) throw new Error("STUDIO_INTENT_PREPARATION_STALE");
  const existing = session.workingDraftPreparations?.find(p => p.checkpoint?.preparationId === preparation.checkpoint!.preparationId);
  if (existing && logicalDigest(existing) !== logicalDigest(preparation)) throw new Error("STUDIO_INTENT_PREPARATION_DIVERGENCE");
  return existing ? session : { ...session, workingDraftPreparations: [...session.workingDraftPreparations ?? [], preparation] };
};
export const prepareStudioIntentHumanDecision = (intent: StudioFinalizationIntent, session: FunctionalResetSession) => {
  const chosen = studioIntentAdoptionSelection(intent, session);
  if ("clarification" in chosen) throw new Error("STUDIO_INTENT_ADDITIONAL_HUMAN_DECISION_REQUIRED");
  return createStudioIntentHumanDecision(intent, session.projectAuthority.actorRef, chosen.selection.contribution.identity.contributionDigest);
};
/** The caller supplies an explicit native human decision; assessment alone
 * cannot call this path. Persistence stays in persistAdoptedProjectSession. */
export const stageStudioIntentAdoption = (input: {
  intent: StudioFinalizationIntent; decision: StudioFinalizationHumanDecision; session: FunctionalResetSession;
  readCurrentSession(): FunctionalResetSession; now: string;
  administration: Parameters<typeof stageProjectConfirmation>[0]["administration"];
}) => {
  const chosen = studioIntentAdoptionSelection(input.intent, input.session);
  if ("clarification" in chosen) throw new Error("STUDIO_INTENT_ADDITIONAL_HUMAN_DECISION_REQUIRED");
  return stageProjectConfirmation({ ...input, contributionId: chosen.selection.contribution.identity.contributionId,
    contribution: chosen.selection.contribution, proposalSelection: chosen.selection,
    studioDecision: { intent: input.intent, decision: input.decision } });
};
