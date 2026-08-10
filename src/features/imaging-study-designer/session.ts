import { logicalDigest } from "@/features/knowledge-engine/canonical";
import {
  createHumanDecisionCandidate,
  engageHumanDecision,
  engagingStatusForGateDecision,
  reopenHumanDecision,
} from "@/features/protocol-designer/human-decision";
import { propagateImagingImpact, type ImagingChangeRequest } from "./change";
import { executeImagingStudyDesigner } from "./engine";
import type { HumanReviewState, ImagingDesignInput, ImagingDesignSession } from "./types";

const controlsFrom = (session: ImagingDesignSession) => ({
  ...session.controls,
  decisionRecordIds: session.decisionHistory.map((item) => item.decisionId),
  decisionRecords: session.decisionHistory,
  handoffDecisionRecordId: [...session.decisionHistory].reverse().find((item) => item.gateId === "IMG-GATE-HANDOFF-FREEZE" && item.status === "ADOPTED")?.decisionId ?? null,
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

export const createImagingDesignSession = (input: ImagingDesignInput): ImagingDesignSession => {
  const result = executeImagingStudyDesigner(input);
  return {
    input,
    result,
    controls: {},
    decisionHistory: result.decisionsRequired.map((gate) => createHumanDecisionCandidate({
      decisionId: `imaging-decision:${logicalDigest({ inputId: input.inputId, gateId: gate.gateId })}`,
      gateId: gate.gateId,
      scope: [gate.type, ...gate.targetIds],
      targets: gate.targetIds,
      reason: gate.reason,
      provenance: [input.inputId, result.resultId],
      engineSource: "IMAGING",
      projectVersion: input.strategyVersion,
    })),
    handoffHistory: [],
    revisions: 1,
  };
};

export const reviewImagingCandidate = (
  session: ImagingDesignSession,
  category: "phenomenon" | "biomarker" | "modality" | "acquisition" | "analysis",
  candidateId: string,
  state: HumanReviewState,
  actor: string | null = null,
  mandate: string | null = null,
  now = new Date().toISOString(),
): ImagingDesignSession => {
  if (state === "PENDING") return session;
  actor = actor?.trim() || session.controls.decisionAuthority?.actor || null;
  mandate = mandate?.trim() || session.controls.decisionAuthority?.mandate || null;
  const gateId = `IMG-REVIEW-${category.toUpperCase()}`;
  const decisionId = `imaging-decision:${logicalDigest({ inputId: session.input.inputId, gateId, candidateId })}`;
  const prior = [...session.decisionHistory].reverse().find((item) => item.decisionId === decisionId);
  const fresh = createHumanDecisionCandidate({
    decisionId, gateId, scope: [category, candidateId], targets: [candidateId],
    reason: `Revue humaine du candidat Imaging ${category}.`, provenance: [session.input.inputId, session.result.resultId],
    engineSource: "IMAGING", projectVersion: session.input.strategyVersion,
  });
  const candidate = prior && ["ADOPTED", "REJECTED", "DEFERRED"].includes(prior.status)
    ? reopenHumanDecision(prior, {
      actor, mandate, reason: `Réexamen du candidat Imaging ${category}.`, timestamp: now,
      impact: { affectedObjects: [candidateId], affectedEngines: ["IMAGING", "RESEARCH_PROJECT", "DOCUMENT"], reopenedGates: [gateId], obsoleteProjections: ["DOWNSTREAM_CANDIDATE_PROJECTIONS"] },
    })
    : prior ?? fresh;
  const record = engageHumanDecision(candidate, { status: state === "ADOPTED" ? "ADOPTED" : "REJECTED", actor, mandate, timestamp: now });
  const history = [...session.decisionHistory.filter((item) => !(item.decisionId === record.decisionId && item.version === record.version)), record];
  if (!["ADOPTED", "REJECTED"].includes(record.status)) return { ...session, decisionHistory: history };
  const key = `${category}Reviews` as const;
  return rebuild({ ...session, decisionHistory: history, controls: { ...session.controls, [key]: { ...(session.controls[key] ?? {}), [candidateId]: state } } });
};

export const answerImagingQuestion = (session: ImagingDesignSession, questionId: string, answer: string): ImagingDesignSession => rebuild({
  ...session,
  controls: { ...session.controls, answers: { ...(session.controls.answers ?? {}), [questionId]: answer } },
});

export const setImagingDecisionAuthority = (session: ImagingDesignSession, actor: string, mandate: string): ImagingDesignSession => ({
  ...session,
  controls: { ...session.controls, decisionAuthority: actor.trim() && mandate.trim() ? { actor: actor.trim(), mandate: mandate.trim() } : null },
});

export const decideImagingGate = (
  session: ImagingDesignSession,
  gateId: string,
  decision: "APPROVED" | "REJECTED",
  reason: string,
  actor: string | null = null,
  mandate: string | null = null,
  now = new Date().toISOString(),
): ImagingDesignSession => {
  actor = actor?.trim() || session.controls.decisionAuthority?.actor || null;
  mandate = mandate?.trim() || session.controls.decisionAuthority?.mandate || null;
  const gate = session.result.decisionsRequired.find((item) => item.gateId === gateId);
  if (!gate || !reason.trim() || gateId === "IMG-GATE-HANDOFF-FREEZE" && session.result.projectConstructionHandoff.status !== "READY_FOR_HUMAN_FREEZE") return session;
  const prior = [...session.decisionHistory].reverse().find((item) => item.gateId === gateId);
  const fresh = createHumanDecisionCandidate({
      decisionId: `imaging-decision:${logicalDigest({ inputId: session.input.inputId, gateId })}`,
      gateId, scope: [gate.type, ...gate.targetIds], targets: gate.targetIds, reason,
      provenance: [session.input.inputId, session.result.resultId], engineSource: "IMAGING", projectVersion: session.input.strategyVersion,
    });
  const candidate = prior && ["ADOPTED", "REJECTED", "DEFERRED"].includes(prior.status)
    ? reopenHumanDecision(prior, {
      actor, mandate, reason: `Réexamen de ${gateId}.`, timestamp: now,
      impact: { affectedObjects: gate.targetIds, affectedEngines: ["IMAGING", "RESEARCH_PROJECT", "DOCUMENT"], reopenedGates: [gateId], obsoleteProjections: ["DOWNSTREAM_CANDIDATE_PROJECTIONS"] },
    })
    : prior ?? fresh;
  const record = engageHumanDecision({ ...candidate, scope: [...new Set([gate.type, ...gate.targetIds])], targets: gate.targetIds }, {
    status: engagingStatusForGateDecision(decision), actor, mandate, reason, timestamp: now,
  });
  const history = [...session.decisionHistory.filter((item) => !(item.decisionId === record.decisionId && item.version === record.version)), record];
  if (!["ADOPTED", "REJECTED"].includes(record.status)) return { ...session, decisionHistory: history };
  return rebuild({
    ...session,
    controls: { ...session.controls, gateStatuses: { ...(session.controls.gateStatuses ?? {}), [gateId]: decision } },
    decisionHistory: history,
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

export const decideImagingChange = (
  session: ImagingDesignSession,
  changeId: string,
  decision: "CONFIRMED" | "REJECTED",
  actor: string | null = null,
  mandate: string | null = null,
  now = new Date().toISOString(),
): ImagingDesignSession => {
  actor = actor?.trim() || session.controls.decisionAuthority?.actor || null;
  mandate = mandate?.trim() || session.controls.decisionAuthority?.mandate || null;
  if (decision === "REJECTED") return rebuild({ ...session, controls: {
    ...session.controls,
    changes: (session.controls.changes ?? []).map((item) => item.changeId === changeId ? { ...item, status: decision } : item),
    impacts: (session.controls.impacts ?? []).map((item) => item.changeId === changeId ? { ...item, state: "PRESERVED" as const, reason: "Changement majeur rejeté ; état antérieur préservé." } : item),
  } });
  const impactedGateIds = ["IMG-GATE-ACQUISITION", "IMG-GATE-MULTICENTER", "IMG-GATE-HANDOFF-FREEZE"];
  const prior = session.decisionHistory.filter((item) => impactedGateIds.includes(item.gateId) && ["ADOPTED", "REJECTED"].includes(item.status));
  const impactItems = (session.controls.impacts ?? []).filter((item) => item.changeId === changeId && item.state === "REVIEW_REQUIRED");
  const reopened = prior.map((item) => reopenHumanDecision(item, {
    actor, mandate, reason: `Réouverture provoquée par ${changeId}.`, timestamp: now,
    impact: {
      affectedObjects: [...new Set(impactItems.map((impact) => impact.targetId))],
      affectedEngines: ["IMAGING", "RESEARCH_PROJECT", "DOCUMENT"],
      reopenedGates: impactedGateIds,
      obsoleteProjections: ["CURRENT_PROJECT_HANDOFF", "CURRENT_DOCUMENT_PROJECTIONS"],
    },
  }));
  const engaging = prior.length === 0 ? Boolean(actor?.trim() && mandate?.trim()) : reopened.every((item) => item.status === "REOPENED");
  if (!engaging) return { ...session, decisionHistory: [...session.decisionHistory, ...reopened] };
  return rebuild({ ...session, decisionHistory: [...session.decisionHistory, ...reopened], controls: {
      ...session.controls,
    gateStatuses: Object.fromEntries(Object.entries(session.controls.gateStatuses ?? {}).map(([gateId, status]) => [gateId, impactedGateIds.includes(gateId) ? "PENDING" : status])),
    changes: (session.controls.changes ?? []).map((item) => item.changeId === changeId ? { ...item, status: decision } : item),
    impacts: session.controls.impacts,
  },
  });
};
