import { logicalDigest, normalizeScientificText, uniqueSorted } from "@/features/knowledge-engine/canonical";
import { buildImagingDecisionGraph } from "./graph";
import {
  IMAGING_STUDY_DESIGNER_VERSION,
  parseImagingDesignInput,
  parseImagingDesignResult,
  type AcquisitionStrategy,
  type BiomarkerCandidate,
  type ImagingDesignControls,
  type ImagingDesignInput,
  type ImagingDesignResult,
  type ImagingKnowledgeStatement,
  type ModalityCandidate,
  type PhenomenonCandidate,
  type SupportState,
} from "./types";

const allStatements = (input: ImagingDesignInput) => [...input.knowledge.assertions, ...input.knowledge.documentaryStatements];
const statementsFor = (input: ImagingDesignInput, conceptId: string) => allStatements(input).filter((item) => item.conceptIds.includes(conceptId));
const supportFrom = (statements: ImagingKnowledgeStatement[]): SupportState => {
  if (!statements.length) return "UNKNOWN";
  if (statements.some((item) => /CONTRADICT/i.test(item.applicability))) return "CONFLICTING";
  if (statements.every((item) => /UNKNOWN|OUT_OF_VALIDITY/i.test(item.applicability))) return "UNKNOWN";
  if (statements.some((item) => /LIMITATION|PARTIAL/i.test(item.applicability))) return "PARTIALLY_SUPPORTED";
  return "SUPPORTED";
};
const review = (controls: Record<string, "PENDING" | "ADOPTED" | "REJECTED"> | undefined, id: string) => controls?.[id] ?? "PENDING";
const normalized = (value: string | null) => normalizeScientificText(value ?? "").toLocaleLowerCase("fr-FR");
const displayModality = (value: string) => /(?:^|:|\b)(?:irm|mri|mr)(?:$|:|\b)/i.test(value) ? "IRM"
  : /(?:^|:|\b)(?:ct|scanner)(?:$|:|\b)/i.test(value) ? "CT"
    : /(?:^|:|\b)(?:pet|tep)(?:$|:|\b)/i.test(value) ? "PET"
      : /(?:^|:|\b)spect(?:$|:|\b)/i.test(value) ? "SPECT"
        : value;

const buildPhenomena = (input: ImagingDesignInput, controls: ImagingDesignControls): PhenomenonCandidate[] => {
  const governed = input.knowledge.concepts.filter((item) => ["PHENOMENON", "PHYSIOLOGICAL_CONSTRUCT"].includes(item.objectType));
  const declared = input.phenomenaDeclared.filter((label) => !governed.some((item) => normalized(item.label) === normalized(label)));
  const total = governed.length + declared.length;
  const linkedObjectives = input.objectives.filter((item) => item.reviewState !== "REJECTED").map((item) => item.objectiveId);
  const linkedHypotheses = input.hypotheses.filter((item) => item.reviewState !== "REJECTED").map((item) => item.hypothesisId);
  const linkedMechanisms = input.mechanisms.map((item) => item.mechanismId);
  const governedCandidates = governed.map((concept, index): PhenomenonCandidate => {
    const statements = statementsFor(input, concept.conceptId);
    return {
      phenomenonId: `IMG-PHENOMENON:${concept.conceptId}`,
      label: concept.label,
      role: total === 1 ? "PRIMARY" : index === 0 && input.phenomenaDeclared.some((item) => normalized(item) === normalized(concept.label)) ? "PRIMARY" : "UNCERTAIN",
      objectiveIds: linkedObjectives,
      hypothesisIds: linkedHypotheses,
      mechanismIds: linkedMechanisms,
      context: uniqueSorted([...input.pathologyOrCondition, ...input.populationContext, ...input.temporalContext]),
      observability: "INDIRECT_ONLY",
      knowledgeSupport: supportFrom(statements),
      evidenceRefs: uniqueSorted(statements.map((item) => `${item.sourceId}#${item.locator}`)),
      limitations: uniqueSorted([...statements.flatMap((item) => item.limitations), ...input.knowledge.limitations]),
      confounders: [],
      unknowns: uniqueSorted(input.knowledge.gaps.filter((gap) => !gap.affectedConceptIds.length || gap.affectedConceptIds.includes(concept.conceptId)).map((gap) => gap.explanation)),
      reviewState: review(controls.phenomenonReviews, `IMG-PHENOMENON:${concept.conceptId}`),
    };
  });
  const declaredCandidates = declared.map((label, index): PhenomenonCandidate => {
    const id = `IMG-PHENOMENON:declared:${logicalDigest(label)}`;
    return {
      phenomenonId: id,
      label,
      role: total === 1 ? "PRIMARY" : index === 0 ? "UNCERTAIN" : "ALTERNATIVE",
      objectiveIds: linkedObjectives,
      hypothesisIds: linkedHypotheses,
      mechanismIds: linkedMechanisms,
      context: uniqueSorted([...input.pathologyOrCondition, ...input.populationContext, ...input.temporalContext]),
      observability: "TO_BE_ESTABLISHED",
      knowledgeSupport: "UNKNOWN",
      evidenceRefs: [],
      limitations: ["PHENOMENON_DECLARED_BY_USER_NOT_RESOLVED_BY_GOVERNED_KNOWLEDGE"],
      confounders: [],
      unknowns: ["Lien avec un biomarqueur d’imagerie défendable non établi."],
      reviewState: review(controls.phenomenonReviews, id),
    };
  });
  return [...governedCandidates, ...declaredCandidates];
};

const buildBiomarkers = (input: ImagingDesignInput, phenomena: PhenomenonCandidate[], controls: ImagingDesignControls): BiomarkerCandidate[] => {
  const concepts = input.knowledge.concepts.filter((item) => ["BIOMARKER", "DERIVED_MEASUREMENT", "OBSERVATION"].includes(item.objectType));
  return concepts.flatMap((concept): BiomarkerCandidate[] => {
    const statements = statementsFor(input, concept.conceptId);
    if (!statements.length) return [];
    const linked = phenomena.filter((phenomenon) => statements.some((statement) => statement.conceptIds.includes(phenomenon.phenomenonId.replace("IMG-PHENOMENON:", ""))));
    if (!linked.length) return [];
    const candidateId = `IMG-BIOMARKER:${concept.conceptId}`;
    const state = supportFrom(statements);
    return [{
      biomarkerId: candidateId,
      label: concept.label,
      conceptId: concept.conceptId,
      phenomenonIds: linked.map((item) => item.phenomenonId),
      objectiveIds: uniqueSorted(linked.flatMap((item) => item.objectiveIds)),
      measurementType: concept.objectType,
      quantification: concept.objectType === "DERIVED_MEASUREMENT" ? state : "UNKNOWN",
      domainOfValidity: uniqueSorted([...input.pathologyOrCondition, ...input.populationContext]),
      dependencies: uniqueSorted(statements.flatMap((item) => item.conceptIds).filter((id) => id !== concept.conceptId)),
      technicalSensitivity: statements.some((item) => /techni|séquence|reconstruction|logiciel|champ/i.test(item.text)) ? state : "UNKNOWN",
      timingSensitivity: statements.some((item) => /timing|temps|moment|délai/i.test(item.text)) ? state : "UNKNOWN",
      reproducibility: statements.some((item) => /reproduct|répétab|variab/i.test(item.text)) ? state : "UNKNOWN",
      limitations: uniqueSorted(statements.flatMap((item) => item.limitations)),
      confounders: [],
      evidenceRefs: uniqueSorted(statements.map((item) => `${item.sourceId}#${item.locator}`)),
      applicability: state,
      knowledgeGaps: uniqueSorted(input.knowledge.gaps.filter((gap) => !gap.affectedConceptIds.length || gap.affectedConceptIds.includes(concept.conceptId)).map((gap) => gap.explanation)),
      reviewState: review(controls.biomarkerReviews, candidateId),
    }];
  });
};

