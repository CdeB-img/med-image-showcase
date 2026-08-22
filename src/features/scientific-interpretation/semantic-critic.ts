import { z } from "zod";
import { logicalDigest } from "../knowledge-engine/canonical.js";
import type {
  ScientificInterpretationCognitiveBoundary,
  ScientificInterpretationContributionEnvelope,
  ScientificInterpretationConversation,
  ScientificInterpretationTerminologyContext,
  ScientificInterpretationTurn,
} from "./contracts.js";
import {
  buildScientificInterpretationTerminologyContext,
  SCIENTIFIC_INTERPRETATION_SUPPORTED_ROLE_TERMINOLOGY,
} from "./terminology-grounding.js";

export const SEMANTIC_CRITIC_CONTRACT = "NOXIA_SEMANTIC_INTEGRATION_CRITIC" as const;
export const SEMANTIC_CRITIC_VERSION = "1.2.0" as const;
export const SEMANTIC_CRITIC_PROMPT_VERSION = "SEMANTIC-INTEGRATION-CRITIC-1.2.0" as const;
export const SEMANTIC_CRITIC_OUTPUT_FUNCTION_NAME = "semantic_critic_result" as const;

export const SEMANTIC_CRITIC_FINDING_CATEGORIES = [
  "INFORMATION_LOST",
  "ROLE_MISMATCH",
  "RELATION_MISMATCH",
  "OVER_INTERPRETATION",
  "AMBIGUITY_LOST",
  "DUPLICATE_CONCEPT",
] as const;
export type SemanticCriticFindingCategory = typeof SEMANTIC_CRITIC_FINDING_CATEGORIES[number];

export type SemanticCriticCandidateElement = {
  elementId: string;
  content: string;
  semanticRoles: string[];
  semanticBasis: string | null;
  quantitativeBounds?: { lower: number | null; upper: number | null; unit: string | null } | null;
};

export type SemanticCriticCandidateSnapshot = {
  candidateRef: string;
  candidateDigest: string;
  status: "CANDIDATE_PENDING_HUMAN_CONFIRMATION" | "NO_NET_CHANGE";
  projectWriteAuthorized: false;
  changes: Array<{
    changeId: string;
    operation: "ADD" | "REMOVE" | "REPLACE" | "NO_CHANGE";
    targetSectionId: string;
    semanticKey: string;
    sourceUnderstandingRefs: string[];
    previousElement: SemanticCriticCandidateElement | null;
    proposedElement: SemanticCriticCandidateElement | null;
  }>;
};

export type SemanticCriticGroundingContext = {
  lifecycle: "EPHEMERAL_TRACEABLE_NON_AUTHORITATIVE";
  rawUserMessage: ScientificInterpretationTurn;
  relevantConversationTurns: ScientificInterpretationTurn[];
  projectContext: ScientificInterpretationConversation["projectContext"] | null;
  interactionContext: ScientificInterpretationConversation["interactionContext"] | null;
  terminologyContext: ScientificInterpretationTerminologyContext;
};

export type SemanticCriticRawEvidence = {
  turnId: string;
  quote: string;
};

export type SemanticCriticFinding = {
  findingId: string;
  category: SemanticCriticFindingCategory;
  message: string;
  understandingElementIds: string[];
  candidateChangeIds: string[];
  failureStage: "INTERPRETER" | "COMPILER" | "BOTH";
  rawEvidence: SemanticCriticRawEvidence[];
  repairHint: string | null;
  source: "DETERMINISTIC_GUARD" | "LLM_SEMANTIC_CRITIC";
};

export type SemanticCriticResult = {
  contract: typeof SEMANTIC_CRITIC_CONTRACT;
  contractVersion: typeof SEMANTIC_CRITIC_VERSION;
  status: "FAITHFUL" | "FAILED" | "SEMANTIC_CRITIC_UNAVAILABLE";
  authoritative: false;
  groundingDigest: string;
  understandingDigest: string;
  candidateDigest: string;
  findings: SemanticCriticFinding[];
  repairAllowed: boolean;
  provider: string | null;
  model: string | null;
  promptDigest: string;
  rawOutputRef: string | null;
  technicalMessage: string | null;
};

