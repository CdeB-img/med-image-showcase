import { createEvidenceLink, createScientificAssertionIdentity, createScientificAssertionRevision } from "../scientific-model-factories.mjs";
import { conceptBySlug, historicalConceptIds } from "./concepts.mjs";
import { applicabilityContexts } from "./contexts.mjs";
import {
  SCIENTIFIC_CORPUS_RETRIEVED_AT,
  SCIENTIFIC_CORPUS_REVIEW_TYPE,
  SCIENTIFIC_CORPUS_REVIEWER,
} from "./constants.mjs";
import { sourceByKey } from "./sources.mjs";

const evidence = (sourceKey, relationType, locator, extractionType, analyticalSummary, options = {}) => ({
  sourceKey,
  relationType,
  locator,
  extractionType,
  analyticalSummary,
  confidence: options.confidence ?? "HIGH",
  quality: options.quality ?? null,
  applicability: options.applicability ?? null,
  limitations: options.limitations ?? [],
});

const mr = historicalConceptIds.mr;
const ct = historicalConceptIds.ct;
const ecv = historicalConceptIds.ecvBiomarker;
const t1 = historicalConceptIds.t1Biomarker;
const method = conceptBySlug["myocardial-t1-mapping"];
const c = conceptBySlug;
const ctx = applicabilityContexts;

