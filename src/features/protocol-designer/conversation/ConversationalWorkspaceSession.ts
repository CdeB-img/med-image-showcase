import { hasSensitiveData } from "@/features/protocol-designer/intake/privacy";

export const CONVERSATIONAL_WORKSPACE_SESSION_KEY = "noxia-conversational-workspace-session-v2";
export const CONVERSATIONAL_WORKSPACE_SESSION_VERSION = "CONVERSATIONAL-WORKSPACE-2.0" as const;

export const CONVERSATION_EVENT_TYPES = [
  "USER_MESSAGE",
  "NOXIA_INTERPRETATION",
  "UNDERSTANDING_REVIEW",
  "USER_CONFIRMATION",
  "USER_CORRECTION",
  "OWNER_FEEDBACK",
  "QRY_REQUEST",
  "QRY_RESPONSE",
  "EXPLORATORY_PROPOSAL",
  "ERROR",
  "RECOVERY",
] as const;

export type ConversationEventType = (typeof CONVERSATION_EVENT_TYPES)[number];
export type ConversationPresentationStatus = "CURRENT" | "PENDING" | "SUCCESS" | "PARTIAL" | "FAILURE" | "STALE";

export type ConversationTimelineEvent = {
  eventId: string;
  type: ConversationEventType;
  createdAt: string;
  presentationStatus: ConversationPresentationStatus;
  text: string;
  ownerRefs: string[];
  replayContext: Record<string, unknown> | null;
};

export type ConversationalWorkspaceSession = {
  sessionVersion: typeof CONVERSATIONAL_WORKSPACE_SESSION_VERSION;
  sessionId: string;
  conversationId: string;
  timeline: ConversationTimelineEvent[];
  contributionRefs: string[];
  currentProjectRef: string | null;
  currentProjectVersion: string | null;
  currentProjectDigest: string | null;
  qry: {
    memoryRef: string | null;
    currentActionRef: string | null;
    refreshRequestedByRef: string | null;
  };
  pendingHandoffRefs: string[];
  understanding: {
    status: "NOT_REVIEWED" | "PENDING_REVIEW" | "CONFIRMED_WORKING_CONTEXT" | "CORRECTION_REQUESTED";
    contributionRef: string | null;
    confirmedByRef: string | null;
    confirmedAt: string | null;
    projectWriteAuthorized: false;
  };
  presentation: {
    activeContextRef: string | null;
    mobileProjectOpen: boolean;
  };
  currentMode: "STANDARD" | "EXPERT";
  migration: {
    migratedAt: string | null;
    sourceSessionRefs: string[];
    legacyScientificInterpretationRead: boolean;
    legacyGuidedWorkspaceRead: boolean;
  };
  createdAt: string;
  updatedAt: string;
  sourceOfTruth: false;
  projectWriteAuthorized: false;
};

type StorageReader = Pick<Storage, "getItem"> & Partial<Pick<Storage, "removeItem">>;
type StorageWriter = Pick<Storage, "setItem">;

const makeId = (prefix: string) => typeof crypto !== "undefined" && "randomUUID" in crypto
  ? `${prefix}:${crypto.randomUUID()}`
  : `${prefix}:${Date.now()}`;

const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))];

export const createConversationalWorkspaceSession = (
  now = new Date().toISOString(),
  sessionId = makeId("conversational-session"),
  conversationId = makeId("scientific-conversation"),
): ConversationalWorkspaceSession => ({
  sessionVersion: CONVERSATIONAL_WORKSPACE_SESSION_VERSION,
  sessionId,
  conversationId,
  timeline: [],
  contributionRefs: [],
  currentProjectRef: null,
  currentProjectVersion: null,
  currentProjectDigest: null,
  qry: { memoryRef: null, currentActionRef: null, refreshRequestedByRef: null },
  pendingHandoffRefs: [],
  understanding: {
    status: "NOT_REVIEWED",
    contributionRef: null,
    confirmedByRef: null,
    confirmedAt: null,
    projectWriteAuthorized: false,
  },
  presentation: { activeContextRef: null, mobileProjectOpen: false },
  currentMode: "STANDARD",
  migration: {
    migratedAt: null,
    sourceSessionRefs: [],
    legacyScientificInterpretationRead: false,
    legacyGuidedWorkspaceRead: false,
  },
  createdAt: now,
  updatedAt: now,
  sourceOfTruth: false,
  projectWriteAuthorized: false,
});

