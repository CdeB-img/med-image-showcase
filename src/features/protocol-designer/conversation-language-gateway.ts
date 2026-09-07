import { logicalDigest } from "../knowledge-engine/canonical.js";

export const CONVERSATION_LANGUAGE_GATEWAY_CONTRACT = "PROTOCOL_DESIGNER_CONVERSATION_LANGUAGE_GATEWAY" as const;
export const CONVERSATION_LANGUAGE_GATEWAY_VERSION = "1.0.0" as const;
export const LANGUAGE_PROJECTION_CONTRACT = "CONVERSATION_LANGUAGE_PROJECTION" as const;
export const LANGUAGE_PROJECTION_CONTRACT_VERSION = "1.0.0" as const;
export const CANONICAL_WORKING_LANGUAGE = "fr" as const;

export type ConversationLanguageCode = string;
export type LanguageDetectionStatus = "DETECTED" | "INSUFFICIENT_EVIDENCE" | "PROVIDER_REQUIRED";
export type LanguageConfidence = "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
export type LanguageSupportStatus = "SUPPORTED" | "UNSUPPORTED" | "UNKNOWN";
export type LanguageQualificationStatus = "QUALIFIED" | "PROVIDER_SUPPORTED_UNQUALIFIED" | "UNKNOWN";
export type LanguageProjectionKind = "INPUT_TO_FRENCH" | "OUTPUT_FROM_FRENCH";
export type LanguageProjectionStatus = "NOT_REQUIRED" | "SUCCEEDED" | "FAILED" | "UNSUPPORTED";

export type LanguageProjectionFailure = Readonly<{
  projectionKind: LanguageProjectionKind;
  sourceTextDigest: string;
  sourceLanguage: ConversationLanguageCode | "UNKNOWN";
  targetLanguage: ConversationLanguageCode;
  provider: "GOOGLE_GEMINI";
  model: string;
  failureCategory: string;
  retryStatus: "NOT_RETRIED";
  occurredAt: string;
  projectWriteAuthorized: false;
  scientificDecisionAuthorized: false;
}>;

export type LocalLanguageDetection = Readonly<{
  status: LanguageDetectionStatus;
  detectedLanguage: ConversationLanguageCode | null;
  confidence: LanguageConfidence;
  reasonCode: string;
}>;

export type LanguageSwitchCandidate = Readonly<{
  fromLanguage: ConversationLanguageCode;
  toLanguage: ConversationLanguageCode;
  confidence: LanguageConfidence;
  reasonCode: "STRONG_DIFFERENT_LANGUAGE_EVIDENCE";
  adopted: false;
}>;

export type LanguageProjectionInvariant = Readonly<{
  invariant: "NUMBERS" | "UNITS" | "IDENTIFIERS" | "NEGATION" | "UNCERTAINTY" | "CONDITIONALITY" | "COMPARISON" | "TEMPORAL_RELATION" | "DECISION_STATUS";
  status: "PRESERVED" | "NOT_PRESENT" | "UNKNOWN";
  sourceEvidence: readonly string[];
  targetEvidence: readonly string[];
}>;

export type LanguageProjectionProviderResult = Readonly<{
  detectedLanguage: ConversationLanguageCode;
  supportStatus: LanguageSupportStatus;
  qualificationStatus: LanguageQualificationStatus;
  translatedText: string;
  ambiguityPreserved: boolean;
  limitations: readonly string[];
}>;

export type ProtectedOpaqueLiteral = Readonly<{
  literal: string;
  kind:
    | "CLINICAL_TRIAL_IDENTIFIER"
    | "VARIABLE_IDENTIFIER"
    | "STRUCTURED_IDENTIFIER"
    | "PROJECT_OR_OBJECT_IDENTIFIER"
    | "UUID"
    | "HASH"
    | "DICOM_UID"
    | "DOI"
    | "URL"
    | "EXPLICIT_CONTEXT";
  source: "DETERMINISTIC_SOURCE_PATTERN" | "EXPLICIT_CONTEXT";
}>;

export type LanguageProjectionContractFailureDiagnostic = Readonly<{
  contract: "LANGUAGE_PROJECTION_CONTRACT_FAILURE_DIAGNOSTIC";
  contractVersion: "1.0.0";
  subInvariantIds: readonly string[];
  provider: "GOOGLE_GEMINI";
  model: string;
  providerResponseId: string | null;
  providerResultDigest: string;
}>;

export class LanguageProjectionContractError extends Error {
  readonly code = "LANGUAGE_PROJECTION_CONTRACT_FAILED" as const;
  readonly diagnostic: LanguageProjectionContractFailureDiagnostic;

  constructor(input: {
    blocks: readonly string[];
    model: string;
    providerResponseId: string | null;
    providerResultDigest: string;
  }) {
    super(`LANGUAGE_PROJECTION_CONTRACT_FAILED:${input.blocks.join(",")}`);
    this.name = "LanguageProjectionContractError";
    this.diagnostic = Object.freeze({
      contract: "LANGUAGE_PROJECTION_CONTRACT_FAILURE_DIAGNOSTIC",
      contractVersion: "1.0.0",
      subInvariantIds: Object.freeze([...input.blocks]),
      provider: "GOOGLE_GEMINI",
      model: input.model,
      providerResponseId: input.providerResponseId,
      providerResultDigest: input.providerResultDigest,
    });
  }
}

