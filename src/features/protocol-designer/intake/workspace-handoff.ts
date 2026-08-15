import type { V1ScientificInterpretationProjection } from "@/features/scientific-interpretation";
import type { ConversationalTypedSemanticHandoff } from "@/features/protocol-designer/conversation/ConversationalHandoffRouter";
import { matchScenarios } from "./scenarios.js";
import { createProtocolDesignerSession } from "./session.js";
import type { ProtocolDesignerSession } from "./types.js";

export type ProtocolDesignerWorkspaceTransitionState =
  | "NOT_REQUESTED"
  | "MISSING_CONFIRMED_UNDERSTANDING"
  | "ORIENTATION_REQUIRED"
  | "SCIENTIFIC_SURFACE_READY"
  | "PROJECT_CONSTRUCTION_PENDING"
  | "PROJECT_WORKSPACE_READY";

/**
 * Creates the versioned Protocol Designer handoff state without constructing or
 * adopting Project truth. A route-less Contribution stays at the explicit
 * orientation boundary instead of entering an unrenderable workspace step.
 */
export const createProtocolDesignerWorkspaceHandoff = (
  projection: Readonly<V1ScientificInterpretationProjection>,
  now = new Date().toISOString(),
  typedHandoff?: Readonly<ConversationalTypedSemanticHandoff>,
): ProtocolDesignerSession => {
  const base = createProtocolDesignerSession(now);
  const validatedIntent = structuredClone(projection.validatedIntent);
  const scientificContext = structuredClone(projection.scientificSessionContext);
  if (typedHandoff) {
    const activeConfirmed = typedHandoff.scientificElements.filter((item) => item.activeState !== false
      && ["EXPLICIT_USER_STATED", "CONFIRMED_BY_USER"].includes(item.epistemicStatus ?? ""));
    const valuesFor = (...semanticKinds: ConversationalTypedSemanticHandoff["scientificElements"][number]["semanticKind"][]) => [
      ...new Set(activeConfirmed.filter((item) => semanticKinds.includes(item.semanticKind)).map((item) => item.content.trim()).filter(Boolean)),
    ];
    const addValues = (fieldKey: "availableEquipment" | "outcomesMentioned", values: string[]) => {
      if (!values.length) return;
      const field = validatedIntent.interpretation[fieldKey];
      validatedIntent.interpretation[fieldKey] = {
        ...field,
        value: [...new Set([...(field.value ?? []), ...values])],
        origin: field.origin === "NOT_PROVIDED" ? "EXPLICIT_USER_STATEMENT" : field.origin,
        confidence: field.confidence === "UNKNOWN" ? "HIGH" : field.confidence,
        userValidated: true,
      };
      validatedIntent.reviews[fieldKey] = { state: "CONFIRMED", reviewedAt: now };
    };
    addValues("availableEquipment", valuesFor("IMAGING_MODALITY", "IMAGING_METHOD"));
    addValues("outcomesMentioned", valuesFor("BIOLOGICAL_MEASUREMENT", "QUANTITATIVE_TARGET", "OUTCOME"));
    scientificContext.preservedScientificTerms = [...new Set([
      ...scientificContext.preservedScientificTerms,
      ...activeConfirmed.map((item) => item.content),
    ])];
    if (scientificContext.interpretationTrace) scientificContext.interpretationTrace = {
      ...scientificContext.interpretationTrace,
      contributionId: typedHandoff.contributionRef,
      unknowns: [...new Set([...scientificContext.interpretationTrace.unknowns, ...typedHandoff.unknownRefs])],
      corrections: [...new Set([...scientificContext.interpretationTrace.corrections, ...typedHandoff.correctionRefs])],
      provenanceRefs: [...new Set([...scientificContext.interpretationTrace.provenanceRefs, ...typedHandoff.provenanceRefs])],
    };
  }
  return {
    ...base,
    originalQuestion: validatedIntent.originalQuestion,
    validatedIntent,
    scenarioMatches: matchScenarios(validatedIntent),
    scientificContext,
    interfaceState: "INTERPRETATION_CONFIRMED",
    currentStep: scientificContext.routeIntent ? 3 : 2,
    updatedAt: now,
  };
};

export const inspectProtocolDesignerWorkspaceTransition = (
  session: Readonly<ProtocolDesignerSession>,
): ProtocolDesignerWorkspaceTransitionState => {
  if (session.currentStep !== 3) return "NOT_REQUESTED";
  if (!session.validatedIntent) return "MISSING_CONFIRMED_UNDERSTANDING";
  if (!session.scientificContext.routeIntent) return "ORIENTATION_REQUIRED";
  if (session.scientificContext.routeIntent !== "DESIGN_STUDY") return "SCIENTIFIC_SURFACE_READY";
  if (session.scientificContext.activeDesignSurface !== "PROJECT_CONSTRUCTION") return "SCIENTIFIC_SURFACE_READY";
  return session.projectConstruction ? "PROJECT_WORKSPACE_READY" : "PROJECT_CONSTRUCTION_PENDING";
};
