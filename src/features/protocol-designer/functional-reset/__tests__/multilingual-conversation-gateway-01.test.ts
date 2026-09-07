import { describe, expect, it, vi } from "vitest";
import { executeProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import {
  appendLanguageTurnToGatewayState,
  buildLanguageProjectionProviderPayload,
  buildLocalizedConversationResponse,
  buildMultilingualUserTurn,
  createConversationLanguageGatewayState,
  detectConversationLanguage,
  evaluateLinguisticInvariants,
  extractProtectedOpaqueLiterals,
  findReusableLanguageProjection,
  languageProjectionIdentityDigest,
  LanguageProjectionContractError,
  materializeLanguageProjectionArtifact,
  parseLanguageProjectionProviderResult,
  parseLanguageProjectionRequest,
  resolveConversationLanguage,
  type LanguageProjectionArtifact,
  type LanguageProjectionRequest,
  type ProviderSemanticInvariantEvidence,
  type ProtectedOpaqueLiteral,
} from "@/features/protocol-designer/conversation-language-gateway";
import {
  naturalConversationContext,
  parseProductBridgeRequest,
  type ProductBridgeRequest,
} from "@/features/protocol-designer/product-bridge";
import {
  END_TO_END_TRACE_PROFILE_VERSION,
  createProductTraceRunId,
  createScientificTraceCaptureConfiguration,
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
  protectedOpaqueLiterals?: readonly ProtectedOpaqueLiteral[];
}): LanguageProjectionRequest => {
  const projectionKind = input.projectionKind ?? "INPUT_TO_FRENCH";
  const protectedOpaqueLiterals = [
    ...extractProtectedOpaqueLiterals(input.sourceText),
    ...(input.protectedOpaqueLiterals ?? []),
  ];
  return {
    apiVersion: "1.0.0",
    operation: "LANGUAGE_PROJECTION",
    projectionKind,
    sourceText: input.sourceText,
    sourceLanguageHint: input.sourceLanguage,
    targetLanguage: input.targetLanguage,
    translationContractVersion: "1.3.0",
    projectionIdentityDigest: languageProjectionIdentityDigest({
      projectionKind,
      sourceText: input.sourceText,
      sourceLanguage: input.sourceLanguage,
      targetLanguage: input.targetLanguage,
      provider: "GOOGLE_GEMINI",
      model,
      protectedOpaqueLiterals,
    }),
    protectedOpaqueLiterals,
  };
};

const SEMANTIC_INVARIANTS = ["NEGATION", "UNCERTAINTY", "CONDITIONALITY", "COMPARISON", "TEMPORAL_RELATION"] as const;

const semanticInvariantsFor = (
  source: string,
  target: string,
  overrides: readonly (Omit<ProviderSemanticInvariantEvidence, "attestationStatus"> & Partial<Pick<ProviderSemanticInvariantEvidence, "attestationStatus">>)[] = [],
): readonly ProviderSemanticInvariantEvidence[] => {
  const detected = evaluateLinguisticInvariants(source, target);
  return SEMANTIC_INVARIANTS.map((invariant) => {
    const override = overrides.find((item) => item.invariantId === invariant);
    if (override) return { attestationStatus: "ATTESTED", ...override };
    const evidence = detected.find((item) => item.invariant === invariant);
    return {
      invariantId: invariant,
      attestationStatus: "ATTESTED",
      sourcePresent: evidence?.status !== "NOT_PRESENT",
      preserved: evidence?.status === "PRESERVED",
      sourceEvidence: evidence?.sourceEvidence ?? [],
      targetEvidence: evidence?.targetEvidence ?? [],
    };
  });
};

