import { describe, expect, it } from "vitest";
import { ADAPTIVE_QUESTION_REGISTRY } from "../intake/questions";
import { canGenerateFinalReport, generateContextualReport, REPORT_SECTION_TITLES, reportToMarkdown } from "../intake/report";
import { createEmptyInterpretation } from "../intake/schema";
import { buildValidatedIntent, createProtocolDesignerSession, invalidateDownstream } from "../intake/session";
import type { ProtocolDesignerSession } from "../intake/types";

const ORIGINAL = "Je veux comparer la perfusion cérébrale en IRM 1,5 T dans plusieurs centres.";
const sessionFactory = (final = true): ProtocolDesignerSession => {
  const interpretation = createEmptyInterpretation({ question: ORIGINAL, language: "fr", schemaVersion: "1.0" });
  interpretation.reformulatedQuestion = "Comparer des méthodes de mesure de la perfusion cérébrale dans un contexte multicentrique en IRM 1,5 T.";
  interpretation.scientificDomain = { value: ["Neuro-imagerie"], origin: "TENTATIVE_INTERPRETATION", confidence: "MEDIUM", sourceText: "perfusion cérébrale", userValidated: false };
  interpretation.phenomenaOfInterest = { value: ["Perfusion cérébrale"], origin: "EXPLICIT_USER_STATEMENT", confidence: "HIGH", sourceText: "perfusion cérébrale", userValidated: false };
  interpretation.availableEquipment = { value: ["IRM 1,5 T"], origin: "EXPLICIT_USER_STATEMENT", confidence: "HIGH", sourceText: "IRM 1,5 T", userValidated: false };
  interpretation.centers = { value: ["Plusieurs centres"], origin: "NORMALIZED_FROM_USER_TERM", confidence: "HIGH", sourceText: "plusieurs centres", userValidated: false };
  interpretation.missingInformation = ["Population à préciser"];
  const reviews = {
    scientificDomain: { state: "CORRECTED" as const, correctedValue: ["Neuro-perfusion"], reviewedAt: "2026-08-03T10:00:00Z" },
    phenomenaOfInterest: { state: "CONFIRMED" as const, reviewedAt: "2026-08-03T10:00:00Z" },
    availableEquipment: { state: "CONFIRMED" as const, reviewedAt: "2026-08-03T10:00:00Z" },
    centers: { state: "CONFIRMED" as const, reviewedAt: "2026-08-03T10:00:00Z" },
  };
  const intent = buildValidatedIntent(interpretation, reviews, interpretation.reformulatedQuestion, "2026-08-03T10:00:00Z");
  return {
    ...createProtocolDesignerSession("2026-08-03T09:00:00Z"), sessionId: "session-report-test", originalQuestion: ORIGINAL,
    validatedIntent: intent, scenarioMatches: [{ scenarioId: "neuro", status: "MATCH_CONFIRMED", score: 3, confidence: "HIGH", reasons: ["perfusion"], matchedTerms: ["perfusion"], uncoveredElements: [] }],
    confirmedScenarioId: "neuro", adaptiveAnswers: [{ questionId: "Q-PURPOSE", answer: "compare", label: "Comparer", consequence: "La comparabilité sera explicitée.", answeredAt: "2026-08-03T10:05:00Z", status: "ANSWERED" }],
    decision: final ? { outcome: "CONFIRM_ORIENTATION", author: "Responsable scientifique", justification: "Orientation cohérente avec la question validée.", reservations: "Revue experte requise.", decidedAt: "2026-08-03T10:10:00Z" } : null,
    reportStatus: final ? "FINAL" : "PROVISIONAL",
  };
};
const makeReport = (final = true) => generateContextualReport(sessionFactory(final), ADAPTIVE_QUESTION_REGISTRY, final ? "FINAL" : "PROVISIONAL", "2026-08-03T11:00:00Z");
const content = (number: number, final = true) => makeReport(final).sections[number - 1].content.join(" ");

