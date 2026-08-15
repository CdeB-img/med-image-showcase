import type { ScientificInterpretationExecution } from "./runtime.js";
import type { ScientificInterpretationContributionEnvelope, ScientificInterpretationConversation, ScientificInterpretationFailureClass, ScientificInterpretationMode } from "./contracts.js";
import type { ScientificInterpretationProjectionDisposition, V1ScientificInterpretationProjection } from "./v1-compatibility.js";

export const SCIENTIFIC_INTERPRETATION_API_VERSION = "1.0.0" as const;

const EXPECTED_RESPONSE_KINDS = ["SCIENTIFIC_CONTENT", "SCIENTIFIC_CORRECTION", "ROUTE_INTENT", "QRY_INFORMATION_RESPONSE", "HUMAN_DECISION_RESPONSE", "OWNER_MODIFICATION_REQUEST"] as const;

export type ScientificInterpretationApiRequest = {
  apiVersion: typeof SCIENTIFIC_INTERPRETATION_API_VERSION;
  conversation: ScientificInterpretationConversation;
  previousContribution: ScientificInterpretationContributionEnvelope | null;
};

export type ScientificInterpretationApiResponse = {
  apiVersion: typeof SCIENTIFIC_INTERPRETATION_API_VERSION;
  technicalStatus: "AVAILABLE" | "FALLBACK_ACTIVE";
  runtimeMode: ScientificInterpretationMode;
  contributionId: string;
  fallbackUsed: boolean;
  fallback: ScientificInterpretationExecution["fallback"];
  auditStatus: "COMPLETE" | "CRITICAL_FINDINGS";
  reviewRequired: boolean;
  projectionDisposition: ScientificInterpretationProjectionDisposition;
  contribution: ScientificInterpretationContributionEnvelope;
  v1Projection: V1ScientificInterpretationProjection | null;
  projectWrites: 0;
  semanticAuditLExecuted: false;
  adjudicatorExecuted: false;
  diagnostics: string[];
};

export type ScientificInterpretationApiFailure = {
  apiVersion: typeof SCIENTIFIC_INTERPRETATION_API_VERSION;
  technicalStatus: "FAIL_CLOSED";
  runtimeMode: ScientificInterpretationMode;
  contributionId: null;
  fallbackUsed: false;
  auditStatus: "NOT_COMPLETED";
  reviewRequired: true;
  projectionDisposition: "FAIL_CLOSED";
  projectWrites: 0;
  error: {
    code: ScientificInterpretationFailureClass | "METHOD_NOT_ALLOWED" | "INVALID_CONTENT_TYPE" | "ORIGIN_NOT_ALLOWED" | "PAYLOAD_TOO_LARGE" | "INVALID_REQUEST" | "LOCAL_SAFETY_BLOCKED" | "RATE_LIMITED";
    message: string;
    retryable: boolean;
    rawOutputRef: string | null;
    operationId: string | null;
  };
};

export const isScientificInterpretationApiResponse = (value: unknown): value is ScientificInterpretationApiResponse => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const contribution = record.contribution as Record<string, unknown> | undefined;
  return record.apiVersion === SCIENTIFIC_INTERPRETATION_API_VERSION
    && ["AVAILABLE", "FALLBACK_ACTIVE"].includes(String(record.technicalStatus))
    && typeof record.contributionId === "string"
    && typeof record.fallbackUsed === "boolean"
    && typeof record.reviewRequired === "boolean"
    && contribution?.contract === "SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ENVELOPE";
};

export const parseScientificInterpretationApiRequest = (value: unknown): ScientificInterpretationApiRequest | null => {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const conversation = input.conversation as Record<string, unknown> | undefined;
  if (input.apiVersion !== SCIENTIFIC_INTERPRETATION_API_VERSION || !conversation || typeof conversation.conversationId !== "string") return null;
  if (!['fr', 'en'].includes(String(conversation.language)) || !Array.isArray(conversation.turns) || conversation.turns.length === 0 || conversation.turns.length > 100) return null;
  const turnsValid = conversation.turns.every((turn) => {
    if (!turn || typeof turn !== "object") return false;
    const item = turn as Record<string, unknown>;
    return typeof item.turnId === "string" && item.turnId.length > 0 && ["USER", "NOXIA"].includes(String(item.role))
      && typeof item.content === "string" && item.content.trim().length > 0 && item.content.length <= 4_000;
  });
  if (!turnsValid) return null;
  const interaction = conversation.interactionContext;
  if (interaction !== undefined) {
    if (!interaction || typeof interaction !== "object") return null;
    const context = interaction as Record<string, unknown>;
    if (typeof context.interactionRef !== "string" || !context.interactionRef
      || typeof context.owner !== "string" || !context.owner
      || typeof context.purpose !== "string" || !context.purpose
      || !EXPECTED_RESPONSE_KINDS.includes(context.expectedResponseKind as typeof EXPECTED_RESPONSE_KINDS[number])
      || !Array.isArray(context.targetRefs) || !context.targetRefs.every((item) => typeof item === "string")
      || !Array.isArray(context.informationNeedRefs) || !context.informationNeedRefs.every((item) => typeof item === "string")
      || !(context.sourceActionRef === null || typeof context.sourceActionRef === "string")
      || !(context.projectRef === null || typeof context.projectRef === "string")
      || !(context.projectVersion === null || typeof context.projectVersion === "string")
      || !(context.projectDigest === null || typeof context.projectDigest === "string")) return null;
  }
  const previous = input.previousContribution;
  if (previous !== null && previous !== undefined && (typeof previous !== "object" || (previous as Record<string, unknown>).contract !== "SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ENVELOPE")) return null;
  return {
    apiVersion: SCIENTIFIC_INTERPRETATION_API_VERSION,
    conversation: conversation as unknown as ScientificInterpretationConversation,
    previousContribution: (previous ?? null) as ScientificInterpretationContributionEnvelope | null,
  };
};
