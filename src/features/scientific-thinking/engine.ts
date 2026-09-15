import { logicalDigest, normalizeScientificText, uniqueSorted } from "@/features/knowledge-engine/canonical";
import type { HumanDecisionEnvelope } from "@/features/protocol-designer/human-decision";
import {
  SCIENTIFIC_THINKING_ENGINE_VERSION,
  SCIENTIFIC_THINKING_OPERATIONS,
  type AssumptionCandidate,
  type CandidateReviewState,
  type ChangeEvent,
  type HumanGateStatus,
  type HumanGateType,
  type HypothesisCandidate,
  type IdeaElement,
  type KnowledgeSupport,
  type MechanismCandidate,
  type ObjectiveCandidate,
  type OperationStatus,
  type QuestionCandidate,
  type ReasoningGraphEdge,
  type ReasoningGraphNode,
  type ResearchDesignHandoff,
  type ScientificThinkingAdaptiveQuestion,
  type ScientificThinkingInput,
  type ScientificModelCandidate,
  type ScientificThinkingDownstreamHandoff,
  type ScientificThinkingOperation,
  type ScientificThinkingOutput,
  type ScientificThinkingTraceEvent,
} from "./types";
import { parseScientificThinkingInput, parseScientificThinkingOutput } from "./types";

export type ScientificThinkingControls = {
  answers?: Record<string, string>;
  selectedQuestionId?: string | null;
  hypothesisReviews?: Record<string, CandidateReviewState>;
  objectiveReviews?: Record<string, CandidateReviewState>;
  gateStatuses?: Partial<Record<HumanGateType, HumanGateStatus>>;
  acceptedUnknowns?: string[];
  changes?: ChangeEvent[];
  decisionRecordIds?: string[];
  decisionRecords?: HumanDecisionEnvelope[];
};

const lower = (value: string) => normalizeScientificText(value)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase("fr-FR");
const has = (text: string, pattern: RegExp) => pattern.test(lower(text));
const sentence = (value: string) => value.trim().replace(/[?.!]+$/, "");
const unique = (items: string[]) => uniqueSorted(items.map(normalizeScientificText).filter(Boolean));

