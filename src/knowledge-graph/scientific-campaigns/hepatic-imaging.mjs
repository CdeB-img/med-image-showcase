import { sha256Digest } from "../migration/stable-json.mjs";
import { createStructuredLiteratureSynthesis } from "../structured-synthesis.mjs";

export const AUTOMATIC_CAMPAIGN_EXECUTED_AT = "2026-08-01T00:00:00.000Z";
export const AUTOMATIC_CAMPAIGN_ID = "noxia:scientific-campaign:hepatic-imaging:01";
export const AUTOMATIC_CAMPAIGN_DOMAIN_ID = "hepatic-imaging";
export const AUTOMATIC_CAMPAIGN_NODE_ID = "noxia:knowledge-catalog:domain:hepatic-imaging";
export const AUTOMATIC_CAMPAIGN_REVIEWER = "noxia-scientific-campaign-engine";
export const AUTOMATIC_CAMPAIGN_REVIEW_TYPE = "automatedScientificReview";

export const CAMPAIGN_PUBLICATION_GUARDS = Object.freeze({
  route: null,
  canonical: null,
  indexable: false,
  inSitemap: false,
  rendered: false,
  publicNavigation: false,
  publicPublication: false,
  internalOnly: true,
});

const sourceRows = [
  {
    pmid: "30251931",
    pmcid: "PMC6677371",
    doi: "10.1148/radiol.2018181494",
    title: "Liver Imaging Reporting and Data System (LI-RADS) Version 2018: Imaging of Hepatocellular Carcinoma in At-Risk Patients.",
    authors: ["Chernyak V", "Fowler KJ", "Kamaya A", "Kielar AZ", "Elsayes KM", "Bashir MR", "Kono Y", "Do RK", "Mitchell DG", "Singal AG", "Tang A", "Sirlin CB"],
    journal: "Radiology",
    publishedAt: "2018-12-01",
    volume: "289",
    issue: "3",
    pages: "816-830",
    sourceType: "GUIDELINE_STANDARDIZATION_DOCUMENT",
  },
  {
    pmid: "28892458",
    pmcid: "PMC5813433",
    doi: "10.1148/radiol.2017170550",
    title: "Linearity, Bias, and Precision of Hepatic Proton Density Fat Fraction Measurements by Using MR Imaging: A Meta-Analysis.",
    authors: ["Yokoo T", "Serai SD", "Pirasteh A", "Bashir MR", "Hamilton G", "Hernando D", "Hu HH", "Hetterich H", "Kühn JP", "Kukuk GM", "Loomba R", "Middleton MS", "Obuchowski NA", "Song JS", "Tang A", "Wu X", "Reeder SB", "Sirlin CB", "RSNA-QIBA PDFF Biomarker Committee"],
    journal: "Radiology",
    publishedAt: "2018-02-01",
    volume: "286",
    issue: "2",
    pages: "486-498",
    sourceType: "SYSTEMATIC_REVIEW_META_ANALYSIS",
  },
  {
    pmid: "36809220",
    pmcid: "PMC10068892",
    doi: "10.1148/radiol.221856",
    title: "Quantification of Liver Iron Overload with MRI: Review and Guidelines from the ESGAR and SAR.",
    authors: ["Reeder SB", "Yokoo T", "França M", "Hernando D", "Alberich-Bayarri Á", "Alústiza JM", "Gandon Y", "Henninger B", "Hillenbrand C", "Jhaveri K", "Karçaaltıncaba M", "Kühn JP", "Mojtahed A", "Serai SD", "Ward R", "Wood JC", "Yamamura J", "Martí-Bonmatí L"],
    journal: "Radiology",
    publishedAt: "2023-04-01",
    volume: "307",
    issue: "1",
    pages: "e221856",
    sourceType: "SOCIETY_GUIDELINE_REVIEW",
  },
  {
    pmid: "28530847",
    pmcid: "PMC5621724",
    doi: "10.1148/radiol.2017161398",
    title: "Repeatability of MR Elastography of Liver: A Meta-Analysis.",
    authors: ["Serai SD", "Obuchowski NA", "Venkatesh SK", "Sirlin CB", "Miller FH", "Ashton E", "Cole PE", "Ehman RL"],
    journal: "Radiology",
    publishedAt: "2017-10-01",
    volume: "285",
    issue: "1",
    pages: "92-100",
    sourceType: "SYSTEMATIC_REVIEW_META_ANALYSIS",
  },
  {
    pmid: "22777847",
    pmcid: "PMC4779595",
    doi: "10.1002/jmri.23741",
    title: "Proton density fat-fraction: a standardized MR-based biomarker of tissue fat concentration.",
    authors: ["Reeder SB", "Hu HH", "Sirlin CB"],
    journal: "Journal of magnetic resonance imaging : JMRI",
    publishedAt: "2012-11-01",
    volume: "36",
    issue: "5",
    pages: "1011-1014",
    sourceType: "EDITORIAL_POSITION",
  },
];

const sourceRecord = (row) => {
  const stableId = `noxia:scientific-source:pubmed:${row.pmid}`;
  const revisionId = `${stableId}:revision:1`;
  const material = { ...row, domainId: AUTOMATIC_CAMPAIGN_DOMAIN_ID, fullTextAvailability: "OFFICIAL_FULL_TEXT" };
  return Object.freeze({
    stableId,
    revisionId,
    revisionNumber: 1,
    domainId: AUTOMATIC_CAMPAIGN_DOMAIN_ID,
    ...row,
    language: "en",
    documentStatus: "CURRENT",
    fullTextAvailability: "OFFICIAL_FULL_TEXT",
    abstractOnly: false,
    officialMetadataUrl: `https://pubmed.ncbi.nlm.nih.gov/${row.pmid}/`,
    officialFullTextUrl: `https://pmc.ncbi.nlm.nih.gov/articles/${row.pmcid}/`,
    metadataAuthority: "NCBI_PUBMED_AND_PMC",
    authorsCompleteness: "COMPLETE_FROM_PUBMED",
    retrievedAt: AUTOMATIC_CAMPAIGN_EXECUTED_AT,
    contentDigest: null,
    contentDigestStatus: "NOT_ARCHIVED_LOCALLY_OFFICIAL_URL_RETAINED",
    digest: sha256Digest(material),
  });
};

