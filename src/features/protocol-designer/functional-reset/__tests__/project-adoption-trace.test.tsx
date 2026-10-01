import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { afterEach, describe, expect, it, vi } from "vitest";
import { assertResearchProjectSourceMaterialization, confirmResearchProjectContribution } from "@/features/research-project-construction";
import * as humanDecision from "../../human-decision";
import * as canonicalOwner from "@/features/research-project-construction/canonical-project-backbone";
import * as materializationOwner from "@/features/research-project-construction/contribution-owner-boundary";
import * as scientificTrace from "../../scientific-execution-trace";
import { createProductTraceRunId, rehydrateScientificExecutionTraceLedger } from "../../scientific-execution-trace";
import { acceptWorkingDraftUpdate, prepareWorkingDraftRequest, recommendedWorkingScope } from "../continuous-project-build";
import { addProjectPreparation, captureProjectPreparation, consumeProjectPreparation, projectPreparationReview, recordPreparationDecision } from "../project-preparation-lifecycle";
import { propagateStudyProposalDecision, selectedStudyProposalAtoms, studyProposalAtomItemRef } from "../study-proposal-standard";
import { createFunctionalResetSession, loadFunctionalResetSession, persistFunctionalResetSession, type FunctionalResetSession } from "../session";
import { createProjectAdoptionTrace, sanitizedAdoptionStackTop } from "../project-adoption-trace";
import * as legacyTrace from "../end-to-end-trace-adapter";
import ProtocolDesignerWorkspace from "../ProtocolDesignerWorkspace";
import { controlledStudyProposal, DOMAINS } from "./study-proposal-fixtures";
const provider = vi.hoisted(() => vi.fn());
vi.mock("../../product-bridge-client", async original => ({ ...await original<object>(),
  requestProtocolDesignerBridge: provider, readWorkingDraftPreparation: provider,
  ensureServerProjectSnapshot: vi.fn(async () => undefined) }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllEnvs(); provider.mockReset(); localStorage.clear(); });

// Deterministic existing owners only. No provider, new human scenario or raw run replay.
const ready = (base: FunctionalResetSession, add = false) => {
  const prep = captureProjectPreparation(base), request = prep.checkpoint!.request;
  const proposal = controlledStudyProposal(prepareWorkingDraftRequest(request).inputDigest, DOMAINS[1]);
  const optionalRefs = new Set(proposal.arbitrations.flatMap(a => a.options
    .filter(o => !a.recommendedRefs.includes(o.ref)).flatMap(o => o.atomRefs)));
  const updatedAtoms = add ? proposal.atoms.filter(a => a.ref === "practical" && !optionalRefs.has(a.ref)) : [];
  for (const atom of updatedAtoms) atom.content += " — précision synthétique explicitement confirmée";
  const accepted = acceptWorkingDraftUpdate({ requestType: "STUDY_UPDATE", proposal,
    explicitDecisions: updatedAtoms.map(a => ({
      atomRef: a.ref, sourceTurnRef: "u2", quote: "LOCAL_SYNTHETIC — ajout organisationnel" })),
    inferredAtomRefs: [], rejectedAtomRefs: [] }, request);
  return consumeProjectPreparation(addProjectPreparation(base, prep), prep.checkpoint!.preparationId,
    { workingDraftUpdate: accepted.update, workingStudyProposal: accepted.composition });
};
const secondReady = () => {
  const initial = createFunctionalResetSession();
  initial.runtimeTurns = [
    { turnId: "u1", role: "USER", content: DOMAINS[1].text, createdAt: initial.createdAt },
    { turnId: "noxia-turn:11111111-1111-4111-8111-111111111111", role: "NOXIA", content: "LOCAL_SYNTHETIC", createdAt: initial.createdAt },
  ];
  const first = ready(initial), review = projectPreparationReview(first)!;
  const project = confirmResearchProjectContribution({ contribution: review.prepared.contribution, current: null,
    projectId: first.projectId, authority: first.projectAuthority, confirmedAt: first.updatedAt,
    reviewedProjection: review.prepared.candidate.humanReviewProjection,
    selectedChangeRefs: review.prepared.candidate.humanReviewProjection.coveredChangeRefs });
  const scope = recommendedWorkingScope(review.composition);
  const adopted = { ...recordPreparationDecision(first, review.checkpoint.preparationId, "ADOPTED"), project,
    studyProposal: propagateStudyProposalDecision(review.composition, project, review.prepared.candidate, null,
      selectedStudyProposalAtoms(review.composition, scope.selectedOptionRefs, scope.selectedAtomRefs), scope.selectedOptionRefs, first.runtimeTurns[0]),
    runtimeTurns: [...first.runtimeTurns,
      { turnId: "u2", role: "USER" as const, content: "LOCAL_SYNTHETIC — ajout organisationnel", createdAt: first.updatedAt },
      { turnId: "noxia-turn:22222222-2222-4222-8222-222222222222", role: "NOXIA" as const, content: "LOCAL_SYNTHETIC", createdAt: first.updatedAt }],
  };
  const result = ready(adopted, true);
  expect(projectPreparationReview(result)).not.toBeNull();
  return result;
};
const adoptionEvents = (state: FunctionalResetSession) => state.scientificExecutionTraceLedger.events
  .filter(e => e.technicalMetadata.humanAttemptId);
