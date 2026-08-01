import { sha256Digest } from "../../migration/stable-json.mjs";
import { P10_ADAPTER_ID } from "./constants.mjs";

const freeze = (value) => Object.freeze(value);
const recordCollections = Object.freeze([
  ["SOURCE_IDENTITY", "sourceIdentities"],
  ["SOURCE_REVISION", "sources"],
  ["CONCEPT_REVISION", "concepts"],
  ["ASSERTION_IDENTITY", "assertionIdentities"],
  ["ASSERTION_REVISION", "assertions"],
  ["EVIDENCE_LINK", "evidenceLinks"],
  ["CONTEXT_DIFFERENCE", "contextDifferences"],
  ["AUTOMATED_REVIEW", "reviewDecisions"],
  ["SYNTHESIS", "syntheses"],
  ["INTERNAL_PROJECTION", "projections"],
]);

const mutationRecordsFor = ({ reviewedCorpus, campaignManifest }) => Object.freeze(recordCollections.flatMap(([payloadType, field]) => reviewedCorpus[field].map((payload) => freeze({
  recordType: "ScientificCampaignMutationRecord",
  mutationId: `noxia:scientific-campaign-mutation:${sha256Digest({ campaignRevisionId: campaignManifest.campaignRevisionId, payloadType, payload }).slice(0, 20)}`,
  campaignRevisionId: campaignManifest.campaignRevisionId,
  selectedNodeIds: campaignManifest.selectedNodeIds,
  payloadType,
  payload,
}))));

export const createTerritorialScientificCampaignAdapter = ({ reviewedCorpus } = {}) => freeze({
  adapterId: P10_ADAPTER_ID,
  async prepare({ campaignManifest }) {
    if (campaignManifest.campaignId !== reviewedCorpus.campaignId) throw new Error("TERRITORIAL_ADAPTER_CAMPAIGN_ID_MISMATCH");
    const records = mutationRecordsFor({ reviewedCorpus, campaignManifest });
    const additions = Object.freeze(Object.fromEntries(recordCollections.map(([payloadType, field]) => [payloadType, reviewedCorpus[field].length])));
    const outputDigests = Object.freeze({
      corpus: reviewedCorpus.corpusDigest,
      records: sha256Digest(records),
      sources: sha256Digest(reviewedCorpus.sources),
      assertions: sha256Digest(reviewedCorpus.assertions),
      evidenceLinks: sha256Digest(reviewedCorpus.evidenceLinks),
      syntheses: sha256Digest(reviewedCorpus.syntheses),
      projections: sha256Digest(reviewedCorpus.projections),
    });
    return freeze({ records, additions, gaps: reviewedCorpus.gaps, outputDigests });
  },
});

export const createAtomicScientificCorpusWriter = () => {
  let committed = null;
  let applyCount = 0;
  return {
    apply(records, { campaignManifest }) {
      if (committed) throw new Error("ATOMIC_SCIENTIFIC_WRITER_ALREADY_COMMITTED");
      const ids = records.map((item) => item.mutationId);
      if (new Set(ids).size !== ids.length) throw new Error("ATOMIC_SCIENTIFIC_WRITER_DUPLICATE_MUTATION");
      if (records.some((item) => item.campaignRevisionId !== campaignManifest.campaignRevisionId)) throw new Error("ATOMIC_SCIENTIFIC_WRITER_CAMPAIGN_MISMATCH");
      const candidate = structuredClone(records);
      committed = Object.freeze(candidate);
      applyCount += 1;
      return committed;
    },
    snapshot() { return committed; },
    get applyCount() { return applyCount; },
  };
};
