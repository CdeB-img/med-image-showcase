import { z } from "zod";

export const HUMAN_DECISION_ENVELOPE_VERSION = "1.0" as const;

export const HUMAN_DECISION_STATUSES = [
  "PENDING",
  "INCOMPLETE_FOR_ADOPTION",
  "ADOPTED",
  "REJECTED",
  "DEFERRED",
  "REOPENED",
  "LEGACY_DECISION_IDENTITY_INCOMPLETE",
] as const;

export type HumanDecisionStatus = (typeof HUMAN_DECISION_STATUSES)[number];
export type HumanDecisionEngineSource = "SCIENTIFIC_THINKING" | "IMAGING" | "RESEARCH_PROJECT" | "DOCUMENT";

export type HumanDecisionImpact = {
  affectedObjects: string[];
  affectedEngines: string[];
  reopenedGates: string[];
  obsoleteProjections: string[];
};

export type HumanDecisionEnvelope = {
  envelopeVersion: typeof HUMAN_DECISION_ENVELOPE_VERSION;
  decisionId: string;
  gateId: string;
  actor: string | null;
  mandate: string | null;
  scope: string[];
  status: HumanDecisionStatus;
  version: number;
  timestamp: string | null;
  impact: HumanDecisionImpact;
  targets: string[];
  reason: string | null;
  provenance: string[];
  engineSource: HumanDecisionEngineSource;
  projectVersion: string | null;
};

export const engagingStatusForGateDecision = (decision: "APPROVED" | "REJECTED") => decision === "APPROVED" ? "ADOPTED" as const : "REJECTED" as const;

const stringArray = z.array(z.string().min(1).max(4_000)).max(1_000);
export const humanDecisionEnvelopeSchema = z.object({
  envelopeVersion: z.literal(HUMAN_DECISION_ENVELOPE_VERSION),
  decisionId: z.string().min(1),
  gateId: z.string().min(1),
  actor: z.string().min(1).nullable(),
  mandate: z.string().min(1).nullable(),
  scope: stringArray,
  status: z.enum(HUMAN_DECISION_STATUSES),
  version: z.number().int().positive(),
  timestamp: z.string().min(1).nullable(),
  impact: z.object({
    affectedObjects: stringArray,
    affectedEngines: stringArray,
    reopenedGates: stringArray,
    obsoleteProjections: stringArray,
  }).strict(),
  targets: stringArray,
  reason: z.string().min(1).nullable(),
  provenance: stringArray,
  engineSource: z.enum(["SCIENTIFIC_THINKING", "IMAGING", "RESEARCH_PROJECT", "DOCUMENT"]),
  projectVersion: z.string().min(1).nullable(),
}).strict();

const parseHumanDecisionEnvelope = (value: unknown): HumanDecisionEnvelope => humanDecisionEnvelopeSchema.parse(value) as HumanDecisionEnvelope;

export const emptyHumanDecisionImpact = (): HumanDecisionImpact => ({
  affectedObjects: [],
  affectedEngines: [],
  reopenedGates: [],
  obsoleteProjections: [],
});

export const createHumanDecisionCandidate = (input: {
  decisionId: string;
  gateId: string;
  scope: string[];
  targets: string[];
  reason?: string | null;
  provenance: string[];
  engineSource: HumanDecisionEngineSource;
  projectVersion?: string | null;
  impact?: HumanDecisionImpact;
}): HumanDecisionEnvelope => parseHumanDecisionEnvelope({
  envelopeVersion: HUMAN_DECISION_ENVELOPE_VERSION,
  decisionId: input.decisionId,
  gateId: input.gateId,
  actor: null,
  mandate: null,
  scope: [...new Set(input.scope)],
  status: "PENDING",
  version: 1,
  timestamp: null,
  impact: input.impact ?? emptyHumanDecisionImpact(),
  targets: [...new Set(input.targets)],
  reason: input.reason?.trim() || null,
  provenance: [...new Set(input.provenance)],
  engineSource: input.engineSource,
  projectVersion: input.projectVersion ?? null,
});

export const isEngagingHumanDecision = (status: HumanDecisionStatus) => ["ADOPTED", "REJECTED", "DEFERRED", "REOPENED"].includes(status);

