import { logicalDigest, stableStringify } from "@/features/knowledge-engine/canonical";
import { sourceShortReference, type ProjectSource, type ProjectSourceLibrary } from "@/features/knowledge-engine/project-source-library";
import type { ApplicabilityState, RuntimeAssertion } from "@/features/knowledge-engine/types";
import type { ResearchProjectDesignResult } from "@/features/research-project-construction";
import type { DocumentEvidenceParagraph } from "./scientific-document-revision";

export type DocumentNarrativeProjectContext = {
  sourceProjectVersion: string;
  sourceProjectDigest: string;
  question: string;
  framingKind?: "OBJECTIVE";
  population: string[];
  pathologies?: string[];
  modalities?: string[];
  techniques?: string[];
  objectives: string[];
  design: string | null;
  measurements: string[];
};

export type DocumentNarrativeRole =
  | "PROBLEM"
  | "EXISTING_KNOWLEDGE"
  | "METHODS_OR_BIOMARKERS"
  | "LIMITS_OR_DISCORDANCE"
  | "SCIENTIFIC_GAP"
  | "STUDY_JUSTIFICATION"
  | "QUESTION_AND_OBJECTIVES";

export type DocumentNarrativeBlock = {
  blockId: string;
  role: DocumentNarrativeRole;
  text: string;
  assertionRefs: string[];
  sourceRefs: string[];
  basis: "PROJECT" | "KNOWLEDGE_EVIDENCE" | "PROJECT_AND_EVIDENCE_GAP";
};

export type DocumentSourcePriority = {
  sourceId: string;
  role: "PRIMARY_SUPPORT" | "SUPPORTING_EVIDENCE" | "CONTEXTUAL_USER_SOURCE" | "CONTRADICTORY_EVIDENCE";
  applicability: ApplicabilityState | "NOT_USED_FOR_ASSERTION";
  reasons: string[];
  userPreferenceAffectedScientificPriority: false;
};

export type DocumentScientificNarrative = {
  contract: "DOC_SCIENTIFIC_NARRATIVE_V1";
  projectContext: DocumentNarrativeProjectContext;
  blocks: DocumentNarrativeBlock[];
  sourcePriorities: DocumentSourcePriority[];
  contradictoryEvidence: DocumentEvidenceParagraph[];
  depth: "SHORT" | "EXPANDED";
  coverage: DocumentNarrativeRole[];
  contentDigest: string;
};

const unique = <T>(values: T[]) => [...new Set(values)];
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr-FR");
const sentence = (value: string) => {
  const translated = value
    .replace("cardiac motion peut limiter", "Les mouvements cardiaques peuvent limiter")
    .replace("post contrast delay peut limiter", "Le délai après contraste peut limiter")
    .replace("post contrast myocardial t1 ne suffit pas comme substitut autonome de l’ECV DEPENDENT ON CONTRAST DOSE REGION AND SEX IN SELECTED STUDY", "Le T1 myocardique après contraste ne suffit pas comme substitut autonome de l’ECV ; dans l’étude citée, il dépend de la dose de contraste, de la région et du sexe")
    .replace("In suspected myocardial inflammation, a T1-based criterion should be interpreted together with a T2-based criterion when both are available", "En cas de suspicion d’inflammation myocardique, un critère fondé sur le T1 devrait être interprété avec un critère fondé sur le T2 lorsque les deux sont disponibles")
    .replace("For the most accurate CMR ECV measurement, hematocrit should be measured, ideally within 24 hours of imaging", "Pour une mesure plus exacte de l’ECV en IRM cardiaque, l’hématocrite devrait idéalement être mesuré dans les 24 heures entourant l’imagerie")
    .replace("Blood-pool regions used for CMR ECV should avoid papillary muscles and trabeculae in native and post-contrast T1 maps", "Les régions d’intérêt sanguines utilisées pour l’ECV en IRM cardiaque devraient exclure les muscles papillaires et les trabéculations sur les cartes T1 natives et après contraste");
  const trimmed = translated.trim().replace(/[.\s]+$/u, "");
  return trimmed ? trimmed.charAt(0).toLocaleUpperCase("fr-FR") + trimmed.slice(1) : trimmed;
};

const assertionFor = (library: ProjectSourceLibrary, paragraph: DocumentEvidenceParagraph) => library.sources
  .flatMap((source) => source.assertions)
  .find((assertion) => paragraph.assertionRefs.includes(assertion.revision));

