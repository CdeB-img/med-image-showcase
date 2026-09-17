import { decodeSessionStorage } from "./session-storage-codec";
import { rehydrateStudyProposal } from "./study-proposal-standard";
import type {
  ScientificInterpretationContributionEnvelope,
  ScientificInterpretationTurn,
} from "@/features/scientific-interpretation/contracts";
import type {
  ResearchProjectOwnerAuthority,
  ResearchProjectOwnerProjection,
  ResearchProjectContributionCandidate,
} from "@/features/research-project-construction";
import {
  createEmptyFunctionalResetDocumentPortfolio,
  type FunctionalResetDocumentPortfolio,
} from "@/features/document-projection";
import type { FunctionalResetQueryNavigation } from "@/features/query-navigation";
import type { HumanDecisionEnvelope } from "@/features/protocol-designer/human-decision";
import type { RetainedContributionCandidate } from "./contribution-lifecycle";
import type { LocalProjectMetadata } from "./project-administration";
import { realizeGovernedConversation } from "@/features/query-navigation/governed-conversation-realization";
import type {
  ProductEntryRoutingDecision,
  ProductUnderstandKnowledgePresentation,
} from "./product-entry-routing";
import type {
  PersistentDeltaValidation,
  PersistentExtractionProviderArtifact,
  PersistentProjectDeltaCandidate,
  PersistentProjectDeltaWireCandidate,
  ProductBridgeRequest,
  ProductBridgeResponse,
} from "@/features/protocol-designer/product-bridge";
import {
  latestRecordedProviderSessionCostUsd,
  providerSessionCostSummary,
  type ProviderCallRecord,
} from "@/features/protocol-designer/provider-call-observability";
import type { CanonicalProjectChangeSet, ContributionProjectChangeSet, HumanReviewProjection } from "@/features/research-project-construction";
import { HUMAN_REVIEW_PROJECTION_VERSION, ensureCanonicalProjectState } from "@/features/research-project-construction";
import {
  PRODUCT_KNOWLEDGE_OWNER_LEDGER_CONTRACT,
  createProductKnowledgeOwnerLedger,
  rehydrateProductKnowledgeOwnerLedger,
  type ProductKnowledgeOwnerLedger,
} from "@/features/protocol-designer/product-knowledge-owner-runtime";
import {
  PRODUCT_VALIDATION_RUN_LEDGER_CONTRACT,
  createProductValidationRunLedger,
  rehydrateProductValidationRunLedger,
  type ProductValidationRunLedger,
} from "@/features/protocol-designer/product-validation-run-ledger";
import {
  SCIENTIFIC_EXECUTION_TRACE_LEDGER_CONTRACT,
  createScientificExecutionTraceLedger,
  rehydrateScientificExecutionTraceLedger,
  type PreProjectScientificTraceSegment,
  type ScientificExecutionTraceLedger,
} from "@/features/protocol-designer/scientific-execution-trace";
import type {
  StandardStudyDesignInteraction,
  StandardStudyDesignPresentation,
} from "./study-design-standard";
import type { StandardScientificThinkingInteraction } from "./scientific-thinking-standard";
import type { StandardObservabilityInteraction, StandardObservabilityPresentation } from "./observability-standard";
import type { StandardImagingInteraction, StandardImagingPresentation } from "./imaging-standard";
import type { StandardBiostatisticsInteraction, StandardBiostatisticsPresentation } from "./biostatistics-standard";
import type { StandardCanonicalStudyDataInteraction, StandardCanonicalStudyDataPresentation } from "./canonical-study-data-standard";
import type { StandardDataManagementInteraction, StandardDataManagementPresentation } from "./data-management-standard";
import type {
  StandardConversationActionGroupPresentation,
  StandardConversationActionGroupResponse,
} from "./standard-conversation-action-group";
import {
  CONVERSATION_LANGUAGE_GATEWAY_CONTRACT,
  createConversationLanguageGatewayState,
  type ConversationLanguageGatewayState,
  type MultilingualUserTurn,
} from "@/features/protocol-designer/conversation-language-gateway";

