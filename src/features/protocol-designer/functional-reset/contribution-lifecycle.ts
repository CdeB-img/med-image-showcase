import { logicalDigest } from "../../knowledge-engine/canonical.js";
import {
  prepareResearchProjectContributionCandidate,
  scopeResearchProjectContribution,
  type ResearchProjectContributionCandidate,
} from "../../research-project-construction/contribution-owner-boundary.js";
import type { ResearchProjectOwnerProjection } from "../../research-project-construction/contribution-owner-boundary.js";
import type { ScientificInterpretationContributionEnvelope, ScientificInterpretationConversation } from "../../scientific-interpretation/contracts.js";
import type { HumanDecisionEnvelope } from "../human-decision.js";
import type { PersistentDeltaValidation } from "../product-bridge.js";
export { buildScientificDiscussionContext } from "./contribution-discussion-context.js";
export type { ScientificDiscussionContext } from "./contribution-discussion-context.js";

// Session-consumer lifecycle only. These records never become Project objects,
// never perform adoption, and never schedule a provider or an extraction.
export type CandidateBaseProject = Readonly<Pick<ResearchProjectOwnerProjection, "projectId" | "versionId" | "projectDigest">> | null;
export type CandidateDependencyBinding = Readonly<{
  ref: string;
  version: string;
  digest: string;
  actuality: "CURRENT" | "STALE" | "SUPERSEDED";
}>;
export type CandidateDownstreamState = "PENDING_DOWNSTREAM" | "DOWNSTREAM_FAILED_NOT_PRESENTED" | "PRESENTED";
export type CandidateDownstreamFailure = Readonly<{
  stage: string;
  code: string;
  occurredAt: string;
  candidateRef: string;
  sourceTurnRef: string;
  traceRunId: string | null;
}>;
export type RetainedContributionCandidate = Readonly<{
  candidateRef: string;
  candidateDigest: string;
  contribution: ScientificInterpretationContributionEnvelope;
  candidate: ResearchProjectContributionCandidate;
  sourceTurnRef: string;
  sourceDigest: string;
  baseProject: CandidateBaseProject;
  dependencyBindings: readonly CandidateDependencyBinding[];
  validatorRef: string;
  validation: PersistentDeltaValidation | Pick<PersistentDeltaValidation, "valid" | "blocks">;
  traceRunId: string | null;
  retainedAt: string;
  downstreamState: CandidateDownstreamState;
  presentedAt: string | null;
  failure: CandidateDownstreamFailure | null;
  humanDecision: HumanDecisionEnvelope | null;
  actuality: "CURRENT" | "STALE" | "SUPERSEDED";
  // Append-only facts for this contribution identity, not a second TRACE system.
  // External tracing records these facts through the existing TRACE adapter.
  history: readonly Readonly<{
    recordedAt: string;
    downstreamState: CandidateDownstreamState;
    failure: CandidateDownstreamFailure | null;
    humanDecisionRef: string | null;
    actuality: "CURRENT" | "STALE" | "SUPERSEDED";
    reasonRef: string | null;
  }>[];
}>;

const detached = <T>(value: T): T => structuredClone(value);
const projectBinding = (project: CandidateBaseProject): CandidateBaseProject => project ? {
  projectId: project.projectId, versionId: project.versionId, projectDigest: project.projectDigest,
} : null;
const same = (left: unknown, right: unknown) => logicalDigest(left) === logicalDigest(right);
const dependencyIdentity = (bindings: readonly CandidateDependencyBinding[]) => bindings
  .map(({ ref, version, digest }) => ({ ref, version, digest }))
  .sort((left, right) => left.ref.localeCompare(right.ref) || left.version.localeCompare(right.version) || left.digest.localeCompare(right.digest));

