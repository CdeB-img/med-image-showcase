import { logicalDigest } from "@/features/knowledge-engine/canonical";
import type { ScientificInterpretationContributionEnvelope } from "@/features/scientific-interpretation/contracts";
import {
  buildProjectContextSnapshot,
  type ProjectContextSnapshot,
} from "./canonical-project-backbone";
import {
  confirmResearchProjectContribution,
  prepareResearchProjectContributionCandidate,
  rejectResearchProjectContribution,
  type ResearchProjectContributionCandidate,
  type ResearchProjectOwnerAuthority,
  type ResearchProjectOwnerProjection,
} from "./contribution-owner-boundary";

export const SPECIALIZED_OWNER_HANDOFF_CONTRACT = "PROJECT_SPINE_02_SPECIALIZED_OWNER_HANDOFF" as const;
export const SPECIALIZED_OWNER_HANDOFF_VERSION = "0.1.0" as const;

export type SpecializedOwnerId =
  | "KNOWLEDGE"
  | "SCIENTIFIC_THINKING"
  | "STUDY_DESIGN"
  | "IMAGING"
  | "OBSERVABILITY_MEASUREMENT"
  | "REGULATORY_RESOLUTION"
  | "BIOSTATISTICS"
  | "STUDY_DATA_CDM"
  | "DATA_MANAGEMENT"
  | "TEMPLATE_ENGINE"
  | "DOCUMENT_ENGINE";

export type SpecializedCapabilityStatus = "AVAILABLE" | "AVAILABLE_WITH_LIMITATIONS" | "UNAVAILABLE";
export type SpecializedCapabilityRole = "SPECIALIZED_OWNER" | "DOWNSTREAM_CONSUMER";

export type SpecializedCapabilityDefinition = {
  capabilityId: string;
  owner: SpecializedOwnerId;
  role: SpecializedCapabilityRole;
  status: SpecializedCapabilityStatus;
  implementationVersion: string | null;
  inputContract: string;
  outputContract: string;
  pd003V2Compatibility: "NATIVE" | "COMPATIBLE_THROUGH_ADAPTER" | "NOT_RUNTIME_AVAILABLE";
  readsProjectSnapshot: boolean;
  canProduceProjectContribution: boolean;
  canWriteProject: false;
  externalProvider: "NONE" | "OPTIONAL_GOVERNED";
  limitations: readonly string[];
};

/**
 * Runtime facts, not a maturity catalogue and not a normative registry.
 * Native payloads remain owned by their feature; this inventory only prevents
 * calls to absent capabilities and silent expert fallback.
 */
