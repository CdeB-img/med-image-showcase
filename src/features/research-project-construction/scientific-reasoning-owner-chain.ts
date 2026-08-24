import {
  logicalDigest,
  stableStringify,
} from "@/features/knowledge-engine";
import {
  IMAGING_STUDY_DESIGNER_VERSION,
  executeImagingStudyDesigner,
  type ImagingDesignInput,
  type ImagingDesignResult,
} from "@/features/imaging-study-designer";
import {
  SCIENTIFIC_THINKING_ENGINE_VERSION,
  executeScientificThinkingEngine,
  type ScientificThinkingInput,
  type ScientificThinkingOutput,
} from "@/features/scientific-thinking";
import type {
  ScientificContributionItem,
  ScientificInterpretationContributionEnvelope,
} from "@/features/scientific-interpretation/contracts";
import {
  buildProjectContextSnapshot,
  type ProjectContextSnapshot,
} from "./canonical-project-backbone";
import type { ResearchProjectOwnerProjection } from "./contribution-owner-boundary";
import {
  assessSpecializedOwnerResultFreshness,
  createSpecializedOwnerGapResult,
  createSpecializedOwnerHandoffRequest,
  recordSpecializedOwnerResult,
  type SpecializedOwnerHandoffRequest,
  type SpecializedOwnerResult,
} from "./specialized-owner-handoff";

export const SCIENTIFIC_REASONING_OWNER_CHAIN_CONTRACT = "PROJECT_SPINE_04_SCIENTIFIC_REASONING_OWNER_CHAIN" as const;
export const SCIENTIFIC_REASONING_OWNER_CHAIN_VERSION = "0.1.0" as const;

export type ScientificReasoningOwnerStatus =
  | "COMPLETED"
  | "COMPLETED_WITH_LIMITATIONS"
  | "OWNER_UNAVAILABLE"
  | "OWNER_RUNTIME_FAILURE"
  | "INVALID_OWNER_RESULT"
  | "STALE_OWNER_RESULT";

export type ScientificReasoningOwnerObservation = {
  contract: typeof SCIENTIFIC_REASONING_OWNER_CHAIN_CONTRACT;
  contractVersion: typeof SCIENTIFIC_REASONING_OWNER_CHAIN_VERSION;
  invocationId: string;
  owner: "SCIENTIFIC_THINKING" | "STUDY_DESIGN" | "IMAGING";
  capabilityId: "SCIENTIFIC_THINKING_PROPOSAL" | "STUDY_DESIGN_COHERENCE" | "IMAGING_STUDY_DESIGN";
  ownerRuntimeVersion: string | null;
  sourceProjectRef: string;
  sourceProjectVersion: string;
  sourceProjectDigest: string;
  requestRef: string;
  resultRef: string | null;
  status: ScientificReasoningOwnerStatus;
  failureCode: string | null;
  stableProjectRefs: readonly string[];
  unknowns: readonly string[];
  gaps: readonly string[];
  limitations: readonly string[];
  startedAt: string;
  completedAt: string;
  latencyMs: number;
  runtimeStarts: 0 | 1;
  conversationalLlmCalls: 0;
  projectWrites: 0;
};

export type ScientificReasoningOwnerInvocation<TNativeInput, TNativeOutput> = {
  request: SpecializedOwnerHandoffRequest<TNativeInput>;
  result: SpecializedOwnerResult<TNativeOutput> | null;
  observation: ScientificReasoningOwnerObservation;
};

export type ScientificThinkingToImagingHandoff = {
  contract: "PROJECT_SPINE_04_ST_TO_IMAGING_HANDOFF";
  contractVersion: "0.1.0";
  handoffId: string;
  sourceOwner: "SCIENTIFIC_THINKING";
  targetOwner: "IMAGING";
  sourceResultRef: string;
  sourceProjectRef: string;
  sourceProjectVersion: string;
  sourceProjectDigest: string;
  stableProjectRefs: readonly string[];
  transferredNativeRefs: readonly string[];
  unknowns: readonly string[];
  limitations: readonly string[];
  status: "READY" | "STALE_OWNER_RESULT";
  staleReasons: readonly string[];
  ownershipTransferred: false;
  projectWriteAuthorized: false;
};

type InvocationTiming = {
  startedAt: string;
  completedAt: string;
  monotonicNow?: () => number;
};

const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))];
const now = (clock?: () => number) => (clock ?? (() => performance.now()))();
const elapsed = (start: number, end: number) => Math.max(0, Math.round((end - start) * 1000) / 1000);

const objectsOf = (snapshot: ProjectContextSnapshot, ...types: ProjectContextSnapshot["objects"][number]["type"][]) =>
  snapshot.objects.filter((item) => types.includes(item.type));

const contentsOf = (snapshot: ProjectContextSnapshot, ...types: ProjectContextSnapshot["objects"][number]["type"][]) =>
  objectsOf(snapshot, ...types).map((item) => item.content);

const projectUnknowns = (snapshot: ProjectContextSnapshot) => unique([
  ...snapshot.objects.filter((item) => item.epistemicState === "UNKNOWN").map((item) => `UNKNOWN_PROJECT_OBJECT:${item.stableId}`),
  ...snapshot.pendingVerificationRefs.map((ref) => `PENDING_VERIFICATION:${ref}`),
  ...snapshot.openConflicts.map((conflict) => `OPEN_PROJECT_CONFLICT:${conflict.conflictId}`),
]);