const comparisonDimensions = ["relation_phenomenon", "measurement_type", "quantification", "reproducibility", "technical_dependencies", "timing", "multicenter", "equipment", "quality", "evidence"] as const;
const buildBiomarkerComparison = (candidates: BiomarkerCandidate[]): ImagingDesignResult["biomarkerComparison"] => candidates.length < 2 ? [] : [{
  comparisonId: `IMG-BIOMARKER-COMPARISON:${logicalDigest(candidates.map((item) => item.biomarkerId))}`,
  candidateIds: candidates.map((item) => item.biomarkerId),
  dimensions: Object.fromEntries(comparisonDimensions.map((dimension) => [dimension, Object.fromEntries(candidates.map((item) => [item.biomarkerId,
    dimension === "quantification" ? item.quantification
      : dimension === "reproducibility" ? item.reproducibility
        : dimension === "timing" ? item.timingSensitivity
          : dimension === "technical_dependencies" ? item.technicalSensitivity
            : dimension === "relation_phenomenon" ? (item.phenomenonIds.length ? item.applicability : "UNKNOWN")
              : dimension === "evidence" ? (item.evidenceRefs.length ? item.applicability : "UNKNOWN")
                : "UNKNOWN",
  ]))])),
  notice: "NO_AUTOMATIC_RANKING",
}];

const buildModalities = (input: ImagingDesignInput, biomarkers: BiomarkerCandidate[], controls: ImagingDesignControls): ModalityCandidate[] => {
  const governed = input.knowledge.concepts.filter((item) => ["MODALITY", "MODALITY_TECHNOLOGY", "DETECTOR_TECHNOLOGY"].includes(item.objectType))
    .map((item) => ({ conceptId: item.conceptId, label: item.label }));
  const asserted = input.knowledge.assertions.filter((item) => item.modality).map((item) => ({ conceptId: `governed-modality:${logicalDigest(item.modality!)}`, label: displayModality(item.modality!) }));
  const options = [...governed, ...asserted].filter((item, index, array) => array.findIndex((other) => normalized(other.label) === normalized(item.label)) === index);
  return options.map((option): ModalityCandidate => {
    const statements = allStatements(input).filter((item) => item.conceptIds.includes(option.conceptId) || normalized(item.modality) === normalized(option.label));
    const linked = biomarkers.filter((biomarker) => statements.some((item) => item.conceptIds.includes(biomarker.conceptId)));
    const candidateId = `IMG-MODALITY:${option.conceptId}`;
    const state = supportFrom(statements);
    return {
      modalityId: candidateId,
      label: option.label,
      conceptId: option.conceptId,
      biomarkerIds: (linked.length ? linked : biomarkers).map((item) => item.biomarkerId),
      phenomenonIds: uniqueSorted((linked.length ? linked : biomarkers).flatMap((item) => item.phenomenonIds)),
      role: "CANDIDATE",
      support: linked.length ? state : "UNKNOWN",
      dimensions: Object.fromEntries(["resolution", "repeatability", "reproducibility", "invasiveness", "irradiation", "contrast", "accessibility", "duration", "artefacts", "equipment", "multicenter", "quality", "analysis", "scientificCoverage"].map((dimension) => [dimension, dimension === "scientificCoverage" ? (linked.length ? state : "UNKNOWN") : "UNKNOWN"])) as Record<string, SupportState>,
      dependencies: uniqueSorted(statements.flatMap((item) => item.conceptIds).filter((id) => id !== option.conceptId)),
      limitations: uniqueSorted([
        ...statements.flatMap((item) => item.limitations),
        ...(linked.length ? [] : ["BRANCH_PRESERVED_WITH_INSUFFICIENT_GOVERNED_RELATION_TO_BIOMARKER"]),
        ...(!biomarkers.length ? ["NO_BIOMARKER_LINK_NO_ACQUISITION_STRATEGY_GENERATED"] : []),
      ]),
      risks: [],
      evidenceRefs: uniqueSorted(statements.map((item) => `${item.sourceId}#${item.locator}`)),
      reviewState: review(controls.modalityReviews, candidateId),
    };
  });
};

const buildModalityComparison = (modalities: ModalityCandidate[], biomarkers: BiomarkerCandidate[]): ImagingDesignResult["modalityComparison"] => modalities.length < 2 ? [] : [{
  comparisonId: `IMG-MODALITY-COMPARISON:${logicalDigest(modalities.map((item) => item.modalityId))}`,
  candidateIds: modalities.map((item) => item.modalityId),
  scientificNeed: biomarkers.map((item) => item.label).join(" / ") || "relation phénomène–biomarqueur à qualifier",
  dimensions: Object.fromEntries(Object.keys(modalities[0]?.dimensions ?? {}).map((dimension) => [dimension, Object.fromEntries(modalities.map((item) => [item.modalityId, item.dimensions[dimension] ?? "UNKNOWN"]))])),
  notice: "NO_AUTOMATIC_RANKING",
}];

const buildAcquisitions = (modalities: ModalityCandidate[], biomarkers: BiomarkerCandidate[], controls: ImagingDesignControls): AcquisitionStrategy[] => modalities.filter((modality) => modality.biomarkerIds.length > 0).map((modality, index) => {
  const linked = biomarkers.filter((item) => modality.biomarkerIds.includes(item.biomarkerId));
  const id = `IMG-ACQUISITION:${logicalDigest({ modality: modality.modalityId, biomarkers: linked.map((item) => item.biomarkerId) })}`;
  return {
    acquisitionId: id,
    modalityId: modality.modalityId,
    biomarkerIds: linked.map((item) => item.biomarkerId),
    role: index === 0 ? "INDISPENSABLE_CANDIDATE" : "SECONDARY_CANDIDATE",
    level1: { status: "CONCEPTUAL_STRATEGY", measurementNeed: `Approcher ${linked.map((item) => item.label).join(" / ")}`, scientificReason: `Examiner le ou les phénomènes reliés à ${linked.map((item) => item.label).join(" / ")}.` },
    level2: {
      status: "METHODOLOGICAL_ACQUISITION_PLAN",
      acquisitionFamily: `Famille d’acquisition ${modality.label} à qualifier pour ${linked.map((item) => item.label).join(" / ")}`,
      conditions: ["Définition de mesure stable", "Chaîne d’acquisition et d’analyse documentée"],
      dependencies: uniqueSorted([...modality.dependencies, ...linked.flatMap((item) => item.dependencies)]),
      timingRequirements: ["Timing biologique ou méthodologique à justifier"],
      qualityRequirements: ["QA de complétude, validité technique et validité de mesure avant interprétation"],
      siteVariants: [],
    },
    level3: {
      status: "NOT_GENERATABLE_WITH_CURRENT_EXECUTABLE_KNOWLEDGE",
      reason: "Aucune connaissance exécutable gouvernée et applicable ne démontre des paramètres compatibles avec un équipement/version/options exacts.",
      forbiddenParameterFamilies: ["TR", "TE", "TI", "flip angle", "dose", "débit", "volume", "résolution", "kernel", "kVp", "mAs", "nombre de phases", "paramètres constructeur"],
    },
    consequenceIfRemoved: `La branche ${modality.label} ne produirait plus la mesure candidate ${linked.map((item) => item.label).join(" / ")}.`,
    reviewState: review(controls.acquisitionReviews, id),
  };
});

