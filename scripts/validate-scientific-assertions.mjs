import {
  assertionEvidence,
  corpusScientificAssertionIdentities,
  corpusScientificAssertionRevisions,
  corpusScientificEvidenceLinks,
  entities,
  scientificAssertions,
  scientificSourceRevisions,
  scientificSources,
  validateScientificAssertionLayer,
  validateScientificAssertionRevisions,
} from "../src/knowledge-graph/index.mjs";

const legacy = validateScientificAssertionLayer({
  entities,
  assertions: scientificAssertions,
  sources: scientificSources,
  evidenceLinks: assertionEvidence,
});
const corpus = validateScientificAssertionRevisions({
  assertionIdentities: corpusScientificAssertionIdentities,
  assertionRevisions: corpusScientificAssertionRevisions,
  evidenceLinks: corpusScientificEvidenceLinks,
  sourceRevisions: scientificSourceRevisions,
});
const result = {
  valid: legacy.valid && corpus.valid,
  legacyEmptyAssertionLayer: legacy,
  p4ScientificCorpus: corpus,
  counts: {
    legacyAssertions: legacy.counts.assertions,
    realAssertions: corpus.counts.revisions,
    realEvidenceLinks: corpus.counts.evidenceLinks,
  },
};

console.log(JSON.stringify(result, null, 2));
if (!result.valid) process.exitCode = 1;
