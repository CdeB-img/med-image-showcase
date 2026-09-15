import { logicalDigest } from "../../src/features/knowledge-engine/canonical";
import { canonicalProjectObjectType, type ProjectContextSnapshot } from "../../src/features/research-project-construction/canonical-project-backbone";
import {
  createLongHorizonProviderReplay,
  replayJsonResponse,
  REPLAY_PROVENANCE,
  type ProviderCallWitness,
} from "../../src/features/protocol-designer/functional-reset/__tests__/fixtures/long-horizon-provider-replay";

export type { ProviderCallWitness };
export const TRANSPORT_PROVENANCE = REPLAY_PROVENANCE;
const LANGUAGE_INVARIANTS = ["NEGATION", "UNCERTAINTY", "CONDITIONALITY", "COMPARISON", "TEMPORAL_RELATION"] as const;

export type AdversarialSemanticDelta = Readonly<{
  operation: "ADD" | "REPLACE" | "REMOVE";
  key: string;
  type: string;
  content: string;
  studyRole?: string;
  epistemicState: "KNOWN" | "UNKNOWN";
  attributes?: Readonly<Record<string, unknown>>;
}>;
export type AdversarialTurn = Readonly<{
  id: string;
  userText?: string;
  intent?: string;
  outcome?: string;
  semanticDelta: readonly AdversarialSemanticDelta[];
  semanticRelations?: readonly Readonly<{ key: string; type: string; sourceKey: string; targetKey: string; epistemicState?: "KNOWN" | "UNKNOWN" }>[];
  temporalQualifications?: readonly Readonly<{ operation: "ADD" | "REPLACE" | "REMOVE"; key: string;
    subjectKey: string; temporalRole: string; anchor: Readonly<Record<string, unknown>> | null }>[];
  expectedVariableOccasions?: readonly Readonly<{ operation: "ADD" | "REPLACE" | "REMOVE"; key: string;
    variableKey: string; anchor: Readonly<Record<string, unknown>> | null;
    studyUnitOrGroupKey?: string | null; applicableContext?: string | null }>[];
  languageInvariantEvidence?: Readonly<Record<string, readonly string[]>>;
}>;
export type AdversarialScenario = Readonly<{ id: string; turns: readonly AdversarialTurn[] }>;
export type AdversarialCorpus = Readonly<{ scenarios: readonly AdversarialScenario[] }>;
export type ActiveAdversarialTurn = Readonly<{ scenarioId: string; turnId: string }>;
export type AdversarialProviderTransport = typeof fetch & {
  setActiveTurn(scenarioId: string, turnId: string): void;
  getActiveTurn(): ActiveAdversarialTurn | null;
};

function required(condition: unknown, reason: string): asserts condition {
  if (!condition) throw new Error(`ADVERSARIAL_OFFLINE_TRANSPORT:${reason}`);
}

