import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildHumanDecisionTargetFromNavigationAction,
  buildNavigationExecutionRequest,
  buildQuestionPresentationRequest,
  buildQuestionResponseEnvelope,
  buildSelectedNavigationAction,
  inspectNavigationActionFreshness,
  routeNavigationResponse,
  selectNextAction,
  validateQuestionPresentationRequest,
  validateQuestionResponseEnvelope,
  validateSelectedNavigationAction,
} from "..";
import { HUMAN_REVIEW_STATE, NOT_EVALUABLE_STATE, SEMANTIC_REVIEW_STATE, TWO_OPTIONS_STATE, USER_UNKNOWN_STATE, makeContext } from "./fixtures";

const fixture = (state = USER_UNKNOWN_STATE) => {
  const selection = selectNextAction(makeContext(state));
  const action = buildSelectedNavigationAction(selection);
  const candidate = selection.selected!;
  const presentation = buildQuestionPresentationRequest(action, candidate);
  const response = buildQuestionResponseEnvelope({ responseId: "response:1", selectedActionRef: action.selectedActionId, presentationRef: presentation.presentationId, projectRef: action.projectRef, projectVersionAtPresentation: action.projectVersion, responseKind: presentation.expectedAnswerKind, rawResponse: presentation.expectedAnswerKind === "FREE_TEXT" ? "Population adulte" : "option:a", actorRef: "human:1", actorRole: "RESEARCHER", selectedOptionRefs: presentation.expectedAnswerKind === "FREE_TEXT" ? [] : ["option:a"], disposition: "ANSWER", receivedAt: "2026-08-15T08:00:00.000Z", provenanceRefs: ["human:1"] });
  const freshness = inspectNavigationActionFreshness(action, { projectVersion: action.projectVersion, sourceStateDigest: action.sourceStateDigest });
  return { selection, action, candidate, presentation, response, freshness };
};

const remakeResponse = (response: ReturnType<typeof buildQuestionResponseEnvelope>, overrides: Partial<Parameters<typeof buildQuestionResponseEnvelope>[0]>) => {
  const { digest: _digest, rawResponseIsProjectTruth: _truth, projectWriteAuthorized: _write, ...input } = response;
  return buildQuestionResponseEnvelope({ ...input, ...overrides });
};

describe("QRY-001 Part 3 — response envelopes and routing", () => {
  it("QRY3-RESP-C01 raw response is preserved", () => expect(fixture().response.rawResponse).toBe("Population adulte"));
  it("QRY3-RESP-C02 raw response is not Project truth", () => expect(fixture().response.rawResponseIsProjectTruth).toBe(false));
  it("QRY3-RESP-C03 free text routes to Scientific Interpretation", () => { const value = fixture(); expect(routeNavigationResponse(value.action, value.presentation, value.response, value.freshness).destination).toBe("SCIENTIFIC_INTERPRETATION"); });
  it("QRY3-RESP-C04 structured decision routes to Human Decision", () => { const value = fixture(TWO_OPTIONS_STATE); expect(routeNavigationResponse(value.action, value.presentation, value.response, value.freshness).destination).toBe("HUMAN_DECISION"); });
  it("QRY3-RESP-C05 defer routes only to lifecycle", () => { const value = fixture(); const response = remakeResponse(value.response, { disposition: "DEFER", responseId: "defer" }); expect(routeNavigationResponse(value.action, value.presentation, response, value.freshness).destination).toBe("NAVIGATION_LIFECYCLE_ONLY"); });
  it("QRY3-RESP-C06 decline routes only to lifecycle", () => { const value = fixture(); const response = remakeResponse(value.response, { disposition: "DECLINE", responseId: "decline" }); expect(routeNavigationResponse(value.action, value.presentation, response, value.freshness).destination).toBe("NAVIGATION_LIFECYCLE_ONLY"); });
  it("QRY3-RESP-C07 response form is validated, not scientific truth", () => expect(validateQuestionResponseEnvelope(fixture().response, fixture().presentation).valid).toBe(true));
  it("QRY3-RESP-C08 structured response without option is rejected", () => { const value = fixture(TWO_OPTIONS_STATE); const response = remakeResponse(value.response, { selectedOptionRefs: [] }); expect(validateQuestionResponseEnvelope(response, value.presentation).valid).toBe(false); });
  it("QRY3-RESP-C09 stale response is rejected", () => { const value = fixture(); const stale = inspectNavigationActionFreshness(value.action, { projectVersion: "v2", sourceStateDigest: value.action.sourceStateDigest }); expect(routeNavigationResponse(value.action, value.presentation, value.response, stale).destination).toBe("REJECTED_STALE_RESPONSE"); });
  it("QRY3-RESP-C10 no route authorizes Project write", () => { const value = fixture(); expect(routeNavigationResponse(value.action, value.presentation, value.response, value.freshness).projectWriteAuthorized).toBe(false); });
});

