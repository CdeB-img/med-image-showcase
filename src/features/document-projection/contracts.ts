import type { CommitmentRule, FactDefinition, GenerabilityDefinition, ProjectionDefinition, ProjectionType, ProjectionVersions, SectionDefinition, TextDefinition } from "./types";
import { DOCUMENT_PROJECTION_ENGINE_VERSION, DOCUMENT_PROJECTION_RENDERER_VERSION } from "./types";

export const DEFAULT_PROJECTION_VERSIONS: ProjectionVersions = Object.freeze({
  engine: DOCUMENT_PROJECTION_ENGINE_VERSION,
  template: "projection-definition-1.0",
  pattern: "editorial-patterns-1.0",
  compositionPolicy: "noxia-document-composition-1.0",
  projectionDefinition: "1.0",
  renderer: DOCUMENT_PROJECTION_RENDERER_VERSION,
});

export const PROJECTION_CATALOG: ReadonlyArray<{ type: ProjectionType; label: string; implemented: boolean }> = Object.freeze([
  { type: "PROTOCOL", label: "Protocol", implemented: true },
  { type: "SYNOPSIS", label: "Synopsis", implemented: false },
  { type: "FUNDING", label: "Funding", implemented: false },
  { type: "PUBLICATION", label: "Publication", implemented: false },
  { type: "CRF", label: "CRF", implemented: false },
  { type: "DATA_DICTIONARY", label: "Data Dictionary", implemented: false },
  { type: "SAP", label: "SAP", implemented: false },
  { type: "BUDGET", label: "Budget", implemented: false },
  { type: "TIMELINE", label: "Timeline", implemented: false },
  { type: "CPP", label: "CPP", implemented: false },
  { type: "ANSM", label: "ANSM", implemented: false },
  { type: "CORE_LAB_MANUAL", label: "Core Lab Manual", implemented: false },
  { type: "MONITORING_PLAN", label: "Monitoring Plan", implemented: false },
  { type: "INVESTIGATOR_GUIDE", label: "Investigator Guide", implemented: false },
]);

function commitment(value: "CONFIRMED" | "ADOPTED" | "CANDIDATE" | "REQUIREMENT" | "UNKNOWN" | "LIMITATION" | "CONTRADICTION" | "REJECTED"): CommitmentRule {
  return { kind: "STATIC", value };
}
const reviewCommitment: CommitmentRule = { kind: "FIELD_MAP", path: "reviewState", map: { ADOPTED: "ADOPTED", PENDING: "CANDIDATE", REJECTED: "REJECTED" }, fallback: "CANDIDATE" };
const epistemicCommitment: CommitmentRule = { kind: "FIELD_MAP", path: "epistemicState", map: { KNOWN: "ADOPTED", ASSUMED: "CANDIDATE", UNKNOWN: "UNKNOWN", WITHHELD: "UNKNOWN" }, fallback: "UNKNOWN" };
const statusCommitment: CommitmentRule = { kind: "FIELD_MAP", path: "status", map: { APPROVED: "ADOPTED", PENDING: "UNKNOWN", REJECTED: "REJECTED" }, fallback: "UNKNOWN" };
const fact = (select: string, label: string, template: string, sourceKind: string, commitmentRule: CommitmentRule, sourceIdPath?: string, includeWhen?: FactDefinition["includeWhen"]): FactDefinition => ({ select, label, template, sourceKind, commitment: commitmentRule, sourceIdPath, includeWhen });
const text = (select: string, template = "{{value}}", includeWhen?: TextDefinition["includeWhen"]): TextDefinition => ({ select, template, includeWhen });
const generability = (overrides: Partial<GenerabilityDefinition> = {}): GenerabilityDefinition => ({
  minimumFacts: 1,
  partialWhenUnknowns: false,
  partialWhenLimitations: false,
  partialWhenPendingDecisions: false,
  blockWhenContradictions: false,
  messages: {
    GENERATABLE: "Les objets sources requis par cette définition sont disponibles.",
    PARTIALLY_GENERATABLE: "La composition conserve les éléments disponibles et expose ce qui reste ouvert.",
    NOT_GENERATABLE: "Les objets sources minimaux sont absents ; aucun contenu n'est inventé.",
    BLOCKED: "Une condition bloquante source interdit une composition complète.",
    NOT_APPLICABLE: "La source qualifie explicitement cette section comme non applicable.",
  },
  ...overrides,
});

const section = (definition: SectionDefinition): SectionDefinition => Object.freeze(definition);

