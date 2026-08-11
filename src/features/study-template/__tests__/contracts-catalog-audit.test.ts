import { describe, expect, it } from "vitest";
import { buildDocumentDefinitionAdapter, buildFutureConsumerContracts } from "../adapters.ts";
import { auditStudyTemplateDefinition, auditStudyTemplateInstance } from "../audit.ts";
import { buildInstanceViews, buildTemplateGraphView, buildTemplateTreeView, createStudyTemplateCatalog, lookupStudyTemplate, queryStudyTemplateCatalog } from "../catalog.ts";
import { CLINICAL_STUDY_TEMPLATE } from "../definitions.ts";
import { composeStudyTemplateInstance } from "../composition.ts";
import { exportStudyTemplates, importStudyTemplateExport, serializeStudyTemplateExport } from "../persistence.ts";
import { classifyTemplateChange, versionStudyTemplate } from "../versioning.ts";
import { makeTemplateInput } from "./fixtures.ts";

describe("TMP-001 catalog and public contracts", () => {
  it("publie Catalog, Lookup, Graph, Query, Instance, Statistics et vues passives", () => {
    const instance = composeStudyTemplateInstance(makeTemplateInput());
    const catalog = createStudyTemplateCatalog("2026-08-11T12:00:00.000Z", [instance]);
    expect(lookupStudyTemplate(catalog, CLINICAL_STUDY_TEMPLATE.templateId)?.templateId).toBe(CLINICAL_STUDY_TEMPLATE.templateId);
    expect(queryStudyTemplateCatalog(catalog, { familyIds: ["IMAGING"] }).documentIds).toEqual(expect.arrayContaining(["IMAGING_CHARTER", "CORE_LAB_MANUAL"]));
    expect(buildTemplateGraphView(catalog).boundary).toBe("PASSIVE_VIEW");
    expect(buildTemplateTreeView(catalog).roots.length).toBe(catalog.statistics.documentCount);
    const views = buildInstanceViews(instance);
    expect(views.readinessView.notice).toBe("LOCAL_TEMPLATE_READINESS_ONLY_NOT_SCIENTIFIC_OR_REGULATORY_READINESS");
    expect(views.requirementView.mappings).toBe(instance.requirementMapping);
    expect(catalog.statistics.instanceCount).toBe(1);
  });

  it("exporte et importe une structure machine-readable avec contrôle de digest", () => {
    const instance = composeStudyTemplateInstance(makeTemplateInput());
    const catalog = createStudyTemplateCatalog("2026-08-11T12:00:00.000Z", [instance]);
    const exported = exportStudyTemplates(catalog, [instance], "2026-08-11T12:00:00.000Z");
    expect(importStudyTemplateExport(serializeStudyTemplateExport(exported))).toEqual(exported);
    expect(() => importStudyTemplateExport(serializeStudyTemplateExport({ ...exported, digest: "tampered" }))).toThrow("STUDY_TEMPLATE_EXPORT_DIGEST_MISMATCH");
  });

  it("expose seulement un adaptateur futur et aucune ProtocolProjection", () => {
    const instance = composeStudyTemplateInstance(makeTemplateInput());
    const adapter = buildDocumentDefinitionAdapter(instance);
    expect(adapter.boundary).toBe("FUTURE_READ_ONLY_ADAPTER_NO_PROTOCOL_PROJECTION_NO_ENGINE_MUTATION");
    expect(adapter).not.toHaveProperty("projection");
    expect(buildFutureConsumerContracts(instance).validation.status).toBe("NOT_IMPLEMENTED_NEXT_ARCHITECTURAL_STEP");
  });
});

describe("TMP-001 audit, versioning and contracts", () => {
  it("passe les audits de définition et d’instance sans correction automatique", () => {
    const instance = composeStudyTemplateInstance(makeTemplateInput());
    expect(auditStudyTemplateDefinition(CLINICAL_STUDY_TEMPLATE)).toMatchObject({ passed: true, counts: { ERROR: 0 } });
    expect(auditStudyTemplateInstance(instance)).toMatchObject({ passed: true, counts: { ERROR: 0 } });
  });

  it("détecte les mutations, la perte de FUTURE et les conflits masqués", () => {
    const instance = composeStudyTemplateInstance(makeTemplateInput());
    const futureNode = instance.nodes.find((node) => node.kind === "FUTURE_BLOCK")!;
    const tampered = {
      ...instance,
      nodes: instance.nodes.filter((node) => node.nodeId !== futureNode.nodeId),
      inputMutationChecks: { ...instance.inputMutationChecks, reg001Unchanged: false },
    };
    const audit = auditStudyTemplateInstance(tampered);
    expect(audit.findings.map((finding) => finding.code)).toEqual(expect.arrayContaining(["FUTURE_BLOCK_REMOVED", "REG001_MUTATED", "INVALID_RELATION"]));
  });

  it("incrémente la révision pour une description et la version pour le comportement", () => {
    const descriptive = { ...CLINICAL_STUDY_TEMPLATE, description: "Description révisée." };
    expect(classifyTemplateChange(CLINICAL_STUDY_TEMPLATE, descriptive)).toBe("DESCRIPTION_ONLY");
    const revision = versionStudyTemplate(CLINICAL_STUDY_TEMPLATE, descriptive, "2026-08-11T13:00:00.000Z", "Clarification descriptive.");
    expect(revision.templateVersion).toBe("1.0.0");
    expect(revision.templateRevision).toBe(2);
    const behavioral = { ...CLINICAL_STUDY_TEMPLATE, behaviorDigest: "tmp1-behavior-change" };
    const version = versionStudyTemplate(CLINICAL_STUDY_TEMPLATE, behavioral, "2026-08-11T14:00:00.000Z", "Changement comportemental.");
    expect(version.templateVersion).toBe("1.1.0");
    expect(version.templateRevision).toBe(1);
  });

  it("expose les douze contrats TMP-C01 à TMP-C12", () => {
    expect(CLINICAL_STUDY_TEMPLATE.contracts).toEqual(Array.from({ length: 12 }, (_, index) => `TMP-C${String(index + 1).padStart(2, "0")}`));
  });
});
