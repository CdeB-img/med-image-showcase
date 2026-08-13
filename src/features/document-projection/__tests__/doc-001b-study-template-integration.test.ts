import { DOCUMENTARY_PATTERN_CATALOG } from "@/features/documentary-knowledge/catalog";
import type { PatternCatalog } from "@/features/documentary-knowledge/types";
import { stableStringify } from "@/features/knowledge-engine/canonical";
import { resolveRegulatoryRequirements } from "@/features/regulatory-resolution";
import { phrcStage2Input } from "@/features/regulatory-resolution/__tests__/fixtures";
import type { ResearchProjectDesignResult } from "@/features/research-project-construction/types";
import { templateDigest } from "@/features/study-template";
import type { StudyTemplateDefinition, StudyTemplateInstance } from "@/features/study-template";
import { makeTemplateDecision } from "@/features/study-template/__tests__/fixtures";
import { describe, expect, it } from "vitest";
import {
  LEGACY_DIRECT_PROJECT_PROJECTION,
  TEMPLATE_STATUS_TO_DOCUMENT_STATUS,
  auditDocumentProjection,
  diffProjections,
  projectDocumentFromStudyTemplate,
  resolveTemplateDocumentDefinitions,
} from "..";
import type { DocumentProjection, DocumentProjectionRequest } from "../types";
import {
  makeAuthorizedImagingProject,
  makeAuthorizedProject,
  makeTemplateProjectionRequest,
  reviseProject,
} from "./fixtures";

const projectionFrom = (request: DocumentProjectionRequest): DocumentProjection => {
  const result = projectDocumentFromStudyTemplate(request);
  if (!result.ok) throw new Error("plan" in result ? result.plan.refusal?.code ?? "DOC001B_PROJECTION_FAILED" : "DOC001B_PROJECTION_FAILED");
  return result.projection;
};

const regulatoryFor = (project: Readonly<ResearchProjectDesignResult>, resolutionAsOf = "2026-01-15T12:00:00.000Z") => resolveRegulatoryRequirements({
  ...phrcStage2Input(),
  researchProjectId: project.documentHandoff.projectId,
  researchProjectVersion: project.candidateVersion.versionId,
  researchProjectDigest: project.resultDigest,
  resolutionAsOf,
});

