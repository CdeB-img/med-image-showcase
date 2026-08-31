import { DOCUMENTARY_PATTERN_CATALOG } from "@/features/documentary-knowledge/catalog";
import { logicalDigest, uniqueSorted } from "@/features/knowledge-engine/canonical";
import type { HumanDecisionEnvelope } from "@/features/protocol-designer/human-decision";
import { createRegulatoryResolutionInput, knownFact, unknownFact } from "@/features/regulatory-resolution/input";
import { resolveRegulatoryRequirements } from "@/features/regulatory-resolution/resolver";
import type {
  FundingProgramCandidate,
  FundingProgramEditionCandidate,
  JurisdictionCode,
  ProductType,
  RegulatoryResolutionInput,
} from "@/features/regulatory-resolution/types";
import type {
  ResearchProjectDesignResult,
  ResearchProjectElement,
  ResearchProjectOwnerProjection,
  ResearchProjectSectionId,
} from "@/features/research-project-construction";
import { CLINICAL_STUDY_TEMPLATE, composeStudyTemplateInstance } from "@/features/study-template";
import { projectDocumentFromStudyTemplate, resolveTemplateDocumentDefinitions } from "./template-integration";
import type {
  DocumentProjection,
  DocumentProjectionRequest,
  ProjectionPlan,
  ProjectionReadiness,
  TemplateDocumentProjectionStatus,
} from "./types";

export const FUNCTIONAL_RESET_DOCUMENT_BOUNDARY = "DOC_001B_FUNCTIONAL_RESET_PROJECT_CONSUMER_ADAPTER" as const;

export type FunctionalDocumentKind = "PROTOCOL" | "DMP" | "SAP";
export type FunctionalDocumentFreshness = "NO_PROJECTION" | "CURRENT" | "STALE";

export type FunctionalDocumentBlockerGroup = {
  dimension: "Population" | "Critères" | "Temporalité" | "Imagerie" | "Analyse" | "Autres";
  items: string[];
};

export type FunctionalDocumentCard = {
  kind: FunctionalDocumentKind;
  label: "Protocole" | "DMP" | "SAP";
  templateStatus: TemplateDocumentProjectionStatus | "PROJECT_REQUIRED" | "ENGINE_ERROR";
  projectionReadiness: ProjectionReadiness | null;
  freshness: FunctionalDocumentFreshness;
  stateLabel: string;
  explanation: string;
  blockerGroups: FunctionalDocumentBlockerGroup[];
  projectionId: string | null;
  sourceProjectVersion: string | null;
  canRequestProjection: boolean;
  canOpen: boolean;
};

export type FunctionalResetDocumentPortfolio = {
  contract: "FUNCTIONAL_RESET_DOCUMENT_PORTFOLIO";
  contractVersion: "1.0.0";
  boundary: typeof FUNCTIONAL_RESET_DOCUMENT_BOUNDARY;
  owner: "DOC-001";
  projectRef: null | { projectId: string; projectVersion: string; projectDigest: string };
  handoffDecision: HumanDecisionEnvelope | null;
  projections: DocumentProjection[];
  cards: FunctionalDocumentCard[];
  lastFailure: null | { code: string; message: string; resumeCondition: string | null };
};

const elements = (project: ResearchProjectOwnerProjection, sectionId: ResearchProjectSectionId) =>
  project.sections.find((section) => section.sectionId === sectionId)?.elements ?? [];

const typeOf = (element: ResearchProjectElement) => `${element.sourceProposedType ?? ""} ${element.sourceStudyRole ?? ""}`.toLocaleUpperCase("fr-FR");
const hasType = (element: ResearchProjectElement, pattern: RegExp) => pattern.test(typeOf(element));
const refs = (element: ResearchProjectElement) => uniqueSorted([element.elementId, ...element.sourceItemIds, ...element.sourceTurnIds]);
const allElements = (project: ResearchProjectOwnerProjection) => project.sections.flatMap((section) => section.elements);

const temporalRoleFor = (element: ResearchProjectElement): ResearchProjectDesignResult["visits"][number]["temporalRole"] => {
  if (element.semanticKey?.endsWith(":INITIAL")) return "BASELINE";
  if (element.semanticKey?.endsWith(":FOLLOW_UP")) return "FOLLOW_UP";
  return "SINGLE_ASSESSMENT";
};

const missingFromProject = (project: ResearchProjectOwnerProjection) => project.sections
  .filter((section) => section.state === "TO_CLARIFY" && section.sectionId !== "BIOSPECIMENS")
  .map((section) => `${section.label} : information à préciser dans le Research Project.`);

const projectionReadiness = (projection: ResearchProjectDesignResult["projectionReadiness"][number]["projection"], available: boolean, missing: string[]): ResearchProjectDesignResult["projectionReadiness"][number] => ({
  projection,
  availability: available ? "STRUCTURE_ONLY" : "NOT_AVAILABLE",
  basis: available ? ["Une version confirmée du Research Project et sa question de travail sont disponibles."] : [],
  missing,
  notice: "DATA_AVAILABILITY_ONLY_NOT_APPROVAL",
});

/**
 * Read-only compatibility projection for the historical PRJ-001 consumer shape.
 * Every substantive value comes from the confirmed owner projection. Empty fields and
 * explicit unknowns are preserved instead of being completed by this adapter.
 */
