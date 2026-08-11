import { stableTemplateId } from "./canonical.ts";
import { CLINICAL_STUDY_TEMPLATE } from "./definitions.ts";
import type {
  StudyTemplateDefinition,
  StudyTemplateInstance,
  TemplateAuditCode,
  TemplateAuditFinding,
  TemplateAuditResult,
  TemplateRelation,
} from "./types.ts";

const finding = (
  code: TemplateAuditCode,
  severity: TemplateAuditFinding["severity"],
  subjectId: string,
  message: string,
  evidenceRefs: string[] = [],
): TemplateAuditFinding => ({
  findingId: stableTemplateId("TMP-FINDING", [code, subjectId, message]),
  code,
  severity,
  subjectId,
  message,
  evidenceRefs,
});

const cycleNodes = (relations: readonly TemplateRelation[]) => {
  const dependencies = relations.filter((relation) => ["DEPENDS_ON", "REQUIRES"].includes(relation.type));
  const adjacency = new Map<string, string[]>();
  dependencies.forEach((relation) => adjacency.set(relation.fromId, [...(adjacency.get(relation.fromId) ?? []), relation.toId]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const cycles = new Set<string>();
  const visit = (nodeId: string) => {
    if (visiting.has(nodeId)) {
      cycles.add(nodeId);
      return;
    }
    if (visited.has(nodeId)) return;
    visiting.add(nodeId);
    (adjacency.get(nodeId) ?? []).forEach(visit);
    visiting.delete(nodeId);
    visited.add(nodeId);
  };
  [...adjacency.keys()].sort().forEach(visit);
  return [...cycles].sort();
};

const result = (subjectId: string, findings: TemplateAuditFinding[]): TemplateAuditResult => {
  const ordered = [...findings].sort((left, right) => left.findingId.localeCompare(right.findingId));
  return {
    auditVersion: "TMP-001-AUDIT-1.0.0",
    subjectId,
    findings: ordered,
    counts: {
      ERROR: ordered.filter((item) => item.severity === "ERROR").length,
      WARNING: ordered.filter((item) => item.severity === "WARNING").length,
      INFORMATION: ordered.filter((item) => item.severity === "INFORMATION").length,
    },
    passed: !ordered.some((item) => item.severity === "ERROR"),
    boundary: "DETECTION_ONLY_NO_AUTOMATIC_FIX",
  };
};

export const auditStudyTemplateDefinition = (template: StudyTemplateDefinition): TemplateAuditResult => {
  const findings: TemplateAuditFinding[] = [];
  const nodeIds = new Set(template.graph.nodes.map((node) => node.nodeId));
  const blockNodeIds = new Set(template.blocks.map((block) => block.nodeId));
  const sectionNodeIds = new Set(template.sections.map((section) => section.nodeId));
  const incomingContains = new Set(template.graph.relations.filter((relation) => relation.type === "CONTAINS").map((relation) => relation.toId));
  template.graph.relations.forEach((relation) => {
    if (!nodeIds.has(relation.fromId) || !nodeIds.has(relation.toId)) findings.push(finding("INVALID_RELATION", "ERROR", relation.relationId, "La relation référence un nœud absent du graphe.", [relation.fromId, relation.toId]));
    if (!relation.provenance.length) findings.push(finding("MISSING_PROVENANCE", "ERROR", relation.relationId, "La relation ne possède aucune provenance."));
  });
  template.graph.nodes.forEach((node) => {
    if (!node.provenance.length) findings.push(finding("MISSING_PROVENANCE", "ERROR", node.nodeId, "Le nœud ne possède aucune provenance."));
    node.dependencyIds.forEach((dependencyId) => {
      if (!nodeIds.has(dependencyId)) findings.push(finding("INVALID_DEPENDENCY", "ERROR", node.nodeId, "Une dépendance pointe vers un nœud absent.", [dependencyId]));
    });
  });
  blockNodeIds.forEach((nodeId) => {
    if (!nodeIds.has(nodeId)) findings.push(finding("BROKEN_REFERENCE", "ERROR", nodeId, "La BlockDefinition référence un nœud absent."));
    else if (!incomingContains.has(nodeId)) findings.push(finding("ORPHAN_BLOCK", "ERROR", nodeId, "Le bloc n’est contenu dans aucune section logique."));
  });
  sectionNodeIds.forEach((nodeId) => {
    if (!nodeIds.has(nodeId)) findings.push(finding("BROKEN_REFERENCE", "ERROR", nodeId, "La SectionDefinition référence un nœud absent."));
  });
  template.documents.forEach((document) => {
    if (!nodeIds.has(document.nodeId)) findings.push(finding("BROKEN_REFERENCE", "ERROR", document.documentId, "La DocumentDefinition référence un nœud absent.", [document.nodeId]));
    if (!template.graph.relations.some((relation) => relation.fromId === document.nodeId && relation.type === "CONTAINS")) findings.push(finding("ORPHAN_DOCUMENT", "ERROR", document.documentId, "La DocumentDefinition ne contient aucune section logique."));
    document.sectionIds.forEach((sectionId) => {
      if (!template.sections.some((section) => section.sectionId === sectionId)) findings.push(finding("BROKEN_REFERENCE", "ERROR", document.documentId, "Une section de document est absente du catalogue.", [sectionId]));
    });
  });
  const cycles = cycleNodes(template.graph.relations);
  if (cycles.length) findings.push(finding("CIRCULAR_TEMPLATE", "ERROR", template.templateId, "Un cycle REQUIRES/DEPENDS_ON est présent.", cycles));
  if (!template.provenance.length || !template.digest || !template.behaviorDigest) findings.push(finding("MISSING_PROVENANCE", "ERROR", template.templateId, "Le template ne possède pas une provenance et des digests complets."));
  return result(template.templateId, findings);
};

export const auditStudyTemplateInstance = (instance: StudyTemplateInstance, definition: StudyTemplateDefinition = CLINICAL_STUDY_TEMPLATE): TemplateAuditResult => {
  const findings: TemplateAuditFinding[] = [];
  const nodeIds = new Set(instance.nodes.map((node) => node.nodeId));
  if (!instance.inputRefs.researchProjectId || !instance.inputRefs.researchProjectDigest) findings.push(finding("TEMPLATE_WITHOUT_PROJECT", "ERROR", instance.instanceId, "Le template instancié ne référence aucun Research Project."));
  if (!instance.inputRefs.regulatoryResolutionId || !instance.inputRefs.regulatoryCorpusDigest) findings.push(finding("TEMPLATE_WITHOUT_REQUIREMENTS", "ERROR", instance.instanceId, "Le template instancié ne référence aucun Applicable Requirement Set."));
  if (!instance.inputRefs.documentaryCatalogId || !instance.inputRefs.documentaryCatalogDigest) findings.push(finding("TEMPLATE_WITHOUT_PATTERNS", "ERROR", instance.instanceId, "Le template instancié ne référence aucun Documentary Pattern Graph."));
  instance.nodes.forEach((node) => {
    const isBlock = ["BLOCK", "TABLE", "ANNEX", "WORKFLOW", "DECISION", "CONDITIONAL_BLOCK", "OPTIONAL_BLOCK", "REQUIRED_BLOCK", "FUTURE_BLOCK"].includes(node.kind);
    if (isBlock && !node.supports.length) findings.push(finding("BLOCK_WITHOUT_SOURCE", "ERROR", node.nodeId, "Le bloc instancié ne possède aucun support traçable."));
    if (!node.provenance.length) findings.push(finding("MISSING_PROVENANCE", "ERROR", node.nodeId, "Le nœud instancié ne possède aucune provenance."));
    if (node.unknownRefs.length && !["UNKNOWN", "BLOCKED", "CONFLICTING"].includes(node.status)) findings.push(finding("UNKNOWN_DOWNGRADED", "ERROR", node.nodeId, "Un nœud lié à une inconnue a été renforcé sans résolution explicite.", node.unknownRefs));
    if (node.conflictIds.length && node.status !== "CONFLICTING") findings.push(finding("CONFLICT_HIDDEN", "ERROR", node.nodeId, "Un conflit ouvert n’est pas reflété dans le statut du nœud.", node.conflictIds));
    node.supports.forEach((support) => {
      if (!support.sourceRefs.length) findings.push(finding("BROKEN_REFERENCE", "ERROR", support.supportId, "Un support ne référence aucune source."));
      if (!support.provenance.length) findings.push(finding("MISSING_PROVENANCE", "ERROR", support.supportId, "Un support ne possède aucune provenance."));
      if (support.kind === "DOCUMENTARY_SUPPORT" && support.supportLevel === "DIRECT") findings.push(finding("CONFLICT_HIDDEN", "ERROR", support.supportId, "Un pattern documentaire a été traité comme support direct susceptible de créer une obligation."));
    });
  });
  instance.relations.forEach((relation) => {
    if (!nodeIds.has(relation.fromId) || !nodeIds.has(relation.toId)) findings.push(finding("INVALID_RELATION", "ERROR", relation.relationId, "La relation instanciée référence un nœud absent.", [relation.fromId, relation.toId]));
  });
  const expectedFuture = definition.graph.nodes.filter((node) => node.kind === "FUTURE_BLOCK").map((node) => node.nodeId);
  const missingFuture = expectedFuture.filter((nodeId) => !nodeIds.has(nodeId));
  if (missingFuture.length) findings.push(finding("FUTURE_BLOCK_REMOVED", "ERROR", instance.instanceId, "Un ou plusieurs blocs futurs ont été retirés de l’instance.", missingFuture));
  instance.conflicts.forEach((conflict) => {
    if (!conflict.affectedNodes.length || conflict.affectedNodes.some((nodeId) => !nodeIds.has(nodeId))) findings.push(finding("BROKEN_REFERENCE", "ERROR", conflict.conflictId, "Le conflit référence un nœud absent ou aucun nœud.", conflict.affectedNodes));
    const hidden = conflict.affectedNodes.filter((nodeId) => instance.nodes.find((node) => node.nodeId === nodeId)?.status !== "CONFLICTING");
    if (hidden.length) findings.push(finding("CONFLICT_HIDDEN", "ERROR", conflict.conflictId, "Le conflit ouvert n’est pas visible sur tous les nœuds affectés.", hidden));
  });
  const cycles = cycleNodes(instance.relations);
  if (cycles.length) findings.push(finding("CIRCULAR_TEMPLATE", "ERROR", instance.instanceId, "Un cycle REQUIRES/DEPENDS_ON est présent.", cycles));
  if (!instance.inputMutationChecks.researchProjectUnchanged) findings.push(finding("RESEARCH_PROJECT_MUTATED", "ERROR", instance.instanceId, "Le Research Project a été muté pendant la composition."));
  if (!instance.inputMutationChecks.reg001Unchanged) findings.push(finding("REG001_MUTATED", "ERROR", instance.instanceId, "Le résultat REG-001 a été muté pendant la composition."));
  if (!instance.inputMutationChecks.doc002Unchanged) findings.push(finding("DOC002_MUTATED", "ERROR", instance.instanceId, "Le catalogue DOC-002 a été muté pendant la composition."));
  if (!instance.provenance.length || !instance.digest) findings.push(finding("MISSING_PROVENANCE", "ERROR", instance.instanceId, "L’instance ne possède pas une provenance et un digest complets."));
  return result(instance.instanceId, findings);
};
