import { logicalDigest } from "@/features/knowledge-engine/canonical";
import type { HumanDecisionEnvelope } from "@/features/protocol-designer/human-decision";
import {
  IMAGING_STUDY_DESIGNER_VERSION,
  parseImagingDesignInput,
  parseImagingDesignResult,
  type ImagingDesignInput,
  type ImagingDesignResult,
} from "../types";

export const RC_TEST_02_REFERENCE_IDS = {
  narrowMrEcvHistology: "RC-TEST-02-IMG-REF-01_NARROW_MR_ECV_HISTOLOGY",
  multicenterPartialEquipment: "RC-TEST-02-IMG-REF-02_MULTICENTER_PARTIAL_EQUIPMENT",
  fabryLongitudinalEcv: "RC-TEST-02-IMG-REF-03_FABRY_LONGITUDINAL_ECV",
} as const;

export type RcTest02ReferenceId = (typeof RC_TEST_02_REFERENCE_IDS)[keyof typeof RC_TEST_02_REFERENCE_IDS];

type ReferenceSpec = {
  referenceId: RcTest02ReferenceId;
  scientificScope: string;
  question: string;
  population: string[];
  pathology: string[];
  construct: string;
  outcome: string;
  temporalContext: string[];
  sourceId: string;
  sourceLocator: string;
  knowledgeVersion: string;
  limitations: string[];
  unknowns: string[];
  centerMode: ImagingDesignInput["centerContext"]["mode"];
  centerDeclarations: string[];
  equipment: ImagingDesignInput["declaredEquipment"];
  equipmentCompatibilityStatus: ImagingDesignResult["projectConstructionHandoff"]["equipmentCompatibilityStatus"];
  requiredFutureReviews: string[];
  interpretationBelowRepeatability: string | null;
};

export type GovernedImagingReferenceMetadata = {
  fixtureId: RcTest02ReferenceId;
  fixtureSchemaVersion: "1.0.0";
  fixtureKind: "HUMAN_APPROVED_GOVERNED_TEST_REFERENCE";
  fixtureProducer: "TEST_HARNESS";
  scientificScope: string;
  contractOwner: "IMAGING";
  contractOwnerVersion: typeof IMAGING_STUDY_DESIGNER_VERSION;
  sourceResultId: string;
  sourceResultIdKind: "CONTRACT_SHAPED_REFERENCE_RESULT_ID";
  runtimeOwnerExecuted: false;
  runtimeOwnerResultId: null;
  sourceCommit: "0852fb2f0b49d9132851559ce5591b89664dd35b";
  projectVersion: "RC-TEST-02-PROJECT-REFERENCE@1.0.0";
  knowledgeVersion: string;
  stVersion: "UNKNOWN_NOT_RUNTIME_BOUND";
  humanReferenceDecisionId: string;
  humanDecisionProvenance: "HUMAN_APPROVED_RC_TEST_02_REFERENCE_DECISION_2026_08_28";
  contradictionStatus: "NONE_IN_POSITIVE_REFERENCE_NEGATIVE_REFERENCE_PRESERVED_SEPARATELY";
  limitations: string[];
  createdFrom: "HUMAN_APPROVED_GOVERNED_REFERENCE_SPECIFICATION";
  supersedes: "IMG_001B_LIVE_HANDOFF_FIXTURE_FOR_DOWNSTREAM_CONSUMERS";
  digest: string;
};

const SOURCE_COMMIT = "0852fb2f0b49d9132851559ce5591b89664dd35b" as const;
const FIXTURE_VERSION = "1.0.0" as const;
const PROJECT_VERSION = "RC-TEST-02-PROJECT-REFERENCE@1.0.0" as const;
const HUMAN_PROVENANCE = "HUMAN_APPROVED_RC_TEST_02_REFERENCE_DECISION_2026_08_28" as const;
const TRANSPLANT_SOURCE_ID = "noxia:radiology:source:pubmed:23553570:revision:2";
const TRANSPLANT_ASSERTION_ID = "noxia:radiology:scientific-assertion:ecv-t1:mr-ecv-correlates-histology";
const FABRY_SOURCE_ID = "PD002:ReasoningBook:1.0";
const FABRY_SOURCE_SHA = "750ea6dac7daf94fab303166457463862b3810131d5801830b5318c5c9d880e7";

const governedReferenceResultId = (referenceId: RcTest02ReferenceId) => `governed-imaging-reference-result:${referenceId}:v${FIXTURE_VERSION}`;

const sharedUnknowns = [
  "FIELD_STRENGTH_UNKNOWN",
  "MANUFACTURER_UNKNOWN",
  "MODEL_UNKNOWN",
  "SOFTWARE_VERSION_UNKNOWN",
  "SEQUENCE_UNKNOWN",
  "RECONSTRUCTION_UNKNOWN",
  "ANALYSIS_METHOD_UNKNOWN",
  "EXACT_TIMING_UNKNOWN",
  "LOCAL_REFERENCE_CONDITIONS_UNKNOWN",
];

const sharedLimitations = [
  "CONCEPTUAL_NON_EXECUTABLE_TEST_REFERENCE_ONLY",
  "NO_EQUIPMENT_COMPATIBILITY_CLAIM",
  "NO_EXECUTABLE_ACQUISITION_PROTOCOL",
  "NO_CLINICAL_VALIDATION_CLAIM",
  "NO_SCIENTIFIC_PASS",
  "NO_PD011_PASS",
];

