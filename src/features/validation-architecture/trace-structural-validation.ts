import {
  getScientificRun,
  listEndToEndTraceEvents,
  listScientificRunEvents,
  type ScientificExecutionTraceLedger,
  type ScientificProductTraceCommonEnvelope,
  type ScientificProductTraceStage,
  type ScientificTraceCaptureLevel,
  type ScientificTraceForensicPayload,
} from "@/features/protocol-designer/scientific-execution-trace";
import { stableValidationStringify, validationDigest, validationUniqueSorted } from "./canonical";

export const TRACE_STRUCTURAL_VALIDATOR_ID = "VAL-TRACE-STRUCTURAL-001" as const;
export const TRACE_STRUCTURAL_VALIDATOR_VERSION = "1.0.0" as const;
export const TRACE_STRUCTURAL_DIAGNOSTIC_OWNER = "VAL" as const;

export const TRACE_STRUCTURAL_RULES = Object.freeze({
  UNEXPLAINED_DIMENSION_LOSS: "VAL-TRACE-R01",
  ALREADY_PROVIDED_INFORMATION_REASKED: "VAL-TRACE-R02",
  DECISION_OWNER_EXECUTOR_COLLAPSE: "VAL-TRACE-R03",
  MISSING_DECISION_OWNER: "VAL-TRACE-R04",
  MISSING_TRANSFORMATION_REASON: "VAL-TRACE-R05",
  TRACE_CHAIN_BREAK: "VAL-TRACE-R06",
  VERSION_OR_DIGEST_DISCONTINUITY: "VAL-TRACE-R07",
  DECISION_OWNERSHIP_MISMATCH: "VAL-TRACE-R08",
} as const);

export type TraceStructuralDiagnosticCode = keyof typeof TRACE_STRUCTURAL_RULES;
export type TraceStructuralDiagnosticStatus = "WARNING" | "NOT_EVALUABLE";

export type TraceStructuralDiagnostic = Readonly<{
  diagnosticId: string;
  ruleId: (typeof TRACE_STRUCTURAL_RULES)[TraceStructuralDiagnosticCode];
  code: TraceStructuralDiagnosticCode;
  evidenceEventIds: readonly string[];
  status: TraceStructuralDiagnosticStatus;
  explanation: string;
  expectedOwner: string | null;
  observedOwner: string | null;
  automaticCorrectionAllowed: false;
  scientificJudgmentPerformed: false;
}>;

export type TraceOwnerFacts = Readonly<{
  askVsProposeOwner: string;
  whatToAskOwner: string;
  questionFormulationOwner: string;
  qryWhatLlmHowContract: "RESPECTED" | "VIOLATED" | "NOT_APPLICABLE" | "UNKNOWN";
}>;

export type TraceForensicFieldProjection = Readonly<{
  field: ScientificTraceForensicPayload["fields"][number]["field"] | "NONE";
  source: string;
  classification: "NON_SENSITIVE" | "REDACTED" | "NOT_CAPTURED" | "EXPIRED_BY_RETENTION";
  value: string | null;
}>;

export type TraceInspectorEventProjection = Readonly<{
  eventId: string;
  sequence: number;
  stage: ScientificProductTraceStage;
  responsibilityOwner: string;
  decisionOwner: string;
  executor: string;
  provider: string;
  component: Readonly<{ componentId: string; componentVersion: string }>;
  inputRefs: readonly Readonly<{ ref: string; version: string; digest: string }>[];
  outputRefs: readonly Readonly<{ ref: string; version: string; digest: string }>[];
  status: string;
  reasonCode: string;
  durationMs: number | null;
  upstreamEventId: string;
  dependencies: readonly string[];
  semanticTransformation: ScientificProductTraceCommonEnvelope["semanticTransformation"] | null;
  actionDecision: ScientificProductTraceCommonEnvelope["actionDecision"] | null;
  realizationOutcome: ScientificProductTraceCommonEnvelope["realizationOutcome"] | null;
  attemptedProvider: string | null;
  providerResponseReceived: boolean | null;
  providerResponseAccepted: boolean | null;
  providerRejectionReason: string | null;
  fallbackReason: string | null;
  forensic: readonly TraceForensicFieldProjection[];
}>;

