import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { sha256Digest, stableStringify } from "../migration/stable-json.mjs";
import {
  buildScientificEnrichmentCampaigns,
  calculateCampaignPriorityBreakdown,
  calculateCampaignReentry,
  createCatalogPlanningDigest,
  isCampaignCandidate,
} from "../knowledge-catalog/campaign-engine.mjs";
import { createCampaignManifest, validateCampaignManifest } from "../knowledge-catalog/campaign-contracts.mjs";
import {
  CAMPAIGN_DEPENDENCY_TYPES,
  detectCampaignDependencyCycles,
  evaluateCampaignDependencies,
  normalizeCampaignDependency,
  validateCampaignDependencies,
} from "../knowledge-catalog/campaign-dependencies.mjs";
import {
  createAuthoritativeScientificRegistry,
  p6ScientificKnowledgeCatalog,
  p7ScientificKnowledgeCatalog,
  p9ScientificKnowledgeCatalog,
} from "../knowledge-catalog/catalog-builder.mjs";
import { EMPTY_TERRITORIAL_CAMPAIGN_CORPUS } from "./continuous-wave/constants.mjs";
import { authorizeCampaignExecution, authorizeScientificEnrichment, requireCataloguedScientificOperation } from "../knowledge-catalog/governance.mjs";
import { createKnowledgeNode } from "../knowledge-catalog/knowledge-node-registry.mjs";
import { validateCatalogReadinessIntegrity } from "../knowledge-catalog/readiness-integrity.mjs";
import { automaticCampaignExecutionTrace } from "./execution.mjs";
import {
  createGovernedMutationGateway,
  executeScientificCampaign,
  ScientificCampaignAdapterRegistry,
} from "./generic-executor.mjs";
import { createHepaticP7GenericReplayFixture, p9SyntheticCampaignFixtures } from "./industrial-fixtures.mjs";
import { replayP8CatalogCorruptions, validateP9IndustrialPlatform } from "./industrial-validation.mjs";
import { p7CampaignIdentityResolution, P7_LEGACY_TRACE_DIGEST } from "./p7-identity-migration.mjs";

const at = "2026-08-01T00:00:00.000Z";
const clone = (value) => structuredClone(value);

const syntheticNode = (key, { complete = false, status, nodeType = "Domain", priority = "HIGH" } = {}) => createKnowledgeNode({
  nodeId: `noxia:p9-test:${key}`,
  nodeType,
  preferredLabel: key,
  aliases: [],
  description: `P9 test ${key}`,
  parents: [], children: [], related: [], prerequisites: [], dependencies: [], relatedDomains: [], successors: [], replacements: [], supersededBy: [], blockingNodes: [],
  metrics: complete ? { sourceCount: 5, scientificSourceCount: 5, fullTextSourceCount: 5, assertionCount: 12, evidenceLinkCount: 12, localizedEvidenceLinkCount: 12, synthesisCount: 1, projectionCount: 1 } : {},
  roadmapSignals: { scientificValue: priority, editorialValue: priority, sourceAvailability: priority, priority: priority === "HIGH" ? 1 : 8 },
  planned: !complete,
  modeled: complete,
  status,
  createdAt: at,
  updatedAt: at,
  lastReview: at,
});

const integrityAfter = (mutate) => {
  const catalog = clone(p9ScientificKnowledgeCatalog);
  const registry = clone(createAuthoritativeScientificRegistry({ territorialCampaignCorpus: EMPTY_TERRITORIAL_CAMPAIGN_CORPUS }));
  mutate(catalog, registry);
  return validateCatalogReadinessIntegrity({ catalog, registry });
};

