import { readFile, mkdir, rename, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { FileScientificInterpretationEvidenceStore } from "../api/scientific-interpretation-evidence-store";
import { GeminiHybridScientificInterpretationProvider, RollingSingleConcurrencyGate } from "../api/scientific-interpretation-provider";
import { executeLegacySemRollback } from "../api/scientific-interpretation-legacy-rollback";
import { logicalDigest } from "../src/features/knowledge-engine/canonical";
import {
  HybridScientificInterpretationRuntimeAdapter,
  ScientificInterpretationTechnicalError,
  executeScientificInterpretation,
  parseHybridPrimaryProviderOutput,
  projectScientificContributionToV1IfAllowed,
  type ScientificInterpretationConversation,
  type ScientificInterpretationRuntime,
} from "../src/features/scientific-interpretation";

const ROOT = resolve(import.meta.dirname, "..");
const SOURCE = resolve(ROOT, "experiments/semantic-engine-comparison/results/common-contract-ablation-02/scenario-pack-frozen.json");
const RESULT_ROOT = resolve(ROOT, "experiments/engine-lab/results/sem-closure-001-live");
const MANIFEST = resolve(RESULT_ROOT, "run-manifest.json");
const RESULTS = resolve(RESULT_ROOT, "live-results.json");
const MAX_PROVIDER_REQUESTS = 12;
const PRIMARY_OPERATIONS = 8;
const MAX_RETRY_REQUESTS = 4;

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
    turns: [item.t0, item.r1, item.r2].map((content, index) => ({ turnId: index === 0 ? "T0" : `R${index}`, role: "USER" as const, content: String(content ?? "") })),
  }));
  if (scenarios.map((item) => item.scenarioId).join(",") !== "I01,I02,I03,I04,I05,I06,I07,I08" || scenarios.some((item) => item.turns.some((turn) => !turn.content))) {
    throw new Error("VISIBLE_I01_I08_T2_BINDING_INVALID");
  }
  return scenarios;
};

const preflight = async () => {
  loadEnvironment();
  const scenarios = await visibleScenarios();
  const model = process.env.GEMINI_MODEL?.trim() ?? "";
  const keyPresent = Boolean(process.env.GEMINI_API_KEY?.trim());
  return {
    closureId: "SEM-CLOSURE-001",
    status: keyPresent && model ? "READY" : "BLOCKED_CONFIGURATION",
    provider: "GOOGLE_GEMINI",
    model: model || "MISSING",
    apiKeyPresent: keyPresent,
    transmittedData: "VISIBLE_SYNTHETIC_I01_I08_COMPLETE_T2_CONVERSATIONS_ONLY",
    hiddenCardsTransmitted: false,
    blindAccessed: false,
    primaryOperations: PRIMARY_OPERATIONS,
    estimatedProviderRequests: PRIMARY_OPERATIONS,
    transientRetryReserve: MAX_RETRY_REQUESTS,
    hardStop: MAX_PROVIDER_REQUESTS,
    maximumStartsPerRolling60Seconds: 10,
    concurrency: 1,
    semanticRetries: 0,
    auditLCalls: 0,
    adjudicatorCalls: 0,
    projectWrites: 0,
    scenarioDigest: logicalDigest(scenarios),
  };
};