export const hepaticImagingSourceRevisions = Object.freeze(sourceRows.map(sourceRecord).sort((a, b) => a.revisionId.localeCompare(b.revisionId)));
export const hepaticImagingSourceIdentities = Object.freeze(hepaticImagingSourceRevisions.map(({ stableId, pmid, doi, title }) => Object.freeze({ stableId, pmid, doi, title })));
export const hepaticSourceByPmid = Object.freeze(Object.fromEntries(hepaticImagingSourceRevisions.map((source) => [source.pmid, source])));

export const hepaticImagingInternalSourceAudit = Object.freeze([
  { path: "docs/p5-scientific-multidomain.md", type: "SCIENTIFIC_ROADMAP", decision: "PLANNING_SIGNAL_ONLY_NOT_EVIDENCE" },
  { path: "docs/p5-scientific-multidomain-report.md", type: "SCIENTIFIC_ROADMAP_REPORT", decision: "PLANNING_SIGNAL_ONLY_NOT_EVIDENCE" },
  { path: "src/knowledge-graph/scientific-multidomain/generality.mjs", type: "PLANNED_DOMAIN_REGISTRY", decision: "CATALOG_SEED_ONLY_NOT_EVIDENCE" },
]);

export const rejectedHepaticImagingSources = Object.freeze([
  { pmid: "30759967", pmcid: "PMC6759428", doi: "10.3350/cmh.2018.0090", title: "Comparison of international guidelines for noninvasive diagnosis of hepatocellular carcinoma: 2018 update.", reason: "SECONDARY_GUIDELINE_COMPARISON_OVERLAPS_RETAINED_LI_RADS_PRIMARY_DOCUMENT" },
  { pmid: "31392478", pmcid: "PMC6890593", doi: "10.1007/s00330-019-06380-9", title: "Practical guide to quantification of hepatic iron with MRI.", reason: "SUPERSEDED_FOR_THIS_CAMPAIGN_BY_NEWER_ESGAR_SAR_GUIDELINE_REVIEW" },
  { pmid: "34725719", pmcid: "PMC9538666", doi: "10.1007/s00261-021-03324-0", title: "Magnetic resonance elastography of the liver: everything you need to know to get started.", reason: "EDUCATIONAL_REVIEW_OVERLAPS_RETAINED_REPEATABILITY_META_ANALYSIS" },
]);

const conceptRows = [
  ["liver", "Foie", ["Organ"], "Organe auquel se rapportent les méthodes quantitatives et le système de classification documentés dans cette campagne.", "30251931", ["liver"]],
  ["hepatocellular-carcinoma", "Carcinome hépatocellulaire", ["Disease"], "Tumeur hépatique primitive ciblée par le cadre LI-RADS chez les populations à risque définies.", "30251931", ["hepatocellular carcinoma", "HCC"]],
  ["li-rads", "LI-RADS", ["Standard"], "Système documentaire de terminologie, technique, interprétation et compte rendu pour l'imagerie hépatique des patients à risque.", "30251931", ["Liver Imaging Reporting and Data System"]],
  ["hepatic-observation", "Observation hépatique", ["Observation"], "Zone ou structure distincte du parenchyme hépatique environnant, qui peut correspondre à une lésion réelle ou à une pseudolésion.", "30251931", ["liver observation"]],
  ["multiphase-hepatic-imaging", "Imagerie hépatique multiphasique", ["AcquisitionMethod"], "Acquisition CT ou IRM multiphasique après contraste utilisée pour caractériser des observations hépatiques.", "30251931", ["multiphase liver CT", "multiphase liver MRI"]],
  ["hepatic-pdff", "Fraction de graisse hépatique en densité de protons", ["DerivedMeasurement", "Biomarker"], "Mesure IRM dérivée rapportant la contribution des protons lipidiques mobiles à l'ensemble des protons mobiles lipidiques et aqueux.", "22777847", ["hepatic proton density fat fraction", "PDFF"]],
  ["signal-fat-fraction", "Fraction graisseuse de signal", ["DerivedMeasurement"], "Rapport de signaux graisse et eau non nécessairement corrigé de tous les facteurs confondants de la PDFF.", "22777847", ["signal fat fraction"]],
  ["chemical-shift-encoded-mri", "IRM encodée par déplacement chimique", ["MeasurementMethod"], "Méthode IRM séparant les composantes eau et graisse avec des corrections explicitement documentées.", "22777847", ["chemical shift-encoded MRI", "CSE-MRI"]],
  ["liver-iron-concentration", "Concentration hépatique en fer", ["DerivedMeasurement", "Biomarker"], "Estimation quantitative de la charge en fer du foie dérivée d'une méthode IRM calibrée.", "36809220", ["liver iron concentration", "LIC"]],
  ["r2-star-relaxometry", "Relaxométrie R2*", ["MeasurementMethod"], "Méthode d'estimation de la charge en fer fondée sur le taux de relaxation transverse effectif R2*.", "36809220", ["R2* relaxometry"]],
  ["r2-relaxometry", "Relaxométrie R2", ["MeasurementMethod"], "Méthode d'estimation de la charge en fer fondée sur le taux de relaxation transverse R2.", "36809220", ["R2 relaxometry"]],
  ["signal-intensity-ratio-iron", "Méthode du rapport d'intensité de signal", ["MeasurementMethod"], "Méthode d'estimation du fer hépatique fondée sur un rapport d'intensité de signal.", "36809220", ["signal intensity ratio", "SIR"]],
  ["liver-mr-elastography", "Élastographie IRM hépatique", ["MeasurementMethod"], "Méthode d'imagerie mesurant la propagation d'ondes de cisaillement afin d'estimer la rigidité hépatique.", "28530847", ["liver MR elastography", "liver MRE"]],
  ["liver-stiffness", "Rigidité hépatique", ["DerivedMeasurement", "Biomarker"], "Mesure dérivée d'élastographie IRM dans des conditions d'acquisition et d'analyse définies.", "28530847", ["liver stiffness"]],
  ["liver-mre-repeatability", "Répétabilité de l'élastographie IRM hépatique", ["QualityMetric"], "Variabilité des mesures répétées de rigidité hépatique lorsque les conditions spécifiées sont maintenues.", "28530847", ["liver MRE repeatability"]],
];

