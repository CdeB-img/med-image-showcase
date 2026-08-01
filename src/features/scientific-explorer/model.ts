import type {
  ExplorerAssertion,
  ExplorerDisplayItem,
  ExplorerEvidenceLink,
  ExplorerSource,
  ScientificExplorerData,
} from "./types";

export type ExplorerState = {
  conceptKey: string | null;
  metricKey: string | null;
  taskKey: string | null;
  evidenceTypeKey: string | null;
};

export type ExplorerAssertionGroup = {
  established: ExplorerAssertion[];
  qualified: ExplorerAssertion[];
  contested: ExplorerAssertion[];
};

export type ExplorerView = {
  state: ExplorerState;
  assertions: ExplorerAssertion[];
  assertionGroups: ExplorerAssertionGroup;
  evidenceLinks: ExplorerEvidenceLink[];
  mentionLinks: ExplorerEvidenceLink[];
  sources: ExplorerSource[];
  limitations: ExplorerDisplayItem[];
  openQuestions: ExplorerDisplayItem[];
  missingData: ExplorerDisplayItem[];
  relatedConcepts: ScientificExplorerData["concepts"];
  activeFilterLabels: string[];
  isFiltered: boolean;
  hasResults: boolean;
  synthesisLabel: string;
  convergence: string | null;
  confidence: string;
};

export const EMPTY_EXPLORER_STATE: ExplorerState = Object.freeze({
  conceptKey: null,
  metricKey: null,
  taskKey: null,
  evidenceTypeKey: null,
});

const queryFields = ["concept", "metric", "task", "evidence"] as const;

const validValue = (value: string | null, allowed: Set<string>) => value && allowed.has(value) ? value : null;

export const parseExplorerState = (
  search: URLSearchParams,
  data: ScientificExplorerData,
): ExplorerState => ({
  conceptKey: validValue(search.get("concept"), new Set(data.concepts.map((item) => item.key))),
  metricKey: validValue(search.get("metric"), new Set(data.facets.metrics.map((item) => item.key))),
  taskKey: validValue(search.get("task"), new Set(data.facets.tasks.map((item) => item.key))),
  evidenceTypeKey: validValue(search.get("evidence"), new Set(data.facets.evidenceTypes.map((item) => item.key))),
});

export const serializeExplorerState = (state: ExplorerState) => {
  const params = new URLSearchParams();
  const values = {
    concept: state.conceptKey,
    metric: state.metricKey,
    task: state.taskKey,
    evidence: state.evidenceTypeKey,
  };
  for (const field of queryFields) {
    const value = values[field];
    if (value) params.set(field, value);
  }
  return params;
};

const scientificCodeLabels: Record<string, string> = {
  CONSENSUS_RECOMMENDATIONS: "Recommandations de consensus",
  METHOD_ANALYSIS: "Analyse méthodologique",
  METHOD_STUDY: "Étude méthodologique",
  METHOD_VALIDATION: "Validation méthodologique",
  MULTITASK_BENCHMARK: "Benchmark multi-tâches",
  CONTEXT_DEPENDENT_CONVERGENCE: "Convergence dépendante du contexte",
  NO_EXPLICIT_CURRENT_CONSENSUS: "Aucun consensus actuel explicite",
  HIGH: "Élevée",
  MODERATE: "Modérée",
  LOW: "Faible",
  UNKNOWN: "Non renseignée",
  SUPPORTS: "Soutient",
  REFUTES: "Réfute",
  QUALIFIES: "Qualifie",
  DERIVES: "Dérive",
  CORRECTS: "Corrige",
  RETRACTS: "Rétracte",
  MENTIONS: "Mentionne",
  POSITIVE: "Favorable",
  NEGATIVE: "Défavorable",
  QUALIFIED: "Qualifiée",
  HETEROGENEOUS_PROTOCOLS: "Protocoles hétérogènes",
  METRIC_SET_REMAINS_TASK_DEPENDENT: "Le choix des métriques reste dépendant de la tâche",
  PROBABILISTIC_REFERENCE_NOT_ERROR_FREE_TRUTH: "Une référence probabiliste n’est pas une vérité sans erreur",
  SHAPE_INFORMATION_LIMITED: "Information de forme limitée",
  SINGLE_RATER_REFERENCE: "Référence issue d’un seul annotateur",
  SINGLE_TASK_EVIDENCE: "Preuve limitée à une seule tâche",
  SMALL_STRUCTURE_SENSITIVITY: "Sensibilité aux petites structures",
  ZERO_OVERLAP_SPATIAL_INFORMATION_LOST: "Information spatiale perdue en l’absence de recouvrement",
  SCIENTIFIC_HUMAN_REVIEW_NOT_PERFORMED: "Revue scientifique humaine non réalisée",
  TASK_SPECIFIC_METRIC_SELECTION_REMAINS_REQUIRED: "Le choix de métriques propres à la tâche reste nécessaire",
  METHOD_DIFFERENCE: "Différence de méthode",
};