export const FUNCTIONAL_RESET_STORAGE_KEY = "noxia-protocol-designer-functional-reset-v3";
export const INITIAL_NOXIA_MESSAGE = "Décrivez votre projet de recherche, une question, une hypothèse ou un protocole existant.";
export const LEGACY_PROJECT_FIRST_NOXIA_MESSAGE = "Décrivez-moi le projet de recherche que vous souhaitez construire.";

export const productEntryPromptForIntent = (
  routeIntent: ProductEntryRoutingDecision["routeIntent"] | undefined,
) => routeIntent === "UNDERSTAND"
  ? "Que souhaitez-vous comprendre ou comparer ?"
  : routeIntent === "FORMALIZE_IDEA"
    ? "Décrivez l’idée ou l’intuition scientifique que vous souhaitez travailler."
    : routeIntent === "DESIGN_STUDY"
      ? "Décrivez le projet de recherche que vous souhaitez construire."
    : "Décrivez votre projet ou posez votre première question…";

export const shouldMediatePostAdoptionQuery = (
  navigation: Pick<FunctionalResetQueryNavigation, "currentAction" | "currentPresentation" | "standardQuestion">,
) => Boolean(navigation.currentAction && navigation.currentPresentation && navigation.standardQuestion);

export type PostAdoptionQueryContinuation = {
  content: string;
  presentationSource: "GEMINI_MEDIATED" | "GOVERNED_LOCAL_REALIZATION" | "QRY_STANDARD_FALLBACK" | "RDE_STANDARD_PROJECTION" | "RDE_INFORMATION_NEED" | "ST_STANDARD_PROJECTION" | "OBS_STANDARD_PROJECTION" | "IMAGING_STANDARD_PROJECTION" | "BIOSTATISTICS_STANDARD_PROJECTION" | "CDM_STANDARD_PROJECTION" | "DATA_MANAGEMENT_STANDARD_PROJECTION" | "KNOWLEDGE_STANDARD_PROJECTION" | "REG_STANDARD_PROJECTION";
};

export const resolvePostAdoptionQueryContinuation = (
  navigation: Pick<FunctionalResetQueryNavigation, "currentAction" | "currentPresentation" | "standardQuestion">,
  mediatedReply?: string | null,
): PostAdoptionQueryContinuation | null => {
  if (!shouldMediatePostAdoptionQuery(navigation) || !navigation.standardQuestion) return null;
  const mediated = mediatedReply?.trim();
  return mediated
    ? { content: mediated, presentationSource: "GEMINI_MEDIATED" }
    : { content: navigation.standardQuestion.text, presentationSource: "QRY_STANDARD_FALLBACK" };
};

export const resolveGovernedPostAdoptionReceipt = (input: {
  response: Readonly<ProductBridgeResponse>;
  project: Pick<ResearchProjectOwnerProjection, "projectId" | "versionId" | "projectDigest">;
  realizedAt: string;
}) => {
  const { response } = input;
  const native = response.currentTurnNavigation;
  if (!native) throw new Error("POST_ADOPTION_GOVERNED_RECEIPT_REQUIRED");
  const binding = native.envelope.projectBinding;
  if (!binding || binding.projectId !== input.project.projectId
    || binding.projectVersion !== input.project.versionId || binding.projectDigest !== input.project.projectDigest) {
    throw new Error("POST_ADOPTION_GOVERNED_RECEIPT_PROJECT_MISMATCH");
  }
  const accepted = !response.conversationFailure && response.governedRealization?.providerReplyAccepted === true
    && response.governedRealization.conformance.structuralStatus === "PASS";
  const realization = accepted ? response.governedRealization! : realizeGovernedConversation({
    envelope: native.envelope,
    localWhatText: native.localWhatText,
    // No legacy question, provider text, new selection, network, retry or extraction.
  });
  if (!accepted && (!native.localWhatText?.trim()
    || realization.assistantReply !== native.localWhatText.trim())) {
    throw new Error("POST_ADOPTION_GOVERNED_LOCAL_REALIZATION_NOT_AVAILABLE");
  }
  return {
    content: realization.assistantReply,
    presentationSource: accepted ? "GEMINI_MEDIATED" as const : "GOVERNED_LOCAL_REALIZATION" as const,
    mediationFailure: accepted ? null
      : response.conversationFailure?.code ?? "GOVERNED_PROVIDER_REALIZATION_NOT_ACCEPTED",
    // Provider in bridgeTrace describes the actual attempted execution, not the visible fallback.
    provider: response.observability.conversationCalls === 1
      ? response.observability.conversationProvider ?? response.observability.provider
      : response.observability.conversationCalls === 0 ? "NONE" : "UNKNOWN",
    model: response.observability.conversationModel ?? response.observability.model,
    latencyMs: response.observability.conversationLatencyMs,
    calls: response.observability.calls,
    nativeReceipt: response,
    localRealization: accepted ? null : {
      value: realization, realizedAt: input.realizedAt,
      // The source of this exact local text is the same governed WHAT receipt.
      whatRef: native.envelope.whatRef,
    },
  };
};

