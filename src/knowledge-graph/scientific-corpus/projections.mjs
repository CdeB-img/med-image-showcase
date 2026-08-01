import { sha256Digest } from "../migration/stable-json.mjs";
import { PUBLICATION_GUARDS } from "./constants.mjs";
import { queryScientificCorpus } from "./query.mjs";
import { evaluateProjectionReadiness } from "./readiness.mjs";
import { synthesisByKey } from "./synthesis.mjs";

const definitions = [
  { key: "scientific-card-ecv", label: "Scientific card: ECV", synthesisKey: "ecv", query: { concept: "ecv" } },
  { key: "scientific-card-t1-mapping", label: "Scientific card: T1 mapping", synthesisKey: "native-t1-methods", query: { concept: "t1-mapping", modality: "mr" } },
  { key: "method-card-molli", label: "Method card: MOLLI", synthesisKey: "native-t1-methods", query: { concept: "t1-mapping", method: "molli", modality: "mr" } },
  { key: "method-card-sasha", label: "Method card: SASHA", synthesisKey: "native-t1-methods", query: { concept: "t1-mapping", method: "sasha", modality: "mr" } },
  { key: "scientific-card-ct-ecv", label: "Scientific card: CT ECV", synthesisKey: "ct-ecv", query: { concept: "ecv", modality: "ct" } },
  { key: "knowledge-state-ecv", label: "Knowledge state: ECV", synthesisKey: "ecv", query: { concept: "ecv" } },
  { key: "knowledge-state-ecv-myocarditis", label: "Knowledge state: ECV and myocarditis", synthesisKey: "ecv-myocarditis", query: { concept: "ecv", disease: "myocarditis", modality: "mr" } },
  { key: "knowledge-state-ecv-infarction", label: "Knowledge state: ECV and myocardial infarction", synthesisKey: "ecv-myocardial-infarction", query: { concept: "ecv", disease: "myocardial-infarction", modality: "mr" } },
  { key: "comparison-molli-sasha", label: "Documentary comparison: MOLLI and SASHA", synthesisKey: "molli-versus-sasha", query: { concepts: ["molli", "sasha"], modality: "mr" } },
  { key: "comparison-mr-ct-ecv", label: "Documentary comparison: CMR ECV and CT ECV", synthesisKey: "ecv-mr-versus-ct", query: { concept: "ecv", modalities: ["mr", "ct"] } },
  { key: "technical-limitations", label: "Structured technical limitations", synthesisKey: "t1-technical-limitations", query: { concept: "t1-mapping", modality: "mr", limitationsOnly: true } },
  { key: "reproducibility", label: "Structured reproducibility evidence", synthesisKey: "intersite-reproducibility", query: { concept: "reproducibility", modality: "mr" } },
];

const unique = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));

const createProjection = (definition) => {
  const queryResult = queryScientificCorpus(definition.query);
  const synthesis = synthesisByKey[definition.synthesisKey];
  const material = {
    key: definition.key,
    queryDigest: queryResult.deterministicDigest,
    synthesisDigest: synthesis.deterministicDigest,
    guards: PUBLICATION_GUARDS,
  };
  return Object.freeze({
    projectionId: `noxia:radiology:internal-projection:ecv-t1:${definition.key}:${sha256Digest(material)}`,
    key: definition.key,
    label: definition.label,
    projectionType: "INTERNAL_SCIENTIFIC_FIXTURE",
    synthesisKey: definition.synthesisKey,
    deterministicDigest: sha256Digest(material),
    concepts: Object.freeze(unique(queryResult.applicableAssertions.flatMap((assertion) => assertion.facets?.concepts ?? []))),
    definitions: Object.freeze(queryResult.applicableAssertions.filter((assertion) => ["HAS_DOCUMENTED_FORMULA", "BELONGS_TO_SEQUENCE_FAMILY", "REQUIRES_INPUT", "REQUIRES_T1_INPUTS"].includes(assertion.predicate)).map((assertion) => assertion.revisionId)),
    assertions: Object.freeze(queryResult.applicableAssertions.map((assertion) => assertion.revisionId)),
    evidence: Object.freeze(queryResult.evidenceLinks.map((link) => link.evidenceLinkId)),
    sourceRevisionIds: Object.freeze(unique([...queryResult.primarySources, ...queryResult.secondarySources].map((source) => source.revisionId))),
    contexts: Object.freeze(unique(queryResult.applicableAssertions.map((assertion) => assertion.context?.contextId))),
    limitations: Object.freeze(unique([
      ...queryResult.applicableAssertions.flatMap((assertion) => assertion.facets?.limitations ?? []),
      ...queryResult.evidenceLinks.flatMap((link) => link.limitations ?? []),
    ])),
    contradictions: Object.freeze(queryResult.contradictions),
    convergence: synthesis.convergence,
    consensus: synthesis.consensus,
    openQuestions: synthesis.openQuestions,
    history: synthesis.history,
    confidence: synthesis.confidence,
    gaps: Object.freeze(unique([...queryResult.dataAbsent, ...synthesis.missingData, "SCIENTIFIC_HUMAN_REVIEW_NOT_PERFORMED"])),
    structureOnly: true,
    prose: null,
    ...PUBLICATION_GUARDS,
  });
};

export const internalScientificProjections = Object.freeze(definitions.map(createProjection).sort((a, b) => a.key.localeCompare(b.key)));
export const projectionReadiness = Object.freeze(internalScientificProjections.map(evaluateProjectionReadiness).sort((a, b) => a.subjectId.localeCompare(b.subjectId)));

export const projectionSummary = Object.freeze({
  count: internalScientificProjections.length,
  scientificReady: projectionReadiness.filter((item) => item.scientificReady.ready).length,
  synthesisReady: projectionReadiness.filter((item) => item.synthesisReady.ready).length,
  editorialReady: projectionReadiness.filter((item) => item.editorialProjectionReady.ready).length,
  publicReady: projectionReadiness.filter((item) => item.publicPublicationReady.ready).length,
  routed: internalScientificProjections.filter((item) => item.route !== null).length,
  indexable: internalScientificProjections.filter((item) => item.indexable).length,
  inSitemap: internalScientificProjections.filter((item) => item.inSitemap).length,
  rendered: internalScientificProjections.filter((item) => item.rendered).length,
});
