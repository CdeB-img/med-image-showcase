import { describe, expect, it, vi } from "vitest";
import { executeKnowledgeEngine } from "../engine";
import { readExternalEvidenceCache } from "../external-evidence/cache";
import { executeExternalEvidenceSearch } from "../external-evidence/pipeline";
import { PUBMED_EXTERNAL_PROVIDER, PubMedExternalSearchProvider, parsePubMedFetchXml, parsePubMedSearchResponse } from "../external-evidence/pubmed-provider";
import { createExternalQueryPlan, decideExternalSearch, serializeExternalQuery } from "../external-evidence/query-plan";
import { extractCandidateAssertions, qualifyAndDeduplicateSources } from "../external-evidence/qualification";
import type { ExternalProviderSearchOutput, ExternalQueryPlan } from "../external-evidence/types";
import {
  FixtureExternalProvider,
  SOURCE_FIXTURES,
  parsedSource,
  providerOutputFixture,
  pubmedFetchFixture,
  pubmedSearchFixture,
} from "./fixtures/pubmed-fixtures";

class MemoryStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

const authorizedPlan = (question = "Expliquer la transformée de Fourier en IRM.", options?: { pageSize?: number; maxPages?: number; maxResults?: number }) => {
  const result = executeKnowledgeEngine({ originalQuestion: question });
  const decision = decideExternalSearch(result, "EXTERNAL_ALLOWED", { authorizedBy: "USER", authorizedAt: "2026-08-09T12:00:00.000Z" });
  return { result, decision, plan: createExternalQueryPlan(result, decision, options) };
};

describe("ENG-003 — contrat provider, décision et query planning", () => {
  it("expose le contrat externe complet sans capacité de promotion scientifique", () => {
    expect(PUBMED_EXTERNAL_PROVIDER).toMatchObject({
      providerId: "pubmed-ncbi",
      authority: expect.stringContaining("National Library of Medicine"),
      pagination: { strategy: "OFFSET" },
      abstractAvailability: "WHEN_DEPOSITED",
      fullTextAvailability: "LINK_ONLY_WHEN_PMCID_PRESENT",
      privacyBoundary: { allowedClasses: ["PUBLIC"] },
    });
    expect(PUBMED_EXTERNAL_PROVIDER.queryCapabilities).not.toContain("ASSERTION");
  });

  it("reste INTERNAL_ONLY quand la connaissance interne est suffisante", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "Comprendre le CT spectral et le photon counting CT." });
    const decision = decideExternalSearch(result, "EXTERNAL_ALLOWED", { authorizedBy: "USER", authorizedAt: "2026-08-09T12:00:00.000Z" });
    expect(result.coverageStatus).toBe("SUPPORTED");
    expect(decision).toMatchObject({ state: "INTERNAL_ONLY", authorized: false });
  });

  it("autorise une recherche seulement après gap et action explicite", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "Expliquer la transformée de Fourier en IRM." });
    const proposed = decideExternalSearch(result, "EXTERNAL_ALLOWED");
    const authorized = decideExternalSearch(result, "EXTERNAL_ALLOWED", { authorizedBy: "USER", authorizedAt: "2026-08-09T12:00:00.000Z" });
    expect(proposed).toMatchObject({ authorized: false, requiresUserAction: true });
    expect(authorized).toMatchObject({ state: "EXTERNAL_ALLOWED", authorized: true, authorizedBy: "USER" });
  });

  it("sérialise des branches exactes et reproductibles sans texte libre", () => {
    const { plan } = authorizedPlan("Comparer IRM vs CT pour étudier la fibrose myocardique.");
    expect(plan.branches).toHaveLength(2);
    expect(plan.branches.map((branch) => branch.modality)).toEqual(["MRI", "CT"]);
    expect(plan.branches[0].query).toContain('"myocardial fibrosis"[Title/Abstract]');
    expect(plan.branches[0].query).toContain('"magnetic resonance imaging"[Title/Abstract]');
    expect(plan.branches[1].query).toContain('"computed tomography"[Title/Abstract]');
    expect(JSON.stringify(plan)).not.toContain("Comparer IRM vs CT");
    expect(plan.redactedContextFields).toContain("originalQuestion");
  });

  it("produit la même requête quelle que soit l’ordre des concepts", () => {
    expect(serializeExternalQuery(["method:t1-mapping", "biomarker:ecv"])).toBe(serializeExternalQuery(["biomarker:ecv", "method:t1-mapping"]));
  });

  it("borne une exigence de fraîcheur entre sa date de départ et l’autorisation", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "Comparer le T1 mapping et l’ECV en IRM cardiaque.", freshnessRequirement: "FROM_2025-01-01" });
    const decision = decideExternalSearch(result, "EXTERNAL_REQUIRED", { authorizedBy: "PD_009_POLICY", authorizedAt: "2026-08-09T12:00:00.000Z" });
    const plan = createExternalQueryPlan(result, decision);
    expect(plan.filters).toEqual({ publicationDateFrom: "2025-01-01", publicationDateTo: "2026-08-09" });
  });
});

