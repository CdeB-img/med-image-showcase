import { logicalDigest } from "../../knowledge-engine/canonical";
import type { StudioScientificState } from "../../document-projection/studio-reconciliation-contract";
import { preparationCheckpointValid, projectPreparationProgress, projectPreparationReview } from "./project-preparation-lifecycle";
import { assertStudyProposalCurrent } from "./study-proposal-standard";
import type { FunctionalResetSession } from "./session";

/** References/digests of native scientific state, not another persisted Project
 * or a copy of conversation prose. Open unknowns are not recomposition gates. */
export const captureStudioScientificState = (session: FunctionalResetSession): StudioScientificState => {
  const pendingTurnRef = projectPreparationProgress(session).latestPendingScientificTurnRef;
  const preparations = (session.workingDraftPreparations ?? []).flatMap(attempt => {
    const checkpoint = attempt.checkpoint;
    if (!checkpoint) return [];
    let valid = preparationCheckpointValid(session, checkpoint)
      && checkpoint.request.currentProject?.projectDigest === session.project?.projectDigest;
    if (attempt.result) try { assertStudyProposalCurrent(attempt.result.composition, session.project); }
    catch { valid = false; }
    return [{ preparationId: checkpoint.preparationId, requestDigest: checkpoint.requestDigest, inputDigest: checkpoint.inputDigest,
      resultDigest: attempt.result ? logicalDigest(attempt.result) : null, cutoffTurnId: checkpoint.cutoffTurnId,
      project: checkpoint.request.currentProject ? { projectId: checkpoint.request.currentProject.projectId,
        projectVersion: checkpoint.request.currentProject.versionId, projectDigest: checkpoint.request.currentProject.projectDigest } : null,
      status: attempt.status, decision: attempt.decision ?? "PENDING", valid }];
  });
  const review = projectPreparationReview(session);
  const pendingPreparationId = review?.applicable && !review.blocker ? review.checkpoint.preparationId : null;
  return { pendingTurnRef, pendingPreparationId, preparations, stateDigest: logicalDigest({
    project: session.project ? { id: session.project.projectId, version: session.project.versionId, digest: session.project.projectDigest } : null,
    retention: session.scientificDiscussionRetention ?? null, proposal: session.studyProposal ?? null,
    retained: session.retainedContributionCandidates ?? [], workingDraft: session.workingDraft ?? null,
    pendingTurnRef, pendingPreparationId, preparations,
  }) };
};
