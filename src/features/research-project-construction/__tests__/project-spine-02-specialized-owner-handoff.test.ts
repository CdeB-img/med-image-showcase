import { describe, expect, it } from "vitest";
import { executeKnowledgeEngine } from "@/features/knowledge-engine";
import {
  contributionFromPersistentDelta,
  validatePersistentProjectDelta,
  type PersistentExpectedVariableOccasion,
  type PersistentProjectDeltaChange,
  type PersistentTemporalQualification,
} from "@/features/protocol-designer/product-bridge";
import {
  createFunctionalResetSession,
  loadFunctionalResetSession,
  persistFunctionalResetSession,
} from "@/features/protocol-designer/functional-reset/session";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation/contracts";
import {
  assessSpecializedOwnerResultFreshness,
  confirmResearchProjectContribution,
  confirmSpecializedOwnerProjectContribution,
  createSpecializedOwnerGapResult,
  createSpecializedOwnerHandoffRequest,
  listSpecializedOwnerCapabilities,
  prepareSpecializedOwnerProjectContribution,
  recordSpecializedOwnerResult,
  rejectSpecializedOwnerProjectContribution,
  type ResearchProjectOwnerProjection,
  type SpecializedOwnerHandoffRequest,
  type SpecializedOwnerId,
  type SpecializedOwnerResultKind,
} from "@/features/research-project-construction";

