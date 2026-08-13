import { describe, expect, it } from "vitest";
import { canonicalizeSemanticReconstruction } from "../canonical";
import { evaluateSemanticCase, semanticMeaningMatches } from "../competence";
import type { SemanticCompetenceCase } from "../competence-fixtures";
import { acceptedCritic, comparisonCandidate, makeSemanticRequest } from "./fixtures";

describe("SEM-001R4 closure generic multilingual evaluator equivalence", () => {
  it.each([
    ["pulmonary magnetic resonance imaging", "IRM pulmonaire"],
    ["pelvic MRI", "IRM pelvienne"],
    ["thoracic computed tomography", "TDM thoracique"],
    ["abdominal CT", "scanner abdominal"],
    ["cerebral positron emission tomography", "TEP cérébrale"],
    ["abdominal ultrasound", "échographie abdominale"],
    ["Ultrasound Elastography", "élastographie ultrasonore"],
  ])("recognizes the same modality across English and French: %s / %s", (left, right) => {
    expect(semanticMeaningMatches(left, right)).toBe(true);
  });

  it("does not collapse different perfusion modality families", () => {
    expect(semanticMeaningMatches("MRI perfusion", "perfusion CT")).toBe(false);
  });

  it("does not collapse distinct PET tracer techniques", () => {
    expect(semanticMeaningMatches("PET PSMA", "PET FDG")).toBe(false);
  });

  it.each([
    ["virtual non contrast", "imagerie virtuelle sans contraste"],
    ["virtual non-contrast", "virtuel sans contraste"],
    ["virtual unenhanced", "virtual non contrast"],
  ])("recognizes equivalent virtual non-contrast method labels: %s / %s", (left, right) => {
    expect(semanticMeaningMatches(left, right)).toBe(true);
  });

  it("recognizes a typed reference method as the comparator role without changing its METHOD type", () => {
    const candidate = comparisonCandidate();
    candidate.elements[1] = { ...candidate.elements[1], type: "METHOD", canonicalMeaning: "virtual non contrast", studyRole: "SUBJECT" };
    candidate.elements[2] = { ...candidate.elements[2], type: "METHOD", canonicalMeaning: "unenhanced acquisition", studyRole: "REFERENCE_STANDARD" };
    const fixture: SemanticCompetenceCase = {
      caseId: "SEM-R4-REFERENCE-STANDARD",
      split: "DEVELOPMENT_CASES",
      domain: "generic",
      turns: ["Comparer deux acquisitions."],
      gold: {
        requiredExplicitObjects: [
          { type: "METHOD", meaning: "virtual non contrast", aliases: [], critical: true },
          { type: "COMPARATOR", meaning: "unenhanced acquisition", aliases: [], critical: true },
        ],
        requiredRelations: [{ source: "virtual non contrast", target: "unenhanced acquisition", relationAliases: ["COMPARES_WITH"], critical: true }],
        acceptableInferences: [],
        forbiddenInferences: [],
        requiredAmbiguities: [],
        optionalClarifications: [],
        forbiddenClarifications: [],
        expectedIntent: "compare",
        allowedRoutes: ["FORMALIZE_IDEA"],
        criticalSemanticElements: ["virtual non contrast", "unenhanced acquisition"],
      },
    };
    const model = canonicalizeSemanticReconstruction({
      request: makeSemanticRequest(),
      candidate,
      critic: acceptedCritic(candidate),
      metadata: { provider: "TEST", model: "r4-reference-role", temperature: null },
      reconstructionCallId: "reconstruct",
      criticCallId: "critic",
    });
    expect(evaluateSemanticCase(fixture, model)).toMatchObject({
      explicitObjectRecall: 1,
      explicitRelationRecall: 1,
      comparatorPreserved: true,
      absoluteBlockers: [],
    });
  });
});
