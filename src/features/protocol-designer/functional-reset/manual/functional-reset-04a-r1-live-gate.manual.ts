import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { loadEnv } from "vite";
import { handleScientificInterpretation } from "../../../../../api/scientific-interpretation";
import { handleScientificInterpretationCritic } from "../../../../../api/scientific-interpretation-critic";
import {
  confirmResearchProjectContribution,
  prepareResearchProjectContributionCandidate,
  projectContextForScientificInterpretation,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import type {
  ScientificContributionItem,
  ScientificInterpretationContributionEnvelope,
  ScientificInterpretationConversation,
  ScientificInterpretationSemanticRepairContext,
} from "@/features/scientific-interpretation/contracts";
import { buildSemanticCriticGroundingContext } from "@/features/scientific-interpretation/semantic-critic";
import type { SemanticCriticApiRequest, SemanticCriticApiResponse } from "@/features/scientific-interpretation/semantic-critic-transport";
import type { ScientificInterpretationApiResponse } from "@/features/scientific-interpretation/transport";
import {
  makeFunctionalResetContribution,
  makeFunctionalResetRuntimeResponse,
} from "../__tests__/functional-reset-fixtures";
import { evaluateFunctionalResetSemanticIntegration, semanticRepairContextFromCritic } from "../semantic-integration";

const PRIOR_04A_PROVIDER_STARTS = 39;
const INITIAL_INTERPRETER_OPERATIONS = 4;
const INITIAL_CRITIC_OPERATIONS = 4;
const MAX_REPAIR_INTERPRETER_OPERATIONS = 4;
const MAX_SECOND_CRITIC_OPERATIONS = 4;
const MAX_NEW_LOGICAL_OPERATIONS = INITIAL_INTERPRETER_OPERATIONS + INITIAL_CRITIC_OPERATIONS + MAX_REPAIR_INTERPRETER_OPERATIONS + MAX_SECOND_CRITIC_OPERATIONS;
const MAX_ATTEMPTS_PER_OPERATION = 2;
const MAX_NEW_PHYSICAL_STARTS = MAX_NEW_LOGICAL_OPERATIONS * MAX_ATTEMPTS_PER_OPERATION;
const USER_PROVIDER_HARD_STOP = 100;

if (PRIOR_04A_PROVIDER_STARTS + MAX_NEW_PHYSICAL_STARTS > USER_PROVIDER_HARD_STOP) {
  throw new Error("FR04AR1_PROVIDER_BUDGET_EXCEEDS_USER_HARD_STOP");
}

Object.assign(process.env, loadEnv("development", process.cwd(), ""));
process.env.SCIENTIFIC_INTERPRETATION_MODE = "HYBRID_ACTIVE_WITH_LEGACY_FALLBACK";
process.env.NOXIA_PROVIDER_MAX_STARTS_PER_MINUTE = "1";
const evidenceRoot = join("/private/tmp", `noxia-fr04ar1-live-gate-${Date.now()}`);
process.env.SCIENTIFIC_INTERPRETATION_EVIDENCE_DIR = evidenceRoot;

const authority = {
  actorRef: "fr04ar1-live:researcher",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const seedProject = (projectId: string, itemId: string, content: string): ResearchProjectOwnerProjection => {
  const turnId = `turn:seed:${projectId}`;
  const response = makeFunctionalResetRuntimeResponse(makeFunctionalResetContribution([{
    turnId,
    role: "USER",
    content: `${content} sera mesurée.`,
  }]));
  const base = response.contribution!;
  const template = base.scientificContent.candidateObjects[0];
  const item: ScientificContributionItem = {
    ...template,
    itemId,
    semanticIdentity: itemId,
    proposedType: "MEASURED_VARIABLE",
    content,
    studyRole: "MEASURED_VARIABLE",
    semanticFunction: "CONCEPT",
    evidenceBasis: "EXPLICIT",
    projectDisposition: "PROJECT_CANDIDATE",
    referencedProjectElementIds: [],
    relatedItemIds: [],
    epistemicBoundary: {
      ...template.epistemicBoundary,
      sourceTurnIds: [turnId],
      sourceText: content,
    },
  };
  const contribution: ScientificInterpretationContributionEnvelope = {
    ...base,
    identity: { ...base.identity, contributionId: `contribution:seed:${projectId}`, contributionDigest: `digest:seed:${projectId}` },
    source: { ...base.source, originalRequest: content, turns: [{ turnId, role: "USER", content }], sourceRefs: [turnId] },
    scientificContent: {
      ...base.scientificContent,
      normalizedUnderstanding: content,
      explicitStatements: [],
      candidateObjects: [item],
      candidateRelations: [],
      inferredContext: [],
      contextualCandidates: [],
      negationsAndConstraints: [],
      temporalElements: [],
      ambiguities: [],
      unknowns: [],
      missingInformation: [],
      correctionsAndSupersessions: [],
      openDecisions: [],
      clarificationNeeds: [],
    },
    cognitiveBoundary: {
      ...base.cognitiveBoundary!,
      semanticUnderstanding: { summary: content, elements: [item], relations: [] },
    },
  };
  return confirmResearchProjectContribution({
    contribution,
    current: null,
    projectId,
    authority,
    confirmedAt: "2026-08-22T17:00:00.000Z",
  });
};

const projects = {
  INFARCT: seedProject("project:fr04ar1:infarct", "measure:infarct-size", "taille de l’infarctus à l’IRM"),
  X: seedProject("project:fr04ar1:x", "measure:x", "mesure X"),
  NONE: null,
} as const;

const scenarios = [
  { id: "LIVE-R1-01", project: "INFARCT" as const, message: "CJP = taille de l’IDM à l’IRM", expectation: "PRIMARY_EXISTING" as const },
  { id: "LIVE-R1-02", project: "X" as const, message: "Cette mesure sera mon critère principal.", expectation: "PRIMARY_EXISTING" as const },
  { id: "LIVE-R1-03", project: "NONE" as const, message: "Critère d’exclusion : femme enceinte.", expectation: "EXCLUSION" as const },
  { id: "LIVE-R1-04", project: "NONE" as const, message: "La taille de l’infarctus sera mesurée.", expectation: "MEASUREMENT_ONLY" as const },
];

type Scenario = typeof scenarios[number];
type InterpretationResult = {
  statusCode: number;
  body: ScientificInterpretationApiResponse;
  conversation: ScientificInterpretationConversation;
};

let logicalInterpreterCalls = 0;
let criticProviderAttempts = 0;
let retries = 0;
let invalidStructuredOutputs = 0;

const invokeInterpretation = async (
  scenario: Scenario,
  semanticRepairContext?: ScientificInterpretationSemanticRepairContext,
): Promise<InterpretationResult> => {
  const project = projects[scenario.project];
  const conversation: ScientificInterpretationConversation = {
    conversationId: `conversation:${scenario.id}`,
    language: "fr",
    turns: [{ turnId: `turn:${scenario.id}`, role: "USER", content: scenario.message, createdAt: new Date().toISOString() }],
    ...(project ? { projectContext: projectContextForScientificInterpretation(project) } : {}),
    ...(semanticRepairContext ? { semanticRepairContext } : {}),
  };
  let statusCode = 0;
  let body: unknown = null;
  await handleScientificInterpretation({
    method: "POST",
    headers: { "content-type": "application/json" },
    socket: { remoteAddress: scenario.id },
    body: { apiVersion: "1.0.0", conversation, previousContribution: null },
  }, {
    status(code: number) { statusCode = code; return this; },
    setHeader() {},
    json(value: unknown) { body = value; },
  });
  const response = body as ScientificInterpretationApiResponse;
  if (response.contribution?.source.rawOutputRef) logicalInterpreterCalls += 1;
  return { statusCode, body: response, conversation };
};

const invokeCritic = async (request: Omit<SemanticCriticApiRequest, "apiVersion">): Promise<SemanticCriticApiResponse> => {
  let body: unknown = null;
  await handleScientificInterpretationCritic({ method: "POST", body: { ...request, apiVersion: "1.0.0" } }, {
    status() { return this; },
    setHeader() {},
    json(value: unknown) { body = value; },
  });
  const response = body as SemanticCriticApiResponse;
  criticProviderAttempts += response.providerAttempts;
  retries += response.retries;
  invalidStructuredOutputs += response.invalidStructuredOutputs;
  return response;
};

const roleSet = (contribution: ScientificInterpretationContributionEnvelope | null) => new Set(
  contribution?.cognitiveBoundary?.semanticUnderstanding.elements.flatMap((element) => [element.studyRole, element.semanticFunction].filter(Boolean)) ?? [],
);

const candidateRoles = (candidate: ReturnType<typeof prepareResearchProjectContributionCandidate> | null) => new Set(
  candidate?.changeSet.changes.flatMap((change) => change.proposedElement?.semanticRoles ?? []) ?? [],
);

const evaluateExpectation = (input: {
  scenario: Scenario;
  contribution: ScientificInterpretationContributionEnvelope;
  candidate: ReturnType<typeof prepareResearchProjectContributionCandidate>;
}) => {
  const roles = candidateRoles(input.candidate);
  const additions = input.candidate.changeSet.changes.filter((change) => change.operation === "ADD");
  if (input.scenario.expectation === "PRIMARY_EXISTING") return roles.has("PRIMARY_ENDPOINT") && additions.length === 0;
  if (input.scenario.expectation === "EXCLUSION") return roles.has("EXCLUSION");
  return !roles.has("PRIMARY_ENDPOINT")
    && input.contribution.cognitiveBoundary!.semanticUnderstanding.elements.some((element) => element.proposedType === "MEASURED_VARIABLE");
};

const traces: Array<Record<string, unknown>> = [];
let firstPassFailures = 0;
let recoveredFailures = 0;
let safeClarifications = 0;
let silentSemanticLosses = 0;

process.stdout.write(`${JSON.stringify({
  gate: "FUNCTIONAL_RESET_04A_R1_LIVE",
  providerBudget: {
    prior04AStarts: PRIOR_04A_PROVIDER_STARTS,
    initialInterpreterOperations: INITIAL_INTERPRETER_OPERATIONS,
    initialCriticOperations: INITIAL_CRITIC_OPERATIONS,
    maximumRepairInterpreterOperations: MAX_REPAIR_INTERPRETER_OPERATIONS,
    maximumSecondCriticOperations: MAX_SECOND_CRITIC_OPERATIONS,
    maximumNewLogicalOperations: MAX_NEW_LOGICAL_OPERATIONS,
    maximumNewPhysicalStarts: MAX_NEW_PHYSICAL_STARTS,
    maximumCumulativePhysicalStarts: PRIOR_04A_PROVIDER_STARTS + MAX_NEW_PHYSICAL_STARTS,
    userHardStop: USER_PROVIDER_HARD_STOP,
    maxStartsPerMinute: 1,
    concurrency: 1,
    rerolls: 0,
  },
  evidenceRoot,
})}\n`);

for (const [index, scenario] of scenarios.entries()) {
  process.stdout.write(`${JSON.stringify({ event: "R1_SCENARIO_START", sequence: index + 1, total: scenarios.length, scenario: scenario.id })}\n`);
  const initial = await invokeInterpretation(scenario);
  const contribution = initial.body.contribution;
  if (!contribution) throw new Error(`${scenario.id}_INITIAL_CONTRIBUTION_MISSING`);
  const project = projects[scenario.project];
  const initialCandidate = prepareResearchProjectContributionCandidate(contribution, project);
  const initialRoles = roleSet(contribution);
  const interpreterFirstPassCorrect = scenario.expectation === "PRIMARY_EXISTING"
    ? initialRoles.has("PRIMARY_ENDPOINT")
    : scenario.expectation === "EXCLUSION"
      ? initialRoles.has("EXCLUSION")
      : !initialRoles.has("PRIMARY_ENDPOINT") && contribution.cognitiveBoundary!.semanticUnderstanding.elements.some((element) => element.proposedType === "MEASURED_VARIABLE");
  let repairInterpreterCalls = 0;
  const integration = await evaluateFunctionalResetSemanticIntegration({
    contribution,
    groundingContext: buildSemanticCriticGroundingContext(initial.conversation),
    candidate: initialCandidate,
    currentProject: project,
    requestCritic: invokeCritic,
    repairInterpretation: async ({ contribution: initialContribution, critic }) => {
      repairInterpreterCalls += 1;
      const repaired = await invokeInterpretation(scenario, semanticRepairContextFromCritic({ contribution: initialContribution, critic }));
      if (!repaired.body.contribution) throw new Error(`${scenario.id}_REPAIR_CONTRIBUTION_MISSING`);
      return repaired.body.contribution;
    },
  });
  const firstCritic = integration.criticAttempts[0];
  if (firstCritic.status === "FAILED") firstPassFailures += 1;
  const finalCorrect = evaluateExpectation({ scenario, contribution: integration.contribution, candidate: integration.candidate });
  const safeClarification = integration.status === "BLOCKED_FOR_CLARIFICATION";
  if (firstCritic.status === "FAILED" && integration.status === "READY_FOR_HUMAN_REVIEW" && finalCorrect) recoveredFailures += 1;
  if (safeClarification) safeClarifications += 1;
  const silentLoss = !interpreterFirstPassCorrect && firstCritic.status === "FAITHFUL";
  if (silentLoss) silentSemanticLosses += 1;
  const safetyPass = (integration.status === "READY_FOR_HUMAN_REVIEW" && finalCorrect) || safeClarification;
  traces.push({
    scenario: scenario.id,
    rawUserMessage: scenario.message,
    scopeDecision: contribution.cognitiveBoundary!.domainDecision.decision,
    dialogueIntent: contribution.cognitiveBoundary!.dialogueRouting.intent,
    semanticUnderstanding: contribution.cognitiveBoundary!.semanticUnderstanding,
    interpreterFirstPassCorrect,
    initialCandidateStatus: initialCandidate.changeSet.status,
    initialCandidateChanges: initialCandidate.changeSet.changes,
    firstCriticStatus: firstCritic.status,
    firstCriticFindings: firstCritic.findings,
    repairCount: integration.repairCount,
    repairInterpreterCalls,
    finalCandidateStatus: integration.candidate.changeSet.status,
    finalCandidateChanges: integration.candidate.changeSet.changes,
    finalCriticStatus: integration.critic.status,
    finalRoute: integration.status,
    finalCorrect,
    safeClarification,
    silentLoss,
    safetyPass,
  });
  process.stdout.write(`${JSON.stringify({ event: "R1_SCENARIO_COMPLETE", scenario: scenario.id, safetyPass, finalRoute: integration.status, repairCount: integration.repairCount, silentLoss })}\n`);
}

const ledgerText = await readFile(join(evidenceRoot, "provider-ledger.jsonl"), "utf8").catch(() => "");
const ledger = ledgerText.trim()
  ? ledgerText.trim().split("\n").map((line) => JSON.parse(line) as { attempts?: Array<{ outcome: string; retryable: boolean }> })
  : [];
const mainProviderAttempts = ledger.reduce((sum, item) => sum + (item.attempts?.length ?? 0), 0);
const mainRetries = ledger.reduce((sum, item) => sum + (item.attempts?.filter((attempt) => attempt.outcome === "FAILED" && attempt.retryable).length ?? 0), 0);
const allSafetyPass = traces.every((trace) => trace.safetyPass === true);
const gatePass = allSafetyPass && silentSemanticLosses === 0 && invalidStructuredOutputs === 0;
process.stdout.write(`${JSON.stringify({
  gate: "FUNCTIONAL_RESET_04A_R1_LIVE",
  result: gatePass ? "PASS" : "FAIL",
  traces,
  metrics: {
    mainProviderAttempts,
    logicalInterpreterCalls,
    criticProviderAttempts,
    totalObservedProviderAttempts: mainProviderAttempts + criticProviderAttempts,
    retries: mainRetries + retries,
    invalidStructuredOutputs,
    firstPassFailures,
    recoveredFailures,
    safeClarifications,
    silentSemanticLosses,
  },
})}\n`);

if (!gatePass) process.exitCode = 1;
