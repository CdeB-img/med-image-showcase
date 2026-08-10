import { describe, expect, it } from "vitest";
import { buildValidatedIntent, createProtocolDesignerSession, invalidateDownstream } from "@/features/protocol-designer/intake/session";
import { createEmptyInterpretation } from "@/features/protocol-designer/intake/schema";
import { INTERPRETED_FIELD_KEYS, type HumanFieldReview, type InterpretedFieldKey } from "@/features/protocol-designer/intake/types";
import { executeScientificThinkingEngine } from "../engine";
import { buildScientificThinkingInput } from "../input";
import { answerScientificThinkingQuestion, createScientificThinkingSession, reviewScientificHypothesis, selectScientificQuestion } from "../session";
import { makeThinkingInput } from "./fixtures";

describe("ST-001 — cas méthodologiques supplémentaires", () => {
  it("préserve CT et IRM comme méthodes explicites sans inventer une association cardiologie-imagerie", () => {
    const input = makeThinkingInput({
      originalExpression: "Je cherche à comprendre comment comparer CT et IRM cardiaque.",
      validatedReformulation: "Je cherche à comprendre comment comparer CT et IRM cardiaque.",
      scientificObjectTerms: ["cardiologie", "imagerie médicale"],
      resolvedConcepts: [], relations: ["comparaison méthodologique"], population: [], pathologyOrCondition: [], phenomena: [], outcomes: [],
      methodsMentioned: ["CT", "IRM"], scientificPurpose: ["comparer des modalités"], context: ["cardiologie"],
      knowledge: { ...makeThinkingInput().knowledge, unresolvedConcepts: ["cardiologie", "imagerie médicale"] },
    });
    const output = executeScientificThinkingEngine(input);

    expect(output.methodPreferences).toEqual(["CT", "IRM"]);
    expect(output.status).toBe("CLARIFICATION_REQUIRED");
    expect(output.questions).toHaveLength(1);
    expect(output.questions[0]).toMatchObject({ kind: "PRIMARY", testability: "NEEDS_CLARIFICATION", scope: "TOO_NARROW" });
    expect(output.questions[0].text).toMatch(/comparer entre CT et IRM/);
    expect(output.questions[0].text).not.toMatch(/association entre cardiologie et imagerie médicale/i);
    expect(output.adaptiveQuestions.map((item) => item.questionId)).toEqual(["ST-AQ-COMPARISON-TARGET", "ST-AQ-COMPARISON-CRITERION"]);
    expect(output.hypotheses).toHaveLength(0);
    expect(output.objectives).toHaveLength(0);
    expect(output.mechanisms).toHaveLength(0);
    expect(output.assumptions).toHaveLength(1);
    expect(output.assumptions[0].text).toMatch(/CT et IRM/);
    expect(output.handoff.status).toBe("NOT_READY");
  });

  it("détecte CT avec des frontières lexicales et ne le perd pas avant le moteur", () => {
    const question = "Je cherche à comprendre comment comparer CT et IRM cardiaque.";
    const interpretation = createEmptyInterpretation({ question, language: "fr", schemaVersion: "1.0" });
    interpretation.reformulatedQuestion = question;
    const reviewedAt = "2026-08-10T12:00:00.000Z";
    const reviews = Object.fromEntries(INTERPRETED_FIELD_KEYS.map((key) => [key, { state: "UNKNOWN", reviewedAt }])) as Partial<Record<InterpretedFieldKey, HumanFieldReview>>;
    const intent = buildValidatedIntent(interpretation, reviews, question, reviewedAt);
    const input = buildScientificThinkingInput(intent, ["cardiologie", "imagerie médicale"], ["comparaison méthodologique"], null);

    expect(input.methodsMentioned).toEqual(["CT", "IRM"]);
  });

  it("ne rend la comparaison CT/IRM testable qu’après explicitation de l’objet et du critère", () => {
    let session = createScientificThinkingSession(makeThinkingInput({
      originalExpression: "Je cherche à comprendre comment comparer CT et IRM cardiaque.",
      validatedReformulation: "Je cherche à comprendre comment comparer CT et IRM cardiaque.",
      scientificObjectTerms: ["cardiologie", "imagerie médicale"], relations: ["comparaison méthodologique"],
      population: [], pathologyOrCondition: [], phenomena: [], outcomes: [], methodsMentioned: ["CT", "IRM"],
      scientificPurpose: ["comparer des modalités"], context: ["cardiologie"],
    }));
    session = answerScientificThinkingQuestion(session, "ST-AQ-COMPARISON-TARGET", "la quantification de la fibrose myocardique");
    expect(session.output.questions[0].testability).toBe("NEEDS_CLARIFICATION");
    session = answerScientificThinkingQuestion(session, "ST-AQ-COMPARISON-CRITERION", "l’accord entre les mesures");

    expect(session.output.questions[0].testability).toBe("TESTABLE_CANDIDATE");
    expect(session.output.questions[0].text).toMatch(/fibrose myocardique/);
    expect(session.output.questions[0].text).toMatch(/accord entre les mesures/);
    expect(session.output.adaptiveQuestions).toHaveLength(0);
    expect(session.output.hypotheses).toHaveLength(2);
    expect(session.output.mechanisms).toHaveLength(0);
    expect(session.output.reasoningIssues).not.toContain("HYPOTHESIS_WITHOUT_MECHANISM");
  });

  it("détecte une question trop large et garde la réduction de portée disponible", () => {
    const output = executeScientificThinkingEngine(makeThinkingInput({ originalExpression: "Je veux étudier toute l’imagerie médicale de façon générale.", validatedReformulation: "Je veux étudier toute l’imagerie médicale de façon générale.", scientificObjectTerms: ["imagerie médicale"], phenomena: [], scientificPurpose: [], relations: [] }));
    expect(output.reasoningIssues).toContain("QUESTION_SCOPE_TOO_BROAD");
    expect(output.operations.find((item) => item.operation === "REDUCE_SCOPE")?.status).toBe("AVAILABLE");
  });

  it("détecte une question trop étroite dominée par une solution", () => {
    const output = executeScientificThinkingEngine(makeThinkingInput({ originalExpression: "Je veux utiliser MOLLI dans Fabry.", validatedReformulation: "Je veux utiliser MOLLI dans Fabry.", scientificObjectTerms: ["Fabry", "MOLLI"], pathologyOrCondition: ["Fabry"], methodsMentioned: ["MOLLI"], scientificPurpose: [], relations: [] }));
    expect(output.questions[0].scope).toBe("TOO_NARROW");
    expect(output.reasoningIssues).toContain("QUESTION_SCOPE_TOO_NARROW");
    expect(output.operations.find((item) => item.operation === "EXPAND_SCOPE")?.status).toBe("AVAILABLE");
  });

  it("ne crée jamais un objectif sans question ni hypothèse", () => {
    const output = executeScientificThinkingEngine(makeThinkingInput({ originalExpression: "Je voudrais étudier la fibrose myocardique.", validatedReformulation: "Je voudrais étudier la fibrose myocardique.", scientificObjectTerms: ["fibrose myocardique"], phenomena: ["fibrose myocardique"], scientificPurpose: [], relations: [] }));
    expect(output.objectives).toHaveLength(0);
    expect(output.hypotheses).toHaveLength(0);
  });

  it("signale une hypothèse sans mécanisme après une clarification purement déclarative", () => {
    let session = createScientificThinkingSession(makeThinkingInput({ originalExpression: "Je voudrais étudier la fibrose myocardique.", validatedReformulation: "Je voudrais étudier la fibrose myocardique.", scientificObjectTerms: ["fibrose myocardique"], phenomena: ["fibrose myocardique"], scientificPurpose: [], relations: [] }));
    session = answerScientificThinkingQuestion(session, "ST-AQ-FINALITY", "quantify");
    session = answerScientificThinkingQuestion(session, "ST-AQ-RELATION", "association avec la progression");
    expect(session.output.hypotheses.length).toBeGreaterThan(1);
    expect(session.output.mechanisms).toHaveLength(0);
    expect(session.output.reasoningIssues).toContain("HYPOTHESIS_WITHOUT_MECHANISM");
  });

  it("préserve des hypothèses concurrentes", () => {
    const output = executeScientificThinkingEngine(makeThinkingInput());
    expect(output.hypotheses.map((item) => item.kind)).toEqual(["PRIMARY", "NULL_OR_COMPETING"]);
    expect(output.graph.edges.some((item) => item.relation === "ALTERNATIVE_TO")).toBe(true);
  });

  it("rend une contradiction utilisateur/Knowledge visible et bloque le handoff", () => {
    const output = executeScientificThinkingEngine(makeThinkingInput({ contradictions: ["La temporalité déclarée contredit le périmètre de connaissance applicable."], knowledge: { ...makeThinkingInput().knowledge, support: "CONFLICTING", coverageStatus: "CONFLICTING" } }));
    expect(output.contradictions).toHaveLength(1);
    expect(output.handoff.blockedBy.some((item) => item.startsWith("UNRESOLVED_CONTRADICTION"))).toBe(true);
  });

  it("archive la projection et ses décisions lors d’une invalidation majeure", () => {
    const thinking = selectScientificQuestion(createScientificThinkingSession(makeThinkingInput()), "ST-Q-001", "Responsable scientifique", "mandate:st-test", "2026-08-09T11:00:00.000Z");
    const protocol = { ...createProtocolDesignerSession("2026-08-09T10:00:00.000Z"), scientificThinking: thinking };
    const changed = invalidateDownstream(protocol, "Changement majeur confirmé");
    expect(changed.scientificThinking).toBeNull();
    expect(changed.scientificThinkingHistory[0]).toMatchObject({ outputId: thinking.output.outputId, invalidatedReason: "Changement majeur confirmé" });
    expect(changed.scientificThinkingHistory[0].decisionRecordIds.length).toBeGreaterThanOrEqual(1);
  });

  it("permet rejet puis réactivation explicite d’une hypothèse", () => {
    let session = createScientificThinkingSession(makeThinkingInput());
    session = reviewScientificHypothesis(session, "ST-H-001", "REJECTED", "Responsable scientifique", "mandate:st-test", "2026-08-09T11:01:00.000Z");
    expect(session.output.hypotheses[0].reviewState).toBe("REJECTED");
    session = reviewScientificHypothesis(session, "ST-H-001", "ADOPTED", "Responsable scientifique", "mandate:st-test", "2026-08-09T11:02:00.000Z");
    expect(session.output.hypotheses[0].reviewState).toBe("ADOPTED");
    expect(session.decisionHistory.filter((item) => item.targets.includes("ST-H-001"))).toHaveLength(2);
    expect(session.decisionHistory.filter((item) => item.targets.includes("ST-H-001")).at(-1)).toMatchObject({ status: "ADOPTED", version: 2 });
  });

  it("ne change pas le raisonnement structuré quand seul le niveau utilisateur change", () => {
    const novice = executeScientificThinkingEngine(makeThinkingInput({ scientificIntent: { intentRef: "intent:test", userExpertise: "NON_SPECIALIST", sourceJourney: "FORMALIZE_IDEA" } }));
    const expert = executeScientificThinkingEngine(makeThinkingInput({ scientificIntent: { intentRef: "intent:test", userExpertise: "EXPERT", sourceJourney: "FORMALIZE_IDEA" } }));
    expect(novice.questions).toEqual(expert.questions);
    expect(novice.hypotheses).toEqual(expert.hypotheses);
  });

  it("accepte le contrat anglais tout en conservant le texte source", () => {
    const source = "Is no-reflow after stenting associated with microvascular injury?";
    const output = executeScientificThinkingEngine(makeThinkingInput({ language: "en", originalExpression: source, validatedReformulation: source }));
    expect(output.originalIdea).toBe(source);
    expect(output.provenance.llmContributionStatus).toBe("UPSTREAM_LANGUAGE_INTERPRETATION_CANDIDATE_ONLY");
  });
});
