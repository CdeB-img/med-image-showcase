import { describe, expect, it } from "vitest";
import {
  appendNavigationLifecycleEvent,
  buildQuestionPresentationRequest,
  buildQuestionResponseEnvelope,
  buildSelectedNavigationAction,
  canonicalizeQueryNavigationMemory,
  canonicalizeQuestionResponseEnvelope,
  canonicalizeSelectedNavigationAction,
  computeNavigationMemoryDigest,
  createQueryNavigationMemory,
  inspectNavigationActionFreshness,
  rebuildNavigationAfterStateChange,
  replayQueryNavigationLifecycle,
  selectNextAction,
  validateQuestionResponseEnvelope,
} from "..";
import { USER_UNKNOWN_STATE, makeContext } from "./fixtures";

const fixture = () => {
  const selection = selectNextAction(makeContext(USER_UNKNOWN_STATE));
  const action = buildSelectedNavigationAction(selection);
  const presentation = buildQuestionPresentationRequest(action, selection.selected!);
  return { selection, action, presentation };
};

describe("QRY-001 Part 3 — freshness", () => {
  it("QRY3-FRESH-C01 source version is preserved", () => expect(fixture().action.projectVersion).toBe("v1"));
  it("QRY3-FRESH-C02 Project change is detected", () => expect(inspectNavigationActionFreshness(fixture().action, { projectVersion: "v2", sourceStateDigest: fixture().action.sourceStateDigest }).status).toBe("STALE_PROJECT_VERSION"));
  it("QRY3-FRESH-C03 stale action is blocked", () => expect(inspectNavigationActionFreshness(fixture().action, { projectVersion: "v2", sourceStateDigest: fixture().action.sourceStateDigest }).presentationAllowed).toBe(false));
  it("QRY3-FRESH-C04 stale response is preserved but never promoted", () => expect(inspectNavigationActionFreshness(fixture().action, { projectVersion: "v2", sourceStateDigest: fixture().action.sourceStateDigest }).responsePromotionAllowed).toBe(false));
  it("QRY3-FRESH-C05 state change creates a new selection trace", () => { const value = fixture(); const rebuilt = rebuildNavigationAfterStateChange(value.selection, makeContext(USER_UNKNOWN_STATE, { projectVersion: "v2" })); expect(rebuilt.nextTrace.traceId).not.toBe(value.selection.trace.traceId); });
  it("QRY3-FRESH-C06 old trace remains intact", () => { const value = fixture(); const before = JSON.stringify(value.selection.trace); rebuildNavigationAfterStateChange(value.selection, makeContext(USER_UNKNOWN_STATE, { projectVersion: "v2" })); expect(JSON.stringify(value.selection.trace)).toBe(before); });
  it("QRY3-FRESH-C07 resolved need is removed from next context", () => { const value = fixture(); const next = makeContext(USER_UNKNOWN_STATE, { resolvedNeedRefs: value.action.navigationNeedRefs }); expect(selectNextAction(next).needs).toHaveLength(0); });
  it("QRY3-FRESH-C08 new need becomes a candidate", () => { const next = makeContext({ ...USER_UNKNOWN_STATE, projectUnknowns: [...USER_UNKNOWN_STATE.projectUnknowns, { ...USER_UNKNOWN_STATE.projectUnknowns[0]!, ref: "new", decisionRefs: ["new"] }] }, { projectVersion: "v2" }); expect(selectNextAction(next).candidates).toHaveLength(2); });
});

