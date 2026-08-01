import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowUpRight,
  Beaker,
  BookOpen,
  CheckCircle2,
  CircleDot,
  FileQuestion,
  Filter,
  Info,
  Link2,
  ListFilter,
  RefreshCcw,
  Scale,
  Search,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import scientificExplorerData from "./scientific-explorer-data";
import ScientificIllustration from "./ScientificIllustration";
import {
  deriveExplorerView,
  EMPTY_EXPLORER_STATE,
  formatAssertion,
  formatDisplayItem,
  formatScientificCode,
  parseExplorerState,
  serializeExplorerState,
  shortAuthors,
  sourceHref,
  type ExplorerState,
} from "./model";
import type {
  ExplorerAssertion,
  ExplorerConcept,
  ExplorerEvidenceLink,
  ExplorerFacetOption,
} from "./types";

type FacetSelectProps = {
  id: string;
  label: string;
  description: string;
  value: string | null;
  options: Array<ExplorerFacetOption & { assertionCount: number }>;
  allLabel: string;
  onChange: (value: string | null) => void;
};

type IntentLinkProps = {
  href: string;
  title: string;
  description: string;
  icon: typeof Search;
};

const FacetSelect = ({ id, label, description, value, options, allLabel, onChange }: FacetSelectProps) => (
  <div className="space-y-2">
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-foreground">{label}</label>
      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
    <div className="relative">
      <select
        id={id}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
        className="h-11 w-full appearance-none rounded-lg border border-border bg-background px-3 pr-10 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.key} value={option.key}>{option.label} ({option.assertionCount})</option>
        ))}
      </select>
      <ListFilter aria-hidden="true" className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-muted-foreground" />
    </div>
  </div>
);

const IntentLink = ({ href, title, description, icon: Icon }: IntentLinkProps) => (
  <a
    href={href}
    className="group rounded-2xl border border-border bg-card/55 p-4 transition hover:-translate-y-0.5 hover:border-primary/35 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-5"
  >
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/15">
      <Icon className="h-4 w-4" aria-hidden="true" />
    </span>
    <span className="mt-4 block font-semibold text-foreground">{title}</span>
    <span className="mt-1.5 block text-sm leading-6 text-muted-foreground">{description}</span>
  </a>
);

const assertionTone = (assertion: ExplorerAssertion) => {
  if (assertion.polarity === "NEGATIVE") return "border-rose-400/25 bg-rose-400/[0.035]";
  if (assertion.polarity === "QUALIFIED") return "border-amber-400/25 bg-amber-400/[0.035]";
  return "border-primary/15 bg-background/45";
};

const uniqueLimitations = (assertions: ExplorerAssertion[]) => [
  ...new Map(assertions.flatMap((assertion) => assertion.limitations).map((item) => [item.id, item])).values(),
];

const subjectConcept = [...scientificExplorerData.concepts]
  .filter((concept) => concept.type === "SoftwareMethod")
  .sort((left, right) => right.assertionCount - left.assertionCount)[0] ?? scientificExplorerData.concepts[0];

const conceptJourney = [
  {
    eyebrow: "Le sujet",
    title: "Délimiter",
    concepts: subjectConcept ? [subjectConcept] : [],
  },
  {
    eyebrow: "La référence",
    title: "Établir un repère",
    concepts: scientificExplorerData.concepts.filter((concept) => concept.type === "Observation" || (concept.type === "SoftwareMethod" && concept.id !== subjectConcept?.id)),
  },
  {
    eyebrow: "L’évaluation",
    title: "Mesurer",
    concepts: scientificExplorerData.concepts.filter((concept) => concept.type === "QualityMetric"),
  },
  {
    eyebrow: "L’interprétation",
    title: "Vérifier la portée",
    concepts: scientificExplorerData.concepts.filter((concept) => concept.type === "QualityAttribute"),
  },
].filter((stage) => stage.concepts.length > 0);

const assertionPriority = [
  "SHOULD_BE_EVALUATED_WITH",
  "REQUIRES_METRIC_SELECTION_FROM",
  "SHOULD_BE_ASSESSED_FOR",
  "IS_NOT_ESTABLISHED_BY",
  "HAS_LIMITATION",
];

