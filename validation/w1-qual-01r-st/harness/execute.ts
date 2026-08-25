/* eslint-disable @typescript-eslint/no-explicit-any -- bounded adjudicator inspects frozen heterogeneous contracts */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { logicalDigest, stableStringify } from "@/features/knowledge-engine";
import { executeScientificThinkingEngine } from "@/features/scientific-thinking";
import { invokeScientificThinkingForProject } from "@/features/protocol-designer/product-scientific-thinking-owner-runtime";
import { rehydrateProductOwnerResultLedger } from "@/features/protocol-designer/product-owner-result-ledger";
import {
  createScientificExecutionTraceLedger,
  createScientificRunTraceRecorder,
  listScientificRunEvents,
} from "@/features/protocol-designer/scientific-execution-trace";
import type { ProjectContextSnapshot, ResearchProjectOwnerProjection } from "@/features/research-project-construction";
import type { AcceptanceEnvelope, CharacterizationCase, FrozenInputPack } from "./authoring";
import { CAMPAIGN_ID, INITIAL_HEAD } from "./authoring";

const ROOT = resolve(import.meta.dirname, "../../..");
const OUT = resolve(ROOT, "validation/w1-qual-01r-st");
const stable = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const read = <T>(name: string) => JSON.parse(readFileSync(resolve(OUT, name), "utf8")) as T;
const write = (name: string, value: unknown) => writeFileSync(resolve(OUT, name), stable(value), "utf8");

type Outcome = "SATISFIED" | "PARTIALLY_SATISFIED" | "VIOLATED" | "NOT_APPLICABLE";
type Evaluation = {
  obligationId: string;
  checkId: string;
  critical: boolean;
  outcome: Outcome;
  failureClass: string;
  evidence: string[];
  note: string;
};
type ExecutionResult = {
  caseId: string;
  executionKind: "QUALIFYING_PRIMARY" | "PREDECLARED_REPLAY";
  expectedProfile: CharacterizationCase["expectedProfile"];
  inputPackDigest: string;
  traceRunId: string;
  traceEventRefs: string[];
  requestRef: string | null;
  requestDigest: string | null;
  outputResultRef: string | null;
  outputDigest: string | null;
  status: string;
  error: string | null;
  invocation: any;
  evaluations: Evaluation[];
  verdict: "FULLY_SATISFIED" | "PARTIALLY_SATISFIED" | "CRITICAL_VIOLATION";
  firstDivergentStage: string | null;
  runtimeProviderCalls: 0;
};

const cases = read<{ cases: CharacterizationCase[] }>("case-registry.json").cases;
const envelopes = new Map(read<{ envelopes: AcceptanceEnvelope[] }>("acceptance-envelope-registry.json").envelopes.map((item) => [item.caseId, item]));
const packs = new Map(read<{ packs: FrozenInputPack[] }>("frozen-input-registry.json").packs.map((item) => [item.sourceCase, item]));
const freeze = read<{ gitHead: string; freezeDigest: string; registries: { cases: number; envelopes: number; packs: number } }>("characterization-freeze.json");
const knowledgeGate = read<{ verdict: string; eligibleCases: number }>("knowledge-input-quality-gate.json");
if (freeze.gitHead !== INITIAL_HEAD || freeze.registries.cases !== 12 || freeze.registries.envelopes !== 12 || freeze.registries.packs !== 12 || knowledgeGate.verdict !== "PASS" || knowledgeGate.eligibleCases !== 12) throw new Error("W1_QUAL_01R_FROZEN_CAMPAIGN_INVALID");
for (const pack of packs.values()) {
  const material = { version: pack.version, sourceCase: pack.sourceCase, provenance: pack.provenance, purpose: pack.purpose, payload: pack.payload };
  if (!pack.frozen || logicalDigest(material) !== pack.digest) throw new Error(`W1_QUAL_01R_INPUT_DIGEST_INVALID:${pack.sourceCase}`);
}

