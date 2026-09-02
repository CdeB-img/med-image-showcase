import { logicalDigest } from "@/features/knowledge-engine";
import type { ProjectContextSnapshot } from "@/features/research-project-construction/canonical-project-backbone";
import type { SpecializedOwnerResult } from "@/features/research-project-construction/specialized-owner-handoff";
import type { ScientificThinkingOutput } from "@/features/scientific-thinking";
import type { StudyDesignProposalContribution } from "@/features/study-design";
import {
  OBSERVABILITY_MEASUREMENT_RESULT_CONTRACT,
  OBSERVABILITY_MEASUREMENT_RUNTIME_CONTRACT,
  OBSERVABILITY_MEASUREMENT_RUNTIME_VERSION,
  type BiomarkerRoleCandidate,
  type BiomarkerRoleDeclaration,
  type MeasurementDefinitionCandidate,
  type MeasurementDefinitionDeclaration,
  type ObservablePropertyCandidate,
  type ObservablePropertyDeclaration,
  type ObservabilityDownstreamHandoff,
  type ObservabilityInformationNeed,
  type ObservabilityMeasurementResult,
  type ObservabilityMeasurementRuntimeInput,
  type ObservabilityRelationship,
  type ObservabilityScientificConcept,
  type ObservabilityUpstreamOwnerInput,
  type ObservabilityValidationResult,
} from "./contracts";

const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach((nested) => deepFreeze(nested));
    Object.freeze(value);
  }
  return value;
};

const snapshotIsValid = (snapshot: Readonly<ProjectContextSnapshot>) => {
  const detached = structuredClone(snapshot);
  const { snapshotDigest, ...material } = detached;
  return snapshot.contract === "PROJECT_CONTEXT_SNAPSHOT"
    && snapshot.contractVersion === "0.3.0"
    && snapshot.owner === "RESEARCH_PROJECT"
    && snapshot.readOnly === true
    && logicalDigest(material) === snapshotDigest;
};

const resultMaterial = (result: ObservabilityMeasurementResult) => {
  const { resultDigest: _resultDigest, ...material } = result;
  return material;
};

const conceptKind = (type: ProjectContextSnapshot["objects"][number]["type"]): ObservabilityScientificConcept["kind"] | null => {
  if (["SCIENTIFIC_QUESTION", "OBJECTIVE", "HYPOTHESIS", "SCIENTIFIC_MODEL", "ENDPOINT"].includes(type)) {
    return type as ObservabilityScientificConcept["kind"];
  }
  return null;
};

const upstreamDigest = (result: Readonly<SpecializedOwnerResult>) => {
  const payload = result.nativePayload as Record<string, unknown> | null;
  const digest = payload?.outputDigest ?? payload?.proposalDigest ?? payload?.resultDigest;
  return typeof digest === "string" ? digest : logicalDigest(result.nativePayload);
};

const upstreamInformation = (result: Readonly<SpecializedOwnerResult>) => {
  const payload = result.nativePayload as ScientificThinkingOutput | StudyDesignProposalContribution | null;
  if (!payload || typeof payload !== "object" || !("downstreamHandoffs" in payload) || !Array.isArray(payload.downstreamHandoffs)) return [];
  return payload.downstreamHandoffs.flatMap((handoff) => handoff.targetOwner === "OBSERVABILITY_MEASUREMENT"
    ? [...handoff.informationNeeded]
    : []);
};

