import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PD009_ACTION_CATEGORIES,
  PD009_ACTION_LABELS,
  assertDataNeedInformationNeedSeparation,
  buildNextActionCandidates,
  buildQueryNavigationContext,
  collectNavigationNeeds,
  validateNavigationNeed,
  validateNextActionCandidate,
  validateQueryNavigationContext,
} from "..";
import { EMPTY_SOURCE_STATE, NOT_EVALUABLE_STATE, SEMANTIC_REVIEW_STATE, USER_UNKNOWN_STATE, makeContext, makeSourceState } from "./fixtures";

describe("QRY-001 Part 2 — PD-009 contracts", () => {
  it("QRY2-PD009-C01 exactly eight normative action categories", () => expect(PD009_ACTION_CATEGORIES).toHaveLength(8));
  it("QRY2-PD009-C02 information value has nine qualitative dimensions", () => {
    const candidate = buildNextActionCandidates(makeContext(USER_UNKNOWN_STATE), collectNavigationNeeds(makeContext(USER_UNKNOWN_STATE)))[0]!;
    expect(Object.keys(candidate.informationValue)).toHaveLength(9);
    expect(Object.values(candidate.informationValue).every((value) => typeof value === "string")).toBe(true);
  });
  it("QRY2-PD009-C08 DataNeed never becomes a PD-009 information need", () => {
    const context = makeContext(makeSourceState({ dataNeeds: [{ dataNeedId: "data-need:1", version: "1", owner: "STUDY_DATA", openInformationIntent: "Préciser la source prévue.", decisionRefs: ["decision:source"], branchRefs: ["branch:data"] }] }));
    const need = collectNavigationNeeds(context)[0]!;
    expect(need.sourceObjectKind).toBe("DataNeed");
    expect(need.needId).not.toBe(need.sourceRef);
    expect(assertDataNeedInformationNeedSeparation(need)).toBe(true);
  });
  it("QRY2-PD009-C09 abstract completeness does not generate an eligible question", () => {
    const state = makeSourceState({ projectUnknowns: [{ ref: "unknown:abstract", version: "1", intent: "Compléter pour être complet.", owner: "PROJECT", decisionRefs: [], branchRefs: [] }] });
    const context = makeContext(state);
    expect(buildNextActionCandidates(context, collectNavigationNeeds(context))[0]?.eligibility).toBe("INELIGIBLE");
  });
  it("QRY2-PD009-C10 a closed branch cannot be questioned", () => {
    const context = makeContext(USER_UNKNOWN_STATE, { closedBranchRefs: ["branch:design"] });
    expect(collectNavigationNeeds(context)).toHaveLength(0);
  });
  it("QRY2-PD009-C11 information owned elsewhere is routed to that owner", () => {
    const state = makeSourceState({ knowledgeGaps: [{ ref: "gap:1", version: "1", owner: "KNOWLEDGE", intent: "Rechercher une preuve.", decisionRefs: ["decision:evidence"], branchRefs: ["branch:evidence"], evidenceGap: true }] });
    const context = makeContext(state);
    const candidate = buildNextActionCandidates(context, collectNavigationNeeds(context))[0]!;
    expect(candidate.owner).toBe("KNOWLEDGE");
    expect(candidate.actionCategory).not.toBe("CLARIFY_BY_ADAPTIVE_EXCHANGE");
  });
  it("QRY2-PD009-C13 technical NOT_EVALUABLE is not a scientific question", () => {
    const context = makeContext(NOT_EVALUABLE_STATE);
    const candidate = buildNextActionCandidates(context, collectNavigationNeeds(context))[0]!;
    expect(candidate.capabilityRef).toBe("VALIDATION_RUNTIME");
    expect(candidate.actionCategory).toBe("TRIGGER_METHODOLOGICAL_REVIEW");
  });
  it("QRY2-PD009-C17 action stays capability-neutral", () => {
    const context = makeContext(USER_UNKNOWN_STATE);
    const candidate = buildNextActionCandidates(context, collectNavigationNeeds(context))[0]!;
    expect(candidate).not.toHaveProperty("provider");
    expect(candidate).not.toHaveProperty("model");
    expect(candidate).not.toHaveProperty("prompt");
  });
  it.each(PD009_ACTION_CATEGORIES)("maps %s to one explicit normative label", (action) => expect(PD009_ACTION_LABELS[action]).toBeTruthy());
});

