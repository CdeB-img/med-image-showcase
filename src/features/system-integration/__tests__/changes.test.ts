import { describe, expect, it } from "vitest";
import { assessQuestionChange } from "@/features/protocol-designer/intake/journey";
import { IMAGING_CHANGE_EVENTS, propagateImagingImpact } from "@/features/imaging-study-designer/change";
import { propagateProjectImpact } from "@/features/research-project-construction/change";

describe("SYS-001 — changes", () => {
  it("qualifie QuestionChanged avant invalidation aval", () => {
    expect(assessQuestionChange("Étudier l’ECV en IRM cardiaque.", "Étudier la perfusion cérébrale en CT.")).toMatchObject({ kind: "MAJOR" });
  });

  it("propage les changements Imaging vers les seuls types atteints", () => {
    const inventory = ["ACQUISITION", "QUALITY_CONTROL", "IMAGE_ANALYSIS", "VARIABLE", "ENDPOINT_CONTRIBUTION", "HARMONIZATION", "NON_EVALUABILITY"].map((targetType) => ({ targetId: targetType, targetType }));
    IMAGING_CHANGE_EVENTS.forEach((eventType) => {
      const propagated = propagateImagingImpact({ eventType, description: eventType, sourceIds: ["source"], targetIds: [] }, inventory);
      expect(propagated.impacts).toHaveLength(inventory.length);
      expect(propagated.impacts.every((item) => ["REVIEW_REQUIRED", "PRESERVED"].includes(item.state))).toBe(true);
    });
  });

  it.each(["PopulationChanged", "EndpointChanged", "TimingChanged"] as const)("rend les projections obsolètes pour %s", (eventType) => {
    const { change, impacts } = propagateProjectImpact({ eventType, description: eventType, sourceIds: ["source"] }, [{ targetId: "projection:Protocol", targetType: "PROJECTION" }]);
    expect(change.status).toBe("PENDING_CONFIRMATION");
    expect(impacts[0].state).toBe("OBSOLETE");
  });
});

