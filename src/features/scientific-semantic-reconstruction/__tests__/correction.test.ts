import { describe, expect, it } from "vitest";
import { canonicalizeSemanticReconstruction } from "../canonical";
import { acceptedCritic, comparisonCandidate, makeSemanticRequest } from "./fixtures";

describe("SEM-001 multi-turn correction", () => {
  it("rejects the superseded candidate and carries unrelated context forward", () => {
    const firstCandidate = comparisonCandidate();
    firstCandidate.elements.push({ clientElementId: "e-infarct", type: "ENDPOINT", canonicalMeaning: "taille d'infarctus", studyRole: "OUTCOME_ROLE", polarity: "UNCERTAIN", inventoryItemIds: [], sourceMessageId: null, sourceText: null, epistemicStatus: "INFERRED_CANDIDATE", confidence: .7, inferenceReason: "Endpoint plausible", requiresConfirmation: true, supersedesElementIds: [] });
    const first = canonicalizeSemanticReconstruction({ request: makeSemanticRequest(), candidate: firstCandidate, critic: acceptedCritic(firstCandidate), metadata: { provider: "TEST", model: "test", temperature: 0 }, reconstructionCallId: "p1-a", criticCallId: "p2-a" });
    const infarctId = first.elements.find((item) => item.canonicalMeaning === "taille d'infarctus")!.semanticElementId;
    const secondMessages = [...makeSemanticRequest().messages, { messageId: "user-2", role: "USER" as const, content: "Non, c'est la MVO qui m'intéresse principalement.", createdAt: "2026-08-11T10:03:00.000Z" }];
    const secondCandidate = comparisonCandidate();
    secondCandidate.semanticInventory.explicitFragments.push({ inventoryItemId: "i-mvo", sourceMessageId: "user-2", sourceText: "MVO", normalizedLabel: "MVO", localRole: "replacement endpoint", polarity: "AFFIRMED", modifiers: ["principalement"], linkedInventoryItemIds: [] });
    secondCandidate.elements.push({ clientElementId: "e-mvo", type: "ENDPOINT", canonicalMeaning: "MVO", studyRole: "OUTCOME_ROLE", polarity: "AFFIRMED", inventoryItemIds: ["i-mvo"], sourceMessageId: "user-2", sourceText: "MVO", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [infarctId] });
    const request = makeSemanticRequest(secondMessages, first);
    const second = canonicalizeSemanticReconstruction({ request, candidate: secondCandidate, critic: acceptedCritic(secondCandidate), metadata: { provider: "TEST", model: "test", temperature: 0 }, reconstructionCallId: "p1-b", criticCallId: "p2-b" });
    expect(second.elements.find((item) => item.canonicalMeaning === "taille d'infarctus")?.epistemicStatus).toBe("REJECTED_BY_USER");
    expect(second.elements.find((item) => item.canonicalMeaning === "MVO")?.epistemicStatus).toBe("EXPLICIT_USER_STATED");
    expect(second.elements.find((item) => item.canonicalMeaning === "IRM")).toBeDefined();
    expect(second.history.at(-1)?.modelId).toBe(first.semanticModelId);
  });
});
