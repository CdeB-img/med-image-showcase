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
import { selectBoundedConversationInteraction } from "@/features/query-navigation/current-navigation-evidence";
import {
  INTAKE_SCHEMA_VERSION,
  type ConfidenceLevel,
  type RoutingIntent,
  type ScientificSessionContext,
  type ValidatedScientificIntent,
} from "@/features/protocol-designer/intake/types";
import {
  representExplicitScientificDimensions,
  type ExplicitScientificDimension,
} from "./pre-project-intent";

export type ProductEntryDomainGate = "IN_SCOPE" | "BORDERLINE" | "OUT_OF_SCOPE";

export type ProductDocumentAction =
  | "OPEN_CURRENT_PROTOCOL"
  | "CREATE_PROTOCOL"
  | "REGENERATE_PROTOCOL"
  | "DOWNLOAD_PROTOCOL"
  | "OPEN_STUDY_DELIVERABLES"
  | "OPEN_EDC_EXPORT";

export type ProductEntryExplicitExclusion = {
  code: "NO_STUDY" | "NO_PROTOCOL";
  sourceText: string;
};

export type CurrentProjectDirection =
  | "NONE"
  | "MODIFY_EXISTING_PROJECT_OBJECT"
  | "ADD_PROJECT_OBJECT"
  | "PRESERVE_EXISTING_PROJECT";

export type ProductEntryRoutingDecision = {
  contract: "FUNCTIONAL_PRODUCT_ENTRY_ROUTING";
  contractVersion: "1.3.0";
  sourceTurnRef: string;
  domainGate: ProductEntryDomainGate;
  routeIntent: RoutingIntent | null;
  routeConfidence: ConfidenceLevel;
  routeReasons: string[];
  secondaryRouteIntents: readonly RoutingIntent[];
  secondaryRouteReasons: Readonly<Partial<Record<RoutingIntent, readonly string[]>>>;
  scientificContext: ScientificSessionContext;
  explicitScientificDimensions: readonly ExplicitScientificDimension[];
  explicitExclusions: ProductEntryExplicitExclusion[];
  currentProjectDirection: CurrentProjectDirection;
  constructionIntentPresent: boolean;
  /** Admission to the existing reversible extractor, never permission to adopt a Project. */
  projectConstructionEligible: boolean;
  projectWriteAuthorized: false;
};

export type ProductUnderstandInteraction = {
  status: "SUCCESS" | "PARTIAL" | "FAILURE";
  assistantReply: string;
  presentation: ProductUnderstandKnowledgePresentation | null;
  knowledgeResultRef: string | null;
  knowledgeResultDigest: string | null;
  projectWrites: 0;
  protocolProjections: 0;
  externalCalls: 0;
};

export type ProductUnderstandKnowledgePresentation = {
  contract: "PRODUCT_UNDERSTAND_KNOWLEDGE_PRESENTATION";
  contractVersion: "1.1.0";
  resultRef: string;
  resultDigest: string;
  engineVersion: string;
  projection: UnderstandProjection;
  concepts: Array<{
    conceptRef: string;
    label: string;
    kind: string;
    objectType: string;
    originalTerms: string[];
  }>;
  assertions: Array<{
    assertionRef: string;
    text: string;
    status: string;
    applicability: string;
    applicabilityReasons: string[];
    sourceRefs: string[];
    locator: string | null;
    limitations: string[];
  }>;
  sources: Array<{
    sourceRef: string;
    label: string;
    revision: string;
    locator: string | null;
    contribution: string;
  }>;
  evidence: Array<{
    assertionRef: string;
    sourceRef: string;
    relation: string;
    locator: string;
    limitations: string[];
  }>;
  contradictions: Array<{
    contradictionRef: string;
    state: string;
    explanation: string;
    positionRefs: string[];
  }>;
  gaps: Array<{
    gapRef: string | null;
    kind: "AMBIGUITY" | "UNRESOLVED_CONCEPT" | "KNOWLEDGE_GAP";
    code: string | null;
    scope: string | null;
    explanation: string;
    resumeCondition: string | null;
  }>;
  limitations: string[];
  provenance: Array<{
    provider: string;
    version: string;
    representationDigest: string;
  }>;
  freshness: {
    requirement: string;
    corpusStateDate: string;
  };
};