export type LanguageProjectionArtifact = Readonly<{
  contract: typeof LANGUAGE_PROJECTION_CONTRACT;
  contractVersion: typeof LANGUAGE_PROJECTION_CONTRACT_VERSION;
  projectionId: string;
  projectionKind: LanguageProjectionKind;
  sourceTextDigest: string;
  sourceLanguage: ConversationLanguageCode;
  targetLanguage: ConversationLanguageCode;
  translatedText: string;
  translatedTextDigest: string;
  providerResultDigest: string;
  status: Extract<LanguageProjectionStatus, "SUCCEEDED">;
  supportStatus: "SUPPORTED";
  qualificationStatus: LanguageQualificationStatus;
  provider: "GOOGLE_GEMINI";
  model: string;
  providerResponseId: string | null;
  providerCalls: 1;
  translationContractVersion: typeof LANGUAGE_PROJECTION_CONTRACT_VERSION;
  ambiguityPreserved: boolean;
  limitations: readonly string[];
  invariants: readonly LanguageProjectionInvariant[];
  createdAt: string;
  projectWriteAuthorized: false;
  scientificDecisionAuthorized: false;
}>;

export type MultilingualUserTurn = Readonly<{
  contract: "MULTILINGUAL_USER_TURN";
  contractVersion: "1.0.0";
  turnId: string;
  originalText: string;
  originalTextDigest: string;
  sourceLanguage: ConversationLanguageCode | null;
  detectedLanguage: ConversationLanguageCode | null;
  conversationLanguage: ConversationLanguageCode | null;
  languageConfidence: LanguageConfidence;
  languageDetectionStatus: LanguageDetectionStatus;
  languageSwitchCandidate: LanguageSwitchCandidate | null;
  workingLanguage: typeof CANONICAL_WORKING_LANGUAGE;
  frenchWorkingText: string | null;
  frenchWorkingTextDigest: string | null;
  translationRequired: boolean;
  translationStatus: LanguageProjectionStatus;
  translationProvider: "GOOGLE_GEMINI" | "NONE";
  translationModel: string | "NONE";
  translationContractVersion: typeof LANGUAGE_PROJECTION_CONTRACT_VERSION;
  translationDigest: string | null;
  translationProviderResultDigest: string | null;
  ambiguityPreserved: boolean | null;
  limitations: readonly string[];
  languageQualificationStatus: LanguageQualificationStatus;
  projectId: string | null;
  projectVersion: string | null;
  projectDigest: string | null;
  provenance: Readonly<{
    originalTurnRef: string;
    projectionRef: string | null;
    originalIsImmutableEvidence: true;
    workingProjectionIsUserLiteral: false;
  }>;
}>;

export type LocalizedConversationResponse = Readonly<{
  contract: "LOCALIZED_CONVERSATION_RESPONSE";
  contractVersion: "1.0.0";
  responseId: string;
  sourceTurnRef: string;
  internalFrenchResponse: string;
  internalFrenchResponseDigest: string;
  localizedResponse: string;
  localizedResponseDigest: string;
  targetLanguage: ConversationLanguageCode;
  translationRequired: boolean;
  translationStatus: Extract<LanguageProjectionStatus, "NOT_REQUIRED" | "SUCCEEDED">;
  translationProvider: "GOOGLE_GEMINI" | "NONE";
  translationModel: string | "NONE";
  translationDigest: string | null;
  limitations: readonly string[];
  provenance: Readonly<{
    canonicalResponseRef: string;
    projectionRef: string | null;
    localizedProseIsScientificTruth: false;
  }>;
}>;

export type ConversationLanguageGatewayState = Readonly<{
  contract: typeof CONVERSATION_LANGUAGE_GATEWAY_CONTRACT;
  contractVersion: typeof CONVERSATION_LANGUAGE_GATEWAY_VERSION;
  workingLanguage: typeof CANONICAL_WORKING_LANGUAGE;
  conversationLanguage: ConversationLanguageCode | null;
  languageSwitchCandidate: LanguageSwitchCandidate | null;
  turns: readonly MultilingualUserTurn[];
  responses: readonly LocalizedConversationResponse[];
  projectionCache: readonly LanguageProjectionArtifact[];
  failures: readonly LanguageProjectionFailure[];
  projectWriteAuthorized: false;
  scientificDecisionAuthorized: false;
}>;

export type LanguageProjectionRequest = Readonly<{
  apiVersion: "1.0.0";
  operation: "LANGUAGE_PROJECTION";
  projectionKind: LanguageProjectionKind;
  sourceText: string;
  sourceLanguageHint: ConversationLanguageCode | "UNKNOWN";
  targetLanguage: ConversationLanguageCode;
  translationContractVersion: typeof LANGUAGE_PROJECTION_CONTRACT_VERSION;
  projectionIdentityDigest: string;
  protectedOpaqueLiterals?: readonly ProtectedOpaqueLiteral[];
}>;

export type LanguageProjectionResponse = Readonly<{
  apiVersion: "1.0.0";
  operation: "LANGUAGE_PROJECTION";
  projection: LanguageProjectionArtifact;
  observability: Readonly<{
    provider: "GOOGLE_GEMINI";
    model: string;
    calls: 1;
    latencyMs: number;
  }>;
}>;

const normalizeLanguageCode = (value: string) => value.trim().toLocaleLowerCase("en-US").split(/[-_]/u)[0] || "unknown";

const words = (value: string) => value
  .normalize("NFKD")
  .replace(/\p{M}/gu, "")
  .toLocaleLowerCase("fr-FR")
  .match(/\p{L}+/gu) ?? [];

const countSignals = (tokens: readonly string[], signals: ReadonlySet<string>) => tokens.reduce(
  (count, token) => count + (signals.has(token) ? 1 : 0),
  0,
);

