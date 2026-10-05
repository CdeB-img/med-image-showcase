/** Technical envelope of the existing full snapshot, not a scientific norm or
 * an admission/budget bypass. 128 permits several iterative additions beyond
 * a rich first proposal, rather than fitting the incident's 73 specifically.
 * Output tokens include reasoning. Existing context/cost guards still admit
 * each exact request; maximal text/relations are not promised to fit together.
 */
const maxAtoms = 128;
export const STUDY_PROPOSAL_CAPACITY = Object.freeze({
  minAtoms: 8,
  maxAtoms,
  maxArbitrations: 8,
  maxOptionsPerArbitration: 5,
  maxDimensioningScenarios: 5,
  maxRejectedHistoryEntries: 2 * maxAtoms,
  workingDraftMaxOutputTokens: 64_000,
});

export class StudyProposalCapacityError extends Error {
  constructor(readonly dimension: string, readonly required: number, readonly maximum: number) {
    super("STUDY_PROPOSAL_CAPACITY_PREFLIGHT_REJECTED");
  }
}

/** Structural lower bound only, never a scientific estimate of future additions.
 * Reuse the FULL SNAPSHOT collections; no truncation/reconstruction/delta.
 * A future semantic expansion still undergoes the normal output validation.
 */
export const preflightStudyProposalCapacity = (
  previous: { atoms: readonly { ref: string; dependsOn: readonly string[] }[];
    arbitrations: readonly { options: readonly { atomRefs: readonly string[] }[] }[];
    dimensioningScenarios: readonly { branchAtomRefs: readonly string[]; analysisAtomRef?: string }[] } | null | undefined,
  rejectedHistoryCount: number,
) => {
  const bounded = (dimension: string, required: number, maximum: number) => {
    if (required > maximum) throw new StudyProposalCapacityError(dimension, required, maximum);
  };
  bounded("REJECTED_HISTORY", rejectedHistoryCount, STUDY_PROPOSAL_CAPACITY.maxRejectedHistoryEntries);
  if (!previous) return { minimumSnapshotAtoms: 0 };
  bounded("ATOMS", previous.atoms.length, STUDY_PROPOSAL_CAPACITY.maxAtoms);
  bounded("ARBITRATIONS", previous.arbitrations.length, STUDY_PROPOSAL_CAPACITY.maxArbitrations);
  bounded("DIMENSIONING_SCENARIOS", previous.dimensioningScenarios.length, STUDY_PROPOSAL_CAPACITY.maxDimensioningScenarios);
  const refs = new Set(previous.atoms.flatMap(atom => [atom.ref, ...atom.dependsOn]));
  for (const atom of previous.atoms) bounded("DEPENDENCY_REFS", atom.dependsOn.length, STUDY_PROPOSAL_CAPACITY.maxAtoms);
  for (const arbitration of previous.arbitrations) {
    bounded("OPTIONS", arbitration.options.length, STUDY_PROPOSAL_CAPACITY.maxOptionsPerArbitration);
    for (const option of arbitration.options) {
      bounded("OPTION_REFS", option.atomRefs.length, STUDY_PROPOSAL_CAPACITY.maxAtoms);
      for (const ref of option.atomRefs) refs.add(ref);
    }
  }
  for (const scenario of previous.dimensioningScenarios) {
    bounded("SCENARIO_REFS", scenario.branchAtomRefs.length, STUDY_PROPOSAL_CAPACITY.maxAtoms);
    for (const ref of scenario.branchAtomRefs) refs.add(ref);
    if (scenario.analysisAtomRef) refs.add(scenario.analysisAtomRef);
  }
  bounded("REFERENTIAL_CLOSURE", refs.size, STUDY_PROPOSAL_CAPACITY.maxAtoms);
  return { minimumSnapshotAtoms: refs.size };
};
