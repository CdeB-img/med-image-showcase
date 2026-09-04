import { logicalDigest, type KnowledgeOwnerHandoff } from "@/features/knowledge-engine";
import type { RegulatoryResolutionResult } from "@/features/regulatory-resolution";
import type { FunctionalResetQueryNavigation } from "@/features/query-navigation";
import {
  buildProjectContextSnapshot,
  buildRegulatoryRequestFromProjectSnapshot,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import { invokeRegulatoryForProject } from "@/features/protocol-designer/product-regulatory-owner-runtime";
import type { ProductOwnerResultLedger } from "@/features/protocol-designer/product-owner-result-ledger";
import {
  createScientificRunTraceRecorder,
  type ScientificExecutionTraceLedger,
} from "@/features/protocol-designer/scientific-execution-trace";

export const STANDARD_REGULATORY_INTERACTION_VERSION = "1.0.0" as const;

export type StandardRegulatoryInteraction = {
  contract: "FUNCTIONAL_RESET_REGULATORY_INTERACTION";
  contractVersion: typeof STANDARD_REGULATORY_INTERACTION_VERSION;
  owner: "REGULATORY_RESOLUTION";
  capabilityId: "REGULATORY_REQUIREMENT_RESOLUTION";
  ownerResultRef: string;
  sourceActionRef: string;
  sourceProjectRef: string;
  sourceProjectVersion: string;
  sourceProjectDigest: string;
  traceRunId: string | null;
  status: "PENDING_HUMAN_REVIEW";
  projectWriteAuthorized: false;
};

export type StandardRegulatoryPresentation = {
  presentationId: string;
  resultRef: string;
  title: string;
  applicableContexts: readonly string[];
  potentialContexts: readonly string[];
  unresolvedQuestions: readonly string[];
  limitations: readonly string[];
  plainText: string;
};

const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));

export const isRegulatoryQueryDispatch = (navigation: Readonly<FunctionalResetQueryNavigation>) => {
  const action = navigation.currentAction;
  return Boolean(action
    && action.owner === "REGULATORY_RESOLUTION"
    && navigation.selection.selected?.capabilityRef === "REGULATORY_REQUIREMENT_RESOLUTION"
    && action.affectedDecisionRefs.includes("project-decision:REGULATORY_APPLICABILITY")
    && navigation.projectVersion === action.projectVersion);
};

export const buildStandardRegulatoryPresentation = (
  result: Readonly<RegulatoryResolutionResult>,
  evidenceLimitations: readonly string[] = [],
): StandardRegulatoryPresentation => {
  const applicableContexts = result.applicableRequirements.map((item) => `${item.title} — ${item.jurisdiction}`);
  const potentialContexts = result.potentiallyApplicableRequirements.map((item) => `${item.title} — ${item.jurisdiction}`);
  const unresolvedQuestions = unique([
    ...result.missingInformation.map((item) => item.reason),
    ...result.requiredQualifications.map((item) => item.reason),
    ...result.contradictions.map((item) => item.description),
  ]);
  const limitations = unique([
    ...evidenceLimitations,
    "AIDE_METHODOLOGIQUE_NE_VAUT_PAS_VALIDATION_REGLEMENTAIRE",
    "AUCUNE_EXIGENCE_EXTERNE_CANDIDATE_N_EST_PROMUE_AUTOMATIQUEMENT",
  ]);
  const plainText = [
    applicableContexts.length ? `Contexte réglementaire applicable selon les règles admises\n${applicableContexts.map((item) => `– ${item}`).join("\n")}` : null,
    potentialContexts.length ? `Contexte potentiellement applicable\n${potentialContexts.map((item) => `– ${item}`).join("\n")}` : null,
    unresolvedQuestions.length ? `Questions réglementaires non résolues\n${unresolvedQuestions.slice(0, 6).map((item) => `– ${item}`).join("\n")}` : null,
    "Cette résolution structure l’applicabilité et les besoins de revue ; elle ne conclut ni à la conformité ni à l’adoption dans le Project.",
  ].filter((value): value is string => Boolean(value)).join("\n\n");
  return {
    presentationId: `regulatory-standard-presentation:${logicalDigest({ result: result.resolutionId, limitations })}`,
    resultRef: result.resolutionId,
    title: "Contexte réglementaire à examiner",
    applicableContexts,
    potentialContexts,
    unresolvedQuestions,
    limitations,
    plainText,
  };
};

