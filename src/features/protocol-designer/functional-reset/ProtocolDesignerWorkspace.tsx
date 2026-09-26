import ProjectFinalizationCard from "./ProjectFinalizationCard";
import { isWorkingDraftReviewOnlyRequest, prepareContinuousWorkingDraft, recommendedWorkingScope, refreshWorkingDraftReview, validatePreparedWorkingReview } from "./continuous-project-build";
import { projectDrciDraftPackPortfolio, isDrciDraftPackCurrent, prepareDrciDraftSource } from "@/features/document-projection/drci-draft-pack";
import { isFunctionalDocumentProjectionCurrent } from "@/features/document-projection/functional-reset-boundary";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  buildBoundedConversationReferentContext,
  requiresCurrentOwnerPresentation,
  requestsScientificExplanation,
  buildCurrentNavigationEvidence,
  currentGovernedNavigationInput,
  selectBoundedConversationInteraction,
} from "@/features/query-navigation/current-navigation-evidence";
import { Helmet } from "react-helmet-async";
import { ArrowUp, LoaderCircle, MessageSquareText, Pencil, RotateCcw } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { ScientificInterpretationContributionEnvelope, ScientificInterpretationTurn } from "@/features/scientific-interpretation/contracts";
import {
  ProductBridgeClientError,
  ensureServerProjectSnapshot,
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
import type { ProviderCallRecord, ProviderCallRequestObservability } from "@/features/protocol-designer/provider-call-observability";
import { GOVERNED_REALIZATION_SYSTEM_INSTRUCTION } from "@/features/query-navigation/governed-conversation-realization";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { ownerResultNativeDigest } from "@/features/protocol-designer/product-owner-result-ledger";
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
  buildCanonicalCrfPackage,
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
import ContributionReview, { ContributionReviewPresentation, reviewDecisionRefsInDisplayOrder, type ContributionReviewPresentationFailure } from "./ContributionReview";
import StudyProposalReview from "./StudyProposalReview";
import { buildStudyProposalSelectionContribution, selectedStudyProposalAtoms, propagateStudyProposalDecision, propagateFreeformStudyProposalDecision, requireStudyProposalReview, assertStudyProposalCurrent, projectStudyProposalDisposition } from "./study-proposal-standard";
import { contributionDecisionScopeGroups, deferResearchProjectContribution } from "@/features/research-project-construction/contribution-owner-boundary";
import type { StudyProposalComposition } from "../product-bridge";
import {
  retainValidatedContributionCandidate,
  retainUndecidedContributionScope,
  markContributionCandidatePresented,
  markContributionCandidateNonCurrent,
  recordContributionDownstreamFailure,
  recordContributionCandidateHumanDecision,
  buildScientificDiscussionContext,
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
  recognizeCurrentProjectDirection,
  recognizeProductDocumentAction,
  routeProductEntry,
  type ProductDocumentAction,
} from "./product-entry-routing";
import {
  buildCandidateScientificChallenge,
  buildConciseAdoptionReply,
  classifyNaturalConversationActs,
  detectConversationStylePreference,
  isProjectStateQuestion,
  isUserFeedbackOnAssistantOutput,
  isExternalEvidenceRequest,
  isExplicitProjectRecordingRequest,
  readNaturalCandidateDecision,
  type ConversationStylePreference,
} from "./natural-conversation-policy";
import {
  appendFunctionalResetProviderCallRecords,
  clearFunctionalResetSession,
  createConversationEntryId,
  createFunctionalResetSession,
  createTurnId,
  loadFunctionalResetSession,
  persistFunctionalResetSession,
  recordConversationConfirmationReceipt,
  recordWorkingDraftPreparation,
  conversationConfirmationReceiptStatus,
  productEntryPromptForIntent,
  resolveGovernedPostAdoptionReceipt,
  shouldMediatePostAdoptionQuery,
  type ConversationEntry,
  type FunctionalResetSession,
  type ProjectReviewInvitation,
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
import { documentAdministrationFrom } from "./project-administration";
import ProjectContinuum from "./ProjectContinuum";
import ProjectSourceLibraryView from "./ProjectSourceLibraryView";
import { acquireDocumentKnowledge, resolveDocumentaryIntent } from "./documentary-conversation";
import { recordSourceInterest, resolveProjectSource, sourceShortReference } from "@/features/knowledge-engine/project-source-library";
import { availableDocumentEvidence, readableDocumentDiff, restoreDocumentRevision, reviseScientificDocument } from "@/features/document-projection/scientific-document-revision";
import { explainDocumentSourceComparison, explainDocumentSourceSelection } from "@/features/document-projection/scientific-narrative";

const loadInitialSession = () => typeof window === "undefined"
  ? createFunctionalResetSession()
  : loadFunctionalResetSession(window.localStorage);

const projectReviewInvitation = (session: FunctionalResetSession,
  prepared: NonNullable<ReturnType<typeof validatePreparedWorkingReview>>): ProjectReviewInvitation => ({
  sessionId: session.sessionId,
  conversationId: session.conversationId,
  projectId: session.projectId,
  sourceProjectVersion: session.project?.versionId ?? null,
  sourceProjectDigest: session.project?.projectDigest ?? null,
  sourceTurnRef: session.studyProposal!.sourceTurnRef,
  sourceResponseRef: session.studyProposal!.sourceResponseRef,
  compositionDigest: session.studyProposal!.digest,
  reviewScopeDigest: session.workingDraft!.reviewScopeDigest!,
  candidateRef: prepared.contribution.identity.contributionId,
  contributionDigest: prepared.contribution.identity.contributionDigest,
});

const sameProjectReviewInvitation = (a: ProjectReviewInvitation, b: ProjectReviewInvitation) =>
  a.sessionId === b.sessionId && a.conversationId === b.conversationId && a.projectId === b.projectId
  && a.sourceProjectVersion === b.sourceProjectVersion && a.sourceProjectDigest === b.sourceProjectDigest
  && a.sourceTurnRef === b.sourceTurnRef && a.sourceResponseRef === b.sourceResponseRef
  && a.compositionDigest === b.compositionDigest && a.reviewScopeDigest === b.reviewScopeDigest
  && a.candidateRef === b.candidateRef && a.contributionDigest === b.contributionDigest;

const projectReviewInvitationText = (session: FunctionalResetSession,
  prepared: NonNullable<ReturnType<typeof validatePreparedWorkingReview>>) => {
  const choices = prepared.candidate.humanReviewProjection.sections.flatMap(section => section.items)
    .filter(item => item.changeKind === "OBJECT" && item.objectType !== "UNCERTAINTY");
  const open = session.workingDraft!.metrics.openHighValueDecisions;
  const examples = choices.slice(0, 2).map(item => `- ${item.content}`).join("\n");
  return `J’ai structuré ${choices.length} choix pour votre projet. ${open} point${open > 1 ? "s" : ""} reste${open > 1 ? "nt" : ""} à définir et ne sera${open > 1 ? "ont" : ""} pas confirmé${open > 1 ? "s" : ""}.`
    + (examples ? `\n\nParmi les choix proposés :\n${examples}` : "")
    + "\n\nSouhaitez-vous valider ces choix, les consulter ou les modifier ?";
};

const productBridgeClientErrorCode = (error: unknown) => error && typeof error === "object"
  && "code" in error && typeof error.code === "string"
  ? error.code
  : null;

type LanguageProjectionRequestFailure = Error & Readonly<{
  code: string;
  languageProjectionRequest: LanguageProjectionRequest;
  languageProjectionDiagnostic: LanguageProjectionContractFailureDiagnostic | null;
  observability: ProviderCallRequestObservability | null;
}>;

const providerRecordsFromError = (error: unknown): readonly ProviderCallRecord[] =>
  error instanceof ProductBridgeClientError ? error.observability?.providerCalls ?? []
    : error && typeof error === "object" && "observability" in error
      ? (error.observability as ProviderCallRequestObservability | null)?.providerCalls ?? [] : [];

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
  observabilityContext: NonNullable<LanguageProjectionRequest["observabilityContext"]>;
  onProviderCallRecords?: (records: readonly ProviderCallRecord[]) => void;
}): Promise<{
  projection: LanguageProjectionArtifact;
  providerCalls: 0 | 1;
  providerCallRecords: readonly ProviderCallRecord[];
}> => {
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
  if (cached) return { projection: cached, providerCalls: 0, providerCallRecords: [] };
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
    observabilityContext: input.observabilityContext,
  };
  let response: Awaited<ReturnType<typeof requestConversationLanguageProjection>>;
  try {
    response = await requestConversationLanguageProjection(request);
    input.onProviderCallRecords?.(response.observability.providerCalls ?? []);
  } catch (error) {
    input.onProviderCallRecords?.(providerRecordsFromError(error));
    const failure = new Error(
      error instanceof Error ? error.message : "Cette langue ne peut pas être traitée pour le moment.",
    ) as LanguageProjectionRequestFailure;
    Object.assign(failure, {
      name: "LanguageProjectionRequestFailure",
      code: productBridgeClientErrorCode(error) ?? "LANGUAGE_PROJECTION_UNAVAILABLE",
      observability: error instanceof ProductBridgeClientError ? error.observability : null,
      languageProjectionRequest: request,
      languageProjectionDiagnostic: error && typeof error === "object" && "diagnostic" in error
        ? error.diagnostic as LanguageProjectionContractFailureDiagnostic | null
        : null,
    });
    throw failure;
  }
  return {
    projection: response.projection,
    providerCalls: 1,
    providerCallRecords: response.observability.providerCalls ?? [],
  };
};

const prepareMultilingualUserTurn = async (input: {
  session: Readonly<FunctionalResetSession>;
  turnId: string;
  originalText: string;
  onProviderCallRecords?: (records: readonly ProviderCallRecord[]) => void;
}): Promise<{
  turn: MultilingualUserTurn;
  state: ConversationLanguageGatewayState;
  providerCalls: 0 | 1;
  providerCallRecords: readonly ProviderCallRecord[];
}> => {
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
      onProviderCallRecords: input.onProviderCallRecords,
      observabilityContext: {
        sessionId: input.session.sessionId,
        conversationId: input.session.conversationId,
        turnId: input.turnId,
        clientRequestId: `language-projection:${input.turnId}:INPUT_TO_FRENCH`,
        testSessionId: null,
      },
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
    providerCallRecords: requested?.providerCallRecords ?? [],
  };
};

const localizeCanonicalFrenchResponse = async (input: {
  state: Readonly<ConversationLanguageGatewayState>;
  sourceTurnRef: string;
  responseId: string;
  canonicalFrenchResponse: string;
  sessionId: string;
  conversationId: string;
  onProviderCallRecords?: (records: readonly ProviderCallRecord[]) => void;
}): Promise<{
  response: LocalizedConversationResponse;
  state: ConversationLanguageGatewayState;
  providerCalls: 0 | 1;
  providerCallRecords: readonly ProviderCallRecord[];
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
      onProviderCallRecords: input.onProviderCallRecords,
      observabilityContext: {
        sessionId: input.sessionId,
        conversationId: input.conversationId,
        turnId: input.sourceTurnRef,
        clientRequestId: `language-projection:${input.responseId}:OUTPUT_FROM_FRENCH`,
        testSessionId: null,
      },
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
    providerCallRecords: requested?.providerCallRecords ?? [],
  };
};

type PreparedGatewayUserInput = Readonly<{
  originalText: string;
  workingText: string;
  turnId: string;
  createdAt: string;
  multilingualTurn: MultilingualUserTurn;
  gatewayState: ConversationLanguageGatewayState;
  onProviderCallRecords: (records: readonly ProviderCallRecord[]) => void;
}>;

type NaturalContributionDecisionContext = Readonly<{
  userTurn: ScientificInterpretationTurn;
  originalText: string;
  gatewayState: ConversationLanguageGatewayState;
  traceLedger: FunctionalResetSession["scientificExecutionTraceLedger"];
  stylePreference: ConversationStylePreference | null;
  selectedChangeRefs?: readonly string[];
  refusedChangeRefs?: readonly string[];
  correctionChangeRefs?: readonly string[];
  prepareRemainingTurn?: boolean;
}>;

const normalizePreparedUserInput = (input: string | PreparedGatewayUserInput) => typeof input === "string"
  ? {
    originalText: input,
    workingText: input,
    turnId: createTurnId(),
    createdAt: new Date().toISOString(),
    multilingualTurn: null,
    gatewayState: null,
    onProviderCallRecords: undefined,
  }
  : input;

const retainOwnerReviewedCandidate = (
  current: FunctionalResetSession,
  contribution: ScientificInterpretationContributionEnvelope,
  candidate: ReturnType<typeof prepareResearchProjectContributionCandidate>,
  userTurn: ScientificInterpretationTurn,
  traceRunId: string | null,
) => retainValidatedContributionCandidate({
  retained: current.retainedContributionCandidates ?? [],
  contribution,
  candidate,
  // This records PRJ's existing canonical/change-set and review-coverage gate;
  // it does not pretend that a provider extraction validated an owner proposal.
  validation: { valid: candidate.status === "CANDIDATE_PENDING_HUMAN_CONFIRMATION", blocks: [] },
  validatorRef: "PRJ001_CANONICAL_CHANGESET_AND_HUMAN_REVIEW_COVERAGE",
  sourceTurnRef: userTurn.turnId,
  baseProject: current.project,
  dependencyBindings: current.knowledgeOwnerLedger.entries
    .filter((entry) => entry.result && contribution.source.sourceRefs.includes(entry.result.resultId))
    .map((entry) => ({ ref: entry.result!.resultId, version: entry.result!.resultVersion,
      digest: ownerResultNativeDigest(entry.result)!, actuality: "CURRENT" as const })),
  traceRunId,
  retainedAt: userTurn.createdAt ?? new Date().toISOString(),
});

const documentBlockerSignals = (documents: FunctionalResetSession["documents"]) =>
  documents.cards.flatMap((card) => card.blockerGroups.map((group) => ({
    dimension: group.dimension,
    items: [...group.items],
  })));

const persistenceFailureMessage = (
  status: "NOT_REQUESTED" | "NO_CHANGE" | "CANDIDATE" | "BLOCKED" | "TECHNICAL_FAILURE",
  candidateStatus: ReturnType<typeof prepareResearchProjectContributionCandidate>["status"] | null,
  recordingRequested: boolean,
) => {
  if (!recordingRequested) return null;
  if (status === "TECHNICAL_FAILURE" || status === "BLOCKED"
    || candidateStatus === "BLOCKED_BY_STRUCTURAL_CONFLICT" || candidateStatus === "REVIEW_PROJECTION_INCOMPLETE")
    return "Je conserve la discussion, mais l’enregistrement n’a pas abouti.";
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
  previousScientificThinkingInteraction?: FunctionalResetSession["scientificThinkingInteraction"];
};

const resolvePostAdoptionContinuationJob = async (
  job: PostAdoptionContinuationJob,
  onProviderCallRecords: (records: readonly ProviderCallRecord[]) => void,
) => {
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
      previousInteraction: job.previousScientificThinkingInteraction,
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
    observabilityContext: {
      sessionId: job.sessionId,
      conversationId: job.conversationId,
      turnId: [...job.runtimeTurns].reverse().find((candidate) => candidate.role === "USER")?.turnId ?? null,
      clientRequestId: `product-bridge:${[...job.runtimeTurns].reverse().find((candidate) => candidate.role === "USER")?.turnId ?? "NO_USER_TURN"}:POST_ADOPTION_QRY_CONTINUATION`,
      testSessionId: null,
    },
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
  onProviderCallRecords(continuation.observability.providerCalls ?? []);
  const visible = resolveGovernedPostAdoptionReceipt({ response: continuation, project: job.project, realizedAt });
  return {
    kind: "QUESTION" as const, // Existing conversation branch discriminant; the native WHAT may be non-interrogative.
    turn: { ...continuation.assistantTurn, content: visible.content, createdAt: realizedAt },
    ...visible,
  };
};

type ProtocolDesignerWorkspaceProps = Readonly<{
  traceCaptureConfiguration?: ScientificTraceCaptureConfiguration;
  initialSession?: FunctionalResetSession;
  onSessionChange?: (session: FunctionalResetSession) => boolean | void;
  onLeaveWorkspace?: () => void;
  onEditAdministration?: () => void;
  onNewProject?: () => void;
  onOpenProfile?: () => void;
  onRenameProject?: () => void;
}>;

const VALIDATED_CANDIDATE_DEGRADED_REPLY = "J’ai identifié plusieurs éléments dans votre projet. Voici ce que j’ai compris ; vous pouvez les corriger avant toute confirmation.";

