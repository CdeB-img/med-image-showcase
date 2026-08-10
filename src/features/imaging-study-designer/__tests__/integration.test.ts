import { describe, expect, it } from "vitest";
import { executeImagingStudyDesigner } from "../engine";
import { createImagingDesignSession, decideImagingGate } from "../session";
import { makeImagingInput, withInput } from "./fixtures";

describe("IMG-001 — intégrations Knowledge, ST, humain, trace et déterminisme", () => {
  it("consomme un handoff ST-001 autorisé sans reformuler Question/Objectifs/Hypothèses", () => {
    const input = makeImagingInput();
    const result = executeImagingStudyDesigner(input);
    expect(input.sourceHandoff.status).toBe("AUTHORIZED");
    expect(result.scientificQuestion).toEqual(input.confirmedScientificQuestion);
    expect(result.objectives).toEqual(input.objectives);
    expect(result.hypotheses).toEqual(input.hypotheses);
  });

  it("conserve le handoff Knowledge exact-first et les gaps sans closest-corpus fallback", () => {
    const result = executeImagingStudyDesigner(makeImagingInput());
    expect(result.knowledgeHandoff.noClosestCorpusFallback).toBe(true);
    expect(result.knowledgeHandoff.resultRef).toBeTruthy();
    expect(result.provenance.knowledgeResultRef).toBe(result.knowledgeHandoff.resultRef);
  });

  it("requiert des décisions humaines pour les choix structurants et le gel", () => {
    let session = createImagingDesignSession(makeImagingInput());
    expect(session.result.decisionsRequired).toContainEqual(expect.objectContaining({ gateId: "IMG-GATE-HANDOFF-FREEZE", status: "PENDING" }));
    const first = session.result.decisionsRequired[0];
    session = decideImagingGate(session, first.gateId, "APPROVED", "Décision explicite.", "Responsable Imaging", "mandate:img-test", "2026-08-09T12:00:00.000Z");
    expect(session.result.decisionsRequired.find((item) => item.gateId === first.gateId)?.status).toBe("APPROVED");
    expect(session.decisionHistory.find((item) => item.gateId === first.gateId)?.targets).toEqual(first.targetIds);
  });

  it("refuse le patient-level sans recommandation clinique", () => {
    const base = makeImagingInput();
    const patient = withInput(base, { originalExpression: "Quel protocole IRM dois-je demander pour vérifier si mon T2 élevé est grave ?", safetyFlags: ["PATIENT_LEVEL"] });
    const result = executeImagingStudyDesigner(patient);
    expect(result).toMatchObject({ status: "REFUSED", refusal: { code: "PATIENT_LEVEL" } });
    expect(result.nextActions).toContain("STOP_PATIENT_LEVEL");
    expect(JSON.stringify(result)).not.toMatch(/consultez|demandez à votre médecin|vous devriez/i);
  });

  it("trace chaque opération et la frontière LLM interdite", () => {
    const result = executeImagingStudyDesigner(makeImagingInput());
    expect(result.trace.map((item) => item.operation)).toEqual(expect.arrayContaining(["VALIDATE_INPUT_AND_DOMAIN_GATE", "MAP_PHENOMENA_AND_GOVERNED_BIOMARKERS", "BUILD_MODALITY_ACQUISITION_QA_ANALYSIS", "GENERATE_EXECUTABLE_PROTOCOL"]));
    expect(result.trace.find((item) => item.operation === "GENERATE_EXECUTABLE_PROTOCOL")).toMatchObject({ mode: "FORBIDDEN", decision: "NOT_GENERATABLE_WITH_CURRENT_EXECUTABLE_KNOWLEDGE" });
    expect(result.provenance.llmContributionStatus).toBe("NO_LLM_SCIENTIFIC_DECISION");
  });

  it("produit exactement le même résultat structuré pour le même contexte", () => {
    const input = makeImagingInput();
    const first = executeImagingStudyDesigner(input);
    const second = executeImagingStudyDesigner(structuredClone(input));
    expect(second).toEqual(first);
    expect(second.resultDigest).toBe(first.resultDigest);
  });

  it("reste indépendant du fournisseur LLM", () => {
    const input = makeImagingInput();
    const result = executeImagingStudyDesigner(input);
    expect(JSON.stringify(result)).not.toMatch(/gemini|openai|anthropic|claude/i);
    expect(result.provenance.llmContributionStatus).toBe("NO_LLM_SCIENTIFIC_DECISION");
  });
});
