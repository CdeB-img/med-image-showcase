import { sha256Digest } from "../migration/stable-json.mjs";
import {
  createCampaignExecutionAttempt,
  createCampaignExecutionIdentity,
  createCampaignResult,
  TERMINAL_CAMPAIGN_EXECUTION_STATES,
  validateCampaignManifest,
} from "../knowledge-catalog/campaign-contracts.mjs";
import {
  authorizeCampaignExecution,
  validateGovernanceToken,
} from "../knowledge-catalog/governance.mjs";

export const GENERIC_CAMPAIGN_EXECUTOR_VERSION = "1.0.0";
export const CAMPAIGN_EXECUTION_MODES = Object.freeze(["DRY_RUN", "SIMULATION", "APPLY"]);

const freeze = (value) => Object.freeze(value);

export class ScientificCampaignAdapterRegistry {
  constructor(adapters = []) {
    this.adapters = new Map();
    for (const adapter of adapters) this.register(adapter);
  }

  register(adapter) {
    if (!adapter?.adapterId || typeof adapter.prepare !== "function") throw new Error("CAMPAIGN_ADAPTER_INVALID");
    if (this.adapters.has(adapter.adapterId)) throw new Error(`CAMPAIGN_ADAPTER_DUPLICATE:${adapter.adapterId}`);
    this.adapters.set(adapter.adapterId, adapter);
    return this;
  }

  get(adapterId) {
    return this.adapters.get(adapterId) ?? null;
  }
}

export const createGovernedMutationGateway = ({ campaignManifest, governanceDecision, catalog, writer }) => {
  if (!validateGovernanceToken({ decision: governanceDecision, campaignManifest, catalog })) throw new Error("CAMPAIGN_GOVERNANCE_TOKEN_INVALID");
  if (!writer || typeof writer.apply !== "function") throw new Error("CAMPAIGN_WRITER_REQUIRED");
  return freeze({
    apply(records = []) {
      for (const record of records) {
        if (record.campaignRevisionId !== campaignManifest.campaignRevisionId) throw new Error("SCIENTIFIC_RECORD_CAMPAIGN_REVISION_MISMATCH");
        if (!Array.isArray(record.selectedNodeIds) || record.selectedNodeIds.some((nodeId) => !campaignManifest.selectedNodeIds.includes(nodeId))) throw new Error("SCIENTIFIC_RECORD_OUTSIDE_CAMPAIGN");
      }
      return writer.apply(records, { campaignManifest, governanceDecision });
    },
  });
};

const existingResult = ({ campaignManifest, executionHistory }) => executionHistory.find((entry) => (
  entry.campaignRevisionId === campaignManifest.campaignRevisionId
  && entry.inputDigest === campaignManifest.inputDigest
  && TERMINAL_CAMPAIGN_EXECUTION_STATES.includes(entry.status)
)) ?? null;

export const executeScientificCampaign = async ({
  campaignManifest,
  catalog,
  mode = "DRY_RUN",
  adapterRegistry = new ScientificCampaignAdapterRegistry(),
  executionHistory = [],
  attemptHistory = [],
  writer = null,
  now = campaignManifest?.createdAt ?? campaignManifest?.generatedAt,
} = {}) => {
  if (!CAMPAIGN_EXECUTION_MODES.includes(mode)) throw new Error("CAMPAIGN_EXECUTION_MODE_UNKNOWN");
  const manifestValidation = validateCampaignManifest(campaignManifest);
  if (!manifestValidation.valid) throw new Error(`CAMPAIGN_MANIFEST_INVALID:${manifestValidation.errors.map((error) => error.code).join(",")}`);
  const completed = existingResult({ campaignManifest, executionHistory });
  if (completed) return freeze({
    executorVersion: GENERIC_CAMPAIGN_EXECUTOR_VERSION,
    mode,
    status: "ALREADY_COMPLETED_NO_WRITE",
    idempotent: true,
    existingResult: completed,
    mutationApplied: false,
  });
  const activeAttempt = attemptHistory.find((attempt) => attempt.executionId
    && attempt.campaignRevisionId === campaignManifest.campaignRevisionId
    && ["AUTHORIZED", "RUNNING"].includes(attempt.status));
  if (activeAttempt) throw new Error("CAMPAIGN_EXECUTION_ALREADY_ACTIVE");
  const governanceDecision = authorizeCampaignExecution({ campaignManifest, catalog });
  if (!governanceDecision.authorized) throw new Error(`CAMPAIGN_GOVERNANCE_REJECTED:${governanceDecision.blockers.join(",")}`);
  const priorAttempts = attemptHistory.filter((attempt) => attempt.campaignRevisionId === campaignManifest.campaignRevisionId).length;
  if (priorAttempts >= campaignManifest.executionPolicy.maxAttempts) throw new Error("CAMPAIGN_MAX_ATTEMPTS_REACHED");
  const executionIdentity = createCampaignExecutionIdentity({ manifest: campaignManifest, executionOrdinal: executionHistory.length + 1, createdAt: now });
  const attempt = createCampaignExecutionAttempt({ executionIdentity, attemptNumber: priorAttempts + 1, status: mode === "DRY_RUN" ? "AUTHORIZED" : "RUNNING", createdAt: now });
  if (mode === "DRY_RUN") return freeze({
    executorVersion: GENERIC_CAMPAIGN_EXECUTOR_VERSION,
    mode,
    status: "AUTHORIZED_DRY_RUN",
    governanceDecision,
    executionIdentity,
    attempt,
    mutationApplied: false,
    immutableTraceDigest: sha256Digest({ campaignManifest, governanceDecision, executionIdentity, attempt, mode }),
  });
  const adapterId = campaignManifest.executionPolicy.adapterId;
  const adapter = adapterRegistry.get(adapterId);
  if (!adapter) throw new Error(`CAMPAIGN_ADAPTER_NOT_REGISTERED:${adapterId ?? "UNSPECIFIED"}`);
  const prepared = await adapter.prepare({ campaignManifest, catalog, mode });
  const records = prepared.records ?? [];
  let mutationApplied = false;
  if (mode === "APPLY") {
    const gateway = createGovernedMutationGateway({ campaignManifest, governanceDecision, catalog, writer });
    gateway.apply(records);
    mutationApplied = records.length > 0;
  }
  const status = prepared.gaps?.length ? "COMPLETED_WITH_GAPS" : "COMPLETED";
  const result = createCampaignResult({
    manifest: campaignManifest,
    executionIdentity,
    attempt,
    status,
    completedAt: now,
    result: {
      additions: prepared.additions ?? {},
      gaps: prepared.gaps ?? [],
      outputDigests: prepared.outputDigests ?? {},
    },
  });
  return freeze({
    executorVersion: GENERIC_CAMPAIGN_EXECUTOR_VERSION,
    mode,
    status,
    governanceDecision,
    executionIdentity,
    attempt: freeze({ ...attempt, status, completedAt: now, campaignRevisionId: campaignManifest.campaignRevisionId }),
    result,
    mutationApplied,
    preparedRecordCount: records.length,
    immutableTraceDigest: sha256Digest({ campaignManifest, governanceDecision, executionIdentity, attempt, result, mode, mutationApplied }),
  });
};
