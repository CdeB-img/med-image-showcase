import { z } from "zod";
import { humanDecisionEnvelopeSchema, type HumanDecisionEnvelope } from "@/features/protocol-designer/human-decision";

export const REGULATORY_RESOLUTION_VERSION = "1.0.0" as const;

export const APPLICABILITY_STATUSES = [
  "APPLICABLE",
  "CONDITIONALLY_APPLICABLE",
  "POTENTIALLY_APPLICABLE",
  "NOT_APPLICABLE",
  "UNKNOWN_REQUIRES_QUALIFICATION",
  "UNKNOWN_MISSING_INFORMATION",
  "CONFLICTING_REQUIREMENTS",
  "SUPERSEDED",
  "OUTSIDE_EFFECTIVE_PERIOD",
] as const;

export type ApplicabilityStatus = (typeof APPLICABILITY_STATUSES)[number];
export type FactState = "KNOWN" | "CANDIDATE" | "UNKNOWN" | "NOT_APPLICABLE" | "CONFLICTING";

export type ProjectFact<T> = {
  state: FactState;
  value: T | null;
  reason: string;
  provenance: string[];
};

export type JurisdictionCode = "FR" | "EU_EEA" | "US" | "INTERNATIONAL" | "UNKNOWN" | string;
export type ProductType = "MEDICINAL_PRODUCT" | "MEDICAL_DEVICE" | "IVD" | "NO_HEALTH_PRODUCT_IDENTIFIED" | "OTHER";
export type FundingCandidateState = "CANDIDATE" | "EXPLICITLY_IDENTIFIED";

export type FundingProgramCandidate = {
  programId: string;
  state: FundingCandidateState;
  provenance: string[];
};

export type FundingProgramEditionCandidate = {
  programId: string;
  editionId: string;
  stage: ProjectFact<string>;
  selectedAfterPriorStage: ProjectFact<boolean>;
  state: FundingCandidateState;
  provenance: string[];
};

export type RegulatoryQualification = {
  qualificationId: string;
  state: "QUALIFICATION_CANDIDATE" | "HUMAN_CONFIRMED" | "HUMAN_REJECTED";
  decisionId: string | null;
  provenance: string[];
};

export type RegulatoryProjectUnknown = {
  unknownId: string;
  field: string;
  reason: string;
  provenance: string[];
};

export type RegulatoryProjectContradiction = {
  contradictionId: string;
  fields: string[];
  requirementIds: string[];
  description: string;
  provenance: string[];
};

export type RegulatoryResolutionInput = {
  contractVersion: typeof REGULATORY_RESOLUTION_VERSION;
  researchProjectId: string;
  researchProjectVersion: string;
  researchProjectDigest: string;
  resolutionAsOf: string;
  jurisdiction: ProjectFact<JurisdictionCode[]>;
  projectCharacteristics: {
    humanHealthResearch: ProjectFact<boolean>;
    projectNatures: ProjectFact<string[]>;
    intendedDocuments: ProjectFact<string[]>;
    explicitlyIncorporatedGuidance: ProjectFact<string[]>;
  };
  studyDesignCharacteristics: {
    interventionModel: ProjectFact<"INTERVENTIONAL" | "OBSERVATIONAL">;
    temporalDirection: ProjectFact<"PROSPECTIVE" | "RETROSPECTIVE" | "MIXED">;
    randomised: ProjectFact<boolean>;
    registryBased: ProjectFact<boolean>;
    reportTypes: ProjectFact<string[]>;
  };
  interventionCharacteristics: {
    interventionPresent: ProjectFact<boolean>;
    medicinalProductTrial: ProjectFact<boolean>;
    medicalDeviceStudy: ProjectFact<boolean>;
  };
  productCharacteristics: {
    productTypes: ProjectFact<ProductType[]>;
  };
  dataCharacteristics: {
    personalHealthData: ProjectFact<boolean>;
    existingData: ProjectFact<boolean>;
    prospectiveCollection: ProjectFact<boolean>;
    routinelyCollectedHealthData: ProjectFact<boolean>;
    sources: ProjectFact<string[]>;
    transferOutsideEea: ProjectFact<boolean>;
  };
  biologicalSampleCharacteristics: {
    samplesPresent: ProjectFact<boolean>;
  };
  multicenterCharacteristics: {
    multicenter: ProjectFact<boolean>;
    centerCount: ProjectFact<number>;
  };
  internationalCharacteristics: {
    international: ProjectFact<boolean>;
    centerJurisdictions: ProjectFact<JurisdictionCode[]>;
    crossCountryRequirementDiscoveryNeeded: ProjectFact<boolean>;
  };
  fundingProgramCandidates: ProjectFact<FundingProgramCandidate[]>;
  fundingProgramEditionCandidates: ProjectFact<FundingProgramEditionCandidate[]>;
  knownRegulatoryQualifications: RegulatoryQualification[];
  unknowns: RegulatoryProjectUnknown[];
  contradictions: RegulatoryProjectContradiction[];
  humanDecisions: HumanDecisionEnvelope[];
  provenance: string[];
  regulatoryCorpusVersion: string;
  regulatoryCorpusDigest: string;
};

