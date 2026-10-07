/** Technical lifecycle of the existing session-owned Working Draft.
 * This module never produces science, adopts Project, calls a provider or settles money.
 */
import { logicalDigest } from "../../knowledge-engine/canonical.js";
import type { ProductBridgeRequest, ProductBridgeResponse } from "../product-bridge.js";
import { recommendedWorkingScope, prepareContinuousWorkingDraft, validatePreparedWorkingReview, workingDraftInputDigest,
  type WorkingDraftMetadata } from "./continuous-project-build.js";
import { createTurnId, readConversationConfirmationReceipts, workingDraftRecoveryIdentity, type FunctionalResetSession, type WorkingDraftPreparation,
  type ProjectReviewInvitation } from "./session.js";
import { assertStudyProposalOptionBindings, type StudyProposalComposition } from "../../scientific-thinking/contextual-study-proposal.js";
import { ensureCanonicalProjectState } from "../../research-project-construction/canonical-project-backbone.js";
import { readNaturalCandidateDecision } from "./natural-conversation-policy.js";
import { preflightWorkingDraftKnowledgeSource } from "../../scientific-thinking/contextual-reasoning-input.js";
import { assertStudyProposalCurrent } from "./study-proposal-standard.js";
import { recordProjectPreparationTrace } from "./project-preparation-trace.js";
import type { WorkingReviewOwnerObservation } from "./continuous-project-build.js";
import { bindRetainedDiscussionProposal } from "./contribution-discussion-retention.js";
import { buildScientificDiscussionContext } from "./contribution-discussion-context.js";

export type ProjectPreparationCheckpoint = Readonly<{
  contract: "EXPLICIT_PROJECT_PREPARATION_V1";
  preparationId: string;
  sessionId: string;
  projectId: string;
  cutoffTurnId: string;
  conversationCutoffTurnId?: string;
  preparationTrigger?: "EXPLICIT_PROJECT_PREPARATION_ACTION";
  /** Presentation policy only; the immutable scientific request is unchanged. */
  presentation?: "INTERNAL_VERSION_PRODUCTION";
  scientificSourceIdentity?: ProductBridgeRequest["workingDraftScientificSource"];
  capturedAt: string;
  requestDigest: string;
  inputDigest: string;
  previousDraftDigest: string;
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
    && (checkpoint.preparationTrigger === undefined || checkpoint.preparationTrigger === "EXPLICIT_PROJECT_PREPARATION_ACTION")
    && (checkpoint.conversationCutoffTurnId === undefined || checkpoint.conversationCutoffTurnId === checkpoint.cutoffTurnId)
    && logicalDigest(checkpoint.scientificSourceIdentity ?? null) === logicalDigest(checkpoint.request.workingDraftScientificSource ?? null)
    && logicalDigest(checkpoint.previousDraft) === checkpoint.previousDraftDigest
    && workingDraftInputDigest(checkpoint.request) === checkpoint.inputDigest
    && logicalDigest(session.runtimeTurns.slice(0, cutoff + 1)) === logicalDigest(checkpoint.request.conversation.turns);
};
/** Selects only an already linked conversation response or the adopted canonical question. */
const scientificSourceForPreparation = (session: FunctionalResetSession,
  trigger: FunctionalResetSession["runtimeTurns"][number]): NonNullable<ProductBridgeRequest["workingDraftScientificSource"]> | null => {
  const decision = readNaturalCandidateDecision(trigger.content);
  const receipt = decision?.act === "CONFIRM"
    ? readConversationConfirmationReceipts(session).find(item => item.userTurnId === trigger.turnId)
    : null;
  let proposal = decision?.act === "CONFIRM" && session.studyProposal?.state === "CURRENT"
    ? session.studyProposal : null;
  if (proposal) try { assertStudyProposalCurrent(proposal, session.project); }
  catch { proposal = null; }
  const sourceRef = receipt?.preparationSourceTurnRef ?? proposal?.sourceTurnRef;
  const linkedUser = sourceRef
    ? session.runtimeTurns.find(turn => turn.role === "USER" && turn.turnId === sourceRef)
    : decision?.act === "CONFIRM" ? null : trigger;
  const linkedResponse = linkedUser && workingDraftRecoveryIdentity(session, linkedUser.turnId);
  if (linkedUser && linkedResponse && (!receipt || receipt.targetAssistantTurnId === linkedResponse.sourceResponseRef)
    && (!proposal || receipt || proposal.sourceResponseRef === linkedResponse.sourceResponseRef
      || proposal.sourceResponseRef === linkedResponse.compositionResponseRef))
    return { kind: "BOUND_USER_TURN", sourceUserTurnId: linkedUser.turnId,
      sourceResponseTurnId: receipt?.targetAssistantTurnId ?? proposal?.sourceResponseRef ?? linkedResponse.sourceResponseRef,
      sourceDigest: logicalDigest(linkedUser.content) };
  if (!session.project) return null;
  const questions = ensureCanonicalProjectState(session.project).objects.filter(object =>
    object.actuality === "CURRENT" && object.objectType === "SCIENTIFIC_QUESTION");
  if (questions.length !== 1) return null;
  return { kind: "CURRENT_PROJECT_QUESTION", projectId: session.project.projectId,
    versionId: session.project.versionId, projectDigest: session.project.projectDigest,
    objectVersionId: questions[0]!.objectVersionId, sourceDigest: logicalDigest(questions[0]!.content) };
};
export const activeProjectPreparation = (session: FunctionalResetSession) =>
  [...session.workingDraftPreparations ?? []].reverse().find(p => p.checkpoint
    && p.decision !== "ABANDONED" && ["PREPARING", "UNKNOWN/INTERRUPTED"].includes(p.status));
