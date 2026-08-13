import { describe, expect, it } from "vitest";
import { canonicalizeSemanticReconstruction } from "../canonical";
import { evaluateSemanticCase } from "../competence";
import type { GoldSemanticTarget, SemanticCompetenceCase } from "../competence-fixtures";
import { buildSemanticCoverage, buildSemanticIntegrityReport } from "../coverage";
import type {
  ProviderCandidateElement,
  ProviderCandidateRelation,
  SemanticInventoryItem,
  SemanticInventoryRelation,
  SemanticReconstructionCandidate,
  SemanticReconstructionRequest,
} from "../types";
import { acceptedCritic } from "./fixtures";

const requestFor = (content: string): SemanticReconstructionRequest => ({
  schemaVersion: "SEM-001-1.1",
  sessionId: "semantic-r5a-generic-test",
  language: "fr",
  messages: [{ messageId: "user-generic", role: "USER", content, createdAt: "2026-08-13T00:00:00.000Z" }],
  previousModel: null,
});

const fragment = (inventoryItemId: string, sourceText: string, localRole: string, polarity: SemanticInventoryItem["polarity"] = "AFFIRMED"): SemanticInventoryItem => ({
  inventoryItemId,
  sourceMessageId: "user-generic",
  sourceText,
  normalizedLabel: sourceText,
  localRole,
  polarity,
  modifiers: [],
  linkedInventoryItemIds: [],
});

const element = (
  clientElementId: string,
  inventoryItemId: string,
  sourceText: string,
  type: ProviderCandidateElement["type"],
  studyRole: ProviderCandidateElement["studyRole"] = "NONE",
  polarity: ProviderCandidateElement["polarity"] = "AFFIRMED",
): ProviderCandidateElement => ({
  clientElementId,
  type,
  canonicalMeaning: sourceText,
  studyRole,
  polarity,
  inventoryItemIds: [inventoryItemId],
  sourceMessageId: "user-generic",
  sourceText,
  epistemicStatus: "EXPLICIT_USER_STATED",
  confidence: 1,
  inferenceReason: null,
  requiresConfirmation: false,
  supersedesElementIds: [],
});

const inventoryRelation = (
  inventoryRelationId: string,
  sourceInventoryItemId: string,
  targetInventoryItemId: string,
  sourceText: string,
  normalizedRelation: string,
  polarity: SemanticInventoryRelation["polarity"] = "AFFIRMED",
): SemanticInventoryRelation => ({
  inventoryRelationId,
  sourceInventoryItemId,
  targetInventoryItemId,
  sourceMessageId: "user-generic",
  sourceText,
  normalizedRelation,
  polarity,
});

const relation = (
  clientRelationId: string,
  sourceClientElementId: string,
  targetClientElementId: string,
  relationType: string,
  inventoryRelationId: string,
  polarity: ProviderCandidateRelation["polarity"] = "AFFIRMED",
): ProviderCandidateRelation => ({
  clientRelationId,
  sourceClientElementId,
  targetClientElementId,
  relationType,
  polarity,
  inventoryRelationIds: [inventoryRelationId],
  epistemicStatus: "EXPLICIT_USER_STATED",
  confidence: 1,
  inferenceReason: null,
  requiresConfirmation: false,
});

const candidateFor = (
  fragments: SemanticInventoryItem[],
  elements: ProviderCandidateElement[],
  explicitRelations: SemanticInventoryRelation[] = [],
  relations: ProviderCandidateRelation[] = [],
): SemanticReconstructionCandidate => ({
  candidateId: "candidate-r5a-generic",
  language: "fr",
  normalizedMeaning: "Reconstruction générique de test.",
  summaryForUser: "Reconstruction générique de test.",
  semanticInventory: { explicitFragments: fragments, explicitRelations },
  elements,
  relations,
  missingConcepts: [],
  ellipses: [],
  ambiguities: [],
  unknowns: [],
  contradictions: [],
  knowledgeRequests: [],
  clarificationCandidates: [],
  routeProposal: { route: "DESIGN_STUDY", confidence: 1, reason: "Construction explicite d'une étude.", expectedCapabilities: [] },
  semanticWarnings: [],
});