const createConcept = ([key, preferredLabel, roles, description, pmid, aliases]) => {
  const source = hepaticSourceByPmid[pmid];
  const stableId = `noxia:radiology:scientific-concept:${AUTOMATIC_CAMPAIGN_DOMAIN_ID}:${key}`;
  const revisionId = `${stableId}:revision:1`;
  const material = { key, preferredLabel, roles, description, sourceRevisionId: source.revisionId };
  return Object.freeze({
    stableId,
    revisionId,
    revisionNumber: 1,
    campaignId: AUTOMATIC_CAMPAIGN_ID,
    domainId: AUTOMATIC_CAMPAIGN_DOMAIN_ID,
    key,
    ontologicalClass: roles[0],
    roles: Object.freeze(roles),
    preferredLabel,
    designations: Object.freeze([{ language: "fr", value: preferredLabel, preferred: true }, ...aliases.map((value) => ({ language: "en", value, preferred: false }))]),
    description,
    sourceRefs: Object.freeze([source.revisionId]),
    status: "DOCUMENTED_INTERNAL_CONCEPT",
    completenessProfile: Object.freeze({ identity: true, ontology: true, designation: true, description: true, provenance: true }),
    publicProjection: false,
    digest: sha256Digest(material),
  });
};

export const hepaticImagingConcepts = Object.freeze(conceptRows.map(createConcept).sort((a, b) => a.stableId.localeCompare(b.stableId)));
export const hepaticConceptByKey = Object.freeze(Object.fromEntries(hepaticImagingConcepts.map((concept) => [concept.key, concept])));

const A = (key, subject, predicate, object, statement, pmid, locator, options = {}) => ({
  key,
  subject,
  predicate,
  object,
  statement,
  pmid,
  locator,
  relationType: options.relationType ?? "SUPPORTS",
  assertionType: options.assertionType ?? "EntityObjectAssertion",
  extractionType: options.extractionType ?? "DIRECT_STATEMENT",
  interpretationLevel: options.interpretationLevel ?? "DIRECT_STATEMENT",
  polarity: options.polarity ?? "POSITIVE",
  maturity: options.maturity ?? "ESTABLISHED_DOCUMENTARY_POSITION",
  confidence: options.confidence ?? "HIGH",
  modality: options.modality ?? "MR",
  population: options.population ?? "NOT_APPLICABLE",
  limitations: options.limitations ?? [],
  contextDimensions: options.contextDimensions ?? [],
  derivationSteps: options.derivationSteps ?? [],
});