/** A local review/adoption acknowledgement is not a server Chat response proof. */
const latestPreparationSource = (session: FunctionalResetSession) => [...session.runtimeTurns].reverse().find(turn => turn.role === "USER"
  // Only an owner-certified control event may be ignored. Never classify an
  // arbitrary user message/assent by its wording or reconstruct a missing receipt.
  && !session.scientificDiscussionRetention?.sourceCoverage.some(source => source.turnRef === turn.turnId
    && source.sourceDigest === logicalDigest(turn.content) && source.coverage === "COMPLETE"
    && source.nonPersistentReason === "GOVERNED_OWNER_EVENT" && source.classificationOwner === "RESEARCH_PROJECT"
    && Boolean(source.ownerEventRef)));

export const projectPreparationProgress = (session: FunctionalResetSession) => {
  const latest = latestPreparationSource(session);
  const latestIndex = latest ? session.runtimeTurns.findIndex(t => t.turnId === latest.turnId) : -1;
  const prepared = [...session.workingDraftPreparations ?? []].filter(p => p.checkpoint
    && (p.result || p.status === "NO_CHANGE" && p.code === "NO_CANONICAL_CHANGE"))
    .sort((a, b) => session.runtimeTurns.findIndex(t => t.turnId === b.checkpoint!.cutoffTurnId)
      - session.runtimeTurns.findIndex(t => t.turnId === a.checkpoint!.cutoffTurnId))[0];
  const cutoffIndex = prepared ? session.runtimeTurns.findIndex(t => t.turnId === prepared.checkpoint!.cutoffTurnId) : -1;
  return { latestScientificTurnRef: latest?.turnId ?? null,
    latestPreparedTurnRef: prepared?.sourceTurnRef ?? null,
    checkpointThroughTurnRef: prepared?.checkpoint?.cutoffTurnId ?? null,
    latestPendingScientificTurnRef: latestIndex > cutoffIndex ? latest?.turnId ?? null : null };
};