export const dispatchRegulatoryFromQuery = (input: {
  project: Readonly<ResearchProjectOwnerProjection>;
  navigation: Readonly<FunctionalResetQueryNavigation>;
  ownerResultLedger: Readonly<ProductOwnerResultLedger>;
  traceLedger: Readonly<ScientificExecutionTraceLedger>;
  sessionId: string;
  conversationId: string;
  startedAt: string;
  completedAt: string;
  traceEnabled?: boolean;
  knowledgeHandoff?: Readonly<KnowledgeOwnerHandoff> | null;
}) => {
  if (!isRegulatoryQueryDispatch(input.navigation)) throw new Error("QRY_ACTION_NOT_OWNED_BY_REGULATORY_RESOLUTION");
  if (input.navigation.projectRef !== input.project.projectId
    || input.navigation.projectVersion !== input.project.versionId
    || input.navigation.projectDigest !== input.project.projectDigest) throw new Error("QRY_REGULATORY_PROJECT_BINDING_STALE");
  const snapshot = buildProjectContextSnapshot({ project: input.project });
  const traceRunId = input.traceEnabled === false ? null : `scientific-regulatory-trace:${logicalDigest({
    sessionId: input.sessionId,
    conversationId: input.conversationId,
    action: input.navigation.currentAction!.selectedActionId,
    projectVersion: input.project.versionId,
    projectDigest: input.project.projectDigest,
    startedAt: input.startedAt,
  })}`;
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
    status: "REGULATORY_SCOPE_SELECTED",
    sourceRefs: [input.navigation.currentAction!.selectedActionId, ...input.navigation.currentAction!.navigationNeedRefs],
    diagnostic: { stage: "PROJECT_CONTEXT", code: "QRY_REGULATORY_SCOPE_SELECTED" },
  });
  const invocation = invokeRegulatoryForProject({
    project: input.project,
    projectSnapshot: snapshot,
    regulatoryRequest: buildRegulatoryRequestFromProjectSnapshot({ project: input.project, resolutionAsOf: input.startedAt }),
    ledger: input.ownerResultLedger,
    callerRef: input.navigation.currentAction!.selectedActionId,
    purpose: input.navigation.currentAction!.reason,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    knowledgeHandoff: input.knowledgeHandoff,
    trace,
  });
  const result = invocation.result?.nativePayload;
  if (!result) {
    trace?.fail(input.completedAt, invocation.observation.failureCode ?? "REGULATORY_RESULT_MISSING", "REG_ENGINE");
    throw new Error(invocation.observation.failureCode ?? "REGULATORY_RESULT_MISSING");
  }
  const presentation = buildStandardRegulatoryPresentation(result, invocation.currentEvidence?.limitations ?? []);
  trace?.append({
    eventType: "UI_PROJECTION",
    timestamp: input.completedAt,
    owner: "UI",
    status: "REGULATORY_CONTEXT_PROJECTED",
    sourceRefs: [result.resolutionId, ...result.provenance.sourceRefs],
    diagnostic: { stage: "REG_ENGINE", code: "REGULATORY_STANDARD_PROJECTION_EMITTED" },
  });
  trace?.complete(input.completedAt);
  const interaction: StandardRegulatoryInteraction = {
    contract: "FUNCTIONAL_RESET_REGULATORY_INTERACTION",
    contractVersion: STANDARD_REGULATORY_INTERACTION_VERSION,
    owner: "REGULATORY_RESOLUTION",
    capabilityId: "REGULATORY_REQUIREMENT_RESOLUTION",
    ownerResultRef: invocation.result!.resultId,
    sourceActionRef: input.navigation.currentAction!.selectedActionId,
    sourceProjectRef: input.project.projectId,
    sourceProjectVersion: input.project.versionId,
    sourceProjectDigest: input.project.projectDigest,
    traceRunId,
    status: "PENDING_HUMAN_REVIEW",
    projectWriteAuthorized: false,
  };
  return {
    result,
    presentation,
    interaction,
    currentEvidence: invocation.currentEvidence,
    ownerResultLedger: invocation.ledger,
    traceLedger: trace?.getLedger() ?? input.traceLedger,
    providerCalls: 0 as const,
    projectWrites: 0 as const,
    humanDecisionBypassed: false as const,
  };
};
