import { useEffect, useRef, useState } from "react";
import type { DocumentArchiveClient } from "@/features/document-projection/generation-archive-client";
import type { DocumentGenerationBody, DocumentGenerationRef } from "@/features/document-projection/generation-persistence";
import { downloadStudyDeliverableFile, downloadFrozenStudyFiles } from "@/features/document-projection/study-deliverable-portfolio";
import type { StudyDeliverableFile } from "@/features/document-projection/study-deliverable-contract";

/** Screen state only. One selected body in RAM, never in session. */
export default function DocumentArchiveHistory({ client, onOpen, onDownloaded, currentProjectDigest, currentGenerationId }: {
  client: DocumentArchiveClient; onOpen: (file: StudyDeliverableFile, title: string, body: DocumentGenerationBody) => void;
  onDownloaded?: (body: DocumentGenerationBody, file: StudyDeliverableFile) => void;
  currentProjectDigest?: string;
  currentGenerationId?: string | null;
}) {
  const [entries, setEntries] = useState<readonly DocumentGenerationRef[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [status, setStatus] = useState<"NOT_LOADED" | "LOADING" | "READY" | "FAILED">("NOT_LOADED");
  const [error, setError] = useState(false);
  const selected = useRef<{ id: string; body: DocumentGenerationBody } | null>(null);
  const request = useRef(0);
  const lifetime = useRef(0);
  useEffect(() => {
    const epoch = ++lifetime.current;
    selected.current = null; request.current++;
    setEntries([]); setStatus("LOADING"); setError(false);
    void client.history().then(page => {
      if (lifetime.current !== epoch) return;
      setEntries(page.entries); setCursor(page.nextBeforeOrdinal); setStatus("READY");
    }).catch(() => { if (lifetime.current === epoch) setStatus("FAILED"); });
    return () => { lifetime.current = epoch + 1; selected.current = null; };
  }, [client, currentGenerationId]);
  const more = async () => {
    if (cursor === null || status !== "READY") return;
    const epoch = lifetime.current;
    setStatus("LOADING");
    try {
      const page = await client.history(cursor);
      if (lifetime.current !== epoch) return;
      setEntries(current => [...current, ...page.entries]); setCursor(page.nextBeforeOrdinal); setStatus("READY");
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
      else onOpen(frozen, `G${ref.displayVersion} · ${frozen.fileName}`, body);
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
  return <section className="border-b px-5 py-4 sm:px-6" aria-label="Générations documentaires archivées" data-testid="durable-document-history">
    <h3 className="font-semibold">Générations documentaires archivées</h3>
    {(status === "NOT_LOADED" || status === "LOADING") && <p role="status" className="mt-2 text-sm">Historique en cours de chargement…</p>}
    {status === "FAILED" && <p role="alert" className="mt-2 text-sm">Historique non chargé. Les versions archivées restent conservées.</p>}
    {status === "READY" && entries.length === 0 && <p className="mt-2 text-sm">Aucune génération documentaire archivée.</p>}
    {error && <p role="alert" className="mt-2 text-sm">La version sélectionnée n’a pas pu être vérifiée. Aucun fichier n’a été remplacé.</p>}
    <ul className="mt-3 space-y-3">{entries.map(ref => <li key={ref.generationId} className="rounded-xl border p-3" data-testid={`archived-generation-${ref.ordinal}`}>
      <p className="text-sm font-medium">G{ref.displayVersion} — basée sur le projet V{ref.project.projectVersion.split(":").at(-1)}</p>
      {currentProjectDigest && ref.project.projectDigest !== currentProjectDigest && <p className="mt-1 text-xs text-muted-foreground">Historique · le projet a changé depuis cette génération.</p>}
      <p className="mt-1 text-xs text-muted-foreground"><time dateTime={ref.generatedAt}>{new Date(ref.generatedAt).toLocaleString("fr-FR")}</time></p>
      <details className="mt-1 text-xs text-muted-foreground"><summary className="cursor-pointer">Références de cette génération</summary>
        <dl className="mt-1 break-all"><dt>Génération</dt><dd>{ref.generationId}</dd><dt>Version Project</dt><dd>{ref.project.projectVersion}</dd><dt>Empreinte Project</dt><dd>{ref.project.projectDigest}</dd></dl>
      </details>
      <button type="button" className="mt-2 min-h-10 rounded-lg border px-3 text-xs" data-testid={`download-generation-${ref.ordinal}`} onClick={() => void zip(ref)}>Exporter la génération (.zip)</button>
      <div className="mt-2 flex flex-wrap gap-2">{ref.files.map((manifest, index) => <span key={`${manifest.artifactId}:${manifest.fileName}`} className="inline-flex gap-1">
        <button type="button" className="min-h-10 rounded-lg border px-3 text-xs" onClick={() => void file(ref, index, false)}>Ouvrir {manifest.fileName}</button>
        <button type="button" className="min-h-10 rounded-lg border px-3 text-xs" aria-label={`Télécharger G${ref.displayVersion} ${manifest.fileName}`} onClick={() => void file(ref, index, true)}>Télécharger</button>
      </span>)}</div>
    </li>)}</ul>
    {cursor !== null && <button type="button" className="mt-3 min-h-10 rounded-lg border px-3 text-sm" disabled={status !== "READY"} onClick={() => void more()}>Versions précédentes</button>}
  </section>;
}