const modalityFamily = (value: string) => /irm|mri|mr\b/i.test(value) ? "MR" : /ct|scanner/i.test(value) ? "CT" : /pet|tep/i.test(value) ? "PET" : /spect/i.test(value) ? "SPECT" : /[ée]cho|ultra/i.test(value) ? "US" : normalized(value);

const buildEquipment = (input: ImagingDesignInput, acquisitions: AcquisitionStrategy[], modalities: ModalityCandidate[]): ImagingDesignResult["equipmentAssessment"] => acquisitions.flatMap((acquisition) => {
  const modality = modalities.find((item) => item.modalityId === acquisition.modalityId)!;
  const matchingEquipment = input.declaredEquipment.filter((item) => !item.modality || modalityFamily(item.modality) === modalityFamily(modality.label));
  const equipment = matchingEquipment.length ? matchingEquipment : input.declaredEquipment.length ? input.declaredEquipment : [{
    equipmentId: "IMG-EQUIPMENT:UNDECLARED", siteLabel: "Site non déclaré", modality: null, manufacturer: null, model: null,
    fieldStrength: null, softwareVersion: null, options: [], availability: "UNKNOWN" as const, period: null, provenanceRef: input.inputId,
  }];
  return equipment.map((item) => {
    const sameFamily = item.modality ? modalityFamily(item.modality) === modalityFamily(modality.label) : false;
    const compatibility = item.availability === "KNOWN_UNAVAILABLE" && sameFamily ? "INCOMPATIBLE" as const
      : item.modality && !sameFamily ? "INCOMPATIBLE" as const
        : "UNKNOWN_COMPATIBILITY" as const;
    return {
      assessmentId: `IMG-EQUIPMENT-ASSESSMENT:${logicalDigest({ equipment: item.equipmentId, acquisition: acquisition.acquisitionId })}`,
      equipmentId: item.equipmentId,
      acquisitionId: acquisition.acquisitionId,
      availability: item.availability,
      availabilityEvidenceStatus: item.availability === "KNOWN_AVAILABLE" ? "VERIFIED" as const
        : item.availability === "DECLARED_AVAILABLE" ? "DECLARED" as const
          : item.availability === "KNOWN_UNAVAILABLE" ? "CONFIRMED_ABSENT" as const
            : "UNKNOWN" as const,
      compatibility,
      gaps: uniqueSorted([
        ...(!item.manufacturer ? ["Constructeur inconnu"] : []),
        ...(!item.model ? ["Modèle inconnu"] : []),
        ...(!item.softwareVersion ? ["Version logicielle inconnue"] : []),
        "Compatibilité exacte non démontrée par une connaissance exécutable gouvernée",
      ]),
      evidenceRefs: [item.provenanceRef],
      assumptionForbidden: true as const,
    };
  });
});

const buildTiming = (input: ImagingDesignInput, acquisitions: AcquisitionStrategy[], controls: ImagingDesignControls): ImagingDesignResult["timingStrategy"] => {
  if (!acquisitions.length) return [];
  const timingAnswer = controls.answers?.["IMG-AQ-TIMING"];
  if (!input.temporalContext.length && timingAnswer && timingAnswer !== "unknown") return [{
    timingId: `IMG-TIMING:declared:${logicalDigest(timingAnswer)}`,
    type: "METHODOLOGICAL_TIMING",
    value: timingAnswer === "change" ? "Évolution déclarée ; moments exacts à justifier" : "Mesure ponctuelle déclarée ; moment exact à justifier",
    justification: "Finalité temporelle explicitement choisie par l’utilisateur ; aucun calendrier n’est inventé.",
    linkedIds: acquisitions.map((item) => item.acquisitionId),
    support: "PARTIALLY_SUPPORTED",
  }];
  if (!input.temporalContext.length) return [{
    timingId: "IMG-TIMING:UNKNOWN", type: "UNKNOWN_TIMING", value: "Non défini", justification: "Aucune justification biologique, méthodologique, opérationnelle ou imposée n’est disponible.", linkedIds: acquisitions.map((item) => item.acquisitionId), support: "UNKNOWN",
  }];
  return input.temporalContext.map((value, index) => ({
    timingId: `IMG-TIMING:${index + 1}:${logicalDigest(value)}`, type: "IMPOSED_TIMING", value,
    justification: "Temporalité déclarée par l’utilisateur ; sa justification scientifique reste à qualifier.", linkedIds: acquisitions.map((item) => item.acquisitionId), support: "UNKNOWN",
  }));
};

const effectiveCenterMode = (input: ImagingDesignInput, controls: ImagingDesignControls): ImagingDesignInput["centerContext"]["mode"] => {
  if (input.centerContext.mode !== "UNKNOWN") return input.centerContext.mode;
  if (controls.answers?.["IMG-AQ-CENTERS"] === "mono") return "MONOCENTRIC";
  if (controls.answers?.["IMG-AQ-CENTERS"] === "multi") return "MULTICENTRIC_HETEROGENEITY_UNKNOWN";
  return "UNKNOWN";
};

const buildHarmonization = (input: ImagingDesignInput, assessments: ImagingDesignResult["equipmentAssessment"], controls: ImagingDesignControls): ImagingDesignResult["harmonizationStrategy"] => {
  const centerMode = effectiveCenterMode(input, controls);
  const multicenter = centerMode.startsWith("MULTICENTRIC");
  return {
    centerMode,
    commonCore: multicenter ? ["Définition de la mesure", "Nomenclature", "Traçabilité des versions", "Règles de complétude et de validité"] : [],
    acceptableVariants: [],
    variantsToQualify: ["MULTICENTRIC_HETEROGENEOUS", "MULTICENTRIC_HETEROGENEITY_UNKNOWN"].includes(centerMode) ? ["Champ, constructeur, modèle, logiciel et chaîne de reconstruction déclarés par site"] : [],
    incompatibilities: assessments.filter((item) => item.compatibility === "INCOMPATIBLE").map((item) => item.assessmentId),
    unknowns: uniqueSorted(assessments.flatMap((item) => item.gaps)),
    bridgeStudy: multicenter ? "UNKNOWN" : "NOT_APPLICABLE",
    futureAnalyticalStratification: ["MULTICENTRIC_HETEROGENEOUS", "MULTICENTRIC_HETEROGENEITY_UNKNOWN"].includes(centerMode) ? "PARTIALLY_SUPPORTED" : "NOT_APPLICABLE",
    additionalQualityControls: multicenter ? ["Qualification par site", "Contrôle des déviations", "Traçabilité des transferts"] : [],
  };
};

