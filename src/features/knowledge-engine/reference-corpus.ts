import referenceCorpusDocument from "../../../reference-corpus/reference-corpus-01/reference-corpus.json" with { type: "json" };
import linkedStudySetsDocument from "../../../reference-corpus/reference-corpus-01/linked-study-sets.json" with { type: "json" };
import ownerKnowledgeCoverageDocument from "../../../reference-corpus/owner-knowledge-coverage-01/owner-knowledge-coverage.json" with { type: "json" };
import ownerKnowledgeNeedsDocument from "../../../reference-corpus/owner-knowledge-coverage-01/owner-knowledge-needs.json" with { type: "json" };
import referenceDocumentIndex from "../../../reference-corpus/reference-knowledge-bridge-01/reference-document-index.json" with { type: "json" };
import documentaryEvidenceClosureDocument from "../../../reference-corpus/reference-corpus-01/documentary-evidence-closure-01.json" with { type: "json" };
import { comparableScientificText, logicalDigest, uniqueSorted } from "./canonical.js";
import type {
  KnowledgeRequest,
  ReferenceDocumentRelationship,
  ReferenceEvidenceCandidate,
  ReferenceKnowledgeNeed,
  ReferenceSourceAnchor,
  ReferenceSourceSnapshot,
  RuntimeSource,
} from "./types.js";

type Rc01Source = {
  SOURCE_ID: string;
  TITLE: string;
  ORGANIZATION: string;
  DOCUMENT_TYPE: string;
  SOURCE_CLASS: string;
  OFFICIAL_URL: string;
  LOCAL_COPY_PATH: string | null;
  FILE_FORMAT: string;
  DOCUMENT_VERSION: string;
  PUBLICATION_DATE: string;
  EFFECTIVE_DATE: string;
  RETRIEVAL_DATE: string;
  SUPERSEDES: string[];
  SUPERSEDED_BY: string[];
  CURRENT_OR_HISTORICAL: string;
  JURISDICTION: string;
  LANGUAGE: string[];
  AUTHORITY_OR_EVIDENCE_CLASS: string;
  REGULATORY_APPLICABILITY: string;
  METHODOLOGICAL_RELEVANCE: string;
  SCIENTIFIC_RELEVANCE: string;
  PRACTICE_PATTERN_RELEVANCE: string;
  OWNER_RELEVANCE: string[];
  LICENCE_OR_COPYRIGHT_STATUS: string;
  LOCAL_COPY_ALLOWED: "YES" | "NO" | "UNKNOWN";
  REDISTRIBUTION_ALLOWED: "YES" | "NO" | "UNKNOWN";
  SHA256: string | null;
  RETRIEVAL_QUALITY_TIER: string;
  TARGET_DOMAINS: string[];
  NOTES: string;
  UNCERTAINTIES: string[];
};

type Rc01Need = {
  NEED_ID: string;
  OWNER: string;
  NEED_CLASS: string;
};

type Rc01Coverage = {
  NEED_ID: string;
  SUPPORT_TYPES: string[];
  PRIMARY_SOURCE_IDS: string[];
  SECONDARY_SOURCE_IDS: string[];
  LIMITATIONS: string[];
};

type IndexedSection = {
  SECTION_ID: string;
  PAGE: number;
  HEADING: string;
  NORMALIZED_TEXT_OFFSET_START: number;
  NORMALIZED_TEXT_OFFSET_END: number;
  EXACT_TEXT: string;
  EXACT_CONTENT_SHA256: string;
};

type IndexedSource = {
  SOURCE_ID: string;
  DOCUMENT_VERSION: string;
  SOURCE_SHA256: string;
  PAGE_COUNT: number;
  INDEXED_SECTION_COUNT: number;
  SECTIONS: IndexedSection[];
};

type IndexedNeedSource = {
  NEED_ID: string;
  SOURCE_ID: string;
  SECTION_IDS: string[];
};

