import type { DataManagementReasoningResult } from "@/features/data-analysis-planning";
import { logicalDigest } from "@/features/knowledge-engine";
import type { FunctionalResetQueryNavigation } from "@/features/query-navigation";
import { buildProjectContextSnapshot, type ResearchProjectOwnerProjection } from "@/features/research-project-construction";
import { invokeDataManagementForProjectSnapshot } from "@/features/protocol-designer/product-data-management-owner-runtime";
import type { ProductOwnerResultLedger } from "@/features/protocol-designer/product-owner-result-ledger";
import { createScientificRunTraceRecorder, type ScientificExecutionTraceLedger } from "@/features/protocol-designer/scientific-execution-trace";

export const STANDARD_DATA_MANAGEMENT_INTERACTION_VERSION = "1.0.0" as const;

export type StandardDataManagementPresentation = {
  presentationId: string;
  resultRef: string;
  title: string;
  introduction: string;
  collectionRequirementCount: number;
  releaseStatus: "RELEASED" | "REQUIRED_UNRESOLVED";
  informationNeeds: readonly string[];
  limitations: readonly string[];
  plainText: string;
};

export type StandardDataManagementInteraction = {
  contract: "FUNCTIONAL_RESET_DATA_MANAGEMENT_INTERACTION";
  contractVersion: typeof STANDARD_DATA_MANAGEMENT_INTERACTION_VERSION;
  owner: "DATA_MANAGEMENT";
  capabilityId: "DATA_MANAGEMENT_PLANNING";
  ownerResultRef: string;
  ownerResultVersion: string;
  sourceActionRef: string;
  sourceProjectRef: string;
  sourceProjectVersion: string;
  sourceProjectDigest: string;
  sourceCdmResultDigest: string;
  presentationTurnRef: string;
  traceRunId: string | null;
  status: "ACTIVE" | "STALE";
  staleReason: string | null;
  projectWriteAuthorized: false;
};

export const isDataManagementQueryDispatch = (navigation: Readonly<FunctionalResetQueryNavigation>) => {
  const action = navigation.currentAction;
  return Boolean(action
    && action.owner === "DATA_MANAGEMENT"
    && action.affectedDecisionRefs.length === 1
    && action.affectedDecisionRefs[0] === "project-section:TEMPORALITY"
    && action.affectedBranchRefs.includes("project-facet:TEMPORALITY:DATA_MANAGEMENT_OPERATIONS")
    && navigation.selection.selected?.capabilityRef === "DATA_MANAGEMENT_PLANNING"
    && navigation.projectVersion === action.projectVersion);
};

export const buildStandardDataManagementPresentation = (
  result: Readonly<DataManagementReasoningResult>,
): StandardDataManagementPresentation => {
  const readiness = result.downstreamReadiness[0]!;
  const informationNeeds = result.informationNeeds.map((item) => item.informationNeeded);
  const introduction = "Les exigences opérationnelles de collecte, de contrôle et de cycle de vie sont liées à la représentation canonique courante. Aucune opération réelle n’a été exécutée.";
  return {
    presentationId: `data-management-standard-presentation:${logicalDigest({ result: result.resultId, digest: result.resultDigest })}`,
    resultRef: result.resultId,
    title: "Préparation opérationnelle des données",
    introduction,
    collectionRequirementCount: result.collectionRequirements.length,
    releaseStatus: readiness.status,
    informationNeeds,
    limitations: [...result.limitations],
    plainText: [
      introduction,
      `${result.collectionRequirements.length} exigence${result.collectionRequirements.length > 1 ? "s" : ""} de collecte logique représentée${result.collectionRequirements.length > 1 ? "s" : ""}.`,
      readiness.status === "RELEASED" ? "Une release exacte et versionnée est disponible." : "Aucune release exacte n’est disponible à ce stade.",
      informationNeeds.length ? `Points à résoudre\n${informationNeeds.map((item) => `– ${item}`).join("\n")}` : null,
    ].filter((value): value is string => Boolean(value)).join("\n\n"),
  };
};

