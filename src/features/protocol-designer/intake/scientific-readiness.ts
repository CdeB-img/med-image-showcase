import { normalizeScientificText } from "@/features/knowledge-engine/canonical";
import type { ScientificThinkingSession } from "@/features/scientific-thinking/types";
import type { InterpretedFieldKey, ValidatedScientificIntent } from "./types";

export const SCIENTIFIC_READINESS_GUARD_VERSION = "1.0" as const;

export type ScientificReadinessReason =
  | "SCIENTIFIC_QUESTION_NOT_STABILIZED"
  | "SCIENTIFIC_OBJECT_ONLY_THEMATIC"
  | "SCIENTIFIC_OBJECTIVE_MISSING"
  | "SCIENTIFIC_RELATION_UNCLEAR"
  | "CONCEPTUAL_CONTRADICTION_OPEN"
  | "IMAGING_PHENOMENON_NOT_LINKED"
  | "IMAGING_OBSERVABLE_OR_BIOMARKER_MISSING";

export type ScientificReadinessAssessment = {
  guardVersion: typeof SCIENTIFIC_READINESS_GUARD_VERSION;
  status: "READY_FOR_NEXT_ENGINE" | "SCIENTIFIC_THINKING_REQUIRED";
  scientificThinkingRequired: boolean;
  imagingRequired: boolean;
  nextSurface: "SCIENTIFIC_THINKING" | "IMAGING" | "PROJECT_CONSTRUCTION";
  reasons: ScientificReadinessReason[];
  trace: string[];
};

const valuesFor = (intent: ValidatedScientificIntent, key: InterpretedFieldKey) => {
  const review = intent.reviews[key];
  if (["REMOVED", "UNKNOWN", "NOT_RELEVANT"].includes(review?.state ?? "")) return [];
  const field = intent.interpretation[key];
  const value = review?.state === "CORRECTED" ? review.correctedValue : field.value;
  return (Array.isArray(value) ? value : typeof value === "string" && value !== "UNKNOWN" ? [value] : [])
    .map((item) => normalizeScientificText(String(item))).filter(Boolean);
};

const hasImaging = (text: string) => /\b(irm|mri|cmr|scanner|ct|imagerie|t1|t2|ecv|lge|oef|cmro|perfusion|spectral|photon|échograph|pet|spect)\b/.test(text);
const explicitlyWithoutImaging = (text: string) => /\b(sans|aucune?|hors)\s+(composante\s+d['’])?(modalité\s+d['’])?imagerie\b|\bimagerie\s+non\s+(requise|applicable)\b/.test(text);
const hasBiomarkerOrObservable = (text: string, outcomes: string[]) => /\b(ecv|t1\s*(?:natif|mapping)?|t2\s*(?:natif|mapping)?|lge|oef|cmro2|cmro₂|cbf|cbv|tmax|biomarqueur|observable|mesure\s+quantitative)\b/.test(`${text} ${outcomes.join(" ")}`);
const hasPhenomenon = (text: string, phenomena: string[]) => phenomena.length > 0 || /\b(fibrose|œdème|oedème|inflammation|nécrose|ischémie|perfusion|obstruction\s+microvasculaire|no[- ]?reflow|hémorragie|infiltration|remodelage|métabolisme|perméabilité|diffusion)\b/.test(text);
const hasObjective = (text: string, purposes: string[]) => purposes.length > 0 || /\b(mesurer|quantifier|comparer|évaluer|estimer|détecter|suivre|prédire|caractériser|valider|associer|étudier\s+la\s+relation)\b/.test(text);
const questionLooksStabilized = (text: string) => /\b(chez|dans|parmi|population|patients?|cohorte|adultes?|enfants?)\b/.test(text)
  || /\b(comparer|mesurer|quantifier|évaluer|estimer|détecter|suivre|prédire|valider)\b/.test(text);
