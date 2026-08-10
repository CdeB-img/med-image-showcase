import { documentaryDigest, stableRelationId, uniqueSorted } from "./canonical";
import type {
  DocumentaryPattern,
  PatternAuditCode,
  PatternAuditFinding,
  PatternAuditResult,
  PatternCatalog,
  PatternRelationship,
  PatternSourceReference,
} from "./types";

type AuditableCatalog = Pick<PatternCatalog, "digest" | "patterns" | "relations" | "sourceCatalog" | "graph">;

const finding = (code: PatternAuditCode, severity: PatternAuditFinding["severity"], subjectId: string, message: string, evidenceIds: string[] = []): PatternAuditFinding => ({
  findingId: `DKA-${documentaryDigest([code, subjectId, message]).slice(5, 17).toUpperCase()}`,
  code,
  severity,
  subjectId,
  message,
  evidenceIds: uniqueSorted(evidenceIds),
});

const sensitiveText = (pattern: DocumentaryPattern) => [
  pattern.name,
  pattern.description,
  ...pattern.limitations,
  ...pattern.variants.flatMap((variant) => [variant.name, variant.description, variant.applicability, ...variant.limitations]),
].join(" ");

const SENSITIVE_VALUE_PATTERNS = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b(?:\+?33|0)[1-9](?:[ .-]?\d{2}){4}\b/,
  /\b\d{1,2}[/-]\d{1,2}[/-](?:19|20)\d{2}\b/,
  /\b\d+(?:[.,]\d+)?\s*(?:mg|ml|mm|ms|kv|ma|bpm|tesla)\b/i,
  /\b(?:CARIM|Siemens|Skyra|Philips|GE Healthcare)\b/i,
] as const;