type LinkedStudySet = {
  STUDY_SET_ID: string;
  STUDY_TITLE: string;
  TRIAL_IDENTIFIERS: string[];
  ARTIFACTS: Array<{ SOURCE_ID: string; ROLE: string }>;
  SOURCE_PROVENANCE: string[];
  ARTIFACT_RELATIONSHIPS: string[];
  VERSION_RELATIONSHIPS: string[];
};

type DocumentaryEvidenceClosure = {
  ARTIFACTS: Array<{
    SOURCE_ID: string;
    CONTENT_READINESS_STATE: "METADATA_ONLY" | "CONTENT_ACCESSIBLE_NOT_STORED" | "LOCAL_DOCUMENT_AVAILABLE" | "SECTION_INDEXED" | "CLAIM_ANCHORED";
  }>;
};

const corpus = referenceCorpusDocument as unknown as { RETRIEVAL_DATE: string; SOURCES: Rc01Source[] };
const needs = ownerKnowledgeNeedsDocument as unknown as { NEEDS: Rc01Need[] };
const coverage = ownerKnowledgeCoverageDocument as unknown as { COVERAGE: Rc01Coverage[] };
const documentIndex = referenceDocumentIndex as unknown as { SOURCES: IndexedSource[]; NEED_SOURCE_SECTIONS: IndexedNeedSource[] };
const linkedStudySets = linkedStudySetsDocument as unknown as { STUDY_SETS: LinkedStudySet[] };
const documentaryEvidenceClosure = documentaryEvidenceClosureDocument as unknown as DocumentaryEvidenceClosure;

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach((nested) => deepFreeze(nested));
    Object.freeze(value);
  }
  return value;
};

const sourceIdPattern = /^RC01-[A-E]-[0-9]{3}$/;
const sourceById = new Map(corpus.SOURCES.map((source) => [source.SOURCE_ID, source]));
const needById = new Map(needs.NEEDS.map((need) => [need.NEED_ID, need]));
const coverageByNeedId = new Map(coverage.COVERAGE.map((entry) => [entry.NEED_ID, entry]));
const indexBySourceId = new Map(documentIndex.SOURCES.map((entry) => [entry.SOURCE_ID, entry]));
const closureStateBySourceId = new Map(documentaryEvidenceClosure.ARTIFACTS.map((entry) => [entry.SOURCE_ID, entry.CONTENT_READINESS_STATE]));
const sectionIdsByNeedAndSource = new Map(documentIndex.NEED_SOURCE_SECTIONS.map((entry) => [`${entry.NEED_ID}:${entry.SOURCE_ID}`, entry.SECTION_IDS]));

const validateStaticBridgeInputs = () => {
  if (sourceById.size !== corpus.SOURCES.length || needById.size !== needs.NEEDS.length || coverageByNeedId.size !== coverage.COVERAGE.length) {
    throw new Error("REFERENCE_CORPUS_DUPLICATE_ID");
  }
  for (const entry of documentIndex.SOURCES) {
    const source = sourceById.get(entry.SOURCE_ID);
    if (!source
      || source.SHA256 !== entry.SOURCE_SHA256
      || source.DOCUMENT_VERSION !== entry.DOCUMENT_VERSION
      || source.LOCAL_COPY_ALLOWED !== "YES"
      || source.REDISTRIBUTION_ALLOWED !== "YES") {
      throw new Error(`REFERENCE_DOCUMENT_INDEX_IDENTITY_MISMATCH:${entry.SOURCE_ID}`);
    }
  }
  for (const entry of coverage.COVERAGE) {
    if (!needById.has(entry.NEED_ID)) throw new Error(`REFERENCE_NEED_COVERAGE_ORPHAN:${entry.NEED_ID}`);
    for (const sourceId of [...entry.PRIMARY_SOURCE_IDS, ...entry.SECONDARY_SOURCE_IDS]) {
      if (!sourceById.has(sourceId)) throw new Error(`REFERENCE_NEED_SOURCE_ORPHAN:${sourceId}`);
    }
  }
};

validateStaticBridgeInputs();

