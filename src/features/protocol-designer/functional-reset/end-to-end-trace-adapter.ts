import type { ScientificInterpretationContributionEnvelope } from "@/features/scientific-interpretation/contracts";
import { logicalDigest } from "@/features/knowledge-engine";
import type { DocumentProjection, FunctionalResetDocumentPortfolio } from "@/features/document-projection";
import type { FunctionalResetQueryNavigation } from "@/features/query-navigation";
import type {
  ResearchProjectContributionCandidate,
  ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import type { HumanDecisionEnvelope } from "@/features/protocol-designer/human-decision";
import type { PersistentExtractionProviderArtifact, ProductBridgeResponse } from "@/features/protocol-designer/product-bridge";
import type { RetainedContributionCandidate } from "./contribution-lifecycle";
import type { resolveGovernedPostAdoptionReceipt } from "./session";
import {
  appendProductTraceStage,
  recordPreProjectScientificTraceSegment,
  startProductTraceRun,
  type PreProjectScientificTraceSegment,
  type ScientificExecutionTraceLedger,
  type ScientificRunProjectBinding,
  type ScientificTraceError,
  type ScientificTraceOwner,
  type ScientificTraceRealizationOutcome,
  type ScientificTraceSemanticDimension,
  type ScientificTraceSemanticTransformation,
} from "@/features/protocol-designer/scientific-execution-trace";

const hasRun = (ledger: Readonly<ScientificExecutionTraceLedger>, traceRunId: string | null | undefined) => Boolean(
  traceRunId && ledger.runBindings.some((binding) => binding.runId === traceRunId),
);

const projectBinding = (project: Readonly<ResearchProjectOwnerProjection>): ScientificRunProjectBinding => ({
  projectId: project.projectId,
  projectVersion: project.versionId,
  projectDigest: project.projectDigest,
  snapshotRef: project.projectDigest,
});

export type ProductTraceExtractionExecution = Readonly<{
  executor: string;
  provider: string;
  componentId: string;
  componentVersion: string;
}>;

export const productTraceExtractionExecution = (input: {
  contribution: Readonly<ScientificInterpretationContributionEnvelope> | null;
  providerArtifact: Readonly<PersistentExtractionProviderArtifact> | null;
  observedProvider: string | null | undefined;
  observedModelRequested: string | null | undefined;
  observedModelReturned: string | null | undefined;
}): ProductTraceExtractionExecution => Object.freeze({
  executor: input.providerArtifact?.executor
    ?? input.contribution?.identity.runtimeId
    ?? "NONE",
  provider: input.providerArtifact?.provider
    ?? input.observedProvider
    ?? input.contribution?.runtimeEvidence.provider
    ?? "NONE",
  componentId: input.providerArtifact?.functionName
    ?? input.contribution?.identity.runtimeId
    ?? "PERSISTENT_PROJECT_EXTRACTION",
  componentVersion: input.providerArtifact?.modelReturned
    ?? input.providerArtifact?.model
    ?? input.observedModelReturned
    ?? input.observedModelRequested
    ?? input.contribution?.runtimeEvidence.model
    ?? input.contribution?.identity.runtimeVersion
    ?? "UNKNOWN",
});


const retainedCandidateTraceReference = (candidate: Readonly<RetainedContributionCandidate>) => ({
  // The retained consumer record is not the scientific contribution itself:
  // sharing its ref with a different digest would create false continuity gaps.
  ref: `${candidate.candidateRef}:retained`,
  version: "NON_ADOPTED_CONTRIBUTION_CANDIDATE",
  digest: candidate.candidateDigest,
});

const hasExtractedContributionTrace = (
  ledger: Readonly<ScientificExecutionTraceLedger>,
  traceRunId: string,
  contribution: Readonly<ScientificInterpretationContributionEnvelope>,
) => ledger.events.some((event) => event.runId === traceRunId
  && event.common?.stage === "PROJECT_CANDIDATE_EXTRACTED"
  && event.common.output.some((reference) => reference.ref === contribution.identity.contributionId
    && reference.version === contribution.identity.contractVersion
    && reference.digest === contribution.identity.contributionDigest));

const hasRetainedContributionValidationTrace = (
  ledger: Readonly<ScientificExecutionTraceLedger>,
  traceRunId: string,
  retained: Readonly<RetainedContributionCandidate>,
) => {
  const expected = retainedCandidateTraceReference(retained);
  return ledger.events.some((event) => event.runId === traceRunId
    && event.common?.stage === "PROJECT_CANDIDATE_VALIDATED"
    && event.common.output.some((reference) => reference.ref === expected.ref
      && reference.version === expected.version && reference.digest === expected.digest));
};

export const recordRetainedContributionValidation = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  traceRunId: string;
  conversationId: string;
  retainedCandidate: Readonly<RetainedContributionCandidate>;
  extractionExecution?: ProductTraceExtractionExecution;
  extractionLatencyMs?: number | null;
  extractedAt?: string;
  validatedAt?: string;
}): Readonly<ScientificExecutionTraceLedger> => {
  const retained = input.retainedCandidate;
  let ledger = input.ledger;
  if (!hasRun(ledger, input.traceRunId)) ledger = startProductTraceRun({
    ledger, traceRunId: input.traceRunId,
    turnId: retained.sourceTurnRef, conversationId: input.conversationId,
    startedAt: input.extractedAt ?? retained.retainedAt, sourceDigest: retained.sourceDigest,
  }).ledger;
  if (hasRetainedContributionValidationTrace(ledger, input.traceRunId, retained)) return ledger;
  const binding = retained.baseProject ? {
    projectId: retained.baseProject.projectId,
    projectVersion: retained.baseProject.versionId,
    projectDigest: retained.baseProject.projectDigest,
    snapshotRef: "UNKNOWN",
  } : undefined;
  const contributionReference = {
    ref: retained.contribution.identity.contributionId,
    version: retained.contribution.identity.contractVersion,
    digest: retained.contribution.identity.contributionDigest,
  };
  if (!hasExtractedContributionTrace(ledger, input.traceRunId, retained.contribution)) {
    const execution = input.extractionExecution ?? productTraceExtractionExecution({
      contribution: retained.contribution, providerArtifact: null,
      observedProvider: retained.contribution.runtimeEvidence.provider,
      observedModelRequested: retained.contribution.runtimeEvidence.model,
      observedModelReturned: null,
    });
    const extractedAt = input.extractedAt ?? retained.retainedAt;
    ledger = appendProductTraceStage({
      ledger, traceRunId: input.traceRunId, timestamp: extractedAt,
      status: "CANDIDATE", owner: "RESEARCH_PROJECT", durationMs: input.extractionLatencyMs ?? null,
      envelope: {
        stage: "PROJECT_CANDIDATE_EXTRACTED", responsibilityOwner: "SCIENTIFIC_INTERPRETATION",
        decisionOwner: "NONE", executor: execution.executor, provider: execution.provider,
        componentId: execution.componentId, componentVersion: execution.componentVersion,
        input: [{ ref: retained.sourceTurnRef, version: "USER_TURN", digest: retained.sourceDigest }],
        output: [contributionReference],
        reasonCode: "VALIDATED_SOURCE_ANCHORED_CONTRIBUTION_RECEIVED",
        completedAt: extractedAt, conversationId: input.conversationId,
        ...(binding ? { project: binding } : {}),
      },
    }).ledger;
  }
  const validatedAt = input.validatedAt ?? retained.retainedAt;
  return appendProductTraceStage({
    ledger, traceRunId: input.traceRunId, timestamp: validatedAt,
    status: retained.candidate.status, owner: "RESEARCH_PROJECT", durationMs: 0,
    envelope: {
      stage: "PROJECT_CANDIDATE_VALIDATED", responsibilityOwner: "RESEARCH_PROJECT",
      decisionOwner: "NONE", executor: "PRJ001_CONTRIBUTION_OWNER_BOUNDARY", provider: "NONE",
      componentId: "PRJ001_CONTRIBUTION_OWNER_BOUNDARY", componentVersion: retained.validatorRef,
      input: [contributionReference, ...retained.dependencyBindings.map(({ ref, version, digest }) => ({ ref, version, digest }))],
      // Existing Human Review keeps consuming the unchanged contribution ref.
      // The additional ref binds the exact retained candidate payload separately.
      output: [contributionReference, retainedCandidateTraceReference(retained)],
      reasonCode: "VALIDATED_CANDIDATE_RETAINED_NON_ADOPTED",
      completedAt: validatedAt, conversationId: input.conversationId,
      ...(binding ? { project: binding } : {}),
    },
  }).ledger;
};

