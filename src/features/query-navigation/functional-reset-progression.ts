import type {
  ResearchProjectElement,
  ResearchProjectOwnerProjection,
  ResearchProjectSectionId,
} from "@/features/research-project-construction";
import { buildQueryNavigationContext } from "./adapters";
import { makeQueryNavigationId } from "./canonical";
import type {
  NavigationSelection,
  NextActionCandidate,
  QueryNavigationSourceState,
} from "./contracts";
import { selectNextAction } from "./engine";
import { buildNextActionCandidates } from "./information-value";
import {
  appendNavigationLifecycleEvent,
  buildQuestionPresentationRequest,
  buildSelectedNavigationAction,
  createQueryNavigationMemory,
  inspectNavigationActionFreshness,
  rebaseQueryNavigationMemory,
  rememberAuthoritativeResolution,
  rememberQuestionPresentation,
  rememberQuestionResponse,
  rememberSelectedNavigationAction,
} from "./lifecycle";
import type {
  NavigationResponseRoute,
  QueryNavigationMemory,
  QuestionPresentationRequest,
  SelectedNavigationAction,
} from "./lifecycle-contracts";
import { buildQuestionResponseEnvelope, routeNavigationResponse } from "./response-routing";

export const FUNCTIONAL_RESET_QRY_BOUNDARY = "QRY_001_FUNCTIONAL_RESET_STANDARD_ADAPTER" as const;

export type FunctionalResetQueryDeferralReason =
  | "USER_DOES_NOT_KNOW"
  | "USER_REQUESTED_TO_MOVE_ON";

export type FunctionalResetDocumentBlockerSignal = {
  dimension: string;
  items: string[];
};

export type FunctionalResetQuestionWordingProposal = {
  selectedActionRef: string;
  informationNeedRefs: string[];
  scopeSectionIds: ResearchProjectSectionId[];
  question: string;
};

export type FunctionalResetStandardQuestion = {
  questionId: string;
  selectedActionRef: string;
  informationNeedRefs: string[];
  scopeSectionIds: ResearchProjectSectionId[];
  priorityLead: string;
  text: string;
  presentationSource: "PD004_WORDING" | "DETERMINISTIC_FALLBACK";
  repeatCount: number;
  presentationOnly: true;
  choosesScientificScope: false;
};

export type FunctionalResetQueryNavigation = {
  contract: "FUNCTIONAL_RESET_QUERY_NAVIGATION";
  contractVersion: "1.0.0";
  boundary: typeof FUNCTIONAL_RESET_QRY_BOUNDARY;
  owner: "QUERY_NAVIGATION";
  projectRef: string;
  projectVersion: string;
  projectDigest: string;
  sourceStateDigest: string;
  status: "QUESTION_READY" | "NO_USEFUL_QUESTION";
  selection: NavigationSelection;
  memory: QueryNavigationMemory;
  currentAction: SelectedNavigationAction | null;
  currentPresentation: QuestionPresentationRequest | null;
  standardQuestion: FunctionalResetStandardQuestion | null;
  needSections: Record<string, ResearchProjectSectionId>;
  documentSignalRefs: string[];
  lastResponseRoute: NavigationResponseRoute | null;
  projectionOnly: true;
  sourceOfTruth: false;
  projectWriteAuthorized: false;
};

type NeedFacet = {
  sectionId: ResearchProjectSectionId;
  facetId: string;
  intent: string;
};

const SECTION_DEPENDENCY_ORDER: ResearchProjectSectionId[] = [
  "QUESTION",
  "DESIGN",
  "POPULATION",
  "INTERVENTION",
  "COMPARATOR",
  "MEASUREMENTS",
  "IMAGING",
  "TEMPORALITY",
  "ANALYSIS",
];

const STANDARD_SECTION_LABELS: Record<ResearchProjectSectionId, string> = {
  QUESTION: "la question scientifique",
  POPULATION: "la population",
  DESIGN: "le design de l’étude",
  INTERVENTION: "l’intervention",
  COMPARATOR: "le comparateur",
  IMAGING: "l’imagerie",
  MEASUREMENTS: "les mesures et biomarqueurs",
  TEMPORALITY: "la temporalité",
  ANALYSIS: "l’analyse",
};

const emptySourceState = (): QueryNavigationSourceState => ({
  projectUnknowns: [],
  projectAmbiguities: [],
  projectContradictions: [],
  dataNeeds: [],
  planningDecisionRequirements: [],
  validationFindings: [],
  validationHumanReviews: [],
  validationSemanticReviews: [],
  validationGates: [],
  readiness: [],
  documentGenerability: [],
  knowledgeGaps: [],
  dependencies: [],
});

const sectionNeedSourceRef = (projectId: string, sectionId: ResearchProjectSectionId, facetId: string) =>
  `${projectId}:standard-progression:${sectionId.toLocaleLowerCase("fr-FR")}:${facetId.toLocaleLowerCase("fr-FR")}`;

const sectionIntent = (sectionId: ResearchProjectSectionId) => ({
  QUESTION: "Préciser la question scientifique de travail.",
  POPULATION: "Préciser la population et les critères d’éligibilité utiles.",
  DESIGN: "Préciser le cadre et le design de l’étude.",
  INTERVENTION: "Préciser l’intervention ou l’exposition étudiée.",
  COMPARATOR: "Préciser le comparateur ou le groupe de référence.",
  IMAGING: "Préciser le rôle de l’imagerie dans le projet.",
  MEASUREMENTS: "Préciser les mesures, critères ou biomarqueurs prioritaires.",
  TEMPORALITY: "Préciser les moments ou fenêtres de mesure utiles.",
  ANALYSIS: "Préciser l’objectif de comparaison ou d’analyse.",
}[sectionId]);

const searchableElement = (element: ResearchProjectElement) =>
  `${element.content} ${element.sourceProposedType ?? ""} ${element.sourceStudyRole ?? ""}`
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr-FR");

const hasEvidence = (elements: readonly ResearchProjectElement[], pattern: RegExp) => elements
  .filter((element) => element.sourcePolarity !== "NEGATED")
  .some((element) => pattern.test(searchableElement(element)));

