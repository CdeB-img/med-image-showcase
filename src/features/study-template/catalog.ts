import { auditStudyTemplateDefinition } from "./audit.ts";
import { countBy, normalizeTemplateText, templateDigest, uniqueSorted } from "./canonical.ts";
import { STUDY_FAMILY_DEFINITIONS, STUDY_TEMPLATE_DEFINITIONS, STUDY_TEMPLATE_GRAPH } from "./definitions.ts";
import type {
  StudyTemplateCatalog,
  StudyTemplateInstance,
  TemplateQuery,
  TemplateQueryResult,
  TemplateStatistics,
} from "./types.ts";
import { STUDY_TEMPLATE_SCHEMA_VERSION } from "./types.ts";

export const computeTemplateStatistics = (instances: readonly StudyTemplateInstance[] = []): TemplateStatistics => {
  const templates = STUDY_TEMPLATE_DEFINITIONS;
  const blocks = templates.flatMap((template) => template.blocks);
  const nodes = templates.flatMap((template) => template.graph.nodes);
  const relations = templates.flatMap((template) => template.graph.relations);
  return {
    templateCount: templates.length,
    familyCount: STUDY_FAMILY_DEFINITIONS.length,
    documentCount: templates.reduce((sum, template) => sum + template.documents.length, 0),
    sectionCount: templates.reduce((sum, template) => sum + template.sections.length, 0),
    blockCount: blocks.length,
    reusableBlockCount: blocks.filter((block) => block.reusable).length,
    nodeCount: nodes.length,
    relationCount: relations.length,
    instanceCount: instances.length,
    byNodeKind: countBy(nodes.map((node) => node.kind)),
    byRelationType: countBy(relations.map((relation) => relation.type)),
    byBlockStatus: countBy(instances.flatMap((instance) => instance.nodes.map((node) => node.status))),
    byReadiness: countBy(instances.flatMap((instance) => instance.nodes.map((node) => node.readiness))),
    provenanceCoveragePercent: nodes.length ? Math.round(nodes.filter((node) => node.provenance.length).length / nodes.length * 10_000) / 100 : 100,
  };
};

export const createStudyTemplateCatalog = (generatedAt: string, instances: readonly StudyTemplateInstance[] = []): StudyTemplateCatalog => {
  const statistics = computeTemplateStatistics(instances);
  const material = {
    version: "1.0.0",
    generatedAt,
    templates: STUDY_TEMPLATE_DEFINITIONS,
    families: STUDY_FAMILY_DEFINITIONS,
    graph: STUDY_TEMPLATE_GRAPH,
    statistics,
  };
  const digest = templateDigest(material);
  return {
    contractVersion: STUDY_TEMPLATE_SCHEMA_VERSION,
    catalogId: `TMP-CATALOG:${digest.slice(5, 17).toUpperCase()}`,
    version: "1.0.0",
    generatedAt,
    templates: STUDY_TEMPLATE_DEFINITIONS,
    families: STUDY_FAMILY_DEFINITIONS,
    graph: STUDY_TEMPLATE_GRAPH,
    statistics,
    audit: auditStudyTemplateDefinition(STUDY_TEMPLATE_DEFINITIONS[0]),
    digest,
    boundary: "TEMPLATE_STRUCTURE_CATALOG_ONLY_NOT_PROJECT_TRUTH",
  };
};

export const lookupStudyTemplate = (catalog: StudyTemplateCatalog, templateId: string) => catalog.templates.find((template) => template.templateId === templateId) ?? null;

export const queryStudyTemplateCatalog = (catalog: StudyTemplateCatalog, query: TemplateQuery = {}): TemplateQueryResult => {
  const text = normalizeTemplateText(query.text ?? "");
  const templates = catalog.templates.filter((template) => {
    if (query.familyIds?.length && !query.familyIds.some((familyId) => template.familyIds.includes(familyId))) return false;
    if (query.documentIds?.length && !query.documentIds.some((documentId) => template.documents.some((document) => document.documentId === documentId))) return false;
    if (!text) return true;
    return normalizeTemplateText([template.templateId, template.label, template.description].join(" ")).includes(text);
  });
  const nodes = catalog.graph.nodes.filter((node) => {
    if (query.nodeKinds?.length && !query.nodeKinds.includes(node.kind)) return false;
    if (query.familyIds?.length && node.familyIds.length && !query.familyIds.some((familyId) => node.familyIds.includes(familyId))) return false;
    if (query.documentIds?.length && !query.documentIds.some((documentId) => node.documentIds.includes(documentId))) return false;
    if (!text) return true;
    return normalizeTemplateText([node.nodeId, node.label, node.description].join(" ")).includes(text);
  });
  const documents = catalog.templates.flatMap((template) => template.documents).filter((document) => {
    if (query.documentIds?.length && !query.documentIds.includes(document.documentId)) return false;
    if (query.familyIds?.length && document.familyIds.length && !query.familyIds.some((familyId) => document.familyIds.includes(familyId))) return false;
    if (!text) return true;
    return normalizeTemplateText([document.documentId, document.label].join(" ")).includes(text);
  });
  return {
    query,
    templateIds: uniqueSorted(templates.map((template) => template.templateId)),
    nodeIds: uniqueSorted(nodes.map((node) => node.nodeId)),
    documentIds: uniqueSorted(documents.map((document) => document.documentId)),
    catalogDigest: catalog.digest,
  };
};

export const buildTemplateTreeView = (catalog: StudyTemplateCatalog) => ({
  view: "TEMPLATE_TREE" as const,
  roots: catalog.graph.nodes.filter((node) => node.kind === "DOCUMENT").map((node) => ({
    nodeId: node.nodeId,
    children: catalog.graph.relations.filter((relation) => relation.fromId === node.nodeId && relation.type === "CONTAINS").map((relation) => relation.toId),
  })),
  catalogDigest: catalog.digest,
  boundary: "PASSIVE_VIEW" as const,
});

export const buildTemplateGraphView = (catalog: StudyTemplateCatalog) => ({ view: "TEMPLATE_GRAPH" as const, graph: catalog.graph, boundary: "PASSIVE_VIEW" as const });

export const buildInstanceViews = (instance: StudyTemplateInstance) => ({
  requirementView: { view: "REQUIREMENT_VIEW" as const, mappings: instance.requirementMapping },
  patternView: { view: "PATTERN_VIEW" as const, mappings: instance.patternMapping },
  dependencyView: { view: "DEPENDENCY_VIEW" as const, graph: instance.dependencyGraph },
  workflowView: { view: "WORKFLOW_VIEW" as const, nodes: instance.nodes.filter((node) => node.kind === "WORKFLOW"), relations: instance.relations.filter((relation) => ["PRECEDES", "FOLLOWS"].includes(relation.type)) },
  readinessView: { view: "READINESS_VIEW" as const, graph: instance.readinessGraph, notice: "LOCAL_TEMPLATE_READINESS_ONLY_NOT_SCIENTIFIC_OR_REGULATORY_READINESS" as const },
  documentGraph: { view: "DOCUMENT_GRAPH" as const, documents: instance.documents, relations: instance.relations.filter((relation) => relation.fromId.startsWith("TMP-DOC:") || relation.toId.startsWith("TMP-DOC:")) },
  boundary: "PASSIVE_VIEWS_NO_MUTATION" as const,
});
