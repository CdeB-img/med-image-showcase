import { logicalDigest, stableStringify, uniqueSorted } from "@/features/knowledge-engine/canonical";
import type { TemplateBlockStatus, TemplateNodeInstance, TemplateReadinessStatus } from "@/features/study-template/types";
import { auditDocumentProjection } from "./audit";
import { DEFAULT_PROJECTION_VERSIONS, PROJECTION_DEFINITIONS, PROTOCOL_TEMPLATE_SECTION_BINDINGS } from "./contracts";
import { planComposition } from "./composition";
import { composeEditorialProjection } from "./editorial";
import { planProjection } from "./planner";
import { assessProjectionReadiness } from "./readiness";
import { projectDocumentLegacyDirect } from "./projection";
import type {
  CompositionPlanSection,
  DocumentProjection,
  DocumentProjectionRequest,
  DocumentSectionStatus,
  ProjectionExecutionResult,
  ProjectionPlan,
  ProjectionVersions,
  SectionApplicability,
  TemplateDocumentProjectionStatus,
  LegacyDirectProjectProjectionRequest,
} from "./types";
import { DOCUMENT_PROJECTION_ENGINE_VERSION } from "./types";

export const TEMPLATE_STATUS_TO_DOCUMENT_STATUS: Readonly<Record<TemplateBlockStatus, DocumentSectionStatus | "DERIVE_FROM_PROJECT">> = Object.freeze({
  REQUIRED: "DERIVE_FROM_PROJECT",
  OPTIONAL: "DERIVE_FROM_PROJECT",
  CONDITIONAL: "DERIVE_FROM_PROJECT",
  NOT_APPLICABLE: "NOT_APPLICABLE",
  BLOCKED: "BLOCKED",
  UNKNOWN: "UNKNOWN",
  FUTURE: "FUTURE",
  CONFLICTING: "BLOCKED",
});

const PROJECTION_TO_TEMPLATE_DOCUMENT: Readonly<Record<string, string>> = Object.freeze({
  PROTOCOL: "PROTOCOL",
  SYNOPSIS: "SYNOPSIS",
  FUNDING: "FUNDING_APPLICATION",
  PUBLICATION: "PUBLICATION_PLAN",
  CRF: "CRF_SPECIFICATION",
  DATA_DICTIONARY: "DATA_DICTIONARY",
  SAP: "SAP",
  BUDGET: "BUDGET",
  CORE_LAB_MANUAL: "CORE_LAB_MANUAL",
  MONITORING_PLAN: "MONITORING_PLAN",
  INVESTIGATOR_GUIDE: "INVESTIGATOR_BROCHURE",
});

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
  }
  return value;
};

const refusal = (request: DocumentProjectionRequest, code: NonNullable<ProjectionPlan["refusal"]>["code"], reason: string, resumeCondition: string): ProjectionExecutionResult => ({
  ok: false,
  projection: null,
  plan: {
    projectionType: request.projectionType,
    supported: false,
    definitionId: null,
    title: null,
    templateId: request.templateContext?.definition.templateId ?? null,
    sections: [],
    refusal: { code, reason, resumeCondition },
  },
});

const projectionDefinitionFor = (projectionType: string, definitions = PROJECTION_DEFINITIONS) => definitions.find((item) => item.projectionType === projectionType) ?? null;

const documentStatus = (status: TemplateBlockStatus, supported: boolean): TemplateDocumentProjectionStatus => {
  if (status === "NOT_APPLICABLE") return "NOT_APPLICABLE";
  if (["BLOCKED", "CONFLICTING"].includes(status)) return "BLOCKED";
  if (status === "UNKNOWN") return "UNKNOWN";
  if (status === "FUTURE" || !supported) return "FUTURE_PROJECTION";
  return "SUPPORTED_PROJECTION";
};

