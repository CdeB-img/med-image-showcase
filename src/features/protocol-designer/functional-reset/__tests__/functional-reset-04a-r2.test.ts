import { describe, expect, it } from "vitest";
import {
  buildGeminiHybridProviderPayload,
  buildGeminiSemanticCriticProviderPayload,
} from "../../../../../api/scientific-interpretation-provider";
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
  ScientificInterpretationTerminologyResolution,
} from "@/features/scientific-interpretation/contracts";
import { HYBRID_PRIMARY_SYSTEM_PROMPT } from "@/features/scientific-interpretation/hybrid-primary";
import {
  buildSemanticCriticGroundingContext,
  buildSemanticCriticResult,
  SEMANTIC_CRITIC_SYSTEM_PROMPT,
  snapshotSemanticCriticCandidate,
} from "@/features/scientific-interpretation/semantic-critic";
import {
  buildScientificInterpretationTerminologyContext,
  SCIENTIFIC_INTERPRETATION_SUPPORTED_ROLE_TERMINOLOGY,
} from "@/features/scientific-interpretation/terminology-grounding";
import {
  COLCHICINE_INITIAL,
  makeFunctionalResetContribution,
  makeFunctionalResetRuntimeResponse,
} from "./functional-reset-fixtures";

const TURN_ID = "turn:fr04ar2";
const authority = {
  actorRef: "fr04ar2:researcher",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const sourceProject = () => confirmResearchProjectContribution({
  contribution: makeFunctionalResetRuntimeResponse(makeFunctionalResetContribution([{
    turnId: "turn:r2-seed",
    role: "USER",
    content: COLCHICINE_INITIAL,
  }])).contribution!,
  current: null,
  projectId: "project:fr04ar2",
  authority,
  confirmedAt: "2026-08-22T17:00:00.000Z",
});

const measurement = (project: ReturnType<typeof sourceProject>) => project.sections
  .flatMap((section) => section.elements)
  .find((element) => element.content.toLocaleLowerCase("fr-FR").includes("taille de l’infarctus"))!;

const conversationFor = (
  raw: string,
  project: ReturnType<typeof sourceProject>,
  previousTurns: ScientificInterpretationConversation["turns"] = [],
): ScientificInterpretationConversation => ({
  conversationId: "conversation:fr04ar2",
  language: "fr",
  turns: [...previousTurns, { turnId: TURN_ID, role: "USER", content: raw }],
  projectContext: projectContextForScientificInterpretation(project),
});

const resolution = (input: Partial<ScientificInterpretationTerminologyResolution> & Pick<ScientificInterpretationTerminologyResolution, "surfaceForm" | "status">): ScientificInterpretationTerminologyResolution => ({
  resolutionId: `resolution:${input.surfaceForm}`,
  surfaceForm: input.surfaceForm,
  resolvedMeaning: input.resolvedMeaning ?? null,
  status: input.status,
  source: input.source ?? "NONE",
  confidence: input.confidence ?? null,
  alternatives: input.alternatives ?? [],
  semanticRoleCandidate: input.semanticRoleCandidate ?? null,
  referencedProjectElementIds: input.referencedProjectElementIds ?? [],
  understandingElementIds: input.understandingElementIds ?? [],
  sourceTurnIds: input.sourceTurnIds ?? [TURN_ID],
  sourceText: input.sourceText ?? input.surfaceForm,
});

const contributionFor = (input: {
  raw: string;
  project: ReturnType<typeof sourceProject>;
  role: string | null;
  terminology?: ScientificInterpretationTerminologyResolution[];
  semanticFunction?: ScientificContributionItem["semanticFunction"];
}) => {
  const seed = makeFunctionalResetRuntimeResponse(makeFunctionalResetContribution([{
    turnId: TURN_ID,
    role: "USER",
    content: input.raw,
  }])).contribution!;
  const existing = measurement(input.project);
  const item: ScientificContributionItem = {
    ...seed.scientificContent.candidateObjects[0],
    itemId: "reference:r2:measure",
    semanticIdentity: "reference:r2:measure",
    proposedType: "MEASURED_VARIABLE",
    content: existing.content,
    studyRole: input.role,
    semanticFunction: input.semanticFunction ?? (input.role ? "ROLE_ASSIGNMENT" : "REFERENCE"),
    evidenceBasis: "CONTEXTUAL",
    projectDisposition: "PROJECT_CANDIDATE",
    referencedProjectElementIds: [existing.elementId],
    relatedItemIds: [],
    epistemicBoundary: {
      ...seed.scientificContent.candidateObjects[0].epistemicBoundary,
      sourceTurnIds: [TURN_ID],
      sourceText: input.raw,
    },
  };
  const conversation = conversationFor(input.raw, input.project);
  return {
    ...seed,
    identity: {
      ...seed.identity,
      contributionId: `contribution:r2:${input.role ?? "none"}:${input.raw.length}`,
      contributionDigest: `digest:r2:${input.role ?? "none"}:${input.raw.length}`,
    },
    source: { ...seed.source, originalRequest: input.raw, turns: conversation.turns, sourceRefs: [TURN_ID] },
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
      domainDecision: { ...seed.cognitiveBoundary!.domainDecision, inScopeSegments: [input.raw] },
      terminologyGrounding: {
        context: buildScientificInterpretationTerminologyContext(conversation),
        resolutions: input.terminology ?? [],
      },
      semanticUnderstanding: { summary: input.raw, elements: [item], relations: [] },
    },
  } satisfies ScientificInterpretationContributionEnvelope;
};