const sourceFor = (library: ProjectSourceLibrary, sourceId: string) => library.sources.find((source) => source.source.sourceId === sourceId);

const applicabilityOrder: Record<ApplicabilityState, number> = {
  APPLICABLE_EXACT: 0,
  APPLICABLE_WITH_LIMITATIONS: 1,
  PARTIALLY_APPLICABLE: 2,
  UNKNOWN_APPLICABILITY: 3,
  CONTRADICTORY_CONTEXT: 4,
  OUT_OF_VALIDITY_DOMAIN: 5,
};
const qualityOrder: Record<string, number> = { HIGH: 0, MODERATE: 1, LOW: 2, VERY_LOW: 3 };
const maturityOrder: Record<string, number> = { ESTABLISHED: 0, ESTABLISHED_DOCUMENTARY_KNOWLEDGE: 0, VALIDATED: 1, PRELIMINARY: 2 };

const evidenceOrder = (library: ProjectSourceLibrary, paragraph: DocumentEvidenceParagraph) => {
  const assertion = assertionFor(library, paragraph);
  const links = paragraph.sourceRefs.flatMap((sourceId) => sourceFor(library, sourceId)?.evidence.filter((link) => paragraph.assertionRefs.includes(link.assertionId)) ?? []);
  const relation = links.some((link) => link.relation === "SUPPORTS") ? 0 : links.some((link) => link.relation === "QUALIFIES") ? 1 : 2;
  const quality = assertion?.scientificQualification?.methodologicalQuality ?? "UNKNOWN";
  const maturity = assertion?.scientificQualification?.maturity ?? "UNKNOWN";
  const localizer = links.some((link) => link.locator && link.locator !== "LOCALISATEUR_NON_DOCUMENTE") ? 0 : 1;
  return [applicabilityOrder[assertion?.applicability ?? "UNKNOWN_APPLICABILITY"], relation,
    qualityOrder[quality] ?? 3, maturityOrder[maturity] ?? 3, localizer, paragraph.paragraphId] as const;
};

const compareTuple = (left: readonly (number | string)[], right: readonly (number | string)[]) => {
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    if (left[index] === right[index]) continue;
    return (left[index] ?? "") < (right[index] ?? "") ? -1 : 1;
  }
  return 0;
};

/** KE-001 lexicographic order; user relevance is deliberately absent from the comparator. */
export const prioritizeDocumentEvidence = (library: ProjectSourceLibrary, paragraphs: DocumentEvidenceParagraph[], emphasisSourceRef: string | null = null) => {
  const scientific = [...paragraphs].sort((left, right) => compareTuple(evidenceOrder(library, left), evidenceOrder(library, right)));
  if (!emphasisSourceRef) return scientific;
  const focused = scientific.filter((paragraph) => paragraph.sourceRefs.includes(emphasisSourceRef));
  if (!focused.length) return scientific;
  const primary = scientific[0];
  return unique([...(primary ? [primary] : []), ...focused, ...scientific].map((paragraph) => paragraph.paragraphId))
    .map((id) => scientific.find((paragraph) => paragraph.paragraphId === id)!);
};

const cite = (library: ProjectSourceLibrary, paragraph: DocumentEvidenceParagraph) => paragraph.sourceRefs
  .map((sourceId) => sourceFor(library, sourceId))
  .filter((source): source is ProjectSource => Boolean(source))
  .map(sourceShortReference)
  .join(" ; ");

const renderedClaim = (library: ProjectSourceLibrary, paragraph: DocumentEvidenceParagraph) => `${sentence(paragraph.text)} (${cite(library, paragraph)}).`;
const isLimit = (assertion: RuntimeAssertion | undefined) => assertion?.polarity === "NEGATIVE"
  || assertion?.polarity === "QUALIFIED"
  // Applicability qualifications remain attached to a positive claim, but do
  // not turn every indirect item into a literature limitation.
  || Boolean(assertion?.limitations.length);
const isMethod = (assertion: RuntimeAssertion | undefined) => {
  const searchable = normalize(stableStringify({ text: assertion?.text, atomic: assertion?.atomicContent,
    techniques: assertion?.scientificQualification?.techniques, measurements: assertion?.scientificQualification?.measurements }));
  return /mesur|method|techni|biomarqu|ecv|t1|t2|roi|contraste|hematocrit/.test(searchable);
};