export const REFERENCE_CORPUS_PROVIDER_ID = "reference-corpus-01" as const;
export const REFERENCE_CORPUS_REGISTRY_REF = "reference-corpus/reference-corpus-01/reference-corpus.json" as const;
export const REFERENCE_CORPUS_RUNTIME_DIGEST = logicalDigest({
  retrievalDate: corpus.RETRIEVAL_DATE,
  sources: corpus.SOURCES.map((source) => ({ sourceId: source.SOURCE_ID, version: source.DOCUMENT_VERSION, status: source.CURRENT_OR_HISTORICAL, sha256: source.SHA256 })),
  needs: coverage.COVERAGE.map((entry) => ({ needId: entry.NEED_ID, primary: entry.PRIMARY_SOURCE_IDS, secondary: entry.SECONDARY_SOURCE_IDS })),
  index: documentIndex.SOURCES.map((entry) => ({ sourceId: entry.SOURCE_ID, sourceDigest: entry.SOURCE_SHA256, sections: entry.SECTIONS.map((section) => section.EXACT_CONTENT_SHA256) })),
  needSourceSections: documentIndex.NEED_SOURCE_SECTIONS,
  studySets: linkedStudySets.STUDY_SETS.map((set) => ({ setId: set.STUDY_SET_ID, artifacts: set.ARTIFACTS })),
});

const contentAvailability = (source: Rc01Source) => {
  const indexed = indexBySourceId.get(source.SOURCE_ID);
  if (indexed?.SECTIONS.length) return "SECTION_INDEXED" as const;
  if (source.LOCAL_COPY_PATH && source.SHA256) return "LOCAL_DOCUMENT_AVAILABLE" as const;
  if (closureStateBySourceId.get(source.SOURCE_ID) === "CONTENT_ACCESSIBLE_NOT_STORED") return "CONTENT_ACCESSIBLE_NOT_STORED" as const;
  return "METADATA_ONLY" as const;
};

const availabilityCounts = corpus.SOURCES.reduce<Record<string, number>>((counts, source) => {
  const state = contentAvailability(source);
  counts[state] = (counts[state] ?? 0) + 1;
  return counts;
}, {});

export const REFERENCE_CORPUS_CURRENT_METADATA = Object.freeze({
  registrySourceCount: corpus.SOURCES.length,
  localDocumentCount: corpus.SOURCES.filter((source) => Boolean(source.LOCAL_COPY_PATH && source.SHA256)).length,
  sectionIndexedSourceCount: documentIndex.SOURCES.filter((source) => source.SECTIONS.length > 0).length,
  indexedSectionCount: documentIndex.SOURCES.reduce((count, source) => count + source.SECTIONS.length, 0),
  needSourceMappingCount: documentIndex.NEED_SOURCE_SECTIONS.length,
  linkedStudySetCount: linkedStudySets.STUDY_SETS.length,
  availabilityCounts: Object.freeze({
    METADATA_ONLY: availabilityCounts.METADATA_ONLY ?? 0,
    CONTENT_ACCESSIBLE_NOT_STORED: availabilityCounts.CONTENT_ACCESSIBLE_NOT_STORED ?? 0,
    LOCAL_DOCUMENT_AVAILABLE: availabilityCounts.LOCAL_DOCUMENT_AVAILABLE ?? 0,
    SECTION_INDEXED: availabilityCounts.SECTION_INDEXED ?? 0,
  }),
  supportedAvailabilityStates: Object.freeze([
    "METADATA_ONLY",
    "CONTENT_ACCESSIBLE_NOT_STORED",
    "LOCAL_DOCUMENT_AVAILABLE",
    "SECTION_INDEXED",
    "CLAIM_ANCHORED",
  ] as const),
});

