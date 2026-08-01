import { sha256Digest } from "../migration/stable-json.mjs";
import { conceptByKey } from "./concepts.mjs";
import { P5_NOT_APPLICABLE, P5_REVIEWER, P5_REVIEW_TYPE, P5_RETRIEVED_AT, P5_UNKNOWN } from "./constants.mjs";
import { sourceByPmid } from "./sources.mjs";

const A = (domainId, key, subject, predicate, object, statement, pmid, locator, options = {}) => ({
  domainId, key, subject, predicate, object, statement, pmid, locator,
  assertionType: options.assertionType ?? "EntityObjectAssertion",
  relationType: options.relationType ?? "SUPPORTS",
  extractionType: options.extractionType ?? "DIRECT_STATEMENT",
  polarity: options.polarity ?? "POSITIVE",
  modality: options.modality ?? (domainId === "spectral-ct" ? "CT" : "MR"),
  population: options.population ?? P5_NOT_APPLICABLE,
  pathologies: options.pathologies ?? [],
  techniques: options.techniques ?? [],
  measurements: options.measurements ?? [],
  findings: options.findings ?? [],
  limitations: options.limitations ?? [],
  platforms: options.platforms ?? [],
  manufacturers: options.manufacturers ?? [],
  maturity: options.maturity ?? "ESTABLISHED_DOCUMENTARY_KNOWLEDGE",
  confidence: options.confidence ?? "HIGH",
  interpretationLevel: options.interpretationLevel ?? "DIRECT_STATEMENT",
  derivationSteps: options.derivationSteps ?? [],
});

