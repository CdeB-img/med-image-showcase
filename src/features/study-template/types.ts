import type { PatternCatalog, PatternStatus } from "@/features/documentary-knowledge/types";
import type { HumanDecisionEnvelope } from "@/features/protocol-designer/human-decision";
import type { RegulatoryResolutionResult } from "@/features/regulatory-resolution/types";
import type { ResearchProjectDesignResult } from "@/features/research-project-construction/types";

export const STUDY_TEMPLATE_ENGINE_VERSION = "1.0.0" as const;
export const STUDY_TEMPLATE_SCHEMA_VERSION = "1.0.0" as const;

export const TEMPLATE_NODE_KINDS = [
  "DOCUMENT",
  "SECTION",
  "SUBSECTION",
  "BLOCK",
  "TABLE",
  "ANNEX",
  "WORKFLOW",
  "DECISION",
  "CONDITIONAL_BLOCK",
  "OPTIONAL_BLOCK",
  "REQUIRED_BLOCK",
  "FUTURE_BLOCK",
  "REFERENCE",
] as const;

export const TEMPLATE_RELATION_TYPES = [
  "CONTAINS",
  "DEPENDS_ON",
  "REQUIRES",
  "OPTIONALLY_REQUIRES",
  "PRECEDES",
  "FOLLOWS",
  "SPECIALIZES",
  "GENERALIZES",
  "CONFLICTS_WITH",
  "EXCLUDES",
  "GENERATES",
  "USES_PATTERN",
  "USES_REQUIREMENT",
  "USES_PROJECT_OBJECT",
] as const;

export const TEMPLATE_BLOCK_STATUSES = [
  "REQUIRED",
  "OPTIONAL",
  "CONDITIONAL",
  "NOT_APPLICABLE",
  "BLOCKED",
  "UNKNOWN",
  "FUTURE",
  "CONFLICTING",
] as const;

export const TEMPLATE_READINESS_STATUSES = [
  "COMPLETE",
  "PARTIAL",
  "BLOCKED",
  "UNKNOWN",
  "FUTURE",
  "CONFLICTING",
  "INCOMPLETE",
] as const;

export const TEMPLATE_SUPPORT_KINDS = [
  "PROJECT_SUPPORT",
  "REGULATORY_SUPPORT",
  "DOCUMENTARY_SUPPORT",
  "DEPENDENCY_SUPPORT",
  "HUMAN_DECISION_SUPPORT",
] as const;

export const TEMPLATE_AUDIT_CODES = [
  "TEMPLATE_WITHOUT_PROJECT",
  "TEMPLATE_WITHOUT_REQUIREMENTS",
  "TEMPLATE_WITHOUT_PATTERNS",
  "BLOCK_WITHOUT_SOURCE",
  "ORPHAN_BLOCK",
  "ORPHAN_DOCUMENT",
  "INVALID_RELATION",
  "INVALID_DEPENDENCY",
  "CIRCULAR_TEMPLATE",
  "UNKNOWN_DOWNGRADED",
  "MISSING_PROVENANCE",
  "BROKEN_REFERENCE",
  "CONFLICT_HIDDEN",
  "FUTURE_BLOCK_REMOVED",
  "RESEARCH_PROJECT_MUTATED",
  "REG001_MUTATED",
  "DOC002_MUTATED",
] as const;

export type TemplateNodeKind = (typeof TEMPLATE_NODE_KINDS)[number];
export type TemplateRelationType = (typeof TEMPLATE_RELATION_TYPES)[number];
export type TemplateBlockStatus = (typeof TEMPLATE_BLOCK_STATUSES)[number];
export type TemplateReadinessStatus = (typeof TEMPLATE_READINESS_STATUSES)[number];
export type TemplateSupportKind = (typeof TEMPLATE_SUPPORT_KINDS)[number];
export type TemplateAuditCode = (typeof TEMPLATE_AUDIT_CODES)[number];
export type TemplateDetailLevel = "FULL" | "MEDIUM" | "SHORT" | "MINIMAL";
export type TemplateFamilyAxis = "STUDY" | "DESIGN" | "DATA_SOURCE" | "JURISDICTION" | "FUNDING" | "PRODUCT" | "METHOD";
export type FamilyResolutionStatus = "APPLICABLE" | "POTENTIALLY_APPLICABLE" | "NOT_APPLICABLE" | "UNKNOWN" | "CONFLICTING";

