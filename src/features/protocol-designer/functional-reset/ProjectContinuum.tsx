type Props = {
  documentsAvailable: boolean;
  documentsOpen: boolean;
  disabled: boolean;
  onConversation: () => void;
  onDocuments: () => void;
};

/** Compact navigation only; no lifecycle execution or future capability claims. */
export default function ProjectContinuum({ documentsAvailable, documentsOpen, disabled, onConversation, onDocuments }: Props) {
  return <nav aria-label="Parcours longitudinal du projet" data-testid="project-document-navigation"
    className="sticky top-3 z-20 min-w-0 self-stretch rounded-2xl border bg-background p-2 shadow-sm sm:self-start">
    <ol className="flex flex-row gap-2 text-sm sm:flex-col">
      <li className="min-w-0 flex-1"><button type="button" disabled={disabled} aria-current={!documentsOpen ? "step" : undefined} onClick={onConversation}
        className={`min-h-12 w-full rounded-xl border px-3 text-left ${!documentsOpen ? "border-primary bg-primary/10 font-semibold" : ""}`}>Conception</button></li>
      <li className="min-w-0 flex-1"><button type="button" disabled={disabled || !documentsAvailable} aria-current={documentsOpen ? "step" : undefined} onClick={onDocuments}
        className={`min-h-12 w-full rounded-xl border px-3 text-left disabled:text-muted-foreground ${documentsOpen ? "border-primary bg-primary/10 font-semibold" : ""}`}>Documents</button></li>
    </ol>
  </nav>;
}
