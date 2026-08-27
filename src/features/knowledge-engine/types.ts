import type { ExternalEvidenceSearchResult } from "./external-evidence/types";

export const KNOWLEDGE_ENGINE_VERSION = "1.2.1" as const;

export type KnowledgeRequestType =
  | "EXPLAIN"
  | "COMPARE"
  | "SUPPORT_REASONING"
  | "CHECK_APPLICABILITY"
  | "IDENTIFY_GAP";

export type KnowledgePurpose =
  | "UNDERSTAND"
  | "COMPARE"
  | "CLARIFY_SELECTION"
  | "CHECK_APPLICABILITY"
  | "IDENTIFY_GAP";

export type ContextValueState =
  | "KNOWN"
  | "ASSUMED"
  | "UNKNOWN"
  | "NOT_APPLICABLE"
  | "CONTRADICTORY"
  | "OBSOLETE"
  | "WITHHELD";

export type ContextStatus = "EXACT" | "PARTIAL" | "UNKNOWN" | "CONTRADICTORY" | "OUT_OF_VALIDITY_DOMAIN";
export type ContextDimensionName =
  | "domain"
  | "pathology"
  | "population"
  | "phenomenon"
  | "biomarker"
  | "modality"
  | "technique"
  | "equipment"
  | "timing"
  | "objective"
  | "criterion"
  | "intervention"
  | "usage";

export type PrivacyClass = "PUBLIC" | "INTERNAL" | "CONFIDENTIAL_PROJECT" | "RESTRICTED_PERSONAL";
export type ExternalSearchPolicy = "INTERNAL_ONLY" | "EXTERNAL_ALLOWED" | "EXTERNAL_REQUIRED" | "EXTERNAL_FORBIDDEN";
export type KnowledgeContentOrigin = "INTERNAL_OFFICIAL" | "INTERNAL_RUNTIME_DERIVED" | "EXTERNAL_CANDIDATE" | "USER_PROVIDED" | "LOCAL_PRACTICE";

export type ContextDimension = {
  name: ContextDimensionName;
  values: string[];
  state: ContextValueState;
  force: "HARD" | "SOFT";
  source: "EXPLICIT_USER_STATEMENT" | "VALIDATED_SESSION" | "NOT_PROVIDED";
  critical: boolean;
  exclusions: string[];
};

export type KnowledgeContextPackage = {
  contextId: string;
  version: typeof KNOWLEDGE_ENGINE_VERSION;
  status: ContextStatus;
  dimensions: ContextDimension[];
  unknowns: string[];
  contradictions: string[];
  explicitExclusions: string[];
  relaxation: null | {
    level: "R1" | "R2";
    authorizedBy: string;
    removedDimensions: ContextDimensionName[];
    lossOfScope: string;
  };
  digest: string;
};

export type ScientificObjectRef = {
  objectId: string;
  originalTerm: string;
  role: "SUBJECT" | "COMPARATOR" | "CONTEXT" | "UNKNOWN";
};

export type KnowledgeRequest = {
  contractVersion: typeof KNOWLEDGE_ENGINE_VERSION;
  requestId: string;
  requestRevision: number;
  researchProjectId?: string;
  strategyVersion?: string;
  originalQuestion: string;
  normalizedQuestion: string;
  requestType: KnowledgeRequestType;
  knowledgePurpose: KnowledgePurpose;
  consumer: "PROTOCOL_DESIGNER_UNDERSTAND" | "SCIENTIFIC_THINKING_ENGINE" | "IMAGING_STUDY_DESIGNER" | "RESEARCH_PROJECT_CONSTRUCTION" | "KNOWLEDGE_ENGINE_TEST";
  scientificObjects: ScientificObjectRef[];
  relations: string[];
  requestedClaimType: "DEFINITION" | "COMPARISON" | "APPLICABILITY" | "BEST_OPTION" | "GAP";
  context: KnowledgeContextPackage;
  exclusions: string[];
  unknowns: string[];
  expectedUse: "GENERAL_SCIENTIFIC_UNDERSTANDING" | "METHODOLOGICAL_REASONING";
  freshnessRequirement: string;
  sensitivityClassification: PrivacyClass;
  externalSearchPolicy: ExternalSearchPolicy;
  traceId: string;
  createdAt: string;
};

