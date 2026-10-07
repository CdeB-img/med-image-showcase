import { afterEach, describe, expect, it, vi } from "vitest";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { confirmResearchProjectContribution, prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import { prepareTerraConversation } from "@/features/scientific-thinking/scientific-collaborator-conversation";
import { type StudyProposalAtom, type StudyProposalComposition } from "@/features/scientific-thinking/contextual-study-proposal";
import { createFunctionalResetSession } from "../session";
import { captureProjectPreparation } from "../project-preparation-lifecycle";
import { acceptWorkingDraftUpdate, compactWorkingDraftAdvice, prepareContinuousWorkingDraft, workingDraftInputDigest } from "../continuous-project-build";
import { prepareTerraConversationRequest } from "../conversation-request";
import { sourceBackedVersionSelection } from "../useVersionProduction";
import * as owner from "../study-proposal-standard";
import { controlledStudyProposal, readConversationProposalAtoms } from "./study-proposal-fixtures";

// SYNTHETIC_CURRENT_CONTRACT / CURRENT_SEMANTIC_INVARIANT. Not the private
// export. ECV study, nine native adoptions, complete 82-atom recomposition and
// a source-backed timing choice requiring a unique visit/design closure.
const at = "2026-10-07T00:00:00.000Z";
const source = { turnId: "source", role: "USER" as const, content: "Étudier l'association âge–ECV chez des volontaires sains en France, sans rémunération, par IRM. Recueillir âge, sexe et activité sportive ; les procédures et analyses restent proposées.", createdAt: at };
const response = { turnId: "response", role: "NOXIA" as const, content: "Proposer une architecture transversale ; les précisions de mesure et d'analyse restent non adoptées.", createdAt: at };
const nextSource = { turnId: "next-source", role: "USER" as const, content: "Hématocrite à l'IRM avant perfusion, prélevé sur le cathéter. La méthode analytique reste à vérifier.", createdAt: at };
const nextResponse = { turnId: "noxia-turn:11111111-1111-4111-8111-111111111111", role: "NOXIA" as const, content: "Ce timing s'inscrit dans la visite de mesure ; il ne fixe ni la méthode de mesure ni le délai post-contraste.", createdAt: at };
const compositionFor = (proposal: StudyProposalComposition["proposal"], project: Parameters<typeof owner.studyProposalBinding>[0], user = source, reply = response): StudyProposalComposition => {
  const sourceProject = owner.studyProposalBinding(project);
  const digest = logicalDigest({ proposal, sourceProject, sourceTurnRef: user.turnId, sourceResponseRef: reply.turnId });
  return { proposalRef: `scientific-study-proposal:${digest}`, digest, proposal, sourceTurnRef: user.turnId,
    sourceResponseRef: reply.turnId, sourceProject, originalSourceProject: sourceProject, revision: 1,
    adoptedAtomRefs: [], unavailableOptionRefs: [], state: "CURRENT", dimensioning: [], ownerReceipts: [] };
};
const fixture = () => {
  const session = createFunctionalResetSession(at), proposal = controlledStudyProposal("seed");
  proposal.atoms.find(a => a.ref === "design")!.ref = "a05";
  // All conditions remain scientific values, not empty padding. Repetition of
  // field labels must not force these qualifications out of the provider packet.
  for (const a of proposal.atoms) {
    a.content += " Distinguer définition et conditions d'acquisition. L'association âge–ECV ne démontre ni évolution individuelle ni causalité. Évaluabilité et motifs d'absence restent séparés.";
    a.rationale = "Cette représentation sépare le phénomène visé, la mesure et son interprétation. Une précision opérationnelle non fournie ne devient pas une valeur par défaut ; les limites de validité, les conditions de collecte et les incertitudes doivent rester identifiables dans le Project ou la proposition de travail.";
  }
  const initial = compositionFor(proposal, null);
  const selected = ["question", "population", "measurement", "practical", "eligibility", "bias", "descriptor", "exposure", "sex"];
  const contribution = owner.buildStudyProposalSelectionContribution({ composition: initial, selectedOptionRefs: [], selectedAtomRefs: selected,
    project: null, projectId: session.projectId, conversationId: session.conversationId, proposalTurn: response, selectionTurn: source, createdAt: at });
  const candidate = prepareResearchProjectContributionCandidate(contribution, null);
  const project = confirmResearchProjectContribution({ contribution, current: null, projectId: session.projectId,
    authority: session.projectAuthority, confirmedAt: at, reviewedProjection: candidate.humanReviewProjection,
    selectedChangeRefs: candidate.humanReviewProjection.coveredChangeRefs, confirmationSourceRefs: ["human-generate-v1"] });
  const previous = owner.propagateStudyProposalDecision(initial, project, candidate, null, selected, [], source, contribution);
  const current = structuredClone(proposal);
  const design = current.atoms.find(a => a.ref === "a05")!, visit = current.atoms.find(a => a.ref === "timing")!;
  current.atoms.push({ ...visit, ref: "a08", semanticKey: "single-mri-visit", content: "Une visite transversale d'IRM par participant, sans suivi longitudinal.",
    status: "NOXIA_PROPOSAL", dependsOn: ["a05"], dependencyQualifications: [{ ref: "a05", kind: "HARD_BLOCKING_DEPENDENCY", rationale: "La visite met en œuvre le design transversal." }] },
  { ...visit, ref: "a69", semanticKey: "hematocrit-before-infusion", targetType: "CONSTRAINT", content: "Hématocrite à l'IRM avant perfusion ; méthode analytique à vérifier.",
    status: "NOXIA_PROPOSAL", dependsOn: ["a08"], dependencyQualifications: [{ ref: "a08", kind: "HARD_BLOCKING_DEPENDENCY", rationale: "Le timing se situe dans la visite d'IRM." }] });
  const openTopics = ["Segmentation myocardique", "Délai post-injection", "Agrégation ECV des cinq coupes", "Qualité T1 et artéfacts", "Non-évaluabilité régionale", "Codage des données manquantes", "Ajustements statistiques", "Définition du volontaire sain"];
  while (current.atoms.length < 82) {
    const index = current.atoms.length;
    current.atoms.push({ ...design, ref: `open-${index}`, semanticKey: `qualification-${index}`, status: "OPEN_DECISION",
      content: `${openTopics[index % openTopics.length]} : qualification ${index} non fixée. Distinguer le choix de la procédure, sa mise en œuvre, les conditions de comparabilité et la limite d'interprétation. Ne pas transformer une hypothèse de travail en règle clinique ni une inconnue en valeur résolue.`,
      dependsOn: ["a05"], dependencyQualifications: [{ ref: "a05", kind: "SOFT_REFINEMENT_DEPENDENCY", rationale: "Le cadre transversal ne résout pas ce détail scientifique. Son absence ne justifie ni une reconstruction locale de l'information, ni une adoption implicite, ni une certification de couverture par la seule présence d'une référence au Project." }] });
  }
  session.project = project; session.studyProposal = previous; session.runtimeTurns = [source, response, nextSource, nextResponse];
  const preparation = captureProjectPreparation(session, at, true), request = preparation.checkpoint!.request;
  current.contextDigest = workingDraftInputDigest(request);
  const update = { requestType: "STUDY_UPDATE" as const, proposal: current, inferredAtomRefs: [], rejectedAtomRefs: [],
    explicitDecisions: [...selected.map(atomRef => ({ atomRef, sourceTurnRef: source.turnId, quote: source.content })),
      { atomRef: "a69", sourceTurnRef: nextSource.turnId, quote: nextSource.content }] };
  const accepted = acceptWorkingDraftUpdate(update, request);
  const composition = accepted.composition!;
  const ready = { ...preparation, status: "READY_FOR_REVIEW" as const,
    result: { composition, workingDraft: prepareContinuousWorkingDraft(session, composition, accepted.update, current.contextDigest) } };
  session.studyProposal = composition;
  return { session, preparation: ready, request, update, composition, previous, selected };
};
afterEach(() => vi.restoreAllMocks());

describe("two-version dependency closure and lossless packet", () => {
  it("preserves nine exact native adoptions at Working Draft acceptance, before projection", () => {
    const { composition, previous, selected, session } = fixture();
    expect(composition.adoptedAtomRefs).toHaveLength(9);
    expect(composition.adoptedAtomRefs).toEqual(expect.arrayContaining(selected));
    expect(composition.adoptionSourceRefs).toEqual(previous.adoptionSourceRefs);
    expect(composition.proposal.atoms).toHaveLength(82);
    expect(() => owner.assertStudyProposalCurrent(composition, session.project)).not.toThrow();
  });
  it("closes a69 → a08 → a05 without a fake question or changing proposed provenance", () => {
    const { session, preparation } = fixture(), before = logicalDigest(preparation);
    const result = sourceBackedVersionSelection(session, preparation);
    expect(result).not.toHaveProperty("clarification");
    if (!("selection" in result)) throw new Error("Expected dependency closure");
    expect(result.selection.selectedAtoms).toEqual(["a69", "a08", "a05"]);
    expect(result.selection.selectedOptions).toEqual([]);
    expect(result.selection.candidate.status).toBe("CANDIDATE_PENDING_HUMAN_CONFIRMATION");
    expect(preparation.result!.workingDraft.origins.a69).toBe("EXPLICIT_USER");
    expect(preparation.result!.workingDraft.origins.a08).toBe("PROPOSED");
    expect(preparation.result!.workingDraft.origins.a05).toBe("PROPOSED");
    expect(logicalDigest(preparation)).toBe(before);
    expect(session.project!.revision).toBe(1);
  });
  it.each(["changed-content", "changed-qualification", "one-to-many", "missing-sources", "stale", "review-required", "open"])("never compacts an unproven adoption: %s", mode => {
    const { previous, composition, session, selected } = fixture();
    const next = compositionFor(structuredClone(composition.proposal), session.project, nextSource, nextResponse);
    const project = structuredClone(session.project!), old = mode === "missing-sources"
      ? { ...previous, adoptionSourceRefs: { ...previous.adoptionSourceRefs, [selected[0]]: ["unproven-source"] } } : structuredClone(previous);
    const atom = next.proposal.atoms.find(a => a.ref === selected[0])!;
    if (mode === "changed-content") atom.content += " Contenu révisé.";
    if (mode === "changed-qualification") atom.plannedMethod = "Méthode supplémentaire encore candidate";
    if (mode === "open") atom.status = "OPEN_DECISION";
    if (mode === "one-to-many") project.canonicalState!.objects.push({ ...structuredClone(project.canonicalState!.objects[0]), objectId: "another-object" });
    // Rebind only the synthetic native receipt digest after an explicit edit.
    const rebuilt = { ...compositionFor(next.proposal, project, nextSource, nextResponse),
      state: mode === "stale" ? "STALE" as const : mode === "review-required" ? "REVIEW_REQUIRED" as const : next.state };
    const bound = owner.preserveStudyProposalAdoptions(old, rebuilt, project);
    expect(bound.adoptedAtomRefs).not.toContain(atom.ref);
    expect(owner.projectStudyProposalConversationContext(bound, project).atoms).toContainEqual(atom);
  });
  it("asks only for a genuinely competing replace/add biopsy interpretation", () => {
    const { session, preparation, composition } = fixture();
    const visit = composition.proposal.atoms.find(a => a.ref === "a08")!;
    const proposal = structuredClone(composition.proposal);
    proposal.atoms.push({ ...visit, ref: "biopsy-added", semanticKey: "biopsy-added", content: "Ajouter une biopsie à l'IRM pour un sous-groupe ; justification et sécurité à préciser." });
    proposal.arbitrations.push({ ...proposal.arbitrations[0], ref: "procedure-revision", label: "la biopsie (remplacement de l'IRM ou ajout à un sous-groupe)", selection: "ONE",
      options: [{ ...proposal.arbitrations[0].options[0], ref: "replace-mri", atomRefs: ["a08"] },
        { ...proposal.arbitrations[0].options[0], ref: "add-biopsy", atomRefs: ["biopsy-added"] }], recommendedRefs: [] });
    const current = compositionFor(proposal, session.project, nextSource, nextResponse);
    const result = sourceBackedVersionSelection(session, { ...preparation, result: { ...preparation.result!, composition: current } });
    expect(result).toEqual({ clarification: "Quel choix souhaitez-vous retenir pour la biopsie (remplacement de l'IRM ou ajout à un sous-groupe) ?" });
    expect(session.project!.revision).toBe(1);
  });
  it("rejects a missing reference structurally, never disguising it as a clarification", () => {
    const { request, update } = fixture();
    update.proposal.atoms.find(a => a.ref === "a69")!.dependsOn = ["absent-dependency"];
    update.proposal.atoms.find(a => a.ref === "a69")!.dependencyQualifications = [{ ref: "absent-dependency", kind: "HARD_BLOCKING_DEPENDENCY", rationale: "Référence absente." }];
    expect(() => acceptWorkingDraftUpdate(update, request)).toThrow("STUDY_PROPOSAL_DEPENDENCY_INVALID");
  });
  it("preserves every active value and absence/null distinction through compact serialization", () => {
    const { composition, session } = fixture(), atom = composition.proposal.atoms.find(a => a.ref === "a69")!;
    delete atom.plannedMethod;
    atom.analysisMethod = undefined;
    const view = owner.projectStudyProposalConversationContext(composition, session.project);
    const compact = owner.compactStudyProposalConversationContext(view);
    const decoded = readConversationProposalAtoms(JSON.parse(JSON.stringify(compact)));
    expect(decoded).toEqual(JSON.parse(JSON.stringify(view.atoms)));
    expect(decoded.find(a => a.ref === atom.ref)).not.toHaveProperty("plannedMethod");
    expect(decoded.find(a => a.ref === atom.ref)).not.toHaveProperty("analysisMethod");
    expect(decoded.find(a => a.ref === "a08")).toHaveProperty("plannedMethod", null);
    expect(compact).toHaveProperty("atomTable");
    expect(JSON.stringify(compact).length).toBeLessThan(JSON.stringify(view).length);
  });
  it("admits the complete recomposed packet while retaining all open meanings and native arbitrations", () => {
    const { session, composition } = fixture();
    const request = { ...prepareTerraConversationRequest(session, session.runtimeTurns, session.runtimeTurns.at(-2)!, true, false), apiVersion: "1.0.0" as const };
    const before = logicalDigest({ session, request });
    const spy = vi.spyOn(owner, "compactStudyProposalConversationContext").mockImplementation(c => c);
    let oldBytes = 0;
    expect(() => prepareTerraConversation(request, true, m => { oldBytes = m.packetTotalBytes; })).toThrow("CONVERSATION_MEMORY_LIMIT");
    spy.mockRestore();
    const result = prepareTerraConversation(request, true, m => console.info("TWO_VERSION_PACKET_PREFLIGHT", m.packetTotalBytes)), packet = JSON.parse(result.context);
    expect(new TextEncoder().encode(result.context).length).toBeLessThan(80000);
    const view = owner.projectStudyProposalConversationContext(composition, session.project);
    expect(readConversationProposalAtoms(packet.WORKING_STUDY_PROPOSAL)).toEqual(view.atoms);
    expect(packet.OPEN_DECISIONS).toHaveLength(composition.proposal.atoms.filter(a => a.status === "OPEN_DECISION").length);
    expect(packet.WORKING_STUDY_PROPOSAL.arbitrations).toEqual(composition.proposal.arbitrations);
    const advice = compactWorkingDraftAdvice(request)!;
    expect(advice.ALTERNATIVES.every(a => "arbitrationRef" in a)).toBe(true);
    expect(JSON.stringify(advice)).not.toContain(composition.proposal.arbitrations[0].rationale);
    expect(logicalDigest({ session, request })).toBe(before);
    console.info("TWO_VERSION_PACKET_BYTES", { before: oldBytes, after: new TextEncoder().encode(result.context).length });
  });
});