// Common receipt recorder within the existing TRACE v2 identity and event taxonomy.

type GovernedConversationTraceInput = {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  traceRunId: string;
  conversationId: string;
  sourceDigest: string;
  observedAt: string;
  response: Readonly<ProductBridgeResponse>;
  retainedCandidate?: Readonly<RetainedContributionCandidate> | null;
  // Exact strings used by the provider request, not an equivalent reconstruction.
  providerContext: string;
  systemInstruction: string;
};

/** Facts from the current-turn governed receipt; no free-text semantic inference.
 * The legacy pre-Project segment remains unchanged for the legacy pathway. */
// Additional existing-adapter helper only for a local realization actually used
// by resolveGovernedPostAdoptionReceipt. The native receipt is recorded unchanged
// first by recordGovernedConversationTrace, including its genuine provider call.
// No new event taxonomy: ERROR_BOUNDARY + QUESTION_REALIZED remain existing facts.
export const recordPostAdoptionGovernedLocalRealization = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  traceRunId: string;
  conversationId: string;
  turnId: string;
  response: Readonly<ProductBridgeResponse>;
  realized: ReturnType<typeof resolveGovernedPostAdoptionReceipt>;
  nativeOutcome: ScientificTraceRealizationOutcome;
}): Readonly<ScientificExecutionTraceLedger> => {
  const local = input.realized.localRealization;
  const native = input.response.currentTurnNavigation;
  if (!local || !native || local.whatRef !== native.envelope.whatRef || !hasRun(input.ledger, input.traceRunId)) return input.ledger;
  const what = { ref: native.envelope.whatRef, version: native.envelope.contractVersion,
    digest: logicalDigest(native.envelope) };
  const output = { ref: `${native.envelope.whatRef}:post-adoption-local:${input.turnId}`,
    version: native.envelope.contractVersion, digest: logicalDigest(local.value.assistantReply) };
  if (input.ledger.events.some((event) => event.runId === input.traceRunId && event.common?.stage === "QUESTION_REALIZED"
    && event.common.output.some((ref) => ref.ref === output.ref && ref.version === output.version && ref.digest === output.digest))) return input.ledger;
  const isDiagnostic = input.ledger.runBindings.find((binding) => binding.runId === input.traceRunId)
    ?.captureConfiguration?.captureLevel !== "LEVEL_1_CORE";
  return appendProductTraceStage({
    ledger: input.ledger, traceRunId: input.traceRunId, timestamp: local.realizedAt,
    status: "CANONICAL_RESPONSE_REALIZED", owner: "QUERY_NAVIGATION", durationMs: 0,
    envelope: {
      stage: "QUESTION_REALIZED", responsibilityOwner: "QUERY_NAVIGATION", decisionOwner: "QUERY_NAVIGATION",
      executor: "LOCAL_DETERMINISTIC_REALIZATION", provider: "NONE",
      componentId: "GOVERNED_CONVERSATION_REALIZATION", componentVersion: native.envelope.contractVersion,
      input: [what], output: [output], reasonCode: "POST_ADOPTION_SAME_GOVERNED_WHAT_LOCAL_REALIZATION",
      completedAt: local.realizedAt, conversationId: input.conversationId,
      ...(native.envelope.projectBinding ? { project: { ...native.envelope.projectBinding, snapshotRef: "UNKNOWN" } } : {}),
      ...(isDiagnostic ? {
        realizationOutcome: { ...input.nativeOutcome, effectiveExecutor: "LOCAL_DETERMINISTIC_REALIZATION",
          fallbackReason: input.realized.mediationFailure ?? "GOVERNED_LOCAL_REALIZATION" },
        // Local validation does not carry provider content witnesses. Do not
        // reuse the rejected provider's missing refs as local semantic losses.
        semanticTransformation: {
          contract: "SCIENTIFIC_TRACE_SEMANTIC_TRANSFORMATION" as const, contractVersion: "1.0.0" as const,
          transformationSource: "STRUCTURED_COMPONENT_OUTPUT" as const,
          inputDimensions: native.envelope.requiredContentRefs.map((dimensionId) => ({
            dimensionId, source: what.ref, status: "PRESENT", reasonCode: "REQUIRED_BY_GOVERNED_WHAT" })),
          outputDimensions: native.envelope.requiredContentRefs.map((dimensionId) => ({
            dimensionId, source: what.ref, status: "UNKNOWN", reasonCode: "LOCAL_REALIZATION_HAS_NO_PROVIDER_SEMANTIC_WITNESS" })),
          retainedDimensions: [], transformedDimensions: [], droppedDimensions: [],
          transformationReason: "EXACT_GOVERNED_LOCAL_WHAT_STRUCTURALLY_VALIDATED_NOT_SEMANTIC_ORACLE",
          dropReason: "NONE",
        },
      } : {}),
    },
  }).ledger;
};

