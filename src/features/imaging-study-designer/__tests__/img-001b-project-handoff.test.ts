import { describe, expect, it } from "vitest";
import { executeResearchProjectConstruction } from "@/features/research-project-construction/engine";
import { makeProjectInput } from "@/features/research-project-construction/__tests__/fixtures";
import {
  answerImagingQuestion,
  createImagingDesignSession,
  decideImagingChange,
  decideImagingGate,
  requestImagingChange,
} from "../session";
import type { ImagingDesignInput, ImagingDesignSession } from "../types";
import { makeImagingInput, withInput } from "./fixtures";
import {
  RC_TEST_02_GOVERNED_REFERENCE_REGISTRY,
  RC_TEST_02_REFERENCE_IDS,
  readGovernedFrozenImagingResult,
  readGovernedImagingInput,
  verifyGovernedImagingReference,
} from "./governed-reference-fixtures";

const LIVE_SYNTHETIC_HAEMATOCRIT_CONTRADICTION = "noxia:radiology:contradiction:ecv-t1:synthetic-hematocrit-transferability:p4r:CONTEXTUAL_DIFFERENCE:The findings should not be collapsed into one universal conclusion. They differ materially in field strength, local model and validation context.";

const freezeProjectHandoff = (input: ImagingDesignInput): ImagingDesignSession => {
  let session = createImagingDesignSession(input);
  for (let index = 0; index < 20; index += 1) {
    const question = session.result.adaptiveQuestions.find((item) => !item.answeredValue);
    if (!question) break;
    session = answerImagingQuestion(session, question.questionId, "UNKNOWN_EXPLICITLY_RECORDED");
  }
  for (let index = 0; index < 30; index += 1) {
    const gate = session.result.decisionsRequired.find((item) => item.status === "PENDING");
    if (!gate) break;
    const next = decideImagingGate(session, gate.gateId, "APPROVED", "Décision humaine IMG-001B explicitement tracée.", "Responsable Imaging", "mandate:img-001b", `2026-08-10T12:${String(index).padStart(2, "0")}:00.000Z`);
    if (next === session) break;
    session = next;
  }
  return session;
};

const strategyInput = (patch: Partial<ImagingDesignInput> = {}) => withInput(
  readGovernedImagingInput(RC_TEST_02_REFERENCE_IDS.narrowMrEcvHistology),
  patch,
);

const declaredSyntheticEquipment = (): ImagingDesignInput["declaredEquipment"] => [{
  equipmentId: "RC-TEST-02:DECLARED-SYNTHETIC-EQUIPMENT",
  siteLabel: "Site synthétique déclaré",
  modality: "IRM",
  manufacturer: "SYNTHETIC_TEST_VALUE",
  model: "SYNTHETIC_TEST_VALUE",
  fieldStrength: null,
  softwareVersion: "SYNTHETIC_TEST_VALUE",
  options: [],
  availability: "DECLARED_AVAILABLE",
  period: null,
  provenanceRef: "HUMAN_APPROVED_SYNTHETIC_TEST_CONTEXT",
}];