describe("QRY-001 Part 2 — context and source adapters", () => {
  it("QRY2-CTX-C01 context is derived and read-only", () => expect(makeContext()).toMatchObject({ projectionOnly: true, sourceOfTruth: false, projectWriteAuthorized: false, reconstructible: true }));
  it("QRY2-CTX-C02 context preserves Project identity and version", () => expect(makeContext()).toMatchObject({ projectRef: "project:fixture", projectVersion: "v1" }));
  it("QRY2-CTX-C03 context has a deterministic source-state digest", () => expect(makeContext(USER_UNKNOWN_STATE).sourceStateDigest).toBe(makeContext(structuredClone(USER_UNKNOWN_STATE)).sourceStateDigest));
  it("QRY2-CTX-C04 context does not mutate input", () => { const state = structuredClone(USER_UNKNOWN_STATE); const before = JSON.stringify(state); makeContext(state); expect(JSON.stringify(state)).toBe(before); });
  it("QRY2-CTX-C05 missing information preserves source reference", () => expect(collectNavigationNeeds(makeContext(USER_UNKNOWN_STATE))[0]?.sourceRef).toBe("project:unknown:population"));
  it("QRY2-CTX-C06 ambiguity preserves owner and provenance", () => { const state = makeSourceState({ projectAmbiguities: [{ ref: "ambiguity:1", version: "1", intent: "Clarifier.", owner: "ST", decisionRefs: ["d"], branchRefs: ["b"] }] }); const need = collectNavigationNeeds(makeContext(state))[0]!; expect(need.owner).toBe("ST"); expect(need.provenance.sourceRefs).toEqual(["ambiguity:1"]); });
  it("QRY2-CTX-C07 contradiction becomes human expert review", () => { const state = makeSourceState({ projectContradictions: [{ ref: "contradiction:1", version: "1", intent: "Arbitrer.", owner: "PROJECT", decisionRefs: ["d"], branchRefs: ["b"] }] }); expect(collectNavigationNeeds(makeContext(state))[0]?.actionability).toBe("HUMAN_EXPERT_REVIEW"); });
  it("QRY2-CTX-C08 dependencies are referenced, not persisted as a new graph", () => { const state = structuredClone(USER_UNKNOWN_STATE); state.dependencies = [{ dependencyId: "dep:1", prerequisiteRef: "project:unknown:population", dependentRef: "project:unknown:population", kind: "PROJECT_GRAPH", status: "OPEN", sourceRef: "project:impact" }]; const candidate = buildNextActionCandidates(makeContext(state), collectNavigationNeeds(makeContext(state)))[0]!; expect(candidate.dependencies[0]?.kind).toBe("PROJECT_GRAPH"); });
  it("QRY2-CTX-C09 sufficiency requires explicit evidence", () => { expect(makeContext().sufficiencyEvidenceRefs).toEqual([]); expect(makeContext(EMPTY_SOURCE_STATE, { sufficiencyEvidenceRefs: ["evidence:use"] }).sufficiencyEvidenceRefs).toEqual(["evidence:use"]); });
  it("QRY2-CTX-C10 context validates", () => expect(validateQueryNavigationContext(makeContext(USER_UNKNOWN_STATE)).valid).toBe(true));
});

describe("QRY-001 Part 2 — action candidates", () => {
  it("QRY2-ACT-C01 each candidate references exactly one PD-009 category", () => expect(PD009_ACTION_CATEGORIES).toContain(buildNextActionCandidates(makeContext(USER_UNKNOWN_STATE), collectNavigationNeeds(makeContext(USER_UNKNOWN_STATE)))[0]?.actionCategory));
  it("QRY2-ACT-C02 candidate preserves target", () => expect(buildNextActionCandidates(makeContext(USER_UNKNOWN_STATE), collectNavigationNeeds(makeContext(USER_UNKNOWN_STATE)))[0]?.targetRef).toBe("project:unknown:population"));
  it("QRY2-ACT-C03 candidate preserves owner", () => expect(buildNextActionCandidates(makeContext(USER_UNKNOWN_STATE), collectNavigationNeeds(makeContext(USER_UNKNOWN_STATE)))[0]?.owner).toBe("RESEARCH_PROJECT"));
  it("QRY2-ACT-C04 candidate preserves affected decision", () => expect(buildNextActionCandidates(makeContext(USER_UNKNOWN_STATE), collectNavigationNeeds(makeContext(USER_UNKNOWN_STATE)))[0]?.affectedDecisionRefs).toEqual(["decision:population"]));
  it("QRY2-ACT-C05 candidate preserves affected branch", () => expect(buildNextActionCandidates(makeContext(USER_UNKNOWN_STATE), collectNavigationNeeds(makeContext(USER_UNKNOWN_STATE)))[0]?.affectedBranchRefs).toEqual(["branch:design"]));
  it("QRY2-ACT-C06 candidate is projection-only", () => expect(buildNextActionCandidates(makeContext(USER_UNKNOWN_STATE), collectNavigationNeeds(makeContext(USER_UNKNOWN_STATE)))[0]).toMatchObject({ projectionOnly: true, sourceOfTruth: false, projectWriteAuthorized: false }));
  it("QRY2-ACT-C07 candidate contains no global score", () => expect(buildNextActionCandidates(makeContext(USER_UNKNOWN_STATE), collectNavigationNeeds(makeContext(USER_UNKNOWN_STATE)))[0]).not.toHaveProperty("score"));
  it("QRY2-ACT-C08 candidate explains defer consequence", () => expect(buildNextActionCandidates(makeContext(USER_UNKNOWN_STATE), collectNavigationNeeds(makeContext(USER_UNKNOWN_STATE)))[0]?.deferConsequence).toBeTruthy());
  it("QRY2-ACT-C09 candidate contains PD-009 rule reference", () => expect(buildNextActionCandidates(makeContext(USER_UNKNOWN_STATE), collectNavigationNeeds(makeContext(USER_UNKNOWN_STATE)))[0]?.pd009RuleRefs[0]).toMatch(/^PD-009:/));
  it("QRY2-ACT-C10 candidate validates", () => expect(validateNextActionCandidate(buildNextActionCandidates(makeContext(USER_UNKNOWN_STATE), collectNavigationNeeds(makeContext(USER_UNKNOWN_STATE)))[0]!).valid).toBe(true));
});

