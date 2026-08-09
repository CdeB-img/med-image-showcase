import Footer from "@/components/Footer";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { deleteKnowledgeSnapshots, executeKnowledgeEngine, isPatientLevelExpression, type ContextDimensionName, type KnowledgeContextInput } from "@/features/knowledge-engine";
import KnowledgeUnderstandView from "@/features/knowledge-engine/KnowledgeUnderstandView";
import { IntakeClientError, requestScientificInterpretation } from "@/features/protocol-designer/intake/client";
import { assessQuestionChange, buildScientificSessionContext, formalizedQuestionCandidate, PROJECT_STAGES, ROUTING_INTENT_LABELS } from "@/features/protocol-designer/intake/journey";
import { detectSensitiveData } from "@/features/protocol-designer/intake/privacy";
import { selectAdaptiveQuestions } from "@/features/protocol-designer/intake/questions";
import { canGenerateFinalReport, generateContextualReport, reportToMarkdown } from "@/features/protocol-designer/intake/report";
import { createEmptyInterpretation } from "@/features/protocol-designer/intake/schema";
import { confirmScenario, matchScenarios, scenarioDetails } from "@/features/protocol-designer/intake/scenarios";
import { buildValidatedIntent, createProtocolDesignerSession, deleteSession, invalidateDownstream, loadSessionCandidate, persistSession } from "@/features/protocol-designer/intake/session";
import { INTERPRETED_FIELD_KEYS, type AdaptiveQuestion, type HumanFieldReview, type HumanValidationState, type InterpretedFieldKey, type ProtocolDesignerSession, type QuestionChangeKind, type RoutingIntent, type ScientificIntakeInterpretation } from "@/features/protocol-designer/intake/types";
import ScientificThinkingView from "@/features/scientific-thinking/ScientificThinkingView";
import { buildScientificThinkingInput, createScientificThinkingSession } from "@/features/scientific-thinking";
import { ArrowLeft, ArrowRight, BookOpen, CircleAlert, Compass, Copy, Info, LoaderCircle, MessageCircle, Printer, RotateCcw, ShieldCheck, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const CANONICAL = "https://noxia-imagerie.fr/protocol-designer";
const STEPS = ["Conversation", "Compréhension", "Orientation", "Espace scientifique", "Décision", "Rapport"] as const;
const EXAMPLES = [
  "Je veux comparer deux méthodes d’imagerie pour mesurer la perfusion cérébrale.",
  "Quelle différence physiologique faut-il conserver entre l’OEF et le CMRO₂ en imagerie cérébrale ?",
  "Je pense que le no-reflow dépend de plusieurs mécanismes et je voudrais transformer cette idée en question scientifique.",
  "Je veux construire une étude multicentrique pour comparer des mesures quantitatives en CT spectral.",
  "Je cherche à étudier l’ECV et le T1 mapping dans une cohorte en IRM cardiaque.",
  "Je voudrais faire une recherche en imagerie, mais je ne sais pas encore sur quel phénomène.",
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
const ROUTE_DESCRIPTIONS: Record<RoutingIntent, string> = {
  UNDERSTAND: "Éclairer un concept ou une relation sans construire automatiquement un projet.",
  FORMALIZE_IDEA: "Faire émerger une question et des hypothèses de travail, soumises à votre validation.",
  DESIGN_STUDY: "Construire progressivement un dossier de recherche, sans inventer les éléments absents.",
};
const BLOCK_LABELS: Record<AdaptiveQuestion["decisionBlock"], string> = {
  SCIENTIFIC_OBJECTIVE: "Bloc décisionnel — objectif scientifique",
  STUDY_CONTEXT: "Bloc décisionnel — contexte de l’étude",
  FEASIBILITY: "Bloc décisionnel — faisabilité déclarée",
};

const Panel = ({ children, className = "", ...props }: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLElement>) => <section {...props} className={`min-w-0 break-words rounded-2xl border border-border bg-card p-5 shadow-sm ${className}`}>{children}</section>;
const Tag = ({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warning" }) => <span className={`inline-flex max-w-full break-all rounded-full border px-2.5 py-1 text-xs font-medium ${tone === "good" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200" : tone === "warning" ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-200" : "border-border bg-muted text-muted-foreground"}`}>{children}</span>;
const OriginTag = ({ origin }: { origin: string }) => <Tag><span aria-hidden="true" className="mr-1">{ORIGIN_ICONS[origin]}</span>{ORIGINS[origin]}</Tag>;
const valueText = (value: unknown) => Array.isArray(value) ? value.join(", ") : value && value !== "UNKNOWN" ? String(value) : "Non renseigné";

const validatedFieldValues = (intent: ProtocolDesignerSession["validatedIntent"], key: InterpretedFieldKey) => {
  if (!intent) return [];
  const review = intent.reviews[key];
  if (["REMOVED", "UNKNOWN", "NOT_RELEVANT"].includes(review?.state ?? "")) return [];
  const field = intent.interpretation[key];
  const value = review?.state === "CORRECTED" ? review.correctedValue : field.value;
  return (Array.isArray(value) ? value : typeof value === "string" && value !== "UNKNOWN" ? [value] : []).filter(Boolean);
};

const buildKnowledgeContext = (intent: ProtocolDesignerSession["validatedIntent"]): KnowledgeContextInput => {
  const values: Partial<Record<keyof KnowledgeContextInput, string[]>> = {
    domain: validatedFieldValues(intent, "scientificDomain"),
    pathology: validatedFieldValues(intent, "pathologyOrCondition"),
    population: validatedFieldValues(intent, "population"),
    phenomenon: validatedFieldValues(intent, "phenomenaOfInterest"),
    modality: validatedFieldValues(intent, "availableEquipment"),
    equipment: [...validatedFieldValues(intent, "manufacturers"), ...validatedFieldValues(intent, "models"), ...validatedFieldValues(intent, "softwareVersions")],
    objective: validatedFieldValues(intent, "scientificPurpose"),
    intervention: validatedFieldValues(intent, "interventionsOrGroups"),
    timing: validatedFieldValues(intent, "declaredTimings"),
  };
  const explicit = Object.fromEntries(Object.entries(values).filter(([, fieldValues]) => fieldValues.length)) as KnowledgeContextInput;
  return {
    ...explicit,
    unknowns: intent?.interpretation.missingInformation ?? [],
    contradictions: intent?.interpretation.contradictions ?? [],
  };
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
  return <div className="rounded-xl border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-semibold">{LABELS[fieldKey]}</h3><p className="mt-1">{state === "CORRECTED" ? correction : valueText(field.value)}</p><div className="mt-2 flex flex-wrap gap-2"><OriginTag origin={field.origin} /><Tag tone={state === "CONFIRMED" || state === "CORRECTED" ? "good" : "warning"}>{STATES[state]}</Tag></div></div><div className="flex flex-wrap gap-2 text-xs"><button onClick={() => onReview(fieldKey, "CONFIRMED")} className="rounded border px-2 py-1">Confirmer</button><button onClick={() => { onCorrection(fieldKey, valueText(field.value) === "Non renseigné" ? "" : valueText(field.value)); onReview(fieldKey, "CORRECTED"); }} className="rounded border px-2 py-1">Corriger</button><button onClick={() => onReview(fieldKey, "REMOVED")} className="rounded border px-2 py-1">Supprimer</button><button onClick={() => onReview(fieldKey, "UNKNOWN")} className="rounded border px-2 py-1">Inconnu</button><button onClick={() => onReview(fieldKey, "NOT_RELEVANT")} className="rounded border px-2 py-1">Non pertinent</button></div></div>{state === "CORRECTED" && <input autoFocus aria-label={`Correction — ${LABELS[fieldKey]}`} value={correction ?? ""} onChange={(event) => onCorrection(fieldKey, event.target.value)} className="mt-3 w-full rounded-lg border bg-background px-3 py-2 focus-visible:ring-2 focus-visible:ring-ring" />}</div>;
};

type QuestionCardProps = {
  item: AdaptiveQuestion;
  index: number;
  total: number;
  answer?: ProtocolDesignerSession["adaptiveAnswers"][number];
  draft: string;
  onDraft: (value: string) => void;
  onAnswer: (value: string, label: string, consequence: string, status?: "ANSWERED" | "UNKNOWN") => void;
};

const QuestionCard = ({ item, index, total, answer, draft, onDraft, onAnswer }: QuestionCardProps) => <Panel>
  <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Question {index + 1} sur environ {total}</p><Tag>{BLOCK_LABELS[item.decisionBlock]}</Tag></div>
  <h3 className="mt-3 text-lg font-semibold">{item.label}</h3><p className="mt-2 text-sm text-muted-foreground">{item.helpText}</p>
  <div className="mt-4 grid gap-3 rounded-xl bg-muted/60 p-4 text-sm md:grid-cols-2"><p><strong>Pourquoi je vous la pose :</strong> {item.reason}</p><p><strong>Ce qu’elle influence :</strong> {item.decisionImpact}</p></div>
  <div className="mt-4 flex flex-wrap gap-2">{item.allowedAnswers.map((option) => <button key={option.value} onClick={() => onAnswer(option.value, option.label, option.consequence, option.value === "unknown" ? "UNKNOWN" : "ANSWERED")} aria-pressed={answer?.answer === option.value} className={`rounded-full border px-3 py-2 text-sm ${answer?.answer === option.value ? "border-primary bg-primary text-primary-foreground" : "bg-background"}`}>{option.label}</button>)}</div>
  <label htmlFor={`free-${item.questionId}`} className="mt-5 block text-sm font-medium">Ou répondez avec vos propres mots</label><div className="mt-2 flex flex-col gap-2 sm:flex-row"><input id={`free-${item.questionId}`} value={draft} onChange={(event) => onDraft(event.target.value.slice(0, 500))} className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 focus-visible:ring-2 focus-visible:ring-ring" /><button disabled={!draft.trim()} onClick={() => onAnswer(`free:${draft.trim()}`, draft.trim(), "Cette précision est conservée dans le contexte et le rapport.")} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50">Enregistrer</button></div>
  {answer && <div role="status" className="mt-4 rounded-lg bg-primary/10 p-3 text-sm"><strong>Ce qui change :</strong> {answer.consequence}</div>}
</Panel>;

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
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [localFallbackAvailable, setLocalFallbackAvailable] = useState(false);
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const [knowledgeContextOverrides, setKnowledgeContextOverrides] = useState<Partial<Record<ContextDimensionName, string | string[] | null>>>({});
  const [knowledgeContextRevision, setKnowledgeContextRevision] = useState(0);
  const [pendingChangeKind, setPendingChangeKind] = useState<QuestionChangeKind>("NONE");
  const [majorChange, setMajorChange] = useState<{ stage: "BEFORE_ANALYSIS" | "AFTER_INTERPRETATION"; affectedElements: string[] } | null>(null);
  const [decisionForm, setDecisionForm] = useState({ author: "", justification: "", reservations: "", outcome: "CONFIRM_ORIENTATION" as const });
  const [reportMode, setReportMode] = useState<"PROVISIONAL" | "FINAL">("PROVISIONAL");
  const understandingHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => setCandidate(loadSessionCandidate(window.localStorage)), []);
  useEffect(() => {
    if (!session.originalQuestion || detectSensitiveData(session.originalQuestion).length || isPatientLevelExpression(session.originalQuestion)) return;
    try { persistSession(window.localStorage, session); } catch { /* blocked sessions are intentionally not stored */ }
  }, [session]);

  const step = session.currentStep;
  const intent = session.validatedIntent;
  const activeScenario = session.confirmedScenarioId ? scenarioDetails(session.confirmedScenarioId) : undefined;
  const allAdaptiveQuestions = useMemo(() => intent ? selectAdaptiveQuestions(intent, session.scenarioMatches.map((match) => match.scenarioId)) : [], [intent, session.scenarioMatches]);
  const routeIntent = session.scientificContext.routeIntent;
  const journeyQuestions = useMemo(() => routeIntent === "UNDERSTAND" ? allAdaptiveQuestions.filter((item) => ["Q-PHENOMENON", "Q-PURPOSE"].includes(item.questionId)) : routeIntent === "FORMALIZE_IDEA" ? allAdaptiveQuestions.filter((item) => ["Q-PHENOMENON", "Q-PURPOSE", "Q-CONTEXT"].includes(item.questionId)) : allAdaptiveQuestions, [allAdaptiveQuestions, routeIntent]);
  const knowledgeResult = useMemo(() => intent && (routeIntent === "UNDERSTAND" || routeIntent === "FORMALIZE_IDEA") ? executeKnowledgeEngine({
    originalQuestion: intent.originalQuestion,
    scientificObjectTerms: session.scientificContext.preservedScientificTerms.map((term, index) => ({ term, role: index === 0 ? "SUBJECT" as const : index === 1 ? "COMPARATOR" as const : "CONTEXT" as const })),
    relations: session.scientificContext.detectedRelationships,
    context: { ...buildKnowledgeContext(intent), ...knowledgeContextOverrides },
    unknowns: session.scientificContext.missingInformation,
    consumer: routeIntent === "FORMALIZE_IDEA" ? "SCIENTIFIC_THINKING_ENGINE" : "PROTOCOL_DESIGNER_UNDERSTAND",
  }) : null, [intent, knowledgeContextOverrides, routeIntent, session.scientificContext.detectedRelationships, session.scientificContext.missingInformation, session.scientificContext.preservedScientificTerms]);
  const scientificThinkingInput = useMemo(() => intent && routeIntent === "FORMALIZE_IDEA" ? buildScientificThinkingInput(
    intent,
    session.scientificContext.preservedScientificTerms.length ? session.scientificContext.preservedScientificTerms : [session.scientificContext.centralScientificObject],
    session.scientificContext.detectedRelationships,
    knowledgeResult,
    {
      sessionId: session.sessionId,
      contextVersion: session.scientificContext.contextVersion,
      previousDecisionIds: session.scientificThinking?.decisionHistory.map((item) => item.decisionId) ?? [],
      sourceJourney: "FORMALIZE_IDEA",
    },
  ) : null, [intent, knowledgeResult, routeIntent, session.scientificContext.centralScientificObject, session.scientificContext.contextVersion, session.scientificContext.detectedRelationships, session.scientificContext.preservedScientificTerms, session.scientificThinking?.decisionHistory, session.sessionId]);
  const report = useMemo(() => generateContextualReport(session, allAdaptiveQuestions, reportMode), [session, allAdaptiveQuestions, reportMode]);
  const fieldGroups = useMemo(() => {
    if (!interpretation) return [];
    const visible = INTERPRETED_FIELD_KEYS.filter((key) => interpretation[key].origin !== "NOT_PROVIDED");
    return [
      { title: "Ce que vous avez déclaré", keys: visible.filter((key) => interpretation[key].origin === "EXPLICIT_USER_STATEMENT") },
      { title: "Ce que NOXIA a reformulé", keys: visible.filter((key) => interpretation[key].origin === "NORMALIZED_FROM_USER_TERM") },
      { title: "Ce qui demande votre confirmation", keys: visible.filter((key) => ["TENTATIVE_INTERPRETATION", "CONTRADICTORY", "UNSUPPORTED"].includes(interpretation[key].origin)) },
      { title: "Contraintes repérées", keys: CONSTRAINT_FIELDS.filter((key) => visible.includes(key)) },
      { title: "Informations absentes conservées comme telles", keys: INTERPRETED_FIELD_KEYS.filter((key) => interpretation[key].origin === "NOT_PROVIDED") },
    ];
  }, [interpretation]);
  const understandingReady = Boolean(interpretation && reformulation.trim()
    && Object.keys(reviews).length === INTERPRETED_FIELD_KEYS.length
    && interpretation.termsNeedingClarification.every((item) => Boolean(ambiguityResolutions[item]))
    && interpretation.contradictions.every((item) => Boolean(contradictionResolutions[item])));
  const scenarioConfirmationAllowed = Boolean(intent?.interpretation.contradictions.every((item) => intent.contradictionResolutions[item] === "RESOLVED"));

  useEffect(() => {
    if (!scientificThinkingInput) return;
    setSession((current) => {
      const previous = current.scientificThinking;
      if (previous?.input.requestId === scientificThinkingInput.requestId && previous.input.knowledge.resultDigest === scientificThinkingInput.knowledge.resultDigest) return current;
      return { ...current, scientificThinking: createScientificThinkingSession(scientificThinkingInput), updatedAt: new Date().toISOString() };
    });
  }, [scientificThinkingInput]);

  const updateStep = (next: number) => setSession((current) => ({ ...current, currentStep: Math.max(0, Math.min(5, next)), updatedAt: new Date().toISOString() }));
  const applyQuestionChange = (value: string) => {
    setQuestion(value);
    if (!session.validatedIntent) setSession((current) => ({ ...current, originalQuestion: value, interfaceState: "QUESTION_DRAFT", updatedAt: new Date().toISOString() }));
  };
  const acceptInterpretation = (value: ScientificIntakeInterpretation, changeKind: QuestionChangeKind = "NONE") => {
    setInterpretation(value); setReformulation(value.reformulatedQuestion); setReviews({}); setCorrections({}); setAmbiguityResolutions({}); setContradictionResolutions({}); setPendingChangeKind(changeKind);
    setSession((current) => ({ ...current, interfaceState: "INTERPRETATION_REVIEW", currentStep: 1, updatedAt: new Date().toISOString() }));
    window.setTimeout(() => understandingHeadingRef.current?.focus(), 0);
  };
  const performAnalysis = async (changeKind: QuestionChangeKind) => {
    setBusy(true); setError(null); setLocalFallbackAvailable(false);
    setPendingChangeKind(changeKind);
    setSession((current) => ({ ...current, interfaceState: "ANALYZING" }));
    try {
      acceptInterpretation(await requestScientificInterpretation({ question: question.trim(), language: "fr", schemaVersion: "1.0" }), changeKind);
    } catch (caught) {
      const code = caught instanceof IntakeClientError ? caught.code : "API_UNAVAILABLE";
      setError(code === "QUOTA_EXCEEDED" ? "Le quota linguistique est temporairement atteint. Votre texte est conservé."
        : code === "INVALID_PROVIDER_RESPONSE" ? "La réponse linguistique reçue n’était pas exploitable. Votre texte est conservé."
          : "L’interprétation linguistique est indisponible. Votre texte est conservé. Vous pouvez réessayer ou continuer en mode local sans interprétation automatique.");
      const interfaceState = code === "QUOTA_EXCEEDED" ? "QUOTA_EXCEEDED" : code === "INVALID_PROVIDER_RESPONSE" ? "INVALID_PROVIDER_RESPONSE" : "API_UNAVAILABLE";
      setLocalFallbackAvailable(true); setSession((current) => ({ ...current, interfaceState }));
    } finally { setBusy(false); }
  };
  const openPatientLevelRefusal = () => {
    const now = new Date().toISOString();
    const localInterpretation = createEmptyInterpretation({ question: question.trim(), language: "fr", schemaVersion: "1.0" });
    localInterpretation.reformulatedQuestion = question.trim();
    localInterpretation.safetyFlags = ["PATIENT_LEVEL_CONTEXT_REQUIRES_GENERAL_REFORMULATION"];
    const localReviews = Object.fromEntries(INTERPRETED_FIELD_KEYS.map((key) => [key, { state: "UNKNOWN", reviewedAt: now }])) as Partial<Record<InterpretedFieldKey, HumanFieldReview>>;
    const validated = buildValidatedIntent(localInterpretation, localReviews, question.trim(), now);
    const context = { ...buildScientificSessionContext(validated), routeIntent: "UNDERSTAND" as const, routeConfidence: "HIGH" as const, routeReasons: ["Contexte individuel détecté : refus local avant tout appel externe."] };
    const base = createProtocolDesignerSession(now);
    setSession({ ...base, originalQuestion: question.trim(), validatedIntent: validated, scientificContext: context, currentStep: 3, interfaceState: "LOCAL_SAFETY_BLOCKED", updatedAt: now });
    setInterpretation(null); setReviews({}); setReformulation(""); setError(null); setLocalFallbackAvailable(false);
  };
  const analyze = async () => {
    setError(null); setLocalFallbackAvailable(false);
    if (isPatientLevelExpression(question)) { openPatientLevelRefusal(); return; }
    if (detectSensitiveData(question).length) {
      setError("Retirez toute donnée personnelle, patient, confidentielle ou identifiable avant de poursuivre.");
      setSession((current) => ({ ...current, interfaceState: "LOCAL_SAFETY_BLOCKED" })); return;
    }
    if (question.trim().length < 24) { setError("Décrivez votre question en au moins 24 caractères."); return; }
    const assessment = session.validatedIntent ? assessQuestionChange(session.originalQuestion, question) : { kind: "NONE" as const, affectedElements: [] };
    if (assessment.kind === "MAJOR") { setMajorChange({ stage: "BEFORE_ANALYSIS", affectedElements: assessment.affectedElements }); return; }
    await performAnalysis(assessment.kind);
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
  const finalizeUnderstanding = (forceMajor = false) => {
    if (!interpretation || !reformulation.trim()) return;
    const validated = buildValidatedIntent(interpretation, reviews, reformulation);
    validated.ambiguityResolutions = ambiguityResolutions;
    validated.contradictionResolutions = contradictionResolutions;
    const matches = matchScenarios(validated);
    if (!forceMajor && pendingChangeKind === "MINOR" && session.confirmedScenarioId && !matches.some((match) => match.scenarioId === session.confirmedScenarioId)) {
      setMajorChange({ stage: "AFTER_INTERPRETATION", affectedElements: assessQuestionChange(session.originalQuestion, question).affectedElements.length ? assessQuestionChange(session.originalQuestion, question).affectedElements : ["orientation, réponses, décision et rapport"] });
      return;
    }
    setSession((current) => {
      const requiresRebuild = forceMajor || pendingChangeKind === "MAJOR";
      const base = requiresRebuild ? invalidateDownstream(current, "Modification majeure confirmée — reconstruction des éléments dépendants") : current;
      const keepScenario = !requiresRebuild && current.confirmedScenarioId && matches.some((match) => match.scenarioId === current.confirmedScenarioId) ? current.confirmedScenarioId : null;
      const routed = buildScientificSessionContext(validated, current.scientificContext);
      const routedMatches = keepScenario ? confirmScenario(matches, keepScenario) : matches;
      return {
        ...base, originalQuestion: validated.originalQuestion, validatedIntent: validated, scenarioMatches: routedMatches,
        confirmedScenarioId: keepScenario, scientificContext: routed, interfaceState: matches.length ? matches.length > 1 ? "MULTIPLE_SCENARIOS" : "SCENARIO_PROPOSED" : "NO_SUPPORTED_SCENARIO",
        currentStep: 2, updatedAt: new Date().toISOString(),
      };
    });
    setPendingChangeKind("NONE"); setMajorChange(null);
  };
  const confirmUnderstanding = () => finalizeUnderstanding(false);
  const confirmMajorChange = async () => {
    if (!majorChange) return;
    if (majorChange.stage === "BEFORE_ANALYSIS") { setMajorChange(null); await performAnalysis("MAJOR"); }
    else finalizeUnderstanding(true);
  };
  const chooseScenario = (id: "spectral" | "cardiac" | "neuro") => setSession((current) => {
    if (!current.validatedIntent?.interpretation.contradictions.every((item) => current.validatedIntent?.contradictionResolutions[item] === "RESOLVED")) return current;
    const base = current.confirmedScenarioId && current.confirmedScenarioId !== id ? invalidateDownstream(current, "Orientation principale modifiée — projet à reconstruire") : current;
    const scenario = scenarioDetails(id);
    return {
      ...base, scenarioMatches: confirmScenario(current.scenarioMatches, id), confirmedScenarioId: id,
      secondaryScenarioIds: current.scenarioMatches.filter((item) => item.scenarioId !== id).map((item) => item.scenarioId),
      scientificContext: { ...current.scientificContext, workingHypotheses: scenario?.hypotheses ?? [], contextVersion: current.scientificContext.contextVersion + 1 },
      interfaceState: "SCENARIO_CONFIRMED", updatedAt: new Date().toISOString(),
    };
  });
  const transitionJourney = (next: RoutingIntent, reason: string, moveToWorkspace = true) => setSession((current) => {
    const previous = current.scientificContext.routeIntent;
    const transitions = previous && previous !== next ? [...current.scientificContext.transitions, { from: previous, to: next, reason, changedAt: new Date().toISOString() }] : current.scientificContext.transitions;
    return { ...current, currentStep: moveToWorkspace ? 3 : current.currentStep, scientificContext: { ...current.scientificContext, routeIntent: next, transitions, contextVersion: previous === next ? current.scientificContext.contextVersion : current.scientificContext.contextVersion + 1 }, updatedAt: new Date().toISOString() };
  });
  const clarifyKnowledge = (dimension: ContextDimensionName, value: string | null) => {
    setKnowledgeContextOverrides((current) => ({ ...current, [dimension]: value }));
    setKnowledgeContextRevision((current) => current + 1);
  };
  const answerQuestion = (item: AdaptiveQuestion, value: string, label: string, consequence: string, status: "ANSWERED" | "UNKNOWN" = "ANSWERED") => setSession((current) => {
    const previous = current.adaptiveAnswers.find((answer) => answer.questionId === item.questionId);
    const changed = Boolean(previous && previous.answer !== value);
    return {
      ...current, adaptiveAnswers: [...current.adaptiveAnswers.filter((answer) => answer.questionId !== item.questionId), { questionId: item.questionId, answer: value, label, consequence, answeredAt: new Date().toISOString(), status }],
      decision: changed ? null : current.decision, reportStatus: changed ? "NONE" : current.reportStatus,
      invalidatedDownstream: changed ? [...current.invalidatedDownstream, `Réponse modifiée dans ${BLOCK_LABELS[item.decisionBlock]}`] : current.invalidatedDownstream,
      interfaceState: "QUESTIONS_IN_PROGRESS", updatedAt: new Date().toISOString(),
    };
  });
  const setProjectStage = (stage: number) => setSession((current) => ({ ...current, scientificContext: { ...current.scientificContext, currentProjectStage: Math.max(1, Math.min(8, stage)) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 }, updatedAt: new Date().toISOString() }));
  const recordDecision = () => {
    if (!decisionForm.author.trim() || !decisionForm.justification.trim()) return;
    setSession((current) => ({ ...current, decision: { ...decisionForm, decidedAt: new Date().toISOString() }, reportStatus: "FINAL", interfaceState: "REPORT_READY", currentStep: 5, updatedAt: new Date().toISOString() }));
    setReportMode("FINAL");
  };
  const reset = () => {
    deleteSession(window.localStorage); deleteKnowledgeSnapshots(window.localStorage); setCandidate(null); setSession(createProtocolDesignerSession()); setQuestion(""); setInterpretation(null); setReviews({}); setCorrections({}); setReformulation(""); setAmbiguityResolutions({}); setContradictionResolutions({}); setAnswerDrafts({}); setError(null); setBusy(false); setLocalFallbackAvailable(false); setPendingChangeKind("NONE"); setMajorChange(null); setKnowledgeOpen(false); setKnowledgeContextOverrides({}); setKnowledgeContextRevision(0);
  };
  const copyReport = async () => navigator.clipboard?.writeText(reportToMarkdown(report));
  const downloadMarkdown = () => {
    const url = URL.createObjectURL(new Blob([reportToMarkdown(report)], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `noxia-session-${session.sessionId}.md`; link.click(); URL.revokeObjectURL(url);
  };

  const renderQuestions = (questions: AdaptiveQuestion[]) => questions.length ? <div className="mt-6 grid gap-4">{questions.map((item) => <QuestionCard key={item.questionId} item={item} index={journeyQuestions.findIndex((questionItem) => questionItem.questionId === item.questionId)} total={journeyQuestions.length} answer={session.adaptiveAnswers.find((answer) => answer.questionId === item.questionId)} draft={answerDrafts[item.questionId] ?? ""} onDraft={(value) => setAnswerDrafts((current) => ({ ...current, [item.questionId]: value }))} onAnswer={(value, label, consequence, status) => answerQuestion(item, value, label, consequence, status)} />)}</div> : <Panel className="mt-6"><p>Les informations utiles dans ce bloc ont déjà été confirmées. NOXIA ne vous les redemande pas.</p></Panel>;

  return <>
    <Helmet><title>Protocol Designer — assistant scientifique | NOXIA</title><meta name="description" content="Démonstrateur conversationnel NOXIA pour comprendre, formaliser ou construire un projet de recherche en imagerie médicale." /><meta name="robots" content="noindex, follow" /><link rel="canonical" href={CANONICAL} /></Helmet>
    <main id="demo-main" className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3 print:hidden"><Link to="/protocol-designer" className="text-sm text-muted-foreground hover:text-foreground">← Protocol Designer</Link><div className="flex gap-2">{session.confirmedScenarioId && <button onClick={() => setKnowledgeOpen(true)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><BookOpen className="h-4 w-4" /> Explorer le concept</button>}<AlertDialog><AlertDialogTrigger asChild><button className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><RotateCcw className="h-4 w-4" /> Réinitialiser</button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Réinitialiser cette session ?</AlertDialogTitle><AlertDialogDescription>La question, les validations, les réponses, la décision et le rapport local seront supprimés. Les autres données du navigateur ne seront pas touchées.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={reset}>Supprimer cette session</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></div>

        {candidate && candidate.sessionId !== session.sessionId && <Panel className="mb-6 border-primary/40 print:hidden"><p className="font-semibold">Une session précédente est disponible.</p><p className="mt-1 text-sm text-muted-foreground">Elle ne sera jamais reprise automatiquement.</p><p className="mt-2 text-xs text-muted-foreground">Dernière activité : {new Date(candidate.updatedAt).toLocaleString("fr-FR")} · {ROUTING_INTENT_LABELS[candidate.scientificContext.routeIntent ?? "UNDERSTAND"]}</p><div className="mt-4 flex flex-wrap gap-2"><button className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={() => { setSession(candidate); setQuestion(candidate.originalQuestion); setInterpretation(candidate.validatedIntent?.interpretation ?? null); setReformulation(candidate.validatedIntent?.validatedReformulation ?? ""); setReviews(candidate.validatedIntent?.reviews ?? {}); setAmbiguityResolutions(candidate.validatedIntent?.ambiguityResolutions ?? {}); setContradictionResolutions(candidate.validatedIntent?.contradictionResolutions ?? {}); setCandidate(null); }}>Reprendre</button><button className="rounded-lg border px-4 py-2 text-sm" onClick={() => setCandidate(null)}>Commencer une nouvelle session</button><button className="rounded-lg border px-4 py-2 text-sm text-destructive" onClick={() => { deleteSession(window.localStorage); setCandidate(null); }}>Supprimer</button></div></Panel>}

        {session.invalidatedDownstream.length > 0 && <div role="status" className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm"><strong>Réévaluation visible.</strong> {session.invalidatedDownstream.at(-1)}.</div>}
        {majorChange && <Panel role="alertdialog" aria-labelledby="major-change-title" className="mb-6 border-amber-500/60 bg-amber-500/10"><CircleAlert className="h-6 w-6 text-amber-600" /><h2 id="major-change-title" className="mt-3 text-xl font-semibold">Cette modification change la question scientifique de façon majeure</h2><p className="mt-2 text-sm">NOXIA ne modifiera pas silencieusement le projet. Si vous confirmez, les éléments suivants seront reconstruits :</p><ul className="mt-3 list-disc space-y-1 pl-5 text-sm">{majorChange.affectedElements.map((item) => <li key={item}>{item}</li>)}</ul><div className="mt-4 flex flex-wrap gap-2"><button onClick={confirmMajorChange} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Reconstruire les éléments concernés</button><button onClick={() => setMajorChange(null)} className="rounded-lg border bg-background px-4 py-2 text-sm">Conserver le projet actuel</button></div></Panel>}

        <nav aria-label="Progression de la conversation" className="mb-8 overflow-x-auto print:hidden"><ol className="flex min-w-max gap-2">{STEPS.map((label, index) => <li key={label}><span aria-current={step === index ? "step" : undefined} className={`inline-flex rounded-full px-3 py-2 text-xs font-medium ${step === index ? "bg-primary text-primary-foreground" : index < step ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{index + 1}. {label}</span></li>)}</ol></nav>

        {knowledgeOpen && activeScenario && <Panel role="dialog" aria-labelledby="knowledge-title" className="mb-8 border-primary/40"><div className="flex items-start justify-between gap-4"><div><Tag>Service transversal</Tag><h2 id="knowledge-title" className="mt-3 text-2xl font-bold">Explorer : {session.scientificContext.centralScientificObject}</h2><p className="mt-2 text-sm text-muted-foreground">Le contexte de votre parcours reste intact. Cette exploration mobilise uniquement la fixture locale {activeScenario.reasoningBook.id} v{activeScenario.reasoningBook.version}.</p></div><button onClick={() => setKnowledgeOpen(false)} aria-label="Revenir au parcours" className="rounded-lg border p-2"><X className="h-4 w-4" /></button></div><div className="mt-5 grid gap-4 md:grid-cols-3"><div><h3 className="font-semibold">Construits</h3>{activeScenario.constructs.map((item) => <p className="mt-2 text-sm" key={item}>• {item}</p>)}</div><div><h3 className="font-semibold">Limites</h3>{activeScenario.limitations.map((item) => <p className="mt-2 text-sm" key={item}>• {item}</p>)}</div><div><h3 className="font-semibold">Carte des preuves</h3>{activeScenario.evidence.map((item) => <p className="mt-2 text-sm" key={item.label}><strong>{item.label}</strong><br/><span className="text-muted-foreground">{item.locator}</span></p>)}</div></div><button onClick={() => setKnowledgeOpen(false)} className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">Revenir à {routeIntent ? ROUTING_INTENT_LABELS[routeIntent].toLowerCase() : "mon parcours"}</button></Panel>}

        {step === 0 && <div className="mx-auto max-w-3xl"><div className="flex gap-3 rounded-2xl bg-primary/10 p-5"><MessageCircle className="mt-1 h-6 w-6 shrink-0 text-primary" /><div><p className="font-semibold">Bonjour, je suis l’assistant scientifique NOXIA.</p><p className="mt-2 text-sm">Je peux vous aider à comprendre une question, formaliser une idée ou construire un projet de recherche en imagerie. Je commence par comprendre vos mots ; NOXIA structure ensuite le raisonnement. Les décisions restent les vôtres.</p></div></div><p className="mt-8 text-xs font-semibold uppercase tracking-[.2em] text-primary">Conversation scientifique</p><h1 className="mt-2 text-4xl font-bold tracking-tight">Décrivez votre question scientifique</h1><p className="mt-4 text-lg text-muted-foreground">Parlez comme vous le feriez à un collègue. Une question précise, une intuition encore floue ou un projet déjà avancé sont recevables.</p><div role="note" className="mt-6 flex gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><span><strong>Démonstrateur :</strong> ne saisissez aucune donnée patient, donnée personnelle, information confidentielle ou donnée de santé identifiable. NOXIA ne fournit ni avis médical, ni recommandation clinique.</span></div><label htmlFor="scientific-question" className="mt-7 block font-semibold">Votre question scientifique</label><p id="question-help" className="mt-1 text-sm text-muted-foreground">Écrivez librement votre besoin en 24 à 4 000 caractères. Une formulation individuelle courte est acceptée uniquement pour déclencher un refus local de sécurité.</p><textarea id="scientific-question" maxLength={4000} aria-describedby={`question-help question-counter${error ? " question-error" : ""}`} aria-invalid={Boolean(error)} value={question} onChange={(event) => applyQuestionChange(event.target.value.slice(0, 4000))} className="mt-3 min-h-52 w-full rounded-xl border bg-background p-4 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder="Exemple : Je cherche à comprendre…" /><div className="mt-2 flex justify-between gap-4 text-xs text-muted-foreground"><span>{error ? <span id="question-error" role="alert" className="text-destructive">{error}</span> : "Votre texte reste visible en cas d’échec."}</span><span id="question-counter">{question.length} / 4 000</span></div><div className="mt-5 flex flex-wrap gap-3"><button disabled={busy || (question.trim().length < 24 && !isPatientLevelExpression(question))} onClick={analyze} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50">{busy ? <><LoaderCircle className="h-4 w-4 animate-spin" /> NOXIA comprend votre demande…</> : <>Commencer la conversation <ArrowRight className="h-4 w-4" /></>}</button><select aria-label="Utiliser un exemple" defaultValue="" onChange={(event) => { if (event.target.value) applyQuestionChange(event.target.value); }} className="w-full max-w-full rounded-lg border bg-background px-4 py-3 sm:w-auto"><option value="">Utiliser un exemple</option>{EXAMPLES.map((example) => <option key={example} value={example}>{example}</option>)}</select></div><p aria-live="polite" className="mt-3 text-sm text-muted-foreground">{busy ? "Le modèle interprète la langue ; NOXIA prépare le contexte, l’orientation et les limites." : ""}</p>{localFallbackAvailable && <button className="mt-4 rounded-lg border px-4 py-2 text-sm" onClick={() => acceptInterpretation(createEmptyInterpretation({ question: question.trim(), language: "fr", schemaVersion: "1.0" }), pendingChangeKind)}>Continuer localement sans interprétation automatique</button>}</div>}

        {step === 1 && interpretation && <div className="mx-auto max-w-4xl"><h1 ref={understandingHeadingRef} tabIndex={-1} className="text-4xl font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring">Voici ce que j’ai compris</h1><p className="mt-3 text-muted-foreground">Je vous montre la compréhension avant d’orienter le parcours. Rien d’interprété n’est adopté sans votre validation.</p><div className="mt-7 grid gap-4"><div className="ml-auto max-w-3xl rounded-2xl rounded-br-sm bg-muted p-5"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Votre demande</p><p className="mt-2">{interpretation.originalQuestion}</p></div><div className="mr-auto max-w-3xl rounded-2xl rounded-bl-sm bg-primary/10 p-5"><label htmlFor="reformulation" className="text-xs font-semibold uppercase tracking-wide text-primary">Reformulation proposée par NOXIA</label><textarea id="reformulation" value={reformulation} onChange={(event) => setReformulation(event.target.value)} className="mt-2 min-h-28 w-full rounded-lg border bg-background p-3 focus-visible:ring-2 focus-visible:ring-ring" /><button className="mt-2 text-sm text-primary underline" onClick={() => setReformulation(interpretation.originalQuestion)}>Revenir au texte initial</button></div></div><Panel className="mt-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">Éléments repérés</h2><p className="mt-2 text-sm text-muted-foreground">Les absences restent des absences. Le bouton ci-contre confirme les éléments présents et marque les autres « inconnu ».</p></div><button onClick={confirmAll} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Valider les éléments repérés</button></div><div className="mt-4 flex flex-wrap gap-2">{INTERPRETED_FIELD_KEYS.filter((key) => interpretation[key].value !== null && interpretation[key].value !== "UNKNOWN").map((key) => <Tag key={key} tone={reviews[key]?.state === "CONFIRMED" ? "good" : "warning"}>{LABELS[key]} : {valueText(interpretation[key].value)}</Tag>)}</div><details className="mt-5"><summary className="cursor-pointer font-semibold">Corriger ou examiner le détail</summary><div className="mt-4 grid gap-6">{fieldGroups.map((group) => <section key={group.title}><h3 className="font-semibold">{group.title}</h3><div className="mt-3 grid gap-3">{group.keys.map((key) => <InterpretedFieldCard key={key} fieldKey={key} interpretation={interpretation} review={reviews[key]} correction={corrections[key]} onReview={setReview} onCorrection={(fieldKey, value) => setCorrections((current) => ({ ...current, [fieldKey]: value }))} />)}</div></section>)}</div></details></Panel><div className="mt-6 grid gap-4 md:grid-cols-2"><Panel><h2 className="font-semibold">Ambiguïtés</h2>{interpretation.termsNeedingClarification.length ? interpretation.termsNeedingClarification.map((item) => <div className="mt-3 text-sm" key={item}><p>• {item}</p><div className="mt-2 flex flex-wrap gap-2"><button onClick={() => setAmbiguityResolutions((current) => ({ ...current, [item]: "RESOLVED" }))} className="rounded border px-2 py-1">Résolue par reformulation</button><button onClick={() => setAmbiguityResolutions((current) => ({ ...current, [item]: "UNKNOWN" }))} className="rounded border px-2 py-1">Je ne sais pas</button></div></div>) : <p className="mt-2 text-sm text-muted-foreground">Aucune ambiguïté signalée.</p>}</Panel><Panel><h2 className="font-semibold">Contradictions</h2>{interpretation.contradictions.length ? interpretation.contradictions.map((item) => <div className="mt-3 text-sm" key={item}><p className="text-destructive">• {item}</p><div className="mt-2 flex flex-wrap gap-2"><button onClick={() => setContradictionResolutions((current) => ({ ...current, [item]: "RESOLVED" }))} className="rounded border px-2 py-1">Marquer comme traitée</button><button onClick={() => setContradictionResolutions((current) => ({ ...current, [item]: "KEPT_FOR_HUMAN_REVIEW" }))} className="rounded border px-2 py-1">Conserver pour revue</button></div></div>) : <p className="mt-2 text-sm text-muted-foreground">Aucune contradiction signalée.</p>}</Panel></div><div className="mt-6 flex flex-wrap justify-between gap-3 print:hidden"><button onClick={() => updateStep(0)} className="inline-flex items-center gap-2 rounded-lg border px-4 py-3"><ArrowLeft className="h-4 w-4" /> Modifier ma question</button><button disabled={!understandingReady} onClick={confirmUnderstanding} className="rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50">Confirmer cette compréhension</button></div></div>}

        {step === 2 && intent && <div><h1 className="text-4xl font-bold">Je vous propose un point de départ</h1><p className="mt-3 text-muted-foreground">L’intention de parcours et le corpus sont deux décisions distinctes. Vous pouvez corriger l’une sans perdre votre contexte.</p><Panel className="mt-6 border-primary/40"><div className="flex items-start gap-3"><Compass className="mt-1 h-6 w-6 text-primary" /><div><Tag tone="good">Proposition de parcours · confiance {session.scientificContext.routeConfidence.toLowerCase()}</Tag><h2 className="mt-3 text-2xl font-semibold">{routeIntent ? ROUTING_INTENT_LABELS[routeIntent] : "Intention à confirmer"}</h2><p className="mt-2 text-muted-foreground">{routeIntent ? ROUTE_DESCRIPTIONS[routeIntent] : "La demande reste trop ambiguë pour être orientée."}</p>{session.scientificContext.routeReasons.map((reason) => <p className="mt-2 text-sm" key={reason}>• {reason}</p>)}</div></div><div className="mt-5 flex flex-wrap gap-2">{(Object.keys(ROUTING_INTENT_LABELS) as RoutingIntent[]).map((route) => <button key={route} aria-pressed={routeIntent === route} onClick={() => transitionJourney(route, "Parcours corrigé par l’utilisateur", false)} className={`rounded-full border px-3 py-2 text-sm ${routeIntent === route ? "border-primary bg-primary text-primary-foreground" : "bg-background"}`}>{ROUTING_INTENT_LABELS[route]}</button>)}</div></Panel><h2 className="mt-8 text-2xl font-bold">Objet scientifique conservé : {session.scientificContext.centralScientificObject}</h2><div className="mt-3 flex flex-wrap gap-2">{session.scientificContext.preservedScientificTerms.map((term) => <Tag key={term}>{term}</Tag>)}</div>{!session.scenarioMatches.length ? <Panel className="mt-6"><CircleAlert className="h-6 w-6 text-amber-500" /><h2 className="mt-3 text-xl font-semibold">Le corpus local de cette V1 ne couvre pas encore suffisamment « {session.scientificContext.centralScientificObject} ».</h2><p className="mt-2 text-muted-foreground">La demande et l’intention restent conservées. NOXIA refuse de les remplacer par une réponse encyclopédique ou un scénario proche non justifié.</p>{routeIntent === "UNDERSTAND" && <p className="mt-3 text-sm">Le Knowledge Engine peut néanmoins qualifier cet arrêt, montrer les fournisseurs consultés et conserver les objets non couverts.</p>}{routeIntent === "FORMALIZE_IDEA" && <p className="mt-3 text-sm">Le Scientific Thinking Engine peut néanmoins structurer un candidat explicitement non soutenu et demander la connaissance manquante.</p>}<button onClick={() => updateStep(0)} className="mt-4 rounded-lg border px-4 py-2">Préciser ma demande</button></Panel> : <div className="mt-6 grid gap-4 lg:grid-cols-3">{session.scenarioMatches.map((match) => { const scenario = scenarioDetails(match.scenarioId); if (!scenario) return null; return <Panel key={match.scenarioId} className={session.confirmedScenarioId === match.scenarioId ? "border-primary" : ""}><div className="flex justify-between gap-2"><Tag tone={match.status === "MATCH_CONFIRMED" ? "good" : "warning"}>{match.status}</Tag><Tag>Confiance {match.confidence.toLowerCase()}</Tag></div><h3 className="mt-4 text-xl font-semibold">{scenario.shortLabel}</h3><p className="mt-2 text-sm text-muted-foreground">{scenario.comprehension}</p><p className="mt-4 text-sm"><strong>Termes concordants :</strong> {match.matchedTerms.join(", ")}</p><button disabled={!scenarioConfirmationAllowed} onClick={() => chooseScenario(match.scenarioId)} className="mt-5 w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Confirmer comme orientation principale</button><details className="mt-4 text-sm"><summary className="cursor-pointer">Traçabilité documentaire</summary><div className="mt-2 text-muted-foreground"><p>Program Owner : {scenario.program.id}</p><p>{scenario.reasoningBook.id} v{scenario.reasoningBook.version}</p><p>{scenario.fixtureStatus}</p><p>État des connaissances : {scenario.knowledgeDate}</p></div></details></Panel>; })}</div>}<div className="mt-6 flex justify-between gap-3 print:hidden"><button onClick={() => updateStep(1)} className="rounded-lg border px-4 py-2">Retour</button><button disabled={!routeIntent || (routeIntent === "DESIGN_STUDY" && !session.confirmedScenarioId)} onClick={() => updateStep(3)} className="rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50">{routeIntent === "UNDERSTAND" ? "Interroger le Knowledge Engine" : "Entrer dans cet espace scientifique"}</button></div></div>}

        {step === 3 && intent && routeIntent && (routeIntent === "UNDERSTAND" || routeIntent === "FORMALIZE_IDEA" || activeScenario || session.scientificThinking?.output.handoff.status === "AUTHORIZED") && <div><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Contexte v{session.scientificContext.contextVersion} · {activeScenario?.shortLabel ?? (routeIntent === "FORMALIZE_IDEA" ? "Scientific Thinking Engine" : routeIntent === "DESIGN_STUDY" ? "Research Design handoff" : "Knowledge Engine")}</p><h1 className="mt-2 text-4xl font-bold">{ROUTING_INTENT_LABELS[routeIntent]}</h1><p className="mt-3 text-muted-foreground">Objet central conservé : <strong>{session.scientificContext.centralScientificObject}</strong></p></div>{activeScenario && <button onClick={() => setKnowledgeOpen(true)} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2"><BookOpen className="h-4 w-4" /> Explorer ce concept</button>}</div><div className="mt-6 flex gap-2 overflow-x-auto pb-2 print:hidden">{(Object.keys(ROUTING_INTENT_LABELS) as RoutingIntent[]).map((route) => <button key={route} disabled={route === "DESIGN_STUDY" && (routeIntent === "FORMALIZE_IDEA" ? session.scientificThinking?.output.handoff.status !== "AUTHORIZED" : !activeScenario)} aria-pressed={routeIntent === route} onClick={() => transitionJourney(route, `Transition depuis ${ROUTING_INTENT_LABELS[routeIntent]}`)} className={`min-w-fit rounded-full border px-3 py-2 text-sm disabled:opacity-50 ${routeIntent === route ? "border-primary bg-primary text-primary-foreground" : "bg-background"}`}>{ROUTING_INTENT_LABELS[route]}</button>)}</div>

          {routeIntent === "UNDERSTAND" && knowledgeResult && <>
            <KnowledgeUnderstandView
              result={knowledgeResult}
              sessionId={session.sessionId}
              contextVersion={session.scientificContext.contextVersion + knowledgeContextRevision}
              onClarify={clarifyKnowledge}
            />
            {session.interfaceState !== "LOCAL_SAFETY_BLOCKED" && renderQuestions(journeyQuestions)}
            {session.interfaceState !== "LOCAL_SAFETY_BLOCKED" && <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => transitionJourney("FORMALIZE_IDEA", "Transformer la compréhension en question scientifique")} className="rounded-lg bg-primary px-4 py-3 text-primary-foreground">Formaliser une question à partir de cette compréhension</button>
              {activeScenario && <button onClick={() => transitionJourney("DESIGN_STUDY", "Construire un projet à partir de la compréhension")} className="rounded-lg border px-4 py-3">Construire un projet</button>}
            </div>}
          </>}

          {routeIntent === "FORMALIZE_IDEA" && (session.scientificThinking ? <ScientificThinkingView
            session={session.scientificThinking}
            onChange={(scientificThinking) => setSession((current) => ({ ...current, scientificThinking, scientificContext: { ...current.scientificContext, workingHypotheses: scientificThinking.output.hypotheses.filter((item) => item.reviewState === "ADOPTED").map((item) => item.text) }, updatedAt: new Date().toISOString() }))}
            onReturnToUnderstand={() => transitionJourney("UNDERSTAND", "Revenir à la compréhension du concept")}
            onExploreKnowledge={activeScenario ? () => setKnowledgeOpen(true) : undefined}
            onEnterResearchDesign={() => transitionJourney("DESIGN_STUDY", "Handoff Scientific Thinking autorisé par l’utilisateur")}
            onEditOriginalIdea={() => { setQuestion(session.originalQuestion); updateStep(0); }}
          /> : <Panel className="mt-8"><LoaderCircle className="h-5 w-5 animate-spin" /><p className="mt-3">NOXIA construit la projection de raisonnement…</p></Panel>)}

          {routeIntent === "DESIGN_STUDY" && <div className="mt-8"><Panel className="border-primary/40"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Construction du projet</p><h2 className="mt-2 text-2xl font-bold">Étape {session.scientificContext.currentProjectStage} sur 8</h2><p className="mt-1 text-muted-foreground">{PROJECT_STAGES[session.scientificContext.currentProjectStage - 1]}</p><div className="mt-5 overflow-x-auto"><ol className="flex min-w-max gap-2">{PROJECT_STAGES.map((stage, index) => <li key={stage}><button onClick={() => setProjectStage(index + 1)} aria-current={session.scientificContext.currentProjectStage === index + 1 ? "step" : undefined} className={`rounded-full px-3 py-2 text-xs ${session.scientificContext.currentProjectStage === index + 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{index + 1}. {stage}</button></li>)}</ol></div></Panel><div className="mt-6 grid gap-4 md:grid-cols-2"><Panel><h3 className="text-xl font-semibold">État de cette étape</h3>{session.scientificContext.currentProjectStage === 1 && <><p className="mt-3">Intention : {intent.validatedReformulation}</p><p className="mt-2 text-sm text-muted-foreground">Relation(s) repérée(s) : {session.scientificContext.detectedRelationships.join(" ; ") || "à préciser"}</p></>}{session.scientificContext.currentProjectStage === 2 && <><p className="mt-3">Objet : {session.scientificContext.centralScientificObject}</p><p className="mt-2">Question candidate : {session.scientificThinking?.output.selectedQuestionCandidate?.text ?? formalizedQuestionCandidate(intent, session.scientificContext.centralScientificObject)}</p></>}{session.scientificContext.currentProjectStage === 3 && <><p className="mt-3">Population : {valueText(intent.interpretation.population.value)}</p><p className="mt-2">Contexte : {valueText(intent.interpretation.clinicalContext.value)}</p></>}{session.scientificContext.currentProjectStage === 4 && <><p className="mt-3">Matériel déclaré : {valueText(intent.interpretation.availableEquipment.value)}</p><p className="mt-2">Données disponibles : {valueText(intent.interpretation.availableData.value)}</p></>}{session.scientificContext.currentProjectStage === 5 && <>{activeScenario ? <p className="mt-3">Corpus retenu : {activeScenario.reasoningBook.id} v{activeScenario.reasoningBook.version}</p> : <p className="mt-3">Aucun corpus principal retenu ; le gap Knowledge transmis par Scientific Thinking reste visible.</p>}<p className="mt-2">Aucune séquence, aucun protocole et aucun biomarqueur optimal ne sont décidés ici.</p><p className="mt-2 font-mono text-xs">TIMING_NOT_YET_GENERATABLE_FROM_CURRENT_EXECUTABLE_KNOWLEDGE</p></>}{session.scientificContext.currentProjectStage === 6 && <><p className="mt-3">Plan statistique : à construire avec les hypothèses, critères et données confirmés.</p><p className="mt-2 text-sm text-muted-foreground">La V1 n’invente ni test, ni effet attendu, ni puissance.</p></>}{session.scientificContext.currentProjectStage === 7 && <><p className="mt-3">Budget : structure à documenter par l’utilisateur.</p><p className="mt-2 text-sm text-muted-foreground">Aucun coût ou financement n’est estimé sans donnée déclarée.</p></>}{session.scientificContext.currentProjectStage === 8 && <><p className="mt-3">Le dossier de session rassemblera la question, le contexte, les décisions, les limites et la provenance.</p><p className="mt-2 text-sm text-muted-foreground">Les éléments non générables resteront visibles.</p></>}</Panel><Panel><h3 className="text-xl font-semibold">Informations encore manquantes</h3>{session.scientificContext.missingInformation.length ? session.scientificContext.missingInformation.slice(0, 6).map((item) => <p className="mt-2 text-sm" key={item}>• {item}</p>) : <p className="mt-3 text-sm text-muted-foreground">Aucune information manquante signalée par l’interprétation ; la revue scientifique reste nécessaire.</p>}</Panel></div>{renderQuestions(journeyQuestions.filter((item) => item.projectStage === session.scientificContext.currentProjectStage))}<div className="mt-6 flex flex-wrap justify-between gap-3"><button disabled={session.scientificContext.currentProjectStage === 1} onClick={() => setProjectStage(session.scientificContext.currentProjectStage - 1)} className="rounded-lg border px-4 py-2 disabled:opacity-50">Étape précédente</button>{session.scientificContext.currentProjectStage < 8 ? <button onClick={() => setProjectStage(session.scientificContext.currentProjectStage + 1)} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">Étape suivante</button> : <button onClick={() => updateStep(4)} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">Documenter la décision humaine</button>}</div></div>}
        </div>}

        {step === 4 && <div className="mx-auto max-w-3xl"><h1 className="text-4xl font-bold">Décision humaine</h1><p className="mt-3 text-muted-foreground">NOXIA documente la décision ; il ne la prend pas.</p><Panel className="mt-6"><label className="block font-semibold" htmlFor="author">Auteur de session</label><input id="author" value={decisionForm.author} onChange={(event) => setDecisionForm((current) => ({ ...current, author: event.target.value.slice(0, 80) }))} className="mt-2 w-full rounded-lg border bg-background px-3 py-2 focus-visible:ring-2 focus-visible:ring-ring" /><label className="mt-4 block font-semibold" htmlFor="outcome">Décision</label><select id="outcome" value={decisionForm.outcome} onChange={(event) => setDecisionForm((current) => ({ ...current, outcome: event.target.value as typeof current.outcome }))} className="mt-2 w-full rounded-lg border bg-background px-3 py-2"><option value="CONFIRM_ORIENTATION">Confirmer l’orientation</option><option value="DEFER">Différer</option><option value="REFUSE">Refuser</option></select><label className="mt-4 block font-semibold" htmlFor="justification">Justification</label><textarea id="justification" value={decisionForm.justification} onChange={(event) => setDecisionForm((current) => ({ ...current, justification: event.target.value.slice(0, 500) }))} className="mt-2 min-h-24 w-full rounded-lg border bg-background p-3 focus-visible:ring-2 focus-visible:ring-ring" /><label className="mt-4 block font-semibold" htmlFor="reservations">Réserves</label><textarea id="reservations" value={decisionForm.reservations} onChange={(event) => setDecisionForm((current) => ({ ...current, reservations: event.target.value.slice(0, 500) }))} className="mt-2 min-h-20 w-full rounded-lg border bg-background p-3 focus-visible:ring-2 focus-visible:ring-ring" /></Panel><div className="mt-6 flex flex-wrap justify-between gap-3 print:hidden"><button onClick={() => { setReportMode("PROVISIONAL"); setSession((current) => ({ ...current, reportStatus: "PROVISIONAL", currentStep: 5 })); }} className="rounded-lg border px-4 py-3">Générer un rapport provisoire</button><button disabled={!decisionForm.author.trim() || !decisionForm.justification.trim() || !session.confirmedScenarioId} onClick={recordDecision} className="rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50">Enregistrer et générer le rapport final</button></div></div>}

        {step === 5 && <article id="protocol-designer-report" className="min-w-0 [overflow-wrap:anywhere] print:text-black"><div className="flex min-w-0 flex-wrap items-start justify-between gap-4"><div className="min-w-0"><Tag tone={report.status === "FINAL" ? "good" : "warning"}>{report.status}</Tag><h1 className="mt-3 break-words text-4xl font-bold">{report.title}</h1><p className="mt-2 text-muted-foreground">Objet scientifique conservé jusqu’au rapport : <strong>{session.scientificContext.centralScientificObject}</strong>.</p><p className="mt-2 text-sm text-muted-foreground">Projection de démonstration : ni validation scientifique formelle, ni protocole clinique, ni avis médical, ni autorisation réglementaire, ni PASS PD-011.</p></div><div className="flex gap-2 print:hidden"><button onClick={() => window.print()} className="rounded-lg border p-3" aria-label="Imprimer ou enregistrer en PDF"><Printer className="h-4 w-4" /></button><button onClick={copyReport} className="rounded-lg border p-3" aria-label="Copier le rapport"><Copy className="h-4 w-4" /></button><button onClick={downloadMarkdown} className="rounded-lg border px-3 py-2 text-sm">Markdown</button></div></div><div className="mt-7 grid gap-3">{report.sections.map((section) => <details key={section.number} open={section.number <= 3} className="break-inside-avoid rounded-xl border bg-card p-4 print:block"><summary className="cursor-pointer font-semibold">{section.number}. {section.title} <span className="ml-2 text-xs text-muted-foreground">{section.status}</span></summary><div className="mt-3 space-y-2 text-sm">{section.content.map((item, index) => <p key={`${item}-${index}`}>• {item}</p>)}</div></details>)}</div><h2 className="mt-8 text-2xl font-bold">Livrables et limites</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{report.deliverables.map((item) => <Panel key={item.title}><Tag tone={item.status.includes("NOT_") || item.status.includes("STRUCTURE") ? "warning" : "good"}>{item.status}</Tag><h3 className="mt-3 text-lg font-semibold">{item.title}</h3>{item.available.map((value) => <p key={value} className="mt-2 text-sm">Disponible : {value}</p>)}{item.missing.map((value) => <p key={value} className="mt-2 text-sm text-muted-foreground">Manquant : {value}</p>)}{item.limits.map((value) => <p key={value} className="mt-2 text-sm text-muted-foreground">Limite : {value}</p>)}</Panel>)}</div>{!canGenerateFinalReport(session) && <div className="mt-5 flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4"><Info className="h-5 w-5 shrink-0" /><p>Le rapport reste provisoire : compréhension, scénario et décision humaine doivent être confirmés.</p></div>}<div className="mt-6 flex flex-wrap justify-between gap-3 print:hidden"><button onClick={() => updateStep(4)} className="rounded-lg border px-4 py-2">Retour à la décision</button><button onClick={() => { setQuestion(session.originalQuestion); updateStep(0); }} className="rounded-lg border px-4 py-2">Revoir la question</button></div></article>}
      </div>
    </main><div className="print:hidden"><Footer /></div>
  </>;
}