export type ApplicabilityCheck = {
  check: "VERSION" | "EFFECTIVE_PERIOD" | "JURISDICTION" | "APPLIES_IF" | "DOES_NOT_APPLY_IF" | "REQUIRES" | "DEPENDS_ON" | "QUALIFICATION" | "CONFLICT";
  reference: string;
  outcome: "SATISFIED" | "NOT_SATISFIED" | "POTENTIAL" | "UNKNOWN_MISSING_INFORMATION" | "UNKNOWN_REQUIRES_QUALIFICATION" | "CONFLICT" | "NOT_EVALUATED";
  reason: string;
  field: string | null;
  qualificationId: string | null;
  provenance: string[];
};

export type RequirementResolution = {
  requirementId: string;
  title: string;
  status: ApplicabilityStatus;
  normativeStrength: string;
  jurisdiction: string;
  applicableJurisdictions: string[];
  excludedJurisdictions: string[];
  authority: string;
  sourceIds: string[];
  reason: string;
  conditions: string[];
  checks: ApplicabilityCheck[];
  edition: string | null;
  effectivePeriod: { from: string | null; until: string | null };
  supersededBy: string[];
  provenance: string[];
};

export type QualificationResolution = {
  qualificationId: string;
  status: "QUALIFICATION_CANDIDATE" | "UNKNOWN_REQUIRES_QUALIFICATION" | "HUMAN_CONFIRMED";
  blockedRequirementIds: string[];
  reason: string;
  decisionId: string | null;
  provenance: string[];
};

export type MissingRegulatoryInformation = {
  field: string;
  reason: string;
  blockedRequirementIds: string[];
  possibleConsequences: string[];
  prioritySignal: "BLOCKING" | "HIGH" | "NORMAL";
  provenance: string[];
};

export type RegulatoryContradiction = {
  contradictionId: string;
  requirementIds: string[];
  description: string;
  status: "OPEN_NO_AUTOMATIC_ARBITRATION";
  provenance: string[];
};

export type HumanReviewRequirement = {
  reviewId: string;
  kind: "REGULATORY_QUALIFICATION" | "CORPUS_CONTRADICTION" | "MISSING_INFORMATION" | "EXTERNAL_AUTHORITY_REVIEW";
  requirementIds: string[];
  reason: string;
  decisionId: string | null;
  status: "PENDING" | "PRESERVED_HUMAN_DECISION";
  provenance: string[];
};

export type DocumentRequirementResolution = {
  documentRequirementId: string | null;
  documentId: string;
  status: ApplicabilityStatus;
  requirementId: string;
  sourceIds: string[];
  authority: string;
  reason: string;
  conditions: string[];
  edition: string | null;
  effectivePeriod: { from: string | null; until: string | null };
  sections: string[];
  fields: string[];
  annexes: string[];
  provenance: string[];
};

export type SubmissionRequirementResolution = {
  submissionId: string;
  title: string;
  status: ApplicabilityStatus;
  requirementIds: string[];
  workflow: string[];
  sourceIds: string[];
  provenance: string[];
};

export type ApprovalRequirementResolution = {
  approvalRequirementId: string;
  status: ApplicabilityStatus;
  authority: string;
  resultRequired: string;
  requirementIds: string[];
  sourceIds: string[];
  provenance: string[];
};

