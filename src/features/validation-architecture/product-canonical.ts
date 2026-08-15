import { validationDigest } from "./canonical";
import type { ValidationArtifactSnapshot, ValidationRun } from "./product-contracts";

const TECHNICAL_TIME_KEYS = new Set(["startedAt", "completedAt", "requestedAt", "createdAt", "generatedAt", "composedAt", "technicalTimestamp"]);
const NON_SEMANTIC_ARRAY_KEYS = new Set([
  "adapterVersions",
  "applicableCheckpoints",
  "contradictions",
  "evidenceRefs",
  "findingRefs",
  "invariantRefs",
  "limitations",
  "lineage",
  "observationsNeedingReview",
  "provenance",
  "provenanceRefs",
  "requestedInvariantRefs",
  "requestedPlanes",
  "sourceReferences",
  "sourceRefs",
  "targetRefs",
  "unknowns",
  "validatorVersions",
]);

const compareCodePoints = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;

const canonicalizeValue = (value: unknown, key = ""): unknown => {
  if (Array.isArray(value)) {
    const items = value.map((item) => canonicalizeValue(item, key));
    if (!NON_SEMANTIC_ARRAY_KEYS.has(key)) return items;
    return [...items].sort((left, right) => compareCodePoints(JSON.stringify(left), JSON.stringify(right)));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([entryKey, item]) => item !== undefined && !TECHNICAL_TIME_KEYS.has(entryKey))
      .sort(([left], [right]) => compareCodePoints(left, right))
      .map(([entryKey, item]) => [entryKey, canonicalizeValue(item, entryKey)]));
  }
  return value;
};

const cloneCanonical = <T>(value: T): T => canonicalizeValue(value) as T;
const deepFreeze = <T>(value: T): T => {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value as Record<string, unknown>).forEach((item) => deepFreeze(item));
  return Object.freeze(value);
};

export const canonicalizeValidationArtifactSnapshot = (snapshot: Readonly<ValidationArtifactSnapshot>): ValidationArtifactSnapshot => {
  const { snapshotDigest: _snapshotDigest, ...material } = snapshot;
  return { ...cloneCanonical(material), snapshotDigest: "" } as ValidationArtifactSnapshot;
};

export const computeValidationArtifactSnapshotDigest = (snapshot: Readonly<ValidationArtifactSnapshot>) => validationDigest(canonicalizeValidationArtifactSnapshot(snapshot));

export const finalizeValidationArtifactSnapshot = (snapshot: Omit<ValidationArtifactSnapshot, "snapshotDigest">): ValidationArtifactSnapshot => {
  const candidate = { ...snapshot, snapshotDigest: "" } satisfies ValidationArtifactSnapshot;
  const canonical = canonicalizeValidationArtifactSnapshot(candidate);
  return deepFreeze({ ...canonical, snapshotDigest: computeValidationArtifactSnapshotDigest(canonical) });
};

export const computeValidationRunConfigurationDigest = (run: Pick<ValidationRun,
  "checkpointRef" | "sourceArtifactRef" | "targetArtifactRef" | "invariantRefs" | "adapterVersions" | "validatorVersions" | "semanticReviewPolicy" | "humanReviewPolicy" | "canonicalizationVersion"
>) => validationDigest(cloneCanonical({
  checkpointRef: run.checkpointRef,
  sourceArtifactRef: run.sourceArtifactRef,
  targetArtifactRef: run.targetArtifactRef,
  invariantRefs: run.invariantRefs,
  adapterVersions: run.adapterVersions,
  validatorVersions: run.validatorVersions,
  semanticReviewPolicy: run.semanticReviewPolicy,
  humanReviewPolicy: run.humanReviewPolicy,
  canonicalizationVersion: run.canonicalizationVersion,
}));

export const canonicalizeValidationRun = (run: Readonly<ValidationRun>): ValidationRun => {
  const { resultDigest: _resultDigest, ...material } = run;
  return { ...cloneCanonical(material), resultDigest: "" } as ValidationRun;
};

export const computeValidationRunDigest = (run: Readonly<ValidationRun>) => validationDigest(canonicalizeValidationRun(run));

export const finalizeValidationRun = (run: Omit<ValidationRun, "configurationDigest" | "resultDigest"> & Partial<Pick<ValidationRun, "configurationDigest" | "resultDigest">>): ValidationRun => {
  const withoutDigests = { ...run, configurationDigest: "", resultDigest: "" } as ValidationRun;
  const withConfiguration = { ...withoutDigests, configurationDigest: computeValidationRunConfigurationDigest(withoutDigests) };
  return deepFreeze({ ...withConfiguration, resultDigest: computeValidationRunDigest(withConfiguration) });
};

export const verifyValidationRunDigest = (run: Readonly<ValidationRun>) => Boolean(run.resultDigest) && run.resultDigest === computeValidationRunDigest(run);

export const canonicalizeValidationProductValue = <T>(value: Readonly<T>): T => cloneCanonical(value);
