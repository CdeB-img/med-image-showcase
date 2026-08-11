import type { DocumentProjection, ProjectionChangeKind, ProjectionDiff, ProjectionSectionDiff, SectionDiffKind } from "./types";

const difference = (left: ReadonlyArray<string>, right: ReadonlyArray<string>) => left.filter((item) => !right.includes(item)).sort();

export const diffProjections = (prior: Readonly<DocumentProjection>, next: Readonly<DocumentProjection>): ProjectionDiff => {
  if (prior.seriesId !== next.seriesId) throw new Error("PROJECTION_SERIES_MISMATCH");
  const priorById = new Map(prior.sections.map((section) => [section.sectionId, section]));
  const nextById = new Map(next.sections.map((section) => [section.sectionId, section]));
  const sectionIds = [...new Set([...priorById.keys(), ...nextById.keys()])].sort((left, right) => {
    const leftOrder = nextById.get(left)?.order ?? priorById.get(left)?.order ?? 0;
    const rightOrder = nextById.get(right)?.order ?? priorById.get(right)?.order ?? 0;
    return leftOrder - rightOrder;
  });
  const sections: ProjectionSectionDiff[] = sectionIds.map((sectionId) => {
    const before = priorById.get(sectionId);
    const after = nextById.get(sectionId);
    const kind: SectionDiffKind = !before ? "ADDED" : !after ? "REMOVED" : before.contentDigest === after.contentDigest ? "UNCHANGED" : "MODIFIED";
    return {
      sectionId,
      title: after?.title ?? before?.title ?? sectionId,
      kind,
      priorStatus: before?.status ?? null,
      nextStatus: after?.status ?? null,
      priorApplicability: before?.applicability ?? null,
      nextApplicability: after?.applicability ?? null,
      generabilityChanged: Boolean(before && after && before.status !== after.status),
      applicabilityChanged: Boolean(before && after && before.applicability !== after.applicability),
      contentChanged: kind === "ADDED" || kind === "REMOVED" || kind === "MODIFIED",
      addedSourceRefs: difference(after?.provenanceRefs ?? [], before?.provenanceRefs ?? []),
      removedSourceRefs: difference(before?.provenanceRefs ?? [], after?.provenanceRefs ?? []),
    };
  });
  const counts = sections.reduce<Record<SectionDiffKind, number>>((accumulator, item) => ({ ...accumulator, [item.kind]: accumulator[item.kind] + 1 }), { ADDED: 0, REMOVED: 0, MODIFIED: 0, UNCHANGED: 0 });
  const changeKinds: ProjectionChangeKind[] = [];
  const projectChanged = prior.source.projectVersion !== next.source.projectVersion || prior.source.projectDigest !== next.source.projectDigest;
  const templateStructureChanged = prior.source.template?.templateDefinitionDigest !== next.source.template?.templateDefinitionDigest
    || prior.source.template?.templateId !== next.source.template?.templateId
    || prior.source.template?.templateVersion !== next.source.template?.templateVersion
    || prior.source.template?.templateRevision !== next.source.template?.templateRevision;
  const regulatoryChanged = prior.source.regulatoryResolution?.resolutionId !== next.source.regulatoryResolution?.resolutionId
    || prior.source.regulatoryResolution?.corpusVersion !== next.source.regulatoryResolution?.corpusVersion
    || prior.source.regulatoryResolution?.corpusDigest !== next.source.regulatoryResolution?.corpusDigest;
  const patternChanged = prior.source.documentaryPatternSnapshot?.catalogId !== next.source.documentaryPatternSnapshot?.catalogId
    || prior.source.documentaryPatternSnapshot?.catalogVersion !== next.source.documentaryPatternSnapshot?.catalogVersion
    || prior.source.documentaryPatternSnapshot?.catalogDigest !== next.source.documentaryPatternSnapshot?.catalogDigest;
  const unknownChanged = JSON.stringify(prior.unknowns) !== JSON.stringify(next.unknowns);
  const conflictChanged = JSON.stringify(prior.contradictions) !== JSON.stringify(next.contradictions)
    || JSON.stringify(prior.sections.map((section) => section.conflicts)) !== JSON.stringify(next.sections.map((section) => section.conflicts));
  const limitationChanged = JSON.stringify(prior.limitations) !== JSON.stringify(next.limitations);
  if (projectChanged) changeKinds.push("PROJECT_CONTENT_CHANGED");
  if (templateStructureChanged) changeKinds.push("TEMPLATE_STRUCTURE_CHANGED");
  if (regulatoryChanged) changeKinds.push("REGULATORY_REQUIREMENT_CHANGED");
  if (patternChanged) changeKinds.push("DOCUMENTARY_PATTERN_CHANGED");
  if (unknownChanged) changeKinds.push("UNKNOWN_CHANGED");
  if (conflictChanged) changeKinds.push("CONFLICT_CHANGED");
  if (limitationChanged) changeKinds.push("LIMITATION_CHANGED");
  const rendererChanged = prior.versions.renderer !== next.versions.renderer;
  if (rendererChanged && !changeKinds.length && prior.versions.engine === next.versions.engine && prior.versions.projectionDefinition === next.versions.projectionDefinition && prior.versions.compositionPolicy === next.versions.compositionPolicy) changeKinds.push("RENDERER_ONLY_CHANGED");
  return {
    priorProjectionId: prior.projectionId,
    nextProjectionId: next.projectionId,
    sourceVersionChanged: projectChanged,
    engineVersionChanged: prior.versions.engine !== next.versions.engine,
    templateVersionChanged: prior.versions.template !== next.versions.template,
    patternVersionChanged: prior.versions.pattern !== next.versions.pattern,
    projectionDefinitionVersionChanged: prior.versions.projectionDefinition !== next.versions.projectionDefinition,
    rendererVersionChanged: rendererChanged,
    changeKinds,
    sections,
    counts,
  };
};
