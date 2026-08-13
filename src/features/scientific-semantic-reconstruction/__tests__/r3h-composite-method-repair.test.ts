import { describe, expect, it } from "vitest";
import {
  compileAtomicCompositionRepairs,
  enforceAtomicCompositionAcceptanceConsistency,
  parseSemanticAtomicCompositionAudit,
  type SemanticAtomicCompositionAudit,
} from "../atomic-composition";
import { applyCriticRepairs } from "../coverage";
import type { SemanticReconstructionCandidate, SemanticReconstructionRequest } from "../types";

const request = (): SemanticReconstructionRequest => ({
  schemaVersion: "SEM-001-1.1",
  sessionId: "composite-method-generic",
  language: "fr",
  messages: [{
    messageId: "message-generic",
    role: "USER",
    content: "Décrire imagerie phase tardive, signal quantifié.",
    createdAt: "2026-08-12T18:00:00.000Z",
  }],
  previousModel: null,
});

const candidate = (): SemanticReconstructionCandidate => ({
  candidateId: "candidate-generic",
  language: "fr",
  normalizedMeaning: "Décrire un signal quantifié par une imagerie en phase tardive.",
  summaryForUser: "Une modalité, sa phase et une mesure sont explicites.",
  semanticInventory: {
    explicitFragments: [
      { inventoryItemId: "inventory-modality", sourceMessageId: "message-generic", sourceText: "imagerie", normalizedLabel: "imagerie", localRole: "modality", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["inventory-phase"] },
      { inventoryItemId: "inventory-phase", sourceMessageId: "message-generic", sourceText: "phase tardive", normalizedLabel: "phase tardive", localRole: "timing", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["inventory-modality"] },
      { inventoryItemId: "inventory-signal", sourceMessageId: "message-generic", sourceText: "signal", normalizedLabel: "signal", localRole: "measurement target", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["inventory-action"] },
      { inventoryItemId: "inventory-action", sourceMessageId: "message-generic", sourceText: "quantifié", normalizedLabel: "quantification", localRole: "action", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["inventory-signal"] },
    ],
    explicitRelations: [{
      inventoryRelationId: "inventory-relation-measurement",
      sourceInventoryItemId: "inventory-signal",
      targetInventoryItemId: "inventory-modality",
      sourceMessageId: "message-generic",
      sourceText: "imagerie phase tardive, signal quantifié",
      normalizedRelation: "MEASURED_BY",
      polarity: "AFFIRMED",
    }],
  },
  elements: [
    { clientElementId: "element-modality", type: "MODALITY", canonicalMeaning: "imagerie", studyRole: "MEASUREMENT", polarity: "AFFIRMED", inventoryItemIds: ["inventory-modality"], sourceMessageId: "message-generic", sourceText: "imagerie", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
    { clientElementId: "element-phase", type: "TIMING", canonicalMeaning: "phase tardive", studyRole: "NONE", polarity: "AFFIRMED", inventoryItemIds: ["inventory-phase"], sourceMessageId: "message-generic", sourceText: "phase tardive", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
    { clientElementId: "element-signal", type: "BIOMARKER", canonicalMeaning: "signal quantifié", studyRole: "MEASUREMENT", polarity: "AFFIRMED", inventoryItemIds: ["inventory-signal", "inventory-action"], sourceMessageId: "message-generic", sourceText: "signal quantifié", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
  ],
  relations: [{
    clientRelationId: "relation-measurement",
    sourceClientElementId: "element-signal",
    targetClientElementId: "element-modality",
    relationType: "MEASURED_BY",
    polarity: "AFFIRMED",
    inventoryRelationIds: ["inventory-relation-measurement"],
    epistemicStatus: "EXPLICIT_USER_STATED",
    confidence: 1,
    inferenceReason: null,
    requiresConfirmation: false,
  }],
  missingConcepts: [], ellipses: [], ambiguities: [], unknowns: [], contradictions: [], knowledgeRequests: [], clarificationCandidates: [],
  routeProposal: { route: "UNDERSTAND", confidence: .8, reason: "Initial explanation-only interpretation.", expectedCapabilities: ["EXPLANATION"] },
  semanticWarnings: [],
});

const audit = (status: "NOT_REQUIRED" | "AMBIGUOUS" = "NOT_REQUIRED"): SemanticAtomicCompositionAudit => parseSemanticAtomicCompositionAudit({
  auditId: "audit-generic",
  schemaVersion: "SEM-001-ATOMIC-COMPOSITION-1.1",
  verdict: status === "AMBIGUOUS" ? "CLARIFICATION_REQUIRED" : "ACCEPT",
  atomicityReports: [{
    reportId: "atomic-none",
    subjectInventoryItemIds: ["inventory-modality", "inventory-phase"],
    status: "NOT_APPLICABLE",
    constituents: [],
    directRelations: [],
    reason: "The components are already autonomous.",
  }],
  compositionReports: [{
    reportId: "composition-method",
    sourceInventoryItemIds: ["inventory-modality", "inventory-phase"],
    status,
    composite: null,
    relations: [],
    reason: status === "AMBIGUOUS" ? "The composition is ambiguous." : "No composite was requested by the audit.",
  }],
  routeAssessment: {
    status: "CORRECT",
    proposedRoute: null,
    confidence: .9,
    reason: "The initial route was accepted.",
    expectedCapabilities: ["EXPLANATION"],
  },
  summary: "The audit grouped the explicit components.",
});

const repair = (current = candidate(), currentAudit = audit()) => {
  const guarded = enforceAtomicCompositionAcceptanceConsistency(current, currentAudit, request());
  const compiled = compileAtomicCompositionRepairs(request(), current, guarded.audit);
  const applied = applyCriticRepairs(request(), current, compiled.repairs);
  return { guarded, compiled, applied };
};

describe("SEM-001R3H generic explicit composite method repair", () => {
  it("R3H-C01 forms a METHOD from an explicitly linked modality and acquisition qualifier", () => {
    const { applied } = repair();
    expect(applied.candidate.elements).toContainEqual(expect.objectContaining({ type: "METHOD", sourceText: "imagerie phase tardive", epistemicStatus: "EXPLICIT_USER_STATED" }));
  });

  it("R3H-C02 preserves both components after creating the composite", () => {
    const { applied } = repair();
    expect(applied.candidate.elements).toEqual(expect.arrayContaining([
      expect.objectContaining({ clientElementId: "element-modality", type: "MODALITY" }),
      expect.objectContaining({ clientElementId: "element-phase", type: "TIMING" }),
    ]));
  });

  it("R3H-C03 gives the composite its own exact reconstructible provenance", () => {
    const { applied } = repair();
    const method = applied.candidate.elements.find((item) => item.type === "METHOD");
    const fragment = applied.candidate.semanticInventory.explicitFragments.find((item) => method?.inventoryItemIds.includes(item.inventoryItemId));
    expect(method).toMatchObject({ sourceMessageId: "message-generic", sourceText: "imagerie phase tardive", inventoryItemIds: [expect.any(String)] });
    expect(fragment).toMatchObject({ sourceMessageId: "message-generic", sourceText: "imagerie phase tardive", linkedInventoryItemIds: ["inventory-modality", "inventory-phase"] });
  });

  it("R3H-C04 does not create a METHOD from mere juxtaposition", () => {
    const unlinked = candidate();
    unlinked.semanticInventory.explicitFragments.slice(0, 2).forEach((item) => { item.linkedInventoryItemIds = []; });
    const { guarded, compiled } = repair(unlinked);
    expect(guarded.changed).toBe(false);
    expect(compiled.repairs).toHaveLength(0);
  });

  it("R3H-C05 does not duplicate an existing composite method", () => {
    const first = repair().applied.candidate;
    const guarded = enforceAtomicCompositionAcceptanceConsistency(first, audit(), request());
    const compiled = compileAtomicCompositionRepairs(request(), first, guarded.audit);
    expect(guarded).toMatchObject({ changed: false, acceptAllowed: true });
    expect(compiled.repairs).toHaveLength(0);
    expect(first.elements.filter((item) => item.type === "METHOD")).toHaveLength(1);
  });

  it("R3H-C06 leaves an ambiguous composition ambiguous", () => {
    const { guarded, compiled } = repair(candidate(), audit("AMBIGUOUS"));
    expect(guarded).toMatchObject({ changed: false, acceptAllowed: false });
    expect(guarded.audit.compositionReports[0].status).toBe("AMBIGUOUS");
    expect(compiled.repairs).toHaveLength(0);
  });

  it("R3H-C07 adds only explicit structural and lifted relations without scientific inference", () => {
    const { applied } = repair();
    const method = applied.candidate.elements.find((item) => item.type === "METHOD")!;
    const addedRelations = applied.candidate.relations.filter((item) => item.clientRelationId !== "relation-measurement");
    expect(addedRelations.filter((item) => item.relationType === "COMPOSES")).toHaveLength(2);
    expect(addedRelations).toContainEqual(expect.objectContaining({ sourceClientElementId: "element-signal", targetClientElementId: method.clientElementId, relationType: "MEASURED_BY" }));
    expect(addedRelations.every((item) => item.epistemicStatus === "EXPLICIT_USER_STATED" && item.inferenceReason === null)).toBe(true);
  });

  it("R3H-C08 recomputes routing from the repaired graph and never from a fixture rule", () => {
    const routed = repair().applied.candidate;
    expect(routed.routeProposal).toMatchObject({ route: "FORMALIZE_IDEA", expectedCapabilities: ["SCIENTIFIC_FORMALIZATION", "METHOD_COMPOSITION"] });
    const withoutActionProof = candidate();
    withoutActionProof.semanticInventory.explicitFragments.find((item) => item.inventoryItemId === "inventory-action")!.linkedInventoryItemIds = [];
    expect(repair(withoutActionProof).applied.candidate.routeProposal.route).toBe("UNDERSTAND");
  });
});
