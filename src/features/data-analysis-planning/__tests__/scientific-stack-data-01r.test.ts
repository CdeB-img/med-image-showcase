import { describe, expect, it } from "vitest";
import { logicalDigest } from "@/features/knowledge-engine";
import type {
  ScientificContributionItem,
  ScientificExpectedVariableOccasionCandidate,
  ScientificInterpretationContributionEnvelope,
  ScientificInterpretationTurn,
} from "@/features/scientific-interpretation";
import {
  buildProjectContextSnapshot,
  confirmResearchProjectContribution,
  type ProjectContextSnapshot,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import {
  buildFunctionalResetQueryNavigation,
  buildFunctionalResetQuerySourceState,
} from "@/features/query-navigation";
import { createProductOwnerResultLedger } from "@/features/protocol-designer/product-owner-result-ledger";
import { createScientificExecutionTraceLedger } from "@/features/protocol-designer/scientific-execution-trace";
import { invokeCanonicalStudyDataForProjectSnapshot } from "@/features/protocol-designer/product-canonical-study-data-owner-runtime";
import { invokeDataManagementForProjectSnapshot } from "@/features/protocol-designer/product-data-management-owner-runtime";
import { invokeBiostatisticsForProjectSnapshot } from "@/features/protocol-designer/product-biostatistics-owner-runtime";
import {
  deriveFunctionalResetDataOwnerState,
  dispatchCanonicalStudyDataFromQuery,
  isCanonicalStudyDataQueryDispatch,
} from "@/features/protocol-designer/functional-reset/canonical-study-data-standard";
import {
  dispatchDataManagementFromQuery,
  isDataManagementQueryDispatch,
} from "@/features/protocol-designer/functional-reset/data-management-standard";
import { makeFunctionalReset03A1Contribution } from "@/features/protocol-designer/functional-reset/__tests__/functional-reset-03a1-fixtures";
import {
  CANONICAL_STUDY_DATA_RUNTIME_CONTRACT,
  CANONICAL_STUDY_DATA_RUNTIME_VERSION,
  DATA_MANAGEMENT_REASONING_RUNTIME_CONTRACT,
  DATA_MANAGEMENT_REASONING_RUNTIME_VERSION,
  canonicalStudyDataResultMatchesSnapshot,
  dataManagementResultMatchesSources,
  executeCanonicalStudyDataRuntime,
  executeDataManagementReasoningRuntime,
  validateCanonicalStudyDataResult,
  validateDataManagementReasoningResult,
  type CanonicalStudyDataRuntimeInput,
  type DataManagementReasoningRuntimeInput,
  type ExplicitSyntheticVariableOccurrence,
  type SyntheticDataLifecycle,
} from "..";

const AT = "2026-09-03T18:00:00.000Z";
const authority = {
  actorRef: "researcher:scientific-stack-data-01r",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const turn = (id: string): ScientificInterpretationTurn => ({
  turnId: `turn:data:${id}`,
  role: "USER",
  content: "Construire une étude longitudinale avec données et analyse gouvernées.",
  createdAt: AT,
});

const item = (id: string, type: string, content: string, sourceTurn: ScientificInterpretationTurn, studyRole = type): ScientificContributionItem => ({
  itemId: id,
  semanticIdentity: id,
  proposedType: type,
  content,
  polarity: "AFFIRMED",
  studyRole,
  confidence: 1,
  previousItemIds: [],
  evidenceRefs: [sourceTurn.turnId],
  epistemicBoundary: {
    ownership: "SCIENTIFIC_INTERPRETATION",
    epistemicStatus: "EXPLICIT_USER_STATED",
    adoptionStatus: "CANDIDATE",
    activeState: true,
    sourceTurnIds: [sourceTurn.turnId],
    sourceText: sourceTurn.content,
  },
});

const timepoint = (offset: number) => ({
  kind: "TIMEPOINT" as const,
  direction: "AT" as const,
  unit: "MONTH" as const,
  offset,
  lowerBound: null,
  upperBound: null,
  relativeEventLabel: null,
  tolerance: null,
  reference: { status: "UNKNOWN" as const, unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" as const },
});

const projectFrom = (id: string, variableCount = 2): ResearchProjectOwnerProjection => {
  const sourceTurn = turn(id);
  const base = makeFunctionalReset03A1Contribution([sourceTurn]);
  const candidateObjects: ScientificContributionItem[] = [
    item(`question:${id}`, "SCIENTIFIC_QUESTION", "Quelle trajectoire de remodelage faut-il estimer ?", sourceTurn),
    item(`objective:${id}`, "OBJECTIVE", "Estimer la trajectoire du critère principal", sourceTurn, "PRIMARY"),
    item(`hypothesis:${id}`, "HYPOTHESIS", "Le critère évolue au cours du suivi", sourceTurn, "PRIMARY"),
    item(`design:${id}`, "STUDY_DESIGN", "cohorte longitudinale prospective", sourceTurn),
    item(`population:${id}`, "POPULATION", "adultes avec condition définie, âge, éligibilité, inclusion et exclusion", sourceTurn),
    item(`intervention:${id}`, "INTERVENTION", "exposition étudiée", sourceTurn),
    item(`comparator:${id}`, "COMPARATOR", "groupe de référence", sourceTurn),
    item(`group:${id}:1`, "GROUP", "groupe exposé", sourceTurn),
    item(`group:${id}:2`, "GROUP", "groupe de référence", sourceTurn),
    item(`endpoint:${id}`, "ENDPOINT", "variation du volume télédiastolique", sourceTurn, "PRIMARY"),
    ...Array.from({ length: variableCount }, (_, index) => item(`variable:${id}:${index + 1}`, "CANONICAL_VARIABLE", index === 0 ? "Volume télédiastolique ventriculaire gauche" : "Volume télésystolique ventriculaire gauche", sourceTurn, index === 0 ? "PRIMARY" : "SECONDARY")),
    item(`property:${id}`, "OBSERVABLE_PROPERTY", "volume ventriculaire", sourceTurn),
    item(`measurement:${id}`, "MEASUREMENT_DEFINITION", "mesure volumétrique IRM", sourceTurn),
    item(`modality:${id}`, "MODALITY", "IRM", sourceTurn),
    item(`acquisition:${id}`, "ACQUISITION", "acquisition IRM, lecture, qualité, comparabilité et faisabilité qualifiées", sourceTurn),
    item(`visit:${id}`, "VISIT", "visites à l’inclusion, 6 mois et 12 mois", sourceTurn),
    item(`analysis:${id}`, "ANALYSIS_SPECIFICATION", "estimation longitudinale descriptive et comparative", sourceTurn),
    item(`data-need:${id}`, "DATA_NEED", "mesures longitudinales des volumes", sourceTurn),
  ];
  const candidateRelations = [
    {
      relationId: `relation:${id}:variable-property`,
      relationType: "MEASURES",
      sourceItemId: `variable:${id}:1`,
      targetItemId: `property:${id}`,
      polarity: "AFFIRMED" as const,
      confidence: 1,
      evidenceRefs: [sourceTurn.turnId],
      epistemicBoundary: {
        ownership: "USER" as const,
        epistemicStatus: "EXPLICIT_USER_STATED" as const,
        adoptionStatus: "CANDIDATE" as const,
        activeState: true,
        sourceTurnIds: [sourceTurn.turnId],
        sourceText: sourceTurn.content,
      },
    },
    {
      relationId: `relation:${id}:variable-measurement`,
      relationType: "REALIZED_BY",
      sourceItemId: `variable:${id}:1`,
      targetItemId: `measurement:${id}`,
      polarity: "AFFIRMED" as const,
      confidence: 1,
      evidenceRefs: [sourceTurn.turnId],
      epistemicBoundary: {
        ownership: "USER" as const,
        epistemicStatus: "EXPLICIT_USER_STATED" as const,
        adoptionStatus: "CANDIDATE" as const,
        activeState: true,
        sourceTurnIds: [sourceTurn.turnId],
        sourceText: sourceTurn.content,
      },
    },
  ];
  const expectedVariableOccasions: ScientificExpectedVariableOccasionCandidate[] = [0, 6, 12].map((offset) => ({
    operation: "ADD",
    occasionId: `expected-occasion:${id}:${offset}`,
    variableProjectRef: `variable:${id}:1`,
    anchor: timepoint(offset),
    studyUnitOrGroupRef: null,
    applicableContext: null,
    sourceText: sourceTurn.content,
    assertionKind: "USER_STATED",
    evidenceRefs: [sourceTurn.turnId],
  }));
  const contribution = {
    ...structuredClone(base),
    identity: {
      ...base.identity,
      contributionId: `contribution:data:${id}`,
      contributionDigest: logicalDigest({ id, candidateObjects, candidateRelations, expectedVariableOccasions }),
    },
    source: { ...base.source, originalRequest: sourceTurn.content, turns: [sourceTurn], sourceRefs: [sourceTurn.turnId] },
    scientificContent: {
      ...structuredClone(base.scientificContent),
      explicitStatements: [],
      candidateObjects,
      candidateRelations,
      temporalElements: [],
      expectedVariableOccasions,
    },
  } as ScientificInterpretationContributionEnvelope;
  return confirmResearchProjectContribution({
    contribution,
    current: null,
    projectId: `research-project:data:${id}`,
    authority,
    confirmedAt: AT,
  });
};

const cdmInput = (project: ResearchProjectOwnerProjection, occurrences: readonly ExplicitSyntheticVariableOccurrence[] = []): CanonicalStudyDataRuntimeInput => {
  const snapshot = buildProjectContextSnapshot({ project });
  return {
    contract: CANONICAL_STUDY_DATA_RUNTIME_CONTRACT,
    contractVersion: CANONICAL_STUDY_DATA_RUNTIME_VERSION,
    inputId: `cdm-input:${snapshot.snapshotDigest}:${occurrences.length}`,
    projectId: snapshot.sourceProjectRef,
    projectVersion: snapshot.sourceProjectVersion,
    projectDigest: snapshot.sourceProjectDigest,
    projectSnapshot: snapshot,
    selectedNeed: {
      needRef: "qry:cdm",
      purpose: "Représenter les données attendues.",
      affectedDecisionRefs: ["project-section:MEASUREMENTS"],
      affectedBranchRefs: ["project-facet:MEASUREMENTS:CDM_CANONICAL_REPRESENTATION"],
      owner: "QUERY_NAVIGATION",
    },
    upstreamOwnerInputs: [{
      sourceOwner: "RESEARCH_PROJECT",
      resultRef: snapshot.sourceProjectRef,
      resultVersion: snapshot.sourceProjectVersion,
      resultDigest: snapshot.sourceProjectDigest,
      purpose: "Préserver le sens scientifique adopté.",
      provenanceRefs: [snapshot.snapshotDigest],
      ownershipTransferred: false,
    }],
    explicitSyntheticOccurrences: occurrences,
    derivationRequirements: [],
    biospecimenRepresentations: [],
    projectWriteAuthorized: false,
  };
};

const occurrence = (snapshot: Readonly<ProjectContextSnapshot>, id: string, missing = false): ExplicitSyntheticVariableOccurrence => {
  const variable = snapshot.objects.find((item) => item.stableId.includes("variable:"))!;
  return {
    syntheticFixture: true,
    occurrenceId: `synthetic-occurrence:${id}`,
    canonicalVariableRef: variable.stableId,
    canonicalVariableVersion: variable.versionRef,
    expectedOccasionRef: snapshot.expectedVariableOccasions[0]!.stableId,
    studyUnitRef: `synthetic-study-unit:${id}`,
    source: { sourceRef: `routine-source:${id}`, sourceVersion: "1", mandate: "ROUTINE_CARE", owner: "SOURCE_SYSTEM" },
    observedValue: missing ? null : 142,
    unit: missing ? null : "mL",
    observedAt: AT,
    status: {
      value: missing ? "NO_VALUE" : "OBSERVED_VALUE",
      realization: "REALIZED",
      applicability: "APPLICABLE",
      validity: "VALID",
      evaluability: missing ? "NOT_EVALUABLE" : "EVALUABLE",
      availability: missing ? "NOT_AVAILABLE" : "AVAILABLE",
      use: "ELIGIBLE",
    },
    factualMissingnessReason: missing ? "IMAGING_RESULT_NOT_EVALUABLE" : null,
    qualityFindingRefs: missing ? [`quality:${id}`] : [],
    provenanceRefs: [`source:${id}`, "imaging:technical-result:1"],
    parentOccurrenceRefs: [],
    transformationRefs: [],
  };
};

const dmInput = (
  project: ResearchProjectOwnerProjection,
  cdmResult: ReturnType<typeof executeCanonicalStudyDataRuntime>,
  additions: Partial<DataManagementReasoningRuntimeInput> = {},
): DataManagementReasoningRuntimeInput => {
  const snapshot = buildProjectContextSnapshot({ project });
  return {
    contract: DATA_MANAGEMENT_REASONING_RUNTIME_CONTRACT,
    contractVersion: DATA_MANAGEMENT_REASONING_RUNTIME_VERSION,
    inputId: `dm-input:${snapshot.snapshotDigest}:${logicalDigest(additions)}`,
    projectId: snapshot.sourceProjectRef,
    projectVersion: snapshot.sourceProjectVersion,
    projectDigest: snapshot.sourceProjectDigest,
    projectSnapshot: snapshot,
    selectedNeed: {
      needRef: "qry:dm",
      purpose: "Préparer les exigences opérationnelles.",
      affectedDecisionRefs: ["project-section:TEMPORALITY"],
      affectedBranchRefs: ["project-facet:TEMPORALITY:DATA_MANAGEMENT_OPERATIONS"],
      owner: "QUERY_NAVIGATION",
    },
    cdmResult,
    upstreamOwnerInputs: [{
      sourceOwner: "STUDY_DATA_CDM",
      resultRef: cdmResult.resultId,
      resultVersion: cdmResult.resultVersion,
      resultDigest: cdmResult.resultDigest,
      purpose: "Préparer les opérations depuis CDM.",
      requirementRefs: ["collection", "quality", "release"],
      provenanceRefs: [cdmResult.resultId, cdmResult.resultDigest],
      ownershipTransferred: false,
    }],
    findings: [],
    queries: [],
    corrections: [],
    reconciliations: [],
    lifecycle: null,
    projectWriteAuthorized: false,
    ...additions,
  };
};

describe("SCIENTIFIC-STACK-DATA-01R — CDM owner", () => {
  it("preserves one variable across multiple occasions without fabricating occurrences", () => {
    const project = projectFrom("cdm-multi-timepoint", 1);
    const input = cdmInput(project);
    const result = executeCanonicalStudyDataRuntime(input);
    expect(validateCanonicalStudyDataResult(input, result)).toEqual({ status: "PASS", findings: [] });
    expect(result.variableRepresentations.filter((item) => item.canonicalVariableRef === `variable:cdm-multi-timepoint:1`)).toHaveLength(1);
    expect(result.expectedOccasionRepresentations).toHaveLength(3);
    expect(new Set(result.expectedOccasionRepresentations.map((item) => item.canonicalVariableRef)).size).toBe(1);
    expect(result.variableOccurrences).toEqual([]);
    expect(result.expectedOccasionCreatedOccurrence).toBe(false);
    expect(result.datasetProjections[0]).toMatchObject({ sourceOfTruth: false, materialized: false });
    expect(result.projectObjectsRedefined).toBe(false);
    expect(result.projectWriteAuthorized).toBe(false);
  });

  it("represents explicit synthetic occurrences, factual missingness, routine provenance, derivation and distinct biospecimens", () => {
    const project = projectFrom("cdm-realized");
    const snapshot = buildProjectContextSnapshot({ project });
    const observed = occurrence(snapshot, "observed");
    const missing = occurrence(snapshot, "missing", true);
    const base = cdmInput(project, [observed, missing]);
    const variables = snapshot.objects.filter((item) => item.type === "CANONICAL_VARIABLE");
    const input: CanonicalStudyDataRuntimeInput = {
      ...base,
      upstreamOwnerInputs: [...base.upstreamOwnerInputs, {
        sourceOwner: "OBSERVABILITY_MEASUREMENT",
        resultRef: "obs-result:1",
        resultVersion: "1.0.0",
        resultDigest: "obs-digest:1",
        purpose: "Préserver les références de mesure.",
        provenanceRefs: ["observable-property:1", "measurement-definition:1"],
        ownershipTransferred: false,
      }, {
        sourceOwner: "IMAGING",
        resultRef: "imaging-result:1",
        resultVersion: "1.0.0",
        resultDigest: "imaging-digest:1",
        purpose: "Préserver la non-évaluabilité technique.",
        provenanceRefs: ["imaging:technical-result:1"],
        ownershipTransferred: false,
      }],
      derivationRequirements: [{
        derivationId: "derivation:volume-change",
        outputVariableRef: variables[1]!.stableId,
        parentVariableRefs: [variables[0]!.stableId],
        expressionRef: "expression:declared-not-executed",
        purpose: "Représenter une exigence de dérivation sans calculer.",
        provenanceRefs: [variables[0]!.versionRef, variables[1]!.versionRef],
      }],
      biospecimenRepresentations: [{
        biospecimenRef: "biospecimen:synthetic:1",
        biospecimenVersion: "1",
        materialType: "plasma",
        collectionOccasionRef: snapshot.expectedVariableOccasions[0]!.stableId,
        sourceRefs: ["synthetic-fixture:material"],
      }],
    };
    const result = executeCanonicalStudyDataRuntime(input);
    expect(result.variableOccurrences[0]?.source.mandate).toBe("ROUTINE_CARE");
    expect(result.variableOccurrences[1]).toMatchObject({
      observedValue: null,
      factualMissingnessReason: "IMAGING_RESULT_NOT_EVALUABLE",
      analyticalMissingnessMechanism: null,
    });
    expect(result.derivations[0]).toMatchObject({ executionStatus: "NOT_EXECUTED_REQUIREMENT_ONLY" });
    expect(result.derivations[0]?.parentVariableRefs).toEqual([variables[0]!.stableId]);
    expect(result.biospecimens[0]).toMatchObject({ representedAsVariable: false, owner: "BIOSPECIMEN_MATERIAL" });
    expect(result.sourceOwnerLineage.map((item) => item.sourceOwner)).toEqual(expect.arrayContaining(["OBSERVABILITY_MEASUREMENT", "IMAGING"]));
    expect(result.analyticalMissingnessStrategyCreated).toBe(false);
  });

  it("marks a result stale after any exact Project source change", () => {
    const project = projectFrom("cdm-stale", 1);
    const input = cdmInput(project);
    const result = executeCanonicalStudyDataRuntime(input);
    const changed = { ...input.projectSnapshot, sourceProjectVersion: `${input.projectVersion}:changed` } as ProjectContextSnapshot;
    expect(canonicalStudyDataResultMatchesSnapshot(result, input.projectSnapshot)).toBe(true);
    expect(canonicalStudyDataResultMatchesSnapshot(result, changed)).toBe(false);
  });
});

describe("SCIENTIFIC-STACK-DATA-01R — Data Management owner", () => {
  it("plans logical collection without fabricating realized data or redefining science", () => {
    const project = projectFrom("dm-plan", 1);
    const cdmResult = executeCanonicalStudyDataRuntime(cdmInput(project));
    const input = dmInput(project, cdmResult);
    const result = executeDataManagementReasoningRuntime(input);
    expect(validateDataManagementReasoningResult(input, result)).toEqual({ status: "PASS", findings: [] });
    expect(result.collectionRequirements[0]).toMatchObject({ logicalFieldOnly: true, realCrfCreated: false, scientificMeaningOwner: "RESEARCH_PROJECT" });
    expect(result.qualityControls.every((item) => item.executionStatus === "NOT_EXECUTED_REQUIREMENT_ONLY")).toBe(true);
    expect(result.findings).toEqual([]);
    expect(result.realizedDataFabricated).toBe(false);
    expect(result.realOperationsExecuted).toBe(false);
    expect(result.scientificMeaningRedefined).toBe(false);
    expect(result.statisticalStrategySelected).toBe(false);
  });

  it("preserves query, correction, reconciliation and every lifecycle distinction", () => {
    const project = projectFrom("dm-lifecycle", 1);
    const snapshot = buildProjectContextSnapshot({ project });
    const realized = occurrence(snapshot, "lifecycle");
    const cdmResult = executeCanonicalStudyDataRuntime(cdmInput(project, [realized]));
    const lifecycle: SyntheticDataLifecycle = {
      syntheticFixture: true,
      snapshots: [
        { snapshotId: "snapshot:1", snapshotVersion: "1", occurrenceRefs: [realized.occurrenceId], createdAt: AT, digest: "snapshot-digest:1" },
        { snapshotId: "snapshot:2", snapshotVersion: "2", occurrenceRefs: [realized.occurrenceId], createdAt: AT, digest: "snapshot-digest:2" },
      ],
      freezes: [{ freezeId: "freeze:1", snapshotRef: "snapshot:1", actorRef: "dm:actor", mandateRef: "dm:mandate", reason: "Contrôles préparatoires terminés", frozenAt: AT }],
      locks: [{ lockId: "lock:1", snapshotRef: "snapshot:1", actorRef: "dm:actor", mandateRef: "dm:mandate", reason: "Version verrouillée", lockedAt: AT }],
      unlockAttempts: [
        { unlockId: "unlock:rejected", lockRef: "lock:1", actorRef: null, mandateRef: null, reason: null, requestedAt: AT },
        { unlockId: "unlock:authorized", lockRef: "lock:1", actorRef: "dm:actor", mandateRef: "dm:mandate", reason: "Correction gouvernée", requestedAt: AT },
      ],
      releases: [
        { releaseId: "release:1", releaseVersion: "1", snapshotRef: "snapshot:1", actorRef: "dm:actor", mandateRef: "dm:mandate", releasedAt: AT, openFindingRefs: [] },
        { releaseId: "release:2", releaseVersion: "2", snapshotRef: "snapshot:2", actorRef: "dm:actor", mandateRef: "dm:mandate", releasedAt: AT, openFindingRefs: [] },
      ],
      postReleaseCorrections: [{ changeId: "post-release-change:1", priorReleaseRef: "release:1", correctionRef: "correction:1", successorSnapshotRef: "snapshot:2", successorReleaseRef: "release:2", changedAt: AT }],
    };
    const input = dmInput(project, cdmResult, {
      upstreamOwnerInputs: [{
        sourceOwner: "STUDY_DATA_CDM",
        resultRef: cdmResult.resultId,
        resultVersion: cdmResult.resultVersion,
        resultDigest: cdmResult.resultDigest,
        purpose: "CDM exact",
        requirementRefs: ["release"],
        provenanceRefs: [cdmResult.resultId],
        ownershipTransferred: false,
      }, {
        sourceOwner: "IMAGING",
        resultRef: "imaging:result:1",
        resultVersion: "1.0.0",
        resultDigest: "imaging:digest:1",
        purpose: "Préserver les métadonnées de provenance d’imagerie.",
        requirementRefs: ["acquisition", "reading", "technical-quality"],
        provenanceRefs: ["imaging:metadata:1"],
        ownershipTransferred: false,
      }],
      findings: [{ syntheticFixture: true, findingId: "finding:1", occurrenceRef: realized.occurrenceId, controlRef: "control:range", status: "RESOLVED", evidenceRefs: ["evidence:1"] }],
      queries: [{ syntheticFixture: true, queryId: "query:1", findingRef: "finding:1", status: "CLOSED", openedByRef: "dm:actor", openedAt: AT, answerRef: "answer:1", closedAt: AT }],
      corrections: [{ syntheticFixture: true, correctionId: "correction:1", occurrenceRef: realized.occurrenceId, originalState: { value: 142 }, correctedState: { value: 140 }, reason: "Erreur de transcription documentée", actorRef: "dm:actor", mandateRef: "dm:mandate", correctedAt: AT, sourceRefs: ["query:1"] }],
      reconciliations: [{ syntheticFixture: true, reconciliationId: "reconciliation:1", sourceRefs: ["source:a", "source:b"], differences: ["date discordante"], deterministicRuleRef: null, scientificAmbiguity: true, status: "HUMAN_REVIEW_REQUIRED" }],
      lifecycle,
    });
    const result = executeDataManagementReasoningRuntime(input);
    expect(result.findings[0]?.status).toBe("RESOLVED");
    expect(result.queries[0]?.status).toBe("CLOSED");
    expect(result.corrections[0]).toMatchObject({ originalState: { value: 142 }, correctedState: { value: 140 }, originalPreserved: true, correctionOverwritesOriginal: false });
    expect(result.reconciliations[0]).toMatchObject({ scientificAmbiguity: true, scientificTruthInferred: false });
    expect(result.downstreamHandoffs.some((item) => item.targetOwner === "HUMAN")).toBe(true);
    expect(result.lifecycle.freezes[0]?.freezeId).not.toBe(result.lifecycle.locks[0]?.lockId);
    expect(result.lifecycle.unlockAttempts.map((item) => item.status)).toEqual(["REJECTED_UNAUTHORIZED", "AUTHORIZED"]);
    expect(result.lifecycle.releases[0]).toMatchObject({ releaseId: "release:1", snapshotRef: "snapshot:1", immutable: true, exactSnapshotBinding: true });
    expect(result.lifecycle.postReleaseCorrections[0]).toMatchObject({ priorReleaseRef: "release:1", successorReleaseRef: "release:2", priorReleaseMutated: false });
    expect(result.sourceAndIngestionRequirements[0]?.imagingMetadataRefs).toEqual(expect.arrayContaining(["imaging:metadata:1"]));
    expect(result.downstreamReadiness[0]?.status).toBe("RELEASED");
  });

  it("marks DM stale when either Project or CDM identity changes", () => {
    const project = projectFrom("dm-stale", 1);
    const cdmResult = executeCanonicalStudyDataRuntime(cdmInput(project));
    const input = dmInput(project, cdmResult);
    const result = executeDataManagementReasoningRuntime(input);
    expect(dataManagementResultMatchesSources({ result, projectSnapshot: input.projectSnapshot, cdmResult })).toBe(true);
    expect(dataManagementResultMatchesSources({ result, projectSnapshot: input.projectSnapshot, cdmResult: { ...cdmResult, resultDigest: "changed" } })).toBe(false);
  });
});

describe("SCIENTIFIC-STACK-DATA-01R — QRY, product, TRACE and cross-owner lineage", () => {
  it("lets QRY dispatch CDM then DM explicitly, never from an unrelated scope", () => {
    const project = projectFrom("qry", 1);
    const emptyState = { currentCdmResult: null, currentDataManagementResult: null };
    const source = buildFunctionalResetQuerySourceState(project, emptyState);
    expect(source.planningDecisionRequirements).toEqual(expect.arrayContaining([expect.objectContaining({ owner: "STUDY_DATA_CDM", domain: "STUDY_DATA" })]));
    const cdmNavigation = buildFunctionalResetQueryNavigation({ project, recordedAt: AT, dataOwnerState: emptyState });
    expect(isCanonicalStudyDataQueryDispatch(cdmNavigation)).toBe(true);
    expect(isDataManagementQueryDispatch(cdmNavigation)).toBe(false);

    const cdmState = {
      currentCdmResult: {
        resultId: "cdm:1", resultVersion: "1.0.0", resultDigest: "cdm:digest:1",
        sourceProjectRef: project.projectId, sourceProjectVersion: project.versionId, sourceProjectDigest: project.projectDigest,
      },
      currentDataManagementResult: null,
    };
    const dmNavigation = buildFunctionalResetQueryNavigation({ project, recordedAt: AT, dataOwnerState: cdmState });
    expect(isDataManagementQueryDispatch(dmNavigation)).toBe(true);
    expect(isCanonicalStudyDataQueryDispatch(dmNavigation)).toBe(false);
    expect(cdmNavigation.owner).toBe("QUERY_NAVIGATION");
    expect(dmNavigation.owner).toBe("QUERY_NAVIGATION");
  });

  it("retains Project → CDM → DM → Biostatistics exact lineage and absent/released states", () => {
    const project = projectFrom("cross", 1);
    const snapshot = buildProjectContextSnapshot({ project });
    const realized = occurrence(snapshot, "cross");
    let ledger = createProductOwnerResultLedger("session:data:cross");
    const cdm = invokeCanonicalStudyDataForProjectSnapshot({
      projectSnapshot: snapshot,
      ledger,
      callerRef: "qry:cdm",
      purpose: "Représenter CDM.",
      selectedNeed: cdmInput(project).selectedNeed,
      explicitSyntheticOccurrences: [realized],
      startedAt: AT,
      completedAt: AT,
    });
    ledger = cdm.ledger;
    const dmAbsent = invokeDataManagementForProjectSnapshot({
      projectSnapshot: snapshot,
      ledger,
      callerRef: "qry:dm:absent",
      purpose: "Préparer DM sans release.",
      selectedNeed: dmInput(project, cdm.result!.nativePayload!).selectedNeed,
      startedAt: AT,
      completedAt: AT,
    });
    expect(dmAbsent.result?.nativePayload?.downstreamReadiness[0]?.status).toBe("REQUIRED_UNRESOLVED");

    const lifecycle: SyntheticDataLifecycle = {
      syntheticFixture: true,
      snapshots: [{ snapshotId: "snapshot:cross", snapshotVersion: "1", occurrenceRefs: [realized.occurrenceId], createdAt: AT, digest: "snapshot:cross:digest" }],
      freezes: [], locks: [], unlockAttempts: [],
      releases: [{ releaseId: "release:cross", releaseVersion: "1", snapshotRef: "snapshot:cross", actorRef: "dm:actor", mandateRef: "dm:mandate", releasedAt: AT, openFindingRefs: [] }],
      postReleaseCorrections: [],
    };
    const dm = invokeDataManagementForProjectSnapshot({
      projectSnapshot: snapshot,
      ledger: dmAbsent.ledger,
      callerRef: "qry:dm:released",
      purpose: "Représenter une release synthétique exacte.",
      selectedNeed: dmInput(project, cdm.result!.nativePayload!).selectedNeed,
      lifecycle,
      startedAt: "2026-09-03T18:01:00.000Z",
      completedAt: "2026-09-03T18:01:00.000Z",
    });
    const biostat = invokeBiostatisticsForProjectSnapshot({
      projectSnapshot: snapshot,
      ledger: dm.ledger,
      callerRef: "qry:biostat",
      purpose: "Qualifier la stratégie analytique depuis la release exacte.",
      selectedNeed: {
        needRef: "qry:biostat",
        purpose: "Qualifier la stratégie analytique.",
        affectedDecisionRefs: ["project-section:ANALYSIS"],
        affectedBranchRefs: ["project-facet:ANALYSIS:ANALYSIS_OBJECTIVE"],
        owner: "QUERY_NAVIGATION",
      },
      startedAt: "2026-09-03T18:02:00.000Z",
      completedAt: "2026-09-03T18:02:00.000Z",
    });
    expect(dm.entry.dependencies).toEqual(expect.arrayContaining([expect.objectContaining({ owner: "STUDY_DATA_CDM", resultId: cdm.result!.resultId })]));
    expect(biostat.entry.dependencies).toEqual(expect.arrayContaining([expect.objectContaining({ owner: "DATA_MANAGEMENT", resultId: dm.result!.resultId })]));
    expect(biostat.request.nativeInput.dataRelease).toMatchObject({ status: "RELEASED", releaseRef: "release:cross", owner: "DATA_MANAGEMENT" });
    expect(biostat.result?.nativePayload?.analysisDatasetRequirements[0]).toMatchObject({ releaseStatus: "RELEASED", releaseOwner: "DATA_MANAGEMENT", factualMissingnessOwner: "CDM-001", analyticalSelectionOwner: "BIOSTATISTICS" });
  });

  it("wires both owners to Standard and records their distinct TRACE stages without Project writes", () => {
    const project = projectFrom("standard", 1);
    const ledger = createProductOwnerResultLedger("session:data:standard");
    const traceLedger = createScientificExecutionTraceLedger("session:data:standard");
    const cdmNavigation = buildFunctionalResetQueryNavigation({
      project,
      recordedAt: AT,
      dataOwnerState: { currentCdmResult: null, currentDataManagementResult: null },
    });
    const cdm = dispatchCanonicalStudyDataFromQuery({
      project,
      navigation: cdmNavigation,
      ownerResultLedger: ledger,
      traceLedger,
      sessionId: "session:data:standard",
      conversationId: "conversation:data:standard",
      presentationTurnRef: "turn:cdm:presentation",
      startedAt: AT,
      completedAt: AT,
    });
    const ownerState = deriveFunctionalResetDataOwnerState({ project, ledger: cdm.ownerResultLedger });
    const dmNavigation = buildFunctionalResetQueryNavigation({ project, recordedAt: AT, dataOwnerState: ownerState });
    const dm = dispatchDataManagementFromQuery({
      project,
      navigation: dmNavigation,
      ownerResultLedger: cdm.ownerResultLedger,
      traceLedger: cdm.traceLedger,
      sessionId: "session:data:standard",
      conversationId: "conversation:data:standard",
      presentationTurnRef: "turn:dm:presentation",
      startedAt: "2026-09-03T18:01:00.000Z",
      completedAt: "2026-09-03T18:01:00.000Z",
    });
    expect(cdm.presentation.title).toBe("Structure canonique des données");
    expect(dm.presentation.title).toBe("Préparation opérationnelle des données");
    expect(cdm.projectWrites).toBe(0);
    expect(dm.projectWrites).toBe(0);
    expect(dm.traceLedger.events.map((event) => event.common?.stage)).toEqual(expect.arrayContaining(["CDM_REQUEST", "CDM_RESULT", "DATA_MANAGEMENT_REQUEST", "DATA_MANAGEMENT_RESULT"]));
  });
});