const protocolSections: SectionDefinition[] = [
  section({
    sectionId: "document-control", title: "Identification et contrôle documentaire", order: 1, intent: "TRACE", pattern: "IDENTITY",
    sourcePaths: ["documentHandoff", "candidateVersion", "provenance", "impactGraph.nodes"], requiredObjectKinds: ["ResearchProjectVersion"], optionalObjectKinds: ["WorkingTitle"], dependencyTypes: ["SOURCE_VERSION"], specializedEngine: null,
    applicability: { kind: "ALWAYS", value: "APPLICABLE" }, generability: generability({ minimumFacts: 4 }),
    facts: [
      fact("$root", "Projet source", "{{root.documentHandoff.projectId}}", "ResearchProject", commitment("CONFIRMED"), "documentHandoff.projectId"),
      fact("$root", "Version source gelée", "{{root.candidateVersion.versionId}}", "ResearchProjectVersion", commitment("CONFIRMED"), "candidateVersion.versionId"),
      fact("$root", "Digest source", "{{root.resultDigest}}", "ResearchProjectVersion", commitment("CONFIRMED"), "candidateVersion.versionId"),
      fact("$root", "Handoff documentaire", "{{root.documentHandoff.status}}", "DocumentHandoff", commitment("ADOPTED"), "documentHandoff.candidateVersionRef"),
      fact("impactGraph.nodes[]", "Titre de travail", "{{label}}", "WorkingTitle", epistemicCommitment, "versionRef", { kind: "ITEM_FIELD_EQUALS", path: "scientificRole", value: "WORKING_TITLE" }),
      fact("impactGraph.nodes[]", "Titre de travail", "{{label}}", "WorkingTitle", epistemicCommitment, "versionRef", { kind: "ITEM_FIELD_EQUALS", path: "scientificRole", value: "PROJECT_TITLE" }),
      fact("impactGraph.nodes[]", "Titre de travail", "{{label}}", "WorkingTitle", epistemicCommitment, "versionRef", { kind: "ITEM_FIELD_EQUALS", path: "scientificRole", value: "TITLE" }),
      fact("$root", "Frontière", "Projection en lecture seule ; ni vérité du projet, ni protocole clinique exécutable.", "DOC-001", commitment("LIMITATION")),
    ], unknowns: [], limitations: [], contradictions: [], decisionGateIds: [],
  }),
  section({
    sectionId: "synopsis", title: "Synopsis du projet", order: 2, intent: "INFORM", pattern: "SYNTHESIS",
    sourcePaths: ["scientificQuestion", "objectives", "populationDesign", "selectedStudyDesignCandidate"], requiredObjectKinds: ["ScientificQuestion"], optionalObjectKinds: ["Objective", "Population", "StudyDesign"], dependencyTypes: ["SCIENTIFIC_STRUCTURE"], specializedEngine: null,
    applicability: { kind: "ALWAYS", value: "APPLICABLE" }, generability: generability({ minimumFacts: 2, partialWhenUnknowns: true, partialWhenPendingDecisions: true }),
    facts: [
      fact("scientificQuestion", "Question", "{{text}}", "ScientificQuestion", commitment("CONFIRMED"), "questionId", { kind: "ITEM_FIELD_NOT_EQUALS", path: "text", value: "__EMPTY__" }),
      fact("objectives[]", "Objectif principal", "{{text}}", "Objective", reviewCommitment, "objectiveId", { kind: "ITEM_FIELD_EQUALS", path: "level", value: "PRIMARY" }),
      fact("populationDesign.populationConcept.conditionOrPathology[]", "Population", "{{value}}", "Population", commitment("CANDIDATE")),
      fact("studyDesignCandidates[]", "Plan d’étude", "{{label}}", "StudyDesign", { kind: "SELECTED_REF", itemPath: "designId", rootPath: "selectedStudyDesignCandidate.designId", selected: "ADOPTED", other: "CANDIDATE" }, "designId", { kind: "ITEM_EQUALS_ROOT", path: "designId", rootPath: "selectedStudyDesignCandidate.designId" }),
    ],
    unknowns: [text("populationDesign.missingInformation[]"), text("$root", "Le plan d’étude n’est pas adopté.", { kind: "ROOT_PATH_EQUALS", path: "selectedStudyDesignCandidate", value: "__NULL__" })], limitations: [], contradictions: [], decisionGateIds: ["PRJ-GATE-STUDY-DESIGN"],
  }),
  section({
    sectionId: "scientific-question", title: "Question scientifique", order: 3, intent: "DECLARE", pattern: "DECLARATIVE",
    sourcePaths: ["scientificQuestion"], requiredObjectKinds: ["ScientificQuestion"], optionalObjectKinds: [], dependencyTypes: ["QUESTION"], specializedEngine: null,
    applicability: { kind: "ALWAYS", value: "APPLICABLE" }, generability: generability(),
    facts: [fact("scientificQuestion", "Question scientifique confirmée", "{{text}}", "ScientificQuestion", commitment("CONFIRMED"), "questionId", { kind: "ITEM_FIELD_NOT_EQUALS", path: "text", value: "__EMPTY__" })], unknowns: [], limitations: [], contradictions: [], decisionGateIds: [],
  }),
  section({
    sectionId: "objectives-hypotheses", title: "Objectifs et hypothèses", order: 4, intent: "DECLARE", pattern: "ENUMERATION",
    sourcePaths: ["objectives", "hypotheses"], requiredObjectKinds: [], optionalObjectKinds: ["Objective", "Hypothesis"], dependencyTypes: ["SCIENTIFIC_STRUCTURE"], specializedEngine: null,
    applicability: { kind: "ALWAYS", value: "APPLICABLE" }, generability: generability({ partialWhenUnknowns: true }),
    facts: [
      fact("impactGraph.nodes[]", "Objectif {{scientificRole}}", "{{label}}", "Objective", epistemicCommitment, "versionRef", { kind: "ITEM_FIELD_EQUALS", path: "canonicalType", value: "OBJECTIVE" }),
      fact("impactGraph.nodes[]", "Hypothèse {{scientificRole}}", "{{label}}", "Hypothesis", epistemicCommitment, "versionRef", { kind: "ITEM_FIELD_EQUALS", path: "canonicalType", value: "HYPOTHESIS" }),
      fact("objectives[]", "Objectif {{level}}", "{{text}}", "Objective", reviewCommitment, "objectiveId", { kind: "ROOT_PATH_NOT_EQUALS", path: "impactGraph.canonicalSource", value: "true" }),
      fact("hypotheses[]", "Hypothèse {{kind}}", "{{text}}", "Hypothesis", reviewCommitment, "hypothesisId", { kind: "ROOT_PATH_NOT_EQUALS", path: "impactGraph.canonicalSource", value: "true" }),
    ], unknowns: [text("$root", "Aucun Objectif source n’est disponible.", { kind: "ALL", predicates: [
      { kind: "ROOT_PATH_NOT_EQUALS", path: "impactGraph.canonicalSource", value: "true" },
      { kind: "ROOT_PATH_EQUALS", path: "objectives", value: "__EMPTY__" },
    ] })], limitations: [], contradictions: [], decisionGateIds: [],
  }),
  section({
    sectionId: "population", title: "Population scientifique", order: 5, intent: "JUSTIFY", pattern: "SYNTHESIS",
    sourcePaths: ["populationDesign"], requiredObjectKinds: ["Population"], optionalObjectKinds: [], dependencyTypes: ["POPULATION"], specializedEngine: null,
    applicability: { kind: "ALWAYS", value: "APPLICABLE" }, generability: generability({ partialWhenUnknowns: true, partialWhenPendingDecisions: true }),
    facts: [
      fact("populationDesign.populationConcept.conditionOrPathology[]", "Condition ou pathologie", "{{value}}", "Population", commitment("CANDIDATE")),
      fact("populationDesign.populationConcept.clinicalContext[]", "Contexte clinique", "{{value}}", "Population", commitment("CANDIDATE")),
      fact("populationDesign.populationConcept.questionRequiredCharacteristics[]", "Caractéristique requise", "{{value}}", "Population", commitment("REQUIREMENT")),
      fact("populationDesign.operationalEligibility.requirements[]", "Éligibilité opérationnelle future", "{{requirement}} — {{whyNeeded}}", "Population", commitment("REQUIREMENT")),
    ], unknowns: [text("populationDesign.missingInformation[]")], limitations: [], contradictions: [], staticLimitations: ["Les critères d’éligibilité opérationnels restent une définition spécialisée future."], decisionGateIds: ["PRJ-GATE-POPULATION"],
  }),
  section({
    sectionId: "study-design", title: "Plan d’étude", order: 6, intent: "JUSTIFY", pattern: "SYNTHESIS",
    sourcePaths: ["studyDesignCandidates", "selectedStudyDesignCandidate", "multicenterAssessment"], requiredObjectKinds: [], optionalObjectKinds: ["StudyDesign"], dependencyTypes: ["STUDY_DESIGN_DECISION"], specializedEngine: null,
    applicability: { kind: "ALWAYS", value: "APPLICABLE" }, generability: generability({ partialWhenPendingDecisions: true }),
    facts: [
      fact("impactGraph.nodes[]", "Caractéristique de design confirmée", "{{label}}", "StudyDesign", epistemicCommitment, "versionRef", { kind: "ITEM_FIELD_EQUALS", path: "canonicalType", value: "STUDY_DESIGN" }),
      fact("studyDesignCandidates[]", "Plan adopté", "{{label}} — {{whyItAnswersQuestion}}", "StudyDesign", commitment("ADOPTED"), "designId", { kind: "ITEM_EQUALS_ROOT", path: "designId", rootPath: "selectedStudyDesignCandidate.designId" }),
      fact("studyDesignCandidates[]", "Alternative candidate", "{{label}} — {{whyItAnswersQuestion}}", "StudyDesign", commitment("CANDIDATE"), "designId", { kind: "ITEM_NOT_EQUALS_ROOT", path: "designId", rootPath: "selectedStudyDesignCandidate.designId" }),
      fact("multicenterAssessment", "Caractéristique de design confirmée", "{{declaredMode}}", "StudyDesign", commitment("CONFIRMED"), undefined, { kind: "ITEM_FIELD_NOT_EQUALS", path: "declaredMode", value: "__EMPTY__" }),
    ], unknowns: [], limitations: [text("studyDesignCandidates[]", "{{limitations}}")], contradictions: [], decisionGateIds: ["PRJ-GATE-STUDY-DESIGN"],
  }),
  section({
    sectionId: "groups-comparators", title: "Groupes et comparateurs", order: 7, intent: "DECLARE", pattern: "ENUMERATION",
    sourcePaths: ["groups", "comparators"], requiredObjectKinds: [], optionalObjectKinds: ["Group", "Comparator"], dependencyTypes: ["STUDY_DESIGN"], specializedEngine: null,
    applicability: { kind: "WHEN_ANY_NON_EMPTY", paths: ["groups", "comparators"], whenPresent: "CONDITIONALLY_APPLICABLE", whenAbsent: "APPLICABILITY_UNKNOWN" }, generability: generability({ partialWhenPendingDecisions: true }),
    facts: [
      fact("groups[]", "Groupe {{role}}", "{{label}} — {{justification}}", "Group", reviewCommitment, "groupId"),
      fact("comparators[]", "Comparateur", "{{justification}}", "Comparator", reviewCommitment, "comparatorId"),
    ], unknowns: [], limitations: [], contradictions: [], decisionGateIds: ["PRJ-GATE-GROUPS"],
  }),
  section({
    sectionId: "visits-temporal", title: "Visites et structure temporelle", order: 8, intent: "DECLARE", pattern: "ENUMERATION",
    sourcePaths: ["visits", "temporalStructure"], requiredObjectKinds: [], optionalObjectKinds: ["Visit", "TemporalStructure"], dependencyTypes: ["STUDY_DESIGN"], specializedEngine: null,
    applicability: { kind: "WHEN_ANY_NON_EMPTY", paths: ["visits"], whenPresent: "CONDITIONALLY_APPLICABLE", whenAbsent: "APPLICABILITY_UNKNOWN" }, generability: generability({ partialWhenUnknowns: true }),
    facts: [
      fact("temporalStructure", "Rationnel temporel", "{{rationale}}", "TemporalStructure", commitment("CANDIDATE")),
      fact("temporalStructure", "Ancrage temporel", "{{anchor}}", "TemporalStructure", commitment("CANDIDATE"), undefined, { kind: "ITEM_FIELD_NOT_EQUALS", path: "anchor", value: "__EMPTY__" }),
      fact("visits[]", "Visit {{temporalRole}}", "{{label}} — {{timingValue}} {{timingStatus}} — {{justification}}", "Visit", commitment("CANDIDATE"), "visitId"),
    ], unknowns: [text("temporalStructure.unknowns[]"), text("visits[]", "{{label}} : {{timingStatus}}", { kind: "ITEM_FIELD_NOT_EQUALS", path: "timingStatus", value: "KNOWN" })], limitations: [], contradictions: [], decisionGateIds: [],
  }),
  section({
    sectionId: "endpoints-variables", title: "Critères et variables", order: 9, intent: "DECLARE", pattern: "ENUMERATION",
    sourcePaths: ["endpointCandidates", "variables", "measurementDependencies"], requiredObjectKinds: [], optionalObjectKinds: ["Endpoint", "Variable"], dependencyTypes: ["PRIMARY_ENDPOINT_DECISION"], specializedEngine: null,
    applicability: { kind: "WHEN_ANY_NON_EMPTY", paths: ["endpointCandidates", "variables"], whenPresent: "CONDITIONALLY_APPLICABLE", whenAbsent: "APPLICABILITY_UNKNOWN" }, generability: generability({ partialWhenUnknowns: true, partialWhenPendingDecisions: true }),
    facts: [
      fact("impactGraph.nodes[]", "Critère {{scientificRole}}", "{{label}}", "Endpoint", epistemicCommitment, "versionRef", { kind: "ITEM_FIELD_EQUALS", path: "canonicalType", value: "ENDPOINT" }),
      fact("impactGraph.nodes[]", "Mesure {{scientificRole}}", "{{label}}", "Variable", epistemicCommitment, "versionRef", { kind: "ITEM_FIELD_EQUALS", path: "canonicalType", value: "CANONICAL_VARIABLE" }),
      fact("endpointCandidates[]", "Critère {{proposedRole}}", "{{label}} — {{justification}}", "Endpoint", { kind: "ROOT_GATE", gateId: "PRJ-GATE-PRIMARY-ENDPOINT", map: { APPROVED: "ADOPTED", PENDING: "CANDIDATE", REJECTED: "REJECTED" }, fallback: "CANDIDATE" }, "endpointId", { kind: "ROOT_PATH_NOT_EQUALS", path: "impactGraph.canonicalSource", value: "true" }),
      fact("variables[]", "Variable {{role}}", "{{definition}}", "Variable", { kind: "FIELD_MAP", path: "knowledgeStatus", map: { KNOWN: "CANDIDATE", PARTIAL: "UNKNOWN", UNKNOWN: "UNKNOWN" }, fallback: "UNKNOWN" }, "variableId", { kind: "ROOT_PATH_NOT_EQUALS", path: "impactGraph.canonicalSource", value: "true" }),
    ], unknowns: [text("variables[]", "{{definition}} : connaissance {{knowledgeStatus}}", { kind: "ITEM_FIELD_NOT_EQUALS", path: "knowledgeStatus", value: "KNOWN" })], limitations: [text("endpointCandidates[]", "{{limitations}}")], contradictions: [], decisionGateIds: ["PRJ-GATE-PRIMARY-ENDPOINT"],
  }),
  section({
    sectionId: "imaging", title: "Contribution Imaging", order: 10, intent: "BOUND", pattern: "REQUIREMENT_REGISTER",
    sourcePaths: ["imagingContribution"], requiredObjectKinds: [], optionalObjectKinds: ["ImagingContribution"], dependencyTypes: ["IMAGING_HANDOFF"], specializedEngine: "Imaging Study Designer",
    applicability: { kind: "PATH_ENUM", path: "imagingContribution.applicability", map: { APPLICABLE: "APPLICABLE", NOT_APPLICABLE: "NOT_APPLICABLE", REQUIRED_BUT_NOT_READY: "APPLICABILITY_UNKNOWN" }, fallback: "APPLICABILITY_UNKNOWN" },
    generability: generability({ partialWhenLimitations: true, blockWhen: [{ kind: "ROOT_PATH_EQUALS", path: "imagingContribution.equipmentCompatibilityStatus", value: "INCOMPATIBLE" }, { kind: "ROOT_PATH_EQUALS", path: "imagingContribution.projectHandoffReadiness", value: "PROJECT_HANDOFF_BLOCKED" }] }),
    facts: [
      fact("imagingContribution", "Applicabilité Imaging", "{{applicability}}", "ImagingContribution", commitment("CONFIRMED")),
      fact("imagingContribution", "Handoff Imaging", "{{projectHandoffReadiness}}", "ImagingContribution", commitment("ADOPTED"), "resultRef", { kind: "ITEM_FIELD_NOT_EQUALS", path: "projectHandoffReadiness", value: "__EMPTY__" }),
      fact("imagingContribution", "Compatibilité équipement", "{{equipmentCompatibilityStatus}}", "ImagingContribution", commitment("UNKNOWN"), "resultRef", { kind: "ITEM_FIELD_NOT_EQUALS", path: "equipmentCompatibilityStatus", value: "__EMPTY__" }),
      fact("imagingContribution", "Protocole d’acquisition exécutable", "{{executableProtocolReadiness}}", "ImagingContribution", commitment("LIMITATION"), "resultRef", { kind: "ITEM_FIELD_NOT_EQUALS", path: "executableProtocolReadiness", value: "__EMPTY__" }),
      fact("imagingContribution.acquisitionRefs[]", "Référence d’acquisition conceptuelle", "{{value}}", "ImagingAcquisition", commitment("REQUIREMENT")),
      fact("imagingContribution.qualityRefs[]", "Référence qualité", "{{value}}", "ImagingQuality", commitment("REQUIREMENT")),
    ], unknowns: [], limitations: [text("imagingContribution.limitations[]"), text("imagingContribution.requiredFutureReviews[]")], contradictions: [], staticLimitations: ["Aucun paramètre constructeur ni protocole d’acquisition exécutable n’est produit par DOC-001."], decisionGateIds: [],
  }),
  section({
    sectionId: "biospecimens", title: "Prélèvements / échantillons", order: 11, intent: "DECLARE", pattern: "ENUMERATION",
    sourcePaths: ["impactGraph.nodes"], requiredObjectKinds: [], optionalObjectKinds: ["BiospecimenMaterialCollection"], dependencyTypes: ["STUDY_DESIGN"], specializedEngine: null,
    applicability: { kind: "WHEN_ANY_NON_EMPTY", paths: ["impactGraph.nodes"], whenPresent: "CONDITIONALLY_APPLICABLE", whenAbsent: "APPLICABILITY_UNKNOWN" }, generability: generability(),
    facts: [
      fact("impactGraph.nodes[]", "Prélèvement / échantillon", "{{label}}", "BiospecimenMaterialCollection", epistemicCommitment, "versionRef", { kind: "ITEM_FIELD_EQUALS", path: "scientificRole", value: "SAMPLE_COLLECTION" }),
    ], unknowns: [], limitations: [], contradictions: [], decisionGateIds: [],
  }),
  section({
    sectionId: "analysis-statistics", title: "Exigences d’analyse et statistiques", order: 12, intent: "BOUND", pattern: "REQUIREMENT_REGISTER",
    sourcePaths: ["analysisRequirements", "biostatisticsRequirements", "sizingRequirements"], requiredObjectKinds: [], optionalObjectKinds: ["AnalysisRequirement"], dependencyTypes: ["BIOSTATISTICS_REVIEW"], specializedEngine: "Biostatistics Engine",
    applicability: { kind: "WHEN_ANY_NON_EMPTY", paths: ["analysisRequirements", "endpointCandidates"], whenPresent: "CONDITIONALLY_APPLICABLE", whenAbsent: "APPLICABILITY_UNKNOWN" }, generability: generability({ requirementsOnly: true, partialWhenUnknowns: true }),
    facts: [
      fact("analysisRequirements[]", "Exigence {{purpose}}", "{{reason}}", "AnalysisRequirement", commitment("REQUIREMENT"), "requirementId"),
      fact("biostatisticsRequirements", "Statut Biostatistics", "{{status}}", "BiostatisticsRequirement", commitment("REQUIREMENT")),
      fact("sizingRequirements", "Dimensionnement", "{{notice}}", "SizingRequirement", commitment("LIMITATION")),
    ], unknowns: [text("biostatisticsRequirements.unknownAssumptions[]"), text("biostatisticsRequirements.missingNumericalInputs[]"), text("sizingRequirements.inputs[]", "{{name}} : {{reason}}")], limitations: [], contradictions: [], staticLimitations: ["Aucun modèle statistique, nombre de sujets, puissance ou valeur numérique n’est inventé."], decisionGateIds: [],
  }),
  section({
    sectionId: "data-management", title: "Exigences de Data Management", order: 13, intent: "BOUND", pattern: "REQUIREMENT_REGISTER",
    sourcePaths: ["dataManagementRequirements"], requiredObjectKinds: [], optionalObjectKinds: ["DataRequirement"], dependencyTypes: ["DATA_REVIEW"], specializedEngine: "Data Management Engine",
    applicability: { kind: "WHEN_ANY_NON_EMPTY", paths: ["dataManagementRequirements"], whenPresent: "CONDITIONALLY_APPLICABLE", whenAbsent: "APPLICABILITY_UNKNOWN" }, generability: generability({ requirementsOnly: true, partialWhenUnknowns: true }),
    facts: [fact("dataManagementRequirements[]", "Exigence {{kind}}", "{{reason}}", "DataRequirement", commitment("REQUIREMENT"), "requirementId")], unknowns: [text("$root", "Les exigences Data Management spécialisées ne sont pas disponibles.", { kind: "ROOT_PATH_EQUALS", path: "dataManagementRequirements", value: "__EMPTY__" })], limitations: [], contradictions: [], staticLimitations: ["Aucune procédure Data Management, CRF ou Data Dictionary n’est déduite de ces exigences."], decisionGateIds: [],
  }),
  section({
    sectionId: "safety-regulatory-operations", title: "Questions de sécurité, réglementation et opérations", order: 14, intent: "BOUND", pattern: "REQUIREMENT_REGISTER",
    sourcePaths: ["safetyQuestions", "regulatoryQuestions", "operationsQuestions", "economicsQuestions"], requiredObjectKinds: [], optionalObjectKinds: ["SpecializedQuestion"], dependencyTypes: ["SPECIALIZED_REVIEW"], specializedEngine: "Specialized domain engines",
    applicability: { kind: "WHEN_ANY_NON_EMPTY", paths: ["safetyQuestions", "regulatoryQuestions", "operationsQuestions", "economicsQuestions"], whenPresent: "CONDITIONALLY_APPLICABLE", whenAbsent: "APPLICABILITY_UNKNOWN" }, generability: generability({ requirementsOnly: true, alwaysPartialWhenFacts: true }),
    facts: [
      fact("safetyQuestions[]", "Sécurité — question ouverte", "{{question}} — déclencheur : {{trigger}}", "SpecializedQuestion", commitment("REQUIREMENT"), "questionId"),
      fact("regulatoryQuestions[]", "Réglementation — question ouverte", "{{question}} — déclencheur : {{trigger}}", "SpecializedQuestion", commitment("REQUIREMENT"), "questionId"),
      fact("operationsQuestions[]", "Opérations — question ouverte", "{{question}} — déclencheur : {{trigger}}", "SpecializedQuestion", commitment("REQUIREMENT"), "questionId"),
      fact("economicsQuestions[]", "Économie — question ouverte", "{{question}} — déclencheur : {{trigger}}", "SpecializedQuestion", commitment("REQUIREMENT"), "questionId"),
    ], unknowns: [text("safetyQuestions[]", "Sécurité : {{status}}"), text("regulatoryQuestions[]", "Réglementation : {{status}}"), text("operationsQuestions[]", "Opérations : {{status}}"), text("economicsQuestions[]", "Économie : {{status}}")], limitations: [], contradictions: [], staticLimitations: ["Aucune réponse réglementaire, de sécurité, opérationnelle ou économique n’est inventée."], decisionGateIds: [],
  }),
  section({
    sectionId: "risks-biases-limitations", title: "Risques, biais et limitations", order: 15, intent: "BOUND", pattern: "ENUMERATION",
    sourcePaths: ["risks", "biases", "confounders", "limitations"], requiredObjectKinds: [], optionalObjectKinds: ["Risk", "Bias", "Confounder", "Limitation"], dependencyTypes: ["LIMITATIONS_DECISION"], specializedEngine: null,
    applicability: { kind: "ALWAYS", value: "APPLICABLE" }, generability: generability({ partialWhenPendingDecisions: true }),
    facts: [
      fact("risks[]", "Risque", "{{source}} — impact : {{impact}} — mitigation candidate : {{mitigationCandidate}}", "Risk", commitment("CANDIDATE"), "riskId"),
      fact("biases[]", "Biais", "{{label}} — {{justification}}", "Bias", commitment("CANDIDATE"), "biasId"),
      fact("confounders[]", "Facteur de confusion candidat", "{{label}} — {{whyPlausible}}", "Confounder", commitment("CANDIDATE"), "confounderId"),
      fact("limitations[]", "Limitation source", "{{value}}", "Limitation", commitment("LIMITATION")),
      fact("impactGraph.nodes[]", "Élément à préciser", "{{label}}", "ProjectUnknown", epistemicCommitment, "versionRef", { kind: "ITEM_FIELD_EQUALS", path: "canonicalType", value: "UNCERTAINTY" }),
    ], unknowns: [], limitations: [], contradictions: [], decisionGateIds: ["PRJ-GATE-LIMITATIONS"],
  }),
  section({
    sectionId: "open-elements", title: "Décisions humaines, inconnues et contradictions", order: 16, intent: "BOUND", pattern: "TRACE_REGISTER",
    sourcePaths: ["decisionsRequired", "missingInformation", "contradictions", "candidateVersion"], requiredObjectKinds: [], optionalObjectKinds: ["Decision", "Unknown", "Contradiction"], dependencyTypes: ["HUMAN_DECISION"], specializedEngine: null,
    applicability: { kind: "ALWAYS", value: "APPLICABLE" }, generability: generability({ minimumFacts: 0, partialWhenUnknowns: true, partialWhenPendingDecisions: true, blockWhenContradictions: true }),
    facts: [
      fact("decisionsRequired[]", "Décision {{status}}", "{{label}} — {{reason}}", "DecisionGate", statusCommitment, "gateId"),
      fact("missingInformation[]", "Information manquante", "{{value}}", "Unknown", commitment("UNKNOWN")),
      fact("contradictions[]", "Contradiction", "{{value}}", "Contradiction", commitment("CONTRADICTION")),
    ], unknowns: [text("missingInformation[]"), text("candidateVersion.unknowns[]")], limitations: [], contradictions: [text("contradictions[]"), text("candidateVersion.contradictions[]")], decisionGateIds: ["*"],
  }),
  section({
    sectionId: "provenance-version", title: "Provenance, versions et historique", order: 17, intent: "TRACE", pattern: "TRACE_REGISTER",
    sourcePaths: ["provenance", "trace", "candidateVersion", "documentHandoff"], requiredObjectKinds: ["Provenance", "SourceVersion"], optionalObjectKinds: [], dependencyTypes: ["TRACEABILITY"], specializedEngine: null,
    applicability: { kind: "ALWAYS", value: "APPLICABLE" }, generability: generability({ minimumFacts: 3 }),
    facts: [
      fact("$root", "Version du projet", "{{root.candidateVersion.versionId}}", "ResearchProjectVersion", commitment("CONFIRMED"), "candidateVersion.versionId"),
      fact("$root", "Version antérieure", "{{root.candidateVersion.priorVersion}}", "ResearchProjectVersion", commitment("CONFIRMED"), "candidateVersion.versionId"),
      fact("$root", "KnowledgeResult", "{{root.candidateVersion.knowledgeResultRef}}", "KnowledgeResult", commitment("CONFIRMED"), "candidateVersion.knowledgeResultRef"),
      fact("$root", "Moteur propriétaire source", "{{root.provenance.engineVersion}} — {{root.provenance.llmContributionStatus}}", "Provenance", commitment("CONFIRMED"), "provenance.inputRef"),
      fact("provenance.policyRefs[]", "Politique source", "{{value}}", "Policy", commitment("CONFIRMED")),
      fact("provenance.sourceRefs[]", "Source", "{{value}}", "Source", commitment("CONFIRMED")),
    ], unknowns: [], limitations: [], contradictions: [], decisionGateIds: [],
  }),
];

