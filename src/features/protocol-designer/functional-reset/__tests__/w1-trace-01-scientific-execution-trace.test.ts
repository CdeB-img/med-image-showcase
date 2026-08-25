import { describe, expect, it } from "vitest";
import type { ProjectContextSnapshot } from "@/features/research-project-construction";
import {
  appendScientificExecutionTraceEvent,
  buildReplayPlan,
  compareScientificRuns,
  createScientificExecutionTraceLedger,
  createScientificRunTraceRecorder,
  findScientificRunsByProject,
  findScientificTraceEventsByProject,
  findScientificTraceEventsByOwnerResult,
  findScientificTraceEventsByValidationRun,
  getScientificExecutionTraceEvent,
  getScientificRun,
  listScientificRunEvents,
  locateFirstObservableDivergence,
  recordRejectedHandoffTrace,
  rehydrateScientificExecutionTraceLedger,
  startScientificRun,
  verifyScientificExecutionTraceEventDigest,
  verifyScientificRunDigest,
  type ScientificExecutionTraceEventInput,
  type ScientificExecutionTraceLedger,
  type ScientificTraceArtifactReference,
  type ScientificTraceDependencyReference,
  type FirstDivergentStage,
} from "@/features/protocol-designer/scientific-execution-trace";
import {
  FUNCTIONAL_RESET_STORAGE_KEY,
  createFunctionalResetSession,
  loadFunctionalResetSession,
  persistFunctionalResetSession,
} from "../session";

const snapshot = Object.freeze({
  contract: "PROJECT_CONTEXT_SNAPSHOT",
  contractVersion: "0.3.0",
  owner: "RESEARCH_PROJECT",
  sourceProjectRef: "project:trace-fixture",
  sourceProjectVersion: "project-version:1",
  sourceProjectDigest: "project-digest:1",
  snapshotDigest: "snapshot-digest:1",
  readOnly: true,
}) as unknown as Readonly<ProjectContextSnapshot>;

const ownerResultRef: ScientificTraceArtifactReference = {
  artifactType: "OWNER_RESULT",
  owner: "KNOWLEDGE",
  artifactId: "knowledge-result:1",
  artifactVersion: "1",
  artifactDigest: "knowledge-result-digest:1",
};

const validationRunRef: ScientificTraceArtifactReference = {
  artifactType: "VALIDATION_RUN",
  owner: "VAL",
  artifactId: "validation-run:1",
  artifactVersion: "0.1.0",
  artifactDigest: "validation-run-digest:1",
};

const dependencyRef: ScientificTraceDependencyReference = {
  owner: "KNOWLEDGE",
  resultId: "knowledge-result:1",
  resultVersion: "1",
  resultDigest: "knowledge-result-digest:1",
};

const newRecorder = (runId = "scientific-run:1", ledger = createScientificExecutionTraceLedger("session:trace")) => createScientificRunTraceRecorder({
  ledger,
  runId,
  projectSnapshot: snapshot,
  initiatorContext: { kind: "TEST_HARNESS", initiatorRef: "W1-TRACE-01" },
  startedAt: "2026-08-25T10:00:00.000Z",
});

const ownerCompletedEvent = (overrides: Partial<ScientificExecutionTraceEventInput> = {}): ScientificExecutionTraceEventInput => ({
  eventType: "OWNER_INVOCATION_COMPLETED",
  timestamp: "2026-08-25T10:00:01.000Z",
  owner: "KNOWLEDGE",
  engine: "KNOWLEDGE_EVIDENCE",
  engineVersion: "1.0.0",
  requestRef: {
    requestId: "knowledge-request:1",
    requestSchemaVersion: "1.0.0",
    requestDigest: "knowledge-request-digest:1",
  },
  dependencyRefs: [dependencyRef],
  outputResultRef: ownerResultRef,
  status: "COMPLETED",
  sourceRefs: ["source:1"],
  sourceCount: 1,
  evidenceRefs: ["evidence:1"],
  unknownRefs: ["unknown:hash-1"],
  gapRefs: ["gap:hash-1"],
  limitationRefs: ["limitation:hash-1"],
  contradictionRefs: ["contradiction:hash-1"],
  durationMs: 12.5,
  diagnostic: { stage: "KNOWLEDGE_ENGINE", code: "OWNER_RESULT_OBSERVED" },
  ...overrides,
});

