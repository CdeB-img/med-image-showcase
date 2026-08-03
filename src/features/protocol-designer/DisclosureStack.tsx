import { ChevronDown, CircleAlert, FileSearch, Layers3, Route } from "lucide-react";
import type { DemonstratorScenario } from "./types";

type DisclosureStackProps = {
  scenario: DemonstratorScenario;
  openDepths: number[];
  onDepthChange: (depth: number, open: boolean) => void;
};

const detailClass =
  "group rounded-xl border border-border/70 bg-card/40 open:bg-card/70 print:border-slate-300 print:bg-white";

export default function DisclosureStack({ scenario, openDepths, onDepthChange }: DisclosureStackProps) {
  return (
    <section aria-labelledby="disclosure-title" className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h2 id="disclosure-title" className="text-lg font-semibold">Profondeur de lecture</h2>
        <span className="text-xs text-muted-foreground">4 niveaux explicites</span>
      </div>

      <div className="rounded-xl border border-amber-400/50 bg-amber-400/10 p-4 print:border-amber-700 print:bg-white">
        <div className="flex items-start gap-3">
          <CircleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-amber-300 print:text-amber-800" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200 print:text-amber-900">Niveau 0 · Orientation</p>
            <p className="mt-1 text-sm leading-relaxed">{scenario.comprehension}</p>
          </div>
        </div>
      </div>

      <details className={detailClass} open={openDepths.includes(1)} onToggle={(event) => onDepthChange(1, event.currentTarget.open)}>
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <span className="flex items-center gap-2 text-sm font-semibold"><Route aria-hidden="true" className="h-4 w-4 text-primary" />Niveau 1 · Compréhension</span>
          <ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-border/70 px-4 py-4">
          <ul className="space-y-2 text-sm text-muted-foreground print:text-slate-700">
            {scenario.constructs.map((construct) => <li key={construct}>• {construct}</li>)}
          </ul>
        </div>
      </details>

      <details className={detailClass} open={openDepths.includes(2)} onToggle={(event) => onDepthChange(2, event.currentTarget.open)}>
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <span className="flex items-center gap-2 text-sm font-semibold"><Layers3 aria-hidden="true" className="h-4 w-4 text-primary" />Niveau 2 · Exécution</span>
          <ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-border/70 px-4 py-4 text-sm text-muted-foreground print:text-slate-700">
          Les options restent des projections comparables. Une sélection n’est enregistrée qu’après une action humaine explicite et ne déclenche aucune exécution externe.
        </div>
      </details>

      <details className={detailClass} open={openDepths.includes(3)} onToggle={(event) => onDepthChange(3, event.currentTarget.open)}>
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <span className="flex items-center gap-2 text-sm font-semibold"><FileSearch aria-hidden="true" className="h-4 w-4 text-primary" />Niveau 3 · Traçabilité</span>
          <ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-border/70 px-4 py-4 text-sm text-muted-foreground print:text-slate-700">
          Projection locale déterministe issue de {scenario.program.id} « {scenario.program.title} » v{scenario.program.version} et {scenario.reasoningBook.id} « {scenario.reasoningBook.title} » v{scenario.reasoningBook.version}. État des connaissances : 3 août 2026. Statut : {scenario.fixtureStatus}. Aucun chargement dynamique du corpus ou du graphe de connaissances.
        </div>
      </details>
    </section>
  );
}