export const recordGovernedConversationTrace = (input: GovernedConversationTraceInput): {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  realizationOutcome: ScientificTraceRealizationOutcome;
} => {
  const { response } = input;
  const navigation = response.currentTurnNavigation;
  const governed = response.governedRealization;
  const failure = response.conversationFailure;
  const calls = response.observability.conversationCalls;
  const received = response.observability.conversationResponseReceived;
  const attempted = calls === 1;
  const attemptedProvider = attempted
    ? response.observability.conversationProvider ?? response.observability.provider
    : calls === 0 ? "NONE" : "UNKNOWN";
  // Never promote the configured provider to evidence of an executed request.
  const effectiveExecutor = failure ? "NONE"
    : governed?.providerReplyAccepted
      ? attempted && received === true ? governed.executor : "UNKNOWN"
      : governed?.executor ?? "NONE";
  const realizationOutcome: ScientificTraceRealizationOutcome = {
    contract: "SCIENTIFIC_TRACE_REALIZATION_OUTCOME",
    contractVersion: "1.0.0",
    declarationSource: "STRUCTURED_COMPONENT_OUTPUT",
    attemptedProvider,
    providerResponseReceived: received === true,
    providerResponseAccepted: received === true ? governed?.providerReplyAccepted ?? null : null,
    providerRejectionReason: failure?.code
      ?? (governed?.providerReplyAccepted === false
        ? governed.conformance.diagnostics.join(";") || "PROVIDER_REALIZATION_NOT_ACCEPTED"
        : "NONE"),
    effectiveExecutor,
    // The API can compute a local candidate reply that the transaction refuses.
    // That computation is not evidence of a visible fallback response.
    fallbackReason: failure ? "DOWNSTREAM_FAILURE_NO_RESPONSE_PRESENTED"
      : governed?.fallbackUsed ? governed.fallbackReason ?? "LOCAL_WHAT_REALIZATION" : "NONE",
  };
  let ledger = input.ledger;
  // NAVIGATION failures have neither a selected WHAT nor a HOW request.
  if (!navigation || !hasRun(ledger, input.traceRunId)) return { ledger, realizationOutcome };
  const envelope = navigation.envelope;
  const what = { ref: envelope.whatRef, version: envelope.contractVersion, digest: logicalDigest(envelope) };
  const request = {
    ref: `${envelope.whatRef}:realization-request`,
    version: envelope.contractVersion,
    digest: logicalDigest({ what, contextDigest: logicalDigest(input.providerContext),
      systemInstructionDigest: logicalDigest(input.systemInstruction) }),
  };
  const isDiagnostic = ledger.runBindings.find((binding) => binding.runId === input.traceRunId)
    ?.captureConfiguration?.captureLevel !== "LEVEL_1_CORE";
  const binding = envelope.projectBinding ? {
    ...envelope.projectBinding, snapshotRef: "UNKNOWN",
  } : undefined;
  const completedAt = response.stageTimestamps?.howCompletedAt ?? input.observedAt;
  const requestedAt = response.stageTimestamps?.howRequestedAt ?? completedAt;
  const selection = navigation.selection;
  const rejected = selection.candidates.filter((candidate) => candidate.eligibility !== "ELIGIBLE"
    || selection.trace.dominanceEdges.some((edge) => edge.dominatedRef === candidate.candidateId));
  const rejectionReasons = rejected.flatMap((candidate) => [
    ...(candidate.eligibility !== "ELIGIBLE" ? candidate.eligibilityReasons.map((reasonCode) => ({
      alternativeRef: candidate.candidateId, reasonCode,
    })) : []),
    ...selection.trace.dominanceEdges.filter((edge) => edge.dominatedRef === candidate.candidateId)
      .map((edge) => ({ alternativeRef: candidate.candidateId, reasonCode: edge.reason })),
  ]);
  const exists = (stage: string, reference: typeof what) => ledger.events.some((event) => event.runId === input.traceRunId
    && event.common?.stage === stage && event.common.output.some((item) => item.ref === reference.ref
      && item.version === reference.version && item.digest === reference.digest));
  const append = (event: Parameters<typeof appendProductTraceStage>[0]) => {
    ledger = appendProductTraceStage(event).ledger;
  };
  if (!exists("INFORMATION_NEED_SELECTED", what)) append({
    ledger, traceRunId: input.traceRunId, timestamp: requestedAt,
    status: envelope.action, owner: "QUERY_NAVIGATION", durationMs: null,
    envelope: {
      stage: "INFORMATION_NEED_SELECTED", responsibilityOwner: "QUERY_NAVIGATION",
      decisionOwner: "QUERY_NAVIGATION", executor: "QUERY_NAVIGATION", provider: "NONE",
      componentId: "CURRENT_TURN_NAVIGATION", componentVersion: envelope.contractVersion,
      input: [
        { ref: envelope.sourceTurnRef, version: "USER_TURN", digest: input.sourceDigest },
        { ref: `current-turn-navigation-context:${navigation.contextDigest}`,
          version: envelope.contractVersion, digest: navigation.contextDigest },
        ...(input.retainedCandidate ? [retainedCandidateTraceReference(input.retainedCandidate)] : []),
      ],
      output: [what, { ref: selection.trace.traceId, version: selection.trace.policyVersion,
        digest: selection.trace.digest }], reasonCode: "GOVERNED_CURRENT_TURN_WHAT_SELECTED",
      completedAt: requestedAt, conversationId: input.conversationId,
      ...(binding ? { project: binding } : {}),
      ...(isDiagnostic ? { actionDecision: {
        contract: "SCIENTIFIC_TRACE_ACTION_DECISION" as const, contractVersion: "1.0.0" as const,
        declarationSource: "STRUCTURED_COMPONENT_OUTPUT" as const,
        askVsPropose: envelope.action,
        selectedInformationNeed: envelope.selectedInformationNeedRef ?? "NOT_APPLICABLE",
        whySelected: [envelope.purpose, ...selection.trace.explanations,
          `ENOUGH_FOR_REVERSIBLE_CANDIDATE=${navigation.enoughForReversibleCandidate}`,
          `HIGH_VALUE_NEXT_ACTION_AVAILABLE=${navigation.highValueNextActionAvailable}`,
          ...navigation.excludedNativeReasons.map((reason) => `NATIVE_ACTION_EXCLUSION=${reason}`),
          ...navigation.currentCandidateScopeEvidence.affected.map((scope) =>
            `CANDIDATE_REVIEW_DEPENDENCY=${JSON.stringify(scope)}`),
          ...navigation.currentCandidateScopeEvidence.unknownScopeRefs.map((ref) => `CANDIDATE_SCOPE_MATCH_UNKNOWN=${ref}`),
        ].join(";"),
        expectedInformationGain: selection.selected?.informationValue.discrimination ?? "UNKNOWN",
        alreadyProvidedInformationRefs: envelope.alreadyProvidedInformationRefs,
        // A nonselected, non-dominated candidate remains an alternative, not a rejection.
        candidateAlternatives: selection.candidates.filter((candidate) => candidate.candidateId !== selection.selected?.candidateId)
          .map((candidate) => candidate.candidateId),
        rejectedAlternatives: rejected.map((candidate) => candidate.candidateId),
        rejectionReasons,
      } } : {}),
    },
  });
  const dimension = (ref: string, status: "PRESENT" | "ABSENT", reasonCode: string): ScientificTraceSemanticDimension => ({
    dimensionId: ref, source: envelope.whatRef, status, reasonCode,
  });
  const requiredDimensions = envelope.requiredContentRefs.map((ref) => dimension(ref, "PRESENT", "REQUIRED_BY_GOVERNED_WHAT"));
  const requestedTransformation: ScientificTraceSemanticTransformation = {
    contract: "SCIENTIFIC_TRACE_SEMANTIC_TRANSFORMATION", contractVersion: "1.0.0",
    transformationSource: "STRUCTURED_COMPONENT_OUTPUT",
    inputDimensions: requiredDimensions, outputDimensions: requiredDimensions,
    retainedDimensions: requiredDimensions, transformedDimensions: [], droppedDimensions: [],
    transformationReason: "QRY_SCOPED_WHAT_NO_FULL_SOURCE_REPETITION_REQUIRED", dropReason: "NONE",
  };
  if (attempted && !exists("QUESTION_REALIZATION_REQUESTED", request)) append({
    ledger, traceRunId: input.traceRunId, timestamp: requestedAt,
    status: "REQUESTED", owner: "QUERY_NAVIGATION", durationMs: 0,
    envelope: {
      stage: "QUESTION_REALIZATION_REQUESTED", responsibilityOwner: "QUERY_NAVIGATION",
      decisionOwner: "QUERY_NAVIGATION", executor: "GEMINI_CONVERSATION_MODEL", provider: attemptedProvider,
      componentId: "GOVERNED_CONVERSATION_REALIZATION", componentVersion: envelope.contractVersion,
      input: [what], output: [request], reasonCode: "GOVERNED_WHAT_REQUEST_SENT",
      startedAt: requestedAt, completedAt: requestedAt, conversationId: input.conversationId,
      ...(binding ? { project: binding } : {}),
      ...(isDiagnostic ? { semanticTransformation: requestedTransformation } : {}),
    },
  });
  // HOW/CONFORMANCE failures: WHAT + request remain, but no canonical response was accepted.
  // Caller passes realizationOutcome to the existing ERROR_BOUNDARY recorder.
  if (failure || !governed) return { ledger, realizationOutcome };
  const realized = {
    ref: `${envelope.whatRef}:canonical-realization:${response.assistantTurn.turnId}`,
    version: envelope.contractVersion, digest: logicalDigest(response.assistantReply),
  };
  const represented = new Set(governed.conformance.representedContentRefs);
  const retained = requiredDimensions.filter((item) => represented.has(item.dimensionId));
  const missing = new Set(governed.conformance.missingRequiredContentRefs);
  const dropReason = governed.conformance.diagnostics.join(";") || "REQUIRED_REFERENCE_NOT_CLAIMED_BY_PROVIDER";
  const dropped = requiredDimensions.filter((item) => missing.has(item.dimensionId))
    .map((item) => dimension(item.dimensionId, "ABSENT", dropReason));
  // UNKNOWN coverage stays UNKNOWN: absence of a provider claim is not inferred
  // from lexical non-repetition, and claim agreement is not semantic proof.
  const outputDimensions = requiredDimensions.map((item) => represented.has(item.dimensionId) ? item
    : missing.has(item.dimensionId) ? dimension(item.dimensionId, "ABSENT", dropReason)
      : { ...item, status: "UNKNOWN", reasonCode: "STRUCTURED_COVERAGE_NOT_AVAILABLE" });
  if (!exists("QUESTION_REALIZED", realized)) append({
    ledger, traceRunId: input.traceRunId, timestamp: completedAt,
    status: "CANONICAL_RESPONSE_REALIZED", owner: "QUERY_NAVIGATION",
    durationMs: response.observability.conversationLatencyMs,
    envelope: {
      stage: "QUESTION_REALIZED", responsibilityOwner: "QUERY_NAVIGATION", decisionOwner: "QUERY_NAVIGATION",
      executor: effectiveExecutor,
      provider: governed.providerReplyAccepted && attempted ? attemptedProvider : "NONE",
      componentId: "GOVERNED_CONVERSATION_REALIZATION",
      componentVersion: response.observability.conversationModel ?? response.observability.model,
      input: [attempted ? request : what], output: [realized],
      reasonCode: "CANONICAL_RESPONSE_ACCEPTED_NOT_YET_LOCALIZED_OR_PRESENTED",
      completedAt, conversationId: input.conversationId,
      ...(binding ? { project: binding } : {}),
      ...(isDiagnostic ? { realizationOutcome, semanticTransformation: {
        ...requestedTransformation, outputDimensions, retainedDimensions: retained, droppedDimensions: dropped,
        transformationReason: "PROVIDER_STRUCTURED_CLAIMS_NOT_INDEPENDENT_SEMANTIC_PROOF",
        dropReason: dropped.length ? dropReason : "NONE",
      } } : {}),
    },
  });
  return { ledger, realizationOutcome };
};

