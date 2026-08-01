import { p4rInternalScientificProjections, p4rReadinessSummary, p4rScientificSyntheses } from "../scientific-consolidation/corpus.mjs";
import { genericScientificContracts, genericityFixtures } from "../scientific-consolidation/generality.mjs";
import { p4rOntologicalDecisions } from "../scientific-consolidation/ontology.mjs";
import { consolidatedAssertionRevisions, consolidatedEvidenceLinks } from "../scientific-consolidation/review.mjs";
import { p4Snapshot } from "../scientific-consolidation/snapshot.mjs";
import { consolidatedSourceRevisions } from "../scientific-consolidation/sources.mjs";
import { validateP4RConsolidation } from "../scientific-consolidation/validate.mjs";
import { sha256Digest } from "../migration/stable-json.mjs";

const validation = validateP4RConsolidation({ inspectGit: false });

const material = Object.freeze({
  snapshotType: "P4R_CONSOLIDATED_BASELINE_BEFORE_P5",
  p4Digest: p4Snapshot.digest,
  p4CategoryDigests: p4Snapshot.categoryDigests,
  sourceRevisions: consolidatedSourceRevisions,
  assertionRevisions: consolidatedAssertionRevisions,
  evidenceLinks: consolidatedEvidenceLinks,
  syntheses: p4rScientificSyntheses,
  projections: p4rInternalScientificProjections,
  readiness: p4rReadinessSummary,
  ontologicalDecisions: p4rOntologicalDecisions,
  genericContracts: genericScientificContracts,
  isolatedGenericityFixtures: genericityFixtures,
  validation,
});

const categoryDigests = Object.freeze(Object.fromEntries(
  Object.entries(material).map(([key, value]) => [key, sha256Digest(value)]),
));

export const p4rBaselineSnapshot = Object.freeze({
  ...material,
  expectedCounts: Object.freeze({
    sources: 27,
    fullTextSources: 21,
    abstractOnlySources: 6,
    assertions: 58,
    evidenceLinks: 84,
    syntheses: 10,
    projections: 12,
    genericContracts: 18,
    genericityFixtures: 10,
    ontologyMultiRole: 3,
    ontologyDeferred: 3,
  }),
  categoryDigests,
  digest: sha256Digest({ material, categoryDigests }),
  deterministic: true,
  unstableTimestampExcludedFromDigest: true,
  rollbackMode: "LOGICAL_REVISION_ROLLBACK",
});

export const createP4RBaselineSnapshot = () => p4rBaselineSnapshot;

