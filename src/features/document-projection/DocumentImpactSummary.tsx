import type { DocumentImpactReport } from "./document-impact";

const labels = { CURRENT_BINDING: "Lié au projet courant", EDITORIALLY_MODIFIED: "Révision documentaire conservée", POTENTIALLY_OUTDATED: "Potentiellement à actualiser",
  REFERENCED_STATE_UNCHANGED: "Références inchangées · couverture partielle", UNKNOWN: "Impact non déterminé" };
export default function DocumentImpactSummary({ report }: { report: DocumentImpactReport }) {
  return <aside className="rounded-xl border bg-background p-4 text-sm" aria-label="Cohérence et impact documentaire">
    <h4 className="font-medium">Dépendances documentaires à examiner</h4>
    {report.knownAffectedCount > 0 && <p className="mt-2">Une dépendance révisée peut affecter au moins {report.knownAffectedCount} document{report.knownAffectedCount > 1 ? "s" : ""} de cette version.</p>}
    {!report.projectCurrent && <p className="mt-2">Version historique. L’analyse des références ne garantit pas une couverture exhaustive ; les documents archivés ne sont pas modifiés.</p>}
    {report.pendingScientificChange && <p className="mt-2">Des contributions scientifiques restent non adoptées. Elles ne sont pas la vérité du projet.</p>}
    {report.unassessedDraft && <p className="mt-2">Le brouillon contient des modifications non évaluées. Leur impact est traité à la création de version, pas à la consultation.</p>}
    <details className="mt-3"><summary className="cursor-pointer py-2">Examiner les {report.documents.length} documents et leurs références</summary>
      <ul className="mt-2 space-y-3">{report.documents.map(document => <li key={document.nativeDocumentRef}><p className="font-medium">{document.title} · {labels[document.state]}</p>
        <ul className="mt-1 text-xs text-muted-foreground">{document.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
      </li>)}</ul></details>
    <p className="mt-3 text-xs text-muted-foreground">Analyse limitée aux dépendances natives connues, pas à la cohérence sémantique de chaque paragraphe. Aucun texte n’est réécrit automatiquement ; ceci ne vaut pas validation clinique ou réglementaire.</p>
  </aside>;
}
