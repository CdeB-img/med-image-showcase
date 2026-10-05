import type { DocumentProjection } from "./types.js";
import type { DrciDraftPack } from "./drci-draft-contract.js";
import type { StudyDeliverableFile } from "./study-deliverable-portfolio.js";

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
  renderOrigin: "GENERATION_TIME" | "MIGRATION_TIME";
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
  ordinal: number;
  /** Legacy labels are frozen, never derived from a page index. */
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
  pendingRequestId: string | null;
  /** Bodies can be cut over only after full per-Project migration verification. */
  legacyCoverageVerified: boolean;
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