export type ConceptRelation = "SAME_AS" | "RELATED_TO" | "BROADER_THAN" | "NARROWER_THAN" | "CONTEXT_DEPENDENT_RELATION" | "NOT_EQUIVALENT" | "UNKNOWN_RELATION";
export type ResolvedConcept = {
  conceptId: string;
  preferredLabel: string;
  originalTerms: string[];
  kind: "EXACT" | "KNOWN_ALIAS" | "DOCUMENT_BOUND_CONCEPT" | "UNKNOWN" | "AMBIGUOUS";
  objectType: string;
  providerConcepts: Record<string, string[]>;
  candidateSenses?: Array<{
    conceptId: string;
    preferredLabel: string;
    objectType: string;
    providerConcepts: Record<string, string[]>;
  }>;
};

export type ResolvedConceptRelation = {
  sourceConceptId: string;
  targetConceptId: string;
  relation: ConceptRelation;
  authority: "KE-001" | "PROVIDER" | "CANDIDATE";
  explanation: string;
};

export type ConceptResolution = {
  concepts: ResolvedConcept[];
  relations: ResolvedConceptRelation[];
  unresolvedTerms: string[];
  ambiguities: string[];
  digest: string;
};

export type ProviderType = "STRUCTURED_CORPUS" | "KNOWLEDGE_GRAPH" | "ASSERTION_LAYER" | "REASONING_BOOK";
export type ProviderCapability = "CONCEPT" | "RELATION" | "ASSERTION" | "EVIDENCE" | "DOCUMENTARY_STATEMENT";
export type ProviderAvailability = "AVAILABLE" | "AVAILABLE_EMPTY" | "REPLAY_ONLY" | "NOT_ACTIVATED" | "UNAVAILABLE";
export type ProviderStatus = "CURRENT_EFFECTIVE" | "CURRENT_DOCUMENTARY" | "CURRENT_EMPTY" | "HISTORICAL_SUPERSEDED" | "CANDIDATE_NOT_ACTIVATED";

export type KnowledgeProviderDefinition = {
  id: string;
  providerId: string;
  version: string;
  type: ProviderType;
  providerType: ProviderType;
  authoritySource: string;
  authority: string;
  domains: string[];
  domain: string[];
  coverageConcepts: string[];
  capabilities: ProviderCapability[];
  queryCapabilities: ProviderCapability[];
  supportedEntities: string[];
  supportedRelations: string[];
  contextDimensions: ContextDimensionName[];
  supportedContextDimensions: ContextDimensionName[];
  granularity: "ATOMIC_ASSERTION" | "DOCUMENTARY_BLOCK" | "ENTITY_RELATION";
  resultGranularity: "ATOMIC_ASSERTION" | "DOCUMENTARY_BLOCK" | "ENTITY_RELATION";
  provenanceSupport: "SOURCE_AND_LOCATOR" | "SOURCE_REFS";
  sourceLocatorSupport: "SOURCE_AND_LOCATOR" | "SOURCE_REFS";
  evidenceSupport: "EVIDENCE_LINKS" | "DOCUMENTARY_LOCALIZERS" | "NONE";
  limitations: string[];
  knownLimitations: string[];
  completenessClaim: string;
  status: ProviderStatus;
  availability: ProviderAvailability;
  programOwner?: string;
  adapterId: string;
};

export type ProviderSelection = {
  providerId: string;
  included: boolean;
  reason: string;
  matchedConceptIds: string[];
};

export type QueryBranch = {
  branchId: string;
  label: string;
  conceptIds: string[];
  modality?: string;
  hardFilters: ContextDimension[];
};

export type QueryPlan = {
  queryPlanId: string;
  revision: number;
  digest: string;
  requestRef: string;
  contextRef: string;
  registrySnapshotRef: string;
  resolvedConcepts: ResolvedConcept[];
  resolvedRelations: ResolvedConceptRelation[];
  unresolvedConcepts: string[];
  ambiguities: string[];
  branches: QueryBranch[];
  providerSelections: ProviderSelection[];
  exclusions: string[];
  matchingSemantics: "EXACT_FIRST_NO_IMPLICIT_FALLBACK";
  relaxationBranches: KnowledgeContextPackage["relaxation"][];
  stopConditions: string[];
  executionOrder: string[];
  domainGate: "IN_SCOPE" | "OUT_OF_DOMAIN" | "PATIENT_LEVEL_BLOCKED" | "CLARIFICATION_REQUIRED";
};

export type ApplicabilityState = "APPLICABLE_EXACT" | "APPLICABLE_WITH_LIMITATIONS" | "PARTIALLY_APPLICABLE" | "UNKNOWN_APPLICABILITY" | "CONTRADICTORY_CONTEXT" | "OUT_OF_VALIDITY_DOMAIN";
export type RuntimeStatus = "OFFICIAL_EFFECTIVE" | "GOVERNED_DOCUMENTARY" | "RUNTIME_DERIVED" | "ASSERTION_CANDIDATE" | "UNAVAILABLE_OR_UNKNOWN";

