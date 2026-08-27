import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (relativePath) => JSON.parse(readFileSync(resolve(repositoryRoot, relativePath), "utf8"));
const readTsConfig = (relativePath) => {
  const filePath = resolve(repositoryRoot, relativePath);
  const parsed = ts.parseConfigFileTextToJson(filePath, readFileSync(filePath, "utf8"));
  if (parsed.error) throw new Error(`TSCONFIG_PARSE_FAILED:${relativePath}`);
  return parsed.config;
};

const packageJson = readJson("package.json");
const rootConfig = readTsConfig("tsconfig.json");
const appConfig = readTsConfig("tsconfig.app.json");
const apiConfig = readTsConfig("tsconfig.scientific-interpretation-api.json");
const violations = [];

const requireExactScript = (name, expected) => {
  if (packageJson.scripts?.[name] !== expected) violations.push(`SCRIPT_DRIFT:${name}`);
};

requireExactScript("dev", "npm run typecheck && vite");
requireExactScript("build", "npm run typecheck && vite build");
requireExactScript("build:dev", "npm run typecheck && vite build --mode development");
requireExactScript(
  "typecheck",
  "npm run check:typescript-gate && npm run typecheck:app && npm run typecheck:vercel-api && npm run check:scientific-interpretation-server",
);
requireExactScript("typecheck:app", "tsc -p tsconfig.app.json --noEmit");
requireExactScript("typecheck:vercel-api", "tsc -p tsconfig.scientific-interpretation-api.json --noEmit");

const appResolution = String(appConfig.compilerOptions?.moduleResolution ?? "").toLowerCase();
if (appResolution !== "bundler") violations.push("APP_MODULE_RESOLUTION_NOT_BUNDLER");
if (!appConfig.include?.includes("src")) violations.push("APP_SOURCE_GRAPH_NOT_INCLUDED");
if (JSON.stringify(rootConfig.compilerOptions?.paths?.["@/*"]) !== JSON.stringify(appConfig.compilerOptions?.paths?.["@/*"])) {
  violations.push("APP_ALIAS_DRIFT");
}

if (apiConfig.compilerOptions?.module !== "NodeNext" || apiConfig.compilerOptions?.moduleResolution !== "NodeNext") {
  violations.push("VERCEL_API_MODULE_RESOLUTION_NOT_NODENEXT");
}
if (JSON.stringify(apiConfig.include) !== JSON.stringify(["api/**/*.ts"])) {
  violations.push("VERCEL_API_GRAPH_NOT_COMPLETE");
}
if (apiConfig.compilerOptions?.paths) violations.push("VERCEL_API_BUNDLER_ALIAS_PRESENT");

const canonicalScripts = ["dev", "build", "build:dev", "typecheck"]
  .map((name) => packageJson.scripts?.[name] ?? "")
  .join("\n");
if (/\|\|\s*true|;\s*exit\s+0|--no-check|--skip-typecheck/i.test(canonicalScripts)) {
  violations.push("NON_BLOCKING_TYPESCRIPT_SUPPRESSION_PRESENT");
}

if (violations.length > 0) {
  throw new Error(`NOXIA_TYPESCRIPT_GATE_DRIFT\n${violations.join("\n")}`);
}

console.log("NOXIA_TYPESCRIPT_GATE_CLEAN=CONFIGURATION_VERIFIED");
console.log("APP_MODULE_RESOLUTION=BUNDLER");
console.log("VERCEL_API_MODULE_RESOLUTION=NODENEXT");
console.log("VERCEL_API_GRAPH=api/**/*.ts");
