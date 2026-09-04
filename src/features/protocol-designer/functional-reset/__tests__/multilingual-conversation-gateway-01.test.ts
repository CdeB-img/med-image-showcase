import { describe, expect, it, vi } from "vitest";
import { executeProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import {
  appendLanguageTurnToGatewayState,
  buildLocalizedConversationResponse,
  buildMultilingualUserTurn,
  createConversationLanguageGatewayState,
  detectConversationLanguage,
  evaluateLinguisticInvariants,
  findReusableLanguageProjection,
  languageProjectionIdentityDigest,
  materializeLanguageProjectionArtifact,
  resolveConversationLanguage,
  type LanguageProjectionArtifact,
  type LanguageProjectionRequest,
} from "@/features/protocol-designer/conversation-language-gateway";
import {
  naturalConversationContext,
  parseProductBridgeRequest,
  type ProductBridgeRequest,
} from "@/features/protocol-designer/product-bridge";
import {
  END_TO_END_TRACE_PROFILE_VERSION,
  createProductTraceRunId,
  createScientificExecutionTraceLedger,
  listEndToEndTraceEvents,
  recordConversationLanguageGatewayFailureTrace,
  recordConversationLanguageGatewayTrace,
  recordProductEntryRoutingTrace,
} from "@/features/protocol-designer/scientific-execution-trace";
import { routeProductEntry } from "../product-entry-routing";

const createdAt = "2026-09-04T12:00:00.000Z";
const model = "gemini-3.5-flash-lite";

const requestFor = (input: {
  projectionKind?: "INPUT_TO_FRENCH" | "OUTPUT_FROM_FRENCH";
  sourceText: string;
  sourceLanguage: string;
  targetLanguage: string;
}): LanguageProjectionRequest => {
  const projectionKind = input.projectionKind ?? "INPUT_TO_FRENCH";
  return {
    apiVersion: "1.0.0",
    operation: "LANGUAGE_PROJECTION",
    projectionKind,
    sourceText: input.sourceText,
    sourceLanguageHint: input.sourceLanguage,
    targetLanguage: input.targetLanguage,
    translationContractVersion: "1.0.0",
    projectionIdentityDigest: languageProjectionIdentityDigest({
      projectionKind,
      sourceText: input.sourceText,
      sourceLanguage: input.sourceLanguage,
      targetLanguage: input.targetLanguage,
      provider: "GOOGLE_GEMINI",
      model,
    }),
  };
};

const projectionFor = (input: {
  request: LanguageProjectionRequest;
  detectedLanguage: string;
  translatedText: string;
  limitations?: readonly string[];
}): LanguageProjectionArtifact => materializeLanguageProjectionArtifact({
  request: input.request,
  result: {
    detectedLanguage: input.detectedLanguage,
    supportStatus: "SUPPORTED",
    qualificationStatus: ["fr", "en", "ja", "zh"].includes(input.detectedLanguage)
      ? "QUALIFIED"
      : "PROVIDER_SUPPORTED_UNQUALIFIED",
    translatedText: input.translatedText,
    ambiguityPreserved: true,
    limitations: input.limitations ?? [],
  },
  model,
  providerResponseId: "gemini-language:test",
  createdAt,
});

describe("MULTILINGUAL-CONVERSATION-GATEWAY-01 — bounded language contract", () => {
  it("uses French input directly without a provider projection", () => {
    const originalText = "Je veux construire une étude prospective comparant deux groupes.";
    const detection = detectConversationLanguage(originalText);
    const turn = buildMultilingualUserTurn({
      turnId: "turn:fr",
      originalText,
      detection,
      currentConversationLanguage: null,
      projection: null,
    });
    expect(detection).toMatchObject({ detectedLanguage: "fr", status: "DETECTED" });
    expect(turn).toMatchObject({
      originalText,
      sourceLanguage: "fr",
      conversationLanguage: "fr",
      workingLanguage: "fr",
      frenchWorkingText: originalText,
      translationRequired: false,
      translationStatus: "NOT_REQUIRED",
      translationProvider: "NONE",
    });
    expect(turn.provenance).toMatchObject({ originalIsImmutableEvidence: true, workingProjectionIsUserLiteral: false });
  });

  it("preserves the exact frozen English intent while routing from a derived French projection", () => {
    const originalText = "We have historical cardiac MRI and echocardiography data from patients followed after a first myocardial infarction, and we can prospectively recruit new patients with follow-up imaging. We want to understand adverse left ventricular remodeling, but the exact study design, timing, primary endpoint, and role of each imaging modality are not decided.";
    const french = "Nous disposons de données historiques de MRI cardiaque et d’échocardiographie chez des patients suivis après un premier infarctus du myocarde, et nous pouvons recruter prospectivement de nouveaux patients avec une imagerie de suivi. Nous voulons comprendre le remodelage ventriculaire gauche défavorable, mais le design exact de l’étude, la temporalité, le critère principal et le rôle de chaque modalité d’imagerie ne sont pas décidés.";
    const request = requestFor({ sourceText: originalText, sourceLanguage: "en", targetLanguage: "fr" });
    const projection = projectionFor({ request, detectedLanguage: "en", translatedText: french });
    const turn = buildMultilingualUserTurn({
      turnId: "turn:en",
      originalText,
      detection: detectConversationLanguage(originalText),
      currentConversationLanguage: null,
      projection,
    });
    const state = appendLanguageTurnToGatewayState({ state: createConversationLanguageGatewayState(), turn, projection });
    const bridgeRequest: ProductBridgeRequest = {
      apiVersion: "1.0.0",
      requestKind: "USER_TURN",
      conversation: {
        conversationId: "conversation:en",
        language: "fr",
        turns: [{ turnId: turn.turnId, role: "USER", content: originalText, createdAt }],
      },
      currentProject: null,
      evaluatePersistentDelta: false,
      languageBoundary: {
        contract: "PRODUCT_BRIDGE_LANGUAGE_BOUNDARY",
        contractVersion: "1.0.0",
        workingLanguage: "fr",
        turnProjections: [{
          turnId: turn.turnId,
          originalTextDigest: turn.originalTextDigest,
          frenchWorkingText: french,
          frenchWorkingTextDigest: turn.frenchWorkingTextDigest!,
          sourceLanguage: "en",
          translationProjectionRef: projection.projectionId,
          originalIsImmutableEvidence: true,
          workingProjectionIsUserLiteral: false,
        }],
      },
    };
    expect(turn.originalText).toBe(originalText);
    expect(turn.frenchWorkingText).toBe(french);
    expect(turn.conversationLanguage).toBe("en");
    expect(naturalConversationContext(bridgeRequest)).toContain(`Chercheur : ${french}`);
    expect(naturalConversationContext(bridgeRequest)).not.toContain(`Chercheur : ${originalText}`);
    expect(parseProductBridgeRequest(bridgeRequest)).not.toBeNull();
    expect(parseProductBridgeRequest({
      ...bridgeRequest,
      languageBoundary: {
        ...bridgeRequest.languageBoundary!,
        turnProjections: [{
          ...bridgeRequest.languageBoundary!.turnProjections[0],
          originalTextDigest: "digest:tampered",
        }],
      },
    })).toBeNull();
    expect(state.projectWriteAuthorized).toBe(false);
    expect(state.scientificDecisionAuthorized).toBe(false);
  });

  it("preserves Japanese numbers, MRI units, uncertainty, conditionality and UNKNOWN status", () => {
    const source = "もし 1.5 T と 3 T の MRI を比較する場合、結果は異なるかもしれません。主要な判断は UNKNOWN です。";
    const target = "Si l’on compare la MRI à 1.5 T et 3 T, les résultats pourraient être différents. La décision principale reste UNKNOWN.";
    const request = requestFor({ sourceText: source, sourceLanguage: "ja", targetLanguage: "fr" });
    const projection = projectionFor({ request, detectedLanguage: "ja", translatedText: target });
    expect(detectConversationLanguage(source)).toMatchObject({ detectedLanguage: "ja", confidence: "HIGH" });
    expect(projection.invariants.filter((item) => item.status === "PRESERVED").map((item) => item.invariant)).toEqual(expect.arrayContaining([
      "NUMBERS", "UNITS", "IDENTIFIERS", "UNCERTAINTY", "CONDITIONALITY", "COMPARISON", "DECISION_STATUS",
    ]));
  });

  it("preserves Chinese comparison, negation, uncertainty and technical acronyms", () => {
    const source = "比较 MRI 与 CT；我们没有决定主要终点，MRI 可能更敏感。";
    const target = "Comparer MRI et CT ; nous n’avons pas décidé le critère principal et la MRI pourrait être plus sensible.";
    const request = requestFor({ sourceText: source, sourceLanguage: "zh", targetLanguage: "fr" });
    const projection = projectionFor({ request, detectedLanguage: "zh", translatedText: target });
    expect(detectConversationLanguage(source)).toMatchObject({ detectedLanguage: "zh", confidence: "HIGH" });
    expect(projection.invariants.filter((item) => item.status === "PRESERVED").map((item) => item.invariant)).toEqual(expect.arrayContaining([
      "IDENTIFIERS", "NEGATION", "UNCERTAINTY", "COMPARISON",
    ]));
  });

  it("keeps a mixed French scientific sentence in French and does not switch on weak English evidence", () => {
    const mixed = detectConversationLanguage("Je veux comparer le late gadolinium enhancement avec la cartographie T1 dans cette étude.");
    expect(mixed).toMatchObject({ detectedLanguage: "fr", status: "DETECTED" });
    const weak = resolveConversationLanguage({
      currentConversationLanguage: "fr",
      detection: { status: "INSUFFICIENT_EVIDENCE", detectedLanguage: null, confidence: "LOW", reasonCode: "TURN_TOO_SHORT_TO_ESTABLISH_LANGUAGE" },
    });
    expect(weak).toEqual({ conversationLanguage: "fr", switchCandidate: null });
    const genuine = resolveConversationLanguage({
      currentConversationLanguage: "fr",
      detection: { status: "DETECTED", detectedLanguage: "ja", confidence: "HIGH", reasonCode: "JAPANESE_KANA_SCRIPT" },
    });
    expect(genuine.conversationLanguage).toBe("fr");
    expect(genuine.switchCandidate).toMatchObject({ fromLanguage: "fr", toLanguage: "ja", adopted: false });
  });

  it("requires provider attestation for ambiguity and keeps the bounded ambiguity note", () => {
    const source = "Assess uptake in the lesion with the reference region, where 'with' may mean joint analysis or normalization.";
    const target = "Évaluer la fixation dans la lésion avec la région de référence, où « avec » peut signifier une analyse conjointe ou une normalisation.";
    const request = requestFor({ sourceText: source, sourceLanguage: "en", targetLanguage: "fr" });
    const projection = projectionFor({ request, detectedLanguage: "en", translatedText: target, limitations: ["LINGUISTIC_AMBIGUITY_PRESENT"] });
    expect(projection.ambiguityPreserved).toBe(true);
    expect(projection.limitations).toContain("LINGUISTIC_AMBIGUITY_PRESENT");
    expect(() => materializeLanguageProjectionArtifact({
      request,
      result: {
        detectedLanguage: "en",
        supportStatus: "SUPPORTED",
        qualificationStatus: "QUALIFIED",
        translatedText: target,
        ambiguityPreserved: false,
        limitations: [],
      },
      model,
      providerResponseId: null,
      createdAt,
    })).toThrow(/AMBIGUITY_PRESERVATION_NOT_ATTESTED/u);
  });

  it("fails closed for unsupported or invariant-breaking provider output", () => {
    const request = requestFor({ sourceText: "No MRI at 3 T; status UNKNOWN.", sourceLanguage: "en", targetLanguage: "fr" });
    expect(() => materializeLanguageProjectionArtifact({
      request,
      result: {
        detectedLanguage: "en",
        supportStatus: "UNSUPPORTED",
        qualificationStatus: "UNKNOWN",
        translatedText: "IRM.",
        ambiguityPreserved: true,
        limitations: [],
      },
      model,
      providerResponseId: null,
      createdAt,
    })).toThrow(/LANGUAGE_UNSUPPORTED/u);
    expect(() => materializeLanguageProjectionArtifact({
      request,
      result: {
        detectedLanguage: "en",
        supportStatus: "UNKNOWN",
        qualificationStatus: "UNKNOWN",
        translatedText: "Pas de MRI à 3 T ; statut UNKNOWN.",
        ambiguityPreserved: true,
        limitations: [],
      },
      model,
      providerResponseId: null,
      createdAt,
    })).toThrow(/LANGUAGE_UNKNOWN/u);
    expect(() => projectionFor({ request, detectedLanguage: "en", translatedText: "IRM retenue." })).toThrow(/LINGUISTIC_INVARIANT_UNVERIFIED/u);
  });

  it("deduplicates an unchanged projection identity and keeps localized prose non-authoritative", () => {
    const request = requestFor({ sourceText: "We want a prospective MRI study.", sourceLanguage: "en", targetLanguage: "fr" });
    const projection = projectionFor({ request, detectedLanguage: "en", translatedText: "Nous voulons une étude MRI prospective." });
    const turn = buildMultilingualUserTurn({
      turnId: "turn:dedup",
      originalText: request.sourceText,
      detection: detectConversationLanguage(request.sourceText),
      currentConversationLanguage: null,
      projection,
    });
    const state = appendLanguageTurnToGatewayState({ state: createConversationLanguageGatewayState(), turn, projection });
    expect(findReusableLanguageProjection({ state, projectionIdentityDigest: request.projectionIdentityDigest })).toBe(projection);
    const outputRequest = requestFor({
      projectionKind: "OUTPUT_FROM_FRENCH",
      sourceText: "La structure proposée reste à confirmer.",
      sourceLanguage: "fr",
      targetLanguage: "en",
    });
    const localized = buildLocalizedConversationResponse({
      responseId: "response:dedup",
      sourceTurnRef: turn.turnId,
      canonicalFrenchResponse: outputRequest.sourceText,
      targetLanguage: "en",
      projection: projectionFor({ request: outputRequest, detectedLanguage: "fr", translatedText: "The proposed structure remains to be confirmed." }),
    });
    expect(localized.internalFrenchResponse).toBe(outputRequest.sourceText);
    expect(localized.localizedResponse).toBe("The proposed structure remains to be confirmed.");
    expect(localized.provenance.localizedProseIsScientificTruth).toBe(false);
  });

  it("reuses the existing Gemini bridge for one structured projection call without Project authority", async () => {
    const request = requestFor({ sourceText: "We want a prospective MRI study.", sourceLanguage: "en", targetLanguage: "fr" });
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      responseId: "gemini-language:api",
      candidates: [{ content: { parts: [{ functionCall: { name: "return_language_projection", args: {
        detectedLanguage: "en",
        supportStatus: "SUPPORTED",
        qualificationStatus: "QUALIFIED",
        translatedText: "Nous voulons une étude MRI prospective.",
        ambiguityPreserved: true,
        limitations: [],
      } } }] } }],
    }), { status: 200, headers: { "content-type": "application/json" } })) as unknown as typeof fetch;
    const result = await executeProtocolDesignerBridge({ body: request, apiKey: "test-key", fetchImpl, now: () => Date.parse(createdAt) });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      status: 200,
      body: {
        operation: "LANGUAGE_PROJECTION",
        projection: { provider: "GOOGLE_GEMINI", projectWriteAuthorized: false, scientificDecisionAuthorized: false },
        observability: { provider: "GOOGLE_GEMINI", calls: 1 },
      },
    });
  });

  it("uses the existing one-attempt provider policy and reports a bounded language failure", async () => {
    const request = requestFor({ sourceText: "We want a prospective MRI study.", sourceLanguage: "en", targetLanguage: "fr" });
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      error: { status: "UNAVAILABLE", message: "temporary failure" },
    }), { status: 503, headers: { "content-type": "application/json" } })) as unknown as typeof fetch;
    const result = await executeProtocolDesignerBridge({ body: request, apiKey: "test-key", fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      status: 503,
      body: {
        error: {
          code: "LANGUAGE_PROJECTION_PROVIDER_FAILURE",
          provider: { stage: "LANGUAGE_PROJECTION", httpStatus: 503, providerStatus: "UNAVAILABLE" },
        },
      },
    });
  });

  it("starts TRACE at the user turn, includes language and Router on an early UNDERSTAND path, and records projection failure before routing", () => {
    const sessionId = "session:language-trace";
    const conversationId = "conversation:language-trace";
    const turn = buildMultilingualUserTurn({
      turnId: "turn:understand",
      originalText: "Je veux comprendre cette étude et ce que NOXIA peut faire.",
      detection: detectConversationLanguage("Je veux comprendre cette étude et ce que NOXIA peut faire."),
      currentConversationLanguage: null,
      projection: null,
    });
    const traceRunId = createProductTraceRunId(sessionId, turn.turnId);
    let ledger = recordConversationLanguageGatewayTrace({
      ledger: createScientificExecutionTraceLedger(sessionId),
      traceRunId,
      conversationId,
      turn,
      observedAt: createdAt,
    });
    const routing = routeProductEntry({
      raw: turn.frenchWorkingText!,
      sourceTurnRef: turn.turnId,
      routedAt: createdAt,
      forceUnderstand: true,
    });
    ledger = recordProductEntryRoutingTrace({
      ledger,
      traceRunId,
      conversationId,
      routing,
      routerInputRef: turn.turnId,
      routerInputDigest: turn.frenchWorkingTextDigest!,
      observedAt: createdAt,
    });
    const events = listEndToEndTraceEvents({ ledger, traceRunId });
    expect(routing.routeIntent).toBe("UNDERSTAND");
    expect(events.map((event) => event.stage)).toEqual([
      "USER_TURN_RECEIVED",
      "LANGUAGE_DETECTED",
      "LANGUAGE_PROJECTION_NOT_REQUIRED",
      "ROUTE_SELECTED",
      "INTENT_REPRESENTED",
    ]);
    expect(events[0].contractVersion).toBe(END_TO_END_TRACE_PROFILE_VERSION);
    expect(events.find((event) => event.stage === "ROUTE_SELECTED")?.input[0]?.digest).toBe(turn.frenchWorkingTextDigest);

    const failedTurnId = "turn:failed-language";
    const failedRunId = createProductTraceRunId(sessionId, failedTurnId);
    const failed = recordConversationLanguageGatewayFailureTrace({
      ledger,
      traceRunId: failedRunId,
      conversationId,
      turnId: failedTurnId,
      originalTextDigest: "digest:source",
      projectionSourceTextDigest: "digest:source",
      detection: { status: "DETECTED", detectedLanguage: "ja", confidence: "HIGH", reasonCode: "JAPANESE_KANA_SCRIPT" },
      projectionKind: "INPUT_TO_FRENCH",
      targetLanguage: "fr",
      failureCode: "LANGUAGE_PROJECTION_PROVIDER_FAILURE",
      observedAt: createdAt,
    });
    expect(listEndToEndTraceEvents({ ledger: failed, traceRunId: failedRunId }).map((event) => event.stage)).toEqual([
      "USER_TURN_RECEIVED",
      "LANGUAGE_DETECTED",
      "LANGUAGE_PROJECTION_FAILED",
    ]);
    expect(evaluateLinguisticInvariants("No MRI at 3 T; UNKNOWN.", "Pas de MRI à 3 T ; UNKNOWN.")
      .filter((item) => item.status === "UNKNOWN")).toEqual([]);
  });
});