export type RuntimeSource = {
  sourceId: string;
  revision: string;
  title: string;
  status: string;
  locator?: string;
  doi?: string;
  pmid?: string;
  pmcid?: string;
};

export type RuntimeEvidenceLink = {
  evidenceId: string;
  assertionId: string;
  sourceId: string;
  relation: "SUPPORTS" | "REFUTES" | "QUALIFIES" | "MENTIONS" | "DERIVES" | "CORRECTS" | "RETRACTS";
  locator: string;
  limitations: string[];
};

export type RuntimeAssertion = {
  stableId: string;
  revision: string;
  providerId: string;
  status: RuntimeStatus;
  text: string;
  atomicContent: unknown;
  conceptIds: string[];
  modality?: string;
  context: Record<string, unknown>;
  polarity: "POSITIVE" | "NEGATIVE" | "QUALIFIED" | "UNKNOWN";
  evidenceRelations: RuntimeEvidenceLink["relation"][];
  limitations: string[];
  reviewStatus: string;
  locator: string;
  applicability: ApplicabilityState;
  applicabilityReasons: string[];
};

export type GovernedDocumentaryStatement = {
  statementId: string;
  providerId: string;
  status: "GOVERNED_DOCUMENTARY";
  text: string;
  statementType: "CONSTRUCT" | "HYPOTHESIS" | "METHODOLOGICAL_RULE" | "LIMITATION" | "CONTROVERSY" | "EVIDENCE_MAP" | "DECISION_CANDIDATE" | "OPEN_QUESTION" | "GENERAL_INFORMATION" | "CONTEXT";
  conceptIds: string[];
  locator: string;
  sourceId: string;
  applicability: ApplicabilityState;
  applicabilityReasons: string[];
};

export type AdapterResult = {
  providerId: string;
  providerVersion: string;
  executionStatus: "SUCCESS" | "NO_MATCH" | "UNAVAILABLE" | "FAILED" | "POLICY_REFUSED";
  declaredCoverage: string[];
  assertions: RuntimeAssertion[];
  documentaryStatements: GovernedDocumentaryStatement[];
  sources: RuntimeSource[];
  evidenceLinks: RuntimeEvidenceLink[];
  conflicts: RuntimeConflict[];
  limitations: string[];
  continuation: "EXHAUSTED";
  diagnostics: string[];
  sourceRepresentationDigest: string;
};

export type CoverageStatus = "NO_PROVIDER" | "PROVIDER_NOT_APPLICABLE" | "NO_MATCH" | "PARTIAL" | "SUPPORTED" | "CONFLICTING" | "SOURCE_UNAVAILABLE" | "COVERAGE_UNKNOWN";
export type CoverageMapStatus = "SUPPORTED_COVERAGE" | "PARTIAL_COVERAGE" | "NO_MATCH" | "INCOMPATIBLE_CONTEXT" | "NO_PROVIDER" | "CONFLICTING_COVERAGE" | "OUT_OF_DOMAIN" | "INSUFFICIENT_EVIDENCE";
export type CoverageMapItem = {
  coverageId: string;
  branchId: string;
  label: string;
  requestedConceptIds: string[];
  status: CoverageMapStatus;
  consideredProviderIds: string[];
  supportingProviderIds: string[];
  resultCount: number;
  explanation: string;
  externalResearchRequired: boolean;
};

export type CoverageMap = {
  items: CoverageMapItem[];
  externalResearchRequired: boolean;
  digest: string;
};
export type ProviderExecution = {
  providerId: string;
  providerVersion: string;
  included: boolean;
  reason: string;
  executionStatus: AdapterResult["executionStatus"] | "NOT_EXECUTED";
  resultCount: number;
  diagnostics: string[];
};

export type KnowledgeGapCode = "NO_REGISTERED_PROVIDER" | "NO_APPLICABLE_PROVIDER" | "NO_ASSERTION_MATCH" | "MISSING_CRITICAL_CONTEXT" | "MISSING_SOURCE_ACCESS" | "MISSING_REVIEW_OR_ACTIVATION" | "CONFLICT_UNRESOLVED" | "PROVIDER_FAILURE" | "PRIVACY_BLOCKED" | "OUT_OF_DOMAIN" | "EXTERNAL_RESEARCH_REQUIRED";
export type KnowledgeGap = {
  gapId: string;
  code: KnowledgeGapCode;
  scope: string;
  explanation: string;
  affectedConceptIds: string[];
  resumeCondition: string;
};

