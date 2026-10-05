import { afterEach, describe, expect, it, vi } from "vitest";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { prepareTerraConversation } from "@/features/scientific-thinking/scientific-collaborator-conversation";
import { prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import { buildScientificDiscussionContext } from "../contribution-discussion-context";
import { retainValidatedContributionCandidate, markContributionCandidatePresented, recordContributionCandidateHumanDecision } from "../contribution-lifecycle";
import { emptyScientificDiscussionRetention, retainScientificDiscussionResult, activeScientificDiscussionRetention,
  validateScientificDiscussionRetention, terraScientificResultJsonSchema, terraScientificResultSchema,
  scientificDiscussionRetentionFailureDiagnostic,
  type TerraScientificResult, type ScientificDiscussionRetention } from "../contribution-discussion-retention";
import { behaviorTurn, behaviorContribution, behaviorItem, adoptBehaviorContribution } from "./p1-behavior-01a-contract-fixtures";
import type { ProductBridgeRequest } from "../../product-bridge";
import { failedScientificReceiptLinkFixture, validScientificReceiptLinkFixture, scientificReceiptLinkFixture } from "./scientific-receipt-link-fixture";

const conversationId = "conversation:p1-behavior-01a";
const at = "2026-10-04T12:00:00.000Z";
const noMeaning = () => ({ coverage: "COMPLETE" as const, nonPersistentReason: "NO_SCIENTIFIC_MEANING" as const, elements: [] });
const element = (id: string, content: string) => ({ id, content, epistemicState: "USER_STATED" as const,
  polarity: "CONDITIONAL" as const, conditions: ["Seulement si la condition est satisfaite"], linkedIds: [] });
const result = (elements: TerraScientificResult["userContribution"]["elements"] = []): TerraScientificResult => ({
  reply: "Réponse conversationnelle de test.",
  userContribution: elements.length ? { coverage: "COMPLETE", nonPersistentReason: null, elements } : noMeaning(),
  assistantContribution: noMeaning(), dispositions: [], candidateBindings: [],
});

// CURRENT_STRUCTURAL_INVARIANT: first rejected branch and diagnostic privacy.
// Scientific content is retained in the source fixture, never in diagnostics.
describe("bounded passive Scientific Discussion retention diagnostics", () => {
  const privateText = "IRM cardiaque : exclusion proposée de l’HTA ; PRIVATE_SOURCE_CANARY";
  const secret = "sk-SYNTHETIC_SECRET_CANARY";
  const inputFor = (value: unknown) => {
    const userTurn = behaviorTurn("private-user", privateText);
    const assistantTurn = { turnId: "private-assistant", role: "NOXIA" as const, content: privateText, createdAt: at };
    return { conversationId, runtimeTurns: [userTurn, assistantTurn], userTurn, assistantTurn, result: value, retained: [] };
  };
  const scientificReceipt = () => ({ ...result([element("eligibility", privateText)]), reply: privateText });
  const failure = (input: Parameters<typeof retainScientificDiscussionResult>[0]) => {
    try { retainScientificDiscussionResult(input); throw new Error("EXPECTED_REJECTION"); }
    catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe("SCIENTIFIC_DISCUSSION_RETENTION_INVALID");
      const diagnostic = scientificDiscussionRetentionFailureDiagnostic(error);
      expect(diagnostic).not.toBeNull();
      const encoded = JSON.stringify(diagnostic);
      expect(encoded.length).toBeLessThan(1024);
      expect(encoded).not.toContain(privateText);
      expect(encoded).not.toContain(secret);
      expect(encoded).not.toContain("PRIVATE_SOURCE_CANARY");
      expect(Object.keys(diagnostic!).sort()).toEqual(["contract", "failedField", "failedInvariant", "failedValueClass",
        "firstFailedBranch", "firstFailedValidator"].sort());
      return diagnostic!;
    }
  };
  it("attributes separate coverage, identity, closure and disposition failures without source values", () => {
    const badIds = scientificReceipt(); badIds.userContribution.elements.push(element("eligibility", secret));
    const badReason = scientificReceipt(); badReason.userContribution.nonPersistentReason = "PRESENTATION_ONLY";
    const empty = result(); empty.reply = privateText; empty.userContribution.nonPersistentReason = null;
    const badLink = scientificReceipt(); badLink.userContribution.elements[0].linkedIds = [secret];
    const badDisposition = scientificReceipt(); badDisposition.dispositions = [{ elementRef: secret, status: "CLOSED",
      replacementId: null, explicitUserDirection: true }];
    const badCandidate = scientificReceipt(); badCandidate.candidateBindings = [{ elementRef: secret, candidateRef: secret, changeRef: secret }];
    const diagnostics = [badIds, badReason, empty, badLink, badDisposition, badCandidate].map(value => failure(inputFor(value)));
    expect(diagnostics.map(d => d.firstFailedBranch)).toEqual(["CONTRIBUTION_ELEMENT_IDS", "CONTRIBUTION_REASON_WITH_MEANING",
      "CONTRIBUTION_COMPLETE_EMPTY", "CONTRIBUTION_LINK_CLOSURE", "DISPOSITION_TARGET", "CANDIDATE_TARGET"]);
    expect(new Set(diagnostics.map(d => d.failedInvariant)).size).toBe(6);
    expect(diagnostics[3]).toMatchObject({ failedField: "result.userContribution.elements[].linkedIds",
      failedValueClass: "UNRESOLVED_REFERENCE", firstFailedValidator: "retainScientificDiscussionResult" });
  });
  it("distinguishes assistant closure from user closure and preserves first-failure ordering", () => {
    const value = scientificReceipt(); value.assistantContribution = { coverage: "COMPLETE", nonPersistentReason: null,
      elements: [{ ...element("proposal", privateText), linkedIds: [secret] }] };
    expect(failure(inputFor(value)).failedField).toBe("result.assistantContribution.elements[].linkedIds");
    value.userContribution.nonPersistentReason = "NO_SCIENTIFIC_MEANING";
    expect(failure(inputFor(value)).firstFailedBranch).toBe("CONTRIBUTION_REASON_WITH_MEANING");
  });
  it("does not expose arbitrary invalid schema values, unknown keys, or Zod messages", () => {
    const value = scientificReceipt();
    const diagnostic = failure(inputFor({ ...value, userContribution: { ...value.userContribution,
      coverage: secret }, [privateText]: secret }));
    expect(diagnostic).toMatchObject({ firstFailedBranch: "RESULT_SCHEMA", failedField: "result.userContribution.coverage",
      firstFailedValidator: "terraScientificResultSchema", failedValueClass: "INVALID_SCHEMA" });
    expect(failure(inputFor({ ...value, [privateText]: secret })).failedField).toBe("result");
    expect(scientificDiscussionRetentionFailureDiagnostic(new Error(secret))).toBeNull();
  });
  it("attributes invalid previous state to its existing validator, not the provider receipt", () => {
    const value = scientificReceipt(), input = inputFor(value);
    const state = retainScientificDiscussionResult(input);
    const next = inputFor(value);
    expect(failure({ ...next, state: { ...state, sourceCoverage: state.sourceCoverage.map(s => ({ ...s, sourceDigest: secret })) } }))
      .toMatchObject({ failedField: "state.sourceCoverage[].sourceDigest", firstFailedBranch: "STATE_SOURCE_DIGEST",
        failedValueClass: "DIGEST_MISMATCH", firstFailedValidator: "validateScientificDiscussionRetention" });
    expect(validateScientificDiscussionRetention(state, conversationId, input.runtimeTurns)).toBe(true);
  });
  it("preserves valid receipt acceptance, unresolved meaning and source binding exactly", () => {
    const value = scientificReceipt(), input = inputFor(value);
    const before = JSON.stringify(input);
    const state = retainScientificDiscussionResult(input);
    expect(state.elements).toHaveLength(1);
    expect(state.elements[0]).toMatchObject({ content: privateText, status: "PROPOSED_NOT_ADOPTED", candidateBinding: null });
    expect(state.elements[0].sourceDigest).toBe(logicalDigest(input.userTurn.content));
    expect(JSON.stringify(input)).toBe(before);
    expect(validateScientificDiscussionRetention(state, conversationId, input.runtimeTurns)).toBe(true);
  });
});
type Turn = ProductBridgeRequest["conversation"]["turns"][number];
const pair = (index: number, value: TerraScientificResult) => [behaviorTurn(`user-${index}`, `Source privée synthétique ${index}, ne pas recopier le transcript.`),
  { turnId: `assistant-${index}`, role: "NOXIA" as const, content: value.reply, createdAt: at }] as const;
