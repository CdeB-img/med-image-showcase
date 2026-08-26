import { describe, expect, it } from "vitest";
import {
  CANONICAL_OWNER_RESULT_TRACE,
  CHECKER_NORMALIZATION_BOUNDARY,
  checkContradictionPreservation,
  checkOriginalExpressionContract,
  checkTraceCompleteness,
  expectedOriginalExpression,
  serializeStructuredConflict,
} from "../../../../../validation/w1-qual-01h1t/tools/deterministic-checker";

const question = "La question scientifique gelée ?";
const purpose = "Examiner une proposition candidate sans adoption.";
const conflict = {
  conflictId: "conflict:synthetic:1",
  state: "OPEN",
  explanation: "Deux interprétations restent incompatibles.",
};

describe("H1T deterministic checker contract alignment", () => {
  it("accepts the product originalExpression contract question plus purpose", () => {
    const result = checkOriginalExpressionContract({
      question,
      purpose,
      validatedReformulation: question,
      originalExpression: expectedOriginalExpression(question, purpose),
    });
    expect(result.outcome).toBe("PASS");
  });

  it("rejects a partial originalExpression", () => {
    const result = checkOriginalExpressionContract({
      question,
      purpose,
      validatedReformulation: question,
      originalExpression: question,
    });
    expect(result.outcome).toBe("FAIL");
  });

  it("accepts canonical RESULT_PERSISTED in the ordered nominal TRACE", () => {
    const result = checkTraceCompleteness({
      eventTypes: CANONICAL_OWNER_RESULT_TRACE,
      expectedExecution: "OWNER_EXECUTION_REQUIRED",
    });
    expect(result.outcome).toBe("PASS");
  });

  it("rejects a nominal TRACE without result persistence", () => {
    const result = checkTraceCompleteness({
      eventTypes: CANONICAL_OWNER_RESULT_TRACE.filter((event) => event !== "RESULT_PERSISTED"),
      expectedExecution: "OWNER_EXECUTION_REQUIRED",
    });
    expect(result.outcome).toBe("FAIL");
  });

  it("accepts the exact typed Knowledge contradiction projection", () => {
    const result = checkContradictionPreservation({
      expectedConflicts: [conflict],
      observedContradictions: [serializeStructuredConflict(conflict)],
    });
    expect(result.outcome).toBe("PASS");
  });

  it("rejects a changed conflictId", () => {
    const result = checkContradictionPreservation({
      expectedConflicts: [conflict],
      observedContradictions: [serializeStructuredConflict({ ...conflict, conflictId: "conflict:synthetic:2" })],
    });
    expect(result.outcome).toBe("FAIL");
  });

  it("rejects a changed contradiction state", () => {
    const result = checkContradictionPreservation({
      expectedConflicts: [conflict],
      observedContradictions: [serializeStructuredConflict({ ...conflict, state: "RESOLVED" })],
    });
    expect(result.outcome).toBe("FAIL");
  });

  it("rejects a changed contradiction explanation", () => {
    const result = checkContradictionPreservation({
      expectedConflicts: [conflict],
      observedContradictions: [serializeStructuredConflict({ ...conflict, explanation: "Texte altéré." })],
    });
    expect(result.outcome).toBe("FAIL");
  });

  it("keeps identifiers and explanations containing colons byte-exact", () => {
    const withColons = { ...conflict, conflictId: "conflict:synthetic:segment:1", explanation: "A:B reste ouvert." };
    expect(serializeStructuredConflict(withColons)).toBe("conflict:synthetic:segment:1:OPEN:A:B reste ouvert.");
  });

  it("introduces no scientific judgment or content transformation", () => {
    expect(CHECKER_NORMALIZATION_BOUNDARY).toEqual({
      operation: "EXACT_TECHNICAL_PROJECTION_AND_COMPARISON",
      scientificJudgmentPerformed: false,
      changesScientificContent: false,
      resolvesContradictions: false,
      promotesCandidates: false,
    });
  });
});