const definitions = [
  // Diffusion / ADC — 24 atomic assertions
  A("diffusion-adc", "dwi-is-acquisition", "dwi", "IS_ACQUISITION_SENSITIVE_TO", "diffusion", "DWI is an MR acquisition method sensitized to molecular diffusion.", "26892827", "PMC4983499 — Introduction, definition of diffusion-weighted imaging", { techniques: ["dwi"] }),
  A("diffusion-adc", "adc-map-is-calculated-output", "adc-map", "IS_CALCULATED_FROM", "dwi", "An ADC map is a calculated output derived from diffusion-weighted acquisitions.", "39377680", "PMC11537247 — QIBA Profile overview, ADC map derivation", { techniques: ["dwi", "adc-map"], measurements: ["adc-value"] }),
  A("diffusion-adc", "adc-is-derived-measurement", "adc-value", "HAS_METROLOGICAL_ROLE", "DerivedMeasurement", "ADC is a derived quantitative measurement rather than an acquisition sequence.", "39377680", "PMC11537247 — Profile claims, ADC as a quantitative imaging biomarker", { measurements: ["adc-value"] }),
  A("diffusion-adc", "adc-unit", "adc-value", "HAS_UNIT", "square-millimetre-per-second", "ADC values are expressed as an area per unit time.", "26892827", "PMC4983499 — Technical considerations, ADC units", { assertionType: "LiteralValueAssertion", measurements: ["adc-value"] }),
  A("diffusion-adc", "b-value-unit", "b-value", "HAS_UNIT", "second-per-square-millimetre", "The b-value is expressed in time per squared distance.", "26892827", "PMC4983499 — Technical considerations, b-value definition", { assertionType: "LiteralValueAssertion", techniques: ["b-value"] }),
  A("diffusion-adc", "adc-depends-on-b-values", "adc-value", "DEPENDS_ON", "b-value", "The estimated ADC depends on the b-values included in its calculation.", "26892827", "PMC4983499 — Acquisition recommendations, choice of b-values", { techniques: ["monoexponential-adc", "b-value"], measurements: ["adc-value"], limitations: ["B_VALUE_DEPENDENCE"] }),
  A("diffusion-adc", "low-b-perfusion-contribution", "low-b-perfusion", "CAN_INFLUENCE", "adc-value", "Perfusion-related signal at low b-values can influence an ADC estimate.", "26892827", "PMC4983499 — Technical considerations, perfusion contribution at low b-values", { techniques: ["b-value"], measurements: ["adc-value"], limitations: ["LOW_B_PERFUSION_CONTRIBUTION"] }),
  A("diffusion-adc", "b-selection-limits-comparability", "b-value", "LIMITS_COMPARABILITY_OF", "adc-value", "Different b-value selections limit direct comparison of ADC estimates.", "28956113", "PMC5811587 — Protocol standardization, b-value harmonization", { measurements: ["adc-value"], limitations: ["B_VALUE_PROTOCOL_HETEROGENEITY"] }),
  A("diffusion-adc", "noise-biases-adc", "adc-value", "IS_LIMITED_BY", "low-signal-noise", "Low signal-to-noise conditions can bias ADC estimation.", "26892827", "PMC4983499 — Technical limitations, noise and fitting", { measurements: ["adc-value"], limitations: ["NOISE_FLOOR_BIAS"] }),
  A("diffusion-adc", "dwi-distortion", "dwi", "IS_LIMITED_BY", "geometric-distortion", "Diffusion-weighted acquisitions can be limited by geometric distortion.", "28956113", "PMC5811587 — Technical quality, distortion control", { techniques: ["dwi"], limitations: ["GEOMETRIC_DISTORTION"] }),
  A("diffusion-adc", "gradient-nonlinearity-offcenter", "gradient-nonlinearity", "CAUSES_SPATIAL_BIAS_IN", "adc-value", "Gradient nonlinearity can produce spatial ADC bias away from isocenter.", "23023785", "PMC3548033 — Results and Discussion, off-center gradient nonlinearity", { measurements: ["adc-value"], limitations: ["GRADIENT_NONLINEARITY"], platforms: ["MULTISYSTEM"] }),
  A("diffusion-adc", "repeatability-distinct", "adc-repeatability", "IS_DISTINCT_FROM", "adc-reproducibility", "ADC repeatability concerns repeated measurements under the same specified conditions.", "26892827", "PMC4983499 — Reproducibility section, terminology", { measurements: ["adc-value"] }),
  A("diffusion-adc", "reproducibility-multiple-factors", "adc-reproducibility", "DEPENDS_ON", "measurement-conditions", "ADC reproducibility can vary with site, device, operator, analysis and software conditions.", "39377680", "PMC11537247 — Sources of variation and conformance requirements", { measurements: ["adc-value"], limitations: ["SITE_DEVICE_OPERATOR_ANALYSIS_VARIATION"], platforms: ["MULTISITE"] }),
  A("diffusion-adc", "phantom-isocenter-three-percent", "adc-reproducibility", "WAS_OBSERVED_AS", "within-about-three-percent", "A 35-system ice-water phantom study reported intersystem ADC reproducibility within about 3% at isocenter after excluding an outlier.", "23023785", "PMC3548033 — Results, intersystem isocenter reproducibility", { assertionType: "QuantitativeAssertion", population: "ICE_WATER_PHANTOM", measurements: ["adc-value"], platforms: ["35_MR_SYSTEMS"], maturity: "STUDY_SPECIFIC_RESULT" }),
  A("diffusion-adc", "phantom-offcenter-ten-percent", "gradient-nonlinearity", "WAS_ASSOCIATED_WITH", "greater-than-ten-percent-bias", "The same phantom study observed ADC bias greater than 10% at some off-center locations.", "23023785", "PMC3548033 — Results, off-center spatial bias", { assertionType: "QuantitativeAssertion", population: "ICE_WATER_PHANTOM", measurements: ["adc-value"], platforms: ["MULTISYSTEM"], maturity: "STUDY_SPECIFIC_RESULT", polarity: "QUALIFIED" }),
  A("diffusion-adc", "brain-multicenter-cv", "adc-reproducibility", "WAS_OBSERVED_AS", "coefficient-of-variation-1-to-7-point-4-percent", "A multicenter brain study reported ADC coefficients of variation ranging from 1% to 7.4% across evaluated regions and sequences.", "25802212", "PMC4403968 — Results, regional ADC reproducibility", { assertionType: "QuantitativeAssertion", population: "HEALTHY_VOLUNTEERS", measurements: ["adc-value"], platforms: ["MULTICENTER_MR"], maturity: "STUDY_SPECIFIC_RESULT" }),
  A("diffusion-adc", "small-structures-more-variable", "adc-reproducibility", "IS_LOWER_IN", "small-anatomical-structures", "The multicenter brain study found greater ADC variability in smaller anatomical structures.", "25802212", "PMC4403968 — Discussion, influence of structure size", { population: "HEALTHY_VOLUNTEERS", measurements: ["adc-value"], limitations: ["SMALL_ROI_VARIABILITY"], maturity: "STUDY_SPECIFIC_RESULT", polarity: "QUALIFIED" }),
  A("diffusion-adc", "qiba-requires-qc", "qiba-adc-profile", "REQUIRES", "quality-control", "The QIBA ADC profile includes acquisition, analysis and quality-control requirements for performance claims.", "39377680", "PMC11537247 — Profile conformance and quality-control sections", { techniques: ["qiba-adc-profile"], maturity: "CONSENSUS_PROFILE" }),
  A("diffusion-adc", "phantom-not-clinical-validation", "diffusion-phantom", "DOES_NOT_ESTABLISH", "clinical-validity", "Phantom conformance does not by itself establish clinical validity of an ADC application.", "38535004", "PMC10969680 — Discussion, transition from phantom validation to clinical application", { relationType: "QUALIFIES", polarity: "QUALIFIED", limitations: ["PHANTOM_TO_CLINICAL_GENERALIZATION"] }),
  A("diffusion-adc", "dwi-early-stroke-sensitivity", "dwi", "CAN_DETECT", "acute-ischemic-change", "DWI can detect ischemic tissue changes early after acute stroke onset.", "33836457", "PubMed abstract — Background and review scope on acute ischemic stroke", { population: "ACUTE_ISCHEMIC_STROKE", pathologies: ["acute-ischemic-stroke"], maturity: "REVIEW_CONCLUSION", confidence: "MODERATE" }),
  A("diffusion-adc", "dwi-lesion-can-reverse", "diffusion-restriction", "CAN_BE", "reversible", "A DWI lesion can reverse in some acute ischemic stroke contexts.", "33836457", "PubMed abstract — Interpretation pitfalls, lesion reversibility", { population: "ACUTE_ISCHEMIC_STROKE", pathologies: ["acute-ischemic-stroke"], relationType: "QUALIFIES", polarity: "QUALIFIED", maturity: "REVIEW_CONCLUSION", confidence: "MODERATE" }),
  A("diffusion-adc", "dwi-not-irreversible-core", "diffusion-restriction", "IS_NOT_EQUIVALENT_TO", "irreversible-infarct-core", "A DWI lesion is not invariably equivalent to irreversibly infarcted tissue.", "33836457", "PubMed abstract — Interpretation pitfalls, DWI lesion meaning", { population: "ACUTE_ISCHEMIC_STROKE", pathologies: ["acute-ischemic-stroke"], relationType: "REFUTES", polarity: "NEGATIVE", maturity: "REVIEW_CONCLUSION", confidence: "MODERATE" }),
  A("diffusion-adc", "dwi-false-negative", "dwi", "CAN_HAVE", "false-negative-result", "DWI can be false negative in acute ischemic stroke.", "33836457", "PubMed abstract — Interpretation pitfalls, false-negative DWI", { population: "ACUTE_ISCHEMIC_STROKE", pathologies: ["acute-ischemic-stroke"], limitations: ["FALSE_NEGATIVE_DWI"], polarity: "QUALIFIED", confidence: "MODERATE" }),
  A("diffusion-adc", "adc-calculation-more-variable-than-roi", "adc-value", "VARIABILITY_WAS_MORE_INFLUENCED_BY", "calculation-conditions", "An MRI-linac consortium study found ADC derivation conditions influenced variability more than delineation conditions in its evaluated data.", "37437609", "PMC11197850 — Results and Recommendations, calculation versus delineation variability", { population: "MRI_LINAC_DATA", measurements: ["adc-value"], platforms: ["MRI_LINAC"], maturity: "STUDY_SPECIFIC_RESULT", polarity: "QUALIFIED" }),

  // Cerebral perfusion — 24 atomic assertions
  A("cerebral-perfusion", "ctp-dynamic-bolus", "ct-perfusion", "USES", "contrast-bolus", "CT perfusion uses dynamic imaging during passage of an iodinated contrast bolus.", "30346227", "PMC6727131 — Acquisition section, dynamic contrast passage", { modality: "CT", techniques: ["ct-perfusion"] }),
  A("cerebral-perfusion", "dsc-dynamic-susceptibility", "mr-dsc-perfusion", "USES", "contrast-bolus", "DSC MR perfusion measures signal changes during passage of a susceptibility contrast bolus.", "25907520", "PMC5074767 — Technique description, DSC bolus acquisition", { modality: "MR", techniques: ["mr-dsc-perfusion"] }),
  A("cerebral-perfusion", "aif-input", "arterial-input-function", "IS_INPUT_TO", "deconvolution", "An arterial input function is an input to common perfusion deconvolution methods.", "21640299", "PMC3135980 — Theory, arterial input function and deconvolution", { modality: "MR", techniques: ["arterial-input-function", "deconvolution"] }),
  A("cerebral-perfusion", "deconvolution-affects-output", "deconvolution", "INFLUENCES", "perfusion-parametric-map", "The selected deconvolution method influences calculated perfusion maps.", "21640299", "PMC3135980 — Perfusion analysis, deconvolution algorithms", { modality: "MR", techniques: ["deconvolution"], limitations: ["DECONVOLUTION_DEPENDENCE"] }),
  A("cerebral-perfusion", "cbf-residue-amplitude", "cbf", "IS_DERIVED_FROM", "residue-function-amplitude", "In deconvolution-based perfusion analysis, CBF is derived from the amplitude of the tissue residue function.", "21640299", "PMC3135980 — Theory, residue function and CBF", { modality: "MR", measurements: ["cbf"], techniques: ["deconvolution"] }),
  A("cerebral-perfusion", "tmax-residue-time", "tmax", "IS_DEFINED_AS", "time-to-residue-function-maximum", "Tmax is the time to the maximum of the deconvolved tissue residue function.", "21640299", "PMC3135980 — Theory, definition of Tmax", { modality: "MR", measurements: ["tmax"], techniques: ["deconvolution"] }),
  A("cerebral-perfusion", "tmax-not-direct-flow", "tmax", "IS_NOT", "direct-physiological-flow-measure", "Tmax is not a direct physiological measurement of cerebral blood flow.", "21640299", "PMC3135980 — Interpretation of Tmax, physiologic limitations", { modality: "MR", measurements: ["tmax", "cbf"], relationType: "QUALIFIES", polarity: "NEGATIVE", limitations: ["TMAX_NOT_DIRECT_PHYSIOLOGY"] }),
  A("cerebral-perfusion", "mtt-central-volume-relation", "mtt", "CAN_BE_DERIVED_FROM", "cbv-divided-by-cbf", "In the central-volume model, MTT can be derived as CBV divided by CBF.", "21640299", "PMC3135980 — Theory, central volume principle", { modality: "MR", measurements: ["mtt", "cbv", "cbf"], relationType: "DERIVES", extractionType: "METHOD_DESCRIPTION", interpretationLevel: "DERIVED_INTERPRETATION", derivationSteps: ["Use the source-defined central-volume relation", "Preserve CBF and CBV units", "Derive MTT only within the stated model"] }),
  A("cerebral-perfusion", "scan-truncation-bias", "ct-perfusion", "IS_LIMITED_BY", "scan-truncation", "Insufficient temporal coverage can truncate a delayed contrast bolus and bias CT perfusion results.", "30346227", "PMC6727131 — Acquisition pitfalls, bolus delay and scan duration", { modality: "CT", techniques: ["ct-perfusion"], limitations: ["BOLUS_TRUNCATION"] }),
  A("cerebral-perfusion", "map-distinct-segmentation", "perfusion-parametric-map", "IS_DISTINCT_FROM", "ischemic-core-segmentation", "A perfusion parametric map is distinct from a threshold-derived ischemic-core segmentation.", "30346227", "PMC6727131 — Output interpretation, maps and automated lesion volumes", { modality: "CT", findings: ["ischemic-core-segmentation"], techniques: ["ct-perfusion"] }),
  A("cerebral-perfusion", "core-volume-software-dependent", "ischemic-core-segmentation", "DEPENDS_ON", "perfusion-software", "Estimated ischemic-core volume depends on the post-processing software and its rules.", "31203208", "PubMed abstract — Results, comparison of three CT perfusion packages", { modality: "CT", population: "ACUTE_ISCHEMIC_STROKE", pathologies: ["acute-ischemic-stroke"], findings: ["ischemic-core-segmentation"], platforms: ["THREE_SOFTWARE_PACKAGES"], limitations: ["SOFTWARE_DEPENDENCE"], confidence: "MODERATE", maturity: "STUDY_SPECIFIC_RESULT" }),
  A("cerebral-perfusion", "penumbra-volume-software-dependent", "penumbra-segmentation", "DEPENDS_ON", "perfusion-software", "Estimated penumbral volume can differ between perfusion post-processing packages.", "37021148", "PMC10069177 — Results, perfusion lesion volume comparison", { modality: "CT", population: "ACUTE_ISCHEMIC_STROKE", findings: ["penumbra-segmentation"], platforms: ["COMMERCIAL_SOFTWARE_COMPARISON"], limitations: ["SOFTWARE_DEPENDENCE"], maturity: "STUDY_SPECIFIC_RESULT" }),
  A("cerebral-perfusion", "threshold-package-specific", "perfusion-software", "REQUIRES_CONTEXT_FOR", "lesion-threshold", "A perfusion lesion threshold must be interpreted with the software and algorithm that generated it.", "30346227", "PMC6727131 — Practical guidance, package-specific thresholds", { modality: "CT", limitations: ["THRESHOLD_NOT_PORTABLE"] }),
  A("cerebral-perfusion", "validated-software-guidance", "ct-perfusion", "REQUIRES", "validated-processing-workflow", "Practical CT perfusion guidance recommends use of a validated acquisition and processing workflow.", "30346227", "PMC6727131 — Practical recommendations, implementation and quality assurance", { modality: "CT", maturity: "PRACTICE_GUIDANCE" }),
  A("cerebral-perfusion", "vendor-variability", "perfusion-software", "WAS_ASSOCIATED_WITH", "parameter-variability", "A method-comparison study found substantial vendor-related variability in calculated CT perfusion parameters.", "21785096", "PubMed abstract — Results, relative vendor variability", { modality: "CT", population: "PATIENT_DATA", measurements: ["cbf", "cbv", "mtt"], platforms: ["VENDOR_COMPARISON"], limitations: ["VENDOR_VARIABILITY"], maturity: "STUDY_SPECIFIC_RESULT", confidence: "MODERATE" }),
  A("cerebral-perfusion", "operator-less-than-vendor", "perfusion-software", "VARIABILITY_WAS_MORE_INFLUENCED_BY", "vendor-than-operator", "In that small method-comparison study, vendor choice contributed more variability than operator choice.", "21785096", "PubMed abstract — Results, vendor and operator effects", { modality: "CT", population: "SMALL_PATIENT_SAMPLE", platforms: ["VENDOR_COMPARISON"], limitations: ["SMALL_SAMPLE", "VENDOR_VARIABILITY"], maturity: "STUDY_SPECIFIC_RESULT", confidence: "MODERATE", polarity: "QUALIFIED" }),
  A("cerebral-perfusion", "different-postprocessing-poor-correlation", "perfusion-software", "PRODUCED", "poor-cross-package-correlation", "One CT perfusion study reported poor correlation when the same source maps were segmented by different post-processing programs.", "31019604", "PMC6479142 — Results, cross-program penumbra and core measurements", { modality: "CT", population: "ACUTE_ISCHEMIC_STROKE", platforms: ["SOFTWARE_COMPARISON"], maturity: "STUDY_SPECIFIC_RESULT", polarity: "QUALIFIED" }),
  A("cerebral-perfusion", "common-postprocessing-strong-correlation", "perfusion-software", "PRODUCED", "strong-correlation-under-common-processing", "The same study reported strong correlation when maps from different processing packages were evaluated by one common segmentation program.", "31019604", "PMC6479142 — Results, common post-processing comparison", { modality: "CT", population: "ACUTE_ISCHEMIC_STROKE", platforms: ["SOFTWARE_COMPARISON"], maturity: "STUDY_SPECIFIC_RESULT", polarity: "QUALIFIED" }),
  A("cerebral-perfusion", "two-packages-agreement-context", "perfusion-software", "SHOWED", "context-specific-agreement", "A two-package study found agreement for some core and penumbra outputs in its evaluated cohort.", "36010624", "PMC9406974 — Results, agreement between two software packages", { modality: "CT", population: "ACUTE_ISCHEMIC_STROKE", platforms: ["TWO_SOFTWARE_PACKAGES"], relationType: "QUALIFIES", maturity: "STUDY_SPECIFIC_RESULT", polarity: "QUALIFIED" }),
  A("cerebral-perfusion", "three-packages-different-volumes", "lesion-volume", "DIFFERED_BETWEEN", "three-software-packages", "A three-package comparison found differences in estimated ischemic lesion volumes.", "31203208", "PubMed abstract — Results, lesion volume estimates across three packages", { modality: "CT", population: "ACUTE_ISCHEMIC_STROKE", measurements: ["lesion-volume"], platforms: ["THREE_SOFTWARE_PACKAGES"], maturity: "STUDY_SPECIFIC_RESULT", confidence: "MODERATE", polarity: "QUALIFIED" }),
  A("cerebral-perfusion", "rcbf-threshold-algorithm-calibration", "cbf", "HAD_ALGORITHM_SPECIFIC_THRESHOLDS", "thirty-versus-fifteen-percent", "One calibration study derived an rCBF threshold near 30% for a model-independent algorithm and near 15% for a model-based algorithm.", "38052882", "PMC10698076 — Results, rCBF threshold calibration by deconvolution algorithm", { modality: "CT", assertionType: "QuantitativeAssertion", population: "ACUTE_ISCHEMIC_STROKE", measurements: ["cbf"], techniques: ["deconvolution"], limitations: ["ALGORITHM_SPECIFIC_THRESHOLD"], maturity: "STUDY_SPECIFIC_RESULT", polarity: "QUALIFIED" }),
  A("cerebral-perfusion", "tmax-six-second-study-context", "tmax", "USED_THRESHOLD", "greater-than-six-seconds", "The calibration study used a Tmax threshold greater than 6 seconds for its hypoperfusion definition.", "38052882", "PMC10698076 — Methods, Tmax hypoperfusion threshold", { modality: "CT", assertionType: "QuantitativeAssertion", population: "ACUTE_ISCHEMIC_STROKE", measurements: ["tmax"], techniques: ["deconvolution"], limitations: ["STUDY_SPECIFIC_THRESHOLD"], maturity: "STUDY_SPECIFIC_RESULT", polarity: "QUALIFIED" }),
  A("cerebral-perfusion", "perfusion-units-distinct", "cbf", "HAS_UNIT_DISTINCT_FROM", "cbv", "CBF and CBV use different quantitative units and are not interchangeable parameters.", "21640299", "PMC3135980 — Theory and parameter definitions, CBF and CBV units", { modality: "MR", measurements: ["cbf", "cbv"] }),
  A("cerebral-perfusion", "mtt-algorithm-sensitive", "mtt", "DEPENDS_ON", "deconvolution", "MTT estimates are sensitive to the perfusion model and deconvolution implementation.", "21640299", "PMC3135980 — Analysis limitations, MTT and algorithm dependence", { modality: "MR", measurements: ["mtt"], techniques: ["deconvolution"], limitations: ["ALGORITHM_DEPENDENCE"] }),

  // Myocardial characterization — 24 atomic assertions
  A("myocardial-tissue-characterization", "lge-postcontrast-acquisition", "lge-acquisition", "USES", "gadolinium-contrast", "LGE is acquired after administration of a gadolinium-based contrast agent.", "30231886", "PMC6147157 — Late gadolinium enhancement endpoint, acquisition description", { techniques: ["lge-acquisition"] }),
  A("myocardial-tissue-characterization", "ir-myocardial-nulling", "inversion-recovery", "ENABLES", "myocardial-nulling", "Inversion-recovery LGE uses an inversion time selected to null reference myocardium.", "30231886", "PMC6147157 — LGE acquisition, inversion time and nulling", { techniques: ["inversion-recovery", "myocardial-nulling"] }),
  A("myocardial-tissue-characterization", "psir-method-role", "psir", "HAS_ROLE", "phase-sensitive-reconstruction", "PSIR is a phase-sensitive reconstruction approach used in LGE imaging.", "30231886", "PMC6147157 — LGE acquisition methods, PSIR", { techniques: ["psir"] }),
  A("myocardial-tissue-characterization", "lge-finding-not-acquisition", "lge-finding", "IS_DISTINCT_FROM", "lge-acquisition", "The observed LGE finding is distinct from the acquisition method used to produce the image.", "30231886", "PMC6147157 — Endpoint definitions, acquisition versus LGE endpoint", { findings: ["lge-finding"], techniques: ["lge-acquisition"] }),
  A("myocardial-tissue-characterization", "lge-pattern-characterization", "lge-pattern", "CONTRIBUTES_TO", "tissue-characterization", "The spatial pattern of LGE contributes to myocardial tissue characterization.", "30231886", "PMC6147157 — LGE endpoint interpretation, distribution patterns", { findings: ["lge-pattern"] }),
  A("myocardial-tissue-characterization", "mvo-no-reflow", "microvascular-obstruction", "REPRESENTS", "myocardial-no-reflow", "MVO represents impaired tissue-level reperfusion despite restoration of epicardial flow.", "23021401", "PMC3514126 — Microvascular obstruction, definition of no-reflow", { population: "ACUTE_MYOCARDIAL_INFARCTION", pathologies: ["myocardial-infarction"], findings: ["microvascular-obstruction"] }),
  A("myocardial-tissue-characterization", "mvo-dark-core-lge", "microvascular-obstruction", "CAN_APPEAR_AS", "hypoenhanced-core-within-injury", "MVO can appear as a hypoenhanced core within an enhanced infarct region on LGE imaging.", "23021401", "PMC3514126 — CMR appearance of late microvascular obstruction", { population: "ACUTE_MYOCARDIAL_INFARCTION", pathologies: ["myocardial-infarction"], findings: ["microvascular-obstruction", "lge-finding"] }),
  A("myocardial-tissue-characterization", "imh-distinct-mvo", "intramyocardial-hemorrhage", "IS_DISTINCT_FROM", "microvascular-obstruction", "Intramyocardial hemorrhage is distinct from microvascular obstruction even though the findings can coexist.", "23021401", "PMC3514126 — Hemorrhage and microvascular obstruction, pathophysiologic distinction", { population: "ACUTE_MYOCARDIAL_INFARCTION", findings: ["intramyocardial-hemorrhage", "microvascular-obstruction"] }),
  A("myocardial-tissue-characterization", "imh-t2star-detection", "intramyocardial-hemorrhage", "CAN_BE_DETECTED_WITH", "t2-star", "T2*-sensitive CMR can detect susceptibility effects associated with intramyocardial hemorrhage.", "25759823", "PMC4336749 — CMR assessment, T2* detection of hemorrhage", { population: "ACUTE_MYOCARDIAL_INFARCTION", findings: ["intramyocardial-hemorrhage"], techniques: ["t2-star"] }),
  A("myocardial-tissue-characterization", "imh-t2-detection", "intramyocardial-hemorrhage", "CAN_BE_DETECTED_WITH", "t2-weighted-iron-sensitive", "T2-weighted CMR has been used to identify intramyocardial hemorrhage.", "23021401", "PMC3514126 — CMR methods for hemorrhage, T2-weighted imaging", { population: "ACUTE_MYOCARDIAL_INFARCTION", findings: ["intramyocardial-hemorrhage"], techniques: ["t2-weighted-iron-sensitive"] }),
  A("myocardial-tissue-characterization", "imh-no-standard-protocol", "intramyocardial-hemorrhage", "LACKS", "uniform-standardized-cmr-protocol", "The reviewed literature did not establish one uniform standardized CMR protocol for intramyocardial hemorrhage.", "25759823", "PMC4336749 — Discussion, heterogeneity of CMR methods", { relationType: "QUALIFIES", polarity: "NEGATIVE", findings: ["intramyocardial-hemorrhage"], limitations: ["PROTOCOL_HETEROGENEITY"] }),
  A("myocardial-tissue-characterization", "imh-timing-dependent", "intramyocardial-hemorrhage", "DETECTION_DEPENDS_ON", "imaging-time", "Detection of intramyocardial hemorrhage depends on the timing of imaging after infarction.", "29712696", "PMC5933067 — Intramyocardial hemorrhage, temporal evolution", { population: "ACUTE_STEMI", pathologies: ["myocardial-infarction"], limitations: ["TIMING_DEPENDENCE"] }),
  A("myocardial-tissue-characterization", "mvo-associated-remodeling", "microvascular-obstruction", "IS_ASSOCIATED_WITH", "adverse-left-ventricular-remodeling", "MVO has been associated with adverse left-ventricular remodeling after myocardial infarction.", "25212800", "PMC4301583 — Results, MVO and LV remodeling", { population: "MYOCARDIAL_INFARCTION", pathologies: ["myocardial-infarction"], findings: ["microvascular-obstruction"], maturity: "SYSTEMATIC_REVIEW_ASSOCIATION" }),
  A("myocardial-tissue-characterization", "imh-associated-outcomes", "intramyocardial-hemorrhage", "IS_ASSOCIATED_WITH", "adverse-clinical-outcomes", "Intramyocardial hemorrhage has been associated with adverse outcomes after myocardial infarction.", "25212800", "PMC4301583 — Results, hemorrhage and clinical outcomes", { population: "MYOCARDIAL_INFARCTION", pathologies: ["myocardial-infarction"], findings: ["intramyocardial-hemorrhage"], maturity: "SYSTEMATIC_REVIEW_ASSOCIATION" }),
  A("myocardial-tissue-characterization", "association-not-causality", "microvascular-obstruction", "DOES_NOT_ESTABLISH", "causality-for-outcome", "Observed prognostic association of MVO does not by itself establish causality.", "25212800", "PMC4301583 — Discussion, limitations of observational prognostic evidence", { relationType: "QUALIFIES", polarity: "QUALIFIED", population: "MYOCARDIAL_INFARCTION", limitations: ["ASSOCIATION_NOT_CAUSALITY"] }),
  A("myocardial-tissue-characterization", "lge-manual-quantification", "lge-quantification", "CAN_USE", "manual-contouring", "Manual contouring is one documented method for quantifying myocardial LGE extent.", "21329899", "PubMed abstract — Methods, manual scar quantification reference", { techniques: ["lge-quantification"], measurements: ["lge-extent"], confidence: "MODERATE" }),
  A("myocardial-tissue-characterization", "lge-sd-thresholds", "lge-quantification", "CAN_USE", "standard-deviation-threshold", "LGE quantification methods have used signal-intensity thresholds defined by standard deviations above reference myocardium.", "21329899", "PubMed abstract — Methods, standard-deviation threshold techniques", { techniques: ["lge-quantification"], measurements: ["lge-extent"], confidence: "MODERATE" }),
  A("myocardial-tissue-characterization", "lge-fwhm-method", "lge-quantification", "CAN_USE", "full-width-at-half-maximum", "Full width at half maximum is a documented method for LGE quantification.", "21329899", "PubMed abstract — Methods, FWHM scar quantification", { techniques: ["lge-quantification"], measurements: ["lge-extent"], confidence: "MODERATE" }),
  A("myocardial-tissue-characterization", "lge-methods-different-extent", "lge-quantification", "PRODUCES_METHOD_DEPENDENT", "lge-extent", "Different LGE quantification methods can produce different scar extent estimates.", "21329899", "PubMed abstract — Results, comparison of scar quantification methods", { techniques: ["lge-quantification"], measurements: ["lge-extent"], limitations: ["QUANTIFICATION_METHOD_DEPENDENCE"], confidence: "MODERATE", polarity: "QUALIFIED" }),
  A("myocardial-tissue-characterization", "hcm-three-sd-closest-manual", "lge-quantification", "WAS_CLOSEST_TO", "manual-contouring", "In one hypertrophic cardiomyopathy study, the 3-SD method was closest to manual quantification.", "25315701", "PMC4189726 — Results, accuracy relative to manual planimetry", { population: "HYPERTROPHIC_CARDIOMYOPATHY", techniques: ["lge-quantification"], measurements: ["lge-extent"], maturity: "STUDY_SPECIFIC_RESULT" }),
  A("myocardial-tissue-characterization", "hcm-fwhm-reproducible", "lge-quantification", "FWHM_WAS", "more-reproducible", "In that hypertrophic cardiomyopathy study, FWHM was more reproducible than the compared threshold methods.", "25315701", "PMC4189726 — Results, interobserver and intraobserver reproducibility", { population: "HYPERTROPHIC_CARDIOMYOPATHY", techniques: ["lge-quantification"], measurements: ["lge-extent"], maturity: "STUDY_SPECIFIC_RESULT" }),
  A("myocardial-tissue-characterization", "hcm-fwhm-underestimated", "lge-quantification", "FWHM_WAS", "systematically-lower-than-manual", "In that hypertrophic cardiomyopathy study, FWHM yielded lower LGE extent than manual quantification.", "25315701", "PMC4189726 — Results, FWHM bias relative to manual planimetry", { population: "HYPERTROPHIC_CARDIOMYOPATHY", techniques: ["lge-quantification"], measurements: ["lge-extent"], maturity: "STUDY_SPECIFIC_RESULT", polarity: "QUALIFIED" }),
  A("myocardial-tissue-characterization", "myocarditis-threshold-dependent", "lge-quantification", "PRODUCED_DIFFERENT", "fibrosis-burden-by-threshold", "In suspected myocarditis, quantified fibrosis burden varied across the evaluated LGE threshold methods.", "30813942", "PMC6393997 — Results, fibrosis burden by quantification method", { population: "SUSPECTED_MYOCARDITIS", pathologies: ["myocarditis"], techniques: ["lge-quantification"], measurements: ["lge-extent"], limitations: ["THRESHOLD_METHOD_DEPENDENCE"], maturity: "STUDY_SPECIFIC_RESULT", polarity: "QUALIFIED" }),
  A("myocardial-tissue-characterization", "dark-blood-contrast", "dark-blood-lge", "IMPROVED", "scar-blood-contrast", "A prospective comparison found improved scar-to-blood contrast with the evaluated dark-blood LGE method.", "29162123", "PMC5696884 — Results, scar-to-blood contrast comparison", { population: "CLINICAL_COHORT", techniques: ["dark-blood-lge"], findings: ["lge-finding"], maturity: "STUDY_SPECIFIC_RESULT" }),
  A("myocardial-tissue-characterization", "findings-not-automatic-measures", "intramyocardial-hemorrhage", "IS_NOT_AUTOMATICALLY", "quantitative-measurement", "Presence of intramyocardial hemorrhage is a finding unless an explicit measurement method is applied.", "30231886", "PMC6147157 — Endpoint framework, qualitative and quantitative endpoint distinction", { findings: ["intramyocardial-hemorrhage"], relationType: "QUALIFIES", polarity: "QUALIFIED" }),

  // Spectral CT — 24 atomic assertions
  A("spectral-ct", "spectral-energy-information", "spectral-ct", "USES", "energy-dependent-information", "Spectral CT uses energy-dependent x-ray attenuation information.", "36828369", "PMC9964233 — Introduction, principles of dual-energy CT", { modality: "CT", techniques: ["spectral-ct"] }),
  A("spectral-ct", "dect-multiple-implementations", "dual-energy-ct", "HAS_MULTIPLE", "technology-implementations", "Dual-energy CT is implemented through several non-equivalent acquisition and detector architectures.", "36828369", "PMC9964233 — Dual-energy system architectures", { modality: "CT", techniques: ["dual-energy-ct"], limitations: ["IMPLEMENTATION_HETEROGENEITY"] }),
  A("spectral-ct", "dual-source-distinct", "dual-source-de", "IS_DISTINCT_FROM", "rapid-kvp-switching", "Dual-source dual-energy acquisition is distinct from rapid kVp switching.", "36828369", "PMC9964233 — System comparison, dual-source and rapid switching", { modality: "CT", techniques: ["dual-source-de", "rapid-kvp-switching"] }),
  A("spectral-ct", "rapid-kvp-distinct", "rapid-kvp-switching", "IS_DISTINCT_FROM", "dual-layer-detector", "Rapid kVp switching is distinct from dual-layer detector spectral acquisition.", "36828369", "PMC9964233 — System comparison, source-based and detector-based approaches", { modality: "CT", techniques: ["rapid-kvp-switching", "dual-layer-detector"] }),
  A("spectral-ct", "dual-layer-simultaneous", "dual-layer-detector", "SEPARATES", "energy-information-in-detector-layers", "A dual-layer detector separates energy information in stacked detector layers.", "28168368", "PMC5544802 — Methods, dual-layer system principle", { modality: "CT", techniques: ["dual-layer-detector"] }),
  A("spectral-ct", "pcct-distinct-dect", "photon-counting-ct", "IS_DISTINCT_FROM", "dual-energy-ct", "Photon-counting detector CT is a distinct detector technology from conventional dual-energy CT implementations.", "36047540", "PMC9434736 — Detector principles, PCCT versus energy-integrating CT", { modality: "CT", techniques: ["photon-counting-ct", "dual-energy-ct"] }),
  A("spectral-ct", "material-basis-dependent", "material-decomposition", "DEPENDS_ON", "selected-material-basis", "Material-decomposition output depends on the selected material basis and implementation.", "33411614", "PMC7853765 — Material decomposition, basis-material assumptions", { modality: "CT", techniques: ["material-decomposition"], limitations: ["MATERIAL_BASIS_DEPENDENCE"] }),
  A("spectral-ct", "iodine-map-output", "iodine-map", "IS_OUTPUT_OF", "material-decomposition", "An iodine map is a reconstruction output of a material-decomposition process.", "33411614", "PMC7853765 — Iodine maps, material decomposition outputs", { modality: "CT", techniques: ["material-decomposition", "iodine-map"] }),
  A("spectral-ct", "iodine-concentration-measure", "iodine-concentration", "IS_DERIVED_FROM", "iodine-map", "Iodine concentration is a derived measurement distinct from the iodine map image.", "28168368", "PMC5544802 — Methods, iodine quantification from spectral data", { modality: "CT", measurements: ["iodine-concentration"], techniques: ["iodine-map"] }),
  A("spectral-ct", "iodine-map-not-ct-ecv", "iodine-map", "IS_NOT", "ct-ecv", "An iodine map is not equivalent to a CT-derived extracellular-volume measurement.", "33411614", "PMC7853765 — Material maps and clinical outputs, iodine map definition", { modality: "CT", relationType: "REFUTES", polarity: "NEGATIVE", limitations: ["OUTPUT_CONFLATION"] }),
  A("spectral-ct", "vmi-energy-specific", "virtual-monoenergetic-image", "REQUIRES", "specified-energy-level", "A virtual monoenergetic image is reconstructed for a specified virtual energy level.", "30919651", "PMC6592074 — Technique, virtual monoenergetic energy selection", { modality: "CT", techniques: ["virtual-monoenergetic-image"] }),
  A("spectral-ct", "low-kev-iodine-contrast", "virtual-monoenergetic-image", "LOW_ENERGY_INCREASES", "iodine-contrast", "Low-energy VMI can increase iodine-related contrast.", "30919651", "PMC6592074 — Low-keV VMI, iodine contrast", { modality: "CT", techniques: ["virtual-monoenergetic-image"] }),
  A("spectral-ct", "low-kev-noise", "virtual-monoenergetic-image", "LOW_ENERGY_CAN_INCREASE", "image-noise", "Low-energy VMI can increase image noise.", "30919651", "PMC6592074 — Low-keV VMI, noise trade-off", { modality: "CT", techniques: ["virtual-monoenergetic-image"], relationType: "QUALIFIES", polarity: "QUALIFIED", limitations: ["LOW_KEV_NOISE"] }),
  A("spectral-ct", "high-kev-artifact", "virtual-monoenergetic-image", "HIGH_ENERGY_CAN_REDUCE", "beam-hardening-artifact", "Higher-energy VMI can reduce some beam-hardening artifacts.", "30919651", "PMC6592074 — High-keV VMI, artifact reduction", { modality: "CT", techniques: ["virtual-monoenergetic-image"] }),
  A("spectral-ct", "vnc-not-true-noncontrast", "virtual-non-contrast", "IS_NOT_EQUIVALENT_TO", "true-noncontrast-acquisition", "Virtual non-contrast images are not universally equivalent to true unenhanced acquisitions.", "33411614", "PMC7853765 — Virtual noncontrast pitfalls", { modality: "CT", relationType: "QUALIFIES", polarity: "NEGATIVE", limitations: ["VNC_RESIDUAL_IODINE_AND_CALCIUM_ERRORS"] }),
  A("spectral-ct", "iodine-unit", "iodine-concentration", "HAS_UNIT", "milligram-iodine-per-millilitre", "Iodine concentration is commonly reported in milligrams of iodine per milliliter in the retained quantification studies.", "28168368", "PMC5544802 — Methods and Results, iodine concentration units", { modality: "CT", assertionType: "LiteralValueAssertion", measurements: ["iodine-concentration"] }),
  A("spectral-ct", "iodine-accuracy-system-dependent", "iodine-concentration", "ACCURACY_DEPENDS_ON", "ct-system", "Accuracy of iodine concentration measurements differs between evaluated CT systems.", "29185902", "PubMed abstract — Results, intermanufacturer iodine quantification", { modality: "CT", measurements: ["iodine-concentration"], platforms: ["MULTIMANUFACTURER_PHANTOM"], limitations: ["SYSTEM_DEPENDENCE"], confidence: "MODERATE", maturity: "STUDY_SPECIFIC_RESULT" }),
  A("spectral-ct", "iodine-patient-size", "iodine-concentration", "ERROR_DEPENDS_ON", "object-size", "Object size influences iodine quantification error in phantom evaluations.", "30276672", "PubMed abstract — Results, size-dependent detection and precision", { modality: "CT", measurements: ["iodine-concentration"], population: "PHANTOM", limitations: ["SIZE_DEPENDENCE"], confidence: "MODERATE", maturity: "STUDY_SPECIFIC_RESULT" }),
  A("spectral-ct", "iodine-dose-noise", "iodine-concentration", "PRECISION_DEPENDS_ON", "radiation-dose-and-noise", "Iodine quantification precision depends on acquisition dose and image-noise conditions.", "31237496", "PMC6694721 — Results, dose and iodine detection limits", { modality: "CT", measurements: ["iodine-concentration"], population: "PHANTOM", limitations: ["DOSE_NOISE_DEPENDENCE"], maturity: "STUDY_SPECIFIC_RESULT" }),
  A("spectral-ct", "intermanufacturer-variability", "iodine-concentration", "DIFFERS_BETWEEN", "manufacturers", "Iodine quantification and monoenergetic attenuation differed between manufacturers in a phantom comparison.", "29185902", "PubMed abstract — Results, intermanufacturer comparison", { modality: "CT", measurements: ["iodine-concentration"], platforms: ["MULTIMANUFACTURER_PHANTOM"], manufacturers: ["REPORTED_IN_SOURCE"], limitations: ["INTERMANUFACTURER_VARIABILITY"], confidence: "MODERATE", maturity: "STUDY_SPECIFIC_RESULT", polarity: "QUALIFIED" }),
  A("spectral-ct", "normalization-reduces-not-erases", "spectral-calibration", "CAN_REDUCE", "interplatform-iodine-variability", "Normalization reduced but did not eliminate interplatform iodine variability in an intra-patient study.", "38189979", "PubMed abstract — Results and Conclusion, normalization across platforms", { modality: "CT", measurements: ["iodine-concentration"], population: "CLINICAL_INTRAPATIENT", platforms: ["MULTIPLATFORM"], relationType: "QUALIFIES", maturity: "STUDY_SPECIFIC_RESULT", confidence: "MODERATE", polarity: "QUALIFIED" }),
  A("spectral-ct", "lod-platform-size", "iodine-concentration", "DETECTION_LIMIT_DEPENDS_ON", "platform-and-object-size", "The lower detectable iodine concentration depends on the scanner implementation and phantom size.", "31237496", "PMC6694721 — Results, lower detection limits by scanner and phantom size", { modality: "CT", measurements: ["iodine-concentration"], population: "PHANTOM", limitations: ["PLATFORM_AND_SIZE_DEPENDENT_LOD"], maturity: "STUDY_SPECIFIC_RESULT" }),
  A("spectral-ct", "pcct-benefits-potential", "photon-counting-ct", "HAS", "potential-technical-benefits", "The retained PCCT review describes technical benefits as potential capabilities rather than automatic clinical outcome improvements.", "36047540", "PMC9434736 — Clinical translation and limitations", { modality: "CT", techniques: ["photon-counting-ct"], relationType: "QUALIFIES", polarity: "QUALIFIED", limitations: ["TECHNICAL_CAPABILITY_NOT_CLINICAL_OUTCOME"] }),
  A("spectral-ct", "pcct-direct-conversion", "photon-counting-ct", "USES", "direct-conversion-energy-resolving-detection", "Photon-counting CT uses direct-conversion detectors with energy discrimination.", "36047540", "PMC9434736 — Detector principles, direct conversion and energy bins", { modality: "CT", techniques: ["photon-counting-ct"] }),
];

