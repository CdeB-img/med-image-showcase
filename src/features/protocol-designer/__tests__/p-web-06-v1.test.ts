import { describe, expect, it } from "vitest";
import { buildScientificSessionContext, assessQuestionChange, deriveRoutingIntent, preservedScientificTerms } from "../intake/journey";
import { createEmptyInterpretation } from "../intake/schema";
import { matchScenarios } from "../intake/scenarios";
import { buildValidatedIntent, createProtocolDesignerSession, invalidateDownstream } from "../intake/session";
import type { HumanFieldReview, InterpretedFieldKey } from "../intake/types";

const makeIntent = (question: string, domain: string, purpose: string) => {
  const interpretation = createEmptyInterpretation({ question, language: "fr", schemaVersion: "1.0" });
  interpretation.reformulatedQuestion = question;
  interpretation.scientificDomain = { value: [domain], origin: "EXPLICIT_USER_STATEMENT", confidence: "HIGH", sourceText: domain, userValidated: true };
  interpretation.scientificPurpose = { value: [purpose], origin: "EXPLICIT_USER_STATEMENT", confidence: "HIGH", sourceText: purpose, userValidated: true };
  interpretation.phenomenaOfInterest = { value: [domain], origin: "EXPLICIT_USER_STATEMENT", confidence: "HIGH", sourceText: domain, userValidated: true };
  const reviews = {
    scientificDomain: { state: "CONFIRMED", reviewedAt: "2026-08-08T00:00:00Z" },
    scientificPurpose: { state: "CONFIRMED", reviewedAt: "2026-08-08T00:00:00Z" },
    phenomenaOfInterest: { state: "CONFIRMED", reviewedAt: "2026-08-08T00:00:00Z" },
  } as Partial<Record<InterpretedFieldKey, HumanFieldReview>>;
  return buildValidatedIntent(interpretation, reviews, question, "2026-08-08T00:00:00Z");
};

describe("P-WEB-06 — legacy intake units retained outside the nominal path", () => {
  it("routes an explanatory OEF/CMRO₂ request to UNDERSTAND", () => {
    const intent = makeIntent("Quelle différence physiologique entre l’OEF et le CMRO₂ ?", "OEF et CMRO₂", "comprendre");
    expect(deriveRoutingIntent(intent)).toMatchObject({ routeIntent: "UNDERSTAND", confidence: "HIGH" });
    expect(preservedScientificTerms(intent).map((item) => item.toLocaleLowerCase("fr-FR"))).toEqual(expect.arrayContaining(["oef", "cmro₂"]));
  });

  it("routes a no-reflow idea to FORMALIZE_IDEA without losing the term", () => {
    const intent = makeIntent("Je pense que le no-reflow dépend de plusieurs mécanismes.", "no-reflow", "formaliser une hypothèse");
    expect(deriveRoutingIntent(intent).routeIntent).toBe("FORMALIZE_IDEA");
    expect(preservedScientificTerms(intent)).toContain("no-reflow");
    expect(matchScenarios(intent)[0]?.scenarioId).toBe("cardiac");
  });

  it("routes a CT spectral study request to DESIGN_STUDY", () => {
    const intent = makeIntent("Je veux construire une étude multicentrique en CT spectral.", "CT spectral", "construire une étude");
    expect(deriveRoutingIntent(intent).routeIntent).toBe("DESIGN_STUDY");
    expect(matchScenarios(intent)[0]?.scenarioId).toBe("spectral");
  });

  it("keeps a deliberately vague unsupported request unsupported", () => {
    const intent = makeIntent("Je voudrais faire une recherche en imagerie sans savoir encore sur quoi.", "imagerie", "recherche");
    expect(matchScenarios(intent)).toHaveLength(0);
  });

  it("distinguishes minor and major scientific-question changes", () => {
    expect(assessQuestionChange("Étudier l’OEF en imagerie cérébrale", "Étudier précisément l’OEF en imagerie cérébrale").kind).toBe("MINOR");
    const major = assessQuestionChange("Étudier l’OEF en imagerie cérébrale", "Comparer le T1 mapping et l’ECV en IRM cardiaque");
    expect(major.kind).toBe("MAJOR");
    expect(major.affectedElements).toContain("décision humaine et rapport");
  });

  it("invalidates downstream decisions after a confirmed major legacy change", () => {
    const stored = createProtocolDesignerSession("2026-08-08T00:00:00Z");
    const invalidated = invalidateDownstream({
      ...stored,
      currentStep: 5,
      reportStatus: "FINAL",
      decision: {
        author: "Évaluation précédente",
        outcome: "CONFIRM_ORIENTATION",
        justification: "Décision fondée sur la question initiale.",
        reservations: "",
        decidedAt: "2026-08-08T00:10:00Z",
      },
      scientificContext: buildScientificSessionContext(makeIntent("Étudier l’OEF", "OEF", "comprendre")),
    }, "Modification majeure confirmée — reconstruction des éléments dépendants");
    expect(invalidated).toMatchObject({ decision: null, reportStatus: "NONE", projectConstruction: null });
    expect(invalidated.invalidatedDownstream).toContain("Modification majeure confirmée — reconstruction des éléments dépendants");
  });
});