describe("P9 industrial scientific campaign platform", () => {
  it("preserves P7 as an immutable functional golden master while resolving its new identity", () => {
    expect(p6ScientificKnowledgeCatalog.digest).toBe("503cd942c65888a4dd684f4cae8445940869152f7ce9fbdecab37f2e13e38bb5");
    expect(p7ScientificKnowledgeCatalog.digest).toBe("0499f51a39b19633e539ec5c2711a8897c9e4a0beaef1aa3a1993309b7fb8162");
    expect(automaticCampaignExecutionTrace.traceDigest).toBe(P7_LEGACY_TRACE_DIGEST);
    expect(p7CampaignIdentityResolution).toMatchObject({ legacyCampaignId: "noxia:scientific-campaign:hepatic-imaging:01", resolution: "LEGACY_ID_RESOLVED_TO_STABLE_DEFINITION_AND_VERSIONED_REVISION" });
    const frozenTrace = JSON.parse(readFileSync(resolve(process.cwd(), "src/knowledge-graph/scientific-campaigns/automatic-campaign-trace.json"), "utf8"));
    expect(frozenTrace.traceDigest).toBe(P7_LEGACY_TRACE_DIGEST);
  });

  it("builds complete generic manifests and plans by global calculated priority", () => {
    const rebuilt = buildScientificEnrichmentCampaigns(p9ScientificKnowledgeCatalog.nodes, {
      dependencies: p9ScientificKnowledgeCatalog.dependencyRegistry,
      executions: p9ScientificKnowledgeCatalog.campaignExecutions,
      catalogPlanningDigest: p9ScientificKnowledgeCatalog.planningDigest,
    });
    expect(rebuilt).toEqual(p9ScientificKnowledgeCatalog.campaigns);
    expect(rebuilt[0].selectedNodeIds).toEqual(["noxia:knowledge-catalog:domain:segmentation"]);
    expect(rebuilt.map((item) => item.prioritySnapshot.score)).toEqual([...rebuilt].sort((a, b) => b.prioritySnapshot.score - a.prioritySnapshot.score).map((item) => item.prioritySnapshot.score));
    for (const manifest of rebuilt) expect(validateCampaignManifest(manifest).valid).toBe(true);
  });

  it("keeps definition identity stable and changes revision identity when relevant input changes", () => {
    const original = p9ScientificKnowledgeCatalog.campaigns[0];
    const node = clone(p9ScientificKnowledgeCatalog.nodes.find((item) => item.nodeId === original.selectedNodeIds[0]));
    node.priority.score += 1;
    const dependencyEvaluation = evaluateCampaignDependencies({ nodeId: node.nodeId, nodes: [node], dependencies: [] });
    const priorityBreakdown = calculateCampaignPriorityBreakdown(node, { dependencyEvaluation, planningAt: at });
    const changed = createCampaignManifest({ node, dependencyEvaluation, priorityBreakdown, catalogPlanningDigest: "changed-catalog-input", generatedAt: at });
    expect(changed.campaignDefinitionId).toBe(original.campaignDefinitionId);
    expect(changed.campaignRevisionId).not.toBe(original.campaignRevisionId);
    expect(changed.selectionDigest).not.toBe(original.selectionDigest);
  });

  it("is deterministic across input order and reacts to priority changes", () => {
    const nodes = p9ScientificKnowledgeCatalog.nodes;
    const digest = createCatalogPlanningDigest({ nodes, dependencies: [], executions: p9ScientificKnowledgeCatalog.campaignExecutions });
    const forward = buildScientificEnrichmentCampaigns(nodes, { executions: p9ScientificKnowledgeCatalog.campaignExecutions, catalogPlanningDigest: digest });
    const reverseDigest = createCatalogPlanningDigest({ nodes: [...nodes].reverse(), dependencies: [], executions: p9ScientificKnowledgeCatalog.campaignExecutions });
    const reversed = buildScientificEnrichmentCampaigns([...nodes].reverse(), { executions: p9ScientificKnowledgeCatalog.campaignExecutions, catalogPlanningDigest: reverseDigest });
    expect(reverseDigest).toBe(digest);
    expect(reversed).toEqual(forward);
    const reprioritized = clone(nodes);
    const t2 = reprioritized.find((node) => node.nodeId === "noxia:knowledge-catalog:domain:t2-mapping");
    t2.priority.score = 71;
    const reprioritizedDigest = createCatalogPlanningDigest({ nodes: reprioritized, dependencies: [], executions: p9ScientificKnowledgeCatalog.campaignExecutions });
    const replanned = buildScientificEnrichmentCampaigns(reprioritized, { executions: p9ScientificKnowledgeCatalog.campaignExecutions, catalogPlanningDigest: reprioritizedDigest });
    expect(replanned[0].selectedNodeIds).toEqual([t2.nodeId]);
  });

  it("reevaluates all 52 legacy PROJECTED incomplete nodes and reenters eligible high-priority nodes", () => {
    const projectedIncomplete = p7ScientificKnowledgeCatalog.nodes.filter((node) => node.status === "PROJECTED" && !node.coverage.complete);
    expect(projectedIncomplete).toHaveLength(52);
    expect(projectedIncomplete.every((node) => calculateCampaignReentry(node).projectionExists)).toBe(true);
    const reentered = p9ScientificKnowledgeCatalog.campaigns.filter((campaign) => campaign.coverageSnapshot.projectionExists);
    expect(reentered).toHaveLength(4);
    expect(reentered.every((campaign) => campaign.coverageSnapshot.reentryReasons.length > 0)).toBe(true);
  });

  it("enforces manifest-bound governance and fails closed", () => {
    const manifest = p9ScientificKnowledgeCatalog.campaigns[0];
    expect(authorizeCampaignExecution({ campaignManifest: manifest, catalog: p9ScientificKnowledgeCatalog }).authorized).toBe(true);
    expect(authorizeScientificEnrichment({ nodeId: manifest.selectedNodeIds[0], catalog: p9ScientificKnowledgeCatalog })).toMatchObject({ authorized: false, blockers: ["CAMPAIGN_MANIFEST_REQUIRED"] });
    expect(authorizeScientificEnrichment({ nodeId: "noxia:outside", campaignManifest: manifest, catalog: p9ScientificKnowledgeCatalog })).toMatchObject({ authorized: false, blockers: ["NODE_OUTSIDE_CAMPAIGN"] });
    const superseded = clone(manifest);
    superseded.status = "SUPERSEDED";
    expect(authorizeCampaignExecution({ campaignManifest: superseded, catalog: p9ScientificKnowledgeCatalog }).blockers).toContain("CAMPAIGN_NOT_EXECUTABLE");
    expect(() => requireCataloguedScientificOperation({ operation: "UNKNOWN", nodeId: manifest.selectedNodeIds[0], catalog: p9ScientificKnowledgeCatalog })).toThrow("UNKNOWN_SCIENTIFIC_OPERATION");
  });

  it("executes hepatic and three structurally different fixtures through one generic engine", async () => {
    const executorSource = readFileSync(resolve(process.cwd(), "src/knowledge-graph/scientific-campaigns/generic-executor.mjs"), "utf8");
    expect(executorSource).not.toMatch(/hepatic-imaging|\badc\b|spectral-ct/i);
    const fixtures = [createHepaticP7GenericReplayFixture(), ...p9SyntheticCampaignFixtures];
    const results = [];
    for (const fixture of fixtures) {
      const adapterRegistry = new ScientificCampaignAdapterRegistry([fixture.adapter]);
      results.push(await executeScientificCampaign({ campaignManifest: fixture.manifest, catalog: fixture.catalog, mode: "SIMULATION", adapterRegistry }));
    }
    expect(results).toHaveLength(4);
    expect(results.every((result) => ["COMPLETED", "COMPLETED_WITH_GAPS"].includes(result.status) && !result.mutationApplied)).toBe(true);
    expect(p9SyntheticCampaignFixtures.find((item) => item.definition.key === "documentary-standard").definition.quantitativeModel).toBe(false);
    expect(p9ScientificKnowledgeCatalog.nodes.some((node) => node.nodeId.startsWith("noxia:p9-fixture:"))).toBe(false);
  });

  it("deduplicates completed inputs and versions attempts without duplicate writes", async () => {
    const fixture = p9SyntheticCampaignFixtures[0];
    const adapterRegistry = new ScientificCampaignAdapterRegistry([fixture.adapter]);
    const first = await executeScientificCampaign({ campaignManifest: fixture.manifest, catalog: fixture.catalog, mode: "SIMULATION", adapterRegistry });
    const replay = await executeScientificCampaign({ campaignManifest: fixture.manifest, catalog: fixture.catalog, mode: "SIMULATION", adapterRegistry, executionHistory: [first.result] });
    expect(replay).toMatchObject({ status: "ALREADY_COMPLETED_NO_WRITE", idempotent: true, mutationApplied: false });
  });

  it("blocks concurrent attempts and enforces the manifest attempt limit", async () => {
    const fixture = p9SyntheticCampaignFixtures[0];
    const dryRun = await executeScientificCampaign({ campaignManifest: fixture.manifest, catalog: fixture.catalog, mode: "DRY_RUN" });
    await expect(executeScientificCampaign({ campaignManifest: fixture.manifest, catalog: fixture.catalog, mode: "DRY_RUN", attemptHistory: [dryRun.attempt] })).rejects.toThrow("CAMPAIGN_EXECUTION_ALREADY_ACTIVE");
    const exhausted = Array.from({ length: fixture.manifest.executionPolicy.maxAttempts }, (_, index) => ({
      ...dryRun.attempt,
      attemptId: `${dryRun.attempt.executionId}:attempt:${index + 1}`,
      attemptNumber: index + 1,
      status: "FAILED_RETRYABLE",
    }));
    await expect(executeScientificCampaign({ campaignManifest: fixture.manifest, catalog: fixture.catalog, mode: "DRY_RUN", attemptHistory: exhausted })).rejects.toThrow("CAMPAIGN_MAX_ATTEMPTS_REACHED");
  });

  it("permits APPLY only through the governed mutation gateway", async () => {
    const fixture = p9SyntheticCampaignFixtures[1];
    const registry = new ScientificCampaignAdapterRegistry([fixture.adapter]);
    await expect(executeScientificCampaign({ campaignManifest: fixture.manifest, catalog: fixture.catalog, mode: "APPLY", adapterRegistry: registry })).rejects.toThrow("CAMPAIGN_WRITER_REQUIRED");
    const decision = authorizeCampaignExecution({ campaignManifest: fixture.manifest, catalog: fixture.catalog });
    const gateway = createGovernedMutationGateway({ campaignManifest: fixture.manifest, governanceDecision: decision, catalog: fixture.catalog, writer: { apply: () => true } });
    expect(() => gateway.apply([{ campaignRevisionId: "wrong", selectedNodeIds: fixture.manifest.selectedNodeIds }])).toThrow("SCIENTIFIC_RECORD_CAMPAIGN_REVISION_MISMATCH");
  });

  it("represents satisfied, absent, optional, deprecated, blocking and cyclic dependencies", () => {
    const complete = syntheticNode("complete", { complete: true });
    const incomplete = syntheticNode("incomplete");
    const deprecated = syntheticNode("deprecated", { complete: true, status: "DEPRECATED" });
    const prerequisite = normalizeCampaignDependency({ dependencyId: "dep:prerequisite", type: "prerequisite", sourceNodeId: incomplete.nodeId, targetNodeId: complete.nodeId });
    expect(evaluateCampaignDependencies({ nodeId: incomplete.nodeId, nodes: [complete, incomplete], dependencies: [prerequisite] }).satisfied).toBe(true);
    const absent = normalizeCampaignDependency({ dependencyId: "dep:absent", type: "requiresConcept", sourceNodeId: incomplete.nodeId, targetNodeId: "missing" });
    const absentValidation = validateCampaignDependencies({ nodes: [complete, incomplete], dependencies: [absent] });
    expect(absentValidation.errors.map((error) => error.code)).toContain("CAMPAIGN_DEPENDENCY_TARGET_MISSING");
    expect(absentValidation.deadCampaigns).toContain(incomplete.nodeId);
    const optional = normalizeCampaignDependency({ dependencyId: "dep:optional", type: "optionalDependency", sourceNodeId: incomplete.nodeId, targetNodeId: "missing" });
    expect(validateCampaignDependencies({ nodes: [complete, incomplete], dependencies: [optional] }).valid).toBe(true);
    const deprecatedDependency = normalizeCampaignDependency({ dependencyId: "dep:deprecated", type: "prerequisite", sourceNodeId: incomplete.nodeId, targetNodeId: deprecated.nodeId });
    expect(evaluateCampaignDependencies({ nodeId: incomplete.nodeId, nodes: [incomplete, deprecated], dependencies: [deprecatedDependency] }).blockers[0].reason).toBe("DEPENDENCY_TARGET_TERMINAL");
    const blocker = normalizeCampaignDependency({ dependencyId: "dep:block", type: "blocks", sourceNodeId: incomplete.nodeId, targetNodeId: complete.nodeId });
    expect(evaluateCampaignDependencies({ nodeId: complete.nodeId, nodes: [complete, incomplete], dependencies: [blocker] }).satisfied).toBe(false);
    const cycle = [
      normalizeCampaignDependency({ dependencyId: "dep:a", type: "prerequisite", sourceNodeId: complete.nodeId, targetNodeId: incomplete.nodeId }),
      normalizeCampaignDependency({ dependencyId: "dep:b", type: "prerequisite", sourceNodeId: incomplete.nodeId, targetNodeId: complete.nodeId }),
    ];
    expect(detectCampaignDependencyCycles([complete, incomplete], cycle).cyclic).toBe(true);
    const method = syntheticNode("method", { complete: true, nodeType: "MeasurementMethod" });
    const allContractTypes = [
      prerequisite,
      normalizeCampaignDependency({ dependencyId: "dep:blocks-type", type: "blocks", sourceNodeId: complete.nodeId, targetNodeId: incomplete.nodeId }),
      normalizeCampaignDependency({ dependencyId: "dep:coverage-type", type: "requiresCoverageFrom", sourceNodeId: incomplete.nodeId, targetNodeId: complete.nodeId }),
      normalizeCampaignDependency({ dependencyId: "dep:concept-type", type: "requiresConcept", sourceNodeId: incomplete.nodeId, targetNodeId: complete.nodeId, requiredConceptId: complete.nodeId }),
      normalizeCampaignDependency({ dependencyId: "dep:method-type", type: "requiresMethod", sourceNodeId: incomplete.nodeId, targetNodeId: method.nodeId, requiredMethodId: method.nodeId }),
      normalizeCampaignDependency({ dependencyId: "dep:complementary", type: "complementary", sourceNodeId: incomplete.nodeId, targetNodeId: complete.nodeId }),
      normalizeCampaignDependency({ dependencyId: "dep:supersedes", type: "supersedes", sourceNodeId: incomplete.nodeId, targetNodeId: complete.nodeId }),
      normalizeCampaignDependency({ dependencyId: "dep:optional-type", type: "optionalDependency", sourceNodeId: incomplete.nodeId, targetNodeId: "missing" }),
    ];
    expect(new Set(allContractTypes.map((dependency) => dependency.type))).toEqual(new Set(CAMPAIGN_DEPENDENCY_TYPES));
    expect(validateCampaignDependencies({ nodes: [complete, incomplete, method], dependencies: allContractTypes }).valid).toBe(true);
  });

  it("blocks and then unblocks a campaign after prerequisite coverage changes", () => {
    const prerequisiteIncomplete = syntheticNode("prerequisite-incomplete");
    const dependent = syntheticNode("dependent");
    const dependency = normalizeCampaignDependency({ dependencyId: "dep:coverage", type: "requiresCoverageFrom", sourceNodeId: dependent.nodeId, targetNodeId: prerequisiteIncomplete.nodeId, minimumCoverage: 1 });
    expect(isCampaignCandidate(dependent, { nodes: [prerequisiteIncomplete, dependent], dependencies: [dependency] })).toBe(false);
    const prerequisiteComplete = syntheticNode("prerequisite-incomplete", { complete: true });
    expect(isCampaignCandidate(dependent, { nodes: [prerequisiteComplete, dependent], dependencies: [dependency] })).toBe(true);
  });

  it("detects every P8 corruption replay with explicit codes", () => {
    const scenarios = replayP8CatalogCorruptions();
    expect(scenarios).toHaveLength(6);
    expect(scenarios.every((scenario) => scenario.detected && scenario.codes.length > 0)).toBe(true);
  });

  it("detects orphan provenance, empty locators and unusable SUPPORTS extractions", () => {
    const sourceRemoved = integrityAfter((_catalog, registry) => {
      const sourceId = registry.assertions[0].sourceRefs[0];
      registry.sources = registry.sources.filter((source) => source.revisionId !== sourceId && source.stableId !== sourceId);
    });
    expect(sourceRemoved.errors.map((error) => error.code)).toContain("ASSERTION_SOURCE_REVISION_MISSING");
    const orphanEvidence = integrityAfter((_catalog, registry) => { registry.evidenceLinks[0].assertionRevisionId = "missing-assertion"; });
    expect(orphanEvidence.errors.map((error) => error.code)).toContain("EVIDENCE_ASSERTION_REVISION_MISSING");
    const locator = integrityAfter((_catalog, registry) => { registry.evidenceLinks[0].locator = ""; });
    expect(locator.errors.map((error) => error.code)).toContain("EVIDENCE_LOCATOR_EMPTY");
    const supports = integrityAfter((_catalog, registry) => {
      const link = registry.evidenceLinks.find((item) => item.relationType === "SUPPORTS");
      link.extraction = { ...link.extraction, passage: "" };
      link.extractedStatement = "";
      link.analyticalSummary = "";
    });
    expect(supports.errors.map((error) => error.code)).toContain("SUPPORTS_EXTRACTION_NOT_EXPLOITABLE");
  });

  it("does not treat an abstract-only source as full text or sufficient for an unqualified READY scope", () => {
    const result = integrityAfter((catalog, registry) => {
      const abstractSourceIds = new Set(registry.sources
        .filter((source) => (source.fullTextAvailability ?? source.metadata?.fullTextAvailability) === "ABSTRACT_ONLY")
        .map((source) => source.revisionId));
      const assertion = registry.assertions.find((item) => item.sourceRefs?.length && item.sourceRefs.every((sourceId) => abstractSourceIds.has(sourceId)));
      const node = catalog.nodes.find((item) => item.provenance.assertionRevisionIds.includes(assertion.revisionId));
      node.status = "READY";
    });
    expect(result.errors.map((error) => error.code)).toContain("READY_SCOPE_EXCEEDS_ABSTRACT_ONLY_SOURCE");
  });

  it("detects readiness, projection and metric claims disconnected from real registries", () => {
    const result = integrityAfter((catalog, registry) => {
      const node = catalog.nodes.find((item) => item.provenance.synthesisIds.length && item.provenance.projectionIds.length);
      registry.syntheses = [];
      registry.projections = [];
      node.readiness.scientificReady.ready = true;
      node.readiness.provenanceReady.ready = true;
      node.readiness.synthesisReady.ready = true;
      node.readiness.editorialProjectionReady.ready = true;
      node.readiness.publicPublicationReady.ready = true;
      node.metrics.assertionCount += 1;
    });
    const codes = result.errors.map((error) => error.code);
    expect(codes).toEqual(expect.arrayContaining(["NODE_SYNTHESIS_MISSING", "NODE_PROJECTION_MISSING", "CATALOG_METRIC_REGISTRY_DIVERGENCE", "PUBLICATION_READY_WITHOUT_PUBLICATION_CONTRACT"]));
  });

  it("passes the unified industrial acceptance gate deterministically", () => {
    const first = validateP9IndustrialPlatform();
    const second = validateP9IndustrialPlatform();
    expect(first.valid, stableStringify(first.errors)).toBe(true);
    expect(first.layers.identities).toMatchObject({ definitions: 14, revisions: 14, executions: 1, attempts: 1, results: 1 });
    expect(second).toEqual(first);
    expect(sha256Digest(first.layers)).toBe(sha256Digest(second.layers));
  });
});
