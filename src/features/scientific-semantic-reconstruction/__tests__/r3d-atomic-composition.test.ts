import { describe, expect, it } from "vitest";
import {
  atomicCompositionAcceptIsConsistent,
  compileAtomicCompositionRepairs,
  parseSemanticAtomicCompositionAudit,
  runSemanticAtomicCompositionCycles,
  type SemanticAtomicCompositionAudit,
  type SemanticAtomicCompositionProvider,
} from "../atomic-composition";
import { applyCriticRepairs } from "../coverage";
import type { SemanticReconstructionCandidate, SemanticReconstructionRequest } from "../types";

const request = (): SemanticReconstructionRequest => ({
  schemaVersion: "SEM-001-1.1",
  sessionId: "r3d-generic-contract",
  language: "fr",
  messages: [{ messageId: "user-generic", role: "USER", content: "Comparer alpha et beta avec une radiographie dynamique.", createdAt: "2026-08-12T10:00:00.000Z" }],
  previousModel: null,
});

const candidate = (): SemanticReconstructionCandidate => ({
  candidateId: "candidate-generic",
  language: "fr",
  normalizedMeaning: "Comparer un agrégat avec une modalité et une condition.",
  summaryForUser: "La comparaison, la modalité et la condition sont conservées.",
  semanticInventory: {
    explicitFragments: [
      { inventoryItemId: "inv-aggregate", sourceMessageId: "user-generic", sourceText: "alpha et beta", normalizedLabel: "alpha et beta", localRole: "aggregate", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: [] },
      { inventoryItemId: "inv-modality", sourceMessageId: "user-generic", sourceText: "radiographie", normalizedLabel: "radiographie", localRole: "modality", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["inv-condition"] },
      { inventoryItemId: "inv-condition", sourceMessageId: "user-generic", sourceText: "dynamique", normalizedLabel: "dynamique", localRole: "condition", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["inv-modality"] },
    ],
    explicitRelations: [],
  },
  elements: [
    { clientElementId: "e-aggregate", type: "CONSTRAINT", canonicalMeaning: "alpha et beta", studyRole: "NONE", polarity: "AFFIRMED", inventoryItemIds: ["inv-aggregate"], sourceMessageId: "user-generic", sourceText: "alpha et beta", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
    { clientElementId: "e-modality", type: "MODALITY", canonicalMeaning: "radiographie", studyRole: "NONE", polarity: "AFFIRMED", inventoryItemIds: ["inv-modality"], sourceMessageId: "user-generic", sourceText: "radiographie", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
    { clientElementId: "e-condition", type: "CONDITION", canonicalMeaning: "dynamique", studyRole: "NONE", polarity: "AFFIRMED", inventoryItemIds: ["inv-condition"], sourceMessageId: "user-generic", sourceText: "dynamique", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
  ],
  relations: [], missingConcepts: [], ellipses: [], ambiguities: [], unknowns: [], contradictions: [], knowledgeRequests: [], clarificationCandidates: [],
  routeProposal: { route: "UNDERSTAND", confidence: .8, reason: "Question exploratoire.", expectedCapabilities: ["SCIENTIFIC_THINKING"] }, semanticWarnings: [],
});

const acceptAudit = (): SemanticAtomicCompositionAudit => parseSemanticAtomicCompositionAudit({
  auditId: "audit-accept", schemaVersion: "SEM-001-ATOMIC-COMPOSITION-1.1", verdict: "ACCEPT",
  atomicityReports: [{ reportId: "atomic-na", subjectInventoryItemIds: ["inv-aggregate"], status: "NOT_APPLICABLE", constituents: [], directRelations: [], reason: "No source-grounded autonomy requiring repair." }],
  compositionReports: [{ reportId: "composition-na", sourceInventoryItemIds: ["inv-modality", "inv-condition"], status: "NOT_REQUIRED", composite: null, relations: [], reason: "No additional composite is expressed." }],
  routeAssessment: { status: "CORRECT", proposedRoute: null, confidence: .9, reason: "The route matches the request.", expectedCapabilities: ["SCIENTIFIC_THINKING"] }, summary: "The candidate is complete for both bounded controls.",
});

const atomicRevision = (): SemanticAtomicCompositionAudit => parseSemanticAtomicCompositionAudit({
  auditId: "audit-atomic", schemaVersion: "SEM-001-ATOMIC-COMPOSITION-1.1", verdict: "REVISE",
  atomicityReports: [{ reportId: "atomic-repair", subjectInventoryItemIds: ["inv-aggregate"], status: "INCOMPLETE", reason: "The user treats two constituents independently.",
    constituents: [
      { constituentId: "local-alpha", sourceMessageId: "user-generic", sourceText: "alpha", normalizedMeaning: "alpha", semanticType: "CONSTRAINT", studyRole: "NONE", polarity: "AFFIRMED" },
      { constituentId: "local-beta", sourceMessageId: "user-generic", sourceText: "beta", normalizedMeaning: "beta", semanticType: "CONSTRAINT", studyRole: "NONE", polarity: "AFFIRMED" },
    ], directRelations: [{ sourceConstituentId: "local-alpha", targetConstituentId: "local-beta", sourceMessageId: "user-generic", sourceText: "alpha et beta", relationType: "COMPARES_WITH", polarity: "AFFIRMED" }] }],
  compositionReports: [{ reportId: "composition-na", sourceInventoryItemIds: ["inv-modality", "inv-condition"], status: "NOT_REQUIRED", composite: null, relations: [], reason: "No composition repair in this audit." }],
  routeAssessment: { status: "CORRECT", proposedRoute: null, confidence: .9, reason: "The route remains correct.", expectedCapabilities: ["SCIENTIFIC_THINKING"] }, summary: "Atomic constituents and their direct relation must be represented.",
});

const compositionRevision = (): SemanticAtomicCompositionAudit => parseSemanticAtomicCompositionAudit({
  auditId: "audit-composition", schemaVersion: "SEM-001-ATOMIC-COMPOSITION-1.1", verdict: "REVISE",
  atomicityReports: [{ reportId: "atomic-na", subjectInventoryItemIds: ["inv-aggregate"], status: "NOT_APPLICABLE", constituents: [], directRelations: [], reason: "No atomic repair in this audit." }],
  compositionReports: [{ reportId: "composition-repair", sourceInventoryItemIds: ["inv-modality", "inv-condition"], status: "INCOMPLETE", reason: "The source expresses an additional composite method.",
    composite: { compositeId: "local-composite", sourceMessageId: "user-generic", sourceText: "radiographie dynamique", normalizedMeaning: "radiographie dynamique", semanticType: "METHOD", studyRole: "MEASUREMENT", polarity: "AFFIRMED" },
    relations: [{ sourceInventoryItemId: "inv-aggregate", sourceIsComposite: false, targetInventoryItemId: null, targetIsComposite: true, sourceMessageId: "user-generic", sourceText: "alpha et beta avec une radiographie dynamique", relationType: "ASSESSED_WITH", polarity: "AFFIRMED" }] }],
  routeAssessment: { status: "CORRECT", proposedRoute: null, confidence: .9, reason: "The route remains correct.", expectedCapabilities: ["SCIENTIFIC_THINKING"] }, summary: "The explicit composite must coexist with its constituents.",
});

describe("SEM-001R3D generic atomic inventory and semantic composition contracts", () => {
  it("R3D-C01 accepts a structurally complete bounded audit", () => expect(acceptAudit().verdict).toBe("ACCEPT"));
  it("R3D-C02 rejects ACCEPT when an atomicity report remains incomplete", () => expect(() => parseSemanticAtomicCompositionAudit({ ...acceptAudit(), verdict: "ACCEPT", atomicityReports: atomicRevision().atomicityReports })).toThrow());
  it("R3D-C03 rejects REVISE without a source-grounded repair target", () => expect(() => parseSemanticAtomicCompositionAudit({ ...acceptAudit(), verdict: "REVISE" })).toThrow());
  it("R3D-C04 preserves the aggregate inventory fragment during atomic compilation", () => {
    const compiled = compileAtomicCompositionRepairs(request(), candidate(), atomicRevision());
    const repaired = applyCriticRepairs(request(), candidate(), compiled.repairs).candidate;
    expect(repaired.semanticInventory.explicitFragments.some((item) => item.inventoryItemId === "inv-aggregate")).toBe(true);
  });
  it("R3D-C05 creates two autonomous explicit constituents from a semantic report", () => {
    const compiled = compileAtomicCompositionRepairs(request(), candidate(), atomicRevision());
    const repaired = applyCriticRepairs(request(), candidate(), compiled.repairs).candidate;
    expect(repaired.elements.filter((item) => ["alpha", "beta"].includes(item.sourceText ?? "") && item.type === "CONSTRAINT")).toHaveLength(2);
  });
  it("R3D-C06 creates the direct source-grounded relation between constituents", () => {
    const compiled = compileAtomicCompositionRepairs(request(), candidate(), atomicRevision());
    const repaired = applyCriticRepairs(request(), candidate(), compiled.repairs).candidate;
    expect(repaired.relations.some((item) => item.relationType === "COMPARES_WITH" && item.epistemicStatus === "EXPLICIT_USER_STATED")).toBe(true);
  });
  it("R3D-C07 does not split an aggregate without an INCOMPLETE semantic report", () => expect(compileAtomicCompositionRepairs(request(), candidate(), acceptAudit()).repairs).toHaveLength(0));
  it("R3D-C08 rejects a constituent that is not an exact user span", () => {
    const audit = atomicRevision(); audit.atomicityReports[0].constituents[0].sourceText = "gamma";
    expect(compileAtomicCompositionRepairs(request(), candidate(), audit).diagnostics[0]).toMatchObject({ status: "REJECTED", reason: "ATOMICITY_CONSTITUENT_NOT_SOURCE_GROUNDED" });
  });
  it("R3D-C09 rejects an unknown aggregate inventory owner", () => {
    const audit = atomicRevision(); audit.atomicityReports[0].subjectInventoryItemIds = ["inv-unknown"];
    expect(compileAtomicCompositionRepairs(request(), candidate(), audit).diagnostics[0]).toMatchObject({ status: "REJECTED", reason: "ATOMICITY_SUBJECT_INVENTORY_UNKNOWN" });
  });
  it("R3D-C10 reuses an already represented constituent rather than duplicating it", () => {
    const current = candidate(); current.semanticInventory.explicitFragments.push({ inventoryItemId: "inv-alpha", sourceMessageId: "user-generic", sourceText: "alpha", normalizedLabel: "alpha", localRole: "constituent", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["inv-aggregate"] });
    current.elements.push({ clientElementId: "e-alpha", type: "CONSTRAINT", canonicalMeaning: "alpha", studyRole: "NONE", polarity: "AFFIRMED", inventoryItemIds: ["inv-alpha"], sourceMessageId: "user-generic", sourceText: "alpha", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] });
    const repaired = applyCriticRepairs(request(), current, compileAtomicCompositionRepairs(request(), current, atomicRevision()).repairs).candidate;
    expect(repaired.elements.filter((item) => item.sourceText === "alpha" && item.type === "CONSTRAINT")).toHaveLength(1);
  });
  it("R3D-C11 creates a composite semantic object with the requested type", () => {
    const compiled = compileAtomicCompositionRepairs(request(), candidate(), compositionRevision());
    const repaired = applyCriticRepairs(request(), candidate(), compiled.repairs).candidate;
    expect(repaired.elements.some((item) => item.type === "METHOD" && item.sourceText === "radiographie dynamique")).toBe(true);
  });
  it("R3D-C12 preserves constituent modality and condition when adding a composite", () => {
    const repaired = applyCriticRepairs(request(), candidate(), compileAtomicCompositionRepairs(request(), candidate(), compositionRevision()).repairs).candidate;
    expect(repaired.elements.some((item) => item.clientElementId === "e-modality")).toBe(true);
    expect(repaired.elements.some((item) => item.clientElementId === "e-condition")).toBe(true);
  });
  it("R3D-C13 links a composite inventory item to all source constituents", () => {
    const repaired = applyCriticRepairs(request(), candidate(), compileAtomicCompositionRepairs(request(), candidate(), compositionRevision()).repairs).candidate;
    expect(repaired.semanticInventory.explicitFragments.find((item) => item.sourceText === "radiographie dynamique")?.linkedInventoryItemIds).toEqual(["inv-modality", "inv-condition"]);
    expect(repaired.relations.some((item) => item.relationType === "ASSESSED_WITH")).toBe(true);
  });
  it("R3D-C14 rejects a composite that is not an exact user span", () => {
    const audit = compositionRevision(); audit.compositionReports[0].composite!.sourceText = "modalité statique";
    expect(compileAtomicCompositionRepairs(request(), candidate(), audit).diagnostics[0]).toMatchObject({ status: "REJECTED", reason: "COMPOSITE_NOT_SOURCE_GROUNDED" });
  });
  it("R3D-C15 compiles a route change only when the audit marks the current route incorrect", () => {
    const audit = compositionRevision(); audit.routeAssessment = { status: "INCORRECT", proposedRoute: "DESIGN_STUDY", confidence: .95, reason: "The explicit request is study design.", expectedCapabilities: ["STUDY_DESIGN"] };
    expect(compileAtomicCompositionRepairs(request(), candidate(), audit).repairs.at(-1)).toMatchObject({ action: "SET_ROUTE", route: "DESIGN_STUDY" });
  });
  it("R3D-C16 accepts only a complete audit with a correct route", () => {
    expect(atomicCompositionAcceptIsConsistent(acceptAudit())).toBe(true);
    expect(atomicCompositionAcceptIsConsistent(compositionRevision())).toBe(false);
  });
  it("R3D-C17 runs a bounded repair cycle followed by an independent acceptance audit", async () => {
    const audits = [atomicRevision(), acceptAudit()];
    const provider: SemanticAtomicCompositionProvider = { metadata: { provider: "TEST", model: "generic", temperature: null }, async auditAtomicComposition(_request, _candidate, cycle) { return { callId: `audit-${cycle}`, audit: audits[cycle - 1] }; } };
    const result = await runSemanticAtomicCompositionCycles(provider, request(), candidate());
    expect(result).toMatchObject({ accepted: true, terminalReason: "ATOMIC_COMPOSITION_AUDIT_ACCEPTED" });
    expect(result.callIds).toEqual(["audit-1", "audit-2"]);
  });
});
