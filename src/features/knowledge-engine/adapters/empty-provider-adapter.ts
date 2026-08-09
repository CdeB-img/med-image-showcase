import { logicalDigest } from "../canonical";
import type { AdapterResult } from "../types";
import type { CorpusAdapter } from "./corpus-adapter";

const emptyProviderAdapter: CorpusAdapter = {
  adapterId: "empty-provider-adapter-v1",
  adapterVersion: "1.0.0",
  supports: (provider) => provider.availability === "AVAILABLE_EMPTY",
  query: ({ provider }): AdapterResult => ({
    providerId: provider.providerId,
    providerVersion: provider.version,
    executionStatus: "NO_MATCH",
    declaredCoverage: provider.domain,
    assertions: [],
    documentaryStatements: [],
    sources: [],
    evidenceLinks: [],
    conflicts: [],
    limitations: provider.knownLimitations,
    continuation: "EXHAUSTED",
    diagnostics: ["REGISTERED_PROVIDER_IS_EXHAUSTIVELY_EMPTY"],
    sourceRepresentationDigest: logicalDigest({ providerId: provider.providerId, version: provider.version, entryCount: 0 }),
  }),
};

export default emptyProviderAdapter;