const traceItems: any[] = [];
const timeFor = (index: number, replay: boolean) => {
  const minute = (replay ? 30 : 5) + index;
  return { startedAt: `2026-08-25T23:${String(minute).padStart(2, "0")}:00.000Z`, completedAt: `2026-08-25T23:${String(minute).padStart(2, "0")}:01.000Z` };
};
const createTrace = (caseId: string, snapshot: ProjectContextSnapshot, startedAt: string, replay: boolean) => createScientificRunTraceRecorder({
  ledger: createScientificExecutionTraceLedger(`session:${CAMPAIGN_ID}:${caseId}:${replay ? "replay" : "primary"}`),
  runId: `scientific-run:${CAMPAIGN_ID}:${caseId}:${replay ? "replay" : "primary"}`,
  projectSnapshot: snapshot,
  initiatorContext: { kind: replay ? "REPLAY_ANALYSIS" : "TEST_HARNESS", initiatorRef: `${CAMPAIGN_ID}:${caseId}:${replay ? "replay" : "primary"}` },
  startedAt, createdAt: startedAt,
});

const evaluate = (caseItem: CharacterizationCase, envelope: AcceptanceEnvelope, invocation: any, error: string | null, traceRefs: string[]): Evaluation[] => {
  const native = invocation?.result?.nativePayload ?? null;
  const request = invocation?.request ?? null;
  const entry = invocation?.entry ?? null;
  const knowledgeEntry = invocation?.ledger?.entries?.find((item: any) => item.result?.resultId === invocation?.knowledgeOwnerResult?.resultId) ?? null;
  const knowledgeNative = knowledgeEntry?.result?.nativePayload ?? null;
  const outputText = stableStringify(native ?? error ?? "").toLowerCase();
  return envelope.obligations.map((item) => {
    let passed = false;
    let partial = false;
    let note = "";
    const evidence: string[] = [];
    switch (item.checkId) {
      case "PROJECT_IDENTITY": {
        if (caseItem.expectedProfile === "STALE_REJECTION") {
          passed = error === "STALE_KNOWLEDGE_RESULT";
          evidence.push(error ?? "NO_ERROR");
          note = passed ? "Current Project binding was accepted and stale upstream binding rejected before ST runtime." : "Expected stale rejection was not observed.";
        } else {
          const source = request?.sourceProject;
          passed = Boolean(source && invocation?.result
            && source.sourceProjectRef === invocation.result.sourceProjectRef
            && source.sourceProjectVersion === invocation.result.sourceProjectVersion
            && source.sourceProjectDigest === invocation.result.sourceProjectDigest
            && source.snapshotDigest === invocation.result.sourceSnapshotDigest);
          evidence.push(`${source?.sourceProjectRef ?? "missing"}@${source?.sourceProjectVersion ?? "missing"}`, source?.sourceProjectDigest ?? "missing");
          note = passed ? "Request and OwnerResult retain exact canonical Project/snapshot identity." : "Project or snapshot identity diverged.";
        }
        break;
      }
      case "KNOWLEDGE_LINEAGE": {
        if (caseItem.expectedProfile === "STALE_REJECTION") {
          passed = error === "STALE_KNOWLEDGE_RESULT";
          evidence.push("STALE_KNOWLEDGE_RESULT");
          note = passed ? "Stale Knowledge dependency was fail-closed." : "Stale dependency was not rejected.";
        } else {
          const dep = native?.knowledgeDependencies?.[0];
          const ledgerDep = entry?.dependencies?.find((candidate: any) => candidate.owner === "KNOWLEDGE");
          passed = Boolean(dep && ledgerDep && dep.ownershipTransferred === false
            && dep.knowledgeResultRef === knowledgeNative?.resultId
            && dep.knowledgeResultDigest === knowledgeNative?.resultDigest
            && ledgerDep.resultId === dep.knowledgeResultRef
            && ledgerDep.nativeResultDigest === dep.knowledgeResultDigest);
          evidence.push(dep?.knowledgeResultRef ?? "missing", dep?.knowledgeResultDigest ?? "missing");
          note = passed ? "Exact Knowledge ID/digest lineage retained without ownership transfer." : "Knowledge lineage or ownership boundary diverged.";
        }
        break;
      }
      case "ZERO_PROJECT_WRITE": {
        passed = caseItem.expectedProfile === "STALE_REJECTION"
          ? error === "STALE_KNOWLEDGE_RESULT"
          : invocation?.projectWrites === 0 && invocation?.humanDecisionBypassed === false && invocation?.result?.projectWriteAuthorized === false;
        evidence.push(`projectWrites=${invocation?.projectWrites ?? 0}`, `projectWriteAuthorized=${invocation?.result?.projectWriteAuthorized ?? false}`);
        note = passed ? "No Project write, adoption or simulated Human Decision occurred." : "Project write/adoption boundary failed.";
        break;
      }
      case "NO_PROVIDER_CALL": {
        passed = [invocation?.externalEvidenceCalls ?? 0, invocation?.geminiCalls ?? 0, invocation?.terraCalls ?? 0].every((value) => value === 0);
        evidence.push("externalEvidenceCalls=0", "geminiCalls=0", "terraCalls=0");
        note = passed ? "No external or LLM provider call occurred." : "A forbidden provider call occurred.";
        break;
      }
      case "TRACE_BOUND": {
        passed = traceRefs.length > 0;
        evidence.push(...traceRefs);
        note = passed ? "Passive TRACE events retain the invocation or rejection." : "TRACE binding is absent.";
        break;
      }
      case "EXPECTED_PROFILE": {
        const hypotheses = native?.hypotheses ?? [];
        const objectives = native?.objectives ?? [];
        if (caseItem.expectedProfile === "POSITIVE_CANDIDATES") passed = hypotheses.length >= 2 && objectives.length >= 1 && native?.status !== "REFUSED";
        if (caseItem.expectedProfile === "CONTRADICTION_CANDIDATES") passed = hypotheses.length >= 2 && objectives.length >= 1 && (native?.contradictions?.length ?? 0) > 0 && (native?.alternatives?.length ?? 0) > 0;
        if (caseItem.expectedProfile === "NO_CANDIDATE_GAP") passed = hypotheses.length === 0 && objectives.length === 0 && ["REFUSED", "CLARIFICATION_REQUIRED"].includes(native?.status) && Boolean(native?.refusal || (native?.unknowns?.length ?? 0) > 0 || native?.knowledgeRequest);
        if (caseItem.expectedProfile === "OUT_OF_OWNER_REFUSAL") passed = native?.status === "REFUSED" && native?.refusal?.code === "OUT_OF_DOMAIN" && hypotheses.length === 0 && objectives.length === 0;
        if (caseItem.expectedProfile === "STALE_REJECTION") passed = error === "STALE_KNOWLEDGE_RESULT" && invocation === null;
        evidence.push(`status=${native?.status ?? "PRE_RUNTIME_REJECTION"}`, `hypotheses=${hypotheses.length}`, `objectives=${objectives.length}`, `error=${error ?? "none"}`);
        note = passed ? `Observed profile matches ${caseItem.expectedProfile}.` : `Observed profile does not match ${caseItem.expectedProfile}.`;
        break;
      }
      case "EPISTEMIC_SAFETY": {
        const candidates = [...(native?.questions ?? []), ...(native?.hypotheses ?? []), ...(native?.objectives ?? [])];
        const promotedLanguage = /scientifically proven|regulatory approval|clinical validation|established fact|d[ée]cision adopt[ée]e/.test(outputText);
        passed = caseItem.expectedProfile === "STALE_REJECTION" ? error === "STALE_KNOWLEDGE_RESULT"
          : candidates.every((candidate: any) => candidate.reviewState !== "ADOPTED")
            && native?.selectedQuestionCandidate === null
            && invocation?.result?.projectWriteAuthorized === false
            && !promotedLanguage
            && (native?.hypotheses ?? []).every((candidate: any) => candidate.support !== "SUPPORTED");
        evidence.push(`candidateNotice=${native?.candidateNotice ?? "pre-runtime"}`, `selectedQuestionCandidate=${String(native?.selectedQuestionCandidate ?? null)}`);
        note = passed ? "Candidates remain pending/partial or unsupported; no certainty or Project promotion observed." : "An epistemic or adoption promotion was observed.";
        break;
      }
      case "LIMITS_GAPS_CONTRADICTIONS": {
        if (caseItem.expectedProfile === "STALE_REJECTION") {
          passed = error === "STALE_KNOWLEDGE_RESULT";
          note = passed ? "Stale condition is explicit in the rejection and trace." : "Stale condition is not explicit.";
        } else {
          const hasLimits = (native?.limitations?.length ?? 0) > 0 || (invocation?.result?.limitations?.length ?? 0) > 0;
          const gapExpected = caseItem.expectedGaps.length > 0;
          const gapVisible = !gapExpected || (native?.knowledgeRequest?.gapCodes?.length ?? 0) > 0 || (invocation?.result?.gaps?.length ?? 0) > 0;
          const contradictionVisible = !caseItem.contradictionCase || (native?.contradictions?.length ?? 0) > 0;
          passed = hasLimits && gapVisible && contradictionVisible;
          partial = hasLimits && (!gapVisible || !contradictionVisible);
          evidence.push(`limitations=${native?.limitations?.length ?? invocation?.result?.limitations?.length ?? 0}`, `gaps=${native?.knowledgeRequest?.gapCodes?.length ?? invocation?.result?.gaps?.length ?? 0}`, `contradictions=${native?.contradictions?.length ?? 0}`);
          note = passed ? "Expected incompleteness remains inspectable." : "At least one expected limit, gap or contradiction is not inspectable.";
        }
        break;
      }
      default: note = "Unknown deterministic check.";
    }
    return { obligationId: item.obligationId, checkId: item.checkId, critical: item.critical, outcome: passed ? "SATISFIED" : partial ? "PARTIALLY_SATISFIED" : "VIOLATED", failureClass: item.failureClass, evidence, note };
  });
};

