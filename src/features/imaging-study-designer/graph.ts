import { logicalDigest } from "@/features/knowledge-engine/canonical";
import type { ImagingDecisionGraph, ImagingDesignInput, ImagingDesignResult } from "./types";

type GraphMaterial = Pick<ImagingDesignResult,
  "phenomena" | "biomarkerCandidates" | "modalityCandidates" | "acquisitionStrategies" | "qualityStrategy" |
  "imageAnalysisStrategy" | "imagingVariables" | "endpointContributions" | "equipmentAssessment" | "timingStrategy" | "harmonizationStrategy"
>;

export const buildImagingDecisionGraph = (input: ImagingDesignInput, material: GraphMaterial): ImagingDecisionGraph => {
  const nodes: ImagingDecisionGraph["nodes"] = [{
    nodeId: input.confirmedScientificQuestion.questionId, type: "QUESTION", label: input.confirmedScientificQuestion.text,
    status: "CONFIRMED", sourceRef: input.inputId,
  }];
  input.objectives.forEach((item) => nodes.push({ nodeId: item.objectiveId, type: "OBJECTIVE", label: item.text, status: item.reviewState === "ADOPTED" ? "CONFIRMED" : "CANDIDATE", sourceRef: input.inputId }));
  input.hypotheses.forEach((item) => nodes.push({ nodeId: item.hypothesisId, type: "HYPOTHESIS", label: item.text, status: item.reviewState === "ADOPTED" ? "CONFIRMED" : "CANDIDATE", sourceRef: input.inputId }));
  material.phenomena.forEach((item) => nodes.push({ nodeId: item.phenomenonId, type: "PHENOMENON", label: item.label, status: item.reviewState === "ADOPTED" ? "CONFIRMED" : "CANDIDATE", sourceRef: item.evidenceRefs[0] ?? input.inputId }));
  material.biomarkerCandidates.forEach((item) => nodes.push({ nodeId: item.biomarkerId, type: "BIOMARKER", label: item.label, status: item.reviewState === "ADOPTED" ? "CONFIRMED" : "CANDIDATE", sourceRef: item.evidenceRefs[0] ?? input.inputId }));
  material.modalityCandidates.forEach((item) => nodes.push({ nodeId: item.modalityId, type: "MODALITY", label: item.label, status: item.reviewState === "ADOPTED" ? "CONFIRMED" : "CANDIDATE", sourceRef: item.evidenceRefs[0] ?? input.inputId }));
  material.acquisitionStrategies.forEach((item) => {
    nodes.push({ nodeId: item.acquisitionId, type: "ACQUISITION", label: item.level2.acquisitionFamily, status: item.reviewState === "ADOPTED" ? "CONFIRMED" : "CANDIDATE", sourceRef: input.inputId });
    nodes.push({ nodeId: `${item.acquisitionId}:condition`, type: "MEASUREMENT_CONDITION", label: "Conditions méthodologiques à qualifier", status: item.level2.conditions.length ? "CANDIDATE" : "OPEN", sourceRef: input.inputId });
  });
  material.qualityStrategy.forEach((item) => nodes.push({ nodeId: item.ruleId, type: "QUALITY_CONTROL", label: `${item.surface} — ${item.acceptanceConcept}`, status: "CANDIDATE", sourceRef: item.provenanceRef }));
  material.imageAnalysisStrategy.forEach((item) => nodes.push({ nodeId: item.analysisId, type: "IMAGE_ANALYSIS", label: item.readingModel, status: item.reviewState === "ADOPTED" ? "CONFIRMED" : "CANDIDATE", sourceRef: input.inputId }));
  material.imagingVariables.forEach((item) => nodes.push({ nodeId: item.variableId, type: "VARIABLE", label: item.definition, status: "CANDIDATE", sourceRef: item.provenance[0] ?? input.inputId }));
  material.endpointContributions.forEach((item) => nodes.push({ nodeId: item.contributionId, type: "ENDPOINT_CONTRIBUTION", label: `Contribution candidate de ${item.variableId}`, status: "CANDIDATE", sourceRef: input.inputId }));

  const edges: ImagingDecisionGraph["edges"] = [];
  const push = (from: string, to: string, relation: ImagingDecisionGraph["edges"][number]["relation"]) => edges.push({ edgeId: `IMG-EDGE:${logicalDigest({ from, to, relation })}`, from, to, relation });
  input.objectives.forEach((objective) => push(input.confirmedScientificQuestion.questionId, objective.objectiveId, "ADDRESSES"));
  input.objectives.forEach((objective) => input.hypotheses.filter((hypothesis) => hypothesis.kind === "PRIMARY" || objective.level === "PRIMARY").forEach((hypothesis) => push(objective.objectiveId, hypothesis.hypothesisId, "INFORMS")));
  material.phenomena.forEach((phenomenon) => {
    phenomenon.hypothesisIds.forEach((id) => push(id, phenomenon.phenomenonId, "IMPLICATES"));
    if (!phenomenon.hypothesisIds.length) phenomenon.objectiveIds.forEach((id) => push(id, phenomenon.phenomenonId, "IMPLICATES"));
  });
  material.biomarkerCandidates.forEach((biomarker) => biomarker.phenomenonIds.forEach((id) => push(id, biomarker.biomarkerId, "APPROXIMATES")));
  material.modalityCandidates.forEach((modality) => modality.biomarkerIds.forEach((id) => push(id, modality.modalityId, "REQUIRES")));
  material.acquisitionStrategies.forEach((acquisition) => {
    push(acquisition.modalityId, acquisition.acquisitionId, "REQUIRES");
    push(acquisition.acquisitionId, `${acquisition.acquisitionId}:condition`, "REQUIRES");
  });
  material.qualityStrategy.forEach((quality) => push(quality.objectId, quality.ruleId, "REQUIRES"));
  material.imageAnalysisStrategy.forEach((analysis) => analysis.acquisitionIds.forEach((id) => push(id, analysis.analysisId, "ANALYZES")));
  material.imagingVariables.forEach((variable) => {
    variable.analysisIds.forEach((id) => push(id, variable.variableId, "PRODUCES"));
    variable.qualityRuleIds.forEach((id) => push(id, variable.variableId, "PROTECTS"));
  });
  material.endpointContributions.forEach((endpoint) => push(endpoint.variableId, endpoint.contributionId, "CONTRIBUTES_TO"));

  const brokenChains: ImagingDecisionGraph["brokenChains"] = [];
  const broken = (code: string, label: string, affectedIds: string[], consequence: string) => brokenChains.push({ code, label, affectedIds, consequence, visible: true });
  material.phenomena.filter((item) => !item.objectiveIds.length && !item.hypothesisIds.length).forEach((item) => broken("PHENOMENON_WITHOUT_OBJECTIVE_OR_HYPOTHESIS", "Phénomène sans Objectif/Hypothèse", [item.phenomenonId], "Retour à Scientific Thinking requis avant une sélection méthodologique."));
  material.biomarkerCandidates.filter((item) => !item.phenomenonIds.length).forEach((item) => broken("BIOMARKER_WITHOUT_PHENOMENON", "Biomarqueur sans phénomène", [item.biomarkerId], "Le biomarqueur ne peut pas devenir racine de la stratégie."));
  material.modalityCandidates.filter((item) => !item.biomarkerIds.length).forEach((item) => broken("MODALITY_WITHOUT_BIOMARKER", "Modalité sans biomarqueur", [item.modalityId], "La modalité reste hors chaîne et ne doit pas être sélectionnée."));
  material.acquisitionStrategies.filter((item) => !item.biomarkerIds.length).forEach((item) => broken("ACQUISITION_WITHOUT_MEASUREMENT_NEED", "Acquisition sans besoin de mesure", [item.acquisitionId], "L’acquisition ne peut pas être justifiée."));
  material.acquisitionStrategies.filter((item) => !material.qualityStrategy.some((quality) => quality.objectId === item.acquisitionId)).forEach((item) => broken("MISSING_QA_FOR_CRITICAL_MEASURE", "QA absente pour une mesure critique", [item.acquisitionId], "La mesure ne peut pas alimenter une Variable."));
  material.imageAnalysisStrategy.filter((item) => !material.imagingVariables.some((variable) => variable.analysisIds.includes(item.analysisId))).forEach((item) => broken("ANALYSIS_WITHOUT_VARIABLE", "Analyse sans Variable", [item.analysisId], "L’analyse n’a pas de sortie définie."));
  material.imagingVariables.filter((item) => !item.acquisitionIds.length).forEach((item) => broken("VARIABLE_WITHOUT_ACQUISITION", "Variable sans Acquisition ou source", [item.variableId], "La Variable est orpheline."));
  material.endpointContributions.filter((item) => !material.imagingVariables.some((variable) => variable.variableId === item.variableId)).forEach((item) => broken("ENDPOINT_FROM_UNEVALUATED_VARIABLE", "Critère alimenté par une Variable non évaluée", [item.contributionId], "La contribution au critère doit être retirée ou reconstruite."));
  material.equipmentAssessment.filter((item) => item.compatibility === "UNKNOWN_COMPATIBILITY").forEach((item) => broken("UNKNOWN_MANUFACTURER_DEPENDENCY", "Dépendance équipement inconnue", [item.equipmentId, item.acquisitionId], "La compatibilité reste explicitement inconnue."));
  material.timingStrategy.filter((item) => item.type === "UNKNOWN_TIMING").forEach((item) => broken("UNJUSTIFIED_CRITICAL_TIMING", "Timing critique non justifié", item.linkedIds, "Aucune date ne peut être générée sans justification."));
  if (input.centerContext.mode.startsWith("MULTICENTRIC") && material.harmonizationStrategy.incompatibilities.length) broken("MULTICENTER_STRATEGY_NOT_HARMONIZABLE", "Stratégie multicentrique non harmonisable en l’état", material.harmonizationStrategy.incompatibilities, "Une alternative ou une qualification humaine est requise.");
  material.acquisitionStrategies.filter((item) => !item.consequenceIfRemoved.trim()).forEach((item) => broken("ACQUISITION_WITHOUT_REMOVAL_CONSEQUENCE", "Acquisition sans conséquence si supprimée", [item.acquisitionId], "Son rôle indispensable, secondaire ou exploratoire n’est pas démontré."));

  return { projectionVersion: "RUNTIME_PROJECTION_1.0", ontologyStatus: "NO_NEW_ONTOLOGY", nodes, edges, brokenChains };
};