const temporalLabel = (item: ProjectContextSnapshot["temporalQualifications"][number]) => {
  const anchor = item.anchor;
  const reference = anchor.reference.status === "KNOWN"
    ? anchor.reference.referenceProjectRef
    : `UNKNOWN:${anchor.reference.unresolvedReason}`;
  return `${item.stableId}|${item.temporalRole}|${anchor.kind}|${anchor.direction}|${anchor.offset ?? "UNKNOWN"}|${anchor.unit}|${reference}`;
};

const occasionLabel = (item: ProjectContextSnapshot["expectedVariableOccasions"][number]) => {
  const anchor = item.anchor;
  const reference = anchor.reference.status === "KNOWN"
    ? anchor.reference.referenceProjectRef
    : `UNKNOWN:${anchor.reference.unresolvedReason}`;
  return `${item.stableId}|EXPECTED_AT|${item.variableProjectRef}|${anchor.kind}|${anchor.direction}|${anchor.offset ?? "UNKNOWN"}|${anchor.unit}|${reference}`;
};

export const buildScientificThinkingInputFromProjectSnapshot = (input: {
  project: ResearchProjectOwnerProjection;
  purpose?: string;
}): ScientificThinkingInput => {
  const snapshot = buildProjectContextSnapshot({ project: input.project });
  const question = objectsOf(snapshot, "SCIENTIFIC_QUESTION")[0];
  const purpose = input.purpose ?? "Examiner la cohérence scientifique de cette question et les hypothèses encore à expliciter.";
  const comparison = snapshot.relations.find((item) => /COMPARE/i.test(item.type));
  const comparisonSource = comparison
    ? snapshot.objects.find((item) => item.stableId === comparison.sourceProjectRef)?.content ?? comparison.sourceProjectRef
    : null;
  const comparisonTarget = comparison
    ? snapshot.objects.find((item) => item.stableId === comparison.targetProjectRef)?.content ?? comparison.targetProjectRef
    : null;
  const validatedReformulation = question?.content
    ? `${comparison ? `Comparaison explicite entre ${comparisonSource} et ${comparisonTarget}. ` : ""}${question.content}`
    : purpose;
  const originalExpression = `${validatedReformulation} ${purpose}`;
  const unknowns = unique([
    ...projectUnknowns(snapshot),
    ...(!question ? ["PROJECT_SCIENTIFIC_QUESTION_NOT_EXPLICIT"] : []),
  ]);
  const scientificObjectTerms = unique(snapshot.objects.map((item) => item.content));
  const relations = unique([
    ...snapshot.relations.map((item) => `${item.type}(${item.sourceProjectRef},${item.targetProjectRef})`),
    ...snapshot.temporalQualifications.map(temporalLabel),
    ...snapshot.expectedVariableOccasions.map(occasionLabel),
  ]);
  return {
    contractVersion: SCIENTIFIC_THINKING_ENGINE_VERSION,
    requestId: `scientific-thinking-project-request:${logicalDigest({
      project: snapshot.sourceProjectDigest,
      purpose,
      relations,
    })}`,
    originalExpression,
    validatedReformulation,
    language: "fr",
    scientificIntent: {
      intentRef: `project-scientific-intent:${snapshot.sourceProjectRef}@${snapshot.sourceProjectVersion}`,
      userExpertise: "UNKNOWN",
      sourceJourney: "DESIGN_STUDY",
      semanticModelRef: snapshot.sourceProjectRef,
      semanticModelDigest: snapshot.sourceProjectDigest,
    },
    researchContext: {
      sessionId: `owner-chain:${snapshot.sourceProjectRef}`,
      contextVersion: input.project.revision,
      researchProjectId: snapshot.sourceProjectRef,
      previousDecisionIds: [input.project.confirmationDecision.decisionId],
    },
    scientificObjectTerms,
    resolvedConcepts: snapshot.objects.map((item) => ({
      conceptId: item.stableId,
      label: item.content,
      status: "UNRESOLVED" as const,
    })),
    relations,
    population: contentsOf(snapshot, "POPULATION", "ELIGIBILITY_CRITERION"),
    pathologyOrCondition: contentsOf(snapshot, "CONDITION"),
    phenomena: contentsOf(snapshot, "ENDPOINT", "CANONICAL_VARIABLE"),
    outcomes: contentsOf(snapshot, "ENDPOINT", "CANONICAL_VARIABLE"),
    methodsMentioned: contentsOf(snapshot, "IMAGING_MODALITY", "ACQUISITION"),
    scientificPurpose: contentsOf(snapshot, "OBJECTIVE"),
    context: contentsOf(snapshot, "CONDITION", "STUDY_DESIGN", "INTERVENTION_OR_EXPOSURE", "CONSTRAINT"),
    missingInformation: unknowns,
    contradictions: snapshot.openConflicts.map((item) => item.message),
    safetyFlags: [],
    information: {
      explicit: snapshot.objects.map((item) => `PROJECT_ADOPTED:${item.stableId}:${item.content}`),
      interpreted: [],
    },
    knowledge: {
      resultId: null,
      resultDigest: null,
      coverageStatus: "NOT_REQUESTED_OR_UNAVAILABLE",
      support: "UNAVAILABLE",
      sourceIds: [],
      gapCodes: ["PROJECT_SPINE_04_KNOWLEDGE_NOT_INVOKED"],
      unresolvedConcepts: snapshot.objects.map((item) => item.stableId),
      limitations: ["No KnowledgeResult was supplied; Scientific Thinking candidates cannot claim corpus support."],
    },
  };
};

