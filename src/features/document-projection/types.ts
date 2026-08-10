import type { ProjectDecisionRecord, ResearchProjectDesignResult } from "@/features/research-project-construction/types";

export const DOCUMENT_PROJECTION_ENGINE_VERSION = "1.0.0" as const;

export type ProjectionType = string;

export type DocumentSectionStatus = "GENERATABLE" | "PARTIALLY_GENERATABLE" | "NOT_GENERATABLE" | "BLOCKED" | "NOT_APPLICABLE";
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
};

export type DeclarativePredicate = {
  kind: "ROOT_PATH_EQUALS" | "ROOT_PATH_NOT_EQUALS" | "ROOT_PATH_NON_EMPTY" | "ITEM_FIELD_EQUALS" | "ITEM_FIELD_NOT_EQUALS" | "ITEM_EQUALS_ROOT" | "ITEM_NOT_EQUALS_ROOT";
  path: string;
  value?: string;
  rootPath?: string;
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
  refusal: null | {
    code: "UNSUPPORTED_PROJECTION_TYPE" | "SOURCE_PROJECT_NOT_FROZEN" | "DOCUMENT_HANDOFF_NOT_AUTHORIZED" | "SOURCE_PROJECT_REFUSED";
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
};

export type CompositionPlan = {
  projectionType: ProjectionType;
  sections: CompositionPlanSection[];
  sourceProjectId: string;
  sourceProjectVersion: string;
  sourceProjectDigest: string;
  humanDecisions: Array<{
    decisionId: string;
    gateId: string;
    label: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    reason: string;
    actor: string | null;
    decidedAt: string | null;
  }>;
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
  contentDigest: string;
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
  };
  versions: ProjectionVersions;
  sections: DocumentSectionInstance[];
  unknowns: string[];
  limitations: string[];
  contradictions: string[];
  humanDecisions: CompositionPlan["humanDecisions"];
  provenanceRefs: string[];
  projectionDigest: string;
  boundary: "READ_ONLY_PROJECTION_NOT_PROJECT_TRUTH_NOT_CLINICAL_PROTOCOL";
};

export type ProtocolProjection = DocumentProjection & { projectionType: "PROTOCOL" };

export type DocumentProjectionRequest = {
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
  sections: ProjectionSectionDiff[];
  counts: Record<SectionDiffKind, number>;
};
