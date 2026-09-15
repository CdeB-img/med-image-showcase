import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { stableStringify } from "../../knowledge-engine/canonical";
import { FileScientificInterpretationEvidenceStore } from "../../../../api/scientific-interpretation-evidence-store";
import { createRecordedProtocolDesignerFetch, createProtocolDesignerReplayFetch, readProtocolDesignerReplayRefs } from "../../../../api/protocol-designer-provider-replay";
import { boundCanaryProviderCall, createCanaryCampaignPolicy, resolveCanaryExecution, SINGLE_ATTEMPT_FAIL_CLOSED, QUALIFIED_CAMPAIGN_MODELS } from "../../../../api/protocol-designer-canary-policy";
import type { CanaryCampaignPolicy } from "../../../../api/protocol-designer-canary-policy";
import type { ProviderObservedRequestInit } from "../provider-call-observability";

const hash = (v: unknown) => createHash("sha256").update(stableStringify(v)).digest("hex");
const endpoint = "https://api.openai.com/v1/responses";
const policy = (overrides: Partial<Omit<CanaryCampaignPolicy, "policyDigest">> = {}) => createCanaryCampaignPolicy({
  campaignId: "synthetic-qualified-multisession", maxSessions: 5, measuredSoftStopUsd: 3, absoluteHardBoundUsd: 10,
  singleAttemptPolicy: SINGLE_ATTEMPT_FAIL_CLOSED, allowedProviderModels: QUALIFIED_CAMPAIGN_MODELS,
  createdAt: "2026-09-15T00:00:00.000Z", ...overrides,
});
const request = (sessionId: string, id = "r1", model = "gpt-5.6-luna"): ProviderObservedRequestInit => ({
  method: "POST", body: JSON.stringify({ model, instructions: "Instruction synthétique", input: "Texte synthétique",
    max_output_tokens: 8000, store: false }),
  noxiaProviderObservation: { context: { sessionId, conversationId: `conversation:${sessionId}`, turnId: `turn:${id}`,
    clientRequestId: id, testSessionId: "offline" }, purpose: model === "gpt-5.6-terra" ? "PERSISTENT_DELTA" : "LANGUAGE_PROJECTION",
    reasoningEffort: "low", retryIndex: 0, retryReason: null },
});
const response = (input = 1000, output = 100, model = "gpt-5.6-luna") => new Response(JSON.stringify({
  id: "synthetic-response", model, status: "completed", output_text: "synthetic text",
  usage: { input_tokens: input, output_tokens: output, input_tokens_details: { cached_tokens: 0, cache_write_tokens: 0 } },
}));
const roots: string[] = [];
afterEach(async () => { vi.restoreAllMocks(); await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))); });
const create = async (campaignPolicy = policy(), fetchImpl = vi.fn<typeof fetch>(async () => response())) => {
  const directory = await mkdtemp(join(tmpdir(), "noxia-multi-session-safety-")); roots.push(directory);
  const root = join(directory, `canary-${campaignPolicy.campaignId}`);
  const options = { root, campaignPolicy, canaryCampaignId: campaignPolicy.campaignId, fetchImpl };
  return { root, directory, options, provider: fetchImpl, run: createRecordedProtocolDesignerFetch(options) };
};
type Captured = { request: { body: string }; requestDigest: string; canaryAdmission: {
  campaignId: string; sessionId: string; projectId: string | null; committedBeforeUsd: number; measuredBeforeUsd: number;
  campaignPolicy: CanaryCampaignPolicy; bound: { upperBoundUsd: number };
}; canarySettlement: { measuredCostUsd: number; committedCostUpperBoundUsd: number } };
const exchanges = async (root: string) => Promise.all((await readProtocolDesignerReplayRefs(root)).map(async (ref) =>
  (await new FileScientificInterpretationEvidenceStore(root).read(ref))!.payload as Captured));
const ledger = (root: string) => readFile(join(root, "protocol-designer-exchanges.jsonl"), "utf8");

