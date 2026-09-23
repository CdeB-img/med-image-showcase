import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import postgres from "postgres";

const ROOT = resolve(import.meta.dirname, "..");
const POINTER_FILE = join(ROOT, ".env.durable-qualification.local");
const PRODUCTION_PROJECT_ID = "aged-art-41980988";
const PRODUCTION_HOST = "ep-nameless-dew-b13ga6ek-pooler.c-5.eu-central-1.aws.neon.tech";
const QUALIFICATION_PROJECT_ID = "lingering-haze-73971206";
const QUALIFICATION_HOST = "ep-aged-dust-b2o37gm4-pooler.c-6.eu-central-1.aws.neon.tech";
const QUALIFICATION_PREFIX = "NOXIA_DURABLE_QUALIFICATION";

const parseEnv = (content) => Object.fromEntries(content.split(/\r?\n/).flatMap((line) => {
  const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
  if (!match) return [];
  const value = match[2].trim();
  try {
    return [[match[1], value.startsWith('"') ? JSON.parse(value) :
      value.startsWith("'") && value.endsWith("'") ? value.slice(1, -1) : value]];
  } catch {
    throw new Error("VERCEL_ENV_PARSE_FAILED");
  }
}));

const databaseIdentity = (value) => {
  if (!value) throw new Error("DATABASE_URL_MISSING");
  let url;
  try { url = new URL(value); } catch { throw new Error("DATABASE_URL_INVALID"); }
  if (!/^(postgres|postgresql):$/.test(url.protocol)) throw new Error("DATABASE_URL_INVALID");
  return { host: url.hostname, database: decodeURIComponent(url.pathname.slice(1)) };
};

export const assertQualificationIdentity = (candidate, production) => {
  if (candidate.NOXIA_DURABLE_DATABASE_ROLE !== "qualification/test") {
    throw new Error("QUALIFICATION_ROLE_REQUIRED");
  }
  if (candidate.NOXIA_DURABLE_DATABASE_NEON_PROJECT_ID !== QUALIFICATION_PROJECT_ID) {
    throw new Error("QUALIFICATION_RESOURCE_ID_MISMATCH");
  }
  if (production.NOXIA_DURABLE_DATABASE_NEON_PROJECT_ID !== PRODUCTION_PROJECT_ID) {
    throw new Error("PRODUCTION_RESOURCE_ID_CHANGED");
  }
  const qualification = databaseIdentity(candidate.NOXIA_DURABLE_DATABASE_DATABASE_URL);
  const productionIdentity = databaseIdentity(production.NOXIA_DURABLE_DATABASE_DATABASE_URL);
  if (productionIdentity.host !== PRODUCTION_HOST) throw new Error("PRODUCTION_HOST_CHANGED");
  if (qualification.host === productionIdentity.host ||
      candidate.NOXIA_DURABLE_DATABASE_DATABASE_URL === production.NOXIA_DURABLE_DATABASE_DATABASE_URL) {
    throw new Error("QUALIFICATION_DATABASE_IS_PRODUCTION");
  }
  if (qualification.host !== QUALIFICATION_HOST || qualification.database !== "neondb") {
    throw new Error("QUALIFICATION_DATABASE_IDENTITY_MISMATCH");
  }
  return { qualification, production: productionIdentity };
};

export const assertVercelEnvironmentIsolation = (development, preview, production, role) => {
  const qualificationUrl = `${QUALIFICATION_PREFIX}_DATABASE_URL`;
  const qualificationProjectId = `${QUALIFICATION_PREFIX}_NEON_PROJECT_ID`;
  if (production[qualificationUrl] || production[qualificationProjectId] ||
      preview[qualificationUrl] || preview[qualificationProjectId]) {
    throw new Error("QUALIFICATION_VARIABLE_OUTSIDE_DEVELOPMENT");
  }
  const previewIdentity = databaseIdentity(preview.NOXIA_DURABLE_DATABASE_DATABASE_URL);
  if (preview.NOXIA_DURABLE_DATABASE_NEON_PROJECT_ID !== PRODUCTION_PROJECT_ID ||
      previewIdentity.host !== PRODUCTION_HOST) {
    throw new Error("PREVIEW_DATABASE_IDENTITY_CHANGED");
  }
  const candidate = {
    NOXIA_DURABLE_DATABASE_ROLE: role,
    NOXIA_DURABLE_DATABASE_NEON_PROJECT_ID: development[qualificationProjectId],
    NOXIA_DURABLE_DATABASE_DATABASE_URL: development[qualificationUrl],
  };
  const identities = assertQualificationIdentity(candidate, production);
  return { candidate, identities };
};

const pullVercelEnvironments = (cliPath) => {
  if (!cliPath || !isAbsolute(cliPath) || !existsSync(cliPath)) throw new Error("VERCEL_CLI_REQUIRED");
  const directory = mkdtempSync(join(tmpdir(), "noxia-durable-identity-"));
  try {
    const environments = {};
    for (const target of ["production", "preview", "development"]) {
      const file = join(directory, `${target}.env`);
      const result = spawnSync(cliPath, ["env", "pull", file,
        "--environment", target, "--project", "med-image-showcase",
        "--scope", "cdeb-imgs-projects", "--yes"],
      { cwd: ROOT, encoding: "utf8", timeout: 45_000, stdio: "pipe" });
      if (result.status !== 0) throw new Error(`VERCEL_${target.toUpperCase()}_IDENTITY_UNAVAILABLE`);
      environments[target] = parseEnv(readFileSync(file, "utf8"));
    }
    return environments;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
};

export const preflightDestructiveQualificationStore = async () => {
  const pointer = parseEnv(readFileSync(POINTER_FILE, "utf8"));
  if (Object.keys(pointer).some((name) => ![
    "NOXIA_DURABLE_DATABASE_ROLE", "NOXIA_DURABLE_VERCEL_CLI_PATH",
  ].includes(name))) throw new Error("QUALIFICATION_POINTER_UNEXPECTED_KEY");
  const { development, preview, production } = pullVercelEnvironments(pointer.NOXIA_DURABLE_VERCEL_CLI_PATH);
  const { candidate, identities } = assertVercelEnvironmentIsolation(
    development, preview, production, pointer.NOXIA_DURABLE_DATABASE_ROLE,
  );
  if (process.env.NOXIA_DURABLE_DATABASE_DATABASE_URL &&
      process.env.NOXIA_DURABLE_DATABASE_DATABASE_URL !== candidate.NOXIA_DURABLE_DATABASE_DATABASE_URL) {
    throw new Error("PROCESS_DATABASE_URL_DIFFERS_FROM_QUALIFICATION_RESOURCE");
  }
  const sql = postgres(candidate.NOXIA_DURABLE_DATABASE_DATABASE_URL,
    { max: 1, prepare: false, connect_timeout: 15 });
  try {
    const observed = await sql.begin(async (tx) => {
      await tx.unsafe("SET TRANSACTION READ ONLY");
      return (await tx`select current_database() as database, current_setting('transaction_read_only') as read_only`)[0];
    });
    if (observed.read_only !== "on" || observed.database !== identities.qualification.database) {
      throw new Error("QUALIFICATION_DATABASE_CONNECTION_MISMATCH");
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
  return { environment: candidate, identities };
};
