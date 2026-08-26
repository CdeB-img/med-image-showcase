import {
  executeKnowledgeEngineForPresentation,
  isPatientLevelExpression,
  projectUnderstandResult,
  type UnderstandProjection,
} from "@/features/knowledge-engine";
import {
  buildScientificSessionContext,
  deriveRoutingIntent,
} from "@/features/protocol-designer/intake/journey";
import { detectSensitiveData } from "@/features/protocol-designer/intake/privacy";
import { createEmptyInterpretation } from "@/features/protocol-designer/intake/schema";
import {
  INTAKE_SCHEMA_VERSION,
  type ConfidenceLevel,
  type RoutingIntent,
  type ScientificSessionContext,
  type ValidatedScientificIntent,
} from "@/features/protocol-designer/intake/types";

export type ProductEntryDomainGate = "IN_SCOPE" | "BORDERLINE" | "OUT_OF_SCOPE";

export type ProductEntryExplicitExclusion = {
  code: "NO_STUDY" | "NO_PROTOCOL";
  sourceText: string;
};

export type ProductEntryRoutingDecision = {
  contract: "FUNCTIONAL_PRODUCT_ENTRY_ROUTING";
  contractVersion: "1.0.0";
  sourceTurnRef: string;
  domainGate: ProductEntryDomainGate;
  routeIntent: RoutingIntent | null;
  routeConfidence: ConfidenceLevel;
  routeReasons: string[];
  scientificContext: ScientificSessionContext;
  explicitExclusions: ProductEntryExplicitExclusion[];
  projectConstructionEligible: boolean;
  projectWriteAuthorized: false;
};

export type ProductUnderstandInteraction = {
  status: "SUCCESS" | "PARTIAL" | "FAILURE";
  assistantReply: string;
  knowledgeResultRef: string | null;
  knowledgeResultDigest: string | null;
  projectWrites: 0;
  protocolProjections: 0;
  externalCalls: 0;
};

const comparable = (value: string) => value.normalize("NFKC").toLocaleLowerCase("fr-FR");

const sentenceContaining = (text: string, pattern: RegExp) => text
  .split(/(?<=[.!?])\s+/u)
  .find((sentence) => pattern.test(comparable(sentence)))?.trim() ?? text.trim();