const definitions = [
  {
    slug: "mapping-useful-suspected-disease", type: "RecommendationAssertion", subject: method, predicate: "MAY_BE_CLINICALLY_USEFUL_IN_SUSPECTED_MYOCARDIAL_DISEASE", normative: "CMR mapping may be clinically useful in patients with suspected myocardial disease when interpreted in an appropriate technical and clinical context.", context: ctx.mrGeneral, polarity: "QUALIFIED", maturity: "ESTABLISHED", quality: "HIGH", facets: { concepts: [method], modalities: [mr], applications: ["CLINICAL_CHARACTERIZATION"], sourceTypes: ["CONSENSUS"] },
    evidence: [evidence("messroghli-2017-consensus", "SUPPORTS", "Clinical recommendations > General clinical indications > opening recommendation", "RECOMMENDATION_TEXT", "The position paper states that mapping may be clinically useful in suspected myocardial disease and preserves contextual interpretation.")],
  },
  {
    slug: "mapping-amyloidosis-information", type: "ApplicabilityAssertion", subject: method, predicate: "PROVIDES_INFORMATION_IN", object: c["systemic-al-amyloidosis"], context: ctx.amyloidMr, polarity: "POSITIVE", maturity: "VALIDATED", quality: "HIGH", facets: { concepts: [method, c["systemic-al-amyloidosis"]], modalities: [mr], diseases: [c["systemic-al-amyloidosis"]] },
    evidence: [evidence("messroghli-2017-consensus", "SUPPORTS", "Clinical applications > Cardiac amyloidosis", "DIRECT_STATEMENT", "The consensus identifies native T1 and ECV as providing clinically relevant information in cardiac amyloidosis."), evidence("banypersad-2015-amyloid", "QUALIFIES", "PubMed > Abstract > Methods and Results", "NUMERIC_RESULT", "The prospective cohort concerns systemic AL amyloidosis, limiting subtype generalization.", { applicability: ctx.amyloidMr.contextId })],
  },
  {
    slug: "mapping-myocarditis-information", type: "ApplicabilityAssertion", subject: method, predicate: "PROVIDES_INFORMATION_IN", object: c["acute-myocarditis"], context: ctx.myocarditisMr, polarity: "POSITIVE", maturity: "VALIDATED", quality: "HIGH", facets: { concepts: [method, c["acute-myocarditis"]], modalities: [mr], diseases: [c["acute-myocarditis"]] },
    evidence: [evidence("messroghli-2017-consensus", "SUPPORTS", "Clinical applications > Myocarditis", "DIRECT_STATEMENT", "The consensus describes T1-based mapping as useful for myocardial inflammation characterization."), evidence("ferreira-2018-myocarditis", "QUALIFIES", "PubMed > Abstract > Expert recommendations, final paragraph", "RECOMMENDATION_TEXT", "The expert criteria combine T1-based and T2-based evidence rather than treating mapping as a standalone diagnosis.")],
  },
  {
    slug: "routine-ecv-reasonable", type: "RecommendationAssertion", subject: c["myocardial-ecv-mr"], predicate: "MAY_BE_REASONABLE_FOR_ROUTINE_USE", normative: "Routine CMR ECV measurement may be reasonable when an extracellular gadolinium-based contrast agent is used and local technical requirements are met.", context: ctx.mrEcv, polarity: "QUALIFIED", maturity: "ESTABLISHED", quality: "HIGH", facets: { concepts: [ecv, c["myocardial-ecv-mr"]], modalities: [mr], sourceTypes: ["CONSENSUS"] },
    evidence: [evidence("messroghli-2017-consensus", "SUPPORTS", "Recommendations part II > ECV mapping > clinical implementation recommendation", "RECOMMENDATION_TEXT", "The consensus says routine ECV measurement may be reasonable with extracellular GBCA, subject to technical conditions.")],
  },
  {
    slug: "mapping-supported-field-strengths", type: "ApplicabilityAssertion", subject: method, predicate: "DOCUMENTED_AT_FIELD_STRENGTH", object: c["field-strength-1-5-t"], context: ctx.mr15T, polarity: "POSITIVE", maturity: "ESTABLISHED", quality: "HIGH", facets: { concepts: [method], modalities: [mr], fieldStrengths: [c["field-strength-1-5-t"]] },
    evidence: [evidence("messroghli-2017-consensus", "SUPPORTS", "Recommendations part II > Site preparation and normal values > CMR systems, item 1", "RECOMMENDATION_TEXT", "The consensus explicitly covers mapping performed at 1.5 T."), evidence("piechnik-2010-shmolli", "SUPPORTS", "Title and Methods > CMR protocol", "METHOD_DESCRIPTION", "ShMOLLI was evaluated at 1.5 T as well as 3 T.")],
  },
  {
    slug: "mapping-supported-3t", type: "ApplicabilityAssertion", subject: method, predicate: "DOCUMENTED_AT_FIELD_STRENGTH", object: c["field-strength-3-t"], context: ctx.mr3T, polarity: "POSITIVE", maturity: "ESTABLISHED", quality: "HIGH", facets: { concepts: [method], modalities: [mr], fieldStrengths: [c["field-strength-3-t"]] },
    evidence: [evidence("messroghli-2017-consensus", "SUPPORTS", "Recommendations part II > Site preparation and normal values > CMR systems, item 1", "RECOMMENDATION_TEXT", "The consensus explicitly covers mapping performed at 3 T."), evidence("piechnik-2010-shmolli", "SUPPORTS", "Title and Methods > CMR protocol", "METHOD_DESCRIPTION", "ShMOLLI was evaluated at 3 T as well as 1.5 T.")],
  },
  {
    slug: "local-reference-ranges-required", type: "RecommendationAssertion", subject: t1, predicate: "REQUIRES_LOCALLY_VALIDATED_REFERENCE_RANGE", normative: "Reference ranges for quantitative myocardial T1 should be established locally for the acquisition and analysis implementation used.", context: ctx.mrGeneral, polarity: "POSITIVE", maturity: "ESTABLISHED", quality: "HIGH", facets: { concepts: [t1, method], modalities: [mr], sourceTypes: ["CONSENSUS"], limitations: ["REFERENCE_RANGE_TRANSFERABILITY"] },
    evidence: [evidence("messroghli-2017-consensus", "SUPPORTS", "Recommendations part II > Site preparation and normal values > Local reference ranges", "RECOMMENDATION_TEXT", "The consensus requires locally established reference ranges and does not endorse a universal normal value.")],
  },
  {
    slug: "report-sequence-identity", type: "RecommendationAssertion", subject: method, predicate: "REPORTS_ACQUISITION_SEQUENCE", normative: "A quantitative T1 mapping report should identify the mapping sequence used.", context: ctx.mrGeneral, polarity: "POSITIVE", maturity: "ESTABLISHED", quality: "HIGH", facets: { concepts: [method], modalities: [mr], sourceTypes: ["CONSENSUS"] },
    evidence: [evidence("messroghli-2017-consensus", "SUPPORTS", "Recommendations part II > Reporting recommendations", "RECOMMENDATION_TEXT", "The reporting recommendations include the acquisition or mapping sequence.")],
  },
  {
    slug: "report-contrast-type-dose", type: "RecommendationAssertion", subject: c["myocardial-ecv-mr"], predicate: "REPORTS_CONTRAST_TYPE_AND_DOSE", normative: "An ECV report should retain the administered contrast-agent type and dose when reported by the source protocol.", context: ctx.mrEcv, polarity: "POSITIVE", maturity: "ESTABLISHED", quality: "HIGH", facets: { concepts: [ecv, c["gadolinium-based-contrast-agent"]], modalities: [mr], sourceTypes: ["CONSENSUS"] },
    evidence: [evidence("messroghli-2017-consensus", "SUPPORTS", "Recommendations part II > Reporting recommendations > contrast information", "RECOMMENDATION_TEXT", "The consensus reporting checklist includes contrast-agent type and dose.")],
  },
  {
    slug: "partial-volume-limits-mapping", type: "EntityObjectAssertion", subject: c["partial-volume"], predicate: "LIMITS", object: method, context: ctx.mrGeneral, polarity: "NEGATIVE", maturity: "ESTABLISHED", quality: "HIGH", facets: { concepts: [method, c["partial-volume"]], modalities: [mr], limitations: [c["partial-volume"]] },
    evidence: [evidence("messroghli-2017-consensus", "SUPPORTS", "Technical considerations > Map analysis and confounders > partial-volume effects", "LIMITATION", "The consensus identifies partial-volume contamination as a limitation of myocardial maps.")],
  },
  {
    slug: "heart-rate-can-limit-mapping", type: "EntityObjectAssertion", subject: c["heart-rate-dependence"], predicate: "CAN_LIMIT", object: method, context: ctx.mrGeneral, polarity: "QUALIFIED", maturity: "ESTABLISHED", quality: "HIGH", facets: { concepts: [method, c["heart-rate-dependence"]], modalities: [mr], limitations: [c["heart-rate-dependence"]] },
    evidence: [evidence("messroghli-2017-consensus", "SUPPORTS", "Technical considerations > Sequence-specific confounders > heart-rate dependence", "LIMITATION", "The consensus treats heart rate as a sequence-dependent confounder rather than a universal fixed bias."), evidence("chow-2014-sasha", "QUALIFIES", "PubMed > Abstract > Results", "NUMERIC_RESULT", "SASHA showed lower heart-rate sensitivity in the reported technical evaluation; this does not erase method-specific precision limits.")],
  },
  {
    slug: "ecv-definition-delta-r1", type: "LiteralValueAssertion", subject: c["myocardial-ecv-mr"], predicate: "HAS_DOCUMENTED_FORMULA", literal: "ECV_MR = (1 - Hct) * (DeltaR1_myocardium / DeltaR1_blood)", context: ctx.mrEcv, polarity: "POSITIVE", maturity: "ESTABLISHED", quality: "HIGH", facets: { concepts: [ecv, c["myocardial-ecv-mr"], c.hematocrit, c["change-in-longitudinal-relaxation-rate"]], modalities: [mr], measurements: ["ECV_MR"] },
    evidence: [evidence("moon-2013-consensus", "DERIVES", "Terminology and methods > ECV definition and equation", "METHOD_DESCRIPTION", "The historical consensus defines ECV from hematocrit and the myocardial-to-blood change in R1."), evidence("kellman-2012-ecv", "SUPPORTS", "Methods > ECV measurement > Equation (1)", "METHOD_DESCRIPTION", "The methods section gives the pre/post myocardial and blood T1 form of the ECV equation.")],
  },
  {
    slug: "moon-position-historical", type: "LiteralValueAssertion", subject: sourceByKey["moon-2013-consensus"].stableId, predicate: "HAS_DOCUMENTARY_POSITION", literal: "HISTORICAL_POSITION", context: ctx.mrGeneral, polarity: "QUALIFIED", maturity: "OBSOLETE", quality: "HIGH", reviewState: "SUPERSEDED", facets: { concepts: [method, ecv], modalities: [mr], documentaryStatuses: ["SUPERSEDED"] },
    evidence: [evidence("moon-2013-consensus", "SUPPORTS", "Document identity > publication date and consensus status", "DIRECT_STATEMENT", "The source is retained as the 2013 historical consensus rather than current guidance."), evidence("messroghli-2017-consensus", "QUALIFIES", "Document identity > updated SCMR/EACVI position paper", "DIRECT_STATEMENT", "The 2017 position paper is the later selected guidance for current-consensus rules.")],
  },
  {
    slug: "molli-is-inversion-recovery", type: "EntityObjectAssertion", subject: c.molli, predicate: "BELONGS_TO_SEQUENCE_FAMILY", object: c["inversion-recovery-t1-mapping"], context: ctx.mrMolli, polarity: "POSITIVE", maturity: "ESTABLISHED", quality: "MODERATE", facets: { concepts: [c.molli, method], modalities: [mr], methods: [c.molli], sequences: [c.molli] },
    evidence: [evidence("messroghli-2004-molli", "SUPPORTS", "PubMed > Title and Abstract > Methods", "METHOD_DESCRIPTION", "The original method describes MOLLI as a modified Look-Locker inversion-recovery T1 mapping acquisition.")],
  },
  {
    slug: "shmolli-nine-heartbeat", type: "LiteralValueAssertion", subject: c.shmolli, predicate: "HAS_BREATHHOLD_DURATION", literal: "9_HEARTBEATS", context: ctx.mrShMolli, polarity: "POSITIVE", maturity: "VALIDATED", quality: "MODERATE", facets: { concepts: [c.shmolli, method], modalities: [mr], methods: [c.shmolli], sequences: [c.shmolli], fieldStrengths: [c["field-strength-1-5-t"], c["field-strength-3-t"]] },
    evidence: [evidence("piechnik-2010-shmolli", "SUPPORTS", "Title; Methods > ShMOLLI scheme", "METHOD_DESCRIPTION", "The source describes ShMOLLI within a nine-heartbeat breath-hold at 1.5 T and 3 T.")],
  },
  {
    slug: "sasha-is-saturation-recovery", type: "EntityObjectAssertion", subject: c.sasha, predicate: "BELONGS_TO_SEQUENCE_FAMILY", object: c["saturation-recovery-t1-mapping"], context: ctx.mrSasha, polarity: "POSITIVE", maturity: "ESTABLISHED", quality: "MODERATE", facets: { concepts: [c.sasha, method], modalities: [mr], methods: [c.sasha], sequences: [c.sasha] },
    evidence: [evidence("chow-2014-sasha", "SUPPORTS", "PubMed > Title and Abstract > Methods", "METHOD_DESCRIPTION", "The original SASHA paper defines a saturation-recovery single-shot T1 mapping acquisition."), evidence("messroghli-2017-consensus", "MENTIONS", "Sequence overview > saturation-recovery methods", "DIRECT_STATEMENT", "The consensus lists saturation-recovery mapping but does not replace the original method validation.")],
  },
  {
    slug: "sasha-more-accurate-head-to-head", type: "EntityObjectAssertion", subject: c.sasha, predicate: "SHOWED_HIGHER_ACCURACY_THAN", object: c.molli, context: ctx.mrMolliSashaComparison, polarity: "POSITIVE", maturity: "PRELIMINARY", quality: "MODERATE", facets: { concepts: [c.sasha, c.molli, c["measurement-accuracy"]], modalities: [mr], methods: [c.sasha, c.molli], comparisons: ["MOLLI_VS_SASHA"] },
    evidence: [evidence("roujol-2014-comparison", "SUPPORTS", "Results > Phantom accuracy comparison", "NUMERIC_RESULT", "In the reported head-to-head phantom comparison, SASHA had lower T1 bias than MOLLI."), evidence("kellman-2014-accuracy", "QUALIFIES", "Accuracy and precision > saturation-recovery trade-off", "AUTHOR_INTERPRETATION", "The technical review explains that accuracy and precision are separate and method-dependent properties.")],
  },
  {
    slug: "molli-more-precise-head-to-head", type: "EntityObjectAssertion", subject: c.molli, predicate: "SHOWED_HIGHER_PRECISION_THAN", object: c.sasha, context: ctx.mrMolliSashaComparison, polarity: "POSITIVE", maturity: "PRELIMINARY", quality: "MODERATE", facets: { concepts: [c.molli, c.sasha, c["measurement-precision"]], modalities: [mr], methods: [c.molli, c.sasha], comparisons: ["MOLLI_VS_SASHA"] },
    evidence: [evidence("roujol-2014-comparison", "SUPPORTS", "Results > In-vivo and phantom precision comparison", "NUMERIC_RESULT", "The head-to-head study reports greater precision for MOLLI than SASHA in its tested setup."), evidence("kellman-2014-accuracy", "QUALIFIES", "Accuracy and precision > inversion- versus saturation-recovery", "AUTHOR_INTERPRETATION", "The review describes the accuracy-precision trade-off and prevents treating precision as accuracy.")],
  },
  {
    slug: "ecv-method-dependent", type: "EntityObjectAssertion", subject: c["method-dependence"], predicate: "INFLUENCES", object: c["myocardial-ecv-mr"], context: ctx.mrMolliSashaComparison, polarity: "QUALIFIED", maturity: "PRELIMINARY", quality: "MODERATE", facets: { concepts: [ecv, c.molli, c.sasha, c["method-dependence"]], modalities: [mr], methods: [c.molli, c.sasha], comparisons: ["MOLLI_VS_SASHA"], limitations: [c["method-dependence"]] },
    evidence: [evidence("roujol-2014-comparison", "SUPPORTS", "Results > In-vivo ECV comparison", "NUMERIC_RESULT", "The head-to-head study found sequence-dependent differences in ECV estimates in its healthy-volunteer setup.")],
  },
  {
    slug: "ecv-reproducibility-no-difference-small-study", type: "NegativeAssertion", subject: c["myocardial-ecv-mr"], predicate: "NO_SIGNIFICANT_REPRODUCIBILITY_DIFFERENCE_ACROSS_TESTED_METHODS", literal: "NO_SIGNIFICANT_DIFFERENCE_REPORTED", context: ctx.mrMolliSashaComparison, polarity: "NEGATIVE", maturity: "PRELIMINARY", quality: "LOW", facets: { concepts: [ecv, c.molli, c.sasha, c.reproducibility], modalities: [mr], methods: [c.molli, c.sasha], comparisons: ["MOLLI_VS_SASHA"], limitations: ["SMALL_SAMPLE"] },
    evidence: [evidence("roujol-2014-comparison", "SUPPORTS", "Results > Reproducibility analysis; seven healthy volunteers", "NUMERIC_RESULT", "No significant ECV reproducibility difference was reported among the four methods in seven healthy participants.", { quality: "LOW", limitations: ["Seven healthy participants; absence of significance is not proof of equivalence."] })],
  },
  {
    slug: "accuracy-precision-distinct", type: "EntityObjectAssertion", subject: c["measurement-accuracy"], predicate: "IS_DISTINCT_FROM", object: c["measurement-precision"], context: ctx.mrGeneral, polarity: "POSITIVE", maturity: "ESTABLISHED", quality: "HIGH", facets: { concepts: [method, c["measurement-accuracy"], c["measurement-precision"]], modalities: [mr], limitations: ["ACCURACY_PRECISION_TRADEOFF"] },
    evidence: [evidence("kellman-2014-accuracy", "SUPPORTS", "Background and Methods > definitions of accuracy and precision", "METHOD_DESCRIPTION", "The review evaluates bias and precision separately and cautions that method optimization can trade one against the other.")],
  },
  {
    slug: "inversion-recovery-underestimation", type: "LiteralValueAssertion", subject: c["inversion-recovery-t1-mapping"], predicate: "CAN_HAVE_BIAS", literal: "T1_UNDERESTIMATION_UNDER_DOCUMENTED_CONDITIONS", context: ctx.mrGeneral, polarity: "NEGATIVE", maturity: "VALIDATED", quality: "HIGH", facets: { concepts: [method, c.molli, c["measurement-accuracy"]], modalities: [mr], methods: [c.molli], limitations: ["T1_BIAS"] },
    evidence: [evidence("kellman-2014-accuracy", "SUPPORTS", "Inversion-recovery methods > accuracy limitations", "LIMITATION", "The technical review documents T1 underestimation mechanisms for inversion-recovery mapping under specific sequence and tissue conditions.")],
  },
  {
    slug: "saturation-recovery-precision-limitation", type: "EntityObjectAssertion", subject: c["saturation-recovery-t1-mapping"], predicate: "CAN_HAVE_LOWER", object: c["measurement-precision"], context: ctx.mrSasha, polarity: "NEGATIVE", maturity: "VALIDATED", quality: "HIGH", facets: { concepts: [method, c.sasha, c["measurement-precision"]], modalities: [mr], methods: [c.sasha], limitations: [c["measurement-precision"]] },
    evidence: [evidence("kellman-2014-accuracy", "SUPPORTS", "Saturation-recovery methods > precision analysis", "LIMITATION", "The review documents lower precision as a trade-off for saturation-recovery accuracy in relevant implementations.")],
  },
  {
    slug: "off-resonance-bias", type: "EntityObjectAssertion", subject: c["off-resonance"], predicate: "CAN_BIAS", object: method, context: ctx.mrGeneral, polarity: "NEGATIVE", maturity: "VALIDATED", quality: "HIGH", facets: { concepts: [method, c["off-resonance"]], modalities: [mr], limitations: [c["off-resonance"]] },
    evidence: [evidence("kellman-2014-accuracy", "SUPPORTS", "Technical confounders > off-resonance", "LIMITATION", "The review identifies off-resonance as a source of method-dependent T1 bias.")],
  },
  {
    slug: "native-t1-higher-3t-uniform-molli", type: "QuantitativeAssertion", subject: c["native-myocardial-t1"], predicate: "DIFFERS_BY_FIELD_STRENGTH_IN_UNIFORM_SETUP", quantitative: { value: 100, unit: "millisecond", comparator: "APPROXIMATELY_HIGHER_AT_3T_THAN_1_5T", unitRequired: true }, context: ctx.multicenterMolli, polarity: "POSITIVE", maturity: "VALIDATED", quality: "MODERATE", facets: { concepts: [t1, c.molli], modalities: [mr], methods: [c.molli], fieldStrengths: [c["field-strength-1-5-t"], c["field-strength-3-t"]], populations: ["HEALTHY_VOLUNTEERS"] },
    evidence: [evidence("dabir-2014-multicenter", "SUPPORTS", "Results > Native T1 at 1.5 T and 3 T", "NUMERIC_RESULT", "Under the uniform multicenter Philips MOLLI setup, native T1 was about 100 ms higher at 3 T than at 1.5 T.", { limitations: ["The estimate is setup-specific and is not a universal field-strength correction."] })],
  },
  {
    slug: "ecv-no-field-difference-uniform-molli", type: "NegativeAssertion", subject: c["myocardial-ecv-mr"], predicate: "NO_SIGNIFICANT_FIELD_STRENGTH_DIFFERENCE_REPORTED", literal: "NO_SIGNIFICANT_DIFFERENCE_BETWEEN_1_5T_AND_3T", context: ctx.multicenterMolli, polarity: "NEGATIVE", maturity: "VALIDATED", quality: "MODERATE", facets: { concepts: [ecv, c.molli], modalities: [mr], methods: [c.molli], fieldStrengths: [c["field-strength-1-5-t"], c["field-strength-3-t"]], populations: ["HEALTHY_VOLUNTEERS"] },
    evidence: [evidence("dabir-2014-multicenter", "SUPPORTS", "Results > ECV comparison by field strength", "NUMERIC_RESULT", "The uniform multicenter study reported no significant ECV difference between its 1.5 T and 3 T groups.", { limitations: ["No significant difference is not proof of universal equivalence across platforms."] })],
  },
  {
    slug: "uniform-molli-intersite-reproducibility", type: "EntityObjectAssertion", subject: c.molli, predicate: "HAS_DOCUMENTED", object: c["intersite-reproducibility"], context: ctx.multicenterMolli, polarity: "POSITIVE", maturity: "VALIDATED", quality: "MODERATE", facets: { concepts: [c.molli, c["intersite-reproducibility"], t1, ecv], modalities: [mr], methods: [c.molli], populations: ["HEALTHY_VOLUNTEERS"], qualityAttributes: [c["intersite-reproducibility"]] },
    evidence: [evidence("dabir-2014-multicenter", "SUPPORTS", "Results and Discussion > intercenter variability under uniform protocol", "NUMERIC_RESULT", "The study documents multicenter reproducibility under a uniform MOLLI protocol and centralized analysis."), evidence("dabir-2014-multicenter", "QUALIFIES", "Discussion > Generalizability", "LIMITATION", "The platform and uniform-protocol conditions limit transfer to arbitrary scanners or sequences.")],
  },
  {
    slug: "t1mes-repeatability-system-dependent", type: "LiteralValueAssertion", subject: c.repeatability, predicate: "VARIES_WITH_TECHNICAL_SYSTEM", literal: "FIELD_STRENGTH_SEQUENCE_MANUFACTURER_AND_SOFTWARE_DEPENDENT_IN_PHANTOM_PROGRAM", context: ctx.t1mesPhantom, polarity: "QUALIFIED", maturity: "VALIDATED", quality: "HIGH", facets: { concepts: [method, c.repeatability, c["interscanner-reproducibility"]], modalities: [mr], fieldStrengths: [c["field-strength-1-5-t"], c["field-strength-3-t"]], populations: ["PHANTOM_NOT_HUMAN"], limitations: ["PHANTOM_TO_IN_VIVO_GENERALIZATION"] },
    evidence: [evidence("captur-2020-t1mes", "SUPPORTS", "Results > scanner, sequence, field and software effects", "NUMERIC_RESULT", "The multinational phantom program found systematic performance differences associated with acquisition and scanner-system factors."), evidence("captur-2020-t1mes", "QUALIFIES", "Discussion > Limitations", "LIMITATION", "Phantom repeatability cannot be treated as direct in-vivo clinical reproducibility.")],
  },
  {
    slug: "ecv-requires-hematocrit", type: "EntityObjectAssertion", subject: c["myocardial-ecv-mr"], predicate: "REQUIRES_INPUT", object: c.hematocrit, context: ctx.mrEcv, polarity: "POSITIVE", maturity: "ESTABLISHED", quality: "HIGH", facets: { concepts: [ecv, c["myocardial-ecv-mr"], c.hematocrit], modalities: [mr], measurements: ["ECV_MR"] },
    evidence: [evidence("kellman-2012-ecv", "SUPPORTS", "Methods > ECV measurement > Equation (1)", "METHOD_DESCRIPTION", "Measured hematocrit is an explicit multiplicative input to the reported CMR ECV equation."), evidence("moon-2013-consensus", "SUPPORTS", "Terminology and methods > ECV equation", "METHOD_DESCRIPTION", "The consensus definition also includes hematocrit.")],
  },
  {
    slug: "ecv-requires-four-t1-inputs", type: "LiteralValueAssertion", subject: c["myocardial-ecv-mr"], predicate: "REQUIRES_T1_INPUTS", literal: "NATIVE_AND_POST_CONTRAST_MYOCARDIAL_AND_BLOOD_T1", context: ctx.mrEcv, polarity: "POSITIVE", maturity: "ESTABLISHED", quality: "HIGH", facets: { concepts: [ecv, c["native-myocardial-t1"], c["post-contrast-myocardial-t1"], c["native-blood-t1"], c["post-contrast-blood-t1"]], modalities: [mr], measurements: ["ECV_MR"] },
    evidence: [evidence("kellman-2012-ecv", "SUPPORTS", "Methods > ECV measurement > Equation (1)", "METHOD_DESCRIPTION", "The formula uses native and post-contrast T1 from myocardium and blood.")],
  },
  {
    slug: "recent-infarct-equilibrium-limitation", type: "EntityObjectAssertion", subject: c["post-contrast-delay"], predicate: "CAN_LIMIT", object: c["myocardial-ecv-mr"], context: ctx.acuteMiMr, polarity: "NEGATIVE", maturity: "VALIDATED", quality: "MODERATE", facets: { concepts: [ecv, c["acute-myocardial-infarction"], c["post-contrast-delay"]], modalities: [mr], diseases: [c["acute-myocardial-infarction"]], limitations: [c["post-contrast-delay"]] },
    evidence: [evidence("kellman-2012-ecv", "SUPPORTS", "Discussion > Contrast equilibrium and recently infarcted myocardium", "LIMITATION", "The paper warns that a bolus protocol near 15 minutes may not provide adequate equilibrium in recently infarcted tissue.")],
  },
  {
    slug: "motion-registration-limitation", type: "EntityObjectAssertion", subject: c["cardiac-motion"], predicate: "CAN_LIMIT", object: c["myocardial-ecv-mr"], context: ctx.mrEcv, polarity: "NEGATIVE", maturity: "VALIDATED", quality: "MODERATE", facets: { concepts: [ecv, c["cardiac-motion"]], modalities: [mr], limitations: [c["cardiac-motion"]] },
    evidence: [evidence("kellman-2012-ecv", "SUPPORTS", "Methods and Results > automated image registration", "METHOD_DESCRIPTION", "Pre/post map misregistration is addressed by automated registration because motion can misalign ECV inputs.")],
  },
  {
    slug: "myocarditis-t1-t2-combination", type: "RecommendationAssertion", subject: c["acute-myocarditis"], predicate: "ASSESSED_WITH_COMBINED_T1_AND_T2_CRITERIA", normative: "In suspected myocardial inflammation, a T1-based criterion should be interpreted together with a T2-based criterion when both are available.", context: ctx.myocarditisMr, polarity: "POSITIVE", maturity: "ESTABLISHED", quality: "HIGH", facets: { concepts: [c["acute-myocarditis"], t1, ecv], modalities: [mr], diseases: [c["acute-myocarditis"]], sourceTypes: ["RECOMMENDATION"] },
    evidence: [evidence("ferreira-2018-myocarditis", "SUPPORTS", "PubMed > Abstract > Updated CMR criteria", "RECOMMENDATION_TEXT", "The expert recommendations combine at least one T2-based with one T1-based criterion for stronger specificity.")],
  },
  {
    slug: "myocarditis-single-criterion-less-specific", type: "LiteralValueAssertion", subject: c["acute-myocarditis"], predicate: "SINGLE_MAPPING_CRITERION_HAS_LIMITATION", literal: "LOWER_SPECIFICITY_THAN_COMBINED_T1_AND_T2_CRITERIA", context: ctx.myocarditisMr, polarity: "NEGATIVE", maturity: "ESTABLISHED", quality: "HIGH", facets: { concepts: [c["acute-myocarditis"], t1, ecv], modalities: [mr], diseases: [c["acute-myocarditis"]], limitations: ["SINGLE_CRITERION_SPECIFICITY"] },
    evidence: [evidence("ferreira-2018-myocarditis", "SUPPORTS", "PubMed > Abstract > Updated CMR criteria, final sentences", "RECOMMENDATION_TEXT", "The expert statement notes that one criterion alone may support diagnosis with lower specificity.")],
  },
  {
    slug: "native-t1-associated-troponin-myocarditis", type: "LiteralValueAssertion", subject: c["native-myocardial-t1"], predicate: "ASSOCIATED_WITH", literal: "TEN_FOLD_TROPONIN_ELEVATION_IN_SUSPECTED_MYOCARDITIS_COHORT", context: ctx.myocarditisMr, polarity: "POSITIVE", maturity: "PRELIMINARY", quality: "MODERATE", facets: { concepts: [t1, c["acute-myocarditis"]], modalities: [mr], diseases: [c["acute-myocarditis"]], populations: ["SUSPECTED_MYOCARDITIS"] },
    evidence: [evidence("nadjiri-2017-myocarditis", "SUPPORTS", "PubMed > Abstract > Methods and Results", "NUMERIC_RESULT", "In the retrospective cohort, native T1 was associated with the study's ten-fold troponin-elevation reference."), evidence("nadjiri-2017-myocarditis", "QUALIFIES", "PubMed > Abstract > Methods", "LIMITATION", "The reference was troponin-defined myocardial damage, not histologic proof of myocarditis.")],
  },
  {
    slug: "ecv-associated-troponin-myocarditis", type: "LiteralValueAssertion", subject: c["myocardial-ecv-mr"], predicate: "ASSOCIATED_WITH", literal: "TEN_FOLD_TROPONIN_ELEVATION_IN_SUSPECTED_MYOCARDITIS_COHORT", context: ctx.myocarditisMr, polarity: "POSITIVE", maturity: "PRELIMINARY", quality: "MODERATE", facets: { concepts: [ecv, c["acute-myocarditis"]], modalities: [mr], diseases: [c["acute-myocarditis"]], populations: ["SUSPECTED_MYOCARDITIS"] },
    evidence: [evidence("nadjiri-2017-myocarditis", "SUPPORTS", "PubMed > Abstract > Results", "NUMERIC_RESULT", "In the retrospective cohort, ECV was associated with the study's troponin-elevation reference."), evidence("nadjiri-2017-myocarditis", "QUALIFIES", "PubMed > Abstract > Conclusions", "AUTHOR_INTERPRETATION", "The authors call for further prospective evaluation rather than issuing a clinical recommendation.")],
  },
  {
    slug: "early-timing-improves-myocarditis-detection", type: "LiteralValueAssertion", subject: c["post-contrast-delay"], predicate: "EARLY_IMAGING_IMPROVES_MYOCARDITIS_DETECTION_OVER_LATE", literal: "HYPOTHESIS_NOT_SUPPORTED_IN_SELECTED_STUDY", context: ctx.myocarditisTiming, polarity: "NEGATIVE", maturity: "PRELIMINARY", quality: "MODERATE", reviewState: "CONTESTED", facets: { concepts: [ecv, t1, c["acute-myocarditis"], c["post-contrast-delay"]], modalities: [mr], diseases: [c["acute-myocarditis"]], limitations: [c["post-contrast-delay"]] },
    evidence: [evidence("lundin-2019-timing", "REFUTES", "PubMed > Abstract > Results and Conclusions", "NUMERIC_RESULT", "The study did not find improved myocarditis detection at about 3 minutes compared with about 21 minutes post contrast.")],
  },
  {
    slug: "ecv-associated-functional-recovery-acute-mi", type: "LiteralValueAssertion", subject: c["myocardial-ecv-mr"], predicate: "ASSOCIATED_WITH", literal: "SEGMENTAL_FUNCTIONAL_RECOVERY_AFTER_ACUTE_MI", context: ctx.acuteMiMr, polarity: "POSITIVE", maturity: "PRELIMINARY", quality: "MODERATE", facets: { concepts: [ecv, c["acute-myocardial-infarction"]], modalities: [mr], diseases: [c["acute-myocardial-infarction"]], populations: ["ACUTE_MI"] },
    evidence: [evidence("kidambi-2017-mi", "SUPPORTS", "Abstract > Results > ECV and functional recovery", "NUMERIC_RESULT", "In the prospective acute-MI cohort, ECV was associated with later segmental functional recovery."), evidence("kidambi-2017-mi", "QUALIFIES", "Methods and Discussion > cohort and study design", "LIMITATION", "The single-center cohort included 39 patients; the association is not an automated clinical decision rule.")],
  },
  {
    slug: "ecv-prognostic-al-amyloidosis", type: "LiteralValueAssertion", subject: c["myocardial-ecv-mr"], predicate: "ASSOCIATED_WITH", literal: "SURVIVAL_IN_SYSTEMIC_AL_AMYLOIDOSIS", context: ctx.amyloidMr, polarity: "POSITIVE", maturity: "VALIDATED", quality: "MODERATE", facets: { concepts: [ecv, c["systemic-al-amyloidosis"]], modalities: [mr], diseases: [c["systemic-al-amyloidosis"]], populations: ["SYSTEMIC_AL_AMYLOIDOSIS"] },
    evidence: [evidence("banypersad-2015-amyloid", "SUPPORTS", "Abstract > Results and Conclusions > ECV and mortality", "NUMERIC_RESULT", "The prospective AL amyloidosis cohort reports an association between myocardial ECV and survival."), evidence("banypersad-2015-amyloid", "QUALIFIES", "Methods > Study population", "LIMITATION", "The population was systemic AL amyloidosis and cannot be generalized to all amyloid subtypes.")],
  },
  {
    slug: "ct-ecv-feasible-vs-mr-small-study", type: "LiteralValueAssertion", subject: c["myocardial-ecv-ct"], predicate: "CORRELATED_WITH", literal: "CMR_ECV_IN_SMALL_FEASIBILITY_COHORT", context: ctx.ctEcvBolus, polarity: "POSITIVE", maturity: "PRELIMINARY", quality: "LOW", facets: { concepts: [ecv, c["myocardial-ecv-ct"], c["myocardial-ecv-mr"]], modalities: [ct], comparisons: ["CT_ECV_VS_MR_ECV"], populations: ["SMALL_FEASIBILITY_COHORT"] },
    evidence: [evidence("nacif-2012-ct", "SUPPORTS", "Results > CT ECV compared with MR ECV", "NUMERIC_RESULT", "The 24-person feasibility study reported correlation between low-dose CT ECV and MR ECV."), evidence("nacif-2012-ct", "QUALIFIES", "Discussion > Limitations", "LIMITATION", "The small study used MR rather than histology as reference and analyzed limited myocardial segments.", { quality: "LOW" })],
  },
  {
    slug: "ct-ecv-correlates-histology-aortic-stenosis", type: "LiteralValueAssertion", subject: c["myocardial-ecv-ct"], predicate: "CORRELATED_WITH", literal: "HISTOLOGIC_EXTRACELLULAR_SPACE_IN_SEVERE_AORTIC_STENOSIS", context: ctx.ctEcvEquilibrium, polarity: "POSITIVE", maturity: "PRELIMINARY", quality: "MODERATE", facets: { concepts: [ecv, c["myocardial-ecv-ct"], c["diffuse-myocardial-fibrosis"]], modalities: [ct], populations: ["SEVERE_AORTIC_STENOSIS"] },
    evidence: [evidence("bandula-2013-ct", "SUPPORTS", "PubMed > Abstract > Results", "NUMERIC_RESULT", "Equilibrium contrast-enhanced CT ECV correlated with histologic extracellular space in the severe-aortic-stenosis cohort."), evidence("bandula-2013-ct", "QUALIFIES", "PubMed > Abstract > Methods", "LIMITATION", "The cohort comprised 23 patients and used an equilibrium iodine-infusion protocol.")],
  },
  {
    slug: "ct-mr-ecv-correlation-meta", type: "LiteralValueAssertion", subject: c["myocardial-ecv-ct"], predicate: "HAS_REPORTED_AGREEMENT_WITH", literal: "CMR_ECV_ACROSS_HETEROGENEOUS_STUDIES", context: ctx.ctEcvBolus, polarity: "QUALIFIED", maturity: "VALIDATED", quality: "MODERATE", facets: { concepts: [ecv, c["myocardial-ecv-ct"], c["myocardial-ecv-mr"]], modalities: [ct], comparisons: ["CT_ECV_VS_MR_ECV"], sourceTypes: ["META_ANALYSIS"] },
    evidence: [evidence("han-2023-ct-meta", "SUPPORTS", "PubMed > Abstract > Results", "NUMERIC_RESULT", "The systematic review reports strong CT-to-CMR ECV agreement across 13 included studies."), evidence("han-2023-ct-meta", "QUALIFIES", "PubMed > Abstract > Conclusions", "LIMITATION", "The authors rated the overall included-study quality low and methods were heterogeneous.")],
  },
  {
    slug: "ct-evidence-quality-low", type: "LiteralValueAssertion", subject: c["myocardial-ecv-ct"], predicate: "HAS_EVIDENCE_LIMITATION", literal: "LOW_OVERALL_QUALITY_IN_2023_SYSTEMATIC_REVIEW", context: ctx.ctEcvBolus, polarity: "NEGATIVE", maturity: "VALIDATED", quality: "MODERATE", facets: { concepts: [ecv, c["myocardial-ecv-ct"]], modalities: [ct], limitations: ["LOW_STUDY_QUALITY", "METHOD_HETEROGENEITY"] },
    evidence: [evidence("han-2023-ct-meta", "SUPPORTS", "PubMed > Abstract > Conclusions", "LIMITATION", "The review explicitly characterizes the overall quality of included CT ECV evidence as low.")],
  },
  {
    slug: "ct-ecv-single-energy-formula", type: "LiteralValueAssertion", subject: c["myocardial-ecv-ct"], predicate: "HAS_DOCUMENTED_FORMULA", literal: "ECV_CT = (1 - Hct) * (DeltaHU_myocardium / DeltaHU_blood)", context: ctx.ctEcvBolus, polarity: "POSITIVE", maturity: "ESTABLISHED", quality: "MODERATE", facets: { concepts: [ecv, c["myocardial-ecv-ct"], c.hematocrit], modalities: [ct], measurements: ["ECV_CT_SINGLE_ENERGY"] },
    evidence: [evidence("cundari-2023-ct-method", "DERIVES", "CT-ECV calculation > Single-energy CT > equation", "METHOD_DESCRIPTION", "The technical review gives the hematocrit-adjusted ratio of myocardial to blood attenuation changes for single-energy CT ECV.")],
  },
  {
    slug: "ct-ecv-delayed-phase", type: "QuantitativeAssertion", subject: c["myocardial-ecv-ct"], predicate: "USES_REPORTED_DELAY_RANGE", quantitative: { value: { min: 3, max: 10 }, unit: "minute", phase: "LATE_PHASE", unitRequired: true }, context: ctx.ctEcvBolus, polarity: "QUALIFIED", maturity: "ESTABLISHED", quality: "MODERATE", facets: { concepts: [ecv, c["myocardial-ecv-ct"], c["post-contrast-delay"]], modalities: [ct], limitations: [c["post-contrast-delay"]] },
    evidence: [evidence("cundari-2023-ct-method", "SUPPORTS", "Acquisition protocols > Late-phase acquisition timing", "METHOD_DESCRIPTION", "The review describes late CT acquisition commonly performed within a 3-to-10-minute range.")],
  },
  {
    slug: "ct-spectral-formula-distinct", type: "LiteralValueAssertion", subject: c["myocardial-ecv-ct"], predicate: "HAS_ALTERNATIVE_SPECTRAL_METHOD", literal: "IODINE_DENSITY_MYOCARDIUM_TO_BLOOD_RATIO_WITH_HEMATOCRIT", context: ctx.ctEcvBolus, polarity: "POSITIVE", maturity: "VALIDATED", quality: "MODERATE", facets: { concepts: [ecv, c["myocardial-ecv-ct"], c["iodine-density-change"]], modalities: [ct], measurements: ["ECV_CT_SPECTRAL"] },
    evidence: [evidence("cundari-2023-ct-method", "SUPPORTS", "CT-ECV calculation > Dual-energy and spectral CT", "METHOD_DESCRIPTION", "The review describes an iodine-density ratio method distinct from the pre/delayed HU-difference method.")],
  },
  {
    slug: "mr-ct-ecv-formulas-distinct", type: "EntityObjectAssertion", subject: c["myocardial-ecv-mr"], predicate: "IS_METHOD_DISTINCT_FROM", object: c["myocardial-ecv-ct"], context: ctx.mrEcv, polarity: "POSITIVE", maturity: "ESTABLISHED", quality: "HIGH", facets: { concepts: [ecv, c["myocardial-ecv-mr"], c["myocardial-ecv-ct"]], modalities: [mr, ct], comparisons: ["MR_ECV_VS_CT_ECV"] },
    evidence: [evidence("kellman-2012-ecv", "DERIVES", "Methods > ECV measurement > Equation (1)", "DERIVED_INTERPRETATION", "The CMR formula contributes to the cross-source conclusion that CMR and CT ECV are methodologically distinct."), evidence("cundari-2023-ct-method", "DERIVES", "CT-ECV calculation > equations", "DERIVED_INTERPRETATION", "The CT formulas contribute to the cross-source conclusion that CMR and CT ECV are methodologically distinct.", { applicability: ctx.ctEcvBolus.contextId })],
  },
  {
    slug: "synthetic-hct-acceptable-agreement", type: "LiteralValueAssertion", subject: c["synthetic-hematocrit"], predicate: "PROVIDES_ACCEPTABLE_ECV_AGREEMENT", literal: "CONTEXT_DEPENDENT_AND_CONTESTED", context: ctx.syntheticHctLocal, polarity: "QUALIFIED", maturity: "PRELIMINARY", quality: "MODERATE", reviewState: "CONTESTED", facets: { concepts: [ecv, c["synthetic-hematocrit"], c.hematocrit], modalities: [mr], comparisons: ["MEASURED_VS_SYNTHETIC_HEMATOCRIT"], contradictions: ["SYNTHETIC_HEMATOCRIT_TRANSFERABILITY"] },
    evidence: [evidence("kammerlander-2018-synthetic-hct", "SUPPORTS", "Results > measured versus synthetic ECV agreement", "NUMERIC_RESULT", "A single-center derivation and validation cohort reported agreement for locally calibrated synthetic-hematocrit ECV.", { applicability: ctx.syntheticHctLocal.contextId }), evidence("shang-2018-synthetic-hct", "REFUTES", "Results and Conclusions > clinical misclassification at 3 T", "NUMERIC_RESULT", "A separate 3 T cohort found clinically relevant classification errors with synthetic hematocrit.", { applicability: ctx.syntheticHct3T.contextId })],
  },
  {
    slug: "synthetic-hct-local-calibration", type: "EntityObjectAssertion", subject: c["method-dependence"], predicate: "LIMITS_GENERALIZATION_OF", object: c["synthetic-hematocrit"], context: ctx.syntheticHctLocal, polarity: "NEGATIVE", maturity: "VALIDATED", quality: "MODERATE", facets: { concepts: [c["synthetic-hematocrit"], c["method-dependence"]], modalities: [mr], limitations: ["LOCAL_CALIBRATION"] },
    evidence: [evidence("kammerlander-2018-synthetic-hct", "SUPPORTS", "Methods and Discussion > local derivation and validation", "LIMITATION", "The synthetic-hematocrit relationship was locally derived; universal transferability was not established."), evidence("shang-2018-synthetic-hct", "SUPPORTS", "Discussion > dependence on field strength and local equation", "LIMITATION", "The 3 T study demonstrates that a blood-T1 equation cannot be assumed interchangeable across contexts.")],
  },
  {
    slug: "synthetic-hct-3t-misclassification", type: "QuantitativeAssertion", subject: c["synthetic-hematocrit"], predicate: "HAD_REPORTED_MISCLASSIFICATION_RANGE", quantitative: { value: { min: 6, max: 25 }, unit: "percent", context: "CENTER_SPECIFIC_3T_CUTOFFS", unitRequired: true }, context: ctx.syntheticHct3T, polarity: "NEGATIVE", maturity: "PRELIMINARY", quality: "MODERATE", facets: { concepts: [ecv, c["synthetic-hematocrit"]], modalities: [mr], fieldStrengths: [c["field-strength-3-t"]], limitations: ["CLINICAL_MISCLASSIFICATION"] },
    evidence: [evidence("shang-2018-synthetic-hct", "SUPPORTS", "Results > misclassification analysis", "NUMERIC_RESULT", "The 3 T study reports a 6% to 25% misclassification range depending on the tested cutoff and formula.", { limitations: ["Center-specific thresholds; not a universal diagnostic range."] })],
  },
  {
    slug: "mr-ecv-correlates-histology", type: "LiteralValueAssertion", subject: c["myocardial-ecv-mr"], predicate: "CORRELATED_WITH", literal: "WHOLE_HEART_HISTOLOGIC_EXTRACELLULAR_SPACE_IN_TRANSPLANT_SUBSET", context: ctx.mrEcv, polarity: "POSITIVE", maturity: "VALIDATED", quality: "MODERATE", facets: { concepts: [ecv, c["myocardial-ecv-mr"], c["diffuse-myocardial-fibrosis"]], modalities: [mr], populations: ["TRANSPLANT_HISTOLOGY_SUBSET"] },
    evidence: [evidence("miller-2013-histology", "SUPPORTS", "PubMed > Abstract > Results > histologic validation", "NUMERIC_RESULT", "CMR ECV correlated with histologic extracellular matrix in the whole-heart transplant validation subset."), evidence("miller-2013-histology", "QUALIFIES", "PubMed > Abstract > Methods", "LIMITATION", "Histologic validation involved six explanted hearts, constraining generalization.")],
  },
  {
    slug: "isolated-postcontrast-t1-insufficient", type: "NegativeAssertion", subject: c["post-contrast-myocardial-t1"], predicate: "IS_NOT_SUFFICIENT_AS_STANDALONE_ECV_SURROGATE", literal: "DEPENDENT_ON_CONTRAST_DOSE_REGION_AND_SEX_IN_SELECTED_STUDY", context: ctx.mrEcv, polarity: "NEGATIVE", maturity: "VALIDATED", quality: "MODERATE", facets: { concepts: [t1, ecv, c["post-contrast-myocardial-t1"]], modalities: [mr], limitations: ["POST_CONTRAST_T1_CONFOUNDING"] },
    evidence: [evidence("miller-2013-histology", "SUPPORTS", "PubMed > Abstract > Results and Conclusions", "LIMITATION", "Isolated post-contrast T1 varied with contrast dose, region and sex and was not an adequate standalone ECV substitute.")],
  },
  {
    slug: "field-and-site-specific-values", type: "LiteralValueAssertion", subject: method, predicate: "HAS_CONTEXT_DEPENDENT_VALUES", literal: "MEASURED_VALUES_CAN_DIFFER_BY_FIELD_STRENGTH_AND_SITE", context: ctx.mrGeneral, polarity: "QUALIFIED", maturity: "ESTABLISHED", quality: "HIGH", facets: { concepts: [t1, ecv, method], modalities: [mr], fieldStrengths: [c["field-strength-1-5-t"], c["field-strength-3-t"]], limitations: ["SITE_SPECIFIC_VALUES"] },
    evidence: [evidence("kramer-2020-protocols", "SUPPORTS", "Advanced tissue characterization > introductory paragraph", "RECOMMENDATION_TEXT", "The 2020 SCMR protocol update states that measured mapping values often differ between 1.5 T and 3 T and may be site-specific.")],
  },
  {
    slug: "protocol-ecv-postcontrast-window", type: "QuantitativeAssertion", subject: c["myocardial-ecv-mr"], predicate: "HAS_PROTOCOL_POSTCONTRAST_WINDOW", quantitative: { value: { min: 10, max: 30 }, unit: "minute", phase: "POST_CONTRAST_BOLUS", unitRequired: true }, context: ctx.mrEcv, polarity: "POSITIVE", maturity: "ESTABLISHED", quality: "HIGH", facets: { concepts: [ecv, c["myocardial-ecv-mr"], c["post-contrast-delay"]], modalities: [mr], limitations: [c["post-contrast-delay"]], sourceTypes: ["GUIDELINE"] },
    evidence: [evidence("kramer-2020-protocols", "SUPPORTS", "Advanced tissue characterization > T1 mapping > item g", "RECOMMENDATION_TEXT", "The 2020 SCMR protocol guidance requests pre-contrast mapping and at least one post-contrast time point between 10 and 30 minutes."), evidence("schulz-menger-2020-postprocessing", "QUALIFIES", "Parametric mapping > T1 mapping and ECV > item i", "RECOMMENDATION_TEXT", "The 2020 post-processing guidance describes post-contrast mapping typically after 10 minutes to approach steady state.")],
  },
  {
    slug: "hematocrit-within-24-hours", type: "RecommendationAssertion", subject: c.hematocrit, predicate: "SHOULD_BE_MEASURED_NEAR_CMR", normative: "For the most accurate CMR ECV measurement, hematocrit should be measured, ideally within 24 hours of imaging.", context: ctx.mrEcv, polarity: "POSITIVE", maturity: "ESTABLISHED", quality: "HIGH", facets: { concepts: [ecv, c.hematocrit, c["myocardial-ecv-mr"]], modalities: [mr], sourceTypes: ["GUIDELINE"] },
    evidence: [evidence("kramer-2020-protocols", "SUPPORTS", "Advanced tissue characterization > T1 mapping > item h", "RECOMMENDATION_TEXT", "The 2020 SCMR protocol update recommends hematocrit measurement, ideally within 24 hours, for accurate ECV.")],
  },
  {
    slug: "blood-roi-excludes-papillary-trabeculae", type: "RecommendationAssertion", subject: c["myocardial-ecv-mr"], predicate: "USES_BLOOD_POOL_ROI_EXCLUDING_STRUCTURES", normative: "Blood-pool regions used for CMR ECV should avoid papillary muscles and trabeculae in native and post-contrast T1 maps.", context: ctx.mrEcv, polarity: "POSITIVE", maturity: "ESTABLISHED", quality: "HIGH", facets: { concepts: [ecv, c["myocardial-ecv-mr"], c["native-blood-t1"], c["post-contrast-blood-t1"]], modalities: [mr], sourceTypes: ["GUIDELINE"] },
    evidence: [evidence("schulz-menger-2020-postprocessing", "SUPPORTS", "Parametric mapping > T1 mapping and ECV > item j", "RECOMMENDATION_TEXT", "The SCMR post-processing update instructs blood-pool ROI placement away from papillary muscles and trabeculae.")],
  },
  {
    slug: "messroghli-correction-lifecycle", type: "EntityObjectAssertion", subject: sourceByKey["messroghli-2018-correction"].stableId, predicate: "CORRECTS", object: sourceByKey["messroghli-2017-consensus"].stableId, context: ctx.mrGeneral, polarity: "POSITIVE", maturity: "ESTABLISHED", quality: "HIGH", facets: { concepts: [method, ecv], modalities: [mr], documentaryStatuses: ["CORRECTED"] },
    evidence: [evidence("messroghli-2018-correction", "CORRECTS", "Correction notice > title and corrected article citation", "DIRECT_STATEMENT", "The official notice identifies and corrects the 2017 SCMR/EACVI mapping position paper.")],
  },
  {
    slug: "plos-correction-lifecycle", type: "EntityObjectAssertion", subject: sourceByKey["andonian-2016-correction"].stableId, predicate: "CORRECTS", object: sourceByKey["andonian-2016-original"].stableId, context: null, polarity: "POSITIVE", maturity: "ESTABLISHED", quality: "HIGH", facets: { concepts: [], modalities: [], documentaryStatuses: ["CORRECTED"], lifecycleOnly: true },
    evidence: [evidence("andonian-2016-correction", "CORRECTS", "PLOS correction notice > title, DOI and original article citation", "DIRECT_STATEMENT", "The official PLOS notice unambiguously identifies DOI 10.1371/journal.pone.0161855 as the corrected article."), evidence("andonian-2016-original", "MENTIONS", "PLOS article identity > title and DOI", "DIRECT_STATEMENT", "The original record establishes the identity of the work but does not itself establish the later correction relation.")],
  },
];

