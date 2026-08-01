import { sha256Digest } from "../migration/stable-json.mjs";
import { multidomainAssertionRevisions, multidomainAssertionReviewDecisions, multidomainEvidenceLinks } from "./assertions.mjs";
import { multidomainContradictionAssessments } from "./contradictions.mjs";
import { multidomainSourceRevisions } from "./sources.mjs";

const sourceByRevisionId = new Map(multidomainSourceRevisions.map((source) => [source.revisionId, source]));
const reviewByAssertionId = new Map(multidomainAssertionReviewDecisions.map((decision) => [decision.assertionRevisionId, decision]));
const normalize = (value) => String(value ?? "").trim().toLowerCase();
const includes = (values, expected) => !expected || values.some((value) => normalize(value).includes(normalize(expected)));
const unique = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));

const filters = Object.freeze([
  ["domainId", (assertion, value) => normalize(assertion.domainId) === normalize(value)],
  ["concept", (assertion, value) => includes(assertion.facets.concepts, value) || normalize(assertion.subjectEntityId?.split(":").at(-1)).includes(normalize(value)) || normalize(assertion.objectEntityId?.split(":").at(-1)).includes(normalize(value))],
  ["modality", (assertion, value) => includes(assertion.facets.modalities, value)],
  ["pathology", (assertion, value) => includes(assertion.facets.pathologies, value)],
  ["technique", (assertion, value) => includes(assertion.facets.techniques, value)],
  ["measurement", (assertion, value) => includes(assertion.facets.measurements, value)],
  ["finding", (assertion, value) => includes(assertion.facets.findings, value)],
  ["manufacturer", (assertion, value) => includes(assertion.facets.manufacturers, value)],
  ["method", (assertion, value) => includes(assertion.facets.techniques, value) || normalize(assertion.predicate).includes(normalize(value))],
  ["context", (assertion, value) => normalize(JSON.stringify(assertion.context)).includes(normalize(value))],
  ["polarity", (assertion, value) => normalize(assertion.polarity) === normalize(value)],
  ["quality", (assertion, value) => normalize(JSON.stringify(assertion.evidenceQuality)).includes(normalize(value))],
  ["maturity", (assertion, value) => normalize(assertion.scientificMaturity).includes(normalize(value))],
  ["status", (assertion, value) => normalize(assertion.status) === normalize(value) || normalize(assertion.reviewState) === normalize(value)],
]);

const sourceMatches = (assertion, input) => {
  if (!input.source && !input.documentStatus && !input.sourceAccess) return true;
  const sources = assertion.sourceRefs.map((id) => sourceByRevisionId.get(id)).filter(Boolean);
  return sources.some((source) => (!input.source || [source.pmid, source.doi, source.title, source.sourceType].some((value) => normalize(value).includes(normalize(input.source))))
    && (!input.documentStatus || normalize(source.documentStatus) === normalize(input.documentStatus))
    && (!input.sourceAccess || normalize(source.fullTextAvailability) === normalize(input.sourceAccess)));
};

const matches = (assertion, input) => filters.every(([key, predicate]) => !input[key] || predicate(assertion, input[key])) && sourceMatches(assertion, input);

