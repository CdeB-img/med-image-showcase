import { z } from "zod";
import { logicalDigest } from "../knowledge-engine/canonical.js";
import type { HybridNativeExecution, HybridParsedState } from "./hybrid-adapter.js";
import type { ScientificInterpretationContributionEnvelope, ScientificInterpretationConversation } from "./contracts.js";

export const HYBRID_PRIMARY_RUNTIME_ID = "HYBRID_PRIMARY_STRUCTURED" as const;
export const HYBRID_PRIMARY_RUNTIME_VERSION = "1.1.0" as const;
export const HYBRID_PRIMARY_PROMPT_VERSION = "HYBRID-PRIMARY-STRUCTURED-1.0.0" as const;
export const EXPECTED_HYBRID_MODEL_IDENTITY = "gemini-3.5-flash-lite" as const;
export const HYBRID_PRIMARY_OUTPUT_FUNCTION_NAME = "final_result" as const;

export const HYBRID_PRIMARY_SYSTEM_PROMPT = `
You are NOXIA's primary scientific interpreter. Read the complete French or English research conversation and return only the structured scientific interpretation required by the response schema.

Preserve without silently completing:
- the global scientific intent and every explicit statement;
- scientific objects and directed relations;
- timing, comparison, negation, non-causality and conditionality;
- corrections, rejection, supersession and changes of mind;
- ambiguity, unknowns, missing information and blocking status;
- ownership and epistemic status;
- contextual candidates as candidates only;
- decisions that remain open and clarification needs.

Rules:
1. sourceText is either an exact contiguous excerpt of a declared sourceTurnId or null. Never invent a quotation.
2. EXPLICIT_USER_STATED is reserved for user content. Inference or domain knowledge never becomes explicit.
3. Local practice, institutional process, documentary pattern or Knowledge support never becomes a Project decision.
4. A principal candidate is not an adopted endpoint. Never emit PROJECT_ADOPTED and never choose an endpoint, method or biomarker for the researcher.
5. Method, quantitative image, measurement or biomarker, and endpoint are distinct conceptual planes.
6. Association, prediction and causality are distinct. Preserve an explicit rejection of causality.
7. Rejected or superseded material remains visible with activeState=false.
8. An unknown cannot become confirmed without a later source turn supplying it.
9. Partial or conditional availability remains literal and is not generalized.
10. Clarification needs describe an intent only; do not rank questions.

Do not access or assume a Research Project. Do not provide a protocol or recommendation. Return concise scientific content, not hidden reasoning.
`.trim();

const epistemicStatus = z.enum([
  "EXPLICIT_USER_STATED", "INFERRED_HIGH_CONFIDENCE", "INFERRED_CANDIDATE", "SUPPORTED_CANDIDATE",
  "UNSUPPORTED_CANDIDATE", "CONFIRMED_BY_USER", "REJECTED_BY_USER", "UNKNOWN", "AMBIGUOUS",
]);
const polarity = z.enum(["AFFIRMED", "NEGATED", "UNCERTAIN", "CONDITIONAL"]);
const nullableText = z.string().nullable();
const confidence = z.number().min(0).max(1).nullable();

const scientificElementSchema = z.object({
  elementId: z.string().min(1),
  content: z.string().min(1),
  semanticIdentity: nullableText,
  semanticType: z.string().min(1),
  studyRole: z.string().min(1),
  sourceTurnIds: z.array(z.string()),
  sourceText: nullableText,
  polarity,
  temporalContext: nullableText,
  ownership: z.string().min(1),
  epistemicStatus,
  activeState: z.boolean(),
  previousElementIds: z.array(z.string()),
  evidenceRefs: z.array(z.string()),
  confidence,
  adoptionStatus: nullableText,
  originStatus: nullableText,
  originType: nullableText,
  availabilityScope: nullableText,
  availabilityClaim: nullableText,
  decisionId: nullableText,
}).strict();

const relationSchema = z.object({
  relationId: z.string().min(1),
  sourceElementId: z.string().min(1),
  targetElementId: z.string().min(1),
  relationType: z.string().min(1),
  sourceTurnIds: z.array(z.string()),
  sourceText: nullableText,
  polarity,
  temporalContext: nullableText,
  ownership: z.string().min(1),
  epistemicStatus,
  activeState: z.boolean(),
  previousRelationIds: z.array(z.string()),
  evidenceRefs: z.array(z.string()),
  confidence,
}).strict();