export const projectDocumentSourceFromFunctionalProject = (
  project: Readonly<ResearchProjectOwnerProjection>,
  handoffDecision: Readonly<HumanDecisionEnvelope> | null,
): ResearchProjectDesignResult => {
  const questionElements = elements(project, "QUESTION");
  const populationElements = elements(project, "POPULATION");
  const designElements = elements(project, "DESIGN");
  const interventionElements = elements(project, "INTERVENTION");
  const comparatorElements = elements(project, "COMPARATOR");
  const imagingElements = elements(project, "IMAGING");
  const measurementElements = elements(project, "MEASUREMENTS");
  const timingElements = elements(project, "TEMPORALITY");
  const analysisElements = elements(project, "ANALYSIS");
  const confirmedHandoff = handoffDecision?.status === "ADOPTED" && handoffDecision.projectVersion === project.versionId;
  const populationId = `${project.projectId}:population`;
  const questionId = questionElements[0]?.elementId ?? `${project.projectId}:question`;
  const missing = missingFromProject(project);
  const conditionOrPathology = populationElements.filter((item) => hasType(item, /CONDITION|DISEASE|PATHOLOGY/)).map((item) => item.content);
  const requiredCharacteristics = populationElements.filter((item) => hasType(item, /POPULATION|ELIGIBILITY|CRITERION|DEMOGRAPHIC|AGE/)).map((item) => item.content);
  const clinicalContext = populationElements.filter((item) => !conditionOrPathology.includes(item.content) && !requiredCharacteristics.includes(item.content)).map((item) => item.content);
  const modalityElements = imagingElements.filter((item) => hasType(item, /MODALITY|IMAGING_METHOD|ACQUISITION/));
  const imagingResponsibility = project.specializedResponsibilities.find((item) => item.owner === "IMAGING");
  const statisticsResponsibility = project.specializedResponsibilities.find((item) => item.owner === "BIOSTATISTICS");
  const variables = measurementElements.map((item) => ({
    variableId: item.elementId,
    definition: item.content,
    source: "USER_PROVIDED" as const,
    sourceRef: item.sourceItemIds[0] ?? item.elementId,
    role: "MEASUREMENT_CANDIDATE" as const,
    timingIds: timingElements.map((timing) => timing.elementId),
    endpointIds: hasType(item, /ENDPOINT|OUTCOME/) ? [item.elementId] : [],
    analysisRequirementIds: analysisElements.map((analysis) => analysis.elementId),
    qualityRequirements: [],
    provenance: refs(item),
    knowledgeStatus: "KNOWN" as const,
    finalDataDictionaryName: null,
  }));
  const endpoints = measurementElements.filter((item) => hasType(item, /ENDPOINT|OUTCOME/)).map((item) => ({
    endpointId: item.elementId,
    label: item.content,
    proposedRole: "UNDECIDED_CANDIDATE" as const,
    questionId,
    objectiveIds: [],
    hypothesisIds: [],
    variableIds: [item.elementId],
    populationId,
    timingIds: timingElements.map((timing) => timing.elementId),
    analysisRequirementIds: analysisElements.map((analysis) => analysis.elementId),
    measurementMethod: "",
    justification: "Critère explicitement exprimé et confirmé comme information de travail ; son rôle final reste à décider.",
    limitations: ["Le rôle principal, secondaire ou exploratoire n’est pas adopté."],
    humanDecisionRequired: true as const,
  }));
  const interventionGroups = interventionElements.map((item) => ({
    groupId: `${item.elementId}:group`,
    role: "EXPOSURE" as const,
    label: item.content,
    justification: "Intervention explicitement confirmée dans le Research Project.",
    populationId,
    sourceRefs: refs(item),
    reviewState: "ADOPTED" as const,
  }));
  const comparatorGroups = comparatorElements.map((item) => ({
    groupId: `${item.elementId}:group`,
    role: "COMPARATOR" as const,
    label: item.content,
    justification: "Comparateur explicitement confirmé dans le Research Project.",
    populationId,
    sourceRefs: refs(item),
    reviewState: "ADOPTED" as const,
  }));
  const decisionRecords = [project.confirmationDecision, ...(confirmedHandoff && handoffDecision ? [handoffDecision] : [])];
  const specializedRequirements = project.specializedResponsibilities
    .filter((item) => item.state === "PENDING_SPECIALIST_CONTRIBUTION")
    .map((item) => `${item.owner}: ${item.retainedResponsibility}`);
  const compatibilityLimitation = "Adaptation de lecture PRJ-001 : le snapshot est immuable pour DOC, sans gel scientifique supplémentaire ni promotion canonique du Research Project.";
  const projectLimitations = uniqueSorted([
    compatibilityLimitation,
    ...(!imagingElements.length ? ["Le contrat PRJ-001 historique ne possède pas d’état Imaging non qualifié ; l’adaptateur conserve donc l’applicabilité comme inconnue et n’affirme pas une non-applicabilité."] : []),
    "Les champs booléens historiques non qualifiables par le Project minimal ne doivent pas être interprétés comme des décisions scientifiques.",
    ...project.specializedResponsibilities.filter((item) => item.state === "PENDING_SPECIALIST_CONTRIBUTION").map((item) => item.retainedResponsibility),
  ]);
  const objectRefs = uniqueSorted(allElements(project).map((item) => item.elementId));
  const projectionMissing = uniqueSorted([...missing, ...specializedRequirements]);

  return {
    contractVersion: project.contractVersion,
    inputVersion: project.contractVersion,
    resultId: `${project.versionId}:document-source-projection`,
    resultDigest: project.projectDigest,
    status: "PARTIAL_PROJECT",
    projectionNotice: "RUNTIME_PROJECT_PROJECTION_DOES_NOT_OWN_CANONICAL_TRUTH",
    scientificQuestion: {
      questionId,
      text: questionElements[0]?.content ?? "",
      confirmation: "HUMAN_CONFIRMED",
    },
    objectives: [],
    hypotheses: [],
    populationDesign: {
      populationId,
      populationConcept: {
        conditionOrPathology,
        stage: [],
        phenotype: [],
        clinicalContext,
        exposureOrIntervention: interventionElements.map((item) => item.content),
        questionRequiredCharacteristics: requiredCharacteristics,
        conceptuallyJustifiedExclusions: [],
        relevantSubpopulations: [],
      },
      operationalEligibility: {
        status: "FUTURE_SPECIALIZED_DEFINITION_REQUIRED",
        requirements: requiredCharacteristics.map((requirement) => ({
          requirement,
          whyNeeded: "Contrainte d’éligibilité explicitement confirmée ; formulation opérationnelle spécialisée non définie.",
          finalWordingStatus: "NOT_DEFINED" as const,
        })),
      },
      justification: "Population composée uniquement depuis les informations confirmées dans le Project.",
      sourceRefs: uniqueSorted(populationElements.flatMap(refs)),
      missingInformation: populationElements.length ? [] : ["La population scientifique reste à préciser."],
      reviewState: "ADOPTED",
    },
    studyDesignCandidates: [],
    selectedStudyDesignCandidate: null,
    groups: [...interventionGroups, ...comparatorGroups],
    comparators: interventionGroups.length && comparatorGroups.length ? [{
      comparatorId: `${project.versionId}:confirmed-comparison`,
      groupIds: [...interventionGroups, ...comparatorGroups].map((item) => item.groupId),
      kind: "USER_CONFIRMED_COMPARISON",
      justification: analysisElements.find((item) => hasType(item, /COMPAR/))?.content ?? "Intervention et comparateur explicitement confirmés.",
      reviewState: "ADOPTED",
    }] : [],
    visits: timingElements.map((item) => ({
      visitId: item.elementId,
      label: "Temporalité confirmée",
      temporalRole: temporalRoleFor(item),
      timingValue: item.content,
      timingStatus: "KNOWN" as const,
      justification: "Fenêtre temporelle explicitement confirmée dans le Research Project.",
      hypothesisIds: [],
      endpointIds: endpoints.map((endpoint) => endpoint.endpointId),
      measurementIds: variables.map((variable) => variable.variableId),
      dependencies: modalityElements.map((modality) => modality.elementId),
    })),
    temporalStructure: {
      rationale: timingElements.map((item) => item.content).join(" ; "),
      anchor: timingElements[0]?.content ?? null,
      biologicalWindows: timingElements.map((item) => item.content),
      operationalWindows: [],
      repeatedMeasures: timingElements.length > 1,
      unknowns: timingElements.length ? [] : ["La temporalité du projet reste à préciser."],
    },
    endpointCandidates: endpoints,
    variables,
    measurementDependencies: [],
    analysisRequirements: analysisElements.map((item) => ({
      requirementId: item.elementId,
      purpose: "COMPARISON" as const,
      reason: item.content,
      endpointIds: endpoints.map((endpoint) => endpoint.endpointId),
      variableIds: variables.map((variable) => variable.variableId),
      dependencies: refs(item),
      finalStatisticalModel: null,
      biostatisticsReviewRequired: true as const,
    })),
    sizingRequirements: {
      status: "SPECIALIZED_ENGINE_REQUIRED",
      inputs: [],
      sampleSize: null,
      power: null,
      notice: "NO_STATISTICAL_VALUE_INVENTED",
    },
    imagingContribution: {
      applicability: imagingElements.length ? "APPLICABLE" : "REQUIRED_BUT_NOT_READY",
      resultRef: imagingElements.length ? `${project.versionId}:confirmed-imaging-information` : null,
      variableIds: variables.filter((variable) => /IRM|imagerie/i.test(variable.definition)).map((variable) => variable.variableId),
      acquisitionRefs: modalityElements.map((item) => item.content),
      qualityRefs: [],
      limitations: imagingResponsibility ? [imagingResponsibility.retainedResponsibility] : [],
      projectHandoffReadiness: null,
      equipmentCompatibilityStatus: null,
      executableProtocolReadiness: null,
      requiredFutureReviews: imagingResponsibility?.state === "PENDING_SPECIALIST_CONTRIBUTION" ? [imagingResponsibility.retainedResponsibility] : [],
    },
    dataManagementRequirements: [],
    biostatisticsRequirements: {
      status: "SPECIALIZED_ENGINE_REQUIRED",
      questionRef: questionId,
      hypothesisIds: [],
      designCandidateIds: [],
      groupIds: [...interventionGroups, ...comparatorGroups].map((item) => item.groupId),
      endpointIds: endpoints.map((endpoint) => endpoint.endpointId),
      variableIds: variables.map((variable) => variable.variableId),
      timingIds: timingElements.map((item) => item.elementId),
      repeatedMeasures: timingElements.length > 1,
      multicenterStructure: designElements.map((item) => item.content).join(" ; "),
      analysisPurposes: analysisElements.map((item) => item.content),
      knownAssumptions: [],
      unknownAssumptions: statisticsResponsibility?.state === "PENDING_SPECIALIST_CONTRIBUTION" ? [statisticsResponsibility.retainedResponsibility] : ["Aucune spécification Biostatistics adoptée n’est présente."],
      missingNumericalInputs: ["Les entrées numériques de dimensionnement ne sont pas définies."],
    },
    regulatoryQuestions: [],
    safetyQuestions: [],
    economicsQuestions: [],
    operationsQuestions: [],
    feasibilityAssessment: project.specializedResponsibilities.map((item) => ({
      domain: item.owner,
      state: item.state === "PENDING_SPECIALIST_CONTRIBUTION" ? "SPECIALIZED_ENGINE_REQUIRED" as const : "NOT_EVALUATED_BY_SPECIALIZED_ENGINE" as const,
      basis: item.sourceItemIds,
      gaps: item.state === "PENDING_SPECIALIST_CONTRIBUTION" ? [item.retainedResponsibility] : [],
      specializedEngine: item.owner,
    })),
    recruitmentModelRequirements: {
      status: "REQUIREMENTS_ONLY",
      raritySignal: "UNKNOWN",
      inputs: [],
      centerCount: null,
      recruitmentRate: null,
      recruitmentDuration: null,
    },
    multicenterAssessment: {
      declaredMode: designElements.map((item) => item.content).join(" ; "),
      scientificNecessity: "UNKNOWN",
      operationalNecessity: "NOT_EVALUATED_BY_SPECIALIZED_ENGINE",
      factors: designElements.map((item) => item.content),
      monocenterAlternativePreserved: true,
      centerCount: null,
      notice: "MULTICENTER_IS_NOT_AUTOMATICALLY_SUPERIOR",
    },
    biases: [],
    confounders: [],
    risks: [],
    limitations: projectLimitations,
    contradictions: [],
    missingInformation: projectionMissing,
    alternatives: [],
    compromises: [],
    decisionsRequired: [{
      gateId: "PRJ-GATE-DOCUMENT-WORKING-PROJECTION",
      type: "DOCUMENT_HANDOFF",
      label: "Utiliser cette version du Project pour une projection documentaire de travail",
      reason: "Le handoff documentaire reste une décision humaine explicite attachée à une version exacte.",
      targetIds: [project.projectId, project.versionId],
      status: confirmedHandoff ? "APPROVED" : "PENDING",
    }],
    dependencies: [],
    impactGraph: {
      ontologyStatus: "NO_NEW_ONTOLOGY_RUNTIME_PROJECTION",
      nodes: [],
      edges: [],
      changes: [],
      impacts: [],
    },
    localReadiness: project.sections.map((section) => ({
      domain: section.sectionId,
      state: section.state === "DEFINED" ? "READY" as const : section.state === "PARTIAL" ? "PARTIAL" as const : "SPECIALIZED_ENGINE_REQUIRED" as const,
      requirementsSatisfied: section.elements.map((item) => item.elementId),
      openItems: section.state === "DEFINED" ? [] : [`${section.label} reste ${section.state === "PARTIAL" ? "partiel" : "à préciser"}.`],
    })),
    projectionReadiness: [
      projectionReadiness("Protocol", true, projectionMissing),
      projectionReadiness("Synopsis", false, projectionMissing),
      projectionReadiness("Funding", false, projectionMissing),
      projectionReadiness("Publication", false, projectionMissing),
      projectionReadiness("CRF", false, projectionMissing),
      projectionReadiness("Data Dictionary", false, projectionMissing),
      projectionReadiness("SAP", false, projectionMissing),
      projectionReadiness("Budget", false, projectionMissing),
      projectionReadiness("Timeline", false, projectionMissing),
      projectionReadiness("CPP", false, projectionMissing),
      projectionReadiness("ANSM", false, projectionMissing),
      projectionReadiness("Core Lab Manual", false, projectionMissing),
      projectionReadiness("Monitoring Plan", false, projectionMissing),
      projectionReadiness("Investigator Guide", false, projectionMissing),
    ],
    adaptiveQuestions: [],
    candidateVersion: {
      versionId: project.versionId,
      priorVersion: project.previousVersionId ?? project.versionId,
      status: confirmedHandoff ? "FROZEN_BY_HUMAN" : "CANDIDATE_NOT_FROZEN",
      objectRefs,
      decisionRecordIds: decisionRecords.map((decision) => decision.decisionId),
      knowledgeResultRef: null,
      unknowns: projectionMissing,
      contradictions: [],
      limitations: projectLimitations,
      dependencies: specializedRequirements,
      changesFromPrevious: project.previousVersionId ? [`Version précédente : ${project.previousVersionId}`] : [],
      frozenAt: confirmedHandoff ? handoffDecision?.timestamp ?? null : null,
      actor: confirmedHandoff ? handoffDecision?.actor ?? null : null,
      mandateRef: confirmedHandoff ? handoffDecision?.mandate ?? null : null,
    },
    documentHandoff: {
      handoffVersion: "1.1",
      status: confirmedHandoff ? "AUTHORIZED" : "NOT_READY",
      projectId: project.projectId,
      candidateVersionRef: project.versionId,
      includedSections: project.sections.filter((section) => section.elements.length).map((section) => section.sectionId),
      specializedEngineRequirements: specializedRequirements,
      decisionRecordIds: decisionRecords.map((decision) => decision.decisionId),
      humanDecisions: decisionRecords,
      blockedBy: confirmedHandoff ? [] : ["PRJ-GATE-DOCUMENT-WORKING-PROJECTION"],
      boundary: "NO_DOCUMENT_GENERATED_DOCUMENT_ENGINE_OWNS_PROJECTIONS",
    },
    provenance: {
      engineVersion: project.contractVersion,
      inputRef: project.versionId,
      sourceRefs: uniqueSorted([project.projectId, project.versionId, project.projectDigest, project.contributionRef, ...objectRefs]),
      policyRefs: [project.boundary, FUNCTIONAL_RESET_DOCUMENT_BOUNDARY, "PD-003-V2", "SCIENTIFIC_PRODUCT_MANIFESTO_V2"],
      llmContributionStatus: "NO_LLM_SCIENTIFIC_DECISION",
    },
    trace: [{
      sequence: 1,
      operation: "PROJECT_OWNER_TO_PRJ001_DOCUMENT_CONSUMER_PROJECTION",
      mode: "DETERMINISTIC",
      decision: confirmedHandoff ? "EXPLICIT_HANDOFF_AUTHORIZATION_PRESERVED" : "PROJECT_SNAPSHOT_NOT_AUTHORIZED_FOR_DOCUMENT_PROJECTION",
      inputDigest: project.projectDigest,
      outputDigest: project.projectDigest,
    }],
    refusal: null,
  };
};

