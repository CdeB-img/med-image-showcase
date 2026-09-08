import { describe, expect, it } from "vitest";
import {
  buildGovernedConversationEnvelope,
  buildGovernedConversationLocalFallback,
  realizeGovernedConversation,
  validateGovernedConversationRealization,
  type GovernedConversationEnvelope,
  type GovernedRealizationProviderClaim,
  type GovernedVisibleObligation,
} from "../governed-conversation-realization";

const claimFor = (
  envelope: GovernedConversationEnvelope,
  actionWitness: string,
  contentWitnesses: Readonly<Record<string, string>>,
  overrides: Partial<GovernedRealizationProviderClaim> = {},
): GovernedRealizationProviderClaim => ({
  whatRef: envelope.whatRef,
  action: envelope.action,
  actionWitness,
  interventionKind: envelope.intervention.kind,
  contentSource: envelope.intervention.contentSource,
  targetRefs: [...envelope.targetRefs],
  informationNeedRefs: envelope.selectedInformationNeedRef ? [envelope.selectedInformationNeedRef] : [],
  contentClaims: envelope.requiredContentRefs.flatMap((ref) => {
    const witness = contentWitnesses[ref];
    const content = envelope.authorizedContent.find((item) => item.ref === ref);
    return witness && content ? [{ ref, witness, status: content.status }] : [];
  }),
  relationClaims: [],
  adoptionClaimed: false,
  projectWriteClaimed: false,
  ...overrides,
});

const askEnvelope = () => buildGovernedConversationEnvelope({
  whatRef: "what:ask-population",
  action: "ASK_QUESTION",
  actionCategory: "CLARIFY_BY_ADAPTIVE_EXCHANGE",
  purpose: "Préciser la population étudiée.",
  sourceTurnRef: "turn:ask",
  projectBinding: null,
  targetRefs: ["project:unknown:population"],
  intervention: { kind: "ASK_INFORMATION", contentSource: "QUERY_NAVIGATION", sourceRefs: ["need:population"] },
  authorizedContent: [{ ref: "project:unknown:population", text: "Préciser la population étudiée.", status: "UNKNOWN" }],
  requiredContentRefs: ["project:unknown:population"],
  selectedInformationNeedRef: "need:population",
});

const OBJECTIVE_A = "Évaluer les thrombus manqués à l’échographie et détectés à l’IRM";
const OBJECTIVE_B = "Évaluer le devenir clinique des patients atteints de thrombus intra-VG";

const explainEnvelope = () => buildGovernedConversationEnvelope({
  whatRef: "what:explain-two-objectives",
  action: "RESPOND",
  purpose: "Expliquer la distinction structurale entre les deux objectifs liés.",
  sourceTurnRef: "turn:explain",
  projectBinding: null,
  targetRefs: ["objective:detection", "objective:clinical-outcome"],
  intervention: { kind: "EXPLAIN_REFERENCED_CONTENT", contentSource: "RETAINED_CANDIDATE", sourceRefs: ["candidate:thrombus"] },
  authorizedContent: [
    { ref: "objective:detection", text: OBJECTIVE_A, status: "KNOWN" },
    { ref: "objective:clinical-outcome", text: OBJECTIVE_B, status: "KNOWN" },
  ],
  requiredContentRefs: ["objective:detection", "objective:clinical-outcome"],
  requiredVisibleObligations: [
    { obligationId: "referent:a", sourceRef: "objective:detection", role: "REFERENT_CONTENT", exactText: OBJECTIVE_A },
    { obligationId: "referent:b", sourceRef: "objective:clinical-outcome", role: "REFERENT_CONTENT", exactText: OBJECTIVE_B },
  ],
});

const sourceEnvelope = () => buildGovernedConversationEnvelope({
  whatRef: "what:user-correction",
  action: "PROPOSE",
  purpose: "Structurer la correction utilisateur sans adoption.",
  sourceTurnRef: "turn:correction",
  projectBinding: null,
  candidateRef: "candidate:correction",
  targetRefs: ["objective:alpha"],
  intervention: { kind: "STRUCTURE_USER_SUPPLIED_CONTENT", contentSource: "USER_SUPPLIED", sourceRefs: ["turn:correction"] },
  authorizedContent: [{ ref: "objective:alpha", text: "Étudier le phénomène bêta", status: "KNOWN" }],
  requiredContentRefs: ["objective:alpha"],
});