export type ConversationEntry =
  | { entryId: string; kind: "TEXT"; role: "USER" | "NOXIA"; content: string; knowledgePresentation?: ProductUnderstandKnowledgePresentation | null; createdAt: string }
  | { entryId: string; kind: "STUDY_DESIGN_PROPOSAL"; role: "NOXIA"; presentation: StandardStudyDesignPresentation; createdAt: string }
  | { entryId: string; kind: "OBSERVABILITY_PROPOSAL"; role: "NOXIA"; presentation: StandardObservabilityPresentation; createdAt: string }
  | { entryId: string; kind: "IMAGING_PROPOSAL"; role: "NOXIA"; presentation: StandardImagingPresentation; createdAt: string }
  | { entryId: string; kind: "BIOSTATISTICS_PROPOSAL"; role: "NOXIA"; presentation: StandardBiostatisticsPresentation; createdAt: string }
  | { entryId: string; kind: "CDM_RESULT"; role: "NOXIA"; presentation: StandardCanonicalStudyDataPresentation; createdAt: string }
  | { entryId: string; kind: "DATA_MANAGEMENT_RESULT"; role: "NOXIA"; presentation: StandardDataManagementPresentation; createdAt: string }
  | { entryId: string; kind: "FOLLOW_UP_ACTIONS"; role: "NOXIA"; presentation: StandardConversationActionGroupPresentation; response: StandardConversationActionGroupResponse | null; createdAt: string }
  | { entryId: string; kind: "REVIEW"; role: "NOXIA"; contribution: ScientificInterpretationContributionEnvelope; candidate?: ResearchProjectContributionCandidate; traceRunId?: string | null; status: "PENDING" | "CONFIRMED" | "REJECTED"; decision?: HumanDecisionEnvelope | null; decisionPartition?: Readonly<{ refused: readonly string[]; corrected: readonly string[]; pending: readonly string[] }>; createdAt: string }
  | { entryId: string; kind: "ERROR"; role: "NOXIA"; content: string; createdAt: string };

