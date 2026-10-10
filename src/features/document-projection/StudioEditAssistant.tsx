import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { StudioEditRuntime } from "../protocol-designer/studio-edit-client";
import type { DocumentWorkingRevision, EditableDocumentContent } from "./working-revision";
import { applyStudioEditProposal, studioEditOperationId, type StudioEditProposal } from "./studio-edit-proposal";
import { documentWorkflowFailure, emitDocumentWorkflowTrace, type DocumentWorkflowTraceSink } from "../protocol-designer/functional-reset/document-workflow-trace";

/** Ephemeral proposal UI only. Accepted text enters the single existing Studio
 * buffer; the existing explicit save/finalization owners remain unchanged. */
export default function StudioEditAssistant({ runtime, revision, buffer, disabled, dirty, requestedTarget, onBusy, onApply, onDismiss, trace }: {
  runtime: StudioEditRuntime; revision: DocumentWorkingRevision; buffer: EditableDocumentContent;
  disabled: boolean; dirty: boolean; onApply: (content: EditableDocumentContent) => void;
  requestedTarget?: { nodeId: string; request: number } | null; onBusy?: (busy: boolean) => void;
  trace?: DocumentWorkflowTraceSink;
  onDismiss?: () => void;
}) {
  const blocks = revision.content.sections.flatMap((section, index) => section.blocks.flatMap((block, paragraph) =>
    /\[\[(?:FACT|CITE):/u.test(block.text) ? [] : [{ ...block, label: `${section.title || `Section ${index + 1}`} · paragraphe ${paragraph + 1}` }]));
  const [nodeId, setNodeId] = useState(blocks[0]?.nodeId ?? ""), [instruction, setInstruction] = useState("");
  const [proposal, setProposal] = useState<StudioEditProposal | null>(null), [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null), [applied, setApplied] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const flight = useRef(false), panel = useRef<HTMLElement>(null), instructionInput = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { onBusy?.(busy); return () => onBusy?.(false); }, [busy, onBusy]);
  useEffect(() => {
    if (!requestedTarget) return;
    setNodeId(requestedTarget.nodeId); setProposal(null); setError(null); setApplied(false);
    panel.current?.scrollIntoView?.({ block: "nearest" });
    instructionInput.current?.focus();
  }, [requestedTarget]);
  const propose = async () => {
    if (flight.current || disabled || dirty || !instruction.trim() || !nodeId) return;
    flight.current = true; setBusy(true); setProposal(null); setError(null); setErrorCode(null); setApplied(false);
    try { setProposal(await runtime.propose(revision, nodeId, instruction)); }
    catch (error) { const failure = documentWorkflowFailure(error, "DOC", "createStudioEditRuntime.propose");
      setErrorCode(failure.code === "UNKNOWN" ? null : failure.code);
      setError("La proposition n’a pas abouti. Le texte du brouillon est inchangé. Aucune relance automatique."); }
    finally { flight.current = false; setBusy(false); }
  };
  const apply = () => {
    if (!proposal || disabled || busy) return;
    try { onApply(applyStudioEditProposal(proposal, revision, buffer, runtime.projectBinding())); observeDecision("ACCEPTED"); setProposal(null); setApplied(true); setError(null); }
    catch (error) { observeDecision("FAILED", error); setError("Le passage, la sauvegarde ou le projet a changé. Cette proposition ne peut plus être appliquée ; aucune modification n’a été effectuée."); }
  };
  const observeDecision = (status: "ACCEPTED" | "REJECTED" | "FAILED", error?: unknown) => {
    if (!proposal) return;
    try {
    emitDocumentWorkflowTrace(trace, { operationRef: studioEditOperationId(proposal.request), component: "applyStudioEditProposal",
      owner: "UI", stage: "UI_PROJECTION", status, error, identity: { proposalId: proposal.proposalId, requestDigest: proposal.request.requestDigest,
        workingRevisionId: revision.revisionId, saveSequence: revision.saveSequence, contentDigest: revision.contentDigest,
        logicalDocumentRef: revision.logicalDocumentRef, generationId: revision.baseGenerationId, nodeId,
        assessmentClassification: "UNASSESSED" } });
    } catch { /* Identity projection is passive, including before sink delivery. */ }
  };
  return <aside ref={panel} className="my-4 rounded-xl border border-foreground/20 bg-background p-4 shadow-sm" aria-label="Édition avec NOXIA">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Demander à NOXIA</h3>
        {onDismiss && <Button variant="ghost" size="sm" disabled={busy} onClick={onDismiss}>Fermer l’aide</Button>}</div>
      <p className="mt-2 text-sm text-muted-foreground">{blocks.find(block => block.nodeId === nodeId)?.label}. La demande porte sur le paragraphe entier, même si vous avez sélectionné une seule phrase. Rien ne sera remplacé sans votre accord.</p>
      <div className="mt-3 flex flex-col gap-3">
        <label className="text-sm">Votre demande<textarea ref={instructionInput} aria-label="Demande de modification" className="mt-1 block w-full rounded-lg border bg-background p-3" rows={2} maxLength={2000}
          placeholder="Décrivez ce que vous souhaitez améliorer ou comprendre…" value={instruction} disabled={disabled || busy}
          onChange={event => { setInstruction(event.target.value); setProposal(null); setApplied(false); }} /></label>
        {dirty && <p role="status" className="text-sm">Enregistrez les modifications avant de demander une proposition sur cette sauvegarde.</p>}
        <Button className="self-start bg-foreground text-background hover:bg-foreground/90" onClick={() => void propose()} disabled={disabled || busy || dirty || !nodeId || !instruction.trim()}>{busy ? "Préparation de la proposition…" : "Envoyer à NOXIA"}</Button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      {error && errorCode && <details className="mt-2 text-xs text-muted-foreground"><summary className="cursor-pointer">Référence de l’erreur</summary><code>{errorCode}</code></details>}
      {applied && <p role="status" className="mt-3 text-sm font-medium">Proposition appliquée au brouillon · à enregistrer.</p>}
      {proposal?.resultKind === "EXPLANATION" && <section className="mt-4 rounded-xl border bg-background p-4" aria-label="Explication de NOXIA">
        <h4 className="text-sm font-medium">Explication · document inchangé</h4>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7">{proposal.explanation}</p>
        <p className="mt-3 text-xs text-muted-foreground">Cette aide ne constitue ni une décision scientifique ni une validation du document.</p>
        <Button variant="outline" className="mt-3" onClick={() => { observeDecision("REJECTED"); setProposal(null); }}>Fermer l’explication</Button>
      </section>}
      {proposal?.resultKind === "REPLACEMENT" && <section className="mt-4 rounded-xl border bg-background p-4" aria-label="Proposition de modification">
        <div className="grid min-w-0 gap-4 md:grid-cols-2"><div><h4 className="text-sm font-medium">Avant</h4><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7">{proposal.beforeText}</p></div>
          <div><h4 className="text-sm font-medium">Proposition · non appliquée</h4><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7">{proposal.proposedText}</p></div></div>
        {proposal.explanation && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">{proposal.explanation}</p>}
        <p className="mt-3 text-xs text-muted-foreground">Impact scientifique non évalué. Appliquer modifie uniquement le brouillon ; toute modification scientifique suit le parcours de validation existant à la création de version.</p>
        <div className="mt-3 flex flex-wrap gap-2"><Button onClick={apply} disabled={disabled || busy}>Appliquer au brouillon</Button><Button variant="outline" onClick={() => { observeDecision("REJECTED"); setProposal(null); setError(null); }}>Annuler la proposition</Button></div>
      </section>}
  </aside>;
}
