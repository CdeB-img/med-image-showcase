import type { HumanDecisionEnvelope } from "../protocol-designer/human-decision.js";

export const SCIENTIFIC_INTERPRETATION_CONTRIBUTION_CONTRACT = "SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ENVELOPE" as const;
export const SCIENTIFIC_INTERPRETATION_CONTRIBUTION_VERSION = "1.0.0" as const;
export const DEFAULT_SCIENTIFIC_INTERPRETATION_MODE = "HYBRID_ACTIVE_WITH_LEGACY_FALLBACK" as const;
export const SEMANTIC_AUDIT_L_STATUS = "SHADOW_ONLY_NOT_PRODUCT_ACTIVE" as const;

export const SCIENTIFIC_INTERPRETATION_MODES = [
  "LEGACY_ACTIVE",
  "HYBRID_SHADOW",
  "HYBRID_ACTIVE_WITH_LEGACY_FALLBACK",
] as const;
export type ScientificInterpretationMode = typeof SCIENTIFIC_INTERPRETATION_MODES[number];

export const CONTRIBUTION_MAPPING_STATUSES = [
  "EXACT_CONTRIBUTION",
  "SPLIT_REQUIRED",
  "COMPOSITION_REQUIRED",
  "DOMAIN_REVIEW_REQUIRED",
  "AMBIGUOUS",
  "UNSUPPORTED",
  "DEFERRED",
  "LEGACY_COMPATIBILITY_ONLY",
] as const;
export type ContributionMappingStatus = typeof CONTRIBUTION_MAPPING_STATUSES[number];

export const SCIENTIFIC_INTERPRETATION_FAILURE_CLASSES = [
  "PROVIDER_FAILURE",
  "TRANSPORT_FAILURE",
  "RAW_PERSISTENCE_FAILURE",
  "PARSING_FAILURE",
  "STRUCTURED_CONTRACT_FAILURE",
  "HYBRID_RUNTIME_UNAVAILABLE",
  "SCHEMA_FAILURE",
  "CONTRIBUTION_MAPPING_FAILURE",
  "SEMANTIC_AUDIT_FINDING",
  "SCIENTIFIC_UNDERSTANDING_FAILURE",
  "NOT_EVALUABLE",
] as const;
export type ScientificInterpretationFailureClass = typeof SCIENTIFIC_INTERPRETATION_FAILURE_CLASSES[number];

export type ScientificInterpretationTurn = {
  turnId: string;
  role: "USER" | "NOXIA";
  content: string;
  createdAt?: string;
};

export type ScientificInterpretationConversation = {
  conversationId: string;
  language: "fr" | "en";
  turns: ScientificInterpretationTurn[];
  interactionContext?: {
    interactionRef: string;
    sourceActionRef: string | null;
    owner: string;
    purpose: string;
    expectedResponseKind: "SCIENTIFIC_CONTENT" | "SCIENTIFIC_CORRECTION" | "ROUTE_INTENT" | "QRY_INFORMATION_RESPONSE" | "HUMAN_DECISION_RESPONSE" | "OWNER_MODIFICATION_REQUEST";
    targetRefs: string[];
    informationNeedRefs: string[];
    projectRef: string | null;
    projectVersion: string | null;
    projectDigest: string | null;
  };
};

export type ContributionEpistemicBoundary = {
  ownership: string | null;
  /**
   * PD-003 epistemic state of the represented content. This is deliberately
   * independent from epistemicStatus, which records linguistic/source origin.
   */
  epistemicState?: "KNOWN" | "ASSUMED" | "UNKNOWN" | "WITHHELD" | null;
  epistemicStatus: string | null;
  adoptionStatus: string | null;
  originType?: string | null;
  originStatus?: string | null;
  decisionId?: string | null;
  activeState: boolean | null;
  sourceTurnIds: string[];
  sourceText: string | null;
};

export type ScientificContributionItem = {
  itemId: string;
  semanticIdentity: string | null;
  proposedType: string | null;
  content: string;
  polarity: string | null;
  studyRole: string | null;
  confidence: number | null;
  availabilityClaim?: string | null;
  availabilityScope?: string | null;
  previousItemIds?: string[];
  evidenceRefs?: string[];
  epistemicBoundary: ContributionEpistemicBoundary;
};

export type ScientificContributionRelation = {
  relationId: string;
  relationType: string;
  sourceItemId: string;
  targetItemId: string;
  polarity: string | null;
  confidence: number | null;
  evidenceRefs?: string[];
  epistemicBoundary: ContributionEpistemicBoundary;
};

/**
 * Scientific Contribution transport for PD-003 temporal meaning. These are
 * candidates only: PRJ validates their Project references and owns adoption.
 */