/** Reads the actual external adapter request; never takes a Project from the corpus or harness. */
export const adversarialExtractionContext = (body: Record<string, unknown>) => {
  required(body.model === "gpt-5.6-terra", "EXTRACTION_MODEL_CHANGED");
  required(typeof body.instructions === "string" && body.instructions.includes("sourceAnchorId"), "EXTRACTION_INSTRUCTIONS_MISSING");
  const format = (body.text as { format?: { type?: string; name?: string; schema?: { properties?: Record<string, unknown> } } })?.format;
  required(format?.type === "json_schema" && format.name === "propose_persistent_project_delta"
    && format.schema?.properties?.changes && format.schema.properties.expectedVariableOccasions, "EXTRACTION_SCHEMA_CHANGED");
  required(typeof body.input === "string", "EXTRACTION_INPUT_MISSING");
  const sourceMarker = "DERNIER MESSAGE UTILISATEUR (source de l'assertion ou de l'adoption) :\n";
  const catalogMarker = "\n\nCATALOGUE D'ANCRAGES DU DERNIER MESSAGE UTILISATEUR (sélectionne uniquement un anchorId exact ; FULL_TURN est toujours valide) :\n";
  const relationMarker = "\n\nCONTRAT MACHINE DES SIGNATURES RELATIONNELLES DU PROJECT (résous les types des deux références, puis respecte exactement une signature ; sinon omets la relation) :\n";
  const projectMarker = "\n\nRESEARCH PROJECT ADOPTÉ (lecture seule) :\n";
  const catalogStart = body.input.lastIndexOf(catalogMarker);
  const relationStart = body.input.lastIndexOf(relationMarker);
  const projectStart = body.input.lastIndexOf(projectMarker);
  required(body.input.startsWith(sourceMarker) && catalogStart > sourceMarker.length
    && relationStart > catalogStart && projectStart > relationStart, "REQUIRED_PROVIDER_CONTEXT_MISSING");
  const catalog = JSON.parse(body.input.slice(catalogStart + catalogMarker.length, relationStart)) as {
    currentUserTurnId: string;
    anchors: Array<{ anchorId: string; turnId: string; fragmentKind: string; exactText: string }>;
  };
  const full = catalog.anchors.filter((item) => item.fragmentKind === "FULL_TURN");
  required(full.length === 1 && typeof full[0].exactText === "string" && full[0].turnId === catalog.currentUserTurnId,
    "SOURCE_CATALOG_MISMATCH");
  const sourceText = full[0].exactText;
  required(body.input.startsWith(`${sourceMarker}${sourceText}\n\n`), "SOURCE_CATALOG_MISMATCH");
  const currentProject = JSON.parse(body.input.slice(projectStart + projectMarker.length)) as ProjectContextSnapshot | null;
  if (currentProject !== null) {
    required(currentProject.contract === "PROJECT_CONTEXT_SNAPSHOT" && currentProject.sourceProjectRef
      && currentProject.sourceProjectVersion && currentProject.sourceProjectDigest
      && Array.isArray(currentProject.objects) && currentProject.objects.length > 0
      && currentProject.objects.every((item) => item.stableId && item.versionRef), "PROJECT_IDENTITY_INCOMPLETE");
  }
  return { sourceText, sourceAnchorId: full[0].anchorId, sourceTurnRef: full[0].turnId, currentProject };
};

/** The semantic key locates a CURRENT object. Missing/ambiguous targets fail closed. */
const currentTarget = (spec: AdversarialSemanticDelta, currentProject: ProjectContextSnapshot | null) => {
  required(currentProject, `CURRENT_PROJECT_REQUIRED:${spec.key}`);
  const targets = currentProject.objects.filter((item) => item.stableId === spec.key
    || item.sourceItemRefs.includes(spec.key));
  required(targets.length === 1, `CURRENT_TARGET_NOT_UNIQUE:${spec.key}:${targets.length}`);
  required(targets[0].type === canonicalProjectObjectType({ proposedType: spec.type, studyRole: spec.studyRole ?? null }),
    `CURRENT_TARGET_TYPE_MISMATCH:${spec.key}`);
  return targets[0];
};

const objectRef = (key: string, context: ReturnType<typeof adversarialExtractionContext>, turn: AdversarialTurn) => {
  if (turn.semanticDelta.some((item) => item.operation === "ADD" && item.key === key)) return key;
  const targets = context.currentProject?.objects.filter((item) => item.stableId === key || item.sourceItemRefs.includes(key)) ?? [];
  required(targets.length === 1, `RELATED_CURRENT_TARGET_NOT_UNIQUE:${key}:${targets.length}`);
  return targets[0].stableId;
};

const anchoredTemporalGold = (anchor: Readonly<Record<string, unknown>> | null,
  context: ReturnType<typeof adversarialExtractionContext>, turn: AdversarialTurn) => {
  if (!anchor) return null;
  const reference = anchor.reference as { status?: string; referenceKey?: string } | undefined;
  if (reference?.status !== "KNOWN") return anchor;
  required(reference.referenceKey, "TEMPORAL_KNOWN_REFERENCE_KEY_REQUIRED");
  return { ...anchor, reference: { status: "KNOWN", referenceProjectRef: objectRef(reference.referenceKey, context, turn) } };
};

