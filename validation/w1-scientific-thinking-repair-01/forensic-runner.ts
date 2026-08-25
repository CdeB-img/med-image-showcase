import { readFileSync } from "node:fs";
import { logicalDigest } from "@/features/knowledge-engine";
import { executeScientificThinkingEngine } from "@/features/scientific-thinking";
import { rehydrateProductOwnerResultLedger } from "@/features/protocol-designer/product-owner-result-ledger";
import { invokeScientificThinkingForProject } from "@/features/protocol-designer/product-scientific-thinking-owner-runtime";
import {
  createScientificExecutionTraceLedger,
  createScientificRunTraceRecorder,
  listScientificRunEvents,
} from "@/features/protocol-designer/scientific-execution-trace";

const packs = JSON.parse(readFileSync("validation/w1-qual-01/frozen-input-registry.json", "utf8")).packs;
const historicalResults = JSON.parse(readFileSync("validation/w1-qual-01/scientific-thinking-results.json", "utf8")).results;
const summaries = [];
const caseIds = process.argv.includes("--all-historical-st")
  ? ["ST-CARDIAC-01", "ST-SPECTRAL-01", "ST-NEURO-01", "ST-UNSUPPORTED-01"]
  : ["ST-CARDIAC-01", "ST-NEURO-01"];

