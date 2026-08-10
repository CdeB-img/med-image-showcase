import { describe, expect, it } from "vitest";
import { projectDocument } from "@/features/document-projection";
import { buildImagingDesignInput, createImagingDesignSession, decideImagingGate, decideImagingChange, requestImagingChange } from "@/features/imaging-study-designer";
import { buildScientificSessionContext } from "@/features/protocol-designer/intake/journey";
import { assessScientificReadiness } from "@/features/protocol-designer/intake/scientific-readiness";
import { createHumanDecisionCandidate, engageHumanDecision, preserveLegacyHumanDecision } from "@/features/protocol-designer/human-decision";
import { auditHumanDecisionContract } from "../audit";
import { authorizeSystemProject, authorizeSystemThinking, freezeSystemImaging, makeSystemIntent, makeSystemKnowledge } from "./fixtures";

const CASE_D = "Je veux construire une étude comparant CT et IRM pour mesurer la fibrose myocardique.";
const ACTOR = "Responsable scientifique SYS-001B";
const MANDATE = "mandate:sys-001b";
const NOW = "2026-08-10T19:00:00.000Z";

describe("SYS-001B — Human Decision Envelope", () => {
  it("autorise une décision candidate non engageante sans actor ni mandate", () => {
    const candidate = createHumanDecisionCandidate({
      decisionId: "decision:test", gateId: "GATE-TEST", scope: [], targets: [],
      provenance: ["SYS-001B"], engineSource: "SCIENTIFIC_THINKING", projectVersion: "candidate-v1",
    });
    expect(candidate).toMatchObject({ status: "PENDING", actor: null, mandate: null, timestamp: null });
    expect(auditHumanDecisionContract("candidate", candidate)).toEqual([]);
  });

  it("interdit l'adoption sans actor ou sans mandate sans faire agir la porte", () => {
    const candidate = createHumanDecisionCandidate({
      decisionId: "decision:test", gateId: "GATE-TEST", scope: ["scope"], targets: ["target"],
      provenance: ["SYS-001B"], engineSource: "IMAGING", projectVersion: "candidate-v1",
    });
    expect(engageHumanDecision(candidate, { status: "ADOPTED", actor: null, mandate: MANDATE, timestamp: NOW }).status).toBe("INCOMPLETE_FOR_ADOPTION");
    expect(engageHumanDecision(candidate, { status: "ADOPTED", actor: ACTOR, mandate: null, timestamp: NOW }).status).toBe("INCOMPLETE_FOR_ADOPTION");
  });

  it("adopte seulement avec actor et mandate et conserve l'identité", () => {
    const candidate = createHumanDecisionCandidate({
      decisionId: "decision:test", gateId: "GATE-TEST", scope: ["scope"], targets: ["target"],
      provenance: ["SYS-001B"], engineSource: "RESEARCH_PROJECT", projectVersion: "candidate-v1",
    });
    const adopted = engageHumanDecision(candidate, { status: "ADOPTED", actor: ACTOR, mandate: MANDATE, timestamp: NOW });
    expect(adopted).toMatchObject({ decisionId: candidate.decisionId, version: 1, status: "ADOPTED", actor: ACTOR, mandate: MANDATE, timestamp: NOW });
    expect(auditHumanDecisionContract("adopted", adopted)).toEqual([]);
  });

  it("préserve une décision legacy sans reconstruire une identité absente", () => {
    const legacy = preserveLegacyHumanDecision({ decisionId: "legacy:1", gate: "LEGACY-GATE", decision: "APPROVED", targetIds: ["legacy-target"], decidedAt: NOW }, "RESEARCH_PROJECT");
    expect(legacy).toMatchObject({ decisionId: "legacy:1", status: "LEGACY_DECISION_IDENTITY_INCOMPLETE", actor: null, mandate: null });
    expect(legacy.provenance).toContain("LEGACY_DECISION_PRESERVED_WITHOUT_IDENTITY_RECONSTRUCTION");
  });
});