const conclusion = (definition) => ({
  objectEntityId: definition.object ?? null,
  literalValue: definition.literal ?? null,
  quantitativeValue: definition.quantitative ?? null,
  normativeStatement: definition.normative ?? null,
});

const assertionRecords = definitions.map((definition) => {
  const stableId = `noxia:radiology:scientific-assertion:ecv-t1:${definition.slug}`;
  const sourceRefs = [...new Set(definition.evidence.map((item) => sourceByKey[item.sourceKey].revisionId))].sort();
  const identity = createScientificAssertionIdentity({ stableId, assertionType: definition.type, sourceRefs });
  const revision = createScientificAssertionRevision({
    stableId,
    assertionType: definition.type,
    subjectEntityId: definition.subject,
    predicate: definition.predicate,
    ...conclusion(definition),
    statement: { subject: definition.subject, predicate: definition.predicate, object: definition.object ?? definition.literal ?? definition.quantitative ?? definition.normative },
    scope: "NOXIA_PUBLIC_WEBSITE_DOCUMENTARY_SCIENTIFIC_CORPUS",
    context: definition.context,
    population: definition.facets?.populations ?? null,
    method: definition.facets?.methods?.[0] ?? (definition.facets?.modalities?.includes(mr) ? method : null),
    temporalContext: definition.context?.dimensions?.find((item) => item.dimension === "temporality") ?? null,
    applicability: definition.context?.contextId ?? null,
    limitations: definition.evidence.flatMap((item) => item.limitations),
    polarity: definition.polarity,
    status: "ACTIVE",
    confidence: definition.quality === "HIGH" ? "HIGH" : definition.quality === "LOW" ? "LOW" : "MODERATE",
    evidenceQuality: definition.quality,
    scientificMaturity: definition.maturity,
    sourceRefs,
    reviewer: SCIENTIFIC_CORPUS_REVIEWER,
    reviewerStatus: "REVIEWED",
    reviewState: definition.reviewState ?? "SOURCE_LOCALIZED",
    reviewType: SCIENTIFIC_CORPUS_REVIEW_TYPE,
    humanReviewed: false,
    modality: definition.facets?.modalities ?? [],
    sequence: definition.facets?.sequences ?? definition.facets?.methods ?? [],
    fieldStrength: definition.facets?.fieldStrengths ?? [],
    facets: definition.facets ?? {},
  });
  return { identity, revision, evidenceDefinitions: definition.evidence };
});

