export const KNOWLEDGE_CATALOG_ID = "noxia:scientific-knowledge-catalog";
export const KNOWLEDGE_CATALOG_VERSION = "1.0.0";
export const ENRICHED_KNOWLEDGE_CATALOG_VERSION = "1.1.0";
export const TERRITORIAL_KNOWLEDGE_CATALOG_VERSION = "1.2.0";
export const CONTINUOUS_TERRITORIAL_KNOWLEDGE_CATALOG_VERSION = "1.3.0";
export const KNOWLEDGE_CATALOG_GENERATED_AT = "2026-08-01T00:00:00.000Z";
export const KNOWLEDGE_CATALOG_NAMESPACE = "noxia:knowledge-catalog";

export const KNOWLEDGE_NODE_STATUSES = Object.freeze([
  "NOT_STARTED",
  "DISCOVERING",
  "SOURCING",
  "MODELING",
  "ASSERTIONS",
  "UNDER_REVIEW",
  "READY",
  "PROJECTED",
  "PUBLISHED",
  "DEPRECATED",
  "OBSOLETE",
]);

export const READY_LIKE_STATUSES = Object.freeze(["READY", "PROJECTED", "PUBLISHED"]);
export const TERMINAL_STATUSES = Object.freeze(["DEPRECATED", "OBSOLETE"]);

export const KNOWLEDGE_NODE_TYPES = Object.freeze([
  "Abbreviation",
  "AcquisitionCondition",
  "AcquisitionInput",
  "AcquisitionMethod",
  "AcquisitionParameter",
  "Biomarker",
  "BodySystem",
  "ClinicalApplication",
  "ClinicalQuestion",
  "Confounder",
  "ContrastAgentClass",
  "CoreLab",
  "Dataset",
  "Definition",
  "DerivedMeasurement",
  "Disease",
  "Domain",
  "Endpoint",
  "Equipment",
  "EquipmentGeneration",
  "Feature",
  "Finding",
  "Format",
  "Guideline",
  "Limitation",
  "Manufacturer",
  "Measurement",
  "MeasurementDefinition",
  "MeasurementMethod",
  "Modality",
  "ModelComponent",
  "ModelInput",
  "Observation",
  "Organ",
  "ParametricMap",
  "PhysicalPhenomenon",
  "Pipeline",
  "Protocol",
  "ProtocolConcept",
  "Publication",
  "PublicationTopic",
  "QualityAttribute",
  "QualityControlObject",
  "QualityMethod",
  "QualityMetric",
  "Recommendation",
  "ReconstructionMethod",
  "ReconstructionOutput",
  "Region",
  "ResearchArea",
  "ResearchProject",
  "Sequence",
  "SequenceFamily",
  "Service",
  "Software",
  "SoftwareMethod",
  "SoftwareVersion",
  "Standard",
  "Study",
  "Synonym",
  "TechnicalContext",
  "Technology",
  "TechnologyImplementation",
  "Terminology",
  "Tool",
  "Viewer",
  "Workflow",
  "WorkflowConcept",
]);

export const PROJECTION_CAPABILITIES = Object.freeze([
  "Glossary",
  "Guide",
  "FAQ",
  "Comparison",
  "StateOfKnowledge",
  "ScientificSummary",
  "Tutorial",
  "Reference",
  "CaseStudy",
  "DecisionTree",
  "ProtocolDocumentation",
  "ViewerOverlay",
  "Documentation",
  "API",
]);

export const NON_PAGE_PROJECTION_CAPABILITIES = Object.freeze(["ViewerOverlay", "API"]);
export const PRIORITY_LEVELS = Object.freeze(["LOW", "MEDIUM", "HIGH"]);
export const COVERAGE_LEVELS = Object.freeze(["NONE", "LOW", "PARTIAL", "HIGH", "COMPLETE"]);