export const SPECIALIZED_OWNER_CAPABILITIES = Object.freeze([
  {
    capabilityId: "KNOWLEDGE_EVIDENCE",
    owner: "KNOWLEDGE",
    role: "SPECIALIZED_OWNER",
    status: "AVAILABLE_WITH_LIMITATIONS",
    implementationVersion: "1.2.0",
    inputContract: "KnowledgeRequest",
    outputContract: "KnowledgeResult",
    pd003V2Compatibility: "COMPATIBLE_THROUGH_ADAPTER",
    readsProjectSnapshot: true,
    canProduceProjectContribution: true,
    canWriteProject: false,
    externalProvider: "OPTIONAL_GOVERNED",
    limitations: ["Corpus coverage is bounded and gaps remain explicit.", "External evidence remains candidate evidence."],
  },
  {
    capabilityId: "SCIENTIFIC_THINKING_PROPOSAL",
    owner: "SCIENTIFIC_THINKING",
    role: "SPECIALIZED_OWNER",
    status: "AVAILABLE_WITH_LIMITATIONS",
    implementationVersion: "1.2.2",
    inputContract: "ScientificThinkingInput",
    outputContract: "ScientificThinkingOutput / ResearchDesignHandoff",
    pd003V2Compatibility: "COMPATIBLE_THROUGH_ADAPTER",
    readsProjectSnapshot: true,
    canProduceProjectContribution: true,
    canWriteProject: false,
    externalProvider: "NONE",
    limitations: ["Existing runtime is deterministic and expects its native context projection.", "Proposals are never adopted automatically."],
  },
  {
    capabilityId: "STUDY_DESIGN_COHERENCE",
    owner: "STUDY_DESIGN",
    role: "SPECIALIZED_OWNER",
    status: "AVAILABLE_WITH_LIMITATIONS",
    implementationVersion: "1.0.0",
    inputContract: "StudyDesignRuntimeInput",
    outputContract: "StudyDesignProposalContribution",
    pd003V2Compatibility: "NATIVE",
    readsProjectSnapshot: true,
    canProduceProjectContribution: true,
    canWriteProject: false,
    externalProvider: "NONE",
    limitations: [
      "IMPLEMENTED_AND_PRODUCT_WIRED: QRY can dispatch DESIGN to Study Design and Standard can project its non-adopted options.",
      "Any selected option remains a contribution candidate until the existing Human Review boundary records explicit confirmation.",
      "Research Project Construction remains PRJ-owned and is not reclassified as Study Design.",
    ],
  },
  {
    capabilityId: "IMAGING_STUDY_DESIGN",
    owner: "IMAGING",
    role: "SPECIALIZED_OWNER",
    status: "AVAILABLE_WITH_LIMITATIONS",
    implementationVersion: "1.2.1",
    inputContract: "ImagingDesignInput",
    outputContract: "ImagingDesignResult / ProjectConstructionHandoff",
    pd003V2Compatibility: "COMPATIBLE_THROUGH_ADAPTER",
    readsProjectSnapshot: true,
    canProduceProjectContribution: true,
    canWriteProject: false,
    externalProvider: "NONE",
    limitations: ["No executable acquisition protocol or image analysis is produced.", "Equipment compatibility may remain unknown."],
  },
  {
    capabilityId: "OBSERVABILITY_QUALIFICATION",
    owner: "OBSERVABILITY_MEASUREMENT",
    role: "SPECIALIZED_OWNER",
    status: "UNAVAILABLE",
    implementationVersion: null,
    inputContract: "OBS-001 normative handoff only",
    outputContract: "No standalone runtime result",
    pd003V2Compatibility: "NOT_RUNTIME_AVAILABLE",
    readsProjectSnapshot: false,
    canProduceProjectContribution: false,
    canWriteProject: false,
    externalProvider: "NONE",
    limitations: ["OBS-001 defines ownership and contracts but no standalone runtime is implemented."],
  },
  {
    capabilityId: "REGULATORY_REQUIREMENT_RESOLUTION",
    owner: "REGULATORY_RESOLUTION",
    role: "SPECIALIZED_OWNER",
    status: "AVAILABLE_WITH_LIMITATIONS",
    implementationVersion: "1.0.0",
    inputContract: "RegulatoryResolutionInput",
    outputContract: "RegulatoryResolutionResult",
    pd003V2Compatibility: "COMPATIBLE_THROUGH_ADAPTER",
    readsProjectSnapshot: true,
    canProduceProjectContribution: true,
    canWriteProject: false,
    externalProvider: "NONE",
    limitations: ["REG-000 remains a candidate corpus.", "The result is methodological aid, never regulatory approval."],
  },
  {
    capabilityId: "BIOSTATISTICS_PLANNING",
    owner: "BIOSTATISTICS",
    role: "SPECIALIZED_OWNER",
    status: "AVAILABLE_WITH_LIMITATIONS",
    implementationVersion: "1.0.0",
    inputContract: "DataAnalysisPlanningContext / BiostatisticsPlanningInput",
    outputContract: "DataAnalysisPlanningContribution<BiostatisticsPlanningPayload>",
    pd003V2Compatibility: "COMPATIBLE_THROUGH_ADAPTER",
    readsProjectSnapshot: true,
    canProduceProjectContribution: true,
    canWriteProject: false,
    externalProvider: "NONE",
    limitations: ["Design-time planning only.", "No sample-size calculation, AnalysisExecution or AnalysisResult runtime."],
  },
  {
    capabilityId: "BIOSTATISTICS_CALCULATION",
    owner: "BIOSTATISTICS",
    role: "SPECIALIZED_OWNER",
    status: "UNAVAILABLE",
    implementationVersion: null,
    inputContract: "BIOSTATISTICS-001 architecture only",
    outputContract: "No calculation result runtime",
    pd003V2Compatibility: "NOT_RUNTIME_AVAILABLE",
    readsProjectSnapshot: false,
    canProduceProjectContribution: false,
    canWriteProject: false,
    externalProvider: "NONE",
    limitations: ["The current planning runtime deliberately leaves calculatedSampleSize null."],
  },
  {
    capabilityId: "STUDY_DATA_PLANNING",
    owner: "STUDY_DATA_CDM",
    role: "SPECIALIZED_OWNER",
    status: "AVAILABLE_WITH_LIMITATIONS",
    implementationVersion: "1.0.0",
    inputContract: "DataAnalysisPlanningContext",
    outputContract: "DataAnalysisPlanningContribution<StudyDataPlanningPayload>",
    pd003V2Compatibility: "COMPATIBLE_THROUGH_ADAPTER",
    readsProjectSnapshot: true,
    canProduceProjectContribution: true,
    canWriteProject: false,
    externalProvider: "NONE",
    limitations: ["Design-time DataNeeds, CanonicalVariables and ExpectedVariableOccasions only."],
  },
  {
    capabilityId: "DATA_MANAGEMENT_PLANNING",
    owner: "DATA_MANAGEMENT",
    role: "SPECIALIZED_OWNER",
    status: "AVAILABLE_WITH_LIMITATIONS",
    implementationVersion: "1.0.0",
    inputContract: "DataManagementPlanningInput",
    outputContract: "DataAnalysisPlanningContribution<DataManagementPlanningPayload>",
    pd003V2Compatibility: "COMPATIBLE_THROUGH_ADAPTER",
    readsProjectSnapshot: true,
    canProduceProjectContribution: true,
    canWriteProject: false,
    externalProvider: "NONE",
    limitations: ["Logical design-time CRF, dictionary, schedule and governance plans only."],
  },
  {
    capabilityId: "DATA_MANAGEMENT_EXECUTION",
    owner: "DATA_MANAGEMENT",
    role: "SPECIALIZED_OWNER",
    status: "UNAVAILABLE",
    implementationVersion: null,
    inputContract: "DM-001 architecture only",
    outputContract: "No operational execution result runtime",
    pd003V2Compatibility: "NOT_RUNTIME_AVAILABLE",
    readsProjectSnapshot: false,
    canProduceProjectContribution: false,
    canWriteProject: false,
    externalProvider: "NONE",
    limitations: ["No ingestion, query, correction, reconciliation, transformation, freeze, lock or release execution."],
  },
  {
    capabilityId: "TEMPLATE_PROJECTION",
    owner: "TEMPLATE_ENGINE",
    role: "DOWNSTREAM_CONSUMER",
    status: "AVAILABLE_WITH_LIMITATIONS",
    implementationVersion: "1.0.0",
    inputContract: "Project-owned handoff/projection",
    outputContract: "Template projection",
    pd003V2Compatibility: "COMPATIBLE_THROUGH_ADAPTER",
    readsProjectSnapshot: true,
    canProduceProjectContribution: false,
    canWriteProject: false,
    externalProvider: "NONE",
    limitations: ["Consumer only; never owner of scientific Project meaning."],
  },
  {
    capabilityId: "DOCUMENT_PROJECTION",
    owner: "DOCUMENT_ENGINE",
    role: "DOWNSTREAM_CONSUMER",
    status: "AVAILABLE_WITH_LIMITATIONS",
    implementationVersion: "1.2.0",
    inputContract: "Project-owned authorized document handoff",
    outputContract: "Document projection",
    pd003V2Compatibility: "COMPATIBLE_THROUGH_ADAPTER",
    readsProjectSnapshot: true,
    canProduceProjectContribution: false,
    canWriteProject: false,
    externalProvider: "NONE",
    limitations: ["Consumer only; projection does not become Project truth."],
  },
] as const satisfies readonly SpecializedCapabilityDefinition[]);