describe("SEM-001R5A generic contextual classification", () => {
  it("detects an explicitly selected judging variable without relying on a domain term", () => {
    const request = requestFor("La variable dérivée doit compter pour juger l'étude.");
    const candidate = candidateFor(
      [fragment("i-variable", "variable dérivée", "measured variable")],
      [element("e-variable", "i-variable", "variable dérivée", "BIOMARKER", "OUTCOME_ROLE")],
    );
    expect(buildSemanticCoverage(request, candidate).taxonomy.findings).toContainEqual(expect.objectContaining({
      code: "SELECTED_JUDGING_VARIABLE_NOT_ENDPOINT",
      expectedType: "ENDPOINT",
      expectedStudyRole: "OUTCOME_ROLE",
    }));
  });

  it("separates a study setting from a participant population", () => {
    const request = requestFor("Étude rétrospective dans trois centres.");
    const candidate = candidateFor(
      [fragment("i-setting", "trois centres", "setting")],
      [element("e-setting", "i-setting", "trois centres", "POPULATION")],
    );
    expect(buildSemanticCoverage(request, candidate).taxonomy.findings).toContainEqual(expect.objectContaining({ code: "STUDY_SETTING_TYPED_AS_POPULATION", expectedType: "STUDY_DESIGN" }));
  });

  it("preserves an unselected comparator as an uncertain missing choice", () => {
    const request = requestFor("Le comparateur n'est pas encore choisi.");
    const candidate = candidateFor(
      [fragment("i-open-choice", "comparateur n'est pas encore choisi", "missing choice", "UNCERTAIN")],
      [element("e-open-choice", "i-open-choice", "comparateur n'est pas encore choisi", "COMPARATOR", "COMPARATOR_ARM", "NEGATED")],
    );
    expect(buildSemanticCoverage(request, candidate).taxonomy.findings).toContainEqual(expect.objectContaining({
      code: "UNSELECTED_COMPARATOR_NOT_UNKNOWN",
      expectedType: "UNKNOWN",
      expectedPolarity: "UNCERTAIN",
    }));
  });

  it("recognizes a collective participant expression instead of collapsing it to a condition", () => {
    const request = requestFor("Mesure chez participants fragiles.");
    const candidate = candidateFor(
      [fragment("i-participants", "participants fragiles", "participants")],
      [element("e-participants", "i-participants", "participants fragiles", "CONDITION")],
    );
    expect(buildSemanticCoverage(request, candidate).taxonomy.findings).toContainEqual(expect.objectContaining({ code: "PARTICIPANT_GROUP_TYPED_AS_CONDITION", expectedType: "POPULATION" }));
  });

  it("keeps a bare quantitative observable distinct from a production method", () => {
    const request = requestFor("Q2 est associé au résultat.");
    const fragments = [fragment("i-observable", "Q2", "quantitative observable"), fragment("i-result", "résultat", "outcome")];
    const elements = [element("e-observable", "i-observable", "Q2", "METHOD", "MEASUREMENT"), element("e-result", "i-result", "résultat", "OUTCOME", "OUTCOME_ROLE")];
    const inventoryRelations = [inventoryRelation("ir-associated", "i-observable", "i-result", "Q2 est associé au résultat", "RELATED_TO_CANDIDATE")];
    const relations = [relation("r-associated", "e-observable", "e-result", "RELATED_TO_CANDIDATE", "ir-associated")];
    expect(buildSemanticCoverage(request, candidateFor(fragments, elements, inventoryRelations, relations)).taxonomy.findings).toContainEqual(expect.objectContaining({
      code: "QUANTITATIVE_COMPARAND_TYPED_AS_METHOD",
      expectedType: "BIOMARKER",
    }));
  });
});