const block = (role: DocumentNarrativeRole, text: string, basis: DocumentNarrativeBlock["basis"], evidence: DocumentEvidenceParagraph[] = []): DocumentNarrativeBlock => ({
  blockId: `document-narrative:${logicalDigest({ role, text, evidence: evidence.map((item) => item.paragraphId) })}`,
  role,
  text,
  assertionRefs: unique(evidence.flatMap((item) => item.assertionRefs)),
  sourceRefs: unique(evidence.flatMap((item) => item.sourceRefs)),
  basis,
});

export const narrativeProjectContext = (project: ResearchProjectDesignResult): DocumentNarrativeProjectContext => {
  const selectedDesign = project.selectedStudyDesignCandidate
    ? project.studyDesignCandidates.find((candidate) => candidate.designId === project.selectedStudyDesignCandidate?.designId)?.label ?? null
    : null;
  const explicitQuestion = project.scientificQuestion.text.trim();
  const adoptedObjectives = project.objectives.filter((objective) => objective.reviewState === "ADOPTED").map((objective) => objective.text);
  // The functional Project adapter intentionally keeps its legacy objectives
  // array empty. When no scientific question exists, consume the canonical
  // OBJECTIVE nodes already transported by its read-only impact graph instead
  // of promoting them inside that compatibility contract.
  const canonicalObjectiveFallback = !explicitQuestion && !adoptedObjectives.length && project.impactGraph.canonicalSource
    ? project.impactGraph.nodes.filter((node) => node.canonicalType === "OBJECTIVE").map((node) => node.label)
    : [];
  const objectives = unique([...adoptedObjectives, ...canonicalObjectiveFallback]);
  const framing = explicitQuestion || objectives[0] || "Le cadre scientifique reste à préciser";
  return {
    sourceProjectVersion: project.candidateVersion.versionId,
    sourceProjectDigest: project.resultDigest,
    question: framing,
    ...(!explicitQuestion && objectives.length ? { framingKind: "OBJECTIVE" as const } : {}),
    population: unique([
      ...project.populationDesign.populationConcept.clinicalContext,
      ...project.populationDesign.populationConcept.questionRequiredCharacteristics,
    ]),
    pathologies: unique(project.populationDesign.populationConcept.conditionOrPathology),
    modalities: unique(project.imagingContribution.acquisitionRefs),
    techniques: unique(project.variables.map((variable) => variable.definition)),
    objectives,
    design: selectedDesign,
    measurements: unique(project.variables.map((variable) => variable.definition)),
  };
};

const words = (values: readonly string[]) => new Set(values.flatMap((value) => normalize(value).split(/[^a-z0-9]+/u)).filter((value) => value.length >= 3));
const overlaps = (left: readonly string[], right: readonly string[]) => {
  const expected = words(left);
  return [...words(right)].some((value) => expected.has(value));
};
const axisReason = (label: string, sourceValues: readonly string[], projectValues: readonly string[]) => {
  if (!projectValues.length) return `${label} du Project non spécifié : aucune compatibilité n’est présumée.`;
  if (!sourceValues.length) return `${label} non documenté par l’assertion : portée indirecte conservée explicitement.`;
  return overlaps(sourceValues, projectValues)
    ? `${label} compatible avec au moins un axe explicite du Project.`
    : `${label} de la source différent de l’axe du Project : preuve indirecte, sans extrapolation silencieuse.`;
};

const directlyAppliesToProject = (assertion: RuntimeAssertion | undefined, project: DocumentNarrativeProjectContext) => {
  if (!assertion || assertion.applicability !== "APPLICABLE_EXACT") return false;
  const qualification = assertion.scientificQualification;
  const axes = [
    [qualification?.populations ?? [], project.population],
    [qualification?.pathologies ?? [], project.pathologies ?? []],
    [assertion.modality ? [assertion.modality] : [], project.modalities ?? []],
    [[...(qualification?.techniques ?? []), ...(qualification?.measurements ?? [])], project.techniques ?? project.measurements],
  ] as const;
  return axes.every(([sourceValues, projectValues]) => !projectValues.length || sourceValues.length > 0 && overlaps(sourceValues, projectValues));
};

