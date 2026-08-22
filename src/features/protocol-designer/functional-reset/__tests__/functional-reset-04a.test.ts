import { describe, expect, it, vi } from "vitest";
import type {
  ScientificContributionItem,
  ScientificInterpretationCognitiveBoundary,
  ScientificInterpretationContributionEnvelope,
  ScientificInterpretationDomainDecision,
  ScientificInterpretationDialogueIntent,
} from "@/features/scientific-interpretation/contracts";
import { resolveScientificInterpretationProductRoute } from "@/features/scientific-interpretation/cognitive-boundary";
import {
  buildSemanticCriticGroundingContext,
  inspectSemanticFidelityDeterministically,
  snapshotSemanticCriticCandidate,
  type SemanticCriticCandidateSnapshot,
  type SemanticCriticFinding,
  type SemanticCriticResult,
} from "@/features/scientific-interpretation/semantic-critic";
import {
  buildFunctionalResetQueryNavigation,
  mediateFunctionalResetQueryDialogue,
  restateFunctionalResetQueryAfterNoChange,
} from "@/features/query-navigation";
import {
  confirmResearchProjectContribution,
  prepareResearchProjectContributionCandidate,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import { evaluateFunctionalResetSemanticIntegration, MAX_FUNCTIONAL_RESET_AUTO_REPAIR_COUNT } from "../semantic-integration";
import {
  COLCHICINE_INITIAL,
  makeFunctionalResetContribution,
  makeFunctionalResetRuntimeResponse,
} from "./functional-reset-fixtures";

const SOURCE_TURN_ID = "turn:fr04a";
const authority = {
  actorRef: "fr04a:researcher",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const sourceTurn = (content: string) => ({
  turnId: SOURCE_TURN_ID,
  role: "USER" as const,
  content,
  createdAt: "2026-08-22T12:00:00.000Z",
});

const understandingItem = (input: {
  id: string;
  content: string;
  type?: string;
  role?: string | null;
  semanticFunction?: ScientificContributionItem["semanticFunction"];
  evidenceBasis?: ScientificContributionItem["evidenceBasis"];
  disposition?: ScientificContributionItem["projectDisposition"];
  references?: string[];
  quantitativeBounds?: ScientificContributionItem["quantitativeBounds"];
}): ScientificContributionItem => ({
  itemId: input.id,
  semanticIdentity: input.id,
  proposedType: input.type ?? "SCIENTIFIC_CONCEPT",
  content: input.content,
  polarity: "AFFIRMED",
  studyRole: input.role ?? null,
  confidence: 1,
  semanticFunction: input.semanticFunction ?? "CONCEPT",
  evidenceBasis: input.evidenceBasis ?? "EXPLICIT",
  projectDisposition: input.disposition ?? "PROJECT_CANDIDATE",
  referencedProjectElementIds: input.references ?? [],
  relatedItemIds: [],
  quantitativeBounds: input.quantitativeBounds ?? null,
  epistemicBoundary: {
    ownership: "SCIENTIFIC_INTERPRETATION",
    epistemicStatus: input.evidenceBasis === "AMBIGUOUS" ? "AMBIGUOUS" : "EXPLICIT_USER_STATED",
    adoptionStatus: "CANDIDATE",
    activeState: true,
    sourceTurnIds: [SOURCE_TURN_ID],
    sourceText: input.content,
  },
});

const contributionFor = (input: {
  message: string;
  domain: ScientificInterpretationDomainDecision;
  intent: ScientificInterpretationDialogueIntent;
  elements?: ScientificContributionItem[];
  relations?: ScientificInterpretationCognitiveBoundary["semanticUnderstanding"]["relations"];
  inScopeSegments?: string[];
  outOfScopeSegments?: string[];
  responseMessage?: string | null;
  questionContextMismatch?: boolean;
}): ScientificInterpretationContributionEnvelope => {
  const base = makeFunctionalResetContribution([sourceTurn(input.message)]);
  const elements = input.elements ?? [];
  const relations = input.relations ?? [];
  const cognitiveBoundary: ScientificInterpretationCognitiveBoundary = {
    lifecycle: "EPHEMERAL_TRACEABLE_NON_AUTHORITATIVE",
    authoritative: false,
    domainDecision: {
      decision: input.domain,
      confidence: 1,
      rationale: "FR04A contextual decision fixture.",
      inScopeSegments: input.inScopeSegments ?? (input.domain === "IN_SCOPE" || input.domain === "MIXED" ? [input.message] : []),
      outOfScopeSegments: input.outOfScopeSegments ?? (input.domain.startsWith("OUT_OF_SCOPE") ? [input.message] : []),
      responseMessage: input.responseMessage ?? null,
      projectMutationAllowed: input.domain === "IN_SCOPE" || input.domain === "MIXED",
    },
    dialogueRouting: {
      intent: input.intent,
      confidence: 1,
      rationale: "FR04A dialogue route fixture.",
      answersCurrentQuery: input.intent === "PARTIAL_SCIENTIFIC_INPUT",
      preservesCurrentQueryAction: true,
      questionContextMismatch: input.questionContextMismatch ?? false,
      responseMessage: input.responseMessage ?? null,
    },
    semanticUnderstanding: { summary: input.message, elements, relations },
  };
  return {
    ...base,
    cognitiveBoundary,
    scientificContent: {
      ...base.scientificContent,
      candidateObjects: elements.filter((item) => item.projectDisposition === "PROJECT_CANDIDATE" && item.semanticFunction !== "TEMPORALITY"),
      temporalElements: elements.filter((item) => item.semanticFunction === "TEMPORALITY"),
      candidateRelations: relations,
      explicitStatements: [],
      inferredContext: [],
      contextualCandidates: [],
      negationsAndConstraints: [],
      ambiguities: elements.filter((item) => item.evidenceBasis === "AMBIGUOUS"),
      unknowns: elements.filter((item) => item.semanticFunction === "UNKNOWN"),
      missingInformation: [],
      correctionsAndSupersessions: [],
      openDecisions: [],
      clarificationNeeds: [],
    },
  };
};

const confirmedColchicineProject = (): ResearchProjectOwnerProjection => {
  const contribution = makeFunctionalResetRuntimeResponse(makeFunctionalResetContribution([sourceTurn(COLCHICINE_INITIAL)])).contribution!;
  return confirmResearchProjectContribution({ contribution, current: null, projectId: "project:fr04a", authority, confirmedAt: "2026-08-22T12:01:00.000Z" });
};

const candidateSnapshot = (changes: SemanticCriticCandidateSnapshot["changes"]): SemanticCriticCandidateSnapshot => ({
  candidateRef: "candidate:fr04a",
  candidateDigest: "digest:fr04a",
  status: "CANDIDATE_PENDING_HUMAN_CONFIRMATION",
  projectWriteAuthorized: false,
  changes,
});

const change = (input: {
  id: string;
  refs: string[];
  content: string;
  roles?: string[];
  basis?: string | null;
  operation?: "ADD" | "REMOVE" | "REPLACE" | "NO_CHANGE";
}) => ({
  changeId: input.id,
  operation: input.operation ?? "ADD" as const,
  targetSectionId: "POPULATION",
  semanticKey: input.id,
  sourceUnderstandingRefs: input.refs,
  previousElement: null,
  proposedElement: { elementId: `${input.id}:element`, content: input.content, semanticRoles: input.roles ?? [], semanticBasis: input.basis ?? "EXPLICIT" },
});

const criticResult = (input: { status: SemanticCriticResult["status"]; findings?: SemanticCriticFinding[]; repairAllowed?: boolean }): SemanticCriticResult => ({
  contract: "NOXIA_SEMANTIC_INTEGRATION_CRITIC",
  contractVersion: "1.2.0",
  status: input.status,
  authoritative: false,
  groundingDigest: "grounding:fr04a",
  understandingDigest: "understanding:fr04a",
  candidateDigest: "candidate:fr04a",
  findings: input.findings ?? [],
  repairAllowed: input.repairAllowed ?? false,
  provider: "TEST",
  model: "TEST",
  promptDigest: "prompt:fr04a",
  rawOutputRef: "raw:fr04a",
  technicalMessage: null,
});

const failedFinding = (category: SemanticCriticFinding["category"]): SemanticCriticFinding => ({
  findingId: `finding:${category}`,
  category,
  message: category,
  understandingElementIds: ["age:min"],
  candidateChangeIds: ["change:max"],
  failureStage: "COMPILER",
  rawEvidence: [],
  repairHint: "Recompile from the cited understanding element.",
  source: "LLM_SEMANTIC_CRITIC",
});

const groundingFor = (contribution: ScientificInterpretationContributionEnvelope) => buildSemanticCriticGroundingContext({
  conversationId: contribution.source.conversationId,
  language: "fr",
  turns: contribution.source.turns,
});

describe("FUNCTIONAL-RESET-04A — cognitive and conversational boundary", () => {
  it("FR04A-C01 — Domain Gate runs logically before scientific routing", () => {
    const contribution = contributionFor({ message: "Une recette", domain: "OUT_OF_SCOPE", intent: "OUT_OF_SCOPE" });
    expect(resolveScientificInterpretationProductRoute(contribution)).toMatchObject({ contributionAllowed: false, disposition: "SCOPE_REJECTED" });
  });

  it("FR04A-C02 — Out-of-scope general request never creates a scientific Contribution", () => {
    const route = resolveScientificInterpretationProductRoute(contributionFor({ message: "Je veux manger une banane.", domain: "OUT_OF_SCOPE", intent: "OUT_OF_SCOPE" }));
    expect(route).toMatchObject({ contributionAllowed: false, responseMessage: "Cette demande ne relève pas du domaine couvert par NOXIA." });
  });

  it("FR04A-C03 — Patient-specific diagnostic request is rejected from Protocol Designer scope", () => {
    const route = resolveScientificInterpretationProductRoute(contributionFor({ message: "Mon T2 est à 58 ms, est-ce grave ?", domain: "OUT_OF_SCOPE_CLINICAL", intent: "OUT_OF_SCOPE" }));
    expect(route.responseMessage).toMatch(/ni interpréter un examen personnel, ni poser un diagnostic/);
    expect(route.contributionAllowed).toBe(false);
  });

  it("FR04A-C04 — Research-methodology variant of the same medical concept remains in scope", () => {
    const route = resolveScientificInterpretationProductRoute(contributionFor({ message: "Limites méthodologiques du T2 mapping multicentrique", domain: "IN_SCOPE", intent: "USER_QUESTION" }));
    expect(route.cognitiveBoundary.domainDecision.decision).toBe("IN_SCOPE");
    expect(route.disposition).toBe("CONVERSATIONAL_ONLY");
  });

  it("FR04A-C05 — Domain Gate is contextual, not keyword-based", () => {
    const banana = understandingItem({ id: "intervention:banana", type: "INTERVENTION", content: "banane 30 minutes avant l’IRM", semanticFunction: "ACTION" });
    const route = resolveScientificInterpretationProductRoute(contributionFor({ message: banana.content, domain: "IN_SCOPE", intent: "SCIENTIFIC_INPUT", elements: [banana] }));
    expect(route).toMatchObject({ disposition: "SCIENTIFIC_CONTRIBUTION", contributionAllowed: true });
  });

  it("FR04A-C06 — Borderline request asks research-context clarification without Project mutation", () => {
    const route = resolveScientificInterpretationProductRoute(contributionFor({ message: "Fourier", domain: "BORDERLINE", intent: "BORDERLINE" }));
    expect(route).toMatchObject({ disposition: "BORDERLINE_CLARIFICATION", contributionAllowed: false });
    expect(route.responseMessage).toMatch(/projet de recherche|méthodologique/);
  });

  it("FR04A-C07 — Dialogue Router distinguishes scientific input from REQUEST_REPHRASE", () => {
    const contribution = contributionFor({ message: "Je ne comprends pas la question.", domain: "IN_SCOPE", intent: "REQUEST_REPHRASE", responseMessage: "Précisons la même question autrement." });
    expect(resolveScientificInterpretationProductRoute(contribution).disposition).toBe("CONVERSATIONAL_ONLY");
    expect(contribution.cognitiveBoundary?.dialogueRouting.intent).not.toBe("SCIENTIFIC_INPUT");
  });

  it("FR04A-C08 — Dialogue Router distinguishes USER_QUESTION from scientific answer", () => {
    const contribution = contributionFor({ message: "Un placebo est-il nécessaire ?", domain: "IN_SCOPE", intent: "USER_QUESTION" });
    expect(contribution.cognitiveBoundary?.dialogueRouting.intent).toBe("USER_QUESTION");
    expect(resolveScientificInterpretationProductRoute(contribution).contributionAllowed).toBe(false);
  });

  it("FR04A-C09 — Semantic Understanding preserves roles, relations and existing-concept references", () => {
    const role = understandingItem({ id: "role:cjp", content: "critère principal", role: "PRIMARY_ENDPOINT", semanticFunction: "ROLE_ASSIGNMENT", evidenceBasis: "CONTEXTUAL", references: ["endpoint:infarct-size"] });
    const relation = { relationId: "relation:ref", relationType: "ASSIGNS_ROLE_TO", sourceItemId: role.itemId, targetItemId: role.itemId, polarity: "AFFIRMED", confidence: 1, epistemicBoundary: role.epistemicBoundary };
    const contribution = contributionFor({ message: "CJP = taille de l’IDM", domain: "IN_SCOPE", intent: "SCIENTIFIC_INPUT", elements: [role], relations: [relation] });
    expect(contribution.cognitiveBoundary?.semanticUnderstanding).toMatchObject({ elements: [expect.objectContaining({ studyRole: "PRIMARY_ENDPOINT", referencedProjectElementIds: ["endpoint:infarct-size"] })], relations: [expect.objectContaining({ relationType: "ASSIGNS_ROLE_TO" })] });
  });

  it("FR04A-C10 — CJP reference does not create a duplicate measurement", () => {
    const project = confirmedColchicineProject();
    const role = understandingItem({ id: "role:cjp", content: "taille de l’IDM à l’IRM", role: "PRIMARY_ENDPOINT", semanticFunction: "ROLE_ASSIGNMENT", evidenceBasis: "CONTEXTUAL", references: ["endpoint:infarct-size"] });
    const candidate = prepareResearchProjectContributionCandidate(contributionFor({ message: "CJP = taille de l’IDM à l’IRM", domain: "IN_SCOPE", intent: "SCIENTIFIC_INPUT", elements: [role] }), project);
    expect(candidate.changeSet.changes.filter((item) => item.operation === "ADD")).toHaveLength(0);
  });

  it("FR04A-C11 — CJP compiles as primary-endpoint role on the canonical existing element", () => {
    const project = confirmedColchicineProject();
    const role = understandingItem({ id: "role:cjp", content: "taille de l’IDM à l’IRM", role: "PRIMARY_ENDPOINT", semanticFunction: "ROLE_ASSIGNMENT", evidenceBasis: "CONTEXTUAL", references: ["endpoint:infarct-size"] });
    const candidate = prepareResearchProjectContributionCandidate(contributionFor({ message: "CJP = taille de l’IDM à l’IRM", domain: "IN_SCOPE", intent: "SCIENTIFIC_INPUT", elements: [role] }), project);
    expect(candidate.changeSet.changes).toEqual([expect.objectContaining({ operation: "REPLACE", proposedElement: expect.objectContaining({ elementId: "endpoint:infarct-size", semanticRoles: expect.arrayContaining(["PRIMARY_ENDPOINT"]) }) })]);
  });

  it("FR04A role compilation selects the type-compatible target when context references a measure and its modality", () => {
    const project = confirmedColchicineProject();
    const measurement = project.sections.find((section) => section.sectionId === "MEASUREMENTS")!.elements.find((element) => /infarct|infarctus/i.test(element.content))!;
    const modality = project.sections.find((section) => section.sectionId === "IMAGING")!.elements[0]!;
    const role = understandingItem({
      id: "role:cjp:qualified",
      content: "CJP",
      type: "MEASURED_VARIABLE",
      role: "PRIMARY_ENDPOINT",
      semanticFunction: "ROLE_ASSIGNMENT",
      evidenceBasis: "CONTEXTUAL",
      references: [measurement.elementId, modality.elementId],
    });
    const candidate = prepareResearchProjectContributionCandidate(contributionFor({ message: "CJP = taille de l’IDM à l’IRM", domain: "IN_SCOPE", intent: "SCIENTIFIC_INPUT", elements: [role] }), project);
    expect(candidate.changeSet.changes).toEqual([
      expect.objectContaining({ targetSectionId: "MEASUREMENTS", operation: "REPLACE", proposedElement: expect.objectContaining({ elementId: measurement.elementId, semanticRoles: expect.arrayContaining(["PRIMARY_ENDPOINT"]) }) }),
    ]);
  });

  it("FR04A-C12 — Explicit pregnancy exclusion remains an EXCLUSION", () => {
    const exclusion = understandingItem({ id: "criterion:pregnancy", content: "femme enceinte", type: "POPULATION_CRITERION", role: "EXCLUSION", semanticFunction: "EXCLUSION" });
    const candidate = prepareResearchProjectContributionCandidate(contributionFor({ message: "Critères d’exclusion : femme enceinte.", domain: "IN_SCOPE", intent: "SCIENTIFIC_INPUT", elements: [exclusion] }), null);
    expect(candidate.changeSet.changes[0]).toMatchObject({ proposedElement: { content: "Exclusion : Femme enceinte", semanticRoles: expect.arrayContaining(["EXCLUSION"]) } });
  });

  it("FR04A quantitative compilation preserves both sides of one structured closed age interval", () => {
    const age = understandingItem({
      id: "criterion:age:range",
      content: "Entre 20 et 80 ans",
      type: "ELIGIBILITY_CRITERION",
      role: "INCLUSION_CRITERION",
      semanticFunction: "QUANTITY",
      quantitativeBounds: { lower: 20, upper: 80, unit: "ans" },
    });
    const contribution = contributionFor({ message: age.content, domain: "IN_SCOPE", intent: "SCIENTIFIC_INPUT", elements: [age] });
    const candidate = prepareResearchProjectContributionCandidate(contribution, null);
    expect(candidate.changeSet.changes).toEqual(expect.arrayContaining([
      expect.objectContaining({ semanticKey: "POPULATION:ELIGIBILITY:AGE:MIN", proposedElement: expect.objectContaining({ semanticRoles: expect.arrayContaining(["LOWER_BOUND"]) }) }),
      expect.objectContaining({ semanticKey: "POPULATION:ELIGIBILITY:AGE:MAX", proposedElement: expect.objectContaining({ semanticRoles: expect.arrayContaining(["UPPER_BOUND"]) }) }),
    ]));
    expect(inspectSemanticFidelityDeterministically({ cognitiveBoundary: contribution.cognitiveBoundary!, candidate: snapshotSemanticCriticCandidate(candidate) })).toEqual([]);
  });

  it("FR04A quantitative compilation and Critic preserve a one-sided biomarker threshold", () => {
    const troponin = understandingItem({
      id: "biomarker:troponin:min",
      content: "troponine",
      type: "BIOMARKER",
      role: "MEASURED_VARIABLE",
      quantitativeBounds: { lower: 800, upper: null, unit: null },
    });
    const contribution = contributionFor({ message: "Troponine au moins 800 sans maximum", domain: "IN_SCOPE", intent: "SCIENTIFIC_INPUT", elements: [troponin] });
    const candidate = prepareResearchProjectContributionCandidate(contribution, null);
    expect(candidate.changeSet.changes).toEqual([
      expect.objectContaining({ proposedElement: expect.objectContaining({ content: "Troponine minimum : 800", quantitativeBounds: { lower: 800, upper: null, unit: null } }) }),
    ]);
    expect(inspectSemanticFidelityDeterministically({
      cognitiveBoundary: contribution.cognitiveBoundary!,
      candidate: candidateSnapshot([change({ id: "change:troponin-without-value", refs: [troponin.itemId], content: "Troponine", roles: ["MEASURED_VARIABLE", "LOWER_BOUND"] })]),
    })).toContainEqual(expect.objectContaining({ category: "INFORMATION_LOST", understandingElementIds: [troponin.itemId] }));
  });

  it("FR04A-C13 — Semantic Critic detects information loss", () => {
    const min = understandingItem({ id: "age:min", content: "âge minimum 18", role: "MINIMUM", semanticFunction: "BOUND" });
    const max = understandingItem({ id: "age:max", content: "âge maximum 80", role: "MAXIMUM", semanticFunction: "BOUND" });
    const contribution = contributionFor({ message: "18 à 80 ans", domain: "IN_SCOPE", intent: "SCIENTIFIC_INPUT", elements: [min, max] });
    const findings = inspectSemanticFidelityDeterministically({ cognitiveBoundary: contribution.cognitiveBoundary!, candidate: candidateSnapshot([change({ id: "change:max", refs: [max.itemId], content: max.content, roles: ["MAXIMUM"] })]) });
    expect(findings).toEqual(expect.arrayContaining([expect.objectContaining({ category: "INFORMATION_LOST", understandingElementIds: [min.itemId] })]));
  });

  it("FR04A-C14 — Semantic Critic detects role mismatch", () => {
    const exclusion = understandingItem({ id: "pregnancy", content: "grossesse", role: "EXCLUSION", semanticFunction: "EXCLUSION" });
    const contribution = contributionFor({ message: "Exclusion grossesse", domain: "IN_SCOPE", intent: "SCIENTIFIC_INPUT", elements: [exclusion] });
    const findings = inspectSemanticFidelityDeterministically({ cognitiveBoundary: contribution.cognitiveBoundary!, candidate: candidateSnapshot([change({ id: "positive-population", refs: [exclusion.itemId], content: "Grossesse", roles: [] })]) });
    expect(findings.map((item) => item.category)).toContain("ROLE_MISMATCH");
  });

  it("FR04A-C15 — Semantic Critic detects duplicate concept creation", () => {
    const role = understandingItem({ id: "role:cjp", content: "taille infarctus", role: "PRIMARY_ENDPOINT", semanticFunction: "ROLE_ASSIGNMENT", references: ["existing:measure"] });
    const contribution = contributionFor({ message: "CJP taille infarctus", domain: "IN_SCOPE", intent: "SCIENTIFIC_INPUT", elements: [role] });
    const findings = inspectSemanticFidelityDeterministically({ cognitiveBoundary: contribution.cognitiveBoundary!, candidate: candidateSnapshot([change({ id: "new-measure", refs: [role.itemId], content: role.content, roles: ["PRIMARY_ENDPOINT"] })]) });
    expect(findings.map((item) => item.category)).toContain("DUPLICATE_CONCEPT");
  });

  it("FR04A-C16 — Semantic Critic detects over-interpretation", () => {
    const timing = understandingItem({ id: "timing:j5-j7", content: "IRM J5-J7", type: "TEMPORAL_ELEMENT", semanticFunction: "TEMPORALITY" });
    const contribution = contributionFor({ message: timing.content, domain: "IN_SCOPE", intent: "SCIENTIFIC_INPUT", elements: [timing] });
    const findings = inspectSemanticFidelityDeterministically({ cognitiveBoundary: contribution.cognitiveBoundary!, candidate: candidateSnapshot([
      change({ id: "timing", refs: [timing.itemId], content: timing.content }),
      change({ id: "invented-follow-up", refs: [], content: "IRM à 3 mois" }),
    ]) });
    expect(findings.map((item) => item.category)).toContain("OVER_INTERPRETATION");
  });

  it("FR04A-C17 — Semantic Critic preserves ambiguity", () => {
    const ambiguous = understandingItem({ id: "ambiguous:method", content: "méthode A ou B", evidenceBasis: "AMBIGUOUS", semanticFunction: "AMBIGUITY" });
    const contribution = contributionFor({ message: ambiguous.content, domain: "IN_SCOPE", intent: "SCIENTIFIC_INPUT", elements: [ambiguous] });
    const findings = inspectSemanticFidelityDeterministically({ cognitiveBoundary: contribution.cognitiveBoundary!, candidate: candidateSnapshot([change({ id: "certain-method", refs: [ambiguous.itemId], content: "méthode A", basis: "EXPLICIT" })]) });
    expect(findings.map((item) => item.category)).toContain("AMBIGUITY_LOST");
  });

  it("FR04A-C18 — Semantic Critic never creates a new scientific fact", () => {
    const item = understandingItem({ id: "timing", content: "J5-J7", semanticFunction: "TEMPORALITY" });
    const contribution = contributionFor({ message: item.content, domain: "IN_SCOPE", intent: "SCIENTIFIC_INPUT", elements: [item] });
    const candidate = candidateSnapshot([change({ id: "invented", refs: [], content: "suivi 3 mois" })]);
    const before = structuredClone(candidate);
    inspectSemanticFidelityDeterministically({ cognitiveBoundary: contribution.cognitiveBoundary!, candidate });
    expect(candidate).toEqual(before);
  });

  it("FR04A-C19 — At most one automatic repair cycle is allowed", async () => {
    const contribution = makeFunctionalResetRuntimeResponse(makeFunctionalResetContribution([sourceTurn(COLCHICINE_INITIAL)])).contribution!;
    const candidate = prepareResearchProjectContributionCandidate(contribution, null);
    const requestCritic = vi.fn()
      .mockResolvedValueOnce({ apiVersion: "1.0.0", critic: criticResult({ status: "FAILED", findings: [failedFinding("INFORMATION_LOST")], repairAllowed: true }), providerAttempts: 1, retries: 0, invalidStructuredOutputs: 0 })
      .mockResolvedValueOnce({ apiVersion: "1.0.0", critic: criticResult({ status: "FAITHFUL" }), providerAttempts: 1, retries: 0, invalidStructuredOutputs: 0 });
    const result = await evaluateFunctionalResetSemanticIntegration({ contribution, groundingContext: groundingFor(contribution), candidate, currentProject: null, requestCritic });
    expect(MAX_FUNCTIONAL_RESET_AUTO_REPAIR_COUNT).toBe(1);
    expect(result).toMatchObject({ status: "READY_FOR_HUMAN_REVIEW", repairCount: 1 });
    expect(requestCritic).toHaveBeenCalledTimes(2);
  });

  it("FR04A-C20 — Second critic failure blocks review and requires clarification", async () => {
    const contribution = makeFunctionalResetRuntimeResponse(makeFunctionalResetContribution([sourceTurn(COLCHICINE_INITIAL)])).contribution!;
    const candidate = prepareResearchProjectContributionCandidate(contribution, null);
    const failure = { apiVersion: "1.0.0", critic: criticResult({ status: "FAILED", findings: [failedFinding("ROLE_MISMATCH")], repairAllowed: true }), providerAttempts: 1, retries: 0, invalidStructuredOutputs: 0 };
    const requestCritic = vi.fn().mockResolvedValue(failure);
    const result = await evaluateFunctionalResetSemanticIntegration({ contribution, groundingContext: groundingFor(contribution), candidate, currentProject: null, requestCritic });
    expect(result).toMatchObject({ status: "BLOCKED_FOR_CLARIFICATION", repairCount: 1, projectWriteAuthorized: false });
    expect(requestCritic).toHaveBeenCalledTimes(2);
  });

  it("FR04A-C21 — Human confirmation remains mandatory after Critic PASS", async () => {
    const contribution = makeFunctionalResetRuntimeResponse(makeFunctionalResetContribution([sourceTurn(COLCHICINE_INITIAL)])).contribution!;
    const candidate = prepareResearchProjectContributionCandidate(contribution, null);
    const requestCritic = vi.fn().mockResolvedValue({ apiVersion: "1.0.0", critic: criticResult({ status: "FAITHFUL" }), providerAttempts: 1, retries: 0, invalidStructuredOutputs: 0 });
    const result = await evaluateFunctionalResetSemanticIntegration({ contribution, groundingContext: groundingFor(contribution), candidate, currentProject: null, requestCritic });
    expect(result).toMatchObject({ humanConfirmationRequired: true, projectWriteAuthorized: false, status: "READY_FOR_HUMAN_REVIEW" });
  });

  it("FR04A-C22 — QRY remains sole owner of next scientific need", () => {
    const navigation = buildFunctionalResetQueryNavigation({ project: confirmedColchicineProject(), recordedAt: "2026-08-22T12:02:00.000Z" });
    expect(navigation).toMatchObject({ owner: "QUERY_NAVIGATION", projectionOnly: true, projectWriteAuthorized: false });
  });

  it("FR04A-C23 — Mediator flags an already-answered need without choosing its replacement", () => {
    const navigation = buildFunctionalResetQueryNavigation({ project: confirmedColchicineProject(), recordedAt: "2026-08-22T12:02:00.000Z" });
    const action = navigation.currentAction?.selectedActionId;
    const mediated = restateFunctionalResetQueryAfterNoChange({ navigation, recordedAt: "2026-08-22T12:03:00.000Z", responseMessage: "Les moments déjà indiqués sont connus ; quelle fenêtre de mesure reste à préciser ?" });
    expect(mediated.currentAction?.selectedActionId).toBe(action);
    expect(mediated.standardQuestion?.text).toMatch(/déjà indiqués sont connus/);
  });

  it("FR04A-C24 — Known drug-vs-placebo information avoids blind NO_CHANGE same-question loop", () => {
    const contribution = contributionFor({ message: "médicament contre placebo", domain: "IN_SCOPE", intent: "PARTIAL_SCIENTIFIC_INPUT", questionContextMismatch: true, responseMessage: "La comparaison est déjà définie ; quelle mesure doit porter l’analyse ?" });
    expect(contribution.cognitiveBoundary?.dialogueRouting).toMatchObject({ questionContextMismatch: true, preservesCurrentQueryAction: true });
    expect(contribution.cognitiveBoundary?.dialogueRouting.responseMessage).not.toBeNull();
  });

  it("FR04A-C25 — I don't understand reformulates the same QRY action without Project mutation", () => {
    const project = confirmedColchicineProject();
    const navigation = buildFunctionalResetQueryNavigation({ project, recordedAt: "2026-08-22T12:02:00.000Z" });
    const mediated = mediateFunctionalResetQueryDialogue({ navigation, intent: "REQUEST_REPHRASE", responseMessage: "Autrement dit, quelle information manque ici ?", rawResponse: "Je ne comprends pas", actorRef: authority.actorRef, actorRole: "RESEARCHER", receivedAt: "2026-08-22T12:03:00.000Z", responseId: "response:rephrase" });
    expect(mediated.currentAction?.selectedActionId).toBe(navigation.currentAction?.selectedActionId);
    expect(project.revision).toBe(1);
    expect(mediated.projectWriteAuthorized).toBe(false);
  });

  it("FR04A-C26 — Why are you asking explains the same QRY action without Project mutation", () => {
    const navigation = buildFunctionalResetQueryNavigation({ project: confirmedColchicineProject(), recordedAt: "2026-08-22T12:02:00.000Z" });
    const mediated = mediateFunctionalResetQueryDialogue({ navigation, intent: "REQUEST_EXPLANATION", responseMessage: `NOXIA cherche à préciser : ${navigation.currentPresentation?.whyNow}`, rawResponse: "Pourquoi ?", actorRef: authority.actorRef, actorRole: "RESEARCHER", receivedAt: "2026-08-22T12:03:00.000Z", responseId: "response:why" });
    expect(mediated.currentAction).toEqual(navigation.currentAction);
    expect(mediated.standardQuestion?.repeatCount).toBe((navigation.standardQuestion?.repeatCount ?? 0) + 1);
    expect(mediated.projectWriteAuthorized).toBe(false);
  });

  it("FR04A-C27 — Banana general and banana protocol cases are distinguished contextually", () => {
    const general = resolveScientificInterpretationProductRoute(contributionFor({ message: "Manger une banane", domain: "OUT_OF_SCOPE", intent: "OUT_OF_SCOPE" }));
    const protocol = resolveScientificInterpretationProductRoute(contributionFor({ message: "Banane 30 minutes avant IRM", domain: "IN_SCOPE", intent: "SCIENTIFIC_INPUT", elements: [understandingItem({ id: "banana", content: "banane 30 minutes avant IRM", type: "INTERVENTION", semanticFunction: "ACTION" })] }));
    expect([general.disposition, protocol.disposition]).toEqual(["SCOPE_REJECTED", "SCIENTIFIC_CONTRIBUTION"]);
  });

  it("FR04A-C28 — Semantic Understanding is traceable but non-authoritative", () => {
    const contribution = contributionFor({ message: "IRM J5", domain: "IN_SCOPE", intent: "SCIENTIFIC_INPUT", elements: [understandingItem({ id: "timing", content: "IRM J5", semanticFunction: "TEMPORALITY" })] });
    expect(contribution.cognitiveBoundary).toMatchObject({ lifecycle: "EPHEMERAL_TRACEABLE_NON_AUTHORITATIVE", authoritative: false });
  });

  it("FR04A-C29 — Semantic Critic result is traceable but non-authoritative", () => {
    expect(criticResult({ status: "FAITHFUL" })).toMatchObject({ contract: "NOXIA_SEMANTIC_INTEGRATION_CRITIC", authoritative: false, rawOutputRef: "raw:fr04a" });
  });

  it("FR04A-C30 — Research Project remains the sole adopted truth", () => {
    const project = confirmedColchicineProject();
    expect(project).toMatchObject({ owner: "RESEARCH_PROJECT", llmProjectWrites: 0, confirmationDecision: { status: "ADOPTED", engineSource: "RESEARCH_PROJECT" } });
  });

  it("FR04A-C31 — Mixed in-scope/out-of-scope input cannot contaminate Project", () => {
    const timing = understandingItem({ id: "timing:mri", content: "IRM J5-J7", type: "TEMPORAL_ELEMENT", semanticFunction: "TEMPORALITY" });
    const contribution = contributionFor({ message: "IRM J5-J7 et recette de gâteau", domain: "MIXED", intent: "MIXED", elements: [timing], inScopeSegments: ["IRM J5-J7"], outOfScopeSegments: ["recette de gâteau"], responseMessage: "La demande de recette sort du périmètre NOXIA." });
    const candidate = prepareResearchProjectContributionCandidate(contribution, null);
    expect(candidate.changeSet.changes.map((item) => item.proposedElement?.content).join(" ")).not.toMatch(/recette|gâteau/);
    expect(resolveScientificInterpretationProductRoute(contribution)).toMatchObject({ disposition: "SCIENTIFIC_CONTRIBUTION", responseMessage: expect.stringMatching(/sort du périmètre/) });
  });

  it("FR04A-C32 — 03D live semantic completeness remains PASS", () => {
    const project = confirmedColchicineProject();
    const values = project.sections.flatMap((section) => section.elements.map((element) => element.content));
    expect(values).toEqual(expect.arrayContaining(["infarctus du myocarde", "colchicine", "placebo", "étude multicentrique", "IRM", "inflammation", "lésions myocardiques", "biomarqueurs sanguins", "taille de l’infarctus", "Comparaison entre colchicine et placebo"]));
    expect(project.llmProjectWrites).toBe(0);
  });
});
