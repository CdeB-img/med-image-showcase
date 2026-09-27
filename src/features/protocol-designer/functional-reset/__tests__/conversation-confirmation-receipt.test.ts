import { beforeEach, describe, expect, it } from "vitest";
import {
  conversationConfirmationReceiptStatus,
  createFunctionalResetSession,
  loadFunctionalResetSession,
  persistFunctionalResetSession,
  recordConversationConfirmationReceipt,
  recordWorkingDraftPreparation,
  workingDraftRecoveryIdentity,
  workingDraftRecoveryStillBound,
  type FunctionalResetSession,
} from "../session";

const timestamp = "2026-09-26T10:00:00.000Z";
const source = { turnId: "user-source", role: "USER" as const, content: "Étude ECV et âge.", createdAt: timestamp };
const proposal = { turnId: "assistant-proposal", role: "NOXIA" as const, content: "Je propose une étude transversale.", createdAt: timestamp };
const assent = { turnId: "user-confirm", role: "USER" as const, content: "oui je valide", createdAt: timestamp };
const confirm = { act: "CONFIRM" as const, qualified: false, separableContinuation: false };

const preparingSession = () => recordWorkingDraftPreparation({
  ...createFunctionalResetSession(timestamp), runtimeTurns: [source, proposal],
}, source.turnId, "PREPARING", null, timestamp);

const recorded = () => {
  const session = preparingSession();
  return recordConversationConfirmationReceipt(session, assent, confirm);
};

beforeEach(() => localStorage.clear());

