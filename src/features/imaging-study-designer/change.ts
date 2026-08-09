import { logicalDigest } from "@/features/knowledge-engine/canonical";
import type { ImagingDesignResult, ImpactState } from "./types";

export const IMAGING_CHANGE_EVENTS = [
  "BiomarkerChanged", "ModalityChanged", "AcquisitionChanged", "EquipmentChanged", "FieldStrengthChanged",
  "SoftwareVersionChanged", "TimingChanged", "QualityRuleChanged", "CoreLabStrategyChanged", "ImageAnalysisChanged", "ImagingEndpointChanged",
] as const;
export type ImagingChangeEventType = (typeof IMAGING_CHANGE_EVENTS)[number];

export type ImagingChangeRequest = {
  eventType: ImagingChangeEventType;
  description: string;
  sourceIds: string[];
  targetIds: string[];
};

const majorEvents = new Set<ImagingChangeEventType>([
  "BiomarkerChanged", "ModalityChanged", "AcquisitionChanged", "EquipmentChanged", "FieldStrengthChanged", "SoftwareVersionChanged", "CoreLabStrategyChanged", "ImagingEndpointChanged",
]);

export const classifyImagingChange = (change: ImagingChangeRequest): "MINOR" | "MAJOR" => majorEvents.has(change.eventType) ? "MAJOR" : "MINOR";

const targetState = (eventType: ImagingChangeEventType, targetType: string): ImpactState => {
  const invalidates: Record<ImagingChangeEventType, Set<string>> = {
    BiomarkerChanged: new Set(["ACQUISITION", "QUALITY_CONTROL", "IMAGE_ANALYSIS", "VARIABLE", "ENDPOINT_CONTRIBUTION"]),
    ModalityChanged: new Set(["ACQUISITION", "EQUIPMENT", "QUALITY_CONTROL", "IMAGE_ANALYSIS", "VARIABLE", "ENDPOINT_CONTRIBUTION"]),
    AcquisitionChanged: new Set(["QUALITY_CONTROL", "IMAGE_ANALYSIS", "VARIABLE", "ENDPOINT_CONTRIBUTION"]),
    EquipmentChanged: new Set(["ACQUISITION", "QUALITY_CONTROL", "HARMONIZATION"]),
    FieldStrengthChanged: new Set(["ACQUISITION", "QUALITY_CONTROL", "HARMONIZATION", "VARIABLE"]),
    SoftwareVersionChanged: new Set(["ACQUISITION", "QUALITY_CONTROL", "IMAGE_ANALYSIS", "VARIABLE"]),
    TimingChanged: new Set(["ACQUISITION", "VARIABLE", "ENDPOINT_CONTRIBUTION"]),
    QualityRuleChanged: new Set(["VARIABLE", "ENDPOINT_CONTRIBUTION", "NON_EVALUABILITY"]),
    CoreLabStrategyChanged: new Set(["QUALITY_CONTROL", "IMAGE_ANALYSIS", "HARMONIZATION"]),
    ImageAnalysisChanged: new Set(["VARIABLE", "ENDPOINT_CONTRIBUTION", "NON_EVALUABILITY"]),
    ImagingEndpointChanged: new Set(["ENDPOINT_CONTRIBUTION", "VARIABLE", "IMAGE_ANALYSIS"]),
  };
  return invalidates[eventType].has(targetType) ? "REVIEW_REQUIRED" : "PRESERVED";
};

export const propagateImagingImpact = (
  change: ImagingChangeRequest,
  inventory: Array<{ targetId: string; targetType: string }>,
): { change: ImagingDesignResult["changes"][number]; impacts: ImagingDesignResult["impacts"] } => {
  const kind = classifyImagingChange(change);
  const changeId = `IMG-CHANGE:${logicalDigest(change)}`;
  return {
    change: {
      changeId,
      kind,
      eventType: change.eventType,
      description: change.description,
      status: kind === "MAJOR" ? "PENDING_CONFIRMATION" : "CONFIRMED",
      requiresHumanConfirmation: kind === "MAJOR",
    },
    impacts: inventory.map((target) => ({
      impactId: `IMG-IMPACT:${logicalDigest({ changeId, ...target })}`,
      changeId,
      targetId: target.targetId,
      targetType: target.targetType,
      state: targetState(change.eventType, target.targetType),
      reason: targetState(change.eventType, target.targetType) === "REVIEW_REQUIRED"
        ? `${change.eventType} rouvre explicitement ce composant aval.`
        : `Aucun chemin d’impact ${change.eventType} n’est démontré pour ce composant.`,
    })),
  };
};
