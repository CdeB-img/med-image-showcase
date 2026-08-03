export const INTAKE_SCHEMA_VERSION = "1.0" as const;
export const INTAKE_SESSION_SCHEMA_VERSION = "3.0" as const;
export const INTAKE_FIXTURE_SET_VERSION = "p-web-04r-rb003-1.0-rb004-1.1-rb005-1.0" as const;

export type EvidenceOrigin =
  | "EXPLICIT_USER_STATEMENT"
  | "NORMALIZED_FROM_USER_TERM"
  | "TENTATIVE_INTERPRETATION"
  | "NOT_PROVIDED"
  | "CONTRADICTORY"
  | "UNSUPPORTED";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
export type UserExpertise = "NON_SPECIALIST" | "INTERMEDIATE" | "EXPERT" | "UNKNOWN";

export type InterpretedField<T> = {
  value: T | null;
  origin: EvidenceOrigin;
  confidence: ConfidenceLevel;
  sourceText?: string;
  alternatives?: string[];
  userValidated: boolean;
};

export const INTERPRETED_FIELD_KEYS = [
  "userExpertise",
  "scientificDomain",
  "clinicalContext",
  "scientificPurpose",
  "population",
  "pathologyOrCondition",
  "phenomenaOfInterest",
  "interventionsOrGroups",
  "outcomesMentioned",
  "studyDesign",
  "centers",
  "availableEquipment",
  "fieldStrengths",
  "manufacturers",
  "models",
  "softwareVersions",
  "availableData",
  "constraints",
  "declaredTimings",
] as const;

export type InterpretedFieldKey = (typeof INTERPRETED_FIELD_KEYS)[number];

export type ScientificIntakeInterpretation = {
  schemaVersion: typeof INTAKE_SCHEMA_VERSION;
  originalQuestion: string;
  reformulatedQuestion: string;
  language: "fr" | "en";
  userExpertise: InterpretedField<UserExpertise>;
  scientificDomain: InterpretedField<string[]>;
  clinicalContext: InterpretedField<string[]>;
  scientificPurpose: InterpretedField<string[]>;
  population: InterpretedField<string[]>;
  pathologyOrCondition: InterpretedField<string[]>;
  phenomenaOfInterest: InterpretedField<string[]>;
  interventionsOrGroups: InterpretedField<string[]>;
  outcomesMentioned: InterpretedField<string[]>;
  studyDesign: InterpretedField<string[]>;
  centers: InterpretedField<string[]>;
  availableEquipment: InterpretedField<string[]>;
  fieldStrengths: InterpretedField<string[]>;
  manufacturers: InterpretedField<string[]>;
  models: InterpretedField<string[]>;
  softwareVersions: InterpretedField<string[]>;
  availableData: InterpretedField<string[]>;
  constraints: InterpretedField<string[]>;
  declaredTimings: InterpretedField<string[]>;
  termsNeedingClarification: string[];
  missingInformation: string[];
  contradictions: string[];
  unsupportedInferences: string[];
  safetyFlags: string[];
};

export type ScientificIntakeRequest = {
  question: string;
  language?: "fr" | "en";
  schemaVersion: typeof INTAKE_SCHEMA_VERSION;
  declaredExpertise?: UserExpertise;
};

export type HumanValidationState =
  | "NOT_REVIEWED"
  | "CONFIRMED"
  | "CORRECTED"
  | "REMOVED"
  | "UNKNOWN"
  | "NOT_RELEVANT";

export type HumanFieldReview = {
  state: HumanValidationState;
  correctedValue?: string[] | UserExpertise | null;
  reviewedAt?: string;
};

export type ValidatedScientificIntent = {
  schemaVersion: typeof INTAKE_SCHEMA_VERSION;
  originalQuestion: string;
  validatedReformulation: string;
  language: "fr" | "en";
  interpretation: ScientificIntakeInterpretation;
  reviews: Partial<Record<InterpretedFieldKey, HumanFieldReview>>;
  ambiguityResolutions: Record<string, string>;
  contradictionResolutions: Record<string, "RESOLVED" | "KEPT_FOR_HUMAN_REVIEW">;
  confirmedAt: string | null;
};

