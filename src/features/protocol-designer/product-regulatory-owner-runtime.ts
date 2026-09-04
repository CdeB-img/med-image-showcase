import { logicalDigest, stableStringify, type KnowledgeOwnerHandoff } from "@/features/knowledge-engine";
import {
  REG000_CORPUS,
  parseRegulatoryResolutionInput,
  type RegulatoryResolutionInput,
  type RegulatoryResolutionResult,
} from "@/features/regulatory-resolution";
import {
  invokeRegulatoryOwnerFromSnapshot,
  type NativeOwnerInvocationObservation,
  type ProjectContextSnapshot,
  type ResearchProjectOwnerProjection,
  type SpecializedOwnerHandoffRequest,
  type SpecializedOwnerResult,
} from "@/features/research-project-construction";
import {
  PRODUCT_OWNER_RESULT_LEDGER_CONTRACT,
  PRODUCT_OWNER_RESULT_LEDGER_VERSION,
  appendProductOwnerInvocation,
  readProductOwnerResult,
  ownerResultNativeDigest,
  type ProductOwnerResultDependency,
  type ProductOwnerResultLedger,
  type ProductOwnerResultLedgerEntry,
} from "./product-owner-result-ledger";
import {
  recordOwnerInvocationTrace,
  recordRejectedHandoffTrace,
  type ScientificRunTraceRecorder,
} from "./scientific-execution-trace";

export type ProductRegulatoryOwnerInvocation = {
  ledger: Readonly<ProductOwnerResultLedger>;
  entry: Readonly<ProductOwnerResultLedgerEntry<RegulatoryResolutionInput, RegulatoryResolutionResult>>;
  request: Readonly<SpecializedOwnerHandoffRequest<RegulatoryResolutionInput>>;
  result: Readonly<SpecializedOwnerResult<RegulatoryResolutionResult>> | null;
  observation: Readonly<NativeOwnerInvocationObservation>;
  currentEvidence: Readonly<RegulatoryCurrentEvidenceProjection> | null;
  projectWrites: 0;
  humanDecisionBypassed: false;
  geminiCalls: 0;
  terraCalls: 0;
  webCalls: 0;
  externalRegulatoryCalls: 0;
};

export type RegulatoryCurrentEvidenceProjection = {
  adapterId: "REG001_CURRENT_KNOWLEDGE_EVIDENCE_ADAPTER";
  adapterVersion: "1.0.0";
  handoffId: string;
  handoffDigest: string;
  knowledgeResultRef: string;
  sources: readonly {
    sourceId: string;
    contentAvailability: "ANCHORED_CANDIDATE" | "METADATA_ONLY_OR_UNAVAILABLE";
    jurisdiction: string | null;
    sourceClass: string | null;
    currentOrHistorical: string | null;
    regulatoryApplicability: string | null;
    candidateRequirementPromoted: false;
  }[];
  limitations: readonly string[];
  uncertainty: readonly string[];
  projectWriteAuthorized: false;
  regulatoryRequirementCreated: false;
};

const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));

