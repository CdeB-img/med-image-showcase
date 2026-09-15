import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { buildFunctionalResetQueryNavigation } from "@/features/query-navigation";
import {
  selectBoundedConversationInteraction,
} from "@/features/query-navigation/current-navigation-evidence";
import type { BoundedConversationReferentContext } from "@/features/query-navigation/current-turn-navigation";
import {
  buildProjectContextSnapshot,
  confirmResearchProjectContribution,
  prepareResearchProjectContributionCandidate,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import { createProductOwnerResultLedger } from "@/features/protocol-designer/product-owner-result-ledger";
import { createScientificExecutionTraceLedger } from "@/features/protocol-designer/scientific-execution-trace";
import { buildScientificThinkingInputFromProjectSnapshot } from "@/features/research-project-construction/scientific-reasoning-owner-chain";
import { executeScientificThinkingEngine } from "@/features/scientific-thinking";
import {
  buildScientificThinkingSelectionContribution,
  buildStandardScientificThinkingPresentation,
  dispatchScientificThinkingFromQuery,
  readScientificThinkingOutputFromLedger,
  resolveScientificThinkingConversation,
  scientificThinkingInteractionMatchesCurrentProject,
} from "../scientific-thinking-standard";
import {
  behaviorAuthority,
  behaviorContribution,
  behaviorItem,
  behaviorRelation,
  behaviorTurn,
} from "./p1-behavior-01a-contract-fixtures";

const AT = "2026-09-14T20:00:00.000Z";
const DOMAINS = [
  {
    id: "learning",
    condition: "Apprentissage de la lecture",
    population: "Élèves apprenant à lire",
    firstArm: "Enseignement par exercices espacés",
    secondArm: "Enseignement par exercices regroupés",
    endpoint: "Nombre de mots correctement lus",
    unknown: "Durée du suivi de la lecture non encore définie",
  },
  {
    id: "agronomy",
    condition: "Culture du blé",
    population: "Parcelles cultivées en blé",
    firstArm: "Irrigation continue",
    secondArm: "Irrigation intermittente",
    endpoint: "Rendement en grains par parcelle",
    unknown: "Durée du suivi des parcelles non encore définie",
  },
] as const;
type Domain = typeof DOMAINS[number];
type Dispatch = ReturnType<typeof dispatchScientificThinkingFromQuery>;
const EQUIVALENT_PROPOSAL_REQUESTS = [
  "fais moi des propositions",
  "qu'est-ce que tu me proposerais ?",
  "propose-moi plusieurs options",
  "tu vois d'autres possibilités ?",
  "quelles alternatives seraient intéressantes ?",
  "Pouvez-vous me suggérer des pistes ?",
  "Propose-moi des alternatives sans aucune adoption.",
  "Propose-moi des options qui ne changent pas le critère principal.",
  "La comparaison est importante. Propose-moi plusieurs approches possibles.",
  "Merci, maintenant propose-moi d'autres choix, sans les adopter.",
  "Quelles nouvelles pistes pouvez-vous présenter pour la suite ?",
  "Quelles possibilités proposes-tu pour les observations ?",
] as const;
const NO_REFERENT: BoundedConversationReferentContext = {
  resolution: "NONE", candidateRef: null, sourceTurnRef: null, sourceDigest: null,
  content: [], reason: "TEST_NO_PENDING_CANDIDATE", projectWriteAuthorized: false,
};
const classify = (sourceText: string, referentContext = NO_REFERENT) => selectBoundedConversationInteraction({
  sourceText, correctionMode: false, referentContext,
});

// Only explicit user content enters the existing Project confirmation owner.
// No live-recorded response, QRY result, owner output or Project internals are injected.
const makeProject = (domain: Domain, withComparison = true) => {
  const objective = withComparison
    ? `Comparer ${domain.firstArm} et ${domain.secondArm} pour ${domain.endpoint}`
    : `Caractériser l’évolution longitudinale de ${domain.endpoint}`;
  const turn = behaviorTurn(`turn:proposal-purpose:${domain.id}`, `${objective}. ${domain.unknown}.`);
  const item = (suffix: string, proposedType: string, content: string, studyRole?: string) => behaviorItem({
    itemId: `${suffix}:proposal-purpose:${domain.id}`, proposedType, content, studyRole, turnId: turn.turnId,
  });
  const contribution = behaviorContribution({
    contributionId: `contribution:proposal-purpose:${domain.id}`,
    turns: [turn],
    candidateObjects: [
      item("condition", "CONDITION", domain.condition),
      item("population", "POPULATION", domain.population),
      item("objective", "OBJECTIVE", objective, "PRIMARY"),
      item("intervention", "INTERVENTION", domain.firstArm, "INTERVENTION_ARM"),
      item("comparator", "COMPARATOR", domain.secondArm, "COMPARATOR_ARM"),
      item("endpoint", "ENDPOINT", domain.endpoint, "PRIMARY_ENDPOINT"),
      behaviorItem({
        itemId: `unknown:proposal-purpose:${domain.id}`, proposedType: "PROJECT_INFORMATION",
        content: domain.unknown, epistemicState: "UNKNOWN", epistemicStatus: "UNKNOWN", turnId: turn.turnId,
      }),
    ],
    relations: withComparison ? [behaviorRelation({
      relationId: `relation:proposal-purpose:${domain.id}`, relationType: "COMPARES_WITH",
      sourceItemId: `intervention:proposal-purpose:${domain.id}`,
      targetItemId: `comparator:proposal-purpose:${domain.id}`, turnId: turn.turnId,
    })] : [],
  });
  return confirmResearchProjectContribution({
    contribution, current: null, projectId: `research-project:proposal-purpose:${domain.id}`,
    authority: behaviorAuthority, confirmedAt: AT,
  });
};

const dispatch = (
  project: ResearchProjectOwnerProjection,
  requestedAction?: "ASSISTED_PROPOSAL",
  previous?: Dispatch,
  turn = "first",
) => {
  const sessionId = `session:proposal-purpose:${project.projectId}`;
  const at = new Date(Date.parse(AT) + (previous?.traceLedger.runBindings.length ?? 0) * 1000).toISOString();
  const navigation = buildFunctionalResetQueryNavigation({ project, requestedAction, recordedAt: at });
  return dispatchScientificThinkingFromQuery({
    project, navigation, sessionId, conversationId: `conversation:${sessionId}`,
    ownerResultLedger: previous?.ownerResultLedger ?? createProductOwnerResultLedger(sessionId),
    traceLedger: previous?.traceLedger ?? createScientificExecutionTraceLedger(sessionId),
    previousInteraction: previous?.interaction,
    presentationTurnRef: `turn:proposal-purpose:${turn}`, startedAt: at, completedAt: at,
  });
};

const assertCandidateBoundary = (result: Dispatch, project: ResearchProjectOwnerProjection) => {
  expect(result).toMatchObject({ providerCalls: 0, projectWrites: 0, humanDecisionCreated: false });
  expect(result.output).toMatchObject({ candidateIsAdopted: false, projectWriteAuthorized: false, projectOwnershipTransferred: false });
  expect(result.interaction).toMatchObject({ sourceProjectRef: project.projectId, sourceProjectVersion: project.versionId, sourceProjectDigest: project.projectDigest, status: "ACTIVE", projectWriteAuthorized: false });
  expect(result.output.hypotheses.every((hypothesis) => hypothesis.reviewState === "PENDING")).toBe(true);
  expect(result.presentation.plainText).not.toMatch(/ST-H-|ST-Q-|PROJECT_[A-Z_]+|scientific-thinking-output:|\bINTERNAL\b/u);
};

beforeEach(() => {
  vi.spyOn(globalThis, "fetch").mockImplementation(() => { throw new Error("OFFLINE_PROPERTY_TEST_FORBIDS_PROVIDER_CALLS"); });
});
afterEach(() => {
  expect(globalThis.fetch).not.toHaveBeenCalled();
  vi.restoreAllMocks();
});

describe.each(DOMAINS)("Scientific proposal purpose — $id", (domain) => {
  it("PROPERTY_REUSE_01 — a different purpose cannot reuse the same fresh owner result as equivalent", () => {
    const project = makeProject(domain);
    const before = structuredClone(project);
    const question = dispatch(project);
    const proposal = dispatch(project, "ASSISTED_PROPOSAL", question, "proposal");
    expect(proposal.interaction.ownerResultRef).not.toBe(question.interaction.ownerResultRef);
    expect(proposal.ownerResultLedger.entries).toHaveLength(question.ownerResultLedger.entries.length + 1);
    expect(proposal.presentation.candidates.length).toBeGreaterThan(0);
    expect(proposal.presentation.candidates.every((candidate) => candidate.kind === "HYPOTHESIS")).toBe(true);
    expect(proposal.presentation.plainText).not.toBe(question.presentation.plainText);
    for (const term of [domain.firstArm, domain.secondArm, domain.endpoint]) expect(proposal.presentation.plainText).toContain(term);
    const unknown = buildProjectContextSnapshot({ project }).objects.find((object) => object.epistemicState === "UNKNOWN" && object.content === domain.unknown);
    expect(unknown).toBeDefined();
    for (const candidate of proposal.output.hypotheses) expect(candidate.unknowns).toContain(`UNKNOWN_PROJECT_OBJECT:${unknown!.stableId}`);
    expect(proposal.presentation.plainText).toMatch(/candidate|proposition/iu);
    expect(proposal.presentation.plainText).toMatch(/limite|préciser/iu);
    expect(proposal.presentation.plainText).toContain(domain.unknown);
    expect(project).toEqual(before);
    assertCandidateBoundary(proposal, project);
  });

  it("PROPERTY_REUSE_02 — semantically equivalent requests retain compatible owner reuse", () => {
    const project = makeProject(domain);
    const first = dispatch(project, "ASSISTED_PROPOSAL");
    let current = first;
    for (const [index, raw] of EQUIVALENT_PROPOSAL_REQUESTS.entries()) {
      expect(classify(raw)?.kind, raw).toBe("USER_REQUESTS_ASSISTED_PROPOSAL");
      expect(resolveScientificThinkingConversation({ raw, output: current.output }).kind, raw).toBe("FALLTHROUGH");
      current = dispatch(project, "ASSISTED_PROPOSAL", current, `equivalent-${index}`);
      expect(current.interaction.ownerResultRef).toBe(first.interaction.ownerResultRef);
      expect(current.ownerResultLedger.entries).toHaveLength(first.ownerResultLedger.entries.length);
      assertCandidateBoundary(current, project);
    }
  });

  it("PROPERTY_REUSE_03 — a genuinely confirmed Project change invalidates the dependent result", () => {
    const project = makeProject(domain);
    const before = structuredClone(project);
    const first = dispatch(project, "ASSISTED_PROPOSAL");
    const userTurn = behaviorTurn(`turn:proposal-purpose:${domain.id}:change`, "Les observations seront recueillies après six mois.");
    const contribution = behaviorContribution({
      contributionId: `contribution:proposal-purpose:${domain.id}:change`, turns: [userTurn],
      temporalElements: [behaviorItem({
        itemId: `timepoint:proposal-purpose:${domain.id}`, proposedType: "TIMEPOINT",
        content: "Observations après six mois", turnId: userTurn.turnId,
      })],
    });
    const changed = confirmResearchProjectContribution({
      contribution, current: project, projectId: project.projectId,
      authority: behaviorAuthority, confirmedAt: "2026-09-14T20:01:00.000Z",
    });
    expect(changed.revision).toBe(project.revision + 1);
    expect(changed.projectDigest).not.toBe(project.projectDigest);
    expect(scientificThinkingInteractionMatchesCurrentProject(first.interaction, changed)).toBe(false);
    const next = dispatch(changed, "ASSISTED_PROPOSAL", first, "changed-project");
    expect(next.interaction.ownerResultRef).not.toBe(first.interaction.ownerResultRef);
    expect(next.ownerResultLedger.entries).toHaveLength(first.ownerResultLedger.entries.length + 1);
    expect(next.presentation.candidates.length).toBeGreaterThan(0);
    expect(next.output.sourceProject?.projectDigest).toBe(changed.projectDigest);
    expect(project).toEqual(before);
    assertCandidateBoundary(next, changed);
  });

  it("PROPERTY_REUSE_04 — requesting, discussing, refusing and selecting proposals never adopts Project", () => {
    const project = makeProject(domain);
    const before = structuredClone(project);
    const snapshotBefore = buildProjectContextSnapshot({ project });
    const proposal = dispatch(project, "ASSISTED_PROPOSAL");
    for (const raw of ["Pourquoi ces hypothèses ?", "Quelle est la différence entre ces hypothèses ?"]) {
      expect(resolveScientificThinkingConversation({ raw, output: proposal.output }).kind).toBe("DISCUSS");
      expect(classify(raw)?.kind).not.toBe("USER_REQUESTS_ASSISTED_PROPOSAL");
    }
    expect(resolveScientificThinkingConversation({ raw: "Je ne sais pas encore", output: proposal.output }).kind).toBe("DEFER");
    const selected = resolveScientificThinkingConversation({ raw: "Je choisis l'hypothèse 1", output: proposal.output });
    expect(selected.kind).toBe("SELECT_CANDIDATE");
    if (selected.kind !== "SELECT_CANDIDATE") throw new Error("CANDIDATE_SELECTION_REQUIRED");
    const selectionTurn = behaviorTurn("turn:proposal-purpose:select", "Je choisis l'hypothèse 1");
    const selection = buildScientificThinkingSelectionContribution({
      conversationId: "conversation:proposal-purpose", project, output: proposal.output,
      candidateRef: selected.candidateRef,
      proposalTurn: { ...behaviorTurn(proposal.interaction.presentationTurnRef, proposal.presentation.plainText), role: "NOXIA" },
      selectionTurn, createdAt: AT,
    });
    const pending = prepareResearchProjectContributionCandidate(selection, project);
    expect(pending.status).toBe("CANDIDATE_PENDING_HUMAN_CONFIRMATION");
    expect(classify("je refuse", {
      ...NO_REFERENT, resolution: "UNIQUE_CURRENT", candidateRef: selection.identity.contributionId,
      sourceTurnRef: selectionTurn.turnId, sourceDigest: logicalDigest(selectionTurn.content),
    })?.kind).toBe("USER_REFUSES_CURRENT_CANDIDATE");
    expect(resolveScientificThinkingConversation({ raw: "Je ne retiens pas l'hypothèse 1", output: proposal.output }).kind).not.toBe("SELECT_CANDIDATE");
    expect(buildProjectContextSnapshot({ project })).toEqual(snapshotBefore);
    expect(project).toEqual(before);
    assertCandidateBoundary(proposal, project);
  });

  it("PROPERTY_REUSE_05 — repeated requests return a bounded exhaustion explanation without invented novelty", () => {
    const project = makeProject(domain);
    const before = structuredClone(project);
    const first = dispatch(project, "ASSISTED_PROPOSAL", undefined, "initial-proposals");
    const repeat = dispatch(project, "ASSISTED_PROPOSAL", first, "more-proposals");
    expect(repeat.output).toEqual(first.output);
    expect(repeat.presentation.candidates).toHaveLength(0);
    expect(repeat.presentation.plainText).not.toBe(first.presentation.plainText);
    expect(repeat.presentation.plainText).toMatch(/(?:pas|aucune|permettent pas).{0,80}(?:supplémentaire|défendable)/iu);
    expect(repeat.presentation.plainText).toMatch(/éléments.*disponibles|inconnues|connaissances/iu);
    expect(repeat.presentation.plainText).toMatch(/ne signifie pas que toutes les possibilités/iu);
    expect(repeat.presentation.plainText).toContain(domain.unknown);
    expect(repeat.interaction.presentationTurnRef).toBe(first.interaction.presentationTurnRef);
    const third = dispatch(project, "ASSISTED_PROPOSAL", repeat, "more-again");
    expect(third.presentation.candidates).toHaveLength(0);
    expect(third.ownerResultLedger.entries).toHaveLength(first.ownerResultLedger.entries.length);
    expect(project).toEqual(before);
    assertCandidateBoundary(repeat, project);
  });

  it("keeps objective links valid when already represented hypotheses are filtered from new proposals", () => {
    const project = makeProject(domain);
    const input = buildScientificThinkingInputFromProjectSnapshot({
      projectSnapshot: buildProjectContextSnapshot({ project }), projectRevision: project.revision,
      purpose: "Proposer des hypothèses scientifiques candidates et des alternatives à discuter sans adoption.",
      requestedOperation: "GENERATE_ALTERNATIVE_HYPOTHESIS",
    });
    const first = executeScientificThinkingEngine(input);
    expect(first.hypotheses).toHaveLength(2);
    for (const existing of [first.hypotheses.slice(0, 1), first.hypotheses]) {
      const next = executeScientificThinkingEngine({ ...input, existingHypotheses: existing.map((hypothesis) => hypothesis.text) });
      expect(next.hypotheses).toHaveLength(first.hypotheses.length - existing.length);
      expect(next.objectives.length).toBeGreaterThan(0);
      const availableHypothesisIds = new Set(next.hypotheses.map((hypothesis) => hypothesis.hypothesisId));
      for (const objective of next.objectives) {
        for (const ref of objective.linkedHypothesisIds) expect(availableHypothesisIds.has(ref), ref).toBe(true);
      }
      expect(next.candidateIsAdopted).toBe(false);
      expect(next.projectWriteAuthorized).toBe(false);
    }
  });

  it.each([false, true])("bounds a non-comparative request without recycling confirmed hypotheses (existing=%s)", (hasExistingHypothesis) => {
    const project = makeProject(domain);
    const projectBefore = structuredClone(project);
    const input = {
      ...buildScientificThinkingInputFromProjectSnapshot({
        projectSnapshot: buildProjectContextSnapshot({ project }), projectRevision: project.revision,
        requestedOperation: "GENERATE_ALTERNATIVE_HYPOTHESIS",
        purpose: "Proposer des hypothèses scientifiques supplémentaires à discuter.",
      }),
      relations: [],
      existingHypotheses: hasExistingHypothesis
        ? [`La variation de « ${domain.endpoint} » dépend des conditions de mesure.`] : [],
    };
    const inputBefore = structuredClone(input);
    const prior = executeScientificThinkingEngine({ ...input, requestedOperation: undefined });
    if (hasExistingHypothesis) expect(prior.hypotheses.map((hypothesis) => hypothesis.text)).toEqual(input.existingHypotheses);
    const output = executeScientificThinkingEngine(input);
    const presentation = buildStandardScientificThinkingPresentation(output, {
      requestedOperation: input.requestedOperation, projectUnknowns: input.projectUnknowns,
    });
    expect(output.hypotheses).toHaveLength(0);
    expect(presentation.candidates).toHaveLength(0);
    expect(presentation.plainText).toMatch(/(?:ne peux pas|aucune).{0,100}(?:supplémentaire|justification|défendable)/iu);
    expect(presentation.plainText).toMatch(/éléments examinés|éléments disponibles|inconnues/iu);
    expect(presentation.plainText).toMatch(/ne signifie pas que toutes les possibilités/iu);
    expect(presentation.plainText).toContain(domain.unknown);
    expect(presentation.plainText).not.toBe(buildStandardScientificThinkingPresentation(prior).plainText);
    expect(output.unknowns).toEqual(expect.arrayContaining(input.missingInformation));
    expect(output.candidateIsAdopted).toBe(false);
    expect(output.projectWriteAuthorized).toBe(false);
    expect(input).toEqual(inputBefore);
    expect(project).toEqual(projectBefore);
  });

  it("preserves the last selectable proposals across an empty alternative result, until Project changes", () => {
    const project = makeProject(domain, false);
    const before = structuredClone(project);
    const ordinary = dispatch(project, undefined, undefined, "ordinary-visible-proposals");
    expect(ordinary.presentation.candidates.filter((candidate) => candidate.kind === "HYPOTHESIS").length).toBeGreaterThan(0);
    const alternative = dispatch(project, "ASSISTED_PROPOSAL", ordinary, "no-additional-options");
    expect(alternative.output.hypotheses).toHaveLength(0);
    expect(alternative.presentation.candidates).toHaveLength(0);
    expect(alternative.ownerResultLedger.entries).toHaveLength(ordinary.ownerResultLedger.entries.length + 1);
    expect(alternative.interaction.ownerResultRef).not.toBe(ordinary.interaction.ownerResultRef);
    expect(alternative.interaction.selectionAnchor).toEqual({
      ownerResultRef: ordinary.interaction.ownerResultRef,
      presentationTurnRef: ordinary.interaction.presentationTurnRef,
      traceRunId: ordinary.interaction.traceRunId,
    });
    const anchored = readScientificThinkingOutputFromLedger({
      ledger: alternative.ownerResultLedger,
      resultRef: alternative.interaction.selectionAnchor!.ownerResultRef,
    });
    expect(anchored).toEqual(ordinary.output);
    const selection = resolveScientificThinkingConversation({ raw: "Je choisis l’hypothèse 1", output: anchored! });
    expect(selection.kind).toBe("SELECT_CANDIDATE");
    if (selection.kind !== "SELECT_CANDIDATE") throw new Error("PRESERVED_CANDIDATE_SELECTION_REQUIRED");
    const contribution = buildScientificThinkingSelectionContribution({
      conversationId: "conversation:proposal-purpose:anchor", project, output: anchored!,
      candidateRef: selection.candidateRef,
      proposalTurn: { ...behaviorTurn(alternative.interaction.selectionAnchor!.presentationTurnRef, ordinary.presentation.plainText), role: "NOXIA" },
      selectionTurn: behaviorTurn("turn:proposal-purpose:anchored-selection", "Je choisis l’hypothèse 1"), createdAt: AT,
    });
    expect(prepareResearchProjectContributionCandidate(contribution, project).status).toBe("CANDIDATE_PENDING_HUMAN_CONFIRMATION");
    const repeated = dispatch(project, "ASSISTED_PROPOSAL", alternative, "still-no-additional-options");
    expect(repeated.interaction.ownerResultRef).toBe(alternative.interaction.ownerResultRef);
    expect(repeated.ownerResultLedger.entries).toHaveLength(alternative.ownerResultLedger.entries.length);
    expect(repeated.interaction.selectionAnchor).toEqual(alternative.interaction.selectionAnchor);

    const userTurn = behaviorTurn(`turn:proposal-purpose:${domain.id}:anchor-change`, "Les observations seront recueillies après six mois.");
    const changed = confirmResearchProjectContribution({
      contribution: behaviorContribution({
        contributionId: `contribution:proposal-purpose:${domain.id}:anchor-change`, turns: [userTurn],
        temporalElements: [behaviorItem({
          itemId: `timepoint:proposal-purpose:${domain.id}:anchor-change`, proposedType: "TIMEPOINT",
          content: "Observations après six mois", turnId: userTurn.turnId,
        })],
      }),
      current: project, projectId: project.projectId,
      authority: behaviorAuthority, confirmedAt: "2026-09-14T20:01:00.000Z",
    });
    const next = dispatch(changed, "ASSISTED_PROPOSAL", repeated, "changed-project-no-anchor");
    expect(next.interaction.selectionAnchor).toBeUndefined();
    expect(scientificThinkingInteractionMatchesCurrentProject(repeated.interaction, changed)).toBe(false);
    expect(next.interaction.sourceProjectDigest).toBe(changed.projectDigest);
    expect(project).toEqual(before);
  });
});

describe("Scientific proposal act boundaries", () => {
  it.each([
    "Ne me propose pas d'alternatives.",
    "Je ne veux pas de propositions.",
    "Aucune proposition pour le moment.",
    "Propose-moi pas de nouvelles options.",
    "Propose-moi aucune alternative.",
    "Notre hypothèse est que les exercices espacés améliorent la lecture.",
    "Quelle est la question scientifique actuelle ?",
    "Par exemple, propose-moi des alternatives serait une formulation possible.",
    "La phrase « propose-moi des options » est seulement un exemple.",
    "Si nécessaire, propose-moi plusieurs options.",
    "Je propose une hypothèse à examiner, sans demander de nouvelles options.",
  ])("does not reinterpret refusal, stated hypotheses or factual questions as proposals: %s", (raw) => {
    expect(classify(raw)?.kind).not.toBe("USER_REQUESTS_ASSISTED_PROPOSAL");
  });

  it("preserves the existing explanation act", () => {
    expect(classify("Explique ces alternatives")?.kind).toBe("EXPLAIN_REFERENCED_CONTENT");
  });

  it("leaves a question about adopted options to QRY rather than an unadopted owner result", () => {
    const raw = "Quelles options sont déjà adoptées dans le projet ?";
    const proposal = dispatch(makeProject(DOMAINS[0]), "ASSISTED_PROPOSAL");
    expect(classify(raw)?.kind).not.toBe("USER_REQUESTS_ASSISTED_PROPOSAL");
    expect(resolveScientificThinkingConversation({ raw, output: proposal.output }).kind).toBe("FALLTHROUGH");
  });

  it("does not let an active owner consume declarative corrections or unrelated explanations", () => {
    const proposal = dispatch(makeProject(DOMAINS[0]), "ASSISTED_PROPOSAL");
    for (const raw of [
      "La différence sera exprimée dans une autre unité. Je soumets cette correction.",
      "Je voudrais changer la mesure ; l'incertitude sur les autres éléments demeure.",
      "Le suivi passe à neuf mois ; je ne sais pas encore quel sera l'effectif.",
      "Explique le principe mathématique de la corrélation.",
      "Pourquoi la corrélation ne suffit-elle pas à établir une causalité ?",
      "Nous prévoyons cinq ateliers. Pourquoi ces hypothèses ?",
      "Pourquoi le modèle linéaire impose-t-il une relation additive ?",
      "Nous prévoyons cinq ateliers, pourquoi ces hypothèses ?",
      "Pourquoi ces hypothèses, les observations couvriront cinq ateliers ?",
    ]) expect(resolveScientificThinkingConversation({ raw, output: proposal.output }), raw).toEqual({ kind: "FALLTHROUGH" });
    for (const raw of [
      "Je choisis pas l'hypothèse 1.",
      "Si elle est confirmée, je choisis l'hypothèse 1.",
      "Par exemple, je choisis l'hypothèse 1.",
      "Je préfère comprendre l'hypothèse 1 avant de choisir.",
      "Je choisis l'hypothèse 1 ?",
      "La citation est « je choisis la première hypothèse ».",
      "La formule est 'je choisis la première hypothèse'.",
      "Il disait que je choisis la première hypothèse.",
      "Je choisis la première hypothèse et la première question.",
      "Je choisis la première hypothèse et la deuxième hypothèse.",
      "Je choisis la première hypothèse et les observations couvriront cinq ateliers.",
    ]) expect(resolveScientificThinkingConversation({ raw, output: proposal.output }).kind, raw).not.toBe("SELECT_CANDIDATE");
    expect(resolveScientificThinkingConversation({ raw: "Pourquoi ces hypothèses ?", output: proposal.output }).kind).toBe("DISCUSS");
  });
});
