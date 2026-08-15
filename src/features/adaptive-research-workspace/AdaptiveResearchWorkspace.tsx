import type { ReactNode } from "react";
import { useState } from "react";
import { ValidationSummaryPanel } from "@/features/validation-architecture/ValidationSummaryPanel";
import type { ValidationProductSummary } from "@/features/validation-architecture/product-gates";
import type { AdaptiveResearchWorkspaceProjection, WorkspaceMode, WorkspaceSemanticState } from "./contracts";
import { computeWorkspaceVisibility } from "./projection";
import { projectSemanticStateForWorkspace } from "./semantic-state";

const stateClasses: Record<ReturnType<typeof projectSemanticStateForWorkspace>["visualIntent"], string> = {
  NEUTRAL: "border-border bg-muted/50 text-foreground",
  INFORMATION: "border-sky-500/40 bg-sky-500/10 text-sky-900 dark:text-sky-100",
  POSITIVE: "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
  CAUTION: "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100",
  CRITICAL: "border-destructive/40 bg-destructive/5 text-destructive",
  INACTIVE: "border-border bg-muted/40 text-muted-foreground",
};

const Status = ({ state }: { state: WorkspaceSemanticState }) => {
  const presentation = projectSemanticStateForWorkspace(state);
  return <span title={presentation.explanation} className={`inline-flex min-h-7 items-center rounded-full border px-2.5 py-1 text-xs font-medium ${stateClasses[presentation.visualIntent]}`}>{presentation.label}</span>;
};

export type AdaptiveResearchWorkspaceProps = {
  projection: Readonly<AdaptiveResearchWorkspaceProjection>;
  validation: Readonly<ValidationProductSummary>;
  navigation: ReactNode;
  onOpenSurface?: (targetRef: string) => void;
  onOpenDocument?: (targetRef: string) => void;
};

