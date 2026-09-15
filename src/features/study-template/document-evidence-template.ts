import { templateDigest } from "./canonical";
import { CLINICAL_STUDY_TEMPLATE } from "./definitions";
import type { StudyTemplateDefinition, TemplateGraph, TemplateNodeDefinition } from "./types";

// Optional extension of the existing protocol template; Knowledge owns every supporting assertion.
const blocks = [
  { id: "SCIENTIFIC_BACKGROUND", label: "Contexte et justification scientifique" },
  { id: "SCIENTIFIC_REFERENCES", label: "Références bibliographiques" },
];
const base = CLINICAL_STUDY_TEMPLATE;
const nodes: TemplateNodeDefinition[] = blocks.map(({ id, label }) => ({
  nodeId: `TMP-NODE:${id}`, kind: "CONDITIONAL_BLOCK", label, description: "Projection des sources et assertions Knowledge, sans adoption scientifique.",
  documentIds: ["PROTOCOL"], familyIds: [], defaultStatus: "CONDITIONAL", projectSelectors: ["KNOWLEDGE_EVIDENCE"],
  requirementTokens: [], patternCategories: [], dependencyIds: [], detailLevels: ["FULL", "MEDIUM", "SHORT", "MINIMAL"], provenance: [base.digest, "PD-005:R37", "KNOWLEDGE_EVIDENCE"],
}));
const graphMaterial = {
  ...base.graph, graphId: `${base.graph.graphId}:DOCUMENT-EVIDENCE`, graphVersion: "1.2.0",
  nodes: [...base.graph.nodes, ...nodes],
  relations: [...base.graph.relations, ...nodes.map((node) => ({ relationId: `TMP-REL:PROTOCOL-CONTAINS:${node.nodeId}`, fromId: "TMP-DOC:PROTOCOL", toId: node.nodeId, type: "CONTAINS" as const, reason: "Section documentaire conditionnée par Knowledge.", provenance: node.provenance }))],
};
const graph: TemplateGraph = { ...graphMaterial, digest: templateDigest({ nodes: graphMaterial.nodes, relations: graphMaterial.relations }) };
const material = {
  ...base, templateVersion: "1.2.0", templateRevision: 3, graph,
  updatedAt: "2026-09-15T00:00:00.000Z", derivedFrom: base.digest, supersedes: base.digest,
  reason: "Extension optionnelle du protocole par contexte Knowledge et bibliographie, sans changement de la science du Project.",
  blocks: [...base.blocks, ...nodes.map((node) => ({ blockId: node.nodeId.replace("TMP-NODE:", "TMP-BLOCK-DEF:"), nodeId: node.nodeId, label: node.label, purpose: node.description, reusable: true, detailLevels: node.detailLevels, provenance: node.provenance }))],
  documents: base.documents.map((document) => document.documentId === "PROTOCOL" ? { ...document, sharedBlockIds: [...document.sharedBlockIds, ...blocks.map(({ id }) => `TMP-BLOCK-DEF:${id}`)] } : document),
};
export const CLINICAL_STUDY_EVIDENCE_TEMPLATE: StudyTemplateDefinition = { ...material, behaviorDigest: templateDigest(material), digest: templateDigest(material) };
