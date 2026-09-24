import { describe, expect, it } from "vitest";
import { prepareTerraConversation } from "@/features/scientific-thinking/scientific-collaborator-conversation";
import type { ProductBridgeRequest } from "../../product-bridge";
import { acceptWorkingDraftUpdate, prepareWorkingDraftRequest, type WorkingDraftUpdate } from "../continuous-project-build";
import { controlledStudyProposal, DOMAINS } from "./study-proposal-fixtures";

// Controlled candidates qualify provenance mechanics, never provider competence.
const fixture = (first: string, second = "Je laisse les détails ouverts.") => {
  const request: ProductBridgeRequest = { apiVersion: "1.0.0", conversation: { conversationId: "source-binding",
    language: "fr", turns: [
      { turnId: "u1", role: "USER", content: first }, { turnId: "a1", role: "NOXIA", content: "Proposition non adoptée." },
      { turnId: "u2", role: "USER", content: second }, { turnId: "a2", role: "NOXIA", content: "Les détails restent ouverts." },
    ] }, currentProject: null, evaluatePersistentDelta: false, prepareWorkingDraft: true };
  const update: WorkingDraftUpdate = { requestType: "STUDY_UPDATE",
    proposal: controlledStudyProposal(prepareWorkingDraftRequest(request).inputDigest, DOMAINS[1]),
    explicitDecisions: [{ atomRef: "design", sourceTurnRef: "u1", quote: first }], inferredAtomRefs: [], rejectedAtomRefs: [] };
  return { request, update };
};

describe("immutable source binding and explicit limitations", () => {
  it("uses provider-safe layout in quote enums and restores the exact USER span", () => {
    const { request, update } = fixture("médicament\ncontre placebo.");
    const schema = prepareWorkingDraftRequest(request).outputSchema as {
      properties: { explicitDecisions: { items: { anyOf: Array<{ properties: { quote: { enum: string[] } } }> } } };
    };
    const allowed = schema.properties.explicitDecisions.items.anyOf.flatMap(item => item.properties.quote.enum);
    expect(allowed).toContain("médicament contre placebo.");
    expect(allowed.some(quote => /[\r\n\t]/u.test(quote))).toBe(false);
    update.explicitDecisions[0]!.quote = "médicament contre placebo.";
    expect(acceptWorkingDraftUpdate(update, request).update.explicitDecisions[0]!.quote).toBe("médicament\ncontre placebo.");
    update.explicitDecisions[0]!.quote = "médicament contre témoin.";
    expect(() => acceptWorkingDraftUpdate(update, request)).toThrow("WORKING_DRAFT_USER_PROVENANCE_INVALID");
  });
  it.each([
    ["Une mesure avant traitement.", "Une mesure après traitement."],
    ["Comparer A au placebo.", "Comparer A au traitement usuel."],
    ["20 IRM relues.", "20 épreuves relues."],
    ["Répétitions par opérateur.", "Répétitions par jour."],
  ])("rejects a quote assigned to the wrong turn (%s)", (first, second) => {
    const { request, update } = fixture(first, second), before = JSON.stringify(request);
    update.explicitDecisions[0]!.sourceTurnRef = "u2";
    expect(() => acceptWorkingDraftUpdate(update, request)).toThrow("WORKING_DRAFT_USER_PROVENANCE_INVALID");
    expect(JSON.stringify(request)).toBe(before);
  });
  it("keeps an exact repeated statement attached to either actual source without inventing a preferred turn", () => {
    const { request, update } = fixture("Le traitement habituel est conservé.", "Le traitement habituel est conservé.");
    for (const ref of ["u1", "u2"]) {
      update.explicitDecisions[0]!.sourceTurnRef = ref;
      expect(acceptWorkingDraftUpdate(update, request).update.explicitDecisions[0]!.sourceTurnRef).toBe(ref);
    }
  });
  it("admits the correction's own anchor and rejects borrowing the old decision", () => {
    const { request, update } = fixture("Je retiens une mesure à trois mois.", "Je remplace trois mois par six mois.");
    update.proposal!.atoms.find(atom => atom.ref === "timing")!.content = "Mesure à six mois";
    update.explicitDecisions = [{ atomRef: "timing", sourceTurnRef: "u2", quote: "Je remplace trois mois par six mois." }];
    expect(acceptWorkingDraftUpdate(update, request).update.explicitDecisions[0]!.sourceTurnRef).toBe("u2");
    update.explicitDecisions[0]!.sourceTurnRef = "u1";
    expect(() => acceptWorkingDraftUpdate(update, request)).toThrow("WORKING_DRAFT_USER_PROVENANCE_INVALID");
  });
  it("rejects non-user sources and ambiguous source identities", () => {
    const { request, update } = fixture("Essai randomisé.");
    update.explicitDecisions[0]!.sourceTurnRef = "a1";
    update.explicitDecisions[0]!.quote = "Proposition non adoptée.";
    expect(() => acceptWorkingDraftUpdate(update, request)).toThrow("WORKING_DRAFT_USER_PROVENANCE_INVALID");
    update.explicitDecisions[0]!.sourceTurnRef = "u1";
    update.explicitDecisions[0]!.quote = "Essai randomisé.";
    request.conversation.turns.push({ turnId: "u1", role: "NOXIA", content: "Essai randomisé." });
    expect(() => acceptWorkingDraftUpdate(update, request)).toThrow("WORKING_DRAFT_USER_PROVENANCE_INVALID");
  });
  it("preserves an open candidate and cannot obtain a decision from an absent quotation", () => {
    const { request, update } = fixture("Essai randomisé.", "La gestion des manquants reste ouverte.");
    const analysis = update.proposal!.atoms.find(atom => atom.ref === "analysis")!;
    analysis.status = "OPEN_DECISION"; analysis.content = "Gestion des manquants à arbitrer";
    const result = acceptWorkingDraftUpdate(update, request);
    expect(result.composition!.proposal.atoms.find(atom => atom.ref === "analysis")!.status).toBe("OPEN_DECISION");
    update.explicitDecisions.push({ atomRef: "analysis", sourceTurnRef: "u2", quote: "Analyse sur cas complets retenue." });
    expect(() => acceptWorkingDraftUpdate(update, request)).toThrow("WORKING_DRAFT_USER_PROVENANCE_INVALID");
  });
  it("documents that an exact quote alone is not a semantic entailment validator", () => {
    const { request, update } = fixture("20 IRM relues.");
    update.proposal!.atoms.find(atom => atom.ref === "design")!.content = "20 épreuves relues";
    // This admitted mismatch is an observed LIMITATION, not a quality PASS.
    expect(acceptWorkingDraftUpdate(update, request).composition!.proposal.atoms.find(atom => atom.ref === "design")!.content)
      .toBe("20 épreuves relues");
    expect(request.currentProject).toBeNull();
  });
  it("keeps one generic scientific mandate for distinct domains and ambiguous requests", () => {
    const texts = [...DOMAINS.map(domain => domain.text), "Je voudrais étudier quelque chose."];
    const instructions = texts.map(text => prepareTerraConversation(fixture(text).request, true).instruction);
    expect(new Set(instructions).size).toBe(1);
    expect(instructions[0]).toContain("ne prouvent ni un même état ni une équivalence");
    expect(instructions[0]).toContain("préserve cette ouverture");
    expect(instructions[0]).toContain("traite ce point autant que le contexte le permet maintenant");
    expect(instructions[0]).not.toMatch(/\b(?:coarctation|IRM|colchicine|rugosité|ultratrail)\b/iu);
  });
});