const facetsForProject = (project: Readonly<ResearchProjectOwnerProjection>): NeedFacet[] => {
  const elements = (sectionId: ResearchProjectSectionId) =>
    project.sections.find((section) => section.sectionId === sectionId)?.elements ?? [];
  const facets: NeedFacet[] = [];
  const add = (sectionId: ResearchProjectSectionId, facetId: string, intent: string, resolved: boolean) => {
    if (!resolved) facets.push({ sectionId, facetId, intent });
  };

  const population = elements("POPULATION");
  add("POPULATION", "POPULATION_DEFINITION", "Préciser la population clinique étudiée.", hasEvidence(population, /condition|disease|patholog|population definition/));
  add("POPULATION", "ELIGIBILITY", "Préciser la tranche d’âge ou les principaux critères d’éligibilité.", hasEvidence(population, /age|eligib|criterion|critere/));
  add("POPULATION", "INCLUSION", "Préciser les principaux critères d’inclusion.", hasEvidence(population, /inclusion|inclure|included/));
  add("POPULATION", "EXCLUSION", "Préciser les exclusions importantes ou contre-indications.", hasEvidence(population, /exclusion|exclure|contre.indication|contraindication/));

  const design = elements("DESIGN");
  add("DESIGN", "DESIGN_FRAME", sectionIntent("DESIGN"), design.length > 0);
  const intervention = elements("INTERVENTION");
  add("INTERVENTION", "INTERVENTION", sectionIntent("INTERVENTION"), intervention.length > 0);
  const comparator = elements("COMPARATOR");
  add("COMPARATOR", "COMPARATOR", sectionIntent("COMPARATOR"), comparator.length > 0);

  const imaging = elements("IMAGING");
  add("IMAGING", "MODALITY", "Préciser la modalité d’imagerie envisagée.", hasEvidence(imaging, /modality|modalite|imaging method|irm|mri|ct|scanner|echograph/));
  add("IMAGING", "IMAGING_ROLE", "Préciser le rôle attendu de l’imagerie sans définir de paramètres techniques.", hasEvidence(imaging, /acquisition|measurement definition|lecture|readout|role/));

  const measurements = elements("MEASUREMENTS");
  add("MEASUREMENTS", "MEASUREMENT_SET", "Préciser les mesures, critères ou biomarqueurs étudiés.", measurements.length > 0);
  add("MEASUREMENTS", "MEASUREMENT_PRIORITY", "Préciser quelles mesures ou quels critères doivent être prioritaires.", hasEvidence(measurements, /primary|principal|priorit|critere principal/));

  const temporality = elements("TEMPORALITY");
  add("TEMPORALITY", "MEASUREMENT_TIMING", sectionIntent("TEMPORALITY"), temporality.length > 0);

  const analysis = elements("ANALYSIS");
  add("ANALYSIS", "ANALYSIS_OBJECTIVE", sectionIntent("ANALYSIS"), hasEvidence(analysis, /analysis|analyse|estimand|statistic|objectif/));
  return facets;
};

export const buildFunctionalResetQuerySourceState = (
  project: Readonly<ResearchProjectOwnerProjection>,
): QueryNavigationSourceState => {
  const sourceState = emptySourceState();
  sourceState.projectUnknowns = facetsForProject(project)
    .map((facet) => ({
      ref: sectionNeedSourceRef(project.projectId, facet.sectionId, facet.facetId),
      version: "FUNCTIONAL_RESET_03B",
      intent: facet.intent,
      owner: "RESEARCH_PROJECT",
      decisionRefs: [`project-section:${facet.sectionId}`],
      branchRefs: [`project-facet:${facet.sectionId}:${facet.facetId}`],
      knownOptions: [],
    }));
  return sourceState;
};

const documentSections = (signals: readonly FunctionalResetDocumentBlockerSignal[]) => new Set<ResearchProjectSectionId>(signals.flatMap((signal): ResearchProjectSectionId[] => {
  if (/population|crit[eè]re/i.test(signal.dimension)) return ["POPULATION" as const];
  if (/temporal/i.test(signal.dimension)) return ["TEMPORALITY" as const];
  if (/imager/i.test(signal.dimension)) return ["IMAGING" as const];
  if (/analy/i.test(signal.dimension)) return ["ANALYSIS" as const];
  return [];
}));

const groupCandidatesByScientificDimension = (
  project: Readonly<ResearchProjectOwnerProjection>,
  candidates: NextActionCandidate[],
  blockerSignals: readonly FunctionalResetDocumentBlockerSignal[],
): NextActionCandidate[] => {
  const blockerSections = documentSections(blockerSignals);
  const grouped = SECTION_DEPENDENCY_ORDER.flatMap((sectionId): NextActionCandidate[] => {
    const members = candidates.filter((candidate) =>
      candidate.affectedDecisionRefs.includes(`project-section:${sectionId}`));
    if (!members.length) return [];
    const needRefs = members.flatMap((candidate) => candidate.navigationNeedRefs).sort();
    const section = project.sections.find((candidate) => candidate.sectionId === sectionId);
    const hasNoConfirmedInformation = !section?.elements.length;
    const blocking = hasNoConfirmedInformation || blockerSections.has(sectionId)
      ? "BLOCKS_IRREVERSIBLE_DECISION" as const
      : "BLOCKS_CURRENT_BRANCH" as const;
    const candidateId = makeQueryNavigationId("qry-action", {
      boundary: FUNCTIONAL_RESET_QRY_BOUNDARY,
      projectRef: project.projectId,
      sectionId,
      needRefs,
    });
    return [{
      ...structuredClone(members[0]!),
      candidateId,
      targetRef: `${project.projectId}:standard-progression-dimension:${sectionId}`,
      sourceRefs: members.flatMap((candidate) => candidate.sourceRefs).sort(),
      navigationNeedRefs: needRefs,
      affectedDecisionRefs: [`project-section:${sectionId}`],
      affectedBranchRefs: members.flatMap((candidate) => candidate.affectedBranchRefs).sort(),
      informationValue: {
        ...members[0]!.informationValue,
        blocking,
        impactScope: members.length > 1 ? "MULTIPLE_CRITICAL_OBJECTS" : "SINGLE_BRANCH",
        irreversibility: blocking === "BLOCKS_IRREVERSIBLE_DECISION" ? "HIGH" : "MEDIUM",
      },
      dependencies: [],
      impacts: members.flatMap((candidate) => candidate.impacts),
      explanation: members.map((candidate) => candidate.explanation).join(" "),
      provenance: {
        sourceRefs: members.flatMap((candidate) => candidate.provenance.sourceRefs).sort(),
        owner: "QUERY_NAVIGATION",
        evidence: members.flatMap((candidate) => candidate.provenance.evidence),
        limitations: members.length > 1 ? ["SAME_SCIENTIFIC_DIMENSION_NEEDS_GROUPED_FOR_ONE_FREE_TEXT_EXCHANGE"] : [],
      },
    }];
  });
  return grouped.map((candidate, index) => {
    const previousEqualPriority = grouped.slice(0, index).reverse().find((previous) =>
      previous.informationValue.blocking === candidate.informationValue.blocking);
    if (!previousEqualPriority) return candidate;
    return {
      ...candidate,
      dependencies: [{
        dependencyId: makeQueryNavigationId("qry-dependency", {
          prerequisiteRef: previousEqualPriority.targetRef,
          dependentRef: candidate.targetRef,
        }),
        prerequisiteRef: previousEqualPriority.targetRef,
        dependentRef: candidate.targetRef,
        kind: "PROJECT_GRAPH",
        status: "OPEN",
        sourceRef: project.versionId,
      }],
    };
  });
};

