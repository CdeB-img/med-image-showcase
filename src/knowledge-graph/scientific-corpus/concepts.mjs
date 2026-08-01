import { createConceptIdentity, createContractRecord, createEntityRevision } from "../scientific-model-factories.mjs";
import { sourceByKey } from "./sources.mjs";

const familySlug = (entityType) => entityType.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const ref = (key) => sourceByKey[key].revisionId;

const concept = ({ slug, entityType, label, aliases = [], description, sourceKeys, unresolvedFields = [] }) => {
  const stableId = `noxia:radiology:${familySlug(entityType)}:${slug}`;
  const sourceRefs = sourceKeys.map(ref).sort();
  const identity = createConceptIdentity({ stableId, entityType, sourceRefs });
  const revision = createEntityRevision({
    stableId,
    payload: {
      preferredLabel: label,
      description,
      designations: [label, ...aliases],
      operational: false,
      publicContent: false,
    },
    unresolvedFields,
    completeness: {
      profile: "P4_SCIENTIFIC_CONCEPT",
      state: unresolvedFields.length === 0 ? "COMPLETE" : "PARTIAL",
      known: ["stableId", "entityType", "preferredLabel", "description", "sourceRefs"],
      unknown: [...unresolvedFields],
    },
    sourceRefs,
  });
  const designations = [label, ...aliases].map((value, index) => createContractRecord("ConceptDesignation", {
    designationId: `${stableId}:designation:en:${index + 1}`,
    entityId: stableId,
    value,
    language: "en",
    locale: "en",
    designationType: index === 0 ? "PREFERRED" : aliases[index - 1] === aliases[index - 1]?.toUpperCase() ? "ACRONYM" : "SYNONYM",
    preferred: index === 0,
    context: "SCIENTIFIC_CORPUS_ECV_T1",
    sourceRef: sourceRefs[0],
    validFrom: null,
    validUntil: null,
    status: "ACTIVE",
  }));
  return { identity, revision, designations };
};

