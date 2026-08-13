import { describe, expect, it, vi } from "vitest";
import { buildSemanticCoverage } from "../coverage";
import { GeminiScientificSemanticProvider, SemanticProviderError } from "../provider";
import { SEMANTIC_CRITIC_CHECKS, type SemanticCriticRepair, type SemanticCriticResult } from "../types";
import { acceptedCritic, comparisonCandidate, makeSemanticRequest } from "./fixtures";

const response = (value: unknown) => new Response(JSON.stringify({
  candidates: [{ content: { parts: [{ text: JSON.stringify(value) }] }, finishReason: "STOP" }],
}), { status: 200, headers: { "content-type": "application/json" } });

const provider = (fetchImpl: typeof fetch) => new GeminiScientificSemanticProvider({
  apiKey: "test-key-never-logged",
  model: "generic-provider-contract-test",
  fetchImpl,
  maxAttempts: 1,
});

const invalidSourceCandidate = () => {
  const candidate = comparisonCandidate();
  candidate.semanticInventory.explicitRelations[0].sourceText = "comparer CT ... IRM";
  return candidate;
};

const emptyRepairFields = (): Omit<SemanticCriticRepair, "repairId" | "action" | "reason" | "sourceInventoryItemIds" | "sourceInventoryRelationIds"> => ({
  inventoryItemId: null,
  inventorySourceMessageId: null,
  inventorySourceText: null,
  inventoryNormalizedLabel: null,
  inventoryLocalRole: null,
  inventoryPolarity: null,
  inventoryModifiers: [],
  inventoryLinkedItemIds: [],
  inventoryRelationId: null,
  inventoryRelationSourceItemId: null,
  inventoryRelationTargetItemId: null,
  inventoryRelationSourceMessageId: null,
  inventoryRelationSourceText: null,
  inventoryNormalizedRelation: null,
  inventoryRelationPolarity: null,
  elementClientElementId: null,
  elementType: null,
  elementCanonicalMeaning: null,
  elementStudyRole: null,
  elementPolarity: null,
  elementInventoryItemIds: [],
  elementSourceMessageId: null,
  elementSourceText: null,
  elementEpistemicStatus: null,
  elementConfidence: null,
  elementInferenceReason: null,
  elementRequiresConfirmation: null,
  elementSupersedesElementIds: [],
  relationClientRelationId: null,
  relationSourceClientElementId: null,
  relationTargetClientElementId: null,
  relationType: null,
  relationPolarity: null,
  relationInventoryRelationIds: [],
  relationEpistemicStatus: null,
  relationConfidence: null,
  relationInferenceReason: null,
  relationRequiresConfirmation: null,
  ambiguity: null,
  route: null,
  routeConfidence: null,
  routeReason: null,
  routeExpectedCapabilities: [],
});

const invalidRepairCritic = (): SemanticCriticResult => ({
  ...acceptedCritic(),
  criticId: "critic-invalid-source-repair",
  verdict: "REVISE",
  checklist: SEMANTIC_CRITIC_CHECKS.map((check) => ({
    check,
    result: check === "NO_IMPORTANT_FRAGMENT_UNREPRESENTED" ? "FAIL" : "PASS",
    evidence: "A generic provenance defect remains.",
  })),
  issues: [{
    code: "EXPLICIT_SOURCE_FRAGMENT_MISSING_FROM_INVENTORY",
    severity: "CRITICAL",
    elementClientIds: [],
    description: "A relation source span is not contiguous.",
    recommendedAction: "Use an exact original USER span.",
    resolved: false,
  }],
  proposedRepairs: [{
    ...emptyRepairFields(),
    repairId: "repair-invalid-relation-source",
    action: "UPSERT_INVENTORY_RELATION",
    reason: "Replace a non-contiguous relation source span.",
    sourceInventoryItemIds: ["i-ct", "i-mri"],
    sourceInventoryRelationIds: ["ir-compare"],
    inventoryRelationId: "ir-compare",
    inventoryRelationSourceItemId: "i-ct",
    inventoryRelationTargetItemId: "i-mri",
    inventoryRelationSourceMessageId: "user-1",
    inventoryRelationSourceText: "comparer CT ... IRM",
    inventoryNormalizedRelation: "COMPARES_WITH",
    inventoryRelationPolarity: "AFFIRMED",
  }],
  criticSummary: "Revision required.",
});

describe("SEM generic provider structured-contract validation", () => {
  it("regenerates a reconstruction whose explicit relation source is not an exact USER substring", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(response(invalidSourceCandidate()))
      .mockResolvedValueOnce(response(comparisonCandidate())) as unknown as typeof fetch;
    const result = await provider(fetchImpl).reconstruct(makeSemanticRequest());
    expect(result.candidate.semanticInventory.explicitRelations[0].sourceText).toBe("comparer CT et IRM");
    expect(result.attempts).toHaveLength(2);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("regenerates a critic output containing a source-ungrounded repair", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(response(invalidRepairCritic()))
      .mockResolvedValueOnce(response(acceptedCritic())) as unknown as typeof fetch;
    const candidate = comparisonCandidate();
    const coverage = buildSemanticCoverage(makeSemanticRequest(), candidate);
    const result = await provider(fetchImpl).critique(makeSemanticRequest(), candidate, { ...coverage, cycle: 1 });
    expect(result.critic.verdict).toBe("ACCEPT");
    expect(result.attempts).toHaveLength(2);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("fails closed when bounded regeneration still violates exact source grounding", async () => {
    const fetchImpl = vi.fn(async () => response(invalidSourceCandidate())) as unknown as typeof fetch;
    try {
      await provider(fetchImpl).reconstruct(makeSemanticRequest());
      throw new Error("EXPECTED_PROVIDER_ERROR");
    } catch (caught) {
      expect(caught).toBeInstanceOf(SemanticProviderError);
      expect(caught).toMatchObject({ category: "INVALID_STRUCTURED_OUTPUT" });
      expect((caught as SemanticProviderError).diagnostic?.validationIssues).toContainEqual(expect.objectContaining({ code: "INVENTORY_RELATION_SOURCE_NOT_CONTIGUOUS" }));
    }
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