describe("FUNCTIONAL-RESET-04A-R2 — terminology-grounded semantic understanding", () => {
  it("FR04AR2-C01 — Terminology grounding occurs before final semantic role assignment", () => {
    expect(HYBRID_PRIMARY_SYSTEM_PROMPT.indexOf("Terminology Grounding")).toBeLessThan(HYBRID_PRIMARY_SYSTEM_PROMPT.indexOf("rich Semantic Understanding"));
    const project = sourceProject();
    const payload = buildGeminiHybridProviderPayload(conversationFor("Cette mesure sera mon critère principal.", project));
    const input = JSON.parse(payload.contents[0].parts[0].text);
    expect(input.terminologyContext).toMatchObject({ authoritative: false, scope: "CURRENT_INTERPRETATION_TURN" });
  });

  it("FR04AR2-C02 — Terminology grounding can use Project aliases", () => {
    const project = sourceProject();
    const conversation = conversationFor("La mesure locale sera principale.", project);
    conversation.projectContext!.elements[0] = { ...conversation.projectContext!.elements[0], aliases: ["mesure locale"] };
    const context = buildScientificInterpretationTerminologyContext(conversation);
    expect(context.entries).toEqual(expect.arrayContaining([expect.objectContaining({
      source: "PROJECT",
      surfaceForms: expect.arrayContaining(["mesure locale"]),
      referencedProjectElementIds: [conversation.projectContext!.elements[0].elementId],
    })]));
  });

  it("FR04AR2-C03 — Terminology grounding can use conversation-defined local aliases", () => {
    const project = sourceProject();
    const prior = contributionFor({
      raw: "Dans la suite j’appellerai mesure A la taille de l’infarctus.",
      project,
      role: null,
      terminology: [resolution({
        surfaceForm: "mesure A",
        resolvedMeaning: "taille de l’infarctus à l’IRM",
        status: "RESOLVED_CONVERSATION",
        source: "CONVERSATION_USER_DEFINED",
        referencedProjectElementIds: [measurement(project).elementId],
      })],
    });
    const context = buildScientificInterpretationTerminologyContext(conversationFor("mesure A sera mon critère principal.", project), prior);
    expect(context.entries).toEqual(expect.arrayContaining([expect.objectContaining({ source: "CONVERSATION_USER_DEFINED", surfaceForms: ["mesure A"] })]));
  });

  it("FR04AR2-C04 — Terminology grounding does not create Project truth", () => {
    const project = sourceProject();
    const before = project.projectDigest;
    const context = buildScientificInterpretationTerminologyContext(conversationFor("mesure A", project));
    expect(context).toMatchObject({ authoritative: false, contractNature: "RUNTIME_TERMINOLOGY_CONTEXT_NOT_PD003_OBJECT" });
    expect(project.projectDigest).toBe(before);
  });

  it("FR04AR2-C05 — Known abbreviation can resolve to a role without a lexical compiler hack", () => {
    const project = sourceProject();
    const raw = "L’abréviation locale CP désigne ici le critère principal de cette mesure.";
    const role = contributionFor({
      raw,
      project,
      role: "PRIMARY_ENDPOINT",
      terminology: [resolution({
        surfaceForm: "CP",
        resolvedMeaning: "critère principal",
        status: "RESOLVED_CONVERSATION",
        source: "CONVERSATION_USER_DEFINED",
        semanticRoleCandidate: "PRIMARY_ENDPOINT",
        referencedProjectElementIds: [measurement(project).elementId],
        understandingElementIds: ["reference:r2:measure"],
      })],
    });
    const candidate = prepareResearchProjectContributionCandidate(role, project);
    expect(candidate.changeSet.changes).toEqual([expect.objectContaining({ operation: "REPLACE", proposedElement: expect.objectContaining({ semanticRoles: expect.arrayContaining(["PRIMARY_ENDPOINT"]) }) })]);
    expect(prepareResearchProjectContributionCandidate.toString()).not.toContain("CP");
  });

  it("FR04AR2-C06 — Full phrase and abbreviation can be semantically equivalent", () => {
    const project = sourceProject();
    const full = contributionFor({ raw: "Cette mesure sera mon critère de jugement principal.", project, role: "PRIMARY_ENDPOINT" });
    const abbreviated = contributionFor({
      raw: "CP = cette mesure.",
      project,
      role: "PRIMARY_ENDPOINT",
      terminology: [resolution({ surfaceForm: "CP", resolvedMeaning: "critère de jugement principal", status: "RESOLVED_CONVERSATION", source: "CONVERSATION_USER_DEFINED", semanticRoleCandidate: "PRIMARY_ENDPOINT", understandingElementIds: ["reference:r2:measure"] })],
    });
    const roles = (contribution: ScientificInterpretationContributionEnvelope) => prepareResearchProjectContributionCandidate(contribution, project).changeSet.changes[0]?.proposedElement?.semanticRoles;
    expect(roles(full)).toContain("PRIMARY_ENDPOINT");
    expect(roles(abbreviated)).toContain("PRIMARY_ENDPOINT");
  });

  it("FR04AR2-C07 — Unknown abbreviation remains unresolved", () => {
    const project = sourceProject();
    const contribution = contributionFor({
      raw: "ZXQ = cette mesure.",
      project,
      role: null,
      terminology: [resolution({ surfaceForm: "ZXQ", status: "UNRESOLVED", source: "NONE" })],
    });
    expect(resolveScientificInterpretationProductRoute(contribution)).toMatchObject({
      disposition: "TERMINOLOGY_CLARIFICATION",
      contributionAllowed: false,
      responseMessage: "Que signifie « ZXQ » ici ?",
    });
  });

  it("FR04AR2-C08 — Ambiguous abbreviation requests clarification", () => {
    const project = sourceProject();
    const contribution = contributionFor({
      raw: "ABC = cette mesure.",
      project,
      role: null,
      terminology: [resolution({ surfaceForm: "ABC", status: "AMBIGUOUS", alternatives: ["sens 1", "sens 2"] })],
    });
    expect(resolveScientificInterpretationProductRoute(contribution)).toMatchObject({ disposition: "TERMINOLOGY_CLARIFICATION", contributionAllowed: false });
  });

  it("FR04AR2-C09 — Critic independently receives terminology context", () => {
    const project = sourceProject();
    const contribution = contributionFor({ raw: "Cette mesure sera mon critère principal.", project, role: "PRIMARY_ENDPOINT" });
    const groundingContext = buildSemanticCriticGroundingContext(conversationFor(contribution.source.originalRequest, project), contribution);
    const payload = buildGeminiSemanticCriticProviderPayload({
      contribution,
      groundingContext,
      candidate: snapshotSemanticCriticCandidate(prepareResearchProjectContributionCandidate(contribution, project)),
    });
    const input = JSON.parse(payload.contents[0].parts[0].text);
    expect(input.terminologyContext).toEqual(groundingContext.terminologyContext);
    expect(SEMANTIC_CRITIC_SYSTEM_PROMPT).toMatch(/independently resolve abbreviations/);
  });

  it("FR04AR2-C10 — Critic detects terminology-driven interpreter role loss", () => {
    const project = sourceProject();
    const raw = "La taille de l’infarctus sera le critère de jugement principal.";
    const bad = contributionFor({ raw, project, role: null });
    const result = buildSemanticCriticResult({
      contribution: bad,
      groundingContext: buildSemanticCriticGroundingContext(conversationFor(raw, project), bad),
      candidate: snapshotSemanticCriticCandidate(prepareResearchProjectContributionCandidate(bad, project)),
      providerResult: { verdict: "FAITHFUL", findings: [] },
      provider: "TEST",
      model: "TEST",
      rawOutputRef: "raw:r2",
    });
    expect(result).toMatchObject({ status: "FAILED", repairAllowed: true });
    expect(result.findings).toEqual(expect.arrayContaining([expect.objectContaining({ category: "ROLE_MISMATCH", failureStage: "INTERPRETER" })]));
  });

  it("FR04AR2-C11 — Critic rejects unsupported terminology expansion", () => {
    const project = sourceProject();
    const raw = "ZXQ = cette mesure.";
    const invented = contributionFor({
      raw,
      project,
      role: "PRIMARY_ENDPOINT",
      terminology: [resolution({
        surfaceForm: "ZXQ",
        status: "UNRESOLVED",
        source: "NONE",
        understandingElementIds: ["reference:r2:measure"],
      })],
    });
    const result = buildSemanticCriticResult({
      contribution: invented,
      groundingContext: buildSemanticCriticGroundingContext(conversationFor(raw, project), invented),
      candidate: snapshotSemanticCriticCandidate(prepareResearchProjectContributionCandidate(invented, project)),
      providerResult: { verdict: "FAITHFUL", findings: [] },
      provider: "TEST",
      model: "TEST",
      rawOutputRef: "raw:r2",
    });
    expect(result.status).toBe("FAILED");
    expect(result.findings.some((finding) => finding.category === "OVER_INTERPRETATION" && finding.failureStage === "INTERPRETER")).toBe(true);
  });

  it("FR04AR2-C12 — No hardcoded CJP branch exists in compiler/runtime", () => {
    expect(HYBRID_PRIMARY_SYSTEM_PROMPT).not.toMatch(/\bCJP\b/);
    expect(SEMANTIC_CRITIC_SYSTEM_PROMPT).not.toMatch(/\bCJP\b/);
    expect(JSON.stringify(SCIENTIFIC_INTERPRETATION_SUPPORTED_ROLE_TERMINOLOGY)).not.toMatch(/\bCJP\b/);
    expect(prepareResearchProjectContributionCandidate.toString()).not.toMatch(/\bCJP\b/);
  });

  it("FR04AR2-C13 — Existing measure identity is preserved", () => {
    const project = sourceProject();
    const existing = measurement(project);
    const contribution = contributionFor({ raw: "Cette mesure sera mon critère principal.", project, role: "PRIMARY_ENDPOINT" });
    const change = prepareResearchProjectContributionCandidate(contribution, project).changeSet.changes[0];
    expect(change).toMatchObject({ operation: "REPLACE", previousElement: { elementId: existing.elementId }, proposedElement: { elementId: existing.elementId } });
  });

  it("FR04AR2-C14 — Primary role does not create duplicate measure", () => {
    const project = sourceProject();
    const contribution = contributionFor({ raw: "Cette mesure sera mon critère principal.", project, role: "PRIMARY_ENDPOINT" });
    const candidate = prepareResearchProjectContributionCandidate(contribution, project);
    expect(candidate.changeSet.changes.filter((change) => change.operation === "ADD")).toHaveLength(0);
    expect(candidate.changeSet.effectiveChangeCount).toBe(1);
  });

  it("FR04AR2-C15 — R1 interpreter-loss mutations remain PASS", () => {
    const project = sourceProject();
    const raw = "La taille de l’infarctus sera le critère principal.";
    const bad = contributionFor({ raw, project, role: null });
    const result = buildSemanticCriticResult({
      contribution: bad,
      groundingContext: buildSemanticCriticGroundingContext(conversationFor(raw, project), bad),
      candidate: snapshotSemanticCriticCandidate(prepareResearchProjectContributionCandidate(bad, project)),
      providerResult: {
        verdict: "FAILED",
        findings: [{
          findingId: "finding:r1-preserved",
          category: "ROLE_MISMATCH",
          message: "Le rôle explicite est perdu.",
          understandingElementIds: ["reference:r2:measure"],
          candidateChangeIds: [],
          failureStage: "INTERPRETER",
          rawEvidence: [{ turnId: TURN_ID, quote: raw }],
          repairHint: "Relire le rôle explicite.",
        }],
      },
      provider: "TEST",
      model: "TEST",
      rawOutputRef: "raw:r2",
    });
    expect(result.status).toBe("FAILED");
    expect(result.findings.some((finding) => finding.failureStage === "INTERPRETER")).toBe(true);
  });

  it("FR04AR2-C16 — All FR04A contracts remain PASS", () => {
    const project = sourceProject();
    const context = buildScientificInterpretationTerminologyContext(conversationFor("Cette mesure sera mesurée.", project));
    expect(context.entries.some((entry) => entry.source === "NOXIA_SUPPORTED_ROLE_VOCABULARY")).toBe(true);
    expect(context.entries.some((entry) => entry.source === "PROJECT")).toBe(true);
    expect(context.authoritative).toBe(false);
    expect(project.owner).toBe("RESEARCH_PROJECT");
  });

  it("FR04AR2-FP01 — A terminology role may be carried by a related element targeting the same Project concept", () => {
    const project = sourceProject();
    const raw = "Le rôle A désigne cette mesure comme critère principal.";
    const base = contributionFor({ raw, project, role: null });
    const referenced = base.cognitiveBoundary!.semanticUnderstanding.elements[0];
    const role: ScientificContributionItem = {
      ...referenced,
      itemId: "role:r2:primary",
      semanticIdentity: "role:r2:primary",
      proposedType: "ROLE_ASSIGNMENT",
      content: "critère principal",
      studyRole: "PRIMARY_ENDPOINT",
      semanticFunction: "ROLE_ASSIGNMENT",
      relatedItemIds: [referenced.itemId],
    };
    referenced.relatedItemIds = [role.itemId];
    base.cognitiveBoundary!.semanticUnderstanding.elements = [referenced, role];
    base.scientificContent.candidateObjects = [referenced, role];
    base.cognitiveBoundary!.terminologyGrounding!.resolutions = [resolution({
      surfaceForm: "rôle A",
      resolvedMeaning: "critère principal",
      status: "RESOLVED_CONVERSATION",
      source: "CONVERSATION_USER_DEFINED",
      semanticRoleCandidate: "PRIMARY_ENDPOINT",
      referencedProjectElementIds: [measurement(project).elementId],
      understandingElementIds: [referenced.itemId],
      sourceText: "rôle A",
    })];
    const result = buildSemanticCriticResult({
      contribution: base,
      groundingContext: buildSemanticCriticGroundingContext(conversationFor(raw, project), base),
      candidate: snapshotSemanticCriticCandidate(prepareResearchProjectContributionCandidate(base, project)),
      providerResult: { verdict: "FAITHFUL", findings: [] },
      provider: "TEST", model: "TEST", rawOutputRef: "raw:r2",
    });
    expect(result.findings).toEqual([]);
    expect(result.status).toBe("FAITHFUL");
  });

  it("FR04AR2-FP02 — Critic ignores terminology resolutions belonging only to an earlier user turn", () => {
    const project = sourceProject();
    const raw = "Cette mesure sera mon critère principal.";
    const contribution = contributionFor({ raw, project, role: "PRIMARY_ENDPOINT" });
    contribution.cognitiveBoundary!.terminologyGrounding!.resolutions = [resolution({
      surfaceForm: "ancienne mesure",
      status: "RESOLVED_CONVERSATION",
      source: "CONVERSATION_USER_DEFINED",
      semanticRoleCandidate: "MEASURED_VARIABLE",
      understandingElementIds: ["missing:earlier"],
      sourceTurnIds: ["turn:earlier"],
      sourceText: "ancienne mesure",
    })];
    const result = buildSemanticCriticResult({
      contribution,
      groundingContext: buildSemanticCriticGroundingContext(conversationFor(raw, project, [{ turnId: "turn:earlier", role: "USER", content: "ancienne mesure" }]), contribution),
      candidate: snapshotSemanticCriticCandidate(prepareResearchProjectContributionCandidate(contribution, project)),
      providerResult: { verdict: "FAITHFUL", findings: [] },
      provider: "TEST", model: "TEST", rawOutputRef: "raw:r2",
    });
    expect(result.status).toBe("FAITHFUL");
  });

  it("FR04AR2-FP03 — A standalone exclusion-role trace is represented by its related compiled criterion", () => {
    const project = sourceProject();
    const raw = "Critère d’exclusion : femme enceinte.";
    const base = contributionFor({ raw, project, role: "EXCLUSION", semanticFunction: "EXCLUSION" });
    const criterion: ScientificContributionItem = {
      ...base.cognitiveBoundary!.semanticUnderstanding.elements[0],
      itemId: "criterion:r2:pregnancy",
      semanticIdentity: "criterion:r2:pregnancy",
      proposedType: "POPULATION_CRITERION",
      content: "femme enceinte",
      studyRole: "EXCLUSION",
      semanticFunction: "ENTITY",
      referencedProjectElementIds: [],
      relatedItemIds: ["role:r2:exclusion"],
    };
    const role: ScientificContributionItem = {
      ...criterion,
      itemId: "role:r2:exclusion",
      semanticIdentity: "role:r2:exclusion",
      proposedType: "ROLE_ASSIGNMENT",
      content: "critère d’exclusion",
      semanticFunction: "ROLE_ASSIGNMENT",
      relatedItemIds: [criterion.itemId],
    };
    base.cognitiveBoundary!.semanticUnderstanding.elements = [role, criterion];
    base.scientificContent.candidateObjects = [role, criterion];
    base.cognitiveBoundary!.terminologyGrounding!.resolutions = [resolution({
      surfaceForm: "femme enceinte",
      resolvedMeaning: "femme enceinte",
      status: "RESOLVED_LINGUISTICALLY",
      source: "LLM_LINGUISTIC_KNOWLEDGE",
      semanticRoleCandidate: "POPULATION_CRITERION",
      understandingElementIds: [criterion.itemId],
      sourceText: "femme enceinte",
    })];
    const result = buildSemanticCriticResult({
      contribution: base,
      groundingContext: buildSemanticCriticGroundingContext(conversationFor(raw, project), base),
      candidate: snapshotSemanticCriticCandidate(prepareResearchProjectContributionCandidate(base, project)),
      providerResult: { verdict: "FAITHFUL", findings: [] },
      provider: "TEST", model: "TEST", rawOutputRef: "raw:r2",
    });
    expect(result.status).toBe("FAITHFUL");
  });
});