describe("QRY-001 Part 3 — Human Decision boundary", () => {
  it("QRY3-HUM-C01 QRY creates no HumanDecision", () => expect(buildHumanDecisionTargetFromNavigationAction(fixture(TWO_OPTIONS_STATE).action, "human:1", "mandate:1").boundary).toBe("TARGET_ONLY_HUMAN_DECISION_NOT_CREATED"));
  it("QRY3-HUM-C02 target is explicit", () => expect(buildHumanDecisionTargetFromNavigationAction(fixture(TWO_OPTIONS_STATE).action, "human:1", "mandate:1").decisionTargetRefs).toContain("decision:strategy"));
  it("QRY3-HUM-C03 actor is required", () => expect(() => buildHumanDecisionTargetFromNavigationAction(fixture(TWO_OPTIONS_STATE).action, "", "mandate:1")).toThrow("ACTOR_REQUIRED"));
  it("QRY3-HUM-C04 mandate is required", () => expect(() => buildHumanDecisionTargetFromNavigationAction(fixture(TWO_OPTIONS_STATE).action, "human:1", "")).toThrow("MANDATE_REQUIRED"));
  it("QRY3-HUM-C05 navigation preference is not scientific truth", () => expect(buildHumanDecisionTargetFromNavigationAction(fixture(TWO_OPTIONS_STATE).action, "human:1", "mandate:1").projectWriteAuthorized).toBe(false));
  it("QRY3-HUM-C06 VAL HumanReview remains VAL-owned", () => expect(fixture(HUMAN_REVIEW_STATE).action.owner).toBe("SCIENTIFIC_OWNER"));
  it("QRY3-HUM-C07 original trace is not modified", () => { const value = fixture(TWO_OPTIONS_STATE); const before = JSON.stringify(value.selection.trace); buildHumanDecisionTargetFromNavigationAction(value.action, "human:1", "mandate:1"); expect(JSON.stringify(value.selection.trace)).toBe(before); });
  it("QRY3-HUM-C08 only Project owner may apply", () => expect(buildHumanDecisionTargetFromNavigationAction(fixture(TWO_OPTIONS_STATE).action, "human:1", "mandate:1")).not.toHaveProperty("apply"));
});

describe("QRY-001 Part 3 — VAL boundaries", () => {
  it("QRY3-VAL-C01 pending S is preserved", () => expect(selectNextAction(makeContext(SEMANTIC_REVIEW_STATE)).trace.outcome).toBe("DEFERRED"));
  it("QRY3-VAL-C02 no provider is selected", () => expect(buildNavigationExecutionRequest(fixture().action, "SCIENTIFIC_INTERPRETATION", "Contribution").providerSelectionAuthorized).toBe(false));
  it("QRY3-VAL-C03 HumanReviewRequest becomes a human action", () => expect(fixture(HUMAN_REVIEW_STATE).action.actionCategory).toBe("REQUEST_HUMAN_DECISION"));
  it("QRY3-VAL-C04 unresolved finding is not altered", () => { const before = JSON.stringify(HUMAN_REVIEW_STATE); fixture(HUMAN_REVIEW_STATE); expect(JSON.stringify(HUMAN_REVIEW_STATE)).toBe(before); });
  it("QRY3-VAL-C05 response cannot close finding", () => expect(routeNavigationResponse(fixture().action, fixture().presentation, fixture().response, fixture().freshness)).not.toHaveProperty("findingStatus"));
  it("QRY3-VAL-C06 new run may change source digest", () => expect(makeContext(NOT_EVALUABLE_STATE).sourceStateDigest).not.toBe(makeContext({ ...NOT_EVALUABLE_STATE, validationGates: [{ ...NOT_EVALUABLE_STATE.validationGates[0]!, status: "ALLOWED", runRefs: ["run:1"] }] }).sourceStateDigest));
  it("QRY3-VAL-C07 NOT_EVALUABLE remains technical", () => expect(selectNextAction(makeContext(NOT_EVALUABLE_STATE)).selected?.capabilityRef).toBe("VALIDATION_RUNTIME"));
  it("QRY3-VAL-C08 technical limitation is not presented to researcher", () => expect(() => buildQuestionPresentationRequest(buildSelectedNavigationAction(selectNextAction(makeContext(NOT_EVALUABLE_STATE))), selectNextAction(makeContext(NOT_EVALUABLE_STATE)).selected!)).toThrow("NOT_PRESENTABLE"));
});

describe("QRY-001 Part 3 — contract validators and static boundaries", () => {
  it("selected action validates", () => expect(validateSelectedNavigationAction(fixture().action).valid).toBe(true));
  it("presentation validates", () => expect(validateQuestionPresentationRequest(fixture().presentation).valid).toBe(true));
  it("wrong response kind is rejected", () => { const value = fixture(); const response = remakeResponse(value.response, { responseKind: "BOOLEAN" }); expect(validateQuestionResponseEnvelope(response, value.presentation).valid).toBe(false); });
  it("execution request stays capability-only", () => expect(buildNavigationExecutionRequest(fixture().action, "SCIENTIFIC_INTERPRETATION", "Contribution")).not.toHaveProperty("model"));
  it("source scan contains no provider call, scientific parsing or write", () => { const source = ["lifecycle.ts", "response-routing.ts", "lifecycle-validation.ts"].map((name) => readFileSync(resolve(process.cwd(), "src/features/query-navigation", name), "utf8")).join("\n"); expect(source).not.toMatch(/fetch\s*\(|generateContent\s*\(|parseScientific|saveProject\s*\(|resolveValidationAfterHumanDecision\s*\(|createHumanDecisionCandidate\s*\(/); });
});