const cycleNodes = (patterns: DocumentaryPattern[], relations: PatternRelationship[]) => {
  const ids = new Set(patterns.map((pattern) => pattern.patternId));
  const hierarchy = relations.filter((edge) => ["SPECIALIZES", "GENERALIZES"].includes(edge.type) && ids.has(edge.fromId) && ids.has(edge.toId));
  const adjacency = new Map<string, string[]>();
  hierarchy.forEach((edge) => adjacency.set(edge.fromId, [...(adjacency.get(edge.fromId) ?? []), edge.toId]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const cycles = new Set<string>();
  const visit = (id: string) => {
    if (visiting.has(id)) { cycles.add(id); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    (adjacency.get(id) ?? []).forEach(visit);
    visiting.delete(id);
    visited.add(id);
  };
  ids.forEach(visit);
  return [...cycles].sort();
};

export const auditPatternCatalog = (catalog: AuditableCatalog): PatternAuditResult => {
  const findings: PatternAuditFinding[] = [];
  const sources = new Map(catalog.sourceCatalog.map((source) => [source.sourceId, source]));
  const nodeIds = new Set(catalog.graph.nodes.map((node) => node.nodeId));
  catalog.patterns.forEach((pattern) => {
    if (!pattern.evidence.length) findings.push(finding("PATTERN_WITHOUT_EVIDENCE", "ERROR", pattern.patternId, "Le pattern ne porte aucune observation documentaire."));
    if (!pattern.provenance?.sourceIds?.length || !pattern.provenance.recordDigest) findings.push(finding("PATTERN_WITHOUT_PROVENANCE", "ERROR", pattern.patternId, "Le lignage du pattern est incomplet."));
    if (!pattern.category) findings.push(finding("PATTERN_WITHOUT_CATEGORY", "ERROR", pattern.patternId, "La catégorie documentaire manque."));
    if (!pattern.relationships.some((edge) => edge.type === "SUPPORTED_BY")) findings.push(finding("ORPHAN_PATTERN", "ERROR", pattern.patternId, "Le pattern n’est relié à aucune preuve."));
    pattern.variants.forEach((variant) => {
      const knownEvidence = new Set(pattern.evidence.map((evidence) => evidence.evidenceId));
      if (!variant.name || !variant.description || variant.evidenceIds.some((id) => !knownEvidence.has(id))) findings.push(finding("INVALID_VARIANT", "ERROR", variant.variantId, "La variante est incomplète ou référence une preuve étrangère.", variant.evidenceIds));
    });
    if (pattern.origin === "LOCAL_PRACTICE" && pattern.status !== "LOCAL_PRACTICE") findings.push(finding("LOCAL_PATTERN_PROMOTED", "ERROR", pattern.patternId, "Une pratique locale a reçu un statut plus général.", pattern.provenance.evidenceIds));
    if (pattern.origin === "EXTERNAL_REFERENCE" && pattern.status !== "EXTERNAL_REFERENCE") findings.push(finding("EXTERNAL_REFERENCE_PROMOTED", "ERROR", pattern.patternId, "Une référence externe a été promue en pattern général.", pattern.provenance.evidenceIds));
    if (pattern.origin === "HISTORICAL_REFERENCE" && pattern.status !== "HISTORICAL_REFERENCE") findings.push(finding("HISTORICAL_PATTERN_PROMOTED", "ERROR", pattern.patternId, "Une référence historique a été promue en pratique actuelle.", pattern.provenance.evidenceIds));
    if (SENSITIVE_VALUE_PATTERNS.some((matcher) => matcher.test(sensitiveText(pattern)))) findings.push(finding("SENSITIVE_VALUE_LEAK", "ERROR", pattern.patternId, "Une valeur sensible, locale ou exécutable apparaît dans le pattern abstrait.", pattern.provenance.evidenceIds));
    pattern.provenance.sourceIds.forEach((sourceId) => {
      if (!sources.has(sourceId)) findings.push(finding("BROKEN_SOURCE_REFERENCE", "ERROR", pattern.patternId, `La source ${sourceId} n’existe pas dans le catalogue.`, pattern.provenance.evidenceIds));
    });
  });
  catalog.sourceCatalog.forEach((source: PatternSourceReference) => {
    if (!source.artifactVersion) findings.push(finding("SOURCE_VERSION_MISSING", "ERROR", source.sourceId, "La version de l’artefact source manque."));
  });
  catalog.relations.forEach((edge) => {
    if (!nodeIds.has(edge.fromId) || !nodeIds.has(edge.toId)) findings.push(finding("DANGLING_RELATION", "ERROR", edge.relationId, "La relation référence un nœud absent.", edge.evidenceIds));
    if (edge.relationId !== stableRelationId(edge.fromId, edge.type, edge.toId)) findings.push(finding("DANGLING_RELATION", "ERROR", edge.relationId, "L’identité de relation n’est pas déterministe.", edge.evidenceIds));
    if (edge.type === "CONFLICTS_WITH" && edge.status === "UNRESOLVED") findings.push(finding("UNRESOLVED_CONTRADICTION", "WARNING", edge.relationId, "La contradiction reste ouverte et requiert un arbitrage externe ou humain.", edge.evidenceIds));
  });
  cycleNodes(catalog.patterns, catalog.relations).forEach((patternId) => findings.push(finding("CIRCULAR_HIERARCHY", "ERROR", patternId, "La hiérarchie SPECIALIZES/GENERALIZES contient un cycle.")));
  const sorted = findings.sort((left, right) => left.findingId.localeCompare(right.findingId));
  const counts = {
    ERROR: sorted.filter((item) => item.severity === "ERROR").length,
    WARNING: sorted.filter((item) => item.severity === "WARNING").length,
    INFORMATION: sorted.filter((item) => item.severity === "INFORMATION").length,
  };
  return {
    auditVersion: "1.0.0",
    catalogDigest: catalog.digest,
    findings: sorted,
    counts,
    passed: counts.ERROR === 0,
    boundary: "DETECTION_ONLY_NO_AUTOMATIC_FIX",
  };
};

export const detectSensitivePatternValue = (pattern: DocumentaryPattern) => SENSITIVE_VALUE_PATTERNS.some((matcher) => matcher.test(sensitiveText(pattern)));