export const retainValidatedContributionCandidate = (input: {
  retained: readonly RetainedContributionCandidate[];
  contribution: ScientificInterpretationContributionEnvelope;
  candidate: ResearchProjectContributionCandidate;
  validation: PersistentDeltaValidation | Pick<PersistentDeltaValidation, "valid" | "blocks"> | null;
  validatorRef: string;
  sourceTurnRef: string;
  baseProject: CandidateBaseProject;
  dependencyBindings: readonly CandidateDependencyBinding[];
  traceRunId: string | null;
  retainedAt: string;
}): readonly RetainedContributionCandidate[] => {
  const { contribution, candidate } = input;
  const source = contribution.source.turns.find((turn) => turn.turnId === input.sourceTurnRef && turn.role === "USER");
  // A failed or absent owner validation cannot create a validated lifecycle record.
  if (!input.validation?.valid || input.validation.blocks.length
    || candidate.status !== "CANDIDATE_PENDING_HUMAN_CONFIRMATION"
    || candidate.projectWriteAuthorized !== false || contribution.epistemicBoundary.candidateIsAdopted
    || contribution.decisionBoundary.projectWriteAuthorized !== false
    || candidate.contributionRef !== contribution.identity.contributionId
    || candidate.contributionDigest !== contribution.identity.contributionDigest
    || candidate.changeSet.baseProjectVersion !== (input.baseProject?.versionId ?? null)
    || candidate.canonicalChangeSet.baseProjectVersion !== (input.baseProject?.versionId ?? null)
    || !source || !input.validatorRef.trim()) return input.retained;
  const candidateRef = candidate.contributionRef;
  const candidateDigest = logicalDigest({ contribution, candidate });
  const previous = input.retained.find((entry) => entry.candidateRef === candidateRef);
  if (previous) {
    if (previous.candidateDigest !== candidateDigest) throw new Error("CANDIDATE_IDENTITY_COLLISION");
    return input.retained;
  }
  const record: RetainedContributionCandidate = {
    candidateRef, candidateDigest, contribution, candidate,
    sourceTurnRef: input.sourceTurnRef,
    sourceDigest: logicalDigest(source.content),
    baseProject: projectBinding(input.baseProject),
    dependencyBindings: input.dependencyBindings,
    validatorRef: input.validatorRef,
    validation: input.validation,
    traceRunId: input.traceRunId,
    retainedAt: input.retainedAt,
    downstreamState: "PENDING_DOWNSTREAM",
    presentedAt: null,
    failure: null,
    humanDecision: null,
    actuality: "CURRENT",
    history: [{ recordedAt: input.retainedAt, downstreamState: "PENDING_DOWNSTREAM", failure: null, humanDecisionRef: null, actuality: "CURRENT", reasonRef: null }],
  };
  // A new ref is retained beside older refs; recency never implies replacement.
  return [...input.retained, detached(record)];
};

const updateCandidate = (
  retained: readonly RetainedContributionCandidate[],
  candidateRef: string,
  update: (record: RetainedContributionCandidate) => RetainedContributionCandidate,
) => retained.map((record) => record.candidateRef === candidateRef ? update(record) : record);

export const recordContributionDownstreamFailure = (input: {
  retained: readonly RetainedContributionCandidate[];
  candidateRef: string;
  stage: string;
  code: string;
  occurredAt: string;
}): readonly RetainedContributionCandidate[] => updateCandidate(input.retained, input.candidateRef, (record) => {
  if (!input.stage.trim() || !input.code.trim()) throw new Error("DOWNSTREAM_FAILURE_EVIDENCE_REQUIRED");
  // A failure cannot retroactively make a presented or decided candidate unseen.
  if (record.presentedAt || record.humanDecision) return record;
  const failure: CandidateDownstreamFailure = {
    stage: input.stage, code: input.code, occurredAt: input.occurredAt,
    candidateRef: record.candidateRef, sourceTurnRef: record.sourceTurnRef, traceRunId: record.traceRunId,
  };
  return {
    ...record, downstreamState: "DOWNSTREAM_FAILED_NOT_PRESENTED", failure,
    history: [...record.history, {
      recordedAt: input.occurredAt, downstreamState: "DOWNSTREAM_FAILED_NOT_PRESENTED", failure,
      humanDecisionRef: null, actuality: record.actuality, reasonRef: input.code,
    }],
  };
});

