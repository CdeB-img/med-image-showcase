export const SCIENTIFIC_KNOWLEDGE_GRAPH_VERSION = "2.0.0";

const contract = (typeName, requiredFields, optionalFields, description) => Object.freeze({
  typeName,
  requiredFields: Object.freeze(requiredFields),
  optionalFields: Object.freeze(optionalFields),
  description,
  version: SCIENTIFIC_KNOWLEDGE_GRAPH_VERSION,
});

export const unknownValueStates = Object.freeze(["UNKNOWN", "UNRESOLVED", "UNSOURCED", "NOT_APPLICABLE"]);
export const revisionStatuses = Object.freeze(["DRAFT", "ACTIVE", "SUPERSEDED", "CORRECTED", "RETRACTED", "OBSOLETE"]);

export const versioningContracts = Object.freeze({
  ConceptIdentity: contract("ConceptIdentity", ["stableId", "entityType", "createdAt", "sourceRefs"], ["externalIdentityRefs"], "Stable identity of a concept independently from its revisions."),
  EntityRevision: contract("EntityRevision", ["stableId", "revisionId", "revisionNumber", "status", "validFrom", "validUntil", "supersedesRevisionId", "correctedByRevisionId", "retractedByRevisionId", "createdAt", "updatedAt", "sourceRefs", "payload"], ["unresolvedFields", "completeness"], "Versioned representation of an entity concept."),
  ScientificAssertionIdentity: contract("ScientificAssertionIdentity", ["stableId", "assertionType", "createdAt", "sourceRefs"], [], "Stable identity shared by all revisions of one scientific proposition."),
  ScientificAssertionRevision: contract("ScientificAssertionRevision", ["stableId", "revisionId", "revisionNumber", "assertionType", "subjectEntityId", "predicate", "objectEntityId", "literalValue", "quantitativeValue", "normativeStatement", "scope", "context", "population", "method", "temporalContext", "applicability", "limitations", "polarity", "status", "confidence", "evidenceQuality", "scientificMaturity", "validFrom", "validUntil", "supersedesRevisionId", "correctedByRevisionId", "retractedByRevisionId", "createdAt", "updatedAt", "sourceRefs"], ["reviewer", "reviewerStatus", "reviewState", "reviewType", "humanReviewed", "statement", "modality", "sequence", "fieldStrength", "facets"], "Versioned assertion supporting entity, literal, quantitative, applicability, compatibility, recommendation and negative conclusions."),
  SourceIdentity: contract("SourceIdentity", ["stableId", "sourceType", "createdAt"], ["canonicalUri"], "Stable source identity independently from retrievals and document revisions."),
  SourceRevision: contract("SourceRevision", ["stableId", "revisionId", "revisionNumber", "sourceType", "title", "authority", "authors", "publicationDate", "version", "doi", "pmid", "url", "repositoryPath", "locator", "section", "page", "paragraph", "digest", "language", "status", "retrievedAt", "validFrom", "validUntil", "supersedesRevisionId", "correctedByRevisionId", "retractedByRevisionId", "createdAt", "updatedAt", "sourceRefs"], ["metadata", "completeness"], "Versioned source payload with category-specific optional bibliographic or repository fields."),
  PublicationWork: contract("PublicationWork", ["stableId", "title", "createdAt", "sourceRefs"], ["workType"], "Stable intellectual work identity."),
  PublicationVersion: contract("PublicationVersion", ["stableId", "revisionId", "revisionNumber", "title", "doi", "pmid", "authors", "journal", "year", "publicationType", "documentStatus", "validFrom", "validUntil", "supersedesRevisionId", "correctedByRevisionId", "retractedByRevisionId", "createdAt", "updatedAt", "sourceRefs"], ["url", "language", "volume", "issue", "pages"], "Versioned publication manifestation preserving null unknowns."),
});

export const scientificAssertionTypes = Object.freeze([
  "EntityObjectAssertion",
  "LiteralValueAssertion",
  "QuantitativeAssertion",
  "ApplicabilityAssertion",
  "CompatibilityAssertion",
  "RecommendationAssertion",
  "NegativeAssertion",
]);

export const assertionPolarities = Object.freeze(["POSITIVE", "NEGATIVE", "QUALIFIED", "UNKNOWN"]);

export const assertionReviewStates = Object.freeze([
  "DRAFT",
  "EXTRACTED",
  "SOURCE_LOCALIZED",
  "REVIEWED",
  "VERIFIED",
  "QUALIFIED",
  "CONTESTED",
  "SUPERSEDED",
  "RETRACTED",
  "REJECTED",
]);

export const reviewTypes = Object.freeze(["automatedStructuralReview", "automatedScientificReview", "scientificHumanReview"]);

