import type { ProjectDecisionRecord, ResearchProjectDesignResult } from "@/features/research-project-construction/types";
import type { HumanDecisionEnvelope } from "@/features/protocol-designer/human-decision";
import type {
  StudyTemplateDefinition,
  StudyTemplateInstance,
  TemplateBlockStatus,
  TemplateReadinessStatus,
} from "@/features/study-template/types";

export const DOCUMENT_PROJECTION_ENGINE_VERSION = "1.2.0" as const;
export const DOCUMENT_PROJECTION_RENDERER_VERSION = "1.0.0" as const;

export type ProjectionType = string;

export type DocumentSectionStatus = "GENERATABLE" | "PARTIALLY_GENERATABLE" | "NOT_GENERATABLE" | "BLOCKED" | "NOT_APPLICABLE" | "UNKNOWN" | "FUTURE";
export type SectionApplicability = "APPLICABLE" | "CONDITIONALLY_APPLICABLE" | "NOT_APPLICABLE" | "APPLICABILITY_UNKNOWN";
export type ProjectionLifecycleState = "DRAFT" | "PARTIAL" | "READY_FOR_REVIEW" | "REVIEWED" | "SUPERSEDED" | "ARCHIVED" | "INVALIDATED";
export type ProjectionReadiness = "PARTIAL" | "READY_FOR_REVIEW";
export type EditorialPattern = "IDENTITY" | "SYNTHESIS" | "DECLARATIVE" | "ENUMERATION" | "REQUIREMENT_REGISTER" | "TRACE_REGISTER";
export type EditorialIntent = "INFORM" | "JUSTIFY" | "DECLARE" | "BOUND" | "TRACE";
export type EditorialCommitment = "CONFIRMED" | "ADOPTED" | "CANDIDATE" | "REQUIREMENT" | "UNKNOWN" | "LIMITATION" | "CONTRADICTION" | "REJECTED";
export type DocumentBlockKind = "PARAGRAPH" | "LIST" | "NOTICE" | "EMPTY_STATE";

export type ProjectionVersions = {
  engine: typeof DOCUMENT_PROJECTION_ENGINE_VERSION;
  template: string;
  pattern: string;
  compositionPolicy: string;
  projectionDefinition: string;
  renderer: string;
};

export type TemplateDocumentProjectionStatus = "SUPPORTED_PROJECTION" | "FUTURE_PROJECTION" | "NOT_APPLICABLE" | "BLOCKED" | "UNKNOWN";

export type RegulatoryResolutionReference = {
  resolutionId: string;
  corpusVersion: string;
  corpusDigest: string;
};

export type DocumentaryPatternSnapshotReference = {
  catalogId: string;
  catalogVersion: string;
  catalogDigest: string;
};

export type StudyTemplateProjectionContext = {
  definition: Readonly<StudyTemplateDefinition>;
  instance: Readonly<StudyTemplateInstance>;
};

export type ProjectionOwnership = {
  structure: "TMP-001" | "LEGACY_DOC001_PROJECTION_DEFINITION";
  content: "RESEARCH_PROJECT_AND_UPSTREAM_OWNERS";
  requirements: "REG-001";
  patterns: "DOC-002";
  editorialForm: "DOC-001";
};

export type AtomicDeclarativePredicate = {
  kind: "ROOT_PATH_EQUALS" | "ROOT_PATH_NOT_EQUALS" | "ROOT_PATH_NON_EMPTY" | "ITEM_FIELD_EQUALS" | "ITEM_FIELD_NOT_EQUALS" | "ITEM_EQUALS_ROOT" | "ITEM_NOT_EQUALS_ROOT";
  path: string;
  value?: string;
  rootPath?: string;
};

export type DeclarativePredicate = AtomicDeclarativePredicate | {
  kind: "ALL";
  predicates: AtomicDeclarativePredicate[];
};

