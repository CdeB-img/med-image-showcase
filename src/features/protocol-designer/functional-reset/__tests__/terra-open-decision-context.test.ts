import { describe, expect, it } from "vitest";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { prepareTerraConversation } from "@/features/scientific-thinking/scientific-collaborator-conversation";
import { type StudyProposalAtom, type StudyProposalComposition } from "@/features/scientific-thinking/contextual-study-proposal";
import { confirmResearchProjectContribution, prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import { buildFunctionalResetQueryNavigation } from "@/features/query-navigation/functional-reset-progression";
import { currentGovernedNavigationInput } from "@/features/query-navigation/current-navigation-evidence";
import { type ProductBridgeRequest } from "../../product-bridge";
import { type ConversationContextPacketPreflight } from "../../provider-call-observability";
import { controlledStudyProposal } from "./study-proposal-fixtures";
import { createFunctionalResetSession } from "../session";
import * as proposalOwner from "../study-proposal-standard";
import { buildScientificDiscussionContext } from "../contribution-discussion-context";
import { retainScientificDiscussionResult } from "../contribution-discussion-retention";

// CURRENT_SEMANTIC_INVARIANT / SYNTHETIC_CURRENT_CONTRACT.
// Sanitized ECV science, not an archival copy of the private human run.
// Its observed envelope is 71 atoms, 36 adopted objects, 21 relations,
// 4 arbitrations, 34 OPEN_DECISION atoms and a substantial post-adoption turn.
const at = "2026-10-06T09:15:06.474Z";
const openDetails = [
  "Définition opérationnelle complète du volontaire sain", "Seuil d'éligibilité de pression artérielle",
  "Procédure de confirmation d'une pression élevée", "Paramètre biologique pour le dépistage du diabète",
  "Seuil biologique d'exclusion du diabète", "Éligibilité des anciens fumeurs",
  "Questionnaire d'antécédents cardiovasculaires", "Liste des traitements incompatibles avec l'étude",
  "Mesure quantitative de l'activité sportive", "Recrutement par décennie d'âge",
  "Équilibre femmes-hommes du recrutement", "Effectif et dimensionnement",
  "Produit de contraste", "Dose du produit de contraste", "Délai après injection",
  "Séquence de cartographie T1", "Paramètres de reconstruction T1", "Positionnement des cinq coupes",
  "Segmentation myocardique", "Gestion des artéfacts et du volume partiel",
  "Agrégation des cinq coupes en ECV global", "Définition des régions myocardiques",
  "Méthode analytique de mesure de l'hématocrite", "Contrôle qualité de la centrifugation",
  "Motifs de non-évaluabilité de l'ECV", "Codage des données manquantes",
  "Modèle statistique final", "Relation non linéaire âge–ECV", "Ajustements du modèle",
  "Corrélation intra-participant des mesures régionales", "Gestion statistique des données manquantes",
  "Escalade clinique en cas d'anomalie", "Procédures de surveillance", "Organisation institutionnelle et réglementaire",
];
const handsOnShape = () => {
  const session = createFunctionalResetSession(at);
  const proposal = controlledStudyProposal("hands-on-memory-2");
  const selected = proposal.atoms.filter(a => a.status !== "OPEN_DECISION").slice(0, 36);
  for (const [index, atom] of selected.entries()) {
    atom.content += " Choix du projet de qualification ; les détails inconnus ne sont pas fixés.";
    atom.rationale = "La revue humaine confirme ce choix dans sa portée ; une qualification locale ne devient pas une règle scientifique générale.";
    atom.dependsOn = index > 0 && index <= 21 ? [selected[index - 1].ref] : [];
    atom.dependencyQualifications = atom.dependsOn.map(ref => ({ ref, kind: "HARD_BLOCKING_DEPENDENCY",
      rationale: "La relation conserve la dépendance déclarée entre les décisions de ce protocole ; les détails opérationnels restent ouverts et ne sont ni inférés ni adoptés avec cette liaison." }));
  }
  const pending = { ...selected[0], ref: "pending-method", semanticKey: "pending-method", targetType: "PROJECT_INFORMATION" as const,
    content: "Proposition d'un contrôle indépendant de qualité des acquisitions ECV, non confirmée par le chercheur.", dependsOn: [], dependencyQualifications: [] };
  const opens = openDetails.map((detail, index) => ({ ...selected[0], ref: `open-${index}`, semanticKey: `open-${index}`,
    targetType: "PROJECT_INFORMATION" as const, owner: "IMAGING" as const, area: "MEASUREMENTS" as const,
    status: "OPEN_DECISION" as const,
    content: `${detail} reste à préciser. Les conditions du recueil et les motifs de non-évaluabilité doivent être distingués de la mesure ; aucune valeur par défaut n'est adoptée.`,
    rationale: "Cette condition scientifique reste ouverte après la confirmation des autres choix ; son périmètre et ses liens restent actifs.",
    dependsOn: [selected[index % 36].ref],
    dependencyQualifications: [selected[index % 36].ref].map(ref => ({ ref, kind: "SOFT_REFINEMENT_DEPENDENCY" as const,
      rationale: "Cette précision complète la décision représentée sans la remplacer. Son absence ne permet pas d'inventer une méthode, de transformer une hypothèse en choix adopté ou d'effacer l'incertitude encore active." })),
  }));
  proposal.atoms = [...selected, pending, ...opens];
  proposal.arbitrations = Array.from({ length: 4 }, (_, index) => ({ ...proposal.arbitrations[0], ref: `arb-open-${index}`,
    options: proposal.arbitrations[0].options.slice(0, 2).map((option, i) => ({ ...option, ref: `opt-open-${index}-${i}`, atomRefs: [opens[index * 2 + i].ref] })),
    recommendedRefs: [] }));
  proposal.dimensioningScenarios = [];
  const digest = logicalDigest({ proposal, sourceProject: null, sourceTurnRef: "source", sourceResponseRef: "response" });
  const initial: StudyProposalComposition = { proposalRef: `scientific-study-proposal:${digest}`, digest, proposal,
    sourceTurnRef: "source", sourceResponseRef: "response", sourceProject: null, originalSourceProject: null,
    revision: 1, adoptedAtomRefs: [], unavailableOptionRefs: [], state: "CURRENT", dimensioning: [], ownerReceipts: [] };
  const source = { turnId: "source", role: "USER" as const, content: "Étudier l'association âge–ECV en France chez des volontaires adultes sains, sans rémunération ; une IRM cardiaque par participant. Exclure les pathologies influençant l'ECV et caractériser l'activité sportive.", createdAt: at };
  const response = { turnId: "response", role: "NOXIA" as const, content: proposal.reply, createdAt: at };
  const confirmation = { turnId: "confirmation", role: "USER" as const, content: "Je confirme les choix de cette revue pour le projet de qualification ; les inconnues restent ouvertes.", createdAt: at };
  const contribution = proposalOwner.buildStudyProposalSelectionContribution({ composition: initial,
    selectedAtomRefs: selected.map(a => a.ref), selectedOptionRefs: [], project: null, projectId: session.projectId,
    conversationId: session.conversationId, proposalTurn: response, selectionTurn: confirmation, createdAt: at });
  const candidate = prepareResearchProjectContributionCandidate(contribution, null);
  const project = confirmResearchProjectContribution({ contribution, current: null, projectId: session.projectId,
    authority: session.projectAuthority, confirmedAt: at, reviewedProjection: candidate.humanReviewProjection,
    selectedChangeRefs: candidate.humanReviewProjection.coveredChangeRefs });
  const composition = proposalOwner.propagateStudyProposalDecision(initial, project, candidate, null, selected.map(a => a.ref), [], confirmation, contribution);
  const request: ProductBridgeRequest = { apiVersion: "1.0.0", evaluatePersistentDelta: false, currentProject: project,
    studyProposalContext: composition, conversation: { conversationId: session.conversationId, language: "fr", turns: [source, response, confirmation,
      { turnId: "receipt", role: "NOXIA", content: "Choix enregistrés ; aucune inconnue n'a été fermée.", createdAt: at },
      { turnId: "follow-up", role: "USER", content: "Étude monocentrique, 20–89 ans par décennies. Pression artérielle à l'IRM, biologie avant l'IRM pour le diabète, antécédents cardiovasculaires par questionnaire. Hématocrite avant injection sur le cathéter, centrifugation immédiate par le radiologue. Cinq coupes identiques pré/post couvrant le ventricule gauche ; prendre en compte le sexe et une escalade clinique si nécessaire.", createdAt: at }] },
    currentNavigation: currentGovernedNavigationInput({ project, navigation: buildFunctionalResetQueryNavigation({ project, recordedAt: at }) }) };
  return { request, composition, initial, project, candidate, opens };
};
const bytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).length;
const smallInitial = () => {
  const proposal = controlledStudyProposal("small-open-context");
  proposal.dimensioningScenarios = [];
  const digest = logicalDigest({ proposal, sourceProject: null, sourceTurnRef: "source", sourceResponseRef: "response" });
  return { proposalRef: `scientific-study-proposal:${digest}`, digest, proposal, sourceTurnRef: "source", sourceResponseRef: "response",
    sourceProject: null, originalSourceProject: null, revision: 1, adoptedAtomRefs: [], unavailableOptionRefs: [], state: "CURRENT",
    dimensioning: [], ownerReceipts: [] } satisfies StudyProposalComposition;
};

