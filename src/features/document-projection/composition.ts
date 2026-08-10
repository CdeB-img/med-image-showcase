import type { ProjectDecisionRecord, ResearchProjectDesignResult } from "@/features/research-project-construction/types";
import { planSections } from "./section-planner";
import type { CompositionPlan, ProjectionPlan } from "./types";

const allHumanDecisions = (project: Readonly<ResearchProjectDesignResult>, records: ReadonlyArray<ProjectDecisionRecord>): CompositionPlan["humanDecisions"] => {
  void project;
  return records.filter((record, index, all) => all.findIndex((candidate) => candidate.decisionId === record.decisionId && candidate.version === record.version) === index);
};

export const planComposition = (
  project: Readonly<ResearchProjectDesignResult>,
  projectionPlan: ProjectionPlan,
  decisionRecords: ReadonlyArray<ProjectDecisionRecord> = [],
): CompositionPlan => {
  if (projectionPlan.refusal || !projectionPlan.supported) throw new Error("PROJECTION_PLAN_NOT_COMPOSABLE");
  return {
    projectionType: projectionPlan.projectionType,
    sections: planSections(project, projectionPlan.sections),
    sourceProjectId: project.documentHandoff.projectId,
    sourceProjectVersion: project.candidateVersion.versionId,
    sourceProjectDigest: project.resultDigest,
    humanDecisions: allHumanDecisions(project, decisionRecords),
  };
};

export const createCompositionEngine = () => planComposition;
