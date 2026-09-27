/** Technical lifecycle of the existing session-owned Working Draft.
 * This module never produces science, adopts Project, calls a provider or settles money.
 */
import { logicalDigest } from "../../knowledge-engine/canonical.js";
import type { ProductBridgeRequest, ProductBridgeResponse } from "../product-bridge.js";
import { prepareContinuousWorkingDraft, validatePreparedWorkingReview, workingDraftInputDigest,
  type WorkingDraftMetadata } from "./continuous-project-build.js";
import { workingDraftRecoveryIdentity, type FunctionalResetSession, type WorkingDraftPreparation,
  type ProjectReviewInvitation } from "./session.js";
import type { StudyProposalComposition } from "../../scientific-thinking/contextual-study-proposal.js";

export type ProjectPreparationCheckpoint = Readonly<{
  contract: "EXPLICIT_PROJECT_PREPARATION_V1";
  preparationId: string;
  sessionId: string;
  projectId: string;
  cutoffTurnId: string;
  capturedAt: string;
  requestDigest: string;
  inputDigest: string;
  /** One immutable technical input snapshot, not an alternative Project authority.
   * The captured Project is required to replay native review owners after a base change.
   * Network transport continues to use the existing verified Project snapshot resolver.
   */
  request: ProductBridgeRequest;
  previousDraft: WorkingDraftMetadata | null;
}>;
export type ProjectPreparationResult = Readonly<{
  composition: StudyProposalComposition;
  workingDraft: WorkingDraftMetadata;
}>;
export type ProjectPreparationDecision = "PENDING" | "ADOPTED" | "REFUSED" | "ABANDONED";

const inputSession = (session: FunctionalResetSession, checkpoint: ProjectPreparationCheckpoint): FunctionalResetSession => ({
  ...session, projectId: checkpoint.projectId, project: checkpoint.request.currentProject,
  conversationId: checkpoint.request.conversation.conversationId,
  runtimeTurns: checkpoint.request.conversation.turns as FunctionalResetSession["runtimeTurns"],
  studyProposal: checkpoint.request.studyProposalContext ?? null,
  workingDraft: checkpoint.previousDraft, updatedAt: checkpoint.capturedAt,
});
export const preparationCheckpointValid = (session: FunctionalResetSession, checkpoint: ProjectPreparationCheckpoint): boolean => {
  if (!checkpoint || !checkpoint.request?.conversation || !Array.isArray(checkpoint.request.conversation.turns)) return false;
  const cutoff = session.runtimeTurns.findIndex(turn => turn.turnId === checkpoint.cutoffTurnId);
  return checkpoint.contract === "EXPLICIT_PROJECT_PREPARATION_V1" && checkpoint.sessionId === session.sessionId
    && checkpoint.projectId === session.projectId && cutoff >= 0
    && logicalDigest(checkpoint.request) === checkpoint.requestDigest
    && workingDraftInputDigest(checkpoint.request) === checkpoint.inputDigest
    && logicalDigest(session.runtimeTurns.slice(0, cutoff + 1)) === logicalDigest(checkpoint.request.conversation.turns);
};
export const activeProjectPreparation = (session: FunctionalResetSession) =>
  [...session.workingDraftPreparations ?? []].reverse().find(p => p.checkpoint
    && ["PREPARING", "UNKNOWN/INTERRUPTED"].includes(p.status));