export const adaptCurrentKnowledgeEvidenceForReg = (input: {
  request: Readonly<RegulatoryResolutionInput>;
  handoff: Readonly<KnowledgeOwnerHandoff>;
}): { request: RegulatoryResolutionInput; evidence: Readonly<RegulatoryCurrentEvidenceProjection> } => {
  const { request, handoff } = input;
  if (handoff.targetOwner !== "REG"
    || handoff.status !== "CURRENT"
    || handoff.projectBinding?.projectId !== request.researchProjectId
    || handoff.projectBinding.projectVersion !== request.researchProjectVersion
    || handoff.projectBinding.projectDigest !== request.researchProjectDigest
    || handoff.readOnly !== true
    || handoff.ownershipTransferred !== false
    || handoff.certaintyIncreaseAuthorized !== false
    || handoff.projectWriteAuthorized !== false) throw new Error("REG_KNOWLEDGE_HANDOFF_INVALID_OR_STALE");
  const candidateBySource = new Map(handoff.candidates.map((candidate) => [candidate.sourceId, candidate]));
  const evidence: RegulatoryCurrentEvidenceProjection = {
    adapterId: "REG001_CURRENT_KNOWLEDGE_EVIDENCE_ADAPTER",
    adapterVersion: "1.0.0",
    handoffId: handoff.handoffId,
    handoffDigest: handoff.handoffDigest,
    knowledgeResultRef: handoff.knowledgeResultRef,
    sources: handoff.sourceRefs.map((sourceId) => {
      const candidate = candidateBySource.get(sourceId);
      return {
        sourceId,
        contentAvailability: candidate ? "ANCHORED_CANDIDATE" : "METADATA_ONLY_OR_UNAVAILABLE",
        jurisdiction: candidate?.jurisdiction ?? null,
        sourceClass: candidate?.sourceClass ?? null,
        currentOrHistorical: candidate?.currentOrHistorical ?? null,
        regulatoryApplicability: candidate?.regulatoryApplicability ?? null,
        candidateRequirementPromoted: false,
      };
    }),
    limitations: unique(handoff.limitations),
    uncertainty: unique([...handoff.uncertainty, ...handoff.gaps]),
    projectWriteAuthorized: false,
    regulatoryRequirementCreated: false,
  };
  const evidenceRef = `reg-current-evidence:${logicalDigest(evidence)}`;
  const adapted = parseRegulatoryResolutionInput({
    ...structuredClone(request),
    unknowns: [...request.unknowns, {
      unknownId: `reg-unknown:current-reference-applicability:${logicalDigest(handoff.handoffDigest)}`,
      field: "currentReferenceEvidence.applicability",
      reason: "Les références Knowledge sont conservées comme éléments courants candidats ; leur applicabilité réglementaire et toute exigence restent à qualifier par REG/Human Review.",
      provenance: unique([evidenceRef, handoff.handoffId, handoff.knowledgeResultRef, ...handoff.sourceRefs, ...handoff.candidateRefs]),
    }],
    provenance: unique([...request.provenance, evidenceRef, handoff.handoffId, handoff.knowledgeResultRef, ...handoff.sourceRefs, ...handoff.candidateRefs]),
  });
  return { request: adapted, evidence: deepFreeze(evidence) };
};

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach((nested) => deepFreeze(nested));
    Object.freeze(value);
  }
  return value;
};

const supportedJurisdictions = () => new Set([
  ...REG000_CORPUS.requirements.map((item) => item.jurisdiction),
  ...REG000_CORPUS.fundingPrograms.map((item) => item.jurisdiction),
].filter((jurisdiction) => jurisdiction !== "UNKNOWN"));

const assertNoUnsupportedJurisdiction = (request: RegulatoryResolutionInput) => {
  const declared = [...new Set([
    ...(request.jurisdiction.value ?? []),
    ...(request.internationalCharacteristics.centerJurisdictions.value ?? []),
  ])];
  const supported = supportedJurisdictions();
  const unsupported = declared.filter((jurisdiction) => jurisdiction !== "UNKNOWN" && !supported.has(jurisdiction));
  if (unsupported.length) throw new Error(`UNSUPPORTED_JURISDICTION:${unsupported.sort().join(",")}`);
};

type ProductRegulatoryOwnerInvocationInput = {
  project: ResearchProjectOwnerProjection;
  projectSnapshot: Readonly<ProjectContextSnapshot>;
  regulatoryRequest: RegulatoryResolutionInput;
  ledger: Readonly<ProductOwnerResultLedger>;
  callerRef: string;
  purpose: string;
  startedAt: string;
  completedAt: string;
  retainedAt?: string;
  runtime?: (request: RegulatoryResolutionInput) => RegulatoryResolutionResult;
  monotonicNow?: () => number;
  knowledgeHandoff?: Readonly<KnowledgeOwnerHandoff> | null;
};

