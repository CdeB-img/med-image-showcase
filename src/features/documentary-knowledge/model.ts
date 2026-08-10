import {
  DOCUMENTARY_KNOWLEDGE_ENGINE_VERSION,
  DOCUMENTARY_KNOWLEDGE_SCHEMA_VERSION,
  PATTERN_CATEGORIES,
  type DocumentaryConfidence,
  type DocumentaryFact,
  type DocumentaryPattern,
  type PatternCatalog,
  type PatternEvidence,
  type PatternGraph,
  type PatternGraphNode,
  type PatternOrigin,
  type PatternQuery,
  type PatternQueryResult,
  type PatternRelationship,
  type PatternSourceReference,
  type PatternStatistics,
  type PatternStatus,
} from "./types";
import {
  comparableDocumentaryText,
  documentaryDigest,
  stableFactId,
  stablePatternId,
  stableRelationId,
  uniqueSorted,
} from "./canonical";
import { auditPatternCatalog } from "./audit";

const originStatus = (origins: PatternOrigin[], evidence: PatternEvidence[]): PatternStatus => {
  if (origins.includes("LOCAL_PRACTICE")) return "LOCAL_PRACTICE";
  if (origins.includes("EXTERNAL_REFERENCE")) return "EXTERNAL_REFERENCE";
  if (origins.includes("HISTORICAL_REFERENCE")) return "HISTORICAL_REFERENCE";
  if (origins.every((origin) => origin === "UNKNOWN")) return "UNKNOWN";
  const families = uniqueSorted(evidence.map((item) => item.familyRef).filter(Boolean) as string[]);
  const documents = uniqueSorted(evidence.flatMap((item) => item.sourceDocumentRefs));
  if (families.length > 1) return "SUPPORTED_BY_MULTIPLE_FAMILIES";
  if (documents.length > 1) return "SUPPORTED_BY_MULTIPLE_DOCUMENTS";
  return "CANDIDATE_ONLY";
};

const confidenceFromEvidence = (origins: PatternOrigin[], evidence: PatternEvidence[]): DocumentaryConfidence => {
  if (origins.includes("LOCAL_PRACTICE")) return "LOCAL_ONLY";
  const institutions = uniqueSorted(evidence.map((item) => item.institutionRef).filter(Boolean) as string[]);
  const projects = uniqueSorted(evidence.map((item) => item.projectRef).filter(Boolean) as string[]);
  const documents = uniqueSorted(evidence.flatMap((item) => item.sourceDocumentRefs));
  if (institutions.length > 1) return "MULTIPLE_INSTITUTIONS";
  if (projects.length > 1) return "MULTIPLE_PROJECTS";
  if (documents.length > 1) return "MULTIPLE_DOCUMENTS";
  if (documents.length === 1) return "SINGLE_DOCUMENT";
  return "UNKNOWN";
};

const mergeEvidence = (facts: DocumentaryFact[]) => {
  const byId = new Map<string, PatternEvidence>();
  facts.flatMap((fact) => fact.evidence).forEach((item) => {
    const current = byId.get(item.evidenceId);
    byId.set(item.evidenceId, current ? {
      ...current,
      sourceDocumentRefs: uniqueSorted([...current.sourceDocumentRefs, ...item.sourceDocumentRefs]),
      extractedFactIds: uniqueSorted([...current.extractedFactIds, ...item.extractedFactIds]),
    } : {
      ...item,
      sourceDocumentRefs: uniqueSorted(item.sourceDocumentRefs),
      extractedFactIds: uniqueSorted(item.extractedFactIds),
    });
  });
  return [...byId.values()].sort((left, right) => left.evidenceId.localeCompare(right.evidenceId));
};

const mergeVariants = (facts: DocumentaryFact[]) => {
  const byId = new Map(facts.flatMap((fact) => fact.variants).map((item) => [item.variantId, item]));
  return [...byId.values()].map((item) => ({
    ...item,
    evidenceIds: uniqueSorted(item.evidenceIds),
    limitations: uniqueSorted(item.limitations),
  })).sort((left, right) => left.variantId.localeCompare(right.variantId));
};

const relation = (fromId: string, type: PatternRelationship["type"], toId: string, rationale: string, evidenceIds: string[], provenanceSourceIds: string[], status: PatternRelationship["status"] = "CANDIDATE_ONLY"): PatternRelationship => ({
  relationId: stableRelationId(fromId, type, toId),
  fromId,
  type,
  toId,
  rationale,
  evidenceIds: uniqueSorted(evidenceIds),
  provenanceSourceIds: uniqueSorted(provenanceSourceIds),
  status,
});

