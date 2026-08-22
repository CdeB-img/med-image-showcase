import { describe, expect, it, vi } from "vitest";
import { buildGeminiSemanticCriticProviderPayload } from "../../../../../api/scientific-interpretation-provider";
import {
  confirmResearchProjectContribution,
  prepareResearchProjectContributionCandidate,
  projectContextForScientificInterpretation,
} from "@/features/research-project-construction";
import { resolveScientificInterpretationProductRoute } from "@/features/scientific-interpretation/cognitive-boundary";
import type {
  ScientificContributionItem,
  ScientificInterpretationContributionEnvelope,
  ScientificInterpretationConversation,
} from "@/features/scientific-interpretation/contracts";
import {
  buildSemanticCriticGroundingContext,
  buildSemanticCriticResult,
  SEMANTIC_CRITIC_SYSTEM_PROMPT,
  snapshotSemanticCriticCandidate,
  type SemanticCriticFinding,
  type SemanticCriticGroundingContext,
  type SemanticCriticResult,
} from "@/features/scientific-interpretation/semantic-critic";
import {
  buildFunctionalResetQueryNavigation,
  restateFunctionalResetQueryAfterNoChange,
} from "@/features/query-navigation";
import {
  evaluateFunctionalResetSemanticIntegration,
  MAX_FUNCTIONAL_RESET_AUTO_REPAIR_COUNT,
  semanticRepairContextFromCritic,
} from "../semantic-integration";
import {
  COLCHICINE_INITIAL,
  makeFunctionalResetContribution,
  makeFunctionalResetRuntimeResponse,
} from "./functional-reset-fixtures";

