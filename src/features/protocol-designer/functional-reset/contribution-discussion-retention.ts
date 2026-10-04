import { z } from "zod/v4";
import { logicalDigest } from "../../knowledge-engine/canonical.js";
import type { ScientificInterpretationTurn } from "../../scientific-interpretation/contracts.js";
import type { ResearchProjectOwnerProjection } from "../../research-project-construction/contribution-owner-boundary.js";
import { buildProjectContextSnapshot } from "../../research-project-construction/canonical-project-backbone.js";
import type { RetainedContributionCandidate } from "./contribution-lifecycle.js";
import type { StudyProposalComposition } from "../../scientific-thinking/contextual-study-proposal.js";

// Extension of RETAINED_CONTRIBUTION_LIFECYCLE, not a transcript/Project owner.
// Semantic classification is returned WITH the ordinary Scientific Thinking
// answer. Native validation verifies identity/closure, not semantic similarity.
const ref = z.string().min(1);
const meaning = z.object({
  id: ref, content: ref,
  epistemicState: z.enum(["USER_STATED", "PROPOSED_NOT_ADOPTED", "OPEN_UNKNOWN"]),
  polarity: z.enum(["AFFIRMED", "NEGATED", "CONDITIONAL", "UNKNOWN"]),
  conditions: z.array(ref), linkedIds: z.array(ref),
}).strict();
const coverage = z.object({
  coverage: z.enum(["COMPLETE", "PARTIAL", "UNKNOWN"]),
  nonPersistentReason: z.enum(["NO_SCIENTIFIC_MEANING", "PRESENTATION_ONLY"]).nullable(),
  elements: z.array(meaning),
}).strict();
export const terraScientificResultSchema = z.object({
  reply: ref,
  userContribution: coverage,
  assistantContribution: coverage,
  dispositions: z.array(z.object({
    elementRef: ref, status: z.enum(["SUPERSEDED", "REJECTED", "CLOSED"]),
    replacementId: ref.nullable(),
    // An explicit current USER direction is required; no age/silence heuristic.
    explicitUserDirection: z.literal(true),
  }).strict()),
  candidateBindings: z.array(z.object({ elementRef: ref, candidateRef: ref, changeRef: ref }).strict()),
}).strict();
export type TerraScientificResult = z.infer<typeof terraScientificResultSchema>;
export const terraScientificResultJsonSchema = () => {
  const { $schema: _dialect, ...schema } = z.toJSONSchema(terraScientificResultSchema);
  return schema;
};
type Turn = Pick<ScientificInterpretationTurn, "turnId" | "role" | "content">;
export type RetainedDiscussionElement = Readonly<z.infer<typeof meaning> & {
  ref: string; sourceTurnRef: string; sourceDigest: string;
  linkedRefs: readonly string[];
  status: "PROPOSED_NOT_ADOPTED" | "OPEN_UNKNOWN" | "SUPERSEDED" | "REJECTED" | "CLOSED" | "ADOPTED";
  dispositionSourceRef: string | null;
  replacementRef: string | null;
  candidateBinding: { candidateRef: string; changeRef: string } | null;
  proposalBinding?: { proposalRef: string; atomRefs: readonly string[] };
  adoption?: { projectId: string; projectVersion: string; decisionRef: string };
}>;
export type ScientificDiscussionRetention = Readonly<{
  owner: "RETAINED_CONTRIBUTION_LIFECYCLE";
  semanticOwner: "SCIENTIFIC_THINKING";
  contractVersion: "1.0.0";
  conversationId: string;
  sourceCoverage: readonly Readonly<{ turnRef: string; sourceDigest: string;
    coverage: "COMPLETE" | "PARTIAL" | "UNKNOWN"; elementRefs: readonly string[];
    nonPersistentReason: "NO_SCIENTIFIC_MEANING" | "PRESENTATION_ONLY" | "GOVERNED_OWNER_EVENT" | null;
    classificationOwner?: "SCIENTIFIC_THINKING" | "RESEARCH_PROJECT"; ownerEventRef?: string }>[];
  elements: readonly RetainedDiscussionElement[];
}>;
export const emptyScientificDiscussionRetention = (conversationId: string): ScientificDiscussionRetention => ({
  owner: "RETAINED_CONTRIBUTION_LIFECYCLE", semanticOwner: "SCIENTIFIC_THINKING", contractVersion: "1.0.0",
  conversationId, sourceCoverage: [], elements: [],
});
const active = (e: RetainedDiscussionElement) => e.status === "PROPOSED_NOT_ADOPTED" || e.status === "OPEN_UNKNOWN";
const fail = (): never => { throw new Error("SCIENTIFIC_DISCUSSION_RETENTION_INVALID"); };

