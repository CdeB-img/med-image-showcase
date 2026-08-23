import {
  PRODUCT_BRIDGE_API_VERSION,
  type ProductBridgeRequest,
  type ProductBridgeResponse,
} from "./product-bridge";

export class ProductBridgeClientError extends Error {
  constructor(readonly code: string, message: string) { super(message); }
}

export const requestProtocolDesignerBridge = async (
  request: Omit<ProductBridgeRequest, "apiVersion">,
): Promise<ProductBridgeResponse> => {
  const response = await fetch("/api/protocol-designer-bridge", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...request, apiVersion: PRODUCT_BRIDGE_API_VERSION }),
    credentials: "same-origin",
  });
  const value = await response.json().catch(() => null);
  if (!response.ok) throw new ProductBridgeClientError(
    value?.error?.code ?? "PRODUCT_BRIDGE_UNAVAILABLE",
    value?.error?.message ?? "Conversation momentanément indisponible.",
  );
  if (value?.apiVersion !== PRODUCT_BRIDGE_API_VERSION || typeof value?.assistantReply !== "string") {
    throw new ProductBridgeClientError("INVALID_PRODUCT_BRIDGE_RESPONSE", "Réponse conversationnelle invalide.");
  }
  return value as ProductBridgeResponse;
};