const ambiguitySchema = z.object({
  ambiguityId: z.string().min(1), content: z.string().min(1), interpretations: z.array(z.string()),
  decisionalImpact: z.enum(["LOW", "MEDIUM", "HIGH", "UNKNOWN"]), sourceTurnIds: z.array(z.string()),
  sourceText: nullableText, status: z.enum(["OPEN", "RESOLVED"]), decisionId: nullableText,
}).strict();

const missingSchema = z.object({
  missingId: z.string().min(1), content: z.string().min(1), decisionalImpact: z.enum(["LOW", "MEDIUM", "HIGH", "UNKNOWN"]),
  blocking: z.boolean(), owner: z.string().min(1), sourceTurnIds: z.array(z.string()), sourceText: nullableText,
  epistemicStatus: z.enum(["UNKNOWN", "AMBIGUOUS"]),
}).strict();

const correctionSchema = z.object({
  correctionId: z.string().min(1), previousContent: z.string(), currentContent: z.string(),
  disposition: z.enum(["MODIFIED", "REJECTED", "SUPERSEDED", "CONFIRMED"]),
  previousSemanticIdentity: nullableText, currentSemanticIdentity: nullableText,
  sourceTurnIds: z.array(z.string()), sourceText: nullableText,
}).strict();

const ownershipSchema = z.object({
  statementId: z.string().min(1), content: z.string().min(1), ownership: z.string().min(1), epistemicStatus,
  sourceTurnIds: z.array(z.string()), sourceText: nullableText,
}).strict();

const openDecisionSchema = z.object({
  decisionId: z.string().min(1), content: z.string().min(1), affectedElementIds: z.array(z.string()),
  decisionOwner: z.string().min(1), status: z.enum(["OPEN", "CONFIRMED"]), sourceTurnIds: z.array(z.string()), sourceText: nullableText,
}).strict();

const clarificationSchema = z.object({
  clarificationId: z.string().min(1), targetUnknown: z.string().min(1),
  decisionalImpact: z.enum(["LOW", "MEDIUM", "HIGH", "UNKNOWN"]), affectedDecisions: z.array(z.string()),
  affectedBranches: z.array(z.string()), blocking: z.boolean(), candidateQuestionIntent: z.string().min(1), resolutionOwner: z.string().min(1),
}).strict();

export const hybridPrimaryInterpretationSchema = z.object({
  normalizedUnderstanding: z.string().min(1),
  scientificGoalCandidates: z.array(z.string()),
  studyIntentCandidates: z.array(z.string()),
  objects: z.array(scientificElementSchema),
  relations: z.array(relationSchema),
  explicitStatements: z.array(scientificElementSchema),
  inferredContext: z.array(scientificElementSchema),
  contextualCandidates: z.array(scientificElementSchema),
  negationsAndConstraints: z.array(scientificElementSchema),
  temporalElements: z.array(scientificElementSchema),
  ambiguities: z.array(ambiguitySchema),
  unknowns: z.array(missingSchema),
  missingInformation: z.array(missingSchema),
  correctionsAndSupersessions: z.array(correctionSchema),
  ownershipAndEpistemicStates: z.array(ownershipSchema),
  openDecisions: z.array(openDecisionSchema),
  clarificationNeeds: z.array(clarificationSchema),
}).strict();

const nullableStringJson = { anyOf: [{ type: "string" }, { type: "null" }] } as const;
const nullableNumberJson = { anyOf: [{ type: "number", minimum: 0, maximum: 1 }, { type: "null" }] } as const;
const stringArrayJson = { type: "array", items: { type: "string" } } as const;
const required = (properties: Record<string, unknown>) => Object.keys(properties);

