import { logicalDigest } from "@/features/knowledge-engine";
import {
  canonicalizeScientificContribution,
  type ScientificInterpretationContributionEnvelope,
  type ScientificInterpretationTurn,
} from "@/features/scientific-interpretation";
import {
  makeQueryNavigationId,
  rememberQuestionPresentation,
  type FunctionalResetQueryNavigation,
} from "@/features/query-navigation";
import {
  buildProjectContextSnapshot,
  ensureCanonicalProjectState,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import {
  STUDY_DESIGN_RUNTIME_VERSION,
  type StudyDesignOption,
  type StudyDesignProposalContribution,
} from "@/features/study-design";
import {
  createScientificRunTraceRecorder,
  type ScientificExecutionTraceLedger,
} from "@/features/protocol-designer/scientific-execution-trace";
import {
  invokeStudyDesignForProjectSnapshot,
} from "@/features/protocol-designer/product-study-design-owner-runtime";
import type { ProductOwnerResultLedger } from "@/features/protocol-designer/product-owner-result-ledger";

export const STANDARD_STUDY_DESIGN_INTERACTION_VERSION = "1.0.0" as const;

export type StandardStudyDesignOptionPresentation = {
  optionRef: string;
  label: string;
  rationale: string;
  mainAdvantage: string | null;
  mainLimitation: string | null;
  details: readonly string[];
};

export type StandardStudyDesignPresentation = {
  presentationId: string;
  proposalRef: string;
  title: string;
  introduction: string;
  options: readonly StandardStudyDesignOptionPresentation[];
  majorTradeoff: string | null;
  informationNeed: string | null;
  plainText: string;
};

export type StandardStudyDesignInteraction = {
  contract: "FUNCTIONAL_RESET_STUDY_DESIGN_INTERACTION";
  contractVersion: typeof STANDARD_STUDY_DESIGN_INTERACTION_VERSION;
  owner: "STUDY_DESIGN";
  capabilityId: "STUDY_DESIGN_COHERENCE";
  ownerResultRef: string;
  ownerResultVersion: string;
  sourceActionRef: string;
  sourceProjectRef: string;
  sourceProjectVersion: string;
  sourceProjectDigest: string;
  presentationTurnRef: string;
  traceRunId: string | null;
  status: "ACTIVE" | "PENDING_HUMAN_REVIEW" | "ADOPTED" | "REJECTED" | "STALE";
  selectedOptionRef: string | null;
  pendingContributionRef: string | null;
  adoptedProjectVersion: string | null;
  staleReason: string | null;
  projectWriteAuthorized: false;
};

export type StudyDesignConversationResolution =
  | { kind: "SELECT_OPTION"; optionRef: string }
  | { kind: "DISCUSS"; response: string }
  | { kind: "DEFER"; response: string }
  | { kind: "REJECT_ALL"; response: string }
  | { kind: "FALLTHROUGH" };

const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
const folded = (value: string) => value.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr-FR").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export const isStudyDesignQueryDispatch = (navigation: Readonly<FunctionalResetQueryNavigation>) => {
  const action = navigation.currentAction;
  const selected = navigation.selection.selected;
  return Boolean(action
    && action.owner === "STUDY_DESIGN"
    && action.affectedDecisionRefs.length === 1
    && action.affectedDecisionRefs[0] === "project-section:DESIGN"
    && selected?.capabilityRef === "STUDY_DESIGN_COHERENCE"
    && navigation.projectVersion === action.projectVersion);
};

const optionPresentation = (option: Readonly<StudyDesignOption>): StandardStudyDesignOptionPresentation => ({
  optionRef: option.optionId,
  label: option.label,
  rationale: option.rationale.statement,
  mainAdvantage: option.advantages[0] ?? null,
  mainLimitation: option.limitations[0] ?? null,
  details: unique([
    ...option.prerequisites.map((value) => `Prérequis : ${value}`),
    ...option.consequences.map((value) => `Conséquence : ${value}`),
    ...option.unresolvedQuestions.map((value) => `Point ouvert : ${value}`),
  ]),
});

