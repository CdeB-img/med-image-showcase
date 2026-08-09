import type { ContextDimensionName, CoverageMapStatus, KnowledgeResult } from "./types";

export type ProjectionDepth = "SYNTHETIC" | "PROFESSIONAL" | "EXPERT";

export type UnderstandProjectionItem = {
  id: string;
  text: string;
  status: string;
  supportIds: string[];
  locator?: string;
  applicability: string;
};

export type UnderstandClarification = {
  id: string;
  dimension: ContextDimensionName;
  question: string;
  reason: string;
  influence: string;
  suggestions: string[];
};

export type UnderstandProjection = {
  title: string;
  coverageLabel: string;
  requestSummary: string;
  answer: string;
  boundedConclusion: string;
  concepts: string[];
  relations: Array<{ label: string; support: string }>;
  supportedItems: UnderstandProjectionItem[];
  methodologicalImplications: string[];
  coverage: Array<{ id: string; label: string; status: string; explanation: string; externalResearchRequired: boolean }>;
  comparison: null | {
    status: string;
    branches: Array<{ id: string; label: string; status: string; explanation: string; documentedPoints: string[] }>;
  };
  clarifications: UnderstandClarification[];
  limitations: string[];
  gaps: string[];
  sources: Array<{ id: string; label: string; locator?: string; contribution: string }>;
  depth: ProjectionDepth;
};

const coverageLabels: Record<CoverageMapStatus, string> = {
  SUPPORTED_COVERAGE: "Couverture étayée",
  PARTIAL_COVERAGE: "Couverture partielle",
  NO_MATCH: "Aucun élément applicable retrouvé",
  INCOMPATIBLE_CONTEXT: "Contexte non compatible",
  NO_PROVIDER: "Aucun corpus interne exact",
  CONFLICTING_COVERAGE: "Positions contradictoires",
  OUT_OF_DOMAIN: "Hors périmètre",
  INSUFFICIENT_EVIDENCE: "Preuves insuffisantes pour comparer",
};

const overallCoverageLabels: Record<KnowledgeResult["coverageStatus"], string> = {
  NO_PROVIDER: "Connaissance interne absente",
  PROVIDER_NOT_APPLICABLE: "Contexte non applicable",
  NO_MATCH: "Aucune correspondance exploitable",
  PARTIAL: "Réponse partielle",
  SUPPORTED: "Réponse étayée",
  CONFLICTING: "Réponse contradictoire",
  SOURCE_UNAVAILABLE: "Source temporairement indisponible",
  COVERAGE_UNKNOWN: "Couverture indéterminée",
};

const applicabilityLabels: Record<string, string> = {
  APPLICABLE_EXACT: "Contexte directement compatible",
  APPLICABLE_WITH_LIMITATIONS: "Applicable avec limites",
  PARTIALLY_APPLICABLE: "Partiellement applicable",
  UNKNOWN_APPLICABILITY: "Applicabilité non démontrée",
  CONTRADICTORY_CONTEXT: "Contexte contradictoire",
  OUT_OF_VALIDITY_DOMAIN: "Hors domaine de validité",
};

const statusLabel = (status: string) => status === "GOVERNED_DOCUMENTARY"
  ? "Élément documentaire gouverné"
  : status === "OFFICIAL_EFFECTIVE"
    ? "Connaissance structurée interne"
    : status === "ASSERTION_CANDIDATE"
      ? "Élément candidat — non retenu comme conclusion"
      : "Élément structuré";

