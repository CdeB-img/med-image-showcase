import { comparableScientificText, logicalDigest, uniqueSorted } from "./canonical";
import type { KnowledgeRequest, QueryPlan, ScientificQuestionSpecificity } from "./types";

const valuesFor = (request: KnowledgeRequest, name: string) => request.context.dimensions.find((item) => item.name === name)?.values ?? [];

export const buildScientificQuestionSpecificity = (request: KnowledgeRequest, queryPlan: QueryPlan): ScientificQuestionSpecificity => {
  const substantiveConcepts = queryPlan.resolvedConcepts.filter((item) => !item.conceptId.startsWith("modality:") && !item.conceptId.startsWith("context:") && !item.conceptId.startsWith("unknown:"));
  const subjectTerm = request.scientificObjects.find((item) => item.role === "SUBJECT")?.originalTerm;
  const nonRoutingInput = request.scientificObjects.find((item) => !["irm", "mri", "ct", "pet", "tep"].includes(comparableScientificText(item.originalTerm)))?.originalTerm;
  const centralObject = subjectTerm && !["irm", "mri", "ct", "pet", "tep"].includes(comparableScientificText(subjectTerm))
    ? subjectTerm
    : substantiveConcepts[0]?.preferredLabel ?? nonRoutingInput ?? request.scientificObjects[0]?.originalTerm ?? "Objet scientifique non résolu";
  const comparatorObjects = uniqueSorted(request.scientificObjects.filter((item) => item.role === "COMPARATOR").map((item) => item.originalTerm));
  const inferredRelations = [
    ...(request.requestType === "COMPARE" ? ["COMPARISON_REQUESTED"] : []),
    ...(comparableScientificText(request.originalQuestion).includes(" apres ") || comparableScientificText(request.originalQuestion).includes(" post-") ? ["TEMPORAL_RELATION_REQUESTED"] : []),
    ...(/\b(depend|cause|associe|lié|liee|relation)\w*\b/.test(comparableScientificText(request.originalQuestion)) ? ["RELATIONSHIP_REQUESTED"] : []),
  ];
  const material = {
    centralObject,
    comparatorObjects,
    phenomena: uniqueSorted([...queryPlan.resolvedConcepts.filter((item) => item.conceptId.startsWith("phenomenon:")).map((item) => item.preferredLabel), ...valuesFor(request, "phenomenon")]),
    biomarkers: uniqueSorted([...queryPlan.resolvedConcepts.filter((item) => item.conceptId.startsWith("biomarker:") || item.conceptId.startsWith("measurement:")).map((item) => item.preferredLabel), ...valuesFor(request, "biomarker")]),
    pathologies: uniqueSorted([...queryPlan.resolvedConcepts.filter((item) => item.conceptId.startsWith("pathology:")).map((item) => item.preferredLabel), ...valuesFor(request, "pathology")]),
    populations: uniqueSorted(valuesFor(request, "population")),
    temporalities: uniqueSorted([...valuesFor(request, "timing"), ...queryPlan.resolvedConcepts.filter((item) => item.conceptId.startsWith("context:")).map((item) => item.preferredLabel)]),
    requestedRelations: uniqueSorted([...request.relations, ...inferredRelations]),
    userObjective: valuesFor(request, "objective")[0] ?? request.knowledgePurpose,
    preservedTerms: uniqueSorted(request.scientificObjects.map((item) => item.originalTerm).filter((item) => item !== "UNKNOWN_SCIENTIFIC_OBJECT")),
  };
  return { ...material, digest: logicalDigest(material) };
};
