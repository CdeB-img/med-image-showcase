import { describe, expect, it } from "vitest";
import { executeImagingStudyDesigner } from "../engine";
import { imagingDesignInputSchema, imagingDesignResultSchema } from "../types";
import { makeImagingInput } from "./fixtures";

describe("IMG-001 — contrats ImagingDesignInput et ImagingDesignResult", () => {
  it("valide une projection d’entrée sans dupliquer les objets PD-003", () => {
    const input = makeImagingInput();
    expect(imagingDesignInputSchema.safeParse(input).success).toBe(true);
    expect(input.sourceHandoff).toMatchObject({ kind: "AUTHORIZED_ST_HANDOFF", status: "AUTHORIZED", boundary: "NO_PROTOCOL_NO_METHOD_SELECTION_NO_STATISTICAL_PLAN" });
    expect(input.knowledge.matchingSemantics).toBe("EXACT_FIRST_NO_IMPLICIT_FALLBACK");
    expect(JSON.stringify(input)).not.toContain("canonicalObjectMutation");
  });

  it("valide un résultat structuré complet dont le texte utilisateur n’est pas la seule sortie", () => {
    const result = executeImagingStudyDesigner(makeImagingInput());
    expect(imagingDesignResultSchema.safeParse(result).success).toBe(true);
    expect(result).toMatchObject({ projectionNotice: "RUNTIME_PROJECTION_DOES_NOT_OWN_CANONICAL_SCIENCE" });
    expect(result.graph.nodes.length).toBeGreaterThan(1);
    expect(result.provenance.policyRefs).toEqual(["RDE-001", "RDE-002", "RDE-003", "KE-001", "ST-001"]);
  });

  it("bloque toujours le protocole exécutable en l’absence de connaissance exécutable", () => {
    const result = executeImagingStudyDesigner(makeImagingInput());
    expect(result.acquisitionStrategies.length).toBeGreaterThan(0);
    expect(result.acquisitionStrategies.every((item) => item.level3.status === "NOT_GENERATABLE_WITH_CURRENT_EXECUTABLE_KNOWLEDGE")).toBe(true);
    expect(JSON.stringify(result.acquisitionStrategies)).not.toMatch(/\b(?:TR|TE|TI|kVp|mAs)\s*[=:]\s*\d/i);
  });
});
