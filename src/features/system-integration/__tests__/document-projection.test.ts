import { describe, expect, it } from "vitest";
import { projectDocument } from "@/features/document-projection";
import { authorizeSystemProject, makeSystemIntent } from "./fixtures";

describe("SYS-001 — document projection", () => {
  it("projette un vrai résultat Project non-Imaging sans inventer une section Imaging", () => {
    const intent = makeSystemIntent("Je veux construire une étude longitudinale sans imagerie sur un marqueur biologique.", {
      scientificPurpose: ["construire une étude"], population: ["adultes"], outcomesMentioned: ["marqueur biologique"],
    });
    const project = authorizeSystemProject(intent, null);
    const output = projectDocument({ project: project.result, decisionRecords: project.decisionHistory, projectionType: "PROTOCOL", profile: "RESEARCH_PROTOCOL", usage: "SCIENTIFIC_REVIEW", audience: "RESEARCH_TEAM", requestedAt: "2026-08-10T18:30:00.000Z" });
    expect(output.ok).toBe(true);
    if (!output.ok) return;
    expect(output.projection.source.projectDigest).toBe(project.result.resultDigest);
    expect(output.projection.boundary).toBe("READ_ONLY_PROJECTION_NOT_PROJECT_TRUTH_NOT_CLINICAL_PROTOCOL");
    expect(output.projection.sections.find((item) => item.sectionId === "imaging")?.applicability).toBe("NOT_APPLICABLE");
    expect(output.projection.sections.some((item) => item.status === "PARTIALLY_GENERATABLE")).toBe(true);
  });
});

