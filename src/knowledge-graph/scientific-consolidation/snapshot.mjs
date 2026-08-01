import { assertionReviewDecisions, scientificAssertionIdentities, scientificAssertionRevisions, scientificEvidenceLinks } from "../scientific-corpus/assertions.mjs";
import { scientificCorpusConceptDesignations, scientificCorpusConceptIdentities, scientificCorpusEntityRevisions, ontologicalRequalificationDecisions } from "../scientific-corpus/concepts.mjs";
import { scientificApplicabilityContexts } from "../scientific-corpus/contexts.mjs";
import { quantitativeModelRecords } from "../scientific-corpus/measurements.mjs";
import { internalScientificProjections, projectionReadiness } from "../scientific-corpus/projections.mjs";
import { conceptReadiness, readinessRules, readinessSummary, synthesisReadiness } from "../scientific-corpus/readiness.mjs";
import { scientificSourceIdentities, scientificSourceRevisions } from "../scientific-corpus/sources.mjs";
import { scientificSyntheses } from "../scientific-corpus/synthesis.mjs";
import { validateScientificCorpus } from "../scientific-corpus/validate.mjs";
import { sha256Digest } from "../migration/stable-json.mjs";

const snapshotMaterial = Object.freeze({
  snapshotType: "P4_SCIENTIFIC_CORPUS_BASELINE",
  snapshotVersion: "1.0.0-ecv-t1-pilot",
  concepts: scientificCorpusConceptIdentities,
  entityRevisions: scientificCorpusEntityRevisions,
  designations: scientificCorpusConceptDesignations,
  sourceIdentities: scientificSourceIdentities,
  sourceRevisions: scientificSourceRevisions,
  assertionIdentities: scientificAssertionIdentities,
  assertionRevisions: scientificAssertionRevisions,
  evidenceLinks: scientificEvidenceLinks,
  extractions: scientificEvidenceLinks.map((link) => link.extraction),
  contexts: scientificApplicabilityContexts,
  quantitativeRecords: quantitativeModelRecords,
  syntheses: scientificSyntheses,
  projections: internalScientificProjections,
  readiness: Object.freeze({ rules: readinessRules, concepts: conceptReadiness, syntheses: synthesisReadiness, projections: projectionReadiness, summary: readinessSummary }),
  assertionReviewDecisions,
  ontologicalRequalificationDecisions,
  validationReport: validateScientificCorpus({ inspectGit: false }),
});

const categoryDigests = Object.freeze(Object.fromEntries(Object.entries(snapshotMaterial).map(([key, value]) => [key, sha256Digest(value)])));

export const p4Snapshot = Object.freeze({
  ...snapshotMaterial,
  categoryDigests,
  digest: sha256Digest({ snapshotMaterial, categoryDigests }),
  deterministic: true,
  rollbackMode: "LOGICAL_REVISION_ROLLBACK",
  unstableTimestampExcludedFromDigest: true,
});

export const createP4Snapshot = () => p4Snapshot;
