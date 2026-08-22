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
  type ScientificContributionRelation,
  type ScientificInterpretationDialogueIntent,
  type ScientificInterpretationDomainDecision,
  type ScientificInterpretationContributionEnvelope,
  type ScientificInterpretationConversation,
  type ScientificInterpretationTerminologyResolution,
  type ScientificInterpretationRuntime,
} from "./contracts.js";
import type { ScientificInterpretationRawStore } from "./raw-persistence.js";
import { buildScientificInterpretationTerminologyContext } from "./terminology-grounding.js";

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
const semanticUnitOrNull = (value: unknown) => {
  const unit = stringOrNull(value)?.trim() ?? null;
  return unit && !/^(?:null|none|n\/?a|not specified|unspecified)$/i.test(unit) ? unit : null;
};
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
    semanticFunction: stringOrNull(item.semanticFunction) as ScientificContributionItem["semanticFunction"] ?? undefined,
    evidenceBasis: stringOrNull(item.evidenceBasis) as ScientificContributionItem["evidenceBasis"] ?? undefined,
    projectDisposition: stringOrNull(item.projectDisposition) as ScientificContributionItem["projectDisposition"] ?? undefined,
    referencedProjectElementIds: stringList(item.referencedProjectElementIds),
    relatedItemIds: stringList(item.relatedElementIds),
    quantitativeBounds: item.quantitativeBounds && typeof item.quantitativeBounds === "object" && !Array.isArray(item.quantitativeBounds)
      ? {
        lower: numberOrNull(record(item.quantitativeBounds).lower),
        upper: numberOrNull(record(item.quantitativeBounds).upper),
        unit: semanticUnitOrNull(record(item.quantitativeBounds).unit),
      }
      : null,
    epistemicBoundary: boundaryFrom(item),
  };
};

const mapItems = (state: GenericRecord, key: string) => recordList(state[key]).map((item, index) => itemFrom(item, key, index));

const terminologyResolutionFrom = (value: GenericRecord): ScientificInterpretationTerminologyResolution => ({
  resolutionId: stringOrNull(value.resolutionId) ?? `terminology-resolution:${logicalDigest(value)}`,
  surfaceForm: stringOrNull(value.surfaceForm) ?? "",
  resolvedMeaning: stringOrNull(value.resolvedMeaning),
  status: (stringOrNull(value.status) ?? "UNRESOLVED") as ScientificInterpretationTerminologyResolution["status"],
  source: (stringOrNull(value.source) ?? "NONE") as ScientificInterpretationTerminologyResolution["source"],
  confidence: numberOrNull(value.confidence),
  alternatives: stringList(value.alternatives),
  semanticRoleCandidate: stringOrNull(value.semanticRoleCandidate),
  referencedProjectElementIds: stringList(value.referencedProjectElementIds),
  understandingElementIds: stringList(value.understandingElementIds),
  sourceTurnIds: stringList(value.sourceTurnIds),
  sourceText: stringOrNull(value.sourceText),
});