const assertionDefinitions = [
  A("lirads-standardizes-hcc-imaging", "li-rads", "STANDARDIZES", "hepatocellular-carcinoma", "LI-RADS standardizes terminology, imaging technique, interpretation and reporting for hepatocellular carcinoma imaging in its defined population.", "30251931", "PMC6677371 — Introduction, paragraph 1", { modality: "MR_CT", extractionType: "RECOMMENDATION_TEXT" }),
  A("lirads-high-risk-population", "li-rads", "APPLIES_TO", "hepatocellular-carcinoma", "The CT/MRI LI-RADS diagnostic algorithm is scoped to a defined population at high risk for hepatocellular carcinoma.", "30251931", "PMC6677371 — Imaging Contexts and Population, paragraph 1", { modality: "MR_CT", relationType: "QUALIFIES", assertionType: "ApplicabilityAssertion", population: "HCC_HIGH_RISK_POPULATION", limitations: ["TARGET_POPULATION_REQUIRED"] }),
  A("observation-can-be-pseudolesion", "hepatic-observation", "MAY_REPRESENT", "pseudolesion", "A LI-RADS observation may represent a true lesion or a pseudolesion rather than a histologically confirmed mass.", "30251931", "PMC6677371 — The LI-RADS Observation, paragraph 1", { modality: "MR_CT", relationType: "QUALIFIES", limitations: ["OBSERVATION_NOT_EQUIVALENT_TO_PATHOLOGIC_LESION"] }),
  A("multiphase-needed-for-lirads-features", "multiphase-hepatic-imaging", "ENABLES_CHARACTERIZATION_OF", "hepatic-observation", "Multiphase contrast-enhanced CT or MRI is needed to capture the imaging features used for LI-RADS categorization and treatment-response assessment.", "30251931", "PMC6677371 — CT/MRI Technique, paragraph 1", { modality: "MR_CT", extractionType: "METHOD_DESCRIPTION" }),
  A("lirads-does-not-endorse-single-modality", "li-rads", "DOES_NOT_ENDORSE", "single-modality-or-contrast-agent", "LI-RADS does not endorse one CT or MRI modality or contrast agent for every context; selection depends on patient, institution and regional factors.", "30251931", "PMC6677371 — CT/MRI Technique, paragraph 2", { modality: "MR_CT", relationType: "QUALIFIES", assertionType: "NegativeAssertion", polarity: "QUALIFIED", limitations: ["CONTEXT_DEPENDENT_MODALITY_SELECTION"] }),

  A("pdff-definition", "hepatic-pdff", "IS_DEFINED_AS", "mobile-fat-to-total-mobile-proton-density-ratio", "PDFF is defined as the proportion of mobile triglyceride proton density relative to the combined mobile triglyceride and water proton densities.", "22777847", "PMC4779595 — paragraph 10", { assertionType: "LiteralValueAssertion", extractionType: "METHOD_DESCRIPTION", maturity: "AUTHOR_POSITION" }),
  A("pdff-requires-confounder-correction", "chemical-shift-encoded-mri", "REQUIRES_FOR_ACCURATE_PDFF", "confounder-correction", "Accurate PDFF estimation requires correction or control of documented effects including T1 bias, T2* decay and the spectral complexity of fat.", "22777847", "PMC4779595 — paragraph 9", { relationType: "QUALIFIES", extractionType: "LIMITATION", maturity: "AUTHOR_POSITION", polarity: "QUALIFIED", limitations: ["T1_BIAS", "T2_STAR_DECAY", "FAT_SPECTRAL_COMPLEXITY"] }),
  A("signal-fat-fraction-not-pdff", "signal-fat-fraction", "IS_NOT_EQUIVALENT_TO", "hepatic-pdff", "An uncorrected signal fat fraction is not equivalent to confounder-corrected PDFF and is not a robust interchangeable biomarker.", "22777847", "PMC4779595 — paragraph 13", { assertionType: "NegativeAssertion", maturity: "AUTHOR_POSITION", polarity: "NEGATIVE", limitations: ["UNCONTROLLED_SIGNAL_CONFOUNDERS"] }),

  A("pdff-high-linearity", "hepatic-pdff", "HAS_DOCUMENTED", "high-linearity", "The retained meta-analysis found high linearity of MRI PDFF against reference fat fraction across the included validation studies.", "28892458", "PMC5813433 — Abstract, Results; Assessment of Linearity", { extractionType: "NUMERIC_RESULT", maturity: "META_ANALYTIC_RESULT" }),
  A("pdff-small-bias", "hepatic-pdff", "HAS_DOCUMENTED", "small-bias", "The retained meta-analysis found small aggregate bias for MRI PDFF measurements in the evaluated validation studies.", "28892458", "PMC5813433 — Abstract, Results; Assessment of Bias", { extractionType: "NUMERIC_RESULT", maturity: "META_ANALYTIC_RESULT" }),
  A("pdff-high-precision", "hepatic-pdff", "HAS_DOCUMENTED", "high-precision", "The retained meta-analysis found high precision for repeated MRI PDFF measurements in the included studies.", "28892458", "PMC5813433 — Abstract, Results; Assessment of Precision", { extractionType: "NUMERIC_RESULT", maturity: "META_ANALYTIC_RESULT" }),
  A("pdff-performance-minimal-technical-effects", "hepatic-pdff", "SHOWED_MINIMAL_EFFECT_FROM", "field-strength-manufacturer-reconstruction", "Within the retained meta-analysis, field strength, manufacturer and reconstruction method had minimal observed effects on aggregate linearity, bias and precision.", "28892458", "PMC5813433 — Abstract, Results; subgroup and meta-regression analyses", { extractionType: "NUMERIC_RESULT", maturity: "META_ANALYTIC_RESULT", contextDimensions: [{ dimension: "fieldStrength", operator: "ANY_OF", value: ["1.5 T", "3 T"] }] }),
  A("pdff-intersite-heterogeneity-not-explicit", "hepatic-pdff", "HAS_LIMITATION", "intersite-heterogeneity-not-explicitly-evaluated", "The retained PDFF meta-analysis did not explicitly evaluate heterogeneity attributable to individual sites.", "28892458", "PMC5813433 — Discussion, limitations", { relationType: "QUALIFIES", assertionType: "NegativeAssertion", extractionType: "LIMITATION", maturity: "META_ANALYTIC_LIMITATION", polarity: "QUALIFIED", limitations: ["INTERSITE_HETEROGENEITY_NOT_EXPLICITLY_EVALUATED"] }),

  A("iron-three-method-families", "liver-iron-concentration", "CAN_BE_ESTIMATED_BY", "three-mri-method-families", "The retained ESGAR/SAR document describes signal-intensity-ratio, R2 relaxometry and R2* relaxometry as principal MRI method families for liver iron estimation.", "36809220", "PMC10068892 — Essentials; Overview of MRI Techniques for Iron Quantification", { extractionType: "METHOD_DESCRIPTION", maturity: "GUIDELINE_POSITION" }),
  A("iron-r2star-preferred-first-line", "r2-star-relaxometry", "IS_PREFERRED_FOR", "liver-iron-concentration", "The ESGAR/SAR recommendations prefer confounder-corrected R2*-based liver iron concentration as the first-line MRI method because it has the strongest supporting evidence among the reviewed methods.", "36809220", "PMC10068892 — Summary; Recommendations", { extractionType: "RECOMMENDATION_TEXT", maturity: "CURRENT_CONSENSUS" }),
  A("iron-fat-confounds-uncorrected", "liver-iron-concentration", "IS_CONFOUNDED_BY", "hepatic-fat", "Unaccounted hepatic fat can bias signal-intensity-ratio and R2* estimates used for liver iron quantification.", "36809220", "PMC10068892 — Confounders for Tissue Iron Estimates", { relationType: "QUALIFIES", extractionType: "LIMITATION", maturity: "GUIDELINE_POSITION", polarity: "QUALIFIED", limitations: ["FAT_CONFOUNDING"] }),
  A("iron-both-field-strengths-accepted", "r2-star-relaxometry", "IS_APPLICABLE_AT", "field-strength-1-5-and-3-t", "R2*-based liver iron assessment is described for both 1.5 T and 3 T when method-specific acquisition and calibration requirements are respected.", "36809220", "PMC10068892 — Overview and Recommendations", { maturity: "GUIDELINE_POSITION", contextDimensions: [{ dimension: "fieldStrength", operator: "ANY_OF", value: ["1.5 T", "3 T"] }] }),
  A("iron-severe-overload-prefers-1-5t", "r2-star-relaxometry", "PREFERS_IN_CONTEXT", "field-strength-1-5-t", "For severe iron overload, 1.5 T is preferred over 3 T because 3 T has a reduced measurable dynamic range under rapid signal decay.", "36809220", "PMC10068892 — Overview and Recommendations; R2* Relaxometry", { relationType: "QUALIFIES", assertionType: "ApplicabilityAssertion", maturity: "GUIDELINE_POSITION", polarity: "QUALIFIED", limitations: ["REDUCED_3T_DYNAMIC_RANGE_IN_SEVERE_IRON_OVERLOAD"], contextDimensions: [{ dimension: "diseaseStage", operator: "CONDITION", value: "SEVERE_IRON_OVERLOAD" }, { dimension: "fieldStrength", operator: "EXACT", value: "1.5 T" }] }),

  A("mre-measures-shear-stiffness", "liver-mr-elastography", "MEASURES", "liver-stiffness", "Liver MR elastography estimates tissue stiffness from the propagation of mechanical shear waves.", "28530847", "PMC5621724 — Introduction, paragraph 1", { extractionType: "METHOD_DESCRIPTION" }),
  A("mre-repeatability-22-percent", "liver-mre-repeatability", "HAS_REPEATABILITY_COEFFICIENT", { value: 22, unit: "%" }, "The retained meta-analysis estimated a 22% repeatability coefficient for liver MRE; the interpretation is scoped to repeated measurements at the same site with the same equipment and sequence.", "28530847", "PMC5621724 — Abstract, Results and Conclusion", { assertionType: "QuantitativeAssertion", extractionType: "NUMERIC_RESULT", maturity: "META_ANALYTIC_RESULT", population: "RETAINED_META_ANALYSIS_POPULATIONS", contextDimensions: [{ dimension: "site", operator: "EXACT", value: "SAME_SITE" }, { dimension: "equipment", operator: "EXACT", value: "SAME_EQUIPMENT" }, { dimension: "sequence", operator: "EXACT", value: "SAME_SEQUENCE" }] }),
  A("mre-repeatability-heterogeneity", "liver-mre-repeatability", "IS_INFLUENCED_BY", "study-and-technical-factors", "Operator training, interval between examinations and field strength contributed to heterogeneity in the retained liver MRE repeatability meta-analysis.", "28530847", "PMC5621724 — Abstract, Results; heterogeneity analysis", { relationType: "QUALIFIES", extractionType: "LIMITATION", maturity: "META_ANALYTIC_LIMITATION", polarity: "QUALIFIED", limitations: ["OPERATOR_TRAINING", "INTEREXAM_INTERVAL", "FIELD_STRENGTH_HETEROGENEITY"] }),
  A("mre-cross-platform-reproducibility-open", "liver-mre-repeatability", "DOES_NOT_ESTABLISH", "cross-platform-reproducibility", "The repeatability meta-analysis does not establish cross-system or cross-vendor reproducibility and identifies this as an area requiring further evaluation.", "28530847", "PMC5621724 — Discussion, limitations and future work", { relationType: "QUALIFIES", assertionType: "NegativeAssertion", extractionType: "LIMITATION", maturity: "META_ANALYTIC_LIMITATION", polarity: "QUALIFIED", limitations: ["CROSS_SYSTEM_REPRODUCIBILITY_INSUFFICIENT", "CROSS_VENDOR_REPRODUCIBILITY_INSUFFICIENT"] }),
];

