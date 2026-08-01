import { KNOWLEDGE_GRAPH_NAMESPACE } from "./schema.mjs";

export const SCIENTIFIC_ASSERTION_LAYER_VERSION = "1.0.0";
export const SCIENTIFIC_ASSERTION_NAMESPACE = `${KNOWLEDGE_GRAPH_NAMESPACE}:assertion`;

export const scientificAssertionStatuses = Object.freeze([
  "DRAFT",
  "ACTIVE",
  "CONTESTED",
  "SUPERSEDED",
  "OBSOLETE",
  "RETRACTED",
]);

export const evidenceLevels = Object.freeze([
  "UNASSESSED",
  "VERY_LOW",
  "LOW",
  "MODERATE",
  "HIGH",
]);

export const confidenceLevels = Object.freeze([
  "UNASSESSED",
  "VERY_LOW",
  "LOW",
  "MODERATE",
  "HIGH",
  "VERY_HIGH",
]);

export const evidenceStances = Object.freeze([
  "SUPPORTS",
  "REFUTES",
  "QUALIFIES",
  "NEUTRAL",
]);

export const scientificSourceTypes = Object.freeze([
  "PrimarySource",
  "SecondarySource",
  "Guideline",
  "Consensus",
  "InternalValidation",
  "ManufacturerDocumentation",
]);

export const scientificSourceStatuses = Object.freeze([
  "ACTIVE",
  "SUPERSEDED",
  "OBSOLETE",
  "RETRACTED",
]);

export const assertionContextCombinationModes = Object.freeze(["ALL_OF", "ANY_OF"]);

export const assertionContextVariantFields = Object.freeze([
  "contextId",
  "population",
  "clinicalContext",
  "technicalContext",
  "workflowContext",
  "equipmentContext",
  "softwareContext",
  "sequenceContext",
  "fieldStrength",
  "contrastAgent",
  "measurementMethod",
]);

const predicate = (predicateId, description, {
  category = "scientific",
  acyclic = false,
  symmetric = false,
  cycleGroup = null,
  oppositePredicate = null,
} = {}) => Object.freeze({
  predicate: predicateId,
  description,
  category,
  acyclic,
  symmetric,
  cycleGroup,
  oppositePredicate,
  version: SCIENTIFIC_ASSERTION_LAYER_VERSION,
});

export const assertionPredicateDefinitions = Object.freeze({
  SUPPORTS: predicate("SUPPORTS", "The subject provides support for the object assertion or concept.", { category: "epistemic", oppositePredicate: "REFUTES" }),
  REFUTES: predicate("REFUTES", "The subject provides evidence against the object assertion or concept.", { category: "epistemic", oppositePredicate: "SUPPORTS" }),
  SUGGESTS: predicate("SUGGESTS", "The subject suggests the object without establishing it.", { category: "epistemic" }),
  ASSOCIATED_WITH: predicate("ASSOCIATED_WITH", "The subject is associated with the object in the declared context.", { symmetric: true }),
  MEASURED_BY: predicate("MEASURED_BY", "The subject is measured by the object method, sequence or process."),
  DERIVED_FROM: predicate("DERIVED_FROM", "The subject is derived from the object.", { acyclic: true, cycleGroup: "dependency" }),
  PREDICTS: predicate("PREDICTS", "The subject predicts the object in the declared population and context."),
  REQUIRES: predicate("REQUIRES", "The subject requires the object.", { acyclic: true, cycleGroup: "dependency" }),
  DEPENDS_ON: predicate("DEPENDS_ON", "The subject depends on the object.", { acyclic: true, cycleGroup: "dependency" }),
  CONTRAINDICATED_FOR: predicate("CONTRAINDICATED_FOR", "The subject is contraindicated for the object context."),
  LIMITED_BY: predicate("LIMITED_BY", "The subject is limited by the object."),
  AFFECTED_BY: predicate("AFFECTED_BY", "The subject is affected by the object."),
  NORMALIZED_BY: predicate("NORMALIZED_BY", "The subject is normalized by the object.", { acyclic: true, cycleGroup: "dependency" }),
  QUANTIFIED_BY: predicate("QUANTIFIED_BY", "The subject is quantified by the object.", { acyclic: true, cycleGroup: "dependency" }),
  INTERPRETED_AS: predicate("INTERPRETED_AS", "The subject is interpreted as the object in the declared context."),
  RELATED_TO: predicate("RELATED_TO", "The subject is explicitly related to the object without stronger semantics.", { symmetric: true }),
  INCREASES: predicate("INCREASES", "The subject increases the object in the declared context.", { oppositePredicate: "DECREASES" }),
  DECREASES: predicate("DECREASES", "The subject decreases the object in the declared context.", { oppositePredicate: "INCREASES" }),
  VALID_FOR: predicate("VALID_FOR", "The subject is valid for the object context.", { oppositePredicate: "NOT_VALID_FOR" }),
  NOT_VALID_FOR: predicate("NOT_VALID_FOR", "The subject is not valid for the object context.", { oppositePredicate: "VALID_FOR" }),
  SUPERSEDES: predicate("SUPERSEDES", "The subject supersedes the object version.", { acyclic: true, cycleGroup: "version" }),
  EQUIVALENT_TO: predicate("EQUIVALENT_TO", "The subject is equivalent to the object in the declared context.", { symmetric: true }),
});