export type RuntimeConflict = {
  conflictId: string;
  state: "COMPATIBLE" | "CONTEXTUAL_DIFFERENCE" | "CONTRADICTION" | "CONTROVERSY" | "INSUFFICIENT_TO_COMPARE";
  positionIds: string[];
  explanation: string;
};

export type RuntimeKnowledgeResponseState =
  | "DIRECT_ANSWER"
  | "PARTIAL_ANSWER"
  | "CONTRADICTORY_ANSWER"
  | "CLARIFICATION_REQUIRED"
  | "NO_APPLICABLE_KNOWLEDGE"
  | "SOURCE_UNAVAILABLE"
  | "COVERAGE_UNKNOWN";

export type RuntimeKnowledgeConclusionRole =
  | "DIRECT_RESPONSE"
  | "SUPPORTING_CONTEXT"
  | "CONTEXTUAL_LIMIT";

export type RuntimeKnowledgeConclusion = {
  conclusionId: string;
  assertionId: string;
  itemKind: "ASSERTION" | "DOCUMENTARY_STATEMENT";
  text: string;
  status: RuntimeStatus;
  applicability: ApplicabilityState;
  conceptIds: string[];
  sourceIds: string[];
  locator: string;
  limitations: string[];
  role: RuntimeKnowledgeConclusionRole;
  semanticRelation: null | {
    subject: string;
    predicate: string;
    object: string;
  };
};

export type RuntimeKnowledgeSynthesis = {
  synthesisId: string;
  digest: string;
  question: string;
  domain: string[];
  conclusions: RuntimeKnowledgeConclusion[];
  responseProfile: {
    state: RuntimeKnowledgeResponseState;
    directConclusionIds: string[];
    supportingConclusionIds: string[];
    contextualLimitConclusionIds: string[];
    contradictionIds: string[];
    blockingGapIds: string[];
  };
  convergences: string[];
  divergences: string[];
  controversies: RuntimeConflict[];
  limitations: string[];
  gaps: KnowledgeGap[];
  methodologicalImplications: string[];
  sourceIds: string[];
};

export type ScientificQuestionSpecificity = {
  centralObject: string;
  comparatorObjects: string[];
  phenomena: string[];
  biomarkers: string[];
  pathologies: string[];
  populations: string[];
  temporalities: string[];
  requestedRelations: string[];
  userObjective: string;
  preservedTerms: string[];
  digest: string;
};

export type KnowledgeTraceEvent = {
  sequence: number;
  operation: string;
  mode: LlmOperationClass;
  decision: string;
  inputDigest: string;
  outputDigest: string;
};

export type KnowledgeTrace = {
  traceId: string;
  engineVersion: typeof KNOWLEDGE_ENGINE_VERSION;
  events: KnowledgeTraceEvent[];
  registrySnapshotDigest: string;
  policyRefs: string[];
  privacy: { transmittedFields: string[]; redactedFields: string[]; externalCallMade: boolean };
  digest: string;
};

export type LlmOperationClass = "DETERMINISTIC" | "LLM_ALLOWED" | "LLM_PROPOSAL_ONLY" | "HUMAN_REQUIRED" | "FORBIDDEN";

export type KnowledgeResult = {
  resultId: string;
  resultRevision: number;
  resultDigest: string;
  request: KnowledgeRequest;
  queryPlan: QueryPlan;
  registrySnapshotRef: string;
  providerVersions: Record<string, string>;
  runtimeStatus: RuntimeStatus;
  coverageStatus: CoverageStatus;
  coverageMap: CoverageMap;
  contextStatus: ContextStatus;
  specificity: ScientificQuestionSpecificity;
  resolvedConcepts: ResolvedConcept[];
  unresolvedConcepts: string[];
  ambiguities: string[];
  applicableAssertions: RuntimeAssertion[];
  excludedAssertions: RuntimeAssertion[];
  documentaryStatements: GovernedDocumentaryStatement[];
  candidateAssertions: RuntimeAssertion[];
  sources: RuntimeSource[];
  evidence: RuntimeEvidenceLink[];
  applicability: Record<string, ApplicabilityState>;
  synthesis: RuntimeKnowledgeSynthesis;
  controversies: RuntimeConflict[];
  gaps: KnowledgeGap[];
  limitations: string[];
  provenance: Array<{ providerId: string; version: string; representationDigest: string }>;
  freshness: { requirement: string; corpusStateDate: string };
  consumerHints: string[];
  humanReviewRequirements: string[];
  providerExecutions: ProviderExecution[];
  trace: KnowledgeTrace;
  externalEvidence: ExternalEvidenceSearchResult | null;
};
