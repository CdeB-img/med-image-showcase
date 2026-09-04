import { describe, expect, it } from "vitest";
import { logicalDigest, stableStringify } from "@/features/knowledge-engine";
import type {
  ScientificContributionItem,
  ScientificContributionRelation,
  ScientificInterpretationContributionEnvelope,
  ScientificInterpretationTurn,
} from "@/features/scientific-interpretation";
import {
  buildProjectContextSnapshot,
  confirmResearchProjectContribution,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import {
  attachProductKnowledgePrerequisite,
  buildFunctionalResetQueryNavigation,
  createProductKnowledgePrerequisiteAction,
} from "@/features/query-navigation";
import { createProductOwnerResultLedger } from "@/features/protocol-designer/product-owner-result-ledger";
import {
  executeCurrentOwnerStackValidationProfile,
  validateCurrentOwnerStackForProject,
} from "@/features/protocol-designer/product-current-owner-stack-validation-runtime";
import { createProductValidationRunLedger } from "@/features/protocol-designer/product-validation-run-ledger";
import { createScientificExecutionTraceLedger } from "@/features/protocol-designer/scientific-execution-trace";
import { attachCurrentKnowledgePrerequisiteWhenRequired, dispatchKnowledgePrerequisiteFromQuery } from "../knowledge-standard";
import {
  buildStandardObservabilityDeclarations,
  dispatchObservabilityFromQuery,
  isObservabilityQueryDispatch,
} from "../observability-standard";
import { dispatchRegulatoryFromQuery, isRegulatoryQueryDispatch } from "../regulatory-standard";
import { makeFunctionalReset03A1Contribution } from "./functional-reset-03a1-fixtures";

const AT = "2026-09-04T10:00:00.000Z";
const authority = {
  actorRef: "pre-integrated-owners:researcher",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const sourceTurn: ScientificInterpretationTurn = {
  turnId: "turn:pre-integrated-owners:1",
  role: "USER",
  content: "Projet structuré pour qualification déterministe des connexions owner.",
  createdAt: AT,
};

const boundary = () => ({
  ownership: "USER",
  epistemicStatus: "EXPLICIT_USER_STATED",
  adoptionStatus: "CANDIDATE",
  activeState: true,
  sourceTurnIds: [sourceTurn.turnId],
  sourceText: sourceTurn.content,
});

const item = (id: string, proposedType: string, content: string, studyRole: string | null = proposedType): ScientificContributionItem => ({
  itemId: id,
  semanticIdentity: id,
  proposedType,
  content,
  polarity: "AFFIRMED",
  studyRole,
  confidence: 1,
  previousItemIds: [],
  epistemicBoundary: boundary(),
});

const relation = (id: string, relationType: string, sourceItemId: string, targetItemId: string): ScientificContributionRelation => ({
  relationId: id,
  relationType,
  sourceItemId,
  targetItemId,
  polarity: "AFFIRMED",
  confidence: 1,
  evidenceRefs: [],
  epistemicBoundary: boundary(),
});

const commonItems = (designRole: "OBSERVATIONAL" | "INTERVENTIONAL") => [
  item("question:primary", "SCIENTIFIC_QUESTION", "La mesure principale diffère-t-elle entre les groupes ?", "PRIMARY"),
  item("objective:primary", "OBJECTIVE", "Comparer longitudinalement la mesure principale", "PRIMARY"),
  item("hypothesis:primary", "HYPOTHESIS", "Une différence mesurable est attendue", "PRIMARY"),
  item("condition:population", "CONDITION", "Population clinique adulte avec âge, critères d'inclusion et exclusions définis", "POPULATION"),
  item("eligibility:population", "ELIGIBILITY_CRITERION", "Âge, inclusion et exclusion explicitement définis", "ELIGIBILITY"),
  item("design:primary", "STUDY_DESIGN", designRole === "INTERVENTIONAL" ? "Essai interventionnel" : "Cohorte observationnelle", designRole),
  item("intervention:primary", "INTERVENTION_OR_EXPOSURE", designRole === "INTERVENTIONAL" ? "Intervention étudiée" : "Exposition observée", designRole === "INTERVENTIONAL" ? "MEDICINAL_PRODUCT" : "EXPOSURE"),
  item("comparator:primary", "COMPARATOR", "Groupe comparateur", "COMPARATOR_ARM"),
  item("modality:mri", "IMAGING_MODALITY", "IRM", "IMAGING_MODALITY"),
  item("acquisition:mri", "ACQUISITION", "Acquisition d'imagerie, rôle, qualité, comparabilité et faisabilité à définir", "IMAGING_ACQUISITION"),
  item("visit:follow-up", "VISIT", "Visite initiale et suivi longitudinal", "FOLLOW_UP"),
  item("analysis:primary", "ANALYSIS_SPECIFICATION", "Objectif d'analyse comparative longitudinale", "PRIMARY_ANALYSIS"),
];

const projectFrom = (id: string, candidateObjects: ScientificContributionItem[], candidateRelations: ScientificContributionRelation[] = []) => {
  const base = makeFunctionalReset03A1Contribution([sourceTurn]);
  const contribution: ScientificInterpretationContributionEnvelope = {
    ...structuredClone(base),
    identity: {
      ...base.identity,
      contributionId: `contribution:${id}`,
      contributionDigest: logicalDigest({ id, objects: candidateObjects.map((object) => object.itemId), relations: candidateRelations.map((candidate) => candidate.relationId) }),
    },
    source: { ...base.source, originalRequest: sourceTurn.content, turns: [sourceTurn], sourceRefs: [sourceTurn.turnId] },
    scientificContent: {
      ...structuredClone(base.scientificContent),
      explicitStatements: [],
      candidateObjects,
      candidateRelations,
      temporalElements: [],
      expectedVariableOccasions: [],
    },
  };
  return confirmResearchProjectContribution({ contribution, current: null, projectId: `research-project:${id}`, authority, confirmedAt: AT });
};

const obsProject = () => projectFrom("obs-current", [
  ...commonItems("OBSERVATIONAL"),
  item("measurement:primary", "CANONICAL_VARIABLE", "Critère principal", "PRIMARY"),
  item("property:volume", "CANONICAL_VARIABLE", "Variation du volume ventriculaire", "OBSERVABLE_PROPERTY"),
  item("measurement:volume", "CANONICAL_VARIABLE", "Volume ventriculaire quantifié en IRM", "MEASUREMENT_DEFINITION"),
  item("need:agreement", "DATA_NEED", "Qualifier l'accord, le biais et la précision de cette mesure", "OBS_QUALIFICATION:AGREEMENT_BIAS_PRECISION"),
  item("need:reference", "DATA_NEED", "Préciser le comparateur ou standard de référence", "OBS_QUALIFICATION:REFERENCE_STANDARD_OR_COMPARATOR"),
], [
  relation("relation:concept-property", "SCIENTIFIC_CONCEPT_OPERATIONALIZED_BY_OBSERVABLE_PROPERTY", "objective:primary", "property:volume"),
  relation("relation:property-measurement", "OBSERVABLE_PROPERTY_MEASURED_BY_DEFINITION", "property:volume", "measurement:volume"),
  relation("relation:measurement-imaging", "MEASUREMENT_REALIZED_BY_IMAGING", "measurement:volume", "modality:mri"),
  relation("relation:agreement-measurement", "QUALIFIES_MEASUREMENT", "need:agreement", "measurement:volume"),
  relation("relation:reference-measurement", "QUALIFIES_MEASUREMENT", "need:reference", "measurement:volume"),
]);

const regProject = () => projectFrom("reg-current", [
  ...commonItems("INTERVENTIONAL"),
  item("measurement:primary", "CANONICAL_VARIABLE", "Critère principal", "PRIMARY"),
  item("jurisdiction:fr", "PROJECT_INFORMATION", "France", "JURISDICTION:FR"),
]);

const attachKnowledge = (input: {
  project: ResearchProjectOwnerProjection;
  navigation: ReturnType<typeof buildFunctionalResetQueryNavigation>;
  owner: "OBSERVABILITY_MEASUREMENT" | "REG";
  capability: "OBSERVABILITY_QUALIFICATION" | "REGULATORY_REQUIREMENT_RESOLUTION";
  needId: string;
  needClass: string;
  sourceId: string;
  purpose: string;
}) => {
  const snapshot = buildProjectContextSnapshot({ project: input.project });
  const action = createProductKnowledgePrerequisiteAction({
    selectedActionRef: input.navigation.currentAction!.selectedActionId,
    projectId: input.project.projectId,
    projectVersion: input.project.versionId,
    projectDigest: input.project.projectDigest,
    targetOwner: input.owner,
    targetCapability: input.capability,
    knowledgeNeed: { needId: input.needId, needClass: input.needClass, owner: input.owner, sourcePreferences: [input.sourceId], includeHistorical: false, maxSources: 1, maxSectionsPerSource: 2 },
    purpose: input.purpose,
    scientificObjects: snapshot.objects.slice(0, 3).map((object) => ({ objectId: object.stableId, originalTerm: object.content, role: "CONTEXT" })),
    context: { jurisdiction: input.owner === "REG" ? "FR" : null },
    relationRefs: snapshot.relations.map((candidate) => candidate.stableId),
    provenanceRefs: [input.navigation.currentAction!.selectedActionId, snapshot.snapshotDigest],
  });
  return attachProductKnowledgePrerequisite(input.navigation, action);
};

const knowledgeFor = (input: Parameters<typeof attachKnowledge>[0]) => {
  const navigation = attachKnowledge(input);
  return dispatchKnowledgePrerequisiteFromQuery({
    project: input.project,
    navigation,
    ownerResultLedger: createProductOwnerResultLedger(`session:${input.owner}`),
    traceLedger: createScientificExecutionTraceLedger(`session:${input.owner}`),
    sessionId: `session:${input.owner}`,
    conversationId: `conversation:${input.owner}`,
    startedAt: AT,
    completedAt: "2026-09-04T10:00:01.000Z",
  });
};

describe("PRE-INTEGRATED Gate 3 — OBS minimal mechanic completion", () => {
  it("executes the QRY-governed Knowledge prerequisite before the Standard OBS owner", () => {
    const project = obsProject();
    const navigation = attachCurrentKnowledgePrerequisiteWhenRequired({
      project,
      navigation: buildFunctionalResetQueryNavigation({ project, recordedAt: AT }),
    });
    const knowledge = dispatchKnowledgePrerequisiteFromQuery({
      project,
      navigation,
      ownerResultLedger: createProductOwnerResultLedger("session:obs-standard-chain"),
      traceLedger: createScientificExecutionTraceLedger("session:obs-standard-chain"),
      sessionId: "session:obs-standard-chain",
      conversationId: "conversation:obs-standard-chain",
      startedAt: AT,
      completedAt: "2026-09-04T10:00:01.000Z",
    });
    expect(navigation.knowledgePrerequisite).toMatchObject({ owner: "QUERY_NAVIGATION", targetOwner: "OBSERVABILITY_MEASUREMENT", knowledgeNeed: { needId: "OKC01-N-020" } });
    expect(knowledge.targetOwnerDispatchAuthorized).toBe(true);
    const obs = dispatchObservabilityFromQuery({
      project,
      navigation,
      ownerResultLedger: knowledge.ownerResultLedger,
      traceLedger: knowledge.traceLedger,
      sessionId: "session:obs-standard-chain",
      conversationId: "conversation:obs-standard-chain",
      presentationTurnRef: "turn:obs-standard-chain",
      startedAt: "2026-09-04T10:00:01.000Z",
      completedAt: "2026-09-04T10:00:02.000Z",
      knowledgeHandoff: knowledge.handoff,
    });
    expect(obs.ownerResultLedger.entries.map((entry) => entry.result?.owner)).toEqual(["KNOWLEDGE", "OBSERVABILITY_MEASUREMENT"]);
    expect(obs.result.knowledgeEvidence?.handoffId).toBe(knowledge.handoff.handoffId);
  });

  it("builds declarations only from explicit Project objects and relationships", () => {
    const project = obsProject();
    const navigation = buildFunctionalResetQueryNavigation({ project, recordedAt: AT });
    expect(isObservabilityQueryDispatch(navigation)).toBe(true);
    const declarations = buildStandardObservabilityDeclarations(buildProjectContextSnapshot({ project }));
    expect(declarations.properties).toHaveLength(1);
    expect(declarations.measurements).toEqual([expect.objectContaining({ domain: "IMAGING", valueNature: "UNKNOWN" })]);
    expect(declarations.qualifications.map((item) => item.dimension)).toContain("AGREEMENT_BIAS_PRECISION");
  });

  it("retains Knowledge evidence and exposes validity/performance needs without selecting a metric", () => {
    const project = obsProject();
    const navigation = buildFunctionalResetQueryNavigation({ project, recordedAt: AT });
    const projectBefore = stableStringify(project);
    const knowledge = knowledgeFor({ project, navigation, owner: "OBSERVABILITY_MEASUREMENT", capability: "OBSERVABILITY_QUALIFICATION", needId: "OKC01-N-020", needClass: "OBSERVABLE_PROPERTY_AND_MEASUREMENT_ALTERNATIVES", sourceId: "RC01-A-017", purpose: "Imaging modality measurement endpoint." });
    const output = dispatchObservabilityFromQuery({
      project,
      navigation,
      ownerResultLedger: knowledge.ownerResultLedger,
      traceLedger: knowledge.traceLedger,
      sessionId: "session:obs-current",
      conversationId: "conversation:obs-current",
      presentationTurnRef: "turn:obs-presentation",
      startedAt: "2026-09-04T10:00:02.000Z",
      completedAt: "2026-09-04T10:00:03.000Z",
      knowledgeHandoff: knowledge.handoff,
    });
    expect(output.result.validityPerformanceQualifications).toEqual(expect.arrayContaining([
      expect.objectContaining({ dimension: "AGREEMENT_BIAS_PRECISION", analyticalMethodSelected: false, scientificConclusionClaimed: false }),
    ]));
    expect(output.result.knowledgeEvidence).toMatchObject({ handoffId: knowledge.handoff.handoffId, certaintyIncreaseAuthorized: false, projectWriteAuthorized: false });
    expect(output.result.downstreamHandoffs.map((handoff) => handoff.targetOwner)).toEqual(expect.arrayContaining(["IMAGING", "BIOSTATISTICS"]));
    expect(output.result.validityPerformanceQualifications.every((item) => !/ICC|Bland|AUC|sample size/i.test(item.purpose))).toBe(true);
    expect(output.ownerResultLedger.entries.at(-1)?.dependencies.some((dependency) => dependency.owner === "KNOWLEDGE")).toBe(true);
    expect(stableStringify(project)).toBe(projectBefore);
    expect(output.projectWrites).toBe(0);
  });

  it("keeps a broad Project variable fail-closed", () => {
    const project = projectFrom("obs-broad", [...commonItems("OBSERVATIONAL"), item("variable:broad", "CANONICAL_VARIABLE", "Remodelage cardiaque", "PRIMARY")]);
    const declarations = buildStandardObservabilityDeclarations(buildProjectContextSnapshot({ project }));
    expect(declarations).toEqual({ properties: [], measurements: [], qualifications: [] });
  });
});

describe("PRE-INTEGRATED Gate 4 — QRY-governed REG product connection", () => {
  it("executes current Knowledge evidence before the Standard REG-001 adapter", () => {
    const project = regProject();
    const navigation = attachCurrentKnowledgePrerequisiteWhenRequired({
      project,
      navigation: buildFunctionalResetQueryNavigation({ project, recordedAt: AT }),
    });
    const knowledge = dispatchKnowledgePrerequisiteFromQuery({
      project,
      navigation,
      ownerResultLedger: createProductOwnerResultLedger("session:reg-standard-chain"),
      traceLedger: createScientificExecutionTraceLedger("session:reg-standard-chain"),
      sessionId: "session:reg-standard-chain",
      conversationId: "conversation:reg-standard-chain",
      startedAt: AT,
      completedAt: "2026-09-04T10:00:01.000Z",
    });
    expect(navigation.knowledgePrerequisite).toMatchObject({ owner: "QUERY_NAVIGATION", targetOwner: "REG", knowledgeNeed: { needId: "OKC01-N-062", jurisdictionTarget: "FR" } });
    expect(knowledge.targetOwnerDispatchAuthorized).toBe(true);
    const reg = dispatchRegulatoryFromQuery({
      project,
      navigation,
      ownerResultLedger: knowledge.ownerResultLedger,
      traceLedger: knowledge.traceLedger,
      sessionId: "session:reg-standard-chain",
      conversationId: "conversation:reg-standard-chain",
      startedAt: "2026-09-04T10:00:01.000Z",
      completedAt: "2026-09-04T10:00:02.000Z",
      knowledgeHandoff: knowledge.handoff,
    });
    expect(reg.ownerResultLedger.entries.map((entry) => entry.result?.owner)).toEqual(["KNOWLEDGE", "REGULATORY_RESOLUTION"]);
    expect(reg.currentEvidence?.handoffId).toBe(knowledge.handoff.handoffId);
  });

  it("dispatches REG-001 only for an explicit structured regulatory branch and retains current Knowledge evidence", () => {
    const project = regProject();
    const navigation = buildFunctionalResetQueryNavigation({ project, recordedAt: AT });
    expect(isRegulatoryQueryDispatch(navigation)).toBe(true);
    const projectBefore = stableStringify(project);
    const knowledge = knowledgeFor({ project, navigation, owner: "REG", capability: "REGULATORY_REQUIREMENT_RESOLUTION", needId: "OKC01-N-067", needClass: "FDA_COMPARATIVE_METHODOLOGICAL_VALUE", sourceId: "RC01-A-017", purpose: "Clinical trial imaging endpoint process standards." });
    const output = dispatchRegulatoryFromQuery({
      project,
      navigation,
      ownerResultLedger: knowledge.ownerResultLedger,
      traceLedger: knowledge.traceLedger,
      sessionId: "session:reg-current",
      conversationId: "conversation:reg-current",
      startedAt: "2026-09-04T10:00:02.000Z",
      completedAt: "2026-09-04T10:00:03.000Z",
      knowledgeHandoff: knowledge.handoff,
    });
    expect(output.currentEvidence).toMatchObject({ adapterId: "REG001_CURRENT_KNOWLEDGE_EVIDENCE_ADAPTER", regulatoryRequirementCreated: false, projectWriteAuthorized: false });
    expect(output.currentEvidence?.sources[0]).toMatchObject({ sourceId: "RC01-A-017", jurisdiction: "US", candidateRequirementPromoted: false });
    expect(output.result.missingInformation.some((item) => item.field === "currentReferenceEvidence.applicability")).toBe(true);
    expect(output.result.applicableRequirements.every((item) => !item.sourceIds.includes("RC01-A-017"))).toBe(true);
    expect(output.ownerResultLedger.entries.at(-1)?.dependencies.some((dependency) => dependency.owner === "KNOWLEDGE")).toBe(true);
    expect(output.presentation.plainText).toContain("ne conclut ni à la conformité ni à l’adoption");
    expect(stableStringify(project)).toBe(projectBefore);
    expect(output.projectWrites).toBe(0);
  });

  it("does not trigger REG for a non-regulatory observational scope", () => {
    const project = projectFrom("non-reg", [...commonItems("OBSERVATIONAL"), item("measurement:primary", "CANONICAL_VARIABLE", "Critère principal", "PRIMARY")]);
    const navigation = buildFunctionalResetQueryNavigation({ project, recordedAt: AT });
    expect(navigation.selection.candidates.some((candidate) => candidate.owner === "REGULATORY_RESOLUTION")).toBe(false);
    expect(isRegulatoryQueryDispatch(navigation)).toBe(false);
  });
});

describe("PRE-INTEGRATED Gate 5 — current owner-stack VAL profile", () => {
  const currentObsInvocation = () => {
    const project = obsProject();
    const navigation = buildFunctionalResetQueryNavigation({ project, recordedAt: AT });
    const knowledge = knowledgeFor({ project, navigation, owner: "OBSERVABILITY_MEASUREMENT", capability: "OBSERVABILITY_QUALIFICATION", needId: "OKC01-N-020", needClass: "OBSERVABLE_PROPERTY_AND_MEASUREMENT_ALTERNATIVES", sourceId: "RC01-A-017", purpose: "Imaging modality measurement endpoint." });
    const output = dispatchObservabilityFromQuery({
      project,
      navigation,
      ownerResultLedger: knowledge.ownerResultLedger,
      traceLedger: knowledge.traceLedger,
      sessionId: "session:obs-val",
      conversationId: "conversation:obs-val",
      presentationTurnRef: "turn:obs-val-presentation",
      startedAt: "2026-09-04T10:00:02.000Z",
      completedAt: "2026-09-04T10:00:03.000Z",
      knowledgeHandoff: knowledge.handoff,
    });
    return { project, navigation, knowledge, output, snapshot: buildProjectContextSnapshot({ project }) };
  };

  it("validates a current Knowledge→OBS chain without the historical OBS-absence literal", () => {
    const { project, navigation, knowledge, output, snapshot } = currentObsInvocation();
    const projectBefore = stableStringify(project);
    const ledgerBefore = stableStringify(output.ownerResultLedger);
    const validation = validateCurrentOwnerStackForProject({
      project,
      projectSnapshot: snapshot,
      ownerResultLedger: output.ownerResultLedger,
      validationLedger: createProductValidationRunLedger("session:current-val"),
      expectations: [
        { owner: "OBSERVABILITY_MEASUREMENT", required: true, requirementRef: "project-decision:OBSERVABILITY_QUALIFICATION", selectedActionRef: navigation.currentAction!.selectedActionId, knowledgeRequired: true },
        { owner: "REGULATORY_RESOLUTION", required: false, requirementRef: "not-applicable:reg", selectedActionRef: null, knowledgeRequired: false },
      ],
      projectionBindings: [
        { projectionOwner: "TMP-001", projectionId: "tmp:current", projectId: project.projectId, projectVersion: project.versionId, projectDigest: project.projectDigest },
        { projectionOwner: "DOC-002", projectionId: "doc:current", projectId: project.projectId, projectVersion: project.versionId, projectDigest: project.projectDigest },
      ],
      traceBindings: [{ traceRunId: knowledge.traceRunId!, projectId: project.projectId, projectVersion: project.versionId, projectDigest: project.projectDigest, ownerResultLedgerDigest: output.ownerResultLedger.ledgerDigest }],
      validationInvocationId: "validation:current-owner-stack:valid",
      callerRef: navigation.currentAction!.selectedActionId,
      purpose: "Validate current conditional owner stack.",
      completedAt: "2026-09-04T10:00:04.000Z",
    });
    expect(validation.boundedStatus).toBe("STRUCTURAL_FIDELITY_PASS");
    expect(validation.run.findings).toEqual([]);
    expect(validation.recognizedOwners).toHaveLength(9);
    expect(stableStringify(validation.run)).not.toContain("OBSERVABILITY_QUALIFICATION:NOT_IMPLEMENTED");
    expect(stableStringify(project)).toBe(projectBefore);
    expect(stableStringify(output.ownerResultLedger)).toBe(ledgerBefore);
    expect(validation.projectWrites).toBe(0);
    expect(validation.traceWrites).toBe(0);
  });

  it("diagnoses only an owner explicitly required by the governed action", () => {
    const { navigation, output, snapshot } = currentObsInvocation();
    const validation = executeCurrentOwnerStackValidationProfile({
      validationInvocationId: "validation:current-owner-stack:conditional",
      projectSnapshot: snapshot,
      ownerResultLedger: output.ownerResultLedger,
      expectations: [
        { owner: "REGULATORY_RESOLUTION", required: true, requirementRef: "project-decision:REGULATORY_APPLICABILITY", selectedActionRef: navigation.currentAction!.selectedActionId, knowledgeRequired: false },
        { owner: "STUDY_DESIGN", required: false, requirementRef: "not-applicable:study-design", selectedActionRef: null, knowledgeRequired: false },
      ],
      callerRef: "qry:conditional-owner-expectation",
      purpose: "Validate conditional current owners.",
      completedAt: "2026-09-04T10:00:05.000Z",
    });
    expect(validation.run.findings.map((finding) => finding.domainFailureClassRef)).toContain("REQUIRED_REGULATORY_RESOLUTION_RESULT_MISSING");
    expect(validation.run.findings.map((finding) => finding.domainFailureClassRef)).not.toContain("REQUIRED_STUDY_DESIGN_RESULT_MISSING");
  });

  it("diagnoses stale bindings, unauthorized writes and metadata-only promotion without repairing them", () => {
    const { output, snapshot } = currentObsInvocation();
    const tampered = structuredClone(output.ownerResultLedger);
    const knowledge = tampered.entries.find((entry) => entry.result?.owner === "KNOWLEDGE")!;
    const obs = tampered.entries.find((entry) => entry.result?.owner === "OBSERVABILITY_MEASUREMENT")!;
    for (const source of (knowledge.result!.nativePayload as { referenceSourceSnapshots: Array<{ contentAvailability: string }> }).referenceSourceSnapshots) source.contentAvailability = "METADATA_ONLY";
    (knowledge.result!.nativePayload as { referenceEvidenceCandidates: unknown[] }).referenceEvidenceCandidates = [];
    const mutableObsResult = obs.result as unknown as { sourceProjectVersion: string; projectWriteAuthorized: boolean };
    mutableObsResult.sourceProjectVersion = "stale-project-version";
    mutableObsResult.projectWriteAuthorized = true;
    const validation = executeCurrentOwnerStackValidationProfile({
      validationInvocationId: "validation:current-owner-stack:negative",
      projectSnapshot: snapshot,
      ownerResultLedger: tampered,
      expectations: [{ owner: "OBSERVABILITY_MEASUREMENT", required: true, requirementRef: "project-decision:OBSERVABILITY_QUALIFICATION", selectedActionRef: "qry:obs", knowledgeRequired: true }],
      callerRef: "qry:negative-owner-stack",
      purpose: "Diagnose current owner-stack violations.",
      completedAt: "2026-09-04T10:00:06.000Z",
    });
    const classes = validation.run.findings.map((finding) => finding.domainFailureClassRef);
    expect(classes).toEqual(expect.arrayContaining([
      "OWNER_RESULT_LEDGER_INVALID",
      "STALE_OBSERVABILITY_MEASUREMENT_RESULT",
      "UNAUTHORIZED_PROJECT_WRITE_OR_ADOPTION",
      "METADATA_ONLY_EVIDENCE_PROMOTED_TO_OWNER_INPUT",
    ]));
    expect(stableStringify(tampered)).toContain("stale-project-version");
    expect(validation.repairCalls).toBe(0);
  });
});
