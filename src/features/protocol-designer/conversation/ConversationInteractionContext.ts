import { createContext, useContext } from "react";
import type { ActiveConversationInteraction } from "./ActiveConversationInteraction";

export type ActiveConversationInteractionBinding = {
  interaction: ActiveConversationInteraction;
  submitResponse: (rawResponse: string) => void | Promise<void>;
};

export type ConversationInteractionController = {
  register: (binding: ActiveConversationInteractionBinding) => void;
  unregister: (interactionRef: string) => void;
};

export const ConversationInteractionContext = createContext<ConversationInteractionController | null>(null);

export const useConversationInteractionController = () => useContext(ConversationInteractionContext);