describe("IMG-001B — fermeture du handoff Imaging vers Research Project", () => {
  it("autorise un handoff de projet IRM avec équipement inconnu sans promouvoir sa compatibilité", () => {
    const input = strategyInput({ declaredEquipment: [] });
    const session = freezeProjectHandoff(input);
    const handoff = session.result.projectConstructionHandoff;

    expect(handoff.status).toBe("FROZEN_BY_HUMAN");
    expect(handoff.scientificStrategyStatus).toBe("SCIENTIFIC_STRATEGY_DEFINED");
    expect(handoff.projectHandoffReadiness).toBe("PROJECT_HANDOFF_READY");
    expect(handoff.equipmentCompatibilityStatus).toBe("UNKNOWN");
    expect(handoff.executableProtocolReadiness).toBe("EXECUTABLE_PROTOCOL_NOT_READY");
    expect(handoff.unknowns.length).toBeGreaterThan(0);
    expect(handoff.blockedBy).not.toContain("UNKNOWN_MANUFACTURER_DEPENDENCY");

    const project = executeResearchProjectConstruction(makeProjectInput({ imagingResult: session.result }));
    expect(project.imagingContribution.applicability).toBe("APPLICABLE");
    expect(project.imagingContribution.equipmentCompatibilityStatus).toBe("UNKNOWN");
    expect(project.feasibilityAssessment.find((item) => item.domain === "TECHNICAL_FEASIBILITY")?.state).toBe("PARTIAL");
  });

  it("distingue disponibilité déclarée et disponibilité vérifiée sans inventer la compatibilité", () => {
    const declaredEquipment = declaredSyntheticEquipment();
    const declared = freezeProjectHandoff(strategyInput({ declaredEquipment }));
    expect(declared.result.projectConstructionHandoff.equipmentCompatibilityStatus).toBe("DECLARED_NOT_VERIFIED");
    expect(declared.result.projectConstructionHandoff.limitations).toContain("EQUIPMENT_AVAILABILITY_DECLARED_NOT_VERIFIED");

    const verifiedEquipment = declaredEquipment.map((item) => ({
      ...item,
      availability: "KNOWN_AVAILABLE" as const,
    }));
    const verified = freezeProjectHandoff(strategyInput({ declaredEquipment: verifiedEquipment }));
    expect(verified.result.equipmentAssessment.every((item) => item.availabilityEvidenceStatus === "VERIFIED")).toBe(true);
    expect(verified.result.projectConstructionHandoff.equipmentCompatibilityStatus).toBe("VERIFIED_AVAILABILITY_COMPATIBILITY_UNCONFIRMED");
    expect(verified.result.equipmentAssessment.every((item) => item.compatibility === "UNKNOWN_COMPATIBILITY")).toBe(true);
  });

  it("bloque le gel lorsqu'une incompatibilité explicite rend l'acquisition nécessaire impossible", () => {
    const base = strategyInput({ declaredEquipment: declaredSyntheticEquipment() });
    const incompatible = base.declaredEquipment.map((item) => ({ ...item, modality: "CT", availability: "KNOWN_AVAILABLE" as const }));
    const session = freezeProjectHandoff(withInput(base, { declaredEquipment: incompatible }));

    expect(session.result.projectConstructionHandoff.status).toBe("NOT_READY");
    expect(session.result.projectConstructionHandoff.equipmentCompatibilityStatus).toBe("INCOMPATIBLE");
    expect(session.result.projectConstructionHandoff.blockedBy).toContain("EQUIPMENT_INCOMPATIBLE_WITH_REQUIRED_MODALITY");
    expect(session.result.projectConstructionHandoff.projectHandoffReadiness).toBe("PROJECT_HANDOFF_BLOCKED");
  });

  it("autorise un multicentrique partiellement connu avec limites et revue d'harmonisation future", () => {
    const session = freezeProjectHandoff(readGovernedImagingInput(RC_TEST_02_REFERENCE_IDS.multicenterPartialEquipment));

    expect(session.result.projectConstructionHandoff.status).toBe("FROZEN_BY_HUMAN");
    expect(session.result.projectConstructionHandoff.equipmentCompatibilityStatus).toBe("PARTIALLY_KNOWN");
    expect(session.result.projectConstructionHandoff.limitations).toContain("MULTICENTER_TECHNICAL_FEASIBILITY_PARTIAL");
    expect(session.result.projectConstructionHandoff.requiredFutureReviews).toContain("MULTICENTER_HARMONIZATION_REVIEW");
    expect(session.input.declaredEquipment[0]).toMatchObject({ siteLabel: "Centre A — synthetic governed test entity", availability: "KNOWN_AVAILABLE", manufacturer: "SYNTHETIC_TEST_VALUE" });
    expect(session.input.declaredEquipment[1]).toMatchObject({ siteLabel: "Centre B — synthetic governed test entity", availability: "UNKNOWN", manufacturer: null, model: null, softwareVersion: null });
  });

  it("refuse les paramètres exacts tout en permettant le handoff de la stratégie conceptuelle", () => {
    const base = strategyInput();
    const session = freezeProjectHandoff(withInput(base, { originalExpression: `${base.originalExpression} Fournir TR, TE, résolution et paramètres constructeur exacts.` }));

    expect(session.result.projectConstructionHandoff.status).toBe("FROZEN_BY_HUMAN");
    expect(session.result.projectConstructionHandoff.executableProtocolReadiness).toBe("EXECUTABLE_PROTOCOL_NOT_READY");
    expect(session.result.acquisitionStrategies.every((item) => item.level3.status === "NOT_GENERATABLE_WITH_CURRENT_EXECUTABLE_KNOWLEDGE")).toBe(true);
    expect(JSON.stringify(session.result.acquisitionStrategies)).not.toMatch(/TR\s*[:=]\s*\d|TE\s*[:=]\s*\d/i);
  });

  it("interdit le gel tant que les décisions humaines structurantes manquent", () => {
    const session = createImagingDesignSession(strategyInput({ declaredEquipment: [] }));
    expect(session.result.projectConstructionHandoff.status).toBe("NOT_READY");
    expect(session.result.projectConstructionHandoff.blockedBy).toContain("IMG-GATE-BIOMARKER");
    expect(session.result.projectConstructionHandoff.humanDecision.status).toBe("PENDING");
  });

  it("préserve la version gelée et impose une requalification ciblée après changement d'équipement", () => {
    let session = freezeProjectHandoff(strategyInput({ declaredEquipment: declaredSyntheticEquipment() }));
    const frozenVersion = session.result.projectConstructionHandoff.imagingStrategyVersion;
    session = requestImagingChange(session, { eventType: "EquipmentChanged", description: "Remplacement de l'équipement du site principal.", sourceIds: ["SITE-A"], targetIds: ["SITE-A"] });
    const change = session.result.changes.find((item) => item.eventType === "EquipmentChanged")!;
    expect(change.kind).toBe("MAJOR");
    expect(change.status).toBe("PENDING_CONFIRMATION");
    expect(session.result.projectConstructionHandoff.status).toBe("FROZEN_BY_HUMAN");

    session = decideImagingChange(session, change.changeId, "CONFIRMED", "Responsable Imaging", "mandate:img-001b");
    expect(session.result.projectConstructionHandoff.status).not.toBe("FROZEN_BY_HUMAN");
    expect(session.handoffHistory.map((item) => item.imagingStrategyVersion)).toContain(frozenVersion);
    expect(session.result.impacts.some((item) => item.changeId === change.changeId && item.state === "REVIEW_REQUIRED")).toBe(true);
    expect(session.result.decisionsRequired.find((item) => item.gateId === "IMG-GATE-HANDOFF-FREEZE")?.status).toBe("PENDING");
  });

  it("préserve le parcours PRJ sans Imaging", () => {
    const project = executeResearchProjectConstruction(makeProjectInput({ imagingResult: null, imagingStatus: "NOT_APPLICABLE" }));
    expect(project.imagingContribution.applicability).toBe("NOT_APPLICABLE");
    expect(project.refusal).toBeNull();
    expect(project.feasibilityAssessment.find((item) => item.domain === "TECHNICAL_FEASIBILITY")?.state).toBe("NOT_APPLICABLE");
  });

  it("LIVE — conserve la contradiction Knowledge/ST existante et interdit le gel Imaging", () => {
    const input = makeImagingInput({ timings: ["temps méthodologique déclaré"] });
    expect(input.contradictions).toContain(LIVE_SYNTHETIC_HAEMATOCRIT_CONTRADICTION);

    const session = freezeProjectHandoff(input);
    expect(session.result.contradictions).toContain(LIVE_SYNTHETIC_HAEMATOCRIT_CONTRADICTION);
    expect(session.result.projectConstructionHandoff.status).toBe("NOT_READY");
    expect(session.result.projectConstructionHandoff.blockedBy).toContain("UNRESOLVED_STRUCTURAL_CONTRADICTION");
    expect(session.result.projectConstructionHandoff.humanDecision.status).toBe("PENDING");
  });

  it("relit les références gouvernées avec une identité, un digest et une immutabilité stables", () => {
    Object.values(RC_TEST_02_REFERENCE_IDS).forEach((referenceId) => {
      const first = readGovernedFrozenImagingResult(referenceId);
      const second = readGovernedFrozenImagingResult(referenceId);
      expect(first).toEqual(second);
      expect(first).not.toBe(second);
      expect(Object.isFrozen(first)).toBe(true);
      expect(first.resultId).toBe(RC_TEST_02_GOVERNED_REFERENCE_REGISTRY[referenceId].sourceResultId);
      expect(Object.values(verifyGovernedImagingReference(referenceId)).every(Boolean)).toBe(true);
    });
  });
});
