import { describe, expect, it } from "vitest";
import { executeKnowledgeEngine } from "@/features/knowledge-engine";
import { renderProjection } from "@/features/document-projection";
import { projectDocument } from "@/features/document-projection";
import { authorizeSystemProject, makeSystemIntent } from "./fixtures";

describe("SYS-001 — regression and replay", () => {
  it("rejoue Knowledge à contenu identique pour le même contexte et la même version", () => {
    const input = { originalQuestion: "Comparer CT cardiaque et IRM cardiaque pour étudier la fibrose myocardique.", createdAt: "2026-08-10T16:00:00.000Z", strategyVersion: "SYS-1" };
    const first = executeKnowledgeEngine(input);
    const second = executeKnowledgeEngine(input);
    expect(second.resultDigest).toBe(first.resultDigest);
    expect(second.resolvedConcepts).toEqual(first.resolvedConcepts);
    expect(second.request.requestType).toBe("COMPARE");
  });

  it("un changement de renderer ne modifie ni la projection ni sa source", () => {
    const intent = makeSystemIntent("Je veux construire une étude longitudinale sans imagerie sur un marqueur biologique.", { scientificPurpose: ["construire une étude"], population: ["adultes"], outcomesMentioned: ["marqueur biologique"] });
    const project = authorizeSystemProject(intent, null);
    const output = projectDocument({ project: project.result, decisionRecords: project.decisionHistory, projectionType: "PROTOCOL", profile: "RESEARCH_PROTOCOL", usage: "SCIENTIFIC_REVIEW", audience: "RESEARCH_TEAM", requestedAt: "2026-08-10T18:30:00.000Z" });
    expect(output.ok).toBe(true);
    if (!output.ok) return;
    const digest = output.projection.projectionDigest;
    expect(renderProjection(output.projection, "MARKDOWN").content).not.toBe(renderProjection(output.projection, "HTML").content);
    expect(output.projection.projectionDigest).toBe(digest);
    expect(output.projection.source.projectDigest).toBe(project.result.resultDigest);
  });
});

