import { useMemo, useState } from "react";
import { diffProjections } from "./diff";
import { renderProjection } from "./renderer";
import type { DocumentProjection, DocumentSectionStatus } from "./types";

const statusLabels: Record<DocumentSectionStatus, string> = {
  GENERATABLE: "Générable",
  PARTIALLY_GENERATABLE: "Partiellement générable",
  BLOCKED: "Bloquée",
  NOT_GENERATABLE: "Non générable",
  NOT_APPLICABLE: "Non applicable",
  UNKNOWN: "Inconnue",
  FUTURE: "Future",
};

const Badge = ({ children, warning = false }: { children: React.ReactNode; warning?: boolean }) => <span className={`inline-flex max-w-full rounded-full border px-2.5 py-1 text-xs font-medium ${warning ? "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200" : "border-border bg-muted text-muted-foreground"}`}>{children}</span>;
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <section className={`min-w-0 break-words rounded-2xl border bg-card p-5 shadow-sm ${className}`}>{children}</section>;

export const downloadProjection = (projection: DocumentProjection, format: "MARKDOWN" | "HTML") => {
  const rendered = renderProjection(projection, format);
  const url = URL.createObjectURL(new Blob([rendered.content], { type: rendered.mimeType }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `noxia-${projection.projectionType.toLocaleLowerCase()}-${projection.projectionVersion}.${rendered.extension}`;
  link.click();
  URL.revokeObjectURL(url);
};

type Props = {
  projection: DocumentProjection;
  history: ReadonlyArray<DocumentProjection>;
  onReturnToProject: () => void;
};

export default function DocumentProjectionView({ projection, history, onReturnToProject }: Props) {
  const comparable = useMemo(() => history.filter((item) => item.seriesId === projection.seriesId && item.projectionId !== projection.projectionId), [history, projection]);
  const [comparisonId, setComparisonId] = useState(comparable.at(-1)?.projectionId ?? "");
  const comparison = comparable.find((item) => item.projectionId === comparisonId) ?? null;
  const diff = comparison ? diffProjections(comparison, projection) : null;
  const statusCounts = projection.sections.reduce<Record<DocumentSectionStatus, number>>((counts, section) => ({ ...counts, [section.status]: counts[section.status] + 1 }), { GENERATABLE: 0, PARTIALLY_GENERATABLE: 0, BLOCKED: 0, NOT_GENERATABLE: 0, NOT_APPLICABLE: 0, UNKNOWN: 0, FUTURE: 0 });

  return <div className="mt-8 min-w-0" data-testid="document-projection-view">
    <Card className="border-primary/40">
      <div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Document Projection Engine · lecture seule</p><h2 className="mt-2 text-3xl font-bold">{projection.title}</h2><p className="mt-3"><strong>Projet source :</strong> {projection.source.projectId}</p><p className="mt-1 break-all text-sm text-muted-foreground">Version projet {projection.source.projectVersion} · projection v{projection.projectionVersion}</p></div><div className="flex flex-wrap gap-2"><Badge warning={projection.readiness !== "READY_FOR_REVIEW"}>{projection.lifecycle}</Badge><Badge>{projection.readiness}</Badge></div></div>
      <div role="note" className="mt-5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm"><strong>Frontière :</strong> cette projection n’est ni la vérité du Research Project, ni un protocole clinique exécutable, ni une approbation. Toute correction repart vers l’objet propriétaire sous forme de contribution ou de décision séparée.</div>
      <div className="mt-5 flex flex-wrap gap-2">{(Object.keys(statusCounts) as DocumentSectionStatus[]).map((status) => <Badge key={status} warning={["BLOCKED", "NOT_GENERATABLE", "PARTIALLY_GENERATABLE", "UNKNOWN", "FUTURE"].includes(status)}>{statusLabels[status]} · {statusCounts[status]}</Badge>)}</div>
      <div className="mt-5 flex flex-wrap gap-2 print:hidden"><button type="button" onClick={() => downloadProjection(projection, "MARKDOWN")} className="rounded-lg border px-4 py-2 text-sm">Exporter en Markdown</button><button type="button" onClick={() => downloadProjection(projection, "HTML")} className="rounded-lg border px-4 py-2 text-sm">Exporter en HTML</button></div>
    </Card>

    <section className="mt-6" aria-labelledby="projection-sections-title"><h3 id="projection-sections-title" className="text-2xl font-bold">Sections composées</h3><p className="mt-1 text-muted-foreground">L’applicabilité et la générabilité restent deux qualifications distinctes. Aucun contenu absent n’est complété.</p><div className="mt-4 grid gap-4">{projection.sections.map((section) => <details key={section.sectionId} open={section.order <= 3 || ["BLOCKED", "NOT_GENERATABLE", "UNKNOWN", "FUTURE"].includes(section.status)} className="rounded-2xl border bg-card p-5"><summary className="cursor-pointer font-semibold"><span>{section.order}. {section.title}</span><span className="ml-2 text-xs text-muted-foreground">{section.status} · {section.applicability}</span></summary><div className="mt-4 space-y-4 text-sm">{section.statusReasons.map((reason) => <p key={reason} className="rounded-lg bg-muted/60 p-3"><strong>Règle :</strong> {reason}</p>)}{section.futureReason && <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3"><strong>Dépendance future :</strong> {section.futureReason}</p>}{section.blocks.map((block) => <div key={block.blockId}><h4 className="font-semibold">{block.label ?? block.kind}</h4>{block.items.map((item, itemIndex) => <p key={`${block.blockId}:${itemIndex}:${item}`} className="mt-2">• {item}</p>)}</div>)}{section.unknowns.length > 0 && <div><h4 className="font-semibold text-amber-800 dark:text-amber-200">Inconnues</h4>{section.unknowns.map((item) => <p key={item} className="mt-2">• {item}</p>)}</div>}{section.limitations.length > 0 && <div><h4 className="font-semibold">Limitations</h4>{section.limitations.map((item) => <p key={item} className="mt-2 text-muted-foreground">• {item}</p>)}</div>}{section.contradictions.length > 0 && <div role="alert"><h4 className="font-semibold text-destructive">Contradictions</h4>{section.contradictions.map((item) => <p key={item} className="mt-2 text-destructive">• {item}</p>)}</div>}{section.humanDecisionIds.length > 0 && <div><h4 className="font-semibold">Décisions humaines liées</h4>{section.humanDecisionIds.map((item) => <p key={item} className="mt-2">• {item}</p>)}</div>}<details><summary className="cursor-pointer font-medium">Provenance de la section</summary>{section.provenanceRefs.map((item) => <p key={item} className="mt-2 break-all text-xs text-muted-foreground">• {item}</p>)}</details></div></details>)}</div></section>

    <section className="mt-8" aria-labelledby="projection-history-title"><h3 id="projection-history-title" className="text-2xl font-bold">Historique et comparaison</h3><div className="mt-4 grid gap-4 lg:grid-cols-2"><Card><h4 className="font-semibold">Versions de cette projection</h4>{history.filter((item) => item.seriesId === projection.seriesId).map((item) => <p key={item.projectionId} className="mt-3 text-sm"><strong>v{item.projectionVersion}</strong> · source {item.source.projectVersion} · {item.lifecycle}</p>)}</Card><Card><label htmlFor="projection-comparison" className="font-semibold">Comparer avec une version antérieure</label><select id="projection-comparison" value={comparisonId} onChange={(event) => setComparisonId(event.target.value)} className="mt-3 w-full rounded-lg border bg-background px-3 py-2"><option value="">Aucune comparaison</option>{comparable.map((item) => <option key={item.projectionId} value={item.projectionId}>Projection v{item.projectionVersion} · projet {item.source.projectVersion}</option>)}</select>{diff ? <div className="mt-4 text-sm"><p>{diff.counts.MODIFIED} modifiée(s) · {diff.counts.ADDED} ajoutée(s) · {diff.counts.REMOVED} retirée(s) · {diff.counts.UNCHANGED} inchangée(s)</p>{diff.sections.filter((item) => item.kind !== "UNCHANGED").map((item) => <p key={item.sectionId} className="mt-2">• {item.title} — {item.kind}{item.generabilityChanged ? " · générabilité modifiée" : ""}</p>)}</div> : <p className="mt-3 text-sm text-muted-foreground">{comparable.length ? "Sélectionnez une version." : "Aucune version antérieure disponible."}</p>}</Card></div></section>

    <section className="mt-8" aria-labelledby="projection-decisions-title"><h3 id="projection-decisions-title" className="text-2xl font-bold">Décisions humaines et provenance</h3><div className="mt-4 grid gap-4 lg:grid-cols-2"><Card><h4 className="font-semibold">Registre des décisions</h4>{projection.humanDecisions.length ? projection.humanDecisions.map((item) => <div key={`${item.decisionId}:v${item.version}`} className="mt-3 text-sm"><Badge warning={item.status !== "ADOPTED"}>{item.status}</Badge><p className="mt-2 font-medium">{item.gateId}</p><p className="mt-1 text-muted-foreground">{item.actor ?? "Acteur non attribué"} · mandat {item.mandate ?? "non attribué"} · version {item.version}</p><p className="mt-1 text-muted-foreground">{item.reason ?? "Raison non renseignée"}</p></div>) : <p className="mt-3 text-sm text-muted-foreground">Aucune décision transportée.</p>}</Card><Card><h4 className="font-semibold">Provenance globale</h4>{projection.provenanceRefs.map((item) => <p key={item} className="mt-2 break-all text-xs text-muted-foreground">• {item}</p>)}</Card></div></section>

    <div className="mt-8 print:hidden"><button type="button" onClick={onReturnToProject} className="rounded-lg border px-4 py-2">Revenir au Research Project</button></div>
  </div>;
}
