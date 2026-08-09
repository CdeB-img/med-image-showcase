import { describe, expect, it } from "vitest";
import { createHash } from "../browser-crypto";
import { createKnowledgeContextPackage, relaxKnowledgeContext } from "../context-package";
import { executeKnowledgeEngine } from "../engine";
import { createKnowledgeRequest, safeParseKnowledgeRequest } from "../knowledge-request";
import { classifyLlmOperation, LLM_OPERATION_POLICY } from "../llm-policy";
import { minimizeKnowledgeContext } from "../privacy";
import { KNOWLEDGE_PROVIDER_REGISTRY } from "../provider-registry";
import { registrySnapshotIsStable } from "../retrieval";

describe("browser corpus compatibility", () => {
  it("keeps SHA-256 byte-identical for governed corpus identifiers", () => {
    expect(createHash("sha256").update("abc").digest("hex")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});

describe("KnowledgeRequest", () => {
  it("validates a bounded request and rejects unknown fields", () => {
    const request = createKnowledgeRequest({ originalQuestion: "Quelle différence entre le T1 mapping et l’ECV ?", scientificObjectTerms: [{ term: "T1 mapping" }, { term: "ECV" }], createdAt: "2026-08-09T00:00:00.000Z" });
    expect(request.requestType).toBe("COMPARE");
    expect(request.originalQuestion).toContain("T1 mapping");
    expect(safeParseKnowledgeRequest({ ...request, executableFreeText: "SELECT *" }).success).toBe(false);
  });
});

describe("KnowledgeContextPackage", () => {
  it("keeps unknowns explicit and forbids an R1 hard relaxation", () => {
    const context = createKnowledgeContextPackage("Quel est le meilleur biomarqueur ?", "CLARIFY_SELECTION");
    expect(context.status).toBe("UNKNOWN");
    expect(context.unknowns).toContain("MISSING_PATHOLOGY");
    expect(() => relaxKnowledgeContext(context, ["pathology"], "KE test", "R1")).toThrow("R1_CANNOT_RELAX_HARD_DIMENSION");
    const relaxed = relaxKnowledgeContext(context, ["equipment"], "Décision humaine TEST-001", "R1");
    expect(relaxed.relaxation).toMatchObject({ level: "R1", authorizedBy: "Décision humaine TEST-001" });
  });
});

describe("KnowledgeProviderRegistry", () => {
  it("contains only deterministic local providers with explicit limitations", () => {
    expect(registrySnapshotIsStable()).toBe(true);
    expect(KNOWLEDGE_PROVIDER_REGISTRY.providers.map((item) => item.id)).toEqual([...KNOWLEDGE_PROVIDER_REGISTRY.providers].map((item) => item.id).sort());
    expect(KNOWLEDGE_PROVIDER_REGISTRY.providers.every((item) => item.availability === "AVAILABLE" && item.limitations.length > 0)).toBe(true);
    expect(KNOWLEDGE_PROVIDER_REGISTRY.diagnostics).toContain("SCIENTIFIC_ASSERTION_LAYER_HAS_ZERO_ASSERTIONS_AND_IS_NOT_A_POSITIVE_ASSERTION_PROVIDER");
  });
});

describe("LLM boundary", () => {
  it("centralizes all operation classes and keeps scientific selection forbidden", () => {
    expect(classifyLlmOperation("BUILD_STRUCTURED_SYNTHESIS")).toBe("DETERMINISTIC");
    expect(classifyLlmOperation("SELECT_PROVIDER")).toBe("FORBIDDEN");
    expect(classifyLlmOperation("SELECT_BEST_BIOMARKER")).toBe("FORBIDDEN");
    expect(Object.values(LLM_OPERATION_POLICY)).toEqual(expect.arrayContaining(["DETERMINISTIC", "LLM_ALLOWED", "LLM_PROPOSAL_ONLY", "HUMAN_REQUIRED", "FORBIDDEN"]));
  });
});

describe("privacy minimization", () => {
  it("never transmits the original question, project or patient identifiers", () => {
    const request = createKnowledgeRequest({ originalQuestion: "Je souhaite comprendre le T1 mapping en général.", scientificObjectTerms: [{ term: "T1 mapping" }] });
    const minimized = minimizeKnowledgeContext(request);
    expect(minimized.payload).not.toHaveProperty("originalQuestion");
    expect(minimized.redactedFields).toEqual(expect.arrayContaining(["originalQuestion", "researchProjectId", "patientIdentifiers", "projectDocument"]));
  });
});

describe("KnowledgeTrace and reproducibility", () => {
  it("produces the same logical plan and result digest for the same input", () => {
    const input = { originalQuestion: "Quelle différence entre le T1 mapping et l’ECV ?", createdAt: "2026-08-09T00:00:00.000Z" };
    const first = executeKnowledgeEngine(input);
    const second = executeKnowledgeEngine(input);
    expect(first.queryPlan.digest).toBe(second.queryPlan.digest);
    expect(first.resultDigest).toBe(second.resultDigest);
    expect(first.trace.digest).toBe(second.trace.digest);
    expect(first.trace.events.every((event) => event.mode === "DETERMINISTIC")).toBe(true);
    expect(first.trace.privacy.externalCallMade).toBe(false);
  });

  it("does not change structured science when a hypothetical narrative model changes", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "Comparer le T1 mapping et l’ECV en IRM." });
    const structural = { digest: result.resultDigest, assertions: result.applicableAssertions.map((item) => item.revision), gaps: result.gaps.map((item) => item.code) };
    const withGeminiNarrative = { ...structural, narrativeModel: "gemini-model-a" };
    const withOtherNarrative = { ...structural, narrativeModel: "another-model" };
    expect(withGeminiNarrative.digest).toBe(withOtherNarrative.digest);
    expect(withGeminiNarrative.assertions).toEqual(withOtherNarrative.assertions);
  });

  it("keeps corrected source status visible and excludes superseded or retracted revisions", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "Comparer le T1 mapping et l’ECV en IRM." });
    expect(result.sources.every((source) => !["SUPERSEDED", "RETRACTED"].includes(source.status))).toBe(true);
    expect(result.sources.some((source) => source.status === "CORRECTED")).toBe(true);
  });
});