export type CommitmentRule =
  | { kind: "STATIC"; value: EditorialCommitment }
  | { kind: "FIELD_MAP"; path: string; map: Record<string, EditorialCommitment>; fallback: EditorialCommitment }
  | { kind: "ROOT_GATE"; gateId: string; map: Partial<Record<"PENDING" | "APPROVED" | "REJECTED", EditorialCommitment>>; fallback: EditorialCommitment }
  | { kind: "SELECTED_REF"; itemPath: string; rootPath: string; selected: EditorialCommitment; other: EditorialCommitment };

export type FactDefinition = {
  select: string;
  label: string;
  template: string;
  sourceKind: string;
  sourceIdPath?: string;
  commitment: CommitmentRule;
  includeWhen?: DeclarativePredicate;
};

export type TextDefinition = {
  select: string;
  template: string;
  includeWhen?: DeclarativePredicate;
};

export type ApplicabilityDefinition =
  | { kind: "ALWAYS"; value: SectionApplicability }
  | { kind: "PATH_ENUM"; path: string; map: Record<string, SectionApplicability>; fallback: SectionApplicability }
  | { kind: "WHEN_ANY_NON_EMPTY"; paths: string[]; whenPresent: SectionApplicability; whenAbsent: SectionApplicability };

export type GenerabilityDefinition = {
  minimumFacts: number;
  requirementsOnly?: boolean;
  alwaysPartialWhenFacts?: boolean;
  partialWhenUnknowns?: boolean;
  partialWhenLimitations?: boolean;
  partialWhenPendingDecisions?: boolean;
  blockWhenContradictions?: boolean;
  blockWhen?: DeclarativePredicate[];
  messages: Partial<Record<DocumentSectionStatus, string>>;
};

export type SectionDefinition = {
  sectionId: string;
  title: string;
  order: number;
  intent: EditorialIntent;
  pattern: EditorialPattern;
  sourcePaths: string[];
  requiredObjectKinds: string[];
  optionalObjectKinds: string[];
  dependencyTypes: string[];
  specializedEngine: string | null;
  applicability: ApplicabilityDefinition;
  generability: GenerabilityDefinition;
  facts: FactDefinition[];
  unknowns: TextDefinition[];
  limitations: TextDefinition[];
  contradictions: TextDefinition[];
  staticLimitations?: string[];
  decisionGateIds: string[];
  templateNodeIds?: string[];
};

export type DocumentSectionDefinition = SectionDefinition;

export type ProjectionDefinition = {
  definitionId: string;
  projectionType: ProjectionType;
  label: string;
  title: string;
  definitionVersion: string;
  status: "IMPLEMENTED";
  sections: SectionDefinition[];
};

export type EditorialFact = {
  factId: string;
  label: string;
  value: string;
  commitment: EditorialCommitment;
  sourceRef: string;
};

export type ProjectionPlan = {
  projectionType: ProjectionType;
  supported: boolean;
  definitionId: string | null;
  title: string | null;
  templateId: string | null;
  sections: SectionDefinition[];
  templateDocumentStatus?: TemplateDocumentProjectionStatus;
  refusal: null | {
    code:
      | "UNSUPPORTED_PROJECTION_TYPE"
      | "SOURCE_PROJECT_NOT_FROZEN"
      | "DOCUMENT_HANDOFF_NOT_AUTHORIZED"
      | "SOURCE_PROJECT_REFUSED"
      | "DOC_WITHOUT_TEMPLATE_INSTANCE"
      | "DOC_TEMPLATE_PROJECT_MISMATCH"
      | "DOC_TEMPLATE_DIGEST_MISMATCH"
      | "TEMPLATE_DOCUMENT_NOT_FOUND"
      | "TEMPLATE_PROJECTION_NOT_SUPPORTED";
    reason: string;
    resumeCondition: string;
  };
};

export type CompositionPlanSection = {
  definition: DocumentSectionDefinition;
  applicability: SectionApplicability;
  status: DocumentSectionStatus;
  statusReasons: string[];
  facts: EditorialFact[];
  unknowns: string[];
  limitations: string[];
  contradictions: string[];
  humanDecisionIds: string[];
  provenanceRefs: string[];
  templateNodeIds: string[];
  templateSectionIds: string[];
  templateBlockIds: string[];
  projectObjectIds: string[];
  requirementIds: string[];
  patternIds: string[];
  sourceEngine: string;
  templateStatus: TemplateBlockStatus | null;
  templateReadiness: TemplateReadinessStatus | null;
  futureReason: string | null;
  conflicts: string[];
};