export type SpecializedOwnerHandoffRequest<TNativeInput = unknown> = {
  contract: typeof SPECIALIZED_OWNER_HANDOFF_CONTRACT;
  contractVersion: typeof SPECIALIZED_OWNER_HANDOFF_VERSION;
  handoffId: string;
  owner: SpecializedOwnerId;
  capabilityId: string;
  purpose: string;
  sourceProject: Readonly<ProjectContextSnapshot>;
  nativeInputType: string;
  nativeInputVersion: string;
  nativeInput: Readonly<TNativeInput>;
  missingContext: readonly string[];
  missingEvidence: readonly string[];
  projectWriteAuthorized: false;
  conversationalLlmExpertFallback: "FORBIDDEN";
};

export type SpecializedOwnerResultStatus =
  | "COMPLETED"
  | "COMPLETED_WITH_LIMITATIONS"
  | "OWNER_CAPABILITY_UNAVAILABLE"
  | "BLOCKED_BY_MISSING_CONTEXT"
  | "BLOCKED_BY_MISSING_EVIDENCE";

export type SpecializedOwnerResultKind =
  | "INFORMATIONAL_ONLY"
  | "EVIDENCE_DIAGNOSTIC"
  | "GAP"
  | "RECOMMENDATION_OPTION"
  | "PROJECT_CONTRIBUTION_CANDIDATE";

