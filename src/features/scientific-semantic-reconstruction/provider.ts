import { SCIENTIFIC_SEMANTIC_CRITIC_PROMPT, SCIENTIFIC_SEMANTIC_RECONSTRUCTION_PROMPT } from "../../../api/prompts/scientific-semantic-reconstruction-prompt.js";
import { SCIENTIFIC_SEMANTIC_ATOMIC_COMPOSITION_AUDIT_PROMPT } from "../../../api/prompts/scientific-semantic-atomic-composition-prompt.js";
import { comparableScientificText, logicalDigest } from "@/features/knowledge-engine/canonical";
import {
  makeAtomicCompositionAuditContext,
  parseSemanticAtomicCompositionAudit,
  parseSemanticAtomicCompositionTransport,
  SEMANTIC_ATOMIC_COMPOSITION_AUDIT_JSON_SCHEMA,
} from "./atomic-composition";
import { parseSemanticCriticResult, parseSemanticReconstructionCandidate, SEMANTIC_CRITIC_JSON_SCHEMA, SEMANTIC_RECONSTRUCTION_JSON_SCHEMA } from "./schema";
import { applyCriticRepairs, buildSemanticIntegrityReport } from "./coverage";
import type {
  ScientificSemanticProvider,
  SemanticProviderAttempt,
  SemanticProviderFailureCategory,
  SemanticProviderMetadata,
  ExplicitCoverageReport,
  RelationCoverageReport,
  SemanticIntegrityReport,
  SemanticTaxonomyReport,
  SemanticReconstructionCandidate,
  SemanticReconstructionRequest,
} from "./types";

type GoogleProviderError = {
  error?: {
    code?: number;
    status?: string;
    message?: string;
    details?: Array<Record<string, unknown>>;
  };
};

type ClassifiedFailure = {
  category: SemanticProviderFailureCategory;
  httpStatus: number | null;
  providerStatus: string | null;
  providerCode: string | null;
  providerError: string;
  retryable: boolean;
  retryAfterMs: number | null;
};

export type SemanticProviderDiagnostic = {
  rawProviderOutput: string | null;
  validationIssues: Array<{ path: string; code: string; message: string }>;
  structuredOutputClassification?: "PARSER_FAILURE" | "MODEL_STRUCTURE_NON_COMPLIANCE" | "MODEL_ENUM_NON_COMPLIANCE" | "INTERNAL_INVARIANT_FAILURE";
  transportValid?: boolean;
  internalValid?: boolean;
};

export class SemanticProviderError extends Error {
  readonly reason: SemanticProviderFailureCategory;

  constructor(
    public readonly category: SemanticProviderFailureCategory,
    public readonly attempts: SemanticProviderAttempt[] = [],
    public readonly details: Omit<ClassifiedFailure, "category"> | null = null,
    public readonly diagnostic: SemanticProviderDiagnostic | null = null,
  ) {
    super(`SEMANTIC_PROVIDER_${category}`);
    this.name = "SemanticProviderError";
    this.reason = category;
  }
}

const responseText = (value: unknown): string | null => {
  if (!value || typeof value !== "object") return null;
  const candidates = (value as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates;
  return candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") || null;
};

const providerContext = (request: SemanticReconstructionRequest) => ({
  schemaVersion: request.schemaVersion,
  language: request.language,
  messages: request.messages,
  previousModel: request.previousModel ? {
    semanticModelId: request.previousModel.semanticModelId,
    revision: request.previousModel.revision,
    status: request.previousModel.status,
    normalizedMeaning: request.previousModel.normalizedMeaning,
    elements: request.previousModel.elements,
    relations: request.previousModel.relations,
    ambiguities: request.previousModel.ambiguities,
    unknowns: request.previousModel.unknowns,
  } : null,
});

const boundedText = (value: unknown, fallback: string) => {
  const text = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  return (text || fallback).slice(0, 800);
};

const retryAfterMs = (response: Response) => {
  const header = response.headers.get("retry-after");
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1_000;
  const date = Date.parse(header);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : null;
};

const googleError = (body: unknown) => (body && typeof body === "object" ? body as GoogleProviderError : null)?.error;

const hasRetryInfo = (body: unknown) => Boolean(googleError(body)?.details?.some((detail) =>
  String(detail["@type"] ?? "").includes("RetryInfo") || "retryDelay" in detail));

const retryInfoDelayMs = (body: unknown): number | null => {
  const detail = googleError(body)?.details?.find((item) =>
    String(item["@type"] ?? "").includes("RetryInfo") || "retryDelay" in item);
  const raw = detail?.retryDelay;
  if (typeof raw !== "string") return null;
  const seconds = Number(raw.replace(/s$/, ""));
  return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds * 1_000) : null;
};

const hasZeroQuota = (body: unknown) => Boolean(googleError(body)?.details?.some((detail) =>
  JSON.stringify(detail).includes('"quotaValue":"0"') || JSON.stringify(detail).includes('"quotaValue":0')));