export type FundingRequirementResolution = {
  requirementId: string;
  programId: string | null;
  editionId: string | null;
  status: ApplicabilityStatus;
  documents: string[];
  sections: string[];
  fields: string[];
  annexes: string[];
  deadlines: string[];
  submissionWorkflow: string[];
  sourceIds: string[];
  provenance: string[];
};

export type GuidanceResolution = {
  requirementId: string;
  title: string;
  status: ApplicabilityStatus;
  guidanceKind: "METHODOLOGICAL_GUIDANCE" | "REPORTING_GUIDANCE";
  sourceIds: string[];
  reason: string;
  provenance: string[];
};

export type RegulatoryTraceEntry = {
  sequence: number;
  operation: string;
  requirementId: string | null;
  inputDigest: string;
  outputDigest: string;
  decision: string;
  checks: ApplicabilityCheck[];
};

export type RegulatoryResolutionReadiness = {
  status: "RESOLUTION_COMPLETE" | "RESOLUTION_PARTIAL" | "QUALIFICATION_REQUIRED" | "MISSING_INFORMATION" | "CONTRADICTION_OPEN" | "CORPUS_INSUFFICIENT" | "CORPUS_VERSION_OUTDATED";
  reasons: string[];
  unresolvedRequirementIds: string[];
  notice: "LOCAL_REGULATORY_RESOLUTION_READINESS_ONLY_NOT_SCIENTIFIC_OR_REGULATORY_APPROVAL";
};

export type RegulatoryCorpusDiagnostic = {
  diagnosticId: string;
  severity: "INFORMATION" | "WARNING" | "ERROR";
  kind: "CANDIDATE_CORPUS" | "CORPUS_VERSION_MISMATCH" | "UNINTERPRETED_CONDITION" | "SYMBOLIC_RELATION";
  ruleId: string | null;
  reference: string;
  requirementIds: string[];
  description: string;
  provenance: string[];
};

export type RegulatoryResolutionResult = {
  contractVersion: typeof REGULATORY_RESOLUTION_VERSION;
  resolutionId: string;
  researchProjectId: string;
  researchProjectVersion: string;
  researchProjectDigest: string;
  corpusVersion: string;
  corpusDigest: string;
  resolvedAt: string;
  applicableRequirements: RequirementResolution[];
  potentiallyApplicableRequirements: RequirementResolution[];
  notApplicableRequirements: RequirementResolution[];
  unresolvedRequirements: RequirementResolution[];
  regulatoryMandatoryRequirements: RequirementResolution[];
  requiredQualifications: QualificationResolution[];
  missingInformation: MissingRegulatoryInformation[];
  contradictions: RegulatoryContradiction[];
  humanReviewRequirements: HumanReviewRequirement[];
  fundingRequirements: FundingRequirementResolution[];
  documentRequirements: DocumentRequirementResolution[];
  submissionRequirements: SubmissionRequirementResolution[];
  approvalRequirements: ApprovalRequirementResolution[];
  methodologicalGuidance: GuidanceResolution[];
  reportingGuidance: GuidanceResolution[];
  corpusDiagnostics: RegulatoryCorpusDiagnostic[];
  humanDecisions: HumanDecisionEnvelope[];
  provenance: {
    engineVersion: typeof REGULATORY_RESOLUTION_VERSION;
    researchProjectRefs: string[];
    corpusRefs: string[];
    sourceRefs: string[];
    authorityBoundary: "METHODOLOGICAL_AID_NOT_REGULATORY_VALIDATION";
  };
  trace: RegulatoryTraceEntry[];
  readiness: RegulatoryResolutionReadiness;
};

const stringArray = z.array(z.string().min(1).max(4_000)).max(2_000);
const factSchema = <T extends z.ZodTypeAny>(value: T) => z.object({
  state: z.enum(["KNOWN", "CANDIDATE", "UNKNOWN", "NOT_APPLICABLE", "CONFLICTING"]),
  value: value.nullable(),
  reason: z.string().min(1),
  provenance: stringArray,
}).strict().superRefine((fact, context) => {
  if (["KNOWN", "CANDIDATE", "CONFLICTING"].includes(fact.state) && fact.value === null) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: `FACT_VALUE_REQUIRED_FOR_${fact.state}` });
  }
  if (["UNKNOWN", "NOT_APPLICABLE"].includes(fact.state) && fact.value !== null) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: `FACT_VALUE_MUST_BE_NULL_FOR_${fact.state}` });
  }
});