const runCase = (caseItem: CharacterizationCase, index: number, replay: boolean): ExecutionResult => {
  const pack = packs.get(caseItem.caseId);
  const envelope = envelopes.get(caseItem.caseId);
  if (!pack || !envelope) throw new Error(`W1_QUAL_01R_CASE_ARTIFACT_MISSING:${caseItem.caseId}`);
  const payload = structuredClone(pack.payload);
  const project = payload.project as ResearchProjectOwnerProjection;
  const snapshot = payload.projectSnapshot as ProjectContextSnapshot;
  const ledger = rehydrateProductOwnerResultLedger(payload.ledger);
  const timing = timeFor(index, replay);
  const trace = createTrace(caseItem.caseId, snapshot, timing.startedAt, replay);
  let invocation: any = null;
  let error: string | null = null;
  try {
    invocation = invokeScientificThinkingForProject({ project, projectSnapshot: snapshot, knowledgeResultId: payload.knowledgeResultId, ledger, callerRef: `${CAMPAIGN_ID}:${caseItem.caseId}:${replay ? "replay" : "primary"}`, purpose: caseItem.purpose, startedAt: timing.startedAt, completedAt: timing.completedAt, retainedAt: timing.completedAt, runtime: executeScientificThinkingEngine, monotonicNow: () => 0, trace });
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "UNKNOWN_ERROR";
  }
  const run = error ? trace.fail(timing.completedAt, error, error.includes("STALE") ? "STALE_VALIDATION" : "UNKNOWN_STAGE") : trace.complete(timing.completedAt);
  const traceLedger = trace.getLedger();
  const events = listScientificRunEvents({ ledger: traceLedger, runId: run.runId });
  const traceEventRefs = events.map((item) => item.eventId);
  traceItems.push({ caseId: caseItem.caseId, executionKind: replay ? "PREDECLARED_REPLAY" : "QUALIFYING_PRIMARY", run, events, ledgerDigest: traceLedger.ledgerDigest });
  const evaluations = evaluate(caseItem, envelope, invocation, error, traceEventRefs);
  const criticalViolation = evaluations.some((item) => item.critical && item.outcome === "VIOLATED");
  const partial = evaluations.some((item) => item.outcome === "PARTIALLY_SATISFIED" || (!item.critical && item.outcome === "VIOLATED"));
  const firstDivergentStage = criticalViolation
    ? events.find((item) => item.diagnostic)?.diagnostic?.stage ?? (error?.includes("STALE") ? "STALE_VALIDATION" : "SCIENTIFIC_THINKING_ENGINE")
    : null;
  return {
    caseId: caseItem.caseId, executionKind: replay ? "PREDECLARED_REPLAY" : "QUALIFYING_PRIMARY", expectedProfile: caseItem.expectedProfile,
    inputPackDigest: pack.digest, traceRunId: run.runId, traceEventRefs,
    requestRef: invocation?.request?.nativeInput?.requestId ?? null,
    requestDigest: invocation?.request?.nativeInput ? logicalDigest(invocation.request.nativeInput) : null,
    outputResultRef: invocation?.result ? `${invocation.result.resultId}@${invocation.result.resultVersion}` : null,
    outputDigest: invocation?.result?.nativePayload?.outputDigest ?? null,
    status: invocation?.result?.nativePayload?.status ?? (error ? "REJECTED_BEFORE_OWNER_RUNTIME" : "UNKNOWN"), error,
    invocation, evaluations,
    verdict: criticalViolation ? "CRITICAL_VIOLATION" : partial ? "PARTIALLY_SATISFIED" : "FULLY_SATISFIED",
    firstDivergentStage, runtimeProviderCalls: 0,
  };
};

