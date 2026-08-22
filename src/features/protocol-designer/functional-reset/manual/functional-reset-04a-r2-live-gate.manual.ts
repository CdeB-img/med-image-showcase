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
import { makeFunctionalResetContribution, makeFunctionalResetRuntimeResponse } from "../__tests__/functional-reset-fixtures";
import { evaluateFunctionalResetSemanticIntegration, semanticRepairContextFromCritic } from "../semantic-integration";

const CRITIC_REVALIDATION = process.argv.includes("--critic-revalidation");
const PRIOR_OBSERVED_PROVIDER_STARTS = CRITIC_REVALIDATION ? 63 : 47;
const INITIAL_INTERPRETER_OPERATIONS = CRITIC_REVALIDATION ? 3 : 6;
const INITIAL_CRITIC_OPERATIONS = CRITIC_REVALIDATION ? 2 : 5;
const MAX_REPAIR_INTERPRETER_OPERATIONS = CRITIC_REVALIDATION ? 2 : 5;
const MAX_SECOND_CRITIC_OPERATIONS = CRITIC_REVALIDATION ? 2 : 5;
const MAX_NEW_LOGICAL_OPERATIONS = INITIAL_INTERPRETER_OPERATIONS + INITIAL_CRITIC_OPERATIONS + MAX_REPAIR_INTERPRETER_OPERATIONS + MAX_SECOND_CRITIC_OPERATIONS;
const MAX_ATTEMPTS_PER_OPERATION = 2;
const MAX_NEW_PHYSICAL_STARTS = MAX_NEW_LOGICAL_OPERATIONS * MAX_ATTEMPTS_PER_OPERATION;
const USER_PROVIDER_HARD_STOP = 100;

if (PRIOR_OBSERVED_PROVIDER_STARTS + MAX_NEW_PHYSICAL_STARTS > USER_PROVIDER_HARD_STOP) {
  throw new Error("FR04AR2_PROVIDER_BUDGET_EXCEEDS_USER_HARD_STOP");
}

Object.assign(process.env, loadEnv("development", process.cwd(), ""));
process.env.SCIENTIFIC_INTERPRETATION_MODE = "HYBRID_ACTIVE_WITH_LEGACY_FALLBACK";
process.env.NOXIA_PROVIDER_MAX_STARTS_PER_MINUTE = "1";
const gateName = CRITIC_REVALIDATION ? "FUNCTIONAL_RESET_04A_R2_CRITIC_REVALIDATION" : "FUNCTIONAL_RESET_04A_R2_LIVE";
const evidenceRoot = join("/private/tmp", `noxia-fr04ar2-${CRITIC_REVALIDATION ? "critic-revalidation" : "live-gate"}-${Date.now()}`);
process.env.SCIENTIFIC_INTERPRETATION_EVIDENCE_DIR = evidenceRoot;