const thematicOnly = (text: string) => /\b(étude|projet)\s+(?:sur|autour\s+de)\b/.test(text)
  && !/\b(comparer|mesurer|quantifier|évaluer|estimer|détecter|suivre|prédire|valider|relation)\b/.test(text);

export const assessScientificReadiness = (
  intent: ValidatedScientificIntent,
  thinking: ScientificThinkingSession | null = null,
): ScientificReadinessAssessment => {
  const text = normalizeScientificText(`${intent.originalQuestion} ${intent.validatedReformulation}`).toLocaleLowerCase("fr-FR");
  const methods = normalizeScientificText(thinking?.input.methodsMentioned.join(" ") ?? "").toLocaleLowerCase("fr-FR");
  const imagingRequired = !(explicitlyWithoutImaging(text) && !hasImaging(text.replace(/sans\s+imagerie/g, ""))) && hasImaging(`${text} ${methods}`);
  if (thinking?.output.handoff.status === "AUTHORIZED") return {
    guardVersion: SCIENTIFIC_READINESS_GUARD_VERSION,
    status: "READY_FOR_NEXT_ENGINE",
    scientificThinkingRequired: false,
    imagingRequired,
    nextSurface: imagingRequired ? "IMAGING" : "PROJECT_CONSTRUCTION",
    reasons: [],
    trace: ["AUTHORIZED_SCIENTIFIC_THINKING_HANDOFF_REUSED", imagingRequired ? "NEXT_IMAGING" : "NEXT_PROJECT_CONSTRUCTION"],
  };

  const phenomena = valuesFor(intent, "phenomenaOfInterest");
  const outcomes = valuesFor(intent, "outcomesMentioned");
  const purposes = valuesFor(intent, "scientificPurpose");
  const relations = /\b(compar|relation|associ|dépend|influence|effet|impact|versus|vs\.?)/.test(text);
  const openContradictions = intent.interpretation.contradictions.filter((item) => intent.contradictionResolutions[item] !== "RESOLVED");
  const reasons: ScientificReadinessReason[] = [];
  if (!questionLooksStabilized(text)) reasons.push("SCIENTIFIC_QUESTION_NOT_STABILIZED");
  if (thematicOnly(text)) reasons.push("SCIENTIFIC_OBJECT_ONLY_THEMATIC");
  if (!hasObjective(text, purposes)) reasons.push("SCIENTIFIC_OBJECTIVE_MISSING");
  if (!relations && /\b(idée|intuition|hypothèse|je pense|pourrait)\b/.test(text)) reasons.push("SCIENTIFIC_RELATION_UNCLEAR");
  if (openContradictions.length) reasons.push("CONCEPTUAL_CONTRADICTION_OPEN");
  if (imagingRequired && !hasPhenomenon(text, phenomena)) reasons.push("IMAGING_PHENOMENON_NOT_LINKED");
  if (imagingRequired && !hasBiomarkerOrObservable(text, outcomes)) reasons.push("IMAGING_OBSERVABLE_OR_BIOMARKER_MISSING");
  const uniqueReasons = [...new Set(reasons)];
  const scientificThinkingRequired = uniqueReasons.length > 0;
  return {
    guardVersion: SCIENTIFIC_READINESS_GUARD_VERSION,
    status: scientificThinkingRequired ? "SCIENTIFIC_THINKING_REQUIRED" : "READY_FOR_NEXT_ENGINE",
    scientificThinkingRequired,
    imagingRequired,
    nextSurface: scientificThinkingRequired ? "SCIENTIFIC_THINKING" : imagingRequired ? "IMAGING" : "PROJECT_CONSTRUCTION",
    reasons: uniqueReasons,
    trace: [
      ...uniqueReasons,
      scientificThinkingRequired ? "ST_ACTIVATED_BEFORE_SPECIALIZED_ENGINE" : imagingRequired ? "DIRECT_IMAGING_ALLOWED" : "DIRECT_PROJECT_CONSTRUCTION_ALLOWED",
    ],
  };
};

