import { logicalDigest } from "../knowledge-engine/canonical.js";
import { applyDeterministicAudit } from "./audit.js";
import { canonicalizeScientificContribution } from "./canonical.js";
import {
  SCIENTIFIC_INTERPRETATION_CONTRIBUTION_CONTRACT,
  SCIENTIFIC_INTERPRETATION_CONTRIBUTION_VERSION,
  ScientificInterpretationTechnicalError,
  type AuthorizedScientificInterpretationContext,
  type ContributionEpistemicBoundary,
  type ScientificContributionItem,
  type ScientificInterpretationContributionEnvelope,
  type ScientificInterpretationConversation,
  type ScientificInterpretationRuntime,
} from "./contracts.js";
import type { ScientificInterpretationRawStore } from "./raw-persistence.js";

type GenericRecord = Record<string, unknown>;

export type HybridNativeExecution = {
  operationId: string;
  provider: string | null;
  model: string | null;
  promptDigest: string | null;
  schemaDigest: string | null;
  configurationDigest: string | null;
  runtimeId: string;
  runtimeVersion: string;
  rawOutput: unknown;
  technicalFailure?: {
    failureClass: "PROVIDER_FAILURE" | "TRANSPORT_FAILURE" | "PARSING_FAILURE" | "STRUCTURED_CONTRACT_FAILURE" | "HYBRID_RUNTIME_UNAVAILABLE";
    message: string;
  } | null;
  providerAttempts?: Array<{
    attempt: number;
    startedAt: string;
    completedAt: string;
    httpStatus: number | null;
    providerStatus: string;
    outcome: "SUCCESS" | "FAILED";
    retryable: boolean;
    waitDurationMs: number;
  }>;
};

export type HybridParsedState = GenericRecord;

const record = (value: unknown): GenericRecord => value && typeof value === "object" && !Array.isArray(value) ? value as GenericRecord : {};
const stringOrNull = (value: unknown) => typeof value === "string" ? value : null;
const numberOrNull = (value: unknown) => typeof value === "number" ? value : null;
const stringList = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
const recordList = (value: unknown) => Array.isArray(value) ? value.map(record) : [];

const boundaryFrom = (item: GenericRecord): ContributionEpistemicBoundary => ({
  ownership: stringOrNull(item.ownership ?? item.owner),
  epistemicStatus: stringOrNull(item.epistemicStatus),
  adoptionStatus: stringOrNull(item.adoptionStatus),
  originType: stringOrNull(item.originType),
  originStatus: stringOrNull(item.originStatus),
  decisionId: stringOrNull(item.decisionId),
  activeState: typeof item.activeState === "boolean" ? item.activeState : null,
  sourceTurnIds: stringList(item.sourceTurnIds),
  sourceText: stringOrNull(item.sourceText),
});

const itemFrom = (value: unknown, path: string, index: number): ScientificContributionItem => {
  const item = record(value);
  const content = stringOrNull(item.content) ?? stringOrNull(item.currentContent) ?? "";
  return {
    itemId: stringOrNull(item.elementId) ?? stringOrNull(item.missingId) ?? stringOrNull(item.ambiguityId) ?? stringOrNull(item.correctionId) ?? stringOrNull(item.decisionId) ?? `${path}:${index}:${logicalDigest(item)}`,
    semanticIdentity: stringOrNull(item.semanticIdentity) ?? stringOrNull(item.currentSemanticIdentity),
    proposedType: stringOrNull(item.semanticType),
    content,
    polarity: stringOrNull(item.polarity),
    studyRole: stringOrNull(item.studyRole),
    confidence: numberOrNull(item.confidence),
    availabilityClaim: stringOrNull(item.availabilityClaim),
    availabilityScope: stringOrNull(item.availabilityScope),
    previousItemIds: stringList(item.previousElementIds).length ? stringList(item.previousElementIds) : stringOrNull(item.previousSemanticIdentity) ? [stringOrNull(item.previousSemanticIdentity)!] : [],
    evidenceRefs: stringList(item.evidenceRefs),
    epistemicBoundary: boundaryFrom(item),
  };
};

const mapItems = (state: GenericRecord, key: string) => recordList(state[key]).map((item, index) => itemFrom(item, key, index));