const limitationLabels: Record<string, string> = {
  AUTOMATED_REVIEW_IS_NOT_HUMAN_SCIENTIFIC_REVIEW: "La revue scientifique du corpus est automatisée ; aucune revue humaine globale n’est revendiquée.",
  DOCUMENTARY_SECTIONS_WITHOUT_CONTROLLED_TEXT_REMAIN_UNSTRUCTURED: "Les sections documentaires sans texte contrôlé restent non structurées.",
  FOUR_DECLARED_DOMAINS_ONLY: "Le corpus multidomaine est limité aux quatre domaines qu’il déclare.",
  NARRATIVE_CORPUS: "Le Reasoning Book est un corpus narratif gouverné.",
  NO_PATIENT_LEVEL_INTERPRETATION: "Aucune interprétation de valeur individuelle n’est autorisée.",
  NOT_ATOMIC_ASSERTIONS: "Les passages documentaires ne sont pas des assertions scientifiques atomiques.",
  TECHNICAL_CAPABILITY_NOT_CLINICAL_OUTCOME: "Une capacité technique ne démontre pas automatiquement un bénéfice clinique.",
  UNSTRUCTURED_SECTIONS_DECLARED_NOT_CONVERTED: "Les sections non structurées ne sont pas converties par heuristique.",
  ECV_T1_DOMAIN_ONLY: "Le corpus structuré est limité au domaine ECV/T1.",
  NO_GENERAL_MRI_CT_COMPARISON: "Aucune comparaison générale IRM/CT n’est revendiquée.",
  SCIENTIFIC_ASSERTION_REGISTRY_EMPTY: "La couche générique d’assertions scientifiques est actuellement vide.",
  RELATION_EVIDENCE_MAY_BE_UNKNOWN: "Certaines relations du graphe n’ont pas de preuve scientifique associée.",
  NO_GENERAL_TECHNICAL_ANSWER: "Le graphe n’est pas une source de tutoriel technique général.",
};

const humanize = (value: string) => limitationLabels[value] ?? (/^[A-Z0-9_]+$/.test(value)
  ? `${value.toLocaleLowerCase("fr-FR").replace(/_/g, " ")}.`
  : value);

const contextSummary = (result: KnowledgeResult) => {
  const values = [
    ...result.specificity.pathologies,
    ...result.specificity.populations,
    ...result.specificity.temporalities,
  ];
  return values.length ? ` dans le contexte ${values.join(" · ")}` : "";
};

const fallbackAnswer = (result: KnowledgeResult) => {
  if (result.gaps.some((item) => item.code === "PRIVACY_BLOCKED")) return "NOXIA n’interprète pas une valeur individuelle. La question peut être reformulée en explication méthodologique générale, sans donnée personnelle.";
  if (result.gaps.some((item) => item.code === "OUT_OF_DOMAIN")) return "Cette demande relève d’un support technique général et ne reçoit pas de réponse depuis les corpus scientifiques médicaux de NOXIA.";
  if (result.gaps.some((item) => item.scope === "BIOMARKER_SELECTION")) return "Aucun biomarqueur ne peut être déclaré meilleur sans préciser le phénomène, l’objectif, la population et l’usage qui modifieraient réellement le choix.";
  if (result.coverageStatus === "NO_PROVIDER") return "Aucun corpus interne courant ne couvre exactement cette question. Les objets demandés sont conservés et aucun corpus voisin n’est substitué.";
  if (result.coverageStatus === "NO_MATCH") return "Les corpus internes pertinents ont été inspectés sans correspondance exploitable. Cet arrêt ne décrit pas l’ensemble de la littérature externe.";
  if (result.coverageStatus === "PROVIDER_NOT_APPLICABLE") return "Des éléments internes existent, mais leur applicabilité au contexte demandé n’est pas démontrée ; ils ne sont pas présentés comme réponse.";
  if (result.coverageStatus === "PARTIAL") return "Une partie de la question est documentée. Chaque branche reste visible et la partie absente n’est pas remplacée par une généralisation.";
  if (result.coverageStatus === "CONFLICTING") return "Des positions incompatibles persistent. Elles restent séparées et aucune résolution automatique n’est produite.";
  if (result.coverageStatus === "SOURCE_UNAVAILABLE") return "Une source interne attendue est indisponible. Cette indisponibilité n’est pas transformée en absence de connaissance.";
  return "Les connaissances internes applicables permettent une réponse bornée à la question et à son contexte explicite.";
};