export default function AdaptiveResearchWorkspace({ projection, validation, navigation, onOpenSurface, onOpenDocument }: AdaptiveResearchWorkspaceProps) {
  const [mode, setMode] = useState<WorkspaceMode>("STANDARD");
  const visibility = computeWorkspaceVisibility(mode);
  const primaryDocuments = projection.documents.filter((item) => ["Protocol", "DMP", "SAP", "Synopsis"].includes(item.projection));
  return <section className="rounded-3xl border bg-background p-4 shadow-sm sm:p-6" aria-labelledby="adaptive-workspace-title" data-testid="adaptive-research-workspace">
    <header className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Espace de recherche</p><h2 id="adaptive-workspace-title" className="mt-2 text-2xl font-bold sm:text-3xl">Votre étude, au même endroit</h2><p className="mt-3 max-w-4xl text-base"><strong>Question :</strong> {projection.project.question}</p><p className="mt-2 text-sm text-muted-foreground">{projection.project.designSummary}</p></div>
      <div className="flex flex-wrap items-center gap-2"><Status state={projection.project.state} /><div className="inline-flex rounded-full border p-1" aria-label="Niveau de détail"><button type="button" aria-pressed={mode === "STANDARD"} onClick={() => setMode("STANDARD")} className="min-h-10 rounded-full px-3 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground">Standard</button><button type="button" aria-pressed={mode === "EXPERT"} onClick={() => setMode("EXPERT")} className="min-h-10 rounded-full px-3 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground">Expert</button></div></div>
    </header>

    <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(19rem,0.75fr)]">
      <main className="min-w-0 space-y-6">
        <div aria-label="Prochaine action scientifique">{navigation}</div>

        <section aria-labelledby="workspace-attention-title"><div className="flex items-center justify-between gap-3"><h3 id="workspace-attention-title" className="text-xl font-semibold">À regarder maintenant</h3><span className="text-sm text-muted-foreground">{projection.attention.length} élément(s)</span></div>{projection.attention.length ? <div className="mt-3 grid gap-3 md:grid-cols-2">{projection.attention.slice(0, mode === "EXPERT" ? undefined : 6).map((item) => <article key={item.attentionId} className="rounded-2xl border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.kind.replace(/_/g, " ")}</p><Status state={item.semanticState} /></div><h4 className="mt-3 font-semibold">{item.label}</h4><p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>{item.actionable && onOpenSurface && <button type="button" onClick={() => onOpenSurface(item.targetRef)} className="mt-3 min-h-11 rounded-lg border px-3 py-2 text-sm">Examiner dans son contexte</button>}{visibility.sourceRefs && <p className="mt-3 break-all text-xs text-muted-foreground">Owner : {item.owner} · Source : {item.sourceRef}</p>}</article>)}</div> : <p className="mt-3 rounded-xl border p-4 text-sm text-muted-foreground">Aucun élément ne réclame une attention immédiate.</p>}</section>

        <section aria-labelledby="workspace-domains-title"><h3 id="workspace-domains-title" className="text-xl font-semibold">Dimensions de l’étude</h3><p className="mt-1 text-sm text-muted-foreground">Chaque domaine conserve son propre état ; aucun score global n’est calculé.</p><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{projection.domains.map((domain) => <article key={domain.domainId} className="rounded-2xl border p-4"><Status state={domain.state} /><h4 className="mt-3 font-semibold capitalize">{domain.label}</h4><p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{domain.summary}</p>{onOpenSurface && <button type="button" onClick={() => onOpenSurface(domain.targetRef)} className="mt-3 min-h-11 rounded-lg border px-3 py-2 text-sm">Ouvrir</button>}{visibility.owners && <p className="mt-3 break-all text-xs text-muted-foreground">Owner : {domain.owner} · {domain.sourceRefs.join(", ")}</p>}</article>)}</div></section>

        <section aria-labelledby="workspace-documents-title"><h3 id="workspace-documents-title" className="text-xl font-semibold">Documents</h3><p className="mt-1 text-sm text-muted-foreground">Préparation et génération restent sous la responsabilité de DOC.</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{primaryDocuments.map((document) => <article key={document.projection} className="rounded-2xl border p-4"><Status state={document.stale ? "STALE" : document.state === "GENERATABLE" ? "ADOPTED" : document.state === "PARTIALLY_GENERATABLE" ? "WARNING" : "NOT_GENERATABLE"} /><h4 className="mt-3 font-semibold">{document.projection}</h4><p className="mt-2 text-sm text-muted-foreground">{document.missing.length ? `${document.missing.length} information(s) encore nécessaire(s).` : "Projection disponible selon l’état DOC courant."}</p>{onOpenDocument && <button type="button" onClick={() => onOpenDocument(document.targetRef)} className="mt-3 min-h-11 rounded-lg border px-3 py-2 text-sm">Voir la projection</button>}{visibility.versions && <p className="mt-3 break-all text-xs text-muted-foreground">Version Project : {document.projectVersion} · Source : {document.sourceRef}</p>}</article>)}</div></section>
      </main>

      <aside className="min-w-0 space-y-5" aria-label="Contexte du projet"><ValidationSummaryPanel summary={validation} mode={mode} />{mode === "EXPERT" && <section className="rounded-xl border bg-card p-5"><h3 className="font-semibold">Traçabilité de la projection</h3><dl className="mt-3 grid gap-2 break-all text-xs text-muted-foreground"><div><dt className="font-medium text-foreground">Workspace</dt><dd>{projection.workspaceProjectionId}</dd></div><div><dt className="font-medium text-foreground">Project</dt><dd>{projection.sourceProjectRef} · {projection.sourceProjectVersion}</dd></div><div><dt className="font-medium text-foreground">Navigation</dt><dd>{projection.trace.navigationRefs.join(" · ")}</dd></div><div><dt className="font-medium text-foreground">Validation</dt><dd>{projection.trace.validationRefs.join(" · ") || "aucun run"}</dd></div><div><dt className="font-medium text-foreground">Limites</dt><dd>{projection.limitations.join(" · ")}</dd></div></dl></section>}</aside>
    </div>
    <p className="mt-6 border-t pt-4 text-xs text-muted-foreground">Cette surface est une projection en lecture seule. Le Research Project, QRY, VAL et DOC restent propriétaires de leurs objets et décisions.</p>
  </section>;
}