export const validateScientificDiscussionRetention = (state: ScientificDiscussionRetention, conversationId: string,
  turns: readonly Turn[]): boolean => {
  try {
    if (state.owner !== "RETAINED_CONTRIBUTION_LIFECYCLE" || state.semanticOwner !== "SCIENTIFIC_THINKING"
      || state.contractVersion !== "1.0.0" || state.conversationId !== conversationId) return false;
    const elements = new Map(state.elements.map(e => [e.ref, e]));
    if (elements.size !== state.elements.length || new Set(state.sourceCoverage.map(s => s.turnRef)).size !== state.sourceCoverage.length) return false;
    return state.sourceCoverage.every(s => {
      const source = turns.find(t => t.turnId === s.turnRef);
      return source && logicalDigest(source.content) === s.sourceDigest
        && ["COMPLETE", "PARTIAL", "UNKNOWN"].includes(s.coverage)
        && (s.nonPersistentReason === null || ["NO_SCIENTIFIC_MEANING", "PRESENTATION_ONLY", "GOVERNED_OWNER_EVENT"].includes(s.nonPersistentReason))
        && (s.nonPersistentReason !== "GOVERNED_OWNER_EVENT" || s.classificationOwner === "RESEARCH_PROJECT" && Boolean(s.ownerEventRef))
        && (s.coverage !== "COMPLETE" || s.elementRefs.length > 0 || s.nonPersistentReason !== null)
        && !(s.elementRefs.length && s.nonPersistentReason)
        && new Set(s.elementRefs).size === s.elementRefs.length
        && s.elementRefs.every(r => elements.get(r)?.sourceTurnRef === s.turnRef);
    }) && state.elements.every(e => {
      const source = state.sourceCoverage.find(s => s.turnRef === e.sourceTurnRef);
      return meaning.safeParse({ id: e.id, content: e.content, epistemicState: e.epistemicState,
        polarity: e.polarity, conditions: e.conditions, linkedIds: e.linkedIds }).success
        && source?.elementRefs.includes(e.ref) && source.sourceDigest === e.sourceDigest
        && e.ref === `retained-discussion:${logicalDigest({ turnRef: e.sourceTurnRef, id: e.id })}`
        && ["PROPOSED_NOT_ADOPTED", "OPEN_UNKNOWN", "SUPERSEDED", "REJECTED", "CLOSED", "ADOPTED"].includes(e.status)
        && e.linkedRefs.every(r => elements.has(r))
        && (active(e) || e.status === "ADOPTED" && Boolean(e.adoption?.projectId && e.adoption.projectVersion && e.adoption.decisionRef)
          || Boolean(e.dispositionSourceRef && turns.some(t => t.role === "USER" && t.turnId === e.dispositionSourceRef)))
        && (e.status !== "SUPERSEDED" || Boolean(e.replacementRef && elements.has(e.replacementRef)));
    });
  } catch { return false; }
};

/** Accept a first-owner receipt, bound to the actual received USER/NOXIA pair.
 * No Project mutation, provider call, implicit adoption or local summarization. */
