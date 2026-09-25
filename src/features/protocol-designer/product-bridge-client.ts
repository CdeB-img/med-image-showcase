import {
  PRODUCT_BRIDGE_API_VERSION,
  type ProductBridgeRequest,
  type ProductBridgeResponse,
} from "./product-bridge";
import type {
  LanguageProjectionContractFailureDiagnostic,
  LanguageProjectionRequest,
  LanguageProjectionResponse,
} from "./conversation-language-gateway";
import type { ResearchProjectOwnerProjection } from "../research-project-construction/contribution-owner-boundary";
import { researchProjectOwnerDigest } from "../research-project-construction/contribution-owner-boundary";
import {
  providerCallRequestObservability,
  type ProviderCallRecord,
  type ProviderCallRequestObservability,
} from "./provider-call-observability";

const responseObservability = (value: unknown): ProviderCallRequestObservability | null => {
  if (!value || typeof value !== "object" || !("observability" in value)) return null;
  const observed = value.observability;
  if (!observed || typeof observed !== "object" || !("providerCalls" in observed)
    || !Array.isArray(observed.providerCalls)) return null;
  return providerCallRequestObservability(observed.providerCalls as ProviderCallRecord[]);
};

export class ProductBridgeClientError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly diagnostic: LanguageProjectionContractFailureDiagnostic | null = null,
    readonly observability: ProviderCallRequestObservability | null = null,
  ) { super(message); }
}

type SnapshotRef = Readonly<{ projectId: string; versionId: string; projectDigest: string }>;
type SnapshotRegistration = Readonly<{ proof: string; ref: SnapshotRef }>;
const snapshotProofKey = (sessionId: string, projectId: string) =>
  `noxia:project-snapshot-proof:${sessionId}:${projectId}`;
const pendingSnapshots = new Map<string, Promise<SnapshotRegistration>>();

/** Upload an adopted canonical version once; browser storage is only a cache of the server proof. */
export const ensureServerProjectSnapshot = async (
  sessionId: string,
  project: ResearchProjectOwnerProjection,
): Promise<SnapshotRegistration> => {
  const ref = { projectId: project.projectId, versionId: project.versionId, projectDigest: project.projectDigest };
  if (typeof window === "undefined" || !window.localStorage) {
    throw new ProductBridgeClientError("PROJECT_SNAPSHOT_LOCAL_PROOF_UNAVAILABLE", "Le projet ne peut pas être vérifié dans cette session.");
  }
  const key = snapshotProofKey(sessionId, project.projectId);
  let cached: SnapshotRegistration | null = null;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) cached = JSON.parse(raw) as SnapshotRegistration;
  } catch { cached = null; }
  const priorProof = typeof cached?.proof === "string" && /^[A-Za-z0-9_-]{43}$/u.test(cached.proof)
    ? cached.proof : null;
  if (cached?.ref?.projectId === ref.projectId && cached.ref.versionId === ref.versionId
    && cached.ref.projectDigest === ref.projectDigest && priorProof) return cached;
  const flightKey = `${sessionId}\u0000${ref.projectId}\u0000${ref.versionId}\u0000${ref.projectDigest}`;
  const inFlight = pendingSnapshots.get(flightKey);
  if (inFlight) return inFlight;
  const registration = (async () => {
    const response = await fetch("/api/protocol-designer-project-snapshot", {
      method: "POST",
      headers: { "content-type": "application/json",
        ...(priorProof ? { "x-noxia-project-snapshot-proof": priorProof } : {}) },
      body: JSON.stringify({ sessionId, project }),
      credentials: "same-origin",
    });
    const value = await response.json().catch(() => null);
    if (!response.ok || value?.contract !== "VERIFIED_PROJECT_SNAPSHOT"
      || value?.ref?.projectId !== ref.projectId || value?.ref?.versionId !== ref.versionId
      || value?.ref?.projectDigest !== ref.projectDigest
      || typeof value?.proof !== "string" || !/^[A-Za-z0-9_-]{43}$/u.test(value.proof)) {
      throw new ProductBridgeClientError(value?.error?.code ?? "PROJECT_SNAPSHOT_UNAVAILABLE",
        "Le projet enregistré ne peut pas être vérifié ; la conversation est conservée.");
    }
    const saved = { ref, proof: value.proof };
    try { window.localStorage.setItem(key, JSON.stringify(saved)); }
    catch { throw new ProductBridgeClientError("PROJECT_SNAPSHOT_LOCAL_PROOF_UNAVAILABLE", "La preuve du projet ne peut pas être conservée."); }
    return saved;
  })();
  pendingSnapshots.set(flightKey, registration);
  try { return await registration; } finally { pendingSnapshots.delete(flightKey); }
};

