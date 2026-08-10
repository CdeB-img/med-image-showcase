import type { DocumentProjection, ProjectionDiff, ProjectionSectionDiff, SectionDiffKind } from "./types";

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
  return {
    priorProjectionId: prior.projectionId,
    nextProjectionId: next.projectionId,
    sourceVersionChanged: prior.source.projectVersion !== next.source.projectVersion || prior.source.projectDigest !== next.source.projectDigest,
    engineVersionChanged: prior.versions.engine !== next.versions.engine,
    templateVersionChanged: prior.versions.template !== next.versions.template,
    patternVersionChanged: prior.versions.pattern !== next.versions.pattern,
    sections,
    counts,
  };
};
