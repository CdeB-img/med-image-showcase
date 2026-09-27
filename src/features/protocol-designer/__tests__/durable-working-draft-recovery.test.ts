import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { createMemoryProtocolDesignerGuardForTests } from "../../../../server/protocol-designer-durable-guard";
import { handleProtocolDesignerBridge, type ApiResponse } from "../../../../api/protocol-designer-bridge";

const admissionBody = (sessionId: string, turnId: string, clientRequestId: string) => ({
  observabilityContext: { sessionId, conversationId: sessionId, turnId, clientRequestId },
});

describe("exact Working Draft recovery binding", () => {
  it.each(["", ":checkpoint:ke1-1234567890abcdef"])("exposes the exact sanitized result without dispatch: %s", async suffix => {
    const guard = createMemoryProtocolDesignerGuardForTests();
    const sessionId = `protocol-designer-session:${randomUUID()}`;
    const sourceTurnRef = `turn:${randomUUID()}`;
    const sourceResponseRef = `noxia-turn:${randomUUID()}`;
    const compositionResponseRef = sourceResponseRef;
    const headers = { "content-type": "application/json", "x-forwarded-for": "203.0.113.184" };
    const chat = await guard.prepareRequest({ headers,
      body: admissionBody(sessionId, sourceTurnRef, `product-bridge:${sourceTurnRef}`) });
    if (!("admitted" in chat && chat.admitted)) throw new Error("CHAT_ADMISSION_MISSING");
    await guard.completeRequest(chat, 200, { assistantTurn: { turnId: sourceResponseRef } });
    const working = await guard.prepareRequest({ headers,
      body: admissionBody(sessionId, sourceTurnRef, `working-draft:${sourceTurnRef}${suffix}`) });
    if (!("admitted" in working && working.admitted)) throw new Error("WORKING_ADMISSION_MISSING");
    const identity = { operation: "READ_WORKING_DRAFT_PREPARATION", sessionId,
      sourceTurnRef, sourceResponseRef, compositionResponseRef, clientRequestId: `working-draft:${sourceTurnRef}${suffix}` };
    const provider = vi.fn<typeof fetch>();
    const read = async (body: unknown, environment: Record<string, string> = { VERCEL_ENV: "preview" }) => {
      let status = 0;
      let value: unknown;
      const response: ApiResponse = { setHeader() {}, status(code) { status = code; return this; }, json(result) { value = result; } };
      await handleProtocolDesignerBridge({ method: "POST", headers, body }, response, environment,
        { durableGuard: guard, fetchImpl: provider });
      return { status, value };
    };
    expect(await read(identity)).toMatchObject({ status: 200,
      value: { contract: "WORKING_DRAFT_PREPARATION_RECOVERY", state: "IN_PROGRESS" } });
    const saved = { apiVersion: "1.0.0", assistantReply: "PRIVATE_CHAT_REPLY",
      workingDraftUpdate: { requestType: "STUDY_UPDATE" },
      workingStudyProposal: { sourceTurnRef, sourceResponseRef: compositionResponseRef },
      observability: { providerCalls: [{ secret: "NOT_FOR_BROWSER" }] } };
    await guard.completeRequest(working, 200, saved);
    const result = await read(identity);
    expect(result).toMatchObject({ status: 200, value: { state: "COMPLETED",
      result: { workingDraftUpdate: saved.workingDraftUpdate,
        workingStudyProposal: saved.workingStudyProposal } } });
    expect(JSON.stringify(result.value)).not.toContain("PRIVATE_CHAT_REPLY");
    expect(JSON.stringify(result.value)).not.toContain("NOT_FOR_BROWSER");
    expect(await read({ ...identity, sourceResponseRef: `noxia-turn:${randomUUID()}` })).toMatchObject({ status: 404 });
    expect(await read(identity, { VERCEL_ENV: "production" })).toMatchObject({ status: 404 });
    expect(provider).not.toHaveBeenCalled();
    await guard.close();
  });
  it.each(["", ":checkpoint:ke1-1234567890abcdef"])("requires persisted Chat proof for every read: %s", async suffix => {
    const guard = createMemoryProtocolDesignerGuardForTests();
    const sessionId = `protocol-designer-session:${randomUUID()}`;
    const sourceTurnRef = `turn:${randomUUID()}`;
    const sourceResponseRef = `noxia-turn:${randomUUID()}`;
    const headers = { "x-forwarded-for": "203.0.113.181" };
    const chat = await guard.prepareRequest({ headers,
      body: admissionBody(sessionId, sourceTurnRef, `product-bridge:${sourceTurnRef}`) });
    expect("admitted" in chat && chat.admitted).toBe(true);
    if (!("admitted" in chat && chat.admitted)) throw new Error("CHAT_ADMISSION_MISSING");
    await guard.completeRequest(chat, 200, { assistantTurn: { turnId: sourceResponseRef } });
    const working = await guard.prepareRequest({ headers,
      body: admissionBody(sessionId, sourceTurnRef, `working-draft:${sourceTurnRef}${suffix}`) });
    expect("admitted" in working && working.admitted).toBe(true);
    if (!("admitted" in working && working.admitted)) throw new Error("WORKING_ADMISSION_MISSING");
    const identity = { headers, sessionId, sourceTurnRef, sourceResponseRef, clientRequestId: `working-draft:${sourceTurnRef}${suffix}` };
    expect(await guard.readWorkingDraftPreparation(identity)).toEqual({ state: "IN_PROGRESS" });
    expect(await guard.readWorkingDraftPreparation({ ...identity, sourceResponseRef: `noxia-turn:${randomUUID()}` }))
      .toMatchObject({ state: "REJECTED" });
    expect(await guard.readWorkingDraftPreparation({ ...identity, sessionId: `protocol-designer-session:${randomUUID()}` }))
      .toMatchObject({ state: "REJECTED" });
    expect(await guard.readWorkingDraftPreparation({ ...identity, headers: { "x-forwarded-for": "203.0.113.182" } }))
      .toMatchObject({ state: "REJECTED" });
    expect(await guard.readWorkingDraftPreparation({ ...identity, sourceTurnRef: `turn:${randomUUID()}` }))
      .toMatchObject({ state: "REJECTED" });
    const result = { apiVersion: "1.0.0", assistantReply: "", workingDraftUpdate: { requestType: "STUDY_UPDATE" } };
    await guard.completeRequest(working, 200, result);
    expect(await guard.readWorkingDraftPreparation(identity)).toEqual({ state: "COMPLETED", response: result });
    expect(await guard.readWorkingDraftPreparation(identity)).toEqual({ state: "COMPLETED", response: result });
    await guard.close();
  });

  it.each([
    [{ error: { code: "WORKING_DRAFT_PROVIDER_FAILED", details: ["STUDY_PROPOSAL_DEPENDENCY_CYCLE"] } }, { state: "FAILED", errorCode: "STUDY_PROPOSAL_DEPENDENCY_CYCLE" }],
    [{ error: { code: "WORKING_DRAFT_PROVIDER_FAILED" }, observability: { providerCalls: [{ durableFailure: { lastConfirmedDurableState: "UNKNOWN_AFTER_DISPATCH" } }] } }, { state: "UNKNOWN" }],
    [{ error: { code: "WORKING_DRAFT_PROVIDER_FAILED" }, observability: { providerCalls: [{ durableFailure: { bodyRead: true, providerResponseStatus: "incomplete", incompleteReason: "max_output_tokens", lastConfirmedDurableState: "UNKNOWN_AFTER_DISPATCH" } }] } }, { state: "FAILED", errorCode: "WORKING_DRAFT_INCOMPLETE_MAX_OUTPUT_TOKENS" }],
  ])("preserves owner failure versus unknown provider outcome in the read projection", async (body, expected) => {
    const guard=createMemoryProtocolDesignerGuardForTests();
    const sessionId=`protocol-designer-session:${randomUUID()}`,sourceTurnRef=`turn:${randomUUID()}`,sourceResponseRef=`noxia-turn:${randomUUID()}`;
    const headers={"x-forwarded-for":"203.0.113.189"};
    const chat=await guard.prepareRequest({headers,body:admissionBody(sessionId,sourceTurnRef,`product-bridge:${sourceTurnRef}`)});
    if (!("admitted" in chat && chat.admitted)) throw Error("NO_CHAT");
    await guard.completeRequest(chat,200,{assistantTurn:{turnId:sourceResponseRef}});
    const wd=await guard.prepareRequest({headers,body:admissionBody(sessionId,sourceTurnRef,`working-draft:${sourceTurnRef}`)});
    if (!("admitted" in wd && wd.admitted)) throw Error("NO_WD");
    await guard.completeRequest(wd,503,body);
    expect(await guard.readWorkingDraftPreparation({headers,sessionId,sourceTurnRef,sourceResponseRef})).toEqual(expected);
    await guard.close();
  });
  it("restores an existing failed admission without creating another provider operation", async () => {
    const guard = createMemoryProtocolDesignerGuardForTests();
    const sessionId = `protocol-designer-session:${randomUUID()}`;
    const sourceTurnRef = `turn:${randomUUID()}`;
    const sourceResponseRef = `noxia-turn:${randomUUID()}`;
    const headers = { "x-forwarded-for": "203.0.113.183" };
    const chat = await guard.prepareRequest({ headers,
      body: admissionBody(sessionId, sourceTurnRef, `product-bridge:${sourceTurnRef}`) });
    if (!("admitted" in chat && chat.admitted)) throw new Error("CHAT_ADMISSION_MISSING");
    await guard.completeRequest(chat, 200, { assistantTurn: { turnId: sourceResponseRef } });
    const working = await guard.prepareRequest({ headers,
      body: admissionBody(sessionId, sourceTurnRef, `working-draft:${sourceTurnRef}`) });
    if (!("admitted" in working && working.admitted)) throw new Error("WORKING_ADMISSION_MISSING");
    await guard.completeRequest(working, 503, { error: { code: "WORKING_DRAFT_PROVIDER_FAILED" } });
    const identity = { headers, sessionId, sourceTurnRef, sourceResponseRef };
    expect(await guard.readWorkingDraftPreparation(identity)).toEqual({ state: "FAILED", errorCode: "WORKING_DRAFT_PROVIDER_FAILED" });
    expect(await guard.readWorkingDraftPreparation(identity)).toEqual({ state: "FAILED", errorCode: "WORKING_DRAFT_PROVIDER_FAILED" });
    await guard.close();
  });
});
