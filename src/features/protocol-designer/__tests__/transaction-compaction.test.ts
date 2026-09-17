import { describe, expect, it } from "vitest";
import { prepareCompactTransaction, expandCompactTransaction } from "../transaction-compaction";
import { buildPersistentSourceCatalog, materializePersistentSourceAnchors, validatePersistentProjectDelta, contributionFromPersistentDelta, type ProductBridgeRequest } from "../product-bridge";
import { buildOpenAIPersistentDeltaPayload, executeOpenAIPersistentDelta } from "../../../../api/protocol-designer-openai-extraction-provider";
import { prepareResearchProjectContributionCandidate } from "../../research-project-construction";

const request = (): ProductBridgeRequest => ({ apiVersion: "1.0.0", currentProject: null, evaluatePersistentDelta: true, nativeConversationRecording: true,
  conversation: { conversationId: "test", language: "fr", turns: [
    { turnId: "proposal", role: "NOXIA", content: "Étude prospective transversale, une seule visite. Une valeur reste à définir; aucune règle clinique supplémentaire n'est adoptée." },
    { turnId: "assent", role: "USER", content: "Je retiens cette proposition corrigée pour préparer une revue groupée avant toute adoption." }] } });
const value = (r = request()) => ({ transaction: prepareCompactTransaction(r).header.candidateId,
  changes: [{ id: "c0", t: "STUDY_DESIGN", v: "Étude prospective transversale", s: "p0" }], relations: [], temporalQualifications: [], expectedVariableOccasions: [] });