export const recordContributionReviewPresentedTrace = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  traceRunId: string | null | undefined;
  conversationId: string;
  candidate: Readonly<ResearchProjectContributionCandidate>;
  presentedAt: string;
}): Readonly<ScientificExecutionTraceLedger> => {
  if (!hasRun(input.ledger, input.traceRunId)) return input.ledger;
  const candidate = input.candidate;
  // Remount/StrictMode acknowledgements do not create duplicate observed facts.
  if (input.ledger.events.some((event) => event.runId === input.traceRunId
    && event.common?.stage === "HUMAN_REVIEW_PRESENTED"
    && event.common.output.some((ref) => ref.ref === candidate.contributionRef
      && ref.digest === candidate.contributionDigest))) return input.ledger;
  return appendProductTraceStage({
    ledger: input.ledger,
    traceRunId: input.traceRunId!,
    timestamp: input.presentedAt,
    status: "PRESENTED_PENDING_HUMAN_DECISION",
    owner: "UI",
    durationMs: 0,
    envelope: {
      stage: "HUMAN_REVIEW_PRESENTED",
      responsibilityOwner: "RESEARCH_PROJECT",
      decisionOwner: "HUMAN",
      executor: "PROTOCOL_DESIGNER_UI",
      provider: "NONE",
      componentId: "CONTRIBUTION_REVIEW",
      componentVersion: "1.0.0",
      input: [{
        ref: candidate.changeSet.sourceContributionRef,
        version: candidate.changeSet.contractVersion,
        digest: candidate.changeSet.sourceContributionDigest,
      }],
      output: [{
        ref: candidate.contributionRef,
        version: candidate.humanReviewProjection.contractVersion,
        digest: candidate.contributionDigest,
      }],
      reasonCode: "HUMAN_CONFIRMATION_REQUIRED",
      completedAt: input.presentedAt,
      conversationId: input.conversationId,
    },
  }).ledger;
};

export const recordInitialProductTrace = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  traceRunId: string;
  conversationId: string;
  segment: Readonly<PreProjectScientificTraceSegment> | null;
  observedAt: string;
  contribution: Readonly<ScientificInterpretationContributionEnvelope> | null;
  candidate: Readonly<ResearchProjectContributionCandidate> | null;
  reviewCandidate: Readonly<ResearchProjectContributionCandidate> | null;
  retainedCandidate?: Readonly<RetainedContributionCandidate> | null;
  extractionStatus: string;
  extractionLatencyMs: number | null;
  extractionExecution: ProductTraceExtractionExecution;
}): Readonly<ScientificExecutionTraceLedger> => {
  let ledger = input.retainedCandidate ? recordRetainedContributionValidation({
    ledger: input.ledger, traceRunId: input.traceRunId, conversationId: input.conversationId,
    retainedCandidate: input.retainedCandidate, extractionExecution: input.extractionExecution,
    extractionLatencyMs: input.extractionLatencyMs,
  }) : input.ledger;
  if (input.segment) ledger = recordPreProjectScientificTraceSegment({
    ledger,
    traceRunId: input.traceRunId,
    conversationId: input.conversationId,
    segment: input.segment,
    observedAt: input.observedAt,
  }).ledger;
  const append = (event: Parameters<typeof appendProductTraceStage>[0]) => {
    ledger = appendProductTraceStage(event).ledger;
  };
  if (input.contribution && !hasExtractedContributionTrace(ledger, input.traceRunId, input.contribution)) {
    append({
      ledger,
      traceRunId: input.traceRunId,
      timestamp: input.observedAt,
      status: input.extractionStatus,
      owner: "RESEARCH_PROJECT",
      durationMs: input.extractionLatencyMs,
      envelope: {
        stage: "PROJECT_CANDIDATE_EXTRACTED",
        responsibilityOwner: "SCIENTIFIC_INTERPRETATION",
        decisionOwner: "NONE",
        executor: input.extractionExecution.executor,
        provider: input.extractionExecution.provider,
        componentId: input.extractionExecution.componentId,
        componentVersion: input.extractionExecution.componentVersion,
        input: input.segment ? [{ ref: input.segment.segmentDigest, version: input.segment.contractVersion, digest: input.segment.segmentDigest }]
          : input.contribution.source.turns.filter((turn) => turn.role === "USER")
            .map((turn) => ({ ref: turn.turnId, version: "USER_TURN", digest: logicalDigest(turn.content) })),
        output: [{
          ref: input.contribution.identity.contributionId,
          version: input.contribution.identity.contractVersion,
          digest: input.contribution.identity.contributionDigest,
        }],
        reasonCode: input.extractionStatus,
        completedAt: input.observedAt,
        conversationId: input.conversationId,
      },
    });
  }
  if (input.candidate && !(input.retainedCandidate && hasRetainedContributionValidationTrace(ledger, input.traceRunId, input.retainedCandidate))) {
    append({
      ledger,
      traceRunId: input.traceRunId,
      timestamp: input.observedAt,
      status: input.candidate.status,
      owner: "RESEARCH_PROJECT",
      durationMs: 0,
      envelope: {
        stage: "PROJECT_CANDIDATE_VALIDATED",
        responsibilityOwner: "RESEARCH_PROJECT",
        decisionOwner: "NONE",
        executor: "PRJ001_CONTRIBUTION_OWNER_BOUNDARY",
        provider: "NONE",
        componentId: "PRJ001_CONTRIBUTION_OWNER_BOUNDARY",
        componentVersion: "1.0.0",
        input: [{
          ref: input.candidate.contributionRef,
          version: input.contribution?.identity.contractVersion ?? "UNKNOWN",
          digest: input.candidate.contributionDigest,
        }],
        output: [{
          ref: input.candidate.changeSet.sourceContributionRef,
          version: input.candidate.changeSet.contractVersion,
          digest: input.candidate.changeSet.sourceContributionDigest,
        }],
        reasonCode: input.candidate.status,
        completedAt: input.observedAt,
        conversationId: input.conversationId,
      },
    });
  }
  if (input.reviewCandidate) {
    append({
      ledger,
      traceRunId: input.traceRunId,
      timestamp: input.observedAt,
      status: "PRESENTED_PENDING_HUMAN_DECISION",
      owner: "UI",
      durationMs: 0,
      envelope: {
        stage: "HUMAN_REVIEW_PRESENTED",
        responsibilityOwner: "RESEARCH_PROJECT",
        decisionOwner: "HUMAN",
        executor: "PROTOCOL_DESIGNER_UI",
        provider: "NONE",
        componentId: "CONTRIBUTION_REVIEW",
        componentVersion: "1.0.0",
        input: [{
          ref: input.reviewCandidate.changeSet.sourceContributionRef,
          version: input.reviewCandidate.changeSet.contractVersion,
          digest: input.reviewCandidate.changeSet.sourceContributionDigest,
        }],
        output: [{
          ref: input.reviewCandidate.contributionRef,
          version: input.reviewCandidate.humanReviewProjection.contractVersion,
          digest: input.reviewCandidate.contributionDigest,
        }],
        reasonCode: "HUMAN_CONFIRMATION_REQUIRED",
        completedAt: input.observedAt,
        conversationId: input.conversationId,
      },
    });
  }
  return ledger;
};

