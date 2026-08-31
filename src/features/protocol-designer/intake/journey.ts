import type {
  ConfidenceLevel,
  QuestionChangeKind,
  RoutingIntent,
  ScientificSessionContext,
  ValidatedScientificIntent,
} from "./types.js";
import { hasExplicitComparisonRequest } from "@/lib/scientific-request-language";

export const ROUTING_INTENT_LABELS: Record<RoutingIntent, string> = {
  UNDERSTAND: "Comprendre une question scientifique",
  FORMALIZE_IDEA: "Transformer une idée en question scientifique",
  DESIGN_STUDY: "Construire un projet de recherche",
  DOCUMENT: "Composer un document de recherche",
};

export const PROJECT_STAGES = [
  "Intention",
  "Objectifs scientifiques",
  "Population",
  "Matériel et méthodes",
  "Imagerie",
  "Statistiques",
  "Budget",
  "Documents",
] as const;

const SCIENTIFIC_TERMS = [
  "obstruction microvasculaire",
  "lésions microvasculaires",
  "atteinte microvasculaire",
  "microcirculation",
  "fibrose myocardique diffuse",
  "fibrose myocardique",
  "maladie de fabry",
  "photon counting",
  "double énergie",
  "dual energy",
  "ct spectral",
  "imagerie spectrale",
  "t1 mapping",
  "molli",
  "sasha",
  "monoénergétique",
  "no-reflow",
  "no reflow",
  "angioplastie",
  "stent",
  "stemi",
  "k-edge",
  "cmro₂",
  "cmro2",
  "oef",
  "ecv",
  "lge",
  "cbf",
  "cbv",
  "tmax",
] as const;

const normalized = (value: string) => value.normalize("NFKC").toLocaleLowerCase("fr-FR");

