import { describe, expect, it } from "vitest";
import { projectDocument } from "@/features/document-projection";
import { auditHumanDecisionContract } from "../audit";
import { authorizeSystemProject, authorizeSystemThinking, freezeSystemImaging, makeSystemIntent } from "./fixtures";

describe("SYS-001 — human decisions", () => {
  const intent = makeSystemIntent("Je veux construire une étude comparant l’ECV et le T1 natif en IRM cardiaque pour étudier la fibrose myocardique.", {
    scientificPurpose: ["comparer deux mesures"], phenomenaOfInterest: ["fibrose myocardique"], outcomesMentioned: ["ECV", "T1 natif"], population: ["adultes"], declaredTimings: ["mesure initiale"],
  });

  it("détecte explicitement le contrat incomplet dans ST et IMG", () => {
    const thinking = authorizeSystemThinking(intent).session;
    const imaging = freezeSystemImaging(intent);
    expect(auditHumanDecisionContract("Scientific Thinking", thinking.decisionHistory[0])[0]?.missingFields).toEqual(expect.arrayContaining(["actor", "mandate", "scope", "status", "version", "timestamp", "impact"]));
    expect(auditHumanDecisionContract("Imaging", imaging.decisionHistory[0])[0]?.missingFields).toEqual(expect.arrayContaining(["actor", "mandate", "scope", "status", "version", "timestamp", "impact"]));
  });

  it("transporte dans DOC les champs disponibles de la décision Project avec la même identité", () => {
    const imaging = freezeSystemImaging(intent);
    const project = authorizeSystemProject(intent, imaging);
    const output = projectDocument({ project: project.result, decisionRecords: project.decisionHistory, projectionType: "PROTOCOL", profile: "RESEARCH_PROTOCOL", usage: "SCIENTIFIC_REVIEW", audience: "RESEARCH_TEAM", requestedAt: "2026-08-10T18:30:00.000Z" });
    expect(output.ok).toBe(true);
    if (!output.ok) return;
    const sourceDecision = project.decisionHistory.find((item) => item.decision === "APPROVED")!;
    const projected = output.projection.humanDecisions.find((item) => item.decisionId === sourceDecision.decisionId)!;
    expect(projected).toMatchObject({ actor: sourceDecision.actor, mandate: sourceDecision.mandateRef, version: project.result.candidateVersion.versionId, timestamp: sourceDecision.decidedAt });
    expect(projected.scope).toEqual(sourceDecision.targetIds);
  });
});