export type SpecializedOwnerResult<TNativePayload = unknown> = {
  contract: typeof SPECIALIZED_OWNER_HANDOFF_CONTRACT;
  contractVersion: typeof SPECIALIZED_OWNER_HANDOFF_VERSION;
  resultId: string;
  resultVersion: string;
  handoffId: string;
  owner: SpecializedOwnerId;
  capabilityId: string;
  sourceProjectRef: string;
  sourceProjectVersion: string;
  sourceProjectDigest: string;
  sourceSnapshotDigest: string;
  status: SpecializedOwnerResultStatus;
  resultKind: SpecializedOwnerResultKind;
  nativePayloadType: string;
  nativePayloadVersion: string;
  nativePayload: Readonly<TNativePayload> | null;
  stableProjectRefs: readonly string[];
  evidenceRefs: readonly string[];
  unknowns: readonly string[];
  gaps: readonly string[];
  limitations: readonly string[];
  provenance: readonly string[];
  projectContribution: ScientificInterpretationContributionEnvelope | null;
  humanDecisionRequired: boolean;
  projectWriteAuthorized: false;
  conversationalLlmExpertFallback: "FORBIDDEN";
  completedAt: string;
};

export type OwnerProjectContributionPreparation = {
  status: "READY_FOR_HUMAN_DECISION" | "STALE_OWNER_RESULT" | "NOT_A_PROJECT_CONTRIBUTION";
  resultRef: string;
  staleReasons: readonly string[];
  candidate: ResearchProjectContributionCandidate | null;
  humanDecisionRequired: true;
  projectWriteAuthorized: false;
};

