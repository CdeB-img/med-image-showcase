import { logicalDigest, uniqueSorted } from "@/features/knowledge-engine/canonical";
import {
  PRJ001_CONTRIBUTION_INTAKE_GAP,
  RESEARCH_PROJECT_CONTRIBUTION_BOUNDARY,
  RESEARCH_PROJECT_SECTION_ORDER,
  type ProjectContextSnapshot,
  type ResearchProjectElement,
  type ResearchProjectOwnerProjection,
  type ResearchProjectSection,
  type ResearchProjectSectionId,
} from "@/features/research-project-construction";
import {
  RESEARCH_PROJECT_CONSTRUCTION_VERSION,
  type ResearchProjectDesignResult,
} from "@/features/research-project-construction/types";
import { projectDocumentSourceFromFunctionalProject } from "@/features/document-projection/functional-reset-boundary";

export const CANONICAL_PROJECT_CONSUMER_ADAPTER = "W0_PROJECT_01_CANONICAL_PROJECT_CONSUMER_ADAPTER" as const;
export const CANONICAL_PROJECT_CONSUMER_ADAPTER_VERSION = "1.0.0" as const;

export type LegacyProjectConsumer =
  | "CDM_PLANNING"
  | "DATA_MANAGEMENT_PLANNING"
  | "BIOSTATISTICS_PLANNING"
  | "TEMPLATE_ENGINE"
  | "DOCUMENT_ENGINE";

export type LegacyProjectionLossClass =
  | "NOT_REQUIRED_BY_CONSUMER"
  | "LOSSLESSLY_DERIVABLE"
  | "REPRESENTATION_GAP"
  | "UNSAFE_TO_PROJECT";

export type LegacyProjectionDiagnosticCode =
  | "CANONICAL_PROJECT_SNAPSHOT_INVALID"
  | "LEGACY_PROJECTION_UNREPRESENTABLE"
  | "LEGACY_PROJECTION_REQUIRED_IDENTITY_MISSING"
  | "LEGACY_PROJECTION_TEMPORAL_SEMANTICS_GAP"
  | "LEGACY_PROJECTION_PROVENANCE_GAP"
  | "LEGACY_PROJECTION_VERSION_MISMATCH";

export type LegacyProjectionDiagnostic = {
  code: LegacyProjectionDiagnosticCode;
  message: string;
  sourceRefs: string[];
};

export type LegacyProjectionLoss = {
  canonicalField: string;
  legacyField: string | null;
  classification: LegacyProjectionLossClass;
  consumerRefs: LegacyProjectConsumer[];
  blocking: boolean;
  explanation: string;
};

export type LegacyConsumerProjectionResult = {
  contract: typeof CANONICAL_PROJECT_CONSUMER_ADAPTER;
  contractVersion: typeof CANONICAL_PROJECT_CONSUMER_ADAPTER_VERSION;
  contractNature: "READ_ONLY_CONSUMER_PROJECTION_NOT_PROJECT_CONTRACT";
  status: "READY" | "BLOCKED";
  consumers: LegacyProjectConsumer[];
  sourceSnapshot: {
    projectId: string;
    projectVersion: string;
    projectDigest: string;
    snapshotDigest: string;
  };
  canonicalIdentityMap: Array<{
    stableId: string;
    versionRef: string;
    canonicalType: string;
    legacyRefs: string[];
  }>;
  canonicalRelationMap: Array<{
    stableId: string;
    versionRef: string;
    type: string;
    sourceProjectRef: string;
    targetProjectRef: string;
  }>;
  lossAccounting: LegacyProjectionLoss[];
  diagnostics: LegacyProjectionDiagnostic[];
  projection: Readonly<ResearchProjectDesignResult> | null;
  sourceOfTruth: false;
  projectWriteAuthorized: false;
  readOnly: true;
};

const SECTION_LABELS: Record<ResearchProjectSectionId, string> = {
  QUESTION: "Question",
  POPULATION: "Population",
  DESIGN: "Design",
  INTERVENTION: "Intervention",
  COMPARATOR: "Comparateur",
  IMAGING: "Imagerie",
  MEASUREMENTS: "Éléments à observer ou mesurer",
  TEMPORALITY: "Temporalité",
  ANALYSIS: "Analyse",
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach((nested) => deepFreeze(nested));
    Object.freeze(value);
  }
  return value;
};

