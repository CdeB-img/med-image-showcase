import type { ProjectContextSnapshot } from "@/features/research-project-construction/canonical-project-backbone";
import type { SpecializedOwnerId } from "@/features/research-project-construction/specialized-owner-handoff";

export const OBSERVABILITY_MEASUREMENT_RUNTIME_CONTRACT = "OBSERVABILITY_MEASUREMENT_RUNTIME" as const;
export const OBSERVABILITY_MEASUREMENT_RUNTIME_VERSION = "1.0.0" as const;
export const OBSERVABILITY_MEASUREMENT_RESULT_CONTRACT = "OBSERVABILITY_MEASUREMENT_RESULT" as const;

export type ObservabilityConceptKind =
  | "SCIENTIFIC_QUESTION"
  | "OBJECTIVE"
  | "HYPOTHESIS"
  | "SCIENTIFIC_MODEL"
  | "ENDPOINT"
  | "OTHER_SCIENTIFIC_CONCEPT";

export type ObservabilityValueNature = "CONTINUOUS" | "ORDINAL" | "BINARY" | "REPEATED_QUANTITATIVE" | "UNKNOWN";
export type ObservabilityMeasurementDomain = "GENERAL" | "IMAGING" | "OTHER_SPECIALIZED" | "UNKNOWN";
export type GovernedBiomarkerRole =
  | "DIAGNOSTIC"
  | "PROGNOSTIC"
  | "PREDICTIVE"
  | "MONITORING_OR_RESPONSE"
  | "SURROGATE_OR_CANDIDATE_SURROGATE"
  | "MECHANISTIC_OR_EXPLORATORY"
  | "UNKNOWN";

export type ObservabilityScientificConcept = {
  conceptRef: string;
  label: string;
  kind: ObservabilityConceptKind;
  epistemicState: "KNOWN" | "ASSUMED" | "UNKNOWN";
  provenanceRefs: readonly string[];
};

export type ProjectVariableReference = {
  variableRef: string;
  label: string;
  epistemicState: "KNOWN" | "ASSUMED" | "UNKNOWN";
  provenanceRefs: readonly string[];
};

export type ObservablePropertyDeclaration = {
  propertyRef: string;
  sourceConceptRef: string;
  label: string;
  rationale: string;
  prerequisites: readonly string[];
  assumptions: readonly string[];
  limitations: readonly string[];
  uncertainty: readonly string[];
  provenanceRefs: readonly string[];
};

export type MeasurementDefinitionDeclaration = {
  measurementRef: string;
  propertyRef: string;
  label: string;
  operationalDefinition: string;
  valueNature: ObservabilityValueNature;
  domain: ObservabilityMeasurementDomain;
  rationale: string;
  prerequisites: readonly string[];
  assumptions: readonly string[];
  limitations: readonly string[];
  uncertainty: readonly string[];
  provenanceRefs: readonly string[];
};

export type BiomarkerRoleDeclaration = {
  roleRef: string;
  measurementRef: string;
  role: GovernedBiomarkerRole;
  rationale: string;
  limitations: readonly string[];
  provenanceRefs: readonly string[];
};

export type ObservabilityUpstreamOwnerInput = {
  owner: "SCIENTIFIC_THINKING" | "STUDY_DESIGN";
  resultId: string;
  resultVersion: string;
  resultDigest: string;
  informationNeeded: readonly string[];
  provenanceRefs: readonly string[];
  ownershipTransferred: false;
};

export type ObservabilityMeasurementRuntimeInput = {
  contract: typeof OBSERVABILITY_MEASUREMENT_RUNTIME_CONTRACT;
  contractVersion: typeof OBSERVABILITY_MEASUREMENT_RUNTIME_VERSION;
  inputId: string;
  projectId: string;
  projectVersion: string;
  projectDigest: string;
  projectSnapshot: Readonly<ProjectContextSnapshot>;
  scientificConcepts: readonly ObservabilityScientificConcept[];
  projectVariables: readonly ProjectVariableReference[];
  modalityContext: readonly { modalityRef: string; label: string; provenanceRefs: readonly string[] }[];
  upstreamOwnerInputs: readonly ObservabilityUpstreamOwnerInput[];
  observablePropertyDeclarations: readonly ObservablePropertyDeclaration[];
  measurementDefinitionDeclarations: readonly MeasurementDefinitionDeclaration[];
  biomarkerRoleDeclarations: readonly BiomarkerRoleDeclaration[];
  constraints: readonly string[];
  unknowns: readonly string[];
  sourceProvenanceRefs: readonly string[];
  projectWriteAuthorized: false;
};

