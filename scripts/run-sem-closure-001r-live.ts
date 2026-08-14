import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { FileScientificInterpretationEvidenceStore } from "../api/scientific-interpretation-evidence-store";
import {
  GeminiHybridScientificInterpretationProvider,
  RollingSingleConcurrencyGate,
  buildGeminiHybridProviderPayload,
} from "../api/scientific-interpretation-provider";
import { logicalDigest } from "../src/features/knowledge-engine/canonical";
import {
  EXPECTED_HYBRID_MODEL_IDENTITY,
  HYBRID_PRIMARY_INTERNAL_SCHEMA_DIGEST,
  HYBRID_PRIMARY_OUTPUT_FUNCTION_NAME,
  HYBRID_PRIMARY_PROMPT_DIGEST,
  HYBRID_PRIMARY_PROVIDER_TRANSPORT_SCHEMA,
  HYBRID_PRIMARY_RUNTIME_ID,
  HYBRID_PRIMARY_RUNTIME_VERSION,
  HYBRID_PRIMARY_TRANSPORT_SCHEMA_DIGEST,
  HybridScientificInterpretationRuntimeAdapter,
  ScientificInterpretationTechnicalError,
  parseHybridPrimaryProviderOutput,
  projectScientificContributionToV1IfAllowed,
  validateHybridProviderTransportSchema,
  type ScientificInterpretationContributionEnvelope,
  type ScientificInterpretationConversation,
} from "../src/features/scientific-interpretation";

const ROOT = resolve(import.meta.dirname, "..");
const SOURCE = resolve(ROOT, "experiments/semantic-engine-comparison/results/common-contract-ablation-02/scenario-pack-frozen.json");
const PROTOTYPE_MANIFEST = resolve(ROOT, "experiments/engine-lab/results/hybrid-runtime-prototype-01/experiment-manifest.json");
const PROTOTYPE_IDENTITIES = resolve(ROOT, "experiments/engine-lab/results/hybrid-runtime-prototype-01/runtime-identities.json");
const RESULT_ROOT = resolve(ROOT, "experiments/engine-lab/results/sem-closure-001r-live");
const FREEZE = resolve(RESULT_ROOT, "preflight-freeze-manifest.json");
const FIRST_RESULT_FREEZE = resolve(RESULT_ROOT, "post-i01-freeze.json");
const MANIFEST = resolve(RESULT_ROOT, "run-manifest.json");
const RESULTS = resolve(RESULT_ROOT, "live-results.json");
const MAX_PROVIDER_REQUESTS = 12;
const PRIMARY_OPERATIONS = 8;
const MAX_RETRY_REQUESTS = 4;
const MAX_STARTS_PER_ROLLING_60_SECONDS = 5;

const FUNCTIONAL_FILES = [
  "api/scientific-interpretation-provider.ts",
  "api/scientific-interpretation-evidence-store.ts",
  "src/features/scientific-interpretation/hybrid-primary.ts",
  "src/features/scientific-interpretation/hybrid-adapter.ts",
  "src/features/scientific-interpretation/audit.ts",
  "src/features/scientific-interpretation/contracts.ts",
  "src/features/scientific-interpretation/v1-compatibility.ts",
  "scripts/run-sem-closure-001r-live.ts",
] as const;

const sha256 = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const digestFiles = (paths: readonly string[]) => sha256(paths.map((path) => `${path}\0${sha256(readFileSync(resolve(ROOT, path)))}\0`).join(""));

const atomicJson = async (path: string, value: unknown) => {
  await mkdir(RESULT_ROOT, { recursive: true });
  const temporary = `${path}.tmp-${process.pid}`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporary, path);
};

const loadEnvironment = () => {
  const path = resolve(ROOT, ".env.local");
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const index = line.indexOf("=");
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
};

