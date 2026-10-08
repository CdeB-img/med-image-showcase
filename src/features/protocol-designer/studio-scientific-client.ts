import { ensureServerProjectSnapshot, ProductBridgeClientError } from "./product-bridge-client.js";
import type { ResearchProjectOwnerProjection } from "../research-project-construction/contribution-owner-boundary.js";
import type { StudioReconciliationRequest } from "../document-projection/studio-reconciliation-contract.js";
import { requireStudioScientificAssessment, type StudioScientificAssessment } from "../scientific-thinking/studio-contribution.js";
import type { ProductBridgeRequest } from "./product-bridge.js";

/** Existing HTTP / Project proof / durable guard corridor. No UI or auto-dispatch. */
const nativeStudioRequest = async (sessionId: string, project: ResearchProjectOwnerProjection, body: Record<string, unknown>) => {
  const snapshot = await ensureServerProjectSnapshot(sessionId, project);
  const response = await fetch("/api/protocol-designer-bridge", { method: "POST", credentials: "same-origin",
    headers: { "content-type": "application/json", "x-noxia-project-snapshot-proof": snapshot.proof },
    body: JSON.stringify({ ...body, apiVersion: "1.0.0", currentProject: null, currentProjectRef: snapshot.ref }) });
  const value = await response.json().catch(() => null);
  if (!response.ok || value?.apiVersion !== "1.0.0") throw new ProductBridgeClientError(
    value?.error?.code ?? "STUDIO_SCIENTIFIC_OPERATION_FAILED", "L’évaluation scientifique n’a pas abouti ; le brouillon est conservé.");
  return value;
};
export const requestStudioScientificAssessment = async (sessionId: string, project: ResearchProjectOwnerProjection,
  request: StudioReconciliationRequest): Promise<StudioScientificAssessment> => {
  const value = await nativeStudioRequest(sessionId, project, { operation: "STUDIO_SCIENTIFIC_ASSESSMENT", studioRequest: request,
    observabilityContext: { sessionId, conversationId: null, turnId: null,
      clientRequestId: `studio-assessment:${request.requestDigest}`, testSessionId: null } });
  requireStudioScientificAssessment(request, value.studioAssessment);
  return value.studioAssessment;
};
export const requestStudioScientificPreparation = async (request: ProductBridgeRequest) => {
  if (!request.studioPreparationSource || !request.prepareWorkingDraft || !request.currentProject
    || !request.observabilityContext?.sessionId) throw new ProductBridgeClientError("STUDIO_PREPARATION_SOURCE_REQUIRED", "Préparation native manquante.");
  const value = await nativeStudioRequest(request.observabilityContext.sessionId, request.currentProject, request);
  if (!value.workingDraftUpdate) throw new ProductBridgeClientError("STUDIO_PREPARATION_RESULT_INVALID", "Résultat scientifique manquant.");
  return value as Pick<import("./product-bridge.js").ProductBridgeResponse, "workingDraftUpdate" | "workingStudyProposal">
    & Partial<Pick<import("./product-bridge.js").ProductBridgeResponse, "observability">>;
};