const contextFor = (definition) => Object.freeze({
  contextId: `noxia:radiology:scientific-context:campaign:${AUTOMATIC_CAMPAIGN_DOMAIN_ID}:${definition.key}`,
  dimensions: Object.freeze([
    { dimension: "modality", operator: definition.modality === "MR_CT" ? "ANY_OF" : "EXACT", value: definition.modality === "MR_CT" ? ["MR", "CT"] : definition.modality },
    { dimension: "population", operator: definition.population === "NOT_APPLICABLE" ? "NOT_APPLICABLE" : "EXACT", value: definition.population === "NOT_APPLICABLE" ? null : definition.population },
    { dimension: "manufacturer", operator: "UNKNOWN", value: null },
    { dimension: "software", operator: "UNKNOWN", value: null },
    ...definition.contextDimensions,
  ]),
});

const resolveObject = (value) => typeof value === "string" ? hepaticConceptByKey[value] ?? null : null;

const createAssertion = (definition) => {
  const source = hepaticSourceByPmid[definition.pmid];
  const subject = hepaticConceptByKey[definition.subject];
  const objectConcept = resolveObject(definition.object);
  const stableId = `noxia:radiology:scientific-assertion:campaign:${AUTOMATIC_CAMPAIGN_DOMAIN_ID}:${definition.key}`;
  const revisionId = `${stableId}:revision:1`;
  const context = contextFor(definition);
  const qualified = definition.relationType === "QUALIFIES" || definition.polarity === "QUALIFIED";
  const material = { stableId, subject: subject.stableId, predicate: definition.predicate, object: objectConcept?.stableId ?? definition.object, sourceRevisionId: source.revisionId, context };
  return Object.freeze({
    stableId,
    revisionId,
    revisionNumber: 1,
    campaignId: AUTOMATIC_CAMPAIGN_ID,
    domainId: AUTOMATIC_CAMPAIGN_DOMAIN_ID,
    assertionType: definition.assertionType,
    subjectEntityId: subject.stableId,
    predicate: definition.predicate,
    objectEntityId: objectConcept?.stableId ?? null,
    literalValue: objectConcept ? null : definition.object,
    statement: Object.freeze({ language: "en", text: definition.statement, atomicConclusionCount: 1 }),
    context,
    modality: definition.modality,
    facets: Object.freeze({
      concepts: Object.freeze([definition.subject, ...(objectConcept ? [definition.object] : [])]),
      modalities: Object.freeze(definition.modality === "MR_CT" ? ["MR", "CT"] : [definition.modality]),
      pathologies: Object.freeze(definition.subject === "li-rads" || definition.object === "hepatocellular-carcinoma" ? ["hepatocellular-carcinoma"] : []),
      techniques: Object.freeze([definition.subject, ...(objectConcept ? [definition.object] : [])].filter((key) => ["multiphase-hepatic-imaging", "chemical-shift-encoded-mri", "r2-star-relaxometry", "r2-relaxometry", "signal-intensity-ratio-iron", "liver-mr-elastography"].includes(key))),
      measurements: Object.freeze([definition.subject, ...(objectConcept ? [definition.object] : [])].filter((key) => ["hepatic-pdff", "signal-fat-fraction", "liver-iron-concentration", "liver-stiffness", "liver-mre-repeatability"].includes(key))),
      limitations: Object.freeze(definition.limitations),
      manufacturers: Object.freeze([]),
      software: Object.freeze([]),
    }),
    temporalScope: source.publishedAt,
    polarity: definition.polarity,
    confidence: definition.confidence,
    evidenceQuality: Object.freeze({ relevance: "DIRECTLY_RELEVANT", methodologicalQuality: source.sourceType, fullTextAvailability: source.fullTextAvailability, contextualPrecision: definition.contextDimensions.length ? "SPECIFIED" : "LIMITED" }),
    scientificMaturity: definition.maturity,
    status: "SOURCE_LOCALIZED",
    reviewState: qualified ? "QUALIFIED" : "REVIEWED",
    reviewType: AUTOMATIC_CAMPAIGN_REVIEW_TYPE,
    reviewer: AUTOMATIC_CAMPAIGN_REVIEWER,
    automatedReviewDecision: qualified ? "AUTOMATED_REVIEW_QUALIFIED" : "AUTOMATED_REVIEW_PASSED",
    humanReviewed: false,
    scientificHumanReview: null,
    sourceRefs: Object.freeze([source.revisionId]),
    limitations: Object.freeze(definition.limitations),
    digest: sha256Digest(material),
  });
};