export const resolveTemplateDocumentDefinitions = (request: Readonly<DocumentProjectionRequest>) => request.templateContext.definition.documents.map((definition) => {
  const mapping = request.templateContext.instance.documents.find((item) => item.documentId === definition.documentId);
  const projectionType = Object.entries(PROJECTION_TO_TEMPLATE_DOCUMENT).find(([, documentId]) => documentId === definition.documentId)?.[0] ?? definition.documentId;
  const supported = Boolean(projectionDefinitionFor(projectionType, request.definitions));
  const status = documentStatus(mapping?.status ?? "UNKNOWN", supported);
  return {
    documentId: definition.documentId,
    templateNodeId: definition.nodeId,
    status,
    reason: status === "SUPPORTED_PROJECTION"
      ? "Une ProjectionDefinition DOC-001 correspond à la DocumentDefinition TMP et reste soumise à ses statuts."
      : status === "NOT_APPLICABLE"
        ? "TMP-001 qualifie explicitement ce document comme non applicable."
        : status === "BLOCKED"
          ? "TMP-001 conserve un blocage ou un conflit qui interdit la projection."
          : status === "UNKNOWN"
            ? "TMP-001 ne permet pas de qualifier la projection sans information supplémentaire."
            : "La DocumentDefinition reste visible, mais DOC-001 ne possède pas de ProjectionDefinition implémentée ou dépend d’une capacité future.",
  };
});

const dominantNode = (nodes: readonly TemplateNodeInstance[]): TemplateNodeInstance | null => {
  const priority: Record<TemplateBlockStatus, number> = {
    CONFLICTING: 8,
    BLOCKED: 7,
    FUTURE: 6,
    UNKNOWN: 5,
    NOT_APPLICABLE: 4,
    REQUIRED: 3,
    CONDITIONAL: 2,
    OPTIONAL: 1,
  };
  return [...nodes].sort((left, right) => priority[right.status] - priority[left.status] || left.nodeId.localeCompare(right.nodeId))[0] ?? null;
};

const mapStatus = (legacyStatus: DocumentSectionStatus, node: TemplateNodeInstance | null): DocumentSectionStatus => {
  if (!node) return "BLOCKED";
  const mapped = TEMPLATE_STATUS_TO_DOCUMENT_STATUS[node.status];
  return mapped === "DERIVE_FROM_PROJECT" ? legacyStatus : mapped;
};

const mapApplicability = (legacy: SectionApplicability, node: TemplateNodeInstance | null): SectionApplicability => {
  if (node?.status === "NOT_APPLICABLE") return "NOT_APPLICABLE";
  if (node?.status === "UNKNOWN") return "APPLICABILITY_UNKNOWN";
  return legacy;
};

const templateReasons = (nodes: readonly TemplateNodeInstance[], dominant: TemplateNodeInstance | null) => {
  if (!dominant) return ["Aucun nœud TMP ne correspond à la section DOC ; la section reste bloquée et visible."];
  const reasons = dominant.supports.map((support) => support.reason);
  const prefix = `TMP ${dominant.status} / ${dominant.readiness} — ${dominant.label}.`;
  return uniqueSorted([prefix, ...reasons]);
};

