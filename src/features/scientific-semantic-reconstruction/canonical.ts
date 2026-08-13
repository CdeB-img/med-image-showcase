import { comparableScientificText, logicalDigest, normalizeScientificText, uniqueSorted } from "@/features/knowledge-engine/canonical";
import {
  SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
  SCIENTIFIC_SEMANTIC_MODEL_VERSION,
  SEMANTIC_CRITIC_PROMPT_VERSION,
  SEMANTIC_RECONSTRUCTION_PROMPT_VERSION,
  type ProviderCandidateElement,
  type ScientificSemanticModel,
  type SemanticCriticResult,
  type SemanticElement,
  type SemanticEpistemicStatus,
  type SemanticExecutionSnapshot,
  type SemanticReconstructionCandidate,
  type SemanticReconstructionRequest,
  type SemanticRelation,
  type SemanticProviderMetadata,
  type SemanticProviderAttempt,
} from "./types";
import { buildSemanticCoverage } from "./coverage";

export class SemanticCanonicalizationError extends Error {
  constructor(public readonly reason: string) {
    super(`SEMANTIC_CANONICALIZATION_FAILED:${reason}`);
  }
}

const activeStatus = (status: SemanticEpistemicStatus) => status !== "REJECTED_BY_USER";
const emptyKnowledgeSupport = (): SemanticElement["knowledgeSupport"] => ({
  status: "NOT_CHECKED",
  resultRef: null,
  assertionRefs: [],
  gapRefs: [],
  checkedAt: null,
});

const sourceSpanFor = (element: ProviderCandidateElement, request: SemanticReconstructionRequest) => {
  if (element.epistemicStatus !== "EXPLICIT_USER_STATED") return null;
  if (!element.sourceMessageId || !element.sourceText) throw new SemanticCanonicalizationError("EXPLICIT_SOURCE_REQUIRED");
  const message = request.messages.find((item) => item.messageId === element.sourceMessageId && item.role === "USER");
  if (!message) throw new SemanticCanonicalizationError("EXPLICIT_SOURCE_MESSAGE_UNKNOWN");
  const start = message.content.indexOf(element.sourceText);
  if (start < 0) throw new SemanticCanonicalizationError("EXPLICIT_SOURCE_NOT_CONTIGUOUS");
  return { messageId: message.messageId, text: element.sourceText, start, end: start + element.sourceText.length };
};

const elementIdentity = (element: Pick<ProviderCandidateElement, "type" | "canonicalMeaning">) => ({
  type: element.type,
  meaning: comparableScientificText(element.canonicalMeaning),
});

const canonicalElementId = (element: Pick<ProviderCandidateElement, "type" | "canonicalMeaning">) =>
  `sem-element:${logicalDigest(elementIdentity(element))}`;

const priorHistoryEntry = (model: ScientificSemanticModel, reason: string): ScientificSemanticModel["history"][number] => ({
  modelId: model.semanticModelId,
  revision: model.revision,
  digest: model.digest,
  status: model.status,
  changedAt: model.updatedAt,
  changeReason: reason,
});

const digestModel = (model: Omit<ScientificSemanticModel, "digest">) => logicalDigest({
  semanticModelVersion: model.semanticModelVersion,
  revision: model.revision,
  status: model.status,
  originalRequest: model.originalRequest,
  normalizedMeaning: model.normalizedMeaning,
  elements: model.elements,
  relations: model.relations,
  explicitCoverageReport: model.explicitCoverageReport,
  relationCoverageReport: model.relationCoverageReport,
  missingConcepts: model.missingConcepts,
  ellipses: model.ellipses,
  ambiguities: model.ambiguities,
  unknowns: model.unknowns,
  contradictions: model.contradictions,
  routeProposal: model.routeProposal,
  critic: model.critic,
  knowledgeSnapshot: model.knowledgeSnapshot,
  previousModelId: model.previousModelId,
  acceptanceRecord: model.acceptanceRecord,
});

export const recomputeSemanticModelDigest = (model: ScientificSemanticModel) => {
  const { digest: _digest, ...base } = model;
  return { ...model, digest: digestModel(base) };
};