const sectionFor = (object: ProjectContextSnapshot["objects"][number]): ResearchProjectSectionId => {
  if (object.type === "SCIENTIFIC_QUESTION") return "QUESTION";
  if (["CONDITION", "POPULATION", "ELIGIBILITY_CRITERION"].includes(object.type)) return "POPULATION";
  if (object.type === "STUDY_DESIGN") return "DESIGN";
  if (object.type === "INTERVENTION_OR_EXPOSURE") return "INTERVENTION";
  if (object.type === "GROUP") return object.scientificRole?.toLocaleUpperCase("en-US").includes("COMPARATOR") ? "COMPARATOR" : "DESIGN";
  if (["IMAGING_MODALITY", "ACQUISITION"].includes(object.type)) return "IMAGING";
  if (["ENDPOINT", "CANONICAL_VARIABLE"].includes(object.type)) return "MEASUREMENTS";
  if (object.type === "VISIT") return "TEMPORALITY";
  return "ANALYSIS";
};

const elementFrom = (object: ProjectContextSnapshot["objects"][number]): ResearchProjectElement => ({
  elementId: object.stableId,
  semanticKey: object.semanticKey,
  content: object.content,
  sourceItemIds: uniqueSorted([object.stableId, object.versionRef, ...object.sourceItemRefs]),
  sourceTurnIds: [...object.provenance.sourceTurnRefs],
  sourceProposedType: object.type,
  sourceStudyRole: object.scientificRole,
  sourcePolarity: null,
  disposition: "USER_CONFIRMED_PROJECT_INFORMATION",
  canonicalPromotion: "NOT_PERFORMED",
});

const ownerProjectionFromSnapshot = (snapshot: Readonly<ProjectContextSnapshot>): ResearchProjectOwnerProjection => {
  const sections: ResearchProjectSection[] = RESEARCH_PROJECT_SECTION_ORDER.map((sectionId) => {
    const objects = snapshot.objects.filter((object) => sectionFor(object) === sectionId);
    return {
      sectionId,
      label: SECTION_LABELS[sectionId],
      state: objects.length === 0 ? "TO_CLARIFY" : objects.some((object) => object.epistemicState === "UNKNOWN") ? "PARTIAL" : "DEFINED",
      elements: objects.map(elementFrom),
    };
  });
  const confirmationDecision = snapshot.humanDecisions.find((decision) => decision.status === "ADOPTED" && decision.projectVersion === snapshot.sourceProjectVersion)!;
  return {
    contract: "RESEARCH_PROJECT_CONSTRUCTION_OWNER_PROJECTION",
    contractVersion: RESEARCH_PROJECT_CONSTRUCTION_VERSION,
    contractNature: "PRJ001_MINIMAL_OWNER_ADAPTER_NOT_PD003_V2_ROOT",
    boundary: RESEARCH_PROJECT_CONTRIBUTION_BOUNDARY,
    pd003V2Compatibility: "COMPATIBLE_IN_PRINCIPLE_ADAPTATION_REQUIRED",
    canonicalV2Status: "NO_SCIENTIFIC_OBJECT_PROMOTION_CLAIMED",
    canonicalBackboneStatus: "PRJ_OWNED_CANONICAL_PROJECT_BACKBONE_ACTIVE",
    contractAdaptation: PRJ001_CONTRIBUTION_INTAKE_GAP,
    projectId: snapshot.sourceProjectRef,
    versionId: snapshot.sourceProjectVersion,
    projectDigest: snapshot.sourceProjectDigest,
    revision: snapshot.sourceProjectRevision,
    contributionRef: snapshot.sourceContributionRef,
    contributionDigest: snapshot.sourceContributionDigest,
    previousVersionId: snapshot.previousProjectVersion,
    adoptedAt: confirmationDecision.timestamp ?? snapshot.versionHistory.at(-1)?.createdAt ?? "",
    owner: "RESEARCH_PROJECT",
    confirmationDecision,
    llmProjectWrites: 0,
    sections,
    specializedResponsibilities: clone(snapshot.specializedResponsibilities),
  };
};

