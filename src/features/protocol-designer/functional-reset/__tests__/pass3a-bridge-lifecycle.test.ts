import { describe, expect, it, vi } from "vitest";
import { executeProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import { buildPersistentSourceCatalog, type ProductBridgeRequest, type ProductBridgeResponse } from "@/features/protocol-designer/product-bridge";
import { confirmResearchProjectContribution, prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import type { GovernedConversationEnvelope } from "@/features/query-navigation/governed-conversation-realization";
import { COLCHICINE_INITIAL, makeFunctionalResetContribution } from "./functional-reset-fixtures";

const CREATED_AT = "2026-09-08T16:00:00.000Z";
const RAW = "Ajouter une visite de contrôle.";

const adoptedProject = () => confirmResearchProjectContribution({
  contribution: makeFunctionalResetContribution([{ turnId: "pass3a:initial", role: "USER", content: COLCHICINE_INITIAL, createdAt: CREATED_AT }]),
  current: null,
  projectId: "project:pass3a-bridge-lifecycle",
  authority: {
    actorRef: "pass3a:test:researcher", mandateRef: "PROJECT_OWNER",
    authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION", verification: "DEMO_SESSION_NOT_AUTHENTICATED",
  },
  confirmedAt: CREATED_AT,
});

const requestFor = (options: { adopted?: boolean; eligible?: boolean; raw?: string } = {}): ProductBridgeRequest => ({
  apiVersion: "1.0.0",
  requestKind: "USER_TURN",
  conversation: {
    conversationId: "conversation:pass3a-bridge-lifecycle", language: "fr",
    turns: [{ turnId: "turn:pass3a-bridge-lifecycle", role: "USER", content: options.raw ?? RAW, createdAt: CREATED_AT }],
  },
  currentProject: options.adopted ? adoptedProject() : null,
  evaluatePersistentDelta: options.eligible ?? true,
});

/** Same explicit VISIT fixture contract as p1-persistent-first-pass-01.test.ts. */
const visitArgs = (request: ProductBridgeRequest) => {
  const anchor = buildPersistentSourceCatalog(request.conversation).anchors
    .find((item) => item.exactText.includes("visite de contrôle"));
  if (!anchor) throw new Error("TEST_SOURCE_ANCHOR_MISSING");
  return {
    changes: [{
      operation: "ADD", sourceAnchorId: anchor.anchorId, targetSectionId: "TEMPORALITY",
      candidateRef: "candidate:pass3a:control-visit", semanticIdentity: "VISIT:controle",
      proposedType: "VISIT", content: "Visite de contrôle", polarity: "AFFIRMED",
      epistemicStatus: "EXPLICIT_USER_STATED", epistemicState: "KNOWN", assertionKind: "USER_STATED", evidenceRefs: [],
    }],
    relations: [], temporalQualifications: [], expectedVariableOccasions: [],
  };
};

const invalidAnchorArgs = (request: ProductBridgeRequest) => {
  const valid = visitArgs(request);
  return { ...valid, changes: [{ ...valid.changes[0], sourceAnchorId: "source-anchor:invented-by-fixture" }] };
};

const jsonResponse = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
  status, headers: { "content-type": "application/json" },
});

/** A deterministic mechanics fixture, not an evaluated natural-language response. */
const howResponse = (requestBody: string) => {
  const payload = JSON.parse(requestBody);
  let text = "La proposition reste à examiner ; aucune décision n’est prise.";
  if (payload.generationConfig?.responseMimeType === "application/json") {
    const envelope = JSON.parse(payload.contents[0].parts[0].text) as GovernedConversationEnvelope;
    const reply = `À ce stade : ${envelope.purpose}${envelope.action === "ASK_QUESTION" ? " ?" : "."}${envelope.protectedLiterals.length
      ? ` ${envelope.protectedLiterals.map((item) => item.literal).join(" ; ")}.` : ""}`;
    text = JSON.stringify({
      assistantReply: reply,
      claim: {
        whatRef: envelope.whatRef, action: envelope.action, actionWitness: reply,
        targetRefs: envelope.targetRefs,
        informationNeedRefs: envelope.selectedInformationNeedRef ? [envelope.selectedInformationNeedRef] : [],
        contentClaims: envelope.requiredContentRefs.map((ref) => ({
          ref, witness: reply, status: envelope.authorizedContent.find((item) => item.ref === ref)!.status,
        })),
        relationClaims: envelope.requiredRelations.map((item) => ({ ...item, witness: reply })),
        adoptionClaimed: false, projectWriteClaimed: false,
      },
    });
  }
  return jsonResponse({ candidates: [{ content: { parts: [{ text }] } }], responseId: "gemini:pass3a-how" });
};

