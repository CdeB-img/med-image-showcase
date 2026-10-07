import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Columns2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { stableStringify } from "../knowledge-engine/canonical";
import type { DocumentArchiveClient } from "./generation-archive-client";
import type { DocumentGenerationBody } from "./generation-persistence";
import { editableArchivedDocument, type DocumentWorkingRevisionResult, type EditableDocumentContent } from "./working-revision";
import { hasProtectedTextBinding, studioBoundText, type DocumentStudioTarget } from "./studio-document";

type SaveState = "CLEAN" | "DIRTY" | "SAVING" | "SAVE_FAILED" | "CONFLICT";
const labels: Record<SaveState, string> = { CLEAN: "Enregistré", DIRTY: "Modifications non enregistrées",
  SAVING: "Enregistrement…", SAVE_FAILED: "Échec de l’enregistrement", CONFLICT: "Conflit de sauvegarde" };
const codeOf = (error: unknown) => error && typeof error === "object" && "code" in error ? error.code : null;

/** Native text editing only. Buffers are screen-owned; confirmed saves, source
 * integrity, ACTIVE lookup and concurrency belong to the existing DOC owner. */
export default function DocumentStudio({ client, target, onClose }: {
  client: DocumentArchiveClient; target: DocumentStudioTarget; onClose: () => void;
}) {
  const [loaded, setLoaded] = useState<{ result: DocumentWorkingRevisionResult; base: EditableDocumentContent; body: DocumentGenerationBody } | null>(null);
  const [buffer, setBuffer] = useState<EditableDocumentContent | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("CLEAN");
  const [loadFailed, setLoadFailed] = useState(false);
  const [compare, setCompare] = useState(false);
  const [dialog, setDialog] = useState<"LEAVE" | "ABANDON" | "RELOAD" | null>(null);
  const [actionFailed, setActionFailed] = useState(false);
  const epoch = useRef(0), flight = useRef(false);
  const dirty = Boolean(loaded && buffer && stableStringify(buffer) !== stableStringify(loaded.result.revision.content));
  const busy = saveState === "SAVING";
  const generation = target.generation;
  useEffect(() => {
    const token = ++epoch.current; flight.current = false;
    setLoaded(null); setBuffer(null); setLoadFailed(false); setSaveState("CLEAN");
    void (async () => {
      if (!client.workingRevisions) throw new Error("DOC_REVISION_UNAVAILABLE");
      const source = await client.body(generation.generationId);
      if (source.ref.bodySha256 !== generation.bodySha256) throw new Error("DOC_REVISION_SOURCE_DIGEST_MISMATCH");
      const projection = source.body.native.family === "DRCI" ? await client.body(source.body.native.value.protocolProjectionId) : undefined;
      const native = editableArchivedDocument(source, target.nativeDocumentRef, projection);
      const result = await client.workingRevisions.open({ baseGenerationId: generation.generationId,
        baseGenerationBodyDigest: generation.bodySha256, nativeDocumentRef: target.nativeDocumentRef });
      if (result.revision.logicalDocumentRef !== native.logicalDocumentRef) throw new Error("DOC_REVISION_LOGICAL_SOURCE_INVALID");
      if (epoch.current !== token) return;
      setLoaded({ result, base: native.content, body: source.body }); setBuffer(structuredClone(result.revision.content));
    })().catch(() => { if (epoch.current === token) setLoadFailed(true); });
    return () => { epoch.current = token + 1; };
  }, [client, generation.generationId, generation.bodySha256, target.nativeDocumentRef]);
  useEffect(() => {
    if (!dirty && !busy) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, busy]);
  const edit = (change: (content: EditableDocumentContent) => void) => {
    if (!buffer || !loaded || flight.current) return;
    const next = structuredClone(buffer); change(next); setBuffer(next); setActionFailed(false);
    if (saveState !== "CONFLICT" && saveState !== "SAVE_FAILED") setSaveState(stableStringify(next) === stableStringify(loaded.result.revision.content) ? "CLEAN" : "DIRTY");
  };
  const save = async () => {
    if (!loaded || !buffer || !client.workingRevisions || flight.current || saveState === "CONFLICT") return;
    const token = epoch.current; flight.current = true; setSaveState("SAVING"); setActionFailed(false);
    try {
      const result = await client.workingRevisions.save({ revisionId: loaded.result.revision.revisionId,
        expectedSaveSequence: loaded.result.revision.saveSequence, content: buffer });
      if (epoch.current !== token) return;
      setLoaded({ ...loaded, result }); setBuffer(structuredClone(result.revision.content)); setSaveState("CLEAN");
    } catch (error) {
      if (epoch.current === token) setSaveState(codeOf(error) === "DOC_REVISION_SAVE_CONFLICT" || codeOf(error) === "DOC_REVISION_ABANDONED" ? "CONFLICT" : "SAVE_FAILED");
    } finally { if (epoch.current === token) flight.current = false; }
  };
  const confirmAction = async () => {
    const action = dialog; setDialog(null);
    if (action === "LEAVE") { onClose(); return; }
    if (!loaded || !client.workingRevisions || flight.current) return;
    const token = epoch.current; flight.current = true; setActionFailed(false); setSaveState("SAVING");
    try {
      const revision = loaded.result.revision;
      if (action === "ABANDON") {
        await client.workingRevisions.abandon({ revisionId: revision.revisionId, expectedSaveSequence: revision.saveSequence });
        if (epoch.current === token) onClose();
      } else {
        const result = await client.workingRevisions.get(revision.revisionId);
        if (epoch.current !== token) return;
        if (result.revision.status === "ABANDONED") { onClose(); return; }
        setLoaded({ ...loaded, result }); setBuffer(structuredClone(result.revision.content)); setSaveState("CLEAN");
      }
    } catch (error) {
      if (epoch.current === token) {
        setActionFailed(true);
        setSaveState(codeOf(error) === "DOC_REVISION_SAVE_CONFLICT" ? "CONFLICT" : "SAVE_FAILED");
      }
    } finally { if (epoch.current === token) flight.current = false; }
  };
  const close = () => { if (dirty) setDialog("LEAVE"); else if (!busy) onClose(); };
  const display = (value: string) => loaded ? studioBoundText(value, loaded.body) : value;
  const textField = (value: string, original: string, label: string, change: (content: EditableDocumentContent, value: string) => void, heading = false) =>
    hasProtectedTextBinding(original) ? <div className="rounded-lg bg-muted/40 p-3">
      <p className="whitespace-pre-wrap break-words leading-7">{display(value)}</p>
      <p className="mt-2 text-xs text-muted-foreground">Lecture seule · références natives protégées</p>
    </div> : <StudioText value={value} label={label} heading={heading} disabled={busy} onChange={value => edit(content => change(content, value))} />;
  const pair = (before: string, after: string, label: string) => {
    const kind = before === after ? "Inchangé" : !before ? "Ajouté" : !after ? "Retiré" : "Modifié";
    return <article className="mb-4 rounded-xl border p-4" key={label}>
      <h4 className="mb-3 text-sm font-semibold">{label} · {kind}</h4>
      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <div className="min-w-0"><p className="mb-2 text-xs font-medium text-muted-foreground">Base G{generation.displayVersion}</p><p className="whitespace-pre-wrap break-words text-sm leading-7">{display(before) || "Texte vide"}</p></div>
        <div className="min-w-0 border-l-2 border-primary/30 pl-4"><p className="mb-2 text-xs font-medium text-muted-foreground">Brouillon actuel</p><p className="whitespace-pre-wrap break-words text-sm leading-7">{display(after) || "Texte vide"}</p></div>
      </div>
    </article>;
  };
  return <section className="min-w-0 overflow-hidden rounded-2xl border bg-background shadow-sm" aria-label="Document Studio" data-testid="document-studio">
    <header className="border-b p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={close} disabled={busy}><ArrowLeft />Retour aux documents</Button>
        <span role="status" aria-live="polite" data-testid="studio-save-status" className="text-sm">{loaded ? labels[saveState] : loadFailed ? "Studio indisponible" : "Ouverture du brouillon…"}</span>
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-primary">Document Studio · brouillon</p>
      <h2 className="mt-2 break-words text-xl font-semibold">{loaded?.base.title ?? "Document archivé"}</h2>
      <p className="mt-1 text-sm text-muted-foreground">Basé sur G{generation.displayVersion} · Projet V{generation.project.projectVersion.split(":").at(-1)}</p>
      <p className="mt-3 max-w-3xl text-sm text-muted-foreground">Les modifications ne sont pas évaluées scientifiquement. Enregistrer ce brouillon ne modifie ni le projet ni les générations archivées.</p>
      {loaded?.result.baseState.stale && <p role="status" className="mt-3 rounded-lg border bg-amber-50 p-3 text-sm text-amber-950">Ce brouillon est basé sur une génération ou un état du projet antérieur. Sa source reste inchangée ; aucun rebasage automatique.</p>}
      {loaded && <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setCompare(!compare)} aria-pressed={compare}><Columns2 />{compare ? "Revenir à l’édition" : "Comparer à la base"}</Button>
        <Button variant="ghost" onClick={() => setDialog("ABANDON")} disabled={busy}><Trash2 />Abandonner le brouillon</Button>
      </div>}
    </header>
    {loadFailed && <p role="alert" className="p-6">Le document ou son brouillon n’a pas pu être vérifié. Les versions archivées sont conservées. Revenez aux documents pour réessayer.</p>}
    {(saveState === "SAVE_FAILED" || saveState === "CONFLICT") && <aside role="alert" className="m-5 rounded-xl border bg-amber-50 p-4 text-sm text-amber-950">
      <p>{saveState === "CONFLICT" ? "Ce brouillon a été modifié ou abandonné ailleurs. Vos modifications locales sont conservées ; rechargez la dernière version avant de poursuivre."
        : actionFailed ? "L’action n’a pas abouti. Votre texte local est conservé ; aucune sauvegarde n’est confirmée."
          : "La sauvegarde n’a pas pu être confirmée. Vos modifications locales sont conservées."}</p>
      <Button variant="outline" className="mt-3" onClick={() => setDialog("RELOAD")}>Recharger la version enregistrée</Button>
    </aside>}
    {loaded && buffer && <main className="bg-muted/20 p-4 sm:p-8">
      <div className="mx-auto min-w-0 max-w-4xl rounded-xl border bg-background p-5 shadow-sm sm:p-8">
        {compare ? <section aria-label="Comparaison du brouillon avec sa base">
          <h3 className="mb-5 text-lg font-semibold">Comparaison · base G{generation.displayVersion} / brouillon</h3>
          {pair(loaded.base.title, buffer.title, "Titre du document")}
          {buffer.sections.map((section, index) => <section key={section.nodeId}>
            {pair(loaded.base.sections[index].title, section.title, `Titre de la section ${index + 1}`)}
            {section.blocks.map((block, blockIndex) => pair(loaded.base.sections[index].blocks[blockIndex].text, block.text, `Section ${index + 1} · paragraphe ${blockIndex + 1}`))}
          </section>)}
        </section> : <div className="space-y-8">
          {textField(buffer.title, loaded.base.title, "Titre du document", (content, value) => { content.title = value; }, true)}
          {buffer.sections.map((section, index) => <section key={section.nodeId} className="space-y-4" aria-label={`Section ${index + 1}`}>
            {textField(section.title, loaded.base.sections[index].title, `Titre de la section ${index + 1}`, (content, value) => { content.sections[index].title = value; }, true)}
            {section.blocks.map((block, blockIndex) => <div key={block.nodeId}>
              {textField(block.text, loaded.base.sections[index].blocks[blockIndex].text, `Section ${index + 1} · paragraphe ${blockIndex + 1}`, (content, value) => { content.sections[index].blocks[blockIndex].text = value; })}
            </div>)}
            {section.provenanceRefs.length > 0 && <details className="text-xs text-muted-foreground"><summary className="cursor-pointer">Références natives conservées (lecture seule)</summary><ul className="mt-2 space-y-1 break-all">{section.provenanceRefs.map(ref => <li key={ref}>{ref}</li>)}</ul></details>}
          </section>)}
        </div>}
        <StudioProtectedContent body={loaded.body} documentRef={target.nativeDocumentRef} />
      </div>
    </main>}
    {loaded && <footer className="flex flex-wrap items-center justify-between gap-3 border-t p-5 sm:px-6">
      <p className="text-xs text-muted-foreground">Sauvegarde explicite uniquement · état {loaded.result.revision.saveSequence}</p>
      <Button onClick={() => void save()} disabled={busy || saveState === "CONFLICT"}><Save />Enregistrer</Button>
    </footer>}
    <AlertDialog open={dialog !== null} onOpenChange={open => { if (!open) setDialog(null); }}>
      <AlertDialogContent>
        <AlertDialogTitle>{dialog === "ABANDON" ? "Abandonner ce brouillon ?" : dialog === "RELOAD" ? "Recharger la version enregistrée ?" : "Quitter sans enregistrer ?"}</AlertDialogTitle>
        <AlertDialogDescription>{dialog === "ABANDON" ? "Le brouillon sera abandonné, sans effacer son historique. Le projet et les générations archivées restent intacts."
          : dialog === "RELOAD" ? "Le texte local sera remplacé par la dernière sauvegarde confirmée. Aucune fusion automatique."
            : "Les modifications locales non enregistrées seront perdues. La dernière sauvegarde et les documents archivés restent conservés."}</AlertDialogDescription>
        <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => void confirmAction()}>
          {dialog === "ABANDON" ? "Confirmer l’abandon" : dialog === "RELOAD" ? "Confirmer le rechargement" : "Quitter sans enregistrer"}
        </AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </section>;
}

