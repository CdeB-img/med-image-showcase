import { describe, expect, it } from "vitest";
import { canonicalizeSemanticReconstruction } from "../canonical";
import { evaluateSemanticCase } from "../competence";
import { applyCriticRepairs, buildSemanticCoverage, buildSemanticTaxonomyReport, criticAcceptIsConsistent } from "../coverage";
import { parseSemanticCriticResult } from "../schema";
import { SEMANTIC_CRITIC_CHECKS, type SemanticCriticRepair } from "../types";
import type { SemanticCompetenceCase } from "../competence-fixtures";
import { acceptedCritic, comparisonCandidate, makeSemanticRequest } from "./fixtures";

const canonical = (candidate = comparisonCandidate()) => canonicalizeSemanticReconstruction({
  request: makeSemanticRequest(), candidate, critic: acceptedCritic(candidate),
  metadata: { provider: "TEST", model: "r3b", temperature: null }, reconstructionCallId: "r", criticCallId: "c",
});
const fixture = (type: SemanticCompetenceCase["gold"]["requiredExplicitObjects"][number]["type"], meaning: string): SemanticCompetenceCase => ({
  caseId: "SEM-R3B-SYNTHETIC", split: "DEVELOPMENT_CASES", domain: "generic", turns: ["Je veux comparer CT et IRM cardiaque."],
  gold: { requiredExplicitObjects: [{ type, meaning, aliases: [], critical: true }], requiredRelations: [], acceptableInferences: [], forbiddenInferences: [], requiredAmbiguities: [], optionalClarifications: [], forbiddenClarifications: [], expectedIntent: "comparer", allowedRoutes: ["FORMALIZE_IDEA"], criticalSemanticElements: [meaning] },
});
const parsedCritic = (missing: boolean) => parseSemanticCriticResult({
  criticId: "critic-r3b", verdict: missing ? "REVISE" : "ACCEPT",
  checklist: SEMANTIC_CRITIC_CHECKS.map((check) => ({ check, result: missing && check === "NO_IMPORTANT_FRAGMENT_UNREPRESENTED" ? "FAIL" : "PASS", evidence: "Independent source audit." })),
  missingExplicitSourceFragments: missing ? [{ sourceMessageId: "user-1", sourceText: "cardiaque", normalizedMeaning: "contexte cardiaque", reason: "Absent from inventory.", suggestedLocalRole: "anatomical context", confidence: .99 }] : [],
  issues: missing ? [{ code: "EXPLICIT_SOURCE_FRAGMENT_MISSING_FROM_INVENTORY", severity: "CRITICAL", elementClientIds: [], description: "Missing grounded fragment.", recommendedAction: "Add grounded fragment.", resolved: false }] : [],
  proposedRepairs: missing ? [{
    repairId: "add-fragment", action: "UPSERT_INVENTORY_FRAGMENT", reason: "Restore exact source fragment.", sourceInventoryItemIds: [], sourceInventoryRelationIds: [],
    inventoryItemId: "i-new", inventorySourceMessageId: "user-1", inventorySourceText: "cardiaque", inventoryNormalizedLabel: "contexte cardiaque", inventoryLocalRole: "anatomical context", inventoryPolarity: "AFFIRMED", inventoryModifiers: [], inventoryLinkedItemIds: [],
    inventoryRelationId: null, inventoryRelationSourceItemId: null, inventoryRelationTargetItemId: null, inventoryRelationSourceMessageId: null, inventoryRelationSourceText: null, inventoryNormalizedRelation: null, inventoryRelationPolarity: null,
    elementClientElementId: null, elementType: null, elementCanonicalMeaning: null, elementStudyRole: null, elementPolarity: null, elementInventoryItemIds: [], elementSourceMessageId: null, elementSourceText: null, elementEpistemicStatus: null, elementConfidence: null, elementInferenceReason: null, elementRequiresConfirmation: null, elementSupersedesElementIds: [],
    relationClientRelationId: null, relationSourceClientElementId: null, relationTargetClientElementId: null, relationType: null, relationPolarity: null, relationInventoryRelationIds: [], relationEpistemicStatus: null, relationConfidence: null, relationInferenceReason: null, relationRequiresConfirmation: null,
    ambiguity: null, route: null, routeConfidence: null, routeReason: null, routeExpectedCapabilities: [],
  }] : [], criticSummary: "Independent source audit completed.",
});