export const adversarialDeltaResponse = (
  context: ReturnType<typeof adversarialExtractionContext>,
  turn: AdversarialTurn,
) => ({
  changes: turn.semanticDelta.map((spec) => ({
    operation: spec.operation,
    sourceAnchorId: context.sourceAnchorId,
    ...(spec.operation === "ADD"
      ? { candidateRef: spec.key, semanticIdentity: spec.key }
      : { targetProjectRef: currentTarget(spec, context.currentProject).stableId }),
    proposedType: spec.type,
    content: spec.content,
    polarity: spec.operation === "REMOVE" ? "NEGATED" : "AFFIRMED",
    ...(spec.studyRole ? { studyRole: spec.studyRole } : {}),
    epistemicStatus: "EXPLICIT_USER_STATED",
    epistemicState: spec.epistemicState,
    assertionKind: "USER_STATED",
    evidenceRefs: [context.sourceAnchorId],
  })),
  // Only independently supplied gold relationships and timing are serialized.
  relations: (turn.semanticRelations ?? []).map((relation) => ({
    relationRef: relation.key, sourceAnchorId: context.sourceAnchorId, relationType: relation.type,
    sourceObjectRef: objectRef(relation.sourceKey, context, turn), targetObjectRef: objectRef(relation.targetKey, context, turn),
    polarity: "AFFIRMED", epistemicStatus: "EXPLICIT_USER_STATED", epistemicState: relation.epistemicState ?? "KNOWN",
    assertionKind: "USER_STATED", evidenceRefs: [context.sourceAnchorId],
  })),
  temporalQualifications: (turn.temporalQualifications ?? []).map((qualification) => {
    required(qualification.operation === "ADD" || context.currentProject?.temporalQualifications
      .some((item) => item.stableId === qualification.key), `CURRENT_TEMPORAL_QUALIFICATION_REQUIRED:${qualification.key}`);
    return { operation: qualification.operation, qualificationId: qualification.key, sourceAnchorId: context.sourceAnchorId,
      subjectProjectRef: objectRef(qualification.subjectKey, context, turn), temporalRole: qualification.temporalRole,
      anchor: anchoredTemporalGold(qualification.anchor, context, turn), assertionKind: "USER_STATED", evidenceRefs: [context.sourceAnchorId] };
  }),
  expectedVariableOccasions: (turn.expectedVariableOccasions ?? []).map((occasion) => {
    required(occasion.operation === "ADD" || context.currentProject?.expectedVariableOccasions
      .some((item) => item.stableId === occasion.key), `CURRENT_EXPECTED_OCCASION_REQUIRED:${occasion.key}`);
    return { operation: occasion.operation, occasionId: occasion.key, sourceAnchorId: context.sourceAnchorId,
      variableProjectRef: objectRef(occasion.variableKey, context, turn), anchor: anchoredTemporalGold(occasion.anchor, context, turn),
      studyUnitOrGroupRef: occasion.studyUnitOrGroupKey ? objectRef(occasion.studyUnitOrGroupKey, context, turn) : null,
      applicableContext: occasion.applicableContext ?? null, assertionKind: "USER_STATED", evidenceRefs: [context.sourceAnchorId] };
  }),
});

const frenchIdentityProjection = (body: Record<string, unknown>, turn: AdversarialTurn) => {
  required((body.reasoning as { effort?: string })?.effort === "low", "LANGUAGE_EFFORT_CHANGED");
  required(typeof body.input === "string" && body.input.includes("\nSOURCE_TEXT:\n"), "LANGUAGE_SOURCE_MISSING");
  const separator = body.input.indexOf("\nSOURCE_TEXT:\n");
  const sourceText = body.input.slice(separator + "\nSOURCE_TEXT:\n".length);
  required(sourceText === turn.userText, "LANGUAGE_SOURCE_OUTSIDE_ACTIVE_FROZEN_TURN");
  required(body.input.slice(0, separator).split("\n").includes("TARGET_LANGUAGE=fr"), "LANGUAGE_TARGET_NOT_FRENCH");
  required(turn.languageInvariantEvidence, "LANGUAGE_SEMANTIC_GOLD_MISSING");
  const semanticInvariants = LANGUAGE_INVARIANTS.map((invariantId) => {
    const evidence = turn.languageInvariantEvidence![invariantId];
    required(Array.isArray(evidence) && evidence.length <= 6
      && evidence.every((item) => item.length > 0 && item.length <= 240 && sourceText.includes(item)),
    `LANGUAGE_EVIDENCE_INVALID:${invariantId}`);
    return { invariantId, attestationStatus: "ATTESTED", sourcePresent: evidence.length > 0,
      preserved: evidence.length > 0, sourceEvidence: [...evidence], targetEvidence: [...evidence] };
  });
  return { detectedLanguage: "fr", supportStatus: "SUPPORTED", qualificationStatus: "QUALIFIED",
    translatedText: sourceText, translatedTextLanguage: "fr", ambiguityPreserved: true, semanticInvariants,
    limitations: ["SYNTHETIC_CONTRACT_FIXTURE_FRENCH_IDENTITY_ONLY_NOT_LIVE_LANGUAGE_QUALIFICATION"] };
};

