import type { ReactNode } from "react";
import { useState } from "react";
import { ValidationSummaryPanel } from "@/features/validation-architecture/ValidationSummaryPanel";
import type { ValidationProductSummary } from "@/features/validation-architecture/product-gates";
import type {
  AdaptiveResearchWorkspaceProjection,
  WorkspaceDocumentSummary,
  WorkspaceMode,
  WorkspaceSemanticState,
} from "./contracts";
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
  return <span title={presentation.explanation} className={`inline-flex min-h-7 shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-medium ${stateClasses[presentation.visualIntent]}`}>{presentation.label}</span>;
};

const documentStateLabel: Record<WorkspaceDocumentSummary["state"], string> = {
  GENERATABLE: "Un aperçu peut être préparé",
  PARTIALLY_GENERATABLE: "Construction en cours",
  NOT_GENERATABLE: "Informations insuffisantes",
  BLOCKED: "Préparation bloquée",
  NOT_APPLICABLE: "Non applicable",
};

const documentSemanticState = (document: WorkspaceDocumentSummary): WorkspaceSemanticState => {
  if (document.stale) return "STALE";
  if (document.state === "GENERATABLE") return "ADOPTED";
  if (document.state === "PARTIALLY_GENERATABLE") return "WARNING";
  if (document.state === "NOT_APPLICABLE") return "NOT_APPLICABLE";
  return "NOT_GENERATABLE";
};

type ProjectPanelProps = {
  projection: Readonly<AdaptiveResearchWorkspaceProjection>;
  documents: WorkspaceDocumentSummary[];
  mode: WorkspaceMode;
  onOpenSurface?: (targetRef: string) => void;
  onOpenDocument?: (targetRef: string) => void;
  instance: "desktop" | "mobile";
};

const ResearchProjectPanel = ({ projection, documents, mode, onOpenSurface, onOpenDocument, instance }: ProjectPanelProps) => (
  <div className="space-y-5" data-testid={`living-research-project-${instance}`}>
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Research Project</p>
        <Status state={projection.project.state} />
      </div>
      <h3 className="mt-3 text-xl font-bold">Résumé actuel</h3>
      <p className="mt-2 text-sm leading-relaxed">{projection.project.question}</p>
      <p className="mt-2 text-xs text-muted-foreground">Cette vue reflète le Project courant. Les propositions restent distinctes des éléments adoptés.</p>
    </div>

    {projection.project.recentChanges.length > 0 && <section className="rounded-xl border border-sky-500/40 bg-sky-500/10 p-3" aria-label="Changements récents">
      <p className="text-sm font-semibold">Ce qui vient de changer</p>
      {projection.project.recentChanges.slice(0, 2).map((change) => <p key={change} className="mt-1 text-xs">{change}</p>)}
    </section>}

    <section aria-label="État du projet">
      <h4 className="text-sm font-semibold">État du projet</h4>
      <div className="mt-2 grid gap-2">
        {projection.project.sections.map((section) => <button key={section.sectionId} type="button" onClick={() => onOpenSurface?.(section.targetRef)} className="min-h-11 rounded-xl border bg-background p-3 text-left">
          <span className="flex items-start justify-between gap-3"><span className="text-sm font-medium">{section.label}</span><Status state={section.state} /></span>
          <span className="mt-1 block line-clamp-2 text-xs text-muted-foreground">{section.summary}</span>
        </button>)}
      </div>
    </section>

    <section aria-label="Documents du projet">
      <div className="flex items-center justify-between gap-3"><h4 className="text-sm font-semibold">Documents</h4><span className="text-xs text-muted-foreground">version {projection.sourceProjectVersion}</span></div>
      <div className="mt-2 grid gap-2">
        {documents.map((document) => <article key={document.projection} className="rounded-xl border bg-background p-3">
          <div className="flex items-start justify-between gap-2"><p className="text-sm font-medium">{document.projection}</p><Status state={documentSemanticState(document)} /></div>
          <p role="status" className="mt-1 text-xs">{documentStateLabel[document.state]}</p>
          {document.missing[0] && <p className="mt-1 text-xs text-muted-foreground">Il manque encore : {document.missing[0]}</p>}
          {document.actionAvailability.preview && onOpenDocument && <button type="button" onClick={() => onOpenDocument(document.targetRef)} className="mt-2 min-h-10 rounded-lg border px-3 py-2 text-xs">Voir l’aperçu disponible</button>}
          {mode === "EXPERT" && <p className="mt-2 break-all text-[11px] text-muted-foreground">{document.owner} · {document.sourceRef} · {document.freshness}</p>}
        </article>)}
      </div>
    </section>
  </div>
);

