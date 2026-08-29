import { logicalDigest } from "@/features/knowledge-engine";
import type {
  ProjectContextSnapshot,
  SpecializedOwnerResult,
} from "@/features/research-project-construction";
import type {
  ProductOwnerResultDependency,
  ProductOwnerResultLedgerEntry,
} from "./product-owner-result-ledger";
import type { ProductValidationRunLedgerEntry } from "./product-validation-run-ledger";

export const SCIENTIFIC_EXECUTION_TRACE_LEDGER_CONTRACT = "SCIENTIFIC_EXECUTION_TRACE_LEDGER" as const;
export const SCIENTIFIC_EXECUTION_TRACE_LEDGER_VERSION = "0.1.0" as const;
export const SCIENTIFIC_RUN_SCHEMA_VERSION = "0.1.0" as const;
export const SCIENTIFIC_EXECUTION_TRACE_EVENT_SCHEMA_VERSION = "0.1.0" as const;
export const END_TO_END_TRACE_PROFILE = "NOXIA_END_TO_END_PRODUCT_TRACE" as const;
export const LEGACY_END_TO_END_TRACE_PROFILE_VERSION = "1.0.0" as const;
export const END_TO_END_TRACE_PROFILE_VERSION = "1.1.0" as const;
export const PRE_PROJECT_SCIENTIFIC_TRACE_SEGMENT_CONTRACT = "SCIENTIFIC_EXECUTION_TRACE_PRE_PROJECT_SEGMENT" as const;
export const PRE_PROJECT_SCIENTIFIC_TRACE_SEGMENT_VERSION = "0.1.0" as const;

export type ScientificProductTraceSentinel = "NONE" | "NOT_APPLICABLE" | "UNKNOWN";
export type ScientificTraceCaptureLevel = "LEVEL_1_CORE" | "LEVEL_2_DIAGNOSTIC" | "LEVEL_3_FORENSIC";
export type ScientificTraceCaptureReason = "DEFAULT" | "MANUAL_DIAGNOSTIC" | "REPLAY_AFTER_INSUFFICIENT_TRACE" | "OTHER";

export const TRACE_CAPTURE_POLICIES = Object.freeze({
  LEVEL_1_CORE: Object.freeze({
    capturePolicyId: "NOXIA_TRACE_CAPTURE_CORE_V1",
    redactionPolicyId: "NOXIA_TRACE_REDACTION_CORE_V1",
    retentionPolicyId: "NOXIA_TRACE_RETENTION_SESSION_CORE_V1",
  }),
  LEVEL_2_DIAGNOSTIC: Object.freeze({
    capturePolicyId: "NOXIA_TRACE_CAPTURE_STRUCTURED_DIAGNOSTIC_V1",
    redactionPolicyId: "NOXIA_TRACE_REDACTION_DIAGNOSTIC_V1",
    retentionPolicyId: "NOXIA_TRACE_RETENTION_SESSION_DIAGNOSTIC_V1",
  }),
  LEVEL_3_FORENSIC: Object.freeze({
    capturePolicyId: "NOXIA_TRACE_CAPTURE_ALLOWLISTED_FORENSIC_V1",
    redactionPolicyId: "NOXIA_TRACE_REDACTION_FORENSIC_V1",
    retentionPolicyId: "NOXIA_TRACE_RETENTION_SESSION_SHORT_FORENSIC_V1",
  }),
} as const);

export type ScientificTraceCapturePolicyId = (typeof TRACE_CAPTURE_POLICIES)[ScientificTraceCaptureLevel]["capturePolicyId"];
export type ScientificTraceRedactionPolicyId = (typeof TRACE_CAPTURE_POLICIES)[ScientificTraceCaptureLevel]["redactionPolicyId"];
export type ScientificTraceRetentionPolicyId = (typeof TRACE_CAPTURE_POLICIES)[ScientificTraceCaptureLevel]["retentionPolicyId"];

export const LEGACY_TRACE_CAPTURE_POLICY_ID = "NOXIA_TRACE_PASSIVE_REFERENCES_ONLY_V1" as const;
export const LEGACY_TRACE_REDACTION_POLICY_ID = "NOXIA_TRACE_REDACTION_MINIMUM_V1" as const;
export const LEGACY_TRACE_RETENTION_POLICY_ID = "NOXIA_TRACE_RETENTION_PROJECT_SESSION_V1" as const;
type ReadableTraceCapturePolicyId = ScientificTraceCapturePolicyId | typeof LEGACY_TRACE_CAPTURE_POLICY_ID;
type ReadableTraceRedactionPolicyId = ScientificTraceRedactionPolicyId | typeof LEGACY_TRACE_REDACTION_POLICY_ID;
type ReadableTraceRetentionPolicyId = ScientificTraceRetentionPolicyId | typeof LEGACY_TRACE_RETENTION_POLICY_ID;

/** Compatibility aliases for consumers that previously read the single CORE policy. */
export const TRACE_CAPTURE_POLICY_ID = TRACE_CAPTURE_POLICIES.LEVEL_1_CORE.capturePolicyId;
export const TRACE_REDACTION_POLICY_ID = TRACE_CAPTURE_POLICIES.LEVEL_1_CORE.redactionPolicyId;
export const TRACE_RETENTION_POLICY_ID = TRACE_CAPTURE_POLICIES.LEVEL_1_CORE.retentionPolicyId;

export type ScientificTraceCaptureConfiguration = {
  contract: "SCIENTIFIC_TRACE_CAPTURE_CONFIGURATION";
  contractVersion: "1.0.0";
  captureLevel: ScientificTraceCaptureLevel;
  captureReason: ScientificTraceCaptureReason;
  replayOfTraceRunId: string | ScientificProductTraceSentinel;
  capturePolicyId: ScientificTraceCapturePolicyId;
  redactionPolicyId: ScientificTraceRedactionPolicyId;
  retentionPolicyId: ScientificTraceRetentionPolicyId;
  autoEscalation: false;
};

export type ScientificTraceTransformationSource =
  | "COMPONENT_DECLARATION"
  | "STRUCTURED_COMPONENT_OUTPUT"
  | "LEGACY_ADAPTER"
  | "UNKNOWN";

export type ScientificTraceSemanticDimension = {
  dimensionId: string;
  source: string | ScientificProductTraceSentinel;
  status: string | ScientificProductTraceSentinel;
  reasonCode: string | ScientificProductTraceSentinel;
};

export type ScientificTraceSemanticTransformation = {
  contract: "SCIENTIFIC_TRACE_SEMANTIC_TRANSFORMATION";
  contractVersion: "1.0.0";
  transformationSource: ScientificTraceTransformationSource;
  inputDimensions: readonly ScientificTraceSemanticDimension[];
  outputDimensions: readonly ScientificTraceSemanticDimension[];
  retainedDimensions: readonly ScientificTraceSemanticDimension[];
  transformedDimensions: readonly ScientificTraceSemanticDimension[];
  droppedDimensions: readonly ScientificTraceSemanticDimension[];
  transformationReason: string | ScientificProductTraceSentinel;
  dropReason: string | ScientificProductTraceSentinel;
};

export type ScientificTraceActionDecision = {
  contract: "SCIENTIFIC_TRACE_ACTION_DECISION";
  contractVersion: "1.0.0";
  declarationSource: ScientificTraceTransformationSource;
  askVsPropose: "ASK_QUESTION" | "PROPOSE" | "RESPOND" | "UNKNOWN";
  selectedInformationNeed: string | ScientificProductTraceSentinel;
  whySelected: string | ScientificProductTraceSentinel;
  expectedInformationGain: string | ScientificProductTraceSentinel;
  alreadyProvidedInformationRefs: readonly string[];
  candidateAlternatives: readonly string[];
  rejectedAlternatives: readonly string[];
  rejectionReasons: readonly { alternativeRef: string; reasonCode: string | ScientificProductTraceSentinel }[];
};

export type ScientificTraceForensicField =
  | "EXACT_USER_INPUT"
  | "EXACT_COMPONENT_SEMANTIC_INPUT"
  | "COMPLETE_TRANSFORMATION_MANIFEST"
  | "WHAT_SPECIFICATION_BEFORE_REALIZATION"
  | "PROVIDER_REQUEST_AFTER_REDACTION"
  | "PROVIDER_RESPONSE_AFTER_REDACTION"
  | "VALIDATOR_INPUT"
  | "VALIDATOR_OUTPUT"
  | "COMPILER_INPUT"
  | "COMPILER_OUTPUT"
  | "STATE_BEFORE"
  | "STATE_AFTER"
  | "SERIALIZATION_DETAILS"
  | "SCHEMA_VALIDATION_DETAILS"
  | "STRUCTURED_ERROR_DIAGNOSTICS"
  | "ERROR_STACK_WHEN_ALLOWED";

export type ScientificTraceForensicPayload = {
  contract: "SCIENTIFIC_TRACE_FORENSIC_PAYLOAD";
  contractVersion: "1.0.0";
  allowlisted: true;
  redactionApplied: boolean;
  fields: readonly {
    field: ScientificTraceForensicField;
    source: string | ScientificProductTraceSentinel;
    classification: "NON_SENSITIVE" | "REDACTED";
    value: string;
  }[];
};

/** Canonical product stages. Historical eventType values remain read aliases only. */
export type ScientificProductTraceStage =
  | "TRACE_RUN_STARTED"
  | "USER_TURN_RECEIVED"
  | "ROUTE_SELECTED"
  | "INTENT_REPRESENTED"
  | "INFORMATION_NEED_SELECTED"
  | "QUESTION_REALIZATION_REQUESTED"
  | "QUESTION_REALIZED"
  | "PROJECT_CANDIDATE_EXTRACTED"
  | "PROJECT_CANDIDATE_VALIDATED"
  | "HUMAN_REVIEW_PRESENTED"
  | "HUMAN_DECISION_RECORDED"
  | "PROJECT_VERSION_CREATED"
  | "PROJECT_VERSION_REVISED"
  | "QRY_ACTION_SELECTED"
  | "KNOWLEDGE_REQUEST"
  | "KNOWLEDGE_RESULT"
  | "SCIENTIFIC_THINKING_REQUEST"
  | "SCIENTIFIC_THINKING_RESULT"
  | "IMAGING_REQUEST"
  | "IMAGING_RESULT"
  | "REG_REQUEST"
  | "REG_RESULT"
  | "VAL_REQUEST"
  | "VAL_RESULT"
  | "TMP_PROJECTION"
  | "DOC_PROJECTION"
  | "UI_PROJECTION"
  | "ARTIFACT_GENERATED"
  | "STALE_MARKED"
  | "SUPERSESSION_RECORDED"
  | "ERROR_BOUNDARY"
  | "TRACE_RUN_COMPLETED";

export type ScientificTraceVersionedReference = {
  ref: string;
  version: string | ScientificProductTraceSentinel;
  digest: string | ScientificProductTraceSentinel;
};

export type ScientificProductTraceCommonEnvelope = {
  contract: "SCIENTIFIC_EXECUTION_TRACE_COMMON_EVENT";
  contractVersion: typeof END_TO_END_TRACE_PROFILE_VERSION | typeof LEGACY_END_TO_END_TRACE_PROFILE_VERSION;
  traceRunId: string;
  turnId: string | ScientificProductTraceSentinel;
  eventId: string;
  stage: ScientificProductTraceStage;
  responsibilityOwner: string | ScientificProductTraceSentinel;
  decisionOwner: string | ScientificProductTraceSentinel;
  executor: string | ScientificProductTraceSentinel;
  provider: string | ScientificProductTraceSentinel;
  component: {
    componentId: string | ScientificProductTraceSentinel;
    componentVersion: string | ScientificProductTraceSentinel;
  };
  input: readonly ScientificTraceVersionedReference[];
  output: readonly ScientificTraceVersionedReference[];
  status: string;
  reasonCode: string | ScientificProductTraceSentinel;
  startedAt: string;
  completedAt: string | ScientificProductTraceSentinel;
  durationMs: number | null;
  upstreamEventId: string | ScientificProductTraceSentinel;
  dependencies: readonly string[];
  sessionId: string;
  conversationId: string | ScientificProductTraceSentinel;
  projectId: string | ScientificProductTraceSentinel;
  projectVersion: string | ScientificProductTraceSentinel;
  ownerRunId: string | ScientificProductTraceSentinel;
  documentProjectionId: string | ScientificProductTraceSentinel;
  artifactId: string | ScientificProductTraceSentinel;
  redactionPolicyId: ReadableTraceRedactionPolicyId;
  retentionPolicyId: ReadableTraceRetentionPolicyId;
  capturePolicyId: ReadableTraceCapturePolicyId;
  captureLevel?: ScientificTraceCaptureLevel;
  captureReason?: ScientificTraceCaptureReason;
  replayOfTraceRunId?: string | ScientificProductTraceSentinel;
  semanticTransformation?: ScientificTraceSemanticTransformation;
  actionDecision?: ScientificTraceActionDecision;
  forensicPayload?: ScientificTraceForensicPayload;
  traceMutatesProduct: false;
  traceDecides: false;
  traceRepairs: false;
  traceJudgesScience: false;
};

export type ScientificProductTraceEnvelopeInput = {
  stage: ScientificProductTraceStage;
  turnId?: string | ScientificProductTraceSentinel;
  responsibilityOwner: string | ScientificProductTraceSentinel;
  decisionOwner?: string | ScientificProductTraceSentinel;
  executor: string | ScientificProductTraceSentinel;
  provider?: string | ScientificProductTraceSentinel;
  componentId: string | ScientificProductTraceSentinel;
  componentVersion?: string | ScientificProductTraceSentinel;
  input?: readonly ScientificTraceVersionedReference[];
  output?: readonly ScientificTraceVersionedReference[];
  reasonCode?: string | ScientificProductTraceSentinel;
  startedAt?: string;
  completedAt?: string | ScientificProductTraceSentinel;
  upstreamEventId?: string | ScientificProductTraceSentinel;
  dependencies?: readonly string[];
  conversationId?: string | ScientificProductTraceSentinel;
  project?: ScientificRunProjectBinding;
  ownerRunId?: string | ScientificProductTraceSentinel;
  documentProjectionId?: string | ScientificProductTraceSentinel;
  artifactId?: string | ScientificProductTraceSentinel;
  semanticTransformation?: ScientificTraceSemanticTransformation;
  actionDecision?: ScientificTraceActionDecision;
  forensicPayload?: ScientificTraceForensicPayload;
};

export type PreProjectTraceDimensionProbe = {
  dimensionRef: string;
  expressions: readonly string[];
};

export type PreProjectTraceDimensionStageStatus = "PRESENT" | "NOT_PRESENT" | "NOT_EXPLICITLY_PROVIDED";

export type PreProjectTraceDimensionObservation = {
  dimensionRef: string;
  expressions: readonly string[];
  explicitlyProvided: boolean;
  postEntryRouting: PreProjectTraceDimensionStageStatus;
  providerContext: PreProjectTraceDimensionStageStatus;
  assistantReply: PreProjectTraceDimensionStageStatus;
  formulatedQuestion: PreProjectTraceDimensionStageStatus;
};

export type PreProjectTraceOwner =
  | "PRODUCT_ENTRY_ROUTER"
  | "QUERY_NAVIGATION"
  | "GEMINI_CONVERSATION_MODEL"
  | "LOCAL_RUNTIME"
  | "NONE";

export type PreProjectScientificTracePoint =
  | {
    sequence: 1;
    point: "POST_ENTRY_ROUTING_INTENT_DIMENSIONS";
    owner: "PRODUCT_ENTRY_ROUTER";
    sourceTurnRef: string;
    sourceText: string;
    sourceTextDigest: string;
    sourceTextCapture: "MINIMIZED" | "DIAGNOSTIC_FULL";
    routeIntent: string | null;
    routeReasons: readonly string[];
    centralScientificObject: string;
    preservedScientificTerms: readonly string[];
    missingInformation: readonly string[];
    dimensionObservations: readonly PreProjectTraceDimensionObservation[];
  }
  | {
    sequence: 2;
    point: "ASK_VS_PROPOSE_DECISION";
    action: "ASK_QUESTION" | "PROPOSE" | "RESPOND" | "UNKNOWN";
    owner: PreProjectTraceOwner;
    justification: string | null;
    justificationStatus: "EXPLICIT_QRY_PURPOSE" | "NOT_EXPOSED_BY_CURRENT_RUNTIME";
    valueOfInformation: string | null;
    valueOfInformationStatus: "AVAILABLE" | "NOT_AVAILABLE";
    explicitlyProvidedInformation: readonly string[];
    candidateAlternatives?: readonly string[];
    rejectedAlternatives?: readonly string[];
    rejectionReasons?: readonly Readonly<{ alternativeRef: string; reasonCode: string }>[];
  }
  | {
    sequence: 3;
    point: "WHAT_TO_ASK_SPECIFICATION";
    owner: PreProjectTraceOwner;
    informationSought: string | null;
    informationSoughtDigest: string | null;
    informationSoughtRef?: string | null;
    informationSoughtPresent: boolean;
    scientificJustification: string | null;
    dimensionsRetained: readonly string[];
    dimensionsDiscarded: readonly string[];
    discardReasons: Readonly<Record<string, string | null>>;
    specificationStatus: "EXPLICIT_QRY_SPECIFICATION" | "INFERRED_POST_HOC_FROM_LLM_QUESTION" | "NOT_APPLICABLE";
  }
  | {
    sequence: 4;
    point: "QUESTION_FORMULATION_BOUNDARY";
    owner: PreProjectTraceOwner;
    whatExactTransmittedToLlm: string | null;
    whatExactTransmittedToLlmDigest: string | null;
    contextTransmittedToLlm: string;
    contextTransmittedToLlmDigest: string;
    systemInstructionTransmittedToLlm: string;
    systemInstructionTransmittedToLlmDigest: string;
    formulatedQuestion: string | null;
    formulatedQuestionDigest: string | null;
    formulatedQuestionPresent: boolean;
    assistantReply: string;
    assistantReplyDigest: string;
    provider: string;
    model: string;
  };

export type PreProjectScientificTraceSegment = {
  contract: typeof PRE_PROJECT_SCIENTIFIC_TRACE_SEGMENT_CONTRACT;
  contractVersion: typeof PRE_PROJECT_SCIENTIFIC_TRACE_SEGMENT_VERSION;
  correlation: {
    traceLedgerContract: typeof SCIENTIFIC_EXECUTION_TRACE_LEDGER_CONTRACT;
    sessionId: string;
    sourceTurnRef: string;
    traceRunId?: string;
  };
  points: readonly Readonly<PreProjectScientificTracePoint>[];
  segmentDigest: string;
  appendOnly: true;
  passive: true;
  readOnly: true;
  traceDecides: false;
  traceRepairs: false;
  projectWriteAuthorized: false;
  conversationMutationAuthorized: false;
  providerInputMutationAuthorized: false;
  privateReasoningStored: false;
  redactionPolicyId: ScientificTraceRedactionPolicyId;
  retentionPolicyId: ScientificTraceRetentionPolicyId;
  capturePolicyId: ScientificTraceCapturePolicyId;
  captureConfiguration: ScientificTraceCaptureConfiguration;
  captureMode: "MINIMIZED" | "DIAGNOSTIC_FULL";
};

