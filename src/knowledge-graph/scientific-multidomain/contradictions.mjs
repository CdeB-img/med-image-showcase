import { sha256Digest } from "../migration/stable-json.mjs";
import { multidomainAssertionRevisions } from "./assertions.mjs";

const byKey = Object.fromEntries(multidomainAssertionRevisions.map((item) => [item.stableId.split(":").at(-1), item]));

const definitions = [
  {
    contradictionId: "noxia:radiology:p5:contrast:diffusion:phantom-versus-invivo",
    domainId: "diffusion-adc",
    keys: ["phantom-isocenter-three-percent", "brain-multicenter-cv", "small-structures-more-variable"],
    classification: "CONTEXT_DIFFERENCE",
    decision: "PRESERVE_SEPARATE_PHANTOM_AND_IN_VIVO_PERFORMANCE_CONTEXTS",
    rationale: "Tight phantom performance and wider in-vivo regional variability address different objects, anatomy and acquisition conditions.",
  },
  {
    contradictionId: "noxia:radiology:p5:contrast:perfusion:software-agreement",
    domainId: "cerebral-perfusion",
    keys: ["different-postprocessing-poor-correlation", "common-postprocessing-strong-correlation", "two-packages-agreement-context", "three-packages-different-volumes"],
    classification: "METHOD_DIFFERENCE",
    decision: "PRESERVE_SOFTWARE_AND_WORKFLOW_CONTEXT",
    rationale: "Reported agreement changes with package pair, common versus separate segmentation, cohort and output definition.",
  },
  {
    contradictionId: "noxia:radiology:p5:contrast:cardiac:lge-quantification",
    domainId: "myocardial-tissue-characterization",
    keys: ["hcm-three-sd-closest-manual", "hcm-fwhm-reproducible", "hcm-fwhm-underestimated", "myocarditis-threshold-dependent"],
    classification: "METHOD_DIFFERENCE",
    decision: "PRESERVE_ACCURACY_REPRODUCIBILITY_AND_DISEASE_CONTEXTS",
    rationale: "A method can be more reproducible while producing a systematically different extent; disease context also changes method behavior.",
  },
  {
    contradictionId: "noxia:radiology:p5:contrast:spectral:iodine-platform-variability",
    domainId: "spectral-ct",
    keys: ["iodine-accuracy-system-dependent", "intermanufacturer-variability", "normalization-reduces-not-erases", "lod-platform-size"],
    classification: "PLATFORM_DIFFERENCE",
    decision: "PRESERVE_PLATFORM_SIZE_DOSE_AND_NORMALIZATION_CONTEXTS",
    rationale: "Normalization can reduce observed variability without establishing platform interchangeability or common detection limits.",
  },
];

export const multidomainContradictionAssessments = Object.freeze(definitions.map((item) => {
  const assertions = item.keys.map((key) => byKey[key]);
  if (assertions.some((assertion) => !assertion)) throw new Error(`Unknown assertion in contradiction ${item.contradictionId}`);
  const material = { ...item, assertionRevisionIds: assertions.map((assertion) => assertion.revisionId) };
  return Object.freeze({
    ...item,
    assertionRevisionIds: Object.freeze(material.assertionRevisionIds),
    sameSubjectVerified: false,
    sameContextVerified: false,
    trueContradiction: item.classification === "TRUE_CONTRADICTION",
    resolutionApplied: false,
    digest: sha256Digest(material),
  });
}));

export const multidomainContradictionSummary = Object.freeze({
  total: multidomainContradictionAssessments.length,
  trueContradictions: multidomainContradictionAssessments.filter((item) => item.classification === "TRUE_CONTRADICTION").length,
  contextDifferences: multidomainContradictionAssessments.filter((item) => item.classification === "CONTEXT_DIFFERENCE").length,
  methodDifferences: multidomainContradictionAssessments.filter((item) => item.classification === "METHOD_DIFFERENCE").length,
  platformDifferences: multidomainContradictionAssessments.filter((item) => item.classification === "PLATFORM_DIFFERENCE").length,
  artificiallyResolved: multidomainContradictionAssessments.filter((item) => item.resolutionApplied).length,
});

