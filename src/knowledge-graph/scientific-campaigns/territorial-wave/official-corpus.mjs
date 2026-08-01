import bundle from "./execution-bundle.json" with { type: "json" };
import { officialTerritorialCampaignCorpus as officialP10TerritorialCampaignCorpus } from "../continuous-wave/official-corpus.mjs";

const freeze = (value) => {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return Object.freeze(value.map(freeze));
  return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, freeze(nested)])));
};

export const officialP11ExecutionBundle = freeze(bundle);
export const officialContinuousTerritorialCampaignCorpus = bundle.status?.startsWith("COMPLETED") && bundle.officialCorpus
  ? freeze(bundle.officialCorpus)
  : officialP10TerritorialCampaignCorpus;

