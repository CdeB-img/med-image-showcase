import { describe, expect, it } from "vitest";
import { logicalDigest } from "@/features/knowledge-engine";
import {
  buildObservabilityMeasurementInput,
  executeObservabilityMeasurementRuntime,
  type BiomarkerRoleDeclaration,
  type MeasurementDefinitionDeclaration,
  type ObservablePropertyDeclaration,
} from "@/features/observability-measurement";
import type {
  ScientificContributionItem,
  ScientificInterpretationContributionEnvelope,
  ScientificInterpretationTurn,
} from "@/features/scientific-interpretation";
import {
  buildProjectContextSnapshot,
  confirmResearchProjectContribution,
  ensureCanonicalProjectState,
  invokeScientificThinkingOwnerFromSnapshot,
  invokeStudyDesignOwnerFromSnapshot,
  listSpecializedOwnerCapabilities,
  prepareResearchProjectContributionCandidate,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import { buildFunctionalResetQueryNavigation } from "@/features/query-navigation";
import { createProductOwnerResultLedger } from "@/features/protocol-designer/product-owner-result-ledger";
import { createScientificExecutionTraceLedger } from "@/features/protocol-designer/scientific-execution-trace";
import { invokeObservabilityForProjectSnapshot, readProductObservabilityOwnerResult } from "@/features/protocol-designer/product-observability-owner-runtime";
import { invokeScientificThinkingForProject } from "@/features/protocol-designer/product-scientific-thinking-owner-runtime";
import { invokeStudyDesignForProjectSnapshot } from "@/features/protocol-designer/product-study-design-owner-runtime";
import {
  buildObservabilityMeasurementContribution,
  dispatchObservabilityFromQuery,
  isObservabilityQueryDispatch,
  observabilityInteractionMatchesCurrentProject,
  resolveObservabilityConversation,
} from "../observability-standard";
import { makeFunctionalReset03A1Contribution } from "./functional-reset-03a1-fixtures";

const AT = "2026-09-03T10:00:00.000Z";
const authority = {
  actorRef: "researcher:scientific-stack-obs-01",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const turn = (id: string, content: string, role: "USER" | "NOXIA" = "USER"): ScientificInterpretationTurn => ({
  turnId: `turn:obs:${id}`,
  role,
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
  epistemicBoundary: {
    ownership: "SCIENTIFIC_INTERPRETATION",
    epistemicStatus: "EXPLICIT_USER_STATED",
    adoptionStatus: "CANDIDATE",
    activeState: true,
    sourceTurnIds: [sourceTurn.turnId],
    sourceText: sourceTurn.content,
  },
});

const projectFrom = (id: string, options?: { variable?: string; readyForMeasurements?: boolean; imaging?: boolean }) => {
  const sourceTurn = turn(id, "Étudier prospectivement le remodelage ventriculaire gauche après infarctus.");
  const base = makeFunctionalReset03A1Contribution([sourceTurn]);
  const candidateObjects: ScientificContributionItem[] = [
    item(`question:${id}`, "SCIENTIFIC_QUESTION", "Comment évolue le remodelage ventriculaire gauche après infarctus ?", sourceTurn),
    item(`objective:${id}`, "OBJECTIVE", "Caractériser l’évolution longitudinale du remodelage ventriculaire gauche", sourceTurn, "PRIMARY"),
    item(`hypothesis:${id}`, "HYPOTHESIS", "Une évolution mesurable de la géométrie ventriculaire accompagne le remodelage", sourceTurn, "PRIMARY"),
    ...(options?.readyForMeasurements ? [
      item(`design:${id}`, "STUDY_DESIGN", "cohorte prospective longitudinale", sourceTurn),
      item(`population:${id}`, "POPULATION", "population clinique adulte avec condition, âge, éligibilité, inclusion et exclusion définis", sourceTurn),
      item(`intervention:${id}`, "INTERVENTION", "prise en charge standard observée", sourceTurn),
      item(`comparator:${id}`, "COMPARATOR", "groupe de référence", sourceTurn),
    ] : []),
    ...(options?.variable ? [item(`variable:${id}`, "CANONICAL_VARIABLE", options.variable, sourceTurn)] : []),
    ...(options?.imaging ? [item(`modality:${id}`, "MODALITY", "IRM cardiaque", sourceTurn)] : []),
  ];
  const contribution = {
    ...structuredClone(base),
    identity: {
      ...base.identity,
      contributionId: `contribution:obs:${id}`,
      contributionDigest: logicalDigest({ id, objects: candidateObjects.map((candidate) => candidate.itemId) }),
    },
    source: { ...base.source, originalRequest: sourceTurn.content, turns: [sourceTurn], sourceRefs: [sourceTurn.turnId] },
    scientificContent: {
      ...structuredClone(base.scientificContent),
      explicitStatements: [],
      candidateObjects,
      candidateRelations: [],
      temporalElements: [],
    },
  } as ScientificInterpretationContributionEnvelope;
  return confirmResearchProjectContribution({ contribution, current: null, projectId: `research-project:obs:${id}`, authority, confirmedAt: AT });
};

const declarationsFor = (project: ResearchProjectOwnerProjection) => {
  const snapshot = buildProjectContextSnapshot({ project });
  const conceptRef = snapshot.objects.find((object) => object.type === "OBJECTIVE")!.stableId;
  const property: ObservablePropertyDeclaration = {
    propertyRef: `observable-property:${project.projectId}:volume-change`,
    sourceConceptRef: conceptRef,
    label: "variation du volume ventriculaire gauche",
    rationale: "Cette propriété rend observable une dimension explicitement longitudinale du phénomène étudié.",
    prerequisites: ["référence temporelle comparable"],
    assumptions: ["comparabilité longitudinale"],
    limitations: ["dépend de la reproductibilité de la mesure"],
    uncertainty: [],
    provenanceRefs: [conceptRef],
  };
  const measurement = (suffix: string, label: string, domain: MeasurementDefinitionDeclaration["domain"] = "GENERAL", valueNature: MeasurementDefinitionDeclaration["valueNature"] = "CONTINUOUS"): MeasurementDefinitionDeclaration => ({
    measurementRef: `measurement-definition:${project.projectId}:${suffix}`,
    propertyRef: property.propertyRef,
    label,
    operationalDefinition: `Quantification de ${label} selon une définition reproductible à qualifier`,
    valueNature,
    domain,
    rationale: "Alternative de mesure explicitement fournie au runtime OBS.",
    prerequisites: ["procédure reproductible"],
    assumptions: [],
    limitations: [`limite propre à ${label}`],
    uncertainty: [],
    provenanceRefs: [conceptRef],
  });
  return { snapshot, property, measurement };
};

const executeWith = (project: ResearchProjectOwnerProjection, options?: {
  properties?: readonly ObservablePropertyDeclaration[];
  measurements?: readonly MeasurementDefinitionDeclaration[];
  roles?: readonly BiomarkerRoleDeclaration[];
}) => executeObservabilityMeasurementRuntime(buildObservabilityMeasurementInput({
  projectSnapshot: buildProjectContextSnapshot({ project }),
  observablePropertyDeclarations: options?.properties,
  measurementDefinitionDeclarations: options?.measurements,
  biomarkerRoleDeclarations: options?.roles,
}));

describe("SCIENTIFIC-STACK-OBS-01 — governed Observability / Measurement owner", () => {
  it("A/G — a broad phenomenon yields a structured need, never an invented MeasurementDefinition", () => {
    const result = executeWith(projectFrom("broad"));
    expect(result.resultStatus).toBe("INFORMATION_REQUIRED");
    expect(result.observableProperties).toEqual([]);
    expect(result.measurementDefinitions).toEqual([]);
    expect(result.informationNeeds).toEqual([expect.objectContaining({ status: "OPEN_NOT_RESOLVED" })]);
    expect(result.epistemicStatus).toBe("INSUFFICIENT_CONTEXT_UNKNOWN_PRESERVED");
  });

  it("B — an explicit property is represented without acquisition invention", () => {
    const project = projectFrom("property");
    const { property } = declarationsFor(project);
    const result = executeWith(project, { properties: [property] });
    expect(result.observableProperties).toEqual([expect.objectContaining({ propertyRef: property.propertyRef, candidateStatus: "PROPOSED_NOT_ADOPTED" })]);
    expect(result.measurementDefinitions).toEqual([]);
    expect(JSON.stringify(result)).not.toMatch(/bSSFP|slice thickness|field strength|contouring/i);
  });

  it("C/D — preserves multiple definitions and UNKNOWN biomarker roles without arbitrary selection", () => {
    const project = projectFrom("alternatives");
    const { property, measurement } = declarationsFor(project);
    const definitions = [measurement("volume", "volume télédiastolique"), measurement("mass", "masse ventriculaire")];
    const result = executeWith(project, { properties: [property], measurements: definitions });
    expect(result.measurementDefinitions.map((item) => item.measurementRef)).toEqual(definitions.map((item) => item.measurementRef));
    expect(result.biomarkerRoles).toHaveLength(2);
    expect(result.biomarkerRoles.every((role) => role.role === "UNKNOWN")).toBe(true);
    expect(result.candidateIsAdopted).toBe(false);
  });

  it("E/F — delegates imaging realization and biostatistical planning without producing their answers", () => {
    const project = projectFrom("handoffs", { imaging: true });
    const { property, measurement } = declarationsFor(project);
    const definition = measurement("imaging-volume", "volume télédiastolique ventriculaire", "IMAGING", "REPEATED_QUANTITATIVE");
    const result = executeWith(project, { properties: [property], measurements: [definition] });
    expect(result.downstreamHandoffs.map((item) => item.targetOwner)).toEqual(expect.arrayContaining(["BIOSTATISTICS", "IMAGING"]));
    expect(result.downstreamHandoffs.every((item) => item.status === "PROPOSED_NOT_EXECUTED" && item.ownershipTransferred === false)).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/bSSFP|épaisseur de coupe|modèle statistique|taille d'échantillon/i);
  });

  it("H — a Project CanonicalVariable remains distinct from ObservableProperty and MeasurementDefinition resolution", () => {
    const result = executeWith(projectFrom("variable", { variable: "remodelage ventriculaire gauche" }));
    expect(result.projectVariableRefs).toHaveLength(1);
    expect(result.observableProperties).toEqual([]);
    expect(result.measurementDefinitions).toEqual([]);
    expect(result.informationNeeds[0]?.scientificReason).toContain("CanonicalVariable");
  });

  it("I/J — discussion does not mutate Project; selection creates review and only confirmation creates vN+1", () => {
    const project = projectFrom("adoption");
    const { property, measurement } = declarationsFor(project);
    const result = executeWith(project, { properties: [property], measurements: [measurement("volume", "variation du volume télédiastolique")] });
    const before = JSON.stringify(project);
    expect(resolveObservabilityConversation({ raw: "Pourquoi mesurer les volumes plutôt que seulement la FEVG ?", result }).kind).toBe("DISCUSS");
    expect(JSON.stringify(project)).toBe(before);
    const resolution = resolveObservabilityConversation({ raw: "Je retiens la mesure 1.", result });
    expect(resolution.kind).toBe("SELECT_MEASUREMENT");
    if (resolution.kind !== "SELECT_MEASUREMENT") throw new Error("OBS_SELECTION_EXPECTED");
    const contribution = buildObservabilityMeasurementContribution({
      conversationId: "conversation:obs:adoption",
      project,
      result,
      measurementRef: resolution.measurementRef,
      proposalTurn: turn("proposal", "Propositions OBS", "NOXIA"),
      selectionTurn: turn("selection", "Je retiens la mesure 1."),
      createdAt: AT,
    });
    const candidate = prepareResearchProjectContributionCandidate(contribution, project);
    expect(candidate.status).toBe("CANDIDATE_PENDING_HUMAN_CONFIRMATION");
    expect(project.revision).toBe(1);
    const adopted = confirmResearchProjectContribution({
      contribution,
      current: project,
      projectId: project.projectId,
      authority,
      confirmedAt: "2026-09-03T10:00:02.000Z",
      reviewedProjection: candidate.humanReviewProjection,
    });
    expect(adopted.revision).toBe(2);
    expect(ensureCanonicalProjectState(adopted).objects.some((object) => object.objectType === "CANONICAL_VARIABLE" && object.content === "variation du volume télédiastolique")).toBe(true);
    expect(result.observableProperties[0]?.candidateStatus).toBe("PROPOSED_NOT_ADOPTED");
  });

  it("K — exact Project binding makes an OBS result stale after Project revision", () => {
    const project = projectFrom("stale", { readyForMeasurements: true });
    const navigation = buildFunctionalResetQueryNavigation({ project, recordedAt: AT });
    const dispatched = dispatchObservabilityFromQuery({
      project,
      navigation,
      ownerResultLedger: createProductOwnerResultLedger("session:obs:stale"),
      traceLedger: createScientificExecutionTraceLedger("session:obs:stale"),
      sessionId: "session:obs:stale",
      conversationId: "conversation:obs:stale",
      presentationTurnRef: "turn:obs:stale:presentation",
      startedAt: AT,
      completedAt: "2026-09-03T10:00:01.000Z",
    });
    const { property, measurement } = declarationsFor(project);
    const richer = executeWith(project, { properties: [property], measurements: [measurement("stale", "volume ventriculaire")] });
    const contribution = buildObservabilityMeasurementContribution({
      conversationId: "conversation:obs:stale",
      project,
      result: richer,
      measurementRef: richer.measurementDefinitions[0]!.measurementRef,
      proposalTurn: turn("stale-proposal", "Proposition", "NOXIA"),
      selectionTurn: turn("stale-selection", "Je retiens la mesure 1."),
      createdAt: AT,
    });
    const candidate = prepareResearchProjectContributionCandidate(contribution, project);
    const v2 = confirmResearchProjectContribution({ contribution, current: project, projectId: project.projectId, authority, confirmedAt: "2026-09-03T10:00:03.000Z", reviewedProjection: candidate.humanReviewProjection });
    expect(readProductObservabilityOwnerResult({
      ledger: dispatched.ownerResultLedger,
      resultId: dispatched.result.resultId,
      currentProjectSnapshot: buildProjectContextSnapshot({ project: v2 }),
    }).freshness.status).toBe("STALE_OWNER_RESULT");
    expect(observabilityInteractionMatchesCurrentProject(dispatched.interaction, v2)).toBe(false);
  });

  it("L — consumes ST/RDE owner results as non-transferring upstream handoffs", () => {
    const project = projectFrom("continuity", { variable: "volume ventriculaire", readyForMeasurements: true });
    const snapshot = buildProjectContextSnapshot({ project });
    const st = invokeScientificThinkingOwnerFromSnapshot({ projectSnapshot: snapshot, startedAt: AT, completedAt: AT }).result!;
    const rde = invokeStudyDesignOwnerFromSnapshot({ projectSnapshot: snapshot, startedAt: AT, completedAt: AT }).result!;
    const input = buildObservabilityMeasurementInput({ projectSnapshot: snapshot, upstreamOwnerResults: [st, rde] });
    expect(input.upstreamOwnerInputs.map((item) => item.owner)).toEqual(["SCIENTIFIC_THINKING", "STUDY_DESIGN"]);
    expect(input.upstreamOwnerInputs.every((item) => item.ownershipTransferred === false)).toBe(true);
    expect(input.upstreamOwnerInputs.flatMap((item) => item.informationNeeded).length).toBeGreaterThan(0);
    expect(executeObservabilityMeasurementRuntime(input).projectWriteAuthorized).toBe(false);

    const stInvocation = invokeScientificThinkingForProject({
      project,
      projectSnapshot: snapshot,
      ledger: createProductOwnerResultLedger("session:obs:continuity"),
      callerRef: "qry:st",
      purpose: "Qualifier la question scientifique.",
      startedAt: AT,
      completedAt: AT,
    });
    const rdeInvocation = invokeStudyDesignForProjectSnapshot({
      projectSnapshot: snapshot,
      ledger: stInvocation.ledger,
      callerRef: "qry:rde",
      purpose: "Qualifier le design.",
      startedAt: AT,
      completedAt: AT,
    });
    const obsInvocation = invokeObservabilityForProjectSnapshot({
      projectSnapshot: snapshot,
      ledger: rdeInvocation.ledger,
      callerRef: "qry:obs",
      purpose: "Qualifier l'observation.",
      startedAt: AT,
      completedAt: AT,
    });
    expect(obsInvocation.upstreamOwnerResults.map((result) => result.owner)).toEqual(["STUDY_DESIGN"]);
    expect(obsInvocation.entry.dependencies.map((dependency) => dependency.owner)).toEqual(["STUDY_DESIGN"]);
    expect(obsInvocation.entry.dependencies).toHaveLength(obsInvocation.request.nativeInput.upstreamOwnerInputs.length);
  });

  it("QRY/Standard/TRACE — dispatches only the governed missing measurement-set scope and preserves trace on/off product equivalence", () => {
    const project = projectFrom("standard", { readyForMeasurements: true });
    const navigation = buildFunctionalResetQueryNavigation({ project, recordedAt: AT });
    expect(isObservabilityQueryDispatch(navigation)).toBe(true);
    expect(navigation.currentAction).toMatchObject({ owner: "OBSERVABILITY_MEASUREMENT" });
    expect(navigation.selection.selected?.capabilityRef).toBe("OBSERVABILITY_QUALIFICATION");
    const invoke = (traceEnabled: boolean) => dispatchObservabilityFromQuery({
      project,
      navigation,
      ownerResultLedger: createProductOwnerResultLedger(`session:obs:${traceEnabled}`),
      traceLedger: createScientificExecutionTraceLedger(`session:obs:${traceEnabled}`),
      sessionId: `session:obs:${traceEnabled}`,
      conversationId: `conversation:obs:${traceEnabled}`,
      presentationTurnRef: `turn:obs:${traceEnabled}`,
      startedAt: AT,
      completedAt: "2026-09-03T10:00:01.000Z",
      traceEnabled,
    });
    const traced = invoke(true);
    const untraced = invoke(false);
    expect(traced.result).toEqual(untraced.result);
    expect(traced.presentation).toEqual(untraced.presentation);
    expect(traced).toMatchObject({ providerCalls: 0, projectWrites: 0, humanDecisionCreated: false });
    expect(traced.traceLedger.events.map((event) => event.eventType)).toEqual(expect.arrayContaining(["QRY_ACTION_SELECTED", "OWNER_INVOCATION_COMPLETED", "UI_PROJECTION"]));
    expect(traced.traceLedger.events.every((event) => event.owner !== "CONVERSATION_MODEL")).toBe(true);
    const capability = listSpecializedOwnerCapabilities().entries.find((entry) => entry.capabilityId === "OBSERVABILITY_QUALIFICATION");
    expect(capability).toMatchObject({ owner: "OBSERVABILITY_MEASUREMENT", status: "AVAILABLE_WITH_LIMITATIONS", readsProjectSnapshot: true, canWriteProject: false });

    const projectWithMeasurement = projectFrom("non-obs", { readyForMeasurements: true, variable: "volume télédiastolique principal" });
    const nonObsNavigation = buildFunctionalResetQueryNavigation({ project: projectWithMeasurement, recordedAt: AT });
    expect(isObservabilityQueryDispatch(nonObsNavigation)).toBe(false);
  });
});