export const queryScientificMultidomain = (input = {}) => {
  const query = Object.freeze(Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined && value !== null && value !== "").sort(([a], [b]) => a.localeCompare(b))));
  const domainPool = input.domainId ? multidomainAssertionRevisions.filter((item) => normalize(item.domainId) === normalize(input.domainId)) : multidomainAssertionRevisions;
  const applicableAssertions = domainPool.filter((assertion) => matches(assertion, input)).sort((a, b) => a.revisionId.localeCompare(b.revisionId));
  const applicableIds = new Set(applicableAssertions.map((item) => item.revisionId));
  const evidenceLinks = multidomainEvidenceLinks.filter((link) => applicableIds.has(link.assertionRevisionId)).sort((a, b) => a.evidenceLinkId.localeCompare(b.evidenceLinkId));
  const sourceIds = unique(evidenceLinks.map((link) => link.sourceRevisionId));
  const sources = sourceIds.map((id) => sourceByRevisionId.get(id)).filter(Boolean);
  const contradictions = multidomainContradictionAssessments.filter((item) => item.assertionRevisionIds.some((id) => applicableIds.has(id)));
  const missingData = unique([
    ...(applicableAssertions.length ? [] : ["NO_APPLICABLE_ASSERTION"]),
    ...(input.manufacturer && applicableAssertions.every((item) => item.facets.manufacturers.length === 0) ? ["MANUFACTURER_NOT_REPORTED"] : []),
    ...(input.context && applicableAssertions.length === 0 ? [`CONTEXT_NOT_REPRESENTED:${input.context}`] : []),
    ...(input.sourceAccess === "OFFICIAL_FULL_TEXT" && sources.some((source) => source.abstractOnly) ? ["ABSTRACT_ONLY_SOURCE_PRESENT"] : []),
  ]);
  const outOfContextAssertions = domainPool.filter((assertion) => !applicableIds.has(assertion.revisionId)).sort((a, b) => a.revisionId.localeCompare(b.revisionId));
  const material = {
    query,
    assertionRevisionIds: applicableAssertions.map((item) => item.revisionId),
    evidenceLinkIds: evidenceLinks.map((item) => item.evidenceLinkId),
    sourceRevisionIds: sourceIds,
    contradictionIds: contradictions.map((item) => item.contradictionId),
    missingData,
  };
  return Object.freeze({
    queryId: `noxia:radiology:scientific-query:p5:${sha256Digest(material)}`,
    query,
    dataPresent: Object.freeze({ assertions: applicableAssertions.length, evidenceLinks: evidenceLinks.length, sources: sources.length, fullTextSources: sources.filter((source) => !source.abstractOnly).length, abstractOnlySources: sources.filter((source) => source.abstractOnly).length }),
    dataMissing: Object.freeze(missingData),
    applicableAssertions: Object.freeze(applicableAssertions),
    outOfContextAssertions: Object.freeze(outOfContextAssertions),
    evidenceLinks: Object.freeze(evidenceLinks),
    fullTextSources: Object.freeze(sources.filter((source) => !source.abstractOnly).sort((a, b) => a.revisionId.localeCompare(b.revisionId))),
    abstractOnlySources: Object.freeze(sources.filter((source) => source.abstractOnly).sort((a, b) => a.revisionId.localeCompare(b.revisionId))),
    contradictions: Object.freeze(contradictions),
    reviewDecisions: Object.freeze(applicableAssertions.map((assertion) => reviewByAssertionId.get(assertion.revisionId)).filter(Boolean)),
    unresolvedDecisions: Object.freeze(unique([...missingData, ...contradictions.map((item) => `${item.classification}:${item.contradictionId}`)])),
    approximationUsed: false,
    statisticalMetaAnalysisPerformed: false,
    generatedEditorialText: false,
    deterministicDigest: sha256Digest(material),
  });
};

export const mandatoryMultidomainQueries = Object.freeze({
  adcDiffusion: { domainId: "diffusion-adc", concept: "adc", technique: "dwi" },
  adcLimitations: { domainId: "diffusion-adc", concept: "adc", polarity: "QUALIFIED" },
  tmaxCtPerfusion: { domainId: "cerebral-perfusion", concept: "tmax", modality: "CT" },
  cbfDeconvolution: { domainId: "cerebral-perfusion", concept: "cbf", method: "deconvolution" },
  lgeQuantification: { domainId: "myocardial-tissue-characterization", concept: "lge", technique: "lge-quantification" },
  mvoInfarction: { domainId: "myocardial-tissue-characterization", concept: "microvascular-obstruction", pathology: "myocardial-infarction" },
  hemorrhageMr: { domainId: "myocardial-tissue-characterization", concept: "intramyocardial-hemorrhage", modality: "MR" },
  spectralIodineMap: { domainId: "spectral-ct", concept: "iodine-map" },
  spectralReproducibility: { domainId: "spectral-ct", concept: "iodine", polarity: "QUALIFIED" },
  contradictionsDiffusion: { domainId: "diffusion-adc", polarity: "QUALIFIED" },
  contradictionsPerfusion: { domainId: "cerebral-perfusion", polarity: "QUALIFIED" },
  contradictionsCardiac: { domainId: "myocardial-tissue-characterization", polarity: "QUALIFIED" },
  contradictionsSpectral: { domainId: "spectral-ct", polarity: "QUALIFIED" },
});

export const executeMandatoryMultidomainQueries = () => Object.freeze(Object.fromEntries(Object.entries(mandatoryMultidomainQueries).map(([key, query]) => [key, queryScientificMultidomain(query)])));
