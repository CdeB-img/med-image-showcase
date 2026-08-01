import { sha256Digest } from "../migration/stable-json.mjs";
import { queryScientificMultidomain } from "./query.mjs";

const domainGaps = Object.freeze({
  "diffusion-adc": ["CLINICAL_THRESHOLDS_EXCLUDED_WITHOUT_COMPLETE_CONTEXT", "FIELD_STRENGTH_EFFECT_NOT_SUFFICIENTLY_RESOLVED", "VENDOR_AND_RECONSTRUCTION_DETAILS_INCOMPLETELY_REPORTED"],
  "cerebral-perfusion": ["NO_UNIVERSAL_SOFTWARE_INDEPENDENT_THRESHOLD", "SOFTWARE_GENERATION_AND_VERSION_OFTEN_UNREPORTED", "MR_AND_CT_OUTPUTS_NOT_ASSUMED_EQUIVALENT"],
  "myocardial-tissue-characterization": ["NO_UNIFORM_IMH_PROTOCOL", "TIMING_AND_DEFINITION_HETEROGENEITY", "QUANTIFICATION_METHODS_NOT_INTERCHANGEABLE"],
  "spectral-ct": ["CLINICAL_INTERPLATFORM_REPRODUCIBILITY_LIMITED", "PLATFORM_VERSION_OFTEN_UNREPORTED", "TECHNICAL_CAPABILITY_NOT_CLINICAL_OUTCOME"],
});

export const multidomainSynthesisDefinitions = Object.freeze([
  { key: "diffusion-definition-methods", domainId: "diffusion-adc", label: "Diffusion and ADC — definitions and methods", query: { domainId: "diffusion-adc", concept: "adc" } },
  { key: "diffusion-technical-limitations", domainId: "diffusion-adc", label: "ADC — technical limitations", query: { domainId: "diffusion-adc", polarity: "QUALIFIED" } },
  { key: "diffusion-documented-applications", domainId: "diffusion-adc", label: "DWI and ADC — documented applications", query: { domainId: "diffusion-adc", pathology: "acute-ischemic-stroke" } },
  { key: "perfusion-parameters-methods", domainId: "cerebral-perfusion", label: "Cerebral perfusion — parameters and methods", query: { domainId: "cerebral-perfusion" } },
  { key: "perfusion-threshold-variability", domainId: "cerebral-perfusion", label: "Cerebral perfusion — threshold variability", query: { domainId: "cerebral-perfusion", polarity: "QUALIFIED" } },
  { key: "perfusion-software-differences", domainId: "cerebral-perfusion", label: "Cerebral perfusion — software and approach differences", query: { domainId: "cerebral-perfusion", concept: "perfusion-software" } },
  { key: "myocardial-definitions-acquisitions", domainId: "myocardial-tissue-characterization", label: "LGE, MVO and hemorrhage — definitions and acquisitions", query: { domainId: "myocardial-tissue-characterization" } },
  { key: "myocardial-quantification-methods", domainId: "myocardial-tissue-characterization", label: "LGE — quantification methods", query: { domainId: "myocardial-tissue-characterization", technique: "lge-quantification" } },
  { key: "myocardial-value-limitations", domainId: "myocardial-tissue-characterization", label: "Myocardial tissue characterization — documented value and limitations", query: { domainId: "myocardial-tissue-characterization", polarity: "QUALIFIED" } },
  { key: "spectral-technologies", domainId: "spectral-ct", label: "Spectral CT — technologies", query: { domainId: "spectral-ct" } },
  { key: "spectral-quantitative-outputs", domainId: "spectral-ct", label: "Spectral CT — quantitative outputs", query: { domainId: "spectral-ct", concept: "iodine" } },
  { key: "spectral-reproducibility-limitations", domainId: "spectral-ct", label: "Spectral CT — reproducibility and limitations", query: { domainId: "spectral-ct", polarity: "QUALIFIED" } },
]);

export const createMultidomainSynthesis = (definition) => {
  const result = queryScientificMultidomain(definition.query);
  const limitations = [...new Set(result.applicableAssertions.flatMap((item) => item.limitations).concat(result.evidenceLinks.flatMap((item) => item.limitations)))].sort();
  const missingData = [...new Set([...result.dataMissing, ...domainGaps[definition.domainId]])].sort();
  const hasDifference = result.contradictions.length > 0;
  const convergence = hasDifference ? "CONTEXT_DEPENDENT_CONVERGENCE" : result.dataPresent.sources > 1 ? "PARTIAL_CONVERGENCE" : "INSUFFICIENT_EVIDENCE";
  const confidence = result.dataPresent.assertions >= 5 && result.dataPresent.fullTextSources >= 2 ? "MODERATE_TO_HIGH" : result.dataPresent.assertions >= 2 ? "MODERATE" : "LOW";
  const material = { definition, queryDigest: result.deterministicDigest, assertionIds: result.applicableAssertions.map((item) => item.revisionId), sourceIds: [...result.fullTextSources, ...result.abstractOnlySources].map((item) => item.revisionId), missingData, convergence };
  return Object.freeze({
    synthesisId: `noxia:radiology:scientific-synthesis:p5:${definition.domainId}:${definition.key}`,
    key: definition.key,
    domainId: definition.domainId,
    label: definition.label,
    synthesisType: "STRUCTURED_LITERATURE_SYNTHESIS_NOT_META_ANALYSIS",
    query: result.query,
    concepts: Object.freeze([...new Set(result.applicableAssertions.flatMap((item) => item.facets.concepts))].sort()),
    applicableAssertions: result.applicableAssertions,
    favorableAssertions: Object.freeze(result.applicableAssertions.filter((item) => item.polarity === "POSITIVE")),
    unfavorableAssertions: Object.freeze(result.applicableAssertions.filter((item) => item.polarity === "NEGATIVE")),
    qualifiedAssertions: Object.freeze(result.applicableAssertions.filter((item) => ["QUALIFIED", "CONTESTED"].includes(item.reviewState) || item.polarity === "QUALIFIED")),
    sources: Object.freeze([...result.fullTextSources, ...result.abstractOnlySources].sort((a, b) => a.revisionId.localeCompare(b.revisionId))),
    evidenceLinks: result.evidenceLinks,
    fullTextSources: result.fullTextSources,
    abstractOnlySources: result.abstractOnlySources,
    contexts: Object.freeze(result.applicableAssertions.map((item) => item.context)),
    limitations: Object.freeze(limitations),
    contradictions: result.contradictions,
    convergence: Object.freeze({ state: convergence, rule: "Evidence is grouped by compatible domain, method, population and platform context; publication count alone is ignored.", publicationMajorityUsed: false }),
    consensus: Object.freeze({ state: "NO_DERIVED_CROSS_SOURCE_CONSENSUS", officialSourceRequired: true, rawPublicationCountIgnored: true }),
    openQuestions: Object.freeze(missingData),
    history: Object.freeze([...result.fullTextSources, ...result.abstractOnlySources].map((item) => item.publishedAt).sort()),
    confidence,
    missingData: Object.freeze(missingData),
    excludedSources: Object.freeze([]),
    statisticalMetaAnalysisPerformed: false,
    generatedEditorialText: false,
    prose: null,
    deterministicDigest: sha256Digest(material),
  });
};

export const multidomainScientificSyntheses = Object.freeze(multidomainSynthesisDefinitions.map(createMultidomainSynthesis).sort((a, b) => a.key.localeCompare(b.key)));
export const multidomainSynthesisByKey = Object.freeze(Object.fromEntries(multidomainScientificSyntheses.map((item) => [item.key, item])));
