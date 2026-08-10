import { describe, expect, it } from "vitest";
import { buildResearchProjectConstructionInput, createResearchProjectConstructionSession } from "@/features/research-project-construction";
import { authorizeSystemProject, authorizeSystemThinking, makeSystemIntent, makeSystemKnowledge } from "./fixtures";

describe("SYS-001 — engine availability", () => {
  it("CAS G — un projet sans Imaging continue avec NOT_APPLICABLE", () => {
    const intent = makeSystemIntent("Je veux construire une étude longitudinale sans imagerie sur un marqueur biologique.", {
      scientificPurpose: ["construire une étude"], population: ["adultes"], outcomesMentioned: ["marqueur biologique"],
    });
    const project = authorizeSystemProject(intent, null);
    expect(project.input.sourceHandoffs.imaging.status).toBe("NOT_APPLICABLE");
    expect(project.result.imagingContribution.applicability).toBe("NOT_APPLICABLE");
    expect(project.result.status).not.toBe("REFUSED");
  });

  it("ne simule pas Imaging lorsqu’il est requis mais indisponible", () => {
    const intent = makeSystemIntent("Je veux construire une étude en IRM cardiaque utilisant l’ECV.", { scientificPurpose: ["construire une étude"], outcomesMentioned: ["ECV"] });
    const thinking = authorizeSystemThinking(intent).session;
    const knowledge = makeSystemKnowledge(intent, "RESEARCH_PROJECT_CONSTRUCTION");
    const input = buildResearchProjectConstructionInput(intent, knowledge, thinking, null, { sessionId: "SYS-001", contextVersion: 1 });
    const project = createResearchProjectConstructionSession(input);
    expect(input.sourceHandoffs.imaging.status).toBe("REQUIRED_BUT_NOT_READY");
    expect(project.result.refusal?.code).toBe("IMAGING_HANDOFF_NOT_READY");
  });
});