export const buildStandardStudyDesignPresentation = (
  proposal: Readonly<StudyDesignProposalContribution>,
): StandardStudyDesignPresentation => {
  const options = proposal.options.map(optionPresentation);
  const informationNeed = proposal.informationNeeds.find((need) => need.intendedResolutionPath === "FUTURE_QRY_HANDOFF")
    ?? proposal.informationNeeds[0]
    ?? null;
  const introduction = options.length > 1
    ? "À ce stade, plusieurs stratégies d’étude sont défendables. Elles restent à discuter et aucune n’est adoptée."
    : options.length === 1
      ? "À ce stade, une stratégie d’étude est directement étayée par les éléments du projet. Elle reste à discuter et n’est pas adoptée."
      : "Le projet ne contient pas encore assez d’éléments pour distinguer honnêtement une stratégie d’étude.";
  const majorTradeoff = options.length > 1
    ? options.map((option) => [
      option.label,
      option.mainAdvantage ? `atout : ${option.mainAdvantage}` : null,
      option.mainLimitation ? `limite : ${option.mainLimitation}` : null,
    ].filter(Boolean).join(" — ")).join("\n")
    : null;
  const plainText = [
    introduction,
    ...options.map((option, index) => [
      `${index + 1}. ${option.label}`,
      option.rationale,
      option.mainAdvantage ? `Atout principal : ${option.mainAdvantage}` : null,
      option.mainLimitation ? `Limite principale : ${option.mainLimitation}` : null,
    ].filter(Boolean).join("\n")),
    majorTradeoff ? `Arbitrage principal :\n${majorTradeoff}` : null,
    informationNeed?.question ?? null,
  ].filter((value): value is string => Boolean(value)).join("\n\n");
  return {
    presentationId: `study-design-standard-presentation:${logicalDigest({ proposal: proposal.proposalId, digest: proposal.proposalDigest })}`,
    proposalRef: proposal.proposalId,
    title: options.length ? "Stratégies d’étude à discuter" : "Précision nécessaire sur le design",
    introduction,
    options,
    majorTradeoff,
    informationNeed: informationNeed?.question ?? null,
    plainText,
  };
};

export const readStudyDesignProposalFromLedger = (input: {
  ledger: Readonly<ProductOwnerResultLedger>;
  resultRef: string;
}): Readonly<StudyDesignProposalContribution> | null => {
  const result = [...input.ledger.entries]
    .reverse()
    .find((entry) => entry.result?.resultId === input.resultRef
      && entry.request.owner === "STUDY_DESIGN"
      && entry.request.capabilityId === "STUDY_DESIGN_COHERENCE")?.result;
  const payload = result?.nativePayload as StudyDesignProposalContribution | null | undefined;
  return payload?.contract === "STUDY_DESIGN_PROPOSAL_CONTRIBUTION"
    && payload.owner === "STUDY_DESIGN"
    && payload.capabilityId === "STUDY_DESIGN_COHERENCE"
    && payload.projectWriteAuthorized === false
    ? payload
    : null;
};