export type TraceInspectorRunProjection = Readonly<{
  traceRunId: string;
  captureLevel: ScientificTraceCaptureLevel;
  captureReason: string;
  replayOfTraceRunId: string;
  status: string;
  turnCount: number;
  eventCount: number;
  durationMs: number;
  projectId: string;
  projectVersion: string;
  projectDigest: string;
  events: readonly TraceInspectorEventProjection[];
  diagnostics: readonly TraceStructuralDiagnostic[];
  firstUnexplainedDivergenceStage: ScientificProductTraceStage | null;
  firstUnexplainedDivergenceEventId: string | null;
  ownerFacts: TraceOwnerFacts;
  inspectorMutatesProduct: false;
  inspectorCallsProvider: false;
  inspectorCreatesDecision: false;
  inspectorRepairs: false;
  inspectorJudgesScience: false;
}>;

export type TraceInspectorRunComparison = Readonly<{
  leftTraceRunId: string;
  rightTraceRunId: string;
  comparedStageCount: number;
  productEnvelopeEquivalent: boolean;
  diagnosticDetailEquivalent: boolean;
  differences: readonly Readonly<{
    stage: ScientificProductTraceStage | "EVENT_PRESENCE";
    fields: readonly string[];
    leftEventId: string | null;
    rightEventId: string | null;
  }>[];
  scientificDivergenceClaimed: false;
}>;

export type TraceRunLineageEntry = Readonly<{
  traceRunId: string;
  captureLevel: ScientificTraceCaptureLevel;
  captureReason: string;
  replayOfTraceRunId: string;
}>;

const SENTINELS = new Set(["NONE", "UNKNOWN", "NOT_APPLICABLE", ""]);
const isMissing = (value: string | null | undefined) => value == null || SENTINELS.has(value);
const isReasonMissing = (value: string | null | undefined) => isMissing(value) || value === "NOT_AVAILABLE" || value === "NOT_EXPOSED_BY_CURRENT_RUNTIME";

const diagnostic = (input: {
  code: TraceStructuralDiagnosticCode;
  evidenceEventIds: readonly string[];
  explanation: string;
  status?: TraceStructuralDiagnosticStatus;
  expectedOwner?: string | null;
  observedOwner?: string | null;
}): TraceStructuralDiagnostic => {
  const material = {
    validatorId: TRACE_STRUCTURAL_VALIDATOR_ID,
    validatorVersion: TRACE_STRUCTURAL_VALIDATOR_VERSION,
    ruleId: TRACE_STRUCTURAL_RULES[input.code],
    code: input.code,
    evidenceEventIds: validationUniqueSorted(input.evidenceEventIds),
    explanation: input.explanation,
    expectedOwner: input.expectedOwner ?? null,
    observedOwner: input.observedOwner ?? null,
  };
  return Object.freeze({
    diagnosticId: `VAL-TRACE-D-${validationDigest(material).slice(5)}`,
    ruleId: material.ruleId,
    code: input.code,
    evidenceEventIds: material.evidenceEventIds,
    status: input.status ?? "WARNING",
    explanation: input.explanation,
    expectedOwner: material.expectedOwner,
    observedOwner: material.observedOwner,
    automaticCorrectionAllowed: false,
    scientificJudgmentPerformed: false,
  });
};

const captureLevelFor = (ledger: Readonly<ScientificExecutionTraceLedger>, runId: string): ScientificTraceCaptureLevel =>
  ledger.runBindings.find((binding) => binding.runId === runId)?.captureConfiguration?.captureLevel ?? "LEVEL_1_CORE";

const eventPairs = (ledger: Readonly<ScientificExecutionTraceLedger>, runId: string) => {
  const nativeEvents = listScientificRunEvents({ ledger, runId });
  const commonEvents = listEndToEndTraceEvents({ ledger, traceRunId: runId });
  return commonEvents.map((common, index) => ({ native: nativeEvents[index], common }));
};

const firstEventWithActionDecision = (events: readonly ScientificProductTraceCommonEnvelope[]) =>
  events.find((event) => event.actionDecision) ?? null;