const buildQuality = (input: ImagingDesignInput, acquisitions: AcquisitionStrategy[]): ImagingDesignResult["qualityStrategy"] => acquisitions.flatMap((acquisition) => ([
  { surface: "ACQUISITION" as const, timing: "BEFORE_ACQUISITION" as const, method: "Vérifier que la famille d’acquisition, ses dépendances et ses variantes sont documentées.", acceptanceConcept: "Acquisition méthodologiquement qualifiable", responsibleActor: "Responsable Imaging à désigner", consequenceOfFailure: "Acquisition non autorisée ou déviation documentée avant analyse." },
  { surface: "COMPLETENESS" as const, timing: "BEFORE_ANALYSIS" as const, method: "Vérifier la présence des données attendues sans assimiler une absence à un résultat négatif.", acceptanceConcept: "Complétude compatible avec la Variable candidate", responsibleActor: "Contrôle qualité Imaging à désigner", consequenceOfFailure: "État MISSING, NOT_ACQUIRED ou INCOMPLETE explicite." },
  { surface: "MEASUREMENT" as const, timing: "DURING_ANALYSIS" as const, method: "Vérifier la validité technique et la traçabilité de la dérivation avant émission d’une Variable.", acceptanceConcept: "Mesure interprétable dans son domaine de validité", responsibleActor: "Lecteur ou analyste qualifié à désigner", consequenceOfFailure: "TECHNICALLY_INVALID, QA_REJECTED ou ANALYZABLE_WITH_LIMITATIONS." },
]).map((rule, index) => ({ ...rule, ruleId: `IMG-QA:${logicalDigest({ acquisition: acquisition.acquisitionId, surface: rule.surface, index })}`, objectId: acquisition.acquisitionId, provenanceRef: input.inputId })));

const buildAnalysis = (input: ImagingDesignInput, acquisitions: AcquisitionStrategy[], biomarkers: BiomarkerCandidate[], controls: ImagingDesignControls): ImagingDesignResult["imageAnalysisStrategy"] => acquisitions.map((acquisition) => {
  const linked = biomarkers.filter((item) => acquisition.biomarkerIds.includes(item.biomarkerId));
  const id = `IMG-ANALYSIS:${logicalDigest(acquisition.acquisitionId)}`;
  return {
    analysisId: id,
    acquisitionIds: [acquisition.acquisitionId],
    biomarkerIds: linked.map((item) => item.biomarkerId),
    operationNeeds: ["Lecture ou mesure conceptuelle à préspécifier", "Traçabilité de la dérivation", "Gestion des répétitions et discordances à préspécifier"],
    readingModel: `Stratégie de lecture candidate pour ${linked.map((item) => item.label).join(" / ")}`,
    outputs: linked.map((item) => `Observable candidat : ${item.label}`),
    reproducibilityNeed: "Besoin à qualifier selon le contexte, sans seuil inventé.",
    boundary: "NO_IMAGE_PROCESSING_NO_STATISTICAL_ANALYSIS" as const,
    reviewState: review(controls.analysisReviews, id),
  };
});

const buildVariables = (input: ImagingDesignInput, acquisitions: AcquisitionStrategy[], biomarkers: BiomarkerCandidate[], quality: ImagingDesignResult["qualityStrategy"], analyses: ImagingDesignResult["imageAnalysisStrategy"], timing: ImagingDesignResult["timingStrategy"]): ImagingDesignResult["imagingVariables"] => acquisitions.flatMap((acquisition) => biomarkers.filter((item) => acquisition.biomarkerIds.includes(item.biomarkerId)).map((biomarker) => {
  const analysis = analyses.find((item) => item.acquisitionIds.includes(acquisition.acquisitionId))!;
  const id = `IMG-VARIABLE:${logicalDigest({ acquisition: acquisition.acquisitionId, biomarker: biomarker.biomarkerId })}`;
  return {
    variableId: id,
    definition: `Mesure d’imagerie candidate de ${biomarker.label}`,
    questionId: input.confirmedScientificQuestion.questionId,
    objectiveIds: biomarker.objectiveIds,
    hypothesisIds: input.hypotheses.filter((item) => item.reviewState !== "REJECTED").map((item) => item.hypothesisId),
    phenomenonIds: biomarker.phenomenonIds,
    biomarkerIds: [biomarker.biomarkerId],
    acquisitionIds: [acquisition.acquisitionId],
    qualityRuleIds: quality.filter((item) => item.objectId === acquisition.acquisitionId).map((item) => item.ruleId),
    analysisIds: [analysis.analysisId],
    unit: null,
    timingIds: timing.map((item) => item.timingId),
    nonEvaluabilityRuleIds: [] as string[],
    provenance: uniqueSorted([...biomarker.evidenceRefs, input.inputId]),
    limitations: biomarker.limitations,
  };
}));

const buildNonEvaluability = (variables: ImagingDesignResult["imagingVariables"]): ImagingDesignResult["nonEvaluabilityRules"] => {
  const states: ImagingDesignResult["nonEvaluabilityRules"][number]["state"][] = ["MISSING", "NOT_ACQUIRED", "INCOMPLETE", "TECHNICALLY_INVALID", "QA_REJECTED", "ANALYZABLE_WITH_LIMITATIONS", "BIOLOGICALLY_NEGATIVE"];
  return variables.flatMap((variable) => states.map((state) => ({
    ruleId: `IMG-NONEVAL:${logicalDigest({ variable: variable.variableId, state })}`,
    state,
    cause: state === "BIOLOGICALLY_NEGATIVE" ? "Observable acquis et techniquement évaluable, résultat biologique négatif possible." : `Cause ${state} à documenter sans assimilation à une valeur normale.`,
    stage: state === "MISSING" || state === "NOT_ACQUIRED" || state === "INCOMPLETE" ? "ACQUISITION_OR_TRANSFER" : "QA_OR_ANALYSIS",
    predictability: "UNKNOWN" as const,
    recoverability: "UNKNOWN" as const,
    repeatPossible: "UNKNOWN" as const,
    variableIds: [variable.variableId], endpointContributionIds: [], qualityRuleIds: variable.qualityRuleIds,
    proposedAction: state === "BIOLOGICALLY_NEGATIVE" ? "Conserver le résultat comme biologiquement négatif, distinct d’une donnée absente." : "Qualifier la cause, la récupérabilité et la conséquence avant toute utilisation.",
    humanDecisionRequired: true as const,
  })));
};

