import { z } from "zod";
import { logicalDigest, normalizeScientificText, uniqueSorted } from "./canonical";
import { createKnowledgeContextPackage, type KnowledgeContextInput } from "./context-package";
import { classifySensitivity } from "./privacy";
import { KNOWLEDGE_RELATION_MAX_LENGTH, SCIENTIFIC_OBJECT_ORIGINAL_TERM_MAX_LENGTH } from "./scientific-object-boundary.js";
import { KNOWLEDGE_ENGINE_VERSION, type ExternalSearchPolicy, type KnowledgePurpose, type KnowledgeRequest, type KnowledgeRequestType, type ScientificObjectRef } from "./types";
import { hasExplicitComparisonRequest } from "@/lib/scientific-request-language";

const scientificObjectSchema = z.object({
  objectId: z.string().min(1).max(200),
  originalTerm: z.string().min(1).max(SCIENTIFIC_OBJECT_ORIGINAL_TERM_MAX_LENGTH),
  role: z.enum(["SUBJECT", "COMPARATOR", "CONTEXT", "UNKNOWN"]),
}).strict();

export const knowledgeRequestSchema = z.object({
  contractVersion: z.literal(KNOWLEDGE_ENGINE_VERSION),
  requestId: z.string().min(1).max(200),
  requestRevision: z.number().int().min(1),
  researchProjectId: z.string().min(1).max(200).optional(),
  strategyVersion: z.string().min(1).max(100).optional(),
  originalQuestion: z.string().min(3).max(4_000),
  normalizedQuestion: z.string().min(3).max(4_000),
  requestType: z.enum(["EXPLAIN", "COMPARE", "SUPPORT_REASONING", "CHECK_APPLICABILITY", "IDENTIFY_GAP"]),
  knowledgePurpose: z.enum(["UNDERSTAND", "COMPARE", "CLARIFY_SELECTION", "CHECK_APPLICABILITY", "IDENTIFY_GAP"]),
  consumer: z.enum(["PROTOCOL_DESIGNER_UNDERSTAND", "SCIENTIFIC_THINKING_ENGINE", "IMAGING_STUDY_DESIGNER", "RESEARCH_PROJECT_CONSTRUCTION", "KNOWLEDGE_ENGINE_TEST"]),
  scientificObjects: z.array(scientificObjectSchema).min(1).max(30),
  relations: z.array(z.string().min(1).max(KNOWLEDGE_RELATION_MAX_LENGTH)).max(30),
  requestedClaimType: z.enum(["DEFINITION", "COMPARISON", "APPLICABILITY", "BEST_OPTION", "GAP"]),
  context: z.object({ contextId: z.string(), version: z.literal(KNOWLEDGE_ENGINE_VERSION) }).passthrough(),
  exclusions: z.array(z.string().max(300)).max(50),
  unknowns: z.array(z.string().max(300)).max(50),
  expectedUse: z.enum(["GENERAL_SCIENTIFIC_UNDERSTANDING", "METHODOLOGICAL_REASONING"]),
  freshnessRequirement: z.string().min(1).max(100),
  sensitivityClassification: z.enum(["PUBLIC", "INTERNAL", "CONFIDENTIAL_PROJECT", "RESTRICTED_PERSONAL"]),
  externalSearchPolicy: z.enum(["INTERNAL_ONLY", "EXTERNAL_ALLOWED", "EXTERNAL_REQUIRED", "EXTERNAL_FORBIDDEN"]),
  traceId: z.string().min(1).max(200),
  createdAt: z.string().datetime(),
}).strict();

export type KnowledgeRequestInput = {
  originalQuestion: string;
  scientificObjectTerms: Array<{ term: string; role?: ScientificObjectRef["role"]; objectId?: string }>;
  context?: KnowledgeContextInput;
  relations?: string[];
  exclusions?: string[];
  unknowns?: string[];
  researchProjectId?: string;
  strategyVersion?: string;
  consumer?: KnowledgeRequest["consumer"];
  freshnessRequirement?: string;
  externalSearchPolicy?: ExternalSearchPolicy;
  createdAt?: string;
};