const sectionsForAction = (action: SelectedNavigationAction) => action.affectedDecisionRefs
  .flatMap((ref) => {
    const value = ref.replace("project-section:", "") as ResearchProjectSectionId;
    return ref.startsWith("project-section:") ? [value] : [];
  });

const facetsForAction = (action: SelectedNavigationAction) => action.affectedBranchRefs.flatMap((ref) => {
  const match = ref.match(/^project-facet:[^:]+:(.+)$/);
  return match?.[1] ? [match[1]] : [];
});

const sameValues = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && [...left].sort().every((value, index) => value === [...right].sort()[index]);

const wordingMentionsOnlySelectedDimensions = (wording: string, scope: ResearchProjectSectionId[]) => {
  const normalized = wording.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("fr-FR");
  const mentions: Array<[ResearchProjectSectionId, RegExp]> = [
    ["POPULATION", /\bpopulation|patient|eligib|inclusion|exclusion|age\b/],
    ["DESIGN", /\bdesign|plan d.etude\b/],
    ["INTERVENTION", /\bintervention|traitement|exposition\b/],
    ["COMPARATOR", /\bcomparateur|groupe de reference\b/],
    ["IMAGING", /\bimagerie|irm|scanner|echograph|acquisition\b/],
    ["MEASUREMENTS", /\bbiomarqueur|endpoint|critere principal\b/],
    ["TEMPORALITY", /\btemporal|moment|fenetre|delai|visite\b/],
    ["ANALYSIS", /\banalys|estimand|statist\b/],
  ];
  return mentions.every(([sectionId, pattern]) => !pattern.test(normalized) || scope.includes(sectionId));
};

const naturalList = (values: string[]) => values.length < 2
  ? values[0] ?? "les informations encore ouvertes"
  : `${values.slice(0, -1).join(", ")} et ${values.at(-1)}`;

const fallbackQuestion = (scope: ResearchProjectSectionId[], facets: string[], repeatCount: number) => {
  const scopeSet = new Set(scope);
  const facetSet = new Set(facets);
  const prefix = repeatCount > 0 ? "Ce point reste important. " : "Pour faire progresser le projet, ";
  if (scopeSet.has("POPULATION") && facetSet.size === 1 && facetSet.has("EXCLUSION")) {
    return `${prefix}quelles exclusions importantes ou contre-indications souhaitez-vous retenir ?`;
  }
  if (scopeSet.has("POPULATION") && facetSet.size === 1 && facetSet.has("INCLUSION")) {
    return `${prefix}quels critères d’inclusion principaux souhaitez-vous retenir ?`;
  }
  if (scopeSet.has("POPULATION")) {
    const openPopulationParts = [
      ...(facetSet.has("POPULATION_DEFINITION") ? ["la population clinique"] : []),
      ...(facetSet.has("ELIGIBILITY") ? ["la tranche d’âge ou les critères d’éligibilité"] : []),
      ...(facetSet.has("INCLUSION") ? ["les critères d’inclusion"] : []),
      ...(facetSet.has("EXCLUSION") ? ["les exclusions importantes"] : []),
    ];
    return `${prefix}pouvez-vous préciser ${naturalList(openPopulationParts)} ?`;
  }
  if (scopeSet.has("MEASUREMENTS")) return `${prefix}quelles mesures, quels critères ou quels biomarqueurs doivent être considérés en priorité ?`;
  if (scopeSet.has("IMAGING") && scopeSet.has("TEMPORALITY")) {
    return `${prefix}comment souhaitez-vous organiser l’imagerie et les moments auxquels les mesures seront réalisées ?`;
  }
  if (scopeSet.has("IMAGING")) return `${prefix}quel rôle souhaitez-vous donner à l’imagerie dans ce projet ?`;
  if (scopeSet.has("TEMPORALITY")) return `${prefix}à quels moments ou dans quelles fenêtres les mesures doivent-elles être réalisées ?`;
  if (scopeSet.has("DESIGN") || scopeSet.has("INTERVENTION") || scopeSet.has("COMPARATOR")) {
    return `${prefix}comment souhaitez-vous structurer l’étude, l’intervention et le comparateur ?`;
  }
  if (scopeSet.has("ANALYSIS")) return `${prefix}quel objectif de comparaison ou d’analyse souhaitez-vous préciser ?`;
  const readable = scope.map((section) => section.toLocaleLowerCase("fr-FR")).join(" et ");
  return `${prefix}que souhaitez-vous préciser concernant ${readable} ?`;
};

