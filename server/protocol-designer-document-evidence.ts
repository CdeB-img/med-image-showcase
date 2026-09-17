import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { FileScientificInterpretationEvidenceStore } from "../api/scientific-interpretation-evidence-store.js";
import { readCanaryState, readProtocolDesignerReplayRefs } from "./protocol-designer-provider-replay.js";
import type { CanaryCampaignPolicy } from "./protocol-designer-canary-policy.js";
import { validateRetainedDrciScope, type RetainedDrciProtocol, type RetainedDrciScope, type prepareDrciDraftPack } from "../src/features/document-projection/drci-draft-contract.js";

/** Read paid native evidence. No transport, retry, ledger edit or cost release. */
export const readRetainedDrciProtocolEvidence = async (input: {
  root: string; policy: CanaryCampaignPolicy; sessionId: string | null;
  packet: ReturnType<typeof prepareDrciDraftPack>;
}): Promise<RetainedDrciProtocol | null> => {
  try { await readFile(join(input.root, "protocol-designer-exchanges.jsonl")); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
  const state = await readCanaryState(input.root, input.policy.campaignId, input.policy);
  if (!input.sessionId || !state.sessions.has(input.sessionId)) throw new Error("DRCI_RETAINED_SESSION_MISMATCH");
  const store = new FileScientificInterpretationEvidenceStore(input.root);
  const retainedScopes: [RetainedDrciScope | null, RetainedDrciScope | null] = [null, null];
  for (const ref of (await readProtocolDesignerReplayRefs(input.root)).reverse()) {
    const stored = await store.read(ref);
    if (!stored) throw new Error("DRCI_RETAINED_RAW_MISSING");
    const e = stored.payload as { canaryAdmission?: { campaignId: string; sessionId: string }; canarySettlement?: unknown;
      callMetadata?: { purpose: string }; request: { body: string }; transportError?: string;
      response?: { status: number; body: string } };
    if (!e.canaryAdmission || e.canaryAdmission.sessionId !== input.sessionId || e.callMetadata?.purpose !== "DOCUMENT_PROJECTION") continue;
    const request = JSON.parse(e.request.body), context = JSON.parse(request.input);
    const index = JSON.stringify(context.DOCUMENT_SCOPE) === JSON.stringify(["PROTOCOL_FULL"]) ? 0
      : JSON.stringify(context.DOCUMENT_SCOPE) === JSON.stringify(["PROTOCOL_SYNOPSIS", "CRF", "RECRUITMENT"]) ? 1 : null;
    if (index === null || retainedScopes[index]) continue;
    if (context.PROJECT_BINDING?.projectId !== input.packet.projectBinding.projectId) continue;
    if (!e.response || e.response.status !== 200 || e.transportError || !e.canarySettlement
      || e.canaryAdmission.campaignId !== input.policy.campaignId
      || request.model !== "gpt-5.6-terra" || request.reasoning?.effort !== "medium"
      || request.max_output_tokens !== 8000 || request.store !== false) throw new Error("DRCI_RETAINED_PROVIDER_UNQUALIFIED");
    const response = JSON.parse(e.response.body);
    if (response.status !== "completed" || response.model !== "gpt-5.6-terra") throw new Error("DRCI_RETAINED_OUTPUT_INCOMPLETE");
    const text = response.output_text ?? response.output.flatMap((o: { content?: { type: string; text?: string }[] }) => o.content ?? [])
      .filter((c: { type: string }) => c.type === "output_text").map((c: { text: string }) => c.text).join("");
    const retained = { requestContext: request.input, value: JSON.parse(text), rawOutputRef: ref };
    validateRetainedDrciScope(input.packet, retained, index);
    retainedScopes[index] = retained;
  }
  return retainedScopes[0] ? { ...retainedScopes[0], ...(retainedScopes[1] ? { remainingScope: retainedScopes[1] } : {}) } : null;
};