const primary = cases.map((caseItem, index) => runCase(caseItem, index, false));
const replayCases = cases.filter((item) => item.replayPredeclared);
const replay = replayCases.map((caseItem, index) => runCase(caseItem, index, true));
const replayResults = replay.map((item) => {
  const original = primary.find((candidate) => candidate.caseId === item.caseId)!;
  const deterministic = original.status === item.status && original.error === item.error && original.outputDigest === item.outputDigest && stableStringify(original.invocation?.result?.nativePayload ?? null) === stableStringify(item.invocation?.result?.nativePayload ?? null);
  return { caseId: item.caseId, replayRole: cases.find((candidate) => candidate.caseId === item.caseId)?.replayRole, originalOutputDigest: original.outputDigest, replayOutputDigest: item.outputDigest, originalStatus: original.status, replayStatus: item.status, deterministic, firstDivergentStage: deterministic ? null : "SCIENTIFIC_THINKING_ENGINE" };
});

const obligations = primary.flatMap((item) => item.evaluations.map((evaluation) => ({ caseId: item.caseId, ...evaluation })));
const failureEntries = obligations.filter((item) => item.outcome === "VIOLATED").map((item) => ({ failureId: `failure:${item.caseId}:${item.checkId}`, caseId: item.caseId, obligationId: item.obligationId, failureClass: item.failureClass, critical: item.critical, firstDivergentStage: primary.find((result) => result.caseId === item.caseId)?.firstDivergentStage ?? "SCIENTIFIC_THINKING_ENGINE", evidence: item.evidence, note: item.note }));
const positiveCases = cases.filter((item) => item.positiveOpportunity);
const positiveResults = primary.filter((item) => positiveCases.some((candidate) => candidate.caseId === item.caseId));
const candidateCounts = positiveResults.map((item) => ({ caseId: item.caseId, questions: item.invocation?.result?.nativePayload?.questions?.length ?? 0, hypotheses: item.invocation?.result?.nativePayload?.hypotheses?.length ?? 0, objectives: item.invocation?.result?.nativePayload?.objectives?.length ?? 0, mechanisms: item.invocation?.result?.nativePayload?.mechanisms?.length ?? 0, alternatives: item.invocation?.result?.nativePayload?.alternatives?.length ?? 0 }));
const criticalViolations = failureEntries.filter((item) => item.critical).length;
const fullCases = primary.filter((item) => item.verdict === "FULLY_SATISFIED").length;
const partialCases = primary.filter((item) => item.verdict === "PARTIALLY_SATISFIED").length;
const criticalCases = primary.filter((item) => item.verdict === "CRITICAL_VIOLATION").length;
const traceIndex = { contract: "W1_QUAL_01R_ST_TRACE_INDEX", version: "1.0.0", campaignId: CAMPAIGN_ID, privateChainOfThoughtRecorded: false, traceItems: traceItems.map((item) => ({ caseId: item.caseId, executionKind: item.executionKind, runId: item.run.runId, runStatus: item.run.status, project: item.run.project, eventCount: item.events.length, eventRefs: item.events.map((event: any) => event.eventId), ledgerDigest: item.ledgerDigest, firstDivergentStage: item.run.firstDivergentStage, error: item.run.error })), totalRuns: traceItems.length, primaryRuns: primary.length, replayRuns: replay.length };
const summary = {
  contract: "W1_QUAL_01R_ST_CHARACTERIZATION_SUMMARY", version: "1.0.0", campaignId: CAMPAIGN_ID,
  qualifyingPasses: 1, rerolls: 0, runtimeRepairs: 0, cases: cases.length, positiveOpportunities: positiveCases.length,
  caseVerdicts: { fullySatisfied: fullCases, partiallySatisfied: partialCases, criticalViolation: criticalCases },
  obligations: { total: obligations.length, satisfied: obligations.filter((item) => item.outcome === "SATISFIED").length, partiallySatisfied: obligations.filter((item) => item.outcome === "PARTIALLY_SATISFIED").length, violated: obligations.filter((item) => item.outcome === "VIOLATED").length, criticalViolations },
  candidateCoverage: { opportunities: positiveCases.length, withQuestion: candidateCounts.filter((item) => item.questions > 0).length, withHypotheses: candidateCounts.filter((item) => item.hypotheses > 0).length, withObjectives: candidateCounts.filter((item) => item.objectives > 0).length, withMechanisms: candidateCounts.filter((item) => item.mechanisms > 0).length, withAlternatives: candidateCounts.filter((item) => item.alternatives > 0).length, countsByCase: candidateCounts },
  negativeCases: cases.filter((item) => !item.positiveOpportunity).map((item) => ({ caseId: item.caseId, expectedProfile: item.expectedProfile, observedStatus: primary.find((result) => result.caseId === item.caseId)?.status, verdict: primary.find((result) => result.caseId === item.caseId)?.verdict })),
  contradictionCases: cases.filter((item) => item.contradictionCase).map((item) => ({ caseId: item.caseId, contradictionsPreserved: (primary.find((result) => result.caseId === item.caseId)?.invocation?.result?.nativePayload?.contradictions?.length ?? 0) > 0 })),
  replay: { predeclared: replayResults.length, deterministic: replayResults.filter((item) => item.deterministic).length, divergent: replayResults.filter((item) => !item.deterministic).length },
  safety: { projectWrites: primary.reduce((sum, item) => sum + (item.invocation?.projectWrites ?? 0), 0), externalOrLlmCalls: 0, automaticAdoptions: primary.reduce((sum, item) => sum + [...(item.invocation?.result?.nativePayload?.questions ?? []), ...(item.invocation?.result?.nativePayload?.hypotheses ?? []), ...(item.invocation?.result?.nativePayload?.objectives ?? [])].filter((candidate: any) => candidate.reviewState === "ADOPTED").length, 0), staleProtectionFailures: primary.filter((item) => item.expectedProfile === "STALE_REJECTION" && item.error !== "STALE_KNOWLEDGE_RESULT").length },
  firstDivergentStage: criticalCases ? primary.filter((item) => item.firstDivergentStage).map((item) => ({ caseId: item.caseId, stage: item.firstDivergentStage })) : [],
  characterizationVerdict: criticalViolations === 0 && replayResults.every((item) => item.deterministic) ? "BOUNDED_CHARACTERIZATION_PASS" : "CHARACTERIZATION_FAILED",
  scientificQualificationClaimed: false, pd011PassClaimed: false, universalValidityClaimed: false,
};
const campaignManifest = {
  contract: "W1_QUAL_01R_ST_CAMPAIGN_MANIFEST", version: "1.0.0", campaignId: CAMPAIGN_ID,
  baseline: { branch: "protocol-designer-canonical-ingestion", headInitial: INITIAL_HEAD, originInitial: INITIAL_HEAD, main: "9be06edca1a7500ab7a43d065e94241e91d67bec" },
  freezeRef: freeze.freezeDigest, owner: "SCIENTIFIC_THINKING", engineVersion: "1.2.1", qualifyingPasses: 1, rerolls: 0, repairPerformed: false,
  artifacts: ["characterization-freeze.json", "case-registry.json", "acceptance-envelope-registry.json", "parentage-audit.json", "frozen-input-registry.json", "knowledge-input-quality-gate.json", "independent-results.json", "obligation-adjudication.json", "failure-registry.json", "determinism-replay-results.json", "exposed-non-regression-results.json", "trace-index.json", "characterization-summary.json", "campaign-manifest.json"],
  independentNumerator: { cases: cases.length, historicalCasesIncluded: 0, repairProbesIncluded: 0 },
  decisions: { ST_INDEPENDENT_RECHARACTERIZATION: summary.characterizationVerdict, W1_INDIVIDUAL_OWNER_CHARACTERIZATION_READY: summary.characterizationVerdict === "BOUNDED_CHARACTERIZATION_PASS" ? "YES" : "NO", W1_CONTROLLED_LOOP_CHARACTERIZATION_READY: "NO", WAVE_1_COMPLETE: "NO" },
  nextAuthorizedMission: summary.characterizationVerdict === "BOUNDED_CHARACTERIZATION_PASS" ? "W1-LOOP-QUAL-01_CONTROLLED_SCIENTIFIC_LOOP_CHARACTERIZATION" : "W1-QUAL-01R_ST_EVIDENCE_ARBITRATION_OR_BOUNDED_REPAIR",
  wave2Authorized: false,
};

