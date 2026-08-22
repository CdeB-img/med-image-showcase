import { hasSensitiveData } from "@/features/protocol-designer/intake/privacy";
import type { ScientificInterpretationContributionEnvelope, ScientificInterpretationMode, ScientificInterpretationTurn } from "./contracts";
import type { ScientificInterpretationApiResponse } from "./transport";
import { projectScientificContributionToV1IfAllowed, type V1ScientificInterpretationProjection } from "./v1-compatibility";

export const SCIENTIFIC_INTERPRETATION_SESSION_KEY = "noxia-scientific-interpretation-session-v1";
export const LEGACY_SEMANTIC_WORKSPACE_SESSION_KEY = "noxia-semantic-workspace-session-v1";
export const SCIENTIFIC_INTERPRETATION_OWNER_SESSION_KEY_V2 = "noxia-scientific-interpretation-owner-session-v2";
export const SCIENTIFIC_INTERPRETATION_SESSION_VERSION = "SCIENTIFIC-INTERPRETATION-WORKSPACE-1.0" as const;

export type ScientificInterpretationWorkspaceSession = {
  sessionVersion: typeof SCIENTIFIC_INTERPRETATION_SESSION_VERSION;
  sessionId: string;
  messages: ScientificInterpretationTurn[];
  currentContribution: ScientificInterpretationContributionEnvelope | null;
  contributionHistory: ScientificInterpretationContributionEnvelope[];
  currentProjection: V1ScientificInterpretationProjection | null;
  projectionHistory: Array<{ contributionId: string; projection: V1ScientificInterpretationProjection | null; disposition: ScientificInterpretationApiResponse["projectionDisposition"] }>;
  runtimeMode: ScientificInterpretationMode;
  technicalStatus: "NOT_RUN" | ScientificInterpretationApiResponse["technicalStatus"] | "FAIL_CLOSED";
  auditStatus: "NOT_RUN" | ScientificInterpretationApiResponse["auditStatus"] | "NOT_COMPLETED";
  reviewRequired: boolean;
  fallbackHistory: Array<NonNullable<ScientificInterpretationApiResponse["fallback"]> & { activeContributionId: string; recordedAt: string }>;
  knowledgeResultRefs: string[];
  legacyCompatibilityIdentity: { sessionVersion: string; semanticModelId: string | null; semanticModelDigest: string | null } | null;
  workingBasisAcceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const makeId = (prefix: string) => typeof crypto !== "undefined" && "randomUUID" in crypto ? `${prefix}:${crypto.randomUUID()}` : `${prefix}:${Date.now()}`;

export const createScientificInterpretationMessage = (role: ScientificInterpretationTurn["role"], content: string, now = new Date().toISOString()): ScientificInterpretationTurn => ({
  turnId: makeId(role.toLowerCase()), role, content: content.trim(), createdAt: now,
});

export const createScientificInterpretationSession = (now = new Date().toISOString()): ScientificInterpretationWorkspaceSession => ({
  sessionVersion: SCIENTIFIC_INTERPRETATION_SESSION_VERSION,
  sessionId: makeId("scientific-interpretation-session"),
  messages: [],
  currentContribution: null,
  contributionHistory: [],
  currentProjection: null,
  projectionHistory: [],
  runtimeMode: "HYBRID_ACTIVE_WITH_LEGACY_FALLBACK",
  technicalStatus: "NOT_RUN",
  auditStatus: "NOT_RUN",
  reviewRequired: false,
  fallbackHistory: [],
  knowledgeResultRefs: [],
  legacyCompatibilityIdentity: null,
  workingBasisAcceptedAt: null,
  createdAt: now,
  updatedAt: now,
});

export const appendScientificInterpretationExecution = (
  session: ScientificInterpretationWorkspaceSession,
  response: ScientificInterpretationApiResponse,
  assistantMessage?: ScientificInterpretationTurn,
): ScientificInterpretationWorkspaceSession => {
  if (!response.contribution || !response.contributionId) return session;
  const prior = session.currentContribution;
  const recordedAt = assistantMessage?.createdAt ?? response.contribution.identity.createdAt;
  return {
    ...session,
    messages: assistantMessage ? [...session.messages, assistantMessage] : session.messages,
    currentContribution: response.contribution,
    contributionHistory: prior ? [...session.contributionHistory, prior] : session.contributionHistory,
    currentProjection: response.v1Projection,
    projectionHistory: [...session.projectionHistory, { contributionId: response.contributionId, projection: response.v1Projection, disposition: response.projectionDisposition }],
    runtimeMode: response.runtimeMode,
    technicalStatus: response.technicalStatus,
    auditStatus: response.auditStatus,
    reviewRequired: response.reviewRequired,
    fallbackHistory: response.fallback ? [...session.fallbackHistory, { ...response.fallback, activeContributionId: response.contributionId, recordedAt }] : session.fallbackHistory,
    workingBasisAcceptedAt: null,
    updatedAt: recordedAt,
  };
};

export const acceptScientificInterpretationWorkingBasis = (session: ScientificInterpretationWorkspaceSession, now = new Date().toISOString()) => {
  if (!session.currentProjection || session.reviewRequired || session.auditStatus === "CRITICAL_FINDINGS") return session;
  return { ...session, workingBasisAcceptedAt: now, updatedAt: now };
};

export const linkKnowledgeResultToScientificInterpretationSession = (session: ScientificInterpretationWorkspaceSession, resultRef: string) => ({
  ...session,
  knowledgeResultRefs: [...new Set([...session.knowledgeResultRefs, resultRef])],
  updatedAt: new Date().toISOString(),
});

const isNeutralSession = (value: unknown): value is ScientificInterpretationWorkspaceSession => {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return item.sessionVersion === SCIENTIFIC_INTERPRETATION_SESSION_VERSION
    && typeof item.sessionId === "string"
    && Array.isArray(item.messages)
    && Array.isArray(item.contributionHistory)
    && Array.isArray(item.projectionHistory)
    && Array.isArray(item.fallbackHistory);
};

export const persistScientificInterpretationSession = (storage: Pick<Storage, "setItem">, session: ScientificInterpretationWorkspaceSession) => {
  if (session.messages.some((item) => hasSensitiveData(item.content))) throw new Error("SENSITIVE_SCIENTIFIC_INTERPRETATION_SESSION_NOT_PERSISTED");
  storage.setItem(SCIENTIFIC_INTERPRETATION_SESSION_KEY, JSON.stringify(session));
};

export const loadScientificInterpretationSession = (storage: Pick<Storage, "getItem" | "removeItem">): ScientificInterpretationWorkspaceSession | null => {
  const raw = storage.getItem(SCIENTIFIC_INTERPRETATION_SESSION_KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (!isNeutralSession(value)) throw new Error("INVALID");
    return value;
  } catch {
    storage.removeItem(SCIENTIFIC_INTERPRETATION_SESSION_KEY);
    return null;
  }
};

export const persistScientificInterpretationOwnerSessionV2 = (storage: Pick<Storage, "setItem">, session: ScientificInterpretationWorkspaceSession) => {
  if (session.messages.some((item) => hasSensitiveData(item.content))) throw new Error("SENSITIVE_SCIENTIFIC_INTERPRETATION_OWNER_SESSION_NOT_PERSISTED");
  storage.setItem(SCIENTIFIC_INTERPRETATION_OWNER_SESSION_KEY_V2, JSON.stringify(session));
};

export const loadScientificInterpretationOwnerSessionV2 = (storage: Pick<Storage, "getItem" | "removeItem">): ScientificInterpretationWorkspaceSession | null => {
  const raw = storage.getItem(SCIENTIFIC_INTERPRETATION_OWNER_SESSION_KEY_V2);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (!isNeutralSession(value)) throw new Error("INVALID");
    return value;
  } catch {
    storage.removeItem(SCIENTIFIC_INTERPRETATION_OWNER_SESSION_KEY_V2);
    return null;
  }
};