const capabilityById = (capabilityId: string) => SPECIALIZED_OWNER_CAPABILITIES.find((entry) => entry.capabilityId === capabilityId);

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach((nested) => deepFreeze(nested));
    Object.freeze(value);
  }
  return value;
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const validatedProjectSnapshot = (snapshot: Readonly<ProjectContextSnapshot>): Readonly<ProjectContextSnapshot> => {
  const detached = clone(snapshot);
  const { snapshotDigest, ...material } = detached;
  if (detached.contract !== "PROJECT_CONTEXT_SNAPSHOT"
    || detached.contractVersion !== "0.3.0"
    || detached.owner !== "RESEARCH_PROJECT"
    || detached.readOnly !== true
    || logicalDigest(material) !== snapshotDigest) {
    throw new Error("SPECIALIZED_OWNER_PROJECT_SNAPSHOT_INVALID");
  }
  return deepFreeze(detached) as Readonly<ProjectContextSnapshot>;
};

const handoffRequestFromSnapshot = <TNativeInput>(input: {
  handoffId: string;
  owner: SpecializedOwnerId;
  capabilityId: string;
  purpose: string;
  sourceProject: Readonly<ProjectContextSnapshot>;
  nativeInputType: string;
  nativeInputVersion: string;
  nativeInput: TNativeInput;
  missingContext?: string[];
  missingEvidence?: string[];
}): SpecializedOwnerHandoffRequest<TNativeInput> => {
  const definition = capabilityById(input.capabilityId);
  if (!definition) throw new Error("SPECIALIZED_OWNER_CAPABILITY_UNKNOWN");
  if (definition.owner !== input.owner) throw new Error("SPECIALIZED_OWNER_CAPABILITY_OWNER_MISMATCH");
  const sourceProject = validatedProjectSnapshot(input.sourceProject);
  return deepFreeze({
    contract: SPECIALIZED_OWNER_HANDOFF_CONTRACT,
    contractVersion: SPECIALIZED_OWNER_HANDOFF_VERSION,
    handoffId: input.handoffId,
    owner: input.owner,
    capabilityId: input.capabilityId,
    purpose: input.purpose,
    sourceProject,
    nativeInputType: input.nativeInputType,
    nativeInputVersion: input.nativeInputVersion,
    nativeInput: clone(input.nativeInput),
    missingContext: [...(input.missingContext ?? [])],
    missingEvidence: [...(input.missingEvidence ?? [])],
    projectWriteAuthorized: false,
    conversationalLlmExpertFallback: "FORBIDDEN",
  });
};

export const listSpecializedOwnerCapabilities = () => ({
  contract: SPECIALIZED_OWNER_HANDOFF_CONTRACT,
  contractVersion: SPECIALIZED_OWNER_HANDOFF_VERSION,
  entries: SPECIALIZED_OWNER_CAPABILITIES,
});

export const createSpecializedOwnerHandoffRequest = <TNativeInput>(input: {
  handoffId: string;
  owner: SpecializedOwnerId;
  capabilityId: string;
  purpose: string;
  project: ResearchProjectOwnerProjection;
  nativeInputType: string;
  nativeInputVersion: string;
  nativeInput: TNativeInput;
  activeQryNeed?: { id: string; purpose: string; targetRefs: string[] } | null;
  missingContext?: string[];
  missingEvidence?: string[];
}): SpecializedOwnerHandoffRequest<TNativeInput> => {
  return handoffRequestFromSnapshot({
    ...input,
    sourceProject: buildProjectContextSnapshot({ project: input.project, activeQryNeed: input.activeQryNeed }),
  });
};

/**
 * Reuses the SPINE handoff contract when the product already owns the exact
 * canonical snapshot. No Project reconstruction or alternate Project shape is
 * introduced at this boundary.
 */
export const createSpecializedOwnerHandoffRequestFromSnapshot = <TNativeInput>(input: {
  handoffId: string;
  owner: SpecializedOwnerId;
  capabilityId: string;
  purpose: string;
  sourceProject: Readonly<ProjectContextSnapshot>;
  nativeInputType: string;
  nativeInputVersion: string;
  nativeInput: TNativeInput;
  missingContext?: string[];
  missingEvidence?: string[];
}): SpecializedOwnerHandoffRequest<TNativeInput> => handoffRequestFromSnapshot(input);