const relationFrom = (value: GenericRecord, index: number, path = "relations"): ScientificContributionRelation => ({
  relationId: stringOrNull(value.relationId) ?? `${path}:${index}:${logicalDigest(value)}`,
  relationType: stringOrNull(value.relationType) ?? "UNSPECIFIED_RELATION",
  sourceItemId: stringOrNull(value.sourceElementId) ?? "UNRESOLVED_SOURCE",
  targetItemId: stringOrNull(value.targetElementId) ?? "UNRESOLVED_TARGET",
  polarity: stringOrNull(value.polarity),
  confidence: numberOrNull(value.confidence),
  epistemicBoundary: boundaryFrom(value),
});

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
  const domainDecision = record(state.domainDecision);
  const dialogueRouting = record(state.dialogueRouting);
  const routeProposal = record(state.routeProposal);
  const source = record(state.source);
  const richUnderstandingItems = mapItems(state, "understandingElements");
  const objects = mapItems(state, "objects");
  const negationsAndConstraints = mapItems(state, "negationsAndConstraints");
  const ambiguities = mapItems(state, "ambiguities");
  const unknowns = mapItems(state, "unknowns");
  const correctionsAndSupersessions = mapItems(state, "correctionsAndSupersessions");
  const terminologyResolutions = recordList(state.terminologyResolutions).map(terminologyResolutionFrom);
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
      previousContributionId: stringOrNull(identity.previousStateId) ?? input.previousContribution?.identity.contributionId ?? null,
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
    cognitiveBoundary: {
      lifecycle: "EPHEMERAL_TRACEABLE_NON_AUTHORITATIVE",
      authoritative: false,
      domainDecision: {
        decision: (stringOrNull(domainDecision.decision) ?? "IN_SCOPE") as ScientificInterpretationDomainDecision,
        confidence: numberOrNull(domainDecision.confidence),
        rationale: stringOrNull(domainDecision.rationale) ?? "No domain rationale supplied.",
        inScopeSegments: stringList(domainDecision.inScopeSegments),
        outOfScopeSegments: stringList(domainDecision.outOfScopeSegments),
        responseMessage: stringOrNull(domainDecision.responseMessage),
        projectMutationAllowed: domainDecision.projectMutationAllowed === true,
      },
      dialogueRouting: {
        intent: (stringOrNull(dialogueRouting.intent) ?? "SCIENTIFIC_INPUT") as ScientificInterpretationDialogueIntent,
        confidence: numberOrNull(dialogueRouting.confidence),
        rationale: stringOrNull(dialogueRouting.rationale) ?? "No dialogue rationale supplied.",
        answersCurrentQuery: dialogueRouting.answersCurrentQuery === true,
        preservesCurrentQueryAction: dialogueRouting.preservesCurrentQueryAction !== false,
        questionContextMismatch: dialogueRouting.questionContextMismatch === true,
        responseMessage: stringOrNull(dialogueRouting.responseMessage),
      },
      terminologyGrounding: {
        context: buildScientificInterpretationTerminologyContext(input.conversation, input.previousContribution),
        resolutions: terminologyResolutions,
      },
      semanticUnderstanding: {
        summary: stringOrNull(understanding.normalizedUnderstanding) ?? stringOrNull(state.normalizedUnderstanding) ?? "",
        elements: richUnderstandingItems,
        relations: recordList(state.understandingRelations).map((value, index) => relationFrom(value, index, "understandingRelations")),
      },
    },
    scientificContent: {
      normalizedUnderstanding: stringOrNull(understanding.normalizedUnderstanding),
      routeProposal: stringOrNull(routeProposal.route) ? {
        route: stringOrNull(routeProposal.route)!,
        confidence: numberOrNull(routeProposal.confidence),
        reason: stringOrNull(routeProposal.reason),
      } : null,
      explicitStatements: mapItems(state, "explicitStatements"),
      candidateObjects: objects,
      candidateRelations: recordList(state.relations).map((value, index) => relationFrom(value, index)),
      inferredContext: mapItems(state, "inferredContext"),
      contextualCandidates: mapItems(state, "contextualCandidates"),
      negationsAndConstraints: negationsAndConstraints.length
        ? negationsAndConstraints
        : richUnderstandingItems.filter((item) => item.semanticFunction === "NEGATION"),
      temporalElements: mapItems(state, "temporalElements"),
      ambiguities: ambiguities.length
        ? ambiguities
        : richUnderstandingItems.filter((item) => item.semanticFunction === "AMBIGUITY"),
      unknowns: unknowns.length
        ? unknowns
        : richUnderstandingItems.filter((item) => ["UNKNOWN", "UNCERTAINTY"].includes(item.semanticFunction ?? "")),
      missingInformation: mapItems(state, "missingInformation"),
      correctionsAndSupersessions: correctionsAndSupersessions.length
        ? correctionsAndSupersessions
        : richUnderstandingItems.filter((item) => item.semanticFunction === "CORRECTION"),
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