export type CreatePreProjectScientificTraceSegmentInput = {
  sessionId: string;
  sourceTurnRef: string;
  traceRunId?: string;
  sourceText: string;
  routing: {
    routeIntent: string | null;
    routeReasons: readonly string[];
    scientificContext: {
      centralScientificObject: string;
      preservedScientificTerms: readonly string[];
      missingInformation: readonly string[];
    };
    explicitScientificDimensions?: readonly Readonly<{
      dimensionRef: string;
      sourceText: string;
    }>[];
  };
  request: {
    requestKind?: string;
    preProjectNavigation?: {
      owner: "QUERY_NAVIGATION";
      action: "ASK_QUESTION" | "PROPOSE" | "RESPOND";
      selectedInformationNeed: string | null;
      selectedInformationNeedRef: string | null;
      scientificReason: string;
      expectedInformationGain: string;
      alreadyProvidedInformationRefs: readonly string[];
      candidateAlternatives: readonly string[];
      rejectedAlternatives: readonly string[];
      rejectionReasons: readonly Readonly<{ alternativeRef: string; reasonCode: string }>[];
      realizationDirective: string;
    };
    conversation: {
      interactionContext?: {
        owner: string;
        purpose: string;
        informationNeedRefs: readonly string[];
      };
    };
  };
  providerBoundary: {
    systemInstruction: string;
    context: string;
    assistantReply: string;
    provider: string;
    model: string;
    formulationOwner?: PreProjectTraceOwner;
  };
  diagnosticDimensionProbes?: readonly PreProjectTraceDimensionProbe[];
  captureMode?: "MINIMIZED" | "DIAGNOSTIC_FULL";
  captureConfiguration?: ScientificTraceCaptureConfiguration;
};

export type ScientificTraceOwner =
  | "USER"
  | "PRODUCT_ENTRY_ROUTER"
  | "INTENT_ORCHESTRATOR"
  | "QUERY_NAVIGATION"
  | "CONVERSATION_MODEL"
  | "RESEARCH_PROJECT"
  | "KNOWLEDGE"
  | "SCIENTIFIC_THINKING"
  | "IMAGING"
  | "REGULATORY_RESOLUTION"
  | "VAL"
  | "TMP"
  | "DOC"
  | "UI"
  | "ARTIFACT"
  | "HUMAN"
  | "TRACE";

export type ScientificExecutionTraceEventType =
  | "RUN_STARTED"
  | "OWNER_INVOCATION_STARTED"
  | "OWNER_INVOCATION_COMPLETED"
  | "OWNER_INVOCATION_FAILED"
  | "HANDOFF_STARTED"
  | "HANDOFF_ACCEPTED"
  | "HANDOFF_REJECTED"
  | "RESULT_PERSISTED"
  | "STALE_RESULT_REJECTED"
  | "VALIDATION_STARTED"
  | "VALIDATION_COMPLETED"
  | "RUN_COMPLETED"
  | "RUN_FAILED"
  | ScientificProductTraceStage;

export type FirstDivergentStage =
  | "PROJECT_CONTEXT"
  | "OWNER_REQUEST_BUILDING"
  | "KNOWLEDGE_ENGINE"
  | "KNOWLEDGE_TO_ST_HANDOFF"
  | "SCIENTIFIC_THINKING_ENGINE"
  | "ST_TO_IMAGING_HANDOFF"
  | "IMAGING_ENGINE"
  | "VAL_INPUT_ADAPTER"
  | "VAL_ENGINE"
  | "REG_REQUEST_BUILDING"
  | "REG_ENGINE"
  | "OWNER_RESULT_PERSISTENCE"
  | "STALE_VALIDATION"
  | "UNKNOWN_STAGE";

export type ScientificRunProjectBinding = {
  projectId: string;
  projectVersion: string;
  projectDigest: string;
  snapshotRef: string;
};

export type ScientificTraceRequestReference = {
  requestId: string;
  requestSchemaVersion: string;
  requestDigest: string;
};

export type ScientificTraceArtifactReference = {
  artifactType: "OWNER_RESULT" | "OWNER_RESULT_LEDGER_ENTRY" | "VALIDATION_RUN" | "VALIDATION_RUN_LEDGER_ENTRY";
  owner: ScientificTraceOwner;
  artifactId: string;
  artifactVersion: string;
  artifactDigest: string;
};

export type ScientificTraceDependencyReference = {
  owner: ScientificTraceOwner;
  resultId: string;
  resultVersion: string;
  resultDigest: string;
};

export type ScientificTraceStaleObservation = {
  status: "NOT_EVALUATED" | "CURRENT" | "STALE_REJECTED";
  expectedProject: ScientificRunProjectBinding | null;
  receivedProject: ScientificRunProjectBinding | null;
  expectedDependencyRefs: readonly ScientificTraceDependencyReference[];
  receivedDependencyRefs: readonly ScientificTraceDependencyReference[];
};

export type ScientificTraceDiagnostic = {
  stage: FirstDivergentStage;
  code: string;
};

export type ScientificTraceError = {
  category: "BOUNDARY_REJECTION" | "OWNER_RUNTIME" | "PERSISTENCE" | "VALIDATION" | "UNKNOWN";
  code: string;
};

export type ScientificTraceTechnicalMetadata = Readonly<Record<string, string | number | boolean | null>>;

export type ScientificExecutionTraceEvent = {
  contract: "SCIENTIFIC_EXECUTION_TRACE_EVENT";
  schemaVersion: typeof SCIENTIFIC_EXECUTION_TRACE_EVENT_SCHEMA_VERSION;
  eventId: string;
  runId: string;
  sequence: number;
  eventType: ScientificExecutionTraceEventType;
  timestamp: string;
  owner: ScientificTraceOwner;
  engine: string | null;
  engineVersion: string | null;
  project: ScientificRunProjectBinding;
  requestRef: ScientificTraceRequestReference | null;
  inputOwnerResultRefs: readonly ScientificTraceArtifactReference[];
  dependencyRefs: readonly ScientificTraceDependencyReference[];
  outputResultRef: ScientificTraceArtifactReference | null;
  status: string;
  sourceRefs: readonly string[];
  sourceCount: number;
  evidenceRefs: readonly string[];
  unknownRefs: readonly string[];
  gapRefs: readonly string[];
  limitationRefs: readonly string[];
  contradictionRefs: readonly string[];
  stale: ScientificTraceStaleObservation;
  durationMs: number | null;
  error: ScientificTraceError | null;
  diagnostic: ScientificTraceDiagnostic | null;
  previousEventId: string | null;
  nextExpectedHandoff: string | null;
  technicalMetadata: ScientificTraceTechnicalMetadata;
  logicalDigest: string;
  eventDigest: string;
  appendOnly: true;
  derived: true;
  projectWriteAuthorized: false;
  repairAuthorized: false;
  scientificDecisionAuthorized: false;
  privateReasoningStored: false;
  /** Canonical end-to-end envelope. Absent only on legacy 0.1.0 events read in compatibility mode. */
  common?: ScientificProductTraceCommonEnvelope;
};

export type ScientificRunBinding = {
  contract: "SCIENTIFIC_RUN_BINDING";
  schemaVersion: typeof SCIENTIFIC_RUN_SCHEMA_VERSION;
  runId: string;
  project: ScientificRunProjectBinding;
  initiatorContext: {
    kind: "EXPLICIT_PRODUCT_CALL" | "TEST_HARNESS" | "REPLAY_ANALYSIS";
    initiatorRef: string;
  };
  startedAt: string;
  createdAt: string;
  bindingDigest: string;
  appendOnly: true;
  derived: true;
  projectWriteAuthorized: false;
  traceIdentity?: {
    traceRunId: string;
    turnId: string | ScientificProductTraceSentinel;
    sessionId: string;
    conversationId: string | ScientificProductTraceSentinel;
  };
  captureConfiguration?: ScientificTraceCaptureConfiguration;
};

export type ScientificExecutionTraceLedger = {
  contract: typeof SCIENTIFIC_EXECUTION_TRACE_LEDGER_CONTRACT;
  contractVersion: typeof SCIENTIFIC_EXECUTION_TRACE_LEDGER_VERSION;
  sessionId: string;
  runBindings: readonly Readonly<ScientificRunBinding>[];
  events: readonly Readonly<ScientificExecutionTraceEvent>[];
  ledgerDigest: string;
  appendOnly: true;
  derived: true;
  readOnlyObservedArtifacts: true;
  projectWriteAuthorized: false;
  ownerResultWriteAuthorized: false;
  validationRunWriteAuthorized: false;
  repairAuthorized: false;
  scientificDecisionAuthorized: false;
  privateReasoningStored: false;
  traceProfile?: {
    profile: typeof END_TO_END_TRACE_PROFILE;
    profileVersion: typeof END_TO_END_TRACE_PROFILE_VERSION | typeof LEGACY_END_TO_END_TRACE_PROFILE_VERSION;
    redactionPolicyId: ReadableTraceRedactionPolicyId;
    retentionPolicyId: ReadableTraceRetentionPolicyId;
    capturePolicyId: ReadableTraceCapturePolicyId;
    oneTraceSystem: true;
    oneEventTaxonomy: true;
    oneTraceIdentityModel: true;
    traceMutatesProduct: false;
    traceDecides: false;
    traceRepairs: false;
    traceJudgesScience: false;
  };
};

export type ScientificRun = {
  contract: "SCIENTIFIC_RUN";
  schemaVersion: typeof SCIENTIFIC_RUN_SCHEMA_VERSION;
  runId: string;
  startedAt: string;
  completedAt: string | null;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  project: ScientificRunProjectBinding;
  initiatorContext: ScientificRunBinding["initiatorContext"];
  eventCount: number;
  firstEventId: string;
  lastEventId: string;
  logicalDigest: string;
  createdAt: string;
  immutableAfterFinalization: true;
  appendOnly: true;
  derived: true;
  authoritative: false;
};

export type ScientificExecutionTraceEventInput = {
  eventType: ScientificExecutionTraceEventType;
  timestamp: string;
  owner?: ScientificTraceOwner;
  engine?: string | null;
  engineVersion?: string | null;
  requestRef?: ScientificTraceRequestReference | null;
  inputOwnerResultRefs?: readonly ScientificTraceArtifactReference[];
  dependencyRefs?: readonly ScientificTraceDependencyReference[];
  outputResultRef?: ScientificTraceArtifactReference | null;
  status: string;
  sourceRefs?: readonly string[];
  sourceCount?: number;
  evidenceRefs?: readonly string[];
  unknownRefs?: readonly string[];
  gapRefs?: readonly string[];
  limitationRefs?: readonly string[];
  contradictionRefs?: readonly string[];
  stale?: ScientificTraceStaleObservation;
  durationMs?: number | null;
  error?: ScientificTraceError | null;
  diagnostic?: ScientificTraceDiagnostic | null;
  nextExpectedHandoff?: string | null;
  technicalMetadata?: ScientificTraceTechnicalMetadata;
  common?: ScientificProductTraceEnvelopeInput;
};

export type ScientificRunTraceRecorder = {
  readonly runId: string;
  append: (input: ScientificExecutionTraceEventInput) => Readonly<ScientificExecutionTraceEvent>;
  complete: (completedAt: string) => Readonly<ScientificRun>;
  fail: (completedAt: string, errorCode: string, stage?: FirstDivergentStage) => Readonly<ScientificRun>;
  getLedger: () => Readonly<ScientificExecutionTraceLedger>;
  getRun: () => Readonly<ScientificRun>;
};

const clone = <T>(value: T): T => structuredClone(value);

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach((nested) => deepFreeze(nested));
    Object.freeze(value);
  }
  return value;
};

export const createScientificTraceCaptureConfiguration = (input?: {
  captureLevel?: ScientificTraceCaptureLevel;
  captureReason?: ScientificTraceCaptureReason;
  replayOfTraceRunId?: string | ScientificProductTraceSentinel;
}): Readonly<ScientificTraceCaptureConfiguration> => {
  const captureLevel = input?.captureLevel ?? "LEVEL_1_CORE";
  const policies = TRACE_CAPTURE_POLICIES[captureLevel];
  return deepFreeze({
    contract: "SCIENTIFIC_TRACE_CAPTURE_CONFIGURATION",
    contractVersion: "1.0.0",
    captureLevel,
    captureReason: input?.captureReason ?? "DEFAULT",
    replayOfTraceRunId: input?.replayOfTraceRunId ?? "NONE",
    capturePolicyId: policies.capturePolicyId,
    redactionPolicyId: policies.redactionPolicyId,
    retentionPolicyId: policies.retentionPolicyId,
    autoEscalation: false,
  });
};

export const DEFAULT_SCIENTIFIC_TRACE_CAPTURE_CONFIGURATION = createScientificTraceCaptureConfiguration();

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const unique = <T>(values: readonly T[]) => [...new Set(values)];

const FORBIDDEN_FIELD = /(secret|token|password|authorization|cookie|credential|api.?key|chain.?of.?thought|private.?reasoning|transcript|raw.?prompt|patient)/i;
const FORBIDDEN_VALUE = /(-----BEGIN [A-Z ]*PRIVATE KEY-----|\bBearer\s+[A-Za-z0-9._~+/=-]+|\bsk-[A-Za-z0-9_-]{8,}|\bAIza[A-Za-z0-9_-]{12,}|\b(?:authorization|proxy-authorization|cookie|set-cookie)\s*:)/i;
const DIAGNOSTIC_CODE = /^[A-Z0-9][A-Z0-9_.:@/-]{1,255}$/;
const TECHNICAL_METADATA_KEYS = new Set([
  "boundedStatus",
  "callerRef",
  "entryDigest",
  "entryId",
  "invocationId",
  "ledgerContract",
  "ledgerVersion",
  "llmCalls",
  "observationContract",
  "observationVersion",
  "profileId",
  "profileVersion",
  "projectWrites",
  "repairAuthorized",
  "runtimeStarts",
  "scientificQualificationClaimed",
  "validationEntryDigest",
  "validationEntryId",
]);

const assertNoForbiddenData = (value: unknown, path = "trace") => {
  if (typeof value === "string") {
    if (FORBIDDEN_VALUE.test(value)) throw new Error("SCIENTIFIC_TRACE_SECRET_MATERIAL_FORBIDDEN");
    if (value.includes("\n") || value.length > 1024) throw new Error("SCIENTIFIC_TRACE_UNBOUNDED_TEXT_FORBIDDEN");
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((nested, index) => assertNoForbiddenData(nested, `${path}[${index}]`));
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, nested] of Object.entries(value)) {
    if (FORBIDDEN_FIELD.test(key) && key !== "privateReasoningStored") {
      throw new Error("SCIENTIFIC_TRACE_PRIVATE_OR_SENSITIVE_FIELD_FORBIDDEN");
    }
    assertNoForbiddenData(nested, `${path}.${key}`);
  }
};

const validateCode = (code: string) => {
  if (!DIAGNOSTIC_CODE.test(code)) throw new Error("SCIENTIFIC_TRACE_DIAGNOSTIC_CODE_INVALID");
};

const boundedTechnicalCode = (code: string, prefix: string) => DIAGNOSTIC_CODE.test(code)
  ? code
  : `${prefix}_${logicalDigest(code).slice(0, 24).toUpperCase()}`;

const validateMetadata = (metadata: ScientificTraceTechnicalMetadata) => {
  for (const [key, value] of Object.entries(metadata)) {
    if (!TECHNICAL_METADATA_KEYS.has(key)) throw new Error("SCIENTIFIC_TRACE_METADATA_KEY_NOT_ALLOWED");
    if (!["string", "number", "boolean"].includes(typeof value) && value !== null) {
      throw new Error("SCIENTIFIC_TRACE_METADATA_VALUE_INVALID");
    }
  }
};

const projectBindingFromSnapshot = (snapshot: Readonly<ProjectContextSnapshot>): ScientificRunProjectBinding => ({
  projectId: snapshot.sourceProjectRef,
  projectVersion: snapshot.sourceProjectVersion,
  projectDigest: snapshot.sourceProjectDigest,
  snapshotRef: snapshot.snapshotDigest,
});

const bindingMaterial = (binding: Omit<ScientificRunBinding, "bindingDigest">) => ({ ...binding });

const logicalEventMaterial = (event: Omit<ScientificExecutionTraceEvent, "logicalDigest" | "eventDigest">) => ({
  eventType: event.eventType,
  owner: event.owner,
  engine: event.engine,
  engineVersion: event.engineVersion,
  project: event.project,
  requestRef: event.requestRef,
  inputOwnerResultRefs: event.inputOwnerResultRefs,
  dependencyRefs: event.dependencyRefs,
  outputResultRef: event.outputResultRef,
  status: event.status,
  sourceRefs: event.sourceRefs,
  sourceCount: event.sourceCount,
  evidenceRefs: event.evidenceRefs,
  unknownRefs: event.unknownRefs,
  gapRefs: event.gapRefs,
  limitationRefs: event.limitationRefs,
  contradictionRefs: event.contradictionRefs,
  stale: event.stale,
  error: event.error,
  diagnostic: event.diagnostic,
  nextExpectedHandoff: event.nextExpectedHandoff,
  technicalMetadata: event.technicalMetadata,
  appendOnly: event.appendOnly,
  derived: event.derived,
  projectWriteAuthorized: event.projectWriteAuthorized,
  repairAuthorized: event.repairAuthorized,
  scientificDecisionAuthorized: event.scientificDecisionAuthorized,
  privateReasoningStored: event.privateReasoningStored,
});

const eventMaterial = (event: Omit<ScientificExecutionTraceEvent, "eventDigest">) => ({ ...event });

const ledgerMaterial = (ledger: Omit<ScientificExecutionTraceLedger, "ledgerDigest">) => ({ ...ledger });

const createLedger = (input: Omit<ScientificExecutionTraceLedger, "ledgerDigest">): Readonly<ScientificExecutionTraceLedger> => {
  const detached = clone(input);
  return deepFreeze({ ...detached, ledgerDigest: logicalDigest(ledgerMaterial(detached)) });
};

const endToEndTraceProfile = (): NonNullable<ScientificExecutionTraceLedger["traceProfile"]> => ({
  profile: END_TO_END_TRACE_PROFILE,
  profileVersion: END_TO_END_TRACE_PROFILE_VERSION,
  redactionPolicyId: TRACE_REDACTION_POLICY_ID,
  retentionPolicyId: TRACE_RETENTION_POLICY_ID,
  capturePolicyId: TRACE_CAPTURE_POLICY_ID,
  oneTraceSystem: true,
  oneEventTaxonomy: true,
  oneTraceIdentityModel: true,
  traceMutatesProduct: false,
  traceDecides: false,
  traceRepairs: false,
  traceJudgesScience: false,
});