const fundingProgramSchema = z.object({ programId: z.string().min(1), state: z.enum(["CANDIDATE", "EXPLICITLY_IDENTIFIED"]), provenance: stringArray }).strict();
const fundingEditionSchema = z.object({
  programId: z.string().min(1), editionId: z.string().min(1), stage: factSchema(z.string().min(1)), selectedAfterPriorStage: factSchema(z.boolean()),
  state: z.enum(["CANDIDATE", "EXPLICITLY_IDENTIFIED"]), provenance: stringArray,
}).strict();

export const regulatoryResolutionInputSchema = z.object({
  contractVersion: z.literal(REGULATORY_RESOLUTION_VERSION),
  researchProjectId: z.string().min(1), researchProjectVersion: z.string().min(1), researchProjectDigest: z.string().min(1), resolutionAsOf: z.string().datetime({ offset: true }),
  jurisdiction: factSchema(z.array(z.string().min(1)).min(1)),
  projectCharacteristics: z.object({ humanHealthResearch: factSchema(z.boolean()), projectNatures: factSchema(stringArray), intendedDocuments: factSchema(stringArray), explicitlyIncorporatedGuidance: factSchema(stringArray) }).strict(),
  studyDesignCharacteristics: z.object({ interventionModel: factSchema(z.enum(["INTERVENTIONAL", "OBSERVATIONAL"])), temporalDirection: factSchema(z.enum(["PROSPECTIVE", "RETROSPECTIVE", "MIXED"])), randomised: factSchema(z.boolean()), registryBased: factSchema(z.boolean()), reportTypes: factSchema(stringArray) }).strict(),
  interventionCharacteristics: z.object({ interventionPresent: factSchema(z.boolean()), medicinalProductTrial: factSchema(z.boolean()), medicalDeviceStudy: factSchema(z.boolean()) }).strict(),
  productCharacteristics: z.object({ productTypes: factSchema(z.array(z.enum(["MEDICINAL_PRODUCT", "MEDICAL_DEVICE", "IVD", "NO_HEALTH_PRODUCT_IDENTIFIED", "OTHER"]))) }).strict(),
  dataCharacteristics: z.object({ personalHealthData: factSchema(z.boolean()), existingData: factSchema(z.boolean()), prospectiveCollection: factSchema(z.boolean()), routinelyCollectedHealthData: factSchema(z.boolean()), sources: factSchema(stringArray), transferOutsideEea: factSchema(z.boolean()) }).strict(),
  biologicalSampleCharacteristics: z.object({ samplesPresent: factSchema(z.boolean()) }).strict(),
  multicenterCharacteristics: z.object({ multicenter: factSchema(z.boolean()), centerCount: factSchema(z.number().int().nonnegative()) }).strict(),
  internationalCharacteristics: z.object({ international: factSchema(z.boolean()), centerJurisdictions: factSchema(z.array(z.string().min(1))), crossCountryRequirementDiscoveryNeeded: factSchema(z.boolean()) }).strict(),
  fundingProgramCandidates: factSchema(z.array(fundingProgramSchema)), fundingProgramEditionCandidates: factSchema(z.array(fundingEditionSchema)),
  knownRegulatoryQualifications: z.array(z.object({ qualificationId: z.string().min(1), state: z.enum(["QUALIFICATION_CANDIDATE", "HUMAN_CONFIRMED", "HUMAN_REJECTED"]), decisionId: z.string().min(1).nullable(), provenance: stringArray }).strict()),
  unknowns: z.array(z.object({ unknownId: z.string().min(1), field: z.string().min(1), reason: z.string().min(1), provenance: stringArray }).strict()),
  contradictions: z.array(z.object({ contradictionId: z.string().min(1), fields: stringArray, requirementIds: stringArray, description: z.string().min(1), provenance: stringArray }).strict()),
  humanDecisions: z.array(humanDecisionEnvelopeSchema), provenance: stringArray,
  regulatoryCorpusVersion: z.string().min(1), regulatoryCorpusDigest: z.string().min(1),
}).strict();

export const parseRegulatoryResolutionInput = (value: unknown): RegulatoryResolutionInput => regulatoryResolutionInputSchema.parse(value) as RegulatoryResolutionInput;