const ownerFactsFor = (events: readonly ScientificProductTraceCommonEnvelope[]): TraceOwnerFacts => {
  const action = firstEventWithActionDecision(events);
  const what = events.find((event) => event.stage === "INFORMATION_NEED_SELECTED")
    ?? events.find((event) => event.stage === "QUESTION_REALIZATION_REQUESTED")
    ?? null;
  const formulation = events.find((event) => event.stage === "QUESTION_REALIZATION_REQUESTED")
    ?? events.find((event) => event.stage === "QUESTION_REALIZED")
    ?? null;
  const askVsProposeOwner = action?.decisionOwner ?? "UNKNOWN";
  const whatToAskOwner = what?.decisionOwner ?? "UNKNOWN";
  const questionFormulationOwner = formulation?.executor ?? "UNKNOWN";
  const questionPathObserved = Boolean(action?.actionDecision?.askVsPropose === "ASK_QUESTION" || formulation);
  const qryWhatLlmHowContract = !questionPathObserved
    ? "NOT_APPLICABLE"
    : isMissing(whatToAskOwner) || isMissing(questionFormulationOwner)
      ? "UNKNOWN"
      : whatToAskOwner === "QUERY_NAVIGATION" && questionFormulationOwner !== "QUERY_NAVIGATION"
        ? "RESPECTED"
        : "VIOLATED";
  return Object.freeze({ askVsProposeOwner, whatToAskOwner, questionFormulationOwner, qryWhatLlmHowContract });
};