const clarificationFor = (result: KnowledgeResult): UnderstandClarification[] => {
  if (!result.gaps.some((item) => item.code === "MISSING_CRITICAL_CONTEXT")) return [];
  const missing = new Set(result.request.context.dimensions.filter((item) => item.critical && item.state === "UNKNOWN").map((item) => item.name));
  const definitions: Array<[ContextDimensionName, UnderstandClarification]> = [
    ["phenomenon", { id: "clarify-phenomenon", dimension: "phenomenon", question: "Quel phénomène scientifique voulez-vous principalement expliquer ou mesurer ?", reason: "Le même biomarqueur peut représenter des construits différents.", influence: "Cette réponse modifie les connaissances pertinentes et les axes de comparaison.", suggestions: ["Fibrose", "Œdème", "Perfusion", "Je ne sais pas"] }],
    ["pathology", { id: "clarify-pathology", dimension: "pathology", question: "Dans quelle pathologie ou condition situez-vous la question ?", reason: "L’applicabilité d’une mesure dépend de son domaine clinique documenté.", influence: "Cette réponse peut exclure des résultats hors domaine de validité.", suggestions: ["Préciser la pathologie", "Question générale", "Je ne sais pas"] }],
    ["population", { id: "clarify-population", dimension: "population", question: "Quelle population scientifique est concernée ?", reason: "La transférabilité entre populations ne peut pas être présumée.", influence: "Cette réponse modifie l’applicabilité et les limites affichées.", suggestions: ["Adultes", "Population pédiatrique", "Population non définie", "Je ne sais pas"] }],
    ["objective", { id: "clarify-objective", dimension: "objective", question: "Cherchez-vous à comprendre, comparer, quantifier ou suivre ?", reason: "L’objectif détermine le type de relation nécessaire.", influence: "Cette réponse modifie le plan de requête et la restitution.", suggestions: ["Comprendre", "Comparer", "Quantifier", "Je ne sais pas"] }],
    ["usage", { id: "clarify-usage", dimension: "usage", question: "Quel usage scientifique attendez-vous de cette connaissance ?", reason: "Une explication générale et une décision méthodologique n’exigent pas la même couverture.", influence: "Cette réponse modifie le niveau de preuve requis, sans changer les connaissances sources.", suggestions: ["Compréhension", "Conception d’étude", "Analyse méthodologique", "Je ne sais pas"] }],
  ];
  return definitions.filter(([dimension]) => missing.has(dimension)).slice(0, 3).map(([, item]) => item);
};

