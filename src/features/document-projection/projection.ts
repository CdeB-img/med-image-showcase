import { logicalDigest, stableStringify, uniqueSorted } from "@/features/knowledge-engine/canonical";
import { DEFAULT_PROJECTION_VERSIONS } from "./contracts";
import { planComposition } from "./composition";
import { composeEditorialProjection } from "./editorial";
import { planProjection } from "./planner";
import { assessProjectionReadiness } from "./readiness";
import { isDeterministicReplay, nextProjectionVersion } from "./versioning";
import type { DocumentProjection, LegacyDirectProjectProjectionRequest, ProjectionExecutionResult, ProjectionVersions } from "./types";
import { DOCUMENT_PROJECTION_ENGINE_VERSION } from "./types";

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
  }
  return value;
};

export const LEGACY_DIRECT_PROJECT_PROJECTION = Object.freeze({
  path: "LEGACY_DIRECT_PROJECT_PROJECTION" as const,
  deprecated: true as const,
  replacement: "StudyTemplateInstance -> DocumentProjection",
});

const projectionVersions = (request: LegacyDirectProjectProjectionRequest, definitionVersion: string | null): ProjectionVersions => ({
  engine: DOCUMENT_PROJECTION_ENGINE_VERSION,
  template: request.versions?.template ?? definitionVersion ?? DEFAULT_PROJECTION_VERSIONS.template,
  pattern: request.versions?.pattern ?? DEFAULT_PROJECTION_VERSIONS.pattern,
  compositionPolicy: request.versions?.compositionPolicy ?? DEFAULT_PROJECTION_VERSIONS.compositionPolicy,
  projectionDefinition: request.versions?.projectionDefinition ?? definitionVersion ?? DEFAULT_PROJECTION_VERSIONS.projectionDefinition,
  renderer: request.versions?.renderer ?? DEFAULT_PROJECTION_VERSIONS.renderer,
});

export const projectDocumentLegacyDirect = (request: LegacyDirectProjectProjectionRequest): ProjectionExecutionResult => {
  const sourceBefore = stableStringify(request.project);
  const plan = planProjection(request.project, request.projectionType, request.definitions);
  if (plan.refusal || !plan.supported) return { ok: false, plan, projection: null };
  const versions = projectionVersions(request, plan.templateId);
  const seriesId = `document-series:${logicalDigest({ projectId: request.project.documentHandoff.projectId, projectionType: request.projectionType, profile: request.profile, usage: request.usage, audience: request.audience })}`;
  const compatiblePrior = request.priorProjection?.seriesId === seriesId ? request.priorProjection : null;
  if (isDeterministicReplay(compatiblePrior, request.project.candidateVersion.versionId, request.project.resultDigest, versions, request.profile, request.usage, request.audience)) {
    return { ok: true, projection: compatiblePrior as DocumentProjection };
  }
  const composition = planComposition(request.project, plan, request.decisionRecords);
  const sections = composeEditorialProjection(composition);
  const readiness = assessProjectionReadiness(sections);
  const projectionVersion = nextProjectionVersion(compatiblePrior, composition.sourceProjectVersion, composition.sourceProjectDigest, versions);
  const material = {
    seriesId,
    projectionVersion,
    sourceProjectId: composition.sourceProjectId,
    sourceProjectVersion: composition.sourceProjectVersion,
    sourceProjectDigest: composition.sourceProjectDigest,
    versions,
    profile: request.profile,
    usage: request.usage,
    audience: request.audience,
    requestedAt: request.requestedAt,
    sections,
    humanDecisions: composition.humanDecisions,
  };
  const projectionDigest = logicalDigest(material);
  const projection: DocumentProjection = {
    contractVersion: DOCUMENT_PROJECTION_ENGINE_VERSION,
    projectionId: `document-projection:${projectionDigest}`,
    seriesId,
    projectionType: request.projectionType,
    projectionVersion,
    priorProjectionId: compatiblePrior?.projectionId ?? null,
    lifecycle: readiness === "READY_FOR_REVIEW" ? "READY_FOR_REVIEW" : "PARTIAL",
    readiness,
    title: plan.title ?? `${request.projectionType} — projection documentaire`,
    profile: request.profile,
    usage: request.usage,
    audience: request.audience,
    requestedAt: request.requestedAt,
    source: {
      projectId: composition.sourceProjectId,
      projectVersion: composition.sourceProjectVersion,
      projectDigest: composition.sourceProjectDigest,
      handoffVersion: request.project.documentHandoff.handoffVersion,
      template: null,
      regulatoryResolution: null,
      documentaryPatternSnapshot: null,
    },
    versions,
    ownership: {
      structure: "LEGACY_DOC001_PROJECTION_DEFINITION",
      content: "RESEARCH_PROJECT_AND_UPSTREAM_OWNERS",
      requirements: "REG-001",
      patterns: "DOC-002",
      editorialForm: "DOC-001",
    },
    documentDefinition: null,
    sections,
    unknowns: uniqueSorted(sections.flatMap((section) => section.unknowns)),
    limitations: uniqueSorted(sections.flatMap((section) => section.limitations)),
    contradictions: uniqueSorted(sections.flatMap((section) => section.contradictions)),
    humanDecisions: composition.humanDecisions,
    provenanceRefs: uniqueSorted(sections.flatMap((section) => section.provenanceRefs)),
    projectionDigest,
    legacy: { path: LEGACY_DIRECT_PROJECT_PROJECTION.path, deprecated: true },
    boundary: "READ_ONLY_PROJECTION_NOT_PROJECT_TRUTH_NOT_CLINICAL_PROTOCOL",
  };
  if (stableStringify(request.project) !== sourceBefore) throw new Error("SOURCE_PROJECT_MUTATED_BY_DOCUMENT_PROJECTION");
  return { ok: true, projection: deepFreeze(projection) };
};
