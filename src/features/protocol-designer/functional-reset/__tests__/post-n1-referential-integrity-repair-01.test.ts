import { describe, expect, it } from "vitest";
import {
  contributionFromPersistentDelta, validatePersistentProjectDelta,
  type PersistentExpectedVariableOccasion, type PersistentProjectDeltaChange,
  type ProductBridgeRequest,
} from "@/features/protocol-designer/product-bridge";
import { prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";

const scenario = (raw = "Contexte : affection Alpha.", sourceText = "affection Alpha") => {
  const change = (candidateRef: string, proposedType: string, content: string, source = sourceText): PersistentProjectDeltaChange => ({
    operation: "ADD", candidateRef, semanticIdentity: candidateRef, proposedType, content, sourceText: source,
    polarity: "AFFIRMED", epistemicStatus: "EXPLICIT_USER_STATED", epistemicState: "KNOWN", assertionKind: "USER_STATED", evidenceRefs: [],
  });
  const changes = [change("population:alpha", "POPULATION", "Cohorte affection Alpha"), change("condition:alpha", "CONDITION", "affection Alpha"), change("variable:score", "CANONICAL_VARIABLE", "Score", raw)];
  const occasion = (studyUnitOrGroupRef?: string | null): PersistentExpectedVariableOccasion => ({
    operation: "ADD", occasionId: "occasion:score:annual", sourceText: raw, variableProjectRef: "variable:score", studyUnitOrGroupRef,
    anchor: { kind: "RELATIVE_EVENT", direction: "UNKNOWN", unit: "an", offset: 1, lowerBound: null, upperBound: null,
      relativeEventLabel: null, tolerance: null, reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" } },
    applicableContext: "Suivi annuel", assertionKind: "USER_STATED", evidenceRefs: [],
  });
  const conversation: ProductBridgeRequest["conversation"] = { conversationId: "conversation:references", language: "fr", turns: [{ turnId: "turn:references", role: "USER", content: raw }] };
  const check = (value: unknown) => validatePersistentProjectDelta(value, raw, null, conversation);
  return { raw, change, changes, occasion, conversation, check };
};
const enumeration = "Deux cohortes prospectives indépendantes :\n- affection Alpha : mesure initiale ;\n- affection Beta : mesure initiale.";

const candidateFor = (s: ReturnType<typeof scenario>, checked: ReturnType<typeof validatePersistentProjectDelta>) => {
  const contribution = contributionFromPersistentDelta({ candidate: checked.candidate, conversation: s.conversation, currentProject: null });
  return prepareResearchProjectContributionCandidate(contribution, null);
};

describe("Post-N1 — referential integrity and source-backed populations", () => {
  it("keeps omission without a dependency valid, retaining the Condition", () => {
    const s = scenario();
    const checked = s.check({ changes: s.changes });
    expect(checked.validation.valid).toBe(true);
    expect(checked.validation.noOps).toContain("change:0:CONDITION_CONTEXT_NOT_POPULATION");
    expect(checked.validation.acceptedChanges.map((c) => c.candidateRef)).not.toContain("population:alpha");
    expect(checked.validation.acceptedChanges.map((c) => c.candidateRef)).toContain("condition:alpha");
  });

  it("fails closed on a mandatory anchor reference to a genuinely omitted object", () => {
    const s = scenario();
    const occasion = s.occasion();
    occasion.anchor.reference = { status: "KNOWN", referenceProjectRef: "population:alpha" };
    const checked = s.check({ changes: s.changes, expectedVariableOccasions: [occasion] });
    expect(checked.validation.blocks).toContain("expectedVariableOccasion:0:TEMPORAL_REFERENCE_INVALID");
    expect(checked.candidate).toBeNull();
  });

  it.each([undefined, null])("represents a truly absent optional unit/group reference explicitly (%s)", (ref) => {
    const s = scenario();
    const checked = s.check({ changes: s.changes, expectedVariableOccasions: [s.occasion(ref)] });
    expect(checked.validation.valid).toBe(true);
    expect(checked.validation.noOps).toContain("change:0:CONDITION_CONTEXT_NOT_POPULATION");
    const candidate = candidateFor(s, checked);
    expect(candidate.canonicalChangeSet.expectedVariableOccasionChanges[0].candidate.studyUnitOrGroupRef).toBeNull();
  });

  it("does not discard an explicitly supplied dangling reference because its field is optional", () => {
    const s = scenario();
    const checked = s.check({ changes: s.changes, expectedVariableOccasions: [s.occasion("population:alpha")] });
    expect(checked.validation.blocks).toContain("expectedVariableOccasion:0:EXPECTED_OCCASION_CONTEXT_REF_INVALID");
    expect(checked.candidate).toBeNull();
  });

  it("preserves an already valid context reference and population without any remapping", () => {
    const s = scenario("Population affection Alpha suivie annuellement.", "Population affection Alpha");
    const original = s.occasion("population:alpha");
    const checked = s.check({ changes: s.changes, expectedVariableOccasions: [original] });
    expect(checked.validation.valid).toBe(true);
    expect(checked.candidate.expectedVariableOccasions[0]).toEqual(original);
    expect(candidateFor(s, checked).canonicalChangeSet.expectedVariableOccasionChanges[0].candidate.studyUnitOrGroupRef).toBe("population:alpha");
  });

  it("keeps an explicitly declared cohort label in the same user enumeration, with its original identity", () => {
    const s = scenario(enumeration, "- affection Alpha :");
    const checked = s.check({ changes: s.changes, expectedVariableOccasions: [s.occasion("population:alpha")] });
    expect(checked.validation.blocks).toEqual([]);
    expect(checked.validation.noOps).toEqual([]);
    expect(checked.validation.acceptedChanges).toEqual(s.changes);
    expect(checked.candidate.expectedVariableOccasions[0].studyUnitOrGroupRef).toBe("population:alpha");
    const candidate = candidateFor(s, checked);
    expect(candidate.canonicalChangeSet.status).toBe("READY_FOR_HUMAN_DECISION");
    expect(candidate.canonicalChangeSet.expectedVariableOccasionChanges[0].candidate.studyUnitOrGroupRef).toBe("population:alpha");
    expect(candidate.canonicalChangeSet.objectChanges.find((c) => c.objectId === "population:alpha").candidate.objectType).toBe("POPULATION");
  });

  it.each([
    "Conditions cliniques :\n- affection Alpha : mesure initiale.",
    "Deux cohortes prospectives indépendantes :\n- affection Beta : mesure initiale.\n\nAutre contexte :\n- affection Alpha : commentaire.",
    "Deux cohortes prospectives indépendantes :\n- affection Alpha : première mesure ;\n- affection Alpha : autre mesure.",
    "Quelles cohortes ? :\n- affection Alpha : commentaire.",
  ])("does not infer cohort membership from unrelated, ambiguous or untyped context (%#)", (raw) => {
    const s = scenario(raw, "- affection Alpha :");
    const checked = s.check({ changes: s.changes, expectedVariableOccasions: [s.occasion("population:alpha")] });
    expect(checked.validation.noOps).toContain("change:0:CONDITION_CONTEXT_NOT_POPULATION");
    expect(checked.validation.valid).toBe(false);
    expect(checked.candidate).toBeNull();
  });

  it("does not bind a differently named population to the first listed cohort", () => {
    const s = scenario(enumeration, "- affection Alpha :");
    s.changes[0] = { ...s.changes[0], content: "Cohorte affection Beta" };
    expect(s.check({ changes: s.changes, expectedVariableOccasions: [s.occasion("population:alpha")] }).validation.valid).toBe(false);
  });

  it("fails closed on an undeclared context ref even with a surviving Condition", () => {
    const s = scenario();
    const checked = s.check({ changes: s.changes, expectedVariableOccasions: [s.occasion("missing:context")] });
    expect(checked.validation.blocks).toContain("expectedVariableOccasion:0:EXPECTED_OCCASION_CONTEXT_REF_INVALID");
    expect(checked.candidate).toBeNull();
  });

  it("preserves both declared population aliases through human-decision preparation", () => {
    // FIXTURE_PURPOSE: preserve the legacy two-cohort reference invariant, not the RHU-T03 campaign cardinalities.
    // SOURCE_CLASS: SYNTHETIC_CURRENT_CONTRACT; ORIGINAL_SOURCE_FAMILY: RHU-T03; SANITIZATION: YES.
    // CURRENT_CONTRACT_PROTECTED: each variable occasion remains bound to its declared population identity.
    const s = scenario(enumeration, "- affection Alpha :");
    const alpha = { ...s.changes[0], semanticIdentity: "cohort:alpha" };
    const beta = { ...s.change("population:beta", "POPULATION", "Cohorte affection Beta", "- affection Beta :"), semanticIdentity: "cohort:beta" };
    const first = s.occasion("population:alpha");
    const second = { ...s.occasion("population:beta"), occasionId: "occasion:score:beta", sourceText: enumeration };
    const input = { changes: [alpha, beta, ...s.changes.slice(1)], expectedVariableOccasions: [first, second] };
    const before = JSON.stringify(input);
    const checked = s.check(input);
    expect(checked.validation.blocks).toEqual([]);
    expect(checked.candidate.expectedVariableOccasions.map((o) => o.studyUnitOrGroupRef)).toEqual(["population:alpha", "population:beta"]);
    const contribution = contributionFromPersistentDelta({ candidate: checked.candidate, conversation: s.conversation, currentProject: null });
    const candidate = prepareResearchProjectContributionCandidate(contribution, null);
    expect(candidate.canonicalChangeSet.status).toBe("READY_FOR_HUMAN_DECISION");
    const canonicalRefs = ["cohort:alpha", "cohort:beta"];
    expect(candidate.canonicalChangeSet.expectedVariableOccasionChanges.map((o) => o.candidate.studyUnitOrGroupRef)).toEqual(canonicalRefs);
    for (const ref of canonicalRefs) expect(candidate.canonicalChangeSet.objectChanges.find((c) => c.objectId === ref).candidate.objectType).toBe("POPULATION");
    expect(candidate.status).toBe("CANDIDATE_PENDING_HUMAN_CONFIRMATION");
    expect(JSON.stringify(input)).toBe(before);
  });
});
