import { describe, expect, it } from "vitest";
import { stableStringify } from "../migration/stable-json.mjs";
import { p6ScientificKnowledgeCatalog, scientificKnowledgeCatalog } from "../knowledge-catalog/catalog-builder.mjs";
import { automaticCampaignExecutionTrace, createAutomaticCampaignExecutionTrace, selectFirstUnexecutedScientificCampaign } from "./execution.mjs";
import {
  AUTOMATIC_CAMPAIGN_ID,
  AUTOMATIC_CAMPAIGN_NODE_ID,
  hepaticConceptByKey,
  hepaticImagingAssertionRevisions,
  hepaticImagingCampaignExecution,
  hepaticImagingContextDifferences,
  hepaticImagingEvidenceLinks,
  hepaticImagingInternalProjections,
  hepaticImagingReviewDecisions,
  hepaticImagingScientificSyntheses,
  hepaticImagingSourceRevisions,
} from "./hepatic-imaging.mjs";
import { validateAutomaticScientificCampaign } from "./validate.mjs";

describe("first catalog-driven scientific campaign", () => {
  it("selects the first unexecuted P6 campaign without manual domain choice", () => {
    const selected = selectFirstUnexecutedScientificCampaign();
    expect(selected).toEqual(p6ScientificKnowledgeCatalog.campaigns[0]);
    expect(selected).toMatchObject({
      campaignId: AUTOMATIC_CAMPAIGN_ID,
      nodeIds: [AUTOMATIC_CAMPAIGN_NODE_ID],
      selectionRule: { manualDomainSelection: false },
      publicationAuthorized: false,
    });
  });

  it("retains five official full-text sources and no unsupported source", () => {
    expect(hepaticImagingSourceRevisions).toHaveLength(5);
    expect(hepaticImagingSourceRevisions.every((source) => source.pmcid && !source.abstractOnly && source.fullTextAvailability === "OFFICIAL_FULL_TEXT")).toBe(true);
    expect(new Set(hepaticImagingSourceRevisions.map((source) => source.pmid)).size).toBe(5);
    expect(new Set(hepaticImagingSourceRevisions.map((source) => source.doi)).size).toBe(5);
  });

  it("keeps acquisition, measurement, biomarker, observation and quality roles distinct", () => {
    expect(hepaticConceptByKey["multiphase-hepatic-imaging"].ontologicalClass).toBe("AcquisitionMethod");
    expect(hepaticConceptByKey["hepatic-pdff"].roles).toEqual(["DerivedMeasurement", "Biomarker"]);
    expect(hepaticConceptByKey["hepatic-observation"].ontologicalClass).toBe("Observation");
    expect(hepaticConceptByKey["liver-mre-repeatability"].ontologicalClass).toBe("QualityMetric");
    expect(hepaticConceptByKey["signal-fat-fraction"].stableId).not.toBe(hepaticConceptByKey["hepatic-pdff"].stableId);
  });

  it("creates only atomic, localized and automatically reviewed assertions", () => {
    expect(hepaticImagingAssertionRevisions).toHaveLength(22);
    expect(hepaticImagingEvidenceLinks).toHaveLength(22);
    expect(hepaticImagingReviewDecisions).toHaveLength(22);
    for (const assertion of hepaticImagingAssertionRevisions) {
      expect(assertion.statement.atomicConclusionCount).toBe(1);
      expect(assertion.humanReviewed).toBe(false);
      expect(assertion.scientificHumanReview).toBeNull();
      expect(hepaticImagingEvidenceLinks.some((link) => link.assertionRevisionId === assertion.revisionId && /^PMC\d+ — /.test(link.locator))).toBe(true);
    }
  });

  it("does not promote an author position into official consensus", () => {
    const authorPosition = hepaticImagingAssertionRevisions.filter((assertion) => assertion.scientificMaturity === "AUTHOR_POSITION");
    expect(authorPosition).toHaveLength(3);
    expect(authorPosition.every((assertion) => assertion.predicate !== "IS_OFFICIAL_CONSENSUS")).toBe(true);
    expect(hepaticImagingScientificSyntheses.every((synthesis) => synthesis.consensus.detected === false)).toBe(true);
  });

  it("preserves limitations and contextual differences without artificial resolution", () => {
    expect(hepaticImagingEvidenceLinks.filter((link) => link.relationType === "QUALIFIES")).toHaveLength(9);
    expect(hepaticImagingContextDifferences.map((item) => item.classification).sort()).toEqual(["CONTEXT_DIFFERENCE", "DEFINITION_DIFFERENCE"]);
    expect(hepaticImagingContextDifferences.every((item) => item.resolutionApplied === false)).toBe(true);
  });

  it("separates repeatability from unestablished cross-platform reproducibility", () => {
    const repeatability = hepaticImagingAssertionRevisions.find((assertion) => assertion.stableId.endsWith(":mre-repeatability-22-percent"));
    const reproducibility = hepaticImagingAssertionRevisions.find((assertion) => assertion.stableId.endsWith(":mre-cross-platform-reproducibility-open"));
    expect(repeatability.literalValue).toEqual({ value: 22, unit: "%" });
    expect(reproducibility.assertionType).toBe("NegativeAssertion");
    expect(reproducibility.limitations).toContain("CROSS_VENDOR_REPRODUCIBILITY_INSUFFICIENT");
  });

  it("creates deterministic internal syntheses and guarded projections only", () => {
    expect(hepaticImagingScientificSyntheses).toHaveLength(5);
    expect(hepaticImagingInternalProjections).toHaveLength(4);
    expect(hepaticImagingScientificSyntheses.every((synthesis) => !synthesis.generatedEditorialText && !synthesis.statisticalMetaAnalysisPerformed && synthesis.prose === null)).toBe(true);
    expect(hepaticImagingInternalProjections.every((projection) => projection.internalOnly && !projection.indexable && !projection.inSitemap && !projection.rendered && projection.route === null && projection.canonical === null)).toBe(true);
  });

  it("recalculates coverage and removes only the executed campaign from the queue", () => {
    const node = scientificKnowledgeCatalog.nodes.find((item) => item.nodeId === AUTOMATIC_CAMPAIGN_NODE_ID);
    expect(node).toMatchObject({
      status: "PROJECTED",
      sourceCoverage: { ratio: 1, count: 5, target: 5 },
      assertionCoverage: { ratio: 1, count: 22, target: 12 },
      readiness: {
        scientificReady: { ready: true },
        provenanceReady: { ready: true },
        synthesisReady: { ready: true },
        editorialProjectionReady: { ready: true },
        seoReady: { ready: false },
        publicPublicationReady: { ready: false },
      },
    });
    expect(scientificKnowledgeCatalog.campaigns).toHaveLength(9);
    expect(scientificKnowledgeCatalog.campaigns.some((campaign) => campaign.campaignId === AUTOMATIC_CAMPAIGN_ID)).toBe(false);
    expect(hepaticImagingCampaignExecution.nextCampaignStarted).toBe(false);
  });

  it("builds an immutable deterministic before-selection-after trace", () => {
    expect(createAutomaticCampaignExecutionTrace()).toEqual(automaticCampaignExecutionTrace);
    expect(automaticCampaignExecutionTrace.before.catalogDigest).toBe(p6ScientificKnowledgeCatalog.digest);
    expect(automaticCampaignExecutionTrace.after.catalogDigest).toBe(scientificKnowledgeCatalog.digest);
    expect(automaticCampaignExecutionTrace.selection.selectionRule.manualDomainSelection).toBe(false);
    expect(automaticCampaignExecutionTrace.after.nextCampaignStarted).toBe(false);
    expect(stableStringify(createAutomaticCampaignExecutionTrace())).toBe(stableStringify(automaticCampaignExecutionTrace));
  });

  it("passes the complete campaign validator without inspecting Git", () => {
    const validation = validateAutomaticScientificCampaign({ inspectGit: false });
    expect(validation.valid, stableStringify(validation.errors)).toBe(true);
    expect(validation.errors).toEqual([]);
  });
});