const contributionFromScientificThinking = (input: {
  output: ScientificThinkingOutput;
  request: SpecializedOwnerHandoffRequest<ScientificThinkingInput>;
  createdAt: string;
}): ScientificInterpretationContributionEnvelope | null => {
  const hypothesis = input.output.hypotheses.find((item) => item.reviewState === "PENDING") ?? input.output.hypotheses[0];
  if (!hypothesis) return null;
  const epistemicStatus = ["SUPPORTED", "PARTIAL"].includes(hypothesis.support)
    ? "SUPPORTED_CANDIDATE"
    : "UNSUPPORTED_CANDIDATE";
  const item: ScientificContributionItem = {
    itemId: `st-project-candidate:${hypothesis.hypothesisId}`,
    semanticIdentity: `st-hypothesis-candidate:${hypothesis.hypothesisId}`,
    proposedType: "HYPOTHESIS",
    content: hypothesis.text,
    polarity: "AFFIRMED",
    studyRole: hypothesis.kind === "PRIMARY" ? "PRIMARY_CANDIDATE" : "ALTERNATIVE_CANDIDATE",
    confidence: null,
    previousItemIds: [],
    evidenceRefs: [...input.output.provenance.sourceRefs],
    epistemicBoundary: {
      ownership: "SCIENTIFIC_THINKING",
      epistemicStatus,
      adoptionStatus: "CANDIDATE",
      originType: "OWNER_RESULT",
      originStatus: "NATIVE_SCIENTIFIC_THINKING_CANDIDATE",
      activeState: true,
      sourceTurnIds: [],
      sourceText: hypothesis.text,
    },
  };
  const contributionId = `scientific-thinking-project-contribution:${logicalDigest({
    output: input.output.outputId,
    hypothesis: hypothesis.hypothesisId,
    project: input.request.sourceProject.sourceProjectDigest,
  })}`;
  const contributionDigest = logicalDigest({ contributionId, item, outputDigest: input.output.outputDigest });
  return {
    contract: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ENVELOPE",
    contractNature: "RUNTIME_CONTRIBUTION_NOT_PD003_ROOT",
    identity: {
      contributionId,
      previousContributionId: null,
      contractVersion: "1.0.0",
      runtimeId: "SCIENTIFIC_THINKING_ENGINE",
      runtimeVersion: SCIENTIFIC_THINKING_ENGINE_VERSION,
      createdAt: input.createdAt,
      contributionDigest,
    },
    source: {
      conversationId: `owner-result:${input.output.outputId}`,
      originalRequest: input.request.purpose,
      turns: [],
      sourceRefs: unique([input.output.outputId, input.output.provenance.inputRef, ...input.output.provenance.sourceRefs]),
      rawOutputRef: input.output.outputId,
      rawOutputDigest: input.output.outputDigest,
    },
    runtimeEvidence: {
      provider: null,
      model: null,
      promptDigest: null,
      schemaDigest: null,
      configurationDigest: logicalDigest({ runtime: "SCIENTIFIC_THINKING_ENGINE", version: SCIENTIFIC_THINKING_ENGINE_VERSION }),
      technicalStatus: "LOCAL_NATIVE_OWNER_RESULT",
      parseStatus: "NOT_REQUIRED",
      validationErrors: [],
    },
    scientificContent: {
      normalizedUnderstanding: input.output.understoodProblem,
      routeProposal: null,
      explicitStatements: [],
      candidateObjects: [item],
      candidateRelations: [],
      inferredContext: [],
      contextualCandidates: [],
      negationsAndConstraints: [],
      temporalElements: [],
      ambiguities: [],
      unknowns: [],
      missingInformation: [],
      correctionsAndSupersessions: [],
      openDecisions: [],
      clarificationNeeds: [],
      temporalQualifications: [],
      expectedVariableOccasions: [],
    },
    epistemicBoundary: {
      candidateIsAdopted: false,
      knowledgeSupportIsProjectDecision: false,
      projectOwnershipTransferred: false,
      humanDecisionEnvelopeRef: null,
    },
    mapping: [{
      sourceItemId: item.itemId,
      proposedTargetDomain: "RESEARCH_PROJECT",
      proposedTargetTypes: ["HYPOTHESIS"],
      mappingStatus: "DOMAIN_REVIEW_REQUIRED",
      qualificationOwnerRequired: "RESEARCH_PROJECT",
      mappingLimitations: ["Scientific Thinking candidate requires deterministic PRJ validation and Human Decision."],
    }],
    audit: { deterministicFindings: [], semanticAuditFindings: [], unresolvedFindings: [] },
    decisionBoundary: {
      decisionRequired: true,
      decisionEnvelopeRef: null,
      permittedHumanDispositions: ["ACCEPT_WORKING_BASIS", "REJECT", "DEFER", "REOPEN"],
      projectWriteAuthorized: false,
    },
  };
};

