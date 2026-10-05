import type { ScientificInterpretationTurn } from "@/features/scientific-interpretation/contracts";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { deferFunctionalResetQueryNavigation, recordFunctionalResetQueryResponse } from "@/features/query-navigation";
import { createConversationEntryId, createTurnId, type FunctionalResetSession } from "./session";
import type {
  CurrentProjectImpactProjection,
  FunctionalResetQueryNavigation,
  StandardConversationFollowUpAction,
} from "@/features/query-navigation";

export type StandardConversationActionGroupPresentation = Readonly<{
  contract: "STANDARD_CONVERSATION_ACTION_GROUP";
  contractVersion: "1.0.0";
  presentationRef: string;
  selectedQryActionRef: string;
  selectedInformationNeedRef: string;
  sourceProjectVersion: string;
  sourceProjectDigest: string;
  sourceCandidateRef: string;
  subjectText: string;
  introduction: string;
  impacts: CurrentProjectImpactProjection["impacts"];
  actions: readonly StandardConversationFollowUpAction[];
  why: string;
  multipleSelectionsAllowed: true;
  freeTextAllowed: true;
  deferAllowed: true;
  projectionOnly: true;
  sourceOfTruth: false;
  projectWriteAuthorized: false;
}>;

export type StandardConversationActionGroupResponse = Readonly<{
  responseRef: string;
  disposition: "USER_REQUESTS_THESE_FOLLOW_UP_ACTIONS" | "DEFERRED_NOT_NOW";
  selectedActionRefs: readonly string[];
  unselectedActionRefs: readonly string[];
  freeTextRequest: string | null;
  respondedAt: string;
  projectVersionAtPresentation: string;
  projectWriteAuthorized: false;
}>;

export const buildStandardConversationActionGroup = (input: {
  impact: Readonly<CurrentProjectImpactProjection>;
  navigation: Readonly<FunctionalResetQueryNavigation>;
}): StandardConversationActionGroupPresentation | null => {
  const action = input.navigation.currentAction;
  const selected = input.navigation.selection.selected;
  if (!action || !selected || input.navigation.owner !== "QUERY_NAVIGATION"
    || input.navigation.projectRef !== input.impact.sourceProject.projectId
    || input.navigation.projectVersion !== input.impact.sourceProject.projectVersion
    || input.navigation.projectDigest !== input.impact.sourceProject.projectDigest
    || selected.owner !== "QUERY_NAVIGATION"
    || selected.targetRef !== input.impact.qryNeed.sourceRef
    || !action.navigationNeedRefs.includes(input.impact.qryNeed.needId)
    || selected.projectWriteAuthorized !== false) return null;
  const subjectText = input.impact.currentSubjects.map((subject) => subject.content).join(" ; ");
  return Object.freeze({
    contract: "STANDARD_CONVERSATION_ACTION_GROUP",
    contractVersion: "1.0.0",
    presentationRef: `${input.impact.projectionId}:standard`,
    selectedQryActionRef: action.selectedActionId,
    selectedInformationNeedRef: input.impact.qryNeed.needId,
    sourceProjectVersion: input.impact.sourceProject.projectVersion,
    sourceProjectDigest: input.impact.sourceProject.projectDigest,
    sourceCandidateRef: input.impact.sourceCandidate.candidateRef,
    subjectText,
    introduction: `Ce nouvel élément peut avoir plusieurs conséquences sur le projet. Que souhaitez-vous que j’examine maintenant à propos de « ${subjectText} » ?`,
    impacts: input.impact.impacts,
    actions: input.impact.actions,
    why: input.impact.why,
    multipleSelectionsAllowed: true,
    freeTextAllowed: true,
    deferAllowed: true,
    projectionOnly: true,
    sourceOfTruth: false,
    projectWriteAuthorized: false,
  });
};