export const retainScientificDiscussionResult = (input: {
  state?: ScientificDiscussionRetention; conversationId: string; runtimeTurns: readonly Turn[];
  userTurn: Turn; assistantTurn: Turn; result: unknown; retained: readonly RetainedContributionCandidate[];
}): ScientificDiscussionRetention => {
  const result = terraScientificResultSchema.parse(input.result);
  const previous = input.state ?? emptyScientificDiscussionRetention(input.conversationId);
  if (!validateScientificDiscussionRetention(previous, input.conversationId, input.runtimeTurns)
    || input.userTurn.role !== "USER" || input.assistantTurn.role !== "NOXIA"
    || input.assistantTurn.content !== result.reply) fail();
  const additions: RetainedDiscussionElement[] = [];
  const receipts = ([ [input.userTurn, result.userContribution], [input.assistantTurn, result.assistantContribution] ] as const).map(([turn, receipt]) => {
    if (previous.sourceCoverage.some(s => s.turnRef === turn.turnId)) fail();
    const ids = new Map(receipt.elements.map(e => [e.id, `retained-discussion:${logicalDigest({ turnRef: turn.turnId, id: e.id })}`]));
    if (ids.size !== receipt.elements.length || (receipt.elements.length > 0 && receipt.nonPersistentReason)
      || (receipt.coverage === "COMPLETE" && !receipt.elements.length && !receipt.nonPersistentReason)) fail();
    for (const element of receipt.elements) {
      if (element.linkedIds.some(id => !ids.has(id))) fail();
      additions.push({ ...element, ref: ids.get(element.id)!, sourceTurnRef: turn.turnId, sourceDigest: logicalDigest(turn.content),
        linkedRefs: element.linkedIds.map(id => ids.get(id)!),
        status: element.epistemicState === "OPEN_UNKNOWN" ? "OPEN_UNKNOWN" : "PROPOSED_NOT_ADOPTED",
        dispositionSourceRef: null, replacementRef: null, candidateBinding: null });
    }
    return { turnRef: turn.turnId, sourceDigest: logicalDigest(turn.content), coverage: receipt.coverage,
      elementRefs: [...ids.values()], nonPersistentReason: receipt.nonPersistentReason };
  });
  let elements = [...previous.elements, ...additions];
  const touched = new Set<string>();
  for (const d of result.dispositions) {
    const target = previous.elements.find(e => e.ref === d.elementRef && active(e));
    const replacement = additions.find(e => e.id === d.replacementId && e.sourceTurnRef === input.userTurn.turnId);
    if (!target || touched.has(d.elementRef) || (d.status === "SUPERSEDED" ? !replacement : d.replacementId !== null)) fail();
    touched.add(d.elementRef);
    elements = elements.map(e => e.ref === d.elementRef ? { ...e, status: d.status,
      dispositionSourceRef: input.userTurn.turnId, replacementRef: replacement?.ref ?? null } : e);
  }
  for (const b of result.candidateBindings) {
    const target = elements.find(e => e.ref === b.elementRef && active(e));
    const candidate = input.retained.find(c => c.candidateRef === b.candidateRef && c.validation.valid && !c.validation.blocks.length
      && c.actuality === "CURRENT" && c.candidateDigest === logicalDigest({ contribution: c.contribution, candidate: c.candidate }));
    const change = candidate?.candidate.canonicalChangeSet.objectChanges.find(c => c.changeRef === b.changeRef);
    if (!target || !change?.candidate || ![...change.candidate.provenance.sourceTurnRefs, ...change.candidate.provenance.proposalSourceTurnRefs].includes(target.sourceTurnRef)
      || change.operation === "REMOVE") fail();
    elements = elements.map(e => e.ref === b.elementRef ? { ...e, candidateBinding: { candidateRef: b.candidateRef, changeRef: b.changeRef } } : e);
  }
  const next: ScientificDiscussionRetention = { ...previous, sourceCoverage: [...previous.sourceCoverage, ...receipts], elements };
  if (!validateScientificDiscussionRetention(next, input.conversationId, input.runtimeTurns)) fail();
  return next;
};

// A semantic binding alone does NOT adopt. Both the existing human receipt and
// the exact current native object version must agree before omitting duplication.
export const retainedDiscussionElementAdopted = (e: RetainedDiscussionElement,
  retained: readonly RetainedContributionCandidate[], project: ResearchProjectOwnerProjection | null) => {
  if (!e.candidateBinding || !project) return false;
  const c = retained.find(c => c.candidateRef === e.candidateBinding!.candidateRef);
  if (!c?.validation.valid || c.validation.blocks.length || c.candidateDigest !== logicalDigest({ contribution: c.contribution, candidate: c.candidate })
    || c.humanDecision?.status !== "ADOPTED" || !c.humanDecision.targets.includes(c.candidateRef)) return false;
  const object = c.candidate.canonicalChangeSet.objectChanges.find(change => change.changeRef === e.candidateBinding!.changeRef)?.candidate;
  return Boolean(object && buildProjectContextSnapshot({ project }).objects.some(current => current.stableId === object.objectId
    && current.decisionRefs.includes(c.humanDecision!.decisionId)));
};