describe("source-bound conversation confirmation receipt", () => {
  it("keeps the exact preparation binding across assent and reload without making it adoption", () => {
    const initial = preparingSession();
    const recovery = workingDraftRecoveryIdentity(initial, source.turnId);
    expect(recovery).toMatchObject({ sourceResponseRef: proposal.turnId,
      baseProjectId: initial.projectId, baseProjectVersion: null, baseProjectDigest: null });
    const pending = recordWorkingDraftPreparation(initial, source.turnId, "PREPARING", null, timestamp, recovery!);
    const withAssent = recordConversationConfirmationReceipt(pending, assent, confirm);
    const completeConversation = { ...withAssent, runtimeTurns: [...withAssent.runtimeTurns, assent] };
    persistFunctionalResetSession(localStorage, completeConversation);
    const reloaded = loadFunctionalResetSession(localStorage);
    expect(reloaded.workingDraftPreparations?.[0]?.recovery).toEqual(recovery);
    expect(reloaded.workingDraftPreparations?.[0]?.status).toBe("UNKNOWN/INTERRUPTED");
    const observedRunning = recordWorkingDraftPreparation(reloaded, source.turnId, "PREPARING");
    expect(observedRunning.workingDraftPreparations?.[0]?.status).toBe("PREPARING");
    expect(recordWorkingDraftPreparation(observedRunning, source.turnId, "FAILED", "RECOVERED_FAILURE")
      .workingDraftPreparations?.[0]?.status).toBe("FAILED");
    expect(workingDraftRecoveryStillBound(reloaded, reloaded.workingDraftPreparations![0]!)).toBe(true);
    expect(reloaded.project).toBeNull();
    expect(workingDraftRecoveryStillBound({ ...reloaded, runtimeTurns: [source,
      { ...proposal, content: "Proposition modifiée." }, assent] }, reloaded.workingDraftPreparations![0]!)).toBe(false);
  });
  it("keeps the server Chat proof distinct from a later local reply used by a compound turn", () => {
    const localReply = { turnId: "local-adoption-reply", role: "NOXIA" as const,
      content: "Projet confirmé ; suite à structurer.", createdAt: timestamp };
    const initial = { ...createFunctionalResetSession(timestamp), runtimeTurns: [source, proposal, localReply] };
    const recovery = workingDraftRecoveryIdentity(initial, source.turnId);
    expect(recovery).toMatchObject({ sourceResponseRef: proposal.turnId,
      compositionResponseRef: localReply.turnId });
    const pending = recordWorkingDraftPreparation(initial, source.turnId, "PREPARING", null, timestamp, recovery!);
    expect(workingDraftRecoveryStillBound(pending, pending.workingDraftPreparations![0]!)).toBe(true);
    expect(workingDraftRecoveryStillBound({ ...pending, runtimeTurns: [source, proposal,
      { ...localReply, content: "Autre proposition." }] }, pending.workingDraftPreparations![0]!)).toBe(false);
  });
  it("binds a later assent to its own displayed exchange while an older batch is active", () => {
    const s = preparingSession();
    s.runtimeTurns = [...s.runtimeTurns, { ...source, turnId: "later-user" }, { ...proposal, turnId: "later-assistant" }];
    const receipt = recordConversationConfirmationReceipt(s, assent, confirm).conversationConfirmationReceipts!.at(-1)!;
    expect(receipt.targetAssistantTurnId).toBe("later-assistant");
    expect(receipt.preparationSourceTurnRef).toBe("later-user");
  });
  it("records exactly one immutable turn-to-proposal binding before the Working Draft finishes", () => {
    const session = recorded();
    const receipt = session.conversationConfirmationReceipts?.[0];
    expect(receipt).toMatchObject({ sessionId: session.sessionId, userTurnId: assent.turnId,
      targetAssistantTurnId: proposal.turnId, classification: "CONFIRM", qualified: false,
      baseProjectId: session.projectId,
      baseProjectVersion: null, baseProjectDigest: null, preparationSourceTurnRef: source.turnId });
    expect(receipt?.sourceConversationDigest).toBeTruthy();
    expect(session.project).toBeNull();
    expect(conversationConfirmationReceiptStatus(session, receipt!)).toBe("RECORDED");
    expect(recordConversationConfirmationReceipt(session, assent, confirm).conversationConfirmationReceipts).toHaveLength(1);
    expect(recordConversationConfirmationReceipt(preparingSession(), assent,
      { act: "REFUSE", qualified: false, separableContinuation: false }).conversationConfirmationReceipts).toEqual([]);
    expect(recordConversationConfirmationReceipt(preparingSession(), assent,
      { act: "CONFIRM", qualified: true, separableContinuation: false }).conversationConfirmationReceipts).toEqual([]);
  });

  it("rehydrates the receipt while an unfinished preparation becomes interrupted", () => {
    const session = recorded();
    persistFunctionalResetSession(localStorage, { ...session, runtimeTurns: [...session.runtimeTurns, assent] });
    const reloaded = loadFunctionalResetSession(localStorage);
    expect(reloaded.conversationConfirmationReceipts).toEqual(session.conversationConfirmationReceipts);
    expect(reloaded.project).toBeNull();
    expect(conversationConfirmationReceiptStatus(reloaded, reloaded.conversationConfirmationReceipts![0]!)).toBe("INTERRUPTED/UNKNOWN");
  });

  it("rejects a receipt whose immutable source conversation or target was altered", () => {
    const session = recorded();
    const withTurn = { ...session, runtimeTurns: [...session.runtimeTurns, assent] };
    const receipt = session.conversationConfirmationReceipts![0]!;
    persistFunctionalResetSession(localStorage, { ...withTurn, conversationConfirmationReceipts: [
      { ...receipt, targetAssistantTurnId: "assistant-other" },
    ] });
    expect(loadFunctionalResetSession(localStorage).conversationConfirmationReceipts).toEqual([]);
    persistFunctionalResetSession(localStorage, { ...withTurn, runtimeTurns: [source,
      { ...proposal, content: "Une autre proposition." }, assent] });
    expect(loadFunctionalResetSession(localStorage).conversationConfirmationReceipts).toEqual([]);
  });

  it("derives review, failure, and supersession from the existing preparation lifecycle", () => {
    const session = recorded();
    const receipt = session.conversationConfirmationReceipts![0]!;
    const reviewInvitation = { sessionId: session.sessionId, conversationId: session.conversationId,
      projectId: session.projectId, sourceProjectVersion: null, sourceProjectDigest: null,
      sourceTurnRef: source.turnId, sourceResponseRef: proposal.turnId, compositionDigest: "composition",
      reviewScopeDigest: "scope", candidateRef: "candidate", contributionDigest: "contribution" };
    const ready = recordWorkingDraftPreparation(session, source.turnId, "READY_FOR_REVIEW", null, timestamp);
    const withReview: FunctionalResetSession = { ...ready, entries: [...ready.entries,
      { entryId: "review-invitation", kind: "TEXT", role: "NOXIA", content: "Revue prête.",
        reviewInvitation, createdAt: timestamp }] };
    expect(conversationConfirmationReceiptStatus(withReview, receipt)).toBe("REVIEW_READY");
    expect(conversationConfirmationReceiptStatus(ready, receipt)).toBe("INTERRUPTED/UNKNOWN");
    expect(conversationConfirmationReceiptStatus(recordWorkingDraftPreparation(session, source.turnId, "FAILED", "OWNER_REJECT", timestamp), receipt))
      .toBe("PREPARATION_FAILED");
    expect(conversationConfirmationReceiptStatus(recordWorkingDraftPreparation(session, source.turnId, "SUPERSEDED", "STALE", timestamp), receipt))
      .toBe("SUPERSEDED");
    expect(session.project).toBeNull();
  });

  it("never transfers an earlier confirmation to a newer assistant proposal", () => {
    const first = recorded();
    const receipt = first.conversationConfirmationReceipts![0]!;
    const newer = { turnId: "assistant-new", role: "NOXIA" as const, content: "Nouvelle proposition.", createdAt: timestamp };
    const changed = { ...first, runtimeTurns: [...first.runtimeTurns, assent, newer] };
    expect(changed.conversationConfirmationReceipts![0]?.targetAssistantTurnId).toBe(proposal.turnId);
    expect(changed.conversationConfirmationReceipts![0]?.targetAssistantTurnId).not.toBe(newer.turnId);
    expect(conversationConfirmationReceiptStatus(recordWorkingDraftPreparation(changed, source.turnId, "SUPERSEDED", "NEW_TURN", timestamp), receipt))
      .toBe("SUPERSEDED");
    expect(recordConversationConfirmationReceipt({ ...preparingSession(), runtimeTurns: [source, proposal,
      { ...assent, turnId: "intervening-user" }, newer] },
    { ...assent, turnId: "later-confirm" }, confirm).conversationConfirmationReceipts).toMatchObject([{
      userTurnId: "later-confirm", targetAssistantTurnId: newer.turnId, preparationSourceTurnRef: "intervening-user",
    }]);
  });
});
