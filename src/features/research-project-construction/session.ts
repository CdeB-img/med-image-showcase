import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { propagateProjectImpact, type ProjectChangeRequest } from "./change";
import { executeResearchProjectConstruction } from "./engine";
import type { EndpointCandidate, ProjectDecisionRecord, ResearchProjectConstructionInput, ResearchProjectConstructionSession } from "./types";

const controlsFrom = (session: ResearchProjectConstructionSession) => ({ ...session.controls, decisionRecordIds: session.decisionHistory.map((item) => item.decisionId) });
const rebuild = (session: ResearchProjectConstructionSession): ResearchProjectConstructionSession => {
  const result = executeResearchProjectConstruction(session.input, controlsFrom(session));
  const versionHistory = result.candidateVersion.status === "FROZEN_BY_HUMAN" && !session.versionHistory.some((item) => item.versionId === result.candidateVersion.versionId)
    ? [...session.versionHistory, result.candidateVersion]
    : session.versionHistory;
  return { ...session, result, versionHistory, revisions: session.revisions + 1 };
};

export const createResearchProjectConstructionSession = (input: ResearchProjectConstructionInput): ResearchProjectConstructionSession => ({ input, result: executeResearchProjectConstruction(input), controls: {}, decisionHistory: [], versionHistory: [], revisions: 1 });

export const answerProjectQuestion = (session: ResearchProjectConstructionSession, questionId: string, answer: string) => session.result.candidateVersion.status === "FROZEN_BY_HUMAN" ? session : rebuild({ ...session, controls: { ...session.controls, answers: { ...(session.controls.answers ?? {}), [questionId]: answer } } });

export const proposeStudyDesign = (session: ResearchProjectConstructionSession, designId: string) => session.result.candidateVersion.status !== "FROZEN_BY_HUMAN" && session.result.studyDesignCandidates.some((item) => item.designId === designId)
  ? rebuild({ ...session, controls: { ...session.controls, selectedDesignId: designId, gateStatuses: { ...(session.controls.gateStatuses ?? {}), "PRJ-GATE-STUDY-DESIGN": "PENDING" } } })
  : session;

export const proposeEndpointRole = (session: ResearchProjectConstructionSession, endpointId: string, role: EndpointCandidate["proposedRole"]) => session.result.candidateVersion.status !== "FROZEN_BY_HUMAN" && session.result.endpointCandidates.some((item) => item.endpointId === endpointId)
  ? rebuild({ ...session, controls: { ...session.controls, endpointRoles: { ...(session.controls.endpointRoles ?? {}), [endpointId]: role }, gateStatuses: { ...(session.controls.gateStatuses ?? {}), "PRJ-GATE-PRIMARY-ENDPOINT": "PENDING" } } })
  : session;

export const decideProjectGate = (
  session: ResearchProjectConstructionSession,
  gateId: string,
  decision: "APPROVED" | "REJECTED",
  reason: string,
  actor: string,
  mandateRef: string | null = null,
  now = new Date().toISOString(),
): ResearchProjectConstructionSession => {
  const gate = session.result.decisionsRequired.find((item) => item.gateId === gateId);
  if (!gate || !reason.trim() || !actor.trim()) return session;
  if (gateId === "PRJ-GATE-STUDY-DESIGN" && decision === "APPROVED" && !session.controls.selectedDesignId) return session;
  if (gateId === "PRJ-GATE-PRIMARY-ENDPOINT" && decision === "APPROVED" && !Object.values(session.controls.endpointRoles ?? {}).includes("PRIMARY_CANDIDATE")) return session;
  const record: ProjectDecisionRecord = {
    decisionId: `project-decision:${logicalDigest({ gateId, decision, targetIds: gate.targetIds, reason, actor, mandateRef, revision: session.revisions })}`,
    gateId, decision, targetIds: gate.targetIds, reason: reason.trim(), actor: actor.trim(), mandateRef, decidedAt: now,
  };
  return rebuild({
    ...session,
    controls: {
      ...session.controls,
      gateStatuses: { ...(session.controls.gateStatuses ?? {}), [gateId]: decision },
      versionDecisionRecordIds: gateId === "PRJ-GATE-DOCUMENT-HANDOFF" ? session.controls.versionDecisionRecordIds : [...(session.controls.versionDecisionRecordIds ?? []), record.decisionId],
      studyDesignDecisionId: gateId === "PRJ-GATE-STUDY-DESIGN" && decision === "APPROVED" ? record.decisionId : session.controls.studyDesignDecisionId,
      frozenVersion: gateId === "PRJ-GATE-FREEZE" && decision === "APPROVED" ? { actor: actor.trim(), mandateRef, frozenAt: now } : session.controls.frozenVersion,
    },
    decisionHistory: [...session.decisionHistory, record],
  });
};

