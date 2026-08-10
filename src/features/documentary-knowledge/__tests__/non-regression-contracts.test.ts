import { describe, expect, it } from "vitest";
import {
  DOCUMENTARY_PATTERN_CATALOG,
  documentaryKnowledgePatternEngine,
} from "..";

describe("DOC-002 — contrats de non-régression DOC-C01 à DOC-C16", () => {
  it("DOC-C01 — un Pattern ne devient jamais une vérité scientifique", () => expect(DOCUMENTARY_PATTERN_CATALOG.boundary).toBe("DOCUMENTARY_KNOWLEDGE_ONLY_NOT_SCIENCE_NOT_RULE_NOT_DECISION"));
  it("DOC-C02 — une pratique locale reste locale", () => expect(DOCUMENTARY_PATTERN_CATALOG.patterns.filter((pattern) => pattern.origin === "LOCAL_PRACTICE").every((pattern) => pattern.status === "LOCAL_PRACTICE")).toBe(true));
  it("DOC-C03 — une référence historique reste historique", () => expect(DOCUMENTARY_PATTERN_CATALOG.patterns.filter((pattern) => pattern.origin === "HISTORICAL_REFERENCE").every((pattern) => pattern.status === "HISTORICAL_REFERENCE")).toBe(true));
  it("DOC-C04 — une référence externe reste externe", () => expect(DOCUMENTARY_PATTERN_CATALOG.patterns.filter((pattern) => pattern.origin === "EXTERNAL_REFERENCE").every((pattern) => pattern.status === "EXTERNAL_REFERENCE")).toBe(true));
  it("DOC-C05 — une recommandation ne devient pas une obligation réglementaire", () => expect(JSON.stringify(DOCUMENTARY_PATTERN_CATALOG.patterns)).not.toMatch(/LEGAL_MANDATORY|REGULATORY_MANDATORY|APPROVAL_REQUIREMENT/));
  it("DOC-C06 — toute contradiction reste visible", () => {
    const contradictions = DOCUMENTARY_PATTERN_CATALOG.relations.filter((edge) => edge.type === "CONFLICTS_WITH");
    expect(contradictions.every((edge) => edge.status === "UNRESOLVED")).toBe(true);
  });
  it("DOC-C07 — tout Pattern possède une provenance", () => expect(DOCUMENTARY_PATTERN_CATALOG.patterns.every((pattern) => pattern.provenance.sourceIds.length && pattern.provenance.evidenceIds.length && pattern.provenance.recordDigest)).toBeTruthy());
  it("DOC-C08 — toute version historique reste reconstructible", () => expect(DOCUMENTARY_PATTERN_CATALOG.patterns.every((pattern) => pattern.version && pattern.provenance.sourceVersions && pattern.provenance.extractionDates.length)).toBeTruthy());
  it("DOC-C09 — une donnée sensible ne fuit pas dans les Patterns", () => expect(DOCUMENTARY_PATTERN_CATALOG.audit.findings.some((finding) => finding.code === "SENSITIVE_VALUE_LEAK")).toBe(false));
  it("DOC-C10 — l’ordre des sources n’influence pas le résultat logique", () => expect(DOCUMENTARY_PATTERN_CATALOG.digest).toMatch(/^doc2-/));
  it("DOC-C11 — DOC-002 ne produit aucun Research Project", () => expect(documentaryKnowledgePatternEngine).not.toHaveProperty("buildResearchProject"));
  it("DOC-C12 — DOC-002 ne produit aucun Template", () => expect(documentaryKnowledgePatternEngine).not.toHaveProperty("buildTemplate"));
  it("DOC-C13 — DOC-002 ne prend aucune décision humaine", () => expect(documentaryKnowledgePatternEngine).not.toHaveProperty("decide"));
  it("DOC-C14 — DOC-002 ne sélectionne aucune méthode scientifique", () => expect(documentaryKnowledgePatternEngine).not.toHaveProperty("selectScientificMethod"));
  it("DOC-C15 — DOC-002 ne modifie aucun corpus source", () => expect(DOCUMENTARY_PATTERN_CATALOG.sourceCatalog.every((source) => source.authorityBoundary === "EVIDENCE_ONLY_NOT_AUTHORITY")).toBe(true));
  it("DOC-C16 — une relation réglementaire reste une relation, jamais une promotion", () => {
    const regulatoryRelations = DOCUMENTARY_PATTERN_CATALOG.relations.filter((edge) => edge.toId.startsWith("REG-000:") || edge.toId.startsWith("REG-001:"));
    expect(regulatoryRelations.length).toBeGreaterThan(0);
    expect(regulatoryRelations.every((edge) => edge.type === "COEXISTS_WITH" && edge.status === "CANDIDATE_ONLY")).toBe(true);
  });
});
