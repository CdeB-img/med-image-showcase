import { ensureServerProjectSnapshot } from "../protocol-designer/product-bridge-client";
import type { ResearchProjectOwnerProjection } from "../research-project-construction/contribution-owner-boundary";
import { DOC_ARCHIVE_CONTRACT, type DocumentGenerationBody, type DocumentGenerationRef, type DocumentHistoryPage,
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
  import(requestId: string, body: DocumentGenerationBody, displayVersion: number): Promise<DocumentPersistenceReceipt>;
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
    history: beforeOrdinal => operation({ operation: "DOC_ARCHIVE_HISTORY", beforeOrdinal: beforeOrdinal ?? null }),
    receipt: requestId => operation({ operation: "DOC_ARCHIVE_RECEIPT", requestId }),
    import: (requestId, body, displayVersion) => operation({ operation: "DOC_ARCHIVE_IMPORT", requestId, body, displayVersion }),
    async body(generationId) {
      const result = await operation<{ ref: DocumentGenerationRef; body: DocumentGenerationBody }>({ operation: "DOC_ARCHIVE_BODY", generationId });
      if (result?.ref?.generationId !== generationId || result.ref.project.projectId !== project.projectId
        || result.ref.persistenceState !== "COMMITTED" || result.body?.contract !== DOC_ARCHIVE_CONTRACT
        || await documentTextSha256(JSON.stringify(result.body)) !== result.ref.bodySha256
        || new TextEncoder().encode(JSON.stringify(result.body)).byteLength !== result.ref.bodyBytes) {
        throw new DocumentArchiveClientError("DOC_ARCHIVE_BODY_CORRUPT");
      }
      return result;
    },
  };
};