export const recordStudyDesignOptionReviewTrace = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  traceRunId: string | null | undefined;
  conversationId: string;
  recordedAt: string;
  contribution: Readonly<ScientificInterpretationContributionEnvelope>;
  candidate: Readonly<ResearchProjectContributionCandidate>;
  project: Readonly<ResearchProjectOwnerProjection>;
  proposalRef: string;
  proposalDigest: string;
  optionRef: string;
  responsibilityOwner?: "STUDY_DESIGN" | "SCIENTIFIC_THINKING" | "OBSERVABILITY_MEASUREMENT" | "IMAGING" | "BIOSTATISTICS";
}): Readonly<ScientificExecutionTraceLedger> => {
  if (!hasRun(input.ledger, input.traceRunId)) return input.ledger;
  const traceRunId = input.traceRunId!;
  const binding = projectBinding(input.project);
  const responsibilityOwner = input.responsibilityOwner ?? "STUDY_DESIGN";
  const componentPrefix = responsibilityOwner === "SCIENTIFIC_THINKING"
    ? "STANDARD_SCIENTIFIC_THINKING"
    : responsibilityOwner === "OBSERVABILITY_MEASUREMENT"
      ? "STANDARD_OBSERVABILITY"
    : responsibilityOwner === "IMAGING"
      ? "STANDARD_IMAGING"
      : responsibilityOwner === "BIOSTATISTICS"
        ? "STANDARD_BIOSTATISTICS"
      : "STANDARD_STUDY_DESIGN";
  let ledger = appendProductTraceStage({
    ledger: input.ledger,
    traceRunId,
    timestamp: input.recordedAt,
    status: "OPTION_SELECTED_PENDING_REVIEW",
    owner: "UI",
    durationMs: 0,
    envelope: {
      stage: "UI_PROJECTION",
      responsibilityOwner,
      decisionOwner: "HUMAN",
      executor: `${componentPrefix}_PRESENTATION`,
      provider: "NONE",
      componentId: `${componentPrefix}_PRESENTATION`,
      componentVersion: input.contribution.identity.runtimeVersion,
      input: [{ ref: input.proposalRef, version: "1.0.0", digest: input.proposalDigest }],
      output: [{ ref: input.optionRef, version: "1.0.0", digest: logicalDigest({ proposal: input.proposalDigest, option: input.optionRef }) }],
      reasonCode: "USER_SELECTED_OPTION_WITHOUT_PROJECT_WRITE",
      completedAt: input.recordedAt,
      conversationId: input.conversationId,
      project: binding,
    },
  }).ledger;
  ledger = appendProductTraceStage({
    ledger,
    traceRunId,
    timestamp: input.recordedAt,
    status: "CANDIDATE",
    owner: responsibilityOwner,
    durationMs: 0,
    envelope: {
      stage: "PROJECT_CANDIDATE_EXTRACTED",
      responsibilityOwner,
      decisionOwner: "NONE",
      executor: `${componentPrefix}_CONTRIBUTION_ADAPTER`,
      provider: "NONE",
      componentId: `${componentPrefix}_CONTRIBUTION_ADAPTER`,
      componentVersion: input.contribution.identity.runtimeVersion,
      input: [
        { ref: input.proposalRef, version: "1.0.0", digest: input.proposalDigest },
        { ref: input.optionRef, version: "1.0.0", digest: logicalDigest({ proposal: input.proposalDigest, option: input.optionRef }) },
      ],
      output: [{
        ref: input.contribution.identity.contributionId,
        version: input.contribution.identity.contractVersion,
        digest: input.contribution.identity.contributionDigest,
      }],
      reasonCode: "OWNER_OPTION_SELECTED_PENDING_HUMAN_REVIEW",
      completedAt: input.recordedAt,
      conversationId: input.conversationId,
      project: binding,
    },
  }).ledger;
  ledger = appendProductTraceStage({
    ledger,
    traceRunId,
    timestamp: input.recordedAt,
    status: input.candidate.status,
    owner: "RESEARCH_PROJECT",
    durationMs: 0,
    envelope: {
      stage: "PROJECT_CANDIDATE_VALIDATED",
      responsibilityOwner: "RESEARCH_PROJECT",
      decisionOwner: "NONE",
      executor: "PRJ001_CONTRIBUTION_OWNER_BOUNDARY",
      provider: "NONE",
      componentId: "PRJ001_CONTRIBUTION_OWNER_BOUNDARY",
      componentVersion: "1.0.0",
      input: [{
        ref: input.contribution.identity.contributionId,
        version: input.contribution.identity.contractVersion,
        digest: input.contribution.identity.contributionDigest,
      }],
      output: [{
        ref: input.candidate.changeSet.sourceContributionRef,
        version: input.candidate.changeSet.contractVersion,
        digest: input.candidate.changeSet.sourceContributionDigest,
      }],
      reasonCode: input.candidate.status,
      completedAt: input.recordedAt,
      conversationId: input.conversationId,
      project: binding,
    },
  }).ledger;
  return appendProductTraceStage({
    ledger,
    traceRunId,
    timestamp: input.recordedAt,
    status: "PRESENTED_PENDING_HUMAN_DECISION",
    owner: "UI",
    durationMs: 0,
    envelope: {
      stage: "HUMAN_REVIEW_PRESENTED",
      responsibilityOwner: "RESEARCH_PROJECT",
      decisionOwner: "HUMAN",
      executor: "PROTOCOL_DESIGNER_UI",
      provider: "NONE",
      componentId: "CONTRIBUTION_REVIEW",
      componentVersion: input.candidate.humanReviewProjection.contractVersion,
      input: [{
        ref: input.candidate.changeSet.sourceContributionRef,
        version: input.candidate.changeSet.contractVersion,
        digest: input.candidate.changeSet.sourceContributionDigest,
      }],
      output: [{
        ref: input.candidate.contributionRef,
        version: input.candidate.humanReviewProjection.contractVersion,
        digest: input.candidate.contributionDigest,
      }],
      reasonCode: "HUMAN_CONFIRMATION_REQUIRED",
      completedAt: input.recordedAt,
      conversationId: input.conversationId,
      project: binding,
    },
  }).ledger;
};

