import { buildBoundedConversationReferentContext, currentGovernedNavigationInput, selectBoundedConversationInteraction } from "@/features/query-navigation/current-navigation-evidence";
import type { ScientificInterpretationTurn } from "@/features/scientific-interpretation/contracts";
import { ProductBridgeClientError } from "@/features/protocol-designer/product-bridge-client";
import { type ProductBridgeRequest } from "@/features/protocol-designer/product-bridge";
import { buildPreProjectNavigationDecision } from "@/features/query-navigation";
import { buildScientificDiscussionContext } from "./contribution-lifecycle";
import { recognizeCurrentProjectDirection, routeProductEntry } from "./product-entry-routing";
import { readNaturalCandidateDecision } from "./natural-conversation-policy";
import { type FunctionalResetSession } from "./session";
import { languageBoundaryFor, prepareMultilingualUserTurn, type PreparedGatewayUserInput } from "../conversation-language-effects";

// Deterministic assembly of the existing request and bound reception context.
export function prepareConversationTurnContext(session: FunctionalResetSession, preparedInput: PreparedGatewayUserInput, continuedTurn: ScientificInterpretationTurn | undefined, correctionMode: boolean, now: string, turnId: string, content: string) {
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
    retention: session.scientificDiscussionRetention,
    studyProposal: session.studyProposal,
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
  return { proposalCorrection, currentProjectDirection, userTurn, runtimeTurns, boundedReferentContext, scientificDiscussionContext, boundedInteraction, adoptsVisibleProposal };
}

export function prepareConfiguredConversationRequest(input: {
  session: FunctionalResetSession; entryRouting: ReturnType<typeof routeProductEntry>; userTurn: ScientificInterpretationTurn; runtimeTurns: ScientificInterpretationTurn[];
  queryNavigation: FunctionalResetSession["queryNavigation"]; boundedReferentContext: ProductBridgeRequest["boundedReferentContext"];
  scientificDiscussionContext: ProductBridgeRequest["scientificDiscussionContext"]; boundedInteraction: ProductBridgeRequest["boundedInteraction"];
  preparedGateway: Awaited<ReturnType<typeof prepareMultilingualUserTurn>>; asksForExplanationOrRephrase: boolean;
}) {
  const { session, entryRouting, userTurn, runtimeTurns, queryNavigation, boundedReferentContext, scientificDiscussionContext, boundedInteraction, preparedGateway, asksForExplanationOrRephrase } = input;
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
  return { preProjectNavigation, bridgeRequest };
}

export function prepareTerraConversationRequest(session: FunctionalResetSession, requestTurns: ScientificInterpretationTurn[], userTurn: ScientificInterpretationTurn, autonomousProjectBuild: boolean, prepareRecording: boolean): Omit<ProductBridgeRequest, "apiVersion"> {
  const discussion = buildScientificDiscussionContext({ retained: session.retainedContributionCandidates ?? [],
    retention: session.scientificDiscussionRetention,
    studyProposal: session.studyProposal,
    currentProject: session.project, conversationId: session.conversationId, runtimeTurns: requestTurns,
    selectedReviewRef: session.pendingContribution?.identity.contributionId ?? null });
  return { conversation: { conversationId: session.conversationId, language: "fr", turns: requestTurns },
        ...(autonomousProjectBuild && session.studyProposal?.state === "CURRENT" ? { studyProposalContext: session.studyProposal } : {}),
        currentProject: session.project, evaluatePersistentDelta: prepareRecording,
        scientificDiscussionContext: discussion,
        ...(session.project && session.queryNavigation ? { currentNavigation: currentGovernedNavigationInput({
          project: session.project, navigation: session.queryNavigation, ownerResultLedger: session.knowledgeOwnerLedger }) } : {}),
        observabilityContext: { sessionId: session.sessionId, conversationId: session.conversationId,
          turnId: userTurn.turnId, clientRequestId: `product-bridge:${userTurn.turnId}`, testSessionId: null } };
}

export function assertConversationSubmissionContextCurrent(session: FunctionalResetSession, latest: FunctionalResetSession) {
  if (latest.sessionId !== session.sessionId || latest.conversationId !== session.conversationId
    || latest.project?.projectId !== session.project?.projectId
    || latest.project?.versionId !== session.project?.versionId
    || latest.project?.projectDigest !== session.project?.projectDigest) {
    throw new ProductBridgeClientError("SUBMISSION_CONTEXT_CHANGED",
      "Le contexte a changé pendant le traitement. Cette réponse n’a pas été appliquée ; le projet courant et les décisions déjà enregistrées sont conservés.");
  }
}
