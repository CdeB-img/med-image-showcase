import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ContributionReview from "../ContributionReview";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { buildBoundedConversationReferentContext, selectBoundedConversationInteraction } from "@/features/query-navigation/current-navigation-evidence";
import { confirmResearchProjectContribution, ensureCanonicalProjectState, prepareResearchProjectContributionCandidate, rejectResearchProjectContribution, type ResearchProjectOwnerProjection } from "@/features/research-project-construction";
import { buildScientificDiscussionContext } from "../contribution-discussion-context";
import { markContributionCandidateNonCurrent, markContributionCandidatePresented, recordContributionCandidateHumanDecision, retainValidatedContributionCandidate } from "../contribution-lifecycle";
import { classifyNaturalConversationActs, detectConversationStylePreference } from "../natural-conversation-policy";
import { createFunctionalResetSession, loadFunctionalResetSession, persistFunctionalResetSession } from "../session";
import { behaviorAuthority, behaviorContribution, behaviorItem, behaviorRelation, behaviorTurn } from "./p1-behavior-01a-contract-fixtures";

const at = "2026-09-17T10:00:00Z";
const fixture = (texts = ["Observer le mouvement à J3"], types = texts.map(() => "OBJECTIVE"), current: ResearchProjectOwnerProjection | null = null, id = "proposal", presented = true) => {
  const turn = behaviorTurn(`turn:${id}`, texts.join(" ; "));
  const contribution = behaviorContribution({ contributionId: `candidate:${id}`, turns: [turn],
    candidateObjects: texts.map((content, index) => behaviorItem({ itemId: `item:${id}:${index}`, proposedType: types[index]!, content, sourceText: content, turnId: turn.turnId,
      studyRole: types[index] === "ENDPOINT" ? "PRIMARY_ENDPOINT" : null })) });
  const candidate = prepareResearchProjectContributionCandidate(contribution, current);
  let retained = retainValidatedContributionCandidate({ retained: [], contribution, candidate, validation: { valid: true, blocks: [] },
    validatorRef: "N3_OFFLINE_SYNTHETIC_VALIDATED_REVIEW", sourceTurnRef: turn.turnId, baseProject: current, dependencyBindings: [], traceRunId: null, retainedAt: at });
  if (presented) retained = markContributionCandidatePresented({ retained, candidateRef: contribution.identity.contributionId, presentedAt: at });
  return { turn, contribution, candidate, retained, current };
};
const context = (f = fixture(), turns = [f.turn]) => buildBoundedConversationReferentContext({ retained: f.retained, currentProject: f.current,
  conversationId: f.contribution.source.conversationId, runtimeTurns: turns, selectedReviewRef: f.contribution.identity.contributionId });
const recognize = (raw: string, f = fixture(), turns = [f.turn]) => selectBoundedConversationInteraction({ sourceText: raw, correctionMode: false, referentContext: context(f, turns) });
const adopt = (f: ReturnType<typeof fixture>, raw: string, turns = [f.turn]) => {
  const act = recognize(raw, f, turns);
  if (act?.kind !== "USER_CONFIRMS_CURRENT_CANDIDATE") throw new Error("NO_BOUND_HUMAN_CONFIRMATION");
  const project = confirmResearchProjectContribution({ contribution: f.contribution, current: f.current, projectId: f.current?.projectId ?? "project:n3",
    authority: behaviorAuthority, confirmedAt: at, reviewedProjection: f.candidate.humanReviewProjection,
    confirmationSourceRefs: ["human:n3"], selectedChangeRefs: act.selectedChangeRefs });
  const retained = recordContributionCandidateHumanDecision({ retained: f.retained, candidateRef: f.contribution.identity.contributionId, decision: project.confirmationDecision });
  return { act, project, retained };
};
afterEach(() => vi.unstubAllGlobals());

