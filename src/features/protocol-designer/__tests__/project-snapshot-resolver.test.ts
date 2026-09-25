import { afterEach, describe, expect, it, vi } from "vitest";
import { confirmResearchProjectContribution, researchProjectOwnerDigest } from "../../research-project-construction/contribution-owner-boundary";
import { parseProductBridgeRequest, type ProductBridgeRequest } from "../product-bridge";
import { requestProtocolDesignerBridge } from "../product-bridge-client";
import { handleProtocolDesignerBridge, type ApiResponse } from "../../../../api/protocol-designer-bridge";
import { handleProtocolDesignerProjectSnapshot } from "../../../../api/protocol-designer-project-snapshot";
import { createMemoryProtocolDesignerGuardForTests, type PublicProtocolDesignerDurableGuard } from "../../../../server/protocol-designer-durable-guard";
import {
  ProjectSnapshotError,
  parseProjectSnapshotRef,
  parseVerifiedProjectSnapshot,
  type ProtocolDesignerProjectSnapshotStore,
} from "../../../../server/protocol-designer-project-snapshot";
import { makeFunctionalResetContribution, COLCHICINE_INITIAL } from "../functional-reset/__tests__/functional-reset-fixtures";

const sessionId = "protocol-designer-session:synthetic-snapshot-test";
const projectId = `${sessionId}:research-project`;
const at = "2026-09-25T10:00:00.000Z";
const authority = { actorRef: "synthetic-researcher", mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const, verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const };
const firstTurn = { turnId: "synthetic-first", role: "USER" as const, content: COLCHICINE_INITIAL, createdAt: at };
const projectV1 = () => confirmResearchProjectContribution({
  contribution: makeFunctionalResetContribution([firstTurn]), current: null,
  projectId, authority, confirmedAt: at,
});

afterEach(() => vi.unstubAllGlobals());