const regulatoryInputFor = (
  project: Readonly<ResearchProjectOwnerProjection>,
  source: Readonly<ResearchProjectDesignResult>,
  asOf: string,
): RegulatoryResolutionInput => {
  const provenance = [project.projectId, project.versionId, project.projectDigest, FUNCTIONAL_RESET_DOCUMENT_BOUNDARY];
  const interventionPresent = elements(project, "INTERVENTION").length > 0;
  const multicenterDeclared = elements(project, "DESIGN").some((item) => /multicent/i.test(item.content));
  return createRegulatoryResolutionInput({
    researchProjectId: project.projectId,
    researchProjectVersion: project.versionId,
    researchProjectDigest: project.projectDigest,
    resolutionAsOf: asOf,
    jurisdiction: unknownFact<JurisdictionCode[]>("La juridiction n’est pas qualifiée dans le Project minimal.", provenance),
    projectCharacteristics: {
      humanHealthResearch: unknownFact<boolean>("La qualification réglementaire de la recherche n’est pas établie.", provenance),
      projectNatures: unknownFact<string[]>("La nature réglementaire du projet n’est pas qualifiée.", provenance),
      intendedDocuments: knownFact(["PROTOCOL"], "L’utilisateur demande explicitement une projection de protocole de travail.", provenance),
      explicitlyIncorporatedGuidance: unknownFact<string[]>("Aucun guide incorporé n’est qualifié.", provenance),
    },
    studyDesignCharacteristics: {
      interventionModel: unknownFact<"INTERVENTIONAL" | "OBSERVATIONAL">("Le modèle d’étude n’est pas qualifié par le Project minimal.", provenance),
      temporalDirection: unknownFact<"PROSPECTIVE" | "RETROSPECTIVE" | "MIXED">("La direction temporelle du design n’est pas qualifiée.", provenance),
      randomised: unknownFact<boolean>("La randomisation n’est pas définie.", provenance),
      registryBased: unknownFact<boolean>("Le recours à un registre n’est pas défini.", provenance),
      reportTypes: unknownFact<string[]>("Les types de rapports réglementaires ne sont pas définis.", provenance),
    },
    interventionCharacteristics: {
      interventionPresent: interventionPresent
        ? knownFact(true, "Une intervention est explicitement présente dans le Research Project.", provenance)
        : unknownFact<boolean>("La présence d’une intervention n’est pas qualifiée.", provenance),
      medicinalProductTrial: unknownFact<boolean>("La qualification d’essai médicamenteux n’est pas établie.", provenance),
      medicalDeviceStudy: unknownFact<boolean>("La qualification d’étude de dispositif n’est pas établie.", provenance),
    },
    productCharacteristics: { productTypes: unknownFact<ProductType[]>("Les types de produits ne sont pas qualifiés.", provenance) },
    dataCharacteristics: {
      personalHealthData: unknownFact<boolean>("La présence de données personnelles de santé n’est pas qualifiée.", provenance),
      existingData: unknownFact<boolean>("L’utilisation de données existantes n’est pas qualifiée.", provenance),
      prospectiveCollection: unknownFact<boolean>("Le recueil prospectif n’est pas qualifié.", provenance),
      routinelyCollectedHealthData: unknownFact<boolean>("Le recours à des données de soins courants n’est pas qualifié.", provenance),
      sources: unknownFact<string[]>("Les sources de données ne sont pas qualifiées.", provenance),
      transferOutsideEea: unknownFact<boolean>("Les transferts hors EEE ne sont pas qualifiés.", provenance),
    },
    biologicalSampleCharacteristics: { samplesPresent: unknownFact<boolean>("La qualification des échantillons biologiques reste à établir.", provenance) },
    multicenterCharacteristics: {
      multicenter: multicenterDeclared
        ? knownFact(true, "Le caractère multicentrique est explicitement confirmé dans le Project.", provenance)
        : unknownFact<boolean>("Le caractère multicentrique n’est pas qualifié.", provenance),
      centerCount: unknownFact<number>("Le nombre de centres n’est pas défini.", provenance),
    },
    internationalCharacteristics: {
      international: unknownFact<boolean>("Le caractère international n’est pas qualifié.", provenance),
      centerJurisdictions: unknownFact<JurisdictionCode[]>("Les juridictions des centres ne sont pas qualifiées.", provenance),
      crossCountryRequirementDiscoveryNeeded: unknownFact<boolean>("Le besoin d’exigences multi-pays n’est pas qualifié.", provenance),
    },
    fundingProgramCandidates: unknownFact<FundingProgramCandidate[]>("Aucun programme de financement n’est qualifié.", provenance),
    fundingProgramEditionCandidates: unknownFact<FundingProgramEditionCandidate[]>("Aucune édition de financement n’est qualifiée.", provenance),
    knownRegulatoryQualifications: [],
    unknowns: [{
      unknownId: `${project.versionId}:regulatory-qualification-open`,
      field: "regulatoryQualification",
      reason: "La qualification réglementaire reste hors de cette verticale documentaire.",
      provenance,
    }],
    contradictions: [],
    humanDecisions: source.documentHandoff.humanDecisions,
    provenance,
  });
};

