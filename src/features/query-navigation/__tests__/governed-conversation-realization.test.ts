import { describe, expect, it } from "vitest";
import {
  buildGovernedConversationEnvelope,
  buildGovernedConversationProviderPayload,
  parseGovernedRealizationProviderOutput,
  realizeGovernedConversation,
  validateGovernedConversationRealization,
  type GovernedConversationEnvelope,
  type GovernedRealizationProviderClaim,
} from "../governed-conversation-realization";

const envelope = (overrides: Partial<GovernedConversationEnvelope> = {}) => buildGovernedConversationEnvelope({
  whatRef: "what:current", action: "PROPOSE", purpose: "Conserver les choix méthodologiques ouverts dans une proposition réversible.",
  sourceTurnRef: "turn:current", projectBinding: null, targetRefs: ["object:alpha"],
  authorizedContent: [{ ref: "object:alpha", text: "Le choix reste explicitement indécis.", status: "UNKNOWN" }],
  requiredContentRefs: ["object:alpha"], ...overrides,
});

const claim = (reply: string, overrides: Partial<GovernedRealizationProviderClaim> = {}): GovernedRealizationProviderClaim => ({
  whatRef: "what:current", action: "PROPOSE", actionWitness: reply, targetRefs: ["object:alpha"], informationNeedRefs: [],
  contentClaims: [{ ref: "object:alpha", witness: reply, status: "UNKNOWN" }], relationClaims: [],
  adoptionClaimed: false, projectWriteClaimed: false, ...overrides,
});

// Historical baseline only; these strings are never runtime synonyms or a scientific gold.
// Source: execution-01/qry-conversation-value-adjudication-01.md:1338–1352.
const CLEAR_PARAPHRASES = [
  ["A5", "mais la conception exacte de l’étude", "tout en gardant ouvert le choix de la conception de l'étude"],
  ["A8", "le rôle de chaque modalité d’imagerie ne sont pas décidés.", "tout en gardant ouvert le choix de la conception de l'étude, du calendrier, du critère d'évaluation principal et du rôle exact de chaque modalité d'imagerie"],
  ["B1", "Nous souhaitons mener une étude randomisée multicentrique comparant deux stratégies de prise en charge après un événement cardiovasculaire aigu.", "cette étude randomisée multicentrique comparant deux stratégies de prise en charge post-événement cardiovasculaire aigu"],
  ["B2", "L’imagerie sera utilisée pour caractériser le remodelage", "l'usage de l'imagerie pour caractériser le remodelage"],
  ["B4", "mais la hiérarchie exacte des critères d’évaluation", "la hiérarchie des critères d'évaluation, la stratégie de suivi et le plan d'analyse restent à fixer"],
  ["B6", "le plan d’analyse ne sont pas encore fixés.", "le plan d'analyse restent à fixer"],
  ["C2", "Nous souhaitons la valider dans plusieurs centres par rapport à une évaluation manuelle réalisée par des experts", "que vous souhaitez valider multicentriquement face à une évaluation manuelle d'experts"],
  ["C3", "mais nous n’avons pas encore décidé du cadre exact de validation ni du critère principal de performance.", "tout en gardant ouvert pour l'instant le choix du cadre de validation et du critère principal de performance"],
  ["D6", "mais l’harmonisation des acquisitions", "demeurent à définir l'harmonisation des acquisitions"],
  ["D9", "la stratégie d’analyse ne sont pas encore définis.", "demeurent à définir l'harmonisation des acquisitions, le contrôle qualité, l'organisation des lecteurs et la stratégie d'analyse"],
] as const;