export const markContributionCandidatePresented = (input: {
  retained: readonly RetainedContributionCandidate[];
  candidateRef: string;
  presentedAt: string;
}): readonly RetainedContributionCandidate[] => updateCandidate(input.retained, input.candidateRef, (record) => {
  if (record.actuality !== "CURRENT" || record.downstreamState !== "PENDING_DOWNSTREAM"
    || record.humanDecision || record.presentedAt) return record;
  return {
    ...record, downstreamState: "PRESENTED", presentedAt: input.presentedAt, failure: null,
    history: [...record.history, {
      recordedAt: input.presentedAt, downstreamState: "PRESENTED", failure: null,
      humanDecisionRef: null, actuality: record.actuality, reasonRef: null,
    }],
  };
});

// Records an existing human decision only; it does not manufacture or engage one.
export const recordContributionCandidateHumanDecision = (input: {
  retained: readonly RetainedContributionCandidate[];
  candidateRef: string;
  decision: HumanDecisionEnvelope;
}): readonly RetainedContributionCandidate[] => updateCandidate(input.retained, input.candidateRef, (record) => {
  if (!record.presentedAt || record.downstreamState !== "PRESENTED") throw new Error("UNSEEN_CANDIDATE_HAS_NO_HUMAN_DECISION");
  if (record.actuality !== "CURRENT" || record.humanDecision
    || record.dependencyBindings.some(binding => binding.actuality !== "CURRENT")) throw new Error("NON_CURRENT_OR_DECIDED_CANDIDATE_HAS_NO_NEW_HUMAN_DECISION");
  if (!["ADOPTED", "REJECTED", "DEFERRED"].includes(input.decision.status)
    || !input.decision.actor || !input.decision.mandate || !input.decision.timestamp
    || !input.decision.targets.includes(record.candidateRef)) throw new Error("HUMAN_DECISION_BINDING_REQUIRED");
  return {
    ...record, humanDecision: detached(input.decision),
    history: [...record.history, {
      recordedAt: input.decision.timestamp, downstreamState: record.downstreamState, failure: record.failure,
      humanDecisionRef: input.decision.decisionId, actuality: record.actuality, reasonRef: input.decision.decisionId,
    }],
  };
});

export const markContributionCandidateNonCurrent = (input: {
  retained: readonly RetainedContributionCandidate[];
  candidateRef: string;
  actuality: "STALE" | "SUPERSEDED";
  reasonRef: string;
  recordedAt: string;
}): readonly RetainedContributionCandidate[] => updateCandidate(input.retained, input.candidateRef, (record) => {
  if (!input.reasonRef.trim()) throw new Error("CANDIDATE_INVALIDATION_EVIDENCE_REQUIRED");
  return {
    ...record, actuality: input.actuality,
    history: [...record.history, {
      recordedAt: input.recordedAt, downstreamState: record.downstreamState, failure: record.failure,
      humanDecisionRef: record.humanDecision?.decisionId ?? null, actuality: input.actuality, reasonRef: input.reasonRef,
    }],
  };
});

