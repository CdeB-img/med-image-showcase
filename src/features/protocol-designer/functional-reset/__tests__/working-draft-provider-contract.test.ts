import Ajv from "ajv";
import { describe, expect, it } from "vitest";
import { buildOpenAITerraConversationPayload } from "../../../../../api/protocol-designer-openai-extraction-provider";
import { openAIInputCountRequest } from "../../../../../server/protocol-designer-provider-replay";
import { acceptWorkingDraftUpdate, prepareWorkingDraftRequest } from "../continuous-project-build";
import { createFunctionalResetSession } from "../session";
import type { ProductBridgeRequest } from "../../product-bridge";
import { controlledStudyProposal, DOMAINS } from "./study-proposal-fixtures";

const fixture = () => {
  const session = createFunctionalResetSession();
  const request: ProductBridgeRequest = { apiVersion: "1.0.0", currentProject: null,
    evaluatePersistentDelta: false, prepareWorkingDraft: true,
    conversation: { conversationId: session.conversationId, language: "fr", turns: [
      { turnId: "u1", role: "USER", content: DOMAINS[1].text },
      { turnId: "a1", role: "NOXIA", content: "LOCAL_SYNTHETIC — proposition de travail non adoptée." },
    ] } };
  const packet = prepareWorkingDraftRequest(request);
  const proposal = controlledStudyProposal(packet.inputDigest, DOMAINS[1]);
  const update = { requestType: "STUDY_UPDATE", proposal, explicitDecisions: [], inferredAtomRefs: [], rejectedAtomRefs: [] };
  return { request, packet, update };
};

describe("background provider contract follows the native owner", () => {
  it("binds each wire quote to its own immutable USER turn and rejects abbreviated, borrowed or invented quotes", () => {
    const { request, update } = fixture();
    request.conversation.turns.push({ turnId: "u2", role: "USER", content: "Le promoteur et les centres restent ouverts. L'effectif reste ouvert." });
    const packet = prepareWorkingDraftRequest(request);
    update.proposal.contextDigest = packet.inputDigest;
    for (const atom of update.proposal.atoms) Object.assign(atom, { dependencyQualifications: atom.dependsOn.map(ref => ({ ref, kind: "HARD_BLOCKING_DEPENDENCY", rationale: "Prérequis." })) });
    const validate = new Ajv({ allErrors: true }).compile(packet.outputSchema);
    const decision = { atomRef: "practical", sourceTurnRef: "u2", quote: "Le promoteur et les centres restent ouverts." };
    const wire = { ...update, explicitDecisions: [decision] };
    expect(validate(wire), JSON.stringify(validate.errors)).toBe(true);
    expect(() => acceptWorkingDraftUpdate(wire, request)).not.toThrow();
    for (const quote of ["Le promoteur [...] reste ouvert.", "Les centres sont décidés.", DOMAINS[1].text]) {
      expect(validate({ ...wire, explicitDecisions: [{ ...decision, quote }] })).toBe(false);
    }
    expect(validate({ ...wire, explicitDecisions: [{ ...decision, sourceTurnRef: "a1" }] })).toBe(false);
    expect(validate({ ...wire, explicitDecisions: [{ ...decision, sourceTurnRef: "u1" }] })).toBe(false);
  });

  it("projects multiline sources as safe schema literals while preserving the exact input and source ids", () => {
    const { request } = fixture();
    request.conversation.turns[0].content = "Comparer A\ncontre B à 1.5 mg. Le reste est ouvert.";
    const packet = prepareWorkingDraftRequest(request);
    const text = JSON.stringify(packet.outputSchema);
    expect(text).toContain(JSON.stringify("Comparer A contre B à 1.5 mg."));
    expect(text).toContain(JSON.stringify("Comparer A contre B à 1.5 mg. Le reste est ouvert."));
    expect(text).not.toContain(JSON.stringify("Comparer A\ncontre B à 1.5 mg."));
    const before = JSON.stringify(request);
    prepareWorkingDraftRequest(request);
    expect(JSON.stringify(request)).toBe(before);
    request.conversation.turns.push({ ...request.conversation.turns[0] });
    expect(prepareWorkingDraftRequest(request).outputSchema.properties?.explicitDecisions).toMatchObject({ maxItems: 0 });
  });
  it("constrains the two paid failure shapes without relaxing native validation", () => {
    const { packet, request, update } = fixture();
    const validate = new Ajv({ allErrors: true }).compile(packet.outputSchema);
    const malformed = structuredClone(update);
    Object.assign(malformed.proposal.atoms[0], { evidenceRefs: [{ ref: "u1", quote: "user text" }] });
    Object.assign(malformed.proposal.arbitrations[0], { affectedBranches: ["PRACTICAL"] });
    expect(validate(malformed)).toBe(false);
    expect(validate.errors?.some(e => e.keyword === "enum" && e.dataPath.includes("affectedBranches"))).toBe(true);
    expect(validate.errors?.some(e => e.keyword === "type" && e.dataPath.includes("evidenceRefs"))).toBe(true);
    expect(() => acceptWorkingDraftUpdate(malformed, request)).toThrow();
  });

  it("requires an object with a complete strict wire shape and keeps historical optional fields readable", () => {
    const { packet, request, update } = fixture();
    const validate = new Ajv({ allErrors: true }).compile(packet.outputSchema);
    for (const atom of update.proposal.atoms) Object.assign(atom, {
      plannedSource: atom.plannedSource ?? null, plannedMethod: atom.plannedMethod ?? null,
      participantReported: atom.participantReported ?? false, analysisMethod: atom.analysisMethod ?? null,
      userChangeRefs: atom.userChangeRefs ?? [], dependencyQualifications: atom.dependencyQualifications ?? [],
    });
    expect(validate(update), JSON.stringify(validate.errors)).toBe(true);
    expect(() => acceptWorkingDraftUpdate(update, request)).not.toThrow();
    const historical = structuredClone(update);
    for (const atom of historical.proposal.atoms) delete atom.plannedSource;
    expect(validate(historical)).toBe(false);
    expect(() => acceptWorkingDraftUpdate(historical, request)).not.toThrow();
  });

  it("constrains binding and empty evidence without promoting transcript references to literature", () => {
    const { packet, update } = fixture();
    const validate = new Ajv({ allErrors: true }).compile(packet.outputSchema);
    update.proposal.contextDigest = "other-context";
    update.proposal.atoms[0].evidenceRefs = ["u1"];
    expect(validate(update)).toBe(false);
    expect(validate.errors?.some(e => e.keyword === "const")).toBe(true);
    expect(validate.errors?.some(e => e.keyword === "maxItems" && e.dataPath.includes("evidenceRefs"))).toBe(true);
  });

  it("uses the same native transport and exact counter, leaving visible Chat unconstrained", () => {
    const { packet } = fixture();
    const body = buildOpenAITerraConversationPayload(packet);
    expect(body).toMatchObject({ model: "gpt-5.6-terra", reasoning: { effort: "medium" }, store: false,
      max_output_tokens: 16000, text: { format: { type: "json_schema", strict: true, schema: packet.outputSchema } } });
    expect(buildOpenAITerraConversationPayload({ context: packet.context, instruction: packet.instruction }))
      .toMatchObject({ max_output_tokens: 8000 });
    expect(buildOpenAITerraConversationPayload({ context: packet.context, instruction: packet.instruction })).not.toHaveProperty("text");
    const count = openAIInputCountRequest({ endpoint: "https://api.openai.com/v1/responses", method: "POST", body: JSON.stringify(body) });
    expect(JSON.parse(count!.body).text).toEqual(body.text);
  });
});
