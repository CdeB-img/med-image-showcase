import { useMemo, useState } from "react";
import type { NavigationResponseDisposition } from "@/features/query-navigation/lifecycle-contracts";
import type { QueryNavigationProductProjection } from "@/features/query-navigation/product-contracts";
import type { WorkspaceMode } from "./contracts";
import { createWorkspaceInteractionHandoff, inspectWorkspaceInteractionFreshness, type WorkspaceInteractionHandoff, type WorkspaceResponseState } from "./interactions";

const ACTION_LABEL: Record<NonNullable<QueryNavigationProductProjection["selectedAction"]>["actionCategory"], string> = {
  CLARIFY_BY_ADAPTIVE_EXCHANGE: "Répondre à cette clarification",
  BUILD_OR_REVISE_OBJECT: "Ouvrir l’objet concerné",
  COMPARE_OPTIONS: "Comparer les options",
  TRIGGER_METHODOLOGICAL_REVIEW: "Ouvrir la revue méthodologique",
  REQUEST_HUMAN_DECISION: "Préparer la décision humaine",
  PRODUCE_PROVISIONAL_PROJECTION: "Voir la projection provisoire",
  SUSPEND_OR_STOP: "Examiner la suspension",
  REFUSE_PROTOCOL_PROJECTION: "Comprendre le refus de projection",
};

const STANDARD_WHY_NOW: Record<NonNullable<QueryNavigationProductProjection["selectedAction"]>["actionCategory"], string> = {
  CLARIFY_BY_ADAPTIVE_EXCHANGE: "Cette précision peut modifier plusieurs décisions de conception de l’étude.",
  BUILD_OR_REVISE_OBJECT: "Cet élément doit être examiné pour que le projet puisse progresser sans supposition.",
  COMPARE_OPTIONS: "Plusieurs options restent possibles et aucune ne peut être retenue automatiquement.",
  TRIGGER_METHODOLOGICAL_REVIEW: "Une revue méthodologique est nécessaire avant de poursuivre ce point.",
  REQUEST_HUMAN_DECISION: "Une décision humaine est requise avant tout effet sur le Research Project.",
  PRODUCE_PROVISIONAL_PROJECTION: "Les informations actuelles permettent d’examiner une projection provisoire.",
  SUSPEND_OR_STOP: "Une condition de poursuite manque ou un arrêt explicite doit être examiné.",
  REFUSE_PROTOCOL_PROJECTION: "Les conditions réelles ne permettent pas encore de produire cette projection.",
};

const STATE_LABEL: Record<WorkspaceResponseState, string> = {
  READY: "Prêt à recevoir votre réponse.",
  RECEIVED: "Réponse reçue.",
  INTERPRETATION_PENDING: "Réponse reçue comme contribution brute. Son interprétation reste à produire et à examiner.",
  HUMAN_REVIEW_REQUIRED: "Option transmise vers la frontière Human Decision. Aucune décision n’a été créée.",
  OWNER_ACTION_PENDING: "Réponse transmise au propriétaire concerné. Le Project n’a pas été modifié par l’interface.",
  DEFERRED: "Action différée. Le besoin reste ouvert et ne doit pas être reposé sans nouveau déclencheur.",
  DECLINED: "Réponse déclinée. Aucune valeur par défaut n’a été appliquée.",
  UNKNOWN_PRESERVED: "Information conservée comme inconnue. Ce n’est pas une erreur de formulaire.",
  STALE_BLOCKED: "Le projet a changé depuis l’ouverture de cette action. La réponse est conservée, mais sa transmission est bloquée.",
};

export type WorkspaceNextActionInteractionProps = {
  projection: Readonly<QueryNavigationProductProjection>;
  currentProjectVersion: string;
  currentSourceStateDigest: string;
  onOwnerHandoff?: (handoff: WorkspaceInteractionHandoff) => void;
  onOpenTarget?: (targetRef: string) => void;
  onChooseNavigationPreference?: (candidateRef: string) => void;
  mode?: WorkspaceMode;
};

