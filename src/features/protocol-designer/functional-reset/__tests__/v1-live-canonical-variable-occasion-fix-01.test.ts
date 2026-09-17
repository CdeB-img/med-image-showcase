import { describe, expect, it, vi } from "vitest";
import {
  executeProtocolDesignerBridge,
  isRecoverablePersistentValidationFailure,
} from "../../../../../api/protocol-designer-bridge";
import {
  PERSISTENT_DELTA_SYSTEM_INSTRUCTION,
  buildPersistentSourceCatalog,
  contributionFromPersistentDelta,
  validatePersistentProjectDelta,
  type PersistentProjectDeltaWireCandidate,
  type ProductBridgeRequest,
  type ProductBridgeResponse,
} from "@/features/protocol-designer/product-bridge";
import {
  canonicalProjectObjectType,
  prepareResearchProjectContributionCandidate,
} from "@/features/research-project-construction";
import { buildPreProjectNavigationDecision } from "@/features/query-navigation";
import { routeProductEntry } from "../product-entry-routing";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation/contracts";

const CREATED_AT = "2026-09-10T01:14:00.000Z";
const RAW = "je veux faire une étude évaluant l'effet de méthodes de reperfusion post IDM avec mise en place immédiate ou différée d'un stent afin d'évaluer l'efficacité sur la viabilité myocardique. avec donc deux groupes en double aveugle, une IRM a J3-6 évaluant la cinétique segmentaire, le strain, le T1/T2, le précoce et tardif le critere de jugement principale étant la taille des lésions microvasculaire a 3min post injection";
const LIVE_CONVERSATION_ID = "protocol-designer-session:41bd5a14-8b5e-4f23-ab9d-2e0b501e0c5a";
const LIVE_TURN_ID = "turn:fee49245-92ba-4fdc-89e4-4a150eb6b26b";

const conversation = (raw = RAW): ScientificInterpretationConversation => ({
  conversationId: LIVE_CONVERSATION_ID,
  language: "fr",
  turns: [{ turnId: LIVE_TURN_ID, role: "USER", content: raw, createdAt: CREATED_AT }],
});

const requestFor = (raw = RAW): ProductBridgeRequest => {
  const context = conversation(raw);
  const routing = routeProductEntry({ raw, sourceTurnRef: context.turns[0]!.turnId, routedAt: CREATED_AT });
  return {
    apiVersion: "1.0.0",
    requestKind: "USER_TURN",
    conversation: context,
    currentProject: null,
    evaluatePersistentDelta: true,
    preProjectNavigation: buildPreProjectNavigationDecision({ routing }),
  };
};

const anchorFor = (request: ProductBridgeRequest, exactText: string) => {
  const anchor = buildPersistentSourceCatalog(request.conversation).anchors.find((item) => item.exactText === exactText);
  if (!anchor) throw new Error(`TEST_SOURCE_ANCHOR_MISSING:${exactText}`);
  return anchor.anchorId;
};

const commonChange = (input: {
  sourceAnchorId: string;
  candidateRef: string;
  semanticIdentity: string;
  proposedType: string;
  content: string;
  studyRole?: string;
}) => ({
  operation: "ADD",
  ...input,
  polarity: "AFFIRMED",
  epistemicStatus: "EXPLICIT_USER_STATED",
  epistemicState: "KNOWN",
  assertionKind: "USER_STATED",
  evidenceRefs: [input.sourceAnchorId],
});