const specs: Record<RcTest02ReferenceId, ReferenceSpec> = {
  [RC_TEST_02_REFERENCE_IDS.narrowMrEcvHistology]: {
    referenceId: RC_TEST_02_REFERENCE_IDS.narrowMrEcvHistology,
    scientificScope: "TRANSPLANT_HISTOLOGY_VALIDATION_CONTEXT_ONLY",
    question: "Dans le sous-ensemble de validation par transplantation cardiaque décrit par la source, une mesure IRM de l’ECV peut-elle être retenue comme stratégie candidate pour approcher l’espace extracellulaire histologique, sans généralisation au-delà de ce contexte ?",
    population: ["Sous-ensemble sélectionné de validation par transplantation cardiaque décrit par la source"],
    pathology: ["UNKNOWN"],
    construct: "Espace extracellulaire myocardique histologique dans le sous-ensemble sélectionné",
    outcome: "ECV myocardique dérivée de l’IRM, mesure candidate bornée",
    temporalContext: ["UNKNOWN_EXPLICITLY_RECORDED"],
    sourceId: TRANSPLANT_SOURCE_ID,
    sourceLocator: "PubMed > Abstract > Methods; associated Results and Conclusions evidence link",
    knowledgeVersion: `${TRANSPLANT_ASSERTION_ID}@revision:2`,
    limitations: [
      ...sharedLimitations,
      "SMALL_SELECTED_HISTOLOGIC_VALIDATION_SUBSET_SIX_EXPLANTED_HEARTS",
      "NO_GENERALIZATION_BEYOND_DESCRIBED_TRANSPLANT_HISTOLOGY_CONTEXT",
      "ECV_IS_NOT_A_UNIVERSAL_OR_CLINICALLY_VALIDATED_BIOMARKER_ROLE",
    ],
    unknowns: sharedUnknowns,
    centerMode: "UNKNOWN",
    centerDeclarations: [],
    equipment: [],
    equipmentCompatibilityStatus: "UNKNOWN",
    requiredFutureReviews: ["EQUIPMENT_COMPATIBILITY_REVIEW", "EXECUTABLE_ACQUISITION_REVIEW"],
    interpretationBelowRepeatability: null,
  },
  [RC_TEST_02_REFERENCE_IDS.multicenterPartialEquipment]: {
    referenceId: RC_TEST_02_REFERENCE_IDS.multicenterPartialEquipment,
    scientificScope: "TRANSPLANT_HISTOLOGY_VALIDATION_CONTEXT_WITH_SYNTHETIC_MULTICENTER_EQUIPMENT_STATE",
    question: "Dans le sous-ensemble de validation par transplantation cardiaque décrit par la source, comment préserver une mesure candidate IRM de l’ECV avec une disponibilité multicentrique partiellement connue sans inventer la compatibilité ?",
    population: ["Sous-ensemble sélectionné de validation par transplantation cardiaque décrit par la source"],
    pathology: ["UNKNOWN"],
    construct: "Espace extracellulaire myocardique histologique dans le sous-ensemble sélectionné",
    outcome: "ECV myocardique dérivée de l’IRM, mesure candidate bornée",
    temporalContext: ["UNKNOWN_EXPLICITLY_RECORDED"],
    sourceId: TRANSPLANT_SOURCE_ID,
    sourceLocator: "PubMed > Abstract > Methods; associated Results and Conclusions evidence link",
    knowledgeVersion: `${TRANSPLANT_ASSERTION_ID}@revision:2`,
    limitations: [
      ...sharedLimitations,
      "SMALL_SELECTED_HISTOLOGIC_VALIDATION_SUBSET_SIX_EXPLANTED_HEARTS",
      "NO_GENERALIZATION_BEYOND_DESCRIBED_TRANSPLANT_HISTOLOGY_CONTEXT",
      "CENTRE_A_IS_A_SYNTHETIC_GOVERNED_TEST_ENTITY_NOT_A_REAL_INSTITUTION",
      "CENTRE_B_EQUIPMENT_REMAINS_UNKNOWN",
      "NO_COMMERCIAL_COMPATIBILITY_OR_HARMONIZATION_SUCCESS_CLAIM",
    ],
    unknowns: [
      "CENTRE_B_AVAILABILITY_UNKNOWN",
      "CENTRE_B_MANUFACTURER_UNKNOWN",
      "CENTRE_B_MODEL_UNKNOWN",
      "CENTRE_B_SOFTWARE_VERSION_UNKNOWN",
      "FIELD_STRENGTH_UNKNOWN",
      "EXACT_ACQUISITION_PARAMETERS_UNKNOWN",
    ],
    centerMode: "MULTICENTRIC_HETEROGENEOUS",
    centerDeclarations: ["Centre A — synthetic governed test entity", "Centre B — synthetic governed test entity"],
    equipment: [
      {
        equipmentId: "RC-TEST-02-REF-02:CENTRE-A",
        siteLabel: "Centre A — synthetic governed test entity",
        modality: "IRM",
        manufacturer: "SYNTHETIC_TEST_VALUE",
        model: "SYNTHETIC_TEST_VALUE",
        fieldStrength: null,
        softwareVersion: "SYNTHETIC_TEST_VALUE",
        options: [],
        availability: "KNOWN_AVAILABLE",
        period: null,
        provenanceRef: HUMAN_PROVENANCE,
      },
      {
        equipmentId: "RC-TEST-02-REF-02:CENTRE-B",
        siteLabel: "Centre B — synthetic governed test entity",
        modality: "IRM",
        manufacturer: null,
        model: null,
        fieldStrength: null,
        softwareVersion: null,
        options: [],
        availability: "UNKNOWN",
        period: null,
        provenanceRef: HUMAN_PROVENANCE,
      },
    ],
    equipmentCompatibilityStatus: "PARTIALLY_KNOWN",
    requiredFutureReviews: ["MULTICENTER_HARMONIZATION_REVIEW", "EQUIPMENT_COMPATIBILITY_REVIEW"],
    interpretationBelowRepeatability: null,
  },
  [RC_TEST_02_REFERENCE_IDS.fabryLongitudinalEcv]: {
    referenceId: RC_TEST_02_REFERENCE_IDS.fabryLongitudinalEcv,
    scientificScope: "CONFIRMED_FABRY_LONGITUDINAL_MYOCARDIAL_EXTRACELLULAR_EXPANSION",
    question: "Chez des adultes dont la maladie de Fabry est étiologiquement confirmée, comment l’ECV myocardique mesurée en IRM cardiaque évolue-t-elle entre un temps initial défini et un ou plusieurs temps de suivi définis, sans présupposer la direction ni l’importance de cette évolution ?",
    population: ["Adultes avec maladie de Fabry étiologiquement confirmée"],
    pathology: ["Maladie de Fabry confirmée"],
    construct: "Expansion extracellulaire myocardique",
    outcome: "ECV myocardique dérivée de l’IRM, mesure de recherche candidate bornée",
    temporalContext: ["Temps initial à définir", "Un ou plusieurs temps de suivi à définir"],
    sourceId: FABRY_SOURCE_ID,
    sourceLocator: "PD-002 §20; O3; O5; H9; D6; D9; D10; evidence map; REF-R09/R19/R30/R31/R32",
    knowledgeVersion: `PD-002@1.0#sha256:${FABRY_SOURCE_SHA}`,
    limitations: [
      ...sharedLimitations,
      "ECV_IS_NOT_COLLAGEN_PERCENTAGE",
      "ECV_IS_NOT_A_UNIVERSAL_FABRY_BIOMARKER_ROLE",
      "GLOBAL_AND_REGIONAL_ECV_ARE_DISTINCT",
      "EARLY_DIFFUSE_FABRY_FIBROSIS_INCOMPLETELY_CHARACTERIZED",
      "LONGITUDINAL_REGIONAL_ECV_INCOMPLETELY_CHARACTERIZED",
      "NO_UNIVERSAL_CLINICALLY_IMPORTANT_ECV_CHANGE_THRESHOLD",
      "NO_TREATMENT_EFFECT_PROGNOSTIC_OR_CLINICAL_DECISION_CLAIM",
      "SYNTHETIC_HAEMATOCRIT_NOT_AUTHORIZED_BY_THIS_REFERENCE",
      "FABRY_CANDIDATE_PACKAGE_REMAINS_CANDIDATE_NOT_ACTIVATED_AND_HUMAN_REVIEW_REQUIRED",
    ],
    unknowns: [
      ...sharedUnknowns,
      "SEX_UNKNOWN_UNTIL_SEPARATELY_DEFINED",
      "VARIANT_UNKNOWN_UNTIL_SEPARATELY_DEFINED",
      "DISEASE_STAGE_UNKNOWN_UNTIL_SEPARATELY_DEFINED",
      "RENAL_FUNCTION_UNKNOWN_UNTIL_SEPARATELY_DEFINED",
      "TREATMENT_STATUS_UNKNOWN_UNTIL_SEPARATELY_DEFINED",
      "LONGITUDINAL_COMPARABILITY_NOT_VALIDATED",
    ],
    centerMode: "UNKNOWN",
    centerDeclarations: [],
    equipment: [],
    equipmentCompatibilityStatus: "UNKNOWN",
    requiredFutureReviews: ["EQUIPMENT_COMPATIBILITY_REVIEW", "LONGITUDINAL_COMPARABILITY_REVIEW", "REPEATABILITY_INTERPRETATION_REVIEW"],
    interpretationBelowRepeatability: "NOT_INTERPRETABLE_AS_PROGRESS_OR_REGRESSION",
  },
};

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach((entry) => deepFreeze(entry));
    Object.freeze(value);
  }
  return value;
};

