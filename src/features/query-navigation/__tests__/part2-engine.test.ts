import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  INFORMATION_VALUE_LEXICOGRAPHIC_ORDER,
  buildNextActionCandidates,
  collectNavigationNeeds,
  compareActionCandidates,
  compareInformationValueLexicographically,
  computeNonDominatedActionSet,
  explainNavigationSelection,
  replayNavigationSelection,
  selectNextAction,
  validateNavigationSelection,
  type InformationValueVector,
  type NextActionCandidate,
} from "..";
import { HUMAN_REVIEW_STATE, NOT_EVALUABLE_STATE, SEMANTIC_REVIEW_STATE, TWO_OPTIONS_STATE, USER_UNKNOWN_STATE, makeContext, makeSourceState } from "./fixtures";

const candidateFor = (state = USER_UNKNOWN_STATE) => {
  const context = makeContext(state);
  return buildNextActionCandidates(context, collectNavigationNeeds(context))[0]!;
};

const withVector = (candidate: NextActionCandidate, vector: Partial<InformationValueVector>): NextActionCandidate => ({ ...candidate, candidateId: `${candidate.candidateId}:${Object.values(vector).join(":")}`, informationValue: { ...candidate.informationValue, ...vector } });

describe("QRY-001 Part 2 — eligibility and value", () => {
  it("QRY2-ELI-C01 open sourced user need is eligible", () => expect(candidateFor().eligibility).toBe("ELIGIBLE"));
  it("QRY2-ELI-C02 closed branch is removed before eligibility", () => expect(collectNavigationNeeds(makeContext(USER_UNKNOWN_STATE, { closedBranchRefs: ["branch:design"] }))).toHaveLength(0));
  it("QRY2-ELI-C03 deferred realized-time item is not immediate", () => { const state = makeSourceState({ readiness: [{ readinessId: "r", owner: "DM", sourceVersion: "1", status: "DEFERRED_TO_REALIZED_TIME", affectedBranchRefs: ["b"], decisionRefs: [], reason: "Later", sourceRef: "r" }] }); expect(candidateFor(state).eligibility).toBe("DEFERRED"); });
  it("QRY2-ELI-C04 semantic review disabled is deferred", () => expect(candidateFor(SEMANTIC_REVIEW_STATE).eligibility).toBe("DEFERRED"));
  it("QRY2-ELI-C05 technical prerequisite is eligible system action", () => expect(candidateFor(NOT_EVALUABLE_STATE)).toMatchObject({ eligibility: "ELIGIBLE", capabilityRef: "VALIDATION_RUNTIME" }));
  it("QRY2-ELI-C06 owner is mandatory", () => expect(candidateFor().owner).toBeTruthy());
  it("QRY2-ELI-C07 known resolved need is excluded", () => { const base = makeContext(USER_UNKNOWN_STATE); const ref = collectNavigationNeeds(base)[0]!.needId; expect(collectNavigationNeeds(makeContext(USER_UNKNOWN_STATE, { resolvedNeedRefs: [ref] }))).toHaveLength(0); });
  it("QRY2-ELI-C08 question changes an affected decision", () => expect(candidateFor().affectedDecisionRefs.length).toBeGreaterThan(0));

  it("QRY2-VAL-C01 vector has explicit blocking", () => expect(candidateFor().informationValue.blocking).toBe("BLOCKS_CURRENT_BRANCH"));
  it("QRY2-VAL-C02 vector has discrimination", () => expect(candidateFor(TWO_OPTIONS_STATE).informationValue.discrimination).toBe("SEPARATES_ACTIVE_OPTIONS"));
  it("QRY2-VAL-C03 vector has impact scope", () => expect(candidateFor().informationValue.impactScope).toBe("SINGLE_BRANCH"));
  it("QRY2-VAL-C04 vector has reducibility", () => expect(candidateFor().informationValue.reducibility).toBe("AVAILABLE_NOW"));
  it("QRY2-VAL-C05 vector has irreversibility", () => expect(candidateFor().informationValue.irreversibility).toBe("MEDIUM"));
  it("QRY2-VAL-C06 vector keeps temporal urgency unknown", () => expect(candidateFor().informationValue.temporalUrgency).toBe("UNKNOWN"));
  it("QRY2-VAL-C07 vector preserves burden and risk independently", () => { expect(candidateFor().informationValue.burden).toBe("LOW"); expect(candidateFor().informationValue.sensitivityRisk).toBe("UNKNOWN"); });
  it("QRY2-VAL-C08 vector preserves pedagogical value", () => expect(candidateFor().informationValue.pedagogicalValue).toBe("USEFUL"));
  it("QRY2-VAL-C09 missing dimensions are never invented numerically", () => expect(Object.values(candidateFor().informationValue).some((value) => value === "UNKNOWN")).toBe(true));
  it("QRY2-VAL-C10 no global score exists", () => expect(candidateFor()).not.toHaveProperty("informationValue.score"));
});

