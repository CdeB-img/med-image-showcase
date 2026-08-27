import { z } from "zod";
import {
  CRITIC_ISSUE_CODES,
  PROVIDER_EPISTEMIC_STATUSES,
  SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
  SEMANTIC_CRITIC_CHECKS,
  SEMANTIC_ELEMENT_TYPES,
  SEMANTIC_POLARITIES,
  SEMANTIC_STUDY_ROLES,
  type ScientificSemanticModel,
  type SemanticCriticResult,
  type SemanticReconstructionCandidate,
  type SemanticReconstructionRequest,
} from "./types.js";

export const MAX_SEMANTIC_REQUEST_BYTES = 96_000;
export const MAX_SEMANTIC_MESSAGES = 24;

const providerStatusSchema = z.enum(PROVIDER_EPISTEMIC_STATUSES);
const elementTypeSchema = z.enum(SEMANTIC_ELEMENT_TYPES);
const polaritySchema = z.enum(SEMANTIC_POLARITIES);
const studyRoleSchema = z.enum(SEMANTIC_STUDY_ROLES);

export const providerElementSchema = z.object({
  clientElementId: z.string().min(1).max(120),
  type: elementTypeSchema,
  canonicalMeaning: z.string().min(1).max(500),
  studyRole: studyRoleSchema,
  polarity: polaritySchema,
  inventoryItemIds: z.array(z.string().min(1).max(120)).max(20),
  sourceMessageId: z.string().max(120).nullable(),
  sourceText: z.string().max(1_000).nullable(),
  epistemicStatus: providerStatusSchema,
  confidence: z.number().min(0).max(1),
  inferenceReason: z.string().max(1_000).nullable(),
  requiresConfirmation: z.boolean(),
  supersedesElementIds: z.array(z.string().min(1).max(160)).max(50),
}).strict();

export const providerRelationSchema = z.object({
  clientRelationId: z.string().min(1).max(120),
  sourceClientElementId: z.string().min(1).max(120),
  targetClientElementId: z.string().min(1).max(120),
  relationType: z.string().min(1).max(120),
  polarity: polaritySchema,
  inventoryRelationIds: z.array(z.string().min(1).max(120)).max(20),
  epistemicStatus: providerStatusSchema,
  confidence: z.number().min(0).max(1),
  inferenceReason: z.string().max(1_000).nullable(),
  requiresConfirmation: z.boolean(),
}).strict();

const routeSchema = z.object({
  route: z.enum(["UNDERSTAND", "FORMALIZE_IDEA", "DESIGN_STUDY", "DOCUMENT", "REVIEW_REROUTE"]),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1).max(1_000),
  expectedCapabilities: z.array(z.string().min(1).max(120)).max(20),
}).strict();

const inventoryItemSchema = z.object({
  inventoryItemId: z.string().min(1).max(120),
  sourceMessageId: z.string().min(1).max(120),
  sourceText: z.string().min(1).max(1_000),
  normalizedLabel: z.string().min(1).max(500),
  localRole: z.string().min(1).max(160),
  polarity: polaritySchema,
  modifiers: z.array(z.string().min(1).max(300)).max(30),
  linkedInventoryItemIds: z.array(z.string().min(1).max(120)).max(30),
}).strict();

const inventoryRelationSchema = z.object({
  inventoryRelationId: z.string().min(1).max(120),
  sourceInventoryItemId: z.string().min(1).max(120),
  targetInventoryItemId: z.string().min(1).max(120),
  sourceMessageId: z.string().min(1).max(120),
  sourceText: z.string().min(1).max(1_000),
  normalizedRelation: z.string().min(1).max(160),
  polarity: polaritySchema,
}).strict();