const humanDecision = (spec: ReferenceSpec): HumanDecisionEnvelope => ({
  envelopeVersion: "1.0",
  decisionId: `human-decision:rc-test-02:${spec.referenceId}:2026-08-28`,
  gateId: `RC-TEST-02-HUMAN-REFERENCE-GATE:${spec.referenceId}`,
  actor: "Charles — autorité humaine du programme NOXIA",
  mandate: "RC-TEST-02_HUMAN_REFERENCE_DECISIONS_2026-08-28",
  scope: [spec.referenceId, "GOVERNED_CONCEPTUAL_NON_EXECUTABLE_TEST_REFERENCE"],
  status: "ADOPTED",
  version: 1,
  timestamp: "2026-08-28",
  impact: {
    affectedObjects: [spec.referenceId],
    affectedEngines: ["IMAGING_TEST_REFERENCE"],
    reopenedGates: [],
    obsoleteProjections: ["IMG_001B_LIVE_HANDOFF_FIXTURE_FOR_DOWNSTREAM_CONSUMERS"],
  },
  targets: [spec.referenceId],
  reason: "Référence de test conceptuelle, gouvernée et non exécutable approuvée dans le périmètre humain RC-TEST-02.",
  provenance: [HUMAN_PROVENANCE, "docs/implementation/rc-test-02-human-decisions-and-fabry-reference-validation.md"],
  engineSource: "IMAGING",
  projectVersion: PROJECT_VERSION,
});

const knowledgeStatement = (spec: ReferenceSpec): ImagingDesignInput["knowledge"]["assertions"][number] => ({
  statementId: `${spec.referenceId}:KNOWLEDGE-STATEMENT`,
  text: spec.referenceId === RC_TEST_02_REFERENCE_IDS.fabryLongitudinalEcv
    ? "Dans la maladie de Fabry confirmée, l’ECV myocardique dérivée de l’IRM est une mesure de recherche candidate bornée de l’expansion extracellulaire; les valeurs globales et régionales restent distinctes et un changement longitudinal ne doit pas être présupposé."
    : "Dans le sous-ensemble sélectionné de validation par transplantation cardiaque décrit par la source, l’ECV myocardique dérivée de l’IRM est associée à l’espace extracellulaire histologique sans généralisation hors de ce contexte.",
  conceptIds: [`${spec.referenceId}:CONSTRUCT`, `${spec.referenceId}:ECV`, `${spec.referenceId}:MRI`],
  status: "HUMAN_APPROVED_BOUNDED_TEST_REFERENCE",
  applicability: "PARTIAL_LIMITED_TO_DECLARED_CONTEXT",
  sourceId: spec.sourceId,
  locator: spec.sourceLocator,
  limitations: spec.limitations,
  modality: "IRM",
});