describe("multi-session campaign safety — offline only", () => {
  it("never rounds a configured absolute hard bound upward to admit an excessive reservation", async () => {
    const input = request("A");
    const bound = boundCanaryProviderCall(endpoint, JSON.stringify({ ...JSON.parse(input.body as string), service_tier: "default" }));
    const hard = bound.upperBoundUsd - 0.25e-9;
    const e = await create(policy({ absoluteHardBoundUsd: hard, measuredSoftStopUsd: 0.01 }));
    expect(bound.upperBoundUsd).toBeGreaterThan(hard);
    await expect(e.run(endpoint, input)).rejects.toThrow("DENIED_HARD_BUDGET");
    expect(e.provider).not.toHaveBeenCalled();
  });
  it("MULTI_SESSION_01: A then B retain one cumulative campaign budget", async () => {
    const e = await create(); await e.run(endpoint, request("A")); await e.run(endpoint, request("B"));
    const [a, b] = await exchanges(e.root);
    expect(b.canaryAdmission.committedBeforeUsd).toBe(a.canarySettlement.committedCostUpperBoundUsd);
    expect(b.canaryAdmission.measuredBeforeUsd).toBe(a.canarySettlement.measuredCostUsd);
    expect(b.canaryAdmission.campaignPolicy).toEqual(e.options.campaignPolicy);
  });
  it("MULTI_SESSION_02: five sessions share the same prepared/completed ledger", async () => {
    const e = await create();
    for (const s of ["A01", "A02", "A04", "B01", "F01"]) await e.run(endpoint, request(s));
    const rows = await exchanges(e.root);
    expect(new Set(rows.map((r) => r.canaryAdmission.sessionId)).size).toBe(5);
    expect(new Set(rows.map((r) => r.canaryAdmission.campaignId))).toEqual(new Set([e.options.campaignPolicy.campaignId]));
    expect((await ledger(e.root)).trim().split("\n")).toHaveLength(10);
    expect(rows[4].canaryAdmission.committedBeforeUsd).toBeCloseTo(rows[0].canarySettlement.committedCostUpperBoundUsd * 4, 9);
  });
  it("MULTI_SESSION_03: sixth session is refused before transport", async () => {
    const e = await create(); for (const s of ["A", "B", "C", "D", "E"]) await e.run(endpoint, request(s));
    const before = await ledger(e.root);
    await expect(e.run(endpoint, request("F"))).rejects.toThrow("CANARY_MAX_SESSIONS_REACHED");
    expect(e.provider).toHaveBeenCalledTimes(5); expect(await ledger(e.root)).toBe(before);
  });
  it("MULTI_SESSION_04: new session cannot reset committed cost", async () => {
    const e = await create(policy({ absoluteHardBoundUsd: 0.5395, measuredSoftStopUsd: 0.5 }));
    await e.run(endpoint, request("A"));
    await expect(e.run(endpoint, request("B"))).rejects.toThrow("DENIED_HARD_BUDGET");
    expect(e.provider).toHaveBeenCalledTimes(1);
  });
  it("MULTI_SESSION_05: new Project and session preserve spend and distinguish project provenance", async () => {
    const e = await create();
    await createRecordedProtocolDesignerFetch({ ...e.options, projectId: "project-A" })(endpoint, request("A"));
    await createRecordedProtocolDesignerFetch({ ...e.options, projectId: "project-B" })(endpoint, request("B"));
    const [a, b] = await exchanges(e.root);
    expect(a.canaryAdmission.projectId).toBe("project-A"); expect(b.canaryAdmission.projectId).toBe("project-B");
    expect(b.canaryAdmission.committedBeforeUsd).toBe(a.canarySettlement.committedCostUpperBoundUsd);
  });
  it("MULTI_SESSION_06: a new recorder reconstructs earlier sessions", async () => {
    const e = await create(); await e.run(endpoint, request("A"));
    await createRecordedProtocolDesignerFetch(e.options)(endpoint, request("B"));
    expect((await exchanges(e.root))[1].canaryAdmission.measuredBeforeUsd).toBeGreaterThan(0);
  });
  it("MULTI_SESSION_07: simulated process restart restores policy, sessions and consumption", async () => {
    const e = await create(); await e.run(endpoint, request("A")); vi.resetModules();
    const fresh = await import("../../../../api/protocol-designer-provider-replay");
    await fresh.createRecordedProtocolDesignerFetch(e.options)(endpoint, request("B"));
    const rows = await exchanges(e.root);
    expect(rows[1].canaryAdmission.committedBeforeUsd).toBe(rows[0].canarySettlement.committedCostUpperBoundUsd);
    await expect(fresh.createRecordedProtocolDesignerFetch(e.options)(endpoint, request("A"))).rejects.toThrow("CANARY_LOGICAL_CALL_ALREADY_CONSUMED");
  });
  it("MULTI_SESSION_08: campaign lock serializes competing sessions through settlement", async () => {
    let release!: (r: Response) => void; let entered!: () => void;
    const started = new Promise<void>((resolve) => { entered = resolve; });
    const provider = vi.fn<typeof fetch>(async () => { entered(); return new Promise<Response>((resolve) => { release = resolve; }); });
    const e = await create(policy(), provider); const pending = e.run(endpoint, request("A")); await started;
    expect(await ledger(e.root)).toContain("REQUEST_PREPARED"); expect(await ledger(e.root)).not.toContain("COMPLETED");
    await expect(createRecordedProtocolDesignerFetch(e.options)(endpoint, request("B"))).rejects.toThrow("CANARY_CONCURRENT_OR_UNSETTLED_EXECUTION");
    expect(provider).toHaveBeenCalledTimes(1); release(response()); await pending;
    provider.mockImplementation(async () => response()); await e.run(endpoint, request("B"));
    expect((await exchanges(e.root))[1].canaryAdmission.committedBeforeUsd).toBeGreaterThan(0);
  });
  it("MULTI_SESSION_09: the common hard bound prevents aggregate overspend", async () => {
    const e = await create(policy({ absoluteHardBoundUsd: 0.54, measuredSoftStopUsd: 0.5 }));
    await e.run(endpoint, request("A")); await e.run(endpoint, request("B"));
    await expect(e.run(endpoint, request("C"))).rejects.toThrow("DENIED_HARD_BUDGET");
    for (const row of await exchanges(e.root)) expect(row.canaryAdmission.committedBeforeUsd + row.canaryAdmission.bound.upperBoundUsd).toBeLessThanOrEqual(0.54);
    expect(e.provider).toHaveBeenCalledTimes(2);
  });
  it("MULTI_SESSION_10: A+B+C reach three measured dollars and D is stopped", async () => {
    const e = await create(policy(), vi.fn<typeof fetch>(async () => response(300000, 1000, "gpt-5.6-terra")));
    for (const s of ["A", "B", "C"]) await e.run(endpoint, request(s, "r1", "gpt-5.6-terra"));
    expect((await exchanges(e.root)).reduce((sum, r) => sum + r.canarySettlement.measuredCostUsd, 0)).toBeGreaterThanOrEqual(3);
    await expect(e.run(endpoint, request("D"))).rejects.toThrow("DENIED_SOFT_STOP"); expect(e.provider).toHaveBeenCalledTimes(3);
  });
  it.each(["missing", "corrupt", "truncated"])("MULTI_SESSION_11: %s global ledger with session evidence fails closed", async (kind) => {
    const e = await create(); await e.run(endpoint, request("A"));
    const p = join(e.root, "protocol-designer-exchanges.jsonl");
    if (kind === "missing") await unlink(p); else await writeFile(p, kind === "corrupt" ? "{broken" : "");
    await expect(e.run(endpoint, request("B"))).rejects.toThrow(/CANARY_LEDGER/); expect(e.provider).toHaveBeenCalledTimes(1);
  });
  it("MULTI_SESSION_12: ledger session without its identity claim is rejected", async () => {
    const e = await create(); await e.run(endpoint, request("A"));
    await unlink(join(e.directory, ".campaign-identities", `session-${hash("A")}.json`));
    await expect(e.run(endpoint, request("B"))).rejects.toThrow("CANARY_IDENTITY_OR_POLICY_MISMATCH");
    expect(e.provider).toHaveBeenCalledTimes(1);
  });
  it("MULTI_SESSION_13: persisted and supplied policy changes cannot follow spending", async () => {
    const e = await create(); await e.run(endpoint, request("A"));
    const changed = policy({ measuredSoftStopUsd: 2 });
    await expect(createRecordedProtocolDesignerFetch({ ...e.options, campaignPolicy: changed })(endpoint, request("B"))).rejects.toThrow("CANARY_CAMPAIGN_POLICY_CHANGED");
    await writeFile(join(e.root, "campaign-policy.json"), JSON.stringify({ ...e.options.campaignPolicy, policyDigest: "wrong" }));
    await expect(e.run(endpoint, request("B"))).rejects.toThrow("CANARY_CAMPAIGN_POLICY_DIGEST_MISMATCH");
    expect(e.provider).toHaveBeenCalledTimes(1);
  });
  it("MULTI_SESSION_14: client metadata cannot supply a campaign budget or policy", async () => {
    const e = await create(); const req = request("A");
    Object.assign(req.noxiaProviderObservation!, { campaignPolicy: { maxSessions: 999, absoluteHardBoundUsd: 999 }, campaignId: "forged" });
    await e.run(endpoint, req);
    expect((await exchanges(e.root))[0].canaryAdmission.campaignPolicy).toEqual(e.options.campaignPolicy);
  });
  it("MULTI_SESSION_15: historical mono-session evidence and 1/6 limits remain unchanged", async () => {
    const e = await create(); const old = { ...e.options, campaignPolicy: undefined };
    await createRecordedProtocolDesignerFetch(old)(endpoint, request("A")); const before = await ledger(e.root);
    await expect(createRecordedProtocolDesignerFetch(old)(endpoint, request("B"))).rejects.toThrow("CANARY_SESSION_MISMATCH");
    await expect(e.run(endpoint, request("B"))).rejects.toThrow("CANARY_POLICY_MISSING_OR_HISTORICAL_CAMPAIGN");
    expect(await ledger(e.root)).toBe(before);
    const row = (await exchanges(e.root))[0];
    expect(row.canaryAdmission).toMatchObject({ budgetPolicy: { absoluteHardCampaignBoundUsd: 6, measuredCostSoftStopUsd: 1 } });
    expect(row.canaryAdmission.campaignPolicy).toBeUndefined();
  });
  it("MULTI_SESSION_16: identical request bodies cannot cross session replay scopes", async () => {
    const e = await create(); await e.run(endpoint, request("A")); await e.run(endpoint, request("B"));
    const a = { campaignId: e.options.campaignPolicy.campaignId, sessionId: "A" };
    const b = { ...a, sessionId: "B" };
    const aRefs = await readProtocolDesignerReplayRefs(e.root, a), bRefs = await readProtocolDesignerReplayRefs(e.root, b);
    expect(aRefs).toHaveLength(1); expect(bRefs).toHaveLength(1); expect(aRefs).not.toEqual(bRefs);
    await expect(createProtocolDesignerReplayFetch({ root: e.root, refs: bRefs, scope: a })(endpoint, request("A"))).rejects.toThrow("PROVIDER_REPLAY_SESSION_SCOPE_MISMATCH");
    expect(await (await createProtocolDesignerReplayFetch({ root: e.root, refs: aRefs, scope: a })(endpoint, request("A"))).text()).toBe(await response().text());
    await expect(createProtocolDesignerReplayFetch({ root: e.root, refs: aRefs })(endpoint, request("A"))).rejects.toThrow("PROVIDER_REPLAY_SESSION_SCOPE_MISMATCH");
  });
  it("MULTI_SESSION_17: offline replay never mutates spend or evidence", async () => {
    const e = await create(); await e.run(endpoint, request("A")); const before = await ledger(e.root);
    const scope = { campaignId: e.options.campaignPolicy.campaignId, sessionId: "A" };
    const replay = createProtocolDesignerReplayFetch({ root: e.root, refs: await readProtocolDesignerReplayRefs(e.root, scope), scope });
    await replay(endpoint, request("A")); await expect(replay(endpoint, request("A"))).rejects.toThrow("PROVIDER_REPLAY_EXHAUSTED_NO_LIVE_FALLBACK");
    expect(await ledger(e.root)).toBe(before); expect(e.provider).toHaveBeenCalledTimes(1);
  });
  it("MULTI_SESSION_18: exactly one transport per logical call in every session", async () => {
    const e = await create();
    for (const s of ["A", "B", "C", "D", "E"]) {
      await e.run(endpoint, request(s));
      await expect(createRecordedProtocolDesignerFetch(e.options)(endpoint, request(s))).rejects.toThrow("CANARY_LOGICAL_CALL_ALREADY_CONSUMED");
      const retry = request(s, "new"); retry.noxiaProviderObservation = { ...retry.noxiaProviderObservation!, retryIndex: 1 };
      await expect(e.run(endpoint, retry)).rejects.toThrow("CANARY_SINGLE_ATTEMPT_METADATA_REQUIRED");
    }
    expect(e.provider).toHaveBeenCalledTimes(5);
  });
  it("cannot bind the same session to a second new campaign", async () => {
    const e = await create(); await e.run(endpoint, request("A")); const p = policy({ campaignId: "another-campaign" });
    await expect(createRecordedProtocolDesignerFetch({ ...e.options, root: join(e.directory, `canary-${p.campaignId}`), campaignPolicy: p,
      canaryCampaignId: p.campaignId })(endpoint, request("A"))).rejects.toThrow("CANARY_SESSION_ALREADY_BOUND");
    expect(e.provider).toHaveBeenCalledTimes(1);
  });
  it.each(["historical-first", "policy-first"])("session ownership cannot cross campaign formats: %s", async (order) => {
    const e = await create();
    const historical = createRecordedProtocolDesignerFetch({ root: join(e.directory, "canary-historical"),
      canaryCampaignId: "historical", fetchImpl: e.provider });
    const first = order === "historical-first" ? historical : e.run;
    const second = order === "historical-first" ? e.run : historical;
    await first(endpoint, request("A"));
    await expect(second(endpoint, request("A"))).rejects.toThrow("CANARY_SESSION_ALREADY_BOUND");
    expect(e.provider).toHaveBeenCalledTimes(1);
  });
  it("replay rejects an incoming metadata session inconsistent with the requested replay scope", async () => {
    const e = await create(); await e.run(endpoint, request("A"));
    const scope = { campaignId: e.options.canaryCampaignId, sessionId: "A" };
    const replay = createProtocolDesignerReplayFetch({ root: e.root, refs: await readProtocolDesignerReplayRefs(e.root, scope), scope });
    await expect(replay(endpoint, request("B"))).rejects.toThrow("PROVIDER_REPLAY_SESSION_SCOPE_MISMATCH");
  });
  it("concurrent historical/policy campaigns cannot spend for the same session", async () => {
    const e = await create();
    const historical = createRecordedProtocolDesignerFetch({ root: join(e.directory, "canary-historical"),
      canaryCampaignId: "historical", fetchImpl: e.provider });
    const outcomes = await Promise.allSettled([e.run(endpoint, request("A")), historical(endpoint, request("A"))]);
    expect(e.provider.mock.calls.length).toBeLessThanOrEqual(1);
    expect(outcomes.some((r) => r.status === "rejected")).toBe(true);
  });
  it("cannot claim a historical session from a partially reread legacy journal", async () => {
    const e = await create(); const oldRoot = join(e.directory, "canary-historical");
    await createRecordedProtocolDesignerFetch({ root: oldRoot, canaryCampaignId: "historical", fetchImpl: e.provider })(endpoint, request("A"));
    // Reproduce evidence predating the registry, then a truncated journal with
    // original raw evidence retained. No real historical file is changed.
    await unlink(join(e.directory, ".campaign-identities", `session-${hash("A")}.json`));
    await writeFile(join(oldRoot, "protocol-designer-exchanges.jsonl"), "");
    await expect(e.run(endpoint, request("A"))).rejects.toThrow(/CANARY_/);
    expect(e.provider).toHaveBeenCalledTimes(1);
  });
  it.each(["missing-usage", "http-failure", "transport-failure"])("new sessions cannot release uncertain cost after %s", async (failure) => {
    const e = await create(policy(), vi.fn<typeof fetch>(async () => {
      if (failure === "transport-failure") throw new Error("synthetic network failure");
      return failure === "missing-usage" ? new Response('{}') : new Response('{}', { status: 500 });
    }));
    try { await e.run(endpoint, request("A")); } catch { /* transport failure is retained */ }
    await expect(e.run(endpoint, request("B"))).rejects.toThrow(/CANARY_STOP_/);
    expect(e.provider).toHaveBeenCalledTimes(1);
  });
  it("a different policy cannot follow the first prepared record, even without completion", async () => {
    const e = await create(); await e.run(endpoint, request("A"));
    await writeFile(join(e.root, "protocol-designer-exchanges.jsonl"), (await ledger(e.root)).split("\n")[0]+"\n");
    await expect(createRecordedProtocolDesignerFetch({ ...e.options, campaignPolicy: policy({ maxSessions: 4 }) })(endpoint, request("B")))
      .rejects.toThrow("CANARY_CAMPAIGN_POLICY_CHANGED");
    expect(e.provider).toHaveBeenCalledTimes(1);
  });
  it.each(["policy", "campaign-registry", "completion"])("missing %s cannot silently initialize or repair a campaign", async (kind) => {
    const e = await create(); await e.run(endpoint, request("A"));
    if (kind === "policy") await unlink(join(e.root, "campaign-policy.json"));
    else if (kind === "campaign-registry") await unlink(join(e.directory, ".campaign-identities", `campaign-${hash(e.options.canaryCampaignId)}.json`));
    else await writeFile(join(e.root, "protocol-designer-exchanges.jsonl"), (await ledger(e.root)).split("\n")[0]+"\n");
    await expect(e.run(endpoint, request("B"))).rejects.toThrow(/CANARY_/); expect(e.provider).toHaveBeenCalledTimes(1);
  });
  it("cannot downgrade a policy campaign to historical or unguarded recording", async () => {
    const e = await create(); await e.run(endpoint, request("A"));
    await expect(createRecordedProtocolDesignerFetch({ ...e.options, campaignPolicy: undefined })(endpoint, request("A", "r2"))).rejects.toThrow("CANARY_POLICY_REQUIRED_NO_HISTORICAL_FALLBACK");
    await expect(createRecordedProtocolDesignerFetch({ root: e.root, fetchImpl: e.provider })(endpoint, request("A", "r2"))).rejects.toThrow("CANARY_POLICY_REQUIRED_NO_NORMAL_FALLBACK");
    expect(e.provider).toHaveBeenCalledTimes(1);
  });
  it.each(["maxSessions", "negative", "soft-hard", "hard-missing", "extra", "models", "fraction", "soft-zero"])("rejects invalid server policy: %s", (kind) => {
    const invalid = { maxSessions: { maxSessions: 6 }, negative: { measuredSoftStopUsd: -1 }, "soft-hard": { measuredSoftStopUsd: 3, absoluteHardBoundUsd: 2 },
      "hard-missing": { absoluteHardBoundUsd: undefined }, extra: { clientControl: true }, models: { allowedProviderModels: ["unqualified"] }, fraction: { maxSessions: 1.5 }, "soft-zero": { measuredSoftStopUsd: 0 } }[kind];
    expect(() => policy(invalid)).toThrow("CANARY_CAMPAIGN_POLICY_INVALID");
  });
  it("server activation is explicit, complete, immutable and leaves normal/historical modes unchanged", () => {
    expect(resolveCanaryExecution({})).toBeNull();
    expect(resolveCanaryExecution({ PROTOCOL_DESIGNER_LIVE_CANARY: SINGLE_ATTEMPT_FAIL_CLOSED, PROTOCOL_DESIGNER_CANARY_ID: "old" })).toEqual({ attemptPolicy: SINGLE_ATTEMPT_FAIL_CLOSED, campaignId: "old" });
    for (const configured of ["", "{invalid", JSON.stringify(policy())]) expect(() => resolveCanaryExecution({ PROTOCOL_DESIGNER_CAMPAIGN_POLICY: configured })).toThrow();
    const p = policy(); const config = resolveCanaryExecution({ PROTOCOL_DESIGNER_LIVE_CANARY: SINGLE_ATTEMPT_FAIL_CLOSED,
      PROTOCOL_DESIGNER_CANARY_ID: p.campaignId, PROTOCOL_DESIGNER_CAMPAIGN_POLICY: JSON.stringify(p) });
    expect(config?.campaignPolicy).toEqual(p); expect(Object.isFrozen(config?.campaignPolicy?.allowedProviderModels)).toBe(true);
  });
  it("preserves both prepared/completed raw records and the policy under private evidence", async () => {
    const e = await create(); await e.run(endpoint, request("A"));
    expect(await readdir(join(e.root, "raw"))).toHaveLength(2);
    expect(JSON.parse(await readFile(join(e.root, "campaign-policy.json"), "utf8"))).toEqual(e.options.campaignPolicy);
  });
});
