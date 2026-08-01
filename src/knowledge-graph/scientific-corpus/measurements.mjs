import { createContractRecord } from "../scientific-model-factories.mjs";
import { conceptBySlug } from "./concepts.mjs";
import { applicabilityContexts } from "./contexts.mjs";
import { sourceByKey } from "./sources.mjs";

const ref = (key) => sourceByKey[key].revisionId;
const quantitative = (recordType, slug, values) => createContractRecord(recordType, {
  stableId: `noxia:radiology:quantitative:${slug}`,
  revisionId: `noxia:radiology:quantitative:${slug}:revision:1`,
  status: "ACTIVE",
  quantity: values.quantity,
  unit: values.unit ?? null,
  formula: values.formula ?? null,
  inputs: values.inputs ?? [],
  method: values.method,
  sequence: values.sequence ?? null,
  protocol: values.protocol ?? null,
  timing: values.timing ?? null,
  uncertainty: values.uncertainty ?? null,
  precision: values.precision ?? null,
  repeatability: values.repeatability ?? null,
  reproducibility: values.reproducibility ?? null,
  bias: values.bias ?? null,
  referenceRange: null,
  threshold: null,
  normalization: values.normalization ?? null,
  qualityStatus: "SOURCE_LOCALIZED_AUTOMATED_REVIEW_ONLY",
  sourceRefs: values.sourceKeys.map(ref).sort(),
  value: null,
  population: values.population ?? null,
  context: values.context ?? null,
  validFrom: null,
  validUntil: null,
  assumptions: values.assumptions ?? [],
  limitations: values.limitations ?? [],
  publicContent: false,
});

export const measurementDefinitions = Object.freeze([
  quantitative("MeasurementDefinition", "t1", {
    quantity: "LONGITUDINAL_RELAXATION_TIME",
    unit: "millisecond",
    method: conceptBySlug["myocardial-t1-mapping"],
    sourceKeys: ["moon-2013-consensus", "messroghli-2017-consensus"],
    context: applicabilityContexts.mrGeneral.contextId,
    limitations: ["The observed value is method-, field-strength- and context-dependent; this record defines no normal range."],
  }),
  quantitative("MeasurementDefinition", "r1", {
    quantity: "LONGITUDINAL_RELAXATION_RATE",
    unit: "inverse_second",
    formula: "R1 = 1 / T1",
    inputs: [{ conceptId: conceptBySlug["native-myocardial-t1"], role: "T1", required: true }],
    method: "RECIPROCAL_TRANSFORMATION",
    sourceKeys: ["moon-2013-consensus", "kellman-2012-ecv"],
    context: applicabilityContexts.mrEcv.contextId,
    assumptions: ["T1 must be expressed in a unit compatible with the requested R1 unit."],
  }),
  quantitative("MeasurementDefinition", "delta-r1", {
    quantity: "CHANGE_IN_LONGITUDINAL_RELAXATION_RATE",
    unit: "inverse_second",
    formula: "DeltaR1 = R1_post - R1_pre",
    inputs: [
      { conceptId: conceptBySlug["post-contrast-myocardial-t1"], role: "R1_post_input", required: true },
      { conceptId: conceptBySlug["native-myocardial-t1"], role: "R1_pre_input", required: true },
    ],
    method: "POST_MINUS_PRE_CONTRAST_R1",
    sourceKeys: ["moon-2013-consensus", "kellman-2012-ecv"],
    context: applicabilityContexts.mrEcv.contextId,
  }),
  quantitative("MeasurementDefinition", "hematocrit", {
    quantity: "ERYTHROCYTE_VOLUME_FRACTION",
    unit: "fraction",
    method: "DIRECT_BLOOD_SAMPLE_UNLESS_EXPLICITLY_STATED_OTHERWISE",
    sourceKeys: ["moon-2013-consensus", "kellman-2012-ecv"],
    context: applicabilityContexts.mrEcv.contextId,
    limitations: ["No synthetic substitute is assumed by this definition."],
  }),
]);

