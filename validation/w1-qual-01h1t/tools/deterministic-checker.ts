export const H1T_DETERMINISTIC_CHECKER_VERSION = "1.1.0" as const;

export type TechnicalCheckOutcome = "PASS" | "FAIL" | "NOT_APPLICABLE";

export type TechnicalCheck = {
  checkId: string;
  outcome: TechnicalCheckOutcome;
  observed: string;
  expected: string;
  scientificJudgmentPerformed: false;
};

export type StructuredConflict = {
  conflictId: string;
  state: string;
  explanation: string;
};

export const CANONICAL_OWNER_RESULT_TRACE = [
  "RUN_STARTED",
  "HANDOFF_STARTED",
  "HANDOFF_ACCEPTED",
  "OWNER_INVOCATION_STARTED",
  "OWNER_INVOCATION_COMPLETED",
  "RESULT_PERSISTED",
  "RUN_COMPLETED",
] as const;

export const CANONICAL_STALE_REJECTION_TRACE = [
  "RUN_STARTED",
  "HANDOFF_STARTED",
  "STALE_RESULT_REJECTED",
  "HANDOFF_REJECTED",
  "RUN_FAILED",
] as const;

const technicalCheck = (
  checkId: string,
  outcome: TechnicalCheckOutcome,
  observed: unknown,
  expected: unknown,
): TechnicalCheck => ({
  checkId,
  outcome,
  observed: typeof observed === "string" ? observed : JSON.stringify(observed),
  expected: typeof expected === "string" ? expected : JSON.stringify(expected),
  scientificJudgmentPerformed: false,
});

const sameOrderedValues = (observed: readonly string[], expected: readonly string[]) => (
  observed.length === expected.length && observed.every((value, index) => value === expected[index])
);

/**
 * Current product projection: validatedReformulation followed by one space and
 * the caller-supplied purpose. No semantic normalization or interpretation is
 * performed by this checker.
 */
export const expectedOriginalExpression = (validatedReformulation: string, purpose: string) => (
  `${validatedReformulation} ${purpose}`
);

export const checkOriginalExpressionContract = (input: {
  question: string;
  purpose: string;
  originalExpression: string | null;
  validatedReformulation: string | null;
  applicable?: boolean;
}): TechnicalCheck => {
  if (input.applicable === false) {
    return technicalCheck(
      "PROJECT_QUESTION_SOURCE_BINDING",
      "NOT_APPLICABLE",
      { originalExpression: input.originalExpression, validatedReformulation: input.validatedReformulation },
      "PRE_OWNER_REJECTION",
    );
  }
  const expectedExpression = expectedOriginalExpression(input.question, input.purpose);
  const pass = input.validatedReformulation === input.question
    && input.originalExpression === expectedExpression;
  return technicalCheck(
    "PROJECT_QUESTION_SOURCE_BINDING",
    pass ? "PASS" : "FAIL",
    { originalExpression: input.originalExpression, validatedReformulation: input.validatedReformulation },
    { originalExpression: expectedExpression, validatedReformulation: input.question },
  );
};

export const checkTraceCompleteness = (input: {
  eventTypes: readonly string[];
  expectedExecution: "OWNER_EXECUTION_REQUIRED" | "PRE_OWNER_REJECTION_EXPECTED";
}): TechnicalCheck => {
  const expected = input.expectedExecution === "OWNER_EXECUTION_REQUIRED"
    ? CANONICAL_OWNER_RESULT_TRACE
    : CANONICAL_STALE_REJECTION_TRACE;
  return technicalCheck(
    "TRACE_COMPLETENESS",
    sameOrderedValues(input.eventTypes, expected) ? "PASS" : "FAIL",
    input.eventTypes,
    expected,
  );
};

export const serializeStructuredConflict = (conflict: StructuredConflict) => (
  `${conflict.conflictId}:${conflict.state}:${conflict.explanation}`
);

/**
 * Compares exact typed Knowledge conflict identity, state and explanation after
 * the product's documented string projection. It neither parses nor rewrites
 * scientific content, so colons inside identifiers or explanations are kept.
 */
export const checkContradictionPreservation = (input: {
  expectedConflicts: readonly StructuredConflict[];
  observedContradictions: readonly string[];
  applicable?: boolean;
}): TechnicalCheck => {
  if (input.applicable === false) {
    return technicalCheck(
      "CONTRADICTION_PRESERVATION",
      "NOT_APPLICABLE",
      input.observedContradictions,
      "PRE_OWNER_REJECTION",
    );
  }
  const expected = input.expectedConflicts.map(serializeStructuredConflict);
  const pass = expected.every((conflict) => input.observedContradictions.includes(conflict));
  return technicalCheck(
    "CONTRADICTION_PRESERVATION",
    pass ? "PASS" : "FAIL",
    input.observedContradictions,
    expected,
  );
};

export const CHECKER_NORMALIZATION_BOUNDARY = Object.freeze({
  operation: "EXACT_TECHNICAL_PROJECTION_AND_COMPARISON",
  scientificJudgmentPerformed: false,
  changesScientificContent: false,
  resolvesContradictions: false,
  promotesCandidates: false,
});
