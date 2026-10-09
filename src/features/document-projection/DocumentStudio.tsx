import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { stableStringify } from "../knowledge-engine/canonical";
import type { DocumentArchiveClient } from "./generation-archive-client";
import type { DocumentGenerationBody } from "./generation-persistence";
import { editableArchivedDocument, type DocumentWorkingRevisionResult, type EditableDocumentContent } from "./working-revision";
import { hasProtectedTextBinding, studioBoundText, type DocumentStudioTarget } from "./studio-document";
import type { StudioFinalizationRuntime, StudioFinalizationStage } from "../protocol-designer/functional-reset/studio-finalization-runtime";
import type { StudioFinalizationIntent } from "./studio-finalization-intent";
import type { QuestionPresentationRequest } from "../query-navigation/lifecycle-contracts";
import { studioFinalizationQuestion } from "../query-navigation/studio-finalization-navigation";
import { toast } from "@/hooks/use-toast";
import { readStudioAssessmentFailureDiagnostic, type StudioAssessmentFailureDiagnostic } from "../scientific-thinking/studio-runtime";
import StudioEditAssistant from "./StudioEditAssistant";
import type { StudioEditRuntime } from "../protocol-designer/studio-edit-client";
import type { ProjectContextSnapshot } from "../research-project-construction/canonical-project-backbone";
import { inspectDocumentImpact, type DocumentImpactReport } from "./document-impact";
import DocumentImpactSummary from "./DocumentImpactSummary";

type SaveState = "CLEAN" | "DIRTY" | "SAVING" | "SAVE_FAILED" | "CONFLICT";
const labels: Record<SaveState, string> = { CLEAN: "Enregistré", DIRTY: "Modifications non enregistrées",
  SAVING: "Enregistrement…", SAVE_FAILED: "Échec de l’enregistrement", CONFLICT: "Conflit de sauvegarde" };
const codeOf = (error: unknown) => {
  const candidate = error && typeof error === "object" && "code" in error ? error.code : error instanceof Error ? error.message : null;
  return typeof candidate === "string" && /^[A-Z][A-Z0-9_]{0,119}$/u.test(candidate) ? candidate : null;
};

/** Native text editing only. Buffers are screen-owned; confirmed saves, source
 * integrity, ACTIVE lookup and concurrency belong to the existing DOC owner. */