const visibleScenarios = async () => {
  const source = JSON.parse(await readFile(SOURCE, "utf8")) as { scenarios?: Array<Record<string, unknown>> };
  const scenarios = (source.scenarios ?? []).map((item) => ({
    scenarioId: String(item.scenarioId ?? ""),
    turns: [item.t0, item.r1, item.r2].map((content, index) => ({
      turnId: index === 0 ? "T0" : `R${index}`,
      role: "USER" as const,
      content: String(content ?? ""),
    })),
  }));
  if (scenarios.map((item) => item.scenarioId).join(",") !== "I01,I02,I03,I04,I05,I06,I07,I08"
    || scenarios.some((item) => item.turns.some((turn) => !turn.content))) {
    throw new Error("VISIBLE_I01_I08_T2_BINDING_INVALID");
  }
  return scenarios;
};

const frozenIdentity = async () => {
  loadEnvironment();
  const scenarios = await visibleScenarios();
  const prototypeManifest = JSON.parse(await readFile(PROTOTYPE_MANIFEST, "utf8")) as { model?: unknown };
  const prototypeIdentities = JSON.parse(await readFile(PROTOTYPE_IDENTITIES, "utf8")) as { runtimes?: Array<Record<string, unknown>> };
  const prototypePrimary = prototypeIdentities.runtimes?.find((item) => item.runtimeId === "PYDANTIC_AI_DIRECT");
  const model = process.env.GEMINI_MODEL?.trim() ?? "";
  const payloads = scenarios.map((scenario) => buildGeminiHybridProviderPayload({
    conversationId: `SEM-CLOSURE-001R-${scenario.scenarioId}`,
    language: "fr",
    turns: scenario.turns,
  }));
  payloads.forEach((payload) => JSON.parse(JSON.stringify(payload)));
  const serializedPayloads = JSON.stringify(payloads);
  if (/hiddenCard|sealed-reference|GEMINI_API_KEY/i.test(serializedPayloads)) throw new Error("PREFLIGHT_TRANSMISSION_SCOPE_VIOLATION");
  const schemaErrors = validateHybridProviderTransportSchema(HYBRID_PRIMARY_PROVIDER_TRANSPORT_SCHEMA);
  if (schemaErrors.length) throw new Error(`PROVIDER_TRANSPORT_SCHEMA_UNSUPPORTED:${schemaErrors.join(",")}`);
  if (prototypeManifest.model !== EXPECTED_HYBRID_MODEL_IDENTITY || prototypePrimary?.model !== EXPECTED_HYBRID_MODEL_IDENTITY) {
    throw new Error("PROTOTYPE_MODEL_IDENTITY_CONTRADICTION");
  }
  if (model !== EXPECTED_HYBRID_MODEL_IDENTITY) throw new Error(`MODEL_IDENTITY_DRIFT:${model || "MISSING"}`);
  return {
    campaignId: "SEM-CLOSURE-001R-LIVE-01",
    campaignVersion: "1.0.0",
    status: process.env.GEMINI_API_KEY?.trim() ? "FROZEN_PRE_LIVE" : "BLOCKED_CONFIGURATION",
    startingCommit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim(),
    functionalCandidateDigest: digestFiles(FUNCTIONAL_FILES),
    provider: "GOOGLE_GEMINI",
    model,
    expectedHybridModelIdentity: EXPECTED_HYBRID_MODEL_IDENTITY,
    observedClosureModelIdentity: "gemini-3.5-flash",
    driftClassification: "MODEL_IDENTITY_DRIFT",
    prototypePydanticAIVersion: "2.29.0",
    productPydanticAIVersion: "NOT_APPLICABLE_DIRECT_REST_TRANSPORT",
    structuredOutputMode: "REQUIRED_FUNCTION_CALL",
    outputFunctionName: HYBRID_PRIMARY_OUTPUT_FUNCTION_NAME,
    promptDigest: HYBRID_PRIMARY_PROMPT_DIGEST,
    internalSchemaDigest: HYBRID_PRIMARY_INTERNAL_SCHEMA_DIGEST,
    transportSchemaDigest: HYBRID_PRIMARY_TRANSPORT_SCHEMA_DIGEST,
    adapterDigest: digestFiles(["api/scientific-interpretation-provider.ts", "src/features/scientific-interpretation/hybrid-primary.ts"]),
    runtimeConfigurationDigest: logicalDigest({
      runtimeId: HYBRID_PRIMARY_RUNTIME_ID,
      runtimeVersion: HYBRID_PRIMARY_RUNTIME_VERSION,
      provider: "GOOGLE_GEMINI",
      model,
      mode: "REQUIRED_FUNCTION_CALL",
      promptDigest: HYBRID_PRIMARY_PROMPT_DIGEST,
      internalSchemaDigest: HYBRID_PRIMARY_INTERNAL_SCHEMA_DIGEST,
      transportSchemaDigest: HYBRID_PRIMARY_TRANSPORT_SCHEMA_DIGEST,
      starts: MAX_STARTS_PER_ROLLING_60_SECONDS,
      concurrency: 1,
      maxAttemptsPerOperation: 2,
    }),
    rawPersistenceImplementationDigest: digestFiles(["api/scientific-interpretation-evidence-store.ts", "src/features/scientific-interpretation/hybrid-adapter.ts"]),
    auditDDigest: digestFiles(["src/features/scientific-interpretation/audit.ts"]),
    conversations: Object.fromEntries(scenarios.map((scenario) => [scenario.scenarioId, logicalDigest(scenario.turns)])),
    conversationsDigest: logicalDigest(scenarios),
    providerPayloadDigest: logicalDigest(payloads),
    maximumStartsPerRolling60Seconds: MAX_STARTS_PER_ROLLING_60_SECONDS,
    concurrency: 1,
    primaryOperations: PRIMARY_OPERATIONS,
    transientRetryReserve: MAX_RETRY_REQUESTS,
    hardStop: MAX_PROVIDER_REQUESTS,
    maximumAttemptsPerOperation: 2,
    semanticRetries: 0,
    fallbackPolicy: "LEGACY_FALLBACK_DISABLED_FOR_EVIDENCE",
    blindAccessed: false,
    transmittedData: "VISIBLE_SYNTHETIC_I01_I08_COMPLETE_T2_CONVERSATIONS_ONLY",
    projectWrites: 0,
  };
};

