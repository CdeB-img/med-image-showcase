import { describe, expect, it } from "vitest";
import { executeScientificThinkingEngine } from "../engine";
import {
  answerScientificThinkingQuestion,
  authorizeResearchDesignHandoff,
  createScientificThinkingSession,
  reviewScientificHypothesis,
  reviewScientificObjective,
  selectScientificQuestion,
} from "../session";
import { makeThinkingInput } from "./fixtures";

describe("ST-001 — questions adaptatives, décisions humaines et handoff", () => {
  it("accepte réponses suggérées, texte libre et je ne sais pas sans masquer l’inconnue", () => {
    const input = makeThinkingInput({ originalExpression: "J’ai une idée sur la fibrose myocardique.", validatedReformulation: "J’ai une idée sur la fibrose myocardique.", scientificObjectTerms: ["fibrose myocardique"], phenomena: ["fibrose myocardique"], scientificPurpose: [], relations: [] });
    let session = createScientificThinkingSession(input);
    session = answerScientificThinkingQuestion(session, "ST-AQ-FINALITY", "quantify");
    session = answerScientificThinkingQuestion(session, "ST-AQ-RELATION", "unknown");
    expect(session.answers).toMatchObject({ "ST-AQ-FINALITY": "quantify", "ST-AQ-RELATION": "unknown" });
    expect(session.output.unknowns.some((item) => item.startsWith("Réponse explicitement inconnue"))).toBe(true);
    session = answerScientificThinkingQuestion(session, "ST-AQ-RELATION", "association avec la progression");
    expect(session.output.questions[0].testability).toBe("TESTABLE_CANDIDATE");
  });

  it("interdit le handoff avant les confirmations puis l’autorise explicitement", () => {
    let session = createScientificThinkingSession(makeThinkingInput());
    expect(session.output.handoff.status).toBe("NOT_READY");
    session = selectScientificQuestion(session, "ST-Q-001", "Responsable scientifique", "mandate:st-test", "2026-08-09T10:00:00.000Z");
    session = reviewScientificHypothesis(session, "ST-H-001", "ADOPTED", "Responsable scientifique", "mandate:st-test", "2026-08-09T10:01:00.000Z");
    session = reviewScientificHypothesis(session, "ST-H-002", "REJECTED", "Responsable scientifique", "mandate:st-test", "2026-08-09T10:02:00.000Z");
    session = reviewScientificObjective(session, "ST-O-001", "ADOPTED", "Responsable scientifique", "mandate:st-test", "2026-08-09T10:03:00.000Z");
    expect(session.output.handoff.status).toBe("READY_FOR_HUMAN_AUTHORIZATION");
    session = authorizeResearchDesignHandoff(session, "Responsable scientifique", "mandate:st-test", "2026-08-09T10:04:00.000Z");
    expect(session.output.handoff).toMatchObject({ status: "AUTHORIZED", questionId: "ST-Q-001", boundary: "NO_PROTOCOL_NO_METHOD_SELECTION_NO_STATISTICAL_PLAN" });
    expect(session.decisionHistory.map((item) => item.gateId)).toEqual(expect.arrayContaining(["ST-G-QUESTION_CONFIRMATION", "ST-G-HYPOTHESIS_ADOPTION", "ST-G-OBJECTIVE_HIERARCHY", "ST-G-DESIGN_TRANSITION"]));
  });

  it("ne prépare jamais un handoff à partir d’une hypothèse non testable", () => {
    const output = executeScientificThinkingEngine(makeThinkingInput({ originalExpression: "Je veux regarder des choses intéressantes en IRM.", validatedReformulation: "Je veux regarder des choses intéressantes en IRM.", scientificObjectTerms: ["IRM"], methodsMentioned: ["IRM"], scientificPurpose: [], relations: [] }));
    expect(output.handoff.status).toBe("NOT_READY");
    expect(output.handoff.blockedBy).toContain("REFUSAL:NON_TESTABLE");
  });
});
