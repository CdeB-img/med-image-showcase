import { deleteKnowledgeSnapshots } from "@/features/knowledge-engine";
import { deleteSession } from "@/features/protocol-designer/intake/session";
import {
  LEGACY_SEMANTIC_WORKSPACE_SESSION_KEY,
  clearScientificInterpretationSession,
} from "@/features/scientific-interpretation/session";
import { clearConversationalWorkspaceSession } from "./ConversationalWorkspaceSession";

export const clearProtocolDesignerConversationalWorkspace = (storage: Pick<Storage, "removeItem">) => {
  clearConversationalWorkspaceSession(storage);
  clearScientificInterpretationSession(storage);
  storage.removeItem(LEGACY_SEMANTIC_WORKSPACE_SESSION_KEY);
  deleteSession(storage);
  deleteKnowledgeSnapshots(storage);
};
