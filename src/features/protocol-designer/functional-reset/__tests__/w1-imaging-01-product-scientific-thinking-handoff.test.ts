import { beforeAll, describe, expect, it } from "vitest";
import {
  createKnowledgeRequest,
  executeKnowledgeRequest,
  stableStringify,
  type KnowledgeResult,
} from "@/features/knowledge-engine";
import { executeImagingStudyDesigner, type ImagingDesignInput, type ImagingDesignResult } from "@/features/imaging-study-designer";
import {
  contributionFromPersistentDelta,
  validatePersistentProjectDelta,
  type PersistentProjectDeltaChange,
} from "@/features/protocol-designer/product-bridge";
import {
  invokeImagingForProject,
  readProductImagingOwnerResult,
} from "@/features/protocol-designer/product-imaging-owner-runtime";
import { invokeKnowledgeForProject } from "@/features/protocol-designer/product-knowledge-owner-runtime";
import { invokeScientificThinkingForProject } from "@/features/protocol-designer/product-scientific-thinking-owner-runtime";
import { ownerResultNativeDigest } from "@/features/protocol-designer/product-owner-result-ledger";
import { executeScientificThinkingEngine, type ScientificThinkingInput } from "@/features/scientific-thinking";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation/contracts";
import {
  buildKnowledgeRequestFromCanonicalSnapshot,
  buildProjectContextSnapshot,
  confirmResearchProjectContribution,
  invokeImagingOwnerFromScientificThinking,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import { createFunctionalResetSession } from "../session";

const authority = {
  actorRef: "w1-imaging-01:researcher",
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
    contribution: contribution!, current: input.current, projectId: input.current?.projectId ?? "project:w1-imaging-01", authority, confirmedAt: input.at,
  });
};

const projectFor = () => {
  const raw = "Chez des adultes avec fibrose myocardique, étudier l'association entre T1 mapping et ECV en IRM cardiaque.";
  return adopt({
    current: null,
    raw,
    at: "2026-08-25T14:00:00.000Z",
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
    at: "2026-08-25T14:20:00.000Z",
    changes: [change({ candidateRef: "design:multicenter", proposedType: "STUDY_DESIGN", targetSectionId: "DESIGN", content: "Étude multicentrique", sourceText: raw })],
  });
};

let project: ResearchProjectOwnerProjection;
let projectV2: ResearchProjectOwnerProjection;
let snapshot: ReturnType<typeof buildProjectContextSnapshot>;
let snapshotV2: ReturnType<typeof buildProjectContextSnapshot>;
let knowledgeResult: KnowledgeResult;
let gapKnowledgeResult: KnowledgeResult;
let knowledgeInvocation: ReturnType<typeof invokeKnowledgeForProject>;
let replacementKnowledgeInvocation: ReturnType<typeof invokeKnowledgeForProject>;
let gapKnowledgeInvocation: ReturnType<typeof invokeKnowledgeForProject>;
let stInvocation: ReturnType<typeof invokeScientificThinkingForProject>;
let gapStInvocation: ReturnType<typeof invokeScientificThinkingForProject>;
let imagingInvocation: ReturnType<typeof invokeImagingForProject>;
let gapImagingInvocation: ReturnType<typeof invokeImagingForProject>;
let imagingNativeInput: ImagingDesignInput;
let imagingNativeOutput: ImagingDesignResult;
let imagingNativeStarts = 0;

