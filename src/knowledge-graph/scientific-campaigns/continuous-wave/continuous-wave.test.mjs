import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { createScientificKnowledgeCatalog, p9ScientificKnowledgeCatalog, scientificKnowledgeCatalog } from "../../knowledge-catalog/catalog-builder.mjs";
import { stableStringify } from "../../migration/stable-json.mjs";
import { createScientificTerritoryModel } from "../../scientific-territory/model.mjs";
import { createAtomicScientificCorpusWriter } from "./adapter.mjs";
import { P10_CAMPAIGN_ID, P10_PREPARED_FILE_SHA256, P10_PUBLICATION_GUARDS, P10_SELECTED_NODE_ID } from "./constants.mjs";
import { officialP10ExecutionBundle } from "./official-corpus.mjs";
import { createP10ScientificProductionReport } from "./report.mjs";
import { buildP10RuntimeBundle, loadP10RuntimeContext } from "./runtime.mjs";
import {
  validatePreparedScientificPackage,
  validateProtectedScientificSurfaces,
  validateScientificCampaignCandidates,
  validateScientificCampaignManifest,
  validateScientificCampaignRollback,
  validateScientificCampaignSources,
  validateScientificCoverage,
  validateScientificQueue,
  validateScientificReadiness,
  validateScientificTerritoryAlignment,
  validateTerritorialScientificProduction,
} from "./validate.mjs";

const root = process.cwd();
const clone = (value) => structuredClone(value);
const codes = (validation) => validation.errors.map((item) => item.code);
let context;
let rebuilt;
let validation;

beforeAll(async () => {
  context = await loadP10RuntimeContext({ root });
  rebuilt = await buildP10RuntimeBundle({ root });
  validation = validateTerritorialScientificProduction({ bundle: officialP10ExecutionBundle, baselineCatalog: context.baselineCatalog, territoryModel: context.territoryModel, root, inspectGit: false });
});