export const presentFunctionalResetQuestion = (
  action: SelectedNavigationAction,
  presentation: QuestionPresentationRequest,
  repeatCount: number,
  proposal: FunctionalResetQuestionWordingProposal | null = null,
): FunctionalResetStandardQuestion => {
  const scopeSectionIds = sectionsForAction(action);
  const scopeFacets = facetsForAction(action);
  const proposalPreservesScope = proposal
    && proposal.selectedActionRef === action.selectedActionId
    && sameValues(proposal.informationNeedRefs, presentation.informationNeedRefs)
    && sameValues(proposal.scopeSectionIds, scopeSectionIds)
    && wordingMentionsOnlySelectedDimensions(proposal.question, scopeSectionIds)
    && proposal.question.trim().endsWith("?");
  const text = proposalPreservesScope ? proposal.question.trim() : fallbackQuestion(scopeSectionIds, scopeFacets, repeatCount);
  return {
    questionId: makeQueryNavigationId("qry-standard-question", {
      selectedActionRef: action.selectedActionId,
      presentationRef: presentation.presentationId,
      text,
    }),
    selectedActionRef: action.selectedActionId,
    informationNeedRefs: [...presentation.informationNeedRefs],
    scopeSectionIds,
    priorityLead: `Le prochain point le plus utile à préciser concerne ${scopeSectionIds.map((sectionId) => STANDARD_SECTION_LABELS[sectionId]).join(" et ")}.`,
    text,
    presentationSource: proposalPreservesScope ? "PD004_WORDING" : "DETERMINISTIC_FALLBACK",
    repeatCount,
    presentationOnly: true,
    choosesScientificScope: false,
  };
};

const recordLifecycleEvent = (
  memory: QueryNavigationMemory,
  input: Omit<Parameters<typeof appendNavigationLifecycleEvent>[1], "projectWriteAuthorized">,
) => appendNavigationLifecycleEvent(memory, input);

const resolveNeedsNoLongerOpen = (
  memory: QueryNavigationMemory,
  previousNeedSections: Record<string, ResearchProjectSectionId>,
  currentNeedRefs: readonly string[],
  resolutionRef: string,
) => Object.keys(previousNeedSections).reduce((current, needRef) =>
  currentNeedRefs.includes(needRef) ? current : rememberAuthoritativeResolution(current, needRef, resolutionRef), memory);

const actionForEvent = (memory: QueryNavigationMemory, actionRef: string) =>
  memory.selectedActions.find((action) => action.selectedActionId === actionRef) ?? null;

const activeDeferredBranchRefs = (memory: QueryNavigationMemory) => {
  const deferred = new Set<string>();
  for (const event of memory.events.filter((candidate) => candidate.eventType === "ACTION_DEFERRED")) {
    const action = actionForEvent(memory, event.actionRef);
    if (!action) continue;
    const laterEvents = memory.events.filter((candidate) => candidate.sequence > event.sequence);
    const reopened = laterEvents.some((candidate) => candidate.eventType === "ACTION_REOPENED"
      && actionForEvent(memory, candidate.actionRef)?.affectedBranchRefs.some((ref) => action.affectedBranchRefs.includes(ref)));
    const distinctActionAnswered = laterEvents.some((candidate) => {
      if (candidate.eventType !== "RESPONSE_RECEIVED") return false;
      const answered = actionForEvent(memory, candidate.actionRef);
      return answered !== null && !answered.affectedBranchRefs.some((ref) => action.affectedBranchRefs.includes(ref));
    });
    if (!reopened && !distinctActionAnswered) action.affectedBranchRefs.forEach((ref) => deferred.add(ref));
  }
  return deferred;
};

const candidatesOutsideImmediateDeferral = (
  candidates: NextActionCandidate[],
  memory: QueryNavigationMemory,
) => {
  const deferredBranches = activeDeferredBranchRefs(memory);
  if (!deferredBranches.size) return candidates;
  return candidates.filter((candidate) =>
    !candidate.affectedBranchRefs.some((ref) => deferredBranches.has(ref)));
};

