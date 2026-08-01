import { sha256Digest } from "../migration/stable-json.mjs";
import { P5_DOMAIN_IDS } from "./constants.mjs";

const genericDependencies = Object.freeze([
  "stable-identity-and-revision",
  "source-and-localizer-provenance",
  "atomic-scientific-assertion",
  "typed-evidence-link",
  "applicability-context",
  "multidimensional-source-quality",
  "automated-scientific-review",
  "contradiction-classification",
  "deterministic-synthesis",
  "multidimensional-readiness",
  "internal-projection-publication-guards",
]);

const definitions = [
  {
    domainId: "diffusion-adc",
    objective: "Represent diffusion-weighted acquisition, ADC derivation, metrology, interpretation limits and documented applications without conflating sequence, map, value and finding.",
    coreConcepts: ["diffusion", "dwi", "b-value", "adc-map", "adc-value", "diffusion-restriction"],
    boundaryConcepts: ["perfusion-at-low-b-value", "ischemic-core", "tumor-response"],
    modalities: ["MR"],
    documentaryApplications: ["acute-ischemic-stroke", "oncologic-response", "multicenter-quantitative-imaging"],
    soughtSourceTypes: ["CONSENSUS", "QIBA_PROFILE", "MULTICENTER_STUDY", "TECHNICAL_VALIDATION", "REVIEW"],
    exclusions: ["clinical-threshold-without-complete-context", "nonhuman-result-generalized-to-humans", "diffusion-tensor-imaging-outside-boundary"],
    expectedQueries: ["ADC + diffusion", "ADC + limitations", "ADC + reproducibility"],
    expectedSyntheses: ["definition-and-methods", "technical-limitations", "documented-applications"],
    expectedInternalProjections: ["adc-scientific-sheet", "adc-limitations-state-of-knowledge"],
    domainExtensions: ["b-value-context", "gradient-nonlinearity", "diffusion-phantom-metrology"],
  },
  {
    domainId: "cerebral-perfusion",
    objective: "Represent CT and MR perfusion acquisitions, deconvolution, parametric measurements and lesion segmentations while preserving algorithm and software dependence.",
    coreConcepts: ["ct-perfusion", "mr-dsc-perfusion", "aif", "deconvolution", "cbf", "cbv", "mtt", "tmax"],
    boundaryConcepts: ["oef", "cmro2", "diffusion-lesion", "clinical-triage"],
    modalities: ["CT", "MR"],
    documentaryApplications: ["acute-ischemic-stroke", "brain-tumor-perfusion"],
    soughtSourceTypes: ["PRACTICE_GUIDANCE", "RECOMMENDATION", "METHOD_COMPARISON", "CALIBRATION_STUDY", "REVIEW"],
    exclusions: ["software-equivalence-assumption", "threshold-without-algorithm", "automated-treatment-recommendation"],
    expectedQueries: ["Tmax + CT perfusion", "CBF + deconvolution", "software + differences"],
    expectedSyntheses: ["parameters-and-methods", "threshold-variability", "software-and-approach-differences"],
    expectedInternalProjections: ["tmax-scientific-sheet", "cbf-cbv-tmax-documentary-comparison"],
    domainExtensions: ["arterial-input-function", "deconvolution-algorithm", "lesion-segmentation-threshold-context"],
  },
  {
    domainId: "myocardial-tissue-characterization",
    objective: "Represent LGE acquisition and findings, microvascular obstruction and intramyocardial hemorrhage as context-dependent roles rather than mandatory quantitative biomarkers.",
    coreConcepts: ["lge-acquisition", "lge-finding", "psir", "mvo", "intramyocardial-hemorrhage"],
    boundaryConcepts: ["t1-mapping", "ecv", "t2-mapping", "myocarditis", "myocardial-infarction"],
    modalities: ["MR"],
    documentaryApplications: ["myocardial-infarction", "myocarditis", "cardiomyopathy"],
    soughtSourceTypes: ["SCMR_CONSENSUS", "SYSTEMATIC_REVIEW", "METHOD_COMPARISON", "PROSPECTIVE_STUDY", "REVIEW"],
    exclusions: ["finding-automatically-cast-as-measure", "prognostic-causality", "universal-lge-threshold"],
    expectedQueries: ["LGE + quantification", "MVO + infarction", "intramyocardial hemorrhage + MR"],
    expectedSyntheses: ["definitions-and-acquisitions", "quantification-methods", "documented-value-and-limitations"],
    expectedInternalProjections: ["lge-scientific-sheet", "lge-mvo-hemorrhage-documentary-comparison"],
    domainExtensions: ["finding-role", "endpoint-role", "inversion-time-and-nulling", "iron-sensitive-sequence-context"],
  },
  {
    domainId: "spectral-ct",
    objective: "Represent distinct spectral CT acquisition technologies, reconstruction outputs and iodine metrology without treating commercial implementations as interchangeable evidence.",
    coreConcepts: ["spectral-ct", "dual-energy-ct", "material-decomposition", "iodine-map", "vmi", "vnc", "photon-counting-ct"],
    boundaryConcepts: ["ct-ecv", "contrast-enhanced-ct", "radiation-dose", "clinical-outcome"],
    modalities: ["CT"],
    documentaryApplications: ["iodine-quantification", "artifact-reduction", "material-characterization"],
    soughtSourceTypes: ["TECHNICAL_REVIEW", "PHANTOM_STUDY", "INTERPLATFORM_COMPARISON", "METHOD_VALIDATION"],
    exclusions: ["manufacturer-marketing-as-clinical-proof", "platform-equivalence-assumption", "iodine-map-conflated-with-ct-ecv"],
    expectedQueries: ["spectral CT + iodine map", "spectral CT + reproducibility", "VMI + limitations"],
    expectedSyntheses: ["technologies", "quantitative-outputs", "reproducibility-and-limitations"],
    expectedInternalProjections: ["spectral-ct-scientific-sheet", "iodine-quantification-state-of-knowledge"],
    domainExtensions: ["spectral-acquisition-implementation", "material-basis-decomposition", "energy-level-context", "platform-specific-calibration"],
  },
];

export const scientificDomainManifests = Object.freeze(definitions.map((definition) => {
  const material = { ...definition, readiness: "P5_EVALUATED_SEPARATELY", genericDependencies };
  return Object.freeze({
    ...material,
    manifestId: `noxia:radiology:scientific-domain-manifest:${definition.domainId}`,
    manifestVersion: "1.0.0",
    dependencies: genericDependencies,
    ecvT1Dependency: false,
    deterministicDigest: sha256Digest(material),
  });
}).sort((a, b) => a.domainId.localeCompare(b.domainId)));

export const manifestByDomainId = Object.freeze(Object.fromEntries(scientificDomainManifests.map((item) => [item.domainId, item])));

if (P5_DOMAIN_IDS.some((domainId) => !manifestByDomainId[domainId])) throw new Error("P5 domain manifest registry is incomplete");

