import { describe, expect, it } from "vitest";
import type { ProductBridgeResponse } from "../../product-bridge";
import { captureProductBridgeTraceText } from "../../scientific-execution-trace";
import { prepareMultilingualUserTurn, localizeCanonicalFrenchResponse } from "../../conversation-language-effects";
import { prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import { richStudyContribution } from "./p1-behavior-01a-contract-fixtures";
import { routeProductEntry } from "../product-entry-routing";
import { createFunctionalResetSession, type ProductBridgeTrace } from "../session";
import { projectTerraBridgeTrace, projectConversationBridgeTrace, projectEmptyBridgeTrace, appendBridgeTrace } from "../bridge-trace-projection";

// CURRENT_STRUCTURAL_INVARIANT: field presence, binding, passive capture and retention.
// Frozen pre-extraction expressions are the equivalence oracle, not scientific expectations.
const beforeTerra = (input: Parameters<typeof projectTerraBridgeTrace>[0]): ProductBridgeTrace => {
  const { turnId, traceRunId, content, response, candidate, projectVersionBefore, projectVersionAfter } = input;
  const userTurn = { turnId }, session = { project: projectVersionBefore ? { versionId: projectVersionBefore } : null }, current = { project: projectVersionAfter ? { versionId: projectVersionAfter } : null };
  return { turnId: userTurn.turnId, traceRunId, requestKind: "USER_TURN" as const,
          raw: content, assistantReply: response.assistantReply, conversationFailure: response.conversationFailure,
          persistentExtractionCalled: response.persistentExtraction.called,
          persistentExtractionStatus: response.persistentExtraction.status, persistentExtractionFailure: response.persistentExtraction.failure,
          providerArtifact: response.persistentExtraction.providerArtifact, wireCandidate: response.persistentExtraction.wireCandidate,
          persistentCandidate: response.persistentExtraction.candidate, deterministicValidation: response.persistentExtraction.validation,
          projectChangeSetCandidate: candidate?.changeSet ?? null, canonicalProjectChangeSetCandidate: candidate?.canonicalChangeSet ?? null,
          humanReviewProjection: candidate?.humanReviewProjection ?? null, humanDecision: null,
          projectVersionBefore: session.project?.versionId ?? null, projectVersionAfter: current.project?.versionId ?? null,
          qryNeedBefore: null, qryNeedAfter: null, provider: response.observability.provider, model: response.observability.model,
          conversationLatencyMs: response.observability.conversationLatencyMs, extractionLatencyMs: response.observability.extractionLatencyMs,
          calls: response.observability.calls, projectWriteCount: 0, protocolProjectionCount: 0 };
};
const beforeConversation = (input: Parameters<typeof projectConversationBridgeTrace>[0]): ProductBridgeTrace => {
  const { turnId, traceRunId, content, visibleAssistantReply, response, entryRouting, effectiveExtractionStatus, candidate, projectVersion, qryNeedBefore, queryNavigation, preProjectRealization, preparedGateway, localized, preProjectTrace } = input;
  const userTurn = { turnId }, session = { project: projectVersion ? { versionId: projectVersion } : null };
  return {
          turnId: userTurn.turnId,
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
          projectVersionBefore: session.project?.versionId ?? null,
          projectVersionAfter: session.project?.versionId ?? null,
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
const beforeEmpty = (input: Parameters<typeof projectEmptyBridgeTrace>[0]) => {
  const { turnId, content, projectVersion, qryNeedBefore, queryNavigation, entryRouting, preparedGateway } = input;
  const userTurn = { turnId }, session = { project: projectVersion ? { versionId: projectVersion } : null };
  return {
        turnId: userTurn.turnId,
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
        projectVersionBefore: session.project?.versionId ?? null,
        projectVersionAfter: session.project?.versionId ?? null,
        qryNeedBefore,
        qryNeedAfter: queryNavigation?.currentAction?.navigationNeedRefs[0] ?? null,
        extractionLatencyMs: null,
        entryRouting,
        projectWriteCount: 0,
        protocolProjectionCount: 0,
        multilingualUserTurn: preparedGateway.turn,
      };
};
const AT = "2026-10-05T12:00:00.000Z";
const response: ProductBridgeResponse = {
  apiVersion: "1.0.0", assistantReply: "Réponse locale de projection", assistantTurn: { turnId: "assistant", role: "NOXIA", content: "Réponse locale de projection", createdAt: AT },
  persistentExtraction: { called: false, status: "NOT_REQUESTED", providerArtifact: null, wireCandidate: null, candidate: null, validation: null, contribution: null },
  observability: { provider: "OPENAI", model: "LOCAL_SYNTHETIC", calls: 1, conversationLatencyMs: 19, extractionLatencyMs: null, projectWrites: 0 },
};
describe("bridge TRACE projection equivalence", () => {
  it("preserves complete variants, absent/null fields and call accounting", async () => {
    const session = createFunctionalResetSession(AT);
    const content = "Bonjour", turnId = "user", traceRunId = "trace";
    const preparedGateway = await prepareMultilingualUserTurn({ session, turnId, originalText: content });
    const localized = await localizeCanonicalFrenchResponse({ state: preparedGateway.state, sessionId: session.sessionId, conversationId: session.conversationId, sourceTurnRef: turnId, responseId: "response", canonicalFrenchResponse: response.assistantReply });
    const candidate = prepareResearchProjectContributionCandidate(richStudyContribution(), null);
    for (const receipt of [response, { ...response, conversationFailure: null, persistentExtraction: { ...response.persistentExtraction, failure: null, recovery: null } }]) {
      const terra = { turnId, traceRunId, content, response: receipt, candidate, projectVersionBefore: "v1", projectVersionAfter: "v2" };
      expect(projectTerraBridgeTrace(terra)).toStrictEqual(beforeTerra(terra));
      expect(Object.prototype.hasOwnProperty.call(projectTerraBridgeTrace(terra), "persistentExtractionRecovery")).toBe(false);
      for (const eligible of [true, false]) {
        const entryRouting = { ...routeProductEntry({ raw: content, sourceTurnRef: turnId, routedAt: AT }), projectConstructionEligible: eligible };
        const conversation = { turnId, traceRunId, content, visibleAssistantReply: response.assistantReply, response: receipt, candidate, projectVersion: "v1", qryNeedBefore: "need-before", queryNavigation: null, preProjectRealization: null, preparedGateway, localized, preProjectTrace: null, entryRouting, effectiveExtractionStatus: "NOT_REQUESTED" as const };
        expect(projectConversationBridgeTrace(conversation)).toStrictEqual(beforeConversation(conversation));
        expect(Object.prototype.hasOwnProperty.call(projectConversationBridgeTrace(conversation), "conversationFailure")).toBe(false);
        expect(projectConversationBridgeTrace(conversation).persistentExtractionRecovery).toBeNull();
        const initial = { turnId, content, projectVersion: "v1", qryNeedBefore: "need-before", queryNavigation: null, entryRouting, preparedGateway };
        expect(projectEmptyBridgeTrace(initial)).toStrictEqual(beforeEmpty(initial));
      }
    }
  });
  it("preserves append order, source immutability and the existing last-20 retention", () => {
    const base = projectTerraBridgeTrace({ turnId: "0", traceRunId: "trace", content: "Bonjour", response, candidate: null, projectVersionBefore: null, projectVersionAfter: null });
    const original = Array.from({ length: 25 }, (_, index) => ({ ...base, turnId: String(index) }));
    const trace = { ...base, turnId: "last" };
    expect(appendBridgeTrace(original, trace)).toStrictEqual([...original, trace].slice(-20));
    expect(original).toHaveLength(25);
    expect(appendBridgeTrace(original, trace).at(-1)).toBe(trace);
  });
});