const enrichSection = (
  request: Readonly<DocumentProjectionRequest>,
  section: CompositionPlanSection,
  templateSectionIds: readonly string[],
  allowedTemplateNodeIds: ReadonlySet<string>,
  templateDocumentNodeId: string,
): CompositionPlanSection => {
  const requestedBindings = PROTOCOL_TEMPLATE_SECTION_BINDINGS[section.definition.sectionId] ?? [];
  const templateNodeIds = uniqueSorted([templateDocumentNodeId, ...requestedBindings.filter((nodeId) => allowedTemplateNodeIds.has(nodeId))]);
  const nodes = templateNodeIds.map((nodeId) => request.templateContext.instance.nodes.find((item) => item.nodeId === nodeId)).filter((item): item is TemplateNodeInstance => Boolean(item));
  const dominant = dominantNode(nodes);
  const requirementMappings = request.templateContext.instance.requirementMapping.filter((mapping) => mapping.nodeIds.some((nodeId) => templateNodeIds.includes(nodeId)));
  const patternMappings = request.templateContext.instance.patternMapping.filter((mapping) => mapping.nodeIds.some((nodeId) => templateNodeIds.includes(nodeId)));
  const missing = request.templateContext.instance.missingInformation.filter((item) => item.targetNodeIds.some((nodeId) => templateNodeIds.includes(nodeId)));
  const conflicts = request.templateContext.instance.conflicts.filter((item) => item.affectedNodes.some((nodeId) => templateNodeIds.includes(nodeId)));
  const limitationIds = uniqueSorted(nodes.flatMap((node) => node.limitationRefs));
  const templateLimitations = request.templateContext.instance.limitations.filter((item) => limitationIds.includes(item.limitationId));
  const projectObjectIds = uniqueSorted([
    ...section.facts.map((item) => item.sourceRef),
    ...nodes.flatMap((node) => node.supports.filter((support) => support.kind === "PROJECT_SUPPORT").flatMap((support) => support.sourceRefs)),
  ]);
  const requirementIds = uniqueSorted(requirementMappings.map((item) => item.requirementId));
  const patternIds = uniqueSorted(patternMappings.map((item) => item.patternId));
  const templateBlockIds = uniqueSorted(request.templateContext.definition.blocks.filter((block) => templateNodeIds.includes(block.nodeId)).map((block) => block.blockId));
  const globalUnknowns = templateNodeIds.includes("TMP-NODE:UNKNOWNS") ? request.templateContext.instance.unknowns.map((item) => item.reason) : [];
  const globalLimitations = templateNodeIds.includes("TMP-NODE:LIMITATIONS") ? [...(request.limitations ?? [])] : [];
  const futureReason = dominant?.status === "FUTURE"
    ? uniqueSorted(nodes.flatMap((node) => node.supports.filter((support) => support.supportLevel === "FUTURE_DEPENDENCY").map((support) => support.reason)))[0] ?? "Dépendance TMP explicitement future."
    : null;
  const conflictReasons = uniqueSorted(conflicts.map((item) => item.reason));
  const status = mapStatus(section.status, dominant);
  return {
    ...section,
    applicability: mapApplicability(section.applicability, dominant),
    status,
    statusReasons: uniqueSorted([...section.statusReasons, ...templateReasons(nodes, dominant)]),
    unknowns: uniqueSorted([...section.unknowns, ...missing.map((item) => item.reason), ...globalUnknowns]),
    limitations: uniqueSorted([...section.limitations, ...templateLimitations.map((item) => item.reason), ...globalLimitations]),
    contradictions: uniqueSorted([...section.contradictions, ...conflictReasons]),
    conflicts: conflictReasons,
    templateNodeIds,
    templateSectionIds: uniqueSorted([...templateSectionIds]),
    templateBlockIds,
    projectObjectIds,
    requirementIds,
    patternIds,
    sourceEngine: section.definition.specializedEngine ?? "PRJ-001",
    templateStatus: dominant?.status ?? "BLOCKED",
    templateReadiness: dominant?.readiness ?? "BLOCKED",
    futureReason,
    provenanceRefs: uniqueSorted([
      ...section.provenanceRefs,
      ...(request.provenance ?? []),
      request.templateContext.definition.templateId,
      request.templateContext.definition.digest,
      request.templateContext.instance.instanceId,
      request.templateContext.instance.digest,
      request.regulatoryResolutionRef.resolutionId,
      request.regulatoryResolutionRef.corpusDigest,
      request.documentaryPatternSnapshotRef.catalogId,
      request.documentaryPatternSnapshotRef.catalogDigest,
      ...nodes.flatMap((node) => [node.nodeId, ...node.provenance, ...node.supports.flatMap((support) => [...support.sourceRefs, ...support.provenance])]),
      ...requirementMappings.flatMap((mapping) => [mapping.requirementId, ...mapping.sourceRefs]),
      ...patternMappings.flatMap((mapping) => [mapping.patternId, ...mapping.sourceRefs]),
    ]),
  };
};

const versionsFor = (request: Readonly<DocumentProjectionRequest>, definitionVersion: string): ProjectionVersions => ({
  engine: DOCUMENT_PROJECTION_ENGINE_VERSION,
  template: request.templateContext.instance.templateVersion,
  pattern: request.documentaryPatternSnapshotRef.catalogVersion,
  compositionPolicy: request.versions?.compositionPolicy ?? DEFAULT_PROJECTION_VERSIONS.compositionPolicy,
  projectionDefinition: request.versions?.projectionDefinition ?? definitionVersion,
  renderer: request.versions?.renderer ?? DEFAULT_PROJECTION_VERSIONS.renderer,
});

const bump = (version: string, part: "minor" | "patch") => {
  const [major = 1, minor = 0, patch = 0] = version.split(".").map((value) => Number.parseInt(value, 10) || 0);
  return part === "minor" ? `${major}.${minor + 1}.0` : `${major}.${minor}.${patch + 1}`;
};