const objectLabels: Record<string, string> = {
  "Benchmark design": "la conception du benchmark",
  "Consensus and performance metrics": "une estimation consensuelle et des métriques de performance",
  "Small structure sensitivity": "la sensibilité aux petites structures",
  "Hierarchy aware aggregation": "une agrégation tenant compte de la hiérarchie",
  "Segmentation properties": "les propriétés de la segmentation",
  "Multiple complementary metrics": "plusieurs métriques complémentaires",
  "Task specific problem fingerprint": "les caractéristiques propres au problème",
  "Single task performance": "la performance sur une seule tâche",
  "Input segmentation performance": "la performance des segmentations d’entrée",
  "Spatial distance at zero overlap": "la distance spatiale en l’absence de recouvrement",
  "Annotation de référence": "une annotation de référence",
};

export const formatScientificCode = (value: string | null | undefined) => {
  if (!value) return "Non renseigné";
  if (scientificCodeLabels[value]) return scientificCodeLabels[value];
  return value
    .replace(/[_-]+/g, " ")
    .toLocaleLowerCase("fr")
    .replace(/^./, (letter) => letter.toLocaleUpperCase("fr"));
};

export const formatDisplayItem = (item: ExplorerDisplayItem) => scientificCodeLabels[item.id] ?? item.label;

export const formatAssertion = (assertion: ExplorerAssertion) => {
  const subject = assertion.subjectLabel;
  const object = assertion.objectLabel ? (objectLabels[assertion.objectLabel] ?? assertion.objectLabel) : "un élément non renseigné";
  const templates: Record<string, string> = {
    SHOULD_BE_ASSESSED_FOR: `${subject} doit être évalué pour ${object}.`,
    IS_QUALIFIED_BY: `${subject} est qualifiée par ${object}.`,
    CAN_BE_CHARACTERIZED_BY: `${subject} peut être caractérisé par ${object}.`,
    HAS_LIMITATION: `${subject} présente comme limite ${object}.`,
    REQUIRES: `${subject} requiert ${object}.`,
    REQUIRES_CONSIDERATION_OF: `${subject} requiert de considérer ${object}.`,
    SHOULD_BE_EVALUATED_WITH: `${subject} doit être évaluée avec ${object}.`,
    REQUIRES_METRIC_SELECTION_FROM: `${subject} requiert un choix de métriques fondé sur ${object}.`,
    IS_NOT_ESTABLISHED_BY: `${subject} n’est pas établie par ${object}.`,
    ESTIMATES: `${subject} estime ${object}.`,
    DOES_NOT_RETAIN: `${subject} ne conserve pas ${object}.`,
  };
  return templates[assertion.predicate] ?? `${subject} — ${formatScientificCode(assertion.predicate)} — ${object}.`;
};

const uniqueItems = (items: ExplorerDisplayItem[]) => [...new Map(items.map((item) => [item.id, item])).values()]
  .sort((left, right) => formatDisplayItem(left).localeCompare(formatDisplayItem(right), "fr"));

const isProofRelation = (relationType: string) => !["MENTIONS", "UNRESOLVED_EVIDENCE_LINK"].includes(relationType);

const classifyAssertions = (
  assertions: ExplorerAssertion[],
  evidenceLinks: ExplorerEvidenceLink[],
): ExplorerAssertionGroup => {
  const linksByAssertion = new Map<string, ExplorerEvidenceLink[]>();
  for (const link of evidenceLinks) linksByAssertion.set(link.assertionId, [...(linksByAssertion.get(link.assertionId) ?? []), link]);
  return assertions.reduce<ExplorerAssertionGroup>((groups, assertion) => {
    const relations = linksByAssertion.get(assertion.id)?.map((link) => link.relationType) ?? [];
    if (assertion.polarity === "NEGATIVE" || relations.includes("REFUTES")) groups.contested.push(assertion);
    else if (assertion.polarity === "QUALIFIED" || relations.includes("QUALIFIES")) groups.qualified.push(assertion);
    else groups.established.push(assertion);
    return groups;
  }, { established: [], qualified: [], contested: [] });
};

const unknownContextCount = (assertions: ExplorerAssertion[], dimension: string) => assertions.filter((assertion) =>
  assertion.contexts.some((context) => context.dimension === dimension && (context.operator === "UNKNOWN" || context.unknown === "UNKNOWN")),
).length;