export const PROTOCOL_PROJECTION_DEFINITION: ProjectionDefinition = Object.freeze({
  definitionId: "noxia-protocol-projection-definition",
  projectionType: "PROTOCOL",
  label: "Protocol",
  title: "Protocol — projection documentaire",
  definitionVersion: "1.0",
  status: "IMPLEMENTED",
  sections: protocolSections,
});

export const PROJECTION_DEFINITIONS: ReadonlyArray<ProjectionDefinition> = Object.freeze([PROTOCOL_PROJECTION_DEFINITION]);
export const projectionCatalogEntry = (type: ProjectionType) => PROJECTION_CATALOG.find((item) => item.type === type) ?? null;

export const PROTOCOL_TEMPLATE_SECTION_BINDINGS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  "document-control": ["TMP-NODE:PROJECT_IDENTITY", "TMP-BLOCK:PROTOCOL:SPECIFIC", "TMP-NODE:PROVENANCE"],
  synopsis: ["TMP-NODE:SCIENTIFIC_QUESTION", "TMP-NODE:OBJECTIVES", "TMP-NODE:POPULATION", "TMP-NODE:STUDY_DESIGN"],
  "scientific-question": ["TMP-NODE:SCIENTIFIC_QUESTION"],
  "objectives-hypotheses": ["TMP-NODE:OBJECTIVES", "TMP-NODE:HYPOTHESES"],
  population: ["TMP-NODE:POPULATION"],
  "study-design": ["TMP-NODE:STUDY_DESIGN"],
  "groups-comparators": ["TMP-NODE:STUDY_DESIGN"],
  "visits-temporal": ["TMP-NODE:STUDY_DESIGN"],
  "endpoints-variables": ["TMP-NODE:ENDPOINTS"],
  imaging: ["TMP-NODE:IMAGING_CONTRIBUTION"],
  biospecimens: ["TMP-NODE:BIOSPECIMENS"],
  "analysis-statistics": ["TMP-NODE:REQUIREMENT_REGISTER", "TMP-NODE:FUTURE_SPECIALIZED_INPUTS"],
  "data-management": ["TMP-NODE:REQUIREMENT_REGISTER", "TMP-NODE:FUTURE_SPECIALIZED_INPUTS"],
  "safety-regulatory-operations": ["TMP-NODE:REQUIREMENT_REGISTER", "TMP-NODE:FUTURE_SPECIALIZED_INPUTS"],
  "risks-biases-limitations": ["TMP-NODE:LIMITATIONS", "TMP-NODE:CONFLICTS"],
  "open-elements": ["TMP-NODE:HUMAN_DECISIONS", "TMP-NODE:UNKNOWNS", "TMP-NODE:CONFLICTS"],
  "provenance-version": ["TMP-NODE:PROVENANCE", "TMP-NODE:TRACE_ANNEX"],
});
