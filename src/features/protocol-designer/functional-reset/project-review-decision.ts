import { projectStudyProposalDisposition } from "./study-proposal-standard";
import { deferResearchProjectContribution } from "@/features/research-project-construction/contribution-owner-boundary";
import { buildStudyProposalSelectionContribution } from "./study-proposal-standard";
import { assertStudyProposalCurrent, sourceBackedStudyProposalScope } from "./study-proposal-standard";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { rejectResearchProjectContribution } from "@/features/research-project-construction";
import { recordContributionRejectionTrace } from "./end-to-end-trace-adapter";
import { adoptedProjectInteractionState } from "./project-adoption-effects";
import { preparationCheckpointValid, recordPreparationDecision } from "./project-preparation-lifecycle";
import { type ProjectAdoptionTrace } from "./project-adoption-trace";
import { refreshAdoptedProjectConsumers } from "./project-adoption-effects";
import { confirmResearchProjectContribution } from "@/features/research-project-construction";
import { selectedStudyProposalAtoms, propagateStudyProposalDecision, propagateFreeformStudyProposalDecision, requireStudyProposalReview } from "./study-proposal-standard";
import { retainUndecidedContributionScope, recordContributionCandidateHumanDecision } from "./contribution-lifecycle";
import { recordGovernedAdoptionContextEvent, settleRetainedDiscussionAdoption } from "./contribution-discussion-retention";
import { recordProjectAdoptionTrace } from "./end-to-end-trace-adapter";
import { buildConciseAdoptionReply } from "./natural-conversation-policy";
import { createConversationEntryId, createTurnId, projectHumanDecisionForBridgeTrace } from "./session";
import { type ContributionReviewPresentationFailure } from "./ContributionReview";
import { recordContributionDownstreamFailure } from "./contribution-lifecycle";
import { recordProductErrorBoundary } from "./end-to-end-trace-adapter";
import { markContributionCandidatePresented } from "./contribution-lifecycle";
import { recordContributionReviewPresentedTrace } from "./end-to-end-trace-adapter";
import type { StudyProposalComposition } from "../product-bridge";
import { type ConversationLanguageGatewayState } from "@/features/protocol-designer/conversation-language-gateway";
import { type ConversationStylePreference } from "./natural-conversation-policy";
import type { ScientificInterpretationContributionEnvelope, ScientificInterpretationTurn } from "@/features/scientific-interpretation/contracts";
import { ownerResultNativeDigest } from "@/features/protocol-designer/product-owner-result-ledger";
import { prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import { retainOwnerReviewedCandidate } from "./contribution-lifecycle";
import { type FunctionalResetSession } from "./session";

// Application retention delegates validation and lifecycle to their existing owners.
export type NaturalContributionDecisionContext = Readonly<{
  userTurn: ScientificInterpretationTurn;
  originalText: string;
  gatewayState: ConversationLanguageGatewayState;
  traceLedger: FunctionalResetSession["scientificExecutionTraceLedger"];
  stylePreference: ConversationStylePreference | null;
  selectedChangeRefs?: readonly string[];
  refusedChangeRefs?: readonly string[];
  correctionChangeRefs?: readonly string[];
  prepareRemainingTurn?: boolean;
  /** Explicit Generate action, not an acknowledgement of an unseen Review. */
  materialization?: Readonly<{ preparationId: string; requestDigest: string }>;
}>;


export type ProjectProposalSelection = Readonly<{ composition: StudyProposalComposition; selectedOptions: readonly string[]; selectedAtoms: readonly string[];
  expectedDigest: string; contribution: ScientificInterpretationContributionEnvelope; candidate: ReturnType<typeof prepareResearchProjectContributionCandidate> }>;

export const acknowledgeContributionReviewPresented = (current: FunctionalResetSession, entryId: string, presentedAt: string): FunctionalResetSession => {
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
};

export const recordContributionReviewPresentationFailure = (current: FunctionalResetSession, entryId: string, failure: ContributionReviewPresentationFailure, failedAt: string): FunctionalResetSession => {
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
};

export const contributionHasAcknowledgedPresentation = (session: FunctionalResetSession, contributionId: string) => {
    const record = session.retainedContributionCandidates?.find((candidate) => candidate.candidateRef === contributionId);
    // This bounded guard does not change older review flows without a lifecycle receipt.
    return !record || (record.downstreamState === "PRESENTED" && record.presentedAt !== null
      && record.actuality === "CURRENT" && record.humanDecision === null);
  };


export function stageProjectConfirmation(input: {
  session: FunctionalResetSession; readCurrentSession: () => FunctionalResetSession;
  contributionId: string; contribution: ScientificInterpretationContributionEnvelope; now: string;
  naturalDecision?: NaturalContributionDecisionContext; proposalSelection?: ProjectProposalSelection; adoptionTrace?: ProjectAdoptionTrace;
  administration: Parameters<typeof refreshAdoptedProjectConsumers>[0]["administration"];
}) {
  const { session, readCurrentSession, contributionId, contribution, now, naturalDecision, proposalSelection, adoptionTrace, administration } = input;
  const materialization = naturalDecision?.materialization;
  if (materialization) {
    const preparation = session.workingDraftPreparations?.find(p => p.checkpoint?.preparationId === materialization.preparationId);
    if (!preparation?.checkpoint || !preparationCheckpointValid(session, preparation.checkpoint)
      || preparation.checkpoint.requestDigest !== materialization.requestDigest
      || preparation.status !== "READY_FOR_REVIEW" || preparation.decision !== "PENDING"
      || !proposalSelection || preparation.result?.composition.digest !== proposalSelection.expectedDigest
      || proposalSelection.expectedDigest !== proposalSelection.composition.digest)
      throw new Error("VERSION_MATERIALIZATION_CHECKPOINT_INVALID");
    assertStudyProposalCurrent(proposalSelection.composition, session.project);
    selectedStudyProposalAtoms(proposalSelection.composition, proposalSelection.selectedOptions, proposalSelection.selectedAtoms);
    const scope = sourceBackedStudyProposalScope(proposalSelection.composition, preparation.result!.workingDraft.origins);
    if ("clarification" in scope || logicalDigest(scope) !== logicalDigest({
      selectedAtomRefs: proposalSelection.selectedAtoms, selectedOptionRefs: proposalSelection.selectedOptions }))
      throw new Error("VERSION_MATERIALIZATION_NOT_SOURCE_BACKED");
  }
  const reviewEntry = proposalSelection ? { kind: "REVIEW" as const, candidate: proposalSelection.candidate, contribution,
    traceRunId: session.bridgeTraces.find(trace => trace.turnId === proposalSelection.composition.sourceTurnRef)?.traceRunId ?? null } : session.entries.find((entry) => entry.kind === "REVIEW" && entry.contribution.identity.contributionId === contributionId);
  const retainedBeforeDecision = proposalSelection && naturalDecision && !materialization ? markContributionCandidatePresented({
    retained: retainOwnerReviewedCandidate(session, contribution, proposalSelection.candidate, naturalDecision.userTurn, reviewEntry?.kind === "REVIEW" ? reviewEntry.traceRunId ?? null : null, ownerResultNativeDigest),
    candidateRef: contributionId, presentedAt: now,
  }) : session.retainedContributionCandidates ?? [];
  const project = confirmResearchProjectContribution({
    contribution,
    current: session.project,
    projectId: session.projectId,
    authority: session.projectAuthority,
    confirmedAt: now,
    confirmationReason: materialization
      ? "Demande humaine explicite de générer une version depuis le checkpoint scientifique figé, sans prétendre à la présentation d’une revue."
      : naturalDecision
      ? naturalDecision.selectedChangeRefs
        ? `Décision partielle : changements confirmés ${naturalDecision.selectedChangeRefs.join(", ")} ; changements refusés ${(naturalDecision.refusedChangeRefs ?? []).join(", ")}.`
        : "L’utilisateur a explicitement confirmé la candidate courante dans son message."
      : undefined,
    confirmationSourceRefs: naturalDecision ? [naturalDecision.userTurn.turnId] : undefined,
    selectedChangeRefs: naturalDecision?.selectedChangeRefs,
    reviewedProjection: reviewEntry?.kind === "REVIEW"
      ? (reviewEntry.candidate ?? prepareResearchProjectContributionCandidate(reviewEntry.contribution, session.project)).humanReviewProjection
      : undefined,
    observeAdoption: adoptionTrace?.observeOwner,
  });
  adoptionTrace?.at("PROJECT_APPLY_STARTED", "confirmContribution", "PROJECT_ADOPTION_DERIVED_STATE_VALID");
  const settledRefs = [...(naturalDecision?.selectedChangeRefs ?? []), ...(naturalDecision?.refusedChangeRefs ?? []), ...(naturalDecision?.correctionChangeRefs ?? [])];
  const originalRecord = retainedBeforeDecision.find(record => record.candidateRef === contributionId);
  const remainder = naturalDecision?.selectedChangeRefs && originalRecord ? retainUndecidedContributionScope({
    record: originalRecord, currentBefore: session.project, currentAfter: project, settledChangeRefs: settledRefs,
    decisionSourceRef: naturalDecision.userTurn.turnId, retainedAt: now,
  }) : null;
  const remainderEntryId = remainder ? createConversationEntryId() : null;
  const { documents, queryNavigation } = refreshAdoptedProjectConsumers({ previous: session, project, administration, recordedAt: now });
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
  // Only generated control acknowledgements receive native event coverage.
  // An arbitrary natural confirmation/correction still requires ST meaning.
  const generatedConfirmation = naturalDecision && (materialization || naturalDecision.originalText === "Valider ces choix") ? naturalDecision.userTurn : null;
  const scientificDiscussionRetention = recordGovernedAdoptionContextEvent(session.scientificDiscussionRetention,
    project, [...(generatedConfirmation ? [generatedConfirmation] : []), confirmationTurn]);
  const correlatedTraceRunId = reviewEntry?.kind === "REVIEW" && reviewEntry.traceRunId
    ? reviewEntry.traceRunId
    : session.bridgeTraces.find((trace) => trace.projectChangeSetCandidate?.sourceContributionRef === contributionId)?.traceRunId;
  let scientificExecutionTraceLedger = adoptionTrace?.ledger() ?? naturalDecision?.traceLedger ?? session.scientificExecutionTraceLedger;
  try {
    scientificExecutionTraceLedger = recordProjectAdoptionTrace({
      ledger: scientificExecutionTraceLedger,
      traceRunId: correlatedTraceRunId,
      conversationId: session.conversationId,
      recordedAt: now,
      contribution,
      project,
      previousProjectExisted: Boolean(session.project),
      queryNavigation,
      documents,
    });
    adoptionTrace?.useLedger(scientificExecutionTraceLedger);
  } catch (error) {
    // TRACE is observational: a projection failure must not veto a valid human adoption.
    console.warn("PROJECT_ADOPTION_TRACE_PROJECTION_FAILED", error instanceof Error ? error.message : "UNKNOWN");
    adoptionTrace?.projectionFailed(error, session.project);
    scientificExecutionTraceLedger = adoptionTrace?.ledger() ?? scientificExecutionTraceLedger;
  }
  const partialProposalSelection = Boolean(proposalSelection && naturalDecision?.selectedChangeRefs
    && naturalDecision.selectedChangeRefs.length < proposalSelection.candidate.humanReviewProjection.coveredChangeRefs.length);
  adoptionTrace?.at("PROJECT_APPLY_STARTED", "propagateStudyProposalDecision", "PROJECT_SOURCE_MATERIALIZATION_VALID");
  const updatedStudyProposal = partialProposalSelection && proposalSelection
    ? requireStudyProposalReview(proposalSelection.composition, project)
    : proposalSelection ? propagateStudyProposalDecision(proposalSelection.composition, project,
    proposalSelection.candidate, session.project,
    selectedStudyProposalAtoms(proposalSelection.composition, proposalSelection.selectedOptions, proposalSelection.selectedAtoms), proposalSelection.selectedOptions, naturalDecision?.userTurn, contribution)
    : session.studyProposal ? propagateFreeformStudyProposalDecision(session.studyProposal, project, contribution,
      reviewEntry?.kind === "REVIEW" && reviewEntry.candidate
        ? reviewEntry.candidate : prepareResearchProjectContributionCandidate(contribution, session.project),
      session.project, naturalDecision?.userTurn) : session.studyProposal;
  const current = readCurrentSession();
  adoptionTrace?.at("PROJECT_APPLY_STARTED", "confirmContribution", "PROJECT_BASE_UNCHANGED_DURING_HUMAN_REVIEW");
  if (current.sessionId !== session.sessionId || current.project?.versionId !== session.project?.versionId)
    throw new Error("PROJECT_CHANGED_DURING_HUMAN_REVIEW");
  let nextSession: FunctionalResetSession = {
    ...current,
    scientificDiscussionRetention,
    project,
    documentRetryUnsafe: false,
    queryNavigation,
    studyProposal: updatedStudyProposal,
    ...adoptedProjectInteractionState(current, contributionId, project),
    documents,
    currentContribution: contribution,
    pendingContribution: remainder?.contribution ?? null,
    pendingMixedUserTurnRef: naturalDecision?.prepareRemainingTurn ? naturalDecision.userTurn.turnId : null,
    retainedContributionCandidates: materialization ? current.retainedContributionCandidates ?? [] : [...recordContributionCandidateHumanDecision({
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
      ? { ...trace, humanDecision: projectHumanDecisionForBridgeTrace(project.confirmationDecision), projectVersionAfter: project.versionId }
      : trace),
    scientificExecutionTraceLedger,
    conversationLanguageGateway: naturalDecision?.gatewayState ?? current.conversationLanguageGateway,
    conversationPreferences: naturalDecision?.stylePreference
      ? { responseLength: naturalDecision.stylePreference.responseLength, source: naturalDecision.stylePreference.source }
      : current.conversationPreferences,
    updatedAt: now,
  };
  nextSession = { ...nextSession, scientificDiscussionRetention: settleRetainedDiscussionAdoption(
    nextSession.scientificDiscussionRetention, project, nextSession.retainedContributionCandidates ?? [], updatedStudyProposal) };
  if (proposalSelection) {
    const preparation = nextSession.workingDraftPreparations?.find(p => p.decision === "PENDING" && (materialization
      ? p.checkpoint?.preparationId === materialization.preparationId
      : p.result?.workingDraft.readyReview?.contribution.identity.contributionId === contributionId));
    if (preparation?.checkpoint) nextSession = recordPreparationDecision(nextSession, preparation.checkpoint.preparationId, "ADOPTED", contributionId);
  }
  return { nextSession, project, previousProject: current.project };
}

export function stageProjectRejection(session: FunctionalResetSession, contribution: ScientificInterpretationContributionEnvelope, contributionId: string, now: string, naturalDecision?: NaturalContributionDecisionContext) {
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
  return (current: FunctionalResetSession): FunctionalResetSession => {
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
      ? { ...trace, humanDecision: projectHumanDecisionForBridgeTrace(decision), projectVersionAfter: current.project?.versionId ?? null }
      : trace),
    scientificExecutionTraceLedger,
    conversationLanguageGateway: naturalDecision?.gatewayState ?? current.conversationLanguageGateway,
    conversationPreferences: naturalDecision?.stylePreference
      ? { responseLength: naturalDecision.stylePreference.responseLength, source: naturalDecision.stylePreference.source }
      : current.conversationPreferences,
    updatedAt: now,
  };
  };
}

export function stageStudyProposalSelection(session: FunctionalResetSession, composition: StudyProposalComposition, selectedOptions: readonly string[], selectedAtoms: readonly string[], now: string) {
  const selectedRefs = selectedStudyProposalAtoms(composition, selectedOptions, selectedAtoms);
  const labels = composition.proposal.atoms.filter(a => selectedRefs.includes(a.ref)).map(a => a.content);
  const userTurn: ScientificInterpretationTurn = { turnId: createTurnId(), role: "USER", content: `Je valide les propositions sélectionnées : ${labels.join(" ; ")}`, createdAt: now };
  const proposalTurn = session.runtimeTurns.find(t => t.role === "NOXIA" && t.turnId === composition.sourceResponseRef);
  if (!proposalTurn) throw new Error("STUDY_PROPOSAL_VISIBLE_TURN_NOT_FOUND");
  const contribution = buildStudyProposalSelectionContribution({ composition, selectedOptionRefs: selectedOptions, selectedAtomRefs: selectedAtoms,
    project: session.project, projectId: session.projectId, conversationId: session.conversationId, proposalTurn, selectionTurn: userTurn, createdAt: now });
  const candidate = prepareResearchProjectContributionCandidate(contribution, session.project);
  return { userTurn, contribution, candidate };
}

export function stageStudyProposalDisposition(session: FunctionalResetSession, composition: StudyProposalComposition, status: "REJECTED" | "DEFERRED", selectedOptions: readonly string[], selectedAtoms: readonly string[], now: string) {
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
  return (current: FunctionalResetSession): FunctionalResetSession => ({ ...current, studyProposal: projectStudyProposalDisposition(composition, decision, atomRefs, selectedOptions),
    retainedContributionCandidates: recordContributionCandidateHumanDecision({ retained: markContributionCandidatePresented({
      retained: retainOwnerReviewedCandidate(current, contribution, candidate, userTurn, null, ownerResultNativeDigest), candidateRef: contribution.identity.contributionId, presentedAt: now }),
    candidateRef: contribution.identity.contributionId, decision }),
    runtimeTurns: [...current.runtimeTurns, userTurn, { turnId: createTurnId(), role: "NOXIA", content: feedback, createdAt: now }],
    entries: [...current.entries, { entryId: createConversationEntryId(), kind: "TEXT", role: "USER", content: userTurn.content, createdAt: now },
      { entryId: createConversationEntryId(), kind: "TEXT", role: "NOXIA", content: feedback, createdAt: now }], updatedAt: now });
}
