import { consolidatedSourceRevisions } from "@/knowledge-graph/scientific-consolidation/sources.mjs";
import { multidomainSourceRevisions } from "@/knowledge-graph/scientific-multidomain/sources.mjs";
import { logicalDigest, stableStringify } from "./canonical";
import type { KnowledgeResult, RuntimeAssertion, RuntimeConflict, RuntimeEvidenceLink, RuntimeSource } from "./types";

export type SourceOrigin = "USER_MENTIONED" | "USER_PROVIDED" | "USER_UPLOADED" | "NOXIA_RETRIEVED" | "EXISTING_CORPUS";
export type SourceRelevance = "EXPLICIT_INTEREST" | "INFERRED_INTEREST" | "NONE";
export type SourceRole = "BACKGROUND" | "EPIDEMIOLOGY" | "MECHANISM" | "METHOD" | "ENDPOINT" | "CONTRADICTORY_EVIDENCE";
export type ProjectSource = {
  source: RuntimeSource;
  authors: string[];
  year: string | null;
  url: string | null;
  publicationType: string | null;
  origins: SourceOrigin[];
  roles: SourceRole[];
  userRelevance: SourceRelevance;
  interestHistory: Array<{ turnRef: string; text: string; relevance: SourceRelevance; recordedAt: string }>;
  knowledgeResultRefs: string[];
  assertions: RuntimeAssertion[];
  evidence: RuntimeEvidenceLink[];
  conflicts?: RuntimeConflict[];
  scientificWeight: { assessment: "OWNER_QUALIFIED_ASSERTIONS" | "NOT_ASSESSED"; evidenceLevel: "NOT_ASSIGNED"; status: string };
};
export type ProjectSourceLibrary = {
  contract: "KNOWLEDGE_PROJECT_SOURCE_LIBRARY";
  version: "1.0.0";
  projectId: string;
  sources: ProjectSource[];
  unresolvedMentions: Array<{ mentionId: string; text: string; turnRef: string; recordedAt: string; origin: "USER_MENTIONED"; userRelevance: SourceRelevance }>;
  digest: string;
};

type BibliographicRecord = { revisionId: string; authors?: string[]; publicationDate?: string; publishedAt?: string; url?: string; officialMetadataUrl?: string; sourceType?: string };
const bibliography = new Map<string, BibliographicRecord>(([...consolidatedSourceRevisions, ...multidomainSourceRevisions] as BibliographicRecord[]).map((source) => [source.revisionId, source]));
const unique = <T>(values: T[]) => [...new Set(values)];
const detached = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const seal = ({ contract, version, projectId, sources, unresolvedMentions }: Omit<ProjectSourceLibrary, "digest">): ProjectSourceLibrary => {
  const material = { contract, version, projectId, sources, unresolvedMentions };
  return { ...material, digest: logicalDigest(material) };
};
export const emptyProjectSourceLibrary = (projectId: string) => seal({ contract: "KNOWLEDGE_PROJECT_SOURCE_LIBRARY", version: "1.0.0", projectId, sources: [], unresolvedMentions: [] });
export const safeSourceUrl = (value: string | undefined | null) => {
  if (!value) return null;
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; }
};
export const sourceShortReference = (entry: ProjectSource) => `${entry.authors[0] ?? entry.source.title}${entry.authors.length > 1 ? " et al." : ""}${entry.year ? ` (${entry.year})` : ""}`;

