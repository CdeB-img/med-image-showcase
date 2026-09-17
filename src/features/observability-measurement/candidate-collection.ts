import type { StudyProposalAtom } from "../scientific-thinking/contextual-study-proposal.js";

/** Pre-adoption declaration qualification. This does not produce a canonical
 * variable, MeasurementDefinition or an observed value. Units remain unknown
 * when the proposal does not provide them. */
export const qualifyCandidateCollection = (atoms: readonly StudyProposalAtom[]) => {
  if (atoms.some(a => !["OBS", "IMAGING", "DATA_MANAGEMENT", "BIOSTATISTICS"].includes(a.owner))) throw new Error("OBS_CANDIDATE_COLLECTION_OWNER_INVALID");
  if (atoms.some(a => a.participantReported && (!a.plannedSource || !a.plannedMethod || a.owner === "IMAGING"))) throw new Error("OBS_PARTICIPANT_COLLECTION_SOURCE_REQUIRED");
  return atoms.filter(a => a.targetType === "CANONICAL_VARIABLE").map(a => ({
    declarationRef: a.ref, label: a.content, sourceOwner: a.owner, unit: a.unit,
    unitStatus: a.unit ? "PROPOSED_NOT_ADOPTED" as const : "UNKNOWN" as const,
    plannedSource: a.plannedSource ?? null, plannedMethod: a.plannedMethod ?? null,
    participantReported: a.participantReported === true && Boolean(a.plannedSource && a.plannedMethod),
    roles: [...a.variableRoles], status: "CANDIDATE_NOT_CANONICAL" as const,
    methodRef: null, observablePropertyRef: null, projectWriteAuthorized: false as const,
    missing: ["Human adoption", "Formal property/method qualification before execution"],
  }));
};