export type TemplateVersionRecord = {
  templateVersion: string;
  templateRevision: number;
  createdAt: string;
  updatedAt: string;
  derivedFrom: string | null;
  supersedes: string | null;
  supersededBy: string | null;
  reason: string;
  provenance: string[];
};

export type StudyFamilyDefinition = {
  familyId: string;
  label: string;
  axis: TemplateFamilyAxis;
  description: string;
  resolver: "ALWAYS" | "PROJECT_DESIGN" | "PROJECT_IMAGING" | "REGULATORY_TOKEN" | "FUNDING_PROGRAM";
  resolverTokens: string[];
  provenance: string[];
};

export type StudyFamilyProfile = {
  familyId: string;
  source: "PROJECT" | "REG-001" | "PROJECT_AND_REG-001" | "TMP-001_BASE";
  status: FamilyResolutionStatus;
  reason: string;
  supportingProjectFacts: string[];
  supportingRequirements: string[];
  supportingPatterns: string[];
  conflicts: string[];
  unknowns: string[];
};

export type TemplateNodeDefinition = {
  nodeId: string;
  kind: TemplateNodeKind;
  label: string;
  description: string;
  documentIds: string[];
  familyIds: string[];
  defaultStatus: "CONDITIONAL" | "FUTURE" | "UNKNOWN";
  projectSelectors: string[];
  requirementTokens: string[];
  patternCategories: string[];
  dependencyIds: string[];
  detailLevels: TemplateDetailLevel[];
  provenance: string[];
};

export type TemplateRelation = {
  relationId: string;
  fromId: string;
  type: TemplateRelationType;
  toId: string;
  reason: string;
  provenance: string[];
};

export type TemplateGraph = {
  graphId: string;
  graphVersion: string;
  nodes: TemplateNodeDefinition[];
  relations: TemplateRelation[];
  digest: string;
  boundary: "LOGICAL_STRUCTURE_ONLY_NO_DOCUMENT_GENERATION";
};

export type BlockDefinition = {
  blockId: string;
  nodeId: string;
  label: string;
  purpose: string;
  reusable: boolean;
  detailLevels: TemplateDetailLevel[];
  provenance: string[];
};

export type SectionDefinition = {
  sectionId: string;
  nodeId: string;
  label: string;
  order: number;
  blockIds: string[];
  detailLevels: TemplateDetailLevel[];
  provenance: string[];
};

export type DocumentDefinition = {
  documentId: string;
  nodeId: string;
  label: string;
  familyIds: string[];
  sectionIds: string[];
  sharedBlockIds: string[];
  variants: Array<{ variantId: string; label: string; condition: string; status: "DECLARED_LOGICAL_VARIANT" }>;
  detailLevels: TemplateDetailLevel[];
  futureConsumer: "DOC-001";
  status: "LOGICAL_DEFINITION_ONLY";
  provenance: string[];
};

export type StudyTemplateDefinition = TemplateVersionRecord & {
  templateId: string;
  label: string;
  description: string;
  familyIds: string[];
  graph: TemplateGraph;
  documents: DocumentDefinition[];
  sections: SectionDefinition[];
  blocks: BlockDefinition[];
  contracts: string[];
  boundary: "COMPOSITION_ONLY_NO_SCIENCE_NO_REQUIREMENT_NO_PATTERN_NO_DOCUMENT";
  behaviorDigest: string;
  digest: string;
};

