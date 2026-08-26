/* eslint-disable @typescript-eslint/no-explicit-any -- immutable Level 3 evidence has versioned JSON shapes */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  H1T_DETERMINISTIC_CHECKER_VERSION,
  checkContradictionPreservation,
  checkOriginalExpressionContract,
  checkTraceCompleteness,
  type StructuredConflict,
  type TechnicalCheck,
} from "./deterministic-checker";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const historicalRoot = `${root}validation/w1-qual-01h1-st`;
const evidenceRoot = `${root}validation/w1-qual-01h1t`;
const campaignId = "W1-QUAL-01H-ST-2026-08-26-D";
const baseline = "d866e492194e38ed262722b91456bc1a80fb9cf7";

const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const writeJson = (name: string, value: unknown) => writeFileSync(
  `${evidenceRoot}/${name}`,
  `${JSON.stringify(value, null, 2)}\n`,
  "utf8",
);
const sha256 = (path: string) => `sha256-${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
const relative = (path: string) => path.slice(root.length);
const allFiles = (directory: string): string[] => readdirSync(directory)
  .sort()
  .flatMap((name) => {
    const path = `${directory}/${name}`;
    return statSync(path).isDirectory() ? allFiles(path) : [path];
  });

const cases = readJson(`${historicalRoot}/case-registry.json`);
const packs = readJson(`${historicalRoot}/frozen-input-registry.json`);
const executions = readJson(`${historicalRoot}/execution-results.json`);
const historicalChecks = readJson(`${historicalRoot}/deterministic-checks.json`);
const adjudication = readJson(`${historicalRoot}/human-adjudication-template.json`);
const campaignFreeze = readJson(`${historicalRoot}/campaign-freeze.json`);
const genericTestOutputPath = "/tmp/w1-qual-01h1t-generic-tests.json";
const genericTestOutput = readJson(genericTestOutputPath);

if (genericTestOutput.numFailedTests !== 0 || genericTestOutput.numPassedTests < 9) {
  throw new Error("H1T_GENERIC_CHECKER_TESTS_NOT_GREEN");
}
if (
  campaignFreeze.freezeDigest !== "ke1-f8f6b4620ab40c36"
  || campaignFreeze.deterministicChecker.version !== "1.0.0"
  || campaignFreeze.deterministicChecker.digest !== "sha256-ad9b7790428f40e45230ed1d1774bfa02a623f5a82e9d3f14df8249c0a269a5c"
) {
  throw new Error("H1T_HISTORICAL_FREEZE_IDENTITY_MISMATCH");
}

const caseById = new Map(cases.cases.map((item: any) => [item.caseId, item]));
const packById = new Map(packs.packs.map((item: any) => [item.sourceCase, item]));
const executionById = new Map(executions.results.map((item: any) => [item.caseId, item]));

const structuredConflicts = (pack: any): StructuredConflict[] => (
  (pack.payload?.ledger?.entries ?? [])
    .flatMap((entry: any) => entry.result?.nativePayload?.controversies ?? [])
    .map((conflict: any) => ({
      conflictId: String(conflict.conflictId),
      state: String(conflict.state),
      explanation: String(conflict.explanation),
    }))
);

const replacementCheck = (caseId: string, checkId: string): TechnicalCheck | null => {
  const caseItem: any = caseById.get(caseId);
  const pack: any = packById.get(caseId);
  const execution: any = executionById.get(caseId);
  if (!caseItem || !pack || !execution) throw new Error(`H1T_EVIDENCE_MISSING:${caseId}`);
  const applicable = caseItem.expectedExecution === "OWNER_EXECUTION_REQUIRED";
  if (checkId === "PROJECT_QUESTION_SOURCE_BINDING") {
    return checkOriginalExpressionContract({
      question: caseItem.question,
      purpose: caseItem.purpose,
      originalExpression: execution.stRequest?.originalExpression ?? null,
      validatedReformulation: execution.stRequest?.validatedReformulation ?? null,
      applicable,
    });
  }
  if (checkId === "TRACE_COMPLETENESS") {
    return checkTraceCompleteness({
      eventTypes: (execution.trace?.events ?? []).map((event: any) => String(event.eventType)),
      expectedExecution: caseItem.expectedExecution,
    });
  }
  if (checkId === "CONTRADICTION_PRESERVATION") {
    return checkContradictionPreservation({
      expectedConflicts: structuredConflicts(pack),
      observedContradictions: (execution.stOutput?.contradictions ?? []).map(String),
      applicable,
    });
  }
  return null;
};

const readbackCases = historicalChecks.cases.map((historicalCase: any) => {
  const checks = historicalCase.checks.map((oldCheck: any) => replacementCheck(historicalCase.caseId, oldCheck.checkId) ?? oldCheck);
  return {
    caseId: historicalCase.caseId,
    readbackKind: "POST_HOC_TECHNICAL_READBACK",
    checks,
    technicalFailure: checks.some((check: any) => check.outcome === "FAIL"),
  };
});

const flatChecks = readbackCases.flatMap((item: any) => item.checks);
const countOutcome = (outcome: string) => flatChecks.filter((item: any) => item.outcome === outcome).length;
const counts = {
  controls: flatChecks.length,
  pass: countOutcome("PASS"),
  fail: countOutcome("FAIL"),
  notApplicable: countOutcome("NOT_APPLICABLE"),
};

const globalCheckMap = {
  UNSUPPORTED_STRUCTURAL_PROMOTION: null,
  KNOWLEDGE_GAP_LOSS: null,
  CONTRADICTION_LOSS: "CONTRADICTION_PRESERVATION",
  PROJECT_QUESTION_DRIFT: "PROJECT_QUESTION_SOURCE_BINDING",
  LINEAGE_BREAK: null,
  OWNERSHIP_LEAK: null,
  PROJECT_WRITES: null,
  STALE_PROTECTION_FAILURE: null,
  TRACE_INCOMPLETE: "TRACE_COMPLETENESS",
} as const;

const globalSummary = Object.fromEntries(Object.entries(globalCheckMap).map(([control, checkId]) => {
  if (!checkId) return [control, historicalChecks.globalSummary[control]];
  const outcomes = readbackCases.map((item: any) => item.checks.find((check: any) => check.checkId === checkId)?.outcome);
  const summary = {
    pass: outcomes.filter((outcome: string) => outcome === "PASS").length,
    fail: outcomes.filter((outcome: string) => outcome === "FAIL").length,
    notApplicable: outcomes.filter((outcome: string) => outcome === "NOT_APPLICABLE").length,
    verdict: outcomes.includes("FAIL") ? "FAIL" : "PASS",
  };
  return [control, summary];
}));

const contractMetadata: Record<string, { failureClass: string; interpretation: string; reason: string; reference: string }> = {
  PROJECT_QUESTION_SOURCE_BINDING: {
    failureClass: "ORIGINAL_EXPRESSION_CONTRACT_MISMATCH",
    interpretation: "validatedReformulation must preserve the case question; originalExpression must equal validatedReformulation plus one space plus caller purpose.",
    reason: "The historical checker compared originalExpression to the question alone; the frozen request exactly matches the current product builder projection.",
    reference: "src/features/research-project-construction/scientific-reasoning-owner-chain.ts:167-179",
  },
  TRACE_COMPLETENESS: {
    failureClass: "TRACE_EVENT_TAXONOMY_MISMATCH",
    interpretation: "The canonical owner-result persistence event is RESULT_PERSISTED.",
    reason: "The historical checker required OWNER_RESULT_PERSISTED, which is absent from the current TRACE event union; the frozen nominal traces contain the canonical event in order.",
    reference: "src/features/protocol-designer/scientific-execution-trace.ts:26-39,408-422,1112-1124",
  },
  CONTRADICTION_PRESERVATION: {
    failureClass: "KNOWLEDGE_CONFLICT_PROJECTION_MISMATCH",
    interpretation: "Each Knowledge controversy is projected exactly as conflictId:state:explanation and all three fields remain significant.",
    reason: "The historical checker searched for explanation-only strings; frozen ST outputs retain the complete typed Knowledge conflict projection.",
    reference: "src/features/knowledge-engine/types.ts:315-320; src/features/scientific-thinking/input.ts:117-131",
  },
};

const oldFailures = historicalChecks.cases.flatMap((historicalCase: any) => historicalCase.checks
  .filter((check: any) => check.outcome === "FAIL")
  .map((oldCheck: any) => {
    const newCheck = readbackCases.find((item: any) => item.caseId === historicalCase.caseId)?.checks
      .find((check: any) => check.checkId === oldCheck.checkId);
    const metadata = contractMetadata[oldCheck.checkId];
    if (!newCheck || !metadata) throw new Error(`H1T_UNEXPECTED_HISTORICAL_FAILURE:${historicalCase.caseId}:${oldCheck.checkId}`);
    return {
      oldFailureId: `${historicalCase.caseId}:${oldCheck.checkId}`,
      caseId: historicalCase.caseId,
      oldFailureClass: metadata.failureClass,
      oldResult: "FAIL",
      correctedContractInterpretation: metadata.interpretation,
      newResult: newCheck.outcome,
      reason: metadata.reason,
      governingContractReference: metadata.reference,
    };
  }));

const remainingFailures = readbackCases.flatMap((item: any) => item.checks
  .filter((check: any) => check.outcome === "FAIL")
  .map((check: any) => ({ caseId: item.caseId, checkId: check.checkId, observed: check.observed, expected: check.expected })));

const allHumanQuestionsPending = adjudication.cases.every((item: any) => (
  ["H1", "H2", "H3", "H4", "H5", "H6", "H7", "H8"].every((key) => item[key] === "PENDING")
));

const immutableFiles = [
  ...allFiles(historicalRoot),
  `${root}docs/implementation/w1-qual-01h1-st-human-review-packet.md`,
  `${root}src/features/scientific-thinking/engine.ts`,
  `${root}src/features/scientific-thinking/types.ts`,
  `${root}src/features/protocol-designer/product-scientific-thinking-owner-runtime.ts`,
];
const immutableDigests = immutableFiles.map((path) => ({ path: relative(path), sha256: sha256(path) }));
const evidenceSetDigest = `sha256-${createHash("sha256")
  .update(immutableDigests.map((item) => `${item.path}:${item.sha256}`).join("\n"))
  .digest("hex")}`;
const checkerPath = `${evidenceRoot}/tools/deterministic-checker.ts`;
const checkerDigest = sha256(checkerPath);
const historicalCheckerDigest = sha256(`${historicalRoot}/tools/deterministic-checker.ts`);
const stRuntimeDigestChecks = Object.values(campaignFreeze.stRuntime).map((item: any) => ({
  path: item.path,
  expected: item.sha256,
  observed: sha256(`${root}${item.path}`),
}));
const historicalTrackedDiff = execFileSync(
  "git",
  ["diff", "--name-only", baseline, "--", "validation/w1-qual-01h1-st", "docs/implementation/w1-qual-01h1-st-human-review-packet.md"],
  { cwd: root, encoding: "utf8" },
).trim();
if (
  historicalCheckerDigest !== campaignFreeze.deterministicChecker.digest
  || stRuntimeDigestChecks.some((item) => item.expected !== item.observed)
  || historicalTrackedDiff !== ""
) {
  throw new Error("H1T_IMMUTABLE_EVIDENCE_OR_RUNTIME_MISMATCH");
}

writeJson("checker-contract-audit.json", {
  contract: "W1_QUAL_01H1T_CHECKER_CONTRACT_AUDIT",
  version: "1.0.0",
  classification: "LEVEL_3_IMPLEMENTATION_EVIDENCE",
  baseline,
  historicalCampaignId: campaignId,
  historicalDecision: "W1_QUAL_01H1_REVIEW_PACKET_NOT_READY",
  contractAmbiguity: false,
  defects: [
    { id: "A", class: contractMetadata.PROJECT_QUESTION_SOURCE_BINDING.failureClass, expectedCurrentContract: contractMetadata.PROJECT_QUESTION_SOURCE_BINDING.interpretation, historicalCheckerContract: "originalExpression equals question only", verdict: "HISTORICAL_CHECKER_DEFECT_CONFIRMED", reference: contractMetadata.PROJECT_QUESTION_SOURCE_BINDING.reference },
    { id: "B", class: contractMetadata.TRACE_COMPLETENESS.failureClass, expectedCurrentContract: contractMetadata.TRACE_COMPLETENESS.interpretation, historicalCheckerContract: "OWNER_RESULT_PERSISTED", verdict: "HISTORICAL_CHECKER_DEFECT_CONFIRMED", reference: contractMetadata.TRACE_COMPLETENESS.reference },
    { id: "C", class: contractMetadata.CONTRADICTION_PRESERVATION.failureClass, expectedCurrentContract: contractMetadata.CONTRADICTION_PRESERVATION.interpretation, historicalCheckerContract: "explanation-only containment", verdict: "HISTORICAL_CHECKER_DEFECT_CONFIRMED", reference: contractMetadata.CONTRADICTION_PRESERVATION.reference },
  ],
  productRuntimeModified: false,
  scientificJudgmentPerformed: false,
});

writeJson("checker-version.json", {
  contract: "W1_QUAL_01H1T_DETERMINISTIC_CHECKER_IDENTITY",
  version: "1.0.0",
  checkerVersion: H1T_DETERMINISTIC_CHECKER_VERSION,
  checkerDigest,
  path: relative(checkerPath),
  historicalCheckerVersion: "1.0.0",
  historicalCheckerDigest,
  historicalFreezeDigest: "ke1-f8f6b4620ab40c36",
  historicalIdentityOverwritten: false,
});

writeJson("checker-generic-test-results.json", {
  contract: "W1_QUAL_01H1T_CHECKER_GENERIC_TEST_RESULTS",
  version: "1.0.0",
  nature: "SYNTHETIC_TECHNICAL_TESTS_NOT_SCIENTIFIC_EVIDENCE",
  command: "npx vitest run src/features/protocol-designer/functional-reset/__tests__/w1-qual-01h1t-deterministic-checker.test.ts --reporter=json",
  testSuites: genericTestOutput.numTotalTestSuites,
  tests: genericTestOutput.numTotalTests,
  passed: genericTestOutput.numPassedTests,
  failed: genericTestOutput.numFailedTests,
  pending: genericTestOutput.numPendingTests,
  success: genericTestOutput.success,
  executedBeforeCampaignReadback: true,
  stInvocations: 0,
  providerCalls: 0,
  llmCalls: 0,
});

writeJson("campaign-d-immutable-evidence-digests.json", {
  contract: "W1_QUAL_01H1T_CAMPAIGN_D_IMMUTABLE_EVIDENCE_DIGESTS",
  version: "1.0.0",
  campaignId,
  freezeDigest: "ke1-f8f6b4620ab40c36",
  stVersion: "1.2.1",
  evidenceSetDigest,
  files: immutableDigests,
  stRuntimeDigestChecks,
  historicalTrackedDiffAgainstBaseline: [],
  baselineGitTreeMatch: historicalTrackedDiff === "",
  historicalEvidenceModified: false,
  stRuntimeModified: false,
  campaignOutputsModified: false,
  humanReviewEnvelopesModified: false,
});

writeJson("post-hoc-technical-readback.json", {
  contract: "W1_QUAL_01H1T_POST_HOC_TECHNICAL_READBACK",
  version: "1.0.0",
  classification: "LEVEL_3_IMPLEMENTATION_EVIDENCE",
  readbackKind: "POST_HOC_TECHNICAL_READBACK",
  campaignId,
  campaignFreezeDigest: "ke1-f8f6b4620ab40c36",
  checkerVersion: H1T_DETERMINISTIC_CHECKER_VERSION,
  checkerDigest,
  cases: readbackCases,
  globalSummary,
  counts,
  technicalReadbackCases: readbackCases.length,
  stReruns: 0,
  stInvocations: 0,
  humanAdjudications: 0,
  providerCalls: 0,
  llmCalls: 0,
  networkCalls: 0,
  scientificPassProduced: false,
  scientificJudgmentPerformed: false,
});

writeJson("old-failures-to-new-results.json", {
  contract: "W1_QUAL_01H1T_OLD_FAILURE_RECONCILIATION",
  version: "1.0.0",
  campaignId,
  historicalCounts: historicalChecks.counts,
  oldFailures: oldFailures.length,
  reconciliations: oldFailures,
});

writeJson("remaining-failures.json", {
  contract: "W1_QUAL_01H1T_REMAINING_FAILURES",
  version: "1.0.0",
  campaignId,
  count: remainingFailures.length,
  failures: remainingFailures,
  newCheckerOnlyDefect: false,
});

const ready = counts.fail === 0
  && oldFailures.length === 25
  && oldFailures.every((item: any) => item.newResult === "PASS")
  && readbackCases.length === 12
  && allHumanQuestionsPending;

writeJson("packet-release-decision.json", {
  contract: "W1_QUAL_01H1T_PACKET_RELEASE_DECISION",
  version: "1.0.0",
  decision: ready
    ? "W1_QUAL_01H1T_HUMAN_REVIEW_PACKET_RELEASED_FOR_MANUAL_ADJUDICATION"
    : "W1_QUAL_01H1T_HUMAN_REVIEW_PACKET_STILL_NOT_READY",
  historicalH1Decision: "W1_QUAL_01H1_REVIEW_PACKET_NOT_READY",
  historicalH1DecisionPreserved: true,
  packetTechnicalRelease: ready ? "READY" : "NOT_READY",
  packetPath: "docs/implementation/w1-qual-01h1-st-human-review-packet.md",
  packetScientificContentModified: false,
  campaignEvidenceComplete: readbackCases.length === 12,
  traceSufficientForBoundedManualPacketRelease: counts.fail === 0,
  outputsImmutable: true,
  humanReviewCases: adjudication.cases.length,
  humanAdjudicationCompleted: 0,
  humanAdjudicationPending: adjudication.cases.length,
  allH1ToH8Pending: allHumanQuestionsPending,
  scientificVerdictProduced: false,
  h2Authorized: false,
  nextAuthorizedMission: ready
    ? "NONE_PENDING_MANUAL_ST_CASE_ADJUDICATION"
    : "NONE_PENDING_EXPLICIT_HUMAN_PROGRAM_DECISION",
  wave1Complete: false,
  wave2Authorized: false,
});

if (!ready) throw new Error("H1T_PACKET_RELEASE_GATE_NOT_READY");

console.log(JSON.stringify({ checkerVersion: H1T_DETERMINISTIC_CHECKER_VERSION, checkerDigest, counts, oldFailures: oldFailures.length, remainingFailures: remainingFailures.length, packetTechnicalRelease: "READY" }, null, 2));
