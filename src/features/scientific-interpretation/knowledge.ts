import { executeKnowledgeEngine, uniqueSorted, type ContextDimensionName, type KnowledgeContextInput, type KnowledgeResult } from "@/features/knowledge-engine";
import type { ScientificContributionItem, ScientificInterpretationContributionEnvelope } from "./contracts";

export type ScientificInterpretationKnowledgeRequest = {
  requestId: string;
  contributionId: string;
  originalQuestion: string;
  scientificObjectTerms: Array<{ term: string; role: "SUBJECT" | "COMPARATOR" | "CONTEXT" }>;
  relations: string[];
  context: KnowledgeContextInput;
  unknowns: string[];
  consumer: "PROTOCOL_DESIGNER_UNDERSTAND";
  provenanceRefs: string[];
  ownership: "KNOWLEDGE";
  projectDecisionAuthorized: false;
};

export type ScientificInterpretationKnowledgeLink = {
  requestId: string;
  contributionId: string;
  knowledgeResultRef: string;
  knowledgeResultDigest: string;
  coverageStatus: KnowledgeResult["coverageStatus"];
  attribution: "KNOWLEDGE_SUPPORT_NOT_USER_STATEMENT";
  projectDecisionAuthorized: false;
};

const TYPE_TO_CONTEXT: Partial<Record<string, ContextDimensionName>> = {
  CONDITION: "pathology", CLINICAL_CONDITION: "pathology", POPULATION: "population", PHENOMENON: "phenomenon",
  BIOMARKER: "biomarker", MODALITY: "modality", IMAGING_MODALITY: "modality", METHOD: "technique", TIMING: "timing",
  SCIENTIFIC_INTENT: "objective", ENDPOINT: "criterion", INTERVENTION: "intervention",
};

const uniqueItems = (contribution: ScientificInterpretationContributionEnvelope) => [...new Map([
  ...contribution.scientificContent.candidateObjects,
  ...contribution.scientificContent.explicitStatements,
  ...contribution.scientificContent.inferredContext,
  ...contribution.scientificContent.contextualCandidates,
].map((item) => [item.itemId, item])).values()];

const active = (item: ScientificContributionItem) => item.epistemicBoundary.activeState !== false && item.epistemicBoundary.epistemicStatus !== "REJECTED_BY_USER";

export const contributionToKnowledgeRequest = (contribution: ScientificInterpretationContributionEnvelope): ScientificInterpretationKnowledgeRequest => {
  const items = uniqueItems(contribution).filter(active);
  const grouped = new Map<ContextDimensionName, string[]>();
  items.forEach((item) => {
    const dimension = item.proposedType ? TYPE_TO_CONTEXT[item.proposedType] : undefined;
    if (dimension) grouped.set(dimension, [...(grouped.get(dimension) ?? []), item.content]);
  });
  const primary = items.filter((item) => ["SCIENTIFIC_OBJECT", "PHENOMENON", "BIOMARKER", "CONDITION", "CLINICAL_CONDITION", "MODALITY", "IMAGING_MODALITY", "METHOD"].includes(item.proposedType ?? ""));
  const selected = primary.length ? primary : items.slice(0, 6);
  const byId = new Map(items.map((item) => [item.itemId, item]));
  const unknowns = uniqueSorted([
    ...contribution.scientificContent.unknowns.map((item) => item.content),
    ...contribution.scientificContent.missingInformation.map((item) => item.content),
  ].filter(Boolean));
  return {
    requestId: `knowledge-request:${contribution.identity.contributionDigest}`,
    contributionId: contribution.identity.contributionId,
    originalQuestion: contribution.source.originalRequest,
    scientificObjectTerms: selected.map((item, index) => ({
      term: item.content,
      role: item.studyRole === "COMPARATOR" || item.studyRole === "COMPARATOR_ARM" ? "COMPARATOR" : index === 0 ? "SUBJECT" : "CONTEXT",
    })),
    relations: contribution.scientificContent.candidateRelations.filter((item) => item.epistemicBoundary.activeState !== false).map((relation) =>
      `${byId.get(relation.sourceItemId)?.content ?? relation.sourceItemId} ${relation.relationType} ${byId.get(relation.targetItemId)?.content ?? relation.targetItemId}`),
    context: {
      ...Object.fromEntries([...grouped.entries()].map(([key, values]) => [key, uniqueSorted(values)])),
      unknowns,
      contradictions: contribution.scientificContent.openDecisions.filter((item) => item.proposedType === "CONTRADICTION").map((item) => item.content),
    } as KnowledgeContextInput,
    unknowns,
    consumer: "PROTOCOL_DESIGNER_UNDERSTAND",
    provenanceRefs: uniqueSorted([contribution.identity.contributionId, ...contribution.source.sourceRefs]),
    ownership: "KNOWLEDGE",
    projectDecisionAuthorized: false,
  };
};

export const executeContributionKnowledgeVerification = (contribution: ScientificInterpretationContributionEnvelope): ScientificInterpretationKnowledgeLink | null => {
  const request = contributionToKnowledgeRequest(contribution);
  if (!request.scientificObjectTerms.length) return null;
  const result = executeKnowledgeEngine({
    originalQuestion: request.originalQuestion,
    scientificObjectTerms: request.scientificObjectTerms,
    relations: request.relations,
    context: request.context,
    unknowns: request.unknowns,
    consumer: request.consumer,
    createdAt: contribution.identity.createdAt,
    strategyVersion: `contribution-${contribution.identity.contractVersion}`,
  });
  return {
    requestId: request.requestId,
    contributionId: contribution.identity.contributionId,
    knowledgeResultRef: result.resultId,
    knowledgeResultDigest: result.resultDigest,
    coverageStatus: result.coverageStatus,
    attribution: "KNOWLEDGE_SUPPORT_NOT_USER_STATEMENT",
    projectDecisionAuthorized: false,
  };
};