const semanticInventorySchema = z.object({
  explicitFragments: z.array(inventoryItemSchema).min(1).max(160),
  explicitRelations: z.array(inventoryRelationSchema).max(220),
}).strict().superRefine((inventory, context) => {
  const itemIds = inventory.explicitFragments.map((item) => item.inventoryItemId);
  if (new Set(itemIds).size !== itemIds.length) context.addIssue({ code: "custom", message: "DUPLICATE_INVENTORY_ITEM_ID", path: ["explicitFragments"] });
  const knownItems = new Set(itemIds);
  inventory.explicitFragments.forEach((item, index) => item.linkedInventoryItemIds.forEach((id) => {
    if (!knownItems.has(id)) context.addIssue({ code: "custom", message: "INVENTORY_LINK_UNKNOWN", path: ["explicitFragments", index, "linkedInventoryItemIds"] });
  }));
  const relationIds = inventory.explicitRelations.map((item) => item.inventoryRelationId);
  if (new Set(relationIds).size !== relationIds.length) context.addIssue({ code: "custom", message: "DUPLICATE_INVENTORY_RELATION_ID", path: ["explicitRelations"] });
  inventory.explicitRelations.forEach((relation, index) => {
    if (!knownItems.has(relation.sourceInventoryItemId) || !knownItems.has(relation.targetInventoryItemId)) {
      context.addIssue({ code: "custom", message: "INVENTORY_RELATION_ENDPOINT_UNKNOWN", path: ["explicitRelations", index] });
    }
  });
});

export const semanticReconstructionCandidateSchema = z.object({
  candidateId: z.string().min(1).max(120),
  language: z.enum(["fr", "en"]),
  normalizedMeaning: z.string().min(1).max(4_000),
  summaryForUser: z.string().min(1).max(4_000),
  semanticInventory: semanticInventorySchema,
  elements: z.array(providerElementSchema).min(1).max(160),
  relations: z.array(providerRelationSchema).max(220),
  missingConcepts: z.array(z.string().max(500)).max(50),
  ellipses: z.array(z.string().max(500)).max(50),
  ambiguities: z.array(z.string().max(500)).max(50),
  unknowns: z.array(z.string().max(500)).max(50),
  contradictions: z.array(z.string().max(1_000)).max(50),
  knowledgeRequests: z.array(z.object({ elementClientIds: z.array(z.string().max(120)).max(30), purpose: z.string().min(1).max(1_000) }).strict()).max(50),
  clarificationCandidates: z.array(z.object({ question: z.string().min(1).max(1_000), reason: z.string().min(1).max(1_000), resolvesClientElementIds: z.array(z.string().max(120)).max(30) }).strict()).max(20),
  routeProposal: routeSchema,
  semanticWarnings: z.array(z.string().max(1_000)).max(50),
}).strict().superRefine((value, context) => {
  const elementIds = value.elements.map((item) => item.clientElementId);
  if (new Set(elementIds).size !== elementIds.length) context.addIssue({ code: "custom", message: "DUPLICATE_ELEMENT_ID", path: ["elements"] });
  const relationIds = value.relations.map((item) => item.clientRelationId);
  if (new Set(relationIds).size !== relationIds.length) context.addIssue({ code: "custom", message: "DUPLICATE_RELATION_ID", path: ["relations"] });
  const knownElements = new Set(elementIds);
  const knownInventoryItems = new Set(value.semanticInventory.explicitFragments.map((item) => item.inventoryItemId));
  const knownInventoryRelations = new Set(value.semanticInventory.explicitRelations.map((item) => item.inventoryRelationId));
  value.elements.forEach((element, index) => {
    if (element.epistemicStatus === "EXPLICIT_USER_STATED" && element.inventoryItemIds.length === 0) {
      context.addIssue({ code: "custom", message: "EXPLICIT_ELEMENT_INVENTORY_REQUIRED", path: ["elements", index, "inventoryItemIds"] });
    }
    if (element.inventoryItemIds.some((id) => !knownInventoryItems.has(id))) {
      context.addIssue({ code: "custom", message: "ELEMENT_INVENTORY_ITEM_UNKNOWN", path: ["elements", index, "inventoryItemIds"] });
    }
  });
  value.relations.forEach((relation, index) => {
    if (!knownElements.has(relation.sourceClientElementId) || !knownElements.has(relation.targetClientElementId)) {
      context.addIssue({ code: "custom", message: "RELATION_ENDPOINT_UNKNOWN", path: ["relations", index] });
    }
    if (relation.epistemicStatus === "EXPLICIT_USER_STATED" && relation.inventoryRelationIds.length === 0) {
      context.addIssue({ code: "custom", message: "EXPLICIT_RELATION_INVENTORY_REQUIRED", path: ["relations", index, "inventoryRelationIds"] });
    }
    if (relation.inventoryRelationIds.some((id) => !knownInventoryRelations.has(id))) {
      context.addIssue({ code: "custom", message: "RELATION_INVENTORY_ITEM_UNKNOWN", path: ["relations", index, "inventoryRelationIds"] });
    }
  });
});

