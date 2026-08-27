import { describe, expect, it } from "vitest";
import { evaluateAssertionApplicability } from "../applicability";
import { executeKnowledgeEngine } from "../engine";
import { createKnowledgeRequest } from "../knowledge-request";
import { projectUnderstandResult } from "../understand-projection";
import { executeProductUnderstandInteraction, routeProductEntry } from "../../protocol-designer/functional-reset/product-entry-routing";
import type { RuntimeAssertion } from "../types";

const CASE_A = "Je voudrais comprendre la différence entre le no-reflow et l’obstruction microvasculaire après angioplastie avec pose de stent dans un STEMI, et comment on peut les étudier en IRM cardiaque.";
const CASE_B = "Je voudrais comprendre dans quelles situations l’ECV mesuré en IRM cardiaque et l’ECV mesuré en CT cardiaque sont réellement comparables pour étudier une fibrose myocardique diffuse. Je ne souhaite pas créer d’étude ni de protocole.";
const CASE_C = "je veux comprendre le role du T1 l'IRM";

const assertion = (overrides: Partial<RuntimeAssertion> = {}): RuntimeAssertion => ({
  stableId: "assertion:01i",
  revision: "assertion:01i:revision:1",
  providerId: "fixture-provider",
  status: "OFFICIAL_EFFECTIVE",
  text: "Fixture locale d’applicabilité.",
  atomicContent: { subject: "microvascular-obstruction", predicate: "OBSERVED_WITH", object: "MR" },
  conceptIds: ["phenomenon:microvascular-obstruction", "modality:mri"],
  modality: "MR",
  context: { dimensions: [{ dimension: "modality", operator: "EXACT", value: "MR" }] },
  polarity: "POSITIVE",
  evidenceRelations: ["SUPPORTS"],
  limitations: [],
  reviewStatus: "REVIEWED",
  locator: "Fixture 01I",
  applicability: "APPLICABLE_EXACT",
  applicabilityReasons: [],
  ...overrides,
});

