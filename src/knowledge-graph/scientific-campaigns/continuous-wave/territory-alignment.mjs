const T = "noxia:scientific-territory";

const alignments = Object.freeze({
  segmentation: Object.freeze({
    territoryId: "computational-imaging",
    territoryNodeId: `${T}:computational-imaging`,
    domainNodeId: `${T}:computational-imaging:domain:segmentation`,
    defaultSubdomainNodeId: `${T}:computational-imaging:domain:segmentation:subdomain:segmentation-validation`,
    defaultKnowledgeAreaId: `${T}:computational-imaging:domain:segmentation:subdomain:segmentation-validation:knowledge-area:references-et-consensus`,
    dimensions: Object.freeze(["post-processing", "quantification", "reproducibility", "data-provenance", "ai-validation"]),
    boundaryRuleIds: Object.freeze([`${T}:boundary:human-diagnostic-imaging`, `${T}:boundary:artificial-intelligence`]),
    scopeStatus: "IN_SCOPE",
  }),
  "t2-mapping": Object.freeze({
    territoryId: "measurements-biomarkers",
    territoryNodeId: `${T}:measurements-biomarkers`,
    domainNodeId: `${T}:measurements-biomarkers:domain:relaxation-mapping`,
    defaultSubdomainNodeId: `${T}:measurements-biomarkers:domain:relaxation-mapping:subdomain:t2-relaxation`,
    defaultKnowledgeAreaId: `${T}:measurements-biomarkers:domain:relaxation-mapping:subdomain:t2-relaxation:knowledge-area:mapping-t2`,
    dimensions: Object.freeze(["field-strength", "acquisition-protocols", "quantification", "metrology-units", "reproducibility"]),
    boundaryRuleIds: Object.freeze([`${T}:boundary:human-diagnostic-imaging`, `${T}:boundary:medical-physics`]),
    scopeStatus: "IN_SCOPE",
  }),
  "quality-control": Object.freeze({
    territoryId: "quality-safety",
    territoryNodeId: `${T}:quality-safety`,
    domainNodeId: `${T}:quality-safety:domain:quality-control`,
    defaultSubdomainNodeId: `${T}:quality-safety:domain:quality-control:subdomain:clinical-qc`,
    defaultKnowledgeAreaId: `${T}:quality-safety:domain:quality-control:subdomain:clinical-qc:knowledge-area:qualite-de-carte`,
    dimensions: Object.freeze(["quantification", "metrology-units", "reproducibility", "multicenter-context", "data-provenance"]),
    boundaryRuleIds: Object.freeze([`${T}:boundary:human-diagnostic-imaging`, `${T}:boundary:medical-physics`]),
    scopeStatus: "IN_SCOPE",
  }),
  "neuro-oncology": Object.freeze({
    territoryId: "clinical-applications",
    territoryNodeId: `${T}:clinical-applications`,
    domainNodeId: `${T}:clinical-applications:domain:neurologic-disease`,
    defaultSubdomainNodeId: `${T}:clinical-applications:domain:neurologic-disease:subdomain:neuro-oncology-application`,
    defaultKnowledgeAreaId: `${T}:clinical-applications:domain:neurologic-disease:subdomain:neuro-oncology-application:knowledge-area:gliomes`,
    dimensions: Object.freeze(["acquisition-protocols", "contrast-tracers", "disease-time", "population", "data-provenance"]),
    boundaryRuleIds: Object.freeze([`${T}:boundary:human-diagnostic-imaging`, `${T}:boundary:clinical-guidance`]),
    scopeStatus: "IN_SCOPE",
  }),
  "oef-cmro2": Object.freeze({
    territoryId: "measurements-biomarkers",
    territoryNodeId: `${T}:measurements-biomarkers`,
    domainNodeId: `${T}:measurements-biomarkers:domain:oxygenation-metabolism`,
    defaultSubdomainNodeId: `${T}:measurements-biomarkers:domain:oxygenation-metabolism:subdomain:oxygen-extraction`,
    defaultKnowledgeAreaId: `${T}:measurements-biomarkers:domain:oxygenation-metabolism:subdomain:oxygen-extraction:knowledge-area:oef`,
    dimensions: Object.freeze(["contrast-tracers", "quantification", "metrology-units", "reproducibility", "multicenter-context"]),
    boundaryRuleIds: Object.freeze([`${T}:boundary:human-diagnostic-imaging`, `${T}:boundary:nuclear-medicine-imaging`, `${T}:boundary:medical-physics`]),
    scopeStatus: "IN_SCOPE",
  }),
});

const segmentationKnowledgeArea = (key = "") => {
  const base = `${T}:computational-imaging:domain:segmentation`;
  if (/dice|overlap/.test(key)) return `${base}:subdomain:segmentation-validation:knowledge-area:dice`;
  if (/boundary|distance|zero-overlap/.test(key)) return `${base}:subdomain:segmentation-validation:knowledge-area:distance-de-surface`;
  if (/annotator|agreement/.test(key)) return `${base}:subdomain:segmentation-validation:knowledge-area:interlecteur`;
  if (/generaliz|single-task|benchmark/.test(key)) return `${base}:subdomain:deep-segmentation:knowledge-area:generalisation`;
  if (/staple|reference|consensus/.test(key)) return `${base}:subdomain:segmentation-validation:knowledge-area:references-et-consensus`;
  return alignments.segmentation.defaultKnowledgeAreaId;
};

export const territoryAlignmentFor = ({ domainId, key = "", objectType = null } = {}) => {
  const base = alignments[domainId];
  if (!base) return Object.freeze({ scopeStatus: "UNRESOLVED", domainId, objectType, justification: "No explicit Territory mapping exists for this prepared domain." });
  const knowledgeAreaId = domainId === "segmentation" ? segmentationKnowledgeArea(key) : base.defaultKnowledgeAreaId;
  return Object.freeze({
    ...base,
    domainId,
    knowledgeAreaId,
    objectType,
    justification: `Prepared ${objectType ?? "object"} belongs to the explicit ${domainId} branch and its documented transverse dimensions; no Territory mutation is required.`,
  });
};

export const validateTerritoryAlignments = ({ territoryModel, domainIds = Object.keys(alignments) } = {}) => {
  const ids = new Set(territoryModel.nodes.map((node) => node.territoryNodeId));
  const dimensionIds = new Set(territoryModel.transverseDimensions.map((item) => item.dimensionId));
  const boundaryIds = new Set(territoryModel.boundaries.rules.map((item) => item.boundaryId));
  const errors = [];
  for (const domainId of domainIds) {
    const alignment = alignments[domainId];
    if (!alignment) { errors.push({ code: "TERRITORY_ALIGNMENT_MISSING", domainId }); continue; }
    for (const field of ["territoryNodeId", "domainNodeId", "defaultSubdomainNodeId", "defaultKnowledgeAreaId"]) if (!ids.has(alignment[field])) errors.push({ code: "TERRITORY_ALIGNMENT_NODE_MISSING", domainId, field, nodeId: alignment[field] });
    for (const dimensionId of alignment.dimensions) if (!dimensionIds.has(dimensionId)) errors.push({ code: "TERRITORY_ALIGNMENT_DIMENSION_MISSING", domainId, dimensionId });
    for (const boundaryRuleId of alignment.boundaryRuleIds) if (!boundaryIds.has(boundaryRuleId)) errors.push({ code: "TERRITORY_ALIGNMENT_BOUNDARY_MISSING", domainId, boundaryRuleId });
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), domains: domainIds.length });
};

export const continuousWaveTerritoryAlignments = alignments;