export type SemanticCriticNativeExecution = {
  operationId: string;
  provider: string;
  model: string;
  rawOutput: unknown;
  attempts: Array<{
    attempt: number;
    httpStatus: number | null;
    outcome: "SUCCESS" | "FAILED";
    retryable: boolean;
    waitDurationMs: number;
  }>;
  technicalFailure: string | null;
};

export const SEMANTIC_CRITIC_SYSTEM_PROMPT = `
You are NOXIA's independent, bounded semantic integration critic. Re-read the RAW USER MESSAGE in its relevant conversational, QRY and read-only Project context. Then compare that meaning with both the EPHEMERAL intermediate understanding and the deterministic NOXIA candidate compilation.

Your only question is: from the original message and its context, is what NOXIA proposes to integrate faithful to what the user expressed?

The raw user message is the source of the user's statement. The intermediate understanding, including its terminology resolutions, is only a NON_AUTHORITATIVE HYPOTHESIS. Never approve merely because the understanding and compilation agree with each other. You must also detect explicit information, roles, relations, terminology or ambiguity already lost by the interpreter.

Detect only:
- INFORMATION_LOST: an explicit or contextual project candidate disappeared;
- ROLE_MISMATCH: the concept remains but its inclusion, exclusion, endpoint or other stated role changed;
- RELATION_MISMATCH: the right concepts exist but their stated relation changed;
- OVER_INTERPRETATION: the compilation adds a scientific fact, timepoint, role or relation absent from the understanding;
- AMBIGUITY_LOST: an explicit ambiguity was compiled as certainty;
- DUPLICATE_CONCEPT: a reference to an existing Project element became a new duplicate.

Rules:
1. Do not judge scientific quality, clinical correctness or protocol optimality.
2. Do not recommend methods, biomarkers, sequences, analyses or treatments.
3. Recover only linguistic meaning explicit in the raw message or resolved by the supplied conversation, QRY or Project context. Never add domain science, a recommended role, timepoint, method or relation.
4. failureStage is INTERPRETER when the intermediate understanding already lost or changed the raw meaning, COMPILER when the understanding is correct but compilation is not, and BOTH when both stages contribute.
5. Every finding must cite exact rawEvidence from a supplied user turn. It may additionally cite existing understandingElementIds and candidateChangeIds. Never invent an id or quotation.
6. A faithful paraphrase is acceptable. Literal equality is not required.
7. OUT_OF_SCOPE segments must never appear in compiled scientific changes.
8. An existing Project reference plus a new role must update the referenced element, not ADD a duplicate concept.
9. A NO_NET_CHANGE candidate is not exempt: verify that the user truly only repeated already-adopted meaning and did not assign a new role or relation.
10. Return FAITHFUL only when no semantic mismatch remains. Provider absence is handled outside this prompt and must never be converted to FAITHFUL.
11. repairHint may request a bounded semantic re-interpretation or recompilation, but it must not write a Project fact or add content absent from the raw message.
12. Before the verdict, independently resolve abbreviations, acronyms, synonyms, shortened or user-defined local labels needed by the raw turn. Use the supplied terminology context, the raw conversation, Project references and ordinary linguistic knowledge. Do not treat the Interpreter's terminology resolution as ground truth.
13. The terminology context is compact, ephemeral and non-authoritative. It may establish a known Project alias or supported role label, but it never creates a Project fact or a canonical mapping.
14. If a role explicit through a supported linguistic or contextual term was lost before compilation, return ROLE_MISMATCH with failureStage INTERPRETER or BOTH. If an unsupported expansion or role was invented, return OVER_INTERPRETATION. If the term remains unresolved or ambiguous, require safe clarification rather than approving an assumed meaning.
15. Terminology grounding is linguistic only. Never add an endpoint, exclusion, method, timepoint or other role that the raw message does not express.
16. DUPLICATE_CONCEPT means that compilation creates a distinct new Project concept, normally an ADD, for something that references an existing element. A provenance-only NO_CHANGE trace plus one effective REPLACE that adds a role to that same existing element is not a duplicate concept.

Return only the required structured result. Do not reveal hidden reasoning.
`.trim();

