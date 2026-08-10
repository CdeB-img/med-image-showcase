import { describe, expect, it } from "vitest";
import { executeKnowledgeEngine } from "@/features/knowledge-engine";
import { executeExternalEvidenceSearch } from "@/features/knowledge-engine/external-evidence";
import { FixtureExternalProvider, parsedSource, providerOutputFixture } from "@/features/knowledge-engine/__tests__/fixtures/pubmed-fixtures";

describe("SYS-001 — provenance", () => {
  it("conserve une preuve PubMed externe au statut candidat sans mutation du corpus interne", async () => {
    const internal = executeKnowledgeEngine({ originalQuestion: "Expliquer la transformée de Fourier en IRM." });
    const source = parsedSource({
      pmid: "41000999",
      doi: "10.1000/sys.001",
      title: "Fourier transform in MRI",
      abstractText: "The method was evaluated.",
      abstractSections: [{ label: "CONCLUSIONS", text: "The method was evaluated in MRI." }],
    });
    const mixed = await executeExternalEvidenceSearch({
      result: internal,
      policy: "EXTERNAL_ALLOWED",
      authorizedBy: "USER",
      provider: new FixtureExternalProvider(providerOutputFixture([source])),
      now: () => "2026-08-10T16:00:00.000Z",
    });
    expect(mixed.externalEvidence?.candidateAssertions.every((item) => item.status === "ASSERTION_CANDIDATE")).toBe(true);
    expect(mixed.externalEvidence?.corpusMutation).toBe(false);
    expect(mixed.sources).toEqual(internal.sources);
    expect(mixed.synthesis).toEqual(internal.synthesis);
  });
});