/** Exact structured first-attempt artifact captured from the 2026-09-10 live run. */
const capturedLiveProviderOutput = (request: ProductBridgeRequest) => {
  const opening = "je veux faire une étude évaluant l'effet de méthodes de reperfusion post IDM avec mise en place immédiate ou différée d'un stent afin d'évaluer l'efficacité sur la viabilité myocardique.";
  const design = "avec donc deux groupes en double aveugle,";
  const acquisition = "une IRM a J3-6 évaluant la cinétique segmentaire,";
  const strain = "le strain,";
  const mapping = "le T1/T2,";
  const endpoint = "le précoce et tardif le critere de jugement principale étant la taille des lésions microvasculaire a 3min post injection";
  const a = {
    opening: anchorFor(request, opening),
    design: anchorFor(request, design),
    acquisition: anchorFor(request, acquisition),
    strain: anchorFor(request, strain),
    mapping: anchorFor(request, mapping),
    endpoint: anchorFor(request, endpoint),
  };

  // These identities are part of the retained live witness, not regenerated test values.
  expect(a).toEqual({
    opening: "source-anchor:ke1-ff508f4402a9c350",
    design: "source-anchor:ke1-aa542cc960d56255",
    acquisition: "source-anchor:ke1-9ea46979e1b26a05",
    strain: "source-anchor:ke1-caf1234304cc78af",
    mapping: "source-anchor:ke1-2ff57f80cbfc3a2c",
    endpoint: "source-anchor:ke1-be4a7d7b1308d067",
  });

  return {
    changes: [
      commonChange({ sourceAnchorId: a.opening, candidateRef: "candidate:condition-post-idm", semanticIdentity: "condition:post-infarctus-myocarde", proposedType: "CONDITION", content: "Contexte post-infarctus du myocarde (IDM)" }),
      commonChange({ sourceAnchorId: a.opening, candidateRef: "candidate:objective-efficacite-reperfusion-viabilite", semanticIdentity: "objective:efficacite-reperfusion-viabilite-myocardique", proposedType: "OBJECTIVE", content: "Évaluer l'efficacité de méthodes de reperfusion avec pose immédiate ou différée d'un stent sur la viabilité myocardique" }),
      commonChange({ sourceAnchorId: a.opening, candidateRef: "candidate:intervention-stent-immediat", semanticIdentity: "intervention:pose-stent-immediate", proposedType: "INTERVENTION", content: "Mise en place immédiate d'un stent", studyRole: "INTERVENTION_ARM" }),
      commonChange({ sourceAnchorId: a.opening, candidateRef: "candidate:intervention-stent-differe", semanticIdentity: "intervention:pose-stent-differee", proposedType: "INTERVENTION", content: "Mise en place différée d'un stent", studyRole: "INTERVENTION_ARM" }),
      commonChange({ sourceAnchorId: a.design, candidateRef: "candidate:study-design-deux-groupes-double-aveugle", semanticIdentity: "study-design:deux-groupes-double-aveugle", proposedType: "STUDY_DESIGN", content: "Étude à deux groupes en double aveugle" }),
      commonChange({ sourceAnchorId: a.opening, candidateRef: "candidate:variable-viabilite-myocardique", semanticIdentity: "variable:viabilite-myocardique", proposedType: "CANONICAL_VARIABLE", content: "Viabilité myocardique", studyRole: "OUTCOME_ROLE" }),
      commonChange({ sourceAnchorId: a.acquisition, candidateRef: "candidate:imaging-modality-irm", semanticIdentity: "imaging-modality:irm", proposedType: "IMAGING_MODALITY", content: "IRM" }),
      commonChange({ sourceAnchorId: a.acquisition, candidateRef: "candidate:acquisition-irm-j3-6", semanticIdentity: "acquisition:irm-j3-6", proposedType: "ACQUISITION", content: "Acquisition IRM planifiée" }),
      commonChange({ sourceAnchorId: a.acquisition, candidateRef: "candidate:variable-cinetique-segmentaire", semanticIdentity: "variable:cinetique-segmentaire", proposedType: "CANONICAL_VARIABLE", content: "Cinétique segmentaire", studyRole: "OUTCOME_ROLE" }),
      commonChange({ sourceAnchorId: a.strain, candidateRef: "candidate:variable-strain", semanticIdentity: "variable:strain", proposedType: "CANONICAL_VARIABLE", content: "Strain myocardique", studyRole: "OUTCOME_ROLE" }),
      commonChange({ sourceAnchorId: a.mapping, candidateRef: "candidate:variable-t1", semanticIdentity: "variable:t1", proposedType: "CANONICAL_VARIABLE", content: "T1", studyRole: "OUTCOME_ROLE" }),
      commonChange({ sourceAnchorId: a.mapping, candidateRef: "candidate:variable-t2", semanticIdentity: "variable:t2", proposedType: "CANONICAL_VARIABLE", content: "T2", studyRole: "OUTCOME_ROLE" }),
      {
        ...commonChange({ sourceAnchorId: a.endpoint, candidateRef: "candidate:project-information-irm-precoce-tardif", semanticIdentity: "project-information:irm-evaluation-precoce-tardive", proposedType: "PROJECT_INFORMATION", content: "L'acquisition IRM comporte des évaluations « précoce » et « tardif », dont la nature précise reste à définir." }),
        epistemicState: "UNKNOWN",
      },
      commonChange({ sourceAnchorId: a.endpoint, candidateRef: "candidate:endpoint-primaire-taille-lesions-microvasculaires", semanticIdentity: "endpoint:primaire-taille-lesions-microvasculaires", proposedType: "ENDPOINT", content: "Taille des lésions microvasculaires", studyRole: "PRIMARY_ENDPOINT" }),
      commonChange({ sourceAnchorId: a.endpoint, candidateRef: "candidate:variable-taille-lesions-microvasculaires", semanticIdentity: "variable:taille-lesions-microvasculaires", proposedType: "CANONICAL_VARIABLE", content: "Taille des lésions microvasculaires", studyRole: "OUTCOME_ROLE" }),
    ],
    relations: [{
      relationRef: "relation:comparaison-stent-immediat-differe",
      sourceAnchorId: a.opening,
      relationType: "COMPARES_WITH",
      sourceObjectRef: "candidate:intervention-stent-immediat",
      targetObjectRef: "candidate:intervention-stent-differe",
      polarity: "AFFIRMED",
      epistemicStatus: "EXPLICIT_USER_STATED",
      epistemicState: "KNOWN",
      assertionKind: "USER_STATED",
      evidenceRefs: [a.opening],
    }],
    temporalQualifications: [{
      operation: "ADD",
      qualificationId: "temporal:acquisition-irm-j3-6",
      sourceAnchorId: a.acquisition,
      subjectProjectRef: "candidate:acquisition-irm-j3-6",
      temporalRole: "ACQUISITION_TIME",
      anchor: {
        kind: "WINDOW", direction: "AFTER", unit: "jours", offset: null, lowerBound: 3, upperBound: 6,
        relativeEventLabel: null, tolerance: null,
        reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" },
      },
      assertionKind: "USER_STATED",
      evidenceRefs: [a.acquisition],
    }],
    expectedVariableOccasions: [{
      operation: "ADD",
      occasionId: "occasion:taille-lesions-microvasculaires-3min-post-injection",
      sourceAnchorId: a.endpoint,
      variableProjectRef: "candidate:variable-taille-lesions-microvasculaires",
      anchor: {
        kind: "TIMEPOINT", direction: "AFTER", unit: "minutes", offset: 3, lowerBound: null, upperBound: null,
        relativeEventLabel: "injection", tolerance: null,
        reference: { status: "EXPLICIT", bindingStatus: "PROJECT_REF_UNRESOLVED" },
      },
      assertionKind: "USER_STATED",
      evidenceRefs: [a.endpoint],
    }],
  };
};

