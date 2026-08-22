import type { ScientificInterpretationExecution } from "./runtime.js";
import type { ScientificInterpretationProductDisposition } from "./cognitive-boundary.js";
import type { ScientificInterpretationCognitiveBoundary, ScientificInterpretationContributionEnvelope, ScientificInterpretationConversation, ScientificInterpretationFailureClass, ScientificInterpretationMode } from "./contracts.js";
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
  productDisposition: ScientificInterpretationProductDisposition;
  contributionId: string | null;
  fallbackUsed: boolean;
  fallback: ScientificInterpretationExecution["fallback"];
  auditStatus: "COMPLETE" | "CRITICAL_FINDINGS";
  reviewRequired: boolean;
  projectionDisposition: ScientificInterpretationProjectionDisposition | "NO_SCIENTIFIC_CONTRIBUTION";
  contribution: ScientificInterpretationContributionEnvelope | null;
  cognitiveBoundary: ScientificInterpretationCognitiveBoundary;
  responseMessage: string | null;
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
  const contribution = record.contribution as Record<string, unknown> | null | undefined;
  const cognitiveBoundary = record.cognitiveBoundary as Record<string, unknown> | undefined;
  return record.apiVersion === SCIENTIFIC_INTERPRETATION_API_VERSION
    && ["AVAILABLE", "FALLBACK_ACTIVE"].includes(String(record.technicalStatus))
    && ["SCIENTIFIC_CONTRIBUTION", "CONVERSATIONAL_ONLY", "SCOPE_REJECTED", "BORDERLINE_CLARIFICATION", "TERMINOLOGY_CLARIFICATION"].includes(String(record.productDisposition))
    && (typeof record.contributionId === "string" || record.contributionId === null)
    && typeof record.fallbackUsed === "boolean"
    && typeof record.reviewRequired === "boolean"
    && cognitiveBoundary?.lifecycle === "EPHEMERAL_TRACEABLE_NON_AUTHORITATIVE"
    && ((record.productDisposition === "SCIENTIFIC_CONTRIBUTION" && contribution?.contract === "SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ENVELOPE")
      || (record.productDisposition !== "SCIENTIFIC_CONTRIBUTION" && contribution === null));
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
      || !(context.projectDigest === null || typeof context.projectDigest === "string")
      || !(context.currentQuestion === undefined || context.currentQuestion === null || typeof context.currentQuestion === "string")
      || !(context.questionRationale === undefined || context.questionRationale === null || typeof context.questionRationale === "string")
      || !(context.scopeSectionIds === undefined || (Array.isArray(context.scopeSectionIds) && context.scopeSectionIds.every((item) => typeof item === "string")))) return null;
  }
  const projectContext = conversation.projectContext;
  if (projectContext !== undefined) {
    if (!projectContext || typeof projectContext !== "object") return null;
    const context = projectContext as Record<string, unknown>;
    if (typeof context.projectRef !== "string" || !context.projectRef
      || typeof context.projectVersion !== "string" || !context.projectVersion
      || typeof context.projectDigest !== "string" || !context.projectDigest
      || !Array.isArray(context.elements)
      || !context.elements.every((element) => {
        if (!element || typeof element !== "object") return false;
        const item = element as Record<string, unknown>;
        return typeof item.elementId === "string" && item.elementId.length > 0
          && typeof item.sectionId === "string" && item.sectionId.length > 0
          && (item.semanticKey === null || typeof item.semanticKey === "string")
          && typeof item.content === "string" && item.content.length > 0
          && Array.isArray(item.semanticRoles) && item.semanticRoles.every((role) => typeof role === "string")
          && (item.aliases === undefined || (Array.isArray(item.aliases) && item.aliases.every((alias) => typeof alias === "string")));
      })) return null;
  }
  const repairContext = conversation.semanticRepairContext;
  if (repairContext !== undefined) {
    if (!repairContext || typeof repairContext !== "object") return null;
    const context = repairContext as Record<string, unknown>;
    if (context.lifecycle !== "EPHEMERAL_TRACEABLE_NON_AUTHORITATIVE"
      || context.attempt !== 1
      || typeof context.initialContributionId !== "string" || !context.initialContributionId
      || typeof context.initialContributionDigest !== "string" || !context.initialContributionDigest
      || typeof context.criticResultDigest !== "string" || !context.criticResultDigest
      || !Array.isArray(context.findings)
      || !context.findings.every((finding) => {
        if (!finding || typeof finding !== "object") return false;
        const item = finding as Record<string, unknown>;
        return ["INFORMATION_LOST", "ROLE_MISMATCH", "RELATION_MISMATCH", "OVER_INTERPRETATION", "AMBIGUITY_LOST", "DUPLICATE_CONCEPT"].includes(String(item.category))
          && ["INTERPRETER", "COMPILER", "BOTH"].includes(String(item.failureStage))
          && typeof item.message === "string" && item.message.length > 0
          && (item.repairHint === null || typeof item.repairHint === "string")
          && Array.isArray(item.rawEvidence)
          && item.rawEvidence.every((evidence) => {
            if (!evidence || typeof evidence !== "object") return false;
            const raw = evidence as Record<string, unknown>;
            const turn = (conversation.turns as unknown[]).find((candidate) => {
              if (!candidate || typeof candidate !== "object") return false;
              const source = candidate as Record<string, unknown>;
              return source.turnId === raw.turnId && source.role === "USER";
            }) as Record<string, unknown> | undefined;
            return typeof raw.turnId === "string" && raw.turnId.length > 0
              && typeof raw.quote === "string" && raw.quote.length > 0
              && typeof turn?.content === "string" && turn.content.includes(raw.quote);
          });
      })) return null;
  }
  const previous = input.previousContribution;
  if (previous !== null && previous !== undefined && (typeof previous !== "object" || (previous as Record<string, unknown>).contract !== "SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ENVELOPE")) return null;
  return {
    apiVersion: SCIENTIFIC_INTERPRETATION_API_VERSION,
    conversation: conversation as unknown as ScientificInterpretationConversation,
    previousContribution: (previous ?? null) as ScientificInterpretationContributionEnvelope | null,
  };
};
