import { describe, expect, it } from "vitest";
import { executeScientificThinkingEngine } from "../engine";
import { parseScientificThinkingInput, parseScientificThinkingOutput, SCIENTIFIC_THINKING_OPERATIONS, scientificThinkingInputSchema } from "../types";
import { makeThinkingInput } from "./fixtures";

describe("ST-001 — contrats d’entrée et de sortie", () => {
  it("valide un input borné et refuse les champs inconnus", () => {
    const input = makeThinkingInput();
    expect(parseScientificThinkingInput(input)).toEqual(input);
    expect(scientificThinkingInputSchema.safeParse({ ...input, silentScientificDecision: true }).success).toBe(false);
  });

  it("produit un output structuré marqué candidat", () => {
    const output = executeScientificThinkingEngine(makeThinkingInput());
    expect(parseScientificThinkingOutput(output)).toEqual(output);
    expect(output.candidateNotice).toBe("ALL_GENERATED_SCIENTIFIC_CONTENT_REQUIRES_HUMAN_REVIEW");
    expect(output.questions[0]).toMatchObject({ kind: "PRIMARY", reviewState: "PENDING" });
    expect(output.handoff.boundary).toBe("NO_PROTOCOL_NO_METHOD_SELECTION_NO_STATISTICAL_PLAN");
  });

  it("expose les vingt opérations requises avec un état explicite", () => {
    const output = executeScientificThinkingEngine(makeThinkingInput());
    expect(output.operations.map((item) => item.operation)).toEqual(SCIENTIFIC_THINKING_OPERATIONS);
    expect(output.operations.every((item) => ["EXECUTED", "AVAILABLE", "NOT_APPLICABLE", "BLOCKED"].includes(item.status))).toBe(true);
  });
});