export const hepaticImagingAssertionRevisions = Object.freeze(assertionDefinitions.map(createAssertion).sort((a, b) => a.revisionId.localeCompare(b.revisionId)));
export const hepaticImagingAssertionIdentities = Object.freeze(hepaticImagingAssertionRevisions.map(({ stableId, domainId }) => Object.freeze({ stableId, domainId })));
export const hepaticImagingApplicabilityContexts = Object.freeze(hepaticImagingAssertionRevisions.map((assertion) => assertion.context).sort((a, b) => a.contextId.localeCompare(b.contextId)));
const hepaticAssertionByKey = Object.freeze(Object.fromEntries(hepaticImagingAssertionRevisions.map((assertion) => [assertion.stableId.split(":").at(-1), assertion])));

const createEvidenceLink = (definition) => {
  const assertion = hepaticAssertionByKey[definition.key];
  const source = hepaticSourceByPmid[definition.pmid];
  const evidenceLinkId = `noxia:radiology:evidence-link:campaign:${AUTOMATIC_CAMPAIGN_DOMAIN_ID}:${definition.key}`;
  const material = { evidenceLinkId, sourceRevisionId: source.revisionId, assertionRevisionId: assertion.revisionId, relationType: definition.relationType, locator: definition.locator };
  return Object.freeze({
    evidenceLinkId,
    campaignId: AUTOMATIC_CAMPAIGN_ID,
    domainId: AUTOMATIC_CAMPAIGN_DOMAIN_ID,
    sourceRevisionId: source.revisionId,
    assertionRevisionId: assertion.revisionId,
    relationType: definition.relationType,
    locator: definition.locator,
    extraction: Object.freeze({
      extractionId: `noxia:radiology:extraction:campaign:${AUTOMATIC_CAMPAIGN_DOMAIN_ID}:${definition.key}`,
      sourceRevisionId: source.revisionId,
      assertionDerived: assertion.revisionId,
      section: definition.locator.split(" — ")[1],
      page: null,
      paragraph: "LOCATOR_NARRATIVE_TARGET",
      tableOrFigure: null,
      passage: definition.statement,
      passageKind: "ANALYTICAL_SUMMARY_NOT_VERBATIM_SOURCE_TEXT",
      consultedAt: AUTOMATIC_CAMPAIGN_EXECUTED_AT,
      analyticalSummary: definition.statement,
      extractionType: definition.extractionType,
      interpretationLevel: definition.interpretationLevel,
      directAuthorStatement: definition.interpretationLevel !== "DERIVED_INTERPRETATION",
      derivationSteps: Object.freeze(definition.derivationSteps),
    }),
    applicability: assertion.context,
    evidenceQuality: assertion.evidenceQuality,
    confidence: definition.confidence,
    reviewerStatus: assertion.automatedReviewDecision,
    reviewType: AUTOMATIC_CAMPAIGN_REVIEW_TYPE,
    reviewer: AUTOMATIC_CAMPAIGN_REVIEWER,
    scientificHumanReview: null,
    limitations: Object.freeze(definition.limitations),
    date: AUTOMATIC_CAMPAIGN_EXECUTED_AT,
    digest: sha256Digest(material),
  });
};

export const hepaticImagingEvidenceLinks = Object.freeze(assertionDefinitions.map(createEvidenceLink).sort((a, b) => a.evidenceLinkId.localeCompare(b.evidenceLinkId)));

