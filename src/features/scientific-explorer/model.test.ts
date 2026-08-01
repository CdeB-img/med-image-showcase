import { describe, expect, it } from "vitest";
import scientificExplorerData from "./scientific-explorer-data";
import {
  deriveExplorerView,
  EMPTY_EXPLORER_STATE,
  parseExplorerState,
  serializeExplorerState,
} from "./model";

describe("P12 local scientific query model", () => {
  it("starts from the general synthesis without an arbitrary preselection", () => {
    const state = parseExplorerState(new URLSearchParams(), scientificExplorerData);
    const view = deriveExplorerView(scientificExplorerData, state);
    expect(state).toEqual(EMPTY_EXPLORER_STATE);
    expect(view.isFiltered).toBe(false);
    expect(view.assertions).toHaveLength(scientificExplorerData.assertions.length);
    expect(view.synthesisLabel).toContain("État général");
  });

  it("serializes the complete facet state in a stable order and restores it", () => {
    const state = {
      conceptKey: "medical-image-segmentation",
      metricKey: "dice-similarity-coefficient",
      taskKey: "staple-consensus",
      evidenceTypeKey: "METHOD_VALIDATION",
    };
    const serialized = serializeExplorerState(state);
    expect(serialized.toString()).toBe("concept=medical-image-segmentation&metric=dice-similarity-coefficient&task=staple-consensus&evidence=METHOD_VALIDATION");
    expect(parseExplorerState(serialized, scientificExplorerData)).toEqual(state);
  });

  it("drops unknown URL values instead of creating fictional filters", () => {
    const state = parseExplorerState(new URLSearchParams("metric=fictional&task=staple-consensus&noise=1"), scientificExplorerData);
    expect(state.metricKey).toBeNull();
    expect(state.taskKey).toBe("staple-consensus");
  });

  it("recalculates assertions, proof, sources, limitations and missing data", () => {
    const general = deriveExplorerView(scientificExplorerData, EMPTY_EXPLORER_STATE);
    const dice = deriveExplorerView(scientificExplorerData, {
      ...EMPTY_EXPLORER_STATE,
      metricKey: "dice-similarity-coefficient",
    });
    expect(dice.assertions).toHaveLength(1);
    expect(dice.evidenceLinks).toHaveLength(1);
    expect(dice.sources).toHaveLength(1);
    expect(dice.limitations.map((item) => item.id)).toContain("SMALL_STRUCTURE_SENSITIVITY");
    expect(dice.missingData).not.toEqual(general.missingData);
    expect(dice.synthesisLabel).not.toBe(general.synthesisLabel);
  });

  it("keeps an explicit no-data state for an undocumented filter combination", () => {
    const view = deriveExplorerView(scientificExplorerData, {
      ...EMPTY_EXPLORER_STATE,
      metricKey: "dice-similarity-coefficient",
      taskKey: "staple-consensus",
    });
    expect(view.hasResults).toBe(false);
    expect(view.assertions).toEqual([]);
    expect(view.evidenceLinks).toEqual([]);
    expect(view.sources).toEqual([]);
    expect(view.missingData.map((item) => item.id)).toEqual(["NO_ASSERTION_FOR_FILTER_COMBINATION"]);
  });

  it("never promotes a MENTIONS link to scientific proof", () => {
    const mention = {
      ...scientificExplorerData.evidenceLinks[0],
      id: "synthetic-mention-for-query-test",
      relationType: "MENTIONS",
    };
    const data = {
      ...scientificExplorerData,
      evidenceLinks: [mention, ...scientificExplorerData.evidenceLinks.slice(1)],
    };
    const view = deriveExplorerView(data, EMPTY_EXPLORER_STATE);
    expect(view.evidenceLinks.some((link) => link.id === mention.id)).toBe(false);
    expect(view.mentionLinks.map((link) => link.id)).toContain(mention.id);
  });

  it("makes every exposed facet option discriminate the corpus", () => {
    for (const option of scientificExplorerData.facets.metrics) {
      expect(deriveExplorerView(scientificExplorerData, { ...EMPTY_EXPLORER_STATE, metricKey: option.key }).assertions.length)
        .toBeLessThan(scientificExplorerData.assertions.length);
    }
    for (const option of scientificExplorerData.facets.tasks) {
      expect(deriveExplorerView(scientificExplorerData, { ...EMPTY_EXPLORER_STATE, taskKey: option.key }).assertions.length)
        .toBeLessThan(scientificExplorerData.assertions.length);
    }
    for (const option of scientificExplorerData.facets.evidenceTypes) {
      expect(deriveExplorerView(scientificExplorerData, { ...EMPTY_EXPLORER_STATE, evidenceTypeKey: option.key }).assertions.length)
        .toBeLessThan(scientificExplorerData.assertions.length);
    }
  });
});
