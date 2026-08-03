import { processScientificIntakeHttp } from "../src/features/protocol-designer/intake/server";

type ApiRequest = { method?: string; headers: Record<string, string | string[] | undefined>; body?: unknown; socket?: { remoteAddress?: string } };
type ApiResponse = { status(code: number): ApiResponse; setHeader(name: string, value: string): void; json(value: unknown): void };

export default async function handler(request: ApiRequest, response: ApiResponse) {
  const result = await processScientificIntakeHttp({
    method: request.method, headers: request.headers, body: request.body, ip: request.socket?.remoteAddress,
  }, { apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL });
  for (const [name, value] of Object.entries(result.headers)) response.setHeader(name, value);
  response.status(result.status).json(result.body);
}