export const createScientificExecutionTraceLedger = (sessionId: string): Readonly<ScientificExecutionTraceLedger> => createLedger({
  contract: SCIENTIFIC_EXECUTION_TRACE_LEDGER_CONTRACT,
  contractVersion: SCIENTIFIC_EXECUTION_TRACE_LEDGER_VERSION,
  sessionId,
  runBindings: [],
  events: [],
  appendOnly: true,
  derived: true,
  readOnlyObservedArtifacts: true,
  projectWriteAuthorized: false,
  ownerResultWriteAuthorized: false,
  validationRunWriteAuthorized: false,
  repairAuthorized: false,
  scientificDecisionAuthorized: false,
  privateReasoningStored: false,
  traceProfile: endToEndTraceProfile(),
});

const bindingFor = (ledger: Readonly<ScientificExecutionTraceLedger>, runId: string) => {
  const binding = ledger.runBindings.find((candidate) => candidate.runId === runId);
  if (!binding) throw new Error("SCIENTIFIC_TRACE_RUN_NOT_FOUND");
  return binding;
};

const eventsFor = (ledger: Readonly<ScientificExecutionTraceLedger>, runId: string) => ledger.events.filter((event) => event.runId === runId);

const isTerminal = (event: Readonly<ScientificExecutionTraceEvent>) => ["RUN_COMPLETED", "RUN_FAILED", "TRACE_RUN_COMPLETED"].includes(event.eventType);

export const verifyScientificExecutionTraceEventDigest = (event: Readonly<ScientificExecutionTraceEvent>) => {
  const { eventDigest, ...material } = event;
  const { logicalDigest: storedLogicalDigest, ...logicalMaterial } = material;
  return logicalDigest(logicalEventMaterial(logicalMaterial)) === storedLogicalDigest
    && logicalDigest(eventMaterial(material)) === eventDigest;
};

const validateProjectBinding = (value: unknown): value is ScientificRunProjectBinding => isRecord(value)
  && typeof value.projectId === "string"
  && typeof value.projectVersion === "string"
  && typeof value.projectDigest === "string"
  && typeof value.snapshotRef === "string";

const TRACE_OWNERS = new Set<ScientificTraceOwner>([
  "USER",
  "PRODUCT_ENTRY_ROUTER",
  "INTENT_ORCHESTRATOR",
  "QUERY_NAVIGATION",
  "CONVERSATION_MODEL",
  "RESEARCH_PROJECT",
  "KNOWLEDGE",
  "SCIENTIFIC_THINKING",
  "IMAGING",
  "REGULATORY_RESOLUTION",
  "VAL",
  "TMP",
  "DOC",
  "UI",
  "ARTIFACT",
  "HUMAN",
  "TRACE",
]);
const PRODUCT_TRACE_STAGES: readonly ScientificProductTraceStage[] = [
  "TRACE_RUN_STARTED",
  "USER_TURN_RECEIVED",
  "ROUTE_SELECTED",
  "INTENT_REPRESENTED",
  "INFORMATION_NEED_SELECTED",
  "QUESTION_REALIZATION_REQUESTED",
  "QUESTION_REALIZED",
  "PROJECT_CANDIDATE_EXTRACTED",
  "PROJECT_CANDIDATE_VALIDATED",
  "HUMAN_REVIEW_PRESENTED",
  "HUMAN_DECISION_RECORDED",
  "PROJECT_VERSION_CREATED",
  "PROJECT_VERSION_REVISED",
  "QRY_ACTION_SELECTED",
  "KNOWLEDGE_REQUEST",
  "KNOWLEDGE_RESULT",
  "SCIENTIFIC_THINKING_REQUEST",
  "SCIENTIFIC_THINKING_RESULT",
  "IMAGING_REQUEST",
  "IMAGING_RESULT",
  "REG_REQUEST",
  "REG_RESULT",
  "VAL_REQUEST",
  "VAL_RESULT",
  "TMP_PROJECTION",
  "DOC_PROJECTION",
  "UI_PROJECTION",
  "ARTIFACT_GENERATED",
  "STALE_MARKED",
  "SUPERSESSION_RECORDED",
  "ERROR_BOUNDARY",
  "TRACE_RUN_COMPLETED",
];
const PRODUCT_TRACE_STAGE_SET = new Set<ScientificProductTraceStage>(PRODUCT_TRACE_STAGES);
const TRACE_EVENT_TYPES = new Set<ScientificExecutionTraceEventType>([
  "RUN_STARTED",
  "OWNER_INVOCATION_STARTED",
  "OWNER_INVOCATION_COMPLETED",
  "OWNER_INVOCATION_FAILED",
  "HANDOFF_STARTED",
  "HANDOFF_ACCEPTED",
  "HANDOFF_REJECTED",
  "RESULT_PERSISTED",
  "STALE_RESULT_REJECTED",
  "VALIDATION_STARTED",
  "VALIDATION_COMPLETED",
  "RUN_COMPLETED",
  "RUN_FAILED",
  ...PRODUCT_TRACE_STAGES,
]);
const DIVERGENT_STAGES = new Set<FirstDivergentStage>([
  "PROJECT_CONTEXT",
  "OWNER_REQUEST_BUILDING",
  "KNOWLEDGE_ENGINE",
  "KNOWLEDGE_TO_ST_HANDOFF",
  "SCIENTIFIC_THINKING_ENGINE",
  "ST_TO_IMAGING_HANDOFF",
  "IMAGING_ENGINE",
  "VAL_INPUT_ADAPTER",
  "VAL_ENGINE",
  "REG_REQUEST_BUILDING",
  "REG_ENGINE",
  "OWNER_RESULT_PERSISTENCE",
  "STALE_VALIDATION",
  "UNKNOWN_STAGE",
]);
const ARTIFACT_TYPES = new Set<ScientificTraceArtifactReference["artifactType"]>([
  "OWNER_RESULT",
  "OWNER_RESULT_LEDGER_ENTRY",
  "VALIDATION_RUN",
  "VALIDATION_RUN_LEDGER_ENTRY",
]);
const ERROR_CATEGORIES = new Set<ScientificTraceError["category"]>([
  "BOUNDARY_REJECTION",
  "OWNER_RUNTIME",
  "PERSISTENCE",
  "VALIDATION",
  "UNKNOWN",
]);

const isStringArray = (value: unknown): value is string[] => Array.isArray(value)
  && value.every((item) => typeof item === "string");
const validateRequestReference = (value: unknown): value is ScientificTraceRequestReference => isRecord(value)
  && typeof value.requestId === "string"
  && typeof value.requestSchemaVersion === "string"
  && typeof value.requestDigest === "string";
const validateArtifactReference = (value: unknown): value is ScientificTraceArtifactReference => isRecord(value)
  && ARTIFACT_TYPES.has(value.artifactType as ScientificTraceArtifactReference["artifactType"])
  && TRACE_OWNERS.has(value.owner as ScientificTraceOwner)
  && typeof value.artifactId === "string"
  && typeof value.artifactVersion === "string"
  && typeof value.artifactDigest === "string";
const validateDependencyReference = (value: unknown): value is ScientificTraceDependencyReference => isRecord(value)
  && TRACE_OWNERS.has(value.owner as ScientificTraceOwner)
  && typeof value.resultId === "string"
  && typeof value.resultVersion === "string"
  && typeof value.resultDigest === "string";
const validateStaleObservation = (value: unknown): value is ScientificTraceStaleObservation => isRecord(value)
  && ["NOT_EVALUATED", "CURRENT", "STALE_REJECTED"].includes(String(value.status))
  && (value.expectedProject === null || validateProjectBinding(value.expectedProject))
  && (value.receivedProject === null || validateProjectBinding(value.receivedProject))
  && Array.isArray(value.expectedDependencyRefs)
  && value.expectedDependencyRefs.every(validateDependencyReference)
  && Array.isArray(value.receivedDependencyRefs)
  && value.receivedDependencyRefs.every(validateDependencyReference);
const validateError = (value: unknown): value is ScientificTraceError => isRecord(value)
  && ERROR_CATEGORIES.has(value.category as ScientificTraceError["category"])
  && typeof value.code === "string";
const validateDiagnostic = (value: unknown): value is ScientificTraceDiagnostic => isRecord(value)
  && DIVERGENT_STAGES.has(value.stage as FirstDivergentStage)
  && typeof value.code === "string";
const validateVersionedReference = (value: unknown): value is ScientificTraceVersionedReference => isRecord(value)
  && typeof value.ref === "string"
  && typeof value.version === "string"
  && typeof value.digest === "string";
const TRACE_CAPTURE_LEVELS = new Set<ScientificTraceCaptureLevel>([
  "LEVEL_1_CORE",
  "LEVEL_2_DIAGNOSTIC",
  "LEVEL_3_FORENSIC",
]);
const TRACE_CAPTURE_REASONS = new Set<ScientificTraceCaptureReason>([
  "DEFAULT",
  "MANUAL_DIAGNOSTIC",
  "REPLAY_AFTER_INSUFFICIENT_TRACE",
  "OTHER",
]);
const TRACE_TRANSFORMATION_SOURCES = new Set<ScientificTraceTransformationSource>([
  "COMPONENT_DECLARATION",
  "STRUCTURED_COMPONENT_OUTPUT",
  "LEGACY_ADAPTER",
  "UNKNOWN",
]);
const TRACE_FORENSIC_FIELDS = new Set<ScientificTraceForensicField>([
  "EXACT_USER_INPUT",
  "EXACT_COMPONENT_SEMANTIC_INPUT",
  "COMPLETE_TRANSFORMATION_MANIFEST",
  "WHAT_SPECIFICATION_BEFORE_REALIZATION",
  "PROVIDER_REQUEST_AFTER_REDACTION",
  "PROVIDER_RESPONSE_AFTER_REDACTION",
  "VALIDATOR_INPUT",
  "VALIDATOR_OUTPUT",
  "COMPILER_INPUT",
  "COMPILER_OUTPUT",
  "STATE_BEFORE",
  "STATE_AFTER",
  "SERIALIZATION_DETAILS",
  "SCHEMA_VALIDATION_DETAILS",
  "STRUCTURED_ERROR_DIAGNOSTICS",
  "ERROR_STACK_WHEN_ALLOWED",
]);

const validateCaptureConfiguration = (value: unknown): value is ScientificTraceCaptureConfiguration => {
  if (!isRecord(value)
    || value.contract !== "SCIENTIFIC_TRACE_CAPTURE_CONFIGURATION"
    || value.contractVersion !== "1.0.0"
    || !TRACE_CAPTURE_LEVELS.has(value.captureLevel as ScientificTraceCaptureLevel)
    || !TRACE_CAPTURE_REASONS.has(value.captureReason as ScientificTraceCaptureReason)
    || typeof value.replayOfTraceRunId !== "string"
    || value.autoEscalation !== false) return false;
  const policies = TRACE_CAPTURE_POLICIES[value.captureLevel as ScientificTraceCaptureLevel];
  return value.capturePolicyId === policies.capturePolicyId
    && value.redactionPolicyId === policies.redactionPolicyId
    && value.retentionPolicyId === policies.retentionPolicyId;
};

const validateSemanticDimension = (value: unknown): value is ScientificTraceSemanticDimension => isRecord(value)
  && typeof value.dimensionId === "string"
  && typeof value.source === "string"
  && typeof value.status === "string"
  && typeof value.reasonCode === "string";

const validateSemanticTransformation = (value: unknown): value is ScientificTraceSemanticTransformation => isRecord(value)
  && value.contract === "SCIENTIFIC_TRACE_SEMANTIC_TRANSFORMATION"
  && value.contractVersion === "1.0.0"
  && TRACE_TRANSFORMATION_SOURCES.has(value.transformationSource as ScientificTraceTransformationSource)
  && [value.inputDimensions, value.outputDimensions, value.retainedDimensions, value.transformedDimensions, value.droppedDimensions]
    .every((dimensions) => Array.isArray(dimensions) && dimensions.length <= 64 && dimensions.every(validateSemanticDimension))
  && typeof value.transformationReason === "string"
  && typeof value.dropReason === "string";

const validateActionDecision = (value: unknown): value is ScientificTraceActionDecision => isRecord(value)
  && value.contract === "SCIENTIFIC_TRACE_ACTION_DECISION"
  && value.contractVersion === "1.0.0"
  && TRACE_TRANSFORMATION_SOURCES.has(value.declarationSource as ScientificTraceTransformationSource)
  && ["ASK_QUESTION", "PROPOSE", "RESPOND", "UNKNOWN"].includes(String(value.askVsPropose))
  && typeof value.selectedInformationNeed === "string"
  && typeof value.whySelected === "string"
  && typeof value.expectedInformationGain === "string"
  && isStringArray(value.alreadyProvidedInformationRefs)
  && isStringArray(value.candidateAlternatives)
  && isStringArray(value.rejectedAlternatives)
  && Array.isArray(value.rejectionReasons)
  && value.rejectionReasons.length <= 64
  && value.rejectionReasons.every((item) => isRecord(item)
    && typeof item.alternativeRef === "string"
    && typeof item.reasonCode === "string");

const validateForensicPayload = (value: unknown): value is ScientificTraceForensicPayload => isRecord(value)
  && value.contract === "SCIENTIFIC_TRACE_FORENSIC_PAYLOAD"
  && value.contractVersion === "1.0.0"
  && value.allowlisted === true
  && typeof value.redactionApplied === "boolean"
  && Array.isArray(value.fields)
  && value.fields.length <= 16
  && value.fields.every((item) => isRecord(item)
    && TRACE_FORENSIC_FIELDS.has(item.field as ScientificTraceForensicField)
    && typeof item.source === "string"
    && ["NON_SENSITIVE", "REDACTED"].includes(String(item.classification))
    && typeof item.value === "string"
    && item.value.length <= 1024
    && !item.value.includes("\n"));

const validateCaptureExtensions = (value: Record<string, unknown>) => {
  if (!TRACE_CAPTURE_LEVELS.has(value.captureLevel as ScientificTraceCaptureLevel)
    || !TRACE_CAPTURE_REASONS.has(value.captureReason as ScientificTraceCaptureReason)
    || typeof value.replayOfTraceRunId !== "string") return false;
  const level = value.captureLevel as ScientificTraceCaptureLevel;
  const policies = TRACE_CAPTURE_POLICIES[level];
  if (value.capturePolicyId !== policies.capturePolicyId
    || value.redactionPolicyId !== policies.redactionPolicyId
    || value.retentionPolicyId !== policies.retentionPolicyId) return false;
  if (value.semanticTransformation !== undefined && !validateSemanticTransformation(value.semanticTransformation)) return false;
  if (value.actionDecision !== undefined && !validateActionDecision(value.actionDecision)) return false;
  if (value.forensicPayload !== undefined && !validateForensicPayload(value.forensicPayload)) return false;
  if (level === "LEVEL_1_CORE") {
    return value.semanticTransformation === undefined
      && value.actionDecision === undefined
      && value.forensicPayload === undefined;
  }
  if (level === "LEVEL_2_DIAGNOSTIC") return value.forensicPayload === undefined;
  return true;
};

const validateCommonEnvelope = (value: unknown, eventId: string, runId: string): value is ScientificProductTraceCommonEnvelope => {
  if (!isRecord(value)
    || value.contract !== "SCIENTIFIC_EXECUTION_TRACE_COMMON_EVENT"
    || !(new Set<string>([LEGACY_END_TO_END_TRACE_PROFILE_VERSION, END_TO_END_TRACE_PROFILE_VERSION])).has(String(value.contractVersion))
    || value.traceRunId !== runId
    || value.eventId !== eventId
    || typeof value.turnId !== "string"
    || !PRODUCT_TRACE_STAGE_SET.has(value.stage as ScientificProductTraceStage)
    || typeof value.responsibilityOwner !== "string"
    || typeof value.decisionOwner !== "string"
    || typeof value.executor !== "string"
    || typeof value.provider !== "string"
    || !isRecord(value.component)
    || typeof value.component.componentId !== "string"
    || typeof value.component.componentVersion !== "string"
    || !Array.isArray(value.input)
    || !value.input.every(validateVersionedReference)
    || !Array.isArray(value.output)
    || !value.output.every(validateVersionedReference)
    || typeof value.status !== "string"
    || typeof value.reasonCode !== "string"
    || typeof value.startedAt !== "string"
    || typeof value.completedAt !== "string"
    || (value.durationMs !== null && typeof value.durationMs !== "number")
    || typeof value.upstreamEventId !== "string"
    || !isStringArray(value.dependencies)
    || typeof value.sessionId !== "string"
    || typeof value.conversationId !== "string"
    || typeof value.projectId !== "string"
    || typeof value.projectVersion !== "string"
    || typeof value.ownerRunId !== "string"
    || typeof value.documentProjectionId !== "string"
    || typeof value.artifactId !== "string"
    || value.traceMutatesProduct !== false
    || value.traceDecides !== false
    || value.traceRepairs !== false
    || value.traceJudgesScience !== false) return false;
  if (value.contractVersion === LEGACY_END_TO_END_TRACE_PROFILE_VERSION) {
    return value.redactionPolicyId === LEGACY_TRACE_REDACTION_POLICY_ID
      && value.retentionPolicyId === LEGACY_TRACE_RETENTION_POLICY_ID
      && value.capturePolicyId === LEGACY_TRACE_CAPTURE_POLICY_ID
      && value.captureLevel === undefined
      && value.captureReason === undefined
      && value.replayOfTraceRunId === undefined
      && value.semanticTransformation === undefined
      && value.actionDecision === undefined
      && value.forensicPayload === undefined;
  }
  return validateCaptureExtensions(value);
};

