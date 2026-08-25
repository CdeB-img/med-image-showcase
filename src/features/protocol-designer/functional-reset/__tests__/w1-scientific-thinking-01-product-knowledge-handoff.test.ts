import { beforeAll, describe, expect, it } from "vitest";
import {
  createKnowledgeRequest,
  executeKnowledgeRequest,
  logicalDigest,
  stableStringify,
  type KnowledgeResult,
} from "@/features/knowledge-engine";
import {
  contributionFromPersistentDelta,
  validatePersistentProjectDelta,
  type PersistentProjectDeltaChange,
} from "@/features/protocol-designer/product-bridge";
import {
  invokeKnowledgeForProject,
} from "@/features/protocol-designer/product-knowledge-owner-runtime";
import {
  invokeScientificThinkingForProject,
  readProductScientificThinkingOwnerResult,
  requireCurrentProductScientificThinkingOwnerResult,
} from "@/features/protocol-designer/product-scientific-thinking-owner-runtime";
import { executeScientificThinkingEngine, type ScientificThinkingInput, type ScientificThinkingOutput } from "@/features/scientific-thinking";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation/contracts";
import {
  buildKnowledgeRequestFromCanonicalSnapshot,
  buildProjectContextSnapshot,
  confirmResearchProjectContribution,
  invokeScientificThinkingOwnerFromProject,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import {
  createFunctionalResetSession,
  loadFunctionalResetSession,
  persistFunctionalResetSession,
} from "../session";

const authority = {
  actorRef: "w1-st-01:researcher",
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
  const checked = validatePersistentProjectDelta({ changes: input.changes, relations: [], temporalQualifications: [], expectedVariableOccasions: [] }, input.raw, input.current, conversation);
  expect(checked.validation.blocks).toEqual([]);
  const contribution = contributionFromPersistentDelta({ candidate: checked.candidate!, conversation, currentProject: input.current, createdAt: input.at });
  return confirmResearchProjectContribution({
    contribution: contribution!,
    current: input.current,
    projectId: input.current?.projectId ?? "project:w1-st-01",
    authority,
    confirmedAt: input.at,
  });
};

const projectFor = () => {
  const raw = "Chez des adultes avec fibrose myocardique, dans quelle mesure le T1 mapping et l'ECV sont-ils associés ?";
  return adopt({
    current: null,
    raw,
    at: "2026-08-25T12:00:00.000Z",
    changes: [
      change({ candidateRef: "question:t1-ecv", proposedType: "SCIENTIFIC_QUESTION", targetSectionId: "ANALYSIS", content: "Dans quelle mesure le T1 mapping et l'ECV sont-ils associés chez des adultes avec fibrose myocardique ?", sourceText: raw }),
      change({ candidateRef: "population:adults", proposedType: "POPULATION", targetSectionId: "POPULATION", content: "Adultes avec fibrose myocardique", sourceText: raw }),
      change({ candidateRef: "condition:fibrosis", proposedType: "CONDITION", targetSectionId: "POPULATION", content: "Fibrose myocardique", sourceText: raw }),
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
    at: "2026-08-25T12:20:00.000Z",
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

let project: ResearchProjectOwnerProjection;
let snapshot: ReturnType<typeof buildProjectContextSnapshot>;
let projectV2: ResearchProjectOwnerProjection;
let snapshotV2: ReturnType<typeof buildProjectContextSnapshot>;
let knowledgeResult: KnowledgeResult;
let contradictionKnowledgeResult: KnowledgeResult;
let knowledgeInvocation: ReturnType<typeof invokeKnowledgeForProject>;
let contradictionKnowledgeInvocation: ReturnType<typeof invokeKnowledgeForProject>;
let stInvocation: ReturnType<typeof invokeScientificThinkingForProject>;
let contradictionStInvocation: ReturnType<typeof invokeScientificThinkingForProject>;
let noKnowledgeInvocation: ReturnType<typeof invokeScientificThinkingForProject>;
let stNativeInput: ScientificThinkingInput;
let stNativeOutput: ScientificThinkingOutput;
let stNativeStarts = 0;
let productSession: ReturnType<typeof createFunctionalResetSession>;

describe("W1-SCIENTIFIC-THINKING-01 — product KnowledgeResult → ST handoff", () => {
  beforeAll(() => {
    project = projectFor();
    snapshot = buildProjectContextSnapshot({ project });
    productSession = createFunctionalResetSession("2026-08-25T12:00:00.000Z");
    let ledger = productSession.knowledgeOwnerLedger;
    const request = buildKnowledgeRequestFromCanonicalSnapshot({
      projectSnapshot: snapshot,
      question: "Quelles connaissances locales soutiennent une relation entre T1 mapping et ECV dans la fibrose myocardique ?",
      createdAt: "2026-08-25T12:01:00.000Z",
    });
    knowledgeInvocation = invokeKnowledgeForProject({
      project,
      projectSnapshot: snapshot,
      knowledgeRequest: request,
      ledger,
      callerRef: "W1-ST-01:PRODUCT_DIAGNOSTIC",
      purpose: request.originalQuestion,
      startedAt: "2026-08-25T12:01:00.000Z",
      completedAt: "2026-08-25T12:01:01.000Z",
      runtime: (nativeRequest) => {
        knowledgeResult = executeKnowledgeRequest(nativeRequest);
        return knowledgeResult;
      },
    });
    ledger = knowledgeInvocation.ledger;
    stInvocation = invokeScientificThinkingForProject({
      project,
      projectSnapshot: snapshot,
      knowledgeResultId: knowledgeInvocation.result!.resultId,
      ledger,
      callerRef: "W1-ST-01:PRODUCT_DIAGNOSTIC",
      purpose: "Construire des hypothèses candidates à partir du Project et du KnowledgeResult applicable.",
      startedAt: "2026-08-25T12:02:00.000Z",
      completedAt: "2026-08-25T12:02:01.000Z",
      runtime: (nativeInput) => {
        stNativeStarts += 1;
        stNativeInput = nativeInput;
        stNativeOutput = executeScientificThinkingEngine(nativeInput);
        return stNativeOutput;
      },
    });
    ledger = stInvocation.ledger;

    const contradictionRequest = createKnowledgeRequest({
      originalQuestion: "Comprendre l'ECV avec un hématocrite synthétique.",
      scientificObjectTerms: [{ term: "ECV" }, { term: "hématocrite synthétique" }],
      researchProjectId: snapshot.sourceProjectRef,
      strategyVersion: snapshot.sourceProjectVersion,
      consumer: "SCIENTIFIC_THINKING_ENGINE",
      externalSearchPolicy: "INTERNAL_ONLY",
      createdAt: "2026-08-25T12:03:00.000Z",
    });
    contradictionKnowledgeInvocation = invokeKnowledgeForProject({
      project,
      projectSnapshot: snapshot,
      knowledgeRequest: contradictionRequest,
      ledger,
      callerRef: "W1-ST-01:PRODUCT_DIAGNOSTIC",
      purpose: contradictionRequest.originalQuestion,
      startedAt: "2026-08-25T12:03:00.000Z",
      completedAt: "2026-08-25T12:03:01.000Z",
      runtime: (nativeRequest) => {
        contradictionKnowledgeResult = executeKnowledgeRequest(nativeRequest);
        return contradictionKnowledgeResult;
      },
    });
    ledger = contradictionKnowledgeInvocation.ledger;
    contradictionStInvocation = invokeScientificThinkingForProject({
      project,
      projectSnapshot: snapshot,
      knowledgeResultId: contradictionKnowledgeInvocation.result!.resultId,
      ledger,
      callerRef: "W1-ST-01:PRODUCT_DIAGNOSTIC",
      purpose: "Préserver les branches contradictoires sans les résoudre.",
      startedAt: "2026-08-25T12:04:00.000Z",
      completedAt: "2026-08-25T12:04:01.000Z",
    });
    ledger = contradictionStInvocation.ledger;
    noKnowledgeInvocation = invokeScientificThinkingForProject({
      project,
      projectSnapshot: snapshot,
      knowledgeResultId: null,
      ledger,
      callerRef: "W1-ST-01:DEGRADED_DIAGNOSTIC",
      purpose: "Vérifier le chemin dégradé sans KnowledgeResult.",
      startedAt: "2026-08-25T12:05:00.000Z",
      completedAt: "2026-08-25T12:05:01.000Z",
    });
    projectV2 = advanceProject(project);
    snapshotV2 = buildProjectContextSnapshot({ project: projectV2 });
  });

  it("W1ST01-01 product Project snapshot reaches Knowledge", () => {
    expect(knowledgeInvocation.request.sourceProject.snapshotDigest).toBe(snapshot.snapshotDigest);
  });
  it("W1ST01-02 real Knowledge OwnerResult reaches ST", () => {
    expect(stInvocation.knowledgeOwnerResult).toEqual(knowledgeInvocation.result);
    expect(stNativeInput.knowledge.resultDigest).toBe(knowledgeResult.resultDigest);
    expect(stInvocation.result, JSON.stringify(stInvocation.observation)).not.toBeNull();
  });
  it("W1ST01-03 preserves the same Project ID", () => expect(stInvocation.result?.sourceProjectRef).toBe(project.projectId));
  it("W1ST01-04 preserves the same Project version", () => expect(stInvocation.result?.sourceProjectVersion).toBe(project.versionId));
  it("W1ST01-05 preserves the same Project digest", () => expect(stInvocation.result?.sourceProjectDigest).toBe(project.projectDigest));
  it("W1ST01-06 preserves KnowledgeResult identity", () => expect(stNativeInput.knowledge.resultId).toBe(knowledgeResult.resultId));
  it("W1ST01-07 preserves KnowledgeResult digest/version", () => {
    expect(stNativeInput.knowledge).toMatchObject({ resultRevision: knowledgeResult.resultRevision, resultDigest: knowledgeResult.resultDigest });
  });
  it("W1ST01-08 invokes the native ST engine exactly once", () => expect(stNativeStarts).toBe(1));
  it("W1ST01-09 keeps the native result rather than Gemini reconstruction", () => {
    expect(stInvocation.result?.nativePayload).toEqual(stNativeOutput);
    expect(stInvocation.geminiCalls).toBe(0);
  });
  it("W1ST01-10 retains Knowledge ownership for assertions", () => {
    expect(stNativeOutput.knowledgeDependencies[0]).toMatchObject({ owner: "KNOWLEDGE", ownershipTransferred: false });
    expect(stNativeOutput.knowledgeDependencies[0]?.assertionRefs).toEqual(knowledgeResult.applicableAssertions.map((item) => item.stableId));
  });
  it("W1ST01-11 retains ST ownership for ST candidates", () => {
    expect(stInvocation.result?.projectContribution?.scientificContent.candidateObjects[0]?.epistemicBoundary.ownership).toBe("SCIENTIFIC_THINKING");
    expect(stInvocation.result?.projectContribution?.epistemicBoundary.candidateIsAdopted).toBe(false);
  });
  it("W1ST01-12 preserves source/evidence lineage", () => {
    const dependency = stNativeOutput.knowledgeDependencies[0]!;
    expect(dependency.evidenceRefs).toEqual(knowledgeResult.evidence.map((item) => item.evidenceId));
    expect(dependency.sourceRefs).toEqual(knowledgeResult.sources.map((item) => item.sourceId));
    expect(stInvocation.result?.evidenceRefs).toEqual(expect.arrayContaining([...dependency.evidenceRefs, ...dependency.sourceRefs]));
  });
  it("W1ST01-13 preserves Knowledge applicability", () => {
    expect(stNativeOutput.knowledgeDependencies[0]?.applicability).toEqual(stNativeInput.knowledge.applicability);
  });
  it("W1ST01-14 preserves Knowledge limitations", () => {
    expect(stNativeInput.knowledge.limitations).toEqual(knowledgeResult.limitations);
    expect(stInvocation.result?.limitations).toEqual(expect.arrayContaining(knowledgeResult.limitations));
  });
  it("W1ST01-15 preserves a Knowledge gap", () => {
    expect(noKnowledgeInvocation.request.nativeInput.knowledge.gapCodes).toContain("PROJECT_SPINE_04_KNOWLEDGE_NOT_INVOKED");
    expect(noKnowledgeInvocation.result?.nativePayload?.knowledgeRequest?.status).toBe("REQUIRED");
  });
  it("W1ST01-16 preserves contradictions", () => {
    expect(contradictionKnowledgeResult.controversies.length).toBeGreaterThan(0);
    expect(contradictionStInvocation.result?.nativePayload?.knowledgeDependencies[0]?.contradictionRefs).toEqual(contradictionKnowledgeResult.controversies.map((item) => item.conflictId));
  });
  it("W1ST01-17 does not resolve a contradiction silently", () => {
    expect(contradictionStInvocation.result?.nativePayload?.contradictions).toEqual(expect.arrayContaining(contradictionKnowledgeResult.controversies.map((item) => `${item.conflictId}:${item.state}:${item.explanation}`)));
  });
  it("W1ST01-18 does not promote a gap to fact", () => {
    expect(noKnowledgeInvocation.result?.nativePayload?.hypotheses.every((item) => item.support !== "SUPPORTED")).toBe(true);
  });
  it("W1ST01-19 rejects a stale KnowledgeResult", () => {
    expect(() => invokeScientificThinkingForProject({
      project: projectV2,
      projectSnapshot: snapshotV2,
      knowledgeResultId: knowledgeInvocation.result!.resultId,
      ledger: noKnowledgeInvocation.ledger,
      callerRef: "W1-ST-01:STALE_DIAGNOSTIC",
      purpose: "Doit échouer fermé.",
      startedAt: "2026-08-25T12:21:00.000Z",
      completedAt: "2026-08-25T12:21:01.000Z",
    })).toThrow("STALE_KNOWLEDGE_RESULT");
  });
  it("W1ST01-20 detects a stale ST result", () => {
    expect(readProductScientificThinkingOwnerResult({ ledger: noKnowledgeInvocation.ledger, resultId: stInvocation.result!.resultId, currentProjectSnapshot: snapshotV2 }).freshness.status).toBe("STALE_OWNER_RESULT");
    expect(() => requireCurrentProductScientificThinkingOwnerResult({ ledger: noKnowledgeInvocation.ledger, resultId: stInvocation.result!.resultId, currentProjectSnapshot: snapshotV2 })).toThrow("STALE_SCIENTIFIC_THINKING_RESULT");
    expect(readProductScientificThinkingOwnerResult({ ledger: noKnowledgeInvocation.ledger, resultId: stInvocation.result!.resultId, currentProjectSnapshot: snapshot, currentKnowledgeResultId: contradictionKnowledgeInvocation.result!.resultId }).freshness.staleReasons).toContain("KNOWLEDGE_RESULT_DEPENDENCY_CHANGED");
    expect(readProductScientificThinkingOwnerResult({
      ledger: noKnowledgeInvocation.ledger,
      resultId: stInvocation.result!.resultId,
      currentProjectSnapshot: snapshot,
      currentKnowledgeResult: {
        resultId: knowledgeInvocation.result!.resultId,
        resultVersion: "999",
        nativeResultDigest: knowledgeResult.resultDigest,
      },
    }).freshness.staleReasons).toContain("KNOWLEDGE_RESULT_DEPENDENCY_CHANGED");
  });
  it("W1ST01-21 keeps Knowledge and ST in the same ledger", () => {
    expect(stInvocation.ledger.entries.map((entry) => entry.result?.owner)).toEqual(["KNOWLEDGE", "SCIENTIFIC_THINKING"]);
  });
  it("W1ST01-22 keeps the ledger immutable", () => {
    expect(Object.isFrozen(stInvocation.ledger)).toBe(true);
    expect(Object.isFrozen(stInvocation.entry)).toBe(true);
    const storage = new MemoryStorage();
    const session = { ...productSession, projectId: project.projectId, project, knowledgeOwnerLedger: noKnowledgeInvocation.ledger };
    persistFunctionalResetSession(storage, session);
    expect(loadFunctionalResetSession(storage).knowledgeOwnerLedger).toEqual(noKnowledgeInvocation.ledger);

    const historicalEntry = knowledgeInvocation.ledger.entries[0]!;
    const { dependencies: _newField, entryDigest: _currentDigest, ...historicalEntryMaterial } = historicalEntry;
    const legacyEntry = { ...historicalEntryMaterial, entryDigest: logicalDigest(historicalEntryMaterial) };
    const legacyLedgerMaterial = {
      contract: "PROTOCOL_DESIGNER_KNOWLEDGE_OWNER_LEDGER" as const,
      contractVersion: "0.1.0" as const,
      sessionId: productSession.sessionId,
      entries: [legacyEntry],
      appendOnly: true as const,
      projectWriteAuthorized: false as const,
    };
    storage.setItem("noxia.protocol-designer.functional-reset.v1", JSON.stringify({
      ...productSession,
      knowledgeOwnerLedger: { ...legacyLedgerMaterial, ledgerDigest: logicalDigest(legacyLedgerMaterial) },
    }));
    const migrated = loadFunctionalResetSession(storage).knowledgeOwnerLedger;
    expect(migrated).toMatchObject({ contractVersion: "0.2.0", sessionId: productSession.sessionId });
    expect(migrated.entries[0]?.result).toEqual(knowledgeInvocation.result);
  });
  it("W1ST01-23 performs zero Project writes", () => {
    expect(stInvocation.projectWrites).toBe(0);
    expect(stInvocation.observation.projectWrites).toBe(0);
    expect(stableStringify(project)).toBe(stableStringify(stInvocation.request.sourceProject.owner === "RESEARCH_PROJECT" ? project : null));
  });
  it("W1ST01-24 does not bypass Human Decision", () => {
    expect(stInvocation.humanDecisionBypassed).toBe(false);
    expect(stInvocation.result?.humanDecisionRequired).toBe(true);
    expect(stInvocation.result?.projectWriteAuthorized).toBe(false);
  });
  it("W1ST01-25 makes no Gemini, Terra or External Evidence call", () => {
    expect(stInvocation).toMatchObject({ geminiCalls: 0, terraCalls: 0, externalEvidenceCalls: 0 });
    expect(knowledgeResult.externalEvidence).toBeNull();
  });
  it("W1ST01-26 preserves the explicit no-Knowledge degraded path", () => {
    expect(noKnowledgeInvocation.request.nativeInput.knowledge).toMatchObject({ resultId: null, support: "UNAVAILABLE" });
    expect(noKnowledgeInvocation.result?.gaps).toContain("PROJECT_SPINE_04_KNOWLEDGE_NOT_INVOKED");
  });
  it("W1ST01-27 preserves SPINE-04", () => {
    const spine = invokeScientificThinkingOwnerFromProject({ project, startedAt: "2026-08-25T12:30:00.000Z", completedAt: "2026-08-25T12:30:01.000Z" });
    expect(spine.observation).toMatchObject({ owner: "SCIENTIFIC_THINKING", runtimeStarts: 1, projectWrites: 0 });
    expect(spine.request.nativeInput.knowledge.resultId).toBeNull();
  });
  it("W1ST01-28 preserves W1-Knowledge", () => {
    expect(knowledgeInvocation.result?.nativePayload).toEqual(knowledgeResult);
    expect(knowledgeInvocation.ledger.entries).toHaveLength(1);
  });
});