const sourceChange = (input: {
  raw: string;
  ref: string;
  type: string;
  content: string;
  role?: string;
  epistemicState?: "KNOWN" | "UNKNOWN" | "WITHHELD";
}) => ({
  operation: "ADD" as const,
  sourceText: input.raw,
  candidateRef: input.ref,
  semanticIdentity: input.ref,
  proposedType: input.type,
  content: input.content,
  polarity: "AFFIRMED" as const,
  studyRole: input.role,
  epistemicStatus: "EXPLICIT_USER_STATED" as const,
  epistemicState: input.epistemicState ?? "KNOWN" as const,
  assertionKind: "USER_STATED" as const,
  evidenceRefs: [],
});

const occasion = (raw: string, variableProjectRef: string) => ({
  operation: "ADD" as const,
  occasionId: `occasion:${variableProjectRef}`,
  sourceText: raw,
  variableProjectRef,
  anchor: {
    kind: "TIMEPOINT" as const,
    direction: "AFTER" as const,
    unit: "minute",
    offset: 3,
    lowerBound: null,
    upperBound: null,
    relativeEventLabel: "injection",
    tolerance: null,
    reference: { status: "EXPLICIT" as const, bindingStatus: "PROJECT_REF_UNRESOLVED" as const },
  },
  assertionKind: "USER_STATED" as const,
  evidenceRefs: [],
});

const validate = (raw: string, wire: PersistentProjectDeltaWireCandidate) =>
  validatePersistentProjectDelta(wire, raw, null, conversation(raw));

