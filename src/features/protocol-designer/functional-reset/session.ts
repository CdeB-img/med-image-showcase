import type {
  ScientificInterpretationCognitiveBoundary,
  ScientificInterpretationContributionEnvelope,
  ScientificInterpretationTurn,
} from "@/features/scientific-interpretation/contracts";
import type { ScientificInterpretationProductDisposition } from "@/features/scientific-interpretation/cognitive-boundary";
import type { SemanticCriticResult } from "@/features/scientific-interpretation/semantic-critic";
import type {
  ResearchProjectOwnerAuthority,
  ResearchProjectOwnerProjection,
  ResearchProjectContributionCandidate,
} from "@/features/research-project-construction";
import {
  createEmptyFunctionalResetDocumentPortfolio,
  type FunctionalResetDocumentPortfolio,
} from "@/features/document-projection";
import type { FunctionalResetQueryNavigation } from "@/features/query-navigation";

export const FUNCTIONAL_RESET_STORAGE_KEY = "noxia-protocol-designer-functional-reset-v3";
export const INITIAL_NOXIA_MESSAGE = "Décrivez-moi le projet de recherche que vous souhaitez construire.\nVous pouvez partir d’une idée simple ou donner tous les détails que vous connaissez déjà.";

export type ConversationEntry =
  | { entryId: string; kind: "TEXT"; role: "USER" | "NOXIA"; content: string; createdAt: string }
  | { entryId: string; kind: "REVIEW"; role: "NOXIA"; contribution: ScientificInterpretationContributionEnvelope; candidate?: ResearchProjectContributionCandidate; semanticCritic?: SemanticCriticResult; repairCount?: 0 | 1; status: "PENDING" | "CONFIRMED"; createdAt: string }
  | { entryId: string; kind: "ERROR"; role: "NOXIA"; content: string; createdAt: string };

export type FunctionalResetSession = {
  contract: "FUNCTIONAL_RESET_PROTOCOL_DESIGNER_SESSION";
  contractVersion: "1.4.0";
  sessionId: string;
  conversationId: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  runtimeTurns: ScientificInterpretationTurn[];
  entries: ConversationEntry[];
  currentContribution: ScientificInterpretationContributionEnvelope | null;
  pendingContribution: ScientificInterpretationContributionEnvelope | null;
  projectAuthority: ResearchProjectOwnerAuthority;
  project: ResearchProjectOwnerProjection | null;
  queryNavigation: FunctionalResetQueryNavigation | null;
  documents: FunctionalResetDocumentPortfolio;
  openDocumentProjectionId: string | null;
  cognitiveTraceHistory: Array<{ sourceTurnId: string; disposition: ScientificInterpretationProductDisposition; boundary: ScientificInterpretationCognitiveBoundary; recordedAt: string }>;
  criticTraceHistory: Array<{ contributionId: string; result: SemanticCriticResult; repairCount: 0 | 1; recordedAt: string }>;
};

const id = (prefix: string) => {
  const suffix = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}:${suffix}`;
};

export const createFunctionalResetSession = (now = new Date().toISOString()): FunctionalResetSession => {
  const sessionId = id("protocol-designer-session");
  return {
    contract: "FUNCTIONAL_RESET_PROTOCOL_DESIGNER_SESSION",
    contractVersion: "1.4.0",
    sessionId,
    conversationId: id("scientific-conversation"),
    projectId: `${sessionId}:research-project`,
    createdAt: now,
    updatedAt: now,
    runtimeTurns: [],
    entries: [{ entryId: id("conversation-entry"), kind: "TEXT", role: "NOXIA", content: INITIAL_NOXIA_MESSAGE, createdAt: now }],
    currentContribution: null,
    pendingContribution: null,
    projectAuthority: {
      actorRef: `${sessionId}:CURRENT_RESEARCHER`,
      mandateRef: "PROJECT_OWNER",
      authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION",
      verification: "DEMO_SESSION_NOT_AUTHENTICATED",
    },
    project: null,
    queryNavigation: null,
    documents: createEmptyFunctionalResetDocumentPortfolio(),
    openDocumentProjectionId: null,
    cognitiveTraceHistory: [],
    criticTraceHistory: [],
  };
};

const looksLikeSession = (value: unknown): value is FunctionalResetSession => {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<FunctionalResetSession>;
  return record.contract === "FUNCTIONAL_RESET_PROTOCOL_DESIGNER_SESSION"
    && record.contractVersion === "1.4.0"
    && typeof record.sessionId === "string"
    && typeof record.conversationId === "string"
    && Array.isArray(record.entries)
    && Array.isArray(record.runtimeTurns)
    && record.projectAuthority?.mandateRef === "PROJECT_OWNER"
    && (!record.project || record.project.contract === "RESEARCH_PROJECT_CONSTRUCTION_OWNER_PROJECTION")
    && (!record.queryNavigation || record.queryNavigation.contract === "FUNCTIONAL_RESET_QUERY_NAVIGATION")
    && record.documents?.contract === "FUNCTIONAL_RESET_DOCUMENT_PORTFOLIO"
    && record.documents.owner === "DOC-001"
    && Array.isArray(record.cognitiveTraceHistory)
    && Array.isArray(record.criticTraceHistory)
    && (record.openDocumentProjectionId === null || typeof record.openDocumentProjectionId === "string");
};

const migrateLegacySession = (value: unknown): FunctionalResetSession | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (record.contract !== "FUNCTIONAL_RESET_PROTOCOL_DESIGNER_SESSION" || !["1.2.0", "1.3.0"].includes(String(record.contractVersion))) return null;
  const migrated = {
    ...record,
    contractVersion: "1.4.0",
    queryNavigation: record.contractVersion === "1.2.0" ? null : record.queryNavigation,
    cognitiveTraceHistory: [],
    criticTraceHistory: [],
  };
  return looksLikeSession(migrated) ? migrated : null;
};

export const loadFunctionalResetSession = (storage: Storage): FunctionalResetSession => {
  try {
    const raw = storage.getItem(FUNCTIONAL_RESET_STORAGE_KEY);
    if (!raw) return createFunctionalResetSession();
    const parsed: unknown = JSON.parse(raw);
    return looksLikeSession(parsed) ? parsed : migrateLegacySession(parsed) ?? createFunctionalResetSession();
  } catch {
    return createFunctionalResetSession();
  }
};

export const persistFunctionalResetSession = (storage: Storage, session: FunctionalResetSession) => {
  storage.setItem(FUNCTIONAL_RESET_STORAGE_KEY, JSON.stringify(session));
};

export const clearFunctionalResetSession = (storage: Storage) => storage.removeItem(FUNCTIONAL_RESET_STORAGE_KEY);

export const createConversationEntryId = () => id("conversation-entry");
export const createTurnId = () => id("turn");
