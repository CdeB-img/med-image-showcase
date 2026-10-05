import { ensureServerProjectSnapshot } from "../protocol-designer/product-bridge-client";
import type { ResearchProjectOwnerProjection } from "../research-project-construction/contribution-owner-boundary";
import { DOC_ARCHIVE_CONTRACT, DOC_HISTORY_PAGE_SIZE, isDocumentGenerationRef, documentNativeIdentity, documentNativeProject, documentFileManifest, type DocumentGenerationBody, type DocumentGenerationRef, type DocumentHistoryPage,
  type DocumentPersistenceReceipt } from "./generation-persistence";

export class DocumentArchiveClientError extends Error {
  constructor(readonly code: string) { super(code); }
}
export const documentTextSha256 = async (text: string) => {
  if (!globalThis.crypto?.subtle) throw new DocumentArchiveClientError("DOC_ARCHIVE_HASH_UNAVAILABLE");
  const hash = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, "0")).join("");
};
export type DocumentArchiveClient = Readonly<{
  history(beforeOrdinal?: number): Promise<DocumentHistoryPage>;
  body(generationId: string): Promise<{ ref: DocumentGenerationRef; body: DocumentGenerationBody }>;
  receipt(requestId: string): Promise<DocumentPersistenceReceipt | null>;
  commit(requestId: string, body: DocumentGenerationBody): Promise<DocumentPersistenceReceipt>;
}>;
export const createDocumentArchiveClient = (sessionId: string, project: ResearchProjectOwnerProjection): DocumentArchiveClient => {
  const operation = async <T>(command: Record<string, unknown>): Promise<T> => {
    const registration = await ensureServerProjectSnapshot(sessionId, project);
    const response = await fetch("/api/protocol-designer-bridge", { method: "POST", credentials: "same-origin",
      headers: { "content-type": "application/json", "x-noxia-project-snapshot-proof": registration.proof },
      body: JSON.stringify({ ...command, sessionId, projectRef: registration.ref }) });
    const value = await response.json().catch(() => null);
    if (!response.ok || value?.contract !== DOC_ARCHIVE_CONTRACT || !("result" in value)) {
      throw new DocumentArchiveClientError(value?.error?.code ?? "DOC_ARCHIVE_UNAVAILABLE");
    }
    return value.result as T;
  };
  return {
    async history(beforeOrdinal) {
      const page = await operation<DocumentHistoryPage>({ operation: "DOC_ARCHIVE_HISTORY", beforeOrdinal: beforeOrdinal ?? null });
      if (!page || !Array.isArray(page.entries) || page.entries.length > DOC_HISTORY_PAGE_SIZE || !page.entries.every(ref => isDocumentGenerationRef(ref, project.projectId))
        || !(page.nextBeforeOrdinal === null || Number.isSafeInteger(page.nextBeforeOrdinal) && page.nextBeforeOrdinal > 0)) throw new DocumentArchiveClientError("DOC_ARCHIVE_METADATA_INVALID");
      return page;
    },
    async receipt(requestId) {
      const receipt = await operation<DocumentPersistenceReceipt | null>({ operation: "DOC_ARCHIVE_RECEIPT", requestId });
      if (receipt !== null && (!receipt || receipt.contract !== DOC_ARCHIVE_CONTRACT || receipt.requestId !== requestId || !isDocumentGenerationRef(receipt.generation, project.projectId)))
        throw new DocumentArchiveClientError("DOC_ARCHIVE_RECEIPT_INVALID");
      return receipt;
    },
    async commit(requestId, body) {
      const receipt = await operation<DocumentPersistenceReceipt>({ operation: "DOC_ARCHIVE_COMMIT", requestId, body });
      if (!receipt || receipt.contract !== DOC_ARCHIVE_CONTRACT || receipt.requestId !== requestId || !isDocumentGenerationRef(receipt.generation, project.projectId)
        || receipt.generation.generationId !== documentNativeIdentity(body.native)
        || receipt.generation.project.projectVersion !== documentNativeProject(body.native).projectVersion
        || receipt.generation.project.projectDigest !== documentNativeProject(body.native).projectDigest
        || receipt.generation.bodyBytes !== new TextEncoder().encode(JSON.stringify(body)).byteLength
        || receipt.generation.bodySha256 !== await documentTextSha256(JSON.stringify(body))) throw new DocumentArchiveClientError("DOC_ARCHIVE_RECEIPT_INVALID");
      return receipt;
    },
    async body(generationId) {
      const result = await operation<{ ref: DocumentGenerationRef; body: DocumentGenerationBody }>({ operation: "DOC_ARCHIVE_BODY", generationId });
      if (!result || !isDocumentGenerationRef(result.ref, project.projectId) || result.ref.generationId !== generationId
        || result.ref.persistenceState !== "COMMITTED" || result.body?.contract !== DOC_ARCHIVE_CONTRACT
        || await documentTextSha256(JSON.stringify(result.body)) !== result.ref.bodySha256
        || new TextEncoder().encode(JSON.stringify(result.body)).byteLength !== result.ref.bodyBytes) {
        throw new DocumentArchiveClientError("DOC_ARCHIVE_BODY_CORRUPT");
      }
      const binding = result.body.native && documentNativeProject(result.body.native);
      // Metadata is JSONB: property order is not byte identity. The immutable
      // body is TEXT; compare manifests/bindings by fields, never JSON ordering.
      if (!binding || documentNativeIdentity(result.body.native) !== generationId
        || binding.projectId !== result.ref.project.projectId || binding.projectVersion !== result.ref.project.projectVersion || binding.projectDigest !== result.ref.project.projectDigest
        || result.body.files.length !== result.ref.files.length
        || result.body.files.some((file, index) => { const manifest = documentFileManifest(file); return Object.keys(manifest).some(key => manifest[key as keyof typeof manifest] !== result.ref.files[index][key as keyof typeof manifest]); })) throw new DocumentArchiveClientError("DOC_ARCHIVE_BODY_CORRUPT");
      for (const file of result.body.files) if (await documentTextSha256(file.content) !== file.sha256 || new TextEncoder().encode(file.content).byteLength !== file.byteLength)
        throw new DocumentArchiveClientError("DOC_ARCHIVE_BODY_CORRUPT");
      return result;
    },
  };
};
