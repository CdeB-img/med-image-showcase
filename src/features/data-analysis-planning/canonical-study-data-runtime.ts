import { logicalDigest, stableStringify, uniqueSorted } from "@/features/knowledge-engine/canonical";
import type { ProjectContextSnapshot } from "@/features/research-project-construction/canonical-project-backbone";

export const CANONICAL_STUDY_DATA_RUNTIME_CONTRACT = "CANONICAL_STUDY_DATA_RUNTIME" as const;
export const CANONICAL_STUDY_DATA_RESULT_CONTRACT = "CANONICAL_STUDY_DATA_RESULT" as const;
export const CANONICAL_STUDY_DATA_RUNTIME_VERSION = "1.0.0" as const;

export type CanonicalStudyDataStatus = {
  value: "OBSERVED_VALUE" | "NO_VALUE";
  realization: "REALIZED" | "NOT_COLLECTED" | "NOT_PERFORMED" | "UNKNOWN";
  applicability: "APPLICABLE" | "NOT_APPLICABLE" | "UNKNOWN";
  validity: "VALID" | "INVALID" | "UNKNOWN";
  evaluability: "EVALUABLE" | "NOT_EVALUABLE" | "UNKNOWN";
  availability: "AVAILABLE" | "NOT_AVAILABLE" | "SOURCE_UNAVAILABLE" | "LOST" | "UNKNOWN";
  use: "ELIGIBLE" | "REJECTED" | "WITHDRAWN" | "EXCLUDED" | "UNKNOWN";
};

export type ExplicitSyntheticVariableOccurrence = {
  syntheticFixture: true;
  occurrenceId: string;
  canonicalVariableRef: string;
  canonicalVariableVersion: string;
  expectedOccasionRef: string | null;
  studyUnitRef: string;
  source: {
    sourceRef: string;
    sourceVersion: string;
    mandate: "STUDY_MANDATED" | "ROUTINE_CARE" | "HISTORICAL" | "EXTERNAL" | "DERIVED";
    owner: string;
  };
  observedValue: string | number | boolean | null;
  unit: string | null;
  observedAt: string | null;
  status: CanonicalStudyDataStatus;
  factualMissingnessReason: string | null;
  qualityFindingRefs: readonly string[];
  provenanceRefs: readonly string[];
  parentOccurrenceRefs: readonly string[];
  transformationRefs: readonly string[];
};

export type CanonicalDerivationRequirement = {
  derivationId: string;
  outputVariableRef: string;
  parentVariableRefs: readonly string[];
  expressionRef: string;
  purpose: string;
  provenanceRefs: readonly string[];
};

export type CanonicalBiospecimenRepresentation = {
  biospecimenRef: string;
  biospecimenVersion: string;
  materialType: string;
  collectionOccasionRef: string | null;
  sourceRefs: readonly string[];
};

export type CanonicalStudyDataRuntimeInput = {
  contract: typeof CANONICAL_STUDY_DATA_RUNTIME_CONTRACT;
  contractVersion: typeof CANONICAL_STUDY_DATA_RUNTIME_VERSION;
  inputId: string;
  projectId: string;
  projectVersion: string;
  projectDigest: string;
  projectSnapshot: Readonly<ProjectContextSnapshot>;
  selectedNeed: {
    needRef: string;
    purpose: string;
    affectedDecisionRefs: readonly string[];
    affectedBranchRefs: readonly string[];
    owner: "QUERY_NAVIGATION";
  };
  upstreamOwnerInputs: readonly {
    sourceOwner: "RESEARCH_PROJECT" | "OBSERVABILITY_MEASUREMENT" | "IMAGING";
    resultRef: string;
    resultVersion: string;
    resultDigest: string;
    purpose: string;
    provenanceRefs: readonly string[];
    ownershipTransferred: false;
  }[];
  explicitSyntheticOccurrences: readonly ExplicitSyntheticVariableOccurrence[];
  derivationRequirements: readonly CanonicalDerivationRequirement[];
  biospecimenRepresentations: readonly CanonicalBiospecimenRepresentation[];
  projectWriteAuthorized: false;
};