export const assertionPredicates = Object.freeze(Object.keys(assertionPredicateDefinitions));

const contextDefinition = (contextType, requiredFields, description, arrayFields = []) => Object.freeze({
  contextType,
  requiredFields: Object.freeze(requiredFields),
  arrayFields: Object.freeze(arrayFields),
  description,
  optional: true,
  version: SCIENTIFIC_ASSERTION_LAYER_VERSION,
});

export const assertionContextDefinitions = Object.freeze({
  context: contextDefinition("context", ["scope", "includeEntityIds", "excludeEntityIds", "tags", "combination", "variants"], "Generic scope, explicit inclusions or exclusions, and optional context alternatives.", ["includeEntityIds", "excludeEntityIds", "tags", "variants"]),
  population: contextDefinition("population", ["label", "entityIds", "inclusionCriteria", "exclusionCriteria"], "Population definition without asserting a clinical recommendation.", ["entityIds", "inclusionCriteria", "exclusionCriteria"]),
  clinicalContext: contextDefinition("clinicalContext", ["diseaseIds", "clinicalQuestionIds", "indicationIds", "contraindicationIds"], "Clinical applicability dimensions.", ["diseaseIds", "clinicalQuestionIds", "indicationIds", "contraindicationIds"]),
  technicalContext: contextDefinition("technicalContext", ["modalityIds", "formatIds", "standardIds", "acquisitionParameterIds"], "Technical acquisition and interoperability dimensions.", ["modalityIds", "formatIds", "standardIds", "acquisitionParameterIds"]),
  workflowContext: contextDefinition("workflowContext", ["workflowIds", "centerIds", "protocolIds", "stageIds"], "Operational workflow, centre and protocol dimensions.", ["workflowIds", "centerIds", "protocolIds", "stageIds"]),
  equipmentContext: contextDefinition("equipmentContext", ["manufacturerIds", "equipmentIds", "equipmentGenerationIds", "optionIds"], "Manufacturer, equipment, generation and option dimensions.", ["manufacturerIds", "equipmentIds", "equipmentGenerationIds", "optionIds"]),
  softwareContext: contextDefinition("softwareContext", ["softwareVersionIds", "buildIds", "optionIds", "licenseIds"], "Software release, option and licence dimensions.", ["softwareVersionIds", "buildIds", "optionIds", "licenseIds"]),
  sequenceContext: contextDefinition("sequenceContext", ["sequenceIds", "sequenceFamilyIds", "implementationIds", "parameterSetIds"], "Sequence family, implementation and parameter-set dimensions.", ["sequenceIds", "sequenceFamilyIds", "implementationIds", "parameterSetIds"]),
  fieldStrength: contextDefinition("fieldStrength", ["value", "unit"], "Magnetic field strength expressed in tesla."),
  contrastAgent: contextDefinition("contrastAgent", ["entityId", "label", "dose", "unit", "timing"], "Optional contrast-agent administration context."),
  measurementMethod: contextDefinition("measurementMethod", ["entityId", "label", "version", "unit"], "Optional measurement method and version context."),
});

