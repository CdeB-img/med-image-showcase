import { describe, expect, it } from "vitest";
import {
  buildScientificExplorerProjection,
  selectScientificExplorerPilot,
} from "./build-projection.mjs";

const readyNode = (nodeId) => ({
  nodeId,
  nodeType: "Domain",
  children: [],
  metrics: {
    assertionCount: 12,
    scientificSourceCount: 5,
    fullTextSourceCount: 5,
    synthesisCount: 1,
    projectionCount: 1,
  },
  assertionCoverage: { ratio: 1 },
  sourceCoverage: { ratio: 1 },
  readiness: {
    editorialProjectionReady: { ready: true },
    provenanceReady: { ready: true },
    scientificReady: { ready: true },
    synthesisReady: { ready: true },
  },
});

describe("P12 scientific explorer materialized projection", () => {
  it("selects the pilot deterministically and uses segmentation as the documented tie-break", () => {
    const selected = selectScientificExplorerPilot([
      readyNode("noxia:knowledge-catalog:domain:quality-control"),
      readyNode("noxia:knowledge-catalog:domain:segmentation"),
    ]);
    expect(selected.node.nodeId).toBe("noxia:knowledge-catalog:domain:segmentation");
    expect(selected.score).toBe(100);
  });

  it("rebuilds a compact byte-stable pilot from official registries", () => {
    const first = buildScientificExplorerProjection();
    const second = buildScientificExplorerProjection();

    expect(first).toEqual(second);
    expect(first.digest).toBe(second.digest);
    expect(first.selectedDomain.key).toBe("segmentation");
    expect(first.assertions).toHaveLength(12);
    expect(first.evidenceLinks).toHaveLength(12);
    expect(first.sources).toHaveLength(5);
    expect(first.defaultConceptKey).toBeNull();
    expect(first.illustration).toBeNull();
    expect(first.safeguards).toMatchObject({
      sourceOfTruth: "SCIENTIFIC_KNOWLEDGE_GRAPH",
      mentionsAreEvidence: false,
      humanScientificReviewPerformed: false,
      publicPublicationReady: false,
    });
  });

  it("materializes only useful non-empty facets and no non-discriminating modality", () => {
    const projection = buildScientificExplorerProjection();
    expect(projection.facets.metrics.length).toBeGreaterThan(0);
    expect(projection.facets.tasks.length).toBeGreaterThan(0);
    expect(projection.facets.evidenceTypes.length).toBeGreaterThan(0);
    expect(projection.facets).not.toHaveProperty("modalities");

    for (const options of Object.values(projection.facets)) {
      for (const option of options) {
        expect(option.assertionCount).toBeGreaterThan(0);
        expect(option.assertionCount).toBeLessThan(projection.assertions.length);
      }
    }
  });
});