const snapshotFrom = (source: Rc01Source): ReferenceSourceSnapshot => {
  const metadataRef = `${REFERENCE_CORPUS_REGISTRY_REF}#${source.SOURCE_ID}`;
  const material = {
    sourceId: source.SOURCE_ID,
    metadataRef,
    title: source.TITLE,
    organization: source.ORGANIZATION,
    documentType: source.DOCUMENT_TYPE,
    sourceClass: source.SOURCE_CLASS,
    documentVersion: source.DOCUMENT_VERSION,
    publicationDate: source.PUBLICATION_DATE,
    effectiveDate: source.EFFECTIVE_DATE,
    currentOrHistorical: source.CURRENT_OR_HISTORICAL,
    jurisdiction: source.JURISDICTION,
    regulatoryApplicability: source.REGULATORY_APPLICABILITY,
    methodologicalRelevance: source.METHODOLOGICAL_RELEVANCE,
    scientificRelevance: source.SCIENTIFIC_RELEVANCE,
    practicePatternRelevance: source.PRACTICE_PATTERN_RELEVANCE,
    officialUrl: source.OFFICIAL_URL,
    localDigest: source.SHA256,
    retrievalDate: source.RETRIEVAL_DATE,
    supersedes: [...source.SUPERSEDES],
    supersededBy: [...source.SUPERSEDED_BY],
    licenceOrCopyrightStatus: source.LICENCE_OR_COPYRIGHT_STATUS,
    localCopyAllowed: source.LOCAL_COPY_ALLOWED,
    redistributionAllowed: source.REDISTRIBUTION_ALLOWED,
    uncertainties: [...source.UNCERTAINTIES],
    ownerRelevance: [...source.OWNER_RELEVANCE],
    targetDomains: [...source.TARGET_DOMAINS],
    contentAvailability: contentAvailability(source),
    externalAuthorityStatus: "EXTERNAL_REFERENCE_NOT_NOXIA_AUTHORITY" as const,
  };
  const snapshotDigest = logicalDigest(material);
  return deepFreeze({ snapshotId: `reference-source-snapshot:${source.SOURCE_ID}:${snapshotDigest}`, snapshotDigest, ...material }) as ReferenceSourceSnapshot;
};

export const listReferenceSourceSnapshots = (): readonly ReferenceSourceSnapshot[] => deepFreeze(
  corpus.SOURCES.map(snapshotFrom).sort((left, right) => left.sourceId.localeCompare(right.sourceId)),
) as readonly ReferenceSourceSnapshot[];

export const resolveReferenceSourceSnapshot = (sourceId: string): ReferenceSourceSnapshot | null => {
  if (!sourceIdPattern.test(sourceId)) return null;
  const source = sourceById.get(sourceId);
  return source ? snapshotFrom(source) : null;
};

export const resolveReferenceNeed = (referenceNeed: ReferenceKnowledgeNeed) => {
  const need = needById.get(referenceNeed.needId);
  const mappedCoverage = coverageByNeedId.get(referenceNeed.needId);
  if (!need || !mappedCoverage || need.NEED_CLASS !== referenceNeed.needClass || need.OWNER !== referenceNeed.owner) return null;
  return deepFreeze({
    needId: need.NEED_ID,
    needClass: need.NEED_CLASS,
    owner: need.OWNER,
    supportTypes: [...mappedCoverage.SUPPORT_TYPES],
    primarySourceIds: [...mappedCoverage.PRIMARY_SOURCE_IDS],
    secondarySourceIds: [...mappedCoverage.SECONDARY_SOURCE_IDS],
    limitations: [...mappedCoverage.LIMITATIONS],
  });
};

const temporalRank = (status: string) => {
  if (/^CURRENT|CURRENT_|EFFECTIVE/i.test(status)) return 0;
  if (/ADOPTED|NOT_YET_EFFECTIVE|FUTURE/i.test(status)) return 1;
  if (/HISTORICAL|SUPERSEDED|CLOSED/i.test(status)) return 2;
  return 1;
};

const jurisdictionRank = (source: Rc01Source, target: string | undefined) => {
  if (!target) return 0;
  const normalizedTarget = comparableScientificText(target);
  const normalizedJurisdiction = comparableScientificText(source.JURISDICTION);
  if (normalizedJurisdiction.includes(normalizedTarget)) return 0;
  if (["fr", "france"].includes(normalizedTarget) && /\b(?:eu|eea|fr)\b/.test(normalizedJurisdiction)) return 1;
  return 2;
};