const executeRegulatoryForProject = (input: ProductRegulatoryOwnerInvocationInput): ProductRegulatoryOwnerInvocation => {
  const projectBefore = stableStringify(input.project);
  if (input.project.projectId !== input.projectSnapshot.sourceProjectRef
    || input.project.versionId !== input.projectSnapshot.sourceProjectVersion
    || input.project.projectDigest !== input.projectSnapshot.sourceProjectDigest) {
    throw new Error("REGULATORY_PRODUCT_PROJECT_SNAPSHOT_MISMATCH");
  }
  const adaptedEvidence = input.knowledgeHandoff
    ? adaptCurrentKnowledgeEvidenceForReg({ request: input.regulatoryRequest, handoff: input.knowledgeHandoff })
    : null;
  const regulatoryRequest = adaptedEvidence?.request ?? input.regulatoryRequest;
  if (regulatoryRequest.researchProjectId !== input.projectSnapshot.sourceProjectRef
    || regulatoryRequest.researchProjectVersion !== input.projectSnapshot.sourceProjectVersion
    || regulatoryRequest.researchProjectDigest !== input.projectSnapshot.sourceProjectDigest) {
    throw new Error("REGULATORY_PRODUCT_REQUEST_SNAPSHOT_MISMATCH");
  }
  assertNoUnsupportedJurisdiction(regulatoryRequest);
  const invocation = invokeRegulatoryOwnerFromSnapshot({
    projectSnapshot: input.projectSnapshot,
    regulatoryRequest,
    purpose: input.purpose,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    runtime: input.runtime,
    monotonicNow: input.monotonicNow,
  });
  if (stableStringify(input.project) !== projectBefore || invocation.observation.projectWrites !== 0) {
    throw new Error("REGULATORY_PRODUCT_PROJECT_WRITE_BOUNDARY_VIOLATED");
  }
  const dependencies: ProductOwnerResultDependency[] = [];
  if (input.knowledgeHandoff) {
    const entry = [...input.ledger.entries].reverse().find((candidate) => candidate.result?.resultId === input.knowledgeHandoff!.knowledgeResultRef
      && candidate.result.owner === "KNOWLEDGE");
    if (!entry?.result) throw new Error("REG_KNOWLEDGE_RESULT_LEDGER_ENTRY_MISSING");
    const digest = ownerResultNativeDigest(entry.result);
    if (!digest || digest !== input.knowledgeHandoff.knowledgeResultDigest) throw new Error("REG_KNOWLEDGE_RESULT_DIGEST_MISMATCH");
    dependencies.push({ owner: "KNOWLEDGE", resultId: entry.result.resultId, resultVersion: entry.result.resultVersion, nativeResultDigest: digest });
  }
  const retained = appendProductOwnerInvocation({
    ledger: input.ledger,
    callerRef: input.callerRef,
    retainedAt: input.retainedAt ?? input.completedAt,
    request: invocation.request,
    result: invocation.result,
    observation: invocation.observation,
    dependencies,
  });
  return deepFreeze({
    ledger: retained.ledger,
    entry: retained.entry,
    request: retained.entry.request,
    result: retained.entry.result,
    observation: retained.entry.observation,
    currentEvidence: adaptedEvidence?.evidence ?? null,
    projectWrites: 0,
    humanDecisionBypassed: false,
    geminiCalls: 0,
    terraCalls: 0,
    webCalls: 0,
    externalRegulatoryCalls: 0,
  }) as ProductRegulatoryOwnerInvocation;
};

export const invokeRegulatoryForProject = (input: ProductRegulatoryOwnerInvocationInput & {
  trace?: ScientificRunTraceRecorder;
}): ProductRegulatoryOwnerInvocation => {
  try {
    const invocation = executeRegulatoryForProject(input);
    recordOwnerInvocationTrace(input.trace, {
      entry: invocation.entry,
      ledgerContract: PRODUCT_OWNER_RESULT_LEDGER_CONTRACT,
      ledgerVersion: PRODUCT_OWNER_RESULT_LEDGER_VERSION,
      handoffStage: "REG_REQUEST_BUILDING",
      nextExpectedHandoff: null,
    });
    return invocation;
  } catch (error) {
    const code = error instanceof Error ? error.message : "REG_PRODUCT_UNKNOWN_FAILURE";
    recordRejectedHandoffTrace(input.trace, {
      timestamp: input.completedAt,
      owner: "REGULATORY_RESOLUTION",
      stage: code.includes("PROJECT_SNAPSHOT") || code.includes("PROJECT_BINDING") ? "PROJECT_CONTEXT"
        : code.includes("LEDGER") ? "OWNER_RESULT_PERSISTENCE"
          : "REG_REQUEST_BUILDING",
      code,
      expectedProject: input.trace?.getRun().project ?? null,
      receivedProject: {
        projectId: input.projectSnapshot.sourceProjectRef,
        projectVersion: input.projectSnapshot.sourceProjectVersion,
        projectDigest: input.projectSnapshot.sourceProjectDigest,
        snapshotRef: input.projectSnapshot.snapshotDigest,
      },
      stale: code.includes("STALE"),
    });
    throw error;
  }
};

export const readProductRegulatoryOwnerResult = (input: {
  ledger: Readonly<ProductOwnerResultLedger>;
  resultId: string;
  currentProjectSnapshot: Readonly<ProjectContextSnapshot>;
}) => {
  try {
    return readProductOwnerResult({ ...input, expectedOwner: "REGULATORY_RESOLUTION" });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_OWNER_RESULT_NOT_FOUND") {
      throw new Error("PRODUCT_REGULATORY_OWNER_RESULT_NOT_FOUND");
    }
    throw error;
  }
};

export const requireCurrentProductRegulatoryOwnerResult = (input: Parameters<typeof readProductRegulatoryOwnerResult>[0]) => {
  const readback = readProductRegulatoryOwnerResult(input);
  if (readback.freshness.status === "STALE_OWNER_RESULT") throw new Error("STALE_REGULATORY_RESULT");
  return readback.entry.result as Readonly<SpecializedOwnerResult<RegulatoryResolutionResult>>;
};
