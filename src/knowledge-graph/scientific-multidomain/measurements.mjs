import { sha256Digest } from "../migration/stable-json.mjs";
import { conceptByKey } from "./concepts.mjs";
import { sourceByPmid } from "./sources.mjs";

const records = [
  ["diffusion-adc", "adc", "adc-value", "monoexponential-adc", "mm²/s", null, ["signal-intensity-at-specified-b-values"], "26892827", ["B_VALUE_SELECTION", "NOISE_FLOOR", "PERFUSION_CONTRIBUTION"]],
  ["diffusion-adc", "b-value", "b-value", "diffusion-gradient-encoding", "s/mm²", null, ["gradient-amplitude", "gradient-duration", "gradient-separation"], "26892827", ["SEQUENCE_IMPLEMENTATION"]],
  ["diffusion-adc", "adc-repeatability", "adc-repeatability", "repeat-measurement-analysis", null, null, ["repeated-adc-observations", "same-specified-conditions"], "23023785", ["CONDITION_DEFINITION_REQUIRED"]],
  ["diffusion-adc", "adc-reproducibility", "adc-reproducibility", "multisystem-comparison", null, null, ["adc-observations", "changed-site-or-system-conditions"], "25802212", ["ANATOMICAL_REGION", "SITE", "SYSTEM", "SEQUENCE"]],

  ["cerebral-perfusion", "cbf", "cbf", "deconvolution", "mL/100 g/min", null, ["tissue-time-curve", "arterial-input-function"], "21640299", ["AIF_SELECTION", "DECONVOLUTION_ALGORITHM"]],
  ["cerebral-perfusion", "cbv", "cbv", "contrast-time-curve-integration", "mL/100 g", null, ["tissue-time-curve", "arterial-input-function"], "21640299", ["BOLUS_TRUNCATION", "NORMALIZATION"]],
  ["cerebral-perfusion", "mtt", "mtt", "central-volume-model", "s", "MTT = CBV / CBF", ["cbv", "cbf"], "21640299", ["MODEL_ASSUMPTION", "ALGORITHM_DEPENDENCE"]],
  ["cerebral-perfusion", "tmax", "tmax", "deconvolution", "s", null, ["deconvolved-residue-function"], "21640299", ["AIF_DELAY", "DECONVOLUTION_ALGORITHM", "NOT_DIRECT_FLOW"]],

  ["myocardial-tissue-characterization", "lge-extent", "lge-finding", "lge-quantification", "% of LV mass", null, ["reference-myocardium", "segmented-myocardium", "enhancement-rule"], "21329899", ["QUANTIFICATION_METHOD", "DISEASE_ETIOLOGY"]],
  ["myocardial-tissue-characterization", "mvo-extent", "microvascular-obstruction", "manual-or-threshold-segmentation", "% of LV mass", null, ["mvo-segmentation", "lv-mass"], "30231886", ["IMAGING_TIME", "DEFINITION"]],
  ["myocardial-tissue-characterization", "imh-presence", "intramyocardial-hemorrhage", "t2-or-t2star-assessment", "categorical", null, ["iron-sensitive-image", "detection-rule"], "23021401", ["SEQUENCE", "TIMING", "DEFINITION"]],
  ["myocardial-tissue-characterization", "myocardial-t2star", "t2-star", "multi-echo-t2star-fitting", "ms", null, ["multi-echo-signals"], "25759823", ["FIELD_STRENGTH", "SEQUENCE", "FIT_METHOD"]],

  ["spectral-ct", "iodine-concentration", "iodine-concentration", "material-decomposition", "mg I/mL", null, ["spectral-projections-or-images", "material-basis", "calibration"], "28168368", ["PLATFORM", "OBJECT_SIZE", "DOSE", "RECONSTRUCTION"]],
  ["spectral-ct", "virtual-energy", "virtual-monoenergetic-image", "vmi-reconstruction", "keV", null, ["spectral-data", "selected-energy"], "30919651", ["NOISE_CONTRAST_TRADEOFF"]],
  ["spectral-ct", "vnc-attenuation", "virtual-non-contrast", "iodine-subtraction", "HU", null, ["contrast-enhanced-spectral-data", "iodine-subtraction-model"], "33411614", ["RESIDUAL_IODINE", "CALCIUM_SUBTRACTION", "PLATFORM"]],
  ["spectral-ct", "effective-atomic-number", "effective-atomic-number", "material-decomposition", "dimensionless", null, ["spectral-data", "implementation-model"], "33411614", ["MODEL_AND_PLATFORM_DEPENDENCE"]],
];