export const diagnoseScientificTraceRun = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  traceRunId: string;
}): readonly TraceStructuralDiagnostic[] => {
  const pairs = eventPairs(input.ledger, input.traceRunId);
  const events = pairs.map((pair) => pair.common);
  const findings: TraceStructuralDiagnostic[] = [];

  pairs.forEach((pair, index) => {
    const previous = pairs[index - 1] ?? null;
    const expectedUpstream = previous?.native.eventId ?? "NONE";
    const nativeUpstream = pair.native.previousEventId ?? "NONE";
    if (pair.common.upstreamEventId !== expectedUpstream || nativeUpstream !== expectedUpstream) {
      findings.push(diagnostic({
        code: "TRACE_CHAIN_BREAK",
        evidenceEventIds: [pair.native.eventId, ...(previous ? [previous.native.eventId] : [])],
        explanation: `L'événement ${pair.native.eventId} déclare un upstream différent de l'événement précédent observable.`,
      }));
    }
    const missingDependency = pair.common.dependencies.find((dependency) => !pairs.slice(0, index)
      .some((candidate) => candidate.native.eventId === dependency
        || candidate.native.outputResultRef?.artifactId === dependency
        || candidate.common.output.some((reference) => reference.ref === dependency)));
    if (missingDependency) {
      findings.push(diagnostic({
        code: "TRACE_CHAIN_BREAK",
        evidenceEventIds: [pair.native.eventId],
        explanation: `La dépendance ${missingDependency} de l'événement ${pair.native.eventId} n'est pas observable en amont dans ce run.`,
      }));
    }

    if (isMissing(pair.common.decisionOwner)
      && ["INFORMATION_NEED_SELECTED", "QUESTION_REALIZATION_REQUESTED", "HUMAN_DECISION_RECORDED", "QRY_ACTION_SELECTED"].includes(pair.common.stage)) {
      findings.push(diagnostic({
        code: "MISSING_DECISION_OWNER",
        evidenceEventIds: [pair.native.eventId],
        explanation: `Le stage ${pair.common.stage} ne porte aucun decisionOwner observable.`,
      }));
    }

    const transformation = pair.common.semanticTransformation;
    if (transformation?.droppedDimensions.length && isReasonMissing(transformation.dropReason)) {
      const dimensionIds = validationUniqueSorted(transformation.droppedDimensions.map((dimension) => dimension.dimensionId));
      findings.push(diagnostic({
        code: "UNEXPLAINED_DIMENSION_LOSS",
        evidenceEventIds: [pair.native.eventId],
        explanation: `Le stage ${pair.common.stage} écarte ${dimensionIds.join(", ")} sans dropReason observable.`,
      }));
      findings.push(diagnostic({
        code: "MISSING_TRANSFORMATION_REASON",
        evidenceEventIds: [pair.native.eventId],
        explanation: `Le stage ${pair.common.stage} déclare une perte de dimension sans motif de transformation exploitable.`,
      }));
    }
    if (transformation?.transformedDimensions.length && isReasonMissing(transformation.transformationReason)) {
      findings.push(diagnostic({
        code: "MISSING_TRANSFORMATION_REASON",
        evidenceEventIds: [pair.native.eventId],
        explanation: `Le stage ${pair.common.stage} déclare une transformation sans transformationReason observable.`,
      }));
    }

    const action = pair.common.actionDecision;
    if (action?.askVsPropose === "ASK_QUESTION") {
      if (pair.common.decisionOwner === pair.common.executor && pair.common.decisionOwner !== "QUERY_NAVIGATION") {
        findings.push(diagnostic({
          code: "DECISION_OWNER_EXECUTOR_COLLAPSE",
          evidenceEventIds: [pair.native.eventId],
          explanation: `Le même composant observable (${pair.common.decisionOwner}) sélectionne le WHAT et exécute l'action ASK au stage ${pair.common.stage}.`,
          expectedOwner: "QUERY_NAVIGATION",
          observedOwner: pair.common.decisionOwner,
        }));
      }
      if (pair.common.decisionOwner !== "QUERY_NAVIGATION") {
        findings.push(diagnostic({
          code: "DECISION_OWNERSHIP_MISMATCH",
          evidenceEventIds: [pair.native.eventId],
          explanation: `PD-009 attribue le WHAT/WHEN de la prochaine action à QUERY_NAVIGATION; TRACE observe ${pair.common.decisionOwner}.`,
          expectedOwner: "QUERY_NAVIGATION",
          observedOwner: pair.common.decisionOwner,
        }));
      }
      if (action.selectedInformationNeed !== "UNKNOWN"
        && action.alreadyProvidedInformationRefs.includes(action.selectedInformationNeed)) {
        findings.push(diagnostic({
          code: "ALREADY_PROVIDED_INFORMATION_REASKED",
          evidenceEventIds: [pair.native.eventId],
          explanation: `Le besoin sélectionné ${action.selectedInformationNeed} est explicitement référencé comme information déjà fournie.`,
        }));
      }
    }
  });

  const lastOutputByRef = new Map<string, { eventId: string; version: string; digest: string }>();
  pairs.forEach((pair) => {
    pair.common.input.forEach((reference) => {
      const prior = lastOutputByRef.get(reference.ref);
      if (prior && (prior.version !== reference.version || prior.digest !== reference.digest)) {
        findings.push(diagnostic({
          code: "VERSION_OR_DIGEST_DISCONTINUITY",
          evidenceEventIds: [prior.eventId, pair.native.eventId],
          explanation: `La référence ${reference.ref} change de version ou digest entre deux événements liés.`,
        }));
      }
    });
    pair.common.output.forEach((reference) => lastOutputByRef.set(reference.ref, {
      eventId: pair.native.eventId,
      version: reference.version,
      digest: reference.digest,
    }));
  });

  return Object.freeze([...new Map(findings.map((finding) => [finding.diagnosticId, finding])).values()]);
};

const forensicProjectionFor = (
  captureLevel: ScientificTraceCaptureLevel,
  nativeMetadata: Readonly<Record<string, string | number | boolean | null>>,
  payload: ScientificTraceForensicPayload | undefined,
): readonly TraceForensicFieldProjection[] => {
  if (nativeMetadata.forensicRetentionStatus === "EXPIRED_BY_RETENTION") {
    return Object.freeze([{ field: "NONE", source: "RETENTION_POLICY", classification: "EXPIRED_BY_RETENTION", value: null }]);
  }
  if (captureLevel !== "LEVEL_3_FORENSIC" || !payload?.fields.length) {
    return Object.freeze([{ field: "NONE", source: "TRACE_CAPTURE", classification: "NOT_CAPTURED", value: null }]);
  }
  return Object.freeze(payload.fields.map((field) => Object.freeze({
    field: field.field,
    source: field.source,
    classification: field.classification,
    value: field.value,
  })));
};

