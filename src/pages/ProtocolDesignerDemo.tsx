import Footer from "@/components/Footer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import DisclosureStack from "@/features/protocol-designer/DisclosureStack";
import { DEMONSTRATOR_SCENARIOS, INTENT_CHOICES, scenarioById } from "@/features/protocol-designer/fixtures";
import type { ScenarioId } from "@/features/protocol-designer/types";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CircleAlert,
  CircleHelp,
  Info,
  Printer,
  RotateCcw,
  Scale,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const CANONICAL = "https://noxia-imagerie.fr/protocol-designer";
const SESSION_KEY = "noxia-protocol-designer-demo-v1";
const DEMO_SCHEMA_VERSION = 1;

const STEPS = [
  "Intention",
  "Compréhension",
  "Hypothèses",
  "Informations manquantes",
  "Stratégie",
  "Revue critique",
  "Rapport",
] as const;

type DemoState = {
  step: number;
  maxStep: number;
  intentId: string | null;
  scenarioId: ScenarioId | null;
  formulation: string;
  context: string;
  outsideScope: boolean;
  contradiction: boolean;
  openDepths: number[];
  hypothesisStates: Record<string, "accepted" | "rejected">;
  informationStates: Record<string, "available" | "unknown">;
  strategyId: string | null;
  decisionAuthor: string;
  decisionScope: string;
  decisionConfirmed: boolean;
  decidedAt: string | null;
};

const initialState: DemoState = {
  step: 0,
  maxStep: 0,
  intentId: null,
  scenarioId: null,
  formulation: "",
  context: "",
  outsideScope: false,
  contradiction: false,
  openDepths: [1],
  hypothesisStates: {},
  informationStates: {},
  strategyId: null,
  decisionAuthor: "",
  decisionScope: "Démonstration locale",
  decisionConfirmed: false,
  decidedAt: null,
};

type SystemNotice = "version_conflict" | "recovered_state" | null;

const loadState = (): { state: DemoState; notice: SystemNotice } => {
  if (typeof window === "undefined") return { state: initialState, notice: null };
  try {
    const saved = window.sessionStorage.getItem(SESSION_KEY);
    if (!saved) return { state: initialState, notice: null };
    const parsed = JSON.parse(saved) as { schemaVersion?: number; state?: Partial<DemoState> };
    if (parsed.schemaVersion !== DEMO_SCHEMA_VERSION || !parsed.state) {
      return { state: initialState, notice: "version_conflict" };
    }
    return { state: { ...initialState, ...parsed.state }, notice: null };
  } catch {
    return { state: initialState, notice: "recovered_state" };
  }
};

const StatusChip = ({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "warning" | "good" }) => (
  <span className={cn(
    "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
    tone === "warning" && "border-amber-400/50 bg-amber-400/10 text-amber-100 print:text-amber-900",
    tone === "good" && "border-emerald-400/50 bg-emerald-400/10 text-emerald-100 print:text-emerald-900",
    tone === "neutral" && "border-border bg-muted/50 text-muted-foreground print:text-slate-700",
  )}>{children}</span>
);