describe("PASS3A — common governed WHAT/HOW consumer", () => {
  it.each(CLEAR_PARAPHRASES)("does not reject %s on source-fragment absence, nor certify its prose", (_id, source, witness) => {
    const bounded = envelope({ authorizedContent: [{ ref: "object:alpha", text: source, status: null }] });
    const result = realizeGovernedConversation({
      envelope: bounded, providerReply: witness,
      providerClaim: claim(witness, { contentClaims: [{ ref: "object:alpha", witness, status: null }] }),
      requireProviderClaim: true,
    });
    expect(result.providerReplyAccepted).toBe(true);
    expect(result.conformance).toMatchObject({ structuralStatus: "PASS", visibleTextFidelity: "UNKNOWN",
      structuredRefCoverage: "CONTRACT_EVIDENCE_NOT_SEMANTIC_ORACLE" });
  });

  it.each([
    ["A3", "et nous pouvons recruter prospectivement de nouveaux patients avec une imagerie de suivi.", "la possibilité d'un recrutement prospectif avec imagerie de suivi"],
    ["D5", "Un Core Lab central est prévu", "La mise en place d'un Core Lab central est envisagée"],
  ])("preserves the partial historical reservation for %s without a semantic PASS", (_id, source, witness) => {
    const result = validateGovernedConversationRealization({
      envelope: envelope({ authorizedContent: [{ ref: "object:alpha", text: source, status: null }] }), assistantReply: witness,
    });
    expect(result.structuralStatus).toBe("UNKNOWN");
    expect(result.visibleTextFidelity).toBe("UNKNOWN");
    expect(result.actionConformance).toBe("UNKNOWN");
  });

  it("separates C coverage from the unproven PROPOSE speech act", () => {
    const text = "Je comprends que vous disposez d'une mesure quantitative automatisée de la fibrose myocardique par IRM cardiaque avec rehaussement tardif au gadolinium, que vous souhaitez valider multicentriquement face à une évaluation manuelle d'experts, tout en gardant ouvert pour l'instant le choix du cadre de validation et du critère principal de performance.";
    const result = validateGovernedConversationRealization({ envelope: envelope(), assistantReply: text });
    expect(result).toMatchObject({ actionConformance: "UNKNOWN", structuralStatus: "UNKNOWN", visibleTextFidelity: "UNKNOWN" });
    expect(result.diagnostics).not.toContain("ACTION_MISMATCH");
  });

  it("uses identical structural conformance before and after Project adoption", () => {
    const text = "La proposition laisse le choix ouvert.";
    const check = (bound: GovernedConversationEnvelope) => validateGovernedConversationRealization({ envelope: bound, assistantReply: text, claim: claim(text) });
    expect(check(envelope({ candidateRef: "candidate:one" }))).toEqual(check(envelope({
      projectBinding: { projectId: "project:one", projectVersion: "2", projectDigest: "digest:two" },
    })));
  });

  it("does not transmit omitted candidate dimensions in the bounded provider payload", () => {
    const bounded = envelope();
    const before = JSON.stringify(bounded);
    const payload = buildGovernedConversationProviderPayload(bounded);
    const text = JSON.stringify(payload);
    expect(text).toContain("what:current");
    expect(text).toContain("Le choix reste explicitement indécis.");
    expect(text).not.toContain("fullTranscript");
    expect(payload.generationConfig.responseMimeType).toBe("application/json");
    expect(JSON.stringify(bounded)).toBe(before);
  });

  it("allows omission of scientific content outside the selected WHAT", () => {
    const text = "La proposition laisse ce choix ouvert.";
    const result = validateGovernedConversationRealization({
      envelope: envelope({ authorizedContent: [
        { ref: "object:alpha", text: "Le choix reste indécis.", status: "UNKNOWN" },
        { ref: "object:context-only", text: "Un contexte secondaire conservé dans la revue.", status: "KNOWN" },
      ] }), assistantReply: text, claim: claim(text),
    });
    expect(result.structuralStatus).toBe("PASS");
    expect(result.missingRequiredContentRefs).toEqual([]);
  });

  it.each([
    ["what", { whatRef: "what:other" }, "WHAT_REFERENCE_MISMATCH"],
    ["target", { targetRefs: ["object:other"] }, "TARGET_REFERENCE_MISMATCH"],
    ["action", { action: "ASK_QUESTION" as const }, "ACTION_CLAIM_MISMATCH"],
    ["adoption", { adoptionClaimed: true }, "UNAUTHORIZED_ADOPTION_OR_WRITE_CLAIM"],
    ["write", { projectWriteClaimed: true }, "UNAUTHORIZED_ADOPTION_OR_WRITE_CLAIM"],
    ["need", { informationNeedRefs: ["need:other"] }, "INFORMATION_NEED_REFERENCE_MISMATCH"],
  ])("rejects the explicit %s contract conflict", (_name, mutation, code) => {
    const result = validateGovernedConversationRealization({ envelope: envelope(), assistantReply: "Le choix reste ouvert.", claim: claim("Le choix reste ouvert.", mutation) });
    expect(result.structuralStatus).toBe("FAIL");
    expect(result.diagnostics).toContain(code);
  });

  it("rejects unknown, missing and duplicate content claims without certifying valid witnesses", () => {
    const text = "Le choix reste ouvert.";
    const contentClaims = [
      { ref: "object:other", witness: text, status: "UNKNOWN" },
      { ref: "object:other", witness: text, status: "UNKNOWN" },
    ];
    const result = validateGovernedConversationRealization({ envelope: envelope(), assistantReply: text, claim: claim(text, { contentClaims }) });
    expect(result.diagnostics).toContain("UNAUTHORIZED_CONTENT_REFERENCE:object:other");
    expect(result.diagnostics).toContain("DUPLICATE_CONTENT_CLAIM");
    expect(result.diagnostics).toContain("REQUIRED_CONTENT_CLAIM_MISSING:object:alpha");
  });

  it("rejects a witness not present in the visible text", () => {
    const result = validateGovernedConversationRealization({ envelope: envelope(), assistantReply: "Le choix reste ouvert.", claim: claim("Des mots non présents.") });
    expect(result.diagnostics).toContain("CONTENT_WITNESS_NOT_IN_VISIBLE_TEXT:object:alpha");
  });

  it.each(["KNOWN", "WITHHELD", "DEFERRED"])("does not collapse UNKNOWN into %s", (status) => {
    const text = "Le choix reste ouvert.";
    const result = validateGovernedConversationRealization({ envelope: envelope(), assistantReply: text,
      claim: claim(text, { contentClaims: [{ ref: "object:alpha", witness: text, status }] }) });
    expect(result.diagnostics).toContain("STRUCTURED_STATUS_MISMATCH:object:alpha");
  });

  it("rejects a declared relation reversal or unsupported relation", () => {
    const relation = { ref: "relation:one", sourceRef: "object:alpha", relationType: "COMPARES_WITH", targetRef: "object:beta" };
    const text = "La proposition compare ces deux éléments sans choix automatique.";
    const result = validateGovernedConversationRealization({ envelope: envelope({ requiredRelations: [relation] }), assistantReply: text,
      claim: claim(text, { relationClaims: [{ ...relation, sourceRef: "object:beta", targetRef: "object:alpha", witness: text }] }) });
    expect(result.diagnostics).toContain("STRUCTURED_RELATION_MISMATCH:relation:one");
  });

  it.each([["3 T", "1.5 T"], ["40 ms", "40 s"], ["5 mg", "5 g"], ["3 T", "13 T"]])("protects the owner-required quantity %s against %s", (source, corruption) => {
    const result = validateGovernedConversationRealization({ envelope: envelope({ protectedLiterals: [{ ref: "quantity:one", literal: source }] }), assistantReply: `La mesure est ${corruption}.` });
    expect(result.diagnostics).toContain("REQUIRED_PROTECTED_LITERAL_MISSING:quantity:one");
  });

  it("does not manufacture a DAY unit from ordinary prose", () => {
    const result = validateGovernedConversationRealization({ envelope: envelope(), assistantReply: "Le plan d’étude et le plan d’analyse restent ouverts." });
    expect(result.diagnostics).toEqual([]);
  });

  it.each([["3 T", "1.5 T"], ["40 ms", "40 s"], ["5 mg", "5 g"]])("does not hide corrupt %s → %s behind a preserved copy", (source, added) => {
    const result = validateGovernedConversationRealization({ envelope: envelope({ protectedLiterals: [{ ref: "quantity:one", literal: source }] }),
      assistantReply: `La source indique ${source}, la proposition utilise ${added}.` });
    expect(result.structuralStatus).toBe("FAIL");
    expect(result.diagnostics.some((code) => code.startsWith("UNAUTHORIZED_QUANTITY_SURFACE:"))).toBe(true);
  });

  it("allows two separately authorized quantities and repetition without semantic certification", () => {
    const text = "Les possibilités représentées sont 3 T et 1.5 T. La première reste 3 T.";
    const result = validateGovernedConversationRealization({ envelope: envelope({ authorizedContent: [
      { ref: "object:alpha", text: "Deux possibilités explicites : 3 T et 1.5 T.", status: "UNKNOWN" },
    ] }), assistantReply: text });
    expect(result.structuralStatus).toBe("UNKNOWN");
    expect(result.visibleTextFidelity).toBe("UNKNOWN");
    expect(result.diagnostics).toEqual([]);
  });

  it("does not accept action identity without its visible action witness", () => {
    const text = "Le choix reste ouvert.";
    const result = validateGovernedConversationRealization({ envelope: envelope(), assistantReply: text,
      claim: claim(text, { actionWitness: "Un passage inexistant." }) });
    expect(result.actionConformance).toBe("FAIL");
    expect(result.diagnostics).toContain("ACTION_WITNESS_NOT_IN_VISIBLE_TEXT");
  });

  it("rejects a formal write declaration and a non-ASK interrogative surface", () => {
    expect(validateGovernedConversationRealization({ envelope: envelope(), assistantReply: "J’ai adopté votre projet." }).diagnostics)
      .toContain("UNAUTHORIZED_PROJECT_WRITE_DECLARATION");
    expect(validateGovernedConversationRealization({ envelope: envelope(), assistantReply: "Quel choix souhaitez-vous retenir ?" }).diagnostics)
      .toContain("UNAUTHORIZED_INTERROGATIVE_SURFACE");
  });

  it("rejects ASK on a known information need before constructing the payload", () => {
    expect(() => envelope({ action: "ASK_QUESTION", selectedInformationNeedRef: "need:known", alreadyProvidedInformationRefs: ["need:known"] }))
      .toThrow("GOVERNED_REALIZATION_ASK_NEED_REQUIRED_AND_NOT_ALREADY_PROVIDED");
  });

  it("parses the bounded schema and rejects unsupported extra claims", () => {
    const reply = "La proposition reste ouverte.";
    const output = { assistantReply: reply, claim: claim(reply) };
    expect(parseGovernedRealizationProviderOutput(JSON.stringify(output))).toEqual(output);
    expect(parseGovernedRealizationProviderOutput({ ...output, scientificDecision: "invented" })).toBeNull();
    expect(parseGovernedRealizationProviderOutput({ ...output, claim: { ...output.claim, adoptedProject: {} } })).toBeNull();
    expect(parseGovernedRealizationProviderOutput("prose without a structured envelope")).toBeNull();
  });

  it("requires the claim on the new structured-provider path, not on historical prose adjudication", () => {
    const result = realizeGovernedConversation({ envelope: envelope(), providerReply: "Le choix reste ouvert.", requireProviderClaim: true });
    expect(result.providerReplyAccepted).toBe(false);
    expect(result.conformance.diagnostics).toContain("STRUCTURED_REALIZATION_CLAIM_REQUIRED");
  });

  it("uses a minimal safety net, preserves the rejection, and calls/writes nothing", () => {
    const bound = envelope({ authorizedContent: [{ ref: "object:alpha", text: "A very long entire candidate must not be echoed here.", status: "UNKNOWN" }] });
    const before = JSON.stringify(bound);
    const result = realizeGovernedConversation({ envelope: bound, providerReply: "Votre projet est adopté.",
      localWhatText: "La proposition laisse le choix ouvert." });
    expect(result.assistantReply).toBe("La proposition laisse le choix ouvert.");
    expect(result.fallbackUsed).toBe(true);
    expect(result.conformance.diagnostics).toContain("UNAUTHORIZED_PROJECT_WRITE_DECLARATION");
    expect(result.providerCallsPerformedByRealizer).toBe(0);
    expect(result.projectWriteAuthorized).toBe(false);
    expect(JSON.stringify(bound)).toBe(before);
    expect(result.assistantReply).not.toContain("entire candidate");
  });
});
