import { INTERPRETED_FIELD_KEYS, type InterpretedField, type ScientificIntakeInterpretation, type ScientificIntakeRequest } from "./types";

export class IntakeValidationError extends Error {
  constructor(public readonly reason: string) {
    super("La réponse linguistique ne respecte pas le contrat d’intake.");
  }
}

const normalizeText = (value: string) => value.normalize("NFKC").replace(/\s+/g, " ").trim();
const comparable = (value: string) => normalizeText(value).toLocaleLowerCase("fr-FR");
const unique = (values: string[]) => [...new Set(values.map(normalizeText).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));

const FORBIDDEN_GENERATION_PATTERNS = [
  /<\/?[a-z][^>]*>/i,
  /\b(?:nous\s+recommandons|il\s+faut|vous\s+devez|traitement\s+recommand[ée])\b/i,
  /\b(?:protocole\s+(?:clinique|d['’]acquisition)|s[ée]quence\s+à\s+(?:réaliser|utiliser))\b/i,
  /\b(?:dose|bolus)\s*[:=]\s*\d/i,
  /\b(?:seuil|cut[- ]?off)\s*[:=]\s*\d/i,
  /\b(?:doi\s*:\s*10\.\d{4,9}|pmid\s*:\s*\d{6,9}|pmcid\s*:\s*PMC\d+)\b/i,
];

const normalizeField = <T extends string | string[]>(field: InterpretedField<T>, question: string): InterpretedField<T> => {
  const sourceText = field.sourceText ? normalizeText(field.sourceText) : undefined;
  const empty = field.value === null || field.value === "UNKNOWN" || (Array.isArray(field.value) && field.value.length === 0);
  if (empty) {
    return { value: null, origin: "NOT_PROVIDED", confidence: "UNKNOWN", userValidated: false } as InterpretedField<T>;
  }
  if (!sourceText || !comparable(question).includes(comparable(sourceText))) {
    throw new IntakeValidationError("SOURCE_TEXT_NOT_GROUNDED");
  }
  const value = Array.isArray(field.value) ? unique(field.value) : field.value;
  return {
    ...field,
    value: value as T,
    sourceText,
    alternatives: field.alternatives ? unique(field.alternatives) : undefined,
    userValidated: false,
  };
};

export const normalizeInterpretation = (
  raw: ScientificIntakeInterpretation,
  request: ScientificIntakeRequest,
): ScientificIntakeInterpretation => {
  const output = structuredClone(raw);
  output.originalQuestion = normalizeText(request.question);
  output.language = request.language ?? raw.language;
  output.reformulatedQuestion = normalizeText(raw.reformulatedQuestion);

  if (FORBIDDEN_GENERATION_PATTERNS.some((pattern) => pattern.test(output.reformulatedQuestion))) {
    throw new IntakeValidationError("FORBIDDEN_SCIENTIFIC_OR_CLINICAL_GENERATION");
  }

  for (const key of INTERPRETED_FIELD_KEYS) {
    const field = output[key] as InterpretedField<string | string[]>;
    (output as unknown as Record<string, unknown>)[key] = normalizeField(field, output.originalQuestion);
  }

  output.termsNeedingClarification = unique(output.termsNeedingClarification);
  output.missingInformation = unique(output.missingInformation);
  output.contradictions = unique(output.contradictions);
  output.unsupportedInferences = unique(output.unsupportedInferences);
  output.safetyFlags = unique(output.safetyFlags);

  const generatedText = JSON.stringify({
    reformulatedQuestion: output.reformulatedQuestion,
    missingInformation: output.missingInformation,
    contradictions: output.contradictions,
    unsupportedInferences: output.unsupportedInferences,
  });
  if (FORBIDDEN_GENERATION_PATTERNS.some((pattern) => pattern.test(generatedText))) {
    throw new IntakeValidationError("FORBIDDEN_SCIENTIFIC_OR_CLINICAL_GENERATION");
  }
  return output;
};
