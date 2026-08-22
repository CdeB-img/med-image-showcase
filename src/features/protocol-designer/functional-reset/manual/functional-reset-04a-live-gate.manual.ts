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
import type { ScientificInterpretationApiResponse } from "@/features/scientific-interpretation/transport";
import { buildSemanticCriticGroundingContext } from "@/features/scientific-interpretation/semantic-critic";
import type { SemanticCriticApiRequest, SemanticCriticApiResponse } from "@/features/scientific-interpretation/semantic-critic-transport";
import type { ScientificInterpretationSemanticRepairContext } from "@/features/scientific-interpretation/contracts";
import { evaluateFunctionalResetSemanticIntegration, semanticRepairContextFromCritic } from "../semantic-integration";

const TARGET_MAIN_PROVIDER_OPERATIONS = 11;
const TARGET_CRITIC_OPERATIONS_WITHOUT_REPAIR = 5;
const MAX_PROVIDER_STARTS = 42;
const USER_PROVIDER_HARD_STOP = 100;
const workspace = process.cwd();

Object.assign(process.env, loadEnv("development", workspace, ""));
process.env.SCIENTIFIC_INTERPRETATION_MODE = "HYBRID_ACTIVE_WITH_LEGACY_FALLBACK";
process.env.NOXIA_PROVIDER_MAX_STARTS_PER_MINUTE = "1";
const evidenceRoot = join("/private/tmp", `noxia-fr04a-live-gate-${Date.now()}`);
process.env.SCIENTIFIC_INTERPRETATION_EVIDENCE_DIR = evidenceRoot;

if (MAX_PROVIDER_STARTS > USER_PROVIDER_HARD_STOP) throw new Error("FR04A_PROVIDER_BUDGET_EXCEEDS_USER_HARD_STOP");

