import type { ScientificInterpretationContributionEnvelope } from "@/features/scientific-interpretation/contracts";
import type { DocumentProjection, FunctionalResetDocumentPortfolio } from "@/features/document-projection";
import type { FunctionalResetQueryNavigation } from "@/features/query-navigation";
import type {
  ResearchProjectContributionCandidate,
  ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import type { HumanDecisionEnvelope } from "@/features/protocol-designer/human-decision";
import {
  appendProductTraceStage,
  recordPreProjectScientificTraceSegment,
  startProductTraceRun,
  type PreProjectScientificTraceSegment,
  type ScientificExecutionTraceLedger,
  type ScientificRunProjectBinding,
  type ScientificTraceError,
  type ScientificTraceOwner,
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

export const recordInitialProductTrace = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  traceRunId: string;
  conversationId: string;
  segment: Readonly<PreProjectScientificTraceSegment>;
  observedAt: string;
  contribution: Readonly<ScientificInterpretationContributionEnvelope> | null;
  candidate: Readonly<ResearchProjectContributionCandidate> | null;
  reviewCandidate: Readonly<ResearchProjectContributionCandidate> | null;
  extractionStatus: string;
  extractionLatencyMs: number | null;
  provider: string;
}): Readonly<ScientificExecutionTraceLedger> => {
  let ledger = recordPreProjectScientificTraceSegment({
    ledger: input.ledger,
    traceRunId: input.traceRunId,
    conversationId: input.conversationId,
    segment: input.segment,
    observedAt: input.observedAt,
  }).ledger;
  const append = (event: Parameters<typeof appendProductTraceStage>[0]) => {
    ledger = appendProductTraceStage(event).ledger;
  };
  if (input.contribution) {
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
        executor: input.provider,
        provider: input.provider,
        componentId: "PERSISTENT_PROJECT_EXTRACTION",
        componentVersion: input.contribution.identity.runtimeVersion,
        input: [{ ref: input.segment.segmentDigest, version: input.segment.contractVersion, digest: input.segment.segmentDigest }],
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
  if (input.candidate) {
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
      reasonCode: input.code,
      completedAt: input.failedAt,
      conversationId: input.conversationId,
    },
  }).ledger;
};