export const mapHybridStateToContribution = (input: {
  state: HybridParsedState;
  execution: Omit<HybridNativeExecution, "rawOutput">;
  rawOutputRef: string;
  rawOutputDigest: string;
  conversation: ScientificInterpretationConversation;
  previousContribution?: ScientificInterpretationContributionEnvelope | null;
  authorizedContext?: AuthorizedScientificInterpretationContext;
}): ScientificInterpretationContributionEnvelope => {
  const state = record(input.state);
  const identity = record(state.identity);
  const understanding = record(state.understanding);
  const source = record(state.source);
  const objects = mapItems(state, "objects");
  const allMappedItems = [
    ...objects,
    ...mapItems(state, "explicitStatements"),
    ...mapItems(state, "inferredContext"),
    ...mapItems(state, "contextualCandidates"),
    ...mapItems(state, "negationsAndConstraints"),
    ...mapItems(state, "temporalElements"),
    ...mapItems(state, "ambiguities"),
    ...mapItems(state, "unknowns"),
    ...mapItems(state, "missingInformation"),
    ...mapItems(state, "correctionsAndSupersessions"),
    ...mapItems(state, "openDecisions"),
    ...mapItems(state, "clarificationNeeds"),
  ];
  const mapped = canonicalizeScientificContribution({
    contract: SCIENTIFIC_INTERPRETATION_CONTRIBUTION_CONTRACT,
    contractNature: "RUNTIME_CONTRIBUTION_NOT_PD003_ROOT",
    identity: {
      contributionId: stringOrNull(identity.stateId) ?? `hybrid-contribution:${logicalDigest({ state, raw: input.rawOutputDigest })}`,
      contractVersion: SCIENTIFIC_INTERPRETATION_CONTRIBUTION_VERSION,
      runtimeId: input.execution.runtimeId,
      runtimeVersion: input.execution.runtimeVersion,
      createdAt: stringOrNull(identity.generatedAt) ?? new Date().toISOString(),
    },
    source: {
      conversationId: stringOrNull(identity.conversationId) ?? input.conversation.conversationId,
      originalRequest: stringOrNull(source.originalRequest) ?? input.conversation.turns.at(-1)?.content ?? "",
      turns: input.conversation.turns,
      sourceRefs: input.authorizedContext?.sourceRefs ?? input.conversation.turns.map((turn) => turn.turnId),
      rawOutputRef: input.rawOutputRef,
      rawOutputDigest: input.rawOutputDigest,
    },
    runtimeEvidence: {
      provider: input.execution.provider,
      model: input.execution.model,
      promptDigest: input.execution.promptDigest,
      schemaDigest: input.execution.schemaDigest,
      configurationDigest: input.execution.configurationDigest,
      technicalStatus: stringOrNull(state.technicalStatus) ?? "UNKNOWN",
      parseStatus: "PARSED",
      validationErrors: [],
    },
    scientificContent: {
      normalizedUnderstanding: stringOrNull(understanding.normalizedUnderstanding),
      routeProposal: null,
      explicitStatements: mapItems(state, "explicitStatements"),
      candidateObjects: objects,
      candidateRelations: recordList(state.relations).map((value, index) => ({
        relationId: stringOrNull(value.relationId) ?? `relations:${index}:${logicalDigest(value)}`,
        relationType: stringOrNull(value.relationType) ?? "UNSPECIFIED_RELATION",
        sourceItemId: stringOrNull(value.sourceElementId) ?? "UNRESOLVED_SOURCE",
        targetItemId: stringOrNull(value.targetElementId) ?? "UNRESOLVED_TARGET",
        polarity: stringOrNull(value.polarity),
        confidence: numberOrNull(value.confidence),
        epistemicBoundary: boundaryFrom(value),
      })),
      inferredContext: mapItems(state, "inferredContext"),
      contextualCandidates: mapItems(state, "contextualCandidates"),
      negationsAndConstraints: mapItems(state, "negationsAndConstraints"),
      temporalElements: mapItems(state, "temporalElements"),
      ambiguities: mapItems(state, "ambiguities"),
      unknowns: mapItems(state, "unknowns"),
      missingInformation: mapItems(state, "missingInformation"),
      correctionsAndSupersessions: mapItems(state, "correctionsAndSupersessions"),
      openDecisions: mapItems(state, "openDecisions"),
      clarificationNeeds: mapItems(state, "clarificationNeeds"),
    },
    epistemicBoundary: {
      candidateIsAdopted: false,
      knowledgeSupportIsProjectDecision: false,
      projectOwnershipTransferred: false,
      humanDecisionEnvelopeRef: input.authorizedContext?.decisionEnvelopeRef ?? null,
    },
    mapping: allMappedItems.map((item) => ({
      sourceItemId: item.itemId,
      proposedTargetDomain: null,
      proposedTargetTypes: item.proposedType ? [item.proposedType] : [],
      mappingStatus: item.proposedType ? "DOMAIN_REVIEW_REQUIRED" : "DEFERRED",
      qualificationOwnerRequired: input.authorizedContext?.domainOwner ?? null,
      mappingLimitations: item.proposedType ? ["Runtime type preserved as a proposal; no PD-003 V2 promotion."] : ["No target type supplied by the runtime."],
    })),
    audit: { deterministicFindings: [], semanticAuditFindings: [], unresolvedFindings: [] },
    decisionBoundary: {
      decisionRequired: true,
      decisionEnvelopeRef: input.authorizedContext?.decisionEnvelopeRef ?? null,
      permittedHumanDispositions: ["ACCEPT_WORKING_BASIS", "REJECT", "DEFER", "REOPEN", "PARTIAL_SELECTION", "ROUTE_TO_SPECIALIST"],
      projectWriteAuthorized: false,
    },
  });
  return applyDeterministicAudit(mapped, input.previousContribution);
};

