import { stableStringify } from "@/features/knowledge-engine/canonical";
import { describe, expect, it } from "vitest";
import { planProjection, projectDocument, renderProjectionHtml, renderProjectionMarkdown } from "..";
import type { DocumentProjection, DocumentProjectionRequest } from "../types";
import { makeAuthorizedImagingProject, makeAuthorizedProject, makeTemplateProjectionRequest, reviseProject } from "./fixtures";

const requestFor = (session: ReturnType<typeof makeAuthorizedProject>, overrides: Partial<DocumentProjectionRequest> = {}): DocumentProjectionRequest => makeTemplateProjectionRequest(session, overrides);

const projectionFrom = (request: DocumentProjectionRequest): DocumentProjection => {
  const result = projectDocument(request);
  if (!result.ok) throw new Error("plan" in result ? result.plan.refusal?.code ?? "PROJECTION_FAILED" : "PROJECTION_FAILED");
  return result.projection;
};

describe("DOC-001 — Projection Protocol", () => {
  it("projette un projet minimal sans compléter les contenus absents", () => {
    const session = makeAuthorizedProject();
    const minimal = reviseProject(session.result, { objectives: [], hypotheses: [], endpointCandidates: [], variables: [] });
    const projection = projectionFrom(requestFor(session, { project: minimal }));
    expect(projection.lifecycle).toBe("PARTIAL");
    expect(projection.sections.find((item) => item.sectionId === "objectives-hypotheses")).toMatchObject({ status: "NOT_GENERATABLE" });
    expect(projection.unknowns.join(" ")).toMatch(/Aucun Objectif|aucun Objectif/i);
  });

  it("projette la contribution Imaging complète sans fabriquer de protocole d’acquisition", () => {
    const session = makeAuthorizedImagingProject();
    const projection = projectionFrom(requestFor(session));
    const imaging = projection.sections.find((item) => item.sectionId === "imaging")!;
    expect(imaging.applicability).toBe("APPLICABLE");
    expect(imaging.status).toBe("PARTIALLY_GENERATABLE");
    expect(imaging.blocks.flatMap((item) => item.items).join(" ")).toContain("EXECUTABLE_PROTOCOL_NOT_READY");
    expect(imaging.limitations.join(" ")).toMatch(/Aucun paramètre constructeur/);
  });

  it("conserve explicitement l'absence d'Imaging comme non applicable", () => {
    const session = makeAuthorizedProject();
    const projection = projectionFrom(requestFor(session));
    expect(projection.sections.find((item) => item.sectionId === "imaging")).toMatchObject({ applicability: "NOT_APPLICABLE", status: "NOT_APPLICABLE" });
  });

  it("refuse de générer la substance statistique sans Biostatistics Engine", () => {
    const session = makeAuthorizedProject();
    const section = projectionFrom(requestFor(session)).sections.find((item) => item.sectionId === "analysis-statistics")!;
    expect(section.status).toBe("FUTURE");
    expect(section.futureReason).toMatch(/futur|future/i);
    expect(section.blocks.flatMap((item) => item.items).join(" ")).toContain("NO_STATISTICAL_VALUE_INVENTED");
  });

  it("garde une décision ouverte visible et limite la section correspondante", () => {
    const session = makeAuthorizedProject();
    const decisionsRequired = session.result.decisionsRequired.map((item, index) => index === 0 ? { ...item, status: "PENDING" as const } : item);
    const project = reviseProject(session.result, { decisionsRequired });
    const firstGateId = decisionsRequired[0].gateId;
    const decisionRecords = session.decisionHistory.map((item) => item.gateId === firstGateId ? { ...item, status: "PENDING" as const, actor: null, mandate: null, timestamp: null } : item);
    const projection = projectionFrom(requestFor(session, { project, decisionRecords }));
    expect(projection.sections.find((item) => item.sectionId === "open-elements")).toMatchObject({ status: "PARTIALLY_GENERATABLE" });
    expect(projection.humanDecisions).toContainEqual(expect.objectContaining({ status: "PENDING" }));
  });

  it("préserve les inconnues sans les transformer en affirmations", () => {
    const session = makeAuthorizedProject();
    const project = reviseProject(session.result, { missingInformation: ["Méthode de mesure inconnue"] });
    const projection = projectionFrom(requestFor(session, { project }));
    expect(projection.unknowns).toContain("Méthode de mesure inconnue");
    expect(renderProjectionMarkdown(projection)).toMatch(/Inconnues[\s\S]*Méthode de mesure inconnue/);
  });

  it("préserve une contradiction et bloque la complétude sans la résoudre", () => {
    const session = makeAuthorizedProject();
    const project = reviseProject(session.result, { contradictions: ["Les deux fenêtres temporelles déclarées sont incompatibles."] });
    const projection = projectionFrom(requestFor(session, { project }));
    expect(projection.contradictions).toContain("Les deux fenêtres temporelles déclarées sont incompatibles.");
    expect(projection.sections.find((item) => item.sectionId === "open-elements")?.status).toBe("BLOCKED");
  });

  it("crée une nouvelle version après changement du projet et préserve l'ancienne", () => {
    const session = makeAuthorizedProject();
    const first = projectionFrom(requestFor(session));
    const oldSnapshot = stableStringify(first);
    const project = reviseProject(session.result, {
      candidateVersion: { ...session.result.candidateVersion, versionId: `${session.result.candidateVersion.versionId}:revision-2`, priorVersion: session.result.candidateVersion.versionId },
      objectives: session.result.objectives.map((item) => ({ ...item, text: `${item.text} Révision explicitement sourcée.` })),
    });
    const second = projectionFrom(requestFor(session, { project, priorProjection: first, requestedAt: "2026-08-10T17:00:00.000Z" }));
    expect(second.projectionVersion).toBe("1.1.0");
    expect(second.priorProjectionId).toBe(first.projectionId);
    expect(stableStringify(first)).toBe(oldSnapshot);
    expect(first.projectionId).not.toBe(second.projectionId);
  });

  it("rejoue déterministiquement la même projection", () => {
    const session = makeAuthorizedProject();
    const request = requestFor(session);
    const first = projectionFrom(request);
    const replay = projectionFrom({ ...request, priorProjection: first });
    expect(replay).toBe(first);
    expect(projectionFrom(request)).toEqual(first);
  });

  it("ne mute jamais le Research Project et n'invente aucun nombre ou design", () => {
    const session = makeAuthorizedProject();
    const before = stableStringify(session.result);
    const projection = projectionFrom(requestFor(session));
    const rendered = renderProjectionMarkdown(projection);
    expect(stableStringify(session.result)).toBe(before);
    expect(rendered).not.toMatch(/randomis[ée]|100 sujets|puissance de 80|\bp\s*(?:=|<|>)\s*\d/i);
    expect(JSON.stringify(projection)).toContain("NO_STATISTICAL_VALUE_INVENTED");
  });

  it("refuse les projections sœurs déclarées mais non implémentées", () => {
    const session = makeAuthorizedProject();
    const plan = planProjection(session.result, "SAP");
    expect(plan).toMatchObject({ supported: false, refusal: { code: "UNSUPPORTED_PROJECTION_TYPE" } });
    expect(projectDocument(requestFor(session, { projectionType: "SAP" }))).toMatchObject({ ok: false });
  });

  it("refuse une source non gelée ou un handoff non autorisé", () => {
    const session = makeAuthorizedProject();
    const project = reviseProject(session.result, { candidateVersion: { ...session.result.candidateVersion, status: "CANDIDATE_NOT_FROZEN", frozenAt: null, actor: null } });
    expect(projectDocument(requestFor(session, { project }))).toMatchObject({ ok: false, plan: { refusal: { code: "SOURCE_PROJECT_NOT_FROZEN" } } });
  });
});
