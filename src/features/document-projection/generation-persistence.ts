import type { DocumentProjection } from "./types.js";
import type { DrciDraftPack } from "./drci-draft-contract.js";
import type { StudyDeliverableFile } from "./study-deliverable-contract.js";

/** Physical DOC persistence contracts. Native identities and scientific states are unchanged. */
export const DOC_ARCHIVE_CONTRACT = "DOC_GENERATION_ARCHIVE_V1" as const;
export const DOC_HISTORY_PAGE_SIZE = 25;
export type DocumentProjectBinding = Readonly<{ projectId: string; projectVersion: string; projectDigest: string }>;
export type DocumentNativeGeneration =
  | Readonly<{ family: "TEMPLATE"; value: DocumentProjection }>
  | Readonly<{ family: "DRCI"; value: DrciDraftPack }>;
export type FrozenDocumentFile = StudyDeliverableFile & Readonly<{
  artifactId: string;
  byteLength: number;
  sha256: string;
  renderOrigin: "GENERATION_TIME";
}>;
export type DocumentGenerationBody = Readonly<{
  contract: typeof DOC_ARCHIVE_CONTRACT;
  native: DocumentNativeGeneration;
  files: readonly FrozenDocumentFile[];
  rendererVersion: string;
  buildCommit: string | null;
}>;
export type DocumentFileManifest = Omit<FrozenDocumentFile, "content">;
export type DocumentGenerationRef = Readonly<{
  contract: typeof DOC_ARCHIVE_CONTRACT;
  generationId: string;
  family: DocumentNativeGeneration["family"];
  project: DocumentProjectBinding;
  /** Physical archive cursor across internal projections and real generations. */
  ordinal: number;
  /** Immutable per-family counter; DRCI displays Gn, independently of Project Vn. */
  displayVersion: number;
  generatedAt: string;
  predecessorId: string | null;
  bodySha256: string;
  bodyBytes: number;
  files: readonly DocumentFileManifest[];
  persistenceState: "COMMITTED";
}>;
export type DocumentPersistenceReceipt = Readonly<{
  contract: typeof DOC_ARCHIVE_CONTRACT;
  requestId: string;
  generation: DocumentGenerationRef;
}>;
export type DocumentHistoryPage = Readonly<{ entries: readonly DocumentGenerationRef[]; nextBeforeOrdinal: number | null }>;
export type DocumentArchivePointer = Readonly<{
  contract: typeof DOC_ARCHIVE_CONTRACT;
  projectId: string;
  historyState: "NOT_LOADED";
  currentGenerationId: string | null;
  currentProjectionId: string | null;
  currentGeneration?: Readonly<Pick<DocumentGenerationRef, "generationId" | "project" | "displayVersion" | "generatedAt">>;
  pendingRequestId: string | null;
  storageMode: "DURABLE_ONLY";
}>;

export const documentNativeIdentity = (native: DocumentNativeGeneration) => native.family === "DRCI"
  ? `${native.value.project.projectId}:document-generation:${native.value.packDigest}`
  : native.value.projectionId;
export const documentNativeProject = (native: DocumentNativeGeneration): DocumentProjectBinding => native.family === "DRCI"
  ? native.value.project : native.value.source;
export const documentNativeGeneratedAt = (native: DocumentNativeGeneration) => native.family === "DRCI"
  ? native.value.generatedAt : native.value.requestedAt;
export const documentNativePredecessor = (native: DocumentNativeGeneration): string | null => native.family === "TEMPLATE"
  ? native.value.priorProjectionId : native.value.humanRevision
    ? `${native.value.project.projectId}:document-generation:${native.value.humanRevision.parentPackDigest}` : null;
export const documentFileManifest = ({ content: _content, ...manifest }: FrozenDocumentFile): DocumentFileManifest => manifest;

/** Physical receipt boundary only; scientific validation remains at native owners. */
export const isDocumentGenerationRef = (value: unknown, projectId: string): value is DocumentGenerationRef => {
  if (!value || typeof value !== "object") return false;
  const ref = value as Partial<DocumentGenerationRef>;
  const text = (item: unknown, max: number): item is string => typeof item === "string" && item.length > 0 && item.length <= max;
  return ref.contract === DOC_ARCHIVE_CONTRACT && text(ref.generationId, 600)
    && (ref.family === "TEMPLATE" || ref.family === "DRCI") && ref.persistenceState === "COMMITTED"
    && ref.project?.projectId === projectId && text(ref.project.projectVersion, 360) && text(ref.project.projectDigest, 80)
    && Number.isSafeInteger(ref.ordinal) && ref.ordinal! > 0 && Number.isSafeInteger(ref.displayVersion) && ref.displayVersion! > 0
    && text(ref.generatedAt, 100) && Number.isFinite(Date.parse(ref.generatedAt))
    && (ref.predecessorId === null || text(ref.predecessorId, 600))
    && typeof ref.bodySha256 === "string" && /^[a-f0-9]{64}$/u.test(ref.bodySha256)
    && Number.isSafeInteger(ref.bodyBytes) && ref.bodyBytes! > 0 && Array.isArray(ref.files)
    && ref.files.every(file => file && typeof file === "object" && !("content" in file)
      && text(file.artifactId, 600) && text(file.fileName, 240) && !/[/\\]/u.test(file.fileName) && !file.fileName.includes("\u0000")
      && ["HTML", "MARKDOWN", "CSV", "JSON"].includes(file.format) && text(file.mimeType, 120)
      && file.renderOrigin === "GENERATION_TIME" && Number.isSafeInteger(file.byteLength) && file.byteLength >= 0
      && /^[a-f0-9]{64}$/u.test(file.sha256));
};