export const hepaticImagingReviewDecisions = Object.freeze(hepaticImagingAssertionRevisions.map((assertion) => {
  const links = hepaticImagingEvidenceLinks.filter((link) => link.assertionRevisionId === assertion.revisionId);
  return Object.freeze({
    decisionId: `noxia:radiology:assertion-review:campaign:${AUTOMATIC_CAMPAIGN_DOMAIN_ID}:${assertion.stableId.split(":").at(-1)}`,
    assertionRevisionId: assertion.revisionId,
    reviewer: AUTOMATIC_CAMPAIGN_REVIEWER,
    date: AUTOMATIC_CAMPAIGN_EXECUTED_AT,
    decision: assertion.automatedReviewDecision,
    justification: assertion.reviewState === "QUALIFIED" ? "The localized source supports a context-limited or limiting statement; the qualification remains explicit." : "Atomicity, official source identity, full-text locator, applicability and EvidenceLink passed deterministic automated review.",
    sourceRevisionIds: Object.freeze(links.map((link) => link.sourceRevisionId).sort()),
    evidenceLinkIds: Object.freeze(links.map((link) => link.evidenceLinkId).sort()),
    scope: "DOCUMENTARY_SCIENTIFIC_CORPUS_INTERNAL_ONLY",
    reservations: Object.freeze([...new Set(links.flatMap((link) => link.limitations))].sort()),
    reviewType: AUTOMATIC_CAMPAIGN_REVIEW_TYPE,
    automatedStructuralReview: true,
    automatedScientificReview: true,
    scientificHumanReview: null,
    previousStatus: "EXTRACTED",
    newStatus: assertion.status,
  });
}));

export const hepaticImagingContextDifferences = Object.freeze([
  Object.freeze({
    contradictionId: "noxia:radiology:context-difference:campaign:hepatic-imaging:iron-field-strength",
    campaignId: AUTOMATIC_CAMPAIGN_ID,
    domainId: AUTOMATIC_CAMPAIGN_DOMAIN_ID,
    assertionRevisionIds: Object.freeze([hepaticAssertionByKey["iron-both-field-strengths-accepted"].revisionId, hepaticAssertionByKey["iron-severe-overload-prefers-1-5t"].revisionId].sort()),
    classification: "CONTEXT_DIFFERENCE",
    rationale: "General applicability at 1.5 T and 3 T is compatible with a conditional preference for 1.5 T in severe overload.",
    resolutionApplied: false,
    contextsPreserved: Object.freeze(["GENERAL_LIVER_IRON_MEASUREMENT", "SEVERE_IRON_OVERLOAD"]),
  }),
  Object.freeze({
    contradictionId: "noxia:radiology:context-difference:campaign:hepatic-imaging:pdff-signal-fraction",
    campaignId: AUTOMATIC_CAMPAIGN_ID,
    domainId: AUTOMATIC_CAMPAIGN_DOMAIN_ID,
    assertionRevisionIds: Object.freeze([hepaticAssertionByKey["pdff-definition"].revisionId, hepaticAssertionByKey["signal-fat-fraction-not-pdff"].revisionId].sort()),
    classification: "DEFINITION_DIFFERENCE",
    rationale: "Confounder-corrected PDFF and an uncorrected signal fat fraction are distinct measurement definitions, not contradictory estimates.",
    resolutionApplied: false,
    contextsPreserved: Object.freeze(["CONFOUNDER_CORRECTED_PDFF", "UNCONTROLLED_SIGNAL_FAT_FRACTION"]),
  }),
]);

const synthesisDefinitions = Object.freeze([
  { key: "hepatic-imaging-overview", label: "Imagerie hépatique — corpus scientifique interne", subjectKeys: hepaticImagingConcepts.map((concept) => concept.key), gaps: ["NO_PUBLIC_EDITORIAL_REVIEW", "HUMAN_SCIENTIFIC_REVIEW_NOT_PERFORMED"] },
  { key: "lirads-lesion-characterization", label: "LI-RADS — population, technique et observation", subjectKeys: ["li-rads", "hepatic-observation", "multiphase-hepatic-imaging"], gaps: ["EVIDENCE_GAPS_REMAIN_FOR_SOME_LI_RADS_COMPONENTS"] },
  { key: "hepatic-pdff-methods-metrology", label: "PDFF hépatique — définition et métrologie", subjectKeys: ["hepatic-pdff", "signal-fat-fraction", "chemical-shift-encoded-mri"], gaps: ["INTERSITE_HETEROGENEITY_NOT_EXPLICITLY_EVALUATED"] },
  { key: "liver-iron-methods", label: "Fer hépatique — méthodes et contexte de champ", subjectKeys: ["liver-iron-concentration", "r2-star-relaxometry"], gaps: ["CALIBRATION_REMAINS_METHOD_SPECIFIC", "SEVERE_OVERLOAD_REDUCES_3T_DYNAMIC_RANGE"] },
  { key: "liver-mre-repeatability", label: "Élastographie IRM hépatique — répétabilité", subjectKeys: ["liver-mr-elastography", "liver-mre-repeatability"], gaps: ["CROSS_SYSTEM_REPRODUCIBILITY_INSUFFICIENT", "CROSS_VENDOR_REPRODUCIBILITY_INSUFFICIENT"] },
]);

const createCampaignSynthesis = (definition) => {
  const subjectEntityIds = definition.subjectKeys.map((key) => hepaticConceptByKey[key].stableId);
  const base = createStructuredLiteratureSynthesis({
    query: { domainId: AUTOMATIC_CAMPAIGN_DOMAIN_ID, subjectEntityIds },
    assertionRevisions: hepaticImagingAssertionRevisions,
    evidenceLinks: hepaticImagingEvidenceLinks,
    sourceRevisions: hepaticImagingSourceRevisions,
  });
  const missingData = [...new Set([...base.missingData, ...definition.gaps])].sort();
  const material = { key: definition.key, baseDigest: sha256Digest(base), missingData, contextDifferences: hepaticImagingContextDifferences.map((item) => item.contradictionId) };
  return Object.freeze({
    ...base,
    synthesisId: `noxia:radiology:scientific-synthesis:campaign:${AUTOMATIC_CAMPAIGN_DOMAIN_ID}:${definition.key}`,
    key: definition.key,
    domainId: AUTOMATIC_CAMPAIGN_DOMAIN_ID,
    label: definition.label,
    concepts: Object.freeze(definition.subjectKeys),
    contradictions: hepaticImagingContextDifferences,
    convergence: Object.freeze({ state: "CONTEXT_DEPENDENT_CONVERGENCE", rule: "Only assertions with compatible measurement definitions and applicability contexts are grouped; source count alone is never consensus.", publicationMajorityUsed: false }),
    openQuestions: Object.freeze(missingData),
    missingData: Object.freeze(missingData),
    excludedSources: Object.freeze(rejectedHepaticImagingSources),
    prose: null,
    generatedEditorialText: false,
    statisticalMetaAnalysisPerformed: false,
    deterministicDigest: sha256Digest(material),
  });
};