export const buildTraceInspectorRunProjection = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  traceRunId: string;
}): TraceInspectorRunProjection => {
  const pairs = eventPairs(input.ledger, input.traceRunId);
  const run = getScientificRun({ ledger: input.ledger, runId: input.traceRunId });
  const binding = input.ledger.runBindings.find((candidate) => candidate.runId === input.traceRunId);
  if (!binding) throw new Error("TRACE_INSPECTOR_RUN_BINDING_NOT_FOUND");
  const captureLevel = captureLevelFor(input.ledger, input.traceRunId);
  const events = pairs.map(({ native, common }) => Object.freeze({
    eventId: native.eventId,
    sequence: native.sequence,
    stage: common.stage,
    responsibilityOwner: common.responsibilityOwner,
    decisionOwner: common.decisionOwner,
    executor: common.executor,
    provider: common.provider,
    component: Object.freeze({ ...common.component }),
    inputRefs: Object.freeze(common.input.map((reference) => Object.freeze({ ...reference }))),
    outputRefs: Object.freeze(common.output.map((reference) => Object.freeze({ ...reference }))),
    status: common.status,
    reasonCode: common.reasonCode,
    durationMs: common.durationMs,
    upstreamEventId: common.upstreamEventId,
    dependencies: Object.freeze([...common.dependencies]),
    semanticTransformation: common.semanticTransformation ?? null,
    actionDecision: common.actionDecision ?? null,
    realizationOutcome: common.realizationOutcome ?? null,
    attemptedProvider: common.realizationOutcome?.attemptedProvider ?? null,
    providerResponseReceived: common.realizationOutcome?.providerResponseReceived ?? null,
    providerResponseAccepted: common.realizationOutcome?.providerResponseAccepted ?? null,
    providerRejectionReason: common.realizationOutcome?.providerRejectionReason ?? null,
    fallbackReason: common.realizationOutcome?.fallbackReason ?? null,
    forensic: forensicProjectionFor(captureLevel, native.technicalMetadata, common.forensicPayload),
  }));
  const diagnostics = diagnoseScientificTraceRun(input);
  const firstUnexplained = events.find((event) => diagnostics.some((finding) => finding.code === "UNEXPLAINED_DIMENSION_LOSS"
    && finding.evidenceEventIds.includes(event.eventId))) ?? null;
  const latestProject = [...pairs].reverse().find(({ common }) => !isMissing(common.projectId) && !isMissing(common.projectVersion));
  const turns = validationUniqueSorted(pairs.map(({ common }) => common.turnId).filter((turnId) => !isMissing(turnId)));
  return Object.freeze({
    traceRunId: input.traceRunId,
    captureLevel,
    captureReason: binding.captureConfiguration?.captureReason ?? "DEFAULT",
    replayOfTraceRunId: binding.captureConfiguration?.replayOfTraceRunId ?? "NONE",
    status: run.status,
    turnCount: turns.length,
    eventCount: events.length,
    durationMs: events.reduce((total, event) => total + (event.durationMs ?? 0), 0),
    projectId: latestProject?.common.projectId ?? binding.project.projectId,
    projectVersion: latestProject?.common.projectVersion ?? binding.project.projectVersion,
    projectDigest: latestProject?.native.project.projectDigest ?? binding.project.projectDigest,
    events: Object.freeze(events),
    diagnostics,
    firstUnexplainedDivergenceStage: firstUnexplained?.stage ?? null,
    firstUnexplainedDivergenceEventId: firstUnexplained?.eventId ?? null,
    ownerFacts: ownerFactsFor(pairs.map((pair) => pair.common)),
    inspectorMutatesProduct: false,
    inspectorCallsProvider: false,
    inspectorCreatesDecision: false,
    inspectorRepairs: false,
    inspectorJudgesScience: false,
  });
};

const productEnvelopeMaterial = (event: TraceInspectorEventProjection) => ({
  stage: event.stage,
  responsibilityOwner: event.responsibilityOwner,
  decisionOwner: event.decisionOwner,
  executor: event.executor,
  provider: event.provider,
  component: event.component,
  input: event.inputRefs,
  output: event.outputRefs,
  status: event.status,
  reasonCode: event.reasonCode,
  realizationOutcome: event.realizationOutcome,
});

