export const SCIENTIFIC_TERRITORY_MODEL_ID = "noxia:scientific-territory-model";
export const SCIENTIFIC_TERRITORY_MODEL_VERSION = "1.0.0";
export const SCIENTIFIC_TERRITORY_GENERATED_AT = "2026-08-01T00:00:00.000Z";
export const SCIENTIFIC_TERRITORY_NAMESPACE = "noxia:scientific-territory";

export const TERRITORY_LEVELS = Object.freeze([
  Object.freeze({ id: "TERRITORY", rank: 0, role: "Axe majeur et stable du champ scientifique couvert par Noxia." }),
  Object.freeze({ id: "DOMAIN", rank: 1, role: "Famille cohérente de pratiques, technologies ou problèmes scientifiques." }),
  Object.freeze({ id: "SUBDOMAIN", rank: 2, role: "Subdivision autonome utilisable pour organiser une campagne ou une projection." }),
  Object.freeze({ id: "KNOWLEDGE_AREA", rank: 3, role: "Périmètre scientifique délimité dans lequel le catalogue peut créer des KnowledgeNodes." }),
  Object.freeze({ id: "SCIENTIFIC_CONCEPT", rank: 4, role: "Concept scientifique stable enregistré dans le Scientific Knowledge Catalog." }),
  Object.freeze({ id: "SPECIALIZED_CONCEPT", rank: 5, role: "Concept contextualisé par une modalité, une population, une méthode ou une application." }),
  Object.freeze({ id: "ATOMIC_CONCEPT", rank: 6, role: "Unité minimale utile aux assertions, mesures, preuves ou comparaisons." }),
]);

export const TERRITORY_COVERAGE_STATES = Object.freeze([
  "COVERED",
  "PARTIALLY_COVERED",
  "NOT_COVERED",
  "PLANNED",
  "OUT_OF_SCOPE",
]);

export const TERRITORY_TARGETS = Object.freeze(["CORE", "SELECTIVE", "REFERENCE", "FUTURE", "OUT_OF_SCOPE"]);
export const TERRITORY_PRIORITIES = Object.freeze(["FOUNDATION", "PRIMARY", "SECONDARY", "FUTURE"]);
export const TERRITORY_RELATION_TYPES = Object.freeze(["PARENT_OF", "ALSO_BELONGS_TO", "CROSSES", "REQUIRES"]);

export const TERRITORY_PROJECTION_TYPES = Object.freeze([
  "Glossary",
  "Guide",
  "FAQ",
  "StateOfKnowledge",
  "Comparison",
  "Tutorial",
  "Reference",
  "Documentation",
  "CaseStudy",
  "DecisionTree",
  "DocumentaryWorkflow",
  "Comparator",
  "API",
  "AIAssistant",
]);

export const TERRITORY_CONTRACTS = Object.freeze({
  responsibility: "DEFINE_INTENDED_SCIENTIFIC_SCOPE_ONLY",
  catalogResponsibility: "MEASURE_AND_PLAN_ACTUAL_COVERAGE_ONLY",
  explicitEnumerationThrough: "KNOWLEDGE_AREA",
  lowerLevels: "OPEN_ENUMERATION_BY_SCIENTIFIC_KNOWLEDGE_CATALOG",
  multipleParentsAllowed: true,
  territoryDoesNotStoreScientificKnowledge: true,
  territoryDoesNotSelectCampaigns: true,
  territoryConstrainsCatalogCandidates: true,
  catalogRemainsCoverageSourceOfTruth: true,
  scientificKnowledgeGraphMutated: false,
  scientificAssertionsCreated: 0,
  evidenceLinksCreated: 0,
  campaignsExecuted: 0,
  publicPagesCreated: 0,
  routesCreated: 0,
  seoArtifactsCreated: 0,
  publicationAuthorized: false,
});

export const TERRITORY_PROJECTION_POLICY = Object.freeze({
  virtualOnly: true,
  createsPublicContent: false,
  automaticPublicationAllowed: false,
  conditionalTypes: Object.freeze(["CaseStudy", "DecisionTree", "AIAssistant"]),
  conditions: Object.freeze({
    CaseStudy: "De-identification, rights and editorial review are required.",
    DecisionTree: "Documentary navigation only; no automated clinical recommendation.",
    AIAssistant: "Future interface only; requires separate product, safety and publication governance.",
  }),
});
