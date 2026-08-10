import { documentaryDigest, stableStringify } from "./canonical";
import type { PatternCatalog, PatternCatalogHistory, PatternCatalogSnapshot } from "./types";
import { DOCUMENTARY_KNOWLEDGE_SCHEMA_VERSION } from "./types";

export const createPatternCatalogSnapshot = (catalog: PatternCatalog, input: {
  createdAt: string;
  reason: string;
  priorSnapshotId?: string | null;
}): PatternCatalogSnapshot => ({
  snapshotId: `DKS-${documentaryDigest([catalog.catalogId, catalog.version, catalog.digest, input.createdAt, input.reason]).slice(5, 17).toUpperCase()}`,
  schemaVersion: DOCUMENTARY_KNOWLEDGE_SCHEMA_VERSION,
  catalogId: catalog.catalogId,
  catalogVersion: catalog.version,
  catalogDigest: catalog.digest,
  priorSnapshotId: input.priorSnapshotId ?? null,
  createdAt: input.createdAt,
  reason: input.reason,
  payload: JSON.parse(stableStringify(catalog)) as PatternCatalog,
});

export const appendPatternCatalogSnapshot = (history: PatternCatalogHistory, snapshot: PatternCatalogSnapshot): PatternCatalogHistory => {
  if (history.snapshots.some((item) => item.snapshotId === snapshot.snapshotId)) return history;
  const latest = history.snapshots.at(-1) ?? null;
  if (latest && snapshot.priorSnapshotId !== latest.snapshotId) throw new Error("PATTERN_HISTORY_NON_APPEND_ONLY");
  return { ...history, snapshots: [...history.snapshots, snapshot] };
};

export const createPatternCatalogHistory = (catalog: PatternCatalog, createdAt: string): PatternCatalogHistory => {
  const first = createPatternCatalogSnapshot(catalog, { createdAt, reason: "INITIAL_CATALOG" });
  return { historyId: `DKH-${documentaryDigest([catalog.catalogId, createdAt]).slice(5, 17).toUpperCase()}`, snapshots: [first] };
};

export const exportPatternCatalog = (catalog: PatternCatalog) => `${stableStringify(catalog)}\n`;

export const importPatternCatalog = (serialized: string): PatternCatalog => {
  const value = JSON.parse(serialized) as PatternCatalog;
  if (value.contractVersion !== DOCUMENTARY_KNOWLEDGE_SCHEMA_VERSION) throw new Error("UNSUPPORTED_PATTERN_CATALOG_SCHEMA");
  if (value.boundary !== "DOCUMENTARY_KNOWLEDGE_ONLY_NOT_SCIENCE_NOT_RULE_NOT_DECISION") throw new Error("INVALID_PATTERN_CATALOG_BOUNDARY");
  if (!value.catalogId || !value.digest || !Array.isArray(value.patterns) || !Array.isArray(value.sourceCatalog)) throw new Error("INVALID_PATTERN_CATALOG");
  return value;
};