function StudioText({ value, label, heading, disabled, onChange }: { value: string; label: string; heading?: boolean; disabled: boolean; onChange: (value: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (ref.current) { ref.current.style.height = "auto"; ref.current.style.height = `${ref.current.scrollHeight}px`; } }, [value]);
  return <textarea ref={ref} aria-label={label} value={value} rows={heading ? 1 : 3} disabled={disabled} spellCheck
    onChange={event => onChange(event.target.value)}
    className={`block w-full min-w-0 resize-y rounded-md border border-transparent bg-transparent p-2 leading-7 hover:border-input focus-visible:border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70 ${heading ? "text-xl font-semibold" : "text-base"}`} />;
}

function StudioProtectedContent({ body, documentRef }: { body: DocumentGenerationBody; documentRef: string }) {
  const native = body.native;
  const notices = native.family === "DRCI" ? native.value.documents.find(document => document.kind === documentRef)?.missingElements ?? []
    : native.value.sections.flatMap(section => [...section.unknowns, ...section.limitations, ...section.contradictions, ...section.conflicts]);
  const rows = native.family === "DRCI" && documentRef === "CRF" ? native.value.crfRows : [];
  const sources = native.value.evidenceContent?.sources ?? [];
  return <aside className="mt-8 space-y-4 border-t pt-5 text-sm" aria-label="Contenu natif protégé">
    <p className="text-xs text-muted-foreground">Structures, références et provenance conservées dans la base native · non modifiables dans Studio V1.</p>
    {notices.length > 0 && <div><h3 className="font-medium">Éléments ouverts et réserves · lecture seule</h3><ul className="mt-2 list-disc space-y-2 pl-5">{notices.map((text, index) => <li key={index} className="whitespace-pre-wrap break-words">{text}</li>)}</ul></div>}
    {rows.length > 0 && <details><summary className="cursor-pointer font-medium">Spécifications de collecte · lecture seule</summary>
      {rows.map(row => <dl key={row.variableRef} className="mt-3 grid min-w-0 gap-1 rounded-lg border p-3">{Object.entries(row).map(([field, value]) => <div key={field} className="min-w-0 break-words"><dt className="text-xs font-medium text-muted-foreground">{field}</dt><dd>{Array.isArray(value) ? value.join(" · ") : value ?? "Non défini"}</dd></div>)}</dl>)}
    </details>}
    {sources.length > 0 && <details><summary className="cursor-pointer font-medium">Sources bibliographiques · lecture seule</summary><ul className="mt-2 space-y-2">{sources.map(source => <li key={source.source.sourceId} className="break-words">{source.source.title}</li>)}</ul></details>}
  </aside>;
}