export const recordStudyDesignConversationTrace = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  traceRunId: string | null | undefined;
  conversationId: string;
  recordedAt: string;
  project: Readonly<ResearchProjectOwnerProjection>;
  proposalRef: string;
  proposalDigest: string;
  turnRef: string;
  status: "DISCUSSION" | "DEFERRED" | "OPTIONS_REJECTED";
  responsibilityOwner?: "STUDY_DESIGN" | "SCIENTIFIC_THINKING" | "OBSERVABILITY_MEASUREMENT" | "IMAGING" | "BIOSTATISTICS";
}): Readonly<ScientificExecutionTraceLedger> => !hasRun(input.ledger, input.traceRunId)
  ? input.ledger
  : appendProductTraceStage({
    ledger: input.ledger,
    traceRunId: input.traceRunId!,
    timestamp: input.recordedAt,
    status: input.status,
    owner: "UI",
    durationMs: 0,
    envelope: {
      stage: "UI_PROJECTION",
      responsibilityOwner: input.responsibilityOwner ?? "STUDY_DESIGN",
      decisionOwner: "NONE",
      executor: input.responsibilityOwner === "SCIENTIFIC_THINKING"
        ? "STANDARD_SCIENTIFIC_THINKING_CONVERSATION"
        : input.responsibilityOwner === "OBSERVABILITY_MEASUREMENT"
          ? "STANDARD_OBSERVABILITY_CONVERSATION"
          : input.responsibilityOwner === "IMAGING"
            ? "STANDARD_IMAGING_CONVERSATION"
          : input.responsibilityOwner === "BIOSTATISTICS"
            ? "STANDARD_BIOSTATISTICS_CONVERSATION"
          : "STANDARD_STUDY_DESIGN_CONVERSATION",
      provider: "NONE",
      componentId: input.responsibilityOwner === "SCIENTIFIC_THINKING"
        ? "STANDARD_SCIENTIFIC_THINKING_PRESENTATION"
        : input.responsibilityOwner === "OBSERVABILITY_MEASUREMENT"
          ? "STANDARD_OBSERVABILITY_PRESENTATION"
          : input.responsibilityOwner === "IMAGING"
            ? "STANDARD_IMAGING_PRESENTATION"
          : input.responsibilityOwner === "BIOSTATISTICS"
            ? "STANDARD_BIOSTATISTICS_PRESENTATION"
          : "STANDARD_STUDY_DESIGN_PRESENTATION",
      componentVersion: "1.0.0",
      input: [{ ref: input.proposalRef, version: "1.0.0", digest: input.proposalDigest }],
      output: [{ ref: input.turnRef, version: "NOT_APPLICABLE", digest: logicalDigest({ turn: input.turnRef, status: input.status }) }],
      reasonCode: input.status === "DISCUSSION"
        ? "PROPOSAL_DISCUSSION_WITHOUT_ADOPTION"
        : input.status === "DEFERRED"
          ? "PROPOSAL_DEFERRED_WITHOUT_ADOPTION"
          : "ALL_OPTIONS_REJECTED_WITHOUT_PROJECT_WRITE",
      completedAt: input.recordedAt,
      conversationId: input.conversationId,
      project: projectBinding(input.project),
    },
  }).ledger;

const recordHumanDecision = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  traceRunId: string;
  conversationId: string;
  recordedAt: string;
  decision: Readonly<HumanDecisionEnvelope>;
  source: { ref: string; version: string; digest: string };
  project?: Readonly<ResearchProjectOwnerProjection> | null;
  executor: string;
}): Readonly<ScientificExecutionTraceLedger> => appendProductTraceStage({
  ledger: input.ledger,
  traceRunId: input.traceRunId,
  timestamp: input.recordedAt,
  status: input.decision.status,
  owner: "HUMAN",
  durationMs: 0,
  envelope: {
    stage: "HUMAN_DECISION_RECORDED",
    responsibilityOwner: "HUMAN",
    decisionOwner: input.decision.actor ?? "UNKNOWN",
    executor: input.executor,
    provider: "NONE",
    componentId: "HUMAN_DECISION_ENVELOPE",
    componentVersion: input.decision.envelopeVersion,
    input: [input.source],
    output: [{ ref: input.decision.decisionId, version: String(input.decision.version), digest: "UNKNOWN" }],
    reasonCode: input.decision.reason ?? input.decision.status,
    completedAt: input.recordedAt,
    conversationId: input.conversationId,
    ...(input.project ? { project: projectBinding(input.project) } : {}),
  },
}).ledger;

export const recordProjectAdoptionTrace = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  traceRunId: string | null | undefined;
  conversationId: string;
  recordedAt: string;
  contribution: Readonly<ScientificInterpretationContributionEnvelope>;
  project: Readonly<ResearchProjectOwnerProjection>;
  previousProjectExisted: boolean;
  queryNavigation: Readonly<FunctionalResetQueryNavigation>;
  documents: Readonly<FunctionalResetDocumentPortfolio>;
}): Readonly<ScientificExecutionTraceLedger> => {
  if (!hasRun(input.ledger, input.traceRunId)) return input.ledger;
  const traceRunId = input.traceRunId!;
  const binding = projectBinding(input.project);
  let ledger = recordHumanDecision({
    ledger: input.ledger,
    traceRunId,
    conversationId: input.conversationId,
    recordedAt: input.recordedAt,
    decision: input.project.confirmationDecision,
    source: {
      ref: input.contribution.identity.contributionId,
      version: input.contribution.identity.contractVersion,
      digest: input.contribution.identity.contributionDigest,
    },
    project: input.project,
    executor: "RESEARCH_PROJECT_OWNER_BOUNDARY",
  });
  ledger = appendProductTraceStage({
    ledger,
    traceRunId,
    timestamp: input.recordedAt,
    status: "CREATED",
    owner: "RESEARCH_PROJECT",
    durationMs: 0,
    envelope: {
      stage: input.previousProjectExisted ? "PROJECT_VERSION_REVISED" : "PROJECT_VERSION_CREATED",
      responsibilityOwner: "RESEARCH_PROJECT",
      decisionOwner: input.project.confirmationDecision.actor ?? "UNKNOWN",
      executor: "PRJ001_CONTRIBUTION_OWNER_BOUNDARY",
      provider: "NONE",
      componentId: "RESEARCH_PROJECT_CONSTRUCTION_OWNER_PROJECTION",
      componentVersion: input.project.contractVersion,
      input: [{
        ref: input.project.confirmationDecision.decisionId,
        version: String(input.project.confirmationDecision.version),
        digest: "UNKNOWN",
      }],
      output: [{ ref: input.project.projectId, version: input.project.versionId, digest: input.project.projectDigest }],
      reasonCode: input.previousProjectExisted ? "HUMAN_ADOPTED_PROJECT_REVISION" : "HUMAN_ADOPTED_PROJECT_CREATION",
      completedAt: input.recordedAt,
      conversationId: input.conversationId,
      project: binding,
    },
  }).ledger;
  if (input.queryNavigation.currentAction) {
    const action = input.queryNavigation.currentAction;
    ledger = appendProductTraceStage({
      ledger,
      traceRunId,
      timestamp: input.recordedAt,
      status: input.queryNavigation.status,
      owner: "QUERY_NAVIGATION",
      durationMs: 0,
      envelope: {
        stage: "QRY_ACTION_SELECTED",
        responsibilityOwner: "QUERY_NAVIGATION",
        decisionOwner: "QUERY_NAVIGATION",
        executor: "QUERY_NAVIGATION",
        provider: "NONE",
        componentId: "QRY001_FUNCTIONAL_RESET_PROGRESSION",
        componentVersion: input.queryNavigation.contractVersion,
        input: [{ ref: input.project.projectId, version: input.project.versionId, digest: input.project.projectDigest }],
        output: [{ ref: action.selectedActionId, version: action.lifecycleVersion, digest: action.sourceStateDigest }],
        reasonCode: action.reason,
        completedAt: input.recordedAt,
        conversationId: input.conversationId,
        project: binding,
      },
    }).ledger;
  }
  const staleProjection = input.documents.projections.at(-1);
  if (staleProjection && (staleProjection.source.projectVersion !== input.project.versionId
    || staleProjection.source.projectDigest !== input.project.projectDigest)) {
    ledger = appendProductTraceStage({
      ledger,
      traceRunId,
      timestamp: input.recordedAt,
      status: "STALE",
      owner: "DOC",
      durationMs: 0,
      envelope: {
        stage: "STALE_MARKED",
        responsibilityOwner: "DOC-001",
        decisionOwner: "NOT_APPLICABLE",
        executor: "FUNCTIONAL_RESET_DOCUMENT_BOUNDARY",
        provider: "NONE",
        componentId: "DOC-001",
        componentVersion: staleProjection.contractVersion,
        input: [{ ref: staleProjection.projectionId, version: staleProjection.projectionVersion, digest: staleProjection.projectionDigest }],
        output: [{ ref: input.project.projectId, version: input.project.versionId, digest: input.project.projectDigest }],
        reasonCode: "SOURCE_PROJECT_VERSION_CHANGED",
        completedAt: input.recordedAt,
        conversationId: input.conversationId,
        project: binding,
        documentProjectionId: staleProjection.projectionId,
      },
    }).ledger;
  }
  return ledger;
};