describe("SYS-001B — orchestration scientifique conditionnelle", () => {
  it("active Scientific Thinking avant Imaging pour le cas D", () => {
    const intent = makeSystemIntent(CASE_D, {
      scientificPurpose: ["comparer CT et IRM pour mesurer la fibrose myocardique"],
      phenomenaOfInterest: ["fibrose myocardique"], availableEquipment: ["CT", "IRM"],
    });
    expect(assessScientificReadiness(intent)).toMatchObject({
      status: "SCIENTIFIC_THINKING_REQUIRED", scientificThinkingRequired: true, imagingRequired: true, nextSurface: "SCIENTIFIC_THINKING",
    });
    expect(assessScientificReadiness(intent).reasons).toContain("IMAGING_OBSERVABLE_OR_BIOMARKER_MISSING");
  });

  it("autorise le passage direct à Imaging quand phénomène, observable et finalité sont déjà structurés", () => {
    const intent = makeSystemIntent("Je veux comparer l’ECV en CT et IRM chez des adultes pour quantifier la fibrose myocardique.", {
      scientificPurpose: ["comparer l’ECV"], phenomenaOfInterest: ["fibrose myocardique"], outcomesMentioned: ["ECV"],
      availableEquipment: ["CT", "IRM"], population: ["adultes"],
    });
    expect(assessScientificReadiness(intent)).toMatchObject({ status: "READY_FOR_NEXT_ENGINE", scientificThinkingRequired: false, nextSurface: "IMAGING" });
  });

  it("active Scientific Thinking pour une idée vague et conserve une contradiction ouverte", () => {
    const vague = makeSystemIntent("Je veux faire une étude sur la fibrose myocardique en imagerie.");
    expect(assessScientificReadiness(vague).scientificThinkingRequired).toBe(true);
    const contradictory = makeSystemIntent("Je veux construire une étude CT sans imagerie pour mesurer la fibrose myocardique.");
    contradictory.interpretation.contradictions = ["CT déclaré mais imagerie déclarée absente"];
    expect(assessScientificReadiness(contradictory).reasons).toContain("CONCEPTUAL_CONTRADICTION_OPEN");
  });
});