export type ProductBridgeTrace = {
  turnId: string;
  traceRunId?: string;
  requestKind?: ProductBridgeRequest["requestKind"];
  raw: string;
  assistantReply: string;
  persistentExtractionCalled: boolean;
  persistentExtractionStatus: "NOT_REQUESTED" | "NO_CHANGE" | "CANDIDATE" | "BLOCKED" | "TECHNICAL_FAILURE" | "UNKNOWN";
  persistentExtractionFailure?: ProductBridgeResponse["persistentExtraction"]["failure"];
  persistentExtractionRecovery?: ProductBridgeResponse["persistentExtraction"]["recovery"];
  providerArtifact: PersistentExtractionProviderArtifact | null;
  wireCandidate: PersistentProjectDeltaWireCandidate | null;
  persistentCandidate: PersistentProjectDeltaCandidate | null;
  deterministicValidation: PersistentDeltaValidation | null;
  projectChangeSetCandidate: ContributionProjectChangeSet | null;
  canonicalProjectChangeSetCandidate: CanonicalProjectChangeSet | null;
  humanReviewProjection: HumanReviewProjection | null;
  humanDecision: HumanDecisionEnvelope | null;
  projectVersionBefore: string | null;
  projectVersionAfter: string | null;
  qryNeedBefore: string | null;
  qryNeedAfter: string | null;
  provider: string;
  model: string;
  conversationLatencyMs: number;
  extractionLatencyMs: number | null;
  calls: number;
  extractionAttempts?: number;
  entryRouting?: ProductEntryRoutingDecision | null;
  knowledgeResultRef?: string | null;
  knowledgeResultDigest?: string | null;
  projectWriteCount?: number;
  protocolProjectionCount?: number;
  continuationPresentationSource?: PostAdoptionQueryContinuation["presentationSource"] | null;
  continuationMediationFailure?: string | null;
  preProjectTrace?: Readonly<PreProjectScientificTraceSegment> | null;
  multilingualUserTurn?: Readonly<MultilingualUserTurn> | null;
  languageGatewayCalls?: number;
  providerCallRecords?: readonly ProviderCallRecord[];
  cumulativeSessionCostUsd?: number;
  cumulativeSessionCostIncomplete?: boolean;
  cumulativeSessionUnpricedCallCount?: number;
};

export type FunctionalResetSession = {
  /** Optional UX/runtime composition; never an additional Project aggregate. */
  studyProposal?: import("../../scientific-thinking/contextual-study-proposal.js").StudyProposalComposition | null;
  sourceLibrary?: ProjectSourceLibrary;
  contract: "FUNCTIONAL_RESET_PROTOCOL_DESIGNER_SESSION";
  contractVersion: "2.0.0";
  sessionId: string;
  conversationId: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  runtimeTurns: ScientificInterpretationTurn[];
  entries: ConversationEntry[];
  currentContribution: ScientificInterpretationContributionEnvelope | null;
  pendingContribution: ScientificInterpretationContributionEnvelope | null;
  // Consumer processing is separate from scientific validation and human review.
  // Optional for existing v2 sessions; absent history is not reconstructed.
  retainedContributionCandidates?: readonly RetainedContributionCandidate[];
  /** Exact already recorded USER turn awaiting the existing preparation corridor. */
  pendingMixedUserTurnRef?: string | null;
  projectAuthority: ResearchProjectOwnerAuthority;
  project: ResearchProjectOwnerProjection | null;
  queryNavigation: FunctionalResetQueryNavigation | null;
  studyDesignInteraction: StandardStudyDesignInteraction | null;
  scientificThinkingInteraction: StandardScientificThinkingInteraction | null;
  observabilityInteraction: StandardObservabilityInteraction | null;
  imagingInteraction: StandardImagingInteraction | null;
  biostatisticsInteraction: StandardBiostatisticsInteraction | null;
  canonicalStudyDataInteraction: StandardCanonicalStudyDataInteraction | null;
  dataManagementInteraction: StandardDataManagementInteraction | null;
  documents: FunctionalResetDocumentPortfolio;
  // Local workspace/document metadata only: never scientific extraction or an adopted Project object.
  workspace?: LocalProjectMetadata;
  // Conversation presentation preference only. It cannot authorize or alter scientific Project content.
  conversationPreferences?: Readonly<{
    responseLength: "CONCISE";
    source: "EXPLICIT_USER_FEEDBACK";
  }>;
  openDocumentProjectionId: string | null;
  bridgeTraces: ProductBridgeTrace[];
  knowledgeOwnerLedger: Readonly<ProductKnowledgeOwnerLedger>;
  validationRunLedger: Readonly<ProductValidationRunLedger>;
  scientificExecutionTraceLedger: Readonly<ScientificExecutionTraceLedger>;
  conversationLanguageGateway: Readonly<ConversationLanguageGatewayState>;
};

