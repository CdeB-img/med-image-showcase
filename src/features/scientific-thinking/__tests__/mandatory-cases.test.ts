import { describe, expect, it } from "vitest";
import { executeScientificThinkingEngine } from "../engine";
import { makeThinkingInput } from "./fixtures";

describe("ST-001 — huit cas produit obligatoires", () => {
  it("1 clarifie d’abord la finalité d’une idée vague sur la fibrose myocardique sans choisir l’IRM", () => {
    const output = executeScientificThinkingEngine(makeThinkingInput({
      originalExpression: "J’ai une idée sur la fibrose myocardique.", validatedReformulation: "J’ai une idée sur la fibrose myocardique.",
      scientificObjectTerms: ["fibrose myocardique"], phenomena: ["fibrose myocardique"], scientificPurpose: [], context: [], relations: [],
    }));
    expect(output.status).toBe("CLARIFICATION_REQUIRED");
    expect(output.adaptiveQuestions[0]?.questionId).toBe("ST-AQ-FINALITY");
    expect(output.methodPreferences).toHaveLength(0);
    expect(output.questions[0].text).not.toMatch(/IRM|MRI/);
  });

  it("2 sépare intuition, supposition et hypothèse réfutable pour le no-reflow", () => {
    const output = executeScientificThinkingEngine(makeThinkingInput());
    expect(output.semanticElements.map((item) => item.type)).toEqual(expect.arrayContaining(["INTUITION", "ASSUMPTION"]));
    expect(output.assumptions).toHaveLength(1);
    expect(output.hypotheses.map((item) => item.kind)).toEqual(["PRIMARY", "NULL_OR_COMPETING"]);
    expect(output.mechanisms[0].text).toMatch(/reste à documenter/);
  });

  it("3 conserve T1 mapping comme préférence prématurée dans Fabry", () => {
    const output = executeScientificThinkingEngine(makeThinkingInput({
      originalExpression: "Je veux utiliser le T1 mapping pour étudier la maladie de Fabry.", validatedReformulation: "Je veux utiliser le T1 mapping pour étudier la maladie de Fabry.",
      scientificObjectTerms: ["maladie de Fabry", "T1 mapping"], pathologyOrCondition: ["maladie de Fabry"], phenomena: [], methodsMentioned: ["T1 mapping"], scientificPurpose: [], relations: [],
    }));
    expect(output.methodPreferences).toEqual(["T1 mapping"]);
    expect(output.conceptualBiases).toContain("SOLUTION_MÉTHODOLOGIQUE_POTENTIELLEMENT_PRÉMATURÉE");
    expect(output.questions[0].text).toMatch(/indépendamment de la préférence déclarée/);
    expect(output.objectives).toHaveLength(0);
  });

  it("4 sépare la question ECV pronostique de la comparaison MOLLI/SASHA", () => {
    const output = executeScientificThinkingEngine(makeThinkingInput({
      originalExpression: "Est-ce que l’ECV prédit des événements, et faut-il utiliser MOLLI ou SASHA ?", validatedReformulation: "Est-ce que l’ECV prédit des événements, et faut-il utiliser MOLLI ou SASHA ?",
      scientificObjectTerms: ["ECV", "événements"], phenomena: ["ECV"], outcomes: ["événements"], methodsMentioned: ["MOLLI", "SASHA"], scientificPurpose: ["prédire des événements"], relations: ["relation pronostique"],
    }));
    expect(output.questions).toHaveLength(2);
    expect(output.questions[0]).toMatchObject({ kind: "PRIMARY" });
    expect(output.questions[0].text).not.toMatch(/MOLLI|SASHA/);
    expect(output.questions[1]).toMatchObject({ kind: "METHODOLOGICAL_BRANCH" });
    expect(output.operations.find((item) => item.operation === "SPLIT_QUESTION")?.status).toBe("EXECUTED");
  });

  it("5 conserve une bonne question Fabry/ECV sans questions inutiles", () => {
    const question = "Chez les patients atteints de maladie de Fabry, la progression de l’ECV est-elle associée aux événements au cours du suivi ?";
    const output = executeScientificThinkingEngine(makeThinkingInput({
      originalExpression: question, validatedReformulation: question, scientificObjectTerms: ["ECV", "maladie de Fabry"],
      population: ["patients atteints de maladie de Fabry"], pathologyOrCondition: ["maladie de Fabry"], phenomena: ["ECV"], outcomes: ["événements"], scientificPurpose: ["étudier la progression"], relations: ["association", "relation temporelle"],
    }));
    expect(output.questions[0].text).toBe(question);
    expect(output.questions[0].testability).toBe("TESTABLE_CANDIDATE");
    expect(output.adaptiveQuestions).toHaveLength(0);
    expect(output.objectives[0].level).toBe("PRIMARY");
  });

  it("6 refuse une finalité non falsifiable tout en proposant une reprise", () => {
    const output = executeScientificThinkingEngine(makeThinkingInput({
      originalExpression: "Je veux regarder des choses intéressantes en IRM.", validatedReformulation: "Je veux regarder des choses intéressantes en IRM.", scientificObjectTerms: ["IRM"], phenomena: [], methodsMentioned: ["IRM"], scientificPurpose: [], relations: [],
    }));
    expect(output.refusal?.code).toBe("NON_TESTABLE");
    expect(output.questions[0].testability).toBe("NON_TESTABLE");
    expect(output.hypotheses).toHaveLength(0);
    expect(output.operations.find((item) => item.operation === "REJECT_NON_TESTABLE_HYPOTHESIS")?.status).toBe("EXECUTED");
  });

  it("7 arrête localement une situation patient", () => {
    const output = executeScientificThinkingEngine(makeThinkingInput({
      originalExpression: "J’ai un T2 élevé sur mon IRM, que signifie ce résultat ?", validatedReformulation: "J’ai un T2 élevé sur mon IRM, que signifie ce résultat ?", safetyFlags: ["PATIENT_LEVEL_CONTEXT_REQUIRES_GENERAL_REFORMULATION"],
    }));
    expect(output.status).toBe("REFUSED");
    expect(output.refusal?.code).toBe("PATIENT_LEVEL");
    expect(output.questions).toHaveLength(0);
  });

  it("8 garde visible un candidat scientifiquement structurable sans connaissance suffisante", () => {
    const output = executeScientificThinkingEngine(makeThinkingInput({
      originalExpression: "La mesure zéphyrienne est-elle associée à la fibrose myocardique chez des adultes ?", validatedReformulation: "La mesure zéphyrienne est-elle associée à la fibrose myocardique chez des adultes ?",
      scientificObjectTerms: ["mesure zéphyrienne", "fibrose myocardique"], phenomena: ["mesure zéphyrienne", "fibrose myocardique"], population: ["adultes"], scientificPurpose: ["examiner une association"],
      knowledge: {
        ownerResultRef: "knowledge-result:no-match@1", resultId: "knowledge-result:no-match", resultRevision: 1, resultDigest: "digest",
        coverageStatus: "NO_MATCH", support: "UNSUPPORTED", sourceIds: [], assertionRefs: [], documentaryStatementRefs: [], evidenceRefs: [], applicability: [],
        contradictionRefs: [], contradictions: [], gapRefs: ["knowledge-gap:no-match"], gapCodes: ["NO_ASSERTION_MATCH"], unresolvedConcepts: ["mesure zéphyrienne"], limitations: [],
      },
    }));
    expect(output.questions[0]).toMatchObject({ support: "UNSUPPORTED", testability: "TESTABLE_CANDIDATE" });
    expect(output.knowledgeRequest).toMatchObject({ status: "REQUIRED" });
    expect(output.graph.nodes.some((item) => item.type === "KNOWLEDGE_GAP")).toBe(true);
  });
});