export const buildObservabilityMeasurementInput = (input: {
  projectSnapshot: Readonly<ProjectContextSnapshot>;
  upstreamOwnerResults?: readonly Readonly<SpecializedOwnerResult>[];
  observablePropertyDeclarations?: readonly ObservablePropertyDeclaration[];
  measurementDefinitionDeclarations?: readonly MeasurementDefinitionDeclaration[];
  biomarkerRoleDeclarations?: readonly BiomarkerRoleDeclaration[];
  purpose?: string;
}): ObservabilityMeasurementRuntimeInput => {
  if (!snapshotIsValid(input.projectSnapshot)) throw new Error("OBS_SOURCE_PROJECT_SNAPSHOT_INVALID");
  const upstreamOwnerResults = input.upstreamOwnerResults ?? [];
  const upstreamOwnerInputs: ObservabilityUpstreamOwnerInput[] = upstreamOwnerResults.map((result) => {
    if (!["SCIENTIFIC_THINKING", "STUDY_DESIGN"].includes(result.owner)
      || result.sourceProjectRef !== input.projectSnapshot.sourceProjectRef
      || result.sourceProjectVersion !== input.projectSnapshot.sourceProjectVersion
      || result.sourceProjectDigest !== input.projectSnapshot.sourceProjectDigest
      || result.sourceSnapshotDigest !== input.projectSnapshot.snapshotDigest
      || result.projectWriteAuthorized !== false) {
      throw new Error("OBS_UPSTREAM_OWNER_RESULT_PROJECT_MISMATCH");
    }
    return {
      owner: result.owner as ObservabilityUpstreamOwnerInput["owner"],
      resultId: result.resultId,
      resultVersion: result.resultVersion,
      resultDigest: upstreamDigest(result),
      informationNeeded: unique(upstreamInformation(result)),
      provenanceRefs: unique([result.resultId, ...result.provenance]),
      ownershipTransferred: false,
    };
  });
  const scientificConcepts = input.projectSnapshot.objects.flatMap((object): ObservabilityScientificConcept[] => {
    const kind = conceptKind(object.type);
    return kind ? [{
      conceptRef: object.stableId,
      label: object.content,
      kind,
      epistemicState: object.epistemicState === "WITHHELD" ? "UNKNOWN" : object.epistemicState,
      provenanceRefs: unique([object.stableId, object.versionRef, object.sourceContributionRef, ...object.sourceItemRefs]),
    }] : [];
  });
  const projectVariables = input.projectSnapshot.objects.filter((object) => object.type === "CANONICAL_VARIABLE").map((object) => ({
    variableRef: object.stableId,
    label: object.content,
    epistemicState: object.epistemicState === "WITHHELD" ? "UNKNOWN" as const : object.epistemicState,
    provenanceRefs: unique([object.stableId, object.versionRef, object.sourceContributionRef, ...object.sourceItemRefs]),
  }));
  const modalityContext = input.projectSnapshot.objects.filter((object) => object.type === "IMAGING_MODALITY").map((object) => ({
    modalityRef: object.stableId,
    label: object.content,
    provenanceRefs: unique([object.stableId, object.versionRef, object.sourceContributionRef, ...object.sourceItemRefs]),
  }));
  const propertyDeclarations = [...(input.observablePropertyDeclarations ?? [])];
  const measurementDeclarations = [...(input.measurementDefinitionDeclarations ?? [])];
  const roleDeclarations = [...(input.biomarkerRoleDeclarations ?? [])];
  const sourceProvenanceRefs = unique([
    input.projectSnapshot.snapshotDigest,
    ...input.projectSnapshot.objects.flatMap((object) => [object.stableId, object.versionRef]),
    ...upstreamOwnerInputs.flatMap((ownerInput) => ownerInput.provenanceRefs),
    ...propertyDeclarations.flatMap((item) => item.provenanceRefs),
    ...measurementDeclarations.flatMap((item) => item.provenanceRefs),
    ...roleDeclarations.flatMap((item) => item.provenanceRefs),
  ]);
  return {
    contract: OBSERVABILITY_MEASUREMENT_RUNTIME_CONTRACT,
    contractVersion: OBSERVABILITY_MEASUREMENT_RUNTIME_VERSION,
    inputId: `observability-input:${logicalDigest({
      project: input.projectSnapshot.sourceProjectDigest,
      snapshot: input.projectSnapshot.snapshotDigest,
      purpose: input.purpose ?? null,
      upstream: upstreamOwnerInputs.map((item) => item.resultDigest),
      properties: propertyDeclarations,
      measurements: measurementDeclarations,
      roles: roleDeclarations,
    })}`,
    projectId: input.projectSnapshot.sourceProjectRef,
    projectVersion: input.projectSnapshot.sourceProjectVersion,
    projectDigest: input.projectSnapshot.sourceProjectDigest,
    projectSnapshot: structuredClone(input.projectSnapshot),
    scientificConcepts,
    projectVariables,
    modalityContext,
    upstreamOwnerInputs,
    observablePropertyDeclarations: propertyDeclarations,
    measurementDefinitionDeclarations: measurementDeclarations,
    biomarkerRoleDeclarations: roleDeclarations,
    constraints: unique(input.projectSnapshot.objects.filter((object) => object.type === "CONSTRAINT").map((object) => object.content)),
    unknowns: unique([
      ...input.projectSnapshot.objects.filter((object) => ["UNKNOWN", "WITHHELD"].includes(object.epistemicState)).map((object) => `PROJECT_OBJECT_UNRESOLVED:${object.stableId}`),
      ...input.projectSnapshot.openIssues.map((issue) => `${issue.kind}:${issue.issueRef}:${issue.reason}`),
    ]),
    sourceProvenanceRefs,
    projectWriteAuthorized: false,
  };
};

