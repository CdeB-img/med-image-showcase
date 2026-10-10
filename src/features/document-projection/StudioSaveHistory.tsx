import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { DocumentWorkingRevision, DocumentWorkingRevisionClient, EditableDocumentContent, WorkingRevisionSaveRef } from "./working-revision";

/** Metadata first, one verified historical save on explicit selection. DOC owns
 * access and integrity; the screen never maintains a parallel durable history. */
export default function StudioSaveHistory({ client, revision, disabled, onRestore }: {
  client: DocumentWorkingRevisionClient; revision: DocumentWorkingRevision; disabled: boolean;
  onRestore: (save: { sequence: number; content: EditableDocumentContent }) => void;
}) {
  const [saves, setSaves] = useState<readonly WorkingRevisionSaveRef[] | null>(null);
  const [busy, setBusy] = useState(false), [failed, setFailed] = useState(false);
  const flight = useRef(false);
  const mounted = useRef(true);
  const unavailable = useRef(disabled);
  unavailable.current = disabled;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const load = async () => {
    if (disabled || flight.current || !client.history) return;
    flight.current = true; setBusy(true); setFailed(false);
    try { const result = await client.history(revision.revisionId); if (mounted.current) setSaves(result); }
    catch { if (mounted.current) setFailed(true); }
    finally { flight.current = false; if (mounted.current) setBusy(false); }
  };
  const restore = async (save: WorkingRevisionSaveRef) => {
    if (disabled || flight.current || !client.getSave) return;
    flight.current = true; setBusy(true); setFailed(false);
    try {
      const { revision: original } = await client.getSave({ revisionId: save.revisionId,
        saveSequence: save.saveSequence, contentDigest: save.contentDigest });
      if (original.revisionId !== revision.revisionId || original.baseGenerationId !== revision.baseGenerationId
        || original.baseGenerationBodyDigest !== revision.baseGenerationBodyDigest || original.logicalDocumentRef !== revision.logicalDocumentRef
        || original.project.projectId !== revision.project.projectId || original.project.projectVersion !== revision.project.projectVersion
        || original.project.projectDigest !== revision.project.projectDigest || original.saveSequence !== save.saveSequence
        || original.contentDigest !== save.contentDigest)
        throw new Error("DOC_REVISION_SOURCE_BINDING_INVALID");
      if (mounted.current && !unavailable.current) onRestore({ sequence: save.saveSequence, content: structuredClone(original.content) });
    } catch { if (mounted.current) setFailed(true); }
    finally { flight.current = false; if (mounted.current) setBusy(false); }
  };
  if (!client.history || !client.getSave) return null;
  return <section aria-label="Historique des sauvegardes du document" className="w-full min-w-0">
    <Button variant="ghost" disabled={disabled || busy} onClick={() => void load()}>Historique des sauvegardes</Button>
    {busy && <p role="status" className="text-sm">Vérification de la sauvegarde…</p>}
    {failed && <p role="alert" className="text-sm text-destructive">La sauvegarde n’a pas pu être vérifiée. Votre texte reste inchangé.</p>}
    {saves && <><p className="mt-2 text-xs text-muted-foreground">Les 50 dernières sauvegardes confirmées. Restaurer prépare une modification à enregistrer ; aucune ancienne sauvegarde n’est écrasée.</p>
      <ul className="mt-2 max-h-64 overflow-y-auto">{saves.map(save => <li key={save.saveSequence} className="flex flex-wrap items-center justify-between gap-2 border-t py-2 text-sm">
        <span>Sauvegarde {save.saveSequence} · <time dateTime={save.updatedAt}>{new Date(save.updatedAt).toLocaleString("fr-FR")}</time></span>
        <Button size="sm" variant="outline" disabled={disabled || busy || save.saveSequence === revision.saveSequence}
          onClick={() => void restore(save)}>Restaurer la sauvegarde {save.saveSequence}</Button>
      </li>)}</ul></>}
  </section>;
}