const buildInput = (spec: ReferenceSpec): ImagingDesignInput => {
  const decision = humanDecision(spec);
  const material = {
    referenceId: spec.referenceId,
    fixtureVersion: FIXTURE_VERSION,
    question: spec.question,
    scientificScope: spec.scientificScope,
    knowledgeVersion: spec.knowledgeVersion,
    humanDecisionId: decision.decisionId,
  };
  const inputDigest = logicalDigest(material);
  return parseImagingDesignInput({
    contractVersion: IMAGING_STUDY_DESIGNER_VERSION,
    inputId: `imaging-design-input:${spec.referenceId}:v${FIXTURE_VERSION}`,
    researchProjectId: `research-project:${spec.referenceId}`,
    strategyVersion: `${spec.referenceId}@${FIXTURE_VERSION}`,
    sourceHandoff: {
      kind: "VALIDATED_DESIGN_CONTEXT",
      stOutputRef: null,
      status: "VALIDATED_WITHOUT_ST_HANDOFF",
      boundary: "NO_PROTOCOL_NO_METHOD_SELECTION_NO_STATISTICAL_PLAN",
      humanDecisions: [decision],
    },
    originalExpression: spec.question,
    confirmedScientificQuestion: { questionId: `${spec.referenceId}:QUESTION`, text: spec.question, confirmation: "HUMAN_CONFIRMED" },
    objectives: [{ objectiveId: `${spec.referenceId}:OBJECTIVE`, text: `Examiner ${spec.outcome} dans le périmètre déclaré sans généralisation.`, level: "PRIMARY", reviewState: "ADOPTED" }],
    hypotheses: [{ hypothesisId: `${spec.referenceId}:HYPOTHESIS`, text: `La mesure candidate peut informer ${spec.construct} dans le seul contexte déclaré.`, kind: "PRIMARY", reviewState: "ADOPTED" }],
    mechanisms: [],
    centralScientificObject: spec.construct,
    scientificObjectTerms: [spec.construct, spec.outcome, "IRM cardiaque"],
    pathologyOrCondition: spec.pathology,
    populationContext: spec.population,
    temporalContext: spec.temporalContext,
    phenomenaDeclared: [spec.construct],
    outcomesDeclared: [spec.outcome],
    methodPreferences: ["IRM cardiaque"],
    scientificRelationships: ["MR_DERIVED_MYOCARDIAL_ECV_ASSOCIATED_WITH_DECLARED_EXTRACELLULAR_CONSTRUCT"],
    knownConstraints: [...spec.limitations, ...spec.unknowns],
    declaredEquipment: spec.equipment,
    centerContext: { mode: spec.centerMode, declarations: spec.centerDeclarations },
    knowledge: {
      resultId: `governed-knowledge-reference:${spec.referenceId}`,
      resultDigest: logicalDigest({ sourceId: spec.sourceId, locator: spec.sourceLocator, version: spec.knowledgeVersion, statement: knowledgeStatement(spec) }),
      coverageStatus: "PARTIAL_BOUNDED_HUMAN_APPROVED_TEST_REFERENCE",
      concepts: [
        { conceptId: `${spec.referenceId}:CONSTRUCT`, label: spec.construct, objectType: "PHYSIOLOGICAL_CONSTRUCT", resolutionKind: "HUMAN_APPROVED_GOVERNED_REFERENCE", originalTerms: [spec.construct] },
        { conceptId: `${spec.referenceId}:ECV`, label: spec.outcome, objectType: "DERIVED_MEASUREMENT", resolutionKind: "HUMAN_APPROVED_GOVERNED_REFERENCE", originalTerms: ["ECV"] },
        { conceptId: `${spec.referenceId}:MRI`, label: "IRM", objectType: "MODALITY", resolutionKind: "HUMAN_APPROVED_GOVERNED_REFERENCE", originalTerms: ["IRM cardiaque"] },
      ],
      assertions: [knowledgeStatement(spec)],
      documentaryStatements: [],
      gaps: spec.unknowns.map((unknown) => ({ code: unknown, explanation: unknown, affectedConceptIds: [`${spec.referenceId}:ECV`, `${spec.referenceId}:MRI`], resumeCondition: "Définition séparée, sourcée et humainement validée avant exécution." })),
      limitations: spec.limitations,
      sourceIds: [spec.sourceId],
      matchingSemantics: "EXACT_FIRST_NO_IMPLICIT_FALLBACK",
    },
    decisions: [decision.decisionId],
    uncertainties: spec.unknowns,
    contradictions: [],
    safetyFlags: [],
    provenance: [HUMAN_PROVENANCE, spec.sourceId, `source-commit:${SOURCE_COMMIT}`],
    trace: [{ sequence: 1, operation: "READ_GOVERNED_REFERENCE", decision: "STATIC_HUMAN_APPROVED_REFERENCE_NO_OWNER_RUNTIME", inputDigest, outputDigest: inputDigest }],
  });
};

