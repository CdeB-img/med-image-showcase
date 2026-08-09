import { z } from "zod";
import { scientificThinkingSessionSchema } from "@/features/scientific-thinking/types";
import { imagingDesignSessionSchema } from "@/features/imaging-study-designer/types";
import { researchProjectConstructionSessionSchema } from "@/features/research-project-construction/types";
import { hasSensitiveData } from "./privacy.js";
import { parseScientificIntakeInterpretation } from "./schema.js";
import { INTAKE_FIXTURE_SET_VERSION, INTAKE_SESSION_SCHEMA_VERSION, type HumanFieldReview, type InterpretedFieldKey, type ProtocolDesignerSession, type ScientificIntakeInterpretation, type ValidatedScientificIntent } from "./types.js";

export const INTAKE_SESSION_KEY = "noxia-guided-intake-session-v7";

const storedSessionSchema = z.object({
  sessionSchemaVersion: z.literal(INTAKE_SESSION_SCHEMA_VERSION),
  fixtureSetVersion: z.literal(INTAKE_FIXTURE_SET_VERSION),
  sessionId: z.string().min(1).max(100),
  createdAt: z.string(), updatedAt: z.string(), interfaceState: z.string(), currentStep: z.number().int().min(0).max(6),
  originalQuestion: z.string().max(4_000), validatedIntent: z.unknown().nullable(), scenarioMatches: z.array(z.unknown()),
  confirmedScenarioId: z.enum(["spectral", "cardiac", "neuro"]).nullable(), secondaryScenarioIds: z.array(z.enum(["spectral", "cardiac", "neuro"])),
  adaptiveAnswers: z.array(z.unknown()), decision: z.unknown().nullable(), reportStatus: z.enum(["NONE", "PROVISIONAL", "FINAL"]),
  invalidatedDownstream: z.array(z.string()),
  scientificContext: z.object({
    routeIntent: z.enum(["UNDERSTAND", "FORMALIZE_IDEA", "DESIGN_STUDY"]).nullable(),
    routeConfidence: z.enum(["HIGH", "MEDIUM", "LOW", "UNKNOWN"]),
    routeReasons: z.array(z.string()), centralScientificObject: z.string(), preservedScientificTerms: z.array(z.string()),
    detectedRelationships: z.array(z.string()), workingHypotheses: z.array(z.string()), missingInformation: z.array(z.string()),
    contextVersion: z.number().int().min(0), transitions: z.array(z.unknown()), currentProjectStage: z.number().int().min(1).max(8),
    activeDesignSurface: z.enum(["IMAGING", "PROJECT_CONSTRUCTION"]),
  }).passthrough(),
  scientificThinking: scientificThinkingSessionSchema.nullable(),
  scientificThinkingHistory: z.array(z.object({
    outputId: z.string(), outputDigest: z.string(), decisionRecordIds: z.array(z.string()), invalidatedReason: z.string(),
  }).strict()),
  imagingDesign: imagingDesignSessionSchema.nullable(),
  imagingDesignHistory: z.array(z.object({
    inputId: z.string(), resultId: z.string(), resultDigest: z.string(), decisionRecordIds: z.array(z.string()), invalidatedReason: z.string(),
  }).strict()),
  projectConstruction: researchProjectConstructionSessionSchema.nullable(),
  projectConstructionHistory: z.array(z.object({
    inputId: z.string(), resultId: z.string(), resultDigest: z.string(), decisionRecordIds: z.array(z.string()), invalidatedReason: z.string(),
  }).strict()),
}).passthrough();

const makeId = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `session-${Date.now()}`;

export const createProtocolDesignerSession = (now = new Date().toISOString()): ProtocolDesignerSession => ({
  sessionSchemaVersion: INTAKE_SESSION_SCHEMA_VERSION,
  fixtureSetVersion: INTAKE_FIXTURE_SET_VERSION,
  sessionId: makeId(), createdAt: now, updatedAt: now,
  interfaceState: "IDLE", currentStep: 0, originalQuestion: "", validatedIntent: null,
  scenarioMatches: [], confirmedScenarioId: null, secondaryScenarioIds: [], adaptiveAnswers: [], decision: null,
  reportStatus: "NONE", invalidatedDownstream: [],
  scientificContext: {
    routeIntent: null, routeConfidence: "UNKNOWN", routeReasons: [], centralScientificObject: "",
    preservedScientificTerms: [], detectedRelationships: [], workingHypotheses: [], missingInformation: [],
    contextVersion: 0, transitions: [], currentProjectStage: 1, activeDesignSurface: "IMAGING",
  },
  scientificThinking: null,
  scientificThinkingHistory: [],
  imagingDesign: null,
  imagingDesignHistory: [],
  projectConstruction: null,
  projectConstructionHistory: [],
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
  scientificThinkingHistory: session.scientificThinking ? [...session.scientificThinkingHistory, {
    outputId: session.scientificThinking.output.outputId,
    outputDigest: session.scientificThinking.output.outputDigest,
    decisionRecordIds: session.scientificThinking.decisionHistory.map((item) => item.decisionId),
    invalidatedReason: reason,
  }] : session.scientificThinkingHistory,
  scientificThinking: null,
  imagingDesignHistory: session.imagingDesign ? [...session.imagingDesignHistory, {
    inputId: session.imagingDesign.input.inputId,
    resultId: session.imagingDesign.result.resultId,
    resultDigest: session.imagingDesign.result.resultDigest,
    decisionRecordIds: session.imagingDesign.decisionHistory.map((item) => item.decisionId),
    invalidatedReason: reason,
  }] : session.imagingDesignHistory,
  imagingDesign: null,
  projectConstructionHistory: session.projectConstruction ? [...session.projectConstructionHistory, {
    inputId: session.projectConstruction.input.inputId,
    resultId: session.projectConstruction.result.resultId,
    resultDigest: session.projectConstruction.result.resultDigest,
    decisionRecordIds: session.projectConstruction.decisionHistory.map((item) => item.decisionId),
    invalidatedReason: reason,
  }] : session.projectConstructionHistory,
  projectConstruction: null,
  scientificContext: { ...session.scientificContext, activeDesignSurface: "IMAGING" },
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