const classifyHttpFailure = (response: Response, body: unknown): ClassifiedFailure => {
  const error = googleError(body);
  const message = boundedText(error?.message, `Provider HTTP ${response.status}`);
  const searchable = `${error?.status ?? ""} ${message}`.toLocaleLowerCase("en-US");
  const status = response.status;
  const retryDelay = retryAfterMs(response) ?? retryInfoDelayMs(body);
  let category: SemanticProviderFailureCategory;
  let retryable = false;

  if (status === 401 || status === 403 || /unauthenticated|permission_denied|api key.*(invalid|expired|missing)/.test(searchable)) {
    category = "AUTHENTICATION";
  } else if ((status === 404 && /model/.test(searchable)) || /model.*(not found|does not exist|not supported|unsupported)/.test(searchable)) {
    category = "INVALID_MODEL";
  } else if (status === 429) {
    const quotaSignal = hasZeroQuota(body) || /insufficient quota|daily (?:quota|limit)|quota (?:is )?(?:exhausted|depleted)/.test(searchable);
    const transientSignal = !quotaSignal && (retryDelay !== null || hasRetryInfo(body) || /rate|per minute|requests per minute|retry in|too many requests/.test(searchable));
    category = transientSignal ? "RATE_LIMIT" : "QUOTA";
    retryable = transientSignal;
  } else if (status === 413 || (/prompt|input|request/.test(searchable) && /too (large|long)|token limit|context length/.test(searchable))) {
    category = "PROMPT_TOO_LARGE";
  } else if (status === 400 && /response.*schema|responsejsonschema|json schema|schema.*(invalid|unsupported|reject)/.test(searchable)) {
    category = "SCHEMA_REJECTION";
  } else if (status >= 500) {
    category = "SERVER_ERROR";
    retryable = true;
  } else if (status >= 400 && status < 500) {
    category = "CLIENT_ERROR";
  } else {
    category = "UNKNOWN_PROVIDER_FAILURE";
  }

  return {
    category,
    httpStatus: status,
    providerStatus: error?.status ?? null,
    providerCode: error?.code === undefined ? null : String(error.code),
    providerError: message,
    retryable,
    retryAfterMs: retryDelay,
  };
};

const safetyFailure = (body: unknown): ClassifiedFailure | null => {
  if (!body || typeof body !== "object") return null;
  const value = body as {
    promptFeedback?: { blockReason?: string; blockReasonMessage?: string };
    candidates?: Array<{ finishReason?: string }>;
  };
  const reason = value.promptFeedback?.blockReason ?? value.candidates?.[0]?.finishReason ?? "";
  if (!/SAFETY|BLOCKLIST|PROHIBITED|RECITATION/.test(reason)) return null;
  return {
    category: "SAFETY_REFUSAL",
    httpStatus: 200,
    providerStatus: reason,
    providerCode: null,
    providerError: boundedText(value.promptFeedback?.blockReasonMessage, "Provider safety refusal."),
    retryable: false,
    retryAfterMs: null,
  };
};

const invalidOutputFailure = (message: string): ClassifiedFailure => ({
  category: "INVALID_STRUCTURED_OUTPUT",
  httpStatus: 200,
  providerStatus: null,
  providerCode: null,
  providerError: message,
  retryable: false,
  retryAfterMs: null,
});

const schemaDiagnostic = (
  caught: unknown,
  rawProviderOutput: string,
  stage?: "TRANSPORT" | "INTERNAL",
): SemanticProviderDiagnostic => {
  if (!caught || typeof caught !== "object" || !("issues" in caught) || !Array.isArray(caught.issues)) {
    return { rawProviderOutput, validationIssues: [], ...(stage ? {
      structuredOutputClassification: stage === "TRANSPORT" ? "MODEL_STRUCTURE_NON_COMPLIANCE" as const : "INTERNAL_INVARIANT_FAILURE" as const,
      transportValid: stage === "INTERNAL",
      internalValid: false,
    } : {}) };
  }
  const validationIssues = caught.issues.slice(0, 50).map((issue) => {
    if (!issue || typeof issue !== "object") return { path: "root", code: "unknown", message: "Unknown validation issue." };
    const material = issue as { path?: Array<string | number>; code?: string; message?: string };
    return {
      path: material.path?.join(".") || "root",
      code: material.code ?? "unknown",
      message: boundedText(material.message, "Validation issue."),
    };
  });
  const enumFailure = validationIssues.some((issue) => issue.code === "invalid_value" || issue.code === "invalid_enum_value");
  return { rawProviderOutput, validationIssues, ...(stage ? {
    structuredOutputClassification: stage === "TRANSPORT"
      ? (enumFailure ? "MODEL_ENUM_NON_COMPLIANCE" as const : "MODEL_STRUCTURE_NON_COMPLIANCE" as const)
      : "INTERNAL_INVARIANT_FAILURE" as const,
    transportValid: stage === "INTERNAL",
    internalValid: false,
  } : {}) };
};

const structuredContractFailure = (issues: Array<{ path: Array<string | number>; code: string; message: string }>) => ({ issues });

type RawReconstructionCandidate = {
  elements?: Array<Record<string, unknown>>;
  relations?: Array<Record<string, unknown>>;
  semanticWarnings?: unknown[];
  [key: string]: unknown;
};