export type CompositionPlan = {
  projectionType: ProjectionType;
  sections: CompositionPlanSection[];
  sourceProjectId: string;
  sourceProjectVersion: string;
  sourceProjectDigest: string;
  humanDecisions: HumanDecisionEnvelope[];
};

export type DocumentBlock = {
  blockId: string;
  kind: DocumentBlockKind;
  label: string | null;
  items: string[];
  commitment: EditorialCommitment;
  provenanceRefs: string[];
};

export type DocumentSectionInstance = {
  sectionId: string;
  title: string;
  order: number;
  intent: EditorialIntent;
  pattern: EditorialPattern;
  applicability: SectionApplicability;
  status: DocumentSectionStatus;
  statusReasons: string[];
  blocks: DocumentBlock[];
  unknowns: string[];
  limitations: string[];
  contradictions: string[];
  humanDecisionIds: string[];
  provenanceRefs: string[];
  templateNodeIds: string[];
  templateSectionIds: string[];
  templateBlockIds: string[];
  projectObjectIds: string[];
  requirementIds: string[];
  patternIds: string[];
  sourceEngine: string;
  templateStatus: TemplateBlockStatus | null;
  templateReadiness: TemplateReadinessStatus | null;
  futureReason: string | null;
  conflicts: string[];
  contentDigest: string;
};

export const DOCUMENT_PROJECTION_AUDIT_CODES = [
  "DOC_WITHOUT_TEMPLATE_INSTANCE",
  "DOC_TEMPLATE_PROJECT_MISMATCH",
  "DOC_TEMPLATE_DIGEST_MISMATCH",
  "DOC_SECTION_WITHOUT_TEMPLATE_NODE",
  "DOC_CONTENT_WITHOUT_PROJECT_SOURCE",
  "DOC_REQUIREMENT_WITHOUT_REG_SOURCE",
  "DOC_PATTERN_WITHOUT_DOC002_SOURCE",
  "TMP_UNKNOWN_STRENGTHENED",
  "TMP_BLOCKED_BYPASSED",
  "TMP_FUTURE_SIMULATED",
  "CONFLICT_HIDDEN",
  "PROJECT_MUTATED",
  "TEMPLATE_MUTATED",
  "REG_MUTATED",
  "DOC002_MUTATED",
] as const;

export type DocumentProjectionAuditCode = (typeof DOCUMENT_PROJECTION_AUDIT_CODES)[number];
export type DocumentProjectionAuditFinding = {
  findingId: string;
  code: DocumentProjectionAuditCode;
  severity: "ERROR" | "WARNING" | "INFORMATION";
  subjectId: string;
  message: string;
  evidenceRefs: string[];
};
export type DocumentProjectionAuditResult = {
  auditVersion: "DOC-001B-AUDIT-1.0.0";
  subjectId: string;
  findings: DocumentProjectionAuditFinding[];
  counts: Record<"ERROR" | "WARNING" | "INFORMATION", number>;
  passed: boolean;
  boundary: "DETECTION_ONLY_NO_AUTOMATIC_FIX";
};

