import type { ProductBridgeResponse } from "../product-bridge";
import type { ResearchProjectContributionCandidate } from "@/features/research-project-construction";
import type { FunctionalResetSession, ProductBridgeTrace } from "./session";
import type { prepareMultilingualUserTurn, localizeCanonicalFrenchResponse } from "../conversation-language-effects";
import { captureProductBridgeTraceText } from "../scientific-execution-trace";

// Passive projection only. No recorder, provider dispatch, or persistent representation.
export const projectTerraBridgeTrace = (input: {
  turnId: string; traceRunId: string; content: string; response: ProductBridgeResponse;
  candidate: ResearchProjectContributionCandidate | null; projectVersionBefore: string | null; projectVersionAfter: string | null;
}): ProductBridgeTrace => {
  const { turnId, traceRunId, content, response, candidate, projectVersionBefore, projectVersionAfter } = input;
  return { turnId: turnId, traceRunId, requestKind: "USER_TURN" as const,
          raw: content, assistantReply: response.assistantReply, conversationFailure: response.conversationFailure,
          persistentExtractionCalled: response.persistentExtraction.called,
          persistentExtractionStatus: response.persistentExtraction.status, persistentExtractionFailure: response.persistentExtraction.failure,
          providerArtifact: response.persistentExtraction.providerArtifact, wireCandidate: response.persistentExtraction.wireCandidate,
          persistentCandidate: response.persistentExtraction.candidate, deterministicValidation: response.persistentExtraction.validation,
          projectChangeSetCandidate: candidate?.changeSet ?? null, canonicalProjectChangeSetCandidate: candidate?.canonicalChangeSet ?? null,
          humanReviewProjection: candidate?.humanReviewProjection ?? null, humanDecision: null,
          projectVersionBefore: projectVersionBefore, projectVersionAfter: projectVersionAfter,
          qryNeedBefore: null, qryNeedAfter: null, provider: response.observability.provider, model: response.observability.model,
          conversationLatencyMs: response.observability.conversationLatencyMs, extractionLatencyMs: response.observability.extractionLatencyMs,
          calls: response.observability.calls, projectWriteCount: 0, protocolProjectionCount: 0 };
};

export const projectConversationBridgeTrace = (input: {
  turnId: string; traceRunId: string; content: string; visibleAssistantReply: string; response: ProductBridgeResponse;
  entryRouting: NonNullable<ProductBridgeTrace["entryRouting"]>; effectiveExtractionStatus: ProductBridgeTrace["persistentExtractionStatus"];
  candidate: ResearchProjectContributionCandidate | null; projectVersion: string | null; qryNeedBefore: string | null;
  queryNavigation: FunctionalResetSession["queryNavigation"]; preProjectRealization: { provider: string; model: string } | null;
  preparedGateway: Awaited<ReturnType<typeof prepareMultilingualUserTurn>>; localized: Awaited<ReturnType<typeof localizeCanonicalFrenchResponse>>;
  preProjectTrace: ProductBridgeTrace["preProjectTrace"];
}): ProductBridgeTrace => {
  const { turnId, traceRunId, content, visibleAssistantReply, response, entryRouting, effectiveExtractionStatus, candidate,
    projectVersion, qryNeedBefore, queryNavigation, preProjectRealization, preparedGateway, localized, preProjectTrace } = input;
  return {
          turnId: turnId,
          traceRunId,
          requestKind: "USER_TURN" as const,
          raw: captureProductBridgeTraceText({ value: content, field: "SOURCE_TEXT" }),
          assistantReply: captureProductBridgeTraceText({ value: visibleAssistantReply, field: "ASSISTANT_REPLY" }),
          persistentExtractionCalled: entryRouting.projectConstructionEligible && response.persistentExtraction.called,
          persistentExtractionStatus: effectiveExtractionStatus,
          persistentExtractionFailure: entryRouting.projectConstructionEligible ? response.persistentExtraction.failure ?? null : null,
          persistentExtractionRecovery: entryRouting.projectConstructionEligible ? response.persistentExtraction.recovery ?? null : null,
          providerArtifact: entryRouting.projectConstructionEligible ? response.persistentExtraction.providerArtifact : null,
          wireCandidate: entryRouting.projectConstructionEligible ? response.persistentExtraction.wireCandidate : null,
          persistentCandidate: entryRouting.projectConstructionEligible ? response.persistentExtraction.candidate : null,
          deterministicValidation: entryRouting.projectConstructionEligible ? response.persistentExtraction.validation : null,
          projectChangeSetCandidate: candidate?.changeSet ?? null,
          canonicalProjectChangeSetCandidate: candidate?.canonicalChangeSet ?? null,
          humanReviewProjection: candidate?.humanReviewProjection ?? null,
          humanDecision: null,
          projectVersionBefore: projectVersion,
          projectVersionAfter: projectVersion,
          qryNeedBefore,
          qryNeedAfter: queryNavigation?.currentAction?.navigationNeedRefs[0] ?? null,
          provider: preProjectRealization?.provider ?? response.observability.provider,
          model: preProjectRealization?.model ?? response.observability.model,
          conversationLatencyMs: response.observability.conversationLatencyMs,
          extractionLatencyMs: response.observability.extractionLatencyMs,
          calls: response.observability.calls + preparedGateway.providerCalls + localized.providerCalls,
          languageGatewayCalls: preparedGateway.providerCalls + localized.providerCalls,
          extractionAttempts: response.observability.extractionAttempts,
          entryRouting,
          preProjectTrace,
          multilingualUserTurn: preparedGateway.turn,
          knowledgeResultRef: null,
          knowledgeResultDigest: null,
          projectWriteCount: response.observability.projectWrites,
          protocolProjectionCount: 0,
        };
};

export const projectEmptyBridgeTrace = (input: { turnId: string; content: string; projectVersion: string | null; qryNeedBefore: string | null;
  queryNavigation: FunctionalResetSession["queryNavigation"]; entryRouting: NonNullable<ProductBridgeTrace["entryRouting"]>;
  preparedGateway: Awaited<ReturnType<typeof prepareMultilingualUserTurn>>;
}) => {
  const { turnId, content, projectVersion, qryNeedBefore, queryNavigation, entryRouting, preparedGateway } = input;
  return {
        turnId: turnId,
        requestKind: "USER_TURN" as const,
        raw: captureProductBridgeTraceText({ value: content, field: "SOURCE_TEXT" }),
        persistentExtractionCalled: false,
        persistentExtractionStatus: "NOT_REQUESTED" as const,
        providerArtifact: null,
        wireCandidate: null,
        persistentCandidate: null,
        deterministicValidation: null,
        projectChangeSetCandidate: null,
        canonicalProjectChangeSetCandidate: null,
        humanReviewProjection: null,
        humanDecision: null,
        projectVersionBefore: projectVersion,
        projectVersionAfter: projectVersion,
        qryNeedBefore,
        qryNeedAfter: queryNavigation?.currentAction?.navigationNeedRefs[0] ?? null,
        extractionLatencyMs: null,
        entryRouting,
        projectWriteCount: 0,
        protocolProjectionCount: 0,
        multilingualUserTurn: preparedGateway.turn,
      };
};

export const appendBridgeTrace = (traces: readonly ProductBridgeTrace[], trace: ProductBridgeTrace): ProductBridgeTrace[] => [...traces, trace].slice(-20);