const ownerObligations = (): GovernedVisibleObligation[] => [
  { obligationId: "a:identity", sourceRef: "option:a", role: "OPTION_IDENTITY", exactText: "Cohorte longitudinale prospective" },
  { obligationId: "a:discriminant", sourceRef: "option:a", role: "OPTION_DISCRIMINANT", exactText: "Estimer un changement et sa variabilité dans une population définie." },
  { obligationId: "a:limit", sourceRef: "option:a", role: "MATERIAL_LIMIT", exactText: "Attrition" },
  { obligationId: "b:identity", sourceRef: "option:b", role: "OPTION_IDENTITY", exactText: "Cohorte rétrospective à partir de données existantes" },
  { obligationId: "b:discriminant", sourceRef: "option:b", role: "OPTION_DISCRIMINANT", exactText: "Explorer la relation avec les données effectivement disponibles et leur temporalité réelle." },
  { obligationId: "b:limit", sourceRef: "option:b", role: "MATERIAL_LIMIT", exactText: "Biais d’information" },
  { obligationId: "c:identity", sourceRef: "option:c", role: "OPTION_IDENTITY", exactText: "Cohorte longitudinale ambispective" },
  { obligationId: "c:discriminant", sourceRef: "option:c", role: "OPTION_DISCRIMINANT", exactText: "Relier une trajectoire historique documentée à des observations futures." },
  { obligationId: "c:limit", sourceRef: "option:c", role: "MATERIAL_LIMIT", exactText: "Attrition prospective" },
  { obligationId: "tradeoff", sourceRef: "tradeoff:design", role: "DECISION_TRADEOFF", exactText: "Le choix met en balance les avantages et les limites propres à chaque option." },
  { obligationId: "global", sourceRef: "proposal:limit:1", role: "MATERIAL_LIMIT", exactText: "Aucun modèle statistique, effectif ou paramètre d’acquisition n’est produit." },
  { obligationId: "human", sourceRef: "proposal:design", role: "HUMAN_DECISION_BOUNDARY", exactText: "Aucune option n’est adoptée ; la décision vous revient." },
];

const ownerEnvelope = () => buildGovernedConversationEnvelope({
  whatRef: "what:owner-options",
  action: "PROPOSE",
  actionCategory: "COMPARE_OPTIONS",
  purpose: "Présenter trois options pour décision humaine.",
  sourceTurnRef: "turn:owner",
  projectBinding: { projectId: "project:one", projectVersion: "project:one:v1", projectDigest: "digest:one" },
  targetRefs: ["proposal:design", "option:a", "option:b", "option:c"],
  intervention: { kind: "PRESENT_OWNER_DECISION_SUPPORT", contentSource: "OWNER_RESULT", sourceRefs: ["proposal:design"] },
  authorizedContent: [
    { ref: "option:a", text: "Cohorte longitudinale prospective", status: "SUPPORTED_CANDIDATE_NOT_ADOPTED" },
    { ref: "option:b", text: "Cohorte rétrospective à partir de données existantes", status: "SUPPORTED_CANDIDATE_NOT_ADOPTED" },
    { ref: "option:c", text: "Cohorte longitudinale ambispective", status: "SUPPORTED_CANDIDATE_NOT_ADOPTED" },
    { ref: "tradeoff:design", text: "Le choix met en balance les avantages et les limites propres à chaque option.", status: "PROPOSAL_ONLY" },
    { ref: "proposal:limit:1", text: "Aucun modèle statistique, effectif ou paramètre d’acquisition n’est produit.", status: "PROPOSAL_ONLY" },
  ],
  requiredContentRefs: ["option:a", "option:b", "option:c"],
  requiredVisibleObligations: ownerObligations(),
});