const isolatedProviderMocks = (options: {
  extractionOutputs?: readonly unknown[];
  extractionHttpStatus?: number;
  howHttpStatus?: number;
  beforeHow?: (requestBody: string) => void;
}) => {
  const events: string[] = [];
  let extractionIndex = 0;
  const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const endpoint = String(url);
    if (endpoint.startsWith("https://api.openai.com/v1/responses")) {
      events.push("OPENAI_PERSISTENT_EXTRACTION");
      const index = extractionIndex++;
      if (options.extractionHttpStatus) return jsonResponse({ error: { code: "service_unavailable", message: "Mocked extraction failure" } }, options.extractionHttpStatus);
      if (index >= (options.extractionOutputs?.length ?? 0)) throw new Error("TEST_FORBIDS_EXTRACTION_RETRY_OR_EXTRA_CALL");
      return jsonResponse({
        id: `openai:pass3a:attempt-${index + 1}`, model: "gpt-5.6-terra", status: "completed",
        output_text: JSON.stringify(options.extractionOutputs![index]),
        usage: { input_tokens: 100, output_tokens: 50, total_tokens: 150 },
      });
    }
    if (endpoint.startsWith("https://generativelanguage.googleapis.com/")) {
      events.push("GEMINI_HOW");
      options.beforeHow?.(String(init?.body));
      if (options.howHttpStatus) return jsonResponse({ error: { status: "UNAVAILABLE", message: "Mocked HOW failure" } }, options.howHttpStatus);
      return howResponse(String(init?.body));
    }
    throw new Error(`TEST_FORBIDS_UNEXPECTED_ENDPOINT:${endpoint}`);
  });
  return { events, fetchMock, fetchImpl: fetchMock as unknown as typeof fetch };
};

const execute = (body: ProductBridgeRequest, mocks: ReturnType<typeof isolatedProviderMocks>) => executeProtocolDesignerBridge({
  body,
  apiKey: "synthetic-unused-gemini-credential",
  openAiApiKey: "synthetic-unused-openai-credential",
  fetchImpl: mocks.fetchImpl,
  now: () => Date.parse(CREATED_AT),
});

