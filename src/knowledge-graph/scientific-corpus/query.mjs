import { sha256Digest } from "../migration/stable-json.mjs";
import { conceptBySlug, historicalConceptIds } from "./concepts.mjs";
import { scientificAssertionRevisions, scientificEvidenceLinks } from "./assertions.mjs";
import { scientificSourceRevisions } from "./sources.mjs";

const aliasGroups = Object.freeze({
  ecv: [historicalConceptIds.ecvBiomarker, conceptBySlug["myocardial-ecv-mr"], conceptBySlug["myocardial-ecv-ct"]],
  "ecv-mr": [conceptBySlug["myocardial-ecv-mr"]],
  "ecv-ct": [conceptBySlug["myocardial-ecv-ct"]],
  t1: [historicalConceptIds.t1Biomarker, conceptBySlug["native-myocardial-t1"], conceptBySlug["post-contrast-myocardial-t1"]],
  "t1-mapping": [historicalConceptIds.t1MappingSequence, conceptBySlug["myocardial-t1-mapping"]],
  molli: [conceptBySlug.molli],
  shmolli: [conceptBySlug.shmolli],
  sasha: [conceptBySlug.sasha],
  myocarditis: [conceptBySlug["acute-myocarditis"]],
  infarction: [conceptBySlug["acute-myocardial-infarction"]],
  "myocardial-infarction": [conceptBySlug["acute-myocardial-infarction"]],
  amyloidosis: [conceptBySlug["systemic-al-amyloidosis"]],
  reproducibility: [conceptBySlug.reproducibility, conceptBySlug["intersite-reproducibility"], conceptBySlug["interscanner-reproducibility"], conceptBySlug["interreader-reproducibility"]],
  repeatability: [conceptBySlug.repeatability],
  limitations: [],
});

const modalityAliases = Object.freeze({ mr: historicalConceptIds.mr, mri: historicalConceptIds.mr, irm: historicalConceptIds.mr, cmr: historicalConceptIds.mr, ct: historicalConceptIds.ct });
const fieldAliases = Object.freeze({ "1.5t": conceptBySlug["field-strength-1-5-t"], "1,5t": conceptBySlug["field-strength-1-5-t"], "1.5 t": conceptBySlug["field-strength-1-5-t"], "3t": conceptBySlug["field-strength-3-t"], "3 t": conceptBySlug["field-strength-3-t"] });
const sourceByRevisionId = new Map(scientificSourceRevisions.map((source) => [source.revisionId, source]));
const evidenceByAssertion = new Map();
for (const link of scientificEvidenceLinks) evidenceByAssertion.set(link.assertionRevisionId, [...(evidenceByAssertion.get(link.assertionRevisionId) ?? []), link]);

const array = (value) => value === undefined || value === null ? [] : Array.isArray(value) ? value : [value];
const lower = (value) => String(value).trim().toLowerCase();
const unique = (values) => [...new Set(values)].sort((a, b) => String(a).localeCompare(String(b)));
const resolveGroup = (value) => aliasGroups[lower(value)] ?? [conceptBySlug[lower(value)] ?? value];
const resolveModality = (value) => modalityAliases[lower(value)] ?? value;
const resolveField = (value) => fieldAliases[lower(value)] ?? value;

const normalize = (query = {}) => Object.freeze({
  concepts: array(query.concepts ?? query.concept).map(resolveGroup),
  modalities: array(query.modalities ?? query.modality).map(resolveModality),
  diseases: array(query.diseases ?? query.disease).map(resolveGroup),
  methods: array(query.methods ?? query.method).map(resolveGroup),
  sequences: array(query.sequences ?? query.sequence).map(resolveGroup),
  fieldStrengths: array(query.fieldStrengths ?? query.fieldStrength).map(resolveField),
  manufacturers: array(query.manufacturers ?? query.manufacturer),
  equipmentModels: array(query.equipmentModels ?? query.model),
  softwareVersions: array(query.softwareVersions ?? query.software),
  populations: array(query.populations ?? query.population),
  sourceTypes: array(query.sourceTypes ?? query.sourceType),
  evidenceQualities: array(query.evidenceQualities ?? query.evidenceQuality),
  scientificMaturities: array(query.scientificMaturities ?? query.scientificMaturity),
  polarities: array(query.polarities ?? query.polarity),
  documentStatuses: array(query.documentStatuses ?? query.documentStatus),
  predicates: array(query.predicates ?? query.predicate),
  publicationFrom: query.publicationFrom ?? query.yearFrom ?? null,
  publicationTo: query.publicationTo ?? query.yearTo ?? null,
  limitationsOnly: Boolean(query.limitationsOnly || lower(query.concept ?? "") === "limitations"),
  reviewStates: array(query.reviewStates ?? query.reviewState),
  humanReviewedOnly: Boolean(query.humanReviewedOnly),
  includeLifecycle: Boolean(query.includeLifecycle),
});