const requestFor = (
  project: Readonly<ResearchProjectOwnerProjection>,
  handoffDecision: Readonly<HumanDecisionEnvelope> | null,
  requestedAt: string,
  priorProjection: Readonly<DocumentProjection> | null,
) => {
  const source = projectDocumentSourceFromFunctionalProject(project, handoffDecision);
  const regulatory = resolveRegulatoryRequirements(regulatoryInputFor(project, source, requestedAt));
  const template = composeStudyTemplateInstance({
    researchProject: source,
    applicableRequirementSet: regulatory,
    documentaryPatternGraph: DOCUMENTARY_PATTERN_CATALOG,
    upstreamHumanDecisions: source.documentHandoff.humanDecisions,
    declaredUnknowns: source.missingInformation.map((reason, index) => ({
      unknownId: `${project.versionId}:document-unknown:${index + 1}`,
      field: "researchProject.missingInformation",
      reason,
      provenance: [project.versionId, project.projectDigest],
    })),
    declaredLimitations: source.limitations.map((reason, index) => ({
      limitationId: `${project.versionId}:document-limitation:${index + 1}`,
      reason,
      provenance: [project.versionId, project.projectDigest],
    })),
    compositionAsOf: requestedAt,
    requestedDetailLevel: "FULL",
  });
  const request: DocumentProjectionRequest = {
    project: source,
    decisionRecords: source.documentHandoff.humanDecisions,
    projectionType: "PROTOCOL",
    profile: "RESEARCH_PROTOCOL_WORKING_PROJECTION",
    usage: "SCIENTIFIC_PROJECT_REVIEW",
    audience: "RESEARCH_TEAM",
    requestedAt,
    priorProjection,
    templateContext: { definition: CLINICAL_STUDY_TEMPLATE, instance: template },
    regulatoryResolutionRef: {
      resolutionId: regulatory.resolutionId,
      corpusVersion: regulatory.corpusVersion,
      corpusDigest: regulatory.corpusDigest,
    },
    documentaryPatternSnapshotRef: {
      catalogId: DOCUMENTARY_PATTERN_CATALOG.catalogId,
      catalogVersion: DOCUMENTARY_PATTERN_CATALOG.version,
      catalogDigest: DOCUMENTARY_PATTERN_CATALOG.digest,
    },
    humanDecisions: source.documentHandoff.humanDecisions,
    unknowns: source.missingInformation,
    limitations: source.limitations,
    provenance: source.provenance.sourceRefs,
  };
  return { request, definitions: resolveTemplateDocumentDefinitions(request) };
};

