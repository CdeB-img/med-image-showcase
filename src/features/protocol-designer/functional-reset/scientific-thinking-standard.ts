import { logicalDigest } from "@/features/knowledge-engine";
import {
  buildScientificThinkingInput,
  executeScientificThinkingEngine,
  SCIENTIFIC_THINKING_ENGINE_VERSION,
  type ScientificModelCandidate,
  type ScientificThinkingOutput,
} from "@/features/scientific-thinking";
import type { PreProjectScientificNavigationContribution } from "@/features/query-navigation";
import {
  canonicalizeScientificContribution,
  type ScientificContributionItem,
  type ScientificInterpretationContributionEnvelope,
  type ScientificInterpretationTurn,
} from "@/features/scientific-interpretation";
import { projectScientificContributionToV1IfAllowed } from "@/features/scientific-interpretation/v1-compatibility";
import type { FunctionalResetQueryNavigation } from "@/features/query-navigation";
import {
  buildProjectContextSnapshot,
  ensureCanonicalProjectState,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import { invokeScientificThinkingForProject } from "@/features/protocol-designer/product-scientific-thinking-owner-runtime";
import type { ProductOwnerResultLedger } from "@/features/protocol-designer/product-owner-result-ledger";
import {
  createScientificRunTraceRecorder,
  type ScientificExecutionTraceLedger,
} from "@/features/protocol-designer/scientific-execution-trace";

export const STANDARD_SCIENTIFIC_THINKING_INTERACTION_VERSION = "1.0.0" as const;

export type StandardScientificCandidatePresentation = {
  candidateRef: string;
  kind: "QUESTION" | "HYPOTHESIS" | "SCIENTIFIC_MODEL";
  label: string;
  rationale: string;
  uncertainties: readonly string[];
};

export type StandardScientificThinkingPresentation = {
  presentationId: string;
  outputRef: string;
  title: string;
  introduction: string;
  candidates: readonly StandardScientificCandidatePresentation[];
  informationNeeds: readonly string[];
  plainText: string;
};

export type StandardScientificThinkingInteraction = {
  contract: "FUNCTIONAL_RESET_SCIENTIFIC_THINKING_INTERACTION";
  contractVersion: typeof STANDARD_SCIENTIFIC_THINKING_INTERACTION_VERSION;
  owner: "SCIENTIFIC_THINKING";
  capabilityId: "SCIENTIFIC_THINKING_PROPOSAL";
  ownerResultRef: string;
  ownerResultVersion: string;
  sourceActionRef: string;
  sourceProjectRef: string;
  sourceProjectVersion: string;
  sourceProjectDigest: string;
  presentationTurnRef: string;
  traceRunId: string | null;
  status: "ACTIVE" | "PENDING_HUMAN_REVIEW" | "ADOPTED" | "REJECTED" | "STALE";
  selectedCandidateRef: string | null;
  pendingContributionRef: string | null;
  adoptedProjectVersion: string | null;
  staleReason: string | null;
  projectWriteAuthorized: false;
};

export type ScientificThinkingConversationResolution =
  | { kind: "SELECT_CANDIDATE"; candidateRef: string }
  | { kind: "DISCUSS"; response: string }
  | { kind: "DEFER"; response: string }
  | { kind: "FALLTHROUGH" };

export type PreProjectScientificThinkingIntervention = Readonly<{
  output: ScientificThinkingOutput;
  navigationContribution: PreProjectScientificNavigationContribution | null;
  providerCalls: 0;
  projectWrites: 0;
}>;

const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
const folded = (value: string) => value.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr-FR").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export const buildPreProjectScientificThinkingIntervention = (input: {
  contribution: Readonly<ScientificInterpretationContributionEnvelope>;
  sessionId: string;
  sourceJourney: "UNDERSTAND" | "FORMALIZE_IDEA" | "DESIGN_STUDY";
}): PreProjectScientificThinkingIntervention | null => {
  const result = projectScientificContributionToV1IfAllowed(input.contribution);
  if (!result.projection) return null;
  const { validatedIntent, scientificSessionContext } = result.projection;
  const scientificInput = buildScientificThinkingInput(
    validatedIntent,
    scientificSessionContext.preservedScientificTerms,
    scientificSessionContext.detectedRelationships,
    null,
    {
      sessionId: input.sessionId,
      contextVersion: scientificSessionContext.contextVersion,
      sourceJourney: input.sourceJourney,
    },
  );
  const output = executeScientificThinkingEngine(scientificInput);
  const question = output.adaptiveQuestions.find((candidate) =>
    candidate.questionId === "ST-AQ-OBJECTIVE-STRUCTURE"
    && candidate.blocking
    && !candidate.answeredValue) ?? null;
  const navigationContribution = question ? {
    owner: "SCIENTIFIC_THINKING" as const,
    sourceRef: output.outputId,
    sourceVersion: output.contractVersion,
    informationNeedRef: question.questionId,
    informationNeed: question.label,
    whySelected: question.whyAsked,
    decisionImpact: question.decisionImpact,
    affectedDecisionRefs: [`pre-project-decision:${question.decisionBlock.toLocaleLowerCase("en-US")}`],
    affectedBranchRefs: [`pre-project-branch:${question.decisionBlock.toLocaleLowerCase("en-US")}`],
    knownOptions: question.suggestedAnswers.map((answer) => answer.label),
  } satisfies PreProjectScientificNavigationContribution : null;
  return Object.freeze({ output, navigationContribution, providerCalls: 0 as const, projectWrites: 0 as const });
};