const resultBase = (request: SpecializedOwnerHandoffRequest, input: { resultId: string; resultVersion: string; completedAt: string }) => ({
  contract: SPECIALIZED_OWNER_HANDOFF_CONTRACT,
  contractVersion: SPECIALIZED_OWNER_HANDOFF_VERSION,
  resultId: input.resultId,
  resultVersion: input.resultVersion,
  handoffId: request.handoffId,
  owner: request.owner,
  capabilityId: request.capabilityId,
  sourceProjectRef: request.sourceProject.sourceProjectRef,
  sourceProjectVersion: request.sourceProject.sourceProjectVersion,
  sourceProjectDigest: request.sourceProject.sourceProjectDigest,
  sourceSnapshotDigest: request.sourceProject.snapshotDigest,
  projectWriteAuthorized: false as const,
  conversationalLlmExpertFallback: "FORBIDDEN" as const,
  completedAt: input.completedAt,
});

export const createSpecializedOwnerGapResult = (input: {
  request: SpecializedOwnerHandoffRequest;
  resultId: string;
  resultVersion: string;
  completedAt: string;
  limitations?: string[];
}): SpecializedOwnerResult<null> => {
  const definition = capabilityById(input.request.capabilityId)!;
  const status: SpecializedOwnerResultStatus = definition.status === "UNAVAILABLE"
    ? "OWNER_CAPABILITY_UNAVAILABLE"
    : input.request.missingContext.length
      ? "BLOCKED_BY_MISSING_CONTEXT"
      : input.request.missingEvidence.length
        ? "BLOCKED_BY_MISSING_EVIDENCE"
        : (() => { throw new Error("SPECIALIZED_OWNER_GAP_REASON_REQUIRED"); })();
  return deepFreeze({
    ...resultBase(input.request, input),
    status,
    resultKind: "GAP",
    nativePayloadType: definition.outputContract,
    nativePayloadVersion: definition.implementationVersion ?? "NOT_IMPLEMENTED",
    nativePayload: null,
    stableProjectRefs: [],
    evidenceRefs: [],
    unknowns: [...input.request.missingContext],
    gaps: status === "OWNER_CAPABILITY_UNAVAILABLE"
      ? [`${input.request.capabilityId}:NOT_IMPLEMENTED`]
      : [...input.request.missingContext, ...input.request.missingEvidence],
    limitations: [...definition.limitations, ...(input.limitations ?? [])],
    provenance: [input.request.handoffId, input.request.sourceProject.snapshotDigest],
    projectContribution: null,
    humanDecisionRequired: false,
  });
};

