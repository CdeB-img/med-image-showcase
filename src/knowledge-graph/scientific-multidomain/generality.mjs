import { genericScientificContracts } from "../scientific-consolidation/generality.mjs";
import { P5_DOMAIN_IDS } from "./constants.mjs";

const allFiveDomains = Object.freeze(["ecv-t1", ...P5_DOMAIN_IDS]);

export const confirmedGenericInvariants = Object.freeze(genericScientificContracts.map((contract) => Object.freeze({
  invariantId: contract.contractId,
  purpose: contract.purpose,
  userDomains: allFiveDomains,
  generic: true,
  domainSpecificExtensionRequired: ["measurement-definition", "measurement-method", "derived-measurement", "applicability-context"].includes(contract.contractId),
  decision: "CONFIRMED_WITHOUT_CONTRACT_CHANGE",
})));

export const p5DomainSpecificExtensions = Object.freeze([
  { extensionId: "diffusion-b-value-context", domainId: "diffusion-adc", kind: "MEASUREMENT_FAMILY", genericContract: "applicability-context" },
  { extensionId: "diffusion-gradient-nonlinearity", domainId: "diffusion-adc", kind: "MODALITY", genericContract: "metrology-semantics" },
  { extensionId: "diffusion-phantom-conformance", domainId: "diffusion-adc", kind: "QUALITY", genericContract: "measurement-method" },
  { extensionId: "perfusion-aif", domainId: "cerebral-perfusion", kind: "MODEL_INPUT", genericContract: "measurement-method" },
  { extensionId: "perfusion-deconvolution", domainId: "cerebral-perfusion", kind: "RECONSTRUCTION", genericContract: "measurement-method" },
  { extensionId: "perfusion-threshold-context", domainId: "cerebral-perfusion", kind: "SOFTWARE_AND_ALGORITHM", genericContract: "applicability-context" },
  { extensionId: "lge-inversion-nulling", domainId: "myocardial-tissue-characterization", kind: "ACQUISITION", genericContract: "measurement-method" },
  { extensionId: "cardiac-finding-endpoint-role", domainId: "myocardial-tissue-characterization", kind: "FINDING", genericContract: "applicability-context" },
  { extensionId: "hemorrhage-iron-sensitive-context", domainId: "myocardial-tissue-characterization", kind: "SEQUENCE", genericContract: "measurement-method" },
  { extensionId: "spectral-platform-architecture", domainId: "spectral-ct", kind: "TECHNOLOGY", genericContract: "applicability-context" },
  { extensionId: "spectral-material-basis", domainId: "spectral-ct", kind: "RECONSTRUCTION", genericContract: "measurement-method" },
  { extensionId: "spectral-energy-level", domainId: "spectral-ct", kind: "RECONSTRUCTION_OUTPUT", genericContract: "applicability-context" },
  { extensionId: "spectral-iodine-calibration", domainId: "spectral-ct", kind: "METROLOGY", genericContract: "metrology-semantics" },
]);

export const genericContractModifications = Object.freeze([]);

export const residualEcvBiasAudit = Object.freeze({
  mandatoryFormulaOutsideApplicableDomain: false,
  mandatoryHematocrit: false,
  mandatoryContrastAgent: false,
  mandatoryMagneticField: false,
  mandatoryCardiacPathology: false,
  mandatoryMrSequence: false,
  domainManifestDependsOnEcvT1: false,
  conclusion: "NO_RESIDUAL_ECV_T1_REQUIREMENT_DETECTED",
});

export const p5CoverageAssessment = Object.freeze([
  { domainId: "diffusion-adc", coverage: "SUBSTANTIAL_PILOT", denominatorDefined: false, strengths: ["ADC metrology", "multicenter reproducibility", "stroke interpretation limits"], gaps: ["field-strength effects", "vendor-specific reconstruction", "non-neurologic clinical applications"] },
  { domainId: "cerebral-perfusion", coverage: "SUBSTANTIAL_PILOT", denominatorDefined: false, strengths: ["parameter definitions", "deconvolution", "software variability"], gaps: ["software versions", "MR-versus-CT equivalence", "universal thresholds intentionally absent"] },
  { domainId: "myocardial-tissue-characterization", coverage: "SUBSTANTIAL_PILOT", denominatorDefined: false, strengths: ["LGE acquisition and finding", "MVO and IMH roles", "quantification-method differences"], gaps: ["uniform IMH protocol", "timing harmonization", "disease-specific generalization"] },
  { domainId: "spectral-ct", coverage: "SUBSTANTIAL_PILOT", denominatorDefined: false, strengths: ["technology separation", "iodine metrology", "VMI and VNC limits"], gaps: ["clinical cross-platform reproducibility", "software-version effects", "outcome validation"] },
]);

export const nextScientificWaves = Object.freeze([
  { priority: 1, domainId: "oef-cmro2", scientificValue: "HIGH", editorialValue: "HIGH", sourceAvailability: "MODERATE", newDimension: "physiological models with multiple derived inputs" },
  { priority: 2, domainId: "t2-mapping", scientificValue: "HIGH", editorialValue: "HIGH", sourceAvailability: "HIGH", newDimension: "quantitative mapping with distinct confounders" },
  { priority: 3, domainId: "segmentation", scientificValue: "HIGH", editorialValue: "HIGH", sourceAvailability: "HIGH", newDimension: "algorithm identity and reference standard" },
  { priority: 4, domainId: "quality-control", scientificValue: "HIGH", editorialValue: "HIGH", sourceAvailability: "HIGH", newDimension: "phantom, acceptance and longitudinal quality concepts" },
  { priority: 5, domainId: "registration", scientificValue: "MEDIUM", editorialValue: "HIGH", sourceAvailability: "HIGH", newDimension: "transformation models and alignment metrics" },
  { priority: 6, domainId: "photon-counting-ct-applications", scientificValue: "HIGH", editorialValue: "HIGH", sourceAvailability: "MODERATE", newDimension: "technology maturation and clinical validation" },
  { priority: 7, domainId: "radiomics", scientificValue: "HIGH", editorialValue: "MEDIUM", sourceAvailability: "HIGH", newDimension: "feature definitions, harmonization and external validation" },
  { priority: 8, domainId: "neuro-oncology", scientificValue: "HIGH", editorialValue: "HIGH", sourceAvailability: "HIGH", newDimension: "multiparametric application context" },
  { priority: 9, domainId: "hepatic-imaging", scientificValue: "HIGH", editorialValue: "HIGH", sourceAvailability: "HIGH", newDimension: "organ-specific contrast phases and quantitative fat or iron" },
  { priority: 10, domainId: "nuclear-medicine", scientificValue: "HIGH", editorialValue: "MEDIUM", sourceAvailability: "HIGH", newDimension: "radiotracer, activity and reconstruction metrology" },
]);

export const p5GeneralitySummary = Object.freeze({
  comparedDomains: allFiveDomains.length,
  confirmedGenericInvariants: confirmedGenericInvariants.length,
  domainSpecificExtensions: p5DomainSpecificExtensions.length,
  genericContractModifications: genericContractModifications.length,
  residualEcvBiasDetected: Object.entries(residualEcvBiasAudit).some(([key, value]) => key !== "conclusion" && value === true),
  nextDomains: nextScientificWaves.length,
});

