import { sha256Digest } from "../migration/stable-json.mjs";
import { scientificSourceRevisions } from "./sources.mjs";
import { queryScientificCorpus } from "./query.mjs";

export const synthesisDefinitions = Object.freeze([
  { key: "ecv", label: "ECV — state of knowledge", query: { concept: "ecv" }, requiredDimensions: ["modality"] },
  { key: "ecv-myocarditis", label: "ECV and myocarditis", query: { concept: "ecv", disease: "myocarditis", modality: "mr" }, requiredDimensions: ["disease", "modality"] },
  { key: "ecv-myocardial-infarction", label: "ECV and myocardial infarction", query: { concept: "ecv", disease: "myocardial-infarction", modality: "mr" }, requiredDimensions: ["disease", "modality"] },
  { key: "native-t1-methods", label: "Native T1 mapping methods", query: { concept: "t1-mapping", modality: "mr" }, requiredDimensions: ["modality", "measurementMethod"] },
  { key: "molli-versus-sasha", label: "MOLLI versus SASHA", query: { concepts: ["molli", "sasha"], modality: "mr" }, requiredDimensions: ["modality", "sequence"] },
  { key: "ecv-1-5t-versus-3t", label: "ECV at 1.5 T versus 3 T", query: { concept: "ecv", fieldStrengths: ["1.5 T", "3 T"], modality: "mr" }, requiredDimensions: ["modality", "fieldStrength"] },
  { key: "t1-technical-limitations", label: "Technical limitations of T1 mapping", query: { concept: "t1-mapping", modality: "mr", limitationsOnly: true }, requiredDimensions: ["modality"] },
  { key: "intersite-reproducibility", label: "Intersite reproducibility", query: { concept: "reproducibility", modality: "mr" }, requiredDimensions: ["modality", "center"] },
  { key: "ecv-mr-versus-ct", label: "CMR ECV versus CT ECV", query: { concept: "ecv", modalities: ["mr", "ct"] }, requiredDimensions: ["modality"] },
  { key: "ct-ecv", label: "CT ECV — state of knowledge", query: { concept: "ecv", modality: "ct" }, requiredDimensions: ["modality"] },
]);

const unique = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
const linkMap = (links) => new Map(links.map((link) => [link.evidenceLinkId, link]));

const detectConsensus = (result) => {
  const officialSources = [...result.primarySources, ...result.secondarySources].filter((source) => ["CONSENSUS", "GUIDELINE"].includes(source.metadata.evidenceSourceType));
  const currentOfficialSources = officialSources.filter((source) => ["CURRENT", "CORRECTED"].includes(source.metadata.documentStatus));
  const officialRefutations = result.evidenceLinks.filter((link) => link.relationType === "REFUTES" && currentOfficialSources.some((source) => source.revisionId === link.sourceRevisionId));
  const detected = currentOfficialSources.length > 0 && officialRefutations.length === 0;
  return Object.freeze({
    detected,
    state: detected ? "CURRENT_CONSENSUS" : "NO_EXPLICIT_CURRENT_CONSENSUS",
    ruleId: "P4_CURRENT_CONSENSUS_V1",
    rule: {
      requiresCurrentOfficialConsensusOrGuideline: true,
      requiresKnownVersionAndDate: true,
      forbidsEquivalentOfficialRefutationInSameContext: true,
      preservesLimitations: true,
      rawPublicationCountIgnored: true,
      scope: "SELECTED_P4_CORPUS_AS_OF_2026_07_31",
    },
    sourceRevisionIds: currentOfficialSources.map((source) => source.revisionId).sort(),
    excludedSupersededSourceRevisionIds: officialSources.filter((source) => source.metadata.documentStatus === "SUPERSEDED").map((source) => source.revisionId).sort(),
    officialRefutingEvidenceLinkIds: officialRefutations.map((link) => link.evidenceLinkId).sort(),
  });
};

const convergenceState = (result, consensus) => {
  if (!result.applicableAssertions.length) return "INSUFFICIENT_EVIDENCE";
  if (result.contradictions.length) return "CONTRADICTION";
  if (consensus.detected) return "CURRENT_CONSENSUS";
  const modalities = unique(result.applicableAssertions.flatMap((assertion) => assertion.facets?.modalities ?? []));
  if (modalities.length > 1) return "CONTEXT_DEPENDENT_CONVERGENCE";
  if (result.dataPresent.sourceCount > 1) return "PARTIAL_CONVERGENCE";
  return "INSUFFICIENT_EVIDENCE";
};