const anchorText = (anchor: ProjectContextSnapshot["temporalQualifications"][number]["anchor"]) => {
  const bounds = anchor.lowerBound !== null || anchor.upperBound !== null
    ? `${anchor.lowerBound ?? "?"}..${anchor.upperBound ?? "?"} ${anchor.unit}`
    : anchor.offset !== null ? `${anchor.offset} ${anchor.unit}` : null;
  const direction = anchor.direction === "UNKNOWN" ? null : anchor.direction.toLocaleLowerCase("en-US");
  const event = anchor.relativeEventLabel;
  return [direction, bounds, event].filter(Boolean).join(" ") || null;
};

const legacyRole = (role: string | null): ResearchProjectDesignResult["endpointCandidates"][number]["proposedRole"] => {
  const normalized = role?.toLocaleUpperCase("en-US") ?? "";
  if (normalized.includes("PRIMARY")) return "PRIMARY_CANDIDATE";
  if (normalized.includes("SECONDARY")) return "SECONDARY_CANDIDATE";
  if (normalized.includes("EXPLORATORY")) return "EXPLORATORY_CANDIDATE";
  return "UNDECIDED_CANDIDATE";
};

const diagnosticsFor = (
  snapshot: Readonly<ProjectContextSnapshot>,
  expectedProjectVersion?: string,
  expectedProjectDigest?: string,
): LegacyProjectionDiagnostic[] => {
  const diagnostics: LegacyProjectionDiagnostic[] = [];
  const { snapshotDigest, ...digestMaterial } = snapshot;
  if (snapshot.contract !== "PROJECT_CONTEXT_SNAPSHOT" || logicalDigest(digestMaterial) !== snapshotDigest) diagnostics.push({
    code: "CANONICAL_PROJECT_SNAPSHOT_INVALID",
    message: "Le snapshot canonique est invalide ou son digest ne correspond pas à son contenu.",
    sourceRefs: [snapshot.sourceProjectRef, snapshot.sourceProjectVersion, snapshotDigest],
  });
  if ((expectedProjectVersion && expectedProjectVersion !== snapshot.sourceProjectVersion) || (expectedProjectDigest && expectedProjectDigest !== snapshot.sourceProjectDigest)) diagnostics.push({
    code: "LEGACY_PROJECTION_VERSION_MISMATCH",
    message: "La version ou le digest attendu ne correspond pas au snapshot canonique fourni.",
    sourceRefs: uniqueSorted([expectedProjectVersion ?? "", expectedProjectDigest ?? "", snapshot.sourceProjectVersion, snapshot.sourceProjectDigest].filter(Boolean)),
  });
  const ids = new Set(snapshot.objects.map((object) => object.stableId));
  const missingEndpoints = snapshot.relations.flatMap((relation) => [relation.sourceProjectRef, relation.targetProjectRef]).filter((ref) => !ids.has(ref));
  if (!snapshot.sourceProjectRef || !snapshot.sourceProjectVersion || !snapshot.sourceProjectDigest || new Set(snapshot.objects.map((object) => object.stableId)).size !== snapshot.objects.length || missingEndpoints.length) diagnostics.push({
    code: "LEGACY_PROJECTION_REQUIRED_IDENTITY_MISSING",
    message: "Une identité Project, objet ou extrémité de relation nécessaire à la projection est absente ou dupliquée.",
    sourceRefs: uniqueSorted([snapshot.sourceProjectRef, ...missingEndpoints]),
  });
  if (!snapshot.humanDecisions.some((decision) => decision.status === "ADOPTED" && decision.projectVersion === snapshot.sourceProjectVersion)) diagnostics.push({
    code: "LEGACY_PROJECTION_PROVENANCE_GAP",
    message: "Aucune décision humaine adoptée ne référence exactement la version Project du snapshot.",
    sourceRefs: [snapshot.sourceProjectVersion, ...snapshot.humanDecisions.map((decision) => decision.decisionId)],
  });
  if (snapshot.objects.some((object) => !object.sourceContributionRef || !object.decisionRefs.length)) diagnostics.push({
    code: "LEGACY_PROJECTION_PROVENANCE_GAP",
    message: "Un objet canonique ne possède pas la lignée Contribution/décision requise.",
    sourceRefs: snapshot.objects.filter((object) => !object.sourceContributionRef || !object.decisionRefs.length).map((object) => object.stableId),
  });
  if (snapshot.legacyTemporalMappings.length) diagnostics.push({
    code: "LEGACY_PROJECTION_TEMPORAL_SEMANTICS_GAP",
    message: "Un ancien objet temporel exige encore un mapping explicite et ne peut pas être projeté honnêtement.",
    sourceRefs: snapshot.legacyTemporalMappings.map((mapping) => mapping.legacyObjectRef),
  });
  return diagnostics;
};

