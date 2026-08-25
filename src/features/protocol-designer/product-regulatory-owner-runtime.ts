import { stableStringify } from "@/features/knowledge-engine";
import {
  REG000_CORPUS,
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
  projectWrites: 0;
  humanDecisionBypassed: false;
  geminiCalls: 0;
  terraCalls: 0;
  webCalls: 0;
  externalRegulatoryCalls: 0;
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
};

const executeRegulatoryForProject = (input: ProductRegulatoryOwnerInvocationInput): ProductRegulatoryOwnerInvocation => {
  const projectBefore = stableStringify(input.project);
  if (input.project.projectId !== input.projectSnapshot.sourceProjectRef
    || input.project.versionId !== input.projectSnapshot.sourceProjectVersion
    || input.project.projectDigest !== input.projectSnapshot.sourceProjectDigest) {
    throw new Error("REGULATORY_PRODUCT_PROJECT_SNAPSHOT_MISMATCH");
  }
  if (input.regulatoryRequest.researchProjectId !== input.projectSnapshot.sourceProjectRef
    || input.regulatoryRequest.researchProjectVersion !== input.projectSnapshot.sourceProjectVersion
    || input.regulatoryRequest.researchProjectDigest !== input.projectSnapshot.sourceProjectDigest) {
    throw new Error("REGULATORY_PRODUCT_REQUEST_SNAPSHOT_MISMATCH");
  }
  assertNoUnsupportedJurisdiction(input.regulatoryRequest);
  const invocation = invokeRegulatoryOwnerFromSnapshot({
    projectSnapshot: input.projectSnapshot,
    regulatoryRequest: input.regulatoryRequest,
    purpose: input.purpose,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    runtime: input.runtime,
    monotonicNow: input.monotonicNow,
  });
  if (stableStringify(input.project) !== projectBefore || invocation.observation.projectWrites !== 0) {
    throw new Error("REGULATORY_PRODUCT_PROJECT_WRITE_BOUNDARY_VIOLATED");
  }
  const retained = appendProductOwnerInvocation({
    ledger: input.ledger,
    callerRef: input.callerRef,
    retainedAt: input.retainedAt ?? input.completedAt,
    request: invocation.request,
    result: invocation.result,
    observation: invocation.observation,
    dependencies: [],
  });
  return deepFreeze({
    ledger: retained.ledger,
    entry: retained.entry,
    request: retained.entry.request,
    result: retained.entry.result,
    observation: retained.entry.observation,
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
