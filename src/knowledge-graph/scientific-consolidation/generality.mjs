import { sha256Digest } from "../migration/stable-json.mjs";

const generic = (contractId, purpose, reusableAcross) => Object.freeze({ contractId, purpose, reusableAcross: Object.freeze(reusableAcross), generic: true });

export const genericScientificContracts = Object.freeze([
  generic("stable-identity", "Separate a durable concept or assertion identity from revisions.", ["measurement", "standard", "method", "disease"]),
  generic("versioned-revision", "Preserve supersession, correction and retraction history.", ["publication", "assertion", "concept", "method"]),
  generic("source-identity", "Identify one documentary or scientific work independently from retrievals.", ["journal", "standard", "guideline", "documentation"]),
  generic("source-revision", "Record version, access state, digest and bibliographic provenance.", ["full-text", "abstract", "correction", "standard"]),
  generic("localized-extraction", "Bind an analytical extraction to a section, page, paragraph, table or figure.", ["narrative", "numeric", "method", "limitation"]),
  generic("atomic-assertion", "Represent one principal conclusion with explicit polarity and maturity.", ["association", "method", "compatibility", "negative-result"]),
  generic("evidence-link", "Represent support, refutation, qualification, mention, derivation or documentary correction.", ["primary-study", "review", "standard", "guideline"]),
  generic("applicability-context", "Preserve reported population, acquisition, method and temporal context without inventing dimensions.", ["MR", "CT", "ultrasound", "informatics"]),
  generic("measurement-definition", "Define a quantity without assuming a formula or unit.", ["relaxometry", "perfusion", "diffusion", "dose"]),
  generic("measurement-method", "Separate acquisition or calculation method from the measured quantity.", ["imaging", "segmentation", "post-processing", "laboratory"]),
  generic("observation", "Represent an observed value before interpretation.", ["quantitative", "categorical", "technical", "clinical"]),
  generic("derived-measurement", "Represent a sourced derivation with explicit inputs, units and assumptions.", ["ratio", "map", "index", "kinetic-model"]),
  generic("metrology-semantics", "Keep accuracy, precision, repeatability, reproducibility, agreement, correlation, bias and calibration distinct.", ["phantom", "reader", "scanner", "site"]),
  generic("contradiction-classification", "Distinguish true contradiction from method, population, definition or context differences.", ["clinical", "technical", "standard", "historical"]),
  generic("structured-synthesis", "Create a deterministic non-statistical synthesis that preserves evidence and gaps.", ["state-of-knowledge", "comparison", "limitations", "history"]),
  generic("multidimensional-readiness", "Assess catalogue, science, provenance, synthesis, editorial, SEO and publication independently.", ["concept", "synthesis", "projection"]),
  generic("automated-review", "Record deterministic structural and semantic guards without claiming human validation.", ["assertion", "evidence", "source", "synthesis"]),
  generic("publication-guards", "Keep internal scientific projections unrouted and non-indexable until a distinct publication decision.", ["fixture", "projection", "preview"]),
]);

export const domainSpecificExtensions = Object.freeze([
  { extensionId: "ecv-formula", scope: "ECV_T1_PILOT", examples: ["Delta R1 ratio", "attenuation-change ratio", "iodine-density ratio"] },
  { extensionId: "hematocrit-input", scope: "ECV_T1_PILOT", examples: ["measured hematocrit", "synthetic hematocrit"] },
  { extensionId: "cardiac-relaxometry-methods", scope: "ECV_T1_PILOT", examples: ["MOLLI", "ShMOLLI", "SASHA"] },
  { extensionId: "post-contrast-equilibrium", scope: "ECV_T1_PILOT", examples: ["gadolinium timing", "iodinated contrast timing"] },
]);

