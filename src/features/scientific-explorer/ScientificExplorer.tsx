import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowUpRight,
  Beaker,
  BookOpen,
  CheckCircle2,
  CircleDot,
  Database,
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
import type { ExplorerAssertion, ExplorerEvidenceLink, ExplorerFacetOption } from "./types";

type FacetSelectProps = {
  id: string;
  label: string;
  description: string;
  value: string | null;
  options: Array<ExplorerFacetOption & { assertionCount: number }>;
  allLabel: string;
  onChange: (value: string | null) => void;
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

const Stat = ({ label, value, detail }: { label: string; value: number; detail: string }) => (
  <div className="rounded-xl border border-border/80 bg-background/60 p-4">
    <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
    <p className="mt-1 text-sm font-medium text-foreground">{label}</p>
    <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
  </div>
);

const assertionTone = (assertion: ExplorerAssertion) => {
  if (assertion.polarity === "NEGATIVE") return "border-rose-400/30 bg-rose-400/[0.04]";
  if (assertion.polarity === "QUALIFIED") return "border-amber-400/30 bg-amber-400/[0.04]";
  return "border-primary/20 bg-card/70";
};

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

  const updateState = (field: keyof ExplorerState, value: string | null) => {
    setSearchParams(serializeExplorerState({ ...state, [field]: value }));
  };

  const reset = () => setSearchParams(serializeExplorerState(EMPTY_EXPLORER_STATE));

  const renderAssertions = (groupId: string, title: string, description: string, assertions: ExplorerAssertion[], icon: typeof CheckCircle2) => {
    if (!assertions.length) return null;
    const Icon = icon;
    return (
      <section aria-labelledby={`assertion-group-${groupId}`} className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h3 id={`assertion-group-${groupId}`} className="font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="space-y-3">
          {assertions.map((assertion) => {
            const evidence = evidenceByAssertion.get(assertion.id) ?? [];
            return (
              <article key={assertion.id} className={`rounded-xl border p-4 sm:p-5 ${assertionTone(assertion)}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary">{assertion.subjectLabel}</Badge>
                  <Badge variant="outline" className="border-border bg-background/50 text-muted-foreground">
                    {formatScientificCode(assertion.polarity)}
                  </Badge>
                  <span className="ml-auto text-xs text-muted-foreground">{evidence.length} preuve{evidence.length > 1 ? "s" : ""}</span>
                </div>
                <p className="mt-4 text-[15px] leading-7 text-foreground">{formatAssertion(assertion)}</p>

                {assertion.limitations.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2" aria-label="Limites rattachées à l’assertion">
                    {assertion.limitations.map((limitation) => (
                      <span key={limitation.id} className="rounded-full border border-amber-300/20 bg-amber-300/5 px-2.5 py-1 text-xs text-amber-100/80">
                        {formatDisplayItem(limitation)}
                      </span>
                    ))}
                  </div>
                )}

                {evidence.length > 0 && (
                  <div className="mt-5 border-t border-border/70 pt-4">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      <BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> Preuves localisées
                    </p>
                    <ul className="mt-3 space-y-3">
                      {evidence.map((item) => {
                        const source = sourceById.get(item.sourceId);
                        const href = source ? sourceHref(source) : null;
                        return (
                          <li key={item.id} className="rounded-lg bg-background/70 p-3 text-sm">
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
                            <p className="mt-1 break-words text-xs leading-5 text-muted-foreground"><span className="text-foreground/80">Localisateur :</span> {item.locator ?? "Non renseigné"}</p>
                            {(item.analyticalSummary || assertion.statementText) && (
                              <details className="mt-2 text-xs text-muted-foreground">
                                <summary className="cursor-pointer rounded font-medium text-foreground/80 outline-none focus-visible:ring-2 focus-visible:ring-primary">Voir la trace du graphe</summary>
                                {item.analyticalSummary && <p className="mt-2 leading-5"><span className="font-medium">Résumé analytique :</span> {item.analyticalSummary}</p>}
                                {assertion.statementText && <p className="mt-2 leading-5"><span className="font-medium">Assertion structurée originale :</span> {assertion.statementText}</p>}
                              </details>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-10 sm:space-y-14">
      <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-card via-card to-primary/[0.08] px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
        <div aria-hidden="true" className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <Search className="h-3.5 w-3.5" aria-hidden="true" /> Explorateur scientifique — pilote
          </div>
          <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Explorer les connaissances en segmentation
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            Interrogez les assertions, leurs preuves localisées et leurs limites à partir du corpus scientifique structuré de NOXIA.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border bg-background/50 px-3 py-1.5">Données issues du Knowledge Graph</span>
            <span className="rounded-full border border-border bg-background/50 px-3 py-1.5">Aucune recommandation clinique</span>
            <span className="rounded-full border border-border bg-background/50 px-3 py-1.5">URL partageable</span>
          </div>
        </div>
      </section>

      <ScientificIllustration illustration={scientificExplorerData.illustration} />

      <section aria-label="Explorateur de connaissances" className="grid items-start gap-6 lg:grid-cols-[minmax(250px,0.7fr)_minmax(0,2fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-border bg-card/70 p-5 lg:sticky lg:top-24 lg:p-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Filter className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold text-foreground">Affiner la lecture</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Chaque option provient du corpus et modifie les résultats affichés.</p>
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
                description="Mesure d’évaluation explicitement rattachée aux assertions."
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
                label="Concept scientifique"
                description="Sujet structuré relié aux assertions du pilote."
                value={state.conceptKey}
                options={scientificExplorerData.concepts.map((concept) => ({ ...concept, id: concept.id, key: concept.key, label: concept.label }))}
                allLabel="Tous les concepts"
                onChange={(value) => updateState("conceptKey", value)}
              />
            )}
          </div>

          <Button type="button" variant="outline" className="mt-6 w-full" onClick={reset} disabled={!view.isFiltered}>
            <RefreshCcw className="h-4 w-4" aria-hidden="true" /> Réinitialiser
          </Button>

          <div className="mt-6 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
            <p className="flex gap-2"><Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" /> Les filtres sont enregistrés dans l’URL pour retrouver et partager exactement cette vue.</p>
          </div>
        </aside>

        <div className="min-w-0 space-y-8">
          <section aria-live="polite" aria-atomic="true" className="rounded-2xl border border-border bg-card/50 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Synthèse structurée</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{view.synthesisLabel}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {view.hasResults
                    ? `${view.assertions.length} assertion${view.assertions.length > 1 ? "s" : ""} applicable${view.assertions.length > 1 ? "s" : ""}, reliée${view.assertions.length > 1 ? "s" : ""} à ${view.evidenceLinks.length} preuve${view.evidenceLinks.length > 1 ? "s" : ""} localisée${view.evidenceLinks.length > 1 ? "s" : ""}.`
                    : "Le corpus ne contient pas d’assertion applicable à cette combinaison."}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary">Confiance {formatScientificCode(view.confidence).toLocaleLowerCase("fr")}</Badge>
                {view.convergence && <Badge variant="outline">{formatScientificCode(view.convergence)}</Badge>}
              </div>
            </div>

            {view.activeFilterLabels.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2" aria-label="Filtres actifs">
                {view.activeFilterLabels.map((label) => <span key={label} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{label}</span>)}
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Assertions" value={view.assertions.length} detail={`${scientificExplorerData.assertions.length} dans le pilote`} />
              <Stat label="Preuves" value={view.evidenceLinks.length} detail="localisateurs exploitables" />
              <Stat label="Sources" value={view.sources.length} detail="pour cette sélection" />
              <Stat label="Limites" value={view.limitations.length} detail="explicitement conservées" />
            </div>
          </section>

          {!view.hasResults ? (
            <section className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.05] p-6 sm:p-8" role="status">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300"><FileQuestion className="h-5 w-5" aria-hidden="true" /></span>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Données insuffisantes pour cette combinaison</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">L’absence de résultat est conservée comme telle. Modifiez un filtre ou revenez à la vue générale ; aucune conclusion n’est extrapolée.</p>
                  <Button type="button" variant="outline" size="sm" className="mt-4" onClick={reset}>Revenir à la vue générale</Button>
                </div>
              </div>
            </section>
          ) : (
            <div className="space-y-9">
              {renderAssertions("established", "Assertions établies", "Résultats soutenus par une preuve localisée dans le contexte disponible.", view.assertionGroups.established, CheckCircle2)}
              {renderAssertions("qualified", "Assertions qualifiées", "Résultats accompagnés d’une limite ou d’une restriction de portée.", view.assertionGroups.qualified, TriangleAlert)}
              {renderAssertions("contested", "Résultats défavorables ou contestés", "Résultats négatifs ou preuves incompatibles conservés sans les effacer.", view.assertionGroups.contested, Scale)}
            </div>
          )}

          <section className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-amber-400/20 bg-card/50 p-5 sm:p-6">
              <h2 className="flex items-center gap-2 font-semibold text-foreground"><TriangleAlert className="h-4 w-4 text-amber-300" aria-hidden="true" /> Limites documentées</h2>
              {view.limitations.length ? (
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  {view.limitations.map((item) => <li key={item.id} className="flex gap-2 leading-6"><CircleDot className="mt-1.5 h-3 w-3 shrink-0 text-amber-300" aria-hidden="true" />{formatDisplayItem(item)}</li>)}
                </ul>
              ) : <p className="mt-4 text-sm leading-6 text-muted-foreground">Aucune limitation n’est localisée dans les assertions affichées.</p>}
            </div>
            <div className="rounded-2xl border border-sky-400/20 bg-card/50 p-5 sm:p-6">
              <h2 className="flex items-center gap-2 font-semibold text-foreground"><AlertCircle className="h-4 w-4 text-sky-300" aria-hidden="true" /> Données manquantes</h2>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                {view.missingData.map((item) => <li key={item.id} className="flex gap-2 leading-6"><CircleDot className="mt-1.5 h-3 w-3 shrink-0 text-sky-300" aria-hidden="true" />{formatDisplayItem(item)}</li>)}
              </ul>
            </div>
          </section>

          {view.openQuestions.length > 0 && (
            <section className="rounded-2xl border border-border bg-card/50 p-5 sm:p-6">
              <h2 className="flex items-center gap-2 font-semibold text-foreground"><FileQuestion className="h-4 w-4 text-primary" aria-hidden="true" /> Questions ouvertes</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {view.openQuestions.map((item) => <li key={item.id} className="rounded-lg border border-border bg-background/50 p-3 text-sm leading-6 text-muted-foreground">{formatDisplayItem(item)}</li>)}
              </ul>
            </section>
          )}

          <section className="rounded-2xl border border-border bg-card/50 p-5 sm:p-6" aria-labelledby="explorer-sources">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="explorer-sources" className="flex items-center gap-2 font-semibold text-foreground"><BookOpen className="h-4 w-4 text-primary" aria-hidden="true" /> Sources disponibles</h2>
                <p className="mt-1 text-sm text-muted-foreground">Uniquement les sources reliées aux assertions affichées.</p>
              </div>
              <Badge variant="outline">{view.sources.length}</Badge>
            </div>
            {view.sources.length ? (
              <ol className="mt-5 grid gap-3">
                {view.sources.map((source) => {
                  const href = sourceHref(source);
                  return (
                    <li key={source.id} className="rounded-xl border border-border bg-background/50 p-4">
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
            ) : <p className="mt-5 text-sm text-muted-foreground">Aucune source applicable à cette sélection.</p>}
          </section>

          {view.relatedConcepts.length > 0 && (
            <section className="rounded-2xl border border-border bg-card/50 p-5 sm:p-6">
              <h2 className="flex items-center gap-2 font-semibold text-foreground"><Database className="h-4 w-4 text-primary" aria-hidden="true" /> Concepts reliés</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {view.relatedConcepts.map((concept) => (
                  <button
                    key={concept.id}
                    type="button"
                    onClick={() => updateState("conceptKey", concept.key)}
                    className="rounded-full border border-border bg-background/60 px-3 py-1.5 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {concept.label} <span className="text-xs opacity-70">({concept.assertionCount})</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>

      <section className="grid gap-5 rounded-2xl border border-border bg-card/50 p-5 sm:p-8 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Cadre de lecture</p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">Un pilote scientifique, pas un avis clinique</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Cette vue matérialisée est reconstruite depuis le graphe scientifique. Elle conserve les qualifications, les absences et l’état de revue automatisée ; elle n’ajoute ni consensus ni recommandation.
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