const classifyPurpose = (question: string): { purpose: KnowledgePurpose; requestType: KnowledgeRequestType; claimType: KnowledgeRequest["requestedClaimType"] } => {
  const text = question.toLocaleLowerCase("fr-FR");
  if (/\b(meilleur|meilleure|optimal|optimale|choisir)\b/.test(text)) return { purpose: "CLARIFY_SELECTION", requestType: "IDENTIFY_GAP", claimType: "BEST_OPTION" };
  if (hasExplicitComparisonRequest(text)) return { purpose: "COMPARE", requestType: "COMPARE", claimType: "COMPARISON" };
  if (/\b(applicab|valable|transpos|chez)\b/.test(text)) return { purpose: "CHECK_APPLICABILITY", requestType: "CHECK_APPLICABILITY", claimType: "APPLICABILITY" };
  return { purpose: "UNDERSTAND", requestType: "EXPLAIN", claimType: "DEFINITION" };
};

export const createKnowledgeRequest = (input: KnowledgeRequestInput): KnowledgeRequest => {
  const originalQuestion = normalizeScientificText(input.originalQuestion);
  if (!originalQuestion) throw new Error("KNOWLEDGE_REQUEST_EMPTY_QUESTION");
  const sensitivityClassification = input.researchProjectId || input.strategyVersion
    ? "CONFIDENTIAL_PROJECT" as const
    : classifySensitivity(originalQuestion);
  const classification = classifyPurpose(originalQuestion);
  const context = createKnowledgeContextPackage(originalQuestion, classification.purpose, input.context);
  const scientificObjects = input.scientificObjectTerms.map(({ term, role = "UNKNOWN", objectId }) => {
    const originalTerm = normalizeScientificText(term);
    return { objectId: objectId ? normalizeScientificText(objectId) : `input-object:${logicalDigest(originalTerm)}`, originalTerm, role };
  }).filter((item) => item.originalTerm);
  if (!scientificObjects.length) scientificObjects.push({ objectId: `input-object:${logicalDigest("UNKNOWN_SCIENTIFIC_OBJECT")}`, originalTerm: "UNKNOWN_SCIENTIFIC_OBJECT", role: "UNKNOWN" });
  const material = {
    originalQuestion,
    scientificObjects,
    relations: uniqueSorted((input.relations ?? []).map(normalizeScientificText).filter(Boolean)),
    contextDigest: context.digest,
    exclusions: uniqueSorted([...(input.exclusions ?? []), ...context.explicitExclusions]),
    unknowns: uniqueSorted([...(input.unknowns ?? []), ...context.unknowns]),
    classification,
    consumer: input.consumer ?? "PROTOCOL_DESIGNER_UNDERSTAND",
    freshnessRequirement: input.freshnessRequirement ?? "AS_OF_2026_08_09",
  };
  const digest = logicalDigest(material);
  const request: KnowledgeRequest = {
    contractVersion: KNOWLEDGE_ENGINE_VERSION,
    requestId: `knowledge-request:${digest}`,
    requestRevision: 1,
    researchProjectId: input.researchProjectId,
    strategyVersion: input.strategyVersion,
    originalQuestion,
    normalizedQuestion: originalQuestion,
    requestType: classification.requestType,
    knowledgePurpose: classification.purpose,
    consumer: input.consumer ?? "PROTOCOL_DESIGNER_UNDERSTAND",
    scientificObjects,
    relations: material.relations,
    requestedClaimType: classification.claimType,
    context,
    exclusions: material.exclusions,
    unknowns: material.unknowns,
    expectedUse: classification.purpose === "UNDERSTAND" ? "GENERAL_SCIENTIFIC_UNDERSTANDING" : "METHODOLOGICAL_REASONING",
    freshnessRequirement: material.freshnessRequirement,
    sensitivityClassification,
    externalSearchPolicy: input.externalSearchPolicy ?? "INTERNAL_ONLY",
    traceId: `knowledge-trace:${digest}`,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
  return parseKnowledgeRequest(request);
};

export const parseKnowledgeRequest = (value: unknown) => knowledgeRequestSchema.parse(value) as KnowledgeRequest;
export const safeParseKnowledgeRequest = (value: unknown) => knowledgeRequestSchema.safeParse(value);
