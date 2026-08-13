import { hasSensitiveData } from "@/features/protocol-designer/intake/privacy";
import type { ScientificSemanticModel, SemanticConversationMessage, SemanticWorkspaceSession } from "./types";

export const SEMANTIC_WORKSPACE_SESSION_KEY = "noxia-semantic-workspace-session-v1";
const makeId = (prefix: string) => typeof crypto !== "undefined" && "randomUUID" in crypto ? `${prefix}:${crypto.randomUUID()}` : `${prefix}:${Date.now()}`;

export const createSemanticMessage = (role: SemanticConversationMessage["role"], content: string, now = new Date().toISOString()): SemanticConversationMessage => ({
  messageId: makeId(role.toLocaleLowerCase()), role, content: content.trim(), createdAt: now,
});

export const createSemanticWorkspaceSession = (now = new Date().toISOString()): SemanticWorkspaceSession => ({
  sessionVersion: "SEM-001-WORKSPACE-1.0",
  sessionId: makeId("semantic-session"),
  messages: [],
  currentModel: null,
  modelHistory: [],
  createdAt: now,
  updatedAt: now,
});

export const appendSemanticModel = (session: SemanticWorkspaceSession, model: ScientificSemanticModel, assistantMessage?: SemanticConversationMessage): SemanticWorkspaceSession => ({
  ...session,
  messages: assistantMessage ? [...session.messages, assistantMessage] : session.messages,
  currentModel: model,
  modelHistory: session.currentModel ? [...session.modelHistory, session.currentModel] : session.modelHistory,
  updatedAt: model.updatedAt,
});

export const persistSemanticWorkspace = (storage: Pick<Storage, "setItem">, session: SemanticWorkspaceSession) => {
  if (session.messages.some((item) => hasSensitiveData(item.content))) throw new Error("SENSITIVE_SEMANTIC_SESSION_NOT_PERSISTED");
  storage.setItem(SEMANTIC_WORKSPACE_SESSION_KEY, JSON.stringify(session));
};

export const loadSemanticWorkspace = (storage: Pick<Storage, "getItem" | "removeItem">): SemanticWorkspaceSession | null => {
  const raw = storage.getItem(SEMANTIC_WORKSPACE_SESSION_KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as SemanticWorkspaceSession;
    if (value?.sessionVersion !== "SEM-001-WORKSPACE-1.0" || !Array.isArray(value.messages) || !Array.isArray(value.modelHistory)) throw new Error("INVALID");
    return value;
  } catch {
    storage.removeItem(SEMANTIC_WORKSPACE_SESSION_KEY);
    return null;
  }
};

export const clearSemanticWorkspace = (storage: Pick<Storage, "removeItem">) => storage.removeItem(SEMANTIC_WORKSPACE_SESSION_KEY);
