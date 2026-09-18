import { ArrowLeft, CircleAlert, Download } from "lucide-react";
import { useState } from "react";
import { readableDocumentDiff } from "@/features/document-projection/scientific-document-revision";
import {
  buildStandardProtocolPresentation,
  administrationStatusLabel,
  type DocumentProjection,
} from "@/features/document-projection";
import { downloadProjection } from "@/features/document-projection/DocumentProjectionView";

type Props = {
  onDocumentInstruction?: (text: string) => void;
  documentMessage?: string;
  projection: DocumentProjection;
  stale: boolean;
  onClose: () => void;
  onArtifactGenerated?: (format: "HTML", generatedAt: string) => void;
  onCompleteAdministration?: () => void;
  onRegenerate?: () => void;
  history?: ReadonlyArray<DocumentProjection>;
  onOpenVersion?: (projectionId: string) => void;
};

export default function ProtocolPreview({ projection, stale, onClose, onArtifactGenerated, onCompleteAdministration, onRegenerate, history = [], onOpenVersion, onDocumentInstruction, documentMessage }: Props) {
  const [instruction, setInstruction] = useState("");
  const presentation = buildStandardProtocolPresentation(projection);
  const sourceVersion = projection.source.projectVersion.match(/:version:(\d+)$/)?.[1] ?? projection.source.projectVersion;
  const downloadHtml = () => {
    downloadProjection(projection, "HTML");
    onArtifactGenerated?.("HTML", new Date().toISOString());
  };

  return <section className="min-h-[calc(100vh-7.5rem)] rounded-3xl border bg-background shadow-sm" aria-label="Aperçu du protocole" data-testid="functional-protocol-preview">
    <header className="rounded-t-3xl border-b bg-background px-5 py-4 sm:px-6">
      <button type="button" onClick={onClose} className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-medium">
        <ArrowLeft className="h-4 w-4" />Retour à la conversation
      </button>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[.18em] text-primary">Protocole de travail</p>
      <h2 className="mt-1 text-2xl font-semibold">PROTOCOLE DE TRAVAIL</h2>
      <p className="mt-2 text-sm text-muted-foreground">Aperçu produit à partir du projet version {sourceVersion}.</p>
      <p className="mt-1 text-sm text-muted-foreground">Version générée {projection.projectionVersion} · {new Date(projection.requestedAt).toLocaleString("fr-FR")}</p>
      {projection.administration && <div className="mt-4 rounded-xl border bg-muted/30 p-4" data-document-administration-status={projection.administration.status}>
        <p className="font-semibold">{administrationStatusLabel(projection.administration)}</p>
        <p className="mt-1 text-sm">Les champs absents restent explicitement à compléter. Ce statut ne vaut pas autorisation de soumission.</p>
        {onCompleteAdministration && <button type="button" onClick={onCompleteAdministration} className="mt-3 min-h-10 rounded-lg border bg-background px-3 text-sm">Compléter les informations administratives</button>}
      </div>}
      {stale && <div role="status" className="mt-4 flex gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <div><p>Le projet ou ses informations administratives ont changé depuis cette version du protocole. Son contenu reste consultable, mais il n’est plus présenté comme courant.</p>
          {onRegenerate && <button type="button" onClick={onRegenerate} className="mt-2 min-h-10 rounded-lg border bg-background px-3 font-medium">Régénérer depuis le projet courant</button>}</div>
      </div>}
      {!stale && onRegenerate && <button type="button" onClick={onRegenerate} className="mt-4 mr-3 min-h-11 rounded-xl border px-4 text-sm font-medium">
        Actualiser les documents de travail
      </button>}
      <button
        type="button"
        onClick={downloadHtml}
        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
      >
        <Download className="h-4 w-4" />
        {stale ? "Télécharger cette version historique (.html)" : "Télécharger le protocole (.html)"}
      </button>
    </header>

    <div className="mx-auto max-w-4xl p-5 sm:p-8">
      {projection.administration && <section aria-label="Informations administratives du document" className="mb-6 rounded-2xl border p-5">
        <h3 className="text-lg font-semibold">Informations administratives</h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">{projection.administration.fields.filter((f) => f.required || f.value).map((f) => <div key={f.key}>
          <dt className="text-sm font-medium">{f.label}</dt><dd className={`mt-1 text-sm ${f.value ? "" : "text-amber-800"}`}>{f.value ?? f.placeholder}</dd>
        </div>)}</dl>
      </section>}
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
      {onDocumentInstruction && <section className="mt-6 rounded-2xl border p-4" aria-label="Conversation documentaire">
        <h3 className="font-semibold">Travailler sur ce document</h3>
        <p className="mt-2 text-sm text-muted-foreground">La révision porte sur l’introduction et ses références. Une demande qui modifie la science revient dans la conversation du projet pour revue. Les autres sections restent conservées.</p>
        {!projection.evidenceContent && <button type="button" disabled={stale} onClick={() => onDocumentInstruction("Préparer le contexte sourcé et les références du protocole")} className="mt-3 min-h-11 rounded-lg border px-3 text-sm">Préparer le contexte sourcé et les références</button>}
        <form className="mt-3" onSubmit={(event) => { event.preventDefault(); if (instruction.trim()) { onDocumentInstruction(instruction.trim()); setInstruction(""); } }}>
          <label htmlFor="document-instruction" className="block text-sm font-medium">Instruction documentaire</label>
          <textarea id="document-instruction" value={instruction} onChange={(event) => setInstruction(event.target.value)} placeholder="Développe l’introduction, ajoute une référence, montre ce qui a changé…" className="mt-2 min-h-24 w-full rounded-xl border p-3" />
          <button type="submit" disabled={stale || !instruction.trim()} className="mt-2 min-h-11 rounded-lg border px-4 text-sm disabled:opacity-50">Travailler sur le document</button>
        </form>
        {documentMessage && <p role="status" className="mt-3 rounded-lg bg-muted p-3 text-sm">{documentMessage}</p>}
        {projection.documentaryRevision && <p className="mt-3 text-sm">Dernière instruction : {projection.documentaryRevision.instruction}. Modification documentaire, projet source inchangé.</p>}
        {history.find((item) => item.projectionId === projection.priorProjectionId) && <p className="mt-2 text-sm">{readableDocumentDiff(history.find((item) => item.projectionId === projection.priorProjectionId)!, projection)}</p>}
      </section>}
      {history.length > 1 && onOpenVersion && <section className="mt-6 rounded-2xl border p-4" aria-label="Historique documentaire">
        <h3 className="font-semibold">Versions conservées</h3>
        <p className="mt-1 text-sm text-muted-foreground">Une nouvelle génération conserve les versions antérieures en lecture seule.</p>
        <div className="mt-3 flex flex-wrap gap-2">{history.map((item) => <button key={item.projectionId} type="button" disabled={item.projectionId === projection.projectionId} onClick={() => onOpenVersion(item.projectionId)} className="min-h-10 rounded-lg border px-3 text-sm disabled:bg-muted">Voir la version {item.projectionVersion}</button>)}</div>
      </section>}
    </div>
  </section>;
}
