import { useEffect, useRef, useState } from "react";
import type { DocumentArchiveClient } from "@/features/document-projection/generation-archive-client";
import type { DocumentGenerationBody, DocumentGenerationRef } from "@/features/document-projection/generation-persistence";
import { downloadStudyDeliverableFile, downloadFrozenStudyFiles } from "@/features/document-projection/study-deliverable-portfolio";
import type { StudyDeliverableFile } from "@/features/document-projection/study-deliverable-contract";
import { archivedStudioDocuments, studioDocuments, type DocumentStudioTarget } from "@/features/document-projection/studio-document";
import type { ActiveWorkingRevision } from "@/features/document-projection/working-revision";
import type { ProjectContextSnapshot } from "@/features/research-project-construction/canonical-project-backbone";
import { inspectDocumentImpact, type DocumentImpactReport } from "@/features/document-projection/document-impact";
import DocumentImpactSummary from "@/features/document-projection/DocumentImpactSummary";

/** Screen state only. One selected body in RAM, never in session. */
export default function DocumentArchiveHistory({ client, onOpen, onDownloaded, onStudio, onHistory, currentProjectDigest, currentGenerationId, currentProjectSnapshot, pendingScientificChange }: {
  client: DocumentArchiveClient; onOpen: (file: StudyDeliverableFile, title: string, body: DocumentGenerationBody) => void;
  onDownloaded?: (body: DocumentGenerationBody, file: StudyDeliverableFile) => void;
  onStudio?: (target: DocumentStudioTarget) => void;
  onHistory?: (entries: readonly DocumentGenerationRef[]) => void;
  currentProjectDigest?: string;
  currentGenerationId?: string | null;
  currentProjectSnapshot?: Readonly<ProjectContextSnapshot>;
  pendingScientificChange?: boolean;
}) {
  const [entries, setEntries] = useState<readonly DocumentGenerationRef[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [status, setStatus] = useState<"NOT_LOADED" | "LOADING" | "READY" | "FAILED">("NOT_LOADED");
  const [error, setError] = useState(false);
  const [drafts, setDrafts] = useState<readonly ActiveWorkingRevision[]>([]);
  const [draftsFailed, setDraftsFailed] = useState(false);
  const [studioSelection, setStudioSelection] = useState<{ generationId: string; documents: ReturnType<typeof studioDocuments> } | null>(null);
  const [impact, setImpact] = useState<DocumentImpactReport | null>(null);
  const selected = useRef<{ id: string; body: DocumentGenerationBody } | null>(null);
  const request = useRef(0);
  const lifetime = useRef(0);
  const historyObserver = useRef(onHistory); historyObserver.current = onHistory;
  useEffect(() => {
    const epoch = ++lifetime.current;
    selected.current = null; request.current++;
    setEntries([]); setStatus("LOADING"); setError(false); setStudioSelection(null); setDrafts([]); setDraftsFailed(false); setImpact(null);
    void client.history().then(page => {
      if (lifetime.current !== epoch) return;
      setEntries(page.entries); setCursor(page.nextBeforeOrdinal); setStatus("READY");
      historyObserver.current?.(page.entries);
    }).catch(() => { if (lifetime.current === epoch) setStatus("FAILED"); });
    void client.workingRevisions?.active?.().then(items => {
      if (lifetime.current === epoch) setDrafts(items);
    }).catch(() => { if (lifetime.current === epoch) setDraftsFailed(true); });
    return () => { lifetime.current = epoch + 1; selected.current = null; };
  }, [client, currentGenerationId]);
  const more = async () => {
    if (cursor === null || status !== "READY") return;
    const epoch = lifetime.current;
    setStatus("LOADING");
    try {
      const page = await client.history(cursor);
      if (lifetime.current !== epoch) return;
      const next = [...entries, ...page.entries];
      setEntries(next); historyObserver.current?.(next); setCursor(page.nextBeforeOrdinal); setStatus("READY");
    } catch { if (lifetime.current === epoch) setStatus("FAILED"); }
  };
  const file = async (ref: DocumentGenerationRef, index: number, download: boolean) => {
    const token = ++request.current;
    const epoch = lifetime.current;
    setError(false);
    try {
      const body = selected.current?.id === ref.generationId ? selected.current.body : (await client.body(ref.generationId)).body;
      if (request.current !== token || lifetime.current !== epoch) return;
      selected.current = { id: ref.generationId, body };
      const manifest = ref.files[index];
      const frozen = body.files.find(item => item.artifactId === manifest.artifactId && item.fileName === manifest.fileName && item.sha256 === manifest.sha256);
      if (!frozen) throw new Error("DOC_ARCHIVE_ARTIFACT_NOT_FOUND");
      if (download) { downloadStudyDeliverableFile(frozen); onDownloaded?.(body, frozen); }
      else onOpen(frozen, `Version ${ref.displayVersion} · ${frozen.fileName}`, body);
    } catch { if (request.current === token && lifetime.current === epoch) setError(true); }
  };
  const zip = async (ref: DocumentGenerationRef) => {
    const token = ++request.current, epoch = lifetime.current; setError(false);
    try {
      const body = selected.current?.id === ref.generationId ? selected.current.body : (await client.body(ref.generationId)).body;
      if (request.current !== token || lifetime.current !== epoch) return;
      selected.current = { id: ref.generationId, body };
      downloadFrozenStudyFiles(body.files, ref.generatedAt, ref.displayVersion);
    } catch { if (request.current === token && lifetime.current === epoch) setError(true); }
  };
  const selectStudioDocument = async (ref: DocumentGenerationRef) => {
    const token = ++request.current, epoch = lifetime.current; setError(false);
    try {
      const body = selected.current?.id === ref.generationId ? selected.current.body : (await client.body(ref.generationId)).body;
      if (request.current !== token || lifetime.current !== epoch) return;
      selected.current = { id: ref.generationId, body };
      setStudioSelection({ generationId: ref.generationId, documents: studioDocuments(body) });
    } catch { if (request.current === token && lifetime.current === epoch) setError(true); }
  };
  const inspectImpact = async (ref: DocumentGenerationRef) => {
    if (!currentProjectSnapshot) return;
    const token = ++request.current, epoch = lifetime.current; setError(false); setImpact(null);
    try {
      const body = selected.current?.id === ref.generationId ? selected.current.body : (await client.body(ref.generationId)).body;
      if (request.current !== token || lifetime.current !== epoch) return;
      selected.current = { id: ref.generationId, body };
      const report = await inspectDocumentImpact({ source: { ref, body }, currentProject: currentProjectSnapshot, pendingScientificChange });
      if (request.current === token && lifetime.current === epoch) setImpact(report);
    } catch { if (request.current === token && lifetime.current === epoch) setError(true); }
  };
  return <section className="border-b px-5 py-4 sm:px-6" aria-label="Versions documentaires archivées" data-testid="durable-document-history">
    <h3 className="font-semibold">Versions documentaires archivées</h3>
    {(status === "NOT_LOADED" || status === "LOADING") && <p role="status" className="mt-2 text-sm">Historique en cours de chargement…</p>}
    {status === "FAILED" && <p role="alert" className="mt-2 text-sm">Historique non chargé. Les versions archivées restent conservées.</p>}
    {status === "READY" && entries.length === 0 && <p className="mt-2 text-sm">Aucune génération documentaire archivée.</p>}
    {error && <p role="alert" className="mt-2 text-sm">La version sélectionnée n’a pas pu être vérifiée. Aucun fichier n’a été remplacé.</p>}
    {draftsFailed && <p role="status" className="mt-2 text-sm">La liste des brouillons n’a pas pu être chargée. Les brouillons enregistrés restent conservés ; Modifier dans Studio permet de les retrouver.</p>}
    <ul className="mt-3 space-y-3">{entries.map(ref => <li key={ref.generationId} className="rounded-xl border p-3" data-testid={`archived-generation-${ref.ordinal}`}>
      <p className="text-sm font-medium">Version {ref.displayVersion}</p>
      {currentProjectDigest && ref.project.projectDigest !== currentProjectDigest && <p className="mt-1 text-xs text-muted-foreground">Historique · le projet a changé depuis cette génération.</p>}
      {ref.project.projectDigest === currentProjectDigest && currentGenerationId && <p className="mt-1 text-xs text-muted-foreground">{ref.generationId === currentGenerationId ? "Version actuelle" : "Historique · une version plus récente est disponible."}</p>}
      <p className="mt-1 text-xs text-muted-foreground"><time dateTime={ref.generatedAt}>{new Date(ref.generatedAt).toLocaleString("fr-FR")}</time></p>
      <details className="mt-1 text-xs text-muted-foreground"><summary className="cursor-pointer">Références de cette génération</summary>
        <dl className="mt-1 break-all"><dt>Génération</dt><dd>{ref.generationId}</dd><dt>Version Project</dt><dd>{ref.project.projectVersion}</dd><dt>Empreinte Project</dt><dd>{ref.project.projectDigest}</dd></dl>
      </details>
      {currentProjectSnapshot && <button type="button" className="mt-2 min-h-11 rounded-lg border px-3 text-sm"
        aria-label={`Vérifier l’impact sur Version ${ref.displayVersion}`} onClick={() => void inspectImpact(ref)}>Vérifier la cohérence avec le projet</button>}
      {impact?.generationId === ref.generationId && impact.currentProjectDigest === currentProjectDigest && <div className="mt-3"><DocumentImpactSummary report={{ ...impact, pendingScientificChange: Boolean(pendingScientificChange) }} /></div>}
      {onStudio && client.workingRevisions && <div className="mt-3">
        {archivedStudioDocuments(ref).length === 0 && <button type="button" className="min-h-11 rounded-lg border px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring" onClick={() => void selectStudioDocument(ref)}>Afficher les documents</button>}
        <ul className="space-y-2">{(studioSelection?.generationId === ref.generationId ? studioSelection.documents : archivedStudioDocuments(ref)).map(document => {
          const draft = drafts.find(item => item.baseGenerationId === ref.generationId && item.baseGenerationBodyDigest === ref.bodySha256 && item.nativeDocumentRef === document.nativeDocumentRef);
          const target = { generation: ref, nativeDocumentRef: document.nativeDocumentRef, ...(draft ? { activeRevisionId: draft.revisionId } : {}) };
          return <li key={document.nativeDocumentRef} className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/30 p-3">
            <div className="min-w-0"><h4 className="break-words text-sm font-medium">{document.title}</h4>
              {draft && <p className="mt-1 text-xs text-muted-foreground">Brouillon enregistré · non intégré à une version</p>}</div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="min-h-11 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Modifier dans Studio Version ${ref.displayVersion} · ${document.title}`}
                onClick={() => onStudio({ ...target, initialMode: "EDIT" })}>Modifier dans Studio</button>
              <button type="button" className="min-h-11 rounded-lg border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Consulter Version ${ref.displayVersion} · ${document.title}`}
                onClick={() => onStudio({ ...target, initialMode: "READ" })}>Consulter</button>
            </div>
          </li>;
        })}</ul>
      </div>}
      <details className="mt-3"><summary className="cursor-pointer text-sm">Télécharger ou consulter les fichiers archivés</summary>
      <button type="button" className="mt-2 min-h-10 rounded-lg border px-3 text-xs" data-testid={`download-generation-${ref.ordinal}`} onClick={() => void zip(ref)}>Exporter la version (.zip)</button>
      <div className="mt-2 flex flex-wrap gap-2">{ref.files.map((manifest, index) => <span key={`${manifest.artifactId}:${manifest.fileName}`} className="inline-flex gap-1">
        <button type="button" className="min-h-10 rounded-lg border px-3 text-xs" onClick={() => void file(ref, index, false)}>Ouvrir {manifest.fileName}</button>
        <button type="button" className="min-h-10 rounded-lg border px-3 text-xs" aria-label={`Télécharger Version ${ref.displayVersion} ${manifest.fileName}`} onClick={() => void file(ref, index, true)}>Télécharger</button>
      </span>)}</div></details>
    </li>)}</ul>
    {cursor !== null && <button type="button" className="mt-3 min-h-10 rounded-lg border px-3 text-sm" disabled={status !== "READY"} onClick={() => void more()}>Versions précédentes</button>}
  </section>;
}
