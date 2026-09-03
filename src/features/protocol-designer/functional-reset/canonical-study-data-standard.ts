import type { CanonicalStudyDataResult } from "@/features/data-analysis-planning";
import { logicalDigest } from "@/features/knowledge-engine";
import type { FunctionalResetDataOwnerState, FunctionalResetQueryNavigation } from "@/features/query-navigation";
import { buildProjectContextSnapshot, type ResearchProjectOwnerProjection } from "@/features/research-project-construction";
import { invokeCanonicalStudyDataForProjectSnapshot } from "@/features/protocol-designer/product-canonical-study-data-owner-runtime";
import { ownerResultNativeDigest, type ProductOwnerResultLedger } from "@/features/protocol-designer/product-owner-result-ledger";
import { createScientificRunTraceRecorder, type ScientificExecutionTraceLedger } from "@/features/protocol-designer/scientific-execution-trace";

export const STANDARD_CDM_INTERACTION_VERSION = "1.0.0" as const;

export type StandardCanonicalStudyDataPresentation = {
  presentationId: string;
  resultRef: string;
  title: string;
  introduction: string;
  variables: readonly { label: string; occasionCount: number }[];
  informationNeeds: readonly string[];
  limitations: readonly string[];
  plainText: string;
};

export type StandardCanonicalStudyDataInteraction = {
  contract: "FUNCTIONAL_RESET_CDM_INTERACTION";
  contractVersion: typeof STANDARD_CDM_INTERACTION_VERSION;
  owner: "STUDY_DATA_CDM";
  capabilityId: "STUDY_DATA_PLANNING";
  ownerResultRef: string;
  ownerResultVersion: string;
  sourceActionRef: string;
  sourceProjectRef: string;
  sourceProjectVersion: string;
  sourceProjectDigest: string;
  presentationTurnRef: string;
  traceRunId: string | null;
  status: "ACTIVE" | "COMPLETED" | "STALE";
  staleReason: string | null;
  projectWriteAuthorized: false;
};

export const isCanonicalStudyDataQueryDispatch = (navigation: Readonly<FunctionalResetQueryNavigation>) => {
  const action = navigation.currentAction;
  return Boolean(action
    && action.owner === "STUDY_DATA_CDM"
    && action.affectedDecisionRefs.length === 1
    && action.affectedDecisionRefs[0] === "project-section:MEASUREMENTS"
    && action.affectedBranchRefs.includes("project-facet:MEASUREMENTS:CDM_CANONICAL_REPRESENTATION")
    && navigation.selection.selected?.capabilityRef === "STUDY_DATA_PLANNING"
    && navigation.projectVersion === action.projectVersion);
};

export const buildStandardCanonicalStudyDataPresentation = (
  result: Readonly<CanonicalStudyDataResult>,
): StandardCanonicalStudyDataPresentation => {
  const variables = result.variableRepresentations.map((variable) => ({
    label: variable.label,
    occasionCount: result.expectedOccasionRepresentations.filter((occasion) => occasion.canonicalVariableRef === variable.canonicalVariableRef).length,
  }));
  const informationNeeds = result.informationNeeds.map((item) => item.informationNeeded);
  const introduction = variables.length
    ? "La structure des données attendues est représentée à partir de la version courante du projet. Aucune donnée réalisée n’a été créée."
    : "La représentation canonique attend une variable explicitement adoptée dans le projet.";
  return {
    presentationId: `cdm-standard-presentation:${logicalDigest({ result: result.resultId, digest: result.resultDigest })}`,
    resultRef: result.resultId,
    title: "Structure canonique des données",
    introduction,
    variables,
    informationNeeds,
    limitations: [...result.limitations],
    plainText: [
      introduction,
      ...variables.map((item) => `${item.label} — ${item.occasionCount ? `${item.occasionCount} occasion${item.occasionCount > 1 ? "s" : ""} attendue${item.occasionCount > 1 ? "s" : ""}` : "occasion à préciser"}`),
      informationNeeds.length ? `Informations encore nécessaires\n${informationNeeds.map((item) => `– ${item}`).join("\n")}` : null,
      variables.length ? "Vous pouvez poursuivre vers la préparation opérationnelle des données ou discuter cette représentation." : null,
    ].filter((value): value is string => Boolean(value)).join("\n\n"),
  };
};

