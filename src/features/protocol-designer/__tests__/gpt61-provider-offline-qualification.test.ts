import { describe, expect, it, vi } from "vitest";
// Candidate identity only, isolated to this suite. No runtime default or Azure
// default is changed. Preview admission is explicitly human-authorized;
// admission is not live qualification evidence. Scientific owners stay real.
vi.mock("../provider-model-contract", async original => ({
  ...await original<object>(), TERRA_REQUESTED_MODEL: "gpt-6.1-sol",
}));
import { buildOpenAITerraConversationPayload, executeOpenAITerraConversation,
  executeOpenAIDrciDraft } from "../../../../api/protocol-designer-openai-extraction-provider";
import { executeProtocolDesignerBridge } from "../../../../api/protocol-designer-bridge";
import { providerModelDeclaration } from "../provider-model-contract";
import { estimateProviderCallCostUsd, providerModelPricing } from "../provider-call-observability";
import { boundCanaryProviderCall, settleCanaryProviderCall, settleKnownIncompleteProviderUsage,
  canaryBudgetAdmission } from "../../../../server/protocol-designer-canary-policy";
import { boundPublicProviderCall } from "../../../../server/protocol-designer-local-token-admission";
import { createFunctionalResetSession } from "../functional-reset/session";
import { captureProjectPreparation, addProjectPreparation, consumeProjectPreparation,
  projectPreparationReview } from "../functional-reset/project-preparation-lifecycle";
import { prepareWorkingDraftRequest } from "../functional-reset/continuous-project-build";
import { controlledStudyProposal, DOMAINS } from "../functional-reset/__tests__/study-proposal-fixtures";
import { prepareTerraConversation } from "@/features/scientific-thinking/scientific-collaborator-conversation";
import { terraScientificResultSchema } from "../functional-reset/contribution-discussion-retention";
import { authorizeResearchProjectDocumentHandoff } from "@/features/research-project-construction";
import { adoptBehaviorContribution, behaviorAuthority, richStudyContribution } from "../functional-reset/__tests__/p1-behavior-01a-contract-fixtures";
import { refreshFunctionalResetDocumentPortfolio } from "@/features/document-projection/functional-reset-boundary";
import { buildCanonicalCrfPackage } from "@/features/document-projection/study-deliverable-portfolio";
import { prepareDrciDraftPack } from "@/features/document-projection/drci-draft-pack";
import type { ProductBridgeRequest, ProductBridgeResponse } from "../product-bridge";

const model = "gpt-6.1-sol";
const endpoint = "https://qualification.services.ai.azure.com/api/projects/preview/openai/v1/responses";
const transport = { destination: "azure" as const, responsesEndpoint: endpoint };
const response = (text: string, status = "completed", reason?: string, omitUsage = false) => new Response(JSON.stringify({
  model, status, output_text: text,
  ...(reason ? { incomplete_details: { reason } } : {}),
  ...(!omitUsage ? { usage: { input_tokens: 1000, output_tokens: 200,
    input_tokens_details: { cached_tokens: 100 }, total_tokens: 1200 } } : {}),
}), { status: 200 });
const scientificRequest = (): ProductBridgeRequest => ({ apiVersion: "1.0.0", currentProject: null,
  evaluatePersistentDelta: false, conversation: { conversationId: "offline-gpt61-ecv", language: "fr",
    turns: [{ turnId: "u1", role: "USER", content: DOMAINS[0].text }] } });