export const canonicalizeSemanticReconstruction = (input: {
  request: SemanticReconstructionRequest;
  candidate: SemanticReconstructionCandidate;
  critic: SemanticCriticResult;
  metadata: SemanticProviderMetadata;
  reconstructionCallId: string;
  criticCallId: string;
  criticCallIds?: string[];
  critics?: SemanticCriticResult[];
  reconstructionAttempts?: SemanticProviderAttempt[];
  criticAttempts?: SemanticProviderAttempt[];
  now?: string;
}): ScientificSemanticModel => {
  const now = input.now ?? new Date().toISOString();
  const candidate = input.candidate;
  const coverage = buildSemanticCoverage(input.request, candidate);
  const clientToCanonical = new Map(candidate.elements.map((element) => [element.clientElementId, canonicalElementId(element)]));
  const currentElements = candidate.elements.map((element): SemanticElement => {
    const sourceSpan = sourceSpanFor(element, input.request);
    const semanticElementId = clientToCanonical.get(element.clientElementId)!;
    const previous = input.request.previousModel?.elements.find((item) => item.semanticElementId === semanticElementId);
    return {
      semanticElementId,
      type: element.type,
      canonicalMeaning: normalizeScientificText(element.canonicalMeaning),
      studyRole: element.studyRole,
      polarity: element.polarity,
      inventoryItemIds: uniqueSorted(element.inventoryItemIds),
      sourceSpan,
      epistemicStatus: element.epistemicStatus,
      confidence: element.confidence,
      relationships: [],
      inferenceReason: element.epistemicStatus === "EXPLICIT_USER_STATED" ? null : element.inferenceReason,
      knowledgeSupport: previous?.knowledgeSupport ?? emptyKnowledgeSupport(),
      requiresConfirmation: element.epistemicStatus === "EXPLICIT_USER_STATED" ? false : true,
      provenance: {
        source: element.epistemicStatus === "EXPLICIT_USER_STATED" ? "USER_LANGUAGE" : element.supersedesElementIds.length ? "USER_CORRECTION" : "LLM_INFERENCE",
        messageId: element.sourceMessageId,
        providerCallId: input.reconstructionCallId,
        rawElementId: element.clientElementId,
      },
      supersedesElementIds: uniqueSorted(element.supersedesElementIds),
      version: previous ? previous.version + 1 : 1,
    };
  });

  const supersededIds = new Set(currentElements.flatMap((item) => item.supersedesElementIds));
  const currentIds = new Set(currentElements.map((item) => item.semanticElementId));
  const carriedElements = (input.request.previousModel?.elements ?? []).flatMap((previous): SemanticElement[] => {
    if (currentIds.has(previous.semanticElementId)) return [];
    if (supersededIds.has(previous.semanticElementId)) return [{
      ...previous,
      epistemicStatus: "REJECTED_BY_USER",
      requiresConfirmation: false,
      provenance: { ...previous.provenance, source: "USER_CORRECTION" },
      version: previous.version + 1,
    }];
    return [{ ...previous, provenance: { ...previous.provenance, source: "DETERMINISTIC_CARRY_FORWARD" }, version: previous.version + 1 }];
  });
  const elements = [...currentElements, ...carriedElements].sort((left, right) => left.semanticElementId.localeCompare(right.semanticElementId));
  const knownElementIds = new Set(elements.map((item) => item.semanticElementId));

  const currentRelations = candidate.relations.map((relation): SemanticRelation => {
    const sourceElementId = clientToCanonical.get(relation.sourceClientElementId);
    const targetElementId = clientToCanonical.get(relation.targetClientElementId);
    if (!sourceElementId || !targetElementId) throw new SemanticCanonicalizationError("RELATION_ENDPOINT_UNKNOWN");
    const semanticRelationId = `sem-relation:${logicalDigest({ sourceElementId, targetElementId, relationType: comparableScientificText(relation.relationType) })}`;
    const previous = input.request.previousModel?.relations.find((item) => item.semanticRelationId === semanticRelationId);
    return {
      semanticRelationId,
      sourceElementId,
      targetElementId,
      relationType: normalizeScientificText(relation.relationType).toLocaleUpperCase("fr-FR").replace(/[^A-Z0-9À-ÖØ-Ý]+/g, "_").replace(/^_|_$/g, ""),
      polarity: relation.polarity,
      inventoryRelationIds: uniqueSorted(relation.inventoryRelationIds),
      vocabularyStatus: "RUNTIME_CANDIDATE_RELATION",
      epistemicStatus: relation.epistemicStatus,
      confidence: relation.confidence,
      inferenceReason: relation.epistemicStatus === "EXPLICIT_USER_STATED" ? null : relation.inferenceReason,
      requiresConfirmation: relation.epistemicStatus !== "EXPLICIT_USER_STATED",
      version: previous ? previous.version + 1 : 1,
    };
  });
  const currentRelationIds = new Set(currentRelations.map((item) => item.semanticRelationId));
  const carriedRelations = (input.request.previousModel?.relations ?? []).filter((relation) =>
    !currentRelationIds.has(relation.semanticRelationId)
    && knownElementIds.has(relation.sourceElementId)
    && knownElementIds.has(relation.targetElementId)
    && !supersededIds.has(relation.sourceElementId)
    && !supersededIds.has(relation.targetElementId),
  ).map((relation) => ({ ...relation, version: relation.version + 1 }));
  const relations = [...currentRelations, ...carriedRelations].sort((left, right) => left.semanticRelationId.localeCompare(right.semanticRelationId));
  const relationshipMap = new Map<string, string[]>();
  relations.forEach((relation) => {
    relationshipMap.set(relation.sourceElementId, [...(relationshipMap.get(relation.sourceElementId) ?? []), relation.semanticRelationId]);
    relationshipMap.set(relation.targetElementId, [...(relationshipMap.get(relation.targetElementId) ?? []), relation.semanticRelationId]);
  });
  elements.forEach((element) => { element.relationships = uniqueSorted(relationshipMap.get(element.semanticElementId) ?? []); });

  const unresolvedCritical = input.critic.issues.some((issue) => issue.severity === "CRITICAL" && !issue.resolved);
  const status: ScientificSemanticModel["status"] = input.critic.verdict !== "ACCEPT"
    || unresolvedCritical
    || coverage.explicit.status === "INCOMPLETE"
    || coverage.relations.status === "INCOMPLETE"
    || coverage.taxonomy.status === "INCOMPLETE"
    || coverage.integrity.status === "INCOMPLETE"
    ? "CLARIFICATION_REQUIRED"
    : "CANDIDATE";
  const mapClientIds = (ids: string[]) => uniqueSorted(ids.map((id) => clientToCanonical.get(id)).filter((id): id is string => Boolean(id)));
  const executionSnapshot: SemanticExecutionSnapshot = {
    provider: input.metadata.provider,
    model: input.metadata.model,
    reconstructionPromptVersion: SEMANTIC_RECONSTRUCTION_PROMPT_VERSION,
    criticPromptVersion: SEMANTIC_CRITIC_PROMPT_VERSION,
    schemaVersion: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION,
    reconstructionCallId: input.reconstructionCallId,
    criticCallId: input.criticCallId,
    criticCallIds: input.criticCallIds ?? [input.criticCallId],
    reconstructionAttempts: input.reconstructionAttempts ?? [],
    criticAttempts: input.criticAttempts ?? [],
    rawReconstruction: input.candidate,
    rawCritic: input.critic,
    rawCritics: input.critics ?? [input.critic],
    temperature: input.metadata.temperature,
    executedAt: now,
  };
  const base: Omit<ScientificSemanticModel, "digest"> = {
    semanticModelVersion: SCIENTIFIC_SEMANTIC_MODEL_VERSION,
    semanticModelId: `semantic-model:${logicalDigest({ sessionId: input.request.sessionId, revision: (input.request.previousModel?.revision ?? 0) + 1, messages: input.request.messages.map((item) => item.messageId) })}`,
    revision: (input.request.previousModel?.revision ?? 0) + 1,
    status,
    originalRequest: input.request.messages.find((item) => item.role === "USER")?.content ?? "",
    normalizedMeaning: normalizeScientificText(candidate.normalizedMeaning),
    conversationMessageIds: input.request.messages.map((item) => item.messageId),
    elements,
    relations,
    explicitCoverageReport: coverage.explicit,
    relationCoverageReport: coverage.relations,
    missingConcepts: uniqueSorted(candidate.missingConcepts.map(normalizeScientificText)),
    ellipses: uniqueSorted(candidate.ellipses.map(normalizeScientificText)),
    ambiguities: uniqueSorted(candidate.ambiguities.map(normalizeScientificText)),
    unknowns: uniqueSorted(candidate.unknowns.map(normalizeScientificText)),
    contradictions: uniqueSorted(candidate.contradictions.map(normalizeScientificText)),
    clarificationCandidates: candidate.clarificationCandidates.map((item) => ({ question: normalizeScientificText(item.question), reason: normalizeScientificText(item.reason), resolvesElementIds: mapClientIds(item.resolvesClientElementIds) })),
    knowledgeRequests: candidate.knowledgeRequests.map((item) => ({ elementIds: mapClientIds(item.elementClientIds), purpose: normalizeScientificText(item.purpose) })),
    routeProposal: { ...candidate.routeProposal, expectedCapabilities: uniqueSorted(candidate.routeProposal.expectedCapabilities) },
    summaryForUser: normalizeScientificText(candidate.summaryForUser),
    critic: { verdict: input.critic.verdict, issues: input.critic.issues, summary: normalizeScientificText(input.critic.criticSummary) },
    executionSnapshot,
    knowledgeSnapshot: null,
    previousModelId: input.request.previousModel?.semanticModelId ?? null,
    history: input.request.previousModel ? [...input.request.previousModel.history, priorHistoryEntry(input.request.previousModel, "Nouvelle contribution utilisateur analysée sans réécriture de l’état antérieur.")] : [],
    acceptedAt: null,
    acceptanceRecord: null,
    createdAt: input.request.previousModel?.createdAt ?? now,
    updatedAt: now,
  };
  return { ...base, digest: digestModel(base) };
};