const observation = (input: {
  request: SpecializedOwnerHandoffRequest;
  invocationId: string;
  ownerRuntimeVersion: string | null;
  resultRef?: string | null;
  status: ScientificReasoningOwnerStatus;
  failureCode?: string | null;
  stableProjectRefs?: readonly string[];
  unknowns?: readonly string[];
  gaps?: readonly string[];
  limitations?: readonly string[];
  startedAt: string;
  completedAt: string;
  latencyMs: number;
  runtimeStarts: 0 | 1;
}): ScientificReasoningOwnerObservation => ({
  contract: SCIENTIFIC_REASONING_OWNER_CHAIN_CONTRACT,
  contractVersion: SCIENTIFIC_REASONING_OWNER_CHAIN_VERSION,
  invocationId: input.invocationId,
  owner: input.request.owner as ScientificReasoningOwnerObservation["owner"],
  capabilityId: input.request.capabilityId as ScientificReasoningOwnerObservation["capabilityId"],
  ownerRuntimeVersion: input.ownerRuntimeVersion,
  sourceProjectRef: input.request.sourceProject.sourceProjectRef,
  sourceProjectVersion: input.request.sourceProject.sourceProjectVersion,
  sourceProjectDigest: input.request.sourceProject.sourceProjectDigest,
  requestRef: input.request.handoffId,
  resultRef: input.resultRef ?? null,
  status: input.status,
  failureCode: input.failureCode ?? null,
  stableProjectRefs: [...(input.stableProjectRefs ?? [])],
  unknowns: [...(input.unknowns ?? [])],
  gaps: [...(input.gaps ?? [])],
  limitations: [...(input.limitations ?? [])],
  startedAt: input.startedAt,
  completedAt: input.completedAt,
  latencyMs: input.latencyMs,
  runtimeStarts: input.runtimeStarts,
  conversationalLlmCalls: 0,
  projectWrites: 0,
});

export const invokeScientificThinkingOwnerFromProject = (input: InvocationTiming & {
  project: ResearchProjectOwnerProjection;
  purpose?: string;
  runtime?: (nativeInput: ScientificThinkingInput) => ScientificThinkingOutput;
}): ScientificReasoningOwnerInvocation<ScientificThinkingInput, ScientificThinkingOutput> => {
  const nativeInput = buildScientificThinkingInputFromProjectSnapshot({ project: input.project, purpose: input.purpose });
  const handoffId = `scientific-thinking-handoff:${logicalDigest({ project: input.project.projectDigest, request: nativeInput.requestId })}`;
  const request = createSpecializedOwnerHandoffRequest({
    handoffId,
    owner: "SCIENTIFIC_THINKING",
    capabilityId: "SCIENTIFIC_THINKING_PROPOSAL",
    purpose: input.purpose ?? "Examiner la cohérence scientifique de cette question et les hypothèses encore à expliciter.",
    project: input.project,
    nativeInputType: "ScientificThinkingInput",
    nativeInputVersion: SCIENTIFIC_THINKING_ENGINE_VERSION,
    nativeInput,
  });
  const invocationId = `scientific-owner-invocation:${logicalDigest({ handoffId, startedAt: input.startedAt })}`;
  const projectBefore = stableStringify(input.project);
  const started = now(input.monotonicNow);
  try {
    const nativeOutput = (input.runtime ?? executeScientificThinkingEngine)(request.nativeInput);
    const latencyMs = elapsed(started, now(input.monotonicNow));
    if (nativeOutput.contractVersion !== SCIENTIFIC_THINKING_ENGINE_VERSION
      || nativeOutput.provenance.inputRef !== nativeInput.requestId
      || stableStringify(input.project) !== projectBefore) {
      return {
        request,
        result: null,
        observation: observation({
          request, invocationId, ownerRuntimeVersion: SCIENTIFIC_THINKING_ENGINE_VERSION,
          status: "INVALID_OWNER_RESULT", failureCode: "SCIENTIFIC_THINKING_RESULT_PROJECT_OR_INPUT_MISMATCH",
          startedAt: input.startedAt, completedAt: input.completedAt, latencyMs, runtimeStarts: 1,
        }),
      };
    }
    const projectContribution = contributionFromScientificThinking({ output: nativeOutput, request, createdAt: input.completedAt });
    const unknowns = unique([...nativeOutput.unknowns, ...nativeOutput.ambiguities]);
    const gaps = unique([
      ...(nativeOutput.knowledgeRequest?.gapCodes ?? []),
      ...(nativeOutput.knowledgeRequest ? ["KNOWLEDGE_RESULT_REQUIRED_BEFORE_EVIDENCE_CLAIM"] : []),
    ]);
    const limitations = unique([
      ...nativeOutput.handoff.limitations,
      "SCIENTIFIC_THINKING_CANDIDATES_ARE_NOT_ADOPTED_PROJECT_FACTS",
    ]);
    const resultKind = projectContribution ? "PROJECT_CONTRIBUTION_CANDIDATE" as const
      : gaps.length || unknowns.length ? "GAP" as const
        : "RECOMMENDATION_OPTION" as const;
    const result = recordSpecializedOwnerResult({
      request,
      resultId: nativeOutput.outputId,
      resultVersion: SCIENTIFIC_THINKING_ENGINE_VERSION,
      completedAt: input.completedAt,
      status: limitations.length || gaps.length || unknowns.length ? "COMPLETED_WITH_LIMITATIONS" : "COMPLETED",
      resultKind,
      nativePayloadType: "ScientificThinkingOutput",
      nativePayloadVersion: SCIENTIFIC_THINKING_ENGINE_VERSION,
      nativePayload: nativeOutput,
      stableProjectRefs: request.sourceProject.objects.map((item) => item.stableId),
      evidenceRefs: nativeOutput.provenance.sourceRefs,
      unknowns,
      gaps,
      limitations,
      provenance: [nativeOutput.outputId, nativeOutput.provenance.inputRef, ...nativeOutput.handoff.provenanceRefs],
      projectContribution,
    });
    return {
      request,
      result,
      observation: observation({
        request, invocationId, ownerRuntimeVersion: SCIENTIFIC_THINKING_ENGINE_VERSION,
        resultRef: `${result.resultId}@${result.resultVersion}`,
        status: result.status === "COMPLETED" ? "COMPLETED" : "COMPLETED_WITH_LIMITATIONS",
        stableProjectRefs: result.stableProjectRefs, unknowns, gaps, limitations,
        startedAt: input.startedAt, completedAt: input.completedAt, latencyMs, runtimeStarts: 1,
      }),
    };
  } catch (error) {
    const latencyMs = elapsed(started, now(input.monotonicNow));
    return {
      request,
      result: null,
      observation: observation({
        request, invocationId, ownerRuntimeVersion: SCIENTIFIC_THINKING_ENGINE_VERSION,
        status: "OWNER_RUNTIME_FAILURE", failureCode: error instanceof Error ? error.message : "SCIENTIFIC_THINKING_RUNTIME_FAILURE",
        startedAt: input.startedAt, completedAt: input.completedAt, latencyMs, runtimeStarts: 1,
      }),
    };
  }
};