const mount = (initial: FunctionalResetSession, persist = (_next: FunctionalResetSession) => true) => {
  vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
  vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA");
  let state = initial;
  render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={initial} onSessionChange={next => {
    state = next; return persist(next);
  }} /></HelmetProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Valider ces choix" }));
  return () => state;
};
const failure = (state: FunctionalResetSession) => adoptionEvents(state).find(e => e.status === "FAILED")!;

describe("passive Project-v2 adoption TRACE — no provider calls", () => {
  it("resolves the complete retained snapshot through the native materialization owner", () => {
    const initial = secondReady(), review = projectPreparationReview(initial)!;
    const candidate = review.prepared.candidate;
    const project = confirmResearchProjectContribution({ contribution: review.prepared.contribution, current: initial.project,
      projectId: initial.projectId, authority: initial.projectAuthority, confirmedAt: initial.updatedAt,
      reviewedProjection: candidate.humanReviewProjection, selectedChangeRefs: candidate.humanReviewProjection.coveredChangeRefs });
    const invalid = candidate.changeSet.changes.filter(change => change.operation === "NO_CHANGE").flatMap(change => {
      try { assertResearchProjectSourceMaterialization({ candidate, project, previousProject: initial.project,
        contribution: review.prepared.contribution, sourceItemRefs: change.proposedElement!.sourceItemIds }); return []; }
      catch (error) { return [{ identity: change.semanticIdentity, previousId: change.previousElement?.elementId,
        proposedId: change.proposedElement?.elementId, error: (error as Error).message }]; }
    });
    expect(invalid).toEqual([]);
    const scope = recommendedWorkingScope(review.composition);
    const declared = new Set(review.prepared.contribution.scientificContent.candidateObjects.map(item => item.itemId));
    expect(selectedStudyProposalAtoms(review.composition, scope.selectedOptionRefs, scope.selectedAtomRefs)
      .filter(ref => !declared.has(studyProposalAtomItemRef(review.composition, ref)))).toEqual([]);
    propagateStudyProposalDecision(review.composition, project, candidate, initial.project,
      selectedStudyProposalAtoms(review.composition, scope.selectedOptionRefs, scope.selectedAtomRefs), scope.selectedOptionRefs,
      initial.runtimeTurns.find(turn => turn.turnId === "u2"), review.prepared.contribution);
  });
  it("READY_FOR_REVIEW → confirmation → envelope → apply → write → v2, with v1 immutable and complete scope", async () => {
    const initial = secondReady(), before = JSON.stringify(initial.project);
    const review = projectPreparationReview(initial)!, get = mount(initial, next => {
      persistFunctionalResetSession(localStorage, next); return true;
    });
    await waitFor(() => expect(get().project?.revision).toBe(2));
    expect(JSON.stringify(initial.project)).toBe(before);
    expect(adoptionEvents(get()).map(e => e.common?.stage)).toEqual([
      "HUMAN_CONFIRMATION_RECEIVED", "HUMAN_DECISION_ENVELOPE_CREATED", "PROJECT_APPLY_STARTED",
      "PROJECT_VERSION_WRITE_STARTED", "PROJECT_VERSION_WRITE_SUCCEEDED",
    ]);
    expect(adoptionEvents(get()).every(e => e.runId === createProductTraceRunId(initial.sessionId, "u2"))).toBe(true);
    const metadata = adoptionEvents(get())[0].technicalMetadata;
    expect(metadata).toMatchObject({ sessionId: initial.sessionId, clientPreparationId: review.checkpoint.preparationId,
      canonicalReviewDecisionCount: review.prepared.candidate.humanReviewProjection.expectedChangeRefs.length,
      coveredChangeRefCount: review.prepared.candidate.humanReviewProjection.coveredChangeRefs.length,
      submittedChangeRefCount: review.prepared.candidate.humanReviewProjection.coveredChangeRefs.length });
    expect(provider).not.toHaveBeenCalled();
    expect(loadFunctionalResetSession(localStorage, undefined, true).project).toEqual(get().project);
    expect(get().studyProposal?.sourceProject?.versionId).toBe(get().project?.versionId);
    expect(adoptionEvents(get()).filter(event => event.status === "FAILED").map(event => ({ owner: event.technicalMetadata.firstFailedOwner,
      fn: event.technicalMetadata.failureFunction, code: event.technicalMetadata.internalErrorCode }))).toEqual([]);
    // The synthetic preparation has no bridgeTrace correlation. Exercise the
    // existing adapter explicitly with the same already-created native run.
    const projectionLedger = legacyTrace.recordProjectAdoptionTrace({ ledger: get().scientificExecutionTraceLedger,
      traceRunId: createProductTraceRunId(initial.sessionId, "u2"), conversationId: initial.conversationId,
      recordedAt: get().updatedAt, contribution: get().currentContribution!, project: get().project!,
      previousProjectExisted: true, queryNavigation: get().queryNavigation!, documents: get().documents });
    expect(projectionLedger.events.find(event => event.common?.stage === "PROJECT_VERSION_REVISED")?.status)
      .toBe("PROJECTED_PENDING_PERSISTENCE");
    expect(rehydrateScientificExecutionTraceLedger(JSON.parse(JSON.stringify(get().scientificExecutionTraceLedger))))
      .toEqual(get().scientificExecutionTraceLedger);
  });

  it("an invalid source binding remains fail-closed: v2 projected only, no version write or partial adoption", async () => {
    const initial = secondReady(), before = JSON.stringify(initial.project), validate = materializationOwner.assertResearchProjectSourceMaterialization;
    vi.spyOn(materializationOwner, "assertResearchProjectSourceMaterialization")
      .mockImplementation(input => validate({ ...input, sourceItemRefs: [] }));
    const get = mount(initial, next => { persistFunctionalResetSession(localStorage, next); return true; });
    await waitFor(() => expect(failure(get())).toBeDefined());
    expect(failure(get()).technicalMetadata).toMatchObject({ failureFunction: "propagateStudyProposalDecision",
      failureInvariant: "PROJECT_SOURCE_MATERIALIZATION_VALID", internalErrorCode: "STUDY_PROPOSAL_MATERIALIZATION_BINDING_INVALID" });
    expect(adoptionEvents(get()).some(event => event.common?.stage === "PROJECT_VERSION_WRITE_STARTED")).toBe(false);
    expect(JSON.stringify(get().project)).toBe(before);
    expect(loadFunctionalResetSession(localStorage, undefined, true).project?.versionId).toBe(initial.project?.versionId);
    expect(projectPreparationReview(get())).not.toBeNull();
    expect(provider).not.toHaveBeenCalled();
  });

  it("records the exact envelope-construction failure before apply", async () => {
    const initial = secondReady();
    vi.spyOn(humanDecision, "createHumanDecisionCandidate").mockImplementation(() => { throw new Error("HUMAN_ENVELOPE_SYNTHETIC_FAILURE"); });
    const get = mount(initial);
    await waitFor(() => expect(failure(get())).toBeDefined());
    expect(failure(get()).technicalMetadata).toMatchObject({ firstFailedStage: "HUMAN_DECISION_ENVELOPE_CREATED",
      firstFailedOwner: "RESEARCH_PROJECT", failureFunction: "createHumanDecisionCandidate",
      failureInvariant: "VALID_HUMAN_DECISION_ENVELOPE", internalErrorCode: "HUMAN_ENVELOPE_SYNTHETIC_FAILURE" });
    expect(adoptionEvents(get()).some(e => e.common?.stage === "PROJECT_APPLY_STARTED")).toBe(false);
    expect(get().project).toEqual(initial.project); expect(provider).not.toHaveBeenCalled();
  });

  it("records the canonical apply failure with an already-created envelope", async () => {
    const initial = secondReady();
    vi.spyOn(canonicalOwner, "applyCanonicalProjectChangeSet").mockImplementation(() => { throw new Error("PROJECT_APPLY_SYNTHETIC_FAILURE"); });
    const get = mount(initial);
    await waitFor(() => expect(failure(get())).toBeDefined());
    expect(failure(get()).technicalMetadata).toMatchObject({ firstFailedStage: "PROJECT_APPLY_STARTED",
      failureFunction: "applyCanonicalProjectChangeSet", internalErrorCode: "PROJECT_APPLY_SYNTHETIC_FAILURE" });
    expect(failure(get()).technicalMetadata.humanDecisionEnvelopeId).not.toBe("UNKNOWN");
    expect(adoptionEvents(get()).some(e => e.common?.stage === "PROJECT_VERSION_WRITE_STARTED")).toBe(false);
    expect(get().project).toEqual(initial.project); expect(provider).not.toHaveBeenCalled();
  });

  it("records a rejected persistence acknowledgement, expected v2 versus actual preserved v1", async () => {
    const initial = secondReady();
    const get = mount(initial, next => next.project?.revision !== 2);
    await waitFor(() => expect(failure(get())).toBeDefined());
    expect(failure(get()).common?.stage).toBe("PROJECT_VERSION_WRITE_FAILED");
    expect(failure(get()).technicalMetadata).toMatchObject({ firstFailedStage: "PROJECT_VERSION_WRITE_STARTED",
      failureFunction: "onSessionChange", internalErrorCode: "PROJECT_PERSISTENCE_FAILED",
      expectedProjectVersion: `${initial.projectId}:version:2`, actualProjectVersion: initial.project!.versionId,
      actualProjectDigest: initial.project!.projectDigest });
    expect(get().project).toEqual(initial.project);
    expect(adoptionEvents(get()).some(e => e.common?.stage === "PROJECT_VERSION_WRITE_SUCCEEDED")).toBe(false);
    expect(provider).not.toHaveBeenCalled();
  });

  it("captures stale base identity without repairing or retrying it", () => {
    const initial = secondReady(), observation = createProjectAdoptionTrace(initial, projectPreparationReview(initial));
    observation.received();
    observation.at("PROJECT_APPLY_STARTED", "confirmContribution", "PROJECT_BASE_UNCHANGED_DURING_HUMAN_REVIEW");
    observation.fail(new Error("PROJECT_CHANGED_DURING_HUMAN_REVIEW"), { ...initial.project!, versionId: "project:external:version:2", projectDigest: "ke1-external" });
    const event = observation.ledger().events.at(-1)!;
    expect(event.technicalMetadata).toMatchObject({ expectedProjectVersion: initial.project!.versionId,
      actualProjectVersion: "project:external:version:2", expectedProjectDigest: initial.project!.projectDigest,
      actualProjectDigest: "ke1-external", internalErrorCode: "PROJECT_CHANGED_DURING_HUMAN_REVIEW" });
    expect(initial.project?.revision).toBe(1); expect(provider).not.toHaveBeenCalled();
  });

  it("does not let a legacy TRACE projection failure veto adoption", async () => {
    const initial = secondReady();
    vi.spyOn(legacyTrace, "recordProjectAdoptionTrace").mockImplementation(() => { throw new Error("SCIENTIFIC_TRACE_UNBOUNDED_TEXT_FORBIDDEN"); });
    const get = mount(initial);
    await waitFor(() => expect(get().project?.revision).toBe(2));
    expect(failure(get()).technicalMetadata).toMatchObject({ firstFailedOwner: "TRACE",
      failureFunction: "recordProjectAdoptionTrace", internalErrorCode: "SCIENTIFIC_TRACE_UNBOUNDED_TEXT_FORBIDDEN" });
    expect(adoptionEvents(get()).at(-1)?.common?.stage).toBe("PROJECT_VERSION_WRITE_SUCCEEDED");
    expect(provider).not.toHaveBeenCalled();
  });

  it("preserves the exact owner result even if its optional observer throws", () => {
    const initial = secondReady(), review = projectPreparationReview(initial)!;
    const input = { contribution: review.prepared.contribution, current: initial.project, projectId: initial.projectId,
      authority: initial.projectAuthority, confirmedAt: initial.updatedAt,
      reviewedProjection: review.prepared.candidate.humanReviewProjection,
      selectedChangeRefs: review.prepared.candidate.humanReviewProjection.coveredChangeRefs };
    expect(confirmResearchProjectContribution({ ...input, observeAdoption: () => { throw new Error("TRACE_ONLY_FAILURE"); } }))
      .toEqual(confirmResearchProjectContribution(input));
  });

  it("records a lifecycle TRACE failure passively and still adopts once", async () => {
    const initial = secondReady(), append = scientificTrace.appendProductTraceStage;
    vi.spyOn(scientificTrace, "appendProductTraceStage").mockImplementationOnce(() => { throw new Error("SCIENTIFIC_TRACE_EVENT_INVALID"); })
      .mockImplementation(append);
    const get = mount(initial);
    await waitFor(() => expect(get().project?.revision).toBe(2));
    expect(failure(get()).technicalMetadata).toMatchObject({ firstFailedOwner: "TRACE",
      failureFunction: "appendProductTraceStage", internalErrorCode: "SCIENTIFIC_TRACE_EVENT_INVALID" });
    expect(adoptionEvents(get()).filter(e => e.common?.stage === "PROJECT_VERSION_WRITE_SUCCEEDED")).toHaveLength(1);
    expect(provider).not.toHaveBeenCalled();
  });

  it("retains bounded identifiers only, never error text, science, secret or full stack", () => {
    const initial = secondReady(), observation = createProjectAdoptionTrace(initial, projectPreparationReview(initial));
    const error = new Error("PRIVATE_SCIENCE: dose confidentielle\nAuthorization: Bearer sk-secretvalue123456");
    error.stack = `${error.message}\n    at applyCanonicalProjectChangeSet (https://example.test/ProjectOwner.ts:12:34)\n    at SECRET_FRAME`;
    observation.received(); observation.fail(error, initial.project);
    const events = observation.ledger().events.filter(e => e.technicalMetadata.humanAttemptId);
    const text = JSON.stringify(events);
    for (const forbidden of ["dose confidentielle", "PRIVATE_SCIENCE", "Bearer", "sk-secret", "SECRET_FRAME", DOMAINS[1].text]) expect(text).not.toContain(forbidden);
    expect(events.at(-1)?.technicalMetadata).toMatchObject({ internalErrorCode: "UNKNOWN",
      sanitizedStackTop: "applyCanonicalProjectChangeSet@ProjectOwner.ts:12:34" });
    for (const event of events) for (const value of Object.values(event.technicalMetadata)) if (typeof value === "string") {
      expect(value.length).toBeLessThanOrEqual(512); expect(value).not.toContain("\n");
    }
    expect(sanitizedAdoptionStackTop("non-error")).toBe("UNKNOWN");
  });
});
