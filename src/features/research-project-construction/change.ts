import { logicalDigest, uniqueSorted } from "@/features/knowledge-engine/canonical";
import type { ProjectChange, ProjectChangeEvent, ProjectImpact, ProjectImpactState } from "./types";

export type ProjectChangeRequest = {
  eventType: ProjectChangeEvent;
  description: string;
  sourceIds: string[];
  targetIds?: string[];
};

type InventoryItem = { targetId: string; targetType: string };

const impactByEvent: Record<ProjectChangeEvent, Record<string, ProjectImpactState>> = {
  PopulationChanged: { POPULATION: "INVALIDATED", STUDY_DESIGN: "REVIEW_REQUIRED", GROUP: "REVIEW_REQUIRED", VISIT: "REVIEW_REQUIRED", VARIABLE: "REVIEW_REQUIRED", ENDPOINT: "REVIEW_REQUIRED", ANALYSIS_REQUIREMENT: "REVIEW_REQUIRED", SIZING: "NEWLY_REQUIRED", FEASIBILITY: "REVIEW_REQUIRED", PROJECTION: "OBSOLETE" },
  StudyDesignChanged: { STUDY_DESIGN: "INVALIDATED", GROUP: "REVIEW_REQUIRED", VISIT: "REVIEW_REQUIRED", ENDPOINT: "REVIEW_REQUIRED", ANALYSIS_REQUIREMENT: "INVALIDATED", SIZING: "NEWLY_REQUIRED", FEASIBILITY: "REVIEW_REQUIRED", PROJECTION: "OBSOLETE" },
  GroupChanged: { GROUP: "INVALIDATED", VISIT: "REVIEW_REQUIRED", ENDPOINT: "REVIEW_REQUIRED", ANALYSIS_REQUIREMENT: "REVIEW_REQUIRED", SIZING: "NEWLY_REQUIRED", DATA: "REVIEW_REQUIRED", PROJECTION: "OBSOLETE" },
  VisitChanged: { VISIT: "INVALIDATED", VARIABLE: "REVIEW_REQUIRED", ENDPOINT: "REVIEW_REQUIRED", ANALYSIS_REQUIREMENT: "REVIEW_REQUIRED", DATA: "REVIEW_REQUIRED", PROJECTION: "OBSOLETE" },
  EndpointChanged: { ENDPOINT: "INVALIDATED", VARIABLE: "REVIEW_REQUIRED", VISIT: "REVIEW_REQUIRED", IMAGING: "REVIEW_REQUIRED", ANALYSIS_REQUIREMENT: "INVALIDATED", SIZING: "NEWLY_REQUIRED", DATA: "REVIEW_REQUIRED", PROJECTION: "OBSOLETE" },
  VariableChanged: { VARIABLE: "INVALIDATED", ENDPOINT: "REVIEW_REQUIRED", VISIT: "REVIEW_REQUIRED", ANALYSIS_REQUIREMENT: "REVIEW_REQUIRED", SIZING: "NEWLY_REQUIRED", DATA: "REVIEW_REQUIRED", PROJECTION: "OBSOLETE" },
  TimingChanged: { TEMPORAL: "INVALIDATED", VISIT: "REVIEW_REQUIRED", VARIABLE: "REVIEW_REQUIRED", ENDPOINT: "REVIEW_REQUIRED", ANALYSIS_REQUIREMENT: "REVIEW_REQUIRED", PROJECTION: "OBSOLETE" },
  ImagingStrategyChanged: { IMAGING: "INVALIDATED", VISIT: "REVIEW_REQUIRED", VARIABLE: "REVIEW_REQUIRED", ENDPOINT: "REVIEW_REQUIRED", ANALYSIS_REQUIREMENT: "REVIEW_REQUIRED", DATA: "REVIEW_REQUIRED", PROJECTION: "OBSOLETE" },
  ConstraintChanged: { CONSTRAINT: "INVALIDATED", STUDY_DESIGN: "REVIEW_REQUIRED", GROUP: "REVIEW_REQUIRED", VISIT: "REVIEW_REQUIRED", FEASIBILITY: "REVIEW_REQUIRED", RISK: "REVIEW_REQUIRED", PROJECTION: "OBSOLETE" },
  KnowledgeUpdated: { KNOWLEDGE: "INVALIDATED", POPULATION: "REVIEW_REQUIRED", STUDY_DESIGN: "REVIEW_REQUIRED", VARIABLE: "REVIEW_REQUIRED", ENDPOINT: "REVIEW_REQUIRED", RISK: "REVIEW_REQUIRED", PROJECTION: "OBSOLETE" },
  DecisionReopened: { DECISION: "INVALIDATED", STUDY_DESIGN: "REVIEW_REQUIRED", POPULATION: "REVIEW_REQUIRED", GROUP: "REVIEW_REQUIRED", ENDPOINT: "REVIEW_REQUIRED", PROJECTION: "OBSOLETE" },
};

export const propagateProjectImpact = (request: ProjectChangeRequest, inventory: InventoryItem[]) => {
  const sourceIds = uniqueSorted(request.sourceIds);
  const targetIds = uniqueSorted(request.targetIds ?? []);
  const changeId = `project-change:${request.eventType}:${logicalDigest({ description: request.description, sourceIds, targetIds })}`;
  const change: ProjectChange = { changeId, eventType: request.eventType, kind: "MAJOR", description: request.description, sourceIds, targetIds, status: "PENDING_CONFIRMATION", requiresHumanConfirmation: true };
  const map = impactByEvent[request.eventType];
  const impacts: ProjectImpact[] = inventory.map((item) => {
    const explicitlyTargeted = targetIds.includes(item.targetId);
    const state = explicitlyTargeted ? "INVALIDATED" : map[item.targetType] ?? "UNAFFECTED_DEMONSTRATED";
    return {
      impactId: `project-impact:${logicalDigest({ changeId, targetId: item.targetId, state })}`,
      changeId,
      targetId: item.targetId,
      targetType: item.targetType,
      state,
      reason: explicitlyTargeted
        ? "Objet explicitement visé par le changement majeur."
        : state === "UNAFFECTED_DEMONSTRATED"
          ? "Aucun chemin de dépendance applicable n’a été identifié dans la projection runtime."
          : `${request.eventType} atteint ce type d’objet par le graphe de dépendances du projet.`,
    };
  });
  return { change, impacts };
};