export const createDegradedSemanticModel = (request: SemanticReconstructionRequest, now = new Date().toISOString()): ScientificSemanticModel => {
  const originalRequest = request.messages.find((item) => item.role === "USER")?.content ?? "";
  const previous = request.previousModel;
  const base: Omit<ScientificSemanticModel, "digest"> = {
    semanticModelVersion: SCIENTIFIC_SEMANTIC_MODEL_VERSION,
    semanticModelId: `semantic-model-degraded:${logicalDigest({ sessionId: request.sessionId, messages: request.messages.map((item) => item.messageId) })}`,
    revision: (previous?.revision ?? 0) + 1,
    status: "SEMANTIC_RECONSTRUCTION_DEGRADED",
    originalRequest,
    normalizedMeaning: originalRequest,
    conversationMessageIds: request.messages.map((item) => item.messageId),
    elements: previous?.elements.map((item) => ({ ...item, provenance: { ...item.provenance, source: "DETERMINISTIC_CARRY_FORWARD" }, version: item.version + 1 })) ?? [],
    relations: previous?.relations.map((item) => ({ ...item, version: item.version + 1 })) ?? [],
    explicitCoverageReport: { status: "INCOMPLETE", entries: [] },
    relationCoverageReport: { status: "INCOMPLETE", entries: [] },
    missingConcepts: ["Compréhension sémantique avancée indisponible"],
    ellipses: [], ambiguities: [], unknowns: ["Le contenu de la nouvelle contribution n’a pas été reconstruit"], contradictions: [],
    clarificationCandidates: [], knowledgeRequests: [],
    routeProposal: { route: "REVIEW_REROUTE", confidence: 0, reason: "Le fallback déterministe ne revendique aucune équivalence avec la reconstruction LLM.", expectedCapabilities: [] },
    summaryForUser: "La compréhension avancée est temporairement indisponible. Votre texte original est conservé, mais NOXIA ne prétend pas en avoir reconstruit le sens.",
    critic: { verdict: "CLARIFICATION_REQUIRED", issues: [], summary: "Aucune critique LLM n’a pu être exécutée." },
    executionSnapshot: null, knowledgeSnapshot: previous?.knowledgeSnapshot ?? null,
    previousModelId: previous?.semanticModelId ?? null,
    history: previous ? [...previous.history, priorHistoryEntry(previous, "Mode dégradé : état antérieur conservé.")] : [],
    acceptedAt: null, acceptanceRecord: null,
    createdAt: previous?.createdAt ?? now, updatedAt: now,
  };
  return { ...base, digest: digestModel(base) };
};

