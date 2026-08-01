import { SCIENTIFIC_ASSERTION_LAYER_VERSION } from "./assertion-schema.mjs";

// Model-only pass: no scientific fact, source stance or provenance record is migrated here.
export const scientificAssertions = Object.freeze([]);
export const scientificSources = Object.freeze([]);
export const assertionEvidence = Object.freeze([]);

export const assertionMigrationState = Object.freeze({
  status: "NOT_STARTED",
  sourceGraphVersion: "1.0.0",
  targetAssertionLayerVersion: SCIENTIFIC_ASSERTION_LAYER_VERSION,
  migratedAssertionCount: 0,
  migratedSourceCount: 0,
  migratedEvidenceCount: 0,
});