const records = [
  concept({ slug: "molli", entityType: "AcquisitionMethod", label: "Modified Look-Locker inversion recovery", aliases: ["MOLLI"], description: "Inversion-recovery myocardial T1 mapping acquisition described by Messroghli and colleagues.", sourceKeys: ["messroghli-2004-molli", "roujol-2014-comparison"] }),
  concept({ slug: "shmolli", entityType: "AcquisitionMethod", label: "Shortened Modified Look-Locker inversion recovery", aliases: ["ShMOLLI"], description: "Shortened inversion-recovery myocardial T1 mapping acquisition designed for a nine-heartbeat breath-hold.", sourceKeys: ["piechnik-2010-shmolli", "roujol-2014-comparison"] }),
  concept({ slug: "sasha", entityType: "AcquisitionMethod", label: "Saturation recovery single-shot acquisition", aliases: ["SASHA"], description: "Saturation-recovery single-shot myocardial T1 mapping acquisition.", sourceKeys: ["chow-2014-sasha", "roujol-2014-comparison"] }),
  concept({ slug: "inversion-recovery-t1-mapping", entityType: "SequenceFamily", label: "Inversion-recovery T1 mapping", aliases: [], description: "Sequence family using inversion recovery for myocardial T1 estimation.", sourceKeys: ["kellman-2014-accuracy", "roujol-2014-comparison"] }),
  concept({ slug: "saturation-recovery-t1-mapping", entityType: "SequenceFamily", label: "Saturation-recovery T1 mapping", aliases: [], description: "Sequence family using saturation recovery for myocardial T1 estimation.", sourceKeys: ["chow-2014-sasha", "kellman-2014-accuracy"] }),
  concept({ slug: "myocardial-t1-mapping", entityType: "MeasurementMethod", label: "Myocardial T1 mapping", aliases: ["T1 mapping"], description: "Quantitative CMR method that estimates longitudinal relaxation time in myocardium.", sourceKeys: ["moon-2013-consensus", "messroghli-2017-consensus"] }),
  concept({ slug: "native-myocardial-t1", entityType: "Observation", label: "Native myocardial T1", aliases: ["Native T1"], description: "Myocardial longitudinal relaxation time observed before contrast administration.", sourceKeys: ["messroghli-2017-consensus", "kellman-2012-ecv"] }),
  concept({ slug: "post-contrast-myocardial-t1", entityType: "Observation", label: "Post-contrast myocardial T1", aliases: [], description: "Myocardial longitudinal relaxation time observed after contrast administration.", sourceKeys: ["kellman-2012-ecv", "miller-2013-histology"] }),
  concept({ slug: "native-blood-t1", entityType: "Observation", label: "Native blood T1", aliases: [], description: "Blood-pool longitudinal relaxation time observed before contrast administration.", sourceKeys: ["kellman-2012-ecv"] }),
  concept({ slug: "post-contrast-blood-t1", entityType: "Observation", label: "Post-contrast blood T1", aliases: [], description: "Blood-pool longitudinal relaxation time observed after contrast administration.", sourceKeys: ["kellman-2012-ecv"] }),
  concept({ slug: "longitudinal-relaxation-rate", entityType: "MeasurementDefinition", label: "Longitudinal relaxation rate", aliases: ["R1"], description: "Reciprocal of T1 used in contrast partition and ECV calculations.", sourceKeys: ["moon-2013-consensus", "kellman-2012-ecv"] }),
  concept({ slug: "change-in-longitudinal-relaxation-rate", entityType: "MeasurementDefinition", label: "Change in longitudinal relaxation rate", aliases: ["Delta R1"], description: "Post-contrast minus pre-contrast longitudinal relaxation rate.", sourceKeys: ["moon-2013-consensus", "kellman-2012-ecv"] }),
  concept({ slug: "hematocrit", entityType: "MeasurementDefinition", label: "Hematocrit", aliases: ["Hct"], description: "Blood volume fraction occupied by erythrocytes and an input to ECV calculation.", sourceKeys: ["kellman-2012-ecv", "moon-2013-consensus"] }),
  concept({ slug: "myocardial-ecv-mr", entityType: "DerivedMeasurement", label: "CMR myocardial extracellular volume fraction", aliases: ["CMR ECV"], description: "Derived myocardial extracellular volume fraction based on pre- and post-contrast myocardial and blood T1 with hematocrit.", sourceKeys: ["kellman-2012-ecv", "moon-2013-consensus"] }),
  concept({ slug: "myocardial-ecv-ct", entityType: "DerivedMeasurement", label: "CT myocardial extracellular volume fraction", aliases: ["CT ECV"], description: "Derived myocardial extracellular volume fraction based on pre- and delayed-contrast CT attenuation or iodine-density changes with hematocrit.", sourceKeys: ["cundari-2023-ct-method", "nacif-2012-ct"] }),
  concept({ slug: "pre-contrast-myocardial-ct-attenuation", entityType: "Observation", label: "Pre-contrast myocardial CT attenuation", aliases: [], description: "Myocardial attenuation observed on non-contrast CT for a single-energy CT ECV calculation.", sourceKeys: ["cundari-2023-ct-method"] }),
  concept({ slug: "delayed-myocardial-ct-attenuation", entityType: "Observation", label: "Delayed myocardial CT attenuation", aliases: [], description: "Myocardial attenuation observed on delayed contrast-enhanced CT.", sourceKeys: ["cundari-2023-ct-method"] }),
  concept({ slug: "pre-contrast-blood-ct-attenuation", entityType: "Observation", label: "Pre-contrast blood CT attenuation", aliases: [], description: "Blood-pool attenuation observed on non-contrast CT for a single-energy CT ECV calculation.", sourceKeys: ["cundari-2023-ct-method"] }),
  concept({ slug: "delayed-blood-ct-attenuation", entityType: "Observation", label: "Delayed blood CT attenuation", aliases: [], description: "Blood-pool attenuation observed on delayed contrast-enhanced CT.", sourceKeys: ["cundari-2023-ct-method"] }),
  concept({ slug: "iodine-density-change", entityType: "Observation", label: "Iodine density change", aliases: [], description: "Spectral CT iodine-density change used as an alternative contrast-partition input.", sourceKeys: ["cundari-2023-ct-method"] }),
  concept({ slug: "field-strength-1-5-t", entityType: "TechnicalContext", label: "1.5 T magnetic field strength", aliases: ["1.5 T"], description: "CMR magnetic field strength of 1.5 tesla.", sourceKeys: ["piechnik-2010-shmolli", "dabir-2014-multicenter"] }),
  concept({ slug: "field-strength-3-t", entityType: "TechnicalContext", label: "3 T magnetic field strength", aliases: ["3 T"], description: "CMR magnetic field strength of 3 tesla.", sourceKeys: ["piechnik-2010-shmolli", "dabir-2014-multicenter"] }),
  concept({ slug: "gadolinium-based-contrast-agent", entityType: "ContrastAgentClass", label: "Gadolinium-based contrast agent", aliases: ["GBCA"], description: "Extracellular gadolinium-based contrast class used for CMR ECV measurement.", sourceKeys: ["messroghli-2017-consensus", "kellman-2012-ecv"] }),
  concept({ slug: "iodinated-contrast-agent", entityType: "ContrastAgentClass", label: "Iodinated contrast agent", aliases: [], description: "Iodinated contrast class used for CT ECV measurement.", sourceKeys: ["bandula-2013-ct", "cundari-2023-ct-method"] }),
  concept({ slug: "post-contrast-delay", entityType: "TechnicalContext", label: "Post-contrast acquisition delay", aliases: ["Post-contrast timing"], description: "Elapsed time between contrast administration and quantitative acquisition.", sourceKeys: ["kellman-2012-ecv", "lundin-2019-timing", "cundari-2023-ct-method"] }),
  concept({ slug: "acute-myocarditis", entityType: "Disease", label: "Acute myocarditis", aliases: ["Myocarditis"], description: "Inflammatory myocardial disease studied with CMR T1-based criteria and ECV.", sourceKeys: ["ferreira-2018-myocarditis", "nadjiri-2017-myocarditis"] }),
  concept({ slug: "acute-myocardial-infarction", entityType: "Disease", label: "Acute myocardial infarction", aliases: ["Acute MI"], description: "Acute myocardial infarction studied with CMR ECV and functional recovery.", sourceKeys: ["kidambi-2017-mi", "kellman-2012-ecv"] }),
  concept({ slug: "systemic-al-amyloidosis", entityType: "Disease", label: "Systemic light-chain amyloidosis", aliases: ["AL amyloidosis"], description: "Systemic light-chain amyloidosis studied with myocardial T1 mapping and ECV.", sourceKeys: ["banypersad-2015-amyloid"] }),
  concept({ slug: "diffuse-myocardial-fibrosis", entityType: "Finding", label: "Diffuse myocardial fibrosis", aliases: [], description: "Diffuse expansion of myocardial extracellular matrix studied through ECV and histology.", sourceKeys: ["miller-2013-histology", "bandula-2013-ct"] }),
  concept({ slug: "measurement-accuracy", entityType: "QualityAttribute", label: "Measurement accuracy", aliases: [], description: "Closeness of a T1 estimate to a reference value, kept distinct from precision.", sourceKeys: ["kellman-2014-accuracy", "roujol-2014-comparison"] }),
  concept({ slug: "measurement-precision", entityType: "QualityAttribute", label: "Measurement precision", aliases: [], description: "Dispersion of repeated estimates, kept distinct from accuracy.", sourceKeys: ["kellman-2014-accuracy", "roujol-2014-comparison"] }),
  concept({ slug: "repeatability", entityType: "QualityAttribute", label: "Repeatability", aliases: [], description: "Agreement under repeated measurements in the same measurement conditions.", sourceKeys: ["captur-2020-t1mes", "roujol-2014-comparison"] }),
  concept({ slug: "reproducibility", entityType: "QualityAttribute", label: "Reproducibility", aliases: [], description: "Agreement when measurement conditions vary; it is not treated as a synonym of repeatability.", sourceKeys: ["dabir-2014-multicenter", "roujol-2014-comparison"] }),
  concept({ slug: "intersite-reproducibility", entityType: "QualityAttribute", label: "Intersite reproducibility", aliases: [], description: "Reproducibility across acquisition sites.", sourceKeys: ["dabir-2014-multicenter", "captur-2020-t1mes"] }),
  concept({ slug: "interscanner-reproducibility", entityType: "QualityAttribute", label: "Interscanner reproducibility", aliases: [], description: "Reproducibility across scanner systems.", sourceKeys: ["captur-2020-t1mes"] }),
  concept({ slug: "interreader-reproducibility", entityType: "QualityAttribute", label: "Interreader reproducibility", aliases: [], description: "Reproducibility across readers or analysts.", sourceKeys: ["dabir-2014-multicenter"], unresolvedFields: ["quantitativeEstimate"] }),
  concept({ slug: "heart-rate-dependence", entityType: "Confounder", label: "Heart-rate dependence", aliases: [], description: "Dependence of a mapping result on heart rate documented for some acquisition methods.", sourceKeys: ["chow-2014-sasha", "kellman-2014-accuracy"] }),
  concept({ slug: "cardiac-motion", entityType: "Confounder", label: "Cardiac and respiratory motion", aliases: [], description: "Motion that may cause spatial misregistration or map artefact.", sourceKeys: ["kellman-2012-ecv", "messroghli-2017-consensus"] }),
  concept({ slug: "off-resonance", entityType: "Confounder", label: "Off-resonance", aliases: [], description: "Magnetic field off-resonance that can bias myocardial T1 mapping methods.", sourceKeys: ["kellman-2014-accuracy"] }),
  concept({ slug: "partial-volume", entityType: "Confounder", label: "Partial-volume effect", aliases: [], description: "Mixing of myocardium with adjacent tissues that can bias quantitative maps.", sourceKeys: ["messroghli-2017-consensus"] }),
  concept({ slug: "method-dependence", entityType: "Confounder", label: "Mapping-method dependence", aliases: [], description: "Dependence of observed T1 or ECV on acquisition and fitting method.", sourceKeys: ["roujol-2014-comparison", "messroghli-2017-consensus"] }),
  concept({ slug: "synthetic-hematocrit", entityType: "MeasurementMethod", label: "Synthetic hematocrit", aliases: ["Synthetic Hct"], description: "Hematocrit estimated from blood T1 rather than directly sampled blood.", sourceKeys: ["kammerlander-2018-synthetic-hct", "shang-2018-synthetic-hct"] }),
];