const isPatientLevel = (text: string, flags: string[]) =>
  flags.some((flag) => /PATIENT_LEVEL|INDIVIDUAL/i.test(flag))
  || has(text, /\b(mon patient|ma patiente|ce patient|cette patiente|j['’]ai un t[12] (?:élevé|bas)|mes résultats|mon irm)\b/);

const isOutOfDomain = (text: string) => has(text, /\b(numpy|javascript|pipeline dicom|linguistique|marketing|comptabilit[ée])\b/);
const isNonTestable = (text: string) => has(text, /\b(choses? int[ée]ressantes?|voir ce qu['’]on trouve|regarder un peu|explorer sans objectif)\b/);
const isVagueIdea = (text: string) => has(text, /\b(j['’]ai une id[ée]e|une intuition|je voudrais faire une recherche|je cherche [àa] [ée]tudier)\b/)
  && !has(text, /\b(associ|li[ée]|pr[ée]dit|compar|diff[ée]rence|progression|[ée]volution|impact|d[ée]pend|relation)\b/);
const hasQuestionForm = (text: string) => /\?\s*$/.test(text) || has(text, /^(est-ce|quelle?|comment|pourquoi|dans quelle mesure|chez .+ (?:la|le|les).+ (?:est|sont|peut|peuvent))\b/);
const hasRelation = (text: string) => has(text, /(associ|lie|predit|compar|difference|progression|evolution|impact|depend|relation|correl)/);
const hasPopulation = (input: ScientificThinkingInput) => input.population.length > 0 || has(input.originalExpression, /\b(chez|patients?|cohorte|sujets?|participants?)\b/);
const hasOutcome = (input: ScientificThinkingInput) => input.outcomes.length > 0 || has(input.originalExpression, /\b([ée]v[ée]nements?|issue|outcome|mortalit[ée]|hospitalisation|progression|[ée]volution)\b/);
const hasTime = (input: ScientificThinkingInput) => has(input.originalExpression, /\b(apr[èe]s|avant|pendant|suivi|progression|[ée]volution|longitudinal|temps)\b/);
const hasPrediction = (text: string) => has(text, /\b(predit|predire|pronostic|evenements?)\b/);
const termAppearsIn = (text: string, term: string) => {
  const normalizedText = ` ${lower(text).replace(/[^\p{L}\p{N}]+/gu, " ")} `;
  const normalizedTerm = lower(term).replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  return Boolean(normalizedTerm && normalizedText.includes(` ${normalizedTerm} `));
};
const hasMethodComparison = (input: ScientificThinkingInput) => {
  const methods = unique(input.methodsMentioned);
  const expression = `${input.validatedReformulation} ${input.originalExpression}`;
  const explicitlyComparedMethods = methods.filter((method) => termAppearsIn(expression, method));
  const structuredMethodComparison = input.relations.some((relation) => {
    const normalized = lower(relation);
    return normalized.startsWith("method_comparison(")
      || (/compar/.test(normalized) && /(method|methode|methodolog|modalit|acquisition)/.test(normalized));
  });
  return structuredMethodComparison || (explicitlyComparedMethods.length >= 2 && has(expression, /\b(vs|versus|ou|compar\w*)\b/));
};
const isBroadDomainLabel = (value: string) => has(value, /^(cardiologie|imagerie medicale|radiologie|neurologie|oncologie)$/);
const hasSpecificScientificComparisonTarget = (input: ScientificThinkingInput) =>
  [...input.phenomena, ...input.outcomes, ...input.pathologyOrCondition].some((item) => !isBroadDomainLabel(item));
const isMethodOnlyComparison = (input: ScientificThinkingInput) => hasMethodComparison(input) && !hasSpecificScientificComparisonTarget(input);
const methodComparisonLabels = (input: ScientificThinkingInput) => unique(input.methodsMentioned).join(" et ");
const methodComparisonContext = (input: ScientificThinkingInput) => unique([
  ...input.context,
  ...input.pathologyOrCondition,
  ...input.scientificObjectTerms.filter((item) => !input.methodsMentioned.some((method) => lower(method) === lower(item)) && !has(item, /^imagerie medicale$/)),
])[0] ?? "un contexte scientifique à préciser";
const comparisonAnswerLabel = (value: string | undefined) => ({
  "same-phenomenon": "un même phénomène biologique à préciser",
  "same-measure": "une même mesure quantitative à préciser",
  "same-outcome": "un même résultat scientifique à préciser",
  agreement: "l’accord entre les mesures",
  reproducibility: "la reproductibilité",
  characterization: "la capacité à caractériser le phénomène retenu",
}[value ?? ""] ?? value ?? null);
const unresolvedComparisonTargets = new Set(["same-phenomenon", "same-measure", "same-outcome", "unknown"]);
const resolvedComparisonTarget = (value: string | undefined) => Boolean(value && !unresolvedComparisonTargets.has(value));
const resolvedComparisonCriterion = (value: string | undefined) => Boolean(value && value !== "unknown");

const conciseObject = (value: string) => {
  const cleaned = sentence(value)
    .replace(/^.*?\b(?:étudier|comprendre|explorer|sur|concernant|à propos de)\b\s*/i, "")
    .replace(/^(?:la|le|les|l['’])\s*/i, "")
    .trim();
  return cleaned && cleaned.length <= 140 ? cleaned : value;
};
const objectLabel = (input: ScientificThinkingInput) => conciseObject(
  input.phenomena[0]
  ?? input.pathologyOrCondition[0]
  ?? input.scientificObjectTerms[0]
  ?? "le phénomène scientifique décrit",
);

const populationLabel = (input: ScientificThinkingInput) => input.population[0]
  ? `chez ${input.population[0]}`
  : input.pathologyOrCondition[0]
    ? `dans le contexte de ${input.pathologyOrCondition[0]}`
    : "dans une population à préciser";
const contextualLabel = (input: ScientificThinkingInput) => {
  const temporal = input.originalExpression.match(/\b(apr[èe]s|avant|pendant)\s+(?:(?:le|la|les|un|une)\s+)?[\p{L}\p{N}-]+/iu)?.[0];
  return `${populationLabel(input)}${temporal ? `, ${temporal}` : ""}`;
};

const relationTerms = (input: ScientificThinkingInput) => {
  const ordered = input.researchContext.researchProjectId
    ? unique(input.scientificObjectTerms)
    : unique([...input.phenomena, ...input.scientificObjectTerms, ...input.pathologyOrCondition]);
  return { first: ordered[0] ?? objectLabel(input), second: ordered[1] ?? null };
};

const reviewFor = (id: string, reviews?: Record<string, CandidateReviewState>) => reviews?.[id] ?? "PENDING";
const candidateSupport = (support: KnowledgeSupport): KnowledgeSupport => support === "SUPPORTED" ? "PARTIAL" : support;
const structuringProjectUnknowns = (input: ScientificThinkingInput) => {
  const impactExplicit = input.knowledge.gaps.some((gap) => {
    const code = gap.code.toLocaleUpperCase("en-US");
    return /PROJECT.*(UNKNOWN|UNRESOLVED)/.test(code) || code === "MISSING_CRITICAL_CONTEXT";
  });
  return impactExplicit ? input.projectUnknowns.filter((item) => item.objectType === "UNCERTAINTY") : [];
};
const projectUnknownQuestionId = (objectRef: string) => `ST-AQ-PROJECT-UNKNOWN-${logicalDigest(objectRef)}`;
const unresolvedStructuringProjectUnknowns = (input: ScientificThinkingInput, answers: Record<string, string> = {}) =>
  structuringProjectUnknowns(input).filter((item) => {
    const answer = answers[projectUnknownQuestionId(item.objectRef)];
    return !answer || answer === "unknown";
  });
const ownerBoundaryEscalationGap = (input: ScientificThinkingInput) => input.knowledge.gaps.find((gap) => {
  const code = gap.code.toLocaleUpperCase("en-US");
  const namesExternalOwner = /(^|_)(OWNER|SPECIALIST|AUTHORITY|AUTHORIZATION)(_|$)/.test(code);
  const requiresDisposition = /(^|_)(REQUIRED|REVIEW|ESCALATION|AUTHORIZATION)(_|$)/.test(code);
  return namesExternalOwner && requiresDisposition;
}) ?? null;
const isMechanisticReasoning = (input: ScientificThinkingInput) => has(
  `${input.originalExpression} ${input.validatedReformulation} ${input.scientificPurpose.join(" ")}`,
  /\b(m[ée]cani|explicat|pourquoi|why|causal)/,
);
const explicitAlternativeClauses = (input: ScientificThinkingInput) => {
  const parts = sentence(input.validatedReformulation || input.originalExpression)
    .split(/\s+(?:ou|or)\s+/i)
    .map((item) => item.trim())
    .filter((item) => item.length >= 4);
  return parts.length >= 2 ? unique(parts) : [];
};
const hasRepresentedProjectComparison = (input: ScientificThinkingInput) => {
  const project = input.researchContext;
  if (!project.researchProjectId || !project.researchProjectVersion || !project.researchProjectDigest || !project.projectSnapshotDigest
    || input.scientificIntent.sourceJourney !== "DESIGN_STUDY"
    || input.scientificIntent.semanticModelRef !== project.researchProjectId
    || input.scientificIntent.semanticModelDigest !== project.researchProjectDigest) return false;

  // The existing Project adapter only emits this provenance after resolving a
  // represented comparison and endpoint. It is not evidence of scientific truth.
  if (!input.information.interpreted.some((item) => item.startsWith("PROJECT_CONTEXTUAL_QUESTION_CANDIDATE:"))) return false;
  const adoptedConcepts = input.resolvedConcepts.filter((concept) =>
    input.information.explicit.includes(`PROJECT_ADOPTED:${concept.conceptId}:${concept.label}`)
    && !input.projectUnknowns.some((unknown) => unknown.objectRef === concept.conceptId));
  const adoptedRefs = new Set(adoptedConcepts.map((concept) => concept.conceptId));
  const representedComparison = input.relations.some((relation) => {
    const match = /^COMPARES_WITH\(([^,()]+),([^,()]+)\)$/.exec(relation);
    return Boolean(match && match[1] !== match[2] && adoptedRefs.has(match[1]!) && adoptedRefs.has(match[2]!));
  });
  return representedComparison && adoptedConcepts.some((concept) => input.outcomes.includes(concept.label));
};
const scopeFor = (input: ScientificThinkingInput): QuestionCandidate["scope"] => {
  if (!input.scientificObjectTerms.length || has(input.originalExpression, /\b(tout|tous|general|imagerie medicale|plusieurs maladies|choses)\b/)) return "TOO_BROAD";
  if (input.methodsMentioned.length > 0 && !hasRelation(input.originalExpression) && !hasRepresentedProjectComparison(input)) return "TOO_NARROW";
  return "BALANCED";
};

const hasSupportedStructuredProjectQuestion = (input: ScientificThinkingInput, source: string) => {
  const reasoningTerms = unique([
    ...input.phenomena,
    ...input.outcomes,
    ...input.pathologyOrCondition,
    ...input.context,
  ]);
  const currentProjectBinding = Boolean(
    input.researchContext.researchProjectId
    && input.scientificIntent.sourceJourney === "DESIGN_STUDY"
    && input.scientificIntent.semanticModelRef === input.researchContext.researchProjectId
    && input.scientificIntent.semanticModelDigest,
  );
  const knowledgeBinding = Boolean(
    input.knowledge.ownerResultRef
    && input.knowledge.resultId
    && input.knowledge.resultRevision
    && input.knowledge.resultDigest
    && ["SUPPORTED", "PARTIAL", "CONFLICTING"].includes(input.knowledge.support)
    && (input.knowledge.assertionRefs.length > 0
      || input.knowledge.evidenceRefs.length > 0
      || input.knowledge.sourceIds.length > 0),
  );
  return hasQuestionForm(source)
    && currentProjectBinding
    && knowledgeBinding
    && reasoningTerms.length >= 2
    && (input.population.length > 0 || input.context.length > 0);
};

const buildQuestionCandidates = (input: ScientificThinkingInput, controls: ScientificThinkingControls): QuestionCandidate[] => {
  const source = input.validatedReformulation || input.originalExpression;
  const support = input.knowledge.support;
  const scope = scopeFor(input);
  const methods = input.methodsMentioned;
  const answeredFinality = controls.answers?.["ST-AQ-FINALITY"];
  const answeredRelation = controls.answers?.["ST-AQ-RELATION"];
  const answeredOutcome = controls.answers?.["ST-AQ-OUTCOME"];
  const answeredComparisonTarget = controls.answers?.["ST-AQ-COMPARISON-TARGET"];
  const answeredComparisonCriterion = controls.answers?.["ST-AQ-COMPARISON-CRITERION"];
  const { first, second } = relationTerms(input);
  const methodOnlyComparison = isMethodOnlyComparison(input);
  const completeExistingQuestion = hasQuestionForm(source)
    && ((hasRelation(source) && (hasPopulation(input) || hasTime(input) || hasOutcome(input)) && !hasMethodComparison(input))
      || (hasRepresentedProjectComparison(input) && !hasMethodComparison(input))
      || hasSupportedStructuredProjectQuestion(input, source));
  const candidates: Omit<QuestionCandidate, "reviewState">[] = [];

  if (methodOnlyComparison) {
    const labels = methodComparisonLabels(input);
    const target = comparisonAnswerLabel(answeredComparisonTarget);
    const criterion = comparisonAnswerLabel(answeredComparisonCriterion);
    const clarified = resolvedComparisonTarget(answeredComparisonTarget) && resolvedComparisonCriterion(answeredComparisonCriterion);
    candidates.push({
      questionId: "ST-Q-001",
      text: clarified
        ? `Comment comparer ${labels} pour « ${target} », selon « ${criterion} », ${populationLabel(input)} ?`
        : `Quel phénomène, quelle mesure ou quel résultat scientifique souhaitez-vous comparer entre ${labels} dans le contexte « ${methodComparisonContext(input)} » ?`,
      kind: "PRIMARY",
      rationale: "La comparaison de modalités est conservée comme intention méthodologique, mais elle ne devient pas une association artificielle entre un domaine et l’imagerie. L’objet et le critère de comparaison doivent être explicités.",
      testability: clarified ? "TESTABLE_CANDIDATE" : "NEEDS_CLARIFICATION",
      scope: "TOO_NARROW",
      support,
      linkedAssumptionIds: ["ST-A-001"],
      sourceTerms: unique([labels, methodComparisonContext(input), ...(target ? [target] : []), ...(criterion ? [criterion] : [])]),
    });
  } else if (completeExistingQuestion) {
    const contextualProjectQuestion = input.information.interpreted.some((item) => item.startsWith("PROJECT_CONTEXTUAL_QUESTION_CANDIDATE:"));
    const representedSourceTerms = contextualProjectQuestion
      ? unique([...input.scientificObjectTerms, ...input.methodsMentioned, ...input.pathologyOrCondition, ...input.phenomena, ...input.outcomes]
        .filter((item) => termAppearsIn(source, item)))
      : unique([first, ...(second ? [second] : [])]);
    candidates.push({
      questionId: contextualProjectQuestion ? "ST-Q-PROJECT-CONTEXT-001" : "ST-Q-001",
      text: source.trim().replace(/\?*$/, "?"), kind: "PRIMARY",
      rationale: contextualProjectQuestion
        ? "La relation comparative, ses deux extrémités et le critère sont déjà représentés dans le Project ; ils suffisent à formuler une question candidate sans redemander le phénomène étudié."
        : "La formulation contient déjà un objet, une relation et un élément de contexte ou de temporalité ; elle est conservée avec une normalisation minimale.",
      testability: "TESTABLE_CANDIDATE", scope, support, linkedAssumptionIds: hasRelation(source) ? ["ST-A-001"] : [], sourceTerms: representedSourceTerms,
    });
  } else if (input.researchContext.researchProjectId
    && input.scientificPurpose.includes(source)
    && has(source, /\b(evolution|progression|trajectoires?|longitudinal\w*)\b/)
    && hasPopulation(input)) {
    candidates.push({
      questionId: "ST-Q-001",
      text: `Comment ${source.charAt(0).toLocaleLowerCase("fr-FR")}${source.slice(1).replace(/[.?!]+$/, "")} ?`,
      kind: "PRIMARY", testability: "TESTABLE_CANDIDATE", scope: "BALANCED", support,
      rationale: "L’objectif longitudinal explicite est conservé comme une question candidate ; il n’est pas converti en opérande d’une association entre objets.",
      linkedAssumptionIds: [], sourceTerms: [source],
    });
  } else if (hasPrediction(source) && first) {
    const outcome = input.outcomes[0] ?? (answeredOutcome && !["unknown", "exploratory", "declared-event"].includes(answeredOutcome) ? answeredOutcome : hasOutcome(input) ? "les événements mentionnés" : "un résultat à préciser");
    candidates.push({
      questionId: "ST-Q-001", text: `Existe-t-il une association entre ${first} et ${outcome} ${contextualLabel(input)} ?`, kind: "PRIMARY",
      rationale: "La prétention prédictive est ramenée à une relation scientifique candidate avant toute affirmation de performance ou de causalité.",
      testability: hasOutcome(input) || Boolean(answeredOutcome && !["unknown", "exploratory"].includes(answeredOutcome)) ? "TESTABLE_CANDIDATE" : "NEEDS_CLARIFICATION", scope, support, linkedAssumptionIds: ["ST-A-001"], sourceTerms: unique([first, outcome]),
    });
  } else if (hasRelation(source) && second) {
    candidates.push({
      questionId: "ST-Q-001", text: `Existe-t-il une association entre ${first} et ${second} ${contextualLabel(input)} ?`, kind: "PRIMARY",
      rationale: "L’intuition relationnelle est reformulée comme une question réfutable, sans la considérer comme démontrée.",
      testability: "TESTABLE_CANDIDATE", scope, support, linkedAssumptionIds: ["ST-A-001"], sourceTerms: unique([first, second]),
    });
  } else if (methods.length && input.pathologyOrCondition.length) {
    const relation = answeredRelation && answeredRelation !== "unknown"
      ? answeredRelation === "association" ? "est-il associé à un résultat à préciser"
        : answeredRelation === "difference" ? "diffère-t-il d’un comparateur à préciser"
          : answeredRelation === "change" ? "évolue-t-il dans le temps"
            : answeredRelation
      : null;
    candidates.push({
      questionId: "ST-Q-001", text: relation
        ? `${input.pathologyOrCondition[0]} : le phénomène à préciser ${relation}, indépendamment de la préférence déclarée pour ${methods.join(" ou ")} ?`
        : `Quel phénomène relatif à ${input.pathologyOrCondition[0]} souhaitez-vous étudier, indépendamment de la préférence déclarée pour ${methods.join(" ou ")} ?`, kind: "PRIMARY",
      rationale: "La solution méthodologique mentionnée est conservée comme préférence, mais ne remplace pas la finalité scientifique.",
      testability: relation && answeredFinality ? "TESTABLE_CANDIDATE" : "NEEDS_CLARIFICATION", scope, support, linkedAssumptionIds: ["ST-A-001"], sourceTerms: unique([input.pathologyOrCondition[0], ...methods]),
    });
  } else {
    const finalityLabel = answeredFinality === "explain" ? "expliquer le mécanisme de"
      : answeredFinality === "compare" ? "comparer"
        : answeredFinality === "quantify" ? "quantifier ou suivre"
          : answeredFinality && answeredFinality !== "unknown" ? answeredFinality : null;
    const relationLabel = answeredRelation === "association" ? "et à quel autre objet est-il associé"
      : answeredRelation === "difference" ? "et à quel comparateur doit-il être confronté"
        : answeredRelation === "change" ? "et comment évolue-t-il dans le temps"
          : answeredRelation && answeredRelation !== "unknown" ? answeredRelation : null;
    candidates.push({
      questionId: "ST-Q-001", text: finalityLabel
        ? `Comment ${finalityLabel} ${objectLabel(input)}${relationLabel ? `, ${relationLabel}` : ""} ?`
        : `Quel phénomène relatif à ${objectLabel(input)} souhaitez-vous expliquer, comparer, quantifier ou suivre ?`, kind: "PRIMARY",
      rationale: "L’idée ne précise pas encore la relation scientifique ou la finalité qui rendrait la question testable.",
      testability: finalityLabel && relationLabel ? "TESTABLE_CANDIDATE" : "NEEDS_CLARIFICATION", scope, support, linkedAssumptionIds: [], sourceTerms: unique([objectLabel(input)]),
    });
  }

  if (hasMethodComparison(input) && !methodOnlyComparison) {
    const compared = methods.filter((item) => ["molli", "sasha"].includes(lower(item)));
    const labels = compared.length >= 2 ? compared.join(" et ") : methods.join(" et ");
    candidates.push({
      questionId: "ST-Q-002", text: `La comparaison entre ${labels} constitue-t-elle une question méthodologique distincte de la question scientifique principale ?`, kind: "METHODOLOGICAL_BRANCH",
      rationale: "Le choix de méthode est séparé de la relation scientifique afin de ne pas faire passer une solution prématurée pour la question principale.",
      testability: "NEEDS_CLARIFICATION", scope: "TOO_NARROW", support, linkedAssumptionIds: ["ST-A-002"], sourceTerms: unique(compared.length ? compared : methods),
    });
  }

  const structuringUnknown = unresolvedStructuringProjectUnknowns(input, controls.answers).length > 0;
  return candidates.map((item) => ({
    ...item,
    testability: structuringUnknown && item.kind === "PRIMARY" ? "NEEDS_CLARIFICATION" as const : item.testability,
    rationale: structuringUnknown && item.kind === "PRIMARY"
      ? `${item.rationale} Une inconnue Project structurante interdit de traiter la branche dépendante comme testable avant clarification.`
      : item.rationale,
    reviewState: controls.selectedQuestionId === item.questionId ? "ADOPTED" : "PENDING",
  }));
};

const buildAssumptions = (input: ScientificThinkingInput): AssumptionCandidate[] => {
  const assumptions: AssumptionCandidate[] = [];
  const { first, second } = relationTerms(input);
  if (hasRelation(input.originalExpression) && !isMethodOnlyComparison(input)) assumptions.push({
    assumptionId: "ST-A-001",
    text: second ? `La relation exprimée entre ${first} et ${second} est supposée avant d’être démontrée.` : `La relation exprimée autour de ${first} est supposée avant d’être démontrée.`,
    challenge: "Distinguer association, prédiction, temporalité et causalité ; rechercher une explication concurrente.",
    support: input.knowledge.support,
    status: "CHALLENGED",
  });
  if (input.methodsMentioned.length) assumptions.push({
    assumptionId: assumptions.length ? "ST-A-002" : "ST-A-001",
    text: `La pertinence de ${input.methodsMentioned.join(" et ")} est présumée avant confirmation de la finalité scientifique.`,
    challenge: "Conserver cette mention comme préférence ou branche méthodologique, sans sélectionner de modalité ni de technique.",
    support: input.knowledge.support,
    status: "CHALLENGED",
  });
  return assumptions;
};

const buildHypotheses = (input: ScientificThinkingInput, questions: QuestionCandidate[], controls: ScientificThinkingControls): HypothesisCandidate[] => {
  const primary = questions.find((item) => item.kind === "PRIMARY");
  if (!primary || primary.testability !== "TESTABLE_CANDIDATE") return [];
  if (input.requestedOperation === "GENERATE_ALTERNATIVE_HYPOTHESIS") {
    // Resolve the existing Project relation; domain words are not routing evidence.
    const comparisons = input.relations.flatMap((relation) => {
      const match = /^[A-Z_]*COMPARE[A-Z_]*\(([^,]+),([^,]+)\)$/u.exec(relation);
      const first = match && input.resolvedConcepts.find((item) => item.conceptId === match[1])?.label;
      const second = match && input.resolvedConcepts.find((item) => item.conceptId === match[2])?.label;
      return first && second ? [{ first, second }] : [];
    });
    const comparison = comparisons.length === 1 ? comparisons[0] : null;
    const outcome = input.outcomes[0];
    if (comparison && outcome) {
      const scope = `entre « ${comparison.first} » et « ${comparison.second} » pour « ${outcome} »`;
      const limitations = unique([
        "Ces hypothèses sont des propositions à discuter, sans adoption ni direction d’effet présumée.",
        "La population, les conditions de mesure et le plan d’étude doivent être précisés avant de conclure à une différence ou à son absence.",
        ...(input.knowledge.resultId ? input.knowledge.limitations : ["Aucun appui documentaire qualifié n’est disponible pour départager ces hypothèses."]),
      ]);
      const candidates: Omit<HypothesisCandidate, "reviewState">[] = [{
        hypothesisId: "ST-H-001", kind: "PRIMARY",
        text: `Hypothèse candidate : une différence est observable ${scope}, sans présumer quelle option présente la valeur la plus élevée.`,
        falsifiability: "NEEDS_CLARIFICATION", direction: null,
        observableCondition: "Comparer le même critère dans les deux options avec des conditions de mesure explicites et quantifier l’incertitude de l’écart observé.",
        limitations, unknowns: input.missingInformation, support: candidateSupport(input.knowledge.support), linkedQuestionIds: [primary.questionId],
      }, {
        hypothesisId: "ST-H-002", kind: "NULL_OR_COMPETING",
        text: `Hypothèse concurrente candidate : aucune différence n’est discernable ${scope} dans les conditions étudiées.`,
        falsifiability: "NEEDS_CLARIFICATION", direction: null,
        observableCondition: "Examiner si la précision des observations permet de distinguer un faible écart d’une information insuffisante ; une absence de différence détectée ne démontre pas l’équivalence.",
        limitations, unknowns: input.missingInformation, support: candidateSupport(input.knowledge.support), linkedQuestionIds: [primary.questionId],
      }];
      return candidates.filter((item) => !input.existingHypotheses.some((text) => lower(text) === lower(item.text)))
        .map((item) => ({ ...item, reviewState: reviewFor(item.hypothesisId, controls.hypothesisReviews) }));
    }
    // The generic question reformulation below is not evidence of a new
    // alternative. Keep confirmed hypotheses in Project and bound this request.
    return [];
  }
  if (input.existingHypotheses.length) return input.existingHypotheses.slice(0, 3).map((text, index) => ({
    hypothesisId: `ST-H-PROJECT-${String(index + 1).padStart(3, "0")}`,
    text,
    kind: index === 0 ? "PRIMARY" : "ALTERNATIVE",
    falsifiability: "TESTABLE_CANDIDATE",
    observableCondition: "Cette hypothèse Project est conservée sans sélection ; une information discriminante doit pouvoir la confronter aux alternatives.",
    direction: null,
    limitations: input.knowledge.limitations,
    unknowns: input.missingInformation,
    support: candidateSupport(input.knowledge.support),
    linkedQuestionIds: [primary.questionId],
    reviewState: reviewFor(`ST-H-PROJECT-${String(index + 1).padStart(3, "0")}`, controls.hypothesisReviews),
  }));
  const base = sentence(primary.text).replace(/^(Quel|Quelle|Quels|Quelles|Comment|Pourquoi)\b/i, "Une relation concernant");
  const hypotheses: Omit<HypothesisCandidate, "reviewState">[] = [{
    hypothesisId: "ST-H-001",
    text: hasPrediction(input.originalExpression)
      ? `Une association observable existe entre ${relationTerms(input).first} et le résultat mentionné, sans présumer de sa valeur prédictive.`
      : `La relation formulée dans « ${base} » est observable dans le contexte précisé.`,
    kind: "PRIMARY", falsifiability: primary.testability, observableCondition: "La relation candidate doit pouvoir être confrontée à des observations définies ; les critères restent à préciser.", direction: null,
    limitations: input.knowledge.limitations, unknowns: input.missingInformation,
    support: candidateSupport(input.knowledge.support), linkedQuestionIds: [primary.questionId],
  }];
  const exactStatements = unique(input.knowledge.reasoningStatements.map((item) => item.text));
  const explicitClauses = input.knowledge.support === "CONFLICTING" ? explicitAlternativeClauses(input) : [];
  const branchTexts = exactStatements.length >= 2
    ? exactStatements
    : explicitClauses.length >= 2
      ? explicitClauses.map((item) => `Interprétation candidate explicitement ouverte : ${item}`)
      : input.knowledge.support === "CONFLICTING" ? exactStatements : [];
  branchTexts.slice(0, 2).forEach((text, index) => {
    const statement = input.knowledge.reasoningStatements.find((item) => item.text === text);
    hypotheses.push({
      hypothesisId: `ST-H-KNOWLEDGE-${String(index + 1).padStart(3, "0")}`,
      text,
      kind: "ALTERNATIVE",
      falsifiability: "TESTABLE_CANDIDATE",
      observableCondition: "Cette branche candidate doit rester distincte et être confrontée à une information discriminante ; aucun gagnant n’est sélectionné.",
      direction: null,
      limitations: unique([...(statement?.limitations ?? []), ...input.knowledge.limitations]),
      unknowns: input.missingInformation,
      support: candidateSupport(input.knowledge.support),
      linkedQuestionIds: [primary.questionId],
    });
  });
  if (!branchTexts.length) hypotheses.push({
    hypothesisId: "ST-H-002",
    text: "Une explication concurrente ou l’absence de relation peut rendre compte des observations attendues.",
    kind: "NULL_OR_COMPETING", falsifiability: "TESTABLE_CANDIDATE", observableCondition: "Une observation incompatible avec l’hypothèse principale doit rester possible.", direction: null,
    limitations: ["Explication concurrente générique à préciser par décision humaine et Knowledge."], unknowns: input.missingInformation,
    support: "UNSUPPORTED", linkedQuestionIds: [primary.questionId],
  });
  return hypotheses.map((item) => ({ ...item, reviewState: reviewFor(item.hypothesisId, controls.hypothesisReviews) }));
};

const buildObjectives = (input: ScientificThinkingInput, questions: QuestionCandidate[], controls: ScientificThinkingControls, hypotheses: HypothesisCandidate[]): ObjectiveCandidate[] => {
  const primary = questions.find((item) => item.kind === "PRIMARY");
  if (!primary || primary.testability !== "TESTABLE_CANDIDATE") return [];
  const objectives: Omit<ObjectiveCandidate, "reviewState">[] = [{
    objectiveId: "ST-O-001", text: `Évaluer la question scientifique candidate : « ${sentence(primary.text)} ».`, level: "PRIMARY",
    support: candidateSupport(input.knowledge.support), linkedQuestionIds: [primary.questionId],
    linkedHypothesisIds: input.requestedOperation === "GENERATE_ALTERNATIVE_HYPOTHESIS" ? hypotheses.map((hypothesis) => hypothesis.hypothesisId) : ["ST-H-001"],
  }];
  const branch = questions.find((item) => item.kind === "METHODOLOGICAL_BRANCH");
  if (branch) objectives.push({
    objectiveId: "ST-O-002", text: "Examiner séparément l’influence de la branche méthodologique déclarée, sans sélectionner de méthode à ce stade.", level: "SECONDARY",
    support: candidateSupport(input.knowledge.support), linkedQuestionIds: [branch.questionId], linkedHypothesisIds: [],
  });
  return objectives.map((item) => ({ ...item, reviewState: reviewFor(item.objectiveId, controls.objectiveReviews) }));
};

const buildMechanisms = (input: ScientificThinkingInput, hypotheses: HypothesisCandidate[]): MechanismCandidate[] => {
  if (isMethodOnlyComparison(input) || !hasRelation(input.originalExpression) || !hypotheses.length) return [];
  const knowledgeStatements = isMechanisticReasoning(input) ? input.knowledge.reasoningStatements : [];
  if (knowledgeStatements.length) return knowledgeStatements.map((statement, index) => ({
    mechanismId: `ST-M-KNOWLEDGE-${String(index + 1).padStart(3, "0")}`,
    text: statement.text,
    status: input.knowledge.support === "SUPPORTED" ? "KNOWLEDGE_SUPPORTED_MECHANISM" : "MECHANISM_TO_DOCUMENT",
    support: candidateSupport(input.knowledge.support),
    linkedHypothesisIds: hypotheses.map((item) => item.hypothesisId),
  }));
  const { first, second } = relationTerms(input);
  return [{
    mechanismId: "ST-M-001",
    text: second ? `Le mécanisme susceptible de relier ${first} et ${second} reste à documenter.` : `Le mécanisme associé à ${first} reste à documenter.`,
    status: "MECHANISM_TO_DOCUMENT",
    support: candidateSupport(input.knowledge.support),
    linkedHypothesisIds: hypotheses.map((item) => item.hypothesisId),
  }];
};

const buildScientificModels = (
  input: ScientificThinkingInput,
  hypotheses: HypothesisCandidate[],
  mechanisms: MechanismCandidate[],
): ScientificModelCandidate[] => mechanisms
  .filter((mechanism) => mechanism.status === "KNOWLEDGE_SUPPORTED_MECHANISM")
  .slice(0, 3)
  .map((mechanism, index) => ({
    modelId: `ST-MODEL-${String(index + 1).padStart(3, "0")}`,
    text: mechanism.text,
    rationale: "Concept explicatif candidat dérivé d’un énoncé Knowledge applicable ; il ne constitue pas une vérité Project.",
    assumptions: input.existingHypotheses.length ? input.existingHypotheses.slice(0, 3) : hypotheses.map((item) => item.text).slice(0, 3),
    uncertainties: unique([...input.missingInformation, ...input.knowledge.limitations]),
    support: mechanism.support,
    reviewState: "PENDING" as const,
    linkedHypothesisIds: [...mechanism.linkedHypothesisIds],
  }));

const buildDownstreamHandoffs = (input: {
  sourceOutputRef: string;
  sourceProject: NonNullable<ScientificThinkingOutput["sourceProject"]>;
  nativeInput: ScientificThinkingInput;
  questions: QuestionCandidate[];
  hypotheses: HypothesisCandidate[];
  models: ScientificModelCandidate[];
  knowledgeRequired: boolean;
}): ScientificThinkingDownstreamHandoff[] => {
  const provenanceRefs = unique([
    input.nativeInput.requestId,
    ...input.nativeInput.information.explicit,
    ...input.nativeInput.researchContext.previousDecisionIds,
  ]);
  const candidateRefs = unique([
    ...input.questions.map((item) => item.questionId),
    ...input.hypotheses.map((item) => item.hypothesisId),
    ...input.models.map((item) => item.modelId),
  ]);
  const make = (details: {
    targetOwner: ScientificThinkingDownstreamHandoff["targetOwner"];
    capabilityId: ScientificThinkingDownstreamHandoff["capabilityId"];
    purpose: string;
    informationNeeded: string[];
  }): ScientificThinkingDownstreamHandoff => ({
    handoffId: `scientific-thinking-handoff-proposal:${logicalDigest({ output: input.sourceOutputRef, target: details.targetOwner })}`,
    sourceOwner: "SCIENTIFIC_THINKING",
    targetOwner: details.targetOwner,
    capabilityId: details.capabilityId,
    sourceOutputRef: input.sourceOutputRef,
    sourceCandidateRefs: candidateRefs,
    sourceProjectRef: input.sourceProject.projectId,
    sourceProjectVersion: input.sourceProject.projectVersion,
    sourceProjectDigest: input.sourceProject.projectDigest,
    purpose: details.purpose,
    informationNeeded: unique(details.informationNeeded),
    provenanceRefs,
    status: "PROPOSED_NOT_EXECUTED",
    ownershipTransferred: false,
    projectWriteAuthorized: false,
  });
  const handoffs: ScientificThinkingDownstreamHandoff[] = [];
  if (input.questions.some((item) => item.testability === "TESTABLE_CANDIDATE") || input.hypotheses.length) handoffs.push(make({
    targetOwner: "STUDY_DESIGN",
    capabilityId: "STUDY_DESIGN_COHERENCE",
    purpose: "Qualifier les conséquences de design de la question et des hypothèses sans choisir ni adopter un design.",
    informationNeeded: ["question scientifique confirmée", "hypothèses retenues ou explicitement écartées", "incertitudes structurantes"],
  }));
  if (input.hypotheses.some((item) => item.observableCondition.trim().length > 0)) handoffs.push(make({
    targetOwner: "OBSERVABILITY_MEASUREMENT",
    capabilityId: "OBSERVABILITY_QUALIFICATION",
    purpose: "Qualifier les manifestations observables requises par les hypothèses sans créer de MeasurementDefinition.",
    informationNeeded: ["ObservableProperties candidates", "limites d’observabilité", "chaîne hypothèse-observation"],
  }));
  if (input.nativeInput.methodsMentioned.length > 0) handoffs.push(make({
    targetOwner: "IMAGING",
    capabilityId: "IMAGING_STUDY_DESIGN",
    purpose: "Qualifier l’implication d’imagerie déclarée sans choisir d’acquisition ni de protocole.",
    informationNeeded: ["manifestation d’imagerie recherchée", "faisabilité conceptuelle", "limites de mesure et de qualité"],
  }));
  if (input.hypotheses.length > 1 || has(`${input.nativeInput.scientificPurpose.join(" ")} ${input.nativeInput.relations.join(" ")}`, /analys|compar|discrimin|longitudinal|evolution/)) handoffs.push(make({
    targetOwner: "BIOSTATISTICS",
    capabilityId: "BIOSTATISTICS_PLANNING",
    purpose: "Qualifier le besoin analytique discriminant sans sélectionner de modèle statistique ni produire de dimensionnement.",
    informationNeeded: ["contraste scientifique à discriminer", "estimand à qualifier", "incertitudes et alternatives"],
  }));
  if (input.knowledgeRequired) handoffs.push(make({
    targetOwner: "KNOWLEDGE",
    capabilityId: "KNOWLEDGE_EVIDENCE",
    purpose: "Documenter les propositions et incertitudes avant toute prétention de soutien scientifique.",
    informationNeeded: ["éléments de preuve applicables", "controverses", "limites et lacunes documentaires"],
  }));
  return handoffs;
};

const buildAdaptiveQuestions = (input: ScientificThinkingInput, questions: QuestionCandidate[], answers: Record<string, string>): ScientificThinkingAdaptiveQuestion[] => {
  const proposed: ScientificThinkingAdaptiveQuestion[] = unresolvedStructuringProjectUnknowns(input, answers).map((unknown) => ({
    questionId: projectUnknownQuestionId(unknown.objectRef),
    label: unknown.text,
    whyAsked: "Cette inconnue appartient au Project et modifie la portée ou l’applicabilité du raisonnement dépendant.",
    decisionImpact: "La réponse détermine quelle branche scientifique peut être instruite ; aucune complétion n’est choisie automatiquement.",
    decisionBlock: "SCOPE",
    blocking: true,
    suggestedAnswers: [],
    acceptsFreeText: true,
    acceptsUnknown: true,
    answeredValue: answers[projectUnknownQuestionId(unknown.objectRef)] ?? null,
  }));
  if (input.scientificPurpose.length > 1 && !answers["ST-AQ-OBJECTIVE-STRUCTURE"]) proposed.push({
    questionId: "ST-AQ-OBJECTIVE-STRUCTURE",
    label: `Souhaitez-vous réunir les objectifs ${input.scientificPurpose.map((purpose) => `« ${purpose} »`).join(" et ")} dans une même étude à plusieurs volets, ou les traiter comme des études distinctes ?`,
    whyAsked: "Plusieurs objectifs explicites peuvent partager une population et certaines méthodes tout en nécessitant des plans d’étude distincts.",
    decisionImpact: "La réponse détermine la structure du Research Project et les dépendances communes, sans adopter automatiquement l’une des options.",
    decisionBlock: "SCOPE",
    blocking: true,
    suggestedAnswers: [
      { value: "coordinated-study", label: "Une étude à plusieurs volets", consequence: "Les objectifs restent distincts dans une structure commune." },
      { value: "distinct-studies", label: "Des études distinctes", consequence: "Chaque objectif conserve son propre périmètre d’étude." },
    ],
    acceptsFreeText: true,
    acceptsUnknown: true,
    answeredValue: null,
  });
  const complete = questions[0]?.testability === "TESTABLE_CANDIDATE" && hasPopulation(input) && (hasOutcome(input) || hasTime(input) || input.relations.length > 0);
  if (complete) return proposed;
  const methodOnlyComparison = isMethodOnlyComparison(input);
  const methods = methodComparisonLabels(input);
  if (methodOnlyComparison && !resolvedComparisonTarget(answers["ST-AQ-COMPARISON-TARGET"])) proposed.push({
    questionId: "ST-AQ-COMPARISON-TARGET", label: `Quel phénomène, quelle mesure ou quel résultat scientifique souhaitez-vous comparer entre ${methods} ?`,
    whyAsked: "Deux modalités ne constituent pas à elles seules une question scientifique : elles doivent être reliées au même objet mesurable ou observable.",
    decisionImpact: "La réponse définira l’objet scientifique de la comparaison sans sélectionner CT ni IRM.",
    decisionBlock: "TESTABILITY", blocking: true,
    suggestedAnswers: [
      { value: "same-phenomenon", label: "Un même phénomène biologique", consequence: "Le phénomène devra ensuite être nommé explicitement." },
      { value: "same-measure", label: "Une même mesure quantitative", consequence: "La mesure devra ensuite être nommée explicitement." },
      { value: "same-outcome", label: "Un même résultat scientifique", consequence: "Le résultat devra ensuite être nommé explicitement." },
    ], acceptsFreeText: true, acceptsUnknown: true, answeredValue: answers["ST-AQ-COMPARISON-TARGET"] ?? null,
  });
  if (methodOnlyComparison && !resolvedComparisonCriterion(answers["ST-AQ-COMPARISON-CRITERION"])) proposed.push({
    questionId: "ST-AQ-COMPARISON-CRITERION", label: `Selon quel critère scientifique souhaitez-vous comparer ${methods} ?`,
    whyAsked: "Une comparaison n’est interprétable que si sa dimension est explicite.",
    decisionImpact: "La réponse précisera ce qui peut différer, sans présumer qu’une modalité est supérieure.",
    decisionBlock: "TESTABILITY", blocking: true,
    suggestedAnswers: [
      { value: "agreement", label: "Accord entre les mesures", consequence: "La question restera centrée sur la concordance des mesures." },
      { value: "reproducibility", label: "Reproductibilité", consequence: "La question restera centrée sur la stabilité des mesures." },
      { value: "characterization", label: "Caractérisation du phénomène", consequence: "Le phénomène cible devra rester explicite." },
    ], acceptsFreeText: true, acceptsUnknown: true, answeredValue: answers["ST-AQ-COMPARISON-CRITERION"] ?? null,
  });
  if (!methodOnlyComparison && (isNonTestable(input.originalExpression) || isVagueIdea(input.originalExpression) || (!input.scientificPurpose.length && !hasRelation(input.originalExpression) && !hasPrediction(input.originalExpression)))) proposed.push({
    questionId: "ST-AQ-FINALITY", label: `Que cherchez-vous d’abord à comprendre à propos de ${objectLabel(input)} ?`,
    whyAsked: "Une méthode ou un thème ne suffit pas à constituer une question scientifique testable.",
    decisionImpact: "Votre réponse déterminera la relation centrale et permettra, ou non, de proposer une question testable.",
    decisionBlock: "SCIENTIFIC_FINALITY", blocking: true,
    suggestedAnswers: [
      { value: "explain", label: "Expliquer un mécanisme", consequence: "La question sera orientée vers une relation mécanistique candidate." },
      { value: "compare", label: "Comparer", consequence: "Les objets de comparaison devront être explicités." },
      { value: "quantify", label: "Quantifier ou suivre", consequence: "La grandeur et la temporalité devront être explicitées." },
    ], acceptsFreeText: true, acceptsUnknown: true, answeredValue: answers["ST-AQ-FINALITY"] ?? null,
  });
  if (!methodOnlyComparison && input.scientificPurpose.length < 2 && !hasRelation(input.originalExpression) && !isNonTestable(input.originalExpression)) proposed.push({
    questionId: "ST-AQ-RELATION", label: "Quelle relation souhaitez-vous examiner ?",
    whyAsked: "La relation distingue une intuition thématique d’une question réfutable.",
    decisionImpact: "Elle structure la question principale et les hypothèses concurrentes.", decisionBlock: "RELATION", blocking: true,
    suggestedAnswers: [
      { value: "association", label: "Une association", consequence: "Aucune causalité ne sera présumée." },
      { value: "difference", label: "Une différence", consequence: "Les deux objets devront être nommés." },
      { value: "change", label: "Une évolution", consequence: "La temporalité devra rester visible." },
    ], acceptsFreeText: true, acceptsUnknown: true, answeredValue: answers["ST-AQ-RELATION"] ?? null,
  });
  if (hasPrediction(input.originalExpression) && !hasOutcome(input)) proposed.push({
    questionId: "ST-AQ-OUTCOME", label: "Quel événement ou résultat souhaitez-vous distinguer ?",
    whyAsked: "Une prétention prédictive n’est pas testable sans résultat explicitement défini.",
    decisionImpact: "La réponse borne la question pronostique sans choisir de méthode d’analyse.", decisionBlock: "TESTABILITY", blocking: true,
    suggestedAnswers: [
      { value: "declared-event", label: "Je vais le préciser", consequence: "Le résultat sera ajouté au contexte utilisateur." },
      { value: "exploratory", label: "Encore exploratoire", consequence: "La prétention prédictive restera non adoptable." },
    ], acceptsFreeText: true, acceptsUnknown: true, answeredValue: answers["ST-AQ-OUTCOME"] ?? null,
  });
  return proposed;
};

const buildGraph = (
  input: ScientificThinkingInput,
  semanticElements: IdeaElement[],
  questions: QuestionCandidate[],
  assumptions: AssumptionCandidate[],
  hypotheses: HypothesisCandidate[],
  objectives: ObjectiveCandidate[],
  mechanisms: MechanismCandidate[],
  unknowns: string[],
): { nodes: ReasoningGraphNode[]; edges: ReasoningGraphEdge[] } => {
  const nodes: ReasoningGraphNode[] = [{ nodeId: "ST-N-SITUATION", type: "SITUATION", label: input.originalExpression, status: "USER_STATED", sourceRef: input.requestId }];
  semanticElements.forEach((item) => nodes.push({ nodeId: `ST-N-${item.elementId}`, type: item.type, label: item.text, status: item.source === "USER_EXPLICIT" ? "USER_STATED" : "CANDIDATE", sourceRef: item.elementId }));
  questions.forEach((item) => nodes.push({ nodeId: `ST-N-${item.questionId}`, type: "SCIENTIFIC_QUESTION", label: item.text, status: item.reviewState === "ADOPTED" ? "HUMAN_CONFIRMED" : item.reviewState === "REJECTED" ? "REJECTED" : "CANDIDATE", sourceRef: item.questionId }));
  assumptions.forEach((item) => nodes.push({ nodeId: `ST-N-${item.assumptionId}`, type: "ASSUMPTION", label: item.text, status: "OPEN", sourceRef: item.assumptionId }));
  hypotheses.forEach((item) => nodes.push({ nodeId: `ST-N-${item.hypothesisId}`, type: "HYPOTHESIS", label: item.text, status: item.reviewState === "ADOPTED" ? "HUMAN_CONFIRMED" : item.reviewState === "REJECTED" ? "REJECTED" : "CANDIDATE", sourceRef: item.hypothesisId }));
  objectives.forEach((item) => nodes.push({ nodeId: `ST-N-${item.objectiveId}`, type: "OBJECTIVE", label: item.text, status: item.reviewState === "ADOPTED" ? "HUMAN_CONFIRMED" : item.reviewState === "REJECTED" ? "REJECTED" : "CANDIDATE", sourceRef: item.objectiveId }));
  mechanisms.forEach((item) => nodes.push({ nodeId: `ST-N-${item.mechanismId}`, type: "MECHANISM", label: item.text, status: "CANDIDATE", sourceRef: item.mechanismId }));
  unknowns.forEach((item, index) => nodes.push({ nodeId: `ST-N-GAP-${index + 1}`, type: "KNOWLEDGE_GAP", label: item, status: "OPEN", sourceRef: input.knowledge.resultId ?? input.requestId }));
  input.methodsMentioned.forEach((item, index) => nodes.push({ nodeId: `ST-N-METHOD-${index + 1}`, type: "METHOD_PREFERENCE", label: item, status: "USER_STATED", sourceRef: input.requestId }));

  const edges: ReasoningGraphEdge[] = [];
  questions.forEach((item, index) => edges.push({ edgeId: `ST-E-Q-${index + 1}`, from: "ST-N-SITUATION", to: `ST-N-${item.questionId}`, relation: "REFORMULATED_AS" }));
  assumptions.forEach((item, index) => edges.push({ edgeId: `ST-E-A-${index + 1}`, from: `ST-N-${item.assumptionId}`, to: `ST-N-${questions[0]?.questionId ?? "SITUATION"}`, relation: "DEPENDS_ON" }));
  hypotheses.forEach((item, index) => edges.push({ edgeId: `ST-E-H-${index + 1}`, from: `ST-N-${item.hypothesisId}`, to: `ST-N-${item.linkedQuestionIds[0]}`, relation: item.kind === "NULL_OR_COMPETING" ? "ALTERNATIVE_TO" : "INFORMS" }));
  objectives.forEach((item, index) => edges.push({ edgeId: `ST-E-O-${index + 1}`, from: `ST-N-${item.objectiveId}`, to: `ST-N-${item.linkedQuestionIds[0]}`, relation: "ADDRESSES" }));
  mechanisms.forEach((item, index) => edges.push({ edgeId: `ST-E-M-${index + 1}`, from: `ST-N-${item.mechanismId}`, to: `ST-N-${item.linkedHypothesisIds[0]}`, relation: "EXPLAINS" }));
  unknowns.forEach((item, index) => edges.push({ edgeId: `ST-E-GAP-${index + 1}`, from: `ST-N-${questions[0]?.questionId ?? "SITUATION"}`, to: `ST-N-GAP-${index + 1}`, relation: "REQUIRES_INFORMATION" }));
  assumptions.forEach((item, index) => {
    const hypothesis = hypotheses[index] ?? hypotheses[0];
    if (hypothesis) edges.push({ edgeId: `ST-E-CHALLENGE-${index + 1}`, from: `ST-N-${item.assumptionId}`, to: `ST-N-${hypothesis.hypothesisId}`, relation: "CHALLENGES" });
  });
  return { nodes, edges };
};

const operationStatus = (
  operation: ScientificThinkingOperation,
  context: { questions: QuestionCandidate[]; assumptions: AssumptionCandidate[]; hypotheses: HypothesisCandidate[]; mechanisms: MechanismCandidate[]; adaptive: ScientificThinkingAdaptiveQuestion[]; split: boolean; refusal: ScientificThinkingOutput["refusal"]; knowledgeRequired: boolean; handoffReady: boolean },
): { status: OperationStatus; reason: string } => {
  if (context.refusal && operation !== "REJECT_NON_TESTABLE_HYPOTHESIS" && operation !== "REQUEST_HUMAN_DECISION") return { status: "BLOCKED", reason: `Arrêt explicite : ${context.refusal.code}.` };
  const executed = new Set<ScientificThinkingOperation>([
    "REFORMULATE_QUESTION", "IDENTIFY_MISSING_INFORMATION", "IDENTIFY_CONTRADICTION", "IDENTIFY_CONCEPTUAL_BIAS", "REQUEST_HUMAN_DECISION",
  ]);
  if (context.adaptive.length) executed.add("CLARIFY_IDEA");
  if (context.split) executed.add("SPLIT_QUESTION");
  if (context.assumptions.length) { executed.add("IDENTIFY_ASSUMPTION"); executed.add("CHALLENGE_ASSUMPTION"); }
  if (context.hypotheses.length) { executed.add("GENERATE_ALTERNATIVE_HYPOTHESIS"); executed.add("REFINE_HYPOTHESIS"); }
  if (context.mechanisms.length) executed.add("IDENTIFY_MECHANISM");
  if (context.questions.some((item) => item.testability === "NON_TESTABLE") || context.refusal?.code === "NON_TESTABLE") executed.add("REJECT_NON_TESTABLE_HYPOTHESIS");
  if (context.hypotheses.length) { executed.add("PROPOSE_OBJECTIVES"); executed.add("PRIORITIZE_OBJECTIVES_FOR_REVIEW"); }
  if (context.knowledgeRequired) executed.add("REQUEST_KNOWLEDGE");
  if (context.handoffReady) executed.add("PREPARE_RESEARCH_DESIGN_HANDOFF");
  if (executed.has(operation)) return { status: "EXECUTED", reason: "Opération déterministe exécutée et tracée sur les éléments applicables." };
  if (["MERGE_QUESTIONS", "REDUCE_SCOPE", "EXPAND_SCOPE"].includes(operation)) return { status: "AVAILABLE", reason: "Opération disponible uniquement sur demande ou après décision humaine ; aucun changement silencieux." };
  if (operation === "PREPARE_RESEARCH_DESIGN_HANDOFF") return { status: "BLOCKED", reason: "Les portes humaines ou les informations décisionnelles ne sont pas encore satisfaites." };
  return { status: "NOT_APPLICABLE", reason: "Aucun élément actuel ne justifie cette opération." };
};

const buildHandoff = (
  input: ScientificThinkingInput,
  questions: QuestionCandidate[],
  hypotheses: HypothesisCandidate[],
  objectives: ObjectiveCandidate[],
  mechanisms: MechanismCandidate[],
  adaptive: ScientificThinkingAdaptiveQuestion[],
  controls: ScientificThinkingControls,
  refusal: ScientificThinkingOutput["refusal"],
  unknowns: string[],
  alternatives: string[],
): ResearchDesignHandoff => {
  const selected = questions.find((item) => item.reviewState === "ADOPTED");
  const adoptedHypotheses = hypotheses.filter((item) => item.reviewState === "ADOPTED");
  const hypothesesReviewed = hypotheses.length > 0 && hypotheses.every((item) => item.reviewState !== "PENDING");
  const adoptedObjectives = objectives.filter((item) => item.reviewState === "ADOPTED");
  const primaryObjectiveAdopted = adoptedObjectives.some((item) => item.level === "PRIMARY");
  const unresolvedAdaptive = adaptive.filter((item) => item.blocking && !item.answeredValue).map((item) => item.questionId);
  const accepted = unique(controls.acceptedUnknowns ?? []);
  const unresolvedUnknowns = unknowns.filter((item) => !accepted.includes(item));
  const blockedBy = [
    ...(!selected ? ["QUESTION_CONFIRMATION_REQUIRED"] : []),
    ...(!hypothesesReviewed || !adoptedHypotheses.length ? ["HYPOTHESIS_ADOPTION_OR_EXPLICIT_REJECTION_REQUIRED"] : []),
    ...(!primaryObjectiveAdopted ? ["OBJECTIVE_HIERARCHY_REQUIRED"] : []),
    ...unresolvedAdaptive.map((item) => `UNANSWERED:${item}`),
    ...input.contradictions.map((item) => `UNRESOLVED_CONTRADICTION:${item}`),
    ...(refusal ? [`REFUSAL:${refusal.code}`] : []),
  ];
  const ready = blockedBy.length === 0;
  const transitionApproved = controls.gateStatuses?.DESIGN_TRANSITION === "APPROVED";
  return {
    handoffVersion: "1.1",
    status: ready ? transitionApproved ? "AUTHORIZED" : "READY_FOR_HUMAN_AUTHORIZATION" : "NOT_READY",
    questionId: selected?.questionId ?? null,
    hypothesisIds: adoptedHypotheses.map((item) => item.hypothesisId),
    objectiveIds: adoptedObjectives.map((item) => item.objectiveId),
    mechanisms,
    knownInformation: unique([...input.information.explicit, ...input.information.interpreted]),
    acceptedUnknowns: accepted,
    unresolvedUnknowns,
    contradictions: unique([...input.contradictions, ...input.knowledge.contradictions]),
    decisionRecordIds: unique(controls.decisionRecordIds ?? []),
    humanDecisions: controls.decisionRecords ?? [],
    alternativesNotSelected: alternatives,
    limitations: input.knowledge.limitations,
    provenanceRefs: unique([
      input.requestId,
      ...(input.knowledge.ownerResultRef ? [input.knowledge.ownerResultRef] : []),
      ...(input.knowledge.resultId ? [input.knowledge.resultId] : []),
      ...input.knowledge.assertionRefs,
      ...input.knowledge.documentaryStatementRefs,
      ...input.knowledge.evidenceRefs,
      ...input.knowledge.sourceIds,
    ]),
    knowledgeResultRef: input.knowledge.resultId,
    blockedBy,
    boundary: "NO_PROTOCOL_NO_METHOD_SELECTION_NO_STATISTICAL_PLAN",
  };
};

export const executeScientificThinkingEngine = (
  rawInput: ScientificThinkingInput,
  controls: ScientificThinkingControls = {},
): ScientificThinkingOutput => {
  const input = parseScientificThinkingInput(rawInput);
  const answers = controls.answers ?? {};
  const source = input.originalExpression;
  const patientLevel = isPatientLevel(source, input.safetyFlags);
  const outOfDomain = isOutOfDomain(source);
  const nonTestable = isNonTestable(source);
  const insufficient = source.trim().length < 12;
  const ownerEscalation = ownerBoundaryEscalationGap(input);
  const refusal: ScientificThinkingOutput["refusal"] = patientLevel ? {
    code: "PATIENT_LEVEL", reason: "La demande concerne une situation individuelle ; le moteur de raisonnement de recherche ne l’interprète pas.", resumeCondition: "Reformuler une question générale de recherche sans donnée patient.",
  } : outOfDomain ? {
    code: "OUT_OF_DOMAIN", reason: "La demande ne relève pas du périmètre de conception scientifique en imagerie médicale.", resumeCondition: "Formuler une question de recherche en imagerie médicale.",
  } : ownerEscalation ? {
    code: "OUT_OF_DOMAIN",
    reason: `La décision dépasse l’ownership de Scientific Thinking et exige une escalade vers un owner spécialisé : ${ownerEscalation.explanation}`,
    resumeCondition: ownerEscalation.resumeCondition,
  } : insufficient ? {
    code: "INSUFFICIENT_INPUT", reason: "L’expression ne contient pas assez d’éléments pour construire une question candidate traçable.", resumeCondition: "Ajouter l’objet ou le phénomène scientifique concerné.",
  } : nonTestable ? {
    code: "NON_TESTABLE", reason: "La finalité déclarée ne permet pas encore une réfutation ou une observation structurée.", resumeCondition: "Préciser le phénomène, la relation ou la différence recherchée.",
  } : null;

  const baseSemanticType: IdeaElement["type"] = hasQuestionForm(source) ? "SCIENTIFIC_QUESTION"
    : has(source, /\b(j['’]observe|nous observons|constat)\b/) ? "OBSERVATION"
      : has(source, /\b(j['’]ai une id[ée]e|je pense|intuition|pourrait)\b/) ? "INTUITION"
        : "OBSERVATION";
  const semanticElements: IdeaElement[] = [{
    elementId: "ST-I-001", type: baseSemanticType, text: source, source: "USER_EXPLICIT", confidence: "HIGH", support: input.knowledge.support,
  }];
  if (hasRelation(source) && !isMethodOnlyComparison(input) && baseSemanticType !== "SCIENTIFIC_QUESTION") semanticElements.push({
    elementId: "ST-I-002", type: "ASSUMPTION", text: "La relation exprimée est traitée comme une supposition à examiner, non comme un résultat.", source: "NOXIA_CANDIDATE", confidence: "MEDIUM", support: input.knowledge.support,
  });

  let questions = refusal && refusal.code !== "NON_TESTABLE" ? [] : buildQuestionCandidates(input, controls);
  if (nonTestable) questions = questions.map((item) => ({ ...item, testability: "NON_TESTABLE" as const }));
  const assumptions = refusal ? [] : buildAssumptions(input);
  const hypotheses = refusal ? [] : buildHypotheses(input, questions, controls);
  const objectives = refusal ? [] : buildObjectives(input, questions, controls, hypotheses);
  const mechanisms = refusal ? [] : buildMechanisms(input, hypotheses);
  const scientificModels = refusal ? [] : buildScientificModels(input, hypotheses, mechanisms);
  const adaptiveQuestions = refusal && refusal.code !== "NON_TESTABLE" ? [] : buildAdaptiveQuestions(input, questions, answers);
  const ambiguities = unique([
    ...(isMethodOnlyComparison(input) && !resolvedComparisonTarget(answers["ST-AQ-COMPARISON-TARGET"]) ? ["OBJET_DE_COMPARAISON_NON_PRÉCISÉ"] : []),
    ...(isMethodOnlyComparison(input) && !resolvedComparisonCriterion(answers["ST-AQ-COMPARISON-CRITERION"]) ? ["CRITÈRE_DE_COMPARAISON_NON_PRÉCISÉ"] : []),
    ...(!hasRelation(source) ? ["RELATION_SCIENTIFIQUE_NON_PRÉCISÉE"] : []),
    ...(!input.scientificPurpose.length ? ["FINALITÉ_SCIENTIFIQUE_NON_CONFIRMÉE"] : []),
    ...input.knowledge.unresolvedConcepts.map((item) => `CONCEPT_NON_RÉSOLU:${item}`),
  ]);
  const conceptualBiases = unique([
    ...(input.methodsMentioned.length ? ["SOLUTION_MÉTHODOLOGIQUE_POTENTIELLEMENT_PRÉMATURÉE"] : []),
    ...(hasPrediction(source) ? ["PRÉDICTION_NE_VAUT_PAS_CAUSALITÉ_NI_PERFORMANCE_DÉMONTRÉE"] : []),
    ...(has(source, /\b(d[ée]pend|cause|responsable)\b/) ? ["CAUSALITÉ_POTENTIELLEMENT_PRÉSUMÉE"] : []),
  ]);
  const unknowns = unique([
    ...input.missingInformation,
    ...input.projectUnknowns.map((item) => item.text),
    ...adaptiveQuestions.filter((item) => item.blocking && !item.answeredValue).map((item) => item.label),
    ...adaptiveQuestions.filter((item) => item.answeredValue === "unknown").map((item) => `Réponse explicitement inconnue : ${item.label}`),
    ...input.knowledge.unresolvedConcepts.map((item) => `Connaissance non résolue : ${item}`),
  ]);
  const alternatives = hypotheses.filter((item) => item.kind !== "PRIMARY").map((item) => item.text);
  const reasoningIssues = unique([
    ...(questions.some((item) => item.scope === "TOO_BROAD") ? ["QUESTION_SCOPE_TOO_BROAD"] : []),
    ...(questions.some((item) => item.scope === "TOO_NARROW") ? ["QUESTION_SCOPE_TOO_NARROW"] : []),
    ...(hypotheses.length > 0 && !objectives.length ? ["HYPOTHESIS_WITHOUT_OBJECTIVE"] : []),
    ...(hypotheses.length > 0 && !mechanisms.length && !isMethodOnlyComparison(input) ? ["HYPOTHESIS_WITHOUT_MECHANISM"] : []),
    ...(objectives.length > 0 && !questions.length ? ["OBJECTIVE_WITHOUT_QUESTION"] : []),
    ...(mechanisms.some((item) => !item.linkedHypothesisIds.length) ? ["ORPHAN_MECHANISM"] : []),
    ...(questions.length > 1 && controls.gateStatuses?.BRANCH_ABANDONMENT !== "APPROVED" ? ["COMPETING_BRANCH_NOT_ARBITRATED"] : []),
  ]);
  const knowledgeRequired = ["UNSUPPORTED", "UNAVAILABLE", "PARTIAL", "CONFLICTING"].includes(input.knowledge.support);
  const knowledgeRequest = knowledgeRequired ? {
    status: input.knowledge.support === "PARTIAL" ? "OPTIONAL" as const : "REQUIRED" as const,
    reason: "Les candidats restent visibles mais ne peuvent pas être présentés comme soutenus par le corpus exécutable courant.",
    unresolvedConcepts: input.knowledge.unresolvedConcepts,
    gapCodes: input.knowledge.gapCodes,
  } : null;
  const graphParts = buildGraph(input, semanticElements, questions, assumptions, hypotheses, objectives, mechanisms, unknowns);
  const handoff = buildHandoff(input, questions, hypotheses, objectives, mechanisms, adaptiveQuestions, controls, refusal, unknowns, alternatives);
  const operationContext = { questions, assumptions, hypotheses, mechanisms, adaptive: adaptiveQuestions, split: questions.length > 1, refusal, knowledgeRequired, handoffReady: handoff.status !== "NOT_READY" };
  const operations = SCIENTIFIC_THINKING_OPERATIONS.map((operation) => ({ operation, ...operationStatus(operation, operationContext) }));
  const gate = (type: HumanGateType, label: string, reason: string, required = true) => ({
    gateId: `ST-G-${type}`, type, label, reason,
    status: required ? controls.gateStatuses?.[type] ?? "PENDING" as const : "NOT_REQUIRED" as const,
    decidedAt: null,
  });
  const humanGates = [
    gate("QUESTION_CONFIRMATION", "Confirmer une question candidate", "Une reformulation candidate ne devient jamais automatiquement la question du projet."),
    gate("HYPOTHESIS_ADOPTION", "Adopter ou rejeter les hypothèses", "Chaque hypothèse reste une proposition réfutable soumise à revue.", hypotheses.length > 0),
    gate("OBJECTIVE_HIERARCHY", "Valider la hiérarchie des objectifs", "Le moteur propose une hiérarchie mais ne décide pas de la priorité scientifique.", objectives.length > 0),
    gate("MAJOR_SCOPE_CHANGE", "Autoriser une modification majeure", "Un changement majeur invalide explicitement les éléments dépendants.", Boolean(controls.changes?.some((item) => item.kind === "MAJOR" && item.status === "PENDING_CONFIRMATION"))),
    gate("BRANCH_ABANDONMENT", "Confirmer l’abandon d’une branche", "Une question ou hypothèse ne disparaît pas silencieusement.", questions.length > 1),
    gate("DESIGN_TRANSITION", "Autoriser le passage à la conception d’étude", "Le handoff transmet uniquement le raisonnement confirmé et ses inconnues."),
  ];
  const outputStatus: ScientificThinkingOutput["status"] = refusal
    ? refusal.code === "NON_TESTABLE" ? "CLARIFICATION_REQUIRED" : "REFUSED"
    : adaptiveQuestions.some((item) => item.blocking && !item.answeredValue) ? "CLARIFICATION_REQUIRED" : "CANDIDATES_PROPOSED";
  const candidateRefs = unique([
    ...questions.map((item) => item.questionId),
    ...hypotheses.map((item) => item.hypothesisId),
    ...objectives.map((item) => item.objectiveId),
    ...mechanisms.map((item) => item.mechanismId),
  ]);
  const knowledgeDependencies: ScientificThinkingOutput["knowledgeDependencies"] = input.knowledge.ownerResultRef
    && input.knowledge.resultId
    && input.knowledge.resultRevision
    && input.knowledge.resultDigest
    ? [{
      owner: "KNOWLEDGE",
      ownershipTransferred: false,
      knowledgeOwnerResultRef: input.knowledge.ownerResultRef,
      knowledgeResultRef: input.knowledge.resultId,
      knowledgeResultRevision: input.knowledge.resultRevision,
      knowledgeResultDigest: input.knowledge.resultDigest,
      candidateRefs,
      assertionRefs: input.knowledge.assertionRefs,
      documentaryStatementRefs: input.knowledge.documentaryStatementRefs,
      evidenceRefs: input.knowledge.evidenceRefs,
      sourceRefs: input.knowledge.sourceIds,
      applicability: input.knowledge.applicability,
      contradictionRefs: input.knowledge.contradictionRefs,
      gapRefs: input.knowledge.gapRefs,
    }]
    : [];
  const sourceProject = input.researchContext.researchProjectId
    && input.researchContext.researchProjectVersion
    && input.researchContext.researchProjectDigest
    && input.researchContext.projectSnapshotDigest
    ? {
      projectId: input.researchContext.researchProjectId,
      projectVersion: input.researchContext.researchProjectVersion,
      projectDigest: input.researchContext.researchProjectDigest,
      snapshotDigest: input.researchContext.projectSnapshotDigest,
    }
    : null;
  const outputId = `scientific-thinking-output:${logicalDigest({ request: input.requestId, candidateRefs, sourceProject })}`;
  const downstreamHandoffs = sourceProject ? buildDownstreamHandoffs({
    sourceOutputRef: outputId,
    sourceProject,
    nativeInput: input,
    questions,
    hypotheses,
    models: scientificModels,
    knowledgeRequired,
  }) : [];
  const epistemicStatus: ScientificThinkingOutput["epistemicStatus"] = questions.some((item) => item.testability === "TESTABLE_CANDIDATE")
    ? "PROPOSAL_ONLY"
    : "INSUFFICIENT_CONTEXT_UNKNOWN_PRESERVED";
  const core = {
    input: input.requestId, status: outputStatus,
    sourceProject,
    originalIdea: input.originalExpression,
    understoodProblem: questions[0]?.text ?? refusal?.reason ?? "Problème scientifique non encore structurable.",
    centralScientificObject: objectLabel(input),
    semanticElements, questions, hypotheses, objectives, mechanisms, scientificModels, assumptions, unknowns, ambiguities,
    selectedQuestionCandidate: questions.find((item) => item.reviewState === "ADOPTED") ?? null,
    contradictions: unique([...input.contradictions, ...input.knowledge.contradictions]), conceptualBiases, reasoningIssues, methodPreferences: input.methodsMentioned, alternatives,
    operations, adaptiveQuestions, humanGates, changes: controls.changes ?? [], refusal, knowledgeRequest,
    graph: { projectionVersion: "RUNTIME_PROJECTION_1.0" as const, ontologyStatus: "NO_NEW_ONTOLOGY" as const, ...graphParts }, handoff, knowledgeDependencies,
    downstreamHandoffs, epistemicStatus,
    projectWriteAuthorized: false as const,
    projectOwnershipTransferred: false as const,
    candidateIsAdopted: false as const,
  };
  const outputDigest = logicalDigest(core);
  const proposedNextAction: ScientificThinkingOutput["proposedNextAction"] = refusal && refusal.code !== "NON_TESTABLE" ? "STOP"
    : adaptiveQuestions.some((item) => item.blocking && !item.answeredValue) ? "CLARIFY"
      : handoff.status === "AUTHORIZED" ? "HANDOFF_TO_RESEARCH_DESIGN"
        : handoff.status === "READY_FOR_HUMAN_AUTHORIZATION" ? "REQUEST_HUMAN_DECISION"
          : knowledgeRequired && !hypotheses.length ? "REQUEST_KNOWLEDGE"
            : "REVIEW_CANDIDATES";
  const traceSeed = logicalDigest({ request: input.requestId, controls });
  const trace: ScientificThinkingTraceEvent[] = [
    { sequence: 1, operation: "CLASSIFY_INPUT", mode: "DETERMINISTIC", decision: `Type sémantique initial : ${baseSemanticType}.`, inputDigest: logicalDigest(source), outputDigest: logicalDigest(semanticElements) },
    { sequence: 2, operation: "REFORMULATE_QUESTION", mode: "DETERMINISTIC", decision: "Construction candidate sans sélection scientifique autonome.", inputDigest: traceSeed, outputDigest: logicalDigest(questions) },
    { sequence: 3, operation: "IDENTIFY_ASSUMPTION", mode: "DETERMINISTIC", decision: "Suppositions et biais conservés comme éléments distincts.", inputDigest: logicalDigest(questions), outputDigest: logicalDigest({ assumptions, conceptualBiases }) },
    { sequence: 4, operation: "PROPOSE_OBJECTIVES", mode: "DETERMINISTIC", decision: "Hypothèses et objectifs proposés uniquement si la question est testable.", inputDigest: logicalDigest(assumptions), outputDigest: logicalDigest({ hypotheses, objectives, mechanisms }) },
    { sequence: 5, operation: "BUILD_GRAPH", mode: "DETERMINISTIC", decision: "Projection runtime du Scientific Reasoning Graph ; aucune ontologie créée.", inputDigest: logicalDigest({ questions, hypotheses, objectives }), outputDigest: logicalDigest(graphParts) },
    { sequence: 6, operation: "REQUEST_HUMAN_DECISION", mode: "HUMAN_REQUIRED", decision: "Les portes de confirmation restent sous contrôle humain.", inputDigest: logicalDigest(humanGates), outputDigest: logicalDigest(humanGates.map((item) => item.status)) },
    { sequence: 7, operation: "ASSESS_HANDOFF", mode: "DETERMINISTIC", decision: `Handoff : ${handoff.status}.`, inputDigest: logicalDigest({ humanGates, unknowns }), outputDigest },
  ];
  const output: ScientificThinkingOutput = {
    contractVersion: SCIENTIFIC_THINKING_ENGINE_VERSION,
    outputId,
    outputDigest,
    sourceProject,
    status: core.status,
    candidateNotice: "ALL_GENERATED_SCIENTIFIC_CONTENT_REQUIRES_HUMAN_REVIEW",
    originalIdea: input.originalExpression,
    understoodProblem: core.understoodProblem,
    centralScientificObject: core.centralScientificObject,
    semanticElements, questions, hypotheses, objectives, mechanisms, scientificModels, assumptions, unknowns, ambiguities,
    selectedQuestionCandidate: core.selectedQuestionCandidate,
    contradictions: core.contradictions, conceptualBiases, reasoningIssues, methodPreferences: input.methodsMentioned, alternatives,
    operations, adaptiveQuestions, humanGates, changes: controls.changes ?? [], refusal, knowledgeRequest,
    proposedNextAction,
    humanDecisionRequired: humanGates.some((item) => item.status === "PENDING"),
    knowledgeDependencies,
    downstreamHandoffs,
    epistemicStatus,
    projectWriteAuthorized: false,
    projectOwnershipTransferred: false,
    candidateIsAdopted: false,
    provenance: {
      engineVersion: SCIENTIFIC_THINKING_ENGINE_VERSION,
      inputRef: input.requestId,
      knowledgeResultRef: input.knowledge.resultId,
      sourceRefs: unique([
        ...(input.knowledge.ownerResultRef ? [input.knowledge.ownerResultRef] : []),
        ...input.knowledge.assertionRefs,
        ...input.knowledge.documentaryStatementRefs,
        ...input.knowledge.evidenceRefs,
        ...input.knowledge.sourceIds,
        ...input.researchContext.previousDecisionIds,
      ]),
      policyRefs: ["RDE-001", "RDE-002", "PD-003", "PD-009", "KE-001"],
      llmContributionStatus: "UPSTREAM_LANGUAGE_INTERPRETATION_CANDIDATE_ONLY",
    },
    graph: core.graph, handoff, trace,
  };
  return parseScientificThinkingOutput(output);
};