export type CanonicalStudyDataResult = {
  contract: typeof CANONICAL_STUDY_DATA_RESULT_CONTRACT;
  contractVersion: typeof CANONICAL_STUDY_DATA_RUNTIME_VERSION;
  owner: "STUDY_DATA_CDM";
  capabilityId: "STUDY_DATA_PLANNING";
  resultId: string;
  resultVersion: typeof CANONICAL_STUDY_DATA_RUNTIME_VERSION;
  resultDigest: string;
  resultStatus: "CANONICAL_REPRESENTATION_READY" | "INFORMATION_REQUIRED";
  sourceProject: { projectId: string; projectVersion: string; projectDigest: string; snapshotDigest: string };
  sourceNeed: CanonicalStudyDataRuntimeInput["selectedNeed"];
  sourceOwnerLineage: CanonicalStudyDataRuntimeInput["upstreamOwnerInputs"];
  variableRepresentations: readonly {
    representationId: string;
    canonicalVariableRef: string;
    canonicalVariableVersion: string;
    label: string;
    scientificRole: string | null;
    scientificMeaningOwner: "RESEARCH_PROJECT";
    observablePropertyRefs: readonly string[];
    measurementDefinitionRefs: readonly string[];
    sourceRefs: readonly string[];
  }[];
  expectedOccasionRepresentations: readonly {
    representationId: string;
    expectedOccasionRef: string;
    expectedOccasionVersion: string;
    canonicalVariableRef: string;
    anchor: ProjectContextSnapshot["expectedVariableOccasions"][number]["anchor"];
    status: "EXPECTED_NOT_REALIZED";
    scientificMeaningOwner: "RESEARCH_PROJECT";
    sourceRefs: readonly string[];
  }[];
  variableOccurrences: readonly (ExplicitSyntheticVariableOccurrence & {
    representationOwner: "STUDY_DATA_CDM";
    analyticalMissingnessMechanism: null;
  })[];
  derivations: readonly (CanonicalDerivationRequirement & {
    owner: "STUDY_DATA_CDM";
    executionStatus: "NOT_EXECUTED_REQUIREMENT_ONLY";
  })[];
  biospecimens: readonly (CanonicalBiospecimenRepresentation & {
    owner: "BIOSPECIMEN_MATERIAL";
    representedAsVariable: false;
  })[];
  datasetProjections: readonly {
    projectionId: string;
    variableRefs: readonly string[];
    expectedOccasionRefs: readonly string[];
    occurrenceRefs: readonly string[];
    sourceOfTruth: false;
    materialized: false;
  }[];
  informationNeeds: readonly {
    needId: string;
    informationNeeded: string;
    reason: string;
    targetOwner: "RESEARCH_PROJECT" | "OBSERVABILITY_MEASUREMENT" | "IMAGING" | "DATA_MANAGEMENT";
    sourceRefs: readonly string[];
    status: "OPEN_NOT_RESOLVED";
  }[];
  downstreamHandoffs: readonly {
    handoffId: string;
    sourceOwner: "STUDY_DATA_CDM";
    targetOwner: "DATA_MANAGEMENT" | "BIOSTATISTICS" | "RESEARCH_PROJECT" | "OBSERVABILITY_MEASUREMENT" | "IMAGING";
    purpose: string;
    informationNeeded: readonly string[];
    provenanceRefs: readonly string[];
    status: "PROPOSED_NOT_EXECUTED";
    ownershipTransferred: false;
    projectWriteAuthorized: false;
  }[];
  limitations: readonly string[];
  unresolvedQuestions: readonly string[];
  projectWriteAuthorized: false;
  projectOwnershipTransferred: false;
  projectObjectsRedefined: false;
  expectedOccasionCreatedOccurrence: false;
  datasetIsSourceOfTruth: false;
  analyticalMissingnessStrategyCreated: false;
  realizedDataFabricated: false;
};

const currentKnown = (snapshot: Readonly<ProjectContextSnapshot>, type: string) => snapshot.objects
  .filter((item) => item.type === type && !["UNKNOWN", "WITHHELD"].includes(item.epistemicState));

