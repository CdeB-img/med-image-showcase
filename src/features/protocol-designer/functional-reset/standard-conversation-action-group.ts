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
