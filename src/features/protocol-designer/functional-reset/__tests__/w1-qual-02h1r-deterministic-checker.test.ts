import { describe, expect, it } from "vitest";
import {
  CURRENT_ST_LIMITATION_CONTRACT,
  H1R_CHECKER_BOUNDARY,
  checkLimitationPreservation,
  readCurrentStLimitationRepresentation,
} from "../../../../../validation/w1-qual-02h1r-st/tools/deterministic-checker";

const required = ["Limitation A", "Limitation B"];
const output = {
  handoff: { limitations: required },
  hypotheses: [
    { hypothesisId: "H-1", limitations: ["Limitation A"] },
    { hypothesisId: "H-2", limitations: ["Limitation B"] },
  ],
};

describe("W1-QUAL-02H1R — current ST limitation contract", () => {
  it("reads limitations from the governed nested and persisted projections", () => {
    expect(readCurrentStLimitationRepresentation({
      output,
      ownerResultLimitations: [...required, "SCIENTIFIC_THINKING_CANDIDATES_ARE_NOT_ADOPTED_PROJECT_FACTS"],
    })).toEqual({
      handoffLimitations: required,
      hypothesisLimitations: [
        { hypothesisId: "H-1", limitations: ["Limitation A"] },
        { hypothesisId: "H-2", limitations: ["Limitation B"] },
      ],
      ownerResultLimitations: [...required, "SCIENTIFIC_THINKING_CANDIDATES_ARE_NOT_ADOPTED_PROJECT_FACTS"],
    });
    expect(CURRENT_ST_LIMITATION_CONTRACT.outputTopLevelLimitations).toBe("ABSENT_BY_STRICT_SCHEMA");
  });

  it("detects a required limitation missing from the handoff or owner result", () => {
    expect(checkLimitationPreservation({
      requiredLimitations: required,
      output: { ...output, handoff: { limitations: ["Limitation A"] } },
      ownerResultLimitations: required,
    }).outcome).toBe("FAIL");
    expect(checkLimitationPreservation({
      requiredLimitations: required,
      output,
      ownerResultLimitations: ["Limitation A"],
    }).outcome).toBe("FAIL");
  });

  it("detects changed limitation content without semantic normalization", () => {
    expect(checkLimitationPreservation({
      requiredLimitations: required,
      output: { ...output, handoff: { limitations: ["Limitation A", "Limitation B modifiée"] } },
      ownerResultLimitations: ["Limitation A", "Limitation B modifiée"],
    }).outcome).toBe("FAIL");
  });

  it("introduces no scientific judgment", () => {
    const result = checkLimitationPreservation({
      requiredLimitations: required,
      output,
      ownerResultLimitations: required,
    });
    expect(result.outcome).toBe("PASS");
    expect(result.scientificJudgmentPerformed).toBe(false);
    expect(H1R_CHECKER_BOUNDARY).toEqual({
      operation: "POST_FREEZE_TECHNICAL_CONTRACT_ALIGNMENT",
      scientificJudgmentPerformed: false,
      changesScientificContent: false,
      resolvesContradictions: false,
      promotesCandidates: false,
    });
  });
});