const relationsFor = (snapshot: Readonly<ProjectContextSnapshot>, sourceRef: string, targetType: string) => {
  const targetRefs = new Set(currentKnown(snapshot, targetType).map((item) => item.stableId));
  return uniqueSorted(snapshot.relations.flatMap((relation) => {
    if (relation.sourceProjectRef === sourceRef && targetRefs.has(relation.targetProjectRef)) return [relation.targetProjectRef];
    if (relation.targetProjectRef === sourceRef && targetRefs.has(relation.sourceProjectRef)) return [relation.sourceProjectRef];
    return [];
  }));
};

const buildDigest = (result: Omit<CanonicalStudyDataResult, "resultDigest">) => logicalDigest(result);

export const executeCanonicalStudyDataRuntime = (
  input: Readonly<CanonicalStudyDataRuntimeInput>,
): Readonly<CanonicalStudyDataResult> => {
  if (input.contract !== CANONICAL_STUDY_DATA_RUNTIME_CONTRACT
    || input.contractVersion !== CANONICAL_STUDY_DATA_RUNTIME_VERSION) throw new Error("CDM_RUNTIME_INPUT_CONTRACT_INVALID");
  if (input.projectId !== input.projectSnapshot.sourceProjectRef
    || input.projectVersion !== input.projectSnapshot.sourceProjectVersion
    || input.projectDigest !== input.projectSnapshot.sourceProjectDigest
    || input.projectWriteAuthorized !== false) throw new Error("CDM_RUNTIME_PROJECT_BINDING_INVALID");
  if (input.upstreamOwnerInputs.some((item) => item.ownershipTransferred !== false)) throw new Error("CDM_UPSTREAM_OWNERSHIP_TRANSFER_FORBIDDEN");
  const before = stableStringify(input.projectSnapshot);
  const variables = currentKnown(input.projectSnapshot, "CANONICAL_VARIABLE");
  const variableVersions = new Map(variables.map((item) => [item.stableId, item.versionRef]));
  const occasions = input.projectSnapshot.expectedVariableOccasions
    .filter((item) => variableVersions.has(item.variableProjectRef));
  const occasionRefs = new Set(occasions.map((item) => item.stableId));
  input.explicitSyntheticOccurrences.forEach((item) => {
    if (item.syntheticFixture !== true
      || variableVersions.get(item.canonicalVariableRef) !== item.canonicalVariableVersion
      || (item.expectedOccasionRef !== null && !occasionRefs.has(item.expectedOccasionRef))
      || (item.observedValue === null && item.status.value !== "NO_VALUE")
      || (item.observedValue !== null && item.status.value !== "OBSERVED_VALUE")) {
      throw new Error("CDM_SYNTHETIC_OCCURRENCE_INVALID");
    }
  });
  input.derivationRequirements.forEach((item) => {
    if (!variableVersions.has(item.outputVariableRef)
      || item.parentVariableRefs.some((parent) => !variableVersions.has(parent))) throw new Error("CDM_DERIVATION_LINEAGE_INVALID");
  });
  const variableRepresentations: CanonicalStudyDataResult["variableRepresentations"] = variables.map((item) => ({
    representationId: `cdm-variable:${logicalDigest({ ref: item.stableId, version: item.versionRef })}`,
    canonicalVariableRef: item.stableId,
    canonicalVariableVersion: item.versionRef,
    label: item.content,
    scientificRole: item.scientificRole,
    scientificMeaningOwner: "RESEARCH_PROJECT",
    observablePropertyRefs: relationsFor(input.projectSnapshot, item.stableId, "OBSERVABLE_PROPERTY"),
    measurementDefinitionRefs: relationsFor(input.projectSnapshot, item.stableId, "MEASUREMENT_DEFINITION"),
    sourceRefs: uniqueSorted([item.versionRef, ...item.provenance.evidenceRefs]),
  }));
  const expectedOccasionRepresentations: CanonicalStudyDataResult["expectedOccasionRepresentations"] = occasions.map((item) => ({
    representationId: `cdm-expected-occasion:${logicalDigest({ ref: item.stableId, version: item.versionRef })}`,
    expectedOccasionRef: item.stableId,
    expectedOccasionVersion: item.versionRef,
    canonicalVariableRef: item.variableProjectRef,
    anchor: structuredClone(item.anchor),
    status: "EXPECTED_NOT_REALIZED",
    scientificMeaningOwner: "RESEARCH_PROJECT",
    sourceRefs: uniqueSorted([item.versionRef, ...item.provenance.evidenceRefs]),
  }));
  const variableOccurrences = input.explicitSyntheticOccurrences.map((item) => ({
    ...structuredClone(item),
    qualityFindingRefs: uniqueSorted([...item.qualityFindingRefs]),
    provenanceRefs: uniqueSorted([...item.provenanceRefs]),
    parentOccurrenceRefs: uniqueSorted([...item.parentOccurrenceRefs]),
    transformationRefs: uniqueSorted([...item.transformationRefs]),
    representationOwner: "STUDY_DATA_CDM" as const,
    analyticalMissingnessMechanism: null,
  }));
  const derivations = input.derivationRequirements.map((item) => ({
    ...structuredClone(item),
    parentVariableRefs: uniqueSorted([...item.parentVariableRefs]),
    provenanceRefs: uniqueSorted([...item.provenanceRefs]),
    owner: "STUDY_DATA_CDM" as const,
    executionStatus: "NOT_EXECUTED_REQUIREMENT_ONLY" as const,
  }));
  const biospecimens = input.biospecimenRepresentations.map((item) => ({
    ...structuredClone(item),
    sourceRefs: uniqueSorted([...item.sourceRefs]),
    owner: "BIOSPECIMEN_MATERIAL" as const,
    representedAsVariable: false as const,
  }));
  const datasetProjections: CanonicalStudyDataResult["datasetProjections"] = variables.length ? [{
    projectionId: `cdm-dataset-projection:${logicalDigest({ project: input.projectSnapshot.snapshotDigest, variables: variables.map((item) => item.versionRef), occasions: occasions.map((item) => item.versionRef) })}`,
    variableRefs: variables.map((item) => item.stableId),
    expectedOccasionRefs: occasions.map((item) => item.stableId),
    occurrenceRefs: variableOccurrences.map((item) => item.occurrenceId),
    sourceOfTruth: false,
    materialized: false,
  }] : [];
  const informationNeeds: CanonicalStudyDataResult["informationNeeds"] = variables.length ? [] : [{
    needId: `cdm-need:${logicalDigest({ input: input.inputId, reason: "CANONICAL_VARIABLE_REQUIRED" })}`,
    informationNeeded: "Au moins une variable canonique adoptée par le Research Project.",
    reason: "CDM ne peut pas inventer le sens scientifique d’une variable.",
    targetOwner: "RESEARCH_PROJECT",
    sourceRefs: [input.projectSnapshot.snapshotDigest],
    status: "OPEN_NOT_RESOLVED",
  }];
  const downstreamHandoffs: CanonicalStudyDataResult["downstreamHandoffs"] = variables.length ? [{
    handoffId: `cdm-handoff:${logicalDigest({ input: input.inputId, target: "DATA_MANAGEMENT" })}`,
    sourceOwner: "STUDY_DATA_CDM",
    targetOwner: "DATA_MANAGEMENT",
    purpose: "Définir les exigences de collecte, de contrôle et de cycle de vie à partir de la représentation canonique.",
    informationNeeded: ["stratégie de collecte", "sources et ingestion", "contrôles qualité", "conditions de release"],
    provenanceRefs: uniqueSorted([input.projectSnapshot.snapshotDigest, ...variableRepresentations.map((item) => item.representationId)]),
    status: "PROPOSED_NOT_EXECUTED",
    ownershipTransferred: false,
    projectWriteAuthorized: false,
  }] : [];
  const material: Omit<CanonicalStudyDataResult, "resultDigest"> = {
    contract: CANONICAL_STUDY_DATA_RESULT_CONTRACT,
    contractVersion: CANONICAL_STUDY_DATA_RUNTIME_VERSION,
    owner: "STUDY_DATA_CDM",
    capabilityId: "STUDY_DATA_PLANNING",
    resultId: `cdm-result:${logicalDigest({ input: input.inputId, snapshot: input.projectSnapshot.snapshotDigest })}`,
    resultVersion: CANONICAL_STUDY_DATA_RUNTIME_VERSION,
    resultStatus: variables.length ? "CANONICAL_REPRESENTATION_READY" : "INFORMATION_REQUIRED",
    sourceProject: {
      projectId: input.projectId,
      projectVersion: input.projectVersion,
      projectDigest: input.projectDigest,
      snapshotDigest: input.projectSnapshot.snapshotDigest,
    },
    sourceNeed: structuredClone(input.selectedNeed),
    sourceOwnerLineage: structuredClone(input.upstreamOwnerInputs),
    variableRepresentations,
    expectedOccasionRepresentations,
    variableOccurrences,
    derivations,
    biospecimens,
    datasetProjections,
    informationNeeds,
    downstreamHandoffs,
    limitations: [
      "Représentation canonique bornée ; aucune donnée réelle n’est créée ni persistée.",
      "Les stratégies analytiques de données manquantes restent sous ownership Biostatistics.",
    ],
    unresolvedQuestions: informationNeeds.map((item) => item.needId),
    projectWriteAuthorized: false,
    projectOwnershipTransferred: false,
    projectObjectsRedefined: false,
    expectedOccasionCreatedOccurrence: false,
    datasetIsSourceOfTruth: false,
    analyticalMissingnessStrategyCreated: false,
    realizedDataFabricated: false,
  };
  if (stableStringify(input.projectSnapshot) !== before) throw new Error("CDM_RUNTIME_MUTATED_PROJECT_SNAPSHOT");
  return Object.freeze({ ...material, resultDigest: buildDigest(material) });
};