const stringArray = (value: unknown) => Array.isArray(value) && value.every((item) => typeof item === "string") ? value : null;

const normalizeDeterministicPriorStateReemission = (
  request: SemanticReconstructionRequest,
  value: unknown,
): unknown => {
  if (!request.previousModel || !value || typeof value !== "object") return value;
  const candidate = value as RawReconstructionCandidate;
  if (!Array.isArray(candidate.elements) || !Array.isArray(candidate.relations)) return value;

  const previousElements = new Map(request.previousModel.elements.map((element) => [element.semanticElementId, element]));
  let identityBindingCount = 0;
  const elements = candidate.elements.map((element) => {
    const clientElementId = typeof element.clientElementId === "string" ? element.clientElementId : null;
    const supersedesElementIds = stringArray(element.supersedesElementIds);
    const previous = clientElementId ? previousElements.get(clientElementId) : null;
    const identityCompatible = previous
      && element.type === previous.type
      && typeof element.canonicalMeaning === "string"
      && comparableScientificText(element.canonicalMeaning) === comparableScientificText(previous.canonicalMeaning);
    if (!identityCompatible || !supersedesElementIds || supersedesElementIds.length !== 0 || element.epistemicStatus !== "EXPLICIT_USER_STATED") return element;
    identityBindingCount += 1;
    return { ...element, supersedesElementIds: [previous.semanticElementId] };
  });
  const previousIdByClientId = new Map<string, string>();
  const duplicatedClientIds = new Set<string>();

  elements.forEach((element) => {
    const clientElementId = typeof element.clientElementId === "string" ? element.clientElementId : null;
    const inventoryItemIds = stringArray(element.inventoryItemIds);
    const supersedesElementIds = stringArray(element.supersedesElementIds);
    if (!clientElementId || !inventoryItemIds || !supersedesElementIds || supersedesElementIds.length !== 1) return;
    const previous = previousElements.get(supersedesElementIds[0]);
    if (!previous) return;
    const identityCompatible = element.type === previous.type
      && typeof element.canonicalMeaning === "string"
      && comparableScientificText(element.canonicalMeaning) === comparableScientificText(previous.canonicalMeaning);
    const sameRepresentation = identityCompatible
      && element.studyRole === previous.studyRole
      && element.polarity === previous.polarity;
    if (identityCompatible) previousIdByClientId.set(clientElementId, previous.semanticElementId);
    const ungroundedHistoricalDuplicate = sameRepresentation
      && element.epistemicStatus === "EXPLICIT_USER_STATED"
      && inventoryItemIds.length === 0
      && element.sourceMessageId === null
      && element.sourceText === null;
    if (ungroundedHistoricalDuplicate) duplicatedClientIds.add(clientElementId);
  });
  if (duplicatedClientIds.size === 0) {
    if (identityBindingCount === 0) return value;
    return {
      ...candidate,
      elements,
      semanticWarnings: [
        ...(Array.isArray(candidate.semanticWarnings) ? candidate.semanticWarnings : []),
        `DETERMINISTIC_CANONICAL_CLIENT_ID_BOUND_TO_PRIOR_STATE:${identityBindingCount}`,
      ],
    };
  }

  const duplicatedRelationIds = new Set<string>();
  candidate.relations.forEach((relation) => {
    const clientRelationId = typeof relation.clientRelationId === "string" ? relation.clientRelationId : null;
    const sourceClientElementId = typeof relation.sourceClientElementId === "string" ? relation.sourceClientElementId : null;
    const targetClientElementId = typeof relation.targetClientElementId === "string" ? relation.targetClientElementId : null;
    const inventoryRelationIds = stringArray(relation.inventoryRelationIds);
    if (!clientRelationId || !sourceClientElementId || !targetClientElementId || !inventoryRelationIds
      || relation.epistemicStatus !== "EXPLICIT_USER_STATED" || inventoryRelationIds.length !== 0) return;
    const sourceElementId = previousIdByClientId.get(sourceClientElementId);
    const targetElementId = previousIdByClientId.get(targetClientElementId);
    if (!sourceElementId || !targetElementId || typeof relation.relationType !== "string") return;
    const exactPreviousRelation = request.previousModel!.relations.some((previous) => previous.sourceElementId === sourceElementId
      && previous.targetElementId === targetElementId
      && previous.polarity === relation.polarity
      && comparableScientificText(previous.relationType) === comparableScientificText(relation.relationType as string));
    if (exactPreviousRelation) duplicatedRelationIds.add(clientRelationId);
  });

  const remainingRelations = candidate.relations.filter((relation) => {
    const source = typeof relation.sourceClientElementId === "string" ? relation.sourceClientElementId : "";
    const target = typeof relation.targetClientElementId === "string" ? relation.targetClientElementId : "";
    const touchesRemovedElement = duplicatedClientIds.has(source) || duplicatedClientIds.has(target);
    const relationId = typeof relation.clientRelationId === "string" ? relation.clientRelationId : "";
    return !touchesRemovedElement || !duplicatedRelationIds.has(relationId);
  });
  const relationsStillUsingRemovedElement = remainingRelations.some((relation) => duplicatedClientIds.has(String(relation.sourceClientElementId ?? ""))
    || duplicatedClientIds.has(String(relation.targetClientElementId ?? "")));
  if (relationsStillUsingRemovedElement) return value;

  return {
    ...candidate,
    elements: elements.filter((element) => !duplicatedClientIds.has(String(element.clientElementId ?? ""))),
    relations: remainingRelations,
    semanticWarnings: [
      ...(Array.isArray(candidate.semanticWarnings) ? candidate.semanticWarnings : []),
      ...(identityBindingCount ? [`DETERMINISTIC_CANONICAL_CLIENT_ID_BOUND_TO_PRIOR_STATE:${identityBindingCount}`] : []),
      `DETERMINISTIC_PRIOR_STATE_REEMISSION_DEDUPLICATED:${duplicatedClientIds.size}:${duplicatedRelationIds.size}`,
    ],
  };
};

