import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { workingRevisionFixture } from "./working-revision-fixture";
import { buildProjectContextSnapshot, type ProjectContextSnapshot } from "../../research-project-construction/canonical-project-backbone";
import { logicalDigest } from "../../knowledge-engine/canonical";
import { documentNativeIdentity } from "../generation-persistence";
import { docSha256 } from "../../../../server/protocol-designer-document-archive";
import { inspectDocumentImpact } from "../document-impact";
import DocumentImpactSummary from "../DocumentImpactSummary";
import DocumentArchiveHistory from "../../protocol-designer/functional-reset/DocumentArchiveHistory";

/** Synthetic native-history deltas; never edits an archive row or adopted PRJ. */
const nextSnapshot = (source: ProjectContextSnapshot, type: string) => {
  const next = structuredClone(source), old = next.objects.find(object => object.type === type)!;
  if (!old) throw new Error(`Missing native fixture type ${type}`);
  next.historicalObjectVersions.push({ ...old, supersededByVersionRef: `${old.versionRef}:next` });
  next.objects = next.objects.map(object => object.stableId === old.stableId ? { ...object, content: `Modification explicite de fixture — ${type}`, version: object.version + 1, versionRef: `${object.versionRef}:next` } : object);
  const version = next.versionHistory.at(-1)!;
  next.previousProjectVersion = next.sourceProjectVersion; next.sourceProjectVersion = `${next.sourceProjectRef}:version:${next.sourceProjectRevision + 1}`;
  next.sourceProjectRevision++; next.sourceProjectDigest = logicalDigest(next.objects);
  next.versionHistory.push({ ...version, versionId: next.sourceProjectVersion, previousVersionId: next.previousProjectVersion,
    revision: next.sourceProjectRevision, objectVersionRefs: version.objectVersionRefs.map(ref => ref === old.versionRef ? `${ref}:next` : ref) });
  const { snapshotDigest: _digest, ...material } = next;
  return { ...material, snapshotDigest: logicalDigest(material) };
};
describe("DOC impact / native bindings, not text-based science", () => {
  it.each(["ENDPOINT", "POPULATION"])("detects an adopted %s dependency and preserves all historical bodies", async type => {
    const run = await workingRevisionFixture({ population: "adultes ayant présenté un infarctus du myocarde" }), before = run.fixture.bodies();
    const current = nextSnapshot(buildProjectContextSnapshot({ project: run.project2 }), type);
    const report = await inspectDocumentImpact({ source: run.g2, currentProject: current });
    expect(report.projectCurrent).toBe(false); expect(report.knownAffectedCount).toBeGreaterThan(0);
    expect(report.exhaustiveAffectedCount).toBeNull(); expect(report.documents.every(document => document.state === "POTENTIALLY_OUTDATED")).toBe(true);
    expect(run.fixture.bodies()).toEqual(before);
  });
  it("uses temporal/occasion version bindings where available and otherwise preserves the exact gap", async () => {
    const run = await workingRevisionFixture(), current = buildProjectContextSnapshot({ project: run.project3 });
    const report = await inspectDocumentImpact({ source: run.g2, currentProject: current });
    expect(report.projectCurrent).toBe(false);
    expect(report.documents.every(document => ["POTENTIALLY_OUTDATED", "REFERENCED_STATE_UNCHANGED", "UNKNOWN"].includes(document.state))).toBe(true);
    expect(report.exhaustiveAffectedCount).toBeNull();
    // Incomplete historical native timing never becomes "scientifically current".
    expect(report.documents.every(document => document.state !== "CURRENT_BINDING")).toBe(true);
  });
  it("distinguishes unchanged references from exhaustive compatibility and unresolved/draft science", async () => {
    const run = await workingRevisionFixture({ population: "adultes ayant présenté un infarctus du myocarde" }), current = nextSnapshot(buildProjectContextSnapshot({ project: run.project2 }), "ENDPOINT");
    const body = structuredClone(run.g2.body);
    if (body.native.family !== "DRCI") throw new Error("fixture");
    const population = body.native.value.sourceFacts.find(fact => fact.type === "POPULATION")!;
    body.native.value.documents.forEach(document => { document.sections.forEach(section => { section.sourceRefs = [population.ref]; }); });
    const { packDigest: _packDigest, ...material } = body.native.value;
    const sourceBody = { ...body, native: { family: "DRCI" as const, value: { ...material, packDigest: logicalDigest(material) } } };
    const ref = { ...run.g2.ref, generationId: documentNativeIdentity(sourceBody.native), bodySha256: docSha256(JSON.stringify(sourceBody)), bodyBytes: Buffer.byteLength(JSON.stringify(sourceBody)) };
    const report = await inspectDocumentImpact({ source: { ref, body: sourceBody }, currentProject: current, pendingScientificChange: true, unassessedDraft: true });
    expect(report.documents.find(document => document.nativeDocumentRef === "RECRUITMENT")?.state).toBe("REFERENCED_STATE_UNCHANGED");
    render(<DocumentImpactSummary report={report} />);
    expect(screen.getByText(/couverture exhaustive/u)).toBeInTheDocument();
    expect(screen.getByText(/contributions scientifiques restent non adoptées/u)).toBeInTheDocument();
    expect(screen.getByText(/modifications non évaluées/u)).toBeInTheDocument(); cleanup();
  });
  it("does not mistake a same-Project documentary edit for a Project change", async () => {
    const run = await workingRevisionFixture(), body = structuredClone(run.g2.body), current = buildProjectContextSnapshot({ project: run.project2 });
    if (body.native.family !== "DRCI") throw new Error("fixture");
    const pack = body.native.value, document = pack.documents.find(document => document.kind === "PROTOCOL_FULL")!;
    const originalText = document.sections[0].paragraphs[0]; document.sections[0].paragraphs[0] = `${originalText} Reformulation éditoriale de fixture.`;
    // Sanitized existing DOC provenance shape. It is not a Studio semantic assessment.
    const { packDigest: _packDigest, ...original } = pack;
    const material = { ...original, humanRevision: { kind: "HUMAN_DOCUMENT_REVISION" as const, scientificImpact: "DOCUMENT_ONLY" as const, reviewRef: "fixture:qualified-review",
      createdAt: pack.generatedAt, parentPackDigest: pack.packDigest, projectBinding: pack.project, evidenceDigest: logicalDigest(null), entries: [{ document: "PROTOCOL_FULL" as const, field: "PARAGRAPH" as const, sectionIndex: 0,
        section: document.sections[0].title, index: 0, originalText, revisedText: document.sections[0].paragraphs[0], originalDigest: logicalDigest(originalText), revisedDigest: logicalDigest(document.sections[0].paragraphs[0]),
        revisionOrigin: "HUMAN_REVIEW" as const, reason: "Fixture documentaire", projectBinding: pack.project, documentPackBinding: pack.packDigest }] } };
    const sourceBody = { ...body, native: { family: "DRCI" as const, value: { ...material, packDigest: logicalDigest(material) } } };
    const ref = { ...run.g2.ref, generationId: documentNativeIdentity(sourceBody.native), bodySha256: docSha256(JSON.stringify(sourceBody)), bodyBytes: Buffer.byteLength(JSON.stringify(sourceBody)) };
    const report = await inspectDocumentImpact({ source: { ref, body: sourceBody }, currentProject: current });
    expect(report.knownAffectedCount).toBe(0); expect(report.projectCurrent).toBe(true);
    expect(report.documents.find(document => document.nativeDocumentRef === "PROTOCOL_FULL")?.state).toBe("EDITORIALLY_MODIFIED");
    expect(report.documents.find(document => document.nativeDocumentRef === "RECRUITMENT")?.state).toBe("CURRENT_BINDING");
  });
  it("fails closed for damaged/foreign binding; incomplete history remains UNKNOWN", async () => {
    const run = await workingRevisionFixture(), current = nextSnapshot(buildProjectContextSnapshot({ project: run.project2 }), "ENDPOINT");
    await expect(inspectDocumentImpact({ source: { ...run.g2, ref: { ...run.g2.ref, bodySha256: "f".repeat(64) } }, currentProject: current })).rejects.toThrow("DOC_IMPACT_SOURCE_BINDING_INVALID");
    const source = structuredClone(current); source.versionHistory = [];
    const { snapshotDigest: _digest, ...material } = source;
    const report = await inspectDocumentImpact({ source: run.g2, currentProject: { ...material, snapshotDigest: logicalDigest(material) } });
    expect(report.documents.every(document => document.state === "UNKNOWN")).toBe(true);
    const projection = await run.archive.body(run.access2, run.g2.projection.projectionId);
    expect((await inspectDocumentImpact({ source: projection, currentProject: buildProjectContextSnapshot({ project: run.project2 }) })).documents[0].state).toBe("CURRENT_BINDING");
  });
  it("history inspection is explicit/lazy, one selected body and no generation/save/propagation", async () => {
    const run = await workingRevisionFixture(), body = vi.fn(async () => run.g2), provider = vi.fn(), save = vi.fn();
    const client = { history: vi.fn(async () => ({ entries: [run.g2.ref], nextBeforeOrdinal: null })), body };
    render(<DocumentArchiveHistory client={client as never} currentProjectDigest={run.project2.projectDigest} currentProjectSnapshot={buildProjectContextSnapshot({ project: run.project2 })} onOpen={vi.fn()} />);
    await screen.findByRole("button", { name: "Vérifier l’impact sur Version 2" }); expect(body).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Vérifier l’impact sur Version 2" }));
    await waitFor(() => expect(screen.getByLabelText("Cohérence et impact documentaire")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Vérifier l’impact sur Version 2" })); await waitFor(() => expect(body).toHaveBeenCalledTimes(1));
    expect(provider).not.toHaveBeenCalled(); expect(save).not.toHaveBeenCalled(); cleanup();
  });
});
