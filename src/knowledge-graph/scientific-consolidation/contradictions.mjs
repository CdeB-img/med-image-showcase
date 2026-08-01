import { consolidatedAssertionRevisions, consolidatedEvidenceLinks } from "./review.mjs";

const syntheticHematocritAssertion = consolidatedAssertionRevisions.find((assertion) => assertion.stableId.endsWith(":synthetic-hct-acceptable-agreement"));
const evidence = consolidatedEvidenceLinks.filter((link) => link.assertionRevisionId === syntheticHematocritAssertion?.revisionId);

export const p4rContradictionAssessments = Object.freeze([
  Object.freeze({
    contradictionId: "noxia:radiology:contradiction:ecv-t1:synthetic-hematocrit-transferability:p4r",
    assertionRevisionIds: Object.freeze(syntheticHematocritAssertion ? [syntheticHematocritAssertion.revisionId] : []),
    evidenceLinkIds: Object.freeze(evidence.map((link) => link.evidenceLinkId).sort()),
    initialClassification: "UNRESOLVED_CONTEXT_DEPENDENT",
    finalClassification: "CONTEXT_DIFFERENCE",
    sameSubject: true,
    comparableContexts: false,
    contextComparison: Object.freeze({
      population: "Different derivation and validation cohorts",
      modality: "CMR in both sources",
      fieldStrength: "The adverse transferability result is explicitly limited to 3 T",
      method: "Locally derived synthetic-hematocrit models are not identical",
      center: "Both are single-center and do not demonstrate intersite transferability",
      endpoint: "Agreement in a local cohort versus clinically relevant classification error",
    }),
    decision: "PRESERVE_DIVERGENCE_WITH_CONTEXT",
    rationale: "The findings should not be collapsed into one universal conclusion. They differ materially in field strength, local model and validation context.",
  }),
]);

export const contradictionSummary = Object.freeze({
  total: p4rContradictionAssessments.length,
  trueContradictions: p4rContradictionAssessments.filter((item) => item.finalClassification === "TRUE_CONTRADICTION").length,
  contextDifferences: p4rContradictionAssessments.filter((item) => item.finalClassification === "CONTEXT_DIFFERENCE").length,
  methodDifferences: p4rContradictionAssessments.filter((item) => item.finalClassification === "METHOD_DIFFERENCE").length,
  unresolved: p4rContradictionAssessments.filter((item) => item.finalClassification === "INSUFFICIENT_INFORMATION").length,
});