const validateEventShape = (event: unknown): event is ScientificExecutionTraceEvent => isRecord(event)
  && event.contract === "SCIENTIFIC_EXECUTION_TRACE_EVENT"
  && event.schemaVersion === SCIENTIFIC_EXECUTION_TRACE_EVENT_SCHEMA_VERSION
  && typeof event.eventId === "string"
  && typeof event.runId === "string"
  && typeof event.sequence === "number"
  && TRACE_EVENT_TYPES.has(event.eventType as ScientificExecutionTraceEventType)
  && typeof event.timestamp === "string"
  && TRACE_OWNERS.has(event.owner as ScientificTraceOwner)
  && (event.engine === null || typeof event.engine === "string")
  && (event.engineVersion === null || typeof event.engineVersion === "string")
  && validateProjectBinding(event.project)
  && (event.requestRef === null || validateRequestReference(event.requestRef))
  && Array.isArray(event.inputOwnerResultRefs)
  && event.inputOwnerResultRefs.every(validateArtifactReference)
  && Array.isArray(event.dependencyRefs)
  && event.dependencyRefs.every(validateDependencyReference)
  && (event.outputResultRef === null || validateArtifactReference(event.outputResultRef))
  && typeof event.status === "string"
  && isStringArray(event.sourceRefs)
  && typeof event.sourceCount === "number"
  && isStringArray(event.evidenceRefs)
  && isStringArray(event.unknownRefs)
  && isStringArray(event.gapRefs)
  && isStringArray(event.limitationRefs)
  && isStringArray(event.contradictionRefs)
  && validateStaleObservation(event.stale)
  && (event.durationMs === null || typeof event.durationMs === "number")
  && (event.error === null || validateError(event.error))
  && (event.diagnostic === null || validateDiagnostic(event.diagnostic))
  && (event.previousEventId === null || typeof event.previousEventId === "string")
  && (event.nextExpectedHandoff === null || typeof event.nextExpectedHandoff === "string")
  && isRecord(event.technicalMetadata)
  && typeof event.logicalDigest === "string"
  && typeof event.eventDigest === "string"
  && event.appendOnly === true
  && event.derived === true
  && event.projectWriteAuthorized === false
  && event.repairAuthorized === false
  && event.scientificDecisionAuthorized === false
  && event.privateReasoningStored === false
  && (event.common === undefined || validateCommonEnvelope(event.common, event.eventId as string, event.runId as string));

const validateTraceProfile = (value: unknown) => {
  if (!isRecord(value)
    || value.profile !== END_TO_END_TRACE_PROFILE
    || !(new Set<string>([LEGACY_END_TO_END_TRACE_PROFILE_VERSION, END_TO_END_TRACE_PROFILE_VERSION])).has(String(value.profileVersion))
    || value.oneTraceSystem !== true
    || value.oneEventTaxonomy !== true
    || value.oneTraceIdentityModel !== true
    || value.traceMutatesProduct !== false
    || value.traceDecides !== false
    || value.traceRepairs !== false
    || value.traceJudgesScience !== false) return false;
  return value.profileVersion === LEGACY_END_TO_END_TRACE_PROFILE_VERSION
    ? value.redactionPolicyId === LEGACY_TRACE_REDACTION_POLICY_ID
      && value.retentionPolicyId === LEGACY_TRACE_RETENTION_POLICY_ID
      && value.capturePolicyId === LEGACY_TRACE_CAPTURE_POLICY_ID
    : value.redactionPolicyId === TRACE_CAPTURE_POLICIES.LEVEL_1_CORE.redactionPolicyId
      && value.retentionPolicyId === TRACE_CAPTURE_POLICIES.LEVEL_1_CORE.retentionPolicyId
      && value.capturePolicyId === TRACE_CAPTURE_POLICIES.LEVEL_1_CORE.capturePolicyId;
};

export const rehydrateScientificExecutionTraceLedger = (value: unknown): Readonly<ScientificExecutionTraceLedger> => {
  if (!isRecord(value)
    || value.contract !== SCIENTIFIC_EXECUTION_TRACE_LEDGER_CONTRACT
    || value.contractVersion !== SCIENTIFIC_EXECUTION_TRACE_LEDGER_VERSION
    || typeof value.sessionId !== "string"
    || !Array.isArray(value.runBindings)
    || !Array.isArray(value.events)
    || typeof value.ledgerDigest !== "string"
    || value.appendOnly !== true
    || value.derived !== true
    || value.readOnlyObservedArtifacts !== true
    || value.projectWriteAuthorized !== false
    || value.ownerResultWriteAuthorized !== false
    || value.validationRunWriteAuthorized !== false
    || value.repairAuthorized !== false
    || value.scientificDecisionAuthorized !== false
    || value.privateReasoningStored !== false
    || (value.traceProfile !== undefined && !validateTraceProfile(value.traceProfile))) {
    throw new Error("SCIENTIFIC_EXECUTION_TRACE_LEDGER_INVALID");
  }
  assertNoForbiddenData(value);
  const detached = clone(value) as ScientificExecutionTraceLedger;
  const runIds = new Set<string>();
  for (const binding of detached.runBindings) {
    if (!isRecord(binding)
      || binding.contract !== "SCIENTIFIC_RUN_BINDING"
      || binding.schemaVersion !== SCIENTIFIC_RUN_SCHEMA_VERSION
      || typeof binding.runId !== "string"
      || !validateProjectBinding(binding.project)
      || !isRecord(binding.initiatorContext)
      || !["EXPLICIT_PRODUCT_CALL", "TEST_HARNESS", "REPLAY_ANALYSIS"].includes(String(binding.initiatorContext.kind))
      || typeof binding.initiatorContext.initiatorRef !== "string"
      || typeof binding.startedAt !== "string"
      || typeof binding.createdAt !== "string"
      || typeof binding.bindingDigest !== "string"
      || binding.appendOnly !== true
      || binding.derived !== true
      || binding.projectWriteAuthorized !== false
      || (binding.traceIdentity !== undefined && (!isRecord(binding.traceIdentity)
        || binding.traceIdentity.traceRunId !== binding.runId
        || typeof binding.traceIdentity.turnId !== "string"
        || binding.traceIdentity.sessionId !== detached.sessionId
        || typeof binding.traceIdentity.conversationId !== "string"))
      || (binding.captureConfiguration !== undefined && !validateCaptureConfiguration(binding.captureConfiguration))
      || runIds.has(binding.runId)) {
      throw new Error("SCIENTIFIC_TRACE_RUN_BINDING_INVALID");
    }
    if (binding.captureConfiguration
      && binding.captureConfiguration.replayOfTraceRunId !== "NONE"
      && binding.captureConfiguration?.replayOfTraceRunId !== "UNKNOWN"
      && binding.captureConfiguration?.replayOfTraceRunId !== "NOT_APPLICABLE"
      && (binding.captureConfiguration?.replayOfTraceRunId === binding.runId
        || !runIds.has(binding.captureConfiguration?.replayOfTraceRunId))) {
      throw new Error("SCIENTIFIC_TRACE_REPLAY_LINEAGE_INVALID");
    }
    const { bindingDigest, ...material } = binding;
    if (logicalDigest(bindingMaterial(material)) !== bindingDigest) throw new Error("SCIENTIFIC_TRACE_RUN_BINDING_DIGEST_INVALID");
    runIds.add(binding.runId);
  }
  const sequences = new Map<string, number>();
  const previousIds = new Map<string, string | null>();
  const finalizedRuns = new Set<string>();
  for (const event of detached.events) {
    if (!validateEventShape(event) || !runIds.has(event.runId)) throw new Error("SCIENTIFIC_TRACE_EVENT_INVALID");
    const expectedSequence = (sequences.get(event.runId) ?? 0) + 1;
    if (event.sequence !== expectedSequence || event.previousEventId !== (previousIds.get(event.runId) ?? null)) {
      throw new Error("SCIENTIFIC_TRACE_EVENT_SEQUENCE_INVALID");
    }
    if (finalizedRuns.has(event.runId)) throw new Error("SCIENTIFIC_TRACE_FINALIZED_RUN_IS_IMMUTABLE");
    if (event.sequence === 1 && !["RUN_STARTED", "USER_TURN_RECEIVED", "TRACE_RUN_STARTED"].includes(event.eventType)) {
      throw new Error("SCIENTIFIC_TRACE_RUN_START_EVENT_MISSING");
    }
    if (!verifyScientificExecutionTraceEventDigest(event)) throw new Error("SCIENTIFIC_TRACE_EVENT_DIGEST_INVALID");
    validateMetadata(event.technicalMetadata);
    if (event.error) validateCode(event.error.code);
    if (event.diagnostic) validateCode(event.diagnostic.code);
    sequences.set(event.runId, event.sequence);
    previousIds.set(event.runId, event.eventId);
    if (isTerminal(event)) finalizedRuns.add(event.runId);
  }
  const { ledgerDigest, ...material } = detached;
  if (logicalDigest(ledgerMaterial(material)) !== ledgerDigest) throw new Error("SCIENTIFIC_EXECUTION_TRACE_LEDGER_DIGEST_INVALID");
  return deepFreeze(detached);
};

export type ScientificTraceEventCrosswalkEntry = {
  existingEventType: ScientificExecutionTraceEventType;
  targetStage: ScientificProductTraceStage | "OWNER_SPECIFIC_REQUEST" | "OWNER_SPECIFIC_RESULT";
  compatibility: "IDENTICAL" | "READ_ALIAS" | "OWNER_CONTEXT_REQUIRED";
};

export const SCIENTIFIC_TRACE_EVENT_CROSSWALK: readonly ScientificTraceEventCrosswalkEntry[] = [
  { existingEventType: "RUN_STARTED", targetStage: "TRACE_RUN_STARTED", compatibility: "READ_ALIAS" },
  { existingEventType: "OWNER_INVOCATION_STARTED", targetStage: "OWNER_SPECIFIC_REQUEST", compatibility: "OWNER_CONTEXT_REQUIRED" },
  { existingEventType: "OWNER_INVOCATION_COMPLETED", targetStage: "OWNER_SPECIFIC_RESULT", compatibility: "OWNER_CONTEXT_REQUIRED" },
  { existingEventType: "OWNER_INVOCATION_FAILED", targetStage: "ERROR_BOUNDARY", compatibility: "READ_ALIAS" },
  { existingEventType: "HANDOFF_STARTED", targetStage: "OWNER_SPECIFIC_REQUEST", compatibility: "OWNER_CONTEXT_REQUIRED" },
  { existingEventType: "HANDOFF_ACCEPTED", targetStage: "OWNER_SPECIFIC_RESULT", compatibility: "OWNER_CONTEXT_REQUIRED" },
  { existingEventType: "HANDOFF_REJECTED", targetStage: "ERROR_BOUNDARY", compatibility: "READ_ALIAS" },
  { existingEventType: "RESULT_PERSISTED", targetStage: "OWNER_SPECIFIC_RESULT", compatibility: "OWNER_CONTEXT_REQUIRED" },
  { existingEventType: "STALE_RESULT_REJECTED", targetStage: "STALE_MARKED", compatibility: "READ_ALIAS" },
  { existingEventType: "VALIDATION_STARTED", targetStage: "VAL_REQUEST", compatibility: "READ_ALIAS" },
  { existingEventType: "VALIDATION_COMPLETED", targetStage: "VAL_RESULT", compatibility: "READ_ALIAS" },
  { existingEventType: "RUN_COMPLETED", targetStage: "TRACE_RUN_COMPLETED", compatibility: "READ_ALIAS" },
  { existingEventType: "RUN_FAILED", targetStage: "ERROR_BOUNDARY", compatibility: "READ_ALIAS" },
  ...PRODUCT_TRACE_STAGES.map((stage) => ({ existingEventType: stage, targetStage: stage, compatibility: "IDENTICAL" as const })),
];

const ownerRequestStage = (owner: ScientificTraceOwner): ScientificProductTraceStage => owner === "KNOWLEDGE"
  ? "KNOWLEDGE_REQUEST"
  : owner === "SCIENTIFIC_THINKING" ? "SCIENTIFIC_THINKING_REQUEST"
    : owner === "IMAGING" ? "IMAGING_REQUEST"
      : owner === "REGULATORY_RESOLUTION" ? "REG_REQUEST"
        : owner === "VAL" ? "VAL_REQUEST"
          : "ERROR_BOUNDARY";

const ownerResultStage = (owner: ScientificTraceOwner): ScientificProductTraceStage => owner === "KNOWLEDGE"
  ? "KNOWLEDGE_RESULT"
  : owner === "SCIENTIFIC_THINKING" ? "SCIENTIFIC_THINKING_RESULT"
    : owner === "IMAGING" ? "IMAGING_RESULT"
      : owner === "REGULATORY_RESOLUTION" ? "REG_RESULT"
        : owner === "VAL" ? "VAL_RESULT"
          : "ERROR_BOUNDARY";

export const canonicalStageForScientificTraceEvent = (event: Pick<ScientificExecutionTraceEvent, "eventType" | "owner">): ScientificProductTraceStage => {
  if (PRODUCT_TRACE_STAGE_SET.has(event.eventType as ScientificProductTraceStage)) return event.eventType as ScientificProductTraceStage;
  if (["OWNER_INVOCATION_STARTED", "HANDOFF_STARTED"].includes(event.eventType)) return ownerRequestStage(event.owner);
  if (["OWNER_INVOCATION_COMPLETED", "HANDOFF_ACCEPTED", "RESULT_PERSISTED"].includes(event.eventType)) return ownerResultStage(event.owner);
  if (event.eventType === "RUN_STARTED") return "TRACE_RUN_STARTED";
  if (event.eventType === "RUN_COMPLETED") return "TRACE_RUN_COMPLETED";
  if (event.eventType === "STALE_RESULT_REJECTED") return "STALE_MARKED";
  if (event.eventType === "VALIDATION_STARTED") return "VAL_REQUEST";
  if (event.eventType === "VALIDATION_COMPLETED") return "VAL_RESULT";
  return "ERROR_BOUNDARY";
};

const requestReference = (reference: ScientificTraceRequestReference): ScientificTraceVersionedReference => ({
  ref: reference.requestId,
  version: reference.requestSchemaVersion,
  digest: reference.requestDigest,
});

const artifactReference = (reference: ScientificTraceArtifactReference): ScientificTraceVersionedReference => ({
  ref: reference.artifactId,
  version: reference.artifactVersion,
  digest: reference.artifactDigest,
});

const dependencyReference = (reference: ScientificTraceDependencyReference): ScientificTraceVersionedReference => ({
  ref: reference.resultId,
  version: reference.resultVersion,
  digest: reference.resultDigest,
});

const commonEnvelopeFor = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  binding: Readonly<ScientificRunBinding>;
  eventInput: ScientificExecutionTraceEventInput;
  eventId: string;
  project: ScientificRunProjectBinding;
  previousEventId: string | null;
}): ScientificProductTraceCommonEnvelope => {
  const specified = input.eventInput.common;
  const captureConfiguration = input.binding.captureConfiguration ?? DEFAULT_SCIENTIFIC_TRACE_CAPTURE_CONFIGURATION;
  const owner = input.eventInput.owner ?? "TRACE";
  const inputReferences = specified?.input ?? [
    ...(input.eventInput.requestRef ? [requestReference(input.eventInput.requestRef)] : []),
    ...(input.eventInput.inputOwnerResultRefs ?? []).map(artifactReference),
    ...(input.eventInput.dependencyRefs ?? []).map(dependencyReference),
  ];
  const outputReferences = specified?.output ?? (input.eventInput.outputResultRef
    ? [artifactReference(input.eventInput.outputResultRef)]
    : []);
  const stage = specified?.stage ?? canonicalStageForScientificTraceEvent({ eventType: input.eventInput.eventType, owner });
  return {
    contract: "SCIENTIFIC_EXECUTION_TRACE_COMMON_EVENT",
    contractVersion: END_TO_END_TRACE_PROFILE_VERSION,
    traceRunId: input.binding.traceIdentity?.traceRunId ?? input.binding.runId,
    turnId: specified?.turnId ?? input.binding.traceIdentity?.turnId ?? "UNKNOWN",
    eventId: input.eventId,
    stage,
    responsibilityOwner: specified?.responsibilityOwner ?? owner,
    decisionOwner: specified?.decisionOwner ?? "UNKNOWN",
    executor: specified?.executor ?? input.eventInput.engine ?? "LOCAL_RUNTIME",
    provider: specified?.provider ?? "NONE",
    component: {
      componentId: specified?.componentId ?? input.eventInput.engine ?? "SCIENTIFIC_EXECUTION_TRACE",
      componentVersion: specified?.componentVersion ?? input.eventInput.engineVersion ?? "UNKNOWN",
    },
    input: clone([...inputReferences]),
    output: clone([...outputReferences]),
    status: input.eventInput.status,
    reasonCode: specified?.reasonCode ?? input.eventInput.error?.code ?? input.eventInput.diagnostic?.code ?? "NONE",
    startedAt: specified?.startedAt ?? input.eventInput.timestamp,
    completedAt: specified?.completedAt ?? (input.eventInput.durationMs === null || input.eventInput.durationMs === undefined ? "NOT_APPLICABLE" : input.eventInput.timestamp),
    durationMs: input.eventInput.durationMs ?? null,
    upstreamEventId: specified?.upstreamEventId ?? input.previousEventId ?? "NONE",
    dependencies: unique(specified?.dependencies ?? input.eventInput.dependencyRefs?.map((item) => item.resultId) ?? []),
    sessionId: input.ledger.sessionId,
    conversationId: specified?.conversationId ?? input.binding.traceIdentity?.conversationId ?? "UNKNOWN",
    projectId: input.project.projectId || "NONE",
    projectVersion: input.project.projectVersion || "NONE",
    ownerRunId: specified?.ownerRunId ?? "NONE",
    documentProjectionId: specified?.documentProjectionId ?? "NONE",
    artifactId: specified?.artifactId ?? "NONE",
    redactionPolicyId: captureConfiguration.redactionPolicyId,
    retentionPolicyId: captureConfiguration.retentionPolicyId,
    capturePolicyId: captureConfiguration.capturePolicyId,
    captureLevel: captureConfiguration.captureLevel,
    captureReason: captureConfiguration.captureReason,
    replayOfTraceRunId: captureConfiguration.replayOfTraceRunId,
    ...(specified?.semanticTransformation ? { semanticTransformation: clone(specified.semanticTransformation) } : {}),
    ...(specified?.actionDecision ? { actionDecision: clone(specified.actionDecision) } : {}),
    ...(specified?.forensicPayload ? { forensicPayload: clone(specified.forensicPayload) } : {}),
    traceMutatesProduct: false,
    traceDecides: false,
    traceRepairs: false,
    traceJudgesScience: false,
  };
};

