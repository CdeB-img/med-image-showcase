import type { V1ScientificInterpretationProjection } from "@/features/scientific-interpretation";
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
): ProtocolDesignerSession => {
  const base = createProtocolDesignerSession(now);
  const validatedIntent = projection.validatedIntent;
  const scientificContext = structuredClone(projection.scientificSessionContext);
  return {
    ...base,
    originalQuestion: validatedIntent.originalQuestion,
    validatedIntent: structuredClone(validatedIntent),
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
