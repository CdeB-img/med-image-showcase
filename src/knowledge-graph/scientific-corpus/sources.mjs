import { createSourceIdentity, createSourceRevision } from "../scientific-model-factories.mjs";
import { sha256Digest } from "../migration/stable-json.mjs";
import { SCIENTIFIC_CORPUS_RETRIEVED_AT } from "./constants.mjs";

const source = ({
  key,
  pmid,
  pmcid = null,
  doi,
  title,
  authors,
  journal,
  publicationDate,
  sourceType = "SCIENTIFIC_PUBLICATION",
  evidenceSourceType,
  documentStatus = "CURRENT",
  status = documentStatus === "SUPERSEDED" ? "SUPERSEDED" : documentStatus === "CORRECTED" ? "CORRECTED" : "ACTIVE",
  url = pmcid ? `https://pmc.ncbi.nlm.nih.gov/articles/${pmcid}/` : `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
  fullTextAvailability = pmcid ? "PMC_FULL_TEXT" : "ABSTRACT_ONLY",
  studyDesign,
  populationSize = null,
  multicenter = "UNKNOWN",
  prospective = "UNKNOWN",
  methodStandardization = "UNKNOWN",
  hardwareContextPrecision = "PARTIAL",
  methodologicalQuality,
  assertionUtility,
  limitations = [],
  correctedBy = null,
  supersedes = null,
}) => {
  const stableId = `noxia:radiology:source:pubmed:${pmid}`;
  const revisionId = `${stableId}:revision:1`;
  const bibliographicMaterial = { pmid, pmcid, doi, title, authors, journal, publicationDate, url, documentStatus };
  return Object.freeze({
    key,
    identity: createSourceIdentity({ stableId, sourceType, canonicalUri: url }),
    revision: createSourceRevision({
      stableId,
      revisionId,
      sourceType,
      title,
      authority: journal,
      authors,
      publicationDate,
      version: "version-of-record",
      doi,
      pmid,
      url,
      locator: pmcid ? "PMC full text" : "PubMed record and structured abstract",
      digest: sha256Digest(bibliographicMaterial),
      language: "en",
      status,
      retrievedAt: SCIENTIFIC_CORPUS_RETRIEVED_AT,
      correctedByRevisionId: correctedBy ? `noxia:radiology:source:pubmed:${correctedBy}:revision:1` : null,
      supersedesRevisionId: supersedes ? `noxia:radiology:source:pubmed:${supersedes}:revision:1` : null,
      sourceRefs: [url],
      metadata: {
        journal,
        pmcid,
        documentStatus,
        evidenceSourceType,
        fullTextAvailability,
        authorsCompleteness: "CITATION_ABBREVIATED",
        digestScope: "BIBLIOGRAPHIC_METADATA",
        sourceQuality: {
          relevanceForPilot: "HIGH",
          methodologicalQuality,
          studyDesign,
          populationSize,
          multicenter,
          prospective,
          methodStandardization,
          hardwareContextPrecision,
          fullTextAvailability,
          resultsAvailability: "AVAILABLE",
          documentaryStatus: documentStatus,
          assertionUtility,
          limitations,
        },
      },
    }),
  });
};

const selected = [
  source({ key: "moon-2013-consensus", pmid: "24124732", pmcid: "PMC3854458", doi: "10.1186/1532-429X-15-92", title: "Myocardial T1 mapping and extracellular volume quantification: a Society for Cardiovascular Magnetic Resonance (SCMR) and CMR Working Group of the European Society of Cardiology consensus statement", authors: "Moon JC et al.", journal: "Journal of Cardiovascular Magnetic Resonance", publicationDate: "2013-10-14", sourceType: "CONSENSUS", evidenceSourceType: "CONSENSUS", documentStatus: "SUPERSEDED", studyDesign: "CONSENSUS_STATEMENT", multicenter: "NOT_APPLICABLE", prospective: "NOT_APPLICABLE", methodStandardization: "HIGH", methodologicalQuality: "HIGH", assertionUtility: ["TERMINOLOGY", "ECV_FORMULA", "HISTORICAL_CONSENSUS"], limitations: ["Superseded as current guidance by the 2017 SCMR/EACVI position paper."] }),
  source({ key: "messroghli-2017-consensus", pmid: "28992817", pmcid: "PMC5633041", doi: "10.1186/s12968-017-0389-8", title: "Clinical recommendations for cardiovascular magnetic resonance mapping of T1, T2, T2* and extracellular volume: A consensus statement by the SCMR endorsed by the EACVI", authors: "Messroghli DR et al.", journal: "Journal of Cardiovascular Magnetic Resonance", publicationDate: "2017-10-09", sourceType: "CONSENSUS", evidenceSourceType: "CONSENSUS", documentStatus: "CORRECTED", correctedBy: "29415744", studyDesign: "POSITION_PAPER_CONSENSUS", multicenter: "NOT_APPLICABLE", prospective: "NOT_APPLICABLE", methodStandardization: "HIGH", methodologicalQuality: "HIGH", assertionUtility: ["CURRENT_CONSENSUS", "IMPLEMENTATION", "LIMITATIONS", "REFERENCE_RANGES"], limitations: ["Evidence and recommendations reflect the literature assessed up to mid-2017."] }),
  source({ key: "messroghli-2018-correction", pmid: "29415744", pmcid: "PMC5804075", doi: "10.1186/s12968-017-0408-9", title: "Correction to: Clinical recommendations for cardiovascular magnetic resonance mapping of T1, T2, T2* and extracellular volume", authors: "Messroghli DR et al.", journal: "Journal of Cardiovascular Magnetic Resonance", publicationDate: "2018-02-07", evidenceSourceType: "CONSENSUS", documentStatus: "CURRENT", studyDesign: "PUBLISHED_CORRECTION", multicenter: "NOT_APPLICABLE", prospective: "NOT_APPLICABLE", methodStandardization: "NOT_APPLICABLE", methodologicalQuality: "HIGH", assertionUtility: ["DOCUMENT_LIFECYCLE"], limitations: [] }),
  source({ key: "ferreira-2018-myocarditis", pmid: "30545455", doi: "10.1016/j.jacc.2018.09.072", title: "Cardiovascular Magnetic Resonance in Nonischemic Myocardial Inflammation: Expert Recommendations", authors: "Ferreira VM et al.", journal: "Journal of the American College of Cardiology", publicationDate: "2018-12-18", sourceType: "RECOMMENDATION", evidenceSourceType: "GUIDELINE", studyDesign: "SCIENTIFIC_EXPERT_PANEL", multicenter: "NOT_APPLICABLE", prospective: "NOT_APPLICABLE", methodStandardization: "HIGH", methodologicalQuality: "HIGH", assertionUtility: ["MYOCARDITIS", "RECOMMENDATION_TEXT"], limitations: ["Only the PubMed structured abstract was used for extraction in this pass."] }),
  source({ key: "messroghli-2004-molli", pmid: "15236377", doi: "10.1002/mrm.20110", title: "Modified Look-Locker inversion recovery (MOLLI) for high-resolution T1 mapping of the heart", authors: "Messroghli DR et al.", journal: "Magnetic Resonance in Medicine", publicationDate: "2004-07-01", evidenceSourceType: "PROSPECTIVE_STUDY", studyDesign: "TECHNICAL_VALIDATION", populationSize: null, multicenter: false, prospective: true, methodStandardization: "METHOD_DEFINITION", methodologicalQuality: "MODERATE", assertionUtility: ["MOLLI", "METHOD_DESCRIPTION"], limitations: ["Only the PubMed record and abstract were used; sample details not asserted when unavailable."] }),
  source({ key: "piechnik-2010-shmolli", pmid: "21092095", pmcid: "PMC3001433", doi: "10.1186/1532-429X-12-69", title: "Shortened Modified Look-Locker Inversion recovery (ShMOLLI) for clinical myocardial T1-mapping at 1.5 and 3 T within a 9 heartbeat breathhold", authors: "Piechnik SK et al.", journal: "Journal of Cardiovascular Magnetic Resonance", publicationDate: "2010-11-19", evidenceSourceType: "PROSPECTIVE_STUDY", studyDesign: "TECHNICAL_VALIDATION", multicenter: false, prospective: true, methodStandardization: "METHOD_DEFINITION", methodologicalQuality: "MODERATE", assertionUtility: ["SHMOLLI", "FIELD_STRENGTH", "METHOD_DESCRIPTION"], limitations: ["Technical validation does not by itself establish clinical diagnostic value."] }),
  source({ key: "chow-2014-sasha", pmid: "23881866", doi: "10.1002/mrm.24878", title: "Saturation recovery single-shot acquisition (SASHA) for myocardial T1 mapping", authors: "Chow K et al.", journal: "Magnetic Resonance in Medicine", publicationDate: "2014-06-01", evidenceSourceType: "PROSPECTIVE_STUDY", studyDesign: "TECHNICAL_VALIDATION", populationSize: 36, multicenter: false, prospective: true, methodStandardization: "METHOD_DEFINITION", methodologicalQuality: "MODERATE", assertionUtility: ["SASHA", "ACCURACY", "HEART_RATE"], limitations: ["In-vivo cohort included 29 healthy volunteers and 7 heart-failure patients."] }),
  source({ key: "roujol-2014-comparison", pmid: "24702727", pmcid: "PMC4263641", doi: "10.1148/radiol.14140296", title: "Accuracy, precision, and reproducibility of four T1 mapping sequences: a head-to-head comparison of MOLLI, ShMOLLI, SASHA, and SAPPHIRE", authors: "Roujol S et al.", journal: "Radiology", publicationDate: "2014-09-01", evidenceSourceType: "PROSPECTIVE_STUDY", studyDesign: "PHANTOM_AND_HEALTHY_VOLUNTEER_COMPARISON", populationSize: 7, multicenter: false, prospective: true, methodStandardization: "HIGH", methodologicalQuality: "MODERATE", assertionUtility: ["MOLLI_SASHA_COMPARISON", "REPRODUCIBILITY", "ECV_METHOD_DIFFERENCE"], limitations: ["The in-vivo reproducibility comparison included seven healthy participants."] }),
  source({ key: "kellman-2014-accuracy", pmid: "24387626", pmcid: "PMC3927683", doi: "10.1186/1532-429X-16-2", title: "T1-mapping in the heart: accuracy and precision", authors: "Kellman P; Hansen MS", journal: "Journal of Cardiovascular Magnetic Resonance", publicationDate: "2014-01-04", evidenceSourceType: "SYSTEMATIC_REVIEW", studyDesign: "TECHNICAL_REVIEW_AND_SIMULATION", multicenter: "NOT_APPLICABLE", prospective: "NOT_APPLICABLE", methodStandardization: "HIGH", methodologicalQuality: "HIGH", assertionUtility: ["ACCURACY", "PRECISION", "CONFOUNDERS"], limitations: ["Several comparisons are simulation-based and should not be generalized directly to clinical outcomes."] }),
  source({ key: "dabir-2014-multicenter", pmid: "25384607", pmcid: "PMC4203908", doi: "10.1186/s12968-014-0069-x", title: "Reference values for healthy human myocardium using a T1 mapping methodology: results from the International T1 Multicenter cardiovascular magnetic resonance study", authors: "Dabir D et al.", journal: "Journal of Cardiovascular Magnetic Resonance", publicationDate: "2014-10-21", evidenceSourceType: "MULTICENTER_STUDY", studyDesign: "MULTICENTER_REFERENCE_COHORT", populationSize: 215, multicenter: true, prospective: true, methodStandardization: "UNIFORM_MOLLI_AND_CORE_LAB", methodologicalQuality: "MODERATE", assertionUtility: ["MULTICENTER", "FIELD_STRENGTH", "REPRODUCIBILITY"], limitations: ["Transferability was evaluated under a uniform Philips MOLLI setup and does not establish universal reference ranges."] }),
  source({ key: "captur-2020-t1mes", pmid: "32375896", pmcid: "PMC7204222", doi: "10.1186/s12968-020-00613-3", title: "T1 mapping performance and measurement repeatability: results from the multi-national T1 mapping standardization phantom program (T1MES)", authors: "Captur G et al.", journal: "Journal of Cardiovascular Magnetic Resonance", publicationDate: "2020-05-07", evidenceSourceType: "MULTICENTER_STUDY", studyDesign: "MULTICENTER_LONGITUDINAL_PHANTOM_STUDY", populationSize: null, multicenter: true, prospective: true, methodStandardization: "PHANTOM_QA", methodologicalQuality: "HIGH", assertionUtility: ["INTERSITE_REPEATABILITY", "FIELD_STRENGTH", "SOFTWARE", "MANUFACTURER"], limitations: ["Phantom repeatability is not direct evidence of in-vivo clinical reproducibility.", "GE systems were under-represented."] }),
  source({ key: "kellman-2012-ecv", pmid: "22963517", pmcid: "PMC3441905", doi: "10.1186/1532-429X-14-63", title: "Extracellular volume fraction mapping in the myocardium, part 1: evaluation of an automated method", authors: "Kellman P et al.", journal: "Journal of Cardiovascular Magnetic Resonance", publicationDate: "2012-09-10", evidenceSourceType: "PROSPECTIVE_STUDY", studyDesign: "TECHNICAL_METHOD_EVALUATION", populationSize: 338, multicenter: false, prospective: "UNKNOWN", methodStandardization: "FORMULA_AND_AUTOMATED_MAPPING", methodologicalQuality: "MODERATE", assertionUtility: ["ECV_FORMULA", "MOTION", "TIMING", "HEMATOCRIT"], limitations: ["The bolus equilibrium assumption may not hold in recently infarcted myocardium."] }),
  source({ key: "nadjiri-2017-myocarditis", pmid: "27878700", doi: "10.1007/s10554-016-1029-3", title: "Performance of native and contrast-enhanced T1 mapping to detect myocardial damage in patients with suspected myocarditis: a head-to-head comparison of different cardiovascular magnetic resonance techniques", authors: "Nadjiri J et al.", journal: "International Journal of Cardiovascular Imaging", publicationDate: "2017-04-01", evidenceSourceType: "OBSERVATIONAL_STUDY", studyDesign: "RETROSPECTIVE_CLINICAL_COMPARISON", populationSize: 171, multicenter: false, prospective: false, methodStandardization: "PARTIAL", methodologicalQuality: "MODERATE", assertionUtility: ["MYOCARDITIS", "DIAGNOSTIC_ASSOCIATION"], limitations: ["A ten-fold troponin elevation was used as the reference for myocardial damage; results are not a standalone recommendation.", "Only the PubMed structured abstract was used for extraction in this pass."] }),
  source({ key: "lundin-2019-timing", pmid: "31132211", doi: "10.1111/cpf.12588", title: "Detection of myocarditis using T1 and ECV mapping is not improved by early compared to late post-contrast imaging", authors: "Lundin M et al.", journal: "Clinical Physiology and Functional Imaging", publicationDate: "2019-11-01", evidenceSourceType: "OBSERVATIONAL_STUDY", studyDesign: "SINGLE_CENTER_TIMING_COMPARISON", populationSize: null, multicenter: false, prospective: "UNKNOWN", methodStandardization: "EXPLICIT_3_AND_21_MINUTE_COMPARISON", methodologicalQuality: "MODERATE", assertionUtility: ["MYOCARDITIS", "POST_CONTRAST_TIMING", "NEGATIVE_RESULT"], limitations: ["Only the PubMed structured abstract was used for extraction in this pass."] }),
  source({ key: "kidambi-2017-mi", pmid: "27771398", pmcid: "PMC5593809", doi: "10.1016/j.jcmg.2016.06.015", title: "Myocardial Extracellular Volume Estimation by CMR Predicts Functional Recovery Following Acute MI", authors: "Kidambi A et al.", journal: "JACC: Cardiovascular Imaging", publicationDate: "2017-09-01", evidenceSourceType: "PROSPECTIVE_STUDY", studyDesign: "PROSPECTIVE_LONGITUDINAL_ACUTE_MI", populationSize: 39, multicenter: false, prospective: true, methodStandardization: "MOLLI_AT_15_MINUTES", methodologicalQuality: "MODERATE", assertionUtility: ["MYOCARDIAL_INFARCTION", "FUNCTIONAL_RECOVERY"], limitations: ["Single-center cohort of 39 patients; association does not establish a clinical decision rule."] }),
  source({ key: "banypersad-2015-amyloid", pmid: "25411195", pmcid: "PMC4301598", doi: "10.1093/eurheartj/ehu444", title: "T1 mapping and survival in systemic light-chain amyloidosis", authors: "Banypersad SM et al.", journal: "European Heart Journal", publicationDate: "2015-01-21", evidenceSourceType: "PROSPECTIVE_STUDY", studyDesign: "PROSPECTIVE_PROGNOSTIC_COHORT", populationSize: 154, multicenter: false, prospective: true, methodStandardization: "BOLUS_AND_EQUILIBRIUM_ECV", methodologicalQuality: "MODERATE", assertionUtility: ["AMYLOIDOSIS", "PROGNOSIS"], limitations: ["Findings concern systemic AL amyloidosis and should not be generalized to every amyloid subtype."] }),
  source({ key: "nacif-2012-ct", pmid: "22771879", pmcid: "PMC3426854", doi: "10.1148/radiol.12112458", title: "Interstitial myocardial fibrosis assessed as extracellular volume fraction with low-radiation-dose cardiac CT", authors: "Nacif MS et al.", journal: "Radiology", publicationDate: "2012-09-01", evidenceSourceType: "PROSPECTIVE_STUDY", studyDesign: "CT_MR_COMPARATIVE_FEASIBILITY", populationSize: 24, multicenter: false, prospective: true, methodStandardization: "PRE_AND_DELAYED_CT", methodologicalQuality: "LOW", assertionUtility: ["CT_ECV", "CT_MR_COMPARISON"], limitations: ["Small sample.", "MR rather than histology was the reference.", "Only anterior and anterolateral segments were analyzed.", "Additional radiation was required."] }),
  source({ key: "bandula-2013-ct", pmid: "23878282", doi: "10.1148/radiology.13130130", title: "Measurement of myocardial extracellular volume fraction by using equilibrium contrast-enhanced CT: validation against histologic findings", authors: "Bandula S et al.", journal: "Radiology", publicationDate: "2013-11-01", evidenceSourceType: "PROSPECTIVE_STUDY", studyDesign: "CT_MR_HISTOLOGY_VALIDATION", populationSize: 23, multicenter: false, prospective: true, methodStandardization: "EQUILIBRIUM_IODINE_INFUSION", methodologicalQuality: "MODERATE", assertionUtility: ["CT_ECV", "HISTOLOGY", "IODINATED_CONTRAST"], limitations: ["Small cohort restricted to severe aortic stenosis.", "Equilibrium infusion protocol is not interchangeable with routine bolus protocols."] }),
  source({ key: "han-2023-ct-meta", pmid: "37269267", doi: "10.1016/j.jcmg.2023.03.021", title: "Cardiac Computed Tomography for Quantification of Myocardial Extracellular Volume Fraction: A Systematic Review and Meta-Analysis", authors: "Han D et al.", journal: "JACC: Cardiovascular Imaging", publicationDate: "2023-10-01", evidenceSourceType: "META_ANALYSIS", studyDesign: "SYSTEMATIC_REVIEW_AND_META_ANALYSIS", populationSize: 383, multicenter: "MULTIPLE_INCLUDED_STUDIES", prospective: "MIXED", methodStandardization: "HETEROGENEOUS", methodologicalQuality: "MODERATE", assertionUtility: ["CT_ECV", "CT_MR_COMPARISON", "EVIDENCE_LIMITATIONS"], limitations: ["Overall quality of the 13 included studies was rated low by the authors.", "Heterogeneous single- and dual-energy methods were pooled."] }),
  source({ key: "cundari-2023-ct-method", pmid: "37749293", pmcid: "PMC10519917", doi: "10.1186/s13244-023-01506-6", title: "Myocardial extracellular volume quantification with computed tomography—current status and future outlook", authors: "Cundari G et al.", journal: "Insights into Imaging", publicationDate: "2023-09-25", evidenceSourceType: "SYSTEMATIC_REVIEW", studyDesign: "EDUCATIONAL_TECHNICAL_REVIEW", multicenter: "NOT_APPLICABLE", prospective: "NOT_APPLICABLE", methodStandardization: "METHOD_SYNTHESIS", methodologicalQuality: "MODERATE", assertionUtility: ["CT_ECV_FORMULA", "CT_ACQUISITION", "CT_LIMITATIONS"], limitations: ["Secondary technical review; primary studies remain the evidence for validation claims."] }),
  source({ key: "kammerlander-2018-synthetic-hct", pmid: "28980127", pmcid: "PMC5978936", doi: "10.1007/s00508-017-1267-y", title: "Extracellular volume quantification by cardiac magnetic resonance imaging without hematocrit sampling: Ready for prime time?", authors: "Kammerlander AA et al.", journal: "Wiener klinische Wochenschrift", publicationDate: "2018-03-01", evidenceSourceType: "OBSERVATIONAL_STUDY", studyDesign: "DERIVATION_AND_VALIDATION_COHORT", populationSize: 513, multicenter: false, prospective: false, methodStandardization: "LOCAL_SYNTHETIC_HEMATOCRIT_MODEL", methodologicalQuality: "MODERATE", assertionUtility: ["SYNTHETIC_HEMATOCRIT", "CONTEXTUAL_CONVERGENCE"], limitations: ["Single-center locally derived formula.", "Agreement does not establish universal clinical interchangeability."] }),
  source({ key: "shang-2018-synthetic-hct", pmid: "30089499", pmcid: "PMC6083590", doi: "10.1186/s12968-018-0475-6", title: "Extracellular volume fraction measurements derived from the longitudinal relaxation of blood-based synthetic hematocrit may lead to clinical errors in 3 T cardiovascular magnetic resonance", authors: "Shang Y et al.", journal: "Journal of Cardiovascular Magnetic Resonance", publicationDate: "2018-08-06", evidenceSourceType: "OBSERVATIONAL_STUDY", studyDesign: "RETROSPECTIVE_DERIVATION_AND_VALIDATION", populationSize: 226, multicenter: false, prospective: false, methodStandardization: "LOCAL_3T_SYNTHETIC_HEMATOCRIT_MODEL", methodologicalQuality: "MODERATE", assertionUtility: ["SYNTHETIC_HEMATOCRIT", "CONTRADICTION", "3T"], limitations: ["Single-center 3 T model and center-specific cutoff."] }),
  source({ key: "miller-2013-histology", pmid: "23553570", doi: "10.1161/CIRCIMAGING.112.000192", title: "Comprehensive validation of cardiovascular magnetic resonance techniques for the assessment of myocardial extracellular volume", authors: "Miller CA et al.", journal: "Circulation: Cardiovascular Imaging", publicationDate: "2013-05-01", evidenceSourceType: "PROSPECTIVE_STUDY", studyDesign: "WHOLE_HEART_HISTOLOGY_VALIDATION", populationSize: 36, multicenter: false, prospective: true, methodStandardization: "DYNAMIC_EQUILIBRIUM_MOLLI", methodologicalQuality: "MODERATE", assertionUtility: ["HISTOLOGY", "POST_CONTRAST_T1_LIMITATION", "ECV_VALIDATION"], limitations: ["Histology involved six transplant recipients; the healthy timing cohort involved 30 volunteers."] }),
  source({ key: "kramer-2020-protocols", pmid: "32089132", pmcid: "PMC7038611", doi: "10.1186/s12968-020-00607-1", title: "Standardized cardiovascular magnetic resonance imaging (CMR) protocols: 2020 update", authors: "Kramer CM et al.", journal: "Journal of Cardiovascular Magnetic Resonance", publicationDate: "2020-02-24", sourceType: "RECOMMENDATION", evidenceSourceType: "GUIDELINE", studyDesign: "SCMR_STANDARDIZED_PROTOCOL_GUIDANCE", multicenter: "NOT_APPLICABLE", prospective: "NOT_APPLICABLE", methodStandardization: "HIGH", methodologicalQuality: "HIGH", assertionUtility: ["CURRENT_PROTOCOL_GUIDANCE", "ECV_TIMING", "HEMATOCRIT", "LOCAL_VALUES"], limitations: ["Protocol guidance does not establish universal numerical reference values."] }),
  source({ key: "schulz-menger-2020-postprocessing", pmid: "32160925", pmcid: "PMC7066763", doi: "10.1186/s12968-020-00610-6", title: "Standardized image interpretation and post-processing in cardiovascular magnetic resonance - 2020 update", authors: "Schulz-Menger J et al.", journal: "Journal of Cardiovascular Magnetic Resonance", publicationDate: "2020-03-12", sourceType: "RECOMMENDATION", evidenceSourceType: "GUIDELINE", studyDesign: "SCMR_STANDARDIZED_POST_PROCESSING_GUIDANCE", multicenter: "NOT_APPLICABLE", prospective: "NOT_APPLICABLE", methodStandardization: "HIGH", methodologicalQuality: "HIGH", assertionUtility: ["CURRENT_POST_PROCESSING_GUIDANCE", "ECV_INPUTS", "ROI", "TIMING"], limitations: ["Post-processing guidance does not replace sequence-specific validation."] }),
  source({ key: "andonian-2016-original", pmid: "27579699", pmcid: "PMC5007013", doi: "10.1371/journal.pone.0161855", title: "Shear-Wave Elastography Assessments of Quadriceps Stiffness Changes prior to, during and after Prolonged Exercise: A Longitudinal Study during an Extreme Mountain Ultra-Marathon", authors: "Andonian P et al.", journal: "PLOS ONE", publicationDate: "2016-08-31", evidenceSourceType: "OBSERVATIONAL_STUDY", documentStatus: "CORRECTED", correctedBy: "27902782", studyDesign: "LONGITUDINAL_STUDY", multicenter: false, prospective: true, methodStandardization: "NOT_RELEVANT_TO_ECV_T1", methodologicalQuality: "NOT_ASSESSED_FOR_PILOT", assertionUtility: ["DOCUMENT_LIFECYCLE_ONLY"], limitations: ["Out of ECV/T1 domain; retained only because P3M-Web identified its correction lifecycle."] }),
  source({ key: "andonian-2016-correction", pmid: "27902782", pmcid: "PMC5130261", doi: "10.1371/journal.pone.0167668", title: "Correction: Shear-Wave Elastography Assessments of Quadriceps Stiffness Changes prior to, during and after Prolonged Exercise", authors: "Andonian P et al.", journal: "PLOS ONE", publicationDate: "2016-11-30", evidenceSourceType: "OBSERVATIONAL_STUDY", studyDesign: "PUBLISHED_ERRATUM", multicenter: "NOT_APPLICABLE", prospective: "NOT_APPLICABLE", methodStandardization: "NOT_APPLICABLE", methodologicalQuality: "HIGH_FOR_LIFECYCLE_IDENTITY", assertionUtility: ["DOCUMENT_LIFECYCLE_ONLY"], limitations: ["Out of ECV/T1 domain; no scientific ECV assertion is derived from it."] }),
];

export const selectedSourceRecords = Object.freeze(selected);
export const scientificSourceIdentities = Object.freeze(selected.map((item) => item.identity).sort((a, b) => a.stableId.localeCompare(b.stableId)));
export const scientificSourceRevisions = Object.freeze(selected.map((item) => item.revision).sort((a, b) => a.revisionId.localeCompare(b.revisionId)));
export const sourceByKey = Object.freeze(Object.fromEntries(selected.map((item) => [item.key, item.revision])));

export const internalSourceAudit = Object.freeze([
  { path: "src/pages/ECVMappingCardiaque.tsx", type: "REPOSITORY_PAGE", locator: "lines 83-105, 155-198, 205-225, 237-267, 280-301, 334-338, 416-480, 533-574", subjects: ["ECV", "T1 mapping", "MOLLI", "ShMOLLI", "SASHA", "hematocrit", "1.5 T", "3 T", "timing", "reproducibility"], doi: null, pmid: null, scientificStatus: "EDITORIAL_CLAIMS_WITHOUT_SOURCE_LOCALIZERS", decision: "AUDITED_NOT_USED_AS_PRIMARY_EVIDENCE" },
  { path: "src/pages/IRMImagerieQuantitative.tsx", type: "REPOSITORY_PAGE", locator: "lines 111, 184, 235-236, 296-311, 401-410, 501-523", subjects: ["T1", "ECV", "field strength", "manufacturer", "software", "multicenter reproducibility"], doi: null, pmid: null, scientificStatus: "EDITORIAL_CLAIMS_WITHOUT_SOURCE_LOCALIZERS", decision: "AUDITED_NOT_USED_AS_PRIMARY_EVIDENCE" },
  { path: "src/pages/BiomarqueursIRMCardiaqueEssais.tsx", type: "REPOSITORY_PAGE", locator: "lines 187, 223, 418-419, 494-495", subjects: ["ECV", "timing", "hematocrit", "1.5 T", "3 T", "reproducibility"], doi: null, pmid: null, scientificStatus: "EDITORIAL_CLAIMS_WITHOUT_SOURCE_LOCALIZERS", decision: "AUDITED_NOT_USED_AS_PRIMARY_EVIDENCE" },
  { path: "src/pages/BasesMulticentriques.tsx", type: "REPOSITORY_PAGE", locator: "lines 154, 238-239, 284-285, 309, 350, 377", subjects: ["multicenter", "MOLLI", "SASHA", "1.5 T", "3 T", "ECV"], doi: null, pmid: null, scientificStatus: "EDITORIAL_CLAIMS_WITHOUT_SOURCE_LOCALIZERS", decision: "AUDITED_NOT_USED_AS_PRIMARY_EVIDENCE" },
  { path: "src/pages/CorelabEC.tsx", type: "REPOSITORY_PAGE", locator: "lines 334, 375-379, 405", subjects: ["ECV", "fibrosis", "intersite variability", "field strength"], doi: null, pmid: null, scientificStatus: "EDITORIAL_CLAIMS_WITHOUT_SOURCE_LOCALIZERS", decision: "AUDITED_NOT_USED_AS_PRIMARY_EVIDENCE" },
  { path: "src/pages/QuantificationTissulaire.tsx", type: "REPOSITORY_PAGE", locator: "lines 96, 163, 176, 277", subjects: ["quantitative imaging", "reproducibility", "ECV"], doi: null, pmid: null, scientificStatus: "EDITORIAL_OR_NAVIGATIONAL", decision: "AUDITED_NOT_USED_AS_PRIMARY_EVIDENCE" },
  { path: "src/pages/ReferencesPublications.tsx", type: "REPOSITORY_PUBLICATION_REGISTRY", locator: "lines 9-91", subjects: ["PLOS original", "PLOS correction", "STEMI"], doi: "PARTIAL", pmid: null, scientificStatus: "BIBLIOGRAPHIC_LEAD_ONLY", decision: "USED_ONLY_TO_IDENTIFY_LIFECYCLE_CANDIDATE_THEN_EXTERNALLY_VERIFIED" },
  { path: "docs/editorial-pilot-integration.md", type: "INTERNAL_DOCUMENT", locator: "lines 27-45", subjects: ["heart", "T1/T2 mapping", "ECV"], doi: null, pmid: null, scientificStatus: "INTERNAL_FIXTURE", decision: "AUDITED_NOT_USED_AS_PRIMARY_EVIDENCE" },
  { path: "docs/p3m-web-migration-report.md", type: "INTERNAL_MIGRATION_REPORT", locator: "sections 8-33", subjects: ["provenance gaps", "ECV", "CT-ECV", "MOLLI", "SASHA", "myocarditis"], doi: null, pmid: null, scientificStatus: "MODEL_AUDIT_NOT_SCIENTIFIC_EVIDENCE", decision: "USED_AS_P4_BASELINE_ONLY" },
]);

export const rejectedExternalSources = Object.freeze([
  { title: "Cardiac T1 Mapping and Extracellular Volume in clinical practice: a comprehensive review", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5129251/", reason: "Secondary narrative review overlapped with selected consensus and primary studies; no unique assertion was needed." },
  { title: "Role of cardiac T1 mapping and extracellular volume in the assessment of myocardial infarction", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5998858/", reason: "Narrative review; the pilot retained the primary Kidambi cohort instead." },
  { title: "Clinical Significance of Extracellular Volume of Myocardium Assessed by Computed Tomography", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11942809/", reason: "Recent secondary meta-analysis overlapped with Han 2023 and was not required for a unique atomic assertion." },
  { title: "Myocardial extracellular volume measurement using cardiac computed tomography", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11561108/", reason: "Recent narrative review overlapped with the selected CT technical review and validation studies." },
  { title: "Reference Ranges, Diagnostic and Prognostic Utility of Native T1 Mapping and ECV for Cardiac Amyloidosis", url: "https://pubmed.ncbi.nlm.nih.gov/33274809/", reason: "Meta-analysis examined but not selected because the pilot already retained a directly localized prospective AL amyloidosis cohort and avoids importing pooled thresholds." },
  { title: "Detection of acute myocarditis using T1 and T2 mapping: systematic review and meta-analysis", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8504590/", reason: "Examined but not selected to avoid creating pooled diagnostic thresholds or an implicit meta-analysis in the pilot corpus." },
  { title: "Towards fully automated synthetic ECV quantification", url: "https://pubmed.ncbi.nlm.nih.gov/41807594/", reason: "2026 proof-of-concept examined but excluded from the stable pilot pending independent review and because deployed AI is outside P4." },
  { title: "NOXIA public editorial pages", url: null, reason: "Internal pages lack precise bibliographic provenance and cannot support real scientific assertions." },
]);

export const sourceSelectionSummary = Object.freeze({
  examinedInternal: internalSourceAudit.length,
  retainedScientific: scientificSourceRevisions.length,
  rejectedExternal: rejectedExternalSources.length,
  domainScientificSources: scientificSourceRevisions.filter((item) => !item.metadata.sourceQuality.assertionUtility.includes("DOCUMENT_LIFECYCLE_ONLY")).length,
  lifecycleOnlySources: scientificSourceRevisions.filter((item) => item.metadata.sourceQuality.assertionUtility.includes("DOCUMENT_LIFECYCLE_ONLY")).length,
});