export type ObservablePropertyCandidate = ObservablePropertyDeclaration & {
  candidateStatus: "PROPOSED_NOT_ADOPTED";
  projectWriteAuthorized: false;
};

export type MeasurementDefinitionCandidate = MeasurementDefinitionDeclaration & {
  candidateStatus: "PROPOSED_NOT_ADOPTED";
  projectWriteAuthorized: false;
};

export type BiomarkerRoleCandidate = BiomarkerRoleDeclaration & {
  candidateStatus: "PROPOSED_NOT_ADOPTED";
  projectWriteAuthorized: false;
};

export type ObservabilityRelationship = {
  relationshipId: string;
  type:
    | "CONCEPT_OPERATIONALIZED_BY_PROPERTY"
    | "PROPERTY_MEASURED_BY_DEFINITION"
    | "MEASUREMENT_HAS_PROPOSED_BIOMARKER_ROLE";
  sourceRef: string;
  targetRef: string;
  provenanceRefs: readonly string[];
};

export type ObservabilityInformationNeed = {
  needId: string;
  informationNeeded: string;
  scientificReason: string;
  targetOwner: "RESEARCH_PROJECT" | "OBSERVABILITY_MEASUREMENT" | "QUERY_NAVIGATION";
  sourceRefs: readonly string[];
  status: "OPEN_NOT_RESOLVED";
};

export type ObservabilityDownstreamHandoff = {
  handoffId: string;
  sourceOwner: "OBSERVABILITY_MEASUREMENT";
  targetOwner: Extract<SpecializedOwnerId, "IMAGING" | "BIOSTATISTICS">;
  capabilityId: "IMAGING_STUDY_DESIGN" | "BIOSTATISTICS_PLANNING";
  sourceResultRef: string;
  sourceMeasurementRefs: readonly string[];
  purpose: string;
  informationNeeded: readonly string[];
  provenanceRefs: readonly string[];
  status: "PROPOSED_NOT_EXECUTED";
  ownershipTransferred: false;
  projectWriteAuthorized: false;
};

export type ObservabilityValidationFinding = { code: string; path: string; message: string };
export type ObservabilityValidationResult = { status: "PASS" | "BLOCKED"; findings: readonly ObservabilityValidationFinding[] };

export type ObservabilityMeasurementResult = {
  contract: typeof OBSERVABILITY_MEASUREMENT_RESULT_CONTRACT;
  contractVersion: typeof OBSERVABILITY_MEASUREMENT_RUNTIME_VERSION;
  owner: "OBSERVABILITY_MEASUREMENT";
  capabilityId: "OBSERVABILITY_QUALIFICATION";
  resultId: string;
  resultVersion: typeof OBSERVABILITY_MEASUREMENT_RUNTIME_VERSION;
  resultDigest: string;
  resultStatus: "CANDIDATES_PROPOSED" | "INFORMATION_REQUIRED";
  sourceProject: {
    projectId: string;
    projectVersion: string;
    projectDigest: string;
    snapshotDigest: string;
  };
  sourceConceptRefs: readonly string[];
  projectVariableRefs: readonly string[];
  observableProperties: readonly ObservablePropertyCandidate[];
  measurementDefinitions: readonly MeasurementDefinitionCandidate[];
  biomarkerRoles: readonly BiomarkerRoleCandidate[];
  relationships: readonly ObservabilityRelationship[];
  informationNeeds: readonly ObservabilityInformationNeed[];
  downstreamHandoffs: readonly ObservabilityDownstreamHandoff[];
  assumptions: readonly string[];
  limitations: readonly string[];
  uncertainty: readonly string[];
  provenanceRefs: readonly string[];
  epistemicStatus: "PROPOSAL_ONLY" | "INSUFFICIENT_CONTEXT_UNKNOWN_PRESERVED";
  validation: ObservabilityValidationResult;
  humanDecisionRequired: true;
  projectWriteAuthorized: false;
  projectOwnershipTransferred: false;
  candidateIsAdopted: false;
};