export const modalitySpecificExtensions = Object.freeze([
  { extensionId: "mr-field-strength", scope: "MR", examples: ["1.5 T", "3 T"] },
  { extensionId: "mr-relaxation-observations", scope: "MR", examples: ["native T1", "post-contrast T1", "R1"] },
  { extensionId: "ct-attenuation-observations", scope: "CT", examples: ["pre-contrast HU", "delayed HU"] },
  { extensionId: "spectral-ct-iodine-density", scope: "SPECTRAL_CT", examples: ["iodine map", "iodine-density ratio"] },
]);

export const specialtySpecificExtensions = Object.freeze([
  { extensionId: "myocardial-regions", scope: "CARDIAC_IMAGING", examples: ["myocardium", "blood pool"] },
  { extensionId: "cardiac-pilot-diseases", scope: "CARDIAC_IMAGING", examples: ["myocarditis", "acute myocardial infarction", "AL amyloidosis"] },
]);

const fixture = (key, values) => Object.freeze({
  fixtureId: `fixture:noxia:scientific-generality:${key}`,
  fixtureOnly: true,
  synthetic: true,
  realCorpus: false,
  publicContent: false,
  sourceRefs: Object.freeze(["FIXTURE_ONLY"]),
  ...values,
});

export const genericityFixtures = Object.freeze([
  fixture("adc-diffusion", { domain: "adc-diffusion", subjectType: "DerivedMeasurement", quantity: "apparent diffusion coefficient", unit: "10^-3 mm2/s", formulaRequired: false, contracts: ["measurement-definition", "derived-measurement", "applicability-context"] }),
  fixture("tmax-perfusion", { domain: "ct-perfusion", subjectType: "DerivedMeasurement", quantity: "Tmax", unit: "s", formulaRequired: false, contracts: ["measurement-method", "derived-measurement", "metrology-semantics"] }),
  fixture("lge-multi-role", { domain: "lge-mvo", subjectType: "Concept", quantity: null, unit: null, formulaRequired: false, contextualRoles: ["Finding", "ClinicalApplication"], contracts: ["stable-identity", "applicability-context"] }),
  fixture("segmentation-method", { domain: "ai-segmentation", subjectType: "MeasurementMethod", quantity: null, unit: null, formulaRequired: false, contracts: ["measurement-method", "localized-extraction"] }),
  fixture("dicom-standard", { domain: "dicom-standard", subjectType: "TechnicalStandard", quantity: null, unit: null, formulaRequired: false, contracts: ["source-revision", "versioned-revision", "atomic-assertion"] }),
  fixture("spectral-ct-technology", { domain: "spectral-ct", subjectType: "Technology", quantity: null, unit: null, formulaRequired: false, contracts: ["stable-identity", "applicability-context"] }),
  fixture("corrected-publication", { domain: "document-lifecycle", subjectType: "PublicationWork", quantity: null, unit: null, formulaRequired: false, contracts: ["source-identity", "source-revision", "versioned-revision"] }),
  fixture("contextual-contradiction", { domain: "evidence-synthesis", subjectType: "Contradiction", quantity: null, unit: null, formulaRequired: false, contracts: ["evidence-link", "contradiction-classification"] }),
  fixture("quantitative-hu", { domain: "ct-perfusion", subjectType: "Observation", quantity: "attenuation change", unit: "HU", formulaRequired: false, contracts: ["measurement-definition", "observation", "metrology-semantics"] }),
  fixture("concept-without-formula", { domain: "quality-control", subjectType: "QualityAttribute", quantity: null, unit: null, formulaRequired: false, contracts: ["stable-identity", "atomic-assertion"] }),
]);

const forbiddenPilotTokens = ["hematocrit", "molli", "sasha", "gadolinium", "myocard", "delta r1", "ecv_mr", "ecv_ct"];