const buildEndpointContributions = (input: ImagingDesignInput, variables: ImagingDesignResult["imagingVariables"], nonEvaluability: ImagingDesignResult["nonEvaluabilityRules"]): ImagingDesignResult["endpointContributions"] => {
  if (!input.outcomesDeclared.length) return [];
  return variables.map((variable) => ({
    contributionId: `IMG-ENDPOINT-CONTRIBUTION:${logicalDigest({ variable: variable.variableId, outcomes: input.outcomesDeclared })}`,
    variableId: variable.variableId,
    proposedRole: "UNDECIDED_CANDIDATE" as const,
    timingIds: variable.timingIds,
    measurementMethod: variable.definition,
    qualityRuleIds: variable.qualityRuleIds,
    nonEvaluabilityRuleIds: nonEvaluability.filter((item) => item.variableIds.includes(variable.variableId)).map((item) => item.ruleId),
    dependencies: input.outcomesDeclared,
    limitations: [...variable.limitations, "Le rôle principal, secondaire ou exploratoire n’est pas décidé par Imaging."],
    statisticalAnalysisStillRequired: true as const,
    humanDecisionRequired: true as const,
  }));
};

const buildAlternatives = (modalities: ModalityCandidate[], assessments: ImagingDesignResult["equipmentAssessment"], biomarkers: BiomarkerCandidate[]): ImagingDesignResult["alternatives"] => {
  const alternatives = modalities.map((modality) => ({
    alternativeId: `IMG-ALTERNATIVE:${logicalDigest(modality.modalityId)}`,
    label: `Conserver la branche ${modality.label} comme stratégie candidate`,
    preserves: uniqueSorted(["Question scientifique", ...modality.phenomenonIds, ...modality.biomarkerIds]),
    changes: [`Famille d’acquisition et dépendances liées à ${modality.label}`],
    losses: modality.support === "UNKNOWN" ? ["Couverture scientifique suffisante non démontrée"] : [],
    risks: modality.risks,
    unknowns: modality.limitations,
    decisionsToReopen: ["Choix de modalité", "Adoption de l’acquisition", "QA", "Analyse d’image"],
    reviewState: "PENDING" as const,
  }));
  if (assessments.some((item) => item.compatibility === "INCOMPATIBLE")) alternatives.push({
    alternativeId: "IMG-ALTERNATIVE:NON-FEASIBLE",
    label: "Déclarer la branche non faisable en l’état",
    preserves: ["Question scientifique", "Traçabilité de l’incompatibilité"],
    changes: ["Suspension de la branche d’acquisition incompatible"],
    losses: biomarkers.map((item) => item.label),
    risks: ["Hypothèse non examinable par cette branche"],
    unknowns: ["Alternative technique ou biomarqueur non établi"],
    decisionsToReopen: ["Biomarqueur", "Modalité", "Faisabilité", "Retour Scientific Thinking"],
    reviewState: "PENDING",
  });
  return alternatives;
};

const buildAdaptiveQuestions = (input: ImagingDesignInput, phenomena: PhenomenonCandidate[], biomarkers: BiomarkerCandidate[], modalities: ModalityCandidate[], acquisitions: AcquisitionStrategy[]): ImagingDesignResult["adaptiveQuestions"] => {
  const questions: ImagingDesignResult["adaptiveQuestions"] = [];
  const add = (questionId: string, label: string, whyAsked: string, decisionImpact: string, decisionBlock: string, answers: Array<{ value: string; label: string; consequence: string }>) => questions.push({ questionId, label, whyAsked, decisionImpact, decisionBlock, suggestedAnswers: [...answers, { value: "unknown", label: "Je ne sais pas", consequence: "L’inconnue reste explicite et la décision dépendante demeure ouverte." }], acceptsFreeText: true, acceptsUnknown: true, answeredValue: null });
  if (!phenomena.length) add("IMG-AQ-PHENOMENON", "Quel phénomène biologique faut-il prioritairement caractériser ?", "La modalité ne peut pas être la racine.", "Détermine si une chaîne phénomène → biomarqueur peut être construite.", "PHENOMENA", []);
  else if (phenomena.length > 1) add("IMG-AQ-PRIMARY-PHENOMENON", "Quel phénomène doit rester principal ?", "Plusieurs phénomènes défendables sont conservés.", "Change la hiérarchie des biomarqueurs et des acquisitions.", "PHENOMENA", phenomena.map((item) => ({ value: item.phenomenonId, label: item.label, consequence: "La branche est priorisée sous réserve d’une décision humaine." })));
  if (phenomena.length && !biomarkers.length) add("IMG-AQ-MEASUREMENT", "Quel observable d’imagerie permettrait d’approcher ce phénomène ?", "Knowledge ne soutient actuellement aucun biomarqueur contextualisé.", "Détermine si Imaging peut continuer ou doit retourner vers Scientific Thinking.", "BIOMARKERS", []);
  if (biomarkers.length && !modalities.length) add("IMG-AQ-MODALITY", "Quelles modalités pourraient produire cet observable selon vos connaissances ou vos sources ?", "Aucune modalité gouvernée n’est actuellement reliée au besoin de mesure.", "Déclenche une demande Knowledge ; la disponibilité seule ne suffit pas.", "MODALITIES", []);
  if (acquisitions.length && !input.declaredEquipment.length) add("IMG-AQ-EQUIPMENT", "Quels équipements sont réellement disponibles ?", "La compatibilité ne peut pas être supposée.", "Permet de qualifier faisabilité, variantes et QA, sans créer de protocole constructeur.", "FEASIBILITY", []);
  if (acquisitions.length && input.centerContext.mode === "UNKNOWN") add("IMG-AQ-CENTERS", "L’étude est-elle monocentrique ou multicentrique ?", "Cette information modifie harmonisation, QA et Core Lab assessment.", "Détermine les surfaces techniques à qualifier.", "MULTICENTER", [{ value: "mono", label: "Monocentrique", consequence: "Aucune variabilité intersite n’est présumée." }, { value: "multi", label: "Multicentrique", consequence: "Les différences entre sites devront rester visibles." }]);
  if (acquisitions.length && !input.temporalContext.length) add("IMG-AQ-TIMING", "La mesure vise-t-elle un état ponctuel ou une évolution ?", "Le timing ne peut pas être créé depuis une visite administrative.", "Détermine la dépendance biologique et méthodologique des acquisitions.", "TIMING", [{ value: "single", label: "Mesure ponctuelle", consequence: "Le moment biologique reste à justifier." }, { value: "change", label: "Évolution", consequence: "La comparabilité longitudinale devra être qualifiée." }]);
  return questions;
};

