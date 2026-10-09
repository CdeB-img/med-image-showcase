import { logicalDigest } from "../../knowledge-engine/canonical.js";
import { buildConversationHumanIntentContext, type ConversationHumanIntent, type ConversationHumanIntentContext } from "../../scientific-thinking/conversation-human-intent.js";
import { bindSemanticHumanDecision } from "../../query-navigation/semantic-human-decision.js";
import { buildBoundedConversationReferentContext } from "../../query-navigation/current-navigation-evidence.js";
import type { ScientificInterpretationTurn } from "../../scientific-interpretation/contracts.js";
import type { FunctionalResetSession } from "./session.js";
import { createConversationEntryId } from "./session.js";
import { markContributionCandidateNonCurrent, retainUndecidedContributionScope } from "./contribution-lifecycle.js";

/** Frozen native input/result, not an authorization token or a new store. */
export type SemanticConversationDecision = Readonly<{
  context: ConversationHumanIntentContext; interpretation: ConversationHumanIntent;
}>;

export const validateCurrentSemanticConversationDecision = (session: FunctionalResetSession,
  userTurn: ScientificInterpretationTurn, decision: SemanticConversationDecision) => {
  const authority = session.projectAuthority;
  if (!authority?.actorRef?.trim() || authority.mandateRef !== "PROJECT_OWNER"
    || authority.authoritySource !== "ACTIVE_RESEARCH_WORKSPACE_SESSION"
    || authority.verification !== "DEMO_SESSION_NOT_AUTHENTICATED")
    throw new Error("SEMANTIC_HUMAN_DECISION_AUTHORITY_INVALID");
  const index = session.runtimeTurns.findIndex(turn => turn.turnId === userTurn.turnId && turn.role === "USER");
  if (index < 0 || logicalDigest(session.runtimeTurns[index].content) !== logicalDigest(userTurn.content)
    || decision.context.userTurnRef !== userTurn.turnId
    || session.runtimeTurns.slice(index + 1).some(turn => turn.role === "USER"))
    throw new Error("SEMANTIC_HUMAN_DECISION_SOURCE_STALE");
  const turns = session.runtimeTurns.slice(0, index + 1);
  const referent = buildBoundedConversationReferentContext({ retained: session.retainedContributionCandidates ?? [],
    currentProject: session.project, conversationId: session.conversationId, runtimeTurns: turns,
    selectedReviewRef: session.pendingContribution?.identity.contributionId ?? null, requestingTurnRef: userTurn.turnId });
  const current = buildConversationHumanIntentContext({ conversation: { conversationId: session.conversationId,
    language: "fr", turns }, currentProject: session.project, boundedReferentContext: referent });
  if (!current || current.inputDigest !== decision.context.inputDigest)
    throw new Error("SEMANTIC_HUMAN_DECISION_CONTEXT_STALE");
  return bindSemanticHumanDecision(current, decision.interpretation);
};

/** Invalidate only the corrected native scope through the retained owner.
 * The replacement remains a same-call ST contribution, never adopted here. */
export const retainSemanticCandidateCorrection = (session: FunctionalResetSession,
  userTurn: ScientificInterpretationTurn, decision: SemanticConversationDecision, at: string): FunctionalResetSession => {
  const bound = validateCurrentSemanticConversationDecision(session, userTurn, decision);
  if (bound.action !== "CORRECT") throw new Error("SEMANTIC_HUMAN_DECISION_SCOPE_INVALID");
  const record = session.retainedContributionCandidates?.find(record => record.candidateRef === decision.interpretation.referentRef);
  if (!record) throw new Error("SEMANTIC_HUMAN_DECISION_REFERENT_INVALID");
  const remainder = retainUndecidedContributionScope({ record, currentBefore: session.project, currentAfter: session.project,
    settledChangeRefs: [...decision.interpretation.correctedChangeRefs, ...decision.interpretation.rejectedChangeRefs],
    decisionSourceRef: userTurn.turnId, retainedAt: at });
  return { ...session, pendingContribution: remainder?.contribution ?? null,
    retainedContributionCandidates: [...markContributionCandidateNonCurrent({ retained: session.retainedContributionCandidates ?? [],
      candidateRef: record.candidateRef, actuality: "SUPERSEDED", reasonRef: userTurn.turnId, recordedAt: at }), ...(remainder ? [remainder] : [])],
    entries: [...session.entries, ...(remainder ? [{ entryId: createConversationEntryId(), kind: "REVIEW" as const, role: "NOXIA" as const,
      contribution: remainder.contribution, candidate: remainder.candidate, status: "PENDING" as const, createdAt: at }] : [])], updatedAt: at };
};
