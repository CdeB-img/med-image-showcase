import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { StudioEditRuntime } from "../protocol-designer/studio-edit-client";
import type { DocumentWorkingRevision, EditableDocumentContent } from "./working-revision";
import { applyStudioEditProposal, type StudioEditProposal } from "./studio-edit-proposal";

/** Ephemeral proposal UI only. Accepted text enters the single existing Studio
 * buffer; the existing explicit save/finalization owners remain unchanged. */
export default function StudioEditAssistant({ runtime, revision, buffer, disabled, dirty, requestedTarget, onBusy, onApply }: {
  runtime: StudioEditRuntime; revision: DocumentWorkingRevision; buffer: EditableDocumentContent;
  disabled: boolean; dirty: boolean; onApply: (content: EditableDocumentContent) => void;
  requestedTarget?: { nodeId: string; request: number } | null; onBusy?: (busy: boolean) => void;
}) {
  const blocks = revision.content.sections.flatMap((section, index) => section.blocks.flatMap((block, paragraph) =>
    /\[\[(?:FACT|CITE):/u.test(block.text) ? [] : [{ ...block, label: `${section.title || `Section ${index + 1}`} · paragraphe ${paragraph + 1}` }]));
  const [nodeId, setNodeId] = useState(blocks[0]?.nodeId ?? ""), [instruction, setInstruction] = useState("");
  const [proposal, setProposal] = useState<StudioEditProposal | null>(null), [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null), [applied, setApplied] = useState(false);
  const flight = useRef(false), panel = useRef<HTMLDetailsElement>(null), instructionInput = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { onBusy?.(busy); return () => onBusy?.(false); }, [busy, onBusy]);
  useEffect(() => {
    if (!requestedTarget) return;
    setNodeId(requestedTarget.nodeId); setProposal(null); setError(null); setApplied(false);
    if (panel.current) { panel.current.open = true; panel.current.scrollIntoView?.({ block: "nearest" }); }
    instructionInput.current?.focus();
  }, [requestedTarget]);
  const propose = async () => {
    if (flight.current || disabled || dirty || !instruction.trim() || !nodeId) return;
    flight.current = true; setBusy(true); setProposal(null); setError(null); setApplied(false);
    try { setProposal(await runtime.propose(revision, nodeId, instruction)); }
    catch { setError("La proposition n’a pas abouti. Le texte du brouillon est inchangé. Aucune relance automatique."); }
    finally { flight.current = false; setBusy(false); }
  };
  const apply = () => {
    if (!proposal || disabled || busy) return;
    try { onApply(applyStudioEditProposal(proposal, revision, buffer, runtime.projectBinding())); setProposal(null); setApplied(true); setError(null); }
    catch { setError("Le passage, la sauvegarde ou le projet a changé. Cette proposition ne peut plus être appliquée ; aucune modification n’a été effectuée."); }
  };
  return <aside className="border-b bg-primary/5 p-5 sm:px-6" aria-label="Édition avec NOXIA">
    <details ref={panel}><summary className="cursor-pointer font-medium">Améliorer un passage avec NOXIA</summary>
      <p className="mt-3 text-sm text-muted-foreground">Une demande explicite prépare une proposition. Elle ne sera ni appliquée ni adoptée automatiquement.</p>
      <div className="mt-3 flex flex-col gap-3">
        <label className="text-sm">Passage à modifier<select aria-label="Passage à modifier" className="mt-1 block w-full min-w-0 rounded-lg border bg-background p-2" value={nodeId} disabled={disabled || busy} onChange={event => { setNodeId(event.target.value); setProposal(null); setError(null); }}>
          {blocks.map(block => <option key={block.nodeId} value={block.nodeId}>{block.label}</option>)}</select></label>
        <label className="text-sm">Votre demande<textarea ref={instructionInput} aria-label="Demande de modification" className="mt-1 block w-full rounded-lg border bg-background p-3" rows={2} maxLength={2000}
          placeholder="Raccourcis ce passage sans perdre les informations…" value={instruction} disabled={disabled || busy}
          onChange={event => { setInstruction(event.target.value); setProposal(null); setApplied(false); }} /></label>
        <div role="group" aria-label="Demandes rédactionnelles" className="flex flex-wrap gap-2">{[
          ["Clarifier", "Reformule ce paragraphe plus clairement, sans changer les faits, les réserves ni les inconnues."],
          ["Raccourcir", "Raccourcis ce paragraphe sans perdre les informations, les réserves ni les inconnues."],
          ["Développer la formulation", "Développe la formulation de ce paragraphe sans ajouter de faits, de décisions ni de méthodes non fournies."],
        ].map(([label, text]) => <Button key={label} size="sm" variant="outline" disabled={disabled || busy}
          onClick={() => { setInstruction(text); setProposal(null); setApplied(false); instructionInput.current?.focus(); }}>{label}</Button>)}</div>
        <p className="text-xs text-muted-foreground">Ces raccourcis remplissent la demande uniquement. L’envoi reste explicite ; le passage traité est le paragraphe natif entier.</p>
        {dirty && <p role="status" className="text-sm">Enregistrez les modifications avant de demander une proposition sur cette sauvegarde.</p>}
        <Button className="self-start" onClick={() => void propose()} disabled={disabled || busy || dirty || !nodeId || !instruction.trim()}>{busy ? "Préparation de la proposition…" : "Proposer une modification"}</Button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      {applied && <p role="status" className="mt-3 text-sm font-medium">Proposition appliquée au brouillon · à enregistrer.</p>}
      {proposal && <section className="mt-4 rounded-xl border bg-background p-4" aria-label="Proposition de modification">
        <div className="grid min-w-0 gap-4 md:grid-cols-2"><div><h4 className="text-sm font-medium">Avant</h4><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7">{proposal.beforeText}</p></div>
          <div><h4 className="text-sm font-medium">Proposition · non appliquée</h4><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7">{proposal.proposedText}</p></div></div>
        <p className="mt-3 text-xs text-muted-foreground">Impact scientifique non évalué. Appliquer modifie uniquement le brouillon ; toute modification scientifique suit le parcours de validation existant à la création de version.</p>
        <div className="mt-3 flex flex-wrap gap-2"><Button onClick={apply} disabled={disabled || busy}>Appliquer au brouillon</Button><Button variant="outline" onClick={() => { setProposal(null); setError(null); }}>Annuler la proposition</Button></div>
      </section>}
    </details>
  </aside>;
}