export const recordContributionRejectionTrace = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  traceRunId: string | null | undefined;
  conversationId: string;
  recordedAt: string;
  contribution: Readonly<ScientificInterpretationContributionEnvelope>;
  decision: Readonly<HumanDecisionEnvelope>;
  project: Readonly<ResearchProjectOwnerProjection> | null;
}): Readonly<ScientificExecutionTraceLedger> => !hasRun(input.ledger, input.traceRunId)
  ? input.ledger
  : recordHumanDecision({
    ledger: input.ledger,
    traceRunId: input.traceRunId!,
    conversationId: input.conversationId,
    recordedAt: input.recordedAt,
    decision: input.decision,
    source: {
      ref: input.contribution.identity.contributionId,
      version: input.contribution.identity.contractVersion,
      digest: input.contribution.identity.contributionDigest,
    },
    project: input.project,
    executor: "RESEARCH_PROJECT_OWNER_BOUNDARY",
  });

export const recordPostAdoptionQuestionTrace = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  traceRunId: string | null | undefined;
  conversationId: string;
  observedAt: string;
  project: Readonly<ResearchProjectOwnerProjection>;
  queryNavigation: Readonly<FunctionalResetQueryNavigation>;
  continuation: {
    turnId: string;
    provider: string;
    model: string;
    latencyMs: number;
    presentationSource: string;
  };
}): Readonly<ScientificExecutionTraceLedger> => {
  if (!hasRun(input.ledger, input.traceRunId)
    || !input.queryNavigation.currentAction
    || !input.queryNavigation.currentPresentation) return input.ledger;
  const traceRunId = input.traceRunId!;
  const action = input.queryNavigation.currentAction;
  const presentation = input.queryNavigation.currentPresentation;
  const binding = projectBinding(input.project);
  let ledger = appendProductTraceStage({
    ledger: input.ledger,
    traceRunId,
    timestamp: input.observedAt,
    status: "REQUESTED",
    owner: "QUERY_NAVIGATION",
    durationMs: 0,
    envelope: {
      stage: "QUESTION_REALIZATION_REQUESTED",
      responsibilityOwner: "QUERY_NAVIGATION",
      decisionOwner: "QUERY_NAVIGATION",
      executor: input.continuation.provider === "NONE" ? "DETERMINISTIC_FALLBACK" : "CONVERSATION_MODEL",
      provider: input.continuation.provider,
      componentId: "POST_ADOPTION_QRY_CONTINUATION",
      componentVersion: input.continuation.model || "UNKNOWN",
      input: [{ ref: action.selectedActionId, version: action.lifecycleVersion, digest: action.sourceStateDigest }],
      output: [{ ref: presentation.presentationId, version: "1.0.0", digest: input.queryNavigation.sourceStateDigest }],
      reasonCode: "QRY_OWNS_WHAT",
      completedAt: input.observedAt,
      conversationId: input.conversationId,
      project: binding,
    },
  }).ledger;
  ledger = appendProductTraceStage({
    ledger,
    traceRunId,
    timestamp: input.observedAt,
    status: "REALIZED",
    owner: "CONVERSATION_MODEL",
    durationMs: input.continuation.latencyMs,
    envelope: {
      stage: "QUESTION_REALIZED",
      responsibilityOwner: "QUERY_NAVIGATION",
      decisionOwner: "QUERY_NAVIGATION",
      executor: input.continuation.provider === "NONE" ? "DETERMINISTIC_FALLBACK" : "CONVERSATION_MODEL",
      provider: input.continuation.provider,
      componentId: "POST_ADOPTION_QRY_CONTINUATION",
      componentVersion: input.continuation.model || "UNKNOWN",
      input: [{ ref: presentation.presentationId, version: "1.0.0", digest: input.queryNavigation.sourceStateDigest }],
      output: [{ ref: input.continuation.turnId, version: "NOT_APPLICABLE", digest: "UNKNOWN" }],
      reasonCode: input.continuation.presentationSource,
      completedAt: input.observedAt,
      conversationId: input.conversationId,
      project: binding,
    },
  }).ledger;
  return ledger;
};

