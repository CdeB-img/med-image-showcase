import { ontologicalRequalificationDecisions } from "../scientific-corpus/concepts.mjs";
import { consolidatedSourceByPreviousRevisionId } from "./sources.mjs";

const decisionsByConcept = Object.fromEntries(ontologicalRequalificationDecisions.map((decision) => [decision.conceptId, decision]));
const mapSources = (decision) => decision.sourceRevisionIds.map((id) => consolidatedSourceByPreviousRevisionId[id]?.revisionId ?? id).sort();

const resolution = (conceptId, decision, contextualRoles, reason, confidence) => Object.freeze({
  conceptId,
  historicalClass: decisionsByConcept[conceptId].historicalClass,
  candidateClasses: Object.freeze([...new Set([decisionsByConcept[conceptId].proposedClass, ...contextualRoles.map((role) => role.className)])]),
  appliedIdentityClass: decisionsByConcept[conceptId].historicalClass,
  decision,
  contextualRoles: Object.freeze(contextualRoles),
  sourceRevisionIds: Object.freeze(mapSources(decisionsByConcept[conceptId])),
  affectedRelations: Object.freeze([]),
  affectedProjections: Object.freeze([]),
  reason,
  confidence,
  historicalIdentityMutated: false,
});

const [t1Mapping, t1, ecv, lge, mvo, hemorrhage] = ontologicalRequalificationDecisions.map((item) => item.conceptId);

export const p4rOntologicalDecisions = Object.freeze([
  resolution(t1Mapping, "MULTI_ROLE_MODEL", [
    { role: "HISTORICAL_CATALOG_ROLE", className: "Sequence" },
    { role: "MEASUREMENT_CONTEXT_ROLE", className: "MeasurementMethod" },
  ], "The historical sequence identity remains stable while the sourced measurement-method identity carries the metrological role.", "HIGH"),
  resolution(t1, "MULTI_ROLE_MODEL", [
    { role: "EDITORIAL_BIOMARKER_ROLE", className: "Biomarker" },
    { role: "ACQUISITION_OBSERVATION_ROLE", className: "Observation" },
  ], "The broad biomarker concept cannot replace distinct native, post-contrast, myocardial and blood observations.", "HIGH"),
  resolution(ecv, "MULTI_ROLE_MODEL", [
    { role: "EDITORIAL_BIOMARKER_ROLE", className: "Biomarker" },
    { role: "QUANTITATIVE_RESULT_ROLE", className: "DerivedMeasurement" },
  ], "The editorial biomarker and modality-specific derived measurements are complementary roles, not competing identities.", "HIGH"),
  resolution(lge, "DEFERRED_WITH_EXPLICIT_REASON", [
    { role: "POSSIBLE_OBSERVED_FINDING", className: "Finding" },
    { role: "POSSIBLE_STUDY_OUTCOME", className: "Endpoint" },
  ], "The ECV/T1 pilot does not localize sufficient LGE-specific evidence to select one role across all use cases.", "MODERATE"),
  resolution(mvo, "DEFERRED_WITH_EXPLICIT_REASON", [
    { role: "CANDIDATE_FINDING", className: "Finding" },
  ], "MVO is outside P4R; changing its historical identity would constitute real enrichment of another domain.", "LOW"),
  resolution(hemorrhage, "DEFERRED_WITH_EXPLICIT_REASON", [
    { role: "CANDIDATE_FINDING", className: "Finding" },
  ], "Intramyocardial hemorrhage is outside P4R; changing its historical identity would constitute real enrichment of another domain.", "LOW"),
]);

export const ontologyDecisionSummary = Object.freeze({
  total: p4rOntologicalDecisions.length,
  resolved: p4rOntologicalDecisions.filter((item) => item.decision !== "DEFERRED_WITH_EXPLICIT_REASON").length,
  multiRole: p4rOntologicalDecisions.filter((item) => item.decision === "MULTI_ROLE_MODEL").length,
  deferred: p4rOntologicalDecisions.filter((item) => item.decision === "DEFERRED_WITH_EXPLICIT_REASON").length,
  reclassified: p4rOntologicalDecisions.filter((item) => item.decision === "RECLASSIFIED").length,
  historicalClassesChanged: p4rOntologicalDecisions.filter((item) => item.historicalIdentityMutated).length,
});

