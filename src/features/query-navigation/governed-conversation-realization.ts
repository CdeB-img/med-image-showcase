import type { NextActionCandidate } from "./contracts.js";
import type { ProductBridgePreProjectNavigation } from "../protocol-designer/product-bridge.js";
type PreProjectNavigationAction = ProductBridgePreProjectNavigation["action"];
import { evaluateLinguisticInvariants } from "../protocol-designer/conversation-language-gateway.js";

/** A consumer projection of QRY's decision, never a second next-action owner. */
export const GOVERNED_CONVERSATION_REALIZATION_CONTRACT = "GOVERNED_CONVERSATION_REALIZATION" as const;
export const GOVERNED_CONVERSATION_REALIZATION_VERSION = "1.2.0" as const;

export type GovernedConversationInterventionKind =
  | "ASK_INFORMATION"
  | "STRUCTURE_USER_SUPPLIED_CONTENT"
  | "PRESENT_OWNER_DECISION_SUPPORT"
  | "EXPLAIN_REFERENCED_CONTENT"
  | "ACKNOWLEDGE_USER_DIRECTION"
  | "RESPOND_WITHOUT_MUTATION";

export type GovernedConversationContentSource =
  | "QUERY_NAVIGATION"
  | "USER_SUPPLIED"
  | "OWNER_RESULT"
  | "RETAINED_CANDIDATE"
  | "CURRENT_PROJECT"
  | "NONE";

export type GovernedVisibleObligation = Readonly<{
  obligationId: string;
  sourceRef: string;
  role: "OPTION_IDENTITY" | "OPTION_DISCRIMINANT" | "MATERIAL_LIMIT" | "HUMAN_DECISION_BOUNDARY" | "REFERENT_CONTENT"
    | "DECISION_TRADEOFF" | "USER_SOURCE_ATTRIBUTION" | "USER_DIRECTION_ACKNOWLEDGEMENT";
  /** Exact owner/consumer-selected fragment; the real visible span is resolved after normalization. */
  exactText: string;
}>;

export type GovernedRealizationContent = Readonly<{
  ref: string;
  text: string;
  /** Copied from the supplying owner; this adapter creates no status taxonomy. */
  status: string | null;
}>;

export type GovernedRealizationRelation = Readonly<{
  ref: string;
  sourceRef: string;
  relationType: string;
  targetRef: string;
}>;

export type GovernedConversationEnvelope = Readonly<{
  contract: typeof GOVERNED_CONVERSATION_REALIZATION_CONTRACT;
  contractVersion: typeof GOVERNED_CONVERSATION_REALIZATION_VERSION;
  responsibilityOwner: "QUERY_NAVIGATION";
  whatRef: string;
  action: PreProjectNavigationAction;
  actionCategory: NextActionCandidate["actionCategory"] | null;
  intervention: Readonly<{
    kind: GovernedConversationInterventionKind;
    contentSource: GovernedConversationContentSource;
    sourceRefs: readonly string[];
  }>;
  purpose: string;
  sourceTurnRef: string;
  projectBinding: Readonly<{ projectId: string; projectVersion: string; projectDigest: string }> | null;
  candidateRef: string | null;
  targetRefs: readonly string[];
  authorizedContent: readonly GovernedRealizationContent[];
  requiredContentRefs: readonly string[];
  requiredVisibleObligations: readonly GovernedVisibleObligation[];
  requiredRelations: readonly GovernedRealizationRelation[];
  /** Owner-selected exact invariants, not every word/dimension of the source. */
  protectedLiterals: readonly Readonly<{ ref: string; literal: string }>[];
  alreadyProvidedInformationRefs: readonly string[];
  selectedInformationNeedRef: string | null;
  scientificLimitations: readonly string[];
  humanDecisionBoundary: "NO_ADOPTION_NO_PROJECT_WRITE";
  projectWriteAuthorized: false;
}>;

type EnvelopeInput = Omit<GovernedConversationEnvelope,
  "contract" | "contractVersion" | "responsibilityOwner" | "humanDecisionBoundary" | "projectWriteAuthorized"
  | "actionCategory" | "intervention" | "candidateRef" | "requiredContentRefs" | "requiredVisibleObligations" | "requiredRelations" | "protectedLiterals"
  | "alreadyProvidedInformationRefs" | "selectedInformationNeedRef" | "scientificLimitations"> & Partial<Pick<GovernedConversationEnvelope,
    "actionCategory" | "intervention" | "candidateRef" | "requiredContentRefs" | "requiredVisibleObligations" | "requiredRelations" | "protectedLiterals"
    | "alreadyProvidedInformationRefs" | "selectedInformationNeedRef" | "scientificLimitations">>;

const strings = (value: unknown): value is string[] => Array.isArray(value)
  && value.every((item) => typeof item === "string" && item.length > 0);
const unique = (values: readonly string[]) => new Set(values).size === values.length;
const record = (value: unknown): value is Record<string, unknown> => Boolean(value)
  && typeof value === "object" && !Array.isArray(value);
const nonempty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const exactKeys = (value: Record<string, unknown>, keys: readonly string[]) => sameRefs(Object.keys(value), keys);