const lossAccountingFor = (snapshot: Readonly<ProjectContextSnapshot>, consumers: LegacyProjectConsumer[]): LegacyProjectionLoss[] => [
  {
    canonicalField: "objects / canonical identities / roles",
    legacyField: "candidateVersion.objectRefs + typed legacy collections + adapter canonicalIdentityMap",
    classification: "LOSSLESSLY_DERIVABLE",
    consumerRefs: consumers,
    blocking: false,
    explanation: "Les identités stables restent inchangées ; les champs legacy reçoivent uniquement les rôles explicitement présents.",
  },
  {
    canonicalField: "relations",
    legacyField: "impactGraph.edges + adapter canonicalRelationMap",
    classification: "LOSSLESSLY_DERIVABLE",
    consumerRefs: consumers,
    blocking: false,
    explanation: "Les extrémités et types de relation sont recopiés sans réinterprétation.",
  },
  {
    canonicalField: "DATA_NEED",
    legacyField: "dataManagementRequirements + candidateVersion.objectRefs",
    classification: "LOSSLESSLY_DERIVABLE",
    consumerRefs: consumers,
    blocking: false,
    explanation: "Le legacy shape ne possède pas de collection DataNeed native ; l’identité et le contenu sont conservés comme exigences référencées.",
  },
  {
    canonicalField: "temporal qualifications / ExpectedVariableOccasion",
    legacyField: "visits + temporalStructure + variable.timingIds",
    classification: snapshot.legacyTemporalMappings.length ? "REPRESENTATION_GAP" : "LOSSLESSLY_DERIVABLE",
    consumerRefs: consumers,
    blocking: snapshot.legacyTemporalMappings.length > 0,
    explanation: "Une référence temporelle UNKNOWN reste une fenêtre à définir ; aucune origine J0/baseline n’est fabriquée.",
  },
  {
    canonicalField: "unknowns / ambiguities / limitations / contradictions",
    legacyField: "missingInformation / limitations / contradictions",
    classification: "LOSSLESSLY_DERIVABLE",
    consumerRefs: consumers,
    blocking: false,
    explanation: "Les issues explicites sont conservées par classe et par référence.",
  },
  {
    canonicalField: "full canonical version history",
    legacyField: "candidateVersion.changesFromPrevious + adapter source snapshot metadata",
    classification: "NOT_REQUIRED_BY_CONSUMER",
    consumerRefs: consumers,
    blocking: false,
    explanation: "Les consumers reçoivent l’état courant exact ; l’historique complet reste dans le snapshot et n’est ni fusionné ni réécrit.",
  },
  {
    canonicalField: "specialized owner result payloads",
    legacyField: null,
    classification: "UNSAFE_TO_PROJECT",
    consumerRefs: consumers,
    blocking: false,
    explanation: "Le snapshot Project référence des responsabilités, pas des résultats propriétaires absents ; l’adapter n’en invente aucun.",
  },
];