const inventoryFrom = (session: ResearchProjectConstructionSession) => [
  { targetId: session.result.populationDesign.populationId, targetType: "POPULATION" },
  ...session.result.studyDesignCandidates.map((item) => ({ targetId: item.designId, targetType: "STUDY_DESIGN" })),
  ...session.result.groups.map((item) => ({ targetId: item.groupId, targetType: "GROUP" })),
  ...session.result.visits.map((item) => ({ targetId: item.visitId, targetType: "VISIT" })),
  ...session.result.variables.map((item) => ({ targetId: item.variableId, targetType: "VARIABLE" })),
  ...session.result.endpointCandidates.map((item) => ({ targetId: item.endpointId, targetType: "ENDPOINT" })),
  ...session.result.analysisRequirements.map((item) => ({ targetId: item.requirementId, targetType: "ANALYSIS_REQUIREMENT" })),
  ...session.result.feasibilityAssessment.map((item) => ({ targetId: `feasibility:${item.domain}`, targetType: "FEASIBILITY" })),
  ...session.result.projectionReadiness.map((item) => ({ targetId: `projection:${item.projection}`, targetType: "PROJECTION" })),
  { targetId: "project-sizing", targetType: "SIZING" },
  { targetId: "project-data", targetType: "DATA" },
  { targetId: "project-imaging", targetType: "IMAGING" },
  { targetId: "project-temporal", targetType: "TEMPORAL" },
];

export const requestProjectChange = (session: ResearchProjectConstructionSession, request: ProjectChangeRequest) => {
  const propagated = propagateProjectImpact(request, inventoryFrom(session));
  return rebuild({ ...session, controls: { ...session.controls, changes: [...(session.controls.changes ?? []).filter((item) => item.changeId !== propagated.change.changeId), propagated.change], impacts: [...(session.controls.impacts ?? []).filter((item) => item.changeId !== propagated.change.changeId), ...propagated.impacts] } });
};

export const decideProjectChange = (session: ResearchProjectConstructionSession, changeId: string, decision: "CONFIRMED" | "REJECTED") => {
  const change = (session.controls.changes ?? []).find((item) => item.changeId === changeId);
  const gatesByEvent: Partial<Record<NonNullable<typeof change>["eventType"], string[]>> = {
    PopulationChanged: ["PRJ-GATE-POPULATION"],
    StudyDesignChanged: ["PRJ-GATE-STUDY-DESIGN", "PRJ-GATE-GROUPS", "PRJ-GATE-PRIMARY-ENDPOINT"],
    GroupChanged: ["PRJ-GATE-GROUPS", "PRJ-GATE-PRIMARY-ENDPOINT"],
    VisitChanged: ["PRJ-GATE-PRIMARY-ENDPOINT"],
    EndpointChanged: ["PRJ-GATE-PRIMARY-ENDPOINT"],
    VariableChanged: ["PRJ-GATE-PRIMARY-ENDPOINT"],
    TimingChanged: ["PRJ-GATE-PRIMARY-ENDPOINT"],
    ImagingStrategyChanged: ["PRJ-GATE-PRIMARY-ENDPOINT"],
    ConstraintChanged: ["PRJ-GATE-STUDY-DESIGN", "PRJ-GATE-GROUPS"],
    KnowledgeUpdated: ["PRJ-GATE-POPULATION", "PRJ-GATE-STUDY-DESIGN", "PRJ-GATE-PRIMARY-ENDPOINT", "PRJ-GATE-LIMITATIONS"],
    DecisionReopened: ["PRJ-GATE-POPULATION", "PRJ-GATE-STUDY-DESIGN", "PRJ-GATE-GROUPS", "PRJ-GATE-PRIMARY-ENDPOINT"],
  };
  const gateStatuses = { ...(session.controls.gateStatuses ?? {}) };
  if (decision === "CONFIRMED") {
    [...(change ? gatesByEvent[change.eventType] ?? [] : []), "PRJ-GATE-FREEZE", "PRJ-GATE-DOCUMENT-HANDOFF"].forEach((gateId) => { gateStatuses[gateId] = "PENDING"; });
  }
  return rebuild({
    ...session,
    controls: {
      ...session.controls,
      changes: (session.controls.changes ?? []).map((item) => item.changeId === changeId ? { ...item, status: decision } : item),
      impacts: (session.controls.impacts ?? []).map((item) => item.changeId === changeId && decision === "REJECTED" ? { ...item, state: "PRESERVED" as const, reason: "Changement majeur rejeté ; version courante préservée." } : item),
      frozenVersion: decision === "CONFIRMED" ? null : session.controls.frozenVersion,
      priorFrozenVersionId: decision === "CONFIRMED" && session.result.candidateVersion.status === "FROZEN_BY_HUMAN" ? session.result.candidateVersion.versionId : session.controls.priorFrozenVersionId,
      gateStatuses,
    },
  });
};
