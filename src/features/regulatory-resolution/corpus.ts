import { logicalDigest } from "@/features/knowledge-engine/canonical";
import rawCorpus from "../../../regulatory-funding-corpus/reg-000/reg-000.corpus.json";

export type CorpusRequirement = {
  identifier: string;
  title: string;
  authority: string;
  jurisdiction: string;
  source: string[];
  version: string;
  revision: string;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  programEdition: string | null;
  supersedes: string[];
  supersededBy: string[];
  requiredDocuments: string[];
  requiredSections: string[];
  requiredFields: string[];
  requiredAnnexes: string[];
  submissionWorkflow: string[];
  deadlines: string[];
  conditions: string[];
  normativeStrength: string;
  status: string;
};

export type CorpusCondition = { conditionId: string; expression: string; unknownResult: string };
export type CorpusApplicabilityRule = {
  ruleId: string;
  title: string;
  axes: Record<string, string[]>;
  relations: {
    appliesIf: string[];
    doesNotApplyIf: string[];
    requires: string[];
    dependsOn: string[];
    conflictsWith: string[];
    supersedes: string[];
    jurisdiction: string[];
    effectivePeriod: string[];
  };
  unknownResult: string;
};

export type CorpusDocumentRequirement = { documentRequirementId: string; documentId: string; context: string; qualificationStatus: string; qualificationReasonCode: string | null; justification: string; applicabilityRuleId: string; sourceIds: string[] };
export type CorpusSubmissionRequirement = { submissionId: string; title: string; requirementIds: string[]; workflow: string[]; applicabilityRuleId: string };
export type CorpusApprovalRequirement = { approvalRequirementId: string; authority: string; appliesTo: string[]; requirementIds: string[]; resultRequired: string; sourceIds: string[] };
export type CorpusFundingProgram = { programId: string; title: string; authority: string; jurisdiction: string; officialURL: string; knownEditionIds: string[] };
export type CorpusProgramEdition = { editionId: string; programId: string; title: string; status: string; effectiveFrom: string; effectiveUntil: string; sourceIds: string[]; stages: Array<{ stage: string; deadline: string }> };

export type RegulatoryCorpusSnapshot = {
  corpus: {
    identifier: string;
    version: string;
    documentLevel: string;
    admissionStatus: string;
    verifiedAt: string;
    authorityBoundary: string;
  };
  requirements: CorpusRequirement[];
  requirementConditions: CorpusCondition[];
  applicabilityRules: CorpusApplicabilityRule[];
  documentRequirements: CorpusDocumentRequirement[];
  submissionRequirements: CorpusSubmissionRequirement[];
  approvalRequirements: CorpusApprovalRequirement[];
  fundingPrograms: CorpusFundingProgram[];
  programEditions: CorpusProgramEdition[];
};

export const REG000_CORPUS = rawCorpus as RegulatoryCorpusSnapshot;
export const REG000_CORPUS_VERSION = REG000_CORPUS.corpus.version;
export const REG000_CORPUS_DIGEST = logicalDigest(REG000_CORPUS);
export const REG000_MASTER_SHA256 = "e84c4a2bcab1cf2fd8188fa18f6a675d8ef393c1fdbbb15cad9f7ddded3e31cf" as const;