/** Attach observations to the existing bridge trace, including early local/error exits. */
export const appendFunctionalResetProviderCallRecords = (
  session: FunctionalResetSession,
  input: { turnId: string; traceRunId?: string; requestKind?: ProductBridgeRequest["requestKind"]; records: readonly ProviderCallRecord[] },
): FunctionalResetSession => {
  const known = new Set(session.bridgeTraces.flatMap((trace) => trace.providerCallRecords ?? []).map((record) => record.callId));
  const newRecords = input.records.filter((record) => {
    if (known.has(record.callId)) return false;
    known.add(record.callId);
    return true;
  });
  const delta = providerSessionCostSummary(newRecords);
  const previousSummary = [...session.bridgeTraces].reverse().find((trace) => trace.cumulativeSessionCostUsd !== undefined);
  const retainedSummary = providerSessionCostSummary(session.bridgeTraces.flatMap((trace) => trace.providerCallRecords ?? []));
  const reverseTargetIndex = [...session.bridgeTraces].reverse().findIndex((trace) => trace.turnId === input.turnId
    && (input.requestKind === undefined || trace.requestKind === input.requestKind));
  const targetIndex = reverseTargetIndex < 0 ? -1 : session.bridgeTraces.length - 1 - reverseTargetIndex;
  const summaryIndex = previousSummary?.cumulativeSessionCostIncomplete === undefined ? -1 : session.bridgeTraces.indexOf(previousSummary);
  const legacyUnobserved = session.bridgeTraces.reduce((total, trace, index) => index <= summaryIndex ? total
    : total + Math.max(0, trace.calls - (trace.providerCallRecords?.length ?? 0) - (index === targetIndex ? newRecords.length : 0)), 0);
  const cumulativeSessionUnpricedCallCount = (previousSummary?.cumulativeSessionUnpricedCallCount
    ?? retainedSummary.unpricedCallCount) + legacyUnobserved + delta.unpricedCallCount;
  const cumulativeSessionCostIncomplete = (previousSummary?.cumulativeSessionCostIncomplete
    ?? retainedSummary.costIncomplete) || legacyUnobserved > 0 || delta.costIncomplete;
  const cumulativeSessionCostUsd = Number(((previousSummary ? latestRecordedProviderSessionCostUsd(session.bridgeTraces)
    : retainedSummary.estimatedCostUsd) + delta.estimatedCostUsd).toFixed(10));
  if (!newRecords.length) {
    const latest = session.bridgeTraces.at(-1);
    if (!latest || !previousSummary && !legacyUnobserved
      || latest.cumulativeSessionCostUsd === cumulativeSessionCostUsd
        && latest.cumulativeSessionCostIncomplete === cumulativeSessionCostIncomplete
        && latest.cumulativeSessionUnpricedCallCount === cumulativeSessionUnpricedCallCount) return session;
    return { ...session, bridgeTraces: [...session.bridgeTraces.slice(0, -1), {
      ...latest, cumulativeSessionCostUsd, cumulativeSessionCostIncomplete, cumulativeSessionUnpricedCallCount,
    }] };
  }
  const bridgeTraces = [...session.bridgeTraces];
  if (targetIndex >= 0) {
    const target = bridgeTraces[targetIndex]!;
    const providerCallRecords = [...(target.providerCallRecords ?? []), ...newRecords];
    bridgeTraces[targetIndex] = { ...target, providerCallRecords, calls: Math.max(target.calls, providerCallRecords.length) };
  } else {
    bridgeTraces.push({
      turnId: input.turnId, traceRunId: input.traceRunId, requestKind: input.requestKind ?? "USER_TURN",
      raw: "[NOT_CAPTURED:PROVIDER_OBSERVATION]", assistantReply: "[NOT_CAPTURED:PROVIDER_OBSERVATION]",
      persistentExtractionCalled: newRecords.some((record) => record.purpose === "PERSISTENT_DELTA"),
      persistentExtractionStatus: newRecords.some((record) => record.purpose === "PERSISTENT_DELTA") ? "UNKNOWN" : "NOT_REQUESTED",
      providerArtifact: null, wireCandidate: null,
      persistentCandidate: null, deterministicValidation: null, projectChangeSetCandidate: null,
      canonicalProjectChangeSetCandidate: null, humanReviewProjection: null, humanDecision: null,
      projectVersionBefore: session.project?.versionId ?? null, projectVersionAfter: session.project?.versionId ?? null,
      qryNeedBefore: null, qryNeedAfter: null, provider: newRecords[0]!.provider, model: newRecords[0]!.modelRequested,
      conversationLatencyMs: newRecords.filter((record) => record.purpose === "CONVERSATION_REALIZATION")
        .reduce((total, record) => total + record.latencyMs, 0),
      extractionLatencyMs: null, calls: newRecords.length, providerCallRecords: newRecords,
    });
  }
  bridgeTraces[bridgeTraces.length - 1] = {
    ...bridgeTraces.at(-1)!, cumulativeSessionCostUsd, cumulativeSessionCostIncomplete, cumulativeSessionUnpricedCallCount,
  };
  return { ...session, bridgeTraces: bridgeTraces.slice(-20) };
};