export const buildFunctionalResetQueryNavigation = (input: {
  project: Readonly<ResearchProjectOwnerProjection>;
  previous?: Readonly<FunctionalResetQueryNavigation> | null;
  documentBlockers?: FunctionalResetDocumentBlockerSignal[];
  recordedAt: string;
  wordingProposal?: FunctionalResetQuestionWordingProposal | null;
  forceRebuild?: boolean;
}): FunctionalResetQueryNavigation => {
  if (!input.forceRebuild && input.previous
    && input.previous.projectVersion === input.project.versionId
    && input.previous.projectDigest === input.project.projectDigest) return structuredClone(input.previous);

  let memory = input.previous
    ? rebaseQueryNavigationMemory(input.previous.memory, input.project.versionId)
    : createQueryNavigationMemory(input.project.projectId, input.project.versionId);
  if (input.previous?.currentAction && input.previous.projectVersion !== input.project.versionId) {
    memory = recordLifecycleEvent(memory, {
      eventType: "ACTION_SUPERSEDED",
      actionRef: input.previous.currentAction.selectedActionId,
      presentationRef: input.previous.currentPresentation?.presentationId ?? null,
      responseRef: null,
      projectRef: input.project.projectId,
      projectVersion: input.project.versionId,
      sourceStateDigest: input.previous.sourceStateDigest,
      reason: "PROJECT_VERSION_CHANGED_AFTER_HUMAN_CONFIRMATION",
      evidenceRefs: [input.project.versionId],
      recordedAt: input.recordedAt,
    });
  }

  const sourceState = buildFunctionalResetQuerySourceState(input.project);
  const unresolvedContext = buildQueryNavigationContext({
    projectRef: input.project.projectId,
    projectVersion: input.project.versionId,
    sourceState,
    currentUsageRef: "FUNCTIONAL_RESET_STANDARD_CONVERSATION",
  });
  const unresolvedNeeds = selectNextAction(unresolvedContext).needs;
  if (input.previous) {
    memory = resolveNeedsNoLongerOpen(
      memory,
      input.previous.needSections,
      unresolvedNeeds.map((need) => need.needId),
      input.project.versionId,
    );
  }
  const context = buildQueryNavigationContext({
    projectRef: input.project.projectId,
    projectVersion: input.project.versionId,
    sourceState,
    resolvedNeedRefs: memory.resolvedNeedRefs,
    currentUsageRef: "FUNCTIONAL_RESET_STANDARD_CONVERSATION",
    limitations: [
      "QRY_SELECTS_INFORMATION_SCOPE_PRESENTATION_ONLY_REWORDS",
      "NO_ST_IMG_KNOWLEDGE_OR_SCIENTIFIC_RECOMMENDATION_TRIGGERED",
    ],
  });
  const individualCandidates = buildNextActionCandidates(context, selectNextAction(context).needs);
  const groupedCandidates = groupCandidatesByScientificDimension(
    input.project,
    individualCandidates,
    input.documentBlockers ?? [],
  );
  const selection = selectNextAction(context, candidatesOutsideImmediateDeferral(groupedCandidates, memory));
  const needSections = Object.fromEntries(selection.needs.flatMap((need) => {
    const decisionRef = need.affectedDecisionRefs.find((ref) => ref.startsWith("project-section:"));
    return decisionRef ? [[need.needId, decisionRef.replace("project-section:", "") as ResearchProjectSectionId]] : [];
  }));
  const documentSignalRefs = (input.documentBlockers ?? []).flatMap((group, groupIndex) =>
    group.items.map((_item, itemIndex) => `document-blocker-signal:${groupIndex + 1}:${itemIndex + 1}`));

  if (!selection.selected) return {
    contract: "FUNCTIONAL_RESET_QUERY_NAVIGATION",
    contractVersion: "1.0.0",
    boundary: FUNCTIONAL_RESET_QRY_BOUNDARY,
    owner: "QUERY_NAVIGATION",
    projectRef: input.project.projectId,
    projectVersion: input.project.versionId,
    projectDigest: input.project.projectDigest,
    sourceStateDigest: context.sourceStateDigest,
    status: "NO_USEFUL_QUESTION",
    selection,
    memory,
    currentAction: null,
    currentPresentation: null,
    standardQuestion: null,
    needSections,
    documentSignalRefs,
    lastResponseRoute: null,
    projectionOnly: true,
    sourceOfTruth: false,
    projectWriteAuthorized: false,
  };

  const action = buildSelectedNavigationAction(selection);
  const presentation = buildQuestionPresentationRequest(action, selection.selected);
  const previousScope = input.previous?.standardQuestion?.scopeSectionIds ?? [];
  const currentScope = sectionsForAction(action);
  const repeatCount = input.previous?.standardQuestion && sameValues(previousScope, currentScope)
    ? input.previous.standardQuestion.repeatCount + 1
    : 0;
  const standardQuestion = presentFunctionalResetQuestion(action, presentation, repeatCount, input.wordingProposal ?? null);
  memory = rememberSelectedNavigationAction(memory, action);
  memory = rememberQuestionPresentation(memory, presentation);
  memory = recordLifecycleEvent(memory, {
    eventType: "ACTION_SELECTED",
    actionRef: action.selectedActionId,
    presentationRef: null,
    responseRef: null,
    projectRef: input.project.projectId,
    projectVersion: input.project.versionId,
    sourceStateDigest: context.sourceStateDigest,
    reason: "QRY_SELECTED_NEXT_USEFUL_INFORMATION_SCOPE",
    evidenceRefs: action.navigationNeedRefs,
    recordedAt: input.recordedAt,
  });
  memory = recordLifecycleEvent(memory, {
    eventType: "ACTION_PRESENTED",
    actionRef: action.selectedActionId,
    presentationRef: presentation.presentationId,
    responseRef: null,
    projectRef: input.project.projectId,
    projectVersion: input.project.versionId,
    sourceStateDigest: context.sourceStateDigest,
    reason: "STANDARD_PRESENTATION_OF_QRY_ACTION",
    evidenceRefs: [standardQuestion.questionId],
    recordedAt: input.recordedAt,
  });
  return {
    contract: "FUNCTIONAL_RESET_QUERY_NAVIGATION",
    contractVersion: "1.0.0",
    boundary: FUNCTIONAL_RESET_QRY_BOUNDARY,
    owner: "QUERY_NAVIGATION",
    projectRef: input.project.projectId,
    projectVersion: input.project.versionId,
    projectDigest: input.project.projectDigest,
    sourceStateDigest: context.sourceStateDigest,
    status: "QUESTION_READY",
    selection,
    memory,
    currentAction: action,
    currentPresentation: presentation,
    standardQuestion,
    needSections,
    documentSignalRefs,
    lastResponseRoute: null,
    projectionOnly: true,
    sourceOfTruth: false,
    projectWriteAuthorized: false,
  };
};

export const deferFunctionalResetQueryNavigation = (input: {
  navigation: Readonly<FunctionalResetQueryNavigation>;
  reason: FunctionalResetQueryDeferralReason;
  recordedAt: string;
}): FunctionalResetQueryNavigation => {
  const action = input.navigation.currentAction;
  if (!action) return structuredClone(input.navigation);
  const response = input.navigation.memory.responses.at(-1) ?? null;
  const memory = recordLifecycleEvent(input.navigation.memory, {
    eventType: "ACTION_DEFERRED",
    actionRef: action.selectedActionId,
    presentationRef: input.navigation.currentPresentation?.presentationId ?? null,
    responseRef: response?.responseId ?? null,
    projectRef: input.navigation.projectRef,
    projectVersion: input.navigation.projectVersion,
    sourceStateDigest: input.navigation.sourceStateDigest,
    reason: input.reason,
    evidenceRefs: [
      ...action.navigationNeedRefs,
      ...(response ? [response.responseId] : []),
    ],
    recordedAt: input.recordedAt,
  });
  return { ...structuredClone(input.navigation), memory };
};