const FRENCH_SIGNALS = new Set([
  "je", "j", "nous", "vous", "tu", "il", "elle", "ils", "elles", "me", "moi", "te", "souhaite", "voudrais", "veux", "une", "un", "des", "le", "la", "l", "les", "dans", "avec", "sans", "pour", "afin", "que", "qui", "est", "sera", "sont", "pas", "et", "ou", "mais", "donc", "notre", "mon", "ma", "mes", "de", "du", "au", "aux", "ce", "cette", "ces", "cela", "ca", "tout", "plus", "moins", "faire", "idee", "projet", "question", "objectif", "population", "suivi", "entre", "chez", "creer", "creation", "explique", "expliquer", "etude", "etudier", "comparer", "comprendre", "pourquoi", "demande", "demandes", "nombre", "centre", "centres", "reste", "definir", "affiche", "afficher", "montre", "montrer", "apercu", "protocole", "partiel", "age", "maximal", "ans",
]);
const ENGLISH_SIGNALS = new Set([
  "i", "we", "you", "want", "would", "like", "a", "an", "the", "in", "with", "without", "for", "that", "which", "is", "are", "not", "and", "or", "but", "our", "my", "study", "compare", "understand", "assess", "evaluate",
]);

/**
 * Local boundary detection is intentionally conservative. It only bypasses the
 * provider for sufficiently evidenced French and recognizes scripts needed to
 * route an input projection. It does not claim a frozen language catalogue.
 */
export const detectConversationLanguage = (text: string): LocalLanguageDetection => {
  const trimmed = text.trim();
  if (!trimmed) return { status: "INSUFFICIENT_EVIDENCE", detectedLanguage: null, confidence: "UNKNOWN", reasonCode: "EMPTY_INPUT" };
  if (/\p{Script=Hiragana}|\p{Script=Katakana}/u.test(trimmed)) {
    return { status: "DETECTED", detectedLanguage: "ja", confidence: "HIGH", reasonCode: "JAPANESE_KANA_SCRIPT" };
  }
  if (/\p{Script=Han}/u.test(trimmed)) {
    return { status: "DETECTED", detectedLanguage: "zh", confidence: "HIGH", reasonCode: "HAN_SCRIPT_WITHOUT_KANA" };
  }
  const lexicalTokens = words(trimmed).filter((token) => token.length > 1 || ["a", "i", "j"].includes(token));
  const french = countSignals(lexicalTokens, FRENCH_SIGNALS);
  const english = countSignals(lexicalTokens, ENGLISH_SIGNALS);
  const sufficientLength = lexicalTokens.length >= 4 || trimmed.length >= 28;
  if (sufficientLength && french >= 2 && french >= english) {
    return { status: "DETECTED", detectedLanguage: "fr", confidence: french >= 4 ? "HIGH" : "MEDIUM", reasonCode: "FRENCH_LEXICAL_EVIDENCE" };
  }
  if (sufficientLength && english >= 2 && english > french) {
    return { status: "DETECTED", detectedLanguage: "en", confidence: english >= 4 ? "HIGH" : "MEDIUM", reasonCode: "ENGLISH_LEXICAL_EVIDENCE" };
  }
  return sufficientLength
    ? { status: "PROVIDER_REQUIRED", detectedLanguage: null, confidence: "LOW", reasonCode: "LOCAL_LANGUAGE_EVIDENCE_INSUFFICIENT" }
    : { status: "INSUFFICIENT_EVIDENCE", detectedLanguage: null, confidence: "LOW", reasonCode: "TURN_TOO_SHORT_TO_ESTABLISH_LANGUAGE" };
};

export const resolveConversationLanguage = (input: {
  currentConversationLanguage: ConversationLanguageCode | null;
  detection: LocalLanguageDetection;
}): Readonly<{ conversationLanguage: ConversationLanguageCode | null; switchCandidate: LanguageSwitchCandidate | null }> => {
  const detected = input.detection.detectedLanguage ? normalizeLanguageCode(input.detection.detectedLanguage) : null;
  const current = input.currentConversationLanguage ? normalizeLanguageCode(input.currentConversationLanguage) : null;
  if (!current) return { conversationLanguage: detected, switchCandidate: null };
  if (!detected || detected === current || input.detection.confidence === "LOW" || input.detection.confidence === "UNKNOWN") {
    return { conversationLanguage: current, switchCandidate: null };
  }
  return {
    conversationLanguage: current,
    switchCandidate: {
      fromLanguage: current,
      toLanguage: detected,
      confidence: input.detection.confidence,
      reasonCode: "STRONG_DIFFERENT_LANGUAGE_EVIDENCE",
      adopted: false,
    },
  };
};

export const createConversationLanguageGatewayState = (): ConversationLanguageGatewayState => ({
  contract: CONVERSATION_LANGUAGE_GATEWAY_CONTRACT,
  contractVersion: CONVERSATION_LANGUAGE_GATEWAY_VERSION,
  workingLanguage: CANONICAL_WORKING_LANGUAGE,
  conversationLanguage: null,
  languageSwitchCandidate: null,
  turns: [],
  responses: [],
  projectionCache: [],
  failures: [],
  projectWriteAuthorized: false,
  scientificDecisionAuthorized: false,
});

const occurrences = (value: string, expression: RegExp) => value.match(expression) ?? [];
const normalizedToken = (value: string) => value.normalize("NFKC").toLocaleLowerCase("fr-FR").replace(/\s+/gu, " ").trim();
const exactMultisetPreserved = (source: readonly string[], target: readonly string[]) => {
  const left = [...source].map(normalizedToken).sort();
  const right = [...target].map(normalizedToken).sort();
  const remaining = [...right];
  return left.every((item) => {
    const index = remaining.indexOf(item);
    if (index < 0) return false;
    remaining.splice(index, 1);
    return true;
  });
};