describe("QRY-001 Part 2 — lexicographic order and non-dominance", () => {
  it("QRY2-PD009-C03 applies lexicographic order", () => { const base = candidateFor().informationValue; expect(compareInformationValueLexicographically({ ...base, blocking: "BLOCKS_IRREVERSIBLE_DECISION" }, { ...base, blocking: "NON_BLOCKING", discrimination: "SEPARATES_ACTIVE_OPTIONS" })).toBe("LEFT_PREFERRED"); });
  it("QRY2-PD009-C04 applies dominance after normative comparison", () => { const base = candidateFor(); const result = computeNonDominatedActionSet([base, withVector(base, { blocking: "NON_BLOCKING" })]); expect(result.nonDominated).toHaveLength(1); expect(result.dominanceEdges).toHaveLength(1); });
  it("QRY2-PD009-C05 no global score is computed", () => expect(compareActionCandidates(candidateFor(), candidateFor())).toBe("EQUAL"));
  it("QRY2-PD009-C06 persistent equality retains options", () => { const a = candidateFor(); const b = { ...a, candidateId: "other" }; expect(computeNonDominatedActionSet([a, b]).nonDominated).toHaveLength(2); });
  it("QRY2-PD009-C07 trade-off is not auto-resolved", () => { const a = candidateFor(); const b = { ...a, candidateId: "other", actionCategory: "REQUEST_HUMAN_DECISION" as const, owner: "OTHER" }; expect(compareActionCandidates(a, b)).toBe("TRADE_OFF"); expect(computeNonDominatedActionSet([a, b]).nonDominated).toHaveLength(2); });
  it("QRY2-DOM-C01 blocking precedes discrimination", () => { const base = candidateFor(); expect(compareActionCandidates(withVector(base, { blocking: "BLOCKS_CURRENT_BRANCH", discrimination: "UNKNOWN" }), withVector(base, { blocking: "NON_BLOCKING", discrimination: "SEPARATES_ACTIVE_OPTIONS" }))).toBe("LEFT_PREFERRED"); });
  it("QRY2-DOM-C02 discrimination precedes impact", () => { const base = candidateFor(); expect(compareActionCandidates(withVector(base, { discrimination: "SEPARATES_ACTIVE_OPTIONS", impactScope: "LOCAL" }), withVector(base, { discrimination: "MAY_CHANGE_DECISION", impactScope: "CROSS_BRANCH" }))).toBe("LEFT_PREFERRED"); });
  it("QRY2-DOM-C03 impact precedes reducibility", () => { const base = candidateFor(); expect(compareActionCandidates(withVector(base, { impactScope: "CROSS_BRANCH", reducibility: "UNKNOWN" }), withVector(base, { impactScope: "LOCAL", reducibility: "AVAILABLE_NOW" }))).toBe("LEFT_PREFERRED"); });
  it("QRY2-DOM-C04 reducibility precedes burden", () => { const base = candidateFor(); expect(compareActionCandidates(withVector(base, { reducibility: "AVAILABLE_NOW", burden: "HIGH" }), withVector(base, { reducibility: "NOT_ACTIONABLE_NOW", burden: "LOW" }))).toBe("LEFT_PREFERRED"); });
  it("QRY2-DOM-C05 lower burden is preferred when prior dimensions equal", () => { const base = candidateFor(); expect(compareActionCandidates(withVector(base, { burden: "LOW" }), withVector(base, { burden: "HIGH" }))).toBe("LEFT_PREFERRED"); });
  it("QRY2-DOM-C06 lower sensitivity risk is preferred when prior dimensions equal", () => { const base = candidateFor(); expect(compareActionCandidates(withVector(base, { sensitivityRisk: "LOW" }), withVector(base, { sensitivityRisk: "HIGH" }))).toBe("LEFT_PREFERRED"); });
  it("QRY2-DOM-C07 dependency prerequisite is preferred", () => { const a = { ...candidateFor(), targetRef: "a", dependencies: [] }; const b = { ...candidateFor(), candidateId: "b", targetRef: "b", dependencies: [{ dependencyId: "d", prerequisiteRef: "a", dependentRef: "b", kind: "PROJECT_GRAPH" as const, status: "OPEN" as const, sourceRef: "g" }] }; expect(compareActionCandidates(a, b)).toBe("LEFT_PREFERRED"); });
  it("QRY2-DOM-C08 ID does not break an equality", () => { const a = candidateFor(); expect(compareActionCandidates(a, { ...a, candidateId: "000-first" })).toBe("EQUAL"); });
  it("lexicographic order exposes all nine dimensions", () => expect(INFORMATION_VALUE_LEXICOGRAPHIC_ORDER).toHaveLength(9));
});

