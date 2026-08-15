import type { QueryNavigationProductProjection } from "@/features/query-navigation/product-contracts";
import type { ValidationProductSummary } from "@/features/validation-architecture/product-gates";

export const ADAPTIVE_RESEARCH_WORKSPACE_PROJECTION_VERSION = "1.0.0" as const;

export type WorkspaceMode = "STANDARD" | "EXPERT";
export type WorkspaceSemanticState =
  | "UNKNOWN"
  | "AMBIGUOUS"
  | "CANDIDATE"
  | "ADOPTED"
  | "REJECTED"
  | "DEFERRED"
  | "BLOCKING"
  | "WARNING"
  | "NOT_APPLICABLE"
  | "NOT_EVALUABLE"
  | "NOT_GENERATABLE"
  | "DEFERRED_TO_REALIZED_TIME"
  | "STALE";

export type WorkspaceVisualIntent = "NEUTRAL" | "INFORMATION" | "POSITIVE" | "CAUTION" | "CRITICAL" | "INACTIVE";

export type WorkspaceSemanticStatePresentation = {
  state: WorkspaceSemanticState;
  label: string;
  visualIntent: WorkspaceVisualIntent;
  indicator: "DOT" | "RING" | "PAUSE" | "LOCK" | "QUESTION";
  actionable: boolean;
  explanation: string;
};
export type WorkspaceAttentionKind = "ACTION_REQUIRED" | "REVIEW_REQUIRED" | "UNKNOWN" | "WARNING" | "TECHNICAL_PREREQUISITE" | "BLOCKING";

export type WorkspaceAttentionItem = {
  attentionId: string;
  kind: WorkspaceAttentionKind;
  sourceRef: string;
  sourceType: "PROJECT_DECISION" | "PROJECT_UNKNOWN" | "PROJECT_CONTRADICTION" | "VAL_FINDING" | "VAL_REVIEW" | "VAL_GATE" | "DOMAIN_READINESS" | "STALE_SOURCE";
  owner: string;
  semanticState: WorkspaceSemanticState;
  label: string;
  summary: string;
  targetRef: string;
  relatedActionRef: string | null;
  blocking: boolean;
  actionable: boolean;
  provenanceRefs: string[];
  limitations: string[];
};

export type WorkspaceDomainSummary = {
  domainId: string;
  label: string;
  owner: string;
  state: WorkspaceSemanticState;
  summary: string;
  targetRef: string;
  sourceRefs: string[];
  openItemCount: number;
};

export type WorkspaceProjectSection = {
  sectionId: "QUESTION" | "HYPOTHESES" | "POPULATION" | "DESIGN" | "IMAGING" | "VARIABLES" | "ANALYSIS";
  label: string;
  state: WorkspaceSemanticState;
  summary: string;
  targetRef: string;
};

export type WorkspaceDocumentSummary = {
  projection: string;
  owner: "DOC-001";
  state: "GENERATABLE" | "PARTIALLY_GENERATABLE" | "NOT_GENERATABLE" | "BLOCKED" | "NOT_APPLICABLE";
  generatabilitySource: "TMP_DOC";
  sourceRef: string;
  sourceProjectRef: string;
  missing: string[];
  targetRef: string;
  projectVersion: string;
  stale: boolean;
  freshness: "CURRENT" | "STALE" | "IMPACT_NOT_EVALUATED";
  actionAvailability: {
    preview: boolean;
    generate: boolean;
    export: boolean;
    download: boolean;
    commercialEntitlement: "NOT_APPLICABLE_V1";
  };
  limitations: string[];
};

export type WorkspaceDocumentImpact = "AFFECTED" | "UNAFFECTED_DEMONSTRATED" | "NOT_EVALUATED";

export type WorkspaceDocumentFreshnessAssessment = {
  state: WorkspaceDocumentSummary["freshness"];
  sourceProjectVersion: string;
  currentProjectVersion: string;
  currentForProject: boolean;
  reason: string;
};

export type AdaptiveResearchWorkspaceProjection = {
  workspaceProjectionId: string;
  projectionVersion: typeof ADAPTIVE_RESEARCH_WORKSPACE_PROJECTION_VERSION;
  sourceProjectRef: string;
  sourceProjectVersion: string;
  sourceProjectDigest: string;
  project: {
    question: string;
    state: WorkspaceSemanticState;
    designSummary: string;
    sections: WorkspaceProjectSection[];
    recentChanges: string[];
    branchRefs: string[];
    limitations: string[];
  };
  navigation: {
    projectionRef: string;
    sourceStateDigest: string;
    status: QueryNavigationProductProjection["status"];
    selectedActionRef: string | null;
    alternatives: Array<{ candidateRef: string; label: string }>;
    whyNow: string;
    deferAllowed: boolean;
    systemPrerequisite: boolean;
  };
  attention: WorkspaceAttentionItem[];
  domains: WorkspaceDomainSummary[];
  documents: WorkspaceDocumentSummary[];
  validation: {
    status: ValidationProductSummary["status"];
    blockerCount: number;
    reviewCount: number;
    gateRefs: string[];
  };
  trace: {
    decisionRefs: string[];
    provenanceRefs: string[];
    validationRefs: string[];
    navigationRefs: string[];
    sourceDigests: string[];
  };
  limitations: string[];
  projectionOnly: true;
  sourceOfTruth: false;
  projectWriteAuthorized: false;
  validationWriteAuthorized: false;
  queryWriteAuthorized: false;
  documentWriteAuthorized: false;
  providerCalls: 0;
  globalProgressScore: null;
};