const explicitExclusions = (text: string): ProductEntryExplicitExclusion[] => {
  const normalized = comparable(text);
  const noStudy = /\b(?:ne\s+(?:souhaite|veux|désire)\s+pas|sans)\s+(?:créer|construire|concevoir|faire)?\s*(?:d['’]?)?(?:une?\s+)?étude\b/u;
  const noProtocol = /\b(?:ne\s+(?:souhaite|veux|désire)\s+pas|sans)\s+(?:créer|construire|concevoir|faire)?\s*(?:d['’]?)?(?:un\s+)?protocole\b/u;
  const coordinatedNoStudy = /\bni\s+(?:d['’])?(?:une?\s+)?étude\b/u;
  const coordinatedNoProtocol = /\bni\s+(?:de\s+|d['’])?(?:un\s+)?protocole\b/u;
  const negativeFinality = /\b(?:ne\s+(?:souhaite|veux|désire)\s+pas|sans)\b/u.test(normalized);
  const studyExcluded = noStudy.test(normalized) || (negativeFinality && coordinatedNoStudy.test(normalized));
  const protocolExcluded = noProtocol.test(normalized) || (negativeFinality && coordinatedNoProtocol.test(normalized));
  return [
    ...(studyExcluded ? [{ code: "NO_STUDY" as const, sourceText: sentenceContaining(text, /étude/u) }] : []),
    ...(protocolExcluded ? [{ code: "NO_PROTOCOL" as const, sourceText: sentenceContaining(text, /protocole/u) }] : []),
  ];
};

const rawIntent = (question: string): ValidatedScientificIntent => ({
  schemaVersion: INTAKE_SCHEMA_VERSION,
  originalQuestion: question,
  validatedReformulation: question,
  language: "fr",
  interpretation: createEmptyInterpretation({
    question,
    language: "fr",
    schemaVersion: INTAKE_SCHEMA_VERSION,
  }),
  reviews: {},
  ambiguityResolutions: {},
  contradictionResolutions: {},
  confirmedAt: null,
});

const mergeContext = (
  current: ScientificSessionContext,
  previous: ScientificSessionContext | undefined,
  routeIntent: RoutingIntent,
  routeConfidence: ConfidenceLevel,
  routeReasons: string[],
  changedAt: string,
): ScientificSessionContext => {
  const changed = previous && previous.routeIntent !== routeIntent;
  return {
    ...current,
    routeIntent,
    routeConfidence,
    routeReasons,
    centralScientificObject: current.preservedScientificTerms.length
      ? current.centralScientificObject
      : previous?.centralScientificObject ?? current.centralScientificObject ?? "Question scientifique à préciser",
    preservedScientificTerms: [...new Set([...(previous?.preservedScientificTerms ?? []), ...current.preservedScientificTerms])].slice(0, 16),
    detectedRelationships: [...new Set([...(previous?.detectedRelationships ?? []), ...current.detectedRelationships])],
    transitions: [
      ...(previous?.transitions ?? []),
      ...(changed ? [{
        from: previous.routeIntent,
        to: routeIntent,
        reason: "Transition explicite conservant le contexte scientifique accumulé.",
        changedAt,
      }] : []),
    ],
  };
};

export const routeProductEntry = (input: {
  raw: string;
  sourceTurnRef: string;
  routedAt: string;
  previousContext?: ScientificSessionContext;
  forceUnderstand?: boolean;
}): ProductEntryRoutingDecision => {
  const intent = rawIntent(input.raw);
  const baseRouting = deriveRoutingIntent(intent);
  const exclusions = explicitExclusions(input.raw);
  const patientSpecificContext = isPatientLevelExpression(input.raw)
    && /\b(?:mon examen|ma valeur|mon t[12]|chez moi|pour moi|que dois-je faire)\b/iu.test(input.raw);
  const sensitive = detectSensitiveData(input.raw).length > 0 || patientSpecificContext;
  const domainGate: ProductEntryDomainGate = sensitive ? "OUT_OF_SCOPE" : "IN_SCOPE";
  const exclusionGuarded = exclusions.length > 0;
  const retainsPrevious = !input.forceUnderstand
    && !exclusionGuarded
    && baseRouting.confidence === "LOW"
    && Boolean(input.previousContext);
  const routeIntent = domainGate === "OUT_OF_SCOPE"
    ? null
    : input.forceUnderstand || exclusionGuarded
      ? "UNDERSTAND"
      : retainsPrevious
        ? input.previousContext!.routeIntent
        : baseRouting.routeIntent;
  const routeConfidence: ConfidenceLevel = domainGate === "OUT_OF_SCOPE"
    ? "HIGH"
    : exclusionGuarded
      ? "HIGH"
      : retainsPrevious
        ? input.previousContext!.routeConfidence
        : baseRouting.confidence;
  const routeReasons = domainGate === "OUT_OF_SCOPE"
    ? ["Le Domain Gate refuse une entrée personnelle ou identifiable avant tout owner."]
    : exclusionGuarded
      ? ["La finalité négative explicite interdit la construction automatique d’une étude ou d’un protocole."]
      : retainsPrevious
        ? ["Le message précise le parcours courant sans exprimer une nouvelle finalité."]
        : baseRouting.reasons;
  const currentContext = buildScientificSessionContext(intent, input.previousContext);
  const scientificContext = mergeContext(
    currentContext,
    input.previousContext,
    routeIntent ?? "UNDERSTAND",
    routeConfidence,
    routeReasons,
    input.routedAt,
  );
  return {
    contract: "FUNCTIONAL_PRODUCT_ENTRY_ROUTING",
    contractVersion: "1.0.0",
    sourceTurnRef: input.sourceTurnRef,
    domainGate,
    routeIntent,
    routeConfidence,
    routeReasons,
    scientificContext,
    explicitExclusions: exclusions,
    projectConstructionEligible: domainGate === "IN_SCOPE" && routeIntent === "DESIGN_STUDY" && exclusions.length === 0,
    projectWriteAuthorized: false,
  };
};

const readableKnowledgeReply = (projection: UnderstandProjection) => [
  projection.requestSummary,
  projection.answer,
  ...(projection.supportedItems.length ? [
    "Éléments internes applicables :",
    ...projection.supportedItems.slice(0, 4).map((item) => `• ${item.text}`),
  ] : []),
  ...(projection.gaps.length ? [
    "Zones encore ouvertes :",
    ...projection.gaps.slice(0, 3).map((gap) => `• ${gap}`),
  ] : []),
  projection.boundedConclusion,
].join("\n");

export const executeProductUnderstandInteraction = (input: {
  raw: string;
  decision: ProductEntryRoutingDecision;
  createdAt: string;
}): ProductUnderstandInteraction => {
  if (input.decision.domainGate !== "IN_SCOPE" || input.decision.routeIntent !== "UNDERSTAND") {
    throw new Error("PRODUCT_UNDERSTAND_ROUTE_REQUIRED");
  }
  const execution = executeKnowledgeEngineForPresentation({
    originalQuestion: input.raw,
    scientificObjectTerms: input.decision.scientificContext.preservedScientificTerms.map((term) => ({ term })),
    relations: input.decision.scientificContext.detectedRelationships,
    exclusions: input.decision.explicitExclusions.map((item) => item.code),
    consumer: "PROTOCOL_DESIGNER_UNDERSTAND",
    externalSearchPolicy: "EXTERNAL_FORBIDDEN",
    createdAt: input.createdAt,
    payloadRef: input.decision.sourceTurnRef,
  });
  if (!execution.result) {
    return {
      status: "FAILURE",
      assistantReply: "La question et sa finalité sont conservées, mais les connaissances internes ne sont pas disponibles pour cette interaction. Aucun projet ni protocole n’a été créé.",
      knowledgeResultRef: null,
      knowledgeResultDigest: null,
      projectWrites: 0,
      protocolProjections: 0,
      externalCalls: 0,
    };
  }
  const projection = projectUnderstandResult(execution.result);
  return {
    status: execution.status,
    assistantReply: readableKnowledgeReply(projection),
    knowledgeResultRef: execution.result.resultId,
    knowledgeResultDigest: execution.result.resultDigest,
    projectWrites: 0,
    protocolProjections: 0,
    externalCalls: 0,
  };
};
