import type { DocumentProjection, ProjectionVersions } from "./types";

const bump = (version: string, part: "minor" | "patch") => {
  const [major = 1, minor = 0, patch = 0] = version.split(".").map((value) => Number.parseInt(value, 10) || 0);
  return part === "minor" ? `${major}.${minor + 1}.0` : `${major}.${minor}.${patch + 1}`;
};

export const nextProjectionVersion = (
  prior: Readonly<DocumentProjection> | null | undefined,
  sourceVersion: string,
  sourceDigest: string,
  versions: ProjectionVersions,
) => {
  if (!prior) return "1.0.0";
  if (prior.source.projectDigest !== sourceDigest || prior.source.projectVersion !== sourceVersion) return bump(prior.projectionVersion, "minor");
  const technicalChange = prior.versions.engine !== versions.engine
    || prior.versions.template !== versions.template
    || prior.versions.pattern !== versions.pattern
    || prior.versions.compositionPolicy !== versions.compositionPolicy
    || prior.versions.projectionDefinition !== versions.projectionDefinition
    || prior.versions.renderer !== versions.renderer;
  return technicalChange ? bump(prior.projectionVersion, "patch") : prior.projectionVersion;
};

export const isDeterministicReplay = (
  prior: Readonly<DocumentProjection> | null | undefined,
  sourceVersion: string,
  sourceDigest: string,
  versions: ProjectionVersions,
  profile: string,
  usage: string,
  audience: string,
) => Boolean(prior
  && prior.source.projectDigest === sourceDigest
  && prior.source.projectVersion === sourceVersion
  && prior.versions.engine === versions.engine
  && prior.versions.template === versions.template
  && prior.versions.pattern === versions.pattern
  && prior.versions.compositionPolicy === versions.compositionPolicy
  && prior.versions.projectionDefinition === versions.projectionDefinition
  && prior.versions.renderer === versions.renderer
  && prior.profile === profile
  && prior.usage === usage
  && prior.audience === audience);