describe("QRY-001 Part 2 — selection", () => {
  it("QRY2-SEL-C01 selects a unique action", () => expect(selectNextAction(makeContext(USER_UNKNOWN_STATE)).trace.outcome).toBe("UNIQUE_ACTION_SELECTED"));
  it("QRY2-SEL-C02 keeps multiple non-dominated actions", () => { const base = candidateFor(); const selection = selectNextAction(makeContext(), [base, { ...base, candidateId: "other", actionCategory: "REQUEST_HUMAN_DECISION", actionLabel: "Demander une Décision humaine", owner: "OTHER" }]); expect(selection.nonDominated).toHaveLength(2); expect(selection.selected).toBeNull(); });
  it("QRY2-SEL-C03 human trade-off remains explicit", () => expect(selectNextAction(makeContext(TWO_OPTIONS_STATE)).selected?.actionCategory).toBe("COMPARE_OPTIONS"));
  it("QRY2-SEL-C04 empty context is not Project complete", () => expect(selectNextAction(makeContext()).trace.outcome).toBe("NO_ACTIONABLE_CANDIDATE"));
  it("QRY2-SEL-C05 explicit sufficiency is only current-step sufficiency", () => expect(selectNextAction(makeContext(makeSourceState(), { sufficiencyEvidenceRefs: ["usage:evidence"] })).trace.outcome).toBe("SUFFICIENT_FOR_CURRENT_STEP"));
  it("QRY2-SEL-C06 deferred state remains deferred", () => expect(selectNextAction(makeContext(SEMANTIC_REVIEW_STATE)).trace.outcome).toBe("DEFERRED"));
  it("QRY2-SEL-C07 refusal is preserved as a normative action", () => { const state = makeSourceState({ documentGenerability: [{ projectionRef: "protocol:1", sourceVersion: "1", status: "BLOCKED", owner: "DOC-001", affectedBranchRefs: ["protocol"], reason: "Absolute refusal", ruleRef: "DOC:R1", resumeCondition: "Resolve" }] }); expect(selectNextAction(makeContext(state))).toMatchObject({ trace: { outcome: "REFUSED" }, selected: { actionCategory: "REFUSE_PROTOCOL_PROJECTION" } }); });
  it("QRY2-SEL-C08 selection is explainable", () => expect(explainNavigationSelection(selectNextAction(makeContext(USER_UNKNOWN_STATE)))).toMatchObject({ opaqueScore: null, target: "project:unknown:population" }));
  it("QRY2-PD009-C12 refusal is not collapsed into STOP", () => expect(selectNextAction(makeContext(makeSourceState({ documentGenerability: [{ projectionRef: "p", sourceVersion: "1", status: "BLOCKED", owner: "DOC", affectedBranchRefs: [], reason: "r", ruleRef: "R", resumeCondition: null }] }))).selected?.actionCategory).toBe("REFUSE_PROTOCOL_PROJECTION"));
  it("QRY2-PD009-C14 legacy lexical routing does not influence ranking", () => expect(readFileSync(resolve(process.cwd(), "src/features/query-navigation/information-value.ts"), "utf8")).not.toMatch(/deriveRoutingIntent|lexicalScore/));
  it("QRY2-PD009-C15 Guided Intake is not transverse arbiter", () => expect(readFileSync(resolve(process.cwd(), "src/features/query-navigation/engine.ts"), "utf8")).not.toMatch(/ADAPTIVE_QUESTION_REGISTRY|guided-intake/));
  it("QRY2-PD009-C16 R04 is not transverse arbiter", () => expect(readFileSync(resolve(process.cwd(), "src/features/query-navigation/engine.ts"), "utf8")).not.toMatch(/R04|executeScientificInterpretation/));
});