export const buildGovernedConversationEnvelope = (input: EnvelopeInput): GovernedConversationEnvelope => {
  if (!nonempty(input.whatRef) || !nonempty(input.purpose) || !nonempty(input.sourceTurnRef)) {
    throw new Error("GOVERNED_REALIZATION_SOURCE_IDENTITY_REQUIRED");
  }
  const contents = input.authorizedContent.map((item) => Object.freeze({ ...item }));
  const contentRefs = contents.map((item) => item.ref);
  const required = [...(input.requiredContentRefs ?? [])];
  const visibleObligations = [...(input.requiredVisibleObligations ?? [])];
  if (!unique(contentRefs) || !unique(input.targetRefs) || !unique(required)
    || contents.some((item) => !nonempty(item.ref) || !nonempty(item.text))
    || required.some((ref) => !contentRefs.includes(ref))) {
    throw new Error("GOVERNED_REALIZATION_CONTENT_IDENTITY_INVALID");
  }
  if (!unique(visibleObligations.map((item) => item.obligationId))
    || visibleObligations.some((item) => !nonempty(item.obligationId) || !nonempty(item.sourceRef) || !nonempty(item.exactText)
      || !["OPTION_IDENTITY", "OPTION_DISCRIMINANT", "MATERIAL_LIMIT", "HUMAN_DECISION_BOUNDARY", "REFERENT_CONTENT",
        "DECISION_TRADEOFF", "USER_SOURCE_ATTRIBUTION", "USER_DIRECTION_ACKNOWLEDGEMENT"].includes(item.role))) {
    throw new Error("GOVERNED_REALIZATION_VISIBLE_OBLIGATION_INVALID");
  }
  const defaultIntervention = input.action === "ASK_QUESTION"
    ? { kind: "ASK_INFORMATION" as const, contentSource: "QUERY_NAVIGATION" as const, sourceRefs: input.selectedInformationNeedRef ? [input.selectedInformationNeedRef] : [] }
    : { kind: "RESPOND_WITHOUT_MUTATION" as const, contentSource: "NONE" as const, sourceRefs: [] };
  const intervention = input.intervention ?? defaultIntervention;
  if (!unique(intervention.sourceRefs) || intervention.sourceRefs.some((ref) => !nonempty(ref))) {
    throw new Error("GOVERNED_REALIZATION_INTERVENTION_SOURCE_INVALID");
  }
  if ((input.protectedLiterals ?? []).some((item) => !nonempty(item.ref) || !nonempty(item.literal))) {
    throw new Error("GOVERNED_REALIZATION_PROTECTED_LITERAL_INVALID");
  }
  if (input.projectBinding && Object.values(input.projectBinding).some((value) => !nonempty(value))) {
    throw new Error("GOVERNED_REALIZATION_PROJECT_BINDING_INVALID");
  }
  if (input.action === "ASK_QUESTION" && (!input.selectedInformationNeedRef
    || input.alreadyProvidedInformationRefs?.includes(input.selectedInformationNeedRef))) {
    throw new Error("GOVERNED_REALIZATION_ASK_NEED_REQUIRED_AND_NOT_ALREADY_PROVIDED");
  }
  const envelope: GovernedConversationEnvelope = {
    contract: GOVERNED_CONVERSATION_REALIZATION_CONTRACT,
    contractVersion: GOVERNED_CONVERSATION_REALIZATION_VERSION,
    responsibilityOwner: "QUERY_NAVIGATION",
    whatRef: input.whatRef,
    action: input.action,
    actionCategory: input.actionCategory ?? null,
    intervention: Object.freeze({ ...intervention, sourceRefs: Object.freeze([...intervention.sourceRefs]) }),
    purpose: input.purpose,
    sourceTurnRef: input.sourceTurnRef,
    projectBinding: input.projectBinding ? Object.freeze({ ...input.projectBinding }) : null,
    candidateRef: input.candidateRef ?? null,
    targetRefs: Object.freeze([...input.targetRefs]),
    authorizedContent: Object.freeze(contents),
    requiredContentRefs: Object.freeze(required),
    requiredVisibleObligations: Object.freeze(visibleObligations.map((item) => Object.freeze({ ...item }))),
    requiredRelations: Object.freeze((input.requiredRelations ?? []).map((item) => Object.freeze({ ...item }))),
    protectedLiterals: Object.freeze((input.protectedLiterals ?? []).map((item) => Object.freeze({ ...item }))),
    alreadyProvidedInformationRefs: Object.freeze([...(input.alreadyProvidedInformationRefs ?? [])]),
    selectedInformationNeedRef: input.selectedInformationNeedRef ?? null,
    scientificLimitations: Object.freeze([...(input.scientificLimitations ?? [])]),
    humanDecisionBoundary: "NO_ADOPTION_NO_PROJECT_WRITE",
    projectWriteAuthorized: false,
  };
  return Object.freeze(envelope);
};

export type GovernedRealizationProviderClaim = Readonly<{
  whatRef: string;
  action: PreProjectNavigationAction;
  actionWitness: string;
  /** Required for source-sensitive interventions in 1.1.0; optional only to requalify immutable 1.0.0 outputs. */
  interventionKind?: GovernedConversationInterventionKind;
  contentSource?: GovernedConversationContentSource;
  targetRefs: readonly string[];
  informationNeedRefs: readonly string[];
  contentClaims: readonly Readonly<{ ref: string; witness: string; status: string | null }>[];
  relationClaims: readonly Readonly<GovernedRealizationRelation & { witness: string }>[];
  adoptionClaimed: boolean;
  projectWriteClaimed: boolean;
}>;

