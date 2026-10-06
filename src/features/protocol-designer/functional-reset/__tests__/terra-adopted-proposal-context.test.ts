import { afterEach, describe, expect, it, vi } from "vitest";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { prepareTerraConversation } from "@/features/scientific-thinking/scientific-collaborator-conversation";
import { calculateStudyProposalScenarios, type StudyProposalComposition } from "@/features/scientific-thinking/contextual-study-proposal";
import { confirmResearchProjectContribution, prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import { buildFunctionalResetQueryNavigation } from "@/features/query-navigation/functional-reset-progression";
import { currentGovernedNavigationInput } from "@/features/query-navigation/current-navigation-evidence";
import { buildProjectContextSnapshot } from "@/features/research-project-construction/canonical-project-backbone";
import type { ProductBridgeRequest } from "../../product-bridge";
import type { ConversationContextPacketPreflight } from "../../provider-call-observability";
import * as proposalOwner from "../study-proposal-standard";
import { controlledStudyProposal } from "./study-proposal-fixtures";
import { createFunctionalResetSession } from "../session";
import { buildScientificDiscussionContext } from "../contribution-discussion-context";
import { activeScientificDiscussionRetention, retainScientificDiscussionResult, type ScientificDiscussionRetention } from "../contribution-discussion-retention";
import { retainValidatedContributionCandidate, markContributionCandidatePresented } from "../contribution-lifecycle";
import { behaviorContribution, behaviorItem } from "./p1-behavior-01a-contract-fixtures";

// CURRENT_SEMANTIC_INVARIANT. Synthetic current ECV content; not a copy of the
// private conversation. Shape/cardinalities from the identified durable failure:
// 56 atoms, 41 adopted objects, 32 relations, 3 arbitrations, 6 options, 5 turns.
// The fixture protects adopted truth, unresolved science and qualified links.
const at = "2026-10-06T00:53:03.577Z";
const realShape = () => {
  const session = createFunctionalResetSession(at);
  const proposal = controlledStudyProposal("long-ecv-packet");
  const additional = ["T1 sanguin avant contraste", "T1 sanguin après contraste", "Identité des cinq coupes pré/post", "Motif d'ECV non évaluable", "Délai effectif post-injection", "Contrôle de concordance des coupes", "Traçabilité du prélèvement d'hématocrite", "Qualité de segmentation ventriculaire"];
  for (let i = 0; proposal.atoms.length < 56; i++) proposal.atoms.push({ ...proposal.atoms.find(a => a.ref === "ecv")!,
    ref: `ecv-extra-${i}`, semanticKey: `ecv-extra-${i}`, content: additional[i]!, dependsOn: [] });
  proposal.atoms = proposal.atoms.slice(0, 56).sort((a, b) => Number(a.status === "OPEN_DECISION") - Number(b.status === "OPEN_DECISION"));
  const selected = proposal.atoms.slice(0, 41);
  for (const [index, atom] of proposal.atoms.entries()) {
    atom.content += " La définition opérationnelle décrit cette information séparément de son interprétation. Les contrôles de qualité et le motif de non-évaluabilité restent traçables ; cette mesure ne constitue ni une preuve de causalité ni une spécification clinique finale.";
    atom.rationale = "Ce choix conserve la distinction entre mesure, interprétation et contrôle de qualité, sans inférer une décision sur les détails laissés ouverts.";
    atom.dependsOn = index > 0 && index <= 32 ? [selected[index - 1].ref] : [];
    atom.dependencyQualifications = atom.dependsOn.map(ref => ({ ref, kind: "HARD_BLOCKING_DEPENDENCY",
      rationale: "La donnée dépend de cette décision explicite dans le protocole. Leur liaison doit rester identifiable pour contrôler la cohérence du recueil, sans compléter une spécification absente ni modifier la définition scientifique de la mesure." }));
  }
  // Genuine unresolved qualifications of already adopted measurements remain
  // metadata; dropping adopted atoms wholesale would lose these soft links.
  selected[7].dependsOn.push(proposal.atoms[41].ref);
  selected[7].dependencyQualifications!.push({ ref: proposal.atoms[41].ref, kind: "SOFT_REFINEMENT_DEPENDENCY",
    rationale: "La méthode reste à préciser ; le choix d'une acquisition ne résout pas ce détail." });
  const branches = [[proposal.atoms[42], proposal.atoms[43]], [selected[40], proposal.atoms[44]], [proposal.atoms[45], proposal.atoms[46]]];
  proposal.arbitrations = branches.map((atoms, index) => ({ ...proposal.arbitrations[0], ref: `arb-${index}`,
    options: atoms.map((atom, optionIndex) => ({ ...proposal.arbitrations[0].options[0], ref: `opt-${index}-${optionIndex}`, atomRefs: [atom.ref] })),
    recommendedRefs: index === 1 ? ["opt-1-0"] : [] }));
  proposal.dimensioningScenarios = [];
  const digest = logicalDigest({ proposal, sourceProject: null, sourceTurnRef: "source", sourceResponseRef: "response" });
  const composition: StudyProposalComposition = { proposalRef: `scientific-study-proposal:${digest}`, digest,
    sourceTurnRef: "source", sourceResponseRef: "response", sourceProject: null, originalSourceProject: null,
    revision: 1, proposal, adoptedAtomRefs: [], unavailableOptionRefs: [], state: "CURRENT",
    dimensioning: calculateStudyProposalScenarios(proposal), ownerReceipts: [] };
  const selectionTurn = { turnId: "human-confirmation", role: "USER" as const, content: "Je confirme ces choix pour la qualification, pas comme protocole clinique final.", createdAt: at };
  const optionAtoms = new Set(proposal.arbitrations.flatMap(a => a.options.flatMap(o => o.atomRefs)));
  const contribution = proposalOwner.buildStudyProposalSelectionContribution({ composition,
    selectedAtomRefs: selected.filter(a => !optionAtoms.has(a.ref)).map(a => a.ref), selectedOptionRefs: ["opt-1-0"],
    project: null, projectId: session.projectId, conversationId: session.conversationId,
    proposalTurn: { turnId: "response", role: "NOXIA", content: proposal.reply, createdAt: at }, selectionTurn, createdAt: at });
  const candidate = prepareResearchProjectContributionCandidate(contribution, null);
  const project = confirmResearchProjectContribution({ contribution, current: null, projectId: session.projectId,
    authority: session.projectAuthority, confirmedAt: at, reviewedProjection: candidate.humanReviewProjection,
    selectedChangeRefs: candidate.humanReviewProjection.coveredChangeRefs });
  const adopted = proposalOwner.propagateStudyProposalDecision(composition, project, candidate, null,
    selected.map(a => a.ref), ["opt-1-0"], selectionTurn);
  const turns = [{ turnId: "source", role: "USER" as const, content: "Association âge–ECV, volontaires adultes, IRM et hématocrite à la visite unique.", createdAt: at },
    { turnId: "response", role: "NOXIA" as const, content: proposal.reply, createdAt: at }, selectionTurn,
    { turnId: "receipt", role: "NOXIA" as const, content: "Les choix explicitement confirmés sont enregistrés ; les autres restent ouverts.", createdAt: at },
    { turnId: "follow-up", role: "USER" as const, content: "Précisons les méthodes et les conditions d'éligibilité sans les considérer comme déjà adoptées.", createdAt: at }];
  const request: ProductBridgeRequest = { apiVersion: "1.0.0", conversation: { conversationId: session.conversationId, language: "fr", turns },
    currentProject: project, studyProposalContext: adopted, evaluatePersistentDelta: false,
    currentNavigation: currentGovernedNavigationInput({ project, navigation: buildFunctionalResetQueryNavigation({ project, recordedAt: at }) }) };
  return { request, project, composition: adopted, candidate };
};
const legacy = (c: StudyProposalComposition) => ({ status: "NOT_ADOPTED", proposalRef: c.proposalRef, state: c.state,
  adoptedAtomRefs: c.adoptedAtomRefs, unavailableOptionRefs: c.unavailableOptionRefs, dispositions: c.dispositions ?? [],
  atoms: c.proposal.atoms, arbitrations: c.proposal.arbitrations });
afterEach(() => vi.restoreAllMocks());

describe("Terra adopted StudyProposal current-state projection", () => {
  it("reproduces the real cardinality envelope at the same 80k boundary, then retains its active semantics", () => {
    const { request, project, composition, candidate } = realShape();
    expect(composition.proposal.atoms).toHaveLength(56);
    expect(composition.adoptedAtomRefs).toHaveLength(41);
    expect(project.canonicalState!.objects.filter(o => o.actuality === "CURRENT")).toHaveLength(41);
    expect(project.canonicalState!.relations.filter(r => r.actuality === "CURRENT")).toHaveLength(32);
    expect(candidate.humanReviewProjection.status).toBe("COMPLETE");
    const before = logicalDigest({ request, project, composition });
    const spy = vi.spyOn(proposalOwner, "projectStudyProposalConversationContext").mockImplementation(c => legacy(c));
    let oldMeasurement: ConversationContextPacketPreflight | undefined;
    expect(() => prepareTerraConversation(request, true, m => { oldMeasurement = m; })).toThrow("CONVERSATION_MEMORY_LIMIT");
    expect(oldMeasurement!.packetTotalBytes).toBeGreaterThan(80000);
    spy.mockRestore();
    let measurement: ConversationContextPacketPreflight | undefined;
    const prepared = prepareTerraConversation(request, true, m => { measurement = m; });
    const packet = JSON.parse(prepared.context);
    expect(measurement!.packetTotalBytes).toBeLessThan(80000);
    expect(packet.WORKING_STUDY_PROPOSAL.atoms).toEqual(composition.proposal.atoms.filter(a => !composition.adoptedAtomRefs.includes(a.ref)));
    expect(packet.WORKING_STUDY_PROPOSAL.arbitrations).toEqual(composition.proposal.arbitrations);
    expect(packet.WORKING_STUDY_PROPOSAL.unavailableOptionRefs).toEqual(["opt-1-1"]);
    expect(packet.QRY).toBeTruthy();
    const snapshot = buildProjectContextSnapshot({ project });
    const resolve = (ref: string | { decisionIndex: number }) => typeof ref === "string" ? ref : packet.CURRENT_PROJECT.decisions[ref.decisionIndex].ref;
    expect(packet.CURRENT_PROJECT.relationReferenceBasis).toBe("CURRENT_PROJECT.decisions");
    expect(packet.CURRENT_PROJECT.relations.map((r: { type: string; from: string | { decisionIndex: number }; to: string | { decisionIndex: number }; polarity: string }) =>
      ({ ...r, from: resolve(r.from), to: resolve(r.to) }))).toEqual(snapshot.relations.map(r =>
      ({ type: r.type, from: r.sourceProjectRef, to: r.targetProjectRef, polarity: r.polarity })));
    const table = packet.WORKING_STUDY_PROPOSAL.adoptedAtomContext;
    expect(table.rows).toHaveLength(41);
    for (const row of table.rows) {
      const metadata = Object.fromEntries(table.fields.map((field: string, index: number) => [field, row[index]]));
      const atom = composition.proposal.atoms.find(a => a.ref === metadata.ref)!;
      const canonical = packet.CURRENT_PROJECT.decisions.find((o: { ref: string }) => o.ref === metadata.projectRef);
      expect(canonical.content).toBe(atom.content);
      for (const [field, value] of Object.entries(atom)) if (field !== "content" && field !== "rationale") expect(metadata[field]).toEqual(value);
    }
    expect(logicalDigest({ request, project, composition })).toBe(before);
    console.info("REAL_SHAPE_CONTEXT_BYTES=" + JSON.stringify({ before: oldMeasurement!.packetTotalBytes, after: measurement!.packetTotalBytes }));
  });

  it("does not compact unknowns, unproven bindings, stale/review-required composition or changed Project content", () => {
    const { composition, project } = realShape();
    const view = proposalOwner.projectStudyProposalConversationContext;
    expect(view({ ...composition, state: "REVIEW_REQUIRED" }, project).atoms).toHaveLength(56);
    expect(view({ ...composition, state: "STALE" }, project).atoms).toHaveLength(56);
    expect(view({ ...composition, adoptionSourceRefs: undefined }, project).atoms).toHaveLength(56);
    const changed = structuredClone(project); changed.canonicalState!.objects.forEach(o => { o.content += " Changement non lié."; });
    expect(view(composition, changed).atoms).toHaveLength(56);
    const declaredUnknown = structuredClone(composition);
    declaredUnknown.proposal.atoms[0].status = "OPEN_DECISION";
    expect(view(declaredUnknown, project).atoms.some(a => a.ref === declaredUnknown.proposal.atoms[0].ref)).toBe(true);
    const ambiguous = structuredClone(project);
    const original = ambiguous.canonicalState!.objects.find(o => o.actuality === "CURRENT")!;
    ambiguous.canonicalState!.objects.push({ ...original, objectId: original.objectId + ":other-materialization" });
    expect(view(composition, ambiguous).atoms.some(a => a.content === original.content)).toBe(true);
  });

  it("preserves absent metadata separately from explicit null and false, without changing the snapshot", () => {
    const { composition, project } = realShape();
    const adjusted = structuredClone(composition);
    const [first, second] = adjusted.proposal.atoms;
    delete first.plannedMethod;
    second.plannedMethod = null;
    second.participantReported = false;
    const before = logicalDigest(adjusted);
    const table = proposalOwner.projectStudyProposalConversationContext(adjusted, project).adoptedAtomContext!;
    expect(table.absentFields.find(a => a.atomRef === first.ref)?.fields).toContain("plannedMethod");
    expect(table.absentFields.find(a => a.atomRef === second.ref)?.fields ?? []).not.toContain("plannedMethod");
    const secondRow = table.rows.find(row => row[table.fields.indexOf("ref")] === second.ref)!;
    expect(secondRow[table.fields.indexOf("plannedMethod")]).toBeNull();
    expect(secondRow[table.fields.indexOf("participantReported")]).toBe(false);
    expect(logicalDigest(adjusted)).toBe(before);
  });

  it.each([10, 25, 50, 100, 250])("continues a %i-turn scientific lifecycle with native settlement/supersession and pending Review", count => {
    const { request, project, composition, candidate } = realShape();
    const turns: ProductBridgeRequest["conversation"]["turns"] = [];
    let state: ScientificDiscussionRetention | undefined;
    const noMeaning = () => ({ coverage: "COMPLETE" as const, nonPersistentReason: "NO_SCIENTIFIC_MEANING" as const, elements: [] });
    for (let i = 0; turns.length + 2 <= count; i++) {
      const user = { turnId: `scientific-user-${i}`, role: "USER" as const, content: `Révision ${i} : préciser le contrôle d'évaluabilité ECV, sans fixer le délai post-injection.`, createdAt: at };
      const assistant = { turnId: `scientific-response-${i}`, role: "NOXIA" as const, content: "Le délai reste ouvert ; le contrôle courant remplace la proposition antérieure, pas le Project.", createdAt: at };
      turns.push(user, assistant);
      const previous = state ? [...state.elements].reverse().find(e => e.status !== "SUPERSEDED" && e.content.startsWith("Contrôle courant")) : undefined;
      state = retainScientificDiscussionResult({ state, conversationId: request.conversation.conversationId, runtimeTurns: turns,
        userTurn: user, assistantTurn: assistant, retained: [], result: { reply: assistant.content,
          userContribution: { coverage: "COMPLETE", nonPersistentReason: null, elements: [
            { id: "control", content: `Contrôle courant ${i} de concordance pré/post pour l'ECV.`, epistemicState: "USER_STATED", polarity: "CONDITIONAL", conditions: ["Sans adoption automatique"], linkedIds: [] },
            ...(i === 0 ? [{ id: "open", content: "Délai post-injection non défini.", epistemicState: "OPEN_UNKNOWN" as const, polarity: "CONDITIONAL" as const, conditions: [], linkedIds: [] }] : [])], },
          assistantContribution: noMeaning(), candidateBindings: [],
          dispositions: previous ? [{ elementRef: previous.ref, status: "SUPERSEDED", replacementId: "control", explicitUserDirection: true }] : [] } });
    }
    // Odd requested counts include one latest user message; no fake receipt for it.
    if (turns.length < count) turns.push({ turnId: "latest-unanswered-user", role: "USER", content: "Quel contrôle qualité préciser ensuite ?", createdAt: at });
    request.conversation.turns = turns;
    const contribution = behaviorContribution({ contributionId: "pending-ecv-quality-review", turns: [turns[0]], candidateObjects: [
      behaviorItem({ itemId: "pending-quality", proposedType: "PROJECT_INFORMATION", content: "Contrôle indépendant de concordance des coupes ECV proposé, non adopté.", turnId: turns[0].turnId })] });
    contribution.source.conversationId = request.conversation.conversationId;
    const pendingCandidate = prepareResearchProjectContributionCandidate(contribution, project);
    const retained = markContributionCandidatePresented({ retained: retainValidatedContributionCandidate({ retained: [], contribution,
      candidate: pendingCandidate, validation: { valid: true, blocks: [] }, validatorRef: "PRJ_NATIVE", sourceTurnRef: turns[0].turnId,
      baseProject: project, dependencyBindings: [], traceRunId: null, retainedAt: at }), candidateRef: pendingCandidate.contributionRef, presentedAt: at });
    request.scientificDiscussionContext = buildScientificDiscussionContext({ retention: state, retained, currentProject: project,
      conversationId: request.conversation.conversationId, runtimeTurns: turns, studyProposal: composition });
    const before = logicalDigest(project);
    const packet = JSON.parse(prepareTerraConversation(request, true).context);
    expect(packet.RECENT_CONVERSATION).toHaveLength(10);
    expect(packet.CURRENT_DISCUSSION.retainedMeaning.some((e: { content: string }) => e.content === "Délai post-injection non défini.")).toBe(true);
    expect(activeScientificDiscussionRetention(state!, [], project)).toHaveLength(2);
    expect(packet.WORKING_STUDY_PROPOSAL.atoms).toHaveLength(15);
    expect(packet.CURRENT_DISCUSSION.active.some((e: { content: string }) => e.content === "Contrôle indépendant de concordance des coupes ECV proposé, non adopté.")).toBe(true);
    expect(packet.QRY).toBeTruthy();
    expect(candidate.humanReviewProjection.status).toBe("COMPLETE");
    expect(pendingCandidate.humanReviewProjection.status).toBe("COMPLETE");
    expect(logicalDigest(project)).toBe(before);
    console.info("LONG_LIVED_CONTEXT_BYTES=" + JSON.stringify({ turns: count, bytes: new TextEncoder().encode(JSON.stringify(packet)).length, activeMeanings: 2 }));
  });
});
