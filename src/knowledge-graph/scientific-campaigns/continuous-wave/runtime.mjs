import {
  createAuthoritativeScientificRegistry,
  createScientificKnowledgeCatalog,
  p9ScientificKnowledgeCatalog,
} from "../../knowledge-catalog/catalog-builder.mjs";
import { createScientificTerritoryModel } from "../../scientific-territory/model.mjs";
import { EMPTY_TERRITORIAL_CAMPAIGN_CORPUS } from "./constants.mjs";
import { buildP10ExecutionBundle } from "./execution.mjs";
import { loadPreparedScientificWave } from "./prepared-loader.mjs";

export const loadP10RuntimeContext = async ({ root = process.cwd() } = {}) => {
  const baselineCatalog = p9ScientificKnowledgeCatalog;
  return Object.freeze({
    preparedWave: await loadPreparedScientificWave({ root }),
    baselineCatalog,
    baselineRegistry: createAuthoritativeScientificRegistry({ territorialCampaignCorpus: EMPTY_TERRITORIAL_CAMPAIGN_CORPUS }),
    territoryModel: createScientificTerritoryModel({ catalog: baselineCatalog }),
    createCatalog: createScientificKnowledgeCatalog,
    createRegistry: createAuthoritativeScientificRegistry,
  });
};

export const buildP10RuntimeBundle = async ({ root = process.cwd() } = {}) => {
  const context = await loadP10RuntimeContext({ root });
  return buildP10ExecutionBundle(context);
};