const priorityFor = (library: ProjectSourceLibrary, source: ProjectSource, selected: DocumentEvidenceParagraph[], conflicts: DocumentEvidenceParagraph[], primarySourceIds: Set<string>, projectContext: DocumentNarrativeProjectContext): DocumentSourcePriority | null => {
  const relevant = [...selected, ...conflicts].filter((paragraph) => paragraph.sourceRefs.includes(source.source.sourceId));
  if (!relevant.length) return null;
  const assertions = relevant.map((paragraph) => assertionFor(library, paragraph)).filter((item): item is RuntimeAssertion => Boolean(item));
  const best = [...assertions].sort((left, right) => applicabilityOrder[left.applicability] - applicabilityOrder[right.applicability])[0];
  const isConflict = conflicts.some((paragraph) => paragraph.sourceRefs.includes(source.source.sourceId));
  const role: DocumentSourcePriority["role"] = isConflict ? "CONTRADICTORY_EVIDENCE"
    : primarySourceIds.has(source.source.sourceId) ? "PRIMARY_SUPPORT"
      : source.userRelevance === "EXPLICIT_INTEREST" ? "CONTEXTUAL_USER_SOURCE" : "SUPPORTING_EVIDENCE";
  const quality = assertions.map((assertion) => assertion.scientificQualification?.methodologicalQuality).find(Boolean);
  const sourcePathologies = unique(assertions.flatMap((assertion) => assertion.scientificQualification?.pathologies ?? []));
  const sourcePopulations = unique(assertions.flatMap((assertion) => assertion.scientificQualification?.populations ?? []));
  const sourceModalities = unique(assertions.flatMap((assertion) => assertion.modality ? [assertion.modality] : []));
  const sourceTechniques = unique(assertions.flatMap((assertion) => [
    ...(assertion.scientificQualification?.techniques ?? []),
    ...(assertion.scientificQualification?.measurements ?? []),
  ]));
  const reasons = [
    `Applicabilité Knowledge : ${best?.applicability ?? "NOT_USED_FOR_ASSERTION"}.`,
    relevant.some((paragraph) => source.evidence.some((link) => paragraph.assertionRefs.includes(link.assertionId) && link.relation === "SUPPORTS"))
      ? "Au moins un EvidenceLink SUPPORTS relie directement la source à l’assertion utilisée."
      : "La source qualifie ou contextualise une assertion sans devenir une preuve principale par défaut.",
    quality ? `Robustesse méthodologique déjà qualifiée par le corpus : ${quality}.` : "Robustesse méthodologique comparative non attribuée par le corpus.",
    axisReason("Population", sourcePopulations, projectContext.population),
    axisReason("Pathologie ou contexte clinique", sourcePathologies, projectContext.pathologies ?? []),
    axisReason("Modalité", sourceModalities, projectContext.modalities ?? []),
    axisReason("Technique ou mesure", sourceTechniques, projectContext.techniques ?? projectContext.measurements),
    source.publicationType ? `Type documentaire conservé : ${source.publicationType} ; il ne détermine pas seul la priorité.` : "Type documentaire non disponible ; aucune hiérarchie n’est inventée.",
    source.userRelevance === "EXPLICIT_INTEREST"
      ? "Intérêt utilisateur explicite conservé séparément ; il n’a pas modifié la priorité scientifique."
      : "Aucune préférence utilisateur n’intervient dans la priorité scientifique.",
  ];
  return { sourceId: source.source.sourceId, role, applicability: best?.applicability ?? "NOT_USED_FOR_ASSERTION", reasons, userPreferenceAffectedScientificPriority: false };
};