export type StudyDesignUnavailableRequest = {
  requestedOperation: "ASSESS_STUDY_STRATEGY_COHERENCE";
  sourceScientificThinkingResultRef: string | null;
};

export const invokeUnavailableStudyDesignOwner = (input: InvocationTiming & {
  project: ResearchProjectOwnerProjection;
  scientificThinkingResult?: SpecializedOwnerResult<ScientificThinkingOutput> | null;
}): ScientificReasoningOwnerInvocation<StudyDesignUnavailableRequest, null> => {
  const nativeInput: StudyDesignUnavailableRequest = {
    requestedOperation: "ASSESS_STUDY_STRATEGY_COHERENCE",
    sourceScientificThinkingResultRef: input.scientificThinkingResult
      ? `${input.scientificThinkingResult.resultId}@${input.scientificThinkingResult.resultVersion}`
      : null,
  };
  const handoffId = `study-design-handoff:${logicalDigest({ project: input.project.projectDigest, nativeInput })}`;
  const request = createSpecializedOwnerHandoffRequest({
    handoffId,
    owner: "STUDY_DESIGN",
    capabilityId: "STUDY_DESIGN_COHERENCE",
    purpose: "Évaluer la cohérence de la stratégie d'étude.",
    project: input.project,
    nativeInputType: "RDE-001/RDE-002 v1.1 normative contract only",
    nativeInputVersion: "NOT_IMPLEMENTED",
    nativeInput,
  });
  const result = createSpecializedOwnerGapResult({
    request,
    resultId: `study-design-owner-gap:${logicalDigest({ handoffId, code: "CALL_NONEXISTENT_ENGINE" })}`,
    resultVersion: "NOT_IMPLEMENTED",
    completedAt: input.completedAt,
  });
  return {
    request,
    result,
    observation: observation({
      request,
      invocationId: `scientific-owner-invocation:${logicalDigest({ handoffId, startedAt: input.startedAt })}`,
      ownerRuntimeVersion: null,
      resultRef: `${result.resultId}@${result.resultVersion}`,
      status: "OWNER_UNAVAILABLE",
      failureCode: "CALL_NONEXISTENT_ENGINE",
      gaps: result.gaps,
      limitations: result.limitations,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      latencyMs: 0,
      runtimeStarts: 0,
    }),
  };
};

export const buildScientificThinkingToImagingHandoff = (input: {
  result: SpecializedOwnerResult<ScientificThinkingOutput>;
  currentProject: ResearchProjectOwnerProjection;
}): ScientificThinkingToImagingHandoff => {
  const freshness = assessSpecializedOwnerResultFreshness(input.result, input.currentProject);
  return {
    contract: "PROJECT_SPINE_04_ST_TO_IMAGING_HANDOFF",
    contractVersion: "0.1.0",
    handoffId: `st-to-imaging:${logicalDigest({
      result: input.result.resultId,
      project: input.currentProject.projectDigest,
    })}`,
    sourceOwner: "SCIENTIFIC_THINKING",
    targetOwner: "IMAGING",
    sourceResultRef: `${input.result.resultId}@${input.result.resultVersion}`,
    sourceProjectRef: input.result.sourceProjectRef,
    sourceProjectVersion: input.result.sourceProjectVersion,
    sourceProjectDigest: input.result.sourceProjectDigest,
    stableProjectRefs: [...input.result.stableProjectRefs],
    transferredNativeRefs: unique([
      input.result.nativePayload?.outputId ?? "",
      ...(input.result.nativePayload?.questions.map((item) => item.questionId) ?? []),
      ...(input.result.nativePayload?.hypotheses.map((item) => item.hypothesisId) ?? []),
      ...(input.result.nativePayload?.objectives.map((item) => item.objectiveId) ?? []),
    ]),
    unknowns: [...input.result.unknowns],
    limitations: [...input.result.limitations],
    status: freshness.status === "CURRENT" ? "READY" : "STALE_OWNER_RESULT",
    staleReasons: freshness.staleReasons,
    ownershipTransferred: false,
    projectWriteAuthorized: false,
  };
};