export const extractionTypes = Object.freeze([
  "DIRECT_STATEMENT",
  "NUMERIC_RESULT",
  "METHOD_DESCRIPTION",
  "LIMITATION",
  "RECOMMENDATION_TEXT",
  "AUTHOR_INTERPRETATION",
  "DERIVED_INTERPRETATION",
]);

export const evidenceSourceTypes = Object.freeze([
  "INTERNAL_DOCUMENT",
  "MANUFACTURER_DOCUMENTATION",
  "TECHNICAL_STANDARD",
  "EXPERT_OPINION",
  "CASE_REPORT",
  "OBSERVATIONAL_STUDY",
  "PROSPECTIVE_STUDY",
  "MULTICENTER_STUDY",
  "RANDOMIZED_TRIAL",
  "SYSTEMATIC_REVIEW",
  "META_ANALYSIS",
  "CONSENSUS",
  "GUIDELINE",
]);

export const evidenceQualities = Object.freeze(["UNKNOWN", "VERY_LOW", "LOW", "MODERATE", "HIGH"]);
export const scientificMaturities = Object.freeze(["HYPOTHESIS", "EXPERIMENTAL", "PRELIMINARY", "VALIDATED", "ESTABLISHED", "DEPRECATED", "OBSOLETE"]);
export const documentStatuses = Object.freeze(["CURRENT", "SUPERSEDED", "CORRECTED", "RETRACTED", "WITHDRAWN", "UNKNOWN"]);

export const sourceTypes = Object.freeze([
  "INTERNAL_DOCUMENT",
  "REPOSITORY_PAGE",
  "SCIENTIFIC_PUBLICATION",
  "OFFICIAL_DOCUMENTATION",
  "TECHNICAL_STANDARD",
  "RECOMMENDATION",
  "CONSENSUS",
  "MANUFACTURER_DOCUMENTATION",
  "INTERNAL_VALIDATION",
  "DATASET",
  "COMPUTED_RESULT",
]);

export const sourceCompletenessProfiles = Object.freeze({
  INTERNAL_DOCUMENT: Object.freeze({ required: ["stableId", "revisionId", "title", "sourceType", "status"], oneOf: [["repositoryPath", "url"]] }),
  REPOSITORY_PAGE: Object.freeze({ required: ["stableId", "revisionId", "title", "sourceType", "repositoryPath", "status"], oneOf: [] }),
  SCIENTIFIC_PUBLICATION: Object.freeze({ required: ["stableId", "revisionId", "title", "sourceType", "status"], oneOf: [["doi", "pmid", "url", "repositoryPath"]] }),
  OFFICIAL_DOCUMENTATION: Object.freeze({ required: ["stableId", "revisionId", "title", "authority", "sourceType", "status"], oneOf: [["url", "repositoryPath"]] }),
  TECHNICAL_STANDARD: Object.freeze({ required: ["stableId", "revisionId", "title", "authority", "sourceType", "status"], oneOf: [["version", "publicationDate"]] }),
  RECOMMENDATION: Object.freeze({ required: ["stableId", "revisionId", "title", "authority", "sourceType", "status"], oneOf: [["url", "repositoryPath"]] }),
  CONSENSUS: Object.freeze({ required: ["stableId", "revisionId", "title", "authority", "sourceType", "status"], oneOf: [["url", "repositoryPath"]] }),
  MANUFACTURER_DOCUMENTATION: Object.freeze({ required: ["stableId", "revisionId", "title", "authority", "sourceType", "status"], oneOf: [["url", "repositoryPath"]] }),
  INTERNAL_VALIDATION: Object.freeze({ required: ["stableId", "revisionId", "title", "sourceType", "status", "repositoryPath"], oneOf: [] }),
  DATASET: Object.freeze({ required: ["stableId", "revisionId", "title", "sourceType", "status"], oneOf: [["url", "repositoryPath"]] }),
  COMPUTED_RESULT: Object.freeze({ required: ["stableId", "revisionId", "title", "sourceType", "status", "digest"], oneOf: [] }),
});

export const evidenceLinkTypes = Object.freeze(["SUPPORTS", "REFUTES", "QUALIFIES", "MENTIONS", "DERIVES", "CORRECTS", "RETRACTS", "UNRESOLVED_EVIDENCE_LINK"]);
export const reviewerStatuses = Object.freeze(["UNREVIEWED", "PENDING", "REVIEWED", "REJECTED"]);

export const evidenceLinkContract = contract("EvidenceLink", ["evidenceLinkId", "sourceRevisionId", "assertionRevisionId", "relationType", "locator", "extractedStatement", "applicability", "confidence", "evidenceSourceType", "evidenceQuality", "reviewerStatus", "createdAt"], ["reviewer", "limitations", "version", "analyticalSummary", "extraction", "reviewType", "reviewedAt", "sourceRefs"], "Versioned source stance on one assertion revision; unknown stance remains MENTIONS or UNRESOLVED_EVIDENCE_LINK.");