const buildResult = (spec: ReferenceSpec): ImagingDesignResult => {
  const input = buildInput(spec);
  const decision = humanDecision(spec);
  const phenomenonId = `${spec.referenceId}:PHENOMENON`;
  const biomarkerId = `${spec.referenceId}:BIOMARKER`;
  const modalityId = `${spec.referenceId}:MODALITY`;
  const acquisitionId = `${spec.referenceId}:ACQUISITION`;
  const qualityRuleId = `${spec.referenceId}:QUALITY`;
  const analysisId = `${spec.referenceId}:ANALYSIS`;
  const variableId = `${spec.referenceId}:VARIABLE`;
  const endpointId = `${spec.referenceId}:ENDPOINT-CONTRIBUTION`;
  const resultId = governedReferenceResultId(spec.referenceId);
  const resultDigest = logicalDigest({
    fixtureVersion: FIXTURE_VERSION,
    referenceId: spec.referenceId,
    inputDigest: logicalDigest(input),
    scientificScope: spec.scientificScope,
    limitations: spec.limitations,
    unknowns: spec.unknowns,
    humanDecisionId: decision.decisionId,
    handoff: "FROZEN_CONCEPTUAL_IMAGING_STRATEGY_ONLY",
  });
  const equipment = spec.equipment.length ? spec.equipment : [{
    equipmentId: `${spec.referenceId}:UNDECLARED-EQUIPMENT`,
    siteLabel: "Site et équipement non déclarés",
    modality: "IRM",
    manufacturer: null,
    model: null,
    fieldStrength: null,
    softwareVersion: null,
    options: [],
    availability: "UNKNOWN" as const,
    period: null,
    provenanceRef: HUMAN_PROVENANCE,
  }];
  const equipmentAssessment: ImagingDesignResult["equipmentAssessment"] = equipment.map((item) => ({
    assessmentId: `${spec.referenceId}:ASSESSMENT:${item.equipmentId}`,
    equipmentId: item.equipmentId,
    acquisitionId,
    availability: item.availability,
    availabilityEvidenceStatus: item.availability === "KNOWN_AVAILABLE" ? "VERIFIED" : "UNKNOWN",
    compatibility: "UNKNOWN_COMPATIBILITY",
    gaps: ["Exact equipment compatibility is not established by this governed conceptual reference."],
    evidenceRefs: [item.provenanceRef],
    assumptionForbidden: true,
  }));
  return parseImagingDesignResult({
    contractVersion: IMAGING_STUDY_DESIGNER_VERSION,
    inputVersion: IMAGING_STUDY_DESIGNER_VERSION,
    resultId,
    resultDigest,
    status: "STRATEGY_CANDIDATES",
    projectionNotice: "RUNTIME_PROJECTION_DOES_NOT_OWN_CANONICAL_SCIENCE",
    scientificQuestion: input.confirmedScientificQuestion,
    objectives: input.objectives,
    hypotheses: input.hypotheses,
    phenomena: [{
      phenomenonId,
      label: spec.construct,
      role: "PRIMARY",
      objectiveIds: [input.objectives[0]!.objectiveId],
      hypothesisIds: [input.hypotheses[0]!.hypothesisId],
      mechanismIds: [],
      context: [...spec.pathology, ...spec.population, ...spec.temporalContext],
      observability: "INDIRECT_ONLY",
      knowledgeSupport: "PARTIALLY_SUPPORTED",
      evidenceRefs: [`${spec.sourceId}#${spec.sourceLocator}`],
      limitations: spec.limitations,
      confounders: [],
      unknowns: spec.unknowns,
      reviewState: "ADOPTED",
    }],
    biomarkerCandidates: [{
      biomarkerId,
      label: spec.outcome,
      conceptId: `${spec.referenceId}:ECV`,
      phenomenonIds: [phenomenonId],
      objectiveIds: [input.objectives[0]!.objectiveId],
      measurementType: "DERIVED_MEASUREMENT",
      quantification: "PARTIALLY_SUPPORTED",
      domainOfValidity: [...spec.pathology, ...spec.population],
      dependencies: ["NATIVE_AND_POST_CONTRAST_MYOCARDIAL_AND_BLOOD_T1", "CONTEMPORANEOUS_HAEMATOCRIT"],
      technicalSensitivity: "PARTIALLY_SUPPORTED",
      timingSensitivity: "PARTIALLY_SUPPORTED",
      reproducibility: "UNKNOWN",
      limitations: spec.limitations,
      confounders: [],
      evidenceRefs: [`${spec.sourceId}#${spec.sourceLocator}`],
      applicability: "PARTIALLY_SUPPORTED",
      knowledgeGaps: spec.unknowns,
      reviewState: "ADOPTED",
    }],
    biomarkerComparison: [],
    modalityCandidates: [{
      modalityId,
      label: "IRM",
      conceptId: `${spec.referenceId}:MRI`,
      biomarkerIds: [biomarkerId],
      phenomenonIds: [phenomenonId],
      role: "CANDIDATE",
      support: "PARTIALLY_SUPPORTED",
      dimensions: { scientificCoverage: "PARTIALLY_SUPPORTED", equipment: "UNKNOWN", reproducibility: "UNKNOWN" },
      dependencies: ["GOVERNED_MR_ECV_MEASUREMENT_CHAIN"],
      limitations: spec.limitations,
      risks: ["Exact technical compatibility remains unknown."],
      evidenceRefs: [`${spec.sourceId}#${spec.sourceLocator}`],
      reviewState: "ADOPTED",
    }],
    modalityComparison: [],
    acquisitionStrategies: [{
      acquisitionId,
      modalityId,
      biomarkerIds: [biomarkerId],
      role: "INDISPENSABLE_CANDIDATE",
      level1: { status: "CONCEPTUAL_STRATEGY", measurementNeed: `Mesurer ${spec.outcome}`, scientificReason: `Examiner ${spec.construct} dans le périmètre humainement approuvé.` },
      level2: {
        status: "METHODOLOGICAL_ACQUISITION_PLAN",
        acquisitionFamily: "Famille IRM cardiaque avec cartographie T1 et dérivation ECV à définir avant exécution",
        conditions: ["Définition de mesure stable", "Hématocrite contemporain", "Comparabilité technique à qualifier"],
        dependencies: ["NATIVE_AND_POST_CONTRAST_MYOCARDIAL_AND_BLOOD_T1", "CONTEMPORANEOUS_HAEMATOCRIT"],
        timingRequirements: spec.temporalContext,
        qualityRequirements: ["Répétabilité et reproductibilité à qualifier", "Traçabilité de la dérivation ECV"],
        siteVariants: spec.centerDeclarations,
      },
      level3: {
        status: "NOT_GENERATABLE_WITH_CURRENT_EXECUTABLE_KNOWLEDGE",
        reason: "Les paramètres exécutables, l’équipement exact et la comparabilité ne sont pas établis par la référence conceptuelle.",
        forbiddenParameterFamilies: ["TR", "TE", "TI", "flip angle", "dose", "débit", "résolution", "paramètres constructeur"],
      },
      consequenceIfRemoved: "La mesure candidate ECV ne serait plus portée par une stratégie Imaging conceptuelle.",
      reviewState: "ADOPTED",
    }],
    equipmentAssessment,
    timingStrategy: spec.temporalContext.map((value, index) => ({
      timingId: `${spec.referenceId}:TIMING:${index + 1}`,
      type: value === "UNKNOWN_EXPLICITLY_RECORDED" ? "UNKNOWN_TIMING" : "METHODOLOGICAL_TIMING",
      value,
      justification: spec.interpretationBelowRepeatability ?? "Temporalité à définir et justifier avant exécution.",
      linkedIds: [acquisitionId],
      support: "UNKNOWN",
    })),
    harmonizationStrategy: {
      centerMode: spec.centerMode,
      commonCore: spec.centerMode.startsWith("MULTICENTRIC") ? ["Définition ECV", "Traçabilité", "QA"] : [],
      acceptableVariants: [],
      variantsToQualify: spec.centerMode.startsWith("MULTICENTRIC") ? ["Champ, constructeur, modèle, logiciel et reconstruction par site"] : [],
      incompatibilities: [],
      unknowns: spec.unknowns,
      bridgeStudy: spec.centerMode.startsWith("MULTICENTRIC") ? "UNKNOWN" : "NOT_APPLICABLE",
      futureAnalyticalStratification: spec.centerMode.startsWith("MULTICENTRIC") ? "PARTIALLY_SUPPORTED" : "NOT_APPLICABLE",
      additionalQualityControls: spec.centerMode.startsWith("MULTICENTRIC") ? ["Qualification par site", "Contrôle des déviations"] : [],
    },
    qualityStrategy: [{
      ruleId: qualityRuleId,
      objectId: acquisitionId,
      surface: "MEASUREMENT",
      timing: "BEFORE_ANALYSIS",
      method: "Vérifier la traçabilité, l’hématocrite contemporain, la validité technique et les conventions d’analyse avant interprétation.",
      acceptanceConcept: "Mesure ECV interprétable dans le domaine borné de la référence",
      responsibleActor: "Responsable Imaging à désigner",
      consequenceOfFailure: "Mesure non interprétable ou analysable avec limitations explicites.",
      provenanceRef: decision.decisionId,
    }],
    nonEvaluabilityRules: [{
      ruleId: `${spec.referenceId}:NON-EVALUABILITY`,
      state: "ANALYZABLE_WITH_LIMITATIONS",
      cause: "Conditions techniques, répétabilité ou hématocrite insuffisamment qualifiés.",
      stage: "MEASUREMENT",
      predictability: "PARTIALLY_SUPPORTED",
      recoverability: "UNKNOWN",
      repeatPossible: "UNKNOWN",
      variableIds: [variableId],
      endpointContributionIds: [endpointId],
      qualityRuleIds: [qualityRuleId],
      proposedAction: "Conserver la limitation et demander une qualification séparée; ne pas inventer un résultat.",
      humanDecisionRequired: true,
    }],
    imageAnalysisStrategy: [{
      analysisId,
      acquisitionIds: [acquisitionId],
      biomarkerIds: [biomarkerId],
      operationNeeds: ["Analyse globale et régionale distincte", "Traçabilité des conventions et versions"],
      readingModel: "Stratégie conceptuelle de mesure ECV à préspécifier",
      outputs: [spec.outcome],
      reproducibilityNeed: "À qualifier avant toute interprétation longitudinale ou trans-site.",
      boundary: "NO_IMAGE_PROCESSING_NO_STATISTICAL_ANALYSIS",
      reviewState: "ADOPTED",
    }],
    imagingVariables: [{
      variableId,
      definition: spec.outcome,
      questionId: input.confirmedScientificQuestion.questionId,
      objectiveIds: [input.objectives[0]!.objectiveId],
      hypothesisIds: [input.hypotheses[0]!.hypothesisId],
      phenomenonIds: [phenomenonId],
      biomarkerIds: [biomarkerId],
      acquisitionIds: [acquisitionId],
      qualityRuleIds: [qualityRuleId],
      analysisIds: [analysisId],
      unit: null,
      timingIds: spec.temporalContext.map((_, index) => `${spec.referenceId}:TIMING:${index + 1}`),
      nonEvaluabilityRuleIds: [`${spec.referenceId}:NON-EVALUABILITY`],
      provenance: [decision.decisionId, spec.sourceId],
      limitations: spec.limitations,
    }],
    endpointContributions: [{
      contributionId: endpointId,
      variableId,
      proposedRole: "UNDECIDED_CANDIDATE",
      timingIds: spec.temporalContext.map((_, index) => `${spec.referenceId}:TIMING:${index + 1}`),
      measurementMethod: "Mesure ECV dérivée de l’IRM dans le périmètre borné; paramètres exécutables non définis.",
      qualityRuleIds: [qualityRuleId],
      nonEvaluabilityRuleIds: [`${spec.referenceId}:NON-EVALUABILITY`],
      dependencies: ["CONTEMPORANEOUS_HAEMATOCRIT", "TECHNICAL_COMPARABILITY_QUALIFICATION"],
      limitations: spec.limitations,
      statisticalAnalysisStillRequired: true,
      humanDecisionRequired: true,
    }],
    coreLabAssessment: {
      status: "HUMAN_ASSESSMENT_REQUIRED",
      factors: [spec.centerMode, "Lecture et reproductibilité à préspécifier"],
      options: ["NO_CORE_LAB", "LOCAL_READING_WITH_STANDARDIZATION", "CENTRAL_QA", "CENTRAL_READING", "HYBRID"],
      unknowns: spec.unknowns,
      notice: "NO_AUTOMATIC_OPTIMUM",
    },
    alternatives: [],
    compromises: ["Le handoff Project porte une stratégie conceptuelle; sa faisabilité exécutable demeure non démontrée."],
    dependencies: ["CONTEMPORANEOUS_HAEMATOCRIT", "TECHNICAL_COMPARABILITY_QUALIFICATION"],
    missingInformation: spec.unknowns,
    contradictions: [],
    limitations: spec.limitations,
    risks: ["Interprétation hors domaine de validité", "Compatibilité technique inconnue"],
    decisionsRequired: [{ gateId: "IMG-GATE-HANDOFF-FREEZE", type: "PROJECT_HANDOFF", label: "Geler la stratégie conceptuelle gouvernée", reason: "Décision humaine RC-TEST-02 reçue.", status: "APPROVED", targetIds: [resultId] }],
    adaptiveQuestions: [],
    changes: [],
    impacts: [],
    graph: {
      projectionVersion: "RUNTIME_PROJECTION_1.0",
      ontologyStatus: "NO_NEW_ONTOLOGY",
      nodes: [
        { nodeId: input.confirmedScientificQuestion.questionId, type: "QUESTION", label: spec.question, status: "CONFIRMED", sourceRef: input.inputId },
        { nodeId: input.objectives[0]!.objectiveId, type: "OBJECTIVE", label: input.objectives[0]!.text, status: "CONFIRMED", sourceRef: decision.decisionId },
        { nodeId: input.hypotheses[0]!.hypothesisId, type: "HYPOTHESIS", label: input.hypotheses[0]!.text, status: "CONFIRMED", sourceRef: decision.decisionId },
        { nodeId: phenomenonId, type: "PHENOMENON", label: spec.construct, status: "CONFIRMED", sourceRef: spec.sourceId },
        { nodeId: biomarkerId, type: "BIOMARKER", label: spec.outcome, status: "CANDIDATE", sourceRef: spec.sourceId },
        { nodeId: modalityId, type: "MODALITY", label: "IRM", status: "CANDIDATE", sourceRef: spec.sourceId },
        { nodeId: acquisitionId, type: "ACQUISITION", label: "Stratégie conceptuelle IRM-ECV", status: "CANDIDATE", sourceRef: decision.decisionId },
        { nodeId: variableId, type: "VARIABLE", label: spec.outcome, status: "CANDIDATE", sourceRef: resultId },
        { nodeId: endpointId, type: "ENDPOINT_CONTRIBUTION", label: "Contribution ECV candidate", status: "CANDIDATE", sourceRef: resultId },
      ],
      edges: [
        { edgeId: `${spec.referenceId}:EDGE:Q-O`, from: input.confirmedScientificQuestion.questionId, to: input.objectives[0]!.objectiveId, relation: "ADDRESSES" },
        { edgeId: `${spec.referenceId}:EDGE:O-P`, from: input.objectives[0]!.objectiveId, to: phenomenonId, relation: "INFORMS" },
        { edgeId: `${spec.referenceId}:EDGE:P-B`, from: phenomenonId, to: biomarkerId, relation: "APPROXIMATES" },
        { edgeId: `${spec.referenceId}:EDGE:B-M`, from: biomarkerId, to: modalityId, relation: "REQUIRES" },
        { edgeId: `${spec.referenceId}:EDGE:M-A`, from: modalityId, to: acquisitionId, relation: "REQUIRES" },
        { edgeId: `${spec.referenceId}:EDGE:A-V`, from: acquisitionId, to: variableId, relation: "PRODUCES" },
        { edgeId: `${spec.referenceId}:EDGE:V-E`, from: variableId, to: endpointId, relation: "CONTRIBUTES_TO" },
      ],
      brokenChains: [],
    },
    knowledgeHandoff: {
      requestRef: `request-of:${input.knowledge.resultId}`,
      resultRef: input.knowledge.resultId,
      resultDigest: input.knowledge.resultDigest,
      coverageStatus: input.knowledge.coverageStatus,
      gapCodes: spec.unknowns,
      noClosestCorpusFallback: true,
    },
    projectConstructionHandoff: {
      handoffVersion: "1.2",
      status: "FROZEN_BY_HUMAN",
      imagingStrategyVersion: `${spec.referenceId}@${FIXTURE_VERSION}`,
      humanDecision: { status: "ADOPTED", decisionRecordId: decision.decisionId },
      scientificStrategyStatus: "SCIENTIFIC_STRATEGY_DEFINED",
      projectHandoffReadiness: "PROJECT_HANDOFF_READY",
      equipmentCompatibilityStatus: spec.equipmentCompatibilityStatus,
      executableProtocolReadiness: "EXECUTABLE_PROTOCOL_NOT_READY",
      resultRef: resultId,
      includedSections: ["Question", "Objectives", "Phenomena", "BoundedMeasurementCandidate", "ConceptualAcquisition", "EquipmentUnknowns", "Limitations", "Provenance"],
      excludedSections: ["STATISTICAL_SIZING", "COMPLETE_BUDGET", "FINAL_CRF", "REGULATORY_PLAN", "COMPLETE_OPERATIONAL_PLAN", "FINAL_SUBMISSION_PROTOCOL"],
      decisionRecordIds: [decision.decisionId],
      humanDecisions: [decision],
      blockedBy: [],
      unknowns: spec.unknowns,
      limitations: spec.limitations,
      contradictions: [],
      requiredFutureReviews: spec.requiredFutureReviews,
      provenance: [HUMAN_PROVENANCE, spec.sourceId, `source-commit:${SOURCE_COMMIT}`, `fixture:${spec.referenceId}@${FIXTURE_VERSION}`],
      trace: [{ sequence: 1, decision: "HUMAN_APPROVED_CONCEPTUAL_FREEZE", rationale: "RC-TEST-02 human validation permits only a governed conceptual non-executable test reference." }],
    },
    refusal: null,
    nextActions: spec.requiredFutureReviews,
    provenance: {
      engineVersion: IMAGING_STUDY_DESIGNER_VERSION,
      inputRef: input.inputId,
      knowledgeResultRef: input.knowledge.resultId,
      sourceRefs: [spec.sourceId, decision.decisionId],
      policyRefs: ["RDE-001", "RDE-002", "RDE-003", "KE-001", "ST-001"],
      llmContributionStatus: "NO_LLM_SCIENTIFIC_DECISION",
    },
    trace: [{ sequence: 1, operation: "READ_FROZEN_GOVERNED_REFERENCE", mode: "DETERMINISTIC", decision: "NO_OWNER_RUNTIME_REPLAY", inputDigest: logicalDigest(input), outputDigest: resultDigest }],
  });
};