export const evaluateContributionCandidateReuse = (input: {
  retained: RetainedContributionCandidate;
  currentProject: ResearchProjectOwnerProjection | null;
  currentConversation: ScientificInterpretationConversation;
  requestingTurnRef: string;
  explicitResumeLink?: { originalSourceTurnRef: string; requestingTurnRef: string; decisionRef: string };
  currentDependencyBindings: readonly CandidateDependencyBinding[];
  invalidatedSourceTurnRefs: readonly string[];
  currentValidatorRef: string;
  // The existing applicable validator must have been rerun by its owner. Absence
  // is UNKNOWN, never a permission to re-extract or to consume the candidate.
  revalidation: PersistentDeltaValidation | null;
}): Readonly<{ status: "REUSABLE" | "FORBIDDEN_OR_UNKNOWN"; reasons: readonly string[]; reextractionRequired: false | "UNKNOWN"; resumeStage: string | null }> => {
  const record = input.retained;
  const reasons: string[] = [];
  if (record.actuality !== "CURRENT") reasons.push("CANDIDATE_NOT_CURRENT");
  if (record.downstreamState !== "DOWNSTREAM_FAILED_NOT_PRESENTED") reasons.push("NO_FAILED_DOWNSTREAM_TO_RESUME");
  if (record.humanDecision) reasons.push("HUMAN_DECISION_ALREADY_RECORDED");
  if (!same(record.baseProject, projectBinding(input.currentProject))) reasons.push("BASE_PROJECT_BINDING_CHANGED");
  if (!same(record.candidateDigest, logicalDigest({ contribution: record.contribution, candidate: record.candidate }))) reasons.push("CANDIDATE_CONTENT_CHANGED");
  const source = input.currentConversation.turns.find((turn) => turn.turnId === record.sourceTurnRef && turn.role === "USER");
  if (!source || logicalDigest(source.content) !== record.sourceDigest
    || input.currentConversation.conversationId !== record.contribution.source.conversationId) reasons.push("SOURCE_CONTEXT_NOT_PROVEN");
  if (input.invalidatedSourceTurnRefs.includes(record.sourceTurnRef)) reasons.push("SOURCE_INVALIDATED_BY_CORRECTION");
  const requestingTurn = input.currentConversation.turns.find((turn) => turn.turnId === input.requestingTurnRef && turn.role === "USER");
  const explicitLink = input.explicitResumeLink;
  if (!requestingTurn || (input.requestingTurnRef !== record.sourceTurnRef && (!explicitLink
    || explicitLink.originalSourceTurnRef !== record.sourceTurnRef
    || explicitLink.requestingTurnRef !== input.requestingTurnRef
    || !explicitLink.decisionRef.trim()))) reasons.push("SOURCE_OR_EXPLICIT_RESUME_LINK_REQUIRED");
  if (record.dependencyBindings.some((binding) => binding.actuality !== "CURRENT")
    || input.currentDependencyBindings.some((binding) => binding.actuality !== "CURRENT")
    || !same(dependencyIdentity(record.dependencyBindings), dependencyIdentity(input.currentDependencyBindings))) reasons.push("DEPENDENCY_BINDING_CHANGED_OR_NOT_CURRENT");
  if (record.validatorRef !== input.currentValidatorRef || !input.currentValidatorRef.trim()) reasons.push("VALIDATOR_CONTRACT_CHANGED");
  if (!input.revalidation?.valid || input.revalidation.blocks.length) reasons.push("APPLICABLE_REVALIDATION_NOT_SATISFIED");
  const prepared = prepareResearchProjectContributionCandidate(record.contribution, input.currentProject);
  if (prepared.status !== "CANDIDATE_PENDING_HUMAN_CONFIRMATION" || !same(prepared, record.candidate)) reasons.push("CANDIDATE_PREPARATION_CHANGED_OR_INVALID");
  return reasons.length ? { status: "FORBIDDEN_OR_UNKNOWN", reasons, reextractionRequired: "UNKNOWN", resumeStage: null }
    : { status: "REUSABLE", reasons: [], reextractionRequired: false, resumeStage: record.failure?.stage ?? null };
};
export const resumeContributionCandidateDownstreamProcessing = (input:
  Omit<Parameters<typeof evaluateContributionCandidateReuse>[0], "retained"> & {
    retained: readonly RetainedContributionCandidate[];
    candidateRef: string;
    resumeDecisionRef: string;
    resumedAt: string;
  },
): Readonly<{
  status: "RESUMED" | "FORBIDDEN_OR_UNKNOWN";
  retained: readonly RetainedContributionCandidate[];
  reasons: readonly string[];
  resumeStage: string | null;
}> => {
  const record = input.retained.find((candidate) => candidate.candidateRef === input.candidateRef);
  if (!record) return { status: "FORBIDDEN_OR_UNKNOWN", retained: input.retained, reasons: ["CANDIDATE_REF_NOT_FOUND"], resumeStage: null };
  // This is an operational user-resume reference, not a manufactured Human
  // Decision Envelope and not permission to adopt or call a provider.
  if (!input.resumeDecisionRef.trim() || !input.resumedAt.trim()
    || (input.explicitResumeLink && input.explicitResumeLink.decisionRef !== input.resumeDecisionRef)) {
    return { status: "FORBIDDEN_OR_UNKNOWN", retained: input.retained, reasons: ["EXPLICIT_RESUME_EVIDENCE_REQUIRED"], resumeStage: null };
  }
  // Deliberately recompute the gate from the retained record and live bindings;
  // a caller cannot pass a previously certified boolean to bypass currentness.
  const evaluated = evaluateContributionCandidateReuse({ ...input, retained: record });
  if (evaluated.status !== "REUSABLE" || !evaluated.resumeStage) return {
    status: "FORBIDDEN_OR_UNKNOWN", retained: input.retained,
    reasons: evaluated.reasons.length ? evaluated.reasons : ["FAILED_DOWNSTREAM_STAGE_MISSING"], resumeStage: null,
  };
  return {
    status: "RESUMED",
    retained: updateCandidate(input.retained, input.candidateRef, (current) => ({
      ...current,
      downstreamState: "PENDING_DOWNSTREAM",
      failure: null,
      history: [...current.history, {
        recordedAt: input.resumedAt, downstreamState: "PENDING_DOWNSTREAM", failure: null,
        humanDecisionRef: null, actuality: current.actuality, reasonRef: input.resumeDecisionRef,
      }],
    })),
    reasons: [],
    resumeStage: evaluated.resumeStage,
  };
};