export const isScientificThinkingQueryDispatch = (navigation: Readonly<FunctionalResetQueryNavigation>) => {
  const action = navigation.currentAction;
  const selected = navigation.selection.selected;
  return Boolean(action
    && action.owner === "SCIENTIFIC_THINKING"
    && action.affectedDecisionRefs.length === 1
    && action.affectedDecisionRefs[0] === "project-section:QUESTION"
    && selected?.capabilityRef === "SCIENTIFIC_THINKING_PROPOSAL"
    && navigation.projectVersion === action.projectVersion);
};

const modelPresentation = (candidate: Readonly<ScientificModelCandidate>): StandardScientificCandidatePresentation => ({
  candidateRef: candidate.modelId,
  kind: "SCIENTIFIC_MODEL",
  label: candidate.text,
  rationale: candidate.rationale,
  uncertainties: candidate.uncertainties,
});

export const buildStandardScientificThinkingPresentation = (
  output: Readonly<ScientificThinkingOutput>,
): StandardScientificThinkingPresentation => {
  const candidates: StandardScientificCandidatePresentation[] = [
    ...output.questions.map((candidate) => ({
      candidateRef: candidate.questionId,
      kind: "QUESTION" as const,
      label: candidate.text,
      rationale: candidate.rationale,
      uncertainties: candidate.testability === "TESTABLE_CANDIDATE" ? [] : ["Cette formulation doit encore être précisée avant adoption."],
    })),
    ...output.hypotheses.map((candidate) => ({
      candidateRef: candidate.hypothesisId,
      kind: "HYPOTHESIS" as const,
      label: candidate.text,
      rationale: candidate.observableCondition,
      uncertainties: unique([...candidate.unknowns, ...candidate.limitations]),
    })),
    ...output.scientificModels.map(modelPresentation),
  ];
  const testableQuestions = output.questions.filter((candidate) => candidate.testability === "TESTABLE_CANDIDATE").length;
  const introduction = output.hypotheses.length > 1
    ? "À ce stade, plusieurs hypothèses restent compatibles avec le projet. Aucune n’est privilégiée ni adoptée."
    : testableQuestions > 0
      ? "Voici une formulation scientifique de travail et les propositions qu’elle permet d’examiner. Rien n’est encore adopté."
      : "Le projet reste trop ouvert pour formuler honnêtement une hypothèse. Voici la précision scientifique nécessaire avant d’aller plus loin.";
  const informationNeeds = unique([
    ...output.adaptiveQuestions.filter((question) => question.blocking && !question.answeredValue).map((question) => question.label),
    ...output.unknowns,
  ]).slice(0, 5);
  const questionCandidates = candidates.filter((candidate) => candidate.kind === "QUESTION");
  const hypothesisCandidates = candidates.filter((candidate) => candidate.kind === "HYPOTHESIS");
  const modelCandidates = candidates.filter((candidate) => candidate.kind === "SCIENTIFIC_MODEL");
  const plainText = [
    introduction,
    ...questionCandidates.map((candidate, index) => `Question ${index + 1}\n${candidate.label}\n${candidate.rationale}`),
    ...hypothesisCandidates.map((candidate, index) => `Hypothèse ${index + 1}\n${candidate.label}\nPour la confronter : ${candidate.rationale}`),
    ...modelCandidates.map((candidate, index) => `Modèle explicatif ${index + 1}\n${candidate.label}\n${candidate.rationale}`),
    informationNeeds.length ? `Points à préciser\n${informationNeeds.map((need) => `– ${need}`).join("\n")}` : null,
    candidates.length ? "Vous pouvez discuter ces propositions ou indiquer explicitement celle que vous souhaitez soumettre à confirmation." : null,
  ].filter((value): value is string => Boolean(value)).join("\n\n");
  return {
    presentationId: `scientific-thinking-standard-presentation:${logicalDigest({ output: output.outputId, digest: output.outputDigest })}`,
    outputRef: output.outputId,
    title: output.hypotheses.length > 1 ? "Hypothèses scientifiques à discuter" : "Question scientifique à préciser",
    introduction,
    candidates,
    informationNeeds,
    plainText,
  };
};