export const scientificCorpusConceptIdentities = Object.freeze(records.map((item) => item.identity).sort((a, b) => a.stableId.localeCompare(b.stableId)));
export const scientificCorpusEntityRevisions = Object.freeze(records.map((item) => item.revision).sort((a, b) => a.revisionId.localeCompare(b.revisionId)));
export const scientificCorpusConceptDesignations = Object.freeze(records.flatMap((item) => item.designations).sort((a, b) => a.designationId.localeCompare(b.designationId)));

export const conceptBySlug = Object.freeze(Object.fromEntries(records.map((item) => [item.identity.stableId.split(":").at(-1), item.identity.stableId])));

export const historicalConceptIds = Object.freeze({
  mr: "noxia:radiology:modality:irm",
  ct: "noxia:radiology:modality:ct",
  heart: "noxia:radiology:organ:heart",
  myocardium: "noxia:radiology:region:myocardium",
  t1MappingSequence: "noxia:radiology:sequence:t1-mapping",
  t1Biomarker: "noxia:radiology:biomarker:t1",
  ecvBiomarker: "noxia:radiology:biomarker:ecv",
  ecvMeasurement: "noxia:radiology:measurement:ecv",
  lgeQuantification: "noxia:radiology:biomarker:lge-quantification",
  mvo: "noxia:radiology:biomarker:mvo",
  myocardialHemorrhage: "noxia:radiology:biomarker:myocardial-hemorrhage",
  stemi: "noxia:radiology:disease:stemi",
});

