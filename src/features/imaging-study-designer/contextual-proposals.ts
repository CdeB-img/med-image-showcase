import type { ContextualScientificProposal } from "../scientific-thinking/contextual-understanding.js";
import type { ImagingDesignInput, ImagingDesignResult } from "./types.js";

/** Competence delegated to Imaging on the shared provider call, not transferred
 * to Scientific Thinking. Native Knowledge support and feasibility stay bounded. */
export const IMAGING_CONTEXTUAL_PROPOSAL_INSTRUCTION = `Contribution demandée à Imaging : proposer des dimensions d'observation et de mesure selon le phénomène, la finalité et la modalité explicitement discutés dans son input natif. Séparer propriété, méthode, acquisition, lecture et valeur. Les méthodes sont des options, sans séquence obligatoire, timing fixé, rôle de critère ni adoption. Respecter ressources, séquences, injection et disponibilité ; expliciter chaque dépendance avec requiredResourceRefs. Ne pas choisir l'objectif scientifique. Attribuer owner IMAGING aux seules propositions spécialisées de mesure/imagerie ; leur provenance est une contribution provider candidate du domaine, pas une preuve supplémentaire du résultat natif.`;

/** Imaging retains ownership of non-adopted specialized methods before Project. */
export const acceptImagingContextualProposals = (input: {
  context: null | Readonly<{ input: ImagingDesignInput; result: ImagingDesignResult }>;
  proposals: readonly ContextualScientificProposal[];
}) => {
  if (!input.context || input.context.result.provenance.inputRef !== input.context.input.inputId
    || input.context.result.projectWriteAuthorized
    || input.context.result.candidateIsAdopted
    || input.proposals.some(p => p.owner !== "IMAGING")) throw new Error("IMAGING_CONTEXTUAL_HANDOFF_INVALID");
  return Object.freeze({ owner: "IMAGING" as const, inputRef: input.context.input.inputId,
    resultRef: input.context.result.resultId, proposalRefs: input.proposals.map(p => p.ref), projectWrites: 0 as const });
};

export const acceptImagingStudyStrategyCandidates = (input: {
  context: null | Readonly<{ input: ImagingDesignInput; result: ImagingDesignResult }>;
  atoms: readonly import("../scientific-thinking/contextual-study-proposal.js").StudyProposalAtom[];
}) => {
  if (!input.context || input.context.result.provenance.inputRef !== input.context.input.inputId
    || input.context.result.projectWriteAuthorized || input.context.result.candidateIsAdopted
    || input.atoms.some(a => a.owner !== "IMAGING" || !["MEASUREMENTS", "ENDPOINTS"].includes(a.area))) throw new Error("IMAGING_STRATEGY_HANDOFF_INVALID");
  return { owner: "IMAGING" as const, contextRef: input.context.result.resultId, atomRefs: input.atoms.map(a => a.ref),
    status: "CANDIDATES_NOT_ADOPTED" as const, projectWrites: 0 as const };
};