const criticIssueSchema = z.object({
  code: z.enum(CRITIC_ISSUE_CODES),
  severity: z.enum(["INFO", "WARNING", "CRITICAL"]),
  elementClientIds: z.array(z.string().max(120)).max(30),
  description: z.string().min(1).max(1_000),
  recommendedAction: z.string().min(1).max(1_000),
  resolved: z.boolean(),
}).strict();

const criticRepairSchema = z.object({
  repairId: z.string().min(1).max(120),
  action: z.enum(["UPSERT_INVENTORY_FRAGMENT", "UPSERT_INVENTORY_RELATION", "UPSERT_ELEMENT", "UPSERT_RELATION", "ADD_AMBIGUITY", "SET_ROUTE"]),
  reason: z.string().min(1).max(1_000),
  sourceInventoryItemIds: z.array(z.string().min(1).max(120)).max(30),
  sourceInventoryRelationIds: z.array(z.string().min(1).max(120)).max(30),
  inventoryItemId: z.string().min(1).max(120).nullable().default(null),
  inventorySourceMessageId: z.string().min(1).max(120).nullable().default(null),
  inventorySourceText: z.string().min(1).max(1_000).nullable().default(null),
  inventoryNormalizedLabel: z.string().min(1).max(500).nullable().default(null),
  inventoryLocalRole: z.string().min(1).max(160).nullable().default(null),
  inventoryPolarity: z.enum(SEMANTIC_POLARITIES).nullable().default(null),
  inventoryModifiers: z.array(z.string().min(1).max(300)).max(30).default([]),
  inventoryLinkedItemIds: z.array(z.string().min(1).max(120)).max(30).default([]),
  inventoryRelationId: z.string().min(1).max(120).nullable().default(null),
  inventoryRelationSourceItemId: z.string().min(1).max(120).nullable().default(null),
  inventoryRelationTargetItemId: z.string().min(1).max(120).nullable().default(null),
  inventoryRelationSourceMessageId: z.string().min(1).max(120).nullable().default(null),
  inventoryRelationSourceText: z.string().min(1).max(1_000).nullable().default(null),
  inventoryNormalizedRelation: z.string().min(1).max(160).nullable().default(null),
  inventoryRelationPolarity: z.enum(SEMANTIC_POLARITIES).nullable().default(null),
  elementClientElementId: z.string().min(1).max(120).nullable(),
  elementType: z.enum(SEMANTIC_ELEMENT_TYPES).nullable(),
  elementCanonicalMeaning: z.string().min(1).max(2_000).nullable(),
  elementStudyRole: z.enum(SEMANTIC_STUDY_ROLES).nullable(),
  elementPolarity: z.enum(SEMANTIC_POLARITIES).nullable(),
  elementInventoryItemIds: z.array(z.string().min(1).max(120)).max(30),
  elementSourceMessageId: z.string().min(1).max(120).nullable(),
  elementSourceText: z.string().min(1).max(2_000).nullable(),
  elementEpistemicStatus: z.enum(PROVIDER_EPISTEMIC_STATUSES).nullable(),
  elementConfidence: z.number().min(0).max(1).nullable(),
  elementInferenceReason: z.string().min(1).max(2_000).nullable(),
  elementRequiresConfirmation: z.boolean().nullable(),
  elementSupersedesElementIds: z.array(z.string().min(1).max(120)).max(30),
  relationClientRelationId: z.string().min(1).max(120).nullable(),
  relationSourceClientElementId: z.string().min(1).max(120).nullable(),
  relationTargetClientElementId: z.string().min(1).max(120).nullable(),
  relationType: z.string().min(1).max(120).nullable(),
  relationPolarity: z.enum(SEMANTIC_POLARITIES).nullable(),
  relationInventoryRelationIds: z.array(z.string().min(1).max(120)).max(30),
  relationEpistemicStatus: z.enum(PROVIDER_EPISTEMIC_STATUSES).nullable(),
  relationConfidence: z.number().min(0).max(1).nullable(),
  relationInferenceReason: z.string().min(1).max(2_000).nullable(),
  relationRequiresConfirmation: z.boolean().nullable(),
  ambiguity: z.string().max(1_000).nullable(),
  route: z.enum(["UNDERSTAND", "FORMALIZE_IDEA", "DESIGN_STUDY", "DOCUMENT", "REVIEW_REROUTE"]).nullable(),
  routeConfidence: z.number().min(0).max(1).nullable(),
  routeReason: z.string().min(1).max(1_000).nullable(),
  routeExpectedCapabilities: z.array(z.string().min(1).max(200)).max(30),
}).strict();