export type TemplateSupport = {
  supportId: string;
  kind: TemplateSupportKind;
  sourceRefs: string[];
  supportLevel: "DIRECT" | "CONDITIONAL" | "UNKNOWN" | "EXCLUSION" | "REFERENCE_ONLY" | "FUTURE_DEPENDENCY";
  reason: string;
  provenance: string[];
  patternStatus?: PatternStatus;
};

export type TemplateHumanDecision = {
  decisionId: string;
  actor: string;
  mandate: string;
  targetNodeIds: string[];
  outcome: "REQUIRED" | "OPTIONAL" | "NOT_APPLICABLE" | "BLOCKED" | "CONDITIONAL";
  reason: string;
  version: number;
  timestamp: string;
  provenance: string[];
};

export type TemplateCondition = {
  conditionId: string;
  targetNodeId: string;
  expression: string;
  status: "SATISFIED" | "NOT_SATISFIED" | "UNKNOWN";
  sourceRefs: string[];
  reason: string;
};

export type TemplateConflict = {
  conflictId: string;
  sources: string[];
  affectedNodes: string[];
  reason: string;
  status: "OPEN";
  possibleResolutions: string[];
  humanDecisionRequired: true;
};

export type TemplateMissingInformation = {
  missingInformationId: string;
  targetNodeIds: string[];
  field: string;
  reason: string;
  sourceRefs: string[];
  status: "OPEN";
};

export type TemplateNodeInstance = {
  nodeId: string;
  definitionRef: string;
  kind: TemplateNodeKind;
  label: string;
  status: TemplateBlockStatus;
  readiness: TemplateReadinessStatus;
  supports: TemplateSupport[];
  conditionIds: string[];
  conflictIds: string[];
  unknownRefs: string[];
  limitationRefs: string[];
  decisionRefs: string[];
  provenance: string[];
};

export type TemplateRequirementMapping = {
  requirementId: string;
  status: string;
  nodeIds: string[];
  reason: string;
  sourceRefs: string[];
};

export type TemplatePatternMapping = {
  patternId: string;
  patternStatus: PatternStatus;
  nodeIds: string[];
  reason: string;
  sourceRefs: string[];
  boundary: "REFERENCE_ONLY_NEVER_MAKES_REQUIRED";
};

export type TemplateDocumentMapping = {
  documentId: string;
  nodeId: string;
  sectionIds: string[];
  blockIds: string[];
  status: TemplateBlockStatus;
  readiness: TemplateReadinessStatus;
  futureConsumer: "DOC-001";
  boundary: "LOGICAL_DEFINITION_NOT_DOCUMENT_PROJECTION";
};

export type StudyTemplateCompositionInput = {
  researchProject: Readonly<ResearchProjectDesignResult>;
  applicableRequirementSet: Readonly<RegulatoryResolutionResult>;
  documentaryPatternGraph: Readonly<PatternCatalog>;
  humanDecisions?: ReadonlyArray<TemplateHumanDecision>;
  upstreamHumanDecisions?: ReadonlyArray<HumanDecisionEnvelope>;
  declaredUnknowns?: ReadonlyArray<{ unknownId: string; field: string; reason: string; provenance: string[] }>;
  declaredLimitations?: ReadonlyArray<{ limitationId: string; reason: string; provenance: string[] }>;
  compositionAsOf: string;
  templateId?: string;
  requestedDetailLevel?: TemplateDetailLevel;
};

