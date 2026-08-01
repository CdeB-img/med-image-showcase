import { NON_PAGE_PROJECTION_CAPABILITIES, PROJECTION_CAPABILITIES } from "./constants.mjs";

const methodTypes = new Set(["AcquisitionMethod", "MeasurementMethod", "QualityMethod", "ReconstructionMethod", "Sequence", "SequenceFamily", "SoftwareMethod"]);
const comparableTypes = new Set(["AcquisitionMethod", "Biomarker", "DerivedMeasurement", "Measurement", "MeasurementMethod", "Modality", "Sequence", "SequenceFamily", "Technology", "TechnologyImplementation"]);
const technicalDocumentationTypes = new Set(["Equipment", "Feature", "Format", "Manufacturer", "Pipeline", "Service", "Software", "SoftwareVersion", "Standard", "Technology", "TechnologyImplementation", "Tool", "Viewer", "Workflow", "WorkflowConcept"]);
const overlayTypes = new Set(["Biomarker", "DerivedMeasurement", "Finding", "Measurement", "Observation", "ParametricMap", "QualityControlObject", "Viewer"]);
const caseStudyTypes = new Set(["ClinicalApplication", "Disease", "Finding", "ResearchProject", "Study"]);
const protocolTypes = new Set(["Protocol", "ProtocolConcept", "Sequence", "SequenceFamily", "Workflow", "WorkflowConcept"]);

const isPotentialForType = (capability, nodeType) => {
  if (["Glossary", "Reference", "API"].includes(capability)) return true;
  if (["Domain", "ResearchArea"].includes(nodeType)) return ["Guide", "FAQ", "Comparison", "StateOfKnowledge", "ScientificSummary", "Documentation"].includes(capability);
  if (capability === "Guide" || capability === "FAQ" || capability === "ScientificSummary") return !["Abbreviation", "Synonym"].includes(nodeType);
  if (capability === "Comparison") return comparableTypes.has(nodeType);
  if (capability === "StateOfKnowledge") return ["Biomarker", "ClinicalApplication", "DerivedMeasurement", "Disease", "Domain", "Finding", "Measurement", "Modality", "ResearchArea", "Technology"].includes(nodeType);
  if (capability === "Tutorial") return methodTypes.has(nodeType);
  if (capability === "CaseStudy") return caseStudyTypes.has(nodeType);
  if (capability === "DecisionTree") return ["ClinicalApplication", "ClinicalQuestion", "Disease", "WorkflowConcept"].includes(nodeType);
  if (capability === "ProtocolDocumentation") return protocolTypes.has(nodeType);
  if (capability === "ViewerOverlay") return overlayTypes.has(nodeType);
  if (capability === "Documentation") return technicalDocumentationTypes.has(nodeType);
  return false;
};

const evaluate = (capability, node) => {
  const { metrics } = node;
  const potential = isPotentialForType(capability, node.nodeType);
  const blockers = [];
  if (!potential) blockers.push("NODE_TYPE_NOT_APPLICABLE");
  if (potential && capability !== "API" && metrics.sourceCount === 0) blockers.push("NO_SOURCE");
  if (potential && ["FAQ", "ScientificSummary"].includes(capability) && metrics.assertionCount === 0) blockers.push("NO_ASSERTION");
  if (potential && capability === "Comparison" && metrics.relatedCount === 0 && metrics.contradictionCount === 0) blockers.push("NO_COMPARABLE_RELATION");
  if (potential && capability === "StateOfKnowledge" && metrics.synthesisCount === 0) blockers.push("NO_SYNTHESIS");
  if (potential && capability === "CaseStudy" && metrics.assertionCount === 0 && node.nodeType !== "ResearchProject" && node.nodeType !== "Study") blockers.push("NO_CASE_EVIDENCE");
  if (potential && capability === "DecisionTree") blockers.push("EXPLICIT_DECISION_RULES_NOT_PRESENT");
  if (potential && capability === "ViewerOverlay" && metrics.evidenceLinkCount === 0 && node.nodeType !== "Viewer") blockers.push("NO_OVERLAY_EVIDENCE");
  if (potential && capability === "API" && (!node.nodeId || !node.preferredLabel || !node.description)) blockers.push("CATALOG_CONTRACT_INCOMPLETE");
  return Object.freeze({ capability, potential, eligible: potential && blockers.length === 0, blockers: Object.freeze(blockers) });
};

export const calculateProjectionCapabilities = (node) => {
  const evaluations = Object.freeze(PROJECTION_CAPABILITIES.map((capability) => evaluate(capability, node)));
  const potential = Object.freeze(evaluations.filter((item) => item.potential).map((item) => item.capability));
  const available = Object.freeze(evaluations.filter((item) => item.eligible).map((item) => item.capability));
  const blocked = Object.freeze(evaluations.filter((item) => item.potential && !item.eligible).map((item) => Object.freeze({ capability: item.capability, blockers: item.blockers })));
  return Object.freeze({
    potential,
    available,
    blocked,
    evaluations,
    estimatedProjectionCount: available.length,
    estimatedPageCount: available.filter((item) => !NON_PAGE_PROJECTION_CAPABILITIES.includes(item)).length,
    virtualOnly: true,
    publicArtifactsCreated: 0,
  });
};