const relation = (input: {
  type: ObservabilityRelationship["type"];
  sourceRef: string;
  targetRef: string;
  provenanceRefs: readonly string[];
}): ObservabilityRelationship => ({
  relationshipId: `observability-relationship:${logicalDigest(input)}`,
  ...input,
  provenanceRefs: unique(input.provenanceRefs),
});

const informationNeed = (input: {
  code: string;
  informationNeeded: string;
  scientificReason: string;
  sourceRefs: readonly string[];
}): ObservabilityInformationNeed => ({
  needId: `observability-information-need:${logicalDigest(input)}`,
  informationNeeded: input.informationNeeded,
  scientificReason: input.scientificReason,
  targetOwner: "QUERY_NAVIGATION",
  sourceRefs: unique(input.sourceRefs),
  status: "OPEN_NOT_RESOLVED",
});

const handoff = (input: {
  resultId: string;
  targetOwner: ObservabilityDownstreamHandoff["targetOwner"];
  capabilityId: ObservabilityDownstreamHandoff["capabilityId"];
  measurementRefs: readonly string[];
  purpose: string;
  informationNeeded: readonly string[];
  provenanceRefs: readonly string[];
}): ObservabilityDownstreamHandoff => ({
  handoffId: `observability-handoff:${logicalDigest(input)}`,
  sourceOwner: "OBSERVABILITY_MEASUREMENT",
  targetOwner: input.targetOwner,
  capabilityId: input.capabilityId,
  sourceResultRef: input.resultId,
  sourceMeasurementRefs: unique(input.measurementRefs),
  purpose: input.purpose,
  informationNeeded: unique(input.informationNeeded),
  provenanceRefs: unique(input.provenanceRefs),
  status: "PROPOSED_NOT_EXECUTED",
  ownershipTransferred: false,
  projectWriteAuthorized: false,
});