export const hepaticImagingScientificSyntheses = Object.freeze(synthesisDefinitions.map(createCampaignSynthesis).sort((a, b) => a.key.localeCompare(b.key)));
const hepaticSynthesisByKey = Object.freeze(Object.fromEntries(hepaticImagingScientificSyntheses.map((synthesis) => [synthesis.key, synthesis])));

const projectionDefinitions = [
  ["lirads-internal-scientific-sheet", "LI-RADS — fiche scientifique interne", "lirads-lesion-characterization"],
  ["hepatic-pdff-state-of-knowledge", "PDFF hépatique — état interne des connaissances", "hepatic-pdff-methods-metrology"],
  ["liver-iron-method-comparison", "Fer hépatique — comparaison documentaire interne", "liver-iron-methods"],
  ["liver-mre-repeatability-state", "Élastographie hépatique — synthèse interne de répétabilité", "liver-mre-repeatability"],
];

export const hepaticImagingInternalProjections = Object.freeze(projectionDefinitions.map(([key, label, synthesisKey]) => {
  const synthesis = hepaticSynthesisByKey[synthesisKey];
  const material = { key, synthesisDigest: synthesis.deterministicDigest, guards: CAMPAIGN_PUBLICATION_GUARDS };
  return Object.freeze({
    projectionId: `noxia:radiology:scientific-projection:campaign:${AUTOMATIC_CAMPAIGN_DOMAIN_ID}:${key}`,
    key,
    domainId: AUTOMATIC_CAMPAIGN_DOMAIN_ID,
    label,
    fixtureType: "INTERNAL_SCIENTIFIC_PROJECTION",
    concepts: synthesis.concepts,
    definitions: Object.freeze(synthesis.applicableAssertions.filter((assertion) => /IS_DEFINED_AS|STANDARDIZES|MEASURES|CAN_BE_ESTIMATED_BY/.test(assertion.predicate))),
    assertions: synthesis.applicableAssertions,
    evidenceLinks: synthesis.evidence,
    sources: synthesis.sources,
    contexts: synthesis.contexts,
    limitations: synthesis.limitations,
    contradictions: synthesis.contradictions,
    convergence: synthesis.convergence,
    questionsOpen: synthesis.openQuestions,
    history: synthesis.history,
    confidence: synthesis.overallConfidence,
    gaps: synthesis.missingData,
    prose: null,
    ...CAMPAIGN_PUBLICATION_GUARDS,
    deterministicDigest: sha256Digest(material),
  });
}).sort((a, b) => a.key.localeCompare(b.key)));

export const hepaticImagingCampaignGaps = Object.freeze([
  "HUMAN_SCIENTIFIC_REVIEW_NOT_PERFORMED",
  "INTERSITE_PDFF_HETEROGENEITY_NOT_EXPLICITLY_EVALUATED",
  "CROSS_SYSTEM_LIVER_MRE_REPRODUCIBILITY_INSUFFICIENT",
  "CROSS_VENDOR_LIVER_MRE_REPRODUCIBILITY_INSUFFICIENT",
  "LI_RADS_COMPONENT_LEVEL_EVIDENCE_REMAINS_INCOMPLETE",
]);

const campaignResultMaterial = {
  campaignId: AUTOMATIC_CAMPAIGN_ID,
  nodeIds: [AUTOMATIC_CAMPAIGN_NODE_ID],
  sourceRevisionIds: hepaticImagingSourceRevisions.map((item) => item.revisionId),
  conceptRevisionIds: hepaticImagingConcepts.map((item) => item.revisionId),
  assertionRevisionIds: hepaticImagingAssertionRevisions.map((item) => item.revisionId),
  contextIds: hepaticImagingApplicabilityContexts.map((item) => item.contextId),
  evidenceLinkIds: hepaticImagingEvidenceLinks.map((item) => item.evidenceLinkId),
  synthesisIds: hepaticImagingScientificSyntheses.map((item) => item.synthesisId),
  projectionIds: hepaticImagingInternalProjections.map((item) => item.projectionId),
  gaps: hepaticImagingCampaignGaps,
};

export const hepaticImagingCampaignExecution = Object.freeze({
  executionId: "noxia:scientific-campaign-execution:hepatic-imaging:01",
  campaignId: AUTOMATIC_CAMPAIGN_ID,
  nodeIds: Object.freeze([AUTOMATIC_CAMPAIGN_NODE_ID]),
  status: "COMPLETED_WITH_EXPLICIT_GAPS",
  selectedAutomatically: true,
  manualDomainSelection: false,
  completedAt: AUTOMATIC_CAMPAIGN_EXECUTED_AT,
  additions: Object.freeze({
    sources: hepaticImagingSourceRevisions.length,
    concepts: hepaticImagingConcepts.length,
    assertions: hepaticImagingAssertionRevisions.length,
    contexts: hepaticImagingApplicabilityContexts.length,
    evidenceLinks: hepaticImagingEvidenceLinks.length,
    syntheses: hepaticImagingScientificSyntheses.length,
    internalProjections: hepaticImagingInternalProjections.length,
  }),
  gaps: hepaticImagingCampaignGaps,
  publicationAuthorized: false,
  nextCampaignStarted: false,
  resultDigest: sha256Digest(campaignResultMaterial),
});
