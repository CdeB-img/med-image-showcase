import type { RuntimeKnowledgeConclusion } from "./types";

export const structuredSemanticRelation = (value: unknown): RuntimeKnowledgeConclusion["semanticRelation"] => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return typeof record.subject === "string"
    && typeof record.predicate === "string"
    && typeof record.object === "string"
    ? { subject: record.subject, predicate: record.predicate, object: record.object }
    : null;
};

export const isComparativeSemanticRelation = (value: unknown) => {
  const relation = structuredSemanticRelation(value);
  return Boolean(relation && /(?:COMPARE|VERSUS|AGREEMENT|CORRELAT|DISTINCT|EQUIVAL|DIFFER)/iu.test(relation.predicate));
};