const authority = {
  actorRef: "fr04a-live:researcher",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const COLCHICINE = "Je veux étudier l’effet de la colchicine après infarctus du myocarde, notamment sur l’inflammation et les lésions en IRM, dans une étude multicentrique comparant colchicine et placebo. Je veux également prévoir des biomarqueurs sanguins et mesurer la taille de l’infarctus à l’IRM.";

const allScenarios = [
  { id: "LIVE-04A-00", message: COLCHICINE, project: "CURRENT", critic: true, confirm: true },
  { id: "LIVE-04A-01", message: "CJP = taille de l’IDM à l’IRM", project: "CURRENT", critic: true, confirm: false },
  { id: "LIVE-04A-02", message: "Entre 20 et 80 ans, troponine au moins 800 sans maximum. Critères d’exclusion : femme enceinte.", project: "CURRENT", critic: true, confirm: true },
  { id: "LIVE-04A-03", message: "médicament contre placebo", project: "CURRENT", qry: "ANALYSE", critic: false, confirm: false },
  { id: "LIVE-04A-04", message: "je ne comprends pas la question", project: "CURRENT", qry: "ANALYSE", critic: false, confirm: false },
  { id: "LIVE-04A-05", message: "pourquoi tu me demandes ça ?", project: "CURRENT", qry: "ANALYSE", critic: false, confirm: false },
  { id: "LIVE-04A-06", message: "je veux manger une banane", project: "NONE", critic: false, confirm: false },
  { id: "LIVE-04A-07", message: "les participants mangeront une banane 30 minutes avant l’IRM", project: "NONE", critic: true, confirm: false },
  { id: "LIVE-04A-08", message: "mon T2 cardiaque est à 58 ms, est-ce grave ?", project: "NONE", critic: false, confirm: false },
  { id: "LIVE-04A-09", message: "quelles sont les limites méthodologiques du T2 mapping dans une étude multicentrique ?", project: "NONE", critic: false, confirm: false },
  { id: "LIVE-04A-10", message: "L’IRM sera faite à J5–J7 et donne-moi une recette de gâteau.", project: "CURRENT", critic: true, confirm: false },
] as const;
const requestedScenarioId = process.argv.find((argument) => argument.startsWith("LIVE-04A-")) ?? null;
const scenarios = requestedScenarioId
  ? allScenarios.filter((scenario) => scenario.id === requestedScenarioId)
  : [...allScenarios];
if (requestedScenarioId && scenarios.length !== 1) throw new Error(`FR04A_UNKNOWN_SCENARIO:${requestedScenarioId}`);

type LiveTrace = {
  id: string;
  statusCode: number;
  technicalStatus: string | null;
  fallbackUsed: boolean | null;
  scopeDecision: string | null;
  dialogueIntent: string | null;
  questionContextMismatch: boolean;
  preservesCurrentQueryAction: boolean;
  responseMessage: string | null;
  semanticUnderstanding: Array<{ id: string; content: string; type: string | null; role: string | null; semanticFunction: string | null; disposition: string | null; references: string[]; lowerBound: number | null; upperBound: number | null; unit: string | null }>;
  semanticRelations: Array<{ id: string; type: string; source: string; target: string }>;
  compiledCandidate: Array<{ operation: string; section: string; content: string | null; roles: string[]; sourceRefs: string[]; lowerBound: number | null; upperBound: number | null; unit: string | null }>;
  criticResult: string | null;
  criticFindings: string[];
  repairCount: number;
  finalRoute: string | null;
  providerAttempts: number;
  retries: number;
  invalidStructuredOutputs: number;
  humanConfirmation: boolean;
  projectRevision: number | null;
  failures: string[];
};

const folded = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("fr-FR");
const includes = (values: string[], pattern: RegExp) => values.some((value) => pattern.test(folded(value)));

let currentProject: ResearchProjectOwnerProjection | null = null;
let previousContribution: ScientificInterpretationApiResponse["contribution"] = null;
let criticProviderAttempts = 0;
let criticRetries = 0;
let criticInvalidStructuredOutputs = 0;

const invokeInterpretation = async (
  scenario: typeof allScenarios[number],
  semanticRepairContext?: ScientificInterpretationSemanticRepairContext,
) => {
  let statusCode = 0;
  let body: unknown = null;
  const project = scenario.project === "CURRENT" ? currentProject : null;
  const interactionContext = "qry" in scenario ? {
    interactionRef: `qry-presentation:${scenario.id}`,
    sourceActionRef: `qry-action:${scenario.id}`,
    owner: "QUERY_NAVIGATION",
    purpose: "Préciser l’objectif d’analyse entre les groupes déjà définis.",
    expectedResponseKind: "QRY_INFORMATION_RESPONSE" as const,
    targetRefs: ["project-section:ANALYSIS"],
    informationNeedRefs: ["project-need:ANALYSIS:ANALYSIS_PLAN"],
    projectRef: project?.projectId ?? "project:fr04a-live",
    projectVersion: project?.versionId ?? "project:fr04a-live:version:1",
    projectDigest: project?.projectDigest ?? "digest:fr04a-live",
    currentQuestion: "Quel objectif de comparaison ou d’analyse souhaitez-vous préciser ?",
    questionRationale: "Le plan d’analyse principal reste à préciser.",
    scopeSectionIds: ["ANALYSIS"],
  } : undefined;
  const conversation = {
    conversationId: `conversation:${scenario.id}`,
    language: "fr" as const,
    turns: [{ turnId: `turn:${scenario.id}`, role: "USER" as const, content: scenario.message, createdAt: new Date().toISOString() }],
    ...(project ? { projectContext: projectContextForScientificInterpretation(project) } : {}),
    ...(interactionContext ? { interactionContext } : {}),
    ...(semanticRepairContext ? { semanticRepairContext } : {}),
  };
  await handleScientificInterpretation({
    method: "POST",
    headers: { "content-type": "application/json" },
    socket: { remoteAddress: scenario.id },
    body: {
      apiVersion: "1.0.0",
      conversation,
      previousContribution: scenario.id === "LIVE-04A-02" ? previousContribution : null,
    },
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
    status() { return this; },
    setHeader() {},
    json(value: unknown) { body = value; },
  });
  const response = body as SemanticCriticApiResponse;
  criticProviderAttempts += response.providerAttempts;
  criticRetries += response.retries;
  criticInvalidStructuredOutputs += response.invalidStructuredOutputs;
  return response;
};

const semanticFailures = (trace: Omit<LiveTrace, "failures">) => {
  const failures: string[] = [];
  const contents = trace.semanticUnderstanding.map((item) => item.content);
  const compiled = trace.compiledCandidate.map((item) => item.content ?? "");
  const item = (content: RegExp, predicate: (value: LiveTrace["semanticUnderstanding"][number]) => boolean = () => true) =>
    trace.semanticUnderstanding.some((value) => content.test(folded(value.content)) && predicate(value));
  if (trace.statusCode !== 200) failures.push("HTTP_200_REQUIRED");
  if (trace.technicalStatus !== "AVAILABLE" || trace.fallbackUsed !== false) failures.push("NOMINAL_PROVIDER_WITHOUT_FALLBACK_REQUIRED");
  if (trace.id === "LIVE-04A-00") {
    for (const expected of [/colchicine/, /placebo/, /infarctus/, /multicentrique/, /irm/, /inflammation/, /lesion/, /biomarqueurs sanguins/, /taille de l.infarctus/]) {
      if (!includes(contents, expected)) failures.push(`COLCHICINE_MISSING:${expected.source}`);
    }
    const inflammationElement = trace.semanticUnderstanding.find((value) => /inflammation/.test(folded(value.content)));
    const lesionElement = trace.semanticUnderstanding.find((value) => /lesion/.test(folded(value.content)));
    if (!inflammationElement || !lesionElement || inflammationElement.id === lesionElement.id) failures.push("COLCHICINE_INFLAMMATION_AND_LESIONS_MUST_BE_DISTINCT");
    const infarctSize = trace.semanticUnderstanding.find((value) => /taille.*infarct/.test(folded(value.content)));
    const mri = trace.semanticUnderstanding.find((value) => /\birm\b|\bmri\b/.test(folded(value.content)) && /MODALITY/i.test(value.type ?? ""));
    const imagingQualificationPreserved = Boolean(infarctSize && (
      /\birm\b|\bmri\b/.test(folded(infarctSize.content))
      || (mri && trace.semanticRelations.some((relation) =>
        [relation.source, relation.target].includes(infarctSize.id)
        && [relation.source, relation.target].includes(mri.id)))))
    if (!imagingQualificationPreserved) failures.push("COLCHICINE_INFARCT_SIZE_IMAGING_QUALIFICATION_REQUIRED");
    if (trace.criticResult !== "FAITHFUL" || !trace.humanConfirmation || trace.projectRevision !== 1) failures.push("COLCHICINE_CRITIC_CONFIRM_PROJECT_REQUIRED");
  }
  if (trace.id === "LIVE-04A-01") {
    if (!trace.semanticUnderstanding.some((value) => (value.semanticFunction === "ROLE_ASSIGNMENT" || value.semanticFunction === "REFERENCE") && value.references.length > 0)) failures.push("CJP_EXISTING_REFERENCE_REQUIRED");
    if (!trace.semanticUnderstanding.some((value) => value.references.length > 0 && /PRIMARY|PRINCIPAL/i.test(value.role ?? ""))) failures.push("CJP_PRIMARY_ROLE_REQUIRED");
    if (trace.compiledCandidate.some((value) => value.operation === "ADD" && /taille.*(?:idm|infarctus)/.test(folded(value.content ?? "")))) failures.push("CJP_DUPLICATE_MEASUREMENT");
    if (!trace.compiledCandidate.some((value) => value.operation === "REPLACE" && value.roles.some((role) => /PRIMARY|PRINCIPAL/i.test(role)))) failures.push("CJP_ROLE_NOT_COMPILED_ON_EXISTING");
    if (trace.criticResult !== "FAITHFUL") failures.push("CJP_CRITIC_NOT_FAITHFUL");
  }
  if (trace.id === "LIVE-04A-02") {
    const ageBounds = trace.semanticUnderstanding.filter((value) => /20|80|age|ans/.test(folded(value.content)));
    if (!ageBounds.some((value) => value.lowerBound === 20) || !ageBounds.some((value) => value.upperBound === 80)) failures.push("AGE_MIN_MAX_REQUIRED");
    const troponin = trace.semanticUnderstanding.find((value) => /tropon/.test(folded(value.content)));
    if (troponin?.lowerBound !== 800) failures.push("TROPONIN_MIN_REQUIRED");
    if (troponin?.upperBound !== null && troponin?.upperBound !== undefined) failures.push("TROPONIN_MAX_INVENTED");
    if (!trace.compiledCandidate.some((value) => /tropon/.test(folded(value.content ?? "")) && value.lowerBound === 800 && value.upperBound === null)) failures.push("TROPONIN_THRESHOLD_NOT_COMPILED");
    if (!item(/enceinte|grossesse/, (value) => value.semanticFunction === "EXCLUSION" || /EXCLUSION/i.test(value.role ?? ""))) failures.push("PREGNANCY_EXCLUSION_REQUIRED");
    if (trace.criticResult !== "FAITHFUL") failures.push("POPULATION_CRITIC_NOT_FAITHFUL");
  }
  if (trace.id === "LIVE-04A-03") {
    const mismatch = trace.dialogueIntent === "PARTIAL_SCIENTIFIC_INPUT" || trace.dialogueIntent === "SCIENTIFIC_INPUT";
    if (trace.scopeDecision !== "IN_SCOPE" || !mismatch || !trace.questionContextMismatch || !trace.preservesCurrentQueryAction || !trace.responseMessage || trace.compiledCandidate.some((value) => value.operation !== "NO_CHANGE")) failures.push("QRY_KNOWN_COMPARISON_LOOP_NOT_RESOLVED");
  }
  if (trace.id === "LIVE-04A-04" && (trace.dialogueIntent !== "REQUEST_REPHRASE" || !trace.preservesCurrentQueryAction || !trace.responseMessage || trace.compiledCandidate.length > 0)) failures.push("REQUEST_REPHRASE_ROUTE_REQUIRED");
  if (trace.id === "LIVE-04A-05" && (trace.dialogueIntent !== "REQUEST_EXPLANATION" || !trace.preservesCurrentQueryAction || !trace.responseMessage || trace.compiledCandidate.length > 0)) failures.push("REQUEST_EXPLANATION_ROUTE_REQUIRED");
  if (trace.id === "LIVE-04A-06" && (trace.scopeDecision !== "OUT_OF_SCOPE" || trace.compiledCandidate.length > 0)) failures.push("BANANA_GENERAL_OUT_OF_SCOPE_REQUIRED");
  if (trace.id === "LIVE-04A-07") {
    if (trace.scopeDecision === "OUT_OF_SCOPE" || !item(/banane/) || !item(/30 minutes|avant.*irm/) || trace.criticResult !== "FAITHFUL") failures.push("BANANA_PROTOCOL_CONTEXT_REQUIRED");
  }
  if (trace.id === "LIVE-04A-08" && trace.scopeDecision !== "OUT_OF_SCOPE_CLINICAL") failures.push("PATIENT_T2_CLINICAL_BOUNDARY_REQUIRED");
  if (trace.id === "LIVE-04A-09" && trace.scopeDecision !== "IN_SCOPE") failures.push("METHODOLOGICAL_T2_IN_SCOPE_REQUIRED");
  if (trace.id === "LIVE-04A-10") {
    if (trace.scopeDecision !== "MIXED" || !item(/j5.*j7/) || trace.compiledCandidate.some((value) => /recette|gateau/.test(folded(value.content ?? ""))) || trace.criticResult !== "FAITHFUL") failures.push("MIXED_SEGMENTATION_REQUIRED");
  }
  return failures;
};

const results: LiveTrace[] = [];
process.stdout.write(`${JSON.stringify({ gate: "FUNCTIONAL_RESET_04A_LIVE", providerBudget: { targetMain: TARGET_MAIN_PROVIDER_OPERATIONS, targetCriticWithoutRepair: TARGET_CRITIC_OPERATIONS_WITHOUT_REPAIR, maximumPhysicalStarts: MAX_PROVIDER_STARTS, userHardStop: USER_PROVIDER_HARD_STOP, maxStartsPerMinute: 1, concurrency: 1 }, evidenceRoot })}\n`);

for (const [index, scenario] of scenarios.entries()) {
  process.stdout.write(`${JSON.stringify({ event: "PROVIDER_OPERATION_START", sequence: index + 1, totalMainOperations: scenarios.length, scenario: scenario.id })}\n`);
  const response = await invokeInterpretation(scenario);
  const contribution = response.body.contribution;
  const candidate = contribution ? prepareResearchProjectContributionCandidate(contribution, scenario.project === "CURRENT" ? currentProject : null) : null;
  let criticResult: string | null = null;
  let criticFindings: string[] = [];
  let repairCount = 0;
  let criticAttemptsThisScenario = 0;
  let retriesThisScenario = 0;
  let invalidThisScenario = 0;
  let finalCandidate = candidate;
  let finalContribution = contribution;
  if (scenario.critic && response.body.technicalStatus === "AVAILABLE" && response.body.fallbackUsed === false && contribution && contribution.cognitiveBoundary && candidate) {
    const integration = await evaluateFunctionalResetSemanticIntegration({
      contribution,
      groundingContext: buildSemanticCriticGroundingContext(response.conversation),
      candidate,
      currentProject: scenario.project === "CURRENT" ? currentProject : null,
      repairInterpretation: async ({ contribution: initial, critic }) => {
        const repaired = await invokeInterpretation(scenario, semanticRepairContextFromCritic({ contribution: initial, critic }));
        if (!repaired.body.contribution) throw new Error("FR04A_SEMANTIC_REPAIR_CONTRIBUTION_MISSING");
        return repaired.body.contribution;
      },
      requestCritic: async (request) => {
        const value = await invokeCritic(request);
        criticAttemptsThisScenario += value.providerAttempts;
        retriesThisScenario += value.retries;
        invalidThisScenario += value.invalidStructuredOutputs;
        return value;
      },
    });
    criticResult = integration.critic.status;
    criticFindings = integration.critic.findings.map((finding) => finding.category);
    repairCount = integration.repairCount;
    finalCandidate = integration.candidate;
    finalContribution = integration.contribution;
  }
  let humanConfirmation = false;
  if (scenario.confirm && finalContribution && finalCandidate && criticResult === "FAITHFUL") {
    currentProject = confirmResearchProjectContribution({
      contribution: finalContribution,
      current: scenario.project === "CURRENT" ? currentProject : null,
      projectId: currentProject?.projectId ?? "project:fr04a-live",
      authority,
      confirmedAt: new Date().toISOString(),
    });
    humanConfirmation = true;
  }
  if (scenario.id === "LIVE-04A-00") previousContribution = contribution;
  const boundary = response.body.cognitiveBoundary;
  const base: Omit<LiveTrace, "failures"> = {
    id: scenario.id,
    statusCode: response.statusCode,
    technicalStatus: response.body.technicalStatus ?? null,
    fallbackUsed: response.body.fallbackUsed ?? null,
    scopeDecision: boundary?.domainDecision.decision ?? null,
    dialogueIntent: boundary?.dialogueRouting.intent ?? null,
    questionContextMismatch: boundary?.dialogueRouting.questionContextMismatch ?? false,
    preservesCurrentQueryAction: boundary?.dialogueRouting.preservesCurrentQueryAction ?? false,
    responseMessage: response.body.responseMessage ?? null,
    semanticUnderstanding: boundary?.semanticUnderstanding.elements.map((item) => ({
      id: item.itemId,
      content: item.content,
      type: item.proposedType,
      role: item.studyRole,
      semanticFunction: item.semanticFunction ?? null,
      disposition: item.projectDisposition ?? null,
      references: item.referencedProjectElementIds ?? [],
      lowerBound: item.quantitativeBounds?.lower ?? null,
      upperBound: item.quantitativeBounds?.upper ?? null,
      unit: item.quantitativeBounds?.unit ?? null,
    })) ?? [],
    semanticRelations: boundary?.semanticUnderstanding.relations.map((relation) => ({
      id: relation.relationId,
      type: relation.relationType,
      source: relation.sourceItemId,
      target: relation.targetItemId,
    })) ?? [],
    compiledCandidate: finalCandidate?.changeSet.changes.map((item) => ({
      operation: item.operation,
      section: item.targetSectionId,
      content: item.proposedElement?.content ?? null,
      roles: item.proposedElement?.semanticRoles ?? [],
      sourceRefs: item.sourceObjectRefs,
      lowerBound: item.proposedElement?.quantitativeBounds?.lower ?? null,
      upperBound: item.proposedElement?.quantitativeBounds?.upper ?? null,
      unit: item.proposedElement?.quantitativeBounds?.unit ?? null,
    })) ?? [],
    criticResult,
    criticFindings,
    repairCount,
    finalRoute: response.body.productDisposition ?? null,
    providerAttempts: criticAttemptsThisScenario,
    retries: retriesThisScenario,
    invalidStructuredOutputs: invalidThisScenario,
    humanConfirmation,
    projectRevision: currentProject?.revision ?? null,
  };
  const result = { ...base, failures: semanticFailures(base) };
  results.push(result);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

const ledgerText = await readFile(join(evidenceRoot, "provider-ledger.jsonl"), "utf8").catch(() => "");
const ledger = ledgerText.trim() ? ledgerText.trim().split("\n").map((line) => JSON.parse(line) as { attempts?: Array<{ outcome: string; retryable: boolean }> }) : [];
const mainProviderAttempts = ledger.reduce((sum, item) => sum + (item.attempts?.length ?? 0), 0);
const mainRetries = ledger.reduce((sum, item) => sum + (item.attempts?.filter((attempt) => attempt.outcome === "FAILED" && attempt.retryable).length ?? 0), 0);
const totalProviderAttempts = mainProviderAttempts + criticProviderAttempts;
const failures = results.flatMap((result) => result.failures.map((failure) => `${result.id}:${failure}`));
const summary = {
  gate: "FUNCTIONAL_RESET_04A_LIVE",
  mainOperations: scenarios.length,
  mainProviderAttempts,
  criticProviderAttempts,
  providerCalls: totalProviderAttempts,
  retries: mainRetries + criticRetries,
  invalidStructuredOutputs: criticInvalidStructuredOutputs,
  providerFailures: results.filter((result) => result.statusCode !== 200 || result.criticResult === "SEMANTIC_CRITIC_UNAVAILABLE").length,
  semanticFailures: failures,
  passed: results.length - new Set(failures.map((failure) => failure.split(":")[0])).size,
  total: results.length,
  evidenceRoot,
  decision: failures.length === 0 && totalProviderAttempts <= USER_PROVIDER_HARD_STOP ? "PASS" : "FAIL",
};
process.stdout.write(`${JSON.stringify(summary)}\n`);
if (summary.decision !== "PASS") process.exitCode = 1;