describe("Terra single semantic representation of active open decisions", () => {
  it("continues the real hands-on V1 / confirmed Review / 34 open decisions / second-message envelope", () => {
    const { request, composition, project, candidate, opens } = handsOnShape();
    const before = logicalDigest({ request, composition, project });
    expect(composition.proposal.atoms).toHaveLength(71);
    expect(composition.adoptedAtomRefs).toHaveLength(36);
    expect(project.canonicalState!.objects.filter(o => o.actuality === "CURRENT")).toHaveLength(36);
    expect(project.canonicalState!.relations.filter(r => r.actuality === "CURRENT")).toHaveLength(21);
    expect(candidate.humanReviewProjection.status).toBe("COMPLETE");
    expect(project.confirmationDecision.status).toBe("ADOPTED");
    let measurement: ConversationContextPacketPreflight | undefined;
    const packet = JSON.parse(prepareTerraConversation(request, true, m => { measurement = m; }).context);
    const originalFields = { ...packet };
    delete originalFields.workingOpenDecisionReferenceBasis;
    const previous = { ...originalFields, OPEN_DECISIONS: opens.map(a => ({ source: "WORKING_DRAFT_NOT_ADOPTED", ref: a.ref,
      content: a.content, owner: a.owner, dependsOn: a.dependsOn, dependencyQualifications: a.dependencyQualifications })) };
    expect(bytes(previous)).toBeGreaterThan(80000);
    expect(measurement!.packetTotalBytes).toBeLessThan(80000);
    expect(packet.OPEN_DECISIONS).toEqual(opens.map(a => ({ source: "WORKING_DRAFT_NOT_ADOPTED", ref: a.ref })));
    expect(packet.WORKING_STUDY_PROPOSAL.atoms.filter((a: StudyProposalAtom) => a.status === "OPEN_DECISION")).toEqual(opens);
    expect(packet.WORKING_STUDY_PROPOSAL.adoptedAtomContext.rows).toHaveLength(36);
    expect(packet.WORKING_STUDY_PROPOSAL.atoms.filter((a: StudyProposalAtom) => composition.adoptedAtomRefs.includes(a.ref))).toHaveLength(0);
    expect(logicalDigest({ request, composition, project })).toBe(before);
    console.info("HANDS_ON_OPEN_DECISION_BYTES=" + JSON.stringify({ before: bytes(previous), after: measurement!.packetTotalBytes, openBefore: opens.length, openAfter: packet.OPEN_DECISIONS.length }));
  });

  it("keeps full not-yet-confirmed Review science accessible through the native atom refs", () => {
    const { request, initial, opens } = handsOnShape();
    const view = proposalOwner.projectStudyProposalConversationContext(initial, null);
    // The complete pending snapshot can exceed the conversation gate; projection
    // semantics are checked directly, never by raising or bypassing that gate.
    expect(view.atoms).toEqual(initial.proposal.atoms);
    expect(view.arbitrations).toEqual(initial.proposal.arbitrations);
    expect(view.atoms.filter(a => a.status === "OPEN_DECISION")).toEqual(opens);
    expect(view.adoptedAtomContext).toBeUndefined();
    expect(request.currentProject!.confirmationDecision.status).toBe("ADOPTED");
    const pending = smallInitial();
    const packet = JSON.parse(prepareTerraConversation({ ...request, currentProject: null, currentNavigation: undefined, studyProposalContext: pending }, true).context);
    expect(packet.WORKING_STUDY_PROPOSAL.atoms).toEqual(pending.proposal.atoms);
    expect(packet.WORKING_STUDY_PROPOSAL.adoptedAtomContext).toBeUndefined();
    for (const index of packet.OPEN_DECISIONS) {
      expect(packet.WORKING_STUDY_PROPOSAL.atoms.find((a: StudyProposalAtom) => a.ref === index.ref)).toEqual(pending.proposal.atoms.find(a => a.ref === index.ref));
    }
  });

  it("emits no stale open index when all proposal unknowns have been explicitly resolved", () => {
    const { request, initial } = handsOnShape();
    const settled = { ...initial, proposal: controlledStudyProposal("settled-open-index") };
    settled.proposal.atoms.filter(a => a.status === "OPEN_DECISION").forEach(a => {
      a.status = "NOXIA_PROPOSAL";
      a.content = "Bornes explicitement fixées dans cette variante synthétique : adultes de 20 à 89 ans, inclusivement.";
    });
    const digest = logicalDigest({ proposal: settled.proposal, sourceProject: null, sourceTurnRef: settled.sourceTurnRef, sourceResponseRef: settled.sourceResponseRef });
    settled.proposalRef = `scientific-study-proposal:${digest}`;
    settled.digest = digest;
    const packet = JSON.parse(prepareTerraConversation({ ...request, currentProject: null, currentNavigation: undefined, studyProposalContext: settled }, true).context);
    expect(packet.WORKING_STUDY_PROPOSAL.atoms).toEqual(settled.proposal.atoms);
    expect(packet.OPEN_DECISIONS).toEqual([]);
  });

  it("does not resurrect a stale proposal through the open-decision index", () => {
    const { request, composition } = handsOnShape();
    const packet = JSON.parse(prepareTerraConversation({ ...request, studyProposalContext: { ...composition, state: "STALE" } }, true).context);
    expect(packet.WORKING_STUDY_PROPOSAL).toBeUndefined();
    expect(packet.OPEN_DECISIONS).toEqual([]);
  });

  it("does not index an explicitly rejected proposal unknown as active; keeps its native disposition", () => {
    const { request, project, composition, opens } = handsOnShape();
    const before = logicalDigest(project);
    const rejected = proposalOwner.projectStudyProposalDisposition(composition,
      { ...project.confirmationDecision, decisionId: "explicit-open-decision-rejection", status: "REJECTED", targets: [opens[0].ref] },
      [opens[0].ref], []);
    const packet = JSON.parse(prepareTerraConversation({ ...request, studyProposalContext: rejected }, true).context);
    expect(packet.OPEN_DECISIONS).toHaveLength(33);
    expect(packet.OPEN_DECISIONS.some((index: { ref: string }) => index.ref === opens[0].ref)).toBe(false);
    expect(packet.WORKING_STUDY_PROPOSAL.dispositions).toEqual(rejected.dispositions);
    // Immutable snapshot/provenance is not rewritten or falsely settled by projection.
    expect(rejected.proposal).toEqual(composition.proposal);
    expect(logicalDigest(project)).toBe(before);
  });

  it("keeps one full semantic copy when an open atom is also reachable through the open index", () => {
    const { request } = handsOnShape(), composition = smallInitial();
    const open = composition.proposal.atoms.find(a => a.status === "OPEN_DECISION")!;
    open.content = "Durée de repos précédant la cartographie T1 non fixée.";
    const digest = logicalDigest({ proposal: composition.proposal, sourceProject: null, sourceTurnRef: "source", sourceResponseRef: "response" });
    composition.proposalRef = `scientific-study-proposal:${digest}`;
    composition.digest = digest;
    const prepared = prepareTerraConversation({ ...request, currentProject: null, currentNavigation: undefined, studyProposalContext: composition }, true);
    const packet = JSON.parse(prepared.context);
    expect(prepared.context.split(JSON.stringify(open.content))).toHaveLength(2);
    expect(packet.OPEN_DECISIONS.filter((i: { ref: string }) => i.ref === open.ref)).toEqual([{ source: "WORKING_DRAFT_NOT_ADOPTED", ref: open.ref }]);
    expect(packet.WORKING_STUDY_PROPOSAL.atoms.find((a: StudyProposalAtom) => a.ref === open.ref)).toEqual(open);
  });

  it.each(["REJECTED", "SUPERSEDED"] as const)("does not resurrect %s retained meaning or lose another active unknown", status => {
    const { request, project } = handsOnShape();
    const user1 = { turnId: "u1", role: "USER" as const, content: "Délai post-injection encore à choisir.", createdAt: at };
    const assistant1 = { turnId: "a1", role: "NOXIA" as const, content: "Le délai n'est pas adopté.", createdAt: at };
    const noMeaning = { coverage: "COMPLETE" as const, nonPersistentReason: "NO_SCIENTIFIC_MEANING" as const, elements: [] };
    const meaning = (id: string, content: string) => ({ id, content, epistemicState: "OPEN_UNKNOWN" as const, polarity: "CONDITIONAL" as const, conditions: [], linkedIds: [] });
    const first = retainScientificDiscussionResult({ conversationId: request.conversation.conversationId, runtimeTurns: [user1, assistant1],
      userTurn: user1, assistantTurn: assistant1, retained: [], result: { reply: assistant1.content,
        userContribution: { coverage: "COMPLETE", nonPersistentReason: null, elements: [meaning("old", user1.content)] },
        assistantContribution: noMeaning, dispositions: [], candidateBindings: [] } });
    const user2 = { turnId: "u2", role: "USER" as const, content: "J'écarte ce point ; la méthode de segmentation reste à définir.", createdAt: at };
    const assistant2 = { turnId: "a2", role: "NOXIA" as const, content: "La segmentation reste ouverte.", createdAt: at };
    const turns = [user1, assistant1, user2, assistant2];
    const state = retainScientificDiscussionResult({ state: first, conversationId: request.conversation.conversationId, runtimeTurns: turns,
      userTurn: user2, assistantTurn: assistant2, retained: [], result: { reply: assistant2.content,
        userContribution: { coverage: "COMPLETE", nonPersistentReason: null, elements: [meaning("segmentation", "Méthode de segmentation non définie.")] },
        assistantContribution: noMeaning, dispositions: [{ elementRef: first.elements[0].ref, status,
          replacementId: status === "SUPERSEDED" ? "segmentation" : null, explicitUserDirection: true }], candidateBindings: [] } });
    const discussion = buildScientificDiscussionContext({ retention: state, retained: [], currentProject: project,
      conversationId: request.conversation.conversationId, runtimeTurns: turns });
    const packet = JSON.parse(prepareTerraConversation({ ...request, studyProposalContext: null,
      conversation: { ...request.conversation, turns }, scientificDiscussionContext: discussion }, true).context);
    expect(packet.CURRENT_DISCUSSION.retainedMeaning).toHaveLength(1);
    expect(packet.CURRENT_DISCUSSION.retainedMeaning[0].content).toBe("Méthode de segmentation non définie.");
    expect(packet.OPEN_DECISIONS).toEqual(discussion.unresolved);
    expect(packet.WORKING_STUDY_PROPOSAL).toBeUndefined();
  });

  it("keeps referential ambiguity distinct from a scientific atom and never coalesces science by sourceRef", () => {
    const { request } = handsOnShape(), composition = smallInitial();
    request.conversation.turns = [{ turnId: "ambiguous-user", role: "USER", content: "Je choisis la deuxième option.", createdAt: at }];
    const discussion = buildScientificDiscussionContext({ retained: [], currentProject: null,
      conversationId: request.conversation.conversationId, runtimeTurns: request.conversation.turns });
    expect(discussion.unresolved).toHaveLength(1);
    const packet = JSON.parse(prepareTerraConversation({ ...request, currentProject: null, currentNavigation: undefined,
      studyProposalContext: composition, scientificDiscussionContext: discussion }, true).context);
    expect(packet.OPEN_DECISIONS).toContainEqual(discussion.unresolved[0]);
    const atom = composition.proposal.atoms.find(a => a.status === "OPEN_DECISION")!;
    expect(packet.OPEN_DECISIONS).toContainEqual({ source: "WORKING_DRAFT_NOT_ADOPTED", ref: atom.ref });
    expect(packet.WORKING_STUDY_PROPOSAL.atoms.find((a: StudyProposalAtom) => a.ref === atom.ref)).toEqual(atom);
  });
});