const contextFor = (item) => Object.freeze({
  contextId: `noxia:radiology:scientific-context:p5:${item.domainId}:${item.key}`,
  dimensions: Object.freeze([
    { dimension: "modality", operator: "EXACT", value: item.modality },
    { dimension: "population", operator: item.population === P5_NOT_APPLICABLE ? P5_NOT_APPLICABLE : "EXACT", value: item.population },
    { dimension: "pathology", operator: item.pathologies.length ? "ANY_OF" : P5_NOT_APPLICABLE, value: item.pathologies.length ? item.pathologies : null },
    { dimension: "manufacturer", operator: item.manufacturers.length ? "ANY_OF" : P5_UNKNOWN, value: item.manufacturers.length ? item.manufacturers : null },
    { dimension: "software", operator: item.platforms.length ? "CONDITION" : P5_UNKNOWN, value: item.platforms.length ? item.platforms : null },
  ]),
});

const createAssertion = (item) => {
  const source = sourceByPmid[item.pmid];
  const subject = conceptByKey[item.subject];
  if (!source || !subject) throw new Error(`Invalid assertion definition ${item.key}`);
  const objectConcept = conceptByKey[item.object] ?? null;
  const stableId = `noxia:radiology:scientific-assertion:${item.domainId}:${item.key}`;
  const revisionId = `${stableId}:revision:1`;
  const context = contextFor(item);
  const reviewState = item.relationType === "REFUTES" ? "CONTESTED" : source.abstractOnly || item.relationType === "QUALIFIES" || item.interpretationLevel === "DERIVED_INTERPRETATION" ? "QUALIFIED" : "REVIEWED";
  const automatedDecision = reviewState === "CONTESTED" ? "AUTOMATED_REVIEW_CONTESTED" : reviewState === "QUALIFIED" ? "AUTOMATED_REVIEW_QUALIFIED" : "AUTOMATED_REVIEW_PASSED";
  const material = { stableId, domainId: item.domainId, subject: subject.stableId, predicate: item.predicate, object: objectConcept?.stableId ?? item.object, statement: item.statement, context, sourceRevisionId: source.revisionId };
  return Object.freeze({
    stableId,
    revisionId,
    revisionNumber: 1,
    domainId: item.domainId,
    assertionType: item.assertionType,
    subjectEntityId: subject.stableId,
    predicate: item.predicate,
    objectEntityId: objectConcept?.stableId ?? null,
    literalValue: objectConcept ? null : item.object,
    statement: Object.freeze({ language: "en", text: item.statement, atomicConclusionCount: 1 }),
    context,
    facets: Object.freeze({
      concepts: Object.freeze([...new Set([item.subject, ...(objectConcept ? [item.object] : [])])]),
      modalities: Object.freeze([item.modality]),
      pathologies: Object.freeze(item.pathologies),
      techniques: Object.freeze(item.techniques),
      measurements: Object.freeze(item.measurements),
      findings: Object.freeze(item.findings),
      limitations: Object.freeze(item.limitations),
      platforms: Object.freeze(item.platforms),
      manufacturers: Object.freeze(item.manufacturers),
    }),
    temporalScope: source.publishedAt,
    polarity: item.polarity,
    evidenceQuality: Object.freeze({ relevance: "DIRECTLY_RELEVANT", methodologicalQuality: source.sourceType, fullTextAvailability: source.fullTextAvailability, contextualPrecision: item.platforms.length || item.population !== P5_NOT_APPLICABLE ? "SPECIFIED" : "LIMITED" }),
    scientificMaturity: item.maturity,
    status: "SOURCE_LOCALIZED",
    reviewState,
    reviewType: P5_REVIEW_TYPE,
    reviewer: P5_REVIEWER,
    automatedReviewDecision: automatedDecision,
    humanReviewed: false,
    scientificHumanReview: null,
    sourceRefs: Object.freeze([source.revisionId]),
    limitations: Object.freeze(item.limitations),
    digest: sha256Digest(material),
  });
};