export type AdaptiveResearchWorkspaceProps = {
  projection: Readonly<AdaptiveResearchWorkspaceProjection>;
  validation: Readonly<ValidationProductSummary>;
  navigation: ReactNode;
  humanDecision?: ReactNode;
  mode?: WorkspaceMode;
  onModeChange?: (mode: WorkspaceMode) => void;
  onOpenSurface?: (targetRef: string) => void;
  onOpenDocument?: (targetRef: string) => void;
};

export default function AdaptiveResearchWorkspace({
  projection,
  validation,
  navigation,
  humanDecision,
  mode: controlledMode,
  onModeChange,
  onOpenSurface,
  onOpenDocument,
}: AdaptiveResearchWorkspaceProps) {
  const [localMode, setLocalMode] = useState<WorkspaceMode>("STANDARD");
  const [mobileProjectOpen, setMobileProjectOpen] = useState(false);
  const mode = controlledMode ?? localMode;
  const setMode = (nextMode: WorkspaceMode) => {
    setLocalMode(nextMode);
    onModeChange?.(nextMode);
  };
  const visibility = computeWorkspaceVisibility(mode);
  const primaryDocuments = projection.documents.filter((item) => ["Protocol", "DMP", "SAP", "Synopsis"].includes(item.projection));

  return <section className="rounded-3xl border bg-background p-4 shadow-sm sm:p-6" aria-labelledby="adaptive-workspace-title" data-testid="adaptive-research-workspace">
    <header className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Espace de recherche</p>
        <h2 id="adaptive-workspace-title" className="mt-2 text-2xl font-bold sm:text-3xl">Votre étude, au même endroit</h2>
        <p className="mt-2 text-sm text-muted-foreground">Le dialogue fait avancer le raisonnement ; le Research Project conserve ce qui est réellement établi.</p>
      </div>
      <div className="inline-flex self-start rounded-full border p-1" aria-label="Niveau de détail">
        <button type="button" aria-pressed={mode === "STANDARD"} onClick={() => setMode("STANDARD")} className="min-h-10 rounded-full px-3 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground">Standard</button>
        <button type="button" aria-pressed={mode === "EXPERT"} onClick={() => setMode("EXPERT")} className="min-h-10 rounded-full px-3 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground">Expert</button>
      </div>
    </header>

    {mode === "STANDARD" && <>
      <button type="button" aria-expanded={mobileProjectOpen} aria-controls="mobile-research-project" onClick={() => setMobileProjectOpen((open) => !open)} className="sticky top-2 z-20 mt-4 min-h-11 w-full rounded-xl border bg-background px-4 py-3 text-left font-semibold shadow-sm lg:hidden">
        {mobileProjectOpen ? "Masquer le Research Project" : "Voir le Research Project"}
      </button>
      {mobileProjectOpen && <aside id="mobile-research-project" aria-label="Contexte du projet" className="mt-3 rounded-2xl border bg-muted/20 p-4 lg:hidden">
        <ResearchProjectPanel projection={projection} documents={primaryDocuments} mode={mode} onOpenSurface={onOpenSurface} onOpenDocument={onOpenDocument} instance="mobile" />
      </aside>}

      <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[minmax(18rem,.78fr)_minmax(0,1.4fr)]">
        <aside aria-label="Contexte du projet" className="hidden min-w-0 self-start rounded-2xl border bg-muted/20 p-4 lg:sticky lg:top-4 lg:block lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <ResearchProjectPanel projection={projection} documents={primaryDocuments} mode={mode} onOpenSurface={onOpenSurface} onOpenDocument={onOpenDocument} instance="desktop" />
        </aside>
        <main className="min-w-0" aria-labelledby="standard-conversation-title">
          <div className="mb-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Interaction principale</p><h3 id="standard-conversation-title" className="mt-1 text-2xl font-bold">Conversation scientifique</h3><p className="mt-2 text-sm text-muted-foreground">Répondez naturellement. Les raccourcis proposés restent facultatifs et aucune réponse brute ne devient directement une vérité du Project.</p></div>
          <div aria-label="Prochaine action scientifique">{navigation}</div>
          {humanDecision}
          {projection.attention.length > 0 && <details className="mt-5 rounded-2xl border bg-card p-4">
            <summary className="cursor-pointer font-semibold">Autres éléments à garder en vue ({projection.attention.length})</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">{projection.attention.slice(0, 6).map((item) => <article key={item.attentionId} className="rounded-xl border p-3"><div className="flex items-start justify-between gap-2"><p className="text-sm font-medium">{item.label}</p><Status state={item.semanticState} /></div><p className="mt-2 text-xs text-muted-foreground">{item.summary}</p>{item.actionable && onOpenSurface && <button type="button" onClick={() => onOpenSurface(item.targetRef)} className="mt-2 min-h-10 rounded-lg border px-3 py-2 text-xs">Examiner dans son contexte</button>}</article>)}</div>
          </details>}
        </main>
      </div>
    </>}

    {mode === "EXPERT" && <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(19rem,.75fr)]">
      <main className="min-w-0 space-y-6">
        <div aria-label="Prochaine action scientifique">{navigation}</div>
        {humanDecision}
        <section aria-labelledby="workspace-attention-title"><div className="flex items-center justify-between gap-3"><h3 id="workspace-attention-title" className="text-xl font-semibold">À regarder maintenant</h3><span className="text-sm text-muted-foreground">{projection.attention.length} élément(s)</span></div><div className="mt-3 grid gap-3 md:grid-cols-2">{projection.attention.map((item) => <article key={item.attentionId} className="rounded-2xl border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.kind.replace(/_/g, " ")}</p><Status state={item.semanticState} /></div><h4 className="mt-3 font-semibold">{item.label}</h4><p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>{item.actionable && onOpenSurface && <button type="button" onClick={() => onOpenSurface(item.targetRef)} className="mt-3 min-h-11 rounded-lg border px-3 py-2 text-sm">Examiner dans son contexte</button>}{visibility.sourceRefs && <p className="mt-3 break-all text-xs text-muted-foreground">Owner : {item.owner} · Source : {item.sourceRef}</p>}</article>)}</div></section>
        <section aria-labelledby="workspace-domains-title"><h3 id="workspace-domains-title" className="text-xl font-semibold">Dimensions de l’étude</h3><p className="mt-1 text-sm text-muted-foreground">Chaque domaine conserve son propre état ; aucun score global n’est calculé.</p><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{projection.domains.map((domain) => <article key={domain.domainId} className="rounded-2xl border p-4"><Status state={domain.state} /><h4 className="mt-3 font-semibold capitalize">{domain.label}</h4><p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{domain.summary}</p>{onOpenSurface && <button type="button" onClick={() => onOpenSurface(domain.targetRef)} className="mt-3 min-h-11 rounded-lg border px-3 py-2 text-sm">Ouvrir</button>}<p className="mt-3 break-all text-xs text-muted-foreground">Owner : {domain.owner} · {domain.sourceRefs.join(", ")}</p></article>)}</div></section>
        <section aria-labelledby="workspace-documents-title"><h3 id="workspace-documents-title" className="text-xl font-semibold">Documents</h3><p className="mt-1 text-sm text-muted-foreground">Chaque projection suit sa générabilité DOC et la version Project qui la fonde.</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{primaryDocuments.map((document) => <article key={document.projection} className="rounded-2xl border p-4"><Status state={documentSemanticState(document)} /><h4 className="mt-3 font-semibold">{document.projection}</h4><p role="status" className="mt-2 text-sm font-medium">{documentStateLabel[document.state]}</p>{document.missing.length > 0 && <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">{document.missing.map((item) => <li key={item}>{item}</li>)}</ul>}<p className="mt-3 break-all text-xs text-muted-foreground">Owner : {document.owner} · Source : {document.sourceRef} · {document.freshness}</p></article>)}</div></section>
      </main>
      <aside className="min-w-0 space-y-5" aria-label="Inspection du projet"><ValidationSummaryPanel summary={validation} mode="EXPERT" /><section className="rounded-xl border bg-card p-5"><h3 className="font-semibold">Traçabilité de la projection</h3><dl className="mt-3 grid gap-2 break-all text-xs text-muted-foreground"><div><dt className="font-medium text-foreground">Workspace</dt><dd>{projection.workspaceProjectionId}</dd></div><div><dt className="font-medium text-foreground">Project</dt><dd>{projection.sourceProjectRef} · {projection.sourceProjectVersion}</dd></div><div><dt className="font-medium text-foreground">Navigation</dt><dd>{projection.trace.navigationRefs.join(" · ")}</dd></div><div><dt className="font-medium text-foreground">Validation</dt><dd>{projection.trace.validationRefs.join(" · ") || "aucun run"}</dd></div><div><dt className="font-medium text-foreground">Limites</dt><dd>{projection.limitations.join(" · ")}</dd></div></dl></section></aside>
    </div>}

    <p className="mt-6 border-t pt-4 text-xs text-muted-foreground">Cette surface est une projection en lecture seule. Le Research Project, QRY, VAL et DOC restent propriétaires de leurs objets et décisions.</p>
  </section>;
}
