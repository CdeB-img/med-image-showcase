import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { prepareResearchProjectContributionCandidate } from "@/features/research-project-construction/contribution-owner-boundary";
import type { ResearchProjectOwnerProjection } from "@/features/research-project-construction";
import type { PersistentDeltaValidation } from "@/features/protocol-designer/product-bridge";
import {
  evaluateContributionCandidateReuse,
  resumeContributionCandidateDownstreamProcessing,
  markContributionCandidatePresented,
  recordContributionDownstreamFailure,
  retainValidatedContributionCandidate,
  type RetainedContributionCandidate,
} from "../contribution-lifecycle";
import { adoptBehaviorContribution, behaviorContribution, behaviorItem, behaviorTurn, richStudyContribution } from "./p1-behavior-01a-contract-fixtures";

const AT = "2026-09-08T12:00:00.000Z";
const LATER = "2026-09-08T12:00:01.000Z";
const VALIDATOR_REF = "PASS3A_LOCAL_FIXTURE_VALIDATOR@1";
// Local structural test receipt, not evidence of a provider execution.
const passedValidation = (): PersistentDeltaValidation => ({
  valid: true, acceptedChanges: [], acceptedRelations: [], acceptedTemporalQualifications: [],
  acceptedExpectedVariableOccasions: [], blocks: [], noOps: [], normalizations: [],
});
const network = vi.fn(() => { throw new Error("PROVIDER_CALL_FORBIDDEN_IN_LIFECYCLE_TEST"); });

const fixture = (candidateId = "candidate:lifecycle:1", project: ResearchProjectOwnerProjection | null = null) => {
  const contribution = project ? (() => {
    const turn = behaviorTurn(`turn:${candidateId}`, "Je veux ajouter une mesure complémentaire explicitement demandée.");
    return behaviorContribution({
      contributionId: candidateId, turns: [turn],
      candidateObjects: [behaviorItem({ itemId: `${candidateId}:measurement`, proposedType: "MEASURED_VARIABLE", content: "mesure complémentaire explicitement demandée", turnId: turn.turnId })],
    });
  })() : richStudyContribution();
  contribution.identity.contributionId = candidateId;
  contribution.identity.contributionDigest = `${candidateId}:digest`;
  const candidate = prepareResearchProjectContributionCandidate(contribution, project);
  expect(candidate.status).toBe("CANDIDATE_PENDING_HUMAN_CONFIRMATION");
  return {
    contribution, candidate, validation: passedValidation(), validatorRef: VALIDATOR_REF,
    sourceTurnRef: contribution.source.turns.at(-1)!.turnId,
    baseProject: project,
    dependencyBindings: [{ ref: "owner-result:explicit-fixture", version: "1", digest: "owner-fixture:digest", actuality: "CURRENT" as const }],
    traceRunId: "trace:local-lifecycle", retainedAt: AT,
  };
};

const failed = (input = fixture(), stage = "QUESTION_REALIZATION_REQUESTED") => {
  const retained = retainValidatedContributionCandidate({ retained: [], ...input });
  return recordContributionDownstreamFailure({ retained, candidateRef: input.candidate.contributionRef, stage, code: "LOCAL_TEST_DOWNSTREAM_FAILURE", occurredAt: LATER });
};

const reuseInput = (record: RetainedContributionCandidate, project: ResearchProjectOwnerProjection | null = null) => ({
  retained: record,
  currentProject: project,
  currentConversation: { conversationId: record.contribution.source.conversationId, language: "fr" as const, turns: record.contribution.source.turns },
  requestingTurnRef: record.sourceTurnRef,
  currentDependencyBindings: record.dependencyBindings,
  invalidatedSourceTurnRefs: [],
  currentValidatorRef: VALIDATOR_REF,
  revalidation: passedValidation(),
});

