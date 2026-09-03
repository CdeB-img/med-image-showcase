import { logicalDigest, stableStringify, uniqueSorted } from "@/features/knowledge-engine/canonical";
import type { ProjectContextSnapshot } from "@/features/research-project-construction/canonical-project-backbone";
import type { CanonicalStudyDataResult } from "./canonical-study-data-runtime";

export const DATA_MANAGEMENT_REASONING_RUNTIME_CONTRACT = "DATA_MANAGEMENT_REASONING_RUNTIME" as const;
export const DATA_MANAGEMENT_REASONING_RESULT_CONTRACT = "DATA_MANAGEMENT_REASONING_RESULT" as const;
export const DATA_MANAGEMENT_REASONING_RUNTIME_VERSION = "1.0.0" as const;

export type SyntheticDataFinding = {
  syntheticFixture: true;
  findingId: string;
  occurrenceRef: string;
  controlRef: string;
  status: "OPEN" | "RESOLVED" | "ACCEPTED_WITH_JUSTIFICATION";
  evidenceRefs: readonly string[];
};

export type SyntheticDataQuery = {
  syntheticFixture: true;
  queryId: string;
  findingRef: string;
  status: "OPEN" | "ANSWERED" | "CLOSED";
  openedByRef: string;
  openedAt: string;
  answerRef: string | null;
  closedAt: string | null;
};

export type SyntheticDataCorrection = {
  syntheticFixture: true;
  correctionId: string;
  occurrenceRef: string;
  originalState: unknown;
  correctedState: unknown;
  reason: string;
  actorRef: string;
  mandateRef: string;
  correctedAt: string;
  sourceRefs: readonly string[];
};

export type SyntheticDataReconciliation = {
  syntheticFixture: true;
  reconciliationId: string;
  sourceRefs: readonly string[];
  differences: readonly string[];
  deterministicRuleRef: string | null;
  scientificAmbiguity: boolean;
  status: "ALIGNED" | "DIFFERENCE_RETAINED" | "HUMAN_REVIEW_REQUIRED";
};

export type SyntheticDataLifecycle = {
  syntheticFixture: true;
  snapshots: readonly {
    snapshotId: string;
    snapshotVersion: string;
    occurrenceRefs: readonly string[];
    createdAt: string;
    digest: string;
  }[];
  freezes: readonly {
    freezeId: string;
    snapshotRef: string;
    actorRef: string;
    mandateRef: string;
    reason: string;
    frozenAt: string;
  }[];
  locks: readonly {
    lockId: string;
    snapshotRef: string;
    actorRef: string;
    mandateRef: string;
    reason: string;
    lockedAt: string;
  }[];
  unlockAttempts: readonly {
    unlockId: string;
    lockRef: string;
    actorRef: string | null;
    mandateRef: string | null;
    reason: string | null;
    requestedAt: string;
  }[];
  releases: readonly {
    releaseId: string;
    releaseVersion: string;
    snapshotRef: string;
    actorRef: string;
    mandateRef: string;
    releasedAt: string;
    openFindingRefs: readonly string[];
  }[];
  postReleaseCorrections: readonly {
    changeId: string;
    priorReleaseRef: string;
    correctionRef: string;
    successorSnapshotRef: string;
    successorReleaseRef: string | null;
    changedAt: string;
  }[];
};

export type DataManagementReasoningRuntimeInput = {
  contract: typeof DATA_MANAGEMENT_REASONING_RUNTIME_CONTRACT;
  contractVersion: typeof DATA_MANAGEMENT_REASONING_RUNTIME_VERSION;
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
  cdmResult: Readonly<CanonicalStudyDataResult>;
  upstreamOwnerInputs: readonly {
    sourceOwner: "STUDY_DATA_CDM" | "IMAGING" | "BIOSTATISTICS";
    resultRef: string;
    resultVersion: string;
    resultDigest: string;
    purpose: string;
    requirementRefs: readonly string[];
    provenanceRefs: readonly string[];
    ownershipTransferred: false;
  }[];
  findings: readonly SyntheticDataFinding[];
  queries: readonly SyntheticDataQuery[];
  corrections: readonly SyntheticDataCorrection[];
  reconciliations: readonly SyntheticDataReconciliation[];
  lifecycle: SyntheticDataLifecycle | null;
  projectWriteAuthorized: false;
};