const authority = {
  actorRef: "project-spine-02:researcher",
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

const adopt = (contribution: ReturnType<typeof contributionFor>, current: ResearchProjectOwnerProjection | null, at: string) => confirmResearchProjectContribution({
  contribution,
  current,
  projectId: current?.projectId ?? "project:spine-02",
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

const projectWithTemporalBackbone = () => {
  const raw = "La reperfusion est l'intervention, l'IRM est l'acquisition et la MVO est la variable canonique.";
  const projectV1 = adopt(contributionFor({ current: null, raw, changes: [
    change({ candidateRef: "event:reperfusion", proposedType: "INTERVENTION", targetSectionId: "INTERVENTION", content: "Reperfusion", sourceText: raw }),
    change({ candidateRef: "acquisition:mri", proposedType: "ACQUISITION", targetSectionId: "IMAGING", content: "Acquisition IRM", sourceText: raw }),
    change({ candidateRef: "variable:mvo", proposedType: "CANONICAL_VARIABLE", content: "MVO", sourceText: raw }),
    change({ candidateRef: "hypothesis:mvo", proposedType: "HYPOTHESIS", targetSectionId: "ANALYSIS", content: "La MVO est associée au pronostic", sourceText: raw }),
  ] }), null, "2026-08-24T08:01:00.000Z");
  const temporalRaw = "L'acquisition IRM et la mesure de MVO sont attendues trois jours après la reperfusion.";
  return adopt(contributionFor({
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
};

const requestFor = <T>(project: ResearchProjectOwnerProjection, input: {
  owner: SpecializedOwnerId;
  capabilityId: string;
  nativeInput: T;
  missingContext?: string[];
  missingEvidence?: string[];
}) => createSpecializedOwnerHandoffRequest({
  handoffId: `handoff:${input.capabilityId}:${project.versionId}`,
  owner: input.owner,
  capabilityId: input.capabilityId,
  purpose: "PROJECT_SPINE_02_TEST",
  project,
  nativeInputType: "TEST_NATIVE_INPUT",
  nativeInputVersion: "1.0.0",
  nativeInput: input.nativeInput,
  missingContext: input.missingContext,
  missingEvidence: input.missingEvidence,
});

const ownerContribution = (project: ResearchProjectOwnerProjection, operation: "ADD" | "REPLACE" = "ADD") => {
  const raw = operation === "ADD"
    ? "Knowledge propose comme hypothèse que la MVO est associée au risque clinique."
    : "Knowledge qualifie l'hypothèse MVO comme associée au risque clinique à long terme.";
  return contributionFor({ current: project, raw, changes: [change({
    operation,
    candidateRef: operation === "ADD" ? "hypothesis:knowledge-mvo" : "candidate:knowledge-mvo-revision",
    semanticIdentity: operation === "ADD" ? "hypothesis:knowledge-mvo" : "hypothesis:mvo",
    targetProjectRef: operation === "ADD" ? null : "hypothesis:mvo",
    targetSectionId: "ANALYSIS",
    proposedType: "HYPOTHESIS",
    content: operation === "ADD" ? "La MVO est associée au risque clinique" : "La MVO est associée au risque clinique à long terme",
    sourceText: raw,
    assertionKind: "OWNER_SUPPORTED",
    epistemicStatus: "SUPPORTED_CANDIDATE",
    evidenceRefs: ["knowledge-result:kr-1", "doi:10.1000/mvo"],
  })] });
};

const completedResult = (input: {
  request: SpecializedOwnerHandoffRequest;
  kind: Exclude<SpecializedOwnerResultKind, "GAP">;
  payload?: unknown;
  contribution?: ReturnType<typeof contributionFor> | null;
  resultId?: string;
}) => recordSpecializedOwnerResult({
  request: input.request,
  resultId: input.resultId ?? `result:${input.request.capabilityId}`,
  resultVersion: "1.0.0",
  completedAt: "2026-08-24T08:03:00.000Z",
  status: "COMPLETED_WITH_LIMITATIONS",
  resultKind: input.kind,
  nativePayloadType: "NATIVE_OWNER_RESULT",
  nativePayloadVersion: "1.0.0",
  nativePayload: input.payload ?? { owner: input.request.owner },
  stableProjectRefs: ["variable:mvo", "acquisition:mri"],
  evidenceRefs: ["doi:10.1000/mvo"],
  limitations: ["Test limitation retained"],
  provenance: ["owner-runtime:test"],
  projectContribution: input.contribution,
});

describe("PROJECT-SPINE-02 — specialized owner handoff backbone", () => {
  it("H1/H2 — reads one explicit immutable Project version and grants no owner write", () => {
    const project = projectWithTemporalBackbone();
    const before = JSON.stringify(project);
    const request = requestFor(project, { owner: "KNOWLEDGE", capabilityId: "KNOWLEDGE_EVIDENCE", nativeInput: { question: "MVO" } });
    expect(request.sourceProject).toMatchObject({
      sourceProjectRef: project.projectId,
      sourceProjectVersion: project.versionId,
      sourceProjectDigest: project.projectDigest,
      readOnly: true,
    });
    expect(Object.isFrozen(request.sourceProject)).toBe(true);
    expect(request).toMatchObject({ projectWriteAuthorized: false, conversationalLlmExpertFallback: "FORBIDDEN" });
    expect(JSON.stringify(project)).toBe(before);
  });

  it("H3/H4/H5 — preserves result provenance while information and recommendations create no Project candidate", () => {
    const project = projectWithTemporalBackbone();
    const request = requestFor(project, { owner: "KNOWLEDGE", capabilityId: "KNOWLEDGE_EVIDENCE", nativeInput: { question: "MVO" } });
    const informational = completedResult({ request, kind: "EVIDENCE_DIAGNOSTIC", payload: { evidence: ["doi:10.1000/mvo"] } });
    expect(informational.provenance).toEqual(expect.arrayContaining([request.handoffId, request.sourceProject.snapshotDigest, "owner-runtime:test"]));
    expect(prepareSpecializedOwnerProjectContribution({ result: informational, current: project })).toMatchObject({ status: "NOT_A_PROJECT_CONTRIBUTION", candidate: null });
    const recommendation = completedResult({ request, kind: "RECOMMENDATION_OPTION", resultId: "result:recommendation" });
    expect(recommendation.humanDecisionRequired).toBe(false);
    expect(prepareSpecializedOwnerProjectContribution({ result: recommendation, current: project }).candidate).toBeNull();
  });

  it("H6/H7/H8 — requires Human Decision; rejection is non-mutating and acceptance creates Project vN+1", () => {
    const project = projectWithTemporalBackbone();
    const request = requestFor(project, { owner: "KNOWLEDGE", capabilityId: "KNOWLEDGE_EVIDENCE", nativeInput: { question: "MVO" } });
    const result = completedResult({ request, kind: "PROJECT_CONTRIBUTION_CANDIDATE", contribution: ownerContribution(project) });
    const preparation = prepareSpecializedOwnerProjectContribution({ result, current: project });
    expect(preparation).toMatchObject({ status: "READY_FOR_HUMAN_DECISION", humanDecisionRequired: true, projectWriteAuthorized: false });
    const before = JSON.stringify(project);
    const rejection = rejectSpecializedOwnerProjectContribution({ result, current: project, authority, rejectedAt: "2026-08-24T08:04:00.000Z" });
    expect(rejection.status).toBe("REJECTED");
    expect(JSON.stringify(project)).toBe(before);
    const accepted = confirmSpecializedOwnerProjectContribution({ result, current: project, authority, confirmedAt: "2026-08-24T08:05:00.000Z" });
    expect(accepted).toMatchObject({ revision: project.revision + 1, previousVersionId: project.versionId, owner: "RESEARCH_PROJECT", llmProjectWrites: 0 });
    expect(accepted.confirmationDecision).toMatchObject({ status: "ADOPTED", actor: authority.actorRef, mandate: "PROJECT_OWNER" });
    expect(accepted.confirmationDecision.provenance).toEqual(expect.arrayContaining([
      `${result.resultId}@${result.resultVersion}`,
      `owner-source-project-version:${project.versionId}`,
      `owner-source-project-digest:${project.projectDigest}`,
      "doi:10.1000/mvo",
    ]));
  });

  it("H9 — blocks a stale result when Project version or digest changed", () => {
    const project = projectWithTemporalBackbone();
    const request = requestFor(project, { owner: "KNOWLEDGE", capabilityId: "KNOWLEDGE_EVIDENCE", nativeInput: { question: "MVO" } });
    const result = completedResult({ request, kind: "PROJECT_CONTRIBUTION_CANDIDATE", contribution: ownerContribution(project) });
    const interveningRaw = "Le projet devient multicentrique.";
    const projectVNext = adopt(contributionFor({ current: project, raw: interveningRaw, changes: [change({
      candidateRef: "design:multicenter",
      targetSectionId: "DESIGN",
      proposedType: "STUDY_DESIGN",
      content: "Étude multicentrique",
      sourceText: interveningRaw,
    })] }), project, "2026-08-24T08:04:00.000Z");
    expect(assessSpecializedOwnerResultFreshness(result, projectVNext)).toMatchObject({ status: "STALE_OWNER_RESULT", staleReasons: ["PROJECT_VERSION_CHANGED", "PROJECT_DIGEST_CHANGED"] });
    expect(prepareSpecializedOwnerProjectContribution({ result, current: projectVNext })).toMatchObject({ status: "STALE_OWNER_RESULT", candidate: null });
    expect(() => confirmSpecializedOwnerProjectContribution({ result, current: projectVNext, authority, confirmedAt: "2026-08-24T08:05:00.000Z" })).toThrow("STALE_OWNER_RESULT");
  });

  it("H10/H11 — Knowledge evidence remains an owner result and a missing-evidence branch remains a gap", () => {
    const project = projectWithTemporalBackbone();
    const nativeKnowledge = executeKnowledgeEngine({
      originalQuestion: "Quelles hypothèses de MVO la littérature permet-elle ?",
      researchProjectId: project.projectId,
      strategyVersion: project.versionId,
      createdAt: "2026-08-24T08:03:00.000Z",
    });
    const request = requestFor(project, { owner: "KNOWLEDGE", capabilityId: "KNOWLEDGE_EVIDENCE", nativeInput: nativeKnowledge.request });
    const result = completedResult({ request, kind: "EVIDENCE_DIAGNOSTIC", payload: nativeKnowledge });
    expect(result.nativePayload).toBe(nativeKnowledge);
    expect(result.projectContribution).toBeNull();
    expect(project.canonicalState?.objects.some((object) => object.sourceContributionRef.includes(result.resultId))).toBe(false);

    const missingRequest = requestFor(project, {
      owner: "KNOWLEDGE",
      capabilityId: "KNOWLEDGE_EVIDENCE",
      nativeInput: { question: "Un domaine sans corpus applicable" },
      missingEvidence: ["NO_APPLICABLE_GOVERNED_SOURCE"],
    });
    const gap = createSpecializedOwnerGapResult({ request: missingRequest, resultId: "knowledge-gap:1", resultVersion: "1.0.0", completedAt: "2026-08-24T08:04:00.000Z" });
    expect(gap).toMatchObject({ status: "BLOCKED_BY_MISSING_EVIDENCE", resultKind: "GAP", projectContribution: null });
    expect(gap.gaps).toContain("NO_APPLICABLE_GOVERNED_SOURCE");
  });

  it("H12/H13/H14 — ST, Imaging and REG native proposals never become adoption or approval", () => {
    const project = projectWithTemporalBackbone();
    const cases = [
      { owner: "SCIENTIFIC_THINKING" as const, capabilityId: "SCIENTIFIC_THINKING_PROPOSAL", kind: "RECOMMENDATION_OPTION" as const, payload: { hypothesis: { status: "CANDIDATE_NOT_ADOPTED" } } },
      { owner: "IMAGING" as const, capabilityId: "IMAGING_STUDY_DESIGN", kind: "RECOMMENDATION_OPTION" as const, payload: { acquisitionChoice: { status: "CANDIDATE_NOT_ADOPTED" } } },
      { owner: "REGULATORY_RESOLUTION" as const, capabilityId: "REGULATORY_REQUIREMENT_RESOLUTION", kind: "EVIDENCE_DIAGNOSTIC" as const, payload: { regulatoryApproval: false, boundary: "METHODOLOGICAL_AID_NOT_REGULATORY_VALIDATION" } },
    ];
    cases.forEach((item) => {
      const request = requestFor(project, { owner: item.owner, capabilityId: item.capabilityId, nativeInput: { project: project.projectId } });
      const result = completedResult({ request, kind: item.kind, payload: item.payload, resultId: `result:${item.capabilityId}` });
      expect(result).toMatchObject({ projectContribution: null, humanDecisionRequired: false, projectWriteAuthorized: false });
      expect(prepareSpecializedOwnerProjectContribution({ result, current: project }).status).toBe("NOT_A_PROJECT_CONTRIBUTION");
    });
  });

  it("H15/H16 — absent calculation/engine produces a capability gap and cannot call a fallback", () => {
    const project = projectWithTemporalBackbone();
    const inventory = listSpecializedOwnerCapabilities().entries;
    expect(inventory.find((item) => item.capabilityId === "BIOSTATISTICS_CALCULATION")).toMatchObject({ status: "UNAVAILABLE", canWriteProject: false });
    expect(inventory.find((item) => item.capabilityId === "DATA_MANAGEMENT_EXECUTION")).toMatchObject({ status: "UNAVAILABLE", canWriteProject: false });
    const request = requestFor(project, { owner: "BIOSTATISTICS", capabilityId: "BIOSTATISTICS_CALCULATION", nativeInput: { request: "Calculons la taille d'échantillon" } });
    const gap = createSpecializedOwnerGapResult({ request, resultId: "biostatistics-gap:1", resultVersion: "1.0.0", completedAt: "2026-08-24T08:03:00.000Z" });
    expect(gap).toMatchObject({ status: "OWNER_CAPABILITY_UNAVAILABLE", nativePayload: null, conversationalLlmExpertFallback: "FORBIDDEN" });
    expect(gap.nativePayload).toBeNull();
    expect(() => completedResult({ request, kind: "INFORMATIONAL_ONLY", payload: { inventedSampleSize: 200 } })).toThrow("CALL_NONEXISTENT_ENGINE");
  });

  it("H17/H18 — stable refs, TemporalAnchor and ExpectedVariableOccasion survive the handoff", () => {
    const project = projectWithTemporalBackbone();
    const request = requestFor(project, { owner: "IMAGING", capabilityId: "IMAGING_STUDY_DESIGN", nativeInput: { targetRef: "variable:mvo" } });
    expect(request.sourceProject.objects.map((object) => object.stableId)).toEqual(expect.arrayContaining(["variable:mvo", "acquisition:mri"]));
    expect(request.sourceProject.temporalQualifications).toEqual([expect.objectContaining({
      stableId: "timing:acquisition:mri",
      subjectProjectRef: "acquisition:mri",
      anchor: expect.objectContaining({ valueType: "TEMPORAL_ANCHOR_VALUE", reference: { status: "KNOWN", referenceProjectRef: "event:reperfusion", relationType: "ANCHORED_TO" } }),
    })]);
    expect(request.sourceProject.expectedVariableOccasions).toEqual([expect.objectContaining({
      stableId: "occasion:variable:mvo",
      relationType: "EXPECTED_AT",
      variableProjectRef: "variable:mvo",
    })]);
    const result = completedResult({ request, kind: "RECOMMENDATION_OPTION", payload: { measurementRef: "variable:mvo" } });
    expect(result.stableProjectRefs).toEqual(["variable:mvo", "acquisition:mri"]);
  });

  it("H19/H20 — owner-supported replacement is non-destructive and survives reload", () => {
    const project = projectWithTemporalBackbone();
    const request = requestFor(project, { owner: "KNOWLEDGE", capabilityId: "KNOWLEDGE_EVIDENCE", nativeInput: { question: "Qualifier l'hypothèse MVO" } });
    const result = completedResult({ request, kind: "PROJECT_CONTRIBUTION_CANDIDATE", contribution: ownerContribution(project, "REPLACE") });
    const accepted = confirmSpecializedOwnerProjectContribution({ result, current: project, authority, confirmedAt: "2026-08-24T08:05:00.000Z" });
    const versions = accepted.canonicalState?.objects.filter((object) => object.objectId === "hypothesis:mvo") ?? [];
    expect(versions).toEqual([
      expect.objectContaining({ version: 1, actuality: "SUPERSEDED", content: "La MVO est associée au pronostic" }),
      expect.objectContaining({ version: 2, actuality: "CURRENT", content: "La MVO est associée au risque clinique à long terme", provenance: expect.objectContaining({ assertionKind: "OWNER_SUPPORTED" }) }),
    ]);
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
      clear: () => store.clear(),
      key: (index: number) => [...store.keys()][index] ?? null,
      get length() { return store.size; },
    } satisfies Storage;
    persistFunctionalResetSession(storage, { ...createFunctionalResetSession("2026-08-24T08:00:00.000Z"), project: accepted });
    const reloaded = loadFunctionalResetSession(storage).project;
    expect(reloaded).toEqual(accepted);
    expect(reloaded?.confirmationDecision.provenance).toEqual(expect.arrayContaining([
      `${result.resultId}@${result.resultVersion}`,
      `owner-source-project-version:${project.versionId}`,
      `owner-source-project-digest:${project.projectDigest}`,
    ]));
  });

  it("replays the four backend hands-on failures without conversational expert substitution", () => {
    const project = projectWithTemporalBackbone();

    const literatureRequest = requestFor(project, { owner: "KNOWLEDGE", capabilityId: "KNOWLEDGE_EVIDENCE", nativeInput: { question: "Quelles hypothèses de MVO la littérature permet-elle ?" } });
    const literature = completedResult({ request: literatureRequest, kind: "EVIDENCE_DIAGNOSTIC", payload: { status: "SUPPORTED_OR_GAP_FROM_KNOWLEDGE_ONLY" }, resultId: "replay:literature" });
    expect(literature.owner).toBe("KNOWLEDGE");

    const dimensioning = createSpecializedOwnerGapResult({
      request: requestFor(project, { owner: "BIOSTATISTICS", capabilityId: "BIOSTATISTICS_CALCULATION", nativeInput: { request: "Calculons la taille d'échantillon" } }),
      resultId: "replay:dimensioning", resultVersion: "1.0.0", completedAt: "2026-08-24T08:04:00.000Z",
    });
    expect(dimensioning.status).toBe("OWNER_CAPABILITY_UNAVAILABLE");

    const regulatory = createSpecializedOwnerGapResult({
      request: requestFor(project, { owner: "REGULATORY_RESOLUTION", capabilityId: "REGULATORY_REQUIREMENT_RESOLUTION", nativeInput: { question: "Quand et comment recueillir le consentement ?" }, missingContext: ["JURISDICTION", "RESEARCH_QUALIFICATION"] }),
      resultId: "replay:regulatory", resultVersion: "1.0.0", completedAt: "2026-08-24T08:04:00.000Z",
    });
    expect(regulatory).toMatchObject({ status: "BLOCKED_BY_MISSING_CONTEXT", projectContribution: null });

    const imaging = createSpecializedOwnerGapResult({
      request: requestFor(project, { owner: "IMAGING", capabilityId: "IMAGING_STUDY_DESIGN", nativeInput: { question: "Comment mesurer la MVO ?" }, missingContext: ["OBSERVABLE_PROPERTY_QUALIFICATION", "ACQUISITION_CONTEXT"] }),
      resultId: "replay:imaging", resultVersion: "1.0.0", completedAt: "2026-08-24T08:04:00.000Z",
    });
    expect(imaging).toMatchObject({ status: "BLOCKED_BY_MISSING_CONTEXT", projectContribution: null, conversationalLlmExpertFallback: "FORBIDDEN" });
    expect([literature, dimensioning, regulatory, imaging].every((item) => item.projectWriteAuthorized === false)).toBe(true);
  });
});