const verifyOrWriteFreeze = async () => {
  const current = await frozenIdentity();
  if (current.status !== "FROZEN_PRE_LIVE") throw new Error("LIVE_PROVIDER_CONFIGURATION_MISSING");
  if (existsSync(FREEZE)) {
    const frozen = JSON.parse(await readFile(FREEZE, "utf8"));
    if (JSON.stringify(frozen) !== JSON.stringify(current)) throw new Error("PRE_LIVE_FREEZE_IDENTITY_MISMATCH");
    return current;
  }
  await atomicJson(FREEZE, current);
  return current;
};

type LiveRecord = {
  scenarioId: string;
  technicalSuccess: boolean;
  status: string;
  rawOutputRef: string | null;
  rawOutputDigest: string | null;
  providerAttempts: unknown[];
  providerRequestsForState: number;
  fallbackUsed: false;
  projectWrites: 0;
  criticalFindings: string[];
  contributionId: string | null;
  contributionDigest: string | null;
  error: string | null;
};

const run = async () => {
  const freeze = await verifyOrWriteFreeze();
  if (existsSync(MANIFEST)) {
    const prior = JSON.parse(await readFile(MANIFEST, "utf8"));
    if (prior.status === "COMPLETE") throw new Error("SEM_CLOSURE_001R_LIVE_ALREADY_COMPLETE_REPLAY_FORBIDDEN");
    if (prior.status === "BLOCKED") throw new Error("SEM_CLOSURE_001R_LIVE_BLOCKED_REPLAY_FORBIDDEN");
  }
  const scenarios = await visibleScenarios();
  const evidenceStore = new FileScientificInterpretationEvidenceStore(RESULT_ROOT);
  const gate = new RollingSingleConcurrencyGate(MAX_STARTS_PER_ROLLING_60_SECONDS);
  const apiKey = process.env.GEMINI_API_KEY!.trim();
  const records: LiveRecord[] = existsSync(RESULTS)
    ? (JSON.parse(await readFile(RESULTS, "utf8")) as { records?: LiveRecord[] }).records ?? []
    : [];
  if (records.length) throw new Error("PARTIAL_LIVE_STATE_REQUIRES_EXPLICIT_FORENSIC_REVIEW");
  let providerRequests = 0;
  let transientRetries = 0;
  const nativeFetch = fetch;
  const countedFetch: typeof fetch = async (...args) => {
    if (providerRequests >= MAX_PROVIDER_REQUESTS) throw new Error("CAMPAIGN_PROVIDER_HARD_STOP");
    providerRequests += 1;
    return nativeFetch(...args);
  };
  const startedAt = new Date().toISOString();
  await atomicJson(MANIFEST, { ...freeze, status: "RUNNING_I01", startedAt, providerRequests, completedScenarios: [] });

  for (const [index, scenario] of scenarios.entries()) {
    const retriesRemaining = Math.max(0, MAX_RETRY_REQUESTS - transientRetries);
    const conversation: ScientificInterpretationConversation = {
      conversationId: `SEM-CLOSURE-001R-${scenario.scenarioId}`,
      language: "fr",
      turns: scenario.turns,
    };
    let nativeExecution: Awaited<ReturnType<GeminiHybridScientificInterpretationProvider["execute"]>> | null = null;
    const provider = new GeminiHybridScientificInterpretationProvider({
      apiKey,
      model: EXPECTED_HYBRID_MODEL_IDENTITY,
      temperature: null,
      maxAttempts: retriesRemaining > 0 ? 2 : 1,
      fetchImpl: countedFetch,
      gate,
      maximumStartsPerRolling60Seconds: MAX_STARTS_PER_ROLLING_60_SECONDS,
    });
    const adapter = new HybridScientificInterpretationRuntimeAdapter(
      HYBRID_PRIMARY_RUNTIME_ID,
      HYBRID_PRIMARY_RUNTIME_VERSION,
      async (...args) => {
        nativeExecution = await provider.execute(...args);
        return nativeExecution;
      },
      evidenceStore,
      parseHybridPrimaryProviderOutput,
    );
    let contribution: ScientificInterpretationContributionEnvelope | null = null;
    let error: unknown = null;
    try {
      contribution = await adapter.interpret(conversation);
    } catch (caught) {
      error = caught;
    }
    const attempts = nativeExecution?.providerAttempts ?? [];
    transientRetries += Math.max(0, attempts.length - 1);
    const rawOutputRef = error instanceof ScientificInterpretationTechnicalError
      ? error.rawOutputRef
      : contribution?.source.rawOutputRef ?? null;
    const rawRecord = rawOutputRef ? await evidenceStore.read(rawOutputRef) : null;
    const projection = contribution ? projectScientificContributionToV1IfAllowed(contribution) : null;
    const record: LiveRecord = {
      scenarioId: scenario.scenarioId,
      technicalSuccess: Boolean(contribution),
      status: projection?.disposition ?? (error instanceof ScientificInterpretationTechnicalError ? error.failureClass : "FAIL_CLOSED_TECHNICAL"),
      rawOutputRef,
      rawOutputDigest: rawRecord?.rawOutputDigest ?? null,
      providerAttempts: attempts,
      providerRequestsForState: attempts.length,
      fallbackUsed: false,
      projectWrites: 0,
      criticalFindings: contribution?.audit.unresolvedFindings.filter((item) => item.status === "OPEN" && item.severity === "CRITICAL").map((item) => item.code) ?? [],
      contributionId: contribution?.identity.contributionId ?? null,
      contributionDigest: contribution?.identity.contributionDigest ?? null,
      error: error instanceof Error ? error.message : error ? "UNKNOWN_FAILURE" : null,
    };
    records.push(record);
    if (nativeExecution) {
      await evidenceStore.appendProviderLedger({
        operationId: nativeExecution.operationId,
        runtimeId: nativeExecution.runtimeId,
        runtimeVersion: nativeExecution.runtimeVersion,
        provider: nativeExecution.provider,
        model: nativeExecution.model,
        configurationDigest: nativeExecution.configurationDigest,
        rawOutputRef,
        rawOutputDigest: rawRecord?.rawOutputDigest ?? null,
        attempts: nativeExecution.providerAttempts,
        finalDisposition: record.status,
      });
    }
    await atomicJson(RESULTS, { campaignId: freeze.campaignId, startedAt, updatedAt: new Date().toISOString(), providerRequests, transientRetries, records });

    if (index === 0) {
      if (!record.technicalSuccess || !record.rawOutputRef || !record.rawOutputDigest) {
        await atomicJson(MANIFEST, { ...freeze, status: "BLOCKED", decision: "SEM_CLOSURE_001R_STRUCTURED_REQUEST_REPAIR_FAILED", startedAt, completedAt: new Date().toISOString(), providerRequests, transientRetries, completedScenarios: [scenario.scenarioId] });
        throw new Error("SEM_CLOSURE_001R_STRUCTURED_REQUEST_REPAIR_FAILED");
      }
      await atomicJson(FIRST_RESULT_FREEZE, {
        campaignId: freeze.campaignId,
        frozenIdentityDigest: logicalDigest(freeze),
        firstScenario: scenario.scenarioId,
        firstRawOutputDigest: record.rawOutputDigest,
        configurationFrozenAfterFirstValidResult: true,
      });
      if (logicalDigest(await frozenIdentity()) !== logicalDigest(freeze)) throw new Error("POST_I01_CONFIGURATION_DRIFT");
      await atomicJson(MANIFEST, { ...freeze, status: "RUNNING_I02_I08_FROZEN", startedAt, providerRequests, transientRetries, completedScenarios: [scenario.scenarioId] });
    } else {
      await atomicJson(MANIFEST, { ...freeze, status: "RUNNING_I02_I08_FROZEN", startedAt, providerRequests, transientRetries, completedScenarios: records.map((item) => item.scenarioId) });
    }
  }

  const summary = {
    responsesObtained: records.filter((item) => item.providerAttempts.some((attempt) => (attempt as { outcome?: unknown }).outcome === "SUCCESS")).length,
    rawPersisted: records.filter((item) => item.rawOutputRef && item.rawOutputDigest).length,
    internalValidationsSucceeded: records.filter((item) => item.technicalSuccess).length,
    explicitContributionsOrScientificDispositions: records.filter((item) => item.contributionId || ["NEEDS_REVIEW", "NEEDS_CLARIFICATION"].includes(item.status)).length,
    fallbackCount: 0,
    rawPersistenceFailures: records.filter((item) => item.status === "RAW_PERSISTENCE_FAILURE").length,
    structurallyInvalidAccepted: 0,
    criticalFindingsIgnored: records.filter((item) => item.criticalFindings.length > 0 && item.status === "ACCEPTED_FOR_V1_PROJECTION").length,
    projectWrites: 0,
    providerRequests,
    transientRetries,
    records: records.length,
  };
  const success = summary.responsesObtained === 8
    && summary.rawPersisted === 8
    && summary.internalValidationsSucceeded === 8
    && summary.explicitContributionsOrScientificDispositions === 8
    && summary.fallbackCount === 0
    && summary.rawPersistenceFailures === 0
    && summary.structurallyInvalidAccepted === 0
    && summary.criticalFindingsIgnored === 0
    && summary.projectWrites === 0;
  const completedAt = new Date().toISOString();
  await atomicJson(RESULTS, { campaignId: freeze.campaignId, startedAt, completedAt, providerRequests, transientRetries, summary, records });
  await atomicJson(MANIFEST, { ...freeze, status: success ? "COMPLETE" : "BLOCKED", decision: success ? "SEM_CLOSURE_001R_LIVE_GATE_PASS" : "SEM_CLOSURE_001R_LIVE_GATE_FAIL", startedAt, completedAt, providerRequests, transientRetries, completedScenarios: records.map((item) => item.scenarioId), summary });
  return { decision: success ? "SEM_CLOSURE_001R_LIVE_GATE_PASS" : "SEM_CLOSURE_001R_LIVE_GATE_FAIL", manifest: MANIFEST, results: RESULTS, summary };
};

const execute = process.argv.includes("--execute");
if (execute) {
  process.stdout.write(`${JSON.stringify(await run(), null, 2)}\n`);
} else {
  process.stdout.write(`${JSON.stringify(await verifyOrWriteFreeze(), null, 2)}\n`);
}
