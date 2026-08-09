import { describe, expect, it } from "vitest";
import { executeKnowledgeEngine } from "../engine";
import { projectUnderstandResult } from "../understand-projection";

describe("ENG-001 mandatory validation cases", () => {
  it("1 — preserves MRI and CT for myocardial fibrosis without RB-004 substituting CT", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "Comparer IRM vs CT pour étudier la fibrose myocardique." });
    expect(result.resolvedConcepts.map((item) => item.conceptId)).toEqual(expect.arrayContaining(["modality:mri", "modality:ct", "phenomenon:myocardial-fibrosis"]));
    expect(result.queryPlan.branches.map((item) => item.modality)).toEqual(["MRI", "CT"]);
    expect(result.coverageStatus).toBe("PARTIAL");
    expect(result.gaps).toContainEqual(expect.objectContaining({ scope: "DIRECT_COMPARISON" }));
    expect(result.providerExecutions.find((item) => item.providerId === "rb-004")?.reason).not.toContain("CT couvert par RB-004");
  });

  it("2 — preserves no-reflow and the post-stenting reperfusion context, then emits a gap", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "Comprendre le no-reflow après stenting et reperfusion." });
    expect(result.resolvedConcepts).toContainEqual(expect.objectContaining({ conceptId: "phenomenon:no-reflow" }));
    expect(result.request.context.dimensions.find((item) => item.name === "timing")?.values).toContain("POST_REPERFUSION");
    expect(result.applicableAssertions).toHaveLength(0);
    expect(result.gaps.map((item) => item.code)).toEqual(expect.arrayContaining(["NO_APPLICABLE_PROVIDER", "MISSING_CRITICAL_CONTEXT"]));
  });

  it("3 — distinguishes T1 mapping from ECV and queries applicable corpora", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "Quelle différence entre le T1 mapping et l’ECV en IRM ?" });
    expect(result.resolvedConcepts.map((item) => item.objectType)).toEqual(expect.arrayContaining(["MEASUREMENT_METHOD", "DERIVED_MEASUREMENT"]));
    expect(result.queryPlan.providerSelections).toContainEqual(expect.objectContaining({ providerId: "p4r-ecv-t1", included: true }));
    expect(result.applicableAssertions.length).toBeGreaterThan(0);
    expect(result.applicableAssertions.some((item) => item.modality?.endsWith(":ct"))).toBe(false);
  });

  it("4 — stops honestly for Fourier in MRI when no governed provider covers it", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "Expliquer la transformée de Fourier en IRM." });
    expect(result.coverageStatus).toBe("NO_PROVIDER");
    expect(result.gaps).toContainEqual(expect.objectContaining({ code: "NO_REGISTERED_PROVIDER" }));
    expect(result.applicableAssertions).toHaveLength(0);
  });

  it("5 — applies the Domain Gate to NumPy in a DICOM pipeline", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "Comment utiliser NumPy dans un pipeline DICOM ?" });
    expect(result.queryPlan.domainGate).toBe("OUT_OF_DOMAIN");
    expect(result.gaps).toContainEqual(expect.objectContaining({ code: "OUT_OF_DOMAIN" }));
    expect(result.applicableAssertions).toHaveLength(0);
    expect(projectUnderstandResult(result).answer).toContain("support technique général");
  });

  it("6 — refuses patient-level interpretation for an elevated T2", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "J’ai un T2 élevé." });
    expect(result.queryPlan.domainGate).toBe("PATIENT_LEVEL_BLOCKED");
    expect(result.gaps).toContainEqual(expect.objectContaining({ code: "PRIVACY_BLOCKED" }));
    expect(result.applicableAssertions).toHaveLength(0);
    expect(projectUnderstandResult(result).answer).toContain("n’interprète pas une valeur individuelle");
  });

  it("7 — requires context instead of choosing a best biomarker", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "Quel est le meilleur biomarqueur ?" });
    expect(result.queryPlan.domainGate).toBe("CLARIFICATION_REQUIRED");
    expect(result.gaps).toContainEqual(expect.objectContaining({ code: "MISSING_CRITICAL_CONTEXT", scope: "BIOMARKER_SELECTION" }));
    expect(result.humanReviewRequirements).toContain("HUMAN_SELECTION_REQUIRED");
  });

  it("8 — preserves PET and MRI in an uncovered disease without nearby-corpus fallback", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "Comparer PET vs IRM dans une maladie non couverte zéphyrienne." });
    expect(result.queryPlan.branches.map((item) => item.modality)).toEqual(expect.arrayContaining(["PET", "MRI"]));
    expect(result.coverageStatus).toBe("NO_PROVIDER");
    expect(result.providerExecutions.every((item) => !item.included)).toBe(true);
    expect(result.provenance).toHaveLength(0);
  });
});
