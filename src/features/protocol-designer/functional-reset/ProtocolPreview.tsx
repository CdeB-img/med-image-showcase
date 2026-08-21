import { ArrowLeft, CircleAlert } from "lucide-react";
import {
  buildStandardProtocolPresentation,
  type DocumentProjection,
} from "@/features/document-projection";

type Props = {
  projection: DocumentProjection;
  stale: boolean;
  onClose: () => void;
};

export default function ProtocolPreview({ projection, stale, onClose }: Props) {
  const presentation = buildStandardProtocolPresentation(projection);
  const sourceVersion = projection.source.projectVersion.match(/:version:(\d+)$/)?.[1] ?? projection.source.projectVersion;

  return <section className="min-h-[calc(100vh-7.5rem)] rounded-3xl border bg-background shadow-sm" aria-label="Aperçu du protocole" data-testid="functional-protocol-preview">
    <header className="sticky top-0 z-10 rounded-t-3xl border-b bg-background/95 px-5 py-4 backdrop-blur sm:px-6">
      <button type="button" onClick={onClose} className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-medium">
        <ArrowLeft className="h-4 w-4" />Retour à la conversation
      </button>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[.18em] text-primary">Protocole de travail</p>
      <h2 className="mt-1 text-2xl font-semibold">PROTOCOLE DE TRAVAIL</h2>
      <p className="mt-2 text-sm text-muted-foreground">Aperçu produit à partir du Research Project version {sourceVersion}.</p>
      {stale && <div role="status" className="mt-4 flex gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <p>Le projet a changé depuis cette version du protocole. Son contenu reste consultable, mais il n’est plus présenté comme courant.</p>
      </div>}
    </header>

    <div className="mx-auto max-w-4xl p-5 sm:p-8">
      <div className="rounded-2xl border bg-muted/40 p-4 text-sm">
        <p className="font-medium">Version de travail en lecture seule.</p>
        <p className="mt-1 text-muted-foreground">Elle reprend uniquement les informations projetées par la chaîne documentaire actuelle. Elle ne constitue ni un protocole final ni une validation scientifique ou réglementaire.</p>
      </div>

      {presentation.sections.map((section) => <article key={section.sectionId} className="border-b py-6 last:border-b-0" aria-labelledby={`protocol-preview-${section.sectionId}`}>
        <h3 id={`protocol-preview-${section.sectionId}`} className="text-lg font-semibold">{section.title}</h3>
        {section.entries.length > 0
          ? <div className="mt-3 space-y-3 text-sm leading-relaxed">
            {section.entries.filter((item) => item.kind === "PARAGRAPH").map((item) => <p key={item.entryId}>{item.value}</p>)}
            {section.entries.some((item) => item.kind === "LABELED_VALUE") && <dl className="space-y-3">
              {section.entries.filter((item) => item.kind === "LABELED_VALUE").map((item) => <div key={item.entryId}>
                <dt className="font-medium">{item.label}</dt>
                <dd className="mt-0.5 text-muted-foreground">{item.value}</dd>
              </div>)}
            </dl>}
            {section.entries.some((item) => item.kind === "LIST_ITEM") && <ul className="list-disc space-y-1.5 pl-5">
              {section.entries.filter((item) => item.kind === "LIST_ITEM").map((item) => <li key={item.entryId}>{item.value}</li>)}
            </ul>}
          </div>
          : <p className="mt-3 text-sm text-muted-foreground">À préciser.</p>}
      </article>)}

      <section className="mt-6 rounded-2xl border bg-muted/40 p-4" aria-labelledby="protocol-preview-open-points">
        <h3 id="protocol-preview-open-points" className="font-semibold">Points restant à préciser</h3>
        {presentation.openItems.length > 0
          ? <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">{presentation.openItems.map((item) => <li key={item.itemId}>{item.label}</li>)}</ul>
          : <p className="mt-2 text-sm text-muted-foreground">Aucun point général supplémentaire n’est signalé dans cet aperçu.</p>}
      </section>
    </div>
  </section>;
}