describe("DOC-001B — StudyTemplateInstance → DocumentProjection", () => {
  it("1 — projette Project + Template en ProtocolProjection sans voie legacy", () => {
    const session = makeAuthorizedProject();
    const projection = projectionFrom(makeTemplateProjectionRequest(session));
    expect(projection.projectionType).toBe("PROTOCOL");
    expect(projection.source.template?.templateInstanceId).toMatch(/^TMP-INSTANCE:/);
    expect(projection.legacy).toBeUndefined();
    expect(projection.audit).toMatchObject({ passed: true, counts: { ERROR: 0 } });
  });

  it("2 — dérive la structure Protocol des Document/Section/Block definitions TMP", () => {
    const session = makeAuthorizedProject();
    const request = makeTemplateProjectionRequest(session);
    const projection = projectionFrom(request);
    expect(projection.documentDefinition).toMatchObject({ documentId: "PROTOCOL", templateNodeId: "TMP-DOC:PROTOCOL", status: "SUPPORTED_PROJECTION" });
    expect(projection.sections.every((section) => section.templateNodeIds.includes("TMP-DOC:PROTOCOL"))).toBe(true);
    expect(projection.sections.every((section) => section.templateSectionIds.includes("TMP-SECTION-DEF:PROTOCOL:PRIMARY"))).toBe(true);
    expect(projection.sections.find((section) => section.sectionId === "document-control")?.templateBlockIds).toContain("TMP-BLOCK-DEF:PROTOCOL:SPECIFIC");
  });

  it("3 — conserve le contenu scientifique Project-owned", () => {
    const session = makeAuthorizedProject();
    const projection = projectionFrom(makeTemplateProjectionRequest(session));
    const question = projection.sections.find((section) => section.sectionId === "scientific-question")!;
    expect(question.blocks.flatMap((block) => block.items).join(" ")).toContain(session.result.scientificQuestion.text);
    expect(question.projectObjectIds).toContain(`ScientificQuestion:${session.result.scientificQuestion.questionId}`);
    expect(projection.ownership.content).toBe("RESEARCH_PROJECT_AND_UPSTREAM_OWNERS");
  });

  it("4 — conserve les Requirement IDs et la provenance REG-001", () => {
    const session = makeAuthorizedProject();
    const request = makeTemplateProjectionRequest(session);
    const projection = projectionFrom(request);
    const requirementSection = projection.sections.find((section) => section.requirementIds.length > 0)!;
    expect(requirementSection.requirementIds).toContain("REQ_PHRC_STAGE2");
    expect(requirementSection.provenanceRefs).toContain(request.regulatoryResolutionRef.resolutionId);
    expect(projection.ownership.requirements).toBe("REG-001");
  });

  it("5 — conserve les Pattern IDs et le snapshot DOC-002 sans les promouvoir", () => {
    const session = makeAuthorizedProject();
    const request = makeTemplateProjectionRequest(session);
    const projection = projectionFrom(request);
    const patterned = projection.sections.find((section) => section.patternIds.length > 0)!;
    expect(patterned.provenanceRefs).toContain(request.documentaryPatternSnapshotRef.catalogId);
    expect(patterned.patternIds.every((patternId) => patternId.startsWith("DKP-"))).toBe(true);
    expect(projection.ownership.patterns).toBe("DOC-002");
  });

  it("6 — conserve TMP UNKNOWN comme DOC UNKNOWN", () => {
    const session = makeAuthorizedProject();
    const request = makeTemplateProjectionRequest(session, {
      declaredUnknowns: [{ unknownId: "unknown:endpoint", field: "endpoint.primary", reason: "Critère principal non arrêté.", provenance: ["human:test"] }],
    });
    const projection = projectionFrom(request);
    expect(projection.sections.find((section) => section.sectionId === "endpoints-variables")).toMatchObject({ templateStatus: "UNKNOWN", status: "UNKNOWN" });
    expect(projection.unknowns).toContain("Critère principal non arrêté.");
  });

  it("7 / cas A — conserve Imaging NOT_APPLICABLE avec ses sources", () => {
    const session = makeAuthorizedProject();
    const projection = projectionFrom(makeTemplateProjectionRequest(session));
    const imaging = projection.sections.find((section) => section.sectionId === "imaging")!;
    expect(imaging).toMatchObject({ templateStatus: "NOT_APPLICABLE", status: "NOT_APPLICABLE", applicability: "NOT_APPLICABLE" });
    expect(imaging.projectObjectIds.length).toBeGreaterThan(0);
  });

  it("8 — conserve TMP BLOCKED comme DOC BLOCKED", () => {
    const session = makeAuthorizedProject();
    const projection = projectionFrom(makeTemplateProjectionRequest(session, {
      templateHumanDecisions: [makeTemplateDecision("decision:block-endpoints", ["TMP-NODE:ENDPOINTS"], "BLOCKED")],
    }));
    expect(projection.sections.find((section) => section.sectionId === "endpoints-variables")).toMatchObject({ templateStatus: "BLOCKED", status: "BLOCKED" });
  });

  it("9 / cas F — garde Biostatistics FUTURE sans simuler le moteur", () => {
    const session = makeAuthorizedProject();
    const projection = projectionFrom(makeTemplateProjectionRequest(session));
    const statistics = projection.sections.find((section) => section.sectionId === "analysis-statistics")!;
    expect(statistics).toMatchObject({ templateStatus: "FUTURE", status: "FUTURE", sourceEngine: "Biostatistics Engine" });
    expect(statistics.futureReason).toMatch(/futur|future/i);
  });

  it("10 / cas G — conserve un conflit TMP ouvert et bloque les sections affectées", () => {
    const session = makeAuthorizedProject();
    const project = reviseProject(session.result, { contradictions: ["Deux fenêtres temporelles incompatibles."] });
    const projection = projectionFrom(makeTemplateProjectionRequest(session, { project }));
    const open = projection.sections.find((section) => section.sectionId === "open-elements")!;
    expect(open.templateStatus).toBe("CONFLICTING");
    expect(open.status).toBe("BLOCKED");
    expect(open.conflicts).toContain("Deux fenêtres temporelles incompatibles.");
  });

  it("11 — un changement de définition Template produit une nouvelle projection et un diff structurel", () => {
    const session = makeAuthorizedProject();
    const firstRequest = makeTemplateProjectionRequest(session);
    const first = projectionFrom(firstRequest);
    const definition = structuredClone(firstRequest.templateContext.definition) as StudyTemplateDefinition;
    definition.templateVersion = "1.0.1";
    definition.templateRevision = 2;
    definition.digest = templateDigest({ prior: firstRequest.templateContext.definition.digest, change: "TEST_TEMPLATE_STRUCTURE" });
    const instance = structuredClone(firstRequest.templateContext.instance) as StudyTemplateInstance;
    instance.templateVersion = definition.templateVersion;
    instance.templateRevision = definition.templateRevision;
    instance.provenance = [...new Set([...instance.provenance, definition.digest])].sort();
    instance.digest = templateDigest({ prior: instance.digest, definitionDigest: definition.digest });
    instance.instanceId = `TMP-INSTANCE:${instance.digest.slice(5, 17).toUpperCase()}`;
    const second = projectionFrom({ ...firstRequest, templateContext: { definition, instance }, priorProjection: first, requestedAt: "2026-08-11T17:00:00.000Z" });
    expect(second.projectionId).not.toBe(first.projectionId);
    expect(diffProjections(first, second).changeKinds).toContain("TEMPLATE_STRUCTURE_CHANGED");
  });

  it("12 — un changement de contenu Project produit une nouvelle instance et un diff Project", () => {
    const session = makeAuthorizedProject();
    const first = projectionFrom(makeTemplateProjectionRequest(session));
    const project = reviseProject(session.result, {
      candidateVersion: { ...session.result.candidateVersion, versionId: "project-version:doc001b-content-2", priorVersion: session.result.candidateVersion.versionId },
      objectives: session.result.objectives.map((item) => ({ ...item, text: `${item.text} Révision gouvernée.` })),
    });
    const second = projectionFrom(makeTemplateProjectionRequest(session, { project, priorProjection: first, requestedAt: "2026-08-11T17:10:00.000Z" }));
    expect(diffProjections(first, second).changeKinds).toContain("PROJECT_CONTENT_CHANGED");
    expect(second.source.template?.templateInstanceId).not.toBe(first.source.template?.templateInstanceId);
  });

  it("13 — un changement de renderer seul ne mute ni science ni Template", () => {
    const session = makeAuthorizedProject();
    const request = makeTemplateProjectionRequest(session);
    const first = projectionFrom(request);
    const second = projectionFrom({ ...request, versions: { renderer: "2.0.0" }, priorProjection: first, requestedAt: "2026-08-11T17:20:00.000Z" });
    const diff = diffProjections(first, second);
    expect(diff.changeKinds).toEqual(["RENDERER_ONLY_CHANGED"]);
    expect(second.source).toEqual(first.source);
    expect(second.sections).toEqual(first.sections);
  });

  it("14 — un changement REG produit d’abord une nouvelle instance TMP puis une nouvelle projection", () => {
    const session = makeAuthorizedProject();
    const first = projectionFrom(makeTemplateProjectionRequest(session));
    const regulatory = regulatoryFor(session.result, "2026-01-16T12:00:00.000Z");
    const second = projectionFrom(makeTemplateProjectionRequest(session, { regulatory, priorProjection: first, requestedAt: "2026-08-11T17:30:00.000Z" }));
    expect(second.source.template?.templateInstanceId).not.toBe(first.source.template?.templateInstanceId);
    expect(diffProjections(first, second).changeKinds).toContain("REGULATORY_REQUIREMENT_CHANGED");
  });

  it("15 — un changement DOC-002 reste un changement de pattern transporté via TMP", () => {
    const session = makeAuthorizedProject();
    const first = projectionFrom(makeTemplateProjectionRequest(session));
    const patterns = structuredClone(DOCUMENTARY_PATTERN_CATALOG) as PatternCatalog;
    patterns.version = "1.0.1";
    patterns.digest = templateDigest({ prior: patterns.digest, change: "DOC002_PATTERN_SNAPSHOT" });
    const second = projectionFrom(makeTemplateProjectionRequest(session, { patterns, priorProjection: first, requestedAt: "2026-08-11T17:40:00.000Z" }));
    expect(second.source.documentaryPatternSnapshot?.catalogDigest).toBe(patterns.digest);
    expect(diffProjections(first, second).changeKinds).toContain("DOCUMENTARY_PATTERN_CHANGED");
  });

  it("16 — mêmes entrées logiques et configuration donnent le même digest malgré requestedAt", () => {
    const session = makeAuthorizedProject();
    const firstRequest = makeTemplateProjectionRequest(session);
    const first = projectionFrom(firstRequest);
    const second = projectionFrom({ ...firstRequest, requestedAt: "2026-08-12T00:00:00.000Z" });
    expect(second.projectionDigest).toBe(first.projectionDigest);
    expect(second.projectionId).toBe(first.projectionId);
  });

  it("17 — ne mute jamais Project, TMP, REG-001 ou DOC-002", () => {
    const session = makeAuthorizedProject();
    const regulatory = regulatoryFor(session.result);
    const request = makeTemplateProjectionRequest(session, { regulatory, patterns: DOCUMENTARY_PATTERN_CATALOG });
    const before = stableStringify({ project: session.result, template: request.templateContext, regulatory, patterns: DOCUMENTARY_PATTERN_CATALOG });
    const projection = projectionFrom(request);
    expect(stableStringify({ project: session.result, template: request.templateContext, regulatory, patterns: DOCUMENTARY_PATTERN_CATALOG })).toBe(before);
    expect(projection.audit?.findings.filter((item) => ["PROJECT_MUTATED", "TEMPLATE_MUTATED", "REG_MUTATED", "DOC002_MUTATED"].includes(item.code))).toEqual([]);
  });

  it("18 — le nouveau pipeline n’utilise jamais LEGACY_DIRECT_PROJECT_PROJECTION", () => {
    const session = makeAuthorizedProject();
    const projection = projectionFrom(makeTemplateProjectionRequest(session));
    expect(LEGACY_DIRECT_PROJECT_PROJECTION).toMatchObject({ deprecated: true });
    expect(projection.legacy).toBeUndefined();
    expect(projection.source.template).not.toBeNull();
  });

  it("19 / cas B — structure les blocs Imaging depuis TMP", () => {
    const session = makeAuthorizedImagingProject();
    const projection = projectionFrom(makeTemplateProjectionRequest(session));
    const imaging = projection.sections.find((section) => section.sectionId === "imaging")!;
    expect(imaging.templateNodeIds).toContain("TMP-NODE:IMAGING_CONTRIBUTION");
    expect(imaging.templateBlockIds).toContain("TMP-BLOCK-DEF:IMAGING_CONTRIBUTION");
    expect(imaging.status).not.toBe("NOT_APPLICABLE");
  });

  it("20 / cas C — garde l’Imaging incomplet partiel sans protocole inventé", () => {
    const session = makeAuthorizedImagingProject();
    const projection = projectionFrom(makeTemplateProjectionRequest(session));
    const imaging = projection.sections.find((section) => section.sectionId === "imaging")!;
    expect(imaging.status).toBe("PARTIALLY_GENERATABLE");
    expect(imaging.blocks.flatMap((block) => block.items).join(" ")).toContain("EXECUTABLE_PROTOCOL_NOT_READY");
  });

  it("21 / cas D — transporte PHRC sans recalcul dans DOC", () => {
    const session = makeAuthorizedProject();
    const request = makeTemplateProjectionRequest(session);
    const projection = projectionFrom(request);
    expect(projection.sections.flatMap((section) => section.requirementIds)).toContain("REQ_PHRC_STAGE2");
    expect(request.templateContext.instance.requirementMapping.find((item) => item.requirementId === "REQ_PHRC_STAGE2")).toBeDefined();
  });

  it("22 / cas E — garde une inconnue réglementaire UNKNOWN/CONDITIONAL", () => {
    const session = makeAuthorizedProject();
    const base = phrcStage2Input();
    const regulatory = resolveRegulatoryRequirements({
      ...base,
      researchProjectId: session.result.documentHandoff.projectId,
      researchProjectVersion: session.result.candidateVersion.versionId,
      researchProjectDigest: session.result.resultDigest,
      unknowns: [{ unknownId: "unknown:primary-endpoint", field: "endpoint.primary", reason: "Qualification réglementaire du critère manquante.", provenance: ["human:test"] }],
    });
    const projection = projectionFrom(makeTemplateProjectionRequest(session, { regulatory }));
    const endpoints = projection.sections.find((section) => section.sectionId === "endpoints-variables")!;
    expect(["UNKNOWN", "PARTIALLY_GENERATABLE"]).toContain(endpoints.status);
    expect(projection.unknowns.join(" ")).toMatch(/Qualification réglementaire|critère/i);
  });

  it("23 — classe toutes les DocumentDefinitions sans simuler les futures", () => {
    const session = makeAuthorizedProject();
    const statuses = resolveTemplateDocumentDefinitions(makeTemplateProjectionRequest(session));
    expect(statuses.find((item) => item.documentId === "PROTOCOL")?.status).toBe("SUPPORTED_PROJECTION");
    expect(statuses.find((item) => item.documentId === "SAP")?.status).toBe("FUTURE_PROJECTION");
    expect(statuses).toHaveLength(23);
  });

  it("24 — expose la table de statut et les diagnostics sans correction automatique", () => {
    expect(TEMPLATE_STATUS_TO_DOCUMENT_STATUS).toMatchObject({ UNKNOWN: "UNKNOWN", BLOCKED: "BLOCKED", FUTURE: "FUTURE", NOT_APPLICABLE: "NOT_APPLICABLE", CONFLICTING: "BLOCKED" });
    expect(auditDocumentProjection(null)).toMatchObject({ passed: false, boundary: "DETECTION_ONLY_NO_AUTOMATIC_FIX", findings: [{ code: "DOC_WITHOUT_TEMPLATE_INSTANCE" }] });
    const session = makeAuthorizedProject();
    const request = makeTemplateProjectionRequest(session);
    const tampered = structuredClone(request);
    tampered.templateContext.instance.inputRefs.researchProjectDigest = "mismatch";
    expect(projectDocumentFromStudyTemplate(tampered)).toMatchObject({ ok: false, plan: { refusal: { code: "DOC_TEMPLATE_DIGEST_MISMATCH" } } });
  });
});