describe("GPT-6.1 candidate contracts, offline only", () => {
  it("declares limits/pricing without treating capability as Azure authorization or live proof", () => {
    expect(providerModelDeclaration(model)).toMatchObject({ azureDeployment: model, azureLocalAdmission: true,
      limits: { context: 1_050_000, input: 922_000, output: 128_000 } });
    expect(providerModelPricing(model)).toMatchObject({ snapshotDate: "2026-10-05", inputPerMillionUsd: 2,
      cachedInputPerMillionUsd: 0.1, outputPerMillionUsd: 10 });
    expect(boundPublicProviderCall(endpoint, JSON.stringify(buildOpenAITerraConversationPayload(
      prepareTerraConversation(scientificRequest(), true))))).toMatchObject({
        model, inputBoundBasis: "LOCAL_CONSERVATIVE_ESTIMATE",
      });
  });

  // CURRENT_SEMANTIC_INVARIANT: scientifically meaningful ECV input, proposed
  // versus stated content and uncertainty. No scientific quality claim.
  it("keeps structured conversation, ST semantic receipt and no automatic adoption", async () => {
    const request = scientificRequest();
    const semantic = { reply: "L’association âge–ECV serait étudiée transversalement ; l’ECV n’est pas spécifique de la fibrose.",
      userContribution: { coverage: "COMPLETE", nonPersistentReason: null, elements: [{ id: "age-ecv",
        content: "Étudier l’association entre âge et ECV chez des volontaires sains sans rémunération",
        epistemicState: "USER_STATED", polarity: "AFFIRMED", conditions: [], linkedIds: [] }] },
      assistantContribution: { coverage: "COMPLETE", nonPersistentReason: null, elements: [{ id: "transversal",
        content: "Étude transversale proposée ; aucune évolution individuelle ni causalité démontrée",
        epistemicState: "PROPOSED_NOT_ADOPTED", polarity: "AFFIRMED", conditions: [], linkedIds: [] }] },
      dispositions: [], candidateBindings: [] };
    expect(terraScientificResultSchema.safeParse(semantic).success).toBe(true);
    const provider = vi.fn<typeof fetch>(async (_url, init) => {
      const payload = JSON.parse(String(init?.body));
      expect(payload).toMatchObject({ model, reasoning: { effort: "medium" }, max_output_tokens: 8000,
        store: false, service_tier: "default", text: { format: { strict: true, type: "json_schema" } } });
      return response(JSON.stringify(semantic));
    });
    const result = await executeProtocolDesignerBridge({ body: request, apiKey: null, openAiApiKey: "OFFLINE_ONLY",
      openAiTransport: transport, chatRuntime: "TERRA", autonomousProjectBuild: true, fetchImpl: provider });
    expect(result.status).toBe(200);
    const body = result.body as ProductBridgeResponse;
    expect(body.assistantReply).toBe(semantic.reply);
    expect(body.observability.projectWrites).toBe(0);
    expect(body.scientificConversation?.retainedScientificResult).toEqual(semantic);
    expect(request.currentProject).toBeNull();
    expect(provider).toHaveBeenCalledOnce();
  });

  // CURRENT_STRUCTURAL_INVARIANT: existing bridge error receipt carries only
  // bounded first-failure metadata; invalid semantics are not corrected locally.
  it("transports retention attribution without leaking source prose or redispatching", async () => {
    const privateSource = "Étudier l’ECV en IRM chez des volontaires sains ; PRIVATE_SCIENTIFIC_CANARY";
    const request = scientificRequest(); request.conversation.turns[0] = { ...request.conversation.turns[0], content: privateSource };
    const provider = vi.fn<typeof fetch>(async () => response(JSON.stringify({ reply: privateSource,
      userContribution: { coverage: "COMPLETE", nonPersistentReason: null, elements: [{ id: "ecv", content: privateSource,
        epistemicState: "USER_STATED", polarity: "AFFIRMED", conditions: [], linkedIds: ["missing-scientific-ref"] }] },
      assistantContribution: { coverage: "COMPLETE", nonPersistentReason: "PRESENTATION_ONLY", elements: [] },
      dispositions: [], candidateBindings: [] })));
    const result = await executeProtocolDesignerBridge({ body: request, apiKey: null, openAiApiKey: "OFFLINE_ONLY",
      openAiTransport: transport, chatRuntime: "TERRA", autonomousProjectBuild: true, fetchImpl: provider });
    const body = result.body as ProductBridgeResponse;
    expect(result.status).toBe(200);
    expect(body.conversationFailure).toMatchObject({ code: "SCIENTIFIC_DISCUSSION_RETENTION_INVALID",
      retentionDiagnostic: { failedField: "result.userContribution.elements[].linkedIds",
        failedValueClass: "UNRESOLVED_REFERENCE", firstFailedBranch: "CONTRIBUTION_LINK_CLOSURE",
        failedInvariant: "EVERY_LINKED_ID_RESOLVES_WITHIN_CONTRIBUTION", firstFailedValidator: "retainScientificDiscussionResult" } });
    expect(JSON.stringify(body)).not.toContain(privateSource);
    expect(JSON.stringify(body)).not.toContain("missing-scientific-ref");
    expect(body.scientificConversation).toBeUndefined();
    expect(body.observability.projectWrites).toBe(0);
    expect(provider).toHaveBeenCalledOnce();
  });

  it("uses unchanged Working Draft schema/owner to reach Review without adopting the scientific proposal", async () => {
    const session = createFunctionalResetSession();
    session.runtimeTurns = [{ turnId: "u1", role: "USER", content: DOMAINS[0].text, createdAt: session.updatedAt },
      { turnId: "noxia-turn:11111111-1111-4111-8111-111111111111", role: "NOXIA",
        content: "Étude transversale proposée ; âge continu et limites de l’ECV à discuter.", createdAt: session.updatedAt }];
    const preparation = captureProjectPreparation(session);
    const request = preparation.checkpoint!.request;
    const prepared = prepareWorkingDraftRequest(request);
    const update = { requestType: "STUDY_UPDATE", proposal: controlledStudyProposal(prepared.inputDigest, DOMAINS[0]),
      explicitDecisions: [], inferredAtomRefs: [], rejectedAtomRefs: [] };
    const provider = vi.fn<typeof fetch>(async (_url, init) => {
      const payload = JSON.parse(String(init?.body));
      expect(payload.model).toBe(model);
      expect(payload.max_output_tokens).toBe(64000);
      expect(payload.text.format.schema).toEqual(prepared.outputSchema);
      return response(JSON.stringify(update));
    });
    const result = await executeProtocolDesignerBridge({ body: request, apiKey: null, openAiApiKey: "OFFLINE_ONLY",
      openAiTransport: transport, chatRuntime: "TERRA", autonomousProjectBuild: true, fetchImpl: provider });
    expect(result.status).toBe(200);
    const ready = consumeProjectPreparation(addProjectPreparation(session, preparation), preparation.checkpoint!.preparationId,
      result.body as ProductBridgeResponse);
    expect(ready.workingDraftPreparations?.at(-1)?.status).toBe("READY_FOR_REVIEW");
    expect(projectPreparationReview(ready)?.applicable).toBe(true);
    expect(ready.project).toBeNull();
    expect(provider).toHaveBeenCalledOnce();
  });

  // CURRENT_STRUCTURAL_INVARIANT: both existing DOC scopes, identities,
  // transport and Project immutability. The Project fixture remains scientific.
  it("keeps the two existing DOC scopes and native Project binding with the candidate identity", async () => {
    const project = adoptBehaviorContribution(richStudyContribution(), null, 1), before = JSON.stringify(project);
    const at = "2026-10-05T12:00:00.000Z";
    const handoffDecision = authorizeResearchProjectDocumentHandoff({ project, authority: behaviorAuthority, confirmedAt: at });
    const projection = refreshFunctionalResetDocumentPortfolio({ project, handoffDecision, requestedAt: at,
      generateProtocol: true }).projections.at(-1)!;
    const packet = prepareDrciDraftPack(project, { handoffDecision, protocolProjection: projection, crf: buildCanonicalCrfPackage(project) });
    const scopes: string[][] = [];
    const provider = vi.fn<typeof fetch>(async (_url, init) => {
      const payload = JSON.parse(String(init?.body)), context = JSON.parse(payload.input);
      expect(payload.model).toBe(model);
      expect(payload.reasoning).toEqual({ effort: "medium" });
      expect(payload.text.format).toEqual({ type: "json_object" });
      scopes.push(context.DOCUMENT_SCOPE);
      return response(JSON.stringify({ documents: context.DOCUMENT_SCOPE.map((kind: string) => ({ kind,
        title: kind, sections: [{ title: "Projet source", paragraphs: [packet.sourceFacts[0].content], sourceRefs: [] }],
        missingElements: ["Informations opérationnelles à préciser"] })), crfRows: [] }));
    });
    const result = await executeOpenAIDrciDraft(packet, "OFFLINE_ONLY", provider, undefined, null, transport);
    expect(result.modelRequested).toBe(model); expect(result.modelReturned).toBe(model);
    expect(result.calls).toBe(2); expect(scopes.flat()).toHaveLength(4);
    expect(JSON.stringify(project)).toBe(before);
  });

  it("prices actual usage, cache and long-context premiums without changing budget gates", () => {
    const body = JSON.stringify(buildOpenAITerraConversationPayload(prepareTerraConversation(scientificRequest(), true)));
    const bound = boundCanaryProviderCall(endpoint, body, 2000)!;
    expect(bound.model).toBe(model); expect(bound.upperBoundUsd).toBe(0.085);
    const settled = settleCanaryProviderCall(bound, JSON.stringify({ model, status: "completed",
      usage: { input_tokens: 1000, output_tokens: 200, input_tokens_details: { cached_tokens: 100 } } }))!;
    expect(settled.measuredCostUsd).toBeCloseTo(0.00381, 10);
    expect(canaryBudgetAdmission(0, bound, 0)).toBe("ADMITTED");
    expect(canaryBudgetAdmission(6, bound, 0)).toBe("DENIED_HARD_BUDGET");
    expect(estimateProviderCallCostUsd(model, { inputTokens: 300000, cachedInputTokens: 0, cacheWriteTokens: 0,
      outputTokens: 1000, reasoningTokens: null, totalTokens: 301000 })).toBe(1.215);
    expect(settleCanaryProviderCall(bound, JSON.stringify({ model: "gpt-6-sol", status: "completed",
      usage: { input_tokens: 1000, output_tokens: 200 } }))).toBeNull();
  });

  it.each(["max_output_tokens", "content_filter"])("settles known incomplete/%s financially, rejects product result and never retries", async reason => {
    const packet = prepareTerraConversation(scientificRequest(), true);
    const provider = vi.fn<typeof fetch>(async () => response("", "incomplete", reason));
    await expect(executeOpenAITerraConversation(packet, "OFFLINE_ONLY", provider, undefined, transport))
      .rejects.toMatchObject({ providerStatus: `incomplete:${reason}` });
    expect(provider).toHaveBeenCalledOnce();
    const bound = boundCanaryProviderCall(endpoint, JSON.stringify(buildOpenAITerraConversationPayload(packet)), 2000)!;
    const raw = await response("", "incomplete", reason).text();
    expect(settleCanaryProviderCall(bound, raw)).toBeNull();
    expect(settleKnownIncompleteProviderUsage(bound, raw)?.measuredCostUsd).toBeGreaterThan(0);
    expect(settleKnownIncompleteProviderUsage(bound, await response("", "incomplete", reason, true).text())).toBeNull();
  });

  it.each([400, 500])("preserves provider HTTP %i failure without a fallback or second dispatch", async status => {
    const provider = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ error: { code: "provider_rejection" } }), { status }));
    await expect(executeOpenAITerraConversation(prepareTerraConversation(scientificRequest(), true),
      "OFFLINE_ONLY", provider, undefined, transport)).rejects.toMatchObject({ httpStatus: status, providerStatus: "provider_rejection" });
    expect(provider).toHaveBeenCalledOnce();
  });

  it("rejects a structurally invalid Working Draft without changing Project or reconstructing a result", async () => {
    const session = createFunctionalResetSession();
    session.runtimeTurns = [{ turnId: "u1", role: "USER", content: DOMAINS[0].text, createdAt: session.updatedAt },
      { turnId: "noxia-turn:11111111-1111-4111-8111-111111111111", role: "NOXIA",
        content: "Étude transversale proposée ; les choix restent candidats.", createdAt: session.updatedAt }];
    const request = captureProjectPreparation(session).checkpoint!.request;
    const provider = vi.fn<typeof fetch>(async () => response(JSON.stringify({ requestType: "STUDY_UPDATE", proposal: {} })));
    const result = await executeProtocolDesignerBridge({ body: request, apiKey: null, openAiApiKey: "OFFLINE_ONLY",
      openAiTransport: transport, chatRuntime: "TERRA", autonomousProjectBuild: true, fetchImpl: provider });
    expect(result.status).toBe(422);
    expect(result.body).toMatchObject({ error: { code: "WORKING_DRAFT_PREPARATION_FAILED" } });
    expect(result.body).not.toHaveProperty("workingDraftUpdate");
    expect(session.project).toBeNull();
    expect(provider).toHaveBeenCalledOnce();
  });

  it("keeps a post-dispatch transport timeout failed with no fallback/retry", async () => {
    const provider = vi.fn<typeof fetch>(async () => { throw Object.assign(new Error("OFFLINE_TIMEOUT"), { name: "AbortError" }); });
    await expect(executeOpenAITerraConversation(prepareTerraConversation(scientificRequest(), true), "OFFLINE_ONLY",
      provider, undefined, transport)).rejects.toMatchObject({ providerStatus: "TIMEOUT" });
    expect(provider).toHaveBeenCalledOnce();
  });
});
