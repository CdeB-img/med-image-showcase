import { logicalDigest, stableStringify } from "./canonical.js";
import type { ProjectSource, ProjectSourceLibrary } from "./project-source-library.js";
import type { ApplicabilityState } from "./types.js";

/** Operational documentary qualification, never global assertion admission or Project adoption. */
export type EvidenceProjectBinding = { projectRef: string; projectVersion: string; projectDigest: string };
export type EvidenceContextFacet = { dimension: string; value: string };
export type EvidenceSourceCapture = {
  metadata: { title: string; authors: string[]; publication: string; doi?: string; pmid?: string; url: string; version: string };
  /** Original accessible representation. Claims must equal a complete captured paragraph. */
  text: string;
  contentDigest: string;
  access: "ABSTRACT_ONLY" | "FULL_TEXT";
  lifecycle: "CURRENT" | "CORRECTED" | "RETRACTED" | "SUPERSEDED";
  correction?: { notice: EvidenceSourceCapture; affectedLocations: string[]; impact: "METADATA_ONLY" | "CONTENT" };
  provenance: { providerId: string; requestId: string; sourcePath: string; retrievedAt: string; verificationVersion: string };
};
export type ProjectScopedEvidenceInput = {
  projectBinding: EvidenceProjectBinding;
  sourceId: string;
  sourceRevision: string;
  capture: EvidenceSourceCapture;
  claim: string;
  location: string;
  passage: string;
  sourceContext: Array<EvidenceContextFacet & { anchor: string }>;
  targetContext: EvidenceContextFacet[];
  applicability: Extract<ApplicabilityState, "APPLICABLE_EXACT" | "APPLICABLE_WITH_LIMITATIONS" | "PARTIALLY_APPLICABLE">;
  applicabilityReason: string;
  limitations: { population: string[]; method: string[]; context: string[]; forbiddenExtrapolations: string[] };
  contradictionRefs: string[];
};
export type ProjectScopedEvidence = {
  contract: "KNOWLEDGE_PROJECT_SCOPED_EVIDENCE_V1";
  evidenceId: string;
  status: "PROJECT_SCOPED_QUALIFIED" | "REJECTED" | "SUPERSEDED";
  input: ProjectScopedEvidenceInput;
  failures: string[];
  digest: string;
};
const whitespace = (text: string) => text.replace(/\s+/gu, " ").trim();
const present = (text: unknown): text is string => typeof text === "string" && Boolean(text.trim());
const publicUrl = (text: string) => {
  try { const url = new URL(text); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password; } catch { return false; }
};
export const sameEvidenceBinding = (left: EvidenceProjectBinding, right: EvidenceProjectBinding) => stableStringify(left) === stableStringify(right);
export const projectScopedEvidenceId = (input: ProjectScopedEvidenceInput) => `project-evidence:${logicalDigest({
  binding: input.projectBinding, sourceId: input.sourceId, sourceRevision: input.sourceRevision, claim: input.claim, location: input.location,
})}`;
const captureValid = (capture: EvidenceSourceCapture) => {
  const { contentDigest, ...material } = capture;
  return contentDigest === logicalDigest(material) && present(capture.text) && ["ABSTRACT_ONLY", "FULL_TEXT"].includes(capture.access)
    && present(capture.metadata.title) && capture.metadata.authors.length > 0 && capture.metadata.authors.every(present)
    && present(capture.metadata.publication) && present(capture.metadata.version) && publicUrl(capture.metadata.url)
    && Boolean(capture.metadata.doi || capture.metadata.pmid)
    && Object.values(capture.provenance).every(present) && publicUrl(capture.provenance.sourcePath)
    && Number.isFinite(Date.parse(capture.provenance.retrievedAt));
};

