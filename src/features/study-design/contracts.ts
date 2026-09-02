import type { ProjectContextSnapshot } from "@/features/research-project-construction/canonical-project-backbone";
import type { SpecializedOwnerId } from "@/features/research-project-construction/specialized-owner-handoff";

export const STUDY_DESIGN_RUNTIME_CONTRACT = "RDE_STUDY_DESIGN_RUNTIME" as const;
export const STUDY_DESIGN_RUNTIME_VERSION = "1.0.0" as const;
export const STUDY_DESIGN_PROPOSAL_CONTRACT = "STUDY_DESIGN_PROPOSAL_CONTRIBUTION" as const;

export type StudyDesignKnown = {
  projectRef: string;
  versionRef: string;
  type: ProjectContextSnapshot["objects"][number]["type"];
  content: string;
  scientificRole: string | null;
  epistemicState: "KNOWN" | "ASSUMED";
  provenanceRefs: readonly string[];
};

export type StudyDesignUnknown = {
  issueRef: string;
  kind: ProjectContextSnapshot["openIssues"][number]["kind"];
  reason: string;
  sourceRefs: readonly string[];
};

export type StudyDesignRuntimeInput = {
  contract: typeof STUDY_DESIGN_RUNTIME_CONTRACT;
  contractVersion: typeof STUDY_DESIGN_RUNTIME_VERSION;
  projectId: string;
  projectVersion: string;
  projectDigest: string;
  projectSnapshot: Readonly<ProjectContextSnapshot>;
  sourceProvenanceRefs: readonly string[];
  designKnowns: readonly StudyDesignKnown[];
  designUnknowns: readonly StudyDesignUnknown[];
  projectWriteAuthorized: false;
};

export type StudyDesignFamilyCode =
  | "CROSS_SECTIONAL_OBSERVATIONAL"
  | "PROSPECTIVE_LONGITUDINAL_COHORT"
  | "RETROSPECTIVE_LONGITUDINAL_COHORT"
  | "AMBISPECTIVE_LONGITUDINAL_COHORT"
  | "PROSPECTIVE_PROGNOSTIC_COHORT"
  | "METHODOLOGICAL_VALIDATION"
  | "COMPARATIVE_OBSERVATIONAL"
  | "INTERVENTIONAL_COMPARATIVE_STUDY";

export type StudyDesignFamilyIdentity = {
  namespace: "NOXIA_STUDY_DESIGN_FAMILY";
  code: StudyDesignFamilyCode;
  vocabularyVersion: "1.0.0";
  vocabularyScope: "BOUNDED_EXTENSIBLE_NON_EXHAUSTIVE";
};

export type StudyDesignAxes = {
  temporalDirection: "PROSPECTIVE" | "RETROSPECTIVE" | "AMBISPECTIVE" | "CROSS_SECTIONAL" | "UNKNOWN";
  interventionMode: "OBSERVATIONAL" | "INTERVENTIONAL" | "UNKNOWN";
  structuralForm: "LONGITUDINAL" | "CROSS_SECTIONAL" | "METHODOLOGICAL_VALIDATION" | "UNKNOWN";
  comparisonStructure: "NONE" | "BETWEEN_GROUPS" | "WITHIN_SUBJECT" | "MULTIPLE" | "UNKNOWN";
  allocationMechanism: "NOT_APPLICABLE" | "RANDOMIZED" | "NON_RANDOMIZED" | "UNKNOWN";
};

export type StudyDesignHandoffProposal = {
  handoffId: string;
  sourceOwner: "STUDY_DESIGN";
  targetOwner: SpecializedOwnerId;
  capabilityId: string;
  sourceProposalRef: string;
  sourceOptionRef: string | null;
  sourceProjectRef: string;
  sourceProjectVersion: string;
  sourceProjectDigest: string;
  purpose: string;
  informationNeeded: readonly string[];
  provenanceRefs: readonly string[];
  status: "PROPOSED_NOT_EXECUTED";
  ownershipTransferred: false;
  projectWriteAuthorized: false;
};