const elementProperties = {
  elementId: { type: "string" }, content: { type: "string" }, semanticIdentity: nullableStringJson,
  semanticType: { type: "string" }, studyRole: { type: "string" }, sourceTurnIds: stringArrayJson,
  sourceText: nullableStringJson, polarity: { type: "string", enum: polarity.options }, temporalContext: nullableStringJson,
  ownership: { type: "string" }, epistemicStatus: { type: "string", enum: epistemicStatus.options }, activeState: { type: "boolean" },
  previousElementIds: stringArrayJson, evidenceRefs: stringArrayJson, confidence: nullableNumberJson,
  adoptionStatus: nullableStringJson, originStatus: nullableStringJson, originType: nullableStringJson,
  availabilityScope: nullableStringJson, availabilityClaim: nullableStringJson, decisionId: nullableStringJson,
};
const relationProperties = {
  relationId: { type: "string" }, sourceElementId: { type: "string" }, targetElementId: { type: "string" }, relationType: { type: "string" },
  sourceTurnIds: stringArrayJson, sourceText: nullableStringJson, polarity: { type: "string", enum: polarity.options }, temporalContext: nullableStringJson,
  ownership: { type: "string" }, epistemicStatus: { type: "string", enum: epistemicStatus.options }, activeState: { type: "boolean" },
  previousRelationIds: stringArrayJson, evidenceRefs: stringArrayJson, confidence: nullableNumberJson,
};

export const HYBRID_PRIMARY_INTERNAL_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  $defs: {
    ScientificElement: { type: "object", additionalProperties: false, properties: elementProperties, required: required(elementProperties) },
    ScientificRelation: { type: "object", additionalProperties: false, properties: relationProperties, required: required(relationProperties) },
    Ambiguity: { type: "object", additionalProperties: false, properties: {
      ambiguityId: { type: "string" }, content: { type: "string" }, interpretations: stringArrayJson,
      decisionalImpact: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "UNKNOWN"] }, sourceTurnIds: stringArrayJson,
      sourceText: nullableStringJson, status: { type: "string", enum: ["OPEN", "RESOLVED"] }, decisionId: nullableStringJson,
    }, required: ["ambiguityId", "content", "interpretations", "decisionalImpact", "sourceTurnIds", "sourceText", "status", "decisionId"] },
    MissingInformation: { type: "object", additionalProperties: false, properties: {
      missingId: { type: "string" }, content: { type: "string" }, decisionalImpact: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "UNKNOWN"] },
      blocking: { type: "boolean" }, owner: { type: "string" }, sourceTurnIds: stringArrayJson, sourceText: nullableStringJson,
      epistemicStatus: { type: "string", enum: ["UNKNOWN", "AMBIGUOUS"] },
    }, required: ["missingId", "content", "decisionalImpact", "blocking", "owner", "sourceTurnIds", "sourceText", "epistemicStatus"] },
    Correction: { type: "object", additionalProperties: false, properties: {
      correctionId: { type: "string" }, previousContent: { type: "string" }, currentContent: { type: "string" },
      disposition: { type: "string", enum: ["MODIFIED", "REJECTED", "SUPERSEDED", "CONFIRMED"] },
      previousSemanticIdentity: nullableStringJson, currentSemanticIdentity: nullableStringJson, sourceTurnIds: stringArrayJson, sourceText: nullableStringJson,
    }, required: ["correctionId", "previousContent", "currentContent", "disposition", "previousSemanticIdentity", "currentSemanticIdentity", "sourceTurnIds", "sourceText"] },
    OwnershipState: { type: "object", additionalProperties: false, properties: {
      statementId: { type: "string" }, content: { type: "string" }, ownership: { type: "string" },
      epistemicStatus: { type: "string", enum: epistemicStatus.options }, sourceTurnIds: stringArrayJson, sourceText: nullableStringJson,
    }, required: ["statementId", "content", "ownership", "epistemicStatus", "sourceTurnIds", "sourceText"] },
    OpenDecision: { type: "object", additionalProperties: false, properties: {
      decisionId: { type: "string" }, content: { type: "string" }, affectedElementIds: stringArrayJson, decisionOwner: { type: "string" },
      status: { type: "string", enum: ["OPEN", "CONFIRMED"] }, sourceTurnIds: stringArrayJson, sourceText: nullableStringJson,
    }, required: ["decisionId", "content", "affectedElementIds", "decisionOwner", "status", "sourceTurnIds", "sourceText"] },
    ClarificationNeed: { type: "object", additionalProperties: false, properties: {
      clarificationId: { type: "string" }, targetUnknown: { type: "string" }, decisionalImpact: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "UNKNOWN"] },
      affectedDecisions: stringArrayJson, affectedBranches: stringArrayJson, blocking: { type: "boolean" },
      candidateQuestionIntent: { type: "string" }, resolutionOwner: { type: "string" },
    }, required: ["clarificationId", "targetUnknown", "decisionalImpact", "affectedDecisions", "affectedBranches", "blocking", "candidateQuestionIntent", "resolutionOwner"] },
  },
  properties: {
    normalizedUnderstanding: { type: "string" }, scientificGoalCandidates: stringArrayJson, studyIntentCandidates: stringArrayJson,
    objects: { type: "array", items: { $ref: "#/$defs/ScientificElement" } }, relations: { type: "array", items: { $ref: "#/$defs/ScientificRelation" } },
    explicitStatements: { type: "array", items: { $ref: "#/$defs/ScientificElement" } }, inferredContext: { type: "array", items: { $ref: "#/$defs/ScientificElement" } },
    contextualCandidates: { type: "array", items: { $ref: "#/$defs/ScientificElement" } }, negationsAndConstraints: { type: "array", items: { $ref: "#/$defs/ScientificElement" } },
    temporalElements: { type: "array", items: { $ref: "#/$defs/ScientificElement" } }, ambiguities: { type: "array", items: { $ref: "#/$defs/Ambiguity" } },
    unknowns: { type: "array", items: { $ref: "#/$defs/MissingInformation" } }, missingInformation: { type: "array", items: { $ref: "#/$defs/MissingInformation" } },
    correctionsAndSupersessions: { type: "array", items: { $ref: "#/$defs/Correction" } }, ownershipAndEpistemicStates: { type: "array", items: { $ref: "#/$defs/OwnershipState" } },
    openDecisions: { type: "array", items: { $ref: "#/$defs/OpenDecision" } }, clarificationNeeds: { type: "array", items: { $ref: "#/$defs/ClarificationNeed" } },
  },
  required: ["normalizedUnderstanding", "scientificGoalCandidates", "studyIntentCandidates", "objects", "relations", "explicitStatements", "inferredContext", "contextualCandidates", "negationsAndConstraints", "temporalElements", "ambiguities", "unknowns", "missingInformation", "correctionsAndSupersessions", "ownershipAndEpistemicStates", "openDecisions", "clarificationNeeds"],
} as const;

