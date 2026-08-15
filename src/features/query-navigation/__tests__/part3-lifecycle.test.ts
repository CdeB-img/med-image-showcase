import { describe, expect, it } from "vitest";
import {
  appendNavigationLifecycleEvent,
  buildQuestionPresentationRequest,
  buildQuestionResponseEnvelope,
  buildSelectedNavigationAction,
  canPresentNavigationAction,
  createQueryNavigationMemory,
  detectDuplicateNavigationNeed,
  detectDuplicateQuestionAction,
  inspectNavigationActionFreshness,
  isNavigationNeedAlreadyResolved,
  rememberAuthoritativeResolution,
  rememberQuestionPresentation,
  rememberQuestionResponse,
  rememberSelectedNavigationAction,
  replayQueryNavigationLifecycle,
  selectNextAction,
  validateQueryNavigationMemory,
  type QueryNavigationLifecycleEvent,
} from "..";
import { TWO_OPTIONS_STATE, USER_UNKNOWN_STATE, makeContext } from "./fixtures";

const fixture = (state = USER_UNKNOWN_STATE) => {
  const selection = selectNextAction(makeContext(state));
  const action = buildSelectedNavigationAction(selection);
  const candidate = selection.selected!;
  const presentation = buildQuestionPresentationRequest(action, candidate);
  return { selection, action, candidate, presentation };
};

const eventFor = (actionRef: string, eventType: QueryNavigationLifecycleEvent["eventType"], overrides: Partial<Omit<QueryNavigationLifecycleEvent, "eventId" | "sequence" | "projectWriteAuthorized">> = {}) => ({
  eventType,
  actionRef,
  presentationRef: null,
  responseRef: null,
  projectRef: "project:fixture",
  projectVersion: "v1",
  sourceStateDigest: "digest",
  reason: eventType,
  evidenceRefs: [],
  recordedAt: "2026-08-15T08:00:00.000Z",
  ...overrides,
});

describe("QRY-001 Part 3 — lifecycle", () => {
  it("QRY3-LIFE-C01 Selected is not resolved", () => { const { action } = fixture(); expect(action.lifecycleStatus).toBe("SELECTED"); expect(isNavigationNeedAlreadyResolved(action, createQueryNavigationMemory(action.projectRef, action.projectVersion))).toBe(false); });
  it("QRY3-LIFE-C02 Presented is not answered", () => { const { action } = fixture(); const memory = appendNavigationLifecycleEvent(createQueryNavigationMemory(action.projectRef, action.projectVersion), eventFor(action.selectedActionId, "ACTION_PRESENTED")); expect(replayQueryNavigationLifecycle(memory).actionStates[action.selectedActionId]).toBe("PRESENTED"); });
  it("QRY3-LIFE-C03 Response received is not Project adopted", () => { const { action } = fixture(); const memory = appendNavigationLifecycleEvent(createQueryNavigationMemory(action.projectRef, action.projectVersion), eventFor(action.selectedActionId, "RESPONSE_RECEIVED")); expect(replayQueryNavigationLifecycle(memory).actionStates[action.selectedActionId]).toBe("ANSWERED"); expect(memory.sourceOfTruth).toBe(false); });
  it("QRY3-LIFE-C04 Deferred remains unresolved", () => { const { action } = fixture(); const memory = appendNavigationLifecycleEvent(createQueryNavigationMemory(action.projectRef, action.projectVersion), eventFor(action.selectedActionId, "ACTION_DEFERRED")); expect(canPresentNavigationAction(action, memory)).toBe(false); expect(isNavigationNeedAlreadyResolved(action, memory)).toBe(false); });
  it("QRY3-LIFE-C05 Declined remains traced", () => { const { action } = fixture(); const memory = appendNavigationLifecycleEvent(createQueryNavigationMemory(action.projectRef, action.projectVersion), eventFor(action.selectedActionId, "ACTION_DECLINED")); expect(memory.events[0]?.reason).toBe("ACTION_DECLINED"); });
  it("QRY3-LIFE-C06 Cannot answer preserves unknown", () => { const { action } = fixture(); const memory = appendNavigationLifecycleEvent(createQueryNavigationMemory(action.projectRef, action.projectVersion), eventFor(action.selectedActionId, "RESPONSE_RECEIVED", { reason: "CANNOT_ANSWER" })); expect(memory.resolutionRefs).toEqual([]); });
  it("QRY3-LIFE-C07 Superseded is not presented", () => { const { action } = fixture(); const memory = appendNavigationLifecycleEvent(createQueryNavigationMemory(action.projectRef, action.projectVersion), eventFor(action.selectedActionId, "ACTION_SUPERSEDED")); expect(canPresentNavigationAction(action, memory)).toBe(false); });
  it("QRY3-LIFE-C08 Invalidated is not presented", () => { const { action } = fixture(); const memory = appendNavigationLifecycleEvent(createQueryNavigationMemory(action.projectRef, action.projectVersion), eventFor(action.selectedActionId, "ACTION_INVALIDATED")); expect(canPresentNavigationAction(action, memory)).toBe(false); });
  it("QRY3-LIFE-C09 History is immutable by append", () => { const { action } = fixture(); const initial = createQueryNavigationMemory(action.projectRef, action.projectVersion); const before = JSON.stringify(initial); appendNavigationLifecycleEvent(initial, eventFor(action.selectedActionId, "ACTION_SELECTED")); expect(JSON.stringify(initial)).toBe(before); });
  it("QRY3-LIFE-C10 New Project version requires reevaluation", () => { const { action } = fixture(); expect(inspectNavigationActionFreshness(action, { projectVersion: "v2", sourceStateDigest: action.sourceStateDigest }).status).toBe("STALE_PROJECT_VERSION"); });
});