describe("Transaction compaction is representation, never Project authority", () => {
  it("does not replace inclusion age bounds with a different criterion's duration", () => {
    const r = request();
    r.conversation.turns[0].content = "Volontaires âgés de 18 à 75 ans.\n\nAnciens fumeurs admissibles si exposition ≤ 5 paquets-années et arrêt depuis au moins 5 ans.";
    const expanded = expandCompactTransaction({ ...value(r), changes: [
      { id: "c0", t: "ELIGIBILITY_CRITERION", d: "POPULATION", v: "Âge d'inclusion compris entre 18 et 75 ans", s: "p0" },
      { id: "c1", t: "ELIGIBILITY_CRITERION", d: "POPULATION", v: "Anciens fumeurs admissibles si exposition ≤ 5 paquets-années et arrêt depuis au moins 5 ans", s: "p1" },
    ] }, r);
    const last = r.conversation.turns.at(-1)!;
    const mapped = materializePersistentSourceAnchors({ value: expanded.value, catalog: buildPersistentSourceCatalog(r.conversation), currentUserTurn: last });
    const checked = validatePersistentProjectDelta(mapped.value, last.content, null, r.conversation);
    const contribution = contributionFromPersistentDelta({ candidate: checked.candidate!, conversation: r.conversation, currentProject: null })!;
    const candidate = prepareResearchProjectContributionCandidate(contribution, null);
    const projected = candidate.proposedSections.flatMap(s => s.elements);
    expect(projected.find(e => e.semanticKey === "POPULATION:ELIGIBILITY:AGE:MIN")?.content).toBe("Âge minimal : 18 ans");
    expect(projected.find(e => e.semanticKey === "POPULATION:ELIGIBILITY:AGE:MAX")?.content).toBe("Âge maximal : 75 ans");
    expect(projected.some(e => e.content.includes("Anciens fumeurs"))).toBe(true);
    expect(projected.find(e => e.content.includes("Anciens fumeurs"))?.content).toContain("≤ 5 paquets-années");
    expect(projected.find(e => e.content.includes("Anciens fumeurs"))?.content).toContain("au moins 5 ans");
    expect(JSON.stringify(candidate.humanReviewProjection)).not.toContain("Âge minimal : 5 ans");
    expect(JSON.stringify(candidate)).not.toContain("Âge minimal : 5 ans");
  });
  it("expands shared source references and metadata into the exact anchored PRJ contract", () => {
    const r = request(); const expanded = expandCompactTransaction(value(r), r);
    const last = r.conversation.turns.at(-1)!;
    const mapped = materializePersistentSourceAnchors({ value: expanded.value, catalog: buildPersistentSourceCatalog(r.conversation), currentUserTurn: { turnId: last.turnId, content: last.content } });
    const checked = validatePersistentProjectDelta(mapped.value, last.content, null, r.conversation);
    expect(checked.validation.valid).toBe(true);
    const contribution = contributionFromPersistentDelta({ candidate: checked.candidate!, conversation: r.conversation, currentProject: null })!;
    expect(contribution.scientificContent.candidateObjects[0].epistemicBoundary).toMatchObject({ ownership: "NOXIA", adoptionStatus: "CANDIDATE", sourceTurnIds: ["proposal", "assent"], sourceText: last.content });
    expect(checked.candidate!.projectWriteAuthorized).toBe(false); expect(r.currentProject).toBeNull();
  });
  it("preserves 64 independent values sharing an anchor, without merging or overflow tolerance", () => {
    const r = request(); const input = { ...value(r), changes: Array.from({ length: 64 }, (_, i) => ({ id: `c${i}`, t: "CANONICAL_VARIABLE", v: `Valeur distincte ${i}`, s: "p0" })) };
    const expanded = expandCompactTransaction(input, r); expect(expanded.value.changes).toHaveLength(64);
    expect(new Set(expanded.value.changes.map(c => c.candidateRef)).size).toBe(64);
    expect(JSON.stringify(input).length).toBeLessThan(JSON.stringify(expanded.value).length / 2);
    expect(() => expandCompactTransaction({ ...input, changes: [...input.changes, input.changes[0]] }, r)).toThrow();
  });
  it("fails closed on source tampering, invalid quote bounds, arbitrary fields and wrong request/version binding", () => {
    const r = request();
    for (const change of [{ ...value(r).changes[0], s: "invented" }, { ...value(r).changes[0], u: "p0" },
      { ...value(r).changes[0], span: [-1, 5] }, { ...value(r).changes[0], sourceText: "invented" }])
      expect(() => expandCompactTransaction({ ...value(r), changes: [change] }, r)).toThrow();
    expect(() => expandCompactTransaction({ ...value(r), transaction: "other" }, r)).toThrow("BINDING_MISMATCH");
  });
  it("preserves nonadopted UNKNOWN and explicit negation independently of common defaults", () => {
    const r = request(); const expanded = expandCompactTransaction({ ...value(r), changes: [{ id: "c0", t: "PROJECT_INFORMATION", v: "Procédure locale à définir", s: "p0", e: "UNKNOWN", p: "NEGATED" }] }, r);
    expect(expanded.value.changes[0]).toMatchObject({ epistemicState: "UNKNOWN", polarity: "NEGATED", assertionKind: "USER_ADOPTED_PROPOSAL" });
  });
  it("keeps original USER assertion separate from adopted assistant proposal", () => {
    const r = request(); const expanded = expandCompactTransaction({ ...value(r), changes: [{ ...value(r).changes[0], s: "u0" }] }, r);
    expect(expanded.value.changes[0]).toMatchObject({ assertionKind: "USER_STATED", epistemicStatus: "EXPLICIT_USER_STATED" });
    expect(expanded.value.changes[0].proposalSourceText).toBeUndefined();
  });
  it("namespaces dependency references inside one global candidate; reuses native validation", () => {
    const r = request(); const expanded = expandCompactTransaction({ ...value(r), changes: [
      { id: "c0", t: "ENDPOINT", v: "Mesure", s: "p0" }, { id: "c1", t: "CANONICAL_VARIABLE", v: "Variable", s: "p0" }],
      relations: [{ id: "r0", t: "OPERATIONALIZES", from: "c1", to: "c0", s: "p0" }] }, r);
    expect(expanded.value.relations[0].sourceObjectRef).toBe(expanded.value.changes[1].candidateRef);
    expect(expanded.value.relations[0].targetObjectRef).toBe(expanded.value.changes[0].candidateRef);
  });
  it("uses the same Responses transport and 8000 bound; preserves raw compact and expanded evidence separately", async () => {
    const r = request(); const payload = buildOpenAIPersistentDeltaPayload(r);
    expect(payload.max_output_tokens).toBe(8000); expect(payload.model).toBe("gpt-5.6-terra");
    const provider: typeof fetch = async () => new Response(JSON.stringify({ status: "completed", model: "gpt-5.6-terra", output_text: JSON.stringify(value(r)), usage: { input_tokens: 100, output_tokens: 100 } }));
    const result = await executeOpenAIPersistentDelta(r, "LOCAL_SYNTHETIC", provider);
    expect(result.value.providerArtifact.structuredArgsExact).toEqual(value(r));
    expect(result.value.providerArtifact.compactPreparation?.header.assentTurnId).toBe("assent");
    expect(result.value.structuredArgs).toMatchObject({ changes: [{ proposedType: "STUDY_DESIGN", assertionKind: "USER_ADOPTED_PROPOSAL" }] });
    expect(buildOpenAIPersistentDeltaPayload({ ...r, nativeConversationRecording: undefined }).input).toContain("DERNIER MESSAGE UTILISATEUR");
  });
});
