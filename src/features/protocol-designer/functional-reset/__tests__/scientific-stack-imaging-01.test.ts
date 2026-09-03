import { describe, expect, it } from "vitest";
import { logicalDigest } from "@/features/knowledge-engine";
import type { MeasurementDefinitionDeclaration, ObservablePropertyDeclaration } from "@/features/observability-measurement";
import type { ScientificContributionItem, ScientificInterpretationContributionEnvelope, ScientificInterpretationTurn } from "@/features/scientific-interpretation";
import {
  buildProjectContextSnapshot,
  confirmResearchProjectContribution,
  ensureCanonicalProjectState,
  listSpecializedOwnerCapabilities,
  prepareResearchProjectContributionCandidate,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import { buildFunctionalResetQueryNavigation } from "@/features/query-navigation";
import { invokeObservabilityForProjectSnapshot } from "@/features/protocol-designer/product-observability-owner-runtime";
import { invokeStudyDesignForProjectSnapshot } from "@/features/protocol-designer/product-study-design-owner-runtime";
import { createProductOwnerResultLedger, readProductOwnerResult } from "@/features/protocol-designer/product-owner-result-ledger";
import { createScientificExecutionTraceLedger } from "@/features/protocol-designer/scientific-execution-trace";
import { invokeImagingForProjectSnapshot } from "@/features/protocol-designer/product-imaging-owner-runtime";
import {
  prepareImagingAcquisitionContribution,
  dispatchImagingFromQuery,
  imagingInteractionMatchesCurrentProject,
  isImagingQueryDispatch,
  resolveImagingConversation,
} from "../imaging-standard";
import { makeFunctionalReset03A1Contribution } from "./functional-reset-03a1-fixtures";

const AT = "2026-09-03T12:00:00.000Z";
const authority = {
  actorRef: "researcher:scientific-stack-imaging-01",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const turn = (id: string, content: string, role: "USER" | "NOXIA" = "USER"): ScientificInterpretationTurn => ({
  turnId: `turn:imaging:${id}`,
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

const projectFrom = (id: string, options?: {
  modalities?: string[];
  acquisitions?: string[];
  design?: string;
  temporal?: string;
  retrospective?: boolean;
}) => {
  const sourceTurn = turn(id, "Construire une étude longitudinale du remodelage ventriculaire avec imagerie répétée.");
  const base = makeFunctionalReset03A1Contribution([sourceTurn]);
  const modalities = options?.modalities ?? ["IRM cardiaque"];
  const candidateObjects: ScientificContributionItem[] = [
    item(`question:${id}`, "SCIENTIFIC_QUESTION", "Comment évolue le remodelage ventriculaire gauche en imagerie ?", sourceTurn),
    item(`objective:${id}`, "OBJECTIVE", "Caractériser l’évolution longitudinale du remodelage ventriculaire gauche", sourceTurn, "PRIMARY"),
    item(`hypothesis:${id}`, "HYPOTHESIS", "Les volumes ventriculaires évoluent de façon mesurable", sourceTurn, "PRIMARY"),
    item(`design:${id}`, "STUDY_DESIGN", options?.design ?? "cohorte prospective longitudinale", sourceTurn),
    item(`population:${id}`, "POPULATION", "adultes avec condition, âge, éligibilité, inclusion et exclusion définis", sourceTurn),
    item(`intervention:${id}`, "INTERVENTION", "prise en charge standard observée", sourceTurn),
    item(`comparator:${id}`, "COMPARATOR", "groupe de référence", sourceTurn),
    item(`endpoint:${id}`, "ENDPOINT", "volume télédiastolique ventriculaire principal", sourceTurn, "PRIMARY"),
    ...modalities.map((label, index) => item(`modality:${id}:${index + 1}`, "MODALITY", label, sourceTurn)),
    ...(options?.acquisitions ?? []).map((label, index) => item(`acquisition:${id}:${index + 1}`, "ACQUISITION", label, sourceTurn)),
    item(`visit:${id}`, "VISIT", options?.temporal ?? "visites répétées selon le calendrier du Project", sourceTurn),
    item(`analysis:${id}`, "ANALYSIS_SPECIFICATION", "objectif d’analyse longitudinale descriptive", sourceTurn),
    ...(options?.retrospective ? [item(`constraint:${id}`, "CONSTRAINT", "images historiques déjà acquises, contenu et qualité inconnus", sourceTurn)] : []),
  ];
  const contribution = {
    ...structuredClone(base),
    identity: {
      ...base.identity,
      contributionId: `contribution:imaging:${id}`,
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
  return confirmResearchProjectContribution({ contribution, current: null, projectId: `research-project:imaging:${id}`, authority, confirmedAt: AT });
};

const measurementDeclarations = (project: ResearchProjectOwnerProjection) => {
  const snapshot = buildProjectContextSnapshot({ project });
  const conceptRef = snapshot.objects.find((object) => object.type === "OBJECTIVE")!.stableId;
  const property: ObservablePropertyDeclaration = {
    propertyRef: `observable-property:${project.projectId}:lv-volume`,
    sourceConceptRef: conceptRef,
    label: "volume télédiastolique ventriculaire gauche",
    rationale: "Propriété quantitative explicitement reliée à l’objectif longitudinal.",
    prerequisites: ["référence temporelle comparable"],
    assumptions: [],
    limitations: ["reproductibilité à qualifier"],
    uncertainty: [],
    provenanceRefs: [conceptRef],
  };
  const measurement: MeasurementDefinitionDeclaration = {
    measurementRef: `measurement-definition:${project.projectId}:lv-volume-imaging`,
    propertyRef: property.propertyRef,
    label: "volume télédiastolique dérivé des images",
    operationalDefinition: "Mesure quantitative issue d’une acquisition et d’une lecture Imaging reproductibles.",
    valueNature: "REPEATED_QUANTITATIVE",
    domain: "IMAGING",
    rationale: "La réalisation spécialisée appartient à Imaging.",
    prerequisites: ["acquisition comparable"],
    assumptions: [],
    limitations: ["dépend de la qualité d’image"],
    uncertainty: [],
    provenanceRefs: [conceptRef],
  };
  return { property, measurement };
};

const ledgerWithRdeAndObs = (project: ResearchProjectOwnerProjection, sessionId: string) => {
  const snapshot = buildProjectContextSnapshot({ project });
  const rde = invokeStudyDesignForProjectSnapshot({
    projectSnapshot: snapshot,
    ledger: createProductOwnerResultLedger(sessionId),
    callerRef: "qry:rde",
    purpose: "Qualifier le design longitudinal.",
    startedAt: AT,
    completedAt: AT,
  });
  const { property, measurement } = measurementDeclarations(project);
  return invokeObservabilityForProjectSnapshot({
    projectSnapshot: snapshot,
    ledger: rde.ledger,
    callerRef: "qry:obs",
    purpose: "Qualifier la mesure avant spécialisation Imaging.",
    startedAt: AT,
    completedAt: AT,
    observablePropertyDeclarations: [property],
    measurementDefinitionDeclarations: [measurement],
  }).ledger;
};

describe("SCIENTIFIC-STACK-IMAGING-01 — governed Imaging owner", () => {
  it("A/E — an adopted modality remains unresolved and yields structured needs without protocol invention", () => {
    const project = projectFrom("modality-only");
    const invocation = invokeImagingForProjectSnapshot({
      projectSnapshot: buildProjectContextSnapshot({ project }),
      ledger: createProductOwnerResultLedger("session:imaging:modality-only"),
      callerRef: "qry:imaging",
      purpose: "Spécialiser l'imagerie.",
      startedAt: AT,
      completedAt: AT,
    });
    const result = invocation.result!.nativePayload!;
    expect(result.modalityCandidates.map((candidate) => candidate.label)).toEqual(["IRM"]);
    expect(result.acquisitionStrategies).toEqual([]);
    expect(result.missingInformation.length).toBeGreaterThan(0);
    expect(JSON.stringify(result)).not.toMatch(/TR\s*=|TE\s*=|flip angle\s*=|matrice\s*=/i);
    expect(result.projectWriteAuthorized).toBe(false);
  });

  it("B — preserves IRM and echocardiography as non-ranked modality branches", () => {
    const project = projectFrom("multimodal", { modalities: ["IRM cardiaque", "échocardiographie"] });
    const invocation = invokeImagingForProjectSnapshot({
      projectSnapshot: buildProjectContextSnapshot({ project }),
      ledger: ledgerWithRdeAndObs(project, "session:imaging:multimodal"),
      callerRef: "qry:imaging",
      purpose: "Comparer les rôles complémentaires.",
      startedAt: AT,
      completedAt: AT,
    });
    const result = invocation.result!.nativePayload!;
    expect(result.modalityCandidates.map((candidate) => candidate.label)).toEqual(expect.arrayContaining(["IRM", "échocardiographie"]));
    expect(result.modalityCandidates.every((candidate) => candidate.role === "CANDIDATE")).toBe(true);
    expect(result.modalityComparison[0]).toMatchObject({ notice: "NO_AUTOMATIC_RANKING" });
  });

  it("C/D — consumes OBS and RDE as exact non-transferring lineage and translates longitudinal consequences", () => {
    const project = projectFrom("lineage");
    const ledger = ledgerWithRdeAndObs(project, "session:imaging:lineage");
    const invocation = invokeImagingForProjectSnapshot({
      projectSnapshot: buildProjectContextSnapshot({ project }),
      ledger,
      callerRef: "qry:imaging",
      purpose: "Spécialiser la mesure Imaging.",
      startedAt: AT,
      completedAt: AT,
    });
    const result = invocation.result!.nativePayload!;
    expect(invocation.entry.dependencies.map((dependency) => dependency.owner)).toEqual(expect.arrayContaining(["OBSERVABILITY_MEASUREMENT", "STUDY_DESIGN"]));
    expect(result.sourceOwnerLineage?.map((lineage) => lineage.sourceOwner)).toEqual(expect.arrayContaining(["RESEARCH_PROJECT", "OBSERVABILITY_MEASUREMENT", "STUDY_DESIGN"]));
    expect(result.sourceOwnerLineage?.every((lineage) => lineage.ownershipTransferred === false)).toBe(true);
    expect(result.biomarkerCandidates.some((candidate) => candidate.measurementType === "OBS_MEASUREMENT_DEFINITION_SPECIALIZATION_NEED")).toBe(true);
    expect(result.timingStrategy.some((timing) => /répétées comparables/i.test(timing.value))).toBe(true);
    expect(ensureCanonicalProjectState(project).objects.find((object) => object.objectType === "STUDY_DESIGN")?.content).toContain("longitudinale");
  });

  it("F/G/H/I/O — distinguishes retrospective uncertainty, prospective standardization, acquisition, quality and equipment UNKNOWN", () => {
    const project = projectFrom("technical", {
      acquisitions: ["Acquisition IRM ventriculaire à standardiser"],
      temporal: "visites répétées selon le calendrier du Project",
      retrospective: true,
    });
    const invocation = invokeImagingForProjectSnapshot({
      projectSnapshot: buildProjectContextSnapshot({ project }),
      ledger: ledgerWithRdeAndObs(project, "session:imaging:technical"),
      callerRef: "qry:imaging",
      purpose: "Qualifier faisabilité, qualité et comparabilité.",
      startedAt: AT,
      completedAt: AT,
    });
    const result = invocation.result!.nativePayload!;
    expect(result.acquisitionStrategies[0]?.level2.acquisitionFamily).toContain("Acquisition IRM ventriculaire");
    expect(result.qualityStrategy.length).toBeGreaterThan(0);
    expect(result.qualityStrategy.some((rule) => /complétude|validité/i.test(rule.acceptanceConcept))).toBe(true);
    expect(result.missingInformation.concat(result.limitations, result.projectConstructionHandoff.unknowns).join(" ")).toMatch(/inconnu|inconnue|unknown/i);
    expect(result.equipmentAssessment.every((assessment) => assessment.compatibility === "UNKNOWN_COMPATIBILITY")).toBe(true);
    expect(result.equipmentAssessment.every((assessment) => assessment.availability === "UNKNOWN")).toBe(true);
    expect(JSON.stringify(result.equipmentAssessment)).not.toMatch(/siemens|philips|ge healthcare|canon/i);
  });

  it("J — emits Biostatistics and Data Management handoffs without analytical answer", () => {
    const project = projectFrom("handoffs");
    const invocation = invokeImagingForProjectSnapshot({
      projectSnapshot: buildProjectContextSnapshot({ project }),
      ledger: ledgerWithRdeAndObs(project, "session:imaging:handoffs"),
      callerRef: "qry:imaging",
      purpose: "Qualifier les handoffs.",
      startedAt: AT,
      completedAt: AT,
    });
    const result = invocation.result!.nativePayload!;
    expect(result.downstreamHandoffs?.map((handoff) => handoff.targetOwner)).toEqual(expect.arrayContaining(["BIOSTATISTICS", "DATA_MANAGEMENT"]));
    expect(result.downstreamHandoffs?.every((handoff) => handoff.status === "PROPOSED_NOT_EXECUTED" && handoff.ownershipTransferred === false)).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/mixed.effects model|modèle mixte|taille d'échantillon|imputation multiple/i);
  });

  it("K/L — discussion does not mutate Project; selection creates Human Review and confirmation alone increments Project", () => {
    const project = projectFrom("adoption");
    const invocation = invokeImagingForProjectSnapshot({
      projectSnapshot: buildProjectContextSnapshot({ project }),
      ledger: ledgerWithRdeAndObs(project, "session:imaging:adoption"),
      callerRef: "qry:imaging",
      purpose: "Qualifier l'acquisition.",
      startedAt: AT,
      completedAt: AT,
    });
    const result = invocation.result!.nativePayload!;
    const before = JSON.stringify(project);
    expect(resolveImagingConversation({ raw: "Pourquoi garder l’échographie si l’IRM est plus complète ?", result }).kind).toBe("DISCUSS");
    expect(JSON.stringify(project)).toBe(before);
    const optionRef = result.acquisitionStrategies[0]!.acquisitionId;
    const contribution = prepareImagingAcquisitionContribution({
      conversationId: "conversation:imaging:adoption",
      project,
      result,
      optionRef,
      proposalTurn: turn("proposal", "Propositions Imaging", "NOXIA"),
      selectionTurn: turn("selection", "Je retiens cette acquisition."),
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
      confirmedAt: "2026-09-03T12:00:02.000Z",
      reviewedProjection: candidate.humanReviewProjection,
    });
    expect(adopted.revision).toBe(2);
    expect(ensureCanonicalProjectState(adopted).objects.some((object) => object.objectType === "ACQUISITION")).toBe(true);
    expect(buildFunctionalResetQueryNavigation({ project: adopted, recordedAt: AT }).selection.candidates
      .some((candidate) => candidate.affectedBranchRefs.includes("project-facet:IMAGING:IMAGING_ROLE"))).toBe(false);
  });

  it("M — exact Project identity makes an old result and Standard interaction stale", () => {
    const project = projectFrom("stale");
    const navigation = buildFunctionalResetQueryNavigation({ project, recordedAt: AT });
    const dispatched = dispatchImagingFromQuery({
      project,
      navigation,
      ownerResultLedger: createProductOwnerResultLedger("session:imaging:stale"),
      traceLedger: createScientificExecutionTraceLedger("session:imaging:stale"),
      sessionId: "session:imaging:stale",
      conversationId: "conversation:imaging:stale",
      presentationTurnRef: "turn:imaging:stale:presentation",
      startedAt: AT,
      completedAt: AT,
    });
    const v2 = {
      ...project,
      versionId: `${project.projectId}:version:2`,
      previousVersionId: project.versionId,
      revision: 2,
      projectDigest: logicalDigest({ previous: project.projectDigest, change: "quality-constraint" }),
    };
    expect(readProductOwnerResult({
      ledger: dispatched.ownerResultLedger,
      resultId: dispatched.result.resultId,
      currentProjectSnapshot: buildProjectContextSnapshot({ project: v2 }),
      expectedOwner: "IMAGING",
    }).freshness.status).toBe("STALE_OWNER_RESULT");
    expect(imagingInteractionMatchesCurrentProject(dispatched.interaction, v2)).toBe(false);
  });

  it("N/QRY/TRACE — dispatches only selected Imaging specialization and preserves trace on/off equivalence", () => {
    const project = projectFrom("standard");
    const navigation = buildFunctionalResetQueryNavigation({ project, recordedAt: AT });
    expect(isImagingQueryDispatch(navigation)).toBe(true);
    expect(navigation.currentAction).toMatchObject({ owner: "IMAGING" });
    expect(navigation.selection.selected?.capabilityRef).toBe("IMAGING_STUDY_DESIGN");
    const invoke = (traceEnabled: boolean) => dispatchImagingFromQuery({
      project,
      navigation,
      ownerResultLedger: createProductOwnerResultLedger(`session:imaging:${traceEnabled}`),
      traceLedger: createScientificExecutionTraceLedger(`session:imaging:${traceEnabled}`),
      sessionId: `session:imaging:${traceEnabled}`,
      conversationId: `conversation:imaging:${traceEnabled}`,
      presentationTurnRef: `turn:imaging:${traceEnabled}`,
      startedAt: AT,
      completedAt: AT,
      traceEnabled,
    });
    const traced = invoke(true);
    const untraced = invoke(false);
    expect(traced.result).toEqual(untraced.result);
    expect(traced.presentation).toEqual(untraced.presentation);
    expect(traced).toMatchObject({ providerCalls: 0, projectWrites: 0, humanDecisionCreated: false });
    expect(traced.traceLedger.events.map((event) => event.eventType)).toEqual(expect.arrayContaining(["QRY_ACTION_SELECTED", "OWNER_INVOCATION_COMPLETED", "UI_PROJECTION"]));
    const noImagingProject = projectFrom("non-imaging", { modalities: [] });
    expect(isImagingQueryDispatch(buildFunctionalResetQueryNavigation({ project: noImagingProject, recordedAt: AT }))).toBe(false);
    expect(listSpecializedOwnerCapabilities().entries.find((entry) => entry.capabilityId === "IMAGING_STUDY_DESIGN")).toMatchObject({ owner: "IMAGING", status: "AVAILABLE_WITH_LIMITATIONS", readsProjectSnapshot: true, canWriteProject: false });
  });
});