describe("ENG-003 — parsing, identité, éligibilité et extraction", () => {
  it("parse une réponse ESearch valide et refuse une réponse mal formée", () => {
    expect(parsePubMedSearchResponse(pubmedSearchFixture(["41000001"], 4))).toEqual({ count: 4, retstart: 0, retmax: 1, ids: ["41000001"] });
    expect(() => parsePubMedSearchResponse('{"unexpected":true}')).toThrow(/liste PMID/);
  });

  it("normalise PMID, DOI, PMCID, résumé, accès et révision", () => {
    const sources = parsePubMedFetchXml(pubmedFetchFixture(SOURCE_FIXTURES.slice(0, 2)), "2026-08-09T12:00:00.000Z", "branch:exact");
    expect(sources[0]).toMatchObject({ pmid: "41000001", doi: "10.1000/noxia.1", eligibility: "ABSTRACT_ONLY", documentStatus: "CURRENT" });
    expect(sources[1]).toMatchObject({ pmid: "41000002", pmcid: "PMC41000002", eligibility: "FULL_TEXT_ACCESSIBLE" });
    expect(sources[1].fullTextLocator).toContain("PMC41000002");
    expect(sources[0].sourceIdentity).not.toBe(sources[0].title);
    expect(sources[0].sourceRevision).toContain("pubmed-revision:");
  });

  it("déduplique par PMID puis DOI en conservant les branches", () => {
    const first = parsedSource({ pmid: "41000100", doi: "10.1000/duplicate", title: "First record", branchIds: ["branch:modality:mri"] });
    const sameDoi = parsedSource({ pmid: "41000101", doi: "10.1000/duplicate", title: "Duplicate record", branchIds: ["branch:modality:ct"] });
    const samePmid = parsedSource({ ...first, title: "Duplicate PMID", branchIds: ["branch:modality:ct"] });
    const qualified = qualifyAndDeduplicateSources([first, sameDoi, samePmid]);
    expect(qualified.eligible).toHaveLength(1);
    expect(qualified.eligible[0].branchIds).toEqual(["branch:modality:ct", "branch:modality:mri"]);
    expect(qualified.excluded).toHaveLength(2);
    expect(qualified.excluded.every((source) => source.eligibility === "DUPLICATE")).toBe(true);
  });

  it("écarte correction et rétractation de l’extraction positive", () => {
    const parsed = parsePubMedFetchXml(pubmedFetchFixture(SOURCE_FIXTURES.slice(2, 4)), "2026-08-09T12:00:00.000Z", "branch:exact");
    const qualified = qualifyAndDeduplicateSources(parsed);
    expect(qualified.eligible).toHaveLength(0);
    expect(qualified.excluded.map((source) => source.eligibility)).toEqual(["CORRECTED", "RETRACTED"]);
    expect(qualified.excluded.find((source) => source.eligibility === "RETRACTED")?.exclusionReasons.join(" ")).toContain("exclue");
  });

  it("n’extrait une assertion candidate que d’une conclusion structurée accessible", () => {
    const { result, plan } = authorizedPlan();
    const sources = parsePubMedFetchXml(pubmedFetchFixture([SOURCE_FIXTURES[4], SOURCE_FIXTURES[5]]), "2026-08-09T12:00:00.000Z", "branch:exact");
    const extracted = extractCandidateAssertions(result.request, plan, sources);
    expect(extracted.assertions).toHaveLength(1);
    expect(extracted.assertions[0]).toMatchObject({
      status: "ASSERTION_CANDIDATE",
      origin: "EXTERNAL_CANDIDATE",
      supportRepresentation: "EXACT_ABSTRACT_EXCERPT",
      extractionModel: null,
      scientificEvidenceLevel: "NOT_ASSIGNED",
      applicability: "PARTIALLY_APPLICABLE",
    });
    expect(extracted.assertions[0].claim).toBe(extracted.assertions[0].supportExact);
    expect(extracted.evidence[0]).toMatchObject({ relation: "SUPPORTS", status: "CANDIDATE_EVIDENCE" });
  });
});

