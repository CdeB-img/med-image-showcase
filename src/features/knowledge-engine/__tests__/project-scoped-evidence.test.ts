import { describe, expect, it } from "vitest";
import { logicalDigest, stableStringify } from "../canonical";
import { executeKnowledgeEngine } from "../index";
import { bindProjectSourceLibrary, collectProjectKnowledgeSources, emptyProjectSourceLibrary, projectSourceFromExternalCandidate, rehydrateProjectSourceLibrary, retainProjectScopedEvidence, supersedeProjectScopedEvidence, type ProjectSource } from "../project-source-library";
import { currentProjectScopedEvidence, projectScopedEvidenceId, qualifyProjectScopedEvidence, type EvidenceSourceCapture, type ProjectScopedEvidenceInput } from "../project-scoped-evidence";
import { availableDocumentEvidence, documentEvidenceSections, initialDocumentEvidence, regenerateDocumentEvidence, validateDocumentEvidence } from "../../document-projection/scientific-document-revision";
import { createProjectSession, readProjectSessions, saveProjectSession } from "../../protocol-designer/functional-reset/project-workspace-storage";

// Synthetic source captures are isolated test fixtures, not public-source verification evidence.
const binding = { projectRef: "synthetic-project", projectVersion: "version:1", projectDigest: "digest:1" };
const AT = "2026-09-18T10:00:00Z";
const domains = [
  ["cardio/imaging", "The measured ventricular volume was associated with age."],
  ["neurology", "The mean processing time differed between the two groups."],
  ["therapeutic trial", "The randomized comparison showed no significant difference in the primary outcome."],
  ["methodology/reproducibility", "Repeat measurements showed an intraclass correlation of 0.91."],
] as const;
const sealCapture = (capture: Omit<EvidenceSourceCapture, "contentDigest">): EvidenceSourceCapture => ({ ...capture, contentDigest: logicalDigest(capture) });
const reseal = (input: ProjectScopedEvidenceInput) => { const { contentDigest, ...capture } = input.capture; input.capture = sealCapture(capture); };
const fixture = (domain = "methodology", claim = "The two measurements were associated in healthy adults.", id = "synthetic-source") => {
  const source: ProjectSource = {
    source: { sourceId: id, revision: `${id}:1`, title: `Synthetic ${domain} source`, status: "SOURCE_CANDIDATE", doi: `10.0000/${id}` },
    authors: ["Test Author"], year: "2026", url: `https://example.org/${id}`, publicationType: "RESEARCH_ARTICLE",
    origins: ["NOXIA_RETRIEVED"], roles: ["BACKGROUND"], userRelevance: "NONE", interestHistory: [], knowledgeResultRefs: [], assertions: [], evidence: [],
    scientificWeight: { assessment: "NOT_ASSESSED", evidenceLevel: "NOT_ASSIGNED", status: "SOURCE_CANDIDATE" },
  };
  const input: ProjectScopedEvidenceInput = {
    projectBinding: binding, sourceId: id, sourceRevision: source.source.revision,
    capture: sealCapture({ metadata: { title: source.source.title, authors: source.authors, publication: "Synthetic Journal (2026)", doi: source.source.doi,
      url: source.url!, version: source.source.revision }, text: `${claim}\n\nPopulation: healthy adults. Method: repeated measurements.`, access: "FULL_TEXT", lifecycle: "CURRENT",
      provenance: { providerId: "SYNTHETIC_TEST_ONLY", requestId: `request:${id}`, sourcePath: source.url!, retrievedAt: AT, verificationVersion: "test-parser:1" } }),
    claim, passage: claim, location: "Results, paragraph 1", sourceContext: [
      { dimension: "population", value: "healthy adults", anchor: "Population: healthy adults." },
      { dimension: "method", value: "repeated measurements", anchor: "Method: repeated measurements." },
    ], targetContext: [{ dimension: "population", value: "healthy adults" }, { dimension: "method", value: "repeated measurements" }],
    applicability: "APPLICABLE_EXACT", applicabilityReason: "The captured population and method match the requested scope; this is a source-local finding.",
    limitations: { population: ["Only the captured sample."], method: ["Only the stated method."], context: ["No universal conclusion."], forbiddenExtrapolations: ["No causal interpretation or prediction in another population."] },
    contradictionRefs: [],
  };
  return { source, input };
};
const qualifiedLibrary = (items: ReturnType<typeof fixture>[]) => retainProjectScopedEvidence(bindProjectSourceLibrary(emptyProjectSourceLibrary(binding.projectRef), binding),
  items.map((item) => item.source), items.map((item) => qualifyProjectScopedEvidence(item.input, item.source, binding)));