export const requestProtocolDesignerBridge = async (
  request: Omit<ProductBridgeRequest, "apiVersion">,
): Promise<ProductBridgeResponse> => {
  const sessionId = request.observabilityContext?.sessionId;
  // The non-public Vite development bridge has no durable snapshot resolver.
  // Historical Projects whose owner digest predates canonical-state migration
  // retain their existing full-body route rather than being silently rewritten.
  const verifiableProject = request.currentProject
    && request.currentProject.canonicalState
    && request.currentProject.appliedChangeSet
    && researchProjectOwnerDigest(request.currentProject) === request.currentProject.projectDigest;
  const snapshot = import.meta.env.MODE !== "development" && verifiableProject && sessionId
    ? await ensureServerProjectSnapshot(sessionId, request.currentProject) : null;
  const wireRequest = snapshot ? { ...request, currentProject: null, currentProjectRef: snapshot.ref } : request;
  const response = await fetch("/api/protocol-designer-bridge", {
    method: "POST",
    headers: { "content-type": "application/json",
      ...(snapshot ? { "x-noxia-project-snapshot-proof": snapshot.proof } : {}) },
    body: JSON.stringify({ ...wireRequest, apiVersion: PRODUCT_BRIDGE_API_VERSION }),
    credentials: "same-origin",
  });
  const value = await response.json().catch(() => null);
  if (!response.ok) throw new ProductBridgeClientError(
    value?.error?.code ?? "PRODUCT_BRIDGE_UNAVAILABLE",
    value?.error?.message ?? "Conversation momentanément indisponible.",
    null,
    responseObservability(value),
  );
  if (value?.apiVersion !== PRODUCT_BRIDGE_API_VERSION || typeof value?.assistantReply !== "string") {
    throw new ProductBridgeClientError("INVALID_PRODUCT_BRIDGE_RESPONSE", "Réponse conversationnelle invalide.", null, responseObservability(value));
  }
  return value as ProductBridgeResponse;
};

export const requestConversationLanguageProjection = async (
  request: LanguageProjectionRequest,
): Promise<LanguageProjectionResponse> => {
  const response = await fetch("/api/protocol-designer-bridge", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
    credentials: "same-origin",
  });
  const value = await response.json().catch(() => null);
  if (!response.ok) throw new ProductBridgeClientError(
    value?.error?.code ?? "LANGUAGE_PROJECTION_UNAVAILABLE",
    value?.error?.message ?? "Cette langue ne peut pas être traitée pour le moment.",
    value?.error?.diagnostic?.contract === "LANGUAGE_PROJECTION_CONTRACT_FAILURE_DIAGNOSTIC"
      ? value.error.diagnostic as LanguageProjectionContractFailureDiagnostic
      : null,
    responseObservability(value),
  );
  if (value?.apiVersion !== PRODUCT_BRIDGE_API_VERSION
    || value?.operation !== "LANGUAGE_PROJECTION"
    || value?.projection?.contract !== "CONVERSATION_LANGUAGE_PROJECTION") {
    throw new ProductBridgeClientError("INVALID_LANGUAGE_PROJECTION_RESPONSE", "Projection linguistique invalide.", null, responseObservability(value));
  }
  return value as LanguageProjectionResponse;
};