const dimensionForSection = (sectionId: string): FunctionalDocumentBlockerGroup["dimension"] => {
  if (/population/i.test(sectionId)) return "Population";
  if (/endpoint|variable|objective|hypoth/i.test(sectionId)) return "Critères";
  if (/visit|temporal/i.test(sectionId)) return "Temporalité";
  if (/imaging/i.test(sectionId)) return "Imagerie";
  if (/analysis|statistic|data-management/i.test(sectionId)) return "Analyse";
  return "Autres";
};

const blockerGroupsFrom = (projection: Readonly<DocumentProjection>): FunctionalDocumentBlockerGroup[] => {
  const groups = new Map<FunctionalDocumentBlockerGroup["dimension"], string[]>();
  for (const section of projection.sections) {
    if (["GENERATABLE", "NOT_APPLICABLE"].includes(section.status) && !section.unknowns.length && !section.contradictions.length) continue;
    const dimension = dimensionForSection(section.sectionId);
    const values = uniqueSorted([
      ...section.unknowns,
      ...section.contradictions,
      ...section.statusReasons.filter((reason) => !/^TMP /i.test(reason)),
    ]).slice(0, 3);
    if (!values.length) values.push(`${section.title} reste à compléter.`);
    groups.set(dimension, uniqueSorted([...(groups.get(dimension) ?? []), ...values]).slice(0, 4));
  }
  return [...groups.entries()].map(([dimension, items]) => ({ dimension, items }));
};