const run = async () => {
  const check = await preflight();
  if (check.status !== "READY") throw new Error("LIVE_PROVIDER_CONFIGURATION_MISSING");
  let priorManifest: Record<string, unknown> | null = null;
  if (existsSync(MANIFEST)) {
    priorManifest = JSON.parse(await readFile(MANIFEST, "utf8"));
    if (priorManifest?.status === "COMPLETE") throw new Error("SEM_CLOSURE_LIVE_ALREADY_COMPLETE_REPLAY_FORBIDDEN");
    if (priorManifest?.scenarioDigest !== check.scenarioDigest || priorManifest?.model !== check.model) {
      throw new Error("SEM_CLOSURE_LIVE_RESUME_IDENTITY_MISMATCH");
    }
  }
  const scenarios = await visibleScenarios();
  const apiKey = process.env.GEMINI_API_KEY!.trim();
  const model = process.env.GEMINI_MODEL!.trim();
  const evidenceStore = new FileScientificInterpretationEvidenceStore(RESULT_ROOT);
  const gate = new RollingSingleConcurrencyGate();
  const nativeFetch = fetch;
  const priorResults = existsSync(RESULTS)
    ? JSON.parse(await readFile(RESULTS, "utf8")) as { records?: Array<Record<string, unknown>> }
    : null;
  let providerRequests = Number(priorManifest?.providerRequests ?? 0);
  let exhaustedIndependentOperations = 0;
  const countedFetch: typeof fetch = async (...args) => {
    if (providerRequests >= MAX_PROVIDER_REQUESTS) return new Response(JSON.stringify({ error: { status: "CAMPAIGN_HARD_STOP" } }), { status: 400, headers: { "content-type": "application/json" } });
    providerRequests += 1;
    return nativeFetch(...args);
  };
  const records: Array<Record<string, unknown>> = [...(priorResults?.records ?? [])];
  const completedScenarios = new Set(records.map((item) => String(item.scenarioId)));
  const startedAt = String(priorManifest?.startedAt ?? new Date().toISOString());
  await atomicJson(MANIFEST, { ...check, status: "RUNNING", startedAt, providerRequests, completedScenarios: [...completedScenarios] });

  for (const scenario of scenarios) {
    if (completedScenarios.has(scenario.scenarioId)) continue;
    const conversation: ScientificInterpretationConversation = { conversationId: `SEM-CLOSURE-001-${scenario.scenarioId}`, language: "fr", turns: scenario.turns };
    let nativeExecution: Awaited<ReturnType<GeminiHybridScientificInterpretationProvider["execute"]>> | null = null;
    const provider = new GeminiHybridScientificInterpretationProvider({ apiKey, model, temperature: null, maxAttempts: 2, fetchImpl: countedFetch, gate });
    const hybridRuntime = new HybridScientificInterpretationRuntimeAdapter("HYBRID_PRIMARY_STRUCTURED", "1.0.0", async (...args) => {
      nativeExecution = await provider.execute(...args);
      return nativeExecution;
    }, evidenceStore, parseHybridPrimaryProviderOutput);
    const legacyRuntime: ScientificInterpretationRuntime = {
      runtimeId: "LEGACY_SEM_FULL",
      runtimeVersion: "1.1",
      interpret: async (sourceConversation) => executeLegacySemRollback({ conversation: sourceConversation, apiKey: null, model: null }),
    };
    const started = Date.now();
    try {
      const execution = await executeScientificInterpretation({ conversation, hybridRuntime, legacyRuntime, mode: "HYBRID_ACTIVE_WITH_LEGACY_FALLBACK" });
      const projection = projectScientificContributionToV1IfAllowed(execution.activeContribution);
      const rawRef = execution.fallback?.rawOutputRef ?? execution.activeContribution.source.rawOutputRef;
      const rawRecord = rawRef ? await evidenceStore.read(rawRef) : null;
      const attempts = nativeExecution?.providerAttempts ?? [];
      if (attempts.length === 2 && attempts.every((attempt) => attempt.outcome === "FAILED")) exhaustedIndependentOperations += 1;
      if (exhaustedIndependentOperations >= 3) throw new Error("THREE_INDEPENDENT_LIVE_OPERATIONS_EXHAUSTED_TRANSIENT_RETRY");
      await evidenceStore.appendProviderLedger({
        operationId: nativeExecution?.operationId ?? `unavailable:${scenario.scenarioId}`,
        runtimeId: nativeExecution?.runtimeId ?? "HYBRID_PRIMARY_STRUCTURED",
        runtimeVersion: nativeExecution?.runtimeVersion ?? "1.0.0",
        provider: nativeExecution?.provider ?? "GOOGLE_GEMINI",
        model,
        configurationDigest: nativeExecution?.configurationDigest ?? null,
        rawOutputRef: rawRef,
        rawOutputDigest: rawRecord?.rawOutputDigest ?? null,
        attempts,
        finalDisposition: execution.fallbackUsed ? `FALLBACK:${execution.fallback?.failureClass}` : projection.disposition,
      });
      records.push({
        scenarioId: scenario.scenarioId,
        conversationDigest: logicalDigest(conversation),
        status: projection.disposition,
        runtimeMode: execution.mode,
        activeRuntimeId: execution.activeContribution.identity.runtimeId,
        contributionId: execution.activeContribution.identity.contributionId,
        contributionDigest: execution.activeContribution.identity.contributionDigest,
        rawOutputRef: rawRef,
        rawOutputDigest: rawRecord?.rawOutputDigest ?? null,
        rawReconstructible: Boolean(rawRecord),
        fallbackUsed: execution.fallbackUsed,
        fallback: execution.fallback,
        criticalFindings: execution.activeContribution.audit.unresolvedFindings.filter((item) => item.severity === "CRITICAL" && item.status === "OPEN").map((item) => item.code),
        v1ProjectionProduced: Boolean(projection.projection),
        projectWrites: execution.projectWrites,
        semanticAuditLExecuted: false,
        adjudicatorExecuted: false,
        providerAttempts: attempts,
        providerRequestsForState: attempts.length,
        latencyMs: Date.now() - started,
      });
    } catch (caught) {
      const error = caught instanceof ScientificInterpretationTechnicalError ? caught : null;
      records.push({
        scenarioId: scenario.scenarioId,
        conversationDigest: logicalDigest(conversation),
        status: "FAIL_CLOSED",
        failureClass: error?.failureClass ?? "HYBRID_RUNTIME_UNAVAILABLE",
        message: caught instanceof Error ? caught.message : "UNKNOWN_FAILURE",
        rawOutputRef: error?.rawOutputRef ?? null,
        operationId: error?.operationId ?? null,
        projectWrites: 0,
        semanticAuditLExecuted: false,
        adjudicatorExecuted: false,
        providerAttempts: nativeExecution?.providerAttempts ?? [],
        providerRequestsForState: nativeExecution?.providerAttempts?.length ?? 0,
        latencyMs: Date.now() - started,
      });
    }
    completedScenarios.add(scenario.scenarioId);
    await atomicJson(RESULTS, { closureId: "SEM-CLOSURE-001", startedAt, updatedAt: new Date().toISOString(), providerRequests, records });
    await atomicJson(MANIFEST, { ...check, status: "RUNNING", startedAt, providerRequests, completedScenarios: records.map((item) => item.scenarioId) });
  }

  const completedAt = new Date().toISOString();
  const summary = {
    states: records.length,
    acceptedForV1Projection: records.filter((item) => item.status === "ACCEPTED_FOR_V1_PROJECTION").length,
    needsClarification: records.filter((item) => item.status === "NEEDS_CLARIFICATION").length,
    needsReview: records.filter((item) => item.status === "NEEDS_REVIEW").length,
    failClosed: records.filter((item) => item.status === "FAIL_CLOSED").length,
    criticalFindingStates: records.filter((item) => Array.isArray(item.criticalFindings) && item.criticalFindings.length > 0).length,
    fallbackCount: records.filter((item) => item.fallbackUsed === true).length,
    rawReconstructible: records.filter((item) => item.rawReconstructible === true).length,
    projectWrites: 0,
    providerRequests,
    retries: Math.max(0, providerRequests - PRIMARY_OPERATIONS),
    callsPerState: records.length ? providerRequests / records.length : null,
    latencyMs: records.reduce((sum, item) => sum + Number(item.latencyMs ?? 0), 0),
  };
  await atomicJson(RESULTS, { closureId: "SEM-CLOSURE-001", startedAt, completedAt, providerRequests, summary, records });
  await atomicJson(MANIFEST, { ...check, status: "COMPLETE", startedAt, completedAt, providerRequests, completedScenarios: records.map((item) => item.scenarioId), summary });
  return { manifest: MANIFEST, results: RESULTS, summary };
};

const execute = process.argv.includes("--execute");
const output = execute ? await run() : await preflight();
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
