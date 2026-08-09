import { logicalDigest } from "@/features/knowledge-engine/canonical";
import type { ResearchProjectConstructionInput, ResearchProjectDesignResult } from "./types";

type GraphParts = Pick<ResearchProjectDesignResult, "populationDesign" | "studyDesignCandidates" | "groups" | "visits" | "variables" | "endpointCandidates" | "analysisRequirements" | "measurementDependencies">;

export const buildResearchProjectGraph = (input: ResearchProjectConstructionInput, parts: GraphParts, changes: ResearchProjectDesignResult["impactGraph"]["changes"], impacts: ResearchProjectDesignResult["impactGraph"]["impacts"]): ResearchProjectDesignResult["impactGraph"] => {
  const nodes: ResearchProjectDesignResult["impactGraph"]["nodes"] = [];
  const edges: ResearchProjectDesignResult["impactGraph"]["edges"] = [];
  const addNode = (nodeId: string, type: string, label: string, status: string, whyExists: string) => nodes.push({ nodeId, type, label, status, whyExists });
  const addEdge = (from: string, to: string, relation: string) => edges.push({ edgeId: `project-edge:${logicalDigest({ from, to, relation })}`, from, to, relation });

  addNode(input.confirmedScientificQuestion.questionId, "QUESTION", input.confirmedScientificQuestion.text, "CONFIRMED", "Racine explicite de toute la stratégie d’étude.");
  input.objectives.forEach((item) => { addNode(item.objectiveId, "OBJECTIVE", item.text, item.reviewState, "Traduit la Question en finalité examinable."); addEdge(input.confirmedScientificQuestion.questionId, item.objectiveId, "DEFINES"); });
  input.hypotheses.forEach((item) => { addNode(item.hypothesisId, "HYPOTHESIS", item.text, item.reviewState, "Proposition réfutable reliée à un Objectif."); input.objectives.forEach((objective) => addEdge(objective.objectiveId, item.hypothesisId, "TESTS")); });
  addNode(parts.populationDesign.populationId, "POPULATION", parts.populationDesign.justification, parts.populationDesign.reviewState, "Définit chez qui la Question peut être examinée honnêtement.");
  input.hypotheses.forEach((item) => addEdge(item.hypothesisId, parts.populationDesign.populationId, "CONSTRAINS"));
  parts.studyDesignCandidates.forEach((item) => { addNode(item.designId, "STUDY_DESIGN", item.label, item.reviewState, item.whyItAnswersQuestion); addEdge(parts.populationDesign.populationId, item.designId, "SHAPES"); });
  parts.groups.forEach((item) => { addNode(item.groupId, "GROUP", item.label, item.reviewState, item.justification); parts.studyDesignCandidates.forEach((design) => addEdge(design.designId, item.groupId, "ORGANIZES")); });
  parts.visits.forEach((item) => { addNode(item.visitId, "VISIT", item.label, item.timingStatus, item.justification); parts.groups.forEach((group) => addEdge(group.groupId, item.visitId, "OBSERVED_AT")); });
  parts.measurementDependencies.forEach((item) => { addNode(item.dependencyId, "MEASUREMENT", item.measurementRef, item.status, item.reason); parts.visits.forEach((visit) => { if (visit.measurementIds.includes(item.dependencyId)) addEdge(visit.visitId, item.dependencyId, "SCHEDULES"); }); });
  parts.variables.forEach((item) => { addNode(item.variableId, "VARIABLE", item.definition, item.knowledgeStatus, "Matérialise une mesure nécessaire à un Critère sans imposer de nom de Data Dictionary."); parts.measurementDependencies.forEach((measurement) => { if (measurement.requiredFor.includes(item.variableId)) addEdge(measurement.dependencyId, item.variableId, "PRODUCES"); }); });
  parts.endpointCandidates.forEach((item) => { addNode(item.endpointId, "ENDPOINT", item.label, item.proposedRole, item.justification); item.variableIds.forEach((variableId) => addEdge(variableId, item.endpointId, "CONTRIBUTES_TO")); });
  parts.analysisRequirements.forEach((item) => { addNode(item.requirementId, "ANALYSIS_REQUIREMENT", item.purpose, "SPECIALIZED_ENGINE_REQUIRED", item.reason); item.endpointIds.forEach((endpointId) => addEdge(endpointId, item.requirementId, "REQUIRES")); });
  if (input.imagingDesignResult) {
    addNode(input.imagingDesignResult.resultId, "IMAGING", "Contribution Imaging gelée", "FROZEN_BY_HUMAN", "Fournit les biomarqueurs, acquisitions, Variables et exigences QA applicables.");
    input.imagingDesignResult.biomarkerCandidates.forEach((item) => { addNode(item.biomarkerId, "BIOMARKER", item.label, item.reviewState, "Relie un Phénomène à une mesure d’imagerie candidate."); addEdge(input.imagingDesignResult!.resultId, item.biomarkerId, "PROPOSES"); });
    input.imagingDesignResult.acquisitionStrategies.forEach((item) => { addNode(item.acquisitionId, "ACQUISITION", item.level2.acquisitionFamily, item.reviewState, item.level1.scientificReason); item.biomarkerIds.forEach((biomarkerId) => addEdge(biomarkerId, item.acquisitionId, "MEASURED_BY")); });
    input.imagingDesignResult.imagingVariables.forEach((item) => item.acquisitionIds.forEach((acquisitionId) => addEdge(acquisitionId, item.variableId, "PRODUCES")));
  }
  return { ontologyStatus: "NO_NEW_ONTOLOGY_RUNTIME_PROJECTION", nodes, edges, changes, impacts };
};