const tokens = (value: string) => uniqueSorted(comparableScientificText(value)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .split(/[^a-z0-9]+/u)
  .filter((token) => token.length >= 4 && !["avec", "dans", "pour", "from", "that", "this", "owner", "knowledge", "source", "external", "study"].includes(token)));

const anchorFrom = (source: Rc01Source, section: IndexedSection): ReferenceSourceAnchor => {
  const material = {
    sourceId: source.SOURCE_ID,
    documentVersion: source.DOCUMENT_VERSION,
    page: section.PAGE,
    sectionId: section.SECTION_ID,
    heading: section.HEADING,
    normalizedTextOffsetStart: section.NORMALIZED_TEXT_OFFSET_START,
    normalizedTextOffsetEnd: section.NORMALIZED_TEXT_OFFSET_END,
    exactContentDigest: section.EXACT_CONTENT_SHA256,
    locator: `${source.SOURCE_ID} · ${source.DOCUMENT_VERSION} · page ${section.PAGE} · ${section.SECTION_ID}`,
  };
  return { anchorId: `reference-anchor:${logicalDigest(material)}`, ...material };
};

const candidateLimitations = (source: Rc01Source, targetJurisdiction: string | undefined, coverageLimitations: string[]) => uniqueSorted([
  "EXTERNAL_REFERENCE_CANDIDATE_REQUIRES_KNOWLEDGE_QUALIFICATION_AND_HUMAN_REVIEW",
  "EXACT_EXCERPT_IS_NOT_AN_EFFECTIVE_ASSERTION_OR_PROJECT_FACT",
  ...coverageLimitations,
  ...source.UNCERTAINTIES,
  ...(/C_PRACTICE_ARTIFACT|E_LINKED_STUDY_ARTIFACT_SET/.test(source.SOURCE_CLASS) ? ["PRACTICE_ARTIFACT_DOES_NOT_ESTABLISH_REGULATORY_OR_SCIENTIFIC_AUTHORITY"] : []),
  ...(source.SOURCE_CLASS === "D_FUNDING_OR_OPERATIONAL_RULE" ? ["FUNDING_RULE_IS_NOT_A_GENERIC_SCIENTIFIC_RULE"] : []),
  ...(targetJurisdiction && jurisdictionRank(source, targetJurisdiction) > 1 ? [`JURISDICTION_MISMATCH:${source.JURISDICTION}->${targetJurisdiction}`, "METHODOLOGICAL_RELEVANCE_DOES_NOT_CREATE_TARGET_JURISDICTION_REQUIREMENT"] : []),
]);

const selectSections = (source: Rc01Source, request: KnowledgeRequest, maxSections: number) => {
  const indexed = indexBySourceId.get(source.SOURCE_ID);
  if (!indexed) return [];
  const permittedSectionIds = new Set(sectionIdsByNeedAndSource.get(`${request.referenceNeed?.needId}:${source.SOURCE_ID}`) ?? []);
  const queryTokens = tokens([
    request.referenceNeed?.needClass ?? "",
    request.originalQuestion,
    ...request.scientificObjects.map((object) => object.originalTerm),
    ...request.relations,
  ].join(" "));
  return indexed.SECTIONS.filter((section) => permittedSectionIds.has(section.SECTION_ID)).map((section) => {
    const heading = comparableScientificText(section.HEADING);
    const text = comparableScientificText(section.EXACT_TEXT);
    const score = queryTokens.reduce((total, token) => total + (heading.includes(token) ? 5 : 0) + (text.includes(token) ? 1 : 0), 0);
    return { section, score };
  }).filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.section.PAGE - right.section.PAGE || left.section.SECTION_ID.localeCompare(right.section.SECTION_ID))
    .slice(0, maxSections)
    .map((entry) => entry.section);
};

