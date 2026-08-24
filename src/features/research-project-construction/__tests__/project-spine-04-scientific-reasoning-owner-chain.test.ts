import { beforeAll, describe, expect, it } from "vitest";
import {
  contributionFromPersistentDelta,
  validatePersistentProjectDelta,
  type PersistentExpectedVariableOccasion,
  type PersistentProjectDeltaChange,
  type PersistentProjectRelation,
  type PersistentTemporalQualification,
} from "@/features/protocol-designer/product-bridge";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation/contracts";
import {
  assessSpecializedOwnerResultFreshness,
  buildScientificThinkingToImagingHandoff,
  confirmResearchProjectContribution,
  confirmSpecializedOwnerProjectContribution,
  createScientificReasoningKnowledgeGap,
  invokeImagingOwnerFromScientificThinking,
  invokeScientificThinkingOwnerFromProject,
  invokeUnavailableStudyDesignOwner,
  listSpecializedOwnerCapabilities,
  prepareSpecializedOwnerProjectContribution,
  rejectSpecializedOwnerProjectContribution,
  type ImagingOwnerChainInvocation,
  type ResearchProjectOwnerProjection,
  type ScientificReasoningOwnerInvocation,
} from "@/features/research-project-construction";
import type { ImagingDesignInput, ImagingDesignResult } from "@/features/imaging-study-designer";
import type { ScientificThinkingInput, ScientificThinkingOutput } from "@/features/scientific-thinking";

const authority = {
  actorRef: "project-spine-04:researcher",
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
  changes?: PersistentProjectDeltaChange[];
  relations?: PersistentProjectRelation[];
  temporalQualifications?: PersistentTemporalQualification[];
  expectedVariableOccasions?: PersistentExpectedVariableOccasion[];
}) => {
  const conversation: ScientificInterpretationConversation = {
    conversationId: `spine-04-conversation:${input.raw}`,
    language: "fr",
    turns: [{ turnId: `spine-04-turn:${input.raw}`, role: "USER", content: input.raw, createdAt: "2026-08-24T09:00:00.000Z" }],
  };
  const checked = validatePersistentProjectDelta({
    changes: input.changes ?? [],
    relations: input.relations ?? [],
    temporalQualifications: input.temporalQualifications ?? [],
    expectedVariableOccasions: input.expectedVariableOccasions ?? [],
  }, input.raw, input.current, conversation);
  expect(checked.validation.blocks).toEqual([]);
  expect(checked.candidate).not.toBeNull();
  const contribution = contributionFromPersistentDelta({
    candidate: checked.candidate!,
    conversation,
    currentProject: input.current,
    createdAt: "2026-08-24T09:00:01.000Z",
  });
  expect(contribution).not.toBeNull();
  return contribution!;
};

const adopt = (
  contribution: ReturnType<typeof contributionFor>,
  current: ResearchProjectOwnerProjection | null,
  confirmedAt: string,
) => confirmResearchProjectContribution({
  contribution,
  current,
  projectId: current?.projectId ?? "project:spine-04",
  authority,
  confirmedAt,
});

const knownAnchor = {
  kind: "RELATIVE_EVENT" as const,
  direction: "AFTER" as const,
  unit: "day",
  offset: 3,
  lowerBound: null,
  upperBound: null,
  relativeEventLabel: "reperfusion",
  tolerance: { lower: 0, upper: 2, unit: "day" },
  reference: { status: "KNOWN" as const, referenceProjectRef: "intervention:reperfusion" },
};

