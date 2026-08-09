import { describe, expect, it } from "vitest";
import { assessScientificThinkingChange, decideScientificThinkingChange } from "../change";
import { executeScientificThinkingEngine } from "../engine";
import { makeThinkingInput } from "./fixtures";

describe("ST-001 — raisonnement, graphe, trace et déterminisme", () => {
  it("produit une projection runtime typée sans créer d’ontologie", () => {
    const output = executeScientificThinkingEngine(makeThinkingInput());
    expect(output.graph).toMatchObject({ projectionVersion: "RUNTIME_PROJECTION_1.0", ontologyStatus: "NO_NEW_ONTOLOGY" });
    expect(output.graph.nodes.map((item) => item.type)).toEqual(expect.arrayContaining(["SITUATION", "INTUITION", "SCIENTIFIC_QUESTION", "ASSUMPTION", "HYPOTHESIS", "OBJECTIVE", "MECHANISM"]));
    expect(output.graph.edges.every((item) => output.graph.nodes.some((node) => node.nodeId === item.from) && output.graph.nodes.some((node) => node.nodeId === item.to))).toBe(true);
  });

  it("conserve ambiguïtés, contradictions, biais et demandes de connaissance séparés", () => {
    const output = executeScientificThinkingEngine(makeThinkingInput({ contradictions: ["Temporalité contradictoire"], methodsMentioned: ["IRM"] }));
    expect(output.contradictions).toEqual(["Temporalité contradictoire"]);
    expect(output.conceptualBiases).toContain("SOLUTION_MÉTHODOLOGIQUE_POTENTIELLEMENT_PRÉMATURÉE");
    expect(output.knowledgeRequest).not.toBeNull();
  });

  it("est logiquement déterministe à entrée et contrôles identiques", () => {
    const input = makeThinkingInput();
    const first = executeScientificThinkingEngine(input);
    const second = executeScientificThinkingEngine(input);
    expect(first.outputDigest).toBe(second.outputDigest);
    expect(first.outputId).toBe(second.outputId);
    expect(first.trace).toEqual(second.trace);
  });

  it("qualifie une modification mineure ou majeure sans invalidation silencieuse", () => {
    const output = executeScientificThinkingEngine(makeThinkingInput());
    expect(assessScientificThinkingChange("Étudier le no-reflow après stenting", "Étudier précisément le no-reflow après stenting", output).kind).toBe("MINOR");
    const major = assessScientificThinkingChange("Étudier le no-reflow après stenting", "Comparer l’OEF et le CMRO2 en perfusion cérébrale", output);
    expect(major).toMatchObject({ kind: "MAJOR", requiresHumanConfirmation: true, status: "PENDING_CONFIRMATION" });
    expect(major.affectedElementIds).toContain("ST-Q-001");
    expect(decideScientificThinkingChange(major, false).status).toBe("REJECTED");
  });
});