const PROTECTED_OPAQUE_LITERAL_PATTERNS: readonly Readonly<{
  kind: Exclude<ProtectedOpaqueLiteral["kind"], "EXPLICIT_CONTEXT">;
  pattern: RegExp;
}>[] = Object.freeze([
  { kind: "URL", pattern: /https?:\/\/[^\s<>"']*[A-Za-z0-9/#=_~-]/giu },
  { kind: "DOI", pattern: /\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/giu },
  { kind: "UUID", pattern: /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/giu },
  { kind: "CLINICAL_TRIAL_IDENTIFIER", pattern: /\bNCT\d{8}\b/gu },
  { kind: "DICOM_UID", pattern: /\b(?:\d+\.){3,}\d+\b/gu },
  { kind: "HASH", pattern: /\b(?:sha(?:1|224|256|384|512):)?[0-9a-f]{32,128}\b/giu },
  { kind: "VARIABLE_IDENTIFIER", pattern: /\b[A-Za-z][A-Za-z0-9]*(?:_[A-Za-z0-9]+)+\b/gu },
  { kind: "STRUCTURED_IDENTIFIER", pattern: /\b[A-Z][A-Z0-9]{1,15}[-_](?=[A-Z0-9_-]*\d)[A-Z0-9_-]+\b/gu },
  { kind: "PROJECT_OR_OBJECT_IDENTIFIER", pattern: /\b[A-Za-z][A-Za-z0-9_-]*(?::[A-Za-z0-9_-]+)+\b/gu },
]);

const PROTECTED_OPAQUE_LITERAL_KINDS = new Set<ProtectedOpaqueLiteral["kind"]>([
  "CLINICAL_TRIAL_IDENTIFIER",
  "VARIABLE_IDENTIFIER",
  "STRUCTURED_IDENTIFIER",
  "PROJECT_OR_OBJECT_IDENTIFIER",
  "UUID",
  "HASH",
  "DICOM_UID",
  "DOI",
  "URL",
  "EXPLICIT_CONTEXT",
]);

const isProtectedOpaqueLiteral = (value: unknown): value is ProtectedOpaqueLiteral => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Partial<ProtectedOpaqueLiteral>;
  return typeof candidate.literal === "string"
    && candidate.literal.trim().length > 0
    && candidate.literal.length <= 512
    && PROTECTED_OPAQUE_LITERAL_KINDS.has(candidate.kind as ProtectedOpaqueLiteral["kind"])
    && ["DETERMINISTIC_SOURCE_PATTERN", "EXPLICIT_CONTEXT"].includes(String(candidate.source))
    && ((candidate.kind === "EXPLICIT_CONTEXT") === (candidate.source === "EXPLICIT_CONTEXT"));
};

const literalExpression = (literal: string) => new RegExp(
  `(?<![\\p{L}\\p{N}_])${literal.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}(?![\\p{L}\\p{N}_])`,
  "gu",
);

const literalOccurrences = (text: string, literal: string) => occurrences(text, literalExpression(literal));

export const extractProtectedOpaqueLiterals = (sourceText: string): readonly ProtectedOpaqueLiteral[] => {
  const candidates = PROTECTED_OPAQUE_LITERAL_PATTERNS.flatMap(({ kind, pattern }) =>
    [...sourceText.matchAll(pattern)].map((match) => ({
      literal: match[0],
      kind,
      source: "DETERMINISTIC_SOURCE_PATTERN" as const,
      index: match.index ?? Number.MAX_SAFE_INTEGER,
    })));
  const seen = new Set<string>();
  return candidates
    .sort((left, right) => left.index - right.index)
    .filter((candidate) => {
      if (seen.has(candidate.literal)) return false;
      seen.add(candidate.literal);
      return true;
    })
    .map(({ index: _index, ...candidate }) => Object.freeze(candidate));
};

const resolvedProtectedOpaqueLiterals = (input: {
  sourceText: string;
  explicit?: readonly ProtectedOpaqueLiteral[];
}): readonly ProtectedOpaqueLiteral[] => {
  const seen = new Set<string>();
  return [...extractProtectedOpaqueLiterals(input.sourceText), ...(input.explicit ?? [])]
    .filter((candidate) => {
      if (seen.has(candidate.literal)) return false;
      seen.add(candidate.literal);
      return true;
    });
};

export const languageProjectionIdentityDigest = (input: {
  projectionKind: LanguageProjectionKind;
  sourceText: string;
  sourceLanguage: ConversationLanguageCode | "UNKNOWN";
  targetLanguage: ConversationLanguageCode;
  provider: "GOOGLE_GEMINI";
  model: string;
  protectedOpaqueLiterals?: readonly ProtectedOpaqueLiteral[];
}) => logicalDigest({
  contract: LANGUAGE_PROJECTION_CONTRACT,
  contractVersion: LANGUAGE_PROJECTION_CONTRACT_VERSION,
  projectionKind: input.projectionKind,
  sourceTextDigest: logicalDigest(input.sourceText),
  sourceLanguage: normalizeLanguageCode(input.sourceLanguage),
  targetLanguage: normalizeLanguageCode(input.targetLanguage),
  provider: input.provider,
  model: input.model,
  protectedOpaqueLiterals: resolvedProtectedOpaqueLiterals({
    sourceText: input.sourceText,
    explicit: input.protectedOpaqueLiterals,
  }),
});

const normalizedNumber = (value: string) => {
  const [integerPart = "0", decimalPart = ""] = value.replace(",", ".").split(".");
  const integer = integerPart.replace(/^0+(?=\d)/u, "") || "0";
  const decimal = decimalPart.replace(/0+$/u, "");
  return decimal ? `${integer}.${decimal}` : integer;
};

const numericMultisetPreserved = (source: readonly string[], target: readonly string[]) => {
  const left = [...source].map(normalizedNumber).sort();
  const right = [...target].map(normalizedNumber).sort();
  const remaining = [...right];
  return left.every((item) => {
    const index = remaining.indexOf(item);
    if (index < 0) return false;
    remaining.splice(index, 1);
    return true;
  });
};

/**
 * This is a structural marker sentinel only. A PRESERVED result records that
 * compatible surface evidence remains present; it does not adjudicate the
 * semantic scope or scientific fidelity of the translation.
 */
const semanticMarkerInvariant = (input: {
  invariant: LanguageProjectionInvariant["invariant"];
  source: string;
  target: string;
  sourcePattern: RegExp;
  targetPattern: RegExp;
}): LanguageProjectionInvariant => {
  const sourceEvidence = occurrences(input.source, input.sourcePattern);
  if (!sourceEvidence.length) return { invariant: input.invariant, status: "NOT_PRESENT", sourceEvidence: [], targetEvidence: [] };
  const targetEvidence = occurrences(input.target, input.targetPattern);
  return {
    invariant: input.invariant,
    status: targetEvidence.length ? "PRESERVED" : "UNKNOWN",
    sourceEvidence,
    targetEvidence,
  };
};

export const evaluateLinguisticInvariants = (
  source: string,
  target: string,
  protectedOpaqueLiterals: readonly ProtectedOpaqueLiteral[] = extractProtectedOpaqueLiterals(source),
): readonly LanguageProjectionInvariant[] => {
  // Exact lexical checks are reserved for mechanically stable surface forms
  // such as units and governed decision-status tokens.
  const exact = (invariant: LanguageProjectionInvariant["invariant"], pattern: RegExp): LanguageProjectionInvariant => {
    const sourceEvidence = occurrences(source, pattern);
    if (!sourceEvidence.length) return { invariant, status: "NOT_PRESENT", sourceEvidence: [], targetEvidence: [] };
    const targetEvidence = occurrences(target, pattern);
    return { invariant, status: exactMultisetPreserved(sourceEvidence, targetEvidence) ? "PRESERVED" : "UNKNOWN", sourceEvidence, targetEvidence };
  };
  const identifiers = (): LanguageProjectionInvariant => {
    const sourceEvidence = protectedOpaqueLiterals.flatMap((candidate) => literalOccurrences(source, candidate.literal));
    if (!sourceEvidence.length) return { invariant: "IDENTIFIERS", status: "NOT_PRESENT", sourceEvidence: [], targetEvidence: [] };
    const targetEvidence = protectedOpaqueLiterals.flatMap((candidate) => literalOccurrences(target, candidate.literal));
    const preserved = protectedOpaqueLiterals.every((candidate) =>
      literalOccurrences(target, candidate.literal).length >= literalOccurrences(source, candidate.literal).length);
    return {
      invariant: "IDENTIFIERS",
      status: preserved ? "PRESERVED" : "UNKNOWN",
      sourceEvidence,
      targetEvidence,
    };
  };
  const numbers = (): LanguageProjectionInvariant => {
    const sourceEvidence = occurrences(source, /\b\d+(?:[.,]\d+)?\b/gu);
    if (!sourceEvidence.length) return { invariant: "NUMBERS", status: "NOT_PRESENT", sourceEvidence: [], targetEvidence: [] };
    const targetEvidence = occurrences(target, /\b\d+(?:[.,]\d+)?\b/gu);
    return {
      invariant: "NUMBERS",
      status: numericMultisetPreserved(sourceEvidence, targetEvidence) ? "PRESERVED" : "UNKNOWN",
      sourceEvidence,
      targetEvidence,
    };
  };
  return [
    numbers(),
    exact("UNITS", /\b(?:T|ms|s|min|h|d|mg|g|kg|µg|ug|mL|ml|L|mm|cm|m|Hz|MHz|%)\b/gu),
    identifiers(),
    semanticMarkerInvariant({ invariant: "NEGATION", source, target, sourcePattern: /\b(?:not|no|without|ne|pas|sans|aucun|none)\b|ない|なし|不|未|无|沒有|没有/giu, targetPattern: /\b(?:not|no|without|ne|pas|sans|aucun|non|none)\b|ない|なし|不|未|无|沒有|没有/giu }),
    semanticMarkerInvariant({ invariant: "UNCERTAINTY", source, target, sourcePattern: /\b(?:may|might|could|uncertain|unknown|possibly|peut|pourrait|incertain|inconnu|possible)\b|かもしれない|可能|不明/giu, targetPattern: /\b(?:may|might|could|uncertain|unknown|possibly|peut|pourrait|incertain|inconnu|possible)\b|かもしれない|可能|不明/giu }),
    semanticMarkerInvariant({ invariant: "CONDITIONALITY", source, target, sourcePattern: /\b(?:if|unless|si|condition)\b|場合|なら|如果|若/giu, targetPattern: /\b(?:if|unless|si|condition)\b|場合|なら|如果|若/giu }),
    semanticMarkerInvariant({ invariant: "COMPARISON", source, target, sourcePattern: /\b(?:versus|vs|compare|compared|comparison|comparer|comparaison)\b|比較|比较|对比/giu, targetPattern: /\b(?:versus|vs|compare|compared|comparison|comparer|compare|comparons|comparent|comparaison|comparé)\b|比較|比较|对比/giu }),
    semanticMarkerInvariant({ invariant: "TEMPORAL_RELATION", source, target, sourcePattern: /\b(?:before|after|during|at baseline|avant|après|pendant)\b|前|後|后|期间/giu, targetPattern: /\b(?:before|after|during|at baseline|avant|après|pendant)\b|前|後|后|期间/giu }),
    exact("DECISION_STATUS", /\b(?:UNKNOWN|WITHHELD|KNOWN|UNDECIDED)\b/gu),
  ];
};

export const validateLanguageProjectionProviderResult = (input: {
  request: LanguageProjectionRequest;
  result: LanguageProjectionProviderResult;
}): Readonly<{ valid: boolean; blocks: readonly string[]; invariants: readonly LanguageProjectionInvariant[] }> => {
  const blocks: string[] = [];
  const detectedLanguage = normalizeLanguageCode(input.result.detectedLanguage);
  const targetLanguage = normalizeLanguageCode(input.request.targetLanguage);
  if (!detectedLanguage || detectedLanguage === "unknown") blocks.push("DETECTED_LANGUAGE_MISSING");
  if (input.result.supportStatus !== "SUPPORTED") blocks.push(`LANGUAGE_${input.result.supportStatus}`);
  if (!input.result.translatedText.trim()) blocks.push("TRANSLATED_TEXT_MISSING");
  if (input.request.projectionKind === "INPUT_TO_FRENCH" && targetLanguage !== CANONICAL_WORKING_LANGUAGE) blocks.push("INPUT_TARGET_MUST_BE_FRENCH");
  if (!input.result.ambiguityPreserved) blocks.push("AMBIGUITY_PRESERVATION_NOT_ATTESTED");
  const explicitProtectedLiterals = input.request.protectedOpaqueLiterals ?? [];
  if (explicitProtectedLiterals.some((candidate) => !literalOccurrences(input.request.sourceText, candidate.literal).length)) {
    blocks.push("PROTECTED_OPAQUE_LITERAL_SOURCE_MISMATCH");
  }
  const protectedOpaqueLiterals = resolvedProtectedOpaqueLiterals({
    sourceText: input.request.sourceText,
    explicit: explicitProtectedLiterals,
  });
  const invariants = evaluateLinguisticInvariants(input.request.sourceText, input.result.translatedText, protectedOpaqueLiterals);
  blocks.push(...invariants.filter((item) => item.status === "UNKNOWN").map((item) => `LINGUISTIC_INVARIANT_UNVERIFIED:${item.invariant}`));
  return { valid: blocks.length === 0, blocks, invariants };
};

export const materializeLanguageProjectionArtifact = (input: {
  request: LanguageProjectionRequest;
  result: LanguageProjectionProviderResult;
  model: string;
  providerResponseId: string | null;
  createdAt: string;
}): LanguageProjectionArtifact => {
  const validation = validateLanguageProjectionProviderResult({ request: input.request, result: input.result });
  const providerResultDigest = logicalDigest(input.result);
  if (!validation.valid) throw new LanguageProjectionContractError({
    blocks: validation.blocks,
    model: input.model,
    providerResponseId: input.providerResponseId,
    providerResultDigest,
  });
  const sourceLanguage = input.request.sourceLanguageHint === "UNKNOWN"
    ? normalizeLanguageCode(input.result.detectedLanguage)
    : normalizeLanguageCode(input.request.sourceLanguageHint);
  const translatedText = input.result.translatedText.trim();
  return {
    contract: LANGUAGE_PROJECTION_CONTRACT,
    contractVersion: LANGUAGE_PROJECTION_CONTRACT_VERSION,
    projectionId: `language-projection:${input.request.projectionIdentityDigest}`,
    projectionKind: input.request.projectionKind,
    sourceTextDigest: logicalDigest(input.request.sourceText),
    sourceLanguage,
    targetLanguage: normalizeLanguageCode(input.request.targetLanguage),
    translatedText,
    translatedTextDigest: logicalDigest(translatedText),
    providerResultDigest,
    status: "SUCCEEDED",
    supportStatus: "SUPPORTED",
    qualificationStatus: input.result.qualificationStatus,
    provider: "GOOGLE_GEMINI",
    model: input.model,
    providerResponseId: input.providerResponseId,
    providerCalls: 1,
    translationContractVersion: LANGUAGE_PROJECTION_CONTRACT_VERSION,
    ambiguityPreserved: true,
    limitations: [...input.result.limitations],
    invariants: validation.invariants,
    createdAt: input.createdAt,
    projectWriteAuthorized: false,
    scientificDecisionAuthorized: false,
  };
};

export const buildMultilingualUserTurn = (input: {
  turnId: string;
  originalText: string;
  detection: LocalLanguageDetection;
  currentConversationLanguage: ConversationLanguageCode | null;
  projection: LanguageProjectionArtifact | null;
  project?: Readonly<{ projectId: string; versionId: string; projectDigest: string }> | null;
}): MultilingualUserTurn => {
  const sourceLanguage = input.projection?.sourceLanguage ?? input.detection.detectedLanguage;
  const resolved = resolveConversationLanguage({
    currentConversationLanguage: input.currentConversationLanguage,
    detection: sourceLanguage && !input.detection.detectedLanguage
      ? { status: "DETECTED", detectedLanguage: sourceLanguage, confidence: "MEDIUM", reasonCode: "PROVIDER_DETECTION" }
      : input.detection,
  });
  const languageNeutral = !sourceLanguage && input.detection.status === "INSUFFICIENT_EVIDENCE";
  const isFrench = normalizeLanguageCode(sourceLanguage ?? "unknown") === CANONICAL_WORKING_LANGUAGE;
  if (!isFrench && !languageNeutral && !input.projection) throw new Error("LANGUAGE_PROJECTION_REQUIRED");
  const frenchWorkingText = isFrench || languageNeutral ? input.originalText : input.projection!.translatedText;
  return {
    contract: "MULTILINGUAL_USER_TURN",
    contractVersion: "1.0.0",
    turnId: input.turnId,
    originalText: input.originalText,
    originalTextDigest: logicalDigest(input.originalText),
    sourceLanguage,
    detectedLanguage: sourceLanguage,
    conversationLanguage: resolved.conversationLanguage,
    languageConfidence: input.detection.confidence,
    languageDetectionStatus: input.detection.status,
    languageSwitchCandidate: resolved.switchCandidate,
    workingLanguage: CANONICAL_WORKING_LANGUAGE,
    frenchWorkingText,
    frenchWorkingTextDigest: logicalDigest(frenchWorkingText),
    translationRequired: !isFrench && !languageNeutral,
    translationStatus: isFrench || languageNeutral ? "NOT_REQUIRED" : "SUCCEEDED",
    translationProvider: isFrench || languageNeutral ? "NONE" : "GOOGLE_GEMINI",
    translationModel: isFrench || languageNeutral ? "NONE" : input.projection!.model,
    translationContractVersion: LANGUAGE_PROJECTION_CONTRACT_VERSION,
    translationDigest: input.projection?.translatedTextDigest ?? null,
    translationProviderResultDigest: input.projection?.providerResultDigest ?? null,
    ambiguityPreserved: isFrench || languageNeutral ? null : input.projection!.ambiguityPreserved,
    limitations: input.projection?.limitations ?? [],
    languageQualificationStatus: isFrench ? "QUALIFIED" : languageNeutral ? "UNKNOWN" : input.projection!.qualificationStatus,
    projectId: input.project?.projectId ?? null,
    projectVersion: input.project?.versionId ?? null,
    projectDigest: input.project?.projectDigest ?? null,
    provenance: {
      originalTurnRef: input.turnId,
      projectionRef: input.projection?.projectionId ?? null,
      originalIsImmutableEvidence: true,
      workingProjectionIsUserLiteral: false,
    },
  };
};

export const appendLanguageTurnToGatewayState = (input: {
  state: ConversationLanguageGatewayState;
  turn: MultilingualUserTurn;
  projection?: LanguageProjectionArtifact | null;
}): ConversationLanguageGatewayState => ({
  ...input.state,
  conversationLanguage: input.turn.conversationLanguage,
  languageSwitchCandidate: input.turn.languageSwitchCandidate,
  turns: [...input.state.turns, input.turn],
  projectionCache: input.projection && !input.state.projectionCache.some((item) => item.projectionId === input.projection!.projectionId)
    ? [...input.state.projectionCache, input.projection]
    : input.state.projectionCache,
});

export const findReusableLanguageProjection = (input: {
  state: ConversationLanguageGatewayState;
  projectionIdentityDigest: string;
}) => input.state.projectionCache.find((item) => item.projectionId === `language-projection:${input.projectionIdentityDigest}`) ?? null;

export const buildLocalizedConversationResponse = (input: {
  responseId: string;
  sourceTurnRef: string;
  canonicalFrenchResponse: string;
  targetLanguage: ConversationLanguageCode;
  projection: LanguageProjectionArtifact | null;
}): LocalizedConversationResponse => {
  const frenchTarget = normalizeLanguageCode(input.targetLanguage) === CANONICAL_WORKING_LANGUAGE;
  if (!frenchTarget && !input.projection) throw new Error("OUTPUT_LANGUAGE_PROJECTION_REQUIRED");
  const localizedResponse = frenchTarget ? input.canonicalFrenchResponse : input.projection!.translatedText;
  return {
    contract: "LOCALIZED_CONVERSATION_RESPONSE",
    contractVersion: "1.0.0",
    responseId: input.responseId,
    sourceTurnRef: input.sourceTurnRef,
    internalFrenchResponse: input.canonicalFrenchResponse,
    internalFrenchResponseDigest: logicalDigest(input.canonicalFrenchResponse),
    localizedResponse,
    localizedResponseDigest: logicalDigest(localizedResponse),
    targetLanguage: normalizeLanguageCode(input.targetLanguage),
    translationRequired: !frenchTarget,
    translationStatus: frenchTarget ? "NOT_REQUIRED" : "SUCCEEDED",
    translationProvider: frenchTarget ? "NONE" : "GOOGLE_GEMINI",
    translationModel: frenchTarget ? "NONE" : input.projection!.model,
    translationDigest: input.projection?.translatedTextDigest ?? null,
    limitations: input.projection?.limitations ?? [],
    provenance: {
      canonicalResponseRef: input.responseId,
      projectionRef: input.projection?.projectionId ?? null,
      localizedProseIsScientificTruth: false,
    },
  };
};

export const appendLocalizedResponseToGatewayState = (input: {
  state: ConversationLanguageGatewayState;
  response: LocalizedConversationResponse;
  projection?: LanguageProjectionArtifact | null;
}): ConversationLanguageGatewayState => ({
  ...input.state,
  responses: [...input.state.responses, input.response],
  projectionCache: input.projection && !input.state.projectionCache.some((item) => item.projectionId === input.projection!.projectionId)
    ? [...input.state.projectionCache, input.projection]
    : input.state.projectionCache,
});

export const appendLanguageProjectionFailure = (input: {
  state: ConversationLanguageGatewayState;
  failure: LanguageProjectionFailure;
}): ConversationLanguageGatewayState => ({
  ...input.state,
  failures: [...input.state.failures, input.failure],
});

export const languageProjectionFailure = (input: {
  projectionKind: LanguageProjectionKind;
  sourceText: string;
  sourceLanguage: ConversationLanguageCode | "UNKNOWN";
  targetLanguage: ConversationLanguageCode;
  model: string;
  failureCategory: string;
  occurredAt: string;
}): LanguageProjectionFailure => ({
  projectionKind: input.projectionKind,
  sourceTextDigest: logicalDigest(input.sourceText),
  sourceLanguage: normalizeLanguageCode(input.sourceLanguage),
  targetLanguage: normalizeLanguageCode(input.targetLanguage),
  provider: "GOOGLE_GEMINI",
  model: input.model,
  failureCategory: input.failureCategory,
  retryStatus: "NOT_RETRIED",
  occurredAt: input.occurredAt,
  projectWriteAuthorized: false,
  scientificDecisionAuthorized: false,
});

export const parseLanguageProjectionRequest = (value: unknown): LanguageProjectionRequest | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<LanguageProjectionRequest>;
  if (record.apiVersion !== "1.0.0"
    || record.operation !== "LANGUAGE_PROJECTION"
    || !["INPUT_TO_FRENCH", "OUTPUT_FROM_FRENCH"].includes(String(record.projectionKind))
    || typeof record.sourceText !== "string" || !record.sourceText.trim() || record.sourceText.length > 12_000
    || typeof record.sourceLanguageHint !== "string" || !record.sourceLanguageHint.trim()
    || typeof record.targetLanguage !== "string" || !record.targetLanguage.trim()
    || record.translationContractVersion !== LANGUAGE_PROJECTION_CONTRACT_VERSION
    || typeof record.projectionIdentityDigest !== "string" || !record.projectionIdentityDigest.trim()
    || (record.protectedOpaqueLiterals !== undefined
      && (!Array.isArray(record.protectedOpaqueLiterals)
        || !record.protectedOpaqueLiterals.every((candidate) => isProtectedOpaqueLiteral(candidate)
          && literalOccurrences(record.sourceText!, candidate.literal).length > 0)))) return null;
  return record as LanguageProjectionRequest;
};

