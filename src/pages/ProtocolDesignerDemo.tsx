import Footer from "@/components/Footer";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { createEmptyInterpretation } from "@/features/protocol-designer/intake/schema";
import { IntakeClientError, requestScientificInterpretation } from "@/features/protocol-designer/intake/client";
import { detectSensitiveData } from "@/features/protocol-designer/intake/privacy";
import { selectAdaptiveQuestions } from "@/features/protocol-designer/intake/questions";
import { canGenerateFinalReport, generateContextualReport, reportToMarkdown } from "@/features/protocol-designer/intake/report";
import { confirmScenario, matchScenarios, scenarioDetails } from "@/features/protocol-designer/intake/scenarios";
import { buildValidatedIntent, createProtocolDesignerSession, deleteSession, invalidateDownstream, loadSessionCandidate, persistSession } from "@/features/protocol-designer/intake/session";
import { INTERPRETED_FIELD_KEYS, type HumanFieldReview, type HumanValidationState, type InterpretedFieldKey, type ProtocolDesignerSession, type ScientificIntakeInterpretation } from "@/features/protocol-designer/intake/types";
import { ArrowLeft, ArrowRight, CircleAlert, Copy, Info, LoaderCircle, Printer, RotateCcw, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const CANONICAL = "https://noxia-imagerie.fr/protocol-designer";
const STEPS = ["Question", "Compréhension", "Orientation", "Questions", "Options", "Décision", "Rapport"] as const;
const EXAMPLES = [
  "Je souhaite comparer deux stratégies de reperfusion après infarctus et étudier leur effet sur les lésions microvasculaires.",
  "Je veux suivre le remodelage ventriculaire après infarctus dans une étude multicentrique.",
  "Je cherche à détecter une atteinte myocardique diffuse chez des patients sans anomalie focale évidente.",
  "Je veux comparer deux méthodes d’imagerie pour mesurer la perfusion cérébrale.",
  "Je dispose uniquement d’IRM 1,5 T dans plusieurs centres et je veux savoir ce qui est réaliste.",
];

const LABELS: Record<InterpretedFieldKey, string> = {
  userExpertise: "Niveau de familiarité", scientificDomain: "Domaine scientifique", clinicalContext: "Contexte clinique",
  scientificPurpose: "Objectif scientifique", population: "Population", pathologyOrCondition: "Pathologie ou condition",
  phenomenaOfInterest: "Phénomènes d’intérêt", interventionsOrGroups: "Groupes ou interventions", outcomesMentioned: "Résultats recherchés",
  studyDesign: "Type d’étude", centers: "Nombre de centres", availableEquipment: "Modalités disponibles", fieldStrengths: "Champ magnétique",
  manufacturers: "Constructeurs", models: "Modèles", softwareVersions: "Versions logicielles", availableData: "Données déjà disponibles",
  constraints: "Contraintes", declaredTimings: "Visites déjà imposées",
};
const ORIGINS: Record<string, string> = {
  EXPLICIT_USER_STATEMENT: "Déclaré par vous", NORMALIZED_FROM_USER_TERM: "Reformulé sans changement de sens",
  TENTATIVE_INTERPRETATION: "Interprétation à confirmer", NOT_PROVIDED: "Non renseigné",
  CONTRADICTORY: "Contradiction détectée", UNSUPPORTED: "Non déductible de votre texte",
};
const ORIGIN_ICONS: Record<string, string> = {
  EXPLICIT_USER_STATEMENT: "✓", NORMALIZED_FROM_USER_TERM: "↔", TENTATIVE_INTERPRETATION: "?",
  NOT_PROVIDED: "○", CONTRADICTORY: "!", UNSUPPORTED: "×",
};
const STATES: Record<HumanValidationState, string> = {
  NOT_REVIEWED: "Non relu", CONFIRMED: "Confirmé", CORRECTED: "Corrigé", REMOVED: "Supprimé", UNKNOWN: "Inconnu", NOT_RELEVANT: "Non pertinent",
};
const CONSTRAINT_FIELDS: InterpretedFieldKey[] = ["centers", "availableEquipment", "fieldStrengths", "manufacturers", "models", "softwareVersions", "availableData", "constraints", "declaredTimings"];

const Panel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <section className={`min-w-0 break-words rounded-2xl border border-border bg-card p-5 shadow-sm ${className}`}>{children}</section>;
const Tag = ({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warning" }) => <span className={`inline-flex max-w-full break-all rounded-full border px-2.5 py-1 text-xs font-medium ${tone === "good" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200" : tone === "warning" ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-200" : "border-border bg-muted text-muted-foreground"}`}>{children}</span>;
const OriginTag = ({ origin }: { origin: string }) => <Tag><span aria-hidden="true" className="mr-1">{ORIGIN_ICONS[origin]}</span>{ORIGINS[origin]}</Tag>;

const valueText = (value: unknown) => Array.isArray(value) ? value.join(", ") : value && value !== "UNKNOWN" ? String(value) : "Non renseigné";
const missingInformationMeta = (item: string) => {
  const normalized = item.normalize("NFKC").toLocaleLowerCase("fr-FR");
  if (/s[ée]quence|timing|horaire|biomarqueur|logiciel|param[èe]tre/.test(normalized)) return { category: "Non supportée par la tranche actuelle", reason: "NOXIA ne doit pas vous demander d’inventer la solution technique.", influence: "Conservée comme limite ; aucune décision automatique.", blocking: "Non bloquante dans cette tranche" };
  if (/domaine|objectif|ph[ée]nom[èe]ne/.test(normalized)) return { category: "Nécessaire maintenant", reason: "Cette information borne l’orientation scientifique.", influence: "Peut modifier les scénarios et questions proposés.", blocking: "Réponse ou statut « je ne sais pas » requis" };
  if (/[ée]quipement|centre|donn[ée]e|population|pathologie|groupe|intervention/.test(normalized)) return { category: "Utile plus tard", reason: "Cette information précise la faisabilité et la comparabilité.", influence: "Sera reprise dans les contraintes et le rapport.", blocking: "Non bloquante pour l’orientation" };
  return { category: "Facultative", reason: "Cette précision enrichirait la traçabilité sans imposer une solution.", influence: "Aucun choix n’est forcé en son absence.", blocking: "Réponse « je ne sais pas » possible" };
};

type FieldCardProps = {
  fieldKey: InterpretedFieldKey;
  interpretation: ScientificIntakeInterpretation;
  review?: HumanFieldReview;
  correction?: string;
  onReview: (key: InterpretedFieldKey, state: HumanValidationState) => void;
  onCorrection: (key: InterpretedFieldKey, value: string) => void;
};

const InterpretedFieldCard = ({ fieldKey, interpretation, review, correction, onReview, onCorrection }: FieldCardProps) => {
  const field = interpretation[fieldKey];
  const state = review?.state ?? "NOT_REVIEWED";
  return <Panel className="p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{LABELS[fieldKey]}</h3><p className="mt-1">{state === "CORRECTED" ? correction : valueText(field.value)}</p><div className="mt-2 flex flex-wrap gap-2"><OriginTag origin={field.origin} /><Tag>Confiance {field.confidence.toLowerCase()}</Tag><Tag tone={state === "CONFIRMED" || state === "CORRECTED" ? "good" : "warning"}>{STATES[state]}</Tag></div>{field.alternatives?.length ? <p className="mt-3 text-xs text-muted-foreground"><strong>Alternatives à confirmer :</strong> {field.alternatives.join(" ; ")}</p> : null}</div><div className="flex flex-wrap gap-2 text-xs"><button onClick={() => onReview(fieldKey, "CONFIRMED")} className="rounded border px-2 py-1">Confirmer</button><button onClick={() => { onCorrection(fieldKey, valueText(field.value) === "Non renseigné" ? "" : valueText(field.value)); onReview(fieldKey, "CORRECTED"); }} className="rounded border px-2 py-1">Corriger</button><button onClick={() => onReview(fieldKey, "REMOVED")} className="rounded border px-2 py-1">Supprimer</button><button onClick={() => onReview(fieldKey, "UNKNOWN")} className="rounded border px-2 py-1">Inconnu</button><button onClick={() => onReview(fieldKey, "NOT_RELEVANT")} className="rounded border px-2 py-1">Non pertinent</button></div></div>{state === "CORRECTED" && <input autoFocus aria-label={`Correction — ${LABELS[fieldKey]}`} value={correction ?? ""} onChange={(event) => onCorrection(fieldKey, event.target.value)} onBlur={() => onReview(fieldKey, "CORRECTED")} className="mt-3 w-full rounded-lg border bg-background px-3 py-2" />}</Panel>;
};

export default function ProtocolDesignerDemo() {
  const [session, setSession] = useState<ProtocolDesignerSession>(() => createProtocolDesignerSession());
  const [candidate, setCandidate] = useState<ProtocolDesignerSession | null>(null);
  const [question, setQuestion] = useState("");
  const [interpretation, setInterpretation] = useState<ScientificIntakeInterpretation | null>(null);
  const [reviews, setReviews] = useState<Partial<Record<InterpretedFieldKey, HumanFieldReview>>>({});
  const [corrections, setCorrections] = useState<Partial<Record<InterpretedFieldKey, string>>>({});
  const [reformulation, setReformulation] = useState("");
  const [ambiguityResolutions, setAmbiguityResolutions] = useState<Record<string, string>>({});
  const [contradictionResolutions, setContradictionResolutions] = useState<Record<string, "RESOLVED" | "KEPT_FOR_HUMAN_REVIEW">>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [localFallbackAvailable, setLocalFallbackAvailable] = useState(false);
  const [decisionForm, setDecisionForm] = useState({ author: "", justification: "", reservations: "", outcome: "CONFIRM_ORIENTATION" as const });
  const [reportMode, setReportMode] = useState<"PROVISIONAL" | "FINAL">("PROVISIONAL");
  const understandingHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => setCandidate(loadSessionCandidate(window.localStorage)), []);
  useEffect(() => {
    if (!session.originalQuestion || detectSensitiveData(session.originalQuestion).length) return;
    try { persistSession(window.localStorage, session); } catch { /* blocked sessions are intentionally not stored */ }
  }, [session]);

  const step = session.currentStep;
  const intent = session.validatedIntent;
  const adaptiveQuestions = useMemo(() => intent ? selectAdaptiveQuestions(intent, session.scenarioMatches.map((match) => match.scenarioId)) : [], [intent, session.scenarioMatches]);
  const report = useMemo(() => generateContextualReport(session, adaptiveQuestions, reportMode), [session, adaptiveQuestions, reportMode]);
  const activeScenario = session.confirmedScenarioId ? scenarioDetails(session.confirmedScenarioId) : undefined;
  const fieldGroups = useMemo(() => {
    if (!interpretation) return [];
    const unconstrained = INTERPRETED_FIELD_KEYS.filter((key) => !CONSTRAINT_FIELDS.includes(key));
    return [
      { title: "Éléments explicitement déclarés", keys: unconstrained.filter((key) => interpretation[key].origin === "EXPLICIT_USER_STATEMENT") },
      { title: "Éléments normalisés", keys: unconstrained.filter((key) => interpretation[key].origin === "NORMALIZED_FROM_USER_TERM") },
      { title: "Interprétations proposées", keys: unconstrained.filter((key) => ["TENTATIVE_INTERPRETATION", "CONTRADICTORY", "UNSUPPORTED"].includes(interpretation[key].origin)) },
      { title: "Contraintes matérielles ou organisationnelles", keys: CONSTRAINT_FIELDS },
      { title: "Informations non renseignées", keys: unconstrained.filter((key) => interpretation[key].origin === "NOT_PROVIDED") },
    ];
  }, [interpretation]);
  const understandingReady = Boolean(interpretation && reformulation.trim()
    && Object.keys(reviews).length === INTERPRETED_FIELD_KEYS.length
    && interpretation.termsNeedingClarification.every((item) => Boolean(ambiguityResolutions[item]))
    && interpretation.contradictions.every((item) => Boolean(contradictionResolutions[item])));
  const scenarioConfirmationAllowed = Boolean(intent?.interpretation.contradictions.every((item) => intent.contradictionResolutions[item] === "RESOLVED"));

  const updateStep = (next: number) => setSession((current) => ({ ...current, currentStep: Math.max(0, Math.min(6, next)), updatedAt: new Date().toISOString() }));
  const applyQuestionChange = (value: string) => {
    setQuestion(value);
    if (interpretation) {
      setInterpretation(null); setReviews({}); setReformulation(""); setAmbiguityResolutions({}); setContradictionResolutions({});
      setSession((current) => ({ ...invalidateDownstream(current, "Question scientifique modifiée"), originalQuestion: value, currentStep: 0, interfaceState: "QUESTION_DRAFT" }));
    } else setSession((current) => ({ ...current, originalQuestion: value, interfaceState: "QUESTION_DRAFT", updatedAt: new Date().toISOString() }));
  };

  const acceptInterpretation = (value: ScientificIntakeInterpretation) => {
    setInterpretation(value); setReformulation(value.reformulatedQuestion); setReviews({}); setCorrections({}); setAmbiguityResolutions({}); setContradictionResolutions({});
    setSession((current) => ({ ...current, originalQuestion: value.originalQuestion, interfaceState: "INTERPRETATION_REVIEW", currentStep: 1, updatedAt: new Date().toISOString() }));
    window.setTimeout(() => understandingHeadingRef.current?.focus(), 0);
  };

  const analyze = async () => {
    setError(null); setLocalFallbackAvailable(false);
    const safety = detectSensitiveData(question);
    if (safety.length) {
      setError("Retirez toute donnée personnelle, patient, confidentielle ou identifiable avant de poursuivre.");
      setSession((current) => ({ ...current, interfaceState: "LOCAL_SAFETY_BLOCKED" })); return;
    }
    if (question.trim().length < 24) { setError("Décrivez votre question en au moins 24 caractères."); return; }
    setBusy(true); setSession((current) => ({ ...current, interfaceState: "ANALYZING", originalQuestion: question }));
    try {
      acceptInterpretation(await requestScientificInterpretation({ question: question.trim(), language: "fr", schemaVersion: "1.0" }));
    } catch (caught) {
      const code = caught instanceof IntakeClientError ? caught.code : "API_UNAVAILABLE";
      setError(code === "QUOTA_EXCEEDED" ? "Le quota linguistique est temporairement atteint. Votre texte est conservé."
        : code === "INVALID_PROVIDER_RESPONSE" ? "La réponse linguistique reçue n’était pas exploitable. Votre texte est conservé."
          : "L’interprétation linguistique est indisponible. Votre texte est conservé. Vous pouvez réessayer ou continuer en mode local sans interprétation automatique.");
      const interfaceState = code === "QUOTA_EXCEEDED" ? "QUOTA_EXCEEDED" : code === "INVALID_PROVIDER_RESPONSE" ? "INVALID_PROVIDER_RESPONSE" : "API_UNAVAILABLE";
      setLocalFallbackAvailable(true); setSession((current) => ({ ...current, interfaceState }));
    } finally { setBusy(false); }
  };

  const setReview = (key: InterpretedFieldKey, state: HumanValidationState) => {
    const correctedValue = state === "CORRECTED" ? corrections[key]?.split(",").map((item) => item.trim()).filter(Boolean) ?? [] : undefined;
    setReviews((current) => ({ ...current, [key]: { state, correctedValue, reviewedAt: new Date().toISOString() } }));
  };
  const confirmAll = () => {
    if (!interpretation) return;
    const next = Object.fromEntries(INTERPRETED_FIELD_KEYS.map((key) => [key, { state: interpretation[key].value === null || interpretation[key].value === "UNKNOWN" ? "UNKNOWN" : "CONFIRMED", reviewedAt: new Date().toISOString() }])) as Partial<Record<InterpretedFieldKey, HumanFieldReview>>;
    setReviews(next);
  };
  const confirmUnderstanding = () => {
    if (!interpretation || !reformulation.trim()) return;
    const validated = buildValidatedIntent(interpretation, reviews, reformulation);
    validated.ambiguityResolutions = ambiguityResolutions;
    validated.contradictionResolutions = contradictionResolutions;
    const matches = matchScenarios(validated);
    setSession((current) => {
      const base = current.validatedIntent ? invalidateDownstream(current, "Compréhension scientifique modifiée") : current;
      return { ...base, validatedIntent: validated, scenarioMatches: matches, confirmedScenarioId: null, interfaceState: matches.length ? matches.length > 1 ? "MULTIPLE_SCENARIOS" : "SCENARIO_PROPOSED" : "NO_SUPPORTED_SCENARIO", currentStep: 2, updatedAt: new Date().toISOString() };
    });
  };
  const chooseScenario = (id: "spectral" | "cardiac" | "neuro") => setSession((current) => {
    if (!current.validatedIntent?.interpretation.contradictions.every((item) => current.validatedIntent?.contradictionResolutions[item] === "RESOLVED")) return current;
    const matches = confirmScenario(current.scenarioMatches, id);
    const base = current.confirmedScenarioId && current.confirmedScenarioId !== id ? invalidateDownstream(current, "Orientation principale modifiée") : current;
    return { ...base, scenarioMatches: matches, confirmedScenarioId: id, secondaryScenarioIds: matches.filter((item) => item.scenarioId !== id).map((item) => item.scenarioId), interfaceState: "SCENARIO_CONFIRMED", updatedAt: new Date().toISOString() };
  });
  const answerQuestion = (questionId: string, value: string) => {
    const item = adaptiveQuestions.find((questionItem) => questionItem.questionId === questionId);
    const option = item?.allowedAnswers.find((answer) => answer.value === value);
    if (!item || !option) return;
    setSession((current) => {
      const previous = current.adaptiveAnswers.find((answer) => answer.questionId === questionId);
      const changed = previous && previous.answer !== value;
      return { ...current, adaptiveAnswers: [...current.adaptiveAnswers.filter((answer) => answer.questionId !== questionId), { questionId, answer: value, label: option.label, consequence: option.consequence, answeredAt: new Date().toISOString(), status: value === "unknown" ? "UNKNOWN" : "ANSWERED" }], decision: changed ? null : current.decision, reportStatus: changed ? "NONE" : current.reportStatus, invalidatedDownstream: changed ? [...current.invalidatedDownstream, "Réponse adaptative modifiée"] : current.invalidatedDownstream, interfaceState: "QUESTIONS_IN_PROGRESS", updatedAt: new Date().toISOString() };
    });
  };
  const recordDecision = () => {
    if (!decisionForm.author.trim() || !decisionForm.justification.trim()) return;
    setSession((current) => ({ ...current, decision: { ...decisionForm, decidedAt: new Date().toISOString() }, reportStatus: "FINAL", interfaceState: "REPORT_READY", currentStep: 6, updatedAt: new Date().toISOString() }));
    setReportMode("FINAL");
  };
  const reset = () => {
    deleteSession(window.localStorage); setCandidate(null); setSession(createProtocolDesignerSession()); setQuestion(""); setInterpretation(null); setReviews({}); setCorrections({}); setReformulation(""); setAmbiguityResolutions({}); setContradictionResolutions({}); setError(null);
  };

  const copyReport = async () => navigator.clipboard?.writeText(reportToMarkdown(report));
  const downloadMarkdown = () => {
    const url = URL.createObjectURL(new Blob([reportToMarkdown(report)], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `noxia-session-${session.sessionId}.md`; link.click(); URL.revokeObjectURL(url);
  };

  return <>
    <Helmet><title>Protocol Designer — démonstrateur guidé | NOXIA</title><meta name="description" content="Démonstrateur local du parcours scientifique guidé NOXIA, sans donnée patient ni recommandation clinique." /><meta name="robots" content="noindex, follow" /><link rel="canonical" href={CANONICAL} /></Helmet>
    <main id="demo-main" className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link to="/protocol-designer" className="text-sm text-muted-foreground hover:text-foreground">← Protocol Designer</Link>
          <AlertDialog><AlertDialogTrigger asChild><button className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><RotateCcw className="h-4 w-4" /> Réinitialiser</button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Réinitialiser cette session ?</AlertDialogTitle><AlertDialogDescription>La question, les validations, les réponses, la décision et le rapport local seront supprimés. Les autres données du navigateur ne seront pas touchées.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={reset}>Supprimer cette session</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </div>

        {candidate && candidate.sessionId !== session.sessionId && <Panel className="mb-6 border-primary/40 print:hidden"><p className="font-semibold">Une session précédente est disponible.</p><p className="mt-1 text-sm text-muted-foreground">Elle ne sera jamais reprise automatiquement.</p><dl className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2"><div>Date : {new Date(candidate.updatedAt).toLocaleString("fr-FR")}</div><div>Étape : {STEPS[candidate.currentStep] ?? "Question"}</div><div>Scénario : {candidate.confirmedScenarioId ?? "non confirmé"}</div><div>Statut : {candidate.reportStatus} · fixtures {candidate.fixtureSetVersion}</div></dl><div className="mt-4 flex flex-wrap gap-2"><button className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={() => { setSession(candidate); setQuestion(candidate.originalQuestion); setInterpretation(candidate.validatedIntent?.interpretation ?? null); setReformulation(candidate.validatedIntent?.validatedReformulation ?? ""); setReviews(candidate.validatedIntent?.reviews ?? {}); setAmbiguityResolutions(candidate.validatedIntent?.ambiguityResolutions ?? {}); setContradictionResolutions(candidate.validatedIntent?.contradictionResolutions ?? {}); setCandidate(null); }}>Reprendre</button><button className="rounded-lg border px-4 py-2 text-sm" onClick={() => setCandidate(null)}>Commencer une nouvelle session</button><button className="rounded-lg border px-4 py-2 text-sm text-destructive" onClick={() => { deleteSession(window.localStorage); setCandidate(null); }}>Supprimer</button></div></Panel>}

        {session.invalidatedDownstream.length > 0 && <div role="status" className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm"><strong>Réévaluation nécessaire.</strong> Cette modification affecte les étapes suivantes : {session.invalidatedDownstream.at(-1)}.</div>}

        <nav aria-label="Progression" className="mb-8 overflow-x-auto print:hidden"><ol className="flex min-w-max gap-2">{STEPS.map((label, index) => <li key={label}><button disabled={index > step || (index > 1 && !intent)} onClick={() => updateStep(index)} aria-current={step === index ? "step" : undefined} className={`rounded-full px-3 py-2 text-xs font-medium ${step === index ? "bg-primary text-primary-foreground" : index < step ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{index + 1}. {label}</button></li>)}</ol></nav>

        {step === 0 && <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">Intake scientifique guidé</p><h1 className="mt-2 text-4xl font-bold tracking-tight">Décrivez votre question scientifique</h1>
          <p className="mt-4 text-lg text-muted-foreground">Décrivez ce que vous souhaitez comprendre, comparer ou mesurer, la population concernée, le contexte de l’étude et les moyens dont vous disposez. Vous n’avez pas besoin de connaître les séquences, les biomarqueurs ou le calendrier d’acquisition.</p>
          <p className="mt-3 text-sm">NOXIA commencera par comprendre votre projet, puis vous proposera les questions réellement utiles.</p>
          <div role="note" className="mt-6 flex gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><span><strong>Démonstrateur :</strong> ne saisissez aucune donnée patient, donnée personnelle, information confidentielle ou donnée de santé identifiable.</span></div>
          <label htmlFor="scientific-question" className="mt-7 block font-semibold">Votre question scientifique</label><p id="question-help" className="mt-1 text-sm text-muted-foreground">Écrivez librement votre besoin en 24 à 4 000 caractères.</p>
          <textarea id="scientific-question" maxLength={4000} aria-describedby={`question-help question-counter${error ? " question-error" : ""}`} aria-invalid={Boolean(error)} value={question} onChange={(event) => applyQuestionChange(event.target.value.slice(0, 4000))} className="mt-3 min-h-52 w-full rounded-xl border bg-background p-4 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder="Exemple : Je souhaite comprendre…" />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{error ? <span id="question-error" role="alert" className="text-destructive">{error}</span> : "Votre texte reste visible en cas d’échec."}</span><span id="question-counter">{question.length} / 4 000</span></div>
          <div className="mt-5 flex flex-wrap gap-3"><button disabled={busy || question.trim().length < 24} onClick={analyze} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50">{busy ? <><LoaderCircle className="h-4 w-4 animate-spin" /> NOXIA analyse votre question…</> : <>Analyser ma question <ArrowRight className="h-4 w-4" /></>}</button><select aria-label="Utiliser un exemple" defaultValue="" onChange={(event) => { if (event.target.value) applyQuestionChange(event.target.value); }} className="w-full max-w-full rounded-lg border bg-background px-4 py-3 sm:w-auto"><option value="">Utiliser un exemple</option>{EXAMPLES.map((example) => <option key={example} value={example}>{example}</option>)}</select></div>
          <p aria-live="polite" className="mt-3 text-sm text-muted-foreground">{busy ? "NOXIA analyse votre question et distingue les informations déclarées, les ambiguïtés et les éléments manquants." : ""}</p>
          {localFallbackAvailable && <button className="mt-4 rounded-lg border px-4 py-2 text-sm" onClick={() => acceptInterpretation(createEmptyInterpretation({ question: question.trim(), language: "fr", schemaVersion: "1.0" }))}>Continuer localement sans interprétation automatique</button>}
        </div>}

        {step === 1 && interpretation && <div><h1 ref={understandingHeadingRef} tabIndex={-1} className="text-4xl font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring">Voici ce que j’ai compris</h1><p className="mt-3 text-muted-foreground">Vérifiez cette compréhension avant de poursuivre. Les éléments interprétés avec prudence restent modifiables.</p>
          <div className="mt-7 grid gap-5 lg:grid-cols-2"><Panel><h2 className="font-semibold">Question originale</h2><p className="mt-2 text-sm text-muted-foreground">{interpretation.originalQuestion}</p></Panel><Panel><label htmlFor="reformulation" className="font-semibold">Question reformulée</label><textarea id="reformulation" value={reformulation} onChange={(event) => setReformulation(event.target.value)} className="mt-2 min-h-28 w-full rounded-lg border bg-background p-3" /><button className="mt-2 text-sm text-primary underline" onClick={() => setReformulation(interpretation.originalQuestion)}>Revenir au texte initial</button></Panel></div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Informations structurées</h2><button onClick={confirmAll} className="rounded-lg border px-3 py-2 text-sm">Relire et confirmer tous les champs</button></div>
          <div className="mt-4 grid gap-6">{fieldGroups.map((group) => <section key={group.title} aria-labelledby={`group-${group.title}`}><h2 id={`group-${group.title}`} className="text-lg font-semibold">{group.title}</h2>{group.keys.length ? <div className="mt-3 grid gap-3">{group.keys.map((key) => <InterpretedFieldCard key={key} fieldKey={key} interpretation={interpretation} review={reviews[key]} correction={corrections[key]} onReview={setReview} onCorrection={(fieldKey, value) => setCorrections((current) => ({ ...current, [fieldKey]: value }))} />)}</div> : <p className="mt-2 text-sm text-muted-foreground">Aucun élément dans cette catégorie.</p>}</section>)}</div>
          <div className="mt-6 grid gap-4 md:grid-cols-3"><Panel><h2 className="font-semibold">Ambiguïtés</h2>{interpretation.termsNeedingClarification.length ? interpretation.termsNeedingClarification.map((item) => <div className="mt-3 text-sm" key={item}><p>• {item}</p><p className="mt-1 text-xs text-muted-foreground">Les interprétations proposées ne sont pas équivalentes ; vérifiez les alternatives affichées dans les champs concernés.</p><div className="mt-2 flex flex-wrap gap-2"><button onClick={() => setAmbiguityResolutions((current) => ({ ...current, [item]: "RESOLVED" }))} className="rounded border px-2 py-1">Résolue par reformulation</button><button onClick={() => setAmbiguityResolutions((current) => ({ ...current, [item]: "UNKNOWN" }))} className="rounded border px-2 py-1">Je ne sais pas</button></div>{ambiguityResolutions[item] && <p className="mt-2 text-muted-foreground">Statut : {ambiguityResolutions[item] === "UNKNOWN" ? "inconnue, conservée" : "résolue"}</p>}</div>) : <p className="mt-2 text-sm text-muted-foreground">Aucune ambiguïté signalée.</p>}</Panel><Panel><h2 className="font-semibold">Informations manquantes</h2>{interpretation.missingInformation.length ? interpretation.missingInformation.map((item) => { const meta = missingInformationMeta(item); return <div className="mt-3 rounded-lg border p-3 text-sm" key={item}><Tag tone={meta.category === "Nécessaire maintenant" ? "warning" : "neutral"}>{meta.category}</Tag><p className="mt-2 font-medium">{item}</p><p className="mt-2 text-xs text-muted-foreground"><strong>Pourquoi :</strong> {meta.reason}</p><p className="mt-1 text-xs text-muted-foreground"><strong>Influence :</strong> {meta.influence}</p><p className="mt-1 text-xs text-muted-foreground"><strong>Blocage :</strong> {meta.blocking}</p></div>; }) : <p className="mt-2 text-sm text-muted-foreground">Aucune information manquante signalée.</p>}</Panel><Panel><h2 className="font-semibold">Contradictions</h2>{interpretation.contradictions.length ? interpretation.contradictions.map((item) => <div className="mt-3 text-sm" key={item}><p className="text-destructive">• {item}</p><div className="mt-2 flex flex-wrap gap-2"><button onClick={() => setContradictionResolutions((current) => ({ ...current, [item]: "RESOLVED" }))} className="rounded border px-2 py-1">Marquer comme traitée</button><button onClick={() => setContradictionResolutions((current) => ({ ...current, [item]: "KEPT_FOR_HUMAN_REVIEW" }))} className="rounded border px-2 py-1">Conserver pour revue</button></div></div>) : <p className="mt-2 text-sm text-muted-foreground">Aucune contradiction signalée.</p>}</Panel></div>
          <div className="mt-6 flex flex-wrap justify-between gap-3 print:hidden"><button onClick={() => updateStep(0)} className="inline-flex items-center gap-2 rounded-lg border px-4 py-3"><ArrowLeft className="h-4 w-4" /> Modifier ma question</button><button disabled={!understandingReady} onClick={confirmUnderstanding} className="rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50">Confirmer cette compréhension</button></div>
        </div>}

        {step === 2 && intent && <div><h1 className="text-4xl font-bold">Orientations scientifiques possibles</h1><p className="mt-3 text-muted-foreground">NOXIA commence par le phénomène à comprendre, puis rapproche votre question des corpus locaux. Aucune séquence, aucun protocole et aucun biomarqueur optimal ne sont décidés ici.</p>
          {!session.scenarioMatches.length ? <Panel className="mt-6"><CircleAlert className="h-6 w-6 text-amber-500" /><h2 className="mt-3 text-xl font-semibold">Votre question n’est pas encore couverte par les scénarios disponibles dans ce démonstrateur.</h2><p className="mt-2 text-muted-foreground">La compréhension validée est conservée. Aucun scénario proche n’est forcé et aucune connaissance n’est inventée.</p></Panel> : <div className="mt-6 grid gap-4 lg:grid-cols-3">{session.scenarioMatches.map((match) => { const scenario = scenarioDetails(match.scenarioId); if (!scenario) return null; return <Panel key={match.scenarioId} className={session.confirmedScenarioId === match.scenarioId ? "border-primary" : ""}><div className="flex justify-between gap-2"><Tag tone={match.status === "MATCH_CONFIRMED" ? "good" : "warning"}>{match.status}</Tag><Tag>Confiance {match.confidence.toLowerCase()}</Tag></div><h2 className="mt-4 text-xl font-semibold">{scenario.shortLabel}</h2><p className="mt-2 text-sm text-muted-foreground">{scenario.comprehension}</p><h3 className="mt-4 text-sm font-semibold">Phénomènes et construits</h3>{scenario.constructs.map((item) => <p key={item} className="mt-2 text-sm">• {item}</p>)}<p className="mt-4 text-sm"><strong>Éléments concordants :</strong> {match.matchedTerms.join(", ")}</p><p className="mt-2 text-sm"><strong>Conséquence :</strong> les hypothèses et limites de ce corpus deviennent consultables, sans lancer automatiquement une fixture.</p><button disabled={!scenarioConfirmationAllowed} onClick={() => chooseScenario(match.scenarioId)} className="mt-5 w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Confirmer comme orientation principale</button><details className="mt-4 text-sm"><summary className="cursor-pointer">Traçabilité documentaire</summary><dl className="mt-2 grid gap-1 text-muted-foreground"><div>Program Owner : {scenario.program.id}</div><div>{scenario.reasoningBook.id} v{scenario.reasoningBook.version}</div><div>{scenario.fixtureStatus}</div><div>État des connaissances : {scenario.knowledgeDate}</div></dl></details></Panel>; })}</div>}
          <div className="mt-6 flex justify-between print:hidden"><button onClick={() => updateStep(1)} className="rounded-lg border px-4 py-2">Retour</button><button disabled={!session.confirmedScenarioId} onClick={() => updateStep(3)} className="rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50">Continuer vers les questions utiles</button></div>
        </div>}

        {step === 3 && intent && <div><h1 className="text-4xl font-bold">Questions réellement utiles</h1><p className="mt-3 text-muted-foreground">Les informations déjà déclarées et confirmées ne sont pas redemandées. Chaque réponse montre son effet.</p><div className="mt-6 grid gap-4">{adaptiveQuestions.length ? adaptiveQuestions.map((item) => { const answer = session.adaptiveAnswers.find((value) => value.questionId === item.questionId); return <Panel key={item.questionId}><div className="flex flex-wrap justify-between gap-2"><h2 className="text-lg font-semibold">{item.label}</h2><Tag tone={item.blockingLevel === "BLOCKING" ? "warning" : "neutral"}>{item.blockingLevel.toLowerCase()}</Tag></div><p className="mt-2 text-sm text-muted-foreground">{item.helpText}</p><div className="mt-4 grid gap-2 text-sm md:grid-cols-2"><p><strong>Pourquoi :</strong> {item.reason}</p><p><strong>Influence :</strong> {item.decisionImpact}</p></div><select aria-label={item.label} value={answer?.answer ?? ""} onChange={(event) => answerQuestion(item.questionId, event.target.value)} className="mt-4 w-full rounded-lg border bg-background px-3 py-2"><option value="">Choisir une réponse</option>{item.allowedAnswers.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{answer && <div className="mt-4 rounded-lg bg-primary/10 p-3 text-sm"><strong>Ce qui change :</strong> {answer.consequence}</div>}</Panel>; }) : <Panel><p>Toutes les informations utiles dans cette tranche ont déjà été confirmées.</p></Panel>}</div><div className="mt-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 font-mono text-xs">TIMING_NOT_YET_GENERATABLE_FROM_CURRENT_EXECUTABLE_KNOWLEDGE<br/><span className="font-sans">Les moments déclarés sont conservés, mais aucun calendrier n’est inventé.</span></div><div className="mt-6 flex justify-between print:hidden"><button onClick={() => updateStep(2)} className="rounded-lg border px-4 py-2">Retour</button><button onClick={() => updateStep(4)} className="rounded-lg bg-primary px-5 py-3 text-primary-foreground">Voir les options</button></div></div>}

        {step === 4 && <div><h1 className="text-4xl font-bold">Options scientifiques discutées</h1><p className="mt-3 text-muted-foreground">Ces options proviennent du corpus local sélectionné. Elles ne constituent ni une recommandation ni un protocole.</p><div className="mt-6 grid gap-4 md:grid-cols-2">{activeScenario?.strategies.map((strategy) => <Panel key={strategy.id}><h2 className="text-xl font-semibold">{strategy.title}</h2><p className="mt-3"><strong>Apport :</strong> {strategy.benefit}</p><p className="mt-2"><strong>Compromis :</strong> {strategy.tradeoff}</p><p className="mt-2"><strong>Condition :</strong> {strategy.condition}</p></Panel>) ?? <Panel>Aucune option disponible.</Panel>}</div><Panel className="mt-5"><h2 className="font-semibold">Limites visibles</h2>{activeScenario?.limitations.map((item) => <p className="mt-2 text-sm" key={item}>• {item}</p>)}</Panel><div className="mt-6 flex justify-between print:hidden"><button onClick={() => updateStep(3)} className="rounded-lg border px-4 py-2">Retour</button><button onClick={() => updateStep(5)} className="rounded-lg bg-primary px-5 py-3 text-primary-foreground">Enregistrer une décision humaine</button></div></div>}

        {step === 5 && <div className="mx-auto max-w-3xl"><h1 className="text-4xl font-bold">Décision humaine</h1><p className="mt-3 text-muted-foreground">NOXIA documente la décision ; il ne la prend pas.</p><Panel className="mt-6"><label className="block font-semibold" htmlFor="author">Auteur de session</label><input id="author" value={decisionForm.author} onChange={(event) => setDecisionForm((current) => ({ ...current, author: event.target.value.slice(0, 80) }))} className="mt-2 w-full rounded-lg border bg-background px-3 py-2" /><label className="mt-4 block font-semibold" htmlFor="outcome">Décision</label><select id="outcome" value={decisionForm.outcome} onChange={(event) => setDecisionForm((current) => ({ ...current, outcome: event.target.value as typeof current.outcome }))} className="mt-2 w-full rounded-lg border bg-background px-3 py-2"><option value="CONFIRM_ORIENTATION">Confirmer l’orientation</option><option value="DEFER">Différer</option><option value="REFUSE">Refuser</option></select><label className="mt-4 block font-semibold" htmlFor="justification">Justification</label><textarea id="justification" value={decisionForm.justification} onChange={(event) => setDecisionForm((current) => ({ ...current, justification: event.target.value.slice(0, 500) }))} className="mt-2 min-h-24 w-full rounded-lg border bg-background p-3" /><label className="mt-4 block font-semibold" htmlFor="reservations">Réserves</label><textarea id="reservations" value={decisionForm.reservations} onChange={(event) => setDecisionForm((current) => ({ ...current, reservations: event.target.value.slice(0, 500) }))} className="mt-2 min-h-20 w-full rounded-lg border bg-background p-3" /></Panel><div className="mt-6 flex flex-wrap justify-between gap-3 print:hidden"><button onClick={() => { setReportMode("PROVISIONAL"); setSession((current) => ({ ...current, reportStatus: "PROVISIONAL", currentStep: 6 })); }} className="rounded-lg border px-4 py-3">Générer un rapport provisoire</button><button disabled={!decisionForm.author.trim() || !decisionForm.justification.trim() || !session.confirmedScenarioId} onClick={recordDecision} className="rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50">Enregistrer et générer le rapport final</button></div></div>}

        {step === 6 && <article id="protocol-designer-report" className="min-w-0 print:text-black"><div className="flex min-w-0 flex-wrap items-start justify-between gap-4"><div className="min-w-0"><Tag tone={report.status === "FINAL" ? "good" : "warning"}>{report.status}</Tag><h1 className="mt-3 break-words text-4xl font-bold">{report.title}</h1><p className="mt-2 text-muted-foreground">Projection de démonstration : ni validation scientifique formelle, ni protocole clinique, ni avis médical, ni autorisation réglementaire, ni PASS PD-011.</p></div><div className="flex gap-2 print:hidden"><button onClick={() => window.print()} className="rounded-lg border p-3" aria-label="Imprimer ou enregistrer en PDF"><Printer className="h-4 w-4" /></button><button onClick={copyReport} className="rounded-lg border p-3" aria-label="Copier le rapport"><Copy className="h-4 w-4" /></button><button onClick={downloadMarkdown} className="rounded-lg border px-3 py-2 text-sm">Markdown</button></div></div>
          <div className="mt-7 grid gap-3">{report.sections.map((section) => <details key={section.number} open={section.number <= 3} className="break-inside-avoid rounded-xl border bg-card p-4 print:block"><summary className="cursor-pointer font-semibold">{section.number}. {section.title} <span className="ml-2 text-xs text-muted-foreground">{section.status}</span></summary><div className="mt-3 space-y-2 text-sm">{section.content.map((item, index) => <p key={`${item}-${index}`}>• {item}</p>)}</div></details>)}</div><h2 className="mt-8 text-2xl font-bold">Quatre livrables</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{report.deliverables.map((item) => <Panel key={item.title}><Tag tone={item.status.includes("NOT_") || item.status.includes("STRUCTURE") ? "warning" : "good"}>{item.status}</Tag><h3 className="mt-3 text-lg font-semibold">{item.title}</h3>{item.available.map((value) => <p key={value} className="mt-2 text-sm">Disponible : {value}</p>)}{item.missing.map((value) => <p key={value} className="mt-2 text-sm text-muted-foreground">Manquant : {value}</p>)}{item.limits.map((value) => <p key={value} className="mt-2 text-sm text-muted-foreground">Limite : {value}</p>)}</Panel>)}</div>{!canGenerateFinalReport(session) && <div className="mt-5 flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4"><Info className="h-5 w-5 shrink-0" /><p>Le rapport reste provisoire : compréhension, scénario et décision humaine doivent être confirmés.</p></div>}<div className="mt-6 flex justify-between print:hidden"><button onClick={() => updateStep(5)} className="rounded-lg border px-4 py-2">Retour à la décision</button><button onClick={() => updateStep(0)} className="rounded-lg border px-4 py-2">Revoir la question</button></div></article>}
      </div>
    </main><div className="print:hidden"><Footer /></div>
  </>;
}