describe("verified immutable Project transport", () => {
  it("verifies the canonical owner's digest and exact session/version binding", () => {
    const project = projectV1();
    expect(parseVerifiedProjectSnapshot(project, sessionId)).toEqual(project);
    expect(() => parseVerifiedProjectSnapshot(project, "protocol-designer-session:another"))
      .toThrow("PROJECT_SNAPSHOT_CANONICAL_INVALID");
    expect(() => parseVerifiedProjectSnapshot({ ...project, projectDigest: "ke1-invalid" }, sessionId))
      .toThrow("PROJECT_SNAPSHOT_DIGEST_MISMATCH");
    expect(() => parseProjectSnapshotRef({ projectId, versionId: project.versionId,
      projectDigest: project.projectDigest, latest: true })).toThrow("PROJECT_SNAPSHOT_REF_INVALID");
  });

  it("uploads once, then transports only the exact reference and server-issued proof", async () => {
    const project = projectV1();
    const storage = new Map<string, string>();
    vi.stubGlobal("window", { localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => { storage.set(key, value); },
    } });
    const calls: Array<{ url: string; body: Record<string, unknown>; headers: Record<string, string> }> = [];
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as Record<string, unknown>;
      calls.push({ url, body, headers: init.headers as Record<string, string> });
      if (url.endsWith("project-snapshot")) return new Response(JSON.stringify({
        contract: "VERIFIED_PROJECT_SNAPSHOT",
        ref: { projectId, versionId: project.versionId, projectDigest: project.projectDigest },
        proof: "p".repeat(43),
      }), { status: 200 });
      return new Response(JSON.stringify({ apiVersion: "1.0.0", assistantReply: "Réponse synthétique." }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const request: Omit<ProductBridgeRequest, "apiVersion"> = {
      conversation: { conversationId: "synthetic-conversation", language: "fr", turns: [firstTurn] },
      currentProject: project, evaluatePersistentDelta: false,
      observabilityContext: { sessionId, conversationId: "synthetic-conversation", turnId: firstTurn.turnId,
        clientRequestId: "synthetic-request", testSessionId: null },
    };
    await requestProtocolDesignerBridge(request);
    await requestProtocolDesignerBridge({ ...request, observabilityContext: {
      ...request.observabilityContext!, clientRequestId: "synthetic-request-two",
    } });
    expect(calls.map((item) => item.url)).toEqual([
      "/api/protocol-designer-project-snapshot", "/api/protocol-designer-bridge", "/api/protocol-designer-bridge",
    ]);
    for (const call of calls.filter((item) => item.url.endsWith("bridge"))) {
      expect(call.body.currentProject).toBeNull();
      expect(call.body.currentProjectRef).toEqual({ projectId, versionId: project.versionId, projectDigest: project.projectDigest });
      expect(call.headers["x-noxia-project-snapshot-proof"]).toBe("p".repeat(43));
      expect(JSON.stringify(call.body)).not.toContain("canonicalState");
      const resolved = parseProductBridgeRequest({ ...call.body, currentProject: project, currentProjectRef: undefined });
      expect(resolved?.currentProject).toEqual(project);
    }
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("keeps the DOC source and its Project binding intact while replacing only Project transport", async () => {
    const project = projectV1();
    const storage = new Map<string, string>();
    vi.stubGlobal("window", { localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => { storage.set(key, value); },
    } });
    const wire: Record<string, unknown>[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as Record<string, unknown>;
      if (url.endsWith("project-snapshot")) return new Response(JSON.stringify({
        contract: "VERIFIED_PROJECT_SNAPSHOT",
        ref: { projectId, versionId: project.versionId, projectDigest: project.projectDigest },
        proof: "p".repeat(43),
      }), { status: 200 });
      wire.push(body);
      return new Response(JSON.stringify({ apiVersion: "1.0.0", assistantReply: "DOC accepted." }), { status: 200 });
    }));
    const documentDraftRequest: NonNullable<ProductBridgeRequest["documentDraftRequest"]> = {
      handoffDecision: project.confirmationDecision,
      protocolProjection: { projectionId: "synthetic-projection", source: {
        projectId, projectVersion: project.versionId, projectDigest: project.projectDigest,
      }, sections: [] },
      crf: { packageId: "synthetic-crf", sourceProject: {
        projectId, projectVersion: project.versionId, projectDigest: project.projectDigest,
      }, fields: [] },
    };
    await requestProtocolDesignerBridge({
      conversation: { conversationId: "synthetic-conversation", language: "fr", turns: [firstTurn] },
      currentProject: project, evaluatePersistentDelta: false, documentDraftRequest,
      observabilityContext: { sessionId, conversationId: "synthetic-conversation", turnId: firstTurn.turnId,
        clientRequestId: "synthetic-doc", testSessionId: null },
    });
    expect(wire).toHaveLength(1);
    expect(wire[0].currentProject).toBeNull();
    expect(wire[0].currentProjectRef).toEqual({ projectId, versionId: project.versionId,
      projectDigest: project.projectDigest });
    expect(wire[0].documentDraftRequest).toEqual(documentDraftRequest);
  });

  it("preserves the preexisting full-body path for legacy browser-only Project versions", async () => {
    const current = projectV1();
    const legacy = { ...current, canonicalState: undefined };
    legacy.projectDigest = researchProjectOwnerDigest(legacy);
    const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init.body)) as Record<string, unknown> });
      return new Response(JSON.stringify({ apiVersion: "1.0.0", assistantReply: "Réponse synthétique." }), { status: 200 });
    }));
    await requestProtocolDesignerBridge({
      conversation: { conversationId: "synthetic-conversation", language: "fr", turns: [firstTurn] },
      currentProject: legacy, evaluatePersistentDelta: false,
      observabilityContext: { sessionId, conversationId: "synthetic-conversation", turnId: firstTurn.turnId,
        clientRequestId: "synthetic-legacy", testSessionId: null },
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("/api/protocol-designer-bridge");
    expect(calls[0].body.currentProject).toEqual(JSON.parse(JSON.stringify(legacy)));
    expect(calls[0].body.currentProjectRef).toBeUndefined();
  });

  it("does not reconstruct a missing Project reference from a Chat projection", () => {
    expect(() => parseProjectSnapshotRef({ projectId, versionId: `${projectId}:version:1`, projectDigest: null }))
      .toThrow(ProjectSnapshotError);
  });

  it("rejects an unavailable exact version before admission recovery or provider dispatch", async () => {
    const project = projectV1();
    const provider = vi.fn<typeof fetch>();
    let status = 0;
    let result: unknown;
    const response: ApiResponse = { setHeader() {}, status(code) { status = code; return this; }, json(value) { result = value; } };
    const resolve = vi.fn(async () => { throw new ProjectSnapshotError("PROJECT_SNAPSHOT_NOT_FOUND", 404); });
    const store = { resolve } as unknown as ProtocolDesignerProjectSnapshotStore;
    await handleProtocolDesignerBridge({
      method: "POST", headers: { "content-type": "application/json", host: "noxia.test", origin: "https://noxia.test",
        "x-noxia-project-snapshot-proof": "p".repeat(43) },
      body: { apiVersion: "1.0.0", currentProject: null,
        currentProjectRef: { projectId, versionId: project.versionId, projectDigest: project.projectDigest },
        conversation: { conversationId: "synthetic-conversation", language: "fr", turns: [firstTurn] },
        evaluatePersistentDelta: false,
        observabilityContext: { sessionId, conversationId: "synthetic-conversation", turnId: firstTurn.turnId,
          clientRequestId: "synthetic-unavailable", testSessionId: null },
      },
    }, response, { NODE_ENV: "production", OPENAI_API_KEY: "LOCAL_TEST_ONLY",
      VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME: "TERRA", VITE_AUTONOMOUS_PROJECT_BUILD: "ON" }, {
      durableGuard: createMemoryProtocolDesignerGuardForTests(), projectSnapshotStore: store, fetchImpl: provider,
    });
    expect(status).toBe(404);
    expect(result).toMatchObject({ error: { code: "PROJECT_SNAPSHOT_NOT_FOUND" } });
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(provider).not.toHaveBeenCalled();
  });

  it("injects the exact resolved Project before the unchanged durable and DOC owners", async () => {
    const project = projectV1();
    const resolve = vi.fn(async () => project);
    const store = { resolve } as unknown as ProtocolDesignerProjectSnapshotStore;
    const admittedBodies: unknown[] = [];
    const prepareRequest: PublicProtocolDesignerDurableGuard["prepareRequest"] = async (input) => {
      admittedBodies.push(input.body);
      return { admitted: false, status: 429, code: "SYNTHETIC_STOP_BEFORE_PROVIDER", message: "Synthetic gate." };
    };
    const guard: PublicProtocolDesignerDurableGuard = { prepareRequest,
      createBudgetedFetch: () => { throw new Error("PROVIDER_MUST_NOT_DISPATCH"); },
      completeRequest: async () => { throw new Error("NO_ADMISSION_TO_COMPLETE"); }, close: async () => undefined };
    const provider = vi.fn<typeof fetch>();
    let status = 0;
    const response: ApiResponse = { setHeader() {}, status(code) { status = code; return this; }, json() {} };
    const documentDraftRequest = { protocolProjection: { source: {
      projectId, projectVersion: project.versionId, projectDigest: project.projectDigest,
    } } };
    await handleProtocolDesignerBridge({ method: "POST",
      headers: { "content-type": "application/json", host: "noxia.test", origin: "https://noxia.test",
        "x-noxia-project-snapshot-proof": "p".repeat(43), "x-forwarded-for": "203.0.113.24" },
      body: { apiVersion: "1.0.0", currentProject: null,
        currentProjectRef: { projectId, versionId: project.versionId, projectDigest: project.projectDigest },
        conversation: { conversationId: "synthetic-conversation", language: "fr", turns: [firstTurn] },
        evaluatePersistentDelta: false, documentDraftRequest,
        observabilityContext: { sessionId, conversationId: "synthetic-conversation", turnId: firstTurn.turnId,
          clientRequestId: "synthetic-resolved-doc", testSessionId: null },
      },
    }, response, { NODE_ENV: "production", OPENAI_API_KEY: "LOCAL_TEST_ONLY",
      VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME: "TERRA", VITE_AUTONOMOUS_PROJECT_BUILD: "ON" }, {
      durableGuard: guard, projectSnapshotStore: store, fetchImpl: provider,
    });
    expect(status).toBe(429);
    expect(resolve).toHaveBeenCalledWith({ sessionId, clientAddress: "203.0.113.24" },
      { projectId, versionId: project.versionId, projectDigest: project.projectDigest }, "p".repeat(43));
    expect(admittedBodies).toHaveLength(1);
    expect(admittedBodies[0]).toMatchObject({
      currentProject: project, documentDraftRequest,
    });
    expect(provider).not.toHaveBeenCalled();
  });

  it("the upload API admits only a same-origin canonical upload and returns a scoped proof", async () => {
    const project = projectV1();
    const persist = vi.fn(async () => ({ ref: { projectId, versionId: project.versionId,
      projectDigest: project.projectDigest }, proof: "p".repeat(43) }));
    const store = { persist } as unknown as ProtocolDesignerProjectSnapshotStore;
    let status = 0;
    let result: unknown;
    const response: ApiResponse = { setHeader() {}, status(code) { status = code; return this; }, json(value) { result = value; } };
    await handleProtocolDesignerProjectSnapshot({ method: "POST",
      headers: { "content-type": "application/json", host: "noxia.test", origin: "https://noxia.test",
        "x-forwarded-for": "203.0.113.24" },
      body: { sessionId, project },
    }, response, {}, { store });
    expect(status).toBe(200);
    expect(result).toMatchObject({ contract: "VERIFIED_PROJECT_SNAPSHOT", ref: {
      projectId, versionId: project.versionId, projectDigest: project.projectDigest }, proof: "p".repeat(43) });
    expect(persist).toHaveBeenCalledWith({ sessionId, clientAddress: "203.0.113.24" }, project, null);
    await handleProtocolDesignerProjectSnapshot({ method: "POST",
      headers: { "content-type": "application/json", host: "noxia.test", origin: "https://other.test" },
      body: { sessionId, project },
    }, response, {}, { store });
    expect(status).toBe(403);
    expect(persist).toHaveBeenCalledTimes(1);
  });
});