export const appendScientificExecutionTraceEvent = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  runId: string;
  event: ScientificExecutionTraceEventInput;
}): { ledger: Readonly<ScientificExecutionTraceLedger>; event: Readonly<ScientificExecutionTraceEvent> } => {
  const current = rehydrateScientificExecutionTraceLedger(input.ledger);
  assertNoForbiddenData(input.event);
  validateMetadata(input.event.technicalMetadata ?? {});
  if (input.event.error) validateCode(input.event.error.code);
  if (input.event.diagnostic) validateCode(input.event.diagnostic.code);
  const binding = bindingFor(current, input.runId);
  const runEvents = eventsFor(current, input.runId);
  if (runEvents.some(isTerminal)) throw new Error("SCIENTIFIC_TRACE_FINALIZED_RUN_IS_IMMUTABLE");
  const previous = runEvents.at(-1) ?? null;
  if (!previous && !["RUN_STARTED", "USER_TURN_RECEIVED", "TRACE_RUN_STARTED"].includes(input.event.eventType)) {
    throw new Error("SCIENTIFIC_TRACE_RUN_START_EVENT_MISSING");
  }
  if (previous && input.event.eventType === "RUN_STARTED") throw new Error("SCIENTIFIC_TRACE_DUPLICATE_RUN_START");
  const stale = input.event.stale ?? {
    status: "NOT_EVALUATED" as const,
    expectedProject: null,
    receivedProject: null,
    expectedDependencyRefs: [],
    receivedDependencyRefs: [],
  };
  const sequence = runEvents.length + 1;
  const eventProject = clone(input.event.common?.project ?? binding.project);
  const logicalBase: Omit<ScientificExecutionTraceEvent, "logicalDigest" | "eventDigest"> = {
    contract: "SCIENTIFIC_EXECUTION_TRACE_EVENT",
    schemaVersion: SCIENTIFIC_EXECUTION_TRACE_EVENT_SCHEMA_VERSION,
    eventId: "PENDING",
    runId: input.runId,
    sequence,
    eventType: input.event.eventType,
    timestamp: input.event.timestamp,
    owner: input.event.owner ?? "TRACE",
    engine: input.event.engine ?? null,
    engineVersion: input.event.engineVersion ?? null,
    project: eventProject,
    requestRef: clone(input.event.requestRef ?? null),
    inputOwnerResultRefs: clone([...(input.event.inputOwnerResultRefs ?? [])]),
    dependencyRefs: clone([...(input.event.dependencyRefs ?? [])]),
    outputResultRef: clone(input.event.outputResultRef ?? null),
    status: input.event.status,
    sourceRefs: unique(input.event.sourceRefs ?? []),
    sourceCount: input.event.sourceCount ?? unique(input.event.sourceRefs ?? []).length,
    evidenceRefs: unique(input.event.evidenceRefs ?? []),
    unknownRefs: unique(input.event.unknownRefs ?? []),
    gapRefs: unique(input.event.gapRefs ?? []),
    limitationRefs: unique(input.event.limitationRefs ?? []),
    contradictionRefs: unique(input.event.contradictionRefs ?? []),
    stale: clone(stale),
    durationMs: input.event.durationMs ?? null,
    error: clone(input.event.error ?? null),
    diagnostic: clone(input.event.diagnostic ?? null),
    previousEventId: previous?.eventId ?? null,
    nextExpectedHandoff: input.event.nextExpectedHandoff ?? null,
    technicalMetadata: clone(input.event.technicalMetadata ?? {}),
    appendOnly: true,
    derived: true,
    projectWriteAuthorized: false,
    repairAuthorized: false,
    scientificDecisionAuthorized: false,
    privateReasoningStored: false,
  };
  const eventId = `scientific-trace-event:${logicalDigest({
    runId: input.runId,
    sequence,
    eventType: input.event.eventType,
    previousEventId: previous?.eventId ?? null,
    logical: logicalEventMaterial(logicalBase),
  })}`;
  const withId = { ...logicalBase, eventId };
  const common = commonEnvelopeFor({
    ledger: current,
    binding,
    eventInput: input.event,
    eventId,
    project: eventProject,
    previousEventId: previous?.eventId ?? null,
  });
  if (!validateCommonEnvelope(common, eventId, input.runId)) {
    throw new Error("SCIENTIFIC_TRACE_CAPTURE_EXTENSION_INVALID");
  }
  const withCommon = { ...withId, common };
  const eventLogicalDigest = logicalDigest(logicalEventMaterial(withCommon));
  const event = deepFreeze({
    ...withCommon,
    logicalDigest: eventLogicalDigest,
    eventDigest: logicalDigest(eventMaterial({ ...withCommon, logicalDigest: eventLogicalDigest })),
  });
  const ledger = createLedger({
    contract: current.contract,
    contractVersion: current.contractVersion,
    sessionId: current.sessionId,
    runBindings: [...current.runBindings],
    events: [...current.events, event],
    appendOnly: true,
    derived: true,
    readOnlyObservedArtifacts: true,
    projectWriteAuthorized: false,
    ownerResultWriteAuthorized: false,
    validationRunWriteAuthorized: false,
    repairAuthorized: false,
    scientificDecisionAuthorized: false,
    privateReasoningStored: false,
    traceProfile: current.traceProfile ?? endToEndTraceProfile(),
  });
  return { ledger, event };
};

export const startScientificRun = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  runId: string;
  projectSnapshot: Readonly<ProjectContextSnapshot>;
  initiatorContext: ScientificRunBinding["initiatorContext"];
  startedAt: string;
  createdAt?: string;
  captureConfiguration?: ScientificTraceCaptureConfiguration;
}): { ledger: Readonly<ScientificExecutionTraceLedger>; binding: Readonly<ScientificRunBinding>; event: Readonly<ScientificExecutionTraceEvent>; run: Readonly<ScientificRun> } => {
  const current = rehydrateScientificExecutionTraceLedger(input.ledger);
  if (current.runBindings.some((binding) => binding.runId === input.runId)) throw new Error("SCIENTIFIC_TRACE_DUPLICATE_RUN_ID");
  assertNoForbiddenData(input.initiatorContext);
  const captureConfiguration = clone(input.captureConfiguration ?? DEFAULT_SCIENTIFIC_TRACE_CAPTURE_CONFIGURATION);
  if (!validateCaptureConfiguration(captureConfiguration)) throw new Error("SCIENTIFIC_TRACE_CAPTURE_CONFIGURATION_INVALID");
  if (!["NONE", "UNKNOWN", "NOT_APPLICABLE"].includes(captureConfiguration.replayOfTraceRunId)
    && (captureConfiguration.replayOfTraceRunId === input.runId
      || !current.runBindings.some((binding) => binding.runId === captureConfiguration.replayOfTraceRunId))) {
    throw new Error("SCIENTIFIC_TRACE_REPLAY_LINEAGE_INVALID");
  }
  const material: Omit<ScientificRunBinding, "bindingDigest"> = {
    contract: "SCIENTIFIC_RUN_BINDING",
    schemaVersion: SCIENTIFIC_RUN_SCHEMA_VERSION,
    runId: input.runId,
    project: projectBindingFromSnapshot(input.projectSnapshot),
    initiatorContext: clone(input.initiatorContext),
    startedAt: input.startedAt,
    createdAt: input.createdAt ?? input.startedAt,
    appendOnly: true,
    derived: true,
    projectWriteAuthorized: false,
    traceIdentity: {
      traceRunId: input.runId,
      turnId: "UNKNOWN",
      sessionId: current.sessionId,
      conversationId: "UNKNOWN",
    },
    captureConfiguration,
  };
  const binding = deepFreeze({ ...material, bindingDigest: logicalDigest(bindingMaterial(material)) });
  const withBinding = createLedger({
    contract: current.contract,
    contractVersion: current.contractVersion,
    sessionId: current.sessionId,
    runBindings: [...current.runBindings, binding],
    events: [...current.events],
    appendOnly: true,
    derived: true,
    readOnlyObservedArtifacts: true,
    projectWriteAuthorized: false,
    ownerResultWriteAuthorized: false,
    validationRunWriteAuthorized: false,
    repairAuthorized: false,
    scientificDecisionAuthorized: false,
    privateReasoningStored: false,
    traceProfile: current.traceProfile ?? endToEndTraceProfile(),
  });
  const appended = appendScientificExecutionTraceEvent({
    ledger: withBinding,
    runId: input.runId,
    event: {
      eventType: "RUN_STARTED",
      timestamp: input.startedAt,
      owner: "TRACE",
      engine: "SCIENTIFIC_EXECUTION_TRACE",
      engineVersion: SCIENTIFIC_EXECUTION_TRACE_LEDGER_VERSION,
      status: "RUNNING",
      diagnostic: { stage: "PROJECT_CONTEXT", code: "PROJECT_SNAPSHOT_BOUND" },
    },
  });
  return { ledger: appended.ledger, binding, event: appended.event, run: getScientificRun({ ledger: appended.ledger, runId: input.runId }) };
};

export const NO_PROJECT_TRACE_BINDING: ScientificRunProjectBinding = Object.freeze({
  projectId: "NONE",
  projectVersion: "NONE",
  projectDigest: "NONE",
  snapshotRef: "NONE",
});

export const createProductTraceRunId = (sessionId: string, turnId: string) => `scientific-product-trace:${logicalDigest({ sessionId, turnId })}`;

export const startProductTraceRun = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  traceRunId: string;
  turnId: string;
  conversationId: string;
  startedAt: string;
  sourceDigest: string;
  captureConfiguration?: ScientificTraceCaptureConfiguration;
}): {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  binding: Readonly<ScientificRunBinding>;
  event: Readonly<ScientificExecutionTraceEvent>;
} => {
  const current = rehydrateScientificExecutionTraceLedger(input.ledger);
  if (current.runBindings.some((binding) => binding.runId === input.traceRunId)) throw new Error("SCIENTIFIC_TRACE_DUPLICATE_RUN_ID");
  const captureConfiguration = clone(input.captureConfiguration ?? DEFAULT_SCIENTIFIC_TRACE_CAPTURE_CONFIGURATION);
  if (!validateCaptureConfiguration(captureConfiguration)) throw new Error("SCIENTIFIC_TRACE_CAPTURE_CONFIGURATION_INVALID");
  if (!["NONE", "UNKNOWN", "NOT_APPLICABLE"].includes(captureConfiguration.replayOfTraceRunId)
    && (captureConfiguration.replayOfTraceRunId === input.traceRunId
      || !current.runBindings.some((binding) => binding.runId === captureConfiguration.replayOfTraceRunId))) {
    throw new Error("SCIENTIFIC_TRACE_REPLAY_LINEAGE_INVALID");
  }
  const material: Omit<ScientificRunBinding, "bindingDigest"> = {
    contract: "SCIENTIFIC_RUN_BINDING",
    schemaVersion: SCIENTIFIC_RUN_SCHEMA_VERSION,
    runId: input.traceRunId,
    project: clone(NO_PROJECT_TRACE_BINDING),
    initiatorContext: { kind: "EXPLICIT_PRODUCT_CALL", initiatorRef: input.turnId },
    startedAt: input.startedAt,
    createdAt: input.startedAt,
    appendOnly: true,
    derived: true,
    projectWriteAuthorized: false,
    traceIdentity: {
      traceRunId: input.traceRunId,
      turnId: input.turnId,
      sessionId: current.sessionId,
      conversationId: input.conversationId,
    },
    captureConfiguration,
  };
  const binding = deepFreeze({ ...material, bindingDigest: logicalDigest(bindingMaterial(material)) });
  const withBinding = createLedger({
    contract: current.contract,
    contractVersion: current.contractVersion,
    sessionId: current.sessionId,
    runBindings: [...current.runBindings, binding],
    events: [...current.events],
    appendOnly: true,
    derived: true,
    readOnlyObservedArtifacts: true,
    projectWriteAuthorized: false,
    ownerResultWriteAuthorized: false,
    validationRunWriteAuthorized: false,
    repairAuthorized: false,
    scientificDecisionAuthorized: false,
    privateReasoningStored: false,
    traceProfile: current.traceProfile ?? endToEndTraceProfile(),
  });
  const appended = appendScientificExecutionTraceEvent({
    ledger: withBinding,
    runId: input.traceRunId,
    event: {
      eventType: "USER_TURN_RECEIVED",
      timestamp: input.startedAt,
      owner: "USER",
      engine: "PRODUCT_ENTRY",
      engineVersion: "1.0.0",
      status: "OBSERVED",
      common: {
        stage: "USER_TURN_RECEIVED",
        turnId: input.turnId,
        responsibilityOwner: "USER",
        decisionOwner: "USER",
        executor: "PRODUCT_ENTRY_RUNTIME",
        provider: "NONE",
        componentId: "PRODUCT_ENTRY",
        componentVersion: "1.0.0",
        input: [{ ref: input.turnId, version: "NOT_APPLICABLE", digest: input.sourceDigest }],
        reasonCode: "USER_SUBMISSION_RECEIVED",
        conversationId: input.conversationId,
      },
    },
  });
  return { ledger: appended.ledger, binding, event: appended.event };
};

export const appendProductTraceStage = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  traceRunId: string;
  timestamp: string;
  status: string;
  owner: ScientificTraceOwner;
  envelope: ScientificProductTraceEnvelopeInput;
  error?: ScientificTraceError | null;
  durationMs?: number | null;
}): { ledger: Readonly<ScientificExecutionTraceLedger>; event: Readonly<ScientificExecutionTraceEvent> } => appendScientificExecutionTraceEvent({
  ledger: input.ledger,
  runId: input.traceRunId,
  event: {
    eventType: input.envelope.stage,
    timestamp: input.timestamp,
    owner: input.owner,
    engine: input.envelope.componentId === "NONE" || input.envelope.componentId === "NOT_APPLICABLE" || input.envelope.componentId === "UNKNOWN"
      ? null
      : input.envelope.componentId,
    engineVersion: input.envelope.componentVersion === "NONE" || input.envelope.componentVersion === "NOT_APPLICABLE" || input.envelope.componentVersion === "UNKNOWN"
      ? null
      : input.envelope.componentVersion ?? null,
    status: input.status,
    durationMs: input.durationMs ?? null,
    error: input.error ?? null,
    common: input.envelope,
  },
});

export const commonEnvelopeForScientificTraceEvent = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  event: Readonly<ScientificExecutionTraceEvent>;
}): Readonly<ScientificProductTraceCommonEnvelope> => {
  const ledger = rehydrateScientificExecutionTraceLedger(input.ledger);
  const event = ledger.events.find((candidate) => candidate.eventId === input.event.eventId);
  if (!event) throw new Error("SCIENTIFIC_TRACE_EVENT_NOT_FOUND");
  if (event.common) return event.common;
  const binding = bindingFor(ledger, event.runId);
  return deepFreeze(commonEnvelopeFor({
    ledger,
    binding,
    eventInput: {
      eventType: event.eventType,
      timestamp: event.timestamp,
      owner: event.owner,
      engine: event.engine,
      engineVersion: event.engineVersion,
      requestRef: event.requestRef,
      inputOwnerResultRefs: event.inputOwnerResultRefs,
      dependencyRefs: event.dependencyRefs,
      outputResultRef: event.outputResultRef,
      status: event.status,
      durationMs: event.durationMs,
      error: event.error,
      diagnostic: event.diagnostic,
    },
    eventId: event.eventId,
    project: event.project,
    previousEventId: event.previousEventId,
  }));
};

export const listEndToEndTraceEvents = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  traceRunId: string;
}) => listScientificRunEvents({ ledger: input.ledger, runId: input.traceRunId })
  .map((event) => commonEnvelopeForScientificTraceEvent({ ledger: input.ledger, event }));

export const getScientificExecutionTraceEvent = (input: { ledger: Readonly<ScientificExecutionTraceLedger>; eventId: string }) => {
  const ledger = rehydrateScientificExecutionTraceLedger(input.ledger);
  const event = ledger.events.find((candidate) => candidate.eventId === input.eventId);
  if (!event) throw new Error("SCIENTIFIC_TRACE_EVENT_NOT_FOUND");
  return event;
};

export const listScientificRunEvents = (input: { ledger: Readonly<ScientificExecutionTraceLedger>; runId: string }) => {
  const ledger = rehydrateScientificExecutionTraceLedger(input.ledger);
  bindingFor(ledger, input.runId);
  return deepFreeze([...eventsFor(ledger, input.runId)]);
};

export const getScientificRun = (input: { ledger: Readonly<ScientificExecutionTraceLedger>; runId: string }): Readonly<ScientificRun> => {
  const ledger = rehydrateScientificExecutionTraceLedger(input.ledger);
  const binding = bindingFor(ledger, input.runId);
  const events = eventsFor(ledger, input.runId);
  if (!events.length) throw new Error("SCIENTIFIC_TRACE_EMPTY_RUN_INVALID");
  const last = events.at(-1)!;
  const status: ScientificRun["status"] = ["RUN_COMPLETED", "TRACE_RUN_COMPLETED"].includes(last.eventType)
    ? "COMPLETED"
    : last.eventType === "RUN_FAILED" ? "FAILED" : "RUNNING";
  const run = {
    contract: "SCIENTIFIC_RUN" as const,
    schemaVersion: SCIENTIFIC_RUN_SCHEMA_VERSION,
    runId: binding.runId,
    startedAt: binding.startedAt,
    completedAt: status === "RUNNING" ? null : last.timestamp,
    status,
    project: clone(binding.project),
    initiatorContext: clone(binding.initiatorContext),
    eventCount: events.length,
    firstEventId: events[0].eventId,
    lastEventId: last.eventId,
    logicalDigest: logicalDigest({
      project: binding.project,
      status,
      events: events.map((event) => event.logicalDigest),
    }),
    createdAt: binding.createdAt,
    immutableAfterFinalization: true as const,
    appendOnly: true as const,
    derived: true as const,
    authoritative: false as const,
  };
  return deepFreeze(run);
};

export const verifyScientificRunDigest = (input: { ledger: Readonly<ScientificExecutionTraceLedger>; run: Readonly<ScientificRun> }) => {
  const reconstructed = getScientificRun({ ledger: input.ledger, runId: input.run.runId });
  return reconstructed.logicalDigest === input.run.logicalDigest
    && reconstructed.eventCount === input.run.eventCount
    && reconstructed.lastEventId === input.run.lastEventId;
};

export const finalizeScientificRun = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  runId: string;
  completedAt: string;
  status: "COMPLETED" | "FAILED";
  errorCode?: string;
  stage?: FirstDivergentStage;
}) => {
  if (input.status === "FAILED" && !input.errorCode) throw new Error("SCIENTIFIC_TRACE_FAILED_RUN_ERROR_REQUIRED");
  const appended = appendScientificExecutionTraceEvent({
    ledger: input.ledger,
    runId: input.runId,
    event: {
      eventType: input.status === "COMPLETED" ? "RUN_COMPLETED" : "RUN_FAILED",
      timestamp: input.completedAt,
      owner: "TRACE",
      engine: "SCIENTIFIC_EXECUTION_TRACE",
      engineVersion: SCIENTIFIC_EXECUTION_TRACE_LEDGER_VERSION,
      status: input.status,
      error: input.errorCode ? { category: "UNKNOWN", code: input.errorCode } : null,
      diagnostic: input.errorCode ? { stage: input.stage ?? "UNKNOWN_STAGE", code: input.errorCode } : null,
    },
  });
  return { ledger: appended.ledger, event: appended.event, run: getScientificRun({ ledger: appended.ledger, runId: input.runId }) };
};

export const findScientificRunsByProject = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  projectId: string;
  projectVersion: string;
  projectDigest: string;
}) => {
  const ledger = rehydrateScientificExecutionTraceLedger(input.ledger);
  return deepFreeze(ledger.runBindings.filter((binding) => binding.project.projectId === input.projectId
    && binding.project.projectVersion === input.projectVersion
    && binding.project.projectDigest === input.projectDigest)
    .map((binding) => getScientificRun({ ledger, runId: binding.runId })));
};