const RAW_PRIMARY = "La taille de l’infarctus sera le critère principal.";
const RAW_MEASURED = "La taille de l’infarctus sera mesurée.";
const TURN_ID = "turn:fr04ar1";
const authority = {
  actorRef: "fr04ar1:researcher",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const sourceProject = () => {
  const contribution = makeFunctionalResetRuntimeResponse(makeFunctionalResetContribution([{
    turnId: "turn:project-seed",
    role: "USER",
    content: COLCHICINE_INITIAL,
  }])).contribution!;
  return confirmResearchProjectContribution({
    contribution,
    current: null,
    projectId: "project:fr04ar1",
    authority,
    confirmedAt: "2026-08-22T16:00:00.000Z",
  });
};

const referencedMeasurement = (project: ReturnType<typeof sourceProject>) => project.sections
  .flatMap((section) => section.elements)
  .find((element) => element.content.toLocaleLowerCase("fr-FR").includes("taille de l’infarctus"))!;

const contributionWithReference = (input: {
  raw: string;
  project: ReturnType<typeof sourceProject>;
  studyRole: string | null;
  semanticFunction?: ScientificContributionItem["semanticFunction"];
}) => {
  const seed = makeFunctionalResetRuntimeResponse(makeFunctionalResetContribution([{
    turnId: TURN_ID,
    role: "USER",
    content: input.raw,
  }])).contribution!;
  const existing = referencedMeasurement(input.project);
  const item: ScientificContributionItem = {
    ...seed.scientificContent.candidateObjects[0],
    itemId: "reference:infarct-size",
    semanticIdentity: "reference:infarct-size",
    proposedType: "MEASURED_VARIABLE",
    content: existing.content,
    studyRole: input.studyRole,
    semanticFunction: input.semanticFunction ?? (input.studyRole ? "ROLE_ASSIGNMENT" : "REFERENCE"),
    evidenceBasis: "EXPLICIT",
    projectDisposition: "PROJECT_CANDIDATE",
    referencedProjectElementIds: [existing.elementId],
    relatedItemIds: [],
    epistemicBoundary: {
      ...seed.scientificContent.candidateObjects[0].epistemicBoundary,
      sourceTurnIds: [TURN_ID],
      sourceText: input.raw,
    },
  };
  return {
    ...seed,
    identity: {
      ...seed.identity,
      contributionId: `contribution:fr04ar1:${input.studyRole ?? "no-role"}:${input.raw.length}`,
      contributionDigest: `digest:fr04ar1:${input.studyRole ?? "no-role"}:${input.raw.length}`,
    },
    source: {
      ...seed.source,
      originalRequest: input.raw,
      turns: [{ turnId: TURN_ID, role: "USER" as const, content: input.raw }],
      sourceRefs: [TURN_ID],
    },
    scientificContent: {
      ...seed.scientificContent,
      normalizedUnderstanding: input.raw,
      explicitStatements: [],
      candidateObjects: [item],
      candidateRelations: [],
      inferredContext: [],
      contextualCandidates: [],
      negationsAndConstraints: [],
      temporalElements: [],
      ambiguities: [],
      unknowns: [],
      missingInformation: [],
      correctionsAndSupersessions: [],
      openDecisions: [],
      clarificationNeeds: [],
    },
    cognitiveBoundary: {
      ...seed.cognitiveBoundary!,
      domainDecision: {
        ...seed.cognitiveBoundary!.domainDecision,
        inScopeSegments: [input.raw],
      },
      semanticUnderstanding: {
        summary: input.raw,
        elements: [item],
        relations: [],
      },
    },
  } satisfies ScientificInterpretationContributionEnvelope;
};

const conversationFor = (
  raw: string,
  project: ReturnType<typeof sourceProject>,
  withQuery = false,
): ScientificInterpretationConversation => ({
  conversationId: "conversation:fr04ar1",
  language: "fr",
  turns: [
    { turnId: "turn:noxia", role: "NOXIA", content: "Quelle précision souhaitez-vous apporter ?" },
    { turnId: TURN_ID, role: "USER", content: raw },
  ],
  projectContext: projectContextForScientificInterpretation(project),
  ...(withQuery ? {
    interactionContext: {
      interactionRef: "qry:presentation:fr04ar1",
      sourceActionRef: "qry:action:fr04ar1",
      owner: "QUERY_NAVIGATION",
      purpose: "Préciser l’analyse principale.",
      expectedResponseKind: "QRY_INFORMATION_RESPONSE" as const,
      targetRefs: ["project-section:ANALYSIS"],
      informationNeedRefs: ["project-need:ANALYSIS"],
      projectRef: project.projectId,
      projectVersion: project.versionId,
      projectDigest: project.projectDigest,
      currentQuestion: "Quelle analyse principale souhaitez-vous définir ?",
      questionRationale: "L’analyse principale reste inconnue.",
      scopeSectionIds: ["ANALYSIS"],
    },
  } : {}),
});

const providerFailure = (input: {
  category?: SemanticCriticFinding["category"];
  failureStage?: SemanticCriticFinding["failureStage"];
  raw?: string;
}) => ({
  verdict: "FAILED" as const,
  findings: [{
    findingId: "finding:raw-grounded-loss",
    category: input.category ?? "ROLE_MISMATCH" as const,
    message: "Le message brut attribue un rôle absent de la compréhension intermédiaire.",
    understandingElementIds: ["reference:infarct-size"],
    candidateChangeIds: [],
    failureStage: input.failureStage ?? "INTERPRETER" as const,
    rawEvidence: [{ turnId: TURN_ID, quote: input.raw ?? RAW_PRIMARY }],
    repairHint: "Relire le rôle explicitement attribué à la mesure référencée.",
  }],
});

const criticResult = (input: {
  status: "FAITHFUL" | "FAILED";
  stage?: SemanticCriticFinding["failureStage"];
  raw?: string;
}): SemanticCriticResult => ({
  contract: "NOXIA_SEMANTIC_INTEGRATION_CRITIC",
  contractVersion: "1.2.0",
  status: input.status,
  authoritative: false,
  groundingDigest: "grounding:fr04ar1",
  understandingDigest: "understanding:fr04ar1",
  candidateDigest: "candidate:fr04ar1",
  findings: input.status === "FAILED" ? [{
    findingId: "finding:fr04ar1",
    category: "ROLE_MISMATCH",
    message: "Explicit role lost by the interpreter.",
    understandingElementIds: ["reference:infarct-size"],
    candidateChangeIds: [],
    failureStage: input.stage ?? "INTERPRETER",
    rawEvidence: [{ turnId: TURN_ID, quote: input.raw ?? RAW_PRIMARY }],
    repairHint: "Re-read the explicit role without adding scientific content.",
    source: "LLM_SEMANTIC_CRITIC",
  }] : [],
  repairAllowed: input.status === "FAILED",
  provider: "TEST",
  model: "TEST",
  promptDigest: "prompt:fr04ar1",
  rawOutputRef: "raw:fr04ar1",
  technicalMessage: null,
});

const apiResponse = (critic: SemanticCriticResult) => ({
  apiVersion: "1.0.0" as const,
  critic,
  providerAttempts: 1,
  retries: 0,
  invalidStructuredOutputs: 0,
});

describe("FUNCTIONAL-RESET-04A-R1 — raw-message-grounded semantic critic", () => {
  it("FR04AR1-C01 — Critic receives raw user message", () => {
    const project = sourceProject();
    const contribution = contributionWithReference({ raw: RAW_PRIMARY, project, studyRole: null });
    const groundingContext = buildSemanticCriticGroundingContext(conversationFor(RAW_PRIMARY, project));
    const payload = buildGeminiSemanticCriticProviderPayload({
      contribution,
      groundingContext,
      candidate: snapshotSemanticCriticCandidate(prepareResearchProjectContributionCandidate(contribution, project)),
    });
    const providerInput = JSON.parse(payload.contents[0].parts[0].text);
    expect(providerInput.rawUserMessage).toMatchObject({ role: "USER", content: RAW_PRIMARY });
  });

  it("FR04AR1-C02 — Critic receives relevant conversational context", () => {
    const project = sourceProject();
    const context = buildSemanticCriticGroundingContext(conversationFor(RAW_PRIMARY, project, true));
    expect(context.relevantConversationTurns.map((turn) => turn.role)).toEqual(["NOXIA", "USER"]);
    expect(context.projectContext?.elements.length).toBeGreaterThan(0);
    expect(context.interactionContext).toMatchObject({ owner: "QUERY_NAVIGATION", currentQuestion: expect.any(String) });
  });

  it("FR04AR1-C03 — Initial Semantic Understanding is not treated as critic ground truth", () => {
    expect(SEMANTIC_CRITIC_SYSTEM_PROMPT).toMatch(/NONAUTHORITATIVE HYPOTHESIS|NON_AUTHORITATIVE HYPOTHESIS/);
    expect(SEMANTIC_CRITIC_SYSTEM_PROMPT).toMatch(/Never approve merely because/);
  });

  it("FR04AR1-C04 — Critic detects a role explicit in raw text but absent from Understanding", () => {
    const project = sourceProject();
    const contribution = contributionWithReference({ raw: RAW_PRIMARY, project, studyRole: null });
    const groundingContext = buildSemanticCriticGroundingContext(conversationFor(RAW_PRIMARY, project));
    const candidate = snapshotSemanticCriticCandidate(prepareResearchProjectContributionCandidate(contribution, project));
    const result = buildSemanticCriticResult({ contribution, groundingContext, candidate, providerResult: providerFailure({}), provider: "TEST", model: "TEST", rawOutputRef: "raw:test" });
    expect(result).toMatchObject({ status: "FAILED", authoritative: false });
    expect(result.findings).toEqual(expect.arrayContaining([expect.objectContaining({ category: "ROLE_MISMATCH", failureStage: "INTERPRETER" })]));
  });

  it("FR04AR1-C05 — Critic detects explicit information lost by Interpreter before compilation", () => {
    const project = sourceProject();
    const contribution = contributionWithReference({ raw: RAW_PRIMARY, project, studyRole: null });
    const groundingContext = buildSemanticCriticGroundingContext(conversationFor(RAW_PRIMARY, project));
    const result = buildSemanticCriticResult({
      contribution,
      groundingContext,
      candidate: snapshotSemanticCriticCandidate(prepareResearchProjectContributionCandidate(contribution, project)),
      providerResult: providerFailure({ category: "INFORMATION_LOST" }),
      provider: "TEST",
      model: "TEST",
      rawOutputRef: "raw:test",
    });
    expect(result.findings.some((finding) => finding.category === "INFORMATION_LOST" && finding.rawEvidence[0]?.quote === RAW_PRIMARY)).toBe(true);
  });

  it("FR04AR1-C06 — Critic can fail a NO_CHANGE candidate when raw message contains a new role", () => {
    const project = sourceProject();
    const contribution = contributionWithReference({ raw: RAW_PRIMARY, project, studyRole: null });
    const candidate = prepareResearchProjectContributionCandidate(contribution, project);
    expect(candidate.changeSet.status).toBe("NO_NET_CHANGE");
    const result = buildSemanticCriticResult({
      contribution,
      groundingContext: buildSemanticCriticGroundingContext(conversationFor(RAW_PRIMARY, project)),
      candidate: snapshotSemanticCriticCandidate(candidate),
      providerResult: providerFailure({}),
      provider: "TEST",
      model: "TEST",
      rawOutputRef: "raw:test",
    });
    expect(result.status).toBe("FAILED");
  });

  it("FR04AR1-C07 — Critic does not invent a role absent from raw message", () => {
    const project = sourceProject();
    const contribution = contributionWithReference({ raw: RAW_MEASURED, project, studyRole: null });
    const result = buildSemanticCriticResult({
      contribution,
      groundingContext: buildSemanticCriticGroundingContext(conversationFor(RAW_MEASURED, project)),
      candidate: snapshotSemanticCriticCandidate(prepareResearchProjectContributionCandidate(contribution, project)),
      providerResult: { verdict: "FAITHFUL", findings: [] },
      provider: "TEST",
      model: "TEST",
      rawOutputRef: "raw:test",
    });
    expect(result.status).toBe("FAITHFUL");
    expect(result.findings).toEqual([]);
  });

  it("FR04AR1-C08 — One repair can recover interpreter-level omission", async () => {
    const project = sourceProject();
    const bad = contributionWithReference({ raw: RAW_PRIMARY, project, studyRole: null });
    const corrected = contributionWithReference({ raw: RAW_PRIMARY, project, studyRole: "PRIMARY_ENDPOINT" });
    const requestCritic = vi.fn()
      .mockResolvedValueOnce(apiResponse(criticResult({ status: "FAILED" })))
      .mockResolvedValueOnce(apiResponse(criticResult({ status: "FAITHFUL" })));
    const repairInterpretation = vi.fn().mockResolvedValue(corrected);
    const result = await evaluateFunctionalResetSemanticIntegration({
      contribution: bad,
      groundingContext: buildSemanticCriticGroundingContext(conversationFor(RAW_PRIMARY, project)),
      candidate: prepareResearchProjectContributionCandidate(bad, project),
      currentProject: project,
      requestCritic,
      repairInterpretation,
    });
    expect(result).toMatchObject({ status: "READY_FOR_HUMAN_REVIEW", repairCount: 1, contribution: corrected });
    expect(result.candidate.changeSet.changes.some((change) => change.proposedElement?.semanticRoles?.includes("PRIMARY_ENDPOINT"))).toBe(true);
    expect(repairInterpretation).toHaveBeenCalledTimes(1);
  });

  it("FR04AR1-C09 — Second failure blocks review", async () => {
    const project = sourceProject();
    const bad = contributionWithReference({ raw: RAW_PRIMARY, project, studyRole: null });
    const requestCritic = vi.fn().mockResolvedValue(apiResponse(criticResult({ status: "FAILED" })));
    const repairInterpretation = vi.fn().mockResolvedValue(bad);
    const result = await evaluateFunctionalResetSemanticIntegration({
      contribution: bad,
      groundingContext: buildSemanticCriticGroundingContext(conversationFor(RAW_PRIMARY, project)),
      candidate: prepareResearchProjectContributionCandidate(bad, project),
      currentProject: project,
      requestCritic,
      repairInterpretation,
    });
    expect(result).toMatchObject({ status: "BLOCKED_FOR_CLARIFICATION", repairCount: 1, projectWriteAuthorized: false });
    expect(requestCritic).toHaveBeenCalledTimes(2);
  });

  it("FR04AR1-C10 — No retry-until-pass behavior", async () => {
    const project = sourceProject();
    const bad = contributionWithReference({ raw: RAW_PRIMARY, project, studyRole: null });
    const requestCritic = vi.fn().mockResolvedValue(apiResponse(criticResult({ status: "FAILED" })));
    const repairInterpretation = vi.fn().mockResolvedValue(bad);
    await evaluateFunctionalResetSemanticIntegration({
      contribution: bad,
      groundingContext: buildSemanticCriticGroundingContext(conversationFor(RAW_PRIMARY, project)),
      candidate: prepareResearchProjectContributionCandidate(bad, project),
      currentProject: project,
      requestCritic,
      repairInterpretation,
    });
    expect(MAX_FUNCTIONAL_RESET_AUTO_REPAIR_COUNT).toBe(1);
    expect(repairInterpretation).toHaveBeenCalledTimes(1);
    expect(requestCritic).toHaveBeenCalledTimes(2);
  });

  it("FR04AR1-C11 — CJP is handled without lexical hardcoding", () => {
    expect(SEMANTIC_CRITIC_SYSTEM_PROMPT).not.toMatch(/\bCJP\b/);
    expect(evaluateFunctionalResetSemanticIntegration.toString()).not.toMatch(/\bCJP\b/);
    expect(semanticRepairContextFromCritic.toString()).not.toMatch(/\bCJP\b/);
  });

  it("FR04AR1-C12 — Equivalent natural-language primary-role statement works", () => {
    const project = sourceProject();
    const contribution = contributionWithReference({ raw: "Cette mesure sera mon critère principal.", project, studyRole: "PRIMARY_ENDPOINT" });
    const candidate = prepareResearchProjectContributionCandidate(contribution, project);
    expect(candidate.changeSet.effectiveChangeCount).toBe(1);
    expect(candidate.changeSet.changes).toEqual(expect.arrayContaining([expect.objectContaining({
      operation: "REPLACE",
      proposedElement: expect.objectContaining({ semanticRoles: expect.arrayContaining(["PRIMARY_ENDPOINT"]) }),
    })]));
    expect(candidate.changeSet.changes.filter((change) => change.operation === "ADD")).toHaveLength(0);
  });

  it("FR04AR1-C13 — Exclusion role remains correct", () => {
    const project = sourceProject();
    const seed = contributionWithReference({ raw: "Critère d’exclusion : femme enceinte.", project, studyRole: "EXCLUSION", semanticFunction: "EXCLUSION" });
    const pregnancy = {
      ...seed.scientificContent.candidateObjects[0],
      itemId: "criterion:pregnancy",
      semanticIdentity: "criterion:pregnancy",
      proposedType: "POPULATION_CRITERION",
      content: "femme enceinte",
      referencedProjectElementIds: [],
    };
    const contribution = {
      ...seed,
      scientificContent: { ...seed.scientificContent, candidateObjects: [pregnancy] },
      cognitiveBoundary: { ...seed.cognitiveBoundary!, semanticUnderstanding: { summary: seed.source.originalRequest, elements: [pregnancy], relations: [] } },
    };
    const candidate = prepareResearchProjectContributionCandidate(contribution, project);
    expect(candidate.changeSet.changes[0]?.proposedElement?.semanticRoles).toContain("EXCLUSION");
  });

  it("FR04AR1-C14 — Domain Gate remains unchanged", () => {
    const project = sourceProject();
    const contribution = contributionWithReference({ raw: "Je veux manger une banane.", project, studyRole: null });
    contribution.cognitiveBoundary!.domainDecision.decision = "OUT_OF_SCOPE";
    contribution.cognitiveBoundary!.dialogueRouting.intent = "OUT_OF_SCOPE";
    expect(resolveScientificInterpretationProductRoute(contribution)).toMatchObject({ disposition: "SCOPE_REJECTED", contributionAllowed: false });
    const scientific = contributionWithReference({ raw: RAW_PRIMARY, project, studyRole: null });
    scientific.cognitiveBoundary!.domainDecision.projectMutationAllowed = false;
    expect(resolveScientificInterpretationProductRoute(scientific)).toMatchObject({ disposition: "SCIENTIFIC_CONTRIBUTION", contributionAllowed: true });
    expect(scientific.decisionBoundary.projectWriteAuthorized).toBe(false);
  });

  it("FR04AR1-C15 — QRY mediation remains unchanged", () => {
    const project = sourceProject();
    const navigation = buildFunctionalResetQueryNavigation({ project, recordedAt: "2026-08-22T16:01:00.000Z" });
    const action = navigation.currentAction?.selectedActionId;
    const mediated = restateFunctionalResetQueryAfterNoChange({
      navigation,
      recordedAt: "2026-08-22T16:02:00.000Z",
      responseMessage: "La comparaison est déjà connue ; précisons la mesure analysée.",
    });
    expect(mediated.owner).toBe("QUERY_NAVIGATION");
    expect(mediated.currentAction?.selectedActionId).toBe(action);
  });

  it("FR04AR1-C16 — Human confirmation remains mandatory", async () => {
    const project = sourceProject();
    const correct = contributionWithReference({ raw: RAW_PRIMARY, project, studyRole: "PRIMARY_ENDPOINT" });
    const result = await evaluateFunctionalResetSemanticIntegration({
      contribution: correct,
      groundingContext: buildSemanticCriticGroundingContext(conversationFor(RAW_PRIMARY, project)),
      candidate: prepareResearchProjectContributionCandidate(correct, project),
      currentProject: project,
      requestCritic: vi.fn().mockResolvedValue(apiResponse(criticResult({ status: "FAITHFUL" }))),
    });
    expect(result).toMatchObject({ status: "READY_FOR_HUMAN_REVIEW", humanConfirmationRequired: true, projectWriteAuthorized: false });
  });

  it("FR04AR1-C17 — Research Project remains sole adopted truth", () => {
    const project = sourceProject();
    const contribution = contributionWithReference({ raw: RAW_PRIMARY, project, studyRole: "PRIMARY_ENDPOINT" });
    const candidate = prepareResearchProjectContributionCandidate(contribution, project);
    expect(project.sections.flatMap((section) => section.elements).some((element) => element.semanticRoles?.includes("PRIMARY_ENDPOINT"))).toBe(false);
    expect(candidate.projectWriteAuthorized).toBe(false);
    const adopted = confirmResearchProjectContribution({ contribution, current: project, projectId: project.projectId, authority, confirmedAt: "2026-08-22T16:03:00.000Z" });
    expect(adopted.owner).toBe("RESEARCH_PROJECT");
    expect(adopted.confirmationDecision.status).toBe("ADOPTED");
  });

  it("FR04AR1-C18 — All FR04A boundary contracts remain represented", () => {
    const project = sourceProject();
    const context: SemanticCriticGroundingContext = buildSemanticCriticGroundingContext(conversationFor(RAW_PRIMARY, project, true));
    expect(context).toMatchObject({
      lifecycle: "EPHEMERAL_TRACEABLE_NON_AUTHORITATIVE",
      rawUserMessage: { role: "USER" },
      interactionContext: { owner: "QUERY_NAVIGATION" },
    });
    expect(context.projectContext?.projectRef).toBe(project.projectId);
  });
});