const isTimelineEvent = (value: unknown): value is ConversationTimelineEvent => {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<ConversationTimelineEvent>;
  return typeof event.eventId === "string"
    && typeof event.type === "string"
    && CONVERSATION_EVENT_TYPES.includes(event.type as ConversationEventType)
    && typeof event.createdAt === "string"
    && typeof event.text === "string"
    && Array.isArray(event.ownerRefs);
};

const isConversationalWorkspaceSession = (value: unknown): value is ConversationalWorkspaceSession => {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<ConversationalWorkspaceSession>;
  return session.sessionVersion === CONVERSATIONAL_WORKSPACE_SESSION_VERSION
    && typeof session.sessionId === "string"
    && typeof session.conversationId === "string"
    && Array.isArray(session.timeline)
    && session.timeline.every(isTimelineEvent)
    && Array.isArray(session.contributionRefs)
    && Array.isArray(session.pendingHandoffRefs)
    && session.sourceOfTruth === false
    && session.projectWriteAuthorized === false;
};

export const appendConversationEvent = (
  session: ConversationalWorkspaceSession,
  event: ConversationTimelineEvent,
): ConversationalWorkspaceSession => {
  if (!event.text.trim()) throw new Error("CONVERSATION_EVENT_VISIBLE_TEXT_REQUIRED");
  if (session.timeline.some((item) => item.eventId === event.eventId)) return session;
  return {
    ...session,
    timeline: [...session.timeline, { ...structuredClone(event), text: event.text.trim(), ownerRefs: unique(event.ownerRefs) }],
    updatedAt: event.createdAt,
  };
};

export const registerConversationalContribution = (
  session: ConversationalWorkspaceSession,
  contributionRef: string,
  now = new Date().toISOString(),
): ConversationalWorkspaceSession => ({
  ...session,
  contributionRefs: unique([...session.contributionRefs, contributionRef]),
  understanding: {
    status: "PENDING_REVIEW",
    contributionRef,
    confirmedByRef: null,
    confirmedAt: null,
    projectWriteAuthorized: false,
  },
  updatedAt: now,
});

export const confirmConversationalUnderstanding = (
  session: ConversationalWorkspaceSession,
  contributionRef: string,
  actorRef: string,
  now = new Date().toISOString(),
): ConversationalWorkspaceSession => {
  const registered = registerConversationalContribution(session, contributionRef, now);
  return appendConversationEvent({
    ...registered,
    understanding: {
      status: "CONFIRMED_WORKING_CONTEXT",
      contributionRef,
      confirmedByRef: actorRef,
      confirmedAt: now,
      projectWriteAuthorized: false,
    },
  }, {
    eventId: `understanding-confirmation:${contributionRef}:${now}`,
    type: "USER_CONFIRMATION",
    createdAt: now,
    presentationStatus: "SUCCESS",
    text: "Cette compréhension est confirmée comme base de travail. Elle n’est pas une décision adoptée du Research Project.",
    ownerRefs: [contributionRef, actorRef],
    replayContext: { disposition: "ACCEPT_WORKING_BASIS", projectWriteAuthorized: false },
  });
};

export const markConversationalHandoffPending = (
  session: ConversationalWorkspaceSession,
  handoffRef: string,
  ownerRef: string,
  now = new Date().toISOString(),
) => appendConversationEvent({
  ...session,
  pendingHandoffRefs: unique([...session.pendingHandoffRefs, handoffRef]),
}, {
  eventId: `owner-pending:${handoffRef}`,
  type: "OWNER_FEEDBACK",
  createdAt: now,
  presentationStatus: "PENDING",
  text: "Réponse reçue. NOXIA met à jour cette partie du projet.",
  ownerRefs: [handoffRef, ownerRef],
  replayContext: { projectWriteAuthorized: false },
});

