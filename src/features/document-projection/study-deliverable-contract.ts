export const STUDY_DELIVERABLE_PORTFOLIO_VERSION = "1.0.0" as const;

export type StudyDeliverableStatus = "READY" | "PARTIAL" | "MISSING_DECISION" | "NOT_APPLICABLE" | "PROFILE_REQUIRED" | "STALE";
export type StudyDeliverableKind =
  | "PROTOCOL_FULL"
  | "PROTOCOL_SYNOPSIS"
  | "RECRUITMENT"
  | "SCHEDULE_OF_ACTIVITIES"
  | "CRF"
  | "DATA_DICTIONARY"
  | "DATA_MANAGEMENT_PLAN"
  | "EDC_IMPORT_PACKAGE"
  | "STATISTICAL_ANALYSIS_PLAN"
  | "REGULATORY_DOCUMENT_PACKAGE"
  | "IMAGING_CORE_LAB_MANUAL";

export type StudyDeliverableFile = Readonly<{
  fileName: string;
  format: "HTML" | "MARKDOWN" | "CSV" | "JSON";
  mimeType: string;
  content: string;
}>;

export type StudyDeliverableArtifact = Readonly<{
  artifactId: string;
  artifactVersion: typeof STUDY_DELIVERABLE_PORTFOLIO_VERSION;
  kind: StudyDeliverableKind;
  sourceProject?: Readonly<{ projectId: string; projectVersion: string; projectDigest: string }>;
  name: string;
  status: StudyDeliverableStatus;
  preview: string;
  files: readonly StudyDeliverableFile[];
  sourceObjectRefs: readonly string[];
  canonicalVariableRefs: readonly string[];
  missingDecisions: readonly string[];
  limitations: readonly string[];
}>;

export type CanonicalCrfField = Readonly<{
  fieldId: string;
  canonicalVariableId: string;
  canonicalVariableVersionId: string;
  label: string;
  scientificRole: string | null;
  valueType: null;
  unit: string | null;
  choices: null;
  required: null;
  expectedOccasionRefs: readonly string[];
  plannedSource: string | null;
  plannedMethod: string | null;
  missingnessRule: null;
  validationRules: readonly string[];
  provenanceRefs: readonly string[];
}>;

export type CanonicalCrfPackage = Readonly<{
  contract: "CANONICAL_CRF_PACKAGE";
  contractVersion: "1.0.0";
  packageId: string;
  owner: "DATA_MANAGEMENT";
  sourceProject: Readonly<{ projectId: string; projectVersion: string; projectDigest: string }>;
  sourceLogicalProjectionRefs: readonly string[];
  status: "CANDIDATE_PROJECTION_ONLY";
  fields: readonly CanonicalCrfField[];
  sourceOfTruth: false;
  projectWriteAuthorized: false;
}>;

export type StudyDeliverableManifest = Readonly<{
  manifestVersion: typeof STUDY_DELIVERABLE_PORTFOLIO_VERSION;
  portfolioId: string;
  generatedAt: string;
  project: Readonly<{
    projectId: string;
    projectVersion: string;
    projectDigest: string;
  }>;
  projectionOwner: "DOC-001";
  sourceOfTruth: false;
  projectWriteAuthorized: false;
  regulatoryComplianceClaim: false;
  redcapProfile: "REDCAP_DATA_DICTIONARY_CSV_BASE_PROFILE_1.0";
  redcapInstanceCompatibility: "REQUIRES_LOCAL_REDCAP_VALIDATION";
  artifacts: readonly Readonly<{
    artifactId: string;
    artifactVersion: typeof STUDY_DELIVERABLE_PORTFOLIO_VERSION;
    kind: StudyDeliverableKind;
    sourceProject?: Readonly<{ projectId: string; projectVersion: string; projectDigest: string }>;
    status: StudyDeliverableStatus;
    files: readonly Readonly<{ fileName: string; format: StudyDeliverableFile["format"]; mimeType: string }>[];
    sourceObjectRefs: readonly string[];
    canonicalVariableRefs: readonly string[];
  }>[];
  variableMappings: readonly Readonly<{
    canonicalVariableId: string;
    redcapFieldName: string;
  }>[];
  canonicalCrfPackageRef: string;
}>;

export type StudyDeliverablePortfolio = Readonly<{
  contract: "V1_STUDY_DELIVERABLE_PORTFOLIO";
  contractVersion: typeof STUDY_DELIVERABLE_PORTFOLIO_VERSION;
  portfolioId: string;
  projectRef: Readonly<{ projectId: string; projectVersion: string; projectDigest: string }>;
  generatedAt: string;
  owner: "DOC-001";
  artifacts: readonly StudyDeliverableArtifact[];
  manifest: StudyDeliverableManifest;
  projectionOnly: true;
  sourceOfTruth: false;
  projectWriteAuthorized: false;
}>;
