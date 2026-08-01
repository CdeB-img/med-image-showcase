import { constraints, biomarkerProfileShape, protocolShape } from "./constraints.mjs";
import { entities, relations } from "./catalog.mjs";
import {
  KNOWLEDGE_GRAPH_UPDATED_AT,
  KNOWLEDGE_GRAPH_VERSION,
  entityFamilies,
  entityFamilyDefinitions,
  evidenceStatuses,
  registryNames,
  relationDefinitions,
} from "./schema.mjs";
import { sources } from "./sources.mjs";
import { scientificRegistries } from "./assertion-registries.mjs";

const sorted = (values, key) => [...values].sort((left, right) => String(left[key]).localeCompare(String(right[key])));
const byType = (entityType) => sorted(entities.filter((item) => item.entityType === entityType), "entityId");
const relatedIds = (entityId, relationType, side = "target") => relations
  .filter((item) => item[side === "target" ? "sourceId" : "targetId"] === entityId && item.relationType === relationType)
  .map((item) => item[side]);

export const biomarkerProfiles = Object.freeze(Object.fromEntries(byType("Biomarker").map((biomarker) => {
  const biomarkerId = biomarker.entityId;
  const measuredBySequences = relations
    .filter((item) => item.relationType === "MEASURES" && item.targetId === biomarkerId)
    .map((item) => item.sourceId);
  const measurementIds = relations
    .filter((item) => item.relationType === "DERIVED_FROM" && item.targetId === biomarkerId)
    .map((item) => item.sourceId);
  const diseaseIds = relations
    .filter((item) => item.relationType === "APPLIES_TO" && item.sourceId === biomarkerId)
    .map((item) => item.targetId)
    .filter((targetId) => targetId.includes(":disease:"));
  const modalityIds = [...new Set(measuredBySequences.flatMap((sequenceId) => relatedIds(sequenceId, "USES")))];
  const publicationIds = relations
    .filter((item) => item.relationType === "DOCUMENTS" && item.targetId === biomarkerId)
    .map((item) => item.sourceId);
  return [biomarkerId, {
    modalityIds: modalityIds.sort(),
    sequenceIds: measuredBySequences.sort(),
    measurementIds: measurementIds.sort(),
    diseaseIds: diseaseIds.sort(),
    evidenceIds: [],
    publicationIds: publicationIds.sort(),
    limitations: [],
    interpretationStatus: "NOT_MODELED_FROM_CURRENT_SOURCE",
  }];
})));

export const protocolRegistryContract = Object.freeze({
  entityType: "Protocol",
  requiredProperties: protocolShape,
  currentEntryCount: 0,
  reason: "No declarative protocol record is available in the audited repository sources.",
});

const registry = (registryId, entries, entryCount, source = "canonical-knowledge-graph") => ({
  registryId,
  version: KNOWLEDGE_GRAPH_VERSION,
  updatedAt: KNOWLEDGE_GRAPH_UPDATED_AT,
  source,
  entryCount,
  entries,
});

export const registries = Object.freeze({
  "knowledge-graph": registry("knowledge-graph", { entityCount: entities.length, relationCount: relations.length }, entities.length + relations.length),
  entities: registry("entities", sorted(entities, "entityId"), entities.length),
  relations: registry("relations", sorted(relations, "relationId"), relations.length),
  taxonomy: registry("taxonomy", { entityFamilies, entityFamilyDefinitions, relationDefinitions }, entityFamilies.length),
  publications: registry("publications", byType("Publication"), byType("Publication").length),
  protocols: registry("protocols", { contract: protocolRegistryContract, entries: byType("Protocol") }, byType("Protocol").length),
  biomarkers: registry("biomarkers", { profiles: biomarkerProfiles, entries: byType("Biomarker"), profileShape: biomarkerProfileShape }, byType("Biomarker").length),
  equipment: registry("equipment", [...byType("Equipment"), ...byType("EquipmentGeneration"), ...byType("SoftwareVersion")], byType("Equipment").length + byType("EquipmentGeneration").length + byType("SoftwareVersion").length),
  manufacturers: registry("manufacturers", byType("Manufacturer"), byType("Manufacturer").length),
  pathologies: registry("pathologies", byType("Disease"), byType("Disease").length),
  modalities: registry("modalities", byType("Modality"), byType("Modality").length),
  workflows: registry("workflows", [...byType("Workflow"), ...byType("Pipeline"), ...byType("CoreLab")], byType("Workflow").length + byType("Pipeline").length + byType("CoreLab").length),
  standards: registry("standards", [...byType("Standard"), ...byType("Format")], byType("Standard").length + byType("Format").length),
  sources: registry("sources", sorted(sources, "sourceId"), sources.length, "repository-source-catalog"),
  evidence: registry("evidence", evidenceStatuses.map((evidenceStatus) => ({ evidenceStatus })), evidenceStatuses.length),
  synonyms: registry("synonyms", [...byType("Synonym"), ...byType("Abbreviation")], byType("Synonym").length + byType("Abbreviation").length),
  constraints: registry("constraints", constraints, constraints.length),
  ...scientificRegistries,
});

export const registryCoverage = Object.freeze(
  Object.fromEntries(registryNames.map((registryName) => [registryName, registries[registryName]])),
);