const uniqueOccurrenceIndex = (content: string, fragment: string) => {
  const first = content.indexOf(fragment);
  if (first < 0 || content.indexOf(fragment, first + fragment.length) >= 0) return null;
  return first;
};

const clauseContaining = (content: string, firstIndex: number, firstLength: number, secondIndex: number, secondLength: number) => {
  const start = Math.min(firstIndex, secondIndex);
  const end = Math.max(firstIndex + firstLength, secondIndex + secondLength);
  const leftBoundaries = [".", "?", "!", "\n"].map((separator) => content.lastIndexOf(separator, Math.max(0, start - 1)));
  const left = Math.max(...leftBoundaries) + 1;
  const rightCandidates = [".", "?", "!", "\n"]
    .map((separator) => content.indexOf(separator, end))
    .filter((index) => index >= 0);
  const right = rightCandidates.length ? Math.min(...rightCandidates) + 1 : content.length;
  return content.slice(left, right).trim();
};

const normalizeInventoryRelationSourceSpans = (
  request: SemanticReconstructionRequest,
  candidate: SemanticReconstructionCandidate,
) => {
  const messages = new Map(request.messages.filter((message) => message.role === "USER").map((message) => [message.messageId, message.content]));
  const fragments = new Map(candidate.semanticInventory.explicitFragments.map((fragment) => [fragment.inventoryItemId, fragment]));
  let derivedCount = 0;
  const explicitRelations = candidate.semanticInventory.explicitRelations.map((relation) => {
    const content = messages.get(relation.sourceMessageId);
    if (!content || content.includes(relation.sourceText)) return relation;
    const source = fragments.get(relation.sourceInventoryItemId);
    const target = fragments.get(relation.targetInventoryItemId);
    if (!source || !target) return relation;
    const sourceIndex = uniqueOccurrenceIndex(content, source.sourceText);
    const targetIndex = uniqueOccurrenceIndex(content, target.sourceText);
    if (sourceIndex === null || targetIndex === null) return relation;
    const sourceText = clauseContaining(content, sourceIndex, source.sourceText.length, targetIndex, target.sourceText.length);
    if (!sourceText || sourceText.length > 1_000 || !sourceText.includes(source.sourceText) || !sourceText.includes(target.sourceText)) return relation;
    derivedCount += 1;
    return { ...relation, sourceText };
  });
  if (derivedCount === 0) return candidate;
  return parseSemanticReconstructionCandidate({
    ...candidate,
    semanticInventory: { ...candidate.semanticInventory, explicitRelations },
    semanticWarnings: [...candidate.semanticWarnings, `DETERMINISTIC_INVENTORY_RELATION_SOURCE_SPAN_DERIVED:${derivedCount}`],
  });
};