export const buildScientificNarrative = (input: {
  library: ProjectSourceLibrary;
  paragraphs: DocumentEvidenceParagraph[];
  contradictoryEvidence: DocumentEvidenceParagraph[];
  projectContext: DocumentNarrativeProjectContext;
  depth: "SHORT" | "EXPANDED";
  emphasisSourceRef: string | null;
}): DocumentScientificNarrative => {
  const ordered = prioritizeDocumentEvidence(input.library, input.paragraphs, input.emphasisSourceRef);
  const limits = ordered.filter((paragraph) => isLimit(assertionFor(input.library, paragraph)));
  const methods = ordered.filter((paragraph) => isMethod(assertionFor(input.library, paragraph)) && !limits.includes(paragraph));
  const knowledge = ordered.filter((paragraph) => !methods.includes(paragraph) && !limits.includes(paragraph));
  const maxClaims = input.depth === "EXPANDED" ? 5 : 2;
  const selectedKnowledge = knowledge.slice(0, maxClaims);
  const selectedMethods = methods.slice(0, maxClaims);
  const selectedLimits = limits.slice(0, input.depth === "EXPANDED" ? 3 : 1);
  const evidenceSelected = unique([...selectedKnowledge, ...selectedMethods, ...selectedLimits].map((item) => item.paragraphId))
    .map((id) => ordered.find((item) => item.paragraphId === id)!);
  if (!evidenceSelected.length && ordered.length) evidenceSelected.push(ordered[0]!);
  const population = input.projectContext.population.length ? input.projectContext.population.join(" ; ") : "la population définie dans le Research Project";
  const problemDetails = [population, input.projectContext.design].filter(Boolean).join(" ; ");
  const scientificImportance = input.projectContext.objectives.length
    ? input.projectContext.framingKind === "OBJECTIVE"
      ? ""
      : ` Son importance scientifique est définie par l’objectif adopté : ${input.projectContext.objectives[0]}.`
    : "";
  const blocks: DocumentNarrativeBlock[] = [
    block("PROBLEM", input.projectContext.framingKind === "OBJECTIVE"
      ? `Le protocole porte sur l’objectif adopté suivant : « ${input.projectContext.question} ». Le cadre adopté concerne ${problemDetails}.`
      : `Le protocole porte sur la question suivante : « ${input.projectContext.question} ». Le cadre adopté concerne ${problemDetails}.${scientificImportance}`, "PROJECT"),
  ];
  const mainKnowledge = [...selectedKnowledge, ...selectedMethods].slice(0, maxClaims);
  if (mainKnowledge.length) blocks.push(block(mainKnowledge.some((item) => isMethod(assertionFor(input.library, item))) ? "METHODS_OR_BIOMARKERS" : "EXISTING_KNOWLEDGE",
    `Les connaissances mobilisables précisent le cadre scientifique et méthodologique : ${mainKnowledge.map((item) => renderedClaim(input.library, item)).join(" ")}`,
    "KNOWLEDGE_EVIDENCE", mainKnowledge));
  if (selectedLimits.length) blocks.push(block("LIMITS_OR_DISCORDANCE",
    `Ces résultats doivent rester bornés à leur domaine de validité. ${selectedLimits.map((item) => renderedClaim(input.library, item)).join(" ")}`,
    "KNOWLEDGE_EVIDENCE", selectedLimits));
  const conflicts = input.contradictoryEvidence.slice(0, input.depth === "EXPANDED" ? 4 : 2);
  if (conflicts.length) blocks.push(block("LIMITS_OR_DISCORDANCE",
    `Les résultats disponibles ne sont pas entièrement concordants et aucune position n’est arbitrée par le document : ${conflicts.map((item) => renderedClaim(input.library, item)).join(" ")}`,
    "KNOWLEDGE_EVIDENCE", conflicts));
  const exact = evidenceSelected.some((paragraph) => directlyAppliesToProject(assertionFor(input.library, paragraph), input.projectContext));
  const gapText = input.projectContext.framingKind === "OBJECTIVE"
    ? exact
      ? `Le corpus local qualifié documente certains éléments directement applicables, mais ne suffit pas à atteindre l’objectif complet « ${input.projectContext.question} » dans la population ${population}.`
      : `Les preuves mobilisées sont indirectes ou limitées pour la population ${population}. Dans le corpus local qualifié pour ce document, aucune assertion ne couvre directement l’objectif complet « ${input.projectContext.question} ».`
    : exact
      ? `Le corpus local qualifié documente certains éléments directement applicables, mais ne répond pas à lui seul à la question complète « ${input.projectContext.question} » dans la population ${population}.`
      : `Les preuves mobilisées sont indirectes ou limitées pour la population ${population}. Dans le corpus local qualifié pour ce document, aucune assertion ne répond directement à la question complète « ${input.projectContext.question} ».`;
  blocks.push(block("SCIENTIFIC_GAP", `${gapText} Cette limite est conservée comme lacune scientifique et documentaire, sans extrapolation.`, "PROJECT_AND_EVIDENCE_GAP", evidenceSelected));
  blocks.push(block("STUDY_JUSTIFICATION", input.projectContext.framingKind === "OBJECTIVE"
    ? "L’étude est justifiée par la nécessité d’examiner cet objectif dans le cadre défini par le Research Project, tout en distinguant les résultats futurs des connaissances générales citées."
    : "L’étude est justifiée par la nécessité d’examiner cette question dans le cadre défini par le Research Project, tout en distinguant les résultats futurs des connaissances générales citées.", "PROJECT_AND_EVIDENCE_GAP", evidenceSelected));
  const objectives = input.projectContext.objectives.length
    ? ` Les objectifs adoptés sont : ${input.projectContext.objectives.join(" ; ")}.`
    : " Les objectifs détaillés restent à compléter dans le Research Project.";
  blocks.push(block("QUESTION_AND_OBJECTIVES", input.projectContext.framingKind === "OBJECTIVE"
    ? `L’objectif adopté demeure : « ${input.projectContext.question} ». La question scientifique reste à expliciter dans le Research Project.${objectives}`
    : `La question de recherche demeure : « ${input.projectContext.question} ».${objectives}`, "PROJECT"));
  const primarySourceIds = new Set(prioritizeDocumentEvidence(input.library, evidenceSelected).slice(0, 1).flatMap((paragraph) => paragraph.sourceRefs));
  const sourcePriorities = input.library.sources
    .map((source) => priorityFor(input.library, source, evidenceSelected, conflicts, primarySourceIds, input.projectContext))
    .filter((item): item is DocumentSourcePriority => Boolean(item));
  const material = { contract: "DOC_SCIENTIFIC_NARRATIVE_V1" as const, projectContext: input.projectContext, blocks, sourcePriorities,
    contradictoryEvidence: conflicts, depth: input.depth, coverage: unique(blocks.map((item) => item.role)) };
  return { ...material, contentDigest: logicalDigest(material) };
};

