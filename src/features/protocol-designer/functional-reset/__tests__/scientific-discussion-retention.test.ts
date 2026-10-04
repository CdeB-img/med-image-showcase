import { afterEach, describe, expect, it, vi } from "vitest";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { prepareTerraConversation } from "@/features/scientific-thinking/scientific-collaborator-conversation";
import { prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import { buildScientificDiscussionContext } from "../contribution-discussion-context";
import { retainValidatedContributionCandidate, markContributionCandidatePresented, recordContributionCandidateHumanDecision } from "../contribution-lifecycle";
import { emptyScientificDiscussionRetention, retainScientificDiscussionResult, activeScientificDiscussionRetention,
  validateScientificDiscussionRetention, terraScientificResultJsonSchema, terraScientificResultSchema,
  type TerraScientificResult, type ScientificDiscussionRetention } from "../contribution-discussion-retention";
import { behaviorTurn, behaviorContribution, behaviorItem, adoptBehaviorContribution } from "./p1-behavior-01a-contract-fixtures";
import type { ProductBridgeRequest } from "../../product-bridge";

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
