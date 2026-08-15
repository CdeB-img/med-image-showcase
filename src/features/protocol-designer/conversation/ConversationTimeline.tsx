import { ArrowRight, LoaderCircle } from "lucide-react";
import type { ConversationalWorkspaceSession, ConversationTimelineEvent } from "./ConversationalWorkspaceSession";

const DISCLOSED_EXAMPLE = "Je souhaite caractériser un objet scientifique avec plusieurs familles d’observation.";

const speakerFor = (event: ConversationTimelineEvent) => event.type === "USER_MESSAGE" || event.type === "USER_CORRECTION" || event.type === "USER_CONFIRMATION"
  ? "Vous"
  : "NOXIA";

const eventTone = (event: ConversationTimelineEvent) => {
  if (event.type === "USER_MESSAGE" || event.type === "USER_CORRECTION") return "ml-auto rounded-br-sm bg-muted";
  if (event.presentationStatus === "FAILURE" || event.type === "ERROR") return "mr-auto rounded-bl-sm border border-destructive/40 bg-destructive/10";
  if (event.presentationStatus === "STALE") return "mr-auto rounded-bl-sm border border-amber-500/40 bg-amber-500/10";
  if (event.presentationStatus === "SUCCESS") return "mr-auto rounded-bl-sm border border-emerald-500/30 bg-emerald-500/10";
  return "mr-auto rounded-bl-sm bg-primary/10";
};

type Props = {
  session: ConversationalWorkspaceSession;
  draft: string;
  busy: boolean;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
  children?: React.ReactNode;
  placeholder?: string;
};

export default function ConversationTimeline({ session, draft, busy, onDraftChange, onSubmit, children, placeholder }: Props) {
  return <section
    className="flex min-h-[68vh] min-w-0 flex-col rounded-2xl border bg-card shadow-sm"
    aria-label="Conversation scientifique"
    data-testid="conversation-timeline"
    data-conversation-id={session.conversationId}
  >
    <div className="border-b p-5">
      <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">Conversation</p>
      <h2 className="mt-2 text-xl font-semibold">Raisonnement scientifique continu</h2>
      <p className="mt-2 text-sm text-muted-foreground">Les réponses, corrections et retours des owners restent visibles au même endroit.</p>
    </div>
    <div className="min-h-72 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5" aria-live="polite">
      {!session.timeline.length && <div className="rounded-2xl bg-primary/10 p-5">
        <p className="font-semibold">Que cherchez-vous à démontrer, comparer, mesurer, prédire ou comprendre ?</p>
        <p className="mt-2 text-sm text-muted-foreground">Décrivez votre projet librement. Une idée incomplète est recevable.</p>
        <button type="button" onClick={() => onDraftChange(DISCLOSED_EXAMPLE)} className="mt-4 rounded-xl border bg-background px-3 py-2 text-left text-sm">{DISCLOSED_EXAMPLE}</button>
      </div>}
      {session.timeline.map((event) => <article key={event.eventId} className={`max-w-[94%] rounded-2xl p-4 ${eventTone(event)}`} data-event-type={event.type} data-presentation-status={event.presentationStatus}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{speakerFor(event)}</p>
          {event.presentationStatus === "PENDING" && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><LoaderCircle className="h-3 w-3 animate-spin" /> En cours</span>}
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{event.text}</p>
      </article>)}
      {children}
      {busy && <div role="status" className="mr-auto flex max-w-[94%] items-center gap-3 rounded-2xl rounded-bl-sm bg-primary/10 p-4 text-sm"><LoaderCircle className="h-4 w-4 animate-spin" /> NOXIA analyse votre réponse et prépare le handoff propriétaire.</div>}
    </div>
    <div className="border-t p-4 sm:p-5">
      <label htmlFor="continuous-scientific-conversation-message" className="sr-only">Votre question scientifique</label>
      <textarea
        id="continuous-scientific-conversation-message"
        maxLength={4000}
        value={draft}
        onChange={(event) => onDraftChange(event.target.value.slice(0, 4000))}
        onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") onSubmit(); }}
        className="min-h-28 w-full resize-y rounded-xl border bg-background p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder={placeholder ?? (session.timeline.length ? "Ajoutez une précision ou corrigez naturellement…" : "Décrivez librement votre question scientifique…")}
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">⌘/Ctrl + Entrée pour envoyer · <span>{draft.length} / 4 000</span></p>
        <button type="button" disabled={busy || !draft.trim()} onClick={onSubmit} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Envoyer <ArrowRight className="h-4 w-4" /></button>
      </div>
    </div>
  </section>;
}