describe("QRY-001 Part 3 — memory and structural deduplication", () => {
  it("QRY3-MEM-C01 same need target decision gives same identity", () => { const left = fixture().action; const right = fixture().action; expect(detectDuplicateNavigationNeed(left, right)).toBe(true); });
  it("QRY3-MEM-C02 different wording creates no new action", () => { const first = fixture(); const selection = structuredClone(first.selection); selection.selected!.explanation = "Autre formulation"; const second = buildSelectedNavigationAction(selection); expect(second.selectedActionId).toBe(first.action.selectedActionId); });
  it("QRY3-MEM-C03 same wording with different needs remains different", () => { const first = fixture().action; const selection = selectNextAction(makeContext({ ...USER_UNKNOWN_STATE, projectUnknowns: [{ ...USER_UNKNOWN_STATE.projectUnknowns[0]!, ref: "other", decisionRefs: ["other"] }] })); const second = buildSelectedNavigationAction(selection); expect(detectDuplicateNavigationNeed(first, second)).toBe(false); });
  it("QRY3-MEM-C04 answered need is not re-presented after authoritative resolution", () => { const { action } = fixture(); const memory = rememberAuthoritativeResolution(createQueryNavigationMemory(action.projectRef, action.projectVersion), action.navigationNeedRefs[0]!, "project:v2"); expect(canPresentNavigationAction(action, memory)).toBe(false); });
  it("QRY3-MEM-C05 deferred is not re-presented without trigger", () => { const { action } = fixture(); const memory = appendNavigationLifecycleEvent(createQueryNavigationMemory(action.projectRef, action.projectVersion), eventFor(action.selectedActionId, "ACTION_DEFERRED")); expect(canPresentNavigationAction(action, memory)).toBe(false); expect(canPresentNavigationAction(action, memory, ["trigger:changed"])).toBe(true); });
  it("QRY3-MEM-C06 declined does not loop", () => { const { action } = fixture(); const memory = appendNavigationLifecycleEvent(createQueryNavigationMemory(action.projectRef, action.projectVersion), eventFor(action.selectedActionId, "ACTION_DECLINED")); expect(canPresentNavigationAction(action, memory)).toBe(false); });
  it("QRY3-MEM-C07 superseded does not loop", () => { const { action } = fixture(); const memory = appendNavigationLifecycleEvent(createQueryNavigationMemory(action.projectRef, action.projectVersion), eventFor(action.selectedActionId, "ACTION_SUPERSEDED")); expect(canPresentNavigationAction(action, memory)).toBe(false); });
  it("QRY3-MEM-C08 branch scope participates in identity", () => { const first = fixture(); const secondSelection = structuredClone(first.selection); secondSelection.selected!.affectedBranchRefs = ["branch:other"]; const second = buildSelectedNavigationAction(secondSelection); expect(second.selectedActionId).not.toBe(first.action.selectedActionId); });
  it("QRY3-MEM-C09 global resolved fact is reusable", () => { const { action } = fixture(); const memory = rememberAuthoritativeResolution(createQueryNavigationMemory(action.projectRef, action.projectVersion), action.navigationNeedRefs[0]!, "project:fact"); expect(isNavigationNeedAlreadyResolved(action, memory)).toBe(true); });
  it("QRY3-MEM-C10 no fuzzy matching is used", () => { const first = fixture().action; const second = { ...first, selectedActionId: "other", navigationNeedRefs: ["almost-the-same"] }; expect(detectDuplicateNavigationNeed(first, second)).toBe(false); });
  it("duplicate presentation uses structured identity", () => { const { action, presentation } = fixture(); let memory = rememberSelectedNavigationAction(createQueryNavigationMemory(action.projectRef, action.projectVersion), action); memory = rememberQuestionPresentation(memory, presentation); expect(detectDuplicateQuestionAction(action, presentation, memory)).toBe(true); });
  it("memory digest remains valid after selected action, presentation and response", () => { const { action, presentation } = fixture(); const response = buildQuestionResponseEnvelope({ responseId: "response:1", selectedActionRef: action.selectedActionId, presentationRef: presentation.presentationId, projectRef: action.projectRef, projectVersionAtPresentation: action.projectVersion, responseKind: presentation.expectedAnswerKind, rawResponse: "Answer", actorRef: "human:1", actorRole: "RESEARCHER", selectedOptionRefs: [], disposition: "ANSWER", receivedAt: "2026-08-15", provenanceRefs: ["human:1"] }); let memory = rememberSelectedNavigationAction(createQueryNavigationMemory(action.projectRef, action.projectVersion), action); memory = rememberQuestionPresentation(memory, presentation); memory = rememberQuestionResponse(memory, response); expect(validateQueryNavigationMemory(memory).valid).toBe(true); });
  it("causal event order is validated", () => { const { action } = fixture(); const memory = appendNavigationLifecycleEvent(createQueryNavigationMemory(action.projectRef, action.projectVersion), eventFor(action.selectedActionId, "ACTION_SELECTED")); const invalid = { ...memory, events: [{ ...memory.events[0]!, sequence: 3 }], digest: memory.digest }; expect(validateQueryNavigationMemory(invalid).valid).toBe(false); });
  it("two-option action uses structured answer contract", () => expect(fixture(TWO_OPTIONS_STATE).presentation.expectedAnswerKind).toBe("SINGLE_OPTION"));
});
