import { describe, expect, it } from "vitest";
import {
  compileAtomicCompositionRepairs,
  enforceAtomicCompositionAcceptanceConsistency,
  parseSemanticAtomicCompositionAudit,
  type SemanticAtomicCompositionAudit,
} from "../atomic-composition";
import { applyCriticRepairs } from "../coverage";
import type { SemanticReconstructionCandidate, SemanticReconstructionRequest, SemanticStudyRole } from "../types";

const request = (): SemanticReconstructionRequest => ({
  schemaVersion: "SEM-001-1.1",
  sessionId: "atomic-classification-generic",
  language: "fr",
  messages: [{
    messageId: "message-generic",
    role: "USER",
    content: "Aligner la mesure entre la limite basse et la limite haute sur plusieurs sites.",
    createdAt: "2026-08-12T16:00:00.000Z",
  }],
  previousModel: null,
});

const candidate = (): SemanticReconstructionCandidate => ({
  candidateId: "candidate-generic",
  language: "fr",
  normalizedMeaning: "Aligner une mesure entre deux limites techniques sur plusieurs sites.",
  summaryForUser: "La mesure, ses limites et le contexte multisite sont conservés.",
  semanticInventory: {
    explicitFragments: [
      { inventoryItemId: "inventory-intent", sourceMessageId: "message-generic", sourceText: "Aligner", normalizedLabel: "aligner les limites de mesure", localRole: "scientific intent", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["inventory-method", "inventory-boundaries"] },
      { inventoryItemId: "inventory-method", sourceMessageId: "message-generic", sourceText: "mesure", normalizedLabel: "mesure", localRole: "measurement target", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: [] },
      { inventoryItemId: "inventory-boundaries", sourceMessageId: "message-generic", sourceText: "limite basse et la limite haute", normalizedLabel: "limites basse et haute", localRole: "technical parameter boundaries", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: [] },
      { inventoryItemId: "inventory-setting", sourceMessageId: "message-generic", sourceText: "plusieurs sites", normalizedLabel: "plusieurs sites", localRole: "study setting", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: [] },
    ],
    explicitRelations: [
      { inventoryRelationId: "inventory-relation-intent", sourceInventoryItemId: "inventory-intent", targetInventoryItemId: "inventory-method", sourceMessageId: "message-generic", sourceText: "Aligner la mesure", normalizedRelation: "AIMS_TO_MODIFY", polarity: "AFFIRMED" },
    ],
  },
  elements: [
    { clientElementId: "element-intent", type: "SCIENTIFIC_INTENT", canonicalMeaning: "align measurement boundaries", studyRole: "NONE", polarity: "AFFIRMED", inventoryItemIds: ["inventory-intent"], sourceMessageId: "message-generic", sourceText: "Aligner", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
    { clientElementId: "element-method", type: "METHOD", canonicalMeaning: "measurement", studyRole: "MEASUREMENT", polarity: "AFFIRMED", inventoryItemIds: ["inventory-method"], sourceMessageId: "message-generic", sourceText: "mesure", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
    { clientElementId: "element-aggregate", type: "MODALITY", canonicalMeaning: "low and high technical boundaries", studyRole: "NONE", polarity: "AFFIRMED", inventoryItemIds: ["inventory-boundaries"], sourceMessageId: "message-generic", sourceText: "limite basse et la limite haute", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
    { clientElementId: "element-setting", type: "STUDY_DESIGN", canonicalMeaning: "multiple sites", studyRole: "NONE", polarity: "AFFIRMED", inventoryItemIds: ["inventory-setting"], sourceMessageId: "message-generic", sourceText: "plusieurs sites", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
  ],
  relations: [],
  missingConcepts: [], ellipses: [], ambiguities: [], unknowns: [], contradictions: [], knowledgeRequests: [], clarificationCandidates: [],
  routeProposal: { route: "DESIGN_STUDY", confidence: .9, reason: "The request concerns study design.", expectedCapabilities: ["STUDY_DESIGN"] },
  semanticWarnings: [],
});

const audit = (
  status: "COMPLETE" | "INCOMPLETE" = "INCOMPLETE",
  roles: [SemanticStudyRole, SemanticStudyRole] = ["NONE", "NONE"],
): SemanticAtomicCompositionAudit => parseSemanticAtomicCompositionAudit({
  auditId: "audit-generic",
  schemaVersion: "SEM-001-ATOMIC-COMPOSITION-1.1",
  verdict: status === "COMPLETE" ? "ACCEPT" : "REVISE",
  atomicityReports: [{
    reportId: "atomic-boundaries",
    subjectInventoryItemIds: ["inventory-boundaries"],
    status,
    constituents: [
      { constituentId: "constituent-low", sourceMessageId: "message-generic", sourceText: "limite basse", normalizedMeaning: "low boundary", semanticType: "MODALITY", studyRole: roles[0], polarity: "AFFIRMED" },
      { constituentId: "constituent-high", sourceMessageId: "message-generic", sourceText: "limite haute", normalizedMeaning: "high boundary", semanticType: "MODALITY", studyRole: roles[1], polarity: "AFFIRMED" },
    ],
    directRelations: [{ sourceConstituentId: "constituent-low", targetConstituentId: "constituent-high", sourceMessageId: "message-generic", sourceText: "limite basse et la limite haute", relationType: "COORDINATED_WITH", polarity: "AFFIRMED" }],
    reason: "Two autonomous technical values are carried by a linked comparative intent.",
  }],
  compositionReports: [{ reportId: "composition-none", sourceInventoryItemIds: ["inventory-method", "inventory-boundaries"], status: "NOT_REQUIRED", composite: null, relations: [], reason: "No additional composite is expressed." }],
  routeAssessment: { status: "CORRECT", proposedRoute: null, confidence: .9, reason: "The route remains valid.", expectedCapabilities: ["STUDY_DESIGN"] },
  summary: "The aggregate must expose its autonomous constituents and their direct scientific relation.",
});

const repair = (current = candidate(), report = audit()) => {
  const compilation = compileAtomicCompositionRepairs(request(), current, report);
  return { compilation, applied: applyCriticRepairs(request(), current, compilation.repairs) };
};

describe("SEM-001R3G generic atomic canonical classification", () => {
  it("R3G-C01 keeps two autonomous values in one technical context distinct", () => {
    const { applied } = repair();
    expect(applied.candidate.elements.filter((item) => ["limite basse", "limite haute"].includes(item.sourceText ?? ""))).toHaveLength(2);
  });

  it("R3G-C02 determines canonical type from structured semantic role rather than technical domain", () => {
    const { applied, compilation } = repair();
    expect(applied.candidate.elements.filter((item) => ["limite basse", "limite haute"].includes(item.sourceText ?? "")).map((item) => item.type)).toEqual(["CONSTRAINT", "CONSTRAINT"]);
    expect(compilation.classifications.filter((item) => item.scope === "CONSTITUENT_TYPE").every((item) => item.disposition === "RECLASSIFIED_FROM_SEMANTIC_ROLE")).toBe(true);
  });

  it("R3G-C03 materializes a direct scientific comparison when the structured intent compares the values", () => {
    const { applied } = repair();
    expect(applied.candidate.relations.filter((item) => item.relationType === "COMPARES_WITH")).toHaveLength(1);
  });

  it("R3G-C04 does not retain linguistic coordination as a substitute for explicit comparative meaning", () => {
    const { applied, compilation } = repair();
    expect(applied.candidate.relations.some((item) => item.relationType === "COORDINATED_WITH")).toBe(false);
    expect(compilation.classifications.find((item) => item.scope === "DIRECT_RELATION")).toMatchObject({ suppliedValue: "COORDINATED_WITH", effectiveValue: "COMPARES_WITH", disposition: "RECLASSIFIED_FROM_SEMANTIC_ROLE" });
  });

  it("R3G-C05 preserves study role independently from canonical semantic type", () => {
    const { applied } = repair(candidate(), audit("INCOMPLETE", ["NONE", "COMPARATOR_ARM"]));
    expect(applied.candidate.elements.find((item) => item.sourceText === "limite haute")).toMatchObject({ type: "CONSTRAINT", studyRole: "COMPARATOR_ARM" });
  });

  it("R3G-C06 preserves the source aggregate and exact provenance while adding constituents", () => {
    const { applied } = repair();
    expect(applied.candidate.semanticInventory.explicitFragments.find((item) => item.inventoryItemId === "inventory-boundaries")).toMatchObject({ sourceMessageId: "message-generic", sourceText: "limite basse et la limite haute" });
    expect(applied.candidate.elements.find((item) => item.clientElementId === "element-aggregate")).toMatchObject({ sourceMessageId: "message-generic", sourceText: "limite basse et la limite haute" });
  });

  it("R3G-C07 invents neither objects nor relations when any required finding lacks source grounding", () => {
    const invalid = audit();
    invalid.atomicityReports[0].constituents[1].sourceText = "valeur absente";
    const compilation = compileAtomicCompositionRepairs(request(), candidate(), invalid);
    expect(compilation.repairs).toHaveLength(0);
    expect(compilation.diagnostics[0]).toMatchObject({ status: "REJECTED", reason: "ATOMICITY_CONSTITUENT_NOT_SOURCE_GROUNDED" });
  });

  it("R3G-C08 leaves an already correct reconstruction unchanged", () => {
    const first = repair().applied.candidate;
    const guarded = enforceAtomicCompositionAcceptanceConsistency(first, audit("COMPLETE"));
    const compilation = compileAtomicCompositionRepairs(request(), first, guarded.audit);
    expect(guarded).toMatchObject({ changed: false, acceptAllowed: true });
    expect(compilation.repairs).toHaveLength(0);
    expect(first.elements.filter((item) => ["limite basse", "limite haute"].includes(item.sourceText ?? ""))).toHaveLength(2);
  });
});