export const multidomainMeasurementRecords = Object.freeze(records.map(([domainId, key, quantityKey, methodKey, unit, formula, inputs, pmid, limitations]) => {
  const source = sourceByPmid[pmid];
  const quantity = conceptByKey[quantityKey];
  const method = conceptByKey[methodKey] ?? null;
  const material = { domainId, key, quantityKey, methodKey, unit, formula, inputs, pmid, limitations };
  return Object.freeze({
    measurementId: `noxia:radiology:measurement:p5:${domainId}:${key}`,
    domainId,
    quantityId: quantity?.stableId ?? quantityKey,
    methodId: method?.stableId ?? `noxia:radiology:documentary-method:${domainId}:${methodKey}`,
    methodLabel: methodKey,
    inputs: Object.freeze(inputs),
    unit,
    unitStatus: unit ? "SOURCE_DOCUMENTED" : "NOT_APPLICABLE_TO_QUALITY_METRIC_DEFINITION",
    formula,
    formulaStatus: formula ? "SOURCE_DOCUMENTED" : "NO_FORMULA_REPRESENTED",
    applicabilityContext: Object.freeze({ domainId, method: methodKey, sourceRevisionId: source.revisionId }),
    sourceRefs: Object.freeze([source.revisionId]),
    limitations: Object.freeze(limitations),
    publicCalculator: false,
    digest: sha256Digest(material),
  });
}));

export const contextualThresholdRecords = Object.freeze([
  {
    thresholdId: "noxia:radiology:threshold:p5:cerebral-perfusion:rcbf-model-independent",
    domainId: "cerebral-perfusion",
    quantityId: conceptByKey.cbf.stableId,
    operator: "LESS_THAN",
    value: 30,
    unit: "% of contralateral reference",
    context: { population: "ACUTE_ISCHEMIC_STROKE", modality: "CT", algorithm: "MODEL_INDEPENDENT_DECONVOLUTION", purpose: "STUDY_CALIBRATED_CORE_DEFINITION" },
    sourceRefs: [sourceByPmid["38052882"].revisionId],
    universal: false,
  },
  {
    thresholdId: "noxia:radiology:threshold:p5:cerebral-perfusion:rcbf-model-based",
    domainId: "cerebral-perfusion",
    quantityId: conceptByKey.cbf.stableId,
    operator: "LESS_THAN",
    value: 15,
    unit: "% of contralateral reference",
    context: { population: "ACUTE_ISCHEMIC_STROKE", modality: "CT", algorithm: "MODEL_BASED_DECONVOLUTION", purpose: "STUDY_CALIBRATED_CORE_DEFINITION" },
    sourceRefs: [sourceByPmid["38052882"].revisionId],
    universal: false,
  },
  {
    thresholdId: "noxia:radiology:threshold:p5:cerebral-perfusion:tmax-six-seconds",
    domainId: "cerebral-perfusion",
    quantityId: conceptByKey.tmax.stableId,
    operator: "GREATER_THAN",
    value: 6,
    unit: "s",
    context: { population: "ACUTE_ISCHEMIC_STROKE", modality: "CT", algorithm: "STUDY_IMPLEMENTATION", purpose: "STUDY_HYPOPERFUSION_DEFINITION" },
    sourceRefs: [sourceByPmid["38052882"].revisionId],
    universal: false,
  },
]);

export const metrologyDistinctions = Object.freeze([
  { term: "repeatability", distinctFrom: ["reproducibility"], definition: "Variation under the same specified conditions." },
  { term: "reproducibility", distinctFrom: ["repeatability"], definition: "Variation when specified conditions change." },
  { term: "correlation", distinctFrom: ["agreement"], definition: "Association between variables without establishing closeness of values." },
  { term: "agreement", distinctFrom: ["correlation"], definition: "Closeness between measurements under an explicit agreement analysis." },
  { term: "precision", distinctFrom: ["accuracy"], definition: "Dispersion of repeated measurements." },
  { term: "accuracy", distinctFrom: ["precision"], definition: "Closeness to an accepted reference value." },
]);

export const multidomainMeasurementSummary = Object.freeze({
  measurements: multidomainMeasurementRecords.length,
  methods: new Set(multidomainMeasurementRecords.map((item) => item.methodId)).size,
  formulas: multidomainMeasurementRecords.filter((item) => item.formula).length,
  contextualThresholds: contextualThresholdRecords.length,
  universalThresholds: contextualThresholdRecords.filter((item) => item.universal).length,
});