const context = { sourceProjectVersion: binding.projectVersion, sourceProjectDigest: binding.projectDigest, question: "Synthetic scientific question", population: ["healthy adults"], objectives: [], design: "observational", measurements: [] };

describe("Project-scoped evidence: Knowledge qualification, immutable Project, passive DOC", () => {
  it("accepts the existing external-evidence candidate type without native assertion promotion", () => {
    const item = fixture();
    const source = projectSourceFromExternalCandidate({ sourceIdentity: item.source.source.sourceId, sourceRevision: item.source.source.revision,
      providerId: "SYNTHETIC_TEST_ONLY", status: "SOURCE_CANDIDATE", origin: "EXTERNAL_CANDIDATE", pmid: "synthetic-pmid", doi: item.source.source.doi,
      title: item.source.source.title, authors: item.source.authors, publicationTypes: ["Journal Article"], documentStatus: "CURRENT", eligibility: "ABSTRACT_ONLY",
      accessLocator: item.source.url, abstractSections: [{ label: "Results", text: item.input.claim }], relatedArticles: [], branchIds: [], exclusionReasons: [], metadataRetrievedAt: AT });
    item.input.capture.metadata.pmid = "synthetic-pmid"; reseal(item.input);
    const candidateOnly = bindProjectSourceLibrary(emptyProjectSourceLibrary(binding.projectRef), binding);
    expect(availableDocumentEvidence({ ...candidateOnly, sources: [source] })).toEqual([]);
    const record = qualifyProjectScopedEvidence(item.input, source, binding);
    const library = retainProjectScopedEvidence(candidateOnly, [source], [record]);
    expect(record.status).toBe("PROJECT_SCOPED_QUALIFIED"); expect(availableDocumentEvidence(library)).toHaveLength(1);
    expect(source.assertions).toEqual([]); expect(source.scientificWeight.status).toBe("SOURCE_CANDIDATE");
    const retracted = projectSourceFromExternalCandidate({ ...{ sourceIdentity: source.source.sourceId, sourceRevision: source.source.revision,
      providerId: "SYNTHETIC_TEST_ONLY", status: "SOURCE_CANDIDATE" as const, origin: "EXTERNAL_CANDIDATE" as const, pmid: "synthetic-pmid", doi: source.source.doi,
      title: source.source.title, authors: source.authors, publicationTypes: [], accessLocator: source.url, abstractSections: [], relatedArticles: [], branchIds: [], exclusionReasons: [], metadataRetrievedAt: AT },
      documentStatus: "RETRACTED", eligibility: "RETRACTED" });
    expect(qualifyProjectScopedEvidence(item.input, retracted, binding).status).toBe("REJECTED");
  });
  it.each(domains)("qualifies the same generic chain in %s", (domain, claim) => {
    const item = fixture(domain, claim);
    const before = stableStringify(item.source);
    const library = qualifiedLibrary([item]);
    expect(currentProjectScopedEvidence(library)).toHaveLength(1);
    expect(availableDocumentEvidence(library)[0].text).toBe(claim);
    const content = initialDocumentEvidence(library, context);
    expect(validateDocumentEvidence(content, binding)).toBe(true);
    const rendered = stableStringify(documentEvidenceSections(content));
    expect(rendered).toContain(claim);
    expect(rendered).toContain("No causal interpretation");
    expect(rendered).toContain(item.source.source.doi);
    expect(stableStringify(item.source)).toBe(before);
    expect(library.sources[0].scientificWeight.assessment).toBe("NOT_ASSESSED");
    expect(library.sources[0].assertions).toEqual([]);
  });

  const negatives: Array<[string, (item: ReturnType<typeof fixture>) => void, string]> = [
    ["unverified DOI", ({ input }) => { input.capture.metadata.doi = "10.0000/unverified"; reseal(input); }, "SOURCE_IDENTITY_UNVERIFIED"],
    ["metadata only", ({ input }) => { input.capture.text = ""; reseal(input); }, "CLAIM_UNSUPPORTED_OR_STRENGTHENED"],
    ["real source, absent claim", ({ input }) => { input.claim = input.passage = "A finding absent from this source."; }, "CLAIM_UNSUPPORTED_OR_STRENGTHENED"],
    ["incompatible population announced DIRECT", ({ input }) => { input.targetContext[0].value = "children"; }, "APPLICABILITY_UNQUALIFIED"],
    ["causal strengthening", ({ input }) => { input.claim = "The first measurement caused the second."; }, "CLAIM_UNSUPPORTED_OR_STRENGTHENED"],
    ["retracted source", ({ input }) => { input.capture.lifecycle = "RETRACTED"; reseal(input); }, "SOURCE_LIFECYCLE_INELIGIBLE"],
    ["unmanaged corrected source", ({ source }) => { source.source.status = "CORRECTED"; }, "SOURCE_CORRECTION_UNMANAGED"],
    ["stronger claim", ({ input }) => { input.claim = "The measurements were associated in all adults."; }, "CLAIM_UNSUPPORTED_OR_STRENGTHENED"],
    ["incomplete provenance", ({ input }) => { input.capture.provenance.requestId = ""; reseal(input); }, "PROVENANCE_INCOMPLETE_OR_CAPTURE_INVALID"],
    ["wrong Project digest", ({ input }) => { input.projectBinding = { ...binding, projectDigest: "another-digest" }; }, "PROJECT_BINDING_STALE"],
    ["unanchored context", ({ input }) => { input.sourceContext[0].anchor = "Not present in the captured source."; }, "APPLICABILITY_UNQUALIFIED"],
    ["invented population label", ({ input }) => { input.sourceContext[0].value = input.targetContext[0].value = "children"; }, "APPLICABILITY_UNQUALIFIED"],
    ["claim excerpt dropping negation", ({ input }) => { input.capture.text = "There was no benefit despite an association in healthy adults."; input.claim = input.passage = "an association in healthy adults"; reseal(input); }, "CLAIM_UNSUPPORTED_OR_STRENGTHENED"],
    ["tampered capture", ({ input }) => { input.capture.text += " Extra text."; }, "PROVENANCE_INCOMPLETE_OR_CAPTURE_INVALID"],
    ["missing limits", ({ input }) => { input.limitations.forbiddenExtrapolations = []; }, "LIMITATIONS_INCOMPLETE"],
    ["another source version", ({ input }) => { input.sourceRevision = "version:2"; }, "SOURCE_IDENTITY_UNVERIFIED"],
  ];
  it.each(negatives)("rejects %s", (_name, mutate, failure) => {
    const item = fixture(); mutate(item);
    const record = qualifyProjectScopedEvidence(item.input, item.source, binding);
    expect(record.status).toBe("REJECTED"); expect(record.failures).toContain(failure);
    expect(availableDocumentEvidence(retainProjectScopedEvidence(bindProjectSourceLibrary(emptyProjectSourceLibrary(binding.projectRef), binding), [item.source], [record]))).toEqual([]);
  });
  it("accepts whitespace differences only, preserving the original source representation", () => {
    const item = fixture(); const original = item.input.capture.text;
    item.input.passage = item.input.claim.replace("healthy adults", "healthy\n adults");
    const record = qualifyProjectScopedEvidence(item.input, item.source, binding);
    expect(record.status).toBe("PROJECT_SCOPED_QUALIFIED"); expect(record.input.capture.text).toBe(original);
  });
  it("retains PARTIAL applicability and all restrictions without promoting it in DOC", () => {
    const item = fixture(); item.input.targetContext[0].value = "children"; item.input.applicability = "PARTIALLY_APPLICABLE";
    item.input.applicabilityReason = "Population mismatch; source-local result only.";
    const content = initialDocumentEvidence(qualifiedLibrary([item]), context);
    expect(content.paragraphs[0].projectScoped.applicability).toBe("PARTIALLY_APPLICABLE");
    expect(stableStringify(documentEvidenceSections(content))).toContain("Population mismatch");
  });
  it("does not silently use superseded evidence", () => {
    const library = qualifiedLibrary([fixture()]);
    const next = supersedeProjectScopedEvidence(library, library.projectScopedEvidence[0].evidenceId);
    expect(availableDocumentEvidence(next)).toEqual([]);
    expect(next.projectScopedEvidence[0].status).toBe("SUPERSEDED");
    const content = initialDocumentEvidence(library);
    content.projectScopedEvidence = next.projectScopedEvidence;
    expect(() => validateDocumentEvidence(content)).toThrow("DOCUMENT_SCOPED_EVIDENCE_INVALID_OR_STALE");
  });
  it("makes changed Project digests stale until explicit requalification", () => {
    const library = qualifiedLibrary([fixture()]); const nextBinding = { ...binding, projectVersion: "version:2", projectDigest: "digest:2" };
    const next = bindProjectSourceLibrary(library, nextBinding);
    expect(availableDocumentEvidence(next)).toEqual([]);
    const old = initialDocumentEvidence(library, context);
    expect(() => validateDocumentEvidence(old, nextBinding)).toThrow("DOCUMENT_EVIDENCE_PROJECT_BINDING_STALE");
    const current = regenerateDocumentEvidence(library, old, { ...context, sourceProjectVersion: nextBinding.projectVersion, sourceProjectDigest: nextBinding.projectDigest });
    expect(current.paragraphs).toEqual([]);
    expect(current.projectScopedEvidence).toEqual([]);
  });
  it("survives the existing session codec and reopen without affecting another project", () => {
    localStorage.clear(); const saved = createProjectSession(localStorage, "One");
    const item = fixture(); item.input.projectBinding = { ...binding, projectRef: saved.session.projectId };
    const current = item.input.projectBinding;
    const library = retainProjectScopedEvidence(bindProjectSourceLibrary(emptyProjectSourceLibrary(current.projectRef), current), [item.source], [qualifyProjectScopedEvidence(item.input, item.source, current)]);
    saveProjectSession(localStorage, saved, { ...saved.session, sourceLibrary: library });
    const other = createProjectSession(localStorage, "Two"); saveProjectSession(localStorage, other, other.session);
    const reopened = readProjectSessions(localStorage);
    expect(reopened.unreadable).toEqual([]);
    expect(reopened.projects.find((project) => project.session.projectId === current.projectRef).session.sourceLibrary).toEqual(library);
    expect(reopened.projects.find((project) => project.session.projectId === other.session.projectId).session.sourceLibrary).toBeUndefined();
    expect(availableDocumentEvidence(rehydrateProjectSourceLibrary(JSON.parse(JSON.stringify(library)), current.projectRef))).toHaveLength(1);
    localStorage.clear();
  });
  it("preserves conflicting sources together even in SHORT and rejects omission/tampering", () => {
    const positive = fixture("A", "An association was observed in this sample.", "source-a");
    const negative = fixture("B", "No significant association was observed in this sample.", "source-b");
    positive.input.contradictionRefs = [projectScopedEvidenceId(negative.input)]; negative.input.contradictionRefs = [projectScopedEvidenceId(positive.input)];
    const library = qualifiedLibrary([positive, negative]);
    for (const narrative of [undefined, context]) {
      const content = initialDocumentEvidence(library, narrative);
      expect(content.sources).toHaveLength(2); expect(content.paragraphs).toHaveLength(2);
      const rendered = stableStringify(documentEvidenceSections(content)); expect(rendered).toContain(positive.input.claim); expect(rendered).toContain(negative.input.claim);
      content.paragraphs = content.paragraphs.slice(0, 1); delete content.narrative;
      expect(() => validateDocumentEvidence(content)).toThrow("DOCUMENT_DISCORDANCE_CLOSURE_MISSING");
    }
    expect(availableDocumentEvidence(supersedeProjectScopedEvidence(library, projectScopedEvidenceId(negative.input)))).toEqual([]);
    const content = initialDocumentEvidence(library); content.paragraphs[0].text = "There is a causal relation.";
    expect(() => documentEvidenceSections(content)).toThrow("DOCUMENT_SCOPED_EVIDENCE_INVALID_OR_STALE");
  });
  it("retains verified correction provenance and refuses changed scientific passages", () => {
    const item = fixture(); item.source.source.status = "CORRECTED"; item.input.capture.lifecycle = "CORRECTED";
    item.input.capture.correction = { impact: "METADATA_ONLY", affectedLocations: ["Article type"], notice: sealCapture({
      metadata: { ...item.input.capture.metadata, doi: "10.0000/correction", version: "notice:1" },
      text: `Correction of ${item.source.source.doi}: article classification only.`, access: "FULL_TEXT", lifecycle: "CURRENT", provenance: item.input.capture.provenance,
    }) }; reseal(item.input);
    expect(qualifyProjectScopedEvidence(item.input, item.source, binding).status).toBe("PROJECT_SCOPED_QUALIFIED");
    item.input.capture.correction.impact = "CONTENT"; item.input.capture.correction.affectedLocations = [item.input.location]; reseal(item.input);
    expect(qualifyProjectScopedEvidence(item.input, item.source, binding).failures).toContain("SOURCE_CORRECTION_UNMANAGED");
  });
  it("native reacquisition retains scoped evidence but updates staleness, without global promotion", () => {
    const library = qualifiedLibrary([fixture()]);
    const result = executeKnowledgeEngine({ originalQuestion: "Scientific methodology", context: {}, externalSearchPolicy: "INTERNAL_ONLY", researchProjectId: binding.projectRef,
      researchProjectVersion: "version:2", researchProjectDigest: "digest:2", createdAt: AT });
    const next = collectProjectKnowledgeSources(library, result);
    expect(next.projectScopedEvidence).toEqual(library.projectScopedEvidence);
    expect(currentProjectScopedEvidence(next)).toEqual([]);
  });
  it("is idempotent and refuses an implicit replacement or digest corruption", () => {
    const item = fixture(); const library = qualifiedLibrary([item]);
    expect(retainProjectScopedEvidence(library, [item.source], library.projectScopedEvidence)).toEqual(library);
    const input = { ...item.input, applicabilityReason: "A different justification." };
    expect(() => retainProjectScopedEvidence(library, [item.source], [qualifyProjectScopedEvidence(input, item.source, binding)])).toThrow("REPLACEMENT_REQUIRES_LIFECYCLE");
    const broken = JSON.parse(JSON.stringify(library)); broken.projectScopedEvidence[0].input.claim = "Tampered";
    const { digest, ...material } = broken; broken.digest = logicalDigest(material);
    expect(() => rehydrateProjectSourceLibrary(broken, binding.projectRef)).toThrow("PROJECT_SCOPED_EVIDENCE_INVALID");
  });
});
