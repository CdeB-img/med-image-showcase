import { StrictMode, useLayoutEffect } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prepareResearchProjectContributionCandidate } from "@/features/research-project-construction/contribution-owner-boundary";
import ContributionReview, { ContributionReviewPresentation } from "../ContributionReview";
import {
  markContributionCandidatePresented,
  recordContributionDownstreamFailure,
  retainValidatedContributionCandidate,
} from "../contribution-lifecycle";
import { richStudyContribution } from "./p1-behavior-01a-contract-fixtures";

const AT = "2026-09-08T12:00:00.000Z";
const LATER = "2026-09-08T12:00:01.000Z";
const network = vi.fn(() => { throw new Error("PROVIDER_CALL_FORBIDDEN_IN_PRESENTATION_TEST"); });

const fixture = () => {
  const contribution = richStudyContribution();
  const candidate = prepareResearchProjectContributionCandidate(contribution, null);
  const retained = retainValidatedContributionCandidate({
    retained: [],
    contribution,
    candidate,
    validation: {
      valid: true, acceptedChanges: [], acceptedRelations: [], acceptedTemporalQualifications: [],
      acceptedExpectedVariableOccasions: [], blocks: [], noOps: [], normalizations: [],
    },
    validatorRef: "PASS3A_LOCAL_PRESENTATION_FIXTURE@1",
    sourceTurnRef: contribution.source.turns.at(-1)!.turnId,
    baseProject: null,
    dependencyBindings: [],
    traceRunId: "trace:local-presentation",
    retainedAt: AT,
  });
  if (!retained[0]) throw new Error("TEST_VALIDATED_CANDIDATE_REQUIRED");
  let current = retained;
  const onPresented = vi.fn(() => {
    current = markContributionCandidatePresented({
      retained: current, candidateRef: candidate.contributionRef, presentedAt: LATER,
    });
  });
  const onPresentationFailure = vi.fn((failure: { stage: string; code: string }) => {
    current = recordContributionDownstreamFailure({
      retained: current, candidateRef: candidate.contributionRef,
      stage: failure.stage, code: failure.code, occurredAt: LATER,
    });
  });
  return { contribution, candidate, onPresented, onPresentationFailure, read: () => current[0] };
};

