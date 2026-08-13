import { logicalDigest, normalizeScientificText, uniqueSorted } from "@/features/knowledge-engine/canonical";
import type { KnowledgeResult } from "@/features/knowledge-engine/types";
import { INTERPRETED_FIELD_KEYS, type InterpretedFieldKey, type RoutingIntent, type ValidatedScientificIntent } from "@/features/protocol-designer/intake/types";
import { SCIENTIFIC_THINKING_ENGINE_VERSION, type KnowledgeSupport, type ScientificThinkingInput } from "./types";

const asValues = (intent: ValidatedScientificIntent, key: InterpretedFieldKey): string[] => {
  const review = intent.reviews[key];
  if (["REMOVED", "UNKNOWN", "NOT_RELEVANT"].includes(review?.state ?? "")) return [];
  const field = intent.interpretation[key];
  const value = review?.state === "CORRECTED" ? review.correctedValue : field.value;
  return (Array.isArray(value) ? value : typeof value === "string" && value !== "UNKNOWN" ? [value] : [])
    .map((item) => normalizeScientificText(String(item)))
    .filter(Boolean);
};

const METHOD_PATTERNS = [
  "T1 mapping", "T2 mapping", "ECV", "LGE", "IRM", "MRI", "CT", "CT spectral", "scanner spectral",
  "MOLLI", "SASHA", "dual energy", "double énergie", "photon counting", "K-edge", "PET", "échographie",
] as const;

const methodsFromText = (text: string) => {
  const detected = METHOD_PATTERNS.filter((term) => term === "CT"
    ? /\bct\b/i.test(text)
    : text.toLocaleLowerCase("fr-FR").includes(term.toLocaleLowerCase("fr-FR")));
  return detected.filter((term) => term !== "CT" || !detected.includes("CT spectral"));
};

const supportFromKnowledge = (result: KnowledgeResult | null): KnowledgeSupport => {
  if (!result) return "UNAVAILABLE";
  if (result.coverageStatus === "SUPPORTED") return "SUPPORTED";
  if (result.coverageStatus === "PARTIAL") return "PARTIAL";
  if (result.coverageStatus === "CONFLICTING") return "CONFLICTING";
  return "UNSUPPORTED";
};

export const buildScientificThinkingInput = (
  intent: ValidatedScientificIntent,
  scientificObjectTerms: string[],
  relations: string[],
  knowledgeResult: KnowledgeResult | null,
  runtime: {
    sessionId?: string;
    contextVersion?: number;
    researchProjectId?: string | null;
    previousDecisionIds?: string[];
    sourceJourney?: Exclude<RoutingIntent, "DOCUMENT">;
  } = {},
): ScientificThinkingInput => {
  const source = normalizeScientificText(intent.originalQuestion);
  const material = {
    source,
    reformulation: normalizeScientificText(intent.validatedReformulation),
    terms: [...new Set(scientificObjectTerms.map(normalizeScientificText).filter(Boolean))],
    contextVersion: runtime.contextVersion ?? 0,
  };
  const information = INTERPRETED_FIELD_KEYS.flatMap((key) => {
    const values = asValues(intent, key);
    if (!values.length) return [];
    return values.map((value) => ({ value: `${key}:${value}`, explicit: intent.interpretation[key].origin === "EXPLICIT_USER_STATEMENT" }));
  });
  const resolvedConcepts = knowledgeResult?.resolvedConcepts.map((item) => ({
    conceptId: item.conceptId,
    label: item.preferredLabel,
    status: item.kind === "UNKNOWN" || item.kind === "AMBIGUOUS" ? "UNRESOLVED" as const : "RESOLVED" as const,
  })) ?? scientificObjectTerms.map((term) => ({ conceptId: `unresolved:${logicalDigest(term)}`, label: term, status: "UNRESOLVED" as const }));
  const result: ScientificThinkingInput = {
    contractVersion: SCIENTIFIC_THINKING_ENGINE_VERSION,
    requestId: `scientific-thinking-request:${logicalDigest(material)}`,
    originalExpression: source,
    validatedReformulation: material.reformulation,
    language: intent.language,
    scientificIntent: {
      intentRef: `validated-scientific-intent:${logicalDigest({ reformulation: intent.validatedReformulation, reviews: intent.reviews })}`,
      userExpertise: asValues(intent, "userExpertise")[0] ?? "UNKNOWN",
      sourceJourney: runtime.sourceJourney ?? "FORMALIZE_IDEA",
      semanticModelRef: intent.semanticSnapshot?.semanticModelId,
      semanticModelDigest: intent.semanticSnapshot?.semanticModelDigest,
    },
    researchContext: {
      sessionId: runtime.sessionId ?? "UNBOUND_SESSION",
      contextVersion: runtime.contextVersion ?? 0,
      researchProjectId: runtime.researchProjectId ?? null,
      previousDecisionIds: uniqueSorted(runtime.previousDecisionIds ?? []),
    },
    scientificObjectTerms: material.terms,
    resolvedConcepts,
    relations: uniqueSorted(relations.map(normalizeScientificText).filter(Boolean)),
    population: uniqueSorted(asValues(intent, "population")),
    pathologyOrCondition: uniqueSorted(asValues(intent, "pathologyOrCondition")),
    phenomena: uniqueSorted(asValues(intent, "phenomenaOfInterest")),
    outcomes: uniqueSorted(asValues(intent, "outcomesMentioned")),
    methodsMentioned: uniqueSorted([
      ...methodsFromText(`${source} ${intent.validatedReformulation}`),
      ...asValues(intent, "availableEquipment"),
    ]),
    scientificPurpose: uniqueSorted(asValues(intent, "scientificPurpose")),
    context: uniqueSorted(asValues(intent, "clinicalContext")),
    missingInformation: uniqueSorted(intent.interpretation.missingInformation.map(normalizeScientificText).filter(Boolean)),
    contradictions: uniqueSorted(intent.interpretation.contradictions
      .filter((item) => intent.contradictionResolutions[item] !== "RESOLVED")
      .map(normalizeScientificText).filter(Boolean)),
    safetyFlags: uniqueSorted(intent.interpretation.safetyFlags.map(normalizeScientificText).filter(Boolean)),
    information: {
      explicit: uniqueSorted(information.filter((item) => item.explicit).map((item) => item.value)),
      interpreted: uniqueSorted(information.filter((item) => !item.explicit).map((item) => item.value)),
    },
    knowledge: {
      resultId: knowledgeResult?.resultId ?? null,
      resultDigest: knowledgeResult?.resultDigest ?? null,
      coverageStatus: knowledgeResult?.coverageStatus ?? "NOT_REQUESTED_OR_UNAVAILABLE",
      support: supportFromKnowledge(knowledgeResult),
      sourceIds: uniqueSorted(knowledgeResult?.sources.map((item) => item.sourceId) ?? []),
      gapCodes: uniqueSorted(knowledgeResult?.gaps.map((item) => item.code) ?? []),
      unresolvedConcepts: uniqueSorted(knowledgeResult?.unresolvedConcepts ?? []),
      limitations: uniqueSorted(knowledgeResult?.limitations ?? []),
    },
  };
  return result;
};