const SectionTitle = ({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) => (
  <header className="max-w-3xl">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
    <h1 id="demo-step-title" className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
    <p className="mt-3 leading-relaxed text-muted-foreground">{text}</p>
  </header>
);

const ProtocolDesignerDemo = () => {
  const [initialLoad] = useState(loadState);
  const [state, setState] = useState<DemoState>(initialLoad.state);
  const [systemNotice, setSystemNotice] = useState<SystemNotice>(initialLoad.notice);
  const [error, setError] = useState("");
  const mainHeading = useRef<HTMLDivElement>(null);
  const previousStep = useRef(state.step);
  const scenario = scenarioById(state.scenarioId);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ schemaVersion: DEMO_SCHEMA_VERSION, state }));
    } catch {
      setSystemNotice("recovered_state");
    }
  }, [state]);

  useEffect(() => {
    if (previousStep.current === state.step) return;
    previousStep.current = state.step;
    mainHeading.current?.focus();
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [state.step]);

  const criticalBlockers = useMemo(
    () => scenario?.missingInformation.filter((item) => item.critical && state.informationStates[item.id] !== "available") ?? [],
    [scenario, state.informationStates],
  );
  const selectedStrategy = scenario?.strategies.find((option) => option.id === state.strategyId);

  const selectScenario = (scenarioId: ScenarioId) => {
    setState((current) => ({
      ...current,
      scenarioId,
      formulation: DEMONSTRATOR_SCENARIOS.find((item) => item.id === scenarioId)?.intent ?? "",
      context: "",
      outsideScope: false,
      contradiction: false,
      openDepths: [1],
      hypothesisStates: {},
      informationStates: {},
      strategyId: null,
      decisionConfirmed: false,
      decidedAt: null,
    }));
    setError("");
  };

  const next = () => {
    if (state.step === 0 && (!state.intentId || !scenario || !state.formulation.trim())) {
      setError("Choisissez une intention, un scénario et conservez une formulation explicite avant de continuer.");
      return;
    }
    if (state.step === 4 && (!state.strategyId || criticalBlockers.length > 0)) {
      setError("Une option et la résolution des informations critiques sont requises avant la revue.");
      return;
    }
    if (state.step === 5 && !state.decisionConfirmed) {
      setError("La décision doit être confirmée explicitement par une personne avant le rapport.");
      return;
    }
    const nextStep = Math.min(state.step + 1, STEPS.length - 1);
    setState((current) => ({ ...current, step: nextStep, maxStep: Math.max(current.maxStep, nextStep) }));
    setError("");
  };

  const previous = () => {
    setState((current) => ({ ...current, step: Math.max(0, current.step - 1) }));
    setError("");
  };

  const reset = () => {
    window.sessionStorage.removeItem(SESSION_KEY);
    setState(initialState);
    setSystemNotice(null);
    setError("");
  };

  const renderStep = () => {
    if (state.step === 0) {
      return (
        <div className="space-y-10">
          <SectionTitle eyebrow="Étape 1 sur 7" title="Quelle est votre intention ?" text="Le parcours commence par le verbe d’action. Cinq choix maximum restent visibles pour préserver l’orientation." />
          <fieldset>
            <legend className="text-sm font-semibold">1. Choisissez une intention</legend>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {INTENT_CHOICES.map((intent) => (
                <button key={intent.id} type="button" aria-pressed={state.intentId === intent.id} onClick={() => setState((current) => ({ ...current, intentId: intent.id }))} className={cn("min-h-24 rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", state.intentId === intent.id ? "border-primary bg-primary/10" : "border-border bg-card/50 hover:border-primary/50")}>
                  <span className="block font-semibold">{intent.label}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{intent.explanation}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold">2. Choisissez l’un des trois scénarios préparés</legend>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {DEMONSTRATOR_SCENARIOS.map((item) => (
                <button key={item.id} type="button" aria-pressed={state.scenarioId === item.id} onClick={() => selectScenario(item.id)} className={cn("rounded-xl border p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", state.scenarioId === item.id ? "border-primary bg-primary/10" : "border-border bg-card/50 hover:border-primary/50")}>
                  <span className="font-mono text-xs text-primary">{item.program.id}</span>
                  <span className="mt-3 block font-semibold">{item.shortLabel}</span>
                  <span className="mt-2 block text-sm text-muted-foreground">{item.reasoningBook.id} v{item.reasoningBook.version}</span>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setState((current) => ({ ...current, scenarioId: null, outsideScope: true }))} className="mt-4 min-h-11 text-sm font-medium text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              Aucun de ces scénarios ne correspond à mon besoin
            </button>
          </fieldset>

          {state.outsideScope ? (
            <div role="status" className="rounded-xl border border-amber-400/50 bg-amber-400/10 p-4">
              <p className="font-semibold text-amber-100">Scénario indisponible — non évaluable dans ce démonstrateur</p>
              <p className="mt-1 text-sm text-muted-foreground">Aucun calcul n’a été tenté, car le périmètre est volontairement limité à trois projections déterministes. Votre formulation reste préservée dans la session. Choisissez un scénario préparé, reformulez, ou demandez une revue humaine hors du démonstrateur.</p>
            </div>
          ) : null}

          <div>
            <label htmlFor="formulation" className="text-sm font-semibold">3. Formulation de l’intention</label>
            <textarea id="formulation" value={state.formulation} onChange={(event) => setState((current) => ({ ...current, formulation: event.target.value, decisionConfirmed: false }))} rows={3} maxLength={320} placeholder="Décrivez l’objectif scientifique, sans donnée patient." className="mt-3 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary" />
            <p className="mt-2 text-xs text-muted-foreground">Texte conservé uniquement dans cette session du navigateur. 320 caractères maximum.</p>
          </div>
        </div>
      );
    }

    if (!scenario) return null;

    if (state.step === 1) {
      return (
        <div className="space-y-8">
          <SectionTitle eyebrow="Étape 2 sur 7" title="Comprendre la question avant d’agir" text={scenario.comprehension} />
          <div className="flex flex-wrap gap-2"><StatusChip>{scenario.program.id} v{scenario.program.version}</StatusChip><StatusChip>{scenario.reasoningBook.id} v{scenario.reasoningBook.version}</StatusChip><StatusChip tone="warning">Projection de démonstration</StatusChip></div>
          <DisclosureStack
            scenario={scenario}
            openDepths={state.openDepths}
            onDepthChange={(depth, open) => setState((current) => ({
              ...current,
              openDepths: open
                ? [...new Set([...current.openDepths, depth])].sort()
                : current.openDepths.filter((item) => item !== depth),
            }))}
          />
          <section className="rounded-xl border border-border bg-card/40 p-5">
            <label htmlFor="scientific-context" className="font-semibold">Contexte utile à la démonstration</label>
            <p className="mt-2 text-sm text-muted-foreground">Ajoutez uniquement un contexte scientifique non sensible. Une absence reste explicitement visible dans le rapport.</p>
            <textarea id="scientific-context" value={state.context} onChange={(event) => setState((current) => ({ ...current, context: event.target.value, decisionConfirmed: false }))} rows={3} maxLength={500} placeholder="Population d’étude, contexte multicentrique ou contrainte méthodologique…" className="mt-3 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary" />
          </section>
          <section className="rounded-xl border border-border bg-card/40 p-5">
            <h2 className="font-semibold">Test de contradiction</h2>
            <p className="mt-2 text-sm text-muted-foreground">Signalez si le contexte réel contredit la formulation ou les construits affichés. Le système ne résout pas cette contradiction seul.</p>
            <button type="button" aria-pressed={state.contradiction} onClick={() => setState((current) => ({ ...current, contradiction: !current.contradiction, decisionConfirmed: false }))} className={cn("mt-4 min-h-11 rounded-lg border px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", state.contradiction ? "border-amber-400 bg-amber-400/10 text-amber-100" : "border-border hover:border-primary/50")}>
              {state.contradiction ? "Contradiction signalée" : "Signaler une contradiction"}
            </button>
            {state.contradiction ? <p role="alert" className="mt-3 text-sm text-amber-200">État contradictoire : la suite peut être explorée, mais toute conclusion doit conserver cette objection visible.</p> : null}
          </section>
        </div>
      );
    }

    if (state.step === 2) {
      return (
        <div className="space-y-8">
          <SectionTitle eyebrow="Étape 3 sur 7" title="Rendre les hypothèses contestables" text="Aucune hypothèse n’est acceptée par défaut. Une absence de position reste une incertitude explicite." />
          <div className="space-y-4">
            {scenario.hypotheses.map((hypothesis, index) => {
              const value = state.hypothesisStates[String(index)];
              return (
                <article key={hypothesis} className="rounded-xl border border-border bg-card/40 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div><p className="font-semibold">Hypothèse {index + 1}</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{hypothesis}</p></div>
                    <StatusChip tone={value === "accepted" ? "good" : value === "rejected" ? "warning" : "neutral"}>{value === "accepted" ? "Retenue" : value === "rejected" ? "Contestée" : "Non examinée"}</StatusChip>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={`Position sur l’hypothèse ${index + 1}`}>
                    {(["accepted", "rejected"] as const).map((choice) => <button key={choice} type="button" aria-pressed={value === choice} onClick={() => setState((current) => ({ ...current, hypothesisStates: { ...current.hypothesisStates, [String(index)]: choice }, decisionConfirmed: false }))} className={cn("min-h-10 rounded-lg border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", value === choice ? "border-primary bg-primary/10" : "border-border")}>{choice === "accepted" ? "Retenir" : "Contester"}</button>)}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      );
    }

    if (state.step === 3) {
      return (
        <div className="space-y-8">
          <SectionTitle eyebrow="Étape 4 sur 7" title="Qualifier les informations manquantes" text="Les éléments critiques non disponibles restent visibles et empêcheront une décision prétendument aboutie." />
          <div className="space-y-4">
            {scenario.missingInformation.map((item) => {
              const value = state.informationStates[item.id];
              return (
                <article key={item.id} className={cn("rounded-xl border p-5", item.critical && value !== "available" ? "border-amber-400/50 bg-amber-400/5" : "border-border bg-card/40")}>
                  <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{item.label}</h2>{item.critical ? <StatusChip tone="warning">Critique</StatusChip> : <StatusChip>Secondaire</StatusChip>}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{item.why}</p>
                  <p className="mt-2 text-xs text-muted-foreground"><span className="font-semibold text-foreground">Décision affectée :</span> recevabilité de la stratégie. Si l’information reste inconnue, {item.critical ? "la sélection demeure bloquée" : "le risque résiduel est conservé dans la revue"}.</p>
                  <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={`Disponibilité : ${item.label}`}>
                    {(["available", "unknown"] as const).map((choice) => <button key={choice} type="button" aria-pressed={value === choice} onClick={() => setState((current) => ({ ...current, informationStates: { ...current.informationStates, [item.id]: choice }, decisionConfirmed: false }))} className={cn("min-h-10 rounded-lg border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", value === choice ? "border-primary bg-primary/10" : "border-border")}>{choice === "available" ? "Disponible dans mon contexte" : "Inconnu ou indisponible"}</button>)}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      );
    }

    if (state.step === 4) {
      return (
        <div className="space-y-8">
          <SectionTitle eyebrow="Étape 5 sur 7" title="Comparer des stratégies, sans classement automatique" text="Les options exposent bénéfice, compromis et condition. Elles ne contiennent ni protocole technique ni recommandation clinique." />
          <div className="grid gap-4 lg:grid-cols-2">
            {scenario.strategies.map((option) => (
              <article key={option.id} className={cn("rounded-xl border p-5", state.strategyId === option.id ? "border-primary bg-primary/10" : "border-border bg-card/40")}>
                <h2 className="text-lg font-semibold">{option.title}</h2>
                <div className="mt-3 flex flex-wrap gap-2"><StatusChip tone={criticalBlockers.length ? "warning" : "good"}>{criticalBlockers.length ? "Bloquée" : "Recevable pour revue"}</StatusChip><StatusChip>Niveau 1 · Compréhension</StatusChip></div>
                <dl className="mt-4 space-y-3 text-sm"><div><dt className="font-semibold">Objectif couvert</dt><dd className="mt-1 text-muted-foreground">{scenario.intent}</dd></div><div><dt className="font-semibold text-emerald-200">Bénéfice</dt><dd className="mt-1 text-muted-foreground">{option.benefit}</dd></div><div><dt className="font-semibold text-amber-200">Limite et renoncement</dt><dd className="mt-1 text-muted-foreground">{option.tradeoff}</dd></div></dl>
                <details className="mt-4 rounded-lg border border-border/70 bg-background/40">
                  <summary className="min-h-11 cursor-pointer px-3 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Niveau 2 · Dépendances, risques et provenance</summary>
                  <dl className="space-y-3 border-t border-border/70 px-3 py-4 text-sm"><div><dt className="font-semibold">Dépendances</dt><dd className="mt-1 text-muted-foreground">{option.condition}</dd></div><div><dt className="font-semibold">Données encore inconnues</dt><dd className="mt-1 text-muted-foreground">{scenario.missingInformation.filter((item) => state.informationStates[item.id] !== "available").map((item) => item.label).join(" · ") || "Aucune information critique restante dans la session."}</dd></div><div><dt className="font-semibold">Risque résiduel</dt><dd className="mt-1 text-muted-foreground">{scenario.controversy}</dd></div><div><dt className="font-semibold">Preuve ou corpus mobilisé</dt><dd className="mt-1 font-mono text-xs text-primary">{scenario.evidence[0].locator}</dd></div></dl>
                </details>
                <button type="button" disabled={criticalBlockers.length > 0} aria-pressed={state.strategyId === option.id} onClick={() => setState((current) => ({ ...current, strategyId: option.id, decisionConfirmed: false }))} className="mt-5 min-h-11 w-full rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:border-border disabled:text-muted-foreground">
                  {state.strategyId === option.id ? "Option retenue pour revue" : "Retenir pour la revue"}
                </button>
              </article>
            ))}
          </div>
          {criticalBlockers.length > 0 ? <p role="alert" className="rounded-xl border border-amber-400/50 bg-amber-400/10 p-4 text-sm text-amber-100">Sélection désactivée : revenez aux informations manquantes et qualifiez chaque bloqueur critique.</p> : null}
        </div>
      );
    }

    if (state.step === 5) {
      return (
        <div className="space-y-8">
          <SectionTitle eyebrow="Étape 6 sur 7" title="Revue critique et décision humaine" text="La sélection précédente reste un projet. Seule cette action explicite enregistre une décision dans la session." />
          <section className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card/40 p-5">
              <h2 className="font-semibold">Option soumise à revue</h2>
              <p className="mt-2 text-lg">{selectedStrategy?.title ?? "Aucune option"}</p>
              <p className="mt-3 text-sm text-muted-foreground">Controverse : {scenario.controversy}</p>
              {state.contradiction ? <p className="mt-3 text-sm text-amber-200">Une contradiction déclarée reste ouverte.</p> : null}
              <div className="mt-4 flex flex-wrap gap-2"><StatusChip tone="warning">Revue humaine requise</StatusChip><StatusChip>{state.contradiction ? "Révision nécessaire" : "Recevable pour la démonstration"}</StatusChip></div>
            </div>
            <div className="rounded-xl border border-border bg-card/40 p-5">
              <h2 className="flex items-center gap-2 font-semibold"><UserCheck aria-hidden="true" className="h-5 w-5 text-primary" />Responsabilité de la décision</h2>
              <label htmlFor="decision-author" className="mt-4 block text-sm font-medium">Auteur de la décision</label>
              <input id="decision-author" value={state.decisionAuthor} onChange={(event) => setState((current) => ({ ...current, decisionAuthor: event.target.value, decisionConfirmed: false }))} maxLength={80} className="mt-2 min-h-11 w-full rounded-lg border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-primary" />
              <label htmlFor="decision-scope" className="mt-4 block text-sm font-medium">Portée déclarée</label>
              <input id="decision-scope" value={state.decisionScope} onChange={(event) => setState((current) => ({ ...current, decisionScope: event.target.value, decisionConfirmed: false }))} maxLength={120} className="mt-2 min-h-11 w-full rounded-lg border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-primary" />
              <button type="button" disabled={!selectedStrategy || !state.decisionAuthor.trim() || !state.decisionScope.trim() || criticalBlockers.length > 0} onClick={() => { setState((current) => ({ ...current, decisionConfirmed: true, decidedAt: new Date().toISOString() })); setError(""); }} className="mt-5 min-h-12 w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40">
                {state.decisionConfirmed ? "Décision humaine confirmée" : "Confirmer cette décision humaine"}
              </button>
            </div>
          </section>
          <section className="rounded-xl border border-border bg-card/40 p-5">
            <h2 className="font-semibold">Constats de revue</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div><dt className="font-semibold">Cohérence interne</dt><dd className="mt-1 text-muted-foreground">{state.contradiction ? "À revoir : contradiction active." : "Structurée pour la démonstration, sans validation scientifique."}</dd></div>
              <div><dt className="font-semibold">Preuves disponibles</dt><dd className="mt-1 text-muted-foreground">{scenario.evidence.length} localisateurs issus de {scenario.reasoningBook.id} v{scenario.reasoningBook.version}.</dd></div>
              <div><dt className="font-semibold">Informations manquantes</dt><dd className="mt-1 text-muted-foreground">{scenario.missingInformation.filter((item) => state.informationStates[item.id] !== "available").length} inconnue(s), dont {criticalBlockers.length} critique(s).</dd></div>
              <div><dt className="font-semibold">Non-évaluabilité</dt><dd className="mt-1 text-muted-foreground">{criticalBlockers.length ? "État non évaluable : information critique absente." : "Aucun motif bloquant déclaré dans la fixture ; ceci ne vaut pas validation."}</dd></div>
              <div><dt className="font-semibold">Risques résiduels</dt><dd className="mt-1 text-muted-foreground">{scenario.controversy}</dd></div>
              <div><dt className="font-semibold">Action proposée</dt><dd className="mt-1 text-muted-foreground">Réexaminer les hypothèses non examinées, qualifier les inconnues secondaires, puis décider explicitement.</dd></div>
            </dl>
          </section>
          <section className="rounded-xl border border-border bg-card/40 p-5">
            <h2 className="font-semibold">Limites conservées dans le rapport</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">{scenario.limitations.map((limit) => <li key={limit}>• {limit}</li>)}</ul>
          </section>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <SectionTitle eyebrow="Étape 7 sur 7" title="Rapport de raisonnement" text="Synthèse locale et imprimable de la session. Ce document ne constitue ni un protocole clinique ni une validation scientifique formelle." />
        <article id="protocol-designer-report" className="space-y-8 rounded-2xl border border-border bg-card/50 p-5 sm:p-8 print:border-0 print:bg-white print:p-0 print:text-slate-950">
          <header className="border-b border-border pb-6 print:border-slate-300"><p className="font-mono text-xs text-primary print:text-slate-600">NOXIA · DÉMONSTRATEUR DÉTERMINISTE · SCÉNARIO PRÉPARÉ</p><h2 className="mt-2 text-2xl font-bold">{scenario.title}</h2><p className="mt-3 text-sm text-muted-foreground print:text-slate-700">Décision confirmée par {state.decisionAuthor} · Portée : {state.decisionScope}{state.decidedAt ? ` · ${new Date(state.decidedAt).toLocaleString("fr-FR")}` : ""}</p></header>
          <section><h3 className="font-semibold">Intention</h3><p className="mt-2 text-sm text-muted-foreground print:text-slate-700">{state.formulation}</p></section>
          <section><h3 className="font-semibold">Question reformulée et contexte</h3><p className="mt-2 text-sm text-muted-foreground print:text-slate-700">{scenario.comprehension}</p><p className="mt-2 text-sm text-muted-foreground print:text-slate-700">Contexte déclaré : {state.context.trim() || "aucun contexte additionnel renseigné"}.</p></section>
          <section><h3 className="font-semibold">Décision humaine enregistrée</h3><p className="mt-2 text-sm text-muted-foreground print:text-slate-700">{selectedStrategy?.title}</p></section>
          <section><h3 className="font-semibold">Alternative non retenue</h3><p className="mt-2 text-sm text-muted-foreground print:text-slate-700">{scenario.strategies.filter((item) => item.id !== state.strategyId).map((item) => item.title).join(" · ") || "Aucune"}. Le démonstrateur n’attribue pas d’infériorité universelle à cette alternative.</p></section>
          <section><h3 className="font-semibold">Hypothèses</h3><ul className="mt-2 space-y-2 text-sm text-muted-foreground print:text-slate-700">{scenario.hypotheses.map((item, index) => <li key={item}>• {item} — {state.hypothesisStates[String(index)] === "accepted" ? "retenue" : state.hypothesisStates[String(index)] === "rejected" ? "contestée" : "non examinée"}</li>)}</ul></section>
          <section><h3 className="font-semibold">Informations manquantes</h3><ul className="mt-2 space-y-2 text-sm text-muted-foreground print:text-slate-700">{scenario.missingInformation.map((item) => <li key={item.id}>• {item.label} — {state.informationStates[item.id] === "available" ? "déclarée disponible" : "inconnue ou indisponible"}{item.critical ? " — critique" : ""}</li>)}</ul></section>
          <section><h3 className="font-semibold">Evidence Map</h3><div className="mt-3 grid gap-3 sm:grid-cols-2">{scenario.evidence.map((item) => <div key={item.locator} className="rounded-lg border border-border p-4 print:border-slate-300"><p className="font-semibold">{item.label}</p><p className="mt-1 font-mono text-xs text-primary print:text-slate-700">{item.locator}</p><p className="mt-2 text-sm text-muted-foreground print:text-slate-700">{item.contribution}</p></div>)}</div></section>
          <section><h3 className="font-semibold">Limites, controverses et risques résiduels</h3><ul className="mt-2 space-y-2 text-sm text-muted-foreground print:text-slate-700">{scenario.limitations.map((item) => <li key={item}>• {item}</li>)}<li>• {scenario.controversy}</li>{state.contradiction ? <li>• Contradiction déclarée par l’utilisateur : non résolue automatiquement.</li> : null}</ul></section>
          <section><h3 className="font-semibold">Knowledge Gap</h3><p className="mt-2 text-sm text-muted-foreground print:text-slate-700">{scenario.openQuestion}</p></section>
          <footer className="border-t border-border pt-5 text-xs text-muted-foreground print:border-slate-300 print:text-slate-600">Sources propriétaires : {scenario.program.id} v{scenario.program.version} · {scenario.reasoningBook.id} v{scenario.reasoningBook.version}. Aucune validation PD-011. Aucune recommandation clinique. Aucune activation produit.</footer>
        </article>
        <button type="button" onClick={() => window.print()} className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary print:hidden"><Printer aria-hidden="true" className="h-4 w-4" />Imprimer ou enregistrer en PDF</button>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Démonstrateur Protocol Designer | NOXIA</title>
        <meta name="description" content="Démonstrateur local du Protocol Designer NOXIA : intention, hypothèses, informations manquantes, preuves, limites et décision humaine." />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={CANONICAL} />
      </Helmet>

      <a href="#demo-main" className="sr-only z-[100] rounded bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Aller au contenu du démonstrateur</a>
      <main id="demo-main" className="min-h-screen overflow-x-clip bg-background print:bg-white">
        <div className="border-b border-border/70 bg-card/30 px-4 py-4 print:hidden">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
            <Link to="/protocol-designer" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Présentation</Link>
            <div className="flex flex-wrap items-center gap-2">
              <details className="relative">
                <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><BookOpen aria-hidden="true" className="h-4 w-4" />Fondations scientifiques</summary>
                <div className="absolute right-0 z-30 mt-2 w-[min(88vw,34rem)] rounded-xl border border-border bg-popover p-5 shadow-2xl">
                  <p className="font-semibold">Vue secondaire des corpus propriétaires</p>
                  <p className="mt-2 text-sm text-muted-foreground">Statut documentaire officiel distinct de toute validation scientifique ou activation produit.</p>
                  <ul className="mt-4 space-y-3 text-sm">{DEMONSTRATOR_SCENARIOS.map((item) => <li key={item.id} className="rounded-lg border border-border p-3"><span className="font-mono text-xs text-primary">{item.program.id} v{item.program.version}</span><span className="mt-1 block">{item.program.title}</span><span className="text-muted-foreground">{item.reasoningBook.id} v{item.reasoningBook.version}</span></li>)}</ul>
                </div>
              </details>
              <AlertDialog>
                <AlertDialogTrigger asChild><button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><RotateCcw aria-hidden="true" className="h-4 w-4" />Réinitialiser</button></AlertDialogTrigger>
                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Réinitialiser le parcours ?</AlertDialogTitle><AlertDialogDescription>Les choix, qualifications et la décision conservés dans cette session seront effacés.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={reset}>Réinitialiser</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        <div className="mx-auto grid min-w-0 max-w-[1500px] lg:grid-cols-[17rem_minmax(0,1fr)] print:block">
          <nav aria-label="Étapes du Protocol Designer" className="min-w-0 overflow-hidden border-b border-border/70 p-4 lg:min-h-[calc(100vh-81px)] lg:border-b-0 lg:border-r lg:p-6 print:hidden">
            <ol className="flex max-w-full gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
              {STEPS.map((label, index) => (
                <li key={label} className="shrink-0 lg:shrink">
                  <button type="button" disabled={index > state.maxStep} aria-current={index === state.step ? "step" : undefined} onClick={() => { setState((current) => ({ ...current, step: index })); setError(""); }} className={cn("flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40", index === state.step ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground")}>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-current text-xs">{index < state.step ? <Check aria-hidden="true" className="h-3.5 w-3.5" /> : index + 1}</span><span>{label}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          <div className="min-w-0 px-4 py-8 sm:px-6 lg:px-10 lg:py-12 xl:px-16 print:p-0">
            <div ref={mainHeading} tabIndex={-1} aria-labelledby="demo-step-title" className="mx-auto max-w-5xl outline-none">
              {systemNotice ? (
                <div role="alert" className="mb-8 rounded-xl border border-sky-400/50 bg-sky-400/10 p-4 print:hidden">
                  <div className="flex items-start gap-3"><Info aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" /><div className="flex-1"><p className="font-semibold text-sky-100">{systemNotice === "version_conflict" ? "Conflit de version locale récupéré" : "État local indisponible"}</p><p className="mt-1 text-sm text-muted-foreground">{systemNotice === "version_conflict" ? "Une ancienne structure de session était incompatible. Elle n’a pas été interprétée, car cela aurait pu altérer le sens des choix. Un état initial propre a été restauré ; le reste du site et les corpus sont préservés. Vous pouvez recommencer le parcours ou demander une revue humaine si une décision devait être reprise." : "La session n’a pas pu être lue ou enregistrée. Aucun résultat scientifique n’est perdu ni envoyé ailleurs. Vous pouvez continuer temporairement, réinitialiser, ou faire reprendre la décision par une personne."}</p><button type="button" onClick={() => setSystemNotice(null)} className="mt-3 min-h-10 rounded-lg border border-border px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Masquer ce message</button></div></div>
                </div>
              ) : null}

              {scenario && state.step > 0 && (criticalBlockers.length > 0 || state.contradiction) ? (
                <div role="alert" className="mb-8 rounded-xl border border-amber-400/60 bg-amber-400/10 p-4 print:border-amber-800 print:bg-white">
                  <div className="flex items-start gap-3"><ShieldAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-amber-300 print:text-amber-800" /><div><p className="font-semibold text-amber-100 print:text-amber-900">{criticalBlockers.length > 0 ? `${criticalBlockers.length} bloqueur${criticalBlockers.length > 1 ? "s" : ""} critique${criticalBlockers.length > 1 ? "s" : ""}` : "Contradiction active"}{criticalBlockers.length > 0 && state.contradiction ? " · contradiction active" : ""}</p>{criticalBlockers.length > 0 ? <p className="mt-1 text-sm text-muted-foreground print:text-slate-700">{criticalBlockers.map((item) => item.label).join(" · ")}. Une décision ne peut pas être confirmée tant qu’ils restent inconnus.</p> : null}{state.contradiction ? <p className="mt-1 text-sm text-muted-foreground print:text-slate-700">La contradiction signalée reste préservée et exige une revue humaine ; le démonstrateur ne la résout pas silencieusement.</p> : null}</div></div>
                </div>
              ) : null}

              {renderStep()}

              {error ? <div role="alert" className="mt-8 flex items-start gap-3 rounded-xl border border-destructive/60 bg-destructive/10 p-4 text-sm"><CircleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />{error}</div> : null}

              <div className="mt-10 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between print:hidden">
                <button type="button" disabled={state.step === 0} onClick={previous} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border px-5 py-3 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-30"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Précédent</button>
                {state.step < STEPS.length - 1 ? <button type="button" onClick={next} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Continuer<ArrowRight aria-hidden="true" className="h-4 w-4" /></button> : null}
              </div>

              <aside className="mt-12 grid gap-3 rounded-xl border border-border bg-card/30 p-4 text-xs text-muted-foreground sm:grid-cols-3 print:hidden">
                <p className="flex gap-2"><Scale aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />Aucune option classée automatiquement.</p>
                <p className="flex gap-2"><Info aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />Aucune donnée envoyée à un service distant.</p>
                <p className="flex gap-2"><CircleHelp aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />Démonstrateur non clinique, corpus figés.</p>
              </aside>
            </div>
          </div>
        </div>
      </main>
      <div className="print:hidden"><Footer /></div>
    </>
  );
};

export default ProtocolDesignerDemo;