export type DocumentProjection = {
  contractVersion: typeof DOCUMENT_PROJECTION_ENGINE_VERSION;
  projectionId: string;
  seriesId: string;
  projectionType: ProjectionType;
  projectionVersion: string;
  priorProjectionId: string | null;
  lifecycle: ProjectionLifecycleState;
  readiness: ProjectionReadiness;
  title: string;
  profile: string;
  usage: string;
  audience: string;
  requestedAt: string;
  source: {
    projectId: string;
    projectVersion: string;
    projectDigest: string;
    handoffVersion: string;
    template: null | {
      templateId: string;
      templateVersion: string;
      templateRevision: number;
      templateDefinitionDigest: string;
      templateInstanceId: string;
      templateInstanceDigest: string;
      requestedDetailLevel?: StudyTemplateInstance["requestedDetailLevel"];
    };
    regulatoryResolution: null | RegulatoryResolutionReference;
    documentaryPatternSnapshot: null | DocumentaryPatternSnapshotReference;
  };
  versions: ProjectionVersions;
  ownership: ProjectionOwnership;
  documentDefinition: null | {
    documentId: string;
    templateNodeId: string;
    status: TemplateDocumentProjectionStatus;
    reason: string;
  };
  sections: DocumentSectionInstance[];
  unknowns: string[];
  limitations: string[];
  contradictions: string[];
  humanDecisions: CompositionPlan["humanDecisions"];
  provenanceRefs: string[];
  projectionDigest: string;
  audit?: DocumentProjectionAuditResult;
  legacy?: { path: "LEGACY_DIRECT_PROJECT_PROJECTION"; deprecated: true };
  boundary: "READ_ONLY_PROJECTION_NOT_PROJECT_TRUTH_NOT_CLINICAL_PROTOCOL";
};

export type ProtocolProjection = DocumentProjection & { projectionType: "PROTOCOL" };

export type LegacyDirectProjectProjectionRequest = {
  project: Readonly<ResearchProjectDesignResult>;
  decisionRecords?: ReadonlyArray<ProjectDecisionRecord>;
  projectionType: ProjectionType;
  profile: string;
  usage: string;
  audience: string;
  requestedAt: string;
  versions?: Partial<Omit<ProjectionVersions, "engine">>;
  priorProjection?: Readonly<DocumentProjection> | null;
  definitions?: ReadonlyArray<ProjectionDefinition>;
};

export type DocumentProjectionRequest = LegacyDirectProjectProjectionRequest & {
  templateContext: StudyTemplateProjectionContext;
  regulatoryResolutionRef: RegulatoryResolutionReference;
  documentaryPatternSnapshotRef: DocumentaryPatternSnapshotReference;
  humanDecisions?: ReadonlyArray<HumanDecisionEnvelope>;
  unknowns?: ReadonlyArray<string>;
  limitations?: ReadonlyArray<string>;
  provenance?: ReadonlyArray<string>;
};

export type ProjectionExecutionResult =
  | { ok: true; projection: DocumentProjection }
  | { ok: false; plan: ProjectionPlan; projection: null };

export type ProjectionHistoryEntry = {
  projection: DocumentProjection;
  historicalStatus: ProjectionLifecycleState;
};

export type ProjectionHistory = {
  seriesId: string | null;
  entries: ProjectionHistoryEntry[];
};

export type SectionDiffKind = "ADDED" | "REMOVED" | "MODIFIED" | "UNCHANGED";
export type ProjectionSectionDiff = {
  sectionId: string;
  title: string;
  kind: SectionDiffKind;
  priorStatus: DocumentSectionStatus | null;
  nextStatus: DocumentSectionStatus | null;
  priorApplicability: SectionApplicability | null;
  nextApplicability: SectionApplicability | null;
  generabilityChanged: boolean;
  applicabilityChanged: boolean;
  contentChanged: boolean;
  addedSourceRefs: string[];
  removedSourceRefs: string[];
};

export type ProjectionDiff = {
  priorProjectionId: string;
  nextProjectionId: string;
  sourceVersionChanged: boolean;
  engineVersionChanged: boolean;
  templateVersionChanged: boolean;
  patternVersionChanged: boolean;
  projectionDefinitionVersionChanged: boolean;
  rendererVersionChanged: boolean;
  changeKinds: ProjectionChangeKind[];
  sections: ProjectionSectionDiff[];
  counts: Record<SectionDiffKind, number>;
};

export type ProjectionChangeKind =
  | "PROJECT_CONTENT_CHANGED"
  | "TEMPLATE_STRUCTURE_CHANGED"
  | "REGULATORY_REQUIREMENT_CHANGED"
  | "DOCUMENTARY_PATTERN_CHANGED"
  | "RENDERER_ONLY_CHANGED"
  | "UNKNOWN_CHANGED"
  | "CONFLICT_CHANGED"
  | "LIMITATION_CHANGED";