const appendOwnerCompleted = (recorder = newRecorder()) => {
  const event = recorder.append(ownerCompletedEvent());
  return { recorder, event };
};

const diagnosticStages: readonly FirstDivergentStage[] = [
  "PROJECT_CONTEXT",
  "OWNER_REQUEST_BUILDING",
  "KNOWLEDGE_ENGINE",
  "KNOWLEDGE_TO_ST_HANDOFF",
  "SCIENTIFIC_THINKING_ENGINE",
  "ST_TO_IMAGING_HANDOFF",
  "IMAGING_ENGINE",
  "VAL_INPUT_ADAPTER",
  "VAL_ENGINE",
  "REG_REQUEST_BUILDING",
  "REG_ENGINE",
  "OWNER_RESULT_PERSISTENCE",
  "STALE_VALIDATION",
  "UNKNOWN_STAGE",
];

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe("W1-TRACE-01 — passive scientific execution trace", () => {
  it("W1TRACE01-01 creates a dedicated empty append-only ledger", () => {
    const ledger = createScientificExecutionTraceLedger("session:trace");
    expect(ledger).toMatchObject({
      contract: "SCIENTIFIC_EXECUTION_TRACE_LEDGER",
      contractVersion: "0.1.0",
      appendOnly: true,
      derived: true,
      readOnlyObservedArtifacts: true,
      projectWriteAuthorized: false,
      ownerResultWriteAuthorized: false,
      validationRunWriteAuthorized: false,
    });
    expect(ledger.events).toHaveLength(0);
  });

  it("W1TRACE01-02 starts one run bound to the exact Project tuple and snapshot", () => {
    const started = startScientificRun({
      ledger: createScientificExecutionTraceLedger("session:trace"),
      runId: "scientific-run:1",
      projectSnapshot: snapshot,
      initiatorContext: { kind: "TEST_HARNESS", initiatorRef: "W1-TRACE-01" },
      startedAt: "2026-08-25T10:00:00.000Z",
    });
    expect(started.run.project).toEqual({
      projectId: snapshot.sourceProjectRef,
      projectVersion: snapshot.sourceProjectVersion,
      projectDigest: snapshot.sourceProjectDigest,
      snapshotRef: snapshot.snapshotDigest,
    });
    expect(started.event.eventType).toBe("RUN_STARTED");
  });

  it("W1TRACE01-03 appends stable continuous sequences", () => {
    const { recorder, event } = appendOwnerCompleted();
    expect(event.sequence).toBe(2);
    expect(recorder.getRun().eventCount).toBe(2);
  });

  it("W1TRACE01-04 links every event to the previous event", () => {
    const { recorder, event } = appendOwnerCompleted();
    expect(event.previousEventId).toBe(recorder.getLedger().events[0].eventId);
  });

  it("W1TRACE01-05 freezes events deeply", () => {
    const { event } = appendOwnerCompleted();
    expect(Object.isFrozen(event)).toBe(true);
    expect(Object.isFrozen(event.dependencyRefs)).toBe(true);
    expect(() => {
      (event as { status: string }).status = "MUTATED";
    }).toThrow();
  });

  it("W1TRACE01-06 freezes ledger snapshots without mutating the prior ledger", () => {
    const recorder = newRecorder();
    const before = recorder.getLedger();
    recorder.append(ownerCompletedEvent());
    expect(before.events).toHaveLength(1);
    expect(recorder.getLedger().events).toHaveLength(2);
    expect(Object.isFrozen(recorder.getLedger())).toBe(true);
  });

  it("W1TRACE01-07 finalizes an immutable derived ScientificRun", () => {
    const recorder = newRecorder();
    const run = recorder.complete("2026-08-25T10:00:02.000Z");
    expect(run.status).toBe("COMPLETED");
    expect(run.completedAt).toBe("2026-08-25T10:00:02.000Z");
    expect(run.authoritative).toBe(false);
    expect(Object.isFrozen(run)).toBe(true);
  });

  it("W1TRACE01-08 rejects append after run finalization", () => {
    const recorder = newRecorder();
    recorder.complete("2026-08-25T10:00:02.000Z");
    expect(() => recorder.append(ownerCompletedEvent())).toThrow("SCIENTIFIC_TRACE_FINALIZED_RUN_IS_IMMUTABLE");
  });

  it("W1TRACE01-09 verifies event integrity and logical digests", () => {
    const { event } = appendOwnerCompleted();
    expect(verifyScientificExecutionTraceEventDigest(event)).toBe(true);
    expect(event.eventDigest).not.toBe(event.logicalDigest);
  });

  it("W1TRACE01-10 rejects a tampered event on rehydration", () => {
    const { recorder } = appendOwnerCompleted();
    const tampered = structuredClone(recorder.getLedger()) as ScientificExecutionTraceLedger;
    (tampered.events[1] as { status: string }).status = "TAMPERED";
    expect(() => rehydrateScientificExecutionTraceLedger(tampered)).toThrow("SCIENTIFIC_TRACE_EVENT_DIGEST_INVALID");
  });

  it("W1TRACE01-11 rejects a tampered ledger digest", () => {
    const ledger = structuredClone(newRecorder().getLedger()) as ScientificExecutionTraceLedger;
    (ledger as { ledgerDigest: string }).ledgerDigest = "invalid";
    expect(() => rehydrateScientificExecutionTraceLedger(ledger)).toThrow("SCIENTIFIC_EXECUTION_TRACE_LEDGER_DIGEST_INVALID");
  });

  it("W1TRACE01-12 verifies a run logical digest against its event chain", () => {
    const recorder = newRecorder();
    recorder.complete("2026-08-25T10:00:02.000Z");
    expect(verifyScientificRunDigest({ ledger: recorder.getLedger(), run: recorder.getRun() })).toBe(true);
  });

  it("W1TRACE01-13 gets an event by immutable identity", () => {
    const { recorder, event } = appendOwnerCompleted();
    expect(getScientificExecutionTraceEvent({ ledger: recorder.getLedger(), eventId: event.eventId })).toEqual(event);
  });

  it("W1TRACE01-14 gets a run by identity", () => {
    const recorder = newRecorder();
    expect(getScientificRun({ ledger: recorder.getLedger(), runId: recorder.runId }).runId).toBe(recorder.runId);
  });

  it("W1TRACE01-15 lists one run in chronological sequence order", () => {
    const { recorder } = appendOwnerCompleted();
    expect(listScientificRunEvents({ ledger: recorder.getLedger(), runId: recorder.runId }).map((event) => event.sequence)).toEqual([1, 2]);
  });

  it("W1TRACE01-16 finds runs by exact Project ID/version/digest", () => {
    const recorder = newRecorder();
    expect(findScientificRunsByProject({
      ledger: recorder.getLedger(),
      projectId: snapshot.sourceProjectRef,
      projectVersion: snapshot.sourceProjectVersion,
      projectDigest: snapshot.sourceProjectDigest,
    })).toHaveLength(1);
    expect(findScientificTraceEventsByProject({
      ledger: recorder.getLedger(),
      projectId: snapshot.sourceProjectRef,
      projectVersion: snapshot.sourceProjectVersion,
      projectDigest: snapshot.sourceProjectDigest,
    })).toHaveLength(1);
  });

  it("W1TRACE01-17 finds events that reference an OwnerResult", () => {
    const { recorder } = appendOwnerCompleted();
    expect(findScientificTraceEventsByOwnerResult({ ledger: recorder.getLedger(), resultId: ownerResultRef.artifactId })).toHaveLength(1);
  });

  it("W1TRACE01-18 finds events that reference a ValidationRun", () => {
    const recorder = newRecorder();
    recorder.append(ownerCompletedEvent({
      eventType: "VALIDATION_COMPLETED",
      owner: "VAL",
      outputResultRef: validationRunRef,
      diagnostic: { stage: "VAL_ENGINE", code: "STRUCTURAL_FIDELITY_OBSERVED" },
    }));
    expect(findScientificTraceEventsByValidationRun({ ledger: recorder.getLedger(), validationRunId: validationRunRef.artifactId })).toHaveLength(1);
  });

  it("W1TRACE01-19 preserves dependency refs without copying dependency payloads", () => {
    const { event } = appendOwnerCompleted();
    expect(event.dependencyRefs).toEqual([dependencyRef]);
    expect(JSON.stringify(event)).not.toContain("originalQuestion");
  });

  it("W1TRACE01-20 preserves bounded source/evidence/unknown/gap/limit/contradiction refs", () => {
    const { event } = appendOwnerCompleted();
    expect(event).toMatchObject({
      sourceRefs: ["source:1"],
      sourceCount: 1,
      evidenceRefs: ["evidence:1"],
      unknownRefs: ["unknown:hash-1"],
      gapRefs: ["gap:hash-1"],
      limitationRefs: ["limitation:hash-1"],
      contradictionRefs: ["contradiction:hash-1"],
    });
  });

  it("W1TRACE01-21 records expected and received stale bindings without weakening rejection", () => {
    const recorder = newRecorder();
    const event = recorder.append({
      eventType: "STALE_RESULT_REJECTED",
      timestamp: "2026-08-25T10:00:01.000Z",
      owner: "SCIENTIFIC_THINKING",
      status: "STALE_REJECTED",
      stale: {
        status: "STALE_REJECTED",
        expectedProject: recorder.getRun().project,
        receivedProject: { ...recorder.getRun().project, projectVersion: "project-version:2" },
        expectedDependencyRefs: [dependencyRef],
        receivedDependencyRefs: [{ ...dependencyRef, resultDigest: "knowledge-result-digest:2" }],
      },
      error: { category: "BOUNDARY_REJECTION", code: "STALE_KNOWLEDGE_RESULT" },
      diagnostic: { stage: "STALE_VALIDATION", code: "STALE_KNOWLEDGE_RESULT" },
    });
    expect(event.stale.status).toBe("STALE_REJECTED");
    expect(event.projectWriteAuthorized).toBe(false);
  });

  it("W1TRACE01-22 retains structured error codes without raw stack or message", () => {
    const recorder = newRecorder();
    const event = recorder.append({
      eventType: "OWNER_INVOCATION_FAILED",
      timestamp: "2026-08-25T10:00:01.000Z",
      owner: "KNOWLEDGE",
      status: "FAILED",
      error: { category: "OWNER_RUNTIME", code: "KNOWLEDGE_RUNTIME_FAILURE" },
      diagnostic: { stage: "KNOWLEDGE_ENGINE", code: "KNOWLEDGE_RUNTIME_FAILURE" },
    });
    expect(event.error).toEqual({ category: "OWNER_RUNTIME", code: "KNOWLEDGE_RUNTIME_FAILURE" });
    expect(JSON.stringify(event)).not.toContain("stack");
    recordRejectedHandoffTrace(recorder, {
      timestamp: "2026-08-25T10:00:02.000Z",
      owner: "REGULATORY_RESOLUTION",
      stage: "REG_REQUEST_BUILDING",
      code: "unsupported jurisdiction: synthetic lowercase fixture",
    });
    const rejection = recorder.getLedger().events.at(-1)!;
    expect(rejection.error?.code).toMatch(/^BOUNDARY_REJECTION_KE1-[A-F0-9]+$/);
    expect(JSON.stringify(rejection)).not.toContain("synthetic lowercase fixture");
  });

  it("W1TRACE01-23 records explicit handoff acceptance", () => {
    const recorder = newRecorder();
    const event = recorder.append({
      eventType: "HANDOFF_ACCEPTED",
      timestamp: "2026-08-25T10:00:01.000Z",
      owner: "IMAGING",
      status: "ACCEPTED",
      diagnostic: { stage: "ST_TO_IMAGING_HANDOFF", code: "HANDOFF_CONTRACT_ACCEPTED" },
    });
    expect(event.eventType).toBe("HANDOFF_ACCEPTED");
  });

  it("W1TRACE01-24 permits an explicitly invoked REG branch", () => {
    const recorder = newRecorder();
    recorder.append({
      eventType: "OWNER_INVOCATION_COMPLETED",
      timestamp: "2026-08-25T10:00:01.000Z",
      owner: "REGULATORY_RESOLUTION",
      engine: "REGULATORY_REQUIREMENT_RESOLUTION",
      engineVersion: "REG-001@1.0.0",
      status: "COMPLETED",
      diagnostic: { stage: "REG_ENGINE", code: "OWNER_RESULT_OBSERVED" },
    });
    expect(recorder.getLedger().events.some((event) => event.owner === "REGULATORY_RESOLUTION")).toBe(true);
  });

  it("W1TRACE01-25 treats the absence of REG events as valid and makes no necessity inference", () => {
    const recorder = newRecorder();
    recorder.complete("2026-08-25T10:00:02.000Z");
    const serialized = JSON.stringify(recorder.getLedger());
    expect(serialized).not.toContain("REGULATORY_RESOLUTION");
    expect(serialized).not.toContain("REG_NOT_REQUIRED");
  });

  it("W1TRACE01-26 references VAL while keeping its ledger artifact distinct", () => {
    const recorder = newRecorder();
    const event = recorder.append(ownerCompletedEvent({
      eventType: "RESULT_PERSISTED",
      owner: "VAL",
      outputResultRef: validationRunRef,
      status: "VALIDATION_RUN_RETAINED",
      diagnostic: { stage: "OWNER_RESULT_PERSISTENCE", code: "VALIDATION_LEDGER_ENTRY_APPENDED" },
    }));
    expect(event.outputResultRef?.artifactType).toBe("VALIDATION_RUN");
    expect(event.repairAuthorized).toBe(false);
    expect(event.scientificDecisionAuthorized).toBe(false);
  });

  it("W1TRACE01-27 leaves the observed Project snapshot byte-identical", () => {
    const before = JSON.stringify(snapshot);
    appendOwnerCompleted();
    expect(JSON.stringify(snapshot)).toBe(before);
  });

  it("W1TRACE01-28 rejects private chain-of-thought fields", () => {
    const recorder = newRecorder();
    expect(() => recorder.append({
      eventType: "OWNER_INVOCATION_COMPLETED",
      timestamp: "2026-08-25T10:00:01.000Z",
      owner: "KNOWLEDGE",
      status: "COMPLETED",
      technicalMetadata: { chainOfThought: "hidden reasoning" } as never,
    })).toThrow("SCIENTIFIC_TRACE_PRIVATE_OR_SENSITIVE_FIELD_FORBIDDEN");
  });

  it("W1TRACE01-29 rejects recognizable secret material", () => {
    const recorder = newRecorder();
    expect(() => recorder.append({
      eventType: "OWNER_INVOCATION_FAILED",
      timestamp: "2026-08-25T10:00:01.000Z",
      owner: "KNOWLEDGE",
      status: ["sk", "test-secret-12345678"].join("-"),
    })).toThrow("SCIENTIFIC_TRACE_SECRET_MATERIAL_FORBIDDEN");
  });

  it("W1TRACE01-30 builds a read-only replay plan from event N without executing it", () => {
    const { recorder, event } = appendOwnerCompleted();
    recorder.complete("2026-08-25T10:00:02.000Z");
    const plan = buildReplayPlan({ ledger: recorder.getLedger(), runId: recorder.runId, fromEventId: event.eventId });
    expect(plan.status).toBe("REPLAY_PLANNABLE");
    expect(plan.executionAuthorized).toBe(false);
    expect(plan.eventsToRecompute[0]).toBe(event.eventId);
  });

  it("W1TRACE01-31 compares equal logical traces while excluding timestamps and durations", () => {
    const left = newRecorder("scientific-run:left");
    left.append(ownerCompletedEvent({ timestamp: "2026-08-25T10:00:01.000Z", durationMs: 10 }));
    left.complete("2026-08-25T10:00:02.000Z");
    const right = newRecorder("scientific-run:right");
    right.append(ownerCompletedEvent({ timestamp: "2026-08-26T11:00:01.000Z", durationMs: 999 }));
    right.complete("2026-08-26T11:00:02.000Z");
    const comparison = compareScientificRuns({
      leftLedger: left.getLedger(),
      leftRunId: left.runId,
      rightLedger: right.getLedger(),
      rightRunId: right.runId,
    });
    expect(comparison.equivalent).toBe(true);
    expect(left.getRun().logicalDigest).toBe(right.getRun().logicalDigest);
  });

  it("W1TRACE01-32 identifies the first observable structural divergence", () => {
    const left = newRecorder("scientific-run:left");
    left.append(ownerCompletedEvent());
    const right = newRecorder("scientific-run:right");
    right.append(ownerCompletedEvent({ status: "OWNER_RUNTIME_FAILURE", diagnostic: { stage: "KNOWLEDGE_ENGINE", code: "KNOWLEDGE_RUNTIME_FAILURE" } }));
    const comparison = compareScientificRuns({ leftLedger: left.getLedger(), leftRunId: left.runId, rightLedger: right.getLedger(), rightRunId: right.runId });
    expect(comparison).toMatchObject({ equivalent: false, firstDivergentStage: "KNOWLEDGE_ENGINE" });
    expect(comparison.divergentFields).toContain("STATUS");
  });

  it("W1TRACE01-33 locates a recorded stale rejection without inventing an upstream cause", () => {
    const recorder = newRecorder();
    recorder.append({
      eventType: "STALE_RESULT_REJECTED",
      timestamp: "2026-08-25T10:00:01.000Z",
      owner: "IMAGING",
      status: "STALE_REJECTED",
      error: { category: "BOUNDARY_REJECTION", code: "STALE_SCIENTIFIC_THINKING_RESULT" },
      diagnostic: { stage: "STALE_VALIDATION", code: "STALE_SCIENTIFIC_THINKING_RESULT" },
    });
    expect(locateFirstObservableDivergence({ ledger: recorder.getLedger(), runId: recorder.runId })).toEqual({
      readiness: "ATTRIBUTED_FROM_OBSERVABLE_EVENT",
      stage: "STALE_VALIDATION",
      eventId: recorder.getLedger().events[1].eventId,
      diagnosticCode: "STALE_SCIENTIFIC_THINKING_RESULT",
      inferenceBeyondObservedStage: false,
    });
  });

  it("W1TRACE01-34 rehydrates a valid serialized ledger with immutable history", () => {
    const recorder = newRecorder();
    recorder.append(ownerCompletedEvent());
    recorder.complete("2026-08-25T10:00:02.000Z");
    const rehydrated = rehydrateScientificExecutionTraceLedger(JSON.parse(JSON.stringify(recorder.getLedger())));
    expect(rehydrated).toEqual(recorder.getLedger());
    expect(Object.isFrozen(rehydrated.events[1])).toBe(true);
  });

  it("W1TRACE01-35 rejects duplicate run identities in one trace ledger", () => {
    const recorder = newRecorder();
    expect(() => startScientificRun({
      ledger: recorder.getLedger(),
      runId: recorder.runId,
      projectSnapshot: snapshot,
      initiatorContext: { kind: "TEST_HARNESS", initiatorRef: "duplicate" },
      startedAt: "2026-08-25T10:01:00.000Z",
    })).toThrow("SCIENTIFIC_TRACE_DUPLICATE_RUN_ID");
  });

  it("W1TRACE01-36 exposes the functional append API independently of a recorder", () => {
    const started = startScientificRun({
      ledger: createScientificExecutionTraceLedger("session:functional"),
      runId: "scientific-run:functional",
      projectSnapshot: snapshot,
      initiatorContext: { kind: "TEST_HARNESS", initiatorRef: "functional" },
      startedAt: "2026-08-25T10:00:00.000Z",
    });
    const appended = appendScientificExecutionTraceEvent({ ledger: started.ledger, runId: started.run.runId, event: ownerCompletedEvent() });
    expect(appended.ledger.events).toHaveLength(2);
    expect(started.ledger.events).toHaveLength(1);
  });

  it.each(diagnosticStages)("W1TRACE01-DIAG localizes an observable failure at %s", (stage) => {
    const recorder = newRecorder(`scientific-run:diagnostic:${stage.toLowerCase()}`);
    recorder.append({
      eventType: "HANDOFF_REJECTED",
      timestamp: "2026-08-25T10:00:01.000Z",
      owner: "TRACE",
      status: "REJECTED",
      error: { category: "BOUNDARY_REJECTION", code: `FIXTURE_${stage}` },
      diagnostic: { stage, code: `FIXTURE_${stage}` },
    });
    expect(locateFirstObservableDivergence({ ledger: recorder.getLedger(), runId: recorder.runId })).toMatchObject({
      readiness: "ATTRIBUTED_FROM_OBSERVABLE_EVENT",
      stage,
      inferenceBeyondObservedStage: false,
    });
  });

  it("W1TRACE01-37 persists and rehydrates the dedicated TRACE ledger in the product session", () => {
    const storage = new MemoryStorage();
    const session = createFunctionalResetSession("2026-08-25T10:00:00.000Z");
    const trace = createScientificRunTraceRecorder({
      ledger: session.scientificExecutionTraceLedger,
      runId: "scientific-run:persisted",
      projectSnapshot: snapshot,
      initiatorContext: { kind: "TEST_HARNESS", initiatorRef: "persistence" },
      startedAt: "2026-08-25T10:00:00.000Z",
    });
    trace.complete("2026-08-25T10:00:01.000Z");
    persistFunctionalResetSession(storage, { ...session, scientificExecutionTraceLedger: trace.getLedger() });
    const loaded = loadFunctionalResetSession(storage);
    expect(loaded.contractVersion).toBe("1.7.0");
    expect(loaded.scientificExecutionTraceLedger).toEqual(trace.getLedger());
    expect(Object.isFrozen(loaded.scientificExecutionTraceLedger.events[0])).toBe(true);
  });

  it("W1TRACE01-38 migrates a v1.6 product session with an empty separate TRACE ledger", () => {
    const storage = new MemoryStorage();
    const session = createFunctionalResetSession("2026-08-25T10:00:00.000Z");
    const { scientificExecutionTraceLedger: _notInV160, ...legacy } = session;
    storage.setItem(FUNCTIONAL_RESET_STORAGE_KEY, JSON.stringify({ ...legacy, contractVersion: "1.6.0" }));
    const migrated = loadFunctionalResetSession(storage);
    expect(migrated.contractVersion).toBe("1.7.0");
    expect("entries" in migrated.scientificExecutionTraceLedger).toBe(false);
    expect(migrated.scientificExecutionTraceLedger.events).toEqual([]);
    expect(migrated.knowledgeOwnerLedger).toEqual(session.knowledgeOwnerLedger);
    expect(migrated.validationRunLedger).toEqual(session.validationRunLedger);
  });
});