export type ConversationalOwnerCompletion = {
  handoffRef: string;
  ownerRef: string;
  ownerResultRef: string;
  projectRef: string | null;
  projectVersion: string | null;
  projectDigest: string | null;
  qryMemoryRef: string | null;
  qryActionRef: string | null;
  completedAt: string;
  feedbackText?: string;
  qryText?: string;
};

export const completeConversationalOwnerHandoff = (
  session: ConversationalWorkspaceSession,
  completion: ConversationalOwnerCompletion,
): ConversationalWorkspaceSession => {
  const ownerCompleted = appendConversationEvent({
    ...session,
    pendingHandoffRefs: session.pendingHandoffRefs.filter((ref) => ref !== completion.handoffRef),
    currentProjectRef: completion.projectRef,
    currentProjectVersion: completion.projectVersion,
    currentProjectDigest: completion.projectDigest,
    qry: {
      memoryRef: completion.qryMemoryRef,
      currentActionRef: completion.qryActionRef,
      refreshRequestedByRef: completion.ownerResultRef,
    },
  }, {
    eventId: `owner-success:${completion.handoffRef}:${completion.ownerResultRef}`,
    type: "OWNER_FEEDBACK",
    createdAt: completion.completedAt,
    presentationStatus: "SUCCESS",
    text: completion.feedbackText ?? "J’ai pris en compte cette précision dans la projection concernée.",
    ownerRefs: [completion.ownerRef, completion.ownerResultRef],
    replayContext: { handoffRef: completion.handoffRef, projectWriteAuthorized: false },
  });
  return appendConversationEvent(ownerCompleted, {
    eventId: `qry-response:${completion.handoffRef}:${completion.qryActionRef ?? "no-action"}`,
    type: "QRY_RESPONSE",
    createdAt: completion.completedAt,
    presentationStatus: completion.qryActionRef ? "SUCCESS" : "PARTIAL",
    text: completion.qryText ?? (completion.qryActionRef
      ? "La prochaine interaction utile a été réévaluée dans cette conversation."
      : "Je n’ai pas encore assez d’éléments structurés pour choisir la prochaine question utile."),
    ownerRefs: unique(["QUERY_NAVIGATION", completion.qryMemoryRef ?? "", completion.qryActionRef ?? ""]),
    replayContext: { refreshRequestedByRef: completion.ownerResultRef },
  });
};

export const persistConversationalWorkspaceSession = (storage: StorageWriter, session: ConversationalWorkspaceSession) => {
  if (session.timeline.some((event) => hasSensitiveData(event.text))) throw new Error("SENSITIVE_CONVERSATIONAL_SESSION_NOT_PERSISTED");
  storage.setItem(CONVERSATIONAL_WORKSPACE_SESSION_KEY, JSON.stringify(session));
};

export const loadConversationalWorkspaceSession = (storage: StorageReader): ConversationalWorkspaceSession | null => {
  const raw = storage.getItem(CONVERSATIONAL_WORKSPACE_SESSION_KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (!isConversationalWorkspaceSession(value)) throw new Error("INVALID_CONVERSATIONAL_SESSION");
    return value;
  } catch {
    storage.removeItem?.(CONVERSATIONAL_WORKSPACE_SESSION_KEY);
    return null;
  }
};

type LegacyScientificMessage = { turnId?: unknown; messageId?: unknown; role?: unknown; content?: unknown; createdAt?: unknown };

export type ConversationalMigrationInput = {
  storage?: StorageReader;
  legacyScientificInterpretation?: unknown;
  legacyGuidedWorkspace?: unknown;
  now?: string;
};