export const multidomainAssertionRevisions = Object.freeze(definitions.map(createAssertion).sort((a, b) => a.revisionId.localeCompare(b.revisionId)));
export const multidomainAssertionIdentities = Object.freeze(multidomainAssertionRevisions.map(({ stableId, domainId }) => Object.freeze({ stableId, domainId })));
const assertionByKey = Object.freeze(Object.fromEntries(definitions.map((definition, index) => [definition.key, multidomainAssertionRevisions.find((item) => item.stableId.endsWith(`:${definition.key}`))])));

const createEvidence = (item, assertion, source, suffix = "primary", relationType = item.relationType) => {
  const abstractLocator = source.abstractOnly;
  if (abstractLocator && !/PubMed abstract/i.test(item.locator)) throw new Error(`Abstract-only source ${source.pmid} requires a PubMed abstract locator`);
  const interpretationLevel = item.interpretationLevel;
  const material = { sourceRevisionId: source.revisionId, assertionRevisionId: assertion.revisionId, relationType, locator: item.locator, suffix };
  return Object.freeze({
    evidenceLinkId: `noxia:radiology:evidence-link:p5:${item.domainId}:${item.key}:${suffix}`,
    domainId: item.domainId,
    sourceRevisionId: source.revisionId,
    assertionRevisionId: assertion.revisionId,
    relationType,
    locator: item.locator,
    extraction: Object.freeze({
      extractionId: `noxia:radiology:extraction:p5:${item.domainId}:${item.key}:${suffix}`,
      sourceRevisionId: source.revisionId,
      assertionDerived: assertion.revisionId,
      section: item.locator.split(" — ")[1] ?? item.locator,
      page: null,
      paragraph: "LOCATOR_NARRATIVE_TARGET",
      tableOrFigure: null,
      passage: item.statement,
      passageKind: "ANALYTICAL_SUMMARY_NOT_VERBATIM_SOURCE_TEXT",
      consultedAt: P5_RETRIEVED_AT,
      analyticalSummary: item.statement,
      extractionType: item.extractionType,
      interpretationLevel,
      directAuthorStatement: interpretationLevel !== "DERIVED_INTERPRETATION",
      derivationSteps: Object.freeze(item.derivationSteps),
    }),
    applicability: assertion.context,
    evidenceQuality: assertion.evidenceQuality,
    confidence: item.confidence,
    reviewerStatus: assertion.automatedReviewDecision,
    reviewType: P5_REVIEW_TYPE,
    reviewer: P5_REVIEWER,
    scientificHumanReview: null,
    limitations: Object.freeze([...item.limitations, ...(source.abstractOnly ? ["ABSTRACT_ONLY_EVIDENCE"] : [])]),
    date: P5_RETRIEVED_AT,
    digest: sha256Digest(material),
  });
};