const buildDecisions = (input: ImagingDesignInput, phenomena: PhenomenonCandidate[], biomarkers: BiomarkerCandidate[], modalities: ModalityCandidate[], acquisitions: AcquisitionStrategy[], controls: ImagingDesignControls): ImagingDesignResult["decisionsRequired"] => {
  const decisions: ImagingDesignResult["decisionsRequired"] = [];
  const add = (gateId: string, type: string, label: string, reason: string, targetIds: string[]) => decisions.push({ gateId, type, label, reason, status: controls.gateStatuses?.[gateId] ?? "PENDING", targetIds });
  if (phenomena.length > 1) add("IMG-GATE-PRIMARY-PHENOMENON", "PRIMARY_PHENOMENON", "Choisir le phénomène principal", "Plusieurs branches sont conservées sans classement automatique.", phenomena.map((item) => item.phenomenonId));
  if (biomarkers.length) add("IMG-GATE-BIOMARKER", "STRUCTURING_BIOMARKER", "Adopter un biomarqueur structurant", "L’applicabilité reste contextuelle.", biomarkers.map((item) => item.biomarkerId));
  if (modalities.length > 1) add("IMG-GATE-MODALITY", "NON_DOMINATED_MODALITY", "Choisir entre les modalités non dominées", "Aucun optimum automatique n’est autorisé.", modalities.map((item) => item.modalityId));
  if (acquisitions.length) add("IMG-GATE-ACQUISITION", "ACQUISITION_STRATEGY", "Adopter la stratégie d’acquisition", "Les niveaux 1 et 2 restent des candidats méthodologiques.", acquisitions.map((item) => item.acquisitionId));
  if (effectiveCenterMode(input, controls).startsWith("MULTICENTRIC")) add("IMG-GATE-MULTICENTER", "MULTICENTER_VARIABILITY", "Accepter ou refuser la variabilité multicentrique", "L’harmonisation ne doit pas masquer les différences.", input.declaredEquipment.map((item) => item.equipmentId));
  if (acquisitions.length) add("IMG-GATE-CORE-LAB", "CORE_LAB", "Décider du rôle éventuel d’un Core Lab", "Aucune option n’est optimale par défaut.", ["IMG-CORE-LAB-ASSESSMENT"]);
  add("IMG-GATE-HANDOFF-FREEZE", "HANDOFF_FREEZE", "Geler le handoff Imaging", "Project Construction ne reçoit que les décisions explicitement autorisées.", [input.inputId]);
  return decisions;
};

const patientLevel = (input: ImagingDesignInput) => input.safetyFlags.some((item) => /patient|medical|clinique individuel/i.test(item)) || /\b(mon|ma|mes)\b.*\b(t1|t2|irm|scanner|résultat|élevé|grave)\b/i.test(input.originalExpression);

const equipmentCompatibilityStatus = (assessments: ImagingDesignResult["equipmentAssessment"]): ImagingDesignResult["projectConstructionHandoff"]["equipmentCompatibilityStatus"] => {
  if (!assessments.length) return "NOT_APPLICABLE";
  if (assessments.some((item) => item.compatibility === "INCOMPATIBLE")) return "INCOMPATIBLE";
  if (assessments.every((item) => item.compatibility === "EXACT_MATCH")) return "TECHNICAL_COMPATIBILITY_CONFIRMED";
  const evidence = new Set(assessments.map((item) => item.availabilityEvidenceStatus));
  if (evidence.size > 1) return "PARTIALLY_KNOWN";
  if (evidence.has("VERIFIED")) return "VERIFIED_AVAILABILITY_COMPATIBILITY_UNCONFIRMED";
  if (evidence.has("DECLARED")) return "DECLARED_NOT_VERIFIED";
  return "UNKNOWN";
};

