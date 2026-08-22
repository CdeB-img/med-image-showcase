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

export const SCIENTIFIC_INTERPRETATION_TERMINOLOGY_STATUSES = [
  "RESOLVED_PROJECT",
  "RESOLVED_CONVERSATION",
  "RESOLVED_GOVERNED_CONTEXT",
  "RESOLVED_LINGUISTICALLY",
  "AMBIGUOUS",
  "UNRESOLVED",
] as const;
export type ScientificInterpretationTerminologyStatus = typeof SCIENTIFIC_INTERPRETATION_TERMINOLOGY_STATUSES[number];

export type ScientificInterpretationTerminologyEntry = {
  termId: string;
  preferredMeaning: string;
  surfaceForms: string[];
  semanticRoleCandidate: string | null;
  referencedProjectElementIds: string[];
  source: "PROJECT" | "CONVERSATION_USER_DEFINED" | "NOXIA_SUPPORTED_ROLE_VOCABULARY";
};

export type ScientificInterpretationTerminologyContext = {
  lifecycle: "EPHEMERAL_TRACEABLE_NON_AUTHORITATIVE";
  contractNature: "RUNTIME_TERMINOLOGY_CONTEXT_NOT_PD003_OBJECT";
  authoritative: false;
  scope: "CURRENT_INTERPRETATION_TURN";
  entries: ScientificInterpretationTerminologyEntry[];
  resolutionPolicy: "KNOWN_OR_CONTEXT_DEFINED_ELSE_CLARIFY";
};

export type ScientificInterpretationTerminologyResolution = {
  resolutionId: string;
  surfaceForm: string;
  resolvedMeaning: string | null;
  status: ScientificInterpretationTerminologyStatus;
  source: "PROJECT" | "CONVERSATION_USER_DEFINED" | "NOXIA_SUPPORTED_ROLE_VOCABULARY" | "LLM_LINGUISTIC_KNOWLEDGE" | "NONE";
  confidence: number | null;
  alternatives: string[];
  semanticRoleCandidate: string | null;
  referencedProjectElementIds: string[];
  understandingElementIds: string[];
  sourceTurnIds: string[];
  sourceText: string | null;
};

export type ScientificInterpretationSemanticRepairContext = {
  lifecycle: "EPHEMERAL_TRACEABLE_NON_AUTHORITATIVE";
  attempt: 1;
  initialContributionId: string;
  initialContributionDigest: string;
  criticResultDigest: string;
  findings: Array<{
    category: "INFORMATION_LOST" | "ROLE_MISMATCH" | "RELATION_MISMATCH" | "OVER_INTERPRETATION" | "AMBIGUITY_LOST" | "DUPLICATE_CONCEPT";
    failureStage: "INTERPRETER" | "COMPILER" | "BOTH";
    message: string;
    rawEvidence: Array<{ turnId: string; quote: string }>;
    repairHint: string | null;
  }>;
};

export type ScientificInterpretationConversation = {
  conversationId: string;
  language: "fr" | "en";
  turns: ScientificInterpretationTurn[];
  projectContext?: {
    projectRef: string;
    projectVersion: string;
    projectDigest: string;
    elements: Array<{
      elementId: string;
      sectionId: string;
      semanticKey: string | null;
      content: string;
      semanticRoles: string[];
      aliases?: string[];
    }>;
  };
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
    currentQuestion?: string | null;
    questionRationale?: string | null;
    scopeSectionIds?: string[];
  };
  semanticRepairContext?: ScientificInterpretationSemanticRepairContext;
};

export const SCIENTIFIC_INTERPRETATION_DOMAIN_DECISIONS = [
  "IN_SCOPE",
  "BORDERLINE",
  "OUT_OF_SCOPE",
  "OUT_OF_SCOPE_CLINICAL",
  "MIXED",
] as const;
export type ScientificInterpretationDomainDecision = typeof SCIENTIFIC_INTERPRETATION_DOMAIN_DECISIONS[number];

export const SCIENTIFIC_INTERPRETATION_DIALOGUE_INTENTS = [
  "SCIENTIFIC_INPUT",
  "PARTIAL_SCIENTIFIC_INPUT",
  "CORRECTION",
  "DEFER",
  "REQUEST_REPHRASE",
  "REQUEST_EXPLANATION",
  "USER_QUESTION",
  "TOPIC_SHIFT",
  "OUT_OF_SCOPE",
  "BORDERLINE",
  "MIXED",
] as const;
export type ScientificInterpretationDialogueIntent = typeof SCIENTIFIC_INTERPRETATION_DIALOGUE_INTENTS[number];

export const SEMANTIC_UNDERSTANDING_FUNCTIONS = [
  "CONCEPT",
  "ENTITY",
  "EVENT",
  "ACTION",
  "ROLE_ASSIGNMENT",
  "RELATION",
  "COMPARISON",
  "TEMPORALITY",
  "QUANTITY",
  "BOUND",
  "CORRECTION",
  "NEGATION",
  "PREFERENCE",
  "EXCLUSION",
  "INCLUSION",
  "REFERENCE",
  "UNCERTAINTY",
  "AMBIGUITY",
  "UNKNOWN",
] as const;
export type SemanticUnderstandingFunction = typeof SEMANTIC_UNDERSTANDING_FUNCTIONS[number];

export type SemanticUnderstandingBasis = "EXPLICIT" | "CONTEXTUAL" | "AMBIGUOUS" | "NOT_SPECIFIED";
export type SemanticUnderstandingProjectDisposition = "PROJECT_CANDIDATE" | "DIALOGUE_ONLY" | "OUT_OF_SCOPE";

export type SemanticUnderstandingQuantitativeBounds = {
  lower: number | null;
  upper: number | null;
  unit: string | null;
};

export type ScientificInterpretationCognitiveBoundary = {
  lifecycle: "EPHEMERAL_TRACEABLE_NON_AUTHORITATIVE";
  authoritative: false;
  domainDecision: {
    decision: ScientificInterpretationDomainDecision;
    confidence: number | null;
    rationale: string;
    inScopeSegments: string[];
    outOfScopeSegments: string[];
    responseMessage: string | null;
    projectMutationAllowed: boolean;
  };
  dialogueRouting: {
    intent: ScientificInterpretationDialogueIntent;
    confidence: number | null;
    rationale: string;
    answersCurrentQuery: boolean;
    preservesCurrentQueryAction: boolean;
    questionContextMismatch: boolean;
    responseMessage: string | null;
  };
  terminologyGrounding?: {
    context: ScientificInterpretationTerminologyContext;
    resolutions: ScientificInterpretationTerminologyResolution[];
  };
  semanticUnderstanding: {
    summary: string;
    elements: ScientificContributionItem[];
    relations: ScientificContributionRelation[];
  };
};

export type ContributionEpistemicBoundary = {
  ownership: string | null;
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
  semanticFunction?: SemanticUnderstandingFunction;
  evidenceBasis?: SemanticUnderstandingBasis;
  projectDisposition?: SemanticUnderstandingProjectDisposition;
  referencedProjectElementIds?: string[];
  relatedItemIds?: string[];
  quantitativeBounds?: SemanticUnderstandingQuantitativeBounds | null;
  epistemicBoundary: ContributionEpistemicBoundary;
};

export type ScientificContributionRelation = {
  relationId: string;
  relationType: string;
  sourceItemId: string;
  targetItemId: string;
  polarity: string | null;
  confidence: number | null;
  epistemicBoundary: ContributionEpistemicBoundary;
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
  cognitiveBoundary?: ScientificInterpretationCognitiveBoundary;
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
