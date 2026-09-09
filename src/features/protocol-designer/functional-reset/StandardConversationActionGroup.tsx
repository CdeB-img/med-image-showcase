import { useState } from "react";
import type {
  StandardConversationActionGroupPresentation,
  StandardConversationActionGroupResponse,
} from "./standard-conversation-action-group";

const impactStatusLabel = {
  DEMONSTRATED_CURRENT: "Confirmé dans le projet courant",
  POSSIBLE_TO_CHECK: "À vérifier",
  UNKNOWN: "Inconnu à ce stade",
  NOT_APPLICABLE: "Non applicable",
  BLOCKED_BY_MISSING_INFORMATION: "Bloqué par une information manquante",
} as const;

export default function StandardConversationActionGroup({
  presentation,
  response,
  actionable,
  onRespond,
}: Readonly<{
  presentation: StandardConversationActionGroupPresentation;
  response: StandardConversationActionGroupResponse | null;
  actionable: boolean;
  onRespond: (input: { selectedActionRefs: readonly string[]; freeTextRequest: string | null; defer: boolean }) => void;
}>) {
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [other, setOther] = useState("");
  const toggle = (actionRef: string) => setSelected((current) => current.includes(actionRef)
    ? current.filter((ref) => ref !== actionRef)
    : [...current, actionRef]);
  const canSubmit = actionable && !response && (selected.length > 0 || Boolean(other.trim()));

  return <section className="max-w-[94%] rounded-2xl border bg-card p-4 shadow-sm sm:max-w-[86%]" aria-label="Actions de suivi proposées">
    <p className="text-sm leading-relaxed">{presentation.introduction}</p>
    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
      {presentation.impacts.map((impact) => <li key={impact.impactRef} className="rounded-xl bg-muted/50 p-3">
        <span className="mb-1 block text-xs font-semibold text-foreground">{impactStatusLabel[impact.status]}</span>
        {impact.label}
      </li>)}
    </ul>
    <fieldset className="mt-4" disabled={!actionable || Boolean(response)}>
      <legend className="text-sm font-semibold">Actions indépendantes — plusieurs choix possibles</legend>
      <div className="mt-2 space-y-2">
        {presentation.actions.map((action) => <label key={action.actionRef} className="flex min-h-11 items-start gap-3 rounded-xl border bg-background p-3 text-sm">
          <input type="checkbox" className="mt-0.5" checked={selected.includes(action.actionRef)} onChange={() => toggle(action.actionRef)} />
          <span><span className="font-medium">{action.label}</span><span className="ml-2 text-xs text-muted-foreground">{impactStatusLabel[action.status]}</span><span className="mt-1 block text-xs text-muted-foreground">{action.effect}</span></span>
        </label>)}
      </div>
      <label className="mt-3 block text-sm font-medium" htmlFor={`${presentation.presentationRef}:other`}>Autre demande</label>
      <input id={`${presentation.presentationRef}:other`} value={other} onChange={(event) => setOther(event.target.value)} placeholder="Ajoutez une autre action à examiner…" className="mt-1 min-h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm" />
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={!canSubmit} onClick={() => onRespond({ selectedActionRefs: selected, freeTextRequest: other.trim() || null, defer: false })} className="min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40">Examiner ces actions</button>
        <button type="button" disabled={!actionable || Boolean(response)} onClick={() => onRespond({ selectedActionRefs: [], freeTextRequest: null, defer: true })} className="min-h-11 rounded-xl border px-4 py-2 text-sm">Aucun / pas maintenant</button>
      </div>
    </fieldset>
    <details className="mt-3 rounded-xl bg-muted/50 p-3 text-sm">
      <summary className="cursor-pointer font-medium">Pourquoi ces options ?</summary>
      <p className="mt-2 text-muted-foreground">{presentation.why}</p>
    </details>
    {response && <p role="status" className="mt-3 rounded-xl bg-primary/10 p-3 text-sm">{response.disposition === "DEFERRED_NOT_NOW"
      ? "Aucun suivi demandé pour le moment."
      : `${response.selectedActionRefs.length + (response.freeTextRequest ? 1 : 0)} demande(s) de suivi enregistrée(s), sans modification du projet.`}</p>}
  </section>;
}
