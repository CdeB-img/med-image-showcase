import { describe, expect, it } from "vitest";
import { classifyImagingChange, propagateImagingImpact } from "../change";
import { executeImagingStudyDesigner } from "../engine";
import { answerImagingQuestion, createImagingDesignSession, decideImagingChange, requestImagingChange } from "../session";
import { makeImagingInput, withInput } from "./fixtures";

describe("IMG-001 — Decision Graph et propagation des impacts", () => {
  it("construit le graphe runtime attendu sans nouvelle ontologie", () => {
    const result = executeImagingStudyDesigner(makeImagingInput());
    expect(result.graph).toMatchObject({ projectionVersion: "RUNTIME_PROJECTION_1.0", ontologyStatus: "NO_NEW_ONTOLOGY" });
    expect(result.graph.nodes.map((item) => item.type)).toEqual(expect.arrayContaining(["QUESTION", "OBJECTIVE", "HYPOTHESIS", "PHENOMENON", "BIOMARKER", "MODALITY", "ACQUISITION", "QUALITY_CONTROL", "IMAGE_ANALYSIS", "VARIABLE", "ENDPOINT_CONTRIBUTION"]));
  });

  it("rend chaque chaîne cassée visible", () => {
    const base = makeImagingInput();
    const result = executeImagingStudyDesigner(withInput(base, { objectives: [], hypotheses: [], temporalContext: [], declaredEquipment: [] }));
    expect(result.status).toBe("RETURN_TO_SCIENTIFIC_THINKING");
    expect(result.graph.brokenChains.map((item) => item.code)).toEqual(expect.arrayContaining(["PHENOMENON_WITHOUT_OBJECTIVE_OR_HYPOTHESIS", "UNKNOWN_MANUFACTURER_DEPENDENCY", "UNJUSTIFIED_CRITICAL_TIMING"]));
    expect(result.graph.brokenChains.every((item) => item.visible)).toBe(true);
  });

  it("classe comme majeurs les changements structurants RDE-002", () => {
    expect(classifyImagingChange({ eventType: "BiomarkerChanged", description: "x", sourceIds: [], targetIds: [] })).toBe("MAJOR");
    expect(classifyImagingChange({ eventType: "TimingChanged", description: "x", sourceIds: [], targetIds: [] })).toBe("MINOR");
  });

  it("propage BiomarkerChanged vers acquisition, QA, analyse, Variables et Critères", () => {
    const propagated = propagateImagingImpact(
      { eventType: "BiomarkerChanged", description: "Biomarqueur changé", sourceIds: ["B1"], targetIds: ["B2"] },
      ["ACQUISITION", "QUALITY_CONTROL", "IMAGE_ANALYSIS", "VARIABLE", "ENDPOINT_CONTRIBUTION"].map((targetType, index) => ({ targetId: `T${index}`, targetType })),
    );
    expect(propagated.change).toMatchObject({ kind: "MAJOR", status: "PENDING_CONFIRMATION", requiresHumanConfirmation: true });
    expect(propagated.impacts.every((item) => item.state === "REVIEW_REQUIRED")).toBe(true);
  });

  it("affiche les impacts avant confirmation et préserve l’historique après rejet", () => {
    let session = createImagingDesignSession(makeImagingInput());
    session = requestImagingChange(session, { eventType: "BiomarkerChanged", description: "Changer le biomarqueur principal", sourceIds: [session.result.biomarkerCandidates[0].biomarkerId], targetIds: [] });
    const change = session.result.changes[0];
    expect(change.status).toBe("PENDING_CONFIRMATION");
    expect(session.result.impacts.some((item) => item.state === "REVIEW_REQUIRED")).toBe(true);
    session = decideImagingChange(session, change.changeId, "REJECTED");
    expect(session.result.changes[0].status).toBe("REJECTED");
    expect(session.result.impacts.every((item) => item.state === "PRESERVED")).toBe(true);
  });

  it("propage une déclaration multicentrique dans l’harmonisation et les décisions humaines", () => {
    let session = createImagingDesignSession(makeImagingInput({ centers: [] }));
    session = answerImagingQuestion(session, "IMG-AQ-CENTERS", "multi");
    expect(session.result.harmonizationStrategy.centerMode).toBe("MULTICENTRIC_HETEROGENEITY_UNKNOWN");
    expect(session.result.harmonizationStrategy.variantsToQualify.length).toBeGreaterThan(0);
    expect(session.result.decisionsRequired).toContainEqual(expect.objectContaining({ gateId: "IMG-GATE-MULTICENTER" }));
  });

  it("propage l’objectif d’évolution comme temporalité méthodologique sans inventer de date", () => {
    let session = createImagingDesignSession(makeImagingInput({ timings: [] }));
    session = answerImagingQuestion(session, "IMG-AQ-TIMING", "change");
    expect(session.result.timingStrategy).toContainEqual(expect.objectContaining({
      type: "METHODOLOGICAL_TIMING",
      value: "Évolution déclarée ; moments exacts à justifier",
      support: "PARTIALLY_SUPPORTED",
    }));
    expect(JSON.stringify(session.result.timingStrategy)).not.toMatch(/\b20\d{2}[-/]\d{1,2}[-/]\d{1,2}\b/);
  });
});