export const LANGUAGE_PROJECTION_SYSTEM_INSTRUCTION = `Tu es la frontière de projection linguistique de NOXIA.

Ta seule mission est de détecter la langue et de traduire le texte fourni vers la langue cible.

Tu ne réalises aucune interprétation scientifique, aucune décision, aucune clarification, aucune complétion et aucune écriture Project.

Traduis naturellement la terminologie scientifique, les noms de modalités et les acronymes selon l'usage de la langue cible. Ne crée aucun équivalent sémantique absent du texte source.

Préserve strictement les nombres, unités, dates, négations, incertitudes, conditions, comparaisons, statuts connu/inconnu/retenu/non décidé, décisions humaines et références de sources. Chaque valeur fournie dans PROTECTED_OPAQUE_LITERALS_JSON est un littéral opaque : recopie-la caractère pour caractère, sans traduction ni normalisation.

N'augmente jamais la certitude. Ne transforme jamais une hypothèse ou une ambiguïté en fait. Si une ambiguïté possède plusieurs interprétations, conserve-la dans la traduction sans en choisir une.

Retourne uniquement l'appel de fonction demandé.`;

export const buildLanguageProjectionProviderPayload = (request: LanguageProjectionRequest) => ({
  systemInstruction: { parts: [{ text: LANGUAGE_PROJECTION_SYSTEM_INSTRUCTION }] },
  contents: [{ role: "user", parts: [{ text: [
    `PROJECTION_KIND=${request.projectionKind}`,
    `SOURCE_LANGUAGE_HINT=${request.sourceLanguageHint}`,
    `TARGET_LANGUAGE=${request.targetLanguage}`,
    `PROTECTED_OPAQUE_LITERALS_JSON=${JSON.stringify(resolvedProtectedOpaqueLiterals({
      sourceText: request.sourceText,
      explicit: request.protectedOpaqueLiterals,
    }).map((candidate) => candidate.literal))}`,
    "SOURCE_TEXT:",
    request.sourceText,
  ].join("\n") }] }],
  tools: [{ functionDeclarations: [{
    name: "return_language_projection",
    description: "Return the strictly linguistic projection and factual language metadata.",
    parametersJsonSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        detectedLanguage: { type: "string" },
        supportStatus: { type: "string", enum: ["SUPPORTED", "UNSUPPORTED", "UNKNOWN"] },
        qualificationStatus: { type: "string", enum: ["QUALIFIED", "PROVIDER_SUPPORTED_UNQUALIFIED", "UNKNOWN"] },
        translatedText: { type: "string", description: "Strict linguistic projection. Translate scientific language and acronyms naturally. Preserve every value listed in PROTECTED_OPAQUE_LITERALS_JSON character-for-character." },
        ambiguityPreserved: { type: "boolean" },
        limitations: { type: "array", items: { type: "string" } },
      },
      required: ["detectedLanguage", "supportStatus", "qualificationStatus", "translatedText", "ambiguityPreserved", "limitations"],
    },
  }] }],
  toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["return_language_projection"] } },
});

export const parseLanguageProjectionProviderResult = (value: unknown): LanguageProjectionProviderResult | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Partial<LanguageProjectionProviderResult>;
  if (typeof record.detectedLanguage !== "string" || !record.detectedLanguage.trim()
    || !["SUPPORTED", "UNSUPPORTED", "UNKNOWN"].includes(String(record.supportStatus))
    || !["QUALIFIED", "PROVIDER_SUPPORTED_UNQUALIFIED", "UNKNOWN"].includes(String(record.qualificationStatus))
    || typeof record.translatedText !== "string"
    || typeof record.ambiguityPreserved !== "boolean"
    || !Array.isArray(record.limitations) || !record.limitations.every((item) => typeof item === "string")) return null;
  return record as LanguageProjectionProviderResult;
};
