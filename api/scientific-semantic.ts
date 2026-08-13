import { GeminiScientificSemanticProvider } from "../src/features/scientific-semantic-reconstruction/provider.js";
import { processScientificSemanticHttp } from "../src/features/scientific-semantic-reconstruction/server.js";

type ApiRequest = { method?: string; headers: Record<string, string | string[] | undefined>; body?: unknown; socket?: { remoteAddress?: string } };
type ApiResponse = { status(code: number): ApiResponse; setHeader(name: string, value: string): void; json(value: unknown): void };

export default async function handler(request: ApiRequest, response: ApiResponse) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim();
  const provider = apiKey && model ? new GeminiScientificSemanticProvider({ apiKey, model }) : null;
  const result = await processScientificSemanticHttp({ method: request.method, headers: request.headers, body: request.body, ip: request.socket?.remoteAddress }, { provider });
  Object.entries(result.headers).forEach(([name, value]) => response.setHeader(name, value));
  response.status(result.status).json(result.body);
}
