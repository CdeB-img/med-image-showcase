import { Buffer } from "node:buffer";
import { Tiktoken } from "js-tiktoken/lite";
import o200kBase from "js-tiktoken/ranks/o200k_base";
import { boundCanaryProviderCall, type CanaryCallBound } from "./protocol-designer-canary-policy.js";
import { openAIProviderDestinationFromEndpoint } from "./protocol-designer-openai-provider-config.js";

export const AZURE_LOCAL_INPUT_POLICY = "AZURE_LOCAL_O200K_UTF8_ENVELOPE_V1";
const MODELS = new Set(["gpt-5.6-sol", "gpt-5.6-terra"]);
let encoder: Tiktoken | undefined;

/** Local admission, never provider usage or an exact Responses count.
 * o200k_base is the upstream GPT-5 family encoding. Ranks are bundled: no CDN.
 * The wire serialization includes instructions, input, schema/enums and controls.
 * Reservation uses TWO UTF-8 byte envelopes plus 8192 framing tokens, not a
 * characters/4 heuristic or an assumed exact chat/schema serialization.
 * This is a conservative policy envelope, not a provider-certified bound on
 * hidden formatting. Any observed overrun invalidates this policy durably.
 * Unknown models, media, tools and remote/server-side state remain fail-closed.
 */
export const boundPublicProviderCall = (endpoint: string, body: string): CanaryCallBound | null => {
  const ceiling = boundCanaryProviderCall(endpoint, body);
  if (openAIProviderDestinationFromEndpoint(endpoint) !== "azure") return ceiling;
  if (!ceiling || !MODELS.has(ceiling.model)) return null;
  const bytes = Buffer.byteLength(body, "utf8");
  // Bound the tokenizer's own work and reject oversize context before allocating ranks.
  const byteEnvelope = 2 * bytes + 8192;
  if (byteEnvelope + ceiling.outputTokenUpperBound > ceiling.inputTokenUpperBound) return null;
  try {
    encoder ??= new Tiktoken(o200kBase);
    // Treat special-token-looking user strings as ordinary text, never control tokens.
    const localEstimatedInputTokens = encoder.encode(body, [], []).length;
    const inputTokenUpperBound = Math.max(byteEnvelope, 2 * localEstimatedInputTokens + 8192);
    if (inputTokenUpperBound + ceiling.outputTokenUpperBound > ceiling.inputTokenUpperBound) return null;
    const priced = boundCanaryProviderCall(endpoint, body, inputTokenUpperBound);
    return priced ? Object.freeze({ ...priced, inputBoundBasis: "LOCAL_CONSERVATIVE_ESTIMATE",
      localEstimatedInputTokens, inputAdmissionPolicy: AZURE_LOCAL_INPUT_POLICY }) : null;
  } catch { return null; }
};