const expectNonAdopted = (records: readonly RetainedContributionCandidate[]) => {
  for (const record of records) {
    expect(record.candidate.projectWriteAuthorized).toBe(false);
    expect(record.contribution.epistemicBoundary.candidateIsAdopted).toBe(false);
    expect(record.contribution.decisionBoundary.projectWriteAuthorized).toBe(false);
    expect(record.humanDecision).toBeNull();
    expect(record.sourceTurnRef).toBe(record.contribution.source.turns.at(-1)!.turnId);
    expect(record.sourceDigest).toBe(logicalDigest(record.contribution.source.turns.at(-1)!.content));
    expect(record.candidate.contributionRef).toBe(record.contribution.identity.contributionId);
    expect(record.traceRunId).toBe("trace:local-lifecycle");
  }
  expect(network).not.toHaveBeenCalled();
};

describe("PASS3A — retained contribution lifecycle, no providers and no Project writer", () => {
  beforeEach(() => { network.mockClear(); vi.stubGlobal("fetch", network); });
  afterEach(() => { expect(network).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });

  it("CASE 1 — validated + HOW/localization success becomes presented, not adopted", () => {
    const input = fixture();
    const sourceBefore = JSON.stringify(input);
    const retained = retainValidatedContributionCandidate({ retained: [], ...input });
    const retainedBefore = JSON.stringify(retained);
    expect(retained[0]).toMatchObject({ downstreamState: "PENDING_DOWNSTREAM", presentedAt: null, humanDecision: null });
    // The consumer invokes this only after HOW, conformance and localization succeeded.
    const presented = markContributionCandidatePresented({ retained, candidateRef: input.candidate.contributionRef, presentedAt: LATER });
    expect(presented[0]).toMatchObject({ downstreamState: "PRESENTED", presentedAt: LATER, humanDecision: null });
    expect(presented[0].history.map((item) => item.downstreamState)).toEqual(["PENDING_DOWNSTREAM", "PRESENTED"]);
    expect(JSON.stringify(input)).toBe(sourceBefore);
    expect(JSON.stringify(retained)).toBe(retainedBefore);
    expectNonAdopted(presented);
  });

  it("CASE 2 — HOW failure retains a validated unseen candidate without changing Project", () => {
    const input = fixture();
    const before = JSON.stringify(input);
    const retained = failed(input);
    expect(retained).toHaveLength(1);
    expect(retained[0]).toMatchObject({ downstreamState: "DOWNSTREAM_FAILED_NOT_PRESENTED", presentedAt: null, baseProject: null, failure: { stage: "QUESTION_REALIZATION_REQUESTED", sourceTurnRef: input.sourceTurnRef, candidateRef: input.candidate.contributionRef } });
    expect(retained[0].candidate).toEqual(input.candidate);
    expect(retained[0].contribution).toEqual(input.contribution);
    expect(JSON.stringify(input)).toBe(before);
    expectNonAdopted(retained);
  });

  it("CASE 3 — successful HOW then localization failure retains the candidate unseen", () => {
    const input = fixture();
    const before = JSON.stringify(input);
    const retained = failed(input, "RESPONSE_LOCALIZED");
    expect(retained[0]).toMatchObject({ downstreamState: "DOWNSTREAM_FAILED_NOT_PRESENTED", presentedAt: null, failure: { stage: "RESPONSE_LOCALIZED", code: "LOCAL_TEST_DOWNSTREAM_FAILURE" } });
    expect(JSON.stringify(input)).toBe(before);
    expectNonAdopted(retained);
  });

  it("CASE 4 — a newer failed candidate neither deletes nor supersedes a previous candidate", () => {
    const first = fixture("candidate:older");
    const old = markContributionCandidatePresented({ retained: retainValidatedContributionCandidate({ retained: [], ...first }), candidateRef: first.candidate.contributionRef, presentedAt: LATER });
    const priorHistory = JSON.stringify(old);
    const second = fixture("candidate:newer");
    const together = retainValidatedContributionCandidate({ retained: old, ...second });
    const retained = recordContributionDownstreamFailure({ retained: together, candidateRef: second.candidate.contributionRef, stage: "QUESTION_REALIZED", code: "CONFORMANCE_REJECTED", occurredAt: LATER });
    expect(retained.map((record) => record.candidateRef)).toEqual(["candidate:older", "candidate:newer"]);
    expect(retained[0]).toEqual(old[0]);
    expect(retained[0].actuality).toBe("CURRENT");
    expect(retained[1]).toMatchObject({ downstreamState: "DOWNSTREAM_FAILED_NOT_PRESENTED", actuality: "CURRENT" });
    expect(JSON.stringify(old)).toBe(priorHistory);
    expectNonAdopted(retained);
  });

  it("CASE 5 — exact source/base/dependencies plus fresh validator receipt allows downstream-only reuse", () => {
    const retained = failed();
    const before = JSON.stringify(retained);
    const result = evaluateContributionCandidateReuse(reuseInput(retained[0]));
    expect(result).toEqual({ status: "REUSABLE", reasons: [], reextractionRequired: false, resumeStage: "QUESTION_REALIZATION_REQUESTED" });
    expect(JSON.stringify(retained)).toBe(before);
    expectNonAdopted(retained);
  });

  it("CASE 6 — changed Project version/digest prevents silent reuse", () => {
    // Setup is an explicitly human-adopted existing fixture, before the tested operation.
    const project = adoptBehaviorContribution(richStudyContribution(), null, 1);
    const retained = failed(fixture("candidate:post-adoption", project));
    const beforeProject = JSON.stringify(project);
    const beforeRetained = JSON.stringify(retained);
    const changedProject = { ...project, versionId: `${project.versionId}:changed`, projectDigest: `${project.projectDigest}:changed` };
    const result = evaluateContributionCandidateReuse(reuseInput(retained[0], changedProject));
    expect(result.status).toBe("FORBIDDEN_OR_UNKNOWN");
    expect(result.reasons).toContain("BASE_PROJECT_BINDING_CHANGED");
    expect(result.resumeStage).toBeNull();
    expect(JSON.stringify(project)).toBe(beforeProject);
    expect(JSON.stringify(retained)).toBe(beforeRetained);
    expectNonAdopted(retained);
  });

  it("CASE 7 — an explicit source invalidation forbids reuse without discarding history", () => {
    const retained = failed();
    const before = JSON.stringify(retained);
    const result = evaluateContributionCandidateReuse({ ...reuseInput(retained[0]), invalidatedSourceTurnRefs: [retained[0].sourceTurnRef] });
    expect(result.status).toBe("FORBIDDEN_OR_UNKNOWN");
    expect(result.reasons).toContain("SOURCE_INVALIDATED_BY_CORRECTION");
    expect(result.resumeStage).toBeNull();
    expect(JSON.stringify(retained)).toBe(before);
    expectNonAdopted(retained);
  });

  it("CASE 8 — absent/failed validation creates no artificial validated candidate", () => {
    const first = failed(fixture("candidate:retained"));
    const before = JSON.stringify(first);
    const input = fixture("candidate:invalid");
    for (const validation of [null, { ...passedValidation(), valid: false, blocks: ["SOURCE_CATALOG_DIGEST_MISMATCH"] }]) {
      expect(retainValidatedContributionCandidate({ retained: first, ...input, validation })).toBe(first);
    }
    expect(JSON.stringify(first)).toBe(before);
    expectNonAdopted(first);
  });



  it("explicit resume recomputes validity and re-enters only the failed downstream stage", () => {
    const retained = failed();
    const record = retained[0];
    const before = JSON.stringify(retained);
    const userResumeTurn = behaviorTurn("turn:explicit-resume", "Reprendre la présentation de cette proposition conservée.");
    const request = reuseInput(record);
    const result = resumeContributionCandidateDownstreamProcessing({
      ...request,
      retained,
      candidateRef: record.candidateRef,
      currentConversation: { ...request.currentConversation, turns: [...request.currentConversation.turns, userResumeTurn] },
      requestingTurnRef: userResumeTurn.turnId,
      explicitResumeLink: { originalSourceTurnRef: record.sourceTurnRef, requestingTurnRef: userResumeTurn.turnId, decisionRef: "user-resume:explicit-1" },
      resumeDecisionRef: "user-resume:explicit-1",
      resumedAt: "2026-09-08T12:00:02.000Z",
    });
    expect(result).toMatchObject({ status: "RESUMED", reasons: [], resumeStage: "QUESTION_REALIZATION_REQUESTED" });
    expect(result.retained[0]).toMatchObject({ downstreamState: "PENDING_DOWNSTREAM", presentedAt: null, humanDecision: null, failure: null });
    expect(result.retained[0].history.slice(0, record.history.length)).toEqual(record.history);
    expect(result.retained[0].history.at(-1)).toMatchObject({ reasonRef: "user-resume:explicit-1", downstreamState: "PENDING_DOWNSTREAM" });
    expect(result.retained[0].candidate).toEqual(record.candidate);
    expect(result.retained[0].contribution).toEqual(record.contribution);
    expect(JSON.stringify(retained)).toBe(before);
    expect(markContributionCandidatePresented({ retained, candidateRef: record.candidateRef, presentedAt: LATER })[0].downstreamState)
      .toBe("DOWNSTREAM_FAILED_NOT_PRESENTED");
    expect(markContributionCandidatePresented({ retained: result.retained, candidateRef: record.candidateRef, presentedAt: "2026-09-08T12:00:03.000Z" })[0].downstreamState)
      .toBe("PRESENTED");
    expectNonAdopted(result.retained);
  });

  it("explicit resume cannot bypass stale dependencies and preserves the failure state/history", () => {
    const retained = failed();
    const before = JSON.stringify(retained);
    const record = retained[0];
    const result = resumeContributionCandidateDownstreamProcessing({
      ...reuseInput(record),
      retained,
      candidateRef: record.candidateRef,
      currentDependencyBindings: record.dependencyBindings.map((binding) => ({ ...binding, actuality: "STALE" as const })),
      resumeDecisionRef: "user-resume:explicit-stale",
      resumedAt: "2026-09-08T12:00:02.000Z",
    });
    expect(result).toMatchObject({ status: "FORBIDDEN_OR_UNKNOWN", resumeStage: null });
    expect(result.reasons).toContain("DEPENDENCY_BINDING_CHANGED_OR_NOT_CURRENT");
    expect(result.retained).toBe(retained);
    expect(result.retained[0].downstreamState).toBe("DOWNSTREAM_FAILED_NOT_PRESENTED");
    expect(JSON.stringify(retained)).toBe(before);
    expectNonAdopted(retained);
  });
  it.each(["OWNER_STALE", "OWNER_DIGEST_CHANGED", "VALIDATOR_CHANGED", "VALIDATOR_FAILED", "SOURCE_CHANGED", "UNLINKED_NEW_TURN"])("bounded reuse also fails closed for %s", (cause) => {
    const record = failed()[0];
    const request = reuseInput(record);
    const changed = cause === "OWNER_STALE" ? { ...request, currentDependencyBindings: request.currentDependencyBindings.map((binding) => ({ ...binding, actuality: "STALE" as const })) }
      : cause === "OWNER_DIGEST_CHANGED" ? { ...request, currentDependencyBindings: request.currentDependencyBindings.map((binding) => ({ ...binding, digest: "changed" })) }
        : cause === "VALIDATOR_CHANGED" ? { ...request, currentValidatorRef: "other@2" }
          : cause === "VALIDATOR_FAILED" ? { ...request, revalidation: { ...passedValidation(), valid: false, blocks: ["INVALID"] } }
            : cause === "SOURCE_CHANGED" ? { ...request, currentConversation: { ...request.currentConversation, turns: request.currentConversation.turns.map((turn) => ({ ...turn, content: `${turn.content} correction` })) } }
              : { ...request, requestingTurnRef: "turn:unlinked" };
    expect(evaluateContributionCandidateReuse(changed).status).toBe("FORBIDDEN_OR_UNKNOWN");
  });
});