const accept = (state: ScientificDiscussionRetention | undefined, turns: Turn[], value: TerraScientificResult, retained = []) => {
  const [userTurn, assistantTurn] = pair(turns.length / 2, value);
  turns.push(userTurn, assistantTurn);
  return retainScientificDiscussionResult({ state, conversationId, runtimeTurns: turns, userTurn, assistantTurn, result: value, retained });
};
const request = (turns: Turn[], retention?: ScientificDiscussionRetention, project: ProductBridgeRequest["currentProject"] = null,
  retained: Parameters<typeof buildScientificDiscussionContext>[0]["retained"] = []): ProductBridgeRequest => ({
  apiVersion: "1.0.0", conversation: { conversationId, language: "fr", turns }, currentProject: project, evaluatePersistentDelta: false,
  scientificDiscussionContext: buildScientificDiscussionContext({ conversationId, runtimeTurns: turns, currentProject: project, retained, retention }),
});
const packet = (r: ProductBridgeRequest) => JSON.parse(prepareTerraConversation(r).context);
afterEach(() => { vi.unstubAllGlobals(); });

// CURRENT_STRUCTURAL_INVARIANT: reference scope, not scientific similarity.
describe("Scientific Thinking producer local-link contract", () => {
  it("rejects the real cross-contribution graph without rewriting the receipt", () => {
    const receipt = failedScientificReceiptLinkFixture(), before = JSON.stringify(receipt);
    expect(terraScientificResultSchema.safeParse(receipt).success).toBe(true);
    try { accept(undefined, [], receipt); throw new Error("EXPECTED_REJECTION"); }
    catch (error) {
      expect(scientificDiscussionRetentionFailureDiagnostic(error)).toMatchObject({
        failedField: "result.assistantContribution.elements[].linkedIds", failedValueClass: "UNRESOLVED_REFERENCE",
        failedInvariant: "EVERY_LINKED_ID_RESOLVES_WITHIN_CONTRIBUTION", firstFailedBranch: "CONTRIBUTION_LINK_CLOSURE",
        firstFailedValidator: "retainScientificDiscussionResult",
      });
    }
    expect(JSON.stringify(receipt)).toBe(before);
  });
  it.each(["MISSING_TARGET", "PREVIOUS_CONTRIBUTION", "SOURCE_TURN_REF", "INVENTED_ID", "SOURCE_ELEMENT"] as const)(
    "keeps %s rejected at the unchanged retention owner", kind => {
      const turns: Turn[] = [];
      const state = accept(undefined, turns, result([element("previous-only", "Une condition antérieure reste active.")]));
      const targets = { MISSING_TARGET: "a-not-emitted", PREVIOUS_CONTRIBUTION: state.elements[0].ref,
        SOURCE_TURN_REF: turns[0].turnId, INVENTED_ID: "invented-concept-label", SOURCE_ELEMENT: "u1" };
      const receipt = scientificReceiptLinkFixture([[targets[kind]], [], ["a1"]]);
      const before = JSON.stringify({ state, receipt });
      expect(() => accept(state, turns, receipt)).toThrow("SCIENTIFIC_DISCUSSION_RETENTION_INVALID");
      expect(JSON.stringify({ state, receipt })).toBe(before);
    });
  it("accepts separately authored local links without adopting or losing unresolved meaning", () => {
    const receipt = validScientificReceiptLinkFixture(), turns: Turn[] = [], before = JSON.stringify(receipt);
    const state = accept(undefined, turns, receipt);
    expect(state.elements).toHaveLength(4);
    const assistant = state.elements.filter(e => e.sourceTurnRef === turns[1].turnId);
    expect(assistant[2].linkedRefs).toEqual([assistant[0].ref, assistant[1].ref]);
    expect(assistant[0].conditions).toHaveLength(1);
    expect(assistant[2].status).toBe("OPEN_UNKNOWN");
    expect(state.elements.some(e => e.status === "ADOPTED")).toBe(false);
    expect(validateScientificDiscussionRetention(state, conversationId, turns)).toBe(true);
    expect(JSON.stringify(receipt)).toBe(before);
  });
  it("accepts empty linkedIds without dropping the scientific elements", () => {
    const state = accept(undefined, [], scientificReceiptLinkFixture([[], [], []]));
    expect(state.elements).toHaveLength(4);
    expect(state.elements.every(e => e.linkedRefs.length === 0)).toBe(true);
  });
  it("transmits explicit local-scope instructions and schema descriptions upstream", () => {
    const prepared = prepareTerraConversation(request([behaviorTurn("link-contract", "Discuter d’un projet en IRM cardiaque.")]));
    expect(prepared.instruction).toContain("LIENS INTERNES AUX CONTRIBUTIONS");
    expect(prepared.instruction).toContain("même contribution");
    expect(prepared.instruction).toContain("linkedIds=[]");
    const schema = terraScientificResultJsonSchema();
    for (const key of ["userContribution", "assistantContribution"] as const) {
      expect(schema).toMatchObject({ properties: { [key]: { properties: { elements: { items: { properties: {
        id: { description: expect.stringContaining("same contribution") },
        linkedIds: { description: expect.stringMatching(/actually emitted.*previous.*\[\]/) },
      } } } } } } });
    }
  });
});

