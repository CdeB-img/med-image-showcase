import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  buildBoundedConversationReferentContext,
  buildCurrentNavigationEvidence,
  currentGovernedNavigationInput,
  selectBoundedConversationInteraction,
} from "@/features/query-navigation/current-navigation-evidence";
import { Helmet } from "react-helmet-async";
import { ArrowUp, LoaderCircle, MessageSquareText, RotateCcw } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { ScientificInterpretationContributionEnvelope, ScientificInterpretationTurn } from "@/features/scientific-interpretation/contracts";
import {
  ProductBridgeClientError,
  requestConversationLanguageProjection,
  requestProtocolDesignerBridge,
} from "@/features/protocol-designer/product-bridge-client";
import {
  NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
  naturalConversationContext,
  type ProductBridgeLanguageBoundary,
  type ProductBridgeRequest,
} from "@/features/protocol-designer/product-bridge";
import {
  appendLanguageProjectionFailure,
  appendLanguageTurnToGatewayState,
  appendLocalizedResponseToGatewayState,
  buildLocalizedConversationResponse,
  buildMultilingualUserTurn,
  DEFAULT_OPENAI_LANGUAGE_GATEWAY_MODEL,
  DEFAULT_OPENAI_LANGUAGE_GATEWAY_REASONING_EFFORT,
  detectConversationLanguage,
  extractProtectedOpaqueLiterals,
  findReusableLanguageProjection,
  languageProjectionIdentityDigest,
  languageProjectionFailure,
  LANGUAGE_PROJECTION_CONTRACT_VERSION,
  type ConversationLanguageGatewayState,
  type LanguageProjectionContractFailureDiagnostic,
  type LanguageProjectionArtifact,
  type LanguageProjectionRequest,
  type LocalizedConversationResponse,
  type MultilingualUserTurn,
} from "@/features/protocol-designer/conversation-language-gateway";
import { formatProductDevelopmentVersion } from "@/features/protocol-designer/product-development-version";
import { GOVERNED_REALIZATION_SYSTEM_INSTRUCTION } from "@/features/query-navigation/governed-conversation-realization";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import {
  buildPreProjectTraceRealizationOutcome,
  captureProductBridgeTraceText,
  createPreProjectScientificTraceSegment,
  createProductTraceRunId,
  DEFAULT_SCIENTIFIC_TRACE_CAPTURE_CONFIGURATION,
  recordConversationLanguageGatewayTrace,
  recordConversationLanguageGatewayFailureTrace,
  recordLocalizedConversationResponseTrace,
  recordProductEntryRoutingTrace,
  type ScientificTraceCaptureConfiguration,
  type ScientificTraceRealizationOutcome,
} from "@/features/protocol-designer/scientific-execution-trace";
import {
  authorizeResearchProjectDocumentHandoff,
  confirmResearchProjectContribution,
  prepareResearchProjectContributionCandidate,
  rejectResearchProjectContribution,
} from "@/features/research-project-construction";
import {
  buildStudyDeliverablePortfolio,
  functionalProtocolProjection,
  markFunctionalResetDocumentFailure,
  refreshFunctionalResetDocumentPortfolio,
} from "@/features/document-projection";
import {
  buildPreProjectNavigationDecision,
  buildFunctionalResetQueryNavigation,
  buildCurrentProjectImpactProjection,
  deferFunctionalResetQueryNavigation,
  isFunctionalResetQueryMisunderstanding,
  realizePreProjectNavigationDecision,
  recordFunctionalResetQueryResponse,
} from "@/features/query-navigation";
import ContributionReview, { ContributionReviewPresentation, type ContributionReviewPresentationFailure } from "./ContributionReview";
import {
  retainValidatedContributionCandidate,
  markContributionCandidatePresented,
  recordContributionDownstreamFailure,
  recordContributionCandidateHumanDecision,
  type RetainedContributionCandidate,
} from "./contribution-lifecycle";
import UnderstandingReviewCard from "../conversation/UnderstandingReviewCard";
import DevelopmentDiagnostics from "./DevelopmentDiagnostics";
import {
  recordArtifactGeneratedTrace,
  recordContributionRejectionTrace,
  recordDocumentProjectionTrace,
  recordInitialProductTrace,
  recordGovernedConversationTrace,
  recordPostAdoptionGovernedLocalRealization,
  recordProductErrorBoundary,
  recordContributionReviewPresentedTrace,
  recordCurrentProjectImpactNavigationTrace,
  recordRetainedContributionValidation,
  recordProjectAdoptionTrace,
  recordStudyDesignConversationTrace,
  recordStudyDesignOptionReviewTrace,
  productTraceExtractionExecution,
} from "./end-to-end-trace-adapter";
import ProductUnderstandResponse from "./ProductUnderstandResponse";
import ProtocolPreview from "./ProtocolPreview";
import ResearchProjectPanel from "./ResearchProjectPanel";
import StudyDesignStandardCard from "./StudyDesignStandardCard";
import StudyDeliverableWorkspace from "./StudyDeliverableWorkspace";
import ObservabilityStandardCard from "./ObservabilityStandardCard";
import ImagingStandardCard from "./ImagingStandardCard";
import BiostatisticsStandardCard from "./BiostatisticsStandardCard";
import CanonicalStudyDataStandardCard from "./CanonicalStudyDataStandardCard";
import DataManagementStandardCard from "./DataManagementStandardCard";
import StandardConversationActionGroup from "./StandardConversationActionGroup";
import {
  buildStandardConversationActionGroup,
  summarizeStandardConversationActionResponse,
  type StandardConversationActionGroupPresentation,
  type StandardConversationActionGroupResponse,
} from "./standard-conversation-action-group";
import {
  executeProductUnderstandInteraction,
  recognizeProductDocumentAction,
  routeProductEntry,
  type ProductDocumentAction,
} from "./product-entry-routing";
import {
  clearFunctionalResetSession,
  createConversationEntryId,
  createFunctionalResetSession,
  createTurnId,
  loadFunctionalResetSession,
  persistFunctionalResetSession,
  productEntryPromptForIntent,
  resolveGovernedPostAdoptionReceipt,
  shouldMediatePostAdoptionQuery,
  type ConversationEntry,
  type FunctionalResetSession,
} from "./session";
import {
  buildStandardStudyDesignPresentation,
  buildStudyDesignOptionContribution,
  dispatchStudyDesignFromQuery,
  interactionMatchesCurrentProject,
  isStudyDesignQueryDispatch,
  readStudyDesignProposalFromLedger,
  resolveStudyDesignConversation,
} from "./study-design-standard";
import {
  buildPreProjectScientificThinkingIntervention,
  buildScientificThinkingSelectionContribution,
  buildStandardScientificThinkingPresentation,
  dispatchScientificThinkingFromQuery,
  isScientificThinkingQueryDispatch,
  readScientificThinkingOutputFromLedger,
  resolveScientificThinkingConversation,
  scientificThinkingInteractionMatchesCurrentProject,
} from "./scientific-thinking-standard";
import {
  buildObservabilityMeasurementContribution,
  buildStandardObservabilityPresentation,
  dispatchObservabilityFromQuery,
  isObservabilityQueryDispatch,
  observabilityInteractionMatchesCurrentProject,
  readObservabilityResultFromLedger,
  resolveObservabilityConversation,
} from "./observability-standard";
import {
  prepareImagingAcquisitionContribution,
  buildStandardImagingPresentation,
  dispatchImagingFromQuery,
  imagingInteractionMatchesCurrentProject,
  isImagingQueryDispatch,
  readImagingResultFromLedger,
  resolveImagingConversation,
} from "./imaging-standard";
import {
  biostatisticsInteractionMatchesCurrentProject,
  buildBiostatisticsStrategyContribution,
  buildStandardBiostatisticsPresentation,
  dispatchBiostatisticsFromQuery,
  isBiostatisticsQueryDispatch,
  readBiostatisticsResultFromLedger,
  resolveBiostatisticsConversation,
} from "./biostatistics-standard";
import {
  deriveFunctionalResetDataOwnerState,
  dispatchCanonicalStudyDataFromQuery,
  isCanonicalStudyDataQueryDispatch,
  readCanonicalStudyDataResultFromLedger,
} from "./canonical-study-data-standard";
import {
  dispatchDataManagementFromQuery,
  isDataManagementQueryDispatch,
  readDataManagementResultFromLedger,
} from "./data-management-standard";
import { attachCurrentKnowledgePrerequisiteWhenRequired, dispatchKnowledgePrerequisiteFromQuery } from "./knowledge-standard";
import { isProductKnowledgePrerequisiteDispatch } from "@/features/query-navigation";
import { dispatchRegulatoryFromQuery, isRegulatoryQueryDispatch } from "./regulatory-standard";

const loadInitialSession = () => typeof window === "undefined"
  ? createFunctionalResetSession()
  : loadFunctionalResetSession(window.localStorage);

const productBridgeClientErrorCode = (error: unknown) => error && typeof error === "object"
  && "code" in error && typeof error.code === "string"
  ? error.code
  : null;

type LanguageProjectionRequestFailure = Error & Readonly<{
  code: string;
  languageProjectionRequest: LanguageProjectionRequest;
  languageProjectionDiagnostic: LanguageProjectionContractFailureDiagnostic | null;
}>;

const languageProjectionRequestFromError = (error: unknown) => error && typeof error === "object"
  && "languageProjectionRequest" in error
  && error.languageProjectionRequest
  && typeof error.languageProjectionRequest === "object"
  ? error.languageProjectionRequest as LanguageProjectionRequest
  : null;

const languageProjectionDiagnosticFromError = (error: unknown) => error && typeof error === "object"
  && "languageProjectionDiagnostic" in error
  && error.languageProjectionDiagnostic
  && typeof error.languageProjectionDiagnostic === "object"
  ? error.languageProjectionDiagnostic as LanguageProjectionContractFailureDiagnostic
  : null;

const languageBoundaryFor = (
  state: Readonly<ConversationLanguageGatewayState>,
): ProductBridgeLanguageBoundary => ({
  contract: "PRODUCT_BRIDGE_LANGUAGE_BOUNDARY",
  contractVersion: "1.0.0",
  workingLanguage: "fr",
  turnProjections: state.turns.flatMap((turn) => turn.frenchWorkingText && turn.frenchWorkingTextDigest
    ? [{
      turnId: turn.turnId,
      originalTextDigest: turn.originalTextDigest,
      frenchWorkingText: turn.frenchWorkingText,
      frenchWorkingTextDigest: turn.frenchWorkingTextDigest,
      sourceLanguage: turn.sourceLanguage ?? "unknown",
      translationProjectionRef: turn.provenance.projectionRef,
      originalIsImmutableEvidence: true as const,
      workingProjectionIsUserLiteral: false as const,
    }]
    : []),
});

const requestOrReuseLanguageProjection = async (input: {
  state: Readonly<ConversationLanguageGatewayState>;
  projectionKind: LanguageProjectionRequest["projectionKind"];
  sourceText: string;
  sourceLanguage: string | "UNKNOWN";
  targetLanguage: string;
}): Promise<{ projection: LanguageProjectionArtifact; providerCalls: 0 | 1 }> => {
  const protectedOpaqueLiterals = extractProtectedOpaqueLiterals(input.sourceText);
  const projectionIdentityDigest = languageProjectionIdentityDigest({
    projectionKind: input.projectionKind,
    sourceText: input.sourceText,
    sourceLanguage: input.sourceLanguage,
    targetLanguage: input.targetLanguage,
    provider: "OPENAI",
    model: DEFAULT_OPENAI_LANGUAGE_GATEWAY_MODEL,
    protectedOpaqueLiterals,
  });
  const cached = findReusableLanguageProjection({ state: input.state, projectionIdentityDigest });
  if (cached) return { projection: cached, providerCalls: 0 };
  const request: LanguageProjectionRequest = {
    apiVersion: "1.0.0",
    operation: "LANGUAGE_PROJECTION",
    projectionKind: input.projectionKind,
    sourceText: input.sourceText,
    sourceLanguageHint: input.sourceLanguage,
    targetLanguage: input.targetLanguage,
    translationContractVersion: LANGUAGE_PROJECTION_CONTRACT_VERSION,
    projectionIdentityDigest,
    protectedOpaqueLiterals,
  };
  let response: Awaited<ReturnType<typeof requestConversationLanguageProjection>>;
  try {
    response = await requestConversationLanguageProjection(request);
  } catch (error) {
    const failure = new Error(
      error instanceof Error ? error.message : "Cette langue ne peut pas être traitée pour le moment.",
    ) as LanguageProjectionRequestFailure;
    Object.assign(failure, {
      name: "LanguageProjectionRequestFailure",
      code: productBridgeClientErrorCode(error) ?? "LANGUAGE_PROJECTION_UNAVAILABLE",
      languageProjectionRequest: request,
      languageProjectionDiagnostic: error && typeof error === "object" && "diagnostic" in error
        ? error.diagnostic as LanguageProjectionContractFailureDiagnostic | null
        : null,
    });
    throw failure;
  }
  return { projection: response.projection, providerCalls: 1 };
};

const prepareMultilingualUserTurn = async (input: {
  session: Readonly<FunctionalResetSession>;
  turnId: string;
  originalText: string;
}): Promise<{ turn: MultilingualUserTurn; state: ConversationLanguageGatewayState; providerCalls: 0 | 1 }> => {
  let detection = detectConversationLanguage(input.originalText);
  if (detection.status === "INSUFFICIENT_EVIDENCE" && input.session.conversationLanguageGateway.conversationLanguage) {
    detection = {
      status: "DETECTED",
      detectedLanguage: input.session.conversationLanguageGateway.conversationLanguage,
      confidence: "LOW",
      reasonCode: "SESSION_LANGUAGE_INHERITED_FOR_SHORT_TURN",
    };
  }
  const sourceLanguage = detection.detectedLanguage ?? "UNKNOWN";
  const translationRequired = sourceLanguage !== "fr" && detection.status !== "INSUFFICIENT_EVIDENCE";
  const requested = translationRequired
    ? await requestOrReuseLanguageProjection({
      state: input.session.conversationLanguageGateway,
      projectionKind: "INPUT_TO_FRENCH",
      sourceText: input.originalText,
      sourceLanguage,
      targetLanguage: "fr",
    })
    : null;
  const turn = buildMultilingualUserTurn({
    turnId: input.turnId,
    originalText: input.originalText,
    detection,
    currentConversationLanguage: input.session.conversationLanguageGateway.conversationLanguage,
    projection: requested?.projection ?? null,
    project: input.session.project,
  });
  return {
    turn,
    state: appendLanguageTurnToGatewayState({
      state: input.session.conversationLanguageGateway,
      turn,
      projection: requested?.projection,
    }),
    providerCalls: requested?.providerCalls ?? 0,
  };
};

const localizeCanonicalFrenchResponse = async (input: {
  state: Readonly<ConversationLanguageGatewayState>;
  sourceTurnRef: string;
  responseId: string;
  canonicalFrenchResponse: string;
}): Promise<{
  response: LocalizedConversationResponse;
  state: ConversationLanguageGatewayState;
  providerCalls: 0 | 1;
}> => {
  const targetLanguage = input.state.conversationLanguage ?? "fr";
  const requested = targetLanguage === "fr"
    ? null
    : await requestOrReuseLanguageProjection({
      state: input.state,
      projectionKind: "OUTPUT_FROM_FRENCH",
      sourceText: input.canonicalFrenchResponse,
      sourceLanguage: "fr",
      targetLanguage,
    });
  const response = buildLocalizedConversationResponse({
    responseId: input.responseId,
    sourceTurnRef: input.sourceTurnRef,
    canonicalFrenchResponse: input.canonicalFrenchResponse,
    targetLanguage,
    projection: requested?.projection ?? null,
  });
  return {
    response,
    state: appendLocalizedResponseToGatewayState({ state: input.state, response, projection: requested?.projection }),
    providerCalls: requested?.providerCalls ?? 0,
  };
};

type PreparedGatewayUserInput = Readonly<{
  originalText: string;
  workingText: string;
  turnId: string;
  createdAt: string;
  multilingualTurn: MultilingualUserTurn;
  gatewayState: ConversationLanguageGatewayState;
}>;

const normalizePreparedUserInput = (input: string | PreparedGatewayUserInput) => typeof input === "string"
  ? {
    originalText: input,
    workingText: input,
    turnId: createTurnId(),
    createdAt: new Date().toISOString(),
    multilingualTurn: null,
    gatewayState: null,
  }
  : input;

const documentBlockerSignals = (documents: FunctionalResetSession["documents"]) =>
  documents.cards.flatMap((card) => card.blockerGroups.map((group) => ({
    dimension: group.dimension,
    items: [...group.items],
  })));

const persistenceFailureMessage = (
  status: "NOT_REQUESTED" | "NO_CHANGE" | "CANDIDATE" | "BLOCKED" | "TECHNICAL_FAILURE",
  candidateStatus: ReturnType<typeof prepareResearchProjectContributionCandidate>["status"] | null,
) => {
  if (status === "TECHNICAL_FAILURE") {
    return "Je vous ai répondu, mais NOXIA n’a pas pu préparer ces informations pour le Research Project. Le Project reste inchangé.";
  }
  if (status === "BLOCKED") {
    return "Je vous ai répondu, mais la proposition persistante est bloquée et n’a pas été enregistrée. Le Research Project reste inchangé.";
  }
  if (candidateStatus === "BLOCKED_BY_STRUCTURAL_CONFLICT") {
    return "Cette proposition entre en conflit avec l’état actuel du Research Project. Elle n’a pas été appliquée.";
  }
  if (candidateStatus === "REVIEW_PROJECTION_INCOMPLETE") {
    return "NOXIA ne peut pas vous demander de confirmer cette proposition, car la revue ne montre pas encore tous les changements. Le Research Project reste inchangé.";
  }
  return null;
};