export const semanticCriticResultSchema = z.object({
  criticId: z.string().min(1).max(120),
  verdict: z.enum(["ACCEPT", "REVISE", "CLARIFICATION_REQUIRED"]),
  checklist: z.array(z.object({
    check: z.enum(SEMANTIC_CRITIC_CHECKS),
    result: z.enum(["PASS", "FAIL", "NOT_APPLICABLE"]),
    evidence: z.string().min(1).max(1_000),
  }).strict()).length(SEMANTIC_CRITIC_CHECKS.length),
  missingExplicitSourceFragments: z.array(z.object({
    sourceMessageId: z.string().min(1).max(120),
    sourceText: z.string().min(1).max(1_000),
    normalizedMeaning: z.string().min(1).max(500),
    reason: z.string().min(1).max(1_000),
    suggestedLocalRole: z.string().min(1).max(160),
    confidence: z.number().min(0).max(1),
  }).strict()).max(80).default([]),
  issues: z.array(criticIssueSchema).max(100),
  proposedRepairs: z.array(criticRepairSchema).max(100),
  criticSummary: z.string().min(1).max(2_000),
}).strict().superRefine((value, context) => {
  const checks = value.checklist.map((item) => item.check);
  if (new Set(checks).size !== SEMANTIC_CRITIC_CHECKS.length || SEMANTIC_CRITIC_CHECKS.some((check) => !checks.includes(check))) {
    context.addIssue({ code: "custom", message: "CRITIC_CHECKLIST_INCOMPLETE", path: ["checklist"] });
  }
  const failed = value.checklist.some((item) => item.result === "FAIL");
  if (failed && value.verdict === "ACCEPT") context.addIssue({ code: "custom", message: "CRITIC_ACCEPT_WITH_FAILED_CHECK", path: ["verdict"] });
  if (value.verdict === "REVISE" && value.proposedRepairs.length === 0) context.addIssue({ code: "custom", message: "CRITIC_REVISE_WITHOUT_REPAIR", path: ["proposedRepairs"] });
});

const messageSchema = z.object({
  messageId: z.string().min(1).max(120),
  role: z.enum(["USER", "NOXIA"]),
  content: z.string().min(1).max(4_000),
  createdAt: z.string().min(1).max(100),
}).strict();

export const semanticReconstructionRequestSchema = z.object({
  schemaVersion: z.literal(SCIENTIFIC_SEMANTIC_SCHEMA_VERSION),
  sessionId: z.string().min(1).max(120),
  language: z.enum(["fr", "en"]),
  messages: z.array(messageSchema).min(1).max(MAX_SEMANTIC_MESSAGES),
  previousModel: z.unknown().nullable(),
}).strict().superRefine((value, context) => {
  if (!value.messages.some((item) => item.role === "USER")) context.addIssue({ code: "custom", message: "USER_MESSAGE_REQUIRED", path: ["messages"] });
});

export const parseSemanticReconstructionRequest = (value: unknown): { success: true; data: SemanticReconstructionRequest } | { success: false } => {
  const parsed = semanticReconstructionRequestSchema.safeParse(value);
  if (!parsed.success) return { success: false };
  const previousModel = parsed.data.previousModel as ScientificSemanticModel | null;
  return { success: true as const, data: { ...parsed.data, previousModel } as SemanticReconstructionRequest };
};

