import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { stableStringify } from "../migration/stable-json.mjs";
import { KNOWLEDGE_NODE_TYPES } from "../knowledge-catalog/constants.mjs";
import { p9ScientificKnowledgeCatalog } from "../knowledge-catalog/catalog-builder.mjs";
import { TERRITORY_CONTRACTS, TERRITORY_LEVELS, TERRITORY_PROJECTION_TYPES } from "./constants.mjs";
import { createScientificTerritoryModel } from "./model.mjs";
import { createTerritoryReport } from "./territory-report.mjs";
import { validateScientificTerritoryModel } from "./validate.mjs";

const root = process.cwd();
const catalog = p9ScientificKnowledgeCatalog;
const fileModel = JSON.parse(readFileSync(resolve(root, "src/knowledge-graph/scientific-territory/scientific-territory-model.json"), "utf8"));
const model = createScientificTerritoryModel({ catalog });

describe("Scientific Territory Model", () => {
  it("defines an exhaustive structural scope through knowledge-area granularity", () => {
    expect(model.nodes.filter((node) => node.level === "TERRITORY")).toHaveLength(10);
    expect(model.nodes.filter((node) => node.level === "DOMAIN")).toHaveLength(110);
    expect(model.nodes.filter((node) => node.level === "SUBDOMAIN")).toHaveLength(388);
    expect(model.nodes.filter((node) => node.level === "KNOWLEDGE_AREA")).toHaveLength(1938);
    expect(model.nodes).toHaveLength(2446);
    expect(model.hierarchy).toEqual({ explicitThrough: "KNOWLEDGE_AREA", openEnumerationLevels: ["SCIENTIFIC_CONCEPT", "SPECIALIZED_CONCEPT", "ATOMIC_CONCEPT"] });
    expect(TERRITORY_LEVELS.at(-1)).toMatchObject({ id: "ATOMIC_CONCEPT", rank: 6 });
  });

  it("keeps territory responsibility distinct from catalog and scientific knowledge", () => {
    expect(model.contracts).toEqual(TERRITORY_CONTRACTS);
    expect(model.contracts).toMatchObject({ territoryDoesNotStoreScientificKnowledge: true, territoryDoesNotSelectCampaigns: true, scientificAssertionsCreated: 0, evidenceLinksCreated: 0, campaignsExecuted: 0 });
    expect(model).not.toHaveProperty("scientificAssertions");
    expect(model).not.toHaveProperty("evidenceLinks");
    expect(model).not.toHaveProperty("campaigns");
  });

  it("maps all P9 domains and represents every catalog concept type without changing the catalog", () => {
    expect(model.catalogComparison.summary).toMatchObject({ mappedCatalogDomains: 15, structurallyRepresentedCatalogConcepts: 235, unmappedCatalogDomains: 0, orphanCatalogConcepts: 0, unknownCatalogReferences: 0 });
    expect(model.catalogComparison.catalogSnapshot).toMatchObject({ digest: catalog.digest, planningDigest: catalog.planningDigest, knowledgeNodes: 250 });
    expect(model.catalogComparison.automaticCorrectionsApplied).toBe(0);
    expect(catalog.digest).toBe("4c170654c3c215fe6f7e426202dee8a2325d3d669f75d6ff562b76af55d76616");
    const mappedTypes = model.conceptFamilies.flatMap((family) => family.knowledgeNodeTypes);
    expect(KNOWLEDGE_NODE_TYPES.filter((nodeType) => nodeType !== "Domain" && !mappedTypes.includes(nodeType))).toEqual([]);
    expect(new Set(mappedTypes).size).toBe(mappedTypes.length);
  });

  it("supports multiple memberships without introducing a hierarchy cycle", () => {
    expect(model.crossMemberships.length).toBeGreaterThanOrEqual(9);
    const ecv = model.crossMemberships.find((membership) => membership.sourceId.endsWith(":extracellular-space"));
    expect(ecv.targetIds).toEqual(expect.arrayContaining([
      "noxia:scientific-territory:modalities-acquisition:domain:magnetic-resonance",
      "noxia:scientific-territory:anatomy-specialties:domain:cardiac-vascular",
    ]));
    expect(validateScientificTerritoryModel({ model, catalog }).valid).toBe(true);
  });

  it("makes boundaries explicit and rejects operational product scope", () => {
    const byId = new Map(model.boundaries.rules.map((rule) => [rule.boundaryId, rule]));
    expect(byId.get("noxia:scientific-territory:boundary:veterinary").status).toBe("OUT_OF_SCOPE");
    expect(byId.get("noxia:scientific-territory:boundary:histopathology").status).toBe("ADJACENT_CONDITIONAL");
    expect(byId.get("noxia:scientific-territory:boundary:protocols").status).toBe("INCLUDED_DOCUMENTARY_ONLY");
    for (const id of ["product-pacs", "installed-equipment", "operational-workflows", "internal-datasets", "clinical-recommendation-engine"]) expect(byId.get(`noxia:scientific-territory:boundary:${id}`).status).toBe("OUT_OF_SCOPE");
  });

  it("keeps transverse dimensions outside any single clinical domain", () => {
    expect(model.transverseDimensions).toHaveLength(24);
    for (const dimension of model.transverseDimensions) expect(dimension.appliesToTerritoryIds.length).toBeGreaterThan(1);
    expect(model.transverseDimensions.find((dimension) => dimension.dimensionId === "reproducibility").appliesToTerritoryIds).toEqual(expect.arrayContaining(["measurements-biomarkers", "quality-safety", "research-evidence"]));
  });

  it("declares only virtual projection capabilities", () => {
    expect(model.projections.types).toEqual(TERRITORY_PROJECTION_TYPES);
    expect(model.projections.policy).toMatchObject({ virtualOnly: true, createsPublicContent: false, automaticPublicationAllowed: false });
    expect(model.projections.policy.conditionalTypes).toEqual(["CaseStudy", "DecisionTree", "AIAssistant"]);
  });

  it("provides a roadmap without selecting or executing campaigns", () => {
    expect(model.roadmap.waves).toHaveLength(6);
    expect(model.roadmap.manualCampaignSelectionAllowed).toBe(false);
    expect(model.roadmap.selectionAuthority).toBe("SCIENTIFIC_KNOWLEDGE_CATALOG_CAMPAIGN_PLANNER");
    expect(model.contracts.campaignsExecuted).toBe(0);
  });

  it("produces transparent planning ranges and the required report inventory", () => {
    const report = createTerritoryReport(model);
    expect(report.summary).toMatchObject({ territories: 10, domains: 110, subdomains: 388, knowledgeAreas: 1938, maximumExplicitDepth: 3, maximumDefinedDepth: 6, excludedDomains: 10 });
    expect(report.summary.estimatedKnowledgeNodesAtMaturity.minimum).toBeLessThan(report.summary.estimatedKnowledgeNodesAtMaturity.maximum);
    expect(report.summary.estimatedPotentialScientificPages.minimum).toBeLessThan(report.summary.estimatedPotentialScientificPages.maximum);
    expect(report.tables.domains).toHaveLength(110);
  });

  it("is deterministic and synchronized with its generated JSON", () => {
    expect(createScientificTerritoryModel({ catalog })).toEqual(model);
    expect(fileModel).toEqual(model);
    expect(stableStringify(fileModel, 0)).toBe(stableStringify(model, 0));
  });

  it("passes every dedicated validation layer", () => {
    const validation = validateScientificTerritoryModel({ model, catalog, fileModel });
    expect(validation.valid, stableStringify(validation.errors)).toBe(true);
    expect(validation.errors).toEqual([]);
  });
});
