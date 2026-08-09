import { logicalDigest } from "../canonical";
import type { ExternalProviderSearchOutput, ExternalQueryPlan } from "./types";

export const EXTERNAL_EVIDENCE_CACHE_SCHEMA_VERSION = "1.2.0" as const;
export const EXTERNAL_EVIDENCE_CACHE_KEY = "noxia-external-evidence-cache-v1-2" as const;
export const MAX_EXTERNAL_EVIDENCE_CACHE_ENTRIES = 12;

export type ExternalEvidenceCacheEntry = {
  schemaVersion: typeof EXTERNAL_EVIDENCE_CACHE_SCHEMA_VERSION;
  cacheKey: string;
  createdAt: string;
  providerId: string;
  queryPlanDigest: string;
  contextDigest: string;
  freshnessRequirement: string;
  output: ExternalProviderSearchOutput;
};

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isCacheEntry = (value: unknown): value is ExternalEvidenceCacheEntry => isRecord(value)
  && value.schemaVersion === EXTERNAL_EVIDENCE_CACHE_SCHEMA_VERSION
  && typeof value.cacheKey === "string"
  && typeof value.createdAt === "string"
  && typeof value.providerId === "string"
  && typeof value.queryPlanDigest === "string"
  && typeof value.contextDigest === "string"
  && typeof value.freshnessRequirement === "string"
  && isRecord(value.output);

const readEntries = (storage: Pick<Storage, "getItem">) => {
  const raw = storage.getItem(EXTERNAL_EVIDENCE_CACHE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isCacheEntry) : [];
  } catch {
    return [];
  }
};

export const externalEvidenceCacheIdentity = (plan: ExternalQueryPlan) => logicalDigest({
  providerId: plan.providerId,
  branches: plan.branches.map((branch) => ({ branchId: branch.branchId, query: branch.query })),
  filters: plan.filters,
  parameters: plan.parameters,
  contextDigest: plan.contextDigest,
  freshnessRequirement: plan.freshnessRequirement,
});

export const readExternalEvidenceCache = (storage: Pick<Storage, "getItem">, plan: ExternalQueryPlan) => {
  const cacheKey = externalEvidenceCacheIdentity(plan);
  return readEntries(storage).find((entry) => entry.cacheKey === cacheKey) ?? null;
};

export const saveExternalEvidenceCache = (
  storage: Pick<Storage, "getItem" | "setItem">,
  plan: ExternalQueryPlan,
  output: ExternalProviderSearchOutput,
  createdAt: string,
) => {
  const cacheKey = externalEvidenceCacheIdentity(plan);
  const entry: ExternalEvidenceCacheEntry = {
    schemaVersion: EXTERNAL_EVIDENCE_CACHE_SCHEMA_VERSION,
    cacheKey,
    createdAt,
    providerId: plan.providerId,
    queryPlanDigest: plan.digest,
    contextDigest: plan.contextDigest,
    freshnessRequirement: plan.freshnessRequirement,
    output,
  };
  const entries = [entry, ...readEntries(storage).filter((candidate) => candidate.cacheKey !== cacheKey)]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, MAX_EXTERNAL_EVIDENCE_CACHE_ENTRIES);
  storage.setItem(EXTERNAL_EVIDENCE_CACHE_KEY, JSON.stringify(entries));
  return entry;
};

export const deleteExternalEvidenceCache = (storage: Pick<Storage, "removeItem">) => storage.removeItem(EXTERNAL_EVIDENCE_CACHE_KEY);
