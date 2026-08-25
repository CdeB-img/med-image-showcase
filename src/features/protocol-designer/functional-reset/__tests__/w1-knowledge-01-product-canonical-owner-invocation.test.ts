import { beforeAll, describe, expect, it } from "vitest";
import {
  createKnowledgeRequest,
  executeKnowledgeRequest,
  stableStringify,
  type KnowledgeRequest,
  type KnowledgeResult,
} from "@/features/knowledge-engine";
import {
  contributionFromPersistentDelta,
  validatePersistentProjectDelta,
  type PersistentProjectDeltaChange,
} from "@/features/protocol-designer/product-bridge";
import {
  invokeKnowledgeForProject,
  readProductKnowledgeOwnerResult,
  requireCurrentProductKnowledgeOwnerResult,
} from "@/features/protocol-designer/product-knowledge-owner-runtime";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation/contracts";
import {
  buildKnowledgeRequestFromCanonicalSnapshot,
  buildProjectContextSnapshot,
  confirmResearchProjectContribution,
  invokeKnowledgeOwnerFromProject,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import {
  FUNCTIONAL_RESET_STORAGE_KEY,
  createFunctionalResetSession,
  loadFunctionalResetSession,
  persistFunctionalResetSession,
} from "../session";

const authority = {
  actorRef: "w1-knowledge-01:researcher",
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

const contributionFor = (input: {
  raw: string;
  current: ResearchProjectOwnerProjection | null;
  changes: PersistentProjectDeltaChange[];
}) => {
  const conversation: ScientificInterpretationConversation = {
    conversationId: `conversation:${input.raw}`,
    language: "fr",
    turns: [{ turnId: `turn:${input.raw}`, role: "USER", content: input.raw, createdAt: "2026-08-25T10:00:00.000Z" }],
  };
  const checked = validatePersistentProjectDelta({
    changes: input.changes,
    relations: [],
    temporalQualifications: [],
    expectedVariableOccasions: [],
  }, input.raw, input.current, conversation);
  expect(checked.validation.blocks).toEqual([]);
  const contribution = contributionFromPersistentDelta({
    candidate: checked.candidate!,
    conversation,
    currentProject: input.current,
    createdAt: "2026-08-25T10:00:01.000Z",
  });
  expect(contribution).not.toBeNull();
  return contribution!;
};

const adopt = (input: { current: ResearchProjectOwnerProjection | null; raw: string; changes: PersistentProjectDeltaChange[]; at: string }) => confirmResearchProjectContribution({
  contribution: contributionFor(input),
  current: input.current,
  projectId: input.current?.projectId ?? "project:w1-knowledge-01",
  authority,
  confirmedAt: input.at,
});

const projectWithSupportedLocalContext = () => {
  const raw = "Le projet étudie la fibrose myocardique par IRM, avec T1 mapping et ECV comme mesure dérivée.";
  return adopt({
    current: null,
    raw,
    at: "2026-08-25T10:01:00.000Z",
    changes: [
      change({ candidateRef: "condition:myocardial-fibrosis", proposedType: "CONDITION", targetSectionId: "POPULATION", content: "Fibrose myocardique", sourceText: raw }),
      change({ candidateRef: "modality:mri", proposedType: "IMAGING_MODALITY", targetSectionId: "IMAGING", content: "IRM cardiaque", sourceText: raw }),
      change({ candidateRef: "acquisition:t1-mapping", proposedType: "ACQUISITION", targetSectionId: "IMAGING", content: "T1 mapping", sourceText: raw }),
      change({ candidateRef: "variable:ecv", proposedType: "CANONICAL_VARIABLE", targetSectionId: "MEASUREMENTS", content: "ECV", sourceText: raw }),
      change({ candidateRef: "objective:understand", proposedType: "OBJECTIVE", targetSectionId: "ANALYSIS", content: "Qualifier les connaissances applicables au T1 mapping et à l'ECV", sourceText: raw }),
    ],
  });
};

const projectWithUncoveredLocalContext = () => {
  const raw = "Le projet étudie le zéphyr quantique comme condition scientifique encore non documentée.";
  return adopt({
    current: null,
    raw,
    at: "2026-08-25T10:02:00.000Z",
    changes: [change({
      candidateRef: "condition:quantum-zephyr",
      proposedType: "CONDITION",
      targetSectionId: "POPULATION",
      content: "Zéphyr quantique",
      sourceText: raw,
    })],
  });
};

const advanceProject = (current: ResearchProjectOwnerProjection) => {
  const raw = "Le projet devient multicentrique.";
  return adopt({
    current,
    raw,
    at: "2026-08-25T10:20:00.000Z",
    changes: [change({ candidateRef: "design:multicenter", proposedType: "STUDY_DESIGN", targetSectionId: "DESIGN", content: "Étude multicentrique", sourceText: raw })],
  });
};

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const timing = {
  startedAt: "2026-08-25T10:10:00.000Z",
  completedAt: "2026-08-25T10:10:01.000Z",
  monotonicNow: (() => {
    let value = 100;
    return () => value += 0.25;
  })(),
};

let project: ResearchProjectOwnerProjection;
let projectV2: ResearchProjectOwnerProjection;
let snapshot: ReturnType<typeof buildProjectContextSnapshot>;
let snapshotV2: ReturnType<typeof buildProjectContextSnapshot>;
let request: KnowledgeRequest;
let nativeResult: KnowledgeResult;
let nativeStarts = 0;
let productInvocation: ReturnType<typeof invokeKnowledgeForProject>;
let sessionWithResult: ReturnType<typeof createFunctionalResetSession>;
let gapInvocation: ReturnType<typeof invokeKnowledgeForProject>;
let contradictionInvocation: ReturnType<typeof invokeKnowledgeForProject>;
let contradictionNative: KnowledgeResult;

describe("W1-KNOWLEDGE-01 — product canonical Knowledge owner invocation", () => {
  beforeAll(() => {
    project = projectWithSupportedLocalContext();
    snapshot = buildProjectContextSnapshot({ project });
    request = buildKnowledgeRequestFromCanonicalSnapshot({
      projectSnapshot: snapshot,
      question: "Quelles connaissances locales sont applicables au T1 mapping et à l'ECV en IRM cardiaque ?",
      createdAt: timing.startedAt,
    });
    const session = { ...createFunctionalResetSession("2026-08-25T10:00:00.000Z"), projectId: project.projectId, project };
    productInvocation = invokeKnowledgeForProject({
      project,
      projectSnapshot: snapshot,
      knowledgeRequest: request,
      ledger: session.knowledgeOwnerLedger,
      callerRef: "W1-KNOWLEDGE-01:PRODUCT_DIAGNOSTIC",
      purpose: request.originalQuestion,
      runtime: (nativeRequest) => {
        nativeStarts += 1;
        nativeResult = executeKnowledgeRequest(nativeRequest);
        return nativeResult;
      },
      ...timing,
    });
    sessionWithResult = { ...session, knowledgeOwnerLedger: productInvocation.ledger };

    const contradictionRequest = createKnowledgeRequest({
      originalQuestion: "Comprendre l'ECV avec un hématocrite synthétique.",
      scientificObjectTerms: [{ term: "ECV" }, { term: "hématocrite synthétique" }],
      researchProjectId: snapshot.sourceProjectRef,
      strategyVersion: snapshot.sourceProjectVersion,
      consumer: "RESEARCH_PROJECT_CONSTRUCTION",
      externalSearchPolicy: "INTERNAL_ONLY",
      createdAt: "2026-08-25T10:10:02.000Z",
    });
    contradictionInvocation = invokeKnowledgeForProject({
      project,
      projectSnapshot: snapshot,
      knowledgeRequest: contradictionRequest,
      ledger: productInvocation.ledger,
      callerRef: "W1-KNOWLEDGE-01:PRODUCT_DIAGNOSTIC",
      purpose: contradictionRequest.originalQuestion,
      runtime: (nativeRequest) => {
        contradictionNative = executeKnowledgeRequest(nativeRequest);
        return contradictionNative;
      },
      startedAt: "2026-08-25T10:10:02.000Z",
      completedAt: "2026-08-25T10:10:03.000Z",
    });

    const uncoveredProject = projectWithUncoveredLocalContext();
    const uncoveredSnapshot = buildProjectContextSnapshot({ project: uncoveredProject });
    const gapSession = { ...createFunctionalResetSession("2026-08-25T10:02:00.000Z"), projectId: uncoveredProject.projectId, project: uncoveredProject };
    const gapRequest = buildKnowledgeRequestFromCanonicalSnapshot({
      projectSnapshot: uncoveredSnapshot,
      question: "Quelle preuve locale établit le zéphyr quantique en IRM ?",
      createdAt: "2026-08-25T10:11:00.000Z",
    });
    gapInvocation = invokeKnowledgeForProject({
      project: uncoveredProject,
      projectSnapshot: uncoveredSnapshot,
      knowledgeRequest: gapRequest,
      ledger: gapSession.knowledgeOwnerLedger,
      callerRef: "W1-KNOWLEDGE-01:PRODUCT_DIAGNOSTIC",
      purpose: gapRequest.originalQuestion,
      startedAt: "2026-08-25T10:11:00.000Z",
      completedAt: "2026-08-25T10:11:01.000Z",
    });
    projectV2 = advanceProject(project);
    snapshotV2 = buildProjectContextSnapshot({ project: projectV2 });
  });

  it("W1K01-01 canonical Project snapshot invokes Knowledge", () => {
    expect(productInvocation.observation).toMatchObject({ owner: "KNOWLEDGE", runtimeStarts: 1, status: "COMPLETED" });
  });

  it("W1K01-02 preserves the same Project ID", () => {
    expect(productInvocation.result?.sourceProjectRef).toBe(project.projectId);
  });

  it("W1K01-03 preserves the same Project version", () => {
    expect(productInvocation.result?.sourceProjectVersion).toBe(project.versionId);
  });

  it("W1K01-04 preserves the same Project digest", () => {
    expect(productInvocation.result?.sourceProjectDigest).toBe(project.projectDigest);
  });

  it("W1K01-05 preserves the native KnowledgeRequest version", () => {
    expect(productInvocation.request.nativeInput).toEqual(request);
    expect(productInvocation.request.nativeInputVersion).toBe(request.contractVersion);
  });

  it("W1K01-06 invokes the real native Knowledge Engine exactly once", () => {
    expect(nativeStarts).toBe(1);
    expect(productInvocation.result?.nativePayload?.resultDigest).toBe(nativeResult.resultDigest);
  });

  it("W1K01-07 never reconstructs KnowledgeResult with Gemini", () => {
    expect(productInvocation.geminiCalls).toBe(0);
    expect(productInvocation.result?.nativePayload).toEqual(nativeResult);
  });

  it("W1K01-08 preserves supported local sources", () => {
    expect(nativeResult.sources.length).toBeGreaterThan(0);
    expect(productInvocation.result?.nativePayload?.sources).toEqual(nativeResult.sources);
    expect(productInvocation.result?.evidenceRefs.length).toBeGreaterThan(0);
  });

  it("W1K01-09 preserves applicability", () => {
    expect(productInvocation.result?.nativePayload?.applicability).toEqual(nativeResult.applicability);
  });

  it("W1K01-10 preserves limitations", () => {
    expect(productInvocation.result?.nativePayload?.limitations).toEqual(nativeResult.limitations);
    expect(productInvocation.result?.limitations).toEqual(expect.arrayContaining(nativeResult.limitations));
  });

  it("W1K01-11 preserves contradictions when the native result carries them", () => {
    expect(contradictionNative.controversies.length).toBeGreaterThan(0);
    expect(contradictionInvocation.result?.nativePayload?.controversies).toEqual(contradictionNative.controversies);
  });

  it("W1K01-12 keeps insufficient local evidence as a gap", () => {
    expect(gapInvocation.result).toMatchObject({ resultKind: "GAP", projectContribution: null });
    expect(gapInvocation.result?.gaps.length).toBeGreaterThan(0);
  });

  it("W1K01-13 keeps missing critical context visible", () => {
    expect(gapInvocation.result?.nativePayload?.unresolvedConcepts).toContain("Zéphyr quantique");
    expect(gapInvocation.result?.unknowns).toEqual(expect.arrayContaining(gapInvocation.result!.nativePayload!.unresolvedConcepts));
  });

  it("W1K01-14 fabricates no source for an uncovered request", () => {
    expect(gapInvocation.result?.nativePayload?.sources).toEqual([]);
    expect(gapInvocation.result?.evidenceRefs).toEqual([]);
  });

  it("W1K01-15 makes no automatic External Evidence call", () => {
    expect(productInvocation.externalEvidenceCalls).toBe(0);
    expect(gapInvocation.result?.nativePayload?.externalEvidence).toBeNull();
    expect(gapInvocation.result?.nativePayload?.trace.privacy.externalCallMade).toBe(false);
  });

  it("W1K01-16 records owner = Knowledge", () => {
    expect(productInvocation.result?.owner).toBe("KNOWLEDGE");
    expect(productInvocation.entry.request.owner).toBe("KNOWLEDGE");
  });

  it("W1K01-17 retains an immutable OwnerResult", () => {
    expect(Object.isFrozen(productInvocation.result)).toBe(true);
    expect(Object.isFrozen(productInvocation.result?.nativePayload)).toBe(true);
    expect(Object.isFrozen(productInvocation.ledger)).toBe(true);
  });

  it("W1K01-18 links OwnerResult to Project version and digest", () => {
    expect(productInvocation.entry.result).toMatchObject({
      sourceProjectVersion: snapshot.sourceProjectVersion,
      sourceProjectDigest: snapshot.sourceProjectDigest,
      sourceSnapshotDigest: snapshot.snapshotDigest,
    });
  });

  it("W1K01-19 performs zero Project writes", () => {
    expect(productInvocation.projectWrites).toBe(0);
    expect(productInvocation.observation.projectWrites).toBe(0);
    expect(stableStringify(sessionWithResult.project)).toBe(stableStringify(project));
  });

  it("W1K01-20 does not bypass Human Decision", () => {
    expect(productInvocation.humanDecisionBypassed).toBe(false);
    expect(productInvocation.result?.projectContribution).toBeNull();
    expect(sessionWithResult.project?.canonicalState?.decisionLedger).toEqual(project.canonicalState?.decisionLedger);
  });

  it("W1K01-21 rejects a stale result for a newer Project", () => {
    const resultId = productInvocation.result!.resultId;
    expect(readProductKnowledgeOwnerResult({ ledger: productInvocation.ledger, resultId, currentProjectSnapshot: snapshotV2 }).freshness.status).toBe("STALE_OWNER_RESULT");
    expect(() => requireCurrentProductKnowledgeOwnerResult({ ledger: productInvocation.ledger, resultId, currentProjectSnapshot: snapshotV2 })).toThrow("STALE_OWNER_RESULT");
  });

  it("W1K01-22 keeps the historical stale result readable", () => {
    const readback = readProductKnowledgeOwnerResult({ ledger: productInvocation.ledger, resultId: productInvocation.result!.resultId, currentProjectSnapshot: snapshotV2 });
    expect(readback.entry.result).toEqual(productInvocation.result);
    expect(productInvocation.ledger.entries).toHaveLength(1);
  });

  it("W1K01-23 persists and reloads the exact result ledger", () => {
    const storage = new MemoryStorage();
    const retained = { ...sessionWithResult, knowledgeOwnerLedger: productInvocation.ledger };
    persistFunctionalResetSession(storage, retained);
    const loaded = loadFunctionalResetSession(storage);
    expect(loaded.contractVersion).toBe("1.6.0");
    expect(loaded.knowledgeOwnerLedger).toEqual(productInvocation.ledger);
    expect(stableStringify(loaded.knowledgeOwnerLedger)).toBe(stableStringify(productInvocation.ledger));

    const legacyStorage = new MemoryStorage();
    const { knowledgeOwnerLedger: _notInV140, ...legacySession } = sessionWithResult;
    legacyStorage.setItem(FUNCTIONAL_RESET_STORAGE_KEY, JSON.stringify({ ...legacySession, contractVersion: "1.4.0" }));
    const migrated = loadFunctionalResetSession(legacyStorage);
    expect(migrated.project).toEqual(project);
    expect(migrated.knowledgeOwnerLedger.entries).toEqual([]);

    const sensitiveRequest = createKnowledgeRequest({
      originalQuestion: "Patient IPP: ABCD1234, expliquer l'ECV.",
      scientificObjectTerms: [{ term: "ECV", role: "SUBJECT" }],
      researchProjectId: snapshot.sourceProjectRef,
      strategyVersion: snapshot.sourceProjectVersion,
      consumer: "RESEARCH_PROJECT_CONSTRUCTION",
      externalSearchPolicy: "INTERNAL_ONLY",
      createdAt: "2026-08-25T10:12:00.000Z",
    });
    expect(() => invokeKnowledgeForProject({
      project,
      projectSnapshot: snapshot,
      knowledgeRequest: sensitiveRequest,
      ledger: productInvocation.ledger,
      callerRef: "W1-KNOWLEDGE-01:PRODUCT_DIAGNOSTIC",
      purpose: sensitiveRequest.originalQuestion,
      startedAt: "2026-08-25T10:12:00.000Z",
      completedAt: "2026-08-25T10:12:01.000Z",
    })).toThrow("SENSITIVE_KNOWLEDGE_OWNER_RESULT_NOT_PERSISTED");
  });

  it("W1K01-24 preserves the existing SPINE Knowledge path", () => {
    const spine = invokeKnowledgeOwnerFromProject({ project, ...timing });
    expect(spine.result?.nativePayloadType).toBe("KnowledgeResult");
    expect(spine.observation).toMatchObject({ owner: "KNOWLEDGE", projectWrites: 0, llmFallbackCalls: 0 });
  });

  it("W1K01-25 keeps current product Gemini, Terra and QRY behavior outside this invocation", () => {
    expect(productInvocation).toMatchObject({ geminiCalls: 0, terraCalls: 0 });
    expect(sessionWithResult.queryNavigation).toBeNull();
    expect(sessionWithResult.bridgeTraces).toEqual([]);
  });
});