const normalizeReplacementRelationTopology = (
  request: SemanticReconstructionRequest,
  candidate: SemanticReconstructionCandidate,
) => {
  const previous = request.previousModel;
  const currentMessage = [...request.messages].reverse().find((message) => message.role === "USER");
  if (!previous || !currentMessage) return candidate;
  const currentInventory = candidate.semanticInventory.explicitFragments.filter((fragment) => fragment.sourceMessageId === currentMessage.messageId);
  const candidateById = new Map(candidate.elements.map((element) => [element.clientElementId, element]));
  const previousById = new Map(previous.elements.map((element) => [element.semanticElementId, element]));
  const newElements = candidate.elements.filter((element) => element.epistemicStatus === "EXPLICIT_USER_STATED"
    && element.polarity === "AFFIRMED"
    && element.sourceMessageId === currentMessage.messageId
    && element.supersedesElementIds.length === 0);
  let groundedCount = 0;
  const addedInventoryRelations: SemanticReconstructionCandidate["semanticInventory"]["explicitRelations"] = [];
  const relations = candidate.relations.map((relation) => {
    if (relation.epistemicStatus === "EXPLICIT_USER_STATED" || relation.polarity !== "AFFIRMED") return relation;
    const source = candidateById.get(relation.sourceClientElementId);
    const target = candidateById.get(relation.targetClientElementId);
    if (!source || !target) return relation;
    const matches = previous.relations.flatMap((priorRelation) => {
      if (priorRelation.epistemicStatus !== "EXPLICIT_USER_STATED"
        || priorRelation.polarity !== relation.polarity
        || comparableScientificText(priorRelation.relationType) !== comparableScientificText(relation.relationType)) return [];
      const priorSource = previousById.get(priorRelation.sourceElementId);
      const priorTarget = previousById.get(priorRelation.targetElementId);
      if (!priorSource || !priorTarget) return [];
      const orientations = [
        { replaced: priorSource, retained: priorTarget, expectedSource: source, expectedTarget: target },
        { replaced: priorTarget, retained: priorSource, expectedSource: target, expectedTarget: source },
      ];
      return orientations.flatMap(({ replaced, retained, expectedSource, expectedTarget }) => {
        const rejected = candidate.elements.filter((element) => element.epistemicStatus === "EXPLICIT_USER_STATED"
          && element.polarity === "NEGATED"
          && element.sourceMessageId === currentMessage.messageId
          && element.supersedesElementIds.includes(replaced.semanticElementId));
        const retainedCurrent = candidate.elements.filter((element) => element.epistemicStatus === "EXPLICIT_USER_STATED"
          && element.polarity === "AFFIRMED"
          && element.sourceMessageId === currentMessage.messageId
          && element.supersedesElementIds.includes(retained.semanticElementId));
        const sameRoleReplacements = newElements.filter((element) => element.type === replaced.type && element.studyRole === replaced.studyRole);
        if (rejected.length !== 1 || retainedCurrent.length !== 1 || sameRoleReplacements.length !== 1
          || expectedSource.clientElementId !== sameRoleReplacements[0].clientElementId
          || expectedTarget.clientElementId !== retainedCurrent[0].clientElementId) return [];
        return [{ replacement: sameRoleReplacements[0], retained: retainedCurrent[0], priorRelation }];
      });
    });
    if (matches.length !== 1) return relation;
    const match = matches[0];
    const replacementInventory = currentInventory.filter((fragment) => match.replacement.inventoryItemIds.includes(fragment.inventoryItemId));
    const retainedInventory = currentInventory.filter((fragment) => match.retained.inventoryItemIds.includes(fragment.inventoryItemId));
    if (replacementInventory.length !== 1 || retainedInventory.length !== 1) return relation;
    const replacementIndex = uniqueOccurrenceIndex(currentMessage.content, replacementInventory[0].sourceText);
    const retainedIndex = uniqueOccurrenceIndex(currentMessage.content, retainedInventory[0].sourceText);
    if (replacementIndex === null || retainedIndex === null) return relation;
    const sourceText = clauseContaining(currentMessage.content, replacementIndex, replacementInventory[0].sourceText.length, retainedIndex, retainedInventory[0].sourceText.length);
    if (!sourceText || sourceText.length > 1_000) return relation;
    const inventoryRelationId = `deterministic-replacement:${logicalDigest({
      messageId: currentMessage.messageId,
      sourceInventoryItemId: replacementInventory[0].inventoryItemId,
      targetInventoryItemId: retainedInventory[0].inventoryItemId,
      relationType: relation.relationType,
    })}`;
    addedInventoryRelations.push({
      inventoryRelationId,
      sourceInventoryItemId: replacementInventory[0].inventoryItemId,
      targetInventoryItemId: retainedInventory[0].inventoryItemId,
      sourceMessageId: currentMessage.messageId,
      sourceText,
      normalizedRelation: relation.relationType,
      polarity: relation.polarity,
    });
    groundedCount += 1;
    return {
      ...relation,
      inventoryRelationIds: [inventoryRelationId],
      epistemicStatus: "EXPLICIT_USER_STATED" as const,
      confidence: 1,
      inferenceReason: null,
      requiresConfirmation: false,
    };
  });
  if (groundedCount === 0) return candidate;
  return parseSemanticReconstructionCandidate({
    ...candidate,
    semanticInventory: {
      ...candidate.semanticInventory,
      explicitRelations: [...candidate.semanticInventory.explicitRelations, ...addedInventoryRelations],
    },
    relations,
    semanticWarnings: [...candidate.semanticWarnings, `DETERMINISTIC_REPLACEMENT_RELATION_GROUNDED:${groundedCount}`],
  });
};

const parseSourceGroundedReconstruction = (
  request: SemanticReconstructionRequest,
  value: unknown,
) => {
  const parsed = parseSemanticReconstructionCandidate(normalizeDeterministicPriorStateReemission(request, value));
  const replacementGrounded = normalizeReplacementRelationTopology(request, parsed);
  const candidate = normalizeInventoryRelationSourceSpans(request, replacementGrounded);
  const sourceGroundingCodes = new Set([
    "INVENTORY_FRAGMENT_SOURCE_NOT_CONTIGUOUS",
    "INVENTORY_RELATION_SOURCE_NOT_CONTIGUOUS",
    "EXPLICIT_ELEMENT_SOURCE_NOT_CONTIGUOUS",
  ]);
  const findings = buildSemanticIntegrityReport(request, candidate).findings.filter((finding) => sourceGroundingCodes.has(finding.code));
  if (findings.length) {
    throw structuredContractFailure(findings.map((finding, index) => ({
      path: ["sourceGrounding", index],
      code: finding.code,
      message: finding.reason,
    })));
  }
  return candidate;
};