export const validateCanonicalStudyDataResult = (
  input: Readonly<CanonicalStudyDataRuntimeInput>,
  result: Readonly<CanonicalStudyDataResult>,
) => {
  const { resultDigest: _digest, ...material } = result;
  const findings = [
    ...(result.contract !== CANONICAL_STUDY_DATA_RESULT_CONTRACT ? ["CDM_RESULT_CONTRACT_INVALID"] : []),
    ...(result.owner !== "STUDY_DATA_CDM" || result.capabilityId !== "STUDY_DATA_PLANNING" ? ["CDM_RESULT_OWNER_INVALID"] : []),
    ...(result.sourceProject.projectId !== input.projectId
      || result.sourceProject.projectVersion !== input.projectVersion
      || result.sourceProject.projectDigest !== input.projectDigest
      || result.sourceProject.snapshotDigest !== input.projectSnapshot.snapshotDigest ? ["CDM_RESULT_PROJECT_BINDING_INVALID"] : []),
    ...(result.resultDigest !== buildDigest(material) ? ["CDM_RESULT_DIGEST_INVALID"] : []),
    ...(result.projectWriteAuthorized !== false
      || result.projectOwnershipTransferred !== false
      || result.projectObjectsRedefined !== false
      || result.expectedOccasionCreatedOccurrence !== false
      || result.datasetIsSourceOfTruth !== false
      || result.analyticalMissingnessStrategyCreated !== false
      || result.realizedDataFabricated !== false ? ["CDM_RESULT_BOUNDARY_INVALID"] : []),
    ...(result.variableOccurrences.some((item) => item.syntheticFixture !== true) ? ["CDM_NON_SYNTHETIC_OCCURRENCE_FORBIDDEN"] : []),
  ];
  return Object.freeze({ status: findings.length ? "FAIL" as const : "PASS" as const, findings: Object.freeze(findings) });
};

export const canonicalStudyDataResultMatchesSnapshot = (
  result: Readonly<CanonicalStudyDataResult>,
  snapshot: Readonly<ProjectContextSnapshot>,
) => result.sourceProject.projectId === snapshot.sourceProjectRef
  && result.sourceProject.projectVersion === snapshot.sourceProjectVersion
  && result.sourceProject.projectDigest === snapshot.sourceProjectDigest
  && result.sourceProject.snapshotDigest === snapshot.snapshotDigest;