/** Preserve undecided native review changes after a scoped human decision. */
export const retainUndecidedContributionScope = (input: {
  record: RetainedContributionCandidate;
  currentBefore: ResearchProjectOwnerProjection | null;
  currentAfter: ResearchProjectOwnerProjection | null;
  settledChangeRefs: readonly string[];
  decisionSourceRef: string;
  retainedAt: string;
}): RetainedContributionCandidate | null => {
  const remaining = input.record.candidate.humanReviewProjection.coveredChangeRefs.filter(ref => !input.settledChangeRefs.includes(ref));
  if (!remaining.length) return null;
  if (input.record.dependencyBindings.length && input.currentBefore?.versionId !== input.currentAfter?.versionId) {
    throw new Error("UNDECIDED_SCOPE_DEPENDENCIES_REQUIRE_REVALIDATION");
  }
  const contribution = scopeResearchProjectContribution({ contribution: input.record.contribution,
    current: input.currentBefore, changeRefs: remaining, reasonRef: input.decisionSourceRef });
  const candidate = prepareResearchProjectContributionCandidate(contribution, input.currentAfter);
  if (candidate.status !== "CANDIDATE_PENDING_HUMAN_CONFIRMATION") throw new Error("UNDECIDED_SCOPE_REQUIRES_NATIVE_REVIEW");
  const retained = retainValidatedContributionCandidate({ retained: [], contribution, candidate,
    validation: input.record.validation, validatorRef: `${input.record.validatorRef}:NATIVE_REVIEW_SUBSET`,
    sourceTurnRef: input.record.sourceTurnRef, baseProject: input.currentAfter,
    dependencyBindings: input.record.dependencyBindings, traceRunId: null, retainedAt: input.retainedAt });
  if (!retained[0]) throw new Error("UNDECIDED_SCOPE_PROVENANCE_REQUIRED");
  return retained[0];
};