export const validateObservabilityMeasurementResult = (
  input: Readonly<ObservabilityMeasurementRuntimeInput>,
  result: Readonly<ObservabilityMeasurementResult>,
): ObservabilityValidationResult => {
  const findings: { code: string; path: string; message: string }[] = [];
  const add = (code: string, path: string, message: string) => findings.push({ code, path, message });
  if (input.contract !== OBSERVABILITY_MEASUREMENT_RUNTIME_CONTRACT
    || input.contractVersion !== OBSERVABILITY_MEASUREMENT_RUNTIME_VERSION
    || input.projectWriteAuthorized !== false
    || !snapshotIsValid(input.projectSnapshot)
    || input.projectId !== input.projectSnapshot.sourceProjectRef
    || input.projectVersion !== input.projectSnapshot.sourceProjectVersion
    || input.projectDigest !== input.projectSnapshot.sourceProjectDigest) {
    add("INPUT_PROJECT_BINDING_INVALID", "input", "OBS input must bind to one exact read-only Project snapshot.");
  }
  if (result.contract !== OBSERVABILITY_MEASUREMENT_RESULT_CONTRACT
    || result.contractVersion !== OBSERVABILITY_MEASUREMENT_RUNTIME_VERSION
    || result.owner !== "OBSERVABILITY_MEASUREMENT"
    || result.capabilityId !== "OBSERVABILITY_QUALIFICATION") {
    add("RESULT_CONTRACT_INVALID", "result.contract", "OBS result must retain its governed owner and capability contract.");
  }
  if (result.sourceProject.projectId !== input.projectId
    || result.sourceProject.projectVersion !== input.projectVersion
    || result.sourceProject.projectDigest !== input.projectDigest
    || result.sourceProject.snapshotDigest !== input.projectSnapshot.snapshotDigest) {
    add("SOURCE_PROJECT_MISMATCH", "result.sourceProject", "OBS result source identity must match the exact consumed Project snapshot.");
  }
  if (result.projectWriteAuthorized !== false || result.projectOwnershipTransferred !== false || result.candidateIsAdopted !== false || result.humanDecisionRequired !== true) {
    add("PROJECT_BOUNDARY_INVALID", "result", "OBS cannot write, adopt, or take ownership of Project state.");
  }
  const conceptRefs = new Set(input.scientificConcepts.map((item) => item.conceptRef));
  const propertyRefs = new Set(result.observableProperties.map((item) => item.propertyRef));
  const measurementRefs = new Set(result.measurementDefinitions.map((item) => item.measurementRef));
  if (result.observableProperties.some((item) => !conceptRefs.has(item.sourceConceptRef) || item.candidateStatus !== "PROPOSED_NOT_ADOPTED" || item.projectWriteAuthorized !== false)) {
    add("PROPERTY_SOURCE_OR_BOUNDARY_INVALID", "result.observableProperties", "Each ObservableProperty must cite a supplied concept and remain non-adopted.");
  }
  if (result.measurementDefinitions.some((item) => !propertyRefs.has(item.propertyRef) || item.candidateStatus !== "PROPOSED_NOT_ADOPTED" || item.projectWriteAuthorized !== false)) {
    add("MEASUREMENT_PROPERTY_OR_BOUNDARY_INVALID", "result.measurementDefinitions", "Each MeasurementDefinition must cite a supplied ObservableProperty and remain non-adopted.");
  }
  if (result.biomarkerRoles.some((item) => !measurementRefs.has(item.measurementRef) || item.candidateStatus !== "PROPOSED_NOT_ADOPTED" || item.projectWriteAuthorized !== false)) {
    add("BIOMARKER_ROLE_MEASUREMENT_OR_BOUNDARY_INVALID", "result.biomarkerRoles", "Each BiomarkerRole must cite a supplied MeasurementDefinition and remain non-adopted.");
  }
  if (result.measurementDefinitions.some((item) => /bssfp|slice thickness|field strength|scanner model|reconstruction|contouring|temporal resolution/i.test(`${item.label} ${item.operationalDefinition}`))) {
    add("IMAGING_IMPLEMENTATION_LEAK", "result.measurementDefinitions", "OBS cannot define imaging acquisition, reconstruction, contouring, or QC implementation.");
  }
  if (result.downstreamHandoffs.some((item) => item.status !== "PROPOSED_NOT_EXECUTED" || item.ownershipTransferred !== false || item.projectWriteAuthorized !== false)) {
    add("HANDOFF_BOUNDARY_INVALID", "result.downstreamHandoffs", "OBS downstream handoffs must remain unexecuted and non-authoritative.");
  }
  if (result.resultStatus === "INFORMATION_REQUIRED" && result.informationNeeds.length === 0) add("INFORMATION_REQUIRED_WITHOUT_NEED", "result.informationNeeds", "Insufficient context must expose a structured information need.");
  if (logicalDigest(resultMaterial(result as ObservabilityMeasurementResult)) !== result.resultDigest) add("RESULT_DIGEST_INVALID", "result.resultDigest", "OBS result digest does not match its canonical material.");
  return { status: findings.length ? "BLOCKED" : "PASS", findings };
};