const nextVersion = (prior: Readonly<DocumentProjection> | null, source: DocumentProjection["source"], versions: ProjectionVersions) => {
  if (!prior) return "1.0.0";
  const upstreamChanged = stableStringify(prior.source) !== stableStringify(source);
  if (upstreamChanged) return bump(prior.projectionVersion, "minor");
  return stableStringify(prior.versions) !== stableStringify(versions) ? bump(prior.projectionVersion, "patch") : prior.projectionVersion;
};

export const projectDocumentFromStudyTemplate = (request: DocumentProjectionRequest): ProjectionExecutionResult => {
  const projectBefore = stableStringify(request.project);
  const templateBefore = stableStringify(request.templateContext);
  const preflight = auditDocumentProjection(request);
  const firstError = preflight.findings.find((item) => item.severity === "ERROR");
  if (firstError) {
    const code = firstError.code === "DOC_WITHOUT_TEMPLATE_INSTANCE"
      ? "DOC_WITHOUT_TEMPLATE_INSTANCE"
      : firstError.code === "DOC_TEMPLATE_PROJECT_MISMATCH"
        ? "DOC_TEMPLATE_PROJECT_MISMATCH"
        : "DOC_TEMPLATE_DIGEST_MISMATCH";
    return refusal(request, code, firstError.message, "Recomposer TMP-001 depuis les références Project/REG/DOC-002 exactes, puis transmettre cette instance sans la reconstruire dans DOC-001.");
  }

  const templateDocumentId = PROJECTION_TO_TEMPLATE_DOCUMENT[request.projectionType] ?? request.projectionType;
  const templateDocument = request.templateContext.definition.documents.find((item) => item.documentId === templateDocumentId);
  const templateMapping = request.templateContext.instance.documents.find((item) => item.documentId === templateDocumentId);
  if (!templateDocument || !templateMapping) return refusal(request, "TEMPLATE_DOCUMENT_NOT_FOUND", "La DocumentDefinition ou son mapping TMP est absent.", "Créer ou corriger la définition dans une mission TMP séparée ; DOC-001B ne reconstruit pas TMP-001.");

  const definition = projectionDefinitionFor(request.projectionType, request.definitions);
  const resolvedDocument = resolveTemplateDocumentDefinitions(request).find((item) => item.documentId === templateDocumentId)!;
  if (!definition) return refusal(
    request,
    "TEMPLATE_PROJECTION_NOT_SUPPORTED",
    `${templateDocument.label} est ${resolvedDocument.status}; aucune projection future, bloquée, inconnue ou non applicable n’est simulée.`,
    "Fournir une ProjectionDefinition DOC-001 admise et une instance TMP dont le statut autorise explicitement la projection.",
  );

  const legacyPlan = planProjection(request.project, request.projectionType, request.definitions);
  if (legacyPlan.refusal || !legacyPlan.supported) return { ok: false, plan: { ...legacyPlan, templateDocumentStatus: resolvedDocument.status }, projection: null };
  const templateSections = templateDocument.sectionIds.map((sectionId) => request.templateContext.definition.sections.find((item) => item.sectionId === sectionId)).filter(Boolean);
  const templateSectionNodeIds = templateSections.map((section) => section!.nodeId);
  const directContainedNodeIds = request.templateContext.definition.graph.relations
    .filter((relation) => templateSectionNodeIds.includes(relation.fromId) && relation.type === "CONTAINS")
    .map((relation) => relation.toId);
  const definitionBlockNodeIds = templateSections.flatMap((section) => section!.blockIds)
    .map((blockId) => request.templateContext.definition.blocks.find((block) => block.blockId === blockId)?.nodeId)
    .filter((nodeId): nodeId is string => Boolean(nodeId));
  const allowedTemplateNodeIds = new Set([templateDocument.nodeId, ...templateSectionNodeIds, ...directContainedNodeIds, ...definitionBlockNodeIds]);
  const decisions = [...(request.decisionRecords ?? []), ...(request.humanDecisions ?? [])]
    .filter((item, index, all) => all.findIndex((candidate) => candidate.decisionId === item.decisionId && candidate.version === item.version) === index);
  const baseComposition = planComposition(request.project, legacyPlan, decisions);
  const composition = {
    ...baseComposition,
    sections: baseComposition.sections.map((section) => enrichSection(request, section, templateDocument.sectionIds, allowedTemplateNodeIds, templateDocument.nodeId)),
  };
  const sections = composeEditorialProjection(composition);
  const readiness = assessProjectionReadiness(sections);
  const versions = versionsFor(request, definition.definitionVersion);
  const seriesId = `document-series:${logicalDigest({ projectId: request.project.documentHandoff.projectId, projectionType: request.projectionType, profile: request.profile, usage: request.usage, audience: request.audience, templateId: request.templateContext.definition.templateId })}`;
  const prior = request.priorProjection?.seriesId === seriesId ? request.priorProjection : null;
  const source: DocumentProjection["source"] = {
    projectId: request.project.documentHandoff.projectId,
    projectVersion: request.project.candidateVersion.versionId,
    projectDigest: request.project.resultDigest,
    handoffVersion: request.project.documentHandoff.handoffVersion,
    template: {
      templateId: request.templateContext.definition.templateId,
      templateVersion: request.templateContext.instance.templateVersion,
      templateRevision: request.templateContext.instance.templateRevision,
      templateDefinitionDigest: request.templateContext.definition.digest,
      templateInstanceId: request.templateContext.instance.instanceId,
      templateInstanceDigest: request.templateContext.instance.digest,
      requestedDetailLevel: request.templateContext.instance.requestedDetailLevel,
    },
    regulatoryResolution: { ...request.regulatoryResolutionRef },
    documentaryPatternSnapshot: { ...request.documentaryPatternSnapshotRef },
  };
  const projectionVersion = nextVersion(prior, source, versions);
  const unknowns = uniqueSorted([...sections.flatMap((section) => section.unknowns), ...(request.unknowns ?? [])]);
  const limitations = uniqueSorted([...sections.flatMap((section) => section.limitations), ...(request.limitations ?? [])]);
  const contradictions = uniqueSorted(sections.flatMap((section) => [...section.contradictions, ...section.conflicts]));
  const material = {
    seriesId,
    projectionType: request.projectionType,
    source,
    versions,
    profile: request.profile,
    usage: request.usage,
    audience: request.audience,
    sections,
    humanDecisions: composition.humanDecisions,
    unknowns,
    limitations,
    contradictions,
    documentDefinition: resolvedDocument,
  };
  const projectionDigest = logicalDigest(material);
  if (prior?.projectionDigest === projectionDigest) return { ok: true, projection: prior as DocumentProjection };
  const projection: DocumentProjection = {
    contractVersion: DOCUMENT_PROJECTION_ENGINE_VERSION,
    projectionId: `document-projection:${projectionDigest}`,
    seriesId,
    projectionType: request.projectionType,
    projectionVersion,
    priorProjectionId: prior?.projectionId ?? null,
    lifecycle: readiness === "READY_FOR_REVIEW" ? "READY_FOR_REVIEW" : "PARTIAL",
    readiness,
    title: definition.title,
    profile: request.profile,
    usage: request.usage,
    audience: request.audience,
    requestedAt: request.requestedAt,
    source,
    versions,
    ownership: {
      structure: "TMP-001",
      content: "RESEARCH_PROJECT_AND_UPSTREAM_OWNERS",
      requirements: "REG-001",
      patterns: "DOC-002",
      editorialForm: "DOC-001",
    },
    documentDefinition: resolvedDocument,
    sections,
    unknowns,
    limitations,
    contradictions,
    humanDecisions: composition.humanDecisions,
    provenanceRefs: uniqueSorted([
      ...(request.provenance ?? []),
      ...sections.flatMap((section) => section.provenanceRefs),
      request.templateContext.instance.instanceId,
      request.templateContext.instance.digest,
      request.templateContext.definition.digest,
    ]),
    projectionDigest,
    boundary: "READ_ONLY_PROJECTION_NOT_PROJECT_TRUTH_NOT_CLINICAL_PROTOCOL",
  };
  const mutationChecks = {
    projectUnchanged: stableStringify(request.project) === projectBefore,
    templateUnchanged: stableStringify(request.templateContext) === templateBefore,
  };
  projection.audit = auditDocumentProjection(request, projection, mutationChecks);
  return { ok: true, projection: deepFreeze(projection) };
};

export function projectDocument(request: DocumentProjectionRequest): ProjectionExecutionResult;
export function projectDocument(request: LegacyDirectProjectProjectionRequest): ProjectionExecutionResult;
export function projectDocument(request: DocumentProjectionRequest | LegacyDirectProjectProjectionRequest): ProjectionExecutionResult {
  return "templateContext" in request
    ? projectDocumentFromStudyTemplate(request)
    : projectDocumentLegacyDirect(request);
}