describe("PASS3A — extraction transaction before downstream HOW", () => {
  it("retains the post-adoption native WHAT on HOW failure with one attempted call and no extraction", async () => {
    const request = { ...requestFor({ adopted: true, eligible: false }), requestKind: "POST_ADOPTION_QRY_CONTINUATION" as const };
    const before = JSON.stringify(request);
    const mocks = isolatedProviderMocks({ howHttpStatus: 503 });
    const result = await execute(request, mocks);
    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ conversationFailure: { stage: "HOW" },
      currentTurnNavigation: { envelope: { projectBinding: { projectId: request.currentProject!.projectId } } },
      persistentExtraction: { called: false, contribution: null },
      observability: { conversationCalls: 1, conversationResponseReceived: false, extractionAttempts: 0, calls: 1, projectWrites: 0 } });
    expect(mocks.events).toEqual(["GEMINI_HOW"]);
    expect(JSON.stringify(request)).toBe(before);
  });
  it("finishes the existing extraction before HOW without adding extraction calls", async () => {
    const request = requestFor();
    const mocks = isolatedProviderMocks({ extractionOutputs: [visitArgs(request)] });
    const result = await execute(request, mocks);

    expect(mocks.events).toEqual(["OPENAI_PERSISTENT_EXTRACTION", "GEMINI_HOW"]);
    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({
      persistentExtraction: { status: "CANDIDATE", validation: { valid: true }, contribution: expect.any(Object), recovery: null },
      observability: { extractionAttempts: 1, calls: 2, projectWrites: 0 },
    });
    expect(request.currentProject).toBeNull();
  });

  it("returns the validated candidate receipt when HOW fails, without adopting or mutating Project", async () => {
    const request = requestFor({ adopted: true });
    const before = JSON.stringify(request);
    const mocks = isolatedProviderMocks({ extractionOutputs: [visitArgs(request)], howHttpStatus: 503 });
    const result = await execute(request, mocks);
    const response = result.body as ProductBridgeResponse;

    expect(result.status).toBe(200); // Partial transaction receipt, not successful visible realization.
    expect(response).toMatchObject({
      assistantReply: "",
      conversationFailure: { stage: "HOW", code: "CONVERSATION_PROVIDER_FAILURE" },
      persistentExtraction: { status: "CANDIDATE", validation: { valid: true }, contribution: expect.any(Object) },
      observability: { extractionAttempts: 1, calls: 2, projectWrites: 0 },
    });
    expect(response.persistentExtraction.contribution!.source.sourceRefs).toContain(request.conversation.turns[0].turnId);
    const candidate = prepareResearchProjectContributionCandidate(response.persistentExtraction.contribution!, request.currentProject);
    expect(candidate.projectWriteAuthorized).toBe(false);
    expect(candidate.changeSet.baseProjectVersion).toBe(request.currentProject!.versionId);
    expect(mocks.events).toEqual(["OPENAI_PERSISTENT_EXTRACTION", "GEMINI_HOW"]);
    expect(JSON.stringify(request)).toBe(before);
  });

  it("does not fabricate a valid candidate after an extraction transport failure", async () => {
    const request = requestFor({ adopted: true });
    const before = JSON.stringify(request.currentProject);
    const mocks = isolatedProviderMocks({ extractionHttpStatus: 503 });
    const result = await execute(request, mocks);

    expect(result.body).toMatchObject({
      persistentExtraction: { status: "TECHNICAL_FAILURE", candidate: null, validation: null, contribution: null, recovery: null },
      observability: { extractionAttempts: 1, projectWrites: 0 },
    });
    expect(mocks.events.filter((stage) => stage === "OPENAI_PERSISTENT_EXTRACTION")).toHaveLength(1);
    expect(JSON.stringify(request.currentProject)).toBe(before);
  });

  it("does not extract when the existing caller eligibility says no persistent consequence", async () => {
    const request = requestFor({ eligible: false, raw: "Compare les deux méthodes déjà évoquées sans construire de projet." });
    const mocks = isolatedProviderMocks({});
    const result = await execute(request, mocks);

    expect(mocks.events).toEqual(["GEMINI_HOW"]);
    expect(result.body).toMatchObject({
      persistentExtraction: { called: false, status: "NOT_REQUESTED", candidate: null, contribution: null },
      observability: { extractionAttempts: 0, extractionProvider: null, calls: 1, projectWrites: 0 },
    });
  });

  it("completes validation-driven existing recovery before HOW, at most two extractions", async () => {
    const request = requestFor();
    const mocks = isolatedProviderMocks({ extractionOutputs: [invalidAnchorArgs(request), visitArgs(request)] });
    const result = await execute(request, mocks);

    // The second extraction is reachable only after deterministic rejection of the first.
    expect(mocks.events).toEqual(["OPENAI_PERSISTENT_EXTRACTION", "OPENAI_PERSISTENT_EXTRACTION", "GEMINI_HOW"]);
    expect(result.body).toMatchObject({
      persistentExtraction: { status: "CANDIDATE", validation: { valid: true },
        recovery: { attempted: true, triggerBlocks: ["change:0:SOURCE_ANCHOR_ID_INVALID"], outcome: "CANDIDATE" } },
      observability: { extractionAttempts: 2, calls: 3, projectWrites: 0 },
    });
  });

  it("retains the valid recovered candidate when HOW then fails, without a third extraction or HOW retry", async () => {
    const request = requestFor();
    const mocks = isolatedProviderMocks({ extractionOutputs: [invalidAnchorArgs(request), visitArgs(request)], howHttpStatus: 503 });
    const result = await execute(request, mocks);

    expect(result.body).toMatchObject({
      conversationFailure: { stage: "HOW" },
      persistentExtraction: { status: "CANDIDATE", validation: { valid: true }, contribution: expect.any(Object), recovery: { outcome: "CANDIDATE" } },
      observability: { extractionAttempts: 2, calls: 3, projectWrites: 0 },
    });
    expect(mocks.events).toEqual(["OPENAI_PERSISTENT_EXTRACTION", "OPENAI_PERSISTENT_EXTRACTION", "GEMINI_HOW"]);
  });

  it("keeps invalid output blocked after the existing bounded second attempt", async () => {
    const request = requestFor();
    const mocks = isolatedProviderMocks({ extractionOutputs: [invalidAnchorArgs(request), invalidAnchorArgs(request)] });
    const result = await execute(request, mocks);

    expect(result.body).toMatchObject({
      persistentExtraction: { status: "BLOCKED", validation: { valid: false }, contribution: null, recovery: { attempted: true, outcome: "BLOCKED" } },
      observability: { extractionAttempts: 2, calls: 3, projectWrites: 0 },
    });
    expect(mocks.events.filter((stage) => stage === "OPENAI_PERSISTENT_EXTRACTION")).toHaveLength(2);
  });

  it("does not invent a partial candidate receipt when neither extraction nor HOW succeeded", async () => {
    const request = requestFor();
    const mocks = isolatedProviderMocks({ extractionHttpStatus: 503, howHttpStatus: 503 });
    const result = await execute(request, mocks);

    expect(result.status).toBe(503);
    expect(result.body).toMatchObject({ error: { stage: "HOW", code: "CONVERSATION_PROVIDER_FAILURE" } });
    expect(result.body).not.toHaveProperty("persistentExtraction.contribution");
    expect(mocks.events).toEqual(["OPENAI_PERSISTENT_EXTRACTION", "GEMINI_HOW"]);
  });
});
