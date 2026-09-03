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
  prepareResearchProjectContributionCandidate,
  type ProjectContextSnapshot,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import { buildFunctionalResetQueryNavigation } from "@/features/query-navigation";
import { createProductOwnerResultLedger, readProductOwnerResult } from "@/features/protocol-designer/product-owner-result-ledger";
import { createScientificExecutionTraceLedger } from "@/features/protocol-designer/scientific-execution-trace";
import { invokeBiostatisticsForProjectSnapshot } from "@/features/protocol-designer/product-biostatistics-owner-runtime";
import { invokeStudyDesignForProjectSnapshot } from "@/features/protocol-designer/product-study-design-owner-runtime";
import { invokeObservabilityForProjectSnapshot } from "@/features/protocol-designer/product-observability-owner-runtime";
import { invokeImagingForProjectSnapshot } from "@/features/protocol-designer/product-imaging-owner-runtime";
import { invokeScientificThinkingForProject } from "@/features/protocol-designer/product-scientific-thinking-owner-runtime";
import {
  biostatisticsInteractionMatchesCurrentProject,
  buildBiostatisticsStrategyContribution,
  dispatchBiostatisticsFromQuery,
  isBiostatisticsQueryDispatch,
  resolveBiostatisticsConversation,
} from "@/features/protocol-designer/functional-reset/biostatistics-standard";
import { makeFunctionalReset03A1Contribution } from "@/features/protocol-designer/functional-reset/__tests__/functional-reset-03a1-fixtures";
import {
  BIOSTATISTICS_REASONING_RUNTIME_CONTRACT,
  BIOSTATISTICS_REASONING_RUNTIME_VERSION,
  calculateTwoGroupContinuousSampleSize,
  executeBiostatisticsReasoningRuntime,
  validateBiostatisticsReasoningResult,
  type BiostatisticsAnalyticalDecisions,
  type BiostatisticsReasoningRuntimeInput,
  type BiostatisticsUpstreamOwnerInput,
} from "..";