export type StudyTemplateInstance = {
  contractVersion: typeof STUDY_TEMPLATE_SCHEMA_VERSION;
  engineVersion: typeof STUDY_TEMPLATE_ENGINE_VERSION;
  instanceId: string;
  templateId: string;
  templateVersion: string;
  templateRevision: number;
  composedAt: string;
  requestedDetailLevel: TemplateDetailLevel;
  inputRefs: {
    researchProjectId: string;
    researchProjectVersion: string;
    researchProjectDigest: string;
    regulatoryResolutionId: string;
    regulatoryCorpusVersion: string;
    regulatoryCorpusDigest: string;
    documentaryCatalogId: string;
    documentaryCatalogVersion: string;
    documentaryCatalogDigest: string;
  };
  familyProfiles: StudyFamilyProfile[];
  nodes: TemplateNodeInstance[];
  relations: TemplateRelation[];
  documents: TemplateDocumentMapping[];
  conditions: TemplateCondition[];
  conflicts: TemplateConflict[];
  missingInformation: TemplateMissingInformation[];
  unknowns: Array<{ unknownId: string; field: string; reason: string; provenance: string[] }>;
  limitations: Array<{ limitationId: string; reason: string; provenance: string[] }>;
  humanDecisions: TemplateHumanDecision[];
  upstreamHumanDecisionRefs: string[];
  requirementMapping: TemplateRequirementMapping[];
  patternMapping: TemplatePatternMapping[];
  dependencyGraph: { nodes: string[]; edges: TemplateRelation[]; digest: string };
  readinessGraph: { nodes: Array<{ nodeId: string; readiness: TemplateReadinessStatus }>; overall: TemplateReadinessStatus; digest: string };
  inputMutationChecks: { researchProjectUnchanged: boolean; reg001Unchanged: boolean; doc002Unchanged: boolean };
  provenance: string[];
  trace: Array<{ sequence: number; operation: string; inputRefs: string[]; outputRefs: string[]; decision: string; mode: "DETERMINISTIC" | "HUMAN_INPUT" | "BOUNDARY" }>;
  digest: string;
  boundary: "LOGICAL_STRUCTURE_ONLY_NOT_A_DOCUMENT_NOT_A_PROTOCOL_NOT_A_DECISION";
};

export type TemplateAuditFinding = {
  findingId: string;
  code: TemplateAuditCode;
  severity: "ERROR" | "WARNING" | "INFORMATION";
  subjectId: string;
  message: string;
  evidenceRefs: string[];
};

export type TemplateAuditResult = {
  auditVersion: string;
  subjectId: string;
  findings: TemplateAuditFinding[];
  counts: Record<"ERROR" | "WARNING" | "INFORMATION", number>;
  passed: boolean;
  boundary: "DETECTION_ONLY_NO_AUTOMATIC_FIX";
};

export type TemplateStatistics = {
  templateCount: number;
  familyCount: number;
  documentCount: number;
  sectionCount: number;
  blockCount: number;
  reusableBlockCount: number;
  nodeCount: number;
  relationCount: number;
  instanceCount: number;
  byNodeKind: Record<string, number>;
  byRelationType: Record<string, number>;
  byBlockStatus: Record<string, number>;
  byReadiness: Record<string, number>;
  provenanceCoveragePercent: number;
};

export type StudyTemplateCatalog = {
  contractVersion: typeof STUDY_TEMPLATE_SCHEMA_VERSION;
  catalogId: string;
  version: string;
  generatedAt: string;
  templates: StudyTemplateDefinition[];
  families: StudyFamilyDefinition[];
  graph: TemplateGraph;
  statistics: TemplateStatistics;
  audit: TemplateAuditResult;
  digest: string;
  boundary: "TEMPLATE_STRUCTURE_CATALOG_ONLY_NOT_PROJECT_TRUTH";
};

export type TemplateQuery = {
  text?: string;
  familyIds?: string[];
  nodeKinds?: TemplateNodeKind[];
  documentIds?: string[];
};

export type TemplateQueryResult = {
  query: TemplateQuery;
  templateIds: string[];
  nodeIds: string[];
  documentIds: string[];
  catalogDigest: string;
};

export type StudyTemplateExport = {
  schemaVersion: typeof STUDY_TEMPLATE_SCHEMA_VERSION;
  exportedAt: string;
  catalog: StudyTemplateCatalog;
  instances: StudyTemplateInstance[];
  digest: string;
  boundary: "STRUCTURED_EXPORT_ONLY_NO_DOCUMENT";
};
