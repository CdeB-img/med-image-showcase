import { templateDigest } from "./canonical.ts";
import type { StudyTemplateDefinition } from "./types.ts";

const nextBehaviorVersion = (version: string) => {
  const [major, minor] = version.split(".").map(Number);
  return `${major}.${minor + 1}.0`;
};

export const classifyTemplateChange = (prior: StudyTemplateDefinition, next: StudyTemplateDefinition) => prior.behaviorDigest === next.behaviorDigest ? "DESCRIPTION_ONLY" as const : "BEHAVIORAL" as const;

export const versionStudyTemplate = (prior: StudyTemplateDefinition, candidate: StudyTemplateDefinition, updatedAt: string, reason: string): StudyTemplateDefinition => {
  const kind = classifyTemplateChange(prior, candidate);
  const templateVersion = kind === "BEHAVIORAL" ? nextBehaviorVersion(prior.templateVersion) : prior.templateVersion;
  const templateRevision = kind === "DESCRIPTION_ONLY" ? prior.templateRevision + 1 : 1;
  const material = { ...candidate, templateVersion, templateRevision, updatedAt, derivedFrom: prior.digest, supersedes: prior.digest, supersededBy: null, reason };
  return { ...material, digest: templateDigest(material) };
};