export const buildImagingInputFromProjectAndScientificThinking = (input: {
  project: ResearchProjectOwnerProjection;
  scientificThinkingResult: SpecializedOwnerResult<ScientificThinkingOutput>;
}): ImagingDesignInput => {
  const handoff = buildScientificThinkingToImagingHandoff({ result: input.scientificThinkingResult, currentProject: input.project });
  if (handoff.status === "STALE_OWNER_RESULT") throw new Error("STALE_OWNER_RESULT");
  const snapshot = buildProjectContextSnapshot({ project: input.project });
  const st = input.scientificThinkingResult.nativePayload;
  if (!st) throw new Error("SCIENTIFIC_THINKING_NATIVE_PAYLOAD_REQUIRED");
  const question = objectsOf(snapshot, "SCIENTIFIC_QUESTION")[0];
  const objectives = objectsOf(snapshot, "OBJECTIVE");
  const hypotheses = objectsOf(snapshot, "HYPOTHESIS");
  const centralObject = objectsOf(snapshot, "ENDPOINT", "CANONICAL_VARIABLE")[0];
  const modality = objectsOf(snapshot, "IMAGING_MODALITY")[0];
  const acquisitions = objectsOf(snapshot, "ACQUISITION");
  const timing = unique([
    ...snapshot.temporalQualifications.map(temporalLabel),
    ...snapshot.expectedVariableOccasions.map(occasionLabel),
  ]);
  const provenance = unique([
    handoff.sourceResultRef,
    handoff.sourceProjectVersion,
    handoff.sourceProjectDigest,
    ...handoff.stableProjectRefs,
  ]);
  const material = {
    project: snapshot.sourceProjectDigest,
    handoff: handoff.handoffId,
    question: question?.stableId,
    objectives: objectives.map((item) => item.stableId),
    hypotheses: hypotheses.map((item) => item.stableId),
    timing,
  };
  return {
    contractVersion: IMAGING_STUDY_DESIGNER_VERSION,
    inputId: `imaging-project-input:${logicalDigest(material)}`,
    researchProjectId: snapshot.sourceProjectRef,
    strategyVersion: snapshot.sourceProjectVersion,
    sourceHandoff: {
      kind: "VALIDATED_DESIGN_CONTEXT",
      stOutputRef: st.outputId,
      status: "VALIDATED_WITHOUT_ST_HANDOFF",
      boundary: "NO_PROTOCOL_NO_METHOD_SELECTION_NO_STATISTICAL_PLAN",
      humanDecisions: [input.project.confirmationDecision],
    },
    originalExpression: question?.content ?? st.originalIdea,
    confirmedScientificQuestion: {
      questionId: question?.stableId ?? `project-question:${logicalDigest(st.understoodProblem)}`,
      text: question?.content ?? st.understoodProblem,
      confirmation: "VALIDATED_CONTEXT",
    },
    objectives: objectives.map((item, index) => ({
      objectiveId: item.stableId,
      text: item.content,
      level: /PRIMARY/i.test(item.scientificRole ?? "") || index === 0 ? "PRIMARY" as const : "SECONDARY" as const,
      reviewState: "ADOPTED" as const,
    })),
    hypotheses: hypotheses.map((item, index) => ({
      hypothesisId: item.stableId,
      text: item.content,
      kind: /ALTERNATIVE/i.test(item.scientificRole ?? "") || index > 0 ? "ALTERNATIVE" as const : "PRIMARY" as const,
      reviewState: "ADOPTED" as const,
    })),
    mechanisms: st.mechanisms.map((item) => ({ mechanismId: item.mechanismId, text: item.text, support: item.support })),
    centralScientificObject: centralObject?.content ?? st.centralScientificObject,
    scientificObjectTerms: snapshot.objects.map((item) => item.content),
    pathologyOrCondition: contentsOf(snapshot, "CONDITION"),
    populationContext: contentsOf(snapshot, "POPULATION", "ELIGIBILITY_CRITERION"),
    temporalContext: timing,
    phenomenaDeclared: unique([...(centralObject ? [centralObject.content] : []), ...(st.centralScientificObject ? [st.centralScientificObject] : [])]),
    outcomesDeclared: contentsOf(snapshot, "ENDPOINT", "CANONICAL_VARIABLE"),
    methodPreferences: unique([...(modality ? [modality.content] : []), ...acquisitions.map((item) => item.content)]),
    scientificRelationships: snapshot.relations.map((item) => `${item.type}(${item.sourceProjectRef},${item.targetProjectRef})`),
    knownConstraints: contentsOf(snapshot, "CONSTRAINT"),
    declaredEquipment: modality ? [{
      equipmentId: `project-declared-modality:${modality.stableId}`,
      siteLabel: "Project context; site not supplied",
      modality: modality.content,
      manufacturer: null,
      model: null,
      fieldStrength: null,
      softwareVersion: null,
      options: [],
      availability: "DECLARED_AVAILABLE",
      period: null,
      provenanceRef: modality.versionRef,
    }] : [],
    centerContext: { mode: "UNKNOWN", declarations: [] },
    knowledge: {
      resultId: null,
      resultDigest: null,
      coverageStatus: "NOT_REQUESTED_OR_UNAVAILABLE",
      concepts: [],
      assertions: [],
      documentaryStatements: [],
      gaps: [{
        code: "KNOWLEDGE_RESULT_REQUIRED_FOR_IMAGING_MEASUREMENT_PROPOSAL",
        explanation: "No applicable governed KnowledgeResult supports a phenomenon-to-measurement chain for this invocation.",
        affectedConceptIds: centralObject ? [centralObject.stableId] : [],
        resumeCondition: "Invoke Knowledge with the same Project version and provide applicable evidence or preserve the gap.",
      }],
      limitations: [
        "No Knowledge assertion was reconstructed from Project truth.",
        "OBSERVABILITY_QUALIFICATION runtime is unavailable; Imaging cannot claim complete OBS qualification.",
      ],
      sourceIds: [],
      matchingSemantics: "NO_RESULT",
    },
    decisions: [input.project.confirmationDecision.decisionId],
    uncertainties: unique([...st.unknowns, ...st.ambiguities, ...projectUnknowns(snapshot)]),
    contradictions: unique([...st.contradictions, ...snapshot.openConflicts.map((item) => item.message)]),
    safetyFlags: [],
    provenance,
    trace: [{
      sequence: 1,
      operation: "BUILD_IMAGING_INPUT_FROM_PROJECT_AND_ST_RESULT",
      decision: "PROJECT_ADOPTED_CONTEXT_AND_ST_CANDIDATE_REFS_PRESERVED_WITHOUT_OWNERSHIP_TRANSFER",
      inputDigest: logicalDigest({ snapshot: snapshot.snapshotDigest, st: st.outputDigest }),
      outputDigest: logicalDigest(material),
    }],
  };
};