export const captureProjectPreparation = (session: FunctionalResetSession, now = new Date().toISOString()): WorkingDraftPreparation => {
  const active = activeProjectPreparation(session);
  if (active) return active;
  const source = [...session.runtimeTurns].reverse().find(t => t.role === "USER");
  const recovery = source && workingDraftRecoveryIdentity(session, source.turnId);
  if (!source || !recovery || session.runtimeTurns.at(-1)?.role !== "NOXIA") throw new Error("PREPARATION_CHAT_RESPONSE_REQUIRED");
  const sourceIndex = session.runtimeTurns.findIndex(t => t.turnId === source.turnId);
  const prior = [...session.workingDraftPreparations ?? []].reverse().find(p => p.checkpoint
    && p.sourceTurnRef === source.turnId && p.decision !== "ABANDONED");
  if (prior) return prior;
  const conversation = { conversationId: session.conversationId, language: "fr" as const,
    turns: session.runtimeTurns.slice(0, session.runtimeTurns.findIndex(t => t.turnId === recovery.compositionResponseRef) + 1) };
  if (conversation.turns.length <= sourceIndex + 1) throw new Error("PREPARATION_CHAT_RESPONSE_REQUIRED");
  const scientificRequest: ProductBridgeRequest = { apiVersion: "1.0.0", conversation,
    currentProject: session.project, evaluatePersistentDelta: false, prepareWorkingDraft: true,
    workingDraftHistory: (session.workingDraft?.history ?? []).filter(h => h.status === "REJECTED"),
    ...(session.studyProposal?.state === "CURRENT" ? { studyProposalContext: session.studyProposal } : {}) };
  const inputDigest = workingDraftInputDigest(scientificRequest);
  const preparationId = `working-draft:${source.turnId}:checkpoint:${inputDigest}`;
  const request: ProductBridgeRequest = structuredClone({ ...scientificRequest,
    observabilityContext: { sessionId: session.sessionId, conversationId: session.conversationId,
      turnId: source.turnId, clientRequestId: preparationId, testSessionId: null } });
  return { sourceTurnRef: source.turnId, status: "PREPARING", code: null, updatedAt: now, recovery,
    decision: "PENDING", checkpoint: { contract: "EXPLICIT_PROJECT_PREPARATION_V1", preparationId,
      sessionId: session.sessionId, projectId: session.projectId, cutoffTurnId: recovery.compositionResponseRef,
      capturedAt: now, inputDigest, requestDigest: logicalDigest(request), request,
      previousDraft: session.workingDraft ? structuredClone(session.workingDraft) : null } };
};
export const addProjectPreparation = (session: FunctionalResetSession, preparation: WorkingDraftPreparation): FunctionalResetSession => {
  if (!preparation.checkpoint || session.workingDraftPreparations?.some(p => p.checkpoint?.preparationId === preparation.checkpoint!.preparationId)) return session;
  return { ...session, workingDraftPreparations: [...session.workingDraftPreparations ?? [], preparation] };
};
export const transitionProjectPreparation = (session: FunctionalResetSession, id: string,
  status: WorkingDraftPreparation["status"], code: string | null = null): FunctionalResetSession => ({
  ...session, workingDraftPreparations: (session.workingDraftPreparations ?? []).map(p =>
    p.checkpoint?.preparationId === id && ["PREPARING", "UNKNOWN/INTERRUPTED"].includes(p.status)
      ? { ...p, status, code, updatedAt: new Date().toISOString() } : p),
});
export const consumeProjectPreparation = (session: FunctionalResetSession, id: string,
  response: Pick<ProductBridgeResponse, "workingDraftUpdate" | "workingStudyProposal">): FunctionalResetSession => {
  const p = session.workingDraftPreparations?.find(item => item.checkpoint?.preparationId === id);
  if (!p?.checkpoint || p.result || !["PREPARING", "UNKNOWN/INTERRUPTED"].includes(p.status)) return session;
  const cp = p.checkpoint;
  if (!preparationCheckpointValid(session, cp)) return transitionProjectPreparation(session, id, "FAILED", "PREPARATION_CHECKPOINT_MISMATCH");
  if (!response.workingStudyProposal || !response.workingDraftUpdate) {
    return transitionProjectPreparation(session, id,
      response.workingDraftUpdate && response.workingDraftUpdate.requestType !== "STUDY_UPDATE" ? "NO_CHANGE" : "FAILED",
      response.workingDraftUpdate && response.workingDraftUpdate.requestType !== "STUDY_UPDATE" ? null : "WORKING_DRAFT_PROPOSAL_MISSING");
  }
  const composition = response.workingStudyProposal;
  if (composition.sourceTurnRef !== p.sourceTurnRef || composition.sourceResponseRef !== p.recovery?.compositionResponseRef
    || composition.proposal.contextDigest !== cp.inputDigest) return transitionProjectPreparation(session, id, "FAILED", "PREPARATION_RESULT_BINDING_MISMATCH");
  try {
    const base = inputSession(session, cp);
    const workingDraft = prepareContinuousWorkingDraft(base, composition, response.workingDraftUpdate, cp.inputDigest);
    if (!workingDraft.readyReview || workingDraft.failure) return transitionProjectPreparation(session, id, "FAILED", workingDraft.failure ?? "WORKING_REVIEW_NOT_READY");
    const prepared = validatePreparedWorkingReview({ ...base, studyProposal: composition, workingDraft });
    if (!prepared) return transitionProjectPreparation(session, id, "FAILED", "WORKING_REVIEW_BINDING_INVALID");
    const binding: ProjectReviewInvitation = { sessionId: session.sessionId, conversationId: session.conversationId,
      projectId: cp.projectId, sourceProjectVersion: cp.request.currentProject?.versionId ?? null,
      sourceProjectDigest: cp.request.currentProject?.projectDigest ?? null,
      sourceTurnRef: composition.sourceTurnRef, sourceResponseRef: composition.sourceResponseRef,
      compositionDigest: composition.digest, reviewScopeDigest: workingDraft.reviewScopeDigest!,
      candidateRef: prepared.contribution.identity.contributionId, contributionDigest: prepared.contribution.identity.contributionDigest };
    const transitioned = transitionProjectPreparation(session, id, "READY_FOR_REVIEW");
    const currentBase = (session.project?.projectDigest ?? null) === binding.sourceProjectDigest;
    return { ...transitioned,
      ...(currentBase ? { studyProposal: composition, workingDraft, workingDraftFailure: null } : {}),
      workingDraftPreparations: transitioned.workingDraftPreparations!.map(item => item.checkpoint?.preparationId === id
        ? { ...item, result: { composition, workingDraft } } : item),
      entries: session.entries.some(e => e.entryId === `preparation-review:${id}`) ? session.entries : [...session.entries, {
        entryId: `preparation-review:${id}`, kind: "TEXT", role: "NOXIA", createdAt: new Date().toISOString(),
        content: "La préparation est terminée. Consultez les choix proposés puis validez explicitement la revue pour mettre à jour le projet.",
        reviewInvitation: binding }],
    };
  } catch (error) { return transitionProjectPreparation(session, id, "FAILED", error instanceof Error ? error.message : "WORKING_DRAFT_OWNER_FAILED"); }
};
export const projectPreparationReview = (session: FunctionalResetSession) => {
  const p = [...session.workingDraftPreparations ?? []].reverse().find(item => item.result && item.decision === "PENDING");
  if (!p?.checkpoint || !p.result) return null;
  const cp = p.checkpoint;
  const base = inputSession(session, cp);
  const prepared = validatePreparedWorkingReview({ ...base, studyProposal: p.result.composition, workingDraft: p.result.workingDraft });
  if (!prepared) return null;
  const baseCurrent = (session.project?.projectId ?? session.projectId) === cp.projectId
    && (session.project?.versionId ?? null) === (cp.request.currentProject?.versionId ?? null)
    && (session.project?.projectDigest ?? null) === (cp.request.currentProject?.projectDigest ?? null);
  const newerTurns = session.runtimeTurns.slice(session.runtimeTurns.findIndex(t => t.turnId === cp.cutoffTurnId) + 1).filter(t => t.role === "USER");
  return { preparation: p, checkpoint: cp, ...p.result, prepared, newerTurns,
    applicable: preparationCheckpointValid(session, cp) && baseCurrent,
    blocker: !preparationCheckpointValid(session, cp) ? "PREPARATION_CHECKPOINT_MISMATCH"
      : !baseCurrent ? "PROJECT_BASE_CHANGED" : p.postCutoffBlocker ?? null };
};
export const recordPreparationDecision = (session: FunctionalResetSession, id: string, decision: ProjectPreparationDecision): FunctionalResetSession => ({
  ...session, workingDraftPreparations: (session.workingDraftPreparations ?? []).map(p => p.checkpoint?.preparationId === id
    && p.decision === "PENDING" ? { ...p, decision } : p),
});