export const recordSpecializedOwnerResult = <TNativePayload>(input: {
  request: SpecializedOwnerHandoffRequest;
  resultId: string;
  resultVersion: string;
  completedAt: string;
  status: "COMPLETED" | "COMPLETED_WITH_LIMITATIONS";
  resultKind: SpecializedOwnerResultKind;
  nativePayloadType: string;
  nativePayloadVersion: string;
  nativePayload: TNativePayload;
  stableProjectRefs?: string[];
  evidenceRefs?: string[];
  unknowns?: string[];
  gaps?: string[];
  limitations?: string[];
  provenance?: string[];
  projectContribution?: ScientificInterpretationContributionEnvelope | null;
  humanDecisionRequired?: boolean;
}): SpecializedOwnerResult<TNativePayload> => {
  const definition = capabilityById(input.request.capabilityId)!;
  if (definition.status === "UNAVAILABLE") throw new Error("CALL_NONEXISTENT_ENGINE");
  if (input.request.missingContext.length) throw new Error("SPECIALIZED_OWNER_BLOCKED_BY_MISSING_CONTEXT");
  if (input.request.missingEvidence.length) throw new Error("SPECIALIZED_OWNER_BLOCKED_BY_MISSING_EVIDENCE");
  const carriesContribution = input.resultKind === "PROJECT_CONTRIBUTION_CANDIDATE";
  if (input.resultKind === "GAP" && !(input.unknowns?.length || input.gaps?.length || input.limitations?.length)) {
    throw new Error("SPECIALIZED_OWNER_NATIVE_GAP_REASON_REQUIRED");
  }
  if (carriesContribution !== Boolean(input.projectContribution)) throw new Error("SPECIALIZED_OWNER_PROJECT_CONTRIBUTION_KIND_MISMATCH");
  if (input.projectContribution
    && (input.projectContribution.decisionBoundary.projectWriteAuthorized !== false
      || input.projectContribution.epistemicBoundary.projectOwnershipTransferred !== false
      || input.projectContribution.epistemicBoundary.candidateIsAdopted !== false)) {
    throw new Error("SPECIALIZED_OWNER_PROJECT_BOUNDARY_INVALID");
  }
  return deepFreeze({
    ...resultBase(input.request, input),
    status: input.status,
    resultKind: input.resultKind,
    nativePayloadType: input.nativePayloadType,
    nativePayloadVersion: input.nativePayloadVersion,
    nativePayload: input.nativePayload,
    stableProjectRefs: [...(input.stableProjectRefs ?? [])],
    evidenceRefs: [...(input.evidenceRefs ?? [])],
    unknowns: [...(input.unknowns ?? [])],
    gaps: [...(input.gaps ?? [])],
    limitations: [...definition.limitations, ...(input.limitations ?? [])],
    provenance: [input.request.handoffId, input.request.sourceProject.snapshotDigest, ...(input.provenance ?? [])],
    projectContribution: input.projectContribution ?? null,
    humanDecisionRequired: input.humanDecisionRequired ?? carriesContribution,
  });
};

export const assessSpecializedOwnerResultFreshness = (
  result: SpecializedOwnerResult,
  project: ResearchProjectOwnerProjection,
) => {
  const staleReasons = [
    ...(result.sourceProjectRef === project.projectId ? [] : ["PROJECT_ID_CHANGED"]),
    ...(result.sourceProjectVersion === project.versionId ? [] : ["PROJECT_VERSION_CHANGED"]),
    ...(result.sourceProjectDigest === project.projectDigest ? [] : ["PROJECT_DIGEST_CHANGED"]),
  ];
  return { status: staleReasons.length ? "STALE_OWNER_RESULT" as const : "CURRENT" as const, staleReasons };
};

export const assessSpecializedOwnerResultFreshnessAgainstSnapshot = (
  result: SpecializedOwnerResult,
  snapshot: Readonly<ProjectContextSnapshot>,
) => {
  const sourceProject = validatedProjectSnapshot(snapshot);
  const staleReasons = [
    ...(result.sourceProjectRef === sourceProject.sourceProjectRef ? [] : ["PROJECT_ID_CHANGED"]),
    ...(result.sourceProjectVersion === sourceProject.sourceProjectVersion ? [] : ["PROJECT_VERSION_CHANGED"]),
    ...(result.sourceProjectDigest === sourceProject.sourceProjectDigest ? [] : ["PROJECT_DIGEST_CHANGED"]),
  ];
  return { status: staleReasons.length ? "STALE_OWNER_RESULT" as const : "CURRENT" as const, staleReasons };
};

