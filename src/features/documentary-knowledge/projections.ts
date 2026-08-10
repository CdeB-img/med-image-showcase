import { documentaryDigest } from "./canonical";
import { lookupPatternProvenance, queryPatternCatalog } from "./model";
import type { PatternCatalog, PatternKnowledgeProjection, PatternQuery } from "./types";

export const projectPatternKnowledge = (catalog: PatternCatalog, profile: PatternKnowledgeProjection["profile"], query: PatternQuery = {}): PatternKnowledgeProjection => {
  const payload = profile === "CATALOG" ? queryPatternCatalog(catalog, query)
    : profile === "GRAPH" ? catalog.graph
      : profile === "AUDIT" ? catalog.audit
        : profile === "STATISTICS" ? catalog.statistics
          : Object.fromEntries(catalog.patterns.map((pattern) => [pattern.patternId, lookupPatternProvenance(catalog, pattern.patternId)]));
  return {
    projectionId: `DKV-${documentaryDigest([catalog.catalogId, catalog.version, catalog.digest, profile, query]).slice(5, 17).toUpperCase()}`,
    profile,
    catalogId: catalog.catalogId,
    catalogVersion: catalog.version,
    catalogDigest: catalog.digest,
    payload,
    digest: documentaryDigest(payload),
    boundary: "READ_ONLY_KNOWLEDGE_VIEW_NOT_SOURCE_OF_TRUTH",
  };
};
