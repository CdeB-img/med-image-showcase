import { describe, expect, it } from "vitest";
import { executeKnowledgeEngine } from "@/features/knowledge-engine";
import { collectProjectKnowledgeSources, emptyProjectSourceLibrary, recordSourceInterest, rehydrateProjectSourceLibrary } from "@/features/knowledge-engine/project-source-library";
import { authorizeResearchProjectDocumentHandoff } from "@/features/research-project-construction";
import { adoptBehaviorContribution, behaviorAuthority, richStudyContribution } from "@/features/protocol-designer/functional-reset/__tests__/p1-behavior-01a-contract-fixtures";
import { refreshFunctionalResetDocumentPortfolio } from "../functional-reset-boundary";
import { availableDocumentEvidence, reviseScientificDocument, validateDocumentEvidence, readableDocumentDiff, restoreDocumentRevision } from "../scientific-document-revision";
import { acquireDocumentKnowledge, resolveDocumentaryIntent } from "@/features/protocol-designer/functional-reset/documentary-conversation";
import { createProjectSession, readProjectSessions, saveProjectSession } from "@/features/protocol-designer/functional-reset/project-workspace-storage";
import { decodeSessionStorage, encodeSessionStorage } from "@/features/protocol-designer/functional-reset/session-storage-codec";
const AT = "2026-09-15T17:00:00Z";
const project = adoptBehaviorContribution(richStudyContribution(), null, 1);
const knowledge = executeKnowledgeEngine({ originalQuestion: "Comprendre ECV myocardique et fibrose en IRM", scientificObjectTerms: [{ term: "ECV myocardique", role: "SUBJECT" }], context: {}, externalSearchPolicy: "INTERNAL_ONLY", researchProjectId: project.projectId, researchProjectVersion: project.versionId, researchProjectDigest: project.projectDigest, createdAt: AT });
const library = collectProjectKnowledgeSources(emptyProjectSourceLibrary(project.projectId), knowledge);
const generate = () => refreshFunctionalResetDocumentPortfolio({ project, knowledgeLibrary: library, requestedAt: AT, generateProtocol: true, handoffDecision: authorizeResearchProjectDocumentHandoff({ project, authority: behaviorAuthority, confirmedAt: AT }) }).projections.at(-1)!;