const parseApplicableCritic = (
  request: SemanticReconstructionRequest,
  candidate: SemanticReconstructionCandidate,
  value: unknown,
) => {
  const critic = parseSemanticCriticResult(value);
  if (critic.verdict !== "REVISE") return critic;
  const rejected = applyCriticRepairs(request, candidate, critic.proposedRepairs).diagnostics.filter((diagnostic) => diagnostic.status === "REJECTED");
  if (rejected.length) {
    throw structuredContractFailure(rejected.map((diagnostic) => ({
      path: ["proposedRepairs", critic.proposedRepairs.findIndex((repair) => repair.repairId === diagnostic.repairId)],
      code: diagnostic.reason,
      message: `Repair ${diagnostic.repairId} is not applicable under the declared action, schema and exact USER source-grounding contract.`,
    })));
  }
  return critic;
};

const diagnosticSummary = (fallback: string, diagnostic: SemanticProviderDiagnostic) => diagnostic.validationIssues.length
  ? `${fallback} Issues: ${diagnostic.validationIssues.slice(0, 12).map((issue) => `${issue.path}:${issue.code}`).join(", ")}.`
  : fallback;

const attemptRecord = (
  attempt: number,
  startedAtMs: number,
  finishedAtMs: number,
  failure: ClassifiedFailure | null,
): SemanticProviderAttempt => ({
  attempt,
  requestStarted: new Date(startedAtMs).toISOString(),
  requestFinished: new Date(finishedAtMs).toISOString(),
  latencyMs: Math.max(0, finishedAtMs - startedAtMs),
  outcome: failure ? "FAILED" : "SUCCESS",
  category: failure?.category ?? null,
  httpStatus: failure?.httpStatus ?? 200,
  providerStatus: failure?.providerStatus ?? null,
  providerCode: failure?.providerCode ?? null,
  providerError: failure?.providerError ?? null,
  retryable: failure?.retryable ?? false,
});

const networkFailure = (caught: unknown): ClassifiedFailure => {
  const aborted = (typeof DOMException !== "undefined" && caught instanceof DOMException && caught.name === "AbortError")
    || (caught instanceof Error && caught.name === "AbortError");
  return {
    category: aborted ? "TIMEOUT" : "NETWORK",
    httpStatus: null,
    providerStatus: null,
    providerCode: null,
    providerError: aborted ? "Provider request timed out." : "Provider network request failed.",
    retryable: true,
    retryAfterMs: null,
  };
};

const structuredFailureAttempts = (
  attempts: SemanticProviderAttempt[],
  failure: ClassifiedFailure,
): SemanticProviderAttempt[] => {
  if (attempts.length === 0) return attempts;
  return attempts.map((attempt, index) => index === attempts.length - 1 ? {
    ...attempt,
    outcome: "FAILED" as const,
    category: failure.category,
    providerError: failure.providerError,
    retryable: false,
  } : attempt);
};

export class GeminiScientificSemanticProvider implements ScientificSemanticProvider {
  readonly metadata: SemanticProviderMetadata;

  constructor(private readonly options: {
    apiKey: string;
    model: string;
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
    temperature?: number;
    maxAttempts?: number;
    retryBaseMs?: number;
    maxRetryDelayMs?: number;
    retryJitterRatio?: number;
    sleepImpl?: (milliseconds: number) => Promise<void>;
    nowMs?: () => number;
    randomImpl?: () => number;
    beforeAttempt?: () => Promise<void>;
  }) {
    this.metadata = { provider: "GOOGLE_GEMINI", model: options.model, temperature: options.temperature ?? null };
  }

  private nowMs() { return this.options.nowMs?.() ?? Date.now(); }

  private async wait(milliseconds: number) {
    if (milliseconds <= 0) return;
    if (this.options.sleepImpl) await this.options.sleepImpl(milliseconds);
    else await new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
  }

  private retryDelay(attempt: number, providerDelay: number | null) {
    const exponential = (this.options.retryBaseMs ?? 1_500) * (2 ** Math.max(0, attempt - 1));
    const jitterRatio = Math.max(0, Math.min(this.options.retryJitterRatio ?? 0.2, 1));
    const jittered = exponential * (1 + (this.options.randomImpl?.() ?? Math.random()) * jitterRatio);
    return Math.min(this.options.maxRetryDelayMs ?? 30_000, Math.max(providerDelay ?? 0, jittered));
  }

  private async generate(systemPrompt: string, payload: unknown, schema: unknown) {
    if (!this.options.apiKey.trim()) throw new SemanticProviderError("AUTHENTICATION");
    if (!this.options.model.trim()) throw new SemanticProviderError("INVALID_MODEL");
    const attempts: SemanticProviderAttempt[] = [];
    const maxAttempts = Math.max(1, Math.min(this.options.maxAttempts ?? 3, 4));

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      await this.options.beforeAttempt?.();
      const startedAtMs = this.nowMs();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 30_000);
      let response: Response;

