export const PRIORITY_ENGINE_VERSION = "1.0.0";

export const PRIORITY_COMPONENT_WEIGHTS = Object.freeze({
  scientificValue: 0.20,
  editorialValue: 0.18,
  documentaryAvailability: 0.15,
  userInterest: 0.15,
  linkingPotential: 0.12,
  assertionRichness: 0.10,
  projectionPotential: 0.10,
});

const clamp = (value) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const round = (value, digits = 4) => Number(value.toFixed(digits));
const signalScore = (value) => ({ HIGH: 0.9, MEDIUM: 0.65, MODERATE: 0.55, LOW: 0.3 }[value] ?? null);

const highInterestTypes = new Set(["Biomarker", "ClinicalApplication", "DerivedMeasurement", "Disease", "Domain", "Finding", "Measurement", "Modality", "ResearchArea", "Technology"]);
const scientificTypes = new Set(["Biomarker", "DerivedMeasurement", "Disease", "Domain", "Finding", "Measurement", "MeasurementDefinition", "MeasurementMethod", "Modality", "Observation", "QualityMetric", "ResearchArea", "Standard", "Technology"]);

export const priorityLevelForScore = (score) => score >= 55 ? "HIGH" : score >= 35 ? "MEDIUM" : "LOW";

export const calculateNodePriority = (node) => {
  const { metrics, projectionCapabilities } = node;
  const roadmapSignals = node.roadmapSignals ?? {};
  const degree = metrics.parentCount + metrics.childCount + metrics.relatedCount;
  const scientificValue = signalScore(roadmapSignals.scientificValue)
    ?? clamp((scientificTypes.has(node.nodeType) ? 0.35 : 0.15) + Math.min(metrics.assertionCount, 8) / 16 + Math.min(metrics.sourceCount, 5) / 25);
  const editorialValue = signalScore(roadmapSignals.editorialValue)
    ?? clamp((highInterestTypes.has(node.nodeType) ? 0.4 : 0.2) + projectionCapabilities.potential.length / 28 + Math.min(metrics.childCount, 5) / 25);
  const documentaryAvailability = signalScore(roadmapSignals.sourceAvailability)
    ?? clamp(Math.min(metrics.sourceCount, 4) / 5 + Math.min(metrics.fullTextSourceCount, 3) / 15);
  const userInterest = clamp((highInterestTypes.has(node.nodeType) ? 0.7 : 0.35) + Math.min(degree, 10) / 50 + (roadmapSignals.priority ? Math.max(0, 11 - roadmapSignals.priority) / 50 : 0));
  const linkingPotential = clamp(Math.min(degree, 12) / 12);
  const assertionRichness = clamp(Math.log2(metrics.assertionCount + 1) / 4);
  const projectionPotential = clamp(projectionCapabilities.potential.length / 10);
  const components = Object.freeze({ scientificValue: round(scientificValue), editorialValue: round(editorialValue), documentaryAvailability: round(documentaryAvailability), userInterest: round(userInterest), linkingPotential: round(linkingPotential), assertionRichness: round(assertionRichness), projectionPotential: round(projectionPotential) });
  const normalizedScore = Object.entries(PRIORITY_COMPONENT_WEIGHTS).reduce((sum, [key, weight]) => sum + components[key] * weight, 0);
  const score = Math.round(normalizedScore * 100);
  return Object.freeze({
    level: priorityLevelForScore(score),
    score,
    components,
    weights: PRIORITY_COMPONENT_WEIGHTS,
    engineVersion: PRIORITY_ENGINE_VERSION,
    userInterestBasis: roadmapSignals.priority ? "P5_EXPLICIT_ROADMAP_SIGNAL" : "STRUCTURAL_PROXY_NO_ANALYTICS",
    manualOverride: false,
  });
};
