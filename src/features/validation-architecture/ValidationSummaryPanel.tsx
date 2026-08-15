import type { ValidationProductSummary } from "./product-gates";

export type ValidationSummaryPanelProps = {
  summary: ValidationProductSummary;
  mode?: "STANDARD" | "EXPERT";
  onHumanReview?: (requestRef: string) => void;
};

const STATUS_LABELS: Record<ValidationProductSummary["status"], string> = {
  READY: "Prêt à poursuivre",
  COMPLETE_WITH_FINDINGS: "Poursuite possible avec limites visibles",
  REVIEW_REQUIRED: "Revue requise",
  BLOCKED: "Action bloquée",
  NOT_EVALUABLE: "Validation non évaluable",
};

const GATE_LABELS: Record<ValidationProductSummary["gates"][number]["gateId"], string> = {
  CONTRIBUTION_ADOPTION: "Adoption des contributions",
  PROJECT_FREEZE: "Gel du projet",
  PROTOCOL_GENERATION: "Génération du protocole",
  DMP_GENERATION: "Génération du DMP",
  SAP_GENERATION: "Génération du SAP",
  V1_READY: "Préparation V1",
  CANDIDATE_PREVIEW: "Prévisualisation des candidats",
};

const GATE_STATUS_LABELS: Record<ValidationProductSummary["gates"][number]["status"], string> = {
  ALLOWED: "Disponible",
  ALLOWED_WITH_LIMITATIONS: "Disponible avec limites",
  REVIEW_REQUIRED: "Revue requise",
  BLOCKED: "Bloqué",
  NOT_EVALUABLE: "Non évaluable",
  PREVIEW_ONLY: "Prévisualisation uniquement",
};

export const ValidationSummaryPanel = ({ summary, mode = "STANDARD", onHumanReview }: ValidationSummaryPanelProps) => (
  <section aria-labelledby="validation-summary-title" className="rounded-xl border bg-card p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Validation</p>
        <h2 id="validation-summary-title" className="mt-1 text-lg font-semibold">{STATUS_LABELS[summary.status]}</h2>
      </div>
      <span className="rounded-full border px-3 py-1 text-xs font-medium">{mode === "EXPERT" ? "Mode expert" : "Mode standard"}</span>
    </div>

    {summary.blockers.length > 0 && <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 p-3"><h3 className="font-medium">Ce qui bloque</h3>{summary.blockers.map((item, index) => <p className="mt-1 text-sm" key={`${item.context}-${index}`}>{item.message} <span className="text-muted-foreground">Zone : {item.context}</span></p>)}</div>}
    {summary.reviewsRequired.length > 0 && <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3"><h3 className="font-medium">Votre avis est nécessaire</h3>{summary.reviewsRequired.map((item) => <div className="mt-2 flex flex-wrap items-center justify-between gap-2" key={item.requestRef}><p className="text-sm">{item.message}</p>{onHumanReview && <button type="button" className="rounded border px-3 py-1 text-sm" onClick={() => onHumanReview(item.requestRef)}>Examiner</button>}</div>)}</div>}
    {summary.unknowns.length > 0 && <div className="mt-4"><h3 className="font-medium">Informations encore inconnues</h3><ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">{summary.unknowns.map((item) => <li key={item}>{item}</li>)}</ul></div>}
    {summary.incompleteCheckpoints.length > 0 && <p className="mt-4 text-sm text-muted-foreground">Certaines validations ne sont pas encore terminées. Elles ne sont pas considérées comme réussies.</p>}
    {summary.gates.length > 0 && <div className="mt-4"><h3 className="font-medium">Actions et disponibilité</h3><ul className="mt-2 grid gap-2 text-sm sm:grid-cols-2">{summary.gates.map((gate) => <li className="rounded border p-2" key={gate.gateId}><span>{GATE_LABELS[gate.gateId]}</span><span className="ml-2 text-muted-foreground">{GATE_STATUS_LABELS[gate.status]}</span>{mode === "EXPERT" && <span className="ml-2 text-xs text-muted-foreground">({gate.gateId})</span>}</li>)}</ul></div>}
    {summary.limitations.length > 0 && <details className="mt-4"><summary className="cursor-pointer text-sm font-medium">Limites connues</summary><ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">{summary.limitations.map((item) => <li key={item}>{item}</li>)}</ul></details>}

    {mode === "EXPERT" && <div className="mt-5 border-t pt-4"><h3 className="font-medium">Preuves techniques</h3><div className="mt-2 space-y-2">{summary.expert.runs.map((run) => <details key={run.validationRunId} className="rounded border p-3"><summary className="cursor-pointer text-sm font-medium">{run.checkpointRef.checkpointId} — {run.status}</summary><dl className="mt-2 grid gap-1 text-xs text-muted-foreground"><div>Run : {run.validationRunId}</div><div>Invariants : {run.invariantRefs.join(", ") || "aucun"}</div><div>Statut technique : {run.technicalStatus}</div><div>Statut sémantique : {run.semanticStatus}</div><div>Configuration : {run.configurationDigest}</div><div>Résultat : {run.resultDigest}</div></dl></details>)}</div></div>}

    <p className="mt-4 text-xs text-muted-foreground">Cette synthèse n’est ni un score scientifique global, ni un PASS PD-011. Elle ne modifie aucun objet du projet.</p>
  </section>
);

export default ValidationSummaryPanel;