export const projectUnderstandResult = (result: KnowledgeResult, depth: ProjectionDepth = "PROFESSIONAL"): UnderstandProjection => {
  const itemLimit = depth === "SYNTHETIC" ? 2 : depth === "EXPERT" ? 12 : 6;
  const allItems: UnderstandProjectionItem[] = [
    ...result.applicableAssertions.map((item) => ({
      id: item.revision,
      text: item.text,
      status: statusLabel(item.status),
      supportIds: result.evidence.filter((link) => link.assertionId === item.revision).map((link) => link.sourceId),
      locator: item.locator,
      applicability: applicabilityLabels[item.applicability] ?? humanize(item.applicability),
    })),
    ...result.documentaryStatements.map((item) => ({
      id: item.statementId,
      text: item.text,
      status: statusLabel(item.status),
      supportIds: [item.sourceId],
      locator: item.locator,
      applicability: applicabilityLabels[item.applicability] ?? humanize(item.applicability),
    })),
  ];
  const firstSupported = result.documentaryStatements[0]?.text ?? allItems[0]?.text;
  const requestSummary = `Votre question porte sur ${result.specificity.centralObject}${contextSummary(result)}.`;
  const answer = firstSupported && result.coverageStatus === "SUPPORTED"
    ? `Les connaissances internes applicables documentent notamment : ${firstSupported}`
    : fallbackAnswer(result);
  const coverage = result.coverageMap.items.map((item) => ({
    id: item.coverageId,
    label: item.label,
    status: coverageLabels[item.status],
    explanation: item.explanation,
    externalResearchRequired: item.externalResearchRequired,
  }));
  const comparisonItem = result.coverageMap.items.find((item) => item.branchId === "comparison:direct");
  const branchItems = result.coverageMap.items.filter((item) => item.branchId !== "comparison:direct");
  const comparison = result.request.requestType === "COMPARE" ? {
    status: comparisonItem ? coverageLabels[comparisonItem.status] : "Comparaison non documentée",
    branches: branchItems.map((coverageItem) => ({
      id: coverageItem.branchId,
      label: coverageItem.label,
      status: coverageLabels[coverageItem.status],
      explanation: coverageItem.explanation,
      documentedPoints: allItems.filter((item) => {
        const assertion = result.applicableAssertions.find((candidate) => candidate.revision === item.id);
        if (!assertion || !result.queryPlan.branches.find((branch) => branch.branchId === coverageItem.branchId)?.modality) return false;
        const modality = result.queryPlan.branches.find((branch) => branch.branchId === coverageItem.branchId)?.modality;
        return assertion.modality === modality || (modality === "MRI" && ["MR", "IRM"].some((value) => assertion.modality?.includes(value)));
      }).slice(0, depth === "EXPERT" ? 5 : 2).map((item) => item.text),
    })),
  } : null;
  return {
    title: `Comprendre ${result.specificity.centralObject}`,
    coverageLabel: overallCoverageLabels[result.coverageStatus],
    requestSummary,
    answer,
    boundedConclusion: result.externalEvidence
      ? result.externalEvidence.status === "SOURCE_UNAVAILABLE"
        ? "La réponse interne reste inchangée. La recherche documentaire externe est indisponible et cette panne n’est pas assimilée à une absence scientifique."
        : result.externalEvidence.status === "NO_MATCH"
          ? "La réponse interne reste inchangée. La requête externe bornée n’a retourné aucune correspondance ; elle ne prouve pas l’absence de littérature."
          : "La réponse interne reste la conclusion NOXIA. Les publications externes découvertes sont présentées séparément comme candidates et exigent une revue humaine."
      : result.coverageMap.externalResearchRequired
        ? "La réponse s’arrête aux connaissances internes disponibles. Une recherche externe serait nécessaire pour fermer les zones signalées ; aucune recherche externe n’a été réalisée."
      : "La conclusion reste bornée aux corpus internes, à leurs versions et au contexte affiché.",
    concepts: result.resolvedConcepts.map((item) => item.preferredLabel),
    relations: result.queryPlan.resolvedRelations.map((relation) => ({ label: relation.explanation, support: relation.authority === "PROVIDER" ? "Relation documentée par un corpus interne" : "Distinction gouvernée par le contrat du Knowledge Engine" })),
    supportedItems: allItems.slice(0, itemLimit),
    methodologicalImplications: result.synthesis.methodologicalImplications,
    coverage,
    comparison,
    clarifications: clarificationFor(result),
    limitations: result.limitations.map(humanize).slice(0, depth === "EXPERT" ? 20 : depth === "SYNTHETIC" ? 4 : 10),
    gaps: [...result.ambiguities, ...result.controversies.map((item) => `Controverse conservée — ${item.explanation}`), ...result.gaps.map((item) => item.explanation)],
    sources: result.sources.map((source) => ({
      id: source.sourceId,
      label: `${source.title} — version ${source.revision}`,
      locator: source.locator,
      contribution: result.evidence.some((link) => link.sourceId === source.sourceId) ? "Soutient ou qualifie un élément affiché." : "Source documentaire du bloc affiché.",
    })),
    depth,
  };
};