export type StudyDesignOption = {
  optionId: string;
  family: StudyDesignFamilyIdentity;
  label: string;
  conciseDescription: string;
  axes: StudyDesignAxes;
  rationale: {
    statement: string;
    evidenceRefs: readonly string[];
    epistemicStatus: "PROJECT_GROUNDED_PROPOSAL" | "PROJECT_GROUNDED_WITH_UNKNOWNS";
  };
  advantages: readonly string[];
  limitations: readonly string[];
  prerequisites: readonly string[];
  consequences: readonly string[];
  unresolvedQuestions: readonly string[];
  downstreamHandoffRefs: readonly string[];
  provenanceRefs: readonly string[];
  epistemicStatus: "SUPPORTED_CANDIDATE_NOT_ADOPTED";
  projectWriteAuthorized: false;
  adoptionStatus: "PROPOSED_NOT_ADOPTED";
};

export type StudyDesignInformationNeed = {
  needId: string;
  question: string;
  reason: string;
  targetOwner: "RESEARCH_PROJECT" | SpecializedOwnerId;
  intendedResolutionPath: "FUTURE_QRY_HANDOFF" | "SPECIALIZED_OWNER_HANDOFF" | "HUMAN_REVIEW";
  sourceRefs: readonly string[];
  status: "OPEN_NOT_RESOLVED";
};

export type StudyDesignProposalContribution = {
  contract: typeof STUDY_DESIGN_PROPOSAL_CONTRACT;
  contractVersion: typeof STUDY_DESIGN_RUNTIME_VERSION;
  owner: "STUDY_DESIGN";
  capabilityId: "STUDY_DESIGN_COHERENCE";
  proposalId: string;
  proposalVersion: "1.0.0";
  proposalDigest: string;
  proposalStatus: "PROPOSED_NON_ADOPTED" | "INSUFFICIENT_CONTEXT";
  sourceProject: {
    projectId: string;
    projectVersion: string;
    projectDigest: string;
    snapshotDigest: string;
  };
  options: readonly StudyDesignOption[];
  selectedOptionId: null;
  tradeOffs: readonly {
    tradeOffId: string;
    optionRefs: readonly string[];
    gains: readonly string[];
    losses: readonly string[];
    decisionRequired: true;
  }[];
  informationNeeds: readonly StudyDesignInformationNeed[];
  unresolvedQuestions: readonly string[];
  downstreamHandoffs: readonly StudyDesignHandoffProposal[];
  limitations: readonly string[];
  provenanceRefs: readonly string[];
  epistemicStatus: "PROPOSAL_ONLY" | "INSUFFICIENT_CONTEXT_UNKNOWN_PRESERVED";
  validation: StudyDesignValidationResult;
  humanDecisionRequired: true;
  projectWriteAuthorized: false;
  projectOwnershipTransferred: false;
  candidateIsAdopted: false;
};

export type StudyDesignValidationFinding = {
  code: string;
  path: string;
  message: string;
};

export type StudyDesignValidationResult = {
  status: "PASS" | "BLOCKED";
  findings: readonly StudyDesignValidationFinding[];
};

export type StudyDesignTraceFact = {
  event:
    | "INVOCATION_REQUESTED"
    | "PROJECT_VERSION_CONSUMED"
    | "PROPOSAL_PRODUCED"
    | "PROPOSAL_BLOCKED"
    | "OPTION_COUNT_RECORDED"
    | "HANDOFFS_PROPOSED";
  owner: "STUDY_DESIGN";
  capabilityId: "STUDY_DESIGN_COHERENCE";
  projectId: string;
  projectVersion: string;
  projectDigest: string;
  proposalId: string | null;
  optionCount: number | null;
  handoffRefs: readonly string[];
};

export type StudyDesignTraceSink = (fact: Readonly<StudyDesignTraceFact>) => void;