export const activeScientificDiscussionRetention = (state: ScientificDiscussionRetention,
  retained: readonly RetainedContributionCandidate[], project: ResearchProjectOwnerProjection | null,
  composition?: StudyProposalComposition | null) => {
  const elements = new Map(state.elements.map(e => [e.ref, e]));
  const adopted = (e: RetainedDiscussionElement) => retainedDiscussionElementAdopted(e, retained, project)
    || retainedDiscussionProposalAdopted(e, project, composition);
  const effectiveLinks = (ref: string, visited = new Set<string>()): string[] => {
    if (visited.has(ref)) fail(); visited.add(ref);
    const e = elements.get(ref); if (!e) return fail();
    if (e.status === "SUPERSEDED" && e.replacementRef) return effectiveLinks(e.replacementRef, visited);
    if (!active(e) && e.status !== "ADOPTED") throw new Error("SCIENTIFIC_DISCUSSION_DEPENDENCY_UNRESOLVED");
    if (e.status !== "ADOPTED" && !adopted(e)) return [ref];
    const sources = e.proposalBinding?.atomRefs.flatMap(ref => composition?.adoptionSourceRefs?.[ref] ?? []) ?? [];
    const binding = e.candidateBinding && retained.find(c => c.candidateRef === e.candidateBinding!.candidateRef);
    const objectId = binding && binding.candidate.canonicalChangeSet.objectChanges.find(c => c.changeRef === e.candidateBinding!.changeRef)?.objectId;
    if (!project) throw new Error("SCIENTIFIC_DISCUSSION_DEPENDENCY_UNRESOLVED");
    const targets = buildProjectContextSnapshot({ project }).objects.filter(o => o.stableId === objectId
      || o.sourceItemRefs.some(ref => sources.includes(ref))).map(o => o.stableId);
    if (!targets.length) throw new Error("SCIENTIFIC_DISCUSSION_DEPENDENCY_UNRESOLVED");
    return targets;
  };
  return state.elements.filter(e => active(e) && !adopted(e))
    .map(({ ref, content, epistemicState, polarity, conditions, linkedRefs, sourceTurnRef, sourceDigest }) => ({
      ref, content, epistemicState, polarity, conditions, linkedRefs: linkedRefs.flatMap(ref => effectiveLinks(ref)), sourceTurnRef, sourceDigest,
      status: "NOT_ADOPTED" as const,
    }));
};

export const retainedDiscussionProposalBindingsSchema = z.array(z.object({
  elementRef: ref, atomRefs: z.array(ref).min(1), sourceTurnRef: ref,
}).strict());
export type RetainedDiscussionProposalBindings = z.infer<typeof retainedDiscussionProposalBindingsSchema>;

/** Semantic correspondence comes from the existing Working Draft ST operation,
 * not a local text matcher. Human review/materialization remain their owners. */
export const bindRetainedDiscussionProposal = (state: ScientificDiscussionRetention | undefined,
  composition: StudyProposalComposition, bindings: RetainedDiscussionProposalBindings): ScientificDiscussionRetention | undefined => {
  if (!state) { if (bindings.length) fail(); return state; }
  const refs = new Set<string>();
  for (const b of retainedDiscussionProposalBindingsSchema.parse(bindings)) {
    const e = state.elements.find(e => e.ref === b.elementRef && active(e));
    if (!e || refs.has(b.elementRef) || e.sourceTurnRef !== b.sourceTurnRef
      || new Set(b.atomRefs).size !== b.atomRefs.length
      || b.atomRefs.some(ref => !composition.proposal.atoms.some(a => a.ref === ref))) fail();
    refs.add(b.elementRef);
  }
  return { ...state, elements: state.elements.map(e => {
    const b = bindings.find(b => b.elementRef === e.ref);
    return b ? { ...e, proposalBinding: { proposalRef: composition.proposalRef, atomRefs: [...b.atomRefs] } } : e;
  }) };
};