const authority = {
  actorRef: "fr04ar2-live:researcher",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const seedProject = (): ResearchProjectOwnerProjection => {
  const turnId = "turn:fr04ar2:seed";
  const base = makeFunctionalResetRuntimeResponse(makeFunctionalResetContribution([{ turnId, role: "USER", content: "La taille de l’infarctus à l’IRM sera mesurée." }])).contribution!;
  const template = base.scientificContent.candidateObjects[0];
  const item: ScientificContributionItem = {
    ...template,
    itemId: "measure:infarct-size",
    semanticIdentity: "infarct-size-mri",
    proposedType: "MEASURED_VARIABLE",
    content: "taille de l’infarctus à l’IRM",
    studyRole: "MEASURED_VARIABLE",
    semanticFunction: "CONCEPT",
    evidenceBasis: "EXPLICIT",
    projectDisposition: "PROJECT_CANDIDATE",
    referencedProjectElementIds: [],
    relatedItemIds: [],
    epistemicBoundary: { ...template.epistemicBoundary, sourceTurnIds: [turnId], sourceText: "taille de l’infarctus à l’IRM" },
  };
  const contribution: ScientificInterpretationContributionEnvelope = {
    ...base,
    identity: { ...base.identity, contributionId: "contribution:fr04ar2:seed", contributionDigest: "digest:fr04ar2:seed" },
    source: { ...base.source, originalRequest: item.content, turns: [{ turnId, role: "USER", content: item.content }], sourceRefs: [turnId] },
    scientificContent: {
      ...base.scientificContent,
      normalizedUnderstanding: item.content,
      explicitStatements: [], candidateObjects: [item], candidateRelations: [], inferredContext: [], contextualCandidates: [],
      negationsAndConstraints: [], temporalElements: [], ambiguities: [], unknowns: [], missingInformation: [], correctionsAndSupersessions: [], openDecisions: [], clarificationNeeds: [],
    },
    cognitiveBoundary: { ...base.cognitiveBoundary!, semanticUnderstanding: { summary: item.content, elements: [item], relations: [] } },
  };
  return confirmResearchProjectContribution({
    contribution,
    current: null,
    projectId: "project:fr04ar2",
    authority,
    confirmedAt: "2026-08-22T18:00:00.000Z",
  });
};

const project = seedProject();
type InterpretationResult = { statusCode: number; body: ScientificInterpretationApiResponse; conversation: ScientificInterpretationConversation };
let criticProviderAttempts = 0;
let criticRetries = 0;
let invalidStructuredOutputs = 0;

const invokeInterpretation = async (input: {
  scenarioId: string;
  turns: ScientificInterpretationConversation["turns"];
  withProject: boolean;
  previousContribution?: ScientificInterpretationContributionEnvelope | null;
  semanticRepairContext?: ScientificInterpretationSemanticRepairContext;
}): Promise<InterpretationResult> => {
  const conversation: ScientificInterpretationConversation = {
    conversationId: `conversation:${input.scenarioId}`,
    language: "fr",
    turns: input.turns,
    ...(input.withProject ? { projectContext: projectContextForScientificInterpretation(project) } : {}),
    ...(input.semanticRepairContext ? { semanticRepairContext: input.semanticRepairContext } : {}),
  };
  let statusCode = 0;
  let body: unknown = null;
  await handleScientificInterpretation({
    method: "POST",
    headers: { "content-type": "application/json" },
    socket: { remoteAddress: input.scenarioId },
    body: { apiVersion: "1.0.0", conversation, previousContribution: input.previousContribution ?? null },
  }, {
    status(code: number) { statusCode = code; return this; },
    setHeader() {},
    json(value: unknown) { body = value; },
  });
  return { statusCode, body: body as ScientificInterpretationApiResponse, conversation };
};

const invokeCritic = async (request: Omit<SemanticCriticApiRequest, "apiVersion">): Promise<SemanticCriticApiResponse> => {
  let body: unknown = null;
  await handleScientificInterpretationCritic({ method: "POST", body: { ...request, apiVersion: "1.0.0" } }, {
    status() { return this; }, setHeader() {}, json(value: unknown) { body = value; },
  });
  const response = body as SemanticCriticApiResponse;
  criticProviderAttempts += response.providerAttempts;
  criticRetries += response.retries;
  invalidStructuredOutputs += response.invalidStructuredOutputs;
  return response;
};

const roles = (candidate: ReturnType<typeof prepareResearchProjectContributionCandidate>) => new Set(
  candidate.changeSet.changes.flatMap((change) => change.proposedElement?.semanticRoles ?? []),
);
const hasDuplicateMeasurement = (candidate: ReturnType<typeof prepareResearchProjectContributionCandidate>) => candidate.changeSet.changes.some((change) =>
  change.operation === "ADD"
  && change.targetSectionId === "MEASUREMENTS"
  && /taille de l.infarctus|taille de l.idm/i.test(change.proposedElement?.content ?? ""));

const integrate = async (input: {
  scenarioId: string;
  initial: InterpretationResult;
  withProject: boolean;
  previousContribution?: ScientificInterpretationContributionEnvelope | null;
}) => {
  const contribution = input.initial.body.contribution!;
  const currentProject = input.withProject ? project : null;
  return evaluateFunctionalResetSemanticIntegration({
    contribution,
    groundingContext: buildSemanticCriticGroundingContext(input.initial.conversation, contribution),
    candidate: prepareResearchProjectContributionCandidate(contribution, currentProject),
    currentProject,
    requestCritic: invokeCritic,
    repairInterpretation: async ({ contribution: initialContribution, critic }) => {
      const repaired = await invokeInterpretation({
        scenarioId: input.scenarioId,
        turns: input.initial.conversation.turns,
        withProject: input.withProject,
        previousContribution: input.previousContribution,
        semanticRepairContext: semanticRepairContextFromCritic({ contribution: initialContribution, critic }),
      });
      if (!repaired.body.contribution) throw new Error(`${input.scenarioId}_REPAIR_CONTRIBUTION_MISSING`);
      return repaired.body.contribution;
    },
  });
};

const traces: Array<Record<string, unknown>> = [];
let firstPassFailures = 0;
let recoveredFailures = 0;
let safeClarifications = 0;
let silentTerminologyLosses = 0;
let autoRepairs = 0;

process.stdout.write(`${JSON.stringify({
  gate: gateName,
  providerBudget: {
    priorObservedStarts: PRIOR_OBSERVED_PROVIDER_STARTS,
    maximumNewLogicalOperations: MAX_NEW_LOGICAL_OPERATIONS,
    maximumNewPhysicalStarts: MAX_NEW_PHYSICAL_STARTS,
    maximumCumulativePhysicalStarts: PRIOR_OBSERVED_PROVIDER_STARTS + MAX_NEW_PHYSICAL_STARTS,
    userHardStop: USER_PROVIDER_HARD_STOP,
    maxStartsPerMinute: 1,
    concurrency: 1,
    rerolls: 0,
  },
  evidenceRoot,
})}\n`);

const runSingle = async (input: { id: string; message: string; withProject: boolean; expectation: "PRIMARY_OR_SAFE" | "PRIMARY" | "UNRESOLVED" | "EXCLUSION" }) => {
  process.stdout.write(`${JSON.stringify({ event: "R2_SCENARIO_START", scenario: input.id })}\n`);
  const initial = await invokeInterpretation({
    scenarioId: input.id,
    turns: [{ turnId: `turn:${input.id}`, role: "USER", content: input.message, createdAt: new Date().toISOString() }],
    withProject: input.withProject,
  });
  const initialContribution = initial.body.contribution;
  if (!initialContribution) {
    const safe = input.expectation === "UNRESOLVED" || input.expectation === "PRIMARY_OR_SAFE";
    const targeted = initial.body.productDisposition === "TERMINOLOGY_CLARIFICATION"
      && Boolean(initial.body.responseMessage?.toLocaleLowerCase("fr-FR").includes(input.expectation === "UNRESOLVED" ? "zxq" : "cjp"));
    if (safe && targeted) safeClarifications += 1;
    if (!safe || !targeted) silentTerminologyLosses += 1;
    traces.push({
      scenario: input.id,
      terminologyResolutions: initial.body.cognitiveBoundary.terminologyGrounding?.resolutions ?? [],
      productDisposition: initial.body.productDisposition,
      responseMessage: initial.body.responseMessage,
      finalRoute: "SAFE_TERMINOLOGY_CLARIFICATION",
      safetyPass: safe && targeted,
    });
    process.stdout.write(`${JSON.stringify({ event: "R2_SCENARIO_COMPLETE", scenario: input.id, safetyPass: safe && targeted, finalRoute: "SAFE_TERMINOLOGY_CLARIFICATION" })}\n`);
    return;
  }
  const integration = await integrate({ scenarioId: input.id, initial, withProject: input.withProject });
  const firstCritic = integration.criticAttempts[0];
  if (firstCritic.status === "FAILED") firstPassFailures += 1;
  if (integration.repairCount === 1) autoRepairs += 1;
  const finalRoles = roles(integration.candidate);
  const correct = input.expectation === "EXCLUSION"
    ? finalRoles.has("EXCLUSION")
    : input.expectation === "UNRESOLVED"
      ? false
      : finalRoles.has("PRIMARY_ENDPOINT") && !hasDuplicateMeasurement(integration.candidate);
  const safeClarification = integration.status === "BLOCKED_FOR_CLARIFICATION";
  if (safeClarification) safeClarifications += 1;
  if (firstCritic.status === "FAILED" && integration.status === "READY_FOR_HUMAN_REVIEW" && correct) recoveredFailures += 1;
  const acceptableClarification = safeClarification && (input.expectation === "UNRESOLVED" || input.expectation === "PRIMARY_OR_SAFE");
  const safetyPass = (integration.status === "READY_FOR_HUMAN_REVIEW" && correct) || acceptableClarification;
  const silentLoss = !correct && integration.status === "READY_FOR_HUMAN_REVIEW";
  if (silentLoss) silentTerminologyLosses += 1;
  traces.push({
    scenario: input.id,
    scopeDecision: initialContribution.cognitiveBoundary!.domainDecision.decision,
    dialogueIntent: initialContribution.cognitiveBoundary!.dialogueRouting.intent,
    terminologyContext: initialContribution.cognitiveBoundary!.terminologyGrounding?.context,
    terminologyResolutions: initialContribution.cognitiveBoundary!.terminologyGrounding?.resolutions,
    semanticUnderstanding: initialContribution.cognitiveBoundary!.semanticUnderstanding,
    initialCandidate: prepareResearchProjectContributionCandidate(initialContribution, input.withProject ? project : null).changeSet,
    firstCriticStatus: firstCritic.status,
    firstCriticFindings: firstCritic.findings,
    repairCount: integration.repairCount,
    finalCandidate: integration.candidate.changeSet,
    finalCriticStatus: integration.critic.status,
    finalRoute: integration.status,
    correct,
    safeClarification,
    silentLoss,
    safetyPass,
  });
  process.stdout.write(`${JSON.stringify({ event: "R2_SCENARIO_COMPLETE", scenario: input.id, safetyPass, finalRoute: integration.status, repairCount: integration.repairCount, silentLoss })}\n`);
};

if (!CRITIC_REVALIDATION) {
  await runSingle({ id: "LIVE-R2-01", message: "CJP = taille de l’IDM à l’IRM", withProject: true, expectation: "PRIMARY_OR_SAFE" });
  await runSingle({ id: "LIVE-R2-02", message: "Cette mesure sera mon critère principal.", withProject: true, expectation: "PRIMARY" });
  await runSingle({ id: "LIVE-R2-03", message: "ZXQ = cette mesure", withProject: true, expectation: "UNRESOLVED" });
}

process.stdout.write(`${JSON.stringify({ event: "R2_SCENARIO_START", scenario: "LIVE-R2-04" })}\n`);
const aliasTurn1 = { turnId: "turn:LIVE-R2-04:1", role: "USER" as const, content: "J’appellerai mesure A la taille de l’infarctus à l’IRM.", createdAt: new Date().toISOString() };
const aliasFirst = await invokeInterpretation({ scenarioId: "LIVE-R2-04", turns: [aliasTurn1], withProject: true });
const aliasTurn2 = { turnId: "turn:LIVE-R2-04:2", role: "USER" as const, content: "mesure A sera mon critère principal.", createdAt: new Date().toISOString() };
const aliasSecond = await invokeInterpretation({
  scenarioId: "LIVE-R2-04",
  turns: [aliasTurn1, aliasTurn2],
  withProject: true,
  previousContribution: aliasFirst.body.contribution,
});
if (!aliasSecond.body.contribution) {
  silentTerminologyLosses += 1;
  traces.push({ scenario: "LIVE-R2-04", firstTurnDisposition: aliasFirst.body.productDisposition, secondTurnDisposition: aliasSecond.body.productDisposition, safetyPass: false });
  process.stdout.write(`${JSON.stringify({ event: "R2_SCENARIO_COMPLETE", scenario: "LIVE-R2-04", safetyPass: false, finalRoute: aliasSecond.body.productDisposition })}\n`);
} else {
  const integration = await integrate({ scenarioId: "LIVE-R2-04", initial: aliasSecond, withProject: true, previousContribution: aliasFirst.body.contribution });
  const firstCritic = integration.criticAttempts[0];
  if (firstCritic.status === "FAILED") firstPassFailures += 1;
  if (integration.repairCount === 1) autoRepairs += 1;
  const correct = roles(integration.candidate).has("PRIMARY_ENDPOINT") && !hasDuplicateMeasurement(integration.candidate);
  if (firstCritic.status === "FAILED" && integration.status === "READY_FOR_HUMAN_REVIEW" && correct) recoveredFailures += 1;
  const silentLoss = !correct || integration.status !== "READY_FOR_HUMAN_REVIEW";
  if (silentLoss) silentTerminologyLosses += 1;
  traces.push({
    scenario: "LIVE-R2-04",
    firstTurnDisposition: aliasFirst.body.productDisposition,
    firstTurnTerminology: aliasFirst.body.cognitiveBoundary.terminologyGrounding?.resolutions,
    secondTurnTerminology: aliasSecond.body.cognitiveBoundary.terminologyGrounding?.resolutions,
    semanticUnderstanding: aliasSecond.body.contribution.cognitiveBoundary!.semanticUnderstanding,
    firstCriticStatus: firstCritic.status,
    firstCriticFindings: firstCritic.findings,
    repairCount: integration.repairCount,
    finalCandidate: integration.candidate.changeSet,
    finalCriticStatus: integration.critic.status,
    finalRoute: integration.status,
    correct,
    silentLoss,
    safetyPass: !silentLoss,
  });
  process.stdout.write(`${JSON.stringify({ event: "R2_SCENARIO_COMPLETE", scenario: "LIVE-R2-04", safetyPass: !silentLoss, finalRoute: integration.status, repairCount: integration.repairCount })}\n`);
}

await runSingle({ id: "LIVE-R2-05", message: "Critère d’exclusion : femme enceinte.", withProject: false, expectation: "EXCLUSION" });

const ledgerText = await readFile(join(evidenceRoot, "provider-ledger.jsonl"), "utf8").catch(() => "");
const ledger = ledgerText.trim()
  ? ledgerText.trim().split("\n").map((line) => JSON.parse(line) as { attempts?: Array<{ outcome: string; retryable: boolean }> })
  : [];
const interpreterProviderAttempts = ledger.reduce((sum, item) => sum + (item.attempts?.length ?? 0), 0);
const interpreterRetries = ledger.reduce((sum, item) => sum + (item.attempts?.filter((attempt) => attempt.outcome === "FAILED" && attempt.retryable).length ?? 0), 0);
const gatePass = traces.every((trace) => trace.safetyPass === true) && silentTerminologyLosses === 0 && invalidStructuredOutputs === 0;
process.stdout.write(`${JSON.stringify({
  gate: gateName,
  result: gatePass ? "PASS" : "FAIL",
  traces,
  metrics: {
    interpreterProviderAttempts,
    criticProviderAttempts,
    totalObservedProviderAttempts: interpreterProviderAttempts + criticProviderAttempts,
    retries: interpreterRetries + criticRetries,
    invalidStructuredOutputs,
    firstPassFailures,
    recoveredFailures,
    safeClarifications,
    silentTerminologyLosses,
    autoRepairs,
  },
})}\n`);

if (!gatePass) process.exitCode = 1;