export type ImagingOwnerChainInvocation = {
  handoff: ScientificThinkingToImagingHandoff;
  request: SpecializedOwnerHandoffRequest<ImagingDesignInput> | null;
  result: SpecializedOwnerResult<ImagingDesignResult> | null;
  observation: ScientificReasoningOwnerObservation;
};

export const invokeImagingOwnerFromScientificThinking = (input: InvocationTiming & {
  project: ResearchProjectOwnerProjection;
  scientificThinkingResult: SpecializedOwnerResult<ScientificThinkingOutput>;
  purpose?: string;
  runtime?: (nativeInput: ImagingDesignInput) => ImagingDesignResult;
}): ImagingOwnerChainInvocation => {
  const handoff = buildScientificThinkingToImagingHandoff({ result: input.scientificThinkingResult, currentProject: input.project });
  if (handoff.status === "STALE_OWNER_RESULT") {
    const request = createSpecializedOwnerHandoffRequest({
      handoffId: handoff.handoffId,
      owner: "IMAGING",
      capabilityId: "IMAGING_STUDY_DESIGN",
      purpose: input.purpose ?? "Quelles propositions Imaging permettent d'opérationnaliser correctement cette mesure ?",
      project: input.project,
      nativeInputType: "ImagingDesignInput",
      nativeInputVersion: IMAGING_STUDY_DESIGNER_VERSION,
      nativeInput: { blockedBy: "STALE_OWNER_RESULT", sourceResultRef: handoff.sourceResultRef },
    });
    return {
      handoff,
      request: null,
      result: null,
      observation: observation({
        request,
        invocationId: `scientific-owner-invocation:${logicalDigest({ handoff: handoff.handoffId, startedAt: input.startedAt })}`,
        ownerRuntimeVersion: IMAGING_STUDY_DESIGNER_VERSION,
        status: "STALE_OWNER_RESULT",
        failureCode: "STALE_OWNER_RESULT",
        stableProjectRefs: handoff.stableProjectRefs,
        gaps: handoff.staleReasons,
        limitations: handoff.limitations,
        startedAt: input.startedAt,
        completedAt: input.completedAt,
        latencyMs: 0,
        runtimeStarts: 0,
      }),
    };
  }
  const nativeInput = buildImagingInputFromProjectAndScientificThinking({
    project: input.project,
    scientificThinkingResult: input.scientificThinkingResult,
  });
  const request = createSpecializedOwnerHandoffRequest({
    handoffId: handoff.handoffId,
    owner: "IMAGING",
    capabilityId: "IMAGING_STUDY_DESIGN",
    purpose: input.purpose ?? "Quelles propositions Imaging permettent d'opérationnaliser correctement cette mesure ?",
    project: input.project,
    nativeInputType: "ImagingDesignInput",
    nativeInputVersion: IMAGING_STUDY_DESIGNER_VERSION,
    nativeInput,
  });
  const invocationId = `scientific-owner-invocation:${logicalDigest({ handoff: handoff.handoffId, startedAt: input.startedAt })}`;
  const projectBefore = stableStringify(input.project);
  const started = now(input.monotonicNow);
  try {
    const nativeOutput = (input.runtime ?? executeImagingStudyDesigner)(request.nativeInput);
    const latencyMs = elapsed(started, now(input.monotonicNow));
    if (nativeOutput.contractVersion !== IMAGING_STUDY_DESIGNER_VERSION
      || nativeOutput.provenance.inputRef !== nativeInput.inputId
      || nativeOutput.scientificQuestion.questionId !== nativeInput.confirmedScientificQuestion.questionId
      || stableStringify(input.project) !== projectBefore) {
      return {
        handoff,
        request,
        result: null,
        observation: observation({
          request, invocationId, ownerRuntimeVersion: IMAGING_STUDY_DESIGNER_VERSION,
          status: "INVALID_OWNER_RESULT", failureCode: "IMAGING_RESULT_PROJECT_OR_INPUT_MISMATCH",
          startedAt: input.startedAt, completedAt: input.completedAt, latencyMs, runtimeStarts: 1,
        }),
      };
    }
    const gaps = unique([
      ...nativeOutput.knowledgeHandoff.gapCodes,
      ...nativeOutput.missingInformation,
      "OBSERVABILITY_QUALIFICATION:NOT_IMPLEMENTED",
    ]);
    const unknowns = unique([
      ...nativeOutput.projectConstructionHandoff.unknowns,
      ...nativeInput.uncertainties,
    ]);
    const limitations = unique([
      ...nativeOutput.limitations,
      ...nativeOutput.projectConstructionHandoff.limitations,
      "OBS_RUNTIME_UNAVAILABLE_NO_AUTONOMOUS_QUALIFICATION",
    ]);
    const hasSpecializedProposal = nativeOutput.acquisitionStrategies.length > 0
      || nativeOutput.imagingVariables.length > 0
      || nativeOutput.modalityCandidates.length > 0;
    const result = recordSpecializedOwnerResult({
      request,
      resultId: nativeOutput.resultId,
      resultVersion: IMAGING_STUDY_DESIGNER_VERSION,
      completedAt: input.completedAt,
      status: gaps.length || unknowns.length || limitations.length ? "COMPLETED_WITH_LIMITATIONS" : "COMPLETED",
      resultKind: hasSpecializedProposal ? "RECOMMENDATION_OPTION" : "GAP",
      nativePayloadType: "ImagingDesignResult",
      nativePayloadVersion: IMAGING_STUDY_DESIGNER_VERSION,
      nativePayload: nativeOutput,
      stableProjectRefs: request.sourceProject.objects.map((item) => item.stableId),
      evidenceRefs: unique([
        ...nativeOutput.biomarkerCandidates.flatMap((item) => item.evidenceRefs),
        ...nativeOutput.modalityCandidates.flatMap((item) => item.evidenceRefs),
      ]),
      unknowns,
      gaps,
      limitations,
      provenance: [nativeOutput.resultId, nativeOutput.provenance.inputRef, handoff.sourceResultRef, ...nativeOutput.provenance.sourceRefs],
    });
    return {
      handoff,
      request,
      result,
      observation: observation({
        request, invocationId, ownerRuntimeVersion: IMAGING_STUDY_DESIGNER_VERSION,
        resultRef: `${result.resultId}@${result.resultVersion}`,
        status: result.status === "COMPLETED" ? "COMPLETED" : "COMPLETED_WITH_LIMITATIONS",
        stableProjectRefs: result.stableProjectRefs,
        unknowns,
        gaps,
        limitations,
        startedAt: input.startedAt,
        completedAt: input.completedAt,
        latencyMs,
        runtimeStarts: 1,
      }),
    };
  } catch (error) {
    const latencyMs = elapsed(started, now(input.monotonicNow));
    return {
      handoff,
      request,
      result: null,
      observation: observation({
        request, invocationId, ownerRuntimeVersion: IMAGING_STUDY_DESIGNER_VERSION,
        status: "OWNER_RUNTIME_FAILURE", failureCode: error instanceof Error ? error.message : "IMAGING_RUNTIME_FAILURE",
        stableProjectRefs: handoff.stableProjectRefs,
        startedAt: input.startedAt, completedAt: input.completedAt, latencyMs, runtimeStarts: 1,
      }),
    };
  }
};

