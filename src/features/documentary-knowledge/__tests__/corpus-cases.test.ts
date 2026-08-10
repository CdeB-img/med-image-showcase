import { describe, expect, it } from "vitest";
import {
  DOCUMENTARY_PATTERN_CATALOG,
  PATTERN_CATEGORIES,
  PATTERN_RELATION_TYPES,
  adaptPatternCatalogForConsumer,
  buildAllConsumerAdapters,
  documentaryKnowledgePatternEngine,
  projectPatternKnowledge,
  queryPatternCatalog,
} from "..";

describe("DOC-002 — corpus généré, Core Lab et huit cas métier obligatoires", () => {
  it("valide le catalogue machine-readable et sa couverture", () => {
    const catalog = DOCUMENTARY_PATTERN_CATALOG;
    expect(catalog.audit.passed).toBe(true);
    expect(catalog.audit.counts.ERROR).toBe(0);
    expect(catalog.statistics.patternCount).toBeGreaterThanOrEqual(100);
    expect(catalog.statistics.provenanceCoveragePercent).toBe(100);
    expect(catalog.statistics.evidenceCoveragePercent).toBe(100);
    expect(new Set(catalog.patterns.map((pattern) => pattern.patternId)).size).toBe(catalog.patterns.length);
    expect(catalog.patterns.every((pattern) => !["VALIDATED", "OFFICIAL", "APPROVED"].includes(pattern.status))).toBe(true);
    expect(PATTERN_CATEGORIES.every((category) => typeof category === "string")).toBe(true);
    expect(PATTERN_RELATION_TYPES).toContain("ALTERNATIVE_TO");
    expect(PATTERN_RELATION_TYPES).toContain("PRODUCES");
  });

  it("sépare strictement FDA, pratiques locales et références historiques", () => {
    const external = DOCUMENTARY_PATTERN_CATALOG.patterns.filter((pattern) => pattern.origin === "EXTERNAL_REFERENCE");
    const local = DOCUMENTARY_PATTERN_CATALOG.patterns.filter((pattern) => pattern.origin === "LOCAL_PRACTICE");
    const historical = DOCUMENTARY_PATTERN_CATALOG.patterns.filter((pattern) => pattern.origin === "HISTORICAL_REFERENCE");
    expect(external).not.toHaveLength(0);
    expect(local).not.toHaveLength(0);
    expect(historical).not.toHaveLength(0);
    expect(external.every((pattern) => pattern.status === "EXTERNAL_REFERENCE")).toBe(true);
    expect(local.every((pattern) => pattern.status === "LOCAL_PRACTICE")).toBe(true);
    expect(historical.every((pattern) => pattern.status === "HISTORICAL_REFERENCE")).toBe(true);
    expect(local.flatMap((pattern) => pattern.sources).some((source) => source.sourceKind === "EXTERNAL_COMPARISON")).toBe(false);
  });

  it("couvre les domaines Core Lab sans paramètres, plateforme ou recommandation", () => {
    const categories = ["CoreLab", "Acquisition", "Imaging", "Equipment", "Quality", "Data", "Monitoring", "Deviation", "Training", "Troubleshooting"] as const;
    categories.forEach((category) => expect(queryPatternCatalog(DOCUMENTARY_PATTERN_CATALOG, { categories: [category] }).patterns.length, category).toBeGreaterThan(0));
    const text = DOCUMENTARY_PATTERN_CATALOG.patterns.map((pattern) => [pattern.name, pattern.description, ...pattern.limitations].join(" ")).join(" ");
    expect(text).not.toMatch(/\b(?:CARIM|Siemens|Skyra|Philips|GE Healthcare)\b/i);
    expect(text).not.toMatch(/\b\d+(?:[.,]\d+)?\s*(?:mg|ml|mm|ms|kv|ma|bpm|tesla)\b/i);
  });

  it("cas 1 — Validation SI : plusieurs patterns reliés sans règle universelle", () => {
    const validation = queryPatternCatalog(DOCUMENTARY_PATTERN_CATALOG, { categories: ["Validation"] }).patterns;
    const ids = new Set(validation.map((pattern) => pattern.patternId));
    expect(validation.length).toBeGreaterThanOrEqual(5);
    expect(DOCUMENTARY_PATTERN_CATALOG.relations.some((edge) => ids.has(edge.fromId) && ids.has(edge.toId) && ["PRECEDES", "GENERATES", "REQUIRES"].includes(edge.type))).toBe(true);
    expect(validation.every((pattern) => pattern.status !== "OFFICIAL" as never)).toBe(true);
  });

  it("cas 2 — Core Lab Imaging : workflow distribué et relié", () => {
    const coreCategories = new Set(["CoreLab", "Acquisition", "Imaging", "Equipment", "Quality", "Data", "Monitoring", "Deviation"]);
    const coreIds = new Set(DOCUMENTARY_PATTERN_CATALOG.patterns.filter((pattern) => coreCategories.has(pattern.category)).map((pattern) => pattern.patternId));
    expect(coreIds.size).toBeGreaterThan(15);
    expect(DOCUMENTARY_PATTERN_CATALOG.relations.filter((edge) => coreIds.has(edge.fromId) && coreIds.has(edge.toId)).length).toBeGreaterThan(10);
  });

  it("cas 3 — rédaction de protocole : sections, variantes, blocs et provenance", () => {
    const pattern = DOCUMENTARY_PATTERN_CATALOG.patterns.find((item) => item.name === "Structure de protocole contextualisée")!;
    expect(pattern.category).toBe("Document Structure");
    expect(pattern.variants.length).toBeGreaterThanOrEqual(2);
    expect(pattern.description).toContain("blocs conditionnels");
    expect(pattern.provenance.sourceIds.length).toBeGreaterThanOrEqual(3);
  });

  it("cas 4 — formulation prudente : niveau d’engagement sans phrase source", () => {
    const pattern = DOCUMENTARY_PATTERN_CATALOG.patterns.find((item) => item.category === "Editorial")!;
    expect(pattern.category).toBe("Editorial");
    expect(pattern.description).toMatch(/niveau d['’]engagement/);
    expect(pattern.limitations.join(" ")).toMatch(/n['’]augmente jamais/);
  });

  it("cas 5 — décision humaine : signatures et revues ne deviennent pas une décision automatique", () => {
    const patterns = queryPatternCatalog(DOCUMENTARY_PATTERN_CATALOG, { categories: ["Human Decision"] }).patterns;
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns.some((pattern) => /decision|décision|review|revue|approval/i.test([pattern.name, pattern.description, ...pattern.limitations].join(" ")))).toBe(true);
    expect(documentaryKnowledgePatternEngine).not.toHaveProperty("decide");
  });

  it("cas 6 — Equipment : profil de capacité sans compatibilité inventée", () => {
    const patterns = queryPatternCatalog(DOCUMENTARY_PATTERN_CATALOG, { categories: ["Equipment"] }).patterns;
    expect(patterns.some((pattern) => /profil|capacité|equipment|équipement/i.test(pattern.name))).toBe(true);
    expect(patterns.map((pattern) => [pattern.name, pattern.description, ...pattern.limitations].join(" ")).join(" ")).toMatch(/compatibilit[ée].*(?:preuve|établi|déduite)/i);
  });

  it("cas 7 — historique : la fréquence ne produit jamais CURRENT", () => {
    const historical = DOCUMENTARY_PATTERN_CATALOG.patterns.filter((pattern) => pattern.origin === "HISTORICAL_REFERENCE");
    expect(historical.length).toBeGreaterThan(0);
    expect(historical.every((pattern) => pattern.status === "HISTORICAL_REFERENCE")).toBe(true);
    expect(JSON.stringify(historical)).not.toContain('"CURRENT"');
  });

  it("cas 8 — référence institutionnelle : FDA reste externe, jamais obligatoire", () => {
    const external = DOCUMENTARY_PATTERN_CATALOG.patterns.find((pattern) => pattern.origin === "EXTERNAL_REFERENCE")!;
    expect(external.status).toBe("EXTERNAL_REFERENCE");
    expect(JSON.stringify(external)).not.toMatch(/LEGAL_MANDATORY|REGULATORY_MANDATORY|FDA_COMPLIANT|APPROVED_BY_FDA/);
    expect(external.relationships.some((edge) => edge.toId.startsWith("REG-000:") && edge.type === "COEXISTS_WITH")).toBe(true);
    expect(DOCUMENTARY_PATTERN_CATALOG.graph.nodes.some((node) => node.nodeId === "REG-000:REQUIREMENT_REFERENCE" && node.kind === "EXTERNAL_REFERENCE")).toBe(true);
  });

  it("projette une vue passive déterministe", () => {
    const first = projectPatternKnowledge(DOCUMENTARY_PATTERN_CATALOG, "STATISTICS");
    const second = projectPatternKnowledge(DOCUMENTARY_PATTERN_CATALOG, "STATISTICS");
    expect(first).toEqual(second);
    expect(first.boundary).toBe("READ_ONLY_KNOWLEDGE_VIEW_NOT_SOURCE_OF_TRUTH");
  });

  it("fournit neuf adapters bornés aux consommateurs futurs", () => {
    const adapters = buildAllConsumerAdapters(DOCUMENTARY_PATTERN_CATALOG);
    expect(adapters.map((adapter) => adapter.consumer).sort()).toEqual(["BIOSTATISTICS", "CLINICAL_OPERATIONS", "DATA_MANAGEMENT", "DOCUMENT_PROJECTION", "KNOWLEDGE", "QRY-001", "REGULATORY_ENGINE", "TMP-001", "UX-001"]);
    adapters.forEach((adapter) => expect(adapter.boundary).toBe("REFERENCE_ONLY_NO_CONSUMER_MUTATION_NO_AUTOMATIC_DECISION"));
    expect(adaptPatternCatalogForConsumer(DOCUMENTARY_PATTERN_CATALOG, "TMP-001").patternRefs.length).toBeGreaterThan(0);
  });
});