const allFacetValues = (assertion) => unique([
  assertion.subjectEntityId,
  assertion.objectEntityId,
  ...Object.values(assertion.facets ?? {}).flatMap((value) => array(value)),
].filter((value) => typeof value === "string"));

const matchesEveryGroup = (values, groups) => groups.every((group) => group.some((candidate) => values.includes(candidate)));
const contextValues = (assertion, dimension) => assertion.context?.dimensions?.filter((item) => item.dimension === dimension).flatMap((item) => item.operator === "EXACT" ? [item.value] : item.values ?? []) ?? [];

const sourceFiltered = (assertion, query) => {
  const links = evidenceByAssertion.get(assertion.revisionId) ?? [];
  const sources = links.map((link) => sourceByRevisionId.get(link.sourceRevisionId)).filter(Boolean);
  if (query.sourceTypes.length && !sources.some((source) => query.sourceTypes.includes(source.metadata.evidenceSourceType) || query.sourceTypes.includes(source.sourceType))) return false;
  if (query.evidenceQualities.length && !links.some((link) => query.evidenceQualities.includes(link.evidenceQuality))) return false;
  if (query.documentStatuses.length && !sources.some((source) => query.documentStatuses.includes(source.metadata.documentStatus))) return false;
  if (query.publicationFrom !== null && !sources.some((source) => Number(source.publicationDate?.slice(0, 4)) >= Number(query.publicationFrom))) return false;
  if (query.publicationTo !== null && !sources.some((source) => Number(source.publicationDate?.slice(0, 4)) <= Number(query.publicationTo))) return false;
  return true;
};

const matches = (assertion, query, { conceptOnly = false } = {}) => {
  if (!query.includeLifecycle && assertion.facets?.lifecycleOnly) return false;
  const values = allFacetValues(assertion);
  if (!matchesEveryGroup(values, query.concepts)) return false;
  if (conceptOnly) return true;
  if (!matchesEveryGroup(array(assertion.facets?.modalities), query.modalities.map((item) => [item]))) return false;
  if (!matchesEveryGroup(array(assertion.facets?.diseases), query.diseases)) return false;
  if (!matchesEveryGroup(array(assertion.facets?.methods), query.methods)) return false;
  if (!matchesEveryGroup(array(assertion.facets?.sequences), query.sequences)) return false;
  if (!matchesEveryGroup(array(assertion.facets?.fieldStrengths), query.fieldStrengths.map((item) => [item]))) return false;
  if (!matchesEveryGroup(array(assertion.facets?.populations), query.populations.map((item) => [item]))) return false;
  if (!matchesEveryGroup(contextValues(assertion, "manufacturer"), query.manufacturers.map((item) => [item]))) return false;
  if (!matchesEveryGroup(contextValues(assertion, "equipmentModel"), query.equipmentModels.map((item) => [item]))) return false;
  if (!matchesEveryGroup(contextValues(assertion, "softwareVersion"), query.softwareVersions.map((item) => [item]))) return false;
  if (query.scientificMaturities.length && !query.scientificMaturities.includes(assertion.scientificMaturity)) return false;
  if (query.polarities.length && !query.polarities.includes(assertion.polarity)) return false;
  if (query.predicates.length && !query.predicates.includes(assertion.predicate)) return false;
  if (query.reviewStates.length && !query.reviewStates.includes(assertion.reviewState)) return false;
  if (query.humanReviewedOnly && !assertion.humanReviewed) return false;
  if (query.limitationsOnly && array(assertion.facets?.limitations).length === 0 && assertion.polarity !== "NEGATIVE" && assertion.evidenceQuality !== "LOW") return false;
  return sourceFiltered(assertion, query);
};

const primaryEvidenceTypes = new Set(["PROSPECTIVE_STUDY", "MULTICENTER_STUDY", "OBSERVATIONAL_STUDY", "RANDOMIZED_TRIAL"]);