describe("ENG-003 — provider, pagination et erreurs", () => {
  it("rejoue un 429 avec un retry borné puis réussit", async () => {
    const { plan } = authorizedPlan(undefined, { pageSize: 1, maxPages: 1, maxResults: 1 });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('{"error":"API rate limit exceeded"}', { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "0" } }))
      .mockResolvedValueOnce(new Response(pubmedSearchFixture(["41000005"]), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(pubmedFetchFixture([SOURCE_FIXTURES[4]]), { status: 200, headers: { "Content-Type": "application/xml" } }));
    const provider = new PubMedExternalSearchProvider(fetchMock as typeof fetch, () => "2026-08-09T12:00:00.000Z", async () => undefined);
    const output = await provider.search(plan);
    expect(output.status).toBe("SUCCESS");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(output.requests.some((request) => request.errorCode === "RATE_LIMITED")).toBe(true);
  });

  it("distingue aucune correspondance et provider indisponible", async () => {
    const { plan } = authorizedPlan(undefined, { pageSize: 1, maxPages: 1, maxResults: 1 });
    const noMatchProvider = new PubMedExternalSearchProvider(vi.fn().mockResolvedValue(new Response(pubmedSearchFixture([], 0), { status: 200 })) as typeof fetch, () => "2026-08-09T12:00:00.000Z", async () => undefined);
    expect((await noMatchProvider.search(plan)).status).toBe("NO_MATCH");
    const unavailableProvider = new PubMedExternalSearchProvider(vi.fn().mockImplementation(() => Promise.resolve(new Response("unavailable", { status: 503 }))) as typeof fetch, () => "2026-08-09T12:00:00.000Z", async () => undefined);
    const unavailable = await unavailableProvider.search(plan);
    expect(unavailable.status).toBe("SOURCE_UNAVAILABLE");
    expect(unavailable.errors[0].code).toBe("PROVIDER_UNAVAILABLE");
  });

  it("conserve une pagination partielle au lieu de prétendre à l’exhaustivité", async () => {
    const { plan } = authorizedPlan(undefined, { pageSize: 1, maxPages: 1, maxResults: 1 });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(pubmedSearchFixture(["41000005"], 30, 0, 1), { status: 200 }))
      .mockResolvedValueOnce(new Response(pubmedFetchFixture([SOURCE_FIXTURES[4]]), { status: 200 }));
    const provider = new PubMedExternalSearchProvider(fetchMock as typeof fetch, () => "2026-08-09T12:00:00.000Z", async () => undefined);
    const output = await provider.search(plan);
    expect(output.status).toBe("PARTIAL");
    expect(output.pagination[0]).toMatchObject({ continuation: "AVAILABLE_NOT_FETCHED", totalCount: 30 });
    expect(output.errors[0].code).toBe("PARTIAL_PAGINATION");
  });

  it("transmet les bornes de publication documentées à ESearch", async () => {
    const result = executeKnowledgeEngine({ originalQuestion: "Comparer le T1 mapping et l’ECV en IRM cardiaque.", freshnessRequirement: "FROM_2025-01-01" });
    const decision = decideExternalSearch(result, "EXTERNAL_REQUIRED", { authorizedBy: "PD_009_POLICY", authorizedAt: "2026-08-09T12:00:00.000Z" });
    const plan = createExternalQueryPlan(result, decision, { pageSize: 1, maxPages: 1, maxResults: 1 });
    const fetchMock = vi.fn().mockResolvedValue(new Response(pubmedSearchFixture([], 0), { status: 200 }));
    await new PubMedExternalSearchProvider(fetchMock as typeof fetch, () => "2026-08-09T12:00:00.000Z", async () => undefined).search(plan);
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(Object.fromEntries(url.searchParams.entries())).toMatchObject({ datetype: "pdat", mindate: "2025/01/01", maxdate: "2026/08/09" });
  });
});