const routeInformationNeedBackToQry = (input: {
  navigation: Readonly<FunctionalResetQueryNavigation>;
  proposal: Readonly<StudyDesignProposalContribution>;
  presentation: Readonly<StandardStudyDesignPresentation>;
}) => {
  const need = input.proposal.informationNeeds.find((candidate) => candidate.intendedResolutionPath === "FUTURE_QRY_HANDOFF")
    ?? input.proposal.informationNeeds[0]
    ?? null;
  if (!need || !input.navigation.currentAction || !input.navigation.currentPresentation) return input.navigation;
  const currentAction = {
    ...input.navigation.currentAction,
    owner: need.targetOwner,
    navigationNeedRefs: [need.needId],
    reason: need.reason,
    provenanceRefs: unique([...input.navigation.currentAction.provenanceRefs, input.proposal.proposalId, need.needId, ...need.sourceRefs]),
    limitations: unique([...input.navigation.currentAction.limitations, "RDE_INFORMATION_NEED_RETURNED_TO_QRY"]),
    digest: logicalDigest({
      sourceAction: input.navigation.currentAction.selectedActionId,
      proposal: input.proposal.proposalId,
      need: need.needId,
      reason: need.reason,
    }),
  };
  const currentPresentation = {
    ...input.navigation.currentPresentation,
    selectedActionRef: currentAction.selectedActionId,
    informationNeedRefs: [need.needId],
    informationNeedRef: need.needId,
    intent: need.question,
    answerOwner: currentAction.owner,
    whyNow: need.reason,
    contextRefs: unique([...input.navigation.currentPresentation.contextRefs, input.proposal.proposalId, need.needId]),
    knownOptions: [],
    limitations: unique([...input.navigation.currentPresentation.limitations, "RDE_INFORMATION_NEED_RETURNED_TO_QRY"]),
  };
  const standardQuestion = {
    questionId: makeQueryNavigationId("qry-standard-question", {
      action: currentAction.selectedActionId,
      need: need.needId,
      proposal: input.proposal.proposalId,
    }),
    selectedActionRef: currentAction.selectedActionId,
    informationNeedRefs: [need.needId],
    scopeSectionIds: ["DESIGN" as const],
    priorityLead: "Le prochain point utile est la précision qui permet de distinguer les stratégies d’étude.",
    text: need.question,
    presentationSource: "PD004_WORDING" as const,
    repeatCount: 0,
    presentationOnly: true as const,
    choosesScientificScope: false as const,
  };
  return {
    ...structuredClone(input.navigation),
    currentAction,
    currentPresentation,
    standardQuestion,
    needSections: { ...input.navigation.needSections, [need.needId]: "DESIGN" as const },
    memory: rememberQuestionPresentation(input.navigation.memory, currentPresentation),
  };
};