const projectionFor = (input: {
  request: LanguageProjectionRequest;
  detectedLanguage: string;
  translatedText: string;
  translatedTextLanguage?: string;
  limitations?: readonly string[];
  semanticInvariants?: readonly ProviderSemanticInvariantEvidence[];
}): LanguageProjectionArtifact => materializeLanguageProjectionArtifact({
  request: input.request,
  result: {
    detectedLanguage: input.detectedLanguage,
    supportStatus: "SUPPORTED",
    qualificationStatus: ["fr", "en", "ja", "zh"].includes(input.detectedLanguage)
      ? "QUALIFIED"
      : "PROVIDER_SUPPORTED_UNQUALIFIED",
    translatedText: input.translatedText,
    translatedTextLanguage: input.translatedTextLanguage ?? input.request.targetLanguage,
    ambiguityPreserved: true,
    semanticInvariants: input.semanticInvariants ?? semanticInvariantsFor(input.request.sourceText, input.translatedText),
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

  it("accepts the exact FIC02 witness MRI to IRM projection without treating scientific acronyms as opaque identifiers", () => {
    const originalText = "We have historical cardiac MRI and echocardiography data from patients followed after a first myocardial infarction, and we can prospectively recruit new patients with follow-up imaging. We want to understand adverse left ventricular remodeling, but the exact study design, timing, primary endpoint, and role of each imaging modality are not decided.";
    const translatedText = "Nous disposons de données historiques d'IRM cardiaque et d'échocardiographie provenant de patients suivis après un premier infarctus du myocarde, et nous pouvons recruter de nouveaux patients de manière prospective avec une imagerie de suivi. Nous voulons comprendre le remodelage ventriculaire gauche indésirable, mais le plan d'étude exact, le calendrier, le critère d'évaluation principal et le rôle de chaque modalité d'imagerie ne sont pas décidés.";
    const request = requestFor({ sourceText: originalText, sourceLanguage: "en", targetLanguage: "fr" });
    const projection = projectionFor({ request, detectedLanguage: "en", translatedText });
    expect(projection.translatedText).toBe(translatedText);
    expect(projection.invariants.find((item) => item.invariant === "IDENTIFIERS")).toMatchObject({
      invariant: "IDENTIFIERS",
      status: "NOT_PRESENT",
      sourceEvidence: [],
      targetEvidence: [],
    });
    expect(projection.providerResultDigest).toMatch(/^ke1-/u);
  });

  it.each([
    ["MRI imaging", "imagerie IRM"],
    ["CT imaging", "imagerie TDM"],
    ["PET imaging", "imagerie TEP"],
    ["QXZ imaging", "imagerie ZXQ"],
  ])("allows translated scientific language without production terminology knowledge: %s → %s", (sourceText, translatedText) => {
    const request = requestFor({ sourceText, sourceLanguage: "en", targetLanguage: "fr" });
    const projection = projectionFor({ request, detectedLanguage: "en", translatedText });
    expect(projection.invariants.find((item) => item.invariant === "IDENTIFIERS")?.status).toBe("NOT_PRESENT");
  });

  it("transmits only protected opaque literals to the provider, not scientific acronyms", () => {
    const request = requestFor({
      sourceText: "Compare MRI with CT in trial NCT01234567.",
      sourceLanguage: "en",
      targetLanguage: "fr",
    });
    const providerText = buildLanguageProjectionProviderPayload(request).contents[0]!.parts[0]!.text;
    const protectedLine = providerText.split("\n").find((line) => line.startsWith("PROTECTED_OPAQUE_LITERALS_JSON="));
    expect(protectedLine).toBe('PROTECTED_OPAQUE_LITERALS_JSON=["NCT01234567"]');
  });

  it("keeps explicitly protected and structurally opaque identifiers rejected with exact diagnostics", () => {
    const request = requestFor({
      sourceText: "Study SITEALPHA and sample ABC-001 are pending.",
      sourceLanguage: "en",
      targetLanguage: "fr",
      protectedOpaqueLiterals: [{ literal: "SITEALPHA", kind: "EXPLICIT_CONTEXT", source: "EXPLICIT_CONTEXT" }],
    });
    try {
      projectionFor({ request, detectedLanguage: "en", translatedText: "L’étude SITEBETA et l’échantillon ABC-002 sont en attente." });
      throw new Error("EXPECTED_LANGUAGE_PROJECTION_REJECTION");
    } catch (error) {
      expect(error).toBeInstanceOf(LanguageProjectionContractError);
      expect((error as LanguageProjectionContractError).diagnostic).toMatchObject({
        subInvariantIds: expect.arrayContaining(["LINGUISTIC_INVARIANT_UNVERIFIED:IDENTIFIERS"]),
        provider: "GOOGLE_GEMINI",
        model,
        providerResultDigest: expect.stringMatching(/^ke1-/u),
      });
    }
  });

  it.each([
    ["Trial NCT01234567 is open.", "L’essai NCT01234568 est ouvert.", "CLINICAL_TRIAL_IDENTIFIER"],
    ["Sample ABC-001 is stored.", "L’échantillon ABC-002 est conservé.", "STRUCTURED_IDENTIFIER"],
    ["Subject 123e4567-e89b-12d3-a456-426614174000 is eligible.", "Le sujet 123e4567-e89b-12d3-a456-426614174001 est éligible.", "UUID"],
    ["Variable project_var_01 is primary.", "La variable project_var_02 est principale.", "VARIABLE_IDENTIFIER"],
  ])("rejects mutation of mechanically classified opaque literals: %s", (sourceText, translatedText, expectedKind) => {
    const protectedLiterals = extractProtectedOpaqueLiterals(sourceText);
    expect(protectedLiterals.map((candidate) => candidate.kind)).toContain(expectedKind);
    const request = requestFor({ sourceText, sourceLanguage: "en", targetLanguage: "fr" });
    try {
      projectionFor({ request, detectedLanguage: "en", translatedText });
      throw new Error("EXPECTED_LANGUAGE_PROJECTION_REJECTION");
    } catch (error) {
      expect(error).toBeInstanceOf(LanguageProjectionContractError);
      expect((error as LanguageProjectionContractError).diagnostic.subInvariantIds).toContain(
        "LINGUISTIC_INVARIANT_UNVERIFIED:IDENTIFIERS",
      );
    }
  });

  it("keeps provenance, provider shape, numbers, units, uncertainty and negation fail-closed", () => {
    const validRequest = requestFor({ sourceText: "Dose 10 mg; MRI may show no lesion.", sourceLanguage: "en", targetLanguage: "fr" });
    expect(parseLanguageProjectionRequest({ ...validRequest, projectionIdentityDigest: "" })).toBeNull();
    expect(parseLanguageProjectionRequest({
      ...validRequest,
      protectedOpaqueLiterals: [{ literal: "ABSENT_ID", kind: "EXPLICIT_CONTEXT", source: "EXPLICIT_CONTEXT" }],
    })).toBeNull();
    expect(parseLanguageProjectionProviderResult({
      detectedLanguage: "en",
      supportStatus: "MALFORMED",
      qualificationStatus: "QUALIFIED",
      translatedText: "Dose 10 mg ; l’IRM pourrait ne montrer aucune lésion.",
      translatedTextLanguage: "fr",
      ambiguityPreserved: true,
      limitations: [],
    })).toBeNull();

    const rejectedSubInvariants = (sourceText: string, translatedText: string) => {
      const request = requestFor({ sourceText, sourceLanguage: "en", targetLanguage: "fr" });
      try {
        projectionFor({ request, detectedLanguage: "en", translatedText });
        throw new Error("EXPECTED_LANGUAGE_PROJECTION_REJECTION");
      } catch (error) {
        expect(error).toBeInstanceOf(LanguageProjectionContractError);
        return (error as LanguageProjectionContractError).diagnostic.subInvariantIds;
      }
    };

    expect(rejectedSubInvariants("Dose 10 mg.", "Dose 5 g.")).toEqual(expect.arrayContaining([
      "LINGUISTIC_INVARIANT_UNVERIFIED:NUMBERS",
      "LINGUISTIC_INVARIANT_UNVERIFIED:UNITS",
    ]));
    expect(rejectedSubInvariants("MRI may show a lesion.", "L’IRM montre une lésion.")).toContain(
      "LINGUISTIC_INVARIANT_UNVERIFIED:UNCERTAINTY",
    );
    expect(rejectedSubInvariants("No MRI lesion.", "Lésion en IRM.")).toContain(
      "LINGUISTIC_INVARIANT_UNVERIFIED:NEGATION",
    );
  });

  it("accepts same-call uncertainty evidence without requiring a local target synonym", () => {
    const sourceText = "Imaging may contribute to the principal evaluation.";
    const translatedText = "Une contribution de l’imagerie à l’évaluation principale demeure envisageable.";
    const request = requestFor({ sourceText, sourceLanguage: "en", targetLanguage: "fr" });
    const projection = projectionFor({
      request,
      detectedLanguage: "en",
      translatedText,
      translatedTextLanguage: "fr",
      semanticInvariants: semanticInvariantsFor(sourceText, translatedText, [{
        invariantId: "UNCERTAINTY",
        sourcePresent: true,
        preserved: true,
        sourceEvidence: ["may"],
        targetEvidence: ["demeure envisageable"],
      }]),
    });
    expect(projection.invariants.find((item) => item.invariant === "UNCERTAINTY")).toMatchObject({
      status: "PRESERVED",
      evidenceClass: "LLM_ATTESTED",
      sourceEvidence: ["may"],
      targetEvidence: ["demeure envisageable"],
    });
  });

  it("treats an absent semantic invariant as non-applicable without fabricating preservation", () => {
    const sourceText = "Imaging is available for review.";
    const translatedText = "L’imagerie est disponible pour la revue.";
    const request = requestFor({ sourceText, sourceLanguage: "en", targetLanguage: "fr" });
    const projection = projectionFor({ request, detectedLanguage: "en", translatedText });
    expect(projection.invariants.find((item) => item.invariant === "NEGATION")).toMatchObject({
      status: "NOT_PRESENT",
      sourceEvidence: [],
      targetEvidence: [],
    });
    expect(() => projectionFor({
      request,
      detectedLanguage: "en",
      translatedText,
      semanticInvariants: semanticInvariantsFor(sourceText, translatedText, [{
        invariantId: "NEGATION",
        sourcePresent: false,
        preserved: false,
        sourceEvidence: ["Imaging"],
        targetEvidence: [],
      }]),
    })).toThrow(/SEMANTIC_INVARIANT_NOT_PRESENT_WITH_EVIDENCE:NEGATION/u);
  });

  it.each([
    ["NEGATION", "No lesion is visible.", "Aucune lésion n’est visible.", "No", "Aucune"],
    ["UNCERTAINTY", "Imaging may be useful.", "L’utilité de l’imagerie reste envisageable.", "may", "reste envisageable"],
    ["CONDITIONALITY", "If imaging is available, proceed.", "Si l’imagerie est disponible, poursuivre.", "If", "Si"],
    ["COMPARISON", "Compare method A with method B.", "Mettre la méthode A en regard de la méthode B.", "Compare", "en regard"],
    ["TEMPORAL_RELATION", "Imaging occurs after surgery.", "L’imagerie est réalisée à la suite de l’intervention.", "after", "à la suite de"],
  ] as const)("accepts bounded same-call evidence for %s", (invariantId, sourceText, translatedText, sourceEvidence, targetEvidence) => {
    const request = requestFor({ sourceText, sourceLanguage: "en", targetLanguage: "fr" });
    const projection = projectionFor({
      request,
      detectedLanguage: "en",
      translatedText,
      semanticInvariants: semanticInvariantsFor(sourceText, translatedText, [{
        invariantId,
        sourcePresent: true,
        preserved: true,
        sourceEvidence: [sourceEvidence],
        targetEvidence: [targetEvidence],
      }]),
    });
    expect(projection.invariants.find((item) => item.invariant === invariantId)).toMatchObject({
      status: "PRESERVED",
      sourceEvidence: [sourceEvidence],
      targetEvidence: [targetEvidence],
    });
  });

  it.each([
    ["NEGATION", "No lesion is visible.", "Une lésion est visible.", "No"],
    ["COMPARISON", "Compare method A with method B.", "La méthode A est décrite.", "Compare"],
  ] as const)("rejects a declared %s loss", (invariantId, sourceText, translatedText, sourceEvidence) => {
    const request = requestFor({ sourceText, sourceLanguage: "en", targetLanguage: "fr" });
    expect(() => projectionFor({
      request,
      detectedLanguage: "en",
      translatedText,
      semanticInvariants: semanticInvariantsFor(sourceText, translatedText, [{
        invariantId,
        sourcePresent: true,
        preserved: false,
        sourceEvidence: [sourceEvidence],
        targetEvidence: [],
      }]),
    })).toThrow(new RegExp(`SEMANTIC_INVARIANT_DECLARED_LOST:${invariantId}`, "u"));
  });

  it("keeps source and target evidence provenance verbatim and rejects duplicate attestations", () => {
    const sourceText = "Compare MRI with CT.";
    const translatedText = "Comparer l’IRM au scanner.";
    const request = requestFor({ sourceText, sourceLanguage: "en", targetLanguage: "fr" });
    for (const evidence of [
      { sourceEvidence: ["comparison"], targetEvidence: ["Comparer"] },
      { sourceEvidence: ["Compare"], targetEvidence: ["comparaison"] },
    ]) {
      expect(() => projectionFor({
        request,
        detectedLanguage: "en",
        translatedText,
        semanticInvariants: semanticInvariantsFor(sourceText, translatedText, [{
          invariantId: "COMPARISON",
          sourcePresent: true,
          preserved: true,
          ...evidence,
        }]),
      })).toThrow(/SEMANTIC_INVARIANT_EVIDENCE_NOT_VERBATIM:COMPARISON/u);
    }
    const duplicated = [...semanticInvariantsFor(sourceText, translatedText)];
    duplicated[4] = duplicated[3]!;
    expect(() => projectionFor({ request, detectedLanguage: "en", translatedText, semanticInvariants: duplicated }))
      .toThrow(/SEMANTIC_INVARIANT_EVIDENCE_DUPLICATE:COMPARISON/u);
  });

  it("requires the produced-text language contract before localization can report success", () => {
    const canonicalFrenchResponse = "La structure proposée reste à confirmer.";
    const request = requestFor({
      projectionKind: "OUTPUT_FROM_FRENCH",
      sourceText: canonicalFrenchResponse,
      sourceLanguage: "fr",
      targetLanguage: "en",
    });
    const valid = projectionFor({
      request,
      detectedLanguage: "fr",
      translatedText: "The proposed structure remains to be confirmed.",
      translatedTextLanguage: "en",
    });
    expect(buildLocalizedConversationResponse({
      responseId: "response:target-language",
      sourceTurnRef: "turn:target-language",
      canonicalFrenchResponse,
      targetLanguage: "en",
      projection: valid,
    })).toMatchObject({
      internalFrenchResponse: canonicalFrenchResponse,
      localizedResponse: "The proposed structure remains to be confirmed.",
      translationStatus: "SUCCEEDED",
    });
    expect(() => projectionFor({
      request,
      detectedLanguage: "fr",
      translatedText: canonicalFrenchResponse,
      translatedTextLanguage: "fr",
    })).toThrow(/TRANSLATED_TEXT_LANGUAGE_TARGET_MISMATCH/u);
    expect(() => projectionFor({
      request,
      detectedLanguage: "fr",
      translatedText: canonicalFrenchResponse,
      translatedTextLanguage: "en",
    })).toThrow(/TRANSLATED_TEXT_IDENTICAL_TO_SOURCE_WITH_DIFFERENT_TARGET/u);
    expect(() => buildLocalizedConversationResponse({
      responseId: "response:forged-language",
      sourceTurnRef: "turn:forged-language",
      canonicalFrenchResponse,
      targetLanguage: "en",
      projection: { ...valid, translatedTextLanguage: "fr" },
    })).toThrow(/OUTPUT_LANGUAGE_PROJECTION_TARGET_MISMATCH/u);
  });

  it("requires complete semantic attestations and rejects an attested uncertainty loss", () => {
    const sourceText = "Imaging may contribute to the evaluation.";
    const translatedText = "L’imagerie contribue à l’évaluation.";
    expect(parseLanguageProjectionProviderResult({
      detectedLanguage: "en",
      supportStatus: "SUPPORTED",
      qualificationStatus: "QUALIFIED",
      translatedText,
      translatedTextLanguage: "fr",
      ambiguityPreserved: true,
      limitations: [],
    })).toBeNull();
    const request = requestFor({ sourceText, sourceLanguage: "en", targetLanguage: "fr" });
    expect(parseLanguageProjectionProviderResult({
      detectedLanguage: "en",
      supportStatus: "SUPPORTED",
      qualificationStatus: "QUALIFIED",
      translatedText,
      ambiguityPreserved: true,
      semanticInvariants: semanticInvariantsFor(sourceText, translatedText).slice(0, 4),
      limitations: [],
    })).toBeNull();
    expect(() => projectionFor({
      request,
      detectedLanguage: "en",
      translatedText,
      semanticInvariants: semanticInvariantsFor(sourceText, translatedText, [{
        invariantId: "UNCERTAINTY",
        sourcePresent: true,
        preserved: false,
        sourceEvidence: ["may"],
        targetEvidence: [],
      }]),
    })).toThrow(LanguageProjectionContractError);
  });

  it("binds unit evidence to measured quantities rather than isolated prose letters", () => {
    expect(evaluateLinguisticInvariants("Le plan d’étude et la stratégie d’analyse restent ouverts.", "The study plan and analysis strategy remain open.")
      .find((item) => item.invariant === "UNITS")).toMatchObject({ status: "NOT_PRESENT", evidenceClass: "DETERMINISTICALLY_PROVABLE" });
    expect(evaluateLinguisticInvariants("IRM à 1,5 T, délai 40 ms, dose 5 mg et volume 10 mL.", "MRI at 1.5 T, delay 40 ms, dose 5 mg and volume 10 mL.")
      .filter((item) => item.status === "UNKNOWN")).toEqual([]);
    expect(evaluateLinguisticInvariants("IRM à 3 T.", "MRI at 1.5 T.")
      .find((item) => item.invariant === "NUMBERS")?.status).toBe("UNKNOWN");
    expect(evaluateLinguisticInvariants("Délai 40 ms.", "Delay 40 s.")
      .find((item) => item.invariant === "UNITS")?.status).toBe("UNKNOWN");
    expect(evaluateLinguisticInvariants("Dose 5 mg.", "Dose 5 g.")
      .find((item) => item.invariant === "UNITS")?.status).toBe("UNKNOWN");
    for (const [sourceText, translatedText] of [
      ["MRI at 3 T.", "IRM à 1,5 T."],
      ["Delay 40 ms.", "Délai 40 s."],
      ["Dose 5 mg.", "Dose 5 g."],
    ] as const) {
      const request = requestFor({ sourceText, sourceLanguage: "en", targetLanguage: "fr" });
      expect(() => projectionFor({ request, detectedLanguage: "en", translatedText }))
        .toThrow(LanguageProjectionContractError);
    }
  });

  it("preserves Japanese numbers, MRI units, uncertainty, conditionality and UNKNOWN status", () => {
    const source = "もし 1.5 T と 3 T の MRI を比較する場合、結果は異なるかもしれません。主要な判断は UNKNOWN です。";
    const target = "Si l’on compare l’IRM à 1,5 T et 3 T, les résultats pourraient être différents. La décision principale reste UNKNOWN.";
    const request = requestFor({ sourceText: source, sourceLanguage: "ja", targetLanguage: "fr" });
    const projection = projectionFor({ request, detectedLanguage: "ja", translatedText: target });
    expect(detectConversationLanguage(source)).toMatchObject({ detectedLanguage: "ja", confidence: "HIGH" });
    expect(projection.invariants.filter((item) => item.status === "PRESERVED").map((item) => item.invariant)).toEqual(expect.arrayContaining([
      "NUMBERS", "UNITS", "UNCERTAINTY", "CONDITIONALITY", "COMPARISON", "DECISION_STATUS",
    ]));
    expect(projection.invariants.find((item) => item.invariant === "IDENTIFIERS")?.status).toBe("NOT_PRESENT");
  });

  it("preserves Chinese comparison, negation, uncertainty and technical acronyms", () => {
    const source = "比较 MRI 与 CT；我们没有决定主要终点，MRI 可能更敏感。";
    const target = "Comparer MRI et CT ; nous n’avons pas décidé le critère principal et la MRI pourrait être plus sensible.";
    const request = requestFor({ sourceText: source, sourceLanguage: "zh", targetLanguage: "fr" });
    const projection = projectionFor({ request, detectedLanguage: "zh", translatedText: target });
    expect(detectConversationLanguage(source)).toMatchObject({ detectedLanguage: "zh", confidence: "HIGH" });
    expect(projection.invariants.filter((item) => item.status === "PRESERVED").map((item) => item.invariant)).toEqual(expect.arrayContaining([
      "NEGATION", "UNCERTAINTY", "COMPARISON",
    ]));
    expect(projection.invariants.find((item) => item.invariant === "IDENTIFIERS")?.status).toBe("NOT_PRESENT");
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
        translatedTextLanguage: "fr",
        ambiguityPreserved: false,
        semanticInvariants: semanticInvariantsFor(request.sourceText, target),
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
        translatedTextLanguage: "fr",
        ambiguityPreserved: true,
        semanticInvariants: semanticInvariantsFor(request.sourceText, "IRM."),
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
        translatedTextLanguage: "fr",
        ambiguityPreserved: true,
        semanticInvariants: semanticInvariantsFor(request.sourceText, "Pas de MRI à 3 T ; statut UNKNOWN."),
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
        translatedTextLanguage: "fr",
        ambiguityPreserved: true,
        semanticInvariants: semanticInvariantsFor(request.sourceText, "Nous voulons une étude MRI prospective."),
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

  it("returns the rejected sub-invariant and provider-result digest without returning provider text", async () => {
    const request = requestFor({
      sourceText: "Study SITEALPHA is pending.",
      sourceLanguage: "en",
      targetLanguage: "fr",
      protectedOpaqueLiterals: [{ literal: "SITEALPHA", kind: "EXPLICIT_CONTEXT", source: "EXPLICIT_CONTEXT" }],
    });
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      responseId: "gemini-language:contract-rejection",
      candidates: [{ content: { parts: [{ functionCall: { name: "return_language_projection", args: {
        detectedLanguage: "en",
        supportStatus: "SUPPORTED",
        qualificationStatus: "QUALIFIED",
        translatedText: "L’étude SITEBETA est en attente.",
        translatedTextLanguage: "fr",
        ambiguityPreserved: true,
        semanticInvariants: semanticInvariantsFor(request.sourceText, "L’étude SITEBETA est en attente."),
        limitations: [],
      } } }] } }],
    }), { status: 200, headers: { "content-type": "application/json" } })) as unknown as typeof fetch;
    const result = await executeProtocolDesignerBridge({ body: request, apiKey: "test-key", fetchImpl, now: () => Date.parse(createdAt) });
    expect(result.status).toBe(422);
    expect(result.body).toMatchObject({
      error: {
        code: "LANGUAGE_PROJECTION_CONTRACT_FAILED:LINGUISTIC_INVARIANT_UNVERIFIED:IDENTIFIERS",
        diagnostic: {
          subInvariantIds: ["LINGUISTIC_INVARIANT_UNVERIFIED:IDENTIFIERS"],
          provider: "GOOGLE_GEMINI",
          model,
          providerResponseId: "gemini-language:contract-rejection",
          providerResultDigest: expect.stringMatching(/^ke1-/u),
        },
      },
    });
    expect(JSON.stringify(result.body)).not.toContain("SITEBETA");
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

  it("records the complete successful and rejected language materialization boundaries at LEVEL_2", () => {
    const sessionId = "session:language-level-2";
    const conversationId = "conversation:language-level-2";
    const configuration = createScientificTraceCaptureConfiguration({
      captureLevel: "LEVEL_2_DIAGNOSTIC",
      captureReason: "MANUAL_DIAGNOSTIC",
    });
    const source = "We want a prospective cardiac MRI study after infarction.";
    const request = requestFor({ sourceText: source, sourceLanguage: "en", targetLanguage: "fr" });
    const projection = projectionFor({
      request,
      detectedLanguage: "en",
      translatedText: "Nous voulons une étude prospective d’IRM cardiaque après un infarctus.",
    });
    const turn = buildMultilingualUserTurn({
      turnId: "turn:language-level-2-success",
      originalText: source,
      detection: detectConversationLanguage(source),
      currentConversationLanguage: null,
      projection,
    });
    const successRunId = createProductTraceRunId(sessionId, turn.turnId);
    const success = recordConversationLanguageGatewayTrace({
      ledger: createScientificExecutionTraceLedger(sessionId),
      traceRunId: successRunId,
      conversationId,
      turn,
      observedAt: createdAt,
      captureConfiguration: configuration,
    });
    const successfulEvents = listEndToEndTraceEvents({ ledger: success, traceRunId: successRunId });
    expect(successfulEvents.map((event) => event.stage)).toEqual([
      "USER_TURN_RECEIVED",
      "LANGUAGE_DETECTED",
      "LANGUAGE_PROVIDER_RESULT_RECEIVED",
      "LANGUAGE_PROJECTION_MATERIALIZATION_STARTED",
      "LANGUAGE_PROJECTION_MATERIALIZED",
    ]);
    expect(successfulEvents.every((event) => event.captureLevel === "LEVEL_2_DIAGNOSTIC")).toBe(true);
    expect(successfulEvents.find((event) => event.stage === "LANGUAGE_PROVIDER_RESULT_RECEIVED")).toMatchObject({
      provider: "GOOGLE_GEMINI",
      component: expect.objectContaining({ componentVersion: model }),
      output: [expect.objectContaining({ digest: projection.providerResultDigest })],
    });

    const failedTurnId = "turn:language-level-2-rejected";
    const failedRunId = createProductTraceRunId(sessionId, failedTurnId);
    const diagnostic = {
      contract: "LANGUAGE_PROJECTION_CONTRACT_FAILURE_DIAGNOSTIC" as const,
      contractVersion: "1.0.0" as const,
      subInvariantIds: ["LINGUISTIC_INVARIANT_UNVERIFIED:IDENTIFIERS"],
      provider: "GOOGLE_GEMINI" as const,
      model,
      providerResponseId: "gemini-language:rejected",
      providerResultDigest: "digest:provider-result",
    };
    const failed = recordConversationLanguageGatewayFailureTrace({
      ledger: success,
      traceRunId: failedRunId,
      conversationId,
      turnId: failedTurnId,
      originalTextDigest: "digest:source",
      projectionSourceTextDigest: "digest:source",
      detection: { status: "DETECTED", detectedLanguage: "en", confidence: "HIGH", reasonCode: "ENGLISH_LEXICAL_EVIDENCE" },
      projectionKind: "INPUT_TO_FRENCH",
      targetLanguage: "fr",
      failureCode: "LANGUAGE_PROJECTION_CONTRACT_FAILED:LINGUISTIC_INVARIANT_UNVERIFIED:IDENTIFIERS",
      conformanceDiagnostic: diagnostic,
      observedAt: createdAt,
      captureConfiguration: configuration,
    });
    const failedEvents = listEndToEndTraceEvents({ ledger: failed, traceRunId: failedRunId });
    expect(failedEvents.map((event) => event.stage)).toEqual([
      "USER_TURN_RECEIVED",
      "LANGUAGE_DETECTED",
      "LANGUAGE_PROVIDER_RESULT_RECEIVED",
      "LANGUAGE_PROJECTION_MATERIALIZATION_STARTED",
      "LANGUAGE_PROJECTION_CONTRACT_REJECTED",
    ]);
    expect(failedEvents.at(-1)).toMatchObject({
      reasonCode: "LINGUISTIC_INVARIANT_UNVERIFIED:IDENTIFIERS",
      provider: "GOOGLE_GEMINI",
      realizationOutcome: {
        providerResponseReceived: true,
        providerResponseAccepted: false,
        providerRejectionReason: "LINGUISTIC_INVARIANT_UNVERIFIED:IDENTIFIERS",
      },
    });
    expect(JSON.stringify(failedEvents)).not.toContain("Study ABC");
  });
});