const EXPLICIT_STUDY_CONSTRUCTION = /(?:^|[^\p{L}\p{N}_])(?:(?:je|nous|on)\s+)?(?:(?:veux|voulons|souhaite|souhaitons|voudrais|voudrions|désire|désirons)\s+)?(?:maintenant\s+)?(?:créer|construire|concevoir|faire|mener|conduire|définir|structurer|planifier|monter|élaborer|mettre\s+en\s+place|construisons|concevons|menons|conduisons|définissons|structurons|planifions|montons|élaborons)\s+(?:(?:une?|l['’])\s+)?(?:[\p{L}\p{N}'’.-]+\s+){0,2}(?:étude|protocole|projet\s+de\s+recherche)(?![\p{L}\p{N}_])/iu;
const EXPLICIT_STUDY_DESIGN = /(?:^|[^\p{L}\p{N}_])(?:étude|protocole|essai|cohorte)\s+(?:multicentrique|monocentrique|randomisée?|prospective?|rétrospective?|exploratoire|pilote)(?![\p{L}\p{N}_])/iu;
const EXPLICIT_STUDY_MODIFICATION = /(?:^|[^\p{L}\p{N}_])(?:modifier|modifie|modifions|changer|change|corriger|corrige|ajouter|ajoute|retirer|retire)\s+(?:[\p{L}\p{N}'’.-]+\s+){0,6}(?:étude|protocole|projet\s+de\s+recherche)(?![\p{L}\p{N}_])/iu;

const EXPLICIT_UNDERSTANDING_REQUEST = /(?:^|[^\p{L}\p{N}_])(?:comprendre|expliquer|fonctionne|différences?|rôle|signifie|qu['’]est-ce)(?![\p{L}\p{N}_])/iu;
const VAGUE_FUTURE_IDEA = /(?:^|[^\p{L}\p{N}_])(?:j['’]aimerais|nous\s+aimerions|je\s+souhaiterais|nous\s+souhaiterions)\s+(?:peut-être\s+)?(?:travailler|explorer|réfléchir)\s+(?:sur|à)(?![\p{L}\p{N}_])/iu;
const PROSPECTIVE_PLANNING = /(?:^|[^\p{L}\p{N}_])(?:je|nous|on)\s+(?:veux|voulons|souhaite|souhaitons|voudrais|voudrions|prévois|prévoyons|compte|comptons|vais|allons)(?![\p{L}\p{N}_])/iu;
const PROSPECTIVE_RESEARCH_ACTION = /(?:^|[^\p{L}\p{N}_])(?:étudier|évaluer|evaluer|mesurer|quantifier|détecter|detecter|suivre|observer|analyser|tester|comparer|recruter|recueillir|collecter)(?![\p{L}\p{N}_])/iu;
const POPULATION_OR_GROUP_EVIDENCE = /(?:^|[^\p{L}\p{N}_])(?:populations?|patients?|participants?|sujets?|groupes?|cohortes?)(?![\p{L}\p{N}_])/iu;
const COMPARISON_OR_ENDPOINT_EVIDENCE = /(?:^|[^\p{L}\p{N}_])(?:comparer|comparaison|versus|objectif|critère|endpoint|devenir|incidence|nombre|taux)(?![\p{L}\p{N}_])/iu;
const METHOD_OR_DATA_COLLECTION_EVIDENCE = /(?:^|[^\p{L}\p{N}_])(?:méthodes?|mesures?|recueillir|collecte|prélèvements?|imagerie|modalités?|données|questionnaires?|suivi|détecter|detecter|examens?)(?![\p{L}\p{N}_])/iu;

const hasProspectiveStructuralStudyEvidence = (value: string) => {
  if (!PROSPECTIVE_PLANNING.test(value) || !PROSPECTIVE_RESEARCH_ACTION.test(value)) return false;
  const structuralSignalCount = [
    POPULATION_OR_GROUP_EVIDENCE,
    COMPARISON_OR_ENDPOINT_EVIDENCE,
    METHOD_OR_DATA_COLLECTION_EVIDENCE,
  ].filter((pattern) => pattern.test(value)).length;
  return structuralSignalCount >= 3 && !EXPLICIT_UNDERSTANDING_REQUEST.test(value);
};

const hasExplicitStudyConstruction = (value: string) => EXPLICIT_STUDY_CONSTRUCTION.test(value)
  || EXPLICIT_STUDY_DESIGN.test(value)
  || EXPLICIT_STUDY_MODIFICATION.test(value);

const fieldValues = (intent: ValidatedScientificIntent, key: keyof ValidatedScientificIntent["interpretation"]) => {
  const field = intent.interpretation[key];
  if (!field || typeof field !== "object" || !("value" in field)) return [];
  const value = field.value;
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : typeof value === "string" ? [value] : [];
};

export const deriveRoutingIntent = (intent: ValidatedScientificIntent): {
  routeIntent: RoutingIntent;
  confidence: ConfidenceLevel;
  reasons: string[];
} => {
  const corpus = normalized(`${intent.originalQuestion} ${intent.validatedReformulation} ${fieldValues(intent, "scientificPurpose").join(" ")}`);
  const scores: Record<RoutingIntent, number> = { UNDERSTAND: 0, FORMALIZE_IDEA: 0, DESIGN_STUDY: 0, DOCUMENT: Number.NEGATIVE_INFINITY };
  const reasons: Record<RoutingIntent, string[]> = { UNDERSTAND: [], FORMALIZE_IDEA: [], DESIGN_STUDY: [], DOCUMENT: [] };
  const add = (route: RoutingIntent, pattern: RegExp, reason: string, weight = 1) => {
    if (pattern.test(corpus)) {
      scores[route] += weight;
      reasons[route].push(reason);
    }
  };
  add("UNDERSTAND", EXPLICIT_UNDERSTANDING_REQUEST, "La demande exprime un besoin de compréhension.", 3);
  add("FORMALIZE_IDEA", /(?:^|[^\p{L}\p{N}_])(?:idée|intuition|hypothèse|je\s+pense|pourrait|dépend)(?![\p{L}\p{N}_])/iu, "La demande formule une idée ou une hypothèse à structurer.", 3);
  add("FORMALIZE_IDEA", /(?:^|[^\p{L}\p{N}_])(?:je\s+voudrais\s+étudier|je\s+cherche\s+à\s+étudier|voir\s+si|est-(?:il|elle)\s+associée?|prédit)(?![\p{L}\p{N}_])/iu, "La demande cherche à transformer une relation ou une finalité encore ouverte en question scientifique.", 3);
  add("FORMALIZE_IDEA", VAGUE_FUTURE_IDEA, "La demande exprime une piste future encore insuffisamment structurée pour construire une étude.", 3);
  add("DESIGN_STUDY", EXPLICIT_STUDY_CONSTRUCTION, "La demande exprime explicitement la construction d’une étude ou d’un protocole.", 5);
  add("DESIGN_STUDY", EXPLICIT_STUDY_DESIGN, "La demande nomme explicitement une structure de design d’étude.", 3);
  add("DESIGN_STUDY", EXPLICIT_STUDY_MODIFICATION, "La demande exprime explicitement une modification d’étude ou de protocole.", 5);
  if (hasProspectiveStructuralStudyEvidence(corpus)) {
    scores.DESIGN_STUDY += 4;
    reasons.DESIGN_STUDY.push("La demande combine une action prospective de recherche avec des éléments de population, de comparaison ou critère, et de méthode ou collecte.");
  }
  add("DESIGN_STUDY", /(?:^|[^\p{L}\p{N}_])(?:reproduire|auditer)(?![\p{L}\p{N}_])/iu, "La demande vise une opération explicite de construction ou d’évaluation d’étude.", 3);
  add("DESIGN_STUDY", /(?:^|[^\p{L}\p{N}_])(?:comparer|mesurer|quantifier|évaluer|evaluer|suivre|détecter|detecter)(?![\p{L}\p{N}_])/iu, "La demande porte une action de recherche à cadrer.", 2);
  if (hasExplicitComparisonRequest(corpus) && !hasExplicitStudyConstruction(corpus) && !/\b(reproduire|auditer)\b/u.test(corpus)) {
    scores.UNDERSTAND += 3;
    reasons.UNDERSTAND.push("La comparaison demande d’abord une compréhension structurée, sans construction de projet explicite.");
  }
  const ordered = (Object.keys(scores) as RoutingIntent[]).sort((a, b) => scores[b] - scores[a]);
  const routeIntent = ordered[0];
  const margin = scores[ordered[0]] - scores[ordered[1]];
  return {
    routeIntent,
    confidence: scores[routeIntent] >= 3 && margin >= 2 ? "HIGH" : scores[routeIntent] >= 2 ? "MEDIUM" : "LOW",
    reasons: reasons[routeIntent].length ? reasons[routeIntent] : ["L’intention reste peu explicite ; NOXIA propose le parcours le plus réversible."],
  };
};

export const preservedScientificTerms = (intent: ValidatedScientificIntent) => {
  const source = `${intent.originalQuestion} ${intent.validatedReformulation}`;
  const corpus = normalized(source);
  const exact = SCIENTIFIC_TERMS.flatMap((term) => {
    const index = corpus.indexOf(normalized(term));
    if (index < 0) return [];
    const match = source.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
    return [{ value: match?.[0] ?? term, index }];
  }).sort((a, b) => a.index - b.index).map((item) => item.value);
  const modalityExpressions = [
    /\bCT(?:\s+cardiaque)?\b/gi,
    /\bIRM(?:\s+cardiaque)?\b/gi,
  ].flatMap((pattern) => [...source.matchAll(pattern)].map((match) => ({ value: match[0], index: match.index ?? Number.MAX_SAFE_INTEGER })));
  const interpreted = [
    ...fieldValues(intent, "phenomenaOfInterest"),
    ...fieldValues(intent, "pathologyOrCondition"),
    ...fieldValues(intent, "scientificDomain"),
  ];
  const orderedExplicit = [...exact.map((value) => ({ value, index: normalized(source).indexOf(normalized(value)) })), ...modalityExpressions]
    .sort((left, right) => left.index - right.index)
    .map((item) => item.value);
  return [...new Set([...orderedExplicit, ...interpreted].map((item) => item.trim()).filter(Boolean))].slice(0, 8);
};

export const centralScientificObject = (intent: ValidatedScientificIntent) => {
  const declaredPhenomena = fieldValues(intent, "phenomenaOfInterest");
  if (declaredPhenomena.length) return declaredPhenomena[0];
  const terms = preservedScientificTerms(intent);
  const exactTerms = terms.filter((term) => SCIENTIFIC_TERMS.some((candidate) => normalized(candidate) === normalized(term)));
  return exactTerms.length > 1 ? `${exactTerms[0]} et ${exactTerms[1]}` : exactTerms[0] ?? terms[0] ?? fieldValues(intent, "phenomenaOfInterest")[0] ?? fieldValues(intent, "scientificDomain")[0] ?? intent.validatedReformulation;
};

export const detectedRelationships = (intent: ValidatedScientificIntent) => {
  const corpus = normalized(`${intent.originalQuestion} ${intent.validatedReformulation}`);
  const relationships: string[] = [];
  if (hasExplicitComparisonRequest(corpus)) relationships.push("comparaison explicitement demandée");
  if (/\b(effet|impact|influence|d[ée]pend|associ[ée])\b/.test(corpus)) relationships.push("relation ou dépendance à examiner");
  if (/\b(apr[èe]s|avant|pendant|suivi|[ée]volution)\b/.test(corpus)) relationships.push("relation temporelle déclarée");
  return relationships;
};

export const buildScientificSessionContext = (
  intent: ValidatedScientificIntent,
  previous?: ScientificSessionContext,
): ScientificSessionContext => {
  const routing = deriveRoutingIntent(intent);
  return {
    routeIntent: routing.routeIntent,
    routeConfidence: routing.confidence,
    routeReasons: routing.reasons,
    centralScientificObject: centralScientificObject(intent),
    preservedScientificTerms: preservedScientificTerms(intent),
    detectedRelationships: detectedRelationships(intent),
    workingHypotheses: previous?.workingHypotheses ?? [],
    missingInformation: [...new Set(intent.interpretation.missingInformation)],
    contextVersion: (previous?.contextVersion ?? 0) + 1,
    transitions: previous?.transitions ?? [],
    currentProjectStage: previous?.currentProjectStage ?? 1,
    activeDesignSurface: previous?.activeDesignSurface ?? "SCIENTIFIC_THINKING",
  };
};

const tokens = (value: string) => new Set(normalized(value).split(/[^\p{L}\p{N}-]+/u).filter((item) => item.length > 3));

export const assessQuestionChange = (previous: string, next: string): {
  kind: QuestionChangeKind;
  affectedElements: string[];
} => {
  if (normalized(previous).trim() === normalized(next).trim()) return { kind: "NONE", affectedElements: [] };
  const before = tokens(previous);
  const after = tokens(next);
  const shared = [...before].filter((item) => after.has(item)).length;
  const overlap = shared / Math.max(1, Math.min(before.size, after.size));
  const family = (value: string) => {
    const text = normalized(value);
    if (/spectral|photon|k-edge|iode|mono[ée]nerg/.test(text)) return "spectral";
    if (/cardia|myocard|t1 mapping|ecv|no-reflow|microvascul/.test(text)) return "cardiac";
    if (/c[ée]r[ée]br|neuro|perfusion|oef|cmro|cbf|cbv|tmax/.test(text)) return "neuro";
    return "unknown";
  };
  const beforeFamily = family(previous);
  const afterFamily = family(next);
  const major = overlap < 0.55 || (beforeFamily !== "unknown" && afterFamily !== "unknown" && beforeFamily !== afterFamily);
  return major
    ? {
      kind: "MAJOR",
      affectedElements: [
        "compréhension et objet scientifique central",
        "orientation vers le corpus local",
        "questions et réponses adaptatives",
        "options scientifiques discutées",
        "décision humaine et rapport",
      ],
    }
    : { kind: "MINOR", affectedElements: ["reformulation et traçabilité de la question"] };
};

export const formalizedQuestionCandidate = (intent: ValidatedScientificIntent, object: string) => {
  const population = fieldValues(intent, "population")[0];
  const purpose = fieldValues(intent, "scientificPurpose")[0];
  const context = fieldValues(intent, "clinicalContext")[0];
  const parts = [
    population ? `Chez ${population}` : "Dans la population à préciser",
    `comment étudier ${object}`,
    purpose ? `pour ${purpose}` : "pour répondre à l’objectif scientifique à confirmer",
    context ? `dans le contexte ${context}` : "dans un contexte d’étude à préciser",
  ];
  return `${parts.join(" ")} ?`;
};
