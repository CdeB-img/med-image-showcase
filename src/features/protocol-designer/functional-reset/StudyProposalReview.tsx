import { useState } from "react";
import type { ResearchProjectOwnerProjection } from "@/features/research-project-construction";
import type { StudyArbitration, StudyProposalComposition } from "@/features/scientific-thinking/contextual-study-proposal";
import { buildStudyCandidateProjections } from "@/features/data-analysis-planning/projections";

type Props = { composition: StudyProposalComposition; project: ResearchProjectOwnerProjection | null; disabled?: boolean; readOnly?: boolean;
  onValidate: (optionRefs: readonly string[], atomRefs: readonly string[], digest: string) => void;
  onDisposition?: (status: "REJECTED" | "DEFERRED", optionRefs: readonly string[], atomRefs: readonly string[], digest: string) => void;
  onDiscuss: (subject: string) => void };

export default function StudyProposalReview({ composition, project, disabled = false, readOnly = false, onValidate, onDisposition, onDiscuss }: Props) {
  const options = composition.proposal.arbitrations.flatMap(a => a.options);
  const alternativeRefs = new Set(options.flatMap(o => o.atomRefs));
  const core = composition.proposal.atoms.filter(a => !alternativeRefs.has(a.ref) && !composition.adoptedAtomRefs.includes(a.ref) && a.status !== "OPEN_DECISION");
  const mainCore = core.filter(a => ["QUESTION", "POPULATION", "DESIGN"].includes(a.area)).slice(0, 3);
  const active = composition.proposal.arbitrations.filter(a => a.options.some(o => !composition.unavailableOptionRefs.includes(o.ref) && !o.atomRefs.every(r => composition.adoptedAtomRefs.includes(r))));
  const highValue = new Set(composition.qrySelection?.nonDominated.map(c => c.candidateId) ?? active.map(a => a.ref));
  const mainChoices = active.filter(a => highValue.has(a.ref)).slice(0, 3);
  const heldOptions = new Set(composition.dispositions?.flatMap(d => d.optionRefs) ?? []);
  const heldAtoms = new Set(composition.dispositions?.flatMap(d => d.atomRefs) ?? []);
  const [selectedOptions, setSelectedOptions] = useState<string[]>(mainChoices.flatMap(a => a.recommendedRefs).filter(r => !heldOptions.has(r)));
  const [selectedAtoms, setSelectedAtoms] = useState<string[]>(mainCore.map(a => a.ref).filter(r => !heldAtoms.has(r)));
  const stale = composition.state !== "CURRENT";
  const select = (arbitration: StudyArbitration, optionRef: string, checked: boolean) => setSelectedOptions(previous => {
    const retained = previous.filter(r => r !== optionRef && (arbitration.selection !== "ONE" || !arbitration.options.some(o => o.ref === r)));
    return checked ? [...retained, optionRef] : retained;
  });
  const arbitration = (a: StudyArbitration) => <fieldset key={a.ref} className="space-y-2 rounded-xl border p-3" disabled={disabled || stale}>
    <legend className="px-1 text-sm font-semibold">{a.label}</legend>
    {a.options.map(o => <label key={o.ref} className="flex items-start gap-2 text-sm">
      <input type={a.selection === "ONE" ? "radio" : "checkbox"} name={`${composition.proposalRef}:${a.ref}`} checked={selectedOptions.includes(o.ref)}
        disabled={composition.unavailableOptionRefs.includes(o.ref) || o.atomRefs.every(r => composition.adoptedAtomRefs.includes(r))}
        onChange={event => select(a, o.ref, event.target.checked)} className="mt-1" />
      <span>{o.label}{a.recommendedRefs.includes(o.ref) && <span className="text-xs text-muted-foreground"> · conseillé</span>}
        <details className="mt-1 text-xs text-muted-foreground"><summary className="cursor-pointer">Bénéfices, limites et conséquences</summary><p>{o.benefits}</p><p>{o.limits}</p><p>{o.consequences}</p></details>
      </span>
    </label>)}
    <button type="button" className="text-xs underline" onClick={() => { setSelectedOptions(previous => previous.filter(r => !a.options.some(o => o.ref === r))); onDiscuss(a.label); }}>Autre / Modifier / Discuter</button>
  </fieldset>;
  const atomCheckbox = (ref: string) => {
    const a = composition.proposal.atoms.find(atom => atom.ref === ref)!;
    return <label key={ref} className="flex items-start gap-2 text-sm"><input type="checkbox" checked={selectedAtoms.includes(ref)} disabled={disabled || stale}
      onChange={event => setSelectedAtoms(previous => event.target.checked ? [...previous, ref] : previous.filter(r => r !== ref))} className="mt-1" /><span>{a.content}</span></label>;
  };
  return <section className="space-y-3 rounded-3xl border border-primary/30 bg-card p-5" data-testid="study-proposal-review" aria-label="Compréhension de travail">
    {!readOnly && <h3 className="text-base font-semibold">Compréhension de travail</h3>}
    <div><h4 className="text-sm font-medium">Ce qui est compris</h4><ul className="mt-1 text-sm text-muted-foreground">{composition.proposal.understanding.slice(0, 6).map(text => <li key={text}>{text}</li>)}</ul></div>
    {stale && <p role="status" className="text-sm">Le projet a changé. Ces propositions doivent être réévaluées avant confirmation.</p>}
    {composition.adoptedAtomRefs.length > 0 && <p role="status" className="text-sm">{composition.adoptedAtomRefs.length} éléments confirmés. Les autres restent des propositions.</p>}
    <div data-testid="proposal-substantive-work"><h4 className="text-sm font-medium">Stratégie proposée</h4><ul className="text-sm text-muted-foreground">{composition.proposal.atoms.filter(a => ["OBJECTIVES", "ELIGIBILITY", "RECRUITMENT", "MEASUREMENTS", "TIMING", "ANALYSIS"].includes(a.area)).slice(0, 6).map(a => <li key={a.ref}>{a.content}</li>)}</ul></div>
    <p className="text-sm"><span className="font-medium">Déjà préparé — </span>{buildStudyCandidateProjections(composition, project).filter(p => ["RECRUITMENT_NOTICE", "SCREENING", "RECRUITED_PARTICIPANT_QUESTIONNAIRE", "CRF_SPECIFICATION", "ANALYSIS_PLAN", "DIMENSIONING"].includes(p.projectionType)).map(p => p.label).join(" · ")}</p>
    {!readOnly && mainCore.length > 0 && <div className="space-y-2"><h4 className="text-sm font-medium">NOXIA propose</h4>{mainCore.map(a => atomCheckbox(a.ref))}</div>}
    {!readOnly && mainChoices.length > 0 && <div className="space-y-2"><h4 className="text-sm font-medium">À choisir</h4>{mainChoices.map(arbitration)}</div>}
    {composition.qrySelection?.nonDominated.some(c => c.owner === "BIOSTATISTICS" && c.actionCategory === "BUILD_OR_REVISE_OBJECT") && <p role="status" className="text-sm">Le modèle d'analyse et le dimensionnement doivent être réexaminés ensemble avant de retenir un effectif.</p>}
    <details className="rounded-xl border border-dashed p-3" data-testid="study-proposal-detail"><summary className="cursor-pointer text-sm">Voir le détail et les aperçus</summary>
      <div className="mt-3 space-y-4">
        {!readOnly && onDisposition && <div className="flex flex-wrap gap-2"><button type="button" disabled={disabled || stale || !selectedOptions.length && !selectedAtoms.length} className="rounded-xl border px-3 py-2 text-sm" onClick={() => onDisposition("REJECTED", selectedOptions, selectedAtoms, composition.digest)}>Refuser la sélection</button>
          <button type="button" disabled={disabled || stale || !selectedOptions.length && !selectedAtoms.length} className="rounded-xl border px-3 py-2 text-sm" onClick={() => onDisposition("DEFERRED", selectedOptions, selectedAtoms, composition.digest)}>Différer la sélection</button></div>}
        {(composition.dispositions?.length ?? 0) > 0 && <p className="text-xs text-muted-foreground">Des propositions ont été refusées ou différées. Leur historique est conservé ; les cocher à nouveau constitue un nouveau choix explicite.</p>}
        {!readOnly && core.filter(a => !mainCore.some(c => c.ref === a.ref)).map(a => atomCheckbox(a.ref))}
        {!readOnly && active.filter(a => !mainChoices.some(c => c.ref === a.ref)).map(arbitration)}
        <section className="text-sm"><h4 className="font-semibold">Stratégie candidate</h4>{composition.proposal.atoms.map(a => <details key={a.ref} className="mt-2"><summary>{a.area} · {a.content}</summary><p>{a.rationale}</p><p>{a.status} · {a.owner}</p></details>)}</section>
        {buildStudyCandidateProjections(composition, project).map(projection => <details key={projection.projectionType} data-testid={`candidate-${projection.projectionType}`}><summary className="cursor-pointer text-sm font-semibold">{projection.label} · {projection.freshness !== "CURRENT" ? "À actualiser" : "Candidat"}</summary>
          <p className="mt-2 whitespace-pre-wrap text-sm">{projection.content}</p>
          <p className="mt-2 text-xs text-muted-foreground">Document de travail · non validé · {projection.SOURCE_PROJECT_VERSION ? "lié à la version du projet" : "avant confirmation du projet"}</p>
          <details className="text-xs"><summary>Provenance</summary><pre className="whitespace-pre-wrap">{JSON.stringify({ SOURCE_PROJECT_VERSION: projection.SOURCE_PROJECT_VERSION, PROPOSAL_REFS: projection.PROPOSAL_REFS, ADOPTED_REFS: projection.ADOPTED_REFS }, null, 2)}</pre></details>
        </details>)}
      </div>
    </details>
    {!readOnly && <div className="flex flex-wrap gap-2"><button type="button" disabled={disabled || stale || !selectedOptions.length && !selectedAtoms.length} onClick={() => onValidate(selectedOptions, selectedAtoms, composition.digest)} className="min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Valider les propositions</button>
      <button type="button" disabled={disabled} className="min-h-11 rounded-xl border px-4 py-2 text-sm" onClick={() => onDiscuss("la compréhension de travail")}>Modifier / Discuter</button></div>}
    {!readOnly && <p className="text-xs text-muted-foreground">Seuls les choix sélectionnés seront enregistrés.</p>}
  </section>;
}