type JsonSchemaValue = null | boolean | number | string | JsonSchemaValue[] | { [key: string]: JsonSchemaValue };

const PROVIDER_SCHEMA_KEYWORDS = new Set([
  "$defs", "$ref", "additionalProperties", "anyOf", "description", "enum", "items", "maximum", "minimum",
  "nullable", "properties", "required", "type",
]);

const toProviderTransportSchema = (value: JsonSchemaValue, context: "SCHEMA" | "PROPERTIES" | "DEFS" = "SCHEMA"): JsonSchemaValue => {
  if (Array.isArray(value)) return value.map((item) => toProviderTransportSchema(item));
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).flatMap(([key, entry]) => {
    if (context === "PROPERTIES" || context === "DEFS") {
      return [[key, toProviderTransportSchema(entry, "SCHEMA")]];
    }
    if (key === "const") return [["enum", [toProviderTransportSchema(entry)]]];
    if (!PROVIDER_SCHEMA_KEYWORDS.has(key)) return [];
    const childContext = key === "properties" ? "PROPERTIES" : key === "$defs" ? "DEFS" : "SCHEMA";
    return [[key, toProviderTransportSchema(entry, childContext)]];
  }));
};

export const HYBRID_PRIMARY_PROVIDER_TRANSPORT_SCHEMA = toProviderTransportSchema(
  HYBRID_PRIMARY_INTERNAL_JSON_SCHEMA as unknown as JsonSchemaValue,
) as Record<string, JsonSchemaValue>;

export const validateHybridProviderTransportSchema = (schema: JsonSchemaValue): string[] => {
  const errors: string[] = [];
  const visit = (value: JsonSchemaValue, path: string, context: "SCHEMA" | "PROPERTIES" | "DEFS") => {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => visit(entry, `${path}[${index}]`, "SCHEMA"));
      return;
    }
    if (value === null || typeof value !== "object") return;
    Object.entries(value).forEach(([key, entry]) => {
      if (context === "SCHEMA" && !PROVIDER_SCHEMA_KEYWORDS.has(key)) errors.push(`${path}.${key}`);
      const childContext = key === "properties" ? "PROPERTIES" : key === "$defs" ? "DEFS" : "SCHEMA";
      visit(entry, `${path}.${key}`, context === "PROPERTIES" || context === "DEFS" ? "SCHEMA" : childContext);
    });
  };
  visit(schema, "$", "SCHEMA");
  return errors;
};