export const createScientificSynthesis = (definition) => {
  const result = queryScientificCorpus(definition.query);
  const consensus = detectConsensus(result);
  const evidenceById = linkMap(result.evidenceLinks);
  const favorableAssertions = result.applicableAssertions.filter((assertion) => assertion.polarity === "POSITIVE");
  const unfavorableAssertions = result.applicableAssertions.filter((assertion) => assertion.polarity === "NEGATIVE");
  const qualifiedAssertions = result.applicableAssertions.filter((assertion) => assertion.polarity === "QUALIFIED");
  const sourceIds = new Set([...result.primarySources, ...result.secondarySources].map((source) => source.revisionId));
  const requiredDimensionGaps = definition.requiredDimensions.filter((dimension) => !result.applicableAssertions.some((assertion) => assertion.context?.dimensions?.some((item) => item.dimension === dimension))).map((dimension) => `MISSING_CONTEXT:${dimension}`);
  const limitations = unique([
    ...result.applicableAssertions.flatMap((assertion) => assertion.facets?.limitations ?? []),
    ...result.evidenceLinks.flatMap((link) => link.limitations ?? []),
  ]);
  const questions = unique([
    ...result.dataAbsent,
    ...requiredDimensionGaps,
    ...(result.contradictions.length ? ["CONTEXTUAL_CONTRADICTION_REQUIRES_SCIENTIFIC_REVIEW"] : []),
    "SCIENTIFIC_HUMAN_REVIEW_REQUIRED_BEFORE_PUBLIC_PROJECTION",
  ]);
  const material = {
    key: definition.key,
    queryDigest: result.deterministicDigest,
    assertionRevisionIds: result.applicableAssertions.map((item) => item.revisionId),
    evidenceLinkIds: result.evidenceLinks.map((item) => item.evidenceLinkId),
    consensus,
    questions,
  };
  return Object.freeze({
    synthesisId: `noxia:radiology:scientific-synthesis:ecv-t1:${definition.key}:${sha256Digest(material)}`,
    key: definition.key,
    label: definition.label,
    synthesisType: "STRUCTURED_LITERATURE_SYNTHESIS_NOT_META_ANALYSIS",
    query: result.query,
    concepts: unique(result.applicableAssertions.flatMap((assertion) => assertion.facets?.concepts ?? [])),
    applicableAssertions: Object.freeze(result.applicableAssertions),
    favorableAssertions: Object.freeze(favorableAssertions),
    unfavorableAssertions: Object.freeze(unfavorableAssertions),
    qualifiedAssertions: Object.freeze(qualifiedAssertions),
    sourcesConsidered: Object.freeze([...result.primarySources, ...result.secondarySources].sort((a, b) => a.revisionId.localeCompare(b.revisionId))),
    sourcesExcluded: Object.freeze(scientificSourceRevisions.filter((source) => !sourceIds.has(source.revisionId)).map((source) => ({ sourceRevisionId: source.revisionId, reason: source.metadata.sourceQuality.assertionUtility.includes("DOCUMENT_LIFECYCLE_ONLY") ? "DOCUMENT_LIFECYCLE_ONLY" : "OUTSIDE_QUERY_CONTEXT" })).sort((a, b) => a.sourceRevisionId.localeCompare(b.sourceRevisionId))),
    evidenceLinks: Object.freeze(result.evidenceLinks),
    evidenceRelationCounts: Object.freeze(Object.fromEntries(["SUPPORTS", "REFUTES", "QUALIFIES", "MENTIONS", "DERIVES", "CORRECTS"].map((type) => [type, [...evidenceById.values()].filter((link) => link.relationType === type).length]))),
    contexts: Object.freeze(result.applicableAssertions.map((assertion) => assertion.context).filter(Boolean)),
    limitations: Object.freeze(limitations),
    contradictions: Object.freeze(result.contradictions),
    convergence: Object.freeze({ state: convergenceState(result, consensus), ruleId: "P4_CONTEXT_FIRST_CONVERGENCE_V1", publicationMajorityUsed: false }),
    consensus,
    openQuestions: Object.freeze(questions),
    history: Object.freeze({ sourcePublicationYears: unique([...result.primarySources, ...result.secondarySources].map((source) => source.publicationDate?.slice(0, 4))), documentaryStatuses: unique([...result.primarySources, ...result.secondarySources].map((source) => source.metadata.documentStatus)) }),
    confidence: result.contradictions.length ? "CONTESTED" : result.dataPresent.sourceCount >= 2 ? "MODERATE" : result.dataPresent.sourceCount === 1 ? "LOW" : "UNKNOWN",
    missingData: Object.freeze(unique([...result.dataAbsent, ...requiredDimensionGaps])),
    deterministicDigest: sha256Digest(material),
    generatedEditorialText: false,
    statisticalMetaAnalysisPerformed: false,
    publicPublicationReady: false,
  });
};

export const scientificSyntheses = Object.freeze(synthesisDefinitions.map(createScientificSynthesis).sort((a, b) => a.key.localeCompare(b.key)));
export const synthesisByKey = Object.freeze(Object.fromEntries(scientificSyntheses.map((item) => [item.key, item])));
