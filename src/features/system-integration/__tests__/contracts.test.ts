import { describe, expect, it } from "vitest";
import { createKnowledgeRequest } from "@/features/knowledge-engine/knowledge-request";
import { DOCUMENT_PROJECTION_ENGINE_VERSION } from "@/features/document-projection";
import { IMAGING_STUDY_DESIGNER_VERSION } from "@/features/imaging-study-designer";
import { RESEARCH_PROJECT_CONSTRUCTION_VERSION } from "@/features/research-project-construction";
import { SCIENTIFIC_THINKING_ENGINE_VERSION } from "@/features/scientific-thinking";

const CURRENT_OWNER_VERSION_BASELINE = {
  scientificThinking: "1.2.2",
  imaging: "1.2.1",
  project: "1.1.0",
  document: "1.2.0",
} as const;

describe("SYS-001 — contracts", () => {
  it("expose des versions explicites pour chaque contribution aval", () => {
    expect({
      scientificThinking: SCIENTIFIC_THINKING_ENGINE_VERSION,
      imaging: IMAGING_STUDY_DESIGNER_VERSION,
      project: RESEARCH_PROJECT_CONSTRUCTION_VERSION,
      document: DOCUMENT_PROJECTION_ENGINE_VERSION,
    }).toEqual(CURRENT_OWNER_VERSION_BASELINE);
  });

  it("identifie le consommateur Project Construction sans le présenter comme Imaging", () => {
    const request = createKnowledgeRequest({
      originalQuestion: "Construire un projet de recherche sans composante d’imagerie.",
      scientificObjectTerms: [{ term: "projet de recherche", role: "SUBJECT" }],
      consumer: "RESEARCH_PROJECT_CONSTRUCTION",
      createdAt: "2026-08-10T16:00:00.000Z",
    });
    expect(request.consumer).toBe("RESEARCH_PROJECT_CONSTRUCTION");
  });
});