export const measurementMethods = Object.freeze([
  quantitative("MeasurementMethod", "myocardial-t1-mapping", {
    quantity: "MYOCARDIAL_T1",
    unit: "millisecond",
    method: conceptBySlug["myocardial-t1-mapping"],
    sequence: "SOURCE_SPECIFIC",
    sourceKeys: ["messroghli-2017-consensus", "kellman-2014-accuracy"],
    context: applicabilityContexts.mrGeneral.contextId,
    uncertainty: "METHOD_AND_ACQUISITION_DEPENDENT",
    limitations: ["MOLLI, ShMOLLI and SASHA are not interchangeable labels or acquisitions."],
  }),
  quantitative("MeasurementMethod", "cmr-ecv-partition", {
    quantity: "MYOCARDIAL_EXTRACELLULAR_VOLUME_FRACTION",
    unit: "fraction",
    method: "CMR_PRE_POST_T1_PARTITION_COEFFICIENT_WITH_HEMATOCRIT",
    sourceKeys: ["kellman-2012-ecv", "moon-2013-consensus"],
    context: applicabilityContexts.mrEcv.contextId,
    assumptions: ["Contrast-agent distribution equilibrium between blood plasma and myocardial interstitium is sufficiently approximated for the selected protocol and tissue."],
    limitations: ["The equilibrium assumption may fail in recently infarcted myocardium.", "Pre/post maps require adequate spatial correspondence."],
  }),
  quantitative("MeasurementMethod", "ct-ecv-single-energy", {
    quantity: "MYOCARDIAL_EXTRACELLULAR_VOLUME_FRACTION",
    unit: "fraction",
    method: "SINGLE_ENERGY_CT_PRE_DELAYED_ATTENUATION_PARTITION_WITH_HEMATOCRIT",
    sourceKeys: ["cundari-2023-ct-method", "nacif-2012-ct"],
    context: applicabilityContexts.ctEcvBolus.contextId,
    timing: { latePhaseMinutes: { min: 3, max: 10 }, sourceRevisionId: ref("cundari-2023-ct-method") },
    limitations: ["Requires non-contrast and delayed acquisitions and therefore additional radiation exposure.", "CT validation evidence remains more limited than CMR evidence in this corpus."],
  }),
  quantitative("MeasurementMethod", "ct-ecv-spectral-iodine", {
    quantity: "MYOCARDIAL_EXTRACELLULAR_VOLUME_FRACTION",
    unit: "fraction",
    method: "SPECTRAL_CT_IODINE_DENSITY_PARTITION_WITH_HEMATOCRIT",
    sourceKeys: ["cundari-2023-ct-method"],
    context: applicabilityContexts.ctEcvBolus.contextId,
    limitations: ["Spectral iodine-density and single-energy attenuation methods have different inputs and are not represented as one acquisition."],
  }),
]);

export const observations = Object.freeze([
  quantitative("Observation", "native-myocardial-t1-observation", { quantity: "NATIVE_MYOCARDIAL_T1", unit: "millisecond", method: conceptBySlug["myocardial-t1-mapping"], sourceKeys: ["messroghli-2017-consensus"], context: applicabilityContexts.mrGeneral.contextId }),
  quantitative("Observation", "post-contrast-myocardial-t1-observation", { quantity: "POST_CONTRAST_MYOCARDIAL_T1", unit: "millisecond", method: conceptBySlug["myocardial-t1-mapping"], sourceKeys: ["kellman-2012-ecv"], context: applicabilityContexts.mrEcv.contextId, timing: "SOURCE_SPECIFIC" }),
  quantitative("Observation", "native-blood-t1-observation", { quantity: "NATIVE_BLOOD_T1", unit: "millisecond", method: conceptBySlug["myocardial-t1-mapping"], sourceKeys: ["kellman-2012-ecv"], context: applicabilityContexts.mrEcv.contextId }),
  quantitative("Observation", "post-contrast-blood-t1-observation", { quantity: "POST_CONTRAST_BLOOD_T1", unit: "millisecond", method: conceptBySlug["myocardial-t1-mapping"], sourceKeys: ["kellman-2012-ecv"], context: applicabilityContexts.mrEcv.contextId, timing: "SOURCE_SPECIFIC" }),
  quantitative("Observation", "pre-contrast-myocardial-ct-attenuation", { quantity: "PRE_CONTRAST_MYOCARDIAL_ATTENUATION", unit: "HU", method: "SINGLE_ENERGY_CT", sourceKeys: ["cundari-2023-ct-method"], context: applicabilityContexts.ctEcvBolus.contextId }),
  quantitative("Observation", "delayed-myocardial-ct-attenuation", { quantity: "DELAYED_MYOCARDIAL_ATTENUATION", unit: "HU", method: "SINGLE_ENERGY_CT", sourceKeys: ["cundari-2023-ct-method"], context: applicabilityContexts.ctEcvBolus.contextId }),
  quantitative("Observation", "pre-contrast-blood-ct-attenuation", { quantity: "PRE_CONTRAST_BLOOD_ATTENUATION", unit: "HU", method: "SINGLE_ENERGY_CT", sourceKeys: ["cundari-2023-ct-method"], context: applicabilityContexts.ctEcvBolus.contextId }),
  quantitative("Observation", "delayed-blood-ct-attenuation", { quantity: "DELAYED_BLOOD_ATTENUATION", unit: "HU", method: "SINGLE_ENERGY_CT", sourceKeys: ["cundari-2023-ct-method"], context: applicabilityContexts.ctEcvBolus.contextId }),
]);

