import type { NextActionCandidate } from "./contracts.js";
import type { ProductBridgePreProjectNavigation } from "../protocol-designer/product-bridge.js";
type PreProjectNavigationAction = ProductBridgePreProjectNavigation["action"];
import { evaluateLinguisticInvariants } from "../protocol-designer/conversation-language-gateway.js";

/** A consumer projection of QRY's decision, never a second next-action owner. */
export const GOVERNED_CONVERSATION_REALIZATION_CONTRACT = "GOVERNED_CONVERSATION_REALIZATION" as const;
export const GOVERNED_CONVERSATION_REALIZATION_VERSION = "1.0.0" as const;

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
  purpose: string;
  sourceTurnRef: string;
  projectBinding: Readonly<{ projectId: string; projectVersion: string; projectDigest: string }> | null;
  candidateRef: string | null;
  targetRefs: readonly string[];
  authorizedContent: readonly GovernedRealizationContent[];
  requiredContentRefs: readonly string[];
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
  | "actionCategory" | "candidateRef" | "requiredContentRefs" | "requiredRelations" | "protectedLiterals"
  | "alreadyProvidedInformationRefs" | "selectedInformationNeedRef" | "scientificLimitations"> & Partial<Pick<GovernedConversationEnvelope,
    "actionCategory" | "candidateRef" | "requiredContentRefs" | "requiredRelations" | "protectedLiterals"
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
  if (!unique(contentRefs) || !unique(input.targetRefs) || !unique(required)
    || contents.some((item) => !nonempty(item.ref) || !nonempty(item.text))
    || required.some((ref) => !contentRefs.includes(ref))) {
    throw new Error("GOVERNED_REALIZATION_CONTENT_IDENTITY_INVALID");
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
    purpose: input.purpose,
    sourceTurnRef: input.sourceTurnRef,
    projectBinding: input.projectBinding ? Object.freeze({ ...input.projectBinding }) : null,
    candidateRef: input.candidateRef ?? null,
    targetRefs: Object.freeze([...input.targetRefs]),
    authorizedContent: Object.freeze(contents),
    requiredContentRefs: Object.freeze(required),
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
  if (!exactKeys(value, ["assistantReply", "claim"]) || !exactKeys(claim, ["whatRef", "action", "actionWitness", "targetRefs",
    "informationNeedRefs", "contentClaims", "relationClaims", "adoptionClaimed", "projectWriteClaimed"])) return null;
  if (!nonempty(claim.whatRef) || !nonempty(claim.actionWitness) || !["ASK_QUESTION", "PROPOSE", "RESPOND"].includes(String(claim.action))
    || !strings(claim.targetRefs) || !strings(claim.informationNeedRefs)
    || typeof claim.adoptionClaimed !== "boolean" || typeof claim.projectWriteClaimed !== "boolean"
    || !Array.isArray(claim.contentClaims) || !Array.isArray(claim.relationClaims)) return null;
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

export type GovernedRealizationConformance = Readonly<{
  structuralStatus: "PASS" | "FAIL" | "UNKNOWN";
  actionConformance: "PASS" | "FAIL" | "UNKNOWN";
  actionEvidenceBasis: "PROVIDER_STRUCTURED_CLAIM_NOT_SEMANTIC_PROOF" | "NOT_AVAILABLE";
  visibleTextFidelity: "UNKNOWN";
  structuredRefCoverage: "CONTRACT_EVIDENCE_NOT_SEMANTIC_ORACLE";
  diagnostics: readonly string[];
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
  if (!nonempty(text)) diagnostics.push("EMPTY_REALIZATION");
  if (input.requireProviderClaim && !claim) diagnostics.push("STRUCTURED_REALIZATION_CLAIM_REQUIRED");
  if (UNAUTHORIZED_WRITE_DECLARATION.test(text)) diagnostics.push("UNAUTHORIZED_PROJECT_WRITE_DECLARATION");
  // A question mark is an observable surface constraint, not proof that an ASK was realized.
  if (envelope.action !== "ASK_QUESTION" && text.includes("?")) actionFailures.push("UNAUTHORIZED_INTERROGATIVE_SURFACE");
  for (const item of envelope.protectedLiterals) {
    if (!containsProtectedLiteral(text, item.literal)) diagnostics.push(`REQUIRED_PROTECTED_LITERAL_MISSING:${item.ref}`);
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
    if (!nonempty(claim.actionWitness) || !text.includes(claim.actionWitness)) actionFailures.push("ACTION_WITNESS_NOT_IN_VISIBLE_TEXT");
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
      if (!nonempty(item.witness) || !text.includes(item.witness)) {
        diagnostics.push(`CONTENT_WITNESS_NOT_IN_VISIBLE_TEXT:${item.ref}`); continue;
      }
      if (item.status !== authorized.status) diagnostics.push(`STRUCTURED_STATUS_MISMATCH:${item.ref}`);
      represented.push(item.ref);
    }
    if (!unique(claim.relationClaims.map((item) => item.ref))) diagnostics.push("DUPLICATE_RELATION_CLAIM");
    for (const item of claim.relationClaims) {
      const relation = envelope.requiredRelations.find((entry) => entry.ref === item.ref);
      if (!relation) { diagnostics.push(`UNAUTHORIZED_RELATION_REFERENCE:${item.ref}`); continue; }
      if (item.sourceRef !== relation.sourceRef || item.relationType !== relation.relationType
        || item.targetRef !== relation.targetRef) diagnostics.push(`STRUCTURED_RELATION_MISMATCH:${item.ref}`);
      if (!nonempty(item.witness) || !text.includes(item.witness)) diagnostics.push(`RELATION_WITNESS_NOT_IN_VISIBLE_TEXT:${item.ref}`);
    }
    for (const relation of envelope.requiredRelations) {
      if (!claim.relationClaims.some((item) => item.ref === relation.ref)) diagnostics.push(`REQUIRED_RELATION_CLAIM_MISSING:${relation.ref}`);
    }
  }
  const missing = claim ? envelope.requiredContentRefs.filter((ref) => !represented.includes(ref)) : [];
  diagnostics.push(...missing.map((ref) => `REQUIRED_CONTENT_CLAIM_MISSING:${ref}`), ...actionFailures);
  return Object.freeze({
    structuralStatus: diagnostics.length ? "FAIL" : claim ? "PASS" : "UNKNOWN",
    actionConformance: actionFailures.length ? "FAIL" : claim ? "PASS" : "UNKNOWN",
    actionEvidenceBasis: claim ? "PROVIDER_STRUCTURED_CLAIM_NOT_SEMANTIC_PROOF" : "NOT_AVAILABLE",
    visibleTextFidelity: "UNKNOWN",
    structuredRefCoverage: "CONTRACT_EVIDENCE_NOT_SEMANTIC_ORACLE",
    diagnostics: Object.freeze(diagnostics),
    representedContentRefs: Object.freeze([...new Set(represented)]),
    missingRequiredContentRefs: Object.freeze(missing),
    projectWriteAuthorized: false,
  });
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

export const GOVERNED_REALIZATION_SYSTEM_INSTRUCTION = `Tu réalises uniquement le WHAT décidé par QUERY_NAVIGATION et contenu dans l’enveloppe fournie. Tu ne sélectionnes aucune question, option, relation ou conclusion supplémentaire. La réponse visible ne récite pas la candidate : seulement l’action sélectionnée et son contexte minimum nécessaire. Préserve les statuts, limites, quantités et littéraux requis. Aucune adoption, écriture Project ou décision humaine implicite. Les informations déjà fournies ne doivent pas être redemandées. Formule naturellement et brièvement en français.
Retourne l’objet JSON demandé : assistantReply est la seule prose visible ; claim déclare l’action et les références réalisées avec un witness verbatim dans cette prose. actionWitness est le passage qui réalise l’intervention, pas seulement une mention du sujet. Ces claims ne sont pas une preuve sémantique indépendante. Ne crée aucun statut ou relation. Pour chaque contentClaim, copie exactement le status autorisé, y compris null. Si une réalisation n’est pas possible, n’invente pas de contenu pour compléter les champs.`;

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
      required: ["whatRef", "action", "actionWitness", "targetRefs", "informationNeedRefs", "contentClaims", "relationClaims", "adoptionClaimed", "projectWriteClaimed"],
      properties: {
        whatRef: { type: "string" }, action: { type: "string", enum: ["ASK_QUESTION", "PROPOSE", "RESPOND"] },
        actionWitness: { type: "string" },
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