const unknownAnchor = {
  kind: "RELATIVE_EVENT" as const,
  direction: "UNKNOWN" as const,
  unit: "day",
  offset: null,
  lowerBound: null,
  upperBound: null,
  relativeEventLabel: "événement de référence à préciser",
  tolerance: null,
  reference: { status: "UNKNOWN" as const, unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" as const },
};

const projectFixture = () => {
  const raw = "Après STEMI, la question est de comparer le stenting immédiat au stenting différé après reperfusion. L'objectif principal est d'étudier l'obstruction microvasculaire. L'hypothèse est que le timing du stenting influence la MVO. La MVO est le critère principal, évalué en IRM cardiaque. La population et la méthode exacte de mesure restent à préciser.";
  const projectV1 = adopt(contributionFor({
    current: null,
    raw,
    changes: [
      change({ candidateRef: "question:stenting-mvo", proposedType: "SCIENTIFIC_QUESTION", targetSectionId: "ANALYSIS", content: "Le timing du stenting après reperfusion influence-t-il la MVO après STEMI ?", sourceText: raw }),
      change({ candidateRef: "condition:stemi", proposedType: "CONDITION", targetSectionId: "POPULATION", content: "STEMI", sourceText: raw }),
      change({ candidateRef: "population:post-stemi", proposedType: "POPULATION", targetSectionId: "POPULATION", content: "Population post-STEMI à préciser", sourceText: raw, epistemicStatus: "UNKNOWN", polarity: "UNKNOWN" }),
      change({ candidateRef: "intervention:reperfusion", proposedType: "INTERVENTION", targetSectionId: "INTERVENTION", content: "Reperfusion", sourceText: raw }),
      change({ candidateRef: "strategy:stent-immediate", proposedType: "INTERVENTION", targetSectionId: "INTERVENTION", content: "Stenting immédiat", sourceText: raw }),
      change({ candidateRef: "strategy:stent-deferred", proposedType: "COMPARATOR", targetSectionId: "COMPARATOR", content: "Stenting différé", sourceText: raw }),
      change({ candidateRef: "objective:mvo", proposedType: "OBJECTIVE", targetSectionId: "ANALYSIS", content: "Étudier l'obstruction microvasculaire", sourceText: raw, studyRole: "PRIMARY" }),
      change({ candidateRef: "hypothesis:timing-mvo", proposedType: "HYPOTHESIS", targetSectionId: "ANALYSIS", content: "Le timing du stenting influence la MVO", sourceText: raw, studyRole: "PRIMARY" }),
      change({ candidateRef: "endpoint:mvo", proposedType: "ENDPOINT", targetSectionId: "MEASUREMENTS", content: "Obstruction microvasculaire (MVO)", sourceText: raw, studyRole: "PRIMARY_ENDPOINT" }),
      change({ candidateRef: "variable:mvo", proposedType: "CANONICAL_VARIABLE", targetSectionId: "MEASUREMENTS", content: "Mesure de MVO", sourceText: raw }),
      change({ candidateRef: "modality:cmr", proposedType: "IMAGING_MODALITY", targetSectionId: "IMAGING", content: "IRM cardiaque", sourceText: raw }),
      change({ candidateRef: "acquisition:cmr", proposedType: "ACQUISITION", targetSectionId: "IMAGING", content: "Acquisition IRM cardiaque", sourceText: raw }),
      change({ candidateRef: "uncertainty:mvo-method", proposedType: "UNCERTAINTY", targetSectionId: "ANALYSIS", content: "Méthode exacte de mesure de la MVO à préciser", sourceText: raw, epistemicStatus: "UNKNOWN", polarity: "UNKNOWN" }),
    ],
    relations: [{
      relationRef: "relation:stenting-comparison",
      sourceText: raw,
      relationType: "COMPARES_WITH",
      sourceObjectRef: "strategy:stent-immediate",
      targetObjectRef: "strategy:stent-deferred",
      polarity: "AFFIRMED",
      epistemicStatus: "EXPLICIT_USER_STATED",
      assertionKind: "USER_STATED",
      proposalSourceText: null,
      evidenceRefs: [],
    }],
  }), null, "2026-08-24T09:01:00.000Z");

  const temporalRaw = "L'acquisition IRM est prévue trois jours après la reperfusion ; l'occasion attendue de mesure de la MVO conserve un événement de référence encore inconnu.";
  const projectV2 = adopt(contributionFor({
    current: projectV1,
    raw: temporalRaw,
    temporalQualifications: [{
      operation: "ADD",
      qualificationId: "timing:acquisition:cmr",
      sourceText: temporalRaw,
      subjectProjectRef: "acquisition:cmr",
      temporalRole: "ACQUISITION_TIME",
      anchor: knownAnchor,
      assertionKind: "USER_STATED",
      proposalSourceText: null,
      evidenceRefs: [],
    }],
    expectedVariableOccasions: [{
      operation: "ADD",
      occasionId: "occasion:variable:mvo",
      sourceText: temporalRaw,
      variableProjectRef: "variable:mvo",
      anchor: unknownAnchor,
      studyUnitOrGroupRef: null,
      applicableContext: "post-STEMI",
      assertionKind: "USER_STATED",
      proposalSourceText: null,
      evidenceRefs: [],
    }],
  }), projectV1, "2026-08-24T09:02:00.000Z");

  const correctionRaw = "L'hypothèse de travail est désormais que le stenting différé réduit la MVO par rapport au stenting immédiat.";
  return adopt(contributionFor({
    current: projectV2,
    raw: correctionRaw,
    changes: [change({
      operation: "REPLACE",
      candidateRef: "candidate:hypothesis:timing-mvo:v2",
      semanticIdentity: "hypothesis:timing-mvo",
      targetProjectRef: "hypothesis:timing-mvo",
      proposedType: "HYPOTHESIS",
      targetSectionId: "ANALYSIS",
      content: "Le stenting différé réduit la MVO par rapport au stenting immédiat",
      sourceText: correctionRaw,
      studyRole: "PRIMARY",
    })],
  }), projectV2, "2026-08-24T09:03:00.000Z");
};

const advanceProject = (project: ResearchProjectOwnerProjection) => {
  const raw = "La faisabilité multicentrique reste à qualifier.";
  return adopt(contributionFor({
    current: project,
    raw,
    changes: [change({
      candidateRef: "constraint:multicenter-feasibility",
      proposedType: "CONSTRAINT",
      targetSectionId: "DESIGN",
      content: "Faisabilité multicentrique à qualifier",
      sourceText: raw,
      epistemicStatus: "UNKNOWN",
      polarity: "UNKNOWN",
    })],
  }), project, "2026-08-24T09:20:00.000Z");
};

const timing = {
  startedAt: "2026-08-24T09:10:00.000Z",
  completedAt: "2026-08-24T09:10:01.000Z",
  monotonicNow: (() => {
    let value = 10;
    return () => value += 0.5;
  })(),
};

let project: ResearchProjectOwnerProjection;
let projectBefore: string;
let stInvocation: ScientificReasoningOwnerInvocation<ScientificThinkingInput, ScientificThinkingOutput>;
let imagingInvocation: ImagingOwnerChainInvocation;
let studyDesignInvocation: ReturnType<typeof invokeUnavailableStudyDesignOwner>;
let knowledgeGap: ReturnType<typeof createScientificReasoningKnowledgeGap>;

describe("PROJECT-SPINE-04 — scientific reasoning and study design owner chain", () => {
  beforeAll(() => {
    project = projectFixture();
    projectBefore = JSON.stringify(project);
    stInvocation = invokeScientificThinkingOwnerFromProject({ project, ...timing });
    studyDesignInvocation = invokeUnavailableStudyDesignOwner({ project, scientificThinkingResult: stInvocation.result, ...timing });
    knowledgeGap = createScientificReasoningKnowledgeGap({ project, sourceResult: stInvocation.result!, completedAt: timing.completedAt });
    imagingInvocation = invokeImagingOwnerFromScientificThinking({ project, scientificThinkingResult: stInvocation.result!, ...timing });
  });

  it("S01–S04 — invokes Scientific Thinking once from the exact immutable Project Snapshot and preserves candidates/unknowns", () => {
    expect(stInvocation.observation).toMatchObject({
      owner: "SCIENTIFIC_THINKING",
      capabilityId: "SCIENTIFIC_THINKING_PROPOSAL",
      ownerRuntimeVersion: "1.1.0",
      sourceProjectRef: project.projectId,
      sourceProjectVersion: project.versionId,
      sourceProjectDigest: project.projectDigest,
      runtimeStarts: 1,
      conversationalLlmCalls: 0,
      projectWrites: 0,
    });
    expect(stInvocation.request.sourceProject).toMatchObject({
      sourceProjectRef: project.projectId,
      sourceProjectVersion: project.versionId,
      sourceProjectDigest: project.projectDigest,
      readOnly: true,
    });
    expect(stInvocation.request.nativeInput).toMatchObject({
      contractVersion: "1.1.0",
      researchContext: { researchProjectId: project.projectId, contextVersion: project.revision },
      knowledge: { support: "UNAVAILABLE", gapCodes: ["PROJECT_SPINE_04_KNOWLEDGE_NOT_INVOKED"] },
    });
    expect(stInvocation.result?.nativePayload).toMatchObject({
      outputId: stInvocation.result.resultId,
      provenance: { inputRef: stInvocation.request.nativeInput.requestId },
      candidateNotice: "ALL_GENERATED_SCIENTIFIC_CONTENT_REQUIRES_HUMAN_REVIEW",
    });
    expect(stInvocation.result?.nativePayload).toBe(stInvocation.result?.nativePayload);
    expect(stInvocation.result?.projectContribution?.epistemicBoundary).toMatchObject({ candidateIsAdopted: false, projectOwnershipTransferred: false });
    expect(stInvocation.result?.unknowns.length).toBeGreaterThan(0);
    expect(JSON.stringify(project)).toBe(projectBefore);
    const currentHypotheses = project.canonicalState?.objects.filter((item) => item.objectType === "HYPOTHESIS" && item.actuality === "CURRENT") ?? [];
    expect(currentHypotheses.some((item) => item.objectId.startsWith("st-hypothesis-candidate:"))).toBe(false);
  });

  it("S05–S07 — inventories Study Design as normative but unavailable and never falls back to Gemini", () => {
    const capability = listSpecializedOwnerCapabilities().entries.find((item) => item.capabilityId === "STUDY_DESIGN_COHERENCE");
    expect(capability).toMatchObject({
      owner: "STUDY_DESIGN",
      status: "UNAVAILABLE",
      implementationVersion: null,
      inputContract: "RDE-001/RDE-002 v1.1 normative contract only",
      outputContract: "No standalone Study Design runtime result",
      readsProjectSnapshot: false,
      canProduceProjectContribution: false,
      canWriteProject: false,
      externalProvider: "NONE",
    });
    expect(studyDesignInvocation.observation).toMatchObject({
      status: "OWNER_UNAVAILABLE",
      failureCode: "CALL_NONEXISTENT_ENGINE",
      ownerRuntimeVersion: null,
      runtimeStarts: 0,
      conversationalLlmCalls: 0,
      projectWrites: 0,
    });
    expect(studyDesignInvocation.result).toMatchObject({ status: "OWNER_CAPABILITY_UNAVAILABLE", resultKind: "GAP", nativePayload: null });
  });

  it("S08–S12 — invokes Imaging once through a provenance-preserving ST→Imaging handoff and retains Knowledge/OBS gaps", () => {
    expect(imagingInvocation.handoff).toMatchObject({
      sourceOwner: "SCIENTIFIC_THINKING",
      targetOwner: "IMAGING",
      sourceResultRef: `${stInvocation.result!.resultId}@${stInvocation.result!.resultVersion}`,
      sourceProjectVersion: project.versionId,
      sourceProjectDigest: project.projectDigest,
      status: "READY",
      ownershipTransferred: false,
      projectWriteAuthorized: false,
    });
    expect(imagingInvocation.handoff.stableProjectRefs).toEqual(expect.arrayContaining(["endpoint:mvo", "variable:mvo", "modality:cmr", "acquisition:cmr"]));
    expect(imagingInvocation.request?.nativeInput).toMatchObject({
      contractVersion: "1.2.1",
      researchProjectId: project.projectId,
      strategyVersion: project.versionId,
      sourceHandoff: { stOutputRef: stInvocation.result!.resultId, status: "VALIDATED_WITHOUT_ST_HANDOFF" },
      confirmedScientificQuestion: { questionId: "question:stenting-mvo", confirmation: "VALIDATED_CONTEXT" },
      knowledge: { resultId: null, matchingSemantics: "NO_RESULT" },
    });
    expect(imagingInvocation.observation).toMatchObject({
      owner: "IMAGING",
      ownerRuntimeVersion: "1.2.1",
      sourceProjectVersion: project.versionId,
      sourceProjectDigest: project.projectDigest,
      runtimeStarts: 1,
      conversationalLlmCalls: 0,
      projectWrites: 0,
    });
    expect(imagingInvocation.result?.nativePayload).toMatchObject({
      resultId: imagingInvocation.result.resultId,
      projectionNotice: "RUNTIME_PROJECTION_DOES_NOT_OWN_CANONICAL_SCIENCE",
      provenance: { inputRef: imagingInvocation.request?.nativeInput.inputId, llmContributionStatus: "NO_LLM_SCIENTIFIC_DECISION" },
    });
    expect(imagingInvocation.result?.projectContribution).toBeNull();
    expect(imagingInvocation.result?.gaps).toEqual(expect.arrayContaining([
      "KNOWLEDGE_RESULT_REQUIRED_FOR_IMAGING_MEASUREMENT_PROPOSAL",
      "OBSERVABILITY_QUALIFICATION:NOT_IMPLEMENTED",
    ]));
    expect(imagingInvocation.result?.limitations).toContain("OBS_RUNTIME_UNAVAILABLE_NO_AUTONOMOUS_QUALIFICATION");
    expect(knowledgeGap.request).toMatchObject({
      owner: "KNOWLEDGE",
      missingEvidence: ["APPLICABLE_MVO_OBSERVABILITY_AND_MEASUREMENT_EVIDENCE_NOT_SUPPLIED"],
      conversationalLlmExpertFallback: "FORBIDDEN",
    });
    expect(knowledgeGap.result).toMatchObject({ status: "BLOCKED_BY_MISSING_EVIDENCE", resultKind: "GAP", projectContribution: null });
    expect(JSON.stringify(project)).toBe(projectBefore);
  });

  it("S13–S20 — rejects stale handoffs, preserves OwnerResult/ProjectContribution boundaries, temporal structures and supersession", () => {
    const projectVNext = advanceProject(project);
    const staleHandoff = buildScientificThinkingToImagingHandoff({ result: stInvocation.result!, currentProject: projectVNext });
    expect(staleHandoff).toMatchObject({ status: "STALE_OWNER_RESULT", staleReasons: ["PROJECT_VERSION_CHANGED", "PROJECT_DIGEST_CHANGED"] });
    const staleInvocation = invokeImagingOwnerFromScientificThinking({
      project: projectVNext,
      scientificThinkingResult: stInvocation.result!,
      ...timing,
      runtime: (_input: ImagingDesignInput): ImagingDesignResult => { throw new Error("STALE_RUNTIME_MUST_NOT_START"); },
    });
    expect(staleInvocation.observation).toMatchObject({ status: "STALE_OWNER_RESULT", runtimeStarts: 0, conversationalLlmCalls: 0, projectWrites: 0 });
    expect(staleInvocation.request).toBeNull();
    expect(staleInvocation.result).toBeNull();
    expect(assessSpecializedOwnerResultFreshness(stInvocation.result!, projectVNext).status).toBe("STALE_OWNER_RESULT");

    const preparation = prepareSpecializedOwnerProjectContribution({ result: stInvocation.result!, current: project });
    expect(preparation).toMatchObject({ status: "READY_FOR_HUMAN_DECISION", humanDecisionRequired: true, projectWriteAuthorized: false });
    expect(preparation.candidate).not.toBeNull();
    expect(preparation.candidate).not.toBe(stInvocation.result);

    const beforeRejection = JSON.stringify(project);
    const rejection = rejectSpecializedOwnerProjectContribution({
      result: stInvocation.result!,
      current: project,
      authority,
      rejectedAt: "2026-08-24T09:30:00.000Z",
    });
    expect(rejection.status).toBe("REJECTED");
    expect(JSON.stringify(project)).toBe(beforeRejection);

    const accepted = confirmSpecializedOwnerProjectContribution({
      result: stInvocation.result!,
      current: project,
      authority,
      confirmedAt: "2026-08-24T09:31:00.000Z",
    });
    expect(accepted).toMatchObject({
      revision: project.revision + 1,
      previousVersionId: project.versionId,
      owner: "RESEARCH_PROJECT",
      llmProjectWrites: 0,
      confirmationDecision: { status: "ADOPTED", actor: authority.actorRef, mandate: "PROJECT_OWNER" },
    });
    expect(accepted.confirmationDecision.provenance).toEqual(expect.arrayContaining([
      `${stInvocation.result!.resultId}@${stInvocation.result!.resultVersion}`,
      `owner-source-project-version:${project.versionId}`,
      `owner-source-project-digest:${project.projectDigest}`,
    ]));

    expect(stInvocation.request.sourceProject.temporalQualifications).toEqual(expect.arrayContaining([
      expect.objectContaining({
        stableId: "timing:acquisition:cmr",
        temporalRole: "ACQUISITION_TIME",
        anchor: expect.objectContaining({
          valueType: "TEMPORAL_ANCHOR_VALUE",
          reference: expect.objectContaining({ status: "KNOWN", referenceProjectRef: "intervention:reperfusion" }),
        }),
      }),
    ]));
    expect(stInvocation.request.sourceProject.expectedVariableOccasions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        stableId: "occasion:variable:mvo",
        relationType: "EXPECTED_AT",
        variableProjectRef: "variable:mvo",
        anchor: expect.objectContaining({
          valueType: "TEMPORAL_ANCHOR_VALUE",
          reference: expect.objectContaining({ status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" }),
        }),
      }),
    ]));
    expect(accepted.canonicalState?.temporalQualifications).toEqual(project.canonicalState?.temporalQualifications);
    expect(accepted.canonicalState?.expectedVariableOccasions).toEqual(project.canonicalState?.expectedVariableOccasions);

    const hypothesisHistory = accepted.canonicalState?.objects.filter((item) => item.objectId === "hypothesis:timing-mvo") ?? [];
    expect(hypothesisHistory).toHaveLength(2);
    expect(hypothesisHistory).toEqual(expect.arrayContaining([
      expect.objectContaining({ version: 1, actuality: "SUPERSEDED", supersededByVersionRef: "hypothesis:timing-mvo:version:2" }),
      expect.objectContaining({ version: 2, actuality: "CURRENT", supersedesVersionRef: "hypothesis:timing-mvo:version:1" }),
    ]));

    expect([stInvocation, imagingInvocation].reduce((sum, invocation) => sum + invocation.observation.runtimeStarts, 0)).toBe(2);
    expect(studyDesignInvocation.observation.runtimeStarts).toBe(0);
    expect([stInvocation, studyDesignInvocation, imagingInvocation, staleInvocation]
      .reduce((sum, invocation) => sum + invocation.observation.conversationalLlmCalls, 0)).toBe(0);
    expect(JSON.stringify(accepted)).not.toContain("ASK_GEMINI_INSTEAD");
  });
});
