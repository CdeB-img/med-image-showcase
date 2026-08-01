export const KNOWLEDGE_GRAPH_VERSION = "1.0.0";
export const KNOWLEDGE_GRAPH_NAMESPACE = "noxia:radiology";
export const KNOWLEDGE_GRAPH_UPDATED_AT = "2026-07-31T00:00:00.000Z";

export const entityFamilies = Object.freeze([
  "Modality",
  "Manufacturer",
  "Equipment",
  "EquipmentGeneration",
  "SoftwareVersion",
  "BodySystem",
  "Organ",
  "Region",
  "Disease",
  "ClinicalQuestion",
  "Protocol",
  "Sequence",
  "SequenceFamily",
  "Biomarker",
  "Measurement",
  "Workflow",
  "Viewer",
  "Pipeline",
  "Publication",
  "Guideline",
  "Recommendation",
  "CoreLab",
  "Study",
  "ResearchProject",
  "Dataset",
  "Format",
  "Standard",
  "Terminology",
  "Definition",
  "Synonym",
  "Abbreviation",
  "Tool",
  "Service",
  "Feature",
]);

export const evidenceStatuses = Object.freeze([
  "UNKNOWN",
  "HYPOTHESIS",
  "EXPERIMENTAL",
  "PRELIMINARY",
  "VALIDATED",
  "MULTICENTRIC",
  "GUIDELINE",
  "STANDARD",
  "DEPRECATED",
  "OBSOLETE",
]);

export const entityStatuses = Object.freeze([
  "active",
  "unresolved_reference",
  "deprecated",
  "obsolete",
]);

export const visibilities = Object.freeze(["internal", "restricted", "public-candidate"]);

export const relationDefinitions = Object.freeze({
  IS_A: { cardinality: "BY_FAMILY_PAIR", acyclic: true, description: "Taxonomic specialization with family-pair cardinality." },
  PART_OF: { cardinality: "BY_FAMILY_PAIR", acyclic: true, description: "Compositional containment with family-pair cardinality." },
  APPLIES_TO: { cardinality: "N:N", acyclic: false, description: "Clinical, anatomical or modality applicability." },
  MEASURES: { cardinality: "N:N", acyclic: false, description: "A method, sequence or pipeline measures a biomarker." },
  USES: { cardinality: "N:N", acyclic: false, description: "Operational dependency." },
  SUPPORTS: { cardinality: "N:N", acyclic: false, description: "Enables an operational workflow or concept." },
  PRODUCES: { cardinality: "N:N", acyclic: false, description: "Produces a measurement, dataset or output concept." },
  DOCUMENTS: { cardinality: "N:N", acyclic: false, description: "Documents a concept without asserting evidence beyond its source." },
  IMPLEMENTED_BY: { cardinality: "N:N", acyclic: false, description: "Maps a workflow or service to its implementation." },
  HAS_FEATURE: { cardinality: "N:N", acyclic: false, description: "Declared product or equipment capability." },
  HAS_VERSION: { cardinality: "N:N", acyclic: false, description: "Declared version membership." },
  REQUIRES: { cardinality: "N:N", acyclic: false, description: "Explicit prerequisite." },
  COMPATIBLE_WITH: { cardinality: "N:N", acyclic: false, description: "Declared compatibility." },
  INCOMPATIBLE_WITH: { cardinality: "N:N", acyclic: false, description: "Declared incompatibility." },
  DERIVED_FROM: { cardinality: "N:N", acyclic: true, description: "Data or measurement derivation." },
  SUPERSEDES: { cardinality: "N:N", acyclic: true, description: "Version succession." },
  REFERENCES: { cardinality: "N:N", acyclic: false, description: "Bibliographic or source reference." },
  RELATED_TO: { cardinality: "N:N", acyclic: false, description: "Explicit non-hierarchical association." },
});

export const relationTypes = Object.freeze(Object.keys(relationDefinitions));

export const acyclicRelationTypes = Object.freeze(
  relationTypes.filter((relationType) => relationDefinitions[relationType].acyclic),
);

export const registryNames = Object.freeze([
  "knowledge-graph",
  "entities",
  "relations",
  "taxonomy",
  "publications",
  "protocols",
  "biomarkers",
  "equipment",
  "manufacturers",
  "pathologies",
  "modalities",
  "workflows",
  "standards",
  "sources",
  "evidence",
  "synonyms",
  "constraints",
  "scientific-assertions",
  "assertion-types",
  "predicates",
  "contexts",
  "provenance",
  "assertion-status",
  "evidence-model",
]);

export const entityFamilyDefinitions = Object.freeze(
  Object.fromEntries(entityFamilies.map((family) => [family, {
    family,
    identityPrefix: `${KNOWLEDGE_GRAPH_NAMESPACE}:${family.toLowerCase()}:`,
    requiredFields: [
      "entityId",
      "namespace",
      "preferredLabel",
      "aliases",
      "description",
      "status",
      "version",
      "visibility",
      "sourceRefs",
      "evidenceStatus",
      "createdFrom",
      "updatedAt",
    ],
  }])),
);