/**
 * Campaign-only provider transport. Corpus selection bounds synthetic data; it does not
 * replace Product Entry, QRY, owners, validators, lifecycle, persistence or Human Review.
 * Responses are frozen by the complete serialized external request digest. No live fallback.
 */
export const createAdversarialProviderTransport = (
  witnesses: ProviderCallWitness[],
  options: { corpus: AdversarialCorpus; how?: "SUCCESS" | "UNAVAILABLE" },
): AdversarialProviderTransport => {
  let active: { scenario: AdversarialScenario; turn: AdversarialTurn } | null = null;
  const howReplay = createLongHorizonProviderReplay(witnesses, { how: options.how ?? "SUCCESS" });
  const responses = new Map<string, { body: unknown; turnText: string; outputDigest: string }>();
  const transport = (async (resource: string | URL | Request, init?: RequestInit) => {
    const endpoint = String(resource);
    required(active, "ACTIVE_FROZEN_TURN_REQUIRED");
    required(init?.method === "POST" && typeof init.body === "string", "PROVIDER_POST_BODY_REQUIRED");
    const requestBody = JSON.parse(init.body) as Record<string, unknown>;
    const requestDigest = logicalDigest({ endpoint, method: init.method, body: requestBody });
    if (endpoint.startsWith("https://generativelanguage.googleapis.com/")) {
      // Existing HOW fixture uses only the actual governed envelope, never campaign science.
      return howReplay(resource, init);
    }
    required(endpoint === "https://api.openai.com/v1/responses", `UNEXPECTED_PROVIDER_ENDPOINT:${endpoint}`);
    let output: unknown;
    let turnText: string;
    if (requestBody.model === "gpt-5.6-luna") {
      output = frenchIdentityProjection(requestBody, active.turn);
      turnText = active.turn.userText!;
    } else {
      const context = adversarialExtractionContext(requestBody);
      required(context.sourceText === active.turn.userText, "EXTRACTION_SOURCE_OUTSIDE_ACTIVE_FROZEN_TURN");
      output = adversarialDeltaResponse(context, active.turn);
      turnText = context.sourceText;
    }
    const outputDigest = logicalDigest(output);
    let fixture = responses.get(requestDigest);
    required(!fixture || fixture.outputDigest === outputDigest, "SAME_PROVIDER_INPUT_DIFFERENT_GOLD");
    if (!fixture) {
      fixture = { turnText, body: { id: `synthetic-adversarial:${requestDigest}`,
        model: requestBody.model, status: "completed", output_text: JSON.stringify(output),
        // Synthetic usage is explicitly zero; no measured live token/cost claim.
        usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 } }, outputDigest };
      responses.set(requestDigest, fixture);
    }
    required(fixture.turnText === active.turn.userText, "CACHED_RESPONSE_OUTSIDE_ACTIVE_FROZEN_TURN");
    witnesses.push(Object.freeze({ endpoint, requestDigest, requestBody, responseBody: fixture.body,
      responseStatus: 200, turnText: fixture.turnText, provenance: REPLAY_PROVENANCE }));
    return replayJsonResponse(fixture.body);
  }) as AdversarialProviderTransport;
  transport.setActiveTurn = (scenarioId, turnId) => {
    const scenario = options.corpus.scenarios.find((item) => item.id === scenarioId);
    const turn = scenario?.turns.find((item) => item.id === turnId);
    required(scenario && turn && typeof turn.userText === "string" && turn.userText.length > 0,
      `FROZEN_TURN_NOT_FOUND:${scenarioId}:${turnId}`);
    active = { scenario, turn };
  };
  transport.getActiveTurn = () => active ? { scenarioId: active.scenario.id, turnId: active.turn.id } : null;
  return transport;
};
