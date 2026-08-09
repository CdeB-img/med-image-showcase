import type { AdapterResult, KnowledgeProviderDefinition, KnowledgeRequest, QueryPlan } from "../types";

export type CorpusAdapterInput = {
  request: KnowledgeRequest;
  queryPlan: QueryPlan;
  provider: KnowledgeProviderDefinition;
};

export interface CorpusAdapter {
  readonly adapterId: string;
  readonly adapterVersion: "1.0.0";
  supports(provider: KnowledgeProviderDefinition): boolean;
  query(input: CorpusAdapterInput): AdapterResult;
}