describe("SEM-001R5A generic graph, provenance and relation integrity", () => {
  it("accepts an already correct grounded measurement without mutation", () => {
    const request = requestFor("La quantité est mesurée par la technique.");
    const fragments = [fragment("i-quantity", "quantité", "measured target"), fragment("i-technique", "technique", "method")];
    const elements = [element("e-quantity", "i-quantity", "quantité", "BIOMARKER", "MEASUREMENT"), element("e-technique", "i-technique", "technique", "METHOD", "MEASUREMENT")];
    const inventoryRelations = [inventoryRelation("ir-measure", "i-quantity", "i-technique", "quantité est mesurée par la technique", "MEASURED_BY")];
    const relations = [relation("r-measure", "e-quantity", "e-technique", "MEASURED_BY", "ir-measure")];
    expect(buildSemanticIntegrityReport(request, candidateFor(fragments, elements, inventoryRelations, relations))).toEqual({ status: "COMPLETE", findings: [] });
  });

  it("rejects reconstructed ellipsis text in explicit provenance", () => {
    const request = requestFor("Procédure immédiate ou en deux temps.");
    const candidate = candidateFor(
      [fragment("i-delayed", "en deux temps", "alternative")],
      [element("e-delayed", "i-delayed", "Procédure ... en deux temps", "INTERVENTION", "COMPARATOR_ARM")],
    );
    expect(buildSemanticIntegrityReport(request, candidate).findings).toContainEqual(expect.objectContaining({ code: "EXPLICIT_ELEMENT_SOURCE_NOT_CONTIGUOUS", clientElementId: "e-delayed" }));
  });

  it("detects relation polarity reversal", () => {
    const request = requestFor("La méthode A n'est pas comparée à la méthode B.");
    const fragments = [fragment("i-a", "méthode A", "endpoint"), fragment("i-b", "méthode B", "endpoint")];
    const elements = [element("e-a", "i-a", "méthode A", "METHOD"), element("e-b", "i-b", "méthode B", "METHOD")];
    const inventoryRelations = [inventoryRelation("ir-compare", "i-a", "i-b", "méthode A n'est pas comparée à la méthode B", "COMPARES_WITH", "NEGATED")];
    const relations = [relation("r-compare", "e-a", "e-b", "COMPARES_WITH", "ir-compare", "AFFIRMED")];
    expect(buildSemanticIntegrityReport(request, candidateFor(fragments, elements, inventoryRelations, relations)).findings).toContainEqual(expect.objectContaining({ code: "RELATION_POLARITY_MISMATCH" }));
  });

  it("detects an inverted passive measurement relation", () => {
    const request = requestFor("La quantité est mesurée par la technique.");
    const fragments = [fragment("i-quantity", "quantité", "target"), fragment("i-technique", "technique", "method")];
    const elements = [element("e-quantity", "i-quantity", "quantité", "BIOMARKER"), element("e-technique", "i-technique", "technique", "METHOD")];
    const inventoryRelations = [inventoryRelation("ir-measure", "i-quantity", "i-technique", "quantité est mesurée par la technique", "MEASURED_BY")];
    const relations = [relation("r-measure", "e-technique", "e-quantity", "MEASURED_BY", "ir-measure")];
    expect(buildSemanticIntegrityReport(request, candidateFor(fragments, elements, inventoryRelations, relations)).findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "RELATION_INVENTORY_ENDPOINT_MISMATCH" }),
      expect.objectContaining({ code: "RELATION_DIRECTION_OR_ROLE_MISMATCH" }),
    ]));
  });

  it("detects a missing repetition anchor", () => {
    const request = requestFor("Répéter la mesure au jour suivant.");
    const fragments = [fragment("i-design", "Répéter", "design"), fragment("i-time", "jour suivant", "timing")];
    const elements = [element("e-design", "i-design", "Répéter", "STUDY_DESIGN"), element("e-time", "i-time", "jour suivant", "TIMING")];
    const inventoryRelations = [inventoryRelation("ir-repeat", "i-design", "i-time", "Répéter la mesure au jour suivant", "REPEATED_AT")];
    const relations = [relation("r-repeat", "e-design", "e-time", "REPEATED_AT", "ir-repeat")];
    expect(buildSemanticIntegrityReport(request, candidateFor(fragments, elements, inventoryRelations, relations)).findings).toContainEqual(expect.objectContaining({ code: "RELATION_DIRECTION_OR_ROLE_MISMATCH" }));
  });
});

