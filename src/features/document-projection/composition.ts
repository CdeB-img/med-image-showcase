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
      mandate: record?.mandateRef ?? null,
      scope: record?.targetIds ?? gate.targetIds,
      version: project.candidateVersion.versionId,
      timestamp: record?.decidedAt ?? null,
      impact: record?.targetIds.length ? `TARGETS:${record.targetIds.join(",")}` : null,
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
    mandate: record.mandateRef,
    scope: record.targetIds,
    version: project.candidateVersion.versionId,
    timestamp: record.decidedAt,
    impact: record.targetIds.length ? `TARGETS:${record.targetIds.join(",")}` : null,
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
