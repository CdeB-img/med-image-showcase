/** Bounded DOC → existing QRY adapter. These are navigation projections and
 * response receipts, not a scientific classifier, adoption or new state store. */
import { logicalDigest } from "../knowledge-engine/canonical.js";
import { computeSelectedActionDigest } from "./lifecycle-canonical.js";
import { selectNextAction } from "./engine.js";
import { buildQueryNavigationContext } from "./adapters.js";
import { buildQuestionPresentationRequest, buildSelectedNavigationAction, createQueryNavigationMemory,
  rememberQuestionPresentation, rememberSelectedNavigationAction, appendNavigationLifecycleEvent } from "./lifecycle.js";
import { buildFunctionalResetQuerySourceState, recordFunctionalResetQueryResponse,
  FUNCTIONAL_RESET_QRY_BOUNDARY, type FunctionalResetQueryNavigation } from "./functional-reset-progression.js";
import type { QuestionPresentationRequest } from "./lifecycle-contracts.js";
import type { FunctionalResetSession } from "../protocol-designer/functional-reset/session.js";
import { studioIntentPostCutoffControl } from "../protocol-designer/functional-reset/studio-finalization-controls.js";
import { studioIntentDecisionScope, studioIntentUnresolvedScientificEdits,
  type StudioFinalizationIntent } from "../document-projection/studio-finalization-intent.js";

export const studioFinalizationQuestion = (intent: StudioFinalizationIntent, session?: FunctionalResetSession): QuestionPresentationRequest | null => {
  // Completed scientific/archival phases are not reopened by later work.
  if (intent.state === "CLOSED" || intent.state === "READY_FOR_DOCUMENT_FINALIZATION") return null;
  const assessment = intent.resolution.assessment?.nativePayload;
  let question = assessment?.edits.find(edit => edit.ambiguity)?.ambiguity?.question ?? assessment?.scientificStateAmbiguity?.question;
  let requiredRefs = assessment?.edits.filter(edit => edit.ambiguity).map(edit => edit.editRef) ?? [];
  let reason = "EXISTING_QRY_PATH";
  const control = session ? studioIntentPostCutoffControl(intent, session) : null;
  if (control && ["MATERIAL", "UNKNOWN"].includes(control.disposition)) {
    reason = control.disposition === "MATERIAL" ? "STUDIO_POST_CUTOFF_SCIENTIFIC_CHANGE" : "STUDIO_POST_CUTOFF_IMPACT_UNCERTAIN";
    requiredRefs = [control.controlRef!];
    question = control.disposition === "MATERIAL"
      ? "Votre dernier message remet en cause un choix du travail figé. Quel choix souhaitez-vous conserver avant de reprendre cette version ? La modification devra être examinée par le parcours scientifique existant."
      : "Votre dernier message concerne-t-il les choix scientifiques de cette version, ou souhaitez-vous le conserver pour la version suivante sans modifier le travail déjà figé ?";
  } else if (!question && intent.resolution.preparation?.result) {
    const scope = studioIntentDecisionScope(intent);
    if ("clarification" in scope) { question = scope.clarification; reason = "STUDIO_REQUIRED_SCIENTIFIC_DEPENDENCY"; }
    else {
      const unresolved = studioIntentUnresolvedScientificEdits(intent);
      const pending = scope.sources.filter(source => source.origin !== "STUDIO" && !("epistemicState" in source.native
        && source.native.epistemicState === "USER_STATED" && "polarity" in source.native && source.native.polarity === "AFFIRMED"
        && "conditions" in source.native && source.native.conditions.length === 0));
      const proposed = scope.atoms.filter(atom => intent.resolution.preparation!.result!.workingDraft.origins[atom.ref] !== "EXPLICIT_USER");
      if (unresolved.length) {
        requiredRefs = unresolved.map(edit => edit.editRef); reason = "STUDIO_SCIENTIFIC_CHANGE_NOT_RESOLVED";
        question = "La suppression ou modification de ce passage est évaluée comme scientifique, mais les choix préparés n’en résolvent pas l’effet. Souhaitez-vous retirer uniquement le passage du document en conservant les décisions scientifiques du projet, ou également modifier ces décisions ?";
      } else if (pending.length || proposed.length) {
        requiredRefs = [...pending.map(source => source.ref), ...proposed.map(atom => atom.ref)];
        reason = "STUDIO_REQUIRED_SCIENTIFIC_DECISION";
        const labels = proposed.length ? proposed.map(atom => atom.content) : pending.map(source => "content" in source.native ? source.native.content : source.ref);
        question = `Le changement sélectionné dépend du choix suivant, qui n’est pas encore adopté : ${labels.slice(0, 2).map(label => label.slice(0, 250)).join(" ; ")}. Quel choix souhaitez-vous retenir ? Les autres points ouverts restent inchangés.`;
      }
    }
  }
  if (!question) return null;
  const refs = [...new Set([intent.finalizationIntentId, intent.intentDigest, intent.frozen.workingRevisionId,
    `studio-save:${intent.frozen.workingRevisionSaveSequence}:${intent.frozen.workingRevisionContentDigest}`,
    intent.resolution.sourceSet?.sourceSetId ?? intent.frozen.scientificSources.captureDigest,
    intent.resolution.sourceSet?.sourceSetDigest ?? intent.frozen.scientificSources.captureDigest,
    ...intent.resolution.sourceSet?.sources.filter(source => source.origin === "STUDIO").map(source => source.ref) ?? [],
    ...requiredRefs])].sort();
  const digest = logicalDigest({ refs, question, reason });
  const needRef = `studio-finalization-need:${digest}`;
  return { presentationId: `studio-clarification:${digest}`, selectedActionRef: `studio-clarification-action:${digest}`,
    informationNeedRefs: [needRef], informationNeedRef: needRef, intent: question,
    targetRef: intent.finalizationIntentId, expectedAnswerKind: "FREE_TEXT", answerOwner: "SCIENTIFIC_THINKING",
    affectedDecisionRefs: requiredRefs, affectedBranchRefs: [], whyNow: reason,
    unknownOrDeferConsequence: "DRAFT_AND_FROZEN_INTENT_RETAINED_NO_ADOPTION",
    knownOptions: [], contextRefs: refs, projectRef: intent.frozen.sourceProject.projectId,
    projectVersion: intent.resolution.resolvedProject?.projectVersion ?? intent.frozen.sourceProject.projectVersion,
    provenanceRefs: refs, limitations: ["EXPLICIT_RESUME_REQUIRED", "ANSWER_IS_NOT_PROJECT_ADOPTION", "UNKNOWN_REMAINS_UNKNOWN"],
    presentationOnly: true, wordingOwnedBy: "PD-004", sourceOfTruth: false, projectWriteAuthorized: false };
};