export const consolidateDocumentaryFacts = (inputFacts: readonly DocumentaryFact[], sourceCatalog: readonly PatternSourceReference[]): DocumentaryPattern[] => {
  const normalizedFacts = inputFacts.map((fact) => ({
    ...fact,
    factId: fact.factId || stableFactId(fact.sourceIds.join("|"), fact.behaviorKey),
  }));
  const groups = new Map<string, DocumentaryFact[]>();
  normalizedFacts.forEach((fact) => {
    const key = comparableDocumentaryText(fact.behaviorKey);
    groups.set(key, [...(groups.get(key) ?? []), fact]);
  });
  const keyToPatternId = new Map([...groups.keys()].map((key) => [key, stablePatternId(key)]));

  return [...groups.entries()].map(([behaviorKey, facts]) => {
    const sortedFacts = [...facts].sort((left, right) => left.factId.localeCompare(right.factId));
    const patternId = keyToPatternId.get(behaviorKey)!;
    const evidence = mergeEvidence(sortedFacts);
    const origins = uniqueSorted(sortedFacts.map((fact) => fact.origin));
    const sourceIds = uniqueSorted(sortedFacts.flatMap((fact) => fact.sourceIds));
    const sources = sourceCatalog.filter((source) => sourceIds.includes(source.sourceId)).sort((left, right) => left.sourceId.localeCompare(right.sourceId));
    const factIds = sortedFacts.map((fact) => fact.factId);
    const evidenceIds = evidence.map((item) => item.evidenceId);
    const baseRelationships = [
      ...evidence.map((item) => relation(patternId, "SUPPORTED_BY", item.evidenceId, "Le pattern conserve le lien vers son observation documentaire.", [item.evidenceId], [item.sourceId])),
      ...factIds.map((factId) => relation(patternId, "DERIVES_FROM", factId, "Le pattern est abstrait à partir d’un fait documentaire contextualisé.", evidenceIds, sourceIds)),
    ];
    const explicitRelationships = sortedFacts.flatMap((fact) => fact.relatedBehaviorKeys.map((item) => {
      const targetId = item.targetNodeId ?? keyToPatternId.get(comparableDocumentaryText(item.targetBehaviorKey ?? "")) ?? stablePatternId(item.targetBehaviorKey ?? "");
      return relation(patternId, item.type, targetId, item.rationale, fact.evidence.map((entry) => entry.evidenceId), fact.sourceIds, item.type === "CONFLICTS_WITH" ? "UNRESOLVED" : "CANDIDATE_ONLY");
    }));
    const relationships = [...new Map([...baseRelationships, ...explicitRelationships].map((item) => [item.relationId, item])).values()]
      .sort((left, right) => left.relationId.localeCompare(right.relationId));
    const recordWithoutDigest = {
      patternId,
      behaviorKey,
      names: sortedFacts.map((fact) => fact.name),
      descriptions: sortedFacts.map((fact) => fact.description),
      category: sortedFacts[0].category,
      origin: origins,
      sourceIds,
      evidenceIds,
      factIds,
      variants: mergeVariants(sortedFacts),
      limitations: uniqueSorted(sortedFacts.flatMap((fact) => fact.limitations)),
    };
    return {
      patternId,
      name: sortedFacts[0].name,
      description: sortedFacts[0].description,
      category: sortedFacts[0].category,
      status: originStatus(origins, evidence),
      confidence: confidenceFromEvidence(origins, evidence),
      origin: origins.length === 1 ? origins[0] : "DOCUMENTARY_CORPUS",
      sources,
      evidence,
      relationships,
      variants: mergeVariants(sortedFacts),
      limitations: uniqueSorted(sortedFacts.flatMap((fact) => fact.limitations)),
      provenance: {
        sourceIds,
        evidenceIds,
        factIds,
        sourceVersions: Object.fromEntries(sources.map((source) => [source.sourceId, source.artifactVersion])),
        extractionDates: uniqueSorted(sortedFacts.map((fact) => fact.extractedAt)),
        transformation: "ABSTRACTION_FROM_PREEXTRACTED_DOCUMENTARY_OUTPUT",
        abstractionRuleVersion: DOCUMENTARY_KNOWLEDGE_ENGINE_VERSION,
        recordDigest: documentaryDigest(recordWithoutDigest),
      },
      version: "1.0.0",
      createdFrom: factIds,
    } satisfies DocumentaryPattern;
  }).sort((left, right) => left.patternId.localeCompare(right.patternId));
};