export const readScientificThinkingOutputFromLedger = (input: {
  ledger: Readonly<ProductOwnerResultLedger>;
  resultRef: string;
}): Readonly<ScientificThinkingOutput> | null => {
  const result = [...input.ledger.entries]
    .reverse()
    .find((entry) => entry.result?.resultId === input.resultRef
      && entry.request.owner === "SCIENTIFIC_THINKING"
      && entry.request.capabilityId === "SCIENTIFIC_THINKING_PROPOSAL")?.result;
  const output = result?.nativePayload as ScientificThinkingOutput | null | undefined;
  return output?.contractVersion === SCIENTIFIC_THINKING_ENGINE_VERSION
    && output.projectWriteAuthorized === false
    && output.candidateIsAdopted === false
    ? output
    : null;
};

export const dispatchScientificThinkingFromQuery = (input: {
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
  if (!isScientificThinkingQueryDispatch(input.navigation)) throw new Error("QRY_ACTION_NOT_OWNED_BY_SCIENTIFIC_THINKING");
  if (input.navigation.projectRef !== input.project.projectId
    || input.navigation.projectVersion !== input.project.versionId
    || input.navigation.projectDigest !== input.project.projectDigest) {
    throw new Error("QRY_SCIENTIFIC_THINKING_PROJECT_BINDING_STALE");
  }
  const snapshot = buildProjectContextSnapshot({ project: input.project });
  const traceRunId = input.traceEnabled === false ? null : `scientific-thinking-standard-trace:${logicalDigest({
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
    status: "SCIENTIFIC_THINKING_SCOPE_SELECTED",
    sourceRefs: [input.navigation.currentAction!.selectedActionId, ...input.navigation.currentAction!.navigationNeedRefs],
    diagnostic: { stage: "PROJECT_CONTEXT", code: "QRY_SCIENTIFIC_THINKING_SCOPE_SELECTED" },
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
      reasonCode: "SCIENTIFIC_THINKING_SCOPE_SELECTED",
      completedAt: input.startedAt,
      conversationId: input.conversationId,
      project: { projectId: input.project.projectId, projectVersion: input.project.versionId, projectDigest: input.project.projectDigest, snapshotRef: snapshot.snapshotDigest },
    },
  });
  const invocation = invokeScientificThinkingForProject({
    project: input.project,
    projectSnapshot: snapshot,
    ledger: input.ownerResultLedger,
    callerRef: input.navigation.currentAction!.selectedActionId,
    purpose: input.navigation.currentAction!.reason,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    trace,
  });
  const output = invocation.result?.nativePayload;
  if (!output) {
    trace?.fail(input.completedAt, invocation.observation.failureCode ?? "SCIENTIFIC_THINKING_RESULT_MISSING", "SCIENTIFIC_THINKING_ENGINE");
    throw new Error(invocation.observation.failureCode ?? "SCIENTIFIC_THINKING_RESULT_MISSING");
  }
  const presentation = buildStandardScientificThinkingPresentation(output);
  trace?.append({
    eventType: "UI_PROJECTION",
    timestamp: input.completedAt,
    owner: "UI",
    status: "SCIENTIFIC_THINKING_PROPOSALS_PRESENTED",
    sourceRefs: [output.outputId, ...presentation.candidates.map((candidate) => candidate.candidateRef)],
    diagnostic: { stage: "SCIENTIFIC_THINKING_ENGINE", code: "ST_PROPOSALS_PROJECTED" },
    common: {
      stage: "UI_PROJECTION",
      responsibilityOwner: "SCIENTIFIC_THINKING",
      decisionOwner: "NONE",
      executor: "STANDARD_SCIENTIFIC_THINKING_PRESENTATION",
      provider: "NONE",
      componentId: "STANDARD_SCIENTIFIC_THINKING_PRESENTATION",
      componentVersion: STANDARD_SCIENTIFIC_THINKING_INTERACTION_VERSION,
      input: [{ ref: output.outputId, version: output.contractVersion, digest: output.outputDigest }],
      output: [{ ref: presentation.presentationId, version: STANDARD_SCIENTIFIC_THINKING_INTERACTION_VERSION, digest: logicalDigest(presentation) }],
      reasonCode: "NON_ADOPTED_SCIENTIFIC_PROPOSALS_VISIBLE",
      completedAt: input.completedAt,
      conversationId: input.conversationId,
      project: { projectId: input.project.projectId, projectVersion: input.project.versionId, projectDigest: input.project.projectDigest, snapshotRef: snapshot.snapshotDigest },
    },
  });
  const interaction: StandardScientificThinkingInteraction = {
    contract: "FUNCTIONAL_RESET_SCIENTIFIC_THINKING_INTERACTION",
    contractVersion: STANDARD_SCIENTIFIC_THINKING_INTERACTION_VERSION,
    owner: "SCIENTIFIC_THINKING",
    capabilityId: "SCIENTIFIC_THINKING_PROPOSAL",
    ownerResultRef: invocation.result!.resultId,
    ownerResultVersion: invocation.result!.resultVersion,
    sourceActionRef: input.navigation.currentAction!.selectedActionId,
    sourceProjectRef: input.project.projectId,
    sourceProjectVersion: input.project.versionId,
    sourceProjectDigest: input.project.projectDigest,
    presentationTurnRef: input.presentationTurnRef,
    traceRunId,
    status: "ACTIVE",
    selectedCandidateRef: null,
    pendingContributionRef: null,
    adoptedProjectVersion: null,
    staleReason: null,
    projectWriteAuthorized: false,
  };
  return {
    output,
    presentation,
    interaction,
    ownerResultLedger: invocation.ledger,
    traceLedger: trace?.getLedger() ?? input.traceLedger,
    downstreamHandoffs: output.downstreamHandoffs,
    providerCalls: 0 as const,
    projectWrites: 0 as const,
    humanDecisionCreated: false as const,
  };
};

const candidateIndex = (raw: string, label: string, count: number) => {
  const value = folded(raw);
  const numeric = value.match(new RegExp(`\\b${label}\\s*(?:numero\\s*)?([123])\\b`))?.[1];
  const ordinal = value.match(new RegExp(`\\b(?:la |le )?(premiere|premier|deuxieme|troisieme)\\s+${label}\\b`))?.[1];
  const index = numeric ? Number(numeric) - 1 : ordinal ? ({ premiere: 0, premier: 0, deuxieme: 1, troisieme: 2 } as Record<string, number>)[ordinal] : null;
  return index !== null && index !== undefined && index < count ? index : null;
};

export const resolveScientificThinkingConversation = (input: {
  raw: string;
  output: Readonly<ScientificThinkingOutput>;
}): ScientificThinkingConversationResolution => {
  const value = folded(input.raw);
  if (/\b(?:je ne sais pas|pas encore|plus tard|a discuter)\b/.test(value)) return {
    kind: "DEFER",
    response: "Aucune décision n’est nécessaire maintenant. Les propositions restent discutables et le Research Project demeure inchangé.",
  };
  const selectionIntent = /\b(?:je|nous)\s+(?:prefer|chois|reten)|\b(?:retenir|choisir|selectionner|adopter)\b/.test(value);
  if (selectionIntent) {
    const groups = [
      { label: "hypothese", values: input.output.hypotheses.map((candidate) => candidate.hypothesisId) },
      { label: "question", values: input.output.questions.map((candidate) => candidate.questionId) },
      { label: "modele", values: input.output.scientificModels.map((candidate) => candidate.modelId) },
    ];
    for (const group of groups) {
      const index = candidateIndex(input.raw, group.label, group.values.length);
      if (index !== null) return { kind: "SELECT_CANDIDATE", candidateRef: group.values[index]! };
    }
    const all = [...input.output.questions.map((candidate) => ({ ref: candidate.questionId, text: candidate.text })),
      ...input.output.hypotheses.map((candidate) => ({ ref: candidate.hypothesisId, text: candidate.text })),
      ...input.output.scientificModels.map((candidate) => ({ ref: candidate.modelId, text: candidate.text }))];
    const mentioned = all.filter((candidate) => folded(candidate.text).split(" ").filter((token) => token.length >= 7).some((token) => value.includes(token)));
    if (mentioned.length === 1) return { kind: "SELECT_CANDIDATE", candidateRef: mentioned[0]!.ref };
  }
  if (/\b(?:pourquoi|explique|difference|comparer|compare|argument|limite|incertitude)\b/.test(value) || input.raw.trim().endsWith("?")) {
    const hypotheses = input.output.hypotheses;
    const response = hypotheses.length
      ? hypotheses.map((candidate, index) => [
        `Hypothèse ${index + 1} : ${candidate.text}`,
        candidate.observableCondition,
        candidate.limitations[0] ? `Limite : ${candidate.limitations[0]}` : null,
      ].filter(Boolean).join("\n")).join("\n\n")
      : input.output.questions.map((candidate) => `${candidate.text}\n${candidate.rationale}`).join("\n\n");
    return { kind: "DISCUSS", response };
  }
  return { kind: "FALLTHROUGH" };
};

const selectedCandidate = (output: Readonly<ScientificThinkingOutput>, candidateRef: string) => {
  const question = output.questions.find((candidate) => candidate.questionId === candidateRef);
  if (question) return { kind: "QUESTION" as const, text: question.text, rationale: question.rationale, support: question.support };
  const hypothesis = output.hypotheses.find((candidate) => candidate.hypothesisId === candidateRef);
  if (hypothesis) return { kind: "HYPOTHESIS" as const, text: hypothesis.text, rationale: hypothesis.observableCondition, support: hypothesis.support };
  const model = output.scientificModels.find((candidate) => candidate.modelId === candidateRef);
  if (model) return { kind: "SCIENTIFIC_MODEL" as const, text: model.text, rationale: model.rationale, support: model.support };
  return null;
};

export const buildScientificThinkingSelectionContribution = (input: {
  conversationId: string;
  project: Readonly<ResearchProjectOwnerProjection>;
  output: Readonly<ScientificThinkingOutput>;
  candidateRef: string;
  proposalTurn: ScientificInterpretationTurn;
  selectionTurn: ScientificInterpretationTurn;
  createdAt: string;
}): ScientificInterpretationContributionEnvelope => {
  if (!input.output.sourceProject
    || input.output.sourceProject.projectId !== input.project.projectId
    || input.output.sourceProject.projectVersion !== input.project.versionId
    || input.output.sourceProject.projectDigest !== input.project.projectDigest) {
    throw new Error("SCIENTIFIC_THINKING_PROPOSAL_STALE_PROJECT_VERSION");
  }
  const candidate = selectedCandidate(input.output, input.candidateRef);
  if (!candidate) throw new Error("SCIENTIFIC_THINKING_CANDIDATE_NOT_FOUND");
  const objectType = candidate.kind === "QUESTION" ? "SCIENTIFIC_QUESTION" : candidate.kind;
  const currentObject = ensureCanonicalProjectState(input.project).objects.find((object) => object.actuality === "CURRENT"
    && object.objectType === objectType) ?? null;
  const semanticIdentity = currentObject?.objectId ?? `${input.project.projectId}:${candidate.kind.toLocaleLowerCase("en-US")}:${logicalDigest(candidate.text)}`;
  const itemId = `scientific-thinking-selection:${logicalDigest({ output: input.output.outputId, candidate: input.candidateRef, turn: input.selectionTurn.turnId })}`;
  const item: ScientificContributionItem = {
    itemId,
    semanticIdentity,
    proposedType: objectType,
    content: candidate.text,
    polarity: "AFFIRMED",
    studyRole: candidate.kind === "HYPOTHESIS" ? "SCIENTIFIC_HYPOTHESIS_CANDIDATE" : candidate.kind === "QUESTION" ? "SCIENTIFIC_QUESTION_CANDIDATE" : "SCIENTIFIC_MODEL_CANDIDATE",
    confidence: null,
    previousItemIds: currentObject ? [currentObject.objectId, ...currentObject.sourceItemRefs] : [],
    evidenceRefs: unique([input.output.outputId, input.output.outputDigest, input.candidateRef, ...input.output.provenance.sourceRefs]),
    epistemicBoundary: {
      ownership: "SCIENTIFIC_THINKING",
      epistemicStatus: ["SUPPORTED", "PARTIAL"].includes(candidate.support) ? "SUPPORTED_CANDIDATE" : "UNSUPPORTED_CANDIDATE",
      adoptionStatus: "CANDIDATE_PENDING_HUMAN_CONFIRMATION",
      originType: "OWNER_RESULT",
      originStatus: "NATIVE_SCIENTIFIC_THINKING_CANDIDATE",
      activeState: true,
      sourceTurnIds: [input.proposalTurn.turnId, input.selectionTurn.turnId],
      sourceText: input.selectionTurn.content,
    },
  };
  return canonicalizeScientificContribution({
    contract: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ENVELOPE",
    contractNature: "RUNTIME_CONTRIBUTION_NOT_PD003_ROOT",
    identity: {
      contributionId: `scientific-thinking-contribution:${logicalDigest({ output: input.output.outputId, candidate: input.candidateRef, turn: input.selectionTurn.turnId })}`,
      previousContributionId: input.project.contributionRef,
      contractVersion: "1.0.0",
      runtimeId: "STANDARD_SCIENTIFIC_THINKING_CONTRIBUTION_ADAPTER",
      runtimeVersion: STANDARD_SCIENTIFIC_THINKING_INTERACTION_VERSION,
      createdAt: input.createdAt,
    },
    source: {
      conversationId: input.conversationId,
      originalRequest: input.selectionTurn.content,
      turns: [input.proposalTurn, input.selectionTurn],
      sourceRefs: unique([input.output.outputId, input.output.outputDigest, input.candidateRef, input.proposalTurn.turnId, input.selectionTurn.turnId]),
      rawOutputRef: input.output.outputId,
      rawOutputDigest: input.output.outputDigest,
    },
    runtimeEvidence: {
      provider: null,
      model: null,
      promptDigest: null,
      schemaDigest: logicalDigest("SCIENTIFIC_THINKING_SELECTION_CONTRIBUTION"),
      configurationDigest: logicalDigest({ runtime: "STANDARD_SCIENTIFIC_THINKING_CONTRIBUTION_ADAPTER", version: STANDARD_SCIENTIFIC_THINKING_INTERACTION_VERSION }),
      technicalStatus: "LOCAL_NATIVE_OWNER_CANDIDATE_SELECTED_PENDING_HUMAN_REVIEW",
      parseStatus: "NOT_REQUIRED",
      validationErrors: [],
    },
    scientificContent: {
      normalizedUnderstanding: `Proposition scientifique retenue pour revue humaine : ${candidate.text}`,
      routeProposal: null,
      explicitStatements: [],
      candidateObjects: [item],
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
      sourceItemId: item.itemId,
      proposedTargetDomain: "RESEARCH_PROJECT",
      proposedTargetTypes: [objectType],
      mappingStatus: "DOMAIN_REVIEW_REQUIRED",
      qualificationOwnerRequired: "RESEARCH_PROJECT",
      mappingLimitations: ["HUMAN_CONFIRMATION_REQUIRED", "SCIENTIFIC_THINKING_PROPOSAL_NOT_PROJECT_TRUTH"],
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

export const scientificThinkingInteractionMatchesCurrentProject = (
  interaction: Readonly<StandardScientificThinkingInteraction>,
  project: Readonly<ResearchProjectOwnerProjection>,
) => interaction.sourceProjectRef === project.projectId
  && interaction.sourceProjectVersion === project.versionId
  && interaction.sourceProjectDigest === project.projectDigest;