const id = (prefix: string) => {
  const suffix = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}:${suffix}`;
};

export const createFunctionalResetSession = (now = new Date().toISOString()): FunctionalResetSession => {
  const sessionId = id("protocol-designer-session");
  return {
    contract: "FUNCTIONAL_RESET_PROTOCOL_DESIGNER_SESSION",
    contractVersion: "2.0.0",
    sessionId,
    conversationId: id("scientific-conversation"),
    projectId: `${sessionId}:research-project`,
    createdAt: now,
    updatedAt: now,
    runtimeTurns: [],
    entries: [{ entryId: id("conversation-entry"), kind: "TEXT", role: "NOXIA", content: INITIAL_NOXIA_MESSAGE, createdAt: now }],
    currentContribution: null,
    pendingContribution: null,
    retainedContributionCandidates: [],
    projectAuthority: {
      actorRef: `${sessionId}:CURRENT_RESEARCHER`,
      mandateRef: "PROJECT_OWNER",
      authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION",
      verification: "DEMO_SESSION_NOT_AUTHENTICATED",
    },
    project: null,
    queryNavigation: null,
    studyDesignInteraction: null,
    scientificThinkingInteraction: null,
    observabilityInteraction: null,
    imagingInteraction: null,
    biostatisticsInteraction: null,
    canonicalStudyDataInteraction: null,
    dataManagementInteraction: null,
    documents: createEmptyFunctionalResetDocumentPortfolio(),
    openDocumentProjectionId: null,
    bridgeTraces: [],
    knowledgeOwnerLedger: createProductKnowledgeOwnerLedger(sessionId),
    validationRunLedger: createProductValidationRunLedger(sessionId),
    scientificExecutionTraceLedger: createScientificExecutionTraceLedger(sessionId),
    conversationLanguageGateway: createConversationLanguageGatewayState(),
  };
};

const looksLikeSession = (value: unknown): value is FunctionalResetSession => {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<FunctionalResetSession>;
  return record.contract === "FUNCTIONAL_RESET_PROTOCOL_DESIGNER_SESSION"
    && record.contractVersion === "2.0.0"
    && typeof record.sessionId === "string"
    && typeof record.conversationId === "string"
    && Array.isArray(record.entries)
    && Array.isArray(record.runtimeTurns)
    && record.projectAuthority?.mandateRef === "PROJECT_OWNER"
    && (!record.project || record.project.contract === "RESEARCH_PROJECT_CONSTRUCTION_OWNER_PROJECTION")
    && (!record.queryNavigation || record.queryNavigation.contract === "FUNCTIONAL_RESET_QUERY_NAVIGATION")
    && (!record.studyDesignInteraction || record.studyDesignInteraction.contract === "FUNCTIONAL_RESET_STUDY_DESIGN_INTERACTION")
    && (!record.scientificThinkingInteraction || record.scientificThinkingInteraction.contract === "FUNCTIONAL_RESET_SCIENTIFIC_THINKING_INTERACTION")
    && (!record.observabilityInteraction || record.observabilityInteraction.contract === "FUNCTIONAL_RESET_OBSERVABILITY_INTERACTION")
    && (!record.imagingInteraction || record.imagingInteraction.contract === "FUNCTIONAL_RESET_IMAGING_INTERACTION")
    && (!record.biostatisticsInteraction || record.biostatisticsInteraction.contract === "FUNCTIONAL_RESET_BIOSTATISTICS_INTERACTION")
    && (!record.canonicalStudyDataInteraction || record.canonicalStudyDataInteraction.contract === "FUNCTIONAL_RESET_CDM_INTERACTION")
    && (!record.dataManagementInteraction || record.dataManagementInteraction.contract === "FUNCTIONAL_RESET_DATA_MANAGEMENT_INTERACTION")
    && record.documents?.contract === "FUNCTIONAL_RESET_DOCUMENT_PORTFOLIO"
    && record.documents.owner === "DOC-001"
    && (record.openDocumentProjectionId === null || typeof record.openDocumentProjectionId === "string")
    && Array.isArray(record.bridgeTraces)
    && record.knowledgeOwnerLedger?.contract === PRODUCT_KNOWLEDGE_OWNER_LEDGER_CONTRACT
    && record.knowledgeOwnerLedger.sessionId === record.sessionId
    && record.validationRunLedger?.contract === PRODUCT_VALIDATION_RUN_LEDGER_CONTRACT
    && record.validationRunLedger.sessionId === record.sessionId
    && record.scientificExecutionTraceLedger?.contract === SCIENTIFIC_EXECUTION_TRACE_LEDGER_CONTRACT
    && record.scientificExecutionTraceLedger.sessionId === record.sessionId
    && record.conversationLanguageGateway?.contract === CONVERSATION_LANGUAGE_GATEWAY_CONTRACT
    && Array.isArray(record.conversationLanguageGateway.turns)
    && Array.isArray(record.conversationLanguageGateway.responses)
    && Array.isArray(record.conversationLanguageGateway.projectionCache)
    && Array.isArray(record.conversationLanguageGateway.failures)
    && record.conversationLanguageGateway.projectWriteAuthorized === false
    && record.conversationLanguageGateway.scientificDecisionAuthorized === false;
};

const migrateLegacySession = (value: unknown): FunctionalResetSession | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (record.contract !== "FUNCTIONAL_RESET_PROTOCOL_DESIGNER_SESSION" || !["1.2.0", "1.3.0", "1.4.0", "1.5.0", "1.6.0", "1.7.0", "1.8.0", "1.9.0"].includes(String(record.contractVersion))) return null;
  if (typeof record.sessionId !== "string") return null;
  const migrated = {
    ...record,
    contractVersion: "2.0.0",
    queryNavigation: record.contractVersion === "1.2.0" ? null : record.queryNavigation,
    studyDesignInteraction: ["1.8.0", "1.9.0"].includes(String(record.contractVersion)) ? record.studyDesignInteraction ?? null : null,
    scientificThinkingInteraction: record.contractVersion === "1.9.0" ? record.scientificThinkingInteraction ?? null : null,
    observabilityInteraction: record.contractVersion === "1.9.0" ? record.observabilityInteraction ?? null : null,
    imagingInteraction: record.contractVersion === "1.9.0" ? record.imagingInteraction ?? null : null,
    biostatisticsInteraction: record.contractVersion === "1.9.0" ? record.biostatisticsInteraction ?? null : null,
    canonicalStudyDataInteraction: record.contractVersion === "1.9.0" ? record.canonicalStudyDataInteraction ?? null : null,
    dataManagementInteraction: record.contractVersion === "1.9.0" ? record.dataManagementInteraction ?? null : null,
    bridgeTraces: Array.isArray(record.bridgeTraces) ? record.bridgeTraces : [],
    knowledgeOwnerLedger: ["1.5.0", "1.6.0", "1.7.0", "1.8.0", "1.9.0"].includes(String(record.contractVersion)) && record.knowledgeOwnerLedger
      ? record.knowledgeOwnerLedger
      : createProductKnowledgeOwnerLedger(record.sessionId),
    validationRunLedger: ["1.6.0", "1.7.0", "1.8.0", "1.9.0"].includes(String(record.contractVersion)) && record.validationRunLedger
      ? record.validationRunLedger
      : createProductValidationRunLedger(record.sessionId),
    scientificExecutionTraceLedger: ["1.7.0", "1.8.0", "1.9.0"].includes(String(record.contractVersion)) && record.scientificExecutionTraceLedger
      ? record.scientificExecutionTraceLedger
      : createScientificExecutionTraceLedger(record.sessionId),
    conversationLanguageGateway: createConversationLanguageGatewayState(),
  };
  return looksLikeSession(migrated) ? migrated : null;
};

export const repairPersistedProductPresentation = (
  entries: FunctionalResetSession["entries"],
): FunctionalResetSession["entries"] => entries.map((entry, index) => index === 0
  && entry.kind === "TEXT"
  && entry.role === "NOXIA"
  && entry.content === LEGACY_PROJECT_FIRST_NOXIA_MESSAGE
  ? { ...entry, content: INITIAL_NOXIA_MESSAGE }
  : entry);

export const loadFunctionalResetSession = (storage: Storage, storageKey = FUNCTIONAL_RESET_STORAGE_KEY, strict = false): FunctionalResetSession => {
  try {
    const raw = storage.getItem(storageKey);
    if (!raw) {
      if (strict) throw new Error("SESSION_NOT_FOUND");
      return createFunctionalResetSession();
    }
    const parsed: unknown = decodeSessionStorage(raw);
    const session = looksLikeSession(parsed) ? parsed : migrateLegacySession(parsed);
    if (!session) {
      if (strict) throw new Error("SESSION_UNREADABLE");
      return createFunctionalResetSession();
    }
    const reloadSafeSession: FunctionalResetSession = {
      ...session,
      studyProposal: rehydrateStudyProposal(session.studyProposal, session.project),
      retainedContributionCandidates: session.retainedContributionCandidates ?? [],
      observabilityInteraction: session.observabilityInteraction ?? null,
      imagingInteraction: session.imagingInteraction ?? null,
      biostatisticsInteraction: session.biostatisticsInteraction ?? null,
      canonicalStudyDataInteraction: session.canonicalStudyDataInteraction ?? null,
      dataManagementInteraction: session.dataManagementInteraction ?? null,
      knowledgeOwnerLedger: rehydrateProductKnowledgeOwnerLedger(session.knowledgeOwnerLedger),
      validationRunLedger: rehydrateProductValidationRunLedger(session.validationRunLedger),
      scientificExecutionTraceLedger: rehydrateScientificExecutionTraceLedger(session.scientificExecutionTraceLedger),
      entries: repairPersistedProductPresentation(session.entries).map((entry) => entry.kind === "REVIEW"
        && entry.candidate
        && (!entry.candidate.humanReviewProjection
          || entry.candidate.humanReviewProjection.contractVersion !== HUMAN_REVIEW_PROJECTION_VERSION
          || !Array.isArray(entry.candidate.humanReviewProjection.openPoints))
        ? { ...entry, candidate: undefined }
        : entry),
    };
    return reloadSafeSession.project ? {
      ...reloadSafeSession,
      project: {
        ...reloadSafeSession.project,
        canonicalBackboneStatus: "PRJ_OWNED_CANONICAL_PROJECT_BACKBONE_ACTIVE",
        canonicalState: ensureCanonicalProjectState(reloadSafeSession.project),
      },
    } : reloadSafeSession;
  } catch (error) {
    if (strict) throw error;
    return createFunctionalResetSession();
  }
};

export const persistFunctionalResetSession = (storage: Storage, session: FunctionalResetSession) => {
  storage.setItem(FUNCTIONAL_RESET_STORAGE_KEY, JSON.stringify(session));
};

export const clearFunctionalResetSession = (storage: Storage) => storage.removeItem(FUNCTIONAL_RESET_STORAGE_KEY);

export const createConversationEntryId = () => id("conversation-entry");
export const createTurnId = () => id("turn");
import type { ProjectSourceLibrary } from "@/features/knowledge-engine/project-source-library";
