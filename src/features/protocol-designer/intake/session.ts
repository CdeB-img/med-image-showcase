import { z } from "zod";
import { hasSensitiveData } from "./privacy";
import { parseScientificIntakeInterpretation } from "./schema";
import { INTAKE_FIXTURE_SET_VERSION, INTAKE_SESSION_SCHEMA_VERSION, type HumanFieldReview, type InterpretedFieldKey, type ProtocolDesignerSession, type ScientificIntakeInterpretation, type ValidatedScientificIntent } from "./types";

export const INTAKE_SESSION_KEY = "noxia-guided-intake-session-v3";

const storedSessionSchema = z.object({
  sessionSchemaVersion: z.literal(INTAKE_SESSION_SCHEMA_VERSION),
  fixtureSetVersion: z.literal(INTAKE_FIXTURE_SET_VERSION),
  sessionId: z.string().min(1).max(100),
  createdAt: z.string(), updatedAt: z.string(), interfaceState: z.string(), currentStep: z.number().int().min(0).max(6),
  originalQuestion: z.string().max(4_000), validatedIntent: z.unknown().nullable(), scenarioMatches: z.array(z.unknown()),
  confirmedScenarioId: z.enum(["spectral", "cardiac", "neuro"]).nullable(), secondaryScenarioIds: z.array(z.enum(["spectral", "cardiac", "neuro"])),
  adaptiveAnswers: z.array(z.unknown()), decision: z.unknown().nullable(), reportStatus: z.enum(["NONE", "PROVISIONAL", "FINAL"]),
  invalidatedDownstream: z.array(z.string()),
}).passthrough();

const makeId = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `session-${Date.now()}`;

export const createProtocolDesignerSession = (now = new Date().toISOString()): ProtocolDesignerSession => ({
  sessionSchemaVersion: INTAKE_SESSION_SCHEMA_VERSION,
  fixtureSetVersion: INTAKE_FIXTURE_SET_VERSION,
  sessionId: makeId(), createdAt: now, updatedAt: now,
  interfaceState: "IDLE", currentStep: 0, originalQuestion: "", validatedIntent: null,
  scenarioMatches: [], confirmedScenarioId: null, secondaryScenarioIds: [], adaptiveAnswers: [], decision: null,
  reportStatus: "NONE", invalidatedDownstream: [],
});

export const buildValidatedIntent = (
  interpretation: ScientificIntakeInterpretation,
  reviews: Partial<Record<InterpretedFieldKey, HumanFieldReview>>,
  reformulation: string,
  now = new Date().toISOString(),
): ValidatedScientificIntent => ({
  schemaVersion: interpretation.schemaVersion,
  originalQuestion: interpretation.originalQuestion,
  validatedReformulation: reformulation.trim(),
  language: interpretation.language,
  interpretation,
  reviews,
  ambiguityResolutions: {}, contradictionResolutions: {}, confirmedAt: now,
});

export const invalidateDownstream = (session: ProtocolDesignerSession, reason: string): ProtocolDesignerSession => ({
  ...session, updatedAt: new Date().toISOString(), scenarioMatches: [], confirmedScenarioId: null,
  secondaryScenarioIds: [], adaptiveAnswers: [], decision: null, reportStatus: "NONE",
  invalidatedDownstream: [...session.invalidatedDownstream, reason],
});

export const persistSession = (storage: Pick<Storage, "setItem">, session: ProtocolDesignerSession) => {
  if (hasSensitiveData(session.originalQuestion) || session.validatedIntent?.interpretation.safetyFlags.length) {
    throw new Error("SENSITIVE_SESSION_NOT_PERSISTED");
  }
  storage.setItem(INTAKE_SESSION_KEY, JSON.stringify(session));
};

export const loadSessionCandidate = (storage: Pick<Storage, "getItem" | "removeItem">): ProtocolDesignerSession | null => {
  const raw = storage.getItem(INTAKE_SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = storedSessionSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      storage.removeItem(INTAKE_SESSION_KEY);
      return null;
    }
    const intent = parsed.data.validatedIntent;
    if (intent !== null && (
      typeof intent !== "object" || !intent || !("interpretation" in intent)
      || !parseScientificIntakeInterpretation((intent as { interpretation: unknown }).interpretation).success
    )) {
      storage.removeItem(INTAKE_SESSION_KEY);
      return null;
    }
    return parsed.data as ProtocolDesignerSession;
  } catch {
    storage.removeItem(INTAKE_SESSION_KEY);
    return null;
  }
};

export const deleteSession = (storage: Pick<Storage, "removeItem">) => storage.removeItem(INTAKE_SESSION_KEY);
