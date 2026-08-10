import { describe, expect, it } from "vitest";
import { projectDocument } from "@/features/document-projection";
import { auditUnknownEquipmentProjection } from "../audit";
import { authorizeSystemProject, freezeSystemImaging, makeSystemIntent } from "./fixtures";

describe("SYS-001 — unknowns", () => {
  it("CAS E — UNKNOWN reste distinct de NOT_APPLICABLE, INCOMPATIBLE et READY", () => {
    const intent = makeSystemIntent("Je veux construire une étude comparant l’ECV et le T1 natif en IRM cardiaque pour étudier la fibrose myocardique.", {
      scientificPurpose: ["comparer deux mesures"], phenomenaOfInterest: ["fibrose myocardique"], outcomesMentioned: ["ECV", "T1 natif"], population: ["adultes"], declaredTimings: ["mesure initiale"],
    });
    const imaging = freezeSystemImaging(intent);
    expect(imaging.result.projectConstructionHandoff).toMatchObject({ status: "FROZEN_BY_HUMAN", equipmentCompatibilityStatus: "UNKNOWN", executableProtocolReadiness: "EXECUTABLE_PROTOCOL_NOT_READY" });
    const project = authorizeSystemProject(intent, imaging);
    expect(project.result.feasibilityAssessment.find((item) => item.domain === "TECHNICAL_FEASIBILITY")?.state).toBe("PARTIAL");
    expect(auditUnknownEquipmentProjection(project.result.imagingContribution)).toEqual([]);
    const output = projectDocument({ project: project.result, decisionRecords: project.decisionHistory, projectionType: "PROTOCOL", profile: "RESEARCH_PROTOCOL", usage: "SCIENTIFIC_REVIEW", audience: "RESEARCH_TEAM", requestedAt: "2026-08-10T18:30:00.000Z" });
    expect(output.ok).toBe(true);
    if (!output.ok) return;
    const imagingSection = output.projection.sections.find((item) => item.sectionId === "imaging")!;
    const values = imagingSection.blocks.flatMap((block) => block.items).join(" ");
    expect(values).toContain("UNKNOWN");
    expect(values).toContain("EXECUTABLE_PROTOCOL_NOT_READY");
  });
});