const readLegacyProject = (legacy: unknown) => {
  if (!legacy || typeof legacy !== "object") return null;
  const projectConstruction = (legacy as { projectConstruction?: unknown }).projectConstruction;
  if (!projectConstruction || typeof projectConstruction !== "object") return null;
  const result = (projectConstruction as { result?: unknown }).result;
  if (!result || typeof result !== "object") return null;
  const value = result as { resultId?: unknown; candidateVersion?: { versionId?: unknown }; resultDigest?: unknown };
  return {
    projectRef: typeof value.resultId === "string" ? value.resultId : null,
    projectVersion: typeof value.candidateVersion?.versionId === "string" ? value.candidateVersion.versionId : null,
    projectDigest: typeof value.resultDigest === "string" ? value.resultDigest : null,
  };
};

export const migrateConversationalWorkspaceSession = ({
  storage,
  legacyScientificInterpretation,
  legacyGuidedWorkspace,
  now = new Date().toISOString(),
}: ConversationalMigrationInput): ConversationalWorkspaceSession => {
  const stored = storage ? loadConversationalWorkspaceSession(storage) : null;
  if (stored) return stored;

  const legacyScientific = legacyScientificInterpretation && typeof legacyScientificInterpretation === "object"
    ? legacyScientificInterpretation as { sessionId?: unknown; messages?: unknown; currentContribution?: { identity?: { contributionId?: unknown } } }
    : null;
  const legacyGuided = legacyGuidedWorkspace && typeof legacyGuidedWorkspace === "object"
    ? legacyGuidedWorkspace as { sessionId?: unknown }
    : null;
  const sourceRefs = unique([
    typeof legacyScientific?.sessionId === "string" ? legacyScientific.sessionId : "",
    typeof legacyGuided?.sessionId === "string" ? legacyGuided.sessionId : "",
  ]);
  let session = createConversationalWorkspaceSession(
    now,
    sourceRefs.length ? `conversational-session:migrated:${sourceRefs.join(":")}` : makeId("conversational-session"),
    typeof legacyScientific?.sessionId === "string" ? `scientific-conversation:migrated:${legacyScientific.sessionId}` : makeId("scientific-conversation"),
  );

  const messages = Array.isArray(legacyScientific?.messages) ? legacyScientific.messages as LegacyScientificMessage[] : [];
  for (const [index, message] of messages.entries()) {
    const text = typeof message.content === "string" ? message.content.trim() : "";
    if (!text) continue;
    const role = message.role === "NOXIA" || message.role === "ASSISTANT" ? "NOXIA" : "USER";
    session = appendConversationEvent(session, {
      eventId: typeof message.turnId === "string" ? message.turnId : typeof message.messageId === "string" ? message.messageId : `legacy-message:${index + 1}`,
      type: role === "USER" ? "USER_MESSAGE" : "NOXIA_INTERPRETATION",
      createdAt: typeof message.createdAt === "string" ? message.createdAt : now,
      presentationStatus: "CURRENT",
      text,
      ownerRefs: [role === "USER" ? "USER" : "SCIENTIFIC_INTERPRETATION"],
      replayContext: { migratedReadOnly: true },
    });
  }

  const contributionRef = typeof legacyScientific?.currentContribution?.identity?.contributionId === "string"
    ? legacyScientific.currentContribution.identity.contributionId
    : null;
  const project = readLegacyProject(legacyGuidedWorkspace);
  return {
    ...session,
    contributionRefs: contributionRef ? [contributionRef] : [],
    currentProjectRef: project?.projectRef ?? null,
    currentProjectVersion: project?.projectVersion ?? null,
    currentProjectDigest: project?.projectDigest ?? null,
    migration: {
      migratedAt: sourceRefs.length ? now : null,
      sourceSessionRefs: sourceRefs,
      legacyScientificInterpretationRead: Boolean(legacyScientific),
      legacyGuidedWorkspaceRead: Boolean(legacyGuided),
    },
    updatedAt: now,
  };
};

export const clearConversationalWorkspaceSession = (storage: Pick<Storage, "removeItem">) => storage.removeItem(CONVERSATIONAL_WORKSPACE_SESSION_KEY);