export const executeImagingStudyDesigner = (rawInput: ImagingDesignInput, controls: ImagingDesignControls = {}): ImagingDesignResult => {
  const input = parseImagingDesignInput(rawInput);
  const isPatient = patientLevel(input);
  const phenomena = isPatient ? [] : buildPhenomena(input, controls);
  const biomarkerCandidates = isPatient ? [] : buildBiomarkers(input, phenomena, controls);
  const modalityCandidates = isPatient ? [] : buildModalities(input, biomarkerCandidates, controls);
  const acquisitionStrategies = buildAcquisitions(modalityCandidates, biomarkerCandidates, controls);
  const equipmentAssessment = buildEquipment(input, acquisitionStrategies, modalityCandidates);
  const timingStrategy = buildTiming(input, acquisitionStrategies, controls);
  const harmonizationStrategy = buildHarmonization(input, equipmentAssessment, controls);
  const qualityStrategy = buildQuality(input, acquisitionStrategies);
  const imageAnalysisStrategy = buildAnalysis(input, acquisitionStrategies, biomarkerCandidates, controls);
  const imagingVariables = buildVariables(input, acquisitionStrategies, biomarkerCandidates, qualityStrategy, imageAnalysisStrategy, timingStrategy);
  const nonEvaluabilityRules = buildNonEvaluability(imagingVariables);
  imagingVariables.forEach((variable) => { variable.nonEvaluabilityRuleIds = nonEvaluabilityRules.filter((item) => item.variableIds.includes(variable.variableId)).map((item) => item.ruleId); });
  const endpointContributions = buildEndpointContributions(input, imagingVariables, nonEvaluabilityRules);
  nonEvaluabilityRules.forEach((rule) => { rule.endpointContributionIds = endpointContributions.filter((item) => rule.variableIds.includes(item.variableId)).map((item) => item.contributionId); });
  const alternatives = isPatient ? [] : buildAlternatives(modalityCandidates, equipmentAssessment, biomarkerCandidates);
  const adaptiveQuestions = isPatient ? [] : buildAdaptiveQuestions(input, phenomena, biomarkerCandidates, modalityCandidates, acquisitionStrategies).map((item) => ({ ...item, answeredValue: controls.answers?.[item.questionId] ?? null }));
  const decisionsRequired = isPatient ? [] : buildDecisions(input, phenomena, biomarkerCandidates, modalityCandidates, acquisitionStrategies, controls);
  const currentCenterMode = effectiveCenterMode(input, controls);
  const coreLabAssessment: ImagingDesignResult["coreLabAssessment"] = {
    status: "HUMAN_ASSESSMENT_REQUIRED",
    factors: uniqueSorted([
      currentCenterMode,
      ...(currentCenterMode.startsWith("MULTICENTRIC") ? ["Harmonisation et QA intersite à qualifier"] : []),
      ...(imageAnalysisStrategy.length ? ["Lecture et reproductibilité à préspécifier"] : []),
    ]),
    options: ["NO_CORE_LAB", "LOCAL_READING_WITH_STANDARDIZATION", "CENTRAL_QA", "CENTRAL_READING", "HYBRID"],
    unknowns: uniqueSorted([...harmonizationStrategy.unknowns, "Volume, expertise locale et exigences industrielles/réglementaires non fournis"]),
    notice: "NO_AUTOMATIC_OPTIMUM",
  };
  const materialForGraph = { phenomena, biomarkerCandidates, modalityCandidates, acquisitionStrategies, qualityStrategy, imageAnalysisStrategy, imagingVariables, endpointContributions, equipmentAssessment, timingStrategy, harmonizationStrategy };
  const graph = buildImagingDecisionGraph({ ...input, centerContext: { ...input.centerContext, mode: currentCenterMode } }, materialForGraph);
  const noUpstreamChain = !input.objectives.length || !input.hypotheses.length;
  const noDefensibleChain = !phenomena.length || !biomarkerCandidates.length;
  const status: ImagingDesignResult["status"] = isPatient ? "REFUSED" : noUpstreamChain || noDefensibleChain ? "RETURN_TO_SCIENTIFIC_THINKING" : adaptiveQuestions.some((item) => !item.answeredValue) ? "CLARIFICATION_REQUIRED" : "STRATEGY_CANDIDATES";
  const refusal: ImagingDesignResult["refusal"] = isPatient ? {
    code: "PATIENT_LEVEL", reason: "La demande concerne l’interprétation ou la conduite à tenir pour une situation individuelle.", resumeCondition: "Reformuler une question générale de recherche sans donnée patient.",
  } : null;
  const changes = controls.changes ?? [];
  const impacts = controls.impacts ?? [];
  const unresolvedGates = decisionsRequired.filter((item) => item.status !== "APPROVED").map((item) => item.gateId);
  const blockingChains = graph.brokenChains.map((item) => item.code);
  const nonBlockingProjectChains = new Set(["UNKNOWN_MANUFACTURER_DEPENDENCY"]);
  const projectBlockingChains = blockingChains.filter((code) => !nonBlockingProjectChains.has(code));
  const projectBlockingQuestions = adaptiveQuestions.filter((item) => !item.answeredValue && item.questionId !== "IMG-AQ-EQUIPMENT").map((item) => item.questionId);
  const unresolvedStructuralGates = unresolvedGates.filter((item) => item !== "IMG-GATE-HANDOFF-FREEZE");
  const criticalSafetyIssue = input.safetyFlags.length > 0;
  const scientificStrategyDefined = !isPatient && !noUpstreamChain && !noDefensibleChain;
  const freezeBlockers = uniqueSorted([
    ...(isPatient ? ["PATIENT_LEVEL_DOMAIN_GATE"] : []),
    ...(noUpstreamChain ? ["QUESTION_OBJECTIVE_HYPOTHESIS_CHAIN_INCOMPLETE"] : []),
    ...(noDefensibleChain ? ["NO_DEFENSIBLE_IMAGING_CHAIN"] : []),
    ...projectBlockingChains,
    ...projectBlockingQuestions,
    ...unresolvedStructuralGates,
    ...(input.contradictions.length ? ["UNRESOLVED_STRUCTURAL_CONTRADICTION"] : []),
    ...(criticalSafetyIssue ? ["CRITICAL_SAFETY_REVIEW_REQUIRED"] : []),
  ]);
  const readyForFreeze = scientificStrategyDefined && !freezeBlockers.length;
  const frozen = readyForFreeze && decisionsRequired.find((item) => item.gateId === "IMG-GATE-HANDOFF-FREEZE")?.status === "APPROVED";
  const compatibilityStatus = equipmentCompatibilityStatus(equipmentAssessment);
  const handoffDecisionPending = !frozen;
  const inputDigest = logicalDigest(input);
  const resultMaterial = {
    inputRef: input.inputId, status, phenomena, biomarkerCandidates, modalityCandidates, acquisitionStrategies, equipmentAssessment, timingStrategy,
    harmonizationStrategy, qualityStrategy, nonEvaluabilityRules, imageAnalysisStrategy, imagingVariables, endpointContributions, alternatives,
    decisionsRequired, adaptiveQuestions, changes, impacts, graph, refusal,
  };
  const resultDigest = logicalDigest(resultMaterial);
  const resultId = `imaging-design-result:${resultDigest}`;
  const imagingStrategyVersion = `${input.strategyVersion}:IMG-${logicalDigest({
    inputRef: input.inputId,
    phenomena,
    biomarkerCandidates,
    modalityCandidates,
    acquisitionStrategies,
    equipmentAssessment,
    timingStrategy,
    harmonizationStrategy,
    confirmedChanges: changes.filter((item) => item.status === "CONFIRMED"),
  }).slice(0, 12)}`;
  const result: ImagingDesignResult = {
    contractVersion: IMAGING_STUDY_DESIGNER_VERSION,
    inputVersion: IMAGING_STUDY_DESIGNER_VERSION,
    resultId,
    resultDigest,
    status,
    projectionNotice: "RUNTIME_PROJECTION_DOES_NOT_OWN_CANONICAL_SCIENCE",
    scientificQuestion: input.confirmedScientificQuestion,
    objectives: input.objectives,
    hypotheses: input.hypotheses,
    phenomena,
    biomarkerCandidates,
    biomarkerComparison: buildBiomarkerComparison(biomarkerCandidates),
    modalityCandidates,
    modalityComparison: buildModalityComparison(modalityCandidates, biomarkerCandidates),
    acquisitionStrategies,
    equipmentAssessment,
    timingStrategy,
    harmonizationStrategy,
    qualityStrategy,
    nonEvaluabilityRules,
    imageAnalysisStrategy,
    imagingVariables,
    endpointContributions,
    coreLabAssessment,
    alternatives,
    compromises: uniqueSorted([
      ...(modalityCandidates.length > 1 ? ["Couverture scientifique, dépendances techniques et faisabilité doivent être arbitrées sans classement automatique."] : []),
      ...(equipmentAssessment.some((item) => item.compatibility !== "EXACT_MATCH") ? ["La faisabilité reste bornée par une compatibilité équipement non démontrée ou incompatible."] : []),
    ]),
    dependencies: uniqueSorted([
      ...biomarkerCandidates.flatMap((item) => item.dependencies),
      ...modalityCandidates.flatMap((item) => item.dependencies),
      ...acquisitionStrategies.flatMap((item) => item.level2.dependencies),
    ]),
    missingInformation: uniqueSorted([
      ...input.uncertainties,
      ...input.knowledge.gaps.map((item) => item.explanation),
      ...adaptiveQuestions.filter((item) => !item.answeredValue).map((item) => item.label),
    ]),
    contradictions: input.contradictions,
    limitations: uniqueSorted([
      ...input.knowledge.limitations,
      "LEVEL_3_EXECUTABLE_ACQUISITION_PROTOCOL_NOT_GENERATABLE",
      "NO_STATISTICAL_ANALYSIS_NO_SAMPLE_SIZE_NO_PATIENT_INTERPRETATION",
      ...(input.sourceHandoff.kind !== "AUTHORIZED_ST_HANDOFF" ? ["AUTHORIZED_ST_HANDOFF_NOT_AVAILABLE_FOR_THIS_DIRECT_DESIGN_CONTEXT"] : []),
    ]),
    risks: uniqueSorted([
      ...(equipmentAssessment.some((item) => item.compatibility === "UNKNOWN_COMPATIBILITY") ? ["Compatibilité technique inconnue"] : []),
      ...(harmonizationStrategy.incompatibilities.length ? ["Incompatibilité multicentrique ou matérielle explicite"] : []),
      ...(timingStrategy.some((item) => item.type === "UNKNOWN_TIMING") ? ["Timing critique non justifié"] : []),
    ]),
    decisionsRequired,
    adaptiveQuestions,
    changes,
    impacts,
    graph,
    knowledgeHandoff: { requestRef: input.knowledge.resultId ? `request-of:${input.knowledge.resultId}` : null, resultRef: input.knowledge.resultId, resultDigest: input.knowledge.resultDigest, coverageStatus: input.knowledge.coverageStatus, gapCodes: uniqueSorted(input.knowledge.gaps.map((item) => item.code)), noClosestCorpusFallback: true },
    projectConstructionHandoff: {
      handoffVersion: "1.2",
      status: frozen ? "FROZEN_BY_HUMAN" : readyForFreeze ? "READY_FOR_HUMAN_FREEZE" : "NOT_READY",
      imagingStrategyVersion,
      humanDecision: { status: frozen ? "ADOPTED" : "PENDING", decisionRecordId: frozen ? controls.handoffDecisionRecordId ?? null : null },
      scientificStrategyStatus: scientificStrategyDefined ? "SCIENTIFIC_STRATEGY_DEFINED" : "SCIENTIFIC_STRATEGY_BLOCKED",
      projectHandoffReadiness: frozen ? "PROJECT_HANDOFF_READY" : "PROJECT_HANDOFF_BLOCKED",
      equipmentCompatibilityStatus: compatibilityStatus,
      executableProtocolReadiness: "EXECUTABLE_PROTOCOL_NOT_READY",
      resultRef: resultId,
      includedSections: ["Question", "Objectives", "Hypotheses", "Phenomena", "Biomarkers", "Modalities", "AcquisitionStrategy", "Timing", "Equipment", "Harmonization", "Quality", "ImageAnalysis", "Variables", "EndpointContributions", "CoreLabAssessment", "NonEvaluability", "Risks", "Limitations", "KnowledgeGaps", "Alternatives", "HumanDecisions", "Provenance"],
      excludedSections: ["STATISTICAL_SIZING", "COMPLETE_BUDGET", "FINAL_CRF", "REGULATORY_PLAN", "COMPLETE_OPERATIONAL_PLAN", "FINAL_SUBMISSION_PROTOCOL"],
      decisionRecordIds: uniqueSorted(controls.decisionRecordIds ?? []),
      humanDecisions: controls.decisionRecords ?? [],
      blockedBy: uniqueSorted([...freezeBlockers, ...(handoffDecisionPending ? ["HUMAN_HANDOFF_FREEZE_DECISION_PENDING"] : [])]),
      unknowns: uniqueSorted([
        ...equipmentAssessment.filter((item) => item.compatibility === "UNKNOWN_COMPATIBILITY").flatMap((item) => item.gaps),
        ...harmonizationStrategy.unknowns,
        ...input.uncertainties,
      ]),
      limitations: uniqueSorted([
        "PROJECT_HANDOFF_DOES_NOT_CONFIRM_TECHNICAL_COMPATIBILITY",
        "PROJECT_HANDOFF_DOES_NOT_AUTHORIZE_EXECUTABLE_ACQUISITION",
        ...(compatibilityStatus === "DECLARED_NOT_VERIFIED" ? ["EQUIPMENT_AVAILABILITY_DECLARED_NOT_VERIFIED"] : []),
        ...(compatibilityStatus === "PARTIALLY_KNOWN" ? ["MULTICENTER_TECHNICAL_FEASIBILITY_PARTIAL"] : []),
      ]),
      contradictions: input.contradictions,
      requiredFutureReviews: uniqueSorted([
        ...(compatibilityStatus !== "TECHNICAL_COMPATIBILITY_CONFIRMED" && compatibilityStatus !== "NOT_APPLICABLE" ? ["EQUIPMENT_COMPATIBILITY_REVIEW"] : []),
        ...(currentCenterMode.startsWith("MULTICENTRIC") ? ["MULTICENTER_HARMONIZATION_REVIEW"] : []),
        "EXECUTABLE_PROTOCOL_REVIEW_WITH_GOVERNED_EQUIPMENT_KNOWLEDGE",
        "BIOSTATISTICS_REVIEW",
        "DATA_MANAGEMENT_REVIEW",
      ]),
      provenance: uniqueSorted([input.inputId, ...input.provenance, ...input.knowledge.sourceIds]),
      trace: [
        { sequence: 1, decision: scientificStrategyDefined ? "SCIENTIFIC_STRATEGY_DEFINED" : "SCIENTIFIC_STRATEGY_BLOCKED", rationale: "Question, phénomènes et biomarqueurs sont évalués indépendamment de la qualification technique locale." },
        { sequence: 2, decision: compatibilityStatus, rationale: "La disponibilité, sa vérification et la compatibilité restent distinctes." },
        { sequence: 3, decision: frozen ? "PROJECT_HANDOFF_READY" : "PROJECT_HANDOFF_BLOCKED", rationale: frozen ? "Les décisions structurantes et le gel humain sont tracés." : "Une porte scientifique, structurelle ou humaine reste ouverte." },
        { sequence: 4, decision: "EXECUTABLE_PROTOCOL_NOT_READY", rationale: "Aucune connaissance exécutable gouvernée ne permet de produire des paramètres exacts." },
      ],
    },
    refusal,
    nextActions: uniqueSorted([
      ...(isPatient ? ["STOP_PATIENT_LEVEL"] : []),
      ...(noUpstreamChain || noDefensibleChain ? ["RETURN_TO_SCIENTIFIC_THINKING"] : []),
      ...adaptiveQuestions.filter((item) => !item.answeredValue).map((item) => `ANSWER:${item.questionId}`),
      ...decisionsRequired.filter((item) => item.status === "PENDING").map((item) => `HUMAN_DECISION:${item.gateId}`),
      ...(readyForFreeze ? ["FREEZE_PROJECT_CONSTRUCTION_HANDOFF"] : []),
    ]),
    provenance: { engineVersion: IMAGING_STUDY_DESIGNER_VERSION, inputRef: input.inputId, knowledgeResultRef: input.knowledge.resultId, sourceRefs: input.knowledge.sourceIds, policyRefs: ["RDE-001", "RDE-002", "RDE-003", "KE-001", "ST-001"], llmContributionStatus: "NO_LLM_SCIENTIFIC_DECISION" },
    trace: [
      { sequence: 1, operation: "VALIDATE_INPUT_AND_DOMAIN_GATE", mode: "DETERMINISTIC", decision: isPatient ? "PATIENT_LEVEL_REFUSED" : "IN_SCOPE", inputDigest, outputDigest: logicalDigest({ isPatient, inputId: input.inputId }) },
      { sequence: 2, operation: "MAP_PHENOMENA_AND_GOVERNED_BIOMARKERS", mode: "DETERMINISTIC", decision: `${phenomena.length}_PHENOMENA_${biomarkerCandidates.length}_BIOMARKERS`, inputDigest, outputDigest: logicalDigest({ phenomena, biomarkerCandidates }) },
      { sequence: 3, operation: "BUILD_MODALITY_ACQUISITION_QA_ANALYSIS", mode: "DETERMINISTIC", decision: `${modalityCandidates.length}_MODALITIES_LEVEL_3_BLOCKED`, inputDigest, outputDigest: logicalDigest({ modalityCandidates, acquisitionStrategies, qualityStrategy, imageAnalysisStrategy }) },
      { sequence: 4, operation: "ASSESS_HUMAN_GATES_AND_HANDOFF", mode: "HUMAN_REQUIRED", decision: frozen ? "HANDOFF_FROZEN" : "HUMAN_DECISIONS_PENDING", inputDigest, outputDigest: resultDigest },
      { sequence: 5, operation: "GENERATE_EXECUTABLE_PROTOCOL", mode: "FORBIDDEN", decision: "NOT_GENERATABLE_WITH_CURRENT_EXECUTABLE_KNOWLEDGE", inputDigest, outputDigest: resultDigest },
    ],
  };
  return parseImagingDesignResult(result);
};