export class HybridScientificInterpretationRuntimeAdapter implements ScientificInterpretationRuntime {
  constructor(
    readonly runtimeId: string,
    readonly runtimeVersion: string,
    private readonly executeNative: (conversation: ScientificInterpretationConversation, previousState?: ScientificInterpretationContributionEnvelope | null) => Promise<HybridNativeExecution>,
    private readonly rawStore: ScientificInterpretationRawStore,
    private readonly parse: (raw: unknown, execution: HybridNativeExecution, conversation: ScientificInterpretationConversation, previousState?: ScientificInterpretationContributionEnvelope | null) => HybridParsedState,
  ) {}

  async interpret(conversation: ScientificInterpretationConversation, previousState = null, authorizedContext?: AuthorizedScientificInterpretationContext) {
    let execution: HybridNativeExecution;
    try {
      execution = await this.executeNative(conversation, previousState);
    } catch (error) {
      if (error instanceof ScientificInterpretationTechnicalError) throw error;
      throw new ScientificInterpretationTechnicalError("PROVIDER_FAILURE", error instanceof Error ? error.message : "PROVIDER_FAILURE");
    }
    const raw = await this.rawStore.persistAtomically({ operationId: execution.operationId, payload: execution.rawOutput });
    if (execution.technicalFailure) {
      throw new ScientificInterpretationTechnicalError(
        execution.technicalFailure.failureClass,
        execution.technicalFailure.message,
        raw.rawOutputRef,
        execution.operationId,
      );
    }
    let state: HybridParsedState;
    try {
      state = this.parse(execution.rawOutput, execution, conversation, previousState);
    } catch (error) {
      const failureClass = error instanceof SyntaxError || (error instanceof Error && /JSON|PROVIDER_(?:STRUCTURED_TEXT|RESPONSE_BODY)_MISSING/.test(error.message))
        ? "PARSING_FAILURE" as const
        : "STRUCTURED_CONTRACT_FAILURE" as const;
      throw new ScientificInterpretationTechnicalError(failureClass, error instanceof Error ? error.message : failureClass, raw.rawOutputRef, execution.operationId);
    }
    if (!state.identity || !state.source || !Array.isArray(state.objects) || !Array.isArray(state.relations)) {
      throw new ScientificInterpretationTechnicalError("STRUCTURED_CONTRACT_FAILURE", "HYBRID_STATE_REQUIRED_FIELDS_MISSING", raw.rawOutputRef, execution.operationId);
    }
    try {
      const { rawOutput: _rawOutput, ...evidence } = execution;
      return mapHybridStateToContribution({ state, execution: evidence, rawOutputRef: raw.rawOutputRef, rawOutputDigest: raw.rawOutputDigest, conversation, previousContribution: previousState, authorizedContext });
    } catch (error) {
      if (error instanceof ScientificInterpretationTechnicalError) throw error;
      throw new ScientificInterpretationTechnicalError("STRUCTURED_CONTRACT_FAILURE", error instanceof Error ? error.message : "CONTRIBUTION_MAPPING_FAILURE", raw.rawOutputRef, execution.operationId);
    }
  }
}