export const findScientificTraceEventsByProject = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  projectId: string;
  projectVersion: string;
  projectDigest: string;
}) => {
  const ledger = rehydrateScientificExecutionTraceLedger(input.ledger);
  return deepFreeze(ledger.events.filter((event) => event.project.projectId === input.projectId
    && event.project.projectVersion === input.projectVersion
    && event.project.projectDigest === input.projectDigest));
};

export const findScientificTraceEventsByOwnerResult = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  resultId: string;
}) => {
  const ledger = rehydrateScientificExecutionTraceLedger(input.ledger);
  return deepFreeze(ledger.events.filter((event) => (
    event.outputResultRef?.artifactType === "OWNER_RESULT"
      && event.outputResultRef.artifactId === input.resultId
  ) || event.inputOwnerResultRefs.some((ref) => ref.artifactType === "OWNER_RESULT" && ref.artifactId === input.resultId)));
};

export const findScientificTraceEventsByValidationRun = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  validationRunId: string;
}) => {
  const ledger = rehydrateScientificExecutionTraceLedger(input.ledger);
  return deepFreeze(ledger.events.filter((event) => (
    event.outputResultRef?.artifactType === "VALIDATION_RUN"
      && event.outputResultRef.artifactId === input.validationRunId
  ) || event.inputOwnerResultRefs.some((ref) => ref.artifactType === "VALIDATION_RUN"
    && ref.artifactId === input.validationRunId)));
};

const referenceHashes = (values: readonly string[], prefix: string) => unique(values.map((value) => `${prefix}:${logicalDigest(value)}`));

const collectBoundedReferences = (input: unknown, options: {
  collectionKeys: readonly string[];
  identifierKeys: readonly string[];
  prefix: string;
  preserveStringRefs?: boolean;
}): string[] => {
  const collected: string[] = [];
  const visit = (value: unknown, depth: number) => {
    if (depth > 10 || collected.length >= 500 || !value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, depth + 1));
      return;
    }
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (options.collectionKeys.includes(key) && Array.isArray(nested)) {
        for (const item of nested) {
          if (typeof item === "string") {
            collected.push(options.preserveStringRefs && key.toLowerCase().endsWith("refs")
              ? item
              : `${options.prefix}:${logicalDigest(item)}`);
          } else if (isRecord(item)) {
            const identifier = options.identifierKeys.map((candidate) => item[candidate]).find((candidate) => typeof candidate === "string");
            collected.push(typeof identifier === "string" ? identifier : `${options.prefix}:${logicalDigest(item)}`);
          }
          if (collected.length >= 500) break;
        }
      }
      visit(nested, depth + 1);
    }
  };
  visit(input, 0);
  return unique(collected);
};

const ownerResultNativeDigest = (result: Readonly<SpecializedOwnerResult> | null) => {
  if (!result?.nativePayload || !isRecord(result.nativePayload)) return result ? logicalDigest(result) : null;
  const digest = result.nativePayload.resultDigest ?? result.nativePayload.outputDigest ?? result.nativePayload.resolutionId;
  return typeof digest === "string" ? digest : logicalDigest(result.nativePayload);
};

const ownerResultRef = (result: Readonly<SpecializedOwnerResult>): ScientificTraceArtifactReference => ({
  artifactType: "OWNER_RESULT",
  owner: result.owner as ScientificTraceOwner,
  artifactId: result.resultId,
  artifactVersion: result.resultVersion,
  artifactDigest: ownerResultNativeDigest(result)!,
});

const ownerResultLedgerEntryRef = (
  entry: Readonly<ProductOwnerResultLedgerEntry>,
  ledgerVersion: string,
): ScientificTraceArtifactReference => ({
  artifactType: "OWNER_RESULT_LEDGER_ENTRY",
  owner: entry.request.owner as ScientificTraceOwner,
  artifactId: entry.entryId,
  artifactVersion: ledgerVersion,
  artifactDigest: entry.entryDigest,
});

const dependencyRef = (dependency: Readonly<ProductOwnerResultDependency>): ScientificTraceDependencyReference => ({
  owner: dependency.owner,
  resultId: dependency.resultId,
  resultVersion: dependency.resultVersion,
  resultDigest: dependency.nativeResultDigest,
});

const requestRef = (entry: Readonly<ProductOwnerResultLedgerEntry>): ScientificTraceRequestReference => ({
  requestId: entry.request.handoffId,
  requestSchemaVersion: `${entry.request.contractVersion}:${entry.request.nativeInputVersion}`,
  requestDigest: logicalDigest(entry.request),
});

const ownerStage = (owner: ScientificTraceOwner): FirstDivergentStage => owner === "KNOWLEDGE"
  ? "KNOWLEDGE_ENGINE"
  : owner === "SCIENTIFIC_THINKING"
    ? "SCIENTIFIC_THINKING_ENGINE"
    : owner === "IMAGING"
      ? "IMAGING_ENGINE"
      : owner === "REGULATORY_RESOLUTION"
        ? "REG_ENGINE"
        : owner === "VAL"
          ? "VAL_ENGINE"
          : "UNKNOWN_STAGE";

const nextHandoffFor = (owner: ScientificTraceOwner) => owner === "KNOWLEDGE"
  ? "KNOWLEDGE_TO_SCIENTIFIC_THINKING"
  : owner === "SCIENTIFIC_THINKING"
    ? "SCIENTIFIC_THINKING_TO_IMAGING"
    : owner === "IMAGING"
      ? "SCIENTIFIC_LOOP_TO_VAL"
      : null;

const traceSummary = (entry: Readonly<ProductOwnerResultLedgerEntry>) => {
  const nativePayload = entry.result?.nativePayload ?? null;
  const sourceRefs = unique([
    ...(entry.result?.provenance ?? []),
    ...collectBoundedReferences(nativePayload, {
      collectionKeys: ["sourceRefs", "sources"],
      identifierKeys: ["sourceId", "id"],
      prefix: "source",
      preserveStringRefs: true,
    }),
  ]);
  const evidenceRefs = unique([
    ...(entry.result?.evidenceRefs ?? []),
    ...collectBoundedReferences(nativePayload, {
      collectionKeys: ["evidenceRefs", "evidence"],
      identifierKeys: ["evidenceId", "linkId", "id"],
      prefix: "evidence",
      preserveStringRefs: true,
    }),
  ]);
  return {
    sourceRefs,
    sourceCount: sourceRefs.length,
    evidenceRefs,
    unknownRefs: unique([
      ...referenceHashes(entry.result?.unknowns ?? entry.observation.unknowns, "unknown"),
      ...collectBoundedReferences(nativePayload, {
        collectionKeys: ["unknowns", "unresolvedUnknowns"],
        identifierKeys: ["unknownId", "id"],
        prefix: "unknown",
      }),
    ]),
    gapRefs: unique([
      ...referenceHashes(entry.result?.gaps ?? entry.observation.gaps, "gap"),
      ...collectBoundedReferences(nativePayload, {
        collectionKeys: ["gaps", "gapRefs"],
        identifierKeys: ["gapId", "code", "id"],
        prefix: "gap",
        preserveStringRefs: true,
      }),
    ]),
    limitationRefs: unique([
      ...referenceHashes(entry.result?.limitations ?? entry.observation.limitations, "limitation"),
      ...collectBoundedReferences(nativePayload, {
        collectionKeys: ["limitations"],
        identifierKeys: ["limitationId", "code", "id"],
        prefix: "limitation",
      }),
    ]),
    contradictionRefs: collectBoundedReferences(nativePayload, {
      collectionKeys: ["contradictions", "contradictionRefs", "controversies"],
      identifierKeys: ["contradictionId", "conflictId", "controversyId", "id"],
      prefix: "contradiction",
      preserveStringRefs: true,
    }),
  };
};

export const recordOwnerInvocationTrace = (trace: ScientificRunTraceRecorder | undefined, input: {
  entry: Readonly<ProductOwnerResultLedgerEntry>;
  ledgerContract: string;
  ledgerVersion: string;
  handoffStage: FirstDivergentStage;
  nextExpectedHandoff?: string | null;
}) => {
  if (!trace) return;
  const entry = input.entry;
  const traceProject = trace.getRun().project;
  if (traceProject.projectId !== entry.request.sourceProject.sourceProjectRef
    || traceProject.projectVersion !== entry.request.sourceProject.sourceProjectVersion
    || traceProject.projectDigest !== entry.request.sourceProject.sourceProjectDigest
    || traceProject.snapshotRef !== entry.request.sourceProject.snapshotDigest) {
    throw new Error("SCIENTIFIC_TRACE_PROJECT_BINDING_MISMATCH");
  }
  const owner = entry.request.owner as ScientificTraceOwner;
  const dependencies = entry.dependencies.map(dependencyRef);
  const resultRef = entry.result ? ownerResultRef(entry.result) : null;
  const summary = traceSummary(entry);
  trace.append({
    eventType: "HANDOFF_STARTED",
    timestamp: entry.observation.startedAt,
    owner,
    status: "STARTED",
    requestRef: requestRef(entry),
    dependencyRefs: dependencies,
    inputOwnerResultRefs: dependencies.map((dependency) => ({
      artifactType: "OWNER_RESULT",
      owner: dependency.owner,
      artifactId: dependency.resultId,
      artifactVersion: dependency.resultVersion,
      artifactDigest: dependency.resultDigest,
    })),
    diagnostic: { stage: input.handoffStage, code: "HANDOFF_INPUT_BOUND" },
  });
  trace.append({
    eventType: "HANDOFF_ACCEPTED",
    timestamp: entry.observation.startedAt,
    owner,
    status: "ACCEPTED",
    requestRef: requestRef(entry),
    dependencyRefs: dependencies,
    diagnostic: { stage: input.handoffStage, code: "HANDOFF_CONTRACT_ACCEPTED" },
  });
  trace.append({
    eventType: "OWNER_INVOCATION_STARTED",
    timestamp: entry.observation.startedAt,
    owner,
    engine: entry.request.capabilityId,
    engineVersion: entry.observation.ownerRuntimeVersion,
    requestRef: requestRef(entry),
    dependencyRefs: dependencies,
    status: "STARTED",
    diagnostic: { stage: ownerStage(owner), code: "OWNER_INVOCATION_STARTED" },
    technicalMetadata: {
      invocationId: entry.observation.invocationId,
      observationContract: entry.observation.contract,
      observationVersion: entry.observation.contractVersion,
      runtimeStarts: entry.observation.runtimeStarts,
      projectWrites: entry.observation.projectWrites,
    },
  });
  const completed = entry.result !== null && ![
    "OWNER_RUNTIME_FAILURE",
    "INVALID_OWNER_RESULT",
    "STALE_OWNER_RESULT",
  ].includes(entry.observation.status);
  const failureCode = completed
    ? null
    : boundedTechnicalCode(entry.observation.failureCode ?? "OWNER_RESULT_NOT_COMPLETED", "OWNER_RUNTIME_FAILURE");
  trace.append({
    eventType: completed ? "OWNER_INVOCATION_COMPLETED" : "OWNER_INVOCATION_FAILED",
    timestamp: entry.observation.completedAt,
    owner,
    engine: entry.request.capabilityId,
    engineVersion: entry.observation.ownerRuntimeVersion,
    requestRef: requestRef(entry),
    dependencyRefs: dependencies,
    outputResultRef: resultRef,
    status: entry.observation.status,
    ...summary,
    durationMs: entry.observation.latencyMs,
    error: completed ? null : { category: "OWNER_RUNTIME", code: failureCode! },
    diagnostic: { stage: ownerStage(owner), code: completed ? "OWNER_RESULT_OBSERVED" : failureCode! },
    nextExpectedHandoff: input.nextExpectedHandoff ?? nextHandoffFor(owner),
  });
  trace.append({
    eventType: "RESULT_PERSISTED",
    timestamp: entry.retainedAt,
    owner,
    engine: input.ledgerContract,
    engineVersion: input.ledgerVersion,
    requestRef: requestRef(entry),
    inputOwnerResultRefs: resultRef ? [resultRef] : [],
    dependencyRefs: dependencies,
    outputResultRef: ownerResultLedgerEntryRef(entry, input.ledgerVersion),
    status: entry.result ? "OWNER_RESULT_RETAINED" : "FAILED_OBSERVATION_RETAINED",
    ...summary,
    diagnostic: { stage: "OWNER_RESULT_PERSISTENCE", code: "OWNER_LEDGER_ENTRY_APPENDED" },
    nextExpectedHandoff: input.nextExpectedHandoff ?? nextHandoffFor(owner),
    technicalMetadata: {
      ledgerContract: input.ledgerContract,
      ledgerVersion: input.ledgerVersion,
      entryId: entry.entryId,
      entryDigest: entry.entryDigest,
      callerRef: entry.callerRef,
    },
  });
};

export const recordRejectedHandoffTrace = (trace: ScientificRunTraceRecorder | undefined, input: {
  timestamp: string;
  owner: ScientificTraceOwner;
  stage: FirstDivergentStage;
  code: string;
  expectedProject?: ScientificRunProjectBinding | null;
  receivedProject?: ScientificRunProjectBinding | null;
  expectedDependencyRefs?: readonly ScientificTraceDependencyReference[];
  receivedDependencyRefs?: readonly ScientificTraceDependencyReference[];
  stale?: boolean;
}) => {
  if (!trace) return;
  const code = boundedTechnicalCode(input.code, "BOUNDARY_REJECTION");
  validateCode(code);
  trace.append({
    eventType: "HANDOFF_STARTED",
    timestamp: input.timestamp,
    owner: input.owner,
    status: "STARTED",
    diagnostic: { stage: input.stage, code: "HANDOFF_VALIDATION_STARTED" },
  });
  if (input.stale) {
    trace.append({
      eventType: "STALE_RESULT_REJECTED",
      timestamp: input.timestamp,
      owner: input.owner,
      status: "STALE_REJECTED",
      stale: {
        status: "STALE_REJECTED",
        expectedProject: input.expectedProject ?? null,
        receivedProject: input.receivedProject ?? null,
        expectedDependencyRefs: input.expectedDependencyRefs ?? [],
        receivedDependencyRefs: input.receivedDependencyRefs ?? [],
      },
      error: { category: "BOUNDARY_REJECTION", code },
      diagnostic: { stage: "STALE_VALIDATION", code },
    });
  }
  trace.append({
    eventType: "HANDOFF_REJECTED",
    timestamp: input.timestamp,
    owner: input.owner,
    status: "REJECTED",
    stale: input.stale ? {
      status: "STALE_REJECTED",
      expectedProject: input.expectedProject ?? null,
      receivedProject: input.receivedProject ?? null,
      expectedDependencyRefs: input.expectedDependencyRefs ?? [],
      receivedDependencyRefs: input.receivedDependencyRefs ?? [],
    } : undefined,
    error: { category: "BOUNDARY_REJECTION", code },
    diagnostic: { stage: input.stage, code },
  });
};

const validationRunRef = (entry: Readonly<ProductValidationRunLedgerEntry>): ScientificTraceArtifactReference => ({
  artifactType: "VALIDATION_RUN",
  owner: "VAL",
  artifactId: entry.run.validationRunId,
  artifactVersion: entry.profile.profileVersion,
  artifactDigest: entry.run.resultDigest,
});

const validationRunLedgerEntryRef = (
  entry: Readonly<ProductValidationRunLedgerEntry>,
  ledgerVersion: string,
): ScientificTraceArtifactReference => ({
  artifactType: "VALIDATION_RUN_LEDGER_ENTRY",
  owner: "VAL",
  artifactId: entry.entryId,
  artifactVersion: ledgerVersion,
  artifactDigest: entry.entryDigest,
});

export const recordValidationRunTrace = (trace: ScientificRunTraceRecorder | undefined, input: {
  entry: Readonly<ProductValidationRunLedgerEntry>;
  ledgerContract: string;
  ledgerVersion: string;
  startedAt: string;
  completedAt: string;
  durationMs?: number | null;
}) => {
  if (!trace) return;
  const traceProject = trace.getRun().project;
  if (traceProject.projectId !== input.entry.projectSnapshotRef.projectId
    || traceProject.projectVersion !== input.entry.projectSnapshotRef.projectVersion
    || traceProject.projectDigest !== input.entry.projectSnapshotRef.projectDigest
    || traceProject.snapshotRef !== input.entry.projectSnapshotRef.snapshotDigest) {
    throw new Error("SCIENTIFIC_TRACE_PROJECT_BINDING_MISMATCH");
  }
  const ownerRefs: ScientificTraceArtifactReference[] = input.entry.ownerResultRefs.map((ref) => ({
    artifactType: "OWNER_RESULT",
    owner: ref.owner,
    artifactId: ref.resultId,
    artifactVersion: ref.resultVersion,
    artifactDigest: ref.nativeResultDigest,
  }));
  trace.append({
    eventType: "HANDOFF_STARTED",
    timestamp: input.startedAt,
    owner: "VAL",
    inputOwnerResultRefs: ownerRefs,
    status: "STARTED",
    diagnostic: { stage: "VAL_INPUT_ADAPTER", code: "VAL_INPUT_CHAIN_BOUND" },
  });
  trace.append({
    eventType: "HANDOFF_ACCEPTED",
    timestamp: input.startedAt,
    owner: "VAL",
    inputOwnerResultRefs: ownerRefs,
    status: "ACCEPTED",
    diagnostic: { stage: "VAL_INPUT_ADAPTER", code: "VAL_INPUT_CHAIN_ACCEPTED" },
  });
  trace.append({
    eventType: "VALIDATION_STARTED",
    timestamp: input.startedAt,
    owner: "VAL",
    engine: input.entry.profile.validationEngineId,
    engineVersion: input.entry.profile.validationEngineVersion,
    inputOwnerResultRefs: ownerRefs,
    status: "STARTED",
    diagnostic: { stage: "VAL_ENGINE", code: "VALIDATION_STARTED" },
    technicalMetadata: {
      profileId: input.entry.profile.profileId,
      profileVersion: input.entry.profile.profileVersion,
      scientificQualificationClaimed: input.entry.profile.scientificQualificationClaimed,
    },
  });
  trace.append({
    eventType: "VALIDATION_COMPLETED",
    timestamp: input.completedAt,
    owner: "VAL",
    engine: input.entry.profile.validationEngineId,
    engineVersion: input.entry.profile.validationEngineVersion,
    inputOwnerResultRefs: ownerRefs,
    outputResultRef: validationRunRef(input.entry),
    status: input.entry.boundedStatus,
    durationMs: input.durationMs ?? null,
    diagnostic: { stage: "VAL_ENGINE", code: "STRUCTURAL_FIDELITY_OBSERVED" },
    technicalMetadata: {
      boundedStatus: input.entry.boundedStatus,
      scientificQualificationClaimed: false,
      repairAuthorized: false,
    },
  });
  trace.append({
    eventType: "RESULT_PERSISTED",
    timestamp: input.entry.retainedAt,
    owner: "VAL",
    engine: input.ledgerContract,
    engineVersion: input.ledgerVersion,
    inputOwnerResultRefs: [...ownerRefs, validationRunRef(input.entry)],
    outputResultRef: validationRunLedgerEntryRef(input.entry, input.ledgerVersion),
    status: "VALIDATION_RUN_RETAINED",
    diagnostic: { stage: "OWNER_RESULT_PERSISTENCE", code: "VALIDATION_LEDGER_ENTRY_APPENDED" },
    technicalMetadata: {
      ledgerContract: input.ledgerContract,
      ledgerVersion: input.ledgerVersion,
      validationEntryId: input.entry.entryId,
      validationEntryDigest: input.entry.entryDigest,
      callerRef: input.entry.callerRef,
    },
  });
};

