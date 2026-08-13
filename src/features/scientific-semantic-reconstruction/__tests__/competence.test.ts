import { describe, expect, it } from "vitest";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { canonicalizeSemanticReconstruction } from "../canonical";
import { evaluateSemanticCase } from "../competence";
import { DEVELOPMENT_CASES, HOLDOUT_CASES, SEMANTIC_COMPETENCE_CASES } from "../competence-fixtures";
import type { SemanticCompetenceCase } from "../competence-fixtures";
import { acceptedCritic, comparisonCandidate, makeSemanticRequest } from "./fixtures";

const evaluatorFixture = (): SemanticCompetenceCase => ({
  caseId: "SEM-EVALUATOR-SYNTHETIC",
  split: "DEVELOPMENT_CASES",
  domain: "synthetic",
  turns: ["Je veux comparer CT et IRM cardiaque."],
  gold: {
    requiredExplicitObjects: [
      { type: "MODALITY", meaning: "CT", aliases: [], critical: true },
      { type: "MODALITY", meaning: "IRM", aliases: [], critical: true },
    ],
    requiredRelations: [{ source: "CT", target: "IRM", relationAliases: ["COMPARES_WITH"], critical: true }],
    acceptableInferences: [],
    forbiddenInferences: [],
    requiredAmbiguities: [],
    optionalClarifications: [],
    forbiddenClarifications: [],
    expectedIntent: "comparer",
    allowedRoutes: ["FORMALIZE_IDEA"],
    criticalSemanticElements: ["CT", "IRM"],
  },
});

const evaluatedModel = (mutate: (candidate: ReturnType<typeof comparisonCandidate>) => void = () => undefined) => {
  const candidate = comparisonCandidate();
  mutate(candidate);
  return canonicalizeSemanticReconstruction({
    request: makeSemanticRequest(),
    candidate,
    critic: acceptedCritic(candidate),
    metadata: { provider: "TEST", model: "test", temperature: null },
    reconstructionCallId: "reconstruction",
    criticCallId: "critic",
  });
};

describe("SEM-001 competence campaign contract", () => {
  it("contains sixty versioned cases with a separate thirty-case holdout", () => {
    expect(DEVELOPMENT_CASES).toHaveLength(30);
    expect(HOLDOUT_CASES).toHaveLength(30);
    expect(SEMANTIC_COMPETENCE_CASES).toHaveLength(60);
    expect(new Set(SEMANTIC_COMPETENCE_CASES.map((item) => item.caseId)).size).toBe(60);
    expect(new Set(SEMANTIC_COMPETENCE_CASES.map((item) => item.turns.join("\n"))).size).toBe(60);
  });

  it("defines the complete gold semantic frame for every case", () => {
    for (const fixture of SEMANTIC_COMPETENCE_CASES) {
      expect(fixture.gold.requiredExplicitObjects.length).toBeGreaterThan(0);
      expect(fixture.gold.expectedIntent).not.toBe("");
      expect(fixture.gold.allowedRoutes.length).toBeGreaterThan(0);
      expect(fixture.gold.criticalSemanticElements.length).toBe(fixture.gold.requiredExplicitObjects.length);
      expect(Array.isArray(fixture.gold.acceptableInferences)).toBe(true);
      expect(Array.isArray(fixture.gold.forbiddenInferences)).toBe(true);
      expect(Array.isArray(fixture.gold.requiredAmbiguities)).toBe(true);
      expect(Array.isArray(fixture.gold.optionalClarifications)).toBe(true);
      expect(Array.isArray(fixture.gold.forbiddenClarifications)).toBe(true);
    }
  });

  it("keeps development and holdout formulations disjoint", () => {
    const development = new Set(DEVELOPMENT_CASES.flatMap((item) => item.turns));
    expect(HOLDOUT_CASES.flatMap((item) => item.turns).every((turn) => !development.has(turn))).toBe(true);
  });

  it("keeps the Holdout corpus and the authorized R5B Gold state frozen", () => {
    expect(logicalDigest(HOLDOUT_CASES.map((item) => ({ caseId: item.caseId, turns: item.turns, split: item.split })))).toBe("ke1-08392b87b2cc140b");
    expect(logicalDigest(HOLDOUT_CASES.map((item) => ({ caseId: item.caseId, gold: item.gold })))).toBe("ke1-9208b3d2f1d0698e");
    expect(logicalDigest(HOLDOUT_CASES)).toBe("ke1-8ad1c8df44cc5323");
  });

  it("uses exact explicit source spans when canonical meaning is translated", () => {
    const model = evaluatedModel((candidate) => {
      candidate.elements.find((item) => item.clientElementId === "e-mri")!.canonicalMeaning = "Magnetic resonance imaging";
    });
    expect(evaluateSemanticCase(evaluatorFixture(), model).explicitObjectRecall).toBe(1);
  });

  it("normalizes descriptive relation morphology without weakening endpoint checks", () => {
    const model = evaluatedModel((candidate) => {
      candidate.relations[0].relationType = "COMPARED_WITH";
    });
    expect(evaluateSemanticCase(evaluatorFixture(), model).explicitRelationRecall).toBe(1);
  });

  it("continues to reject an object assigned to the wrong semantic type", () => {
    const model = evaluatedModel((candidate) => {
      candidate.elements.find((item) => item.clientElementId === "e-mri")!.type = "METHOD";
    });
    expect(evaluateSemanticCase(evaluatorFixture(), model).explicitObjectRecall).toBe(.5);
  });
});
