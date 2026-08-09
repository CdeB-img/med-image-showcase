import { KNOWLEDGE_ADAPTERS } from "./adapters";
import { KNOWLEDGE_PROVIDER_REGISTRY, getKnowledgeProvider } from "./provider-registry";
import type { AdapterResult, KnowledgeRequest, ProviderExecution, QueryPlan } from "./types";

export type RetrievalResult = {
  adapterResults: AdapterResult[];
  providerExecutions: ProviderExecution[];
};

export const retrieveKnowledge = (request: KnowledgeRequest, queryPlan: QueryPlan): RetrievalResult => {
  const adapterResults: AdapterResult[] = [];
  const providerExecutions = queryPlan.providerSelections.map<ProviderExecution>((selection) => {
    const provider = getKnowledgeProvider(selection.providerId);
    if (!provider) return { providerId: selection.providerId, providerVersion: "UNKNOWN", included: false, reason: "Provider absent du snapshot.", executionStatus: "NOT_EXECUTED", resultCount: 0, diagnostics: ["REGISTRY_DRIFT"] };
    if (!selection.included) return { providerId: provider.id, providerVersion: provider.version, included: false, reason: selection.reason, executionStatus: "NOT_EXECUTED", resultCount: 0, diagnostics: [] };
    const adapter = KNOWLEDGE_ADAPTERS.find((candidate) => candidate.supports(provider));
    if (!adapter) return { providerId: provider.id, providerVersion: provider.version, included: true, reason: selection.reason, executionStatus: "FAILED", resultCount: 0, diagnostics: ["ADAPTER_NOT_FOUND"] };
    try {
      const result = adapter.query({ request, queryPlan, provider });
      adapterResults.push(result);
      return { providerId: provider.id, providerVersion: provider.version, included: true, reason: selection.reason, executionStatus: result.executionStatus, resultCount: result.assertions.length + result.documentaryStatements.length, diagnostics: result.diagnostics };
    } catch (error) {
      return { providerId: provider.id, providerVersion: provider.version, included: true, reason: selection.reason, executionStatus: "FAILED", resultCount: 0, diagnostics: [error instanceof Error ? error.message : "UNKNOWN_ADAPTER_ERROR"] };
    }
  });
  const executionIndex = new Map(queryPlan.executionOrder.map((id, index) => [id, index]));
  adapterResults.sort((left, right) => (executionIndex.get(left.providerId) ?? Number.MAX_SAFE_INTEGER) - (executionIndex.get(right.providerId) ?? Number.MAX_SAFE_INTEGER));
  return { adapterResults, providerExecutions };
};

export const registrySnapshotIsStable = () => KNOWLEDGE_PROVIDER_REGISTRY.providers.map((item) => item.id).join("|") === [...KNOWLEDGE_PROVIDER_REGISTRY.providers].sort((left, right) => left.id.localeCompare(right.id)).map((item) => item.id).join("|");

