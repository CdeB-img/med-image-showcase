import { useEffect, useRef, useState } from "react";
import type { DocumentArchiveClient } from "@/features/document-projection/generation-archive-client";
import type { DocumentGenerationBody, DocumentGenerationRef } from "@/features/document-projection/generation-persistence";
import { downloadStudyDeliverableFile } from "@/features/document-projection/study-deliverable-portfolio";
import type { StudyDeliverableFile } from "@/features/document-projection/study-deliverable-contract";

/** Screen state only. One selected body in RAM, never in session. */
export default function DocumentArchiveHistory({ client, onOpen }: {
  client: DocumentArchiveClient; onOpen: (file: StudyDeliverableFile, title: string) => void;
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
  }, [client]);
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
      if (download) downloadStudyDeliverableFile(frozen);
      else onOpen(frozen, `Documents V${ref.displayVersion} · ${frozen.fileName}`);
    } catch { if (request.current === token && lifetime.current === epoch) setError(true); }
  };
  return <section className="border-b px-5 py-4 sm:px-6" aria-label="Versions documentaires archivées" data-testid="durable-document-history">
    <h3 className="font-semibold">Versions documentaires archivées</h3>
    {(status === "NOT_LOADED" || status === "LOADING") && <p role="status" className="mt-2 text-sm">Historique en cours de chargement…</p>}
    {status === "FAILED" && <p role="alert" className="mt-2 text-sm">Historique non chargé. Les versions archivées restent conservées.</p>}
    {status === "READY" && entries.length === 0 && <p className="mt-2 text-sm">Aucune génération documentaire archivée.</p>}
    {error && <p role="alert" className="mt-2 text-sm">La version sélectionnée n’a pas pu être vérifiée. Aucun fichier n’a été remplacé.</p>}
    <ul className="mt-3 space-y-3">{entries.map(ref => <li key={ref.generationId} className="rounded-xl border p-3" data-testid={`archived-generation-${ref.ordinal}`}>
      <p className="text-sm font-medium">{ref.family === "DRCI" ? "Dossier" : "Projection"} V{ref.displayVersion} · projet version {ref.project.projectVersion.split(":").at(-1)}</p>
      <p className="mt-1 text-xs text-muted-foreground">{new Date(ref.generatedAt).toLocaleString("fr-FR")}</p>
      <div className="mt-2 flex flex-wrap gap-2">{ref.files.map((manifest, index) => <span key={`${manifest.artifactId}:${manifest.fileName}`} className="inline-flex gap-1">
        <button type="button" className="min-h-10 rounded-lg border px-3 text-xs" onClick={() => void file(ref, index, false)}>Ouvrir {manifest.fileName}</button>
        <button type="button" className="min-h-10 rounded-lg border px-3 text-xs" aria-label={`Télécharger V${ref.displayVersion} ${manifest.fileName}`} onClick={() => void file(ref, index, true)}>Télécharger</button>
      </span>)}</div>
    </li>)}</ul>
    {cursor !== null && <button type="button" className="mt-3 min-h-10 rounded-lg border px-3 text-sm" disabled={status !== "READY"} onClick={() => void more()}>Versions précédentes</button>}
  </section>;
}