      try {
        response = await (this.options.fetchImpl ?? fetch)(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.options.model)}:generateContent`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": this.options.apiKey },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: JSON.stringify(payload) }] }],
            generationConfig: {
              responseMimeType: "application/json",
              responseJsonSchema: schema,
              ...(this.metadata.temperature === null ? {} : { temperature: this.metadata.temperature }),
            },
          }),
          signal: controller.signal,
        });
      } catch (caught) {
        clearTimeout(timeout);
        const failure = networkFailure(caught);
        attempts.push(attemptRecord(attempt, startedAtMs, this.nowMs(), failure));
        if (attempt < maxAttempts) {
          await this.wait(this.retryDelay(attempt, null));
          continue;
        }
        throw new SemanticProviderError(failure.category, attempts, failure);
      }

      clearTimeout(timeout);
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        const failure = classifyHttpFailure(response, body);
        attempts.push(attemptRecord(attempt, startedAtMs, this.nowMs(), failure));
        if (failure.retryable && attempt < maxAttempts) {
          await this.wait(this.retryDelay(attempt, failure.retryAfterMs));
          continue;
        }
        throw new SemanticProviderError(failure.category, attempts, failure);
      }

      const refused = safetyFailure(body);
      if (refused) {
        attempts.push(attemptRecord(attempt, startedAtMs, this.nowMs(), refused));
        throw new SemanticProviderError(refused.category, attempts, refused);
      }
      const text = responseText(body);
      if (!text) {
        const failure = invalidOutputFailure("Provider response did not contain structured text.");
        attempts.push(attemptRecord(attempt, startedAtMs, this.nowMs(), failure));
        throw new SemanticProviderError(failure.category, attempts, failure, {
          rawProviderOutput: null, validationIssues: [], structuredOutputClassification: "PARSER_FAILURE", transportValid: false, internalValid: false,
        });
      }
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        const failure = invalidOutputFailure("Provider response was not valid JSON.");
        attempts.push(attemptRecord(attempt, startedAtMs, this.nowMs(), failure));
        throw new SemanticProviderError(failure.category, attempts, failure, {
          rawProviderOutput: text,
          validationIssues: [{ path: "root", code: "invalid_json", message: "Provider response was not valid JSON." }],
          structuredOutputClassification: "PARSER_FAILURE", transportValid: false, internalValid: false,
        });
      }
      attempts.push(attemptRecord(attempt, startedAtMs, this.nowMs(), null));
      return { callId: `gemini-call:${logicalDigest(body)}`, json, rawProviderOutput: text, attempts };
    }

    throw new SemanticProviderError("UNKNOWN_PROVIDER_FAILURE", attempts);
  }

  async reconstruct(request: SemanticReconstructionRequest) {
    const context = providerContext(request);
    const result = await this.generate(SCIENTIFIC_SEMANTIC_RECONSTRUCTION_PROMPT, context, SEMANTIC_RECONSTRUCTION_JSON_SCHEMA);
    try {
      return { callId: result.callId, candidate: parseSourceGroundedReconstruction(request, result.json), attempts: result.attempts };
    } catch (caught) {
      const diagnostic = schemaDiagnostic(caught, result.rawProviderOutput);
      const correction = diagnosticSummary("The previous structured reconstruction was invalid. Return the same scientific meaning while satisfying every schema and exact source-grounding constraint; never fill or remove scientific content silently.", diagnostic);
      const retried = await this.generate(SCIENTIFIC_SEMANTIC_RECONSTRUCTION_PROMPT, { ...context, structuredValidationCorrection: correction }, SEMANTIC_RECONSTRUCTION_JSON_SCHEMA);
      try {
        return { callId: retried.callId, candidate: parseSourceGroundedReconstruction(request, retried.json), attempts: [...(result.attempts ?? []), ...(retried.attempts ?? [])] };
      } catch (retryCaught) {
        const retryDiagnostic = schemaDiagnostic(retryCaught, retried.rawProviderOutput);
        const secondCorrection = diagnosticSummary("The prior bounded correction still violated the structured SEM reconstruction contract. This is the final permitted regeneration: preserve the same scientific meaning, use only exact original USER substrings for sourceText, and satisfy every reported issue without filling or deleting content silently.", retryDiagnostic);
        const secondRetried = await this.generate(SCIENTIFIC_SEMANTIC_RECONSTRUCTION_PROMPT, { ...context, structuredValidationCorrection: secondCorrection }, SEMANTIC_RECONSTRUCTION_JSON_SCHEMA);
        try {
          return {
            callId: secondRetried.callId,
            candidate: parseSourceGroundedReconstruction(request, secondRetried.json),
            attempts: [...(result.attempts ?? []), ...(retried.attempts ?? []), ...(secondRetried.attempts ?? [])],
          };
        } catch (secondRetryCaught) {
          const secondRetryDiagnostic = schemaDiagnostic(secondRetryCaught, secondRetried.rawProviderOutput);
          const failure = invalidOutputFailure(diagnosticSummary("Structured reconstruction did not satisfy the SEM contract after two bounded correction attempts.", secondRetryDiagnostic));
          throw new SemanticProviderError(failure.category, structuredFailureAttempts([...(result.attempts ?? []), ...(retried.attempts ?? []), ...(secondRetried.attempts ?? [])], failure), failure, secondRetryDiagnostic);
        }
      }
    }
  }

  async critique(
    request: SemanticReconstructionRequest,
    candidate: SemanticReconstructionCandidate,
    coverage: { explicit: ExplicitCoverageReport; relations: RelationCoverageReport; taxonomy: SemanticTaxonomyReport; integrity?: SemanticIntegrityReport; cycle: 1 | 2 },
  ) {
    const criticPayload = {
      ...providerContext(request),
      criticCycle: coverage.cycle,
      semanticInventory: candidate.semanticInventory,
      typedCandidate: candidate,
      explicitCoverageReport: coverage.explicit,
      relationCoverageReport: coverage.relations,
      taxonomyReport: coverage.taxonomy,
      integrityReport: coverage.integrity ?? { status: "COMPLETE", findings: [] },
      ambiguities: candidate.ambiguities,
      inferredCandidates: candidate.elements.filter((item) => item.epistemicStatus !== "EXPLICIT_USER_STATED"),
    };
    const result = await this.generate(SCIENTIFIC_SEMANTIC_CRITIC_PROMPT, criticPayload, SEMANTIC_CRITIC_JSON_SCHEMA);
    try {
      return { callId: result.callId, critic: parseApplicableCritic(request, candidate, result.json), attempts: result.attempts };
    } catch (caught) {
      const diagnostic = schemaDiagnostic(caught, result.rawProviderOutput);
      const correction = diagnosticSummary("The previous structured critic output was invalid. Return exactly the 15 distinct required checklist entries once each. Every proposed repair must use exactly one action payload, be applicable to the supplied candidate, and preserve exact USER source grounding.", diagnostic);
      const retried = await this.generate(SCIENTIFIC_SEMANTIC_CRITIC_PROMPT, { ...criticPayload, structuredValidationCorrection: correction }, SEMANTIC_CRITIC_JSON_SCHEMA);
      try {
        return { callId: retried.callId, critic: parseApplicableCritic(request, candidate, retried.json), attempts: [...(result.attempts ?? []), ...(retried.attempts ?? [])] };
      } catch (retryCaught) {
        const retryDiagnostic = schemaDiagnostic(retryCaught, retried.rawProviderOutput);
        const secondCorrection = diagnosticSummary("The prior bounded correction still violated the structured SEM critic contract. This is the final permitted regeneration: return one applicable action per repair, preserve exact original USER grounding, and satisfy every reported issue.", retryDiagnostic);
        const secondRetried = await this.generate(SCIENTIFIC_SEMANTIC_CRITIC_PROMPT, { ...criticPayload, structuredValidationCorrection: secondCorrection }, SEMANTIC_CRITIC_JSON_SCHEMA);
        try {
          return {
            callId: secondRetried.callId,
            critic: parseApplicableCritic(request, candidate, secondRetried.json),
            attempts: [...(result.attempts ?? []), ...(retried.attempts ?? []), ...(secondRetried.attempts ?? [])],
          };
        } catch (secondRetryCaught) {
          const secondRetryDiagnostic = schemaDiagnostic(secondRetryCaught, secondRetried.rawProviderOutput);
          const failure = invalidOutputFailure(diagnosticSummary("Structured critic output did not satisfy the SEM contract after two bounded correction attempts.", secondRetryDiagnostic));
          throw new SemanticProviderError(failure.category, structuredFailureAttempts([...(result.attempts ?? []), ...(retried.attempts ?? []), ...(secondRetried.attempts ?? [])], failure), failure, secondRetryDiagnostic);
        }
      }
    }
  }

  async auditAtomicComposition(
    request: SemanticReconstructionRequest,
    candidate: SemanticReconstructionCandidate,
    cycle: 1 | 2,
  ) {
    const context = makeAtomicCompositionAuditContext(request, candidate, cycle);
    const result = await this.generate(
      SCIENTIFIC_SEMANTIC_ATOMIC_COMPOSITION_AUDIT_PROMPT,
      context,
      SEMANTIC_ATOMIC_COMPOSITION_AUDIT_JSON_SCHEMA,
    );
    try {
      parseSemanticAtomicCompositionTransport(result.json);
    } catch (caught) {
      const diagnostic = schemaDiagnostic(caught, result.rawProviderOutput, "TRANSPORT");
      const failure = invalidOutputFailure(diagnosticSummary("Structured audit did not satisfy the provider transport contract.", diagnostic));
      throw new SemanticProviderError(failure.category, structuredFailureAttempts(result.attempts, failure), failure, diagnostic);
    }
    try {
      return { callId: result.callId, audit: parseSemanticAtomicCompositionAudit(result.json), attempts: result.attempts };
    } catch (caught) {
      const diagnostic = schemaDiagnostic(caught, result.rawProviderOutput, "INTERNAL");
      const failure = invalidOutputFailure(diagnosticSummary("Structured audit satisfied transport but violated an internal semantic invariant.", diagnostic));
      throw new SemanticProviderError(failure.category, structuredFailureAttempts(result.attempts, failure), failure, diagnostic);
    }
  }
}
