import { describe, expect, it } from "vitest";
import { decideProjectChange, requestProjectChange } from "@/features/research-project-construction";
import { freezeSnapshot } from "../audit";
import { authorizeSystemProject, makeSystemIntent } from "./fixtures";

describe("SYS-001 — versions", () => {
  it("conserve la version gelée quand une modification majeure crée une nouvelle révision", () => {
    const intent = makeSystemIntent("Je veux construire une étude longitudinale sans imagerie sur un marqueur biologique.", {
      scientificPurpose: ["construire une étude longitudinale"], population: ["adultes"], outcomesMentioned: ["marqueur biologique"],
    });
    let session = authorizeSystemProject(intent, null);
    const frozen = structuredClone(session.result.candidateVersion);
    const before = freezeSnapshot(frozen);
    session = requestProjectChange(session, { eventType: "PopulationChanged", description: "Population élargie.", sourceIds: [frozen.versionId] });
    const change = session.result.impactGraph.changes.at(-1)!;
    session = decideProjectChange(session, change.changeId, "CONFIRMED", "Responsable scientifique SYS-001", "mandate:sys-001");
    expect(freezeSnapshot(frozen)).toBe(before);
    expect(session.result.candidateVersion.versionId).not.toBe(frozen.versionId);
    expect(session.versionHistory.some((item) => item.versionId === frozen.versionId)).toBe(true);
  });
});
