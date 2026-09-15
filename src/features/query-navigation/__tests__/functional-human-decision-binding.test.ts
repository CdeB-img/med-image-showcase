import { describe, expect, it } from "vitest";
import { buildBoundedConversationReferentContext, selectBoundedConversationInteraction } from "../current-navigation-evidence";
import { behaviorContribution, behaviorItem, behaviorTurn } from "@/features/protocol-designer/functional-reset/__tests__/p1-behavior-01a-contract-fixtures";
import { markContributionCandidatePresented, retainValidatedContributionCandidate } from "@/features/protocol-designer/functional-reset/contribution-lifecycle";
import { prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";

const record = (id: string, texts: string[]) => {
  const turn = behaviorTurn(`turn:${id}`, texts.join(" ; "));
  const contribution = behaviorContribution({ contributionId: `candidate:${id}`, turns: [turn],
    candidateObjects: texts.map((content, index) => behaviorItem({ itemId: `item:${id}:${index}`, proposedType: "OBJECTIVE", content, sourceText: content, turnId: turn.turnId })) });
  const candidate = prepareResearchProjectContributionCandidate(contribution, null);
  const retained = retainValidatedContributionCandidate({ retained: [], contribution, candidate,
    validation: { valid: true, blocks: [] }, validatorRef: "FUNCTIONAL_DECISION_TEST", sourceTurnRef: turn.turnId,
    baseProject: null, dependencyBindings: [], traceRunId: null, retainedAt: "2026-09-15T08:00:00Z" });
  return { turn, contribution, retained };
};
const context = (texts: string[], presented = true) => {
  const fixture = record("selected", texts);
  const retained = presented ? markContributionCandidatePresented({ retained: fixture.retained,
    candidateRef: fixture.contribution.identity.contributionId, presentedAt: "2026-09-15T08:00:01Z" }) : fixture.retained;
  return buildBoundedConversationReferentContext({ retained, currentProject: null,
    conversationId: fixture.contribution.source.conversationId, runtimeTurns: [fixture.turn],
    selectedReviewRef: fixture.contribution.identity.contributionId });
};
const classify = (sourceText: string, referentContext = context(["Observer le mouvement à 12 jours"])) =>
  selectBoundedConversationInteraction({ sourceText, correctionMode: false, referentContext });

describe("Human decision scope and selected-review provenance", () => {
  it("binds elided acceptance to the explicitly selected and presented candidate", () => {
    expect(classify("J’accepte cette proposition.")?.kind).toBe("USER_CONFIRMS_CURRENT_CANDIDATE");
  });
  it("binds a bare refusal only when one presented review is available", () => {
    expect(classify("je refuse")?.kind).toBe("USER_REFUSES_CURRENT_CANDIDATE");
    expect(classify("je refuse", context(["Observer le mouvement"], false))?.kind).toBe("CLARIFY_CANDIDATE_REFERENCE");
  });
  it("does not turn the latest pending review into an explicit choice between two candidates", () => {
    const first = record("first", ["Observer le mouvement"]);
    const second = record("second", ["Observer la force"]);
    const ambiguous = buildBoundedConversationReferentContext({ retained: [...first.retained, ...second.retained],
      currentProject: null, conversationId: first.contribution.source.conversationId,
      runtimeTurns: [first.turn, second.turn], selectedReviewRef: second.contribution.identity.contributionId });
    expect(ambiguous.resolution).toBe("AMBIGUOUS");
    expect(classify("Je confirme cette proposition", ambiguous)?.kind).toBe("CLARIFY_CANDIDATE_REFERENCE");
  });
  it("lets the existing owner resolve a numbered option and new candidate material", () => {
    expect(classify("Je retiens la question 1")).toBeUndefined();
    expect(classify("Je confirme une nouvelle proposition : ajouter la mesure secondaire")).toBeUndefined();
  });
  it("never uses an unseen candidate as a presented decision target", () => {
    expect(classify("Je confirme cette proposition.", context(["Observer le mouvement"], false))?.kind).toBe("CLARIFY_CANDIDATE_REFERENCE");
  });
  it("does not replace an invalid explicit selection with another current candidate", () => {
    const fixture = record("available", ["Observer le mouvement"]);
    const result = buildBoundedConversationReferentContext({ retained: fixture.retained, currentProject: null,
      conversationId: fixture.contribution.source.conversationId, runtimeTurns: [fixture.turn], selectedReviewRef: "missing" });
    expect(result.candidateRef).toBeNull();
  });
  it("does not approve a different named object under a deictic presentation phrase", () => {
    expect(classify("Je confirme ce prélèvement tel que présenté.")?.kind).toBe("CLARIFY_CANDIDATE_REFERENCE");
  });
  it("does not approve a numerical qualifier contradicting the selected candidate", () => {
    expect(classify("Je confirme cette modification à 9 jours telle que présentée.")?.kind).toBe("CLARIFY_CANDIDATE_REFERENCE");
  });
  it("keeps signs and decimal quantities distinct", () => {
    expect(classify("Je confirme cette modification à -12 jours telle que présentée.")?.kind).not.toBe("USER_CONFIRMS_CURRENT_CANDIDATE");
    expect(classify("Je confirme cette modification à 2,12 jours telle que présentée.", context(["Observer le mouvement à 12,2 jours"]))?.kind)
      .not.toBe("USER_CONFIRMS_CURRENT_CANDIDATE");
  });
  it("does not approve siblings through a restricted decision on one object", () => {
    expect(classify("Je confirme uniquement le mouvement tel que présenté.", context(["Observer le mouvement", "Observer le déplacement"]))?.kind)
      .toBe("CLARIFY_CANDIDATE_REFERENCE");
  });
  it("does not approve an unmentioned sibling through a named presentation pointer", () => {
    expect(classify("Je confirme le mouvement tel que présenté.", context(["Observer le mouvement", "Observer le déplacement"]))?.kind)
      .toBe("CLARIFY_CANDIDATE_REFERENCE");
  });
  it("does not reuse old quantities or units mentioned in the candidate source", () => {
    const base = context(["Observer le mouvement à 12 semaines"]);
    const referentContext = { ...base, decisionScope: { ...base.decisionScope!, sourceText: "Remplacer 9 jours par 12 semaines." } };
    expect(classify("Je confirme cette modification à neuf jours telle que présentée.", referentContext)?.kind).toBe("CLARIFY_CANDIDATE_REFERENCE");
    expect(classify("Je confirme cette modification à douze jours telle que présentée.", referentContext)?.kind).toBe("CLARIFY_CANDIDATE_REFERENCE");
  });
  it("retains a conditional decision without definitive adoption", () => {
    expect(classify("Si la ressource est disponible, je confirme cette proposition.")?.kind).toBe("CLARIFY_CANDIDATE_REFERENCE");
  });
  it("binds a source-grounded participant count to a native human sample-size candidate", () => {
    const base = context(["Effectif envisagé de 210 personnes; faisabilité inconnue"]);
    const referentContext = { ...base, decisionScope: { ...base.decisionScope!,
      sourceText: "Pour le nombre de participants, nous envisageons 210 personnes." } };
    expect(classify("Je refuse cette proposition de 210 participants.", referentContext)?.kind)
      .toBe("USER_REFUSES_CURRENT_CANDIDATE");
    expect(classify("Je refuse cette proposition de 120 participants.", referentContext)?.kind)
      .toBe("CLARIFY_CANDIDATE_REFERENCE");
    const differentUnit = { ...referentContext, decisionScope: { ...referentContext.decisionScope,
      candidateTexts: ["Effectif envisagé de 210 établissements; faisabilité inconnue"] } };
    expect(classify("Je confirme cette proposition de 210 participants.", differentUnit)?.kind)
      .toBe("CLARIFY_CANDIDATE_REFERENCE");
  });
  it("keeps an independent new assertion in the full corridor", () => {
    expect(classify("Je confirme cette proposition. Les observations couvrent trois groupes."))
      .toBeUndefined();
  });
  it("does not let a confirmation erase a named preservation constraint", () => {
    expect(classify("Je confirme cette proposition. La durée de neuf jours reste telle qu'adoptée.")?.kind)
      .toBe("CLARIFY_CANDIDATE_REFERENCE");
  });
  it("does not promote quoted consent", () => {
    expect(classify("La phrase « je confirme cette proposition » est un exemple.")).toBeUndefined();
  });
  it("does not substitute the current candidate for a named old proposal", () => {
    expect(classify("Je refuse cette proposition ancienne.")?.kind).toBe("CLARIFY_CANDIDATE_REFERENCE");
  });
});