describe("V1 LIVE — canonical variable / expected occasion boundary", () => {
  it("preserves an explicit CANONICAL_VARIABLE carrying OUTCOME_ROLE instead of retyping it as ENDPOINT", () => {
    expect(canonicalProjectObjectType({ proposedType: "CANONICAL_VARIABLE", studyRole: "OUTCOME_ROLE" }))
      .toBe("CANONICAL_VARIABLE");
    expect(canonicalProjectObjectType({ proposedType: "ENDPOINT", studyRole: "PRIMARY_ENDPOINT" }))
      .toBe("ENDPOINT");
  });

  it("accepts the exact captured first Terra output and reaches review with bounded ST proposal, without HOW", async () => {
    const request = requestFor();
    const liveOutput = capturedLiveProviderOutput(request);
    const endpoints: string[] = [];
    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      endpoints.push(String(url));
      if (String(url).startsWith("https://generativelanguage.googleapis.com/")) {
        // Transport-only LOCAL_SYNTHETIC proposal receipt. Historical Terra
        // output below remains byte-for-byte unchanged; no quality oracle.
        const payload = JSON.parse(String(init?.body));
        const source = JSON.parse(payload.contents[0].parts[0].text).request;
        return new Response(JSON.stringify({ responseId: "LOCAL_SYNTHETIC_ST_EMPTY_CONTROL",
          candidates: [{ content: { parts: [{ text: JSON.stringify({
            contract: "SCIENTIFIC_THINKING_CONTEXTUAL_PROPOSALS_1",
            requestRef: source.requestRef, contextDigest: source.contextDigest,
            candidates: [], facts: [], questions: [], projectWriteAuthorized: false, candidateIsAdopted: false,
          }) }] } }] }), { status: 200, headers: { "content-type": "application/json" } });
      }
      if (!String(url).startsWith("https://api.openai.com/v1/responses")) {
        throw new Error(`TEST_FORBIDS_NON_EXTRACTION_PROVIDER:${String(url)}`);
      }
      return new Response(JSON.stringify({
        id: "openai:captured-live-first-attempt",
        model: "gpt-5.6-terra",
        status: "completed",
        output_text: JSON.stringify(liveOutput),
        usage: { input_tokens: 8678, output_tokens: 3958, total_tokens: 12636 },
      }), { status: 200, headers: { "content-type": "application/json" } });
    }) as unknown as typeof fetch;

    const result = await executeProtocolDesignerBridge({
      body: request,
      apiKey: "unused-gemini-key",
      openAiApiKey: "offline-openai-key",
      fetchImpl,
      now: () => Date.parse(CREATED_AT),
    });
    const response = result.body as ProductBridgeResponse;

    expect(result.status).toBe(200);
    expect(endpoints).toHaveLength(2);
    expect(response.contextualReasoning?.owner).toBe("SCIENTIFIC_THINKING");
    expect(response.persistentExtraction).toMatchObject({
      status: "CANDIDATE",
      recovery: null,
      validation: { valid: true, blocks: [] },
      contribution: expect.any(Object),
    });
    expect(response.observability).toMatchObject({
      extractionAttempts: 1,
      conversationCalls: 1,
      calls: 2,
      projectWrites: 0,
    });
    const review = prepareResearchProjectContributionCandidate(response.persistentExtraction.contribution!, null);
    const endpointChange = review.canonicalChangeSet.objectChanges.find((item) => item.candidate?.scientificRole === "PRIMARY_ENDPOINT");
    const measuredVariable = review.canonicalChangeSet.objectChanges.find((item) => item.objectId === "variable:taille-lesions-microvasculaires");
    expect(endpointChange?.candidate).toMatchObject({ objectType: "ENDPOINT", content: "Taille des lésions microvasculaires" });
    expect(measuredVariable?.candidate).toMatchObject({ objectType: "CANONICAL_VARIABLE", content: "Taille des lésions microvasculaires" });
    expect(review.canonicalChangeSet.expectedVariableOccasionChanges).toEqual([
      expect.objectContaining({ candidate: expect.objectContaining({
        variableProjectRef: "variable:taille-lesions-microvasculaires",
        anchor: expect.objectContaining({ offset: 3, unit: "minutes", relativeEventLabel: "injection" }),
      }) }),
    ]);
    expect(review.canonicalChangeSet.objectChanges.filter((item) => item.candidate?.objectType === "IMAGING_MODALITY")).toHaveLength(1);
    expect(review.humanReviewProjection.status).toBe("COMPLETE");
    expect(review.projectWriteAuthorized).toBe(false);
  });

  it("keeps the canonical validator fail-closed when EXPECTED_AT actually references an endpoint", () => {
    const raw = "La taille lésionnelle est le critère principal à 3 minutes après injection.";
    const endpoint = sourceChange({ raw, ref: "endpoint:size", type: "ENDPOINT", content: "Taille lésionnelle", role: "PRIMARY_ENDPOINT" });
    const variable = sourceChange({ raw, ref: "variable:size", type: "CANONICAL_VARIABLE", content: "Taille lésionnelle", role: "OUTCOME_ROLE" });
    const checked = validate(raw, {
      changes: [endpoint, variable], relations: [], temporalQualifications: [],
      expectedVariableOccasions: [occasion(raw, endpoint.candidateRef)],
    });
    expect(checked.candidate).toBeNull();
    expect(checked.validation.blocks).toEqual(["expectedVariableOccasion:0:EXPECTED_AT_SOURCE_NOT_CANONICAL_VARIABLE"]);
  });

  it("covers endpoint/variable/occasion counterexamples without invention or arbitrary selection", () => {
    const timed = "La pression artérielle est le critère principal à 3 minutes après injection.";
    const endpoint = sourceChange({ raw: timed, ref: "endpoint:pressure", type: "ENDPOINT", content: "Pression artérielle", role: "PRIMARY_ENDPOINT" });
    const variable = sourceChange({ raw: timed, ref: "variable:pressure", type: "CANONICAL_VARIABLE", content: "Pression artérielle", role: "OUTCOME_ROLE" });
    expect(validate(timed, { changes: [endpoint, variable], relations: [], temporalQualifications: [], expectedVariableOccasions: [occasion(timed, variable.candidateRef)] }).validation.valid).toBe(true);

    const untimed = "La pression artérielle est le critère principal.";
    const noOccasion = validate(untimed, {
      changes: [
        sourceChange({ raw: untimed, ref: "endpoint:untimed", type: "ENDPOINT", content: "Pression artérielle", role: "PRIMARY_ENDPOINT" }),
        sourceChange({ raw: untimed, ref: "variable:untimed", type: "CANONICAL_VARIABLE", content: "Pression artérielle", role: "OUTCOME_ROLE" }),
      ],
      relations: [], temporalQualifications: [], expectedVariableOccasions: [],
    });
    expect(noOccasion.validation.acceptedExpectedVariableOccasions).toEqual([]);

    const variableOnly = "La pression artérielle sera mesurée à 3 minutes après injection.";
    const variableOnlyRef = sourceChange({ raw: variableOnly, ref: "variable:only", type: "CANONICAL_VARIABLE", content: "Pression artérielle", role: "MEASUREMENT" });
    const variableOnlyChecked = validate(variableOnly, { changes: [variableOnlyRef], relations: [], temporalQualifications: [], expectedVariableOccasions: [occasion(variableOnly, variableOnlyRef.candidateRef)] });
    expect(variableOnlyChecked.validation.valid).toBe(true);
    expect(variableOnlyChecked.candidate?.changes.some((item) => canonicalProjectObjectType({
      proposedType: item.proposedType ?? null,
      studyRole: item.studyRole ?? null,
    }) === "ENDPOINT")).toBe(false);

    const ambiguous = "Le critère composite dépend de la pression et de la fréquence à 3 minutes.";
    const ambiguousEndpoint = sourceChange({ raw: ambiguous, ref: "endpoint:composite", type: "ENDPOINT", content: "Critère composite", role: "PRIMARY_ENDPOINT" });
    const ambiguousChecked = validate(ambiguous, {
      changes: [
        ambiguousEndpoint,
        sourceChange({ raw: ambiguous, ref: "variable:pressure-ambiguous", type: "CANONICAL_VARIABLE", content: "Pression", role: "MEASUREMENT" }),
        sourceChange({ raw: ambiguous, ref: "variable:rate-ambiguous", type: "CANONICAL_VARIABLE", content: "Fréquence", role: "MEASUREMENT" }),
      ],
      relations: [], temporalQualifications: [], expectedVariableOccasions: [occasion(ambiguous, ambiguousEndpoint.candidateRef)],
    });
    expect(ambiguousChecked.validation.blocks).toEqual(["expectedVariableOccasion:0:EXPECTED_AT_SOURCE_NOT_CANONICAL_VARIABLE"]);
    expect(ambiguousChecked.validation.acceptedExpectedVariableOccasions).toEqual([]);
  });

  it.each(["UNKNOWN", "WITHHELD"] as const)("preserves %s instead of operationally promoting the measured variable", (state) => {
    const raw = `La mesure reste ${state.toLocaleLowerCase("en-US")} à 3 minutes après injection.`;
    const variable = sourceChange({ raw, ref: `variable:${state}`, type: "CANONICAL_VARIABLE", content: "Mesure non établie", role: "MEASUREMENT", epistemicState: state });
    const checked = validate(raw, { changes: [variable], relations: [], temporalQualifications: [], expectedVariableOccasions: [occasion(raw, variable.candidateRef)] });
    expect(checked.validation.valid).toBe(true);
    expect(checked.candidate?.changes[0]?.epistemicState).toBe(state);
    const contribution = contributionFromPersistentDelta({ candidate: checked.candidate!, conversation: conversation(raw), currentProject: null, createdAt: CREATED_AT });
    const review = prepareResearchProjectContributionCandidate(contribution!, null);
    expect(review.canonicalChangeSet.objectChanges[0]?.candidate?.epistemicState).toBe(state);
    expect(review.projectWriteAuthorized).toBe(false);
  });

  it("applies the same binding rule outside imaging", () => {
    const raw = "Le taux de troponine est le critère principal à 3 minutes après injection.";
    const endpoint = sourceChange({ raw, ref: "endpoint:troponin", type: "ENDPOINT", content: "Taux de troponine", role: "PRIMARY_ENDPOINT" });
    const variable = sourceChange({ raw, ref: "variable:troponin", type: "CANONICAL_VARIABLE", content: "Taux de troponine", role: "OUTCOME_ROLE" });
    const checked = validate(raw, { changes: [endpoint, variable], relations: [], temporalQualifications: [], expectedVariableOccasions: [occasion(raw, variable.candidateRef)] });
    expect(checked.validation.valid).toBe(true);
    expect(checked.candidate?.changes.some((item) => item.proposedType === "IMAGING_MODALITY")).toBe(false);
  });

  it("does not retry Terra for deterministic EXPECTED_AT source-type failures", async () => {
    expect(isRecoverablePersistentValidationFailure([
      "expectedVariableOccasion:0:EXPECTED_AT_SOURCE_NOT_CANONICAL_VARIABLE",
    ])).toBe(false);
    expect(isRecoverablePersistentValidationFailure([
      "change:0:CANDIDATE_IDENTITY_CONTENT_TEMPORAL_MISMATCH",
    ])).toBe(true);

    const request = requestFor("La pression artérielle est le critère principal à 3 minutes après injection.");
    const raw = request.conversation.turns[0]!.content;
    const sourceAnchorId = buildPersistentSourceCatalog(request.conversation).anchors[0]!.anchorId;
    const endpointRef = "endpoint:pressure";
    const invalidOccasion = occasion(raw, endpointRef);
    const { sourceText: _sourceText, ...anchoredInvalidOccasion } = invalidOccasion;
    const invalid = {
      changes: [commonChange({ sourceAnchorId, candidateRef: endpointRef, semanticIdentity: endpointRef, proposedType: "ENDPOINT", content: "Pression artérielle", studyRole: "PRIMARY_ENDPOINT" })],
      relations: [], temporalQualifications: [],
      expectedVariableOccasions: [{ ...anchoredInvalidOccasion, sourceAnchorId }],
    };
    const endpoints: string[] = [];
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      endpoints.push(String(url));
      if (String(url).startsWith("https://api.openai.com/v1/responses")) {
        return new Response(JSON.stringify({ id: "openai:invalid-binding", model: "gpt-5.6-terra", status: "completed", output_text: JSON.stringify(invalid) }), { status: 200 });
      }
      return new Response(JSON.stringify({ error: { status: "UNAVAILABLE", message: "offline HOW" } }), { status: 503 });
    }) as unknown as typeof fetch;
    await executeProtocolDesignerBridge({ body: request, apiKey: "offline-gemini-key", openAiApiKey: "offline-openai-key", fetchImpl });
    expect(endpoints.filter((url) => url.startsWith("https://api.openai.com/v1/responses"))).toHaveLength(1);
  });

  it("makes the output contract explicit without adding an endpoint-variable relation", () => {
    expect(PERSISTENT_DELTA_SYSTEM_INSTRUCTION).toContain("un ENDPOINT portant PRIMARY_ENDPOINT et une CANONICAL_VARIABLE portant la quantité mesurée");
    expect(PERSISTENT_DELTA_SYSTEM_INSTRUCTION).toContain("Référence exclusivement le candidateRef de cette CANONICAL_VARIABLE");
  });
});
