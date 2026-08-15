import type { ScientificObjectBoundaryDiagnostic } from "@/features/knowledge-engine";
import { CircleAlert, RefreshCcw } from "lucide-react";

type SchemaBoundaryNoticeProps = {
  diagnostics: ScientificObjectBoundaryDiagnostic[];
  mode: "STANDARD" | "EXPERT";
  onRetry: () => void;
  onCorrect: () => void;
};

export default function SchemaBoundaryNotice({ diagnostics, mode, onRetry, onCorrect }: SchemaBoundaryNoticeProps) {
  if (!diagnostics.length) return null;
  return <section role="alert" className="mb-6 rounded-2xl border border-amber-500/50 bg-amber-500/10 p-5">
    <div className="flex gap-3">
      <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-200" />
      <div className="min-w-0">
        <h2 className="font-semibold">NOXIA n’a pas pu interpréter correctement un élément de cette réponse. Votre saisie est conservée.</h2>
        <p className="mt-2 text-sm text-muted-foreground">Les autres éléments valides restent utilisables. Aucun contenu de remplacement et aucune décision Project n’ont été créés.</p>
      </div>
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
      <button type="button" onClick={onRetry} className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm"><RefreshCcw className="h-4 w-4" /> Réessayer l’interprétation</button>
      <button type="button" onClick={onCorrect} className="rounded-lg border bg-background px-4 py-2 text-sm">Corriger la réponse</button>
    </div>
    {mode === "EXPERT" && <details className="mt-4 rounded-xl border bg-background/60 p-4 text-sm">
      <summary className="cursor-pointer font-medium">Détails du diagnostic</summary>
      {diagnostics.map((diagnostic, index) => <dl key={`${diagnostic.code}:${diagnostic.path.join(".")}:${index}`} className="mt-3 grid gap-1 text-muted-foreground">
        <div><dt className="inline font-medium text-foreground">Code : </dt><dd className="inline">{diagnostic.code}</dd></div>
        <div><dt className="inline font-medium text-foreground">Owner : </dt><dd className="inline">{diagnostic.owner}</dd></div>
        <div><dt className="inline font-medium text-foreground">Schema path : </dt><dd className="inline">{diagnostic.path.join(".") || "non disponible"}</dd></div>
        <div><dt className="inline font-medium text-foreground">Payload ref : </dt><dd className="inline">{diagnostic.payloadRef ?? "non disponible"}</dd></div>
      </dl>)}
    </details>}
  </section>;
}
