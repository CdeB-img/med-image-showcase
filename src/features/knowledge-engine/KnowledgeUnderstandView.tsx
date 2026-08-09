import { BookOpen, CircleAlert, ExternalLink, History, LoaderCircle, RefreshCcw, RotateCcw, Search, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { executeExternalEvidenceSearch } from "./external-evidence/pipeline";
import type { ExternalSearchProvider } from "./external-evidence/types";
import { createKnowledgeSnapshot, deleteKnowledgeSnapshots, loadKnowledgeSnapshots, saveKnowledgeSnapshot, type LoadedKnowledgeSnapshot } from "./persistence";
import { projectUnderstandResult, type ProjectionDepth } from "./understand-projection";
import type { ContextDimensionName, KnowledgeResult } from "./types";

type Props = {
  result: KnowledgeResult;
  sessionId: string;
  contextVersion: number;
  onClarify: (dimension: ContextDimensionName, value: string | null) => void;
  externalProvider?: ExternalSearchProvider;
};

const depthLabels: Record<ProjectionDepth, string> = {
  SYNTHETIC: "Synthétique",
  PROFESSIONAL: "Professionnel",
  EXPERT: "Expert",
};

const stateLabels: Record<LoadedKnowledgeSnapshot["state"], string> = {
  CURRENT: "Version courante",
  STALE_SCHEMA: "Ancien format",
  STALE_PROVIDER_VERSION: "Ancienne version des connaissances",
  STALE_CORPUS: "Corpus modifié depuis cette réponse",
  STALE_QUESTION: "Question différente",
  STALE_CONTEXT: "Contexte différent",
  INVALID: "Snapshot illisible",
};

const Panel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <section className={`min-w-0 break-words rounded-2xl border border-border bg-card p-5 shadow-sm ${className}`}>{children}</section>;

export default function KnowledgeUnderstandView({ result, sessionId, contextVersion, onClarify, externalProvider }: Props) {
  const [depth, setDepth] = useState<ProjectionDepth>("PROFESSIONAL");
  const [runtimeResult, setRuntimeResult] = useState(result);
  const [externalSearchBusy, setExternalSearchBusy] = useState(false);
  const [externalSearchError, setExternalSearchError] = useState<string | null>(null);
  const [history, setHistory] = useState<LoadedKnowledgeSnapshot[]>([]);
  const [selectedHistorical, setSelectedHistorical] = useState<LoadedKnowledgeSnapshot | null>(null);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [clarificationDrafts, setClarificationDrafts] = useState<Record<string, string>>({});
  useEffect(() => {
    setRuntimeResult(result);
    setExternalSearchError(null);
  }, [result]);

  const currentCorpusDigests = useMemo(() => Object.fromEntries(runtimeResult.provenance.map((item) => [item.providerId, item.representationDigest])), [runtimeResult.provenance]);
  const refreshHistory = () => setHistory(loadKnowledgeSnapshots(window.localStorage, {
    registryDigest: runtimeResult.registrySnapshotRef,
    providerVersions: runtimeResult.providerVersions,
    corpusRepresentationDigests: currentCorpusDigests,
    question: runtimeResult.request.originalQuestion,
    contextVersion,
  }));

  useEffect(() => {
    try {
      const snapshot = createKnowledgeSnapshot({ sessionId, contextVersion, result: runtimeResult, projectionSettings: { depth, openDisclosure: "ANSWER" } });
      saveKnowledgeSnapshot(window.localStorage, snapshot);
      setPersistenceError(null);
      setHistory(loadKnowledgeSnapshots(window.localStorage, {
        registryDigest: runtimeResult.registrySnapshotRef,
        providerVersions: runtimeResult.providerVersions,
        corpusRepresentationDigests: currentCorpusDigests,
        question: runtimeResult.request.originalQuestion,
        contextVersion,
      }));
    } catch {
      setPersistenceError("Cette réponse n’a pas été mémorisée localement, car son contenu est sensible ou le stockage du navigateur est indisponible.");
    }
  }, [contextVersion, currentCorpusDigests, depth, runtimeResult, sessionId]);

  const displayedResult = selectedHistorical?.snapshot.result ?? runtimeResult;
  const displayedDepth = selectedHistorical?.snapshot.projectionSettings.depth ?? depth;
  const projection = useMemo(() => projectUnderstandResult(displayedResult, displayedDepth), [displayedDepth, displayedResult]);
  const externalEvidence = displayedResult.externalEvidence;
  const displayedGaps = projection.gaps.map((gap) => externalEvidence
    ? gap.replace(
      "Une recherche scientifique externe séparée serait nécessaire ; elle n’a pas été réalisée.",
      "Ce gap interne a déclenché la recherche externe présentée séparément ; celle-ci ne ferme pas automatiquement le gap.",
    )
    : gap);
  const canOfferExternalSearch = !selectedHistorical
    && !externalEvidence
    && displayedResult.coverageMap.externalResearchRequired
    && displayedResult.queryPlan.domainGate === "IN_SCOPE"
    && displayedResult.request.sensitivityClassification === "PUBLIC";

  const runExternalSearch = async (forceRefresh = false) => {
    setExternalSearchBusy(true);
    setExternalSearchError(null);
    try {
      const next = await executeExternalEvidenceSearch({
        result: runtimeResult,
        policy: "EXTERNAL_ALLOWED",
        authorizedBy: "USER",
        provider: externalProvider,
        storage: window.localStorage,
        forceRefresh,
      });
      setRuntimeResult(next);
    } catch {
      setExternalSearchError("La recherche externe n’a pas pu être préparée avec les termes scientifiques gouvernés. Le résultat interne est conservé.");
    } finally {
      setExternalSearchBusy(false);
    }
  };

  return <div className="mt-8" aria-live="polite">
    {selectedHistorical && <div role="status" className="mb-5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
      <p className="font-semibold">Vous consultez une réponse historique — {stateLabels[selectedHistorical.state]}</p>
      <p className="mt-1 text-sm">Produite le {new Date(selectedHistorical.snapshot.timestamp).toLocaleString("fr-FR")}. Elle n’est jamais présentée comme la réponse courante.</p>
      {selectedHistorical.reasons.map((reason) => <p className="mt-1 text-sm" key={reason}>• {reason}</p>)}
      <button onClick={() => setSelectedHistorical(null)} className="mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><RotateCcw className="h-4 w-4" /> Recalculer avec les connaissances courantes</button>
    </div>}

    <section aria-labelledby="knowledge-answer-title" className="max-w-4xl rounded-2xl rounded-bl-sm bg-primary/10 p-5 sm:p-6">
      <div className="flex items-start gap-3"><Sparkles className="mt-1 h-5 w-5 shrink-0 text-primary" /><div className="min-w-0">
        <p className="text-sm font-semibold text-primary">{projection.coverageLabel}</p>
        <h2 id="knowledge-answer-title" className="mt-2 text-xl font-semibold">{projection.title}</h2>
        <p className="mt-3">{projection.requestSummary}</p>
        <p className="mt-3 font-medium">{projection.answer}</p>
        <p className="mt-3 text-sm text-muted-foreground">{projection.boundedConclusion}</p>
      </div></div>
    </section>

    <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Profondeur de la réponse">
      <span className="text-sm text-muted-foreground">Profondeur :</span>
      {(Object.keys(depthLabels) as ProjectionDepth[]).map((item) => <button key={item} aria-pressed={displayedDepth === item} disabled={Boolean(selectedHistorical)} onClick={() => setDepth(item)} className={`rounded-full border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring ${displayedDepth === item ? "border-primary bg-primary text-primary-foreground" : "bg-background"}`}>{depthLabels[item]}</button>)}
    </div>

    {projection.comparison && <Panel className="mt-6">
      <h2 className="text-xl font-semibold">Comparaison scientifique</h2>
      <p className="mt-2 text-sm text-muted-foreground">{projection.comparison.status}. Seuls les axes documentés sont remplis ; une branche absente reste visible.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">{projection.comparison.branches.map((branch) => <article key={branch.id} className="rounded-xl border p-4">
        <h3 className="font-semibold">{branch.label}</h3><p className="mt-2 text-sm text-primary">{branch.status}</p><p className="mt-2 text-sm text-muted-foreground">{branch.explanation}</p>
        {branch.documentedPoints.length ? branch.documentedPoints.map((point) => <p className="mt-3 text-sm" key={point}>• {point}</p>) : <p className="mt-3 text-sm">Aucun point comparatif direct n’est documenté pour cette branche.</p>}
      </article>)}</div>
    </Panel>}

    <details open={displayedDepth !== "SYNTHETIC"} className="mt-6 rounded-2xl border bg-card p-5">
      <summary className="cursor-pointer text-lg font-semibold focus-visible:ring-2 focus-visible:ring-ring">Comprendre pourquoi</summary>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div><h3 className="font-semibold">Objets et relations conservés</h3>{projection.concepts.map((item) => <p className="mt-2 text-sm" key={item}>• {item}</p>)}{projection.relations.map((item) => <p className="mt-3 text-sm" key={item.label}><strong>{item.label}</strong><br/><span className="text-muted-foreground">{item.support}</span></p>)}</div>
        <div><h3 className="font-semibold">Éléments applicables</h3>{projection.supportedItems.length ? projection.supportedItems.map((item) => <article className="mt-3 rounded-xl border p-4" key={item.id}><p className="text-xs font-medium text-primary">{item.status} · {item.applicability}</p><p className="mt-2 text-sm">{item.text}</p></article>) : <p className="mt-3 text-sm text-muted-foreground">Aucun élément applicable n’est promu dans ce contexte.</p>}</div>
      </div>
      {projection.methodologicalImplications.length > 0 && <div className="mt-5"><h3 className="font-semibold">Implications méthodologiques</h3>{projection.methodologicalImplications.map((item) => <p className="mt-2 text-sm" key={item}>• {item}</p>)}</div>}
    </details>

    <details open={projection.clarifications.length > 0} className="mt-4 rounded-2xl border bg-card p-5">
      <summary className="cursor-pointer text-lg font-semibold focus-visible:ring-2 focus-visible:ring-ring">Limites, couverture et clarifications</summary>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">{projection.coverage.map((item) => <article key={item.id} className="rounded-xl border p-4"><h3 className="font-semibold">{item.label}</h3><p className="mt-1 text-sm text-primary">{item.status}</p><p className="mt-2 text-sm text-muted-foreground">{item.explanation}</p>{item.externalResearchRequired && <p className="mt-2 text-xs">{externalEvidence ? "Recherche externe exécutée et présentée séparément ci-dessous." : "Recherche externe future nécessaire — non réalisée."}</p>}</article>)}</div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2"><div><h3 className="font-semibold">Limites</h3>{projection.limitations.map((item) => <p className="mt-2 text-sm" key={item}>• {item}</p>)}</div><div><h3 className="font-semibold">Zones non couvertes</h3>{displayedGaps.map((item) => <p className="mt-2 text-sm text-amber-700 dark:text-amber-200" key={item}>• {item}</p>)}</div></div>
      {projection.clarifications.length > 0 && <div className="mt-6"><h3 className="text-lg font-semibold">Questions qui peuvent modifier le raisonnement</h3>{projection.clarifications.map((item, index) => <article className="mt-4 rounded-xl border p-4" key={item.id}>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Question {index + 1} sur environ {projection.clarifications.length}</p><h4 className="mt-2 font-semibold">{item.question}</h4>
        <div className="mt-3 grid gap-2 text-sm md:grid-cols-2"><p><strong>Pourquoi :</strong> {item.reason}</p><p><strong>Ce que cela influence :</strong> {item.influence}</p></div>
        <div className="mt-3 flex flex-wrap gap-2">{item.suggestions.map((suggestion) => <button key={suggestion} onClick={() => onClarify(item.dimension, suggestion === "Je ne sais pas" ? null : suggestion)} className="rounded-full border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring">{suggestion}</button>)}</div>
        <label htmlFor={`knowledge-clarification-${item.id}`} className="mt-4 block text-sm font-medium">Ou répondre librement</label><div className="mt-2 flex flex-col gap-2 sm:flex-row"><input id={`knowledge-clarification-${item.id}`} value={clarificationDrafts[item.id] ?? ""} onChange={(event) => setClarificationDrafts((current) => ({ ...current, [item.id]: event.target.value.slice(0, 300) }))} className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 focus-visible:ring-2 focus-visible:ring-ring" /><button disabled={!clarificationDrafts[item.id]?.trim()} onClick={() => onClarify(item.dimension, clarificationDrafts[item.id].trim())} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">Recalculer</button></div>
      </article>)}</div>}
      {canOfferExternalSearch && <div className="mt-6 rounded-xl border border-primary/40 bg-primary/5 p-4">
        <h3 className="font-semibold">Les connaissances internes NOXIA ne couvrent pas suffisamment ce point.</h3>
        <p className="mt-2 text-sm text-muted-foreground">Une recherche PubMed peut découvrir des publications candidates. Elles resteront séparées du corpus NOXIA, sans modifier la conclusion interne.</p>
        <button disabled={externalSearchBusy} onClick={() => void runExternalSearch()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
          {externalSearchBusy ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Recherche documentaire en cours…</> : <><Search className="h-4 w-4" /> Rechercher les publications disponibles</>}
        </button>
      </div>}
      {externalSearchError && <div role="alert" className="mt-4 flex gap-2 rounded-lg border border-amber-500/40 p-3 text-sm"><CircleAlert className="h-5 w-5 shrink-0" />{externalSearchError}</div>}
    </details>

    <details className="mt-4 rounded-2xl border bg-card p-5">
      <summary className="cursor-pointer text-lg font-semibold focus-visible:ring-2 focus-visible:ring-ring">Preuves internes — corpus NOXIA</summary>
      <p className="mt-3 text-sm text-muted-foreground">Les sources, versions et localisateurs internes restent secondaires mais accessibles. Aucun identifiant technique d’exécution n’est nécessaire pour lire la réponse.</p>
      {projection.sources.length ? projection.sources.map((source) => <article className="mt-4 border-l-2 border-primary pl-4" key={source.id}><h3 className="font-semibold">{source.label}</h3><p className="mt-1 text-sm">{source.contribution}</p>{source.locator && <p className="mt-1 break-words text-xs text-muted-foreground">Localisateur : {source.locator}</p>}</article>) : <p className="mt-4 text-sm">Aucune source n’est citée lorsqu’aucun contenu applicable n’a été retenu.</p>}
    </details>

    {externalEvidence && <details open className="mt-4 rounded-2xl border border-sky-500/40 bg-card p-5">
      <summary className="cursor-pointer text-lg font-semibold focus-visible:ring-2 focus-visible:ring-ring">Preuves externes candidates — recherche documentaire</summary>
      <div className="mt-4 rounded-xl bg-sky-500/10 p-4 text-sm">
        <p className="font-semibold">Statut : éléments candidats, non intégrés au corpus NOXIA</p>
        <p className="mt-1 text-muted-foreground">Recherche PubMed exécutée le {new Date(externalEvidence.searchExecutedAt).toLocaleString("fr-FR")}. {externalEvidence.cache.state === "HIT_HISTORICAL" ? "Résultat historique du cache, non présenté comme une nouvelle recherche." : "La requête exacte et l’ordre reçu sont conservés dans la trace."}</p>
      </div>
      {externalEvidence.status === "SOURCE_UNAVAILABLE" && <div role="alert" className="mt-4 rounded-xl border border-amber-500/40 p-4"><p className="font-semibold">PubMed est temporairement indisponible.</p><p className="mt-2 text-sm text-muted-foreground">Cette panne n’est pas interprétée comme une absence de connaissance scientifique. La réponse interne reste disponible.</p><button disabled={externalSearchBusy || Boolean(selectedHistorical)} onClick={() => void runExternalSearch(true)} className="mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"><RefreshCcw className="h-4 w-4" /> Réessayer</button></div>}
      {externalEvidence.status === "NO_MATCH" && <p className="mt-4 text-sm">Aucune correspondance n’a été retournée par cette requête PubMed bornée. Cela ne prouve pas l’absence de littérature.</p>}
      {externalEvidence.errors.length > 0 && externalEvidence.status !== "SOURCE_UNAVAILABLE" && <div className="mt-4 rounded-xl border border-amber-500/40 p-4 text-sm"><p className="font-semibold">Recherche partielle</p>{externalEvidence.errors.map((item, index) => <p className="mt-1 text-muted-foreground" key={`${item.code}:${item.branchId}:${index}`}>• {item.message}</p>)}</div>}
      <div className="mt-5 space-y-4">{externalEvidence.candidateSources.map((source) => <article className="rounded-xl border p-4" key={source.sourceIdentity}>
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">Source candidate · {source.eligibility.replace(/_/g, " ").toLocaleLowerCase("fr-FR")}</p>
        <h3 className="mt-2 font-semibold">{source.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{source.authors.slice(0, 4).join(", ") || "Auteurs non disponibles"}{source.publicationYear ? ` · ${source.publicationYear}` : ""}{source.journal ? ` · ${source.journal}` : ""}</p>
        <p className="mt-2 text-xs">PMID {source.pmid}{source.doi ? ` · DOI ${source.doi}` : ""}{source.pmcid ? ` · PMCID ${source.pmcid}` : ""}</p>
        <a href={source.accessLocator} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 rounded-sm text-sm text-primary underline focus-visible:ring-2 focus-visible:ring-ring">Consulter la notice PubMed <ExternalLink className="h-3.5 w-3.5" /></a>
        {externalEvidence.candidateAssertions.filter((assertion) => assertion.sourceIdentity === source.sourceIdentity).map((assertion) => <div className="mt-4 rounded-lg bg-muted/60 p-3 text-sm" key={assertion.assertionId}><p className="font-medium">Assertion candidate depuis la conclusion structurée</p><p className="mt-2">{assertion.claim}{assertion.supportWasTruncated ? "…" : ""}</p><p className="mt-2 text-xs text-muted-foreground">{assertion.locator} · {assertion.applicability.replace(/_/g, " ").toLocaleLowerCase("fr-FR")} · niveau de preuve non attribué</p></div>)}
      </article>)}</div>
      {externalEvidence.excludedSources.length > 0 && <div className="mt-5"><h3 className="font-semibold">Sources écartées de l’extraction positive</h3>{externalEvidence.excludedSources.map((source, index) => <article className="mt-3 rounded-xl border border-amber-500/40 p-4 text-sm" key={`${source.sourceIdentity}:${source.eligibility}:${index}`}><p className="font-semibold">{source.title}</p><p className="mt-1 text-amber-700 dark:text-amber-200">{source.eligibility.replace(/_/g, " ")} — {source.exclusionReasons.join(" ")}</p></article>)}</div>}
      {externalEvidence.mixedSynthesis.divergences.map((item) => <div role="alert" className="mt-4 rounded-xl border border-red-500/40 p-4 text-sm" key={item}><strong>Divergence d’identité documentaire :</strong> {item}</div>)}
      <p className="mt-5 text-sm text-muted-foreground">{externalEvidence.mixedSynthesis.limitation}</p>
    </details>}

    <details className="mt-4 rounded-2xl border bg-card p-5" onToggle={(event) => { if (event.currentTarget.open) refreshHistory(); }}>
      <summary className="cursor-pointer text-lg font-semibold focus-visible:ring-2 focus-visible:ring-ring"><span className="inline-flex items-center gap-2"><History className="h-5 w-5" /> Historique local des réponses</span></summary>
      <p className="mt-3 text-sm text-muted-foreground">Les réponses sont mémorisées uniquement dans ce navigateur, avec leurs versions de corpus. Une version ancienne reste historique.</p>
      {persistenceError && <div role="alert" className="mt-3 flex gap-2 rounded-lg border border-amber-500/40 p-3 text-sm"><CircleAlert className="h-5 w-5 shrink-0" />{persistenceError}</div>}
      <div className="mt-4 space-y-3">{history.filter((item) => item.state !== "INVALID").map((item) => <article className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between" key={`${item.snapshot.sessionId}:${item.snapshot.requestId}:${item.snapshot.contextVersion}:${item.snapshot.result.resultDigest}:${item.snapshot.timestamp}`}><div className="min-w-0"><p className="font-medium">{item.snapshot.request.originalQuestion}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(item.snapshot.timestamp).toLocaleString("fr-FR")} · {stateLabels[item.state]}</p></div><button onClick={() => setSelectedHistorical(item)} className="inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm"><BookOpen className="h-4 w-4" /> Consulter</button></article>)}</div>
      <button onClick={() => { deleteKnowledgeSnapshots(window.localStorage); setHistory([]); setSelectedHistorical(null); }} className="mt-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-destructive"><Trash2 className="h-4 w-4" /> Effacer tout l’historique Knowledge</button>
    </details>
  </div>;
}