export const createScientificRunTraceRecorder = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  runId: string;
  projectSnapshot: Readonly<ProjectContextSnapshot>;
  initiatorContext: ScientificRunBinding["initiatorContext"];
  startedAt: string;
  createdAt?: string;
}): ScientificRunTraceRecorder => {
  let current = startScientificRun(input).ledger;
  const recorder: ScientificRunTraceRecorder = {
    runId: input.runId,
    append: (eventInput) => {
      const appended = appendScientificExecutionTraceEvent({ ledger: current, runId: input.runId, event: eventInput });
      current = appended.ledger;
      return appended.event;
    },
    complete: (completedAt) => {
      const finalized = finalizeScientificRun({ ledger: current, runId: input.runId, completedAt, status: "COMPLETED" });
      current = finalized.ledger;
      return finalized.run;
    },
    fail: (completedAt, errorCode, stage = "UNKNOWN_STAGE") => {
      const finalized = finalizeScientificRun({ ledger: current, runId: input.runId, completedAt, status: "FAILED", errorCode, stage });
      current = finalized.ledger;
      return finalized.run;
    },
    getLedger: () => current,
    getRun: () => getScientificRun({ ledger: current, runId: input.runId }),
  };
  return Object.freeze(recorder);
};

const normalizedTraceText = (value: string) => value
  .normalize("NFKD")
  .replace(/\p{M}/gu, "")
  .toLocaleLowerCase("fr-FR")
  .replace(/[’']/gu, " ")
  .replace(/[^\p{L}\p{N}]+/gu, " ")
  .replace(/\s+/gu, " ")
  .trim();

const redactBoundedTraceText = (value: string) => value
  .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/giu, "[REDACTED_PRIVATE_KEY]")
  .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/giu, "Bearer [REDACTED]")
  .replace(/\bsk-[A-Za-z0-9_-]{8,}/giu, "[REDACTED_API_KEY]")
  .replace(/\bAIza[A-Za-z0-9_-]{12,}/gu, "[REDACTED_API_KEY]")
  .replace(/\b(authorization|cookie|password|credential|api[_ -]?key)\s*[:=]\s*[^\s,;]+/giu, "$1=[REDACTED]")
  .replace(/[\r\n]+/gu, " ")
  .slice(0, 1024);

/**
 * Compatibility boundary for ProductBridgeTrace text fields. New CORE and
 * DIAGNOSTIC captures store only a digest reference. FORENSIC capture is
 * explicit, bounded and redacted before storage.
 */
export const captureProductBridgeTraceText = (input: {
  value: string;
  field: "SOURCE_TEXT" | "PROVIDER_CONTEXT" | "SYSTEM_INSTRUCTION" | "ASSISTANT_REPLY" | "ERROR_MESSAGE";
  captureConfiguration?: ScientificTraceCaptureConfiguration;
}) => {
  const captureConfiguration = input.captureConfiguration ?? DEFAULT_SCIENTIFIC_TRACE_CAPTURE_CONFIGURATION;
  if (!validateCaptureConfiguration(captureConfiguration)) throw new Error("SCIENTIFIC_TRACE_CAPTURE_CONFIGURATION_INVALID");
  if (captureConfiguration.captureLevel !== "LEVEL_3_FORENSIC") {
    return `[MINIMIZED:${input.field}:${logicalDigest(input.value)}]`;
  }
  return redactBoundedTraceText(input.value);
};

const traceTextContains = (text: string, expressions: readonly string[]) => {
  const normalizedText = normalizedTraceText(text);
  return expressions.some((expression) => {
    const normalizedExpression = normalizedTraceText(expression);
    return normalizedExpression.length > 0 && normalizedText.includes(normalizedExpression);
  });
};

const lastFormulatedQuestion = (assistantReply: string) => {
  const sentences = assistantReply
    .split(/(?<=[.!?])\s+/gu)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  return [...sentences].reverse().find((sentence) => sentence.endsWith("?")) ?? null;
};

const defaultTraceDimensionProbes = (routing: CreatePreProjectScientificTraceSegmentInput["routing"]): readonly PreProjectTraceDimensionProbe[] => {
  if (routing.explicitScientificDimensions?.length) return routing.explicitScientificDimensions.map((dimension) => ({
    dimensionRef: dimension.dimensionRef,
    expressions: [dimension.sourceText],
  }));
  return routing.scientificContext.preservedScientificTerms.map((term) => ({
    dimensionRef: `routing-term:${logicalDigest(normalizedTraceText(term)).slice(0, 16)}`,
    expressions: [term],
  }));
};

/**
 * Creates the pre-Project segment carried by the existing bridgeTrace. It only
 * observes artifacts already produced by routing and the provider boundary.
 * Diagnostic probes are optional and never participate in routing or provider
 * request construction.
 */
export const createPreProjectScientificTraceSegment = (
  input: CreatePreProjectScientificTraceSegmentInput,
): Readonly<PreProjectScientificTraceSegment> => {
  const question = lastFormulatedQuestion(input.providerBoundary.assistantReply);
  const captureMode = input.captureMode ?? "MINIMIZED";
  const captureConfiguration = input.captureConfiguration ?? createScientificTraceCaptureConfiguration(captureMode === "DIAGNOSTIC_FULL"
    ? { captureLevel: "LEVEL_2_DIAGNOSTIC", captureReason: "MANUAL_DIAGNOSTIC" }
    : undefined);
  if (!validateCaptureConfiguration(captureConfiguration)) throw new Error("SCIENTIFIC_TRACE_CAPTURE_CONFIGURATION_INVALID");
  // Compatibility for the pre-02B diagnostic adapter only. New level-based
  // DIAGNOSTIC capture is structured and never stores these historical texts.
  const capturesFullText = captureMode === "DIAGNOSTIC_FULL" && input.captureConfiguration === undefined;
  const minimized = (field: string, digest: string) => `[MINIMIZED:${field}:${digest}]`;
  const sourceTextDigest = logicalDigest(input.sourceText);
  const contextDigest = logicalDigest(input.providerBoundary.context);
  const systemInstructionDigest = logicalDigest(input.providerBoundary.systemInstruction);
  const assistantReplyDigest = logicalDigest(input.providerBoundary.assistantReply);
  const questionDigest = question ? logicalDigest(question) : null;
  const governedPreProjectNavigation = input.request.preProjectNavigation;
  const probes = input.diagnosticDimensionProbes ?? defaultTraceDimensionProbes(input.routing);
  const routingMaterial = [
    input.routing.scientificContext.centralScientificObject,
    ...input.routing.scientificContext.preservedScientificTerms,
    ...input.routing.scientificContext.missingInformation,
    ...(governedPreProjectNavigation
      ? input.routing.explicitScientificDimensions?.map((dimension) => dimension.sourceText) ?? []
      : []),
  ].join("\n");
  const observations: readonly PreProjectTraceDimensionObservation[] = probes.map((probe) => {
    const explicitlyProvided = traceTextContains(input.sourceText, probe.expressions);
    const statusAt = (text: string): PreProjectTraceDimensionStageStatus => !explicitlyProvided
      ? "NOT_EXPLICITLY_PROVIDED"
      : traceTextContains(text, probe.expressions) ? "PRESENT" : "NOT_PRESENT";
    return {
      dimensionRef: probe.dimensionRef,
      expressions: [...probe.expressions],
      explicitlyProvided,
      postEntryRouting: statusAt(routingMaterial),
      providerContext: statusAt(input.providerBoundary.context),
      assistantReply: statusAt(input.providerBoundary.assistantReply),
      formulatedQuestion: statusAt(question ?? ""),
    };
  });
  const explicitDimensions = observations.filter((item) => item.explicitlyProvided);
  const dimensionsRetained = explicitDimensions
    .filter((item) => item.formulatedQuestion === "PRESENT")
    .map((item) => item.dimensionRef);
  const dimensionsDiscarded = explicitDimensions
    .filter((item) => item.formulatedQuestion === "NOT_PRESENT")
    .map((item) => item.dimensionRef);
  const queryOwnsWhat = governedPreProjectNavigation?.owner === "QUERY_NAVIGATION"
    || (input.request.requestKind === "POST_ADOPTION_QRY_CONTINUATION"
      && input.request.conversation.interactionContext?.owner === "QUERY_NAVIGATION");
  const decisionOwner: PreProjectTraceOwner = queryOwnsWhat
    ? "QUERY_NAVIGATION"
    : input.providerBoundary.provider === "GOOGLE_GEMINI" ? "GEMINI_CONVERSATION_MODEL" : "LOCAL_RUNTIME";
  const formulationOwner: PreProjectTraceOwner = input.providerBoundary.formulationOwner
    ?? (input.providerBoundary.provider === "GOOGLE_GEMINI"
    ? "GEMINI_CONVERSATION_MODEL"
    : input.providerBoundary.provider && input.providerBoundary.provider !== "NONE" ? "LOCAL_RUNTIME" : "NONE");
  const action: Extract<PreProjectScientificTracePoint, { sequence: 2 }>["action"] = governedPreProjectNavigation?.action ?? (question
    ? "ASK_QUESTION"
    : /\bpropos(?:e|ons|ition|er)\b/iu.test(input.providerBoundary.assistantReply) ? "PROPOSE" : "RESPOND");
  const qryPurpose = governedPreProjectNavigation?.selectedInformationNeed
    ?? (queryOwnsWhat ? input.request.conversation.interactionContext?.purpose ?? null : null);
  const exactRealizationDirective = governedPreProjectNavigation?.realizationDirective ?? qryPurpose;
  const qryPurposeDigest = qryPurpose ? logicalDigest(qryPurpose) : null;
  const exactRealizationDirectiveDigest = exactRealizationDirective ? logicalDigest(exactRealizationDirective) : null;
  const points: PreProjectScientificTracePoint[] = [{
    sequence: 1,
    point: "POST_ENTRY_ROUTING_INTENT_DIMENSIONS",
    owner: "PRODUCT_ENTRY_ROUTER",
    sourceTurnRef: input.sourceTurnRef,
    sourceText: capturesFullText ? input.sourceText : minimized("SOURCE_TEXT", sourceTextDigest),
    sourceTextDigest,
    sourceTextCapture: captureMode,
    routeIntent: input.routing.routeIntent,
    routeReasons: [...input.routing.routeReasons],
    centralScientificObject: input.routing.scientificContext.centralScientificObject,
    preservedScientificTerms: [...input.routing.scientificContext.preservedScientificTerms],
    missingInformation: [...input.routing.scientificContext.missingInformation],
    dimensionObservations: observations,
  }, {
    sequence: 2,
    point: "ASK_VS_PROPOSE_DECISION",
    action,
    owner: decisionOwner,
    justification: governedPreProjectNavigation?.scientificReason ?? qryPurpose,
    justificationStatus: queryOwnsWhat ? "EXPLICIT_QRY_PURPOSE" : "NOT_EXPOSED_BY_CURRENT_RUNTIME",
    valueOfInformation: governedPreProjectNavigation?.expectedInformationGain ?? null,
    valueOfInformationStatus: governedPreProjectNavigation ? "AVAILABLE" : "NOT_AVAILABLE",
    explicitlyProvidedInformation: governedPreProjectNavigation?.alreadyProvidedInformationRefs
      ?? (capturesFullText ? [input.sourceText] : [`source-turn:${input.sourceTurnRef}:digest:${sourceTextDigest}`]),
    candidateAlternatives: governedPreProjectNavigation?.candidateAlternatives ?? [],
    rejectedAlternatives: governedPreProjectNavigation?.rejectedAlternatives ?? [],
    rejectionReasons: governedPreProjectNavigation?.rejectionReasons ?? [],
  }, {
    sequence: 3,
    point: "WHAT_TO_ASK_SPECIFICATION",
    owner: decisionOwner,
    informationSought: capturesFullText ? exactRealizationDirective ?? question : null,
    informationSoughtDigest: exactRealizationDirectiveDigest ?? questionDigest,
    informationSoughtRef: governedPreProjectNavigation?.selectedInformationNeedRef ?? null,
    informationSoughtPresent: Boolean(exactRealizationDirective ?? question),
    scientificJustification: governedPreProjectNavigation?.scientificReason ?? qryPurpose,
    dimensionsRetained: governedPreProjectNavigation?.alreadyProvidedInformationRefs ?? dimensionsRetained,
    dimensionsDiscarded: governedPreProjectNavigation ? [] : dimensionsDiscarded,
    discardReasons: governedPreProjectNavigation
      ? {}
      : Object.fromEntries(dimensionsDiscarded.map((dimensionRef) => [dimensionRef, null])),
    specificationStatus: queryOwnsWhat
      ? "EXPLICIT_QRY_SPECIFICATION"
      : question ? "INFERRED_POST_HOC_FROM_LLM_QUESTION" : "NOT_APPLICABLE",
  }, {
    sequence: 4,
    point: "QUESTION_FORMULATION_BOUNDARY",
    owner: formulationOwner,
    whatExactTransmittedToLlm: capturesFullText ? exactRealizationDirective : null,
    whatExactTransmittedToLlmDigest: exactRealizationDirectiveDigest ?? qryPurposeDigest,
    contextTransmittedToLlm: capturesFullText ? input.providerBoundary.context : minimized("PROVIDER_CONTEXT", contextDigest),
    contextTransmittedToLlmDigest: contextDigest,
    systemInstructionTransmittedToLlm: capturesFullText
      ? input.providerBoundary.systemInstruction
      : minimized("SYSTEM_INSTRUCTION", systemInstructionDigest),
    systemInstructionTransmittedToLlmDigest: systemInstructionDigest,
    formulatedQuestion: capturesFullText ? question : null,
    formulatedQuestionDigest: questionDigest,
    formulatedQuestionPresent: Boolean(question),
    assistantReply: capturesFullText
      ? input.providerBoundary.assistantReply
      : minimized("ASSISTANT_REPLY", assistantReplyDigest),
    assistantReplyDigest,
    provider: input.providerBoundary.provider,
    model: input.providerBoundary.model,
  }];
  const material = {
    contract: PRE_PROJECT_SCIENTIFIC_TRACE_SEGMENT_CONTRACT,
    contractVersion: PRE_PROJECT_SCIENTIFIC_TRACE_SEGMENT_VERSION,
    correlation: {
      traceLedgerContract: SCIENTIFIC_EXECUTION_TRACE_LEDGER_CONTRACT,
      sessionId: input.sessionId,
      sourceTurnRef: input.sourceTurnRef,
      ...(input.traceRunId ? { traceRunId: input.traceRunId } : {}),
    },
    points,
    appendOnly: true,
    passive: true,
    readOnly: true,
    traceDecides: false,
    traceRepairs: false,
    projectWriteAuthorized: false,
    conversationMutationAuthorized: false,
    providerInputMutationAuthorized: false,
    privateReasoningStored: false,
    redactionPolicyId: captureConfiguration.redactionPolicyId,
    retentionPolicyId: captureConfiguration.retentionPolicyId,
    capturePolicyId: captureConfiguration.capturePolicyId,
    captureConfiguration,
    captureMode,
  } as const;
  return deepFreeze({ ...material, segmentDigest: logicalDigest(material) });
};

const preProjectOwnerAsTraceOwner = (owner: PreProjectTraceOwner): ScientificTraceOwner => owner === "PRODUCT_ENTRY_ROUTER"
  ? "PRODUCT_ENTRY_ROUTER"
  : owner === "QUERY_NAVIGATION" ? "QUERY_NAVIGATION"
    : owner === "GEMINI_CONVERSATION_MODEL" ? "CONVERSATION_MODEL"
      : owner === "LOCAL_RUNTIME" ? "TRACE"
        : "TRACE";

const diagnosticDimension = (
  observation: PreProjectTraceDimensionObservation,
  status: string,
): ScientificTraceSemanticDimension => ({
  dimensionId: observation.dimensionRef,
  source: "PRE_PROJECT_TRACE_DIMENSION_OBSERVATION",
  status,
  reasonCode: "UNKNOWN",
});

const diagnosticTransformationFor = (input: {
  observations: readonly PreProjectTraceDimensionObservation[];
  stageStatus: (observation: PreProjectTraceDimensionObservation) => PreProjectTraceDimensionStageStatus;
  declarationSource?: ScientificTraceTransformationSource;
}): ScientificTraceSemanticTransformation => {
  const explicitlyProvided = input.observations.filter((observation) => observation.explicitlyProvided);
  const outputDimensions = explicitlyProvided.map((observation) => diagnosticDimension(observation, input.stageStatus(observation)));
  return {
    contract: "SCIENTIFIC_TRACE_SEMANTIC_TRANSFORMATION",
    contractVersion: "1.0.0",
    transformationSource: input.declarationSource ?? "LEGACY_ADAPTER",
    inputDimensions: explicitlyProvided.map((observation) => diagnosticDimension(observation, "EXPLICITLY_PROVIDED")),
    outputDimensions,
    retainedDimensions: outputDimensions.filter((dimension) => dimension.status === "PRESENT"),
    transformedDimensions: [],
    droppedDimensions: outputDimensions.filter((dimension) => dimension.status === "NOT_PRESENT"),
    transformationReason: outputDimensions.every((dimension) => dimension.status === "PRESENT")
      ? "EXPLICIT_DIMENSIONS_RETAINED_WITHOUT_SEMANTIC_TRANSFORMATION"
      : "UNKNOWN",
    dropReason: "UNKNOWN",
  };
};

/**
 * Correlates the existing bridgeTrace pre-Project segment into the one durable
 * Scientific Execution Trace ledger. Only identities, bounded codes and
 * digests are copied; provider context and conversation text stay outside the
 * common ledger.
 */