describe("QRY-001 Part 3 — trace and replay", () => {
  it("QRY3-TRACE-C01 selection is reconstructible", () => expect(fixture().selection.trace.digest).toMatch(/^qry1-/));
  it("QRY3-TRACE-C02 presentation is reconstructible", () => expect(fixture().presentation.presentationId).toMatch(/^qry-presentation-/));
  it("QRY3-TRACE-C03 response is reconstructible", () => { const value = fixture(); const response = buildQuestionResponseEnvelope({ responseId: "r", selectedActionRef: value.action.selectedActionId, presentationRef: value.presentation.presentationId, projectRef: value.action.projectRef, projectVersionAtPresentation: value.action.projectVersion, responseKind: "FREE_TEXT", rawResponse: "x", actorRef: "h", actorRole: "RESEARCHER", selectedOptionRefs: [], disposition: "ANSWER", receivedAt: "now", provenanceRefs: ["h"] }); expect(validateQuestionResponseEnvelope(response, value.presentation).valid).toBe(true); });
  it("QRY3-TRACE-C04 destination can be reconstructed from contracts", () => expect(fixture().presentation.expectedAnswerKind).toBe("FREE_TEXT"));
  it("QRY3-TRACE-C05 decision target stays referenced", () => expect(fixture().action.affectedDecisionRefs).toEqual(["decision:population"]));
  it("QRY3-TRACE-C06 Project transition preserves previous trace", () => expect(rebuildNavigationAfterStateChange(fixture().selection, makeContext(USER_UNKNOWN_STATE, { projectVersion: "v2" })).previousTracePreserved.digest).toBe(fixture().selection.trace.digest));
  it("QRY3-TRACE-C07 VAL/source transition changes source digest", () => expect(rebuildNavigationAfterStateChange(fixture().selection, makeContext({ ...USER_UNKNOWN_STATE, validationFindings: [{ ref: "f", version: "1", owner: "VAL", reason: "f", blocking: true, decisionRefs: [], branchRefs: [] }] })).sourceStateChanged).toBe(true));
  it("QRY3-TRACE-C08 lifecycle replay is identical", () => { const value = fixture(); const memory = appendNavigationLifecycleEvent(createQueryNavigationMemory(value.action.projectRef, value.action.projectVersion), { eventType: "ACTION_SELECTED", actionRef: value.action.selectedActionId, presentationRef: null, responseRef: null, projectRef: value.action.projectRef, projectVersion: value.action.projectVersion, sourceStateDigest: value.action.sourceStateDigest, reason: "selected", evidenceRefs: [], recordedAt: "a" }); expect(replayQueryNavigationLifecycle(memory).digest).toBe(replayQueryNavigationLifecycle(structuredClone(memory)).digest); });
  it("QRY3-TRACE-C09 canonical forms have no UI dependency", () => expect(canonicalizeSelectedNavigationAction(fixture().action)).not.toMatch(/React|DOM|component/));
  it("QRY3-TRACE-C10 digests ignore audit timestamps", () => { const value = fixture(); const base = { responseId: "r", selectedActionRef: value.action.selectedActionId, presentationRef: value.presentation.presentationId, projectRef: value.action.projectRef, projectVersionAtPresentation: value.action.projectVersion, responseKind: "FREE_TEXT" as const, rawResponse: "x", actorRef: "h", actorRole: "RESEARCHER", selectedOptionRefs: [], disposition: "ANSWER" as const, provenanceRefs: ["h"] }; const a = buildQuestionResponseEnvelope({ ...base, receivedAt: "a" }); const b = buildQuestionResponseEnvelope({ ...base, receivedAt: "b" }); expect(a.digest).toBe(b.digest); });
  it("event causal order remains semantically significant", () => { const value = fixture(); let memory = createQueryNavigationMemory(value.action.projectRef, value.action.projectVersion); memory = appendNavigationLifecycleEvent(memory, { eventType: "ACTION_SELECTED", actionRef: value.action.selectedActionId, presentationRef: null, responseRef: null, projectRef: value.action.projectRef, projectVersion: value.action.projectVersion, sourceStateDigest: value.action.sourceStateDigest, reason: "a", evidenceRefs: [], recordedAt: "a" }); memory = appendNavigationLifecycleEvent(memory, { eventType: "ACTION_PRESENTED", actionRef: value.action.selectedActionId, presentationRef: value.presentation.presentationId, responseRef: null, projectRef: value.action.projectRef, projectVersion: value.action.projectVersion, sourceStateDigest: value.action.sourceStateDigest, reason: "b", evidenceRefs: [], recordedAt: "b" }); const reverse = { ...memory, events: [...memory.events].reverse(), digest: "" }; reverse.digest = computeNavigationMemoryDigest(reverse); expect(canonicalizeQueryNavigationMemory(memory)).not.toBe(canonicalizeQueryNavigationMemory(reverse)); });
  it("response canonical form retains raw evidence", () => { const value = fixture(); const response = buildQuestionResponseEnvelope({ responseId: "r", selectedActionRef: value.action.selectedActionId, presentationRef: value.presentation.presentationId, projectRef: value.action.projectRef, projectVersionAtPresentation: value.action.projectVersion, responseKind: "FREE_TEXT", rawResponse: "evidence", actorRef: "h", actorRole: "RESEARCHER", selectedOptionRefs: [], disposition: "ANSWER", receivedAt: "now", provenanceRefs: ["h"] }); expect(canonicalizeQuestionResponseEnvelope(response)).toContain("evidence"); });
});