describe("SYS-001B — cas D probatoire de bout en bout", () => {
  const intent = makeSystemIntent(CASE_D, {
    scientificPurpose: ["comparer CT et IRM pour mesurer la fibrose myocardique"],
    phenomenaOfInterest: ["fibrose myocardique"], availableEquipment: ["CT", "IRM"],
  });

  it("exécute Intake → ST → Knowledge → Imaging sans inventer le biomarqueur", () => {
    const context = buildScientificSessionContext(intent);
    const thinking = authorizeSystemThinking(intent).session;
    expect(assessScientificReadiness(intent, thinking)).toMatchObject({ status: "READY_FOR_NEXT_ENGINE", nextSurface: "IMAGING" });
    const knowledge = makeSystemKnowledge(intent, "IMAGING_STUDY_DESIGNER");
    const imagingInput = buildImagingDesignInput(intent, context.preservedScientificTerms, context.detectedRelationships, knowledge, thinking, {
      sessionId: "SYS-001B-CASE-D", contextVersion: context.contextVersion, strategyVersion: "SYS-001B-IMG-1",
    });
    const imaging = createImagingDesignSession(imagingInput);
    expect(imaging.input.centralScientificObject).toContain("fibrose myocardique");
    expect(imaging.input.knowledge.concepts).toContainEqual(expect.objectContaining({ conceptId: "biomarker:ecv", resolutionKind: "DOCUMENT_BOUND_CONCEPT" }));
    expect(imaging.result.biomarkerCandidates).toContainEqual(expect.objectContaining({ conceptId: "biomarker:ecv", reviewState: "PENDING" }));
    expect(imaging.result.modalityCandidates.map((item) => item.conceptId)).toEqual(expect.arrayContaining(["modality:ct", "modality:mri"]));
    expect(imaging.result.modalityCandidates.every((item) => item.reviewState === "PENDING")).toBe(true);
    expect(imaging.input.knowledge.assertions.map((item) => item.sourceId)).toContain("p4r-ecv-t1");
  });

  it("bloque une porte Imaging sans mandat puis permet une décision complète", () => {
    let imaging = createImagingDesignSession(buildImagingDesignInput(
      intent,
      buildScientificSessionContext(intent).preservedScientificTerms,
      buildScientificSessionContext(intent).detectedRelationships,
      makeSystemKnowledge(intent, "IMAGING_STUDY_DESIGNER"),
      authorizeSystemThinking(intent).session,
      { sessionId: "SYS-001B-CASE-D", contextVersion: 1, strategyVersion: "SYS-001B-IMG-1" },
    ));
    const gate = imaging.result.decisionsRequired[0];
    imaging = decideImagingGate(imaging, gate.gateId, "APPROVED", "Décision probatoire.", ACTOR, null, NOW);
    expect(imaging.result.decisionsRequired.find((item) => item.gateId === gate.gateId)?.status).toBe("PENDING");
    expect(imaging.decisionHistory.find((item) => item.gateId === gate.gateId)?.status).toBe("INCOMPLETE_FOR_ADOPTION");
    imaging = decideImagingGate(imaging, gate.gateId, "APPROVED", "Décision probatoire.", ACTOR, MANDATE, NOW);
    expect(imaging.result.decisionsRequired.find((item) => item.gateId === gate.gateId)?.status).toBe("APPROVED");
  });

  it("transporte les mêmes enveloppes jusqu'au Protocol et versionne la réouverture", () => {
    let imaging = freezeSystemImaging(intent);
    const frozenDecision = imaging.decisionHistory.find((item) => ["IMG-GATE-ACQUISITION", "IMG-GATE-MULTICENTER", "IMG-GATE-HANDOFF-FREEZE"].includes(item.gateId) && item.status === "ADOPTED")!;
    imaging = requestImagingChange(imaging, { eventType: "EquipmentChanged", description: "Réouverture probatoire de l’équipement.", sourceIds: ["SITE-A"], targetIds: ["SITE-A"] });
    const change = imaging.result.changes.find((item) => item.eventType === "EquipmentChanged")!;
    imaging = decideImagingChange(imaging, change.changeId, "CONFIRMED", ACTOR, MANDATE, NOW);
    expect(imaging.decisionHistory).toContainEqual(frozenDecision);
    expect(imaging.decisionHistory).toContainEqual(expect.objectContaining({ decisionId: frozenDecision.decisionId, version: frozenDecision.version + 1, status: "REOPENED" }));

    const refrozen = freezeSystemImaging(intent);
    expect(refrozen.result.projectConstructionHandoff.blockedBy).toEqual([]);
    const project = authorizeSystemProject(intent, refrozen);
    const output = projectDocument({
      project: project.result, decisionRecords: project.decisionHistory, projectionType: "PROTOCOL", profile: "RESEARCH_PROTOCOL",
      usage: "SCIENTIFIC_REVIEW", audience: "RESEARCH_TEAM", requestedAt: NOW,
    });
    expect(project.result.candidateVersion.status).toBe("FROZEN_BY_HUMAN");
    expect(project.result.documentHandoff.status).toBe("AUTHORIZED");
    expect(output.ok).toBe(true);
    if (!output.ok) return;
    const source = project.decisionHistory.find((item) => item.engineSource === "SCIENTIFIC_THINKING" && item.status === "ADOPTED")!;
    expect(project.input.existingDecisionRecords).toContainEqual(source);
    expect(output.projection.humanDecisions).toContainEqual(source);
    expect(output.projection.source.projectVersion).toBe(project.result.candidateVersion.versionId);
  });
});