const primaryLinks = definitions.map((item) => createEvidence(item, assertionByKey[item.key], sourceByPmid[item.pmid]));

const supplementaryDefinitions = [
  ["adc-map-is-calculated-output", "38535004", "SUPPORTS", "PMC10969680 — Methods, ADC map calculation in the QIBA workflow"],
  ["qiba-requires-qc", "38535004", "SUPPORTS", "PMC10969680 — Phantom validation and QIBA conformance workflow"],
  ["b-selection-limits-comparability", "19186405", "QUALIFIES", "PMC2631136 — Consensus recommendations, acquisition standardization and b-value reporting"],
  ["core-volume-software-dependent", "37021148", "SUPPORTS", "PMC10069177 — Results, core volume differences between software"],
  ["penumbra-volume-software-dependent", "36010624", "QUALIFIES", "PMC9406974 — Results, two-package penumbra comparison"],
  ["map-distinct-segmentation", "23264345", "QUALIFIES", "PubMed abstract — Methods and Results, parametric maps versus infarct and penumbra classification"],
  ["lge-methods-different-extent", "30813942", "SUPPORTS", "PMC6393997 — Results, LGE extent across quantification methods"],
  ["mvo-associated-remodeling", "29712696", "QUALIFIES", "PMC5933067 — Review, prognostic interpretation of MVO"],
  ["intermanufacturer-variability", "28168368", "SUPPORTS", "PMC5544802 — Results, dual-source and dual-layer iodine accuracy"],
  ["normalization-reduces-not-erases", "34668387", "QUALIFIES", "PubMed abstract — Results, method for reducing low-iodine intermanufacturer variability"],
  ["pcct-distinct-dect", "36828369", "MENTIONS", "PMC9964233 — Discussion, photon-counting as a separate spectral architecture"],
];

