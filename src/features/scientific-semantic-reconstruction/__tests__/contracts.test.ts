import { describe, expect, it } from "vitest";
import { acceptSemanticModel, canonicalizeSemanticReconstruction, createDegradedSemanticModel } from "../canonical";
import { semanticModelToScientificSessionContext, semanticModelToValidatedIntent } from "../adapters";
import { verifySemanticModelWithKnowledge } from "../knowledge";
import { acceptedCritic, comparisonCandidate, makeSemanticRequest } from "./fixtures";

describe("SEM-001 canonical contracts", () => {
  it("preserves original request, explicit objects, relation and inferred separation", () => {
    const request = makeSemanticRequest();
    const candidate = comparisonCandidate();
    const model = canonicalizeSemanticReconstruction({ request, candidate, critic: acceptedCritic(candidate), metadata: { provider: "TEST", model: "test", temperature: 0 }, reconstructionCallId: "pass-1", criticCallId: "pass-2", now: "2026-08-11T10:01:00.000Z" });
    expect(model.originalRequest).toBe(request.messages[0].content);
    expect(model.elements.find((item) => item.canonicalMeaning === "CT")?.epistemicStatus).toBe("EXPLICIT_USER_STATED");
    expect(model.elements.find((item) => item.canonicalMeaning === "critère de comparaison")?.epistemicStatus).toBe("INFERRED_HIGH_CONFIDENCE");
    expect(model.relations).toHaveLength(1);
    expect(model.relations[0].relationType).toBe("COMPARES_WITH");
    expect(model.executionSnapshot?.rawReconstruction).toEqual(candidate);
    expect(model.executionSnapshot?.rawCritic.criticId).toBe("critic-1");
  });

  it("never turns confidence into user confirmation", () => {
    const candidate = comparisonCandidate();
    candidate.elements.find((item) => item.clientElementId === "e-criterion")!.confidence = 1;
    const model = canonicalizeSemanticReconstruction({ request: makeSemanticRequest(), candidate, critic: acceptedCritic(candidate), metadata: { provider: "TEST", model: "test", temperature: 0 }, reconstructionCallId: "p1", criticCallId: "p2" });
    expect(model.elements.find((item) => item.canonicalMeaning === "critère de comparaison")?.epistemicStatus).toBe("INFERRED_HIGH_CONFIDENCE");
  });

  it("rejects ungrounded explicit elements", () => {
    const candidate = comparisonCandidate();
    candidate.elements.find((item) => item.clientElementId === "e-ct")!.sourceText = "scanner";
    expect(() => canonicalizeSemanticReconstruction({ request: makeSemanticRequest(), candidate, critic: acceptedCritic(candidate), metadata: { provider: "TEST", model: "test", temperature: 0 }, reconstructionCallId: "p1", criticCallId: "p2" })).toThrow("EXPLICIT_SOURCE_NOT_CONTIGUOUS");
  });

  it("requires clarification when the critic leaves a critical loss unresolved", () => {
    const candidate = comparisonCandidate();
    const critic = acceptedCritic(candidate);
    critic.verdict = "CLARIFICATION_REQUIRED";
    critic.issues = [{ code: "MODALITY_LOSS", severity: "CRITICAL", elementClientIds: ["e-mri"], description: "IRM lost", recommendedAction: "clarify", resolved: false }];
    const model = canonicalizeSemanticReconstruction({ request: makeSemanticRequest(), candidate, critic, metadata: { provider: "TEST", model: "test", temperature: 0 }, reconstructionCallId: "p1", criticCallId: "p2" });
    expect(model.status).toBe("CLARIFICATION_REQUIRED");
    expect(acceptSemanticModel(model).status).toBe("CLARIFICATION_REQUIRED");
  });

  it("accepts an interpretation without promoting unsupported candidates", () => {
    const candidate = comparisonCandidate();
    candidate.elements.find((item) => item.clientElementId === "e-criterion")!.type = "ENDPOINT";
    candidate.knowledgeRequests = [{ elementClientIds: ["e-criterion"], purpose: "Vérifier si ce critère est défendable." }];
    const reconstructed = canonicalizeSemanticReconstruction({ request: makeSemanticRequest(), candidate, critic: acceptedCritic(candidate), metadata: { provider: "TEST", model: "test", temperature: 0 }, reconstructionCallId: "p1", criticCallId: "p2" });
    const verified = verifySemanticModelWithKnowledge(reconstructed);
    const accepted = acceptSemanticModel(verified, "2026-08-11T10:02:00.000Z");
    expect(accepted.status).toBe("ACCEPTED");
    expect(accepted.elements.find((item) => item.canonicalMeaning === "critère de comparaison")?.epistemicStatus).toBe("UNSUPPORTED_CANDIDATE");
    expect(accepted.acceptanceRecord?.retainedCandidateIds).toHaveLength(1);
  });

  it("adapts only an accepted snapshot to downstream intake and preserves the snapshot reference", () => {
    const candidate = comparisonCandidate();
    const reconstructed = canonicalizeSemanticReconstruction({ request: makeSemanticRequest(), candidate, critic: acceptedCritic(candidate), metadata: { provider: "TEST", model: "test", temperature: 0 }, reconstructionCallId: "p1", criticCallId: "p2" });
    expect(() => semanticModelToValidatedIntent(reconstructed)).toThrow("SEMANTIC_MODEL_NOT_ACCEPTED_FOR_DOWNSTREAM");
    const accepted = acceptSemanticModel(reconstructed);
    const intent = semanticModelToValidatedIntent(accepted);
    const context = semanticModelToScientificSessionContext(accepted);
    expect(intent.semanticSnapshot?.semanticModelDigest).toBe(accepted.digest);
    expect(intent.interpretation.availableEquipment.value).toEqual(expect.arrayContaining(["CT", "IRM"]));
    expect(context.detectedRelationships[0]).toContain("COMPARES_WITH");
  });

  it("degraded mode keeps text without pretending rich understanding", () => {
    const degraded = createDegradedSemanticModel(makeSemanticRequest());
    expect(degraded.status).toBe("SEMANTIC_RECONSTRUCTION_DEGRADED");
    expect(degraded.originalRequest).toBe("Je veux comparer CT et IRM cardiaque.");
    expect(degraded.elements).toHaveLength(0);
    expect(degraded.routeProposal.route).toBe("REVIEW_REROUTE");
  });
});