export const queryScientificCorpus = (input = {}) => {
  const query = normalize(input);
  const conceptCandidates = scientificAssertionRevisions.filter((assertion) => matches(assertion, query, { conceptOnly: true }));
  const applicableAssertions = conceptCandidates.filter((assertion) => matches(assertion, query)).sort((a, b) => a.revisionId.localeCompare(b.revisionId));
  const applicableIds = new Set(applicableAssertions.map((assertion) => assertion.revisionId));
  const outOfContextAssertions = conceptCandidates.filter((assertion) => !applicableIds.has(assertion.revisionId)).sort((a, b) => a.revisionId.localeCompare(b.revisionId));
  const evidenceLinks = scientificEvidenceLinks.filter((link) => applicableIds.has(link.assertionRevisionId)).sort((a, b) => a.evidenceLinkId.localeCompare(b.evidenceLinkId));
  const sourceIds = unique(evidenceLinks.map((link) => link.sourceRevisionId));
  const sources = sourceIds.map((id) => sourceByRevisionId.get(id)).filter(Boolean);
  const contradictions = applicableAssertions.flatMap((assertion) => {
    const links = evidenceLinks.filter((link) => link.assertionRevisionId === assertion.revisionId);
    const supporting = links.filter((link) => link.relationType === "SUPPORTS");
    const refuting = links.filter((link) => link.relationType === "REFUTES");
    return supporting.length && refuting.length ? [{ assertionRevisionId: assertion.revisionId, supportingEvidenceLinkIds: supporting.map((item) => item.evidenceLinkId), refutingEvidenceLinkIds: refuting.map((item) => item.evidenceLinkId), resolution: "UNRESOLVED_CONTEXT_DEPENDENT" }] : [];
  });
  const requestedContext = [
    ["manufacturer", query.manufacturers], ["equipmentModel", query.equipmentModels], ["softwareVersion", query.softwareVersions],
  ];
  const missingData = [
    ...(applicableAssertions.length === 0 ? ["NO_APPLICABLE_ASSERTION"] : []),
    ...(query.humanReviewedOnly && applicableAssertions.length === 0 ? ["NO_SCIENTIFIC_HUMAN_REVIEW"] : []),
    ...requestedContext.filter(([dimension, values]) => values.length && !conceptCandidates.some((assertion) => contextValues(assertion, dimension).length)).map(([dimension]) => `NO_REPORTED_CONTEXT:${dimension}`),
    ...(input.requireSourceLocator && evidenceLinks.some((link) => !link.locator) ? ["SOURCE_LOCATOR_MISSING"] : []),
  ];
  const present = Object.freeze({
    assertionCount: applicableAssertions.length,
    evidenceLinkCount: evidenceLinks.length,
    sourceCount: sources.length,
    contextCount: unique(applicableAssertions.map((assertion) => assertion.context?.contextId).filter(Boolean)).length,
  });
  const resultMaterial = { query, assertionRevisionIds: applicableAssertions.map((item) => item.revisionId), evidenceLinkIds: evidenceLinks.map((item) => item.evidenceLinkId), sourceRevisionIds: sourceIds, missingData };
  return Object.freeze({
    queryId: `noxia:radiology:scientific-query:ecv-t1:${sha256Digest(resultMaterial)}`,
    query,
    dataPresent: present,
    dataAbsent: Object.freeze(unique(missingData)),
    applicableAssertions: Object.freeze(applicableAssertions),
    outOfContextAssertions: Object.freeze(outOfContextAssertions),
    contradictions: Object.freeze(contradictions),
    evidenceLinks: Object.freeze(evidenceLinks),
    primarySources: Object.freeze(sources.filter((source) => primaryEvidenceTypes.has(source.metadata.evidenceSourceType)).sort((a, b) => a.revisionId.localeCompare(b.revisionId))),
    secondarySources: Object.freeze(sources.filter((source) => !primaryEvidenceTypes.has(source.metadata.evidenceSourceType)).sort((a, b) => a.revisionId.localeCompare(b.revisionId))),
    unresolvedElements: Object.freeze(unique([...missingData, ...contradictions.map((item) => `CONTRADICTION:${item.assertionRevisionId}`)])),
    deterministicDigest: sha256Digest(resultMaterial),
    statisticalMetaAnalysisPerformed: false,
    approximationUsed: false,
    generatedEditorialText: false,
  });
};

export const competencyQueries = Object.freeze({
  ecvGeneral: { concept: "ecv" },
  ecvMr: { concept: "ecv", modality: "mr" },
  ecvCt: { concept: "ecv", modality: "ct" },
  ecvMyocarditis: { concept: "ecv", disease: "myocarditis", modality: "mr" },
  ecvInfarction: { concept: "ecv", disease: "myocardial-infarction", modality: "mr" },
  molli: { concept: "t1-mapping", method: "molli", modality: "mr" },
  sasha: { concept: "t1-mapping", method: "sasha", modality: "mr" },
  molliSasha: { concepts: ["molli", "sasha"], modality: "mr" },
  ecv15T: { concept: "ecv", fieldStrength: "1.5 T", modality: "mr" },
  ecv3T: { concept: "ecv", fieldStrength: "3 T", modality: "mr" },
  limitations: { concept: "ecv", limitationsOnly: true },
  reproducibility: { concept: "reproducibility", modality: "mr" },
  ctReproducibility: { concepts: ["ecv", "reproducibility"], modality: "ct" },
  consensus: { concept: "ecv", sourceType: "CONSENSUS" },
  contradictions: { concept: "synthetic-hematocrit" },
});

export const executeCompetencyQueries = () => Object.freeze(Object.fromEntries(Object.entries(competencyQueries).map(([key, query]) => [key, queryScientificCorpus(query)])));