export const parseSemanticReconstructionCandidate = (value: unknown) => semanticReconstructionCandidateSchema.parse(value) as SemanticReconstructionCandidate;
export const parseSemanticCriticResult = (value: unknown) => semanticCriticResultSchema.parse(value) as SemanticCriticResult;

const jsonObject = (properties: Record<string, unknown>, required = Object.keys(properties)) => ({ type: "object", additionalProperties: false, properties, required });
const stringArray = { type: "array", items: { type: "string" } } as const;
const nullableString = { type: ["string", "null"] } as const;
const polarityJson = { type: "string", enum: SEMANTIC_POLARITIES } as const;
const routeJson = jsonObject({
  route: { type: "string", enum: ["UNDERSTAND", "FORMALIZE_IDEA", "DESIGN_STUDY", "DOCUMENT", "REVIEW_REROUTE"] },
  confidence: { type: "number", minimum: 0, maximum: 1 }, reason: { type: "string" }, expectedCapabilities: stringArray,
});
const providerElementJsonSchema = jsonObject({
  clientElementId: { type: "string" }, type: { type: "string", enum: SEMANTIC_ELEMENT_TYPES }, canonicalMeaning: { type: "string" },
  studyRole: { type: "string", enum: SEMANTIC_STUDY_ROLES }, polarity: polarityJson, inventoryItemIds: stringArray,
  sourceMessageId: nullableString, sourceText: nullableString, epistemicStatus: { type: "string", enum: PROVIDER_EPISTEMIC_STATUSES },
  confidence: { type: "number", minimum: 0, maximum: 1 }, inferenceReason: nullableString, requiresConfirmation: { type: "boolean" }, supersedesElementIds: stringArray,
});
const providerRelationJsonSchema = jsonObject({
  clientRelationId: { type: "string" }, sourceClientElementId: { type: "string" }, targetClientElementId: { type: "string" }, relationType: { type: "string" },
  polarity: polarityJson, inventoryRelationIds: stringArray, epistemicStatus: { type: "string", enum: PROVIDER_EPISTEMIC_STATUSES },
  confidence: { type: "number", minimum: 0, maximum: 1 }, inferenceReason: nullableString, requiresConfirmation: { type: "boolean" },
});
const inventoryItemJson = jsonObject({ inventoryItemId: { type: "string" }, sourceMessageId: { type: "string" }, sourceText: { type: "string" }, normalizedLabel: { type: "string" }, localRole: { type: "string" }, polarity: polarityJson, modifiers: stringArray, linkedInventoryItemIds: stringArray });
const inventoryRelationJson = jsonObject({ inventoryRelationId: { type: "string" }, sourceInventoryItemId: { type: "string" }, targetInventoryItemId: { type: "string" }, sourceMessageId: { type: "string" }, sourceText: { type: "string" }, normalizedRelation: { type: "string" }, polarity: polarityJson });

export const SEMANTIC_RECONSTRUCTION_JSON_SCHEMA = jsonObject({
  candidateId: { type: "string" }, language: { type: "string", enum: ["fr", "en"] }, normalizedMeaning: { type: "string" }, summaryForUser: { type: "string" },
  semanticInventory: jsonObject({ explicitFragments: { type: "array", items: inventoryItemJson }, explicitRelations: { type: "array", items: inventoryRelationJson } }),
  elements: { type: "array", items: providerElementJsonSchema }, relations: { type: "array", items: providerRelationJsonSchema },
  missingConcepts: stringArray, ellipses: stringArray, ambiguities: stringArray, unknowns: stringArray, contradictions: stringArray,
  knowledgeRequests: { type: "array", items: jsonObject({ elementClientIds: stringArray, purpose: { type: "string" } }) },
  clarificationCandidates: { type: "array", items: jsonObject({ question: { type: "string" }, reason: { type: "string" }, resolvesClientElementIds: stringArray }) },
  routeProposal: routeJson, semanticWarnings: stringArray,
});