describe("Living document: owner evidence, immutable revisions and scoped changes", () => {
  it("stores repeated documentary snapshots losslessly without aliasing historical versions", () => {
    const original = { versions: Array.from({ length: 12 }, () => generate()), accents: "Été — 🔬", nested: JSON.parse('{"__proto__":{"retained":true},"constructor":"literal"}') };
    const raw = JSON.stringify(original);
    const encoded = encodeSessionStorage(original);
    expect(raw.length).toBeGreaterThan(262_144);
    expect(encoded.length).toBeLessThan(raw.length / 2);
    const decoded = decodeSessionStorage(encoded) as typeof original;
    expect(JSON.stringify(decoded)).toBe(raw);
    expect(decoded.versions[0]).not.toBe(decoded.versions[1]);
    const broken = JSON.parse(encoded); broken.digest = "corrupt";
    expect(() => decodeSessionStorage(JSON.stringify(broken))).toThrow("SESSION_DICTIONARY_INTEGRITY_MISMATCH");
    broken.root = ["r", broken.nodes.length];
    expect(() => decodeSessionStorage(JSON.stringify(broken))).toThrow("SESSION_DICTIONARY_REFERENCE_INVALID");
  });
  it("binds documentary acquisition to the native current Project and reuses the retained result", () => {
    const saved = createProjectSession(localStorage, "Acquisition documentaire");
    const session = { ...saved.session, projectId: project.projectId, project };
    const before = JSON.stringify(project);
    const first = acquireDocumentKnowledge(session, AT);
    expect(first.sourceLibrary.projectId).toBe(project.projectId);
    expect(first.knowledgeOwnerLedger.entries).toHaveLength(session.knowledgeOwnerLedger.entries.length + 1);
    expect(first.knowledgeOwnerLedger.entries.at(-1)?.request.nativeInput).toMatchObject({ researchProjectId: project.projectId, strategyVersion: project.versionId });
    const repeated = acquireDocumentKnowledge({ ...session, ...first }, "2026-09-15T17:01:00Z");
    expect(repeated.knowledgeOwnerLedger).toEqual(first.knowledgeOwnerLedger);
    expect(JSON.stringify(project)).toBe(before);
    localStorage.clear();
  });
  it.each([
    "finalement l’ECV devient notre critère principal",
    "dans l’introduction, excluons les AVC récents",
    "dans le protocole, remplaçons l’IRM par le scanner",
    "considérons cette méthode comme gold standard",
    "Dans l’introduction, on élargit la population aux patients de 35 à 80 ans",
    "Ajoute une IRM à douze mois dans le protocole",
  ])("routes scientific change through Project/Human Review, never through an editorial rewrite: %s", (text) => {
    expect(resolveDocumentaryIntent(text, true).kind).toBe("PROJECT_CHANGE");
  });
  it("keeps unsupported scopes explicit instead of rewriting another scientific section", () => {
    expect(resolveDocumentaryIntent("raccourcis la méthodologie statistique", true).kind).toBe("CLARIFY");
    expect(resolveDocumentaryIntent("développe davantage l’introduction", true).kind).toBe("DOCUMENT_REVISION");
    expect(resolveDocumentaryIntent("traite l’introduction sous l’angle de Bob et al. 2016", true)).toMatchObject({ kind: "DOCUMENT_REVISION", transformation: "FOCUS_SOURCE", sourceRequired: true });
    expect(resolveDocumentaryIntent("Ajoute cette publication sur l’IRM : PMID 22963517", true)).toMatchObject({ kind: "DOCUMENT_REVISION", transformation: "ADD_SOURCE" });
  });
  it("generates genuine Knowledge-backed context through the existing TMP/DOC chain", () => {
    const projection = generate();
    expect(projection).toBeDefined();
    expect(projection.evidenceContent?.paragraphs.length).toBeGreaterThan(0);
    expect(validateDocumentEvidence(projection.evidenceContent!)).toBe(true);
    expect(projection.audit?.passed).toBe(true);
    expect(projection.source.projectId).toBe(project.projectId);
    expect(projection.sections.find((section) => section.sectionId === "scientific-background")?.templateNodeIds).toContain("TMP-NODE:SCIENTIFIC_BACKGROUND");
  });
  it("retains source history without reusing qualifications absent from the current owner result", () => {
    const next = collectProjectKnowledgeSources(library, { ...knowledge, sources: [], applicableAssertions: [], evidence: [] });
    expect(next.sources).toHaveLength(library.sources.length);
    expect(availableDocumentEvidence(next)).toEqual([]);
    expect(next.sources[0]!.knowledgeResultRefs).toEqual(library.sources[0]!.knowledgeResultRefs);
  });
  it("does not turn an unresolved Knowledge controversy into a supported documentary assertion", () => {
    const claim = availableDocumentEvidence(library)[0]!;
    const assertion = knowledge.applicableAssertions.find((item) => item.revision === claim.assertionRefs[0])!;
    const next = collectProjectKnowledgeSources(library, { ...knowledge, controversies: [{ conflictId: "qualified-conflict", state: "CONTROVERSY", positionIds: [assertion.stableId], explanation: "Positions incompatibles non arbitrées." }] });
    expect(next.sources.some((source) => source.conflicts?.length)).toBe(true);
    expect(availableDocumentEvidence(next).some((item) => item.assertionRefs.includes(assertion.revision))).toBe(false);
  });
  it("keeps technical provenance changes out of the researcher-facing content diff", () => {
    const previous = generate();
    const next = { ...previous, projectionVersion: "1.0.1", sections: previous.sections.map((section) => ({ ...section, contentDigest: "different-provenance", provenanceRefs: [...section.provenanceRefs, "technical-only"] })) };
    expect(readableDocumentDiff(previous, next)).toContain("Contenu des sections inchangé");
  });
  it("keeps user relevance independent from evidence assessment and survives rehydration", () => {
    const entry = library.sources.find((source) => source.source.pmid)!;
    const next = recordSourceInterest(library, { text: `Il manque PMID ${entry.source.pmid} dans l’introduction`, turnRef: "doc:1", recordedAt: AT, explicitUse: true }).library;
    expect(next.sources.find((source) => source.source.sourceId === entry.source.sourceId)?.scientificWeight).toEqual(entry.scientificWeight);
    expect(next.sources.find((source) => source.source.sourceId === entry.source.sourceId)?.userRelevance).toBe("EXPLICIT_INTEREST");
    expect(rehydrateProjectSourceLibrary(JSON.parse(JSON.stringify(next)), project.projectId)).toEqual(next);
    expect(() => rehydrateProjectSourceLibrary(next, "different-project")).toThrow();
    const mention = recordSourceInterest(library, { text: "Bob et al. 2016", turnRef: "doc:2", recordedAt: AT, explicitUse: false });
    expect(mention.resolution.status).toBe("UNRESOLVED");
    expect(mention.library.unresolvedMentions[0]).toMatchObject({ userRelevance: "NONE", text: "Bob et al. 2016" });
  });
  it("expands only the requested background and references, without altering the Project", () => {
    const previous = generate(); const before = JSON.stringify(previous); const canonical = JSON.stringify(project);
    const { projection: next } = reviseScientificDocument({ projection: previous, library, transformation: "EXPAND", instruction: "développe davantage l’introduction", turnRef: "doc:3", timestamp: AT });
    expect(next.projectionId).not.toBe(previous.projectionId);
    expect(next.priorProjectionId).toBe(previous.projectionId);
    expect(next.documentaryRevision?.validation).toMatchObject({ scope: "DOCUMENT_REVISION_ONLY", citationAssertionConsistency: "PASS" });
    expect(next.evidenceContent!.paragraphs.length).toBeGreaterThan(previous.evidenceContent!.paragraphs.length);
    expect(next.sections.filter((s) => !s.sectionId.startsWith("scientific-background") && !s.sectionId.startsWith("scientific-references"))).toEqual(previous.sections.filter((s) => !s.sectionId.startsWith("scientific-background") && !s.sectionId.startsWith("scientific-references")));
    expect(JSON.stringify(previous)).toBe(before); expect(JSON.stringify(project)).toBe(canonical);
    expect(readableDocumentDiff(previous, next)).toContain("Project est inchangée");
  });
  it("removes a solely supported assertion when its only cited source is removed", () => {
    const previous = generate();
    const sole = previous.evidenceContent!.paragraphs.find((paragraph) => paragraph.sourceRefs.length === 1)!;
    expect(sole).toBeDefined();
    const next = reviseScientificDocument({ projection: previous, library, transformation: "REMOVE_SOURCE", sourceId: sole.sourceRefs[0], instruction: "retire cette source", turnRef: "doc:4", timestamp: AT });
    expect(next.projection.evidenceContent!.paragraphs.some((paragraph) => paragraph.paragraphId === sole.paragraphId)).toBe(false);
    expect(validateDocumentEvidence(next.projection.evidenceContent!)).toBe(true);
    expect(next.message).toContain("sans autre preuve");
  });
  it("does not permit decorative citations or corrupted claim text", () => {
    const projection = generate();
    const corrupted = JSON.parse(JSON.stringify(projection.evidenceContent));
    corrupted.paragraphs[0].text = "Cette méthode prouve la causalité dans tous les patients.";
    expect(() => validateDocumentEvidence(corrupted)).toThrow("DOCUMENT_CITATION_ASSERTION_MISMATCH");
    const unused = library.sources.find((entry) => !projection.evidenceContent!.sources.some((used) => used.source.sourceId === entry.source.sourceId))!;
    expect(() => validateDocumentEvidence({ ...projection.evidenceContent!, sources: [...projection.evidenceContent!.sources, unused] })).toThrow("DOCUMENT_DECORATIVE_REFERENCE");
  });
  it("can explicitly reintroduce a previously removed qualified source", () => {
    const previous = generate();
    const sole = previous.evidenceContent!.paragraphs.find((paragraph) => paragraph.sourceRefs.length === 1)!;
    const sourceId = sole.sourceRefs[0];
    const removed = reviseScientificDocument({ projection: previous, library, transformation: "REMOVE_SOURCE", sourceId, instruction: "retire cette source", turnRef: "doc:remove", timestamp: AT }).projection;
    const added = reviseScientificDocument({ projection: removed, library, transformation: "ADD_SOURCE", sourceId, instruction: "ajoute de nouveau cette source", turnRef: "doc:re-add", timestamp: AT }).projection;
    expect(added.evidenceContent!.excludedSourceRefs).not.toContain(sourceId);
    expect(added.evidenceContent!.paragraphs.some((p) => p.sourceRefs.includes(sourceId))).toBe(true);
    expect(validateDocumentEvidence(added.evidenceContent!)).toBe(true);
  });
  it("preserves the documented source exclusion when the Project document is regenerated", () => {
    const previous = generate();
    const sourceId = previous.evidenceContent!.paragraphs[0]!.sourceRefs[0]!;
    const removed = reviseScientificDocument({ projection: previous, library, transformation: "REMOVE_SOURCE", sourceId, instruction: "retire cette source", turnRef: "doc:remove-before-regenerate", timestamp: AT }).projection;
    const regenerated = refreshFunctionalResetDocumentPortfolio({ project, knowledgeLibrary: library, requestedAt: "2026-09-15T17:05:00Z", generateProtocol: true,
      previous: { ...createProjectSession(localStorage, "Régénération").session.documents, projections: [previous, removed] },
      handoffDecision: authorizeResearchProjectDocumentHandoff({ project, authority: behaviorAuthority, confirmedAt: AT }) }).projections.at(-1)!;
    expect(regenerated.evidenceContent!.excludedSourceRefs).toContain(sourceId);
    expect(regenerated.evidenceContent!.paragraphs.some((p) => p.sourceRefs.includes(sourceId))).toBe(false);
    localStorage.clear();
  });
  it("refuses a source with no admissible assertion and never invents its support", () => {
    const projection = generate(); const eligible = new Set(availableDocumentEvidence(library).flatMap((p) => p.sourceRefs));
    const unused = library.sources.find((entry) => !eligible.has(entry.source.sourceId))!;
    expect(unused).toBeDefined();
    expect(() => reviseScientificDocument({ projection, library, transformation: "ADD_SOURCE", sourceId: unused.source.sourceId, instruction: "ajoute cette publication", turnRef: "doc:5", timestamp: AT })).toThrow("SOURCE_WITHOUT_APPLICABLE_DOCUMENTARY_ASSERTION");
  });
  it("restores the previous content as a new version and refuses rollback across a scientific change", () => {
    const previous = generate();
    const current = reviseScientificDocument({ projection: previous, library, transformation: "EXPAND", instruction: "développe l’introduction", turnRef: "doc:6", timestamp: AT }).projection;
    const restored = restoreDocumentRevision(current, previous, { instruction: "reviens à la version précédente", turnRef: "doc:7", timestamp: AT });
    expect(restored.evidenceContent).toEqual(previous.evidenceContent);
    expect(restored.sections).toEqual(previous.sections);
    expect(restored.projectionId).not.toBe(previous.projectionId);
    expect(restored.priorProjectionId).toBe(current.projectionId);
    expect(restored.documentaryRevision?.restoredFromProjectionId).toBe(previous.projectionId);
    expect(() => restoreDocumentRevision({ ...current, source: { ...current.source, projectDigest: "changed-science" } }, previous, { instruction: "restaure", turnRef: "doc:8", timestamp: AT })).toThrow("DOCUMENT_RESTORE_SOURCE_CHANGED");
  });
  it("persists and reopens sources, citations, document history and Project together without approximate reconstruction", () => {
    localStorage.clear();
    const saved = createProjectSession(localStorage, "Document vivant");
    saved.session.projectId = project.projectId;
    saved.session.project = project;
    saved.session.sourceLibrary = library;
    const projection = generate();
    const next = reviseScientificDocument({ projection, library, transformation: "EXPAND", instruction: "développe l’introduction", turnRef: "doc:persist", timestamp: AT }).projection;
    saved.session.documents = { ...saved.session.documents, projections: [projection, next] };
    saved.raw = saveProjectSession(localStorage, saved, saved.session);
    const read = readProjectSessions(localStorage);
    expect(read.unreadable).toEqual([]);
    expect(read.projects[0]!.session.project).toEqual(project);
    expect(read.projects[0]!.session.sourceLibrary).toEqual(library);
    expect(read.projects[0]!.session.documents.projections).toEqual([projection, next]);
    localStorage.clear();
  });
});