const ownerText = (omit: readonly string[] = []) => ownerObligations()
  .filter((item) => !omit.includes(item.obligationId)).map((item) => item.exactText).join(" ");

describe("PASS3A CC06 — ASK_INFORMATION interrogative surface", () => {
  it("A1 accepts one bound interrogative question", () => {
    const envelope = askEnvelope();
    const text = "Pouvez-vous préciser la population étudiée ?";
    const claim = claimFor(envelope, text, { "project:unknown:population": "population étudiée" });
    expect(validateGovernedConversationRealization({ envelope, assistantReply: text, claim }).structuralStatus).toBe("PASS");
  });

  it("A2 rejects the exact live infinitive instruction", () => {
    const envelope = askEnvelope();
    const text = "Préciser la population étudiée.";
    const result = validateGovernedConversationRealization({ envelope, assistantReply: text,
      claim: claimFor(envelope, text, { "project:unknown:population": text }) });
    expect(result.diagnostics).toContain("ASK_INTERROGATIVE_SURFACE_MISSING");
  });

  it("A3 rejects an action witness outside the interrogative sentence", () => {
    const envelope = askEnvelope();
    const text = "Préciser la population étudiée. Pouvez-vous confirmer ?";
    const result = validateGovernedConversationRealization({ envelope, assistantReply: text,
      claim: claimFor(envelope, "Préciser la population étudiée", { "project:unknown:population": "population étudiée" }) });
    expect(result.diagnostics).toEqual(expect.arrayContaining([
      "ACTION_WITNESS_OUTSIDE_INTERROGATIVE_SENTENCE", "ASK_TARGET_NOT_VISIBLE_IN_INTERROGATIVE_SENTENCE",
    ]));
  });

  it("A4 rejects multiple questions for one governed ASK", () => {
    const envelope = askEnvelope();
    const text = "Quelle population souhaitez-vous inclure ? Est-elle déjà définie ?";
    const result = validateGovernedConversationRealization({ envelope, assistantReply: text,
      claim: claimFor(envelope, "Quelle population souhaitez-vous inclure ?", { "project:unknown:population": "population" }) });
    expect(result.diagnostics).toContain("MULTIPLE_INTERROGATIVE_SURFACES_NOT_AUTHORIZED");
  });
});

describe("PASS3A CC07 — EXPLAIN_REFERENCED_CONTENT observable explanation", () => {
  it("E1 rejects the exact live re-enumeration", () => {
    const envelope = explainEnvelope();
    const text = `Les éléments retenus consistent à ${OBJECTIVE_A} ainsi qu'à ${OBJECTIVE_B}.`;
    const actionWitness = `${OBJECTIVE_A} ainsi qu'à ${OBJECTIVE_B}.`;
    const result = validateGovernedConversationRealization({ envelope, assistantReply: text,
      claim: claimFor(envelope, actionWitness, { "objective:detection": OBJECTIVE_A, "objective:clinical-outcome": OBJECTIVE_B }) });
    expect(result.diagnostics).toContain("EXPLANATION_NOT_REALIZED");
  });

  it("E2 accepts a separate structural distinction while retaining human review", () => {
    const envelope = explainEnvelope();
    const explanation = "Le premier objectif concerne la détection ; le second concerne le devenir clinique. Ils portent donc sur deux dimensions distinctes du projet.";
    const text = `${OBJECTIVE_A}. ${OBJECTIVE_B}. ${explanation}`;
    const result = validateGovernedConversationRealization({ envelope, assistantReply: text,
      claim: claimFor(envelope, explanation, { "objective:detection": OBJECTIVE_A, "objective:clinical-outcome": OBJECTIVE_B }) });
    expect(result).toMatchObject({ structuralStatus: "PASS", visibleTextFidelity: "UNKNOWN" });
  });

  it("E3 rejects a missing referent", () => {
    const envelope = explainEnvelope();
    const explanation = "Le premier objectif est distinct du second.";
    const text = `${OBJECTIVE_A}. ${explanation}`;
    const result = validateGovernedConversationRealization({ envelope, assistantReply: text,
      claim: claimFor(envelope, explanation, { "objective:detection": OBJECTIVE_A }) });
    expect(result.missingRequiredContentRefs).toEqual(["objective:clinical-outcome"]);
  });

  it("E4 rejects the unsupported historical methodological/operational rationale", () => {
    const envelope = explainEnvelope();
    const explanation = "Ces objectifs répondent à des finalités méthodologiques et opérationnelles différentes.";
    const text = `${OBJECTIVE_A}. ${OBJECTIVE_B}. ${explanation}`;
    const result = validateGovernedConversationRealization({ envelope, assistantReply: text,
      claim: claimFor(envelope, explanation, { "objective:detection": OBJECTIVE_A, "objective:clinical-outcome": OBJECTIVE_B }) });
    expect(result.diagnostics).toContain("UNSUPPORTED_EXPLANATORY_CONTENT");
  });
});