export const compareTraceInspectorRuns = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  leftTraceRunId: string;
  rightTraceRunId: string;
}): TraceInspectorRunComparison => {
  const left = buildTraceInspectorRunProjection({ ledger: input.ledger, traceRunId: input.leftTraceRunId });
  const right = buildTraceInspectorRunProjection({ ledger: input.ledger, traceRunId: input.rightTraceRunId });
  const count = Math.max(left.events.length, right.events.length);
  const differences: TraceInspectorRunComparison["differences"][number][] = [];
  for (let index = 0; index < count; index += 1) {
    const leftEvent = left.events[index] ?? null;
    const rightEvent = right.events[index] ?? null;
    if (!leftEvent || !rightEvent) {
      differences.push(Object.freeze({
        stage: leftEvent?.stage ?? rightEvent?.stage ?? "EVENT_PRESENCE",
        fields: Object.freeze(["EVENT_PRESENCE"]),
        leftEventId: leftEvent?.eventId ?? null,
        rightEventId: rightEvent?.eventId ?? null,
      }));
      continue;
    }
    const fields = [
      ...(leftEvent.stage !== rightEvent.stage ? ["STAGE"] : []),
      ...(leftEvent.responsibilityOwner !== rightEvent.responsibilityOwner ? ["RESPONSIBILITY_OWNER"] : []),
      ...(leftEvent.decisionOwner !== rightEvent.decisionOwner ? ["DECISION_OWNER"] : []),
      ...(leftEvent.executor !== rightEvent.executor ? ["EXECUTOR"] : []),
      ...(leftEvent.provider !== rightEvent.provider ? ["PROVIDER"] : []),
      ...(stableValidationStringify(leftEvent.inputRefs) !== stableValidationStringify(rightEvent.inputRefs) ? ["INPUT_REFS_OR_DIGESTS"] : []),
      ...(stableValidationStringify(leftEvent.outputRefs) !== stableValidationStringify(rightEvent.outputRefs) ? ["OUTPUT_REFS_OR_DIGESTS"] : []),
      ...(stableValidationStringify(leftEvent.semanticTransformation) !== stableValidationStringify(rightEvent.semanticTransformation) ? ["TRANSFORMATIONS"] : []),
      ...(stableValidationStringify(leftEvent.actionDecision) !== stableValidationStringify(rightEvent.actionDecision) ? ["ACTION_DECISION"] : []),
      ...(stableValidationStringify(leftEvent.realizationOutcome) !== stableValidationStringify(rightEvent.realizationOutcome) ? ["REALIZATION_OUTCOME"] : []),
    ];
    if (fields.length) differences.push(Object.freeze({
      stage: leftEvent.stage,
      fields: Object.freeze(fields),
      leftEventId: leftEvent.eventId,
      rightEventId: rightEvent.eventId,
    }));
  }
  const baseEquivalent = left.events.length === right.events.length
    && left.events.every((event, index) => stableValidationStringify(productEnvelopeMaterial(event))
      === stableValidationStringify(productEnvelopeMaterial(right.events[index])));
  return Object.freeze({
    leftTraceRunId: input.leftTraceRunId,
    rightTraceRunId: input.rightTraceRunId,
    comparedStageCount: count,
    productEnvelopeEquivalent: baseEquivalent,
    diagnosticDetailEquivalent: differences.length === 0,
    differences: Object.freeze(differences),
    scientificDivergenceClaimed: false,
  });
};

export const listTraceRunLineage = (ledger: Readonly<ScientificExecutionTraceLedger>): readonly TraceRunLineageEntry[] => {
  const entries = ledger.runBindings.map((binding) => Object.freeze({
    traceRunId: binding.runId,
    captureLevel: binding.captureConfiguration?.captureLevel ?? "LEVEL_1_CORE",
    captureReason: binding.captureConfiguration?.captureReason ?? "DEFAULT",
    replayOfTraceRunId: binding.captureConfiguration?.replayOfTraceRunId ?? "NONE",
  }));
  return Object.freeze(entries);
};
