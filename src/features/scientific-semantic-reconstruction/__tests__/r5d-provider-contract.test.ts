import { describe, expect, it, vi } from "vitest";
import { canonicalizeSemanticReconstruction } from "../canonical";
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

const ungroundedPriorReemission = (changedMeaning = false) => {
  const firstRequest = makeSemanticRequest();
  const firstCandidate = comparisonCandidate();
  const previousModel = canonicalizeSemanticReconstruction({
    request: firstRequest,
    candidate: firstCandidate,
    critic: acceptedCritic(firstCandidate),
    metadata: { provider: "TEST", model: "test", temperature: null },
    reconstructionCallId: "prior-reconstruction",
    criticCallId: "prior-critic",
    now: "2026-08-13T08:00:00.000Z",
  });
  const priorCt = previousModel.elements.find((element) => element.canonicalMeaning === "CT")!;
  const priorMri = previousModel.elements.find((element) => element.canonicalMeaning === "IRM")!;
  const nextRequest = makeSemanticRequest([
    ...firstRequest.messages,
    { messageId: "user-2", role: "USER", content: "Ajoutez l'échographie.", createdAt: "2026-08-13T08:01:00.000Z" },
  ], previousModel);
  const raw = comparisonCandidate() as unknown as Record<string, unknown>;
  raw.candidateId = "candidate-prior-reemission";
  raw.normalizedMeaning = "Ajout de l'échographie avec conservation déterministe du contexte antérieur.";
  raw.summaryForUser = "L'échographie est ajoutée.";
  raw.semanticInventory = {
    explicitFragments: [{ inventoryItemId: "i-us", sourceMessageId: "user-2", sourceText: "échographie", normalizedLabel: "échographie", localRole: "modalité ajoutée", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: [] }],
    explicitRelations: [],
  };
  raw.elements = [
    { clientElementId: "e-us", type: "MODALITY", canonicalMeaning: "échographie", studyRole: "SUBJECT", polarity: "AFFIRMED", inventoryItemIds: ["i-us"], sourceMessageId: "user-2", sourceText: "échographie", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
    { clientElementId: "e-retained-ct", type: priorCt.type, canonicalMeaning: changedMeaning ? "CT amélioré" : priorCt.canonicalMeaning, studyRole: priorCt.studyRole, polarity: priorCt.polarity, inventoryItemIds: [], sourceMessageId: null, sourceText: null, epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: "Carried forward from previous model", requiresConfirmation: false, supersedesElementIds: [priorCt.semanticElementId] },
    { clientElementId: "e-retained-mri", type: priorMri.type, canonicalMeaning: priorMri.canonicalMeaning, studyRole: priorMri.studyRole, polarity: priorMri.polarity, inventoryItemIds: [], sourceMessageId: null, sourceText: null, epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: "Carried forward from previous model", requiresConfirmation: false, supersedesElementIds: [priorMri.semanticElementId] },
  ];
  raw.relations = [{ clientRelationId: "r-retained", sourceClientElementId: "e-retained-ct", targetClientElementId: "e-retained-mri", relationType: "COMPARES_WITH", polarity: "AFFIRMED", inventoryRelationIds: [], epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: "Carried forward relation", requiresConfirmation: false }];
  raw.missingConcepts = [];
  raw.ellipses = [];
  raw.ambiguities = [];
  raw.unknowns = [];
  raw.contradictions = [];
  raw.knowledgeRequests = [];
  raw.clarificationCandidates = [];
  raw.routeProposal = { route: "DESIGN_STUDY", confidence: 1, reason: "Une modalité est ajoutée.", expectedCapabilities: ["SCIENTIFIC_THINKING"] };
  raw.semanticWarnings = [];
  return { nextRequest, raw };
};

const inferredReplacementTopology = (ambiguous = false) => {
  const firstRequest = makeSemanticRequest();
  const firstCandidate = comparisonCandidate();
  const previousModel = canonicalizeSemanticReconstruction({
    request: firstRequest,
    candidate: firstCandidate,
    critic: acceptedCritic(firstCandidate),
    metadata: { provider: "TEST", model: "test", temperature: null },
    reconstructionCallId: "prior-reconstruction",
    criticCallId: "prior-critic",
    now: "2026-08-13T08:00:00.000Z",
  });
  const priorCt = previousModel.elements.find((element) => element.canonicalMeaning === "CT")!;
  const priorMri = previousModel.elements.find((element) => element.canonicalMeaning === "IRM")!;
  const currentText = ambiguous
    ? "Conservez IRM, retirez CT et ajoutez échographie et radiographie."
    : "Conservez IRM, retirez CT et ajoutez échographie.";
  const nextRequest = makeSemanticRequest([
    ...firstRequest.messages,
    { messageId: "user-2", role: "USER", content: currentText, createdAt: "2026-08-13T08:01:00.000Z" },
  ], previousModel);
  const raw = comparisonCandidate() as unknown as Record<string, unknown>;
  raw.candidateId = "candidate-replacement-topology";
  raw.normalizedMeaning = "Remplacement d'un bras d'une comparaison existante.";
  raw.summaryForUser = "Le bras antérieur est remplacé.";
  raw.semanticInventory = {
    explicitFragments: [
      { inventoryItemId: "i-mri-current", sourceMessageId: "user-2", sourceText: "IRM", normalizedLabel: "IRM", localRole: "retained comparison arm", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: [] },
      { inventoryItemId: "i-ct-current", sourceMessageId: "user-2", sourceText: "CT", normalizedLabel: "CT", localRole: "rejected comparison arm", polarity: "NEGATED", modifiers: [], linkedInventoryItemIds: [] },
      { inventoryItemId: "i-us-current", sourceMessageId: "user-2", sourceText: "échographie", normalizedLabel: "échographie", localRole: "replacement comparison arm", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: [] },
      ...(ambiguous ? [{ inventoryItemId: "i-xray-current", sourceMessageId: "user-2", sourceText: "radiographie", normalizedLabel: "radiographie", localRole: "additional comparison arm", polarity: "AFFIRMED" as const, modifiers: [], linkedInventoryItemIds: [] }] : []),
    ],
    explicitRelations: [],
  };
  raw.elements = [
    { clientElementId: "e-mri-current", type: priorMri.type, canonicalMeaning: priorMri.canonicalMeaning, studyRole: priorMri.studyRole, polarity: "AFFIRMED", inventoryItemIds: ["i-mri-current"], sourceMessageId: "user-2", sourceText: "IRM", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [priorMri.semanticElementId] },
    { clientElementId: "e-ct-rejected", type: priorCt.type, canonicalMeaning: priorCt.canonicalMeaning, studyRole: priorCt.studyRole, polarity: "NEGATED", inventoryItemIds: ["i-ct-current"], sourceMessageId: "user-2", sourceText: "CT", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [priorCt.semanticElementId] },
    { clientElementId: "e-us-new", type: priorCt.type, canonicalMeaning: "échographie", studyRole: priorCt.studyRole, polarity: "AFFIRMED", inventoryItemIds: ["i-us-current"], sourceMessageId: "user-2", sourceText: "échographie", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
    ...(ambiguous ? [{ clientElementId: "e-xray-new", type: priorCt.type, canonicalMeaning: "radiographie", studyRole: priorCt.studyRole, polarity: "AFFIRMED" as const, inventoryItemIds: ["i-xray-current"], sourceMessageId: "user-2", sourceText: "radiographie", epistemicStatus: "EXPLICIT_USER_STATED" as const, confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] }] : []),
  ];
  raw.relations = [{ clientRelationId: "r-us-mri", sourceClientElementId: "e-us-new", targetClientElementId: "e-mri-current", relationType: "COMPARES_WITH", polarity: "AFFIRMED", inventoryRelationIds: [], epistemicStatus: "INFERRED_HIGH_CONFIDENCE", confidence: .9, inferenceReason: "The new arm replaces the rejected arm in the active comparison.", requiresConfirmation: false }];
  raw.missingConcepts = [];
  raw.ellipses = [];
  raw.ambiguities = [];
  raw.unknowns = [];
  raw.contradictions = [];
  raw.knowledgeRequests = [];
  raw.clarificationCandidates = [];
  raw.routeProposal = { route: "DESIGN_STUDY", confidence: 1, reason: "A comparison arm is replaced.", expectedCapabilities: ["SCIENTIFIC_THINKING"] };
  raw.semanticWarnings = [];
  return { nextRequest, raw };
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
  it("grounds a unique same-role replacement in the explicit prior relation topology", async () => {
    const { nextRequest, raw } = inferredReplacementTopology();
    const fetchImpl = vi.fn(async () => response(raw)) as unknown as typeof fetch;
    const result = await provider(fetchImpl).reconstruct(nextRequest);
    expect(result.candidate.relations[0]).toMatchObject({ epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false });
    const inventoryRelation = result.candidate.semanticInventory.explicitRelations.find((relation) => result.candidate.relations[0].inventoryRelationIds.includes(relation.inventoryRelationId));
    expect(inventoryRelation).toMatchObject({ sourceInventoryItemId: "i-us-current", targetInventoryItemId: "i-mri-current", sourceMessageId: "user-2", sourceText: "Conservez IRM, retirez CT et ajoutez échographie.", normalizedRelation: "COMPARES_WITH" });
    expect(result.candidate.semanticWarnings).toContain("DETERMINISTIC_REPLACEMENT_RELATION_GROUNDED:1");
  });

  it("does not choose a replacement relation when multiple same-role additions remain", async () => {
    const { nextRequest, raw } = inferredReplacementTopology(true);
    const fetchImpl = vi.fn(async () => response(raw)) as unknown as typeof fetch;
    const result = await provider(fetchImpl).reconstruct(nextRequest);
    expect(result.candidate.relations[0].epistemicStatus).toBe("INFERRED_HIGH_CONFIDENCE");
    expect(result.candidate.semanticInventory.explicitRelations).toEqual([]);
    expect(result.candidate.semanticWarnings).not.toContain("DETERMINISTIC_REPLACEMENT_RELATION_GROUNDED:1");
  });

  it("deduplicates exact ungrounded prior-state reemission and leaves carry-forward to the canonicalizer", async () => {
    const { nextRequest, raw } = ungroundedPriorReemission();
    const fetchImpl = vi.fn(async () => response(raw)) as unknown as typeof fetch;
    const result = await provider(fetchImpl).reconstruct(nextRequest);
    expect(result.candidate.elements.map((element) => element.clientElementId)).toEqual(["e-us"]);
    expect(result.candidate.relations).toEqual([]);
    expect(result.candidate.semanticWarnings).toContain("DETERMINISTIC_PRIOR_STATE_REEMISSION_DEDUPLICATED:2:1");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("fails closed when an ungrounded item changes prior scientific meaning", async () => {
    const { nextRequest, raw } = ungroundedPriorReemission(true);
    const fetchImpl = vi.fn(async () => response(raw)) as unknown as typeof fetch;
    await expect(provider(fetchImpl).reconstruct(nextRequest)).rejects.toMatchObject({ category: "INVALID_STRUCTURED_OUTPUT" });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("derives an exact USER clause when unique relation endpoints make the source span unambiguous", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response(invalidSourceCandidate())) as unknown as typeof fetch;
    const result = await provider(fetchImpl).reconstruct(makeSemanticRequest());
    expect(result.candidate.semanticInventory.explicitRelations[0].sourceText).toBe("Je veux comparer CT et IRM cardiaque.");
    expect(result.candidate.semanticWarnings).toContain("DETERMINISTIC_INVENTORY_RELATION_SOURCE_SPAN_DERIVED:1");
    expect(result.attempts).toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
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

  it("uses at most two new generations before failing closed on exact source grounding", async () => {
    const irreparable = invalidSourceCandidate();
    irreparable.semanticInventory.explicitRelations[0].sourceMessageId = "unknown-user-message";
    const fetchImpl = vi.fn(async () => response(irreparable)) as unknown as typeof fetch;
    try {
      await provider(fetchImpl).reconstruct(makeSemanticRequest());
      throw new Error("EXPECTED_PROVIDER_ERROR");
    } catch (caught) {
      expect(caught).toBeInstanceOf(SemanticProviderError);
      expect(caught).toMatchObject({ category: "INVALID_STRUCTURED_OUTPUT" });
      expect((caught as SemanticProviderError).diagnostic?.validationIssues).toContainEqual(expect.objectContaining({ code: "INVENTORY_RELATION_SOURCE_NOT_CONTIGUOUS" }));
    }
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });
});