export const recordPreProjectScientificTraceSegment = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  traceRunId: string;
  conversationId: string;
  segment: Readonly<PreProjectScientificTraceSegment>;
  observedAt: string;
}): {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  events: readonly Readonly<ScientificExecutionTraceEvent>[];
} => {
  if (input.segment.correlation.traceRunId && input.segment.correlation.traceRunId !== input.traceRunId) {
    throw new Error("SCIENTIFIC_TRACE_PRE_PROJECT_CORRELATION_MISMATCH");
  }
  const routing = input.segment.points[0] as Extract<PreProjectScientificTracePoint, { sequence: 1 }>;
  const decision = input.segment.points[1] as Extract<PreProjectScientificTracePoint, { sequence: 2 }>;
  const what = input.segment.points[2] as Extract<PreProjectScientificTracePoint, { sequence: 3 }>;
  const formulation = input.segment.points[3] as Extract<PreProjectScientificTracePoint, { sequence: 4 }>;
  const governedByQueryNavigation = decision.owner === "QUERY_NAVIGATION"
    && decision.justificationStatus === "EXPLICIT_QRY_PURPOSE";
  const captureConfiguration = input.segment.captureConfiguration
    ?? createScientificTraceCaptureConfiguration(input.segment.captureMode === "DIAGNOSTIC_FULL"
      ? { captureLevel: "LEVEL_2_DIAGNOSTIC", captureReason: "MANUAL_DIAGNOSTIC" }
      : undefined);
  const started = startProductTraceRun({
    ledger: input.ledger,
    traceRunId: input.traceRunId,
    turnId: input.segment.correlation.sourceTurnRef,
    conversationId: input.conversationId,
    startedAt: input.observedAt,
    sourceDigest: routing.sourceTextDigest,
    captureConfiguration,
  });
  let ledger = started.ledger;
  const events: Readonly<ScientificExecutionTraceEvent>[] = [started.event];
  const add = (stageInput: Parameters<typeof appendProductTraceStage>[0]) => {
    const appended = appendProductTraceStage(stageInput);
    ledger = appended.ledger;
    events.push(appended.event);
  };
  const outputRef = (suffix: string, value: unknown): ScientificTraceVersionedReference => ({
    ref: `${input.traceRunId}:${suffix}`,
    version: PRE_PROJECT_SCIENTIFIC_TRACE_SEGMENT_VERSION,
    digest: logicalDigest(value),
  });
  add({
    ledger,
    traceRunId: input.traceRunId,
    timestamp: input.observedAt,
    status: "SELECTED",
    owner: "PRODUCT_ENTRY_ROUTER",
    durationMs: 0,
    envelope: {
      stage: "ROUTE_SELECTED",
      responsibilityOwner: "PRODUCT_ENTRY_ROUTER",
      decisionOwner: "PRODUCT_ENTRY_ROUTER",
      executor: "PRODUCT_ENTRY_ROUTER",
      provider: "NONE",
      componentId: "PRODUCT_ENTRY_ROUTING",
      componentVersion: "1.0.0",
      input: [{ ref: routing.sourceTurnRef, version: "NOT_APPLICABLE", digest: routing.sourceTextDigest }],
      output: [outputRef("route", { routeIntent: routing.routeIntent, routeReasons: routing.routeReasons })],
      reasonCode: routing.routeReasons[0] ?? "ROUTE_SELECTED_WITHOUT_REASON_CODE",
      completedAt: input.observedAt,
      conversationId: input.conversationId,
    },
  });
  add({
    ledger,
    traceRunId: input.traceRunId,
    timestamp: input.observedAt,
    status: "REPRESENTED",
    owner: "INTENT_ORCHESTRATOR",
    durationMs: 0,
    envelope: {
      stage: "INTENT_REPRESENTED",
      responsibilityOwner: "INTENT_ORCHESTRATOR",
      decisionOwner: "PRODUCT_ENTRY_ROUTER",
      executor: "PRODUCT_ENTRY_ROUTER",
      provider: "NONE",
      componentId: "PRODUCT_ENTRY_ROUTING",
      componentVersion: "1.0.0",
      input: [outputRef("route", { routeIntent: routing.routeIntent, routeReasons: routing.routeReasons })],
      output: [outputRef("intent", {
        centralScientificObject: routing.centralScientificObject,
        preservedScientificTerms: routing.preservedScientificTerms,
        missingInformation: routing.missingInformation,
        explicitDimensionRefs: routing.dimensionObservations
          .filter((observation) => observation.explicitlyProvided)
          .map((observation) => observation.dimensionRef),
      })],
      reasonCode: routing.routeIntent ?? "UNKNOWN",
      completedAt: input.observedAt,
      conversationId: input.conversationId,
      ...(captureConfiguration.captureLevel === "LEVEL_1_CORE" ? {} : {
        semanticTransformation: diagnosticTransformationFor({
          observations: routing.dimensionObservations,
          stageStatus: (observation) => observation.postEntryRouting,
          declarationSource: governedByQueryNavigation ? "COMPONENT_DECLARATION" : "LEGACY_ADAPTER",
        }),
      }),
    },
  });
  const informationOwner = preProjectOwnerAsTraceOwner(decision.owner);
  add({
    ledger,
    traceRunId: input.traceRunId,
    timestamp: input.observedAt,
    status: decision.action,
    owner: informationOwner,
    durationMs: 0,
    envelope: {
      stage: "INFORMATION_NEED_SELECTED",
      responsibilityOwner: decision.owner,
      decisionOwner: decision.owner,
      executor: decision.owner,
      provider: decision.owner === "GEMINI_CONVERSATION_MODEL" ? formulation.provider : "NONE",
      componentId: decision.owner,
      componentVersion: decision.owner === "QUERY_NAVIGATION"
        ? "PD-009-1.0"
        : decision.owner === "GEMINI_CONVERSATION_MODEL" ? formulation.model : "UNKNOWN",
      input: [outputRef("intent", {
        centralScientificObject: routing.centralScientificObject,
        preservedScientificTerms: routing.preservedScientificTerms,
        missingInformation: routing.missingInformation,
        explicitDimensionRefs: routing.dimensionObservations
          .filter((observation) => observation.explicitlyProvided)
          .map((observation) => observation.dimensionRef),
      })],
      output: [outputRef("information-need", {
        action: decision.action,
        owner: decision.owner,
        justificationStatus: decision.justificationStatus,
        valueOfInformationStatus: decision.valueOfInformationStatus,
        specificationStatus: what.specificationStatus,
      })],
      reasonCode: decision.justificationStatus,
      completedAt: input.observedAt,
      conversationId: input.conversationId,
      ...(captureConfiguration.captureLevel === "LEVEL_1_CORE" ? {} : {
        actionDecision: {
          contract: "SCIENTIFIC_TRACE_ACTION_DECISION" as const,
          contractVersion: "1.0.0" as const,
          declarationSource: governedByQueryNavigation ? "COMPONENT_DECLARATION" as const : "LEGACY_ADAPTER" as const,
          askVsPropose: decision.action,
          selectedInformationNeed: decision.action !== "ASK_QUESTION"
            ? "NOT_APPLICABLE"
            : what.informationSoughtRef ?? (what.informationSoughtDigest
              ? `information-need:digest:${what.informationSoughtDigest}`
              : "UNKNOWN"),
          whySelected: decision.justification ?? "UNKNOWN",
          expectedInformationGain: decision.valueOfInformation ?? "UNKNOWN",
          alreadyProvidedInformationRefs: decision.explicitlyProvidedInformation,
          candidateAlternatives: decision.candidateAlternatives ?? [],
          rejectedAlternatives: decision.rejectedAlternatives ?? [],
          rejectionReasons: decision.rejectionReasons ?? [],
        },
      }),
    },
  });
  add({
    ledger,
    traceRunId: input.traceRunId,
    timestamp: input.observedAt,
    status: "REQUESTED",
    owner: preProjectOwnerAsTraceOwner(what.owner),
    durationMs: 0,
    envelope: {
      stage: "QUESTION_REALIZATION_REQUESTED",
      responsibilityOwner: what.owner,
      decisionOwner: what.owner,
      executor: formulation.owner,
      provider: formulation.provider || "NONE",
      componentId: "QUESTION_FORMULATION_BOUNDARY",
      componentVersion: PRE_PROJECT_SCIENTIFIC_TRACE_SEGMENT_VERSION,
      input: [outputRef("information-need", {
        informationSoughtDigest: what.informationSoughtDigest,
        scientificJustificationDigest: what.scientificJustification ? logicalDigest(what.scientificJustification) : null,
        specificationStatus: what.specificationStatus,
      })],
      output: [outputRef("question-realization-request", {
        whatExactTransmittedDigest: formulation.whatExactTransmittedToLlmDigest,
        contextDigest: formulation.contextTransmittedToLlmDigest,
      })],
      reasonCode: what.specificationStatus,
      completedAt: input.observedAt,
      conversationId: input.conversationId,
      ...(captureConfiguration.captureLevel === "LEVEL_1_CORE" ? {} : {
        semanticTransformation: diagnosticTransformationFor({
          observations: routing.dimensionObservations,
          stageStatus: (observation) => governedByQueryNavigation
            ? observation.providerContext
            : observation.formulatedQuestion,
          declarationSource: governedByQueryNavigation ? "COMPONENT_DECLARATION" : "LEGACY_ADAPTER",
        }),
      }),
    },
  });
  add({
    ledger,
    traceRunId: input.traceRunId,
    timestamp: input.observedAt,
    status: formulation.formulatedQuestionPresent ? "REALIZED" : decision.action === "ASK_QUESTION" ? "NO_QUESTION_REALIZED" : "NON_INTERROGATIVE_REALIZATION",
    owner: preProjectOwnerAsTraceOwner(formulation.owner),
    durationMs: 0,
    envelope: {
      stage: "QUESTION_REALIZED",
      responsibilityOwner: what.owner,
      decisionOwner: what.owner,
      executor: formulation.owner,
      provider: formulation.provider || "NONE",
      componentId: "QUESTION_FORMULATION_BOUNDARY",
      componentVersion: formulation.model || "UNKNOWN",
      input: [outputRef("question-realization-request", {
        whatExactTransmittedDigest: formulation.whatExactTransmittedToLlmDigest,
        contextDigest: formulation.contextTransmittedToLlmDigest,
      })],
      output: [outputRef("question-realized", {
        formulatedQuestionDigest: formulation.formulatedQuestionDigest ?? "NONE",
        assistantReplyDigest: formulation.assistantReplyDigest,
      })],
      reasonCode: formulation.formulatedQuestionPresent ? "QUESTION_REALIZED" : decision.action === "ASK_QUESTION" ? "QUESTION_NOT_REALIZED" : "NON_INTERROGATIVE_ACTION_REALIZED",
      completedAt: input.observedAt,
      conversationId: input.conversationId,
      ...(captureConfiguration.captureLevel === "LEVEL_1_CORE" ? {} : {
        semanticTransformation: diagnosticTransformationFor({
          observations: routing.dimensionObservations,
          stageStatus: (observation) => governedByQueryNavigation
            ? observation.assistantReply
            : observation.formulatedQuestion,
          declarationSource: governedByQueryNavigation ? "COMPONENT_DECLARATION" : "LEGACY_ADAPTER",
        }),
      }),
    },
  });
  return { ledger, events: deepFreeze(events) };
};

export type ScientificReplayPlan = {
  contract: "SCIENTIFIC_TRACE_REPLAY_PLAN";
  status: "REPLAY_PLANNABLE" | "PARTIALLY_PLANNABLE" | "NOT_PLANNABLE";
  runId: string;
  fromEventId: string;
  project: ScientificRunProjectBinding;
  eventsToReuse: readonly string[];
  eventsToRecompute: readonly string[];
  requiredRequestRefs: readonly ScientificTraceRequestReference[];
  requiredOwnerResultRefs: readonly ScientificTraceArtifactReference[];
  requiredValidationRunRefs: readonly ScientificTraceArtifactReference[];
  missingComponents: readonly string[];
  executionAuthorized: false;
};

export const buildReplayPlan = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  runId: string;
  fromEventId: string;
}): Readonly<ScientificReplayPlan> => {
  const events = listScientificRunEvents({ ledger: input.ledger, runId: input.runId });
  const fromIndex = events.findIndex((event) => event.eventId === input.fromEventId);
  if (fromIndex < 0) throw new Error("SCIENTIFIC_TRACE_REPLAY_EVENT_NOT_IN_RUN");
  const run = getScientificRun({ ledger: input.ledger, runId: input.runId });
  const downstream = events.slice(fromIndex);
  const requiredRequestRefs = downstream.flatMap((event) => event.requestRef ? [event.requestRef] : []);
  const requiredOwnerResultRefs = downstream.flatMap((event) => [
    ...event.inputOwnerResultRefs.filter((ref) => ref.artifactType === "OWNER_RESULT"),
    ...(event.outputResultRef?.artifactType === "OWNER_RESULT" ? [event.outputResultRef] : []),
  ]);
  const requiredValidationRunRefs = downstream.flatMap((event) => [
    ...event.inputOwnerResultRefs.filter((ref) => ref.artifactType === "VALIDATION_RUN"),
    ...(event.outputResultRef?.artifactType === "VALIDATION_RUN" ? [event.outputResultRef] : []),
  ]);
  const missingComponents = unique([
    ...(downstream.some((event) => ["OWNER_INVOCATION_STARTED", "OWNER_INVOCATION_COMPLETED", "OWNER_INVOCATION_FAILED"].includes(event.eventType) && !event.requestRef)
      ? ["REQUEST_REFERENCE"] : []),
    ...(downstream.some((event) => event.eventType === "OWNER_INVOCATION_FAILED" && !event.outputResultRef)
      ? ["FAILED_OWNER_RESULT_ARTIFACT"] : []),
    ...(run.status === "RUNNING" ? ["FINALIZED_RUN"] : []),
  ]);
  const status = missingComponents.length === 0 ? "REPLAY_PLANNABLE" : requiredRequestRefs.length || requiredOwnerResultRefs.length
    ? "PARTIALLY_PLANNABLE"
    : "NOT_PLANNABLE";
  return deepFreeze({
    contract: "SCIENTIFIC_TRACE_REPLAY_PLAN",
    status,
    runId: input.runId,
    fromEventId: input.fromEventId,
    project: clone(run.project),
    eventsToReuse: events.slice(0, fromIndex).map((event) => event.eventId),
    eventsToRecompute: downstream.map((event) => event.eventId),
    requiredRequestRefs: unique(requiredRequestRefs.map((ref) => JSON.stringify(ref))).map((value) => JSON.parse(value) as ScientificTraceRequestReference),
    requiredOwnerResultRefs: unique(requiredOwnerResultRefs.map((ref) => JSON.stringify(ref))).map((value) => JSON.parse(value) as ScientificTraceArtifactReference),
    requiredValidationRunRefs: unique(requiredValidationRunRefs.map((ref) => JSON.stringify(ref))).map((value) => JSON.parse(value) as ScientificTraceArtifactReference),
    missingComponents,
    executionAuthorized: false as const,
  });
};

const stageForEvent = (event: Readonly<ScientificExecutionTraceEvent>): FirstDivergentStage => {
  if (event.diagnostic?.stage) return event.diagnostic.stage;
  if (event.eventType === "STALE_RESULT_REJECTED") return "STALE_VALIDATION";
  if (event.eventType === "RESULT_PERSISTED") return "OWNER_RESULT_PERSISTENCE";
  return ownerStage(event.owner);
};

export type ScientificRunComparison = {
  contract: "SCIENTIFIC_TRACE_RUN_COMPARISON";
  leftRunId: string;
  rightRunId: string;
  equivalent: boolean;
  comparedEventCount: number;
  firstDivergentStage: FirstDivergentStage | null;
  leftEventId: string | null;
  rightEventId: string | null;
  divergentFields: readonly string[];
  scientificJudgmentPerformed: false;
};

export const compareScientificRuns = (input: {
  leftLedger: Readonly<ScientificExecutionTraceLedger>;
  leftRunId: string;
  rightLedger: Readonly<ScientificExecutionTraceLedger>;
  rightRunId: string;
}): Readonly<ScientificRunComparison> => {
  const left = listScientificRunEvents({ ledger: input.leftLedger, runId: input.leftRunId });
  const right = listScientificRunEvents({ ledger: input.rightLedger, runId: input.rightRunId });
  const count = Math.max(left.length, right.length);
  for (let index = 0; index < count; index += 1) {
    const leftEvent = left[index] ?? null;
    const rightEvent = right[index] ?? null;
    if (leftEvent?.logicalDigest !== rightEvent?.logicalDigest) {
      const fields = unique([
        ...(!leftEvent || !rightEvent ? ["EVENT_PRESENCE"] : []),
        ...(leftEvent?.eventType !== rightEvent?.eventType ? ["EVENT_TYPE"] : []),
        ...(leftEvent?.owner !== rightEvent?.owner ? ["OWNER"] : []),
        ...(leftEvent?.requestRef?.requestDigest !== rightEvent?.requestRef?.requestDigest ? ["REQUEST_DIGEST"] : []),
        ...(leftEvent?.outputResultRef?.artifactDigest !== rightEvent?.outputResultRef?.artifactDigest ? ["OUTPUT_DIGEST"] : []),
        ...(leftEvent?.status !== rightEvent?.status ? ["STATUS"] : []),
        ...((leftEvent?.dependencyRefs ?? []).map((ref) => ref.resultDigest).join("|") !== (rightEvent?.dependencyRefs ?? []).map((ref) => ref.resultDigest).join("|") ? ["DEPENDENCY_DIGESTS"] : []),
      ]);
      return deepFreeze({
        contract: "SCIENTIFIC_TRACE_RUN_COMPARISON",
        leftRunId: input.leftRunId,
        rightRunId: input.rightRunId,
        equivalent: false,
        comparedEventCount: index + 1,
        firstDivergentStage: stageForEvent(leftEvent ?? rightEvent!),
        leftEventId: leftEvent?.eventId ?? null,
        rightEventId: rightEvent?.eventId ?? null,
        divergentFields: fields.length ? fields : ["OBSERVABLE_EVENT_STRUCTURE"],
        scientificJudgmentPerformed: false as const,
      });
    }
  }
  return deepFreeze({
    contract: "SCIENTIFIC_TRACE_RUN_COMPARISON",
    leftRunId: input.leftRunId,
    rightRunId: input.rightRunId,
    equivalent: true,
    comparedEventCount: count,
    firstDivergentStage: null,
    leftEventId: null,
    rightEventId: null,
    divergentFields: [],
    scientificJudgmentPerformed: false as const,
  });
};

export const locateFirstObservableDivergence = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  runId: string;
}) => {
  const events = listScientificRunEvents(input);
  const event = events.find((candidate) => candidate.eventType === "HANDOFF_REJECTED"
    || candidate.eventType === "OWNER_INVOCATION_FAILED"
    || candidate.eventType === "STALE_RESULT_REJECTED"
    || candidate.eventType === "RUN_FAILED") ?? null;
  return deepFreeze({
    readiness: event ? "ATTRIBUTED_FROM_OBSERVABLE_EVENT" as const : "NO_DIVERGENCE_OBSERVED" as const,
    stage: event ? stageForEvent(event) : null,
    eventId: event?.eventId ?? null,
    diagnosticCode: event?.diagnostic?.code ?? null,
    inferenceBeyondObservedStage: false as const,
  });
};
