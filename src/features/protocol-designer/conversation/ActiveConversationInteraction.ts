import type { QueryNavigationProductProjection } from "@/features/query-navigation/product-contracts";
import { resolveConversationalOwnerTarget, type ConversationalOwnerTarget } from "./ConversationalHandoffRouter";

export const ACTIVE_CONVERSATION_INTERACTION_VERSION = "ACTIVE-CONVERSATION-INTERACTION-1.0" as const;

export const CONVERSATION_EXPECTED_RESPONSE_KINDS = [
  "SCIENTIFIC_CONTENT",
  "SCIENTIFIC_CORRECTION",
  "ROUTE_INTENT",
  "QRY_INFORMATION_RESPONSE",
  "HUMAN_DECISION_RESPONSE",
  "OWNER_MODIFICATION_REQUEST",
] as const;

export type ConversationExpectedResponseKind = (typeof CONVERSATION_EXPECTED_RESPONSE_KINDS)[number];

export type ActiveConversationInteractionPurpose =
  | "CAPTURE_SCIENTIFIC_CONTENT"
  | "CORRECT_SCIENTIFIC_UNDERSTANDING"
  | "RESOLVE_ROUTE_INTENT"
  | "ANSWER_QRY_INFORMATION_NEED"
  | "ANSWER_HUMAN_DECISION"
  | "MODIFY_OWNER_PROJECTION";

export type ActiveConversationInteraction = {
  interactionVersion: typeof ACTIVE_CONVERSATION_INTERACTION_VERSION;
  interactionRef: string;
  sourceActionRef: string | null;
  owner: ConversationalOwnerTarget;
  purpose: ActiveConversationInteractionPurpose;
  expectedResponseKind: ConversationExpectedResponseKind;
  targetRefs: string[];
  informationNeedRefs: string[];
  projectRef: string | null;
  projectVersion: string | null;
  projectDigest: string | null;
  presentationContext: {
    prompt: string;
    composerPlaceholder: string;
    source: "SCIENTIFIC_INTERPRETATION" | "PROTOCOL_DESIGNER_ROUTE" | "QRY_PRESENTATION" | "PROJECT_PANEL";
  };
  responseCount: number;
  lastResponseRef: string | null;
  activatedAt: string;
  updatedAt: string;
  sourceOfTruth: false;
  projectWriteAuthorized: false;
};

type CreateActiveConversationInteractionInput = {
  interactionRef: string;
  sourceActionRef?: string | null;
  owner: ConversationalOwnerTarget;
  purpose: ActiveConversationInteractionPurpose;
  expectedResponseKind: ConversationExpectedResponseKind;
  targetRefs?: string[];
  informationNeedRefs?: string[];
  projectRef?: string | null;
  projectVersion?: string | null;
  projectDigest?: string | null;
  presentationContext?: Partial<ActiveConversationInteraction["presentationContext"]>;
  now?: string;
};

const unique = (values: readonly string[] = []) => [...new Set(values.map((value) => value.trim()).filter(Boolean))];

const defaultPresentation = (kind: ConversationExpectedResponseKind): ActiveConversationInteraction["presentationContext"] => ({
  prompt: kind === "ROUTE_INTENT"
    ? "J’ai compris le sujet. Que voulez-vous que nous fassions maintenant ?"
    : kind === "SCIENTIFIC_CORRECTION"
      ? "Que souhaitez-vous corriger ou préciser ?"
      : kind === "OWNER_MODIFICATION_REQUEST"
        ? "Quelle partie souhaitez-vous modifier ?"
        : "Quelle précision souhaitez-vous apporter ?",
  composerPlaceholder: kind === "ROUTE_INTENT"
    ? "Dis-moi ce que tu veux construire ou approfondir…"
    : kind === "SCIENTIFIC_CORRECTION"
      ? "Corrige ou précise ce que j’ai compris…"
      : kind === "OWNER_MODIFICATION_REQUEST"
        ? "Indique ce que tu veux modifier…"
        : "Répondez librement…",
  source: kind === "ROUTE_INTENT" ? "PROTOCOL_DESIGNER_ROUTE" : "SCIENTIFIC_INTERPRETATION",
});