const retainedDiscussionProposalAdopted = (e: RetainedDiscussionElement,
  project: ResearchProjectOwnerProjection | null, composition?: StudyProposalComposition | null) => {
  const b = e.proposalBinding;
  if (!b || !project || !composition || composition.proposalRef !== b.proposalRef
    || composition.sourceProject?.projectDigest !== project.projectDigest
    || composition.sourceProject?.versionId !== project.versionId) return false;
  const snapshot = buildProjectContextSnapshot({ project });
  return b.atomRefs.length > 0 && b.atomRefs.every(ref => {
    const sources = composition.adoptionSourceRefs?.[ref];
    return composition.adoptedAtomRefs.includes(ref) && Boolean(sources?.length)
      && sources!.every(source => snapshot.objects.some(o => o.sourceItemRefs.includes(source)));
  });
};

/** Persist the transfer as a lifecycle fact. A subsequent Project replacement
 * cannot resurrect this old meaning as a non-adopted active contribution. */
export const settleRetainedDiscussionAdoption = (state: ScientificDiscussionRetention | undefined,
  project: ResearchProjectOwnerProjection, retained: readonly RetainedContributionCandidate[],
  composition?: StudyProposalComposition | null): ScientificDiscussionRetention | undefined => state ? ({
  ...state, elements: state.elements.map(e => active(e) && (retainedDiscussionElementAdopted(e, retained, project)
    || retainedDiscussionProposalAdopted(e, project, composition)) ? { ...e, status: "ADOPTED",
      adoption: { projectId: project.projectId, projectVersion: project.versionId, decisionRef: project.confirmationDecision.decisionId } } : e),
}) : state;

/** Only the typed, UI-generated confirmation acknowledgement, not arbitrary
 * user prose. Its meaning is the already committed native human decision. */
export const recordGovernedAdoptionContextEvent = (state: ScientificDiscussionRetention | undefined,
  project: ResearchProjectOwnerProjection, turns: readonly Turn[]): ScientificDiscussionRetention | undefined => {
  if (!state) return state; // Never reconstruct historical source coverage.
  const decision = project.confirmationDecision;
  if (decision.status !== "ADOPTED" || !decision.actor || !decision.mandate || !decision.timestamp) fail();
  if (turns.some(t => state.sourceCoverage.some(s => s.turnRef === t.turnId))) fail();
  return { ...state, sourceCoverage: [...state.sourceCoverage, ...turns.map(turn => ({
    turnRef: turn.turnId, sourceDigest: logicalDigest(turn.content), coverage: "COMPLETE" as const, elementRefs: [],
    nonPersistentReason: "GOVERNED_OWNER_EVENT" as const, classificationOwner: "RESEARCH_PROJECT" as const,
    ownerEventRef: decision.decisionId,
  }))] };
};

export const TERRA_RETENTION_INSTRUCTION = `\nRetourne l'enveloppe structurée demandée, avec reply contenant uniquement la réponse française naturelle visible.
SCIENTIFIC_THINKING porte la qualification sémantique de chaque source : classifie exhaustivement le dernier USER et ta réponse en éléments scientifiques minimum suffisants, ou déclare explicitement NO_SCIENTIFIC_MEANING/PRESENTATION_ONLY. Pas de copie systématique du texte complet, pas de résumé du transcript ni de nouvelle synthèse du Project. Conserve chaque négation, condition, incertitude et relation matérielle. Un fragment adopté ne couvre pas le reste du message. Si la couverture est incertaine, déclare PARTIAL/UNKNOWN ; ne prétends jamais COMPLETE par défaut. Une suggestion NOXIA reste PROPOSED_NOT_ADOPTED.
Les dispositions ne concernent que les refs actives fournies et une direction USER explicite dans ce tour ; une absence, ancienneté, silence ou simple similarité ne ferme jamais une contribution. SUPERSEDED exige replacementId d'un nouvel élément USER. Une fermeture partielle n'élimine pas les autres éléments. candidateBindings exprime une correspondance sémantique précise avec un changement natif validé déjà fourni, ancré à la même source ; ce lien n'adopte rien. Aucun write Project/QRY/Review/DOC. Aucun contenu historique clos dans la réponse nominale.`;
