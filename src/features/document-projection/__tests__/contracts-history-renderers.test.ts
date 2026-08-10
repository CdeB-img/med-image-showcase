import { describe, expect, it } from "vitest";
import { appendProjectionHistory, createProjectionHistory, diffProjections, projectDocument, renderProjection, transitionProjectionHistory } from "..";
import type { DocumentProjection, DocumentProjectionRequest, ProjectionDefinition } from "../types";
import { makeAuthorizedProject, reviseProject } from "./fixtures";

const makeProjection = (request: DocumentProjectionRequest): DocumentProjection => {
  const result = projectDocument(request);
  if (!result.ok) throw new Error("PROJECTION_FAILED");
  return result.projection;
};

const request = (session: ReturnType<typeof makeAuthorizedProject>, project = session.result, priorProjection: DocumentProjection | null = null, requestedAt = "2026-08-10T16:00:00.000Z"): DocumentProjectionRequest => ({
  project,
  decisionRecords: session.decisionHistory,
  projectionType: "PROTOCOL",
  profile: "RESEARCH_PROTOCOL",
  usage: "SCIENTIFIC_REVIEW",
  audience: "RESEARCH_TEAM",
  requestedAt,
  priorProjection,
});

describe("DOC-001 — contrats, historique, diff et exports", () => {
  it("ajoute une projection par seule ProjectionDefinition sans modifier le moteur", () => {
    const session = makeAuthorizedProject();
    const custom: ProjectionDefinition = {
      definitionId: "test-summary-definition",
      projectionType: "TEST_SUMMARY",
      label: "Test Summary",
      title: "Test Summary — projection déclarative",
      definitionVersion: "1.0",
      status: "IMPLEMENTED",
      sections: [{
        sectionId: "question-only", title: "Question", order: 1, intent: "DECLARE", pattern: "DECLARATIVE",
        sourcePaths: ["scientificQuestion"], requiredObjectKinds: ["ScientificQuestion"], optionalObjectKinds: [], dependencyTypes: [], specializedEngine: null,
        applicability: { kind: "ALWAYS", value: "APPLICABLE" },
        generability: { minimumFacts: 1, messages: { GENERATABLE: "Question disponible.", NOT_GENERATABLE: "Question absente." } },
        facts: [{ select: "scientificQuestion", label: "Question", template: "{{text}}", sourceKind: "ScientificQuestion", sourceIdPath: "questionId", commitment: { kind: "STATIC", value: "CONFIRMED" } }],
        unknowns: [], limitations: [], contradictions: [], decisionGateIds: [],
      }],
    };
    const protocol = makeProjection(request(session));
    const result = projectDocument({ ...request(session), projectionType: "TEST_SUMMARY", definitions: [custom], priorProjection: protocol });
    expect(result).toMatchObject({ ok: true, projection: { projectionType: "TEST_SUMMARY", title: custom.title, priorProjectionId: null, sections: [{ sectionId: "question-only", status: "GENERATABLE" }] } });
    if (result.ok) expect(result.projection.seriesId).not.toBe(protocol.seriesId);
  });

  it("différencie les niveaux d'engagement éditorial", () => {
    const session = makeAuthorizedProject();
    const objectives = session.result.objectives.map((item) => ({ ...item, reviewState: "PENDING" as const }));
    const projection = makeProjection(request(session, reviseProject(session.result, { objectives })));
    const content = projection.sections.find((item) => item.sectionId === "objectives-hypotheses")!.blocks.flatMap((item) => item.items).join(" ");
    expect(content).toContain("Candidat — Objectif");
    expect(content).toContain("Adopté — Hypothèse");
  });

  it("rend Markdown et HTML sans modifier la projection et échappe le HTML source", () => {
    const session = makeAuthorizedProject();
    const objectives = session.result.objectives.map((item) => ({ ...item, text: `${item.text} <script>alert(1)</script>` }));
    const projection = makeProjection(request(session, reviseProject(session.result, { objectives })));
    const snapshot = JSON.stringify(projection);
    const markdown = renderProjection(projection, "MARKDOWN");
    const html = renderProjection(projection, "HTML");
    expect(markdown).toMatchObject({ extension: "md", mimeType: expect.stringContaining("text/markdown") });
    expect(html).toMatchObject({ extension: "html", mimeType: expect.stringContaining("text/html") });
    expect(html.content).not.toContain("<script>alert(1)</script>");
    expect(html.content).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html.content).toContain("Provenance");
    expect(JSON.stringify(projection)).toBe(snapshot);
  });

  it("conserve un historique immuable et qualifie la version antérieure comme superseded", () => {
    const session = makeAuthorizedProject();
    const first = makeProjection(request(session));
    const revised = reviseProject(session.result, { candidateVersion: { ...session.result.candidateVersion, versionId: "project-version:2", priorVersion: session.result.candidateVersion.versionId } });
    const second = makeProjection(request(session, revised, first, "2026-08-10T17:00:00.000Z"));
    const initial = appendProjectionHistory(createProjectionHistory(), first);
    const initialSnapshot = JSON.stringify(initial);
    const history = appendProjectionHistory(initial, second);
    expect(JSON.stringify(initial)).toBe(initialSnapshot);
    expect(history.entries.map((item) => item.historicalStatus)).toEqual(["SUPERSEDED", second.lifecycle]);
    expect(history.entries[0].projection).toBe(first);
  });

  it("produit un diff structurel avec changement de générabilité", () => {
    const session = makeAuthorizedProject();
    const first = makeProjection(request(session));
    const revised = reviseProject(session.result, {
      candidateVersion: { ...session.result.candidateVersion, versionId: "project-version:2", priorVersion: session.result.candidateVersion.versionId },
      contradictions: ["Contradiction ajoutée à la nouvelle version."],
    });
    const second = makeProjection(request(session, revised, first, "2026-08-10T17:00:00.000Z"));
    const diff = diffProjections(first, second);
    expect(diff.sourceVersionChanged).toBe(true);
    expect(diff.sections.find((item) => item.sectionId === "open-elements")).toMatchObject({ kind: "MODIFIED", generabilityChanged: true, nextStatus: "BLOCKED" });
    expect(diff.counts.MODIFIED).toBeGreaterThan(0);
  });

  it("applique uniquement les transitions de cycle de vie autorisées dans l'historique", () => {
    const session = makeAuthorizedProject();
    const projection = makeProjection(request(session));
    const history = appendProjectionHistory(createProjectionHistory(), projection);
    const reviewed = transitionProjectionHistory(history, projection.projectionId, projection.lifecycle === "READY_FOR_REVIEW" ? "REVIEWED" : "ARCHIVED");
    expect(reviewed.entries[0].historicalStatus).toBe(projection.lifecycle === "READY_FOR_REVIEW" ? "REVIEWED" : "ARCHIVED");
    expect(() => transitionProjectionHistory(reviewed, projection.projectionId, "DRAFT")).toThrow("INVALID_PROJECTION_LIFECYCLE_TRANSITION");
  });
});