export const dispatchStudyDesignFromQuery = (input: {
  project: Readonly<ResearchProjectOwnerProjection>;
  navigation: Readonly<FunctionalResetQueryNavigation>;
  ownerResultLedger: Readonly<ProductOwnerResultLedger>;
  traceLedger: Readonly<ScientificExecutionTraceLedger>;
  sessionId: string;
  conversationId: string;
  presentationTurnRef: string;
  startedAt: string;
  completedAt: string;
  traceEnabled?: boolean;
}) => {
  if (!isStudyDesignQueryDispatch(input.navigation)) throw new Error("QRY_ACTION_NOT_OWNED_BY_STUDY_DESIGN");
  if (input.navigation.projectRef !== input.project.projectId
    || input.navigation.projectVersion !== input.project.versionId
    || input.navigation.projectDigest !== input.project.projectDigest) {
    throw new Error("QRY_STUDY_DESIGN_PROJECT_BINDING_STALE");
  }
  const snapshot = buildProjectContextSnapshot({ project: input.project });
  const traceRunId = input.traceEnabled === false ? null : `scientific-study-design-trace:${logicalDigest({
    sessionId: input.sessionId,
    conversationId: input.conversationId,
    action: input.navigation.currentAction!.selectedActionId,
    projectVersion: input.project.versionId,
    projectDigest: input.project.projectDigest,
    startedAt: input.startedAt,
  })}`;
  const trace = traceRunId ? createScientificRunTraceRecorder({
    ledger: input.traceLedger,
    runId: traceRunId,
    projectSnapshot: snapshot,
    initiatorContext: { kind: "EXPLICIT_PRODUCT_CALL", initiatorRef: input.navigation.currentAction!.selectedActionId },
    startedAt: input.startedAt,
  }) : undefined;
  trace?.append({
    eventType: "QRY_ACTION_SELECTED",
    timestamp: input.startedAt,
    owner: "QUERY_NAVIGATION",
    status: "STUDY_DESIGN_SCOPE_SELECTED",
    sourceRefs: [input.navigation.currentAction!.selectedActionId, ...input.navigation.currentAction!.navigationNeedRefs],
    diagnostic: { stage: "PROJECT_CONTEXT", code: "QRY_STUDY_DESIGN_SCOPE_SELECTED" },
    common: {
      stage: "QRY_ACTION_SELECTED",
      responsibilityOwner: "QUERY_NAVIGATION",
      decisionOwner: "QUERY_NAVIGATION",
      executor: "QRY001_FUNCTIONAL_RESET_STANDARD_ADAPTER",
      provider: "NONE",
      componentId: "QRY001_FUNCTIONAL_RESET_STANDARD_ADAPTER",
      componentVersion: input.navigation.contractVersion,
      input: [{ ref: input.project.projectId, version: input.project.versionId, digest: input.project.projectDigest }],
      output: [{ ref: input.navigation.currentAction!.selectedActionId, version: input.navigation.currentAction!.lifecycleVersion, digest: input.navigation.currentAction!.digest }],
      reasonCode: "STUDY_DESIGN_SCOPE_SELECTED",
      completedAt: input.startedAt,
      conversationId: input.conversationId,
      project: {
        projectId: input.project.projectId,
        projectVersion: input.project.versionId,
        projectDigest: input.project.projectDigest,
        snapshotRef: snapshot.snapshotDigest,
      },
    },
  });
  const invocation = invokeStudyDesignForProjectSnapshot({
    projectSnapshot: snapshot,
    ledger: input.ownerResultLedger,
    callerRef: input.navigation.currentAction!.selectedActionId,
    purpose: input.navigation.currentAction!.reason,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    trace,
  });
  const proposal = invocation.result?.nativePayload;
  if (!proposal) {
    trace?.fail(input.completedAt, invocation.observation.failureCode ?? "STUDY_DESIGN_RESULT_MISSING", "STUDY_DESIGN_ENGINE");
    throw new Error(invocation.observation.failureCode ?? "STUDY_DESIGN_RESULT_MISSING");
  }
  const presentation = buildStandardStudyDesignPresentation(proposal);
  trace?.append({
    eventType: "UI_PROJECTION",
    timestamp: input.completedAt,
    owner: "UI",
    status: proposal.options.length ? "STUDY_DESIGN_OPTIONS_PRESENTED" : "STUDY_DESIGN_INFORMATION_NEED_PRESENTED",
    sourceRefs: [proposal.proposalId, ...proposal.options.map((option) => option.optionId)],
    diagnostic: { stage: "STUDY_DESIGN_ENGINE", code: proposal.options.length ? "RDE_OPTIONS_PROJECTED" : "RDE_INFORMATION_NEED_PROJECTED" },
    common: {
      stage: "UI_PROJECTION",
      responsibilityOwner: "STUDY_DESIGN",
      decisionOwner: "NONE",
      executor: "STANDARD_STUDY_DESIGN_PRESENTATION",
      provider: "NONE",
      componentId: "STANDARD_STUDY_DESIGN_PRESENTATION",
      componentVersion: STANDARD_STUDY_DESIGN_INTERACTION_VERSION,
      input: [{ ref: proposal.proposalId, version: proposal.proposalVersion, digest: proposal.proposalDigest }],
      output: [{ ref: presentation.presentationId, version: STANDARD_STUDY_DESIGN_INTERACTION_VERSION, digest: logicalDigest(presentation) }],
      reasonCode: proposal.options.length ? "NON_ADOPTED_OPTIONS_VISIBLE" : "BOUNDED_INFORMATION_NEED_VISIBLE",
      completedAt: input.completedAt,
      conversationId: input.conversationId,
      project: {
        projectId: input.project.projectId,
        projectVersion: input.project.versionId,
        projectDigest: input.project.projectDigest,
        snapshotRef: snapshot.snapshotDigest,
      },
    },
  });
  const interaction: StandardStudyDesignInteraction = {
    contract: "FUNCTIONAL_RESET_STUDY_DESIGN_INTERACTION",
    contractVersion: STANDARD_STUDY_DESIGN_INTERACTION_VERSION,
    owner: "STUDY_DESIGN",
    capabilityId: "STUDY_DESIGN_COHERENCE",
    ownerResultRef: invocation.result!.resultId,
    ownerResultVersion: invocation.result!.resultVersion,
    sourceActionRef: input.navigation.currentAction!.selectedActionId,
    sourceProjectRef: input.project.projectId,
    sourceProjectVersion: input.project.versionId,
    sourceProjectDigest: input.project.projectDigest,
    presentationTurnRef: input.presentationTurnRef,
    traceRunId,
    status: "ACTIVE",
    selectedOptionRef: null,
    pendingContributionRef: null,
    adoptedProjectVersion: null,
    staleReason: null,
    projectWriteAuthorized: false,
  };
  return {
    proposal,
    presentation,
    interaction,
    navigation: proposal.options.length ? input.navigation : routeInformationNeedBackToQry({ navigation: input.navigation, proposal, presentation }),
    ownerResultLedger: invocation.ledger,
    traceLedger: trace?.getLedger() ?? input.traceLedger,
    downstreamHandoffRequests: invocation.downstreamHandoffRequests,
    providerCalls: 0 as const,
    projectWrites: 0 as const,
    humanDecisionCreated: false as const,
  };
};