describe("QRY-001 Part 2 — replay and boundaries", () => {
  it("QRY2-DET-C01 same source gives same context digest", () => expect(makeContext(USER_UNKNOWN_STATE).contextDigest).toBe(makeContext(structuredClone(USER_UNKNOWN_STATE)).contextDigest));
  it("QRY2-DET-C02 same state gives same candidate IDs", () => expect(selectNextAction(makeContext(USER_UNKNOWN_STATE)).trace.candidateRefs).toEqual(selectNextAction(makeContext(structuredClone(USER_UNKNOWN_STATE))).trace.candidateRefs));
  it("QRY2-DET-C03 same state gives same selection trace", () => expect(selectNextAction(makeContext(USER_UNKNOWN_STATE)).trace.digest).toBe(selectNextAction(makeContext(structuredClone(USER_UNKNOWN_STATE))).trace.digest));
  it("QRY2-DET-C04 replay is identical", () => expect(replayNavigationSelection(selectNextAction(makeContext(USER_UNKNOWN_STATE))).identical).toBe(true));
  it("QRY2-DET-C05 non-semantic source order is canonical", () => { const a = structuredClone(USER_UNKNOWN_STATE); a.projectUnknowns[0]!.decisionRefs = ["b", "a"]; const b = structuredClone(USER_UNKNOWN_STATE); b.projectUnknowns[0]!.decisionRefs = ["a", "b"]; expect(makeContext(a).contextDigest).toBe(makeContext(b).contextDigest); });
  it("QRY2-DET-C06 Project version changes context", () => expect(makeContext(USER_UNKNOWN_STATE, { projectVersion: "v1" }).contextDigest).not.toBe(makeContext(USER_UNKNOWN_STATE, { projectVersion: "v2" }).contextDigest));
  it("QRY2-DET-C07 validation catches arbitrary tie break", () => { const selection = selectNextAction(makeContext(USER_UNKNOWN_STATE)); const invalid = { ...selection, trace: { ...selection.trace, arbitraryTieBreakUsed: true as false } }; expect(validateNavigationSelection(invalid).valid).toBe(false); });
  it("QRY2-DET-C08 validated selection remains read-only", () => expect(validateNavigationSelection(selectNextAction(makeContext(USER_UNKNOWN_STATE))).valid).toBe(true));
  it("no provider, UI, network, random or mutation call exists", () => { const source = ["adapters.ts", "engine.ts", "information-value.ts", "validation.ts"].map((path) => readFileSync(resolve(process.cwd(), "src/features/query-navigation", path), "utf8")).join("\n"); expect(source).not.toMatch(/fetch\s*\(|axios\.|generateContent\s*\(|Math\.random\s*\(|saveProject\s*\(|applyDecision\s*\(|resolveValidationAfterHumanDecision\s*\(/); });
  it("QRY2-A user unknown creates clarification", () => expect(selectNextAction(makeContext(USER_UNKNOWN_STATE)).selected?.actionCategory).toBe("CLARIFY_BY_ADAPTIVE_EXCHANGE"));
  it("QRY2-B options create comparison", () => expect(selectNextAction(makeContext(TWO_OPTIONS_STATE)).selected?.actionCategory).toBe("COMPARE_OPTIONS"));
  it("QRY2-C contradiction creates human decision", () => { const state = makeSourceState({ projectContradictions: [{ ref: "c", version: "1", intent: "Arbitrate", owner: "PROJECT", decisionRefs: ["d"], branchRefs: ["b"] }] }); expect(selectNextAction(makeContext(state)).selected?.actionCategory).toBe("REQUEST_HUMAN_DECISION"); });
  it("QRY2-D human review stays human", () => expect(selectNextAction(makeContext(HUMAN_REVIEW_STATE)).selected?.actionCategory).toBe("REQUEST_HUMAN_DECISION"));
  it("QRY2-E semantic review stays deferred", () => expect(selectNextAction(makeContext(SEMANTIC_REVIEW_STATE)).trace.outcome).toBe("DEFERRED"));
  it("QRY2-F technical gate creates system prerequisite", () => expect(selectNextAction(makeContext(NOT_EVALUABLE_STATE)).selected?.capabilityRef).toBe("VALIDATION_RUNTIME"));
  it("QRY2-G realized time does not become immediate", () => { const state = makeSourceState({ readiness: [{ readinessId: "r", owner: "DM", sourceVersion: "1", status: "DEFERRED_TO_REALIZED_TIME", affectedBranchRefs: ["b"], decisionRefs: [], reason: "later", sourceRef: "r" }] }); expect(selectNextAction(makeContext(state)).trace.outcome).toBe("DEFERRED"); });
  it("QRY2-H no useful action stays honest", () => expect(selectNextAction(makeContext()).trace.outcome).toBe("NO_ACTIONABLE_CANDIDATE"));
  it("QRY2-I sufficiency is usage-bound", () => expect(selectNextAction(makeContext(makeSourceState(), { sufficiencyEvidenceRefs: ["use:1"] })).trace.outcome).toBe("SUFFICIENT_FOR_CURRENT_STEP"));
  it("QRY2-J knowledge gap routes to owner", () => { const state = makeSourceState({ knowledgeGaps: [{ ref: "g", version: "1", owner: "KNOWLEDGE", intent: "evidence", decisionRefs: ["d"], branchRefs: ["b"], evidenceGap: true }] }); expect(selectNextAction(makeContext(state)).selected?.owner).toBe("KNOWLEDGE"); });
  it("QRY2-K document block preserves refusal", () => { const state = makeSourceState({ documentGenerability: [{ projectionRef: "doc", sourceVersion: "1", status: "BLOCKED", owner: "DOC", affectedBranchRefs: ["b"], reason: "blocked", ruleRef: "r", resumeCondition: "resolve" }] }); expect(selectNextAction(makeContext(state)).trace.outcome).toBe("REFUSED"); });
  it("QRY2-L trace claims neither score nor PD-011", () => { const trace = selectNextAction(makeContext(USER_UNKNOWN_STATE)).trace; expect(trace.arbitraryScoreUsed).toBe(false); expect(JSON.stringify(trace)).not.toMatch(/PD011_PASS|PROJECT_COMPLETE/); });
});