const rawFindingSchema = z.object({
  findingId: z.string().min(1),
  category: z.enum(SEMANTIC_CRITIC_FINDING_CATEGORIES),
  message: z.string().min(1),
  understandingElementIds: z.array(z.string()),
  candidateChangeIds: z.array(z.string()),
  failureStage: z.enum(["INTERPRETER", "COMPILER", "BOTH"]),
  rawEvidence: z.array(z.object({ turnId: z.string().min(1), quote: z.string().min(1) }).strict()).min(1),
  repairHint: z.string().nullable(),
}).strict();

export const semanticCriticProviderSchema = z.object({
  verdict: z.enum(["FAITHFUL", "FAILED"]),
  findings: z.array(rawFindingSchema),
}).strict();

const stringArray = { type: "array", items: { type: "string" } } as const;
export const SEMANTIC_CRITIC_PROVIDER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    verdict: { type: "string", enum: ["FAITHFUL", "FAILED"] },
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          findingId: { type: "string" },
          category: { type: "string", enum: [...SEMANTIC_CRITIC_FINDING_CATEGORIES] },
          message: { type: "string" },
          understandingElementIds: stringArray,
          candidateChangeIds: stringArray,
          failureStage: { type: "string", enum: ["INTERPRETER", "COMPILER", "BOTH"] },
          rawEvidence: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: { turnId: { type: "string" }, quote: { type: "string" } },
              required: ["turnId", "quote"],
            },
          },
          repairHint: { anyOf: [{ type: "string" }, { type: "null" }] },
        },
        required: ["findingId", "category", "message", "understandingElementIds", "candidateChangeIds", "failureStage", "rawEvidence", "repairHint"],
      },
    },
  },
  required: ["verdict", "findings"],
} as const;

export const SEMANTIC_CRITIC_PROMPT_DIGEST = logicalDigest({
  version: SEMANTIC_CRITIC_PROMPT_VERSION,
  prompt: SEMANTIC_CRITIC_SYSTEM_PROMPT,
});

type SemanticCriticCandidateSource = {
  contributionRef: string;
  status: "CANDIDATE_PENDING_HUMAN_CONFIRMATION" | "NO_NET_CHANGE";
  projectWriteAuthorized: false;
  changeSet: {
    changes: Array<{
      changeId: string;
      operation: "ADD" | "REMOVE" | "REPLACE" | "NO_CHANGE";
      targetSectionId: string;
      semanticKey: string;
      sourceObjectRefs: string[];
      previousElement: { elementId: string; content: string; semanticRoles?: string[]; semanticBasis?: string; quantitativeBounds?: { lower: number | null; upper: number | null; unit: string | null } | null } | null;
      proposedElement: { elementId: string; content: string; semanticRoles?: string[]; semanticBasis?: string; quantitativeBounds?: { lower: number | null; upper: number | null; unit: string | null } | null } | null;
    }>;
  };
};

const snapshotElement = (value: SemanticCriticCandidateSource["changeSet"]["changes"][number]["proposedElement"]): SemanticCriticCandidateElement | null => value ? ({
  elementId: value.elementId,
  content: value.content,
  semanticRoles: [...(value.semanticRoles ?? [])],
  semanticBasis: value.semanticBasis ?? null,
  quantitativeBounds: value.quantitativeBounds ?? null,
}) : null;

