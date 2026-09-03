import { REFERENCE_CORPUS_RUNTIME_DIGEST, queryReferenceCorpus } from "../reference-corpus";
import type { AdapterResult } from "../types";
import type { CorpusAdapter } from "./corpus-adapter";

const referenceCorpusAdapter: CorpusAdapter = {
  adapterId: "reference-corpus-adapter-v1",
  adapterVersion: "1.0.0",
  supports: (provider) => provider.type === "REFERENCE_CORPUS" && provider.id === "reference-corpus-01",
  query: ({ request, provider }): AdapterResult => {
    const result = queryReferenceCorpus(request);
    return {
      providerId: provider.providerId,
      providerVersion: provider.version,
      executionStatus: result.executionStatus,
      declaredCoverage: provider.domain,
      assertions: [],
      documentaryStatements: [],
      sources: result.runtimeSources,
      referenceSourceSnapshots: result.snapshots,
      referenceEvidenceCandidates: result.candidates,
      referenceDocumentRelationships: result.relationships,
      evidenceLinks: [],
      conflicts: [],
      limitations: [...provider.knownLimitations, ...result.limitations],
      continuation: "EXHAUSTED",
      diagnostics: result.diagnostics,
      sourceRepresentationDigest: REFERENCE_CORPUS_RUNTIME_DIGEST,
    };
  },
};

export default referenceCorpusAdapter;
