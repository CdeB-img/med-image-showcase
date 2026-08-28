import { describe, expect, it } from "vitest";
import { projectDocument } from "@/features/document-projection";
import { makeAuthorizedProject } from "@/features/document-projection/__tests__/fixtures";
import { auditHumanDecisionContract } from "../audit";
import { authorizeSystemThinking, createSystemImaging, makeSystemIntent } from "./fixtures";

describe("SYS-001 — human decisions", () => {
  const intent = makeSystemIntent("Je veux construire une étude comparant l’ECV et le T1 natif en IRM cardiaque pour étudier la fibrose myocardique.", {
    scientificPurpose: ["comparer deux mesures"], phenomenaOfInterest: ["fibrose myocardique"], outcomesMentioned: ["ECV", "T1 natif"], population: ["adultes"], declaredTimings: ["mesure initiale"],
  });

  it("accepte une porte candidate complète sans acteur ni mandat attribués", () => {
    const thinking = authorizeSystemThinking(intent).session;
    const imaging = createSystemImaging(intent);
    const thinkingCandidate = thinking.decisionHistory.find((item) => item.status === "PENDING")!;
    const imagingCandidate = imaging.decisionHistory.find((item) => item.status === "PENDING")!;
    expect(auditHumanDecisionContract("Scientific Thinking", thinkingCandidate)).toEqual([]);
    expect(auditHumanDecisionContract("Imaging", imagingCandidate)).toEqual([]);
  });

  it("transporte dans DOC les champs disponibles de la décision Project avec la même identité", () => {
    const project = makeAuthorizedProject();
    const output = projectDocument({ project: project.result, decisionRecords: project.decisionHistory, projectionType: "PROTOCOL", profile: "RESEARCH_PROTOCOL", usage: "SCIENTIFIC_REVIEW", audience: "RESEARCH_TEAM", requestedAt: "2026-08-10T18:30:00.000Z" });
    expect(output.ok).toBe(true);
    if (!output.ok) return;
    const sourceDecision = project.decisionHistory.find((item) => item.engineSource === "RESEARCH_PROJECT" && item.status === "ADOPTED")!;
    const projected = output.projection.humanDecisions.find((item) => item.decisionId === sourceDecision.decisionId && item.version === sourceDecision.version)!;
    expect(projected).toEqual(sourceDecision);
  });
});