export type DataManagementReasoningResult = {
  contract: typeof DATA_MANAGEMENT_REASONING_RESULT_CONTRACT;
  contractVersion: typeof DATA_MANAGEMENT_REASONING_RUNTIME_VERSION;
  owner: "DATA_MANAGEMENT";
  capabilityId: "DATA_MANAGEMENT_PLANNING";
  resultId: string;
  resultVersion: typeof DATA_MANAGEMENT_REASONING_RUNTIME_VERSION;
  resultDigest: string;
  resultStatus: "OPERATIONAL_REQUIREMENTS_READY" | "INFORMATION_REQUIRED" | "HUMAN_REVIEW_REQUIRED";
  sourceProject: { projectId: string; projectVersion: string; projectDigest: string; snapshotDigest: string };
  sourceCdmResult: { resultId: string; resultVersion: string; resultDigest: string };
  sourceNeed: DataManagementReasoningRuntimeInput["selectedNeed"];
  sourceOwnerLineage: DataManagementReasoningRuntimeInput["upstreamOwnerInputs"];
  collectionRequirements: readonly {
    requirementId: string;
    canonicalVariableRef: string;
    expectedOccasionRefs: readonly string[];
    logicalFieldOnly: true;
    realCrfCreated: false;
    scientificMeaningOwner: "RESEARCH_PROJECT";
  }[];
  sourceAndIngestionRequirements: readonly {
    requirementId: string;
    canonicalVariableRef: string;
    sourceMandateRequired: true;
    ingestionExecuted: false;
    provenanceRequired: true;
    imagingMetadataRefs: readonly string[];
  }[];
  qualityControls: readonly {
    controlId: string;
    kind: "STRUCTURAL" | "CONTEXTUAL";
    targetRef: string;
    executionStatus: "NOT_EXECUTED_REQUIREMENT_ONLY";
  }[];
  findings: readonly SyntheticDataFinding[];
  queries: readonly SyntheticDataQuery[];
  corrections: readonly (SyntheticDataCorrection & {
    originalPreserved: true;
    correctionOverwritesOriginal: false;
  })[];
  reconciliations: readonly (SyntheticDataReconciliation & {
    scientificTruthInferred: false;
  })[];
  lifecycle: {
    snapshots: SyntheticDataLifecycle["snapshots"];
    freezes: SyntheticDataLifecycle["freezes"];
    locks: SyntheticDataLifecycle["locks"];
    unlockAttempts: readonly (SyntheticDataLifecycle["unlockAttempts"][number] & {
      status: "AUTHORIZED" | "REJECTED_UNAUTHORIZED";
    })[];
    releases: readonly (SyntheticDataLifecycle["releases"][number] & {
      releaseDigest: string;
      exactSnapshotBinding: true;
      immutable: true;
    })[];
    postReleaseCorrections: readonly (SyntheticDataLifecycle["postReleaseCorrections"][number] & {
      priorReleaseMutated: false;
    })[];
  };
  downstreamReadiness: readonly {
    readinessId: string;
    targetOwner: "BIOSTATISTICS";
    status: "RELEASED" | "REQUIRED_UNRESOLVED";
    releaseRef: string | null;
    releaseVersion: string | null;
    releaseDigest: string | null;
    openFindingRefs: readonly string[];
  }[];
  informationNeeds: readonly {
    needId: string;
    informationNeeded: string;
    reason: string;
    targetOwner: "RESEARCH_PROJECT" | "STUDY_DATA_CDM" | "OBSERVABILITY_MEASUREMENT" | "IMAGING" | "BIOSTATISTICS" | "HUMAN";
    sourceRefs: readonly string[];
    status: "OPEN_NOT_RESOLVED";
  }[];
  downstreamHandoffs: readonly {
    handoffId: string;
    sourceOwner: "DATA_MANAGEMENT";
    targetOwner: "BIOSTATISTICS" | "RESEARCH_PROJECT" | "STUDY_DATA_CDM" | "OBSERVABILITY_MEASUREMENT" | "IMAGING" | "HUMAN";
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
  cdmResultMutated: false;
  scientificMeaningRedefined: false;
  statisticalStrategySelected: false;
  analyticalMissingnessStrategyCreated: false;
  realizedDataFabricated: false;
  realOperationsExecuted: false;
};

const emptyLifecycle = (): DataManagementReasoningResult["lifecycle"] => ({
  snapshots: [], freezes: [], locks: [], unlockAttempts: [], releases: [], postReleaseCorrections: [],
});

const resultDigest = (result: Omit<DataManagementReasoningResult, "resultDigest">) => logicalDigest(result);

export const executeDataManagementReasoningRuntime = (
  input: Readonly<DataManagementReasoningRuntimeInput>,
): Readonly<DataManagementReasoningResult> => {
  if (input.contract !== DATA_MANAGEMENT_REASONING_RUNTIME_CONTRACT
    || input.contractVersion !== DATA_MANAGEMENT_REASONING_RUNTIME_VERSION) throw new Error("DATA_MANAGEMENT_RUNTIME_INPUT_CONTRACT_INVALID");
  if (input.projectId !== input.projectSnapshot.sourceProjectRef
    || input.projectVersion !== input.projectSnapshot.sourceProjectVersion
    || input.projectDigest !== input.projectSnapshot.sourceProjectDigest
    || input.projectWriteAuthorized !== false) throw new Error("DATA_MANAGEMENT_RUNTIME_PROJECT_BINDING_INVALID");
  if (input.cdmResult.sourceProject.projectId !== input.projectId
    || input.cdmResult.sourceProject.projectVersion !== input.projectVersion
    || input.cdmResult.sourceProject.projectDigest !== input.projectDigest
    || input.cdmResult.sourceProject.snapshotDigest !== input.projectSnapshot.snapshotDigest) throw new Error("DATA_MANAGEMENT_CDM_PROJECT_BINDING_INVALID");
  if (input.upstreamOwnerInputs.some((item) => item.ownershipTransferred !== false)) throw new Error("DATA_MANAGEMENT_UPSTREAM_OWNERSHIP_TRANSFER_FORBIDDEN");
  const projectBefore = stableStringify(input.projectSnapshot);
  const cdmBefore = stableStringify(input.cdmResult);
  const occurrenceRefs = new Set(input.cdmResult.variableOccurrences.map((item) => item.occurrenceId));
  const lifecycleInput = input.lifecycle;
  for (const item of [...input.findings, ...input.queries, ...input.corrections, ...input.reconciliations]) {
    if (item.syntheticFixture !== true) throw new Error("DATA_MANAGEMENT_NON_SYNTHETIC_OPERATION_FORBIDDEN");
  }
  if (lifecycleInput && lifecycleInput.syntheticFixture !== true) throw new Error("DATA_MANAGEMENT_NON_SYNTHETIC_LIFECYCLE_FORBIDDEN");
  input.findings.forEach((item) => {
    if (!occurrenceRefs.has(item.occurrenceRef)) throw new Error("DATA_MANAGEMENT_FINDING_OCCURRENCE_UNKNOWN");
  });
  const findingRefs = new Set(input.findings.map((item) => item.findingId));
  input.queries.forEach((item) => {
    if (!findingRefs.has(item.findingRef)) throw new Error("DATA_MANAGEMENT_QUERY_FINDING_UNKNOWN");
  });
  input.corrections.forEach((item) => {
    if (!occurrenceRefs.has(item.occurrenceRef) || !item.reason || !item.actorRef || !item.mandateRef) throw new Error("DATA_MANAGEMENT_CORRECTION_INVALID");
  });
  if (lifecycleInput) {
    const snapshotRefs = new Set(lifecycleInput.snapshots.map((item) => item.snapshotId));
    const lockRefs = new Set(lifecycleInput.locks.map((item) => item.lockId));
    const releaseRefs = new Set(lifecycleInput.releases.map((item) => item.releaseId));
    const correctionRefs = new Set(input.corrections.map((item) => item.correctionId));
    if (lifecycleInput.snapshots.some((item) => item.occurrenceRefs.some((ref) => !occurrenceRefs.has(ref)))) throw new Error("DATA_MANAGEMENT_SNAPSHOT_OCCURRENCE_UNKNOWN");
    if (lifecycleInput.freezes.some((item) => !snapshotRefs.has(item.snapshotRef))) throw new Error("DATA_MANAGEMENT_FREEZE_SNAPSHOT_UNKNOWN");
    if (lifecycleInput.locks.some((item) => !snapshotRefs.has(item.snapshotRef))) throw new Error("DATA_MANAGEMENT_LOCK_SNAPSHOT_UNKNOWN");
    if (lifecycleInput.unlockAttempts.some((item) => !lockRefs.has(item.lockRef))) throw new Error("DATA_MANAGEMENT_UNLOCK_LOCK_UNKNOWN");
    if (lifecycleInput.releases.some((item) => !snapshotRefs.has(item.snapshotRef))) throw new Error("DATA_MANAGEMENT_RELEASE_SNAPSHOT_UNKNOWN");
    if (lifecycleInput.postReleaseCorrections.some((item) => !releaseRefs.has(item.priorReleaseRef)
      || !correctionRefs.has(item.correctionRef)
      || !snapshotRefs.has(item.successorSnapshotRef)
      || (item.successorReleaseRef !== null && !releaseRefs.has(item.successorReleaseRef)))) throw new Error("DATA_MANAGEMENT_POST_RELEASE_LINEAGE_INVALID");
  }
  const collectionRequirements: DataManagementReasoningResult["collectionRequirements"] = input.cdmResult.variableRepresentations.map((variable) => ({
    requirementId: `dm-collection:${logicalDigest({ cdm: input.cdmResult.resultDigest, variable: variable.representationId })}`,
    canonicalVariableRef: variable.canonicalVariableRef,
    expectedOccasionRefs: input.cdmResult.expectedOccasionRepresentations
      .filter((item) => item.canonicalVariableRef === variable.canonicalVariableRef)
      .map((item) => item.expectedOccasionRef),
    logicalFieldOnly: true,
    realCrfCreated: false,
    scientificMeaningOwner: "RESEARCH_PROJECT",
  }));
  const imagingLineageRefs = uniqueSorted(input.upstreamOwnerInputs
    .filter((item) => item.sourceOwner === "IMAGING")
    .flatMap((item) => [item.resultRef, ...item.provenanceRefs]));
  const sourceAndIngestionRequirements: DataManagementReasoningResult["sourceAndIngestionRequirements"] = input.cdmResult.variableRepresentations.map((variable) => ({
    requirementId: `dm-ingestion:${logicalDigest({ cdm: input.cdmResult.resultDigest, variable: variable.representationId })}`,
    canonicalVariableRef: variable.canonicalVariableRef,
    sourceMandateRequired: true,
    ingestionExecuted: false,
    provenanceRequired: true,
    imagingMetadataRefs: imagingLineageRefs,
  }));
  const qualityControls: DataManagementReasoningResult["qualityControls"] = input.cdmResult.variableRepresentations.flatMap((variable) => ([
    {
      controlId: `dm-control:${logicalDigest({ variable: variable.representationId, kind: "STRUCTURAL" })}`,
      kind: "STRUCTURAL" as const,
      targetRef: variable.canonicalVariableRef,
      executionStatus: "NOT_EXECUTED_REQUIREMENT_ONLY" as const,
    },
    {
      controlId: `dm-control:${logicalDigest({ variable: variable.representationId, kind: "CONTEXTUAL" })}`,
      kind: "CONTEXTUAL" as const,
      targetRef: variable.canonicalVariableRef,
      executionStatus: "NOT_EXECUTED_REQUIREMENT_ONLY" as const,
    },
  ]));
  const findings = input.findings.map((item) => ({ ...structuredClone(item), evidenceRefs: uniqueSorted([...item.evidenceRefs]) }));
  const queries = structuredClone([...input.queries]);
  const corrections = input.corrections.map((item) => ({
    ...structuredClone(item),
    sourceRefs: uniqueSorted([...item.sourceRefs]),
    originalPreserved: true as const,
    correctionOverwritesOriginal: false as const,
  }));
  const reconciliations = input.reconciliations.map((item) => ({
    ...structuredClone(item),
    sourceRefs: uniqueSorted([...item.sourceRefs]),
    differences: uniqueSorted([...item.differences]),
    scientificTruthInferred: false as const,
  }));
  const lifecycle = lifecycleInput ? {
    snapshots: lifecycleInput.snapshots.map((item) => ({ ...structuredClone(item), occurrenceRefs: uniqueSorted([...item.occurrenceRefs]) })),
    freezes: structuredClone([...lifecycleInput.freezes]),
    locks: structuredClone([...lifecycleInput.locks]),
    unlockAttempts: lifecycleInput.unlockAttempts.map((item) => ({
      ...structuredClone(item),
      status: item.actorRef && item.mandateRef && item.reason ? "AUTHORIZED" as const : "REJECTED_UNAUTHORIZED" as const,
    })),
    releases: lifecycleInput.releases.map((item) => ({
      ...structuredClone(item),
      openFindingRefs: uniqueSorted([...item.openFindingRefs]),
      releaseDigest: logicalDigest({ releaseId: item.releaseId, version: item.releaseVersion, snapshotRef: item.snapshotRef, openFindings: uniqueSorted([...item.openFindingRefs]) }),
      exactSnapshotBinding: true as const,
      immutable: true as const,
    })),
    postReleaseCorrections: lifecycleInput.postReleaseCorrections.map((item) => ({
      ...structuredClone(item), priorReleaseMutated: false as const,
    })),
  } : emptyLifecycle();
  const openFindingRefs = findings.filter((item) => item.status === "OPEN").map((item) => item.findingId);
  const latestRelease = lifecycle.releases.at(-1) ?? null;
  const downstreamReadiness: DataManagementReasoningResult["downstreamReadiness"] = [{
    readinessId: `dm-readiness:${logicalDigest({ input: input.inputId, release: latestRelease?.releaseDigest ?? null })}`,
    targetOwner: "BIOSTATISTICS",
    status: latestRelease && latestRelease.openFindingRefs.length === 0 ? "RELEASED" : "REQUIRED_UNRESOLVED",
    releaseRef: latestRelease?.releaseId ?? null,
    releaseVersion: latestRelease?.releaseVersion ?? null,
    releaseDigest: latestRelease?.releaseDigest ?? null,
    openFindingRefs: uniqueSorted([...(latestRelease?.openFindingRefs ?? []), ...openFindingRefs]),
  }];
  const ambiguous = reconciliations.filter((item) => item.scientificAmbiguity);
  const unauthorizedUnlocks = lifecycle.unlockAttempts.filter((item) => item.status === "REJECTED_UNAUTHORIZED");
  const informationNeeds: DataManagementReasoningResult["informationNeeds"] = [
    ...ambiguous.map((item) => ({
      needId: `dm-need:${logicalDigest({ reconciliation: item.reconciliationId, kind: "SCIENTIFIC_AMBIGUITY" })}`,
      informationNeeded: "Adjudication explicite de la différence scientifique conservée lors de la réconciliation.",
      reason: "Data Management ne peut pas inventer la vérité scientifique ni une priorité silencieuse entre sources.",
      targetOwner: "HUMAN" as const,
      sourceRefs: [item.reconciliationId, ...item.sourceRefs],
      status: "OPEN_NOT_RESOLVED" as const,
    })),
    ...unauthorizedUnlocks.map((item) => ({
      needId: `dm-need:${logicalDigest({ unlock: item.unlockId, kind: "AUTHORITY_REQUIRED" })}`,
      informationNeeded: "Acteur, mandat et motif gouvernés pour l’unlock.",
      reason: "Un état verrouillé ne peut pas être réouvert sans autorisation traçable.",
      targetOwner: "HUMAN" as const,
      sourceRefs: [item.unlockId, item.lockRef],
      status: "OPEN_NOT_RESOLVED" as const,
    })),
  ];
  const downstreamHandoffs: DataManagementReasoningResult["downstreamHandoffs"] = [
    {
      handoffId: `dm-handoff:${logicalDigest({ input: input.inputId, target: "BIOSTATISTICS" })}`,
      sourceOwner: "DATA_MANAGEMENT",
      targetOwner: "BIOSTATISTICS",
      purpose: "Exposer l’état exact de release et les findings ouverts sans choisir la stratégie statistique.",
      informationNeeded: downstreamReadiness[0]!.status === "RELEASED" ? ["release exacte disponible"] : ["release exacte requise", "findings critiques à résoudre"],
      provenanceRefs: uniqueSorted([input.cdmResult.resultId, input.cdmResult.resultDigest, downstreamReadiness[0]!.readinessId]),
      status: "PROPOSED_NOT_EXECUTED",
      ownershipTransferred: false,
      projectWriteAuthorized: false,
    },
    ...ambiguous.map((item) => ({
      handoffId: `dm-handoff:${logicalDigest({ reconciliation: item.reconciliationId, target: "HUMAN" })}`,
      sourceOwner: "DATA_MANAGEMENT" as const,
      targetOwner: "HUMAN" as const,
      purpose: "Faire arbitrer une ambiguïté scientifique que la réconciliation opérationnelle ne résout pas.",
      informationNeeded: [...item.differences],
      provenanceRefs: [item.reconciliationId, ...item.sourceRefs],
      status: "PROPOSED_NOT_EXECUTED" as const,
      ownershipTransferred: false as const,
      projectWriteAuthorized: false as const,
    })),
  ];
  const material: Omit<DataManagementReasoningResult, "resultDigest"> = {
    contract: DATA_MANAGEMENT_REASONING_RESULT_CONTRACT,
    contractVersion: DATA_MANAGEMENT_REASONING_RUNTIME_VERSION,
    owner: "DATA_MANAGEMENT",
    capabilityId: "DATA_MANAGEMENT_PLANNING",
    resultId: `dm-result:${logicalDigest({ input: input.inputId, project: input.projectSnapshot.snapshotDigest, cdm: input.cdmResult.resultDigest })}`,
    resultVersion: DATA_MANAGEMENT_REASONING_RUNTIME_VERSION,
    resultStatus: ambiguous.length || unauthorizedUnlocks.length
      ? "HUMAN_REVIEW_REQUIRED"
      : collectionRequirements.length ? "OPERATIONAL_REQUIREMENTS_READY" : "INFORMATION_REQUIRED",
    sourceProject: {
      projectId: input.projectId,
      projectVersion: input.projectVersion,
      projectDigest: input.projectDigest,
      snapshotDigest: input.projectSnapshot.snapshotDigest,
    },
    sourceCdmResult: {
      resultId: input.cdmResult.resultId,
      resultVersion: input.cdmResult.resultVersion,
      resultDigest: input.cdmResult.resultDigest,
    },
    sourceNeed: structuredClone(input.selectedNeed),
    sourceOwnerLineage: structuredClone(input.upstreamOwnerInputs),
    collectionRequirements,
    sourceAndIngestionRequirements,
    qualityControls,
    findings,
    queries,
    corrections,
    reconciliations,
    lifecycle,
    downstreamReadiness,
    informationNeeds,
    downstreamHandoffs,
    limitations: [
      "Contrats et raisonnement opérationnel uniquement ; aucun EDC, stockage, ingestion ou traitement réel.",
      "Les décisions scientifiques et statistiques restent chez leurs propriétaires respectifs.",
    ],
    unresolvedQuestions: informationNeeds.map((item) => item.needId),
    projectWriteAuthorized: false,
    projectOwnershipTransferred: false,
    projectObjectsRedefined: false,
    cdmResultMutated: false,
    scientificMeaningRedefined: false,
    statisticalStrategySelected: false,
    analyticalMissingnessStrategyCreated: false,
    realizedDataFabricated: false,
    realOperationsExecuted: false,
  };
  if (stableStringify(input.projectSnapshot) !== projectBefore) throw new Error("DATA_MANAGEMENT_MUTATED_PROJECT_SNAPSHOT");
  if (stableStringify(input.cdmResult) !== cdmBefore) throw new Error("DATA_MANAGEMENT_MUTATED_CDM_RESULT");
  return Object.freeze({ ...material, resultDigest: resultDigest(material) });
};

export const validateDataManagementReasoningResult = (
  input: Readonly<DataManagementReasoningRuntimeInput>,
  result: Readonly<DataManagementReasoningResult>,
) => {
  const { resultDigest: _digest, ...material } = result;
  const findings = [
    ...(result.contract !== DATA_MANAGEMENT_REASONING_RESULT_CONTRACT ? ["DATA_MANAGEMENT_RESULT_CONTRACT_INVALID"] : []),
    ...(result.owner !== "DATA_MANAGEMENT" || result.capabilityId !== "DATA_MANAGEMENT_PLANNING" ? ["DATA_MANAGEMENT_RESULT_OWNER_INVALID"] : []),
    ...(result.sourceProject.projectId !== input.projectId
      || result.sourceProject.projectVersion !== input.projectVersion
      || result.sourceProject.projectDigest !== input.projectDigest
      || result.sourceProject.snapshotDigest !== input.projectSnapshot.snapshotDigest ? ["DATA_MANAGEMENT_RESULT_PROJECT_BINDING_INVALID"] : []),
    ...(result.sourceCdmResult.resultId !== input.cdmResult.resultId
      || result.sourceCdmResult.resultVersion !== input.cdmResult.resultVersion
      || result.sourceCdmResult.resultDigest !== input.cdmResult.resultDigest ? ["DATA_MANAGEMENT_RESULT_CDM_BINDING_INVALID"] : []),
    ...(result.resultDigest !== resultDigest(material) ? ["DATA_MANAGEMENT_RESULT_DIGEST_INVALID"] : []),
    ...(result.projectWriteAuthorized !== false
      || result.projectOwnershipTransferred !== false
      || result.projectObjectsRedefined !== false
      || result.cdmResultMutated !== false
      || result.scientificMeaningRedefined !== false
      || result.statisticalStrategySelected !== false
      || result.analyticalMissingnessStrategyCreated !== false
      || result.realizedDataFabricated !== false
      || result.realOperationsExecuted !== false ? ["DATA_MANAGEMENT_RESULT_BOUNDARY_INVALID"] : []),
    ...(result.corrections.some((item) => item.originalPreserved !== true || item.correctionOverwritesOriginal !== false) ? ["DATA_MANAGEMENT_CORRECTION_HISTORY_INVALID"] : []),
    ...(result.lifecycle.postReleaseCorrections.some((item) => item.priorReleaseMutated !== false) ? ["DATA_MANAGEMENT_RELEASE_IMMUTABILITY_INVALID"] : []),
  ];
  return Object.freeze({ status: findings.length ? "FAIL" as const : "PASS" as const, findings: Object.freeze(findings) });
};

export const dataManagementResultMatchesSources = (input: {
  result: Readonly<DataManagementReasoningResult>;
  projectSnapshot: Readonly<ProjectContextSnapshot>;
  cdmResult: Readonly<CanonicalStudyDataResult>;
}) => input.result.sourceProject.projectId === input.projectSnapshot.sourceProjectRef
  && input.result.sourceProject.projectVersion === input.projectSnapshot.sourceProjectVersion
  && input.result.sourceProject.projectDigest === input.projectSnapshot.sourceProjectDigest
  && input.result.sourceProject.snapshotDigest === input.projectSnapshot.snapshotDigest
  && input.result.sourceCdmResult.resultId === input.cdmResult.resultId
  && input.result.sourceCdmResult.resultVersion === input.cdmResult.resultVersion
  && input.result.sourceCdmResult.resultDigest === input.cdmResult.resultDigest;