export const presentStudioFinalizationQuestion = (session: FunctionalResetSession, presentation: QuestionPresentationRequest): FunctionalResetSession => {
  if (!session.project || session.project.projectId !== presentation.projectRef || session.project.versionId !== presentation.projectVersion)
    throw new Error("STUDIO_CLARIFICATION_PROJECT_STALE");
  if (session.queryNavigation?.currentPresentation?.presentationId === presentation.presentationId) return session;
  // QRY selects/presents this owner-proven blocking need. Ordinary Project
  // unknowns do not become blockers merely because they coexist in the Project.
  const sourceState = buildFunctionalResetQuerySourceState(session.project);
  for (const key of Object.keys(sourceState) as (keyof typeof sourceState)[]) if (Array.isArray(sourceState[key]))
    (sourceState as Record<string, unknown>)[key] = [];
  sourceState.governedNeeds = [{ needId: presentation.informationNeedRef, sourceRef: presentation.targetRef,
    sourceType: "DOMAIN_READINESS", sourceVersion: presentation.presentationId, sourceObjectKind: "StudioFinalizationIntent",
    owner: presentation.answerOwner, informationIntent: presentation.intent, affectedDecisionRefs: presentation.affectedDecisionRefs,
    affectedBranchRefs: [], blocking: "BLOCKS_CURRENT_BRANCH", actionability: "USER_ANSWERABLE", status: "OPEN",
    availableFromOwner: "SCIENTIFIC_THINKING", knownOptions: [], provenance: { sourceRefs: presentation.provenanceRefs,
      owner: "DOC_FINALIZATION_COORDINATION", evidence: [presentation.whyNow], limitations: presentation.limitations },
    limitations: presentation.limitations, projectionOnly: true, sourceOfTruth: false, projectWriteAuthorized: false }];
  const context = buildQueryNavigationContext({ projectRef: presentation.projectRef, projectVersion: presentation.projectVersion,
    sourceState, currentUsageRef: presentation.targetRef });
  const selection = selectNextAction(context), candidate = selection.selected;
  if (!candidate) throw new Error("STUDIO_CLARIFICATION_NAVIGATION_UNAVAILABLE");
  const selected = buildSelectedNavigationAction(selection);
  const action = { ...selected, selectedActionId: presentation.selectedActionRef };
  action.digest = computeSelectedActionDigest(action);
  // Use the native builder; documentary source bindings remain attached.
  const question = { ...buildQuestionPresentationRequest(action, candidate), ...presentation };
  let memory = session.queryNavigation?.memory ?? createQueryNavigationMemory(presentation.projectRef, presentation.projectVersion);
  memory = rememberSelectedNavigationAction(memory, action); memory = rememberQuestionPresentation(memory, question);
  const recordedAt = new Date().toISOString();
  for (const eventType of ["ACTION_SELECTED", "ACTION_PRESENTED"] as const) memory = appendNavigationLifecycleEvent(memory, {
    eventType, actionRef: action.selectedActionId, presentationRef: eventType === "ACTION_PRESENTED" ? question.presentationId : null,
    responseRef: null, projectRef: presentation.projectRef, projectVersion: presentation.projectVersion,
    sourceStateDigest: context.sourceStateDigest, reason: presentation.whyNow, evidenceRefs: presentation.provenanceRefs, recordedAt });
  const navigation: FunctionalResetQueryNavigation = { contract: "FUNCTIONAL_RESET_QUERY_NAVIGATION", contractVersion: "1.0.0",
    boundary: FUNCTIONAL_RESET_QRY_BOUNDARY, owner: "QUERY_NAVIGATION", projectRef: presentation.projectRef,
    projectVersion: presentation.projectVersion, projectDigest: session.project.projectDigest, sourceStateDigest: context.sourceStateDigest,
    status: "QUESTION_READY", selection, memory, currentAction: action, currentPresentation: question,
    standardQuestion: { questionId: question.presentationId, selectedActionRef: action.selectedActionId,
      informationNeedRefs: question.informationNeedRefs, scopeSectionIds: [], priorityLead: "Une décision est nécessaire pour ce brouillon.",
      text: question.intent, presentationSource: "PD004_WORDING", repeatCount: 0, presentationOnly: true, choosesScientificScope: false },
    needSections: {}, documentSignalRefs: [], lastResponseRoute: null, projectionOnly: true, sourceOfTruth: false, projectWriteAuthorized: false };
  return { ...session, queryNavigation: navigation, entries: session.entries.some(entry => entry.entryId === question.presentationId)
    ? session.entries : [...session.entries, { entryId: question.presentationId, kind: "TEXT", role: "NOXIA",
      content: question.intent, createdAt: recordedAt }] };
};

/** Link only a real submitted USER turn. Free text remains a contribution for
 * Scientific Thinking, not a scoped human adoption or invented missing value. */
export const bindStudioConversationAnswer = (session: FunctionalResetSession, turn: FunctionalResetSession["runtimeTurns"][number]): FunctionalResetSession => {
  const navigation = session.queryNavigation, question = navigation?.currentPresentation;
  if (!question?.targetRef.startsWith("studio-finalization-intent:") || turn.role !== "USER") return session;
  if (session.project?.versionId !== question.projectVersion || session.project.projectId !== question.projectRef)
    return session; // An obsolete question cannot capture a new answer; ordinary conversation remains available.
  if (navigation!.memory.responses.some(response => response.presentationRef === question.presentationId)) return session;
  const updated = recordFunctionalResetQueryResponse({ navigation: navigation!, rawResponse: turn.content,
    actorRef: session.projectAuthority.actorRef, actorRole: "HUMAN_USER", receivedAt: turn.createdAt!, responseId: `studio-answer:${turn.turnId}`,
    provenanceRefs: [...question.provenanceRefs, question.presentationId, turn.turnId, logicalDigest(turn.content)] });
  return { ...session, queryNavigation: updated };
};
