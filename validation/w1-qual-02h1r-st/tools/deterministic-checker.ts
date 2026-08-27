/* eslint-disable @typescript-eslint/no-explicit-any -- technical checker reads immutable cross-owner evidence */
import { logicalDigest } from "@/features/knowledge-engine";
import { ownerResultNativeDigest } from "@/features/protocol-designer/product-owner-result-ledger";
import type { ScientificThinkingOutput } from "@/features/scientific-thinking";
import {
  checkContradictionPreservation,
  checkOriginalExpressionContract,
  checkTraceCompleteness,
  serializeStructuredConflict,
  type TechnicalCheck,
} from "../../w1-qual-01h1t/tools/deterministic-checker";

export const H1R_DETERMINISTIC_CHECKER_VERSION = "1.2.0" as const;

export const CURRENT_ST_LIMITATION_CONTRACT = Object.freeze({
  outputTopLevelLimitations: "ABSENT_BY_STRICT_SCHEMA",
  requiredHandoffProjection: "ScientificThinkingOutput.handoff.limitations",
  candidateScopedProjection: "ScientificThinkingOutput.hypotheses[*].limitations",
  persistedOwnerProjection: "SpecializedOwnerResult.limitations",
  scientificJudgmentPerformed: false,
});

export const H1R_CHECKER_BOUNDARY = Object.freeze({
  operation: "POST_FREEZE_TECHNICAL_CONTRACT_ALIGNMENT",
  scientificJudgmentPerformed: false,
  changesScientificContent: false,
  resolvesContradictions: false,
  promotesCandidates: false,
});

export type CampaignEFrozenCase = {
  caseId: string;
  casePurpose: string;
  scientificQuestion: string;
  expectedExecution: "OWNER_EXECUTION_REQUIRED";
};

export type CampaignEFrozenPack = {
  sourceCase: string;
  digest: string;
  projectBinding: {
    projectId: string;
    projectVersion: string;
    projectDigest: string;
    snapshotRef: string;
  };
  knowledgeResultBinding: {
    resultId: string;
    resultVersion: string;
    resultDigest: string;
    ownerResultRef: string;
  };
};

const includesAll = (observed: readonly string[], expected: readonly string[]) => (
  expected.every((item) => observed.includes(item))
);

const exactJson = (observed: unknown, expected: unknown) => (
  JSON.stringify(observed) === JSON.stringify(expected)
);

const check = (
  checkId: string,
  outcome: "PASS" | "FAIL" | "NOT_APPLICABLE",
  observed: unknown,
  expected: unknown,
): TechnicalCheck => ({
  checkId,
  outcome,
  observed: typeof observed === "string" ? observed : JSON.stringify(observed),
  expected: typeof expected === "string" ? expected : JSON.stringify(expected),
  scientificJudgmentPerformed: false,
});

type LimitationProjection = {
  handoff: Pick<ScientificThinkingOutput["handoff"], "limitations">;
  hypotheses: Array<Pick<ScientificThinkingOutput["hypotheses"][number], "hypothesisId" | "limitations">>;
};

export const readCurrentStLimitationRepresentation = (input: {
  output: LimitationProjection | null;
  ownerResultLimitations: readonly string[];
}) => ({
  handoffLimitations: [...(input.output?.handoff.limitations ?? [])],
  hypothesisLimitations: (input.output?.hypotheses ?? []).map((hypothesis) => ({
    hypothesisId: hypothesis.hypothesisId,
    limitations: [...hypothesis.limitations],
  })),
  ownerResultLimitations: [...input.ownerResultLimitations],
});

export const checkLimitationPreservation = (input: {
  requiredLimitations: readonly string[];
  output: LimitationProjection | null;
  ownerResultLimitations: readonly string[];
  applicable?: boolean;
}): TechnicalCheck => {
  if (input.applicable === false) {
    return check(
      "LIMITATION_PRESERVATION",
      "NOT_APPLICABLE",
      readCurrentStLimitationRepresentation(input),
      "OWNER_EXECUTION_NOT_APPLICABLE",
    );
  }
  const observed = readCurrentStLimitationRepresentation(input);
  const missingFromHandoff = input.requiredLimitations.filter(
    (limitation) => !observed.handoffLimitations.includes(limitation),
  );
  const missingFromOwnerResult = input.requiredLimitations.filter(
    (limitation) => !observed.ownerResultLimitations.includes(limitation),
  );
  return check(
    "LIMITATION_PRESERVATION",
    missingFromHandoff.length === 0 && missingFromOwnerResult.length === 0 ? "PASS" : "FAIL",
    { ...observed, missingFromHandoff, missingFromOwnerResult },
    {
      requiredLimitations: input.requiredLimitations,
      contract: CURRENT_ST_LIMITATION_CONTRACT,
    },
  );
};

