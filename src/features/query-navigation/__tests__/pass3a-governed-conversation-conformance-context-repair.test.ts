import { describe, expect, it } from "vitest";
import exactHistorical from "./fixtures/pass3a-gemini-dev-exact-outputs.json";
import {
  buildGovernedConversationEnvelope,
  parseGovernedRealizationProviderOutput,
  validateGovernedConversationRealization,
  type GovernedConversationEnvelope,
  type GovernedRealizationProviderClaim,
  type GovernedVisibleObligation,
} from "../governed-conversation-realization";
import { buildCurrentTurnNavigation, type CurrentGovernedNavigationInput } from "../current-turn-navigation";
import {
  buildBoundedConversationReferentContext,
  selectBoundedConversationInteraction,
} from "../current-navigation-evidence";
import { selectNextAction } from "../engine";
import { makeContext, TWO_OPTIONS_STATE } from "./fixtures";
import {
  adoptBehaviorContribution,
  behaviorContribution,
  behaviorItem,
  behaviorTurn,
} from "@/features/protocol-designer/functional-reset/__tests__/p1-behavior-01a-contract-fixtures";
import {
  markContributionCandidateNonCurrent,
  retainValidatedContributionCandidate,
} from "@/features/protocol-designer/functional-reset/contribution-lifecycle";
import { prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import type { PersistentDeltaValidation } from "@/features/protocol-designer/product-bridge";

const AT = "2026-09-08T19:00:00.000Z";
const validation: PersistentDeltaValidation = {
  valid: true, acceptedChanges: [], acceptedRelations: [], acceptedTemporalQualifications: [],
  acceptedExpectedVariableOccasions: [], blocks: [], noOps: [], normalizations: [],
};

const baseEnvelope = (overrides: Partial<GovernedConversationEnvelope> = {}) => buildGovernedConversationEnvelope({
  whatRef: "what:repair", action: "PROPOSE", purpose: "Structurer sans adopter.", sourceTurnRef: "turn:current",
  projectBinding: null, targetRefs: ["content:one"],
  authorizedContent: [{ ref: "content:one", text: "Étudier l’objectif d’intérêt", status: "KNOWN" }],
  requiredContentRefs: ["content:one"], ...overrides,
});

const providerClaim = (
  envelope: GovernedConversationEnvelope,
  actionWitness: string,
  contentWitness = actionWitness,
  overrides: Partial<GovernedRealizationProviderClaim> = {},
): GovernedRealizationProviderClaim => ({
  whatRef: envelope.whatRef, action: envelope.action, actionWitness,
  interventionKind: envelope.intervention.kind, contentSource: envelope.intervention.contentSource,
  targetRefs: [...envelope.targetRefs], informationNeedRefs: envelope.selectedInformationNeedRef ? [envelope.selectedInformationNeedRef] : [],
  contentClaims: envelope.requiredContentRefs.map((ref) => ({
    ref, witness: contentWitness, status: envelope.authorizedContent.find((item) => item.ref === ref)!.status,
  })), relationClaims: [], adoptionClaimed: false, projectWriteClaimed: false, ...overrides,
});

const candidateRecord = (id: string, contents: readonly [string, string][]) => {
  const turn = behaviorTurn(`turn:${id}`, contents.map((item) => item[1]).join(" ; "));
  const contribution = behaviorContribution({
    contributionId: `candidate:${id}`,
    turns: [turn],
    candidateObjects: contents.map(([itemId, content]) => behaviorItem({
      itemId, proposedType: "OBJECTIVE", content, sourceText: content, turnId: turn.turnId,
    })),
  });
  const candidate = prepareResearchProjectContributionCandidate(contribution, null);
  const retained = retainValidatedContributionCandidate({
    retained: [], contribution, candidate, validation, validatorRef: "PASS3A_CC_CONTEXT_VALIDATOR",
    sourceTurnRef: turn.turnId, baseProject: null, dependencyBindings: [], traceRunId: null, retainedAt: AT,
  });
  return { turn, contribution, candidate, retained };
};

const uniqueReferent = () => {
  const fixture = candidateRecord("thrombus", [
    ["objective:detection", "Évaluer les thrombus manqués à l’échographie et détectés à l’IRM"],
    ["objective:clinical-outcome", "Évaluer le devenir clinique des patients atteints de thrombus intra-VG"],
  ]);
  return { fixture, context: buildBoundedConversationReferentContext({
    retained: fixture.retained, currentProject: null, conversationId: fixture.contribution.source.conversationId,
    runtimeTurns: fixture.contribution.source.turns,
  }) };
};

const compareObligations = (): GovernedVisibleObligation[] => [
  { obligationId: "option:a:identity", sourceRef: "option:a", role: "OPTION_IDENTITY", exactText: "Cohorte prospective" },
  { obligationId: "option:a:discriminant", sourceRef: "option:a", role: "OPTION_DISCRIMINANT", exactText: "contrôle prospectif des mesures" },
  { obligationId: "option:b:identity", sourceRef: "option:b", role: "OPTION_IDENTITY", exactText: "Cohorte rétrospective" },
  { obligationId: "option:b:discriminant", sourceRef: "option:b", role: "OPTION_DISCRIMINANT", exactText: "données immédiatement disponibles" },
  { obligationId: "compare:limit", sourceRef: "option:b", role: "MATERIAL_LIMIT", exactText: "biais d’information" },
  { obligationId: "compare:human", sourceRef: "owner:study-design", role: "HUMAN_DECISION_BOUNDARY", exactText: "Aucune option n’est adoptée ; la décision vous revient." },
];

const comparisonEnvelope = () => buildGovernedConversationEnvelope({
  whatRef: "what:compare", action: "PROPOSE", actionCategory: "COMPARE_OPTIONS", purpose: "Comparer deux options.",
  sourceTurnRef: "turn:compare", projectBinding: null, targetRefs: ["option:a", "option:b"],
  intervention: { kind: "PRESENT_OWNER_DECISION_SUPPORT", contentSource: "OWNER_RESULT", sourceRefs: ["owner:study-design"] },
  authorizedContent: [
    { ref: "option:a", text: "Cohorte prospective — contrôle prospectif des mesures", status: "SUPPORTED_CANDIDATE_NOT_ADOPTED" },
    { ref: "option:b", text: "Cohorte rétrospective — données immédiatement disponibles ; biais d’information", status: "SUPPORTED_CANDIDATE_NOT_ADOPTED" },
  ],
  requiredContentRefs: ["option:a", "option:b"], requiredVisibleObligations: compareObligations(),
});

describe("PASS3A CC01 — exact normalized visible witness anchoring", () => {
  it("1. accepts a case-only difference and materializes the exact visible span", () => {
    const envelope = baseEnvelope({ action: "ASK_QUESTION", selectedInformationNeedRef: "need:one",
      alreadyProvidedInformationRefs: [], intervention: { kind: "ASK_INFORMATION", contentSource: "QUERY_NAVIGATION", sourceRefs: ["need:one"] } });
    const text = "Pouvez-vous Préciser la population étudiée ?";
    const result = validateGovernedConversationRealization({ envelope, assistantReply: text,
      claim: providerClaim(envelope, "préciser la population étudiée", "Préciser la population étudiée") });
    expect(result.structuralStatus).toBe("PASS");
    expect(result.actionWitnessSpan).toEqual({ start: 12, end: 42, exactText: "Préciser la population étudiée" });
  });

  it("2. normalizes a typographic apostrophe without altering the materialized span", () => {
    const envelope = baseEnvelope();
    const text = "L’objectif d’intérêt reste ouvert.";
    const result = validateGovernedConversationRealization({ envelope, assistantReply: text,
      claim: providerClaim(envelope, "l'objectif d'intérêt reste ouvert", "objectif d’intérêt") });
    expect(result.structuralStatus).toBe("PASS");
    expect(result.contentWitnessSpans[0]?.span.exactText).toBe("objectif d’intérêt");
  });

  it("3. does not hide a real accent corruption", () => {
    const envelope = baseEnvelope();
    const text = "Etudier l'objectif d'intérêt.";
    expect(validateGovernedConversationRealization({ envelope, assistantReply: text,
      claim: providerClaim(envelope, "Étudier l’objectif d’intérêt") }).diagnostics)
      .toContain("ACTION_WITNESS_NOT_IN_VISIBLE_TEXT");
  });

  it("4. rejects a deleted word", () => {
    const envelope = baseEnvelope();
    expect(validateGovernedConversationRealization({ envelope, assistantReply: "Étudier l’objectif.",
      claim: providerClaim(envelope, "Étudier l’objectif d’intérêt") }).structuralStatus).toBe("FAIL");
  });

  it("5. rejects a reordered witness", () => {
    const envelope = baseEnvelope();
    expect(validateGovernedConversationRealization({ envelope, assistantReply: "Étudier l’intérêt de l’objectif.",
      claim: providerClaim(envelope, "Étudier l’objectif d’intérêt") }).structuralStatus).toBe("FAIL");
  });

  it("6. rejects an absent witness", () => {
    const envelope = baseEnvelope();
    expect(validateGovernedConversationRealization({ envelope, assistantReply: "Le point reste ouvert.",
      claim: providerClaim(envelope, "Étudier l’objectif d’intérêt") }).structuralStatus).toBe("FAIL");
  });

  it("7. resolves multiple matching spans to the first exact visible span", () => {
    const envelope = baseEnvelope();
    const text = "Objectif ouvert ; objectif ouvert.";
    const result = validateGovernedConversationRealization({ envelope, assistantReply: text,
      claim: providerClaim(envelope, "objectif ouvert", "objectif ouvert") });
    expect(result.actionWitnessSpan).toEqual({ start: 0, end: 15, exactText: "Objectif ouvert" });
  });
});

describe("PASS3A CC03 — bounded referent context", () => {
  it("8. binds a unique current candidate and its exact objective refs", () => {
    const { fixture, context } = uniqueReferent();
    expect(context).toMatchObject({ resolution: "UNIQUE_CURRENT", candidateRef: fixture.candidate.contributionRef });
    expect(context.content.map((item) => item.ref)).toEqual(["objective:detection", "objective:clinical-outcome"]);
    const interaction = selectBoundedConversationInteraction({
      sourceText: "Explique pourquoi ces deux objectifs sont à distinguer sans les adopter.", correctionMode: false, referentContext: context,
    });
    const navigation = buildCurrentTurnNavigation({
      sourceTurnRef: "turn:explain", sourceText: "Explique pourquoi ces deux objectifs sont à distinguer sans les adopter.",
      candidate: null, validation: null, currentProject: null, boundedReferentContext: context, boundedInteraction: interaction,
    });
    expect(navigation.envelope.intervention).toMatchObject({ kind: "EXPLAIN_REFERENCED_CONTENT", contentSource: "RETAINED_CANDIDATE" });
    expect(navigation.envelope.requiredContentRefs).toEqual(["objective:detection", "objective:clinical-outcome"]);
    expect(JSON.stringify(navigation.envelope)).not.toContain("runtimeTurns");
  });

  it("9. leaves multiple current candidates ambiguous", () => {
    const first = candidateRecord("first", [["objective:first", "Premier objectif"]]);
    const second = candidateRecord("second", [["objective:second", "Second objectif"]]);
    const context = buildBoundedConversationReferentContext({
      retained: [...first.retained, ...second.retained], currentProject: null,
      conversationId: first.contribution.source.conversationId,
      runtimeTurns: [...first.contribution.source.turns, ...second.contribution.source.turns],
    });
    expect(context).toMatchObject({ resolution: "AMBIGUOUS", candidateRef: null, content: [] });
    const sourceText = "Explique ce point.";
    const boundedInteraction = selectBoundedConversationInteraction({ sourceText, correctionMode: false, referentContext: context });
    const navigation = buildCurrentTurnNavigation({ sourceTurnRef: "turn:ambiguous", sourceText,
      candidate: null, validation: null, currentProject: null, boundedReferentContext: context, boundedInteraction });
    expect(navigation.envelope.intervention).toMatchObject({ kind: "RESPOND_WITHOUT_MUTATION", contentSource: "NONE" });
    expect(navigation.localWhatText).toContain("Plusieurs candidates courantes");
    expect(navigation.envelope.requiredContentRefs).toEqual([]);
  });

  it("10. never resolves a stale candidate as current", () => {
    const { fixture } = uniqueReferent();
    const stale = markContributionCandidateNonCurrent({ retained: fixture.retained,
      candidateRef: fixture.candidate.contributionRef, actuality: "STALE", reasonRef: "project:changed", recordedAt: AT });
    const context = buildBoundedConversationReferentContext({ retained: stale, currentProject: null,
      conversationId: fixture.contribution.source.conversationId, runtimeTurns: fixture.contribution.source.turns });
    expect(context.resolution).toBe("STALE_OR_SUPERSEDED");
    const sourceText = "Explique cette proposition.";
    const boundedInteraction = selectBoundedConversationInteraction({ sourceText, correctionMode: false, referentContext: context });
    const navigation = buildCurrentTurnNavigation({ sourceTurnRef: "turn:stale", sourceText,
      candidate: null, validation: null, currentProject: null, boundedReferentContext: context, boundedInteraction });
    expect(navigation.localWhatText).toContain("n’est plus disponible comme candidate courante");
  });

  it("10b. binds short natural confirmation and refusal only to one exact current candidate", () => {
    const { context } = uniqueReferent();
    expect(selectBoundedConversationInteraction({
      sourceText: "c'est bon", correctionMode: false, referentContext: context,
    })).toMatchObject({ kind: "USER_CONFIRMS_CURRENT_CANDIDATE", evidenceRefs: [context.candidateRef, context.sourceTurnRef] });
    expect(selectBoundedConversationInteraction({
      sourceText: "je refuse", correctionMode: false, referentContext: context,
    })).toMatchObject({ kind: "USER_REFUSES_CURRENT_CANDIDATE", evidenceRefs: [context.candidateRef, context.sourceTurnRef] });
    expect(selectBoundedConversationInteraction({
      sourceText: "c'est bon mais remplace J3 par J5", correctionMode: false, referentContext: context,
    })).toBeUndefined();
    expect(selectBoundedConversationInteraction({
      sourceText: "c'est bon", correctionMode: false,
      referentContext: { ...context, resolution: "AMBIGUOUS", candidateRef: null, sourceTurnRef: null, content: [] },
    })).toEqual({ kind: "CLARIFY_CANDIDATE_REFERENCE", evidenceRefs: [] });
  });

  it("10c. composes current-candidate decisions without authorizing quoted, conditional or mixed acts", () => {
    const { context } = uniqueReferent();
    const classify = (sourceText: string, referentContext = context) => selectBoundedConversationInteraction({
      sourceText, correctionMode: false, referentContext,
    });
    for (const sourceText of [
      "Après relecture, je confirme cette candidate telle que présentée.",
      "Oui, cette proposition me convient, je la confirme.",
      "Nous confirmons cet ajout. Le reste demeure inchangé.",
    ]) expect(classify(sourceText), sourceText).toMatchObject({ kind: "USER_CONFIRMS_CURRENT_CANDIDATE", evidenceRefs: [context.candidateRef, context.sourceTurnRef] });
    for (const sourceText of [
      "Après réflexion, je refuse cette proposition. Le projet demeure inchangé.",
      "Non, je rejette cet ajout.",
    ]) expect(classify(sourceText), sourceText).toMatchObject({ kind: "USER_REFUSES_CURRENT_CANDIDATE", evidenceRefs: [context.candidateRef, context.sourceTurnRef] });
    for (const sourceText of [
      "Je ne confirme pas cette candidate.", "Je confirme pas cette candidate.",
      "D'accord. Je ne confirme pas cette candidate.",
      "Si les résultats sont bons, je confirme cette candidate.",
      "Par exemple, je confirme cette candidate.", "Je dirais : je confirme cette candidate.",
      "La formule « je confirme cette candidate » serait plus claire.",
      "Est-ce que je confirme cette candidate ?", "Je confirme cette candidate ?",
      "Je confirme cette candidate sauf le troisième point.",
      "Je confirme cette candidate, mais remplace la valeur proposée.",
      "Je confirme une partie et je refuse l'autre.",
      "Je confirme l'ancienne proposition.",
      "Nous supposons que cette méthode fonctionne.",
      "Je confirme que l'équipe est en déplacement.",
      "Je valide uniquement la ponctuation.",
      "Je confirme la proposition seulement pour son premier élément.",
      "OK. Ne confirmez aucune donnée à ce stade.",
      "Je confirme cette candidate. Sans adopter quoi que ce soit.",
      "Je confirme cette candidate. Mais seulement une partie.",
      "Je confirme cette candidate. Finalement, je retire mon accord.",
      "Ce nombre est exact, je le confirme.",
      "Je refuse que les participants soient mineurs.",
      "Je confirme « aucune adoption ».",
      'Je confirme "aucune adoption".',
      "Je confirme “aucune adoption”.",
      "Je confirme cette candidate. Le suivi durera dix mois.",
      "Je confirme cette contribution. Nous mesurerons aussi la mobilité.",
      "Le suivi durera dix mois, je confirme cette candidate.",
      "Je confirme cette candidate. Je ne donne aucune autorisation.",
    ]) expect(["USER_CONFIRMS_CURRENT_CANDIDATE", "USER_REFUSES_CURRENT_CANDIDATE"], sourceText).not.toContain(classify(sourceText)?.kind);
    expect(classify("Je confirme cette candidate.", { ...context, resolution: "AMBIGUOUS", candidateRef: null })?.kind).not.toBe("USER_CONFIRMS_CURRENT_CANDIDATE");
    expect(classify("D'accord. Propose-moi plusieurs possibilités.")?.kind).toBe("USER_REQUESTS_ASSISTED_PROPOSAL");
  });

  it("10d. preserves accented demonstrative boundaries without broadening decision scope", () => {
    const { context } = uniqueReferent();
    const classify = (sourceText: string) => selectBoundedConversationInteraction({ sourceText, correctionMode: false, referentContext: context });
    for (const sourceText of [
      "Nous confirmons cette contribution-là.",
      "Je valide cette candidate-là, celle que vous venez de proposer.",
    ]) expect(classify(sourceText)).toMatchObject({ kind: "USER_CONFIRMS_CURRENT_CANDIDATE", evidenceRefs: [context.candidateRef, context.sourceTurnRef] });
    expect(classify("Je rejette cette proposition-là.")?.kind).toBe("USER_REFUSES_CURRENT_CANDIDATE");
    for (const sourceText of [
      "Je confirme cette proposition-là seulement pour sa conclusion.",
      "Je confirme cette contribution-là et les observations dureront neuf jours.",
      "Je confirme cette proposition-làs.",
      "Je valide cette propositionélargie.",
      "Je valide « cette contribution-là ».",
      "Si cela convient, je valide cette contribution-là.",
      "Je ne valide pas cette contribution-là.",
    ]) expect(["USER_CONFIRMS_CURRENT_CANDIDATE", "USER_REFUSES_CURRENT_CANDIDATE"], sourceText).not.toContain(classify(sourceText)?.kind);
  });

  it("10e. clarifies complete decision acts with an unavailable or ambiguous reference", () => {
    const { context } = uniqueReferent();
    for (const resolution of ["AMBIGUOUS", "STALE_OR_SUPERSEDED", "NONE"] as const) {
      const referentContext = { ...context, resolution, candidateRef: null, sourceTurnRef: null, sourceDigest: null, content: [] };
      for (const sourceText of ["Nous confirmons cette contribution.", "Je rejette cette proposition.", "C'est bon."]) {
        expect(selectBoundedConversationInteraction({ sourceText, correctionMode: false, referentContext }))
          .toEqual({ kind: "CLARIFY_CANDIDATE_REFERENCE", evidenceRefs: [] });
      }
      for (const sourceText of [
        "Nous confirmons cette contribution. Nous observerons aussi la pression.",
        "Je confirme cette proposition sauf son titre.",
        "Si nécessaire, je refuse cette proposition.",
        "L'exemple est « je refuse cette proposition ».",
        "Je confirme que le prestataire est absent.",
      ]) expect(selectBoundedConversationInteraction({ sourceText, correctionMode: false, referentContext })).toBeUndefined();
    }
    expect(selectBoundedConversationInteraction({ sourceText: "Je confirme cette contribution.", correctionMode: true, referentContext: context }))
      .toMatchObject({ kind: "ACKNOWLEDGE_USER_DIRECTION" });
  });

  it("10f. rejects a unique-resolution label without complete reference provenance", () => {
    const { context } = uniqueReferent();
    for (const referentContext of [
      { ...context, candidateRef: null }, { ...context, sourceTurnRef: null }, { ...context, sourceDigest: null },
    ]) expect(selectBoundedConversationInteraction({ sourceText: "Je confirme cette contribution.", correctionMode: false, referentContext }))
      .toEqual({ kind: "CLARIFY_CANDIDATE_REFERENCE", evidenceRefs: [] });
  });

  it("10g. recognizes generic proposal request grammar without licensing decisions", () => {
    const { context } = uniqueReferent();
    const classify = (sourceText: string) => selectBoundedConversationInteraction({ sourceText, correctionMode: false, referentContext: context });
    for (const sourceText of [
      "Présentez-moi différentes possibilités pour poursuivre.",
      "Proposez plusieurs façons de procéder.",
      "Tu peux me proposer des pistes pour poursuivre ?",
      "Avec cette contrainte, quelles alternatives suggéreriez-vous ?",
      "Quelles options verrais-tu pour la suite ?",
      "Quelles possibilités pourrait-on explorer ?",
      "La série comprend sept lots. Quelles possibilités pourrait-on explorer ?",
    ]) expect(classify(sourceText), sourceText).toEqual({ kind: "USER_REQUESTS_ASSISTED_PROPOSAL", evidenceRefs: [] });
    for (const sourceText of [
      "Ne présentez pas de nouvelles possibilités.",
      "Quelles options ne proposeriez-vous pas ?",
      "Si les données changent, quelles possibilités pourrait-on explorer ?",
      "L'exemple est « présentez-moi différentes possibilités ».",
      "Supposons : proposez plusieurs façons de procéder.",
      "Je confirme cette proposition uniquement pour son titre.",
      "Quelles propositions avons-nous déjà rejetées ?",
    ]) expect(classify(sourceText), sourceText).toBeUndefined();
  });
});

describe("PASS3A CC04 — intervention and source ownership", () => {
  it("11. represents an explicit correction-mode direction as an acknowledgement", () => {
    const { context } = uniqueReferent();
    const sourceText = "Conserver l’état précédent.";
    const boundedInteraction = selectBoundedConversationInteraction({ sourceText, correctionMode: true, referentContext: context });
    expect(boundedInteraction).toMatchObject({ kind: "ACKNOWLEDGE_USER_DIRECTION" });
    const navigation = buildCurrentTurnNavigation({ sourceTurnRef: "turn:correction", sourceText,
      candidate: null, validation: null, currentProject: null, boundedReferentContext: context, boundedInteraction });
    expect(navigation.envelope.requiredVisibleObligations).toContainEqual(expect.objectContaining({
      role: "USER_DIRECTION_ACKNOWLEDGEMENT", exactText: "Votre instruction est reçue",
    }));
    expect(navigation.localWhatText).toContain("Votre instruction est reçue");
  });

  it("12. rejects an exact first-person source-turn echo", () => {
    const source = "Je refuse cette modification ; conserve l’objectif précédent.";
    const envelope = baseEnvelope({ action: "RESPOND", sourceTurnRef: "turn:current", targetRefs: ["turn:current"],
      authorizedContent: [{ ref: "turn:current", text: source, status: null }], requiredContentRefs: [],
      intervention: { kind: "ACKNOWLEDGE_USER_DIRECTION", contentSource: "USER_SUPPLIED", sourceRefs: ["turn:current"] } });
    expect(validateGovernedConversationRealization({ envelope, assistantReply: source,
      claim: providerClaim(envelope, source, source) }).diagnostics)
      .toContain("EXACT_SOURCE_TURN_ECHO_AS_ASSISTANT_RESPONSE");
  });

  it("13. marks a validated candidate as user-supplied content to structure", () => {
    const fixture = candidateRecord("user-source", [["objective:user", "Étudier le phénomène alpha"]]);
    const navigation = buildCurrentTurnNavigation({ sourceTurnRef: fixture.turn.turnId, sourceText: fixture.turn.content,
      candidate: fixture.candidate, contribution: fixture.contribution, validation, currentProject: null });
    expect(navigation.envelope.intervention).toMatchObject({
      kind: "STRUCTURE_USER_SUPPLIED_CONTENT", contentSource: "USER_SUPPLIED",
    });
    expect(navigation.envelope.requiredVisibleObligations.some((item) => item.role === "USER_SOURCE_ATTRIBUTION")).toBe(false);
    expect(navigation.localWhatText).toContain("que vous avez formulés");
    const result = validateGovernedConversationRealization({ envelope: navigation.envelope,
      assistantReply: navigation.localWhatText!, claim: providerClaim(navigation.envelope, navigation.localWhatText!,
        "les éléments que vous avez formulés", {
          contentClaims: navigation.envelope.requiredContentRefs.map((ref) => {
            const item = navigation.envelope.authorizedContent.find((content) => content.ref === ref)!;
            return { ref, witness: item.text, status: item.status };
          }),
        }) });
    expect(result.structuralStatus).toBe("PASS");
  });

  it("14. marks selected owner options as owner decision support, not user science", () => {
    const project = adoptBehaviorContribution(candidateRecord("project", [["objective:project", "Objectif adopté"]]).contribution, null, 1);
    const selection = selectNextAction(makeContext(TWO_OPTIONS_STATE, { projectRef: project.projectId, projectVersion: project.versionId }));
    const selected = selection.selected!;
    const currentNavigation: CurrentGovernedNavigationInput = {
      projectId: project.projectId, projectVersion: project.versionId, projectDigest: project.projectDigest,
      selectedActionRef: selected.candidateId, sourceStateDigest: selection.context.sourceStateDigest, selected,
      authorizedContent: comparisonEnvelope().authorizedContent,
      requiredContentRefs: ["option:a", "option:b"], requiredVisibleObligations: compareObligations(), alreadyProvidedInformationRefs: [],
    };
    const navigation = buildCurrentTurnNavigation({ sourceTurnRef: "turn:compare", sourceText: "Continuer.", candidate: null,
      validation: null, currentProject: project, requestKind: "POST_ADOPTION_QRY_CONTINUATION", currentNavigation,
      interaction: { interactionRef: "interaction:compare", sourceActionRef: selected.candidateId, owner: "QUERY_NAVIGATION",
        purpose: selected.explanation, expectedResponseKind: "QRY_INFORMATION_RESPONSE", targetRefs: [selected.targetRef],
        informationNeedRefs: [...selected.navigationNeedRefs], projectRef: project.projectId,
        projectVersion: project.versionId, projectDigest: project.projectDigest } });
    expect(navigation.envelope.intervention).toMatchObject({ kind: "PRESENT_OWNER_DECISION_SUPPORT", contentSource: "OWNER_RESULT" });
  });
});

describe("PASS3A CC05 — visible owner decision-support obligations", () => {
  it("15. rejects a comparison containing only option names", () => {
    const envelope = comparisonEnvelope();
    const text = "Cohorte prospective ou Cohorte rétrospective.";
    expect(validateGovernedConversationRealization({ envelope, assistantReply: text,
      claim: providerClaim(envelope, text, "Cohorte prospective") }).diagnostics)
      .toEqual(expect.arrayContaining(["REQUIRED_VISIBLE_OBLIGATION_MISSING:option:a:discriminant", "REQUIRED_VISIBLE_OBLIGATION_MISSING:compare:limit"]));
  });

  it("16. accepts structurally anchored discriminants and the human boundary", () => {
    const envelope = comparisonEnvelope();
    const text = "Cohorte prospective : contrôle prospectif des mesures. Cohorte rétrospective : données immédiatement disponibles, avec un biais d’information. Aucune option n’est adoptée ; la décision vous revient.";
    const claim = providerClaim(envelope, text, "Cohorte prospective", { contentClaims: [
      { ref: "option:a", witness: "Cohorte prospective", status: "SUPPORTED_CANDIDATE_NOT_ADOPTED" },
      { ref: "option:b", witness: "Cohorte rétrospective", status: "SUPPORTED_CANDIDATE_NOT_ADOPTED" },
    ] });
    expect(validateGovernedConversationRealization({ envelope, assistantReply: text, claim }).structuralStatus).toBe("PASS");
  });

  it("17. materializes a supported limitation witness", () => {
    const envelope = comparisonEnvelope();
    const text = "Cohorte prospective : contrôle prospectif des mesures. Cohorte rétrospective : données immédiatement disponibles, avec un biais d’information. Aucune option n’est adoptée ; la décision vous revient.";
    const result = validateGovernedConversationRealization({ envelope, assistantReply: text,
      claim: providerClaim(envelope, text, "Cohorte prospective", { contentClaims: [
        { ref: "option:a", witness: "Cohorte prospective", status: "SUPPORTED_CANDIDATE_NOT_ADOPTED" },
        { ref: "option:b", witness: "biais d’information", status: "SUPPORTED_CANDIDATE_NOT_ADOPTED" },
      ] }) });
    expect(result.visibleObligationSpans.find((item) => item.obligationId === "compare:limit")?.span.exactText).toBe("biais d’information");
  });

  it("18. rejects a generic limitation theme that omits the exact material limit", () => {
    const envelope = comparisonEnvelope();
    const text = "Cohorte prospective : contrôle prospectif des mesures. Cohorte rétrospective : données immédiatement disponibles. Le design a des limites. Aucune option n’est adoptée ; la décision vous revient.";
    expect(validateGovernedConversationRealization({ envelope, assistantReply: text,
      claim: providerClaim(envelope, text, "Le design a des limites") }).diagnostics)
      .toContain("REQUIRED_VISIBLE_OBLIGATION_MISSING:compare:limit");
  });

  it("19. rejects an adoption claim", () => {
    const envelope = comparisonEnvelope();
    const text = "Cohorte prospective : contrôle prospectif des mesures. Cohorte rétrospective : données immédiatement disponibles, avec un biais d’information. Aucune option n’est adoptée ; la décision vous revient.";
    expect(validateGovernedConversationRealization({ envelope, assistantReply: text,
      claim: providerClaim(envelope, text, "Cohorte prospective", { adoptionClaimed: true }) }).structuralStatus).toBe("FAIL");
  });

  it("20. rejects a Project write claim", () => {
    const envelope = comparisonEnvelope();
    const text = "Cohorte prospective : contrôle prospectif des mesures. Cohorte rétrospective : données immédiatement disponibles, avec un biais d’information. Aucune option n’est adoptée ; la décision vous revient.";
    expect(validateGovernedConversationRealization({ envelope, assistantReply: text,
      claim: providerClaim(envelope, text, "Cohorte prospective", { projectWriteClaimed: true }) }).structuralStatus).toBe("FAIL");
  });
});

type HistoricalCase = (typeof exactHistorical.cases)[number];

const historicalIntervention = (stepId: string, candidateRef: string | null) => {
  if (stepId === "CASE-06_T1") return { kind: "ASK_INFORMATION" as const, contentSource: "QUERY_NAVIGATION" as const };
  if (stepId === "CASE-09_T1") return { kind: "PRESENT_OWNER_DECISION_SUPPORT" as const, contentSource: "OWNER_RESULT" as const };
  if (stepId === "CASE-05_T2") return { kind: "EXPLAIN_REFERENCED_CONTENT" as const, contentSource: "RETAINED_CANDIDATE" as const };
  if (stepId === "CASE-11_T3") return { kind: "ACKNOWLEDGE_USER_DIRECTION" as const, contentSource: "USER_SUPPLIED" as const };
  return candidateRef
    ? { kind: "STRUCTURE_USER_SUPPLIED_CONTENT" as const, contentSource: "USER_SUPPLIED" as const }
    : { kind: "RESPOND_WITHOUT_MUTATION" as const, contentSource: "NONE" as const };
};

const historicalEnvelope = (fixture: HistoricalCase) => {
  const legacy = fixture.envelope;
  const intervention = historicalIntervention(fixture.stepId, legacy.candidateRef);
  const thrombusReferents = fixture.stepId === "CASE-05_T2" ? [
    { ref: "objective:detection", text: "Évaluer les thrombus manqués à l’échographie et détectés à l’IRM", status: "KNOWN" },
    { ref: "objective:clinical-outcome", text: "Évaluer le devenir clinique des patients atteints de thrombus intra-VG", status: "KNOWN" },
  ] : null;
  const compareRequirements: GovernedVisibleObligation[] = fixture.stepId === "CASE-09_T1" ? [
    { obligationId: "historical:09:prospective", sourceRef: "study-design-option:ke1-a8c546fdbe2106c9", role: "OPTION_DISCRIMINANT", exactText: "Estimer un changement et sa variabilité dans une Population définie." },
    { obligationId: "historical:09:retrospective", sourceRef: "study-design-option:ke1-416a58c68e770f32", role: "OPTION_DISCRIMINANT", exactText: "Explorer la relation avec les données effectivement disponibles et leur temporalité réelle." },
    { obligationId: "historical:09:ambispective", sourceRef: "study-design-option:ke1-d64e3d8de4ad3dd9", role: "OPTION_DISCRIMINANT", exactText: "Relier une trajectoire historique documentée à des observations futures sans assimiler les deux niveaux de contrôle des données." },
    { obligationId: "historical:09:limit", sourceRef: "study-design-proposal:ke1-c5b266bdcb350091:limitation:1", role: "MATERIAL_LIMIT", exactText: "Aucun modèle statistique, effectif, paramètre d’acquisition, endpoint final ou qualification réglementaire n’est produit." },
    { obligationId: "historical:09:human", sourceRef: "study-design-proposal:ke1-c5b266bdcb350091", role: "HUMAN_DECISION_BOUNDARY", exactText: "Aucune option n’est adoptée ; la décision vous revient." },
  ] : [];
  const authorizedContent = thrombusReferents ?? legacy.authorizedContent;
  const requiredContentRefs = thrombusReferents?.map((item) => item.ref)
    ?? (fixture.stepId === "CASE-09_T1" ? legacy.requiredContentRefs.filter((ref) => !ref.startsWith("qry-action-")) : legacy.requiredContentRefs);
  const sourceOwnershipRequirements: GovernedVisibleObligation[] = fixture.stepId === "CASE-11_T3" ? [{
    obligationId: "historical:acknowledgement:CASE-11_T3", sourceRef: legacy.sourceTurnRef,
    role: "USER_DIRECTION_ACKNOWLEDGEMENT", exactText: "Votre instruction est reçue",
  }] : legacy.candidateRef && intervention.kind === "STRUCTURE_USER_SUPPLIED_CONTENT" ? [{
    obligationId: `historical:user-source:${fixture.stepId}`, sourceRef: legacy.candidateRef,
    role: "USER_SOURCE_ATTRIBUTION", exactText: "les éléments que vous avez formulés",
  }] : [];
  return buildGovernedConversationEnvelope({
    whatRef: legacy.whatRef,
    action: legacy.action as Parameters<typeof buildGovernedConversationEnvelope>[0]["action"],
    actionCategory: legacy.actionCategory as Parameters<typeof buildGovernedConversationEnvelope>[0]["actionCategory"],
    purpose: legacy.purpose, sourceTurnRef: legacy.sourceTurnRef, projectBinding: legacy.projectBinding,
    candidateRef: legacy.candidateRef, targetRefs: thrombusReferents?.map((item) => item.ref) ?? legacy.targetRefs,
    authorizedContent, requiredContentRefs,
    requiredVisibleObligations: thrombusReferents?.map((item) => ({ obligationId: `historical:05:${item.ref}`,
      sourceRef: item.ref, role: "REFERENT_CONTENT" as const, exactText: item.text }))
      ?? (compareRequirements.length ? compareRequirements : sourceOwnershipRequirements),
    requiredRelations: legacy.requiredRelations, protectedLiterals: legacy.protectedLiterals,
    alreadyProvidedInformationRefs: legacy.alreadyProvidedInformationRefs,
    selectedInformationNeedRef: legacy.selectedInformationNeedRef, scientificLimitations: legacy.scientificLimitations,
    intervention: { ...intervention, sourceRefs: [legacy.sourceTurnRef] },
  });
};

describe("PASS3A historical 14-output immutable requalification", () => {
  it("uses all fourteen exact historical provider outputs without changing their stored bytes", () => {
    expect(exactHistorical.cases).toHaveLength(14);
    const results = exactHistorical.cases.map((fixture) => {
      const parsed = parseGovernedRealizationProviderOutput(fixture.providerOutput);
      expect(parsed, fixture.stepId).not.toBeNull();
      const envelope = historicalEnvelope(fixture);
      const result = validateGovernedConversationRealization({
        envelope, assistantReply: parsed!.assistantReply, claim: parsed!.claim, requireProviderClaim: true,
      });
      return { stepId: fixture.stepId, result };
    });
    expect(results.find((item) => item.stepId === "CASE-06_T1")?.result.structuralStatus).toBe("PASS");
    const case11t2 = results.find((item) => item.stepId === "CASE-11_T2")!.result;
    expect(case11t2.diagnostics).not.toContain("CONTENT_WITNESS_NOT_IN_VISIBLE_TEXT:objective:alpha");
    expect(case11t2.diagnostics).toContain("INTERVENTION_SEMANTICS_CLAIM_REQUIRED");
    expect(results.find((item) => item.stepId === "CASE-09_T1")?.result.diagnostics)
      .toContain("REQUIRED_VISIBLE_OBLIGATION_MISSING:historical:09:prospective");
    expect(results.find((item) => item.stepId === "CASE-05_T2")?.result.missingRequiredContentRefs)
      .toEqual(["objective:detection", "objective:clinical-outcome"]);
    const case11t3 = results.find((item) => item.stepId === "CASE-11_T3")!.result;
    expect(case11t3.diagnostics).toContain("EXACT_SOURCE_TURN_ECHO_AS_ASSISTANT_RESPONSE");
    expect(case11t3.diagnostics).toContain("REQUIRED_VISIBLE_OBLIGATION_MISSING:historical:acknowledgement:CASE-11_T3");
    for (const stepId of ["CASE-07_T1", "CASE-08_T1", "CASE-11_T1", "CASE-12_T1"]) {
      expect(results.find((item) => item.stepId === stepId)?.result.diagnostics, stepId)
        .toContain(`REQUIRED_VISIBLE_OBLIGATION_MISSING:historical:user-source:${stepId}`);
    }
  });
});
