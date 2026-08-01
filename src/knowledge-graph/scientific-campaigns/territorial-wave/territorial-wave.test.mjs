import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import p10Bundle from "../continuous-wave/execution-bundle.json" with { type: "json" };
import { scientificKnowledgeCatalog } from "../../knowledge-catalog/catalog-builder.mjs";
import { stableStringify } from "../../migration/stable-json.mjs";
import { P10_PREPARED_FILE_SHA256 } from "../continuous-wave/constants.mjs";
import { buildP11ExecutionBundle } from "./execution.mjs";
import { officialP11ExecutionBundle } from "./official-corpus.mjs";
import { P11_PUBLICATION_GUARDS } from "./constants.mjs";
import {
  validateP11Candidates,
  validateP11ContinuousTerritorialProduction,
  validateP11CoverageAndReadiness,
  validateP11Execution,
  validateP11PreparedWave,
  validateP11SequentialSelection,
  validateP11SourceAudits,
} from "./validate.mjs";

const root = process.cwd();
const clone = (value) => structuredClone(value);
const codes = (validation) => validation.errors.map((error) => error.code);
let rebuilt;
let validation;

beforeAll(async () => {
  rebuilt = await buildP11ExecutionBundle({ root });
  validation = validateP11ContinuousTerritorialProduction({ bundle: officialP11ExecutionBundle, p10Bundle, root, inspectGit: false });
});

