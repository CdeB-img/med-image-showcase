import { describe, expect, it } from "vitest";
import {
  appendPatternCatalogSnapshot,
  auditPatternCatalog,
  buildPatternCatalog,
  createPatternCatalogHistory,
  createPatternCatalogSnapshot,
  detectSensitivePatternValue,
  stablePatternId,
  stableRelationId,
  type PatternAuditCode,
  type PatternCatalog,
} from "..";
import { fact, TEST_SOURCE } from "./fixtures";

const baseCatalog = () => buildPatternCatalog({ facts: [fact({ behaviorKey: "audit:a", name: "Audit A" }), fact({ behaviorKey: "audit:b", name: "Audit B" })], sources: [TEST_SOURCE], version: "1.0.0", generatedAt: "2026-08-10" });
const clone = (catalog: PatternCatalog) => structuredClone(catalog);
const has = (catalog: PatternCatalog, code: PatternAuditCode) => auditPatternCatalog(catalog).findings.some((item) => item.code === code);

describe("DOC-002 — audit détectif et historique append-only", () => {
  it("détecte les quatorze classes obligatoires sans corriger", () => {
    const cases: Array<[PatternAuditCode, (catalog: PatternCatalog) => void]> = [
      ["PATTERN_WITHOUT_EVIDENCE", (catalog) => { catalog.patterns[0].evidence = []; }],
      ["PATTERN_WITHOUT_PROVENANCE", (catalog) => { catalog.patterns[0].provenance.sourceIds = []; }],
      ["PATTERN_WITHOUT_CATEGORY", (catalog) => { catalog.patterns[0].category = "" as never; }],
      ["ORPHAN_PATTERN", (catalog) => { catalog.patterns[0].relationships = []; }],
      ["DANGLING_RELATION", (catalog) => { catalog.relations[0].toId = "MISSING"; }],
      ["INVALID_VARIANT", (catalog) => { catalog.patterns[0].variants = [{ variantId: "BAD", name: "Bad", description: "Bad", applicability: "Bad", kind: "UNRESOLVED_VARIANT", evidenceIds: ["MISSING"], limitations: [] }]; }],
      ["CIRCULAR_HIERARCHY", (catalog) => {
        const [left, right] = catalog.patterns;
        catalog.relations.push(
          { relationId: stableRelationId(left.patternId, "SPECIALIZES", right.patternId), fromId: left.patternId, type: "SPECIALIZES", toId: right.patternId, rationale: "fixture", evidenceIds: [], provenanceSourceIds: [], status: "CANDIDATE_ONLY" },
          { relationId: stableRelationId(right.patternId, "SPECIALIZES", left.patternId), fromId: right.patternId, type: "SPECIALIZES", toId: left.patternId, rationale: "fixture", evidenceIds: [], provenanceSourceIds: [], status: "CANDIDATE_ONLY" },
        );
      }],
      ["UNRESOLVED_CONTRADICTION", (catalog) => { const [left, right] = catalog.patterns; catalog.relations.push({ relationId: stableRelationId(left.patternId, "CONFLICTS_WITH", right.patternId), fromId: left.patternId, type: "CONFLICTS_WITH", toId: right.patternId, rationale: "fixture", evidenceIds: [], provenanceSourceIds: [], status: "UNRESOLVED" }); }],
      ["LOCAL_PATTERN_PROMOTED", (catalog) => { catalog.patterns[0].origin = "LOCAL_PRACTICE"; catalog.patterns[0].status = "CANDIDATE_ONLY"; }],
      ["EXTERNAL_REFERENCE_PROMOTED", (catalog) => { catalog.patterns[0].origin = "EXTERNAL_REFERENCE"; catalog.patterns[0].status = "CANDIDATE_ONLY"; }],
      ["HISTORICAL_PATTERN_PROMOTED", (catalog) => { catalog.patterns[0].origin = "HISTORICAL_REFERENCE"; catalog.patterns[0].status = "CANDIDATE_ONLY"; }],
      ["SENSITIVE_VALUE_LEAK", (catalog) => { catalog.patterns[0].description = "Injection 12 mg"; }],
      ["SOURCE_VERSION_MISSING", (catalog) => { catalog.sourceCatalog[0].artifactVersion = ""; }],
      ["BROKEN_SOURCE_REFERENCE", (catalog) => { catalog.patterns[0].provenance.sourceIds = ["SRC-MISSING"]; }],
    ];
    cases.forEach(([code, mutate]) => {
      const catalog = clone(baseCatalog());
      mutate(catalog);
      const before = JSON.stringify(catalog);
      expect(has(catalog, code), code).toBe(true);
      expect(JSON.stringify(catalog), `${code} must not auto-fix`).toBe(before);
    });
  });

  it("détecte une valeur sensible ou exécutable dans l’abstraction", () => {
    const pattern = baseCatalog().patterns[0];
    expect(detectSensitivePatternValue(pattern)).toBe(false);
    expect(detectSensitivePatternValue({ ...pattern, description: "Contact user@example.org" })).toBe(true);
  });

  it("versionne sans mutation et refuse une branche d’historique", () => {
    const catalog = baseCatalog();
    const history = createPatternCatalogHistory(catalog, "2026-08-10T10:00:00Z");
    const prior = JSON.stringify(history);
    const nextCatalog = { ...catalog, version: "1.1.0", priorCatalogId: catalog.catalogId };
    const next = createPatternCatalogSnapshot(nextCatalog, { createdAt: "2026-08-10T11:00:00Z", reason: "ADDITIVE_UPDATE", priorSnapshotId: history.snapshots[0].snapshotId });
    const appended = appendPatternCatalogSnapshot(history, next);
    expect(appended.snapshots).toHaveLength(2);
    expect(JSON.stringify(history)).toBe(prior);
    const branch = createPatternCatalogSnapshot(nextCatalog, { createdAt: "2026-08-10T12:00:00Z", reason: "INVALID_BRANCH", priorSnapshotId: history.snapshots[0].snapshotId });
    expect(() => appendPatternCatalogSnapshot(appended, branch)).toThrow("PATTERN_HISTORY_NON_APPEND_ONLY");
  });

  it("conserve l’identité avec une preuve compatible et versionne la révision", () => {
    const firstFact = fact({ behaviorKey: "revision:stable-behavior", name: "Comportement stable" });
    const first = buildPatternCatalog({ facts: [firstFact], sources: [TEST_SOURCE], version: "1.0.0", generatedAt: "2026-08-10" });
    const secondFact = fact({ behaviorKey: "revision:stable-behavior", name: "Libellé descriptif révisé", factId: "F-ADDITIONAL" });
    const second = buildPatternCatalog({ facts: [firstFact, secondFact], sources: [TEST_SOURCE], version: "1.1.0", generatedAt: "2026-08-10", priorCatalog: first });
    expect(second.patterns[0].patternId).toBe(first.patterns[0].patternId);
    expect(second.patterns[0].version).toBe("1.1.0");
    expect(first.patterns[0].version).toBe("1.0.0");
    const changed = buildPatternCatalog({ facts: [fact({ behaviorKey: "revision:changed-behavior", name: "Comportement changé" })], sources: [TEST_SOURCE], version: "2.0.0", generatedAt: "2026-08-10", priorCatalog: second });
    expect(changed.patterns[0].patternId).not.toBe(second.patterns[0].patternId);
  });

  it("maintient une identité stable basée sur le comportement", () => {
    expect(stablePatternId(" Revue avant diffusion ")).toBe(stablePatternId("revue   avant diffusion"));
  });
});