export default function WorkspaceNextActionInteraction({ projection, currentProjectVersion, currentSourceStateDigest, onOwnerHandoff, onOpenTarget, onChooseNavigationPreference, mode = "STANDARD" }: WorkspaceNextActionInteractionProps) {
  const [rawResponse, setRawResponse] = useState("");
  const [selectedOptionRef, setSelectedOptionRef] = useState<string | null>(null);
  const [responseState, setResponseState] = useState<WorkspaceResponseState>("READY");
  const [submittedHandoff, setSubmittedHandoff] = useState<WorkspaceInteractionHandoff | null>(null);
  const freshness = useMemo(() => inspectWorkspaceInteractionFreshness(projection, currentProjectVersion, currentSourceStateDigest), [currentProjectVersion, currentSourceStateDigest, projection]);
  const presentation = projection.questionPresentation;
  const action = projection.selectedAction;

  const respond = (disposition: NavigationResponseDisposition) => {
    if (!presentation || !action) return;
    const handoff = createWorkspaceInteractionHandoff({
      projection,
      currentProjectVersion,
      currentSourceStateDigest,
      disposition,
      rawResponse: disposition === "ANSWER" ? (presentation.expectedAnswerKind === "FREE_TEXT" ? rawResponse : selectedOptionRef) : null,
      selectedOptionRefs: disposition === "ANSWER" && selectedOptionRef ? [selectedOptionRef] : [],
      actorRef: "CURRENT_RESEARCHER",
      actorRole: "RESEARCHER",
      receivedAt: new Date().toISOString(),
      responseId: `workspace-response:${presentation.presentationId}:${Date.now()}`,
    });
    setSubmittedHandoff(handoff);
    setResponseState(handoff.state);
    onOwnerHandoff?.(handoff);
  };

  return <section className="rounded-2xl border border-primary/40 bg-card p-5 shadow-sm" data-testid="workspace-next-action" aria-labelledby="workspace-next-action-title">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">NOXIA</p><h3 id="workspace-next-action-title" className="mt-2 text-2xl font-bold">{projection.summary.actionLabel ?? "Choisir la suite"}</h3></div>{mode === "EXPERT" && <span className="rounded-full border bg-muted px-2.5 py-1 text-xs">{projection.status.replace(/_/g, " ").toLocaleLowerCase("fr-FR")}</span>}</div>
    <p className="mt-3 text-sm"><strong>Pourquoi :</strong> {projection.summary.reason}</p>
    <p className="mt-3 text-sm"><strong>Pourquoi maintenant :</strong> {mode === "EXPERT" || !action ? projection.summary.whyNow : STANDARD_WHY_NOW[action.actionCategory]}</p>
    <p className="mt-2 text-sm"><strong>Ce que cela peut changer :</strong> {mode === "EXPERT" ? [...projection.summary.affectedDecisionRefs, ...projection.summary.affectedBranchRefs].join(" · ") || "navigation courante" : "les décisions et éléments du projet concernés par cette question"}</p>
    {projection.summary.deferAllowed && <p className="mt-2 text-sm text-muted-foreground"><strong>Si vous préférez attendre :</strong> {mode === "EXPERT" ? projection.summary.deferConsequence ?? "le besoin reste ouvert" : "ce point restera ouvert et le travail indépendant pourra continuer."}</p>}

    {!action && projection.alternatives.length > 1 && <fieldset className="mt-5"><legend className="font-semibold">Options de navigation non dominées</legend><p className="mt-1 text-sm text-muted-foreground">Aucune option n’est recommandée ni présélectionnée. L’ordre visuel est neutre.</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{projection.alternatives.map((candidate) => <button key={candidate.candidateId} type="button" aria-pressed="false" onClick={() => onChooseNavigationPreference?.(candidate.candidateId)} className="min-h-11 rounded-xl border p-4 text-left"><span className="font-medium">{candidate.actionLabel}</span><span className="mt-2 block text-sm text-muted-foreground">{candidate.explanation}</span><span className="mt-2 block text-xs text-muted-foreground">Choix de navigation seulement — aucune conclusion scientifique.</span></button>)}</div><button type="button" onClick={() => setResponseState("UNKNOWN_PRESERVED")} className="mt-3 min-h-11 rounded-lg border px-3 py-2">Je ne sais pas</button></fieldset>}

    {action && !presentation && <div className="mt-5"><button type="button" onClick={() => onOpenTarget?.(action.targetRef)} className="min-h-11 rounded-lg bg-primary px-4 py-2 text-primary-foreground">{ACTION_LABEL[action.actionCategory]}</button>{action.actionCategory === "REFUSE_PROTOCOL_PROJECTION" && <p className="mt-3 text-sm text-muted-foreground">Le refus conserve sa règle, ses preuves et sa condition de réévaluation. Aucun faux document n’est produit.</p>}</div>}

    {presentation && action && <div className="mt-5 rounded-xl bg-muted/50 p-4" aria-describedby="workspace-question-context"><p className="font-semibold">{presentation.intent}</p><p id="workspace-question-context" className="mt-2 text-sm text-muted-foreground">{mode === "EXPERT" ? `Cette réponse concerne ${presentation.targetRef}.` : "Répondez avec vos mots ou utilisez un raccourci."} Ne pas savoir, attendre ou préférer ne pas répondre restent des réponses légitimes.</p>
      {presentation.expectedAnswerKind === "FREE_TEXT" && <div className="mt-4"><label htmlFor="workspace-free-response" className="text-sm font-medium">Votre réponse</label><textarea id="workspace-free-response" value={rawResponse} onChange={(event) => setRawResponse(event.target.value)} className="mt-2 min-h-28 w-full rounded-lg border bg-background p-3" aria-describedby="workspace-free-response-help" /><p id="workspace-free-response-help" className="mt-1 text-xs text-muted-foreground">Le texte reste une contribution à examiner ; il ne modifie pas directement le Research Project.</p><button type="button" disabled={!rawResponse.trim() || freshness.status !== "CURRENT"} onClick={() => respond("ANSWER")} className="mt-3 min-h-11 rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">Envoyer ma réponse</button>{!rawResponse.trim() && freshness.status === "CURRENT" && <p className="mt-2 text-xs text-muted-foreground">Écrivez une réponse pour pouvoir l’envoyer.</p>}</div>}
      {["SINGLE_OPTION", "MULTIPLE_OPTIONS", "HUMAN_REVIEW_DECISION"].includes(presentation.expectedAnswerKind) && <fieldset className="mt-4"><legend className="text-sm font-medium">Options disponibles</legend><p className="mt-1 text-xs text-muted-foreground">Aucune option n’est présélectionnée.</p><div className="mt-2 grid gap-2">{presentation.knownOptions.map((option) => <label key={option} className="flex min-h-11 items-center gap-3 rounded-lg border bg-background p-3"><input type="radio" name="workspace-option" checked={selectedOptionRef === option} onChange={() => setSelectedOptionRef(option)} /><span>{option}</span></label>)}</div><button type="button" disabled={!selectedOptionRef || freshness.status !== "CURRENT"} onClick={() => respond("ANSWER")} className="mt-3 min-h-11 rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">Soumettre ce choix à la décision humaine</button>{!selectedOptionRef && freshness.status === "CURRENT" && <p className="mt-2 text-xs text-muted-foreground">Choisissez une option avant de la soumettre. Aucune n’est sélectionnée par défaut.</p>}</fieldset>}
      <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => respond("DEFER")} className="min-h-11 rounded-lg border px-3 py-2">Différer</button><button type="button" onClick={() => respond("CANNOT_ANSWER")} className="min-h-11 rounded-lg border px-3 py-2">Je ne sais pas</button><button type="button" onClick={() => respond("DECLINE")} className="min-h-11 rounded-lg border px-3 py-2">Je préfère ne pas répondre</button></div>
    </div>}

    {freshness.status !== "CURRENT" && <div role="alert" className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3"><p className="font-medium">Le projet a changé depuis l’ouverture de cette action.</p><p className="mt-1 text-sm">Votre saisie locale est conservée. Rechargez l’action avant de la transmettre.</p></div>}
    {responseState !== "READY" && <p role="status" className="mt-4 rounded-lg bg-primary/10 p-3 text-sm">{STATE_LABEL[responseState]}</p>}
    {submittedHandoff && mode === "EXPERT" && <p className="mt-2 text-xs text-muted-foreground">Destination : {submittedHandoff.route.destination.replace(/_/g, " ").toLocaleLowerCase("fr-FR")}. Écriture Project : non.</p>}
  </section>;
}
