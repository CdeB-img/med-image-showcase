import { logicalDigest, uniqueSorted } from "../canonical";
import type { RuntimeAssertion, RuntimeEvidenceLink, RuntimeSource } from "../types";

export type ExternalAssertionRecord = {
  stableId?: string;
  revisionId: string;
  status?: string;
  subjectEntityId?: string;
  objectEntityId?: string | null;
  literalValue?: unknown;
  predicate?: string;
  statement?: { text?: string; subject?: unknown; predicate?: string; object?: unknown };
  facets?: {
    concepts?: string[];
    modalities?: string[];
    techniques?: unknown[];
    measurements?: unknown[];
    findings?: string[];
    limitations?: string[];
    sourceTypes?: unknown[];
    populations?: unknown[];
    diseases?: unknown[];
    pathologies?: unknown[];
    methods?: unknown[];
  };
  population?: string;
  context?: Record<string, unknown>;
  polarity?: RuntimeAssertion["polarity"];
  reviewState?: string;
  maturity?: string;
  quality?: string;
  scientificMaturity?: string;
  confidence?: string;
  evidenceQuality?: string | { methodologicalQuality?: string };
};

export type ExternalEvidenceRecord = {
  evidenceLinkId: string;
  assertionRevisionId: string;
  sourceRevisionId: string;
  relationType: RuntimeEvidenceLink["relation"];
  locator?: string;
  extraction?: { section?: string };
  limitations?: string[];
};

export type ExternalSourceRecord = {
  stableId: string;
  revisionId: string;
  revisionNumber?: number;
  version?: string;
  title?: string;
  status?: string;
  documentStatus?: string;
  locator?: string;
  officialMetadataUrl?: string;
  doi?: string;
  pmid?: string;
  pmcid?: string;
  metadata?: { documentStatus?: string; pmcid?: string };
};

const cleanId = (value: unknown) => typeof value === "string" ? value.split(":").at(-1)?.replace(/-/g, " ") ?? value : JSON.stringify(value);

export const renderAtomicStatement = (assertion: ExternalAssertionRecord) => {
  if (typeof assertion?.statement?.text === "string") return assertion.statement.text;
  const statement = assertion?.statement ?? {};
  if (typeof statement.object === "string" && /[ .]/.test(statement.object) && statement.object.length > 35) return statement.object;
  return [cleanId(statement.subject ?? assertion.subjectEntityId), String(statement.predicate ?? assertion.predicate ?? "RELATION").replace(/_/g, " ").toLocaleLowerCase("fr-FR"), cleanId(statement.object ?? assertion.objectEntityId ?? "")].filter(Boolean).join(" — ");
};

export const normalizeEvidenceLink = (link: ExternalEvidenceRecord): RuntimeEvidenceLink => ({
  evidenceId: link.evidenceLinkId,
  assertionId: link.assertionRevisionId,
  sourceId: link.sourceRevisionId,
  relation: link.relationType,
  locator: link.locator ?? link.extraction?.section ?? "LOCALISATEUR_NON_DOCUMENTE",
  limitations: uniqueSorted(link.limitations ?? []),
});

export const normalizeSource = (source: ExternalSourceRecord): RuntimeSource => ({
  sourceId: source.revisionId ?? source.stableId,
  revision: String(source.revisionNumber ?? source.version ?? "1"),
  title: source.title ?? source.stableId,
  status: source.metadata?.documentStatus ?? source.documentStatus ?? source.status ?? "UNKNOWN",
  locator: source.locator ?? source.officialMetadataUrl,
  doi: source.doi ?? undefined,
  pmid: source.pmid ?? undefined,
  pmcid: source.metadata?.pmcid ?? source.pmcid ?? undefined,
});

const corpusQuality = (assertion: ExternalAssertionRecord) => {
  const embedded = typeof assertion.evidenceQuality === "string"
    ? assertion.evidenceQuality
    : assertion.evidenceQuality?.methodologicalQuality;
  return [assertion.quality, embedded, assertion.confidence]
    .find((value) => value && ["VERY_LOW", "LOW", "MODERATE", "HIGH"].includes(value)) ?? null;
};

const facetValues = (values: unknown[]) => uniqueSorted(values.flatMap((value) => {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const identity = [record.stableId, record.entityId, record.objectId, record.id, record.label, record.name]
    .find((candidate) => typeof candidate === "string");
  return typeof identity === "string" ? [identity] : [];
}));

const corpusSourceTypes = (assertion: ExternalAssertionRecord) => {
  const embedded = typeof assertion.evidenceQuality === "object" ? assertion.evidenceQuality.methodologicalQuality : null;
  return facetValues([
    ...facetValues(assertion.facets?.sourceTypes ?? []),
    ...(embedded && !["VERY_LOW", "LOW", "MODERATE", "HIGH"].includes(embedded) ? [embedded] : []),
  ]);
};

const corpusPopulations = (assertion: ExternalAssertionRecord) => facetValues([
  ...facetValues(assertion.facets?.populations ?? []),
  ...(assertion.population && !/^(NOT_APPLICABLE|UNKNOWN)$/u.test(assertion.population) ? [assertion.population] : []),
]);

export const baseAssertion = (assertion: ExternalAssertionRecord, providerId: string, evidenceLinks: RuntimeEvidenceLink[]): RuntimeAssertion => ({
  stableId: assertion.stableId ?? assertion.revisionId,
  revision: assertion.revisionId,
  providerId,
  status: assertion.status === "CANDIDATE" ? "ASSERTION_CANDIDATE" : "OFFICIAL_EFFECTIVE",
  text: renderAtomicStatement(assertion),
  atomicContent: typeof assertion.subjectEntityId === "string"
    && typeof assertion.predicate === "string"
    && typeof (assertion.objectEntityId ?? assertion.literalValue) === "string"
    ? {
      subject: assertion.subjectEntityId,
      predicate: assertion.predicate,
      object: assertion.objectEntityId ?? assertion.literalValue,
    }
    : assertion.statement,
  conceptIds: uniqueSorted(assertion.facets?.concepts ?? []),
  modality: assertion.facets?.modalities?.[0],
  context: assertion.context ?? {},
  polarity: assertion.polarity ?? "UNKNOWN",
  evidenceRelations: uniqueSorted(evidenceLinks.filter((link) => link.assertionId === assertion.revisionId).map((link) => link.relation)),
  limitations: uniqueSorted(assertion.facets?.limitations ?? []),
  reviewStatus: assertion.reviewState ?? "AUTOMATED_REVIEW_NOT_HUMAN_REVIEW",
  locator: evidenceLinks.find((link) => link.assertionId === assertion.revisionId)?.locator ?? "LOCALISATEUR_NON_DOCUMENTE",
  applicability: "UNKNOWN_APPLICABILITY",
  applicabilityReasons: [],
  scientificQualification: {
    maturity: assertion.scientificMaturity ?? assertion.maturity ?? null,
    methodologicalQuality: corpusQuality(assertion),
    sourceTypes: corpusSourceTypes(assertion),
    populations: corpusPopulations(assertion),
    pathologies: facetValues([...(assertion.facets?.diseases ?? []), ...(assertion.facets?.pathologies ?? [])]),
    techniques: facetValues([...(assertion.facets?.techniques ?? []), ...(assertion.facets?.methods ?? [])]),
    measurements: facetValues(assertion.facets?.measurements ?? []),
  },
});

export const representationDigest = (providerId: string, version: string, values: unknown[]) => logicalDigest({ providerId, version, values });