export type AdaptiveQuestionImplementationStatus =
  | "FULLY_OPERATIONAL"
  | "PARTIALLY_OPERATIONAL"
  | "RECORDED_ONLY"
  | "NOT_YET_SUPPORTED";

export type AdaptiveQuestion = {
  questionId: string;
  label: string;
  helpText: string;
  reason: string;
  decisionImpact: string;
  blockingLevel: "BLOCKING" | "IMPORTANT" | "OPTIONAL";
  supportedScenarios: Array<"spectral" | "cardiac" | "neuro" | "all">;
  allowedAnswers: Array<{ value: string; label: string; consequence: string }>;
  sourceRefs: string[];
  implementationStatus: AdaptiveQuestionImplementationStatus;
  knownFromFields?: InterpretedFieldKey[];
};

export type AdaptiveAnswer = {
  questionId: string;
  answer: string;
  label: string;
  consequence: string;
  answeredAt: string;
  status: "ANSWERED" | "UNKNOWN" | "NOT_APPLICABLE";
};

export type ScenarioMatchStatus =
  | "MATCH_CONFIRMED"
  | "MATCH_PROPOSED"
  | "MULTIPLE_MATCHES"
  | "NO_SUPPORTED_MATCH";

export type ScenarioMatch = {
  scenarioId: "spectral" | "cardiac" | "neuro";
  status: Exclude<ScenarioMatchStatus, "NO_SUPPORTED_MATCH">;
  score: number;
  confidence: ConfidenceLevel;
  reasons: string[];
  matchedTerms: string[];
  uncoveredElements: string[];
};

export type GuidedIntakeInterfaceState =
  | "IDLE"
  | "QUESTION_DRAFT"
  | "LOCAL_SAFETY_BLOCKED"
  | "ANALYZING"
  | "INTERPRETATION_READY"
  | "INTERPRETATION_REVIEW"
  | "INTERPRETATION_CONFIRMED"
  | "AMBIGUITY_BLOCKING"
  | "QUESTIONS_IN_PROGRESS"
  | "SCENARIO_PROPOSED"
  | "SCENARIO_CONFIRMED"
  | "MULTIPLE_SCENARIOS"
  | "NO_SUPPORTED_SCENARIO"
  | "API_UNAVAILABLE"
  | "QUOTA_EXCEEDED"
  | "INVALID_PROVIDER_RESPONSE"
  | "SESSION_RESTORED"
  | "SESSION_INVALIDATED"
  | "REPORT_READY";

export type SessionDecision = {
  outcome: "CONFIRM_ORIENTATION" | "DEFER" | "REFUSE";
  author: string;
  justification: string;
  reservations: string;
  decidedAt: string;
};

export type ProtocolDesignerSession = {
  sessionSchemaVersion: typeof INTAKE_SESSION_SCHEMA_VERSION;
  fixtureSetVersion: typeof INTAKE_FIXTURE_SET_VERSION;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  interfaceState: GuidedIntakeInterfaceState;
  currentStep: number;
  originalQuestion: string;
  validatedIntent: ValidatedScientificIntent | null;
  scenarioMatches: ScenarioMatch[];
  confirmedScenarioId: "spectral" | "cardiac" | "neuro" | null;
  secondaryScenarioIds: Array<"spectral" | "cardiac" | "neuro">;
  adaptiveAnswers: AdaptiveAnswer[];
  decision: SessionDecision | null;
  reportStatus: "NONE" | "PROVISIONAL" | "FINAL";
  invalidatedDownstream: string[];
};

export type IntakeApiErrorCode =
  | "API_UNAVAILABLE"
  | "METHOD_NOT_ALLOWED"
  | "INVALID_CONTENT_TYPE"
  | "PAYLOAD_TOO_LARGE"
  | "INVALID_REQUEST"
  | "LOCAL_SAFETY_BLOCKED"
  | "ORIGIN_NOT_ALLOWED"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "QUOTA_EXCEEDED"
  | "MODEL_UNAVAILABLE"
  | "PROVIDER_ERROR"
  | "INVALID_PROVIDER_RESPONSE";

export type IntakeApiError = {
  error: {
    code: IntakeApiErrorCode;
    message: string;
    retryable: boolean;
  };
};