describe("PASS3A CC08 — user source attribution is a role-bound witness", () => {
  const evaluate = (text: string, actionWitness: string, overrides: Partial<GovernedRealizationProviderClaim> = {}) => {
    const envelope = sourceEnvelope();
    return validateGovernedConversationRealization({ envelope, assistantReply: text,
      claim: claimFor(envelope, actionWitness, { "objective:alpha": "étudier le phénomène bêta" }, overrides) });
  };

  it.each([
    "Je structure les éléments que vous avez formulés pour étudier le phénomène bêta.",
    "Voici la structuration proposée à partir des éléments que vous avez formulés pour étudier le phénomène bêta.",
    "Voici une structuration à partir de votre formulation : étudier le phénomène bêta.",
    "Sur la base de la correction que vous proposez : étudier le phénomène bêta.",
  ])("S1-S3 accepts a bounded user-attribution witness: %s", (text) => {
    expect(evaluate(text, text).structuralStatus).toBe("PASS");
  });

  it("S4 rejects a source-free NOXIA proposal", () => {
    const text = "Je propose d’étudier le phénomène bêta.";
    expect(evaluate(text, text).diagnostics).toContain("USER_SOURCE_ATTRIBUTION_SURFACE_MISSING");
  });

  it("S5 still rejects adoption despite correct source attribution", () => {
    const text = "J’adopte les éléments que vous avez formulés pour étudier le phénomène bêta.";
    expect(evaluate(text, text, { adoptionClaimed: true }).diagnostics).toContain("UNAUTHORIZED_ADOPTION_OR_WRITE_CLAIM");
  });
});