const normalizedEvidenceText = (value: string) => value
  .normalize("NFKD")
  .replace(/\p{M}/gu, "")
  .toLocaleLowerCase("fr-FR")
  .replace(/[’']/gu, " ")
  .replace(/[^\p{L}\p{N}]+/gu, " ")
  .replace(/\s+/gu, " ")
  .trim();

const visibleStructuredUnderstandingEvidence = (input: {
  contribution: ScientificInterpretationContributionEnvelope | null;
  sourceTurnRef: string;
  explicitDimensions: readonly Readonly<{ dimensionRef: string; sourceText: string }>[];
}) => {
  if (!input.contribution) return null;
  const items = [...new Map([
    ...input.contribution.scientificContent.explicitStatements,
    ...input.contribution.scientificContent.candidateObjects,
    ...input.contribution.scientificContent.inferredContext,
    ...input.contribution.scientificContent.contextualCandidates,
    ...input.contribution.scientificContent.temporalElements,
  ].map((item) => [item.itemId, item])).values()].filter((item) => item.epistemicBoundary.activeState !== false
    && item.epistemicBoundary.sourceTurnIds.includes(input.sourceTurnRef));
  const representedDimensionRefs = input.explicitDimensions.flatMap((dimension) => {
    const source = normalizedEvidenceText(dimension.sourceText);
    const represented = items.some((item) => [item.epistemicBoundary.sourceText, item.content]
      .filter((value): value is string => Boolean(value))
      .map(normalizedEvidenceText)
      .some((value) => value.length > 0 && (source.includes(value) || value.includes(source))));
    return represented ? [dimension.dimensionRef] : [];
  });
  return {
    source: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION" as const,
    visibleToUser: true as const,
    representedDimensionRefs: Object.freeze(representedDimensionRefs),
    projectWriteAuthorized: false as const,
  };
};

type PostAdoptionContinuationJob = {
  sessionId: string;
  conversationId: string;
  project: NonNullable<FunctionalResetSession["project"]>;
  queryNavigation: NonNullable<FunctionalResetSession["queryNavigation"]>;
  ownerResultLedger: FunctionalResetSession["knowledgeOwnerLedger"];
  scientificExecutionTraceLedger: FunctionalResetSession["scientificExecutionTraceLedger"];
  runtimeTurns: ScientificInterpretationTurn[];
  feedback: string;
  traceRunId: string | null;
};

const resolvePostAdoptionContinuationJob = async (job: PostAdoptionContinuationJob) => {
  if (isProductKnowledgePrerequisiteDispatch(job.queryNavigation)) {
    const completedAt = new Date().toISOString();
    const turnId = createTurnId();
    const dispatched = dispatchKnowledgePrerequisiteFromQuery({
      project: job.project,
      navigation: job.queryNavigation,
      ownerResultLedger: job.ownerResultLedger,
      traceLedger: job.scientificExecutionTraceLedger,
      sessionId: job.sessionId,
      conversationId: job.conversationId,
      startedAt: completedAt,
      completedAt,
    });
    if (dispatched.targetOwnerDispatchAuthorized && isObservabilityQueryDispatch(job.queryNavigation)) {
      const owner = dispatchObservabilityFromQuery({
        project: job.project,
        navigation: job.queryNavigation,
        ownerResultLedger: dispatched.ownerResultLedger,
        traceLedger: dispatched.traceLedger,
        sessionId: job.sessionId,
        conversationId: job.conversationId,
        presentationTurnRef: turnId,
        startedAt: completedAt,
        completedAt,
        knowledgeHandoff: dispatched.handoff,
      });
      const turn = { turnId, role: "NOXIA" as const, content: owner.presentation.plainText, createdAt: completedAt };
      return {
        kind: "OBSERVABILITY" as const,
        turn,
        content: turn.content,
        presentationSource: "OBS_STANDARD_PROJECTION" as const,
        mediationFailure: null,
        provider: "NONE",
        model: "OBSERVABILITY_MEASUREMENT_RUNTIME",
        latencyMs: 0,
        calls: 0,
        ...owner,
      };
    }
    if (dispatched.targetOwnerDispatchAuthorized && isRegulatoryQueryDispatch(job.queryNavigation)) {
      const owner = dispatchRegulatoryFromQuery({
        project: job.project,
        navigation: job.queryNavigation,
        ownerResultLedger: dispatched.ownerResultLedger,
        traceLedger: dispatched.traceLedger,
        sessionId: job.sessionId,
        conversationId: job.conversationId,
        startedAt: completedAt,
        completedAt,
        knowledgeHandoff: dispatched.handoff,
      });
      const turn = { turnId, role: "NOXIA" as const, content: owner.presentation.plainText, createdAt: completedAt };
      return {
        kind: "REGULATORY" as const,
        turn,
        content: turn.content,
        presentationSource: "REG_STANDARD_PROJECTION" as const,
        mediationFailure: null,
        provider: "NONE",
        model: "REG001_DETERMINISTIC_RUNTIME",
        latencyMs: 0,
        calls: 0,
        ...owner,
      };
    }
    const turn = { turnId, role: "NOXIA" as const, content: dispatched.presentation.plainText, createdAt: completedAt };
    return {
      kind: "KNOWLEDGE" as const,
      turn,
      content: turn.content,
      presentationSource: "KNOWLEDGE_STANDARD_PROJECTION" as const,
      mediationFailure: null,
      provider: "NONE",
      model: "KNOWLEDGE_ENGINE_RUNTIME",
      latencyMs: 0,
      calls: 0,
      ...dispatched,
    };
  }
  if (isRegulatoryQueryDispatch(job.queryNavigation)) {
    const completedAt = new Date().toISOString();
    const turnId = createTurnId();
    const dispatched = dispatchRegulatoryFromQuery({
      project: job.project,
      navigation: job.queryNavigation,
      ownerResultLedger: job.ownerResultLedger,
      traceLedger: job.scientificExecutionTraceLedger,
      sessionId: job.sessionId,
      conversationId: job.conversationId,
      startedAt: completedAt,
      completedAt,
    });
    const turn = { turnId, role: "NOXIA" as const, content: dispatched.presentation.plainText, createdAt: completedAt };
    return {
      kind: "REGULATORY" as const,
      turn,
      content: turn.content,
      presentationSource: "REG_STANDARD_PROJECTION" as const,
      mediationFailure: null,
      provider: "NONE",
      model: "REG001_DETERMINISTIC_RUNTIME",
      latencyMs: 0,
      calls: 0,
      ...dispatched,
    };
  }
  if (isScientificThinkingQueryDispatch(job.queryNavigation)) {
    const completedAt = new Date().toISOString();
    const turnId = createTurnId();
    const dispatched = dispatchScientificThinkingFromQuery({
      project: job.project,
      navigation: job.queryNavigation,
      ownerResultLedger: job.ownerResultLedger,
      traceLedger: job.scientificExecutionTraceLedger,
      sessionId: job.sessionId,
      conversationId: job.conversationId,
      presentationTurnRef: turnId,
      startedAt: completedAt,
      completedAt,
    });
    const turn = {
      turnId,
      role: "NOXIA" as const,
      content: dispatched.presentation.plainText,
      createdAt: completedAt,
    };
    return {
      kind: "SCIENTIFIC_THINKING" as const,
      turn,
      content: turn.content,
      presentationSource: "ST_STANDARD_PROJECTION" as const,
      mediationFailure: null,
      provider: "NONE",
      model: "SCIENTIFIC_THINKING_RUNTIME",
      latencyMs: 0,
      calls: 0,
      ...dispatched,
    };
  }
  if (isObservabilityQueryDispatch(job.queryNavigation)) {
    const completedAt = new Date().toISOString();
    const turnId = createTurnId();
    const dispatched = dispatchObservabilityFromQuery({
      project: job.project,
      navigation: job.queryNavigation,
      ownerResultLedger: job.ownerResultLedger,
      traceLedger: job.scientificExecutionTraceLedger,
      sessionId: job.sessionId,
      conversationId: job.conversationId,
      presentationTurnRef: turnId,
      startedAt: completedAt,
      completedAt,
    });
    const turn = { turnId, role: "NOXIA" as const, content: dispatched.presentation.plainText, createdAt: completedAt };
    return {
      kind: "OBSERVABILITY" as const,
      turn,
      content: turn.content,
      presentationSource: "OBS_STANDARD_PROJECTION" as const,
      mediationFailure: null,
      provider: "NONE",
      model: "OBSERVABILITY_MEASUREMENT_RUNTIME",
      latencyMs: 0,
      calls: 0,
      ...dispatched,
    };
  }
  if (isImagingQueryDispatch(job.queryNavigation)) {
    const completedAt = new Date().toISOString();
    const turnId = createTurnId();
    const dispatched = dispatchImagingFromQuery({
      project: job.project,
      navigation: job.queryNavigation,
      ownerResultLedger: job.ownerResultLedger,
      traceLedger: job.scientificExecutionTraceLedger,
      sessionId: job.sessionId,
      conversationId: job.conversationId,
      presentationTurnRef: turnId,
      startedAt: completedAt,
      completedAt,
    });
    const turn = { turnId, role: "NOXIA" as const, content: dispatched.presentation.plainText, createdAt: completedAt };
    return {
      kind: "IMAGING" as const,
      turn,
      content: turn.content,
      presentationSource: "IMAGING_STANDARD_PROJECTION" as const,
      mediationFailure: null,
      provider: "NONE",
      model: "IMAGING_STUDY_DESIGNER_RUNTIME",
      latencyMs: 0,
      calls: 0,
      ...dispatched,
    };
  }
  if (isCanonicalStudyDataQueryDispatch(job.queryNavigation)) {
    const completedAt = new Date().toISOString();
    const turnId = createTurnId();
    const dispatched = dispatchCanonicalStudyDataFromQuery({
      project: job.project,
      navigation: job.queryNavigation,
      ownerResultLedger: job.ownerResultLedger,
      traceLedger: job.scientificExecutionTraceLedger,
      sessionId: job.sessionId,
      conversationId: job.conversationId,
      presentationTurnRef: turnId,
      startedAt: completedAt,
      completedAt,
    });
    const turn = { turnId, role: "NOXIA" as const, content: dispatched.presentation.plainText, createdAt: completedAt };
    return {
      kind: "CDM" as const,
      turn,
      content: turn.content,
      presentationSource: "CDM_STANDARD_PROJECTION" as const,
      mediationFailure: null,
      provider: "NONE",
      model: "CANONICAL_STUDY_DATA_RUNTIME",
      latencyMs: 0,
      calls: 0,
      ...dispatched,
    };
  }
  if (isDataManagementQueryDispatch(job.queryNavigation)) {
    const completedAt = new Date().toISOString();
    const turnId = createTurnId();
    const dispatched = dispatchDataManagementFromQuery({
      project: job.project,
      navigation: job.queryNavigation,
      ownerResultLedger: job.ownerResultLedger,
      traceLedger: job.scientificExecutionTraceLedger,
      sessionId: job.sessionId,
      conversationId: job.conversationId,
      presentationTurnRef: turnId,
      startedAt: completedAt,
      completedAt,
    });
    const turn = { turnId, role: "NOXIA" as const, content: dispatched.presentation.plainText, createdAt: completedAt };
    return {
      kind: "DATA_MANAGEMENT" as const,
      turn,
      content: turn.content,
      presentationSource: "DATA_MANAGEMENT_STANDARD_PROJECTION" as const,
      mediationFailure: null,
      provider: "NONE",
      model: "DATA_MANAGEMENT_REASONING_RUNTIME",
      latencyMs: 0,
      calls: 0,
      ...dispatched,
    };
  }
  if (isBiostatisticsQueryDispatch(job.queryNavigation)) {
    const completedAt = new Date().toISOString();
    const turnId = createTurnId();
    const dispatched = dispatchBiostatisticsFromQuery({
      project: job.project,
      navigation: job.queryNavigation,
      ownerResultLedger: job.ownerResultLedger,
      traceLedger: job.scientificExecutionTraceLedger,
      sessionId: job.sessionId,
      conversationId: job.conversationId,
      presentationTurnRef: turnId,
      startedAt: completedAt,
      completedAt,
    });
    const turn = { turnId, role: "NOXIA" as const, content: dispatched.presentation.plainText, createdAt: completedAt };
    return {
      kind: "BIOSTATISTICS" as const,
      turn,
      content: turn.content,
      presentationSource: "BIOSTATISTICS_STANDARD_PROJECTION" as const,
      mediationFailure: null,
      provider: "NONE",
      model: "BIOSTATISTICS_REASONING_RUNTIME",
      latencyMs: 0,
      calls: 0,
      ...dispatched,
    };
  }
  if (isStudyDesignQueryDispatch(job.queryNavigation)) {
    const completedAt = new Date().toISOString();
    const turnId = createTurnId();
    const dispatched = dispatchStudyDesignFromQuery({
      sourceTurn: [...job.runtimeTurns].reverse().find((turn) => turn.role === "USER"),
      project: job.project,
      navigation: job.queryNavigation,
      ownerResultLedger: job.ownerResultLedger,
      traceLedger: job.scientificExecutionTraceLedger,
      sessionId: job.sessionId,
      conversationId: job.conversationId,
      presentationTurnRef: turnId,
      startedAt: completedAt,
      completedAt,
    });
    const turn = {
      turnId,
      role: "NOXIA" as const,
      content: dispatched.presentation.plainText,
      createdAt: completedAt,
    };
    return {
      kind: "STUDY_DESIGN" as const,
      turn,
      content: turn.content,
      presentationSource: dispatched.proposal.options.length ? "RDE_STANDARD_PROJECTION" as const : "RDE_INFORMATION_NEED" as const,
      mediationFailure: null,
      provider: "NONE",
      model: "STUDY_DESIGN_RUNTIME",
      latencyMs: 0,
      calls: 0,
      ...dispatched,
    };
  }
  if (!shouldMediatePostAdoptionQuery(job.queryNavigation)
    || !job.queryNavigation.currentAction || !job.queryNavigation.currentPresentation) return null;
  const continuation = await requestProtocolDesignerBridge({
    requestKind: "POST_ADOPTION_QRY_CONTINUATION",
    conversation: {
      conversationId: job.conversationId,
      language: "fr",
      turns: job.runtimeTurns,
      interactionContext: {
        interactionRef: job.queryNavigation.currentPresentation.presentationId,
        sourceActionRef: job.queryNavigation.currentAction.selectedActionId,
        owner: "QUERY_NAVIGATION",
        purpose: [
          job.queryNavigation.currentPresentation.intent,
          `Question à formuler naturellement : ${job.queryNavigation.standardQuestion!.text}`,
        ].join("\n"),
        expectedResponseKind: "QRY_INFORMATION_RESPONSE",
        targetRefs: [job.queryNavigation.currentAction.targetRef],
        informationNeedRefs: [...job.queryNavigation.currentAction.navigationNeedRefs],
        projectRef: job.queryNavigation.projectRef,
        projectVersion: job.queryNavigation.projectVersion,
        projectDigest: job.queryNavigation.projectDigest,
      },
    },
    currentProject: job.project,
    currentNavigation: currentGovernedNavigationInput({
      project: job.project, navigation: job.queryNavigation, ownerResultLedger: job.ownerResultLedger,
    }),
    evaluatePersistentDelta: false,
  });
  const realizedAt = new Date().toISOString();
  const visible = resolveGovernedPostAdoptionReceipt({ response: continuation, project: job.project, realizedAt });
  return {
    kind: "QUESTION" as const, // Existing conversation branch discriminant; the native WHAT may be non-interrogative.
    turn: { ...continuation.assistantTurn, content: visible.content, createdAt: realizedAt },
    ...visible,
  };
};

type ProtocolDesignerWorkspaceProps = Readonly<{
  traceCaptureConfiguration?: ScientificTraceCaptureConfiguration;
}>;

const VALIDATED_CANDIDATE_DEGRADED_REPLY = "J’ai identifié plusieurs éléments dans votre projet. Voici ce que j’ai compris ; vous pouvez les corriger avant toute confirmation.";

export default function ProtocolDesignerWorkspace({
  traceCaptureConfiguration = DEFAULT_SCIENTIFIC_TRACE_CAPTURE_CONFIGURATION,
}: ProtocolDesignerWorkspaceProps) {
  const [session, setSession] = useState<FunctionalResetSession>(loadInitialSession);
  const [projectionMode, setProjectionMode] = useState<"STANDARD" | "EXPERT">("STANDARD");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyMessage, setBusyMessage] = useState("NOXIA vous répond…");
  const [correctionMode, setCorrectionMode] = useState(false);
  const [deliverableWorkspaceOpen, setDeliverableWorkspaceOpen] = useState(false);
  const [postAdoptionContinuationJob, setPostAdoptionContinuationJob] = useState<PostAdoptionContinuationJob | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const confirmationInFlightRef = useRef<string | null>(null);

  useEffect(() => {
    persistFunctionalResetSession(window.localStorage, session);
    if (import.meta.env.DEV && session.bridgeTraces.length > 0) {
      console.debug("NOXIA_PRODUCT_BRIDGE_TRACE", JSON.stringify(session.bridgeTraces.at(-1)));
    }
  }, [session]);

  useEffect(() => {
    if (!postAdoptionContinuationJob) return;
    let active = true;
    const job = postAdoptionContinuationJob;
    void resolvePostAdoptionContinuationJob(job).then((continuation) => {
      if (!active || !continuation) return;
      const continuedAt = continuation.turn.createdAt;
      setSession((current) => {
        let scientificExecutionTraceLedger = continuation.kind !== "QUESTION"
          ? continuation.traceLedger : current.scientificExecutionTraceLedger;
        if (continuation.kind === "QUESTION" && job.traceRunId
          && scientificExecutionTraceLedger.runBindings.some((binding) => binding.runId === job.traceRunId)) {
          const receipt = continuation.nativeReceipt;
          const source = job.runtimeTurns.find((turn) => turn.turnId === receipt.currentTurnNavigation?.envelope.sourceTurnRef);
          const nativeTrace = recordGovernedConversationTrace({
            ledger: scientificExecutionTraceLedger, traceRunId: job.traceRunId,
            conversationId: current.conversationId, sourceDigest: source ? logicalDigest(source.content) : "UNKNOWN",
            observedAt: continuedAt, response: receipt,
            providerContext: JSON.stringify(receipt.currentTurnNavigation!.envelope),
            systemInstruction: GOVERNED_REALIZATION_SYSTEM_INSTRUCTION,
          });
          scientificExecutionTraceLedger = nativeTrace.ledger;
          if (receipt.conversationFailure) scientificExecutionTraceLedger = recordProductErrorBoundary({
            ledger: scientificExecutionTraceLedger, traceRunId: job.traceRunId,
            turnId: continuation.turn.turnId, conversationId: current.conversationId,
            startedAt: receipt.stageTimestamps?.howRequestedAt ?? continuedAt, failedAt: continuedAt,
            owner: "QUERY_NAVIGATION", responsibilityOwner: "QUERY_NAVIGATION",
            executor: "GOVERNED_CONVERSATION_REALIZATION", componentId: "GOVERNED_CONVERSATION_REALIZATION",
            componentVersion: receipt.currentTurnNavigation!.envelope.contractVersion,
            provider: nativeTrace.realizationOutcome.attemptedProvider,
            code: receipt.conversationFailure.code, category: "BOUNDARY_REJECTION",
            project: job.project, realizationOutcome: nativeTrace.realizationOutcome,
          });
          scientificExecutionTraceLedger = recordPostAdoptionGovernedLocalRealization({
            ledger: scientificExecutionTraceLedger, traceRunId: job.traceRunId,
            conversationId: current.conversationId, turnId: continuation.turn.turnId,
            response: receipt, realized: continuation, nativeOutcome: nativeTrace.realizationOutcome,
          });
        }
        const conversationEntry: ConversationEntry = continuation.kind === "STUDY_DESIGN" && continuation.proposal.options.length
          ? {
            entryId: createConversationEntryId(),
            kind: "STUDY_DESIGN_PROPOSAL",
            role: "NOXIA",
            presentation: continuation.presentation,
            createdAt: continuedAt,
          }
          : continuation.kind === "OBSERVABILITY"
            ? {
              entryId: createConversationEntryId(),
              kind: "OBSERVABILITY_PROPOSAL",
              role: "NOXIA",
              presentation: continuation.presentation,
              createdAt: continuedAt,
            }
          : continuation.kind === "IMAGING"
            ? {
              entryId: createConversationEntryId(),
              kind: "IMAGING_PROPOSAL",
              role: "NOXIA",
              presentation: continuation.presentation,
              createdAt: continuedAt,
            }
          : continuation.kind === "BIOSTATISTICS"
            ? {
              entryId: createConversationEntryId(),
              kind: "BIOSTATISTICS_PROPOSAL",
              role: "NOXIA",
              presentation: continuation.presentation,
              createdAt: continuedAt,
            }
          : continuation.kind === "CDM"
            ? {
              entryId: createConversationEntryId(),
              kind: "CDM_RESULT",
              role: "NOXIA",
              presentation: continuation.presentation,
              createdAt: continuedAt,
            }
          : continuation.kind === "DATA_MANAGEMENT"
            ? {
              entryId: createConversationEntryId(),
              kind: "DATA_MANAGEMENT_RESULT",
              role: "NOXIA",
              presentation: continuation.presentation,
              createdAt: continuedAt,
            }
          : {
            entryId: createConversationEntryId(),
            kind: "TEXT",
            role: "NOXIA",
            content: continuation.content,
            createdAt: continuedAt,
          };
        return {
        ...current,
        queryNavigation: continuation.kind === "STUDY_DESIGN" ? continuation.navigation : current.queryNavigation,
        studyDesignInteraction: continuation.kind === "STUDY_DESIGN" ? continuation.interaction : current.studyDesignInteraction,
        scientificThinkingInteraction: continuation.kind === "SCIENTIFIC_THINKING" ? continuation.interaction : current.scientificThinkingInteraction,
        observabilityInteraction: continuation.kind === "OBSERVABILITY" ? continuation.interaction : current.observabilityInteraction,
        imagingInteraction: continuation.kind === "IMAGING" ? continuation.interaction : current.imagingInteraction,
        biostatisticsInteraction: continuation.kind === "BIOSTATISTICS" ? continuation.interaction : current.biostatisticsInteraction,
        canonicalStudyDataInteraction: continuation.kind === "CDM" ? continuation.interaction : current.canonicalStudyDataInteraction,
        dataManagementInteraction: continuation.kind === "DATA_MANAGEMENT" ? continuation.interaction : current.dataManagementInteraction,
        knowledgeOwnerLedger: continuation.kind !== "QUESTION" ? continuation.ownerResultLedger : current.knowledgeOwnerLedger,
        runtimeTurns: [...job.runtimeTurns, continuation.turn],
        entries: [...current.entries, conversationEntry],
        bridgeTraces: [...current.bridgeTraces, {
          turnId: continuation.turn.turnId,
          traceRunId: continuation.kind !== "QUESTION"
            ? continuation.kind === "KNOWLEDGE" ? continuation.traceRunId ?? undefined : continuation.interaction.traceRunId ?? undefined
            : job.traceRunId ?? undefined,
          requestKind: "POST_ADOPTION_QRY_CONTINUATION" as const,
          raw: captureProductBridgeTraceText({ value: job.feedback, field: "SOURCE_TEXT" }),
          assistantReply: captureProductBridgeTraceText({ value: continuation.content, field: "ASSISTANT_REPLY" }),
          persistentExtractionCalled: false,
          persistentExtractionStatus: "NOT_REQUESTED" as const,
          providerArtifact: null,
          wireCandidate: null,
          persistentCandidate: null,
          deterministicValidation: null,
          projectChangeSetCandidate: null,
          canonicalProjectChangeSetCandidate: null,
          humanReviewProjection: null,
          humanDecision: job.project.confirmationDecision,
          projectVersionBefore: job.project.versionId,
          projectVersionAfter: job.project.versionId,
          qryNeedBefore: null,
          qryNeedAfter: (continuation.kind === "STUDY_DESIGN" ? continuation.navigation : job.queryNavigation).currentAction?.navigationNeedRefs[0] ?? null,
          provider: continuation.provider,
          model: continuation.model,
          conversationLatencyMs: continuation.latencyMs,
          extractionLatencyMs: null,
          calls: continuation.calls,
          continuationPresentationSource: continuation.presentationSource,
          continuationMediationFailure: continuation.mediationFailure,
        }].slice(-20),
        scientificExecutionTraceLedger,
        updatedAt: continuedAt,
      };
      });
    }).catch((error: unknown) => {
      if (!active) return;
      const failedAt = new Date().toISOString();
      setSession((current) => ({
        ...current,
        entries: [...current.entries, {
          entryId: createConversationEntryId(),
          kind: "ERROR",
          role: "NOXIA",
          content: isScientificThinkingQueryDispatch(job.queryNavigation)
            ? "NOXIA n’a pas pu préparer les propositions scientifiques à partir de cette version du Research Project. Le Project reste inchangé."
            : isObservabilityQueryDispatch(job.queryNavigation)
              ? "NOXIA n’a pas pu qualifier les besoins d’observation et de mesure à partir de cette version du Research Project. Le Project reste inchangé."
            : isImagingQueryDispatch(job.queryNavigation)
              ? "NOXIA n’a pas pu préparer la stratégie d’imagerie à partir de cette version du Research Project. Le Project reste inchangé."
            : isBiostatisticsQueryDispatch(job.queryNavigation)
              ? "NOXIA n’a pas pu préparer les stratégies analytiques à partir de cette version du Research Project. Le Project reste inchangé."
            : isCanonicalStudyDataQueryDispatch(job.queryNavigation)
              ? "NOXIA n’a pas pu représenter les données attendues à partir de cette version du Research Project. Le Project reste inchangé."
            : isDataManagementQueryDispatch(job.queryNavigation)
              ? "NOXIA n’a pas pu préparer la gestion opérationnelle des données à partir du résultat canonique courant. Le Project reste inchangé."
            : isStudyDesignQueryDispatch(job.queryNavigation)
              ? "NOXIA n’a pas pu préparer les stratégies d’étude à partir de cette version du Research Project. Le Project reste inchangé."
              : "NOXIA n’a pas pu présenter la prochaine étape. Vous pouvez poursuivre librement.",
          createdAt: failedAt,
        }],
        updatedAt: failedAt,
      }));
      if (import.meta.env.DEV) console.error("NOXIA_POST_ADOPTION_CONTINUATION_FAILURE", error);
    }).finally(() => {
      if (!active) return;
      setPostAdoptionContinuationJob((current) => current === job ? null : current);
      setBusy(false);
    });
    return () => { active = false; };
  }, [postAdoptionContinuationJob]);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
  }, [busy, session.entries.length]);

  const projectExistedForReview = useMemo(() => {
    const firstProjectContributionIndex = session.entries.findIndex((entry) => entry.kind === "REVIEW" && entry.status === "CONFIRMED");
    return (entryIndex: number) => firstProjectContributionIndex >= 0 && entryIndex > firstProjectContributionIndex;
  }, [session.entries]);

  const applyScientificThinkingInput = async (input: string | PreparedGatewayUserInput) => {
    const prepared = normalizePreparedUserInput(input);
    const content = prepared.workingText;
    const interaction = session.scientificThinkingInteraction;
    const project = session.project;
    if (!interaction || interaction.status !== "ACTIVE" || !project) return false;
    if (!scientificThinkingInteractionMatchesCurrentProject(interaction, project)) {
      setSession((current) => ({
        ...current,
        scientificThinkingInteraction: current.scientificThinkingInteraction
          ? { ...current.scientificThinkingInteraction, status: "STALE", staleReason: "SOURCE_PROJECT_VERSION_CHANGED" }
          : null,
      }));
      return false;
    }
    const output = readScientificThinkingOutputFromLedger({
      ledger: session.knowledgeOwnerLedger,
      resultRef: interaction.ownerResultRef,
    });
    if (!output) return false;
    const resolution = resolveScientificThinkingConversation({ raw: content, output });
    if (resolution.kind === "FALLTHROUGH") return false;
    const recordedAt = prepared.createdAt;
    const userTurn: ScientificInterpretationTurn = {
      turnId: prepared.turnId,
      role: "USER",
      content: prepared.originalText,
      createdAt: recordedAt,
    };
    const priorProposalTurn = session.runtimeTurns.find((turn) => turn.turnId === interaction.presentationTurnRef);
    const proposalTurn: ScientificInterpretationTurn = priorProposalTurn ?? {
      turnId: interaction.presentationTurnRef,
      role: "NOXIA",
      content: buildStandardScientificThinkingPresentation(output).plainText,
      createdAt: recordedAt,
    };
    if (resolution.kind === "SELECT_CANDIDATE") {
      const contribution = buildScientificThinkingSelectionContribution({
        conversationId: session.conversationId,
        project,
        output,
        candidateRef: resolution.candidateRef,
        proposalTurn,
        selectionTurn: userTurn,
        createdAt: recordedAt,
      });
      const candidate = prepareResearchProjectContributionCandidate(contribution, project);
      if (candidate.status !== "CANDIDATE_PENDING_HUMAN_CONFIRMATION") {
        throw new Error(`SCIENTIFIC_THINKING_REVIEW_CANDIDATE_${candidate.status}`);
      }
      const scientificExecutionTraceLedger = recordStudyDesignOptionReviewTrace({
        ledger: session.scientificExecutionTraceLedger,
        traceRunId: interaction.traceRunId,
        conversationId: session.conversationId,
        recordedAt,
        contribution,
        candidate,
        project,
        proposalRef: output.outputId,
        proposalDigest: output.outputDigest,
        optionRef: resolution.candidateRef,
        responsibilityOwner: "SCIENTIFIC_THINKING",
      });
      setSession((current) => ({
        ...current,
        runtimeTurns: [...current.runtimeTurns, userTurn],
        pendingContribution: contribution,
        scientificThinkingInteraction: current.scientificThinkingInteraction ? {
          ...current.scientificThinkingInteraction,
          status: "PENDING_HUMAN_REVIEW",
          selectedCandidateRef: resolution.candidateRef,
          pendingContributionRef: contribution.identity.contributionId,
        } : null,
        entries: [...current.entries, {
          entryId: createConversationEntryId(),
          kind: "TEXT",
          role: "USER",
          content: prepared.originalText,
          createdAt: recordedAt,
        }, {
          entryId: createConversationEntryId(),
          kind: "REVIEW",
          role: "NOXIA",
          contribution,
          candidate,
          traceRunId: interaction.traceRunId,
          status: "PENDING",
          decision: null,
          createdAt: recordedAt,
        }],
        scientificExecutionTraceLedger,
        conversationLanguageGateway: prepared.gatewayState ?? current.conversationLanguageGateway,
        updatedAt: recordedAt,
      }));
      return true;
    }
    const localized = prepared.gatewayState ? await localizeCanonicalFrenchResponse({
      state: prepared.gatewayState,
      sourceTurnRef: userTurn.turnId,
      responseId: `conversation-response:${userTurn.turnId}`,
      canonicalFrenchResponse: resolution.response,
    }) : null;
    const assistantTurn: ScientificInterpretationTurn = {
      turnId: createTurnId(),
      role: "NOXIA",
      content: resolution.response,
      createdAt: recordedAt,
    };
    const scientificExecutionTraceLedger = recordStudyDesignConversationTrace({
      ledger: session.scientificExecutionTraceLedger,
      traceRunId: interaction.traceRunId,
      conversationId: session.conversationId,
      recordedAt,
      project,
      proposalRef: output.outputId,
      proposalDigest: output.outputDigest,
      turnRef: userTurn.turnId,
      status: resolution.kind === "DISCUSS" ? "DISCUSSION" : "DEFERRED",
      responsibilityOwner: "SCIENTIFIC_THINKING",
    });
    setSession((current) => ({
      ...current,
      runtimeTurns: [...current.runtimeTurns, userTurn, assistantTurn],
      entries: [...current.entries, {
        entryId: createConversationEntryId(),
        kind: "TEXT",
        role: "USER",
        content: prepared.originalText,
        createdAt: recordedAt,
      }, {
        entryId: createConversationEntryId(),
        kind: "TEXT",
        role: "NOXIA",
        content: localized?.response.localizedResponse ?? resolution.response,
        createdAt: recordedAt,
      }],
      scientificExecutionTraceLedger,
      conversationLanguageGateway: localized?.state ?? prepared.gatewayState ?? current.conversationLanguageGateway,
      updatedAt: recordedAt,
    }));
    return true;
  };

  const applyStudyDesignInput = async (input: string | PreparedGatewayUserInput, explicitOptionRef?: string) => {
    const prepared = normalizePreparedUserInput(input);
    const content = prepared.workingText;
    const interaction = session.studyDesignInteraction;
    const project = session.project;
    if (!interaction || interaction.status !== "ACTIVE" || !project) return false;
    if (!interactionMatchesCurrentProject(interaction, project)) {
      setSession((current) => ({
        ...current,
        studyDesignInteraction: current.studyDesignInteraction
          ? { ...current.studyDesignInteraction, status: "STALE", staleReason: "SOURCE_PROJECT_VERSION_CHANGED" }
          : null,
      }));
      return false;
    }
    const proposal = readStudyDesignProposalFromLedger({
      ledger: session.knowledgeOwnerLedger,
      resultRef: interaction.ownerResultRef,
    });
    if (!proposal) return false;
    const resolution = explicitOptionRef
      ? { kind: "SELECT_OPTION" as const, optionRef: explicitOptionRef }
      : resolveStudyDesignConversation({ raw: content, proposal });
    if (resolution.kind === "FALLTHROUGH") return false;

    const recordedAt = prepared.createdAt;
    const userTurn: ScientificInterpretationTurn = {
      turnId: prepared.turnId,
      role: "USER",
      content: prepared.originalText,
      createdAt: recordedAt,
    };
    const proposalEntry = session.entries.find((entry) => entry.kind === "STUDY_DESIGN_PROPOSAL"
      && entry.presentation.proposalRef === proposal.proposalId);
    const proposalTurn: ScientificInterpretationTurn = {
      turnId: interaction.presentationTurnRef,
      role: "NOXIA",
      content: proposalEntry?.kind === "STUDY_DESIGN_PROPOSAL"
        ? proposalEntry.presentation.plainText
        : buildStandardStudyDesignPresentation(proposal).plainText,
      createdAt: proposalEntry?.createdAt ?? recordedAt,
    };

    if (resolution.kind === "SELECT_OPTION") {
      const contribution = buildStudyDesignOptionContribution({
        conversationId: session.conversationId,
        project,
        proposal,
        optionRef: resolution.optionRef,
        proposalTurn,
        selectionTurn: userTurn,
        createdAt: recordedAt,
      });
      const candidate = prepareResearchProjectContributionCandidate(contribution, project);
      if (candidate.status !== "CANDIDATE_PENDING_HUMAN_CONFIRMATION") {
        throw new Error(`STUDY_DESIGN_REVIEW_CANDIDATE_${candidate.status}`);
      }
      const scientificExecutionTraceLedger = recordStudyDesignOptionReviewTrace({
        ledger: session.scientificExecutionTraceLedger,
        traceRunId: interaction.traceRunId,
        conversationId: session.conversationId,
        recordedAt,
        contribution,
        candidate,
        project,
        proposalRef: proposal.proposalId,
        proposalDigest: proposal.proposalDigest,
        optionRef: resolution.optionRef,
      });
      setSession((current) => ({
        ...current,
        runtimeTurns: [...current.runtimeTurns, userTurn],
        pendingContribution: contribution,
        studyDesignInteraction: current.studyDesignInteraction ? {
          ...current.studyDesignInteraction,
          status: "PENDING_HUMAN_REVIEW",
          selectedOptionRef: resolution.optionRef,
          pendingContributionRef: contribution.identity.contributionId,
        } : null,
        entries: [...current.entries, {
          entryId: createConversationEntryId(),
          kind: "TEXT",
          role: "USER",
          content: prepared.originalText,
          createdAt: recordedAt,
        }, {
          entryId: createConversationEntryId(),
          kind: "REVIEW",
          role: "NOXIA",
          contribution,
          candidate,
          traceRunId: interaction.traceRunId,
          status: "PENDING",
          decision: null,
          createdAt: recordedAt,
        }],
        scientificExecutionTraceLedger,
        conversationLanguageGateway: prepared.gatewayState ?? current.conversationLanguageGateway,
        updatedAt: recordedAt,
      }));
      return true;
    }

    const localized = prepared.gatewayState ? await localizeCanonicalFrenchResponse({
      state: prepared.gatewayState,
      sourceTurnRef: userTurn.turnId,
      responseId: `conversation-response:${userTurn.turnId}`,
      canonicalFrenchResponse: resolution.response,
    }) : null;
    const assistantTurn: ScientificInterpretationTurn = {
      turnId: createTurnId(),
      role: "NOXIA",
      content: resolution.response,
      createdAt: recordedAt,
    };
    const scientificExecutionTraceLedger = recordStudyDesignConversationTrace({
      ledger: session.scientificExecutionTraceLedger,
      traceRunId: interaction.traceRunId,
      conversationId: session.conversationId,
      recordedAt,
      project,
      proposalRef: proposal.proposalId,
      proposalDigest: proposal.proposalDigest,
      turnRef: userTurn.turnId,
      status: resolution.kind === "DISCUSS" ? "DISCUSSION"
        : resolution.kind === "DEFER" ? "DEFERRED"
          : "OPTIONS_REJECTED",
    });
    setSession((current) => ({
      ...current,
      runtimeTurns: [...current.runtimeTurns, userTurn, assistantTurn],
      studyDesignInteraction: resolution.kind === "REJECT_ALL" && current.studyDesignInteraction
        ? { ...current.studyDesignInteraction, status: "REJECTED", staleReason: "USER_REJECTED_ALL_OPTIONS" }
        : current.studyDesignInteraction,
      entries: [...current.entries, {
        entryId: createConversationEntryId(),
        kind: "TEXT",
        role: "USER",
        content: prepared.originalText,
        createdAt: recordedAt,
      }, {
        entryId: createConversationEntryId(),
        kind: "TEXT",
        role: "NOXIA",
        content: localized?.response.localizedResponse ?? resolution.response,
        createdAt: recordedAt,
      }],
      scientificExecutionTraceLedger,
      conversationLanguageGateway: localized?.state ?? prepared.gatewayState ?? current.conversationLanguageGateway,
      updatedAt: recordedAt,
    }));
    return true;
  };

  const applyObservabilityInput = async (input: string | PreparedGatewayUserInput, explicitMeasurementRef?: string) => {
    const prepared = normalizePreparedUserInput(input);
    const content = prepared.workingText;
    const interaction = session.observabilityInteraction;
    const project = session.project;
    if (!interaction || interaction.status !== "ACTIVE" || !project) return false;
    if (!observabilityInteractionMatchesCurrentProject(interaction, project)) {
      setSession((current) => ({
        ...current,
        observabilityInteraction: current.observabilityInteraction
          ? { ...current.observabilityInteraction, status: "STALE", staleReason: "SOURCE_PROJECT_VERSION_CHANGED" }
          : null,
      }));
      return false;
    }
    const result = readObservabilityResultFromLedger({ ledger: session.knowledgeOwnerLedger, resultRef: interaction.ownerResultRef });
    if (!result) return false;
    const resolution = explicitMeasurementRef
      ? { kind: "SELECT_MEASUREMENT" as const, measurementRef: explicitMeasurementRef }
      : resolveObservabilityConversation({ raw: content, result });
    if (resolution.kind === "FALLTHROUGH") return false;
    const recordedAt = prepared.createdAt;
    const userTurn: ScientificInterpretationTurn = { turnId: prepared.turnId, role: "USER", content: prepared.originalText, createdAt: recordedAt };
    const proposalEntry = session.entries.find((entry) => entry.kind === "OBSERVABILITY_PROPOSAL"
      && entry.presentation.resultRef === result.resultId);
    const proposalTurn: ScientificInterpretationTurn = {
      turnId: interaction.presentationTurnRef,
      role: "NOXIA",
      content: proposalEntry?.kind === "OBSERVABILITY_PROPOSAL"
        ? proposalEntry.presentation.plainText
        : buildStandardObservabilityPresentation(result).plainText,
      createdAt: proposalEntry?.createdAt ?? recordedAt,
    };
    if (resolution.kind === "SELECT_MEASUREMENT") {
      const contribution = buildObservabilityMeasurementContribution({
        conversationId: session.conversationId,
        project,
        result,
        measurementRef: resolution.measurementRef,
        proposalTurn,
        selectionTurn: userTurn,
        createdAt: recordedAt,
      });
      const candidate = prepareResearchProjectContributionCandidate(contribution, project);
      if (candidate.status !== "CANDIDATE_PENDING_HUMAN_CONFIRMATION") throw new Error(`OBS_REVIEW_CANDIDATE_${candidate.status}`);
      const scientificExecutionTraceLedger = recordStudyDesignOptionReviewTrace({
        ledger: session.scientificExecutionTraceLedger,
        traceRunId: interaction.traceRunId,
        conversationId: session.conversationId,
        recordedAt,
        contribution,
        candidate,
        project,
        proposalRef: result.resultId,
        proposalDigest: result.resultDigest,
        optionRef: resolution.measurementRef,
        responsibilityOwner: "OBSERVABILITY_MEASUREMENT",
      });
      setSession((current) => ({
        ...current,
        runtimeTurns: [...current.runtimeTurns, userTurn],
        pendingContribution: contribution,
        observabilityInteraction: current.observabilityInteraction ? {
          ...current.observabilityInteraction,
          status: "PENDING_HUMAN_REVIEW",
          selectedMeasurementRef: resolution.measurementRef,
          pendingContributionRef: contribution.identity.contributionId,
        } : null,
        entries: [...current.entries,
          { entryId: createConversationEntryId(), kind: "TEXT", role: "USER", content: prepared.originalText, createdAt: recordedAt },
          { entryId: createConversationEntryId(), kind: "REVIEW", role: "NOXIA", contribution, candidate, traceRunId: interaction.traceRunId, status: "PENDING", decision: null, createdAt: recordedAt }],
        scientificExecutionTraceLedger,
        conversationLanguageGateway: prepared.gatewayState ?? current.conversationLanguageGateway,
        updatedAt: recordedAt,
      }));
      return true;
    }
    const localized = prepared.gatewayState ? await localizeCanonicalFrenchResponse({
      state: prepared.gatewayState,
      sourceTurnRef: userTurn.turnId,
      responseId: `conversation-response:${userTurn.turnId}`,
      canonicalFrenchResponse: resolution.response,
    }) : null;
    const assistantTurn: ScientificInterpretationTurn = { turnId: createTurnId(), role: "NOXIA", content: resolution.response, createdAt: recordedAt };
    const scientificExecutionTraceLedger = recordStudyDesignConversationTrace({
      ledger: session.scientificExecutionTraceLedger,
      traceRunId: interaction.traceRunId,
      conversationId: session.conversationId,
      recordedAt,
      project,
      proposalRef: result.resultId,
      proposalDigest: result.resultDigest,
      turnRef: userTurn.turnId,
      status: resolution.kind === "DISCUSS" ? "DISCUSSION" : "DEFERRED",
      responsibilityOwner: "OBSERVABILITY_MEASUREMENT",
    });
    setSession((current) => ({
      ...current,
      runtimeTurns: [...current.runtimeTurns, userTurn, assistantTurn],
      entries: [...current.entries,
        { entryId: createConversationEntryId(), kind: "TEXT", role: "USER", content: prepared.originalText, createdAt: recordedAt },
        { entryId: createConversationEntryId(), kind: "TEXT", role: "NOXIA", content: localized?.response.localizedResponse ?? resolution.response, createdAt: recordedAt }],
      scientificExecutionTraceLedger,
      conversationLanguageGateway: localized?.state ?? prepared.gatewayState ?? current.conversationLanguageGateway,
      updatedAt: recordedAt,
    }));
    return true;
  };

  const applyImagingInput = async (input: string | PreparedGatewayUserInput, explicitOptionRef?: string) => {
    const prepared = normalizePreparedUserInput(input);
    const content = prepared.workingText;
    const interaction = session.imagingInteraction;
    const project = session.project;
    if (!interaction || interaction.status !== "ACTIVE" || !project) return false;
    if (!imagingInteractionMatchesCurrentProject(interaction, project)) {
      setSession((current) => ({
        ...current,
        imagingInteraction: current.imagingInteraction
          ? { ...current.imagingInteraction, status: "STALE", staleReason: "SOURCE_PROJECT_VERSION_CHANGED" }
          : null,
      }));
      return false;
    }
    const result = readImagingResultFromLedger({ ledger: session.knowledgeOwnerLedger, resultRef: interaction.ownerResultRef });
    if (!result) return false;
    const resolution = explicitOptionRef
      ? { kind: "SELECT_OPTION" as const, optionRef: explicitOptionRef }
      : resolveImagingConversation({ raw: content, result });
    if (resolution.kind === "FALLTHROUGH") return false;
    const recordedAt = prepared.createdAt;
    const userTurn: ScientificInterpretationTurn = { turnId: prepared.turnId, role: "USER", content: prepared.originalText, createdAt: recordedAt };
    const proposalEntry = session.entries.find((entry) => entry.kind === "IMAGING_PROPOSAL"
      && entry.presentation.resultRef === result.resultId);
    const proposalTurn: ScientificInterpretationTurn = {
      turnId: interaction.presentationTurnRef,
      role: "NOXIA",
      content: proposalEntry?.kind === "IMAGING_PROPOSAL"
        ? proposalEntry.presentation.plainText
        : buildStandardImagingPresentation(result).plainText,
      createdAt: proposalEntry?.createdAt ?? recordedAt,
    };
    if (resolution.kind === "SELECT_OPTION") {
      const contribution = prepareImagingAcquisitionContribution({
        conversationId: session.conversationId,
        project,
        result,
        optionRef: resolution.optionRef,
        proposalTurn,
        selectionTurn: userTurn,
        createdAt: recordedAt,
      });
      const candidate = prepareResearchProjectContributionCandidate(contribution, project);
      if (candidate.status !== "CANDIDATE_PENDING_HUMAN_CONFIRMATION") throw new Error(`IMAGING_REVIEW_CANDIDATE_${candidate.status}`);
      const scientificExecutionTraceLedger = recordStudyDesignOptionReviewTrace({
        ledger: session.scientificExecutionTraceLedger,
        traceRunId: interaction.traceRunId,
        conversationId: session.conversationId,
        recordedAt,
        contribution,
        candidate,
        project,
        proposalRef: result.resultId,
        proposalDigest: result.resultDigest,
        optionRef: resolution.optionRef,
        responsibilityOwner: "IMAGING",
      });
      setSession((current) => ({
        ...current,
        runtimeTurns: [...current.runtimeTurns, userTurn],
        pendingContribution: contribution,
        imagingInteraction: current.imagingInteraction ? {
          ...current.imagingInteraction,
          status: "PENDING_HUMAN_REVIEW",
          selectedOptionRef: resolution.optionRef,
          pendingContributionRef: contribution.identity.contributionId,
        } : null,
        entries: [...current.entries,
          { entryId: createConversationEntryId(), kind: "TEXT", role: "USER", content: prepared.originalText, createdAt: recordedAt },
          { entryId: createConversationEntryId(), kind: "REVIEW", role: "NOXIA", contribution, candidate, traceRunId: interaction.traceRunId, status: "PENDING", decision: null, createdAt: recordedAt }],
        scientificExecutionTraceLedger,
        conversationLanguageGateway: prepared.gatewayState ?? current.conversationLanguageGateway,
        updatedAt: recordedAt,
      }));
      return true;
    }
    const localized = prepared.gatewayState ? await localizeCanonicalFrenchResponse({
      state: prepared.gatewayState,
      sourceTurnRef: userTurn.turnId,
      responseId: `conversation-response:${userTurn.turnId}`,
      canonicalFrenchResponse: resolution.response,
    }) : null;
    const assistantTurn: ScientificInterpretationTurn = { turnId: createTurnId(), role: "NOXIA", content: resolution.response, createdAt: recordedAt };
    const scientificExecutionTraceLedger = recordStudyDesignConversationTrace({
      ledger: session.scientificExecutionTraceLedger,
      traceRunId: interaction.traceRunId,
      conversationId: session.conversationId,
      recordedAt,
      project,
      proposalRef: result.resultId,
      proposalDigest: result.resultDigest,
      turnRef: userTurn.turnId,
      status: resolution.kind === "DISCUSS" ? "DISCUSSION" : "DEFERRED",
      responsibilityOwner: "IMAGING",
    });
    setSession((current) => ({
      ...current,
      runtimeTurns: [...current.runtimeTurns, userTurn, assistantTurn],
      entries: [...current.entries,
        { entryId: createConversationEntryId(), kind: "TEXT", role: "USER", content: prepared.originalText, createdAt: recordedAt },
        { entryId: createConversationEntryId(), kind: "TEXT", role: "NOXIA", content: localized?.response.localizedResponse ?? resolution.response, createdAt: recordedAt }],
      scientificExecutionTraceLedger,
      conversationLanguageGateway: localized?.state ?? prepared.gatewayState ?? current.conversationLanguageGateway,
      updatedAt: recordedAt,
    }));
    return true;
  };

  const applyBiostatisticsInput = async (input: string | PreparedGatewayUserInput, explicitStrategyRef?: string) => {
    const prepared = normalizePreparedUserInput(input);
    const content = prepared.workingText;
    const interaction = session.biostatisticsInteraction;
    const project = session.project;
    if (!interaction || interaction.status !== "ACTIVE" || !project) return false;
    if (!biostatisticsInteractionMatchesCurrentProject(interaction, project)) {
      setSession((current) => ({
        ...current,
        biostatisticsInteraction: current.biostatisticsInteraction
          ? { ...current.biostatisticsInteraction, status: "STALE", staleReason: "SOURCE_PROJECT_VERSION_CHANGED" }
          : null,
      }));
      return false;
    }
    const result = readBiostatisticsResultFromLedger({ ledger: session.knowledgeOwnerLedger, resultRef: interaction.ownerResultRef });
    if (!result) return false;
    const resolution = explicitStrategyRef
      ? { kind: "SELECT_STRATEGY" as const, strategyRef: explicitStrategyRef }
      : resolveBiostatisticsConversation({ raw: content, result });
    if (resolution.kind === "FALLTHROUGH") return false;
    const recordedAt = prepared.createdAt;
    const userTurn: ScientificInterpretationTurn = { turnId: prepared.turnId, role: "USER", content: prepared.originalText, createdAt: recordedAt };
    const proposalEntry = session.entries.find((entry) => entry.kind === "BIOSTATISTICS_PROPOSAL"
      && entry.presentation.resultRef === result.resultId);
    const proposalTurn: ScientificInterpretationTurn = {
      turnId: interaction.presentationTurnRef,
      role: "NOXIA",
      content: proposalEntry?.kind === "BIOSTATISTICS_PROPOSAL"
        ? proposalEntry.presentation.plainText
        : buildStandardBiostatisticsPresentation(result).plainText,
      createdAt: proposalEntry?.createdAt ?? recordedAt,
    };
    if (resolution.kind === "SELECT_STRATEGY") {
      const contribution = buildBiostatisticsStrategyContribution({
        conversationId: session.conversationId,
        project,
        result,
        strategyRef: resolution.strategyRef,
        proposalTurn,
        selectionTurn: userTurn,
        createdAt: recordedAt,
      });
      const candidate = prepareResearchProjectContributionCandidate(contribution, project);
      if (candidate.status !== "CANDIDATE_PENDING_HUMAN_CONFIRMATION") throw new Error(`BIOSTATISTICS_REVIEW_CANDIDATE_${candidate.status}`);
      const scientificExecutionTraceLedger = recordStudyDesignOptionReviewTrace({
        ledger: session.scientificExecutionTraceLedger,
        traceRunId: interaction.traceRunId,
        conversationId: session.conversationId,
        recordedAt,
        contribution,
        candidate,
        project,
        proposalRef: result.resultId,
        proposalDigest: result.resultDigest,
        optionRef: resolution.strategyRef,
        responsibilityOwner: "BIOSTATISTICS",
      });
      setSession((current) => ({
        ...current,
        runtimeTurns: [...current.runtimeTurns, userTurn],
        pendingContribution: contribution,
        biostatisticsInteraction: current.biostatisticsInteraction ? {
          ...current.biostatisticsInteraction,
          status: "PENDING_HUMAN_REVIEW",
          selectedStrategyRef: resolution.strategyRef,
          pendingContributionRef: contribution.identity.contributionId,
        } : null,
        entries: [...current.entries,
          { entryId: createConversationEntryId(), kind: "TEXT", role: "USER", content: prepared.originalText, createdAt: recordedAt },
          { entryId: createConversationEntryId(), kind: "REVIEW", role: "NOXIA", contribution, candidate, traceRunId: interaction.traceRunId, status: "PENDING", decision: null, createdAt: recordedAt }],
        scientificExecutionTraceLedger,
        conversationLanguageGateway: prepared.gatewayState ?? current.conversationLanguageGateway,
        updatedAt: recordedAt,
      }));
      return true;
    }
    const localized = prepared.gatewayState ? await localizeCanonicalFrenchResponse({
      state: prepared.gatewayState,
      sourceTurnRef: userTurn.turnId,
      responseId: `conversation-response:${userTurn.turnId}`,
      canonicalFrenchResponse: resolution.response,
    }) : null;
    const assistantTurn: ScientificInterpretationTurn = { turnId: createTurnId(), role: "NOXIA", content: resolution.response, createdAt: recordedAt };
    const scientificExecutionTraceLedger = recordStudyDesignConversationTrace({
      ledger: session.scientificExecutionTraceLedger,
      traceRunId: interaction.traceRunId,
      conversationId: session.conversationId,
      recordedAt,
      project,
      proposalRef: result.resultId,
      proposalDigest: result.resultDigest,
      turnRef: userTurn.turnId,
      status: resolution.kind === "DISCUSS" ? "DISCUSSION" : "DEFERRED",
      responsibilityOwner: "BIOSTATISTICS",
    });
    setSession((current) => ({
      ...current,
      runtimeTurns: [...current.runtimeTurns, userTurn, assistantTurn],
      entries: [...current.entries,
        { entryId: createConversationEntryId(), kind: "TEXT", role: "USER", content: prepared.originalText, createdAt: recordedAt },
        { entryId: createConversationEntryId(), kind: "TEXT", role: "NOXIA", content: localized?.response.localizedResponse ?? resolution.response, createdAt: recordedAt }],
      scientificExecutionTraceLedger,
      conversationLanguageGateway: localized?.state ?? prepared.gatewayState ?? current.conversationLanguageGateway,
      updatedAt: recordedAt,
    }));
    return true;
  };

  const continueFromCanonicalStudyData = () => {
    const project = session.project;
    const interaction = session.canonicalStudyDataInteraction;
    if (!project || !interaction || interaction.status !== "ACTIVE" || busy) return;
    const result = readCanonicalStudyDataResultFromLedger({
      ledger: session.knowledgeOwnerLedger,
      resultRef: interaction.ownerResultRef,
    });
    if (!result || result.sourceProject.projectVersion !== project.versionId
      || result.sourceProject.projectDigest !== project.projectDigest) {
      setSession((current) => ({
        ...current,
        canonicalStudyDataInteraction: current.canonicalStudyDataInteraction
          ? { ...current.canonicalStudyDataInteraction, status: "STALE", staleReason: "SOURCE_PROJECT_VERSION_CHANGED" }
          : null,
      }));
      return;
    }
    const recordedAt = new Date().toISOString();
    const queryNavigation = attachCurrentKnowledgePrerequisiteWhenRequired({ project, navigation: buildFunctionalResetQueryNavigation({
      project,
      previous: session.queryNavigation,
      documentBlockers: documentBlockerSignals(session.documents),
      recordedAt,
      forceRebuild: true,
      dataOwnerState: deriveFunctionalResetDataOwnerState({ project, ledger: session.knowledgeOwnerLedger }),
    }) });
    setSession((current) => ({
      ...current,
      queryNavigation,
      canonicalStudyDataInteraction: current.canonicalStudyDataInteraction
        ? { ...current.canonicalStudyDataInteraction, status: "COMPLETED" }
        : null,
      updatedAt: recordedAt,
    }));
    setBusyMessage("Je prépare la prochaine décision utile…");
    setBusy(true);
    setPostAdoptionContinuationJob({
      sessionId: session.sessionId,
      conversationId: session.conversationId,
      project,
      queryNavigation,
      ownerResultLedger: session.knowledgeOwnerLedger,
      scientificExecutionTraceLedger: session.scientificExecutionTraceLedger,
      runtimeTurns: session.runtimeTurns,
      feedback: "Préparer la gestion opérationnelle des données.",
      traceRunId: interaction.traceRunId,
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || busy) return;
    const now = new Date().toISOString();
    setDraft("");
    setCorrectionMode(false);
    setBusyMessage(session.project ? "Je vérifie les éléments déjà fournis…" : "Je structure votre projet…");
    setBusy(true);
    const turnId = createTurnId();
    const traceRunId = createProductTraceRunId(session.sessionId, turnId);
    let preparedGatewaySnapshot: Awaited<ReturnType<typeof prepareMultilingualUserTurn>> | null = null;
    let retainedThisTurn: RetainedContributionCandidate | null = null;
    let contextualActionPresentation: StandardConversationActionGroupPresentation | null = null;
    let currentProjectImpactProjection: NonNullable<ReturnType<typeof buildCurrentProjectImpactProjection>> | null = null;
    let governedRealizationOutcome: ScientificTraceRealizationOutcome | undefined;
    let downstreamStage = "CONFORMANCE";
    try {
      const preparedGateway = await prepareMultilingualUserTurn({ session, turnId, originalText: content });
      preparedGatewaySnapshot = preparedGateway;
      const preparedInput: PreparedGatewayUserInput = {
        originalText: content,
        workingText: preparedGateway.turn.frenchWorkingText ?? content,
        turnId,
        createdAt: now,
        multilingualTurn: preparedGateway.turn,
        gatewayState: preparedGateway.state,
      };
      if (await applyScientificThinkingInput(preparedInput)) return;
      if (await applyStudyDesignInput(preparedInput)) return;
      if (await applyObservabilityInput(preparedInput)) return;
      if (await applyImagingInput(preparedInput)) return;
      if (await applyBiostatisticsInput(preparedInput)) return;
      const productDocumentAction = recognizeProductDocumentAction(preparedInput.workingText);
      if (productDocumentAction) {
        setSession((current) => ({ ...current, conversationLanguageGateway: preparedGateway.state }));
        dispatchProductDocumentAction(productDocumentAction, { content, createdAt: now });
        return;
      }
      const userTurn: ScientificInterpretationTurn = { turnId, role: "USER", content, createdAt: now };
      const runtimeTurns = [...session.runtimeTurns, userTurn];
      const boundedReferentContext = buildBoundedConversationReferentContext({
        retained: session.retainedContributionCandidates ?? [], currentProject: session.project,
        conversationId: session.conversationId, runtimeTurns,
      });
      const boundedInteraction = selectBoundedConversationInteraction({
        sourceText: preparedInput.workingText, correctionMode, referentContext: boundedReferentContext,
      });
      const asksForExplanationOrRephrase = isFunctionalResetQueryMisunderstanding(preparedInput.workingText);
      const previousContext = [...session.bridgeTraces]
        .reverse()
        .find((trace) => trace.entryRouting)?.entryRouting?.scientificContext;
      const entryRouting = routeProductEntry({
        raw: preparedInput.workingText,
        sourceTurnRef: userTurn.turnId,
        routedAt: now,
        previousContext,
        forceUnderstand: asksForExplanationOrRephrase,
      });
      let entryTraceLedger = recordConversationLanguageGatewayTrace({
        ledger: session.scientificExecutionTraceLedger,
        traceRunId,
        conversationId: session.conversationId,
        turn: preparedGateway.turn,
        observedAt: now,
        captureConfiguration: traceCaptureConfiguration,
      });
      entryTraceLedger = recordProductEntryRoutingTrace({
        ledger: entryTraceLedger,
        traceRunId,
        conversationId: session.conversationId,
        routing: entryRouting,
        routerInputRef: preparedGateway.turn.provenance.projectionRef ?? userTurn.turnId,
        routerInputDigest: preparedGateway.turn.frenchWorkingTextDigest ?? preparedGateway.turn.originalTextDigest,
        observedAt: now,
      });
      const qryNeedBefore = session.queryNavigation?.currentAction?.navigationNeedRefs[0] ?? null;
      // UNDERSTAND is transversal: a pending QRY remains byte-for-byte available,
      // but it neither captures nor mutates the explanatory turn.
      let queryNavigation = session.queryNavigation;
      const withUser: FunctionalResetSession = {
        ...session,
        queryNavigation,
        runtimeTurns,
        conversationLanguageGateway: preparedGateway.state,
        scientificExecutionTraceLedger: entryTraceLedger,
        entries: [
          ...session.entries,
          { entryId: createConversationEntryId(), kind: "TEXT", role: "USER", content, createdAt: now },
        ],
        updatedAt: now,
      };
      setSession(withUser);
      const emptyTraceMaterial = {
        turnId: userTurn.turnId,
        requestKind: "USER_TURN" as const,
        raw: captureProductBridgeTraceText({ value: content, field: "SOURCE_TEXT" }),
        persistentExtractionCalled: false,
        persistentExtractionStatus: "NOT_REQUESTED" as const,
        providerArtifact: null,
        wireCandidate: null,
        persistentCandidate: null,
        deterministicValidation: null,
        projectChangeSetCandidate: null,
        canonicalProjectChangeSetCandidate: null,
        humanReviewProjection: null,
        humanDecision: null,
        projectVersionBefore: session.project?.versionId ?? null,
        projectVersionAfter: session.project?.versionId ?? null,
        qryNeedBefore,
        qryNeedAfter: queryNavigation?.currentAction?.navigationNeedRefs[0] ?? null,
        extractionLatencyMs: null,
        entryRouting,
        projectWriteCount: 0,
        protocolProjectionCount: 0,
        multilingualUserTurn: preparedGateway.turn,
      };

      if (entryRouting.domainGate !== "IN_SCOPE") {
        const rejectedAt = new Date().toISOString();
        const assistantReply = "Cette entrée ne peut pas être transmise à un owner scientifique. Reformulez-la comme une question scientifique générale, sans donnée personnelle ni identifiante. Aucun projet ni protocole n’a été créé.";
        const localized = await localizeCanonicalFrenchResponse({
          state: preparedGateway.state,
          sourceTurnRef: userTurn.turnId,
          responseId: `conversation-response:${userTurn.turnId}`,
          canonicalFrenchResponse: assistantReply,
        });
        const assistantTurn: ScientificInterpretationTurn = {
          turnId: createTurnId(),
          role: "NOXIA",
          content: assistantReply,
          createdAt: rejectedAt,
        };
        const scientificExecutionTraceLedger = recordLocalizedConversationResponseTrace({
          ledger: entryTraceLedger,
          traceRunId,
          conversationId: session.conversationId,
          response: localized.response,
          observedAt: rejectedAt,
        });
        setSession((current) => ({
          ...current,
          queryNavigation,
          runtimeTurns: [...runtimeTurns, assistantTurn],
          entries: [...current.entries, {
            entryId: createConversationEntryId(),
            kind: "ERROR",
            role: "NOXIA",
            content: localized.response.localizedResponse,
            createdAt: rejectedAt,
          }],
          bridgeTraces: [...current.bridgeTraces, {
            ...emptyTraceMaterial,
            assistantReply: captureProductBridgeTraceText({ value: localized.response.localizedResponse, field: "ASSISTANT_REPLY" }),
            provider: "DOMAIN_GATE",
            model: "DETERMINISTIC_LOCAL",
            conversationLatencyMs: 0,
            calls: preparedGateway.providerCalls + localized.providerCalls,
            languageGatewayCalls: preparedGateway.providerCalls + localized.providerCalls,
            knowledgeResultRef: null,
            knowledgeResultDigest: null,
          }].slice(-20),
          conversationLanguageGateway: localized.state,
          scientificExecutionTraceLedger,
          updatedAt: rejectedAt,
        }));
        return;
      }

      if (entryRouting.routeIntent === "UNDERSTAND" && !entryRouting.projectConstructionEligible && !boundedInteraction) {
        const knowledge = executeProductUnderstandInteraction({ raw: preparedInput.workingText, decision: entryRouting, createdAt: now });
        const answeredAt = new Date().toISOString();
        const localized = await localizeCanonicalFrenchResponse({
          state: preparedGateway.state,
          sourceTurnRef: userTurn.turnId,
          responseId: `conversation-response:${userTurn.turnId}`,
          canonicalFrenchResponse: knowledge.assistantReply,
        });
        const assistantTurn: ScientificInterpretationTurn = {
          turnId: createTurnId(),
          role: "NOXIA",
          content: knowledge.assistantReply,
          createdAt: answeredAt,
        };
        const scientificExecutionTraceLedger = recordLocalizedConversationResponseTrace({
          ledger: entryTraceLedger,
          traceRunId,
          conversationId: session.conversationId,
          response: localized.response,
          observedAt: answeredAt,
        });
        setSession((current) => ({
          ...current,
          queryNavigation,
          runtimeTurns: [...runtimeTurns, assistantTurn],
          entries: [...current.entries, {
            entryId: createConversationEntryId(),
            kind: knowledge.status === "FAILURE" ? "ERROR" : "TEXT",
            role: "NOXIA",
            content: localized.response.localizedResponse,
            knowledgePresentation: knowledge.presentation,
            createdAt: answeredAt,
          }],
          bridgeTraces: [...current.bridgeTraces, {
            ...emptyTraceMaterial,
            assistantReply: captureProductBridgeTraceText({ value: localized.response.localizedResponse, field: "ASSISTANT_REPLY" }),
            provider: "KNOWLEDGE",
            model: "KE-001@1.2.1",
            conversationLatencyMs: 0,
            calls: preparedGateway.providerCalls + localized.providerCalls,
            languageGatewayCalls: preparedGateway.providerCalls + localized.providerCalls,
            knowledgeResultRef: knowledge.knowledgeResultRef,
            knowledgeResultDigest: knowledge.knowledgeResultDigest,
          }].slice(-20),
          conversationLanguageGateway: localized.state,
          scientificExecutionTraceLedger,
          updatedAt: answeredAt,
        }));
        return;
      }

      const preProjectNavigation = session.project
        ? undefined
        : buildPreProjectNavigationDecision({ routing: entryRouting });
      const bridgeRequest: Omit<ProductBridgeRequest, "apiVersion"> = {
        requestKind: "USER_TURN",
        conversation: {
          conversationId: session.conversationId,
          language: "fr",
          turns: runtimeTurns,
          ...(queryNavigation?.currentAction && queryNavigation.currentPresentation ? {
            interactionContext: {
              interactionRef: queryNavigation.currentPresentation.presentationId,
              sourceActionRef: queryNavigation.currentAction.selectedActionId,
              owner: "QUERY_NAVIGATION",
              purpose: [
                queryNavigation.currentPresentation.intent,
                queryNavigation.standardQuestion
                  ? `Question actuellement présentée au chercheur : ${queryNavigation.standardQuestion.text}`
                  : null,
              ].filter((value): value is string => Boolean(value)).join("\n"),
              expectedResponseKind: "QRY_INFORMATION_RESPONSE" as const,
              targetRefs: [queryNavigation.currentAction.targetRef],
              informationNeedRefs: [...queryNavigation.currentAction.navigationNeedRefs],
              projectRef: queryNavigation.projectRef,
              projectVersion: queryNavigation.projectVersion,
              projectDigest: queryNavigation.projectDigest,
            },
          } : {}),
        },
        currentProject: session.project,
        ...(session.project ? { currentNavigation: currentGovernedNavigationInput({
          project: session.project, navigation: queryNavigation, ownerResultLedger: session.knowledgeOwnerLedger,
        }) } : {}),
        ...(preProjectNavigation ? { preProjectNavigation } : {}),
        boundedReferentContext,
        ...(boundedInteraction ? { boundedInteraction } : {}),
        languageBoundary: languageBoundaryFor(preparedGateway.state),
        // Routing governs Project eligibility. Conversation-only turns remain
        // usable, but cannot trigger persistent extraction.
        evaluatePersistentDelta: entryRouting.projectConstructionEligible && !asksForExplanationOrRephrase,
      };
      const response = await requestProtocolDesignerBridge(bridgeRequest);
      const receivedAt = new Date().toISOString();
      const extractedContribution = entryRouting.projectConstructionEligible
        ? response.persistentExtraction.contribution
        : null;
      // An independent new candidate does not supersede/merge an older one by
      // recency. Both identities remain retained; this turn presents its receipt.
      const contribution = extractedContribution;
      const candidate = contribution ? prepareResearchProjectContributionCandidate(contribution, session.project) : null;
      const effectiveCandidate = candidate?.status === "CANDIDATE_PENDING_HUMAN_CONFIRMATION" ? candidate : null;
      const scientificThinkingIntervention = !session.project && effectiveCandidate && contribution
        ? buildPreProjectScientificThinkingIntervention({
          contribution,
          sessionId: session.sessionId,
          sourceJourney: entryRouting.routeIntent === "DOCUMENT" ? "FORMALIZE_IDEA" : entryRouting.routeIntent,
        })
        : null;
      const enrichedPreProjectNavigation = preProjectNavigation && scientificThinkingIntervention?.navigationContribution
        ? buildPreProjectNavigationDecision({
          routing: entryRouting,
          scientificContribution: scientificThinkingIntervention.navigationContribution,
        })
        : null;
      const selectedPreProjectNavigation = enrichedPreProjectNavigation ?? (preProjectNavigation && response.currentTurnNavigation ? {
        ...preProjectNavigation,
        action: response.currentTurnNavigation.envelope.action,
        selection: response.currentTurnNavigation.selection,
        selectedInformationNeedRef: response.currentTurnNavigation.envelope.selectedInformationNeedRef,
        selectedInformationNeed: response.currentTurnNavigation.envelope.action === "ASK_QUESTION" ? response.currentTurnNavigation.envelope.purpose : null,
        scientificReason: response.currentTurnNavigation.envelope.purpose,
        realizationDirective: response.currentTurnNavigation.envelope.purpose,
        alreadyProvidedInformationRefs: response.currentTurnNavigation.envelope.alreadyProvidedInformationRefs,
      } : preProjectNavigation);
      const realizedBridgeRequest = {
        ...bridgeRequest,
        ...(selectedPreProjectNavigation ? { preProjectNavigation: selectedPreProjectNavigation } : {}),
        ...(!enrichedPreProjectNavigation && response.currentTurnNavigation ? { governedRealization: response.currentTurnNavigation.envelope } : {}),
      };
      const providerContext = naturalConversationContext(realizedBridgeRequest);
      if (effectiveCandidate && contribution) {
        const retained = retainValidatedContributionCandidate({
          retained: [], contribution, candidate: effectiveCandidate,
          validation: response.persistentExtraction.validation,
          validatorRef: "PERSISTENT_PROJECT_DELTA_AND_PRJ_CONTRIBUTION_V1",
          sourceTurnRef: userTurn.turnId, baseProject: session.project,
          dependencyBindings: [], traceRunId, retainedAt: receivedAt,
        });
        retainedThisTurn = retained[0] ?? null;
        if (retainedThisTurn) {
          const record = retainedThisTurn;
          entryTraceLedger = recordRetainedContributionValidation({
            ledger: entryTraceLedger, traceRunId, conversationId: session.conversationId,
            retainedCandidate: record,
            extractionExecution: productTraceExtractionExecution({
              contribution, providerArtifact: response.persistentExtraction.providerArtifact,
              observedProvider: response.observability.extractionProvider,
              observedModelRequested: response.observability.extractionModelRequested,
              observedModelReturned: response.observability.extractionModelReturned,
            }),
            extractionLatencyMs: response.observability.extractionLatencyMs,
            extractedAt: response.stageTimestamps?.extractionCompletedAt,
            validatedAt: response.stageTimestamps?.extractionCompletedAt,
          });
          setSession((current) => ({ ...current,
            scientificExecutionTraceLedger: entryTraceLedger,
            retainedContributionCandidates: retainValidatedContributionCandidate({
              retained: current.retainedContributionCandidates ?? [],
              contribution: record.contribution, candidate: record.candidate, validation: record.validation,
              validatorRef: record.validatorRef, sourceTurnRef: record.sourceTurnRef,
              baseProject: record.baseProject, dependencyBindings: record.dependencyBindings,
              traceRunId: record.traceRunId, retainedAt: record.retainedAt,
            }),
          }));
        }
      }
      if (session.project && retainedThisTurn) {
        const impact = buildCurrentProjectImpactProjection({
          project: session.project,
          candidate: retainedThisTurn.candidate,
          candidateDigest: retainedThisTurn.candidateDigest,
          sourceTurnRef: retainedThisTurn.sourceTurnRef,
        });
        if (impact) {
          currentProjectImpactProjection = impact;
          const evidence = buildCurrentNavigationEvidence({
            sourceTurnRef: userTurn.turnId,
            sourceText: content,
            currentProject: session.project,
            validatedCandidate: retainedThisTurn,
            currentProjectImpact: impact,
          });
          queryNavigation = buildFunctionalResetQueryNavigation({
            project: session.project,
            previous: session.queryNavigation,
            recordedAt: receivedAt,
            currentNavigationEvidence: evidence,
            forceRebuild: true,
          });
          contextualActionPresentation = buildStandardConversationActionGroup({ impact, navigation: queryNavigation });
        }
      }
      if (!enrichedPreProjectNavigation && (response.currentTurnNavigation || response.conversationFailure)) {
        const nativeTrace = recordGovernedConversationTrace({
          ledger: entryTraceLedger, traceRunId, conversationId: session.conversationId,
          sourceDigest: logicalDigest(content), observedAt: receivedAt,
          response, retainedCandidate: retainedThisTurn, providerContext,
          systemInstruction: GOVERNED_REALIZATION_SYSTEM_INSTRUCTION,
        });
        entryTraceLedger = nativeTrace.ledger;
        governedRealizationOutcome = nativeTrace.realizationOutcome;
        setSession((current) => ({ ...current, scientificExecutionTraceLedger: entryTraceLedger }));
      }
      const validatedCandidateDegradedPath = Boolean(
        response.conversationFailure
        && retainedThisTurn
        && effectiveCandidate
        && contribution
        && ["HOW", "CONFORMANCE"].includes(response.conversationFailure.stage),
      );
      if (response.conversationFailure && !validatedCandidateDegradedPath) {
        downstreamStage = response.conversationFailure.stage;
        throw new ProductBridgeClientError(response.conversationFailure.code, response.conversationFailure.message);
      }
      const structuredUnderstanding = visibleStructuredUnderstandingEvidence({
        contribution: effectiveCandidate ? contribution : null,
        sourceTurnRef: userTurn.turnId,
        explicitDimensions: entryRouting.explicitScientificDimensions,
      });
      const preProjectRealization = !enrichedPreProjectNavigation && response.governedRealization ? {
        ...response.governedRealization,
        provider: response.governedRealization.providerReplyAccepted ? response.observability.provider : "NONE",
        model: response.governedRealization.providerReplyAccepted ? response.observability.model : "LOCAL_WHAT_REALIZATION",
        conformanceReason: response.governedRealization.conformance.diagnostics.join("|") || "STRUCTURED_CLAIMS_CONFORM_VISIBLE_FIDELITY_NOT_ADJUDICATED",
        representedDimensionRefs: response.governedRealization.conformance.representedContentRefs,
        missingDimensionRefs: response.governedRealization.conformance.missingRequiredContentRefs,
      } : selectedPreProjectNavigation
        ? realizePreProjectNavigationDecision({
          decision: selectedPreProjectNavigation,
          providerReply: response.observability.conversationCalls === 1
            && response.observability.conversationResponseReceived
            ? response.assistantReply
            : null,
          provider: response.observability.provider,
          model: response.observability.model,
          structuredUnderstanding,
        })
        : null;
      const canonicalAssistantReply = validatedCandidateDegradedPath
        ? VALIDATED_CANDIDATE_DEGRADED_REPLY
        : preProjectRealization?.assistantReply ?? response.assistantReply;
      const canonicalAssistantTurn = { ...response.assistantTurn, content: canonicalAssistantReply };
      downstreamStage = "LOCALIZATION";
      const localized = await localizeCanonicalFrenchResponse({
        state: preparedGateway.state,
        sourceTurnRef: userTurn.turnId,
        responseId: `conversation-response:${userTurn.turnId}`,
        canonicalFrenchResponse: canonicalAssistantReply,
      });
      const visibleAssistantReply = localized.response.localizedResponse;
      downstreamStage = "PRESENTATION";
      const preProjectTrace = response.currentTurnNavigation && !enrichedPreProjectNavigation ? null : createPreProjectScientificTraceSegment({
        sessionId: session.sessionId,
        sourceTurnRef: userTurn.turnId,
        traceRunId,
        sourceText: content,
        routing: entryRouting,
        request: realizedBridgeRequest,
        providerBoundary: {
          systemInstruction: NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
          context: providerContext,
          assistantReply: canonicalAssistantReply,
          provider: preProjectRealization?.provider ?? response.observability.provider,
          model: preProjectRealization?.model ?? response.observability.model,
          formulationOwner: preProjectRealization?.executor === "LOCAL_DETERMINISTIC_REALIZATION"
            ? "LOCAL_RUNTIME"
            : undefined,
          visibleStructuredUnderstandingDimensionRefs: structuredUnderstanding?.representedDimensionRefs,
          ...(preProjectRealization ? {
            realizationOutcome: buildPreProjectTraceRealizationOutcome({
              attemptedProvider: response.observability.provider,
              providerReply: response.assistantReply,
              realization: preProjectRealization,
            }),
          } : {}),
        },
        captureConfiguration: traceCaptureConfiguration,
      });
      const effectiveExtractionStatus = entryRouting.projectConstructionEligible
        ? response.persistentExtraction.status
        : "NOT_REQUESTED" as const;
      const failureMessage = persistenceFailureMessage(effectiveExtractionStatus, candidate?.status ?? null);
      setSession((current) => {
        let scientificExecutionTraceLedger = recordInitialProductTrace({
          ledger: entryTraceLedger,
          traceRunId,
          conversationId: current.conversationId,
          segment: preProjectTrace,
          observedAt: receivedAt,
          contribution,
          candidate,
          reviewCandidate: retainedThisTurn ? null : effectiveCandidate,
          retainedCandidate: retainedThisTurn,
          extractionStatus: effectiveExtractionStatus,
          extractionLatencyMs: response.observability.extractionLatencyMs,
          extractionExecution: productTraceExtractionExecution({
            contribution,
            providerArtifact: response.persistentExtraction.providerArtifact,
            observedProvider: response.observability.extractionProvider,
            observedModelRequested: response.observability.extractionModelRequested,
            observedModelReturned: response.observability.extractionModelReturned,
          }),
        });
        if (session.project && currentProjectImpactProjection && contextualActionPresentation) {
          scientificExecutionTraceLedger = recordCurrentProjectImpactNavigationTrace({
            ledger: scientificExecutionTraceLedger,
            traceRunId,
            conversationId: current.conversationId,
            observedAt: receivedAt,
            project: session.project,
            impact: currentProjectImpactProjection,
            queryNavigation,
            presentation: contextualActionPresentation,
          });
        }
        scientificExecutionTraceLedger = recordLocalizedConversationResponseTrace({
          ledger: scientificExecutionTraceLedger,
          traceRunId,
          conversationId: current.conversationId,
          response: localized.response,
          observedAt: receivedAt,
        });
        return {
        ...current,
        queryNavigation,
        runtimeTurns: [...runtimeTurns, canonicalAssistantTurn],
        pendingContribution: effectiveCandidate && contribution ? contribution : current.pendingContribution,
        retainedContributionCandidates: current.retainedContributionCandidates,
        entries: [
          ...current.entries,
          { entryId: createConversationEntryId(), kind: "TEXT", role: "NOXIA", content: visibleAssistantReply, createdAt: receivedAt },
          ...(contextualActionPresentation ? [{
            entryId: createConversationEntryId(),
            kind: "FOLLOW_UP_ACTIONS" as const,
            role: "NOXIA" as const,
            presentation: contextualActionPresentation,
            response: null,
            createdAt: receivedAt,
          }] : []),
          ...(effectiveCandidate && contribution ? [{
            entryId: createConversationEntryId(),
            kind: "REVIEW" as const,
            role: "NOXIA" as const,
            contribution,
            candidate: effectiveCandidate,
            traceRunId,
            status: "PENDING" as const,
            decision: null,
            createdAt: receivedAt,
          }] : []),
          ...(failureMessage ? [{
            entryId: createConversationEntryId(),
            kind: "ERROR" as const,
            role: "NOXIA" as const,
            content: failureMessage,
            createdAt: receivedAt,
          }] : []),
        ],
        bridgeTraces: [...current.bridgeTraces, {
          turnId: userTurn.turnId,
          traceRunId,
          requestKind: "USER_TURN" as const,
          raw: captureProductBridgeTraceText({ value: content, field: "SOURCE_TEXT" }),
          assistantReply: captureProductBridgeTraceText({ value: visibleAssistantReply, field: "ASSISTANT_REPLY" }),
          persistentExtractionCalled: entryRouting.projectConstructionEligible && response.persistentExtraction.called,
          persistentExtractionStatus: effectiveExtractionStatus,
          persistentExtractionFailure: entryRouting.projectConstructionEligible ? response.persistentExtraction.failure ?? null : null,
          persistentExtractionRecovery: entryRouting.projectConstructionEligible ? response.persistentExtraction.recovery ?? null : null,
          providerArtifact: entryRouting.projectConstructionEligible ? response.persistentExtraction.providerArtifact : null,
          wireCandidate: entryRouting.projectConstructionEligible ? response.persistentExtraction.wireCandidate : null,
          persistentCandidate: entryRouting.projectConstructionEligible ? response.persistentExtraction.candidate : null,
          deterministicValidation: entryRouting.projectConstructionEligible ? response.persistentExtraction.validation : null,
          projectChangeSetCandidate: candidate?.changeSet ?? null,
          canonicalProjectChangeSetCandidate: candidate?.canonicalChangeSet ?? null,
          humanReviewProjection: candidate?.humanReviewProjection ?? null,
          humanDecision: null,
          projectVersionBefore: session.project?.versionId ?? null,
          projectVersionAfter: session.project?.versionId ?? null,
          qryNeedBefore,
          qryNeedAfter: queryNavigation?.currentAction?.navigationNeedRefs[0] ?? null,
          provider: preProjectRealization?.provider ?? response.observability.provider,
          model: preProjectRealization?.model ?? response.observability.model,
          conversationLatencyMs: response.observability.conversationLatencyMs,
          extractionLatencyMs: response.observability.extractionLatencyMs,
          calls: response.observability.calls + preparedGateway.providerCalls + localized.providerCalls,
          languageGatewayCalls: preparedGateway.providerCalls + localized.providerCalls,
          extractionAttempts: response.observability.extractionAttempts,
          entryRouting,
          preProjectTrace,
          multilingualUserTurn: preparedGateway.turn,
          knowledgeResultRef: null,
          knowledgeResultDigest: null,
          projectWriteCount: response.observability.projectWrites,
          protocolProjectionCount: 0,
        }].slice(-20),
        conversationLanguageGateway: localized.state,
        scientificExecutionTraceLedger,
        updatedAt: receivedAt,
      };
      });
    } catch (error) {
      const failedAt = new Date().toISOString();
      const failureCode = productBridgeClientErrorCode(error) ?? "PRODUCT_BRIDGE_REQUEST_FAILED";
      const failedProjectionRequest = languageProjectionRequestFromError(error);
      const failedProjectionDiagnostic = languageProjectionDiagnosticFromError(error);
      const languageGatewayFailed = failedProjectionRequest !== null || failureCode.includes("LANGUAGE_PROJECTION");
      const message = languageGatewayFailed
        ? "La projection linguistique nécessaire n’a pas abouti. Votre message original est conservé et n’a pas été transmis au routeur scientifique. Vous pouvez réessayer."
        : error instanceof Error ? error.message : "L’interprétation scientifique est momentanément indisponible.";
      setSession((current) => {
        const missingUserTurn = !current.runtimeTurns.some((turn) => turn.turnId === turnId);
        const detection = detectConversationLanguage(content);
        const projectionKind = failedProjectionRequest?.projectionKind
          ?? (preparedGatewaySnapshot ? "OUTPUT_FROM_FRENCH" as const : "INPUT_TO_FRENCH" as const);
        const projectionSourceText = failedProjectionRequest?.sourceText ?? content;
        const failure = languageGatewayFailed ? languageProjectionFailure({
          projectionKind,
          sourceText: projectionSourceText,
          sourceLanguage: failedProjectionRequest?.sourceLanguageHint
            ?? (projectionKind === "OUTPUT_FROM_FRENCH" ? "fr" : detection.detectedLanguage ?? "UNKNOWN"),
          targetLanguage: failedProjectionRequest?.targetLanguage
            ?? (projectionKind === "OUTPUT_FROM_FRENCH"
              ? preparedGatewaySnapshot?.state.conversationLanguage ?? "fr"
              : "fr"),
          provider: "OPENAI",
          model: DEFAULT_OPENAI_LANGUAGE_GATEWAY_MODEL,
          reasoningEffort: DEFAULT_OPENAI_LANGUAGE_GATEWAY_REASONING_EFFORT,
          failureCategory: failureCode,
          occurredAt: failedAt,
        }) : null;
        const conversationLanguageGateway = failure
          ? appendLanguageProjectionFailure({
            state: preparedGatewaySnapshot?.state ?? current.conversationLanguageGateway,
            failure,
          })
          : preparedGatewaySnapshot?.state ?? current.conversationLanguageGateway;
        let scientificExecutionTraceLedger = current.scientificExecutionTraceLedger;
        if (failure) {
          scientificExecutionTraceLedger = recordConversationLanguageGatewayFailureTrace({
            ledger: scientificExecutionTraceLedger,
            traceRunId,
            conversationId: current.conversationId,
            turnId,
            originalTextDigest: preparedGatewaySnapshot?.turn.originalTextDigest ?? failure.sourceTextDigest,
            projectionSourceTextDigest: failure.sourceTextDigest,
            detection,
            projectionKind,
            targetLanguage: failure.targetLanguage,
            provider: failure.provider,
            model: failure.model,
            reasoningEffort: failure.reasoningEffort,
            contextScopeId: failure.contextScopeId,
            failureCode,
            conformanceDiagnostic: failedProjectionDiagnostic,
            observedAt: failedAt,
            captureConfiguration: traceCaptureConfiguration,
          });
        }
        scientificExecutionTraceLedger = recordProductErrorBoundary({
          ledger: scientificExecutionTraceLedger,
          traceRunId,
          turnId,
          conversationId: current.conversationId,
          startedAt: now,
          failedAt,
          owner: languageGatewayFailed ? "LANGUAGE_GATEWAY" : "TRACE",
          responsibilityOwner: languageGatewayFailed ? "LANGUAGE_GATEWAY" : "PRODUCT_BRIDGE",
          executor: languageGatewayFailed ? "OPENAI_LANGUAGE_PROJECTION" : "PRODUCT_BRIDGE_CLIENT",
          componentId: languageGatewayFailed ? "CONVERSATION_LANGUAGE_GATEWAY" : "PRODUCT_BRIDGE_CLIENT",
          componentVersion: "UNKNOWN",
          provider: languageGatewayFailed ? "OPENAI" : "UNKNOWN",
          code: failureCode,
          category: languageGatewayFailed ? "BOUNDARY_REJECTION" : "UNKNOWN",
          sourceDigest: failure?.sourceTextDigest ?? "UNKNOWN",
          retainedCandidate: retainedThisTurn,
          realizationOutcome: governedRealizationOutcome,
        });
        return {
        ...current,
        runtimeTurns: missingUserTurn
          ? [...current.runtimeTurns, { turnId, role: "USER", content, createdAt: now }]
          : current.runtimeTurns,
        entries: [
          ...current.entries,
          ...(missingUserTurn ? [{ entryId: createConversationEntryId(), kind: "TEXT" as const, role: "USER" as const, content, createdAt: now }] : []),
          { entryId: createConversationEntryId(), kind: "ERROR", role: "NOXIA", content: message, createdAt: failedAt },
        ],
        conversationLanguageGateway,
        retainedContributionCandidates: retainedThisTurn ? recordContributionDownstreamFailure({
          retained: current.retainedContributionCandidates ?? [],
          candidateRef: retainedThisTurn.candidateRef, stage: downstreamStage,
          code: failureCode, occurredAt: failedAt,
        }) : current.retainedContributionCandidates,
        scientificExecutionTraceLedger,
        updatedAt: failedAt,
      };
      });
    } finally {
      setBusy(false);
    }
  };

  const acknowledgeContributionReviewPresented = (entryId: string) => {
    const presentedAt = new Date().toISOString();
    setSession((current) => {
      const entry = current.entries.find((item) => item.entryId === entryId && item.kind === "REVIEW");
      if (!entry || entry.kind !== "REVIEW" || entry.status !== "PENDING") return current;
      const record = current.retainedContributionCandidates?.find((candidate) =>
        candidate.candidateRef === entry.contribution.identity.contributionId
        && candidate.contribution.identity.contributionDigest === entry.contribution.identity.contributionDigest);
      // Legacy reviews without a retained record keep their existing path.
      if (!record || record.downstreamState !== "PENDING_DOWNSTREAM"
        || record.actuality !== "CURRENT" || record.humanDecision || record.presentedAt) return current;
      return {
        ...current,
        retainedContributionCandidates: markContributionCandidatePresented({
          retained: current.retainedContributionCandidates ?? [],
          candidateRef: record.candidateRef,
          presentedAt,
        }),
        scientificExecutionTraceLedger: recordContributionReviewPresentedTrace({
          ledger: current.scientificExecutionTraceLedger,
          traceRunId: record.traceRunId,
          conversationId: current.conversationId,
          candidate: record.candidate,
          presentedAt,
        }),
        updatedAt: presentedAt,
      };
    });
  };

  const recordContributionReviewPresentationFailure = (
    entryId: string,
    failure: ContributionReviewPresentationFailure,
  ) => {
    const failedAt = new Date().toISOString();
    setSession((current) => {
      const entry = current.entries.find((item) => item.entryId === entryId && item.kind === "REVIEW");
      if (!entry || entry.kind !== "REVIEW") return current;
      const errorEntryId = `${entryId}:presentation-failure`;
      if (current.entries.some((item) => item.entryId === errorEntryId)) return current;
      const record = current.retainedContributionCandidates?.find((candidate) =>
        candidate.candidateRef === entry.contribution.identity.contributionId
        && candidate.contribution.identity.contributionDigest === entry.contribution.identity.contributionDigest);
      const retainedContributionCandidates = record ? recordContributionDownstreamFailure({
        retained: current.retainedContributionCandidates ?? [],
        candidateRef: record.candidateRef,
        stage: failure.stage,
        code: failure.code,
        occurredAt: failedAt,
      }) : current.retainedContributionCandidates;
      const traceRunId = record?.traceRunId ?? entry.traceRunId;
      return {
        ...current,
        // Keep the review and all candidate payload/history unchanged. Clear only
        // this failed actionable selection; never select an older candidate by recency.
        pendingContribution: current.pendingContribution?.identity.contributionId === entry.contribution.identity.contributionId
          ? null : current.pendingContribution,
        retainedContributionCandidates,
        entries: [...current.entries, {
          entryId: errorEntryId,
          kind: "ERROR" as const,
          role: "NOXIA" as const,
          content: "La présentation de cette proposition n’a pas abouti. La proposition est conservée sans être adoptée.",
          createdAt: failedAt,
        }],
        scientificExecutionTraceLedger: traceRunId ? recordProductErrorBoundary({
          ledger: current.scientificExecutionTraceLedger,
          traceRunId,
          turnId: record?.sourceTurnRef ?? entry.contribution.source.turns.at(-1)?.turnId ?? entry.entryId,
          conversationId: current.conversationId,
          startedAt: entry.createdAt,
          failedAt,
          owner: "UI",
          responsibilityOwner: "PROTOCOL_DESIGNER_UI",
          executor: "CONTRIBUTION_REVIEW",
          componentId: "CONTRIBUTION_REVIEW",
          componentVersion: "1.0.0",
          provider: "NONE",
          code: failure.code,
          category: "OWNER_RUNTIME",
          sourceDigest: record?.sourceDigest,
          retainedCandidate: record,
        }) : current.scientificExecutionTraceLedger,
        updatedAt: failedAt,
      };
    });
  };

  const contributionHasAcknowledgedPresentation = (contributionId: string) => {
    const record = session.retainedContributionCandidates?.find((candidate) => candidate.candidateRef === contributionId);
    // This bounded guard does not change older review flows without a lifecycle receipt.
    return !record || (record.downstreamState === "PRESENTED" && record.presentedAt !== null
      && record.actuality === "CURRENT" && record.humanDecision === null);
  };

  const confirmContribution = async (contributionId: string) => {
    if (confirmationInFlightRef.current === contributionId) return;
    const contribution = session.pendingContribution;
    if (!contribution || contribution.identity.contributionId !== contributionId) return;
    if (!contributionHasAcknowledgedPresentation(contributionId)) return;
    const now = new Date().toISOString();
    confirmationInFlightRef.current = contributionId;
    setBusyMessage("Je prépare la prochaine décision utile…");
    setBusy(true);
    let continuationScheduled = false;
    try {
      const reviewEntry = session.entries.find((entry) => entry.kind === "REVIEW" && entry.contribution.identity.contributionId === contributionId);
      const project = confirmResearchProjectContribution({
        contribution,
        current: session.project,
        projectId: session.projectId,
        authority: session.projectAuthority,
        confirmedAt: now,
        reviewedProjection: reviewEntry?.kind === "REVIEW"
          ? (reviewEntry.candidate ?? prepareResearchProjectContributionCandidate(reviewEntry.contribution, session.project)).humanReviewProjection
          : undefined,
      });
      let documents;
      let documentWarning = false;
      try {
        documents = refreshFunctionalResetDocumentPortfolio({
          project,
          previous: session.documents,
          requestedAt: now,
        });
      } catch (error) {
        documents = markFunctionalResetDocumentFailure(project, session.documents, error);
        documentWarning = true;
      }
      const queryNavigation = attachCurrentKnowledgePrerequisiteWhenRequired({ project, navigation: buildFunctionalResetQueryNavigation({
        project,
        previous: session.queryNavigation,
        documentBlockers: documentBlockerSignals(documents),
        recordedAt: now,
        dataOwnerState: deriveFunctionalResetDataOwnerState({ project, ledger: session.knowledgeOwnerLedger }),
      }) });
      const feedback = session.project ? "Projet mis à jour." : "Projet créé.";
      const confirmationTurn: ScientificInterpretationTurn = {
        turnId: createTurnId(),
        role: "NOXIA",
        content: feedback,
        createdAt: now,
      };
      const runtimeTurns = [...session.runtimeTurns, confirmationTurn];
      const correlatedTraceRunId = reviewEntry?.kind === "REVIEW" && reviewEntry.traceRunId
        ? reviewEntry.traceRunId
        : session.bridgeTraces.find((trace) => trace.projectChangeSetCandidate?.sourceContributionRef === contributionId)?.traceRunId;
      const scientificExecutionTraceLedger = recordProjectAdoptionTrace({
        ledger: session.scientificExecutionTraceLedger,
        traceRunId: correlatedTraceRunId,
        conversationId: session.conversationId,
        recordedAt: now,
        contribution,
        project,
        previousProjectExisted: Boolean(session.project),
        queryNavigation,
        documents,
      });
      setSession((current) => ({
        ...current,
        project,
        queryNavigation,
        studyDesignInteraction: current.studyDesignInteraction?.pendingContributionRef === contributionId
          ? {
            ...current.studyDesignInteraction,
            status: "ADOPTED",
            adoptedProjectVersion: project.versionId,
            staleReason: null,
          }
          : current.studyDesignInteraction && !interactionMatchesCurrentProject(current.studyDesignInteraction, project)
            ? { ...current.studyDesignInteraction, status: "STALE", staleReason: "SOURCE_PROJECT_VERSION_CHANGED" }
            : current.studyDesignInteraction,
        scientificThinkingInteraction: current.scientificThinkingInteraction?.pendingContributionRef === contributionId
          ? {
            ...current.scientificThinkingInteraction,
            status: "ADOPTED",
            adoptedProjectVersion: project.versionId,
            staleReason: null,
          }
          : current.scientificThinkingInteraction && !scientificThinkingInteractionMatchesCurrentProject(current.scientificThinkingInteraction, project)
            ? { ...current.scientificThinkingInteraction, status: "STALE", staleReason: "SOURCE_PROJECT_VERSION_CHANGED" }
            : current.scientificThinkingInteraction,
        observabilityInteraction: current.observabilityInteraction?.pendingContributionRef === contributionId
          ? {
            ...current.observabilityInteraction,
            status: "ADOPTED",
            adoptedProjectVersion: project.versionId,
            staleReason: null,
          }
          : current.observabilityInteraction && !observabilityInteractionMatchesCurrentProject(current.observabilityInteraction, project)
            ? { ...current.observabilityInteraction, status: "STALE", staleReason: "SOURCE_PROJECT_VERSION_CHANGED" }
            : current.observabilityInteraction,
        imagingInteraction: current.imagingInteraction?.pendingContributionRef === contributionId
          ? {
            ...current.imagingInteraction,
            status: "ADOPTED",
            adoptedProjectVersion: project.versionId,
            staleReason: null,
          }
          : current.imagingInteraction && !imagingInteractionMatchesCurrentProject(current.imagingInteraction, project)
            ? { ...current.imagingInteraction, status: "STALE", staleReason: "SOURCE_PROJECT_VERSION_CHANGED" }
            : current.imagingInteraction,
        biostatisticsInteraction: current.biostatisticsInteraction?.pendingContributionRef === contributionId
          ? {
            ...current.biostatisticsInteraction,
            status: "ADOPTED",
            adoptedProjectVersion: project.versionId,
            staleReason: null,
          }
          : current.biostatisticsInteraction && !biostatisticsInteractionMatchesCurrentProject(current.biostatisticsInteraction, project)
            ? { ...current.biostatisticsInteraction, status: "STALE", staleReason: "SOURCE_PROJECT_VERSION_CHANGED" }
            : current.biostatisticsInteraction,
        canonicalStudyDataInteraction: current.canonicalStudyDataInteraction
          && (current.canonicalStudyDataInteraction.sourceProjectVersion !== project.versionId
            || current.canonicalStudyDataInteraction.sourceProjectDigest !== project.projectDigest)
          ? { ...current.canonicalStudyDataInteraction, status: "STALE", staleReason: "SOURCE_PROJECT_VERSION_CHANGED" }
          : current.canonicalStudyDataInteraction,
        dataManagementInteraction: current.dataManagementInteraction
          && (current.dataManagementInteraction.sourceProjectVersion !== project.versionId
            || current.dataManagementInteraction.sourceProjectDigest !== project.projectDigest)
          ? { ...current.dataManagementInteraction, status: "STALE", staleReason: "SOURCE_PROJECT_VERSION_CHANGED" }
          : current.dataManagementInteraction,
        documents,
        currentContribution: contribution,
        pendingContribution: null,
        retainedContributionCandidates: recordContributionCandidateHumanDecision({
          retained: current.retainedContributionCandidates ?? [], candidateRef: contributionId,
          decision: project.confirmationDecision,
        }),
        runtimeTurns,
        entries: [
          ...current.entries.map((entry) => entry.kind === "REVIEW" && entry.contribution.identity.contributionId === contributionId
            ? { ...entry, status: "CONFIRMED" as const, decision: project.confirmationDecision }
            : entry),
          { entryId: createConversationEntryId(), kind: "TEXT", role: "NOXIA", content: feedback, createdAt: now },
          ...(documentWarning ? [{ entryId: createConversationEntryId(), kind: "ERROR" as const, role: "NOXIA" as const, content: "NOXIA n’a pas pu mettre à jour la partie documentaire du projet. Le Research Project confirmé reste disponible.", createdAt: now }] : []),
        ],
        bridgeTraces: current.bridgeTraces.map((trace) => trace.projectChangeSetCandidate?.sourceContributionRef === contributionId
          ? { ...trace, humanDecision: project.confirmationDecision, projectVersionAfter: project.versionId }
          : trace),
        scientificExecutionTraceLedger,
        updatedAt: now,
      }));

      if ((shouldMediatePostAdoptionQuery(queryNavigation)
        && queryNavigation.currentAction && queryNavigation.currentPresentation && queryNavigation.standardQuestion)
        || isCanonicalStudyDataQueryDispatch(queryNavigation)
        || isDataManagementQueryDispatch(queryNavigation)
        || isObservabilityQueryDispatch(queryNavigation)
        || isRegulatoryQueryDispatch(queryNavigation)
        || isProductKnowledgePrerequisiteDispatch(queryNavigation)) {
        continuationScheduled = true;
        setPostAdoptionContinuationJob({
          sessionId: session.sessionId,
          conversationId: session.conversationId,
          project,
          queryNavigation,
          ownerResultLedger: session.knowledgeOwnerLedger,
          scientificExecutionTraceLedger,
          runtimeTurns,
          feedback,
          traceRunId: correlatedTraceRunId ?? null,
        });
      }
    } catch {
      setSession((current) => {
        const correlatedTrace = current.bridgeTraces.find((trace) => trace.projectChangeSetCandidate?.sourceContributionRef === contributionId);
        const scientificExecutionTraceLedger = correlatedTrace?.traceRunId
          ? recordProductErrorBoundary({
            ledger: current.scientificExecutionTraceLedger,
            traceRunId: correlatedTrace.traceRunId,
            turnId: correlatedTrace.turnId,
            conversationId: current.conversationId,
            startedAt: now,
            failedAt: now,
            owner: "TRACE",
            responsibilityOwner: "RESEARCH_PROJECT",
            executor: "PRJ001_CONTRIBUTION_OWNER_BOUNDARY",
            componentId: "PRJ001_CONTRIBUTION_OWNER_BOUNDARY",
            componentVersion: "1.0.0",
            provider: "NONE",
            code: "PROJECT_CONFIRMATION_BOUNDARY_FAILED",
            category: "BOUNDARY_REJECTION",
            sourceDigest: contribution.identity.contributionDigest,
            project: current.project,
          })
          : current.scientificExecutionTraceLedger;
        return {
        ...current,
        entries: [...current.entries, {
          entryId: createConversationEntryId(),
          kind: "ERROR",
          role: "NOXIA",
          content: current.project?.versionId !== session.project?.versionId
            ? "Le projet est à jour, mais NOXIA n’a pas pu formuler la prochaine étape. Vous pouvez poursuivre librement."
            : "NOXIA n’a pas pu mettre à jour cette partie du projet. Votre contribution reste disponible pour réessayer.",
          createdAt: now,
        }],
        scientificExecutionTraceLedger,
        updatedAt: now,
      };
      });
    } finally {
      confirmationInFlightRef.current = null;
      if (!continuationScheduled) setBusy(false);
    }
  };

  const rejectContribution = (contributionId: string) => {
    const contribution = session.pendingContribution;
    if (!contribution || contribution.identity.contributionId !== contributionId) return;
    if (!contributionHasAcknowledgedPresentation(contributionId)) return;
    const now = new Date().toISOString();
    try {
      const decision = rejectResearchProjectContribution({
        contribution,
        current: session.project,
        authority: session.projectAuthority,
        rejectedAt: now,
      });
      setSession((current) => {
        const reviewEntry = current.entries.find((entry) => entry.kind === "REVIEW"
          && entry.contribution.identity.contributionId === contributionId);
        const correlatedTraceRunId = reviewEntry?.kind === "REVIEW" && reviewEntry.traceRunId
          ? reviewEntry.traceRunId
          : current.bridgeTraces.find((trace) => trace.projectChangeSetCandidate?.sourceContributionRef === contributionId)?.traceRunId;
        const scientificExecutionTraceLedger = recordContributionRejectionTrace({
          ledger: current.scientificExecutionTraceLedger,
          traceRunId: correlatedTraceRunId,
          conversationId: current.conversationId,
          recordedAt: now,
          contribution,
          decision,
          project: current.project,
        });
        return {
        ...current,
        pendingContribution: null,
        retainedContributionCandidates: recordContributionCandidateHumanDecision({
          retained: current.retainedContributionCandidates ?? [], candidateRef: contributionId, decision,
        }),
        studyDesignInteraction: current.studyDesignInteraction?.pendingContributionRef === contributionId
          ? {
            ...current.studyDesignInteraction,
            status: "ACTIVE",
            selectedOptionRef: null,
            pendingContributionRef: null,
          }
          : current.studyDesignInteraction,
        scientificThinkingInteraction: current.scientificThinkingInteraction?.pendingContributionRef === contributionId
          ? {
            ...current.scientificThinkingInteraction,
            status: "ACTIVE",
            selectedCandidateRef: null,
            pendingContributionRef: null,
          }
          : current.scientificThinkingInteraction,
        observabilityInteraction: current.observabilityInteraction?.pendingContributionRef === contributionId
          ? {
            ...current.observabilityInteraction,
            status: "ACTIVE",
            selectedMeasurementRef: null,
            pendingContributionRef: null,
          }
          : current.observabilityInteraction,
        imagingInteraction: current.imagingInteraction?.pendingContributionRef === contributionId
          ? {
            ...current.imagingInteraction,
            status: "ACTIVE",
            selectedOptionRef: null,
            pendingContributionRef: null,
          }
          : current.imagingInteraction,
        biostatisticsInteraction: current.biostatisticsInteraction?.pendingContributionRef === contributionId
          ? {
            ...current.biostatisticsInteraction,
            status: "ACTIVE",
            selectedStrategyRef: null,
            pendingContributionRef: null,
          }
          : current.biostatisticsInteraction,
        entries: current.entries.map((entry) => entry.kind === "REVIEW" && entry.contribution.identity.contributionId === contributionId
          ? { ...entry, status: "REJECTED" as const, decision }
          : entry),
        bridgeTraces: current.bridgeTraces.map((trace) => trace.projectChangeSetCandidate?.sourceContributionRef === contributionId
          ? { ...trace, humanDecision: decision, projectVersionAfter: current.project?.versionId ?? null }
          : trace),
        scientificExecutionTraceLedger,
        updatedAt: now,
      };
      });
    } catch {
      setSession((current) => ({
        ...current,
        entries: [...current.entries, {
          entryId: createConversationEntryId(),
          kind: "ERROR",
          role: "NOXIA",
          content: "NOXIA n’a pas pu enregistrer ce refus. Le Research Project reste inchangé.",
          createdAt: now,
        }],
        updatedAt: now,
      }));
    }
  };

  const respondToConversationActionGroup = (entryId: string, input: {
    selectedActionRefs: readonly string[];
    freeTextRequest: string | null;
    defer: boolean;
  }) => {
    const respondedAt = new Date().toISOString();
    setSession((current) => {
      const entry = current.entries.find((item) => item.entryId === entryId && item.kind === "FOLLOW_UP_ACTIONS");
      if (!entry || entry.kind !== "FOLLOW_UP_ACTIONS" || entry.response || !current.project
        || current.project.versionId !== entry.presentation.sourceProjectVersion
        || current.project.projectDigest !== entry.presentation.sourceProjectDigest) return current;
      const allowedRefs = new Set(entry.presentation.actions.map((action) => action.actionRef));
      const selectedActionRefs = [...new Set(input.selectedActionRefs.filter((ref) => allowedRefs.has(ref)))];
      const freeTextRequest = input.freeTextRequest?.trim() || null;
      if (!input.defer && !selectedActionRefs.length && !freeTextRequest) return current;
      const response: StandardConversationActionGroupResponse = {
        responseRef: `conversation-action-response:${logicalDigest({ entryId, selectedActionRefs, freeTextRequest, respondedAt })}`,
        disposition: input.defer ? "DEFERRED_NOT_NOW" : "USER_REQUESTS_THESE_FOLLOW_UP_ACTIONS",
        selectedActionRefs,
        unselectedActionRefs: entry.presentation.actions.map((action) => action.actionRef)
          .filter((ref) => !selectedActionRefs.includes(ref)),
        freeTextRequest,
        respondedAt,
        projectVersionAtPresentation: entry.presentation.sourceProjectVersion,
        projectWriteAuthorized: false,
      };
      const visible = summarizeStandardConversationActionResponse({ presentation: entry.presentation, response });
      const userTurn: ScientificInterpretationTurn = { turnId: createTurnId(), role: "USER", content: visible.userText, createdAt: respondedAt };
      const assistantTurn: ScientificInterpretationTurn = { turnId: createTurnId(), role: "NOXIA", content: visible.assistantText, createdAt: respondedAt };
      const navigation = current.queryNavigation
        && current.queryNavigation.currentAction?.selectedActionId === entry.presentation.selectedQryActionRef
        ? input.defer
          ? deferFunctionalResetQueryNavigation({ navigation: current.queryNavigation, reason: "USER_REQUESTED_TO_MOVE_ON", recordedAt: respondedAt })
          : recordFunctionalResetQueryResponse({
            navigation: current.queryNavigation,
            rawResponse: visible.userText,
            actorRef: current.projectAuthority.actorRef,
            actorRole: "RESEARCHER",
            receivedAt: respondedAt,
            responseId: response.responseRef,
          })
        : current.queryNavigation;
      return {
        ...current,
        queryNavigation: navigation,
        runtimeTurns: [...current.runtimeTurns, userTurn, assistantTurn],
        entries: [
          ...current.entries.map((item) => item.entryId === entryId && item.kind === "FOLLOW_UP_ACTIONS"
            ? { ...item, response }
            : item),
          { entryId: createConversationEntryId(), kind: "TEXT" as const, role: "USER" as const, content: visible.userText, createdAt: respondedAt },
          { entryId: createConversationEntryId(), kind: "TEXT" as const, role: "NOXIA" as const, content: visible.assistantText, createdAt: respondedAt },
        ],
        updatedAt: respondedAt,
      };
    });
  };

  function appendProductDocumentCommandResult(input: {
    command: { content: string; createdAt: string };
    assistantContent: string;
    projectionId?: string | null;
  }) {
    const answeredAt = new Date().toISOString();
    setSession((current) => ({
      ...current,
      ...(input.projectionId !== undefined ? { openDocumentProjectionId: input.projectionId } : {}),
      entries: [...current.entries, {
        entryId: createConversationEntryId(),
        kind: "TEXT",
        role: "USER",
        content: input.command.content,
        createdAt: input.command.createdAt,
      }, {
        entryId: createConversationEntryId(),
        kind: "TEXT",
        role: "NOXIA",
        content: input.assistantContent,
        createdAt: answeredAt,
      }],
      updatedAt: answeredAt,
    }));
  }

  function dispatchProductDocumentAction(
    action: ProductDocumentAction,
    command: { content: string; createdAt: string },
  ) {
    if (!session.project) {
      appendProductDocumentCommandResult({
        command,
        assistantContent: action === "OPEN_STUDY_DELIVERABLES" || action === "OPEN_EDC_EXPORT"
          ? "Un Research Project confirmé est nécessaire avant de pouvoir préparer des livrables d’étude."
          : "Un Research Project confirmé est nécessaire avant de pouvoir afficher un aperçu du protocole.",
      });
      return;
    }

    if (action === "OPEN_STUDY_DELIVERABLES" || action === "OPEN_EDC_EXPORT") {
      appendProductDocumentCommandResult({
        command,
        assistantContent: action === "OPEN_EDC_EXPORT"
          ? "L’espace des livrables est ouvert sur le CRF canonique et ses exports de collecte. Chaque format reste téléchargeable séparément."
          : "L’espace des livrables de l’étude est ouvert. Les documents incomplets restent explicitement signalés.",
      });
      setSession((current) => ({ ...current, openDocumentProjectionId: null }));
      setDeliverableWorkspaceOpen(true);
      return;
    }

    const protocolCard = session.documents.cards.find((card) => card.kind === "PROTOCOL");
    const projectionId = protocolCard?.canOpen ? protocolCard.projectionId : null;
    if (action === "OPEN_CURRENT_PROTOCOL") {
      appendProductDocumentCommandResult({
        command,
        assistantContent: projectionId
          ? protocolCard?.freshness === "CURRENT"
            ? "Voici la version actuelle du protocole."
            : "Voici la dernière version disponible du protocole. Elle reste signalée comme historique."
          : "Aucun aperçu du protocole n’existe encore. Une demande explicite de création est nécessaire.",
        ...(projectionId ? { projectionId } : {}),
      });
      return;
    }

    if (action === "DOWNLOAD_PROTOCOL") {
      appendProductDocumentCommandResult({
        command,
        assistantContent: projectionId
          ? "Le protocole est ouvert. Le téléchargement HTML est disponible dans l’aperçu."
          : "Aucun aperçu du protocole n’est encore disponible au téléchargement.",
        ...(projectionId ? { projectionId } : {}),
      });
      return;
    }

    if (action === "CREATE_PROTOCOL" && protocolCard?.freshness === "CURRENT" && projectionId) {
      appendProductDocumentCommandResult({
        command,
        assistantContent: "Voici la version actuelle du protocole.",
        projectionId,
      });
      return;
    }

    if (action === "REGENERATE_PROTOCOL" && protocolCard?.freshness === "CURRENT" && projectionId) {
      appendProductDocumentCommandResult({
        command,
        assistantContent: "Le protocole reflète déjà la version actuelle du Research Project.",
        projectionId,
      });
      return;
    }

    requestProtocolProjection(command);
  }

  function requestProtocolProjection(command?: { content: string; createdAt: string }) {
    if (!session.project) return;
    const now = new Date().toISOString();
    try {
      const decision = authorizeResearchProjectDocumentHandoff({
        project: session.project,
        authority: session.projectAuthority,
        confirmedAt: now,
      });
      const documents = refreshFunctionalResetDocumentPortfolio({
        project: session.project,
        previous: session.documents,
        handoffDecision: decision,
        requestedAt: now,
        generateProtocol: true,
      });
      const protocol = documents.projections.at(-1) ?? null;
      if (!protocol || documents.lastFailure) throw new Error(documents.lastFailure?.message ?? "DOC_PROTOCOL_PROJECTION_NOT_CREATED");
      setSession((current) => {
        const correlatedTrace = [...current.bridgeTraces]
          .reverse()
          .find((trace) => trace.traceRunId && trace.projectVersionAfter === session.project?.versionId);
        const scientificExecutionTraceLedger = recordDocumentProjectionTrace({
          ledger: current.scientificExecutionTraceLedger,
          traceRunId: correlatedTrace?.traceRunId,
          conversationId: current.conversationId,
          recordedAt: now,
          project: session.project!,
          decision,
          projection: protocol,
          projectionMode,
        });
        return {
        ...current,
        documents,
        openDocumentProjectionId: protocol.projectionId,
        scientificExecutionTraceLedger,
        entries: [...current.entries, ...(command ? [{
          entryId: createConversationEntryId(),
          kind: "TEXT" as const,
          role: "USER" as const,
          content: command.content,
          createdAt: command.createdAt,
        }] : []), {
          entryId: createConversationEntryId(),
          kind: "TEXT",
          role: "NOXIA",
          content: protocol.readiness === "READY_FOR_REVIEW"
            ? "Une version de travail du protocole est disponible pour revue."
            : "Un premier aperçu partiel du protocole est disponible. Les sections encore ouvertes restent visibles.",
          createdAt: now,
        }],
        updatedAt: now,
      };
      });
    } catch (error) {
      const documents = markFunctionalResetDocumentFailure(session.project, session.documents, error);
      setSession((current) => {
        const correlatedTrace = [...current.bridgeTraces]
          .reverse()
          .find((trace) => trace.traceRunId && trace.projectVersionAfter === session.project?.versionId);
        const scientificExecutionTraceLedger = correlatedTrace?.traceRunId
          ? recordProductErrorBoundary({
            ledger: current.scientificExecutionTraceLedger,
            traceRunId: correlatedTrace.traceRunId,
            turnId: correlatedTrace.turnId,
            conversationId: current.conversationId,
            startedAt: now,
            failedAt: now,
            owner: "DOC",
            responsibilityOwner: "DOC-001",
            executor: "FUNCTIONAL_RESET_DOCUMENT_BOUNDARY",
            componentId: "DOC-001",
            componentVersion: "1.0.0",
            provider: "NONE",
            code: "DOCUMENT_PROJECTION_BOUNDARY_FAILED",
            category: "BOUNDARY_REJECTION",
            sourceDigest: session.project!.projectDigest,
            project: session.project!,
          })
          : current.scientificExecutionTraceLedger;
        return {
        ...current,
        documents,
        scientificExecutionTraceLedger,
        entries: [...current.entries, ...(command ? [{
          entryId: createConversationEntryId(),
          kind: "TEXT" as const,
          role: "USER" as const,
          content: command.content,
          createdAt: command.createdAt,
        }] : []), {
          entryId: createConversationEntryId(),
          kind: "ERROR",
          role: "NOXIA",
          content: "NOXIA n’a pas pu produire l’aperçu du protocole. Le Project et la conversation sont conservés.",
          createdAt: now,
        }],
        updatedAt: now,
      };
      });
    }
  };

  const requestCorrection = () => {
    setCorrectionMode(true);
    composerRef.current?.focus();
  };

  const reset = () => {
    clearFunctionalResetSession(window.localStorage);
    setSession(createFunctionalResetSession());
    setDraft("");
    setBusy(false);
    setCorrectionMode(false);
    setDeliverableWorkspaceOpen(false);
    setPostAdoptionContinuationJob(null);
    window.setTimeout(() => composerRef.current?.focus(), 0);
  };

  const openProjection = functionalProtocolProjection(session.documents, session.openDocumentProjectionId);
  const recordOpenProjectionArtifact = (format: "HTML", generatedAt: string) => {
    if (!openProjection) return;
    setSession((current) => {
      const correlatedTrace = [...current.bridgeTraces]
        .reverse()
        .find((trace) => trace.traceRunId && trace.projectVersionAfter === openProjection.source.projectVersion);
      return {
        ...current,
        scientificExecutionTraceLedger: recordArtifactGeneratedTrace({
          ledger: current.scientificExecutionTraceLedger,
          traceRunId: correlatedTrace?.traceRunId,
          conversationId: current.conversationId,
          generatedAt,
          projection: openProjection,
          format,
        }),
      };
    });
  };
  const protocolCard = session.documents.cards.find((card) => card.kind === "PROTOCOL");
  const currentProtocolProjection = session.project
    ? [...session.documents.projections].reverse().find((projection) => projection.projectionType === "PROTOCOL"
      && projection.source.projectId === session.project!.projectId
      && projection.source.projectVersion === session.project!.versionId
      && projection.source.projectDigest === session.project!.projectDigest) ?? null
    : null;
  const deliverablePortfolio = useMemo(() => session.project ? buildStudyDeliverablePortfolio({
    project: session.project,
    protocolProjection: currentProtocolProjection,
    generatedAt: currentProtocolProjection?.requestedAt ?? session.project.adoptedAt,
  }) : null, [currentProtocolProjection, session.project]);
  const activeRouteIntent = [...session.bridgeTraces]
    .reverse()
    .find((trace) => trace.entryRouting)?.entryRouting?.routeIntent;
  const projectPanel = <ResearchProjectPanel
    project={session.project}
    documents={session.documents}
    mode={projectionMode}
    onOpenProtocol={(projectionId) => {
      setDeliverableWorkspaceOpen(false);
      setSession((current) => ({ ...current, openDocumentProjectionId: projectionId }));
    }}
    onRequestProtocol={requestProtocolProjection}
    deliverablePortfolio={deliverablePortfolio}
    queryNavigation={session.queryNavigation}
    onOpenDeliverables={() => {
      setSession((current) => ({ ...current, openDocumentProjectionId: null }));
      setDeliverableWorkspaceOpen(true);
    }}
  />;

  return <main
    id="demo-main"
    className="min-h-screen bg-muted/30 text-foreground"
    data-testid="functional-reset-workspace"
    data-product-mode={projectionMode}
  >
    <Helmet>
      <title>Protocol Designer — NOXIA</title>
      <meta name="description" content="Comprenez, formalisez ou construisez un Research Project dans une conversation continue avec NOXIA." />
      <meta name="robots" content="noindex, follow" />
    </Helmet>

    <div className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8">
      <header className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">NOXIA</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{projectionMode === "STANDARD" ? "Construisons votre projet scientifique" : "Protocol Designer"}</h1>
            {projectionMode === "EXPERT" && <span
              className="font-mono text-[10px] font-medium tracking-wide text-muted-foreground/70"
              data-testid="protocol-designer-development-version"
            >{formatProductDevelopmentVersion(
              typeof __NOXIA_BUILD_GIT_SHA__ === "undefined" ? null : __NOXIA_BUILD_GIT_SHA__,
            )}</span>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{projectionMode === "STANDARD"
            ? "Décrivez votre question : NOXIA vous aide à la structurer, étape par étape."
            : "Surface détaillée de développement et de diagnostic"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border bg-background p-1" role="group" aria-label="Mode d’affichage">
            <button
              type="button"
              aria-pressed={projectionMode === "STANDARD"}
              onClick={() => setProjectionMode("STANDARD")}
              className={`min-h-10 rounded-lg px-3 text-sm font-medium ${projectionMode === "STANDARD" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >Standard</button>
            <button
              type="button"
              aria-pressed={projectionMode === "EXPERT"}
              onClick={() => setProjectionMode("EXPERT")}
              className={`min-h-10 rounded-lg px-3 text-sm font-medium ${projectionMode === "EXPERT" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >Expert</button>
          </div>
          <Sheet>
            <SheetTrigger asChild><button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-background px-3 text-sm font-medium lg:hidden"><MessageSquareText className="h-4 w-4" />Voir mon projet</button></SheetTrigger>
            <SheetContent side="left" className="w-[min(92vw,420px)] overflow-y-auto p-4">
              <SheetHeader className="sr-only"><SheetTitle>Research Project</SheetTitle><SheetDescription>État actuel du projet et des documents.</SheetDescription></SheetHeader>
              <div className="pt-7">{projectPanel}</div>
            </SheetContent>
          </Sheet>
          <button type="button" aria-label="Recommencer" onClick={reset} className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-background px-3 text-sm font-medium"><RotateCcw className="h-4 w-4" /><span>Recommencer</span></button>
        </div>
      </header>

      {projectionMode === "EXPERT" && <DevelopmentDiagnostics session={session} />}

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(310px,.72fr)_minmax(0,1.5fr)]">
        <div className="hidden min-w-0 self-start lg:sticky lg:top-4 lg:block lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">{projectPanel}</div>

        {deliverableWorkspaceOpen && deliverablePortfolio ? <StudyDeliverableWorkspace
          portfolio={deliverablePortfolio}
          onClose={() => setDeliverableWorkspaceOpen(false)}
        /> : openProjection ? <ProtocolPreview
          projection={openProjection}
          stale={protocolCard?.freshness === "STALE" || openProjection.source.projectVersion !== session.project?.versionId}
          onClose={() => setSession((current) => ({ ...current, openDocumentProjectionId: null }))}
          onArtifactGenerated={recordOpenProjectionArtifact}
        /> : <section aria-label="Conversation" className="flex min-h-[calc(100vh-7.5rem)] min-w-0 flex-col rounded-3xl border bg-background shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Conversation</h2>
            <p className="mt-1 text-sm text-muted-foreground">Décrivez votre question ou votre objectif. NOXIA oriente d’abord l’échange, puis n’ouvre un Research Project que si vous demandez de construire une étude.</p>
          </div>

          <div className="flex-1 space-y-5 px-4 py-5 sm:px-6" aria-live="polite">
            {session.entries.map((entry, index) => entry.kind === "FOLLOW_UP_ACTIONS"
              ? <StandardConversationActionGroup
                key={entry.entryId}
                presentation={entry.presentation}
                response={entry.response}
                actionable={!entry.response
                  && session.project?.versionId === entry.presentation.sourceProjectVersion
                  && session.project?.projectDigest === entry.presentation.sourceProjectDigest}
                onRespond={(input) => respondToConversationActionGroup(entry.entryId, input)}
              />
              : entry.kind === "REVIEW"
              ? session.entries.some((item) => item.entryId === `${entry.entryId}:presentation-failure`)
                || session.retainedContributionCandidates?.some((candidate) => candidate.candidateRef === entry.contribution.identity.contributionId
                  && candidate.downstreamState === "DOWNSTREAM_FAILED_NOT_PRESENTED") ? null : <ContributionReviewPresentation
                key={entry.entryId}
                presentationRef={entry.entryId}
                onPresented={() => acknowledgeContributionReviewPresented(entry.entryId)}
                onPresentationFailure={(failure) => recordContributionReviewPresentationFailure(entry.entryId, failure)}
                renderReview={() => <ContributionReview
                contribution={entry.contribution}
                candidate={entry.candidate ?? prepareResearchProjectContributionCandidate(
                  entry.contribution,
                  projectExistedForReview(index) ? session.project : null,
                )}
                status={entry.status}
                actionable={session.pendingContribution?.identity.contributionId === entry.contribution.identity.contributionId}
                detailedUnderstanding={<UnderstandingReviewCard
                  contribution={entry.contribution}
                  status={entry.status === "REJECTED" ? "CORRECTION_REQUESTED" : entry.status}
                  onConfirm={() => undefined}
                  onCorrect={() => undefined}
                  onAdd={() => undefined}
                  presentationOnly
                />}
                onConfirm={() => confirmContribution(entry.contribution.identity.contributionId)}
                onCorrect={requestCorrection}
                onReject={() => rejectContribution(entry.contribution.identity.contributionId)}
              />}
              />
              : entry.kind === "STUDY_DESIGN_PROPOSAL"
                ? <StudyDesignStandardCard
                  key={entry.entryId}
                  presentation={entry.presentation}
                  interaction={readStudyDesignProposalFromLedger({
                    ledger: session.knowledgeOwnerLedger,
                    resultRef: session.studyDesignInteraction?.ownerResultRef ?? "",
                  })?.proposalId === entry.presentation.proposalRef ? session.studyDesignInteraction : null}
                  onSelect={(optionRef) => {
                    const option = entry.presentation.options.find((candidate) => candidate.optionRef === optionRef);
                    if (option) applyStudyDesignInput(`Je retiens l’option « ${option.label} » pour revue.`, optionRef);
                  }}
                  onDiscuss={() => {
                    setDraft("");
                    composerRef.current?.focus();
                  }}
                />
              : entry.kind === "OBSERVABILITY_PROPOSAL"
                ? <ObservabilityStandardCard
                  key={entry.entryId}
                  presentation={entry.presentation}
                  interaction={readObservabilityResultFromLedger({
                    ledger: session.knowledgeOwnerLedger,
                    resultRef: session.observabilityInteraction?.ownerResultRef ?? "",
                  })?.resultId === entry.presentation.resultRef ? session.observabilityInteraction : null}
                  onSelect={(measurementRef) => {
                    const option = entry.presentation.options.find((candidate) => candidate.optionRef === measurementRef);
                    if (option) applyObservabilityInput(`Je retiens la mesure « ${option.measurementLabel} » pour revue.`, measurementRef);
                  }}
                  onDiscuss={() => {
                    setDraft("");
                    composerRef.current?.focus();
                  }}
                />
              : entry.kind === "IMAGING_PROPOSAL"
                ? <ImagingStandardCard
                  key={entry.entryId}
                  presentation={entry.presentation}
                  interaction={readImagingResultFromLedger({
                    ledger: session.knowledgeOwnerLedger,
                    resultRef: session.imagingInteraction?.ownerResultRef ?? "",
                  })?.resultId === entry.presentation.resultRef ? session.imagingInteraction : null}
                  onSelect={(optionRef) => {
                    const option = entry.presentation.options.find((candidate) => candidate.optionRef === optionRef);
                    if (option) applyImagingInput(`Je retiens la stratégie ${option.acquisitionLabel ?? option.modalityLabel} pour revue.`, optionRef);
                  }}
                  onDiscuss={() => {
                    setDraft("");
                    composerRef.current?.focus();
                  }}
                />
              : entry.kind === "BIOSTATISTICS_PROPOSAL"
                ? <BiostatisticsStandardCard
                  key={entry.entryId}
                  presentation={entry.presentation}
                  interaction={readBiostatisticsResultFromLedger({
                    ledger: session.knowledgeOwnerLedger,
                    resultRef: session.biostatisticsInteraction?.ownerResultRef ?? "",
                  })?.resultId === entry.presentation.resultRef ? session.biostatisticsInteraction : null}
                  onSelect={(strategyRef) => {
                    const option = entry.presentation.options.find((candidate) => candidate.optionRef === strategyRef);
                    if (option) applyBiostatisticsInput(`Je retiens la stratégie « ${option.label} » pour revue.`, strategyRef);
                  }}
                  onDiscuss={() => {
                    setDraft("");
                    composerRef.current?.focus();
                  }}
                />
              : entry.kind === "CDM_RESULT"
                ? <CanonicalStudyDataStandardCard
                  key={entry.entryId}
                  presentation={entry.presentation}
                  interaction={readCanonicalStudyDataResultFromLedger({
                    ledger: session.knowledgeOwnerLedger,
                    resultRef: session.canonicalStudyDataInteraction?.ownerResultRef ?? "",
                  })?.resultId === entry.presentation.resultRef ? session.canonicalStudyDataInteraction : null}
                  onContinue={continueFromCanonicalStudyData}
                  onDiscuss={() => {
                    setDraft("");
                    composerRef.current?.focus();
                  }}
                />
              : entry.kind === "DATA_MANAGEMENT_RESULT"
                ? <DataManagementStandardCard
                  key={entry.entryId}
                  presentation={entry.presentation}
                  interaction={readDataManagementResultFromLedger({
                    ledger: session.knowledgeOwnerLedger,
                    resultRef: session.dataManagementInteraction?.ownerResultRef ?? "",
                  })?.resultId === entry.presentation.resultRef ? session.dataManagementInteraction : null}
                  onDiscuss={() => {
                    setDraft("");
                    composerRef.current?.focus();
                  }}
                />
              : <article key={entry.entryId} className={`flex ${entry.role === "USER" ? "justify-end" : "justify-start"}`}>
                {entry.kind === "TEXT" && entry.role === "NOXIA" && entry.knowledgePresentation
                  ? <ProductUnderstandResponse presentation={entry.knowledgePresentation} />
                  : <div className={`max-w-[88%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[78%] ${
                    entry.kind === "ERROR" ? "border border-destructive/40 bg-destructive/10 text-destructive"
                      : entry.role === "USER" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`} role={entry.kind === "ERROR" ? "alert" : undefined}>{entry.content}</div>}
              </article>)}
            {busy && <div className="flex justify-start"><div className="inline-flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" />{busyMessage}</div></div>}
            <div ref={endRef} />
          </div>

          <form onSubmit={submit} className="sticky bottom-0 border-t bg-background/95 p-4 backdrop-blur sm:p-5">
            {correctionMode && <p className="mb-2 text-sm font-medium text-primary">Décrivez librement ce que vous souhaitez corriger. Vous pouvez regrouper plusieurs changements dans un seul message.</p>}
            <label htmlFor="protocol-designer-message" className="sr-only">Votre message</label>
            <div className="flex items-end gap-2 rounded-2xl border bg-background p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring">
              <textarea
                ref={composerRef}
                id="protocol-designer-message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                rows={2}
                maxLength={4_000}
                placeholder={correctionMode ? "Ce que je souhaite corriger…" : productEntryPromptForIntent(activeRouteIntent)}
                className="max-h-40 min-h-12 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none"
              />
              <button type="submit" disabled={busy || !draft.trim()} aria-label="Envoyer" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"><ArrowUp className="h-5 w-5" /></button>
            </div>
          </form>
        </section>}
      </div>
    </div>
  </main>;
}