export const executeObservabilityMeasurementRuntime = (
  input: Readonly<ObservabilityMeasurementRuntimeInput>,
): Readonly<ObservabilityMeasurementResult> => {
  if (input.contract !== OBSERVABILITY_MEASUREMENT_RUNTIME_CONTRACT
    || input.contractVersion !== OBSERVABILITY_MEASUREMENT_RUNTIME_VERSION
    || input.projectWriteAuthorized !== false
    || !snapshotIsValid(input.projectSnapshot)
    || input.projectId !== input.projectSnapshot.sourceProjectRef
    || input.projectVersion !== input.projectSnapshot.sourceProjectVersion
    || input.projectDigest !== input.projectSnapshot.sourceProjectDigest) {
    throw new Error("OBS_INPUT_CONTRACT_OR_PROJECT_BINDING_INVALID");
  }
  const properties: ObservablePropertyCandidate[] = input.observablePropertyDeclarations.map((item) => ({
    ...structuredClone(item), candidateStatus: "PROPOSED_NOT_ADOPTED", projectWriteAuthorized: false,
  }));
  const measurements: MeasurementDefinitionCandidate[] = input.measurementDefinitionDeclarations.map((item) => ({
    ...structuredClone(item), candidateStatus: "PROPOSED_NOT_ADOPTED", projectWriteAuthorized: false,
  }));
  const declaredRoles: BiomarkerRoleCandidate[] = input.biomarkerRoleDeclarations.map((item) => ({
    ...structuredClone(item), candidateStatus: "PROPOSED_NOT_ADOPTED", projectWriteAuthorized: false,
  }));
  const declaredMeasurementRefs = new Set(declaredRoles.map((item) => item.measurementRef));
  const roles: BiomarkerRoleCandidate[] = [
    ...declaredRoles,
    ...measurements.filter((item) => !declaredMeasurementRefs.has(item.measurementRef)).map((item) => ({
      roleRef: `biomarker-role-unknown:${logicalDigest({ measurement: item.measurementRef })}`,
      measurementRef: item.measurementRef,
      role: "UNKNOWN" as const,
      rationale: "La définition de mesure ne suffit pas à établir son rôle scientifique dans ce projet.",
      limitations: ["BIOMARKER_ROLE_NOT_ESTABLISHED"],
      provenanceRefs: unique(item.provenanceRefs),
      candidateStatus: "PROPOSED_NOT_ADOPTED" as const,
      projectWriteAuthorized: false as const,
    })),
  ];
  const resultId = `observability-result:${logicalDigest({ input: input.inputId, runtime: OBSERVABILITY_MEASUREMENT_RUNTIME_VERSION })}`;
  const relationships: ObservabilityRelationship[] = [
    ...properties.map((item) => relation({ type: "CONCEPT_OPERATIONALIZED_BY_PROPERTY", sourceRef: item.sourceConceptRef, targetRef: item.propertyRef, provenanceRefs: item.provenanceRefs })),
    ...measurements.map((item) => relation({ type: "PROPERTY_MEASURED_BY_DEFINITION", sourceRef: item.propertyRef, targetRef: item.measurementRef, provenanceRefs: item.provenanceRefs })),
    ...roles.map((item) => relation({ type: "MEASUREMENT_HAS_PROPOSED_BIOMARKER_ROLE", sourceRef: item.measurementRef, targetRef: item.roleRef, provenanceRefs: item.provenanceRefs })),
  ];
  const informationNeeds: ObservabilityInformationNeed[] = [];
  if (!properties.length) informationNeeds.push(informationNeed({
    code: input.projectVariables.length ? "PROJECT_VARIABLE_NOT_OBSERVABLE_PROPERTY" : "OBSERVABLE_PROPERTY_NOT_ESTABLISHED",
    informationNeeded: input.projectVariables.length
      ? "Préciser quelle propriété observable est visée par la variable de projet, sans assimiler la variable à sa définition de mesure."
      : "Préciser quelle propriété observable du phénomène permettrait de confronter la question scientifique.",
    scientificReason: "Un concept scientifique ou une CanonicalVariable ne définit pas à lui seul une ObservableProperty.",
    sourceRefs: unique([...input.scientificConcepts.map((item) => item.conceptRef), ...input.projectVariables.map((item) => item.variableRef)]),
  }));
  if (properties.length && !measurements.length) informationNeeds.push(informationNeed({
    code: "MEASUREMENT_DEFINITION_NOT_ESTABLISHED",
    informationNeeded: "Préciser les définitions de mesure défendables pour la propriété observable et les exigences permettant de les comparer.",
    scientificReason: "Une ObservableProperty n’établit ni une méthode de mesure ni une CanonicalVariable de Project.",
    sourceRefs: properties.map((item) => item.propertyRef),
  }));
  const imagingMeasurements = measurements.filter((item) => item.domain === "IMAGING");
  const quantitativeMeasurements = measurements.filter((item) => item.valueNature !== "UNKNOWN");
  const downstreamHandoffs: ObservabilityDownstreamHandoff[] = [
    ...(imagingMeasurements.length || (input.modalityContext.length && properties.length) ? [handoff({
      resultId,
      targetOwner: "IMAGING",
      capabilityId: "IMAGING_STUDY_DESIGN",
      measurementRefs: imagingMeasurements.map((item) => item.measurementRef),
      purpose: "Spécialiser la réalisation d’imagerie d’un besoin de mesure qualifié par OBS.",
      informationNeeded: ["Définir acquisition, qualité, lecture, faisabilité et limites spécifiques à l’imagerie."],
      provenanceRefs: unique([...input.modalityContext.flatMap((item) => item.provenanceRefs), ...imagingMeasurements.flatMap((item) => item.provenanceRefs)]),
    })] : []),
    ...(quantitativeMeasurements.length ? [handoff({
      resultId,
      targetOwner: "BIOSTATISTICS",
      capabilityId: "BIOSTATISTICS_PLANNING",
      measurementRefs: quantitativeMeasurements.map((item) => item.measurementRef),
      purpose: "Transmettre la nature des mesures sans choisir l’estimand, le modèle ni le dimensionnement.",
      informationNeeded: unique(quantitativeMeasurements.map((item) => `${item.measurementRef}:${item.valueNature}`)),
      provenanceRefs: quantitativeMeasurements.flatMap((item) => item.provenanceRefs),
    })] : []),
  ];
  const assumptions = unique([...properties.flatMap((item) => item.assumptions), ...measurements.flatMap((item) => item.assumptions)]);
  const limitations = unique([
    ...properties.flatMap((item) => item.limitations),
    ...measurements.flatMap((item) => item.limitations),
    ...roles.flatMap((item) => item.limitations),
    ...(input.upstreamOwnerInputs.length ? ["UPSTREAM_OWNER_HANDOFFS_CONSUMED_WITHOUT_OWNERSHIP_TRANSFER"] : []),
    "OBS_RESULT_IS_NOT_PROJECT_TRUTH",
  ]);
  const uncertainty = unique([...input.unknowns, ...properties.flatMap((item) => item.uncertainty), ...measurements.flatMap((item) => item.uncertainty)]);
  const status = properties.length || measurements.length ? "CANDIDATES_PROPOSED" as const : "INFORMATION_REQUIRED" as const;
  const base: ObservabilityMeasurementResult = {
    contract: OBSERVABILITY_MEASUREMENT_RESULT_CONTRACT,
    contractVersion: OBSERVABILITY_MEASUREMENT_RUNTIME_VERSION,
    owner: "OBSERVABILITY_MEASUREMENT",
    capabilityId: "OBSERVABILITY_QUALIFICATION",
    resultId,
    resultVersion: OBSERVABILITY_MEASUREMENT_RUNTIME_VERSION,
    resultDigest: "",
    resultStatus: status,
    sourceProject: { projectId: input.projectId, projectVersion: input.projectVersion, projectDigest: input.projectDigest, snapshotDigest: input.projectSnapshot.snapshotDigest },
    sourceConceptRefs: unique(input.scientificConcepts.map((item) => item.conceptRef)),
    projectVariableRefs: unique(input.projectVariables.map((item) => item.variableRef)),
    observableProperties: properties,
    measurementDefinitions: measurements,
    biomarkerRoles: roles,
    relationships,
    informationNeeds,
    downstreamHandoffs,
    assumptions,
    limitations,
    uncertainty,
    provenanceRefs: unique([input.inputId, ...input.sourceProvenanceRefs]),
    epistemicStatus: status === "INFORMATION_REQUIRED" ? "INSUFFICIENT_CONTEXT_UNKNOWN_PRESERVED" : "PROPOSAL_ONLY",
    validation: { status: "PASS", findings: [] },
    humanDecisionRequired: true,
    projectWriteAuthorized: false,
    projectOwnershipTransferred: false,
    candidateIsAdopted: false,
  };
  const result = { ...base, resultDigest: logicalDigest(resultMaterial(base)) };
  const validation = validateObservabilityMeasurementResult(input, result);
  if (validation.status === "BLOCKED") throw new Error(`OBS_RESULT_INVALID:${validation.findings.map((finding) => finding.code).join(",")}`);
  return deepFreeze(result);
};