const relationshipsFor = (sourceIds: Set<string>): ReferenceDocumentRelationship[] => linkedStudySets.STUDY_SETS
  .filter((set) => set.ARTIFACTS.some((artifact) => sourceIds.has(artifact.SOURCE_ID)))
  .map((set) => {
    const material = {
      relationshipType: "SAME_STUDY_ARTIFACT_SET" as const,
      studySetId: set.STUDY_SET_ID,
      studyTitle: set.STUDY_TITLE,
      trialIdentifiers: [...set.TRIAL_IDENTIFIERS],
      artifacts: set.ARTIFACTS.map((artifact) => ({ sourceId: artifact.SOURCE_ID, role: artifact.ROLE })),
      provenance: [...set.SOURCE_PROVENANCE],
      limitations: [...set.ARTIFACT_RELATIONSHIPS, ...set.VERSION_RELATIONSHIPS, "DOCUMENTARY_RELATIONSHIP_ONLY_NO_PRACTICE_RULE_INFERRED"],
      practiceRuleInferred: false as const,
    };
    return { relationshipId: `reference-document-relationship:${logicalDigest(material)}`, ...material };
  }).sort((left, right) => left.relationshipId.localeCompare(right.relationshipId));

export type ReferenceCorpusQueryResult = {
  executionStatus: "SUCCESS" | "NO_MATCH" | "POLICY_REFUSED";
  snapshots: ReferenceSourceSnapshot[];
  runtimeSources: RuntimeSource[];
  candidates: ReferenceEvidenceCandidate[];
  relationships: ReferenceDocumentRelationship[];
  diagnostics: string[];
  limitations: string[];
};

