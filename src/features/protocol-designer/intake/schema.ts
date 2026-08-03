import { z } from "zod";
import {
  INTERPRETED_FIELD_KEYS,
  INTAKE_SCHEMA_VERSION,
  type ScientificIntakeInterpretation,
  type ScientificIntakeRequest,
} from "./types";

export const MIN_QUESTION_LENGTH = 24;
export const MAX_QUESTION_LENGTH = 4_000;
export const MAX_REQUEST_BYTES = 12_000;

const originSchema = z.enum([
  "EXPLICIT_USER_STATEMENT",
  "NORMALIZED_FROM_USER_TERM",
  "TENTATIVE_INTERPRETATION",
  "NOT_PROVIDED",
  "CONTRADICTORY",
  "UNSUPPORTED",
]);

const confidenceSchema = z.enum(["HIGH", "MEDIUM", "LOW", "UNKNOWN"]);
const expertiseSchema = z.enum(["NON_SPECIALIST", "INTERMEDIATE", "EXPERT", "UNKNOWN"]);
const interpretedFieldKeySchema = z.enum(INTERPRETED_FIELD_KEYS);

const interpretedArrayFieldSchema = z.object({
  value: z.array(z.string().max(240)).max(24).nullable(),
  origin: originSchema,
  confidence: confidenceSchema,
  sourceText: z.string().max(500).optional(),
  alternatives: z.array(z.string().max(240)).max(12).optional(),
  userValidated: z.boolean(),
}).strict();

const interpretedExpertiseSchema = z.object({
  value: expertiseSchema.nullable(),
  origin: originSchema,
  confidence: confidenceSchema,
  sourceText: z.string().max(500).optional(),
  alternatives: z.array(z.string().max(240)).max(12).optional(),
  userValidated: z.boolean(),
}).strict();

export const scientificIntakeRequestSchema = z.object({
  question: z.string().min(MIN_QUESTION_LENGTH).max(MAX_QUESTION_LENGTH).refine((value) => !/https?:\/\//i.test(value), "Les URL ne sont pas acceptées dans cette tranche."),
  language: z.enum(["fr", "en"]).optional(),
  schemaVersion: z.literal(INTAKE_SCHEMA_VERSION),
  declaredExpertise: expertiseSchema.optional(),
}).strict();

export const scientificIntakeInterpretationSchema = z.object({
  schemaVersion: z.literal(INTAKE_SCHEMA_VERSION),
  originalQuestion: z.string().min(1).max(MAX_QUESTION_LENGTH),
  reformulatedQuestion: z.string().min(1).max(MAX_QUESTION_LENGTH),
  language: z.enum(["fr", "en"]),
  userExpertise: interpretedExpertiseSchema,
  scientificDomain: interpretedArrayFieldSchema,
  clinicalContext: interpretedArrayFieldSchema,
  scientificPurpose: interpretedArrayFieldSchema,
  population: interpretedArrayFieldSchema,
  pathologyOrCondition: interpretedArrayFieldSchema,
  phenomenaOfInterest: interpretedArrayFieldSchema,
  interventionsOrGroups: interpretedArrayFieldSchema,
  outcomesMentioned: interpretedArrayFieldSchema,
  studyDesign: interpretedArrayFieldSchema,
  centers: interpretedArrayFieldSchema,
  availableEquipment: interpretedArrayFieldSchema,
  fieldStrengths: interpretedArrayFieldSchema,
  manufacturers: interpretedArrayFieldSchema,
  models: interpretedArrayFieldSchema,
  softwareVersions: interpretedArrayFieldSchema,
  availableData: interpretedArrayFieldSchema,
  constraints: interpretedArrayFieldSchema,
  declaredTimings: interpretedArrayFieldSchema,
  termsNeedingClarification: z.array(z.string().max(240)).max(30),
  missingInformation: z.array(z.string().max(240)).max(30),
  contradictions: z.array(z.string().max(500)).max(20),
  unsupportedInferences: z.array(z.string().max(500)).max(30),
  safetyFlags: z.array(z.string().max(240)).max(20),
}).strict();

const providerFieldSchema = z.object({
  key: interpretedFieldKeySchema,
  value: z.array(z.string().max(240)).max(24).nullable(),
  origin: originSchema,
  confidence: confidenceSchema,
  sourceText: z.string().max(500).optional(),
  alternatives: z.array(z.string().max(240)).max(12).optional(),
}).strict();

const providerOutputSchema = z.object({
  schemaVersion: z.literal(INTAKE_SCHEMA_VERSION),
  originalQuestion: z.string().min(1).max(MAX_QUESTION_LENGTH),
  reformulatedQuestion: z.string().min(1).max(MAX_QUESTION_LENGTH),
  language: z.enum(["fr", "en"]),
  fields: z.array(providerFieldSchema).max(INTERPRETED_FIELD_KEYS.length),
  termsNeedingClarification: z.array(z.string().max(240)).max(30),
  missingInformation: z.array(z.string().max(240)).max(30),
  contradictions: z.array(z.string().max(500)).max(20),
  unsupportedInferences: z.array(z.string().max(500)).max(30),
  safetyFlags: z.array(z.string().max(240)).max(20),
}).strict().superRefine((value, context) => {
  const keys = value.fields.map((field) => field.key);
  if (new Set(keys).size !== keys.length) context.addIssue({ code: "custom", message: "DUPLICATE_PROVIDER_FIELD", path: ["fields"] });
});

const providerFieldJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    key: { type: "string", enum: INTERPRETED_FIELD_KEYS },
    value: { type: ["array", "null"], items: { type: "string" } },
    origin: { type: "string", enum: originSchema.options },
    confidence: { type: "string", enum: confidenceSchema.options },
    sourceText: { type: "string" },
    alternatives: { type: "array", items: { type: "string" } },
  },
  required: ["key", "value", "origin", "confidence"],
} as const;