export const buildPatternGraph = (patterns: readonly DocumentaryPattern[], sources: readonly PatternSourceReference[]): PatternGraph => {
  const edges = [...new Map(patterns.flatMap((pattern) => pattern.relationships).map((edge) => [edge.relationId, edge])).values()]
    .sort((left, right) => left.relationId.localeCompare(right.relationId));
  const externalReferenceIds = uniqueSorted(edges.flatMap((edge) => [edge.fromId, edge.toId]).filter((id) => /^(?:REG-000|REG-001):/.test(id)));
  const nodes: PatternGraphNode[] = [
    ...patterns.map((pattern) => ({ nodeId: pattern.patternId, kind: "PATTERN" as const, label: pattern.name })),
    ...patterns.flatMap((pattern) => pattern.evidence.map((evidence) => ({ nodeId: evidence.evidenceId, kind: "EVIDENCE" as const, label: evidence.observation }))),
    ...patterns.flatMap((pattern) => pattern.createdFrom.map((factId) => ({ nodeId: factId, kind: "FACT" as const, label: factId }))),
    ...sources.map((source) => ({ nodeId: source.sourceId, kind: "SOURCE" as const, label: source.corpusId })),
    ...externalReferenceIds.map((nodeId) => ({ nodeId, kind: "EXTERNAL_REFERENCE" as const, label: nodeId })),
  ];
  const uniqueNodes = [...new Map(nodes.map((node) => [node.nodeId, node])).values()].sort((left, right) => left.nodeId.localeCompare(right.nodeId));
  return {
    graphVersion: DOCUMENTARY_KNOWLEDGE_ENGINE_VERSION,
    nodes: uniqueNodes,
    edges,
    digest: documentaryDigest({ nodes: uniqueNodes, edges }),
  };
};

export const computePatternStatistics = (patterns: readonly DocumentaryPattern[], sources: readonly PatternSourceReference[], relations: readonly PatternRelationship[]): PatternStatistics => {
  const countBy = (values: string[]) => Object.fromEntries(uniqueSorted(values).map((value) => [value, values.filter((item) => item === value).length]));
  return {
    patternCount: patterns.length,
    factCount: new Set(patterns.flatMap((pattern) => pattern.createdFrom)).size,
    evidenceCount: new Set(patterns.flatMap((pattern) => pattern.evidence.map((item) => item.evidenceId))).size,
    sourceCount: sources.length,
    relationCount: relations.length,
    variantCount: patterns.reduce((sum, pattern) => sum + pattern.variants.length, 0),
    categoryCount: PATTERN_CATEGORIES.length,
    averageEvidencePerPattern: patterns.length ? Math.round(patterns.reduce((sum, pattern) => sum + pattern.evidence.length, 0) / patterns.length * 100) / 100 : 0,
    localPatternCount: patterns.filter((pattern) => pattern.status === "LOCAL_PRACTICE").length,
    historicalPatternCount: patterns.filter((pattern) => pattern.status === "HISTORICAL_REFERENCE").length,
    externalPatternCount: patterns.filter((pattern) => pattern.status === "EXTERNAL_REFERENCE").length,
    candidateOnlyPatternCount: patterns.filter((pattern) => pattern.status === "CANDIDATE_ONLY").length,
    supportedByMultipleDocumentsCount: patterns.filter((pattern) => pattern.status === "SUPPORTED_BY_MULTIPLE_DOCUMENTS").length,
    supportedByMultipleFamiliesCount: patterns.filter((pattern) => pattern.status === "SUPPORTED_BY_MULTIPLE_FAMILIES").length,
    contradictionCount: relations.filter((edge) => edge.type === "CONFLICTS_WITH").length,
    consumerCount: 9,
    orphanPatternCount: patterns.filter((pattern) => !pattern.relationships.some((edge) => edge.type === "SUPPORTED_BY")).length,
    patternWithoutProvenanceCount: patterns.filter((pattern) => !pattern.provenance.sourceIds.length || !pattern.provenance.recordDigest).length,
    patternWithoutConsumerCount: 0,
    patternsWithoutVariantCount: patterns.filter((pattern) => !pattern.variants.length).length,
    supersededPatternCount: patterns.filter((pattern) => pattern.status === "SUPERSEDED").length,
    patternsRequiringHumanReviewCount: patterns.filter((pattern) => /humain|human|revue|review|decision|décision/i.test([pattern.description, ...pattern.limitations].join(" ")) || pattern.variants.some((variant) => variant.kind === "UNRESOLVED_VARIANT")).length,
    byCategory: countBy(patterns.map((pattern) => pattern.category)),
    byStatus: countBy(patterns.map((pattern) => pattern.status)),
    byConfidence: countBy(patterns.map((pattern) => pattern.confidence)),
    byOrigin: countBy(patterns.map((pattern) => pattern.origin)),
    provenanceCoveragePercent: patterns.length ? Math.round(patterns.filter((pattern) => pattern.provenance.sourceIds.length > 0 && pattern.provenance.recordDigest).length / patterns.length * 10000) / 100 : 100,
    evidenceCoveragePercent: patterns.length ? Math.round(patterns.filter((pattern) => pattern.evidence.length > 0).length / patterns.length * 10000) / 100 : 100,
  };
};

