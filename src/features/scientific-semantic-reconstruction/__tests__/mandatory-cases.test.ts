import { describe, expect, it } from "vitest";
import { acceptSemanticModel, canonicalizeSemanticReconstruction, createDegradedSemanticModel } from "../canonical";
import { semanticModelToValidatedIntent } from "../adapters";
import { verifySemanticModelWithKnowledge } from "../knowledge";
import { processScientificSemanticHttp } from "../server";
import { acceptedCritic, comparisonCandidate, FakeSemanticProvider, makeSemanticRequest } from "./fixtures";

const build = () => {
  const candidate = comparisonCandidate();
  return canonicalizeSemanticReconstruction({ request: makeSemanticRequest(), candidate, critic: acceptedCritic(candidate), metadata: { provider: "TEST", model: "semantic-test", temperature: 0 }, reconstructionCallId: "pass-1", criticCallId: "pass-2" });
};

describe("SEM-001 mandatory semantic contracts", () => {
  it("SEM-C01 preserves the original request", () => expect(build().originalRequest).toBe("Je veux comparer CT et IRM cardiaque."));
  it("SEM-C02 keeps explicit distinct from inferred", () => expect(new Set(build().elements.map((item) => item.epistemicStatus))).toEqual(expect.objectContaining(new Set(["EXPLICIT_USER_STATED", "INFERRED_HIGH_CONFIDENCE"]))));
  it("SEM-C03 keeps inferred distinct from Knowledge-supported", () => expect(build().elements.find((item) => item.canonicalMeaning === "critère de comparaison")?.knowledgeSupport.status).toBe("NOT_CHECKED"));
  it("SEM-C04 keeps supported distinct from user-confirmed", () => {
    const candidate = comparisonCandidate();
    candidate.elements.find((item) => item.clientElementId === "e-criterion")!.type = "ENDPOINT";
    candidate.knowledgeRequests = [{ elementClientIds: ["e-criterion"], purpose: "check" }];
    const reconstructed = canonicalizeSemanticReconstruction({ request: makeSemanticRequest(), candidate, critic: acceptedCritic(candidate), metadata: { provider: "TEST", model: "test", temperature: 0 }, reconstructionCallId: "p1", criticCallId: "p2" });
    const verified = verifySemanticModelWithKnowledge(reconstructed);
    expect(verified.elements.find((item) => item.canonicalMeaning === "critère de comparaison")?.epistemicStatus).not.toBe("CONFIRMED_BY_USER");
  });
  it("SEM-C05 preserves a detected ellipse", () => { const candidate = comparisonCandidate(); candidate.ellipses = ["objet de mesure omis"]; expect(canonicalizeSemanticReconstruction({ request: makeSemanticRequest(), candidate, critic: acceptedCritic(candidate), metadata: { provider: "TEST", model: "test", temperature: 0 }, reconstructionCallId: "p1", criticCallId: "p2" }).ellipses).toContain("objet de mesure omis"); });
  it("SEM-C06 preserves a missing scientific object", () => expect(build().missingConcepts).toContain("critère de comparaison"));
  it("SEM-C07 preserves comparison", () => expect(build().relations[0].relationType).toBe("COMPARES_WITH"));
  it("SEM-C08 preserves distinct interventions", () => {
    const messages = [{ messageId: "user-1", role: "USER" as const, content: "Comparer stent immédiat et stent différé.", createdAt: "2026-08-11T10:00:00.000Z" }];
    const candidate = comparisonCandidate();
    candidate.semanticInventory = {
      explicitFragments: [
        { inventoryItemId: "i-a", sourceMessageId: "user-1", sourceText: "stent immédiat", normalizedLabel: "stent immédiat", localRole: "intervention arm", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["i-b"] },
        { inventoryItemId: "i-b", sourceMessageId: "user-1", sourceText: "stent différé", normalizedLabel: "stent différé", localRole: "comparator arm", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["i-a"] },
      ],
      explicitRelations: [{ inventoryRelationId: "ir", sourceInventoryItemId: "i-a", targetInventoryItemId: "i-b", sourceMessageId: "user-1", sourceText: "stent immédiat et stent différé", normalizedRelation: "COMPARES_WITH", polarity: "AFFIRMED" }],
    };
    candidate.elements = [
      { clientElementId: "a", type: "INTERVENTION", canonicalMeaning: "stent immédiat", studyRole: "INTERVENTION_ARM", polarity: "AFFIRMED", inventoryItemIds: ["i-a"], sourceMessageId: "user-1", sourceText: "stent immédiat", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
      { clientElementId: "b", type: "INTERVENTION", canonicalMeaning: "stent différé", studyRole: "COMPARATOR_ARM", polarity: "AFFIRMED", inventoryItemIds: ["i-b"], sourceMessageId: "user-1", sourceText: "stent différé", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
    ];
    candidate.relations = [{ clientRelationId: "r", sourceClientElementId: "a", targetClientElementId: "b", relationType: "COMPARES_WITH", polarity: "AFFIRMED", inventoryRelationIds: ["ir"], epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false }];
    const model = canonicalizeSemanticReconstruction({ request: makeSemanticRequest(messages), candidate, critic: acceptedCritic(candidate), metadata: { provider: "TEST", model: "test", temperature: 0 }, reconstructionCallId: "p1", criticCallId: "p2" });
    expect(model.elements.map((item) => item.canonicalMeaning)).toEqual(expect.arrayContaining(["stent immédiat", "stent différé"]));
  });
  it("SEM-C09 does not silently adopt an expected direction", () => { const candidate = comparisonCandidate(); candidate.elements.push({ clientElementId: "direction", type: "EXPECTED_DIRECTION", canonicalMeaning: "réduction attendue", studyRole: "NONE", polarity: "UNCERTAIN", inventoryItemIds: [], sourceMessageId: null, sourceText: null, epistemicStatus: "INFERRED_CANDIDATE", confidence: .7, inferenceReason: "plausible", requiresConfirmation: true, supersedesElementIds: [] }); const model = canonicalizeSemanticReconstruction({ request: makeSemanticRequest(), candidate, critic: acceptedCritic(candidate), metadata: { provider: "TEST", model: "test", temperature: 0 }, reconstructionCallId: "p1", criticCallId: "p2" }); expect(model.elements.find((item) => item.type === "EXPECTED_DIRECTION")?.epistemicStatus).toBe("INFERRED_CANDIDATE"); });
  it("SEM-C10 does not silently adopt an endpoint candidate", () => { const candidate = comparisonCandidate(); candidate.elements.push({ clientElementId: "endpoint", type: "ENDPOINT", canonicalMeaning: "taille lésionnelle", studyRole: "OUTCOME_ROLE", polarity: "UNCERTAIN", inventoryItemIds: [], sourceMessageId: null, sourceText: null, epistemicStatus: "INFERRED_CANDIDATE", confidence: .8, inferenceReason: "candidate", requiresConfirmation: true, supersedesElementIds: [] }); const model = canonicalizeSemanticReconstruction({ request: makeSemanticRequest(), candidate, critic: acceptedCritic(candidate), metadata: { provider: "TEST", model: "test", temperature: 0 }, reconstructionCallId: "p1", criticCallId: "p2" }); expect(model.elements.find((item) => item.type === "ENDPOINT")?.epistemicStatus).not.toBe("CONFIRMED_BY_USER"); });
  it("SEM-C11 preserves a Knowledge gap", () => { const candidate = comparisonCandidate(); candidate.elements.find((item) => item.clientElementId === "e-criterion")!.type = "ENDPOINT"; candidate.knowledgeRequests = [{ elementClientIds: ["e-criterion"], purpose: "check" }]; const verified = verifySemanticModelWithKnowledge(canonicalizeSemanticReconstruction({ request: makeSemanticRequest(), candidate, critic: acceptedCritic(candidate), metadata: { provider: "TEST", model: "test", temperature: 0 }, reconstructionCallId: "p1", criticCallId: "p2" })); expect(verified.elements.find((item) => item.type === "ENDPOINT")?.knowledgeSupport.status).toMatch(/GAP|UNSUPPORTED/); });
  it("SEM-C12 makes acceptance explicit and keeps history", () => { const candidate = build(); const accepted = acceptSemanticModel(candidate); expect(accepted.previousModelId).toBe(candidate.semanticModelId); expect(accepted.history.at(-1)?.modelId).toBe(candidate.semanticModelId); });
  it("SEM-C13 does not collapse a specific object to a generic domain", () => expect(build().elements.map((item) => item.canonicalMeaning)).not.toContain("cardiologie"));
  it("SEM-C14 blocks unresolved modality loss", () => { const candidate = comparisonCandidate(); const critic = acceptedCritic(candidate); critic.verdict = "CLARIFICATION_REQUIRED"; critic.issues = [{ code: "MODALITY_LOSS", severity: "CRITICAL", elementClientIds: ["e-mri"], description: "IRM perdue", recommendedAction: "restore", resolved: false }]; expect(canonicalizeSemanticReconstruction({ request: makeSemanticRequest(), candidate, critic, metadata: { provider: "TEST", model: "test", temperature: 0 }, reconstructionCallId: "p1", criticCallId: "p2" }).status).toBe("CLARIFICATION_REQUIRED"); });
  it("SEM-C15 preserves relationship endpoints", () => { const model = build(); expect(model.relations.every((relation) => model.elements.some((item) => item.semanticElementId === relation.sourceElementId) && model.elements.some((item) => item.semanticElementId === relation.targetElementId))).toBe(true); });
  it("SEM-C16 does not add an unnecessary clarification to a fully specified candidate", () => { const candidate = comparisonCandidate(); candidate.clarificationCandidates = []; candidate.ambiguities = []; candidate.missingConcepts = []; expect(canonicalizeSemanticReconstruction({ request: makeSemanticRequest(), candidate, critic: acceptedCritic(candidate), metadata: { provider: "TEST", model: "test", temperature: 0 }, reconstructionCallId: "p1", criticCallId: "p2" }).clarificationCandidates).toEqual([]); });
  it("SEM-C17 preserves the request on LLM failure", () => expect(createDegradedSemanticModel(makeSemanticRequest()).originalRequest).toBe("Je veux comparer CT et IRM cardiaque."));
  it("SEM-C18 does not own Project truth", () => expect(() => semanticModelToValidatedIntent(build())).toThrow("SEMANTIC_MODEL_NOT_ACCEPTED_FOR_DOWNSTREAM"));
  it("SEM-C19 creates a reconstructible trace", () => expect(build().executionSnapshot).toMatchObject({ reconstructionCallId: "pass-1", criticCallId: "pass-2", schemaVersion: "SEM-001-1.1" }));
  it("SEM-C20 preserves provider abstraction", async () => { const provider = new FakeSemanticProvider(); const response = await processScientificSemanticHttp({ method: "POST", headers: { "content-type": "application/json" }, body: makeSemanticRequest(), ip: "sem-c20" }, { provider }); expect(response.status).toBe(200); expect(provider.calls).toEqual(["RECONSTRUCT", "CRITIC"]); });
});