export const derivedMeasurements = Object.freeze([
  quantitative("DerivedMeasurement", "myocardial-ecv-mr", {
    quantity: "MYOCARDIAL_EXTRACELLULAR_VOLUME_FRACTION",
    unit: "fraction",
    formula: "ECV_MR = (1 - Hct) * ((1/T1_myo_post - 1/T1_myo_pre) / (1/T1_blood_post - 1/T1_blood_pre))",
    inputs: [
      { conceptId: conceptBySlug["native-myocardial-t1"], symbol: "T1_myo_pre", required: true },
      { conceptId: conceptBySlug["post-contrast-myocardial-t1"], symbol: "T1_myo_post", required: true },
      { conceptId: conceptBySlug["native-blood-t1"], symbol: "T1_blood_pre", required: true },
      { conceptId: conceptBySlug["post-contrast-blood-t1"], symbol: "T1_blood_post", required: true },
      { conceptId: conceptBySlug.hematocrit, symbol: "Hct", required: true },
    ],
    method: "CMR_PRE_POST_T1_PARTITION_COEFFICIENT_WITH_HEMATOCRIT",
    sourceKeys: ["kellman-2012-ecv", "moon-2013-consensus"],
    context: applicabilityContexts.mrEcv.contextId,
    assumptions: ["Extracellular contrast agent.", "Sufficient contrast distribution equilibrium for the selected tissue and timing.", "Compatible pre/post map registration."],
    limitations: ["No reference range or threshold is encoded.", "Timing, mapping method, field strength and hematocrit measurement remain applicability variables."],
  }),
  quantitative("DerivedMeasurement", "myocardial-ecv-ct-single-energy", {
    quantity: "MYOCARDIAL_EXTRACELLULAR_VOLUME_FRACTION",
    unit: "fraction",
    formula: "ECV_CT = (1 - Hct) * ((HU_myo_delayed - HU_myo_pre) / (HU_blood_delayed - HU_blood_pre))",
    inputs: [
      { conceptId: conceptBySlug["pre-contrast-myocardial-ct-attenuation"], symbol: "HU_myo_pre", required: true },
      { conceptId: conceptBySlug["delayed-myocardial-ct-attenuation"], symbol: "HU_myo_delayed", required: true },
      { conceptId: conceptBySlug["pre-contrast-blood-ct-attenuation"], symbol: "HU_blood_pre", required: true },
      { conceptId: conceptBySlug["delayed-blood-ct-attenuation"], symbol: "HU_blood_delayed", required: true },
      { conceptId: conceptBySlug.hematocrit, symbol: "Hct", required: true },
    ],
    method: "SINGLE_ENERGY_CT_PRE_DELAYED_ATTENUATION_PARTITION_WITH_HEMATOCRIT",
    sourceKeys: ["cundari-2023-ct-method"],
    context: applicabilityContexts.ctEcvBolus.contextId,
    assumptions: ["Iodinated extracellular contrast agent.", "Pre-contrast and delayed attenuation measurements are spatially compatible."],
    limitations: ["This formula is not the CMR T1 formula.", "No reference range or diagnostic threshold is encoded."],
  }),
  quantitative("DerivedMeasurement", "myocardial-ecv-ct-spectral", {
    quantity: "MYOCARDIAL_EXTRACELLULAR_VOLUME_FRACTION",
    unit: "fraction",
    formula: "ECV_CT_spectral = (1 - Hct) * (iodine_density_myo / iodine_density_blood)",
    inputs: [
      { conceptId: conceptBySlug["iodine-density-change"], symbol: "iodine_density_myo", compartment: "MYOCARDIUM", required: true },
      { conceptId: conceptBySlug["iodine-density-change"], symbol: "iodine_density_blood", compartment: "BLOOD", required: true },
      { conceptId: conceptBySlug.hematocrit, symbol: "Hct", required: true },
    ],
    method: "SPECTRAL_CT_IODINE_DENSITY_PARTITION_WITH_HEMATOCRIT",
    sourceKeys: ["cundari-2023-ct-method"],
    context: applicabilityContexts.ctEcvBolus.contextId,
    limitations: ["Spectral CT iodine-density inputs are distinct from single-energy HU differences and from CMR T1 inputs."],
  }),
]);

export const quantitativeModelRecords = Object.freeze([
  ...measurementDefinitions,
  ...measurementMethods,
  ...observations,
  ...derivedMeasurements,
].sort((a, b) => a.revisionId.localeCompare(b.revisionId)));
