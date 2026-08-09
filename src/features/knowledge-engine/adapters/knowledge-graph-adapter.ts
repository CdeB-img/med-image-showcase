import { entities, relations } from "@/knowledge-graph/catalog.mjs";
import { logicalDigest, uniqueSorted } from "../canonical";
import type { AdapterResult } from "../types";
import type { CorpusAdapter, CorpusAdapterInput } from "./corpus-adapter";

type GraphEntity = { entityId: string };
type GraphRelation = { relationId: string; sourceId: string; targetId: string };
const graphEntities = entities as GraphEntity[];
const graphRelations = relations as GraphRelation[];

const knowledgeGraphAdapter: CorpusAdapter = {
  adapterId: "knowledge-graph-adapter-v1",
  adapterVersion: "1.0.0",
  supports: (provider) => provider.id === "knowledge-graph",
  query: ({ queryPlan, provider }: CorpusAdapterInput): AdapterResult => {
    const exactIds = new Set(queryPlan.resolvedConcepts.flatMap((concept) => concept.providerConcepts[provider.id] ?? []));
    const matchedEntities = graphEntities.filter((entity) => exactIds.has(entity.entityId));
    const matchedEntityIds = new Set(matchedEntities.map((entity) => entity.entityId));
    const matchedRelations = graphRelations.filter((relation) => matchedEntityIds.has(relation.sourceId) || matchedEntityIds.has(relation.targetId));
    return {
      providerId: provider.id,
      providerVersion: provider.version,
      executionStatus: matchedEntities.length ? "SUCCESS" : "NO_MATCH",
      declaredCoverage: provider.domains,
      assertions: [],
      documentaryStatements: [],
      sources: [],
      evidenceLinks: [],
      conflicts: [],
      limitations: provider.limitations,
      continuation: "EXHAUSTED",
      diagnostics: matchedEntities.length
        ? [`${matchedEntities.length}_CONCEPT_ENTITIES_RESOLVED`, `${matchedRelations.length}_RELATIONS_NOT_PROMOTED_TO_SCIENTIFIC_ASSERTIONS`, "SCIENTIFIC_ASSERTION_REGISTRY_EMPTY"]
        : ["NO_EXACT_KNOWLEDGE_GRAPH_ENTITY"],
      sourceRepresentationDigest: logicalDigest({ entityIds: uniqueSorted(matchedEntities.map((entity) => entity.entityId)), relationIds: uniqueSorted(matchedRelations.map((relation) => relation.relationId)) }),
    };
  },
};

export default knowledgeGraphAdapter;