const enrichLegacyProjection = (
  snapshot: Readonly<ProjectContextSnapshot>,
  projection: ResearchProjectDesignResult,
): ResearchProjectDesignResult => {
  const question = snapshot.objects.find((object) => object.type === "SCIENTIFIC_QUESTION");
  const objectives = snapshot.objects.filter((object) => object.type === "OBJECTIVE");
  const hypotheses = snapshot.objects.filter((object) => object.type === "HYPOTHESIS");
  const variables = snapshot.objects.filter((object) => object.type === "CANONICAL_VARIABLE");
  const endpoints = snapshot.objects.filter((object) => object.type === "ENDPOINT");
  const dataNeeds = snapshot.objects.filter((object) => object.type === "DATA_NEED");
  const decisionRefs = uniqueSorted([
    ...snapshot.humanDecisions.map((decision) => decision.decisionId),
    ...snapshot.decisionLedger.map((entry) => entry.humanDecisionRef),
  ]);
  const population = snapshot.objects.filter((object) => ["CONDITION", "POPULATION", "ELIGIBILITY_CRITERION"].includes(object.type));
  const relationsByTarget = (target: string, type: RegExp) => snapshot.relations.filter((relation) => relation.targetProjectRef === target && type.test(relation.type)).map((relation) => relation.sourceProjectRef);
  const relationsBySource = (source: string, type: RegExp) => snapshot.relations.filter((relation) => relation.sourceProjectRef === source && type.test(relation.type)).map((relation) => relation.targetProjectRef);
  const visits = [
    ...snapshot.temporalQualifications.map((qualification) => ({
      visitId: qualification.stableId,
      label: qualification.temporalRole,
      temporalRole: qualification.anchor.reference.status === "KNOWN" && qualification.anchor.direction === "AFTER" ? "FOLLOW_UP" as const : "SINGLE_ASSESSMENT" as const,
      timingValue: anchorText(qualification.anchor),
      timingStatus: qualification.anchor.reference.status === "KNOWN" ? "KNOWN" as const : "SCIENTIFIC_WINDOW_TO_DEFINE" as const,
      justification: qualification.anchor.reference.status === "KNOWN" ? "Qualification temporelle canonique référencée." : `Référence temporelle explicitement inconnue : ${qualification.anchor.reference.unresolvedReason}.`,
      hypothesisIds: [],
      endpointIds: endpoints.filter((endpoint) => relationsBySource(qualification.subjectProjectRef, /MEASURE|ENDPOINT|OUTCOME|EXPECTED/i).includes(endpoint.stableId)).map((endpoint) => endpoint.stableId),
      measurementIds: variables.filter((variable) => variable.stableId === qualification.subjectProjectRef).map((variable) => variable.stableId),
      dependencies: [qualification.subjectProjectRef, qualification.versionRef],
    })),
    ...snapshot.expectedVariableOccasions.map((occasion) => ({
      visitId: occasion.stableId,
      label: "EXPECTED_AT",
      temporalRole: occasion.anchor.reference.status === "KNOWN" && occasion.anchor.direction === "AFTER" ? "FOLLOW_UP" as const : "SINGLE_ASSESSMENT" as const,
      timingValue: anchorText(occasion.anchor),
      timingStatus: occasion.anchor.reference.status === "KNOWN" ? "KNOWN" as const : "SCIENTIFIC_WINDOW_TO_DEFINE" as const,
      justification: occasion.anchor.reference.status === "KNOWN" ? "Occasion attendue canonique référencée." : `Référence temporelle explicitement inconnue : ${occasion.anchor.reference.unresolvedReason}.`,
      hypothesisIds: [],
      endpointIds: endpoints.filter((endpoint) => relationsBySource(occasion.variableProjectRef, /MEASURE|ENDPOINT|OUTCOME/i).includes(endpoint.stableId) || relationsByTarget(occasion.variableProjectRef, /MEASURE|ENDPOINT|OUTCOME/i).includes(endpoint.stableId)).map((endpoint) => endpoint.stableId),
      measurementIds: [occasion.variableProjectRef],
      dependencies: uniqueSorted([occasion.variableProjectRef, occasion.versionRef, occasion.studyUnitOrGroupRef ?? ""].filter(Boolean)),
    })),
  ].filter((visit, index, all) => all.findIndex((candidate) => candidate.visitId === visit.visitId) === index);
  const issueReasons = (kind: ProjectContextSnapshot["openIssues"][number]["kind"]) => uniqueSorted(snapshot.openIssues.filter((issue) => issue.kind === kind).map((issue) => issue.reason));
  const variableTimingIds = (variableId: string) => uniqueSorted([
    ...snapshot.expectedVariableOccasions.filter((occasion) => occasion.variableProjectRef === variableId).map((occasion) => occasion.stableId),
    ...snapshot.temporalQualifications.filter((qualification) => qualification.subjectProjectRef === variableId).map((qualification) => qualification.stableId),
  ]);
  return {
    ...projection,
    resultId: `${snapshot.sourceProjectVersion}:legacy-consumer-projection`,
    resultDigest: snapshot.sourceProjectDigest,
    scientificQuestion: {
      questionId: question?.stableId ?? `${snapshot.sourceProjectRef}:question:unknown`,
      text: question?.content ?? "",
      confirmation: question ? "HUMAN_CONFIRMED" : "VALIDATED_CONTEXT",
    },
    objectives: objectives.map((objective) => ({
      objectiveId: objective.stableId,
      text: objective.content,
      level: objective.scientificRole?.toLocaleUpperCase("en-US").includes("SECONDARY") ? "SECONDARY" as const : objective.scientificRole?.toLocaleUpperCase("en-US").includes("EXPLORATORY") ? "EXPLORATORY" as const : "PRIMARY" as const,
      reviewState: "ADOPTED" as const,
    })),
    hypotheses: hypotheses.map((hypothesis) => ({
      hypothesisId: hypothesis.stableId,
      text: hypothesis.content,
      kind: hypothesis.scientificRole?.toLocaleUpperCase("en-US").includes("NULL") ? "NULL_OR_COMPETING" as const : hypothesis.scientificRole?.toLocaleUpperCase("en-US").includes("ALTERNATIVE") ? "ALTERNATIVE" as const : "PRIMARY" as const,
      reviewState: "ADOPTED" as const,
    })),
    populationDesign: {
      ...projection.populationDesign,
      populationId: snapshot.objects.find((object) => object.type === "POPULATION")?.stableId ?? projection.populationDesign.populationId,
      populationConcept: {
        ...projection.populationDesign.populationConcept,
        conditionOrPathology: population.filter((object) => object.type === "CONDITION").map((object) => object.content),
        questionRequiredCharacteristics: population.filter((object) => object.type === "ELIGIBILITY_CRITERION").map((object) => object.content),
        clinicalContext: population.filter((object) => object.type === "POPULATION").map((object) => object.content),
      },
      sourceRefs: population.map((object) => object.stableId),
      missingInformation: issueReasons("UNKNOWN"),
    },
    visits,
    temporalStructure: {
      rationale: visits.map((visit) => visit.justification).join(" ; "),
      anchor: snapshot.temporalQualifications.find((qualification) => qualification.anchor.reference.status === "KNOWN")?.anchor.relativeEventLabel ?? null,
      biologicalWindows: visits.filter((visit) => visit.timingValue !== null).map((visit) => visit.timingValue!),
      operationalWindows: [],
      repeatedMeasures: visits.length > 1,
      unknowns: uniqueSorted([
        ...issueReasons("UNKNOWN"),
        ...visits.filter((visit) => visit.timingStatus === "SCIENTIFIC_WINDOW_TO_DEFINE").map((visit) => visit.justification),
      ]),
    },
    endpointCandidates: endpoints.map((endpoint) => ({
      endpointId: endpoint.stableId,
      label: endpoint.content,
      proposedRole: legacyRole(endpoint.scientificRole),
      questionId: question?.stableId ?? `${snapshot.sourceProjectRef}:question:unknown`,
      objectiveIds: uniqueSorted([...relationsByTarget(endpoint.stableId, /OBJECTIVE|ADDRESS|ANSWER/i), ...objectives.map((objective) => objective.stableId)]),
      hypothesisIds: relationsByTarget(endpoint.stableId, /HYPOTHESIS|TEST/i),
      variableIds: uniqueSorted([...relationsByTarget(endpoint.stableId, /MEASURE|VARIABLE|OUTCOME/i), ...relationsBySource(endpoint.stableId, /MEASURE|VARIABLE|OUTCOME/i)]),
      populationId: snapshot.objects.find((object) => object.type === "POPULATION")?.stableId ?? projection.populationDesign.populationId,
      timingIds: visits.filter((visit) => visit.endpointIds.includes(endpoint.stableId)).map((visit) => visit.visitId),
      analysisRequirementIds: snapshot.objects.filter((object) => object.type === "ANALYSIS_SPECIFICATION").map((object) => object.stableId),
      measurementMethod: "",
      justification: "Critère canonique lu sans promotion ni changement de rôle.",
      limitations: endpoint.scientificRole ? [] : ["Le rôle principal, secondaire ou exploratoire reste non spécifié."],
      humanDecisionRequired: true as const,
    })),
    variables: variables.map((variable) => ({
      variableId: variable.stableId,
      definition: variable.content,
      source: snapshot.objects.some((object) => object.type === "IMAGING_MODALITY") ? "IMAGING" as const : "USER_PROVIDED" as const,
      sourceRef: variable.stableId,
      role: "MEASUREMENT_CANDIDATE" as const,
      timingIds: variableTimingIds(variable.stableId),
      endpointIds: uniqueSorted([...relationsByTarget(variable.stableId, /MEASURE|ENDPOINT|OUTCOME/i), ...relationsBySource(variable.stableId, /MEASURE|ENDPOINT|OUTCOME/i)]).filter((ref) => endpoints.some((endpoint) => endpoint.stableId === ref)),
      analysisRequirementIds: snapshot.objects.filter((object) => object.type === "ANALYSIS_SPECIFICATION").map((object) => object.stableId),
      qualityRequirements: [],
      provenance: uniqueSorted([variable.stableId, variable.versionRef, variable.sourceContributionRef, ...variable.sourceItemRefs]),
      knowledgeStatus: variable.epistemicState === "KNOWN" ? "KNOWN" as const : variable.epistemicState === "ASSUMED" ? "PARTIAL" as const : "UNKNOWN" as const,
      finalDataDictionaryName: null,
    })),
    dataManagementRequirements: dataNeeds.map((need) => ({
      requirementId: need.stableId,
      kind: "CANONICAL_DATA_NEED_REFERENCE",
      reason: need.content,
      sourceRefs: uniqueSorted([need.stableId, need.versionRef, need.sourceContributionRef]),
      status: "SPECIALIZED_ENGINE_REQUIRED" as const,
    })),
    limitations: uniqueSorted([...projection.limitations, ...issueReasons("LIMITATION")]),
    contradictions: uniqueSorted([...projection.contradictions, ...issueReasons("CONTRADICTION")]),
    missingInformation: uniqueSorted([...projection.missingInformation, ...issueReasons("UNKNOWN"), ...issueReasons("AMBIGUITY")]),
    dependencies: snapshot.relations.map((relation) => ({
      dependencyId: relation.stableId,
      from: relation.sourceProjectRef,
      to: relation.targetProjectRef,
      reason: relation.type,
      changeEffect: "PRESERVED" as const,
    })),
    impactGraph: {
      ...projection.impactGraph,
      nodes: snapshot.objects.map((object) => ({ nodeId: object.stableId, type: object.type, label: object.content, status: object.epistemicState, whyExists: `Canonical object ${object.versionRef}` })),
      edges: snapshot.relations.map((relation) => ({ edgeId: relation.stableId, from: relation.sourceProjectRef, to: relation.targetProjectRef, relation: relation.type })),
    },
    candidateVersion: {
      ...projection.candidateVersion,
      versionId: snapshot.sourceProjectVersion,
      priorVersion: snapshot.previousProjectVersion ?? snapshot.sourceProjectVersion,
      objectRefs: snapshot.objects.map((object) => object.stableId),
      decisionRecordIds: decisionRefs,
      unknowns: uniqueSorted([...issueReasons("UNKNOWN"), ...issueReasons("AMBIGUITY")]),
      contradictions: issueReasons("CONTRADICTION"),
      limitations: issueReasons("LIMITATION"),
      dependencies: snapshot.relations.map((relation) => relation.stableId),
      changesFromPrevious: snapshot.historicalObjectVersions.map((object) => `${object.stableId}@${object.versionRef}->${object.supersededByVersionRef ?? "UNKNOWN"}`),
    },
    documentHandoff: {
      ...projection.documentHandoff,
      projectId: snapshot.sourceProjectRef,
      candidateVersionRef: snapshot.sourceProjectVersion,
      decisionRecordIds: decisionRefs,
      humanDecisions: clone(snapshot.humanDecisions),
    },
    provenance: {
      ...projection.provenance,
      inputRef: snapshot.snapshotDigest,
      sourceRefs: uniqueSorted([
        snapshot.sourceProjectRef,
        snapshot.sourceProjectVersion,
        snapshot.sourceProjectDigest,
        snapshot.snapshotDigest,
        ...snapshot.objects.flatMap((object) => [object.stableId, object.versionRef, object.sourceContributionRef]),
        ...snapshot.relations.flatMap((relation) => [relation.stableId, relation.versionRef]),
      ]),
      policyRefs: uniqueSorted([...projection.provenance.policyRefs, CANONICAL_PROJECT_CONSUMER_ADAPTER]),
    },
    trace: [{
      sequence: 1,
      operation: "CANONICAL_OWNER_SNAPSHOT_TO_LEGACY_CONSUMER_PROJECTION",
      mode: "DETERMINISTIC",
      decision: "READ_ONLY_COMPATIBILITY_PROJECTION_NO_PROJECT_AUTHORITY",
      inputDigest: snapshot.snapshotDigest,
      outputDigest: snapshot.sourceProjectDigest,
    }],
  };
};