/** No semantic paraphrase verifier is claimed: stronger or rewritten claims remain candidates. */
export const projectScopedEvidenceFailures = (input: ProjectScopedEvidenceInput, source: ProjectSource, current: EvidenceProjectBinding): string[] => {
  const failures: string[] = [];
  const metadata = input.capture.metadata;
  const identifiers = ["doi", "pmid"] as const;
  if (input.sourceId !== source.source.sourceId || input.sourceRevision !== source.source.revision
    || whitespace(metadata.title) !== whitespace(source.source.title)
    || stableStringify(metadata.authors) !== stableStringify(source.authors)
    || metadata.version !== input.sourceRevision || metadata.url !== source.url
    || !identifiers.some((key) => Boolean(source.source[key] && metadata[key] === source.source[key]))
    || identifiers.some((key) => Boolean(source.source[key] && metadata[key] !== source.source[key]))) failures.push("SOURCE_IDENTITY_UNVERIFIED");
  if (!captureValid(input.capture)) failures.push("PROVENANCE_INCOMPLETE_OR_CAPTURE_INVALID");
  if (!sameEvidenceBinding(input.projectBinding, current) || !Object.values(current).every(present)) failures.push("PROJECT_BINDING_STALE");
  const paragraphs = input.capture.text.split(/\r?\n\s*\r?\n/u).map(whitespace);
  if (!present(input.location) || !present(input.claim) || !present(input.passage)
    || whitespace(input.claim) !== whitespace(input.passage) || !paragraphs.includes(whitespace(input.passage))) failures.push("CLAIM_UNSUPPORTED_OR_STRENGTHENED");
  if (/RETRACT|SUPERSEDED/.test(source.source.status) || ["RETRACTED", "SUPERSEDED"].includes(input.capture.lifecycle)) failures.push("SOURCE_LIFECYCLE_INELIGIBLE");
  const corrected = /CORRECTED/.test(source.source.status) || input.capture.lifecycle === "CORRECTED";
  const correction = input.capture.correction;
  if (corrected && (!correction || !captureValid(correction.notice) || correction.notice.lifecycle !== "CURRENT"
    || correction.notice.metadata.doi === metadata.doi || !metadata.doi || !correction.notice.text.includes(metadata.doi) || !Array.isArray(correction.affectedLocations)
    || (correction.impact === "CONTENT" && correction.affectedLocations.includes(input.location)))) failures.push("SOURCE_CORRECTION_UNMANAGED");
  if (input.capture.lifecycle !== "CURRENT" && input.capture.lifecycle !== "CORRECTED") failures.push("SOURCE_LIFECYCLE_INELIGIBLE");
  if (!Object.values(input.limitations).every((limits) => Array.isArray(limits) && limits.length > 0 && limits.every(present))) failures.push("LIMITATIONS_INCOMPLETE");
  const contextAnchored = input.sourceContext.length > 0 && input.sourceContext.every((facet) => present(facet.dimension) && present(facet.value)
    && present(facet.anchor) && whitespace(facet.anchor).includes(whitespace(facet.value)) && whitespace(input.capture.text).includes(whitespace(facet.anchor)));
  const targetValid = input.targetContext.length > 0 && input.targetContext.every((facet) => present(facet.dimension) && present(facet.value));
  const exact = targetValid && input.targetContext.every((target) => input.sourceContext.some((facet) => facet.dimension === target.dimension && whitespace(facet.value) === whitespace(target.value)));
  if (!contextAnchored || !targetValid || !present(input.applicabilityReason)
    || !["APPLICABLE_EXACT", "APPLICABLE_WITH_LIMITATIONS", "PARTIALLY_APPLICABLE"].includes(input.applicability)
    || (input.applicability !== "PARTIALLY_APPLICABLE" && !exact)) failures.push("APPLICABILITY_UNQUALIFIED");
  if (new Set(input.contradictionRefs).size !== input.contradictionRefs.length || input.contradictionRefs.some((ref) => !present(ref) || ref === projectScopedEvidenceId(input))) failures.push("CONTRADICTION_REFS_INVALID");
  return [...new Set(failures)];
};

export const qualifyProjectScopedEvidence = (input: ProjectScopedEvidenceInput, source: ProjectSource, current: EvidenceProjectBinding): ProjectScopedEvidence => {
  const failures = projectScopedEvidenceFailures(input, source, current);
  const material = { contract: "KNOWLEDGE_PROJECT_SCOPED_EVIDENCE_V1" as const, evidenceId: projectScopedEvidenceId(input),
    status: failures.length ? "REJECTED" as const : "PROJECT_SCOPED_QUALIFIED" as const, input: JSON.parse(stableStringify(input)) as ProjectScopedEvidenceInput, failures };
  return { ...material, digest: logicalDigest(material) };
};

export const validateProjectScopedEvidenceRecord = (record: ProjectScopedEvidence) => {
  const { digest, ...material } = record;
  if (record.contract !== "KNOWLEDGE_PROJECT_SCOPED_EVIDENCE_V1" || !["PROJECT_SCOPED_QUALIFIED", "REJECTED", "SUPERSEDED"].includes(record.status)
    || !Array.isArray(record.failures) || (record.status === "PROJECT_SCOPED_QUALIFIED" && record.failures.length > 0)
    || record.evidenceId !== projectScopedEvidenceId(record.input) || digest !== logicalDigest(material)) throw new Error("PROJECT_SCOPED_EVIDENCE_INVALID");
};

export const currentProjectScopedEvidence = (library: ProjectSourceLibrary): ProjectScopedEvidence[] => {
  if (!library.projectBinding || library.projectBinding.projectRef !== library.projectId) return [];
  const qualified = (library.projectScopedEvidence ?? []).filter((record) => {
    try {
      validateProjectScopedEvidenceRecord(record);
      const source = library.sources.find((entry) => entry.source.sourceId === record.input.sourceId);
      return record.status === "PROJECT_SCOPED_QUALIFIED" && source && !projectScopedEvidenceFailures(record.input, source, library.projectBinding).length;
    } catch { return false; }
  });
  // A discordant pair is atomic for projection: missing/stale/superseded counterparts cannot disappear silently.
  let closed = qualified;
  while (true) {
    const next = closed.filter((record) => record.input.contradictionRefs.every((ref) => closed.some((other) => other.evidenceId === ref && other.input.contradictionRefs.includes(record.evidenceId))));
    if (next.length === closed.length) return next;
    closed = next;
  }
};

export const projectScopedEvidenceLimits = (record: ProjectScopedEvidence) => [
  `Applicabilité : ${record.input.applicability}. ${record.input.applicabilityReason}`,
  ...record.input.sourceContext.map((facet) => `${facet.dimension} : ${facet.value}`),
  ...Object.entries(record.input.limitations).flatMap(([dimension, limits]) => limits.map((limit) => `${dimension} : ${limit}`)),
  ...(record.input.capture.access === "ABSTRACT_ONLY" ? ["Qualification limitée au résumé accessible ; aucun résultat non accessible n’est inféré."] : []),
];