export type GovernedRealizationProviderOutput = Readonly<{
  assistantReply: string;
  claim: GovernedRealizationProviderClaim;
}>;

export const parseGovernedRealizationProviderOutput = (raw: unknown): GovernedRealizationProviderOutput | null => {
  let value = raw;
  if (typeof raw === "string") {
    try { value = JSON.parse(raw); } catch { return null; }
  }
  if (!record(value) || !nonempty(value.assistantReply) || !record(value.claim)) return null;
  const claim = value.claim;
  const legacyClaimKeys = ["whatRef", "action", "actionWitness", "targetRefs",
    "informationNeedRefs", "contentClaims", "relationClaims", "adoptionClaimed", "projectWriteClaimed"] as const;
  const currentClaimKeys = [...legacyClaimKeys, "interventionKind", "contentSource"] as const;
  if (!exactKeys(value, ["assistantReply", "claim"])
    || (!exactKeys(claim, legacyClaimKeys) && !exactKeys(claim, currentClaimKeys))) return null;
  if (!nonempty(claim.whatRef) || !nonempty(claim.actionWitness) || !["ASK_QUESTION", "PROPOSE", "RESPOND"].includes(String(claim.action))
    || !strings(claim.targetRefs) || !strings(claim.informationNeedRefs)
    || typeof claim.adoptionClaimed !== "boolean" || typeof claim.projectWriteClaimed !== "boolean"
    || !Array.isArray(claim.contentClaims) || !Array.isArray(claim.relationClaims)) return null;
  if (("interventionKind" in claim || "contentSource" in claim)
    && (!currentClaimKeys.every((key) => key in claim)
      || !["ASK_INFORMATION", "STRUCTURE_USER_SUPPLIED_CONTENT", "PRESENT_OWNER_DECISION_SUPPORT", "EXPLAIN_REFERENCED_CONTENT", "ACKNOWLEDGE_USER_DIRECTION", "RESPOND_WITHOUT_MUTATION"].includes(String(claim.interventionKind))
      || !["QUERY_NAVIGATION", "USER_SUPPLIED", "OWNER_RESULT", "RETAINED_CANDIDATE", "CURRENT_PROJECT", "NONE"].includes(String(claim.contentSource)))) return null;
  if (!claim.contentClaims.every((item) => record(item) && exactKeys(item, ["ref", "witness", "status"])
    && nonempty(item.ref) && nonempty(item.witness)
    && (item.status === null || nonempty(item.status)))) return null;
  if (!claim.relationClaims.every((item) => record(item)
    && exactKeys(item, ["ref", "sourceRef", "relationType", "targetRef", "witness"])
    && ["ref", "sourceRef", "relationType", "targetRef", "witness"]
    .every((key) => nonempty(item[key])))) return null;
  return value as unknown as GovernedRealizationProviderOutput;
};

const sameRefs = (left: readonly string[], right: readonly string[]) => unique(left)
  && unique(right) && left.length === right.length && left.every((ref) => right.includes(ref));

export type GovernedVisibleSpan = Readonly<{
  start: number;
  end: number;
  exactText: string;
}>;

type NormalizedVisibleText = Readonly<{
  value: string;
  starts: readonly number[];
  ends: readonly number[];
}>;

/** NFKC + case fold + controlled apostrophe/space normalization, with a map back to the exact visible span. */
const normalizedVisibleText = (source: string): NormalizedVisibleText => {
  const value: string[] = [];
  const starts: number[] = [];
  const ends: number[] = [];
  const clusters = [...source.matchAll(/\P{M}\p{M}*|\p{M}+/gu)];
  for (const match of clusters) {
    const original = match[0];
    const start = match.index;
    const end = start + original.length;
    const normalized = original.normalize("NFKC").replace(/[\u2018\u2019\u02bc\uff07]/gu, "'")
      .toLocaleLowerCase("fr-FR");
    for (const character of normalized) {
      const isSpace = /\s/u.test(character);
      if (isSpace) {
        if (!value.length || value.at(-1) === " ") {
          if (value.at(-1) === " ") ends[ends.length - 1] = end;
          continue;
        }
        value.push(" "); starts.push(start); ends.push(end);
        continue;
      }
      for (let index = 0; index < character.length; index += 1) {
        value.push(character[index]); starts.push(start); ends.push(end);
      }
    }
  }
  if (value.at(-1) === " ") { value.pop(); starts.pop(); ends.pop(); }
  return { value: value.join(""), starts, ends };
};

const normalizedVisibleSpan = (visibleText: string, witness: string): GovernedVisibleSpan | null => {
  if (!nonempty(witness)) return null;
  const visible = normalizedVisibleText(visibleText);
  const normalizedWitness = normalizedVisibleText(witness).value;
  if (!normalizedWitness) return null;
  const offset = visible.value.indexOf(normalizedWitness);
  if (offset < 0) return null;
  const start = visible.starts[offset];
  const end = visible.ends[offset + normalizedWitness.length - 1];
  return start === undefined || end === undefined ? null : Object.freeze({ start, end, exactText: visibleText.slice(start, end) });
};

