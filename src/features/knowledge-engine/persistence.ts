import { canPersistKnowledgeQuestion } from "./privacy";
import { KNOWLEDGE_PROVIDER_REGISTRY } from "./provider-registry";
import type { KnowledgeRequest, KnowledgeResult } from "./types";
import type { ProjectionDepth } from "./understand-projection";

export const KNOWLEDGE_PERSISTENCE_SCHEMA_VERSION = "1.1.0" as const;
export const KNOWLEDGE_SNAPSHOT_KEY = "noxia-knowledge-engine-snapshots-v1-1" as const;
export const MAX_KNOWLEDGE_SNAPSHOTS = 20;

export type KnowledgeProjectionSettings = {
  depth: ProjectionDepth;
  openDisclosure: "ANSWER" | "WHY" | "LIMITS" | "EVIDENCE";
};

export type KnowledgeSnapshot = {
  sessionId: string;
  requestId: string;
  timestamp: string;
  schemaVersion: typeof KNOWLEDGE_PERSISTENCE_SCHEMA_VERSION;
  contextVersion: number;
  request: KnowledgeRequest;
  result: KnowledgeResult;
  providerVersions: Record<string, string>;
  registryDigest: string;
  corpusRepresentationDigests: Record<string, string>;
  projectionSettings: KnowledgeProjectionSettings;
};

export type KnowledgeSnapshotState = "CURRENT" | "STALE_SCHEMA" | "STALE_PROVIDER_VERSION" | "STALE_CORPUS" | "STALE_QUESTION" | "STALE_CONTEXT" | "INVALID";
export type LoadedKnowledgeSnapshot = { snapshot: KnowledgeSnapshot; state: KnowledgeSnapshotState; reasons: string[] };

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isKnowledgeSnapshot = (value: unknown): value is KnowledgeSnapshot => {
  if (!isRecord(value) || !isRecord(value.request) || !isRecord(value.result) || !isRecord(value.providerVersions) || !isRecord(value.projectionSettings)) return false;
  return typeof value.sessionId === "string"
    && typeof value.requestId === "string"
    && typeof value.timestamp === "string"
    && typeof value.schemaVersion === "string"
    && typeof value.contextVersion === "number"
    && value.requestId === value.request.requestId
    && value.requestId === (value.result.request as Record<string, unknown> | undefined)?.requestId;
};

const readRawSnapshots = (storage: Pick<Storage, "getItem">): unknown[] => {
  const raw = storage.getItem(KNOWLEDGE_SNAPSHOT_KEY);
  if (!raw) return [];
  try {
    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

export const createKnowledgeSnapshot = (input: {
  sessionId: string;
  contextVersion: number;
  result: KnowledgeResult;
  projectionSettings: KnowledgeProjectionSettings;
  timestamp?: string;
}): KnowledgeSnapshot => {
  if (!canPersistKnowledgeQuestion(input.result.request.originalQuestion) || input.result.request.sensitivityClassification === "RESTRICTED_PERSONAL") throw new Error("SENSITIVE_KNOWLEDGE_SNAPSHOT_NOT_PERSISTED");
  return {
    sessionId: input.sessionId,
    requestId: input.result.request.requestId,
    timestamp: input.timestamp ?? new Date().toISOString(),
    schemaVersion: KNOWLEDGE_PERSISTENCE_SCHEMA_VERSION,
    contextVersion: input.contextVersion,
    request: input.result.request,
    result: input.result,
    providerVersions: input.result.providerVersions,
    registryDigest: input.result.registrySnapshotRef,
    corpusRepresentationDigests: Object.fromEntries(input.result.provenance.map((item) => [item.providerId, item.representationDigest])),
    projectionSettings: input.projectionSettings,
  };
};

export const saveKnowledgeSnapshot = (storage: Pick<Storage, "getItem" | "setItem">, snapshot: KnowledgeSnapshot) => {
  if (!canPersistKnowledgeQuestion(snapshot.request.originalQuestion) || snapshot.request.sensitivityClassification === "RESTRICTED_PERSONAL") throw new Error("SENSITIVE_KNOWLEDGE_SNAPSHOT_NOT_PERSISTED");
  const valid = readRawSnapshots(storage).filter(isKnowledgeSnapshot);
  const next = [snapshot, ...valid.filter((item) => !(item.sessionId === snapshot.sessionId && item.requestId === snapshot.requestId && item.contextVersion === snapshot.contextVersion && item.result.resultDigest === snapshot.result.resultDigest))]
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
    .slice(0, MAX_KNOWLEDGE_SNAPSHOTS);
  storage.setItem(KNOWLEDGE_SNAPSHOT_KEY, JSON.stringify(next));
  return next;
};

export const assessKnowledgeSnapshot = (snapshot: KnowledgeSnapshot, current: {
  schemaVersion?: string;
  registryDigest?: string;
  providerVersions?: Record<string, string>;
  corpusRepresentationDigests?: Record<string, string>;
  question?: string;
  contextVersion?: number;
} = {}): LoadedKnowledgeSnapshot => {
  const reasons: string[] = [];
  let state: KnowledgeSnapshotState = "CURRENT";
  const schemaVersion = current.schemaVersion ?? KNOWLEDGE_PERSISTENCE_SCHEMA_VERSION;
  if (snapshot.schemaVersion !== schemaVersion) { state = "STALE_SCHEMA"; reasons.push("Le schéma de persistance a changé."); }
  else if (current.registryDigest && snapshot.registryDigest !== current.registryDigest) { state = "STALE_PROVIDER_VERSION"; reasons.push("Le registre ou une version de provider a changé."); }
  else if (current.providerVersions && Object.entries(snapshot.providerVersions).some(([id, version]) => current.providerVersions?.[id] !== version)) { state = "STALE_PROVIDER_VERSION"; reasons.push("Au moins un provider utilisé n’est plus à la même version."); }
  else if (current.corpusRepresentationDigests && Object.entries(snapshot.corpusRepresentationDigests).some(([id, digest]) => current.corpusRepresentationDigests?.[id] !== digest)) { state = "STALE_CORPUS"; reasons.push("La représentation locale d’un corpus utilisé a changé."); }
  else if (current.question !== undefined && snapshot.request.originalQuestion !== current.question) { state = "STALE_QUESTION"; reasons.push("La question scientifique a changé."); }
  else if (current.contextVersion !== undefined && snapshot.contextVersion !== current.contextVersion) { state = "STALE_CONTEXT"; reasons.push("Le contexte de session a changé."); }
  return { snapshot, state, reasons };
};

export const loadKnowledgeSnapshots = (storage: Pick<Storage, "getItem">, current: Parameters<typeof assessKnowledgeSnapshot>[1] = {}): LoadedKnowledgeSnapshot[] => readRawSnapshots(storage)
  .filter(isKnowledgeSnapshot)
  .map((value) => assessKnowledgeSnapshot(value, { registryDigest: KNOWLEDGE_PROVIDER_REGISTRY.digest, ...current }))
  .sort((left, right) => right.snapshot.timestamp.localeCompare(left.snapshot.timestamp));

export const deleteKnowledgeSnapshots = (storage: Pick<Storage, "removeItem">) => storage.removeItem(KNOWLEDGE_SNAPSHOT_KEY);
