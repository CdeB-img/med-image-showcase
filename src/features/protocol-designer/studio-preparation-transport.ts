/** Transport reference to an existing DOC-owned frozen checkpoint. Scientific
 * input and identity stay in the checkpoint; this is not a second source store. */
import { logicalDigest } from "../knowledge-engine/canonical.js";
import type { ProductBridgeRequest, ProductBridgeResponse } from "./product-bridge.js";

export type StudioPreparationReference = Readonly<{
  contract: "STUDIO_PREPARATION_REFERENCE_V1";
  finalizationIntentId: string;
  preparationId: string;
  requestDigest: string;
}>;
export const studioPreparationReference = (request: ProductBridgeRequest): StudioPreparationReference => {
  const finalizationIntentId = request.studioPreparationSource?.finalizationIntentId;
  const preparationId = request.observabilityContext?.clientRequestId;
  if (!finalizationIntentId || !preparationId || !request.prepareWorkingDraft)
    throw new Error("STUDIO_PREPARATION_REFERENCE_INVALID");
  return { contract: "STUDIO_PREPARATION_REFERENCE_V1", finalizationIntentId, preparationId, requestDigest: logicalDigest(request) };
};
export const studioPreparationTransport = (request: ProductBridgeRequest) => ({
  studioPreparationRef: studioPreparationReference(request),
  observabilityContext: request.observabilityContext,
});
export type StudioPreparationEvidence =
  | Readonly<{ state: "NOT_FOUND" | "IN_PROGRESS" | "UNKNOWN" }>
  | Readonly<{ state: "FAILED"; errorCode: string | null }>
  | Readonly<{ state: "COMPLETED"; response: Pick<ProductBridgeResponse, "workingDraftUpdate" | "workingStudyProposal"> }>;