export const snapshotSemanticCriticCandidate = (
  candidate: SemanticCriticCandidateSource,
): SemanticCriticCandidateSnapshot => ({
  candidateRef: candidate.contributionRef,
  candidateDigest: logicalDigest(candidate),
  status: candidate.status,
  projectWriteAuthorized: false,
  changes: candidate.changeSet.changes.map((change) => ({
    changeId: change.changeId,
    operation: change.operation,
    targetSectionId: change.targetSectionId,
    semanticKey: change.semanticKey,
    sourceUnderstandingRefs: [...change.sourceObjectRefs],
    previousElement: snapshotElement(change.previousElement),
    proposedElement: snapshotElement(change.proposedElement),
  })),
});

const finding = (
  category: SemanticCriticFindingCategory,
  message: string,
  understandingElementIds: string[],
  candidateChangeIds: string[],
  repairHint: string | null,
): SemanticCriticFinding => ({
  findingId: `semantic-critic-guard:${logicalDigest({ category, understandingElementIds, candidateChangeIds, message })}`,
  category,
  message,
  understandingElementIds,
  candidateChangeIds,
  failureStage: "COMPILER",
  rawEvidence: [],
  repairHint,
  source: "DETERMINISTIC_GUARD",
});

export const buildSemanticCriticGroundingContext = (
  conversation: ScientificInterpretationConversation,
  contribution?: ScientificInterpretationContributionEnvelope | null,
): SemanticCriticGroundingContext => {
  const userIndex = [...conversation.turns].map((turn) => turn.role).lastIndexOf("USER");
  if (userIndex < 0) throw new Error("SEMANTIC_CRITIC_RAW_USER_MESSAGE_REQUIRED");
  const rawUserMessage = conversation.turns[userIndex];
  return {
    lifecycle: "EPHEMERAL_TRACEABLE_NON_AUTHORITATIVE",
    rawUserMessage: { ...rawUserMessage },
    relevantConversationTurns: conversation.turns
      .slice(Math.max(0, userIndex - 7), userIndex + 1)
      .map((turn) => ({ ...turn })),
    projectContext: conversation.projectContext ? {
      ...conversation.projectContext,
      elements: conversation.projectContext.elements.map((element) => ({ ...element, semanticRoles: [...element.semanticRoles] })),
    } : null,
    interactionContext: conversation.interactionContext ? {
      ...conversation.interactionContext,
      targetRefs: [...conversation.interactionContext.targetRefs],
      informationNeedRefs: [...conversation.interactionContext.informationNeedRefs],
      scopeSectionIds: [...(conversation.interactionContext.scopeSectionIds ?? [])],
    } : null,
    terminologyContext: contribution?.cognitiveBoundary?.terminologyGrounding?.context
      ?? buildScientificInterpretationTerminologyContext(conversation),
  };
};

const expectedRoles = (element: ScientificInterpretationCognitiveBoundary["semanticUnderstanding"]["elements"][number]) => [...new Set([
  element.studyRole,
  ...(element.quantitativeBounds?.lower !== null && element.quantitativeBounds?.lower !== undefined ? ["LOWER_BOUND"] : []),
  ...(element.quantitativeBounds?.upper !== null && element.quantitativeBounds?.upper !== undefined ? ["UPPER_BOUND"] : []),
  ...(element.semanticFunction === "EXCLUSION" ? ["EXCLUSION"] : []),
  ...(element.semanticFunction === "INCLUSION" ? ["INCLUSION"] : []),
].filter((value): value is string => Boolean(value)))];

const normalized = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("fr-FR").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export const semanticCriticScopeForContribution = (
  contribution: ScientificInterpretationContributionEnvelope,
): ScientificInterpretationCognitiveBoundary | null => {
  const cognitiveBoundary = contribution.cognitiveBoundary;
  if (!cognitiveBoundary) return null;
  const latestUserTurnId = [...contribution.source.turns].reverse().find((turn) => turn.role === "USER")?.turnId ?? null;
  if (!latestUserTurnId) return cognitiveBoundary;
  const elements = cognitiveBoundary.semanticUnderstanding.elements.filter((element) =>
    element.epistemicBoundary.sourceTurnIds.includes(latestUserTurnId));
  const elementIds = new Set(elements.map((element) => element.itemId));
  const relations = cognitiveBoundary.semanticUnderstanding.relations.filter((relation) =>
    relation.epistemicBoundary.sourceTurnIds.includes(latestUserTurnId)
    || (elementIds.has(relation.sourceItemId) && elementIds.has(relation.targetItemId)));
  return {
    ...cognitiveBoundary,
    semanticUnderstanding: { ...cognitiveBoundary.semanticUnderstanding, elements, relations },
  };
};

