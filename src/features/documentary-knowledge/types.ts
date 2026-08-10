export const DOCUMENTARY_KNOWLEDGE_ENGINE_VERSION = "1.0.0" as const;
export const DOCUMENTARY_KNOWLEDGE_SCHEMA_VERSION = "1.0.0" as const;

export const PATTERN_STATUSES = [
  "CANDIDATE_ONLY",
  "SUPPORTED_BY_MULTIPLE_DOCUMENTS",
  "SUPPORTED_BY_MULTIPLE_FAMILIES",
  "LOCAL_PRACTICE",
  "HISTORICAL_REFERENCE",
  "EXTERNAL_REFERENCE",
  "SUPERSEDED",
  "UNKNOWN",
] as const;

export const FORBIDDEN_PATTERN_STATUSES = ["VALIDATED", "OFFICIAL", "APPROVED"] as const;

export const PATTERN_CATEGORIES = [
  "Document Structure",
  "Editorial",
  "Workflow",
  "Decision",
  "Review",
  "Validation",
  "Quality",
  "CoreLab",
  "Acquisition",
  "Imaging",
  "Data",
  "Monitoring",
  "Regulatory Interaction",
  "Funding",
  "Deviation",
  "Training",
  "Operational",
  "Project",
  "Communication",
  "Risk",
  "Software",
  "Equipment",
  "Troubleshooting",
  "Human Decision",
  "Unknown",
] as const;

export const DOCUMENTARY_CONFIDENCE_LEVELS = [
  "SINGLE_DOCUMENT",
  "MULTIPLE_DOCUMENTS",
  "MULTIPLE_PROJECTS",
  "MULTIPLE_INSTITUTIONS",
  "LOCAL_ONLY",
  "UNKNOWN",
] as const;

export const PATTERN_RELATION_TYPES = [
  "DEPENDS_ON",
  "REQUIRES",
  "OPTIONALLY_REQUIRES",
  "PRECEDES",
  "FOLLOWS",
  "GENERATES",
  "CONSUMES",
  "VALIDATES",
  "REVIEWS",
  "REPLACES",
  "SPECIALIZES",
  "GENERALIZES",
  "CONFLICTS_WITH",
  "COMPLEMENTS",
  "USES",
  "DERIVES_FROM",
  "SUPPORTED_BY",
  "ALTERNATIVE_TO",
  "COEXISTS_WITH",
  "PRODUCES",
] as const;

export const PATTERN_AUDIT_CODES = [
  "PATTERN_WITHOUT_EVIDENCE",
  "PATTERN_WITHOUT_PROVENANCE",
  "PATTERN_WITHOUT_CATEGORY",
  "ORPHAN_PATTERN",
  "DANGLING_RELATION",
  "INVALID_VARIANT",
  "CIRCULAR_HIERARCHY",
  "UNRESOLVED_CONTRADICTION",
  "LOCAL_PATTERN_PROMOTED",
  "EXTERNAL_REFERENCE_PROMOTED",
  "HISTORICAL_PATTERN_PROMOTED",
  "SENSITIVE_VALUE_LEAK",
  "SOURCE_VERSION_MISSING",
  "BROKEN_SOURCE_REFERENCE",
] as const;

export type PatternStatus = (typeof PATTERN_STATUSES)[number];
export type PatternCategory = (typeof PATTERN_CATEGORIES)[number];
export type DocumentaryConfidence = (typeof DOCUMENTARY_CONFIDENCE_LEVELS)[number];
export type PatternRelationType = (typeof PATTERN_RELATION_TYPES)[number];
export type PatternAuditCode = (typeof PATTERN_AUDIT_CODES)[number];
export type PatternOrigin = "DOCUMENTARY_CORPUS" | "LOCAL_PRACTICE" | "HISTORICAL_REFERENCE" | "EXTERNAL_REFERENCE" | "UNKNOWN";

export type PatternSourceReference = {
  sourceId: string;
  corpusId: string;
  artifactPath: string;
  artifactVersion: string;
  artifactDigest: string;
  sourceKind: "DERIVED_AUDIT" | "DERIVED_INTELLIGENCE" | "DERIVED_OPERATIONAL_CORPUS" | "EXTERNAL_COMPARISON";
  authorityBoundary: "EVIDENCE_ONLY_NOT_AUTHORITY";
};

export type PatternEvidence = {
  evidenceId: string;
  sourceId: string;
  locator: string;
  observation: string;
  sourceDocumentRefs: string[];
  familyRef: string | null;
  projectRef: string | null;
  institutionRef: string | null;
  extractedFactIds: string[];
};

export type PatternVariant = {
  variantId: string;
  name: string;
  description: string;
  applicability: string;
  kind: "OBSERVED_VARIANT" | "HISTORICAL_VARIANT" | "LOCAL_VARIANT" | "TARGET_VARIANT" | "UNRESOLVED_VARIANT";
  evidenceIds: string[];
  limitations: string[];
};

export type PatternProvenance = {
  sourceIds: string[];
  evidenceIds: string[];
  factIds: string[];
  sourceVersions: Record<string, string>;
  extractionDates: string[];
  transformation: "ABSTRACTION_FROM_PREEXTRACTED_DOCUMENTARY_OUTPUT";
  abstractionRuleVersion: string;
  recordDigest: string;
};

export type PatternRelationship = {
  relationId: string;
  fromId: string;
  type: PatternRelationType;
  toId: string;
  rationale: string;
  evidenceIds: string[];
  provenanceSourceIds: string[];
  status: "CANDIDATE_ONLY" | "UNRESOLVED";
};

