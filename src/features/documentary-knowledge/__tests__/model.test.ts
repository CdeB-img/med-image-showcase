import { describe, expect, it } from "vitest";
import {
  buildPatternCatalog,
  consolidateDocumentaryFacts,
  documentaryKnowledgePatternEngine,
  lookupPattern,
  queryPatternCatalog,
  stablePatternId,
} from "..";
import { evidence, fact, originFact, TEST_SOURCE } from "./fixtures";

describe("DOC-002 — extraction, consolidation et contrats publics", () => {
  it("classe un pattern document unique sans fabriquer de support supplémentaire", () => {
    const [pattern] = consolidateDocumentaryFacts([fact({ behaviorKey: "single", name: "Pattern unique" })], [TEST_SOURCE]);
    expect(pattern.status).toBe("CANDIDATE_ONLY");
    expect(pattern.confidence).toBe("SINGLE_DOCUMENT");
    expect(pattern.evidence).toHaveLength(1);
  });

  it("qualifie séparément plusieurs documents, projets et institutions", () => {
    const documents = fact({ behaviorKey: "multi-doc", name: "Documents", evidence: [evidence({ evidenceId: "E-DOC", sourceDocumentRefs: ["D1", "D2"] })] });
    const projects = fact({ behaviorKey: "multi-project", name: "Projects", evidence: [
      evidence({ evidenceId: "E-P1", sourceDocumentRefs: ["D1"], projectRef: "P1" }),
      evidence({ evidenceId: "E-P2", sourceDocumentRefs: ["D2"], projectRef: "P2" }),
    ] });
    const institutions = fact({ behaviorKey: "multi-institution", name: "Institutions", evidence: [
      evidence({ evidenceId: "E-I1", institutionRef: "I1" }),
      evidence({ evidenceId: "E-I2", institutionRef: "I2" }),
    ] });
    const patterns = consolidateDocumentaryFacts([documents, projects, institutions], [TEST_SOURCE]);
    expect(patterns.find((item) => item.patternId === stablePatternId("multi-doc"))?.confidence).toBe("MULTIPLE_DOCUMENTS");
    expect(patterns.find((item) => item.patternId === stablePatternId("multi-project"))?.confidence).toBe("MULTIPLE_PROJECTS");
    expect(patterns.find((item) => item.patternId === stablePatternId("multi-institution"))?.confidence).toBe("MULTIPLE_INSTITUTIONS");
  });

  it("fusionne uniquement une identité comportementale exacte", () => {
    const sameA = fact({ behaviorKey: "review-before-release", name: "Revue avant diffusion", factId: "F-A" });
    const sameB = fact({ behaviorKey: "review-before-release", name: "Review before release", factId: "F-B", evidence: [evidence({ evidenceId: "E-B", sourceDocumentRefs: ["D2"] })] });
    const similar = fact({ behaviorKey: "review-after-release", name: "Revue après diffusion", factId: "F-C" });
    const patterns = consolidateDocumentaryFacts([similar, sameB, sameA], [TEST_SOURCE]);
    expect(patterns).toHaveLength(2);
    expect(patterns.find((item) => item.patternId === stablePatternId("review-before-release"))?.createdFrom).toEqual(["F-A", "F-B"]);
  });

  it("produit les mêmes identités et digests quel que soit l’ordre des faits et sources", () => {
    const facts = [fact({ behaviorKey: "alpha", name: "Alpha" }), fact({ behaviorKey: "beta", name: "Beta" })];
    const first = buildPatternCatalog({ facts, sources: [TEST_SOURCE], version: "1.0.0", generatedAt: "2026-08-10" });
    const second = buildPatternCatalog({ facts: [...facts].reverse(), sources: [TEST_SOURCE].reverse(), version: "1.0.0", generatedAt: "2026-08-10" });
    expect(second.patterns.map((item) => item.patternId)).toEqual(first.patterns.map((item) => item.patternId));
    expect(second.digest).toBe(first.digest);
    expect(second.graph.digest).toBe(first.graph.digest);
  });

  it("conserve local, historique, externe et inconnu sans promotion", () => {
    const patterns = consolidateDocumentaryFacts([
      originFact("LOCAL_PRACTICE"),
      originFact("HISTORICAL_REFERENCE"),
      originFact("EXTERNAL_REFERENCE"),
      originFact("UNKNOWN"),
    ], [TEST_SOURCE]);
    expect(patterns.map((item) => item.status).sort()).toEqual(["EXTERNAL_REFERENCE", "HISTORICAL_REFERENCE", "LOCAL_PRACTICE", "UNKNOWN"]);
  });

  it("préserve variantes et contradictions sans arbitrage", () => {
    const left = fact({
      behaviorKey: "branch:left",
      name: "Branche gauche",
      variants: [{ variantId: "V-LEFT", name: "Variante", description: "Profil explicite", applicability: "Décision humaine", kind: "UNRESOLVED_VARIANT", evidenceIds: [], limitations: ["Non sélectionnée automatiquement"] }],
      relatedBehaviorKeys: [{ type: "CONFLICTS_WITH", targetBehaviorKey: "branch:right", rationale: "Deux comportements incompatibles sont observés." }],
    });
    left.variants[0].evidenceIds = [left.evidence[0].evidenceId];
    const right = fact({ behaviorKey: "branch:right", name: "Branche droite" });
    const catalog = buildPatternCatalog({ facts: [left, right], sources: [TEST_SOURCE], version: "1.0.0", generatedAt: "2026-08-10" });
    expect(lookupPattern(catalog, stablePatternId("branch:left"))?.variants).toHaveLength(1);
    expect(catalog.relations.find((edge) => edge.type === "CONFLICTS_WITH")?.status).toBe("UNRESOLVED");
    expect(catalog.audit.findings.some((item) => item.code === "UNRESOLVED_CONTRADICTION")).toBe(true);
  });

  it("expose les neuf contrats publics sans mutation du catalogue", () => {
    const catalog = buildPatternCatalog({ facts: [fact({ behaviorKey: "public", name: "Public" })], sources: [TEST_SOURCE], version: "1.0.0", generatedAt: "2026-08-10" });
    const before = JSON.stringify(catalog);
    expect(documentaryKnowledgePatternEngine.catalog(catalog)).toBe(catalog);
    expect(documentaryKnowledgePatternEngine.query(catalog).patterns).toHaveLength(1);
    expect(documentaryKnowledgePatternEngine.graph(catalog).nodes.length).toBeGreaterThan(0);
    expect(documentaryKnowledgePatternEngine.lookup(catalog, catalog.patterns[0].patternId)).not.toBeNull();
    expect(documentaryKnowledgePatternEngine.provenance(catalog, catalog.patterns[0].patternId)?.sourceIds).toEqual([TEST_SOURCE.sourceId]);
    expect(documentaryKnowledgePatternEngine.statistics(catalog).patternCount).toBe(1);
    expect(documentaryKnowledgePatternEngine.audit(catalog).passed).toBe(true);
    expect(documentaryKnowledgePatternEngine.import(documentaryKnowledgePatternEngine.export(catalog)).digest).toBe(catalog.digest);
    expect(JSON.stringify(catalog)).toBe(before);
  });

  it("interroge par texte, catégorie, origine, statut, confiance, source et relation", () => {
    const linked = fact({ behaviorKey: "query:linked", name: "Linked", category: "Quality" });
    const source = fact({ behaviorKey: "query:source", name: "Contrôle traçable", category: "Quality", relatedBehaviorKeys: [{ type: "REQUIRES", targetBehaviorKey: "query:linked", rationale: "Dépendance de fixture" }] });
    const catalog = buildPatternCatalog({ facts: [source, linked], sources: [TEST_SOURCE], version: "1.0.0", generatedAt: "2026-08-10" });
    const result = queryPatternCatalog(catalog, { text: "traçable", categories: ["Quality"], origins: ["DOCUMENTARY_CORPUS"], statuses: ["CANDIDATE_ONLY"], confidence: ["SINGLE_DOCUMENT"], sourceIds: [TEST_SOURCE.sourceId], relatedTo: stablePatternId("query:linked") });
    expect(result.patternIds).toEqual([stablePatternId("query:source")]);
  });
});
