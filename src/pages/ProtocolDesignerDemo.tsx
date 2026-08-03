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
const DEMO_SCHEMA_VERSION = 2;

const STEPS = [
  "Intention",
  "Compréhension",
  "Hypothèses",
  "Informations manquantes",
  "Stratégie",
  "Revue critique",
  "Rapport",
] as const;

type DecisionOutcome = "retain" | "adapt" | "defer" | "refuse";

const DECISION_LABELS: Record<DecisionOutcome, string> = {
  retain: "Retenir",
  adapt: "Adapter",
  defer: "Différer",
  refuse: "Refuser",
};

type ImpactSummary = {
  reason: string;
  preserved: string;
  invalidated: string;
};

type DecisionHistoryEntry = {
  outcome: DecisionOutcome;
  author: string;
  scope: string;
  justification: string;
  reservations: string;
  strategyTitle: string | null;
  decidedAt: string;
};

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
  decisionOutcome: DecisionOutcome | null;
  decisionAuthor: string;
  decisionScope: string;
  decisionJustification: string;
  decisionReservations: string;
  decisionConfirmed: boolean;
  decidedAt: string | null;
  decisionHistory: DecisionHistoryEntry[];
  impactSummary: ImpactSummary | null;
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
  decisionOutcome: null,
  decisionAuthor: "",
  decisionScope: "Démonstration locale",
  decisionJustification: "",
  decisionReservations: "",
  decisionConfirmed: false,
  decidedAt: null,
  decisionHistory: [],
  impactSummary: null,
};

type SystemNotice = "version_conflict" | "recovered_state" | null;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const clampStep = (value: unknown) => typeof value === "number" && Number.isInteger(value) ? Math.max(0, Math.min(value, STEPS.length - 1)) : 0;

const sanitizeChoiceRecord = <T extends string>(value: unknown, accepted: readonly T[]) => {
  if (!isRecord(value)) return {} as Record<string, T>;
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, T] => typeof entry[1] === "string" && accepted.includes(entry[1] as T)));
};

const normalizeState = (value: unknown): DemoState => {
  if (!isRecord(value)) return initialState;
  const scenarioId = typeof value.scenarioId === "string" && scenarioById(value.scenarioId) ? value.scenarioId as ScenarioId : null;
  const scenario = scenarioById(scenarioId);
  const intentIds = [...INTENT_CHOICES.map((item) => item.id), "other"];
  const intentId = typeof value.intentId === "string" && intentIds.includes(value.intentId) ? value.intentId : null;
  const hypothesisStates = sanitizeChoiceRecord(value.hypothesisStates, ["accepted", "rejected"] as const);
  const informationStates = sanitizeChoiceRecord(value.informationStates, ["available", "unknown"] as const);
  const strategyId = scenario?.strategies.some((item) => item.id === value.strategyId) ? value.strategyId as string : null;
  const outcome = ["retain", "adapt", "defer", "refuse"].includes(String(value.decisionOutcome)) ? value.decisionOutcome as DecisionOutcome : null;
  const criticalUnknown = scenario?.missingInformation.some((item) => item.critical && informationStates[item.id] !== "available") ?? false;
  const author = typeof value.decisionAuthor === "string" ? value.decisionAuthor.slice(0, 80) : "";
  const scope = typeof value.decisionScope === "string" ? value.decisionScope.slice(0, 120) : initialState.decisionScope;
  const justification = typeof value.decisionJustification === "string" ? value.decisionJustification.slice(0, 500) : "";
  const outcomeNeedsStrategy = outcome === "retain" || outcome === "adapt";
  const contradiction = value.contradiction === true;
  const decisionConfirmed = value.decisionConfirmed === true
    && Boolean(outcome && author.trim() && scope.trim() && justification.trim())
    && (!outcomeNeedsStrategy || Boolean(strategyId))
    && !criticalUnknown
    && !(contradiction && outcomeNeedsStrategy);
  const step = clampStep(value.step);
  const maxStep = Math.max(step, clampStep(value.maxStep));
  const decisionHistory = Array.isArray(value.decisionHistory) ? value.decisionHistory.flatMap((entry) => {
    if (!isRecord(entry) || !["retain", "adapt", "defer", "refuse"].includes(String(entry.outcome)) || typeof entry.author !== "string" || typeof entry.scope !== "string" || typeof entry.justification !== "string" || typeof entry.decidedAt !== "string") return [];
    return [{ outcome: entry.outcome as DecisionOutcome, author: entry.author.slice(0, 80), scope: entry.scope.slice(0, 120), justification: entry.justification.slice(0, 500), reservations: typeof entry.reservations === "string" ? entry.reservations.slice(0, 500) : "", strategyTitle: typeof entry.strategyTitle === "string" ? entry.strategyTitle : null, decidedAt: entry.decidedAt }];
  }).slice(-5) : [];

  return {
    ...initialState,
    step,
    maxStep,
    intentId,
    scenarioId,
    formulation: typeof value.formulation === "string" ? value.formulation.slice(0, 320) : "",
    context: typeof value.context === "string" ? value.context.slice(0, 500) : "",
    outsideScope: value.outsideScope === true && !scenarioId,
    contradiction,
    openDepths: Array.isArray(value.openDepths) ? value.openDepths.filter((item): item is number => [1, 2, 3].includes(Number(item))) : [1],
    hypothesisStates,
    informationStates,
    strategyId,
    decisionOutcome: outcome,
    decisionAuthor: author,
    decisionScope: scope,
    decisionJustification: justification,
    decisionReservations: typeof value.decisionReservations === "string" ? value.decisionReservations.slice(0, 500) : "",
    decisionConfirmed,
    decidedAt: decisionConfirmed && typeof value.decidedAt === "string" ? value.decidedAt : null,
    decisionHistory,
    impactSummary: null,
  };
};

