import { beforeAll, describe, expect, it } from "vitest";
import { executeKnowledgeRequest, stableStringify } from "@/features/knowledge-engine";
import { executeImagingStudyDesigner } from "@/features/imaging-study-designer";
import { executeScientificThinkingEngine } from "@/features/scientific-thinking";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation/contracts";
import {
  contributionFromPersistentDelta,
  validatePersistentProjectDelta,
  type PersistentProjectDeltaChange,
} from "@/features/protocol-designer/product-bridge";
import { invokeKnowledgeForProject } from "@/features/protocol-designer/product-knowledge-owner-runtime";
import { invokeScientificThinkingForProject } from "@/features/protocol-designer/product-scientific-thinking-owner-runtime";
import { invokeImagingForProject } from "@/features/protocol-designer/product-imaging-owner-runtime";
import {
  executeScientificOwnerChainValidationProfile,
  replayScientificOwnerChainValidationProfile,
  validateScientificOwnerChainForProject,
  type ScientificOwnerChainValidationInput,
} from "@/features/protocol-designer/product-scientific-loop-validation-runtime";
import { readProductValidationRun } from "@/features/protocol-designer/product-validation-run-ledger";
import {
  buildKnowledgeRequestFromCanonicalSnapshot,
  buildProjectContextSnapshot,
  confirmResearchProjectContribution,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import { getValidationCheckpointV1, getValidator, verifyValidationRunDigest } from "@/features/validation-architecture";
import {
  createFunctionalResetSession,
  loadFunctionalResetSession,
  persistFunctionalResetSession,
} from "../session";

const authority = {
  actorRef: "w1-val-01:researcher",
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
    projectId: input.current?.projectId ?? "project:w1-val-01",
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

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const observationBy = (run: ReturnType<typeof executeScientificOwnerChainValidationProfile>["run"], fragment: string) => run.observations.find((item) => item.evidence.some((proof) => proof.comparisonNote?.includes(fragment)));

let productSession: ReturnType<typeof createFunctionalResetSession>;
let project: ResearchProjectOwnerProjection;
let projectV2: ResearchProjectOwnerProjection;
let snapshot: ReturnType<typeof buildProjectContextSnapshot>;
let snapshotV2: ReturnType<typeof buildProjectContextSnapshot>;
let knowledgeInvocation: ReturnType<typeof invokeKnowledgeForProject>;
let stInvocation: ReturnType<typeof invokeScientificThinkingForProject>;
let imagingInvocation: ReturnType<typeof invokeImagingForProject>;
let validationInvocation: ReturnType<typeof validateScientificOwnerChainForProject>;
let observationInput: ScientificOwnerChainValidationInput;

describe("W1-VAL-01 — product scientific owner loop observation", () => {
  beforeAll(() => {
    project = projectFor();
    snapshot = buildProjectContextSnapshot({ project });
    productSession = { ...createFunctionalResetSession("2026-08-25T15:00:00.000Z"), projectId: project.projectId, project };
    const knowledgeRequest = buildKnowledgeRequestFromCanonicalSnapshot({
      projectSnapshot: snapshot,
      question: "Quelles connaissances locales soutiennent T1 mapping et ECV en IRM cardiaque ?",
      createdAt: "2026-08-25T15:01:00.000Z",
    });
    knowledgeInvocation = invokeKnowledgeForProject({
      project,
      projectSnapshot: snapshot,
      knowledgeRequest,
      ledger: productSession.knowledgeOwnerLedger,
      callerRef: "W1-VAL-01:PRODUCT_DIAGNOSTIC",
      purpose: knowledgeRequest.originalQuestion,
      startedAt: "2026-08-25T15:01:00.000Z",
      completedAt: "2026-08-25T15:01:01.000Z",
      runtime: executeKnowledgeRequest,
    });
    stInvocation = invokeScientificThinkingForProject({
      project,
      projectSnapshot: snapshot,
      knowledgeResultId: knowledgeInvocation.result!.resultId,
      ledger: knowledgeInvocation.ledger,
      callerRef: "W1-VAL-01:PRODUCT_DIAGNOSTIC",
      purpose: "Construire les branches scientifiques candidates.",
      startedAt: "2026-08-25T15:02:00.000Z",
      completedAt: "2026-08-25T15:02:01.000Z",
      runtime: executeScientificThinkingEngine,
    });
    imagingInvocation = invokeImagingForProject({
      project,
      projectSnapshot: snapshot,
      knowledgeResultId: knowledgeInvocation.result!.resultId,
      scientificThinkingResultId: stInvocation.result!.resultId,
      ledger: stInvocation.ledger,
      callerRef: "W1-VAL-01:PRODUCT_DIAGNOSTIC",
      purpose: "Proposer les options Imaging sans qualification OBS fictive.",
      startedAt: "2026-08-25T15:03:00.000Z",
      completedAt: "2026-08-25T15:03:01.000Z",
      runtime: executeImagingStudyDesigner,
    });
    observationInput = {
      validationInvocationId: "w1-val-01:clean-chain",
      projectSnapshot: snapshot,
      knowledgeEntry: knowledgeInvocation.entry,
      scientificThinkingEntry: stInvocation.entry,
      imagingEntry: imagingInvocation.entry,
      callerRef: "W1-VAL-01:PRODUCT_DIAGNOSTIC",
      purpose: "Observer la fidélité structurelle du corridor scientifique produit.",
      completedAt: "2026-08-25T15:04:00.000Z",
    };
    validationInvocation = validateScientificOwnerChainForProject({
      project,
      projectSnapshot: snapshot,
      ownerResultLedger: imagingInvocation.ledger,
      validationLedger: productSession.validationRunLedger,
      knowledgeResultId: knowledgeInvocation.result!.resultId,
      scientificThinkingResultId: stInvocation.result!.resultId,
      imagingResultId: imagingInvocation.result!.resultId,
      validationInvocationId: observationInput.validationInvocationId,
      callerRef: observationInput.callerRef,
      purpose: observationInput.purpose,
      completedAt: observationInput.completedAt,
    });
    projectV2 = advanceProject(project);
    snapshotV2 = buildProjectContextSnapshot({ project: projectV2 });
  });

  it("W1VAL01-01 real product K→ST→IMG chain reaches VAL", () => {
    expect(validationInvocation.validationEntry.ownerResultRefs.map((item) => item.owner)).toEqual(["KNOWLEDGE", "SCIENTIFIC_THINKING", "IMAGING"]);
    expect(validationInvocation.boundedStatus).toBe("STRUCTURAL_FIDELITY_PASS");
  });

  it("W1VAL01-02 invokes the native VAL deterministic engine", () => {
    expect(validationInvocation.nativeValEngineInvocations).toBe(1);
    expect(validationInvocation.run.validatorVersions).toContainEqual({ validatorId: "VAL-001-DETERMINISTIC-ENGINE", version: "1.0.0" });
    expect(validationInvocation.run.validatorVersions).toContainEqual({ validatorId: "VAL-PRODUCT-SCIENTIFIC-OWNER-CHAIN-FIDELITY", version: "0.1.0" });
  });

  it("W1VAL01-03 preserves Project ID", () => expect(validationInvocation.validationEntry.projectSnapshotRef.projectId).toBe(project.projectId));
  it("W1VAL01-04 preserves Project version", () => expect(validationInvocation.validationEntry.projectSnapshotRef.projectVersion).toBe(project.versionId));
  it("W1VAL01-05 preserves Project digest", () => expect(validationInvocation.validationEntry.projectSnapshotRef.projectDigest).toBe(project.projectDigest));
  it("W1VAL01-06 preserves Knowledge identity", () => expect(validationInvocation.validationEntry.ownerResultRefs[0].resultId).toBe(knowledgeInvocation.result!.resultId));
  it("W1VAL01-07 preserves ST identity", () => expect(validationInvocation.validationEntry.ownerResultRefs[1].resultId).toBe(stInvocation.result!.resultId));
  it("W1VAL01-08 preserves Imaging identity", () => expect(validationInvocation.validationEntry.ownerResultRefs[2].resultId).toBe(imagingInvocation.result!.resultId));

  it("W1VAL01-09 checks Knowledge evidence lineage", () => expect(observationBy(validationInvocation.run, "Knowledge source/evidence references")?.observationType).toBe("PRESERVED"));
  it("W1VAL01-10 checks ST dependency lineage", () => expect(observationBy(validationInvocation.run, "ST must preserve the exact Knowledge")?.observationType).toBe("PRESERVED"));
  it("W1VAL01-11 checks Imaging dependency lineage", () => expect(observationBy(validationInvocation.run, "exact Scientific Thinking")?.observationType).toBe("PRESERVED"));
  it("W1VAL01-12 checks Knowledge ownership", () => expect(observationBy(validationInvocation.run, "Knowledge-owned content")?.observationType).toBe("PRESERVED"));
  it("W1VAL01-13 checks ST ownership", () => expect(observationBy(validationInvocation.run, "Scientific Thinking candidates")?.observationType).toBe("PRESERVED"));
  it("W1VAL01-14 checks Imaging ownership", () => expect(observationBy(validationInvocation.run, "Imaging candidates")?.observationType).toBe("PRESERVED"));
  it("W1VAL01-15 checks unknown preservation and diagnoses an improper loss", () => {
    expect(observationBy(validationInvocation.run, "ST unknowns")?.observationType).toBe("PRESERVED");
    expect(stInvocation.result!.unknowns.length).toBeGreaterThan(0);
    const broken = structuredClone(imagingInvocation.entry) as typeof imagingInvocation.entry;
    (broken.result as unknown as { unknowns: string[] }).unknowns = [];
    const result = executeScientificOwnerChainValidationProfile({ ...observationInput, validationInvocationId: "w1-val-01:lost-unknown", imagingEntry: broken });
    expect(result.run.findings.some((item) => item.domainFailureClassRef === "UNKNOWN_LOST")).toBe(true);
    expect(broken.result?.unknowns).toEqual([]);
  });
  it("W1VAL01-16 checks limitation preservation", () => expect(observationBy(validationInvocation.run, "Knowledge limitations")?.observationType).toBe("PRESERVED"));
  it("W1VAL01-17 checks contradiction preservation", () => expect(observationBy(validationInvocation.run, "Knowledge contradictions")?.observationType).toBe("PRESERVED"));
  it("W1VAL01-18 checks OBS gap preservation", () => expect(observationBy(validationInvocation.run, "EXPECTED_CAPABILITY_GAP_PRESERVED")?.observationType).toBe("PRESERVED"));
  it("W1VAL01-19 does not promote expected OBS absence to scientific failure", () => {
    expect(validationInvocation.run.findings.some((item) => item.owner === "OBS-001")).toBe(false);
    expect(validationInvocation.scientificQualificationClaimed).toBe(false);
    expect(validationInvocation.run.pd011QualificationClaimed).toBe(false);
  });

  it("W1VAL01-20 diagnoses a Project mismatch", () => {
    const result = executeScientificOwnerChainValidationProfile({ ...observationInput, validationInvocationId: "w1-val-01:project-v2", projectSnapshot: snapshotV2 });
    expect(result.run.findings.filter((item) => item.domainFailureClassRef?.startsWith("STALE_")).length).toBe(3);
    expect(result.boundedStatus).toBe("STRUCTURAL_FIDELITY_FINDINGS");
    expect(() => validateScientificOwnerChainForProject({
      project: projectV2,
      projectSnapshot: snapshot,
      ownerResultLedger: imagingInvocation.ledger,
      validationLedger: productSession.validationRunLedger,
      knowledgeResultId: knowledgeInvocation.result!.resultId,
      scientificThinkingResultId: stInvocation.result!.resultId,
      imagingResultId: imagingInvocation.result!.resultId,
      validationInvocationId: "w1-val-01:product-project-mismatch",
      callerRef: observationInput.callerRef,
      purpose: observationInput.purpose,
      completedAt: observationInput.completedAt,
    })).toThrowError("VAL_PRODUCT_PROJECT_SNAPSHOT_MISMATCH");
  });

  it("W1VAL01-21 diagnoses stale Knowledge", () => {
    const result = executeScientificOwnerChainValidationProfile({ ...observationInput, validationInvocationId: "w1-val-01:stale-k", projectSnapshot: snapshotV2 });
    expect(result.run.findings.some((item) => item.domainFailureClassRef === "STALE_KNOWLEDGE_RESULT")).toBe(true);
  });

  it("W1VAL01-22 diagnoses stale ST", () => {
    const result = executeScientificOwnerChainValidationProfile({ ...observationInput, validationInvocationId: "w1-val-01:stale-st", projectSnapshot: snapshotV2 });
    expect(result.run.findings.some((item) => item.domainFailureClassRef === "STALE_SCIENTIFIC_THINKING_RESULT")).toBe(true);
  });

  it("W1VAL01-23 diagnoses stale Imaging", () => {
    const result = executeScientificOwnerChainValidationProfile({ ...observationInput, validationInvocationId: "w1-val-01:stale-img", projectSnapshot: snapshotV2 });
    expect(result.run.findings.some((item) => item.domainFailureClassRef === "STALE_IMAGING_RESULT")).toBe(true);
  });

  it("W1VAL01-24 diagnoses missing lineage without reconstructing it", () => {
    const broken = structuredClone(stInvocation.entry) as typeof stInvocation.entry;
    (broken as unknown as { dependencies: unknown[] }).dependencies = [];
    const result = executeScientificOwnerChainValidationProfile({ ...observationInput, validationInvocationId: "w1-val-01:missing-lineage", scientificThinkingEntry: broken });
    expect(result.run.findings.some((item) => item.domainFailureClassRef === "KNOWLEDGE_TO_ST_LINEAGE_MISSING")).toBe(true);
    expect(broken.dependencies).toEqual([]);
  });

  it("W1VAL01-25 diagnoses ownership violation without rewriting owner", () => {
    const broken = structuredClone(stInvocation.entry) as typeof stInvocation.entry;
    const dependency = broken.result?.nativePayload?.knowledgeDependencies[0] as unknown as { ownershipTransferred: boolean };
    dependency.ownershipTransferred = true;
    const result = executeScientificOwnerChainValidationProfile({ ...observationInput, validationInvocationId: "w1-val-01:owner-violation", scientificThinkingEntry: broken });
    expect(result.run.findings.some((item) => item.findingClass === "OWNERSHIP_VIOLATION")).toBe(true);
    expect(dependency.ownershipTransferred).toBe(true);
  });

  it("W1VAL01-26 performs no repair", () => {
    const before = stableStringify(observationInput);
    const result = executeScientificOwnerChainValidationProfile({ ...observationInput, validationInvocationId: "w1-val-01:no-repair" });
    expect(result.repairCalls).toBe(0);
    expect(stableStringify(observationInput)).toBe(before);
    expect(result.run.autoFixAllowed).toBe(false);
  });

  it("W1VAL01-27 performs zero Project writes", () => expect(validationInvocation.projectWrites).toBe(0));
  it("W1VAL01-28 does not bypass Human Decision", () => {
    expect(validationInvocation.humanDecisionBypassed).toBe(false);
    expect(validationInvocation.run.autoDecisionAllowed).toBe(false);
  });

  it("W1VAL01-29 retains an immutable ValidationRun", () => {
    expect(Object.isFrozen(validationInvocation.run)).toBe(true);
    expect(Object.isFrozen(validationInvocation.validationEntry)).toBe(true);
    expect(verifyValidationRunDigest(validationInvocation.run)).toBe(true);
  });

  it("W1VAL01-30 replays and reloads the exact ValidationRun", () => {
    const replay = replayScientificOwnerChainValidationProfile({ previousRun: validationInvocation.run, observationInput });
    expect(replay.resultDigest).toBe(validationInvocation.run.resultDigest);
    const readback = readProductValidationRun({ ledger: validationInvocation.validationLedger, validationRunId: validationInvocation.run.validationRunId });
    expect(readback.run).toEqual(validationInvocation.run);
    const storage = new MemoryStorage();
    persistFunctionalResetSession(storage, {
      ...productSession,
      knowledgeOwnerLedger: imagingInvocation.ledger,
      validationRunLedger: validationInvocation.validationLedger,
    });
    const loaded = loadFunctionalResetSession(storage);
    expect(loaded.validationRunLedger).toEqual(validationInvocation.validationLedger);
  });

  it("W1VAL01-31 performs no Gemini, Terra or External Evidence call", () => {
    expect(validationInvocation).toMatchObject({ geminiCalls: 0, terraCalls: 0, externalEvidenceCalls: 0, semanticReviewerCalls: 0, obsRuntimeCalls: 0 });
  });
  it("W1VAL01-32 preserves W1 Knowledge", () => expect(knowledgeInvocation.result).toMatchObject({ owner: "KNOWLEDGE", projectWriteAuthorized: false }));
  it("W1VAL01-33 preserves W1 Scientific Thinking", () => expect(stInvocation.result).toMatchObject({ owner: "SCIENTIFIC_THINKING", projectWriteAuthorized: false }));
  it("W1VAL01-34 preserves W1 Imaging", () => expect(imagingInvocation.result).toMatchObject({ owner: "IMAGING", projectWriteAuthorized: false }));
  it("W1VAL01-35 keeps historical VAL contracts readable", () => {
    expect(getValidationCheckpointV1("VAL-ST-OBS-IMG-001", "1.0.0")?.historicalCheckpointRefs).toContainEqual({ checkpointId: "VAL-ST-IMG-001", version: "1.0.0", mapping: "PARTIAL" });
    expect(getValidator("VAL-ST-IMG-001")?.version).toBe("1.0.0");
  });
});