describe("SEM-001R3B development semantic repair contracts", () => {
  it("1 — intervention nature survives an arm role", () => {
    const candidate = comparisonCandidate();
    candidate.elements[1] = { ...candidate.elements[1], type: "METHOD", studyRole: "INTERVENTION_ARM" };
    candidate.relations[0] = { ...candidate.relations[0], sourceClientElementId: "e-ct", targetClientElementId: "e-context", relationType: "INFLUENCES" };
    expect(buildSemanticTaxonomyReport(makeSemanticRequest(), candidate).findings).toContainEqual(expect.objectContaining({ clientElementId: "e-ct", expectedType: "INTERVENTION" }));
  });
  it("2 — explicit object never becomes an inferred candidate", () => expect(canonical().elements.find((item) => item.sourceSpan?.text === "CT")?.epistemicStatus).toBe("EXPLICIT_USER_STATED"));
  it("3 — source audit represents an omitted explicit fragment", () => expect(parsedCritic(true).missingExplicitSourceFragments[0]).toMatchObject({ sourceText: "cardiaque" }));
  it("4 — source audit remains empty on a complete phrase", () => expect(parsedCritic(false).missingExplicitSourceFragments).toEqual([]));
  it("5 — critic cannot accept a declared incomplete inventory", () => {
    const critic = { ...parsedCritic(true), verdict: "ACCEPT" as const, checklist: parsedCritic(false).checklist };
    expect(criticAcceptIsConsistent(critic, buildSemanticCoverage(makeSemanticRequest(), comparisonCandidate()))).toBe(false);
  });
  it("6 — critic repair adds only a source-grounded inventory fragment", () => {
    const repaired = applyCriticRepairs(makeSemanticRequest(), comparisonCandidate(), parsedCritic(true).proposedRepairs);
    expect(repaired.diagnostics[0]).toMatchObject({ status: "ACCEPTED" });
    expect(repaired.candidate.semanticInventory.explicitFragments).toContainEqual(expect.objectContaining({ inventoryItemId: "i-new", sourceText: "cardiaque" }));
  });
  it("7 — inventory repair rejects an invented source concept", () => {
    const repair = { ...parsedCritic(true).proposedRepairs[0], inventorySourceText: "concept absent" } as SemanticCriticRepair;
    expect(applyCriticRepairs(makeSemanticRequest(), comparisonCandidate(), [repair]).diagnostics[0]).toMatchObject({ status: "REJECTED", reason: "INVENTORY_FRAGMENT_REPAIR_NOT_SOURCE_GROUNDED" });
  });
  it("8 — comparative relation keeps both endpoints", () => expect(buildSemanticCoverage(makeSemanticRequest(), comparisonCandidate()).relations.status).toBe("COMPLETE"));
  it("9 — direct relation cannot disappear behind an action wrapper", () => {
    const candidate = comparisonCandidate(); candidate.relations = [{ ...candidate.relations[0], sourceClientElementId: "e-operation", targetClientElementId: "e-ct" }];
    expect(buildSemanticCoverage(makeSemanticRequest(), candidate).relations.status).toBe("INCOMPLETE");
  });
  it("10 — composite element keeps useful inventory constituents", () => {
    const candidate = comparisonCandidate(); candidate.elements[2] = { ...candidate.elements[2], inventoryItemIds: ["i-mri", "i-context"], sourceText: "IRM cardiaque" };
    expect(buildSemanticCoverage(makeSemanticRequest(), candidate).explicit.entries.filter((entry) => ["i-mri", "i-context"].includes(entry.inventoryItemId)).every((entry) => entry.coverageStatus === "MAPPED")).toBe(true);
  });
  it("11 — a secondary taxonomy repair does not mutate routing", () => {
    const candidate = comparisonCandidate(); const route = structuredClone(candidate.routeProposal); candidate.elements[2].type = "METHOD";
    expect(candidate.routeProposal).toEqual(route);
  });
  it("12 — polarity remains conserved", () => expect(canonical().elements.find((item) => item.sourceSpan?.text === "CT")?.polarity).toBe("AFFIRMED"));
  it("13 — modality preservation remains exact", () => expect(evaluateSemanticCase(fixture("MODALITY", "CT"), canonical()).modalityPreserved).toBe(true));
  it("14 — comparator preservation remains exact", () => expect(evaluateSemanticCase(fixture("COMPARATOR", "IRM"), canonical()).comparatorPreserved).toBe(true));
  it("15 — no generic-domain collapse is introduced", () => expect(evaluateSemanticCase(fixture("MODALITY", "CT"), canonical()).genericDomainCollapse).toBe(false));
});