const optionIndexFromText = (value: string, optionCount: number) => {
  const match = folded(value).match(/\b(?:option\s*)?([abc123])\b/);
  if (!match?.[1]) return null;
  const index = ({ a: 0, "1": 0, b: 1, "2": 1, c: 2, "3": 2 } as Record<string, number>)[match[1]];
  return index !== undefined && index < optionCount ? index : null;
};

const optionMentioned = (value: string, option: Readonly<StudyDesignOption>) => {
  const text = folded(value);
  const labels = unique([
    folded(option.label),
    ...folded(option.label).split(" ").filter((token) => token.length >= 7),
    ...option.family.code.toLocaleLowerCase("fr-FR").split("_").filter((token) => token.length >= 7),
  ]);
  return labels.some((label) => label.length > 0 && text.includes(label));
};

export const resolveStudyDesignConversation = (input: {
  raw: string;
  proposal: Readonly<StudyDesignProposalContribution>;
}): StudyDesignConversationResolution => {
  const value = folded(input.raw);
  if (!input.proposal.options.length) return { kind: "FALLTHROUGH" };
  const rejectsAll = /\b(?:aucune|aucun|rejette|refuse)\b/.test(value) && /\b(?:options?|propositions?|strategies?|designs?)\b/.test(value);
  const carriesAlternative = /\b(?:je voudrais|nous voudrions|a la place|autre chose|plutot une|plutot un)\b/.test(value);
  if (rejectsAll && !carriesAlternative) return {
    kind: "REJECT_ALL",
    response: "Aucune option n’est retenue et le Research Project reste inchangé. Décrivez librement la stratégie que vous souhaitez explorer.",
  };
  if (/\b(?:je ne sais pas|pas encore|plus tard|a discuter)\b/.test(value)) return {
    kind: "DEFER",
    response: "Aucune décision n’est nécessaire maintenant. Les options restent disponibles pour la discussion et le Research Project demeure inchangé.",
  };
  const selectionIntent = /\b(?:je|nous)\s+(?:prefer|chois|reten|opt)|\b(?:retenir|choisir|selectionner)\b/.test(value);
  if (selectionIntent) {
    const indexed = optionIndexFromText(input.raw, input.proposal.options.length);
    if (indexed !== null) return { kind: "SELECT_OPTION", optionRef: input.proposal.options[indexed]!.optionId };
    const matches = input.proposal.options.filter((option) => optionMentioned(input.raw, option));
    if (matches.length === 1) return { kind: "SELECT_OPTION", optionRef: matches[0]!.optionId };
    return { kind: "FALLTHROUGH" };
  }
  if (/\b(?:difference|comparer|compare|explique|pourquoi|avantage|limite|prerequis|consequence)\b/.test(value) || input.raw.trim().endsWith("?")) {
    const mentioned = input.proposal.options.filter((option) => optionMentioned(input.raw, option));
    const options = mentioned.length ? mentioned : input.proposal.options;
    return {
      kind: "DISCUSS",
      response: options.map((option) => [
        option.label,
        option.rationale.statement,
        option.advantages[0] ? `Atout principal : ${option.advantages[0]}` : null,
        option.limitations[0] ? `Limite principale : ${option.limitations[0]}` : null,
      ].filter(Boolean).join("\n")).join("\n\n"),
    };
  }
  return { kind: "FALLTHROUGH" };
};

