import { describe, expect, it } from "vitest";
import { invalidateDownstream, createProtocolDesignerSession } from "@/features/protocol-designer/intake/session";
import { executeScientificThinkingEngine } from "../engine";
import { answerScientificThinkingQuestion, createScientificThinkingSession, reviewScientificHypothesis, selectScientificQuestion } from "../session";
import { makeThinkingInput } from "./fixtures";

describe("ST-001 — cas méthodologiques supplémentaires", () => {
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
    const thinking = selectScientificQuestion(createScientificThinkingSession(makeThinkingInput()), "ST-Q-001", "2026-08-09T11:00:00.000Z");
    const protocol = { ...createProtocolDesignerSession("2026-08-09T10:00:00.000Z"), scientificThinking: thinking };
    const changed = invalidateDownstream(protocol, "Changement majeur confirmé");
    expect(changed.scientificThinking).toBeNull();
    expect(changed.scientificThinkingHistory[0]).toMatchObject({ outputId: thinking.output.outputId, invalidatedReason: "Changement majeur confirmé" });
    expect(changed.scientificThinkingHistory[0].decisionRecordIds).toHaveLength(1);
  });

  it("permet rejet puis réactivation explicite d’une hypothèse", () => {
    let session = createScientificThinkingSession(makeThinkingInput());
    session = reviewScientificHypothesis(session, "ST-H-001", "REJECTED", "2026-08-09T11:01:00.000Z");
    expect(session.output.hypotheses[0].reviewState).toBe("REJECTED");
    session = reviewScientificHypothesis(session, "ST-H-001", "ADOPTED", "2026-08-09T11:02:00.000Z");
    expect(session.output.hypotheses[0].reviewState).toBe("ADOPTED");
    expect(session.decisionHistory.filter((item) => item.targetIds.includes("ST-H-001"))).toHaveLength(2);
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
