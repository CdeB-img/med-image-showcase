import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { propagateImagingImpact, type ImagingChangeRequest } from "./change";
import { executeImagingStudyDesigner } from "./engine";
import type { HumanReviewState, ImagingDesignInput, ImagingDesignSession } from "./types";

const controlsFrom = (session: ImagingDesignSession) => ({
  ...session.controls,
  decisionRecordIds: session.decisionHistory.map((item) => item.decisionId),
  handoffDecisionRecordId: [...session.decisionHistory].reverse().find((item) => item.gateId === "IMG-GATE-HANDOFF-FREEZE" && item.decision === "APPROVED")?.decisionId ?? null,
});

const rebuild = (session: ImagingDesignSession): ImagingDesignSession => {
  const result = executeImagingStudyDesigner(session.input, controlsFrom(session));
  const previousHandoff = session.result.projectConstructionHandoff;
  const preservePrevious = previousHandoff.status === "FROZEN_BY_HUMAN"
    && result.projectConstructionHandoff.status !== "FROZEN_BY_HUMAN"
    && !session.handoffHistory.some((item) => item.imagingStrategyVersion === previousHandoff.imagingStrategyVersion);
  return {
    ...session,
    result,
    handoffHistory: preservePrevious ? [...session.handoffHistory, previousHandoff] : session.handoffHistory,
    revisions: session.revisions + 1,
  };
};

export const createImagingDesignSession = (input: ImagingDesignInput): ImagingDesignSession => ({
  input,
  result: executeImagingStudyDesigner(input),
  controls: {},
  decisionHistory: [],
  handoffHistory: [],
  revisions: 1,
});

export const reviewImagingCandidate = (
  session: ImagingDesignSession,
  category: "phenomenon" | "biomarker" | "modality" | "acquisition" | "analysis",
  candidateId: string,
  state: HumanReviewState,
): ImagingDesignSession => {
  const key = `${category}Reviews` as const;
  return rebuild({ ...session, controls: { ...session.controls, [key]: { ...(session.controls[key] ?? {}), [candidateId]: state } } });
};

export const answerImagingQuestion = (session: ImagingDesignSession, questionId: string, answer: string): ImagingDesignSession => rebuild({
  ...session,
  controls: { ...session.controls, answers: { ...(session.controls.answers ?? {}), [questionId]: answer } },
});

export const decideImagingGate = (
  session: ImagingDesignSession,
  gateId: string,
  decision: "APPROVED" | "REJECTED",
  reason: string,
  now = new Date().toISOString(),
): ImagingDesignSession => {
  const gate = session.result.decisionsRequired.find((item) => item.gateId === gateId);
  if (!gate || !reason.trim() || gateId === "IMG-GATE-HANDOFF-FREEZE" && session.result.projectConstructionHandoff.status !== "READY_FOR_HUMAN_FREEZE") return session;
  const record = {
    decisionId: `imaging-decision:${logicalDigest({ gateId, decision, targetIds: gate.targetIds, reason, revision: session.revisions })}`,
    gateId,
    decision,
    targetIds: gate.targetIds,
    reason: reason.trim(),
    decidedAt: now,
  };
  return rebuild({
    ...session,
    controls: { ...session.controls, gateStatuses: { ...(session.controls.gateStatuses ?? {}), [gateId]: decision } },
    decisionHistory: [...session.decisionHistory, record],
  });
};

const inventoryFrom = (session: ImagingDesignSession) => [
  ...session.result.acquisitionStrategies.map((item) => ({ targetId: item.acquisitionId, targetType: "ACQUISITION" })),
  ...session.result.qualityStrategy.map((item) => ({ targetId: item.ruleId, targetType: "QUALITY_CONTROL" })),
  ...session.result.imageAnalysisStrategy.map((item) => ({ targetId: item.analysisId, targetType: "IMAGE_ANALYSIS" })),
  ...session.result.imagingVariables.map((item) => ({ targetId: item.variableId, targetType: "VARIABLE" })),
  ...session.result.endpointContributions.map((item) => ({ targetId: item.contributionId, targetType: "ENDPOINT_CONTRIBUTION" })),
  { targetId: "IMG-HARMONIZATION", targetType: "HARMONIZATION" },
  { targetId: "IMG-NON-EVALUABILITY", targetType: "NON_EVALUABILITY" },
];

export const requestImagingChange = (session: ImagingDesignSession, request: ImagingChangeRequest): ImagingDesignSession => {
  const propagated = propagateImagingImpact(request, inventoryFrom(session));
  return rebuild({
    ...session,
    controls: {
      ...session.controls,
      changes: [...(session.controls.changes ?? []).filter((item) => item.changeId !== propagated.change.changeId), propagated.change],
      impacts: [...(session.controls.impacts ?? []).filter((item) => item.changeId !== propagated.change.changeId), ...propagated.impacts],
    },
  });
};

export const decideImagingChange = (session: ImagingDesignSession, changeId: string, decision: "CONFIRMED" | "REJECTED"): ImagingDesignSession => rebuild({
  ...session,
  controls: {
    ...session.controls,
    gateStatuses: decision === "CONFIRMED"
      ? Object.fromEntries(Object.entries(session.controls.gateStatuses ?? {}).map(([gateId, status]) => [gateId, ["IMG-GATE-ACQUISITION", "IMG-GATE-MULTICENTER", "IMG-GATE-HANDOFF-FREEZE"].includes(gateId) ? "PENDING" : status]))
      : session.controls.gateStatuses,
    changes: (session.controls.changes ?? []).map((item) => item.changeId === changeId ? { ...item, status: decision } : item),
    impacts: (session.controls.impacts ?? []).map((item) => item.changeId === changeId && decision === "REJECTED" ? { ...item, state: "PRESERVED" as const, reason: "Changement majeur rejeté ; état antérieur préservé." } : item),
  },
});
