import { describe, expect, it, vi } from "vitest";
import { executeOpenAIDrciDraft } from "../../../../api/protocol-designer-openai-extraction-provider";
import { prepareDrciGenerationBatches } from "../drci-draft-contract";
import { portableDrciFixture } from "./portable-drci-fixture";

// SANITIZED_HISTORICAL_REPLAY: the paid GPT-6.1 companion returned three
// rows with visit=null and required=null. Only this invalid semantic shape
// is retained; scientific content comes from the existing owner-built fixture.
// CURRENT_STRUCTURAL_INVARIANT: native DOC text fields are not nullable;
// an open collection specification stays open, not inferred or coerced.
const setup = () => {
  const fixture = portableDrciFixture();
  const { synopsisRevision: _revision, remainingScope, ...protocol } = fixture.retained;
  const companion = structuredClone(remainingScope!.value) as {
    documents: unknown[]; crfRows: Array<Record<string, unknown>>;
  };
  return { ...fixture, protocol, companion, batch: prepareDrciGenerationBatches(fixture.packet)[1] };
};

describe("DOC companion native string contract at the generation owner", () => {
  it("spells out both mandatory JSON string types in the actual companion request, without replaying protocol", async () => {
    const { packet, protocol, companion } = setup();
    const calls: string[] = [];
    const provider = vi.fn<typeof fetch>(async (_url, init) => {
      const payload = JSON.parse(String(init?.body));
      const context = JSON.parse(payload.input);
      calls.push(context.DOCUMENT_SCOPE.join("+"));
      expect(payload.instructions).toContain("visit est une chaîne JSON non vide, jamais null");
      expect(payload.instructions).toContain("required est une chaîne JSON non vide, jamais null");
      expect(payload.instructions).toContain("Une temporalité ou une obligation non définie reste explicitement ouverte dans cette chaîne");
      return new Response(JSON.stringify({ status: "completed", model: "gpt-6.1-sol",
        output_text: JSON.stringify(companion) }));
    });
    const result = await executeOpenAIDrciDraft(packet, "OFFLINE_ONLY", provider, undefined, protocol,
      { destination: "azure", terraRequestedModel: "gpt-6.1-sol", responsesEndpoint: "https://fixture.services.ai.azure.com/openai/v1/responses" });
    expect(result.calls).toBe(1);
    expect(result.value.documents).toHaveLength(4);
    expect(result.value.crfRows.every(row => typeof row.visit === "string" && typeof row.required === "string")).toBe(true);
    expect(calls).toEqual(["PROTOCOL_SYNOPSIS+CRF+RECRUITMENT"]);
    expect(provider).toHaveBeenCalledOnce();
  });

  it("still rejects the real three-row null/null shape at the native boundary, without reconstruction", () => {
    const { batch, companion } = setup();
    const invalid = { ...companion, crfRows: Array.from({ length: 3 }, (_, index) => ({
      ...companion.crfRows[index % companion.crfRows.length], variableId: `MEASURE_${index}`,
      visit: null, required: null,
    })) };
    const before = JSON.stringify(invalid);
    try {
      batch.expand(invalid);
      expect.fail("Invalid native text fields must be rejected");
    } catch (error) {
      const issues = (error as { issues: Array<{ path: unknown[]; code: string; expected: string }> }).issues;
      expect(issues.map(issue => ({ path: issue.path, code: issue.code, expected: issue.expected })))
        .toEqual(Array.from({ length: 3 }, (_, index) => ["visit", "required"].map(field => ({
          path: ["crfRows", index, field], code: "invalid_type", expected: "string",
        }))).flat());
    }
    expect(JSON.stringify(invalid)).toBe(before);
  });

  it.each([null, false, true, 1, [], {}, "", "   ", undefined])("never coerces an invalid visit or required field: %j", value => {
    const { batch, companion } = setup();
    for (const field of ["visit", "required"]) {
      const invalid = structuredClone(companion);
      invalid.crfRows[0][field] = value;
      expect(() => batch.expand(invalid)).toThrow();
      expect(invalid.crfRows[0][field]).toEqual(value);
    }
  });

  it("accepts explicit open text without inventing a visit, obligation, or Project decision", () => {
    const { batch, companion, project } = setup();
    const before = JSON.stringify(project);
    companion.crfRows.forEach(row => {
      row.visit = "Temporalité non définie";
      row.required = "Obligation de recueil non définie";
      row.specificationStatus = "UNSPECIFIED";
    });
    const expanded = batch.expand(companion);
    expect(expanded.crfRows.every(row => row.visit === "Temporalité non définie"
      && row.required === "Obligation de recueil non définie" && row.specificationStatus === "UNSPECIFIED")).toBe(true);
    expect(JSON.stringify(project)).toBe(before);
  });

  it("limits the clarification to the companion generation, leaving protocol instructions unchanged", () => {
    const { packet } = setup();
    const [protocol, companion] = prepareDrciGenerationBatches(packet);
    expect(protocol.instruction).not.toContain("TYPES JSON CRF");
    expect(companion.instruction.split("TYPES JSON CRF")).toHaveLength(2);
    expect(companion.instruction.slice(0, companion.instruction.indexOf("\nTYPES JSON CRF"))).toBe(protocol.instruction);
  });
});