export type DocumentaryFact = {
  factId: string;
  behaviorKey: string;
  name: string;
  description: string;
  category: PatternCategory;
  origin: PatternOrigin;
  scope: string;
  inputs: string[];
  actions: string[];
  outputs: string[];
  evidence: PatternEvidence[];
  variants: PatternVariant[];
  limitations: string[];
  sourceIds: string[];
  extractedAt: string;
  relatedBehaviorKeys: Array<{ type: PatternRelationType; targetBehaviorKey?: string; targetNodeId?: string; rationale: string }>;
};

export type DocumentaryPattern = {
  patternId: string;
  name: string;
  description: string;
  category: PatternCategory;
  status: PatternStatus;
  confidence: DocumentaryConfidence;
  origin: PatternOrigin;
  sources: PatternSourceReference[];
  evidence: PatternEvidence[];
  relationships: PatternRelationship[];
  variants: PatternVariant[];
  limitations: string[];
  provenance: PatternProvenance;
  version: string;
  createdFrom: string[];
};

export type PatternGraphNode = {
  nodeId: string;
  kind: "PATTERN" | "EVIDENCE" | "SOURCE" | "FACT" | "EXTERNAL_REFERENCE";
  label: string;
};

export type PatternGraph = {
  graphVersion: string;
  nodes: PatternGraphNode[];
  edges: PatternRelationship[];
  digest: string;
};

export type PatternAuditFinding = {
  findingId: string;
  code: PatternAuditCode;
  severity: "ERROR" | "WARNING" | "INFORMATION";
  subjectId: string;
  message: string;
  evidenceIds: string[];
};

export type PatternAuditResult = {
  auditVersion: string;
  catalogDigest: string;
  findings: PatternAuditFinding[];
  counts: Record<"ERROR" | "WARNING" | "INFORMATION", number>;
  passed: boolean;
  boundary: "DETECTION_ONLY_NO_AUTOMATIC_FIX";
};

export type PatternStatistics = {
  patternCount: number;
  factCount: number;
  evidenceCount: number;
  sourceCount: number;
  relationCount: number;
  variantCount: number;
  categoryCount: number;
  averageEvidencePerPattern: number;
  localPatternCount: number;
  historicalPatternCount: number;
  externalPatternCount: number;
  candidateOnlyPatternCount: number;
  supportedByMultipleDocumentsCount: number;
  supportedByMultipleFamiliesCount: number;
  contradictionCount: number;
  consumerCount: number;
  orphanPatternCount: number;
  patternWithoutProvenanceCount: number;
  patternWithoutConsumerCount: number;
  patternsWithoutVariantCount: number;
  supersededPatternCount: number;
  patternsRequiringHumanReviewCount: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  byConfidence: Record<string, number>;
  byOrigin: Record<string, number>;
  provenanceCoveragePercent: number;
  evidenceCoveragePercent: number;
};

export type PatternCatalog = {
  contractVersion: typeof DOCUMENTARY_KNOWLEDGE_SCHEMA_VERSION;
  catalogId: string;
  version: string;
  generatedAt: string;
  priorCatalogId: string | null;
  sourceCatalog: PatternSourceReference[];
  patterns: DocumentaryPattern[];
  relations: PatternRelationship[];
  graph: PatternGraph;
  statistics: PatternStatistics;
  audit: PatternAuditResult;
  digest: string;
  boundary: "DOCUMENTARY_KNOWLEDGE_ONLY_NOT_SCIENCE_NOT_RULE_NOT_DECISION";
};

export type PatternQuery = {
  text?: string;
  categories?: PatternCategory[];
  statuses?: PatternStatus[];
  origins?: PatternOrigin[];
  confidence?: DocumentaryConfidence[];
  sourceIds?: string[];
  relatedTo?: string;
};

export type PatternQueryResult = {
  query: PatternQuery;
  patternIds: string[];
  patterns: DocumentaryPattern[];
  catalogDigest: string;
};

export type PatternCatalogSnapshot = {
  snapshotId: string;
  schemaVersion: typeof DOCUMENTARY_KNOWLEDGE_SCHEMA_VERSION;
  catalogId: string;
  catalogVersion: string;
  catalogDigest: string;
  priorSnapshotId: string | null;
  createdAt: string;
  reason: string;
  payload: PatternCatalog;
};

export type PatternCatalogHistory = {
  historyId: string;
  snapshots: PatternCatalogSnapshot[];
};

export type PatternKnowledgeProjection = {
  projectionId: string;
  profile: "CATALOG" | "GRAPH" | "PROVENANCE" | "AUDIT" | "STATISTICS";
  catalogId: string;
  catalogVersion: string;
  catalogDigest: string;
  payload: unknown;
  digest: string;
  boundary: "READ_ONLY_KNOWLEDGE_VIEW_NOT_SOURCE_OF_TRUTH";
};

export type PatternConsumerAdapterResult = {
  consumer: "TMP-001" | "DOCUMENT_PROJECTION" | "CLINICAL_OPERATIONS" | "DATA_MANAGEMENT" | "QRY-001" | "UX-001" | "REGULATORY_ENGINE" | "BIOSTATISTICS" | "KNOWLEDGE";
  catalogDigest: string;
  patternRefs: Array<{ patternId: string; name: string; category: PatternCategory; status: PatternStatus; limitations: string[] }>;
  boundary: "REFERENCE_ONLY_NO_CONSUMER_MUTATION_NO_AUTOMATIC_DECISION";
};