beforeEach(() => {
  network.mockClear();
  vi.stubGlobal("fetch", network);
});
afterEach(() => {
  cleanup();
  expect(network).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("PASS3A — actual Human Review presentation acknowledgement", () => {
  it("marks presented only after the unchanged real review subtree successfully commits", async () => {
    const witness = fixture();
    const before = structuredClone(witness.read());
    render(<ContributionReviewPresentation
      presentationRef="review:successful"
      onPresented={() => {
        expect(screen.getByTestId("functional-contribution-review")).toBeInTheDocument();
        witness.onPresented();
      }}
      onPresentationFailure={witness.onPresentationFailure}
      renderReview={() => <ContributionReview
        contribution={witness.contribution}
        candidate={witness.candidate}
        status="PENDING"
        onConfirm={vi.fn()} onCorrect={vi.fn()} onReject={vi.fn()}
      />}
    />);
    // Preparing an element is not yet the post-commit acknowledgement.
    expect(witness.read().downstreamState).toBe("PENDING_DOWNSTREAM");
    await waitFor(() => expect(witness.onPresented).toHaveBeenCalledTimes(1));
    expect(witness.read()).toMatchObject({ downstreamState: "PRESENTED", presentedAt: LATER, humanDecision: null });
    expect(witness.read().candidate).toEqual(before.candidate);
    expect(witness.read().baseProject).toEqual(before.baseProject);
    expect(witness.read().history).toHaveLength(2);
    expect(witness.onPresentationFailure).not.toHaveBeenCalled();
  });

  it("retains a validated candidate as not presented when a descendant renderer throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const witness = fixture();
    const before = structuredClone(witness.read());
    const ThrowingReview = () => { throw new Error("TEST_REVIEW_RENDER_FAILURE"); };
    const renderReview = () => <ThrowingReview />;
    const view = render(<ContributionReviewPresentation
      presentationRef="review:failed"
      onPresented={witness.onPresented}
      onPresentationFailure={witness.onPresentationFailure}
      renderReview={renderReview}
    />);
    await waitFor(() => expect(witness.onPresentationFailure).toHaveBeenCalledTimes(1));
    expect(witness.onPresented).not.toHaveBeenCalled();
    expect(witness.read()).toMatchObject({
      downstreamState: "DOWNSTREAM_FAILED_NOT_PRESENTED",
      presentedAt: null,
      humanDecision: null,
      failure: { stage: "PRESENTATION", code: "CONTRIBUTION_REVIEW_PRESENTATION_FAILED" },
    });
    expect(witness.read().candidate).toEqual(before.candidate);
    expect(witness.read().contribution).toEqual(before.contribution);
    expect(witness.read().sourceTurnRef).toBe(before.sourceTurnRef);
    expect(witness.read().candidateDigest).toBe(before.candidateDigest);
    expect(witness.read().history[0]).toEqual(before.history[0]);
    expect(witness.read().history).toHaveLength(2);
    // A later parent update must not silently retry the failed review.
    const shouldNotRender = vi.fn(() => <p>unexpected rerender</p>);
    view.rerender(<ContributionReviewPresentation
      presentationRef="review:failed"
      onPresented={witness.onPresented}
      onPresentationFailure={witness.onPresentationFailure}
      renderReview={shouldNotRender}
    />);
    await Promise.resolve();
    expect(shouldNotRender).not.toHaveBeenCalled();
    expect(witness.onPresented).not.toHaveBeenCalled();
    expect(witness.onPresentationFailure).toHaveBeenCalledTimes(1);
  });

  it("catches candidate preparation inside the render factory before any presentation claim", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const witness = fixture();
    render(<ContributionReviewPresentation
      presentationRef="review:preparation-failed"
      onPresented={witness.onPresented}
      onPresentationFailure={witness.onPresentationFailure}
      renderReview={() => { throw new Error("TEST_REVIEW_PROJECTION_PREPARATION_FAILURE"); }}
    />);
    await waitFor(() => expect(witness.onPresentationFailure).toHaveBeenCalledTimes(1));
    expect(witness.onPresented).not.toHaveBeenCalled();
    expect(witness.read().downstreamState).toBe("DOWNSTREAM_FAILED_NOT_PRESENTED");
  });

  it("lets a synchronous descendant layout failure win over the deferred acknowledgement", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const witness = fixture();
    const LayoutFailure = () => {
      useLayoutEffect(() => { throw new Error("TEST_REVIEW_LAYOUT_FAILURE"); }, []);
      return <p>review rendering</p>;
    };
    render(<ContributionReviewPresentation
      presentationRef="review:layout-failed"
      onPresented={witness.onPresented}
      onPresentationFailure={witness.onPresentationFailure}
      renderReview={() => <LayoutFailure />}
    />);
    await waitFor(() => expect(witness.onPresentationFailure).toHaveBeenCalledTimes(1));
    expect(witness.onPresented).not.toHaveBeenCalled();
    expect(witness.read().presentedAt).toBeNull();
  });

  it("does not acknowledge an aborted/unmounted review and remains idempotent in StrictMode", async () => {
    const aborted = fixture();
    const view = render(<ContributionReviewPresentation
      presentationRef="review:aborted"
      onPresented={aborted.onPresented}
      onPresentationFailure={aborted.onPresentationFailure}
      renderReview={() => <p>review</p>}
    />);
    view.unmount();
    await Promise.resolve();
    expect(aborted.onPresented).not.toHaveBeenCalled();
    expect(aborted.onPresentationFailure).not.toHaveBeenCalled();
    expect(aborted.read().downstreamState).toBe("PENDING_DOWNSTREAM");

    const strict = fixture();
    render(<StrictMode><ContributionReviewPresentation
      presentationRef="review:strict"
      onPresented={strict.onPresented}
      onPresentationFailure={strict.onPresentationFailure}
      renderReview={() => <p>review strict</p>}
    /></StrictMode>);
    await waitFor(() => expect(strict.onPresented).toHaveBeenCalledTimes(1));
    expect(strict.read().history).toHaveLength(2);
    expect(strict.onPresentationFailure).not.toHaveBeenCalled();
  });
});