export const contextOperators = Object.freeze(["EXACT", "ANY_OF", "ALL_OF", "EXCLUDES", "RANGE", "CONDITION", "UNKNOWN", "NOT_APPLICABLE"]);
export const contextDimensionNames = Object.freeze([
  "population",
  "age",
  "sex",
  "species",
  "disease",
  "stage",
  "clinicalDomain",
  "modality",
  "manufacturer",
  "productFamily",
  "equipmentModel",
  "equipmentGeneration",
  "softwareVersion",
  "fieldStrength",
  "sequence",
  "sequenceFamily",
  "protocol",
  "contrastAgent",
  "dose",
  "measurementMethod",
  "workflow",
  "center",
  "study",
  "temporality",
]);

export const contextDimensionContract = contract("ContextDimension", ["dimension", "operator", "value", "values", "range", "condition", "unit", "unknownState"], ["sourceRefs"], "One typed applicability dimension supporting exact, set, exclusion, range, condition, unknown and not-applicable states.");
export const applicabilityContextContract = contract("ApplicabilityContext", ["contextId", "combination", "dimensions", "exclusions", "status", "version"], ["label", "sourceRefs"], "N-ary context preserving equipment, protocol, population and acquisition tuples.");

const quantitativeFields = ["quantity", "unit", "formula", "inputs", "method", "sequence", "protocol", "timing", "uncertainty", "precision", "repeatability", "reproducibility", "bias", "referenceRange", "threshold", "normalization", "qualityStatus", "sourceRefs"];
export const quantitativeContracts = Object.freeze(Object.fromEntries([
  "MeasurementDefinition",
  "MeasurementMethod",
  "Observation",
  "DerivedMeasurement",
  "ThresholdDefinition",
  "ReferenceRange",
].map((typeName) => [typeName, contract(typeName, ["stableId", "revisionId", "status", ...quantitativeFields], ["value", "population", "context", "validFrom", "validUntil"], `Versioned ${typeName} quantitative contract.`)])));

export const protocolContracts = Object.freeze({
  ProtocolConcept: contract("ProtocolConcept", ["stableId", "label", "sourceRefs"], ["modalityIds", "indicationIds", "methodSummary", "limitations", "status"], "Documentary protocol concept described by public-site sources; it is never executable."),
  ProtocolDescriptionRevision: contract("ProtocolDescriptionRevision", ["stableId", "revisionId", "revisionNumber", "summary", "context", "publishedParameters", "describedVariants", "sourceRefs", "status", "validFrom", "validUntil", "createdAt", "updatedAt"], ["supersedesRevisionId", "limitations", "multicenterDifferences"], "Versioned editorial-scientific description of published parameters and variants, without scheduling, fallback execution or PACS rules."),
});

export const equipmentContracts = Object.freeze({
  Manufacturer: contract("Manufacturer", ["stableId", "label", "sourceRefs"], ["legalName", "validFrom", "validUntil"], "Manufacturer concept."),
  ProductFamily: contract("ProductFamily", ["stableId", "manufacturerId", "label", "sourceRefs"], ["validFrom", "validUntil"], "Manufacturer product family."),
  EquipmentModel: contract("EquipmentModel", ["stableId", "label", "sourceRefs"], ["manufacturerId", "productFamilyId", "generationLabels", "fieldStrengthValues", "softwareVersionIds"], "Equipment model used only as a documentary comparison subject."),
  EquipmentGeneration: contract("EquipmentGeneration", ["stableId", "equipmentModelId", "label", "sourceRefs"], ["validFrom", "validUntil"], "Equipment generation."),
  SoftwarePlatform: contract("SoftwarePlatform", ["stableId", "manufacturerId", "label", "sourceRefs"], ["supportedModelIds"], "Software platform identity."),
  SoftwareVersion: contract("SoftwareVersion", ["stableId", "softwarePlatformId", "versionLabel", "sourceRefs", "status"], ["releaseDate", "build", "validFrom", "validUntil"], "Versioned software release."),
  CapabilityStatement: contract("CapabilityStatement", ["stableId", "subjectEntityId", "capabilityLabel", "context", "limitations", "sourceRefs"], ["softwareVersionId", "evidenceLinkIds", "status"], "Sourced documentary statement about a platform capability; never an application compatibility rule."),
});