export const contextReferenceRules = Object.freeze([
  { contextField: "clinicalContext", property: "diseaseIds", allowedFamilies: ["Disease"] },
  { contextField: "clinicalContext", property: "clinicalQuestionIds", allowedFamilies: ["ClinicalQuestion"] },
  { contextField: "technicalContext", property: "modalityIds", allowedFamilies: ["Modality"] },
  { contextField: "technicalContext", property: "formatIds", allowedFamilies: ["Format"] },
  { contextField: "technicalContext", property: "standardIds", allowedFamilies: ["Standard"] },
  { contextField: "workflowContext", property: "workflowIds", allowedFamilies: ["Workflow", "Pipeline", "CoreLab"] },
  { contextField: "workflowContext", property: "protocolIds", allowedFamilies: ["Protocol"] },
  { contextField: "equipmentContext", property: "manufacturerIds", allowedFamilies: ["Manufacturer"] },
  { contextField: "equipmentContext", property: "equipmentIds", allowedFamilies: ["Equipment"] },
  { contextField: "equipmentContext", property: "equipmentGenerationIds", allowedFamilies: ["EquipmentGeneration"] },
  { contextField: "softwareContext", property: "softwareVersionIds", allowedFamilies: ["SoftwareVersion"] },
  { contextField: "sequenceContext", property: "sequenceIds", allowedFamilies: ["Sequence"] },
  { contextField: "sequenceContext", property: "sequenceFamilyIds", allowedFamilies: ["SequenceFamily"] },
]);

export const scientificAssertionRequiredFields = Object.freeze([
  "assertionId",
  "subjectEntityId",
  "predicate",
  "objectEntityId",
  "statement",
  "context",
  "population",
  "clinicalContext",
  "technicalContext",
  "workflowContext",
  "equipmentContext",
  "softwareContext",
  "sequenceContext",
  "fieldStrength",
  "contrastAgent",
  "measurementMethod",
  "limitations",
  "confidence",
  "evidenceLevel",
  "sourceIds",
  "publicationIds",
  "validFrom",
  "validUntil",
  "status",
  "version",
  "reviewer",
  "createdAt",
  "updatedAt",
]);

export const assertionEvidenceRequiredFields = Object.freeze([
  "evidenceId",
  "assertionId",
  "sourceId",
  "publicationId",
  "stance",
  "evidenceLevel",
  "confidence",
  "context",
  "limitations",
  "status",
  "version",
  "reviewer",
  "createdAt",
  "updatedAt",
]);

export const scientificSourceRequiredFields = Object.freeze([
  "sourceId",
  "sourceType",
  "title",
  "version",
  "status",
  "publicationEntityId",
  "uri",
  "validFrom",
  "validUntil",
  "createdAt",
  "updatedAt",
]);

export const assertionSynthesisFields = Object.freeze([
  "assertionId",
  "stateOfKnowledge",
  "controversies",
  "consensus",
  "weakPoints",
  "openQuestions",
  "history",
  "confidence",
  "version",
  "updatedAt",
]);

export const assertionTypeDefinitions = Object.freeze({
  ScientificAssertion: Object.freeze({
    typeName: "ScientificAssertion",
    role: "versioned-scientific-fact",
    requiredFields: scientificAssertionRequiredFields,
    nullableContextFields: Object.freeze(["context", "population", "clinicalContext", "technicalContext", "workflowContext", "equipmentContext", "softwareContext", "sequenceContext", "fieldStrength", "contrastAgent", "measurementMethod"]),
    listFields: Object.freeze(["limitations", "sourceIds", "publicationIds"]),
    version: SCIENTIFIC_ASSERTION_LAYER_VERSION,
  }),
  AssertionEvidence: Object.freeze({
    typeName: "AssertionEvidence",
    role: "versioned-source-stance-on-assertion",
    requiredFields: assertionEvidenceRequiredFields,
    version: SCIENTIFIC_ASSERTION_LAYER_VERSION,
  }),
  ScientificSource: Object.freeze({
    typeName: "ScientificSource",
    role: "versioned-provenance-record",
    requiredFields: scientificSourceRequiredFields,
    version: SCIENTIFIC_ASSERTION_LAYER_VERSION,
  }),
  AssertionSynthesis: Object.freeze({
    typeName: "AssertionSynthesis",
    role: "structured-narrative-free-synthesis",
    requiredFields: assertionSynthesisFields,
    version: SCIENTIFIC_ASSERTION_LAYER_VERSION,
  }),
  AssertionContext: Object.freeze({
    typeName: "AssertionContext",
    role: "optional-common-context-with-explicit-alternatives",
    requiredFields: assertionContextDefinitions.context.requiredFields,
    variantFields: assertionContextVariantFields,
    combinationModes: assertionContextCombinationModes,
    version: SCIENTIFIC_ASSERTION_LAYER_VERSION,
  }),
});

export const scientificRegistryNames = Object.freeze([
  "scientific-assertions",
  "assertion-types",
  "predicates",
  "contexts",
  "provenance",
  "assertion-status",
  "evidence-model",
]);

export const legacyScientificRelationTypes = Object.freeze([
  "APPLIES_TO",
  "MEASURES",
  "DOCUMENTS",
  "DERIVED_FROM",
  "REFERENCES",
]);
