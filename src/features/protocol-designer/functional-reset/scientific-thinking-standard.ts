import { logicalDigest } from "@/features/knowledge-engine";
import {
  buildScientificThinkingInput,
  executeScientificThinkingEngine,
  SCIENTIFIC_THINKING_ENGINE_VERSION,
  type ScientificModelCandidate,
  type ScientificThinkingOperation,
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
import { selectBoundedConversationInteraction } from "@/features/query-navigation/current-navigation-evidence";
import {
  buildProjectContextSnapshot,
  buildScientificThinkingInputFromProjectSnapshot,
  ensureCanonicalProjectState,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import {
  invokeScientificThinkingForProject,
  readProductScientificThinkingOwnerResult,
} from "@/features/protocol-designer/product-scientific-thinking-owner-runtime";
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
  presentedCandidateDigests?: readonly string[];
  presentedCandidateRefs?: readonly string[];
  selectionAnchor?: Readonly<{
    ownerResultRef: string;
    presentationTurnRef: string;
    presentedCandidateRefs?: readonly string[];
    traceRunId: string | null;
  }>;
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

const scientificCandidateDigest = (candidate: Readonly<StandardScientificCandidatePresentation>) => logicalDigest({
  kind: candidate.kind,
  label: candidate.label,
  rationale: candidate.rationale,
  uncertainties: unique(candidate.uncertainties),
});

export const buildStandardScientificThinkingPresentation = (
  output: Readonly<ScientificThinkingOutput>,
  request: Readonly<{
    requestedOperation?: ScientificThinkingOperation;
    presentedCandidateDigests?: readonly string[];
    projectUnknowns?: readonly { text: string }[];
  }> = {},
): StandardScientificThinkingPresentation => {
  if (request.requestedOperation === "GENERATE_ALTERNATIVE_HYPOTHESIS") {
    const availableCandidates = output.hypotheses.map((candidate) => ({
      candidateRef: candidate.hypothesisId,
      kind: "HYPOTHESIS" as const,
      label: candidate.text,
      rationale: candidate.observableCondition,
      uncertainties: unique(candidate.limitations),
    }));
    const alreadyPresented = new Set(request.presentedCandidateDigests ?? []);
    const candidates = availableCandidates.filter((candidate) => !alreadyPresented.has(scientificCandidateDigest(candidate)));
    const informationNeeds = unique([...(request.projectUnknowns ?? []).map((unknown) => unknown.text), ...output.adaptiveQuestions
      .filter((question) => question.blocking && !question.answeredValue)
      .map((question) => question.label)]);
    const introduction = candidates.length
      ? "Voici des hypothèses scientifiques candidates à discuter à partir des éléments confirmés du projet. Aucune n’est privilégiée ni adoptée."
      : availableCandidates.length
        ? "Avec les éléments actuellement disponibles, je n’ai pas d’hypothèse supplémentaire défendable à ajouter aux propositions déjà présentées."
        : "Je ne peux pas proposer ici d’hypothèse supplémentaire défendable : aucune justification scientifique distincte n’est établie dans les éléments examinés. Reformuler les éléments déjà confirmés ne constitue pas une nouvelle proposition.";
    const plainText = [
      introduction,
      ...candidates.map((candidate) => [
        `Hypothèse ${output.hypotheses.findIndex((hypothesis) => hypothesis.hypothesisId === candidate.candidateRef) + 1}\n${candidate.label}`,
        `Pour la confronter : ${candidate.rationale}`,
        ...candidate.uncertainties.map((limitation) => `Limite : ${limitation}`),
      ].join("\n")),
      !output.knowledgeDependencies.length
        ? "Ces propositions ne disposent pas ici d’un appui documentaire vérifié ; elles restent à confronter aux connaissances disponibles."
        : null,
      informationNeeds.length ? `Points à préciser\n${informationNeeds.map((need) => `– ${need}`).join("\n")}` : null,
      candidates.length
        ? "Vous pouvez discuter ces propositions ou indiquer explicitement celle que vous souhaitez soumettre à confirmation. Le projet reste inchangé."
        : "Cette limite porte sur le projet et les éléments disponibles ici ; elle ne signifie pas que toutes les possibilités scientifiques ont été explorées. Préciser les inconnues ou apporter des connaissances supplémentaires permettra de réexaminer les options. Le projet reste inchangé.",
    ].filter((value): value is string => Boolean(value)).join("\n\n");
    return {
      presentationId: `scientific-thinking-standard-presentation:${logicalDigest({ output: output.outputId, digest: output.outputDigest, requestedOperation: request.requestedOperation, candidates: candidates.map(scientificCandidateDigest) })}`,
      outputRef: output.outputId,
      title: candidates.length ? "Hypothèses scientifiques à discuter" : "Limite des propositions disponibles",
      introduction,
      candidates,
      informationNeeds,
      plainText,
    };
  }
  const contextualProjectQuestion = output.questions.find((candidate) => candidate.questionId === "ST-Q-PROJECT-CONTEXT-001") ?? null;
  if (contextualProjectQuestion) {
    const explicitProjectHypotheses = output.hypotheses.filter((candidate) => candidate.hypothesisId.startsWith("ST-H-PROJECT-"));
    const questionCandidates = output.questions.map((candidate) => ({
      candidateRef: candidate.questionId,
      kind: "QUESTION" as const,
      label: candidate.text,
      rationale: candidate.rationale,
      uncertainties: candidate.testability === "TESTABLE_CANDIDATE" ? [] : ["Cette formulation doit encore être précisée avant adoption."],
    }));
    const hypothesisCandidates = explicitProjectHypotheses.map((candidate) => ({
      candidateRef: candidate.hypothesisId,
      kind: "HYPOTHESIS" as const,
      label: candidate.text,
      rationale: candidate.observableCondition,
      uncertainties: unique([...candidate.unknowns, ...candidate.limitations]),
    }));
    const candidates = [...questionCandidates, ...hypothesisCandidates];
    const informationNeeds = unique(output.adaptiveQuestions
      .filter((question) => question.blocking && !question.answeredValue)
      .map((question) => question.label)).slice(0, 3);
    const introduction = explicitProjectHypotheses.length
      ? "La question scientifique et l’hypothèse exprimée sont maintenant reliées aux éléments confirmés du projet."
      : "À partir des éléments confirmés du projet, voici une question scientifique de travail qui conserve la comparaison et le critère principal.";
    const plainText = [
      introduction,
      `Question scientifique de travail\n${contextualProjectQuestion.text}`,
      ...explicitProjectHypotheses.map((candidate, index) => `${explicitProjectHypotheses.length > 1 ? `Hypothèse ${index + 1}` : "Hypothèse de travail"}\n${candidate.text}`),
      informationNeeds.length ? `Point à préciser\n${informationNeeds[0]}` : null,
      "Vous pouvez discuter ou corriger cette formulation avant toute adoption.",
    ].filter((value): value is string => Boolean(value)).join("\n\n");
    return {
      presentationId: `scientific-thinking-standard-presentation:${logicalDigest({ output: output.outputId, digest: output.outputDigest })}`,
      outputRef: output.outputId,
      title: explicitProjectHypotheses.length ? "Question et hypothèse de travail" : "Question scientifique de travail",
      introduction,
      candidates,
      informationNeeds,
      plainText,
    };
  }
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
  previousInteraction?: Readonly<StandardScientificThinkingInteraction> | null;
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
  const requestedOperation = input.navigation.requestedAction === "ASSISTED_PROPOSAL"
    ? "GENERATE_ALTERNATIVE_HYPOTHESIS" as const : undefined;
  const purpose = requestedOperation
    ? `Proposer des hypothèses scientifiques candidates et des alternatives à discuter sans adoption. Portée sélectionnée : ${input.navigation.currentAction!.reason}`
    : input.navigation.currentAction!.reason;
  const expectedNativeInput = buildScientificThinkingInputFromProjectSnapshot({
    projectSnapshot: snapshot,
    projectRevision: input.project.revision,
    purpose,
    requestedOperation,
  });
  const reusableEntry = [...input.ownerResultLedger.entries].reverse().find((entry) => {
    const nativeOutput = entry.result?.nativePayload as Partial<ScientificThinkingOutput> | null;
    if (entry.request.owner !== "SCIENTIFIC_THINKING"
      || entry.request.capabilityId !== "SCIENTIFIC_THINKING_PROPOSAL"
      || !entry.result
      || logicalDigest(entry.request.nativeInput) !== logicalDigest(expectedNativeInput)
      || entry.dependencies.length !== 0 // This dispatch has no Knowledge input/dependency.
      || nativeOutput?.contractVersion !== SCIENTIFIC_THINKING_ENGINE_VERSION
      || nativeOutput.projectWriteAuthorized !== false) return false;
    return readProductScientificThinkingOwnerResult({
      ledger: input.ownerResultLedger,
      resultId: entry.result.resultId,
      currentProjectSnapshot: snapshot,
      trace,
      observedAt: input.startedAt,
    }).freshness.status === "CURRENT";
  }) ?? null;
  const invocation = reusableEntry ? null : invokeScientificThinkingForProject({
      project: input.project,
      projectSnapshot: snapshot,
      ledger: input.ownerResultLedger,
      callerRef: input.navigation.currentAction!.selectedActionId,
      purpose,
      requestedOperation,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      trace,
    });
  const retainedResult = reusableEntry?.result ?? invocation?.result ?? null;
  const output = retainedResult?.nativePayload as ScientificThinkingOutput | null | undefined;
  if (!output) {
    const failureCode = invocation?.observation.failureCode ?? "SCIENTIFIC_THINKING_RESULT_MISSING";
    trace?.fail(input.completedAt, failureCode, "SCIENTIFIC_THINKING_ENGINE");
    throw new Error(failureCode);
  }
  const previousInteraction = input.previousInteraction
    && scientificThinkingInteractionMatchesCurrentProject(input.previousInteraction, input.project)
    ? input.previousInteraction : null;
  const previousCandidateContext = previousInteraction?.selectionAnchor ?? previousInteraction;
  const previousOutput = previousInteraction ? readScientificThinkingOutputFromLedger({
    ledger: input.ownerResultLedger, resultRef: previousCandidateContext!.ownerResultRef,
  }) : null;
  const presentedCandidateDigests = requestedOperation && previousInteraction && previousOutput
    ? previousInteraction.presentedCandidateDigests
      ?? buildStandardScientificThinkingPresentation(previousOutput).candidates.map(scientificCandidateDigest)
    : [];
  const presentation = buildStandardScientificThinkingPresentation(output, {
    requestedOperation, presentedCandidateDigests, projectUnknowns: expectedNativeInput.projectUnknowns,
  });
  const selectionAnchor = requestedOperation && !presentation.candidates.length
    && previousCandidateContext && previousOutput && presentedCandidateDigests.length
    && previousOutput.sourceProject?.projectId === input.project.projectId
    && previousOutput.sourceProject.projectVersion === input.project.versionId
    && previousOutput.sourceProject.projectDigest === input.project.projectDigest
    && (previousOutput.questions.length || previousOutput.hypotheses.length || previousOutput.scientificModels.length)
    ? {
      ownerResultRef: previousCandidateContext.ownerResultRef,
      presentationTurnRef: previousCandidateContext.presentationTurnRef,
      presentedCandidateRefs: previousCandidateContext.presentedCandidateRefs,
      traceRunId: previousCandidateContext.traceRunId,
    } : null;
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
    ownerResultRef: retainedResult.resultId,
    ownerResultVersion: retainedResult.resultVersion,
    sourceActionRef: input.navigation.currentAction!.selectedActionId,
    sourceProjectRef: input.project.projectId,
    sourceProjectVersion: input.project.versionId,
    sourceProjectDigest: input.project.projectDigest,
    // Exhaustion presents no new candidate; retain the actual proposal source
    // if the same result is subsequently selected for human review.
    presentationTurnRef: requestedOperation && !presentation.candidates.length
      && previousInteraction?.ownerResultRef === retainedResult.resultId
      ? previousInteraction.presentationTurnRef : input.presentationTurnRef,
    presentedCandidateRefs: requestedOperation && !presentation.candidates.length
      && previousInteraction?.ownerResultRef === retainedResult.resultId
      ? previousInteraction.presentedCandidateRefs ?? [] : presentation.candidates.map(candidate => candidate.candidateRef),
    ...(requestedOperation ? { presentedCandidateDigests: unique([
      ...presentedCandidateDigests, ...presentation.candidates.map(scientificCandidateDigest),
    ]) } : {}),
    // The current execution keeps its own result/purpose. Earlier visible
    // candidates remain discussable and selectable through their exact source.
    ...(selectionAnchor ? { selectionAnchor } : {}),
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
    ownerResultLedger: invocation?.ledger ?? input.ownerResultLedger,
    traceLedger: trace?.getLedger() ?? input.traceLedger,
    downstreamHandoffs: output.downstreamHandoffs,
    providerCalls: 0 as const,
    projectWrites: 0 as const,
    humanDecisionCreated: false as const,
  };
};

const candidateIndexes = (raw: string, label: string, count: number) => {
  const value = folded(raw);
  const numeric = [...value.matchAll(new RegExp(`\\b${label}\\s*(?:numero\\s*)?([123])\\b`, "g"))].map((match) => Number(match[1]) - 1);
  const ordinal = [...value.matchAll(new RegExp(`\\b(?:la |le )?(premiere|premier|deuxieme|troisieme)\\s+${label}\\b`, "g"))]
    .map((match) => ({ premiere: 0, premier: 0, deuxieme: 1, troisieme: 2 } as Record<string, number>)[match[1]]!);
  return [...new Set([...numeric, ...ordinal])].filter((index) => index < count);
};

export const resolveScientificThinkingConversation = (input: {
  raw: string;
  output: Readonly<ScientificThinkingOutput>;
  presentedCandidateRefs?: readonly string[];
}): ScientificThinkingConversationResolution => {
  const interaction = selectBoundedConversationInteraction({
    sourceText: input.raw,
    correctionMode: false,
    referentContext: {
      resolution: "NONE", candidateRef: null, sourceTurnRef: null, sourceDigest: null, content: [],
      reason: "SCIENTIFIC_THINKING_PROPOSAL_ACT_CLASSIFICATION", projectWriteAuthorized: false,
    },
  });
  if (interaction?.kind === "USER_REQUESTS_ASSISTED_PROPOSAL") return { kind: "FALLTHROUGH" };
  // Local owner handling consumes the whole turn. Quoted speech or a separate
  // assertion must remain available to the application/QRY rather than being
  // silently discarded while discussing or selecting a native proposal.
  if (/["«»“”]/u.test(input.raw)) return { kind: "FALLTHROUGH" };
  const clauses = input.raw.split(/[.!?;\n]+/u).filter((clause) => clause.trim());
  const first = folded(clauses[0] ?? "");
  const explanationOnly = clauses.slice(1).every((clause) => /^(?:(?:je|nous) (?:demande|demandons|veux|voulons|voudrais|souhaite) (?:l explication|comprendre)[^.;]*|(?:je|nous) ne (?:valide|validons|choisis|choisissons|prends|prenons)[^.;]*|explique(?:z)?(?: moi)?[^.;]*sans (?:changer|modifier|adopter)[^.;]*)$/u.test(folded(clause)));
  const ordinal = /\b(premiere|premier|deuxieme|troisieme)\b/u.exec(first)?.[1];
  if (input.presentedCandidateRefs?.length && ordinal && explanationOnly
    && /\b(?:pourquoi|justifie|explique(?:r|z)?|apporte|interet)\b/u.test(first)
    && !/\b(?:ancienne|avant|precedente|je reviens)\b/u.test(first)) {
    const index = ordinal === "deuxieme" ? 1 : ordinal === "troisieme" ? 2 : 0;
    const candidateRef = input.presentedCandidateRefs[index];
    const candidate = candidateRef ? selectedCandidate(input.output, candidateRef) : null;
    if (candidate) return { kind: "DISCUSS", response: [
      `Proposition ${index + 1} de la liste présentée : ${candidate.text}`,
      `Rôle dans le raisonnement : ${candidate.rationale}`,
      "Cette proposition sert à examiner une possibilité et ses conditions d’observation ; elle ne démontre pas qu’elle est vraie.",
      candidate.support === "SUPPORTED" ? "Les appuis disponibles restent limités à ceux du résultat source."
        : "Aucun appui documentaire qualifié ne permet ici d’en établir la supériorité ou la validité externe.",
      "Cette explication ne sélectionne ni n’adopte la proposition ; le projet reste inchangé.",
    ].join("\n") };
  }
  const reviewOnlyClause = (clause: string) => {
    const text = folded(clause);
    const check = /^(?:verifie|verifiez) (?:qu elle|qu il|que cette proposition) (?:correspond|convient|s applique) (?:toujours |encore )?(?:au projet actuel|a la version actuelle|au projet courant)(?: et (?:presente|presentez) (?:la|le) pour (?:revue|relecture|examen))?$/u;
    const noAdoption = /^(?:(?:ce choix|cette selection)(?: dans la liste)? ne vaut pas (?:adoption|confirmation)|(?:sans|aucune) (?:adoption|confirmation)(?: (?:automatique|definitive))?)$/u;
    return check.test(text) || noAdoption.test(text);
  };
  if (clauses.length > 1 && !clauses.slice(1).every(reviewOnlyClause)) return { kind: "FALLTHROUGH" };
  const value = folded(clauses[0] ?? "");
  if (/^(?:je ne sais pas(?: encore)?|pas encore|plus tard|a discuter)$/.test(value)) return {
    kind: "DEFER",
    response: "Aucune décision n’est nécessaire maintenant. Les propositions restent discutables et le Research Project demeure inchangé.",
  };
  const nonAssertedSelection = /\b(?:si|exemple|supposons|imaginons|peut etre|pas encore|avant de)\b/.test(value)
    || /\b(?:ne|n)\s+(?:\w+\s+){0,2}(?:choisis|choisissons|retiens|retenons|selectionne|selectionnons|adopte|adoptons)\b/.test(value)
    || /\b(?:choisis|choisissons|retiens|retenons|selectionne|selectionnons|adopte|adoptons)\s+(?:pas|jamais|plus)\b/.test(value);
  const selectionIntent = !nonAssertedSelection && !input.raw.includes("?") && (
    /^(?:(?:oui|finalement|apres (?:relecture|reflexion))\s+)?je\s+(?:choisis|retiens|selectionne|adopte)\b/.test(value)
    || /^(?:(?:oui|finalement|apres (?:relecture|reflexion))\s+)?nous\s+(?:choisissons|retenons|selectionnons|adoptons)\b/.test(value)
    || /^(?:retenir|choisir|selectionner|adopter)\b/.test(value));
  if (selectionIntent) {
    const command = value.match(/^(?:(?:oui|finalement|apres (?:relecture|reflexion))\s+)?(?:(?:je\s+(?:choisis|retiens|selectionne|adopte)|nous\s+(?:choisissons|retenons|selectionnons|adoptons))|retenir|choisir|selectionner|adopter)\s+/u);
    const referenceText = command ? value.slice(command[0].length).replace(/\s+(?:pour (?:revue|examen|relecture|l examiner)|comme candidate|sans adoption)$/u, "") : "";
    const groups = [
      { label: "hypothese", values: input.output.hypotheses.map((candidate) => candidate.hypothesisId) },
      { label: "question", values: input.output.questions.map((candidate) => candidate.questionId) },
      { label: "modele", values: input.output.scientificModels.map((candidate) => candidate.modelId) },
    ].map(group => ({ ...group, values: input.presentedCandidateRefs === undefined ? group.values
      : input.presentedCandidateRefs.filter(ref => group.values.includes(ref)) }));
    const indexed = groups.flatMap((group) => candidateIndexes(input.raw, group.label, Number.POSITIVE_INFINITY).map((index) => group.values[index]));
    const displayedList = /^(?:la|le) (premiere|premier|deuxieme|troisieme)(?: proposition| option| alternative)? de la liste (?:que (?:tu viens|vous venez) d afficher|actuellement affichee|courante)$/u.exec(referenceText);
    if (displayedList) {
      const availableGroups = groups.filter(group => group.values.length > 0);
      if (availableGroups.length !== 1) return { kind: "FALLTHROUGH" };
      const index = ({ premiere: 0, premier: 0, deuxieme: 1, troisieme: 2 } as const)[displayedList[1] as "premiere" | "premier" | "deuxieme" | "troisieme"];
      const candidateRef = availableGroups[0]!.values[index];
      return candidateRef ? { kind: "SELECT_CANDIDATE", candidateRef } : { kind: "FALLTHROUGH" };
    }
    if (indexed.length > 1) return { kind: "FALLTHROUGH" };
    if (indexed.length === 1) {
      const completeReference = /^(?:(?:l|la|le)\s+)?(?:(?:hypothese|question|modele)\s+(?:numero\s+)?[123]|(?:premiere|premier|deuxieme|troisieme)\s+(?:hypothese|question|modele))$/u.test(referenceText);
      return indexed[0] && completeReference ? { kind: "SELECT_CANDIDATE", candidateRef: indexed[0] } : { kind: "FALLTHROUGH" };
    }
    const all = [...input.output.questions.map((candidate) => ({ ref: candidate.questionId, text: candidate.text })),
      ...input.output.hypotheses.map((candidate) => ({ ref: candidate.hypothesisId, text: candidate.text })),
      ...input.output.scientificModels.map((candidate) => ({ ref: candidate.modelId, text: candidate.text }))];
    // A shared scientific word cannot establish the identity of a selection.
    const mentioned = all.filter((candidate) => referenceText === folded(candidate.text)
      && (input.presentedCandidateRefs === undefined || input.presentedCandidateRefs.includes(candidate.ref)));
    if (mentioned.length === 1) return { kind: "SELECT_CANDIDATE", candidateRef: mentioned[0]!.ref };
    return { kind: "FALLTHROUGH" };
  }
  const nativeGroups = [
    { label: "hypothese", count: input.output.hypotheses.length },
    { label: "question", count: input.output.questions.length },
    { label: "modele", count: input.output.scientificModels.length },
  ].filter((group) => group.count > 0);
  const nativeLabels = nativeGroups.map((group) => `${group.label}s?`).join("|");
  const indexedReferences = nativeGroups.flatMap((group) => Array.from({ length: Math.min(3, group.count) }, (_, index) =>
    `(?:(?:l|la|le)\\s+)?(?:${group.label}\\s+(?:numero\\s+)?${index + 1}|${["(?:premiere|premier)", "deuxieme", "troisieme"][index]}\\s+${group.label})`));
  const ownerReference = nativeGroups.length ? `(?:(?:ces|cette|ce|cet)\\s+(?:(?:deux|trois)\\s+)?(?:${nativeLabels}|propositions?|options?)|${indexedReferences.join("|")})` : "(?!)";
  // Full-scope grammar: no leading assertion and no trailing coordinated
  // payload can be consumed by this local projection-only explanation.
  const boundedDiscussion = new RegExp(`^(?:(?:pourquoi|explique(?:z)?(?: moi)?|expliquer|compare(?:z)?|comparer|discutons de)\\s+${ownerReference}|(?:quelle est la difference|quelles sont les differences) entre ${ownerReference}|(?:quels sont les arguments|quelles sont les limites) de ${ownerReference})$`, "u").test(value)
    || nativeGroups.length > 0 && /^(?:pourquoi|explique|explique moi|expliquez moi)$/u.test(value);
  // Ownership of an active proposal does not grant ownership of every later
  // message. In particular, a declarative correction mentioning a difference
  // must reach Project extraction, and an unrelated explanation must reach QRY.
  if (boundedDiscussion) {
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
