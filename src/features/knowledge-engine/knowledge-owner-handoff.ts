import { logicalDigest, uniqueSorted } from "./canonical";
import type { KnowledgeResult, ReferenceEvidenceCandidate, ReferenceKnowledgeOwner, ReferenceSourceAnchor } from "./types";

export const KNOWLEDGE_OWNER_HANDOFF_CONTRACT = "KE001_KNOWLEDGE_OWNER_HANDOFF" as const;
export const KNOWLEDGE_OWNER_HANDOFF_VERSION = "1.0.0" as const;

export type KnowledgeProjectBinding = {
  projectId: string;
  projectVersion: string;
  projectDigest: string;
};

export type KnowledgeOwnerHandoffStatus =
  | "CURRENT"
  | "CONTEXT_INDEPENDENT"
  | "PROJECT_BINDING_UNVERIFIED"
  | "STALE_PROJECT_BINDING";

export type KnowledgeOwnerHandoff = {
  contract: typeof KNOWLEDGE_OWNER_HANDOFF_CONTRACT;
  contractVersion: typeof KNOWLEDGE_OWNER_HANDOFF_VERSION;
  handoffId: string;
  handoffDigest: string;
  sourceOwner: "KNOWLEDGE";
  targetOwner: ReferenceKnowledgeOwner;
  knowledgeResultRef: string;
  knowledgeResultDigest: string;
  knowledgeRequestRef: string;
  referenceNeedRef: string;
  projectBinding: KnowledgeProjectBinding | null;
  status: KnowledgeOwnerHandoffStatus;
  staleReasons: string[];
  sourceRefs: string[];
  sourceSnapshotRefs: string[];
  candidateRefs: string[];
  anchors: ReferenceSourceAnchor[];
  candidates: ReferenceEvidenceCandidate[];
  limitations: string[];
  uncertainty: string[];
  gaps: string[];
  readOnly: true;
  sourceDocumentAccess: "FORBIDDEN_USE_KNOWLEDGE_PROJECTION_ONLY";
  ownershipTransferred: false;
  certaintyIncreaseAuthorized: false;
  projectWriteAuthorized: false;
  humanReviewRequired: true;
  traceFacts: Array<{
    operation: "EMIT_KNOWLEDGE_HANDOFF";
    mode: "DETERMINISTIC";
    inputDigest: string;
    outputDigest: string;
  }>;
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach((nested) => deepFreeze(nested));
    Object.freeze(value);
  }
  return value;
};

const projectBindingFrom = (result: KnowledgeResult): KnowledgeProjectBinding | null => {
  const { researchProjectId, researchProjectVersion, researchProjectDigest } = result.request;
  if (!researchProjectId && !researchProjectVersion && !researchProjectDigest) return null;
  if (!researchProjectId || !researchProjectVersion || !researchProjectDigest) throw new Error("KNOWLEDGE_RESULT_PROJECT_BINDING_INCOMPLETE");
  return { projectId: researchProjectId, projectVersion: researchProjectVersion, projectDigest: researchProjectDigest };
};

const freshness = (binding: KnowledgeProjectBinding | null, currentProject?: KnowledgeProjectBinding): { status: KnowledgeOwnerHandoffStatus; staleReasons: string[] } => {
  if (!binding) return { status: "CONTEXT_INDEPENDENT", staleReasons: [] };
  if (!currentProject) return { status: "PROJECT_BINDING_UNVERIFIED", staleReasons: ["CURRENT_PROJECT_BINDING_REQUIRED"] };
  const staleReasons = [
    ...(binding.projectId === currentProject.projectId ? [] : ["PROJECT_ID_CHANGED"]),
    ...(binding.projectVersion === currentProject.projectVersion ? [] : ["PROJECT_VERSION_CHANGED"]),
    ...(binding.projectDigest === currentProject.projectDigest ? [] : ["PROJECT_DIGEST_CHANGED"]),
  ];
  return { status: staleReasons.length ? "STALE_PROJECT_BINDING" : "CURRENT", staleReasons };
};

export const createKnowledgeOwnerHandoff = (input: {
  result: KnowledgeResult;
  targetOwner: ReferenceKnowledgeOwner;
  currentProject?: KnowledgeProjectBinding;
  trace?: "ON" | "OFF";
}): Readonly<KnowledgeOwnerHandoff> => {
  const referenceNeed = input.result.request.referenceNeed;
  if (!referenceNeed) throw new Error("KNOWLEDGE_OWNER_HANDOFF_REFERENCE_NEED_REQUIRED");
  if (referenceNeed.owner !== input.targetOwner) throw new Error("KNOWLEDGE_OWNER_HANDOFF_TARGET_MISMATCH");
  const binding = projectBindingFrom(input.result);
  const assessed = freshness(binding, input.currentProject);
  const consumable = assessed.status === "CURRENT" || assessed.status === "CONTEXT_INDEPENDENT";
  const candidates = consumable ? clone(input.result.referenceEvidenceCandidates) : [];
  const anchors = candidates.map((candidate) => candidate.anchor);
  const material = {
    sourceOwner: "KNOWLEDGE" as const,
    targetOwner: input.targetOwner,
    knowledgeResultRef: input.result.resultId,
    knowledgeResultDigest: input.result.resultDigest,
    knowledgeRequestRef: input.result.request.requestId,
    referenceNeedRef: referenceNeed.needId,
    projectBinding: binding,
    status: assessed.status,
    staleReasons: assessed.staleReasons,
    sourceRefs: uniqueSorted(input.result.referenceSourceSnapshots.map((snapshot) => snapshot.sourceId)),
    sourceSnapshotRefs: uniqueSorted(input.result.referenceSourceSnapshots.map((snapshot) => snapshot.snapshotId)),
    candidateRefs: uniqueSorted(candidates.map((candidate) => candidate.candidateId)),
    anchors,
    candidates,
    limitations: uniqueSorted([
      ...input.result.limitations,
      ...input.result.referenceEvidenceCandidates.flatMap((candidate) => candidate.limitations),
      ...assessed.staleReasons,
    ]),
    uncertainty: uniqueSorted(input.result.referenceSourceSnapshots.flatMap((snapshot) => snapshot.uncertainties)),
    gaps: uniqueSorted(input.result.gaps.map((gap) => `${gap.code}:${gap.gapId}`)),
    readOnly: true as const,
    sourceDocumentAccess: "FORBIDDEN_USE_KNOWLEDGE_PROJECTION_ONLY" as const,
    ownershipTransferred: false as const,
    certaintyIncreaseAuthorized: false as const,
    projectWriteAuthorized: false as const,
    humanReviewRequired: true as const,
  };
  const handoffDigest = logicalDigest(material);
  const handoffId = `knowledge-owner-handoff:${handoffDigest}`;
  const traceFacts = input.trace === "OFF" ? [] : [{
    operation: "EMIT_KNOWLEDGE_HANDOFF" as const,
    mode: "DETERMINISTIC" as const,
    inputDigest: logicalDigest({ result: input.result.resultDigest, targetOwner: input.targetOwner, currentProject: input.currentProject }),
    outputDigest: handoffDigest,
  }];
  return deepFreeze({ contract: KNOWLEDGE_OWNER_HANDOFF_CONTRACT, contractVersion: KNOWLEDGE_OWNER_HANDOFF_VERSION, handoffId, handoffDigest, ...material, traceFacts }) as Readonly<KnowledgeOwnerHandoff>;
};

export const assessKnowledgeOwnerHandoffFreshness = (
  handoff: KnowledgeOwnerHandoff,
  currentProject: KnowledgeProjectBinding,
) => freshness(handoff.projectBinding, currentProject);