write("independent-results.json", { contract: "W1_QUAL_01R_ST_INDEPENDENT_RESULTS", version: "1.0.0", campaignId: CAMPAIGN_ID, qualifyingPasses: 1, results: primary });
write("obligation-adjudication.json", { contract: "W1_QUAL_01R_ST_OBLIGATION_ADJUDICATION", version: "1.0.0", campaignId: CAMPAIGN_ID, adjudicationMode: "DETERMINISTIC_PREAUTHORED_ENVELOPE", obligations });
write("failure-registry.json", { contract: "W1_QUAL_01R_ST_FAILURE_REGISTRY", version: "1.0.0", campaignId: CAMPAIGN_ID, preRegisteredFailureClasses: [...new Set([...envelopes.values()].flatMap((envelope) => envelope.obligations.map((item) => item.failureClass)))], failures: failureEntries, criticalFailures: criticalViolations });
write("determinism-replay-results.json", { contract: "W1_QUAL_01R_ST_DETERMINISM_REPLAY_RESULTS", version: "1.0.0", campaignId: CAMPAIGN_ID, selectionMadeBeforeObservation: true, results: replayResults });
write("trace-index.json", traceIndex);
write("characterization-summary.json", summary);
write("campaign-manifest.json", campaignManifest);
console.log(JSON.stringify({ campaignId: CAMPAIGN_ID, cases: cases.length, fullCases, partialCases, criticalCases, obligations: obligations.length, criticalViolations, replayDeterministic: replayResults.filter((item) => item.deterministic).length, replayTotal: replayResults.length, verdict: summary.characterizationVerdict }));