export const createScientificReasoningKnowledgeGap = (input: {
  project: ResearchProjectOwnerProjection;
  sourceResult: SpecializedOwnerResult<ScientificThinkingOutput>;
  completedAt: string;
}) => {
  const request = createSpecializedOwnerHandoffRequest({
    handoffId: `scientific-reasoning-knowledge-gap:${logicalDigest({
      project: input.project.projectDigest,
      result: input.sourceResult.resultId,
    })}`,
    owner: "KNOWLEDGE",
    capabilityId: "KNOWLEDGE_EVIDENCE",
    purpose: "Qualifier les preuves nécessaires à la chaîne MVO → mesure d'imagerie.",
    project: input.project,
    nativeInputType: "KnowledgeRequest not executed in SPINE-04",
    nativeInputVersion: "1.2.0",
    nativeInput: {
      sourceOwnerResultRef: `${input.sourceResult.resultId}@${input.sourceResult.resultVersion}`,
      requestedEvidence: "Applicable evidence for MVO observability and measurement in the current Project context",
      externalSearchPolicy: "INTERNAL_ONLY",
    },
    missingEvidence: ["APPLICABLE_MVO_OBSERVABILITY_AND_MEASUREMENT_EVIDENCE_NOT_SUPPLIED"],
  });
  return {
    request,
    result: createSpecializedOwnerGapResult({
      request,
      resultId: `knowledge-gap:${logicalDigest({ handoff: request.handoffId, project: input.project.projectDigest })}`,
      resultVersion: "1.2.0",
      completedAt: input.completedAt,
      limitations: ["No external search and no conversational expert fallback were used."],
    }),
  };
};