const supplementaryLinks = supplementaryDefinitions.map(([key, pmid, relationType, locator], index) => {
  const original = definitions.find((item) => item.key === key);
  const item = { ...original, pmid, locator };
  return createEvidence(item, assertionByKey[key], sourceByPmid[pmid], `supplementary-${String(index + 1).padStart(2, "0")}`, relationType);
});

export const multidomainEvidenceLinks = Object.freeze([...primaryLinks, ...supplementaryLinks].sort((a, b) => a.evidenceLinkId.localeCompare(b.evidenceLinkId)));

export const multidomainAssertionReviewDecisions = Object.freeze(multidomainAssertionRevisions.map((assertion) => {
  const links = multidomainEvidenceLinks.filter((link) => link.assertionRevisionId === assertion.revisionId);
  return Object.freeze({
    decisionId: `noxia:radiology:p5:assertion-review:${assertion.stableId.split(":").at(-1)}`,
    assertionRevisionId: assertion.revisionId,
    reviewer: P5_REVIEWER,
    date: P5_RETRIEVED_AT,
    decision: assertion.automatedReviewDecision,
    justification: assertion.reviewState === "QUALIFIED" ? "Source access, context or evidence type requires an explicit qualification." : assertion.reviewState === "CONTESTED" ? "The assertion preserves a refuting or non-equivalence result." : "Atomicity, source identity, localizer, context and evidence linkage passed automated review.",
    sourceRevisionIds: Object.freeze([...new Set(links.map((link) => link.sourceRevisionId))].sort()),
    evidenceLinkIds: Object.freeze(links.map((link) => link.evidenceLinkId).sort()),
    scope: "DOCUMENTARY_SCIENTIFIC_CORPUS_INTERNAL_ONLY",
    reservations: Object.freeze(links.flatMap((link) => link.limitations).filter((value, index, array) => array.indexOf(value) === index).sort()),
    reviewType: P5_REVIEW_TYPE,
    automatedStructuralReview: true,
    automatedScientificReview: true,
    scientificHumanReview: null,
    previousStatus: "EXTRACTED",
    newStatus: assertion.status,
  });
}));