const emptyCard = (kind: FunctionalDocumentKind, label: FunctionalDocumentCard["label"]): FunctionalDocumentCard => ({
  kind,
  label,
  templateStatus: "PROJECT_REQUIRED",
  projectionReadiness: null,
  freshness: "NO_PROJECTION",
  stateLabel: "En attente du projet",
  explanation: "Le document sera évalué à partir d’une version confirmée du Research Project.",
  blockerGroups: [],
  projectionId: null,
  sourceProjectVersion: null,
  canRequestProjection: false,
  canOpen: false,
});

export const createEmptyFunctionalResetDocumentPortfolio = (): FunctionalResetDocumentPortfolio => ({
  contract: "FUNCTIONAL_RESET_DOCUMENT_PORTFOLIO",
  contractVersion: "1.0.0",
  boundary: FUNCTIONAL_RESET_DOCUMENT_BOUNDARY,
  owner: "DOC-001",
  projectRef: null,
  handoffDecision: null,
  projections: [],
  cards: [emptyCard("PROTOCOL", "Protocole"), emptyCard("DMP", "DMP"), emptyCard("SAP", "SAP")],
  lastFailure: null,
});

const failedCard = (kind: FunctionalDocumentKind, label: FunctionalDocumentCard["label"], message: string): FunctionalDocumentCard => ({
  kind,
  label,
  templateStatus: "ENGINE_ERROR",
  projectionReadiness: null,
  freshness: "NO_PROJECTION",
  stateLabel: "Mise à jour impossible",
  explanation: message,
  blockerGroups: [],
  projectionId: null,
  sourceProjectVersion: null,
  canRequestProjection: kind === "PROTOCOL",
  canOpen: false,
});

