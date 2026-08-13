import { createEmptyInterpretation } from "@/features/protocol-designer/intake/schema";
import type { ConfidenceLevel, EvidenceOrigin, HumanFieldReview, InterpretedFieldKey, RoutingIntent, ScientificSessionContext, ValidatedScientificIntent } from "@/features/protocol-designer/intake/types";
import { activeSemanticElements } from "./canonical";
import type { ScientificSemanticModel, SemanticElement, SemanticElementType } from "./types";

const fieldMap: Partial<Record<SemanticElementType, InterpretedFieldKey>> = {
  SCIENTIFIC_INTENT: "scientificPurpose",
  OPERATION: "scientificPurpose",
  ANATOMICAL_CONTEXT: "clinicalContext",
  CONDITION: "pathologyOrCondition",
  POPULATION: "population",
  SCIENTIFIC_OBJECT: "phenomenaOfInterest",
  PHENOMENON: "phenomenaOfInterest",
  INTERVENTION: "interventionsOrGroups",
  COMPARATOR: "interventionsOrGroups",
  ENDPOINT: "outcomesMentioned",
  OUTCOME: "outcomesMentioned",
  STUDY_DESIGN: "studyDesign",
  MODALITY: "availableEquipment",
  METHOD: "availableEquipment",
  CONSTRAINT: "constraints",
  TIMING: "declaredTimings",
};

const confidence = (value: number): ConfidenceLevel => value >= 0.85 ? "HIGH" : value >= 0.6 ? "MEDIUM" : value > 0 ? "LOW" : "UNKNOWN";
const origin = (elements: SemanticElement[]): EvidenceOrigin => elements.every((item) => item.epistemicStatus === "EXPLICIT_USER_STATED")
  ? "EXPLICIT_USER_STATEMENT"
  : elements.every((item) => item.epistemicStatus === "CONFIRMED_BY_USER") ? "NORMALIZED_FROM_USER_TERM" : "TENTATIVE_INTERPRETATION";
const downstreamEligible = (element: SemanticElement) => ["EXPLICIT_USER_STATED", "CONFIRMED_BY_USER"].includes(element.epistemicStatus);

export const semanticModelToValidatedIntent = (model: ScientificSemanticModel): ValidatedScientificIntent => {
  if (model.status !== "ACCEPTED") throw new Error("SEMANTIC_MODEL_NOT_ACCEPTED_FOR_DOWNSTREAM");
  const interpretation = createEmptyInterpretation({ question: model.originalRequest, language: "fr", schemaVersion: "1.0" });
  interpretation.reformulatedQuestion = model.normalizedMeaning;
  const grouped = new Map<InterpretedFieldKey, SemanticElement[]>();
  activeSemanticElements(model).filter(downstreamEligible).forEach((element) => {
    const key = fieldMap[element.type];
    if (!key) return;
    grouped.set(key, [...(grouped.get(key) ?? []), element]);
  });
  const reviews: Partial<Record<InterpretedFieldKey, HumanFieldReview>> = {};
  grouped.forEach((elements, key) => {
    const value = [...new Set(elements.map((item) => item.canonicalMeaning))];
    const field = {
      value,
      origin: origin(elements),
      confidence: confidence(Math.min(...elements.map((item) => item.confidence))),
      sourceText: elements.length === 1 ? elements[0].sourceSpan?.text : undefined,
      userValidated: true,
    };
    if (key === "userExpertise") return;
    (interpretation as unknown as Record<string, unknown>)[key] = field;
    reviews[key] = { state: "CONFIRMED", reviewedAt: model.acceptedAt ?? model.updatedAt };
  });
  interpretation.termsNeedingClarification = model.ambiguities;
  interpretation.missingInformation = [...new Set([...model.missingConcepts, ...model.unknowns])];
  interpretation.contradictions = model.contradictions;
  interpretation.unsupportedInferences = model.elements.filter((item) => item.epistemicStatus === "UNSUPPORTED_CANDIDATE").map((item) => item.canonicalMeaning);
  return {
    schemaVersion: "1.0",
    originalQuestion: model.originalRequest,
    validatedReformulation: model.normalizedMeaning,
    language: "fr",
    interpretation,
    reviews,
    ambiguityResolutions: Object.fromEntries(model.ambiguities.map((item) => [item, "Conservée comme ambiguïté active dans le snapshot SEM-001."])),
    contradictionResolutions: Object.fromEntries(model.contradictions.map((item) => [item, "KEPT_FOR_HUMAN_REVIEW" as const])),
    confirmedAt: model.acceptedAt,
    semanticSnapshot: {
      semanticModelId: model.semanticModelId,
      semanticModelVersion: model.semanticModelVersion,
      semanticModelRevision: model.revision,
      semanticModelDigest: model.digest,
      provider: model.executionSnapshot?.provider ?? "UNAVAILABLE",
      model: model.executionSnapshot?.model ?? "UNAVAILABLE",
      promptVersion: model.executionSnapshot?.reconstructionPromptVersion ?? "UNAVAILABLE",
      schemaVersion: model.executionSnapshot?.schemaVersion ?? "SEM-001-1.1",
    },
  };
};

const routeMap: Record<ScientificSemanticModel["routeProposal"]["route"], RoutingIntent> = {
  UNDERSTAND: "UNDERSTAND",
  FORMALIZE_IDEA: "FORMALIZE_IDEA",
  DESIGN_STUDY: "DESIGN_STUDY",
  DOCUMENT: "DOCUMENT",
  REVIEW_REROUTE: "FORMALIZE_IDEA",
};

export const semanticModelToScientificSessionContext = (model: ScientificSemanticModel, previous?: ScientificSessionContext): ScientificSessionContext => {
  const active = activeSemanticElements(model).filter(downstreamEligible);
  const central = active.find((item) => item.type === "SCIENTIFIC_OBJECT")
    ?? active.find((item) => item.type === "PHENOMENON")
    ?? active.find((item) => item.type === "CONDITION")
    ?? active[0];
  const relationLabels = model.relations.filter((item) => item.epistemicStatus !== "REJECTED_BY_USER").map((relation) => {
    const source = model.elements.find((item) => item.semanticElementId === relation.sourceElementId)?.canonicalMeaning ?? relation.sourceElementId;
    const target = model.elements.find((item) => item.semanticElementId === relation.targetElementId)?.canonicalMeaning ?? relation.targetElementId;
    return `${source} ${relation.relationType} ${target}`;
  });
  return {
    routeIntent: routeMap[model.routeProposal.route],
    routeConfidence: confidence(model.routeProposal.confidence),
    routeReasons: [model.routeProposal.reason],
    centralScientificObject: central?.canonicalMeaning ?? model.normalizedMeaning,
    preservedScientificTerms: [...new Set(active.filter((item) => ["SCIENTIFIC_OBJECT", "PHENOMENON", "CONDITION", "BIOMARKER", "MODALITY", "METHOD", "INTERVENTION", "COMPARATOR"].includes(item.type)).map((item) => item.canonicalMeaning))],
    detectedRelationships: relationLabels,
    workingHypotheses: active.filter((item) => ["ASSUMPTION", "EXPECTED_DIRECTION"].includes(item.type)).map((item) => item.canonicalMeaning),
    missingInformation: [...new Set([...model.missingConcepts, ...model.unknowns])],
    contextVersion: (previous?.contextVersion ?? 0) + 1,
    transitions: previous?.transitions ?? [],
    currentProjectStage: previous?.currentProjectStage ?? 1,
    activeDesignSurface: previous?.activeDesignSurface ?? "SCIENTIFIC_THINKING",
  };
};