export const scientificAssertionIdentities = Object.freeze(assertionRecords.map((item) => item.identity).sort((a, b) => a.stableId.localeCompare(b.stableId)));
export const scientificAssertionRevisions = Object.freeze(assertionRecords.map((item) => item.revision).sort((a, b) => a.revisionId.localeCompare(b.revisionId)));

export const scientificEvidenceLinks = Object.freeze(assertionRecords.flatMap(({ revision, evidenceDefinitions }) => evidenceDefinitions.map((item, index) => {
  const sourceRevision = sourceByKey[item.sourceKey];
  const evidenceQuality = item.quality ?? sourceRevision.metadata.sourceQuality.methodologicalQuality;
  const normalizedQuality = ["VERY_LOW", "LOW", "MODERATE", "HIGH"].includes(evidenceQuality) ? evidenceQuality : "HIGH";
  return createEvidenceLink({
    evidenceLinkId: `${revision.stableId}:evidence:${sourceRevision.pmid ?? item.sourceKey}:${item.relationType.toLowerCase()}:${index + 1}`,
    sourceRevisionId: sourceRevision.revisionId,
    assertionRevisionId: revision.revisionId,
    relationType: item.relationType,
    locator: item.locator,
    extractedStatement: item.analyticalSummary,
    analyticalSummary: item.analyticalSummary,
    applicability: item.applicability ?? revision.applicability,
    confidence: item.confidence,
    evidenceSourceType: sourceRevision.metadata.evidenceSourceType,
    evidenceQuality: normalizedQuality,
    reviewerStatus: "REVIEWED",
    reviewer: SCIENTIFIC_CORPUS_REVIEWER,
    reviewType: SCIENTIFIC_CORPUS_REVIEW_TYPE,
    reviewedAt: SCIENTIFIC_CORPUS_RETRIEVED_AT,
    limitations: [...item.limitations],
    sourceRefs: [sourceRevision.revisionId],
    extraction: {
      sourceRevisionId: sourceRevision.revisionId,
      section: item.locator.split(" > ")[0],
      page: null,
      paragraph: item.locator,
      tableOrFigure: /table|figure/i.test(item.locator) ? item.locator : null,
      passage: item.analyticalSummary,
      consultedAt: SCIENTIFIC_CORPUS_RETRIEVED_AT,
      analyticalSummary: item.analyticalSummary,
      assertionDerived: revision.revisionId,
      interpretationLevel: item.extractionType,
      directAuthorStatement: item.extractionType !== "DERIVED_INTERPRETATION",
    },
  });
})).sort((a, b) => a.evidenceLinkId.localeCompare(b.evidenceLinkId)));