const metadataFor = (spec: ReferenceSpec): GovernedImagingReferenceMetadata => {
  const decision = humanDecision(spec);
  const sourceResultId = governedReferenceResultId(spec.referenceId);
  const material = {
    fixtureId: spec.referenceId,
    fixtureSchemaVersion: FIXTURE_VERSION,
    fixtureKind: "HUMAN_APPROVED_GOVERNED_TEST_REFERENCE",
    fixtureProducer: "TEST_HARNESS",
    scientificScope: spec.scientificScope,
    contractOwner: "IMAGING",
    contractOwnerVersion: IMAGING_STUDY_DESIGNER_VERSION,
    sourceResultId,
    sourceResultIdKind: "CONTRACT_SHAPED_REFERENCE_RESULT_ID",
    runtimeOwnerExecuted: false,
    runtimeOwnerResultId: null,
    sourceCommit: SOURCE_COMMIT,
    projectVersion: PROJECT_VERSION,
    knowledgeVersion: spec.knowledgeVersion,
    stVersion: "UNKNOWN_NOT_RUNTIME_BOUND",
    humanReferenceDecisionId: decision.decisionId,
    humanDecisionProvenance: HUMAN_PROVENANCE,
    contradictionStatus: "NONE_IN_POSITIVE_REFERENCE_NEGATIVE_REFERENCE_PRESERVED_SEPARATELY",
    limitations: spec.limitations,
    createdFrom: "HUMAN_APPROVED_GOVERNED_REFERENCE_SPECIFICATION",
    supersedes: "IMG_001B_LIVE_HANDOFF_FIXTURE_FOR_DOWNSTREAM_CONSUMERS",
  } as const;
  return { ...material, digest: logicalDigest(material) };
};