describe("first-owner Scientific Thinking coverage and existing retained lifecycle", () => {
  it("uses the same strict native/provider result contract, without changing output budgets", () => {
    expect(terraScientificResultSchema.parse(result())).toEqual(result());
    const schema = terraScientificResultJsonSchema();
    expect(schema.additionalProperties).toBe(false);
    expect(schema.required).toContain("userContribution");
    expect(schema.required).toContain("assistantContribution");
  });
  it("recent unowned sources remain available, but an aged orphan fails closed without fetching", () => {
    const fetch = vi.fn(() => { throw new Error("FORBIDDEN"); }); vi.stubGlobal("fetch", fetch);
    const turns: Turn[] = [behaviorTurn("orphan", "Condition scientifique active non adoptée.")];
    expect(packet(request(turns)).RECENT_CONVERSATION[0].content).toContain("Condition");
    for (let i = 0; i < 12; i++) turns.push({ turnId: `old-${i}`, role: "NOXIA", content: "Sans reçu", createdAt: at });
    expect(() => packet(request(turns))).toThrow("CONTEXT_COVERAGE_INVARIANT_FAILED");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("seven ordinary response receipts retain the first condition after raw eviction, without adoption", () => {
    const turns: Turn[] = []; let state: ScientificDiscussionRetention | undefined;
    for (let i = 0; i < 7; i++) state = accept(state, turns, result(i ? [] : [element("condition", "Contrôle indépendant si anomalie ; aucun traitement automatique.")]));
    const r = request(turns, state); const before = logicalDigest(r); const p = packet(r);
    expect(p.RECENT_CONVERSATION).toHaveLength(10);
    expect(p.RECENT_CONVERSATION.some(t => t.ref === turns[0].turnId)).toBe(false);
    expect(p.CURRENT_PROJECT).toBeNull();
    expect(p.CURRENT_DISCUSSION.retainedMeaning[0].content).toContain("aucun traitement");
    expect(p.CURRENT_DISCUSSION.retainedMeaning[0].conditions).toHaveLength(1);
    expect(p.UNPROJECTED_USER_CONTEXT).toBeUndefined();
    expect(JSON.stringify(p)).not.toContain(turns[0].content);
    expect(logicalDigest(r)).toBe(before);
  });
  it("partial owner coverage never certifies the full turn, even with Project provenance", () => {
    const turns: Turn[] = []; const partial = result([element("one", "Une partie seulement.")]); partial.userContribution.coverage = "PARTIAL";
    let state = accept(undefined, turns, partial);
    for (let i = 0; i < 6; i++) state = accept(state, turns, result());
    expect(() => packet(request(turns, state))).toThrow("CONTEXT_COVERAGE_INVARIANT_FAILED");
  });
  it("does not infer NON_PERSISTENT from an empty or absent response", () => {
    const value = result(); value.userContribution.nonPersistentReason = null;
    expect(() => accept(undefined, [], value)).toThrow("SCIENTIFIC_DISCUSSION_RETENTION_INVALID");
  });
  it("A→B supersession preserves provenance, only B remains active, and rejection is partial", () => {
    const turns: Turn[] = []; const initial = result([element("A", "Condition A"), element("residual", "Point non résolu")]);
    let state = accept(undefined, turns, initial); const a = state.elements[0];
    const next = result([element("B", "Condition B")]); next.dispositions = [{ elementRef: a.ref, status: "SUPERSEDED", replacementId: "B", explicitUserDirection: true }];
    state = accept(state, turns, next);
    expect(activeScientificDiscussionRetention(state, [], null).map(e => e.content)).toEqual(["Point non résolu", "Condition B"]);
    expect(state.elements[0].status).toBe("SUPERSEDED"); expect(state.elements[0].sourceDigest).toBe(logicalDigest(turns[0].content));
    const rejection = result(); rejection.dispositions = [{ elementRef: state.elements[1].ref, status: "REJECTED", replacementId: null, explicitUserDirection: true }];
    state = accept(state, turns, rejection);
    for (let i = 0; i < 6; i++) state = accept(state, turns, result());
    const p = packet(request(turns, state));
    expect(p.CURRENT_DISCUSSION.retainedMeaning.map(e => e.content)).toEqual(["Condition B"]);
    expect(JSON.stringify(p.CURRENT_DISCUSSION)).not.toContain("Condition A");
  });
  it("rejects forged source digests, dangling links, absent supersession targets and unknown dispositions", () => {
    const turns: Turn[] = []; const state = accept(undefined, turns, result([element("A", "Condition A")]));
    expect(validateScientificDiscussionRetention({ ...state, sourceCoverage: state.sourceCoverage.map(s => ({ ...s, sourceDigest: "forged" })) }, conversationId, turns)).toBe(false);
    const badLink = result([{ ...element("B", "Condition B"), linkedIds: ["missing"] }]);
    expect(() => accept(state, [...turns], badLink)).toThrow();
    const badDisposition = result(); badDisposition.dispositions = [{ elementRef: "missing", status: "CLOSED", replacementId: null, explicitUserDirection: true }];
    expect(() => accept(state, [...turns], badDisposition)).toThrow();
  });
  it("candidate binding alone stays pending; exact human adoption disposes only its bound element", () => {
    const turns: Turn[] = []; let state = accept(undefined, turns, result([element("condition", "Contrôle indépendant."), element("residual", "Condition non adoptée.")]));
    const source = turns[0];
    const contribution = behaviorContribution({ contributionId: "retention-adoption", turns: [source], candidateObjects: [
      behaviorItem({ itemId: "control", proposedType: "PROJECT_INFORMATION", content: "Contrôle indépendant.", turnId: source.turnId })] });
    const candidate = prepareResearchProjectContributionCandidate(contribution, null);
    let retained = retainValidatedContributionCandidate({ retained: [], contribution, candidate, sourceTurnRef: source.turnId,
      validation: { valid: true, blocks: [] }, validatorRef: "PRJ_NATIVE", baseProject: null, dependencyBindings: [], traceRunId: null, retainedAt: at });
    const value = result(); value.candidateBindings = [{ elementRef: state.elements[0].ref, candidateRef: retained[0].candidateRef,
      changeRef: candidate.canonicalChangeSet.objectChanges[0].changeRef }];
    const [userTurn, assistantTurn] = pair(1, value); turns.push(userTurn, assistantTurn);
    state = retainScientificDiscussionResult({ state, conversationId, runtimeTurns: turns, userTurn, assistantTurn, result: value, retained });
    retained = markContributionCandidatePresented({ retained, candidateRef: retained[0].candidateRef, presentedAt: at });
    expect(activeScientificDiscussionRetention(state, retained, null)).toHaveLength(2);
    const project = adoptBehaviorContribution(contribution, null, 1);
    retained = recordContributionCandidateHumanDecision({ retained, candidateRef: retained[0].candidateRef, decision: project.confirmationDecision });
    expect(activeScientificDiscussionRetention(state, retained, project).map(e => e.content)).toEqual(["Condition non adoptée."]);
    expect(packet(request(turns, state, project, retained)).CURRENT_PROJECT.decisions.some(e => e.content === "Contrôle indépendant.")).toBe(true);
  });
  it("keeps closed history out of the packet at fixed active context for 10→1280 entries", () => {
    const measurements: Record<string, number> = {};
    for (const count of [10, 20, 40, 80, 160, 320, 640, 1280]) {
      const turns: Turn[] = []; let state: ScientificDiscussionRetention | undefined;
      for (let i = 0; i < count / 2; i++) state = accept(state, turns, result());
      const r = request(turns, state);
      let history = 0; const prepared = prepareTerraConversation(r, false, m => { history = m.conversationHistoryBytes + m.currentUserMessageBytes; });
      measurements[count] = history;
      expect(JSON.parse(prepared.context).RECENT_CONVERSATION).toHaveLength(10);
      expect(new TextEncoder().encode(prepared.context).length).toBeLessThan(80000);
    }
    expect(Math.max(...Object.values(measurements)) - Math.min(...Object.values(measurements))).toBeLessThan(40);
    console.info("M3_HISTORY_BYTES=" + JSON.stringify(measurements));
  });
});