export const SCIENTIFIC_INTAKE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    schemaVersion: { type: "string", enum: [INTAKE_SCHEMA_VERSION] },
    originalQuestion: { type: "string" },
    reformulatedQuestion: { type: "string" },
    language: { type: "string", enum: ["fr", "en"] },
    fields: { type: "array", items: providerFieldJsonSchema },
    termsNeedingClarification: { type: "array", items: { type: "string" } },
    missingInformation: { type: "array", items: { type: "string" } },
    contradictions: { type: "array", items: { type: "string" } },
    unsupportedInferences: { type: "array", items: { type: "string" } },
    safetyFlags: { type: "array", items: { type: "string" } },
  },
  required: [
    "schemaVersion", "originalQuestion", "reformulatedQuestion", "language", "fields", "termsNeedingClarification", "missingInformation",
    "contradictions", "unsupportedInferences", "safetyFlags",
  ],
} as const;

const emptyArrayField = () => ({
  value: null,
  origin: "NOT_PROVIDED" as const,
  confidence: "UNKNOWN" as const,
  userValidated: false,
});

export const createEmptyInterpretation = (request: ScientificIntakeRequest): ScientificIntakeInterpretation => ({
  schemaVersion: INTAKE_SCHEMA_VERSION,
  originalQuestion: request.question,
  reformulatedQuestion: request.question,
  language: request.language ?? "fr",
  userExpertise: {
    value: request.declaredExpertise ?? "UNKNOWN",
    origin: request.declaredExpertise ? "EXPLICIT_USER_STATEMENT" : "NOT_PROVIDED",
    confidence: request.declaredExpertise ? "HIGH" : "UNKNOWN",
    userValidated: false,
  },
  scientificDomain: emptyArrayField(),
  clinicalContext: emptyArrayField(),
  scientificPurpose: emptyArrayField(),
  population: emptyArrayField(),
  pathologyOrCondition: emptyArrayField(),
  phenomenaOfInterest: emptyArrayField(),
  interventionsOrGroups: emptyArrayField(),
  outcomesMentioned: emptyArrayField(),
  studyDesign: emptyArrayField(),
  centers: emptyArrayField(),
  availableEquipment: emptyArrayField(),
  fieldStrengths: emptyArrayField(),
  manufacturers: emptyArrayField(),
  models: emptyArrayField(),
  softwareVersions: emptyArrayField(),
  availableData: emptyArrayField(),
  constraints: emptyArrayField(),
  declaredTimings: emptyArrayField(),
  termsNeedingClarification: [],
  missingInformation: [
    "Domaine scientifique à confirmer",
    "Objectif scientifique à préciser",
    "Phénomène principal à clarifier",
  ],
  contradictions: [],
  unsupportedInferences: [],
  safetyFlags: [],
});

export const parseScientificIntakeRequest = (value: unknown) => scientificIntakeRequestSchema.safeParse(value);
export const parseScientificIntakeInterpretation = (value: unknown) => scientificIntakeInterpretationSchema.safeParse(value);
export const parseScientificIntakeProviderOutput = (value: unknown, request: ScientificIntakeRequest) => {
  const parsed = providerOutputSchema.safeParse(value);
  if (!parsed.success || parsed.data.originalQuestion !== request.question) return { success: false as const };
  const output = createEmptyInterpretation(request);
  output.reformulatedQuestion = parsed.data.reformulatedQuestion;
  output.language = parsed.data.language;
  output.termsNeedingClarification = parsed.data.termsNeedingClarification;
  output.missingInformation = parsed.data.missingInformation;
  output.contradictions = parsed.data.contradictions;
  output.unsupportedInferences = parsed.data.unsupportedInferences;
  output.safetyFlags = parsed.data.safetyFlags;
  for (const field of parsed.data.fields) {
    if (field.key === "userExpertise") {
      const expertise = field.value?.[0] ?? null;
      if (expertise !== null && !expertiseSchema.options.includes(expertise as typeof expertiseSchema.options[number])) return { success: false as const };
      output.userExpertise = { value: expertise as typeof output.userExpertise.value, origin: field.origin, confidence: field.confidence, sourceText: field.sourceText, alternatives: field.alternatives, userValidated: false };
      continue;
    }
    (output as unknown as Record<string, unknown>)[field.key] = { value: field.value, origin: field.origin, confidence: field.confidence, sourceText: field.sourceText, alternatives: field.alternatives, userValidated: false };
  }
  return scientificIntakeInterpretationSchema.safeParse(output);
};