export const buildPatternCatalog = (input: {
  facts: readonly DocumentaryFact[];
  sources: readonly PatternSourceReference[];
  version: string;
  generatedAt: string;
  priorCatalogId?: string | null;
  priorCatalog?: Readonly<PatternCatalog> | null;
}): PatternCatalog => {
  const sources = [...input.sources].sort((left, right) => left.sourceId.localeCompare(right.sourceId));
  const priorPatterns = new Map((input.priorCatalog?.patterns ?? []).map((pattern) => [pattern.patternId, pattern]));
  const patterns = consolidateDocumentaryFacts(input.facts, sources).map((pattern) => {
    const prior = priorPatterns.get(pattern.patternId);
    if (!prior) return pattern;
    if (prior.provenance.recordDigest === pattern.provenance.recordDigest) return { ...pattern, version: prior.version };
    const [major, minor] = prior.version.split(".").map(Number);
    return { ...pattern, version: `${major}.${minor + 1}.0` };
  });
  const graph = buildPatternGraph(patterns, sources);
  const relations = graph.edges;
  const digestInput = { version: input.version, sources, patterns, relations, graphDigest: graph.digest };
  const digest = documentaryDigest(digestInput);
  const catalogId = `DKC-${documentaryDigest([input.version, digest]).slice(5, 17).toUpperCase()}`;
  const shell = {
    contractVersion: DOCUMENTARY_KNOWLEDGE_SCHEMA_VERSION,
    catalogId,
    version: input.version,
    generatedAt: input.generatedAt,
    priorCatalogId: input.priorCatalogId ?? input.priorCatalog?.catalogId ?? null,
    sourceCatalog: sources,
    patterns,
    relations,
    graph,
    statistics: computePatternStatistics(patterns, sources, relations),
    digest,
    boundary: "DOCUMENTARY_KNOWLEDGE_ONLY_NOT_SCIENCE_NOT_RULE_NOT_DECISION" as const,
  };
  return { ...shell, audit: auditPatternCatalog(shell) };
};

export const queryPatternCatalog = (catalog: PatternCatalog, query: PatternQuery = {}): PatternQueryResult => {
  const text = comparableDocumentaryText(query.text ?? "");
  const relatedIds = query.relatedTo ? new Set(catalog.relations.filter((edge) => edge.fromId === query.relatedTo || edge.toId === query.relatedTo).flatMap((edge) => [edge.fromId, edge.toId])) : null;
  const patterns = catalog.patterns.filter((pattern) => {
    const searchable = comparableDocumentaryText([pattern.name, pattern.description, pattern.category, ...pattern.limitations].join(" "));
    return (!text || searchable.includes(text))
      && (!query.categories?.length || query.categories.includes(pattern.category))
      && (!query.statuses?.length || query.statuses.includes(pattern.status))
      && (!query.origins?.length || query.origins.includes(pattern.origin))
      && (!query.confidence?.length || query.confidence.includes(pattern.confidence))
      && (!query.sourceIds?.length || query.sourceIds.some((sourceId) => pattern.provenance.sourceIds.includes(sourceId)))
      && (!relatedIds || relatedIds.has(pattern.patternId));
  }).sort((left, right) => left.patternId.localeCompare(right.patternId));
  return { query, patternIds: patterns.map((pattern) => pattern.patternId), patterns, catalogDigest: catalog.digest };
};

export const lookupPattern = (catalog: PatternCatalog, patternId: string) => catalog.patterns.find((pattern) => pattern.patternId === patternId) ?? null;
export const lookupPatternProvenance = (catalog: PatternCatalog, patternId: string) => lookupPattern(catalog, patternId)?.provenance ?? null;
