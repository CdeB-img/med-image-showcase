import { parseProjectSnapshotRef, ProjectSnapshotError, sharedPostgresProjectSnapshotStore, type ProtocolDesignerProjectSnapshotStore } from "./protocol-designer-project-snapshot.js";
import { createPostgresDocumentArchive, documentArchiveCapacity, docSha256, DocumentArchiveError, type DocumentArchiveAccess, type DocumentArchiveStore } from "./protocol-designer-document-archive.js";
import type { DocumentGenerationBody } from "../src/features/document-projection/generation-persistence.js";

const stores = new Map<string, DocumentArchiveStore>();
export const sharedDocumentArchive = (connection: string, env: Record<string, string | undefined>, snapshots: ProtocolDesignerProjectSnapshotStore) => {
  const capacity = documentArchiveCapacity(env);
  const key = docSha256(`${connection}\u0000${JSON.stringify(capacity)}`);
  let store = stores.get(key);
  if (!store) { store = createPostgresDocumentArchive(connection, snapshots, capacity); stores.set(key, store); }
  return store;
};
export const documentArchiveAccess = (value: Record<string, unknown>, proof: string | null, clientAddress: string): DocumentArchiveAccess => {
  if (typeof value.sessionId !== "string" || !value.sessionId || value.sessionId.length > 240
    || !proof || !/^[A-Za-z0-9_-]{43}$/u.test(proof)) throw new ProjectSnapshotError("PROJECT_SNAPSHOT_SESSION_MISMATCH", 403);
  return { identity: { sessionId: value.sessionId, clientAddress }, project: parseProjectSnapshotRef(value.projectRef), proof };
};
export const executeDocumentArchiveOperation = async (input: {
  body: Record<string, unknown>; proof: string | null; clientAddress: string;
  connection: string | null; environment: Record<string, string | undefined>;
  snapshots?: ProtocolDesignerProjectSnapshotStore; archive?: DocumentArchiveStore;
}): Promise<{ status: number; body: unknown }> => {
  try {
    if (Buffer.byteLength(JSON.stringify(input.body), "utf8") > 4_400_000) throw new DocumentArchiveError("DOC_ARCHIVE_PAYLOAD_TOO_LARGE", 413);
    const access = documentArchiveAccess(input.body, input.proof, input.clientAddress);
    const snapshots = input.snapshots ?? (input.connection ? sharedPostgresProjectSnapshotStore(input.connection) : null);
    const archive = input.archive ?? (input.connection && snapshots ? sharedDocumentArchive(input.connection, input.environment, snapshots) : null);
    if (!archive) throw new DocumentArchiveError("DOC_ARCHIVE_UNAVAILABLE", 503);
    const body = input.body;
    let result: unknown;
    const keys = Object.keys(body).sort().join(",");
    const requestId = () => {
      if (typeof body.requestId !== "string" || body.requestId.length > 600 || !body.requestId) throw new DocumentArchiveError("DOC_ARCHIVE_REQUEST_INVALID", 400);
      return body.requestId;
    };
    switch (body.operation) {
      case "DOC_ARCHIVE_HISTORY":
        if (keys !== "beforeOrdinal,operation,projectRef,sessionId") throw new DocumentArchiveError("DOC_ARCHIVE_REQUEST_INVALID", 400);
        result = await archive.history(access, body.beforeOrdinal === null ? undefined : body.beforeOrdinal as number); break;
      case "DOC_ARCHIVE_BODY":
        if (keys !== "generationId,operation,projectRef,sessionId" || typeof body.generationId !== "string" || body.generationId.length > 600) throw new DocumentArchiveError("DOC_ARCHIVE_REQUEST_INVALID", 400);
        result = await archive.body(access, body.generationId); break;
      case "DOC_ARCHIVE_RECEIPT":
        if (keys !== "operation,projectRef,requestId,sessionId") throw new DocumentArchiveError("DOC_ARCHIVE_REQUEST_INVALID", 400);
        result = await archive.receipt(access, requestId()); break;
      case "DOC_ARCHIVE_COMMIT": {
        if (keys !== "body,operation,projectRef,requestId,sessionId" || !body.body || typeof body.body !== "object") throw new DocumentArchiveError("DOC_ARCHIVE_REQUEST_INVALID", 400);
        const nativeBody = body.body as DocumentGenerationBody;
        const { assertDocumentArchiveBody } = await import("./protocol-designer-document-archive.js");
        const { documentNativeGeneratedAt, documentNativeProject } = await import("../src/features/document-projection/generation-persistence.js");
        assertDocumentArchiveBody(nativeBody, access.project.projectId);
        const binding = documentNativeProject(nativeBody.native);
        if (binding.projectVersion !== access.project.versionId || binding.projectDigest !== access.project.projectDigest
          || nativeBody.files.some(file => file.renderOrigin !== "GENERATION_TIME")) throw new DocumentArchiveError("DOC_ARCHIVE_PROJECT_BINDING_INVALID", 403);
        const text = JSON.stringify(nativeBody);
        await archive.admit(access, { requestId: requestId(), requestSha256: docSha256(text),
          generatedAt: documentNativeGeneratedAt(nativeBody.native), reservedBytes: Buffer.byteLength(text, "utf8") });
        result = await archive.commit(access, requestId(), nativeBody); break;
      }
      default: throw new DocumentArchiveError("DOC_ARCHIVE_OPERATION_INVALID", 400);
    }
    return { status: 200, body: { contract: "DOC_GENERATION_ARCHIVE_V1", result } };
  } catch (error) {
    const failure = error instanceof DocumentArchiveError || error instanceof ProjectSnapshotError
      ? error : new DocumentArchiveError("DOC_ARCHIVE_UNAVAILABLE", 503);
    return { status: failure.status, body: { error: { code: failure.code } } };
  }
};