export const markFunctionalResetDocumentFailure = (
  project: Readonly<ResearchProjectOwnerProjection>,
  previous: Readonly<FunctionalResetDocumentPortfolio>,
  error: unknown,
): FunctionalResetDocumentPortfolio => {
  const message = error instanceof Error ? error.message : "La frontière documentaire n’a pas pu être mise à jour.";
  const prior = previous.projections.at(-1) ?? null;
  const stale = prior && (prior.source.projectVersion !== project.versionId || prior.source.projectDigest !== project.projectDigest);
  return {
    ...previous,
    projectRef: { projectId: project.projectId, projectVersion: project.versionId, projectDigest: project.projectDigest },
    cards: [
      stale ? {
        kind: "PROTOCOL",
        label: "Protocole",
        templateStatus: "ENGINE_ERROR",
        projectionReadiness: prior.readiness,
        freshness: "STALE",
        stateLabel: "Version antérieure disponible",
        explanation: "Le projet a changé depuis cette version du protocole. La mise à jour documentaire a échoué sans modifier le Project.",
        blockerGroups: blockerGroupsFrom(prior),
        projectionId: prior.projectionId,
        sourceProjectVersion: prior.source.projectVersion,
        canRequestProjection: true,
        canOpen: true,
      } : failedCard("PROTOCOL", "Protocole", "NOXIA n’a pas pu mettre à jour la partie documentaire du projet."),
      failedCard("DMP", "DMP", "État documentaire momentanément indisponible."),
      failedCard("SAP", "SAP", "État documentaire momentanément indisponible."),
    ],
    lastFailure: { code: "FUNCTIONAL_DOCUMENT_BOUNDARY_ERROR", message, resumeCondition: "Réessayer depuis la version courante du Research Project." },
  };
};

const futureCard = (
  kind: "DMP" | "SAP",
  definition: ReturnType<typeof resolveTemplateDocumentDefinitions>[number] | undefined,
): FunctionalDocumentCard => ({
  kind,
  label: kind,
  templateStatus: definition?.status ?? "UNKNOWN",
  projectionReadiness: null,
  freshness: "NO_PROJECTION",
  stateLabel: definition?.status === "NOT_APPLICABLE" ? "Non applicable" : definition?.status === "BLOCKED" ? "Bloqué" : definition?.status === "UNKNOWN" ? "À qualifier" : "Non disponible actuellement",
  explanation: definition?.status === "NOT_APPLICABLE"
    ? "La structure documentaire qualifie ce document comme non applicable à ce Project."
    : definition?.status === "BLOCKED"
      ? "Des dépendances ou contradictions documentaires empêchent actuellement cette projection."
      : definition?.status === "UNKNOWN"
        ? "Les informations disponibles ne permettent pas encore de qualifier ce document."
        : "La structure est répertoriée, mais aucune projection de travail n’est disponible dans la capacité actuelle.",
  blockerGroups: [],
  projectionId: null,
  sourceProjectVersion: null,
  canRequestProjection: false,
  canOpen: false,
});

