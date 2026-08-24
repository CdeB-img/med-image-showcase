import { beforeAll, describe, expect, it } from "vitest";
import type { KnowledgeResult } from "@/features/knowledge-engine";
import type { RegulatoryResolutionResult } from "@/features/regulatory-resolution";
import {
  contributionFromPersistentDelta,
  validatePersistentProjectDelta,
  type PersistentExpectedVariableOccasion,
  type PersistentProjectDeltaChange,
  type PersistentTemporalQualification,
} from "@/features/protocol-designer/product-bridge";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation/contracts";
import {
  assessSpecializedOwnerResultFreshness,
  confirmResearchProjectContribution,
  invokeKnowledgeOwnerFromProject,
  invokeRegulatoryOwnerFromProject,
  invokeUnavailableBiostatisticsCalculation,
  prepareSpecializedOwnerProjectContribution,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";

const authority = {
  actorRef: "project-spine-03:researcher",
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
  temporalQualifications?: PersistentTemporalQualification[];
  expectedVariableOccasions?: PersistentExpectedVariableOccasion[];
}) => {
  const conversation: ScientificInterpretationConversation = {
    conversationId: `conversation:${input.raw}`,
    language: "fr",
    turns: [{ turnId: `turn:${input.raw}`, role: "USER", content: input.raw, createdAt: "2026-08-24T08:00:00.000Z" }],
  };
  const checked = validatePersistentProjectDelta({
    changes: input.changes ?? [],
    relations: [],
    temporalQualifications: input.temporalQualifications ?? [],
    expectedVariableOccasions: input.expectedVariableOccasions ?? [],
  }, input.raw, input.current, conversation);
  expect(checked.validation.blocks).toEqual([]);
  expect(checked.candidate).not.toBeNull();
  const contribution = contributionFromPersistentDelta({
    candidate: checked.candidate!,
    conversation,
    currentProject: input.current,
    createdAt: "2026-08-24T08:00:01.000Z",
  });
  expect(contribution).not.toBeNull();
  return contribution!;
};

const adopt = (
  contribution: ReturnType<typeof contributionFor>,
  current: ResearchProjectOwnerProjection | null,
  at: string,
) => confirmResearchProjectContribution({
  contribution,
  current,
  projectId: current?.projectId ?? "project:spine-03",
  authority,
  confirmedAt: at,
});

const anchor = {
  kind: "RELATIVE_EVENT" as const,
  direction: "AFTER" as const,
  unit: "day",
  offset: 3,
  lowerBound: null,
  upperBound: null,
  relativeEventLabel: "reperfusion",
  tolerance: { lower: 0, upper: 2, unit: "day" },
  reference: { status: "KNOWN" as const, referenceProjectRef: "event:reperfusion" },
};

