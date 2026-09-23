import { writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import postgres from "postgres";
import { preflightDestructiveQualificationStore } from "../durable-qualification-store-preflight.mjs";

const root = resolve(import.meta.dirname, "../..");
const { environment: qualificationEnvironment } = await preflightDestructiveQualificationStore();
const databaseUrl = qualificationEnvironment.NOXIA_DURABLE_DATABASE_DATABASE_URL;
const environment = { ...process.env, ...qualificationEnvironment };
for (const name of Object.keys(environment)) {
  if (/^(OPENAI|GEMINI|AZURE|GOOGLE)_|^VERCEL_(OIDC_TOKEN|TOKEN)$|^NOXIA_OPENAI_/.test(name)) {
    delete environment[name];
  }
}
const output = resolve(import.meta.dirname, "shared-store-tests.json");
const result = spawnSync(process.execPath, [
  resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  resolve(import.meta.dirname, "exact-count-shared-store.test.ts"),
  "--config", resolve(import.meta.dirname, "vitest.shared.config.ts"),
  "--reporter=json", `--outputFile=${output}`,
], { cwd: root, env: environment, stdio: "inherit" });

const sql = postgres(databaseUrl, { max: 1, prepare: false });
const counts = await sql`
  select
    (select count(*)::int from noxia_durable.public_guard_session) as sessions,
    (select count(*)::int from noxia_durable.public_bridge_admission) as admissions,
    (select count(*)::int from noxia_durable.public_provider_operation) as operations,
    (select count(*)::int from noxia_durable.public_rate_bucket) as rate_buckets
`;
await sql.end({ timeout: 5 });
writeFileSync(resolve(import.meta.dirname, "shared-store-cleanup.json"), `${JSON.stringify({
  verifiedAt: new Date().toISOString(),
  qualificationDataOnly: true,
  providerHttpRequests: 0,
  remainingRows: counts[0],
}, null, 2)}\n`);
process.exit(result.status ?? 1);