export const canCaptureProjectPreparation = (session: FunctionalResetSession): boolean => {
  const source = latestPreparationSource(session);
  const recovery = source && workingDraftRecoveryIdentity(session, source.turnId);
  const prior = session.workingDraftPreparations?.find(p => p.sourceTurnRef === source?.turnId && p.checkpoint && p.decision !== "ABANDONED");
  return Boolean(recovery && /^noxia-turn:[a-f\d-]{36}$/iu.test(recovery.sourceResponseRef)
    && session.runtimeTurns.at(-1)?.role === "NOXIA" && prior?.decision !== "ADOPTED"
    && !(prior?.status === "NO_CHANGE" && prior.code === "NO_CANONICAL_CHANGE"));
};
export const captureProjectPreparation = (session: FunctionalResetSession, now = new Date().toISOString(), retryFailed = false): WorkingDraftPreparation => {
  const active = activeProjectPreparation(session);
  if (active) return active;
  const source = latestPreparationSource(session);
  const recovery = source && workingDraftRecoveryIdentity(session, source.turnId);
  if (!source || !recovery || !canCaptureProjectPreparation(session)) throw new Error("PREPARATION_CHAT_RESPONSE_REQUIRED");
  const sourceIndex = session.runtimeTurns.findIndex(t => t.turnId === source.turnId);
  const prior = [...session.workingDraftPreparations ?? []].reverse().find(p => p.checkpoint
    && p.sourceTurnRef === source.turnId && p.decision !== "ABANDONED");
  if (prior) {
    if (!retryFailed || prior.status !== "FAILED") return prior;
    // A new explicit command may retry a genuinely terminal failure only.
    // Keep the failed attempt immutable; UNKNOWN is never redispatched here.
    const preparationId = `${prior.checkpoint!.preparationId}:retry:${session.workingDraftPreparations!.length}`;
    const request = structuredClone({ ...prior.checkpoint!.request, observabilityContext: {
      ...prior.checkpoint!.request.observabilityContext!, clientRequestId: preparationId } });
    return { ...prior, status: "PREPARING", code: null, result: undefined, decision: "PENDING", updatedAt: now,
      checkpoint: { ...prior.checkpoint!, preparationId, request, capturedAt: now, requestDigest: logicalDigest(request) } };
  }
  const conversation = { conversationId: session.conversationId, language: "fr" as const,
    turns: session.runtimeTurns.slice(0, session.runtimeTurns.findIndex(t => t.turnId === recovery.compositionResponseRef) + 1) };
  if (conversation.turns.length <= sourceIndex + 1) throw new Error("PREPARATION_CHAT_RESPONSE_REQUIRED");
  const scientificSourceIdentity = scientificSourceForPreparation(session, source);
  const scientificRequest: ProductBridgeRequest = { apiVersion: "1.0.0", conversation,
    currentProject: session.project, evaluatePersistentDelta: false, prepareWorkingDraft: true,
    ...(session.scientificDiscussionRetention ? { scientificDiscussionContext: buildScientificDiscussionContext({
      retained: session.retainedContributionCandidates ?? [], retention: session.scientificDiscussionRetention,
      studyProposal: session.studyProposal, currentProject: session.project, conversationId: session.conversationId,
      runtimeTurns: conversation.turns,
    }) } : {}),
    ...(scientificSourceIdentity ? { workingDraftScientificSource: scientificSourceIdentity } : {}),
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
      conversationCutoffTurnId: recovery.compositionResponseRef,
      preparationTrigger: "EXPLICIT_PROJECT_PREPARATION_ACTION", scientificSourceIdentity,
      capturedAt: now, inputDigest, requestDigest: logicalDigest(request), request,
      previousDraftDigest: logicalDigest(session.workingDraft ?? null),
      previousDraft: session.workingDraft ? structuredClone(session.workingDraft) : null } };
};
export const addProjectPreparation = (session: FunctionalResetSession, preparation: WorkingDraftPreparation): FunctionalResetSession => {
  if (!preparation.checkpoint || session.workingDraftPreparations?.some(p => p.checkpoint?.preparationId === preparation.checkpoint!.preparationId)) return session;
  let next: FunctionalResetSession = { ...session, workingDraftPreparations: [...session.workingDraftPreparations ?? [], preparation] };
  next = recordProjectPreparationTrace(next, preparation.checkpoint, "CLIENT_PREPARATION_START", "STARTED", { code: "EXPLICIT_PROJECT_PREPARATION_ACTION" });
  return recordProjectPreparationTrace(next, preparation.checkpoint, "BRIDGE_REQUEST_CREATED", "SUCCEEDED", { code: "IMMUTABLE_PREPARATION_CHECKPOINT" });
};
export const transitionProjectPreparation = (session: FunctionalResetSession, id: string,
  status: WorkingDraftPreparation["status"], code: string | null = null): FunctionalResetSession => ({
  ...session, workingDraftPreparations: (session.workingDraftPreparations ?? []).map(p =>
    p.checkpoint?.preparationId === id && ["PREPARING", "UNKNOWN/INTERRUPTED"].includes(p.status)
      ? { ...p, status, code, updatedAt: new Date().toISOString() } : p),
});
export const consumeProjectPreparation = (session: FunctionalResetSession, id: string,
  response: Pick<ProductBridgeResponse, "workingDraftUpdate" | "workingStudyProposal">,
  transport: "FOREGROUND" | "DURABLE_RECOVERY" = "FOREGROUND"): FunctionalResetSession => {
  const p = session.workingDraftPreparations?.find(item => item.checkpoint?.preparationId === id);
  if (!p?.checkpoint || p.result || !["PREPARING", "UNKNOWN/INTERRUPTED"].includes(p.status)) return session;
  const cp = p.checkpoint;
  let observed = transport === "FOREGROUND"
    ? recordProjectPreparationTrace(session, cp, "BRIDGE_RESPONSE_RECEIVED", "SUCCEEDED", { code: "BRIDGE_RESPONSE_RECEIVED" })
    : session;
  if (transport === "FOREGROUND") observed = recordProjectPreparationTrace(observed, cp,
    "CLIENT_RESPONSE_CONSUMED", "SUCCEEDED", { code: "PREPARATION_RESPONSE_CONSUMED" });
  if (!preparationCheckpointValid(session, cp)) return transitionProjectPreparation(recordProjectPreparationTrace(observed, cp,
    "WORKING_DRAFT_VALIDATION", "FAILED", { code: "PREPARATION_CHECKPOINT_MISMATCH", failureFunction: "preparationCheckpointValid",
      failureInvariant: "IMMUTABLE_PREPARATION_CHECKPOINT", attribution: "ROOT_CAUSE_PROVEN" }), id, "FAILED", "PREPARATION_CHECKPOINT_MISMATCH");
  if (!response.workingStudyProposal || !response.workingDraftUpdate) {
    if (!response.workingDraftUpdate || response.workingDraftUpdate.requestType === "STUDY_UPDATE")
      observed = recordProjectPreparationTrace(observed, cp, "WORKING_DRAFT_VALIDATION", "FAILED", {
        code: "WORKING_DRAFT_PROPOSAL_MISSING", failureFunction: "consumeProjectPreparation",
        failureInvariant: "STUDY_UPDATE_AND_COMPOSITION_REQUIRED", attribution: "ROOT_CAUSE_PROVEN" });
    return transitionProjectPreparation(observed, id,
      response.workingDraftUpdate && response.workingDraftUpdate.requestType !== "STUDY_UPDATE" ? "NO_CHANGE" : "FAILED",
      response.workingDraftUpdate && response.workingDraftUpdate.requestType !== "STUDY_UPDATE" ? null : "WORKING_DRAFT_PROPOSAL_MISSING");
  }
  const composition = response.workingStudyProposal;
  if (composition.sourceTurnRef !== p.sourceTurnRef || composition.sourceResponseRef !== p.recovery?.compositionResponseRef
    || composition.proposal.contextDigest !== cp.inputDigest) return transitionProjectPreparation(recordProjectPreparationTrace(observed, cp,
      "WORKING_DRAFT_VALIDATION", "FAILED", { code: "PREPARATION_RESULT_BINDING_MISMATCH",
        failureFunction: "consumeProjectPreparation", failureInvariant: "COMPOSITION_CHECKPOINT_BINDING",
        attribution: "ROOT_CAUSE_PROVEN" }), id, "FAILED", "PREPARATION_RESULT_BINDING_MISMATCH");
  try {
    const base = inputSession(observed, cp);
    assertStudyProposalCurrent(composition, base.project);
    assertStudyProposalOptionBindings(composition.proposal);
    observed = recordProjectPreparationTrace(observed, cp, "WORKING_DRAFT_VALIDATION", "SUCCEEDED", {
      code: "STUDY_PROPOSAL_OPTION_BINDING_VALID",
    });
    const ownerObservation: { current: WorkingReviewOwnerObservation | null } = { current: null };
    const previous = cp.request.studyProposalContext?.proposal;
    const scope = recommendedWorkingScope(composition);
    // Preserved native adoptions can leave no new selectable scope. Reuse the
    // existing EXACT full-snapshot no-change certificate, never an empty review
    // nor a new adoption. New/open/unselected science still changes this digest.
    if (previous && composition.adoptedAtomRefs.length && !scope.selectedAtomRefs.length && !scope.selectedOptionRefs.length
      && (session.project?.projectDigest ?? null) === (cp.request.currentProject?.projectDigest ?? null)) {
      const { contextDigest: _newContext, ...newSnapshot } = composition.proposal;
      const { contextDigest: _oldContext, ...oldSnapshot } = previous;
      if (logicalDigest(newSnapshot) === logicalDigest(oldSnapshot)) return transitionProjectPreparation(
        recordProjectPreparationTrace(observed, cp, "PROJECT_DELTA_VALIDATION", "SUCCEEDED", {
          code: "NO_CANONICAL_CHANGE", metadata: { errorSubtype: "NO_NET_CHANGE", netChangeCount: 0,
            conflictCount: 0, boundedStatus: "IDENTICAL_SCIENTIFIC_SNAPSHOT" },
        }), id, "NO_CHANGE", "NO_CANONICAL_CHANGE");
    }
    const workingDraft = prepareContinuousWorkingDraft(base, composition, response.workingDraftUpdate, cp.inputDigest, ownerObservation);
    const diagnostic = ownerObservation.current;
    if (diagnostic?.subtype === "NO_NET_CHANGE" && workingDraft.failure === "WORKING_REVIEW_OWNER_NOT_READY"
      && previous && (session.project?.projectDigest ?? null) === (cp.request.currentProject?.projectDigest ?? null)) {
      const { contextDigest: _newContext, ...newSnapshot } = composition.proposal;
      const { contextDigest: _oldContext, ...oldSnapshot } = previous;
      // A zero canonical delta is not enough: new unresolved science may exist.
      // Only an EXACTLY identical full snapshot (except its context identity),
      // validated upstream and on the unchanged Project base, certifies no change.
      if (logicalDigest(newSnapshot) === logicalDigest(oldSnapshot)) return transitionProjectPreparation(
        recordProjectPreparationTrace(observed, cp, "PROJECT_DELTA_VALIDATION", "SUCCEEDED", {
          code: "NO_CANONICAL_CHANGE", metadata: { errorSubtype: "NO_NET_CHANGE", netChangeCount: 0,
            conflictCount: 0, boundedStatus: "IDENTICAL_SCIENTIFIC_SNAPSHOT" },
        }), id, "NO_CHANGE", "NO_CANONICAL_CHANGE");
    }
    if (diagnostic) {
      const metadata = {
        candidateStatus: diagnostic.candidateStatus, canonicalStatus: diagnostic.canonicalStatus,
        reviewProjectionStatus: diagnostic.reviewProjectionStatus, netChangeCount: diagnostic.netChangeCount,
        additionCount: diagnostic.additionCount, updateCount: diagnostic.updateCount, removeCount: diagnostic.removeCount,
        conflictCount: diagnostic.conflictCount, firstConflictId: diagnostic.firstConflictId,
        firstConflictCode: diagnostic.firstConflictCode,
        expectedReviewDecisionCount: diagnostic.expectedReviewDecisionCount,
        actualReviewDecisionCount: diagnostic.actualReviewDecisionCount, errorSubtype: diagnostic.subtype,
      };
      const projectFailed = ["NO_NET_CHANGE", "STRUCTURAL_CONFLICT", "OWNER_VALIDATION_FAILED"].includes(diagnostic.subtype);
      observed = recordProjectPreparationTrace(observed, cp, "PROJECT_DELTA_VALIDATION", projectFailed ? "FAILED" : "SUCCEEDED", {
        code: projectFailed ? "WORKING_REVIEW_OWNER_NOT_READY" : diagnostic.canonicalStatus,
        metadata, ...(projectFailed ? { publicCode: "WORKING_REVIEW_OWNER_NOT_READY",
          failureFunction: diagnostic.subtype === "OWNER_VALIDATION_FAILED" ? "prepareContinuousWorkingDraft" : "prepareResearchProjectContributionCandidate",
          failureInvariant: diagnostic.subtype === "NO_NET_CHANGE" ? "NET_CANONICAL_CHANGE_REQUIRED"
            : diagnostic.subtype === "STRUCTURAL_CONFLICT" ? "CANONICAL_PROJECT_NO_STRUCTURAL_CONFLICT" : "UNKNOWN",
          attribution: diagnostic.subtype === "OWNER_VALIDATION_FAILED" ? "SYMPTOM_ONLY" as const : "ROOT_CAUSE_PROVEN" as const } : {}),
      });
      if (!projectFailed) observed = recordProjectPreparationTrace(observed, cp, "REVIEW_PROJECTION_VALIDATION",
        diagnostic.subtype === "REVIEW_PROJECTION_INCOMPLETE" ? "FAILED" : "SUCCEEDED", {
          code: diagnostic.subtype === "REVIEW_PROJECTION_INCOMPLETE" ? "WORKING_REVIEW_OWNER_NOT_READY" : diagnostic.reviewProjectionStatus,
          metadata, ...(diagnostic.subtype === "REVIEW_PROJECTION_INCOMPLETE" ? {
            publicCode: "WORKING_REVIEW_OWNER_NOT_READY", failureFunction: "validateHumanReviewProjectionCoverage",
            failureInvariant: "REVIEW_CHANGE_COVERAGE_COMPLETE", attribution: "ROOT_CAUSE_PROVEN" as const,
          } : {}),
        });
    }
    if (!workingDraft.readyReview || workingDraft.failure) return transitionProjectPreparation(observed, id, "FAILED", workingDraft.failure ?? "WORKING_REVIEW_NOT_READY");
    const prepared = validatePreparedWorkingReview({ ...base, studyProposal: composition, workingDraft });
    if (!prepared) return transitionProjectPreparation(recordProjectPreparationTrace(observed, cp,
      "WORKING_DRAFT_VALIDATION", "FAILED", { code: "WORKING_REVIEW_BINDING_INVALID",
        failureFunction: "validatePreparedWorkingReview", failureInvariant: "PREPARED_REVIEW_REVALIDATION",
        attribution: "SYMPTOM_ONLY" }), id, "FAILED", "WORKING_REVIEW_BINDING_INVALID");
    const binding: ProjectReviewInvitation = { sessionId: session.sessionId, conversationId: session.conversationId,
      projectId: cp.projectId, sourceProjectVersion: cp.request.currentProject?.versionId ?? null,
      sourceProjectDigest: cp.request.currentProject?.projectDigest ?? null,
      sourceTurnRef: composition.sourceTurnRef, sourceResponseRef: composition.sourceResponseRef,
      compositionDigest: composition.digest, reviewScopeDigest: workingDraft.reviewScopeDigest!,
      candidateRef: prepared.contribution.identity.contributionId, contributionDigest: prepared.contribution.identity.contributionDigest };
    observed = recordProjectPreparationTrace(observed, cp, "READY_FOR_REVIEW", "SUCCEEDED", { code: "READY_FOR_REVIEW" });
    const transitioned = transitionProjectPreparation(observed, id, "READY_FOR_REVIEW");
    const currentBase = (session.project?.projectDigest ?? null) === binding.sourceProjectDigest;
    const scientificDiscussionRetention = bindRetainedDiscussionProposal(session.scientificDiscussionRetention,
      composition, response.workingDraftUpdate.retainedDiscussionBindings ?? []);
    return { ...transitioned,
      scientificDiscussionRetention,
      ...(currentBase ? { studyProposal: composition, workingDraft, workingDraftFailure: null } : {}),
      workingDraftPreparations: transitioned.workingDraftPreparations!.map(item => item.checkpoint?.preparationId === id
        ? { ...item, result: { composition, workingDraft } } : item),
      entries: cp.presentation === "INTERNAL_VERSION_PRODUCTION" || observed.entries.some(e => e.entryId === `preparation-review:${id}`) ? observed.entries : [...observed.entries, {
        entryId: `preparation-review:${id}`, kind: "TEXT", role: "NOXIA", createdAt: new Date().toISOString(),
        content: "La préparation est terminée. Consultez les choix proposés puis validez explicitement la revue pour mettre à jour le projet.",
        reviewInvitation: binding }],
    };
  } catch (error) {
    const code = error instanceof Error ? error.message : "WORKING_DRAFT_OWNER_FAILED";
    return transitionProjectPreparation(recordProjectPreparationTrace(observed, cp, "WORKING_DRAFT_VALIDATION", "FAILED", {
      code: /^[A-Z][A-Z0-9_]+$/.test(code) ? code : "WORKING_DRAFT_OWNER_FAILED",
      failureFunction: "consumeProjectPreparation", failureInvariant: "UNKNOWN", attribution: "SYMPTOM_ONLY",
    }), id, "FAILED", code);
  }
};
export const projectPreparationReview = (session: FunctionalResetSession) => {
  const preparations = session.workingDraftPreparations ?? [];
  // A confirmed newer full snapshot supersedes the earlier review VIEW only.
  // Keep its immutable evidence and preserve unrelated stale-base blockers.
  const adoptedContributions = new Set(session.project
    ? ensureCanonicalProjectState(session.project).versionHistory.map(version => version.sourceContributionRef) : []);
  const adoptedCutoff = Math.max(-1, ...preparations.filter(item => item.result && item.checkpoint && item.decision === "ADOPTED"
    && preparationCheckpointValid(session, item.checkpoint)
    && adoptedContributions.has(item.adoptedContributionRef ?? item.result.workingDraft.readyReview?.candidate.contributionRef ?? ""))
    .map(item => session.runtimeTurns.findIndex(turn => turn.turnId === item.checkpoint!.cutoffTurnId)));
  const p = [...preparations].reverse().find(item => item.result && item.checkpoint && item.decision === "PENDING"
    && session.runtimeTurns.findIndex(turn => turn.turnId === item.checkpoint!.cutoffTurnId) > adoptedCutoff);
  if (!p?.checkpoint || !p.result) return null;
  const cp = p.checkpoint;
  if (!preparationCheckpointValid(session, cp)) return null;
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
export const recordPreparationDecision = (session: FunctionalResetSession, id: string, decision: ProjectPreparationDecision, adoptedContributionRef?: string): FunctionalResetSession => ({
  ...session, workingDraftPreparations: (session.workingDraftPreparations ?? []).map(p => p.checkpoint?.preparationId === id
    && p.decision === "PENDING" ? { ...p, decision, ...(decision === "ADOPTED" && adoptedContributionRef ? { adoptedContributionRef } : {}) } : p),
});

export const projectPreparationConfirmationApplicable = (review: ReturnType<typeof projectPreparationReview>, busy: boolean, workingDraftBusy: boolean, selectedChangeRefs?: readonly string[]) => Boolean(review && review.applicable && !review.blocker && !busy && !workingDraftBusy
  && !(review.newerTurns.length > 0 && !selectedChangeRefs?.length));

export const projectPreparationConfirmationInput = (review: NonNullable<ReturnType<typeof projectPreparationReview>>) => {
  const scope = recommendedWorkingScope(review.composition);
  // Preserve the existing order: validate scope before creating identity/time.
  const userTurn = { turnId: createTurnId(), role: "USER" as const,
    content: `Validation explicite de la préparation ${review.checkpoint.preparationId}`, createdAt: new Date().toISOString() };
  return { scope, userTurn };
};