describe("P11 continuous territory-driven scientific production", () => {
  it("starts from the exact validated P10 catalog and Territory digests", () => {
    expect(officialP11ExecutionBundle.initialSnapshot.catalog).toEqual(p10Bundle.postSnapshot.catalog);
    expect(officialP11ExecutionBundle.territory.digest).toBe(p10Bundle.territory.digest);
    expect(officialP11ExecutionBundle.territory.mutated).toBe(false);
  });

  it("preserves the prepared file byte-for-byte and requalifies all 282 objects", () => {
    const source = readFileSync(resolve(root, "src/knowledge-graph/scientific-campaigns/continuous-wave/data.mjs"));
    expect(createHash("sha256").update(source).digest("hex")).toBe(P10_PREPARED_FILE_SHA256);
    const result = validateP11PreparedWave({ bundle: officialP11ExecutionBundle });
    expect(result.valid, stableStringify(result.errors)).toBe(true);
    expect(result.counts).toMatchObject({ total: 282, deferred: 0, rejected: 5, integrated: 261 });
  });

  it("audits four domains, twenty source uses and forty-eight localizers", () => {
    const result = validateP11SourceAudits({ bundle: officialP11ExecutionBundle });
    expect(result.valid, stableStringify(result.errors)).toBe(true);
    expect(result).toMatchObject({ sourcesAdded: 17, sourcesReused: 3, fullText: 20 });
    expect(officialP11ExecutionBundle.sourceAudits.every((audit) => audit.valid && audit.abstractOnly === 0)).toBe(true);
  });

  it("selects the first executable official queue entry after every recalculation", () => {
    const result = validateP11SequentialSelection({ bundle: officialP11ExecutionBundle });
    expect(result.valid, stableStringify(result.errors)).toBe(true);
    expect(result.domains).toEqual(["t2-mapping", "quality-control", "neuro-oncology", "oef-cmro2"]);
    expect(officialP11ExecutionBundle.selectionHistory.every((selection) => selection.selectedQueueRank === 1 && !selection.manualSelection)).toBe(true);
  });

  it("executes four sequential atomic campaigns, never one bulk transaction", () => {
    expect(officialP11ExecutionBundle.campaigns).toHaveLength(4);
    expect(officialP11ExecutionBundle.campaigns.every((campaign) => campaign.execution.mutationRecordCount > 0)).toBe(true);
    for (let index = 1; index < officialP11ExecutionBundle.campaigns.length; index += 1) expect(officialP11ExecutionBundle.campaigns[index].beforeSnapshot.snapshotDigest).toBe(officialP11ExecutionBundle.campaigns[index - 1].postSnapshot.snapshotDigest);
  });

  it("creates four unique immutable manifests with stable campaign identifiers", () => {
    const ids = officialP11ExecutionBundle.campaigns.map((campaign) => campaign.manifest.campaignId);
    expect(ids).toEqual(["SCIENTIFIC-CAMPAIGN-20260801-002", "SCIENTIFIC-CAMPAIGN-20260801-003", "SCIENTIFIC-CAMPAIGN-20260801-004", "SCIENTIFIC-CAMPAIGN-20260801-005"]);
    expect(new Set(ids).size).toBe(4);
    expect(officialP11ExecutionBundle.campaigns.every((campaign) => Object.isFrozen(campaign.manifest))).toBe(true);
  });

  it("runs two identical simulations before every atomic apply", () => {
    for (const campaign of officialP11ExecutionBundle.campaigns) {
      expect(campaign.simulations.identical).toBe(true);
      expect(stableStringify(campaign.simulations.first, 0)).toBe(stableStringify(campaign.simulations.second, 0));
    }
  });

  it("replays and dry-runs rollback independently after every campaign", () => {
    for (const campaign of officialP11ExecutionBundle.campaigns) {
      expect(campaign.replay.valid).toBe(true);
      expect(campaign.rollbackDryRun).toMatchObject({ applied: false, valid: true, manifestPreserved: true, tracePreserved: true });
    }
    expect(validateP11Execution({ bundle: officialP11ExecutionBundle }).valid).toBe(true);
  });

  it("adds exactly the validated scientific records and reuses existing source revisions", () => {
    expect(officialP11ExecutionBundle.totals).toEqual({ campaignsExecuted: 4, sourcesAdded: 17, sourcesReused: 3, conceptsAdded: 36, assertionsAdded: 48, evidenceLinksAdded: 48, synthesesAdded: 4, projectionsAdded: 4 });
    expect(officialP11ExecutionBundle.campaigns.flatMap((campaign) => campaign.reviewedCorpus.reusedSourceIds)).toEqual([
      "noxia:radiology:source:pubmed:28992817:revision:2",
      "noxia:scientific-source:pubmed:39377680:revision:1",
      "noxia:scientific-source:pubmed:39656118:revision:1",
    ]);
  });

  it("keeps forty-eight assertions atomic, sourced and honestly reviewed", () => {
    const assertions = officialP11ExecutionBundle.campaigns.flatMap((campaign) => campaign.reviewedCorpus.assertions);
    expect(assertions).toHaveLength(48);
    expect(assertions.every((assertion) => assertion.statement.atomicConclusionCount === 1 && assertion.sourceRefs.length > 0)).toBe(true);
    expect(assertions.every((assertion) => assertion.scientificHumanReview === null && assertion.humanReviewed === false)).toBe(true);
    expect(assertions.filter((assertion) => assertion.assertionType === "LiteralValueAssertion")).toHaveLength(30);
  });

  it("narrows the one compound T2 formulation without losing its supported limitation", () => {
    const assertion = officialP11ExecutionBundle.campaigns.flatMap((campaign) => campaign.reviewedCorpus.assertions).find((item) => item.key === "three-t-bssfp-artifacts");
    expect(assertion.statement.text).toBe("At 3 T, T2-prepared bSSFP is more susceptible to field-related artifacts.");
    expect(assertion.limitations).toEqual(["B0_B1_ARTIFACTS_AT_3T"]);
  });

  it("keeps SUPPORTS and QUALIFIES distinct and every EvidenceLink localized", () => {
    const links = officialP11ExecutionBundle.campaigns.flatMap((campaign) => campaign.reviewedCorpus.evidenceLinks);
    expect(links.filter((link) => link.relationType === "SUPPORTS")).toHaveLength(31);
    expect(links.filter((link) => link.relationType === "QUALIFIES")).toHaveLength(17);
    expect(links.every((link) => link.locator && link.extraction.section && link.extraction.analyticalSummary)).toBe(true);
    expect(validateP11Candidates({ bundle: officialP11ExecutionBundle }).valid).toBe(true);
  });

  it("refuses an unlocalized SUPPORTS and a false human review", () => {
    const unlocalized = clone(officialP11ExecutionBundle);
    unlocalized.campaigns[0].reviewedCorpus.evidenceLinks[0].locator = null;
    expect(codes(validateP11Candidates({ bundle: unlocalized }))).toContain("P11_EVIDENCE_LOCALIZER_INVALID");
    const falseReview = clone(officialP11ExecutionBundle);
    falseReview.campaigns[0].reviewedCorpus.assertions[0].humanReviewed = true;
    expect(codes(validateP11Candidates({ bundle: falseReview }))).toContain("P11_FALSE_HUMAN_REVIEW");
  });

  it("creates four deterministic syntheses and four strictly internal projections", () => {
    for (const campaign of officialP11ExecutionBundle.campaigns) {
      expect(campaign.reviewedCorpus.syntheses).toHaveLength(1);
      expect(campaign.reviewedCorpus.syntheses[0]).toMatchObject({ generatedEditorialText: false, statisticalMetaAnalysisPerformed: false, scientificHumanReview: null });
      expect(campaign.reviewedCorpus.projections).toHaveLength(1);
      for (const [field, expected] of Object.entries(P11_PUBLICATION_GUARDS)) expect(campaign.reviewedCorpus.projections[0][field]).toBe(expected);
    }
  });

  it("moves each domain from DISCOVERING to EDITORIAL_READY but never PUBLIC_READY", () => {
    const result = validateP11CoverageAndReadiness({ bundle: officialP11ExecutionBundle });
    expect(result.valid, stableStringify(result.errors)).toBe(true);
    for (const campaign of officialP11ExecutionBundle.campaigns) expect(campaign.readiness.dimensions.publicReadiness).toMatchObject({ status: "BLOCKED", ready: false });
  });

  it("updates the official catalog and removes all four completed domains from the queue", () => {
    expect(scientificKnowledgeCatalog).toMatchObject({ version: "1.3.0", digest: officialP11ExecutionBundle.finalCatalog.digest });
    expect(scientificKnowledgeCatalog.summary).toMatchObject({ knowledgeNodes: 294, sources: 114, assertions: 237, evidenceLinks: 274, syntheses: 32, internalProjections: 29 });
    expect(scientificKnowledgeCatalog.campaigns).toHaveLength(8);
    expect(scientificKnowledgeCatalog.campaigns.some((campaign) => officialP11ExecutionBundle.campaigns.some((done) => done.nodeId === campaign.selectedNodeIds[0]))).toBe(false);
  });

  it("stops cleanly when radiomics has no validated candidate package", () => {
    expect(officialP11ExecutionBundle.termination).toMatchObject({ reason: "NEXT_QUEUE_DOMAIN_HAS_NO_VALIDATED_PREPARED_CANDIDATES", sourceResearchRequiredBeforeResume: true, nextExecutablePreparedPackage: null });
    expect(officialP11ExecutionBundle.termination.nextQueueEntry.knowledgeNodeId).toBe("noxia:knowledge-catalog:domain:radiomics");
  });

  it("rebuilds the complete wave byte-for-byte", () => {
    expect(rebuilt).toEqual(officialP11ExecutionBundle);
  });

  it("passes every dedicated P11 validation layer without touching public surfaces", () => {
    expect(validation.valid, stableStringify(validation.errors)).toBe(true);
    expect(validation.errors).toEqual([]);
    expect(Object.values(validation.layers).every((layer) => layer.valid)).toBe(true);
    expect(Object.values(officialP11ExecutionBundle.protectedSurfaces).every((value) => value === 0)).toBe(true);
  });
});