const projectWithTemporalAndSupersession = () => {
  const raw = "L'infarctus du myocarde est la condition, la reperfusion est l'intervention, l'IRM est l'acquisition et la MVO est la variable canonique.";
  const projectV1 = adopt(contributionFor({ current: null, raw, changes: [
    change({ candidateRef: "condition:myocardial-infarction", proposedType: "CONDITION", targetSectionId: "POPULATION", content: "Infarctus du myocarde", sourceText: raw }),
    change({ candidateRef: "event:reperfusion", proposedType: "INTERVENTION", targetSectionId: "INTERVENTION", content: "Reperfusion", sourceText: raw }),
    change({ candidateRef: "modality:mri", proposedType: "IMAGING_MODALITY", targetSectionId: "IMAGING", content: "IRM cardiaque", sourceText: raw }),
    change({ candidateRef: "acquisition:mri", proposedType: "ACQUISITION", targetSectionId: "IMAGING", content: "Acquisition IRM", sourceText: raw }),
    change({ candidateRef: "variable:mvo", proposedType: "CANONICAL_VARIABLE", content: "Obstruction microvasculaire (MVO)", sourceText: raw }),
    change({ candidateRef: "hypothesis:mvo", proposedType: "HYPOTHESIS", targetSectionId: "ANALYSIS", content: "La MVO est associée au pronostic", sourceText: raw }),
  ] }), null, "2026-08-24T08:01:00.000Z");

  const temporalRaw = "L'acquisition IRM et la mesure de MVO sont attendues trois jours après la reperfusion.";
  const projectV2 = adopt(contributionFor({
    current: projectV1,
    raw: temporalRaw,
    temporalQualifications: [{
      operation: "ADD",
      qualificationId: "timing:acquisition:mri",
      sourceText: temporalRaw,
      subjectProjectRef: "acquisition:mri",
      temporalRole: "ACQUISITION_TIME",
      anchor,
      assertionKind: "USER_STATED",
      proposalSourceText: null,
      evidenceRefs: [],
    }],
    expectedVariableOccasions: [{
      operation: "ADD",
      occasionId: "occasion:variable:mvo",
      sourceText: temporalRaw,
      variableProjectRef: "variable:mvo",
      anchor,
      studyUnitOrGroupRef: null,
      applicableContext: "post-reperfusion",
      assertionKind: "USER_STATED",
      proposalSourceText: null,
      evidenceRefs: [],
    }],
  }), projectV1, "2026-08-24T08:02:00.000Z");

  const correctionRaw = "L'hypothèse est désormais que la MVO est associée au risque clinique à long terme.";
  return adopt(contributionFor({ current: projectV2, raw: correctionRaw, changes: [change({
    operation: "REPLACE",
    candidateRef: "candidate:hypothesis:mvo:v2",
    semanticIdentity: "hypothesis:mvo",
    targetProjectRef: "hypothesis:mvo",
    proposedType: "HYPOTHESIS",
    targetSectionId: "ANALYSIS",
    content: "La MVO est associée au risque clinique à long terme",
    sourceText: correctionRaw,
  })] }), projectV2, "2026-08-24T08:03:00.000Z");
};

const advanceProject = (project: ResearchProjectOwnerProjection) => {
  const raw = "Le projet devient multicentrique.";
  return adopt(contributionFor({ current: project, raw, changes: [change({
    candidateRef: "design:multicenter",
    targetSectionId: "DESIGN",
    proposedType: "STUDY_DESIGN",
    content: "Étude multicentrique",
    sourceText: raw,
  })] }), project, "2026-08-24T08:20:00.000Z");
};

const timing = {
  startedAt: "2026-08-24T08:10:00.000Z",
  completedAt: "2026-08-24T08:10:01.000Z",
  monotonicNow: (() => {
    let value = 10;
    return () => value += 0.5;
  })(),
};

let realKnowledgeNative: KnowledgeResult | null = null;
let realRegulatoryNative: RegulatoryResolutionResult | null = null;
let gateProject: ResearchProjectOwnerProjection;
let gateProjectBefore: string;
let realKnowledgeInvocation: ReturnType<typeof invokeKnowledgeOwnerFromProject>;
let realRegulatoryInvocation: ReturnType<typeof invokeRegulatoryOwnerFromProject>;