export const projectCanonicalSnapshotForLegacyConsumers = (input: {
  snapshot: Readonly<ProjectContextSnapshot>;
  consumers: readonly LegacyProjectConsumer[];
  expectedProjectVersion?: string;
  expectedProjectDigest?: string;
}): Readonly<LegacyConsumerProjectionResult> => {
  const snapshot = clone(input.snapshot);
  const consumers = uniqueSorted([...input.consumers]) as LegacyProjectConsumer[];
  const diagnostics = diagnosticsFor(snapshot, input.expectedProjectVersion, input.expectedProjectDigest);
  const lossAccounting = lossAccountingFor(snapshot, consumers);
  const blockingDiagnostics = diagnostics.length > 0;
  const projection = blockingDiagnostics
    ? null
    : enrichLegacyProjection(snapshot, projectDocumentSourceFromFunctionalProject(ownerProjectionFromSnapshot(snapshot), null));
  return deepFreeze({
    contract: CANONICAL_PROJECT_CONSUMER_ADAPTER,
    contractVersion: CANONICAL_PROJECT_CONSUMER_ADAPTER_VERSION,
    contractNature: "READ_ONLY_CONSUMER_PROJECTION_NOT_PROJECT_CONTRACT",
    status: blockingDiagnostics ? "BLOCKED" : "READY",
    consumers,
    sourceSnapshot: {
      projectId: snapshot.sourceProjectRef,
      projectVersion: snapshot.sourceProjectVersion,
      projectDigest: snapshot.sourceProjectDigest,
      snapshotDigest: snapshot.snapshotDigest,
    },
    canonicalIdentityMap: snapshot.objects.map((object) => ({
      stableId: object.stableId,
      versionRef: object.versionRef,
      canonicalType: object.type,
      legacyRefs: uniqueSorted([
        object.stableId,
        ...(projection?.candidateVersion.objectRefs.includes(object.stableId) ? [object.stableId] : []),
      ]),
    })),
    canonicalRelationMap: snapshot.relations.map((relation) => ({
      stableId: relation.stableId,
      versionRef: relation.versionRef,
      type: relation.type,
      sourceProjectRef: relation.sourceProjectRef,
      targetProjectRef: relation.targetProjectRef,
    })),
    lossAccounting,
    diagnostics,
    projection,
    sourceOfTruth: false,
    projectWriteAuthorized: false,
    readOnly: true,
  });
};