export const hasHumanDecisionAuthority = (decision: Pick<HumanDecisionEnvelope, "actor" | "mandate">) => Boolean(decision.actor?.trim() && decision.mandate?.trim());

export const engageHumanDecision = (
  candidate: HumanDecisionEnvelope,
  action: {
    status: "ADOPTED" | "REJECTED" | "DEFERRED";
    actor?: string | null;
    mandate?: string | null;
    reason?: string | null;
    timestamp: string;
    impact?: HumanDecisionImpact;
  },
): HumanDecisionEnvelope => {
  const actor = action.actor?.trim() || null;
  const mandate = action.mandate?.trim() || null;
  if (!actor || !mandate) return parseHumanDecisionEnvelope({
    ...candidate,
    actor: null,
    mandate: null,
    status: "INCOMPLETE_FOR_ADOPTION",
    timestamp: null,
  });
  return parseHumanDecisionEnvelope({
    ...candidate,
    actor,
    mandate,
    status: action.status,
    timestamp: action.timestamp,
    impact: action.impact ?? candidate.impact,
    reason: action.reason?.trim() || candidate.reason,
  });
};

export const reopenHumanDecision = (
  prior: HumanDecisionEnvelope,
  action: {
    actor?: string | null;
    mandate?: string | null;
    reason?: string | null;
    timestamp: string;
    impact: HumanDecisionImpact;
  },
): HumanDecisionEnvelope => {
  const candidate = parseHumanDecisionEnvelope({
    ...prior,
    actor: null,
    mandate: null,
    status: "PENDING",
    version: prior.version + 1,
    timestamp: null,
    impact: action.impact,
    reason: action.reason?.trim() || null,
    provenance: [...new Set([...prior.provenance, `prior-decision:${prior.decisionId}:v${prior.version}`])],
  });
  const actor = action.actor?.trim() || null;
  const mandate = action.mandate?.trim() || null;
  if (!actor || !mandate) return parseHumanDecisionEnvelope({ ...candidate, status: "INCOMPLETE_FOR_ADOPTION" });
  return parseHumanDecisionEnvelope({ ...candidate, actor, mandate, status: "REOPENED", timestamp: action.timestamp });
};

export const preserveLegacyHumanDecision = (legacy: {
  decisionId: string;
  gateId?: string;
  gate?: string;
  actor?: string | null;
  mandate?: string | null;
  mandateRef?: string | null;
  targetIds?: string[];
  targets?: string[];
  reason?: string | null;
  decidedAt?: string | null;
  timestamp?: string | null;
  decision?: string;
  status?: string;
}, engineSource: HumanDecisionEngineSource, projectVersion: string | null = null): HumanDecisionEnvelope => {
  const targets = legacy.targets ?? legacy.targetIds ?? [];
  const actor = legacy.actor?.trim() || null;
  const mandate = legacy.mandate?.trim() || legacy.mandateRef?.trim() || null;
  const sourceStatus = legacy.status ?? legacy.decision ?? "PENDING";
  const mappedStatus: HumanDecisionStatus = actor && mandate
    ? sourceStatus === "APPROVED" || sourceStatus === "ADOPTED" ? "ADOPTED" : sourceStatus === "REJECTED" ? "REJECTED" : "PENDING"
    : "LEGACY_DECISION_IDENTITY_INCOMPLETE";
  return parseHumanDecisionEnvelope({
    envelopeVersion: HUMAN_DECISION_ENVELOPE_VERSION,
    decisionId: legacy.decisionId,
    gateId: legacy.gateId ?? legacy.gate ?? "LEGACY_GATE_UNKNOWN",
    actor,
    mandate,
    scope: targets,
    status: mappedStatus,
    version: 1,
    timestamp: legacy.timestamp ?? legacy.decidedAt ?? null,
    impact: emptyHumanDecisionImpact(),
    targets,
    reason: legacy.reason?.trim() || null,
    provenance: ["LEGACY_DECISION_PRESERVED_WITHOUT_IDENTITY_RECONSTRUCTION"],
    engineSource,
    projectVersion,
  });
};

export const latestHumanDecisionVersions = (records: HumanDecisionEnvelope[]) => [...records]
  .sort((left, right) => left.version - right.version)
  .reduce<Map<string, HumanDecisionEnvelope>>((latest, record) => latest.set(record.decisionId, record), new Map());