describe("PROJECT-SPINE-03 — native specialized owner invocation gate", () => {
  beforeAll(() => {
    gateProject = projectWithTemporalAndSupersession();
    gateProjectBefore = JSON.stringify(gateProject);
    realKnowledgeInvocation = invokeKnowledgeOwnerFromProject({ project: gateProject, ...timing });
    realRegulatoryInvocation = invokeRegulatoryOwnerFromProject({ project: gateProject, ...timing });
    realKnowledgeNative = realKnowledgeInvocation.result!.nativePayload!;
    realRegulatoryNative = realRegulatoryInvocation.result!.nativePayload!;
  });

  it("REAL RUNTIME GATE — I01–I16 invokes Knowledge and REG once and preserves the negative capability path", () => {
    const project = gateProject;
    const before = gateProjectBefore;
    const decisionCountBefore = project.canonicalState?.decisionLedger.length ?? 0;
    const temporalBefore = project.canonicalState?.temporalQualifications;
    const occasionsBefore = project.canonicalState?.expectedVariableOccasions;
    const supersessionBefore = project.canonicalState?.objects.filter((item) => item.objectId === "hypothesis:mvo");

    const knowledge = realKnowledgeInvocation;
    expect(knowledge.observation).toMatchObject({
      owner: "KNOWLEDGE",
      capabilityId: "KNOWLEDGE_EVIDENCE",
      ownerRuntimeVersion: "1.2.0",
      sourceProjectRef: project.projectId,
      sourceProjectVersion: project.versionId,
      sourceProjectDigest: project.projectDigest,
      runtimeStarts: 1,
      llmFallbackCalls: 0,
      projectWrites: 0,
    });
    expect(["COMPLETED", "OWNER_EVIDENCE_GAP"]).toContain(knowledge.observation.status);
    expect(knowledge.request.nativeInput).toMatchObject({
      contractVersion: "1.2.0",
      researchProjectId: project.projectId,
      strategyVersion: project.versionId,
      consumer: "RESEARCH_PROJECT_CONSTRUCTION",
      externalSearchPolicy: "INTERNAL_ONLY",
    });
    expect(knowledge.request.nativeInput.scientificObjects).toEqual(expect.arrayContaining([
      expect.objectContaining({ objectId: "variable:mvo", originalTerm: "Obstruction microvasculaire (MVO)" }),
      expect.objectContaining({ objectId: "acquisition:mri", originalTerm: "Acquisition IRM" }),
    ]));
    expect(knowledge.result?.nativePayload).toMatchObject({
      resultId: knowledge.result.resultId,
      request: { requestId: knowledge.request.nativeInput.requestId },
      trace: { privacy: { externalCallMade: false } },
    });
    expect(knowledge.result).toMatchObject({ projectContribution: null, projectWriteAuthorized: false, conversationalLlmExpertFallback: "FORBIDDEN" });

    const regulatory = realRegulatoryInvocation;
    expect(regulatory.observation).toMatchObject({
      owner: "REGULATORY_RESOLUTION",
      capabilityId: "REGULATORY_REQUIREMENT_RESOLUTION",
      ownerRuntimeVersion: "1.0.0",
      sourceProjectVersion: project.versionId,
      sourceProjectDigest: project.projectDigest,
      status: "OWNER_CONTEXT_INCOMPLETE",
      runtimeStarts: 1,
      llmFallbackCalls: 0,
      projectWrites: 0,
    });
    expect(regulatory.request.nativeInput).toMatchObject({
      researchProjectId: project.projectId,
      researchProjectVersion: project.versionId,
      researchProjectDigest: project.projectDigest,
      jurisdiction: { state: "UNKNOWN", value: null },
      projectCharacteristics: { humanHealthResearch: { state: "UNKNOWN", value: null } },
    });
    expect(regulatory.result).toMatchObject({
      resultKind: "GAP",
      projectContribution: null,
      projectWriteAuthorized: false,
      nativePayload: {
        researchProjectId: project.projectId,
        researchProjectVersion: project.versionId,
        researchProjectDigest: project.projectDigest,
        provenance: { authorityBoundary: "METHODOLOGICAL_AID_NOT_REGULATORY_VALIDATION" },
      },
    });
    expect(regulatory.result?.unknowns).toContain("reg-unknown:emergency-consent");
    expect(JSON.stringify(regulatory.result?.nativePayload).toLocaleLowerCase("fr-FR")).not.toContain("consentement d'urgence conforme");

    const biostatistics = invokeUnavailableBiostatisticsCalculation({ project, ...timing });
    expect(biostatistics.observation).toMatchObject({
      status: "OWNER_UNAVAILABLE",
      failureCode: "CALL_NONEXISTENT_ENGINE",
      ownerRuntimeVersion: null,
      runtimeStarts: 0,
      llmFallbackCalls: 0,
      projectWrites: 0,
    });
    expect(biostatistics.result).toMatchObject({ status: "OWNER_CAPABILITY_UNAVAILABLE", resultKind: "GAP", nativePayload: null });
    expect(biostatistics.result?.nativePayload).toBeNull();

    const projectVNext = advanceProject(project);
    expect(assessSpecializedOwnerResultFreshness(knowledge.result!, projectVNext)).toMatchObject({ status: "STALE_OWNER_RESULT", staleReasons: ["PROJECT_VERSION_CHANGED", "PROJECT_DIGEST_CHANGED"] });
    expect(assessSpecializedOwnerResultFreshness(regulatory.result!, projectVNext)).toMatchObject({ status: "STALE_OWNER_RESULT", staleReasons: ["PROJECT_VERSION_CHANGED", "PROJECT_DIGEST_CHANGED"] });
    expect(prepareSpecializedOwnerProjectContribution({ result: knowledge.result!, current: project })).toMatchObject({ status: "NOT_A_PROJECT_CONTRIBUTION", candidate: null });
    expect(prepareSpecializedOwnerProjectContribution({ result: regulatory.result!, current: project })).toMatchObject({ status: "NOT_A_PROJECT_CONTRIBUTION", candidate: null });

    expect(JSON.stringify(project)).toBe(before);
    expect(project.canonicalState?.decisionLedger.length).toBe(decisionCountBefore);
    expect(project.canonicalState?.temporalQualifications).toEqual(temporalBefore);
    expect(project.canonicalState?.expectedVariableOccasions).toEqual(occasionsBefore);
    expect(project.canonicalState?.objects.filter((item) => item.objectId === "hypothesis:mvo")).toEqual(supersessionBefore);
  });

  it("I02/I03 — preserves a native Knowledge payload while an owner evidence gap remains a gap", () => {
    const project = projectWithTemporalAndSupersession();
    let nativeGap: KnowledgeResult | null = null;
    const invocation = invokeKnowledgeOwnerFromProject({
      project,
      ...timing,
      runtime: (request) => {
        expect(realKnowledgeNative).not.toBeNull();
        nativeGap = {
          ...realKnowledgeNative!,
          resultId: "knowledge-result:synthetic-gap",
          request,
          applicableAssertions: [],
          documentaryStatements: [],
          sources: [],
          evidence: [],
          gaps: [{
            gapId: "knowledge-gap:mvo-context",
            code: "NO_ASSERTION_MATCH",
            scope: "MVO",
            explanation: "Le corpus local ne contient pas d'assertion applicable à ce contexte.",
            affectedConceptIds: ["variable:mvo"],
            resumeCondition: "Ajouter une source applicable et gouvernée.",
          }],
        };
        return nativeGap;
      },
    });
    expect(invocation.observation.status).toBe("OWNER_EVIDENCE_GAP");
    expect(invocation.result).toMatchObject({ resultKind: "GAP", projectContribution: null });
    expect(invocation.result?.nativePayload).toBe(nativeGap);
    expect(invocation.result?.gaps).toContain("knowledge-gap:mvo-context:NO_ASSERTION_MATCH");
  });

  it("distinguishes runtime failure and invalid owner result without any expert fallback", () => {
    const project = projectWithTemporalAndSupersession();
    const runtimeFailure = invokeKnowledgeOwnerFromProject({
      project,
      ...timing,
      runtime: () => { throw new Error("OWNER_RUNTIME_FAILURE:LOCAL_CORPUS_UNREADABLE"); },
    });
    expect(runtimeFailure.observation).toMatchObject({
      status: "OWNER_RUNTIME_FAILURE",
      failureCode: "OWNER_RUNTIME_FAILURE:LOCAL_CORPUS_UNREADABLE",
      llmFallbackCalls: 0,
      projectWrites: 0,
    });
    expect(runtimeFailure.result).toBeNull();

    const invalid = invokeRegulatoryOwnerFromProject({
      project,
      ...timing,
      runtime: (request) => ({
        ...realRegulatoryNative!,
        researchProjectVersion: `${request.researchProjectVersion}:wrong`,
      }),
    });
    expect(invalid.observation).toMatchObject({
      status: "INVALID_OWNER_RESULT",
      failureCode: "REG_RESULT_PROJECT_OR_AUTHORITY_MISMATCH",
      llmFallbackCalls: 0,
      projectWrites: 0,
    });
    expect(invalid.result).toBeNull();
  });
});