export const deferFunctionalResetQueryNeeds = (input: {
  navigation: Readonly<FunctionalResetQueryNavigation>;
  reason: FunctionalResetQueryDeferralReason;
  targets: Array<{ sectionId: ResearchProjectSectionId; facetIds: string[] }>;
  recordedAt: string;
}): FunctionalResetQueryNavigation => {
  let memory = structuredClone(input.navigation.memory);
  const response = memory.responses.at(-1) ?? null;
  for (const target of input.targets) {
    const branchRefs = target.facetIds.map((facetId) => `project-facet:${target.sectionId}:${facetId}`);
    const needRefs = input.navigation.selection.needs
      .filter((need) => need.affectedDecisionRefs.includes(`project-section:${target.sectionId}`)
        && need.affectedBranchRefs.some((ref) => branchRefs.includes(ref)))
      .map((need) => need.needId);
    if (!needRefs.length) continue;
    const baseCandidate = input.navigation.selection.candidates.find((candidate) =>
      candidate.affectedDecisionRefs.includes(`project-section:${target.sectionId}`));
    if (!baseCandidate) continue;
    const scopedCandidate: NextActionCandidate = {
      ...structuredClone(baseCandidate),
      candidateId: makeQueryNavigationId("qry-explicit-defer-scope", {
        projectVersion: input.navigation.projectVersion,
        sectionId: target.sectionId,
        needRefs,
        branchRefs,
      }),
      navigationNeedRefs: [...needRefs].sort(),
      affectedDecisionRefs: [`project-section:${target.sectionId}`],
      affectedBranchRefs: [...branchRefs].sort(),
      explanation: "Le chercheur a explicitement indiqué que ces informations restent à définir pour le moment.",
    };
    const scopedSelection: NavigationSelection = {
      ...structuredClone(input.navigation.selection),
      selected: scopedCandidate,
      nonDominated: [scopedCandidate],
      trace: {
        ...structuredClone(input.navigation.selection.trace),
        nonDominatedCandidateRefs: [scopedCandidate.candidateId],
        selectedCandidateRef: scopedCandidate.candidateId,
      },
    };
    const action = buildSelectedNavigationAction(scopedSelection, scopedCandidate);
    memory = rememberSelectedNavigationAction(memory, action);
    memory = recordLifecycleEvent(memory, {
      eventType: "ACTION_DEFERRED",
      actionRef: action.selectedActionId,
      presentationRef: null,
      responseRef: response?.responseId ?? null,
      projectRef: input.navigation.projectRef,
      projectVersion: input.navigation.projectVersion,
      sourceStateDigest: input.navigation.sourceStateDigest,
      reason: input.reason,
      evidenceRefs: [...needRefs, ...(response ? [response.responseId] : [])],
      recordedAt: input.recordedAt,
    });
  }
  return { ...structuredClone(input.navigation), memory };
};

export const isFunctionalResetQueryMisunderstanding = (value: string) => {
  const text = value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("fr-FR");
  return /\b(?:je|nous|on)\s+(?:ne\s+)?compr(?:ends?|enons?)\s+(?:toujours\s+)?pas\b/.test(text)
    || /\b(?:question|demande)\s+(?:n.est\s+)?pas\s+claire?\b/.test(text)
    || /\b(?:peux|pouvez|pourrais|pourriez)[- ]?(?:tu|vous)\s+(?:me\s+)?(?:reformuler|expliquer|clarifier)\b/.test(text);
};

const clarificationQuestion = (
  action: SelectedNavigationAction,
  previous: FunctionalResetStandardQuestion,
) => {
  const scope = sectionsForAction(action);
  const level = previous.repeatCount + 1;
  if (scope.some((section) => ["DESIGN", "INTERVENTION", "COMPARATOR"].includes(section))) {
    return level === 1
      ? "Je cherche à préciser comment l’étude sera organisée. Comment les participants seront-ils répartis entre les groupes étudiés ?"
      : "Plus concrètement, je cherche seulement à savoir qui reçoit quoi dans l’étude et comment cette répartition est décidée. Quelle organisation prévoyez-vous ?";
  }
  if (scope.includes("TEMPORALITY")) return level === 1
    ? "Je cherche les moments prévus pour les évaluations. À quel jour, mois ou intervalle souhaitez-vous les réaliser ?"
    : "Plus concrètement, indiquez simplement quand la première évaluation puis les éventuelles suivantes doivent avoir lieu.";
  if (scope.includes("POPULATION")) return level === 1
    ? "Je cherche à savoir quelles personnes pourraient participer à l’étude. Quelles caractéristiques faut-il retenir ou exclure ?"
    : "Plus concrètement, indiquez les principales conditions qu’une personne doit remplir, ou celles qui empêcheraient sa participation.";
  if (scope.includes("MEASUREMENTS")) return level === 1
    ? "Je cherche ce que vous souhaitez observer ou quantifier. Quelle mesure permettra de répondre à votre question ?"
    : "Plus concrètement, indiquez la valeur, le signal ou le critère dont vous souhaitez suivre le changement.";
  return level === 1
    ? `Je cherche uniquement à clarifier ${scope.map((section) => STANDARD_SECTION_LABELS[section]).join(" et ")}. Pouvez-vous décrire ce que vous souhaitez décider ?`
    : "Plus concrètement, quelle information souhaitez-vous fixer pour cette partie du projet ?";
};