describe("P-WEB-04R — contextual report contracts", () => {
  it("01 preserves the original question", () => expect(content(2)).toBe(ORIGINAL));
  it("02 preserves the human-validated reformulation", () => expect(content(3)).toContain("Comparer des méthodes"));
  it("03 contains the specific context", () => expect(content(11)).toContain("Plusieurs centres"));
  it("04 contains equipment constraints", () => expect(content(12)).toContain("IRM 1,5 T"));
  it("05 records adaptive questions", () => expect(content(19)).toContain("objectif scientifique"));
  it("06 records answer consequences", () => expect(content(22)).toContain("comparabilité"));
  it("07 records the correct primary scenario", () => expect(content(23)).toContain("RB-005"));
  it("08 supports secondary scenarios", () => { const session = sessionFactory(); session.secondaryScenarioIds = ["spectral"]; expect(generateContextualReport(session, ADAPTIVE_QUESTION_REGISTRY, "FINAL").sections[23].content.join(" ")).toContain("spectrale"); });
  it("09 contains no data from another scenario by default", () => expect(JSON.stringify(makeReport())).not.toContain("RB-004"));
  it("10 records the human decision", () => expect(content(31)).toContain("Responsable scientifique"));
  it("11 distinguishes the provisional report", () => expect(makeReport(false).title).toBe("RAPPORT_PROVISOIRE — RAISONNEMENT INCOMPLET"));
  it("12 distinguishes the final report", () => expect(makeReport().status).toBe("FINAL"));
  it("13 keeps missing information visible", () => expect(content(36)).toContain("Population à préciser"));
  it("14 keeps contradictions visible", () => { const session = sessionFactory(false); session.validatedIntent!.interpretation.contradictions = ["Contradiction active"]; expect(generateContextualReport(session, ADAPTIVE_QUESTION_REGISTRY, "PROVISIONAL").sections[17].content).toContain("Contradiction active"); });
  it("15 explains why protocol generation is unavailable", () => expect(content(41)).toContain("NOT_YET_GENERATABLE_FROM_CURRENT_EXECUTABLE_KNOWLEDGE"));
  it("16 leaves funding as a partial structure", () => expect(makeReport().deliverables[2].status).toBe("STRUCTURE_ONLY"));
  it("17 leaves publication as a partial structure", () => expect(makeReport().deliverables[3].status).toBe("STRUCTURE_ONLY"));
  it("18 uses the correct local source", () => expect(content(38)).toContain("RB-005 v1.0"));
  it("19 uses the correct program version", () => expect(content(38)).toContain("NXP-000003 v1.1"));
  it("20 never elevates Gemini as a scientific source", () => expect(content(38)).not.toContain("Gemini"));
  it("21 provides a linear printable Markdown form", () => expect(reportToMarkdown(makeReport())).toContain("## 42. Historique synthétique de la session"));
  it("22 preserves all 42 sections for PDF printing", () => expect(REPORT_SECTION_TITLES).toHaveLength(42));
  it("27 supports a restored session identifier", () => expect(content(1)).toContain("session-report-test"));
  it("28 drops a stale report after upstream invalidation", () => expect(invalidateDownstream(sessionFactory(), "upstream").reportStatus).toBe("NONE"));
  it("29 invents no acquisition sequence", () => expect(JSON.stringify(makeReport())).not.toMatch(/séquence\s*[:=]\s*(?:T1|T2|GRE|EPI)/i));
  it("30 invents no timing", () => expect(JSON.stringify(makeReport())).not.toMatch(/(?:jour|heure|minute)\s*[:=]\s*\d/i));
  it("31 contains no clinical recommendation", () => expect(JSON.stringify(makeReport())).not.toMatch(/nous recommandons|vous devez/i));
  it("32 explicitly denies PASS PD-011", () => expect(content(39)).toContain("ni PASS PD-011"));
  it("enforces the final-report gate", () => expect(canGenerateFinalReport(sessionFactory(false))).toBe(false));
  it("blocks a final report while an active contradiction remains", () => {
    const session = sessionFactory();
    session.validatedIntent!.interpretation.contradictions = ["Contradiction active"];
    session.validatedIntent!.contradictionResolutions = { "Contradiction active": "KEPT_FOR_HUMAN_REVIEW" };
    expect(canGenerateFinalReport(session)).toBe(false);
  });
  it("keeps four deliverables visible", () => expect(makeReport().deliverables).toHaveLength(4));
});
