import { createServer as createHttpServer } from "node:http";
import { createServer as createViteServer, loadEnv } from "vite";
import { GeminiScientificSemanticProvider } from "../src/features/scientific-semantic-reconstruction/provider";
import { processScientificSemanticHttp } from "../src/features/scientific-semantic-reconstruction/server";
import { RollingWindowRequestLimiter } from "../src/features/scientific-semantic-reconstruction/manual/rolling-rate-limiter";

const environment = loadEnv("development", process.cwd(), "");
const apiKey = environment.GEMINI_API_KEY?.trim();
const model = environment.GEMINI_MODEL?.trim();
const port = Number(environment.SEM_BROWSER_PORT ?? 4173);

if (!apiKey) throw new Error("SEM_BROWSER_PROVIDER_NOT_CONFIGURED");
if (model && model !== "gemini-3.5-flash-lite") throw new Error("SEM_BROWSER_MODEL_MUST_BE_GEMINI_3_5_FLASH_LITE");

const browserLimiter = new RollingWindowRequestLimiter({ maxRequests: 5, windowMs: 60_000 });
const provider = new GeminiScientificSemanticProvider({
  apiKey,
  model: "gemini-3.5-flash-lite",
  timeoutMs: 45_000,
  maxAttempts: 4,
  retryBaseMs: 10_000,
  maxRetryDelayMs: 80_000,
  beforeAttempt: () => browserLimiter.acquire(),
});

const vite = await createViteServer({
  appType: "spa",
  server: { middlewareMode: true, hmr: false },
});

const server = createHttpServer(async (request, response) => {
  if (request.url?.split("?")[0] !== "/api/scientific-semantic") {
    vite.middlewares(request, response);
    return;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const result = await processScientificSemanticHttp({
    method: request.method,
    headers: request.headers,
    body: Buffer.concat(chunks).toString("utf8"),
    ip: request.socket.remoteAddress,
  }, { provider });

  Object.entries(result.headers).forEach(([name, value]) => response.setHeader(name, value));
  response.statusCode = result.status;
  response.end(JSON.stringify(result.body));
});

server.listen(port, "127.0.0.1", () => {
  console.log(`SEM live browser server ready at http://127.0.0.1:${port}/protocol-designer/demo`);
});

const close = async () => {
  server.close();
  await vite.close();
};

process.once("SIGINT", close);
process.once("SIGTERM", close);