export const clarifyFunctionalResetQueryAfterMisunderstanding = (input: {
  navigation: Readonly<FunctionalResetQueryNavigation>;
  rawResponse: string;
  actorRef: string;
  actorRole: string;
  receivedAt: string;
  responseId: string;
}): FunctionalResetQueryNavigation => {
  const action = input.navigation.currentAction;
  const presentation = input.navigation.currentPresentation;
  const previousQuestion = input.navigation.standardQuestion;
  if (!action || !presentation || !previousQuestion) return structuredClone(input.navigation);
  const response = buildQuestionResponseEnvelope({
    responseId: input.responseId,
    selectedActionRef: action.selectedActionId,
    presentationRef: presentation.presentationId,
    projectRef: input.navigation.projectRef,
    projectVersionAtPresentation: input.navigation.projectVersion,
    responseKind: "FREE_TEXT",
    rawResponse: input.rawResponse,
    actorRef: input.actorRef,
    actorRole: input.actorRole,
    selectedOptionRefs: [],
    disposition: "REQUEST_CLARIFICATION",
    receivedAt: input.receivedAt,
    provenanceRefs: [input.actorRef],
  });
  const freshness = inspectNavigationActionFreshness(action, {
    projectVersion: input.navigation.projectVersion,
    sourceStateDigest: input.navigation.sourceStateDigest,
  });
  const lastResponseRoute = routeNavigationResponse(action, presentation, response, freshness);
  const text = clarificationQuestion(action, previousQuestion);
  const standardQuestion: FunctionalResetStandardQuestion = {
    ...previousQuestion,
    questionId: makeQueryNavigationId("qry-standard-clarification", {
      selectedActionRef: action.selectedActionId,
      previousQuestionRef: previousQuestion.questionId,
      text,
    }),
    text,
    repeatCount: previousQuestion.repeatCount + 1,
    presentationSource: "DETERMINISTIC_FALLBACK",
  };
  let memory = rememberQuestionResponse(input.navigation.memory, response);
  memory = recordLifecycleEvent(memory, {
    eventType: "RESPONSE_RECEIVED",
    actionRef: action.selectedActionId,
    presentationRef: presentation.presentationId,
    responseRef: response.responseId,
    projectRef: input.navigation.projectRef,
    projectVersion: input.navigation.projectVersion,
    sourceStateDigest: input.navigation.sourceStateDigest,
    reason: "USER_REQUESTED_EXPLANATION_OF_CURRENT_QRY_QUESTION",
    evidenceRefs: [response.responseId],
    recordedAt: input.receivedAt,
  });
  memory = recordLifecycleEvent(memory, {
    eventType: "ACTION_PRESENTED",
    actionRef: action.selectedActionId,
    presentationRef: presentation.presentationId,
    responseRef: null,
    projectRef: input.navigation.projectRef,
    projectVersion: input.navigation.projectVersion,
    sourceStateDigest: input.navigation.sourceStateDigest,
    reason: "SAME_QRY_ACTION_EXPLAINED_WITH_CLEARER_PRESENTATION",
    evidenceRefs: [standardQuestion.questionId],
    recordedAt: input.receivedAt,
  });
  return { ...structuredClone(input.navigation), memory, standardQuestion, lastResponseRoute };
};

export const mediateFunctionalResetQueryDialogue = (input: {
  navigation: Readonly<FunctionalResetQueryNavigation>;
  intent: "REQUEST_REPHRASE" | "REQUEST_EXPLANATION" | "USER_QUESTION";
  responseMessage: string;
  rawResponse: string;
  actorRef: string;
  actorRole: string;
  receivedAt: string;
  responseId: string;
}): FunctionalResetQueryNavigation => {
  const action = input.navigation.currentAction;
  const presentation = input.navigation.currentPresentation;
  const previousQuestion = input.navigation.standardQuestion;
  if (!action || !presentation || !previousQuestion) return structuredClone(input.navigation);
  const response = buildQuestionResponseEnvelope({
    responseId: input.responseId,
    selectedActionRef: action.selectedActionId,
    presentationRef: presentation.presentationId,
    projectRef: input.navigation.projectRef,
    projectVersionAtPresentation: input.navigation.projectVersion,
    responseKind: "FREE_TEXT",
    rawResponse: input.rawResponse,
    actorRef: input.actorRef,
    actorRole: input.actorRole,
    selectedOptionRefs: [],
    disposition: "REQUEST_CLARIFICATION",
    receivedAt: input.receivedAt,
    provenanceRefs: [input.actorRef],
  });
  const freshness = inspectNavigationActionFreshness(action, {
    projectVersion: input.navigation.projectVersion,
    sourceStateDigest: input.navigation.sourceStateDigest,
  });
  const lastResponseRoute = routeNavigationResponse(action, presentation, response, freshness);
  const standardQuestion = presentFunctionalResetQuestion(
    action,
    presentation,
    previousQuestion.repeatCount + 1,
    {
      selectedActionRef: action.selectedActionId,
      informationNeedRefs: [...presentation.informationNeedRefs],
      scopeSectionIds: sectionsForAction(action),
      question: input.responseMessage,
    },
  );
  let memory = rememberQuestionResponse(input.navigation.memory, response);
  memory = recordLifecycleEvent(memory, {
    eventType: "RESPONSE_RECEIVED",
    actionRef: action.selectedActionId,
    presentationRef: presentation.presentationId,
    responseRef: response.responseId,
    projectRef: input.navigation.projectRef,
    projectVersion: input.navigation.projectVersion,
    sourceStateDigest: input.navigation.sourceStateDigest,
    reason: `DIALOGUE_MEDIATION_${input.intent}`,
    evidenceRefs: [response.responseId],
    recordedAt: input.receivedAt,
  });
  memory = recordLifecycleEvent(memory, {
    eventType: "ACTION_PRESENTED",
    actionRef: action.selectedActionId,
    presentationRef: presentation.presentationId,
    responseRef: null,
    projectRef: input.navigation.projectRef,
    projectVersion: input.navigation.projectVersion,
    sourceStateDigest: input.navigation.sourceStateDigest,
    reason: "SAME_QRY_ACTION_MEDIATED_WITH_CONVERSATION_CONTEXT",
    evidenceRefs: [standardQuestion.questionId],
    recordedAt: input.receivedAt,
  });
  return { ...structuredClone(input.navigation), memory, standardQuestion, lastResponseRoute };
};

