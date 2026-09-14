import { processScientificIntakeHttp } from "../src/features/protocol-designer/intake/server.js";
import {
  PROTOCOL_DESIGNER_PUBLIC_RUNTIME_POLICY,
  protocolDesignerProviderCallsAllowed,
} from "../src/features/protocol-designer/public-runtime-access.js";

type ApiRequest = { method?: string; headers: Record<string, string | string[] | undefined>; body?: unknown; socket?: { remoteAddress?: string } };
type ApiResponse = { status(code: number): ApiResponse; setHeader(name: string, value: string): void; json(value: unknown): void };

export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
  environment: Record<string, string | undefined> = process.env,
) {
  if (!protocolDesignerProviderCallsAllowed(environment)) {
    response.setHeader("content-type", "application/json; charset=utf-8");
    response.setHeader("cache-control", "no-store");
    return response.status(503).json({
      error: { code: PROTOCOL_DESIGNER_PUBLIC_RUNTIME_POLICY, message: "Protocol Designer est temporairement indisponible en production.", retryable: false },
      observability: { providerCalls: [], requestEstimatedCostUsd: 0, requestCostIncomplete: false, unpricedCallCount: 0 },
    });
  }
  const result = await processScientificIntakeHttp({
    method: request.method, headers: request.headers, body: request.body, ip: request.socket?.remoteAddress,
  }, { apiKey: environment.GEMINI_API_KEY, model: environment.GEMINI_MODEL });
  for (const [name, value] of Object.entries(result.headers)) {
    if (typeof value === "string") {
      response.setHeader(name, value);
    }
  }
  response.status(result.status).json(result.body);
}
