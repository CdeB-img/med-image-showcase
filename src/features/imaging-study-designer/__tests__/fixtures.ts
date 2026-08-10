import { executeKnowledgeEngine } from "@/features/knowledge-engine";
import { createEmptyInterpretation } from "@/features/protocol-designer/intake/schema";
import { buildValidatedIntent } from "@/features/protocol-designer/intake/session";
import type { HumanFieldReview, InterpretedFieldKey, ScientificIntakeInterpretation, ValidatedScientificIntent } from "@/features/protocol-designer/intake/types";
import { buildScientificThinkingInput } from "@/features/scientific-thinking/input";
import { authorizeResearchDesignHandoff, createScientificThinkingSession, reviewScientificHypothesis, reviewScientificObjective, selectScientificQuestion } from "@/features/scientific-thinking/session";
import { buildImagingDesignInput } from "../input";
import type { ImagingDesignInput } from "../types";

const FIXED_TIME = "2026-08-09T10:00:00.000Z";

type IntentOptions = {
  question?: string;
  terms?: string[];
  phenomena?: string[];
  pathology?: string[];
  population?: string[];
  outcomes?: string[];
  equipment?: string[];
  fields?: string[];
  manufacturers?: string[];
  models?: string[];
  versions?: string[];
  centers?: string[];
  timings?: string[];
  constraints?: string[];
  safetyFlags?: string[];
};

const explicit = (value: string[]) => ({ value, origin: "EXPLICIT_USER_STATEMENT" as const, confidence: "HIGH" as const, sourceText: value.join(", "), userValidated: true });

export const makeImagingIntent = (options: IntentOptions = {}): { intent: ValidatedScientificIntent; terms: string[] } => {
  const question = options.question ?? "Comparer l’ECV et le T1 natif pour examiner la fibrose myocardique en IRM.";
  const terms = options.terms ?? ["fibrose myocardique", "ECV", "T1 natif", "IRM"];
  const interpretation = createEmptyInterpretation({ question, language: "fr", schemaVersion: "1.0" });
  interpretation.reformulatedQuestion = question;
  const values: Partial<Record<InterpretedFieldKey, string[]>> = {
    scientificDomain: ["imagerie médicale"],
    scientificPurpose: ["comparer des mesures pour examiner un phénomène"],
    phenomenaOfInterest: options.phenomena ?? ["fibrose myocardique"],
    pathologyOrCondition: options.pathology ?? [],
    population: options.population ?? ["population de recherche à préciser"],
    outcomesMentioned: options.outcomes ?? ["caractérisation de la fibrose myocardique"],
    availableEquipment: options.equipment ?? ["IRM"],
    fieldStrengths: options.fields ?? [],
    manufacturers: options.manufacturers ?? [],
    models: options.models ?? [],
    softwareVersions: options.versions ?? [],
    centers: options.centers ?? ["un centre"],
    declaredTimings: options.timings ?? [],
    constraints: options.constraints ?? [],
  };
  const reviews: Partial<Record<InterpretedFieldKey, HumanFieldReview>> = {};
  Object.entries(values).forEach(([key, value]) => {
    if (!value?.length) return;
    (interpretation[key as InterpretedFieldKey] as ScientificIntakeInterpretation[InterpretedFieldKey]) = explicit(value) as never;
    reviews[key as InterpretedFieldKey] = { state: "CONFIRMED", reviewedAt: FIXED_TIME };
  });
  interpretation.safetyFlags = options.safetyFlags ?? [];
  const intent = buildValidatedIntent(interpretation, reviews, question, FIXED_TIME);
  return { intent, terms };
};

const authorizeThinking = (intent: ValidatedScientificIntent, terms: string[], knowledge: ReturnType<typeof executeKnowledgeEngine>) => {
  const input = buildScientificThinkingInput(intent, terms, ["relation scientifique à examiner"], knowledge, { sessionId: "IMG-TEST-SESSION", contextVersion: 1, sourceJourney: "FORMALIZE_IDEA" });
  let session = createScientificThinkingSession(input);
  session = selectScientificQuestion(session, "ST-Q-001", "Responsable scientifique", "mandate:img-fixture", FIXED_TIME);
  session.output.hypotheses.forEach((item, index) => { session = reviewScientificHypothesis(session, item.hypothesisId, index === 0 ? "ADOPTED" : "REJECTED", "Responsable scientifique", "mandate:img-fixture", FIXED_TIME); });
  const primary = session.output.objectives.find((item) => item.level === "PRIMARY");
  if (primary) session = reviewScientificObjective(session, primary.objectiveId, "ADOPTED", "Responsable scientifique", "mandate:img-fixture", FIXED_TIME);
  return authorizeResearchDesignHandoff(session, "Responsable scientifique", "mandate:img-fixture", FIXED_TIME);
};

export const makeImagingInput = (options: IntentOptions = {}): ImagingDesignInput => {
  const { intent, terms } = makeImagingIntent(options);
  const knowledge = executeKnowledgeEngine({
    originalQuestion: intent.originalQuestion,
    scientificObjectTerms: terms.map((term, index) => ({ term, role: index === 0 ? "SUBJECT" as const : index === 1 ? "COMPARATOR" as const : "CONTEXT" as const })),
    consumer: "IMAGING_STUDY_DESIGNER",
    createdAt: FIXED_TIME,
    strategyVersion: "IMG-TEST-1",
  });
  const thinking = authorizeThinking(intent, terms, knowledge);
  return buildImagingDesignInput(intent, terms, ["relation scientifique à examiner"], knowledge, thinking, { sessionId: "IMG-TEST-SESSION", contextVersion: 1, strategyVersion: "IMG-TEST-1" });
};

export const withInput = (input: ImagingDesignInput, patch: Partial<ImagingDesignInput>): ImagingDesignInput => ({ ...input, ...patch });
