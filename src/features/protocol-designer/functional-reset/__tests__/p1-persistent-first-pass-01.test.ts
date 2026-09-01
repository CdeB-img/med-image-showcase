import { describe, expect, it, vi } from "vitest";
import {
  executeProtocolDesignerBridge,
  isRecoverablePersistentValidationFailure,
} from "../../../../../api/protocol-designer-bridge";
import {
  buildPersistentSourceCatalog,
  contributionFromPersistentDelta,
  materializePersistentSourceAnchors,
  validatePersistentProjectDelta,
  type PersistentProjectDeltaWireCandidate,
  type ProductBridgeRequest,
  type ProductBridgeResponse,
} from "@/features/protocol-designer/product-bridge";
import {
  confirmResearchProjectContribution,
  ensureCanonicalProjectState,
  prepareResearchProjectContributionCandidate,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation/contracts";

const PROJECT_ID = "research-project:p1-persistent-first-pass-01";
const ACQUISITION_REF = "acquisition:irm-initial";
const IRM_TIMING_REF = "timing:irm-initial";
const FOLLOW_UP_REF = "candidate:visit:clinical-follow-up-6-months";
const EXACT_WITNESS = "finalement je voudrais que l’IRM de J7 soit réalisée entre J5 et J8 et ajouter un suivi clinique à 6 mois";
const authority = {
  actorRef: "p1-persistent-first-pass-01:researcher",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const conversation = (raw: string, suffix: string): ScientificInterpretationConversation => ({
  conversationId: `conversation:p1-persistent-first-pass-01:${suffix}`,
  language: "fr",
  turns: [{
    turnId: `turn:p1-persistent-first-pass-01:${suffix}`,
    role: "USER",
    content: raw,
    createdAt: "2026-09-02T08:00:00.000Z",
  }],
});

const emptyWire = (): PersistentProjectDeltaWireCandidate => ({
  changes: [],
  relations: [],
  temporalQualifications: [],
  expectedVariableOccasions: [],
});

const temporalAnchor = (lowerBound: number, upperBound: number) => ({
  kind: lowerBound === upperBound ? "TIMEPOINT" as const : "WINDOW" as const,
  direction: "AT" as const,
  unit: "DAY",
  offset: lowerBound === upperBound ? lowerBound : null,
  lowerBound,
  upperBound,
  relativeEventLabel: null,
  tolerance: null,
  reference: { status: "UNKNOWN" as const, unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" as const },
});

const checkedContribution = (
  current: ResearchProjectOwnerProjection | null,
  raw: string,
  suffix: string,
  wire: PersistentProjectDeltaWireCandidate,
) => {
  const context = conversation(raw, suffix);
  const checked = validatePersistentProjectDelta(wire, raw, current, context);
  expect(checked.validation.blocks).toEqual([]);
  expect(checked.candidate).not.toBeNull();
  return contributionFromPersistentDelta({
    candidate: checked.candidate!,
    conversation: context,
    currentProject: current,
    createdAt: "2026-09-02T08:01:00.000Z",
  })!;
};

const projectWithInitialIrmAtDay7 = () => {
  const raw = "Une acquisition IRM initiale est prévue à J7.";
  const wire = emptyWire();
  wire.changes = [{
    operation: "ADD",
    sourceText: raw,
    targetSectionId: "IMAGING",
    candidateRef: ACQUISITION_REF,
    semanticIdentity: ACQUISITION_REF,
    proposedType: "ACQUISITION",
    content: "Acquisition IRM initiale",
    polarity: "AFFIRMED",
    epistemicStatus: "EXPLICIT_USER_STATED",
    epistemicState: "KNOWN",
    assertionKind: "USER_STATED",
    evidenceRefs: [],
  }];
  wire.temporalQualifications = [{
    operation: "ADD",
    qualificationId: IRM_TIMING_REF,
    sourceText: raw,
    subjectProjectRef: ACQUISITION_REF,
    temporalRole: "ACQUISITION_TIME",
    anchor: temporalAnchor(7, 7),
    assertionKind: "USER_STATED",
    evidenceRefs: [],
  }];
  return confirmResearchProjectContribution({
    contribution: checkedContribution(null, raw, "initial-project", wire),
    current: null,
    projectId: PROJECT_ID,
    authority,
    confirmedAt: "2026-09-02T08:02:00.000Z",
  });
};

const requestFor = (
  raw: string,
  currentProject: ResearchProjectOwnerProjection,
  suffix: string,
): ProductBridgeRequest => ({
  apiVersion: "1.0.0",
  conversation: conversation(raw, suffix),
  currentProject,
  evaluatePersistentDelta: true,
});

const sourceAnchor = (request: ProductBridgeRequest, text: string) => {
  const catalog = buildPersistentSourceCatalog(request.conversation);
  return catalog.anchors.find((anchor) => anchor.exactText.includes(text) && anchor.fragmentKind !== "FULL_TURN")
    ?? catalog.anchors.find((anchor) => anchor.exactText.includes(text))!;
};

const visitArgs = (request: ProductBridgeRequest, content = "Visite de contrôle") => ({
  changes: [{
    operation: "ADD",
    sourceAnchorId: sourceAnchor(request, content.toLocaleLowerCase("fr-FR").includes("6 mois") ? "suivi clinique" : "visite de contrôle").anchorId,
    targetSectionId: "TEMPORALITY",
    candidateRef: content.toLocaleLowerCase("fr-FR").includes("6 mois") ? FOLLOW_UP_REF : "candidate:visit:control",
    semanticIdentity: content.toLocaleLowerCase("fr-FR").includes("6 mois") ? "VISIT:suivi clinique 6 mois" : "VISIT:controle",
    proposedType: "VISIT",
    content,
    polarity: "AFFIRMED",
    epistemicStatus: "EXPLICIT_USER_STATED",
    epistemicState: "KNOWN",
    assertionKind: "USER_STATED",
    evidenceRefs: [],
  }],
  relations: [],
  temporalQualifications: [],
  expectedVariableOccasions: [],
});

const exactWitnessArgs = (request: ProductBridgeRequest) => ({
  changes: [{
    operation: "ADD",
    sourceAnchorId: sourceAnchor(request, "suivi clinique à 6 mois").anchorId,
    targetSectionId: "TEMPORALITY",
    candidateRef: FOLLOW_UP_REF,
    semanticIdentity: "VISIT:suivi clinique 6 mois",
    proposedType: "VISIT",
    content: "Suivi clinique à 6 mois",
    polarity: "AFFIRMED",
    epistemicStatus: "EXPLICIT_USER_STATED",
    epistemicState: "KNOWN",
    assertionKind: "USER_STATED",
    evidenceRefs: [],
  }],
  relations: [],
  temporalQualifications: [{
    operation: "REPLACE",
    qualificationId: IRM_TIMING_REF,
    sourceAnchorId: sourceAnchor(request, "IRM de J7").anchorId,
    subjectProjectRef: ACQUISITION_REF,
    temporalRole: "ACQUISITION_TIME",
    anchor: temporalAnchor(5, 8),
    assertionKind: "USER_STATED",
    evidenceRefs: [],
  }],
  expectedVariableOccasions: [],
});

const malformedCrossBoundWitnessArgs = (request: ProductBridgeRequest) => {
  const valid = exactWitnessArgs(request);
  return {
    ...valid,
    changes: [{ ...valid.changes[0], content: "IRM de suivi : J5–J8" }],
  };
};

const jsonResponse = (body: unknown, headers?: Record<string, string>) => new Response(JSON.stringify(body), {
  status: 200,
  headers: { "content-type": "application/json", ...headers },
});

const fetchSequence = (extractions: unknown[]) => {
  let extractionIndex = 0;
  return vi.fn(async (url: string | URL | Request) => {
    if (String(url).includes("generativelanguage.googleapis.com")) {
      return jsonResponse({
        candidates: [{ content: { parts: [{ text: "Réponse conversationnelle conservée." }] } }],
        responseId: "gemini:first-pass",
      });
    }
    const index = extractionIndex++;
    return jsonResponse({
      id: `openai:persistent-attempt:${index + 1}`,
      model: "gpt-5.6-terra-2026-08-01",
      status: "completed",
      output_text: JSON.stringify(extractions[index]),
      usage: { input_tokens: 100, output_tokens: 50, total_tokens: 150 },
    }, { "x-request-id": `request:persistent-attempt:${index + 1}` });
  }) as unknown as typeof fetch;
};

const execute = async (request: ProductBridgeRequest, extractions: unknown[]) => executeProtocolDesignerBridge({
  body: request,
  apiKey: "test-gemini-key",
  openAiApiKey: "test-openai-key",
  fetchImpl: fetchSequence(extractions),
  now: () => Date.parse("2026-09-02T08:03:00.000Z"),
});

describe("P1-PERSISTENT-FIRST-PASS-01 — bounded persistent extraction recovery", () => {
  it("A — accepts one clear change on the first extraction attempt", async () => {
    const project = projectWithInitialIrmAtDay7();
    const request = requestFor("Ajouter une visite de contrôle.", project, "single-change");
    const result = await execute(request, [visitArgs(request)]);

    expect(result.body).toMatchObject({
      persistentExtraction: { status: "CANDIDATE", recovery: null },
      observability: { calls: 2, extractionAttempts: 1, projectWrites: 0 },
    });
  });

  it("B — accepts two independent explicit changes on the first extraction attempt", async () => {
    const project = projectWithInitialIrmAtDay7();
    const raw = "Ajouter une visite de contrôle, et un objectif de surveillance de la tolérance.";
    const request = requestFor(raw, project, "two-intent");
    const args = visitArgs(request);
    args.changes.push({
      ...args.changes[0],
      sourceAnchorId: sourceAnchor(request, "objectif de surveillance").anchorId,
      targetSectionId: "ANALYSIS",
      candidateRef: "candidate:objective:tolerance",
      semanticIdentity: "OBJECTIVE:surveillance-tolerance",
      proposedType: "OBJECTIVE",
      content: "Surveiller la tolérance",
    });
    const result = await execute(request, [args]);
    const response = result.body as ProductBridgeResponse;

    expect(response.persistentExtraction).toMatchObject({ status: "CANDIDATE", recovery: null });
    expect(response.persistentExtraction.candidate?.changes).toHaveLength(2);
    expect(response.observability).toMatchObject({ calls: 2, extractionAttempts: 1, projectWrites: 0 });
  });

  it("C — recovers the exact Production witness inside its first user submission", async () => {
    const project = projectWithInitialIrmAtDay7();
    const before = JSON.stringify(project);
    const request = requestFor(EXACT_WITNESS, project, "exact-witness-first-submission");
    const result = await execute(request, [malformedCrossBoundWitnessArgs(request), exactWitnessArgs(request)]);
    const response = result.body as ProductBridgeResponse;

    expect(response.persistentExtraction).toMatchObject({
      status: "CANDIDATE",
      recovery: {
        attempted: true,
        reason: "RECOVERABLE_PROVIDER_OUTPUT_VALIDATION_FAILURE",
        triggerBlocks: ["change:0:CANDIDATE_IDENTITY_CONTENT_TEMPORAL_MISMATCH"],
        outcome: "CANDIDATE",
        firstProviderArtifact: { providerResponseId: "openai:persistent-attempt:1" },
      },
    });
    expect(response.observability).toMatchObject({ calls: 3, extractionAttempts: 2, projectWrites: 0 });
    expect(response.observability.extractionUsage?.total_tokens).toBe(300);
    expect(JSON.stringify(project)).toBe(before);

    const candidate = prepareResearchProjectContributionCandidate(response.persistentExtraction.contribution!, project);
    expect(candidate.humanReviewProjection).toMatchObject({ status: "COMPLETE", missingChangeRefs: [] });
    expect(candidate.canonicalChangeSet.objectChanges).toEqual([
      expect.objectContaining({ candidate: expect.objectContaining({ objectType: "VISIT", content: "Suivi clinique à 6 mois" }) }),
    ]);
    expect(candidate.canonicalChangeSet.temporalQualificationChanges).toEqual([
      expect.objectContaining({ candidate: expect.objectContaining({ anchor: expect.objectContaining({ lowerBound: 5, upperBound: 8 }) }) }),
    ]);

    const adopted = confirmResearchProjectContribution({
      contribution: response.persistentExtraction.contribution!,
      current: project,
      projectId: project.projectId,
      authority,
      confirmedAt: "2026-09-02T08:04:00.000Z",
      reviewedProjection: candidate.humanReviewProjection,
    });
    const canonical = ensureCanonicalProjectState(adopted);
    expect(canonical.objects).toEqual(expect.arrayContaining([
      expect.objectContaining({ objectType: "VISIT", content: "Suivi clinique à 6 mois", actuality: "CURRENT" }),
    ]));
    expect(canonical.temporalQualifications).toEqual(expect.arrayContaining([
      expect.objectContaining({ qualificationId: IRM_TIMING_REF, anchor: expect.objectContaining({ lowerBound: 5, upperBound: 8 }) }),
    ]));
  });

  it("D — continues to reject a cross-bound candidate fail-closed", () => {
    const project = projectWithInitialIrmAtDay7();
    const request = requestFor(EXACT_WITNESS, project, "cross-bound-direct-validation");
    const catalog = buildPersistentSourceCatalog(request.conversation);
    const materialized = materializePersistentSourceAnchors({
      value: malformedCrossBoundWitnessArgs(request),
      catalog,
      currentUserTurn: { turnId: request.conversation.turns[0]!.turnId, content: EXACT_WITNESS },
    });
    const checked = validatePersistentProjectDelta(materialized.value, EXACT_WITNESS, project, request.conversation);

    expect(checked.validation.blocks).toEqual(["change:0:CANDIDATE_IDENTITY_CONTENT_TEMPORAL_MISMATCH"]);
    expect(checked.candidate).toBeNull();
  });

  it("E — retries once after a provider selects an invalid source anchor", async () => {
    const project = projectWithInitialIrmAtDay7();
    const request = requestFor("Ajouter une visite de contrôle.", project, "invalid-anchor-recovery");
    const valid = visitArgs(request);
    const invalid = { ...valid, changes: [{ ...valid.changes[0], sourceAnchorId: "source-anchor:invented" }] };
    const result = await execute(request, [invalid, valid]);

    expect(result.body).toMatchObject({
      persistentExtraction: {
        status: "CANDIDATE",
        recovery: {
          triggerBlocks: ["change:0:SOURCE_ANCHOR_ID_INVALID"],
          outcome: "CANDIDATE",
        },
      },
      observability: { calls: 3, extractionAttempts: 2, projectWrites: 0 },
    });
  });

  it("F — stops after one bounded recovery when both provider outputs remain invalid", async () => {
    const project = projectWithInitialIrmAtDay7();
    const before = JSON.stringify(project);
    const request = requestFor(EXACT_WITNESS, project, "bounded-unrecoverable");
    const malformed = malformedCrossBoundWitnessArgs(request);
    const result = await execute(request, [malformed, malformed]);

    expect(result.body).toMatchObject({
      persistentExtraction: {
        status: "BLOCKED",
        contribution: null,
        failure: {
          code: "PERSISTENT_VALIDATION_BLOCKED",
          details: ["change:0:CANDIDATE_IDENTITY_CONTENT_TEMPORAL_MISMATCH"],
        },
        recovery: { attempted: true, outcome: "BLOCKED" },
      },
      observability: { calls: 3, extractionAttempts: 2, projectWrites: 0 },
    });
    expect(isRecoverablePersistentValidationFailure(["SOURCE_CATALOG_DIGEST_MISMATCH"])).toBe(false);
    expect(JSON.stringify(project)).toBe(before);
  });

  it("G — keeps an identical later user retry free of hidden recovery state", async () => {
    const project = projectWithInitialIrmAtDay7();
    const firstRequest = requestFor(EXACT_WITNESS, project, "legitimate-failure");
    const malformed = malformedCrossBoundWitnessArgs(firstRequest);
    const first = await execute(firstRequest, [malformed, malformed]);
    expect(first.body).toMatchObject({ persistentExtraction: { status: "BLOCKED" } });

    const retryRequest = requestFor(EXACT_WITNESS, project, "identical-user-retry");
    const retry = await execute(retryRequest, [exactWitnessArgs(retryRequest)]);
    expect(retry.body).toMatchObject({
      persistentExtraction: { status: "CANDIDATE", recovery: null },
      observability: { calls: 2, extractionAttempts: 1, projectWrites: 0 },
    });
    expect((retry.body as ProductBridgeResponse).persistentExtraction.candidate?.changes[0]?.content)
      .toBe("Suivi clinique à 6 mois");
  });
});
