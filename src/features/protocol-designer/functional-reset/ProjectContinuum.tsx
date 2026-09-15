type Props = {
  documentsAvailable: boolean;
  documentsOpen: boolean;
  disabled: boolean;
  onConversation: () => void;
  onDocuments: () => void;
};

/** Roadmap presentation only: future stages carry no route, handler or scientific authority. */
export default function ProjectContinuum({ documentsAvailable, documentsOpen, disabled, onConversation, onDocuments }: Props) {
  return <nav aria-label="Parcours longitudinal du projet" className="mb-5 rounded-2xl border bg-background p-4">
    <p className="text-sm font-medium">Un même projet, de la conception à la publication</p>
    <ol className="mt-3 flex flex-wrap gap-2 text-sm">
      <li><button type="button" disabled={disabled} aria-current={!documentsOpen ? "step" : undefined} onClick={onConversation}
        className={`min-h-12 rounded-xl border px-4 text-left ${!documentsOpen ? "border-primary bg-primary/10 font-semibold" : ""}`}>Conception</button></li>
      <li><button type="button" disabled={disabled || !documentsAvailable} aria-current={documentsOpen ? "step" : undefined} onClick={onDocuments}
        className={`min-h-12 rounded-xl border px-4 text-left disabled:text-muted-foreground ${documentsOpen ? "border-primary bg-primary/10 font-semibold" : ""}`}>Protocole / documents</button></li>
      {["Revues", "Interprétation des résultats", "Publication"].map((label) => <li key={label}>
        <button type="button" disabled data-capability-status="WORK_IN_PROGRESS" className="min-h-12 cursor-not-allowed rounded-xl border border-dashed bg-muted/60 px-4 py-2 text-left text-muted-foreground">
          <span className="block">{label}</span><span className="mt-0.5 block text-xs">À venir</span>
        </button>
      </li>)}
    </ol>
    <p className="mt-3 text-xs text-muted-foreground">Les étapes « À venir » présentent la suite envisagée du parcours. Elles ne sont pas disponibles dans cette version.</p>
  </nav>;
}