const loadState = (): { state: DemoState; notice: SystemNotice } => {
  if (typeof window === "undefined") return { state: initialState, notice: null };
  try {
    const saved = window.sessionStorage.getItem(SESSION_KEY);
    if (!saved) return { state: initialState, notice: null };
    const parsed = JSON.parse(saved) as { schemaVersion?: number; state?: unknown };
    if (parsed.schemaVersion !== DEMO_SCHEMA_VERSION || !parsed.state) return { state: initialState, notice: "version_conflict" };
    return { state: normalizeState(parsed.state), notice: null };
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

const clearDecision = (current: DemoState): DemoState => {
  const scenario = scenarioById(current.scenarioId);
  const selectedStrategy = scenario?.strategies.find((option) => option.id === current.strategyId);
  const decisionHistory = current.decisionConfirmed && current.decisionOutcome && current.decidedAt ? [
    ...current.decisionHistory,
    {
      outcome: current.decisionOutcome,
      author: current.decisionAuthor,
      scope: current.decisionScope,
      justification: current.decisionJustification,
      reservations: current.decisionReservations,
      strategyTitle: selectedStrategy?.title ?? null,
      decidedAt: current.decidedAt,
    },
  ].slice(-5) : current.decisionHistory;
  return {
    ...current,
    decisionOutcome: null,
    decisionAuthor: "",
    decisionScope: initialState.decisionScope,
    decisionJustification: "",
    decisionReservations: "",
    decisionConfirmed: false,
    decidedAt: null,
    decisionHistory,
  };
};

const reviseDecision = (current: DemoState, patch: Partial<DemoState>): DemoState => ({
  ...current,
  ...patch,
  decisionConfirmed: false,
  decidedAt: null,
  decisionHistory: clearDecision(current).decisionHistory,
  maxStep: Math.min(current.maxStep, 5),
});

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
  const outcomeNeedsStrategy = state.decisionOutcome === "retain" || state.decisionOutcome === "adapt";
  const confirmationBlocked = criticalBlockers.length > 0 || (state.contradiction && outcomeNeedsStrategy);
  const reportIsProvisional = !state.decisionConfirmed;

  const invalidate = (
    current: DemoState,
    boundary: number,
    reason: string,
    patch: Partial<DemoState>,
    resetAnalysis = false,
  ): DemoState => {
    const invalidated = current.maxStep > boundary || current.decisionConfirmed || Boolean(current.strategyId);
    const base = clearDecision({
      ...current,
      ...patch,
      maxStep: Math.min(current.maxStep, boundary),
      strategyId: boundary < 4 ? null : patch.strategyId ?? current.strategyId,
      hypothesisStates: resetAnalysis ? {} : patch.hypothesisStates ?? current.hypothesisStates,
      informationStates: resetAnalysis ? {} : patch.informationStates ?? current.informationStates,
    });
    return {
      ...base,
      impactSummary: invalidated ? {
        reason,
        preserved: "L’intention saisie et les éléments explicitement déclarés restent visibles dans la session.",
        invalidated: `Les étapes ${boundary + 2} à 7, la stratégie et toute décision antérieure doivent être réexaminées.`,
      } : current.impactSummary,
    };
  };

  const selectScenario = (scenarioId: ScenarioId) => {
    setState((current) => invalidate(current, 1, "Le scénario scientifique a été modifié.", {
      scenarioId,
      outsideScope: false,
      contradiction: false,
      openDepths: [1],
    }, true));
    setError("");
  };

  const next = () => {
    if (state.step === 0 && (!state.intentId || !state.formulation.trim())) {
      setError("Choisissez une intention et formulez l’objectif scientifique avant de continuer.");
      return;
    }
    if (state.step === 1 && !scenario) {
      if (state.outsideScope) {
        setState((current) => ({ ...current, step: 6, maxStep: 6, impactSummary: null }));
        setError("");
        return;
      }
      setError("Choisissez un scénario préparé ou déclarez que le besoin est hors périmètre.");
      return;
    }
    if (state.step === 4 && criticalBlockers.length === 0 && !state.strategyId) {
      setError("Retenez une option pour la revue, sans lui attribuer de supériorité automatique.");
      return;
    }
    const nextStep = Math.min(state.step + 1, STEPS.length - 1);
    setState((current) => ({ ...current, step: nextStep, maxStep: Math.max(current.maxStep, nextStep), impactSummary: null }));
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

  const renderOutsideScopeReport = () => (
    <div className="space-y-8">
      <SectionTitle eyebrow="Étape 7 sur 7" title="Rapport provisoire de non-évaluabilité" text="Le besoin déclaré ne correspond à aucun scénario préparé. Aucun raisonnement scientifique de substitution n’a été inventé." />
      <article id="protocol-designer-report" className="space-y-7 rounded-2xl border border-amber-400/50 bg-card/50 p-5 sm:p-8 print:border-0 print:bg-white print:p-0 print:text-slate-950">
        <header className="border-b border-border pb-6 print:border-slate-300">
          <p className="font-mono text-xs text-primary print:text-slate-600">NOXIA · RAPPORT PROVISOIRE · NON ÉVALUABLE</p>
          <h2 className="mt-2 text-2xl font-bold">Besoin hors périmètre des trois fixtures</h2>
          <p className="mt-3 text-sm text-amber-200 print:text-amber-900">Aucune décision humaine enregistrée. Aucun corpus propriétaire n’a été substitué.</p>
        </header>
        <section><h3 className="font-semibold">Intention</h3><p className="mt-2 text-sm text-muted-foreground print:text-slate-700">{state.formulation}</p></section>
        <section><h3 className="font-semibold">Condition de refus</h3><p className="mt-2 text-sm text-muted-foreground print:text-slate-700">Aucun scénario préparé ne couvre le besoin déclaré. Le démonstrateur refuse de produire une stratégie, une recommandation ou une fausse preuve.</p></section>
        <section><h3 className="font-semibold">Suite sous autorité humaine</h3><p className="mt-2 text-sm text-muted-foreground print:text-slate-700">Reformuler l’intention, sélectionner un scénario admis ou organiser une revue humaine hors de ce démonstrateur.</p></section>
        <footer className="border-t border-border pt-5 text-xs text-muted-foreground print:border-slate-300 print:text-slate-600">Ce rapport n’a pas été évalué sous PD-011. Il ne constitue pas un protocole validé, une recommandation clinique, une activation produit ou une publication.</footer>
      </article>
      <button type="button" onClick={() => window.print()} className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary print:hidden"><Printer aria-hidden="true" className="h-4 w-4" />Imprimer ou enregistrer en PDF</button>
    </div>
  );

  const renderStep = () => {
    if (state.step === 0) {
      return (
        <div className="space-y-10">
          <SectionTitle eyebrow="Étape 1 sur 7" title="Quelle est votre intention ?" text="Le parcours commence par le verbe d’action. Aucun Programme, Reasoning Book ou choix de modalité n’est imposé à ce stade." />
          <fieldset>
            <legend className="text-sm font-semibold">1. Choisissez une intention</legend>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {INTENT_CHOICES.map((intent) => (
                <button key={intent.id} type="button" aria-pressed={state.intentId === intent.id} onClick={() => setState((current) => invalidate(current, 0, "L’intention directrice a été modifiée.", { intentId: intent.id }, true))} className={cn("min-h-24 rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", state.intentId === intent.id ? "border-primary bg-primary/10" : "border-border bg-card/50 hover:border-primary/50")}>
                  <span className="block font-semibold">{intent.label}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{intent.explanation}</span>
                </button>
              ))}
              <button type="button" aria-pressed={state.intentId === "other"} onClick={() => setState((current) => invalidate(current, 0, "Une autre intention a été choisie.", { intentId: "other" }, true))} className={cn("min-h-24 rounded-xl border border-dashed p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", state.intentId === "other" ? "border-primary bg-primary/10" : "border-border bg-card/30 hover:border-primary/50")}>
                <span className="block font-semibold">Autre objectif</span>
                <span className="mt-1 block text-sm text-muted-foreground">Formuler librement un objectif sans forcer son rattachement.</span>
              </button>
            </div>
          </fieldset>
          <div>
            <label htmlFor="formulation" className="text-sm font-semibold">2. Formulation de l’intention</label>
            <textarea id="formulation" value={state.formulation} onChange={(event) => setState((current) => invalidate(current, 0, "La formulation de l’intention a été modifiée.", { formulation: event.target.value }, true))} rows={3} maxLength={320} placeholder="Décrivez l’objectif scientifique, sans donnée patient." className="mt-3 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary" />
            <p className="mt-2 text-xs text-muted-foreground">Texte conservé uniquement dans cette session du navigateur. 320 caractères maximum.</p>
          </div>
        </div>
      );
    }

    if (state.step === 1 && !scenario) {
      return (
        <div className="space-y-8">
          <SectionTitle eyebrow="Étape 2 sur 7" title="Quel scénario préparé peut éclairer l’intention ?" text="Le rattachement vient après la formulation. Les identifiants documentaires restent accessibles dans la vue secondaire « Fondations scientifiques »." />
          <div className="grid gap-4 lg:grid-cols-3">
            {DEMONSTRATOR_SCENARIOS.map((item) => (
              <button key={item.id} type="button" aria-pressed="false" onClick={() => selectScenario(item.id)} className="rounded-xl border border-border bg-card/40 p-5 text-left transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <span className="block text-lg font-semibold">{item.shortLabel}</span>
                <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">{item.comprehension}</span>
              </button>
            ))}
          </div>
          <button type="button" aria-pressed={state.outsideScope} onClick={() => setState((current) => invalidate(current, 1, "Le besoin a été déclaré hors du périmètre préparé.", { scenarioId: null, outsideScope: true }, true))} className="min-h-11 text-left text-sm font-medium text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            Aucun de ces scénarios ne correspond à mon besoin
          </button>
          {state.outsideScope ? (
            <div role="status" className="rounded-xl border border-amber-400/50 bg-amber-400/10 p-4">
              <p className="font-semibold text-amber-100">Besoin hors périmètre — rapport provisoire disponible</p>
              <p className="mt-1 text-sm text-muted-foreground">Aucun calcul ni rattachement scientifique n’est tenté. Le rapport conservera l’intention, la condition de refus et la nécessité d’une revue humaine.</p>
            </div>
          ) : null}
        </div>
      );
    }

    if (state.step === 6 && !scenario) return renderOutsideScopeReport();
    if (!scenario) return null;

    if (state.step === 1) {
      return (
        <div className="space-y-8">
          <SectionTitle eyebrow="Étape 2 sur 7" title="Comprendre la question avant d’agir" text={scenario.comprehension} />
          <div className="flex flex-wrap gap-2"><StatusChip>{scenario.program.id} v{scenario.program.version}</StatusChip><StatusChip>{scenario.reasoningBook.id} v{scenario.reasoningBook.version}</StatusChip><StatusChip tone="warning">{scenario.fixtureStatus}</StatusChip><StatusChip>Connaissances : 03/08/2026</StatusChip></div>
          <DisclosureStack scenario={scenario} openDepths={state.openDepths} onDepthChange={(depth, open) => setState((current) => ({ ...current, openDepths: open ? [...new Set([...current.openDepths, depth])].sort() : current.openDepths.filter((item) => item !== depth) }))} />
          <section className="rounded-xl border border-border bg-card/40 p-5">
            <label htmlFor="scientific-context" className="font-semibold">Contexte utile à la démonstration</label>
            <p className="mt-2 text-sm text-muted-foreground">Ajoutez uniquement un contexte scientifique non sensible. Une absence reste explicitement visible dans le rapport.</p>
            <textarea id="scientific-context" value={state.context} onChange={(event) => setState((current) => invalidate(current, 1, "Le contexte scientifique a été modifié.", { context: event.target.value }))} rows={3} maxLength={500} placeholder="Population d’étude, contexte multicentrique ou contrainte méthodologique…" className="mt-3 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary" />
          </section>
          <section className="rounded-xl border border-border bg-card/40 p-5">
            <h2 className="font-semibold">Test de contradiction</h2>
            <p className="mt-2 text-sm text-muted-foreground">Le signalement conserve deux positions documentées. Le système ne les fusionne pas et ne les arbitre pas seul.</p>
            <button type="button" aria-pressed={state.contradiction} onClick={() => setState((current) => invalidate(current, 1, "L’état de contradiction a été modifié.", { contradiction: !current.contradiction }))} className={cn("mt-4 min-h-11 rounded-lg border px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", state.contradiction ? "border-amber-400 bg-amber-400/10 text-amber-100" : "border-border hover:border-primary/50")}>
              {state.contradiction ? "Contradiction signalée" : "Signaler une contradiction"}
            </button>
            {state.contradiction ? <div role="alert" className="mt-4 grid gap-3 sm:grid-cols-2">{scenario.contradictionPositions.map((position) => <article key={position.label} className="rounded-lg border border-amber-400/40 p-4"><h3 className="text-sm font-semibold text-amber-100">{position.label}</h3><p className="mt-2 text-sm text-muted-foreground">{position.statement}</p><p className="mt-2 font-mono text-xs text-primary">{position.locator}</p></article>)}</div> : null}
          </section>
        </div>
      );
    }

    if (state.step === 2) {
      return (
        <div className="space-y-8">
          <SectionTitle eyebrow="Étape 3 sur 7" title="Rendre les hypothèses contestables" text="Aucune hypothèse n’est acceptée par défaut. Une absence de position reste une incertitude explicite." />
          <div className="space-y-4">{scenario.hypotheses.map((hypothesis, index) => { const value = state.hypothesisStates[String(index)]; return (
            <article key={hypothesis} className="rounded-xl border border-border bg-card/40 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-semibold">Hypothèse {index + 1}</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{hypothesis}</p></div><StatusChip tone={value === "accepted" ? "good" : value === "rejected" ? "warning" : "neutral"}>{value === "accepted" ? "Retenue" : value === "rejected" ? "Contestée" : "Non examinée"}</StatusChip></div>
              <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={`Position sur l’hypothèse ${index + 1}`}>{(["accepted", "rejected"] as const).map((choice) => <button key={choice} type="button" aria-pressed={value === choice} onClick={() => setState((current) => invalidate(current, 2, "Une hypothèse a été réexaminée.", { hypothesisStates: { ...current.hypothesisStates, [String(index)]: choice } }))} className={cn("min-h-11 rounded-lg border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", value === choice ? "border-primary bg-primary/10" : "border-border")}>{choice === "accepted" ? "Retenir" : "Contester"}</button>)}</div>
            </article>
          ); })}</div>
        </div>
      );
    }

    if (state.step === 3) {
      return (
        <div className="space-y-8">
          <SectionTitle eyebrow="Étape 4 sur 7" title="Qualifier les informations manquantes" text="Les éléments critiques non disponibles restent visibles. Ils n’empêchent pas un rapport provisoire, mais interdisent une décision aboutie." />
          <div className="space-y-4">{scenario.missingInformation.map((item) => { const value = state.informationStates[item.id]; return (
            <article key={item.id} className={cn("rounded-xl border p-5", item.critical && value !== "available" ? "border-amber-400/50 bg-amber-400/5" : "border-border bg-card/40")}>
              <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{item.label}</h2>{item.critical ? <StatusChip tone="warning">Critique</StatusChip> : <StatusChip>Secondaire</StatusChip>}</div>
              <p className="mt-2 text-sm text-muted-foreground">{item.why}</p>
              <p className="mt-2 text-xs text-muted-foreground"><span className="font-semibold text-foreground">Décision affectée :</span> recevabilité de la stratégie. Si l’information reste inconnue, {item.critical ? "la décision est non évaluable" : "le risque résiduel est conservé dans la revue"}.</p>
              <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={`Disponibilité : ${item.label}`}>{(["available", "unknown"] as const).map((choice) => <button key={choice} type="button" aria-pressed={value === choice} onClick={() => setState((current) => invalidate(current, 3, "Une information nécessaire a été requalifiée.", { informationStates: { ...current.informationStates, [item.id]: choice } }))} className={cn("min-h-11 rounded-lg border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", value === choice ? "border-primary bg-primary/10" : "border-border")}>{choice === "available" ? "Disponible dans mon contexte" : "Inconnu ou indisponible"}</button>)}</div>
            </article>
          ); })}</div>
        </div>
      );
    }

    if (state.step === 4) {
      return (
        <div className="space-y-8">
          <SectionTitle eyebrow="Étape 5 sur 7" title="Comparer des stratégies, sans classement automatique" text="Les options exposent bénéfice, compromis et condition. Elles ne contiennent ni protocole technique ni recommandation clinique." />
          <div className="grid gap-4 lg:grid-cols-2">{scenario.strategies.map((option) => (
            <article key={option.id} className={cn("rounded-xl border p-5", state.strategyId === option.id ? "border-primary bg-primary/10" : "border-border bg-card/40")}>
              <h2 className="text-lg font-semibold">{option.title}</h2>
              <div className="mt-3 flex flex-wrap gap-2"><StatusChip tone={criticalBlockers.length ? "warning" : "good"}>{criticalBlockers.length ? "Non évaluable" : "Recevable pour revue"}</StatusChip><StatusChip>Niveau 1 · Compréhension</StatusChip></div>
              <dl className="mt-4 space-y-3 text-sm"><div><dt className="font-semibold">Objectif couvert</dt><dd className="mt-1 text-muted-foreground">{state.formulation}</dd></div><div><dt className="font-semibold text-emerald-200">Bénéfice</dt><dd className="mt-1 text-muted-foreground">{option.benefit}</dd></div><div><dt className="font-semibold text-amber-200">Limite et renoncement</dt><dd className="mt-1 text-muted-foreground">{option.tradeoff}</dd></div></dl>
              <details className="mt-4 rounded-lg border border-border/70 bg-background/40"><summary className="min-h-11 cursor-pointer px-3 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Niveau 2 · Dépendances, risques et provenance</summary><dl className="space-y-3 border-t border-border/70 px-3 py-4 text-sm"><div><dt className="font-semibold">Dépendances</dt><dd className="mt-1 text-muted-foreground">{option.condition}</dd></div><div><dt className="font-semibold">Données encore inconnues</dt><dd className="mt-1 text-muted-foreground">{scenario.missingInformation.filter((item) => state.informationStates[item.id] !== "available").map((item) => item.label).join(" · ") || "Aucune information critique restante dans la session."}</dd></div><div><dt className="font-semibold">Risque résiduel</dt><dd className="mt-1 text-muted-foreground">{scenario.controversy}</dd></div><div><dt className="font-semibold">Preuve ou corpus mobilisé</dt><dd className="mt-1 font-mono text-xs text-primary">{scenario.evidence[0].locator}</dd></div></dl></details>
              <button type="button" disabled={criticalBlockers.length > 0} aria-pressed={state.strategyId === option.id} onClick={() => setState((current) => invalidate(current, 4, "L’option soumise à revue a été modifiée.", { strategyId: option.id }))} className="mt-5 min-h-11 w-full rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:border-border disabled:text-muted-foreground">{state.strategyId === option.id ? "Option retenue pour revue" : "Retenir pour la revue"}</button>
            </article>
          ))}</div>
          {criticalBlockers.length > 0 ? <p role="alert" className="rounded-xl border border-amber-400/50 bg-amber-400/10 p-4 text-sm text-amber-100">Sélection désactivée : la revue et un rapport provisoire restent accessibles, mais aucune décision aboutie ne peut être confirmée.</p> : null}
        </div>
      );
    }

    if (state.step === 5) {
      return (
        <div className="space-y-8">
          <SectionTitle eyebrow="Étape 6 sur 7" title="Revue critique et décision humaine" text="La sélection précédente reste un projet. Une personne peut retenir, adapter, différer ou refuser, avec une justification explicite." />
          <section className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card/40 p-5"><h2 className="font-semibold">Option soumise à revue</h2><p className="mt-2 text-lg">{selectedStrategy?.title ?? "Aucune option — état non évaluable"}</p><p className="mt-3 text-sm text-muted-foreground">Controverse : {scenario.controversy}</p>{state.contradiction ? <p className="mt-3 text-sm text-amber-200">Deux positions documentées restent ouvertes ; retenir ou adapter est bloqué sans arbitrage.</p> : null}<div className="mt-4 flex flex-wrap gap-2"><StatusChip tone="warning">Revue humaine requise</StatusChip><StatusChip>{criticalBlockers.length ? "Non évaluable" : state.contradiction ? "Arbitrage requis" : "Recevable pour décision"}</StatusChip></div></div>
            <div className="rounded-xl border border-border bg-card/40 p-5">
              <h2 className="flex items-center gap-2 font-semibold"><UserCheck aria-hidden="true" className="h-5 w-5 text-primary" />Responsabilité de la décision</h2>
              <fieldset className="mt-4"><legend className="text-sm font-medium">Décision</legend><div className="mt-2 grid grid-cols-2 gap-2">{(Object.keys(DECISION_LABELS) as DecisionOutcome[]).map((outcome) => <button key={outcome} type="button" aria-pressed={state.decisionOutcome === outcome} onClick={() => setState((current) => reviseDecision(current, { decisionOutcome: outcome }))} className={cn("min-h-11 rounded-lg border px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", state.decisionOutcome === outcome ? "border-primary bg-primary/10" : "border-border")}>{DECISION_LABELS[outcome]}</button>)}</div></fieldset>
              <label htmlFor="decision-justification" className="mt-4 block text-sm font-medium">Justification</label><textarea id="decision-justification" value={state.decisionJustification} onChange={(event) => setState((current) => reviseDecision(current, { decisionJustification: event.target.value }))} rows={3} maxLength={500} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-primary" />
              <label htmlFor="decision-reservations" className="mt-4 block text-sm font-medium">Réserves éventuelles</label><textarea id="decision-reservations" value={state.decisionReservations} onChange={(event) => setState((current) => reviseDecision(current, { decisionReservations: event.target.value }))} rows={2} maxLength={500} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-primary" />
              <label htmlFor="decision-author" className="mt-4 block text-sm font-medium">Auteur de la décision</label><input id="decision-author" value={state.decisionAuthor} onChange={(event) => setState((current) => reviseDecision(current, { decisionAuthor: event.target.value }))} maxLength={80} className="mt-2 min-h-11 w-full rounded-lg border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-primary" />
              <label htmlFor="decision-scope" className="mt-4 block text-sm font-medium">Portée déclarée</label><input id="decision-scope" value={state.decisionScope} onChange={(event) => setState((current) => reviseDecision(current, { decisionScope: event.target.value }))} maxLength={120} className="mt-2 min-h-11 w-full rounded-lg border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-primary" />
              <button type="button" disabled={!state.decisionOutcome || !state.decisionAuthor.trim() || !state.decisionScope.trim() || !state.decisionJustification.trim() || (outcomeNeedsStrategy && !selectedStrategy) || confirmationBlocked} onClick={() => { setState((current) => ({ ...current, decisionConfirmed: true, decidedAt: new Date().toISOString(), impactSummary: null })); setError(""); }} className="mt-5 min-h-12 w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40">{state.decisionConfirmed ? "Décision humaine enregistrée" : "Enregistrer cette décision humaine"}</button>
              {confirmationBlocked ? <p role="alert" className="mt-3 text-sm text-amber-200">{criticalBlockers.length ? "Une information critique empêche toute décision aboutie." : "La contradiction ouverte permet seulement de différer ou refuser sans arbitrage supplémentaire."}</p> : null}
            </div>
          </section>
          <section className="rounded-xl border border-border bg-card/40 p-5"><h2 className="font-semibold">Constats de revue</h2><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3"><div><dt className="font-semibold">Cohérence interne</dt><dd className="mt-1 text-muted-foreground">{state.contradiction ? "À arbitrer : contradiction active." : "Structurée pour la démonstration, sans validation scientifique."}</dd></div><div><dt className="font-semibold">Preuves disponibles</dt><dd className="mt-1 text-muted-foreground">{scenario.evidence.length} localisateurs issus de {scenario.reasoningBook.id} v{scenario.reasoningBook.version}.</dd></div><div><dt className="font-semibold">Informations manquantes</dt><dd className="mt-1 text-muted-foreground">{scenario.missingInformation.filter((item) => state.informationStates[item.id] !== "available").length} inconnue(s), dont {criticalBlockers.length} critique(s).</dd></div><div><dt className="font-semibold">Non-évaluabilité</dt><dd className="mt-1 text-muted-foreground">{criticalBlockers.length ? "État non évaluable : information critique absente." : "Aucun motif bloquant déclaré dans la fixture ; ceci ne vaut pas validation."}</dd></div><div><dt className="font-semibold">Risques résiduels</dt><dd className="mt-1 text-muted-foreground">{scenario.controversy}</dd></div><div><dt className="font-semibold">Action proposée</dt><dd className="mt-1 text-muted-foreground">Réexaminer les hypothèses, qualifier les inconnues, puis décider explicitement ou produire un rapport provisoire.</dd></div></dl></section>
          <section className="rounded-xl border border-border bg-card/40 p-5"><h2 className="font-semibold">Limites conservées dans le rapport</h2><ul className="mt-3 space-y-2 text-sm text-muted-foreground">{scenario.limitations.map((limit) => <li key={limit}>• {limit}</li>)}</ul></section>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <SectionTitle eyebrow="Étape 7 sur 7" title={reportIsProvisional ? "Rapport provisoire de raisonnement" : "Rapport de raisonnement"} text="Synthèse locale et imprimable. Ce document ne constitue ni un protocole clinique ni une validation scientifique formelle." />
        <article id="protocol-designer-report" className="space-y-8 rounded-2xl border border-border bg-card/50 p-5 sm:p-8 print:border-0 print:bg-white print:p-0 print:text-slate-950">
          <header className="border-b border-border pb-6 print:border-slate-300"><p className="font-mono text-xs text-primary print:text-slate-600">NOXIA · DÉMONSTRATEUR DÉTERMINISTE · {scenario.fixtureStatus}</p><h2 className="mt-2 text-2xl font-bold">{scenario.title}</h2><p className={cn("mt-3 text-sm print:text-slate-700", reportIsProvisional ? "text-amber-200" : "text-muted-foreground")}>{state.decisionConfirmed ? `Décision humaine « ${DECISION_LABELS[state.decisionOutcome!]} » enregistrée par ${state.decisionAuthor} · Portée : ${state.decisionScope}${state.decidedAt ? ` · ${new Date(state.decidedAt).toLocaleString("fr-FR")}` : ""}` : "Rapport provisoire — aucune décision humaine enregistrée."}</p></header>
          <section><h3 className="font-semibold">Intention</h3><p className="mt-2 text-sm text-muted-foreground print:text-slate-700">{state.formulation}</p></section>
          <section><h3 className="font-semibold">Question reformulée et contexte</h3><p className="mt-2 text-sm text-muted-foreground print:text-slate-700">{scenario.comprehension}</p><p className="mt-2 text-sm text-muted-foreground print:text-slate-700">Contexte déclaré : {state.context.trim() || "aucun contexte additionnel renseigné"}.</p></section>
          <section><h3 className="font-semibold">État de la décision humaine</h3>{state.decisionConfirmed ? <div className="mt-2 space-y-2 text-sm text-muted-foreground print:text-slate-700"><p>{DECISION_LABELS[state.decisionOutcome!]}. {selectedStrategy ? `Option concernée : ${selectedStrategy.title}.` : "Aucune option technique retenue."}</p><p>Justification : {state.decisionJustification}</p><p>Réserves : {state.decisionReservations.trim() || "aucune réserve additionnelle déclarée"}.</p></div> : <p className="mt-2 text-sm text-amber-200 print:text-amber-900">Non évalué pour une décision aboutie : {criticalBlockers.length ? `${criticalBlockers.length} information(s) critique(s) restent inconnue(s)` : "la décision humaine n’a pas été enregistrée"}.</p>}</section>
          {selectedStrategy ? <section><h3 className="font-semibold">Stratégie candidate examinée</h3><dl className="mt-2 grid gap-3 text-sm sm:grid-cols-3"><div><dt className="font-semibold">Bénéfice</dt><dd className="mt-1 text-muted-foreground print:text-slate-700">{selectedStrategy.benefit}</dd></div><div><dt className="font-semibold">Compromis</dt><dd className="mt-1 text-muted-foreground print:text-slate-700">{selectedStrategy.tradeoff}</dd></div><div><dt className="font-semibold">Condition</dt><dd className="mt-1 text-muted-foreground print:text-slate-700">{selectedStrategy.condition}</dd></div></dl></section> : null}
          <section><h3 className="font-semibold">Alternatives non classées</h3><p className="mt-2 text-sm text-muted-foreground print:text-slate-700">{scenario.strategies.filter((item) => item.id !== state.strategyId).map((item) => item.title).join(" · ") || "Aucune"}. Le démonstrateur n’attribue pas d’infériorité universelle à ces alternatives.</p></section>
          <section><h3 className="font-semibold">Hypothèses</h3><ul className="mt-2 space-y-2 text-sm text-muted-foreground print:text-slate-700">{scenario.hypotheses.map((item, index) => <li key={item}>• {item} — {state.hypothesisStates[String(index)] === "accepted" ? "retenue" : state.hypothesisStates[String(index)] === "rejected" ? "contestée" : "non examinée"}</li>)}</ul></section>
          <section><h3 className="font-semibold">Informations manquantes</h3><ul className="mt-2 space-y-2 text-sm text-muted-foreground print:text-slate-700">{scenario.missingInformation.map((item) => <li key={item.id}>• {item.label} — {state.informationStates[item.id] === "available" ? "déclarée disponible" : "inconnue ou indisponible"}{item.critical ? " — critique" : ""}</li>)}</ul></section>
          <section><h3 className="font-semibold">Evidence Map</h3><div className="mt-3 grid gap-3 sm:grid-cols-2">{scenario.evidence.map((item) => <div key={item.locator} className="rounded-lg border border-border p-4 print:border-slate-300"><p className="font-semibold">{item.label}</p><p className="mt-1 font-mono text-xs text-primary print:text-slate-700">{item.locator} · {item.relation}</p><p className="mt-2 text-sm text-muted-foreground print:text-slate-700">{item.contribution}</p></div>)}</div></section>
          {state.contradiction ? <section><h3 className="font-semibold">Contradiction non résolue</h3><div className="mt-3 grid gap-3 sm:grid-cols-2">{scenario.contradictionPositions.map((position) => <div key={position.label} className="rounded-lg border border-amber-400/50 p-4 print:border-amber-700"><p className="font-semibold">{position.label}</p><p className="mt-2 text-sm text-muted-foreground print:text-slate-700">{position.statement}</p><p className="mt-2 font-mono text-xs text-primary print:text-slate-700">{position.locator}</p></div>)}</div></section> : null}
          <section><h3 className="font-semibold">Limites, controverses et risques résiduels</h3><ul className="mt-2 space-y-2 text-sm text-muted-foreground print:text-slate-700">{scenario.limitations.map((item) => <li key={item}>• {item}</li>)}<li>• {scenario.controversy}</li></ul></section>
          <section><h3 className="font-semibold">Knowledge Gap</h3><p className="mt-2 text-sm text-muted-foreground print:text-slate-700">{scenario.openQuestion}</p></section>
          {state.decisionHistory.length > 0 ? <section><h3 className="font-semibold">Historique local des décisions remplacées</h3><ul className="mt-2 space-y-3 text-sm text-muted-foreground print:text-slate-700">{state.decisionHistory.map((entry) => <li key={`${entry.decidedAt}-${entry.outcome}`} className="rounded-lg border border-border p-3 print:border-slate-300">{DECISION_LABELS[entry.outcome]} par {entry.author} · {new Date(entry.decidedAt).toLocaleString("fr-FR")} · {entry.strategyTitle ?? "aucune stratégie"}. Cause de révision conservée dans le différentiel de session ; justification antérieure : {entry.justification}</li>)}</ul></section> : null}
          <footer className="border-t border-border pt-5 text-xs text-muted-foreground print:border-slate-300 print:text-slate-600">Sources propriétaires : {scenario.program.id} « {scenario.program.title} » v{scenario.program.version} · {scenario.reasoningBook.id} « {scenario.reasoningBook.title} » v{scenario.reasoningBook.version}. État des connaissances : 3 août 2026. {scenario.fixtureStatus}. Ce rapport n’a pas été évalué sous PD-011. Il ne constitue pas un protocole validé, une recommandation clinique, une activation produit ou une publication.</footer>
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
                <div className="fixed inset-x-4 top-24 z-30 max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-popover p-5 shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[min(88vw,34rem)]">
                  <p className="font-semibold">Vue secondaire des corpus propriétaires</p><p className="mt-2 text-sm text-muted-foreground">Statut documentaire officiel distinct de toute validation scientifique ou activation produit.</p>
                  <ul className="mt-4 space-y-3 text-sm">{DEMONSTRATOR_SCENARIOS.map((item) => <li key={item.id} className="rounded-lg border border-border p-3"><span className="font-mono text-xs text-primary">{item.program.id} v{item.program.version}</span><span className="mt-1 block">{item.program.title}</span><span className="mt-1 block text-muted-foreground">{item.reasoningBook.id} · {item.reasoningBook.title} · v{item.reasoningBook.version}</span><span className="mt-1 block text-xs text-muted-foreground">Connaissances : 03/08/2026 · {item.fixtureStatus}</span></li>)}</ul>
                </div>
              </details>
              <AlertDialog><AlertDialogTrigger asChild><button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><RotateCcw aria-hidden="true" className="h-4 w-4" />Réinitialiser</button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Réinitialiser le parcours ?</AlertDialogTitle><AlertDialogDescription>Les choix, qualifications et la décision conservés dans cette session seront effacés.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={reset}>Réinitialiser</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
            </div>
          </div>
        </div>

        <div className="mx-auto grid min-w-0 max-w-[1500px] lg:grid-cols-[17rem_minmax(0,1fr)] print:block">
          <nav aria-label="Étapes du Protocol Designer" className="min-w-0 overflow-hidden border-b border-border/70 p-4 lg:min-h-[calc(100vh-81px)] lg:border-b-0 lg:border-r lg:p-6 print:hidden">
            <ol className="flex max-w-full gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">{STEPS.map((label, index) => <li key={label} className="shrink-0 lg:shrink"><button type="button" disabled={index > state.maxStep} aria-current={index === state.step ? "step" : undefined} onClick={() => { setState((current) => ({ ...current, step: index })); setError(""); }} className={cn("flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40", index === state.step ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground")}><span className="flex h-6 w-6 items-center justify-center rounded-full border border-current text-xs">{index < state.step ? <Check aria-hidden="true" className="h-3.5 w-3.5" /> : index + 1}</span><span>{label}</span></button></li>)}</ol>
          </nav>

          <div className="min-w-0 px-4 py-8 sm:px-6 lg:px-10 lg:py-12 xl:px-16 print:p-0">
            <div ref={mainHeading} tabIndex={-1} aria-labelledby="demo-step-title" className="mx-auto max-w-5xl outline-none">
              {systemNotice ? <div role="alert" className="mb-8 rounded-xl border border-sky-400/50 bg-sky-400/10 p-4 print:hidden"><div className="flex items-start gap-3"><Info aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" /><div className="flex-1"><p className="font-semibold text-sky-100">{systemNotice === "version_conflict" ? "Conflit de version locale récupéré" : "État local indisponible"}</p><p className="mt-1 text-sm text-muted-foreground">{systemNotice === "version_conflict" ? "Une ancienne structure de session était incompatible. Elle n’a pas été interprétée afin de préserver le sens des choix. Un état initial propre a été restauré." : "La session n’a pas pu être lue ou enregistrée. Aucun résultat scientifique n’est perdu ni envoyé ailleurs."}</p><button type="button" onClick={() => setSystemNotice(null)} className="mt-3 min-h-11 rounded-lg border border-border px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Masquer ce message</button></div></div></div> : null}
              {state.impactSummary ? <section aria-labelledby="impact-title" className="mb-8 rounded-xl border border-sky-400/50 bg-sky-400/10 p-4"><div className="flex items-start gap-3"><Info aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" /><div className="flex-1"><h2 id="impact-title" className="font-semibold text-sky-100">Impact de la modification</h2><p className="mt-2 text-sm text-muted-foreground">Modifié : {state.impactSummary.reason}</p><p className="mt-1 text-sm text-muted-foreground">Préservé : {state.impactSummary.preserved}</p><p className="mt-1 text-sm text-muted-foreground">À réexaminer : {state.impactSummary.invalidated}</p><button type="button" onClick={() => setState((current) => ({ ...current, impactSummary: null }))} className="mt-3 min-h-11 rounded-lg border border-border px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">J’ai compris l’impact</button></div></div></section> : null}
              {scenario && state.step > 0 && (criticalBlockers.length > 0 || state.contradiction) ? <div role="alert" className="mb-8 rounded-xl border border-amber-400/60 bg-amber-400/10 p-4 print:border-amber-800 print:bg-white"><div className="flex items-start gap-3"><ShieldAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-amber-300 print:text-amber-800" /><div><p className="font-semibold text-amber-100 print:text-amber-900">{criticalBlockers.length > 0 ? `${criticalBlockers.length} bloqueur${criticalBlockers.length > 1 ? "s" : ""} critique${criticalBlockers.length > 1 ? "s" : ""}` : "Contradiction active"}{criticalBlockers.length > 0 && state.contradiction ? " · contradiction active" : ""}</p>{criticalBlockers.length > 0 ? <p className="mt-1 text-sm text-muted-foreground print:text-slate-700">{criticalBlockers.map((item) => item.label).join(" · ")}. Une décision aboutie ne peut pas être confirmée.</p> : null}{state.contradiction ? <p className="mt-1 text-sm text-muted-foreground print:text-slate-700">Deux positions documentées restent visibles et exigent un arbitrage humain.</p> : null}</div></div></div> : null}

              {renderStep()}
              {error ? <div role="alert" className="mt-8 flex items-start gap-3 rounded-xl border border-destructive/60 bg-destructive/10 p-4 text-sm"><CircleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />{error}</div> : null}
              <div className="mt-10 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between print:hidden"><button type="button" disabled={state.step === 0} onClick={previous} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border px-5 py-3 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-30"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Précédent</button>{state.step < STEPS.length - 1 ? <button type="button" onClick={next} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{state.step === 1 && state.outsideScope ? "Produire le rapport provisoire" : state.step === 5 && !state.decisionConfirmed ? "Produire un rapport provisoire" : "Continuer"}<ArrowRight aria-hidden="true" className="h-4 w-4" /></button> : null}</div>
              <aside className="mt-12 grid gap-3 rounded-xl border border-border bg-card/30 p-4 text-xs text-muted-foreground sm:grid-cols-3 print:hidden"><p className="flex gap-2"><Scale aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />Aucune option classée automatiquement.</p><p className="flex gap-2"><Info aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />Aucune donnée envoyée à un service distant.</p><p className="flex gap-2"><CircleHelp aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />Démonstrateur non clinique, corpus figés.</p></aside>
            </div>
          </div>
        </div>
      </main>
      <div className="print:hidden"><Footer /></div>
    </>
  );
};

export default ProtocolDesignerDemo;
