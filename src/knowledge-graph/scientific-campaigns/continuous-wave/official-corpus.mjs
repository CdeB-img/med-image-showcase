import bundle from "./execution-bundle.json" with { type: "json" };
import { EMPTY_TERRITORIAL_CAMPAIGN_CORPUS } from "./constants.mjs";

const freeze = (value) => {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return Object.freeze(value.map(freeze));
  return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, freeze(nested)])));
};

export const officialP10ExecutionBundle = freeze(bundle);
export const officialTerritorialCampaignCorpus = bundle.status?.startsWith("COMPLETED") && bundle.officialCorpus
  ? freeze(bundle.officialCorpus)
  : EMPTY_TERRITORIAL_CAMPAIGN_CORPUS;