const refusalFailure = (plan: ProjectionPlan): FunctionalResetDocumentPortfolio["lastFailure"] => plan.refusal ? {
  code: plan.refusal.code,
  message: plan.refusal.reason,
  resumeCondition: plan.refusal.resumeCondition,
} : null;

export const refreshFunctionalResetDocumentPortfolio = (input: {
  project: Readonly<ResearchProjectOwnerProjection>;
  previous?: Readonly<FunctionalResetDocumentPortfolio> | null;
  handoffDecision?: Readonly<HumanDecisionEnvelope> | null;
  requestedAt: string;
  generateProtocol?: boolean;
}): FunctionalResetDocumentPortfolio => {
  const previous = input.previous ?? createEmptyFunctionalResetDocumentPortfolio();
  const priorProjection = previous.projections.at(-1) ?? null;
  const currentDecision = input.handoffDecision?.status === "ADOPTED" && input.handoffDecision.projectVersion === input.project.versionId
    ? input.handoffDecision
    : null;
  const { request, definitions } = requestFor(input.project, currentDecision, input.requestedAt, priorProjection);
  const protocolDefinition = definitions.find((item) => item.documentId === "PROTOCOL");
  const dmpDefinition = definitions.find((item) => item.documentId === "DATA_MANAGEMENT_PLAN");
  const sapDefinition = definitions.find((item) => item.documentId === "SAP");
  const stale = Boolean(priorProjection && (
    priorProjection.source.projectVersion !== input.project.versionId
    || priorProjection.source.projectDigest !== input.project.projectDigest
  ));
  let projection = priorProjection;
  let failure: FunctionalResetDocumentPortfolio["lastFailure"] = null;
  if (input.generateProtocol && currentDecision) {
    const execution = projectDocumentFromStudyTemplate(request);
    if ("plan" in execution) failure = refusalFailure(execution.plan);
    else projection = execution.projection;
  }
  const isCurrent = Boolean(projection
    && projection.source.projectVersion === input.project.versionId
    && projection.source.projectDigest === input.project.projectDigest);
  const protocolCard: FunctionalDocumentCard = isCurrent && projection ? {
    kind: "PROTOCOL",
    label: "Protocole",
    templateStatus: protocolDefinition?.status ?? "UNKNOWN",
    projectionReadiness: projection.readiness,
    freshness: "CURRENT",
    stateLabel: projection.readiness === "READY_FOR_REVIEW" ? "Aperçu disponible pour revue" : "Aperçu partiel disponible",
    explanation: projection.readiness === "READY_FOR_REVIEW"
      ? "Une projection de travail a été produite depuis la version courante du Project."
      : "Les informations disponibles ont été projetées et les sections encore ouvertes restent visibles.",
    blockerGroups: blockerGroupsFrom(projection),
    projectionId: projection.projectionId,
    sourceProjectVersion: projection.source.projectVersion,
    canRequestProjection: false,
    canOpen: true,
  } : stale && projection ? {
    kind: "PROTOCOL",
    label: "Protocole",
    templateStatus: protocolDefinition?.status ?? "UNKNOWN",
    projectionReadiness: projection.readiness,
    freshness: "STALE",
    stateLabel: "À actualiser",
    explanation: "Le projet a changé depuis cette version du protocole.",
    blockerGroups: blockerGroupsFrom(projection),
    projectionId: projection.projectionId,
    sourceProjectVersion: projection.source.projectVersion,
    canRequestProjection: true,
    canOpen: true,
  } : {
    kind: "PROTOCOL",
    label: "Protocole",
    templateStatus: protocolDefinition?.status ?? "UNKNOWN",
    projectionReadiness: null,
    freshness: "NO_PROJECTION",
    stateLabel: failure ? "Projection impossible" : "Version de travail possible",
    explanation: failure?.message ?? "Une autorisation humaine explicite est nécessaire pour projeter cette version du Project.",
    blockerGroups: [],
    projectionId: null,
    sourceProjectVersion: null,
    canRequestProjection: true,
    canOpen: false,
  };
  const projections = projection && !previous.projections.some((item) => item.projectionId === projection?.projectionId)
    ? [...previous.projections, projection]
    : [...previous.projections];
  return {
    contract: "FUNCTIONAL_RESET_DOCUMENT_PORTFOLIO",
    contractVersion: "1.0.0",
    boundary: FUNCTIONAL_RESET_DOCUMENT_BOUNDARY,
    owner: "DOC-001",
    projectRef: { projectId: input.project.projectId, projectVersion: input.project.versionId, projectDigest: input.project.projectDigest },
    handoffDecision: currentDecision,
    projections,
    cards: [protocolCard, futureCard("DMP", dmpDefinition), futureCard("SAP", sapDefinition)],
    lastFailure: failure,
  };
};

export const functionalProtocolProjection = (
  portfolio: Readonly<FunctionalResetDocumentPortfolio>,
  projectionId: string | null,
) => projectionId ? portfolio.projections.find((projection) => projection.projectionId === projectionId && projection.projectionType === "PROTOCOL") ?? null : null;