const frozenInputs = Object.fromEntries(Object.values(specs).map((spec) => [spec.referenceId, deepFreeze(buildInput(spec))])) as Record<RcTest02ReferenceId, Readonly<ImagingDesignInput>>;
const frozenResults = Object.fromEntries(Object.values(specs).map((spec) => [spec.referenceId, deepFreeze(buildResult(spec))])) as Record<RcTest02ReferenceId, Readonly<ImagingDesignResult>>;

export const RC_TEST_02_GOVERNED_REFERENCE_REGISTRY = deepFreeze(Object.fromEntries(
  Object.values(specs).map((spec) => [spec.referenceId, metadataFor(spec)]),
)) as Readonly<Record<RcTest02ReferenceId, GovernedImagingReferenceMetadata>>;

export const readGovernedImagingInput = (referenceId: RcTest02ReferenceId): ImagingDesignInput => deepFreeze(structuredClone(frozenInputs[referenceId])) as ImagingDesignInput;

export const readGovernedImagingReferenceResult = (referenceId: RcTest02ReferenceId): ImagingDesignResult => deepFreeze(structuredClone(frozenResults[referenceId])) as ImagingDesignResult;

export const verifyGovernedImagingReference = (referenceId: RcTest02ReferenceId) => {
  const metadata = RC_TEST_02_GOVERNED_REFERENCE_REGISTRY[referenceId];
  const recomputed = metadataFor(specs[referenceId]);
  const result = readGovernedImagingReferenceResult(referenceId);
  const validatedResult = parseImagingDesignResult(result);
  return {
    metadataDigestValid: recomputed.digest === metadata.digest,
    referenceResultIdentityValid: result.resultId === metadata.sourceResultId
      && metadata.sourceResultIdKind === "CONTRACT_SHAPED_REFERENCE_RESULT_ID"
      && result.resultId.startsWith("governed-imaging-reference-result:"),
    contractOwnerVersionValid: result.contractVersion === metadata.contractOwnerVersion
      && result.provenance.engineVersion === metadata.contractOwnerVersion,
    fixtureProvenanceValid: metadata.fixtureKind === "HUMAN_APPROVED_GOVERNED_TEST_REFERENCE"
      && metadata.fixtureProducer === "TEST_HARNESS"
      && metadata.contractOwner === "IMAGING",
    runtimeNonExecutionExplicit: metadata.runtimeOwnerExecuted === false
      && metadata.runtimeOwnerResultId === null,
    humanDecisionIdentityValid: result.projectConstructionHandoff.humanDecision.decisionRecordId === metadata.humanReferenceDecisionId,
    contractValidationValid: validatedResult.resultId === result.resultId,
    frozenConceptualHandoffValid: result.projectConstructionHandoff.status === "FROZEN_BY_HUMAN"
      && result.projectConstructionHandoff.executableProtocolReadiness === "EXECUTABLE_PROTOCOL_NOT_READY",
    contradictionBoundaryValid: result.contradictions.length === 0
      && metadata.contradictionStatus === "NONE_IN_POSITIVE_REFERENCE_NEGATIVE_REFERENCE_PRESERVED_SEPARATELY",
  };
};
