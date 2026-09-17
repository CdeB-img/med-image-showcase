import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  constrainPersistentRelationsToCanonicalSignatures, contributionFromPersistentDelta,
  materializePersistentSourceAnchors, validatePersistentProjectDelta, validatePersistentProviderContract,
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

  it("replays frozen RHU T3: all40 objects, both original population refs, six occasions and human-decision candidate", () => {
    const record = JSON.parse(readFileSync(resolve("validation/protocol-designer-v1-human-conversation-causal-audit-02/RHU-T03-recorded-provider.json"), "utf8"));
    const before = JSON.stringify(record.output);
    const sections: string[] = record.request.input.split("\n\n");
    const catalog = JSON.parse(sections.find((s) => s.startsWith("CATALOGUE D'ANCRAGES")).split("\n").slice(1).join("\n"));
    const raw = catalog.anchors.find((a: { fragmentKind: string }) => a.fragmentKind === "FULL_TURN").exactText;
    const assistants = JSON.parse(sections.find((s) => s.startsWith("PROPOSITIONS NOXIA")).split("\n").slice(1).join("\n"));
    const conversation: ProductBridgeRequest["conversation"] = { conversationId: "conversation:references:frozen", language: "fr", turns: [
      ...assistants.map((a: { turnId: string; content: string }) => ({ ...a, role: "NOXIA" })), { turnId: catalog.currentUserTurnId, role: "USER", content: raw },
    ] };
    expect(validatePersistentProviderContract(record.output).valid).toBe(true);
    const materialized = materializePersistentSourceAnchors({ value: record.output, catalog, currentUserTurn: { turnId: catalog.currentUserTurnId, content: raw } });
    expect(materialized.valid).toBe(true);
    const constrained = constrainPersistentRelationsToCanonicalSignatures(materialized.value, null);
    const checked = validatePersistentProjectDelta(constrained.value, raw, null, conversation);
    expect(checked.validation.blocks).toEqual([]);
    expect(checked.validation.acceptedChanges).toHaveLength(40);
    expect(checked.validation.acceptedExpectedVariableOccasions).toHaveLength(6);
    const refs = checked.candidate.expectedVariableOccasions.slice(4).map((o) => o.studyUnitOrGroupRef);
    expect(refs).toEqual(["cand-population-avc", "cand-population-idm"]);
    const contribution = contributionFromPersistentDelta({ candidate: checked.candidate, conversation, currentProject: null });
    const candidate = prepareResearchProjectContributionCandidate(contribution, null);
    expect(candidate.canonicalChangeSet.status).toBe("READY_FOR_HUMAN_DECISION");
    // Reuse the existing canonical alias mapping from candidateRef to the
    // semanticIdentity declared in the same frozen output, never to Condition.
    const canonicalRefs = record.output.changes.filter((c: { candidateRef: string }) => refs.includes(c.candidateRef))
      .map((c: { semanticIdentity: string }) => c.semanticIdentity);
    expect(candidate.canonicalChangeSet.expectedVariableOccasionChanges.slice(4).map((o) => o.candidate.studyUnitOrGroupRef)).toEqual(canonicalRefs);
    for (const ref of canonicalRefs) expect(candidate.canonicalChangeSet.objectChanges.find((c) => c.objectId === ref).candidate.objectType).toBe("POPULATION");
    expect(candidate.status).toBe("CANDIDATE_PENDING_HUMAN_CONFIRMATION");
    expect(JSON.stringify(record.output)).toBe(before);
  });
});