export const summarizeStandardConversationActionResponse = (input: {
  presentation: Readonly<StandardConversationActionGroupPresentation>;
  response: Readonly<StandardConversationActionGroupResponse>;
}) => {
  if (input.response.disposition === "DEFERRED_NOT_NOW") return {
    userText: "Aucun de ces suivis pour le moment.",
    assistantText: "D’accord. Ces pistes ne modifient pas le projet et ne seront pas traitées maintenant. Vous pouvez poursuivre librement dans la conversation.",
  };
  const selected = input.presentation.actions.filter((action) => input.response.selectedActionRefs.includes(action.actionRef));
  const requested = [
    ...selected.map((action) => action.label),
    ...(input.response.freeTextRequest ? [input.response.freeTextRequest] : []),
  ];
  const statusLabel = {
    DEMONSTRATED_CURRENT: "confirmé dans le projet courant",
    POSSIBLE_TO_CHECK: "à vérifier",
    UNKNOWN: "inconnu à ce stade",
    NOT_APPLICABLE: "non applicable",
    BLOCKED_BY_MISSING_INFORMATION: "bloqué par une information manquante",
  } as const;
  const established = input.presentation.impacts
    .filter((impact) => impact.status === "DEMONSTRATED_CURRENT")
    .map((impact) => `• ${impact.label}`);
  const results = selected.map((action) => `• ${action.label} — ${statusLabel[action.status]} : ${action.effect}`);
  if (input.response.freeTextRequest) results.push(`• Demande complémentaire — « ${input.response.freeTextRequest} » reste à instruire ; elle n’est pas transformée en décision du projet.`);
  return {
    userText: `Je souhaite examiner : ${requested.join(" ; ")}.`,
    assistantText: [
      `Je traite ensemble ${requested.length} demande${requested.length > 1 ? "s" : ""} de suivi au niveau permis par les informations actuelles, sans modifier le projet.`,
      ...(established.length ? ["Ce qui est déjà établi :", ...established] : []),
      "Résultat contextuel et limites :",
      ...results,
      "La modification scientifique reste séparée et doit encore être revue puis adoptée explicitement.",
    ].join("\n"),
  };
};

export const respondToConversationActionGroup = (current: FunctionalResetSession, entryId: string, input: {
  selectedActionRefs: readonly string[];
  freeTextRequest: string | null;
  defer: boolean;
}, respondedAt: string): FunctionalResetSession => {
  const entry = current.entries.find((item) => item.entryId === entryId && item.kind === "FOLLOW_UP_ACTIONS");
  if (!entry || entry.kind !== "FOLLOW_UP_ACTIONS" || entry.response || !current.project
    || current.project.versionId !== entry.presentation.sourceProjectVersion
    || current.project.projectDigest !== entry.presentation.sourceProjectDigest) return current;
  const allowedRefs = new Set(entry.presentation.actions.map((action) => action.actionRef));
  const selectedActionRefs = [...new Set(input.selectedActionRefs.filter((ref) => allowedRefs.has(ref)))];
  const freeTextRequest = input.freeTextRequest?.trim() || null;
  if (!input.defer && !selectedActionRefs.length && !freeTextRequest) return current;
  const response: StandardConversationActionGroupResponse = {
    responseRef: `conversation-action-response:${logicalDigest({ entryId, selectedActionRefs, freeTextRequest, respondedAt })}`,
    disposition: input.defer ? "DEFERRED_NOT_NOW" : "USER_REQUESTS_THESE_FOLLOW_UP_ACTIONS",
    selectedActionRefs,
    unselectedActionRefs: entry.presentation.actions.map((action) => action.actionRef)
      .filter((ref) => !selectedActionRefs.includes(ref)),
    freeTextRequest,
    respondedAt,
    projectVersionAtPresentation: entry.presentation.sourceProjectVersion,
    projectWriteAuthorized: false,
  };
  const visible = summarizeStandardConversationActionResponse({ presentation: entry.presentation, response });
  const userTurn: ScientificInterpretationTurn = { turnId: createTurnId(), role: "USER", content: visible.userText, createdAt: respondedAt };
  const assistantTurn: ScientificInterpretationTurn = { turnId: createTurnId(), role: "NOXIA", content: visible.assistantText, createdAt: respondedAt };
  const navigation = current.queryNavigation
    && current.queryNavigation.currentAction?.selectedActionId === entry.presentation.selectedQryActionRef
    ? input.defer
      ? deferFunctionalResetQueryNavigation({ navigation: current.queryNavigation, reason: "USER_REQUESTED_TO_MOVE_ON", recordedAt: respondedAt })
      : recordFunctionalResetQueryResponse({
        navigation: current.queryNavigation,
        rawResponse: visible.userText,
        actorRef: current.projectAuthority.actorRef,
        actorRole: "RESEARCHER",
        receivedAt: respondedAt,
        responseId: response.responseRef,
      })
    : current.queryNavigation;
  return {
    ...current,
    queryNavigation: navigation,
    runtimeTurns: [...current.runtimeTurns, userTurn, assistantTurn],
    entries: [
      ...current.entries.map((item) => item.entryId === entryId && item.kind === "FOLLOW_UP_ACTIONS"
        ? { ...item, response }
        : item),
      { entryId: createConversationEntryId(), kind: "TEXT" as const, role: "USER" as const, content: visible.userText, createdAt: respondedAt },
      { entryId: createConversationEntryId(), kind: "TEXT" as const, role: "NOXIA" as const, content: visible.assistantText, createdAt: respondedAt },
    ],
    updatedAt: respondedAt,
  };
};
