import assert from "node:assert/strict";
import test from "node:test";
import {
  assertQualificationIdentity,
  assertVercelEnvironmentIsolation,
} from "./durable-qualification-store-preflight.mjs";

const production = {
  NOXIA_DURABLE_DATABASE_NEON_PROJECT_ID: "aged-art-41980988",
  NOXIA_DURABLE_DATABASE_DATABASE_URL:
    "postgresql://synthetic:synthetic@ep-nameless-dew-b13ga6ek-pooler.c-5.eu-central-1.aws.neon.tech/neondb",
};
const qualification = {
  NOXIA_DURABLE_DATABASE_ROLE: "qualification/test",
  NOXIA_DURABLE_DATABASE_NEON_PROJECT_ID: "lingering-haze-73971206",
  NOXIA_DURABLE_DATABASE_DATABASE_URL:
    "postgresql://synthetic:synthetic@ep-aged-dust-b2o37gm4-pooler.c-6.eu-central-1.aws.neon.tech/neondb",
};
const development = {
  NOXIA_DURABLE_QUALIFICATION_NEON_PROJECT_ID: qualification.NOXIA_DURABLE_DATABASE_NEON_PROJECT_ID,
  NOXIA_DURABLE_QUALIFICATION_DATABASE_URL: qualification.NOXIA_DURABLE_DATABASE_DATABASE_URL,
};
const preview = {
  NOXIA_DURABLE_DATABASE_NEON_PROJECT_ID: "soft-hill-09530523",
  NOXIA_DURABLE_DATABASE_DATABASE_URL:
    "postgresql://synthetic:synthetic@ep-spring-cake-b1a8cl9x-pooler.c-5.eu-central-1.aws.neon.tech/neondb",
};

test("qualification and Production identities are distinct", () => {
  const identities = assertQualificationIdentity(qualification, production);
  assert.notEqual(identities.qualification.host, identities.production.host);
});

test("destructive preflight requires an explicit qualification/test role", () => {
  assert.throws(() => assertQualificationIdentity({ ...qualification, NOXIA_DURABLE_DATABASE_ROLE: "" }, production),
    /QUALIFICATION_ROLE_REQUIRED/);
});

test("destructive preflight refuses a Production URL even with qualification metadata", () => {
  assert.throws(() => assertQualificationIdentity({ ...qualification,
    NOXIA_DURABLE_DATABASE_DATABASE_URL: production.NOXIA_DURABLE_DATABASE_DATABASE_URL }, production),
  /QUALIFICATION_DATABASE_IS_PRODUCTION/);
});

test("destructive preflight refuses an unrecognized qualification resource", () => {
  assert.throws(() => assertQualificationIdentity({ ...qualification,
    NOXIA_DURABLE_DATABASE_NEON_PROJECT_ID: "other-project" }, production),
  /QUALIFICATION_RESOURCE_ID_MISMATCH/);
});

test("destructive preflight refuses changed Production identity", () => {
  assert.throws(() => assertQualificationIdentity(qualification, { ...production,
    NOXIA_DURABLE_DATABASE_NEON_PROJECT_ID: "other-project" }),
  /PRODUCTION_RESOURCE_ID_CHANGED/);
  assert.throws(() => assertQualificationIdentity(qualification, { ...production,
    NOXIA_DURABLE_DATABASE_DATABASE_URL: qualification.NOXIA_DURABLE_DATABASE_DATABASE_URL }),
  /PRODUCTION_HOST_CHANGED/);
});

test("Vercel Development-only mapping resolves the qualification resource", () => {
  const result = assertVercelEnvironmentIsolation(development, preview, production, "qualification/test");
  assert.equal(result.candidate.NOXIA_DURABLE_DATABASE_DATABASE_URL,
    qualification.NOXIA_DURABLE_DATABASE_DATABASE_URL);
});

test("Vercel qualification variables in Preview or Production fail closed", () => {
  assert.throws(() => assertVercelEnvironmentIsolation(development, { ...preview,
    NOXIA_DURABLE_QUALIFICATION_DATABASE_URL: qualification.NOXIA_DURABLE_DATABASE_DATABASE_URL,
  }, production, "qualification/test"), /QUALIFICATION_VARIABLE_OUTSIDE_DEVELOPMENT/);
  assert.throws(() => assertVercelEnvironmentIsolation(development, preview, { ...production,
    NOXIA_DURABLE_QUALIFICATION_NEON_PROJECT_ID: qualification.NOXIA_DURABLE_DATABASE_NEON_PROJECT_ID,
  }, "qualification/test"), /QUALIFICATION_VARIABLE_OUTSIDE_DEVELOPMENT/);
});

test("Vercel Development-only mapping still requires the explicit test role", () => {
  assert.throws(() => assertVercelEnvironmentIsolation(development, preview, production, ""),
    /QUALIFICATION_ROLE_REQUIRED/);
});

test("destructive preflight refuses a Preview URL or a changed Preview resource", () => {
  assert.throws(() => assertVercelEnvironmentIsolation(development, production, production, "qualification/test"),
    /PREVIEW_DATABASE_IDENTITY_CHANGED/);
  assert.throws(() => assertVercelEnvironmentIsolation(development, { ...preview,
    NOXIA_DURABLE_DATABASE_DATABASE_URL: qualification.NOXIA_DURABLE_DATABASE_DATABASE_URL,
  }, production, "qualification/test"), /PREVIEW_DATABASE_IDENTITY_CHANGED/);
});
