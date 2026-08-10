import { describe, expect, it } from "vitest";
import { decideExternalSearch } from "@/features/knowledge-engine/external-evidence";
import { executeImagingStudyDesigner } from "@/features/imaging-study-designer";
import { buildScientificSessionContext, deriveRoutingIntent } from "@/features/protocol-designer/intake/journey";
import { auditPreservedObjects } from "../audit";
import { authorizeSystemThinking, comparisonFields, createSystemImaging, makeSystemIntent, makeSystemKnowledge } from "./fixtures";

describe("SYS-001 — end-to-end A à D", () => {
  it("CAS A — UNDERSTAND exécute Knowledge sans construire de projet", () => {
    const intent = makeSystemIntent("Qu’est-ce que l’ECV ?", { phenomenaOfInterest: ["ECV"] });
    const routing = deriveRoutingIntent(intent);
    const knowledge = makeSystemKnowledge(intent, "PROTOCOL_DESIGNER_UNDERSTAND");
    expect(routing.routeIntent).toBe("UNDERSTAND");
    expect(knowledge.resolvedConcepts.some((item) => item.preferredLabel === "ECV")).toBe(true);
    expect(knowledge.request.consumer).toBe("PROTOCOL_DESIGNER_UNDERSTAND");
  });

  it.each([
    "Comment comparer CT cardiaque et IRM cardiaque ?",
    "Comparer CT cardiaque et IRM cardiaque pour étudier la fibrose myocardique.",
  ])("CAS B/C — la comparaison reste UNDERSTAND sans projet explicite: %s", (question) => {
    const intent = makeSystemIntent(question, comparisonFields);
    const context = buildScientificSessionContext(intent);
    const knowledge = makeSystemKnowledge(intent, "PROTOCOL_DESIGNER_UNDERSTAND");
    expect(context.routeIntent).toBe("UNDERSTAND");
    expect(context.detectedRelationships).toContain("comparaison explicitement demandée");
    expect(knowledge.request.requestType).toBe("COMPARE");
  });

  it("CAS D — préserve CT cardiaque, IRM cardiaque, fibrose et COMPARE sans choisir de modalité", () => {
    const question = "Je veux construire une étude comparant CT cardiaque et IRM cardiaque pour étudier la fibrose myocardique.";
    const intent = makeSystemIntent(question, comparisonFields);
    const context = buildScientificSessionContext(intent);
    const knowledge = makeSystemKnowledge(intent, "IMAGING_STUDY_DESIGNER");
    const imaging = createSystemImaging(intent);
    const findings = auditPreservedObjects(["CT", "IRM", "fibrose myocardique"], [
      { stage: "Intent", values: context.preservedScientificTerms },
      { stage: "Knowledge", values: knowledge.resolvedConcepts.map((item) => item.preferredLabel) },
      { stage: "Imaging", values: [...imaging.result.modalityCandidates.map((item) => item.label), ...imaging.result.phenomena.map((item) => item.label)] },
    ]);
    expect(findings).toEqual([]);
    expect(imaging.input.knownConstraints).toContain("comparaison explicitement demandée");
    expect(imaging.result.modalityCandidates.map((item) => item.reviewState)).toEqual(["PENDING", "PENDING"]);
    expect(imaging.result.projectConstructionHandoff.status).toBe("NOT_READY");
    expect(imaging.result.acquisitionStrategies).toEqual([]);
  });

  it("CAS F — une incompatibilité déclarée reste un blocage ciblé", () => {
    const intent = makeSystemIntent("Je veux construire une étude comparant l’ECV et le T1 natif en IRM cardiaque pour étudier la fibrose myocardique.", {
      scientificPurpose: ["comparer deux mesures"], phenomenaOfInterest: ["fibrose myocardique"], outcomesMentioned: ["ECV", "T1 natif"], population: ["adultes"], declaredTimings: ["mesure initiale"],
    });
    const base = createSystemImaging(intent).input;
    const result = executeImagingStudyDesigner({ ...base, declaredEquipment: [{ equipmentId: "SYS-EQ-1", siteLabel: "Centre incompatible", modality: "IRM", manufacturer: null, model: null, fieldStrength: null, softwareVersion: null, options: [], availability: "KNOWN_UNAVAILABLE", period: null, provenanceRef: "user:sys-001" }] });
    expect(result.projectConstructionHandoff.equipmentCompatibilityStatus).toBe("INCOMPATIBLE");
    expect(result.projectConstructionHandoff.projectHandoffReadiness).toBe("PROJECT_HANDOFF_BLOCKED");
    expect(result.projectConstructionHandoff.executableProtocolReadiness).toBe("EXECUTABLE_PROTOCOL_NOT_READY");
  });

  it("CAS H — un corpus insuffisant propose l’externe sans substituer de corpus voisin", () => {
    const intent = makeSystemIntent("Expliquer la transformée de Fourier en IRM.");
    const knowledge = makeSystemKnowledge(intent, "PROTOCOL_DESIGNER_UNDERSTAND");
    const decision = decideExternalSearch(knowledge, "EXTERNAL_ALLOWED");
    expect(knowledge.gaps.length).toBeGreaterThan(0);
    expect(knowledge.queryPlan.matchingSemantics).toBe("EXACT_FIRST_NO_IMPLICIT_FALLBACK");
    expect(decision).toMatchObject({ requiresUserAction: true, authorized: false });
  });

  it("CAS J — une contradiction scientifique reste ouverte et bloque le handoff", () => {
    const intent = makeSystemIntent("Je pense que l’ECV augmente et diminue dans le même contexte en IRM cardiaque.", { phenomenaOfInterest: ["ECV"], scientificPurpose: ["examiner une hypothèse contradictoire"] });
    intent.interpretation.contradictions = ["L’ECV est déclaré simultanément en augmentation et en diminution dans le même contexte."];
    const thinking = authorizeSystemThinking(intent).session;
    expect(thinking.output.contradictions.join(" ")).toContain("simultanément en augmentation et en diminution");
    expect(thinking.output.handoff.status).toBe("NOT_READY");
    expect(thinking.output.handoff.blockedBy.some((item) => item.startsWith("UNRESOLVED_CONTRADICTION:"))).toBe(true);
  });
});