export const inspectSemanticFidelityDeterministically = (input: {
  cognitiveBoundary: ScientificInterpretationCognitiveBoundary;
  candidate: SemanticCriticCandidateSnapshot;
  groundingContext?: SemanticCriticGroundingContext;
}): SemanticCriticFinding[] => {
  const elements = input.cognitiveBoundary.semanticUnderstanding.elements
    .filter((element) => element.epistemicBoundary.activeState !== false)
    .filter((element) => element.projectDisposition === "PROJECT_CANDIDATE");
  const compiled = input.candidate.changes;
  const effective = input.candidate.changes.filter((change) => change.operation !== "NO_CHANGE");
  const findings: SemanticCriticFinding[] = [];

  const rawTurn = input.groundingContext?.rawUserMessage;
  for (const entry of input.groundingContext?.terminologyContext.entries ?? []) {
    if (!entry.semanticRoleCandidate || !rawTurn) continue;
    const matchedSurface = entry.surfaceForms.find((surfaceForm) => {
      const raw = ` ${normalized(rawTurn.content)} `;
      const surface = ` ${normalized(surfaceForm)} `;
      return surface.trim().length > 0 && raw.includes(surface);
    });
    if (!matchedSurface) continue;
    const rolePresent = elements.some((element) =>
      element.epistemicBoundary.sourceTurnIds.includes(rawTurn.turnId)
      && expectedRoles(element).includes(entry.semanticRoleCandidate!));
    if (!rolePresent) findings.push({
      ...finding(
        "ROLE_MISMATCH",
        "Un rôle présent dans le message brut et le contexte terminologique n’est pas conservé par l’Interpreter.",
        [],
        [],
        "Reprendre l’interprétation du rôle depuis le message brut et le contexte terminologique.",
      ),
      failureStage: "INTERPRETER",
      rawEvidence: [{ turnId: rawTurn.turnId, quote: matchedSurface }],
    });
  }

  const terminologyResolutions = input.cognitiveBoundary.terminologyGrounding?.resolutions ?? [];
  const supportedRoles = new Set(SCIENTIFIC_INTERPRETATION_SUPPORTED_ROLE_TERMINOLOGY.map((entry) => entry.role));
  for (const resolution of terminologyResolutions.filter((item) =>
    !rawTurn || item.sourceTurnIds.includes(rawTurn.turnId))) {
    const linked = elements.filter((element) => resolution.understandingElementIds.includes(element.itemId));
    const rawEvidence = resolution.sourceTurnIds.flatMap((turnId) => {
      const turn = input.groundingContext?.relevantConversationTurns.find((candidate) => candidate.turnId === turnId);
      return turn && resolution.sourceText && turn.content.includes(resolution.sourceText)
        ? [{ turnId, quote: resolution.sourceText }]
        : [];
    });
    if (["AMBIGUOUS", "UNRESOLVED"].includes(resolution.status)) {
      const assumed = linked.filter((element) => element.projectDisposition === "PROJECT_CANDIDATE");
      if (assumed.length) findings.push({
        ...finding(
          resolution.status === "AMBIGUOUS" ? "AMBIGUITY_LOST" : "OVER_INTERPRETATION",
          "Un terme non résolu ou ambigu a été transformé en candidat scientifique certain.",
          assumed.map((element) => element.itemId),
          input.candidate.changes.filter((change) => change.sourceUnderstandingRefs.some((ref) => assumed.some((element) => element.itemId === ref))).map((change) => change.changeId),
          null,
        ),
        failureStage: "INTERPRETER",
        rawEvidence,
      });
      continue;
    }
    if (resolution.semanticRoleCandidate && supportedRoles.has(resolution.semanticRoleCandidate as typeof SCIENTIFIC_INTERPRETATION_SUPPORTED_ROLE_TERMINOLOGY[number]["role"])) {
      const sameProjectReference = elements.filter((element) =>
        resolution.referencedProjectElementIds.length > 0
        && element.referencedProjectElementIds?.some((id) => resolution.referencedProjectElementIds.includes(id)));
      const rolePreserved = [...linked, ...sameProjectReference].some((element) =>
        expectedRoles(element).includes(resolution.semanticRoleCandidate!));
      if (!rolePreserved) findings.push({
        ...finding(
          "ROLE_MISMATCH",
          "Un rôle résolu terminologiquement n’est pas conservé dans la compréhension intermédiaire.",
          linked.map((element) => element.itemId),
          [],
          "Reprendre l’interprétation du rôle depuis le message brut et le contexte terminologique, sans écrire directement le Project.",
        ),
        failureStage: "INTERPRETER",
        rawEvidence,
      });
    }
  }

  for (const element of elements) {
    const mapped = compiled.filter((change) => change.sourceUnderstandingRefs.includes(element.itemId));
    if (!mapped.length) {
      const relatedRoleCarrier = element.semanticFunction === "ROLE_ASSIGNMENT"
        ? elements.find((candidate) =>
          element.relatedItemIds?.includes(candidate.itemId)
          && expectedRoles(element).every((role) => expectedRoles(candidate).includes(role))
          && compiled.some((change) => change.sourceUnderstandingRefs.includes(candidate.itemId)))
        : null;
      if (relatedRoleCarrier) continue;
      const representedByRoleAssignment = Boolean(element.referencedProjectElementIds?.length)
        && expectedRoles(element).length === 0
        && ["REFERENCE", "CONCEPT", "ENTITY"].includes(element.semanticFunction ?? "CONCEPT")
        && elements.some((candidate) =>
          candidate.semanticFunction === "ROLE_ASSIGNMENT"
          && candidate.referencedProjectElementIds?.some((id) => element.referencedProjectElementIds?.includes(id))
          && compiled.some((change) => change.sourceUnderstandingRefs.includes(candidate.itemId)));
      if (representedByRoleAssignment) continue;
      const knownReferenceWithoutNewMeaning = input.candidate.status === "NO_NET_CHANGE"
        && Boolean(element.referencedProjectElementIds?.length)
        && expectedRoles(element).length === 0
        && !element.quantitativeBounds
        && ["REFERENCE", "CONCEPT", "ENTITY"].includes(element.semanticFunction ?? "CONCEPT");
      if (knownReferenceWithoutNewMeaning) continue;
      findings.push(finding(
        "INFORMATION_LOST",
        "Un élément destiné au Project n’est représenté par aucun changement candidat.",
        [element.itemId],
        [],
        "Recompiler cet élément depuis son identifiant de compréhension sans en modifier le sens.",
      ));
      continue;
    }
    const roles = expectedRoles(element);
    const mappedRoles = new Set(mapped.flatMap((change) => change.proposedElement?.semanticRoles ?? []));
    const roleMismatch = roles.length > 0 && !roles.every((role) => mappedRoles.has(role));
    if (roleMismatch) findings.push(finding(
      "ROLE_MISMATCH",
      "Le rôle sémantique explicite n’est pas conservé sur l’élément compilé.",
      [element.itemId],
      mapped.map((change) => change.changeId),
      "Préserver les rôles explicitement portés par l’élément de compréhension.",
    ));
    const expectedBounds = element.quantitativeBounds;
    if (expectedBounds && (
      (expectedBounds.lower !== null && !mapped.some((change) => change.proposedElement?.quantitativeBounds?.lower === expectedBounds.lower))
      || (expectedBounds.upper !== null && !mapped.some((change) => change.proposedElement?.quantitativeBounds?.upper === expectedBounds.upper))
    )) findings.push(finding(
      "INFORMATION_LOST",
      "Une borne quantitative explicite n’est pas conservée dans l’élément compilé.",
      [element.itemId],
      mapped.map((change) => change.changeId),
      "Préserver les valeurs et directions quantitatives structurées de la compréhension.",
    ));
    if (element.referencedProjectElementIds?.length && mapped.some((change) => change.operation === "ADD")) {
      findings.push(finding(
        "DUPLICATE_CONCEPT",
        "Une référence à un élément Project existant est compilée comme un nouvel ajout.",
        [element.itemId],
        mapped.filter((change) => change.operation === "ADD").map((change) => change.changeId),
        "Appliquer le rôle ou la relation à l’élément Project référencé au lieu de créer un duplicat.",
      ));
    }
    if (element.evidenceBasis === "AMBIGUOUS" && mapped.some((change) => change.proposedElement?.semanticBasis !== "AMBIGUOUS")) {
      findings.push(finding(
        "AMBIGUITY_LOST",
        "Une compréhension ambiguë est présentée comme une intégration certaine.",
        [element.itemId],
        mapped.map((change) => change.changeId),
        null,
      ));
    }
  }

  for (const change of effective) {
    const grounded = change.sourceUnderstandingRefs.some((ref) => elements.some((element) => element.itemId === ref));
    if (!grounded) findings.push(finding(
      "OVER_INTERPRETATION",
      "Un changement scientifique candidat n’est relié à aucun élément de compréhension destiné au Project.",
      [],
      [change.changeId],
      "Retirer le changement non relié à la compréhension source.",
    ));
    const proposed = normalized(change.proposedElement?.content ?? "");
    const contaminatedBy = input.cognitiveBoundary.domainDecision.outOfScopeSegments.find((segment) => {
      const out = normalized(segment);
      return out.length > 3 && proposed.includes(out);
    });
    if (contaminatedBy) findings.push(finding(
      "OVER_INTERPRETATION",
      "Un segment déclaré hors périmètre apparaît dans la compilation scientifique.",
      [],
      [change.changeId],
      "Retirer de la compilation tout contenu du segment hors périmètre.",
    ));
  }
  return [...new Map(findings.map((item) => [item.findingId, item])).values()];
};