const criticChecklistJson = jsonObject({ check: { type: "string", enum: SEMANTIC_CRITIC_CHECKS }, result: { type: "string", enum: ["PASS", "FAIL", "NOT_APPLICABLE"] }, evidence: { type: "string" } });
const criticIssueJson = jsonObject({ code: { type: "string", enum: CRITIC_ISSUE_CODES }, severity: { type: "string", enum: ["INFO", "WARNING", "CRITICAL"] }, elementClientIds: stringArray, description: { type: "string" }, recommendedAction: { type: "string" }, resolved: { type: "boolean" } });
const criticRepairJson = jsonObject({
  repairId: { type: "string" }, action: { type: "string", enum: ["UPSERT_INVENTORY_FRAGMENT", "UPSERT_INVENTORY_RELATION", "UPSERT_ELEMENT", "UPSERT_RELATION", "ADD_AMBIGUITY", "SET_ROUTE"] }, reason: { type: "string" },
  sourceInventoryItemIds: stringArray, sourceInventoryRelationIds: stringArray,
  inventoryItemId: nullableString,
  inventorySourceMessageId: nullableString,
  inventorySourceText: nullableString,
  inventoryNormalizedLabel: nullableString,
  inventoryLocalRole: nullableString,
  inventoryPolarity: { type: ["string", "null"], enum: [...SEMANTIC_POLARITIES, null] },
  inventoryModifiers: stringArray,
  inventoryLinkedItemIds: stringArray,
  inventoryRelationId: nullableString,
  inventoryRelationSourceItemId: nullableString,
  inventoryRelationTargetItemId: nullableString,
  inventoryRelationSourceMessageId: nullableString,
  inventoryRelationSourceText: nullableString,
  inventoryNormalizedRelation: nullableString,
  inventoryRelationPolarity: { type: ["string", "null"], enum: [...SEMANTIC_POLARITIES, null] },
  elementClientElementId: nullableString,
  elementType: { type: ["string", "null"], enum: [...SEMANTIC_ELEMENT_TYPES, null] },
  elementCanonicalMeaning: nullableString,
  elementStudyRole: { type: ["string", "null"], enum: [...SEMANTIC_STUDY_ROLES, null] },
  elementPolarity: { type: ["string", "null"], enum: [...SEMANTIC_POLARITIES, null] },
  elementInventoryItemIds: stringArray,
  elementSourceMessageId: nullableString,
  elementSourceText: nullableString,
  elementEpistemicStatus: { type: ["string", "null"], enum: [...PROVIDER_EPISTEMIC_STATUSES, null] },
  elementConfidence: { type: ["number", "null"] },
  elementInferenceReason: nullableString,
  elementRequiresConfirmation: { type: ["boolean", "null"] },
  elementSupersedesElementIds: stringArray,
  relationClientRelationId: nullableString,
  relationSourceClientElementId: nullableString,
  relationTargetClientElementId: nullableString,
  relationType: nullableString,
  relationPolarity: { type: ["string", "null"], enum: [...SEMANTIC_POLARITIES, null] },
  relationInventoryRelationIds: stringArray,
  relationEpistemicStatus: { type: ["string", "null"], enum: [...PROVIDER_EPISTEMIC_STATUSES, null] },
  relationConfidence: { type: ["number", "null"] },
  relationInferenceReason: nullableString,
  relationRequiresConfirmation: { type: ["boolean", "null"] },
  ambiguity: nullableString,
  route: { type: ["string", "null"], enum: ["UNDERSTAND", "FORMALIZE_IDEA", "DESIGN_STUDY", "DOCUMENT", "REVIEW_REROUTE", null] },
  routeConfidence: { type: ["number", "null"] },
  routeReason: nullableString,
  routeExpectedCapabilities: stringArray,
});

export const SEMANTIC_CRITIC_JSON_SCHEMA = jsonObject({
  criticId: { type: "string" }, verdict: { type: "string", enum: ["ACCEPT", "REVISE", "CLARIFICATION_REQUIRED"] },
  checklist: { type: "array", items: criticChecklistJson },
  missingExplicitSourceFragments: { type: "array", items: jsonObject({
    sourceMessageId: { type: "string" }, sourceText: { type: "string" }, normalizedMeaning: { type: "string" },
    reason: { type: "string" }, suggestedLocalRole: { type: "string" }, confidence: { type: "number", minimum: 0, maximum: 1 },
  }) },
  issues: { type: "array", items: criticIssueJson }, proposedRepairs: { type: "array", items: criticRepairJson }, criticSummary: { type: "string" },
});