const activeStudyDesignObject = (project: Readonly<ResearchProjectOwnerProjection>) => ensureCanonicalProjectState(project).objects
  .find((object) => object.actuality === "CURRENT" && object.objectType === "STUDY_DESIGN") ?? null;

export const buildStudyDesignOptionContribution = (input: {
  conversationId: string;
  project: Readonly<ResearchProjectOwnerProjection>;
  proposal: Readonly<StudyDesignProposalContribution>;
  optionRef: string;
  proposalTurn: ScientificInterpretationTurn;
  selectionTurn: ScientificInterpretationTurn;
  createdAt: string;
}): ScientificInterpretationContributionEnvelope => {
  if (input.proposal.sourceProject.projectId !== input.project.projectId
    || input.proposal.sourceProject.projectVersion !== input.project.versionId
    || input.proposal.sourceProject.projectDigest !== input.project.projectDigest) {
    throw new Error("STUDY_DESIGN_PROPOSAL_STALE_PROJECT_VERSION");
  }
  const option = input.proposal.options.find((candidate) => candidate.optionId === input.optionRef);
  if (!option) throw new Error("STUDY_DESIGN_OPTION_NOT_FOUND");
  const currentDesign = activeStudyDesignObject(input.project);
  const semanticIdentity = currentDesign?.objectId ?? `${input.project.projectId}:study-design`;
  const itemId = `study-design-selection:${logicalDigest({ proposal: input.proposal.proposalId, option: option.optionId, turn: input.selectionTurn.turnId })}`;
  return canonicalizeScientificContribution({
    contract: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ENVELOPE",
    contractNature: "RUNTIME_CONTRIBUTION_NOT_PD003_ROOT",
    identity: {
      contributionId: `study-design-contribution:${logicalDigest({ proposal: input.proposal.proposalId, option: option.optionId, turn: input.selectionTurn.turnId })}`,
      previousContributionId: input.project.contributionRef,
      contractVersion: "1.0.0",
      runtimeId: "STANDARD_STUDY_DESIGN_CONTRIBUTION_ADAPTER",
      runtimeVersion: STANDARD_STUDY_DESIGN_INTERACTION_VERSION,
      createdAt: input.createdAt,
    },
    source: {
      conversationId: input.conversationId,
      originalRequest: input.selectionTurn.content,
      turns: [input.proposalTurn, input.selectionTurn],
      sourceRefs: unique([
        input.proposal.proposalId,
        input.proposal.proposalDigest,
        option.optionId,
        input.project.projectId,
        input.project.versionId,
        input.project.projectDigest,
        input.proposalTurn.turnId,
        input.selectionTurn.turnId,
      ]),
      rawOutputRef: input.proposal.proposalId,
      rawOutputDigest: input.proposal.proposalDigest,
    },
    runtimeEvidence: {
      provider: null,
      model: null,
      promptDigest: null,
      schemaDigest: logicalDigest("STUDY_DESIGN_PROPOSAL_CONTRIBUTION"),
      configurationDigest: logicalDigest({ runtime: "STANDARD_STUDY_DESIGN_CONTRIBUTION_ADAPTER", version: STANDARD_STUDY_DESIGN_INTERACTION_VERSION }),
      technicalStatus: "LOCAL_NATIVE_OWNER_OPTION_SELECTED_PENDING_HUMAN_REVIEW",
      parseStatus: "NOT_REQUIRED",
      validationErrors: [],
    },
    scientificContent: {
      normalizedUnderstanding: `Option de design retenue pour revue humaine : ${option.label}`,
      routeProposal: null,
      explicitStatements: [],
      candidateObjects: [{
        itemId,
        semanticIdentity,
        proposedType: "STUDY_DESIGN",
        content: option.label,
        polarity: "AFFIRMED",
        studyRole: option.family.code,
        confidence: null,
        previousItemIds: currentDesign ? [currentDesign.objectId, ...currentDesign.sourceItemRefs] : [],
        evidenceRefs: unique([
          input.proposal.proposalId,
          input.proposal.proposalDigest,
          option.optionId,
          input.project.projectId,
          input.project.versionId,
          input.project.projectDigest,
          ...option.rationale.evidenceRefs,
          ...option.provenanceRefs,
        ]),
        epistemicBoundary: {
          ownership: "STUDY_DESIGN",
          epistemicState: "KNOWN",
          epistemicStatus: "OWNER_SUPPORTED_CANDIDATE",
          adoptionStatus: "CANDIDATE_PENDING_HUMAN_CONFIRMATION",
          originType: "OWNER_RESULT",
          originStatus: "STUDY_DESIGN_PROPOSAL_OPTION",
          decisionId: null,
          activeState: true,
          sourceTurnIds: [input.proposalTurn.turnId, input.selectionTurn.turnId],
          sourceText: input.selectionTurn.content,
        },
      }],
      candidateRelations: [],
      inferredContext: [],
      contextualCandidates: [],
      negationsAndConstraints: [],
      temporalElements: [],
      ambiguities: [],
      unknowns: [],
      missingInformation: [],
      correctionsAndSupersessions: [],
      openDecisions: [],
      clarificationNeeds: [],
      temporalQualifications: [],
      expectedVariableOccasions: [],
    },
    epistemicBoundary: {
      candidateIsAdopted: false,
      knowledgeSupportIsProjectDecision: false,
      projectOwnershipTransferred: false,
      humanDecisionEnvelopeRef: null,
    },
    mapping: [{
      sourceItemId: itemId,
      proposedTargetDomain: "RESEARCH_PROJECT",
      proposedTargetTypes: ["STUDY_DESIGN"],
      mappingStatus: "EXACT_CONTRIBUTION",
      qualificationOwnerRequired: null,
      mappingLimitations: ["HUMAN_CONFIRMATION_REQUIRED", "RDE_CONSEQUENCES_NOT_PROMOTED"],
    }],
    audit: { deterministicFindings: [], semanticAuditFindings: [], unresolvedFindings: [] },
    decisionBoundary: {
      decisionRequired: true,
      decisionEnvelopeRef: null,
      permittedHumanDispositions: ["ACCEPT_WORKING_BASIS", "REJECT", "DEFER", "REOPEN", "PARTIAL_SELECTION", "ROUTE_TO_SPECIALIST"],
      projectWriteAuthorized: false,
    },
  });
};

export const interactionMatchesCurrentProject = (
  interaction: Readonly<StandardStudyDesignInteraction>,
  project: Readonly<ResearchProjectOwnerProjection>,
) => interaction.sourceProjectRef === project.projectId
  && interaction.sourceProjectVersion === project.versionId
  && interaction.sourceProjectDigest === project.projectDigest;
