import { describe, expect, it } from "vitest";
import { projectDocument } from "@/features/document-projection";
import { authorizeProject } from "@/features/document-projection/__tests__/fixtures";
import { RC_TEST_02_REFERENCE_IDS, readGovernedImagingReferenceResult } from "@/features/imaging-study-designer/__tests__/governed-reference-fixtures";
import { makeProjectInput } from "@/features/research-project-construction/__tests__/fixtures";
import { auditUnknownEquipmentProjection } from "../audit";

describe("SYS-001 — unknowns", () => {
  it("CAS E — UNKNOWN reste distinct de NOT_APPLICABLE, INCOMPATIBLE et READY", () => {
    const imaging = readGovernedImagingReferenceResult(RC_TEST_02_REFERENCE_IDS.narrowMrEcvHistology);
    const frozenImagingBeforeDownstreamUse = structuredClone(imaging);
    expect(imaging.projectConstructionHandoff).toMatchObject({ status: "FROZEN_BY_HUMAN", equipmentCompatibilityStatus: "UNKNOWN", executableProtocolReadiness: "EXECUTABLE_PROTOCOL_NOT_READY" });
    expect(imaging.equipmentAssessment.every((item) => item.availability === "UNKNOWN" && item.compatibility === "UNKNOWN_COMPATIBILITY")).toBe(true);
    const project = authorizeProject(makeProjectInput({
      question: "Dans le sous-ensemble de transplantation décrit, comment l’ECV IRM est-elle associée à l’espace extracellulaire histologique ?",
      outcomes: ["association bornée entre ECV IRM et espace extracellulaire histologique"],
      population: ["sous-ensemble sélectionné de transplantation décrit par la source"],
      pathology: ["UNKNOWN"],
      imagingResult: imaging,
      imagingStatus: "FROZEN_BY_HUMAN",
    }));
    expect(project.result.feasibilityAssessment.find((item) => item.domain === "TECHNICAL_FEASIBILITY")?.state).toBe("PARTIAL");
    expect(auditUnknownEquipmentProjection(project.result.imagingContribution)).toEqual([]);
    const output = projectDocument({ project: project.result, decisionRecords: project.decisionHistory, projectionType: "PROTOCOL", profile: "RESEARCH_PROTOCOL", usage: "SCIENTIFIC_REVIEW", audience: "RESEARCH_TEAM", requestedAt: "2026-08-10T18:30:00.000Z" });
    expect(output.ok).toBe(true);
    if (!output.ok) return;
    const imagingSection = output.projection.sections.find((item) => item.sectionId === "imaging")!;
    const values = imagingSection.blocks.flatMap((block) => block.items).join(" ");
    expect(values).toContain("UNKNOWN");
    expect(values).toContain("EXECUTABLE_PROTOCOL_NOT_READY");
    expect(imaging).toEqual(frozenImagingBeforeDownstreamUse);
    expect(Object.isFrozen(imaging)).toBe(true);
  });
});