const AT = "2026-09-03T14:00:00.000Z";
const authority = {
  actorRef: "researcher:scientific-stack-biostatistics-01",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const turn = (id: string, content = "Construire une étude analytique gouvernée."): ScientificInterpretationTurn => ({
  turnId: `turn:biostatistics:${id}`,
  role: "USER",
  content,
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
  unit: "DAY" as const,
  offset,
  lowerBound: null,
  upperBound: null,
  relativeEventLabel: null,
  tolerance: null,
  reference: { status: "UNKNOWN" as const, unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" as const },
});

const projectFrom = (id: string, options?: {
  endpointCount?: number;
  variableCount?: number;
  groupCount?: number;
  repeated?: boolean;
  analysisAlreadyKnown?: boolean;
  omitEndpoint?: boolean;
  omitPopulation?: boolean;
}) => {
  const sourceTurn = turn(id);
  const base = makeFunctionalReset03A1Contribution([sourceTurn]);
  const endpointCount = options?.omitEndpoint ? 0 : options?.endpointCount ?? 1;
  const variableCount = options?.variableCount ?? 1;
  const candidateObjects: ScientificContributionItem[] = [
    item(`question:${id}`, "SCIENTIFIC_QUESTION", "Quelle trajectoire du critère principal faut-il estimer ?", sourceTurn),
    item(`objective:${id}`, "OBJECTIVE", "Estimer et comparer le critère principal conformément au design adopté", sourceTurn, "PRIMARY"),
    item(`hypothesis:${id}`, "HYPOTHESIS", "Le critère principal diffère selon la structure adoptée", sourceTurn, "PRIMARY"),
    item(`design:${id}`, "STUDY_DESIGN", options?.repeated ? "cohorte longitudinale prospective" : "étude comparative prospective", sourceTurn),
    ...(!options?.omitPopulation ? [item(`population:${id}`, "POPULATION", "adultes avec condition définie, âge, éligibilité, critères d’inclusion et d’exclusion", sourceTurn)] : []),
    item(`intervention:${id}`, "INTERVENTION", "exposition étudiée", sourceTurn),
    item(`comparator:${id}`, "COMPARATOR", "groupe de référence", sourceTurn),
    ...Array.from({ length: options?.groupCount ?? 2 }, (_, index) => item(`group:${id}:${index + 1}`, "GROUP", `groupe ${index + 1}`, sourceTurn)),
    ...Array.from({ length: endpointCount }, (_, index) => item(`endpoint:${id}:${index + 1}`, "ENDPOINT", `critère ${index + 1} principal`, sourceTurn, index === 0 ? "PRIMARY" : "SECONDARY")),
    ...Array.from({ length: variableCount }, (_, index) => item(`variable:${id}:${index + 1}`, "CANONICAL_VARIABLE", `mesure quantitative ${index + 1} principale`, sourceTurn, index === 0 ? "PRIMARY" : "SECONDARY")),
    item(`modality:${id}`, "MODALITY", "IRM", sourceTurn),
    item(`acquisition:${id}`, "ACQUISITION", "acquisition IRM, lecture, qualité, comparabilité et faisabilité qualifiées", sourceTurn),
    item(`visit:${id}`, "VISIT", options?.repeated ? "visites répétées à J0 et J30" : "visite principale à J30", sourceTurn),
    ...(options?.analysisAlreadyKnown ? [item(`analysis:${id}`, "ANALYSIS_SPECIFICATION", "analyse statistique adoptée", sourceTurn)] : []),
  ];
  const expectedVariableOccasions: ScientificExpectedVariableOccasionCandidate[] = options?.repeated
    ? [0, 30].map((offset) => ({
      operation: "ADD",
      occasionId: `expected-occasion:${id}:${offset}`,
      variableProjectRef: `variable:${id}:1`,
      anchor: timepoint(offset),
      studyUnitOrGroupRef: null,
      applicableContext: null,
      sourceText: sourceTurn.content,
      assertionKind: "USER_STATED",
      evidenceRefs: [sourceTurn.turnId],
    }))
    : [];
  const contribution = {
    ...structuredClone(base),
    identity: {
      ...base.identity,
      contributionId: `contribution:biostatistics:${id}`,
      contributionDigest: logicalDigest({ id, objects: candidateObjects.map((candidate) => candidate.itemId), expectedVariableOccasions }),
    },
    source: { ...base.source, originalRequest: sourceTurn.content, turns: [sourceTurn], sourceRefs: [sourceTurn.turnId] },
    scientificContent: {
      ...structuredClone(base.scientificContent),
      explicitStatements: [],
      candidateObjects,
      candidateRelations: [],
      temporalElements: [],
      expectedVariableOccasions,
    },
  } as ScientificInterpretationContributionEnvelope;
  return confirmResearchProjectContribution({ contribution, current: null, projectId: `research-project:biostatistics:${id}`, authority, confirmedAt: AT });
};

const projectLineage = (snapshot: Readonly<ProjectContextSnapshot>): BiostatisticsUpstreamOwnerInput => ({
  sourceOwner: "RESEARCH_PROJECT",
  resultRef: snapshot.sourceProjectRef,
  resultVersion: snapshot.sourceProjectVersion,
  resultDigest: snapshot.sourceProjectDigest,
  needRefs: ["qry:analysis"],
  purpose: "Qualifier la stratégie analytique.",
  designAxes: [],
  measurementValueNatures: [],
  repeatedMeasurementRefs: [],
  limitations: [],
  provenanceRefs: [snapshot.snapshotDigest],
  ownershipTransferred: false,
});

const runtimeInput = (project: ResearchProjectOwnerProjection, options?: {
  upstream?: readonly BiostatisticsUpstreamOwnerInput[];
  analyticalDecisions?: BiostatisticsAnalyticalDecisions;
  released?: boolean;
}): BiostatisticsReasoningRuntimeInput => {
  const snapshot = buildProjectContextSnapshot({ project });
  return {
    contract: BIOSTATISTICS_REASONING_RUNTIME_CONTRACT,
    contractVersion: BIOSTATISTICS_REASONING_RUNTIME_VERSION,
    inputId: `biostatistics-input:${project.versionId}:${logicalDigest(options ?? {})}`,
    projectId: project.projectId,
    projectVersion: project.versionId,
    projectDigest: project.projectDigest,
    projectSnapshot: snapshot,
    selectedNeed: {
      needRef: "qry:analysis",
      purpose: "Qualifier la stratégie analytique.",
      affectedDecisionRefs: ["project-section:ANALYSIS"],
      affectedBranchRefs: ["project-facet:ANALYSIS:ANALYSIS_OBJECTIVE"],
      owner: "QUERY_NAVIGATION",
    },
    upstreamOwnerInputs: [projectLineage(snapshot), ...(options?.upstream ?? [])],
    dataRelease: options?.released ? {
      status: "RELEASED",
      releaseRef: "dataset-release:1",
      releaseVersion: "v1",
      releaseDigest: "digest:release:1",
      openFindingRefs: [],
      owner: "DATA_MANAGEMENT",
    } : {
      status: "REQUIRED_UNRESOLVED",
      releaseRef: null,
      releaseVersion: null,
      releaseDigest: null,
      openFindingRefs: ["dm-finding:open"],
      owner: "DATA_MANAGEMENT",
    },
    analyticalDecisions: options?.analyticalDecisions ?? {},
    projectWriteAuthorized: false,
  };
};

const upstream = (owner: Exclude<BiostatisticsUpstreamOwnerInput["sourceOwner"], "RESEARCH_PROJECT">, options?: Partial<BiostatisticsUpstreamOwnerInput>): BiostatisticsUpstreamOwnerInput => ({
  sourceOwner: owner,
  resultRef: `${owner.toLocaleLowerCase()}:result:1`,
  resultVersion: "1.0.0",
  resultDigest: `digest:${owner.toLocaleLowerCase()}:1`,
  needRefs: [`${owner.toLocaleLowerCase()}:need:1`],
  purpose: "Qualifier une conséquence analytique structurée.",
  designAxes: [],
  measurementValueNatures: [],
  repeatedMeasurementRefs: [],
  limitations: [],
  provenanceRefs: [`${owner.toLocaleLowerCase()}:source:1`],
  ownershipTransferred: false,
  ...options,
});

const reviseProject = (project: ResearchProjectOwnerProjection) => {
  const sourceTurn = turn("revision", "Ajouter une contrainte analytique explicite.");
  const base = makeFunctionalReset03A1Contribution([sourceTurn]);
  const constraint = item("constraint:biostatistics:revision", "CONSTRAINT", "Contrainte analytique explicite", sourceTurn);
  const contribution = {
    ...structuredClone(base),
    identity: { ...base.identity, contributionId: "contribution:biostatistics:revision", previousContributionId: project.contributionRef, contributionDigest: logicalDigest({ version: project.versionId, constraint }) },
    source: { ...base.source, originalRequest: sourceTurn.content, turns: [sourceTurn], sourceRefs: [sourceTurn.turnId] },
    scientificContent: { ...structuredClone(base.scientificContent), explicitStatements: [], candidateObjects: [constraint], candidateRelations: [] },
  } as ScientificInterpretationContributionEnvelope;
  return confirmResearchProjectContribution({ contribution, current: project, projectId: project.projectId, authority, confirmedAt: "2026-09-03T14:01:00.000Z" });
};

describe("SCIENTIFIC-STACK-BIOSTATISTICS-01 — governed Biostatistics owner", () => {
  it("A/Q — preserves legitimate longitudinal alternatives and selects no model or winner", () => {
    const project = projectFrom("longitudinal", { repeated: true });
    const result = executeBiostatisticsReasoningRuntime(runtimeInput(project, {
      upstream: [upstream("STUDY_DESIGN", { designAxes: [{ structuralForm: "LONGITUDINAL", comparisonStructure: "BETWEEN_GROUPS" }] })],
    }));
    expect(result.methodCandidates.map((item) => item.methodFamily)).toEqual([
      "LONGITUDINAL_REPEATED_MEASURES",
      "CHANGE_BETWEEN_PRESPECIFIED_OCCASIONS",
    ]);
    expect(result.methodCandidates.every((item) => item.model === null && item.selected === false)).toBe(true);
    expect(result.methodCandidates.every((item) => item.tradeOffs.length > 0)).toBe(true);
    expect(result.analysisSpecifications.every((item) => item.method.model === null)).toBe(true);
  });

  it("B — produces a bounded between-group strategy without longitudinal machinery", () => {
    const result = executeBiostatisticsReasoningRuntime(runtimeInput(projectFrom("two-group")));
    expect(result.methodCandidates.map((item) => item.methodFamily)).toEqual(["BETWEEN_GROUP_ENDPOINT_ESTIMATION"]);
    expect(JSON.stringify(result.methodCandidates)).not.toMatch(/LONGITUDINAL|MIXED_MODEL/i);
  });

  it("C — returns the endpoint need to Project without redefining it", () => {
    const result = executeBiostatisticsReasoningRuntime(runtimeInput(projectFrom("endpoint-missing", { omitEndpoint: true })));
    expect(result.analysisSpecifications).toEqual([]);
    expect(result.informationNeeds).toContainEqual(expect.objectContaining({ targetOwner: "RESEARCH_PROJECT", informationNeeded: expect.stringMatching(/endpoint/i) }));
  });

  it("D/E — preserves OBS and Imaging ownership while propagating measurement limitations and repeated structure", () => {
    const result = executeBiostatisticsReasoningRuntime(runtimeInput(projectFrom("upstream", { repeated: false }), {
      upstream: [
        upstream("OBSERVABILITY_MEASUREMENT", { measurementValueNatures: ["REPEATED_QUANTITATIVE"], limitations: ["incertitude de mesure OBS"] }),
        upstream("IMAGING", { repeatedMeasurementRefs: ["imaging-variable:1"], limitations: ["comparabilité inter-site Imaging"] }),
      ],
    }));
    expect(result.methodCandidates.some((item) => item.methodFamily === "LONGITUDINAL_REPEATED_MEASURES")).toBe(true);
    expect(result.limitations).toEqual(expect.arrayContaining(["incertitude de mesure OBS", "comparabilité inter-site Imaging"]));
    expect(result.sourceOwnerLineage.map((item) => item.sourceOwner)).toEqual(expect.arrayContaining(["OBSERVABILITY_MEASUREMENT", "IMAGING"]));
    expect(result.sourceOwnerLineage.every((item) => item.ownershipTransferred === false)).toBe(true);
  });

  it("F/G/H — preserves UNKNOWN missingness and represents multiplicity only when present", () => {
    const single = executeBiostatisticsReasoningRuntime(runtimeInput(projectFrom("single-endpoint")));
    expect(single.analysisSpecifications[0]?.missingDataStrategy).toMatchObject({ factualMissingnessOwner: "CDM-001", strategy: null, status: "UNKNOWN", imputationExecuted: false });
    expect(single.analysisSpecifications[0]?.multiplicity).toMatchObject({ applicable: false, status: "NOT_APPLICABLE", procedure: null });
    expect(single.informationNeeds.some((item) => /MULTIPLICITY/.test(item.needId))).toBe(false);
    const multiple = executeBiostatisticsReasoningRuntime(runtimeInput(projectFrom("multiple-endpoints", { endpointCount: 2 })));
    expect(multiple.analysisSpecifications[0]?.multiplicity).toMatchObject({ applicable: null, status: "UNKNOWN", procedure: null });
    expect(multiple.informationNeeds).toContainEqual(expect.objectContaining({ informationNeeded: expect.stringMatching(/multiplicit/i) }));
  });

  it("I/J — invents no sample size and calculates the bounded sourced fixture reproducibly", () => {
    const insufficient = executeBiostatisticsReasoningRuntime(runtimeInput(projectFrom("sizing-insufficient")));
    expect(insufficient.dimensioningCalculation).toBeNull();
    expect(insufficient.dimensionnement.calculatedSampleSize).toBeNull();
    expect(insufficient.informationNeeds).toContainEqual(expect.objectContaining({ informationNeeded: expect.stringMatching(/hypothèses numériques/i) }));
    const inputs = {
      difference: 5,
      commonStandardDeviation: 10,
      twoSidedAlpha: 0.05,
      power: 0.8,
      anticipatedNonEvaluableRate: 0.1,
      sourceRefs: {
        difference: "project-decision:difference",
        commonStandardDeviation: "pilot-data:sd",
        twoSidedAlpha: "project-decision:alpha",
        power: "project-decision:power",
        anticipatedNonEvaluableRate: "operational-assumption:non-evaluable",
      },
    } as const;
    const first = calculateTwoGroupContinuousSampleSize(inputs);
    const second = calculateTwoGroupContinuousSampleSize(structuredClone(inputs));
    expect(second).toEqual(first);
    expect(first).toMatchObject({ totalSampleSize: 140, methodVersion: "1.0.0", projectWriteAuthorized: false });
    expect(first.formula).toContain("z_(1-alpha/2)");
    expect(first.inputs.sourceRefs).toEqual(inputs.sourceRefs);
    const calculated = executeBiostatisticsReasoningRuntime(runtimeInput(projectFrom("sizing-calculable"), { analyticalDecisions: { dimensioning: inputs } }));
    expect(calculated.dimensioningCalculation?.totalSampleSize).toBe(140);
  });

  it("K/L — discussion is read-only; selection enters Human Review and confirmation alone creates vN+1", () => {
    const project = projectFrom("adoption", { repeated: true });
    const result = executeBiostatisticsReasoningRuntime(runtimeInput(project));
    const before = JSON.stringify(project);
    expect(resolveBiostatisticsConversation({ raw: "Pourquoi un modèle longitudinal plutôt que comparer chaque visite séparément ?", result }).kind).toBe("DISCUSS");
    expect(JSON.stringify(project)).toBe(before);
    const resolution = resolveBiostatisticsConversation({ raw: "Je retiens la stratégie 1.", result });
    expect(resolution.kind).toBe("SELECT_STRATEGY");
    if (resolution.kind !== "SELECT_STRATEGY") throw new Error("BIOSTATISTICS_SELECTION_EXPECTED");
    const proposalTurn: ScientificInterpretationTurn = { turnId: "turn:biostatistics:proposal", role: "NOXIA", content: "Options", createdAt: AT };
    const selectionTurn = turn("selection", "Je retiens la stratégie 1.");
    const contribution = buildBiostatisticsStrategyContribution({
      conversationId: "conversation:biostatistics",
      project,
      result,
      strategyRef: resolution.strategyRef,
      proposalTurn,
      selectionTurn,
      createdAt: AT,
    });
    const candidate = prepareResearchProjectContributionCandidate(contribution, project);
    expect(candidate.status).toBe("CANDIDATE_PENDING_HUMAN_CONFIRMATION");
    expect(candidate.changeSet.changes).toContainEqual(expect.objectContaining({
      targetSectionId: "ANALYSIS",
      proposedElement: expect.objectContaining({
        sourceProposedType: "ANALYSIS_SPECIFICATION",
        sourceStudyRole: "ANALYSIS_SPECIFICATION",
      }),
    }));
    expect(project.versionId).toBe(result.sourceProject.projectVersion);
    const adopted = confirmResearchProjectContribution({ contribution, current: project, projectId: project.projectId, authority, confirmedAt: "2026-09-03T14:02:00.000Z", reviewedProjection: candidate.humanReviewProjection });
    expect(adopted.versionId).not.toBe(project.versionId);
  });

  it("M — marks a retained result stale after an independent Project revision", () => {
    const project = projectFrom("stale");
    const invocation = invokeBiostatisticsForProjectSnapshot({
      projectSnapshot: buildProjectContextSnapshot({ project }),
      ledger: createProductOwnerResultLedger("session:biostatistics:stale"),
      callerRef: "qry:analysis",
      purpose: "Qualifier l’analyse.",
      selectedNeed: runtimeInput(project).selectedNeed,
      startedAt: AT,
      completedAt: AT,
    });
    const revised = reviseProject(project);
    expect(readProductOwnerResult({
      ledger: invocation.ledger,
      resultId: invocation.result!.resultId,
      currentProjectSnapshot: buildProjectContextSnapshot({ project: revised }),
      expectedOwner: "BIOSTATISTICS",
    }).freshness.status).toBe("STALE_OWNER_RESULT");
    expect(biostatisticsInteractionMatchesCurrentProject({
      contract: "FUNCTIONAL_RESET_BIOSTATISTICS_INTERACTION",
      contractVersion: "1.0.0",
      owner: "BIOSTATISTICS",
      capabilityId: "BIOSTATISTICS_PLANNING",
      ownerResultRef: invocation.result!.resultId,
      ownerResultVersion: invocation.result!.resultVersion,
      sourceActionRef: "qry:analysis",
      sourceProjectRef: project.projectId,
      sourceProjectVersion: project.versionId,
      sourceProjectDigest: project.projectDigest,
      presentationTurnRef: "turn:presentation",
      traceRunId: null,
      status: "ACTIVE",
      selectedStrategyRef: null,
      pendingContributionRef: null,
      adoptedProjectVersion: null,
      staleReason: null,
      projectWriteAuthorized: false,
    }, revised)).toBe(false);
  });

  it("N/O — declares DM release and CDM occurrence dependencies without mutating either owner", () => {
    const result = executeBiostatisticsReasoningRuntime(runtimeInput(projectFrom("data-boundaries")));
    expect(result.informationNeeds).toContainEqual(expect.objectContaining({ targetOwner: "DATA_MANAGEMENT" }));
    expect(result.downstreamHandoffs).toContainEqual(expect.objectContaining({ targetOwner: "DATA_MANAGEMENT", ownershipTransferred: false }));
    expect(result.analysisDatasetRequirements[0]).toMatchObject({
      releaseOwner: "DATA_MANAGEMENT",
      factualMissingnessOwner: "CDM-001",
      mutatesOccurrences: false,
      mutatesRelease: false,
      releaseStatus: "REQUIRED_UNRESOLVED",
    });
  });

  it("P — QRY dispatches only a legitimate analytical gap and ignores resolved/non-Biostat scope", () => {
    const project = projectFrom("qry");
    const navigation = buildFunctionalResetQueryNavigation({ project, recordedAt: AT });
    expect(navigation.currentAction).toMatchObject({ owner: "BIOSTATISTICS" });
    expect(navigation.selection.selected).toMatchObject({ capabilityRef: "BIOSTATISTICS_PLANNING" });
    expect(isBiostatisticsQueryDispatch(navigation)).toBe(true);
    const resolved = buildFunctionalResetQueryNavigation({ project: projectFrom("qry-resolved", { analysisAlreadyKnown: true }), recordedAt: AT });
    expect(isBiostatisticsQueryDispatch(resolved)).toBe(false);
    const incomplete = buildFunctionalResetQueryNavigation({ project: projectFrom("qry-incomplete", { omitEndpoint: true }), recordedAt: AT });
    expect(isBiostatisticsQueryDispatch(incomplete)).toBe(false);
  });

  it("R — links each sensitivity candidate to a specific source uncertainty", () => {
    const result = executeBiostatisticsReasoningRuntime(runtimeInput(projectFrom("sensitivity"), {
      analyticalDecisions: { sensitivityUncertainties: [{ uncertaintyRef: "obs:uncertainty:1", rationale: "incertitude de mesure", changedElements: ["MEASUREMENT_ERROR_ASSUMPTION"] }] },
    }));
    expect(result.analysisSpecifications[0]?.sensitivityAnalyses).toContainEqual(expect.objectContaining({ fragilityTested: "incertitude de mesure", changedElements: ["MEASUREMENT_ERROR_ASSUMPTION"] }));
    expect(result.analysisSpecifications[0]?.sensitivityAnalyses[0]?.provenance.sourceRefs).toContain("obs:uncertainty:1");
  });

  it("S/T — does not force estimand machinery and preserves UNKNOWN distinct from NOT_APPLICABLE", () => {
    const notApplicable = executeBiostatisticsReasoningRuntime(runtimeInput(projectFrom("estimand-na"), { analyticalDecisions: {
      estimandApplicability: "NOT_APPLICABLE",
      intercurrentEvents: [{ event: "traitement de secours", strategy: null, sourceRef: "project:intercurrent:na", applicability: "NOT_APPLICABLE" }],
    } }));
    const unknown = executeBiostatisticsReasoningRuntime(runtimeInput(projectFrom("estimand-unknown"), { analyticalDecisions: {
      estimandApplicability: "UNKNOWN",
      intercurrentEvents: [{ event: "traitement de secours", strategy: null, sourceRef: "project:intercurrent:unknown", applicability: "UNKNOWN" }],
    } }));
    expect(notApplicable.analysisSpecifications[0]?.estimand).toBeNull();
    expect(notApplicable.analysisSpecifications[0]?.intercurrentEvents).toContainEqual(expect.objectContaining({
      event: "traitement de secours",
      strategy: null,
      status: "NOT_APPLICABLE",
      distinctFromMissingness: true,
    }));
    expect(unknown.analysisSpecifications[0]?.estimand).toMatchObject({ status: "UNKNOWN" });
    expect(unknown.analysisSpecifications[0]?.intercurrentEvents).toContainEqual(expect.objectContaining({ event: "traitement de secours", strategy: null, status: "UNKNOWN", distinctFromMissingness: true }));
  });

  it("owner/ledger/TRACE — binds exact Project, records lineage, and is output-equivalent with TRACE off", () => {
    const project = projectFrom("product-dispatch");
    const navigation = buildFunctionalResetQueryNavigation({ project, recordedAt: AT });
    const baseLedger = createProductOwnerResultLedger("session:biostatistics:product");
    const traceLedger = createScientificExecutionTraceLedger("session:biostatistics:product");
    const withTrace = dispatchBiostatisticsFromQuery({
      project,
      navigation,
      ownerResultLedger: baseLedger,
      traceLedger,
      sessionId: "session:biostatistics:product",
      conversationId: "conversation:biostatistics:product",
      presentationTurnRef: "turn:biostatistics:presentation:on",
      startedAt: AT,
      completedAt: AT,
    });
    const withoutTrace = dispatchBiostatisticsFromQuery({
      project,
      navigation,
      ownerResultLedger: createProductOwnerResultLedger("session:biostatistics:product:off"),
      traceLedger: createScientificExecutionTraceLedger("session:biostatistics:product:off"),
      sessionId: "session:biostatistics:product:off",
      conversationId: "conversation:biostatistics:product:off",
      presentationTurnRef: "turn:biostatistics:presentation:off",
      startedAt: AT,
      completedAt: AT,
      traceEnabled: false,
    });
    expect(withTrace.result.resultDigest).toBe(withoutTrace.result.resultDigest);
    expect(withTrace.projectWrites).toBe(0);
    expect(withTrace.providerCalls).toBe(0);
    expect(withTrace.ownerResultLedger.entries.at(-1)?.request).toMatchObject({ owner: "BIOSTATISTICS", capabilityId: "BIOSTATISTICS_PLANNING", projectWriteAuthorized: false });
    const events = withTrace.traceLedger.events.filter((event) => event.common?.traceRunId === withTrace.interaction.traceRunId);
    expect(events.map((event) => event.owner)).toContain("BIOSTATISTICS");
    expect(events.map((event) => event.eventType)).toEqual(expect.arrayContaining(["OWNER_INVOCATION_COMPLETED", "UI_PROJECTION"]));
    expect(events.map((event) => event.common?.stage)).toEqual(expect.arrayContaining(["BIOSTATISTICS_REQUEST", "BIOSTATISTICS_RESULT", "UI_PROJECTION"]));
    expect(validateBiostatisticsReasoningResult(runtimeInput(project), withTrace.result).status).toBe("PASS");
  });

  it("stack continuity — consumes exact RDE/OBS/Imaging results without relabeling their owners", () => {
    const project = projectFrom("stack", { repeated: true });
    const snapshot = buildProjectContextSnapshot({ project });
    const st = invokeScientificThinkingForProject({
      project,
      projectSnapshot: snapshot,
      ledger: createProductOwnerResultLedger("session:biostatistics:stack"),
      callerRef: "qry:scientific-thinking",
      purpose: "Qualifier le raisonnement scientifique.",
      startedAt: AT,
      completedAt: AT,
    });
    const rde = invokeStudyDesignForProjectSnapshot({
      projectSnapshot: snapshot,
      ledger: st.ledger,
      callerRef: "qry:rde",
      purpose: "Qualifier le design.",
      startedAt: AT,
      completedAt: AT,
    });
    const sourceConceptRef = snapshot.objects.find((object) => object.type === "ENDPOINT")!.stableId;
    const propertyRef = "observable-property:biostatistics:stack";
    const obs = invokeObservabilityForProjectSnapshot({
      projectSnapshot: snapshot,
      ledger: rde.ledger,
      callerRef: "qry:obs",
      purpose: "Qualifier la mesure.",
      startedAt: AT,
      completedAt: AT,
      observablePropertyDeclarations: [{
        propertyRef,
        sourceConceptRef,
        label: "critère quantitatif longitudinal",
        rationale: "Propriété reliée à l’endpoint adopté.",
        prerequisites: [],
        assumptions: [],
        limitations: ["incertitude de mesure à propager"],
        uncertainty: [],
        provenanceRefs: [sourceConceptRef],
      }],
      measurementDefinitionDeclarations: [{
        measurementRef: "measurement-definition:biostatistics:stack",
        propertyRef,
        label: "mesure quantitative répétée",
        operationalDefinition: "Mesure répétée selon les occasions Project.",
        valueNature: "REPEATED_QUANTITATIVE",
        domain: "IMAGING",
        rationale: "Définition OBS à spécialiser par Imaging.",
        prerequisites: [],
        assumptions: [],
        limitations: ["précision Imaging à qualifier"],
        uncertainty: [],
        provenanceRefs: [sourceConceptRef],
      }],
    });
    const imaging = invokeImagingForProjectSnapshot({
      projectSnapshot: snapshot,
      ledger: obs.ledger,
      callerRef: "qry:imaging",
      purpose: "Qualifier la réalisation Imaging.",
      sourceNeed: { id: "qry:imaging", purpose: "Qualifier la réalisation Imaging." },
      startedAt: AT,
      completedAt: AT,
    });
    const biostatistics = invokeBiostatisticsForProjectSnapshot({
      projectSnapshot: snapshot,
      ledger: imaging.ledger,
      callerRef: "qry:analysis",
      purpose: "Qualifier l’analyse.",
      selectedNeed: runtimeInput(project).selectedNeed,
      startedAt: AT,
      completedAt: AT,
    });
    const owners = biostatistics.result!.nativePayload!.sourceOwnerLineage.map((item) => item.sourceOwner);
    expect(owners).toEqual(expect.arrayContaining(["RESEARCH_PROJECT", "SCIENTIFIC_THINKING", "STUDY_DESIGN", "OBSERVABILITY_MEASUREMENT", "IMAGING"]));
    expect(biostatistics.entry.dependencies.map((item) => item.owner)).toEqual(expect.arrayContaining(["SCIENTIFIC_THINKING", "STUDY_DESIGN", "OBSERVABILITY_MEASUREMENT", "IMAGING"]));
    expect(biostatistics.result!.nativePayload!.sourceOwnerLineage.every((item) => item.ownershipTransferred === false)).toBe(true);
  });
});