export const evaluateGenericityFixture = (item) => {
  const serialized = JSON.stringify(item).toLowerCase();
  const detectedPilotDependencies = forbiddenPilotTokens.filter((token) => serialized.includes(token));
  const errors = [
    ...(!item.fixtureOnly || !item.synthetic || item.realCorpus ? ["FIXTURE_ISOLATION_INVALID"] : []),
    ...(!item.fixtureId.startsWith("fixture:") ? ["FIXTURE_NAMESPACE_INVALID"] : []),
    ...(detectedPilotDependencies.length ? ["ECV_T1_DEPENDENCY_DETECTED"] : []),
    ...(!item.contracts?.length ? ["NO_GENERIC_CONTRACT_TESTED"] : []),
  ];
  return Object.freeze({ fixtureId: item.fixtureId, domain: item.domain, contracts: item.contracts, detectedPilotDependencies: Object.freeze(detectedPilotDependencies), errors: Object.freeze(errors), valid: errors.length === 0 });
};

export const genericityResults = Object.freeze(genericityFixtures.map(evaluateGenericityFixture));

export const createGenericEnrichmentProtocol = (domainId) => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(domainId)) throw new Error("domainId must be a lowercase kebab-case identifier");
  const steps = [
    "define-scope",
    "audit-repository",
    "search-documentation",
    "select-sources",
    "create-concepts",
    "qualify-ontology",
    "create-measures-and-methods",
    "extract-localized-evidence",
    "create-atomic-assertions",
    "create-evidence-links",
    "record-contexts",
    "record-limitations",
    "classify-contradictions",
    "create-structured-syntheses",
    "create-deterministic-queries",
    "calculate-readiness",
    "audit-generality",
    "validate-final-state",
  ];
  const material = { protocolVersion: "1.0.0", domainId, steps };
  return Object.freeze({
    protocolId: `noxia:scientific-enrichment-protocol:${domainId}:${sha256Digest(material)}`,
    protocolVersion: "1.0.0",
    domainId,
    steps: Object.freeze(steps),
    publicPublication: false,
    executableClinicalProtocol: false,
    domainSpecificTerms: Object.freeze([]),
    deterministicDigest: sha256Digest(material),
  });
};

export const genericEnrichmentProtocolTemplate = createGenericEnrichmentProtocol("domain-placeholder");

export const scientificExtensionPlan = Object.freeze([
  { domainId: "adc-diffusion", value: "High", sourceAvailability: "High", newDimension: "Diffusion-derived measurement and b-value context", priority: 1 },
  { domainId: "ct-perfusion", value: "High", sourceAvailability: "High", newDimension: "Dynamic acquisition, kinetic models and perfusion endpoints", priority: 2 },
  { domainId: "dicom-standard", value: "High", sourceAvailability: "High", newDimension: "Versioned technical standards without biomarker assumptions", priority: 3 },
  { domainId: "lge-mvo-intramyocardial-hemorrhage", value: "High", sourceAvailability: "High", newDimension: "Findings, endpoints and multi-role concepts", priority: 4 },
  { domainId: "t2-mapping", value: "High", sourceAvailability: "High", newDimension: "Quantitative mapping with different confounders and units", priority: 5 },
  { domainId: "spectral-photon-counting-ct", value: "High", sourceAvailability: "Moderate", newDimension: "Technology generations, material maps and equipment context", priority: 6 },
  { domainId: "oef-cmro2", value: "Medium", sourceAvailability: "Moderate", newDimension: "Physiological models with multiple derived inputs", priority: 7 },
  { domainId: "ai-segmentation", value: "High", sourceAvailability: "High", newDimension: "Algorithms, evaluation metrics and external validation as documentary objects", priority: 8 },
]);

export const generalitySummary = Object.freeze({
  genericContracts: genericScientificContracts.length,
  domainSpecificExtensions: domainSpecificExtensions.length,
  modalitySpecificExtensions: modalitySpecificExtensions.length,
  specialtySpecificExtensions: specialtySpecificExtensions.length,
  fixtures: genericityFixtures.length,
  validFixtures: genericityResults.filter((result) => result.valid).length,
  leakedFixtures: genericityFixtures.filter((item) => item.realCorpus).length,
  futureDomains: scientificExtensionPlan.length,
});

