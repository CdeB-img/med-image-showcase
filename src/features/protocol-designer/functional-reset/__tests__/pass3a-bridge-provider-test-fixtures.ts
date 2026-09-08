import { vi } from "vitest";
import type { GovernedConversationEnvelope } from "@/features/query-navigation/governed-conversation-realization";

/** Transport fixture only. The old prose is preserved byte-for-byte. Ref/status
 * claims are mechanical witnesses, NOT proof that this prose realizes the WHAT.
 * Do not use this helper as a conformance, scientific-quality or human oracle.
 * The real parser and conformance validator still run: forbidden prose, quantity
 * corruption, missing protected literals and non-ASK question marks still fail.
 */
export const mechanicalGovernedGeminiResponse = (
  init: RequestInit | undefined,
  assistantReply: string,
  responseId = "gemini:transport-fixture",
) => {
  if (typeof init?.body !== "string") throw new Error("TEST_GEMINI_PAYLOAD_REQUIRED");
  const payload = JSON.parse(init.body) as { contents?: Array<{ parts?: Array<{ text?: string }> }> };
  const text = payload.contents?.[0]?.parts?.[0]?.text;
  if (!text) throw new Error("TEST_GEMINI_ENVELOPE_REQUIRED");
  const envelope = JSON.parse(text) as GovernedConversationEnvelope;
  if (envelope.contract !== "GOVERNED_CONVERSATION_REALIZATION") throw new Error("TEST_GOVERNED_ENVELOPE_REQUIRED");
  const questionStart = Math.max(assistantReply.lastIndexOf("."), assistantReply.lastIndexOf("!"), assistantReply.lastIndexOf("\n")) + 1;
  const actionWitness = envelope.action === "ASK_QUESTION"
    ? assistantReply.slice(questionStart).trim()
    : assistantReply;
  const structured = {
    assistantReply,
    claim: {
      whatRef: envelope.whatRef, action: envelope.action, actionWitness,
      interventionKind: envelope.intervention.kind, contentSource: envelope.intervention.contentSource,
      targetRefs: [...envelope.targetRefs],
      informationNeedRefs: envelope.selectedInformationNeedRef ? [envelope.selectedInformationNeedRef] : [],
      contentClaims: envelope.authorizedContent.filter((item) => envelope.requiredContentRefs.includes(item.ref))
        .map((item) => ({ ref: item.ref, witness: assistantReply.includes(item.text) ? item.text : assistantReply, status: item.status })),
      relationClaims: envelope.requiredRelations.map((relation) => ({ ...relation, witness: assistantReply })),
      adoptionClaimed: false, projectWriteClaimed: false,
    },
  };
  return new Response(JSON.stringify({
    candidates: [{ content: { parts: [{ text: JSON.stringify(structured) }] } }], responseId,
  }), { status: 200, headers: { "content-type": "application/json" } });
};

/** Dispatch by exact provider endpoint, never by global call order. Queues are
 * explicit and bounded; exhaustion throws and never reaches the real network.
 * A frozen product recovery may consume a second response only if declared.
 */
export const mockBridgeProviderFetch = (input: {
  geminiText: string;
  geminiResponseId?: string;
  openaiResponses?: readonly (() => Response)[];
}) => {
  let geminiCalls = 0;
  let openaiCalls = 0;
  return vi.fn(async (request: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(request instanceof Request ? request.url : String(request));
    if (url.origin === "https://generativelanguage.googleapis.com"
      && /^\/v1beta\/models\/[^/]+:generateContent$/.test(url.pathname)) {
      if (++geminiCalls > 1) throw new Error("TEST_GEMINI_RETRY_NOT_AUTHORIZED");
      return mechanicalGovernedGeminiResponse(init, input.geminiText, input.geminiResponseId);
    }
    if (url.href === "https://api.openai.com/v1/responses") {
      const response = input.openaiResponses?.[openaiCalls++];
      if (!response) throw new Error("TEST_OPENAI_RESPONSE_QUEUE_EXHAUSTED");
      return response();
    }
    throw new Error(`TEST_UNEXPECTED_PROVIDER_ENDPOINT:${url.origin}${url.pathname}`);
  }) as unknown as typeof fetch;
};
