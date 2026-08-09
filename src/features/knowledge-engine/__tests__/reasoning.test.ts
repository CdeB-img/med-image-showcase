import { describe, expect, it } from "vitest";
import { evaluateAssertionApplicability } from "../applicability";
import { resolveAssertions } from "../assertion-resolver";
import { analyzeConflicts, determineCoverage } from "../conflict-gap-analyzer";
import { extractScientificObjectTerms, resolveConcepts } from "../concept-resolver";
import { executeKnowledgeEngine } from "../engine";
import { createKnowledgeRequest } from "../knowledge-request";
import { createQueryPlan } from "../query-planner";
import { synthesizeKnowledge } from "../synthesizer";
import type { RuntimeAssertion } from "../types";

const assertion = (overrides: Partial<RuntimeAssertion> = {}): RuntimeAssertion => ({
  stableId: "assertion:test",
  revision: "assertion:test:revision:1",
  providerId: "test-provider",
  status: "OFFICIAL_EFFECTIVE",
  text: "Test assertion",
  atomicContent: { subject: "test", predicate: "HAS", object: "value" },
  conceptIds: ["concept:test"],
  modality: "MR",
  context: { dimensions: [{ dimension: "modality", operator: "EXACT", value: "MR" }] },
  polarity: "POSITIVE",
  evidenceRelations: ["SUPPORTS"],
  limitations: [],
  reviewStatus: "REVIEWED",
  locator: "Test > assertion",
  applicability: "APPLICABLE_EXACT",
  applicabilityReasons: [],
  ...overrides,
});

describe("ConceptResolver", () => {
  it("keeps T1 mapping and ECV distinct and no-reflow contextual", () => {
    const t1 = createKnowledgeRequest({ originalQuestion: "Comparer le T1 mapping et l’ECV.", scientificObjectTerms: extractScientificObjectTerms("Comparer le T1 mapping et l’ECV.") });
    expect(resolveConcepts(t1).relations).toContainEqual(expect.objectContaining({ sourceConceptId: "method:t1-mapping", targetConceptId: "biomarker:ecv", relation: "NOT_EQUIVALENT" }));
    const noReflow = createKnowledgeRequest({ originalQuestion: "Comprendre le no-reflow après stenting.", scientificObjectTerms: extractScientificObjectTerms("Comprendre le no-reflow après stenting.") });
    expect(resolveConcepts(noReflow).relations).toContainEqual(expect.objectContaining({ relation: "CONTEXT_DEPENDENT_RELATION" }));
  });

  it("preserves an unknown concept instead of inventing a synonym", () => {
    const request = createKnowledgeRequest({ originalQuestion: "Comprendre le concept zéphyr-quantique en IRM.", scientificObjectTerms: [{ term: "zéphyr-quantique" }, { term: "IRM" }] });
    expect(resolveConcepts(request).unresolvedTerms).toContain("zéphyr-quantique");
  });
});

describe("QueryPlanner", () => {
  it("explains every inclusion and exclusion and does not fallback from PET to MRI", () => {
    const request = createKnowledgeRequest({ originalQuestion: "Comparer PET et IRM dans une maladie non couverte.", scientificObjectTerms: extractScientificObjectTerms("Comparer PET et IRM dans une maladie non couverte.") });
    const plan = createQueryPlan(request, resolveConcepts(request));
    expect(plan.branches.map((item) => item.modality)).toEqual(expect.arrayContaining(["PET", "MRI"]));
    expect(plan.providerSelections.every((item) => item.reason.length > 0)).toBe(true);
    expect(plan.providerSelections.every((item) => !item.included)).toBe(true);
    expect(plan.matchingSemantics).toBe("EXACT_FIRST_NO_IMPLICIT_FALLBACK");
  });
});