const ScientificExplorer = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => parseExplorerState(searchParams, scientificExplorerData), [searchParams]);
  const view = useMemo(() => deriveExplorerView(scientificExplorerData, state), [state]);
  const evidenceByAssertion = useMemo(() => {
    const result = new Map<string, ExplorerEvidenceLink[]>();
    for (const evidence of view.evidenceLinks) result.set(evidence.assertionId, [...(result.get(evidence.assertionId) ?? []), evidence]);
    return result;
  }, [view.evidenceLinks]);
  const sourceById = useMemo(() => new Map(scientificExplorerData.sources.map((source) => [source.id, source])), []);
  const selectedConcept = state.conceptKey
    ? scientificExplorerData.concepts.find((concept) => concept.key === state.conceptKey) ?? subjectConcept
    : subjectConcept;
  const keyAssertions = useMemo(() => [...view.assertions]
    .sort((left, right) => {
      const leftPriority = assertionPriority.indexOf(left.predicate);
      const rightPriority = assertionPriority.indexOf(right.predicate);
      return (leftPriority === -1 ? assertionPriority.length : leftPriority)
        - (rightPriority === -1 ? assertionPriority.length : rightPriority);
    })
    .slice(0, 3), [view.assertions]);
  const comparisonConcepts = view.relatedConcepts.filter((concept) => concept.type === "QualityMetric");

  const updateState = (field: keyof ExplorerState, value: string | null) => {
    setSearchParams(serializeExplorerState({ ...state, [field]: value }));
  };

  const focusConcept = (concept: ExplorerConcept) => {
    setSearchParams(serializeExplorerState({ ...EMPTY_EXPLORER_STATE, conceptKey: concept.key }));
  };

  const reset = () => setSearchParams(serializeExplorerState(EMPTY_EXPLORER_STATE));

  const renderAssertionGroup = (
    groupId: string,
    title: string,
    description: string,
    assertions: ExplorerAssertion[],
    icon: typeof CheckCircle2,
  ) => {
    if (!assertions.length) return null;
    const Icon = icon;
    return (
      <details className="group rounded-2xl border border-border bg-card/45">
        <summary className="flex cursor-pointer list-none items-start gap-3 p-5 outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-6">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-foreground">{title}</span>
              <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">{assertions.length}</span>
            </span>
            <span className="mt-1 block text-sm leading-6 text-muted-foreground">{description}</span>
          </span>
        </summary>

        <div className="space-y-3 border-t border-border p-4 sm:p-6">
          {assertions.map((assertion) => {
            const evidence = evidenceByAssertion.get(assertion.id) ?? [];
            return (
              <article key={assertion.id} className={`rounded-xl border p-4 sm:p-5 ${assertionTone(assertion)}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">{assertion.subjectLabel}</Badge>
                  <Badge variant="outline" className="border-border bg-background/50 text-muted-foreground">
                    {formatScientificCode(assertion.polarity)}
                  </Badge>
                </div>
                <p className="mt-3 text-[15px] leading-7 text-foreground">{formatAssertion(assertion)}</p>

                {assertion.limitations.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2" aria-label="Limites rattachées à la conclusion">
                    {assertion.limitations.map((limitation) => (
                      <span key={limitation.id} className="rounded-full border border-amber-300/20 bg-amber-300/5 px-2.5 py-1 text-xs text-amber-100/80">
                        {formatDisplayItem(limitation)}
                      </span>
                    ))}
                  </div>
                )}

                {evidence.length > 0 && (
                  <details className="mt-4 rounded-lg border border-border/80 bg-background/55">
                    <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-medium text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      Voir la justification scientifique ({evidence.length})
                    </summary>
                    <ul className="space-y-3 border-t border-border/70 p-3">
                      {evidence.map((item) => {
                        const source = sourceById.get(item.sourceId);
                        const href = source ? sourceHref(source) : null;
                        return (
                          <li key={item.id} className="text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-foreground">{formatScientificCode(item.relationType)}</span>
                              <span className="text-xs text-muted-foreground">Confiance {formatScientificCode(item.confidence).toLocaleLowerCase("fr")}</span>
                            </div>
                            {source && (
                              <p className="mt-2 leading-6 text-muted-foreground">
                                {href ? (
                                  <a href={href} target="_blank" rel="noreferrer" className="font-medium text-primary underline-offset-4 hover:underline">
                                    {source.title}<ArrowUpRight className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" />
                                  </a>
                                ) : <span className="font-medium text-foreground">{source.title}</span>}
                                {source.year ? ` — ${source.year}` : ""}
                              </p>
                            )}
                            <details className="mt-2 text-xs text-muted-foreground">
                              <summary className="cursor-pointer rounded font-medium text-foreground/80 outline-none focus-visible:ring-2 focus-visible:ring-primary">Voir l’extrait et le localisateur</summary>
                              <p className="mt-2 break-words leading-5"><span className="font-medium">Localisateur :</span> {item.locator ?? "Non renseigné"}</p>
                              {item.analyticalSummary && <p className="mt-2 leading-5"><span className="font-medium">Résumé analytique :</span> {item.analyticalSummary}</p>}
                              {assertion.statementText && <p className="mt-2 leading-5"><span className="font-medium">Formulation structurée conservée :</span> {assertion.statementText}</p>}
                            </details>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                )}
              </article>
            );
          })}
        </div>
      </details>
    );
  };

  return (
    <div className="space-y-10 sm:space-y-14">
      <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-card via-card to-primary/[0.08] px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
        <div aria-hidden="true" className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <Search className="h-3.5 w-3.5" aria-hidden="true" /> Dossier scientifique interactif
          </div>
          <h1 className="mt-5 max-w-4xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Comprendre et évaluer la segmentation en imagerie médicale
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-foreground/90 sm:text-lg sm:leading-8">
            {subjectConcept?.description}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
            Pourquoi l’évaluer avec soin ? Parce qu’une seule métrique ne représente pas toutes les propriétés utiles de validation : explorez les métriques disponibles, l’accord entre annotations et les limites propres à chaque tâche.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border bg-background/50 px-3 py-1.5">{scientificExplorerData.assertions.length} conclusions documentées</span>
            <span className="rounded-full border border-border bg-background/50 px-3 py-1.5">{scientificExplorerData.sources.length} publications accessibles</span>
            <span className="rounded-full border border-border bg-background/50 px-3 py-1.5">Aucune recommandation clinique</span>
          </div>
        </div>
      </section>

      <ScientificIllustration illustration={scientificExplorerData.illustration} />

      <section aria-labelledby="explorer-intentions">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Choisir son point d’entrée</p>
          <h2 id="explorer-intentions" className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Je souhaite…</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">Commencez par votre question. Les détails techniques restent disponibles lorsque vous en avez besoin.</p>
        </div>
        <nav className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Intentions d’exploration">
          <IntentLink href="#comprendre" title="Comprendre le sujet" description="Partir d’une définition et des messages essentiels." icon={Search} />
          <IntentLink href="#choisir" title="Choisir un angle" description="Cibler une tâche, une métrique ou un concept." icon={Filter} />
          <IntentLink href="#comparer" title="Comparer les repères" description="Voir ce que mesurent les approches et leurs limites." icon={Scale} />
          <IntentLink href="#verifier" title="Vérifier les conclusions" description="Remonter aux preuves localisées et aux publications." icon={ShieldCheck} />
        </nav>
      </section>

      <section id="comprendre" aria-labelledby="explorer-understand" className="scroll-mt-24 rounded-3xl border border-border bg-card/45 p-5 sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Comprendre en moins d’une minute</p>
            <h2 id="explorer-understand" className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{selectedConcept?.label ?? scientificExplorerData.selectedDomain.label}</h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">{selectedConcept?.description ?? scientificExplorerData.selectedDomain.description}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Ce que le corpus permet de retenir</p>
            {keyAssertions.length ? (
              <ul className="mt-4 space-y-3">
                {keyAssertions.map((assertion) => (
                  <li key={assertion.id} className="flex gap-3 rounded-xl border border-border/80 bg-background/45 p-4 text-sm leading-7 text-foreground/90">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>{formatAssertion(assertion)}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-4 text-sm leading-7 text-muted-foreground">Le corpus ne permet pas de formuler de message pour cette sélection.</p>}
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Du sujet à son interprétation</p>
            <h3 className="mt-2 text-xl font-semibold text-foreground">Les grands repères du domaine</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">Les concepts sont ordonnés selon leur rôle documenté dans le corpus, de la méthode jusqu’à l’évaluation de sa portée.</p>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {conceptJourney.map((stage) => (
              <div key={stage.title} className="rounded-2xl border border-border bg-background/45 p-4 sm:p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">{stage.eyebrow}</p>
                <p className="mt-1 font-semibold text-foreground">{stage.title}</p>
                <div className="mt-4 space-y-2">
                  {stage.concepts.map((concept) => (
                    <button
                      key={concept.id}
                      type="button"
                      onClick={() => focusConcept(concept)}
                      className="block w-full rounded-lg border border-border/80 bg-card/60 px-3 py-2 text-left text-sm text-muted-foreground transition hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {concept.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="choisir" aria-labelledby="explorer-choose" className="scroll-mt-24">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Choisir un angle d’exploration</p>
          <h2 id="explorer-choose" className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Affiner la question, pas parcourir une base</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">Chaque choix réorganise la synthèse, les limites et les justifications scientifiques visibles plus bas.</p>
        </div>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(250px,0.7fr)_minmax(0,2fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-border bg-card/60 p-5 lg:sticky lg:top-24 lg:p-6">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Filter className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-semibold text-foreground">Ma question porte sur…</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Les options apparaissent uniquement lorsqu’elles changent réellement le résultat.</p>
              </div>
            </div>

            <div className="mt-6 space-y-6">
              {scientificExplorerData.facets.tasks.length > 0 && (
                <FacetSelect
                  id="explorer-task"
                  label="Type de tâche"
                  description="Méthode ou tâche de segmentation documentée."
                  value={state.taskKey}
                  options={scientificExplorerData.facets.tasks}
                  allLabel="Toutes les tâches"
                  onChange={(value) => updateState("taskKey", value)}
                />
              )}
              {scientificExplorerData.facets.metrics.length > 0 && (
                <FacetSelect
                  id="explorer-metric"
                  label="Métrique"
                  description="Mesure d’évaluation explicitement rattachée aux conclusions."
                  value={state.metricKey}
                  options={scientificExplorerData.facets.metrics}
                  allLabel="Toutes les métriques"
                  onChange={(value) => updateState("metricKey", value)}
                />
              )}
              {scientificExplorerData.facets.evidenceTypes.length > 0 && (
                <FacetSelect
                  id="explorer-evidence"
                  label="Type de preuve"
                  description="Nature méthodologique de la source exploitée."
                  value={state.evidenceTypeKey}
                  options={scientificExplorerData.facets.evidenceTypes.map((option) => ({ ...option, label: formatScientificCode(option.key) }))}
                  allLabel="Tous les types de preuve"
                  onChange={(value) => updateState("evidenceTypeKey", value)}
                />
              )}
              {scientificExplorerData.concepts.length > 0 && (
                <FacetSelect
                  id="explorer-concept"
                  label="Concept"
                  description="Repère scientifique associé à la question."
                  value={state.conceptKey}
                  options={scientificExplorerData.concepts.map((concept) => ({ ...concept, id: concept.id, key: concept.key, label: concept.label }))}
                  allLabel="Tous les concepts"
                  onChange={(value) => updateState("conceptKey", value)}
                />
              )}
            </div>

            <Button type="button" variant="outline" className="mt-6 w-full" onClick={reset} disabled={!view.isFiltered}>
              <RefreshCcw className="h-4 w-4" aria-hidden="true" /> Effacer les filtres
            </Button>

            <p className="mt-6 flex gap-2 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
              <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
              Cette lecture peut être copiée et retrouvée grâce à son URL.
            </p>
          </aside>

          <div className="min-w-0 space-y-6">
            <section aria-live="polite" aria-atomic="true" className="rounded-2xl border border-primary/15 bg-gradient-to-br from-card/70 to-primary/[0.035] p-5 sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Ce que cette sélection permet de dire</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{view.synthesisLabel}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                    {view.hasResults
                      ? `${view.assertions.length} conclusion${view.assertions.length > 1 ? "s" : ""} documentée${view.assertions.length > 1 ? "s" : ""} par ${view.sources.length} publication${view.sources.length > 1 ? "s" : ""}, avec ${view.limitations.length} limite${view.limitations.length > 1 ? "s" : ""} explicitement conservée${view.limitations.length > 1 ? "s" : ""}.`
                      : "Le corpus ne contient pas de conclusion applicable à cette combinaison."}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary">Confiance {formatScientificCode(view.confidence).toLocaleLowerCase("fr")}</Badge>
                  {view.convergence && <Badge variant="outline">{formatScientificCode(view.convergence)}</Badge>}
                </div>
              </div>

              {view.activeFilterLabels.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2" aria-label="Angles actifs">
                  {view.activeFilterLabels.map((label) => <span key={label} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{label}</span>)}
                </div>
              )}

              {view.hasResults && keyAssertions.length > 0 && (
                <div className="mt-6 border-t border-border pt-5">
                  <p className="text-sm font-semibold text-foreground">Messages essentiels</p>
                  <ul className="mt-3 space-y-3">
                    {keyAssertions.map((assertion) => (
                      <li key={assertion.id} className="flex gap-3 text-sm leading-7 text-muted-foreground">
                        <CircleDot className="mt-1.5 h-3 w-3 shrink-0 text-primary" aria-hidden="true" />
                        <span>{formatAssertion(assertion)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
                <span>{view.assertions.length} conclusion{view.assertions.length > 1 ? "s" : ""}</span>
                <span>{view.evidenceLinks.length} justification{view.evidenceLinks.length > 1 ? "s" : ""}</span>
                <span>{view.sources.length} publication{view.sources.length > 1 ? "s" : ""}</span>
              </div>
            </section>

            {!view.hasResults && (
              <section className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.05] p-6 sm:p-8" role="status">
                <div className="flex items-start gap-4">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300"><FileQuestion className="h-5 w-5" aria-hidden="true" /></span>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Données insuffisantes pour cette combinaison</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">L’absence de résultat est conservée comme telle. Modifiez un angle ou revenez à la vue générale ; aucune conclusion n’est extrapolée.</p>
                    <Button type="button" variant="outline" size="sm" className="mt-4" onClick={reset}>Revenir à la vue générale</Button>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </section>

      <section id="comparer" aria-labelledby="explorer-compare" className="scroll-mt-24 rounded-3xl border border-border bg-card/45 p-5 sm:p-8 lg:p-10">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Comparer</p>
          <h2 id="explorer-compare" className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Ce que les repères mesurent — et ce qu’ils ne disent pas seuls</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">La comparaison reste documentaire : elle rapproche les définitions et limites réellement présentes, sans fabriquer de classement ni de performance agrégée.</p>
        </div>

        {comparisonConcepts.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {comparisonConcepts.map((concept) => {
              const conceptAssertions = view.assertions.filter((assertion) => assertion.conceptIds.includes(concept.id));
              const limitations = uniqueLimitations(conceptAssertions);
              return (
                <article key={concept.id} className="flex flex-col rounded-2xl border border-border bg-background/45 p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">Repère d’évaluation</p>
                  <h3 className="mt-2 text-lg font-semibold text-foreground">{concept.label}</h3>
                  <p className="mt-3 flex-1 text-sm leading-7 text-muted-foreground">{concept.description}</p>
                  <div className="mt-4 border-t border-border pt-4">
                    <p className="text-xs font-semibold text-foreground">Limites documentées</p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {limitations.length ? limitations.map(formatDisplayItem).join(" · ") : "Aucune limite spécifique localisée dans cette sélection."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => focusConcept(concept)}
                    className="mt-5 text-left text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Explorer {concept.label}
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-border bg-background/45 p-5">
            <p className="text-sm leading-7 text-muted-foreground">Cette sélection n’expose pas plusieurs repères d’évaluation comparables. Revenez à la vue générale pour retrouver les métriques documentées.</p>
            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={reset}>Voir la comparaison générale</Button>
          </div>
        )}
      </section>

      <section aria-labelledby="explorer-cautions">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Interpréter avec prudence</p>
          <h2 id="explorer-cautions" className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Limites, absences et questions ouvertes</h2>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-amber-400/20 bg-card/50 p-5 sm:p-6">
            <h3 className="flex items-center gap-2 font-semibold text-foreground"><TriangleAlert className="h-4 w-4 text-amber-300" aria-hidden="true" /> Limites documentées</h3>
            {view.limitations.length ? (
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                {view.limitations.map((item) => <li key={item.id} className="flex gap-2 leading-6"><CircleDot className="mt-1.5 h-3 w-3 shrink-0 text-amber-300" aria-hidden="true" />{formatDisplayItem(item)}</li>)}
              </ul>
            ) : <p className="mt-4 text-sm leading-6 text-muted-foreground">Aucune limitation n’est localisée dans les conclusions affichées.</p>}
          </div>
          <div className="rounded-2xl border border-sky-400/20 bg-card/50 p-5 sm:p-6">
            <h3 className="flex items-center gap-2 font-semibold text-foreground"><AlertCircle className="h-4 w-4 text-sky-300" aria-hidden="true" /> Données manquantes</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {view.missingData.map((item) => <li key={item.id} className="flex gap-2 leading-6"><CircleDot className="mt-1.5 h-3 w-3 shrink-0 text-sky-300" aria-hidden="true" />{formatDisplayItem(item)}</li>)}
            </ul>
          </div>
        </div>

        {view.openQuestions.length > 0 && (
          <div className="mt-5 rounded-2xl border border-border bg-card/50 p-5 sm:p-6">
            <h3 className="flex items-center gap-2 font-semibold text-foreground"><FileQuestion className="h-4 w-4 text-primary" aria-hidden="true" /> Questions ouvertes</h3>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {view.openQuestions.map((item) => <li key={item.id} className="rounded-lg border border-border bg-background/50 p-3 text-sm leading-6 text-muted-foreground">{formatDisplayItem(item)}</li>)}
            </ul>
          </div>
        )}
      </section>

      <section id="verifier" aria-labelledby="explorer-verify" className="scroll-mt-24">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Vérifier</p>
          <h2 id="explorer-verify" className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Justifications scientifiques</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">Les conclusions détaillées restent repliées pour préserver la lecture. Ouvrez un groupe, puis une justification, pour retrouver la source et son localisateur exact.</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border px-3 py-1.5">{view.assertions.length} conclusions</span>
            <span className="rounded-full border border-border px-3 py-1.5">{view.evidenceLinks.length} preuves localisées</span>
            <span className="rounded-full border border-border px-3 py-1.5">{view.sources.length} publications</span>
          </div>
        </div>

        {view.hasResults ? (
          <div className="mt-6 space-y-3">
            {renderAssertionGroup("established", "Conclusions soutenues", "Informations favorables soutenues par une preuve localisée dans le contexte disponible.", view.assertionGroups.established, CheckCircle2)}
            {renderAssertionGroup("qualified", "Conclusions à nuancer", "Informations accompagnées d’une limite ou d’une restriction de portée.", view.assertionGroups.qualified, TriangleAlert)}
            {renderAssertionGroup("contested", "Résultats défavorables ou contestés", "Résultats négatifs ou incompatibles conservés sans les effacer.", view.assertionGroups.contested, Scale)}
          </div>
        ) : <p className="mt-6 rounded-2xl border border-border bg-card/45 p-5 text-sm text-muted-foreground">Aucune justification n’est disponible pour cette combinaison de filtres.</p>}
      </section>

      <section className="rounded-2xl border border-border bg-card/40 p-5 sm:p-7" aria-labelledby="explorer-sources">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Références</p>
            <h2 id="explorer-sources" className="mt-2 flex items-center gap-2 text-xl font-semibold text-foreground"><BookOpen className="h-4 w-4 text-primary" aria-hidden="true" /> Publications mobilisées</h2>
            <p className="mt-2 text-sm text-muted-foreground">Uniquement les publications reliées aux conclusions de la sélection.</p>
          </div>
          <Badge variant="outline">{view.sources.length}</Badge>
        </div>
        {view.sources.length ? (
          <ol className="mt-5 grid gap-3">
            {view.sources.map((source) => {
              const href = sourceHref(source);
              return (
                <li key={source.id} className="rounded-xl border border-border/80 bg-background/40 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium leading-6 text-foreground">{source.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{shortAuthors(source)}{source.journal ? ` — ${source.journal}` : ""}{source.year ? `, ${source.year}` : ""}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {source.doi && <span>DOI {source.doi}</span>}
                        {source.pmid && <span>PMID {source.pmid}</span>}
                        <span>{source.abstractOnly ? "Résumé uniquement" : "Texte intégral disponible"}</span>
                      </div>
                    </div>
                    {href && <a href={href} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline">Consulter <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></a>}
                  </div>
                </li>
              );
            })}
          </ol>
        ) : <p className="mt-5 text-sm text-muted-foreground">Aucune publication applicable à cette sélection.</p>}
      </section>

      <section className="grid gap-5 rounded-2xl border border-border bg-card/50 p-5 sm:p-8 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Cadre de lecture</p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">Un dossier scientifique, pas un avis clinique</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Cette lecture est reconstruite depuis le corpus scientifique structuré. Elle conserve les qualifications, les absences et l’état de revue ; elle n’ajoute ni consensus ni recommandation.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1"><ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Provenance localisée</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1"><Beaker className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Pas de méta-analyse générée</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1"><Info className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Revue humaine non déclarée</span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-background/50 p-4">
          <p className="text-sm font-semibold text-foreground">Poursuivre dans le site</p>
          <nav className="mt-3 space-y-1" aria-label="Pages éditoriales associées">
            {scientificExplorerData.editorialLinks.map((link) => (
              <Link key={link.to} to={link.to} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted/30 hover:text-primary">
                {link.label}<ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </div>
  );
};

export default ScientificExplorer;
