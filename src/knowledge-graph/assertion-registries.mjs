import {
  assertionEvidence,
  assertionMigrationState,
  scientificAssertions,
  scientificSources,
} from "./assertion-catalog.mjs";
import {
  SCIENTIFIC_ASSERTION_LAYER_VERSION,
  assertionContextDefinitions,
  assertionPredicateDefinitions,
  assertionTypeDefinitions,
  confidenceLevels,
  evidenceLevels,
  evidenceStances,
  scientificAssertionStatuses,
  scientificSourceStatuses,
  scientificSourceTypes,
} from "./assertion-schema.mjs";
import { synthesizeScientificAssertionRegistry } from "./assertion-synthesis.mjs";

const registry = (registryId, entries, entryCount) => Object.freeze({
  registryId,
  version: SCIENTIFIC_ASSERTION_LAYER_VERSION,
  updatedAt: "2026-07-31T00:00:00.000Z",
  source: "scientific-assertion-model",
  entryCount,
  entries,
});

export const assertionRegistryContract = Object.freeze({
  typeName: "ScientificAssertion",
  entityRole: "stable-concept",
  assertionRole: "versioned-scientific-fact",
  publicationRole: "versioned-evidence-source",
  directPublicationToConceptFactsAllowed: false,
  contradictionsAllowed: true,
  textGenerationAllowed: false,
  migrationState: assertionMigrationState,
  version: SCIENTIFIC_ASSERTION_LAYER_VERSION,
});

export const scientificAssertionSyntheses = synthesizeScientificAssertionRegistry({
  assertions: scientificAssertions,
  evidenceLinks: assertionEvidence,
  sources: scientificSources,
  updatedAt: "2026-07-31T00:00:00.000Z",
});

export const scientificRegistries = Object.freeze({
  "scientific-assertions": registry("scientific-assertions", Object.freeze({
    contract: assertionRegistryContract,
    assertions: scientificAssertions,
    syntheses: scientificAssertionSyntheses,
  }), scientificAssertions.length),
  "assertion-types": registry("assertion-types", Object.values(assertionTypeDefinitions), Object.keys(assertionTypeDefinitions).length),
  predicates: registry("predicates", Object.values(assertionPredicateDefinitions), Object.keys(assertionPredicateDefinitions).length),
  contexts: registry("contexts", Object.values(assertionContextDefinitions), Object.keys(assertionContextDefinitions).length),
  provenance: registry("provenance", Object.freeze({
    sourceTypes: scientificSourceTypes,
    sourceStatuses: scientificSourceStatuses,
    sources: scientificSources,
    evidenceLinks: assertionEvidence,
  }), scientificSources.length + assertionEvidence.length),
  "assertion-status": registry("assertion-status", scientificAssertionStatuses.map((status) => Object.freeze({ status })), scientificAssertionStatuses.length),
  "evidence-model": registry("evidence-model", Object.freeze({
    evidenceLevels,
    confidenceLevels,
    evidenceStances,
    evidenceLinks: assertionEvidence,
  }), evidenceLevels.length + confidenceLevels.length + evidenceStances.length),
});