export const runCampaignEDeterministicChecks = (input: {
  caseItem: CampaignEFrozenCase;
  pack: CampaignEFrozenPack;
  invocation: any | null;
  error: string | null;
  ownerInvocationCount: number;
  ownerResultCount: number;
  traceEventTypes: string[];
}) => {
  const { caseItem, pack, invocation, error, ownerInvocationCount, ownerResultCount, traceEventTypes } = input;
  const result = invocation?.result ?? null;
  const output = (result?.nativePayload ?? null) as ScientificThinkingOutput | null;
  const request = invocation?.request?.nativeInput ?? null;
  const knowledgeResult = invocation?.knowledgeOwnerResult?.nativePayload ?? null;
  const dependency = output?.knowledgeDependencies[0] ?? null;
  const ledgerDependency = invocation?.entry?.dependencies?.find((item: any) => item.owner === "KNOWLEDGE") ?? null;
  const expectedSources = (knowledgeResult?.sources ?? []).map((item: any) => item.sourceId);
  const expectedEvidence = (knowledgeResult?.evidence ?? []).map((item: any) => item.evidenceId);
  const expectedAssertions = (knowledgeResult?.applicableAssertions ?? []).map((item: any) => item.stableId);
  const expectedStatements = (knowledgeResult?.documentaryStatements ?? []).map((item: any) => item.statementId);
  const expectedGaps = (knowledgeResult?.gaps ?? []).map((item: any) => ({
    gapRef: item.gapId,
    code: item.code,
    explanation: item.explanation,
    resumeCondition: item.resumeCondition,
  }));
  const expectedGapCodes = expectedGaps.map((item: any) => item.code);
  const observedGapCodes = [
    ...(output?.knowledgeRequest?.gapCodes ?? []),
    ...(result?.gaps ?? []),
  ].map(String);
  const expectedConflicts = (knowledgeResult?.controversies ?? []).map((item: any) => ({
    conflictId: item.conflictId,
    state: item.state,
    explanation: item.explanation,
  }));
  const expectedInputControversies = (knowledgeResult?.controversies ?? []).map((item: any) => ({
    conflictRef: item.conflictId,
    state: item.state,
    explanation: item.explanation,
    positionRefs: [...(item.positionIds ?? [])],
  }));
  const expectedLimitations = [...(knowledgeResult?.limitations ?? [])].map(String);
  const requestProject = invocation?.request ? {
    projectId: invocation.request.sourceProject.sourceProjectRef,
    projectVersion: invocation.request.sourceProject.sourceProjectVersion,
    projectDigest: invocation.request.sourceProject.sourceProjectDigest,
    snapshotRef: invocation.request.sourceProject.snapshotDigest,
  } : null;
  const resultProject = result ? {
    projectId: result.sourceProjectRef,
    projectVersion: result.sourceProjectVersion,
    projectDigest: result.sourceProjectDigest,
    snapshotRef: result.sourceSnapshotDigest,
  } : null;
  const expectedProject = pack.projectBinding;
  const questionCheck = checkOriginalExpressionContract({
    question: caseItem.scientificQuestion,
    purpose: caseItem.casePurpose,
    originalExpression: request?.originalExpression ?? null,
    validatedReformulation: request?.validatedReformulation ?? null,
  });
  const contradictionCheck = checkContradictionPreservation({
    expectedConflicts,
    observedContradictions: output?.contradictions ?? [],
  });
  const limitationCheck = checkLimitationPreservation({
    requiredLimitations: expectedLimitations,
    output,
    ownerResultLimitations: result?.limitations ?? [],
  });
  const noStructuralPromotion = Boolean(output)
    && [...output.questions, ...output.hypotheses, ...output.objectives]
      .every((candidate: any) => candidate.reviewState === "PENDING")
    && output.selectedQuestionCandidate === null
    && output.handoff.status !== "AUTHORIZED"
    && output.candidateNotice === "ALL_GENERATED_SCIENTIFIC_CONTENT_REQUIRES_HUMAN_REVIEW";
  const lineageIntact = Boolean(
    dependency
    && dependency.knowledgeOwnerResultRef === pack.knowledgeResultBinding.ownerResultRef
    && dependency.knowledgeResultRef === pack.knowledgeResultBinding.resultId
    && dependency.knowledgeResultRevision === Number(pack.knowledgeResultBinding.resultVersion)
    && dependency.knowledgeResultDigest === pack.knowledgeResultBinding.resultDigest
    && ledgerDependency?.resultId === pack.knowledgeResultBinding.resultId
    && ledgerDependency?.resultVersion === pack.knowledgeResultBinding.resultVersion
    && ledgerDependency?.nativeResultDigest === pack.knowledgeResultBinding.resultDigest,
  );
  const sourceLineageIntact = Boolean(
    dependency
    && exactJson(dependency.assertionRefs, expectedAssertions)
    && exactJson(dependency.documentaryStatementRefs, expectedStatements)
    && exactJson(dependency.evidenceRefs, expectedEvidence)
    && exactJson(dependency.sourceRefs, expectedSources)
    && includesAll(output?.provenance.sourceRefs ?? [], [
      pack.knowledgeResultBinding.ownerResultRef,
      ...expectedAssertions,
      ...expectedStatements,
      ...expectedEvidence,
      ...expectedSources,
    ]),
  );
  const gapPreserved = exactJson(request?.knowledge.gaps ?? [], expectedGaps)
    && includesAll(observedGapCodes, expectedGapCodes);
  const contradictionInputPreserved = exactJson(
    request?.knowledge.controversies ?? [],
    expectedInputControversies,
  );
  const ownershipIntact = Boolean(
    result?.owner === "SCIENTIFIC_THINKING"
    && result.projectWriteAuthorized === false
    && output?.provenance.engineVersion === "1.2.2"
    && output.knowledgeDependencies.every((item) => item.ownershipTransferred === false),
  );
  const resultDigestVerified = Boolean(result && output)
    && ownerResultNativeDigest(result) === output.outputDigest;
  const traceCheck = checkTraceCompleteness({
    eventTypes: traceEventTypes,
    expectedExecution: "OWNER_EXECUTION_REQUIRED",
  });
  const resultPersisted = Boolean(
    result
    && invocation?.entry?.result?.resultId === result.resultId
    && traceEventTypes.includes("RESULT_PERSISTED"),
  );

  const checks: TechnicalCheck[] = [
    check("PROJECT_ID", requestProject?.projectId === expectedProject.projectId && resultProject?.projectId === expectedProject.projectId ? "PASS" : "FAIL", { request: requestProject?.projectId ?? null, result: resultProject?.projectId ?? null }, expectedProject.projectId),
    check("PROJECT_VERSION", requestProject?.projectVersion === expectedProject.projectVersion && resultProject?.projectVersion === expectedProject.projectVersion ? "PASS" : "FAIL", { request: requestProject?.projectVersion ?? null, result: resultProject?.projectVersion ?? null }, expectedProject.projectVersion),
    check("PROJECT_DIGEST", requestProject?.projectDigest === expectedProject.projectDigest && resultProject?.projectDigest === expectedProject.projectDigest ? "PASS" : "FAIL", { request: requestProject?.projectDigest ?? null, result: resultProject?.projectDigest ?? null }, expectedProject.projectDigest),
    check("SNAPSHOT_REF", requestProject?.snapshotRef === expectedProject.snapshotRef && resultProject?.snapshotRef === expectedProject.snapshotRef ? "PASS" : "FAIL", { request: requestProject?.snapshotRef ?? null, result: resultProject?.snapshotRef ?? null }, expectedProject.snapshotRef),
    check("KNOWLEDGE_RESULT_BINDING", lineageIntact ? "PASS" : "FAIL", { output: dependency, ledger: ledgerDependency }, pack.knowledgeResultBinding),
    check("SOURCE_EVIDENCE_REFS", sourceLineageIntact ? "PASS" : "FAIL", { dependency, provenance: output?.provenance.sourceRefs ?? [] }, { expectedAssertions, expectedStatements, expectedEvidence, expectedSources }),
    check("GAP_PRESERVATION", gapPreserved ? "PASS" : "FAIL", { request: request?.knowledge.gaps ?? [], outputCodes: observedGapCodes }, { expectedGaps, expectedGapCodes }),
    limitationCheck,
    check("KNOWLEDGE_CONTRADICTION_INPUT_BINDING", contradictionInputPreserved ? "PASS" : "FAIL", request?.knowledge.controversies ?? [], expectedInputControversies),
    contradictionCheck,
    check("EXPECTED_EXECUTION", ownerInvocationCount === 1 && error === null ? "PASS" : "FAIL", { ownerInvocationCount, error }, { ownerInvocationCount: 1, error: null }),
    check("OWNER_RESULT_PRODUCTION", ownerResultCount === 1 ? "PASS" : "FAIL", ownerResultCount, 1),
    check("OWNER_RESULT_DIGEST", resultDigestVerified ? "PASS" : "FAIL", result && output ? { native: ownerResultNativeDigest(result), output: output.outputDigest } : null, "MATCH"),
    check("OWNER_RESULT_PERSISTENCE", resultPersisted ? "PASS" : "FAIL", { entryResultId: invocation?.entry?.result?.resultId ?? null, eventTypes: traceEventTypes }, result?.resultId ?? "RESULT_REQUIRED"),
    check("OWNERSHIP_METADATA", ownershipIntact ? "PASS" : "FAIL", { owner: result?.owner ?? null, projectWriteAuthorized: result?.projectWriteAuthorized ?? null, engineVersion: output?.provenance.engineVersion ?? null }, { owner: "SCIENTIFIC_THINKING", projectWriteAuthorized: false, engineVersion: "1.2.2", ownershipTransferred: false }),
    check("PROJECT_WRITES", invocation?.projectWrites === 0 ? "PASS" : "FAIL", invocation?.projectWrites ?? null, 0),
    questionCheck,
    check("STALE_MISMATCH", "NOT_APPLICABLE", "NO_STALE_CASE_AUTHORIZED_IN_CAMPAIGN_E", "NOT_APPLICABLE"),
    traceCheck,
    check("NO_AUTOMATIC_ADOPTION", noStructuralPromotion ? "PASS" : "FAIL", { selectedQuestionCandidate: output?.selectedQuestionCandidate ?? null, handoffStatus: output?.handoff.status ?? null, reviewStates: output ? [...output.questions, ...output.hypotheses, ...output.objectives].map((candidate: any) => candidate.reviewState) : [] }, "ALL_CANDIDATES_PENDING_AND_HANDOFF_NOT_AUTHORIZED"),
  ];

  return {
    checkerVersion: H1R_DETERMINISTIC_CHECKER_VERSION,
    checkerOperation: H1R_CHECKER_BOUNDARY.operation,
    scientificJudgmentPerformed: false,
    inputDigest: logicalDigest({ caseItem, packDigest: pack.digest }),
    checks,
    globalControls: {
      IDENTITY_INTEGRITY: checks.slice(0, 4).every((item) => item.outcome === "PASS") ? "PASS" : "FAIL",
      LINEAGE_INTEGRITY: lineageIntact && sourceLineageIntact ? "PASS" : "FAIL",
      GAP_PRESERVATION: gapPreserved ? "PASS" : "FAIL",
      LIMITATION_PRESERVATION: limitationCheck.outcome,
      CONTRADICTION_PRESERVATION: contradictionInputPreserved && contradictionCheck.outcome === "PASS" ? "PASS" : "FAIL",
      OWNERSHIP_BOUNDARY: ownershipIntact ? "PASS" : "FAIL",
      PROJECT_WRITES: invocation?.projectWrites === 0 ? "PASS" : "FAIL",
      RESULT_PERSISTENCE: resultPersisted ? "PASS" : "FAIL",
      TRACE_COMPLETENESS: traceCheck.outcome,
      NO_AUTOMATIC_ADOPTION: noStructuralPromotion ? "PASS" : "FAIL",
      STALE_PROTECTION: "NOT_APPLICABLE",
    },
    technicalFailure: checks.some((item) => item.outcome === "FAIL"),
  };
};

export { serializeStructuredConflict };