for (const [index, caseId] of caseIds.entries()) {
  const pack = structuredClone(packs.find((item: { sourceCase: string }) => item.sourceCase === caseId));
  const payload = pack.payload;
  const material = {
    version: pack.version,
    sourceCase: pack.sourceCase,
    ownerUnderTest: pack.ownerUnderTest,
    provenance: pack.provenance,
    purpose: pack.purpose,
    payload: pack.payload,
  };
  const startedAt = `2026-08-25T23:0${index}:00.000Z`;
  const completedAt = `2026-08-25T23:0${index}:01.000Z`;
  const trace = createScientificRunTraceRecorder({
    ledger: createScientificExecutionTraceLedger(`session:W1-ST-REPAIR-01:${caseId}:forensic`),
    runId: `scientific-run:W1-ST-REPAIR-01:${caseId}:forensic`,
    projectSnapshot: payload.projectSnapshot,
    initiatorContext: { kind: "TEST_HARNESS", initiatorRef: `W1-ST-REPAIR-01:${caseId}:forensic` },
    startedAt,
    createdAt: startedAt,
  });
  const invocation = invokeScientificThinkingForProject({
    project: payload.project,
    projectSnapshot: payload.projectSnapshot,
    knowledgeResultId: payload.knowledgeResultId,
    ledger: rehydrateProductOwnerResultLedger(payload.frozenOwnerLedger),
    callerRef: "W1-ST-REPAIR-01:FORENSIC",
    purpose: pack.purpose,
    startedAt,
    completedAt,
    runtime: executeScientificThinkingEngine,
    monotonicNow: (() => { let value = 0; return () => ++value; })(),
    trace,
  });
  const run = trace.complete(completedAt);
  const events = listScientificRunEvents({ ledger: trace.getLedger(), runId: run.runId });
  const native = invocation.result?.nativePayload;
  const historicalNative = historicalResults.find((item: { caseId: string }) => item.caseId === caseId)?.result?.nativePayload;
  const differingHistoricalFields = native && historicalNative
    ? [...new Set([...Object.keys(native), ...Object.keys(historicalNative)])]
      .filter((key) => JSON.stringify(native[key as keyof typeof native]) !== JSON.stringify(historicalNative[key]))
    : [];
  const normalizedQuestion = invocation.request.nativeInput.validatedReformulation
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  summaries.push({
    caseId,
    packDigest: pack.digest,
    packDigestValid: logicalDigest(material) === pack.digest,
    project: {
      id: payload.projectSnapshot.sourceProjectRef,
      version: payload.projectSnapshot.sourceProjectVersion,
      digest: payload.projectSnapshot.sourceProjectDigest,
      snapshot: payload.projectSnapshot.snapshotDigest,
    },
    knowledge: {
      id: invocation.knowledgeOwnerResult?.resultId,
      version: invocation.knowledgeOwnerResult?.resultVersion,
      digest: invocation.knowledgeOwnerResult?.nativePayload.resultDigest,
      coverage: invocation.knowledgeOwnerResult?.nativePayload.coverageStatus,
      assertions: invocation.knowledgeOwnerResult?.nativePayload.applicableAssertions.length,
      contradictions: invocation.knowledgeOwnerResult?.nativePayload.controversies.length,
    },
    stInput: {
      requestId: invocation.request.nativeInput.requestId,
      validatedReformulation: invocation.request.nativeInput.validatedReformulation,
      scientificObjectCount: invocation.request.nativeInput.scientificObjectTerms.length,
      populationCount: invocation.request.nativeInput.population.length,
      phenomenaCount: invocation.request.nativeInput.phenomena.length,
      outcomeCount: invocation.request.nativeInput.outcomes.length,
      methods: invocation.request.nativeInput.methodsMentioned,
      knowledgeSupport: invocation.request.nativeInput.knowledge.support,
      knowledgeRefs: {
        ownerResultRef: invocation.request.nativeInput.knowledge.ownerResultRef,
        assertionRefs: invocation.request.nativeInput.knowledge.assertionRefs,
        evidenceRefs: invocation.request.nativeInput.knowledge.evidenceRefs,
        sourceIds: invocation.request.nativeInput.knowledge.sourceIds,
        contradictionRefs: invocation.request.nativeInput.knowledge.contradictionRefs,
      },
    },
    candidateEligibility: {
      questionForm: /\?\s*$/.test(invocation.request.nativeInput.validatedReformulation),
      runtimeRelationLexeme: /(associ|lie|predit|compar|difference|progression|evolution|impact|depend|relation|correl)/.test(normalizedQuestion),
      typedContextAvailable: invocation.request.nativeInput.scientificObjectTerms.length > 1
        && invocation.request.nativeInput.population.length > 0,
      knowledgeAvailable: Boolean(invocation.request.nativeInput.knowledge.resultId),
      knowledgeSupport: invocation.request.nativeInput.knowledge.support,
    },
    output: {
      resultId: invocation.result?.resultId,
      outputDigest: native?.outputDigest,
      status: native?.status,
      questions: native?.questions.map((question) => ({
        id: question.questionId,
        testability: question.testability,
        text: question.text,
      })),
      hypothesisCount: native?.hypotheses.length,
      objectiveCount: native?.objectives.length,
      alternativeCount: native?.alternatives.length,
      gaps: invocation.result?.gaps,
      limitations: invocation.result?.limitations,
      projectContribution: invocation.result?.projectContribution,
      projectWriteAuthorized: invocation.result?.projectWriteAuthorized,
    },
    historicalComparison: {
      historicalOutputDigest: historicalNative?.outputDigest ?? null,
      differingTopLevelFields: differingHistoricalFields,
      historicalQuestions: historicalNative?.questions ?? null,
      currentQuestions: native?.questions ?? null,
    },
    ownerPackaging: {
      owner: invocation.result?.owner,
      dependencyCount: invocation.entry.dependencies.length,
      projectWrites: invocation.projectWrites,
      observationStatus: invocation.observation.status,
    },
    trace: {
      runId: run.runId,
      status: run.status,
      eventCount: events.length,
      eventRefs: events.map((event) => event.eventId),
      stages: events.map((event) => event.diagnostic?.stage).filter(Boolean),
      allEventsMarkPrivateReasoningStoredFalse: events.every(
        (event) => event.privateReasoningStored === false,
      ),
    },
  });
}

const output = process.argv.includes("--comparison-only")
  ? summaries.map((item) => ({
    caseId: item.caseId,
    output: {
      outputDigest: item.output.outputDigest,
      status: item.output.status,
      hypothesisCount: item.output.hypothesisCount,
      objectiveCount: item.output.objectiveCount,
      alternativeCount: item.output.alternativeCount,
    },
    historicalComparison: item.historicalComparison,
  }))
  : summaries;
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
