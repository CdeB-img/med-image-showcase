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