export const dispatchDataManagementFromQuery = (input: {
  project: Readonly<ResearchProjectOwnerProjection>;
  navigation: Readonly<FunctionalResetQueryNavigation>;
  ownerResultLedger: Readonly<ProductOwnerResultLedger>;
  traceLedger: Readonly<ScientificExecutionTraceLedger>;
  sessionId: string;
  conversationId: string;
  presentationTurnRef: string;
  startedAt: string;
  completedAt: string;
  traceEnabled?: boolean;
}) => {
  if (!isDataManagementQueryDispatch(input.navigation)) throw new Error("QRY_ACTION_NOT_OWNED_BY_DATA_MANAGEMENT");
  if (input.navigation.projectRef !== input.project.projectId
    || input.navigation.projectVersion !== input.project.versionId
    || input.navigation.projectDigest !== input.project.projectDigest) throw new Error("QRY_DATA_MANAGEMENT_PROJECT_BINDING_STALE");
  const snapshot = buildProjectContextSnapshot({ project: input.project });
  const traceRunId = input.traceEnabled === false ? null : `scientific-data-management-trace:${logicalDigest({ session: input.sessionId, action: input.navigation.currentAction!.selectedActionId, snapshot: snapshot.snapshotDigest, at: input.startedAt })}`;
  const trace = traceRunId ? createScientificRunTraceRecorder({
    ledger: input.traceLedger,
    runId: traceRunId,
    projectSnapshot: snapshot,
    initiatorContext: { kind: "EXPLICIT_PRODUCT_CALL", initiatorRef: input.navigation.currentAction!.selectedActionId },
    startedAt: input.startedAt,
  }) : undefined;
  trace?.append({
    eventType: "QRY_ACTION_SELECTED",
    timestamp: input.startedAt,
    owner: "QUERY_NAVIGATION",
    status: "DATA_MANAGEMENT_SCOPE_SELECTED",
    sourceRefs: [input.navigation.currentAction!.selectedActionId, ...input.navigation.currentAction!.navigationNeedRefs],
    diagnostic: { stage: "PROJECT_CONTEXT", code: "QRY_DATA_MANAGEMENT_SCOPE_SELECTED" },
  });
  const invocation = invokeDataManagementForProjectSnapshot({
    projectSnapshot: snapshot,
    ledger: input.ownerResultLedger,
    callerRef: input.navigation.currentAction!.selectedActionId,
    purpose: input.navigation.currentAction!.reason,
    selectedNeed: {
      needRef: input.navigation.currentAction!.navigationNeedRefs[0]!,
      purpose: input.navigation.currentAction!.reason,
      affectedDecisionRefs: input.navigation.currentAction!.affectedDecisionRefs,
      affectedBranchRefs: input.navigation.currentAction!.affectedBranchRefs,
      owner: "QUERY_NAVIGATION",
    },
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    trace,
  });
  const result = invocation.result?.nativePayload;
  if (!result) throw new Error(invocation.observation.failureCode ?? "DATA_MANAGEMENT_RESULT_MISSING");
  const presentation = buildStandardDataManagementPresentation(result);
  trace?.append({
    eventType: "UI_PROJECTION",
    timestamp: input.completedAt,
    owner: "UI",
    status: "DATA_MANAGEMENT_REQUIREMENTS_PRESENTED",
    sourceRefs: [result.resultId, ...result.collectionRequirements.map((item) => item.requirementId)],
    diagnostic: { stage: "DATA_MANAGEMENT_ENGINE", code: "DATA_MANAGEMENT_STANDARD_PROJECTION_CREATED" },
  });
  trace?.complete(input.completedAt);
  const interaction: StandardDataManagementInteraction = {
    contract: "FUNCTIONAL_RESET_DATA_MANAGEMENT_INTERACTION",
    contractVersion: STANDARD_DATA_MANAGEMENT_INTERACTION_VERSION,
    owner: "DATA_MANAGEMENT",
    capabilityId: "DATA_MANAGEMENT_PLANNING",
    ownerResultRef: invocation.result!.resultId,
    ownerResultVersion: invocation.result!.resultVersion,
    sourceActionRef: input.navigation.currentAction!.selectedActionId,
    sourceProjectRef: input.project.projectId,
    sourceProjectVersion: input.project.versionId,
    sourceProjectDigest: input.project.projectDigest,
    sourceCdmResultDigest: result.sourceCdmResult.resultDigest,
    presentationTurnRef: input.presentationTurnRef,
    traceRunId,
    status: "ACTIVE",
    staleReason: null,
    projectWriteAuthorized: false,
  };
  return {
    result,
    presentation,
    interaction,
    ownerResultLedger: invocation.ledger,
    traceLedger: trace?.getLedger() ?? input.traceLedger,
    providerCalls: 0 as const,
    projectWrites: 0 as const,
    humanDecisionCreated: false as const,
  };
};

export const readDataManagementResultFromLedger = (input: { ledger: Readonly<ProductOwnerResultLedger>; resultRef: string }) => {
  const payload = [...input.ledger.entries].reverse().find((entry) => entry.result?.resultId === input.resultRef
    && entry.request.owner === "DATA_MANAGEMENT")?.result?.nativePayload as DataManagementReasoningResult | null | undefined;
  return payload?.contract === "DATA_MANAGEMENT_REASONING_RESULT" ? payload : null;
};