// Backward-compatible symbol for the uncommitted SEM-CLOSURE-001 candidate.
export const HYBRID_PRIMARY_JSON_SCHEMA = HYBRID_PRIMARY_PROVIDER_TRANSPORT_SCHEMA;

export const HYBRID_PRIMARY_PROMPT_DIGEST = logicalDigest({ version: HYBRID_PRIMARY_PROMPT_VERSION, prompt: HYBRID_PRIMARY_SYSTEM_PROMPT });
export const HYBRID_PRIMARY_INTERNAL_SCHEMA_DIGEST = logicalDigest(HYBRID_PRIMARY_INTERNAL_JSON_SCHEMA);
export const HYBRID_PRIMARY_TRANSPORT_SCHEMA_DIGEST = logicalDigest(HYBRID_PRIMARY_PROVIDER_TRANSPORT_SCHEMA);
export const HYBRID_PRIMARY_SCHEMA_DIGEST = HYBRID_PRIMARY_INTERNAL_SCHEMA_DIGEST;

type ProviderRawEnvelope = {
  rawAttempts?: Array<{ httpStatus?: unknown; providerBodyText?: unknown }>;
};

const structuredArgumentsFromProviderBody = (bodyText: string) => {
  const body = JSON.parse(bodyText) as { candidates?: Array<{ content?: { parts?: Array<{ functionCall?: { name?: unknown; args?: unknown } }> } }> };
  const calls = body.candidates?.flatMap((candidate) => candidate.content?.parts?.flatMap((part) => part.functionCall ? [part.functionCall] : []) ?? []) ?? [];
  const call = calls.find((candidate) => candidate.name === HYBRID_PRIMARY_OUTPUT_FUNCTION_NAME);
  if (!call) throw new Error("PROVIDER_OUTPUT_FUNCTION_CALL_MISSING");
  if (!call.args || typeof call.args !== "object" || Array.isArray(call.args)) throw new Error("PROVIDER_OUTPUT_FUNCTION_ARGUMENTS_INVALID");
  return call.args;
};

export const parseHybridPrimaryProviderOutput = (
  raw: unknown,
  execution: HybridNativeExecution,
  conversation: ScientificInterpretationConversation,
  previousState?: ScientificInterpretationContributionEnvelope | null,
): HybridParsedState => {
  const envelope = raw && typeof raw === "object" ? raw as ProviderRawEnvelope : {};
  const finalBody = envelope.rawAttempts?.at(-1)?.providerBodyText;
  if (typeof finalBody !== "string") throw new Error("PROVIDER_RESPONSE_BODY_MISSING");
  const value = hybridPrimaryInterpretationSchema.parse(structuredArgumentsFromProviderBody(finalBody));
  const generatedAt = new Date().toISOString();
  return {
    identity: {
      stateId: `hybrid-state:${logicalDigest({ conversationId: conversation.conversationId, previous: previousState?.identity.contributionDigest ?? null, value })}`,
      conversationId: conversation.conversationId,
      previousStateId: previousState?.identity.contributionId ?? null,
      generatedAt,
    },
    source: {
      originalRequest: conversation.turns.find((turn) => turn.role === "USER")?.content ?? "",
      turns: conversation.turns,
    },
    understanding: {
      normalizedUnderstanding: value.normalizedUnderstanding,
      scientificGoalCandidates: value.scientificGoalCandidates,
      studyIntentCandidates: value.studyIntentCandidates,
    },
    ...value,
    technicalStatus: "STRUCTURED_CONTRACT_VALID",
    auditStatus: "NOT_RUN",
    adjudicationStatus: "NOT_REQUIRED",
    runtimeIdentity: {
      runtimeId: execution.runtimeId,
      runtimeVersion: execution.runtimeVersion,
      provider: execution.provider,
      model: execution.model,
      promptDigest: execution.promptDigest,
      schemaDigest: execution.schemaDigest,
      configurationDigest: execution.configurationDigest,
    },
  };
};