export const reopenFunctionalResetQueryDeferral = (input: {
  navigation: Readonly<FunctionalResetQueryNavigation>;
  sectionId: ResearchProjectSectionId;
  recordedAt: string;
}): FunctionalResetQueryNavigation => {
  let memory = structuredClone(input.navigation.memory);
  const deferredActionRefs = memory.events
    .filter((event) => event.eventType === "ACTION_DEFERRED")
    .map((event) => event.actionRef)
    .filter((actionRef, index, refs) => refs.indexOf(actionRef) === index)
    .filter((actionRef) => {
      const action = actionForEvent(memory, actionRef);
      return action ? sectionsForAction(action).includes(input.sectionId) : false;
    });
  for (const actionRef of deferredActionRefs) {
    const action = actionForEvent(memory, actionRef);
    if (!action) continue;
    memory = recordLifecycleEvent(memory, {
      eventType: "ACTION_REOPENED",
      actionRef,
      presentationRef: memory.presentations.find((item) => item.selectedActionRef === actionRef)?.presentationId ?? null,
      responseRef: null,
      projectRef: input.navigation.projectRef,
      projectVersion: input.navigation.projectVersion,
      sourceStateDigest: input.navigation.sourceStateDigest,
      reason: "EXPLICIT_USER_REQUEST_TO_REVISIT_DEFERRED_DIMENSION",
      evidenceRefs: action.navigationNeedRefs,
      recordedAt: input.recordedAt,
    });
  }
  return { ...structuredClone(input.navigation), memory };
};

export const restateFunctionalResetQueryAfterNoChange = (input: {
  navigation: Readonly<FunctionalResetQueryNavigation>;
  recordedAt: string;
  responseMessage?: string | null;
}): FunctionalResetQueryNavigation => {
  const action = input.navigation.currentAction;
  const presentation = input.navigation.currentPresentation;
  const previousQuestion = input.navigation.standardQuestion;
  if (!action || !presentation || !previousQuestion) return structuredClone(input.navigation);
  const standardQuestion = presentFunctionalResetQuestion(
    action,
    presentation,
    previousQuestion.repeatCount + 1,
    input.responseMessage ? {
      selectedActionRef: action.selectedActionId,
      informationNeedRefs: [...presentation.informationNeedRefs],
      scopeSectionIds: sectionsForAction(action),
      question: input.responseMessage,
    } : null,
  );
  let memory = recordLifecycleEvent(input.navigation.memory, {
    eventType: "ACTION_REOPENED",
    actionRef: action.selectedActionId,
    presentationRef: presentation.presentationId,
    responseRef: input.navigation.memory.responses.at(-1)?.responseId ?? null,
    projectRef: input.navigation.projectRef,
    projectVersion: input.navigation.projectVersion,
    sourceStateDigest: input.navigation.sourceStateDigest,
    reason: "NO_NET_PROJECT_CHANGE_ACTION_SCOPE_REMAINS_OPEN",
    evidenceRefs: [previousQuestion.questionId],
    recordedAt: input.recordedAt,
  });
  memory = recordLifecycleEvent(memory, {
    eventType: "ACTION_PRESENTED",
    actionRef: action.selectedActionId,
    presentationRef: presentation.presentationId,
    responseRef: null,
    projectRef: input.navigation.projectRef,
    projectVersion: input.navigation.projectVersion,
    sourceStateDigest: input.navigation.sourceStateDigest,
    reason: "CONTEXTUALIZED_REPRESENTATION_AFTER_NO_NET_PROJECT_CHANGE",
    evidenceRefs: [standardQuestion.questionId],
    recordedAt: input.recordedAt,
  });
  return { ...structuredClone(input.navigation), memory, standardQuestion };
};

export const recordFunctionalResetQueryResponse = (input: {
  navigation: Readonly<FunctionalResetQueryNavigation>;
  rawResponse: string;
  actorRef: string;
  actorRole: string;
  receivedAt: string;
  responseId: string;
}): FunctionalResetQueryNavigation => {
  const action = input.navigation.currentAction;
  const presentation = input.navigation.currentPresentation;
  if (!action || !presentation) return structuredClone(input.navigation);
  const response = buildQuestionResponseEnvelope({
    responseId: input.responseId,
    selectedActionRef: action.selectedActionId,
    presentationRef: presentation.presentationId,
    projectRef: input.navigation.projectRef,
    projectVersionAtPresentation: input.navigation.projectVersion,
    responseKind: "FREE_TEXT",
    rawResponse: input.rawResponse,
    actorRef: input.actorRef,
    actorRole: input.actorRole,
    selectedOptionRefs: [],
    disposition: "ANSWER",
    receivedAt: input.receivedAt,
    provenanceRefs: [input.actorRef],
  });
  const freshness = inspectNavigationActionFreshness(action, {
    projectVersion: input.navigation.projectVersion,
    sourceStateDigest: input.navigation.sourceStateDigest,
  });
  const lastResponseRoute = routeNavigationResponse(action, presentation, response, freshness);
  let memory = rememberQuestionResponse(input.navigation.memory, response);
  memory = recordLifecycleEvent(memory, {
    eventType: "RESPONSE_RECEIVED",
    actionRef: action.selectedActionId,
    presentationRef: presentation.presentationId,
    responseRef: response.responseId,
    projectRef: input.navigation.projectRef,
    projectVersion: input.navigation.projectVersion,
    sourceStateDigest: input.navigation.sourceStateDigest,
    reason: "FREE_TEXT_RESPONSE_ROUTED_TO_SCIENTIFIC_INTERPRETATION",
    evidenceRefs: [response.responseId],
    recordedAt: input.receivedAt,
  });
  return { ...structuredClone(input.navigation), memory, lastResponseRoute };
};

export const validateFunctionalResetQueryNavigation = (navigation: Readonly<FunctionalResetQueryNavigation>) => {
  if (navigation.status === "NO_USEFUL_QUESTION") return navigation.currentAction === null
    && navigation.currentPresentation === null
    && navigation.standardQuestion === null;
  if (!navigation.currentAction || !navigation.currentPresentation || !navigation.standardQuestion) return false;
  return navigation.owner === "QUERY_NAVIGATION"
    && navigation.currentAction.selectedActionId === navigation.standardQuestion.selectedActionRef
    && navigation.currentPresentation.selectedActionRef === navigation.currentAction.selectedActionId
    && sameValues(navigation.currentAction.navigationNeedRefs, navigation.standardQuestion.informationNeedRefs)
    && navigation.standardQuestion.choosesScientificScope === false
    && navigation.projectWriteAuthorized === false;
};