export const designationTypes = Object.freeze(["PREFERRED", "SYNONYM", "ABBREVIATION", "MANUFACTURER_NAME", "FORMER_NAME", "TRANSLATION", "ACRONYM"]);
export const terminologyContracts = Object.freeze({
  ConceptDesignation: contract("ConceptDesignation", ["designationId", "entityId", "value", "language", "locale", "designationType", "preferred", "context", "sourceRef", "validFrom", "validUntil"], ["status"], "Contextual designation allowing multilingual homonyms and polysemous acronyms."),
  ExternalIdentifier: contract("ExternalIdentifier", ["externalIdentifierId", "entityId", "system", "code", "version", "sourceRef", "validFrom", "validUntil"], ["uri", "status"], "Optional sourced external terminology identifier."),
});
export const externalTerminologySystems = Object.freeze(["DICOM", "SNOMED_CT", "RADLEX", "LOINC", "MESH", "ICD", "OTHER"]);

export const workflowContracts = Object.freeze({
  WorkflowConcept: contract("WorkflowConcept", ["stableId", "label", "summary", "sourceRefs"], ["context", "limitations", "status"], "Documentary workflow concept for an explanatory page; no executable steps or transitions."),
  WorkflowDescriptionRevision: contract("WorkflowDescriptionRevision", ["stableId", "revisionId", "revisionNumber", "summary", "documentedSteps", "documentedRoles", "documentedMethods", "documentedQualityControls", "sourceRefs", "status", "validFrom", "validUntil", "createdAt", "updatedAt"], ["supersedesRevisionId", "limitations"], "Versioned narrative workflow description; steps and roles are documentary facts, never application state."),
  CoreLabConcept: contract("CoreLabConcept", ["stableId", "label", "summary", "sourceRefs"], ["studyIds", "modalityIds", "limitations", "status"], "Documentary Core Lab subject for public-site content; no assignments, roles or production state."),
  CoreLabDescriptionRevision: contract("CoreLabDescriptionRevision", ["stableId", "revisionId", "revisionNumber", "organizationSummary", "methodSummaries", "documentedControls", "sourceRefs", "status", "validFrom", "validUntil", "createdAt", "updatedAt"], ["supersedesRevisionId", "limitations"], "Documentary Core Lab organization and methods, without readings, assignments or adjudication state."),
});

export const researchContracts = Object.freeze({
  Study: contract("Study", ["stableId", "label", "sourceRefs"], ["summary", "publicationIds", "design", "publishedCohortDescriptions", "limitations", "status"], "Study and published cohort descriptions as documentary subjects for the public site."),
  Dataset: contract("Dataset", ["stableId", "label", "sourceRefs"], ["versionLabel", "summary", "publishedCohortDescriptions", "publicationIds", "limitations", "status"], "Dataset as a cited documentary subject, without internal governance or execution metadata."),
  Algorithm: contract("Algorithm", ["stableId", "label", "sourceRefs"], ["versionLabel", "taskSummary", "publishedMetricSummaries", "evaluationSummary", "publicationIds", "limitations", "status"], "Algorithm and published metrics as cited documentary subjects, not a deployed model."),
  RecommendationDocument: contract("RecommendationDocument", ["stableId", "text", "issuer", "population", "grade", "publicationDate", "sourceRefs"], ["status", "limitations"], "Sourced recommendation text for public explanation; never a clinical recommendation engine rule."),
});

export const standardContracts = Object.freeze(Object.fromEntries(Object.entries({
  Standard: [["stableId", "title", "authority", "sourceRefs"], ["status"]],
  StandardPart: [["stableId", "standardId", "partNumber", "title", "sourceRefs"], ["status"]],
  StandardEdition: [["stableId", "standardId", "edition", "publicationDate", "sourceRefs"], ["status"]],
  Profile: [["stableId", "standardId", "label", "sourceRefs"], ["version"]],
  SOPClass: [["stableId", "standardId", "uid", "label", "sourceRefs"], ["service", "informationObject"]],
  TransferSyntax: [["stableId", "standardId", "uid", "label", "sourceRefs"], ["encoding"]],
  ConformanceStatement: [["stableId", "subjectEntityId", "sourceRevisionId", "summary", "sourceRefs"], ["profileIds", "sopClassIds", "transferSyntaxIds", "status"]],
}).map(([typeName, [requiredFields, optionalFields]]) => [typeName, contract(typeName, requiredFields, optionalFields, `Versioned ${typeName} standards and conformance contract.`)])));

export const completenessUsages = Object.freeze(["CATALOG", "EDITORIAL", "SCIENTIFIC", "COMPARISON", "GLOSSARY", "NAVIGATION", "SEO", "KNOWLEDGE_STATE"]);
export const completenessStates = Object.freeze(["COMPLETE", "PARTIAL", "INSUFFICIENT", "NOT_APPLICABLE"]);