export default function ProtocolDesignerWorkspace({
  traceCaptureConfiguration = DEFAULT_SCIENTIFIC_TRACE_CAPTURE_CONFIGURATION,
  initialSession, onSessionChange, onLeaveWorkspace, onEditAdministration, onNewProject, onOpenProfile, onRenameProject,
}: ProtocolDesignerWorkspaceProps) {
  const [session, setSession] = useState<FunctionalResetSession>(() => initialSession ?? loadInitialSession());
  const administration = useMemo(() => session.workspace
    ? documentAdministrationFrom(session.projectId, session.workspace) : undefined, [session.projectId, session.workspace]);
  const autonomousProjectBuild = import.meta.env.VITE_AUTONOMOUS_PROJECT_BUILD === "ON";
  const [workingDraftBusy, setWorkingDraftBusy] = useState(false);
  const [workingProjectOpen, setWorkingProjectOpen] = useState(false);
  const backgroundDraftJobRef = useRef<Promise<void> | null>(null);
  const pendingBackgroundJobsRef = useRef(0);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const foregroundInFlightRef = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);
  const latestSessionRef = useRef(session);
  useEffect(() => { latestSessionRef.current = session; }, [session]);
  const [projectionMode, setProjectionMode] = useState<"STANDARD" | "EXPERT">("STANDARD");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyMessage, setBusyMessage] = useState("NOXIA vous répond…");
  const [correctionMode, setCorrectionMode] = useState(false);
  const [deliverableWorkspaceOpen, setDeliverableWorkspaceOpen] = useState(false);
  const [documentSaveWarning, setDocumentSaveWarning] = useState<string | null>(null);
  const documentRecoveryRef = useRef<{ projectDigest: string; resume: () => Promise<void> } | null>(null);
  const [sourceLibraryOpen, setSourceLibraryOpen] = useState(false);
  const [documentMessage, setDocumentMessage] = useState("");
  const [documentGenerationPending, setDocumentGenerationPending] = useState(false);
  const documentGenerationInFlightRef = useRef(false);
  const [documentGenerationStartedAt, setDocumentGenerationStartedAt] = useState<number | null>(null);
  const [documentGenerationElapsed, setDocumentGenerationElapsed] = useState(0);
  const [documentGenerationVersion, setDocumentGenerationVersion] = useState(1);
  const [documentGenerationComplete, setDocumentGenerationComplete] = useState(false);
  const [documentProgressExpanded, setDocumentProgressExpanded] = useState(true);
  const [postAdoptionContinuationJob, setPostAdoptionContinuationJob] = useState<PostAdoptionContinuationJob | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const conversationScrollRef = useRef<HTMLDivElement>(null);
  const [conversationScrolled, setConversationScrolled] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const latestReplyRef = useRef<HTMLElement>(null);
  const confirmationInFlightRef = useRef<string | null>(null);
  const mixedTurnInFlightRef = useRef<string | null>(null);

  useEffect(() => {
    if (documentGenerationStartedAt === null || !documentGenerationPending) return;
    const refresh = () => setDocumentGenerationElapsed(Math.floor((Date.now() - documentGenerationStartedAt) / 1000));
    refresh();
    const timer = window.setInterval(refresh, 1000);
    return () => window.clearInterval(timer);
  }, [documentGenerationPending, documentGenerationStartedAt]);

  useEffect(() => {
    if (!documentGenerationComplete || documentGenerationPending) return;
    const timer = window.setTimeout(() => setDocumentGenerationComplete(false), 8000);
    return () => window.clearTimeout(timer);
  }, [documentGenerationComplete, documentGenerationPending]);

  useEffect(() => {
    const textarea = composerRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, Math.min(window.innerWidth < 640 ? window.innerHeight * 0.28 : window.innerHeight * 0.35, 12 * 22))}px`;
  }, [draft]);

  useEffect(() => {
    try {
      if (onSessionChange) onSessionChange(session);
      else persistFunctionalResetSession(window.localStorage, session);
    } catch (error) {
      if (!session.drciDraftPacks?.length) throw error;
      setDocumentSaveWarning("Documents disponibles mais non enregistrés dans ce navigateur. Exportez le dossier avant de fermer cette page.");
    }
    if (import.meta.env.DEV && session.bridgeTraces.length > 0) {
      console.debug("NOXIA_PRODUCT_BRIDGE_TRACE", JSON.stringify(session.bridgeTraces.at(-1)));
    }
  }, [session, onSessionChange]);

  useEffect(() => {
    if (!postAdoptionContinuationJob) return;
    let active = true;
    const job = postAdoptionContinuationJob;
    const observedProviderCalls: ProviderCallRecord[] = [];
    let observationTurnId = job.runtimeTurns.at(-1)?.turnId ?? `continuation:${job.project.versionId}`;
    void resolvePostAdoptionContinuationJob(job, (records) => { observedProviderCalls.push(...records); }).then((continuation) => {
      if (!active || !continuation) return;
      observationTurnId = continuation.turn.turnId;
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
      observedProviderCalls.push(...providerRecordsFromError(error));
      const failedAt = new Date().toISOString();
      setSession((current) => ({
        ...current,
        entries: [...current.entries, {
          entryId: createConversationEntryId(),
          kind: "ERROR",
          role: "NOXIA",
          content: isScientificThinkingQueryDispatch(job.queryNavigation)
            ? "Les propositions scientifiques n’ont pas pu être préparées à partir de cette version du projet. Le projet reste inchangé."
            : isObservabilityQueryDispatch(job.queryNavigation)
              ? "Les besoins d’observation et de mesure n’ont pas pu être qualifiés à partir de cette version du projet. Le projet reste inchangé."
            : isImagingQueryDispatch(job.queryNavigation)
              ? "La stratégie d’imagerie n’a pas pu être préparée à partir de cette version du projet. Le projet reste inchangé."
            : isBiostatisticsQueryDispatch(job.queryNavigation)
              ? "Les stratégies analytiques n’ont pas pu être préparées à partir de cette version du projet. Le projet reste inchangé."
            : isCanonicalStudyDataQueryDispatch(job.queryNavigation)
              ? "Les données attendues n’ont pas pu être représentées à partir de cette version du projet. Le projet reste inchangé."
            : isDataManagementQueryDispatch(job.queryNavigation)
              ? "La gestion opérationnelle des données n’a pas pu être préparée à partir du résultat courant. Le projet reste inchangé."
            : isStudyDesignQueryDispatch(job.queryNavigation)
              ? "Les stratégies d’étude n’ont pas pu être préparées à partir de cette version du projet. Le projet reste inchangé."
              : "NOXIA n’a pas pu présenter la prochaine étape. Vous pouvez poursuivre librement.",
          createdAt: failedAt,
        }],
        updatedAt: failedAt,
      }));
      if (import.meta.env.DEV) console.error("NOXIA_POST_ADOPTION_CONTINUATION_FAILURE", error);
    }).finally(() => {
      if (!active) return;
      setSession((current) => appendFunctionalResetProviderCallRecords(current, {
        turnId: observationTurnId, traceRunId: job.traceRunId ?? undefined,
        requestKind: "POST_ADOPTION_QRY_CONTINUATION", records: observedProviderCalls,
      }));
      setPostAdoptionContinuationJob((current) => current === job ? null : current);
      setBusy(false);
    });
    return () => { active = false; };
  }, [postAdoptionContinuationJob]);

  useEffect(() => {
    if (!busy && import.meta.env.VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME === "TERRA")
      latestReplyRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    else endRef.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
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
    if (requiresCurrentOwnerPresentation(content)
      && [...session.runtimeTurns].reverse().find((turn) => turn.role === "NOXIA")?.turnId !== interaction.presentationTurnRef) return false;
    if (!scientificThinkingInteractionMatchesCurrentProject(interaction, project)) {
      setSession((current) => ({
        ...current,
        scientificThinkingInteraction: current.scientificThinkingInteraction
          ? { ...current.scientificThinkingInteraction, status: "STALE", staleReason: "SOURCE_PROJECT_VERSION_CHANGED" }
          : null,
      }));
      return false;
    }
    const candidateContext = interaction.selectionAnchor ?? interaction;
    const output = readScientificThinkingOutputFromLedger({
      ledger: session.knowledgeOwnerLedger,
      resultRef: candidateContext.ownerResultRef,
    });
    if (!output) return false;
    const resolution = resolveScientificThinkingConversation({ raw: content, output,
      presentedCandidateRefs: candidateContext.presentedCandidateRefs ?? [],
    });
    if (resolution.kind === "FALLTHROUGH") return false;
    const recordedAt = prepared.createdAt;
    const userTurn: ScientificInterpretationTurn = {
      turnId: prepared.turnId,
      role: "USER",
      content: prepared.originalText,
      createdAt: recordedAt,
    };
    const priorProposalTurn = session.runtimeTurns.find((turn) => turn.turnId === candidateContext.presentationTurnRef);
    // A retained owner result is not proof that this proposal was presented.
    if (!priorProposalTurn || priorProposalTurn.role !== "NOXIA") return false;
    const proposalTurn: ScientificInterpretationTurn = priorProposalTurn;
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
        traceRunId: candidateContext.traceRunId,
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
        retainedContributionCandidates: retainOwnerReviewedCandidate(current, contribution, candidate, userTurn, candidateContext.traceRunId),
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
          traceRunId: candidateContext.traceRunId,
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
      onProviderCallRecords: prepared.onProviderCallRecords,
      sessionId: session.sessionId,
      conversationId: session.conversationId,
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
      traceRunId: candidateContext.traceRunId,
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
    if (requiresCurrentOwnerPresentation(content)
      && [...session.runtimeTurns].reverse().find((turn) => turn.role === "NOXIA")?.turnId !== interaction.presentationTurnRef) return false;
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
        retainedContributionCandidates: retainOwnerReviewedCandidate(current, contribution, candidate, userTurn, interaction.traceRunId),
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
      onProviderCallRecords: prepared.onProviderCallRecords,
      sessionId: session.sessionId,
      conversationId: session.conversationId,
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
    if (requiresCurrentOwnerPresentation(content)
      && [...session.runtimeTurns].reverse().find((turn) => turn.role === "NOXIA")?.turnId !== interaction.presentationTurnRef) return false;
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
        retainedContributionCandidates: retainOwnerReviewedCandidate(current, contribution, candidate, userTurn, interaction.traceRunId),
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
      onProviderCallRecords: prepared.onProviderCallRecords,
      sessionId: session.sessionId,
      conversationId: session.conversationId,
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
    if (requiresCurrentOwnerPresentation(content)
      && [...session.runtimeTurns].reverse().find((turn) => turn.role === "NOXIA")?.turnId !== interaction.presentationTurnRef) return false;
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
        retainedContributionCandidates: retainOwnerReviewedCandidate(current, contribution, candidate, userTurn, interaction.traceRunId),
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
      onProviderCallRecords: prepared.onProviderCallRecords,
      sessionId: session.sessionId,
      conversationId: session.conversationId,
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
    if (requiresCurrentOwnerPresentation(content)
      && [...session.runtimeTurns].reverse().find((turn) => turn.role === "NOXIA")?.turnId !== interaction.presentationTurnRef) return false;
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
        retainedContributionCandidates: retainOwnerReviewedCandidate(current, contribution, candidate, userTurn, interaction.traceRunId),
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
      onProviderCallRecords: prepared.onProviderCallRecords,
      sessionId: session.sessionId,
      conversationId: session.conversationId,
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
    await submitText(draft.trim());
  };
  const updateBackgroundWorkingDraft = (foreground: FunctionalResetSession, userTurn: ScientificInterpretationTurn) => {
    const previousJob = backgroundDraftJobRef.current;
    pendingBackgroundJobsRef.current += 1;
    setWorkingDraftBusy(true);
    setSession(state => state.sessionId === foreground.sessionId
      ? recordWorkingDraftPreparation(state, userTurn.turnId, "PREPARING") : state);
    const job = (async () => {
      if (previousJob) await previousJob;
      const records: ProviderCallRecord[] = [];
      try {
        const current = latestSessionRef.current;
        // A later turn supersedes this queued request before any provider dispatch.
        if (current.sessionId !== foreground.sessionId || [...current.runtimeTurns].reverse().find(t => t.role === "USER")?.turnId !== userTurn.turnId) {
          setSession(state => state.sessionId === foreground.sessionId
            ? recordWorkingDraftPreparation(state, userTurn.turnId, "SUPERSEDED", "WORKING_DRAFT_STALE_TURN") : state);
          return;
        }
        const response = await requestProtocolDesignerBridge({ conversation: { conversationId: current.conversationId, language: "fr", turns: current.runtimeTurns },
          currentProject: current.project, evaluatePersistentDelta: false, prepareWorkingDraft: true,
          workingDraftHistory: (current.workingDraft?.history ?? []).filter(h => h.status === "REJECTED"),
          ...(current.studyProposal?.state === "CURRENT" ? { studyProposalContext: current.studyProposal } : {}),
          observabilityContext: { sessionId: current.sessionId, conversationId: current.conversationId, turnId: userTurn.turnId,
            clientRequestId: `working-draft:${userTurn.turnId}`, testSessionId: null } });
        records.push(...response.observability.providerCalls ?? []);
        if (!response.workingStudyProposal || !response.workingDraftUpdate) {
          setSession(state => {
            if (state.sessionId !== current.sessionId) return state;
            if ([...state.runtimeTurns].reverse().find(t => t.role === "USER")?.turnId !== userTurn.turnId)
              return recordWorkingDraftPreparation(state, userTurn.turnId, "SUPERSEDED", "WORKING_DRAFT_STALE_TURN");
            const code = response.workingDraftUpdate?.requestType === "STUDY_UPDATE"
              ? "WORKING_DRAFT_PROPOSAL_MISSING" : "WORKING_DRAFT_NO_CONFIRMABLE_UPDATE";
            const failed = recordWorkingDraftPreparation(state, userTurn.turnId, "FAILED", code);
            return { ...failed, workingDraftFailure: code,
              workingDraft: state.workingDraft ? { ...state.workingDraft, sourceUserTurnRef: userTurn.turnId, failure: code } : null };
          });
          return;
        }
        {
          const state = latestSessionRef.current;
          const lastUser = [...state.runtimeTurns].reverse().find(t => t.role === "USER");
          if (state.sessionId !== current.sessionId || state.project?.versionId !== current.project?.versionId
            || lastUser?.turnId !== userTurn.turnId && !isWorkingDraftReviewOnlyRequest(lastUser?.content ?? "")) {
            setSession(latest => latest.sessionId === current.sessionId
              ? recordWorkingDraftPreparation(latest, userTurn.turnId, "SUPERSEDED", "WORKING_DRAFT_STALE_CONTEXT") : latest);
            return;
          }
          const composition = response.workingStudyProposal!;
          const workingDraft = prepareContinuousWorkingDraft(current, composition, response.workingDraftUpdate!, composition.proposal.contextDigest);
          const prepared = workingDraft.readyReview;
          const oldReviewRef = state.workingDraft?.readyReview?.contribution.identity.contributionId;
          const previousRetained = oldReviewRef ? markContributionCandidateNonCurrent({ retained: state.retainedContributionCandidates ?? [],
            candidateRef: oldReviewRef, actuality: "SUPERSEDED", reasonRef: userTurn.turnId, recordedAt: new Date().toISOString() }) : state.retainedContributionCandidates ?? [];
          const retained = prepared ? retainValidatedContributionCandidate({ retained: previousRetained,
            ...prepared, validation: { valid: true, blocks: [] }, validatorRef: "STUDY_PROPOSAL_AND_PRJ_OWNER",
            sourceTurnRef: userTurn.turnId, baseProject: state.project, dependencyBindings: [], traceRunId: null, retainedAt: new Date().toISOString() }) : previousRetained;
          const openReview = prepared && isExplicitProjectRecordingRequest(userTurn.content) && !isWorkingDraftReviewOnlyRequest(userTurn.content);
          const outcome = prepared && !workingDraft.failure ? state
            : recordWorkingDraftPreparation(state, userTurn.turnId, "FAILED", workingDraft.failure ?? "WORKING_REVIEW_NOT_READY");
          const next = { ...outcome, studyProposal: composition, workingDraft,
            workingDraftFailure: prepared && !workingDraft.failure ? null : workingDraft.failure ?? "WORKING_REVIEW_NOT_READY",
            pendingContribution: openReview ? prepared.contribution : state.pendingContribution?.identity.contributionId === oldReviewRef ? null : state.pendingContribution,
            currentContribution: openReview ? prepared.contribution : state.currentContribution,
            entries: openReview ? [...state.entries, { entryId: createConversationEntryId(), kind: "REVIEW" as const, role: "NOXIA" as const,
              contribution: prepared.contribution, candidate: prepared.candidate, status: "PENDING" as const, createdAt: new Date().toISOString() }] : state.entries,
            retainedContributionCandidates: retained, updatedAt: new Date().toISOString() };
          latestSessionRef.current = next;
          setSession(latest => latest.sessionId === next.sessionId
            ? { ...next, workingDraftPreparations: latest.workingDraftPreparations ?? next.workingDraftPreparations }
            : latest);
        }
      } catch (error) {
        if (error instanceof ProductBridgeClientError) records.push(...error.observability?.providerCalls ?? []);
        const durableFailure = [...records].reverse().find(record => record.status === "FAILED" && record.durableFailure)
          ?.durableFailure;
        setSession(state => {
          if (state.sessionId !== foreground.sessionId) return state;
          if ([...state.runtimeTurns].reverse().find(turn => turn.role === "USER")?.turnId !== userTurn.turnId)
            return recordWorkingDraftPreparation(state, userTurn.turnId, "SUPERSEDED", "WORKING_DRAFT_STALE_TURN");
          let scientificExecutionTraceLedger = state.scientificExecutionTraceLedger;
          if (durableFailure) {
            const code = durableFailure.structuredErrorCode ?? "PUBLIC_PROVIDER_FAILURE_UNCLASSIFIED";
            try {
              scientificExecutionTraceLedger = recordProductErrorBoundary({
                ledger: scientificExecutionTraceLedger,
                traceRunId: createProductTraceRunId(state.sessionId, userTurn.turnId),
                turnId: userTurn.turnId,
                conversationId: state.conversationId,
                startedAt: userTurn.createdAt,
                failedAt: new Date().toISOString(),
                owner: "CONVERSATION_MODEL",
                responsibilityOwner: "DURABLE_PROVIDER_GUARD",
                executor: "POSTGRES_DURABLE_PROVIDER_GUARD",
                componentId: "WORKING_DRAFT_PROVIDER_OPERATION",
                componentVersion: "1.0.0",
                provider: durableFailure.generationProvider,
                code,
                category: "OWNER_RUNTIME",
                project: state.project,
                durableFailure,
                captureConfiguration: traceCaptureConfiguration,
              });
            } catch { /* Diagnostic capture must not change the Working Draft failure behavior. */ }
          }
          const code = error instanceof ProductBridgeClientError ? error.code : "WORKING_DRAFT_FAILED";
          const unknown = code.includes("UNKNOWN_AFTER_DISPATCH")
            || ["UNKNOWN_AFTER_DISPATCH", "COUNT_UNKNOWN_AFTER_DISPATCH"].includes(durableFailure?.lastConfirmedDurableState ?? "")
            || records.some(record => record.status === "FAILED" && ["TIMEOUT", "NETWORK_FAILURE"].includes(record.failureReason ?? ""));
          const failed = recordWorkingDraftPreparation(state, userTurn.turnId,
            unknown ? "UNKNOWN/INTERRUPTED" : "FAILED", code);
          return { ...failed, scientificExecutionTraceLedger,
            workingDraftFailure: error instanceof Error ? error.message : "WORKING_DRAFT_FAILED",
            workingDraft: state.workingDraft ? { ...state.workingDraft, failure: error instanceof Error ? error.message : "WORKING_DRAFT_FAILED" } : state.workingDraft };
        });
        console.warn("WORKING_DRAFT_PREPARATION_FAILED", durableFailure?.structuredErrorCode ?? "UNCLASSIFIED");
      } finally {
        setSession(state => state.sessionId !== foreground.sessionId ? state : appendFunctionalResetProviderCallRecords(state,
          { turnId: userTurn.turnId, traceRunId: createProductTraceRunId(state.sessionId, userTurn.turnId), requestKind: "USER_TURN", records }));
        pendingBackgroundJobsRef.current = Math.max(0, pendingBackgroundJobsRef.current - 1);
        setWorkingDraftBusy(pendingBackgroundJobsRef.current > 0);
      }
    })();
    backgroundDraftJobRef.current = job;
    void job.finally(() => { if (backgroundDraftJobRef.current === job) backgroundDraftJobRef.current = null; });
  };
  const submitTerraText = async (content: string, prepareRecording = false, continuedTurn?: ScientificInterpretationTurn,
    reviewConfirmation?: { binding: ProjectReviewInvitation; selectedChangeRefs?: readonly string[]; refusedChangeRefs?: readonly string[];
      prepareRemainingTurn?: boolean }, pendingConfirmation: ReturnType<typeof readNaturalCandidateDecision> = null) => {
    if (foregroundInFlightRef.current) return;
    foregroundInFlightRef.current = true;
    const requestedSessionId = latestSessionRef.current.sessionId;
    setBusy(true);
    setBusyMessage("NOXIA réfléchit…");
    if (!mountedRef.current || latestSessionRef.current.sessionId !== requestedSessionId) {
      foregroundInFlightRef.current = false; setBusy(false); return;
    }
    const session = latestSessionRef.current;
    const now = new Date().toISOString();
    const lastTurn = session.runtimeTurns.at(-1), lastEntry = session.entries.at(-1);
    const retry = !continuedTurn && lastTurn?.role === "USER" && lastTurn.content === content
      && lastEntry?.kind === "ERROR" && lastEntry.turnId === lastTurn.turnId;
    const userTurn: ScientificInterpretationTurn = continuedTurn ?? (retry ? lastTurn : { turnId: createTurnId(), role: "USER", content, createdAt: now });
    const traceRunId = createProductTraceRunId(session.sessionId, userTurn.turnId);
    const runtimeTurns = continuedTurn || retry ? session.runtimeTurns : [...session.runtimeTurns, userTurn];
    const requestTurns = continuedTurn && runtimeTurns.at(-1)?.role === "NOXIA"
      && runtimeTurns.at(-2)?.turnId === continuedTurn.turnId ? runtimeTurns.slice(0, -1) : runtimeTurns;
    setDraft(""); setBusy(true); setBusyMessage("NOXIA réfléchit…");
    setSession(current => {
      const withReceipt = pendingConfirmation?.act === "CONFIRM" && !retry && !continuedTurn && !reviewConfirmation
        ? recordConversationConfirmationReceipt(current, userTurn, pendingConfirmation) : current;
      return { ...withReceipt, pendingMixedUserTurnRef: null, runtimeTurns, entries: [...current.entries,
        ...(!retry && !continuedTurn ? [{ entryId: createConversationEntryId(), kind: "TEXT" as const, role: "USER" as const, content, createdAt: now }] : [])], updatedAt: now };
    });
    const records: ProviderCallRecord[] = [];
    try {
      const discussion = buildScientificDiscussionContext({ retained: session.retainedContributionCandidates ?? [],
        currentProject: session.project, conversationId: session.conversationId, runtimeTurns: requestTurns,
        selectedReviewRef: session.pendingContribution?.identity.contributionId ?? null });
      const response = await requestProtocolDesignerBridge({ conversation: { conversationId: session.conversationId, language: "fr", turns: requestTurns },
        ...(autonomousProjectBuild && session.studyProposal?.state === "CURRENT" ? { studyProposalContext: session.studyProposal } : {}),
        currentProject: session.project, evaluatePersistentDelta: prepareRecording,
        scientificDiscussionContext: discussion,
        ...(session.project && session.queryNavigation ? { currentNavigation: currentGovernedNavigationInput({
          project: session.project, navigation: session.queryNavigation, ownerResultLedger: session.knowledgeOwnerLedger }) } : {}),
        observabilityContext: { sessionId: session.sessionId, conversationId: session.conversationId,
          turnId: userTurn.turnId, clientRequestId: `product-bridge:${userTurn.turnId}`, testSessionId: null } });
      records.push(...response.observability.providerCalls ?? []);
      const latest = latestSessionRef.current;
      if (latest.sessionId !== session.sessionId || latest.project?.versionId !== session.project?.versionId) {
        throw new Error("Le projet a changé pendant cette réponse. Rouvrez son état courant ; aucune décision n'a été appliquée.");
      }
      const receivedAt = new Date().toISOString();
      // Deliver native Chat text before any local transaction preparation. A
      // rejected candidate must never erase or replace this conversational turn.
      const delivered: FunctionalResetSession = { ...latest, pendingMixedUserTurnRef: null,
        runtimeTurns: response.conversationFailure ? runtimeTurns : [...runtimeTurns, response.assistantTurn],
        entries: [...latest.entries, { entryId: createConversationEntryId(), kind: response.conversationFailure ? "ERROR" : "TEXT",
          role: "NOXIA", content: response.assistantReply, createdAt: receivedAt,
          ...(response.conversationFailure ? { turnId: userTurn.turnId, failureCode: response.conversationFailure.code } : {}) }], updatedAt: receivedAt };
      latestSessionRef.current = delivered;
      setSession(delivered);
      if (response.conversationFailure) setDraft(current => current || content);
      if (autonomousProjectBuild && !response.conversationFailure) {
        if (reviewConfirmation) {
          const adopted = await confirmProject(content, reviewConfirmation.selectedChangeRefs,
            reviewConfirmation.refusedChangeRefs, false, userTurn, reviewConfirmation.binding);
          // The compound turn already reached Chat. Prepare its distinct new
          // scientific content against the adopted Project without replaying it
          // as a second user message or eliciting a duplicate Chat answer.
          if (adopted && reviewConfirmation.prepareRemainingTurn) updateBackgroundWorkingDraft(adopted, userTurn);
        } else updateBackgroundWorkingDraft(delivered, userTurn);
      }
      const contribution = prepareRecording ? response.persistentExtraction.contribution : null;
      let candidate: ReturnType<typeof prepareResearchProjectContributionCandidate> | null = null;
      let retained = session.retainedContributionCandidates;
      let preparationFailed = false;
      try {
        candidate = contribution ? prepareResearchProjectContributionCandidate(contribution, session.project) : null;
        if (contribution && candidate?.status === "CANDIDATE_PENDING_HUMAN_CONFIRMATION")
          retained = retainValidatedContributionCandidate({ retained: session.retainedContributionCandidates ?? [],
            contribution, candidate, validation: response.persistentExtraction.validation,
            validatorRef: "PERSISTENT_PROJECT_DELTA_AND_PRJ_CONTRIBUTION_V1", sourceTurnRef: userTurn.turnId,
            baseProject: session.project, dependencyBindings: [], traceRunId, retainedAt: receivedAt });
      } catch (error) {
        preparationFailed = true;
        candidate = null;
        console.warn("PROJECT_REVIEW_PREPARATION_FAILED", error);
      }
      const reviewable = !preparationFailed && contribution && candidate?.status === "CANDIDATE_PENDING_HUMAN_CONFIRMATION";
      setSession(current => ({ ...current, currentContribution: !preparationFailed && contribution ? contribution : current.currentContribution,
        pendingContribution: reviewable ? contribution : current.pendingContribution,
        retainedContributionCandidates: reviewable ? retained : current.retainedContributionCandidates,
        entries: [...current.entries,
          ...(reviewable ? [{ entryId: createConversationEntryId(), kind: "REVIEW" as const, role: "NOXIA" as const,
            contribution, candidate, traceRunId, status: "PENDING" as const, createdAt: receivedAt }] : []),
          ...(prepareRecording && !reviewable ? [{ entryId: createConversationEntryId(), kind: "ERROR" as const,
            role: "NOXIA" as const, content: !preparationFailed && response.persistentExtraction.status === "NO_CHANGE"
              ? "Aucun nouveau changement à enregistrer. Le projet adopté est conservé."
              : "Je conserve la discussion, mais l’enregistrement n’a pas abouti.", createdAt: receivedAt }] : [])],
        bridgeTraces: [...current.bridgeTraces, { turnId: userTurn.turnId, traceRunId, requestKind: "USER_TURN" as const,
          raw: content, assistantReply: response.assistantReply, conversationFailure: response.conversationFailure,
          persistentExtractionCalled: response.persistentExtraction.called,
          persistentExtractionStatus: response.persistentExtraction.status, persistentExtractionFailure: response.persistentExtraction.failure,
          providerArtifact: response.persistentExtraction.providerArtifact, wireCandidate: response.persistentExtraction.wireCandidate,
          persistentCandidate: response.persistentExtraction.candidate, deterministicValidation: response.persistentExtraction.validation,
          projectChangeSetCandidate: candidate?.changeSet ?? null, canonicalProjectChangeSetCandidate: candidate?.canonicalChangeSet ?? null,
          humanReviewProjection: candidate?.humanReviewProjection ?? null, humanDecision: null,
          projectVersionBefore: session.project?.versionId ?? null, projectVersionAfter: current.project?.versionId ?? null,
          qryNeedBefore: null, qryNeedAfter: null, provider: response.observability.provider, model: response.observability.model,
          conversationLatencyMs: response.observability.conversationLatencyMs, extractionLatencyMs: response.observability.extractionLatencyMs,
          calls: response.observability.calls, projectWriteCount: 0, protocolProjectionCount: 0 }].slice(-20), updatedAt: receivedAt }));
    } catch (error) {
      if (error instanceof ProductBridgeClientError) records.push(...error.observability?.providerCalls ?? []);
      setDraft(current => current || content);
      setSession(current => ({ ...current, entries: [...current.entries, { entryId: createConversationEntryId(), kind: "ERROR",
        role: "NOXIA", content: error instanceof Error ? error.message : "La réponse n'a pas abouti. Votre message et le projet sont conservés.",
        turnId: userTurn.turnId, failureCode: error instanceof ProductBridgeClientError ? error.code : "CONVERSATION_CLIENT_FAILURE",
        createdAt: new Date().toISOString() }] }));
    } finally {
      setSession(current => appendFunctionalResetProviderCallRecords(current, { turnId: userTurn.turnId,
        traceRunId, requestKind: "USER_TURN", records }));
      setBusy(false);
      foregroundInFlightRef.current = false;
    }
  };
  const submitText = async (content: string, continuedTurn?: ScientificInterpretationTurn) => {
    if (!content || busy) return;
    if (import.meta.env.VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME === "TERRA") {
      if (continuedTurn) {
        await submitTerraText(content, false, continuedTurn);
        return;
      }
      const current = latestSessionRef.current;
      const checkpoint = !workingDraftBusy && !current.workingDraftFailure && validatePreparedWorkingReview(current);
      const naturalDecision = readNaturalCandidateDecision(content);
      const confirmsThenContinues = naturalDecision?.act === "CONFIRM" && naturalDecision.separableContinuation;
      const normalizedDecision = content.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr-FR").trim().replace(/[.!]+$/u, "");
      const confirmsWholeCheckpoint = naturalDecision?.act === "CONFIRM"
        && (!naturalDecision.qualified || confirmsThenContinues);
      const exceptPoint = /^(?:(?:je )?(?:valide|confirme) )?tout sauf (?:le )?point (\d+)$/u.exec(normalizedDecision);
      const binding = checkpoint ? projectReviewInvitation(current, checkpoint) : null;
      if (checkpoint && exceptPoint) {
        const ordinal = Number(exceptPoint[1]);
        const displayedRef = reviewDecisionRefsInDisplayOrder(checkpoint.candidate)[ordinal - 1];
        const group = displayedRef ? contributionDecisionScopeGroups(checkpoint.candidate, current.project)
          .find(refs => refs.includes(displayedRef)) : undefined;
        const selected = group ? checkpoint.candidate.humanReviewProjection.coveredChangeRefs.filter(ref => !group.includes(ref)) : [];
        await submitTerraText(content, false, undefined, group && selected.length && binding
          ? { binding, selectedChangeRefs: selected, refusedChangeRefs: group } : undefined);
        return;
      }
      if (checkpoint && confirmsWholeCheckpoint && binding) {
        await submitTerraText(content, false, undefined, { binding, prepareRemainingTurn: confirmsThenContinues });
        return;
      }
      // Every submitted message reaches Chat, including early assent, refusal,
      // correction and review-only requests. A button remains the reference
      // transaction when the scientific review is ready.
      await submitTerraText(content, autonomousProjectBuild ? false : isExplicitProjectRecordingRequest(content),
        undefined, undefined, autonomousProjectBuild && workingDraftBusy ? naturalDecision : null);
      return;
    }
    const now = new Date().toISOString();
    if (continuedTurn) setSession(current => ({ ...current, pendingMixedUserTurnRef: null }));
    setDraft("");
    setCorrectionMode(false);
    setBusyMessage(session.project ? "Je vérifie les éléments déjà fournis…" : "Je structure votre projet…");
    setBusy(true);
    const turnId = continuedTurn?.turnId ?? createTurnId();
    const traceRunId = createProductTraceRunId(session.sessionId, continuedTurn ? `${turnId}:mixed-preparation` : turnId);
    let preparedGatewaySnapshot: Awaited<ReturnType<typeof prepareMultilingualUserTurn>> | null = null;
    let retainedThisTurn: RetainedContributionCandidate | null = null;
    let contextualActionPresentation: StandardConversationActionGroupPresentation | null = null;
    let currentProjectImpactProjection: NonNullable<ReturnType<typeof buildCurrentProjectImpactProjection>> | null = null;
    let governedRealizationOutcome: ScientificTraceRealizationOutcome | undefined;
    let busyLifecycleDelegated = false;
    const observedProviderCalls: ProviderCallRecord[] = [];
    const onProviderCallRecords = (records: readonly ProviderCallRecord[]) => { observedProviderCalls.push(...records); };
    let downstreamStage = "CONFORMANCE";
    try {
      const originalGatewayTurn = continuedTurn && session.conversationLanguageGateway.turns.find(turn => turn.turnId === continuedTurn.turnId);
      const preparedGateway = originalGatewayTurn
        ? { turn: originalGatewayTurn, state: session.conversationLanguageGateway, providerCalls: 0 as const, providerCallRecords: [] }
        : await prepareMultilingualUserTurn({ session, turnId, originalText: content, onProviderCallRecords });
      preparedGatewaySnapshot = preparedGateway;
      const preparedInput: PreparedGatewayUserInput = {
        originalText: content,
        workingText: preparedGateway.turn.frenchWorkingText ?? content,
        turnId,
        createdAt: now,
        multilingualTurn: preparedGateway.turn,
        gatewayState: preparedGateway.state,
        onProviderCallRecords,
      };
      const proposalCorrection = Boolean(session.studyProposal && recognizeCurrentProjectDirection(preparedInput.workingText, true) === "MODIFY_EXISTING_PROJECT_OBJECT");
      const currentProjectDirection = correctionMode && session.project
        ? "MODIFY_EXISTING_PROJECT_OBJECT"
        : recognizeCurrentProjectDirection(preparedInput.workingText, session.project !== null);
      const userTurn: ScientificInterpretationTurn = continuedTurn ?? { turnId, role: "USER", content, createdAt: now };
      const runtimeTurns = continuedTurn ? session.runtimeTurns : [...session.runtimeTurns, userTurn];
      const boundedReferentContext = buildBoundedConversationReferentContext({
        retained: session.retainedContributionCandidates ?? [], currentProject: session.project,
        conversationId: session.conversationId, runtimeTurns,
        selectedReviewRef: session.pendingContribution?.identity.contributionId ?? null,
        requestingTurnRef: userTurn.turnId,
      });
      const scientificDiscussionContext = buildScientificDiscussionContext({
        retained: session.retainedContributionCandidates ?? [], currentProject: session.project,
        conversationId: session.conversationId, runtimeTurns,
        selectedReviewRef: session.pendingContribution?.identity.contributionId ?? null,
      });
      const boundedInteraction = selectBoundedConversationInteraction({
        sourceText: preparedInput.workingText, correctionMode: correctionMode || proposalCorrection || Boolean(continuedTurn), referentContext: boundedReferentContext,
      });
      const visibleProposalDecision = readNaturalCandidateDecision(preparedInput.workingText);
      const adoptsVisibleProposal = Boolean(boundedReferentContext.visibleProposal
        && boundedReferentContext.visibleProposal.options.length === 1
        && visibleProposalDecision?.act === "CONFIRM" && !visibleProposalDecision.qualified
        && boundedInteraction?.kind === "ACKNOWLEDGE_USER_DIRECTION"
        && boundedInteraction.evidenceRefs.includes(boundedReferentContext.visibleProposal.options[0]!.ref));
      // Explicit Project direction outranks an owner-driven continuation. The
      // router only recognizes the operation; extraction and PRJ validation
      // still resolve the stable scientific target and prepare the candidate.
      // Resolve current candidate decisions and QRY-owned purposes first. An
      // active scientific result is not authority to consume another act.
      if (currentProjectDirection === "NONE"
        && !requestsScientificExplanation(preparedInput.workingText)
        && !isUserFeedbackOnAssistantOutput(preparedInput.workingText)
        && !isExternalEvidenceRequest(preparedInput.workingText)
        && (!boundedInteraction
        || boundedInteraction.kind === "EXPLAIN_REFERENCED_CONTENT"
        || boundedInteraction.clarificationReason === "PAST_PROPOSAL_REFERENCE")) {
        if (await applyScientificThinkingInput(preparedInput)) return;
        if (await applyStudyDesignInput(preparedInput)) return;
        if (await applyObservabilityInput(preparedInput)) return;
        if (await applyImagingInput(preparedInput)) return;
        if (await applyBiostatisticsInput(preparedInput)) return;
      }
      const productDocumentAction = recognizeProductDocumentAction(preparedInput.workingText);
      if (productDocumentAction) {
        setSession((current) => ({ ...current, conversationLanguageGateway: preparedGateway.state }));
        setSession((current) => ({ ...current, runtimeTurns: [...current.runtimeTurns, userTurn] }));
        dispatchProductDocumentAction(productDocumentAction, { content, createdAt: now });
        return;
      }
      if ((boundedInteraction?.kind === "USER_CONFIRMS_CURRENT_CANDIDATE"
        || boundedInteraction?.kind === "USER_REFUSES_CURRENT_CANDIDATE")
        && boundedReferentContext.candidateRef) {
        const naturalDecision: NaturalContributionDecisionContext = {
          userTurn,
          originalText: content,
          gatewayState: preparedGateway.state,
          stylePreference: detectConversationStylePreference(preparedInput.workingText),
          selectedChangeRefs: boundedInteraction.selectedChangeRefs,
          refusedChangeRefs: boundedInteraction.refusedChangeRefs,
          correctionChangeRefs: boundedInteraction.correctionChangeRefs,
          prepareRemainingTurn: boundedInteraction.prepareRemainingTurn,
          traceLedger: recordConversationLanguageGatewayTrace({
            ledger: session.scientificExecutionTraceLedger,
            traceRunId,
            conversationId: session.conversationId,
            turn: preparedGateway.turn,
            observedAt: now,
            captureConfiguration: traceCaptureConfiguration,
          }),
        };
        if (boundedInteraction.kind === "USER_CONFIRMS_CURRENT_CANDIDATE") {
          busyLifecycleDelegated = Boolean(await confirmContribution(boundedReferentContext.candidateRef, naturalDecision));
        } else {
          rejectContribution(boundedReferentContext.candidateRef, naturalDecision);
          setBusy(false);
        }
        return;
      }
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
        currentProjectAvailable: session.project !== null,
        explicitCorrectionMode: correctionMode || proposalCorrection || Boolean(continuedTurn) || Boolean(boundedInteraction?.correctionChangeRefs?.length),
        adoptsVisibleProposal,
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
        openDocumentProjectionId: null,
        pendingMixedUserTurnRef: null,
        queryNavigation,
        runtimeTurns,
        conversationLanguageGateway: preparedGateway.state,
        scientificExecutionTraceLedger: entryTraceLedger,
        entries: [
          ...session.entries,
          ...(!continuedTurn ? [{ entryId: createConversationEntryId(), kind: "TEXT" as const, role: "USER" as const, content, createdAt: now }] : []),
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
          onProviderCallRecords,
          sessionId: session.sessionId,
          conversationId: session.conversationId,
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

      const documentaryIntent = resolveDocumentaryIntent(preparedInput.workingText);
      if (session.project && !["PROJECT_CHANGE", "NOT_DOCUMENTARY"].includes(documentaryIntent.kind)) {
        handleDocumentInstruction(preparedInput.workingText, false, userTurn.turnId);
        return;
      }

      const naturalConversationActs = classifyNaturalConversationActs(preparedInput.workingText);
      if ((entryRouting.currentProjectDirection === "PRESERVE_EXISTING_PROJECT"
        && !isProjectStateQuestion(preparedInput.workingText)
        && !naturalConversationActs.includes("NEW_INFORMATION")
        && !naturalConversationActs.includes("CLARIFICATION_RESPONSE"))
        || boundedInteraction?.kind === "CLARIFY_CANDIDATE_REFERENCE") {
        const answeredAt = new Date().toISOString();
        const assistantReply = boundedInteraction?.kind === "CLARIFY_CANDIDATE_REFERENCE"
          ? boundedInteraction.clarificationText ?? (boundedInteraction.clarificationReason === "PAST_PROPOSAL_REFERENCE"
            ? "Quelle option souhaitez-vous reprendre ? Précisez son libellé ou son numéro dans la liste concernée."
            : boundedInteraction.clarificationReason === "DECISION_SCOPE"
              ? "Quels éléments confirmez-vous, et lesquels souhaitez-vous modifier ou refuser ?"
              : boundedReferentContext.resolution === "AMBIGUOUS"
            ? "Quelle proposition souhaitez-vous confirmer ou refuser ?"
            : "Quelle proposition souhaitez-vous confirmer ou refuser ?")
          : "D’accord. Le projet courant reste inchangé.";
        const localized = await localizeCanonicalFrenchResponse({
          state: preparedGateway.state,
          onProviderCallRecords,
          sessionId: session.sessionId,
          conversationId: session.conversationId,
          sourceTurnRef: userTurn.turnId,
          responseId: `conversation-response:${userTurn.turnId}`,
          canonicalFrenchResponse: assistantReply,
        });
        const assistantTurn: ScientificInterpretationTurn = {
          turnId: createTurnId(), role: "NOXIA", content: assistantReply, createdAt: answeredAt,
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
          runtimeTurns: [...runtimeTurns, assistantTurn],
          entries: [...current.entries, {
            entryId: createConversationEntryId(), kind: "TEXT", role: "NOXIA",
            content: localized.response.localizedResponse, createdAt: answeredAt,
          }],
          bridgeTraces: [...current.bridgeTraces, {
            ...emptyTraceMaterial,
            assistantReply: captureProductBridgeTraceText({ value: localized.response.localizedResponse, field: "ASSISTANT_REPLY" }),
            provider: "PRODUCT_ENTRY_ROUTER",
            model: "DETERMINISTIC_LOCAL",
            conversationLatencyMs: 0,
            calls: preparedGateway.providerCalls + localized.providerCalls,
            languageGatewayCalls: preparedGateway.providerCalls + localized.providerCalls,
            knowledgeResultRef: null,
            knowledgeResultDigest: null,
          }].slice(-20),
          conversationLanguageGateway: localized.state,
          scientificExecutionTraceLedger,
          updatedAt: answeredAt,
        }));
        return;
      }

      const requestedProposalNavigation = () => {
        if (boundedInteraction?.kind !== "USER_REQUESTS_ASSISTED_PROPOSAL" || !session.project) return null;
        const proposalNavigation = attachCurrentKnowledgePrerequisiteWhenRequired({
          project: session.project,
          navigation: buildFunctionalResetQueryNavigation({
            project: session.project,
            previous: session.queryNavigation,
            documentBlockers: documentBlockerSignals(session.documents),
            recordedAt: now,
            forceRebuild: true,
            requestedAction: "ASSISTED_PROPOSAL",
            requestedServiceInput: { sourceTurnRef: userTurn.turnId, sourceText: preparedInput.workingText },
            dataOwnerState: deriveFunctionalResetDataOwnerState({ project: session.project, ledger: session.knowledgeOwnerLedger }),
          }),
        });
        const existingOwnerCanPropose = isScientificThinkingQueryDispatch(proposalNavigation)
          || isStudyDesignQueryDispatch(proposalNavigation)
          || isObservabilityQueryDispatch(proposalNavigation)
          || isImagingQueryDispatch(proposalNavigation)
          || isBiostatisticsQueryDispatch(proposalNavigation);
        return existingOwnerCanPropose ? proposalNavigation : null;
      };
      const delegateAssistedProposal = (
        proposalNavigation: NonNullable<ReturnType<typeof requestedProposalNavigation>>,
        ledger: typeof entryTraceLedger,
      ) => {
        if (!session.project) return;
        // Both entry paths share the same QRY selection and owner continuation.
        // The continuation owns the busy lifecycle until its result settles.
        busyLifecycleDelegated = true;
        setSession((current) => ({ ...current, queryNavigation: proposalNavigation, updatedAt: now }));
        setBusyMessage("Je prépare des propositions à partir du projet confirmé…");
        setPostAdoptionContinuationJob({
          sessionId: session.sessionId,
          conversationId: session.conversationId,
          project: session.project,
          queryNavigation: proposalNavigation,
          ownerResultLedger: session.knowledgeOwnerLedger,
          scientificExecutionTraceLedger: ledger,
          runtimeTurns,
          feedback: content,
          traceRunId,
          previousScientificThinkingInteraction: session.scientificThinkingInteraction,
        });
      };
      const directProposalNavigation = !entryRouting.projectConstructionEligible
        ? requestedProposalNavigation() : null;
      // Assisted owner actions remain available through QRY; free discussion
      // now reaches the existing Bridge Scientific Thinking conversation.

      const answerReadOnlyInteraction = async (completedBridge?: Awaited<ReturnType<typeof requestProtocolDesignerBridge>>) => {
        const knowledge = executeProductUnderstandInteraction({ raw: preparedInput.workingText, decision: entryRouting, createdAt: now,
          currentProject: session.project, retained: session.retainedContributionCandidates });
        const answeredAt = new Date().toISOString();
        const localized = await localizeCanonicalFrenchResponse({
          state: preparedGateway.state,
          onProviderCallRecords,
          sessionId: session.sessionId,
          conversationId: session.conversationId,
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
            provider: knowledge.responsibilityOwner ?? "KNOWLEDGE",
            model: knowledge.responsibilityOwner && knowledge.responsibilityOwner !== "KNOWLEDGE" ? "CURRENT_PROJECT_READ_ONLY" : "KE-001@1.2.1",
            conversationLatencyMs: completedBridge?.observability.conversationLatencyMs ?? 0,
            persistentExtractionCalled: completedBridge?.persistentExtraction.called ?? false,
            persistentExtractionStatus: completedBridge?.persistentExtraction.status ?? "NOT_REQUESTED",
            entryRouting,
            calls: (completedBridge?.observability.calls ?? 0) + preparedGateway.providerCalls + localized.providerCalls,
            languageGatewayCalls: preparedGateway.providerCalls + localized.providerCalls,
            knowledgeResultRef: knowledge.knowledgeResultRef,
            knowledgeResultDigest: knowledge.knowledgeResultDigest,
          }].slice(-20),
          conversationLanguageGateway: localized.state,
          scientificExecutionTraceLedger,
          updatedAt: answeredAt,
        }));
      };
      if (session.project && isProjectStateQuestion(preparedInput.workingText)
        && !isUserFeedbackOnAssistantOutput(preparedInput.workingText)
        && !isExternalEvidenceRequest(preparedInput.workingText)) {
        await answerReadOnlyInteraction();
        return;
      }
      // Scientific discussion is not conditional on a Knowledge match.

      const preProjectNavigation = session.project
        ? undefined
        : buildPreProjectNavigationDecision({ routing: entryRouting });
      const bridgeRequest: Omit<ProductBridgeRequest, "apiVersion"> = {
        requestKind: "USER_TURN",
        observabilityContext: {
          sessionId: session.sessionId,
          conversationId: session.conversationId,
          turnId: userTurn.turnId,
          clientRequestId: `product-bridge:${userTurn.turnId}`,
          testSessionId: null,
        },
        conversation: {
          conversationId: session.conversationId,
          language: "fr",
          turns: runtimeTurns,
          ...(entryRouting.currentProjectDirection === "MODIFY_EXISTING_PROJECT_OBJECT"
            || entryRouting.currentProjectDirection === "ADD_PROJECT_OBJECT" ? {
            interactionContext: {
              interactionRef: `project-correction:${userTurn.turnId}`,
              sourceActionRef: queryNavigation?.currentAction?.selectedActionId ?? null,
              owner: "RESEARCH_PROJECT",
              purpose: "Préparer une modification candidate du Research Project courant à partir du dernier message utilisateur, sans adoption.",
              expectedResponseKind: "SCIENTIFIC_CORRECTION" as const,
              targetRefs: queryNavigation?.currentAction?.targetRef ? [queryNavigation.currentAction.targetRef] : [],
              informationNeedRefs: [...(queryNavigation?.currentAction?.navigationNeedRefs ?? [])],
              projectRef: session.project?.projectId ?? null,
              projectVersion: session.project?.versionId ?? null,
              projectDigest: session.project?.projectDigest ?? null,
            },
          } : queryNavigation?.currentAction && queryNavigation.currentPresentation ? {
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
        scientificDiscussionContext,
        ...(session.studyProposal ? { studyProposalContext: session.studyProposal } : {}),
        ...(boundedInteraction ? { boundedInteraction } : {}),
        ...(session.conversationPreferences?.responseLength === "CONCISE"
          ? { conversationPresentation: { responseLength: "CONCISE" as const } }
          : {}),
        languageBoundary: languageBoundaryFor(preparedGateway.state),
        // Routing governs Project eligibility. Conversation-only turns remain
        // usable, but cannot trigger persistent extraction.
        evaluatePersistentDelta: entryRouting.projectConstructionEligible && !asksForExplanationOrRephrase,
      };
      const assertSubmissionContextCurrent = () => {
        const latest = latestSessionRef.current;
        if (latest.sessionId !== session.sessionId || latest.conversationId !== session.conversationId
          || latest.project?.projectId !== session.project?.projectId
          || latest.project?.versionId !== session.project?.versionId
          || latest.project?.projectDigest !== session.project?.projectDigest) {
          throw new ProductBridgeClientError("SUBMISSION_CONTEXT_CHANGED",
            "Le contexte a changé pendant le traitement. Cette réponse n’a pas été appliquée ; le projet courant et les décisions déjà enregistrées sont conservés.");
        }
      };
      const response = await requestProtocolDesignerBridge(bridgeRequest);
      onProviderCallRecords(response.observability.providerCalls ?? []);
      assertSubmissionContextCurrent();
      const receivedAt = new Date().toISOString();
      const extractedContribution = entryRouting.projectConstructionEligible
        ? response.persistentExtraction.contribution
        : null;
      // An independent new candidate does not supersede/merge an older one by
      // recency. Both identities remain retained; this turn presents its receipt.
      const contribution = extractedContribution;
      const candidate = contribution ? prepareResearchProjectContributionCandidate(contribution, session.project) : null;
      const effectiveCandidate = (!response.scientificConversation?.studyProposal || response.scientificConversation.studyProposal.recomputation) && candidate?.status === "CANDIDATE_PENDING_HUMAN_CONFIRMATION" ? candidate : null;
      const scientificThinkingIntervention = !response.scientificConversation && !session.project && effectiveCandidate && contribution
        ? buildPreProjectScientificThinkingIntervention({
          contribution,
          sessionId: session.sessionId,
          sourceJourney: entryRouting.routeIntent === "DOCUMENT" ? "FORMALIZE_IDEA" : entryRouting.routeIntent,
          reasoning: response.contextualReasoning,
          conversationTurns: bridgeRequest.conversation.turns,
        })
        : null;
      const enrichedPreProjectNavigation = preProjectNavigation && scientificThinkingIntervention?.navigationContributions.length
        ? buildPreProjectNavigationDecision({
          routing: entryRouting,
          scientificContributions: scientificThinkingIntervention.navigationContributions,
          contextualUnderstanding: scientificThinkingIntervention.contextualUnderstanding,
          sourceText: content,
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
      const providerContext = response.scientificConversation?.providerInput.context ?? naturalConversationContext(realizedBridgeRequest);
      if (candidate?.status === "CANDIDATE_PENDING_HUMAN_CONFIRMATION" && contribution) {
        const retained = retainValidatedContributionCandidate({
          retained: [], contribution, candidate,
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
      if (retainedThisTurn && boundedInteraction?.kind === "ACKNOWLEDGE_USER_DIRECTION"
        && boundedInteraction.correctionChangeRefs?.length && boundedReferentContext.candidateRef) {
        const originalRecord = session.retainedContributionCandidates?.find(record => record.candidateRef === boundedReferentContext.candidateRef);
        if (originalRecord) {
          const remainder = retainUndecidedContributionScope({ record: originalRecord, currentBefore: session.project,
            currentAfter: session.project, settledChangeRefs: boundedInteraction.correctionChangeRefs,
            decisionSourceRef: userTurn.turnId, retainedAt: receivedAt });
          const remainderEntryId = remainder ? createConversationEntryId() : null;
          setSession(current => ({ ...current, retainedContributionCandidates: [...markContributionCandidateNonCurrent({
            retained: current.retainedContributionCandidates ?? [], candidateRef: originalRecord.candidateRef,
            actuality: "SUPERSEDED", reasonRef: userTurn.turnId, recordedAt: receivedAt,
          }), ...(remainder ? [remainder] : [])], entries: [...current.entries,
            ...(remainder ? [{ entryId: remainderEntryId!, kind: "REVIEW" as const, role: "NOXIA" as const,
              contribution: remainder.contribution, candidate: remainder.candidate, status: "PENDING" as const, createdAt: receivedAt }] : [])] }));
        }
      }
      const explicitCurrentProjectChange = entryRouting.currentProjectDirection === "MODIFY_EXISTING_PROJECT_OBJECT"
        || entryRouting.currentProjectDirection === "ADD_PROJECT_OBJECT";
      if (session.project && retainedThisTurn && !explicitCurrentProjectChange) {
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
      if (!response.scientificConversation && !enrichedPreProjectNavigation && (response.currentTurnNavigation || response.conversationFailure)) {
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
      // A mixed statement/request first traverses extraction. Only a successful
      // empty delta may resume the same proposal purpose; a candidate, blocked
      // extraction or technical failure must retain its own lifecycle.
      const deferredProposalNavigation = !response.scientificConversation && response.persistentExtraction.status === "NO_CHANGE"
        && !contribution && !candidate && !response.conversationFailure
        ? requestedProposalNavigation() : null;
      if (deferredProposalNavigation) queryNavigation = deferredProposalNavigation;
      if (!response.scientificConversation && !deferredProposalNavigation && session.project && !explicitCurrentProjectChange
        && response.persistentExtraction.status === "NO_CHANGE" && !contribution && !candidate
        && !response.conversationFailure) {
        // Product Entry's deferred path shares the same read-only owner as its
        // direct path. A validated empty delta is required: errors and actual
        // candidates never become an invented scientific answer.
        await answerReadOnlyInteraction(response);
        return;
      }
      const structuredUnderstanding = visibleStructuredUnderstandingEvidence({
        contribution: effectiveCandidate ? contribution : null,
        sourceTurnRef: userTurn.turnId,
        explicitDimensions: entryRouting.explicitScientificDimensions,
      });
      const preProjectRealization = response.scientificConversation ? null : !enrichedPreProjectNavigation && response.governedRealization ? {
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
      const candidateScientificChallenge = !response.scientificConversation && effectiveCandidate
        ? buildCandidateScientificChallenge(effectiveCandidate)
        : null;
      const baseCanonicalAssistantReply = validatedCandidateDegradedPath
        ? VALIDATED_CANDIDATE_DEGRADED_REPLY
        : preProjectRealization?.assistantReply ?? response.assistantReply;
      const canonicalAssistantReply = candidateScientificChallenge
        ? `${baseCanonicalAssistantReply}\n\n${candidateScientificChallenge}`
        : baseCanonicalAssistantReply;
      const canonicalAssistantTurn = { ...response.assistantTurn, content: canonicalAssistantReply };
      downstreamStage = "LOCALIZATION";
      const localized = await localizeCanonicalFrenchResponse({
        state: preparedGateway.state,
        onProviderCallRecords,
        sessionId: session.sessionId,
        conversationId: session.conversationId,
        sourceTurnRef: userTurn.turnId,
        responseId: `conversation-response:${userTurn.turnId}`,
        canonicalFrenchResponse: canonicalAssistantReply,
      });
      assertSubmissionContextCurrent();
      const visibleAssistantReply = localized.response.localizedResponse;
      const standaloneAssistantReplyVisible = Boolean(response.scientificConversation) || !deferredProposalNavigation
        && !(explicitCurrentProjectChange && effectiveCandidate && contribution);
      downstreamStage = "PRESENTATION";
      if (response.scientificConversation) governedRealizationOutcome = {
        contract: "SCIENTIFIC_TRACE_REALIZATION_OUTCOME", contractVersion: "1.0.0",
        declarationSource: "STRUCTURED_COMPONENT_OUTPUT",
        attemptedProvider: response.observability.conversationCalls === 1 ? response.observability.provider : "NONE",
        providerResponseReceived: response.observability.conversationResponseReceived === true,
        providerResponseAccepted: response.scientificConversation.responseOwner === "LLM",
        providerRejectionReason: response.scientificConversation.fallbackReason ?? "NONE",
        effectiveExecutor: response.scientificConversation.responseOwner === "LLM" ? "GEMINI_CONVERSATION_MODEL" : "LOCAL_DETERMINISTIC_REALIZATION",
        fallbackReason: response.scientificConversation.fallbackReason ?? "NONE",
      };
      const preProjectTrace = !response.scientificConversation && response.currentTurnNavigation && !enrichedPreProjectNavigation ? null : createPreProjectScientificTraceSegment({
        sessionId: session.sessionId,
        sourceTurnRef: userTurn.turnId,
        traceRunId,
        sourceText: content,
        routing: entryRouting,
        request: response.scientificConversation ? {
          ...realizedBridgeRequest, preProjectNavigation: undefined, governedRealization: undefined,
          conversation: { ...realizedBridgeRequest.conversation, interactionContext: undefined },
        } : realizedBridgeRequest,
        providerBoundary: {
          systemInstruction: response.scientificConversation?.providerInput.systemInstruction ?? NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
          context: providerContext,
          assistantReply: canonicalAssistantReply,
          provider: response.scientificConversation?.responseOwner === "DETERMINISTIC" ? "NONE" : preProjectRealization?.provider ?? response.observability.provider,
          model: response.scientificConversation?.responseOwner === "DETERMINISTIC" ? "LOCAL_WHAT_REALIZATION" : preProjectRealization?.model ?? response.observability.model,
          formulationOwner: response.scientificConversation?.responseOwner === "DETERMINISTIC" || preProjectRealization?.executor === "LOCAL_DETERMINISTIC_REALIZATION"
            ? "LOCAL_RUNTIME"
            : undefined,
          visibleStructuredUnderstandingDimensionRefs: structuredUnderstanding?.representedDimensionRefs,
          ...(response.scientificConversation ? { realizationOutcome: governedRealizationOutcome } : preProjectRealization ? {
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
      const failureMessage = persistenceFailureMessage(effectiveExtractionStatus, candidate?.status ?? null,
        isExplicitProjectRecordingRequest(content));
      let scientificExecutionTraceLedger = recordInitialProductTrace({
        ledger: entryTraceLedger,
        traceRunId,
        conversationId: session.conversationId,
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
          conversationId: session.conversationId,
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
        conversationId: session.conversationId,
        response: localized.response,
        observedAt: receivedAt,
      });
      const responseEntries: FunctionalResetSession["entries"] = [
          ...(standaloneAssistantReplyVisible ? [{
            entryId: createConversationEntryId(), kind: "TEXT" as const, role: "NOXIA" as const,
            content: visibleAssistantReply, createdAt: receivedAt,
          }] : []),
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
      ];
      setSession((current) => {
        return {
        ...current,
        queryNavigation,
        pendingMixedUserTurnRef: continuedTurn ? null : current.pendingMixedUserTurnRef,
        runtimeTurns: deferredProposalNavigation ? runtimeTurns : [...runtimeTurns, canonicalAssistantTurn],
        pendingContribution: effectiveCandidate && contribution ? contribution : current.pendingContribution,
        studyProposal: response.scientificConversation?.studyProposal ?? (effectiveCandidate && current.studyProposal
          ? requireStudyProposalReview(current.studyProposal, current.project) : current.studyProposal),
        retainedContributionCandidates: current.retainedContributionCandidates,
        entries: [...current.entries, ...responseEntries],
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
      if (deferredProposalNavigation) {
        delegateAssistedProposal(deferredProposalNavigation, scientificExecutionTraceLedger);
      }
    } catch (error) {
      const failedAt = new Date().toISOString();
      setDraft(current => current || content);
      onProviderCallRecords(providerRecordsFromError(error));
      const durableFailure = [...observedProviderCalls].reverse().find(record => record.status === "FAILED" && record.durableFailure)
        ?.durableFailure;
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
          responsibilityOwner: durableFailure ? "DURABLE_PROVIDER_GUARD" : languageGatewayFailed ? "LANGUAGE_GATEWAY" : "PRODUCT_BRIDGE",
          executor: languageGatewayFailed ? "OPENAI_LANGUAGE_PROJECTION" : "PRODUCT_BRIDGE_CLIENT",
          componentId: languageGatewayFailed ? "CONVERSATION_LANGUAGE_GATEWAY" : "PRODUCT_BRIDGE_CLIENT",
          componentVersion: "UNKNOWN",
          provider: durableFailure?.generationProvider ?? (languageGatewayFailed ? "OPENAI" : "UNKNOWN"),
          code: durableFailure?.structuredErrorCode ?? failureCode,
          category: languageGatewayFailed ? "BOUNDARY_REJECTION" : "UNKNOWN",
          sourceDigest: failure?.sourceTextDigest ?? "UNKNOWN",
          retainedCandidate: retainedThisTurn,
          realizationOutcome: governedRealizationOutcome,
          durableFailure,
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
      setSession((current) => appendFunctionalResetProviderCallRecords(current, {
        turnId, traceRunId, requestKind: "USER_TURN", records: observedProviderCalls,
      }));
      if (!busyLifecycleDelegated) setBusy(false);
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

  useEffect(() => {
    const ref = session.pendingMixedUserTurnRef;
    if (!ref || busy || mixedTurnInFlightRef.current === ref) return;
    const turn = session.runtimeTurns.find(turn => turn.turnId === ref && turn.role === "USER");
    if (!turn) return;
    mixedTurnInFlightRef.current = ref;
    void submitText(turn.content, turn).finally(() => { mixedTurnInFlightRef.current = null; });
    // The persisted reference resumes once; normal renders must not restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.pendingMixedUserTurnRef, busy]);

  const contributionHasAcknowledgedPresentation = (contributionId: string) => {
    const record = session.retainedContributionCandidates?.find((candidate) => candidate.candidateRef === contributionId);
    // This bounded guard does not change older review flows without a lifecycle receipt.
    return !record || (record.downstreamState === "PRESENTED" && record.presentedAt !== null
      && record.actuality === "CURRENT" && record.humanDecision === null);
  };

  const confirmContribution = async (
    contributionId: string,
    naturalDecision?: NaturalContributionDecisionContext,
    proposalSelection?: Readonly<{ composition: StudyProposalComposition; selectedOptions: readonly string[]; selectedAtoms: readonly string[];
      expectedDigest: string; contribution: ScientificInterpretationContributionEnvelope; candidate: ReturnType<typeof prepareResearchProjectContributionCandidate> }>,
  ) => {
    const session = latestSessionRef.current;
    if (busy && !naturalDecision) return false;
    if (confirmationInFlightRef.current === contributionId) return false;
    const contribution = proposalSelection?.contribution ?? session.pendingContribution;
    if (!contribution || contribution.identity.contributionId !== contributionId) return false;
    if (proposalSelection) {
      if (session.studyProposal?.digest !== proposalSelection.expectedDigest || proposalSelection.composition.digest !== proposalSelection.expectedDigest) return false;
      assertStudyProposalCurrent(proposalSelection.composition, latestSessionRef.current.project);
    } else if (!contributionHasAcknowledgedPresentation(contributionId)) return false;
    const now = new Date().toISOString();
    confirmationInFlightRef.current = contributionId;
    setBusyMessage("J’enregistre les éléments confirmés…");
    setBusy(true);
    try {
      const reviewEntry = proposalSelection ? { kind: "REVIEW" as const, candidate: proposalSelection.candidate, contribution,
        traceRunId: session.bridgeTraces.find(trace => trace.turnId === proposalSelection.composition.sourceTurnRef)?.traceRunId ?? null } : session.entries.find((entry) => entry.kind === "REVIEW" && entry.contribution.identity.contributionId === contributionId);
      const retainedBeforeDecision = proposalSelection && naturalDecision ? markContributionCandidatePresented({
        retained: retainOwnerReviewedCandidate(session, contribution, proposalSelection.candidate, naturalDecision.userTurn, reviewEntry?.kind === "REVIEW" ? reviewEntry.traceRunId ?? null : null),
        candidateRef: contributionId, presentedAt: now,
      }) : session.retainedContributionCandidates ?? [];
      const project = confirmResearchProjectContribution({
        contribution,
        current: session.project,
        projectId: session.projectId,
        authority: session.projectAuthority,
        confirmedAt: now,
        confirmationReason: naturalDecision
          ? naturalDecision.selectedChangeRefs
            ? `Décision partielle : changements confirmés ${naturalDecision.selectedChangeRefs.join(", ")} ; changements refusés ${(naturalDecision.refusedChangeRefs ?? []).join(", ")}.`
            : "L’utilisateur a explicitement confirmé la candidate courante dans son message."
          : undefined,
        confirmationSourceRefs: naturalDecision ? [naturalDecision.userTurn.turnId] : undefined,
        selectedChangeRefs: naturalDecision?.selectedChangeRefs,
        reviewedProjection: reviewEntry?.kind === "REVIEW"
          ? (reviewEntry.candidate ?? prepareResearchProjectContributionCandidate(reviewEntry.contribution, session.project)).humanReviewProjection
          : undefined,
      });
      const settledRefs = [...(naturalDecision?.selectedChangeRefs ?? []), ...(naturalDecision?.refusedChangeRefs ?? []), ...(naturalDecision?.correctionChangeRefs ?? [])];
      const originalRecord = retainedBeforeDecision.find(record => record.candidateRef === contributionId);
      const remainder = naturalDecision?.selectedChangeRefs && originalRecord ? retainUndecidedContributionScope({
        record: originalRecord, currentBefore: session.project, currentAfter: project, settledChangeRefs: settledRefs,
        decisionSourceRef: naturalDecision.userTurn.turnId, retainedAt: now,
      }) : null;
      const remainderEntryId = remainder ? createConversationEntryId() : null;
      let documents;
      try {
        documents = refreshFunctionalResetDocumentPortfolio({
          administration,
          project,
          previous: session.documents,
          requestedAt: now,
        });
      } catch (error) {
        documents = markFunctionalResetDocumentFailure(project, session.documents, error);
      }
      const queryNavigation = attachCurrentKnowledgePrerequisiteWhenRequired({ project, navigation: buildFunctionalResetQueryNavigation({
        project,
        previous: session.queryNavigation,
        documentBlockers: documentBlockerSignals(documents),
        recordedAt: now,
        dataOwnerState: deriveFunctionalResetDataOwnerState({ project, ledger: session.knowledgeOwnerLedger }),
      }) });
      const feedback = naturalDecision?.selectedChangeRefs
        && (naturalDecision.refusedChangeRefs?.length || naturalDecision.correctionChangeRefs?.length)
        ? naturalDecision.correctionChangeRefs?.length
          ? "Choix enregistrés dans le projet. Le critère reste à préciser : quelle formulation souhaitez-vous retenir ?"
          : "Choix enregistrés dans le projet. Les éléments refusés ne sont pas retenus."
        : buildConciseAdoptionReply({
        project,
        projectExisted: Boolean(session.project),
        stylePreference: naturalDecision?.stylePreference ?? null,
      });
      const confirmationTurn: ScientificInterpretationTurn = {
        turnId: createTurnId(),
        role: "NOXIA",
        content: feedback,
        createdAt: now,
      };
      const runtimeTurns = [
        ...session.runtimeTurns,
        ...(naturalDecision && !session.runtimeTurns.some(turn => turn.turnId === naturalDecision.userTurn.turnId)
          ? [naturalDecision.userTurn] : []),
        confirmationTurn,
      ];
      const correlatedTraceRunId = reviewEntry?.kind === "REVIEW" && reviewEntry.traceRunId
        ? reviewEntry.traceRunId
        : session.bridgeTraces.find((trace) => trace.projectChangeSetCandidate?.sourceContributionRef === contributionId)?.traceRunId;
      const scientificExecutionTraceLedger = recordProjectAdoptionTrace({
        ledger: naturalDecision?.traceLedger ?? session.scientificExecutionTraceLedger,
        traceRunId: correlatedTraceRunId,
        conversationId: session.conversationId,
        recordedAt: now,
        contribution,
        project,
        previousProjectExisted: Boolean(session.project),
        queryNavigation,
        documents,
      });
      const partialProposalSelection = Boolean(proposalSelection && naturalDecision?.selectedChangeRefs
        && naturalDecision.selectedChangeRefs.length < proposalSelection.candidate.humanReviewProjection.coveredChangeRefs.length);
      const updatedStudyProposal = partialProposalSelection && proposalSelection
        ? requireStudyProposalReview(proposalSelection.composition, project)
        : proposalSelection ? propagateStudyProposalDecision(proposalSelection.composition, project,
        selectedStudyProposalAtoms(proposalSelection.composition, proposalSelection.selectedOptions, proposalSelection.selectedAtoms), proposalSelection.selectedOptions, naturalDecision?.userTurn)
        : session.studyProposal ? propagateFreeformStudyProposalDecision(session.studyProposal, project, contribution, naturalDecision?.userTurn) : session.studyProposal;
      const current = latestSessionRef.current;
      if (current.sessionId !== session.sessionId || current.project?.versionId !== session.project?.versionId)
        throw new Error("PROJECT_CHANGED_DURING_HUMAN_REVIEW");
      const nextSession: FunctionalResetSession = {
        ...current,
        project,
        documentRetryUnsafe: false,
        queryNavigation,
        studyProposal: updatedStudyProposal,
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
        pendingContribution: remainder?.contribution ?? null,
        pendingMixedUserTurnRef: naturalDecision?.prepareRemainingTurn ? naturalDecision.userTurn.turnId : null,
        retainedContributionCandidates: [...recordContributionCandidateHumanDecision({
          retained: proposalSelection ? retainedBeforeDecision : current.retainedContributionCandidates ?? [], candidateRef: contributionId,
          decision: project.confirmationDecision,
        }), ...(remainder ? [remainder] : [])],
        runtimeTurns: naturalDecision
          ? [...current.runtimeTurns,
            ...(current.runtimeTurns.some(turn => turn.turnId === naturalDecision.userTurn.turnId) ? [] : [naturalDecision.userTurn]),
            confirmationTurn]
          : runtimeTurns,
        entries: [
          ...current.entries.map((entry) => entry.kind === "REVIEW" && entry.contribution.identity.contributionId === contributionId
            ? { ...entry, status: "CONFIRMED" as const, decision: project.confirmationDecision,
              ...(naturalDecision?.selectedChangeRefs ? { decisionPartition: { refused: naturalDecision.refusedChangeRefs ?? [], corrected: naturalDecision.correctionChangeRefs ?? [],
                pending: originalRecord?.candidate.humanReviewProjection.coveredChangeRefs.filter(ref => !settledRefs.includes(ref)) ?? [] } } : {}) }
            : entry),
          ...(remainder ? [{ entryId: remainderEntryId!, kind: "REVIEW" as const, role: "NOXIA" as const,
            contribution: remainder.contribution, candidate: remainder.candidate, status: "PENDING" as const, createdAt: now }] : []),
          ...(naturalDecision && !current.runtimeTurns.some(turn => turn.turnId === naturalDecision.userTurn.turnId) ? [{
            entryId: createConversationEntryId(),
            kind: "TEXT" as const,
            role: "USER" as const,
            content: naturalDecision.originalText,
            createdAt: naturalDecision.userTurn.createdAt,
          }] : []),
          { entryId: createConversationEntryId(), kind: "TEXT", role: "NOXIA", content: feedback, createdAt: now },
        ],
        bridgeTraces: current.bridgeTraces.map((trace) => trace.projectChangeSetCandidate?.sourceContributionRef === contributionId
          ? { ...trace, humanDecision: project.confirmationDecision, projectVersionAfter: project.versionId }
          : trace),
        scientificExecutionTraceLedger,
        conversationLanguageGateway: naturalDecision?.gatewayState ?? current.conversationLanguageGateway,
        conversationPreferences: naturalDecision?.stylePreference
          ? { responseLength: naturalDecision.stylePreference.responseLength, source: naturalDecision.stylePreference.source }
          : current.conversationPreferences,
        updatedAt: now,
      };
      if (onSessionChange?.(nextSession) === false) throw new Error("PROJECT_PERSISTENCE_FAILED");
      latestSessionRef.current = nextSession;
      setSession(nextSession);
      setReviewError(null);
      // Adoption remains owned and persisted locally; the immutable server copy
      // follows it. A subsequent bridge request waits for this same upload.
      if (import.meta.env.MODE !== "development") {
        void ensureServerProjectSnapshot(session.sessionId, project).catch(() => {
          // The next request reports a local snapshot error without dispatching a provider.
        });
      }

      // Project writes supply context; they never select another scientific
      // speaker. QRY/owner results remain available for an explicit request.
      return nextSession;
    } catch (error) {
      console.warn("PROJECT_CONFIRMATION_FAILED", error);
      const workingReview = autonomousProjectBuild && Boolean(proposalSelection);
      if (workingReview) setReviewError("La validation du projet n’a pas abouti. Les choix restent disponibles dans cette revue.");
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
        entries: workingReview ? current.entries : [...current.entries, {
          entryId: createConversationEntryId(), kind: "ERROR" as const, role: "NOXIA" as const,
          content: current.project?.versionId !== session.project?.versionId
            ? "Le projet est à jour, mais NOXIA n’a pas pu formuler la prochaine étape. Vous pouvez poursuivre librement."
            : "NOXIA n’a pas pu mettre à jour cette partie du projet. Votre contribution reste disponible pour réessayer.",
          createdAt: now,
        }],
        scientificExecutionTraceLedger,
        updatedAt: now,
      };
      });
      return null;
    } finally {
      confirmationInFlightRef.current = null;
      setBusy(false);
    }
  };

  const validateStudyProposal = async (selectedOptions: readonly string[], selectedAtoms: readonly string[], expectedDigest: string) => {
    const composition = session.studyProposal;
    if (busy || !composition || composition.digest !== expectedDigest) return;
    try {
      const now = new Date().toISOString();
      const selectedRefs = selectedStudyProposalAtoms(composition, selectedOptions, selectedAtoms);
      const labels = composition.proposal.atoms.filter(a => selectedRefs.includes(a.ref)).map(a => a.content);
      const userTurn: ScientificInterpretationTurn = { turnId: createTurnId(), role: "USER", content: `Je valide les propositions sélectionnées : ${labels.join(" ; ")}`, createdAt: now };
      const proposalTurn = session.runtimeTurns.find(t => t.role === "NOXIA" && t.turnId === composition.sourceResponseRef);
      if (!proposalTurn) throw new Error("STUDY_PROPOSAL_VISIBLE_TURN_NOT_FOUND");
      const contribution = buildStudyProposalSelectionContribution({ composition, selectedOptionRefs: selectedOptions, selectedAtomRefs: selectedAtoms,
        project: session.project, projectId: session.projectId, conversationId: session.conversationId, proposalTurn, selectionTurn: userTurn, createdAt: now });
      const candidate = prepareResearchProjectContributionCandidate(contribution, session.project);
      await confirmContribution(contribution.identity.contributionId, { userTurn, originalText: userTurn.content,
        gatewayState: session.conversationLanguageGateway, traceLedger: session.scientificExecutionTraceLedger,
        stylePreference: null, selectedChangeRefs: candidate.humanReviewProjection.coveredChangeRefs },
      { composition, selectedOptions, selectedAtoms, expectedDigest, contribution, candidate });
    } catch (error) {
      const message = error instanceof Error && error.message === "STUDY_PROPOSAL_DEPENDENCY_NOT_SELECTED"
        ? "Une proposition sélectionnée dépend d'un autre choix. Sélectionnez ce choix ou discutez une alternative ; rien n'a été enregistré."
        : "Ces choix n'ont pas pu être enregistrés. Les propositions et le projet confirmé sont conservés.";
      setSession(current => ({ ...current, entries: [...current.entries, { entryId: createConversationEntryId(), kind: "ERROR", role: "NOXIA", content: message, createdAt: new Date().toISOString() }] }));
    }
  };

  const disposeStudyProposal = (status: "REJECTED" | "DEFERRED", selectedOptions: readonly string[], selectedAtoms: readonly string[], digest: string) => {
    const composition = session.studyProposal;
    if (busy || !composition || composition.digest !== digest) return;
    try {
      const now = new Date().toISOString();
      const userTurn: ScientificInterpretationTurn = { turnId: createTurnId(), role: "USER", content: `${status === "REJECTED" ? "Je refuse" : "Je diffère"} uniquement les propositions sélectionnées.`, createdAt: now };
      const proposalTurn = session.runtimeTurns.find(t => t.role === "NOXIA" && t.turnId === composition.sourceResponseRef);
      if (!proposalTurn) throw new Error("STUDY_PROPOSAL_VISIBLE_TURN_NOT_FOUND");
      const atomRefs = selectedStudyProposalAtoms(composition, selectedOptions, selectedAtoms);
      const contribution = buildStudyProposalSelectionContribution({ composition, selectedOptionRefs: selectedOptions, selectedAtomRefs: selectedAtoms,
        project: session.project, projectId: session.projectId, conversationId: session.conversationId, proposalTurn, selectionTurn: userTurn, createdAt: now, disposition: status });
      const candidate = prepareResearchProjectContributionCandidate(contribution, session.project);
      const common = { contribution, current: session.project, authority: session.projectAuthority, selectedChangeRefs: candidate.humanReviewProjection.coveredChangeRefs, reviewedProjection: candidate.humanReviewProjection };
      const decision = status === "REJECTED" ? rejectResearchProjectContribution({ ...common, rejectedAt: now, rejectionSourceRefs: [userTurn.turnId] })
        : deferResearchProjectContribution({ ...common, deferredAt: now });
      const feedback = status === "REJECTED" ? "Les propositions sélectionnées ne sont pas retenues. Le projet confirmé est inchangé." : "Les propositions sélectionnées sont différées. Le projet confirmé est inchangé.";
      setSession(current => ({ ...current, studyProposal: projectStudyProposalDisposition(composition, decision, atomRefs, selectedOptions),
        retainedContributionCandidates: recordContributionCandidateHumanDecision({ retained: markContributionCandidatePresented({
          retained: retainOwnerReviewedCandidate(current, contribution, candidate, userTurn, null), candidateRef: contribution.identity.contributionId, presentedAt: now }),
        candidateRef: contribution.identity.contributionId, decision }),
        runtimeTurns: [...current.runtimeTurns, userTurn, { turnId: createTurnId(), role: "NOXIA", content: feedback, createdAt: now }],
        entries: [...current.entries, { entryId: createConversationEntryId(), kind: "TEXT", role: "USER", content: userTurn.content, createdAt: now },
          { entryId: createConversationEntryId(), kind: "TEXT", role: "NOXIA", content: feedback, createdAt: now }], updatedAt: now }));
    } catch { setSession(current => ({ ...current, entries: [...current.entries, { entryId: createConversationEntryId(), kind: "ERROR", role: "NOXIA", content: "Cette décision n'a pas été enregistrée. Le projet et les propositions sont conservés.", createdAt: new Date().toISOString() }] })); }
  };

  const rejectContribution = (
    contributionId: string,
    naturalDecision?: NaturalContributionDecisionContext,
  ) => {
    if (busy && !naturalDecision) return;
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
        rejectionSourceRefs: naturalDecision ? [naturalDecision.userTurn.turnId] : undefined,
        selectedChangeRefs: naturalDecision?.selectedChangeRefs,
        reviewedProjection: session.entries.find(entry => entry.kind === "REVIEW" && entry.contribution.identity.contributionId === contributionId)?.kind === "REVIEW"
          ? prepareResearchProjectContributionCandidate(contribution, session.project).humanReviewProjection : undefined,
      });
      const originalRecord = session.retainedContributionCandidates?.find(record => record.candidateRef === contributionId);
      const remainder = naturalDecision?.selectedChangeRefs && originalRecord ? retainUndecidedContributionScope({
        record: originalRecord, currentBefore: session.project, currentAfter: session.project,
        settledChangeRefs: naturalDecision.selectedChangeRefs, decisionSourceRef: naturalDecision.userTurn.turnId, retainedAt: now,
      }) : null;
      const remainderEntryId = remainder ? createConversationEntryId() : null;
      setSession((current) => {
        const reviewEntry = current.entries.find((entry) => entry.kind === "REVIEW"
          && entry.contribution.identity.contributionId === contributionId);
        const correlatedTraceRunId = reviewEntry?.kind === "REVIEW" && reviewEntry.traceRunId
          ? reviewEntry.traceRunId
          : current.bridgeTraces.find((trace) => trace.projectChangeSetCandidate?.sourceContributionRef === contributionId)?.traceRunId;
        const scientificExecutionTraceLedger = recordContributionRejectionTrace({
          ledger: naturalDecision?.traceLedger ?? current.scientificExecutionTraceLedger,
          traceRunId: correlatedTraceRunId,
          conversationId: current.conversationId,
          recordedAt: now,
          contribution,
          decision,
          project: current.project,
        });
        const rejectionReply = naturalDecision?.selectedChangeRefs ? "Les éléments refusés ne sont pas retenus. Les autres propositions restent en attente ; le projet confirmé est inchangé." : "Proposition refusée. Le projet confirmé reste inchangé.";
        const rejectionTurn: ScientificInterpretationTurn = {
          turnId: createTurnId(), role: "NOXIA", content: rejectionReply, createdAt: now,
        };
        return {
        ...current,
        studyProposal: current.studyProposal?.recomputation?.contributionRef === contributionId
          ? requireStudyProposalReview(current.studyProposal, current.project) : current.studyProposal,
        pendingContribution: remainder?.contribution ?? null,
        retainedContributionCandidates: [...recordContributionCandidateHumanDecision({
          retained: current.retainedContributionCandidates ?? [], candidateRef: contributionId, decision,
        }), ...(remainder ? [remainder] : [])],
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
        runtimeTurns: naturalDecision
          ? [...current.runtimeTurns, naturalDecision.userTurn, rejectionTurn]
          : current.runtimeTurns,
        entries: [
          ...current.entries.map((entry) => entry.kind === "REVIEW" && entry.contribution.identity.contributionId === contributionId
            ? { ...entry, status: "REJECTED" as const, decision,
              ...(naturalDecision?.selectedChangeRefs ? { decisionPartition: { refused: naturalDecision.selectedChangeRefs, corrected: [],
                pending: originalRecord?.candidate.humanReviewProjection.coveredChangeRefs.filter(ref => !naturalDecision.selectedChangeRefs!.includes(ref)) ?? [] } } : {}) }
            : entry),
          ...(remainder ? [{ entryId: remainderEntryId!, kind: "REVIEW" as const, role: "NOXIA" as const,
            contribution: remainder.contribution, candidate: remainder.candidate, status: "PENDING" as const, createdAt: now }] : []),
          ...(naturalDecision ? [{
            entryId: createConversationEntryId(), kind: "TEXT" as const, role: "USER" as const,
            content: naturalDecision.originalText, createdAt: naturalDecision.userTurn.createdAt,
          }, {
            entryId: createConversationEntryId(), kind: "TEXT" as const, role: "NOXIA" as const,
            content: rejectionReply, createdAt: now,
          }] : []),
        ],
        bridgeTraces: current.bridgeTraces.map((trace) => trace.projectChangeSetCandidate?.sourceContributionRef === contributionId
          ? { ...trace, humanDecision: decision, projectVersionAfter: current.project?.versionId ?? null }
          : trace),
        scientificExecutionTraceLedger,
        conversationLanguageGateway: naturalDecision?.gatewayState ?? current.conversationLanguageGateway,
        conversationPreferences: naturalDecision?.stylePreference
          ? { responseLength: naturalDecision.stylePreference.responseLength, source: naturalDecision.stylePreference.source }
          : current.conversationPreferences,
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
          content: "Ce refus n’a pas pu être enregistré. Le projet reste inchangé.",
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
      runtimeTurns: [...current.runtimeTurns, { turnId: createTurnId(), role: "NOXIA", content: input.assistantContent, createdAt: answeredAt }],
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
          ? "Des éléments d’étude confirmés sont nécessaires avant de pouvoir préparer les livrables."
          : "Des éléments d’étude confirmés sont nécessaires avant de pouvoir afficher un aperçu du protocole.",
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
        assistantContent: "Le protocole reflète déjà la version actuelle du projet.",
        projectionId,
      });
      return;
    }

    appendProductDocumentCommandResult({ command, assistantContent: "Ouvrez Protocole / documents, puis choisissez « Générer les documents » pour la version confirmée du projet." });
    setDeliverableWorkspaceOpen(true);
  }

  function acquireSources() {
    if (!session.project) return;
    try {
      const evidence = acquireDocumentKnowledge(session, new Date().toISOString());
      setSession((current) => ({ ...current, ...evidence }));
      setDocumentMessage(`${evidence.sourceLibrary.sources.length} source(s) du corpus local conservée(s). Les qualifications existantes sont distinctes de votre intérêt pour ces références.`);
    } catch {
      setDocumentMessage("Les sources ne peuvent pas être préparées dans cet état. Le projet et les documents sont conservés ; aucune recherche externe n’a été lancée.");
    }
  }

  function handleDocumentInstruction(instruction: string, recordUser = true, sourceTurnRef = createTurnId()) {
    const timestamp = new Date().toISOString();
    const intent = resolveDocumentaryIntent(instruction, true);
    const reply = (message: string, update: Partial<FunctionalResetSession> = {}) => {
      setDocumentMessage(message);
      setSession((current) => ({ ...current, ...update, updatedAt: timestamp,
        entries: [...current.entries, ...(recordUser ? [{ entryId: sourceTurnRef, kind: "TEXT" as const, role: "USER" as const, content: instruction, createdAt: timestamp }] : []),
          { entryId: createConversationEntryId(), kind: "TEXT" as const, role: "NOXIA" as const, content: message, createdAt: timestamp }],
      }));
    };
    if (intent.kind === "PROJECT_CHANGE") {
      setDocumentMessage("Cette instruction modifie la science du projet. Elle passe dans la conversation scientifique et exige votre revue avant adoption.");
      setSourceLibraryOpen(false); setDeliverableWorkspaceOpen(false);
      setSession((current) => ({ ...current, openDocumentProjectionId: null }));
      void submitText(instruction);
      return;
    }
    if (intent.kind === "CLARIFY" || intent.kind === "NOT_DOCUMENTARY") {
      reply("Précisez la section et la transformation demandées. La révision disponible porte sur l’introduction et ses références : développer, raccourcir, réorienter vers une source identifiée, ajouter ou retirer une référence. Aucune autre section n’a été modifiée.");
      return;
    }
    if (!session.project) { reply("Confirmez d’abord le projet scientifique pour lui associer des sources et un document."); return; }
    const projection = session.documents.projections.at(-1);
    if (projection && !isFunctionalDocumentProjectionCurrent(projection, session.project, administration)) {
      reply("Le document courant doit être régénéré depuis le Project avant une nouvelle révision. Les versions précédentes restent consultables."); return;
    }
    if (session.openDocumentProjectionId && projection && session.openDocumentProjectionId !== projection.projectionId) {
      reply("Cette version est historique. Ouvrez la version documentaire courante avant de la réviser."); return;
    }
    let retainedEvidence: ReturnType<typeof acquireDocumentKnowledge> | undefined;
    try {
      let evidence = acquireDocumentKnowledge(session, timestamp);
      retainedEvidence = evidence;
      if (intent.kind === "PREPARE_EVIDENCE") {
        reply("Les sources disponibles ont été préparées. Pour rédiger les documents, utilisez « Générer les documents ».", evidence);
        setSourceLibraryOpen(false);
        return;
      }
      if (["DIFF", "RESTORE"].includes(intent.kind)) {
        const previous = session.documents.projections.find((item) => item.projectionId === projection?.priorProjectionId);
        if (!projection || !previous) { reply("Il n’existe pas encore deux versions documentaires à comparer.", evidence); return; }
        if (intent.kind === "DIFF") { reply(readableDocumentDiff(previous, projection), evidence); return; }
        const restored = restoreDocumentRevision(projection, previous, { instruction, turnRef: sourceTurnRef, timestamp });
        const documents = refreshFunctionalResetDocumentPortfolio({ project: session.project, previous: { ...session.documents, projections: [...session.documents.projections, restored] }, administration, knowledgeLibrary: evidence.sourceLibrary, handoffDecision: session.documents.handoffDecision, requestedAt: timestamp });
        reply(`Le contenu de la version ${previous.projectionVersion} a été restauré dans une nouvelle version ${restored.projectionVersion}. Les versions antérieures et le Project sont conservés.`, { ...evidence, documents, openDocumentProjectionId: restored.projectionId }); return;
      }
      const resolution = resolveProjectSource(evidence.sourceLibrary, instruction);
      if (intent.kind === "COMPARE_SOURCES") {
        if (resolution.matches.length !== 2) { reply("Identifiez exactement deux références par auteur et année, DOI ou PMID. Aucun rapprochement approximatif n’a été effectué.", evidence); return; }
        const candidates = availableDocumentEvidence(evidence.sourceLibrary);
        reply(resolution.matches.map((source) => `${sourceShortReference(source)} : ${candidates.filter((item) => item.sourceRefs.includes(source.source.sourceId)).map((item) => item.text).join(" ") || "Aucune assertion rédigée admissible disponible."}`).join("\n\n") + "\n\nCette comparaison porte sur les assertions accessibles. Leur niveau de preuve comparatif et leur applicabilité à votre étude ne sont pas établis par votre préférence.", evidence); return;
      }
      if (intent.kind === "EXPLAIN_SOURCE") {
        if (resolution.matches.length === 2) {
          reply(explainDocumentSourceComparison(evidence.sourceLibrary, projection?.evidenceContent?.narrative,
            resolution.matches.map((match) => match.source.sourceId)), evidence); return;
        }
        if (resolution.status !== "RESOLVED") { reply("Identifiez une référence, ou exactement deux références pour expliquer leur priorité relative. Aucun rapprochement approximatif n’a été effectué.", evidence); return; }
        const id = resolution.matches[0]!.source.sourceId;
        reply(projection?.evidenceContent?.excludedSourceRefs.includes(id)
          ? "Cette référence a été retirée sur instruction documentaire. Elle reste visible dans la bibliothèque et l’historique ; ce retrait ne change pas sa qualification scientifique."
          : explainDocumentSourceSelection(evidence.sourceLibrary, projection?.evidenceContent?.narrative, id), evidence); return;
      }
      if (intent.kind !== "DOCUMENT_REVISION") return;
      let sourceId: string | undefined;
      if (intent.sourceRequired) {
        const interest = recordSourceInterest(evidence.sourceLibrary, { text: instruction, turnRef: sourceTurnRef, recordedAt: timestamp, explicitUse: intent.transformation !== "REMOVE_SOURCE" });
        evidence = { ...evidence, sourceLibrary: interest.library };
        retainedEvidence = evidence;
        if (interest.resolution.status !== "RESOLVED") {
          reply(interest.resolution.status === "AMBIGUOUS" ? "Plusieurs références correspondent. Précisez le DOI ou le PMID ; aucune citation n’a été ajoutée."
            : "Cette référence n’est pas identifiée dans les sources locales accessibles. Votre mention est conservée ; aucun auteur, DOI, PMID ou contenu n’a été inventé et aucune recherche externe n’a été lancée.", evidence); return;
        }
        sourceId = interest.resolution.matches[0]!.source.sourceId;
      }
      if (!projection?.evidenceContent) { reply("La source est conservée. Préparez d’abord le contexte sourcé et les références depuis l’aperçu du protocole, puis appliquez cette révision.", evidence); return; }
      const revision = reviseScientificDocument({ projection, library: evidence.sourceLibrary, transformation: intent.transformation, sourceId, instruction, turnRef: sourceTurnRef, timestamp });
      const documents = revision.projection === projection ? session.documents : refreshFunctionalResetDocumentPortfolio({ project: session.project, previous: { ...session.documents, projections: [...session.documents.projections, revision.projection] }, administration, knowledgeLibrary: evidence.sourceLibrary, handoffDecision: session.documents.handoffDecision, requestedAt: timestamp });
      reply(revision.message, { ...evidence, documents, openDocumentProjectionId: revision.projection.projectionId });
      setSourceLibraryOpen(false);
    } catch (error) {
      const code = error instanceof Error ? error.message : "DOCUMENT_REVISION_UNAVAILABLE";
      reply(code === "SOURCE_WITHOUT_APPLICABLE_DOCUMENTARY_ASSERTION" ? "Cette référence ne dispose pas d’une assertion rédigée suffisamment qualifiée pour cette révision. Son ajout comme citation décorative a été refusé."
        : code === "DOCUMENT_RESTORE_SOURCE_CHANGED" ? "Cette version dépend d’un autre état scientifique ou administratif. Elle reste consultable dans l’historique ; la restauration ne peut pas remplacer silencieusement le Project courant."
          : "La révision n’a pas pu être qualifiée. Le projet et toutes les versions documentaires précédentes sont conservés.", retainedEvidence ?? {});
    }
  }

  async function requestProtocolProjection(
    requestedEvidence?: ReturnType<typeof acquireDocumentKnowledge>,
    sourceSession: FunctionalResetSession = latestSessionRef.current,
  ) {
    if (!sourceSession.project) return;
    const now = new Date().toISOString();
    try {
      // A valid empty Knowledge result is allowed. Integrity, binding and
      // privacy failures must retain their native error instead of pretending
      // that no literature was found.
      const evidence = requestedEvidence ?? acquireDocumentKnowledge(sourceSession, now);
      const decision = authorizeResearchProjectDocumentHandoff({
        project: sourceSession.project,
        authority: sourceSession.projectAuthority,
        confirmedAt: now,
      });
      const documents = refreshFunctionalResetDocumentPortfolio({
        knowledgeLibrary: evidence?.sourceLibrary,
        administration,
        project: sourceSession.project,
        previous: sourceSession.documents,
        handoffDecision: decision,
        requestedAt: now,
        generateProtocol: true,
      });
      const protocol = documents.projections.at(-1) ?? null;
      if (!protocol || documents.lastFailure) throw new Error(documents.lastFailure?.message ?? "DOC_PROTOCOL_PROJECTION_NOT_CREATED");
      if (import.meta.env.VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME === "TERRA") {
        if (documentGenerationInFlightRef.current) return;
        const turnId = createTurnId();
        const nativeRequest: Omit<ProductBridgeRequest, "apiVersion"> = { requestKind: "USER_TURN",
            // DOC consumes the adopted Project, not the scientific transcript.
            // Keep the original last user turn for request correlation only.
            conversation: { conversationId: sourceSession.conversationId, language: "fr", turns: sourceSession.runtimeTurns.filter(turn => turn.role === "USER").slice(-1) },
            currentProject: sourceSession.project, evaluatePersistentDelta: false,
            documentDraftRequest: prepareDrciDraftSource({ handoffDecision: decision, protocolProjection: protocol, crf: buildCanonicalCrfPackage(sourceSession.project) }),
            observabilityContext: { sessionId: sourceSession.sessionId, conversationId: sourceSession.conversationId,
              turnId, clientRequestId: `drci-draft:${turnId}`, testSessionId: null } };
        // Keep the exact request, including handoff time and payload, for a
        // transport recovery. The durable owner decides whether dispatch is safe.
        const resume = async () => {
          if (documentGenerationInFlightRef.current || latestSessionRef.current.project?.projectDigest !== sourceSession.project?.projectDigest) return;
          documentGenerationInFlightRef.current = true;
          setDocumentGenerationVersion((sourceSession.drciDraftPacks ?? []).filter(pack => pack.project.projectId === sourceSession.project!.projectId).length + 1);
          setDocumentGenerationStartedAt(Date.now());
          setDocumentGenerationElapsed(0);
          setDocumentGenerationComplete(false);
          setDocumentGenerationPending(true);
          const records: ProviderCallRecord[] = [];
          try {
            const response = await requestProtocolDesignerBridge(nativeRequest);
            documentRecoveryRef.current = null;
            records.push(...response.observability.providerCalls ?? []);
            const latest = latestSessionRef.current;
            const pack = response.documentDraftPack;
            if (!pack || !latest.project || latest.sessionId !== sourceSession.sessionId || !isDrciDraftPackCurrent(pack, latest.project))
              throw new Error("Le projet a changé pendant la rédaction. Aucune version documentaire courante n’a été enregistrée.");
            const nextSession: FunctionalResetSession = { ...latest, ...(evidence ?? {}), documents,
              drciDraftPacks: [...latest.drciDraftPacks ?? [], pack], openDocumentProjectionId: null,
              documentRetryUnsafe: false,
              entries: latest.entries,
              updatedAt: now };
            let saved = false;
            try {
              if (onSessionChange) saved = onSessionChange(nextSession) !== false;
              else { persistFunctionalResetSession(window.localStorage, nextSession); saved = true; }
            } catch { /* Paid, validated pack remains readable in memory. */ }
            setDocumentSaveWarning(saved ? null : "Documents disponibles mais non enregistrés dans ce navigateur. Exportez le dossier avant de fermer cette page.");
            latestSessionRef.current = nextSession; setSession(nextSession);
            setDeliverableWorkspaceOpen(true);
            setDocumentGenerationComplete(true);
          } catch (error) {
            if (error instanceof ProductBridgeClientError) records.push(...error.observability?.providerCalls ?? []);
            // Only a transport failure exposes retrieval. Terminal/UNKNOWN
            // results must not be turned into a fresh paid generation.
            documentRecoveryRef.current = error instanceof TypeError
              ? { projectDigest: sourceSession.project!.projectDigest, resume } : null;
            const failedDocuments = markFunctionalResetDocumentFailure(sourceSession.project, documents, error);
            setSession(current => current.sessionId !== sourceSession.sessionId
              || current.project?.projectDigest !== sourceSession.project?.projectDigest ? current : ({ ...current, ...(evidence ?? {}), documents: failedDocuments,
              documentRetryUnsafe: error instanceof ProductBridgeClientError && error.code.includes("UNKNOWN_AFTER_DISPATCH"),
              updatedAt: now }));
          } finally {
            setSession(current => appendFunctionalResetProviderCallRecords(current, { turnId, requestKind: "USER_TURN", records }));
            documentGenerationInFlightRef.current = false;
            setDocumentGenerationPending(false);
          }
        };
        await resume();
        return;
      }
      setSession((current) => {
        const correlatedTrace = [...current.bridgeTraces]
          .reverse()
          .find((trace) => trace.traceRunId && trace.projectVersionAfter === sourceSession.project?.versionId);
        const scientificExecutionTraceLedger = recordDocumentProjectionTrace({
          ledger: current.scientificExecutionTraceLedger,
          traceRunId: correlatedTrace?.traceRunId,
          conversationId: current.conversationId,
          recordedAt: now,
          project: sourceSession.project!,
          decision,
          projection: protocol,
          projectionMode,
        });
        return {
        ...current,
        ...(evidence ?? {}),
        documents,
        documentRetryUnsafe: false,
        openDocumentProjectionId: protocol.projectionId,
        scientificExecutionTraceLedger,
        entries: current.entries,
        updatedAt: now,
      };
      });
    } catch (error) {
      const documents = markFunctionalResetDocumentFailure(sourceSession.project, sourceSession.documents, error);
      setSession((current) => {
        const correlatedTrace = [...current.bridgeTraces]
          .reverse()
          .find((trace) => trace.traceRunId && trace.projectVersionAfter === sourceSession.project?.versionId);
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
            sourceDigest: sourceSession.project!.projectDigest,
            project: sourceSession.project!,
          })
          : current.scientificExecutionTraceLedger;
        return {
        ...current,
        documents,
        scientificExecutionTraceLedger,
        entries: current.entries,
        updatedAt: now,
      };
      });
    }
  };

  const requestCorrection = () => {
    setCorrectionMode(true);
    composerRef.current?.focus();
  };

  const preparedFinalization = autonomousProjectBuild && Boolean(session.workingDraft) && !workingDraftBusy
    && !session.workingDraftFailure && !session.workingDraft?.failure
    ? validatePreparedWorkingReview(session)
    : null;
  const latestConfirmationReceipt = session.conversationConfirmationReceipts?.at(-1);
  const latestUserTurn = [...session.runtimeTurns].reverse().find(turn => turn.role === "USER");
  const visibleConfirmationReceipt = latestConfirmationReceipt
    && latestUserTurn?.turnId === latestConfirmationReceipt.userTurnId
    && (session.project?.versionId ?? null) === latestConfirmationReceipt.baseProjectVersion
    && (session.project?.projectDigest ?? null) === latestConfirmationReceipt.baseProjectDigest
    ? latestConfirmationReceipt : null;
  const confirmationReceiptStatus = visibleConfirmationReceipt
    ? conversationConfirmationReceiptStatus(session, visibleConfirmationReceipt) : null;

  useEffect(() => {
    if (!autonomousProjectBuild || workingDraftBusy || session.workingDraftFailure
      || session.workingDraft?.failure || preparedFinalization) return;
    let refreshed: ReturnType<typeof refreshWorkingDraftReview> = null;
    try {
      refreshed = refreshWorkingDraftReview(session);
    } catch (error) {
      console.warn("WORKING_DRAFT_REVIEW_SCOPE_REFRESH_FAILED", error);
      if (session.workingDraft?.sourceUserTurnRef) setSession(current => {
        const sourceTurnRef = current.workingDraft?.sourceUserTurnRef;
        return sourceTurnRef && current.workingDraftPreparations?.some(attempt => attempt.sourceTurnRef === sourceTurnRef && attempt.status === "PREPARING")
          ? recordWorkingDraftPreparation({ ...current, workingDraftFailure: "WORKING_DRAFT_REVIEW_REFRESH_FAILED" },
            sourceTurnRef, "FAILED", "WORKING_DRAFT_REVIEW_REFRESH_FAILED") : current;
      });
      return;
    }
    if (!refreshed) {
      if (session.workingDraft?.sourceUserTurnRef) setSession(current => {
        const sourceTurnRef = current.workingDraft?.sourceUserTurnRef;
        return sourceTurnRef && current.workingDraftPreparations?.some(attempt => attempt.sourceTurnRef === sourceTurnRef && attempt.status === "PREPARING")
          ? recordWorkingDraftPreparation({ ...current, workingDraftFailure: "WORKING_DRAFT_REVIEW_UNAVAILABLE" },
            sourceTurnRef, "FAILED", "WORKING_DRAFT_REVIEW_UNAVAILABLE") : current;
      });
      return;
    }
    setSession((current) => current.sessionId === session.sessionId
      && current.studyProposal?.digest === session.studyProposal?.digest
      ? { ...current, ...refreshed }
      : current);
  }, [autonomousProjectBuild, preparedFinalization, session, workingDraftBusy]);

  useEffect(() => {
    if (!autonomousProjectBuild || workingDraftBusy || !preparedFinalization) return;
    const expected = projectReviewInvitation(session, preparedFinalization);
    setSession(current => {
      const ready = validatePreparedWorkingReview(current);
      if (!ready || !sameProjectReviewInvitation(projectReviewInvitation(current, ready), expected)) return current;
      const sourceTurnRef = current.workingDraft?.sourceUserTurnRef;
      const invitationPresent = current.entries.some(entry => entry.kind === "TEXT" && entry.reviewInvitation
        && sameProjectReviewInvitation(entry.reviewInvitation, expected));
      if (invitationPresent) return sourceTurnRef
        ? recordWorkingDraftPreparation(current, sourceTurnRef, "READY_FOR_REVIEW") : current;
      const createdAt = new Date().toISOString();
      const content = projectReviewInvitationText(current, ready);
      const invited = { ...current, runtimeTurns: [...current.runtimeTurns, { turnId: createTurnId(), role: "NOXIA" as const, content, createdAt }],
        entries: [...current.entries, { entryId: createConversationEntryId(), kind: "TEXT", role: "NOXIA",
          content, reviewInvitation: expected, createdAt }], updatedAt: createdAt };
      return sourceTurnRef ? recordWorkingDraftPreparation(invited as FunctionalResetSession, sourceTurnRef, "READY_FOR_REVIEW") : invited as FunctionalResetSession;
    });
  }, [autonomousProjectBuild, preparedFinalization, session, workingDraftBusy]);

  const confirmProject = async (confirmationText = "Valider ces choix", selectedChangeRefs?: readonly string[], refusedChangeRefs?: readonly string[], prepareRemainingTurn = false,
    existingUserTurn?: ScientificInterpretationTurn, expectedReview?: ProjectReviewInvitation) => {
    const current = latestSessionRef.current;
    const prepared = validatePreparedWorkingReview(current, existingUserTurn?.turnId);
    const composition = current.studyProposal;
    const workingDraft = current.workingDraft;
    if (!prepared || !composition || !workingDraft || busy && !existingUserTurn || pendingBackgroundJobsRef.current > 0
      || expectedReview && !sameProjectReviewInvitation(projectReviewInvitation(current, prepared), expectedReview)) {
      setReviewError("Cette revue a changé. Attendez les choix courants avant de confirmer.");
      return null;
    }
    setReviewError(null);
    const scope = recommendedWorkingScope(composition);
    const confirmedAt = new Date().toISOString();
    const userTurn: ScientificInterpretationTurn = existingUserTurn ?? {
      turnId: createTurnId(),
      role: "USER",
      content: confirmationText,
      createdAt: confirmedAt,
    };
    return await confirmContribution(prepared.contribution.identity.contributionId, {
      userTurn,
      originalText: confirmationText,
      gatewayState: current.conversationLanguageGateway,
      traceLedger: current.scientificExecutionTraceLedger,
      stylePreference: null,
      selectedChangeRefs: selectedChangeRefs ?? prepared.candidate.humanReviewProjection.coveredChangeRefs,
      refusedChangeRefs,
      prepareRemainingTurn,
    }, {
      composition,
      selectedOptions: scope.selectedOptionRefs,
      selectedAtoms: scope.selectedAtomRefs,
      expectedDigest: composition.digest,
      contribution: prepared.contribution,
      candidate: prepared.candidate,
    });
  };

  const reset = () => {
    if (onNewProject) { onNewProject(); return; }
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
      && isFunctionalDocumentProjectionCurrent(projection, session.project!, administration)) ?? null
    : null;
  const deliverablePortfolio = useMemo(() => {
    if (!session.project) return null;
    const portfolio = buildStudyDeliverablePortfolio({ project: session.project, protocolProjection: currentProtocolProjection,
      generatedAt: currentProtocolProjection?.requestedAt ?? session.project.adoptedAt });
    const pack = [...session.drciDraftPacks ?? []].reverse().find((item) => isDrciDraftPackCurrent(item, session.project!));
    return pack ? projectDrciDraftPackPortfolio(portfolio, pack, session.project) : portfolio;
  }, [currentProtocolProjection, session.project, session.drciDraftPacks]);
  const activeRouteIntent = [...session.bridgeTraces]
    .reverse()
    .find((trace) => trace.entryRouting)?.entryRouting?.routeIntent;
  const workspaceTitle = session.workspace?.title?.trim() || "Projet sans titre";
  const hasNamedProject = workspaceTitle !== "Projet sans titre";
  const projectPanel = <ResearchProjectPanel
    project={session.project}
    documents={session.documents}
    mode={projectionMode}
    onOpenProtocol={(projectionId) => {
      setDeliverableWorkspaceOpen(false);
      setSession((current) => ({ ...current, openDocumentProjectionId: projectionId }));
    }}
    onRequestProtocol={() => requestProtocolProjection()}
    onCompleteAdministration={onEditAdministration}
    deliverablePortfolio={deliverablePortfolio}
    queryNavigation={session.queryNavigation}
    suppressDocumentAction={Boolean(busy || (!session.project && preparedFinalization) || session.documentRetryUnsafe || documentGenerationPending)}
    showDocumentAction={!deliverableWorkspaceOpen && !sourceLibraryOpen}
    documentActionDisabledReason={session.documentRetryUnsafe
      ? "Le résultat de la dernière génération est incertain ; aucune nouvelle génération n’est autorisée depuis cette page."
      : documentGenerationPending ? "Une génération documentaire est déjà en cours."
        : !session.project && preparedFinalization ? "Validez d’abord les choix proposés."
          : busy ? "Attendez la fin de la réponse en cours." : undefined}
    onOpenDeliverables={() => {
      setSession((current) => ({ ...current, openDocumentProjectionId: null }));
      setDeliverableWorkspaceOpen(true);
    }}
  />;
  const projectFinalizationCard = preparedFinalization && session.workingDraft ? <ProjectFinalizationCard
    contribution={preparedFinalization.contribution}
    candidate={preparedFinalization.candidate}
    currentProject={session.project}
    workingDraft={session.workingDraft}
    disabled={busy || workingDraftBusy}
    error={reviewError}
    onConfirm={() => void confirmProject("Valider ces choix", undefined, undefined, false, undefined,
      projectReviewInvitation(session, preparedFinalization))}
  /> : null;
  const currentDrciDraftPack = session.project
    ? [...session.drciDraftPacks ?? []].reverse().find((pack) => isDrciDraftPackCurrent(pack, session.project!)) ?? null
    : null;
  const adoptedProjectDocumentAction = !preparedFinalization && session.project && !session.documentRetryUnsafe ? <section
      className="mb-3 rounded-2xl border bg-background p-5 shadow-sm"
      data-testid="adopted-project-document-generation"
    >
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Documents du projet</p>
      <h2 className="mt-1 text-xl font-semibold">Choix enregistrés dans le projet · version {session.project.revision}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{currentDrciDraftPack ? "Une version documentaire existe déjà. Une nouvelle génération sera conservée séparément." : "Générez les quatre documents de travail depuis cette version du projet."}</p>
      <button type="button" disabled={documentGenerationPending || busy} onClick={() => void requestProtocolProjection()}
        className="mt-4 min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">
        Générer les documents
      </button>
    </section> : null;
  const documentGenerationRecovery = !preparedFinalization && session.project && session.documents.lastFailure ? <section
    className="border-t bg-destructive/5 px-4 py-4 sm:px-5"
    data-testid="document-generation-recovery"
  >
    <p className="text-sm font-semibold">Documents indisponibles</p>
    <p className="mt-1 text-sm text-muted-foreground">La génération des documents n’a pas abouti. Votre projet et les versions précédentes sont conservés.</p>
    {documentRecoveryRef.current?.projectDigest === session.project.projectDigest
      ? <button type="button" disabled={documentGenerationPending} onClick={() => void documentRecoveryRef.current?.resume()}
          className="mt-3 min-h-10 rounded-xl border bg-background px-3 text-sm font-medium disabled:opacity-40">Retrouver les documents</button>
      : <p className="mt-2 text-xs text-muted-foreground">{session.documentRetryUnsafe ? "Le résultat de l’opération est incertain ; aucune nouvelle génération n’est autorisée depuis cette page." : "Le projet et les anciennes versions sont conservés. Vous pouvez relancer une génération explicite."}</p>}
  </section> : null;



  return <main
    id="demo-main"
    className="min-h-screen bg-muted/30 text-foreground"
    data-testid="functional-reset-workspace"
    data-product-mode={projectionMode}
  >
    <Helmet>
      <title>Protocol Designer — NOXIA</title>
      <meta name="description" content="Concevez et révisez un protocole scientifique sourcé dans une conversation continue." />
      <meta name="robots" content="noindex, follow" />
    </Helmet>

    <div className="mx-auto max-w-[1480px] px-4 pb-5 sm:px-6 lg:px-8">
      <header className="sticky top-16 z-40 -mx-4 mb-5 border-b bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8" data-testid="project-top-navigation">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">NOXIA · Protocol Designer</p>
            <div className="mt-1 flex min-w-0 items-center gap-2">
              <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{projectionMode === "EXPERT" ? "Diagnostic technique" : hasNamedProject ? workspaceTitle : "Construisons votre projet scientifique"}</h1>
              {projectionMode === "STANDARD" && onRenameProject && <button type="button" onClick={onRenameProject} aria-label={`Renommer ${workspaceTitle}`} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="h-4 w-4" /></button>}
              {projectionMode === "EXPERT" && <span className="font-mono text-[10px] font-medium tracking-wide text-muted-foreground/70" data-testid="protocol-designer-development-version">{formatProductDevelopmentVersion(
                typeof __NOXIA_BUILD_GIT_SHA__ === "undefined" ? null : __NOXIA_BUILD_GIT_SHA__,
              )}</span>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{projectionMode === "STANDARD" ? "Conception de l’étude" : workspaceTitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
          {onLeaveWorkspace && <button type="button" disabled={busy || Boolean(postAdoptionContinuationJob)} onClick={onLeaveWorkspace} className="min-h-11 rounded-xl border bg-background px-3 text-sm font-medium">← Mes projets</button>}
          {onOpenProfile && <button type="button" disabled={busy || Boolean(postAdoptionContinuationJob)} onClick={onOpenProfile} className="min-h-11 rounded-xl border bg-background px-3 text-sm">Profil / organisation</button>}
          {onEditAdministration && <button type="button" disabled={busy || Boolean(postAdoptionContinuationJob)} onClick={onEditAdministration} className="min-h-11 rounded-xl border bg-background px-3 text-sm">Informations du projet</button>}
          {session.project && <button type="button" disabled={busy || Boolean(postAdoptionContinuationJob)} onClick={() => setSourceLibraryOpen(true)} className="min-h-11 rounded-xl border bg-background px-3 text-sm">Sources</button>}
          <Sheet open={workingProjectOpen} onOpenChange={setWorkingProjectOpen}>
            <SheetTrigger asChild><button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-background px-3 text-sm font-medium"><MessageSquareText className="h-4 w-4" />Voir mon projet</button></SheetTrigger>
            <SheetContent side="left" className="w-[min(92vw,420px)] overflow-y-auto p-4">
              <SheetHeader className="sr-only"><SheetTitle>Projet de recherche</SheetTitle><SheetDescription>État actuel du projet et des documents.</SheetDescription></SheetHeader>
              <div className="space-y-4 pt-7">{projectPanel}
                <section aria-label="Propositions et points ouverts"><h2 className="text-base font-semibold">Propositions et points ouverts</h2>
                  <p className="mb-3 text-sm text-muted-foreground">Les propositions de la conversation restent en discussion jusqu’à confirmation des choix à enregistrer.</p>
                  {!session.entries.some(entry => entry.kind === "REVIEW") && <p className="text-sm text-muted-foreground">Les pistes discutées figurent dans la conversation. Aucun choix n’est encore soumis à confirmation.</p>}
                  {session.entries.filter(entry => entry.kind === "REVIEW").map(entry => entry.kind === "REVIEW" && <ContributionReview
                    key={entry.entryId} contribution={entry.contribution} candidate={entry.candidate ?? prepareResearchProjectContributionCandidate(entry.contribution, projectExistedForReview(session.entries.indexOf(entry)) ? session.project : null)}
                    status={entry.status} reviewDecision={entry.decision} decisionPartition={entry.decisionPartition} expanded readOnly
                    onConfirm={() => undefined} onCorrect={() => undefined} onReject={() => undefined} />)}
                </section>
              </div>
            </SheetContent>
          </Sheet>
          <details className="relative">
            <summary aria-label="Plus d’options" className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl border bg-background text-xl marker:hidden">⋯</summary>
            <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border bg-background p-1 shadow-xl">
              <button type="button" onClick={() => setProjectionMode((mode) => mode === "STANDARD" ? "EXPERT" : "STANDARD")} className="min-h-10 w-full rounded-lg px-3 text-left text-sm hover:bg-muted">{projectionMode === "STANDARD" ? "Diagnostic technique" : "Quitter le diagnostic"}</button>
              <button type="button" aria-label={onNewProject ? "Nouveau projet" : "Recommencer"} disabled={busy || Boolean(postAdoptionContinuationJob)} onClick={reset} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm hover:bg-muted"><RotateCcw className="h-4 w-4" />{onNewProject ? "Nouveau projet" : "Recommencer"}</button>
            </div>
          </details>
          </div>
        </div>
      </header>
      <ProjectContinuum documentsAvailable={Boolean(session.project || preparedFinalization)} documentsOpen={Boolean(openProjection) || deliverableWorkspaceOpen}
        disabled={busy || Boolean(postAdoptionContinuationJob)}
        onConversation={() => { setSourceLibraryOpen(false); setDeliverableWorkspaceOpen(false); setSession((current) => ({ ...current, openDocumentProjectionId: null })); }}
        onDocuments={() => { setSourceLibraryOpen(false); setSession((current) => ({ ...current, openDocumentProjectionId: null })); setDeliverableWorkspaceOpen(true); }} />

      {projectionMode === "EXPERT" && <DevelopmentDiagnostics session={session} />}

      <div className="grid min-w-0 gap-5 lg:h-[calc(100dvh-13rem)] lg:min-h-[30rem] lg:grid-cols-[minmax(310px,.72fr)_minmax(0,1.5fr)]">
        <div className="hidden min-h-0 min-w-0 lg:block lg:overflow-y-auto lg:overscroll-contain" data-testid="project-scroll-panel">{projectPanel}</div>

        {sourceLibraryOpen ? <ProjectSourceLibraryView library={session.sourceLibrary} documents={session.documents.projections} onAcquire={acquireSources} onInstruction={handleDocumentInstruction} onClose={() => setSourceLibraryOpen(false)} message={documentMessage} /> : deliverableWorkspaceOpen && !session.project && projectFinalizationCard ? <section
          aria-labelledby="project-documents-title"
          className="min-w-0 rounded-3xl border bg-background shadow-sm"
          data-testid="project-document-finalization-workspace"
        >
          <header className="border-b px-5 py-5 sm:px-6">
            <button type="button" onClick={() => setDeliverableWorkspaceOpen(false)} className="min-h-10 rounded-lg border px-3 text-sm font-medium">← Retour à la conversation</button>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[.18em] text-primary">Protocole / documents</p>
            <h2 id="project-documents-title" className="mt-1 text-2xl font-semibold">Documents du projet</h2>
            <p className="mt-2 text-sm text-muted-foreground">Confirmez les décisions scientifiques. Vous pourrez ensuite générer les documents séparément.</p>
          </header>
          {busy && <p role="status" className="border-b bg-primary/5 px-5 py-3 text-sm font-medium">
            Validation des choix…
          </p>}
          {projectFinalizationCard}
        </section> : deliverableWorkspaceOpen && deliverablePortfolio ? <div className="min-w-0">
          {documentGenerationPending && <p role="status" className="mb-3 rounded-xl border bg-primary/5 px-5 py-3 text-sm font-medium">Génération des documents en cours…</p>}
          {adoptedProjectDocumentAction}
          {documentGenerationRecovery}
          <StudyDeliverableWorkspace
          portfolio={deliverablePortfolio}
          documentPacks={session.drciDraftPacks}
          projectId={session.project?.projectId}
          saveWarning={documentSaveWarning}
          onClose={() => setDeliverableWorkspaceOpen(false)}
          />
        </div> : openProjection ? <ProtocolPreview
          onDocumentInstruction={handleDocumentInstruction}
          documentMessage={documentMessage}
          projection={openProjection}
          stale={!session.project || !isFunctionalDocumentProjectionCurrent(openProjection, session.project, administration)}
          onClose={() => setSession((current) => ({ ...current, openDocumentProjectionId: null }))}
          onArtifactGenerated={recordOpenProjectionArtifact}
          onCompleteAdministration={onEditAdministration}
          onRegenerate={() => requestProtocolProjection()}
          history={session.documents.projections}
          onOpenVersion={(projectionId) => setSession((current) => ({ ...current, openDocumentProjectionId: projectionId }))}
        /> : <section aria-label="Conversation" className="flex min-h-[calc(100vh-7.5rem)] min-w-0 flex-col rounded-3xl border bg-background shadow-sm lg:h-full lg:min-h-0">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Conversation</h2>
          </div>

          <div ref={conversationScrollRef} onScroll={event => setConversationScrolled(event.currentTarget.scrollTop > 320)}
            className="min-h-0 flex-1 space-y-5 px-4 py-5 sm:px-6 lg:overflow-y-auto lg:overscroll-contain"
            aria-live="polite" data-testid="conversation-scroll-panel">
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
              ? preparedFinalization?.contribution.identity.contributionId === entry.contribution.identity.contributionId
                && entry.status === "PENDING" ? null
              : session.entries.some((item) => item.entryId === `${entry.entryId}:presentation-failure`)
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
                currentProject={projectExistedForReview(index) ? session.project : null}
                status={entry.status}
                reviewDecision={entry.decision}
                decisionPartition={entry.decisionPartition}
                actionable={session.pendingContribution?.identity.contributionId === entry.contribution.identity.contributionId}
                disabled={busy || autonomousProjectBuild && workingDraftBusy}
                detailedUnderstanding={import.meta.env.VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME === "TERRA" ? undefined : session.studyProposal?.recomputation?.contributionRef === entry.contribution.identity.contributionId
                  && entry.status === "PENDING" ? <StudyProposalReview composition={session.studyProposal} project={session.project}
                    readOnly onValidate={() => undefined} onDiscuss={() => undefined} /> : entry.decision?.targets.some(ref => entry.candidate?.humanReviewProjection.coveredChangeRefs.includes(ref)) ? undefined : <UnderstandingReviewCard
                  contribution={entry.contribution}
                  status={entry.status === "REJECTED" ? "CORRECTION_REQUESTED" : entry.status}
                  onConfirm={() => undefined}
                  onCorrect={() => undefined}
                  onAdd={() => undefined}
                  presentationOnly
                />}
                onConfirm={() => confirmContribution(entry.contribution.identity.contributionId)}
                onConfirmScope={import.meta.env.VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME === "TERRA" ? selectedChangeRefs => {
                  const now = new Date().toISOString();
                  const text = "Je confirme uniquement les éléments sélectionnés dans cette revue ; les autres restent en discussion.";
                  void confirmContribution(entry.contribution.identity.contributionId, {
                    userTurn: { turnId: createTurnId(), role: "USER", content: text, createdAt: now }, originalText: text,
                    gatewayState: session.conversationLanguageGateway, traceLedger: session.scientificExecutionTraceLedger,
                    stylePreference: null, selectedChangeRefs,
                  });
                } : undefined}
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
              : <article key={entry.entryId} data-testid={entry.kind === "TEXT" && entry.reviewInvitation ? "project-review-invitation" : undefined} ref={entry.role === "NOXIA" && entry.kind === "TEXT" && !session.entries.slice(index + 1).some(item => item.kind === "TEXT" && item.role === "NOXIA") ? latestReplyRef : undefined} className={`scroll-mt-64 flex ${entry.role === "USER" ? "justify-end" : "justify-start"}`}>
                {entry.kind === "TEXT" && entry.role === "NOXIA" && entry.knowledgePresentation
                  ? <ProductUnderstandResponse presentation={entry.knowledgePresentation} />
                  : <div className={`max-w-[88%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[78%] ${
                    entry.kind === "ERROR" ? "border border-destructive/40 bg-destructive/10 text-destructive"
                      : entry.role === "USER" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`} role={entry.kind === "ERROR" ? "alert" : undefined}>{entry.content}</div>}
              </article>)}
            {busy && <div className="flex justify-start"><div className="inline-flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" />{busyMessage}</div></div>}
            {autonomousProjectBuild && workingDraftBusy && <div role="status" className="px-4 py-2 text-xs text-muted-foreground">Structuration du projet en cours…</div>}
            {confirmationReceiptStatus && <div role="status" data-testid="conversation-confirmation-receipt"
              className="mx-4 rounded-xl border bg-primary/5 px-4 py-2 text-xs sm:mx-5">
              {confirmationReceiptStatus === "PREPARATION_FAILED"
                ? "Accord enregistré sur la proposition précédente ; la préparation a échoué. Le projet reste inchangé."
                : confirmationReceiptStatus === "SUPERSEDED"
                  ? "Accord conservé sur la proposition précédente ; un échange plus récent a remplacé sa préparation."
                  : confirmationReceiptStatus === "INTERRUPTED/UNKNOWN"
                    ? "Accord conservé sur la proposition précédente ; le résultat de sa préparation n’est pas vérifié."
                    : "Accord enregistré sur la proposition précédente — revue requise."}
            </div>}
            {autonomousProjectBuild && !workingDraftBusy && ["FAILED", "UNKNOWN/INTERRUPTED", "SUPERSEDED"].includes(session.workingDraftPreparations?.at(-1)?.status ?? "") && <div role="alert"
              data-testid="working-draft-terminal-status" className="mx-4 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2 text-xs sm:mx-5">
              {session.workingDraftPreparations?.at(-1)?.status === "UNKNOWN/INTERRUPTED"
                ? "La préparation a été interrompue ; son résultat n’est pas vérifié. La conversation et le dernier projet sont conservés."
                : session.workingDraftPreparations?.at(-1)?.status === "SUPERSEDED"
                  ? "Cette préparation a été remplacée par un échange plus récent ; son résultat ne peut pas être validé."
                  : session.workingDraftPreparations?.at(-1)?.code === "WORKING_DRAFT_NO_CONFIRMABLE_UPDATE"
                    ? "Cet échange ne crée pas de nouveaux choix à valider. La conversation et le dernier projet sont conservés."
                  : "La structuration du projet n’a pas abouti. La conversation et le dernier projet sont conservés ; vous pouvez poursuivre la discussion."}</div>}
            <div ref={endRef} />
          </div>

          {conversationScrolled && <button type="button" aria-label="Retour en haut de la conversation"
            className="hidden min-h-10 self-end rounded-xl border bg-background px-3 text-sm lg:mr-5 lg:inline-flex lg:items-center lg:gap-1"
            onClick={() => conversationScrollRef.current?.scrollTo({ top: 0, behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}>
            <ArrowUp className="h-4 w-4" /> Haut
          </button>}
          {import.meta.env.VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME !== "TERRA" && session.studyProposal && (!session.studyProposal.recomputation || session.pendingContribution?.identity.contributionId !== session.studyProposal.recomputation.contributionRef) && <div className="px-4 pb-4 sm:px-5"><StudyProposalReview key={session.studyProposal.digest}
            composition={session.studyProposal} project={session.project} disabled={busy} onValidate={validateStudyProposal} onDisposition={disposeStudyProposal}
            onDiscuss={subject => { setDraft(`Je souhaite discuter ${subject} : `); }} /></div>}
          {projectFinalizationCard}
          <form onSubmit={submit} className="sticky bottom-0 border-t bg-background/95 p-4 backdrop-blur sm:p-5" data-testid="conversation-composer">
            {!autonomousProjectBuild && import.meta.env.VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME === "TERRA" && session.runtimeTurns.some(turn => turn.role === "USER") && <button
              type="button" disabled={busy} className="mb-2 min-h-9 rounded-lg border px-3 text-sm disabled:opacity-40"
              onClick={() => void submitTerraText("Je retiens les choix de travail de vos propositions précédentes, tels que corrigés par mes messages, pour préparer leur enregistrement. Présentez une revue groupée avant toute adoption.", true)}
            >Préparer l’enregistrement</button>}
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
                rows={3}
                maxLength={4_000}
                placeholder={correctionMode ? "Ce que je souhaite corriger…" : productEntryPromptForIntent(activeRouteIntent)}
                className="min-h-[4.5rem] max-h-[28dvh] flex-1 resize-none overflow-y-auto bg-transparent px-3 py-2 text-sm outline-none sm:max-h-[min(35dvh,16.5rem)] lg:resize-y"
              />
              <button type="submit" disabled={busy || !draft.trim()} aria-label="Envoyer" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"><ArrowUp className="h-5 w-5" /></button>
            </div>
          </form>
        </section>}
      </div>
    </div>
    {(documentGenerationPending || documentGenerationComplete) && <aside role="status" aria-label="Progression de la génération documentaire"
      className="fixed bottom-24 right-4 z-50 w-[min(21rem,calc(100vw-2rem))] rounded-2xl border bg-background p-3 shadow-xl lg:bottom-28"
      data-testid="document-generation-progress">
      <button type="button" className="flex min-h-8 w-full items-center justify-between gap-2 text-left text-sm font-semibold"
        aria-expanded={documentProgressExpanded} onClick={() => setDocumentProgressExpanded(value => !value)}>
        <span>Documents V{documentGenerationVersion} {documentGenerationComplete ? "disponibles" : "en cours"}</span>
        <span aria-hidden="true">{documentProgressExpanded ? "−" : "+"}</span>
      </button>
      {documentProgressExpanded && <div className="mt-2 space-y-2 text-xs text-muted-foreground">
        <div role="progressbar" aria-label="Progression estimée des documents" aria-valuemin={0} aria-valuemax={100}
          aria-valuenow={documentGenerationComplete ? 100 : Math.min(90, Math.round(documentGenerationElapsed / 240 * 90))}
          className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${documentGenerationComplete ? 100 : Math.min(90, Math.round(documentGenerationElapsed / 240 * 90))}%` }} />
        </div>
        <p>{documentGenerationComplete ? "Génération terminée." : "Progression temporelle estimée ; vérification en attente du résultat réel."}</p>
        <p>{Math.floor(documentGenerationElapsed / 60)} min {String(documentGenerationElapsed % 60).padStart(2, "0")} s écoulées · durée habituelle : 3–4 min</p>
      </div>}
    </aside>}
  </main>;
}