export const parseSemanticCriticProviderOutput = (raw: unknown) => {
  const envelope = raw && typeof raw === "object" ? raw as { rawAttempts?: Array<{ providerBodyText?: unknown }> } : {};
  const finalBody = envelope.rawAttempts?.at(-1)?.providerBodyText;
  if (typeof finalBody !== "string") throw new Error("SEMANTIC_CRITIC_PROVIDER_RESPONSE_BODY_MISSING");
  const body = JSON.parse(finalBody) as { candidates?: Array<{ content?: { parts?: Array<{ functionCall?: { name?: unknown; args?: unknown } }> } }> };
  const calls = body.candidates?.flatMap((candidate) => candidate.content?.parts?.flatMap((part) => part.functionCall ? [part.functionCall] : []) ?? []) ?? [];
  const call = calls.find((candidate) => candidate.name === SEMANTIC_CRITIC_OUTPUT_FUNCTION_NAME);
  if (!call?.args || typeof call.args !== "object" || Array.isArray(call.args)) throw new Error("SEMANTIC_CRITIC_FUNCTION_ARGUMENTS_INVALID");
  return semanticCriticProviderSchema.parse(call.args);
};

export const buildSemanticCriticResult = (input: {
  contribution: ScientificInterpretationContributionEnvelope;
  groundingContext: SemanticCriticGroundingContext;
  candidate: SemanticCriticCandidateSnapshot;
  providerResult: z.infer<typeof semanticCriticProviderSchema>;
  provider: string;
  model: string;
  rawOutputRef: string | null;
}): SemanticCriticResult => {
  const cognitiveBoundary = semanticCriticScopeForContribution(input.contribution);
  if (!cognitiveBoundary) throw new Error("SEMANTIC_UNDERSTANDING_TRACE_REQUIRED");
  const validUnderstandingIds = new Set([
    ...cognitiveBoundary.semanticUnderstanding.elements.map((element) => element.itemId),
    ...cognitiveBoundary.semanticUnderstanding.relations.map((relation) => relation.relationId),
  ]);
  const validChangeIds = new Set(input.candidate.changes.map((change) => change.changeId));
  const turnsById = new Map(input.groundingContext.relevantConversationTurns.map((turn) => [turn.turnId, turn]));
  const invalidReference = input.providerResult.findings.some((item) =>
    item.understandingElementIds.some((id) => !validUnderstandingIds.has(id))
    || item.candidateChangeIds.some((id) => !validChangeIds.has(id))
    || item.rawEvidence.some((evidence) => {
      const turn = turnsById.get(evidence.turnId);
      return !turn || turn.role !== "USER" || !turn.content.includes(evidence.quote);
    }));
  if (invalidReference) throw new Error("SEMANTIC_CRITIC_UNGROUNDED_FINDING_REFERENCE");
  const deterministic = inspectSemanticFidelityDeterministically({
    cognitiveBoundary,
    candidate: input.candidate,
    groundingContext: input.groundingContext,
  });
  const llm: SemanticCriticFinding[] = input.providerResult.findings.map((item) => ({
    findingId: item.findingId,
    category: item.category,
    message: item.message,
    understandingElementIds: item.understandingElementIds,
    candidateChangeIds: item.candidateChangeIds,
    failureStage: item.failureStage,
    rawEvidence: item.rawEvidence.map((evidence) => ({
      turnId: evidence.turnId!,
      quote: evidence.quote!,
    })),
    repairHint: item.repairHint,
    source: "LLM_SEMANTIC_CRITIC",
  }));
  const findings = [...deterministic, ...llm];
  const status = input.providerResult.verdict === "FAITHFUL" && findings.length === 0 ? "FAITHFUL" as const : "FAILED" as const;
  return {
    contract: SEMANTIC_CRITIC_CONTRACT,
    contractVersion: SEMANTIC_CRITIC_VERSION,
    status,
    authoritative: false,
    groundingDigest: logicalDigest(input.groundingContext),
    understandingDigest: logicalDigest(cognitiveBoundary.semanticUnderstanding),
    candidateDigest: input.candidate.candidateDigest,
    findings,
    repairAllowed: status === "FAILED" && findings.length > 0 && findings.every((item) => ["INFORMATION_LOST", "ROLE_MISMATCH", "RELATION_MISMATCH", "DUPLICATE_CONCEPT"].includes(item.category)),
    provider: input.provider,
    model: input.model,
    promptDigest: SEMANTIC_CRITIC_PROMPT_DIGEST,
    rawOutputRef: input.rawOutputRef,
    technicalMessage: null,
  };
};

export const semanticCriticUnavailable = (input: {
  contribution: ScientificInterpretationContributionEnvelope;
  groundingContext: SemanticCriticGroundingContext;
  candidate: SemanticCriticCandidateSnapshot;
  message: string;
}): SemanticCriticResult => ({
  contract: SEMANTIC_CRITIC_CONTRACT,
  contractVersion: SEMANTIC_CRITIC_VERSION,
  status: "SEMANTIC_CRITIC_UNAVAILABLE",
  authoritative: false,
  groundingDigest: logicalDigest(input.groundingContext),
  understandingDigest: logicalDigest(semanticCriticScopeForContribution(input.contribution)?.semanticUnderstanding ?? null),
  candidateDigest: input.candidate.candidateDigest,
  findings: [],
  repairAllowed: false,
  provider: null,
  model: null,
  promptDigest: SEMANTIC_CRITIC_PROMPT_DIGEST,
  rawOutputRef: null,
  technicalMessage: input.message,
});
