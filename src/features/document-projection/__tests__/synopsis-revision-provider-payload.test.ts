import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { executeOpenAIDrciDraft } from "../../../../api/protocol-designer-openai-extraction-provider";
import { boundCanaryProviderCall } from "../../../../server/protocol-designer-canary-policy";
import { openAIInputCountRequest } from "../../../../server/protocol-designer-provider-replay";
import { prepareSynopsisRevision } from "../synopsis-revision";
import { type RetainedDrciProtocol, prepareDrciDraftPack } from "../drci-draft-contract";

// Exact, frozen qualification inputs; provider responses below are synthetic.
const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const sourceRoot = "validation/noxia-drci-final-pack-generation-retry-01";
const revisionRoot = "validation/noxia-drci-bounded-synopsis-revision-atomic-pack-01";
const packet = prepareDrciDraftPack(read(`${sourceRoot}/PROJECT_IMMUTABLE.json`), read(`${sourceRoot}/NATIVE_DOC_SOURCE.json`));
const retained = read(`${revisionRoot}/RETAINED_SOURCES.json`) as RetainedDrciProtocol;
const prepared = prepareSynopsisRevision(packet, retained.synopsisRevision!);
const jsonInstruction = "Retourne uniquement le plan de révision au format JSON valide demandé.\n";

// Reproduce the observed provider requirement locally, without changing admission.
const jsonModeProvider = (payload: { input: string; text?: { format: { type: string } } }) =>
  payload.text?.format.type === "json_object" && !/json/iu.test(payload.input)
    ? new Response(JSON.stringify({ error: { type: "invalid_request_error", param: "input" } }), { status: 400 })
    : new Response(JSON.stringify({ object: "response.input_tokens", input_tokens: 100 }), { status: 200 });

describe("native synopsis revision JSON-mode input", () => {
  it("builds the actual provider payload with only the JSON input instruction added", async () => {
    const before = JSON.stringify(retained);
    const selection = read(`${revisionRoot}/OFFLINE_SELECTION_FIXTURE.json`);
    const provider = vi.fn<typeof fetch>().mockImplementation(async (_endpoint, init) => {
      const payload = JSON.parse(init!.body as string);
      expect(jsonModeProvider(JSON.parse(openAIInputCountRequest({ endpoint: "https://api.openai.com/v1/responses",
        method: "POST", body: init!.body as string }).body)).status).toBe(200);
      expect(payload).toEqual({ model: "gpt-5.6-terra", instructions: prepared.instruction,
        input: jsonInstruction + prepared.context, reasoning: { effort: "medium" }, max_output_tokens: 4000,
        store: false, service_tier: "default", text: { format: { type: "json_object" } } });
      expect(boundCanaryProviderCall("https://api.openai.com/v1/responses", init!.body as string, 100)).not.toBeNull();
      return new Response(JSON.stringify({ model: "gpt-5.6-terra", status: "completed", output_text: JSON.stringify(selection) }));
    });
    const result = await executeOpenAIDrciDraft(packet, "synthetic-no-live-credential", provider, undefined,
      { ...retained, readSynopsisRevisionRawRef: async () => "scientific-interpretation-raw:synthetic-payload-test" });
    expect(provider).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(retained)).toBe(before);
    expect(result.synopsisRevision).toMatchObject({ reason: "LENGTH_BOUND_REPAIR", attemptNumber: 1,
      projectBinding: prepared.source.projectBinding, evidenceDigest: prepared.source.evidenceDigest,
      fragmentPlanDigest: prepared.planDigest, frozenProtocolDigest: prepared.source.frozenProtocolDigest,
      frozenCompanionDigest: prepared.source.frozenDigest, structuralGate: "PASS", protectedInvariantsGate: "PASS",
      semanticEquivalenceGeneral: "NOT_PROVEN", scientificFidelity: "PENDING_HUMAN_REVIEW" });
  });

  it("reproduces rejection when JSON exists only in instructions, including the native count payload", () => {
    const old = { model: "gpt-5.6-terra", instructions: prepared.instruction, input: prepared.context,
      reasoning: { effort: "medium" }, max_output_tokens: 4000, store: false, service_tier: "default",
      text: { format: { type: "json_object" } } };
    expect(old.instructions).toMatch(/json/iu);
    expect(old.input).not.toMatch(/json/iu);
    const counted = JSON.parse(openAIInputCountRequest({ endpoint: "https://api.openai.com/v1/responses",
      method: "POST", body: JSON.stringify(old) }).body);
    expect(counted.input).toBe(old.input);
    expect(jsonModeProvider(counted).status).toBe(400);
    expect(jsonModeProvider({ ...counted, input: jsonInstruction + counted.input }).status).toBe(200);
  });
});