const comparable = (value: string) => value.normalize("NFKC").toLocaleLowerCase("fr-FR");

const comparableProductCommand = (value: string) => value
  .normalize("NFKD")
  .replace(/\p{M}/gu, "")
  .toLocaleLowerCase("fr-FR")
  .replace(/[’']/gu, " ")
  .replace(/[^\p{L}\p{N}]+/gu, " ")
  .replace(/\s+/gu, " ")
  .trim();

/**
 * Recognizes the user's operation on an already adopted Project. The grammar
 * is intentionally domain-neutral: it identifies an edit operation, not the
 * scientific object that should be edited. Stable target resolution remains
 * the persistent extraction/Project validator responsibility.
 */
export const recognizeCurrentProjectDirection = (
  value: string,
  currentProjectAvailable: boolean,
): CurrentProjectDirection => {
  if (!currentProjectAvailable) return "NONE";
  const command = comparableProductCommand(value);
  const interrogative = /\?\s*$/u.test(value.trim())
    || /^(?:pourquoi|comment|en quoi|quel(?:le)?s?)\b/u.test(command);
  const preserve = /\b(?:finalement|en\s+fait)\s+(?:non|pas)\b.{0,160}\b(?:garde|conserve|maintiens?|reviens?)\b/u.test(command)
    || /\b(?:garde|conserve|maintiens?)\b.{0,160}\b(?:precedent|actuel|inchange|tel\s+quel)\b/u.test(command);
  if (preserve) return "PRESERVE_EXISTING_PROJECT";

  const addition = /\b(?:j\s+ajouterais|nous\s+ajouterions|ajoute|ajouter|completer)\b.{0,160}\b(?:aussi|egalement|en\s+plus)\b/u.test(command)
    || /\b(?:aussi|egalement|en\s+plus)\b.{0,160}\b(?:ajoute|ajouter|integrer)\b/u.test(command);
  if (addition) return "ADD_PROJECT_OBJECT";

  const editVerb = "(?:remplace|remplacer|modifie|modifier|corrige|corriger|change|changer|limite|limiter|exprime|exprimer|reporte|reporter|decale|decaler)";
  const replacement = (!interrogative && /\b(?:a\s+la\s+place\s+de|plutot\s+que)\b/u.test(command))
    || new RegExp(`^(?:(?:finalement|en fait)\\s+)?(?:(?:(?:c est|d accord|ok|garde)\\b.{0,120}\\bmais)\\s+)?${editVerb}\\b`, "u").test(command)
    || new RegExp(`\\b(?:je|nous|on)\\s+${editVerb}\\b`, "u").test(command);
  const boundedPreference = /\b(?:je|nous)\s+(?:prefererais|prefererions)\s+(?:plutot\s+)?(?:[a-z]\s*[+-]?\s*\d+|[-+]?\d+(?:[.,]\d+)?(?:\s*[%°a-z]+)?)(?:\b|$)/u.test(command);
  return replacement || boundedPreference ? "MODIFY_EXISTING_PROJECT_OBJECT" : "NONE";
};

/**
 * Finite product-command recognition at the existing Product Entry boundary.
 * Full-message matching is intentional: mentioning a protocol inside a
 * scientific modification must continue through the scientific corridor.
 */
export const recognizeProductDocumentAction = (value: string): ProductDocumentAction | null => {
  const command = comparableProductCommand(value);
  const politePrefix = "(?:(?:ok|d accord|merci)\\s+)?";
  const politeSuffix = "(?:\\s+s il (?:te|vous) plait)?";
  const protocolResource = "(?:(?:le|la|l)\\s+)?(?:protocole(?:\\s+(?:partiel|de travail))?|apercu(?:\\s+du protocole)?)";

  if (new RegExp(`^${politePrefix}(?:affiche|montre|ouvre)(?:\\s+moi)?\\s+(?:(?:les|mes)\\s+)?(?:documents|livrables|portefeuille\\s+documentaire)(?:\\s+de\\s+(?:l\\s+)?etude)?${politeSuffix}$`, "u").test(command)
    || new RegExp(`^${politePrefix}(?:telecharge|exporte)(?:\\s+moi)?\\s+(?:(?:le|mon)\\s+)?(?:package|dossier|portefeuille)(?:\\s+(?:de\\s+)?(?:l\\s+)?etude)?${politeSuffix}$`, "u").test(command)) {
    return "OPEN_STUDY_DELIVERABLES";
  }
  if (new RegExp(`^${politePrefix}(?:prepare|telecharge|exporte)(?:\\s+moi)?\\s+(?:(?:le|mon)\\s+)?crf(?:\\s+(?:pour|vers)\\s+(?:(?:mon|un)\\s+)?(?:logiciel\\s+de\\s+collecte|edc|redcap))?${politeSuffix}$`, "u").test(command)) {
    return "OPEN_EDC_EXPORT";
  }

  if (new RegExp(`^${politePrefix}(?:telecharge|exporte)(?:\\s+moi)?\\s+${protocolResource}${politeSuffix}$`, "u").test(command)) {
    return "DOWNLOAD_PROTOCOL";
  }
  if (new RegExp(`^${politePrefix}(?:actualise|rafraichis|regenere)(?:\\s+moi)?\\s+${protocolResource}(?:\\s+avec\\s+la\\s+derniere\\s+version\\s+du\\s+projet)?${politeSuffix}$`, "u").test(command)
    || new RegExp(`^${politePrefix}mets\\s+a\\s+jour\\s+${protocolResource}${politeSuffix}$`, "u").test(command)) {
    return "REGENERATE_PROTOCOL";
  }
  if (new RegExp(`^${politePrefix}(?:cree|genere|produis|prepare)(?:\\s+moi)?\\s+(?:(?:un|le|l)\\s+)?(?:premier\\s+)?(?:protocole(?:\\s+(?:partiel|de travail))?|apercu(?:\\s+du protocole)?)${politeSuffix}$`, "u").test(command)
    || new RegExp(`^${politePrefix}(?:affiche|montre|ouvre)(?:\\s+moi)?\\s+un\\s+premier\\s+(?:protocole(?:\\s+de travail)?|apercu(?:\\s+du protocole)?)${politeSuffix}$`, "u").test(command)) {
    return "CREATE_PROTOCOL";
  }
  if (new RegExp(`^${politePrefix}(?:affiche|montre|ouvre)(?:\\s+moi)?\\s+${protocolResource}${politeSuffix}$`, "u").test(command)
    || new RegExp(`^${politePrefix}je\\s+(?:veux|voudrais|souhaite)\\s+(?:voir|ouvrir|afficher)\\s+${protocolResource}${politeSuffix}$`, "u").test(command)) {
    return "OPEN_CURRENT_PROTOCOL";
  }
  return null;
};

const sentenceContaining = (text: string, pattern: RegExp) => text
  .split(/(?<=[.!?])\s+/u)
  .find((sentence) => pattern.test(comparable(sentence)))?.trim() ?? text.trim();

const explicitExclusions = (text: string): ProductEntryExplicitExclusion[] => {
  const normalized = comparable(text);
  const noStudy = /\b(?:ne\s+(?:souhaite|veux|désire)\s+pas|sans)\s+(?:créer|construire|concevoir|faire)?\s*(?:d['’]?)?(?:une?\s+)?étude\b/u;
  const noProtocol = /\b(?:ne\s+(?:souhaite|veux|désire)\s+pas|sans)\s+(?:créer|construire|concevoir|faire)?\s*(?:d['’]?)?(?:un\s+)?protocole\b/u;
  const coordinatedNoStudy = /\bni\s+(?:d['’])?(?:une?\s+)?étude\b/u;
  const coordinatedNoProtocol = /\bni\s+(?:de\s+|d['’])?(?:un\s+)?protocole\b/u;
  const negativeFinality = /\b(?:ne\s+(?:souhaite|veux|désire)\s+(?:pas|ni)|sans)\b/u.test(normalized);
  const studyExcluded = noStudy.test(normalized) || (negativeFinality && coordinatedNoStudy.test(normalized));
  const protocolExcluded = noProtocol.test(normalized) || (negativeFinality && coordinatedNoProtocol.test(normalized));
  return [
    ...(studyExcluded ? [{ code: "NO_STUDY" as const, sourceText: sentenceContaining(text, /étude/u) }] : []),
    ...(protocolExcluded ? [{ code: "NO_PROTOCOL" as const, sourceText: sentenceContaining(text, /protocole/u) }] : []),
  ];
};

/**
 * Reuses the bounded conversational-act owner before admitting an unresolved
 * statement to extraction. Remaining checks concern sentence mood only: they
 * contain neither scientific-domain terms nor a list of construction synonyms.
 */
const isConversationOnlyInput = (raw: string) => {
  const sentences = raw.trim().split(/(?<=[.!?;])\s+|\n+/u).filter((part) => part.trim());
  const interactionFor = (sentence: string) => selectBoundedConversationInteraction({
    sourceText: sentence,
    correctionMode: false,
    referentContext: {
      resolution: "NONE", candidateRef: null, sourceTurnRef: null, sourceDigest: null, content: [],
      reason: "PRODUCT_ENTRY_EXTRACTION_ADMISSION_ONLY", projectWriteAuthorized: false,
    },
  });
  const questionOrRequest = (sentence: string): boolean => {
    // A request cannot consume unclassified material on either side of a
    // clause boundary. Ambiguous list fragments may therefore reach reversible
    // extraction, which can return NO_CHANGE; admission never authorizes a write.
    const clauseParts = sentence.split(/,\s+|\s+(?:et|puis)\s+/iu).filter(part => part.trim());
    if (clauseParts.length > 1 && clauseParts.some(part => Boolean(interactionFor(part)))) {
      return clauseParts.every(part => questionOrRequest(part));
    }
    if (interactionFor(sentence)) return true;
    const routing = deriveRoutingIntent(rawIntent(sentence));
    if (routing.nonConstructiveIntentExplicit && !routing.constructionIntentPresent) return true;
    const command = comparableProductCommand(sentence);
    return sentence.trim().endsWith("?")
      || /^(?:pourquoi|comment|quel(?:le)?s?|qui|que|quand|ou|combien|est ce|qu est ce)\b/u.test(command)
      || /^(?:peux tu|pouvez vous|pourrais tu|pourriez vous|dois je|devons nous)\b/u.test(command)
      || /^(?:explique(?:r|z)?|compare(?:r|z)?|decris|decrivez|decrire|reformule(?:r|z)?)\b/u.test(command);
  };
  return sentences.length > 0 && sentences.every(questionOrRequest);
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
    secondaryRouteIntents: [...new Set([
      ...(previous?.secondaryRouteIntents ?? []),
      ...(current.secondaryRouteIntents ?? []),
    ])].filter((candidate) => candidate !== routeIntent),
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
  currentProjectAvailable?: boolean;
  explicitCorrectionMode?: boolean;
}): ProductEntryRoutingDecision => {
  const intent = rawIntent(input.raw);
  const baseRouting = deriveRoutingIntent(intent);
  const exclusions = explicitExclusions(input.raw);
  const currentProjectDirection = input.currentProjectAvailable === true && input.explicitCorrectionMode
    ? "MODIFY_EXISTING_PROJECT_OBJECT"
    : input.forceUnderstand
      ? "NONE"
      : recognizeCurrentProjectDirection(input.raw, input.currentProjectAvailable === true);
  const forceUnderstand = input.forceUnderstand === true && currentProjectDirection === "NONE";
  const patientSpecificContext = isPatientLevelExpression(input.raw);
  const sensitive = detectSensitiveData(input.raw).length > 0 || patientSpecificContext;
  const domainGate: ProductEntryDomainGate = sensitive ? "OUT_OF_SCOPE" : "IN_SCOPE";
  const exclusionGuarded = exclusions.length > 0;
  const retainsPrevious = !forceUnderstand
    && !exclusionGuarded
    && baseRouting.confidence === "LOW"
    && Boolean(input.previousContext);
  const currentProjectChange = currentProjectDirection === "MODIFY_EXISTING_PROJECT_OBJECT"
    || currentProjectDirection === "ADD_PROJECT_OBJECT";
  const routeIntent = domainGate === "OUT_OF_SCOPE"
    ? null
    : forceUnderstand || exclusionGuarded
      ? "UNDERSTAND"
      : currentProjectDirection !== "NONE"
        ? "DESIGN_STUDY"
        : retainsPrevious
          ? input.previousContext!.routeIntent
          : baseRouting.routeIntent;
  const routeConfidence: ConfidenceLevel = domainGate === "OUT_OF_SCOPE"
    ? "HIGH"
    : exclusionGuarded
      ? "HIGH"
      : currentProjectDirection !== "NONE"
        ? "HIGH"
        : retainsPrevious
          ? input.previousContext!.routeConfidence
          : baseRouting.confidence;
  const routeReasons = domainGate === "OUT_OF_SCOPE"
    ? ["Le Domain Gate refuse une entrée personnelle ou identifiable avant tout owner."]
    : exclusionGuarded
      ? ["La finalité négative explicite interdit la construction automatique d’une étude ou d’un protocole."]
      : currentProjectDirection === "PRESERVE_EXISTING_PROJECT"
        ? ["L’utilisateur demande explicitement de conserver le Research Project courant sans appliquer de nouvelle modification."]
        : currentProjectChange
          ? ["L’utilisateur propose explicitement une modification du Research Project courant ; la proposition doit rester candidate jusqu’à confirmation."]
          : retainsPrevious
            ? ["Le message précise le parcours courant sans exprimer une nouvelle finalité."]
            : baseRouting.reasons;
  const secondaryRouteIntents = domainGate !== "IN_SCOPE" || forceUnderstand || exclusionGuarded || currentProjectDirection !== "NONE"
    ? []
    : [...new Set([
      ...baseRouting.secondaryRouteIntents,
      ...(retainsPrevious ? input.previousContext?.secondaryRouteIntents ?? [] : []),
    ])].filter((candidate) => candidate !== routeIntent);
  const constructionIntentPresent = domainGate === "IN_SCOPE"
    && !forceUnderstand
    && !exclusionGuarded
    && currentProjectDirection !== "PRESERVE_EXISTING_PROJECT"
    && (currentProjectChange
      || baseRouting.constructionIntentPresent
      || Boolean(retainsPrevious && (
        input.previousContext?.routeIntent === "DESIGN_STUDY"
        || input.previousContext?.secondaryRouteIntents?.includes("DESIGN_STUDY")
      )));
  // A low-confidence route cannot veto representation of user-supplied
  // material. The existing extractor decides whether any persistent delta is
  // supported, including returning an empty delta. Validators and Human Review
  // remain mandatory; this admission does not assert a construction finality.
  const conversationOnly = input.explicitCorrectionMode !== true && isConversationOnlyInput(input.raw);
  const reversibleEvaluationEligible = !conversationOnly
    && /[\p{L}\p{N}]/u.test(input.raw);
  const projectConstructionEligible = domainGate === "IN_SCOPE"
    && !forceUnderstand && !exclusionGuarded
    && currentProjectDirection !== "PRESERVE_EXISTING_PROJECT"
    && reversibleEvaluationEligible;
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
    contractVersion: "1.3.0",
    sourceTurnRef: input.sourceTurnRef,
    domainGate,
    routeIntent,
    routeConfidence,
    routeReasons,
    secondaryRouteIntents,
    secondaryRouteReasons: Object.freeze(Object.fromEntries(secondaryRouteIntents.map((candidate) => [
      candidate,
      candidate === baseRouting.routeIntent ? baseRouting.reasons : ["Intention secondaire explicitement représentée sans remplacer l’intention principale."],
    ]))),
    scientificContext,
    explicitScientificDimensions: representExplicitScientificDimensions({
      raw: input.raw,
      sourceTurnRef: input.sourceTurnRef,
    }),
    explicitExclusions: exclusions,
    currentProjectDirection,
    constructionIntentPresent,
    projectConstructionEligible,
    projectWriteAuthorized: false,
  };
};

const readableKnowledgeReply = (projection: UnderstandProjection) => [
  projection.answer,
  ...projection.clarifications.map((item) => item.question),
  projection.requestSummary,
  projection.boundedConclusion,
].join("\n");

const knowledgePresentation = (
  result: NonNullable<ReturnType<typeof executeKnowledgeEngineForPresentation>["result"]>,
  projection: UnderstandProjection,
): ProductUnderstandKnowledgePresentation => ({
  contract: "PRODUCT_UNDERSTAND_KNOWLEDGE_PRESENTATION",
  contractVersion: "1.1.0",
  resultRef: result.resultId,
  resultDigest: result.resultDigest,
  engineVersion: result.trace.engineVersion,
  projection,
  concepts: result.resolvedConcepts.map((item) => ({
    conceptRef: item.conceptId,
    label: item.preferredLabel,
    kind: item.kind,
    objectType: item.objectType,
    originalTerms: [...item.originalTerms],
  })),
  assertions: [
    ...result.applicableAssertions.map((item) => ({
      assertionRef: item.revision,
      text: item.text,
      status: item.status,
      applicability: item.applicability,
      applicabilityReasons: [...item.applicabilityReasons],
      sourceRefs: result.evidence.filter((link) => link.assertionId === item.revision).map((link) => link.sourceId),
      locator: item.locator || null,
      limitations: [...item.limitations],
    })),
    ...result.documentaryStatements.map((item) => ({
      assertionRef: item.statementId,
      text: item.text,
      status: item.status,
      applicability: item.applicability,
      applicabilityReasons: [...item.applicabilityReasons],
      sourceRefs: [item.sourceId],
      locator: item.locator || null,
      limitations: [],
    })),
  ],
  sources: result.sources.map((source) => ({
    sourceRef: source.sourceId,
    label: source.title,
    revision: source.revision,
    locator: source.locator || null,
    contribution: result.evidence.some((link) => link.sourceId === source.sourceId)
      ? "Soutient, nuance ou qualifie un élément affiché."
      : "Source documentaire conservée dans le résultat Knowledge.",
  })),
  evidence: result.evidence.map((item) => ({
    assertionRef: item.assertionId,
    sourceRef: item.sourceId,
    relation: item.relation,
    locator: item.locator,
    limitations: [...item.limitations],
  })),
  contradictions: result.controversies.map((item) => ({
    contradictionRef: item.conflictId,
    state: item.state,
    explanation: item.explanation,
    positionRefs: [...item.positionIds],
  })),
  gaps: [
    ...result.ambiguities.map((explanation) => ({ gapRef: null, kind: "AMBIGUITY" as const, code: null, scope: null, explanation, resumeCondition: null })),
    ...result.unresolvedConcepts.map((explanation) => ({ gapRef: null, kind: "UNRESOLVED_CONCEPT" as const, code: null, scope: null, explanation, resumeCondition: null })),
    ...result.gaps.map((item) => ({ gapRef: item.gapId, kind: "KNOWLEDGE_GAP" as const, code: item.code, scope: item.scope, explanation: item.explanation, resumeCondition: item.resumeCondition })),
  ],
  limitations: [...projection.limitations],
  provenance: result.provenance.map((item) => ({
    provider: item.providerId,
    version: item.version,
    representationDigest: item.representationDigest,
  })),
  freshness: { ...result.freshness },
});

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
      presentation: null,
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
    presentation: knowledgePresentation(execution.result, projection),
    knowledgeResultRef: execution.result.resultId,
    knowledgeResultDigest: execution.result.resultDigest,
    projectWrites: 0,
    protocolProjections: 0,
    externalCalls: 0,
  };
};