export const assertionReviewDecisions = Object.freeze(scientificAssertionRevisions.map((revision) => ({
  decisionId: `${revision.revisionId}:review:automated-structural:1`,
  assertionRevisionId: revision.revisionId,
  reviewer: SCIENTIFIC_CORPUS_REVIEWER,
  date: SCIENTIFIC_CORPUS_RETRIEVED_AT,
  decision: revision.reviewState,
  justification: "Schema, atomicity, source identity, evidence-link locality and protected-surface guards checked automatically; scientific human review not performed.",
  sourceVerified: false,
  scope: "AUTOMATED_STRUCTURE_AND_PROVENANCE_SHAPE_ONLY",
  reservations: ["No scientific human review has occurred.", "Public publication remains blocked."],
  previousStatus: "EXTRACTED",
  newStatus: revision.reviewState,
  reviewType: SCIENTIFIC_CORPUS_REVIEW_TYPE,
  scientificHumanReview: null,
})));

export const evidenceRelationCounts = Object.freeze(Object.fromEntries(
  ["SUPPORTS", "REFUTES", "QUALIFIES", "MENTIONS", "DERIVES", "CORRECTS", "RETRACTS", "UNRESOLVED_EVIDENCE_LINK"]
    .map((relationType) => [relationType, scientificEvidenceLinks.filter((link) => link.relationType === relationType).length]),
));