describe("PASS3A CC09 — proportionate owner decision support", () => {
  it("O1 accepts three options with one discriminant, limit, tradeoff and human boundary", () => {
    const envelope = ownerEnvelope();
    const text = ownerText();
    const claim = claimFor(envelope, "Trois options restent possibles", {
      "option:a": "Cohorte longitudinale prospective",
      "option:b": "Cohorte rétrospective à partir de données existantes",
      "option:c": "Cohorte longitudinale ambispective",
    });
    expect(validateGovernedConversationRealization({ envelope, assistantReply: `Trois options restent possibles. ${text}`, claim }).structuralStatus).toBe("PASS");
  });

  it("O2 rejects names alone", () => {
    const envelope = ownerEnvelope();
    const text = "Cohorte longitudinale prospective, Cohorte rétrospective à partir de données existantes, Cohorte longitudinale ambispective.";
    const result = validateGovernedConversationRealization({ envelope, assistantReply: text,
      claim: claimFor(envelope, text, { "option:a": "Cohorte longitudinale prospective", "option:b": "Cohorte rétrospective à partir de données existantes", "option:c": "Cohorte longitudinale ambispective" }) });
    expect(result.structuralStatus).toBe("FAIL");
  });

  it("O3 rejects an option without its available material limit", () => {
    const envelope = ownerEnvelope();
    const text = ownerText(["c:limit"]);
    const result = validateGovernedConversationRealization({ envelope, assistantReply: text,
      claim: claimFor(envelope, text, { "option:a": "Cohorte longitudinale prospective", "option:b": "Cohorte rétrospective à partir de données existantes", "option:c": "Cohorte longitudinale ambispective" }) });
    expect(result.diagnostics).toContain("REQUIRED_VISIBLE_OBLIGATION_MISSING:c:limit");
  });

  it("O4 rejects an absent governed tradeoff", () => {
    const envelope = ownerEnvelope();
    const text = ownerText(["tradeoff"]);
    const result = validateGovernedConversationRealization({ envelope, assistantReply: text,
      claim: claimFor(envelope, text, { "option:a": "Cohorte longitudinale prospective", "option:b": "Cohorte rétrospective à partir de données existantes", "option:c": "Cohorte longitudinale ambispective" }) });
    expect(result.diagnostics).toContain("REQUIRED_VISIBLE_OBLIGATION_MISSING:tradeoff");
  });

  it("O5 rejects internal product terminology", () => {
    const envelope = ownerEnvelope();
    const text = `Voici les propositions de l'owner. ${ownerText()}`;
    const result = validateGovernedConversationRealization({ envelope, assistantReply: text,
      claim: claimFor(envelope, text, { "option:a": "Cohorte longitudinale prospective", "option:b": "Cohorte rétrospective à partir de données existantes", "option:c": "Cohorte longitudinale ambispective" }) });
    expect(result.diagnostics).toContain("INTERNAL_PRODUCT_TERMINOLOGY_VISIBLE");
  });

  it("O5b does not confuse the ordinary French word projet with the technical Project label", () => {
    const envelope = ownerEnvelope();
    const text = `Pour votre projet, trois options restent possibles. ${ownerText()}`;
    const result = validateGovernedConversationRealization({ envelope, assistantReply: text,
      claim: claimFor(envelope, "trois options restent possibles", { "option:a": "Cohorte longitudinale prospective", "option:b": "Cohorte rétrospective à partir de données existantes", "option:c": "Cohorte longitudinale ambispective" }) });
    expect(result.structuralStatus).toBe("PASS");
  });

  it("O6 builds a readable fallback solely from governed facets", () => {
    const envelope = ownerEnvelope();
    const fallback = buildGovernedConversationLocalFallback(envelope)!;
    const realized = realizeGovernedConversation({ envelope, providerReply: "Sortie invalide", requireProviderClaim: true, localWhatText: fallback });
    expect(realized).toMatchObject({ executor: "LOCAL_DETERMINISTIC_REALIZATION", fallbackUsed: true, assistantReply: fallback });
    expect(fallback).toContain("Trois options restent possibles");
    expect(fallback).not.toMatch(/owner|QRY|Project|candidateRef|sourceRef|validator|TRACE|option:[abc]/u);
  });

  it("O7 rejects a fallback-like surface containing internal ids or statuses", () => {
    const envelope = ownerEnvelope();
    const unsafe = `${buildGovernedConversationLocalFallback(envelope)}\nsourceRef=study-design-option:abc STATUS=PROPOSAL_ONLY`;
    expect(validateGovernedConversationRealization({ envelope, assistantReply: unsafe }).diagnostics)
      .toContain("INTERNAL_PRODUCT_TERMINOLOGY_VISIBLE");
  });
});

