import { describe, expect, it } from "vitest";
import { KNOWLEDGE_ADAPTERS } from "../adapters";
import { extractScientificObjectTerms, resolveConcepts } from "../concept-resolver";
import { createKnowledgeRequest } from "../knowledge-request";
import { getKnowledgeProvider } from "../provider-registry";
import { createQueryPlan } from "../query-planner";

const adapterInput = (question: string, providerId: string) => {
  const request = createKnowledgeRequest({ originalQuestion: question, scientificObjectTerms: extractScientificObjectTerms(question) });
  const resolution = resolveConcepts(request);
  const queryPlan = createQueryPlan(request, resolution);
  const provider = getKnowledgeProvider(providerId)!;
  const adapter = KNOWLEDGE_ADAPTERS.find((item) => item.supports(provider))!;
  return { adapter, input: { request, queryPlan, provider } };
};

describe("P4R adapter", () => {
  it("projects existing ECV/T1 assertions with sources and localizers", () => {
    const { adapter, input } = adapterInput("Comparer le T1 mapping et l’ECV en IRM.", "p4r-ecv-t1");
    const result = adapter.query(input);
    expect(result.executionStatus).toBe("SUCCESS");
    expect(result.assertions.length).toBeGreaterThan(0);
    expect(result.evidenceLinks.every((item) => item.locator.length > 0)).toBe(true);
    expect(result.sources.some((item) => item.pmid || item.doi)).toBe(true);
  });
});

describe("P5 adapter", () => {
  it("projects only the available spectral assertions", () => {
    const { adapter, input } = adapterInput("Comprendre le CT spectral et le photon counting CT.", "p5-multidomain");
    const result = adapter.query(input);
    expect(result.executionStatus).toBe("SUCCESS");
    expect(result.assertions.every((item) => item.providerId === "p5-multidomain")).toBe(true);
    expect(result.assertions.some((item) => item.text.toLowerCase().includes("photon"))).toBe(true);
  });
});

describe("Reasoning Book adapter", () => {
  it.each([
    ["rb-003", "Comprendre le CT spectral et le photon counting CT.", "RB-003", "1.0"],
    ["rb-004", "Comprendre le T1 mapping et l’ECV en IRM cardiaque.", "RB-004", "1.1"],
    ["rb-005", "Comprendre l’OEF et le CMRO2 en perfusion cérébrale.", "RB-005", "1.0"],
  ])("returns typed governed blocks for %s without assertion promotion", (providerId, question, rbId, version) => {
    const { adapter, input } = adapterInput(question, providerId);
    const result = adapter.query(input);
    expect(result.providerVersion).toBe(version);
    expect(result.assertions).toHaveLength(0);
    expect(result.documentaryStatements.length).toBeGreaterThan(10);
    expect(result.documentaryStatements.every((item) => item.status === "GOVERNED_DOCUMENTARY" && item.locator.includes(rbId))).toBe(true);
    expect(result.documentaryStatements.map((item) => item.statementType)).toEqual(expect.arrayContaining(["CONSTRUCT", "HYPOTHESIS", "LIMITATION", "EVIDENCE_MAP", "DECISION_CANDIDATE", "OPEN_QUESTION"]));
    expect(result.diagnostics).toContain("10_RELIABLE_SECTION_FAMILIES_INVENTORIED");
  });
});

describe("Knowledge Graph adapter", () => {
  it("resolves real DICOM/NumPy entities but never promotes graph relations to scientific assertions", () => {
    const { adapter, input } = adapterInput("NumPy dans un pipeline DICOM.", "knowledge-graph");
    const result = adapter.query(input);
    expect(result.executionStatus).toBe("SUCCESS");
    expect(result.assertions).toHaveLength(0);
    expect(result.diagnostics).toContain("SCIENTIFIC_ASSERTION_REGISTRY_EMPTY");
  });
});

describe("adapter contract", () => {
  it("has one real adapter for every registered adapter family and stable versions", () => {
    expect(KNOWLEDGE_ADAPTERS.map((item) => item.adapterId)).toEqual([...KNOWLEDGE_ADAPTERS].map((item) => item.adapterId).sort());
    expect(KNOWLEDGE_ADAPTERS.map((item) => item.adapterId)).toEqual(expect.arrayContaining(["empty-provider-adapter-v1", "knowledge-graph-adapter-v1", "p4r-adapter-v1", "p5-adapter-v1", "reasoning-book-adapter-v1-1"]));
    expect(KNOWLEDGE_ADAPTERS.every((item) => /^1\.[01]\.0$/.test(item.adapterVersion))).toBe(true);
  });
});