export type ScientificTemporalAnchorCandidate = {
  kind: "TIMEPOINT" | "RELATIVE_EVENT" | "WINDOW" | "INTERVAL";
  direction: "BEFORE" | "AT" | "AFTER" | "UNKNOWN";
  unit: string;
  offset: number | null;
  lowerBound: number | null;
  upperBound: number | null;
  relativeEventLabel: string | null;
  tolerance: null | { lower: number | null; upper: number | null; unit: string };
  reference:
    | { status: "KNOWN"; referenceProjectRef: string }
    | { status: "UNKNOWN"; unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" | "REFERENCE_EVENT_AMBIGUOUS" };
};

export type ScientificTemporalQualificationCandidate = {
  operation: "ADD" | "REMOVE" | "REPLACE";
  qualificationId: string;
  subjectProjectRef: string;
  temporalRole: "ACQUISITION_TIME" | "COLLECTION_TIME" | "PROCESSING_TIME" | "TRANSFORMATION_TIME" | "ANALYSIS_TIME";
  anchor: ScientificTemporalAnchorCandidate | null;
  sourceText: string;
  assertionKind: "USER_STATED" | "USER_ADOPTED_PROPOSAL" | "OWNER_SUPPORTED";
  evidenceRefs: string[];
};

export type ScientificExpectedVariableOccasionCandidate = {
  operation: "ADD" | "REMOVE" | "REPLACE";
  occasionId: string;
  variableProjectRef: string;
  anchor: ScientificTemporalAnchorCandidate | null;
  studyUnitOrGroupRef: string | null;
  applicableContext: string | null;
  sourceText: string;
  assertionKind: "USER_STATED" | "USER_ADOPTED_PROPOSAL" | "OWNER_SUPPORTED";
  evidenceRefs: string[];
};

export type ContributionMapping = {
  sourceItemId: string;
  proposedTargetDomain: string | null;
  proposedTargetTypes: string[];
  mappingStatus: ContributionMappingStatus;
  qualificationOwnerRequired: string | null;
  mappingLimitations: string[];
};

export type ScientificInterpretationFinding = {
  findingId: string;
  code: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  message: string;
  sourceRefs: string[];
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
};

export type ScientificInterpretationContributionEnvelope = {
  contract: typeof SCIENTIFIC_INTERPRETATION_CONTRIBUTION_CONTRACT;
  contractNature: "RUNTIME_CONTRIBUTION_NOT_PD003_ROOT";
  identity: {
    contributionId: string;
    previousContributionId?: string | null;
    contractVersion: typeof SCIENTIFIC_INTERPRETATION_CONTRIBUTION_VERSION;
    runtimeId: string;
    runtimeVersion: string;
    createdAt: string;
    contributionDigest: string;
  };
  source: {
    conversationId: string;
    originalRequest: string;
    turns: ScientificInterpretationTurn[];
    sourceRefs: string[];
    rawOutputRef: string | null;
    rawOutputDigest: string | null;
  };
  runtimeEvidence: {
    provider: string | null;
    model: string | null;
    promptDigest: string | null;
    schemaDigest: string | null;
    configurationDigest: string | null;
    technicalStatus: string;
    parseStatus: "NOT_REQUIRED" | "PENDING" | "PARSED" | "FAILED";
    validationErrors: Array<{ failureClass: ScientificInterpretationFailureClass; message: string; path?: string }>;
  };
  scientificContent: {
    normalizedUnderstanding: string | null;
    routeProposal: { route: string; confidence: number | null; reason: string | null } | null;
    explicitStatements: ScientificContributionItem[];
    candidateObjects: ScientificContributionItem[];
    candidateRelations: ScientificContributionRelation[];
    inferredContext: ScientificContributionItem[];
    contextualCandidates: ScientificContributionItem[];
    negationsAndConstraints: ScientificContributionItem[];
    temporalElements: ScientificContributionItem[];
    ambiguities: ScientificContributionItem[];
    unknowns: ScientificContributionItem[];
    missingInformation: ScientificContributionItem[];
    correctionsAndSupersessions: ScientificContributionItem[];
    openDecisions: ScientificContributionItem[];
    clarificationNeeds: ScientificContributionItem[];
    temporalQualifications?: ScientificTemporalQualificationCandidate[];
    expectedVariableOccasions?: ScientificExpectedVariableOccasionCandidate[];
  };
  epistemicBoundary: {
    candidateIsAdopted: false;
    knowledgeSupportIsProjectDecision: false;
    projectOwnershipTransferred: false;
    humanDecisionEnvelopeRef: string | null;
  };
  mapping: ContributionMapping[];
  audit: {
    deterministicFindings: ScientificInterpretationFinding[];
    semanticAuditFindings: ScientificInterpretationFinding[];
    unresolvedFindings: ScientificInterpretationFinding[];
  };
  decisionBoundary: {
    decisionRequired: boolean;
    decisionEnvelopeRef: string | null;
    permittedHumanDispositions: Array<"ACCEPT_WORKING_BASIS" | "REJECT" | "DEFER" | "REOPEN" | "PARTIAL_SELECTION" | "ROUTE_TO_SPECIALIST">;
    projectWriteAuthorized: false;
  };
};

export type AuthorizedScientificInterpretationContext = {
  sourceRefs?: string[];
  decisionEnvelopeRef?: HumanDecisionEnvelope["decisionId"] | null;
  domainOwner?: string | null;
};

export interface ScientificInterpretationRuntime {
  readonly runtimeId: string;
  readonly runtimeVersion: string;
  interpret(
    conversation: ScientificInterpretationConversation,
    previousState?: ScientificInterpretationContributionEnvelope | null,
    authorizedContext?: AuthorizedScientificInterpretationContext,
  ): Promise<ScientificInterpretationContributionEnvelope>;
}

export interface SemanticAuditRuntime {
  readonly status: typeof SEMANTIC_AUDIT_L_STATUS;
  auditSemantically(
    contribution: ScientificInterpretationContributionEnvelope,
    sourceContext: ScientificInterpretationConversation,
  ): Promise<ScientificInterpretationFinding[]>;
}

export class ScientificInterpretationTechnicalError extends Error {
  constructor(
    readonly failureClass: Extract<ScientificInterpretationFailureClass,
      "PROVIDER_FAILURE" | "TRANSPORT_FAILURE" | "RAW_PERSISTENCE_FAILURE" | "PARSING_FAILURE" | "STRUCTURED_CONTRACT_FAILURE" | "HYBRID_RUNTIME_UNAVAILABLE" | "SCHEMA_FAILURE" | "CONTRIBUTION_MAPPING_FAILURE">,
    message: string,
    readonly rawOutputRef: string | null = null,
    readonly operationId: string | null = null,
  ) {
    super(message);
    this.name = "ScientificInterpretationTechnicalError";
  }
}
