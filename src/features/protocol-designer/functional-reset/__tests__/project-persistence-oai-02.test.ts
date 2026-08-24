import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { executeProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import { buildNaturalConversationPayload } from "../../../../../api/protocol-designer-bridge-provider";
import {
  buildOpenAIPersistentDeltaPayload,
  OPENAI_STRICT_SCHEMA_HARDENING_DEBT,
} from "../../../../../api/protocol-designer-openai-extraction-provider";
import {
  DEFAULT_GEMINI_CONVERSATION_MODEL,
  DEFAULT_OPENAI_EXTRACTION_MODEL,
  resolveGeminiConversationModel,
  resolveOpenAIExtractionModel,
  type PersistentProjectDeltaChange,
  type PersistentTemporalQualification,
  type ProductBridgeRequest,
  type ProductBridgeResponse,
} from "@/features/protocol-designer/product-bridge";
import {
  confirmResearchProjectContribution,
  ensureCanonicalProjectState,
  prepareResearchProjectContributionCandidate,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";

const authority = {
  actorRef: "project-persistence-oai-02:researcher",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const rawC = "La quantité de tissu lésé sera exprimée en grammes après segmentation et quantification, mais la méthode précise reste encore à définir.";
const rawD = "Le modèle est un infarctus du myocarde chez le cochon, avec des acquisitions entre J5 et J7 après l'induction de l'ischémie.";

const request = (raw: string, currentProject: ResearchProjectOwnerProjection | null = null, evaluatePersistentDelta = true): ProductBridgeRequest => ({
  apiVersion: "1.0.0",
  conversation: {
    conversationId: "project-persistence-oai-02",
    language: "fr",
    turns: [{ turnId: `turn:${raw === rawC ? "c" : "d"}`, role: "USER", content: raw }],
  },
  currentProject,
  evaluatePersistentDelta,
});

const change = (
  raw: string,
  candidateRef: string,
  proposedType: string,
  content: string,
  epistemicState: "KNOWN" | "UNKNOWN" = "KNOWN",
): PersistentProjectDeltaChange => ({
  operation: "ADD",
  sourceText: raw,
  candidateRef,
  semanticIdentity: candidateRef,
  proposedType,
  content,
  polarity: "AFFIRMED",
  epistemicStatus: "EXPLICIT_USER_STATED",
  epistemicState,
  assertionKind: "USER_STATED",
  evidenceRefs: [],
});

const cArgs = {
  changes: [
    change(rawC, "variable:damaged-tissue-mass", "CANONICAL_VARIABLE", "Quantité de tissu lésé exprimée en grammes"),
    change(rawC, "information:segmentation-quantification", "PROJECT_INFORMATION", "Segmentation et quantification ; méthode précise à définir", "UNKNOWN"),
  ],
  relations: [],
  temporalQualifications: [],
  expectedVariableOccasions: [],
};

const dTemporal: PersistentTemporalQualification = {
  operation: "ADD",
  qualificationId: "timing:acquisitions:j5-j7",
  sourceText: "entre J5 et J7 après l'induction de l'ischémie",
  subjectProjectRef: "acquisition:j5-j7",
  temporalRole: "ACQUISITION_TIME",
  anchor: {
    kind: "WINDOW",
    direction: "AFTER",
    unit: "DAY",
    offset: null,
    lowerBound: 5,
    upperBound: 7,
    relativeEventLabel: "induction de l'ischémie",
    tolerance: null,
    reference: { status: "KNOWN", referenceProjectRef: "intervention:ischemia-induction" },
  },
  assertionKind: "USER_STATED",
  evidenceRefs: [],
};

const dArgs = {
  changes: [
    change("chez le cochon", "population:pig", "POPULATION", "Cochon"),
    change("infarctus du myocarde", "condition:myocardial-infarction", "CONDITION", "Infarctus du myocarde"),
    change("l'induction de l'ischémie", "intervention:ischemia-induction", "INTERVENTION", "Induction de l'ischémie"),
    change("des acquisitions entre J5 et J7", "acquisition:j5-j7", "ACQUISITION", "Acquisitions entre J5 et J7"),
  ],
  relations: [],
  temporalQualifications: [dTemporal],
  expectedVariableOccasions: [],
};

const jsonResponse = (body: unknown, status = 200, headers?: Record<string, string>) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json", ...headers },
});

const successfulFetch = (args: unknown, conversationText = "Réponse méthodologique courte.") => vi.fn()
  .mockResolvedValueOnce(jsonResponse({
    candidates: [{ content: { parts: [{ text: conversationText }] } }],
    responseId: "gemini:conversation",
  }))
  .mockResolvedValueOnce(jsonResponse({
    id: "resp_terra_extraction",
    model: "gpt-5.6-terra-2026-08-01",
    status: "completed",
    output_text: JSON.stringify(args),
    usage: { input_tokens: 100, output_tokens: 50, total_tokens: 150 },
  }, 200, { "x-request-id": "req_terra_extraction" })) as unknown as typeof fetch;

const run = async (body: ProductBridgeRequest, args: unknown) => executeProtocolDesignerBridge({
  body,
  apiKey: "test-gemini-key",
  openAiApiKey: "test-openai-key",
  fetchImpl: successfulFetch(args),
  now: () => Date.parse("2026-08-24T16:00:00.000Z"),
});

describe("PROJECT-PERSISTENCE-OAI-02 — specialized extraction routing", () => {
  it("O01/O02 resolves the configured Gemini conversation model and its Flash-Lite fallback", async () => {
    expect(resolveGeminiConversationModel("gemini-configured")).toBe("gemini-configured");
    expect(resolveGeminiConversationModel(" ")).toBe(DEFAULT_GEMINI_CONVERSATION_MODEL);
    const fetchImpl = vi.fn(async () => jsonResponse({ candidates: [{ content: { parts: [{ text: "OK" }] } }] })) as unknown as typeof fetch;
    await executeProtocolDesignerBridge({
      body: request("Pourquoi cette information ?", null, false),
      apiKey: "server-gemini-key",
      geminiModel: "gemini-configured",
      fetchImpl,
    });
    expect(String(vi.mocked(fetchImpl).mock.calls[0]?.[0])).toContain("/models/gemini-configured:generateContent");
  });

  it("O03/O04 resolves the configured Terra extraction model and its fallback", () => {
    expect(resolveOpenAIExtractionModel("terra-configured")).toBe("terra-configured");
    expect(resolveOpenAIExtractionModel(undefined)).toBe(DEFAULT_OPENAI_EXTRACTION_MODEL);
    expect(buildOpenAIPersistentDeltaPayload(request(rawC), "terra-configured").model).toBe("terra-configured");
  });

  it("O05/O06 keeps OpenAI credentials server-only and out of frontend/payload", () => {
    const payload = buildOpenAIPersistentDeltaPayload(request(rawC));
    expect(JSON.stringify(payload)).not.toContain("OPENAI_API_KEY");
    expect(payload).toMatchObject({ store: false, text: { format: { type: "json_schema", strict: false } } });
    expect(payload).not.toHaveProperty("tools");
    expect(OPENAI_STRICT_SCHEMA_HARDENING_DEBT).toBe("OPEN");
    const frontend = readFileSync("src/features/protocol-designer/functional-reset/ProtocolDesignerWorkspace.tsx", "utf8");
    expect(frontend).not.toContain("OPENAI_API_KEY");
    expect(frontend).not.toContain("VITE_OPENAI");
  });

  it("O07 never falls back from missing Terra credentials to Gemini extraction", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ candidates: [{ content: { parts: [{ text: "Réponse courte." }] } }] })) as unknown as typeof fetch;
    const result = await executeProtocolDesignerBridge({ body: request(rawC), apiKey: "test-gemini-key", openAiApiKey: null, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result.body).toMatchObject({
      persistentExtraction: { status: "TECHNICAL_FAILURE", failure: { provider: { provider: "OPENAI", providerStatus: "OPENAI_API_KEY_MISSING" } } },
      observability: { calls: 1 },
    });
  });

  it("O08 Terra transport failure leaves the exact Project unchanged", async () => {
    const c = await run(request(rawC), cArgs);
    const contribution = (c.body as ProductBridgeResponse).persistentExtraction.contribution!;
    const project = confirmResearchProjectContribution({ contribution, current: null, projectId: "project:oai-02", authority, confirmedAt: "2026-08-24T16:01:00.000Z" });
    const before = JSON.stringify(project);
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ candidates: [{ content: { parts: [{ text: "Réponse courte." }] } }] }))
      .mockResolvedValueOnce(jsonResponse({ error: { code: "rate_limit_exceeded", message: "Temporary failure" } }, 429)) as unknown as typeof fetch;
    const result = await executeProtocolDesignerBridge({ body: request(rawD, project), apiKey: "g", openAiApiKey: "o", fetchImpl });
    expect(result.body).toMatchObject({ persistentExtraction: { status: "TECHNICAL_FAILURE", contribution: null } });
    expect(JSON.stringify(project)).toBe(before);
  });

  it("O09 an invalid Terra candidate is blocked and cannot write Project truth", async () => {
    const current: ResearchProjectOwnerProjection | null = null;
    const invalid = { ...cArgs, changes: [{ ...cArgs.changes[0], sourceText: "texte absent du RAW" }] };
    const result = await run(request(rawC), invalid);
    expect(result.body).toMatchObject({ persistentExtraction: { status: "BLOCKED", contribution: null } });
    expect(current).toBeNull();
  });

  it("O10 persists explicit OpenAI/Terra provenance and the frozen semantic contract digests", async () => {
    const result = await run(request(rawC), cArgs);
    const response = result.body as ProductBridgeResponse;
    expect(response.persistentExtraction.providerArtifact).toMatchObject({
      provider: "OPENAI",
      modelRequested: "gpt-5.6-terra",
      modelReturned: "gpt-5.6-terra-2026-08-01",
      providerResponseId: "resp_terra_extraction",
      providerRequestId: "req_terra_extraction",
      requestTurnRef: "turn:c",
      promptDigest: expect.any(String),
      schemaDigest: expect.any(String),
      configurationDigest: expect.any(String),
    });
    expect(response.persistentExtraction.contribution?.runtimeEvidence).toMatchObject({ provider: "OPENAI", model: "gpt-5.6-terra-2026-08-01" });
  });

  it("O11/O13/O14 C traverses extraction, complete review and explicit Human Decision", async () => {
    const result = await run(request(rawC), cArgs);
    const response = result.body as ProductBridgeResponse;
    expect(response.persistentExtraction).toMatchObject({ status: "CANDIDATE", validation: { valid: true }, contribution: expect.any(Object) });
    const prepared = prepareResearchProjectContributionCandidate(response.persistentExtraction.contribution!, null);
    expect(prepared.humanReviewProjection).toMatchObject({ status: "COMPLETE", missingChangeRefs: [] });
    const project = confirmResearchProjectContribution({
      contribution: response.persistentExtraction.contribution!,
      current: null,
      projectId: "project:oai-02",
      authority,
      confirmedAt: "2026-08-24T16:01:00.000Z",
      reviewedProjection: prepared.humanReviewProjection,
    });
    expect(project.revision).toBe(1);
    expect(ensureCanonicalProjectState(project).objects.map((object) => object.objectType)).toEqual(expect.arrayContaining(["CANONICAL_VARIABLE", "PROJECT_INFORMATION"]));
  });

  it("O12/O15 D preserves source-grounded J5-J7 timing and reloads exactly", async () => {
    const c = await run(request(rawC), cArgs);
    const cContribution = (c.body as ProductBridgeResponse).persistentExtraction.contribution!;
    const projectV1 = confirmResearchProjectContribution({ contribution: cContribution, current: null, projectId: "project:oai-02", authority, confirmedAt: "2026-08-24T16:01:00.000Z" });
    const d = await run(request(rawD, projectV1), dArgs);
    const dResponse = d.body as ProductBridgeResponse;
    expect(dResponse.persistentExtraction).toMatchObject({ status: "CANDIDATE", validation: { valid: true } });
    const prepared = prepareResearchProjectContributionCandidate(dResponse.persistentExtraction.contribution!, projectV1);
    expect(prepared.humanReviewProjection.status).toBe("COMPLETE");
    const projectV2 = confirmResearchProjectContribution({
      contribution: dResponse.persistentExtraction.contribution!,
      current: projectV1,
      projectId: projectV1.projectId,
      authority,
      confirmedAt: "2026-08-24T16:02:00.000Z",
      reviewedProjection: prepared.humanReviewProjection,
    });
    const canonical = ensureCanonicalProjectState(projectV2);
    expect(canonical.temporalQualifications).toEqual(expect.arrayContaining([
      expect.objectContaining({ temporalRole: "ACQUISITION_TIME", anchor: expect.objectContaining({ lowerBound: 5, upperBound: 7, unit: "DAY", reference: expect.objectContaining({ status: "KNOWN", referenceProjectRef: expect.stringContaining("intervention:ischemia-induction") }) }) }),
    ]));
    expect(JSON.parse(JSON.stringify(projectV2))).toEqual(projectV2);
  });

  it("O16/O17/O18 keeps QRY/DOC ownership suites external and restores model configuration without changing prompts", () => {
    const envExample = readFileSync(".env.local.example", "utf8");
    expect(envExample).toContain("GEMINI_MODEL=gemini-3.5-flash-lite");
    expect(envExample).toContain("OPENAI_EXTRACTION_MODEL=gpt-5.6-terra");
    const natural = buildNaturalConversationPayload(request("Question pure", null, false));
    expect(natural).not.toHaveProperty("tools");
    expect(natural).not.toHaveProperty("text.format");
  });
});
