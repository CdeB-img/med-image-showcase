import type { ProjectDecisionRecord, ResearchProjectDesignResult } from "@/features/research-project-construction/types";
import { planSections } from "./section-planner";
import type { CompositionPlan, ProjectionPlan } from "./types";

const allHumanDecisions = (project: Readonly<ResearchProjectDesignResult>, records: ReadonlyArray<ProjectDecisionRecord>): CompositionPlan["humanDecisions"] => {
  const latestRecord = new Map<string, ProjectDecisionRecord>();
  records.forEach((record) => latestRecord.set(record.gateId, record));
  const current: CompositionPlan["humanDecisions"] = project.decisionsRequired.map((gate) => {
    const record = latestRecord.get(gate.gateId);
    return {
      decisionId: record?.decisionId ?? `open-decision:${gate.gateId}`,
      gateId: gate.gateId,
      label: gate.label,
      status: gate.status,
      reason: record?.reason ?? gate.reason,
      actor: record?.actor ?? null,
      decidedAt: record?.decidedAt ?? null,
    };
  });
  const currentGateIds = new Set(current.map((item) => item.gateId));
  const historical: CompositionPlan["humanDecisions"] = records.filter((record) => !currentGateIds.has(record.gateId)).map((record) => ({
    decisionId: record.decisionId,
    gateId: record.gateId,
    label: record.gateId,
    status: record.decision,
    reason: record.reason,
    actor: record.actor,
    decidedAt: record.decidedAt,
  }));
  return [...current, ...historical];
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

