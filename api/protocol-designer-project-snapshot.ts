import { durableGuardConnectionString } from "../server/protocol-designer-durable-guard.js";
import {
  PROJECT_SNAPSHOT_MAX_BYTES,
  ProjectSnapshotError,
  sharedPostgresProjectSnapshotStore,
  type ProtocolDesignerProjectSnapshotStore,
} from "../server/protocol-designer-project-snapshot.js";

type Headers = Record<string, string | string[] | undefined>;
type ApiRequest = { method?: string; headers: Headers; body?: unknown; socket?: { remoteAddress?: string } };
type ApiResponse = { status(code: number): ApiResponse; setHeader(name: string, value: string): void; json(value: unknown): void };
const header = (headers: Headers, name: string) => {
  const value = Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1];
  return Array.isArray(value) ? value[0] : value;
};
const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export const handleProtocolDesignerProjectSnapshot = async (
  request: ApiRequest,
  response: ApiResponse,
  environment: Record<string, string | undefined> = process.env,
  dependencies: { store?: ProtocolDesignerProjectSnapshotStore } = {},
) => {
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  if (request.method !== "POST") return response.status(405).json({ error: { code: "METHOD_NOT_ALLOWED" } });
  const origin = header(request.headers, "origin");
  const host = header(request.headers, "x-forwarded-host") ?? header(request.headers, "host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return response.status(403).json({ error: { code: "ORIGIN_NOT_ALLOWED" } });
    } catch { return response.status(403).json({ error: { code: "ORIGIN_NOT_ALLOWED" } }); }
  }
  if (!(header(request.headers, "content-type") ?? "").toLowerCase().startsWith("application/json")) {
    return response.status(415).json({ error: { code: "INVALID_CONTENT_TYPE" } });
  }
  let body = request.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return response.status(400).json({ error: { code: "INVALID_REQUEST" } }); }
  }
  const serialized = JSON.stringify(body);
  if (serialized && Buffer.byteLength(serialized) > PROJECT_SNAPSHOT_MAX_BYTES) {
    return response.status(413).json({ error: { code: "PROJECT_SNAPSHOT_TOO_LARGE" } });
  }
  if (!object(body) || typeof body.sessionId !== "string" || !object(body.project)) {
    return response.status(400).json({ error: { code: "PROJECT_SNAPSHOT_REQUEST_INVALID" } });
  }
  const connection = durableGuardConnectionString(environment);
  if (!connection && !dependencies.store) return response.status(503).json({ error: { code: "PROJECT_SNAPSHOT_STORE_UNAVAILABLE" } });
  const proof = header(request.headers, "x-noxia-project-snapshot-proof") ?? null;
  if (proof && !/^[A-Za-z0-9_-]{43}$/u.test(proof)) {
    return response.status(403).json({ error: { code: "PROJECT_SNAPSHOT_SESSION_MISMATCH" } });
  }
  const identity = {
    sessionId: body.sessionId,
    clientAddress: header(request.headers, "x-forwarded-for")?.split(",")[0]?.trim()
      || request.socket?.remoteAddress?.trim() || "anonymous",
  };
  try {
    const store = dependencies.store ?? sharedPostgresProjectSnapshotStore(connection!);
    const result = await store.persist(identity, body.project, proof);
    return response.status(200).json({ contract: "VERIFIED_PROJECT_SNAPSHOT", ref: result.ref, proof: result.proof });
  } catch (error) {
    if (error instanceof ProjectSnapshotError) return response.status(error.status).json({ error: { code: error.code } });
    return response.status(503).json({ error: { code: "PROJECT_SNAPSHOT_STORE_UNAVAILABLE" } });
  }
};

export default handleProtocolDesignerProjectSnapshot;