describe("W1-IMAGING-01 — product Scientific Thinking → Imaging handoff", () => {
  beforeAll(() => {
    project = projectFor();
    snapshot = buildProjectContextSnapshot({ project });
    let ledger = createFunctionalResetSession("2026-08-25T14:00:00.000Z").knowledgeOwnerLedger;
    const knowledgeRequest = buildKnowledgeRequestFromCanonicalSnapshot({
      projectSnapshot: snapshot,
      question: "Quelles connaissances locales soutiennent T1 mapping et ECV en IRM cardiaque ?",
      createdAt: "2026-08-25T14:01:00.000Z",
    });
    knowledgeInvocation = invokeKnowledgeForProject({
      project, projectSnapshot: snapshot, knowledgeRequest, ledger,
      callerRef: "W1-IMAGING-01:PRODUCT_DIAGNOSTIC", purpose: knowledgeRequest.originalQuestion,
      startedAt: "2026-08-25T14:01:00.000Z", completedAt: "2026-08-25T14:01:01.000Z",
      runtime: (request) => {
        knowledgeResult = executeKnowledgeRequest(request);
        return knowledgeResult;
      },
    });
    ledger = knowledgeInvocation.ledger;
    let stNativeInput: ScientificThinkingInput;
    stInvocation = invokeScientificThinkingForProject({
      project, projectSnapshot: snapshot, knowledgeResultId: knowledgeInvocation.result!.resultId, ledger,
      callerRef: "W1-IMAGING-01:PRODUCT_DIAGNOSTIC", purpose: "Construire des branches scientifiques candidates avant la spécialisation Imaging.",
      startedAt: "2026-08-25T14:02:00.000Z", completedAt: "2026-08-25T14:02:01.000Z",
      runtime: (request) => {
        stNativeInput = request;
        return executeScientificThinkingEngine(stNativeInput);
      },
    });
    ledger = stInvocation.ledger;
    imagingInvocation = invokeImagingForProject({
      project, projectSnapshot: snapshot, knowledgeResultId: knowledgeInvocation.result!.resultId,
      scientificThinkingResultId: stInvocation.result!.resultId, ledger,
      callerRef: "W1-IMAGING-01:PRODUCT_DIAGNOSTIC", purpose: "Proposer des stratégies Imaging candidates sans qualification OBS fictive.",
      startedAt: "2026-08-25T14:03:00.000Z", completedAt: "2026-08-25T14:03:01.000Z",
      runtime: (request) => {
        imagingNativeStarts += 1;
        imagingNativeInput = request;
        imagingNativeOutput = executeImagingStudyDesigner(request);
        return imagingNativeOutput;
      },
    });
    ledger = imagingInvocation.ledger;

    const replacementRequest = createKnowledgeRequest({
      originalQuestion: "Quelle connaissance locale qualifie spécifiquement la reproductibilité de l'ECV ?",
      scientificObjectTerms: [{ term: "ECV" }, { term: "reproductibilité" }],
      researchProjectId: snapshot.sourceProjectRef,
      strategyVersion: snapshot.sourceProjectVersion,
      consumer: "IMAGING_STUDY_DESIGNER",
      externalSearchPolicy: "INTERNAL_ONLY",
      createdAt: "2026-08-25T14:04:00.000Z",
    });
    replacementKnowledgeInvocation = invokeKnowledgeForProject({
      project, projectSnapshot: snapshot, knowledgeRequest: replacementRequest, ledger,
      callerRef: "W1-IMAGING-01:DEPENDENCY_DIAGNOSTIC", purpose: replacementRequest.originalQuestion,
      startedAt: "2026-08-25T14:04:00.000Z", completedAt: "2026-08-25T14:04:01.000Z",
    });
    ledger = replacementKnowledgeInvocation.ledger;

    const gapRequest = createKnowledgeRequest({
      originalQuestion: "Quelle connaissance locale établit une mesure de zéphyr quantique ?",
      scientificObjectTerms: [{ term: "zéphyr quantique" }],
      researchProjectId: snapshot.sourceProjectRef,
      strategyVersion: snapshot.sourceProjectVersion,
      consumer: "IMAGING_STUDY_DESIGNER",
      externalSearchPolicy: "INTERNAL_ONLY",
      createdAt: "2026-08-25T14:05:00.000Z",
    });
    gapKnowledgeInvocation = invokeKnowledgeForProject({
      project, projectSnapshot: snapshot, knowledgeRequest: gapRequest, ledger,
      callerRef: "W1-IMAGING-01:GAP_DIAGNOSTIC", purpose: gapRequest.originalQuestion,
      startedAt: "2026-08-25T14:05:00.000Z", completedAt: "2026-08-25T14:05:01.000Z",
      runtime: (request) => {
        gapKnowledgeResult = executeKnowledgeRequest(request);
        return gapKnowledgeResult;
      },
    });
    ledger = gapKnowledgeInvocation.ledger;
    gapStInvocation = invokeScientificThinkingForProject({
      project, projectSnapshot: snapshot, knowledgeResultId: gapKnowledgeInvocation.result!.resultId, ledger,
      callerRef: "W1-IMAGING-01:GAP_DIAGNOSTIC", purpose: "Préserver explicitement le gap Knowledge.",
      startedAt: "2026-08-25T14:06:00.000Z", completedAt: "2026-08-25T14:06:01.000Z",
    });
    ledger = gapStInvocation.ledger;
    gapImagingInvocation = invokeImagingForProject({
      project, projectSnapshot: snapshot, knowledgeResultId: gapKnowledgeInvocation.result!.resultId,
      scientificThinkingResultId: gapStInvocation.result!.resultId, ledger,
      callerRef: "W1-IMAGING-01:GAP_DIAGNOSTIC", purpose: "Ne pas halluciner une technique validée.",
      startedAt: "2026-08-25T14:07:00.000Z", completedAt: "2026-08-25T14:07:01.000Z",
    });
    projectV2 = advanceProject(project);
    snapshotV2 = buildProjectContextSnapshot({ project: projectV2 });
  });

  it("W1IMG01-01 canonical Project reaches Knowledge", () => expect(knowledgeInvocation.request.sourceProject.snapshotDigest).toBe(snapshot.snapshotDigest));
  it("W1IMG01-02 real Knowledge result reaches ST", () => expect(stInvocation.knowledgeOwnerResult).toEqual(knowledgeInvocation.result));
  it("W1IMG01-03 real ST result reaches Imaging", () => expect(imagingInvocation.scientificThinkingOwnerResult).toEqual(stInvocation.result));
  it("W1IMG01-04 preserves the same canonical Project snapshot and ID", () => {
    expect(imagingInvocation.request.sourceProject).toEqual(snapshot);
    expect(imagingInvocation.result?.sourceProjectRef).toBe(project.projectId);
  });
  it("W1IMG01-05 preserves the same Project version", () => expect(imagingInvocation.result?.sourceProjectVersion).toBe(project.versionId));
  it("W1IMG01-06 preserves the same Project digest", () => expect(imagingInvocation.result?.sourceProjectDigest).toBe(project.projectDigest));
  it("W1IMG01-07 preserves Knowledge identity", () => {
    expect(imagingNativeInput.knowledge.resultId).toBe(knowledgeResult.resultId);
    expect(imagingNativeInput.knowledge.resultDigest).toBe(knowledgeResult.resultDigest);
  });
  it("W1IMG01-08 preserves ST identity", () => {
    expect(imagingNativeInput.sourceHandoff.stOutputRef).toBe(stInvocation.result?.nativePayload?.outputId);
    expect(imagingInvocation.entry.dependencies).toContainEqual(expect.objectContaining({ owner: "SCIENTIFIC_THINKING", resultId: stInvocation.result?.resultId }));
  });
  it("W1IMG01-09 invokes the native Imaging engine", () => expect(imagingNativeStarts).toBe(1));
  it("W1IMG01-10 retains the native Imaging result rather than Gemini output", () => expect(imagingInvocation.result?.nativePayload).toEqual(imagingNativeOutput));
  it("W1IMG01-11 preserves Knowledge ownership", () => expect(stInvocation.result?.nativePayload?.knowledgeDependencies[0]).toMatchObject({ owner: "KNOWLEDGE", ownershipTransferred: false }));
  it("W1IMG01-12 preserves Scientific Thinking ownership", () => expect(imagingInvocation.result?.provenance).toContain(`${stInvocation.result?.resultId}@${stInvocation.result?.resultVersion}`));
  it("W1IMG01-13 preserves Imaging ownership", () => {
    expect(imagingInvocation.result).toMatchObject({ owner: "IMAGING", capabilityId: "IMAGING_STUDY_DESIGN", projectWriteAuthorized: false });
    expect(imagingNativeOutput.projectionNotice).toBe("RUNTIME_PROJECTION_DOES_NOT_OWN_CANONICAL_SCIENCE");
  });
  it("W1IMG01-14 preserves Knowledge evidence lineage", () => {
    expect(imagingNativeInput.knowledge.sourceIds).toEqual(knowledgeResult.sources.map((item) => item.sourceId));
    expect(imagingNativeInput.knowledge.assertions.map((item) => item.statementId)).toEqual(knowledgeResult.applicableAssertions.map((item) => item.stableId));
    expect(imagingInvocation.result?.evidenceRefs.length).toBeGreaterThan(0);
  });
  it("W1IMG01-15 preserves the ST dependency", () => {
    expect(imagingNativeOutput.objectives.map((item) => item.objectiveId)).toEqual(stInvocation.result?.nativePayload?.objectives.map((item) => item.objectiveId));
    expect(imagingNativeOutput.hypotheses.map((item) => item.hypothesisId)).toEqual(stInvocation.result?.nativePayload?.hypotheses.map((item) => item.hypothesisId));
  });
  it("W1IMG01-16 preserves a Knowledge gap", () => {
    expect(gapKnowledgeResult.gaps.length).toBeGreaterThan(0);
    expect(gapImagingInvocation.result?.gaps).toEqual(expect.arrayContaining(gapKnowledgeResult.gaps.map((item) => item.code)));
  });
  it("W1IMG01-17 preserves ST alternatives", () => {
    const stAlternatives = stInvocation.result?.nativePayload?.hypotheses.filter((item) => item.kind === "ALTERNATIVE") ?? [];
    const imagingAlternatives = imagingNativeOutput.hypotheses.filter((item) => item.kind === "ALTERNATIVE");
    expect(stAlternatives.length).toBeGreaterThanOrEqual(2);
    expect(new Set(stAlternatives.map((item) => item.hypothesisId)).size).toBe(stAlternatives.length);
    expect(new Set(stAlternatives.map((item) => item.text)).size).toBe(stAlternatives.length);
    expect(imagingAlternatives.map((item) => ({ hypothesisId: item.hypothesisId, text: item.text, kind: item.kind }))).toEqual(
      stAlternatives.map((item) => ({ hypothesisId: item.hypothesisId, text: item.text, kind: item.kind })),
    );
    expect(stAlternatives.every((item) => item.reviewState === "PENDING")).toBe(true);
    expect(imagingAlternatives.every((item) => item.reviewState === "PENDING")).toBe(true);
  });
  it("W1IMG01-18 does not silently choose an ST branch", () => {
    expect(imagingNativeOutput.hypotheses.every((item) => item.reviewState === "PENDING")).toBe(true);
    expect(imagingNativeOutput.modalityCandidates.every((item) => item.reviewState === "PENDING")).toBe(true);
  });
  it("W1IMG01-19 keeps the OBS gap explicit", () => expect(imagingInvocation.result?.gaps).toContain("OBSERVABILITY_QUALIFICATION:NOT_IMPLEMENTED"));
  it("W1IMG01-20 creates no fake OBS result", () => {
    expect(imagingInvocation.ledger.entries.some((entry) => entry.result?.owner === "OBSERVABILITY_MEASUREMENT")).toBe(false);
    expect(imagingInvocation.obsRuntimeCalls).toBe(0);
  });
  it("W1IMG01-21 produces no unsupported executable acquisition protocol", () => {
    expect(imagingNativeOutput.acquisitionStrategies.every((item) => item.level3.status === "NOT_GENERATABLE_WITH_CURRENT_EXECUTABLE_KNOWLEDGE")).toBe(true);
    expect(imagingNativeOutput.projectConstructionHandoff.executableProtocolReadiness).toBe("EXECUTABLE_PROTOCOL_NOT_READY");
  });
  it("W1IMG01-22 keeps equipment unknown", () => {
    expect(imagingNativeOutput.equipmentAssessment.every((item) => item.compatibility === "UNKNOWN_COMPATIBILITY")).toBe(true);
    expect(imagingNativeOutput.equipmentAssessment.every((item) => item.assumptionForbidden)).toBe(true);
  });
  it("W1IMG01-23 keeps reading and Core Lab as unadopted candidates", () => {
    expect(imagingNativeOutput.imageAnalysisStrategy.every((item) => item.reviewState === "PENDING")).toBe(true);
    expect(imagingNativeOutput.coreLabAssessment).toMatchObject({ status: "HUMAN_ASSESSMENT_REQUIRED", notice: "NO_AUTOMATIC_OPTIMUM" });
    expect(imagingNativeOutput.projectConstructionHandoff.humanDecision.status).toBe("PENDING");
  });
  it("W1IMG01-24 rejects stale Knowledge", () => expect(() => invokeImagingForProject({
    project: projectV2, projectSnapshot: snapshotV2, knowledgeResultId: knowledgeInvocation.result!.resultId,
    scientificThinkingResultId: stInvocation.result!.resultId, ledger: gapImagingInvocation.ledger,
    callerRef: "W1-IMAGING-01:STALE", purpose: "Fail closed", startedAt: "2026-08-25T14:21:00.000Z", completedAt: "2026-08-25T14:21:01.000Z",
  })).toThrow("STALE_OWNER_RESULT"));
  it("W1IMG01-25 rejects stale ST dependency", () => expect(() => invokeImagingForProject({
    project, projectSnapshot: snapshot, knowledgeResultId: replacementKnowledgeInvocation.result!.resultId,
    scientificThinkingResultId: stInvocation.result!.resultId, ledger: gapImagingInvocation.ledger,
    callerRef: "W1-IMAGING-01:STALE-ST", purpose: "Fail closed", startedAt: "2026-08-25T14:22:00.000Z", completedAt: "2026-08-25T14:22:01.000Z",
  })).toThrow("STALE_SCIENTIFIC_THINKING_RESULT"));
  it("W1IMG01-26 detects a stale Imaging result", () => {
    const currentKnowledge = { resultId: knowledgeInvocation.result!.resultId, resultVersion: knowledgeInvocation.result!.resultVersion, nativeResultDigest: ownerResultNativeDigest(knowledgeInvocation.result)! };
    const currentSt = { resultId: stInvocation.result!.resultId, resultVersion: stInvocation.result!.resultVersion, nativeResultDigest: ownerResultNativeDigest(stInvocation.result)! };
    expect(readProductImagingOwnerResult({ ledger: gapImagingInvocation.ledger, resultId: imagingInvocation.result!.resultId, currentProjectSnapshot: snapshotV2, currentKnowledgeResult: currentKnowledge, currentScientificThinkingResult: currentSt }).freshness.status).toBe("STALE_OWNER_RESULT");
    expect(readProductImagingOwnerResult({ ledger: gapImagingInvocation.ledger, resultId: imagingInvocation.result!.resultId, currentProjectSnapshot: snapshot, currentKnowledgeResult: { ...currentKnowledge, resultId: replacementKnowledgeInvocation.result!.resultId }, currentScientificThinkingResult: currentSt }).freshness.staleReasons).toContain("KNOWLEDGE_RESULT_DEPENDENCY_CHANGED");
    expect(readProductImagingOwnerResult({ ledger: gapImagingInvocation.ledger, resultId: imagingInvocation.result!.resultId, currentProjectSnapshot: snapshot, currentKnowledgeResult: currentKnowledge, currentScientificThinkingResult: { ...currentSt, resultVersion: "changed" } }).freshness.staleReasons).toContain("SCIENTIFIC_THINKING_RESULT_DEPENDENCY_CHANGED");
  });
  it("W1IMG01-27 retains K/ST/IMG in one ledger", () => expect(imagingInvocation.ledger.entries.map((entry) => entry.result?.owner)).toEqual(["KNOWLEDGE", "SCIENTIFIC_THINKING", "IMAGING"]));
  it("W1IMG01-28 keeps the ledger immutable", () => {
    expect(Object.isFrozen(imagingInvocation.ledger)).toBe(true);
    expect(Object.isFrozen(imagingInvocation.entry)).toBe(true);
    expect(imagingInvocation.entry.result).toEqual(imagingInvocation.result);
  });
  it("W1IMG01-29 performs zero Project writes", () => {
    expect(imagingInvocation.projectWrites).toBe(0);
    expect(imagingInvocation.observation.projectWrites).toBe(0);
    expect(stableStringify(project)).toBe(stableStringify(project));
  });
  it("W1IMG01-30 does not bypass Human Decision", () => {
    expect(imagingInvocation.humanDecisionBypassed).toBe(false);
    expect(imagingInvocation.result?.projectContribution).toBeNull();
    expect(imagingInvocation.result?.projectWriteAuthorized).toBe(false);
    expect(imagingNativeOutput.projectConstructionHandoff.humanDecision.status).toBe("PENDING");
    expect(imagingNativeOutput.decisionsRequired.length).toBeGreaterThan(0);
  });
  it("W1IMG01-31 makes no Gemini, Terra or external network call", () => {
    expect(imagingInvocation).toMatchObject({ geminiCalls: 0, terraCalls: 0, externalEvidenceCalls: 0, obsRuntimeCalls: 0 });
    expect(knowledgeResult.externalEvidence).toBeNull();
  });
  it("W1IMG01-32 preserves W1 Knowledge", () => expect(knowledgeInvocation.result?.nativePayload).toEqual(knowledgeResult));
  it("W1IMG01-33 preserves W1 Scientific Thinking", () => expect(stInvocation.result?.nativePayload?.knowledgeDependencies[0]?.knowledgeResultDigest).toBe(knowledgeResult.resultDigest));
  it("W1IMG01-34 preserves the SPINE Imaging path", () => {
    const spine = invokeImagingOwnerFromScientificThinking({
      project, scientificThinkingResult: stInvocation.result!, knowledgeOwnerResult: knowledgeInvocation.result,
      startedAt: "2026-08-25T14:30:00.000Z", completedAt: "2026-08-25T14:30:01.000Z",
    });
    expect(spine.observation).toMatchObject({ owner: "IMAGING", runtimeStarts: 1, projectWrites: 0 });
    expect(spine.request?.nativeInput.knowledge.resultDigest).toBe(knowledgeResult.resultDigest);
  });
});