const relationTypes = ["SUPPORTS", "REFUTES", "QUALIFIES", "MENTIONS", "DERIVES", "CORRECTS", "RETRACTS", "UNRESOLVED_EVIDENCE_LINK"];
export const multidomainAssertionSummary = Object.freeze({
  assertions: multidomainAssertionRevisions.length,
  evidenceLinks: multidomainEvidenceLinks.length,
  byDomain: Object.freeze(Object.fromEntries(["diffusion-adc", "cerebral-perfusion", "myocardial-tissue-characterization", "spectral-ct"].map((domainId) => [domainId, Object.freeze({
    assertions: multidomainAssertionRevisions.filter((item) => item.domainId === domainId).length,
    evidenceLinks: multidomainEvidenceLinks.filter((item) => item.domainId === domainId).length,
  })]))),
  evidenceRelations: Object.freeze(Object.fromEntries(relationTypes.map((relation) => [relation, multidomainEvidenceLinks.filter((item) => item.relationType === relation).length]))),
  reviewDecisions: Object.freeze(Object.fromEntries(["AUTOMATED_REVIEW_PASSED", "AUTOMATED_REVIEW_QUALIFIED", "AUTOMATED_REVIEW_CONTESTED"].map((decision) => [decision, multidomainAssertionReviewDecisions.filter((item) => item.decision === decision).length]))),
  humanReviewsClaimed: multidomainAssertionReviewDecisions.filter((item) => item.scientificHumanReview !== null).length,
});
