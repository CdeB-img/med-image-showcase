import fs from "node:fs";
import path from "node:path";
import { processScientificIntakeHttp } from "../intake/server";

const envPath = path.join(process.cwd(), ".env.local");
const localEnv = fs.existsSync(envPath) ? Object.fromEntries(fs.readFileSync(envPath, "utf8").split(/\r?\n/).flatMap((line) => {
  const separator = line.indexOf("=");
  if (separator < 1 || line.trimStart().startsWith("#")) return [];
  return [[line.slice(0, separator).trim(), line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "")]];
})) : {};

const apiKey = process.env.GEMINI_API_KEY || localEnv.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || localEnv.GEMINI_MODEL;
if (!apiKey || !model) {
  console.error("REAL_GEMINI_MANUAL_TEST_SKIPPED_MISSING_LOCAL_CONFIGURATION");
  process.exitCode = 2;
} else {
  const inspectedFetch: typeof fetch = async (input, init) => {
    const response = await fetch(input, init);
    console.log(`REAL_GEMINI_PROVIDER_HTTP_STATUS=${response.status}`);
    return response;
  };
  const result = await processScientificIntakeHttp({
    method: "POST",
    headers: { "content-type": "application/json", host: "localhost", origin: "http://localhost" },
    body: {
      question: "Je veux comparer deux méthodes de mesure de la perfusion cérébrale dans une étude multicentrique.",
      language: "fr",
      schemaVersion: "1.0",
    },
    ip: "manual-local-test",
  }, { apiKey, model, fetchImpl: inspectedFetch, timeoutMs: 20_000 });

  if (result.status !== 200 || "error" in result.body) {
    const code = "error" in result.body ? result.body.error.code : "UNEXPECTED_STATUS";
    console.error(`REAL_GEMINI_MANUAL_TEST_FAILED code=${code} status=${result.status}`);
    process.exitCode = 1;
  } else {
    console.log(`REAL_GEMINI_MANUAL_TEST_PASSED schema=${result.body.schemaVersion} language=${result.body.language}`);
  }
}
