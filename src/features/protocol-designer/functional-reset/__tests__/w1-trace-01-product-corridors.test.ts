import { beforeAll, describe, expect, it } from "vitest";
import { executeKnowledgeRequest, stableStringify } from "@/features/knowledge-engine";
import { executeImagingStudyDesigner } from "@/features/imaging-study-designer";
import { executeScientificThinkingEngine } from "@/features/scientific-thinking";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation/contracts";
import {
  createRegulatoryResolutionInput,
  knownFact,
  resolveRegulatoryRequirements,
  type RegulatoryResolutionInput,
} from "@/features/regulatory-resolution";
import {
  contributionFromPersistentDelta,
  validatePersistentProjectDelta,
  type PersistentProjectDeltaChange,
} from "@/features/protocol-designer/product-bridge";
import { invokeKnowledgeForProject } from "@/features/protocol-designer/product-knowledge-owner-runtime";
import { invokeScientificThinkingForProject } from "@/features/protocol-designer/product-scientific-thinking-owner-runtime";
import {
  invokeImagingForProject,
  readProductImagingOwnerResult,
} from "@/features/protocol-designer/product-imaging-owner-runtime";
import { invokeRegulatoryForProject } from "@/features/protocol-designer/product-regulatory-owner-runtime";
import { validateScientificOwnerChainForProject } from "@/features/protocol-designer/product-scientific-loop-validation-runtime";
import { ownerResultNativeDigest } from "@/features/protocol-designer/product-owner-result-ledger";
import {
  createScientificExecutionTraceLedger,
  createScientificRunTraceRecorder,
  findScientificTraceEventsByOwnerResult,
  findScientificTraceEventsByValidationRun,
  locateFirstObservableDivergence,
  type ScientificRunTraceRecorder,
} from "@/features/protocol-designer/scientific-execution-trace";
import {
  buildKnowledgeRequestFromCanonicalSnapshot,
  buildProjectContextSnapshot,
  confirmResearchProjectContribution,
  type ProjectContextSnapshot,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import { createFunctionalResetSession } from "../session";

const authority = {
  actorRef: "w1-trace-01:researcher",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const change = (input: Partial<PersistentProjectDeltaChange> & Pick<PersistentProjectDeltaChange, "candidateRef" | "proposedType" | "content" | "sourceText">): PersistentProjectDeltaChange => ({
  operation: "ADD",
  targetSectionId: "MEASUREMENTS",
  targetProjectRef: null,
  semanticIdentity: input.candidateRef,
  polarity: "AFFIRMED",
  studyRole: null,
  epistemicStatus: "EXPLICIT_USER_STATED",
  assertionKind: "USER_STATED",
  proposalSourceText: null,
  evidenceRefs: [],
  ...input,
});

const adopt = (input: {
  current: ResearchProjectOwnerProjection | null;
  raw: string;
  changes: PersistentProjectDeltaChange[];
  at: string;
}) => {
  const conversation: ScientificInterpretationConversation = {
    conversationId: `conversation:${input.raw}`,
    language: "fr",
    turns: [{ turnId: `turn:${input.raw}`, role: "USER", content: input.raw, createdAt: input.at }],
  };
  const checked = validatePersistentProjectDelta(
    { changes: input.changes, relations: [], temporalQualifications: [], expectedVariableOccasions: [] },
    input.raw,
    input.current,
    conversation,
  );
  expect(checked.validation.blocks).toEqual([]);
  const contribution = contributionFromPersistentDelta({
    candidate: checked.candidate!,
    conversation,
    currentProject: input.current,
    createdAt: input.at,
  });
  return confirmResearchProjectContribution({
    contribution: contribution!,
    current: input.current,
    projectId: input.current?.projectId ?? "project:w1-trace-01",
    authority,
    confirmedAt: input.at,
  });
};

const projectFor = () => {
  const raw = "Chez des adultes avec fibrose myocardique, étudier l'association entre T1 mapping et ECV en IRM cardiaque.";
  return adopt({
    current: null,
    raw,
    at: "2026-08-25T15:00:00.000Z",
    changes: [
      change({ candidateRef: "question:t1-ecv", proposedType: "SCIENTIFIC_QUESTION", targetSectionId: "ANALYSIS", content: "Quelle association existe entre T1 mapping et ECV chez des adultes avec fibrose myocardique ?", sourceText: raw }),
      change({ candidateRef: "population:adults", proposedType: "POPULATION", targetSectionId: "POPULATION", content: "Adultes", sourceText: raw }),
      change({ candidateRef: "condition:fibrosis", proposedType: "CONDITION", targetSectionId: "POPULATION", content: "Fibrose myocardique", sourceText: raw }),
      change({ candidateRef: "modality:cmr", proposedType: "IMAGING_MODALITY", targetSectionId: "IMAGING", content: "IRM cardiaque", sourceText: raw }),
      change({ candidateRef: "acquisition:t1-mapping", proposedType: "ACQUISITION", targetSectionId: "IMAGING", content: "T1 mapping", sourceText: raw }),
      change({ candidateRef: "variable:ecv", proposedType: "CANONICAL_VARIABLE", targetSectionId: "MEASUREMENTS", content: "ECV", sourceText: raw }),
    ],
  });
};

const advanceProject = (current: ResearchProjectOwnerProjection) => {
  const raw = "Le projet devient multicentrique.";
  return adopt({
    current,
    raw,
    at: "2026-08-25T15:20:00.000Z",
    changes: [change({ candidateRef: "design:multicenter", proposedType: "STUDY_DESIGN", targetSectionId: "DESIGN", content: "Étude multicentrique", sourceText: raw })],
  });
};

const createTrace = (runId: string, projectSnapshot: Readonly<ProjectContextSnapshot>) => createScientificRunTraceRecorder({
  ledger: createScientificExecutionTraceLedger(`session:${runId}`),
  runId,
  projectSnapshot,
  initiatorContext: { kind: "TEST_HARNESS", initiatorRef: "W1-TRACE-01" },
  startedAt: "2026-08-25T15:00:30.000Z",
});

const regulatoryRequest = (project: ResearchProjectOwnerProjection, projectSnapshot: Readonly<ProjectContextSnapshot>): RegulatoryResolutionInput => {
  const provenance = [projectSnapshot.sourceProjectRef, projectSnapshot.sourceProjectVersion, projectSnapshot.sourceProjectDigest, projectSnapshot.snapshotDigest];
  return createRegulatoryResolutionInput({
    researchProjectId: projectSnapshot.sourceProjectRef,
    researchProjectVersion: projectSnapshot.sourceProjectVersion,
    researchProjectDigest: projectSnapshot.sourceProjectDigest,
    resolutionAsOf: "2026-08-25T15:10:00.000Z",
    jurisdiction: knownFact(["FR", "EU_EEA"], "Juridictions fournies par le caller.", provenance),
    projectCharacteristics: {
      humanHealthResearch: knownFact(true, "Recherche en santé déclarée.", provenance),
      projectNatures: knownFact(["HEALTH_RESEARCH"], "Nature déclarée.", provenance),
      intendedDocuments: knownFact(["RESEARCH_PROTOCOL"], "Document envisagé.", provenance),
      explicitlyIncorporatedGuidance: knownFact([], "Aucun guide incorporé.", provenance),
    },
    studyDesignCharacteristics: {
      interventionModel: knownFact<"INTERVENTIONAL" | "OBSERVATIONAL">("OBSERVATIONAL", "Modèle déclaré.", provenance),
      temporalDirection: knownFact<"PROSPECTIVE" | "RETROSPECTIVE" | "MIXED">("PROSPECTIVE", "Temporalité déclarée.", provenance),
      randomised: knownFact(false, "Aucune randomisation déclarée.", provenance),
      registryBased: knownFact(false, "Aucun registre déclaré.", provenance),
      reportTypes: knownFact([], "Aucun rapport demandé.", provenance),
    },
    interventionCharacteristics: {
      interventionPresent: knownFact(false, "Aucune intervention déclarée.", provenance),
      medicinalProductTrial: knownFact(false, "Aucun médicament expérimental déclaré.", provenance),
      medicalDeviceStudy: knownFact(false, "Aucun dispositif déclaré.", provenance),
    },
    productCharacteristics: { productTypes: knownFact([], "Aucun produit déclaré.", provenance) },
    dataCharacteristics: {
      personalHealthData: knownFact(true, "Données de santé prévues.", provenance),
      existingData: knownFact(false, "Pas de données existantes déclarées.", provenance),
      prospectiveCollection: knownFact(true, "Collecte prospective déclarée.", provenance),
      routinelyCollectedHealthData: knownFact(false, "Pas de soin courant déclaré.", provenance),
      sources: knownFact(["PROSPECTIVE_RESEARCH_COLLECTION"], "Source déclarée.", provenance),
      transferOutsideEea: knownFact(false, "Aucun transfert hors EEE déclaré.", provenance),
    },
    biologicalSampleCharacteristics: { samplesPresent: knownFact(false, "Aucun échantillon déclaré.", provenance) },
    multicenterCharacteristics: {
      multicenter: knownFact(false, "Projet monocentrique déclaré.", provenance),
      centerCount: knownFact(1, "Un centre déclaré.", provenance),
    },
    internationalCharacteristics: {
      international: knownFact(false, "Projet non international déclaré.", provenance),
      centerJurisdictions: knownFact(["FR"], "Juridiction du centre déclarée.", provenance),
      crossCountryRequirementDiscoveryNeeded: knownFact(false, "Aucune découverte transfrontalière demandée.", provenance),
    },
    fundingProgramCandidates: knownFact([], "Aucun financement candidat.", provenance),
    fundingProgramEditionCandidates: knownFact([], "Aucune édition candidate.", provenance),
    knownRegulatoryQualifications: [],
    unknowns: [],
    contradictions: [],
    humanDecisions: [project.confirmationDecision],
    provenance,
  });
};

type LoopResult = {
  trace: ScientificRunTraceRecorder;
  project: ResearchProjectOwnerProjection;
  snapshot: Readonly<ProjectContextSnapshot>;
  knowledge: ReturnType<typeof invokeKnowledgeForProject>;
  scientificThinking: ReturnType<typeof invokeScientificThinkingForProject>;
  imaging: ReturnType<typeof invokeImagingForProject>;
  validation: ReturnType<typeof validateScientificOwnerChainForProject>;
};

const runLoop = (input: { runId: string; traceEnabled: boolean }): LoopResult => {
  const project = projectFor();
  const snapshot = buildProjectContextSnapshot({ project });
  const session = createFunctionalResetSession("2026-08-25T15:00:00.000Z");
  const trace = createTrace(input.runId, snapshot);
  const knowledgeRequest = buildKnowledgeRequestFromCanonicalSnapshot({
    projectSnapshot: snapshot,
    question: "Quelles connaissances locales soutiennent T1 mapping et ECV en IRM cardiaque ?",
    createdAt: "2026-08-25T15:01:00.000Z",
  });
  const knowledgeClock = (() => { let value = 10; return () => value += 1; })();
  const knowledge = invokeKnowledgeForProject({
    project,
    projectSnapshot: snapshot,
    knowledgeRequest,
    ledger: session.knowledgeOwnerLedger,
    callerRef: "W1-TRACE-01:CORRIDOR",
    purpose: knowledgeRequest.originalQuestion,
    startedAt: "2026-08-25T15:01:00.000Z",
    completedAt: "2026-08-25T15:01:01.000Z",
    runtime: executeKnowledgeRequest,
    monotonicNow: knowledgeClock,
    trace: input.traceEnabled ? trace : undefined,
  });
  const scientificThinkingClock = (() => { let value = 20; return () => value += 1; })();
  const scientificThinking = invokeScientificThinkingForProject({
    project,
    projectSnapshot: snapshot,
    knowledgeResultId: knowledge.result!.resultId,
    ledger: knowledge.ledger,
    callerRef: "W1-TRACE-01:CORRIDOR",
    purpose: "Construire les branches scientifiques candidates.",
    startedAt: "2026-08-25T15:02:00.000Z",
    completedAt: "2026-08-25T15:02:01.000Z",
    runtime: executeScientificThinkingEngine,
    monotonicNow: scientificThinkingClock,
    trace: input.traceEnabled ? trace : undefined,
  });
  const imagingClock = (() => { let value = 30; return () => value += 1; })();
  const imaging = invokeImagingForProject({
    project,
    projectSnapshot: snapshot,
    knowledgeResultId: knowledge.result!.resultId,
    scientificThinkingResultId: scientificThinking.result!.resultId,
    ledger: scientificThinking.ledger,
    callerRef: "W1-TRACE-01:CORRIDOR",
    purpose: "Proposer les options Imaging sans qualification OBS fictive.",
    startedAt: "2026-08-25T15:03:00.000Z",
    completedAt: "2026-08-25T15:03:01.000Z",
    runtime: executeImagingStudyDesigner,
    monotonicNow: imagingClock,
    trace: input.traceEnabled ? trace : undefined,
  });
  const validation = validateScientificOwnerChainForProject({
    project,
    projectSnapshot: snapshot,
    ownerResultLedger: imaging.ledger,
    validationLedger: session.validationRunLedger,
    knowledgeResultId: knowledge.result!.resultId,
    scientificThinkingResultId: scientificThinking.result!.resultId,
    imagingResultId: imaging.result!.resultId,
    validationInvocationId: "validation:w1-trace-on-off",
    callerRef: "W1-TRACE-01:CORRIDOR",
    purpose: "Observer la fidélité structurelle du corridor.",
    startedAt: "2026-08-25T15:04:00.000Z",
    completedAt: "2026-08-25T15:04:01.000Z",
    trace: input.traceEnabled ? trace : undefined,
  });
  if (input.traceEnabled) trace.complete("2026-08-25T15:04:02.000Z");
  return { trace, project, snapshot, knowledge, scientificThinking, imaging, validation };
};

let traced: LoopResult;
let untraced: LoopResult;

describe("W1-TRACE-01 — instrumented product corridors", () => {
  beforeAll(() => {
    traced = runLoop({ runId: "scientific-run:nominal-traced", traceEnabled: true });
    untraced = runLoop({ runId: "scientific-run:nominal-untraced", traceEnabled: false });
  });

  it("W1TRACE01-C01 records the nominal Project→K→ST→Imaging→VAL corridor in order", () => {
    const events = traced.trace.getLedger().events;
    expect(events[0].eventType).toBe("RUN_STARTED");
    expect(events.at(-1)?.eventType).toBe("RUN_COMPLETED");
    expect(events.filter((event) => event.eventType === "OWNER_INVOCATION_COMPLETED").map((event) => event.owner)).toEqual([
      "KNOWLEDGE",
      "SCIENTIFIC_THINKING",
      "IMAGING",
    ]);
    expect(events.some((event) => event.eventType === "VALIDATION_COMPLETED" && event.owner === "VAL")).toBe(true);
  });

  it("W1TRACE01-C02 retains exact Project identity and snapshot on every event", () => {
    expect(traced.trace.getLedger().events.every((event) => event.project.projectId === traced.project.projectId
      && event.project.projectVersion === traced.project.versionId
      && event.project.projectDigest === traced.project.projectDigest
      && event.project.snapshotRef === traced.snapshot.snapshotDigest)).toBe(true);
  });

  it("W1TRACE01-C03 references all three OwnerResults and the separate ValidationRun", () => {
    expect(findScientificTraceEventsByOwnerResult({ ledger: traced.trace.getLedger(), resultId: traced.knowledge.result!.resultId }).length).toBeGreaterThan(0);
    expect(findScientificTraceEventsByOwnerResult({ ledger: traced.trace.getLedger(), resultId: traced.scientificThinking.result!.resultId }).length).toBeGreaterThan(0);
    expect(findScientificTraceEventsByOwnerResult({ ledger: traced.trace.getLedger(), resultId: traced.imaging.result!.resultId }).length).toBeGreaterThan(0);
    expect(findScientificTraceEventsByValidationRun({ ledger: traced.trace.getLedger(), validationRunId: traced.validation.run.validationRunId }).length).toBeGreaterThan(0);
    expect(traced.trace.getLedger().events.some((event) => event.eventType === "RESULT_PERSISTED"
      && event.outputResultRef?.artifactType === "OWNER_RESULT_LEDGER_ENTRY")).toBe(true);
    expect(traced.trace.getLedger().events.some((event) => event.eventType === "RESULT_PERSISTED"
      && event.outputResultRef?.artifactType === "VALIDATION_RUN_LEDGER_ENTRY")).toBe(true);
  });

  it("W1TRACE01-C04 trace ON and OFF preserve exact OwnerResult payloads and logical digests", () => {
    expect(stableStringify(traced.knowledge.result)).toBe(stableStringify(untraced.knowledge.result));
    expect(stableStringify(traced.scientificThinking.result)).toBe(stableStringify(untraced.scientificThinking.result));
    expect(stableStringify(traced.imaging.result)).toBe(stableStringify(untraced.imaging.result));
    expect(ownerResultNativeDigest(traced.knowledge.result!)).toBe(ownerResultNativeDigest(untraced.knowledge.result!));
    expect(ownerResultNativeDigest(traced.scientificThinking.result!)).toBe(ownerResultNativeDigest(untraced.scientificThinking.result!));
    expect(ownerResultNativeDigest(traced.imaging.result!)).toBe(ownerResultNativeDigest(untraced.imaging.result!));
  });

  it("W1TRACE01-C05 trace ON and OFF preserve the exact ValidationRun semantic result", () => {
    expect(traced.validation.run.resultDigest).toBe(untraced.validation.run.resultDigest);
    expect(stableStringify(traced.validation.run)).toBe(stableStringify(untraced.validation.run));
    expect(traced.validation.boundedStatus).toBe("STRUCTURAL_FIDELITY_PASS");
  });

  it("W1TRACE01-C06 accepts a loop with no REG event and makes no REG inference", () => {
    expect(traced.trace.getLedger().events.some((event) => event.owner === "REGULATORY_RESOLUTION")).toBe(false);
    expect(JSON.stringify(traced.trace.getLedger())).not.toContain("REG_NOT_REQUIRED");
  });

  it("W1TRACE01-C07 records an explicit REG-only conditional corridor", () => {
    const project = projectFor();
    const snapshot = buildProjectContextSnapshot({ project });
    const trace = createTrace("scientific-run:reg-only", snapshot);
    const session = createFunctionalResetSession("2026-08-25T15:00:00.000Z");
    const invocation = invokeRegulatoryForProject({
      project,
      projectSnapshot: snapshot,
      regulatoryRequest: regulatoryRequest(project, snapshot),
      ledger: session.knowledgeOwnerLedger,
      callerRef: "W1-TRACE-01:REG_ONLY",
      purpose: "Résolution réglementaire conditionnelle demandée par le caller.",
      startedAt: "2026-08-25T15:10:00.000Z",
      completedAt: "2026-08-25T15:10:01.000Z",
      runtime: resolveRegulatoryRequirements,
      trace,
    });
    trace.complete("2026-08-25T15:10:02.000Z");
    expect(invocation.result?.owner).toBe("REGULATORY_RESOLUTION");
    expect(trace.getLedger().events.filter((event) => event.owner === "REGULATORY_RESOLUTION").map((event) => event.eventType)).toEqual([
      "HANDOFF_STARTED",
      "HANDOFF_ACCEPTED",
      "OWNER_INVOCATION_STARTED",
      "OWNER_INVOCATION_COMPLETED",
      "RESULT_PERSISTED",
    ]);
  });

  it("W1TRACE01-C08 records Knowledge→ST stale rejection and keeps the guard fail-closed", () => {
    const projectV2 = advanceProject(traced.project);
    const snapshotV2 = buildProjectContextSnapshot({ project: projectV2 });
    const trace = createTrace("scientific-run:stale-k-st", snapshotV2);
    expect(() => invokeScientificThinkingForProject({
      project: projectV2,
      projectSnapshot: snapshotV2,
      knowledgeResultId: traced.knowledge.result!.resultId,
      ledger: traced.knowledge.ledger,
      callerRef: "W1-TRACE-01:STALE_K_ST",
      purpose: "Tentative stale.",
      startedAt: "2026-08-25T15:21:00.000Z",
      completedAt: "2026-08-25T15:21:01.000Z",
      runtime: executeScientificThinkingEngine,
      trace,
    })).toThrow("STALE_KNOWLEDGE_RESULT");
    expect(trace.getLedger().events.some((event) => event.eventType === "STALE_RESULT_REJECTED")).toBe(true);
    expect(locateFirstObservableDivergence({ ledger: trace.getLedger(), runId: trace.runId }).stage).toBe("STALE_VALIDATION");
  });

  it("W1TRACE01-C09 records ST→Imaging stale readback after a newer ST result", () => {
    const trace = createTrace("scientific-run:stale-st-imaging", traced.snapshot);
    const newerSt = invokeScientificThinkingForProject({
      project: traced.project,
      projectSnapshot: traced.snapshot,
      knowledgeResultId: traced.knowledge.result!.resultId,
      ledger: traced.imaging.ledger,
      callerRef: "W1-TRACE-01:NEW_ST",
      purpose: "Nouvelle branche ST candidate.",
      startedAt: "2026-08-25T15:30:00.000Z",
      completedAt: "2026-08-25T15:30:01.000Z",
      runtime: executeScientificThinkingEngine,
    });
    const readback = readProductImagingOwnerResult({
      ledger: newerSt.ledger,
      resultId: traced.imaging.result!.resultId,
      currentProjectSnapshot: traced.snapshot,
      currentKnowledgeResult: {
        resultId: traced.knowledge.result!.resultId,
        resultVersion: traced.knowledge.result!.resultVersion,
        nativeResultDigest: ownerResultNativeDigest(traced.knowledge.result!)!,
      },
      currentScientificThinkingResult: {
        resultId: newerSt.result!.resultId,
        resultVersion: newerSt.result!.resultVersion,
        nativeResultDigest: ownerResultNativeDigest(newerSt.result!)!,
      },
      trace,
      observedAt: "2026-08-25T15:30:02.000Z",
    });
    expect(readback.freshness.status).toBe("STALE_OWNER_RESULT");
    expect(trace.getLedger().events.some((event) => event.eventType === "STALE_RESULT_REJECTED")).toBe(true);
  });

  it("W1TRACE01-C10 records Project mismatch while the owner call remains rejected", () => {
    const projectV2 = advanceProject(traced.project);
    const trace = createTrace("scientific-run:project-mismatch", traced.snapshot);
    const request = buildKnowledgeRequestFromCanonicalSnapshot({
      projectSnapshot: traced.snapshot,
      question: "Question de mismatch.",
      createdAt: "2026-08-25T15:40:00.000Z",
    });
    expect(() => invokeKnowledgeForProject({
      project: projectV2,
      projectSnapshot: traced.snapshot,
      knowledgeRequest: request,
      ledger: traced.knowledge.ledger,
      callerRef: "W1-TRACE-01:MISMATCH",
      purpose: request.originalQuestion,
      startedAt: "2026-08-25T15:40:00.000Z",
      completedAt: "2026-08-25T15:40:01.000Z",
      runtime: executeKnowledgeRequest,
      trace,
    })).toThrow("KNOWLEDGE_PRODUCT_PROJECT_SNAPSHOT_MISMATCH");
    expect(locateFirstObservableDivergence({ ledger: trace.getLedger(), runId: trace.runId }).stage).toBe("PROJECT_CONTEXT");
  });

  it("W1TRACE01-C11 records an owner runtime failure without fabricating a result", () => {
    const trace = createTrace("scientific-run:owner-failure", traced.snapshot);
    const session = createFunctionalResetSession("2026-08-25T15:00:00.000Z");
    const request = buildKnowledgeRequestFromCanonicalSnapshot({
      projectSnapshot: traced.snapshot,
      question: "Question déclenchant la fixture d'échec.",
      createdAt: "2026-08-25T15:50:00.000Z",
    });
    const invocation = invokeKnowledgeForProject({
      project: traced.project,
      projectSnapshot: traced.snapshot,
      knowledgeRequest: request,
      ledger: session.knowledgeOwnerLedger,
      callerRef: "W1-TRACE-01:OWNER_FAILURE",
      purpose: request.originalQuestion,
      startedAt: "2026-08-25T15:50:00.000Z",
      completedAt: "2026-08-25T15:50:01.000Z",
      runtime: () => { throw new Error("DETERMINISTIC_KNOWLEDGE_FAILURE"); },
      trace,
    });
    expect(invocation.result).toBeNull();
    expect(trace.getLedger().events.some((event) => event.eventType === "OWNER_INVOCATION_FAILED"
      && event.diagnostic?.stage === "KNOWLEDGE_ENGINE")).toBe(true);
  });

  it("W1TRACE01-C12 preserves VAL observer-only semantics in the trace", () => {
    const validationEvent = traced.trace.getLedger().events.find((event) => event.eventType === "VALIDATION_COMPLETED");
    expect(validationEvent?.status).toBe("STRUCTURAL_FIDELITY_PASS");
    expect(validationEvent?.technicalMetadata).toMatchObject({
      scientificQualificationClaimed: false,
      repairAuthorized: false,
    });
    expect(JSON.stringify(traced.trace.getLedger())).not.toContain("SCIENTIFIC_PASS");
    expect(traced.validation.run.projectWriteAuthorized).toBe(false);
  });

  it("W1TRACE01-C13 records zero provider, Project, repair or scientific-decision authority", () => {
    expect(traced.trace.getLedger()).toMatchObject({
      projectWriteAuthorized: false,
      ownerResultWriteAuthorized: false,
      validationRunWriteAuthorized: false,
      repairAuthorized: false,
      scientificDecisionAuthorized: false,
      privateReasoningStored: false,
    });
    expect(traced.knowledge.geminiCalls + traced.knowledge.terraCalls + traced.knowledge.externalEvidenceCalls).toBe(0);
    expect(traced.imaging.obsRuntimeCalls).toBe(0);
  });
});