describe("ENG-003 — pipeline, séparation, cache, confidentialité et trace", () => {
  const source = parsedSource({
    pmid: "41000200",
    doi: "10.1000/pipeline",
    title: "Fourier transform in magnetic resonance imaging",
    abstractText: "The Fourier transform was evaluated. The method remained experimental.",
    abstractSections: [{ label: "CONCLUSIONS", text: "The Fourier transform was evaluated in a magnetic resonance imaging experiment." }],
  });

  it("attache les candidats au KnowledgeResult sans modifier sources ni conclusions internes", async () => {
    const internal = executeKnowledgeEngine({ originalQuestion: "Expliquer la transformée de Fourier en IRM." });
    const provider = new FixtureExternalProvider(providerOutputFixture([source]));
    const mixed = await executeExternalEvidenceSearch({ result: internal, policy: "EXTERNAL_ALLOWED", authorizedBy: "USER", provider, now: () => "2026-08-09T12:00:00.000Z" });
    expect(mixed.externalEvidence?.candidateSources).toHaveLength(1);
    expect(mixed.externalEvidence?.candidateAssertions[0].origin).toBe("EXTERNAL_CANDIDATE");
    expect(mixed.sources).toEqual(internal.sources);
    expect(mixed.synthesis).toEqual(internal.synthesis);
    expect(mixed.externalEvidence?.corpusMutation).toBe(false);
    expect(mixed.humanReviewRequirements).toContain("EXTERNAL_EVIDENCE_CANDIDATE_REVIEW_REQUIRED");
  });

  it("met en cache la réponse originale et la rejoue comme résultat historique", async () => {
    const storage = new MemoryStorage();
    const internal = executeKnowledgeEngine({ originalQuestion: "Expliquer la transformée de Fourier en IRM." });
    const provider = new FixtureExternalProvider(providerOutputFixture([source]));
    const times = ["2026-08-09T12:00:00.000Z", "2026-08-09T12:00:01.000Z", "2026-08-09T13:00:00.000Z", "2026-08-09T13:00:01.000Z"];
    const now = () => times.shift() ?? "2026-08-09T14:00:00.000Z";
    const first = await executeExternalEvidenceSearch({ result: internal, policy: "EXTERNAL_ALLOWED", authorizedBy: "USER", provider, storage, now });
    const second = await executeExternalEvidenceSearch({ result: internal, policy: "EXTERNAL_ALLOWED", authorizedBy: "USER", provider, storage, now });
    expect(provider.calls).toBe(1);
    expect(first.externalEvidence?.cache.state).toBe("MISS");
    expect(second.externalEvidence?.cache).toMatchObject({ state: "HIT_HISTORICAL", originalSearchExecutedAt: "2026-08-09T12:00:00.000Z" });
    const plan = second.externalEvidence?.queryPlan as ExternalQueryPlan;
    expect(readExternalEvidenceCache(storage, plan)?.output.responseSnapshots[0].body).toContain("fixture");
  });

  it("bloque une expression patient avant tout appel provider", async () => {
    const internal = executeKnowledgeEngine({ originalQuestion: "J’ai un T2 élevé." });
    const provider = new FixtureExternalProvider(providerOutputFixture([source]));
    const blocked = await executeExternalEvidenceSearch({ result: internal, policy: "EXTERNAL_ALLOWED", authorizedBy: "USER", provider, now: () => "2026-08-09T12:00:00.000Z" });
    expect(provider.calls).toBe(0);
    expect(blocked.externalEvidence).toMatchObject({ status: "FORBIDDEN", decision: { state: "EXTERNAL_FORBIDDEN" } });
    expect(blocked.trace.privacy.externalCallMade).toBe(false);
  });

  it("bloque aussi un contexte de projet même si la question seule est générale", async () => {
    const internal = executeKnowledgeEngine({ originalQuestion: "Expliquer la transformée de Fourier en IRM.", researchProjectId: "internal-project" });
    const provider = new FixtureExternalProvider(providerOutputFixture([source]));
    const blocked = await executeExternalEvidenceSearch({ result: internal, policy: "EXTERNAL_ALLOWED", authorizedBy: "USER", provider, now: () => "2026-08-09T12:00:00.000Z" });
    expect(internal.request.sensitivityClassification).toBe("CONFIDENTIAL_PROJECT");
    expect(provider.calls).toBe(0);
    expect(blocked.externalEvidence).toMatchObject({ status: "FORBIDDEN", decision: { state: "EXTERNAL_FORBIDDEN" } });
  });

  it("conserve le résultat externe quand le cache navigateur refuse l’écriture", async () => {
    const storage = { getItem: () => null, setItem: () => { throw new Error("QUOTA_EXCEEDED"); } };
    const internal = executeKnowledgeEngine({ originalQuestion: "Expliquer la transformée de Fourier en IRM." });
    const mixed = await executeExternalEvidenceSearch({ result: internal, policy: "EXTERNAL_ALLOWED", authorizedBy: "USER", provider: new FixtureExternalProvider(providerOutputFixture([source])), storage, now: () => "2026-08-09T12:00:00.000Z" });
    expect(mixed.externalEvidence?.candidateSources).toHaveLength(1);
    expect(mixed.externalEvidence?.cache).toEqual({ state: "BYPASSED", key: null });
  });

  it("trace la requête externe et les champs minimisés", async () => {
    const internal = executeKnowledgeEngine({ originalQuestion: "Expliquer la transformée de Fourier en IRM." });
    const mixed = await executeExternalEvidenceSearch({ result: internal, policy: "EXTERNAL_ALLOWED", authorizedBy: "USER", provider: new FixtureExternalProvider(providerOutputFixture([source])), now: () => "2026-08-09T12:00:00.000Z" });
    expect(mixed.trace.events.map((event) => event.operation)).toContain("BUILD_EXTERNAL_QUERY_PLAN");
    expect(mixed.trace.events.map((event) => event.operation)).toContain("EXTRACT_EXTERNAL_CANDIDATE_ASSERTIONS");
    expect(mixed.trace.privacy.externalCallMade).toBe(true);
    expect(mixed.trace.privacy.redactedFields).toContain("originalQuestion");
    expect(mixed.externalEvidence?.providerTrace[0].url).not.toContain("api_key");
  });
});