describe("PASS3A exact targeted-live output requalification", () => {
  it("keeps T1, rejects T2 re-enumeration, rejects T6 infinitive, accepts T11 correction and keeps T11 refusal", () => {
    const t1 = sourceEnvelope();
    const t1Text = `Je vous propose de structurer les éléments que vous avez formulés autour de deux axes : ${OBJECTIVE_A}, et ${OBJECTIVE_B}.`;
    const t1Envelope = buildGovernedConversationEnvelope({ ...t1, whatRef: "live:t1", targetRefs: ["objective:detection", "objective:clinical-outcome"],
      authorizedContent: [{ ref: "objective:detection", text: OBJECTIVE_A, status: "KNOWN" }, { ref: "objective:clinical-outcome", text: OBJECTIVE_B, status: "KNOWN" }],
      requiredContentRefs: ["objective:detection", "objective:clinical-outcome"] });
    expect(validateGovernedConversationRealization({ envelope: t1Envelope, assistantReply: t1Text,
      claim: claimFor(t1Envelope, t1Text, { "objective:detection": OBJECTIVE_A, "objective:clinical-outcome": OBJECTIVE_B }) }).structuralStatus).toBe("PASS");

    const t2 = explainEnvelope();
    const t2Text = `Les éléments retenus consistent à ${OBJECTIVE_A} ainsi qu'à ${OBJECTIVE_B}.`;
    expect(validateGovernedConversationRealization({ envelope: t2, assistantReply: t2Text,
      claim: claimFor(t2, `${OBJECTIVE_A} ainsi qu'à ${OBJECTIVE_B}.`, { "objective:detection": OBJECTIVE_A, "objective:clinical-outcome": OBJECTIVE_B }) }).diagnostics)
      .toContain("EXPLANATION_NOT_REALIZED");

    const t6 = askEnvelope();
    const t6Text = "Préciser la population étudiée.";
    expect(validateGovernedConversationRealization({ envelope: t6, assistantReply: t6Text,
      claim: claimFor(t6, t6Text, { "project:unknown:population": t6Text }) }).diagnostics)
      .toContain("ASK_INTERROGATIVE_SURFACE_MISSING");

    const t11 = sourceEnvelope();
    const t11Text = "Voici la structuration proposée à partir des éléments que vous avez formulés pour étudier le phénomène bêta.";
    expect(validateGovernedConversationRealization({ envelope: t11, assistantReply: t11Text,
      claim: claimFor(t11, t11Text, { "objective:alpha": "étudier le phénomène bêta" }) }).structuralStatus).toBe("PASS");

    const refusal = buildGovernedConversationEnvelope({ whatRef: "live:refusal", action: "RESPOND", purpose: "Accuser réception.",
      sourceTurnRef: "turn:refusal", projectBinding: null, targetRefs: ["turn:refusal"],
      intervention: { kind: "ACKNOWLEDGE_USER_DIRECTION", contentSource: "NONE", sourceRefs: ["turn:refusal"] },
      authorizedContent: [{ ref: "turn:refusal", text: "Je refuse cette modification ; conserve l’objectif précédent.", status: null }],
      requiredContentRefs: [], requiredVisibleObligations: [{ obligationId: "ack", sourceRef: "turn:refusal", role: "USER_DIRECTION_ACKNOWLEDGEMENT", exactText: "Votre instruction est reçue" }] });
    const refusalText = "Votre instruction est reçue et prise en compte.";
    expect(validateGovernedConversationRealization({ envelope: refusal, assistantReply: refusalText,
      claim: claimFor(refusal, "Votre instruction est reçue", {}) }).structuralStatus).toBe("PASS");
  });

  it("requalifies the exact Study Design output as incomplete and internally leaky", () => {
    const envelope = ownerEnvelope();
    const text = "Voici les propositions de l'owner concernant les options de design d'étude : la première option est une Cohorte longitudinale prospective, dont l'avantage est d' Estimer un changement et sa variabilité dans une population définie. mais qui présente une limite d' Attrition. La deuxième option est une Cohorte rétrospective à partir de données existantes, permettant d' Explorer la relation avec les données effectivement disponibles et leur temporalité réelle. tout en comportant un Biais d’information. La troisième option est une Cohorte longitudinale ambispective visant à Relier une trajectoire historique documentée à des observations futures., avec comme limite une Attrition prospective. Aucun modèle statistique, effectif ou paramètre d’acquisition n’est produit. Aucune option n’est adoptée ; la décision vous revient.";
    const result = validateGovernedConversationRealization({ envelope, assistantReply: text,
      claim: claimFor(envelope, "Voici les propositions de l'owner concernant les options de design d'étude", {
        "option:a": "Cohorte longitudinale prospective", "option:b": "Cohorte rétrospective à partir de données existantes", "option:c": "Cohorte longitudinale ambispective",
      }) });
    expect(result.diagnostics).toEqual(expect.arrayContaining([
      "INTERNAL_PRODUCT_TERMINOLOGY_VISIBLE", "REQUIRED_VISIBLE_OBLIGATION_MISSING:tradeoff",
    ]));
  });
});