describe("QRY-001 Part 2 — VAL integration", () => {
  it("QRY2-VALINT-C01 consumes gate evaluation status", () => expect(collectNavigationNeeds(makeContext(NOT_EVALUABLE_STATE))[0]?.sourceType).toBe("VALIDATION_GATE"));
  it("QRY2-VALINT-C02 no persisted run remains explicit", () => expect(NOT_EVALUABLE_STATE.validationGates[0]?.runRefs).toEqual([]));
  it("QRY2-VALINT-C03 pending semantic review remains deferred", () => expect(collectNavigationNeeds(makeContext(SEMANTIC_REVIEW_STATE))[0]?.status).toBe("DEFERRED"));
  it("QRY2-VALINT-C04 pending semantic review is never resolved", () => expect(collectNavigationNeeds(makeContext(SEMANTIC_REVIEW_STATE))[0]?.status).not.toBe("RESOLVED"));
  it("QRY2-VALINT-C05 QRY does not evaluate a gate", () => expect(readFileSync(resolve(process.cwd(), "src/features/query-navigation/adapters.ts"), "utf8")).not.toMatch(/evaluateValidationProductGate\s*\(/));
  it("QRY2-VALINT-C06 QRY does not resolve a finding", () => expect(readFileSync(resolve(process.cwd(), "src/features/query-navigation/adapters.ts"), "utf8")).not.toMatch(/resolveValidation/));
  it("QRY2-VALINT-C07 VAL owner is preserved", () => expect(collectNavigationNeeds(makeContext(NOT_EVALUABLE_STATE))[0]?.owner).toBe("VAL-001"));
  it("QRY2-VALINT-C08 provider policy stays visible as a limitation", () => expect(collectNavigationNeeds(makeContext(SEMANTIC_REVIEW_STATE))[0]?.limitations).toContain("SEMANTIC_REVIEW_PROVIDER_DISABLED_NOT_RESOLVED_BY_QRY"));
});

describe("QRY-001 Part 2 — contract failures", () => {
  it("rejects a conflated DataNeed identity", () => { const need = collectNavigationNeeds(makeContext(makeSourceState({ dataNeeds: [{ dataNeedId: "data-need:1", version: "1", owner: "DATA", openInformationIntent: "Need", decisionRefs: [], branchRefs: [] }] })))[0]!; const invalid = { ...need, needId: need.sourceRef }; expect(validateNavigationNeed(invalid).valid).toBe(false); });
  it("rejects candidate without exact normative label", () => { const candidate = buildNextActionCandidates(makeContext(USER_UNKNOWN_STATE), collectNavigationNeeds(makeContext(USER_UNKNOWN_STATE)))[0]!; expect(validateNextActionCandidate({ ...candidate, actionLabel: "ASK" }).valid).toBe(false); });
  it("rejects candidate that writes Project", () => { const candidate = buildNextActionCandidates(makeContext(USER_UNKNOWN_STATE), collectNavigationNeeds(makeContext(USER_UNKNOWN_STATE)))[0]!; expect(validateNextActionCandidate({ ...candidate, projectWriteAuthorized: true as false }).valid).toBe(false); });
  it("rejects stale context digest", () => expect(validateQueryNavigationContext({ ...makeContext(), contextDigest: "stale" }).valid).toBe(false));
});
