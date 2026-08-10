import { auditPatternCatalog } from "./audit";
import { buildPatternCatalog, lookupPattern, lookupPatternProvenance, queryPatternCatalog } from "./model";
import { exportPatternCatalog, importPatternCatalog } from "./persistence";
import { projectPatternKnowledge } from "./projections";
import type { DocumentaryFact, PatternCatalog, PatternKnowledgeProjection, PatternQuery, PatternSourceReference } from "./types";

export type DocumentaryKnowledgePatternEngine = {
  build(input: { facts: DocumentaryFact[]; sources: PatternSourceReference[]; version: string; generatedAt: string; priorCatalogId?: string | null; priorCatalog?: Readonly<PatternCatalog> | null }): PatternCatalog;
  catalog(catalog: PatternCatalog): PatternCatalog;
  query(catalog: PatternCatalog, query?: PatternQuery): ReturnType<typeof queryPatternCatalog>;
  graph(catalog: PatternCatalog): PatternCatalog["graph"];
  lookup(catalog: PatternCatalog, patternId: string): ReturnType<typeof lookupPattern>;
  provenance(catalog: PatternCatalog, patternId: string): ReturnType<typeof lookupPatternProvenance>;
  statistics(catalog: PatternCatalog): PatternCatalog["statistics"];
  audit(catalog: PatternCatalog): PatternCatalog["audit"];
  export(catalog: PatternCatalog): string;
  import(serialized: string): PatternCatalog;
  project(catalog: PatternCatalog, profile: PatternKnowledgeProjection["profile"], query?: PatternQuery): PatternKnowledgeProjection;
};

export const documentaryKnowledgePatternEngine: DocumentaryKnowledgePatternEngine = {
  build: buildPatternCatalog,
  catalog: (catalog) => catalog,
  query: queryPatternCatalog,
  graph: (catalog) => catalog.graph,
  lookup: lookupPattern,
  provenance: lookupPatternProvenance,
  statistics: (catalog) => catalog.statistics,
  audit: auditPatternCatalog,
  export: exportPatternCatalog,
  import: importPatternCatalog,
  project: projectPatternKnowledge,
};
