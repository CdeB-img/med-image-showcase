import {
  repairResearchProjectContributionCandidate,
  type ResearchProjectContributionCandidate,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import type {
  ScientificInterpretationContributionEnvelope,
  ScientificInterpretationSemanticRepairContext,
} from "@/features/scientific-interpretation/contracts";
import { requestSemanticCritic } from "@/features/scientific-interpretation/semantic-critic-client";
import {
  snapshotSemanticCriticCandidate,
  type SemanticCriticGroundingContext,
  type SemanticCriticResult,
} from "@/features/scientific-interpretation/semantic-critic";
import type { SemanticCriticApiResponse } from "@/features/scientific-interpretation/semantic-critic-transport";

export const MAX_FUNCTIONAL_RESET_AUTO_REPAIR_COUNT = 1 as const;

export type FunctionalResetSemanticIntegration = {
  status: "READY_FOR_HUMAN_REVIEW" | "BLOCKED_FOR_CLARIFICATION" | "CRITIC_UNAVAILABLE";
  candidate: ResearchProjectContributionCandidate;
  initialContribution: ScientificInterpretationContributionEnvelope;
  contribution: ScientificInterpretationContributionEnvelope;
  critic: SemanticCriticResult;
  criticAttempts: SemanticCriticResult[];
  repairCount: 0 | 1;
  providerAttempts: number;
  retries: number;
  invalidStructuredOutputs: number;
  humanConfirmationRequired: true;
  projectWriteAuthorized: false;
};

export const semanticRepairContextFromCritic = (input: {
  contribution: ScientificInterpretationContributionEnvelope;
  critic: SemanticCriticResult;
}): ScientificInterpretationSemanticRepairContext => ({
  lifecycle: "EPHEMERAL_TRACEABLE_NON_AUTHORITATIVE",
  attempt: 1,
  initialContributionId: input.contribution.identity.contributionId,
  initialContributionDigest: input.contribution.identity.contributionDigest,
  criticResultDigest: logicalDigest(input.critic),
  findings: input.critic.findings.map((finding) => ({
    category: finding.category,
    failureStage: finding.failureStage,
    message: finding.message,
    rawEvidence: finding.rawEvidence.map((evidence) => ({ ...evidence })),
    repairHint: finding.repairHint,
  })),
});

export const evaluateFunctionalResetSemanticIntegration = async (input: {
  contribution: ScientificInterpretationContributionEnvelope;
  groundingContext: SemanticCriticGroundingContext;
  candidate: ResearchProjectContributionCandidate;
  currentProject: ResearchProjectOwnerProjection | null;
  repairInterpretation?: (input: {
    contribution: ScientificInterpretationContributionEnvelope;
    critic: SemanticCriticResult;
    groundingContext: SemanticCriticGroundingContext;
  }) => Promise<ScientificInterpretationContributionEnvelope>;
  requestCritic?: (request: Parameters<typeof requestSemanticCritic>[0]) => Promise<SemanticCriticApiResponse>;
}): Promise<FunctionalResetSemanticIntegration> => {
  const requestCritic = input.requestCritic ?? requestSemanticCritic;
  const first = await requestCritic({
    contribution: input.contribution,
    groundingContext: input.groundingContext,
    candidate: snapshotSemanticCriticCandidate(input.candidate),
  });
  if (first.critic.status === "FAITHFUL") return {
    status: "READY_FOR_HUMAN_REVIEW",
    candidate: input.candidate,
    initialContribution: input.contribution,
    contribution: input.contribution,
    critic: first.critic,
    criticAttempts: [first.critic],
    repairCount: 0,
    providerAttempts: first.providerAttempts,
    retries: first.retries,
    invalidStructuredOutputs: first.invalidStructuredOutputs,
    humanConfirmationRequired: true,
    projectWriteAuthorized: false,
  };
  if (first.critic.status === "SEMANTIC_CRITIC_UNAVAILABLE") return {
    status: "CRITIC_UNAVAILABLE",
    candidate: input.candidate,
    initialContribution: input.contribution,
    contribution: input.contribution,
    critic: first.critic,
    criticAttempts: [first.critic],
    repairCount: 0,
    providerAttempts: first.providerAttempts,
    retries: first.retries,
    invalidStructuredOutputs: first.invalidStructuredOutputs,
    humanConfirmationRequired: true,
    projectWriteAuthorized: false,
  };
  if (!first.critic.repairAllowed) return {
    status: "BLOCKED_FOR_CLARIFICATION",
    candidate: input.candidate,
    initialContribution: input.contribution,
    contribution: input.contribution,
    critic: first.critic,
    criticAttempts: [first.critic],
    repairCount: 0,
    providerAttempts: first.providerAttempts,
    retries: first.retries,
    invalidStructuredOutputs: first.invalidStructuredOutputs,
    humanConfirmationRequired: true,
    projectWriteAuthorized: false,
  };

  const interpreterLoss = first.critic.findings.some((finding) => ["INTERPRETER", "BOTH"].includes(finding.failureStage));
  if (interpreterLoss && !input.repairInterpretation) return {
    status: "BLOCKED_FOR_CLARIFICATION",
    candidate: input.candidate,
    initialContribution: input.contribution,
    contribution: input.contribution,
    critic: first.critic,
    criticAttempts: [first.critic],
    repairCount: 0,
    providerAttempts: first.providerAttempts,
    retries: first.retries,
    invalidStructuredOutputs: first.invalidStructuredOutputs,
    humanConfirmationRequired: true,
    projectWriteAuthorized: false,
  };
  const repairedContribution = interpreterLoss
    ? await input.repairInterpretation!({
      contribution: input.contribution,
      critic: first.critic,
      groundingContext: input.groundingContext,
    })
    : input.contribution;
  const repairedCandidate = repairResearchProjectContributionCandidate(repairedContribution, input.currentProject);
  const second = await requestCritic({
    contribution: repairedContribution,
    groundingContext: input.groundingContext,
    candidate: snapshotSemanticCriticCandidate(repairedCandidate),
  });
  const status = second.critic.status === "FAITHFUL"
    ? "READY_FOR_HUMAN_REVIEW" as const
    : second.critic.status === "SEMANTIC_CRITIC_UNAVAILABLE"
      ? "CRITIC_UNAVAILABLE" as const
      : "BLOCKED_FOR_CLARIFICATION" as const;
  return {
    status,
    candidate: repairedCandidate,
    initialContribution: input.contribution,
    contribution: repairedContribution,
    critic: second.critic,
    criticAttempts: [first.critic, second.critic],
    repairCount: 1,
    providerAttempts: first.providerAttempts + second.providerAttempts,
    retries: first.retries + second.retries,
    invalidStructuredOutputs: first.invalidStructuredOutputs + second.invalidStructuredOutputs,
    humanConfirmationRequired: true,
    projectWriteAuthorized: false,
  };
};