export default function DocumentStudio({ client, target, finalization, editing, currentProjectSnapshot, pendingScientificChange, onClose, onConversation, onNavigationLock }: {
  client: DocumentArchiveClient; target: DocumentStudioTarget; finalization?: StudioFinalizationRuntime; onClose: () => void; onConversation?: () => void;
  onNavigationLock?: (locked: boolean) => void;
  editing?: StudioEditRuntime;
  currentProjectSnapshot?: Readonly<ProjectContextSnapshot>;
  pendingScientificChange?: boolean;
}) {
  const [loaded, setLoaded] = useState<{ result: DocumentWorkingRevisionResult | null; base: EditableDocumentContent; body: DocumentGenerationBody } | null>(null);
  const [buffer, setBuffer] = useState<EditableDocumentContent | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("CLEAN");
  const [loadFailed, setLoadFailed] = useState(false);
  const [mode, setMode] = useState<"READ" | "EDIT" | "COMPARE">(target.initialMode === "READ" ? "READ" : "EDIT");
  const [editingRequested, setEditingRequested] = useState(target.initialMode !== "READ");
  const [dialog, setDialog] = useState<"LEAVE" | "ABANDON" | "RELOAD" | null>(null);
  const [actionFailed, setActionFailed] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [stage, setStage] = useState<StudioFinalizationStage | null>(null);
  const [finalizationMessage, setFinalizationMessage] = useState<string | null>(null);
  const [finalizationFailure, setFinalizationFailure] = useState<{
    code: string | null; diagnostic: StudioAssessmentFailureDiagnostic | null;
  } | null>(null);
  const [completed, setCompleted] = useState(false);
  const [recoverableIntent, setRecoverableIntent] = useState(false);
  const [clarification, setClarification] = useState<QuestionPresentationRequest | null>(null);
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [impact, setImpact] = useState<DocumentImpactReport | null>(null);
  const runtimeRef = useRef(finalization); runtimeRef.current = finalization;
  const clientRef = useRef(client); clientRef.current = client;
  const epoch = useRef(0), flight = useRef(false);
  const dirty = Boolean(loaded?.result && buffer && stableStringify(buffer) !== stableStringify(loaded.result.revision.content));
  const busy = saveState === "SAVING" || finalizing;
  const unassessedDraft = Boolean(loaded?.result && buffer && stableStringify(buffer) !== stableStringify(loaded.base));
  useEffect(() => {
    let active = true; setImpact(null);
    if (loaded && currentProjectSnapshot) void inspectDocumentImpact({ source: { ref: target.generation, body: loaded.body }, currentProject: currentProjectSnapshot,
      pendingScientificChange, unassessedDraft }).then(report => { if (active) setImpact(report); }).catch(() => { /* No readiness claim on incomplete evidence. */ });
    return () => { active = false; };
  }, [loaded, currentProjectSnapshot, target.generation, pendingScientificChange, unassessedDraft]);
  useEffect(() => { onNavigationLock?.(dirty || busy); return () => onNavigationLock?.(false); }, [dirty, busy, onNavigationLock]);
  const reportFinalizationFailure = (error: unknown) => {
    const code = codeOf(error);
    setRecoverableIntent(true);
    if (code === "STUDIO_INTENT_PREPARATION_IN_PROGRESS") {
      setFinalizationFailure(null);
      setFinalizationMessage("La préparation est déjà en cours. Le brouillon est conservé ; aucun nouvel appel n’a été lancé.");
      return;
    }
    const diagnostic = error && typeof error === "object" && "studioAssessmentFailureDiagnostic" in error
      ? readStudioAssessmentFailureDiagnostic(error.studioAssessmentFailureDiagnostic) : null;
    // Bounded internal details are retained separately, never rendered as
    // Standard feedback and never copied from scientific/provider prose.
    setFinalizationFailure({ code, diagnostic });
    setClarification(null);
    setFinalizationMessage(null);
    toast({ variant: "destructive", title: "La création de la version n’a pas abouti.",
      description: "Votre brouillon et les versions précédentes sont conservés. Vous pouvez reprendre cette opération." });
  };
  const finish = (intent: StudioFinalizationIntent | null) => {
    if (!intent) return;
    setRecoverableIntent(intent.state !== "CLOSED");
    const question = runtimeRef.current?.clarification?.(intent) ?? studioFinalizationQuestion(intent);
    setClarification(question);
    if (intent.state === "BLOCKED" && !question) setFinalizationFailure({
      code: codeOf(new Error(intent.resolution.reason ?? "STUDIO_INTENT_BLOCKED")), diagnostic: null });
    if (intent.resolution.documentReceipt) {
      setFinalizationMessage(`✓ Version ${intent.resolution.documentReceipt.generation.displayVersion} créée`); setCompleted(true);
    } else if (intent.resolution.documentNoChange) setFinalizationMessage("Aucune modification à intégrer dans une nouvelle version.");
    else setFinalizationMessage(question ? "Une décision est nécessaire dans la conversation. Le brouillon est conservé."
      : intent.state === "BLOCKED" ? "La création est bloquée. Le brouillon est conservé."
        : "L’opération est récupérable. Reprenez explicitement la création.");
  };
  const generation = target.generation;
  useEffect(() => {
    const token = ++epoch.current; flight.current = false;
    setLoaded(null); setBuffer(null); setLoadFailed(false); setSaveState("CLEAN");
    setRecoverableIntent(false); setCompleted(false); setFinalizationMessage(null);
    setFinalizationFailure(null); setSaveFeedback(false); setClarification(null);
    void (async () => {
      const archiveClient = clientRef.current;
      if (!archiveClient.workingRevisions) throw new Error("DOC_REVISION_UNAVAILABLE");
      const source = await archiveClient.body(generation.generationId);
      if (source.ref.bodySha256 !== generation.bodySha256) throw new Error("DOC_REVISION_SOURCE_DIGEST_MISMATCH");
      const projection = source.body.native.family === "DRCI" ? await archiveClient.body(source.body.native.value.protocolProjectionId) : undefined;
      const native = editableArchivedDocument(source, target.nativeDocumentRef, projection);
      const pending = editingRequested && runtimeRef.current && await archiveClient.finalizationIntents?.recoverForBase(generation.generationId, native.logicalDocumentRef);
      if (pending && !archiveClient.workingRevisions.getSave) throw new Error("STUDIO_INTENT_SAVE_INVALID");
      const result = pending ? await archiveClient.workingRevisions.getSave!({ revisionId: pending.frozen.workingRevisionId,
        saveSequence: pending.frozen.workingRevisionSaveSequence, contentDigest: pending.frozen.workingRevisionContentDigest })
        : editingRequested ? await archiveClient.workingRevisions.open({ baseGenerationId: generation.generationId,
          baseGenerationBodyDigest: generation.bodySha256, nativeDocumentRef: target.nativeDocumentRef })
          : target.activeRevisionId ? await archiveClient.workingRevisions.get(target.activeRevisionId) : null;
      if (result && (result.revision.logicalDocumentRef !== native.logicalDocumentRef
        || result.revision.baseGenerationId !== generation.generationId
        || result.revision.baseGenerationBodyDigest !== generation.bodySha256)) throw new Error("DOC_REVISION_LOGICAL_SOURCE_INVALID");
      if (epoch.current !== token) return;
      setLoaded({ result, base: native.content, body: source.body }); setBuffer(structuredClone(result?.revision.content ?? native.content));
      if (editingRequested && result && runtimeRef.current) {
        flight.current = true; setFinalizing(true);
        try {
          const intent = await runtimeRef.current.run(result.revision, setStage, true);
          if (epoch.current === token && intent) {
            finish(intent);
          }
        }
        catch (error) { if (epoch.current === token) reportFinalizationFailure(error); }
        finally { if (epoch.current === token) { flight.current = false; setFinalizing(false); setStage(null); } }
      }
    })().catch(() => { if (epoch.current === token) setLoadFailed(true); });
    return () => { epoch.current = token + 1; };
  // PRJ adoption may change the archive capability/client object. It must not
  // reset this buffer or detach the durable intent while finalization runs.
  }, [generation.generationId, generation.bodySha256, target.nativeDocumentRef, target.activeRevisionId, editingRequested]);
  useEffect(() => { if (!saveFeedback) return; const timer = setTimeout(() => setSaveFeedback(false), 2500); return () => clearTimeout(timer); }, [saveFeedback]);
  useEffect(() => {
    if (!dirty && !busy) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, busy]);
  const edit = (change: (content: EditableDocumentContent) => void) => {
    if (!buffer || !loaded?.result || mode === "READ" || flight.current || completed) return;
    const next = structuredClone(buffer); change(next); setBuffer(next); setActionFailed(false);
    if (saveState !== "CONFLICT" && saveState !== "SAVE_FAILED") setSaveState(stableStringify(next) === stableStringify(loaded.result.revision.content) ? "CLEAN" : "DIRTY");
  };
  const save = async () => {
    if (!loaded?.result || !buffer || mode === "READ" || !client.workingRevisions || flight.current || saveState === "CONFLICT"
      || !dirty && saveState !== "SAVE_FAILED") return;
    const token = epoch.current; flight.current = true; setSaveState("SAVING"); setActionFailed(false);
    try {
      const result = await client.workingRevisions.save({ revisionId: loaded.result.revision.revisionId,
        expectedSaveSequence: loaded.result.revision.saveSequence, content: buffer });
      if (epoch.current !== token) return;
      setLoaded({ ...loaded, result }); setBuffer(structuredClone(result.revision.content)); setSaveState("CLEAN");
      setSaveFeedback(true);
    } catch (error) {
      if (epoch.current === token) setSaveState(codeOf(error) === "DOC_REVISION_SAVE_CONFLICT" || codeOf(error) === "DOC_REVISION_ABANDONED" ? "CONFLICT" : "SAVE_FAILED");
    } finally { if (epoch.current === token) flight.current = false; }
  };
  const createNextVersion = async () => {
    if (!loaded?.result || !buffer || mode === "READ" || !runtimeRef.current || flight.current || saveState === "CONFLICT" || completed) return;
    const token = epoch.current; flight.current = true; setFinalizing(true); setFinalizationMessage(null); setFinalizationFailure(null); setClarification(null);
    let saved = loaded.result;
    try {
      if (dirty) {
        setSaveState("SAVING");
        try {
          saved = await clientRef.current.workingRevisions!.save({ revisionId: saved.revision.revisionId,
            expectedSaveSequence: saved.revision.saveSequence, content: structuredClone(buffer) });
        } catch (error) {
          if (epoch.current === token) setSaveState(codeOf(error) === "DOC_REVISION_SAVE_CONFLICT" || codeOf(error) === "DOC_REVISION_ABANDONED" ? "CONFLICT" : "SAVE_FAILED");
          return;
        }
        if (epoch.current !== token) return;
        setLoaded({ ...loaded, result: saved }); setBuffer(structuredClone(saved.revision.content)); setSaveState("CLEAN"); setSaveFeedback(true);
      }
      const intent = await runtimeRef.current.run(saved.revision, setStage);
      if (epoch.current === token) finish(intent);
    } catch (error) { if (epoch.current === token) reportFinalizationFailure(error); }
    finally { if (epoch.current === token) { flight.current = false; setFinalizing(false); setStage(null); } }
  };
  const confirmAction = async () => {
    const action = dialog; setDialog(null);
    if (action === "LEAVE") { onClose(); return; }
    if (!loaded?.result || !client.workingRevisions || flight.current) return;
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
    mode === "READ" || hasProtectedTextBinding(original) ? <div className="rounded-lg bg-muted/40 p-3">
      <p className="whitespace-pre-wrap break-words leading-7">{display(value)}</p>
      {hasProtectedTextBinding(original) && <p className="mt-2 text-xs text-muted-foreground">Lecture seule · références natives protégées</p>}
    </div> : <StudioText value={value} label={label} heading={heading} disabled={busy || completed} onChange={value => edit(content => change(content, value))} />;
  const pair = (before: string, after: string, label: string, change: (content: EditableDocumentContent, value: string) => void, heading = false) => {
    const kind = before === after ? "Inchangé" : !before ? "Ajouté" : !after ? "Retiré" : "Modifié";
    return <article className="mb-4 rounded-xl border p-4" key={label}>
      <h4 className="mb-3 text-sm font-semibold">{label} · {kind}</h4>
      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <div className="min-w-0" data-testid="studio-compare-base"><p className="mb-2 text-xs font-medium text-muted-foreground">Base · Version {generation.displayVersion} · lecture seule</p><p className="whitespace-pre-wrap break-words text-sm leading-7">{display(before) || "Texte vide"}</p></div>
        <div className="min-w-0 border-l-2 border-primary/30 pl-4" data-testid="studio-compare-draft"><p className="mb-2 text-xs font-medium text-muted-foreground">Brouillon actuel · modifiable</p>{textField(after, before, label, change, heading)}</div>
      </div>
    </article>;
  };
  return <section className="min-w-0 overflow-hidden rounded-2xl border bg-background shadow-sm" aria-label="Document Studio" data-testid="document-studio">
    <header className="border-b p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={close} disabled={busy}><ArrowLeft />Retour aux documents</Button>
        <span role="status" aria-live="polite" data-testid="studio-save-status" className="text-sm">{loaded ? loaded.result ? labels[saveState] : "Version archivée · lecture seule" : loadFailed ? "Studio indisponible" : "Ouverture du document…"}</span>
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-primary">Document Studio{loaded?.result ? " · brouillon" : " · consultation"}</p>
      <h2 className="mt-2 break-words text-xl font-semibold">{loaded?.base.title ?? "Document archivé"}</h2>
      <p className="mt-1 text-sm text-muted-foreground">Basé sur la Version {generation.displayVersion}</p>
      <details className="mt-2 text-xs text-muted-foreground"><summary>Provenance technique</summary><p>Projet {generation.project.projectVersion} · {generation.generationId}</p></details>
      {loaded?.result && <p className="mt-3 max-w-3xl text-sm text-muted-foreground">Brouillon non intégré à une version. Les modifications ne sont pas évaluées scientifiquement. Enregistrer ne modifie ni le projet ni les versions archivées.</p>}
      {loaded?.result?.baseState.stale && <p role="status" className="mt-3 rounded-lg border bg-amber-50 p-3 text-sm text-amber-950">Ce brouillon est basé sur une génération ou un état du projet antérieur. Sa source reste inchangée ; aucun rebasage automatique.</p>}
      {loaded && !completed && <div className="mt-4 flex flex-wrap gap-2">
        <div role="group" aria-label="Modes du document" className="flex gap-2">{(["READ", "EDIT", "COMPARE"] as const).map(view => <Button key={view}
          variant={mode === view ? "secondary" : "outline"} aria-pressed={mode === view} disabled={busy}
          onClick={() => { setMode(view); if (view !== "READ") setEditingRequested(true); }}>{({ READ: "Lire", EDIT: "Modifier", COMPARE: "Comparer" })[view]}</Button>)}</div>
        {loaded.result && mode !== "READ" && <Button variant="ghost" onClick={() => setDialog("ABANDON")} disabled={busy}><Trash2 />Abandonner le brouillon</Button>}
      </div>}
    </header>
    {impact && currentProjectSnapshot?.sourceProjectDigest === impact.currentProjectDigest && <details className="border-b p-5 sm:px-6"><summary className="cursor-pointer text-sm font-medium">Cohérence, dépendances et impact sur les autres documents</summary><div className="mt-3"><DocumentImpactSummary report={impact} /></div></details>}
    {editing && loaded?.result && buffer && mode !== "READ" && !completed && <StudioEditAssistant runtime={editing} revision={loaded.result.revision}
      buffer={buffer} disabled={busy || saveState === "CONFLICT"} dirty={dirty} onApply={content => {
        if (flight.current || completed) return;
        setBuffer(content); setSaveState("DIRTY"); setActionFailed(false);
      }} />}
    {loadFailed && <p role="alert" className="p-6">Le document ou son brouillon n’a pas pu être vérifié. Les versions archivées sont conservées. Revenez aux documents pour réessayer.</p>}
    {(saveState === "SAVE_FAILED" || saveState === "CONFLICT") && <aside role="alert" className="m-5 rounded-xl border bg-amber-50 p-4 text-sm text-amber-950">
      <p>{saveState === "CONFLICT" ? "Ce brouillon a été modifié ou abandonné ailleurs. Vos modifications locales sont conservées ; rechargez la dernière version avant de poursuivre."
        : actionFailed ? "L’action n’a pas abouti. Votre texte local est conservé ; aucune sauvegarde n’est confirmée."
          : "La sauvegarde n’a pas pu être confirmée. Vos modifications locales sont conservées."}</p>
      <Button variant="outline" className="mt-3" onClick={() => setDialog("RELOAD")}>Recharger la version enregistrée</Button>
    </aside>}
    {loaded && buffer && <main className="bg-muted/20 p-4 sm:p-8">
      <div className={`mx-auto min-w-0 rounded-xl border bg-background p-5 shadow-sm sm:p-8 ${mode === "COMPARE" ? "max-w-6xl" : "max-w-4xl"}`}>
        {mode === "COMPARE" ? <section aria-label="Comparaison du brouillon avec sa base">
          <h3 className="mb-5 text-lg font-semibold">Comparaison · Version {generation.displayVersion} / brouillon</h3>
          {pair(loaded.base.title, buffer.title, "Titre du document", (content, value) => { content.title = value; }, true)}
          {buffer.sections.map((section, index) => <section key={section.nodeId}>
            {pair(loaded.base.sections[index].title, section.title, `Titre de la section ${index + 1}`, (content, value) => { content.sections[index].title = value; }, true)}
            {section.blocks.map((block, blockIndex) => pair(loaded.base.sections[index].blocks[blockIndex].text, block.text, `Section ${index + 1} · paragraphe ${blockIndex + 1}`, (content, value) => { content.sections[index].blocks[blockIndex].text = value; }))}
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
    {loaded?.result && <footer className="sticky bottom-0 z-10 border-t bg-background p-5 shadow-sm sm:px-6" data-testid="studio-action-area">
      {finalization && <div className="mb-3 text-sm" data-testid="studio-finalization-status" aria-live="polite"
        data-state={finalizing ? "RUNNING" : completed ? "COMPLETED" : finalizationFailure ? "FAILED"
          : clarification ? "WAITING_FOR_CLARIFICATION" : recoverableIntent ? "READY_TO_RESUME" : "IDLE"}>
        {finalizing ? <p role="status">Création de version en cours · {stage ? { ASSESSMENT: "Préparation des modifications…",
          SCIENCE: "Mise à jour scientifique…", DOCUMENTS: "Préparation des documents…", ARCHIVE: "Enregistrement de la version…" }[stage]
          : "Vérification de l’opération…"}</p>
          : finalizationFailure ? <aside role="alert" className="rounded-lg border border-destructive/40 p-3 text-destructive">
            <p>La création de la version n’a pas abouti.</p><p>Votre brouillon et les versions précédentes sont conservés. Vous pouvez reprendre cette opération.</p>
            {finalizationFailure.code && <details className="mt-2 text-xs"><summary>Détail technique</summary><code>{finalizationFailure.code}</code></details>}
          </aside> : finalizationMessage && <p role="status">{finalizationMessage}</p>}
        {!finalizing && clarification && <div className="mt-2 rounded-lg border bg-muted/30 p-3">
          <p>{clarification.intent}</p>
          <Button variant="outline" className="mt-3" onClick={onConversation ?? onClose}>Répondre dans la conversation</Button>
        </div>}
      </div>}
      <div className="flex flex-wrap items-center justify-between gap-3">
      <p role="status" className="text-sm">{saveState === "DIRTY" ? "Brouillon modifié" : labels[saveState]} · {completed ? "Version créée" : "Brouillon non intégré à une version"}</p>
      <div className="flex flex-wrap items-center gap-3">
      {saveFeedback && <span role="status" className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />✓ Enregistré</span>}
      <Button variant="outline" onClick={() => void save()} disabled={mode === "READ" || busy || completed || saveState === "CONFLICT" || !dirty && saveState !== "SAVE_FAILED"}><Save />Enregistrer</Button>
      {finalization && <Button onClick={() => void createNextVersion()} disabled={mode === "READ" || busy || completed || saveState === "CONFLICT"}>{recoverableIntent ? "Reprendre la création" : "Créer la version suivante"}</Button>}</div></div>
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