export const acceptSemanticModel = (model: ScientificSemanticModel, now = new Date().toISOString()): ScientificSemanticModel => {
  if (model.status === "SEMANTIC_RECONSTRUCTION_DEGRADED" || model.status === "CLARIFICATION_REQUIRED") return model;
  const elements = model.elements.map((element) => {
    if (["INFERRED_HIGH_CONFIDENCE", "INFERRED_CANDIDATE", "SUPPORTED_CANDIDATE"].includes(element.epistemicStatus)) {
      return { ...element, epistemicStatus: "CONFIRMED_BY_USER" as const, requiresConfirmation: false, version: element.version + 1 };
    }
    return element;
  });
  const relations = model.relations.map((relation) => ["INFERRED_HIGH_CONFIDENCE", "INFERRED_CANDIDATE", "SUPPORTED_CANDIDATE"].includes(relation.epistemicStatus)
    ? { ...relation, epistemicStatus: "CONFIRMED_BY_USER" as const, requiresConfirmation: false, version: relation.version + 1 }
    : relation);
  const acceptedElementIds = elements.filter((item) => activeStatus(item.epistemicStatus) && item.epistemicStatus !== "UNSUPPORTED_CANDIDATE").map((item) => item.semanticElementId);
  const retainedCandidateIds = elements.filter((item) => item.epistemicStatus === "UNSUPPORTED_CANDIDATE").map((item) => item.semanticElementId);
  const base: Omit<ScientificSemanticModel, "digest"> = {
    ...model,
    semanticModelId: `semantic-model:${logicalDigest({ previous: model.semanticModelId, acceptance: now })}`,
    revision: model.revision + 1,
    status: "ACCEPTED",
    elements,
    relations,
    previousModelId: model.semanticModelId,
    history: [...model.history, priorHistoryEntry(model, "Compréhension acceptée par l’utilisateur sans promotion de support scientifique.")],
    acceptedAt: now,
    acceptanceRecord: { type: "SEMANTIC_INTERPRETATION_ACCEPTED", acceptedElementIds, retainedCandidateIds },
    updatedAt: now,
  };
  return { ...base, digest: digestModel(base) };
};

export const activeSemanticElements = (model: ScientificSemanticModel) => model.elements.filter((item) => activeStatus(item.epistemicStatus));