describe("PRODUCT-CHECKPOINT-01I — matching, SOFT applicability and ambiguity", () => {
  it("A1 — a missing SOFT dimension qualifies but does not reject a candidate", () => {
    const request = createKnowledgeRequest({
      originalQuestion: "Comparer l’obstruction microvasculaire après stenting en IRM.",
      scientificObjectTerms: [{ term: "obstruction microvasculaire" }, { term: "stenting" }, { term: "IRM" }],
      createdAt: "2026-08-27T15:00:00.000Z",
    });
    expect(request.context.dimensions.find((item) => item.name === "intervention")).toMatchObject({ values: ["STENTING"], force: "SOFT" });
    expect(evaluateAssertionApplicability(request, assertion())).toMatchObject({
      state: "APPLICABLE_WITH_LIMITATIONS",
      reasons: expect.arrayContaining([expect.stringMatching(/STENTING.*n’est pas documenté/u)]),
    });
  });

  it("A2 — a real incompatibility on a HARD dimension still rejects", () => {
    const request = createKnowledgeRequest({
      originalQuestion: "Comparer le no-reflow en CT.",
      scientificObjectTerms: [{ term: "no-reflow" }, { term: "CT" }],
      createdAt: "2026-08-27T15:00:00.000Z",
    });
    expect(request.context.dimensions.find((item) => item.name === "modality")).toMatchObject({ values: ["CT"], force: "HARD" });
    expect(evaluateAssertionApplicability(request, assertion()).state).toBe("OUT_OF_VALIDITY_DOMAIN");
  });

  it("A3/A4 — Case A retains applicable MVO evidence, branch-local coverage and the unresolved comparison", () => {
    const result = executeKnowledgeEngine({ originalQuestion: CASE_A, createdAt: "2026-08-27T15:00:00.000Z" });
    const projection = projectUnderstandResult(result);
    expect(result.applicableAssertions).toHaveLength(5);
    expect(result.applicableAssertions.every((item) => item.applicability === "APPLICABLE_WITH_LIMITATIONS")).toBe(true);
    expect(result.applicableAssertions.every((item) => item.applicabilityReasons.some((reason) => /STENTING.*n’est pas documenté/u.test(reason)))).toBe(true);
    expect(result.coverageStatus).toBe("PARTIAL");
    expect(result.synthesis.responseProfile.state).toBe("PARTIAL_ANSWER");
    expect(result.sources.length).toBeGreaterThanOrEqual(3);
    expect(result.evidence.length).toBeGreaterThanOrEqual(6);
    expect(result.queryPlan.branches.map((item) => item.label)).toEqual(expect.arrayContaining(["no-reflow", "obstruction microvasculaire"]));
    expect(result.coverageMap.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: "no-reflow", status: expect.stringMatching(/NO_PROVIDER|NO_MATCH|INSUFFICIENT/u) }),
      expect.objectContaining({ label: "obstruction microvasculaire", status: expect.stringMatching(/SUPPORTED|PARTIAL/u) }),
      expect.objectContaining({ branchId: "comparison:direct", status: expect.stringMatching(/PARTIAL|INSUFFICIENT/u) }),
    ]));
    expect(result.queryPlan.resolvedRelations).toContainEqual(expect.objectContaining({ relation: "CONTEXT_DEPENDENT_RELATION" }));
    expect(projection.answer).not.toMatch(/no-reflow (?:est|=) (?:l’|la )?obstruction microvasculaire/iu);
  });

  it("C1/C2 — a governed ambiguity requests clarification instead of claiming absent knowledge", () => {
    const result = executeKnowledgeEngine({ originalQuestion: CASE_C, createdAt: "2026-08-27T15:00:00.000Z" });
    const projection = projectUnderstandResult(result);
    const ambiguous = result.resolvedConcepts.find((item) => item.conceptId === "ambiguous:t1");
    expect(result.resolvedConcepts).toContainEqual(expect.objectContaining({ conceptId: "modality:mri", kind: "EXACT" }));
    expect(ambiguous).toMatchObject({
      kind: "AMBIGUOUS",
      candidateSenses: expect.arrayContaining([
        expect.objectContaining({ conceptId: "method:t1-mapping" }),
        expect.objectContaining({ conceptId: "measurement:native-t1" }),
      ]),
    });
    expect(result.queryPlan.domainGate).toBe("CLARIFICATION_REQUIRED");
    expect(result.synthesis.responseProfile.state).toBe("CLARIFICATION_REQUIRED");
    expect(result.queryPlan.branches.map((item) => item.branchId)).toEqual(expect.arrayContaining([
      "branch:sense:method:t1-mapping",
      "branch:sense:measurement:native-t1",
    ]));
    expect(result.gaps).toContainEqual(expect.objectContaining({ scope: "AMBIGUOUS_KNOWN_CONCEPT" }));
    expect(result.gaps).not.toContainEqual(expect.objectContaining({ code: "NO_REGISTERED_PROVIDER" }));
    expect(projection.coverageLabel).toBe("Clarification requise");
    expect(projection.clarifications).toContainEqual(expect.objectContaining({
      question: expect.stringMatching(/T1 mapping.*T1 natif/u),
      suggestions: expect.arrayContaining(["T1 mapping", "T1 natif"]),
    }));
    expect(`${projection.coverageLabel} ${projection.answer}`).not.toMatch(/Connaissance interne absente/iu);
    const routing = routeProductEntry({ raw: CASE_C, sourceTurnRef: "turn:01i:c", routedAt: "2026-08-27T15:00:00.000Z" });
    const interaction = executeProductUnderstandInteraction({ raw: CASE_C, decision: routing, createdAt: "2026-08-27T15:00:00.000Z" });
    expect(interaction.assistantReply).toMatch(/Quand vous dites.*T1 mapping.*T1 natif/iu);
    expect(interaction).toMatchObject({ projectWrites: 0, protocolProjections: 0, externalCalls: 0 });
  });

  it("C3 — an explicit governed T1 mapping clarification retrieves T1 knowledge", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "je veux comprendre le role du T1 mapping en IRM", createdAt: "2026-08-27T15:00:00.000Z" });
    expect(result.resolvedConcepts).toContainEqual(expect.objectContaining({ conceptId: "method:t1-mapping", kind: "EXACT" }));
    expect(result.resolvedConcepts).not.toContainEqual(expect.objectContaining({ conceptId: "ambiguous:t1" }));
    expect(result.queryPlan.domainGate).toBe("IN_SCOPE");
    expect(result.applicableAssertions.length).toBeGreaterThan(0);
    expect(result.sources.length).toBeGreaterThan(0);
  });

  it("C4 — a truly unknown concept preserves genuine internal knowledge absence", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "Comprendre NX-UNMAPPED-77 dans un phénomène scientifique non documenté.", createdAt: "2026-08-27T15:00:00.000Z" });
    const projection = projectUnderstandResult(result);
    expect(result.queryPlan.domainGate).toBe("IN_SCOPE");
    expect(result.gaps).toContainEqual(expect.objectContaining({ code: "NO_REGISTERED_PROVIDER" }));
    expect(projection.coverageLabel).toBe("Connaissance interne absente");
    expect(result.gaps).not.toContainEqual(expect.objectContaining({ scope: "AMBIGUOUS_KNOWN_CONCEPT" }));
    expect(projection.clarifications).not.toContainEqual(expect.objectContaining({ id: expect.stringContaining("clarify-concept") }));
  });

  it("B1 — Case B remains a sourced partial comparison with no corpus regression", () => {
    const result = executeKnowledgeEngine({ originalQuestion: CASE_B, createdAt: "2026-08-27T15:00:00.000Z" });
    expect(result.coverageStatus).toBe("PARTIAL");
    expect(result.synthesis.responseProfile.state).toBe("PARTIAL_ANSWER");
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.evidence.length).toBeGreaterThan(0);
    expect(result.gaps).toContainEqual(expect.objectContaining({ scope: "DIRECT_COMPARISON" }));
    expect(projectUnderstandResult(result).answer).toMatch(/ECV myocardique mesuré en IRM/u);
  });
});
