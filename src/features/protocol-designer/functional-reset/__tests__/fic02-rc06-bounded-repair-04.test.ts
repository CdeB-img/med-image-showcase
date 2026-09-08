import { describe, expect, it, vi } from "vitest";
import { executeProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import {
  LANGUAGE_PROJECTION_CONTRACT_VERSION,
  LANGUAGE_PROJECTION_SCHEMA_VERSION,
  LANGUAGE_PROJECTION_SYSTEM_INSTRUCTION,
  LanguageProjectionContractError,
  buildLanguageProjectionProviderPayload,
  languageProjectionIdentityDigest,
  materializeLanguageProjectionArtifact,
  type LanguageProjectionContractFailureDiagnostic,
  type LanguageProjectionProviderResult,
  type LanguageProjectionRequest,
  type ProviderSemanticInvariantEvidence,
  type SemanticLanguageProjectionInvariant,
} from "@/features/protocol-designer/conversation-language-gateway";
import {
  createProductTraceRunId,
  createScientificExecutionTraceLedger,
  createScientificTraceCaptureConfiguration,
  listEndToEndTraceEvents,
  recordConversationLanguageGatewayFailureTrace,
} from "@/features/protocol-designer/scientific-execution-trace";
import { buildTraceInspectorRunProjection } from "@/features/validation-architecture/trace-structural-validation";

const model = "gemini-3.5-flash-lite";
const createdAt = "2026-09-07T10:00:00.000Z";
const semanticInvariantIds = [
  "NEGATION",
  "UNCERTAINTY",
  "CONDITIONALITY",
  "COMPARISON",
  "TEMPORAL_RELATION",
] as const satisfies readonly SemanticLanguageProjectionInvariant[];

const requestFor = (sourceText: string): LanguageProjectionRequest => ({
  apiVersion: "1.0.0",
  operation: "LANGUAGE_PROJECTION",
  projectionKind: "INPUT_TO_FRENCH",
  sourceText,
  sourceLanguageHint: "en",
  targetLanguage: "fr",
  translationContractVersion: LANGUAGE_PROJECTION_CONTRACT_VERSION,
  projectionIdentityDigest: languageProjectionIdentityDigest({
    projectionKind: "INPUT_TO_FRENCH",
    sourceText,
    sourceLanguage: "en",
    targetLanguage: "fr",
    provider: "GOOGLE_GEMINI",
    model,
    protectedOpaqueLiterals: [],
  }),
  protectedOpaqueLiterals: [],
});

const absentClaim = (invariantId: SemanticLanguageProjectionInvariant): ProviderSemanticInvariantEvidence => ({
  invariantId,
  attestationStatus: "ATTESTED",
  sourcePresent: false,
  preserved: false,
  sourceEvidence: [],
  targetEvidence: [],
});

const directClaims = (
  overrides: readonly ProviderSemanticInvariantEvidence[] = [],
): readonly ProviderSemanticInvariantEvidence[] => semanticInvariantIds.map((invariantId) =>
  overrides.find((candidate) => candidate.invariantId === invariantId) ?? absentClaim(invariantId));

const providerResult = (input: {
  translatedText: string;
  claims?: readonly ProviderSemanticInvariantEvidence[];
  supportStatus?: LanguageProjectionProviderResult["supportStatus"];
}): LanguageProjectionProviderResult => ({
  detectedLanguage: "en",
  supportStatus: input.supportStatus ?? "SUPPORTED",
  qualificationStatus: "QUALIFIED",
  translatedText: input.translatedText,
  translatedTextLanguage: "fr",
  ambiguityPreserved: true,
  semanticInvariants: input.claims ?? directClaims(),
  limitations: [],
});

const materialize = (sourceText: string, result: LanguageProjectionProviderResult) => materializeLanguageProjectionArtifact({
  request: requestFor(sourceText),
  result,
  model,
  providerResponseId: "gemini-language:rc06",
  createdAt,
});

const rejectedDiagnostic = (
  sourceText: string,
  result: LanguageProjectionProviderResult,
): LanguageProjectionContractFailureDiagnostic => {
  try {
    materialize(sourceText, result);
    throw new Error("EXPECTED_LANGUAGE_PROJECTION_REJECTION");
  } catch (error) {
    expect(error).toBeInstanceOf(LanguageProjectionContractError);
    return (error as LanguageProjectionContractError).diagnostic;
  }
};

describe("FIC02-RC06-BOUNDED-REPAIR-04 — semantic evidence claim contract", () => {
  it("A accepts an explicitly attested and preserved negation", () => {
    const source = "The myocardial lesion is not visible.";
    const target = "La lésion myocardique demeure non visible.";
    const projection = materialize(source, providerResult({
      translatedText: target,
      claims: directClaims([{
        invariantId: "NEGATION",
        attestationStatus: "ATTESTED",
        sourcePresent: true,
        preserved: true,
        sourceEvidence: ["The myocardial lesion is not visible"],
        targetEvidence: ["La lésion myocardique demeure non visible"],
      }]),
    }));
    expect(projection.invariants.find((invariant) => invariant.invariant === "NEGATION")?.status).toBe("PRESERVED");
  });

  it("B rejects a provider-declared negation loss", () => {
    const diagnostic = rejectedDiagnostic("The lesion is not visible.", providerResult({
      translatedText: "La lésion est visible.",
      claims: directClaims([{
        invariantId: "NEGATION",
        attestationStatus: "ATTESTED",
        sourcePresent: true,
        preserved: false,
        sourceEvidence: ["The lesion is not visible"],
        targetEvidence: [],
      }]),
    }));
    expect(diagnostic.subInvariantIds).toContain("SEMANTIC_INVARIANT_DECLARED_LOST:NEGATION");
    expect(diagnostic.contractVersion === "1.1.0" && diagnostic.evidenceWitnesses[0]?.providerPreservationClaim).toBe("LOST");
  });

  it("C accepts overlapping NEGATION and UNCERTAINTY categories", () => {
    const source = "The design is not yet decided and may change.";
    const target = "Le plan n’est pas encore arrêté et pourrait évoluer.";
    const projection = materialize(source, providerResult({
      translatedText: target,
      claims: directClaims([
        {
          invariantId: "NEGATION",
          attestationStatus: "ATTESTED",
          sourcePresent: true,
          preserved: true,
          sourceEvidence: ["The design is not yet decided"],
          targetEvidence: ["Le plan n’est pas encore arrêté"],
        },
        {
          invariantId: "UNCERTAINTY",
          attestationStatus: "ATTESTED",
          sourcePresent: true,
          preserved: true,
          sourceEvidence: ["may change"],
          targetEvidence: ["pourrait évoluer"],
        },
        {
          invariantId: "TEMPORAL_RELATION",
          attestationStatus: "ATTESTED",
          sourcePresent: true,
          preserved: true,
          sourceEvidence: ["not yet decided"],
          targetEvidence: ["pas encore arrêté"],
        },
      ]),
    }));
    expect(projection.invariants.filter((invariant) => invariant.status === "PRESERVED").map((invariant) => invariant.invariant))
      .toEqual(expect.arrayContaining(["NEGATION", "UNCERTAINTY"]));
  });

  it("D accepts an attested absent invariant when no surface marker is observed", () => {
    const projection = materialize("Imaging is available.", providerResult({ translatedText: "L’imagerie est disponible." }));
    expect(projection.invariants.find((invariant) => invariant.invariant === "NEGATION")?.status).toBe("NOT_PRESENT");
  });

  it("E requalifies provider-claim versus surface-marker disagreement and remains fail-closed", () => {
    const diagnostic = rejectedDiagnostic("The lesion is not visible.", providerResult({
      translatedText: "La lésion n’est pas visible.",
    }));
    expect(diagnostic.subInvariantIds).toContain("SOURCE_CLAIM_SURFACE_OBSERVATION_CONFLICT:NEGATION");
    expect(diagnostic.subInvariantIds).not.toContain("SEMANTIC_INVARIANT_DECLARED_LOST:NEGATION");
    expect(diagnostic.subInvariantIds.every((block) => !block.includes("TRANSLATION_SEMANTIC_LOSS"))).toBe(true);
    if (diagnostic.contractVersion !== "1.1.0") throw new Error("EXPECTED_CURRENT_DIAGNOSTIC");
    expect(diagnostic.evidenceWitnesses.find((witness) => witness.invariantId === "NEGATION")).toMatchObject({
      sourceInvariantClaim: "ABSENT",
      sourceMarkerObservations: ["not"],
      providerPreservationClaim: "NOT_APPLICABLE",
      deterministicContractVerdict: "REJECTED",
    });
  });

  it("F keeps inability to attest distinct from absence and loss while failing closed", () => {
    const diagnostic = rejectedDiagnostic("Imaging may contribute.", providerResult({
      translatedText: "L’imagerie pourrait contribuer.",
      claims: directClaims([{
        invariantId: "UNCERTAINTY",
        attestationStatus: "UNKNOWN",
        sourcePresent: false,
        preserved: false,
        sourceEvidence: [],
        targetEvidence: [],
      }]),
    }));
    expect(diagnostic.subInvariantIds).toContain("SEMANTIC_INVARIANT_ATTESTATION_UNKNOWN:UNCERTAINTY");
    expect(diagnostic.subInvariantIds).not.toContain("SEMANTIC_INVARIANT_DECLARED_LOST:UNCERTAINTY");
    if (diagnostic.contractVersion !== "1.1.0") throw new Error("EXPECTED_CURRENT_DIAGNOSTIC");
    expect(diagnostic.evidenceWitnesses.find((witness) => witness.invariantId === "UNCERTAINTY")).toMatchObject({
      sourceInvariantClaim: "UNKNOWN",
      providerPreservationClaim: "UNKNOWN",
    });
  });

  it.each([
    ["G", ["a source phrase not present"], ["La lésion n’est pas visible"], "SEMANTIC_INVARIANT_EVIDENCE_NOT_VERBATIM:NEGATION"],
    ["H", ["The lesion is not visible"], ["une cible absente"], "SEMANTIC_INVARIANT_EVIDENCE_NOT_VERBATIM:NEGATION"],
  ] as const)("%s rejects non-verbatim bounded evidence", (_caseId, sourceEvidence, targetEvidence, expected) => {
    const diagnostic = rejectedDiagnostic("The lesion is not visible.", providerResult({
      translatedText: "La lésion n’est pas visible.",
      claims: directClaims([{
        invariantId: "NEGATION",
        attestationStatus: "ATTESTED",
        sourcePresent: true,
        preserved: true,
        sourceEvidence,
        targetEvidence,
      }]),
    }));
    expect(diagnostic.subInvariantIds).toContain(expected);
  });

  it("I requires contextualized segments in the provider contract without pretending to infer semantic sufficiency deterministically", () => {
    const payload = buildLanguageProjectionProviderPayload(requestFor("The lesion is not visible."));
    const schema = payload.tools[0]!.functionDeclarations[0]!.parametersJsonSchema;
    expect(LANGUAGE_PROJECTION_SYSTEM_INSTRUCTION).toContain("segment source suffisamment contextualisé");
    expect(LANGUAGE_PROJECTION_SYSTEM_INSTRUCTION).toContain("l'opérateur, la proposition et sa portée locale");
    expect(schema.properties.semanticInvariants.items.properties.sourceEvidence.description).toContain("sufficiently contextualized");
    expect(LANGUAGE_PROJECTION_SCHEMA_VERSION).toBe("1.4.0");
  });

  it("J rejects a duplicated invariant and K rejects a missing invariant", () => {
    const complete = [...directClaims()];
    const duplicate = [...complete.slice(0, 4), complete[0]!];
    expect(rejectedDiagnostic("Imaging is available.", providerResult({ translatedText: "L’imagerie est disponible.", claims: duplicate })).subInvariantIds)
      .toContain("SEMANTIC_INVARIANT_EVIDENCE_DUPLICATE:NEGATION");
    expect(rejectedDiagnostic("Imaging is available.", providerResult({ translatedText: "L’imagerie est disponible.", claims: complete.slice(0, 4) })).subInvariantIds)
      .toEqual(expect.arrayContaining(["SEMANTIC_INVARIANT_EVIDENCE_MISSING:TEMPORAL_RELATION", "SEMANTIC_INVARIANT_EVIDENCE_CARDINALITY"]));
  });

  it("L rejects evidence fabricated for an attested absent source invariant", () => {
    const diagnostic = rejectedDiagnostic("Imaging is available.", providerResult({
      translatedText: "L’imagerie est disponible.",
      claims: directClaims([{
        ...absentClaim("NEGATION"),
        sourceEvidence: ["Imaging is available"],
      }]),
    }));
    expect(diagnostic.subInvariantIds).toContain("SEMANTIC_INVARIANT_NOT_PRESENT_WITH_EVIDENCE:NEGATION");
  });

  it.each([
    ["M", "COMPARISON", "The study compares cohort A with cohort B.", "L’étude compare la cohorte A à la cohorte B.", "compares cohort A with cohort B", "compare la cohorte A à la cohorte B"],
    ["N", "CONDITIONALITY", "If imaging is available, include it.", "Si l’imagerie est disponible, l’inclure.", "If imaging is available", "Si l’imagerie est disponible"],
    ["O", "TEMPORAL_RELATION", "Imaging occurs after surgery.", "L’imagerie est réalisée après la chirurgie.", "after surgery", "après la chirurgie"],
    ["P", "UNCERTAINTY", "Imaging may contribute.", "L’imagerie pourrait contribuer.", "may contribute", "pourrait contribuer"],
  ] as const)("%s accepts an attested preserved %s", (_caseId, invariantId, source, target, sourceEvidence, targetEvidence) => {
    const projection = materialize(source, providerResult({
      translatedText: target,
      claims: directClaims([{
        invariantId,
        attestationStatus: "ATTESTED",
        sourcePresent: true,
        preserved: true,
        sourceEvidence: [sourceEvidence],
        targetEvidence: [targetEvidence],
      }]),
    }));
    expect(projection.invariants.find((invariant) => invariant.invariant === invariantId)?.status).toBe("PRESERVED");
  });

  it.each([
    ["MRI at 3 T.", "IRM à 1,5 T."],
    ["Delay 40 ms.", "Délai 40 s."],
    ["Dose 5 mg.", "Dose 5 g."],
  ])("Q retains deterministic protection of structured quantities: %s", (source, target) => {
    expect(rejectedDiagnostic(source, providerResult({ translatedText: target })).subInvariantIds)
      .toEqual(expect.arrayContaining([expect.stringMatching(/^LINGUISTIC_INVARIANT_UNVERIFIED:(?:NUMBERS|UNITS)$/u)]));
  });

  it("transports bounded rejected witnesses through the bridge and stores them at TRACE diagnostic level", async () => {
    const source = "The lesion is not visible.";
    const target = "La lésion n’est pas visible.";
    const request = requestFor(source);
    const result = providerResult({ translatedText: target });
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      id: "resp_language_rc06_bridge",
      model: "gpt-5.6-luna",
      status: "completed",
      output_text: JSON.stringify(result),
    }), { status: 200, headers: { "content-type": "application/json" } })) as unknown as typeof fetch;
    const bridge = await executeProtocolDesignerBridge({ body: request, apiKey: null, openAiApiKey: "test-openai-key", fetchImpl, now: () => Date.parse(createdAt) });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(bridge.status).toBe(422);
    const diagnostic = (bridge.body as { error: { diagnostic: LanguageProjectionContractFailureDiagnostic } }).error.diagnostic;
    expect(diagnostic.contractVersion).toBe("1.1.0");
    if (diagnostic.contractVersion !== "1.1.0") throw new Error("EXPECTED_CURRENT_DIAGNOSTIC");
    expect(diagnostic.evidenceWitnesses).toHaveLength(5);
    expect(diagnostic.evidenceWitnesses.find((witness) => witness.invariantId === "NEGATION")).toMatchObject({
      sourceTextDigest: expect.stringMatching(/^ke1-/u),
      sourceInvariantClaim: "ABSENT",
      sourceEvidence: [],
      sourceMarkerObservations: ["not"],
      translatedTextDigest: expect.stringMatching(/^ke1-/u),
      targetEvidence: [],
      providerPreservationClaim: "NOT_APPLICABLE",
      providerSupportStatus: "SUPPORTED",
      deterministicContractVerdict: "REJECTED",
      validatorVersion: "1.4.0",
      promptVersion: "1.4.0",
      schemaVersion: "1.4.0",
      provider: "OPENAI",
      model: "gpt-5.6-luna",
      providerResponseId: "resp_language_rc06_bridge",
    });
    expect(JSON.stringify(diagnostic)).not.toContain(target);

    const sessionId = "session:rc06";
    const turnId = "turn:rc06";
    const traceRunId = createProductTraceRunId(sessionId, turnId);
    const coreLedger = recordConversationLanguageGatewayFailureTrace({
      ledger: createScientificExecutionTraceLedger(`${sessionId}:core`),
      traceRunId: createProductTraceRunId(`${sessionId}:core`, `${turnId}:core`),
      conversationId: "conversation:rc06-core",
      turnId: `${turnId}:core`,
      originalTextDigest: request.projectionIdentityDigest,
      projectionSourceTextDigest: request.projectionIdentityDigest,
      detection: { status: "DETECTED", detectedLanguage: "en", confidence: "HIGH", reasonCode: "ENGLISH_LEXICAL_EVIDENCE" },
      projectionKind: "INPUT_TO_FRENCH",
      targetLanguage: "fr",
      failureCode: "LANGUAGE_PROJECTION_CONTRACT_FAILED:SOURCE_CLAIM_SURFACE_OBSERVATION_CONFLICT:NEGATION",
      conformanceDiagnostic: diagnostic,
      observedAt: createdAt,
    });
    expect(coreLedger.events.every((event) => event.common?.languageProjectionEvidenceWitnesses === undefined)).toBe(true);

    const ledger = recordConversationLanguageGatewayFailureTrace({
      ledger: createScientificExecutionTraceLedger(sessionId),
      traceRunId,
      conversationId: "conversation:rc06",
      turnId,
      originalTextDigest: request.projectionIdentityDigest,
      projectionSourceTextDigest: request.projectionIdentityDigest,
      detection: { status: "DETECTED", detectedLanguage: "en", confidence: "HIGH", reasonCode: "ENGLISH_LEXICAL_EVIDENCE" },
      projectionKind: "INPUT_TO_FRENCH",
      targetLanguage: "fr",
      failureCode: "LANGUAGE_PROJECTION_CONTRACT_FAILED:SOURCE_CLAIM_SURFACE_OBSERVATION_CONFLICT:NEGATION",
      conformanceDiagnostic: diagnostic,
      observedAt: createdAt,
      captureConfiguration: createScientificTraceCaptureConfiguration({
        captureLevel: "LEVEL_2_DIAGNOSTIC",
        captureReason: "MANUAL_DIAGNOSTIC",
      }),
    });
    const rejected = listEndToEndTraceEvents({ ledger, traceRunId })
      .find((event) => event.stage === "LANGUAGE_PROJECTION_CONTRACT_REJECTED");
    expect(rejected?.languageProjectionEvidenceWitnesses).toEqual(diagnostic.evidenceWitnesses);
    expect(buildTraceInspectorRunProjection({ ledger, traceRunId }).events
      .find((event) => event.stage === "LANGUAGE_PROJECTION_CONTRACT_REJECTED")
      ?.languageProjectionEvidenceWitnesses).toEqual(diagnostic.evidenceWitnesses);
    expect(JSON.stringify(rejected)).not.toContain(target);
  });
});