export const deriveExplorerView = (
  data: ScientificExplorerData,
  state: ExplorerState,
): ExplorerView => {
  const selectedConcept = state.conceptKey ? data.concepts.find((concept) => concept.key === state.conceptKey) ?? null : null;
  const assertions = data.assertions.filter((assertion) => {
    if (selectedConcept && !assertion.conceptIds.includes(selectedConcept.id)) return false;
    if (state.metricKey && !assertion.metricKeys.includes(state.metricKey)) return false;
    if (state.taskKey && !assertion.taskKeys.includes(state.taskKey)) return false;
    if (state.evidenceTypeKey && assertion.evidenceTypeKey !== state.evidenceTypeKey) return false;
    return true;
  });
  const assertionIds = new Set(assertions.map((assertion) => assertion.id));
  const allMatchingEvidence = data.evidenceLinks.filter((link) => assertionIds.has(link.assertionId));
  const evidenceLinks = allMatchingEvidence.filter((link) => isProofRelation(link.relationType));
  const mentionLinks = allMatchingEvidence.filter((link) => !isProofRelation(link.relationType));
  const sourceIds = new Set(evidenceLinks.map((link) => link.sourceId));
  const sources = data.sources.filter((source) => sourceIds.has(source.id));
  const isFiltered = Object.values(state).some(Boolean);
  const applicableSyntheses = data.syntheses.filter((synthesis) => !isFiltered
    || synthesis.assertionIds.some((id) => assertionIds.has(id)));
  const synthesis = applicableSyntheses[0] ?? data.syntheses[0] ?? null;
  const limitations = uniqueItems([
    ...(!isFiltered ? applicableSyntheses.flatMap((item) => item.limitations) : []),
    ...assertions.flatMap((assertion) => assertion.limitations),
    ...evidenceLinks.flatMap((link) => link.limitations),
  ]);
  const openQuestions = assertions.length ? uniqueItems(applicableSyntheses.flatMap((item) => item.openQuestions)) : [];
  const missingData = assertions.length
    ? uniqueItems([
      ...applicableSyntheses.flatMap((item) => item.missingData),
      ...(unknownContextCount(assertions, "manufacturer") ? [{
        id: "MANUFACTURER_NOT_REPORTED_IN_SELECTION",
        label: `Constructeur non renseigné dans ${unknownContextCount(assertions, "manufacturer")}/${assertions.length} assertions applicables`,
      }] : []),
      ...(unknownContextCount(assertions, "software") ? [{
        id: "SOFTWARE_NOT_REPORTED_IN_SELECTION",
        label: `Logiciel non renseigné dans ${unknownContextCount(assertions, "software")}/${assertions.length} assertions applicables`,
      }] : []),
      ...(sources.some((source) => source.abstractOnly) ? [{
        id: "ABSTRACT_ONLY_SOURCE_IN_SELECTION",
        label: "Au moins une source est limitée à son résumé",
      }] : []),
      ...(isFiltered && limitations.length === 0 ? [{
        id: "NO_SPECIFIC_LIMITATION_LOCALIZED_IN_SELECTION",
        label: "Aucune limitation spécifique n’est localisée dans ce sous-ensemble",
      }] : []),
    ])
    : [{
      id: "NO_ASSERTION_FOR_FILTER_COMBINATION",
      label: "Aucune assertion du corpus ne documente cette combinaison de filtres",
    }];
  const relatedConceptIds = new Set(assertions.flatMap((assertion) => assertion.conceptIds));
  if (selectedConcept) relatedConceptIds.delete(selectedConcept.id);
  const relatedConcepts = data.concepts.filter((concept) => relatedConceptIds.has(concept.id));
  const activeFilterLabels = [
    state.taskKey ? data.facets.tasks.find((item) => item.key === state.taskKey)?.label : null,
    state.metricKey ? data.facets.metrics.find((item) => item.key === state.metricKey)?.label : null,
    state.evidenceTypeKey ? formatScientificCode(state.evidenceTypeKey) : null,
    selectedConcept?.label ?? null,
  ].filter((value): value is string => Boolean(value));

  return {
    state,
    assertions,
    assertionGroups: classifyAssertions(assertions, evidenceLinks),
    evidenceLinks,
    mentionLinks,
    sources,
    limitations,
    openQuestions,
    missingData,
    relatedConcepts,
    activeFilterLabels,
    isFiltered,
    hasResults: assertions.length > 0,
    synthesisLabel: isFiltered
      ? `Lecture ciblée — ${activeFilterLabels.join(" · ") || data.selectedDomain.label}`
      : `État général — ${data.selectedDomain.label}`,
    convergence: synthesis?.convergence ?? null,
    confidence: synthesis?.confidence ?? "UNKNOWN",
  };
};

export const sourceHref = (source: ExplorerSource) => source.fullTextUrl ?? source.url ?? (source.doi ? `https://doi.org/${source.doi}` : null);

export const shortAuthors = (source: ExplorerSource) => {
  if (!source.authors.length) return "Auteurs non renseignés";
  if (source.authors.length <= 3) return source.authors.join(", ");
  return `${source.authors.slice(0, 3).join(", ")} et al.`;
};