describe("ENG-003 — cinq cas scientifiques obligatoires", () => {
  const completeWith = async (question: string, sources: ReturnType<typeof parsedSource>[], policy: "EXTERNAL_ALLOWED" | "EXTERNAL_REQUIRED" = "EXTERNAL_ALLOWED") => {
    const internal = executeKnowledgeEngine({ originalQuestion: question, freshnessRequirement: policy === "EXTERNAL_REQUIRED" ? "FROM_2025-01-01" : undefined });
    const provider = new FixtureExternalProvider(providerOutputFixture(sources));
    const mixed = await executeExternalEvidenceSearch({ result: internal, policy, authorizedBy: policy === "EXTERNAL_REQUIRED" ? "PD_009_POLICY" : "USER", provider, now: () => "2026-08-09T12:00:00.000Z" });
    return { internal, mixed, provider };
  };

  it("1 — IRM vs CT fibrose garde les deux branches et les deux origines", async () => {
    const mri = parsedSource({ pmid: "42000001", title: "MRI myocardial fibrosis", branchIds: ["branch:modality:mri"], abstractSections: [{ label: "CONCLUSIONS", text: "Magnetic resonance imaging was evaluated for myocardial fibrosis." }], abstractText: "Magnetic resonance imaging was evaluated for myocardial fibrosis." });
    const ct = parsedSource({ pmid: "42000002", title: "CT myocardial fibrosis", branchIds: ["branch:modality:ct"], abstractSections: [{ label: "CONCLUSIONS", text: "Computed tomography was evaluated for myocardial fibrosis." }], abstractText: "Computed tomography was evaluated for myocardial fibrosis." });
    const { internal, mixed, provider } = await completeWith("Comparer IRM vs CT pour étudier la fibrose myocardique.", [mri, ct]);
    expect(internal.coverageStatus).toBe("PARTIAL");
    expect(provider.plans[0].branches.map((branch) => branch.modality)).toEqual(["MRI", "CT"]);
    expect(mixed.externalEvidence?.candidateSources.flatMap((source) => source.branchIds)).toEqual(expect.arrayContaining(["branch:modality:mri", "branch:modality:ct"]));
    expect(mixed.synthesis).toEqual(internal.synthesis);
  });

  it("2 — no-reflow après stenting conserve le terme spécifique", async () => {
    const source = parsedSource({ pmid: "42000003", title: "No-reflow after stenting", abstractSections: [{ label: "CONCLUSIONS", text: "No-reflow was evaluated after coronary stenting and reperfusion." }], abstractText: "No-reflow was evaluated after coronary stenting and reperfusion." });
    const { internal, mixed, provider } = await completeWith("Comprendre le no-reflow après stenting et reperfusion.", [source]);
    expect(internal.coverageStatus).toBe("SUPPORTED");
    expect(internal.resolvedConcepts.map((item) => item.conceptId)).toEqual(expect.arrayContaining(["phenomenon:no-reflow", "intervention:stenting"]));
    expect(mixed.externalEvidence?.decision).toMatchObject({ state: "INTERNAL_ONLY", authorized: false });
    expect(mixed.externalEvidence?.queryPlan).toBeNull();
    expect(provider.calls).toBe(0);
    expect(provider.plans).toHaveLength(0);
    expect(mixed.trace.privacy.externalCallMade).toBe(false);
  });

  it("3 — Fourier en IRM utilise une source candidate et aucun souvenir LLM", async () => {
    const source = parsedSource({ pmid: "42000004", title: "Fourier reconstruction in MRI", abstractSections: [{ label: "CONCLUSIONS", text: "Fourier reconstruction was evaluated in magnetic resonance imaging." }], abstractText: "Fourier reconstruction was evaluated in magnetic resonance imaging." });
    const { internal, mixed } = await completeWith("Expliquer la transformée de Fourier en IRM.", [source]);
    expect(internal.coverageStatus).toBe("NO_PROVIDER");
    expect(mixed.externalEvidence?.candidateAssertions[0]).toMatchObject({ extractionModel: null, sourceIdentity: "pubmed:pmid:42000004" });
  });

  it("4 — PET vs IRM garde deux modalités et n’invente pas la comparaison absente", async () => {
    const pet = parsedSource({ pmid: "42000005", title: "PET research study", branchIds: ["branch:modality:pet"], abstractSections: [{ label: "CONCLUSIONS", text: "Positron emission tomography was evaluated in the research cohort." }], abstractText: "Positron emission tomography was evaluated in the research cohort." });
    const mri = parsedSource({ pmid: "42000006", title: "MRI research study", branchIds: ["branch:modality:mri"], abstractSections: [{ label: "CONCLUSIONS", text: "Magnetic resonance imaging was evaluated in the research cohort." }], abstractText: "Magnetic resonance imaging was evaluated in the research cohort." });
    const { provider, mixed } = await completeWith("Comparer PET vs IRM dans une maladie non couverte.", [pet, mri]);
    expect(provider.plans[0].branches.map((branch) => branch.modality)).toEqual(["MRI", "PET"]);
    expect(mixed.externalEvidence?.mixedSynthesis.divergences).toEqual([]);
    expect(mixed.externalEvidence?.candidateAssertions).toHaveLength(2);
  });

  it("5 — T1 mapping vs ECV n’est relancé que par une exigence de fraîcheur tracée", async () => {
    const duplicateA = parsedSource({ pmid: "42000007", doi: "10.1000/t1ecv", title: "T1 mapping and ECV", branchIds: ["branch:exact"], abstractSections: [{ label: "CONCLUSIONS", text: "T1 mapping and extracellular volume remained distinct quantitative constructs." }], abstractText: "T1 mapping and extracellular volume remained distinct quantitative constructs." });
    const duplicateB = parsedSource({ pmid: "42000008", doi: "10.1000/t1ecv", title: "Duplicate T1 mapping and ECV", branchIds: ["branch:exact"] });
    const { mixed, provider } = await completeWith("Comparer le T1 mapping et l’ECV en IRM cardiaque.", [duplicateA, duplicateB], "EXTERNAL_REQUIRED");
    expect(mixed.externalEvidence?.decision).toMatchObject({ state: "EXTERNAL_REQUIRED", authorizedBy: "PD_009_POLICY" });
    expect(provider.plans[0].freshnessRequirement).toBe("FROM_2025-01-01");
    expect(mixed.externalEvidence?.candidateSources).toHaveLength(1);
    expect(mixed.externalEvidence?.excludedSources[0].eligibility).toBe("DUPLICATE");
  });
});
