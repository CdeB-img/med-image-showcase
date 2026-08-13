import { describe, expect, it } from "vitest";
import {
  compileAtomicCompositionRepairs,
  enforceAtomicCompositionAcceptanceConsistency,
  parseSemanticAtomicCompositionAudit,
  runSemanticAtomicCompositionCycles,
  type SemanticAtomicCompositionProvider,
  type SemanticAtomicCompositionAudit,
} from "../atomic-composition";
import { applyCriticRepairs } from "../coverage";
import type { SemanticReconstructionCandidate, SemanticReconstructionRequest } from "../types";

const request = (): SemanticReconstructionRequest => ({
  schemaVersion: "SEM-001-1.1", sessionId: "generic-false-complete", language: "fr", previousModel: null,
  messages: [{ messageId: "message-generic", role: "USER", content: "Comparer alpha et beta avec méthode dynamique.", createdAt: "2026-08-12T10:00:00.000Z" }],
});

const baseCandidate = (): SemanticReconstructionCandidate => ({
  candidateId: "candidate-generic", language: "fr", normalizedMeaning: "Comparer un agrégat avec une méthode.", summaryForUser: "Comparaison générique.",
  semanticInventory: { explicitFragments: [
    { inventoryItemId: "inventory-aggregate", sourceMessageId: "message-generic", sourceText: "alpha et beta", normalizedLabel: "alpha et beta", localRole: "aggregate", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: [] },
    { inventoryItemId: "inventory-method", sourceMessageId: "message-generic", sourceText: "méthode", normalizedLabel: "méthode", localRole: "method", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: [] },
    { inventoryItemId: "inventory-condition", sourceMessageId: "message-generic", sourceText: "dynamique", normalizedLabel: "dynamique", localRole: "condition", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: [] },
  ], explicitRelations: [] },
  elements: [
    { clientElementId: "element-aggregate", type: "CONSTRAINT", canonicalMeaning: "alpha et beta", studyRole: "NONE", polarity: "AFFIRMED", inventoryItemIds: ["inventory-aggregate"], sourceMessageId: "message-generic", sourceText: "alpha et beta", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
    { clientElementId: "element-method", type: "METHOD", canonicalMeaning: "méthode", studyRole: "MEASUREMENT", polarity: "AFFIRMED", inventoryItemIds: ["inventory-method"], sourceMessageId: "message-generic", sourceText: "méthode", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
    { clientElementId: "element-condition", type: "CONDITION", canonicalMeaning: "dynamique", studyRole: "NONE", polarity: "AFFIRMED", inventoryItemIds: ["inventory-condition"], sourceMessageId: "message-generic", sourceText: "dynamique", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
  ],
  relations: [], missingConcepts: [], ellipses: [], ambiguities: [], unknowns: [], contradictions: [], knowledgeRequests: [], clarificationCandidates: [],
  routeProposal: { route: "UNDERSTAND", confidence: 1, reason: "Generic comparison.", expectedCapabilities: ["GENERIC"] }, semanticWarnings: [],
});

const constituent = (id: "alpha" | "beta") => ({
  constituentId: `constituent-${id}`, sourceMessageId: "message-generic", sourceText: id, normalizedMeaning: id,
  semanticType: "CONSTRAINT" as const, studyRole: "NONE" as const, polarity: "AFFIRMED" as const,
});
const atomicComplete = () => ({
  reportId: "atomic-report", subjectInventoryItemIds: ["inventory-aggregate"], status: "COMPLETE" as const,
  constituents: [constituent("alpha"), constituent("beta")],
  directRelations: [{ sourceConstituentId: "constituent-alpha", targetConstituentId: "constituent-beta", sourceMessageId: "message-generic", sourceText: "alpha et beta", relationType: "COMPARES_WITH", polarity: "AFFIRMED" as const }],
  reason: "The source treats both constituents autonomously.",
});
const atomicNotApplicable = () => ({ reportId: "atomic-na", subjectInventoryItemIds: ["inventory-aggregate"], status: "NOT_APPLICABLE" as const, constituents: [], directRelations: [], reason: "No autonomous constituent finding." });
const compositionNotRequired = () => ({ reportId: "composition-na", sourceInventoryItemIds: ["inventory-method", "inventory-condition"], status: "NOT_REQUIRED" as const, composite: null, relations: [], reason: "No required composite finding." });
const compositeFinding = () => ({
  compositeId: "composite-generic", sourceMessageId: "message-generic", sourceText: "méthode dynamique", normalizedMeaning: "méthode dynamique",
  semanticType: "METHOD" as const, studyRole: "MEASUREMENT" as const, polarity: "AFFIRMED" as const,
});
const audit = (overrides: Partial<SemanticAtomicCompositionAudit> = {}) => parseSemanticAtomicCompositionAudit({
  auditId: "audit-generic", schemaVersion: "SEM-001-ATOMIC-COMPOSITION-1.1", verdict: "ACCEPT",
  atomicityReports: [atomicComplete()], compositionReports: [compositionNotRequired()],
  routeAssessment: { status: "CORRECT", proposedRoute: null, confidence: 1, reason: "Route is correct.", expectedCapabilities: ["GENERIC"] },
  summary: "Generic bounded audit.", ...overrides,
});

const representedAtomicCandidate = () => {
  const candidate = baseCandidate();
  candidate.semanticInventory.explicitFragments.push(
    { inventoryItemId: "inventory-alpha", sourceMessageId: "message-generic", sourceText: "alpha", normalizedLabel: "alpha", localRole: "constituent", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["inventory-aggregate"] },
    { inventoryItemId: "inventory-beta", sourceMessageId: "message-generic", sourceText: "beta", normalizedLabel: "beta", localRole: "constituent", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["inventory-aggregate"] },
  );
  candidate.elements.push(
    { clientElementId: "element-alpha", type: "CONSTRAINT", canonicalMeaning: "alpha", studyRole: "NONE", polarity: "AFFIRMED", inventoryItemIds: ["inventory-alpha"], sourceMessageId: "message-generic", sourceText: "alpha", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
    { clientElementId: "element-beta", type: "CONSTRAINT", canonicalMeaning: "beta", studyRole: "NONE", polarity: "AFFIRMED", inventoryItemIds: ["inventory-beta"], sourceMessageId: "message-generic", sourceText: "beta", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
  );
  return candidate;
};

describe("SEM-001R3F deterministic false-complete acceptance guard", () => {
  it("rejects COMPLETE when an aggregate has two recognized autonomous constituents but only the aggregate is represented", () => {
    const guarded = enforceAtomicCompositionAcceptanceConsistency(baseCandidate(), audit());
    expect(guarded).toMatchObject({ changed: true, acceptAllowed: false, audit: { verdict: "REVISE", atomicityReports: [{ status: "INCOMPLETE" }] } });
    expect(guarded.diagnostics[0]).toMatchObject({ disposition: "AUDIT_STATUS_INCONSISTENT", checks: { ATOMIC_CONSTITUENTS_REPRESENTED: "FAIL", AUDIT_FINDINGS_CONSISTENT_WITH_STATUS: "FAIL" } });
  });

  it("allows COMPLETE when both constituents and their direct relation are already represented", () => {
    const candidate = representedAtomicCandidate();
    candidate.relations.push({ clientRelationId: "relation-alpha-beta", sourceClientElementId: "element-alpha", targetClientElementId: "element-beta", relationType: "COMPARES_WITH", polarity: "AFFIRMED", inventoryRelationIds: [], epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false });
    const guarded = enforceAtomicCompositionAcceptanceConsistency(candidate, audit());
    expect(guarded).toMatchObject({ changed: false, acceptAllowed: true, audit: { verdict: "ACCEPT" } });
  });

  it("rejects COMPLETE when a required composite is reported but absent", () => {
    const value = audit({ atomicityReports: [atomicNotApplicable()], compositionReports: [{ reportId: "composition-complete", sourceInventoryItemIds: ["inventory-method", "inventory-condition"], status: "COMPLETE", composite: compositeFinding(), relations: [], reason: "The source requires the composite." }] });
    const guarded = enforceAtomicCompositionAcceptanceConsistency(baseCandidate(), value);
    expect(guarded.audit.compositionReports[0].status).toBe("INCOMPLETE");
    expect(guarded.diagnostics[1]).toMatchObject({ disposition: "AUDIT_STATUS_INCONSISTENT", checks: { REQUIRED_COMPOSITE_REPRESENTED: "FAIL" } });
  });

  it("does not create an unnecessary repair when the required composite is represented", () => {
    const candidate = baseCandidate();
    candidate.semanticInventory.explicitFragments.push({ inventoryItemId: "inventory-composite", sourceMessageId: "message-generic", sourceText: "méthode dynamique", normalizedLabel: "méthode dynamique", localRole: "composite", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["inventory-method", "inventory-condition"] });
    candidate.elements.push({ clientElementId: "element-composite", type: "METHOD", canonicalMeaning: "méthode dynamique", studyRole: "MEASUREMENT", polarity: "AFFIRMED", inventoryItemIds: ["inventory-composite"], sourceMessageId: "message-generic", sourceText: "méthode dynamique", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] });
    const value = audit({ atomicityReports: [atomicNotApplicable()], compositionReports: [{ reportId: "composition-complete", sourceInventoryItemIds: ["inventory-method", "inventory-condition"], status: "COMPLETE", composite: compositeFinding(), relations: [], reason: "The composite is already represented." }] });
    const guarded = enforceAtomicCompositionAcceptanceConsistency(candidate, value);
    expect(guarded).toMatchObject({ changed: false, acceptAllowed: true });
    expect(compileAtomicCompositionRepairs(request(), candidate, guarded.audit).repairs).toEqual([]);
  });

  it("does not split an aggregate when autonomy is not established", () => {
    const value = audit({ atomicityReports: [atomicNotApplicable()] });
    const guarded = enforceAtomicCompositionAcceptanceConsistency(baseCandidate(), value);
    expect(guarded.changed).toBe(false);
    expect(compileAtomicCompositionRepairs(request(), baseCandidate(), guarded.audit).repairs).toEqual([]);
  });

  it("does not fabricate elements from ambiguous findings", () => {
    const value = audit({ verdict: "CLARIFICATION_REQUIRED", atomicityReports: [{ ...atomicNotApplicable(), status: "AMBIGUOUS", reason: "Autonomy is unresolved." }], routeAssessment: { status: "UNCERTAIN", proposedRoute: null, confidence: .5, reason: "Source ambiguity remains.", expectedCapabilities: [] } });
    const guarded = enforceAtomicCompositionAcceptanceConsistency(baseCandidate(), value);
    expect(guarded).toMatchObject({ changed: false, acceptAllowed: false });
    expect(compileAtomicCompositionRepairs(request(), baseCandidate(), guarded.audit).repairs).toEqual([]);
  });

  it("preserves aggregate, constituents and exact provenance without a redundant provider call", async () => {
    const candidate = baseCandidate();
    let calls = 0;
    const provider: SemanticAtomicCompositionProvider = {
      metadata: { provider: "TEST", model: "generic", temperature: null },
      async auditAtomicComposition() {
        calls += 1;
        return { callId: `audit-${calls}`, audit: audit() };
      },
    };
    const result = await runSemanticAtomicCompositionCycles(provider, request(), candidate);
    const repaired = result.candidate;
    expect(result).toMatchObject({ accepted: true, terminalReason: "ATOMIC_COMPOSITION_FALSE_COMPLETE_REPAIRED_AND_VERIFIED" });
    expect(calls).toBe(1);
    expect(repaired.semanticInventory.explicitFragments.some((item) => item.inventoryItemId === "inventory-aggregate")).toBe(true);
    expect(repaired.elements.filter((item) => ["alpha", "beta"].includes(item.sourceText ?? "")).map((item) => ({ message: item.sourceMessageId, text: item.sourceText }))).toEqual([
      { message: "message-generic", text: "alpha" }, { message: "message-generic", text: "beta" },
    ]);
  });

  it("forbids ACCEPT when a required direct relation is absent", () => {
    const guarded = enforceAtomicCompositionAcceptanceConsistency(representedAtomicCandidate(), audit());
    expect(guarded.acceptAllowed).toBe(false);
    expect(guarded.diagnostics[0]).toMatchObject({ checks: { ATOMIC_CONSTITUENTS_REPRESENTED: "PASS", DIRECT_REQUIRED_RELATIONS_REPRESENTED: "FAIL" } });
  });

  it("does not modify a correct reconstruction", () => {
    const candidate = representedAtomicCandidate();
    candidate.relations.push({ clientRelationId: "relation-alpha-beta", sourceClientElementId: "element-alpha", targetClientElementId: "element-beta", relationType: "COMPARES_WITH", polarity: "AFFIRMED", inventoryRelationIds: [], epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false });
    const before = structuredClone(candidate);
    const guarded = enforceAtomicCompositionAcceptanceConsistency(candidate, audit());
    expect(candidate).toEqual(before);
    expect(guarded.audit).toEqual(audit());
  });

  it("creates no additional inference to satisfy the guard", () => {
    const candidate = baseCandidate();
    const guarded = enforceAtomicCompositionAcceptanceConsistency(candidate, audit());
    const repaired = applyCriticRepairs(request(), candidate, compileAtomicCompositionRepairs(request(), candidate, guarded.audit).repairs).candidate;
    expect(repaired.elements.filter((item) => item.epistemicStatus !== "EXPLICIT_USER_STATED")).toEqual([]);
    expect(repaired.relations.filter((item) => item.epistemicStatus !== "EXPLICIT_USER_STATED")).toEqual([]);
  });
});