export const readLegacySemanticSession = (storage: Pick<Storage, "getItem">): unknown | null => {
  const raw = storage.getItem(LEGACY_SEMANTIC_WORKSPACE_SESSION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

export const migrateLegacySemanticSession = (
  value: unknown,
  convert: (model: unknown) => ScientificInterpretationContributionEnvelope,
): ScientificInterpretationWorkspaceSession | null => {
  if (!value || typeof value !== "object") return null;
  const legacy = value as Record<string, unknown>;
  if (legacy.sessionVersion !== "SEM-001-WORKSPACE-1.0" || !Array.isArray(legacy.messages) || !Array.isArray(legacy.modelHistory)) return null;
  const currentModel = legacy.currentModel;
  if (!currentModel || typeof currentModel !== "object") return null;
  let contribution: ScientificInterpretationContributionEnvelope;
  let history: ScientificInterpretationContributionEnvelope[];
  try {
    contribution = convert(currentModel);
    history = legacy.modelHistory.map((model) => convert(model));
  } catch {
    return null;
  }
  const projection = projectScientificContributionToV1IfAllowed(contribution);
  const createdAt = typeof legacy.createdAt === "string" ? legacy.createdAt : contribution.identity.createdAt;
  const updatedAt = typeof legacy.updatedAt === "string" ? legacy.updatedAt : contribution.identity.createdAt;
  const modelRecord = currentModel as Record<string, unknown>;
  return {
    ...createScientificInterpretationSession(createdAt),
    sessionId: typeof legacy.sessionId === "string" ? legacy.sessionId : makeId("legacy-scientific-interpretation-session"),
    messages: legacy.messages.map((message, index) => {
      const item = message && typeof message === "object" ? message as Record<string, unknown> : {};
      return {
        turnId: typeof item.messageId === "string" ? item.messageId : typeof item.turnId === "string" ? item.turnId : `legacy-turn-${index}`,
        role: item.role === "ASSISTANT" || item.role === "NOXIA" ? "NOXIA" as const : "USER" as const,
        content: typeof item.content === "string" ? item.content : "",
        createdAt: typeof item.createdAt === "string" ? item.createdAt : undefined,
      };
    }),
    currentContribution: contribution,
    contributionHistory: history,
    currentProjection: projection.projection,
    projectionHistory: [{ contributionId: contribution.identity.contributionId, projection: projection.projection, disposition: projection.disposition }],
    runtimeMode: "LEGACY_ACTIVE",
    technicalStatus: "AVAILABLE",
    auditStatus: contribution.audit.unresolvedFindings.some((item) => item.severity === "CRITICAL" && item.status === "OPEN") ? "CRITICAL_FINDINGS" : "COMPLETE",
    reviewRequired: projection.disposition !== "ACCEPTED_FOR_V1_PROJECTION",
    legacyCompatibilityIdentity: {
      sessionVersion: "SEM-001-WORKSPACE-1.0",
      semanticModelId: typeof modelRecord.semanticModelId === "string" ? modelRecord.semanticModelId : null,
      semanticModelDigest: typeof modelRecord.digest === "string" ? modelRecord.digest : null,
    },
    updatedAt,
  };
};

export const clearScientificInterpretationSession = (storage: Pick<Storage, "removeItem">) => {
  storage.removeItem(SCIENTIFIC_INTERPRETATION_SESSION_KEY);
  storage.removeItem(SCIENTIFIC_INTERPRETATION_OWNER_SESSION_KEY_V2);
};