const evaluationFixture = (target: GoldSemanticTarget, requiredAmbiguities: string[] = []): SemanticCompetenceCase => ({
  caseId: "SEM-SYNTHETIC-COMPOSITION",
  split: "DEVELOPMENT_CASES",
  domain: "generic",
  turns: ["synthetic"],
  gold: {
    requiredExplicitObjects: [target],
    requiredRelations: [],
    acceptableInferences: [],
    forbiddenInferences: [],
    requiredAmbiguities,
    optionalClarifications: [],
    forbiddenClarifications: [],
    expectedIntent: "generic",
    allowedRoutes: ["DESIGN_STUDY"],
    criticalSemanticElements: [target.meaning],
  },
});

const canonicalModel = (request: SemanticReconstructionRequest, candidate: SemanticReconstructionCandidate) => canonicalizeSemanticReconstruction({
  request,
  candidate,
  critic: acceptedCritic(candidate),
  metadata: { provider: "TEST", model: "generic-test", temperature: null },
  reconstructionCallId: "reconstruction-generic",
  criticCallId: "critic-generic",
  now: "2026-08-13T00:00:01.000Z",
});

describe("SEM-001R5A generic evaluator compositional equivalence", () => {
  it("matches an undefined threshold composed with its bounded quantity", () => {
    const request = requestFor("Adjudication si écart au-dessus d'un seuil encore indéfini.");
    const fragments = [fragment("i-gap", "écart", "quantity"), fragment("i-threshold", "seuil encore indéfini", "unknown")];
    const elements = [element("e-gap", "i-gap", "écart", "BIOMARKER"), element("e-threshold", "i-threshold", "seuil encore indéfini", "UNKNOWN")];
    const inventoryRelations = [inventoryRelation("ir-bound", "i-gap", "i-threshold", "écart au-dessus d'un seuil encore indéfini", "BOUNDED_BY")];
    const relations = [relation("r-bound", "e-gap", "e-threshold", "BOUNDED_BY", "ir-bound")];
    const model = canonicalModel(request, candidateFor(fragments, elements, inventoryRelations, relations));
    expect(evaluateSemanticCase(evaluationFixture({ type: "UNKNOWN", meaning: "seuil d'écart indéfini", aliases: [], critical: true }), model).explicitObjectRecall).toBe(1);
  });

  it("normalizes a faithful negated constraint paraphrase", () => {
    const request = requestFor("La mortalité n'est pas concernée.");
    const fragments = [fragment("i-exclusion", "mortalité n'est pas concernée", "constraint", "NEGATED")];
    const elements = [element("e-exclusion", "i-exclusion", "mortalité n'est pas concernée", "CONSTRAINT", "NONE", "NEGATED")];
    const model = canonicalModel(request, candidateFor(fragments, elements));
    expect(evaluateSemanticCase(evaluationFixture({ type: "CONSTRAINT", meaning: "mortalité exclue", aliases: [], critical: true }), model).explicitObjectRecall).toBe(1);
  });

  it("does not compose disconnected concepts", () => {
    const request = requestFor("Écart. Seuil encore indéfini.");
    const fragments = [fragment("i-gap", "Écart", "quantity"), fragment("i-threshold", "Seuil encore indéfini", "unknown")];
    const elements = [element("e-gap", "i-gap", "Écart", "BIOMARKER"), element("e-threshold", "i-threshold", "Seuil encore indéfini", "UNKNOWN")];
    const model = canonicalModel(request, candidateFor(fragments, elements));
    expect(evaluateSemanticCase(evaluationFixture({ type: "UNKNOWN", meaning: "seuil d'écart indéfini", aliases: [], critical: true }), model).explicitObjectRecall).toBe(0);
  });
});
