import { logicalDigest } from "../knowledge-engine/canonical.js";

export type ProjectOwnerDigestSource = Readonly<{
  projectId: string;
  versionId: string;
  previousVersionId: string | null;
  contributionDigest: string;
  appliedChangeSet?: unknown;
  canonicalState?: unknown;
  sections: unknown;
  confirmationDecision: Readonly<{ decisionId: string }>;
}>;

/** Exact digest input of canonical Project adoption, shared with snapshot verification. */
export const researchProjectOwnerDigest = (project: ProjectOwnerDigestSource) => logicalDigest({
  projectId: project.projectId,
  versionId: project.versionId,
  previousVersionId: project.previousVersionId,
  contributionDigest: project.contributionDigest,
  changeSet: project.appliedChangeSet,
  canonicalState: project.canonicalState,
  sections: project.sections,
  decisionId: project.confirmationDecision.decisionId,
});