export const createActiveConversationInteraction = ({
  interactionRef,
  sourceActionRef = null,
  owner,
  purpose,
  expectedResponseKind,
  targetRefs = [],
  informationNeedRefs = [],
  projectRef = null,
  projectVersion = null,
  projectDigest = null,
  presentationContext,
  now = new Date().toISOString(),
}: CreateActiveConversationInteractionInput): ActiveConversationInteraction => {
  const defaults = defaultPresentation(expectedResponseKind);
  return {
    interactionVersion: ACTIVE_CONVERSATION_INTERACTION_VERSION,
    interactionRef,
    sourceActionRef,
    owner,
    purpose,
    expectedResponseKind,
    targetRefs: unique(targetRefs),
    informationNeedRefs: unique(informationNeedRefs),
    projectRef,
    projectVersion,
    projectDigest,
    presentationContext: {
      prompt: presentationContext?.prompt ?? defaults.prompt,
      composerPlaceholder: presentationContext?.composerPlaceholder ?? defaults.composerPlaceholder,
      source: presentationContext?.source ?? defaults.source,
    },
    responseCount: 0,
    lastResponseRef: null,
    activatedAt: now,
    updatedAt: now,
    sourceOfTruth: false,
    projectWriteAuthorized: false,
  };
};

export const createRouteIntentConversationInteraction = (input: {
  interactionRef: string;
  sourceActionRef: string;
  contributionRef: string;
  projectRef: string | null;
  projectVersion: string | null;
  projectDigest: string | null;
  now?: string;
}) => createActiveConversationInteraction({
  interactionRef: input.interactionRef,
  sourceActionRef: input.sourceActionRef,
  owner: "SCIENTIFIC_INTERPRETATION",
  purpose: "RESOLVE_ROUTE_INTENT",
  expectedResponseKind: "ROUTE_INTENT",
  targetRefs: [input.contributionRef],
  projectRef: input.projectRef,
  projectVersion: input.projectVersion,
  projectDigest: input.projectDigest,
  presentationContext: {
    prompt: "J’ai compris le sujet. Que voulez-vous que nous fassions maintenant ? Vous pouvez commencer à construire l’étude, approfondir la question ou préparer un document si le projet est déjà suffisamment défini.",
    composerPlaceholder: "Dis-moi ce que tu veux construire ou approfondir…",
    source: "PROTOCOL_DESIGNER_ROUTE",
  },
  now: input.now,
});

export const createQueryConversationInteraction = (
  projection: Readonly<QueryNavigationProductProjection>,
  projectDigest: string | null,
  now = new Date().toISOString(),
): ActiveConversationInteraction | null => {
  const action = projection.selectedAction;
  const presentation = projection.questionPresentation;
  if (!action || !presentation) return null;
  const owner = resolveConversationalOwnerTarget(presentation.answerOwner);
  if (!owner) return null;
  const humanDecision = presentation.expectedAnswerKind === "HUMAN_REVIEW_DECISION" || owner === "HUMAN_DECISION";
  return createActiveConversationInteraction({
    interactionRef: presentation.presentationId,
    sourceActionRef: action.selectedActionId,
    owner,
    purpose: humanDecision ? "ANSWER_HUMAN_DECISION" : "ANSWER_QRY_INFORMATION_NEED",
    expectedResponseKind: humanDecision ? "HUMAN_DECISION_RESPONSE" : "QRY_INFORMATION_RESPONSE",
    targetRefs: [presentation.targetRef],
    informationNeedRefs: presentation.informationNeedRefs,
    projectRef: presentation.projectRef,
    projectVersion: presentation.projectVersion,
    projectDigest,
    presentationContext: {
      prompt: presentation.intent,
      composerPlaceholder: humanDecision ? "Expliquez la décision que vous souhaitez soumettre…" : "Répondez avec vos mots…",
      source: "QRY_PRESENTATION",
    },
    now,
  });
};

export const composerPlaceholderForActiveInteraction = (interaction: ActiveConversationInteraction | null | undefined) => interaction?.presentationContext.composerPlaceholder;