export const KNOWLEDGE_NODE_REQUIRED_FIELDS = Object.freeze([
  "nodeId",
  "nodeType",
  "preferredLabel",
  "aliases",
  "description",
  "parents",
  "children",
  "related",
  "priority",
  "status",
  "coverage",
  "scientificCoverage",
  "editorialCoverage",
  "projectionCoverage",
  "sourceCoverage",
  "assertionCoverage",
  "readiness",
  "projectionCapabilities",
  "lastReview",
  "nextReview",
  "version",
  "createdAt",
  "updatedAt",
]);

export const KNOWLEDGE_NODE_DEPENDENCY_FIELDS = Object.freeze([
  "prerequisites",
  "dependencies",
  "relatedDomains",
  "successors",
  "replacements",
  "supersededBy",
  "blockingNodes",
]);

export const P6_KNOWLEDGE_CATALOG_SCOPE = Object.freeze({
  kind: "REPOSITORY_OBSERVED_AND_EXPLICITLY_PLANNED",
  exhaustiveWithin: Object.freeze([
    "P3M_WEB_HISTORICAL_IDENTITIES",
    "P4R_ECV_T1_CONCEPTS",
    "P5_MULTIDOMAIN_CONCEPTS",
    "P5_ENRICHED_DOMAIN_MANIFESTS",
    "P5_EXPLICIT_NEXT_SCIENTIFIC_WAVES",
  ]),
  excludes: Object.freeze([
    "UNOBSERVED_UNIVERSAL_RADIOLOGY_TAXONOMY",
    "NEW_SCIENTIFIC_KNOWLEDGE",
    "PUBLIC_EDITORIAL_CONTENT",
    "EXECUTABLE_PRODUCT_WORKFLOWS",
  ]),
});

export const KNOWLEDGE_CATALOG_SCOPE = Object.freeze({
  kind: "REPOSITORY_OBSERVED_PLANNED_AND_CATALOG_EXECUTED",
  exhaustiveWithin: Object.freeze([
    ...P6_KNOWLEDGE_CATALOG_SCOPE.exhaustiveWithin,
    "P7_FIRST_AUTOMATIC_SCIENTIFIC_CAMPAIGN",
  ]),
  excludes: Object.freeze([
    "UNOBSERVED_UNIVERSAL_RADIOLOGY_TAXONOMY",
    "UNEXECUTED_SCIENTIFIC_KNOWLEDGE",
    "PUBLIC_EDITORIAL_CONTENT",
    "EXECUTABLE_PRODUCT_WORKFLOWS",
  ]),
});

export const TERRITORIAL_KNOWLEDGE_CATALOG_SCOPE = Object.freeze({
  kind: "REPOSITORY_OBSERVED_PLANNED_AND_TERRITORY_EXECUTED",
  exhaustiveWithin: Object.freeze([
    ...KNOWLEDGE_CATALOG_SCOPE.exhaustiveWithin,
    "P10_FIRST_TERRITORIAL_SCIENTIFIC_CAMPAIGN",
  ]),
  excludes: Object.freeze([
    "UNEXECUTED_TERRITORY_BRANCHES",
    "UNVALIDATED_PREPARED_SCIENTIFIC_OBJECTS",
    "PUBLIC_EDITORIAL_CONTENT",
    "EXECUTABLE_PRODUCT_WORKFLOWS",
  ]),
});

export const CONTINUOUS_TERRITORIAL_KNOWLEDGE_CATALOG_SCOPE = Object.freeze({
  kind: "REPOSITORY_OBSERVED_PLANNED_AND_CONTINUOUS_TERRITORY_EXECUTED",
  exhaustiveWithin: Object.freeze([
    ...TERRITORIAL_KNOWLEDGE_CATALOG_SCOPE.exhaustiveWithin,
    "P11_SEQUENTIAL_TERRITORIAL_SCIENTIFIC_CAMPAIGNS",
  ]),
  excludes: Object.freeze([
    "UNEXECUTED_TERRITORY_BRANCHES",
    "UNVALIDATED_PREPARED_SCIENTIFIC_OBJECTS",
    "PUBLIC_EDITORIAL_CONTENT",
    "EXECUTABLE_PRODUCT_WORKFLOWS",
  ]),
});