const projectContributionWithOwnerTrace = (result: SpecializedOwnerResult): ScientificInterpretationContributionEnvelope => {
  if (!result.projectContribution) throw new Error("SPECIALIZED_OWNER_RESULT_HAS_NO_PROJECT_CONTRIBUTION");
  const resultRef = `${result.resultId}@${result.resultVersion}`;
  const contribution = result.projectContribution;
  const sourceRefs = [...new Set([
    ...contribution.source.sourceRefs,
    resultRef,
    `owner-source-project-version:${result.sourceProjectVersion}`,
    `owner-source-project-digest:${result.sourceProjectDigest}`,
    ...result.evidenceRefs,
  ])];
  const contributionDigest = logicalDigest({
    sourceContributionDigest: contribution.identity.contributionDigest,
    owner: result.owner,
    resultRef,
    sourceProjectVersion: result.sourceProjectVersion,
    sourceProjectDigest: result.sourceProjectDigest,
    sourceRefs,
  });
  return {
    ...contribution,
    identity: {
      ...contribution.identity,
      contributionId: `owner-project-contribution:${contributionDigest}`,
      contributionDigest,
    },
    source: { ...contribution.source, sourceRefs },
  };
};

export const prepareSpecializedOwnerProjectContribution = (input: {
  result: SpecializedOwnerResult;
  current: ResearchProjectOwnerProjection;
}): OwnerProjectContributionPreparation => {
  const resultRef = `${input.result.resultId}@${input.result.resultVersion}`;
  if (input.result.resultKind !== "PROJECT_CONTRIBUTION_CANDIDATE" || !input.result.projectContribution) {
    return { status: "NOT_A_PROJECT_CONTRIBUTION", resultRef, staleReasons: [], candidate: null, humanDecisionRequired: true, projectWriteAuthorized: false };
  }
  const freshness = assessSpecializedOwnerResultFreshness(input.result, input.current);
  if (freshness.status === "STALE_OWNER_RESULT") {
    return { status: "STALE_OWNER_RESULT", resultRef, staleReasons: freshness.staleReasons, candidate: null, humanDecisionRequired: true, projectWriteAuthorized: false };
  }
  return {
    status: "READY_FOR_HUMAN_DECISION",
    resultRef,
    staleReasons: [],
    candidate: prepareResearchProjectContributionCandidate(projectContributionWithOwnerTrace(input.result), input.current),
    humanDecisionRequired: true,
    projectWriteAuthorized: false,
  };
};

export const confirmSpecializedOwnerProjectContribution = (input: {
  result: SpecializedOwnerResult;
  current: ResearchProjectOwnerProjection;
  authority: ResearchProjectOwnerAuthority;
  confirmedAt: string;
}): ResearchProjectOwnerProjection => {
  const preparation = prepareSpecializedOwnerProjectContribution({ result: input.result, current: input.current });
  if (preparation.status === "STALE_OWNER_RESULT") throw new Error("STALE_OWNER_RESULT");
  if (preparation.status !== "READY_FOR_HUMAN_DECISION") throw new Error("SPECIALIZED_OWNER_RESULT_HAS_NO_PROJECT_CONTRIBUTION");
  return confirmResearchProjectContribution({
    contribution: projectContributionWithOwnerTrace(input.result),
    current: input.current,
    projectId: input.current.projectId,
    authority: input.authority,
    confirmedAt: input.confirmedAt,
  });
};

export const rejectSpecializedOwnerProjectContribution = (input: {
  result: SpecializedOwnerResult;
  current: ResearchProjectOwnerProjection;
  authority: ResearchProjectOwnerAuthority;
  rejectedAt: string;
}) => {
  const preparation = prepareSpecializedOwnerProjectContribution({ result: input.result, current: input.current });
  if (preparation.status === "STALE_OWNER_RESULT") throw new Error("STALE_OWNER_RESULT");
  if (preparation.status !== "READY_FOR_HUMAN_DECISION") throw new Error("SPECIALIZED_OWNER_RESULT_HAS_NO_PROJECT_CONTRIBUTION");
  return rejectResearchProjectContribution({
    contribution: projectContributionWithOwnerTrace(input.result),
    current: input.current,
    authority: input.authority,
    rejectedAt: input.rejectedAt,
  });
};