/** Checks the exact literal with token boundaries; it does not infer quantities from prose. */
const containsProtectedLiteral = (text: string, literal: string) => {
  let offset = text.indexOf(literal);
  while (offset >= 0) {
    const before = text.charAt(offset - 1);
    const after = text.slice(offset + literal.length, offset + literal.length + 1);
    if (!/[\p{L}\p{N}_]/u.test(before) && !/[\p{L}\p{N}_]/u.test(after)) return true;
    offset = text.indexOf(literal, offset + 1);
  }
  return false;
};

const escapePattern = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

/** Reuses RC04's measured-unit detector, never an isolated-symbol/domain dictionary. */
const measuredQuantitySurfaces = (text: string): string[] => {
  const units = evaluateLinguisticInvariants(text, text, [])
    .find((item) => item.invariant === "UNITS")?.sourceEvidence ?? [];
  if (!units.length) return [];
  const choices = [...new Set(units)].sort((left, right) => right.length - left.length).map(escapePattern).join("|");
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}_])(\\d+(?:[.,]\\d+)?)\\s*(${choices})(?![\\p{L}\\p{N}_])`, "gu");
  return [...text.matchAll(pattern)].map((match) => `${Number(match[1].replace(",", "."))}:${match[2]}`);
};

/** Bounded forbidden claims, not a classifier of meaning or the scientific speech act. */
const UNAUTHORIZED_WRITE_DECLARATION = /\b(?:j['’]ai\s+(?:adopté|enregistré|modifié|créé)\s+(?:le|votre)\s+(?:projet|étude)|(?:le|votre)\s+(?:projet|étude)\s+(?:est|a été)\s+(?:adopté|enregistré|modifié|créé))(?=$|[^\p{L}])/iu;

/** Closed evidence grammar for the actor/source relation, never general semantic similarity. */
const USER_SOURCE_ATTRIBUTION_SURFACE = /\b(?:vous\s+(?:avez\s+)?(?:formul(?:ez|é|ée|és|ées)|propos(?:ez|é|ée|és|ées)|indiqu(?:ez|é|ée|és|ées)|demand(?:ez|é|ée|és|ées))|votr(?:e|es)\s+(?:formulation|correction|proposition|demande|éléments?|objectifs?))\b/iu;

/** Surface articulation only; this is not proof that the explanation is scientifically correct. */
const EXPLANATION_ARTICULATION_SURFACE = /\b(?:différ\p{L}*|distinct\p{L}*|premier\p{L}*|second\p{L}*|chacun\p{L}*|respectiv\p{L}*|tandis\s+que|alors\s+que|d['’]une\s+part|d['’]autre\s+part|l['’]un|l['’]autre)\b/iu;
const UNSUPPORTED_HISTORICAL_EXPLANATION = /\bfinalités?\s+méthodologiques?\s+et\s+opérationnelles?\b/iu;

const INTERNAL_STANDARD_TERMINOLOGY = /(?:\b(?:owner|Owner|OWNER)\b|\bQRY\b|\bProject\b|\bcandidateRef\b|\bsourceRef\b|\b(?:validator|Validator)\b|\bTRACE\b|\bGOVERNED_CONVERSATION_REALIZATION\b|\b(?:qry-action|study-design-(?:option|proposal|tradeoff)):[\w:-]+\b)/u;

const overlaps = (left: GovernedVisibleSpan, right: GovernedVisibleSpan) => left.start < right.end && right.start < left.end;
const containedBy = (inner: GovernedVisibleSpan, outer: GovernedVisibleSpan) => inner.start >= outer.start && inner.end <= outer.end;

const interrogativeSentence = (text: string): GovernedVisibleSpan | null => {
  const marks = [...text.matchAll(/\?/gu)];
  if (marks.length !== 1 || !text.trimEnd().endsWith("?")) return null;
  const end = marks[0].index + 1;
  const preceding = text.slice(0, marks[0].index);
  const boundary = Math.max(preceding.lastIndexOf("."), preceding.lastIndexOf("!"), preceding.lastIndexOf("\n"));
  let start = boundary + 1;
  while (start < end && /\s/u.test(text[start])) start += 1;
  return Object.freeze({ start, end, exactText: text.slice(start, end) });
};

export type GovernedRealizationConformance = Readonly<{
  structuralStatus: "PASS" | "FAIL" | "UNKNOWN";
  actionConformance: "PASS" | "FAIL" | "UNKNOWN";
  actionEvidenceBasis: "PROVIDER_STRUCTURED_CLAIM_NOT_SEMANTIC_PROOF" | "NOT_AVAILABLE";
  visibleTextFidelity: "UNKNOWN";
  structuredRefCoverage: "CONTRACT_EVIDENCE_NOT_SEMANTIC_ORACLE";
  diagnostics: readonly string[];
  actionWitnessSpan: GovernedVisibleSpan | null;
  contentWitnessSpans: readonly Readonly<{ ref: string; span: GovernedVisibleSpan }>[];
  visibleObligationSpans: readonly Readonly<{ obligationId: string; span: GovernedVisibleSpan }>[];
  representedContentRefs: readonly string[];
  missingRequiredContentRefs: readonly string[];
  projectWriteAuthorized: false;
}>;

export const validateGovernedConversationRealization = (input: {
  envelope: GovernedConversationEnvelope;
  assistantReply: string;
  claim?: GovernedRealizationProviderClaim | null;
  requireProviderClaim?: boolean;
}): GovernedRealizationConformance => {
  const { envelope, assistantReply: text, claim } = input;
  const diagnostics: string[] = [];
  const actionFailures: string[] = [];
  let actionWitnessSpan: GovernedVisibleSpan | null = null;
  const contentWitnessSpans: { ref: string; span: GovernedVisibleSpan }[] = [];
  const visibleObligationSpans: { obligationId: string; span: GovernedVisibleSpan }[] = [];
  if (!nonempty(text)) diagnostics.push("EMPTY_REALIZATION");
  if (input.requireProviderClaim && !claim) diagnostics.push("STRUCTURED_REALIZATION_CLAIM_REQUIRED");
  if (UNAUTHORIZED_WRITE_DECLARATION.test(text)) diagnostics.push("UNAUTHORIZED_PROJECT_WRITE_DECLARATION");
  const sourceTurnContent = envelope.authorizedContent.find((item) => item.ref === envelope.sourceTurnRef)?.text;
  if (envelope.action === "RESPOND" && sourceTurnContent
    && normalizedVisibleText(text).value === normalizedVisibleText(sourceTurnContent).value) {
    diagnostics.push("EXACT_SOURCE_TURN_ECHO_AS_ASSISTANT_RESPONSE");
  }
  // These are bounded observable surface constraints, not proof of naturalness or scientific value.
  const questionMarks = [...text.matchAll(/\?/gu)].length;
  const questionSentence = envelope.action === "ASK_QUESTION" ? interrogativeSentence(text) : null;
  if (envelope.action === "ASK_QUESTION") {
    if (!questionSentence) actionFailures.push(questionMarks > 1
      ? "MULTIPLE_INTERROGATIVE_SURFACES_NOT_AUTHORIZED" : "ASK_INTERROGATIVE_SURFACE_MISSING");
  } else if (questionMarks) actionFailures.push("UNAUTHORIZED_INTERROGATIVE_SURFACE");
  if (envelope.intervention.kind === "PRESENT_OWNER_DECISION_SUPPORT" && INTERNAL_STANDARD_TERMINOLOGY.test(text)) {
    diagnostics.push("INTERNAL_PRODUCT_TERMINOLOGY_VISIBLE");
  }
  for (const item of envelope.protectedLiterals) {
    if (!containsProtectedLiteral(text, item.literal)) diagnostics.push(`REQUIRED_PROTECTED_LITERAL_MISSING:${item.ref}`);
  }
  for (const obligation of envelope.requiredVisibleObligations) {
    const span = normalizedVisibleSpan(text, obligation.exactText);
    if (!span) diagnostics.push(`REQUIRED_VISIBLE_OBLIGATION_MISSING:${obligation.obligationId}`);
    else visibleObligationSpans.push({ obligationId: obligation.obligationId, span });
  }
  const allowedQuantities = new Set(measuredQuantitySurfaces([
    ...envelope.authorizedContent.map((item) => item.text),
    ...envelope.protectedLiterals.map((item) => item.literal),
  ].join("\n")));
  for (const quantity of new Set(measuredQuantitySurfaces(text))) {
    if (!allowedQuantities.has(quantity)) diagnostics.push(`UNAUTHORIZED_QUANTITY_SURFACE:${quantity}`);
  }
  const represented: string[] = [];
  if (claim) {
    if (claim.whatRef !== envelope.whatRef) diagnostics.push("WHAT_REFERENCE_MISMATCH");
    if (claim.action !== envelope.action) actionFailures.push("ACTION_CLAIM_MISMATCH");
    actionWitnessSpan = normalizedVisibleSpan(text, claim.actionWitness);
    if (!actionWitnessSpan) actionFailures.push("ACTION_WITNESS_NOT_IN_VISIBLE_TEXT");
    const sourceSensitive = ["STRUCTURE_USER_SUPPLIED_CONTENT", "PRESENT_OWNER_DECISION_SUPPORT",
      "EXPLAIN_REFERENCED_CONTENT", "ACKNOWLEDGE_USER_DIRECTION"].includes(envelope.intervention.kind);
    if (sourceSensitive && (!claim.interventionKind || !claim.contentSource)) {
      diagnostics.push("INTERVENTION_SEMANTICS_CLAIM_REQUIRED");
    } else if (claim.interventionKind && claim.interventionKind !== envelope.intervention.kind) {
      diagnostics.push("INTERVENTION_KIND_MISMATCH");
    } else if (claim.contentSource && claim.contentSource !== envelope.intervention.contentSource) {
      diagnostics.push("CONTENT_SOURCE_MISMATCH");
    }
    if (!sameRefs(claim.targetRefs, envelope.targetRefs)) diagnostics.push("TARGET_REFERENCE_MISMATCH");
    if (claim.adoptionClaimed || claim.projectWriteClaimed) diagnostics.push("UNAUTHORIZED_ADOPTION_OR_WRITE_CLAIM");
    const expectedNeed = envelope.selectedInformationNeedRef ? [envelope.selectedInformationNeedRef] : [];
    if (!sameRefs(claim.informationNeedRefs, expectedNeed)) diagnostics.push("INFORMATION_NEED_REFERENCE_MISMATCH");
    if (claim.informationNeedRefs.some((ref) => envelope.alreadyProvidedInformationRefs.includes(ref))) {
      diagnostics.push("ALREADY_PROVIDED_INFORMATION_REASKED");
    }
    if (!unique(claim.contentClaims.map((item) => item.ref))) diagnostics.push("DUPLICATE_CONTENT_CLAIM");
    for (const item of claim.contentClaims) {
      const authorized = envelope.authorizedContent.find((content) => content.ref === item.ref);
      if (!authorized) { diagnostics.push(`UNAUTHORIZED_CONTENT_REFERENCE:${item.ref}`); continue; }
      const span = normalizedVisibleSpan(text, item.witness);
      if (!span) {
        diagnostics.push(`CONTENT_WITNESS_NOT_IN_VISIBLE_TEXT:${item.ref}`); continue;
      }
      if (item.status !== authorized.status) diagnostics.push(`STRUCTURED_STATUS_MISMATCH:${item.ref}`);
      represented.push(item.ref);
      contentWitnessSpans.push({ ref: item.ref, span });
    }
    if (!unique(claim.relationClaims.map((item) => item.ref))) diagnostics.push("DUPLICATE_RELATION_CLAIM");
    for (const item of claim.relationClaims) {
      const relation = envelope.requiredRelations.find((entry) => entry.ref === item.ref);
      if (!relation) { diagnostics.push(`UNAUTHORIZED_RELATION_REFERENCE:${item.ref}`); continue; }
      if (item.sourceRef !== relation.sourceRef || item.relationType !== relation.relationType
        || item.targetRef !== relation.targetRef) diagnostics.push(`STRUCTURED_RELATION_MISMATCH:${item.ref}`);
      if (!normalizedVisibleSpan(text, item.witness)) diagnostics.push(`RELATION_WITNESS_NOT_IN_VISIBLE_TEXT:${item.ref}`);
    }
    for (const relation of envelope.requiredRelations) {
      if (!claim.relationClaims.some((item) => item.ref === relation.ref)) diagnostics.push(`REQUIRED_RELATION_CLAIM_MISSING:${relation.ref}`);
    }
  }
  const missing = claim ? envelope.requiredContentRefs.filter((ref) => !represented.includes(ref)) : [];
  if (claim && envelope.intervention.kind === "ASK_INFORMATION" && questionSentence) {
    if (!actionWitnessSpan || !containedBy(actionWitnessSpan, questionSentence)) {
      actionFailures.push("ACTION_WITNESS_OUTSIDE_INTERROGATIVE_SENTENCE");
    }
    const targetVisibleInQuestion = contentWitnessSpans.some((item) => envelope.targetRefs.includes(item.ref)
      && containedBy(item.span, questionSentence));
    if (!targetVisibleInQuestion) actionFailures.push("ASK_TARGET_NOT_VISIBLE_IN_INTERROGATIVE_SENTENCE");
  }
  if (claim && envelope.intervention.kind === "EXPLAIN_REFERENCED_CONTENT") {
    const witness = actionWitnessSpan?.exactText ?? "";
    const separateFromReferents = actionWitnessSpan
      ? contentWitnessSpans.every((item) => !overlaps(actionWitnessSpan!, item.span)) : false;
    if (!separateFromReferents || !EXPLANATION_ARTICULATION_SURFACE.test(witness)) {
      actionFailures.push("EXPLANATION_NOT_REALIZED");
    }
    if (UNSUPPORTED_HISTORICAL_EXPLANATION.test(witness)
      && !envelope.authorizedContent.some((item) => UNSUPPORTED_HISTORICAL_EXPLANATION.test(item.text))) {
      diagnostics.push("UNSUPPORTED_EXPLANATORY_CONTENT");
    }
  }
  if (claim && envelope.intervention.kind === "STRUCTURE_USER_SUPPLIED_CONTENT") {
    const witness = actionWitnessSpan?.exactText ?? "";
    if (claim.contentSource !== "USER_SUPPLIED" || !USER_SOURCE_ATTRIBUTION_SURFACE.test(witness)) {
      diagnostics.push("USER_SOURCE_ATTRIBUTION_SURFACE_MISSING");
    }
  }
  diagnostics.push(...missing.map((ref) => `REQUIRED_CONTENT_CLAIM_MISSING:${ref}`), ...actionFailures);
  return Object.freeze({
    structuralStatus: diagnostics.length ? "FAIL" : claim ? "PASS" : "UNKNOWN",
    actionConformance: actionFailures.length ? "FAIL" : claim ? "PASS" : "UNKNOWN",
    actionEvidenceBasis: claim ? "PROVIDER_STRUCTURED_CLAIM_NOT_SEMANTIC_PROOF" : "NOT_AVAILABLE",
    visibleTextFidelity: "UNKNOWN",
    structuredRefCoverage: "CONTRACT_EVIDENCE_NOT_SEMANTIC_ORACLE",
    diagnostics: Object.freeze(diagnostics),
    actionWitnessSpan,
    contentWitnessSpans: Object.freeze(contentWitnessSpans),
    visibleObligationSpans: Object.freeze(visibleObligationSpans),
    representedContentRefs: Object.freeze([...new Set(represented)]),
    missingRequiredContentRefs: Object.freeze(missing),
    projectWriteAuthorized: false,
  });
};

const sentence = (value: string) => {
  const trimmed = value.trim().replace(/[.!?]+$/u, "");
  return trimmed ? `${trimmed}.` : "";
};

const lowerInitial = (value: string) => value ? `${value[0].toLocaleLowerCase("fr-FR")}${value.slice(1)}` : value;

/** Deterministic realization of the same envelope; it selects no option and creates no scientific content. */
export const buildGovernedConversationLocalFallback = (envelope: GovernedConversationEnvelope): string | null => {
  if (envelope.intervention.kind === "ASK_INFORMATION") {
    const target = envelope.authorizedContent.find((item) => envelope.targetRefs.includes(item.ref))?.text.trim()
      ?? envelope.authorizedContent.find((item) => envelope.requiredContentRefs.includes(item.ref))?.text.trim()
      ?? envelope.authorizedContent[0]?.text.trim();
    if (!target) return null;
    if (target.endsWith("?") && [...target.matchAll(/\?/gu)].length === 1) return target;
    return `Pouvez-vous ${lowerInitial(target.replace(/[.!?]+$/u, ""))} ?`;
  }
  if (envelope.intervention.kind !== "PRESENT_OWNER_DECISION_SUPPORT") return null;
  const obligations = envelope.requiredVisibleObligations;
  const identities = obligations.filter((item) => item.role === "OPTION_IDENTITY");
  if (identities.length < 2) return null;
  const optionLines = identities.map((identity) => {
    const discriminant = obligations.find((item) => item.role === "OPTION_DISCRIMINANT" && item.sourceRef === identity.sourceRef);
    const limit = obligations.find((item) => item.role === "MATERIAL_LIMIT" && item.sourceRef === identity.sourceRef);
    if (!discriminant || !limit) return null;
    return `- ${identity.exactText} — ${sentence(discriminant.exactText)} Limite principale : ${sentence(limit.exactText)}`;
  });
  if (optionLines.some((line) => !line)) return null;
  const optionRefs = new Set(identities.map((item) => item.sourceRef));
  const tradeOff = obligations.find((item) => item.role === "DECISION_TRADEOFF")?.exactText;
  const globalLimits = obligations.filter((item) => item.role === "MATERIAL_LIMIT" && !optionRefs.has(item.sourceRef));
  const humanBoundary = obligations.find((item) => item.role === "HUMAN_DECISION_BOUNDARY")?.exactText;
  if (!humanBoundary) return null;
  return [
    `${identities.length === 2 ? "Deux" : identities.length === 3 ? "Trois" : identities.length} options restent possibles :`,
    ...optionLines as string[],
    tradeOff ? sentence(tradeOff) : "",
    ...globalLimits.map((item) => sentence(item.exactText)),
    humanBoundary,
  ].filter(Boolean).join("\n");
};

/** No source/candidate dump: the caller supplies a governed local formulation of WHAT. */
export const realizeGovernedConversation = (input: {
  envelope: GovernedConversationEnvelope;
  providerReply?: string | null;
  providerClaim?: GovernedRealizationProviderClaim | null;
  requireProviderClaim?: boolean;
  localWhatText?: string | null;
}) => {
  const reply = input.providerReply?.trim() ?? "";
  const conformance = validateGovernedConversationRealization({
    envelope: input.envelope, assistantReply: reply, claim: input.providerClaim,
    requireProviderClaim: input.requireProviderClaim,
  });
  if (reply && conformance.structuralStatus !== "FAIL") return Object.freeze({
    assistantReply: reply,
    providerReplyAccepted: true,
    executor: "GEMINI_CONVERSATION_MODEL" as const,
    fallbackUsed: false,
    conformance,
    providerCallsPerformedByRealizer: 0 as const,
    projectWriteAuthorized: false as const,
  });
  const localText = input.localWhatText?.trim();
  const localSafe = localText && validateGovernedConversationRealization({
    envelope: input.envelope, assistantReply: localText,
  }).structuralStatus !== "FAIL";
  return Object.freeze({
    assistantReply: localSafe ? localText : "La formulation de cette étape n’a pas abouti. Aucune décision ni modification du projet n’a été effectuée.",
    providerReplyAccepted: false,
    executor: "LOCAL_DETERMINISTIC_REALIZATION" as const,
    fallbackUsed: true,
    fallbackReason: conformance.diagnostics[0] ?? "PROVIDER_REALIZATION_NOT_AVAILABLE",
    conformance,
    providerCallsPerformedByRealizer: 0 as const,
    projectWriteAuthorized: false as const,
  });
};

export const GOVERNED_REALIZATION_SYSTEM_INSTRUCTION = `Tu réalises uniquement le WHAT décidé par QUERY_NAVIGATION et contenu dans l’enveloppe fournie. Tu ne sélectionnes aucune question, option, relation ou conclusion supplémentaire. Respecte intervention.kind et intervention.contentSource : lorsqu’un contenu vient de USER_SUPPLIED, attribue-le explicitement à l’utilisateur dans actionWitness et ne le présente pas comme une option scientifique inventée par NOXIA ; NOXIA peut seulement proposer sa structuration ou sa présentation pour revue. Lorsqu’il vient de RETAINED_CANDIDATE, conserve l’identité exacte des référents. Lorsqu’il vient de OWNER_RESULT, présente les options comme des propositions à examiner, sans employer de label technique tel que owner, QRY, Project, candidateRef, sourceRef, validator ou TRACE, et sans sélectionner de gagnant. Une correction ou un refus reçoit un accusé de réception ; ne répète jamais l’instruction utilisateur à la première personne comme réponse de NOXIA.
Pour ASK_INFORMATION, assistantReply contient exactement une question principale et se termine par « ? » ; actionWitness et le witness de la cible demandée appartiennent à cette phrase interrogative. Pour EXPLAIN_REFERENCED_CONTENT, rends d’abord les référents exigés visibles puis utilise actionWitness pour une clause distincte qui articule leur différence ; une simple réénumération ne constitue pas une explication. N’ajoute aucune justification scientifique absente des contenus autorisés. Pour PRESENT_OWNER_DECISION_SUPPORT, rends visibles les facettes requises — identités, discriminants, limites, compromis et frontière humaine — sans réciter les objets de contrôle internes.
Chaque requiredVisibleObligation doit apparaître dans assistantReply avec son exactText, modulo casse, espaces, Unicode NFKC et apostrophes typographiques. Ces fragments peuvent être intégrés dans une prose naturelle. Le contenu de contrôle QRY qui n’est pas une obligation visible ne doit pas être récité. Préserve les statuts, limites, quantités et littéraux requis. Aucune adoption, écriture Project ou décision humaine implicite. Les informations déjà fournies ne doivent pas être redemandées. Formule naturellement et brièvement en français.
Retourne l’objet JSON demandé : assistantReply est la seule prose visible ; claim déclare l’action, interventionKind, contentSource et les références réalisées avec un witness verbatim dans cette prose. actionWitness est le passage qui réalise l’intervention, pas seulement une mention du sujet. Pour STRUCTURE_USER_SUPPLIED_CONTENT, actionWitness doit porter l’attribution visible à l’utilisateur. Pour EXPLAIN_REFERENCED_CONTENT, actionWitness doit viser uniquement la clause d’articulation, distincte des witnesses de contenu. Ces claims et leurs spans ancrés sont des preuves structurelles, jamais une preuve d’équivalence sémantique générale. Ne crée aucun statut ou relation. Pour chaque contentClaim, copie exactement le status autorisé, y compris null. Si une réalisation n’est pas possible, n’invente pas de contenu pour compléter les champs.`;

const relationProperties = {
  ref: { type: "string" }, sourceRef: { type: "string" }, relationType: { type: "string" },
  targetRef: { type: "string" }, witness: { type: "string" },
} as const;

/** One small Gemini output schema under the existing conversation provider adapter. */
export const GOVERNED_REALIZATION_JSON_SCHEMA = {
  type: "object", additionalProperties: false, required: ["assistantReply", "claim"],
  properties: {
    assistantReply: { type: "string" },
    claim: {
      type: "object", additionalProperties: false,
      required: ["whatRef", "action", "actionWitness", "interventionKind", "contentSource", "targetRefs", "informationNeedRefs", "contentClaims", "relationClaims", "adoptionClaimed", "projectWriteClaimed"],
      properties: {
        whatRef: { type: "string" }, action: { type: "string", enum: ["ASK_QUESTION", "PROPOSE", "RESPOND"] },
        actionWitness: { type: "string" },
        interventionKind: { type: "string", enum: ["ASK_INFORMATION", "STRUCTURE_USER_SUPPLIED_CONTENT", "PRESENT_OWNER_DECISION_SUPPORT", "EXPLAIN_REFERENCED_CONTENT", "ACKNOWLEDGE_USER_DIRECTION", "RESPOND_WITHOUT_MUTATION"] },
        contentSource: { type: "string", enum: ["QUERY_NAVIGATION", "USER_SUPPLIED", "OWNER_RESULT", "RETAINED_CANDIDATE", "CURRENT_PROJECT", "NONE"] },
        targetRefs: { type: "array", items: { type: "string" } },
        informationNeedRefs: { type: "array", items: { type: "string" } },
        contentClaims: {
          type: "array", items: {
            type: "object", additionalProperties: false, required: ["ref", "witness", "status"],
            properties: { ref: { type: "string" }, witness: { type: "string" }, status: { type: ["string", "null"] } },
          },
        },
        relationClaims: {
          type: "array", items: {
            type: "object", additionalProperties: false,
            required: ["ref", "sourceRef", "relationType", "targetRef", "witness"], properties: relationProperties,
          },
        },
        adoptionClaimed: { type: "boolean" }, projectWriteClaimed: { type: "boolean" },
      },
    },
  },
} as const;

export const buildGovernedConversationProviderPayload = (envelope: GovernedConversationEnvelope) => ({
  systemInstruction: { parts: [{ text: GOVERNED_REALIZATION_SYSTEM_INSTRUCTION }] },
  contents: [{ role: "user", parts: [{ text: JSON.stringify(envelope) }] }],
  generationConfig: { responseMimeType: "application/json", responseJsonSchema: GOVERNED_REALIZATION_JSON_SCHEMA },
});