/** This is a project-bound read projection of Knowledge; user interest never changes evidence status. */
export const collectProjectKnowledgeSources = (library: ProjectSourceLibrary, result: KnowledgeResult): ProjectSourceLibrary => {
  if (result.request.researchProjectId !== library.projectId) throw new Error("SOURCE_LIBRARY_PROJECT_MISMATCH");
  const sources = new Map<string, ProjectSource>(library.sources.map((entry) => [entry.source.sourceId, {
    ...detached(entry), scientificWeight: { ...entry.scientificWeight, assessment: "NOT_ASSESSED" as const },
  }]));
  for (const source of result.sources) {
    const retained = sources.get(source.sourceId);
    const record = bibliography.get(source.sourceId);
    const evidence = result.evidence.filter((link) => link.sourceId === source.sourceId);
    const assertionRefs = new Set(evidence.map((link) => link.assertionId));
    const assertions = [...result.applicableAssertions, ...result.excludedAssertions, ...result.candidateAssertions]
      .filter((assertion) => assertionRefs.has(assertion.revision));
    const effective = assertions.some((assertion) => assertion.status === "OFFICIAL_EFFECTIVE");
    sources.set(source.sourceId, {
      source: detached(source), authors: record?.authors ?? [], year: (record?.publicationDate ?? record?.publishedAt)?.slice(0, 4) ?? null,
      url: safeSourceUrl(record?.url ?? record?.officialMetadataUrl) ?? (source.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/` : safeSourceUrl(source.locator)),
      publicationType: record?.sourceType ?? null,
      origins: unique([...(retained?.origins ?? []), "EXISTING_CORPUS"]),
      roles: retained?.roles ?? [evidence.some((link) => link.relation === "REFUTES") ? "CONTRADICTORY_EVIDENCE" : "BACKGROUND"],
      userRelevance: retained?.userRelevance ?? "NONE", interestHistory: retained?.interestHistory ?? [],
      knowledgeResultRefs: unique([...(retained?.knowledgeResultRefs ?? []), result.resultId]),
      // Applicability is the latest owner's qualification, never a local promotion based on preference.
      assertions: detached(assertions), evidence: detached(evidence),
      conflicts: detached(result.controversies.filter((conflict) => conflict.positionIds.some((id) => assertions.some((assertion) => [assertion.stableId, assertion.revision].includes(id))))),
      scientificWeight: { assessment: effective ? "OWNER_QUALIFIED_ASSERTIONS" : "NOT_ASSESSED", evidenceLevel: "NOT_ASSIGNED", status: source.status },
    });
  }
  return seal({ ...library, sources: [...sources.values()] });
};

const normalized = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
export const resolveProjectSource = (library: ProjectSourceLibrary, query: string): { status: "RESOLVED" | "AMBIGUOUS" | "UNRESOLVED"; matches: ProjectSource[] } => {
  const text = normalized(query);
  const matches = library.sources.filter((entry) => {
    if ([entry.source.sourceId, entry.source.doi, entry.source.pmid, entry.source.title].some((value) => value && text.includes(normalized(value)))) return true;
    const year = entry.year;
    return Boolean(year && text.includes(year) && entry.authors.some((author) => {
      const surname = normalized(author.split(/\s+/)[0] ?? "");
      return surname.length >= 3 && (` ${text} `).includes(` ${surname} `);
    }));
  });
  return { status: matches.length === 1 ? "RESOLVED" : matches.length ? "AMBIGUOUS" : "UNRESOLVED", matches };
};

export const recordSourceInterest = (library: ProjectSourceLibrary, input: { text: string; turnRef: string; recordedAt: string; explicitUse: boolean }) => {
  const relevance: SourceRelevance = input.explicitUse ? "EXPLICIT_INTEREST" : "NONE";
  const resolution = resolveProjectSource(library, input.text);
  if (resolution.status !== "RESOLVED") {
    const mention = { mentionId: `source-mention:${logicalDigest(input)}`, text: input.text, turnRef: input.turnRef, recordedAt: input.recordedAt, origin: "USER_MENTIONED" as const, userRelevance: relevance };
    return { library: seal({ ...library, unresolvedMentions: [...library.unresolvedMentions, mention] }), resolution };
  }
  const sourceId = resolution.matches[0]!.source.sourceId;
  const sources = library.sources.map((entry) => entry.source.sourceId !== sourceId ? entry : {
    ...entry, origins: unique([...entry.origins, "USER_MENTIONED" as const]),
    userRelevance: input.explicitUse ? relevance : entry.userRelevance,
    interestHistory: [...entry.interestHistory, { text: input.text, turnRef: input.turnRef, recordedAt: input.recordedAt, relevance }],
  });
  return { library: seal({ ...library, sources }), resolution };
};

export const rehydrateProjectSourceLibrary = (value: ProjectSourceLibrary, projectId: string): ProjectSourceLibrary => {
  const { digest, ...material } = value;
  if (value.contract !== "KNOWLEDGE_PROJECT_SOURCE_LIBRARY" || value.version !== "1.0.0" || value.projectId !== projectId
    || !Array.isArray(value.sources) || !Array.isArray(value.unresolvedMentions) || logicalDigest(material) !== digest
    || new Set(value.sources.map((entry) => entry.source.sourceId)).size !== value.sources.length) throw new Error("SOURCE_LIBRARY_INVALID");
  for (const entry of value.sources) {
    if (typeof entry.source.sourceId !== "string" || typeof entry.source.title !== "string" || !Array.isArray(entry.authors)
      || !Array.isArray(entry.evidence) || !Array.isArray(entry.assertions) || !Array.isArray(entry.interestHistory)
      || entry.evidence.some((link) => link.sourceId !== entry.source.sourceId)
      || !["EXPLICIT_INTEREST", "INFERRED_INTEREST", "NONE"].includes(entry.userRelevance)) throw new Error("SOURCE_LIBRARY_ENTRY_INVALID");
  }
  return JSON.parse(stableStringify(value)) as ProjectSourceLibrary;
};