describe("N3 — natural decision, visible binding and canonical human boundary", () => {
  it.each(["oui", "oui c'est exactement ça", "oui c’est bien cela", "on valide", "on adopte", "vous pouvez enregistrer", "vous pouvez enregistrer cette formulation", "ça me va", "garde ça", "comme tu viens de le présenter"])("proposal → %s", raw => {
      if (raw.startsWith("comme")) raw = `oui ${raw}`;
      const result = adopt(fixture(), raw);
      expect(result.project.revision).toBe(1);
      expect(result.project.confirmationDecision).toMatchObject({ status: "ADOPTED", actor: behaviorAuthority.actorRef, mandate: "PROJECT_OWNER" });
      expect(result.retained[0]!.humanDecision?.status).toBe("ADOPTED");
      expect(result.project.llmProjectWrites).toBe(0);
    });
  it.each(["ok je vois", "ok", "d'accord", "La phrase « oui » est un exemple.", "Si possible, on adopte.", "oui ?", "on adopte pas", "je confirme que le suivi est à J3"])("does not adopt an acknowledgement, quote, condition or fact: %s", raw => {
      expect(recognize(raw)?.kind).not.toBe("USER_CONFIRMS_CURRENT_CANDIDATE");
    });
  it("requires a presentation receipt even without an explicit review selection", () => {
    const f = fixture(undefined, undefined, null, "unseen", false);
    const c = buildBoundedConversationReferentContext({ retained: f.retained, currentProject: null, conversationId: f.contribution.source.conversationId, runtimeTurns: [f.turn] });
    expect(selectBoundedConversationInteraction({ sourceText: "oui", correctionMode: false, referentContext: c })?.kind).toBe("CLARIFY_CANDIDATE_REFERENCE");
  });
  it("a correction must not adopt the old J3 value", () => {
    const f = fixture();
    expect(recognize("oui mais M3 et pas J3", f)?.kind).toBe("ACKNOWLEDGE_USER_DIRECTION");
    expect(classifyNaturalConversationActs("oui mais M3 et pas J3")).toContain("CLARIFICATION_RESPONSE");
    expect(() => adopt(f, "oui mais M3 et pas J3")).toThrow("NO_BOUND_HUMAN_CONFIRMATION");
    expect(f.retained[0]!.humanDecision).toBeNull();
  });
  it("new information stays in the existing candidate corridor, not in whole adoption", () => {
    expect(recognize("oui, et on ajoutera une IRM à M12")?.kind).toBe("ACKNOWLEDGE_USER_DIRECTION");
    expect(() => adopt(fixture(), "oui, et on ajoutera une IRM à M12")).toThrow();
  });
  it("binds two explicit numbered points independently", () => {
    const f = fixture(["Observer le mouvement", "Observer le déplacement"]);
    const visible = behaviorTurn("visible:n3", "1. Observer le mouvement\n2. Observer le déplacement"); visible.role = "NOXIA";
    const result = adopt(f, "le premier oui, le deuxième non", [f.turn, visible]);
    const objects = ensureCanonicalProjectState(result.project).objects.filter(item => item.actuality === "CURRENT");
    expect(objects.map(item => item.content)).toEqual(["Observer le mouvement"]);
    expect(result.project.confirmationDecision.targets).toContain(result.act.selectedChangeRefs![0]);
    expect(result.project.canonicalState?.decisionLedger[0]?.candidateChangeRefs).toEqual(result.act.selectedChangeRefs);
    expect(adopt(f, "oui pour le premier point mais pas le second", [f.turn, visible]).project.canonicalState?.objects.map(item => item.content)).toEqual(["Observer le mouvement"]);
  });
  it("never infers numbered choices from invisible native order", () => {
    expect(recognize("le premier oui, le deuxième non", fixture(["Observer le mouvement", "Observer le déplacement"]))?.kind).toBe("CLARIFY_CANDIDATE_REFERENCE");
    expect(recognize("oui pour la première", fixture(["Observer le mouvement", "Observer le déplacement"]))?.kind).not.toBe("USER_CONFIRMS_CURRENT_CANDIDATE");
  });
  it("two presented points → the first selects its exact ref; both confirm only that visible scope", () => {
    const f = fixture(["Observer le mouvement", "Observer le déplacement"]);
    const visible = behaviorTurn("visible:two", "1. Observer le mouvement\n2. Observer le déplacement"); visible.role = "NOXIA";
    const selected = recognize("la première", f, [f.turn, visible]);
    expect(selected?.kind).toBe("ACKNOWLEDGE_USER_DIRECTION");
    expect(selected?.evidenceRefs).toContain(f.candidate.humanReviewProjection.sections.flatMap(section => section.items).find(item => /mouvement/u.test(item.content))!.changeRef);
    expect(adopt(f, "les deux", [f.turn, visible]).project.canonicalState?.objects).toHaveLength(2);
  });
  it("binds population yes / primary endpoint no without adopting the endpoint", () => {
    const f = fixture(["Participants âgés de 35 à 85 ans", "Proportion de masse mesurée"], ["POPULATION", "ENDPOINT"]);
    const result = adopt(f, "oui pour la population mais pas pour le critère principal");
    expect(ensureCanonicalProjectState(result.project).objects.map(item => item.objectType)).toEqual(["POPULATION"]);
    expect(result.project.sections.flatMap(section => section.elements).map(item => item.content)).not.toContain("Proportion de masse mesurée");
    const html = renderToStaticMarkup(createElement(ContributionReview, { contribution: f.contribution, candidate: f.candidate, status: "CONFIRMED",
      reviewDecision: result.project.confirmationDecision, onConfirm: () => {}, onReject: () => {}, onCorrect: () => {} }));
    expect(html).toContain("Décision partielle");
    expect(html).toContain("Non retenu");
    expect(html).not.toContain("Structure confirmée.");
  });
  it("binds the explicit partial decision without adopting an unmentioned sibling", () => {
    const f = fixture(["Participants âgés de 35 à 85 ans", "Proportion de masse mesurée", "Objectif distinct"], ["POPULATION", "ENDPOINT", "OBJECTIVE"]);
    const act = recognize("oui pour la population mais pas pour le critère principal", f);
    expect(act?.kind).toBe("USER_CONFIRMS_CURRENT_CANDIDATE");
    const result = adopt(f, "oui pour la population mais pas pour le critère principal");
    expect(result.project.sections.flatMap(section => section.elements).map(item => item.content)).toEqual(["Participants âgés de 35 à 85 ans"]);
  });
  it("does not widen a partial selection to dependent relations", () => {
    const f = fixture(["Participants âgés de 35 à 85 ans", "Proportion de masse mesurée"], ["POPULATION", "ENDPOINT"]);
    const contribution = behaviorContribution({ contributionId: "candidate:dependent", turns: [f.turn], candidateObjects: f.contribution.scientificContent.candidateObjects,
      relations: [behaviorRelation({ relationId: "relation:dependent", relationType: "ASSOCIATED_WITH", sourceItemId: "item:proposal:0", targetItemId: "item:proposal:1", turnId: f.turn.turnId })] });
    const candidate = prepareResearchProjectContributionCandidate(contribution, null);
    expect(() => confirmResearchProjectContribution({ contribution, current: null, projectId: "project:n3", authority: behaviorAuthority, confirmedAt: at,
      reviewedProjection: candidate.humanReviewProjection, selectedChangeRefs: [candidate.canonicalChangeSet.objectChanges[0]!.changeRef] })).toThrow();
  });
  it("fails closed on a fabricated or duplicate review target", () => {
    const f = fixture();
    for (const selectedChangeRefs of [["unknown"], [], [f.candidate.canonicalChangeSet.objectChanges[0]!.changeRef, f.candidate.canonicalChangeSet.objectChanges[0]!.changeRef]]) {
      expect(() => confirmResearchProjectContribution({ contribution: f.contribution, current: null, projectId: "project:n3", authority: behaviorAuthority, confirmedAt: at,
        reviewedProjection: f.candidate.humanReviewProjection, selectedChangeRefs })).toThrow();
    }
  });
  it("superseded candidate → yes cannot adopt the old proposal", () => {
    const f = fixture();
    f.retained = markContributionCandidateNonCurrent({ retained: f.retained, candidateRef: f.contribution.identity.contributionId, actuality: "SUPERSEDED", reasonRef: "correction:human", recordedAt: at });
    expect(recognize("oui", f)?.kind).toBe("CLARIFY_CANDIDATE_REFERENCE");
    expect(() => adopt(f, "oui")).toThrow();
  });
  it.each(["ce n'est pas J3, c'est bien M3", "le suivi est a M3\nsecond point premiere option."])("a prior correction blocks old adoption even before native actuality changes: %s", raw => {
    const f = fixture(["Le suivi est à J3"]);
    const correction = behaviorTurn("human:correction", raw);
    const confirmation = behaviorTurn("human:confirmation", "oui");
    const c = buildBoundedConversationReferentContext({ retained: f.retained, currentProject: null,
      conversationId: f.contribution.source.conversationId, runtimeTurns: [f.turn, correction, confirmation],
      selectedReviewRef: f.contribution.identity.contributionId, requestingTurnRef: confirmation.turnId });
    expect(c.resolution).toBe("STALE_OR_SUPERSEDED");
    expect(selectBoundedConversationInteraction({ sourceText: "oui", correctionMode: false, referentContext: c })?.kind).toBe("CLARIFY_CANDIDATE_REFERENCE");
  });
  it("does not treat the refusal currently being handled as a prior rejected proposal", () => {
    const f = fixture(["Analyse avec seuil"], ["ANALYSIS"]);
    const refusal = behaviorTurn("human:current-refusal", "je refuse");
    const c = buildBoundedConversationReferentContext({ retained: f.retained, currentProject: null,
      conversationId: f.contribution.source.conversationId, runtimeTurns: [f.turn, refusal],
      selectedReviewRef: f.contribution.identity.contributionId, requestingTurnRef: refusal.turnId });
    expect(selectBoundedConversationInteraction({ sourceText: refusal.content, correctionMode: false, referentContext: c })?.kind).toBe("USER_REFUSES_CURRENT_CANDIDATE");
  });
  it("a rejected candidate cannot be resurrected or have its human decision overwritten", () => {
    const f = fixture();
    const decision = rejectResearchProjectContribution({ contribution: f.contribution, current: null, authority: behaviorAuthority, rejectedAt: at });
    f.retained = recordContributionCandidateHumanDecision({ retained: f.retained, candidateRef: f.contribution.identity.contributionId, decision });
    expect(recognize("oui", f)?.kind).toBe("CLARIFY_CANDIDATE_REFERENCE");
    expect(() => recordContributionCandidateHumanDecision({ retained: f.retained, candidateRef: f.contribution.identity.contributionId, decision })).toThrow("NON_CURRENT_OR_DECIDED");
  });
  it("Project + new threshold candidate → exact refusal leaves the adopted Project unchanged", () => {
    const old = adopt(fixture(["Décrire les observations"]), "oui").project;
    const digest = logicalDigest(old);
    const f = fixture(["Analyse avec seuil"], ["ANALYSIS"], old, "threshold");
    const raw = "Non, je ne retiens pas l'analyse avec seuil. Le reste de ce qui a été validé reste en place.";
    expect(recognize(raw, f)?.kind).toBe("USER_REFUSES_CURRENT_CANDIDATE");
    const decision = rejectResearchProjectContribution({ contribution: f.contribution, current: old, authority: behaviorAuthority, rejectedAt: at });
    f.retained = recordContributionCandidateHumanDecision({ retained: f.retained, candidateRef: f.contribution.identity.contributionId, decision });
    expect(logicalDigest(old)).toBe(digest);
    expect(f.retained[0]!.humanDecision?.status).toBe("REJECTED");
  });
  it("mixed decision plus style feedback is split without artificial clarification", () => {
    const raw = "on adopte meme si je trouve que tu propose beaucoup trop de texte a lire";
    const result = adopt(fixture(), raw);
    expect(detectConversationStylePreference(raw)?.responseLength).toBe("CONCISE");
    expect(ensureCanonicalProjectState(result.project).objects.some(item => /texte/u.test(item.content))).toBe(false);
  });
  it("style feedback cannot smuggle a material correction into adoption", () => {
    expect(recognize("on adopte mais trop de texte et change le suivi à M3")?.kind).not.toBe("USER_CONFIRMS_CURRENT_CANDIDATE");
    expect(recognize("on adopte mais trop de texte et non pour X")?.kind).not.toBe("USER_CONFIRMS_CURRENT_CANDIDATE");
  });
  it("multiple retained proposals remain ambiguous despite the newest pending selection", () => {
    const a = fixture(); const b = fixture(["Observer la force"], ["OBJECTIVE"], null, "second");
    const c = buildBoundedConversationReferentContext({ retained: [...a.retained, ...b.retained], currentProject: null,
      conversationId: a.contribution.source.conversationId, runtimeTurns: [a.turn, b.turn], selectedReviewRef: b.contribution.identity.contributionId });
    for (const sourceText of ["oui", "la première", "les deux"]) {
      const act = selectBoundedConversationInteraction({ sourceText, correctionMode: false, referentContext: c });
      expect(act?.kind).not.toBe("USER_CONFIRMS_CURRENT_CANDIDATE");
    }
    expect(selectBoundedConversationInteraction({ sourceText: "oui", correctionMode: false, referentContext: c })?.clarificationText?.length).toBeLessThan(100);
  });
  it("same role-qualified AVC restatement can confirm, a changed role cannot", () => {
    const raw = "Oui, c’est bien cela. Vous pouvez enregistrer le projet avec cette formulation, en gardant la diffusion IRM comme comparaison secondaire et l’IRM de J+1 comme référence de la lésion finale.";
    const f = fixture(["Diffusion IRM comme comparaison secondaire", "IRM de J+1 comme référence de la lésion finale"]);
    expect(adopt(f, raw).project.revision).toBe(1);
    expect(adopt(f, raw.replace(", en gardant", ",\nen gardant")).project.revision).toBe(1);
    const wrong = fixture(["Diffusion IRM comme référence de la lésion finale", "IRM de J+1 comme comparaison secondaire"]);
    expect(recognize(raw, wrong)?.kind).toBe("ACKNOWLEDGE_USER_DIRECTION");
  });
  it("exact historical AVC T05 with additional methodology stays a qualified candidate input", () => {
    const probes = JSON.parse(readFileSync("validation/protocol-designer-v1-human-conversation-causal-audit-02/confirmation-probes.json", "utf8")) as { id: string; sourceText: string }[];
    const raw = probes.find(item => item.id === "AVC-T05")!.sourceText;
    expect(raw).toContain("Les seuils CBF, Tmax, OEF et CMRO2");
    expect(recognize(raw)?.kind).not.toBe("USER_CONFIRMS_CURRENT_CANDIDATE");
  });
  it("RHU M3 and first option require genuinely visible options", () => {
    const f = fixture(["Le suivi est à J3"]);
    const user = behaviorTurn("human:rhu", "le suivi est a M3\nsecond point premiere option.");
    const discussion = buildScientificDiscussionContext({ retained: f.retained, currentProject: null, conversationId: f.contribution.source.conversationId, runtimeTurns: [f.turn, user] });
    expect(discussion.projectWriteAuthorized).toBe(false);
    expect(discussion.unresolved.length).toBeGreaterThan(0);
    expect(recognize(user.content, f)?.kind).toBe("ACKNOWLEDGE_USER_DIRECTION");
    expect(classifyNaturalConversationActs(user.content)).toContain("CLARIFICATION_RESPONSE");
  });
  it("human decision and independent partial canonical state survive native persistence", () => {
    const f = fixture(["Participants âgés de 35 à 85 ans", "Proportion de masse mesurée"], ["POPULATION", "ENDPOINT"]);
    const result = adopt(f, "oui pour la population mais pas pour le critère principal");
    const data = new Map<string, string>();
    const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } } as Storage;
    const session = { ...createFunctionalResetSession(at), conversationId: f.contribution.source.conversationId, project: result.project,
      runtimeTurns: [f.turn], retainedContributionCandidates: result.retained };
    persistFunctionalResetSession(storage, session);
    const loaded = loadFunctionalResetSession(storage, undefined, true);
    expect(loaded.project).toEqual(session.project);
    expect(loaded.retainedContributionCandidates).toEqual(result.retained);
  });
  it("all decision qualification uses native owners without fetch", () => {
    const fetch = vi.fn(() => { throw new Error("OFFLINE_NO_PROVIDER"); }); vi.stubGlobal("fetch", fetch);
    adopt(fixture(), "oui");
    recognize("oui mais M3 et pas J3");
    expect(fetch).not.toHaveBeenCalled();
  });
});