export const queryReferenceCorpus = (request: KnowledgeRequest): ReferenceCorpusQueryResult => {
  const referenceNeed = request.referenceNeed;
  if (!referenceNeed) return { executionStatus: "POLICY_REFUSED", snapshots: [], runtimeSources: [], candidates: [], relationships: [], diagnostics: ["EXPLICIT_REFERENCE_NEED_REQUIRED"], limitations: [] };
  const resolvedNeed = resolveReferenceNeed(referenceNeed);
  if (!resolvedNeed) return { executionStatus: "POLICY_REFUSED", snapshots: [], runtimeSources: [], candidates: [], relationships: [], diagnostics: ["REFERENCE_NEED_NOT_GOVERNED_OR_OWNER_MISMATCH"], limitations: [] };
  const mappedSourceIds = uniqueSorted([...resolvedNeed.primarySourceIds, ...resolvedNeed.secondarySourceIds]);
  const requestedSourceIds = referenceNeed.sourcePreferences.length ? referenceNeed.sourcePreferences : mappedSourceIds;
  if (requestedSourceIds.some((sourceId) => !sourceIdPattern.test(sourceId) || !sourceById.has(sourceId))) {
    return { executionStatus: "NO_MATCH", snapshots: [], runtimeSources: [], candidates: [], relationships: [], diagnostics: ["REFERENCE_SOURCE_NOT_FOUND_FAIL_CLOSED"], limitations: [] };
  }
  if (requestedSourceIds.some((sourceId) => !mappedSourceIds.includes(sourceId))) {
    return { executionStatus: "POLICY_REFUSED", snapshots: [], runtimeSources: [], candidates: [], relationships: [], diagnostics: ["REFERENCE_SOURCE_NOT_GOVERNED_FOR_NEED"], limitations: [] };
  }
  const preferred = new Set(referenceNeed.sourcePreferences);
  const selectedSources = requestedSourceIds.map((sourceId) => sourceById.get(sourceId)!)
    .filter((source) => referenceNeed.includeHistorical || preferred.has(source.SOURCE_ID) || temporalRank(source.CURRENT_OR_HISTORICAL) < 2)
    .sort((left, right) => temporalRank(left.CURRENT_OR_HISTORICAL) - temporalRank(right.CURRENT_OR_HISTORICAL)
      || jurisdictionRank(left, referenceNeed.jurisdictionTarget) - jurisdictionRank(right, referenceNeed.jurisdictionTarget)
      || Number(!resolvedNeed.primarySourceIds.includes(left.SOURCE_ID)) - Number(!resolvedNeed.primarySourceIds.includes(right.SOURCE_ID))
      || left.SOURCE_ID.localeCompare(right.SOURCE_ID))
    .slice(0, referenceNeed.maxSources);
  const snapshots = selectedSources.map(snapshotFrom);
  const snapshotBySourceId = new Map(snapshots.map((snapshot) => [snapshot.sourceId, snapshot]));
  const candidates = selectedSources.flatMap((source) => selectSections(source, request, referenceNeed.maxSectionsPerSource).map((section): ReferenceEvidenceCandidate => {
    const snapshot = snapshotBySourceId.get(source.SOURCE_ID)!;
    const anchor = anchorFrom(source, section);
    const limitations = candidateLimitations(source, referenceNeed.jurisdictionTarget, resolvedNeed.limitations);
    const material = {
      needId: resolvedNeed.needId,
      needClass: resolvedNeed.needClass,
      owner: referenceNeed.owner,
      sourceId: source.SOURCE_ID,
      sourceSnapshotRef: snapshot.snapshotId,
      anchor,
      exactTextExcerpt: section.EXACT_TEXT,
      supportTypes: [...resolvedNeed.supportTypes],
      jurisdiction: source.JURISDICTION,
      regulatoryApplicability: source.REGULATORY_APPLICABILITY,
      methodologicalRelevance: source.METHODOLOGICAL_RELEVANCE,
      scientificRelevance: source.SCIENTIFIC_RELEVANCE,
      practicePatternRelevance: source.PRACTICE_PATTERN_RELEVANCE,
      sourceClass: source.SOURCE_CLASS,
      documentType: source.DOCUMENT_TYPE,
      currentOrHistorical: source.CURRENT_OR_HISTORICAL,
      limitations,
      uncertainties: [...source.UNCERTAINTIES],
      candidateIsGovernedAssertion: false as const,
      projectWriteAuthorized: false as const,
    };
    return { candidateId: `reference-evidence-candidate:${logicalDigest(material)}`, providerId: REFERENCE_CORPUS_PROVIDER_ID, status: "EXTERNAL_REFERENCE_CANDIDATE", ...material };
  }));
  const runtimeSources = snapshots.map((snapshot): RuntimeSource => ({
    sourceId: snapshot.sourceId,
    revision: snapshot.documentVersion,
    title: snapshot.title,
    status: snapshot.currentOrHistorical,
    locator: snapshot.officialUrl,
    sourceSnapshotRef: snapshot.snapshotId,
  }));
  const contentUnavailable = snapshots.filter((snapshot) => !["SECTION_INDEXED", "CLAIM_ANCHORED"].includes(snapshot.contentAvailability));
  const contentUnavailableCounts = contentUnavailable.reduce<Record<string, number>>((counts, snapshot) => {
    counts[snapshot.contentAvailability] = (counts[snapshot.contentAvailability] ?? 0) + 1;
    return counts;
  }, {});
  return {
    executionStatus: snapshots.length ? "SUCCESS" : "NO_MATCH",
    snapshots,
    runtimeSources,
    candidates,
    relationships: relationshipsFor(new Set(snapshots.map((snapshot) => snapshot.sourceId))),
    diagnostics: uniqueSorted([
      `${snapshots.length}_REFERENCE_SOURCE_SNAPSHOTS_RESOLVED`,
      `${candidates.length}_ANCHORED_REFERENCE_CANDIDATES_EMITTED`,
      ...Object.entries(contentUnavailableCounts).map(([state, count]) => `${count}_${state}_SOURCES_NO_CONTENT_CLAIM`),
      ...(candidates.length ? ["EXTERNAL_REFERENCE_CANDIDATES_NOT_GOVERNED_ASSERTIONS"] : []),
    ]),
    limitations: uniqueSorted([
      ...resolvedNeed.limitations,
      ...contentUnavailable.map((snapshot) => `${snapshot.contentAvailability}:NO_CONTENT_ACCESS:${snapshot.sourceId}`),
      ...(candidates.length ? ["REFERENCE_CANDIDATES_REQUIRE_REVIEW_OR_ACTIVATION"] : []),
    ]),
  };
};