describe("P10 territory-driven continuous scientific production", () => {
  it("preserves the deterministic P9 baseline snapshot before execution", () => {
    expect(officialP10ExecutionBundle.initialSnapshot.catalog).toMatchObject({ digest: "4c170654c3c215fe6f7e426202dee8a2325d3d669f75d6ff562b76af55d76616", planningDigest: "012ecccdcbb81aab025cf5f4f48f4e204f8198ffc1c9ad1c72bf07e736d888d5" });
    expect(p9ScientificKnowledgeCatalog.summary).toMatchObject({ knowledgeNodes: 250, sources: 92, assertions: 177, evidenceLinks: 214, syntheses: 27, internalProjections: 24 });
  });

  it("keeps the Scientific Territory Model upstream and byte-stable", () => {
    const fileModel = JSON.parse(readFileSync(resolve(root, "src/knowledge-graph/scientific-territory/scientific-territory-model.json"), "utf8"));
    expect(createScientificTerritoryModel({ catalog: p9ScientificKnowledgeCatalog })).toEqual(fileModel);
    expect(officialP10ExecutionBundle.territory).toMatchObject({ digest: fileModel.digest, mutated: false });
  });

  it("reads the prepared package only through its frozen source digest", () => {
    const source = readFileSync(resolve(root, "src/knowledge-graph/scientific-campaigns/continuous-wave/data.mjs"));
    expect(createHash("sha256").update(source).digest("hex")).toBe(P10_PREPARED_FILE_SHA256);
    expect(officialP10ExecutionBundle.preparedPackage.trustStatus).toContain("UNTRUSTED_PREPARED_PACKAGE");
  });

  it("does not promote raw prepared objects into the official execution bundle", () => {
    expect(officialP10ExecutionBundle.preparedPackage.inventory).not.toHaveProperty("objects");
    expect(officialP10ExecutionBundle.preparedPackage.inventory.objectIndex.every((item) => !("value" in item))).toBe(true);
  });

  it("inventories and decides every prepared object without an identity collision", () => {
    const result = validatePreparedScientificPackage({ bundle: officialP10ExecutionBundle });
    expect(result.valid, stableStringify(result.errors)).toBe(true);
    expect(result.counts).toMatchObject({ total: 282, duplicateIds: 0 });
    expect(result.decisions).toMatchObject({ total: 282, deferred: 215, rejected: 5, integrated: 52 });
  });

  it("attaches all domain objects to explicit existing Territory nodes", () => {
    const result = validateScientificTerritoryAlignment({ bundle: officialP10ExecutionBundle, territoryModel: context.territoryModel });
    expect(result.valid, stableStringify(result.errors)).toBe(true);
    expect(result.alignedObjects).toBeGreaterThan(250);
  });

  it("ranks all five packages and selects segmentation without manual choice", () => {
    expect(officialP10ExecutionBundle.plan.candidates.map((item) => item.domainId)).toHaveLength(5);
    expect(officialP10ExecutionBundle.plan).toMatchObject({ manualDomainSelection: false, selectedDomainId: "segmentation", selectedNodeId: P10_SELECTED_NODE_ID });
    expect(officialP10ExecutionBundle.plan.candidates.filter((item) => item.selected)).toHaveLength(1);
  });

  it("creates one immutable, deterministic territorial campaign manifest", () => {
    const result = validateScientificCampaignManifest({ bundle: officialP10ExecutionBundle, territoryModel: context.territoryModel });
    expect(result.valid, stableStringify(result.errors)).toBe(true);
    expect(officialP10ExecutionBundle.manifest.campaignId).toBe(P10_CAMPAIGN_ID);
    expect(Object.isFrozen(officialP10ExecutionBundle.manifest)).toBe(true);
  });

  it("verifies five official sources and twelve precise localizers", () => {
    const result = validateScientificCampaignSources({ bundle: officialP10ExecutionBundle });
    expect(result.valid, stableStringify(result.errors)).toBe(true);
    expect(result).toMatchObject({ sources: 5, fullText: 5 });
    expect(officialP10ExecutionBundle.sourceVerification).toMatchObject({ valid: true, sources: 5, locators: 12 });
  });

  it("refuses a source without an official localization path", () => {
    const bad = clone(officialP10ExecutionBundle);
    bad.officialCorpus.sources[0].officialMetadataUrl = null;
    expect(codes(validateScientificCampaignSources({ bundle: bad }))).toContain("P10_SOURCE_OFFICIAL_VERIFICATION_MISSING");
  });

  it("qualifies a corrected source only when its official correction notice is retained", () => {
    const corrected = clone(officialP10ExecutionBundle);
    corrected.officialCorpus.sources[0].documentStatus = "CORRECTED";
    corrected.officialCorpus.sources[0].correctionNoticeUrl = "https://pubmed.ncbi.nlm.nih.gov/example-correction/";
    expect(validateScientificCampaignSources({ bundle: corrected }).valid).toBe(true);
    delete corrected.officialCorpus.sources[0].correctionNoticeUrl;
    expect(codes(validateScientificCampaignSources({ bundle: corrected }))).toContain("P10_CORRECTED_SOURCE_NOTICE_MISSING");
  });

  it("blocks a retracted prepared source", () => {
    const bad = clone(officialP10ExecutionBundle);
    bad.officialCorpus.sources[0].documentStatus = "RETRACTED";
    expect(codes(validateScientificCampaignSources({ bundle: bad }))).toContain("P10_SOURCE_DOCUMENT_STATUS_UNSAFE");
  });

  it("accepts only atomic, source-linked assertions", () => {
    expect(validateScientificCampaignCandidates({ bundle: officialP10ExecutionBundle }).valid).toBe(true);
    const composite = clone(officialP10ExecutionBundle);
    composite.officialCorpus.assertions[0].statement.atomicConclusionCount = 2;
    expect(codes(validateScientificCampaignCandidates({ bundle: composite }))).toContain("P10_ASSERTION_NOT_ATOMIC");
    const unsourced = clone(officialP10ExecutionBundle);
    unsourced.officialCorpus.assertions[0].sourceRefs = [];
    expect(codes(validateScientificCampaignCandidates({ bundle: unsourced }))).toContain("P10_ASSERTION_SOURCE_INVALID");
  });

  it("keeps SUPPORTS distinct from MENTIONS and preserves QUALIFIES", () => {
    const links = officialP10ExecutionBundle.officialCorpus.evidenceLinks;
    expect(links.filter((item) => item.relationType === "SUPPORTS")).toHaveLength(8);
    expect(links.filter((item) => item.relationType === "QUALIFIES")).toHaveLength(4);
    const mentioned = clone(officialP10ExecutionBundle);
    mentioned.officialCorpus.evidenceLinks[0].relationType = "MENTIONS";
    mentioned.officialCorpus.evidenceLinks[0].extraction.sourceMeaningDirectlyExpressed = false;
    expect(codes(validateScientificCampaignCandidates({ bundle: mentioned }))).toContain("P10_ASSERTION_WITHOUT_EVIDENCE");
  });

  it("retains REFUTES as a valid evidence relation without promoting it", () => {
    const refuted = clone(officialP10ExecutionBundle);
    refuted.officialCorpus.evidenceLinks[0].relationType = "REFUTES";
    expect(codes(validateScientificCampaignCandidates({ bundle: refuted }))).not.toContain("P10_EVIDENCE_RELATION_INVALID");
  });

  it("rejects orphan EvidenceLinks and incompatible contexts", () => {
    const orphan = clone(officialP10ExecutionBundle);
    orphan.officialCorpus.evidenceLinks[0].assertionRevisionId = "missing";
    expect(codes(validateScientificCampaignCandidates({ bundle: orphan }))).toContain("P10_EVIDENCE_ENDPOINT_INVALID");
    const incompatible = clone(officialP10ExecutionBundle);
    incompatible.officialCorpus.evidenceLinks[0].applicability.contextId = "different";
    expect(codes(validateScientificCampaignCandidates({ bundle: incompatible }))).toContain("P10_EVIDENCE_CONTEXT_INCOMPATIBLE");
  });

  it("requires explicit derivation steps for every derived interpretation", () => {
    const derived = clone(officialP10ExecutionBundle);
    derived.officialCorpus.evidenceLinks[0].extraction.interpretationLevel = "DERIVED_INTERPRETATION";
    derived.officialCorpus.evidenceLinks[0].extraction.derivationSteps = [];
    expect(codes(validateScientificCampaignCandidates({ bundle: derived }))).toContain("P10_DERIVED_INTERPRETATION_STEPS_MISSING");
  });

  it("distinguishes analytical summaries from direct quotations and author statements", () => {
    for (const link of officialP10ExecutionBundle.officialCorpus.evidenceLinks) expect(link.extraction).toMatchObject({ passageKind: "ANALYTICAL_SUMMARY_NOT_VERBATIM_SOURCE_TEXT", directAuthorStatement: false, verbatimSourceTextRetained: false, sourceMeaningDirectlyExpressed: true });
  });

  it("normalizes NOT_APPLICABLE without splitting it into fictitious modalities", () => {
    for (const assertion of officialP10ExecutionBundle.officialCorpus.assertions) {
      const modality = assertion.context.dimensions.find((item) => item.dimension === "modality");
      expect(modality).toEqual({ dimension: "modality", operator: "NOT_APPLICABLE", value: null });
    }
  });

  it("does not infer manufacturer, software, clinical causality or artificial consensus", () => {
    for (const assertion of officialP10ExecutionBundle.officialCorpus.assertions) {
      expect(assertion.facets.manufacturers).toEqual([]);
      expect(assertion.facets.software).toEqual([]);
      expect(assertion.scientificMaturity).not.toBe("CONSENSUS_RECOMMENDATION");
      expect(assertion.statement.atomicConclusionCount).toBe(1);
    }
  });

  it("keeps automated review structurally separate from scientific human review", () => {
    expect(officialP10ExecutionBundle.officialCorpus.reviewDecisions).toHaveLength(12);
    for (const decision of officialP10ExecutionBundle.officialCorpus.reviewDecisions) expect(decision).toMatchObject({ automatedStructuralReview: true, automatedProvenanceReview: true, automatedConsistencyReview: true, automatedScientificReview: false, scientificHumanReview: null });
  });

  it("produces two byte-stable simulations before applying one campaign", () => {
    expect(officialP10ExecutionBundle.simulations.identical).toBe(true);
    expect(stableStringify(officialP10ExecutionBundle.simulations.first, 0)).toBe(stableStringify(officialP10ExecutionBundle.simulations.second, 0));
    expect(officialP10ExecutionBundle.execution.executedCampaigns).toBe(1);
  });

  it("commits all mutation records once and rejects duplicate or second commits", () => {
    const manifest = { campaignRevisionId: "revision:1" };
    const record = { mutationId: "mutation:1", campaignRevisionId: "revision:1" };
    const writer = createAtomicScientificCorpusWriter();
    expect(writer.apply([record], { campaignManifest: manifest })).toHaveLength(1);
    expect(() => writer.apply([record], { campaignManifest: manifest })).toThrow("ATOMIC_SCIENTIFIC_WRITER_ALREADY_COMMITTED");
    const fresh = createAtomicScientificCorpusWriter();
    expect(() => fresh.apply([record, record], { campaignManifest: manifest })).toThrow("ATOMIC_SCIENTIFIC_WRITER_DUPLICATE_MUTATION");
    expect(fresh.snapshot()).toBeNull();
  });

  it("integrates the exact selected corpus and no partial object", () => {
    expect(officialP10ExecutionBundle.execution.mutationRecordCount).toBe(69);
    expect(officialP10ExecutionBundle.officialCorpus).toMatchObject({ status: "COMPLETED_WITH_GAPS", domainId: "segmentation" });
    expect(officialP10ExecutionBundle.officialCorpus.sources).toHaveLength(5);
    expect(officialP10ExecutionBundle.officialCorpus.concepts).toHaveLength(8);
    expect(officialP10ExecutionBundle.officialCorpus.assertions).toHaveLength(12);
    expect(officialP10ExecutionBundle.officialCorpus.evidenceLinks).toHaveLength(12);
  });

  it("updates the official catalog and removes only the completed campaign from the queue", () => {
    expect(scientificKnowledgeCatalog.summary).toMatchObject({ knowledgeNodes: 258, sources: 97, assertions: 189, evidenceLinks: 226, syntheses: 28, internalProjections: 25 });
    expect(scientificKnowledgeCatalog.campaigns).toHaveLength(12);
    expect(scientificKnowledgeCatalog.campaigns.some((item) => item.selectedNodeIds.includes(P10_SELECTED_NODE_ID))).toBe(false);
    expect(createScientificKnowledgeCatalog()).toEqual(scientificKnowledgeCatalog);
  });

  it("recalculates only segmentation coverage from DISCOVERING to EDITORIAL_READY", () => {
    const result = validateScientificCoverage({ bundle: officialP10ExecutionBundle });
    expect(result.valid, stableStringify(result.errors)).toBe(true);
    expect(result.changed).toEqual([expect.objectContaining({ catalogNodeId: P10_SELECTED_NODE_ID, previousState: "DISCOVERING", state: "EDITORIAL_READY", publicArtifacts: 0 })]);
  });

  it("keeps readiness multidimensional and public readiness blocked", () => {
    const result = validateScientificReadiness({ bundle: officialP10ExecutionBundle });
    expect(result.valid, stableStringify(result.errors)).toBe(true);
    expect(result.dimensions.publicReadiness).toMatchObject({ status: "BLOCKED", ready: false });
    expect(result.dimensions).not.toHaveProperty("score");
  });

  it("creates one deterministic internal synthesis without meta-analysis or editorial prose", () => {
    const synthesis = officialP10ExecutionBundle.officialCorpus.syntheses[0];
    expect(synthesis).toMatchObject({ generatedEditorialText: false, statisticalMetaAnalysisPerformed: false, scientificHumanReview: null });
    expect(synthesis.deterministicDigest).toBeTruthy();
  });

  it("creates one internal-only projection with every publication guard", () => {
    const projection = officialP10ExecutionBundle.officialCorpus.projections[0];
    for (const [field, expected] of Object.entries(P10_PUBLICATION_GUARDS)) expect(projection[field]).toBe(expected);
    expect(projection.assertionIds).toHaveLength(12);
    expect(projection.sourceIds).toHaveLength(5);
  });

  it("replays the final catalog and snapshot without divergence", () => {
    expect(officialP10ExecutionBundle.replay).toMatchObject({ valid: true, catalogDigest: officialP10ExecutionBundle.postSnapshot.catalog.digest, snapshotDigest: officialP10ExecutionBundle.postSnapshot.snapshotDigest });
    expect(rebuilt).toEqual(officialP10ExecutionBundle);
  });

  it("simulates a rollback to the exact P9 baseline without applying it", () => {
    const result = validateScientificCampaignRollback({ bundle: officialP10ExecutionBundle, baselineCatalog: p9ScientificKnowledgeCatalog });
    expect(result.valid, stableStringify(result.errors)).toBe(true);
    expect(result.rollback).toMatchObject({ applied: false, valid: true, manifestPreserved: true, tracePreserved: true, restoredCatalogDigest: p9ScientificKnowledgeCatalog.digest });
  });

  it("recalculates a territory-aligned queue and stops before T2 mapping", () => {
    const result = validateScientificQueue({ bundle: officialP10ExecutionBundle });
    expect(result.valid, stableStringify(result.errors)).toBe(true);
    expect(result).toMatchObject({ entries: 12, next: { knowledgeNodeId: "noxia:knowledge-catalog:domain:t2-mapping", nextTreatment: "NEXT_ATOMIC_CAMPAIGN_CANDIDATE" } });
    expect(officialP10ExecutionBundle.officialCorpus.domainId).not.toBe("t2-mapping");
  });

  it("keeps the prepared file because four scientific domain packages are deferred", () => {
    expect(officialP10ExecutionBundle.continuousWaveDisposition).toMatchObject({ filePreserved: true, allObjectsDecided: true, deferred: 215, rejected: 5, untreated: 0 });
  });

  it("keeps all protected public and product surfaces unchanged", () => {
    const result = validateProtectedScientificSurfaces({ bundle: officialP10ExecutionBundle, inspectGit: false });
    expect(result.valid, stableStringify(result.errors)).toBe(true);
    expect(Object.values(officialP10ExecutionBundle.protectedSurfaces).every((value) => value === 0)).toBe(true);
  });

  it("synchronizes every generated execution artifact and the current catalog", () => {
    const generated = JSON.parse(readFileSync(resolve(root, "src/knowledge-graph/knowledge-catalog/knowledge-catalog.json"), "utf8"));
    expect(generated).toEqual(scientificKnowledgeCatalog);
    expect(officialP10ExecutionBundle).toEqual(rebuilt);
  });

  it("produces the complete forty-section P10 report and all required tables", () => {
    const report = createP10ScientificProductionReport({ bundle: officialP10ExecutionBundle, validation });
    expect(Object.keys(report.sections)).toHaveLength(40);
    expect(report.tables).toEqual(expect.objectContaining({ preparedObjects: expect.any(Array), sources: expect.any(Array), assertions: expect.any(Array), domains: expect.any(Array), campaign: expect.any(Array), metrics: expect.any(Array), internalProjections: expect.any(Array), contracts: expect.any(Array) }));
    expect(report.summary).toMatchObject({ valid: true, selectedDomain: "segmentation", publicArtifacts: 0 });
  });

  it("passes all twelve dedicated validation layers", () => {
    expect(validation.valid, stableStringify(validation.errors)).toBe(true);
    expect(validation.errors).toEqual([]);
    expect(Object.values(validation.layers).every((layer) => layer.valid)).toBe(true);
  });
});
