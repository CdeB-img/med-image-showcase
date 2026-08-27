import { comparableScientificText, logicalDigest, normalizeScientificText, uniqueSorted } from "./canonical";
import type { ConceptResolution, KnowledgeRequest, ResolvedConcept, ResolvedConceptRelation, ScientificObjectRef } from "./types";

type ConceptRule = {
  conceptId: string;
  preferredLabel: string;
  objectType: string;
  patterns: RegExp[];
  kind?: ResolvedConcept["kind"];
  providerConcepts: Record<string, string[]>;
  candidateSenseIds?: string[];
};

const rules: ConceptRule[] = [
  { conceptId: "modality:mri", preferredLabel: "IRM", objectType: "MODALITY", patterns: [/\birm(?:\s+cardiaque)?\b/, /\bmri\b/, /\bcmr\b/], providerConcepts: { "p4r-ecv-t1": ["noxia:radiology:modality:irm"], "p5-multidomain": ["MR"], "rb-004": ["IRM cardiaque"], "rb-005": ["IRM"] } },
  { conceptId: "modality:ct", preferredLabel: "CT", objectType: "MODALITY", patterns: [/\bct(?:\s+cardiaque)?\b/, /scanner/, /tomodensitometr/], providerConcepts: { "p4r-ecv-t1": ["noxia:radiology:modality:ct"], "p5-multidomain": ["CT"], "rb-003": ["CT spectral"], "rb-005": ["CT"] } },
  { conceptId: "modality:pet", preferredLabel: "PET", objectType: "MODALITY", patterns: [/\bpet\b/, /\btep\b/], providerConcepts: { "rb-005": ["PET"] } },
  { conceptId: "phenomenon:myocardial-fibrosis", preferredLabel: "fibrose myocardique", objectType: "PHENOMENON", patterns: [/fibrose myocard/, /myocardial fibrosis/], providerConcepts: { "p4r-ecv-t1": ["noxia:radiology:finding:diffuse-myocardial-fibrosis"], "rb-004": ["caractérisation tissulaire"] } },
  { conceptId: "pathology:fabry-disease", preferredLabel: "maladie de Fabry", objectType: "PATHOLOGY", patterns: [/maladie de fabry/, /fabry disease/], providerConcepts: {} },
  { conceptId: "phenomenon:no-reflow", preferredLabel: "no-reflow", objectType: "PHENOMENON", patterns: [/no[- ]?reflow/], kind: "DOCUMENT_BOUND_CONCEPT", providerConcepts: { "rb-004": ["no-reflow"] } },
  { conceptId: "phenomenon:microvascular-obstruction", preferredLabel: "obstruction microvasculaire", objectType: "PHENOMENON", patterns: [/obstruction microvascul/, /\bmvo\b/], providerConcepts: { "p5-multidomain": ["microvascular-obstruction"], "rb-004": ["obstruction microvasculaire"] } },
  { conceptId: "biomarker:ecv", preferredLabel: "ECV", objectType: "DERIVED_MEASUREMENT", patterns: [/\becv\b/, /volume extracellulaire/, /extracellular volume/], providerConcepts: { "p4r-ecv-t1": ["noxia:radiology:biomarker:ecv", "noxia:radiology:derived-measurement:myocardial-ecv-mr", "noxia:radiology:derived-measurement:myocardial-ecv-ct"], "rb-004": ["ECV"] } },
  { conceptId: "method:t1-mapping", preferredLabel: "T1 mapping", objectType: "MEASUREMENT_METHOD", patterns: [/t1 map{1,2}ing/, /t1 maping/, /cartograph(?:ie|y) t1/], providerConcepts: { "p4r-ecv-t1": ["noxia:radiology:measurement-method:myocardial-t1-mapping", "noxia:radiology:biomarker:t1"], "rb-004": ["T1 mapping"] } },
  { conceptId: "ambiguous:t1", preferredLabel: "T1 (sens à préciser)", objectType: "AMBIGUOUS_CONCEPT", patterns: [/\bt1\b(?!\s*(?:map{1,2}ing|maping|natif))/], kind: "AMBIGUOUS", providerConcepts: {}, candidateSenseIds: ["method:t1-mapping", "measurement:native-t1"] },
  { conceptId: "measurement:native-t1", preferredLabel: "T1 natif", objectType: "OBSERVATION", patterns: [/t1 natif/, /native t1/], providerConcepts: { "p4r-ecv-t1": ["noxia:radiology:observation:native-myocardial-t1"], "rb-004": ["T1 natif"] } },
  { conceptId: "method:synthetic-hematocrit", preferredLabel: "hématocrite synthétique", objectType: "MEASUREMENT_METHOD", patterns: [/hematocrite synthetique/, /synthetic hematocrit/], providerConcepts: { "p4r-ecv-t1": ["noxia:radiology:measurement-method:synthetic-hematocrit"] } },
  { conceptId: "biomarker:t2", preferredLabel: "T2", objectType: "BIOMARKER", patterns: [/\bt2\b/, /t2 mapping/], providerConcepts: { "rb-004": ["T2"] } },
  { conceptId: "biomarker:oef", preferredLabel: "OEF", objectType: "BIOMARKER", patterns: [/\boef\b/, /fraction d'extraction d'oxygene/], providerConcepts: { "rb-005": ["OEF"] } },
  { conceptId: "biomarker:cmro2", preferredLabel: "CMRO₂", objectType: "BIOMARKER", patterns: [/\bcmro2\b/, /\bcmro₂\b/, /metabolisme cerebral de l'oxygene/], providerConcepts: { "rb-005": ["CMRO₂"] } },
  { conceptId: "biomarker:cerebral-perfusion", preferredLabel: "perfusion cérébrale", objectType: "PHYSIOLOGICAL_CONSTRUCT", patterns: [/perfusion cerebr/, /\bcbf\b/, /\bcbv\b/, /\btmax\b/], providerConcepts: { "p5-multidomain": ["cbf", "cbv", "tmax"], "rb-005": ["perfusion cérébrale"] } },
  { conceptId: "technology:spectral-ct", preferredLabel: "CT spectral", objectType: "MODALITY_TECHNOLOGY", patterns: [/ct spectral/, /spectral ct/, /imagerie spectrale/], providerConcepts: { "p5-multidomain": ["spectral-ct"], "rb-003": ["CT spectral"] } },
  { conceptId: "technology:dual-energy-ct", preferredLabel: "Dual Energy CT", objectType: "MODALITY_TECHNOLOGY", patterns: [/dual energy/, /double energie/], providerConcepts: { "p5-multidomain": ["dual-energy-ct"], "rb-003": ["Dual Energy"] } },
  { conceptId: "technology:photon-counting-ct", preferredLabel: "Photon Counting CT", objectType: "DETECTOR_TECHNOLOGY", patterns: [/photon counting/, /comptage photon/], providerConcepts: { "p5-multidomain": ["photon-counting-ct"], "rb-003": ["Photon Counting CT"] } },
  { conceptId: "method:fourier-transform", preferredLabel: "transformée de Fourier", objectType: "MATHEMATICAL_METHOD", patterns: [/fourier/], providerConcepts: {} },
  { conceptId: "tool:numpy", preferredLabel: "NumPy", objectType: "SOFTWARE_TOOL", patterns: [/\bnumpy\b/], providerConcepts: { "knowledge-graph": ["noxia:radiology:tool:numpy"] } },
  { conceptId: "format:dicom", preferredLabel: "DICOM", objectType: "FORMAT", patterns: [/\bdicom\b/], providerConcepts: { "knowledge-graph": ["noxia:radiology:format:dicom", "noxia:radiology:standard:dicom"] } },
  { conceptId: "object:biomarker", preferredLabel: "biomarqueur", objectType: "GENERIC_SCIENTIFIC_OBJECT", patterns: [/biomarqueur/, /biomarker/], providerConcepts: {} },
  { conceptId: "intervention:stenting", preferredLabel: "stenting", objectType: "INTERVENTION", patterns: [/stent/, /stenting/, /angioplast/], providerConcepts: {} },
  { conceptId: "context:reperfusion", preferredLabel: "reperfusion", objectType: "TEMPORAL_CONTEXT", patterns: [/reperfusion/, /post[- ]?stent/, /apres (?:un |le )?(?:stent|stenting|angioplast)/], providerConcepts: { "p5-multidomain": ["microvascular-obstruction"] } },
];

const matchRule = (rule: ConceptRule, text: string) => rule.patterns.some((pattern) => pattern.test(text));

export const resolveGovernedConceptsFromProviderReferences = (
  references: Array<{ providerId: string; conceptIds: string[] }>,
): ResolvedConcept[] => rules.filter((rule) => references.some((reference) => {
  const governedIds = rule.providerConcepts[reference.providerId] ?? [];
  return reference.conceptIds.includes(rule.conceptId) || governedIds.some((id) => reference.conceptIds.includes(id));
})).map((rule) => ({
  conceptId: rule.conceptId,
  preferredLabel: rule.preferredLabel,
  originalTerms: [],
  kind: "DOCUMENT_BOUND_CONCEPT",
  objectType: rule.objectType,
  providerConcepts: rule.providerConcepts,
}));

export const extractScientificObjectTerms = (question: string): Array<{ term: string; role: ScientificObjectRef["role"] }> => {
  const normalized = comparableScientificText(question);
  const matches = rules.flatMap((rule) => {
    const matching = rule.patterns.map((pattern) => ({ pattern, match: pattern.exec(normalized) })).filter((item) => item.match) as Array<{ pattern: RegExp; match: RegExpExecArray }>;
    if (!matching.length) return [];
    const earliest = matching.sort((left, right) => left.match.index - right.match.index)[0];
    return [{ term: earliest.match[0], index: earliest.match.index, conceptId: rule.conceptId }];
  }).sort((left, right) => left.index - right.index);
  const unique = matches.filter((item, index, list) => list.findIndex((candidate) => candidate.conceptId === item.conceptId) === index);
  const terms = unique.map((item, index) => ({ term: item.term, role: index === 0 ? "SUBJECT" as const : index === 1 && /\b(vs\.?|versus|compar|difference|différence)\b/.test(normalized) ? "COMPARATOR" as const : "CONTEXT" as const }));
  const uncoveredPathology = normalized.match(/\bmaladie\s+(?:non\s+couverte\s+)?[\p{L}-]+/u)?.[0];
  if (uncoveredPathology && !terms.some((item) => item.term.includes(uncoveredPathology))) terms.push({ term: uncoveredPathology, role: "CONTEXT" });
  return terms;
};

export const resolveConcepts = (request: KnowledgeRequest): ConceptResolution => {
  const searchable = comparableScientificText(`${request.originalQuestion} ${request.scientificObjects.map((item) => item.originalTerm).join(" ")}`);
  const concepts = rules.filter((rule) => matchRule(rule, searchable)).map<ResolvedConcept>((rule) => {
    const candidateSenses = (rule.candidateSenseIds ?? []).map((candidateId) => rules.find((candidate) => candidate.conceptId === candidateId)).filter((candidate): candidate is ConceptRule => Boolean(candidate)).map((candidate) => ({
      conceptId: candidate.conceptId,
      preferredLabel: candidate.preferredLabel,
      objectType: candidate.objectType,
      providerConcepts: candidate.providerConcepts,
    }));
    return {
      conceptId: rule.conceptId,
      preferredLabel: rule.preferredLabel,
      originalTerms: uniqueSorted(request.scientificObjects.map((item) => normalizeScientificText(item.originalTerm)).filter((term) => rule.patterns.some((pattern) => pattern.test(comparableScientificText(term))))),
      kind: rule.kind ?? "EXACT",
      objectType: rule.objectType,
      providerConcepts: rule.providerConcepts,
      ...(candidateSenses.length ? { candidateSenses } : {}),
    };
  });

  const noReflow = concepts.find((item) => item.conceptId === "phenomenon:no-reflow");
  if (noReflow && !concepts.some((item) => item.conceptId === "phenomenon:microvascular-obstruction")) {
    const rule = rules.find((item) => item.conceptId === "phenomenon:microvascular-obstruction")!;
    concepts.push({ conceptId: rule.conceptId, preferredLabel: rule.preferredLabel, originalTerms: [], kind: "DOCUMENT_BOUND_CONCEPT", objectType: rule.objectType, providerConcepts: rule.providerConcepts });
  }

  const relations: ResolvedConceptRelation[] = [];
  const has = (id: string) => concepts.some((item) => item.conceptId === id);
  if (has("phenomenon:no-reflow") && has("phenomenon:microvascular-obstruction")) relations.push({ sourceConceptId: "phenomenon:no-reflow", targetConceptId: "phenomenon:microvascular-obstruction", relation: "CONTEXT_DEPENDENT_RELATION", authority: "KE-001", explanation: "Relation contextuelle dans l’infarctus et la reperfusion ; jamais synonymie universelle." });
  if (has("method:t1-mapping") && has("biomarker:ecv")) relations.push({ sourceConceptId: "method:t1-mapping", targetConceptId: "biomarker:ecv", relation: "NOT_EQUIVALENT", authority: "KE-001", explanation: "Une méthode de mapping T1 et une estimation dérivée d’ECV sont des objets distincts." });
  if (has("modality:ct") && has("technology:spectral-ct")) relations.push({ sourceConceptId: "modality:ct", targetConceptId: "technology:spectral-ct", relation: "BROADER_THAN", authority: "KE-001", explanation: "Le CT est plus large que le sous-domaine CT spectral." });

  const unresolvedTerms = request.scientificObjects.map((item) => normalizeScientificText(item.originalTerm)).filter((term) => term !== "UNKNOWN_SCIENTIFIC_OBJECT" && !rules.some((rule) => rule.patterns.some((pattern) => pattern.test(comparableScientificText(term)))));
  if (!concepts.length) concepts.push({ conceptId: `unknown:${logicalDigest(request.originalQuestion)}`, preferredLabel: "concept non résolu", originalTerms: request.scientificObjects.map((item) => item.originalTerm), kind: "UNKNOWN", objectType: "UNKNOWN", providerConcepts: {} });
  const material = { concepts, relations, unresolvedTerms: uniqueSorted(unresolvedTerms), ambiguities: concepts.filter((item) => item.kind === "AMBIGUOUS").map((item) => `${item.preferredLabel} doit être désambiguïsé avant sélection d’un corpus.`) };
  return { ...material, digest: logicalDigest(material) };
};