export const ontologicalRequalificationDecisions = Object.freeze([
  { conceptId: historicalConceptIds.t1MappingSequence, historicalClass: "Sequence", proposedClass: "MeasurementMethod", appliedClass: "Sequence", decision: "DEFERRED", sourceRevisionIds: [ref("messroghli-2017-consensus")], reason: "The historic identity is preserved; P4 introduces a separate sourced MeasurementMethod identity." },
  { conceptId: historicalConceptIds.t1Biomarker, historicalClass: "Biomarker", proposedClass: "Observation", appliedClass: "Biomarker", decision: "DEFERRED", sourceRevisionIds: [ref("messroghli-2017-consensus")], reason: "Native and post-contrast observations require distinct identities and cannot replace the broad historic concept safely." },
  { conceptId: historicalConceptIds.ecvBiomarker, historicalClass: "Biomarker", proposedClass: "DerivedMeasurement", appliedClass: "Biomarker", decision: "DEFERRED", sourceRevisionIds: [ref("kellman-2012-ecv")], reason: "P4 preserves the editorial biomarker identity and adds modality-specific derived measurements." },
  { conceptId: historicalConceptIds.lgeQuantification, historicalClass: "Biomarker", proposedClass: "FindingOrEndpoint", appliedClass: "Biomarker", decision: "DEFERRED", sourceRevisionIds: [ref("ferreira-2018-myocarditis")], reason: "The selected corpus does not localize enough evidence to choose between finding and endpoint across use cases." },
  { conceptId: historicalConceptIds.mvo, historicalClass: "Biomarker", proposedClass: "Finding", appliedClass: "Biomarker", decision: "DEFERRED", sourceRevisionIds: [], reason: "MVO is outside the P4 enrichment domain." },
  { conceptId: historicalConceptIds.myocardialHemorrhage, historicalClass: "Biomarker", proposedClass: "Finding", appliedClass: "Biomarker", decision: "DEFERRED", sourceRevisionIds: [], reason: "Intramyocardial hemorrhage is outside the P4 enrichment domain." },
]);