export const explainDocumentSourceSelection = (library: ProjectSourceLibrary, narrative: DocumentScientificNarrative | undefined, sourceId: string) => {
  const source = sourceFor(library, sourceId);
  if (!source) return "Cette source n’appartient pas à la bibliothèque du Project.";
  const priority = narrative?.sourcePriorities.find((item) => item.sourceId === sourceId);
  if (!priority) return `${sourceShortReference(source)} reste visible dans la bibliothèque, mais ne soutient aucune affirmation de cette version. Son intérêt utilisateur est conservé sans promotion scientifique.`;
  const role = priority.role === "PRIMARY_SUPPORT" ? "preuve principale pour au moins une affirmation"
    : priority.role === "CONTRADICTORY_EVIDENCE" ? "position divergente conservée sans arbitrage"
      : priority.role === "CONTEXTUAL_USER_SOURCE" ? "source contextuelle mise en avant à votre demande"
        : "preuve de soutien";
  return `${sourceShortReference(source)} est utilisée comme ${role}. ${priority.reasons.join(" ")}`;
};

const comparisonRoleOrder: Record<DocumentSourcePriority["role"], number> = {
  PRIMARY_SUPPORT: 0,
  SUPPORTING_EVIDENCE: 1,
  CONTEXTUAL_USER_SOURCE: 2,
  CONTRADICTORY_EVIDENCE: 3,
};

export const explainDocumentSourceComparison = (
  library: ProjectSourceLibrary,
  narrative: DocumentScientificNarrative | undefined,
  sourceIds: string[],
) => {
  const compared = unique(sourceIds).map((sourceId) => ({
    source: sourceFor(library, sourceId),
    priority: narrative?.sourcePriorities.find((item) => item.sourceId === sourceId),
  })).filter((item): item is { source: ProjectSource; priority: DocumentSourcePriority | undefined } => Boolean(item.source));
  if (compared.length !== 2) return "Deux références exactement sont nécessaires pour expliquer leur priorité relative.";
  const ranked = [...compared].sort((left, right) => {
    const role = (left.priority ? comparisonRoleOrder[left.priority.role] : 4)
      - (right.priority ? comparisonRoleOrder[right.priority.role] : 4);
    if (role) return role;
    return (left.priority ? applicabilityOrder[left.priority.applicability as ApplicabilityState] ?? 6 : 6)
      - (right.priority ? applicabilityOrder[right.priority.applicability as ApplicabilityState] ?? 6 : 6);
  });
  const [preferred, alternative] = ranked;
  const verdict = preferred!.priority && alternative!.priority
    && comparisonRoleOrder[preferred!.priority.role] < comparisonRoleOrder[alternative!.priority.role]
    ? `${sourceShortReference(preferred!.source)} est privilégiée pour les affirmations principales ; ${sourceShortReference(alternative!.source)} conserve le rôle documentaire qualifié ci-dessous.`
    : "Les qualifications disponibles ne justifient pas un départage scientifique supplémentaire entre ces deux références.";
  return `La comparaison suit l’ordre lexicographique KE-001 — applicabilité, relation EvidenceLink, robustesse déjà qualifiée et localisateur — sans score composite. ${verdict}\n\n${compared.map((item) => explainDocumentSourceSelection(library, narrative, item.source.source.sourceId)).join("\n\n")}\n\nLa préférence utilisateur reste séparée de cette priorité scientifique.`;
};