export const recordDocumentProjectionTrace = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  traceRunId: string | null | undefined;
  conversationId: string;
  recordedAt: string;
  project: Readonly<ResearchProjectOwnerProjection>;
  decision: Readonly<HumanDecisionEnvelope>;
  projection: Readonly<DocumentProjection>;
  projectionMode: "STANDARD" | "EXPERT";
}): Readonly<ScientificExecutionTraceLedger> => {
  if (!hasRun(input.ledger, input.traceRunId)) return input.ledger;
  const traceRunId = input.traceRunId!;
  const binding = projectBinding(input.project);
  let ledger = recordHumanDecision({
    ledger: input.ledger,
    traceRunId,
    conversationId: input.conversationId,
    recordedAt: input.recordedAt,
    decision: input.decision,
    source: { ref: input.project.projectId, version: input.project.versionId, digest: input.project.projectDigest },
    project: input.project,
    executor: "RESEARCH_PROJECT_DOCUMENT_HANDOFF",
  });
  const append = (event: Parameters<typeof appendProductTraceStage>[0]) => {
    ledger = appendProductTraceStage(event).ledger;
  };
  if (input.projection.source.template) {
    const template = input.projection.source.template;
    append({
      ledger,
      traceRunId,
      timestamp: input.recordedAt,
      status: "PROJECTED",
      owner: "TMP",
      durationMs: 0,
      envelope: {
        stage: "TMP_PROJECTION",
        responsibilityOwner: "TMP-001",
        decisionOwner: input.decision.actor ?? "UNKNOWN",
        executor: "TEMPLATE_PROJECTION_ENGINE",
        provider: "NONE",
        componentId: template.templateId,
        componentVersion: template.templateVersion,
        input: [{ ref: input.project.projectId, version: input.project.versionId, digest: input.project.projectDigest }],
        output: [{ ref: template.templateInstanceId, version: String(template.templateRevision), digest: template.templateInstanceDigest }],
        reasonCode: input.projection.documentDefinition?.status ?? "TEMPLATE_INSTANCE_PROJECTED",
        completedAt: input.recordedAt,
        conversationId: input.conversationId,
        project: binding,
      },
    });
  }
  append({
    ledger,
    traceRunId,
    timestamp: input.recordedAt,
    status: input.projection.readiness,
    owner: "DOC",
    durationMs: 0,
    envelope: {
      stage: "DOC_PROJECTION",
      responsibilityOwner: "DOC-001",
      decisionOwner: input.decision.actor ?? "UNKNOWN",
      executor: "DOCUMENT_PROJECTION_ENGINE",
      provider: "NONE",
      componentId: "DOC-001",
      componentVersion: input.projection.contractVersion,
      input: input.projection.source.template ? [{
        ref: input.projection.source.template.templateInstanceId,
        version: String(input.projection.source.template.templateRevision),
        digest: input.projection.source.template.templateInstanceDigest,
      }] : [{ ref: input.project.projectId, version: input.project.versionId, digest: input.project.projectDigest }],
      output: [{ ref: input.projection.projectionId, version: input.projection.projectionVersion, digest: input.projection.projectionDigest }],
      reasonCode: input.projection.lifecycle,
      completedAt: input.recordedAt,
      conversationId: input.conversationId,
      project: binding,
      documentProjectionId: input.projection.projectionId,
    },
  });
  if (input.projection.priorProjectionId) {
    append({
      ledger,
      traceRunId,
      timestamp: input.recordedAt,
      status: "RECORDED",
      owner: "DOC",
      durationMs: 0,
      envelope: {
        stage: "SUPERSESSION_RECORDED",
        responsibilityOwner: "DOC-001",
        decisionOwner: "NOT_APPLICABLE",
        executor: "DOCUMENT_PROJECTION_ENGINE",
        provider: "NONE",
        componentId: "DOC-001",
        componentVersion: input.projection.contractVersion,
        input: [{ ref: input.projection.priorProjectionId, version: "UNKNOWN", digest: "UNKNOWN" }],
        output: [{ ref: input.projection.projectionId, version: input.projection.projectionVersion, digest: input.projection.projectionDigest }],
        reasonCode: "PRIOR_PROJECTION_SUPERSEDED",
        completedAt: input.recordedAt,
        conversationId: input.conversationId,
        project: binding,
        documentProjectionId: input.projection.projectionId,
      },
    });
  }
  append({
    ledger,
    traceRunId,
    timestamp: input.recordedAt,
    status: "VISIBLE",
    owner: "UI",
    durationMs: 0,
    envelope: {
      stage: "UI_PROJECTION",
      responsibilityOwner: "UI",
      decisionOwner: "NOT_APPLICABLE",
      executor: "PROTOCOL_PREVIEW",
      provider: "NONE",
      componentId: "PROTOCOL_PREVIEW",
      componentVersion: "1.0.0",
      input: [{ ref: input.projection.projectionId, version: input.projection.projectionVersion, digest: input.projection.projectionDigest }],
      output: [{ ref: `ui-projection:${input.projection.projectionId}`, version: "1.0.0", digest: input.projection.projectionDigest }],
      reasonCode: input.projectionMode,
      completedAt: input.recordedAt,
      conversationId: input.conversationId,
      project: binding,
      documentProjectionId: input.projection.projectionId,
    },
  });
  return ledger;
};

export const recordArtifactGeneratedTrace = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  traceRunId: string | null | undefined;
  conversationId: string;
  generatedAt: string;
  projection: Readonly<DocumentProjection>;
  format: "HTML";
}): Readonly<ScientificExecutionTraceLedger> => {
  if (!hasRun(input.ledger, input.traceRunId)) return input.ledger;
  const artifactId = `artifact:${input.projection.projectionId}:${input.format}:${input.generatedAt}`;
  const binding: ScientificRunProjectBinding = {
    projectId: input.projection.source.projectId,
    projectVersion: input.projection.source.projectVersion,
    projectDigest: input.projection.source.projectDigest,
    snapshotRef: input.projection.source.projectDigest,
  };
  return appendProductTraceStage({
    ledger: input.ledger,
    traceRunId: input.traceRunId!,
    timestamp: input.generatedAt,
    status: "GENERATED",
    owner: "ARTIFACT",
    durationMs: 0,
    envelope: {
      stage: "ARTIFACT_GENERATED",
      responsibilityOwner: "DOC-001",
      decisionOwner: "USER",
      executor: "DOCUMENT_PROJECTION_HTML_EXPORT",
      provider: "NONE",
      componentId: "FUNCTIONAL_PROTOCOL_HTML_EXPORT",
      componentVersion: input.projection.contractVersion,
      input: [{ ref: input.projection.projectionId, version: input.projection.projectionVersion, digest: input.projection.projectionDigest }],
      output: [{ ref: artifactId, version: input.format, digest: input.projection.projectionDigest }],
      reasonCode: "EXPLICIT_HTML_EXPORT_COMPLETED",
      completedAt: input.generatedAt,
      conversationId: input.conversationId,
      project: binding,
      documentProjectionId: input.projection.projectionId,
      artifactId,
    },
  }).ledger;
};

export const recordProductErrorBoundary = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  traceRunId: string;
  turnId: string;
  conversationId: string;
  startedAt: string;
  failedAt: string;
  owner: ScientificTraceOwner;
  responsibilityOwner: string;
  executor: string;
  componentId: string;
  componentVersion: string;
  provider: string;
  code: string;
  category: ScientificTraceError["category"];
  sourceDigest?: string;
  project?: Readonly<ResearchProjectOwnerProjection> | null;
  retainedCandidate?: Readonly<RetainedContributionCandidate> | null;
  realizationOutcome?: ScientificTraceRealizationOutcome;
}): Readonly<ScientificExecutionTraceLedger> => {
  let ledger = input.ledger;
  if (!hasRun(ledger, input.traceRunId)) {
    ledger = startProductTraceRun({
      ledger,
      traceRunId: input.traceRunId,
      turnId: input.turnId,
      conversationId: input.conversationId,
      startedAt: input.startedAt,
      sourceDigest: input.sourceDigest ?? "UNKNOWN",
    }).ledger;
  }
  if (input.retainedCandidate) ledger = recordRetainedContributionValidation({
    ledger, traceRunId: input.traceRunId, conversationId: input.conversationId,
    retainedCandidate: input.retainedCandidate,
  });
  return appendProductTraceStage({
    ledger,
    traceRunId: input.traceRunId,
    timestamp: input.failedAt,
    status: "FAILED",
    owner: input.owner,
    durationMs: null,
    error: { category: input.category, code: input.code },
    envelope: {
      stage: "ERROR_BOUNDARY",
      responsibilityOwner: input.responsibilityOwner,
      decisionOwner: "NOT_APPLICABLE",
      executor: input.executor,
      provider: input.provider,
      componentId: input.componentId,
      componentVersion: input.componentVersion,
      ...(input.project ? {
        input: [{ ref: input.project.projectId, version: input.project.versionId, digest: input.project.projectDigest }],
        project: projectBinding(input.project),
      } : {}),
      ...(input.retainedCandidate ? {
        output: [retainedCandidateTraceReference(input.retainedCandidate)],
      } : {}),
      ...(input.realizationOutcome && ledger.runBindings.find((binding) => binding.runId === input.traceRunId)
        ?.captureConfiguration?.captureLevel !== "LEVEL_1_CORE" ? { realizationOutcome: input.realizationOutcome } : {}),
      reasonCode: input.code,
      completedAt: input.failedAt,
      conversationId: input.conversationId,
    },
  }).ledger;
};
