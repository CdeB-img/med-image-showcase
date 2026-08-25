/* eslint-disable @typescript-eslint/no-explicit-any -- objective checker reads immutable cross-owner evidence */
import { logicalDigest } from "@/features/knowledge-engine";
import { ownerResultNativeDigest } from "@/features/protocol-designer/product-owner-result-ledger";
import type { HumanReviewCase, FrozenInputPack } from "./authoring";

export const DETERMINISTIC_CHECKER_VERSION = "1.0.0" as const;

export type CheckOutcome = "PASS" | "FAIL" | "NOT_APPLICABLE";

export type DeterministicCheck = {
  checkId: string;
  outcome: CheckOutcome;
  observed: string;
  expected: string;
  scientificJudgmentPerformed: false;
};

const check = (checkId: string, outcome: CheckOutcome, observed: string, expected: string): DeterministicCheck => ({
  checkId, outcome, observed, expected, scientificJudgmentPerformed: false,
});

const includesAll = (observed: string[], expected: string[]) => expected.every((item) => observed.includes(item));

export const runDeterministicChecks = (input: {
  caseItem: HumanReviewCase;
  pack: FrozenInputPack;
  invocation: any | null;
  error: string | null;
  ownerInvocationCount: number;
  ownerResultCount: number;
  traceEventTypes: string[];
}) => {
  const { caseItem, pack, invocation, error, ownerInvocationCount, ownerResultCount, traceEventTypes } = input;
  const result = invocation?.result ?? null;
  const output = result?.nativePayload ?? null;
  const request = invocation?.request?.nativeInput ?? null;
  const expectedOwnerExecution = caseItem.expectedExecution === "OWNER_EXECUTION_REQUIRED";
  const expectedOwnerResult = expectedOwnerExecution;
  const expectedProject = pack.projectBinding;
  const requestProject = invocation?.request ? {
    projectId: invocation.request.sourceProject?.sourceProjectRef,
    projectVersion: invocation.request.sourceProject?.sourceProjectVersion,
    projectDigest: invocation.request.sourceProject?.sourceProjectDigest,
    snapshotRef: invocation.request.sourceProject?.snapshotDigest,
  } : null;
  const resultProject = result ? {
    projectId: result.sourceProjectRef,
    projectVersion: result.sourceProjectVersion,
    projectDigest: result.sourceProjectDigest,
  } : null;
  const knowledgeDependency = output?.knowledgeDependencies?.[0] ?? null;
  const ledgerDependency = invocation?.entry?.dependencies?.find((item: any) => item.owner === "KNOWLEDGE") ?? null;
  const outputGaps = [
    ...(output?.knowledgeRequest?.gapCodes ?? []),
    ...(result?.gaps ?? []),
  ].map(String);
  const outputContradictions = [
    ...(output?.contradictions ?? []),
    ...(result?.contradictions ?? []),
  ].map(String);
  const outputLimitations = [
    ...(output?.limitations ?? []),
    ...(result?.limitations ?? []),
  ].map(String);
  const outputSourceRefs = [
    ...(output?.provenance?.sourceRefs ?? []),
    ...(knowledgeDependency?.sourceRefs ?? []),
    ...(result?.evidenceRefs ?? []),
    ...(result?.provenance ?? []),
  ].map(String);
  const exactTrace = expectedOwnerExecution
    ? ["RUN_STARTED", "HANDOFF_STARTED", "HANDOFF_ACCEPTED", "OWNER_INVOCATION_STARTED", "OWNER_INVOCATION_COMPLETED", "OWNER_RESULT_PERSISTED", "RUN_COMPLETED"]
    : ["RUN_STARTED", "HANDOFF_STARTED", "STALE_RESULT_REJECTED", "HANDOFF_REJECTED", "RUN_FAILED"];
  const traceComplete = exactTrace.every((event) => traceEventTypes.includes(event));
  const resultDigestVerified = result ? ownerResultNativeDigest(result) === output?.outputDigest : false;
  const allCandidates = output ? [
    ...(output.questions ?? []),
    ...(output.hypotheses ?? []),
    ...(output.objectives ?? []),
  ] : [];
  const noStructuralPromotion = output ? allCandidates.every((item: any) => item.reviewState === "PENDING")
    && output.selectedQuestionCandidate === null
    && output.handoff?.status !== "AUTHORIZED"
    && output.candidateNotice === "ALL_GENERATED_SCIENTIFIC_CONTENT_REQUIRES_HUMAN_REVIEW" : true;
  const gapPreserved = expectedOwnerExecution ? includesAll(outputGaps, pack.gaps) : true;
  const contradictionPreserved = expectedOwnerExecution ? includesAll(outputContradictions, pack.contradictions) : true;
  const limitationPreserved = expectedOwnerExecution ? includesAll(outputLimitations, pack.limitations) : true;
  const questionPreserved = expectedOwnerExecution ? request?.originalExpression === caseItem.question
    && request?.validatedReformulation === caseItem.question : true;
  const lineageIntact = expectedOwnerExecution ? Boolean(
    knowledgeDependency
    && knowledgeDependency.knowledgeOwnerResultRef === pack.knowledgeResultBinding.ownerResultRef
    && knowledgeDependency.knowledgeResultRef === pack.knowledgeResultBinding.resultId
    && knowledgeDependency.knowledgeResultRevision === Number(pack.knowledgeResultBinding.resultVersion)
    && knowledgeDependency.knowledgeResultDigest === pack.knowledgeResultBinding.resultDigest
    && ledgerDependency?.resultId === pack.knowledgeResultBinding.resultId
    && ledgerDependency?.resultVersion === pack.knowledgeResultBinding.resultVersion
    && ledgerDependency?.nativeResultDigest === pack.knowledgeResultBinding.resultDigest
  ) : true;
  const ownershipIntact = expectedOwnerExecution ? Boolean(
    result?.owner === "SCIENTIFIC_THINKING"
    && result?.projectWriteAuthorized === false
    && output?.provenance?.engineVersion === "1.2.1"
    && output?.knowledgeDependencies?.every((item: any) => item.ownershipTransferred === false)
  ) : true;
  const projectWrites = invocation?.projectWrites ?? 0;
  const staleProtection = caseItem.expectedExecution === "PRE_OWNER_REJECTION_EXPECTED"
    ? error === caseItem.expectedRejectionCode && ownerInvocationCount === 0 && ownerResultCount === 0
    : true;

  const checks: DeterministicCheck[] = [
    check("PROJECT_ID", expectedOwnerExecution ? (requestProject?.projectId === expectedProject.projectId && resultProject?.projectId === expectedProject.projectId ? "PASS" : "FAIL") : "NOT_APPLICABLE", JSON.stringify({ request: requestProject?.projectId ?? null, result: resultProject?.projectId ?? null }), expectedProject.projectId),
    check("PROJECT_VERSION", expectedOwnerExecution ? (requestProject?.projectVersion === expectedProject.projectVersion && resultProject?.projectVersion === expectedProject.projectVersion ? "PASS" : "FAIL") : "NOT_APPLICABLE", JSON.stringify({ request: requestProject?.projectVersion ?? null, result: resultProject?.projectVersion ?? null }), expectedProject.projectVersion),
    check("PROJECT_DIGEST", expectedOwnerExecution ? (requestProject?.projectDigest === expectedProject.projectDigest && resultProject?.projectDigest === expectedProject.projectDigest ? "PASS" : "FAIL") : "NOT_APPLICABLE", JSON.stringify({ request: requestProject?.projectDigest ?? null, result: resultProject?.projectDigest ?? null }), expectedProject.projectDigest),
    check("SNAPSHOT_REF", expectedOwnerExecution ? (requestProject?.snapshotRef === expectedProject.snapshotRef ? "PASS" : "FAIL") : "NOT_APPLICABLE", requestProject?.snapshotRef ?? "NONE", expectedProject.snapshotRef),
    check("KNOWLEDGE_RESULT_BINDING", expectedOwnerExecution ? (lineageIntact ? "PASS" : "FAIL") : "NOT_APPLICABLE", JSON.stringify({ output: knowledgeDependency, ledger: ledgerDependency }), JSON.stringify(pack.knowledgeResultBinding)),
    check("PROVENANCE", expectedOwnerExecution ? (output?.provenance?.knowledgeResultRef === pack.knowledgeResultBinding.resultId && output?.provenance?.sourceRefs?.length >= pack.sourceRefs.length ? "PASS" : "FAIL") : "NOT_APPLICABLE", JSON.stringify(output?.provenance ?? null), "Exact Knowledge result and source refs retained"),
    check("DEPENDENCY_REFS", expectedOwnerExecution ? (lineageIntact ? "PASS" : "FAIL") : "NOT_APPLICABLE", JSON.stringify(invocation?.entry?.dependencies ?? []), pack.knowledgeResultBinding.ownerResultRef),
    check("SOURCE_EVIDENCE_REFS", expectedOwnerExecution ? (includesAll(outputSourceRefs, [...pack.sourceRefs, ...pack.evidenceRefs]) ? "PASS" : "FAIL") : "NOT_APPLICABLE", JSON.stringify(outputSourceRefs), JSON.stringify([...pack.sourceRefs, ...pack.evidenceRefs])),
    check("GAP_PRESERVATION", expectedOwnerExecution ? (gapPreserved ? "PASS" : "FAIL") : "NOT_APPLICABLE", JSON.stringify(outputGaps), JSON.stringify(pack.gaps)),
    check("LIMITATION_PRESERVATION", expectedOwnerExecution ? (limitationPreserved ? "PASS" : "FAIL") : "NOT_APPLICABLE", JSON.stringify(outputLimitations), JSON.stringify(pack.limitations)),
    check("CONTRADICTION_PRESERVATION", expectedOwnerExecution ? (contradictionPreserved ? "PASS" : "FAIL") : "NOT_APPLICABLE", JSON.stringify(outputContradictions), JSON.stringify(pack.contradictions)),
    check("EXPECTED_EXECUTION", expectedOwnerExecution ? (ownerInvocationCount === 1 ? "PASS" : "FAIL") : (ownerInvocationCount === 0 ? "PASS" : "FAIL"), String(ownerInvocationCount), expectedOwnerExecution ? "1" : "0"),
    check("OWNER_RESULT_PRODUCTION", expectedOwnerResult ? (ownerResultCount === 1 ? "PASS" : "FAIL") : (ownerResultCount === 0 ? "PASS" : "FAIL"), String(ownerResultCount), expectedOwnerResult ? "1" : "0"),
    check("OWNER_RESULT_DIGEST", expectedOwnerExecution ? (resultDigestVerified ? "PASS" : "FAIL") : "NOT_APPLICABLE", result ? `${ownerResultNativeDigest(result)} / ${output?.outputDigest}` : "NONE", "Native digest matches output digest"),
    check("OWNERSHIP_METADATA", expectedOwnerExecution ? (ownershipIntact ? "PASS" : "FAIL") : "NOT_APPLICABLE", JSON.stringify({ owner: result?.owner ?? null, projectWriteAuthorized: result?.projectWriteAuthorized ?? null }), "SCIENTIFIC_THINKING, no ownership transfer, projectWriteAuthorized=false"),
    check("PROJECT_WRITES", projectWrites === 0 ? "PASS" : "FAIL", String(projectWrites), "0"),
    check("PROJECT_QUESTION_SOURCE_BINDING", expectedOwnerExecution ? (questionPreserved ? "PASS" : "FAIL") : "NOT_APPLICABLE", JSON.stringify({ originalExpression: request?.originalExpression ?? null, validatedReformulation: request?.validatedReformulation ?? null }), caseItem.question),
    check("STALE_MISMATCH", caseItem.expectedExecution === "PRE_OWNER_REJECTION_EXPECTED" ? (staleProtection ? "PASS" : "FAIL") : "NOT_APPLICABLE", JSON.stringify({ error, ownerInvocationCount, ownerResultCount }), caseItem.expectedRejectionCode ?? "N/A"),
    check("TRACE_COMPLETENESS", traceComplete ? "PASS" : "FAIL", JSON.stringify(traceEventTypes), JSON.stringify(exactTrace)),
  ];

  const globalControls = {
    UNSUPPORTED_STRUCTURAL_PROMOTION: expectedOwnerExecution ? (noStructuralPromotion ? "PASS" : "FAIL") : "NOT_APPLICABLE",
    KNOWLEDGE_GAP_LOSS: expectedOwnerExecution ? (gapPreserved ? "PASS" : "FAIL") : "NOT_APPLICABLE",
    CONTRADICTION_LOSS: expectedOwnerExecution ? (contradictionPreserved ? "PASS" : "FAIL") : "NOT_APPLICABLE",
    PROJECT_QUESTION_DRIFT: expectedOwnerExecution ? (questionPreserved ? "PASS" : "FAIL") : "NOT_APPLICABLE",
    LINEAGE_BREAK: expectedOwnerExecution ? (lineageIntact ? "PASS" : "FAIL") : "NOT_APPLICABLE",
    OWNERSHIP_LEAK: expectedOwnerExecution ? (ownershipIntact ? "PASS" : "FAIL") : "NOT_APPLICABLE",
    PROJECT_WRITES: projectWrites === 0 ? "PASS" : "FAIL",
    STALE_PROTECTION_FAILURE: caseItem.expectedExecution === "PRE_OWNER_REJECTION_EXPECTED" ? (staleProtection ? "PASS" : "FAIL") : "NOT_APPLICABLE",
    TRACE_INCOMPLETE: traceComplete ? "PASS" : "FAIL",
  } as const;
  return {
    checkerVersion: DETERMINISTIC_CHECKER_VERSION,
    scientificJudgmentPerformed: false,
    inputDigest: logicalDigest({ caseItem, packDigest: pack.digest }),
    checks,
    globalControls,
    technicalFailure: checks.some((item) => item.outcome === "FAIL"),
  };
};