export const deriveFunctionalResetDataOwnerState = (input: {
  project: Readonly<ResearchProjectOwnerProjection>;
  ledger: Readonly<ProductOwnerResultLedger>;
}): FunctionalResetDataOwnerState => {
  const cdmEntry = [...input.ledger.entries].reverse().find((entry) => entry.result?.owner === "STUDY_DATA_CDM"
    && entry.result.capabilityId === "STUDY_DATA_PLANNING"
    && entry.result.sourceProjectRef === input.project.projectId
    && entry.result.sourceProjectVersion === input.project.versionId
    && entry.result.sourceProjectDigest === input.project.projectDigest);
  const cdmPayload = cdmEntry?.result?.nativePayload as CanonicalStudyDataResult | null | undefined;
  const cdmDigest = cdmEntry?.result ? ownerResultNativeDigest(cdmEntry.result) : null;
  const currentCdmResult = cdmEntry?.result && cdmPayload?.contract === "CANONICAL_STUDY_DATA_RESULT" && cdmDigest === cdmPayload.resultDigest ? {
    resultId: cdmEntry.result.resultId,
    resultVersion: cdmEntry.result.resultVersion,
    resultDigest: cdmPayload.resultDigest,
    sourceProjectRef: cdmEntry.result.sourceProjectRef,
    sourceProjectVersion: cdmEntry.result.sourceProjectVersion,
    sourceProjectDigest: cdmEntry.result.sourceProjectDigest,
  } : null;
  const dmEntry = currentCdmResult ? [...input.ledger.entries].reverse().find((entry) => entry.result?.owner === "DATA_MANAGEMENT"
    && entry.result.capabilityId === "DATA_MANAGEMENT_PLANNING"
    && entry.result.sourceProjectRef === input.project.projectId
    && entry.result.sourceProjectVersion === input.project.versionId
    && entry.result.sourceProjectDigest === input.project.projectDigest) : null;
  const dmPayload = dmEntry?.result?.nativePayload as { contract?: string; resultDigest?: string; sourceCdmResult?: { resultDigest?: string } } | null | undefined;
  const dmDigest = dmEntry?.result ? ownerResultNativeDigest(dmEntry.result) : null;
  const currentDataManagementResult = dmEntry?.result
    && dmPayload?.contract === "DATA_MANAGEMENT_REASONING_RESULT"
    && dmDigest === dmPayload.resultDigest
    && dmPayload.sourceCdmResult?.resultDigest === currentCdmResult?.resultDigest ? {
      resultId: dmEntry.result.resultId,
      resultVersion: dmEntry.result.resultVersion,
      resultDigest: dmPayload.resultDigest,
      sourceProjectRef: dmEntry.result.sourceProjectRef,
      sourceProjectVersion: dmEntry.result.sourceProjectVersion,
      sourceProjectDigest: dmEntry.result.sourceProjectDigest,
      sourceCdmResultDigest: dmPayload.sourceCdmResult.resultDigest,
    } : null;
  return { currentCdmResult, currentDataManagementResult };
};

export const dispatchCanonicalStudyDataFromQuery = (input: {
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
  if (!isCanonicalStudyDataQueryDispatch(input.navigation)) throw new Error("QRY_ACTION_NOT_OWNED_BY_CDM");
  if (input.navigation.projectRef !== input.project.projectId
    || input.navigation.projectVersion !== input.project.versionId
    || input.navigation.projectDigest !== input.project.projectDigest) throw new Error("QRY_CDM_PROJECT_BINDING_STALE");
  const snapshot = buildProjectContextSnapshot({ project: input.project });
  const traceRunId = input.traceEnabled === false ? null : `scientific-cdm-trace:${logicalDigest({ session: input.sessionId, action: input.navigation.currentAction!.selectedActionId, snapshot: snapshot.snapshotDigest, at: input.startedAt })}`;
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
    status: "CDM_SCOPE_SELECTED",
    sourceRefs: [input.navigation.currentAction!.selectedActionId, ...input.navigation.currentAction!.navigationNeedRefs],
    diagnostic: { stage: "PROJECT_CONTEXT", code: "QRY_CDM_SCOPE_SELECTED" },
  });
  const invocation = invokeCanonicalStudyDataForProjectSnapshot({
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
  if (!result) throw new Error(invocation.observation.failureCode ?? "CDM_RESULT_MISSING");
  const presentation = buildStandardCanonicalStudyDataPresentation(result);
  trace?.append({
    eventType: "UI_PROJECTION",
    timestamp: input.completedAt,
    owner: "UI",
    status: "CDM_REPRESENTATION_PRESENTED",
    sourceRefs: [result.resultId, ...result.variableRepresentations.map((item) => item.representationId)],
    diagnostic: { stage: "CDM_ENGINE", code: "CDM_STANDARD_PROJECTION_CREATED" },
  });
  trace?.complete(input.completedAt);
  const interaction: StandardCanonicalStudyDataInteraction = {
    contract: "FUNCTIONAL_RESET_CDM_INTERACTION",
    contractVersion: STANDARD_CDM_INTERACTION_VERSION,
    owner: "STUDY_DATA_CDM",
    capabilityId: "STUDY_DATA_PLANNING",
    ownerResultRef: invocation.result!.resultId,
    ownerResultVersion: invocation.result!.resultVersion,
    sourceActionRef: input.navigation.currentAction!.selectedActionId,
    sourceProjectRef: input.project.projectId,
    sourceProjectVersion: input.project.versionId,
    sourceProjectDigest: input.project.projectDigest,
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

export const readCanonicalStudyDataResultFromLedger = (input: { ledger: Readonly<ProductOwnerResultLedger>; resultRef: string }) => {
  const payload = [...input.ledger.entries].reverse().find((entry) => entry.result?.resultId === input.resultRef
    && entry.request.owner === "STUDY_DATA_CDM")?.result?.nativePayload as CanonicalStudyDataResult | null | undefined;
  return payload?.contract === "CANONICAL_STUDY_DATA_RESULT" ? payload : null;
};