describe("ApplicabilityEvaluator", () => {
  it("excludes an incompatible modality and retains a technical limitation", () => {
    const ctRequest = createKnowledgeRequest({ originalQuestion: "Comprendre le CT spectral.", scientificObjectTerms: extractScientificObjectTerms("Comprendre le CT spectral.") });
    expect(evaluateAssertionApplicability(ctRequest, assertion()).state).toBe("OUT_OF_VALIDITY_DOMAIN");
    const mrRequest = createKnowledgeRequest({ originalQuestion: "Comprendre le T1 mapping en IRM.", scientificObjectTerms: extractScientificObjectTerms("Comprendre le T1 mapping en IRM.") });
    expect(evaluateAssertionApplicability(mrRequest, assertion({ limitations: ["METHOD_DEPENDENT"] })).state).toBe("APPLICABLE_WITH_LIMITATIONS");
  });
});

describe("AssertionResolver", () => {
  it("deduplicates identical revisions and never promotes a candidate", () => {
    const candidate = assertion({ revision: "assertion:candidate:revision:1", stableId: "assertion:candidate", status: "ASSERTION_CANDIDATE" });
    const resolved = resolveAssertions([assertion(), assertion(), candidate]);
    expect(resolved.applicableAssertions).toHaveLength(1);
    expect(resolved.candidateAssertions).toHaveLength(1);
    expect(resolved.applicableAssertions).not.toContainEqual(expect.objectContaining({ revision: candidate.revision }));
  });
});

describe("ConflictAndGapAnalyzer", () => {
  it("keeps opposite positions as a contradiction", () => {
    const positive = assertion();
    const negative = assertion({ revision: "assertion:test:revision:2", polarity: "NEGATIVE", text: "Opposite position" });
    const conflicts = analyzeConflicts([positive, negative]);
    expect(conflicts).toContainEqual(expect.objectContaining({ state: "CONTRADICTION", positionIds: expect.arrayContaining([positive.revision, negative.revision]) }));
  });

  it("distinguishes provider failure from absence of knowledge", () => {
    const request = createKnowledgeRequest({ originalQuestion: "Comprendre le T1 mapping.", scientificObjectTerms: extractScientificObjectTerms("Comprendre le T1 mapping.") });
    const plan = createQueryPlan(request, resolveConcepts(request));
    const execution = plan.providerSelections.map((item) => ({ providerId: item.providerId, providerVersion: "1", included: item.included, reason: item.reason, executionStatus: item.included ? "FAILED" as const : "NOT_EXECUTED" as const, resultCount: 0, diagnostics: [] }));
    expect(determineCoverage(plan, execution, [], 0, 0, [])).toBe("SOURCE_UNAVAILABLE");
  });
});

describe("KnowledgeSynthesizer and KnowledgeResult", () => {
  it("builds deterministic structured conclusions with traceable sources", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "Comprendre le CT spectral et le photon counting CT.", createdAt: "2026-08-09T00:00:00.000Z" });
    expect(result.synthesis.digest).toMatch(/^ke1-/);
    expect(result.synthesis.conclusions.length).toBeGreaterThan(0);
    expect(result.synthesis.conclusions.every((item) => item.assertionId && item.status)).toBe(true);
    expect(result.provenance.length).toBeGreaterThan(0);
    expect(result.trace.events.map((item) => item.operation)).toEqual(expect.arrayContaining(["BUILD_REQUEST", "BUILD_QUERY_PLAN", "RETRIEVE_CORPUS", "BUILD_STRUCTURED_SYNTHESIS"]));
  });

  it("can synthesize an explicit conflict without averaging it", () => {
    const request = createKnowledgeRequest({ originalQuestion: "Comparer deux positions sur un biomarqueur.", scientificObjectTerms: [{ term: "biomarqueur" }] });
    const positions = [assertion(), assertion({ revision: "assertion:test:revision:2", polarity: "NEGATIVE" })];
    const conflicts = analyzeConflicts(positions);
    const synthesis = synthesizeKnowledge(request, positions, [], [], conflicts, [], []);
    expect(synthesis.controversies).toHaveLength(1);
    expect(synthesis.conclusions).toHaveLength(2);
  });
});
