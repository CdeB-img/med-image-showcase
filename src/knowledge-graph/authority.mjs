import { KNOWLEDGE_GRAPH_NAMESPACE, KNOWLEDGE_GRAPH_VERSION } from "./schema.mjs";

export const knowledgeGraphAuthority = Object.freeze({
  graphId: `${KNOWLEDGE_GRAPH_NAMESPACE}:graph:canonical-radiology`,
  version: KNOWLEDGE_GRAPH_VERSION,
  canonicalSourceOfTruth: true,
  entityRole: "stable-concept",
  scientificFactCarrier: "ScientificAssertion",
  publicationRole: "versioned-evidence-source-for-assertions",
  assertionMigrationPerformed: false,
  scope: [
    "radiology-domain-facts",
    "clinical-and-technical-concepts",
    "workflows-and-pipelines",
    "viewers-and-tools",
    "references-and-evidence-statuses",
    "versioned-scientific-assertions",
    "contextual-evidence-and-contradictions",
  ],
  excludedFromThisVersion: [
    "editorial-rendering",
    "web-page-generation",
    "publication-workflows",
    "network-or-external-data-fetching",
  ],
  bootstrapPolicy: "Existing repository files are provenance records only; future knowledge additions are made in this graph and validated before downstream use.",
  assertionPolicy: "New scientific facts are represented as ScientificAssertion records. Existing entity relations remain legacy migration inputs until a separately reviewed migration pass.",
});
