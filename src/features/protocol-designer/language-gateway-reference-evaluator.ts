import {
  parseLanguageProjectionProviderResult,
  validateLanguageProjectionProviderResult,
  type LanguageProjectionRequest,
  type SemanticLanguageProjectionInvariant,
} from "./conversation-language-gateway";

export type LanguageGatewayReferenceAuthority = "HUMAN_ADJUDICATED" | "PRECOMMITTED_SYNTHETIC" | "NONE";
export type LanguageGatewayReferenceExpectation = "PRESENT" | "ABSENT";
export type HumanVisibleTranslationStatus = "FIDELITY_CONFIRMED" | "FIDELITY_REJECTED" | "NOT_REVIEWED" | "UNKNOWN";

export type LanguageGatewayReference = Readonly<{
  referenceId: string;
  caseId: string;
  sourceText: string;
  expectations: Readonly<Partial<Record<SemanticLanguageProjectionInvariant, LanguageGatewayReferenceExpectation>>>;
  authority: Exclude<LanguageGatewayReferenceAuthority, "NONE">;
  provenance: Readonly<{
    decisionKind: "EXPLICIT_USER_DECISION" | "PRECOMMITTED_SYNTHETIC_EXPECTATION";
    decidedAt: string;
    source: string;
  }>;
}>;

export const CURRENT_LANGUAGE_GATEWAY_REFERENCES: readonly LanguageGatewayReference[] = Object.freeze([
  Object.freeze({
    referenceId: "LANGUAGE_GATEWAY_HUMAN_REFERENCE_CASE_04_2026_09_08",
    caseId: "CASE-04",
    sourceText: "The study design is not yet decided.",
    expectations: Object.freeze({ NEGATION: "PRESENT", UNCERTAINTY: "ABSENT", TEMPORAL_RELATION: "PRESENT" }),
    authority: "HUMAN_ADJUDICATED",
    provenance: Object.freeze({
      decisionKind: "EXPLICIT_USER_DECISION",
      decidedAt: "2026-09-08",
      source: "CURRENT_CHAT_DECISION_LG_03",
    }),
  }),
  Object.freeze({
    referenceId: "LANGUAGE_GATEWAY_HUMAN_REFERENCE_CASE_05_2026_09_08",
    caseId: "CASE-05",
    sourceText: "Le plan d’analyse n’est pas encore défini.",
    expectations: Object.freeze({ NEGATION: "PRESENT", UNCERTAINTY: "ABSENT", TEMPORAL_RELATION: "PRESENT" }),
    authority: "HUMAN_ADJUDICATED",
    provenance: Object.freeze({
      decisionKind: "EXPLICIT_USER_DECISION",
      decidedAt: "2026-09-08",
      source: "CURRENT_CHAT_DECISION_LG_04",
    }),
  }),
]);

export type LanguageGatewayEvaluation = Readonly<{
  productSchemaStatus: "PASS" | "FAIL";
  productContractStatus: "PASS" | "FAIL";
  productContractBlocks: readonly string[];
  referenceAgreementStatus: "AGREE" | "DISAGREE" | "NOT_EVALUATED";
  referenceAuthority: LanguageGatewayReferenceAuthority;
  referenceDisagreements: readonly string[];
  humanVisibleTranslationStatus: HumanVisibleTranslationStatus;
}>;

export const evaluateLanguageGatewayProjection = (input: {
  request: LanguageProjectionRequest;
  providerOutput: unknown;
  reference?: LanguageGatewayReference | null;
  humanVisibleTranslationStatus?: HumanVisibleTranslationStatus;
}): LanguageGatewayEvaluation => {
  const parsed = parseLanguageProjectionProviderResult(input.providerOutput);
  const validation = parsed ? validateLanguageProjectionProviderResult({ request: input.request, result: parsed }) : null;
  const reference = input.reference ?? null;
  const disagreements = !parsed || !reference ? [] : Object.entries(reference.expectations).flatMap(([invariantId, expected]) => {
    const claim = parsed.semanticInvariants.find((candidate) => candidate.invariantId === invariantId);
    const observed = claim?.attestationStatus === "ATTESTED" ? (claim.sourcePresent ? "PRESENT" : "ABSENT") : "UNKNOWN";
    return observed === expected ? [] : [`${invariantId}:EXPECTED_${expected}:OBSERVED_${observed}`];
  });
  return Object.freeze({
    productSchemaStatus: parsed ? "PASS" : "FAIL",
    productContractStatus: validation?.valid ? "PASS" : "FAIL",
    productContractBlocks: Object.freeze([...(validation?.blocks ?? ["PROVIDER_OUTPUT_SCHEMA_INVALID"])]),
    referenceAgreementStatus: !reference || !parsed ? "NOT_EVALUATED" : disagreements.length ? "DISAGREE" : "AGREE",
    referenceAuthority: reference?.authority ?? "NONE",
    referenceDisagreements: Object.freeze(disagreements),
    humanVisibleTranslationStatus: input.humanVisibleTranslationStatus ?? "NOT_REVIEWED",
  });
};
