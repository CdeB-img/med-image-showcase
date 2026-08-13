import type { SemanticReconstructionCandidate } from "./types";

const normalizedRelationLabel = (value: string) => value.toLocaleLowerCase("fr-FR")
  .normalize("NFD")
  .replace(/\p{Diacritic}/gu, "")
  .replace(/[^a-z0-9]+/g, "_");

export const semanticRelationFamily = (value: string) => {
  const normalized = normalizedRelationLabel(value);
  if (/compar|versus|oppos/.test(normalized)) return "COMPARISON";
  if (/associ|relat|link/.test(normalized)) return "ASSOCIATION";
  if (/distingu|differentiat/.test(normalized)) return "DISTINCTION";
  if (/locali|register|fusion|align|co_locat/.test(normalized)) return "LOCALIZATION";
  if (/measur|quantif|observ|detect|evaluat/.test(normalized)) return "MEASUREMENT";
  if (/repeat|retest/.test(normalized)) return "REPETITION";
  if (/recover|return/.test(normalized)) return "RECOVERY";
  if (/deriv/.test(normalized)) return "DERIVATION";
  return normalized;
};

export const relationLabelsExpressInverseOrientation = (inventoryLabel: string, semanticLabel: string) => {
  const inventoryPassive = /MEASURED_BY|OBSERVED_BY|DETECTED_BY|QUANTIFIED_BY/i.test(inventoryLabel);
  const semanticPassive = /MEASURED_BY|OBSERVED_BY|DETECTED_BY|QUANTIFIED_BY/i.test(semanticLabel);
  const inventoryActive = /^(MEASURES|OBSERVES|DETECTS|QUANTIFIES)$/i.test(inventoryLabel.replace(/[^A-Za-z_]+/g, "_"));
  const semanticActive = /^(MEASURES|OBSERVES|DETECTS|QUANTIFIES)$/i.test(semanticLabel.replace(/[^A-Za-z_]+/g, "_"));
  return inventoryPassive && semanticActive || inventoryActive && semanticPassive;
};

export const relationAllowsReversedInventoryEndpoints = (inventoryLabel: string, semanticLabel: string) =>
  ["COMPARISON", "ASSOCIATION", "DISTINCTION", "LOCALIZATION"].includes(semanticRelationFamily(semanticLabel))
  || relationLabelsExpressInverseOrientation(inventoryLabel, semanticLabel);

export type RelationOwnershipAdjustment = {
  semanticRelationId: string;
  inventoryRelationId: string;
  sourceInventoryItemIdBefore: string;
  targetInventoryItemIdBefore: string;
  sourceInventoryItemIdAfter: string;
  targetInventoryItemIdAfter: string;
  reason: "SEMANTIC_RELATION_OWNS_DIRECTION";
};

const functionalInventoryRole = (value: string) => /action|operation|predicate|verb|relation|link|operator|op[ée]rateur|connector|connecteur|comparison|comparaison|intent|purpose|objectif/i.test(value);

const semanticRelationHasCollectiveSpokeGrounding = (
  candidate: SemanticReconstructionCandidate,
  semanticRelation: SemanticReconstructionCandidate["relations"][number],
  sourceInventoryIds: Set<string>,
  targetInventoryIds: Set<string>,
) => {
  const cited = candidate.semanticInventory.explicitRelations.filter((relation) => semanticRelation.inventoryRelationIds.includes(relation.inventoryRelationId));
  if (cited.length < 2) return false;
  const fragmentsById = new Map(candidate.semanticInventory.explicitFragments.map((fragment) => [fragment.inventoryItemId, fragment]));
  const endpointCounts = new Map<string, number>();
  cited.forEach((relation) => {
    endpointCounts.set(relation.sourceInventoryItemId, (endpointCounts.get(relation.sourceInventoryItemId) ?? 0) + 1);
    endpointCounts.set(relation.targetInventoryItemId, (endpointCounts.get(relation.targetInventoryItemId) ?? 0) + 1);
  });
  return [...endpointCounts.entries()].some(([sharedInventoryId, count]) => {
    if (count < 2 || sourceInventoryIds.has(sharedInventoryId) || targetInventoryIds.has(sharedInventoryId)) return false;
    const sharedFragment = fragmentsById.get(sharedInventoryId);
    const sharedOwnedByFunctionalElement = candidate.elements.some((element) => element.inventoryItemIds.includes(sharedInventoryId)
      && ["SCIENTIFIC_INTENT", "OPERATION"].includes(element.type));
    if (!sharedOwnedByFunctionalElement && !functionalInventoryRole(`${sharedFragment?.localRole ?? ""} ${sharedFragment?.normalizedLabel ?? ""}`)) return false;
    const otherEndpoints = cited.flatMap((relation) => relation.sourceInventoryItemId === sharedInventoryId
      ? [relation.targetInventoryItemId]
      : relation.targetInventoryItemId === sharedInventoryId
        ? [relation.sourceInventoryItemId]
        : []);
    return otherEndpoints.some((inventoryId) => sourceInventoryIds.has(inventoryId))
      && otherEndpoints.some((inventoryId) => targetInventoryIds.has(inventoryId));
  });
};

export const stabilizeRelationOwnership = (
  candidate: SemanticReconstructionCandidate,
): { candidate: SemanticReconstructionCandidate; adjustments: RelationOwnershipAdjustment[]; removedRelationIds: string[] } => {
  const stabilized = structuredClone(candidate);
  const elementsById = new Map(stabilized.elements.map((element) => [element.clientElementId, element]));
  const relationsById = new Map(stabilized.semanticInventory.explicitRelations.map((relation) => [relation.inventoryRelationId, relation]));
  const adjustments: RelationOwnershipAdjustment[] = [];
  const removedRelationIds: string[] = [];

  stabilized.relations.forEach((semanticRelation) => {
    const source = elementsById.get(semanticRelation.sourceClientElementId);
    const target = elementsById.get(semanticRelation.targetClientElementId);
    if (!source || !target) return;
    const sourceInventoryIds = new Set(source.inventoryItemIds);
    const targetInventoryIds = new Set(target.inventoryItemIds);

    semanticRelation.inventoryRelationIds.forEach((inventoryRelationId) => {
      const inventoryRelation = relationsById.get(inventoryRelationId);
      if (!inventoryRelation) return;
      const direct = sourceInventoryIds.has(inventoryRelation.sourceInventoryItemId)
        && targetInventoryIds.has(inventoryRelation.targetInventoryItemId);
      const reversed = sourceInventoryIds.has(inventoryRelation.targetInventoryItemId)
        && targetInventoryIds.has(inventoryRelation.sourceInventoryItemId);
      if (direct || !reversed || relationAllowsReversedInventoryEndpoints(inventoryRelation.normalizedRelation, semanticRelation.relationType)) return;

      const sourceInventoryItemIdBefore = inventoryRelation.sourceInventoryItemId;
      const targetInventoryItemIdBefore = inventoryRelation.targetInventoryItemId;
      inventoryRelation.sourceInventoryItemId = targetInventoryItemIdBefore;
      inventoryRelation.targetInventoryItemId = sourceInventoryItemIdBefore;
      adjustments.push({
        semanticRelationId: semanticRelation.clientRelationId,
        inventoryRelationId,
        sourceInventoryItemIdBefore,
        targetInventoryItemIdBefore,
        sourceInventoryItemIdAfter: inventoryRelation.sourceInventoryItemId,
        targetInventoryItemIdAfter: inventoryRelation.targetInventoryItemId,
        reason: "SEMANTIC_RELATION_OWNS_DIRECTION",
      });
    });
  });

  stabilized.relations = stabilized.relations.filter((semanticRelation) => {
    if (semanticRelation.epistemicStatus !== "EXPLICIT_USER_STATED" || semanticRelation.inventoryRelationIds.length === 0) return true;
    const source = elementsById.get(semanticRelation.sourceClientElementId);
    const target = elementsById.get(semanticRelation.targetClientElementId);
    if (!source || !target) return true;
    const sourceInventoryIds = new Set(source.inventoryItemIds);
    const targetInventoryIds = new Set(target.inventoryItemIds);
    const collectivelyGrounded = semanticRelationHasCollectiveSpokeGrounding(stabilized, semanticRelation, sourceInventoryIds, targetInventoryIds);
    const hasUnsupportedCitation = semanticRelation.inventoryRelationIds.some((inventoryRelationId) => {
      const inventoryRelation = relationsById.get(inventoryRelationId);
      if (!inventoryRelation) return true;
      const direct = sourceInventoryIds.has(inventoryRelation.sourceInventoryItemId) && targetInventoryIds.has(inventoryRelation.targetInventoryItemId);
      const reversed = sourceInventoryIds.has(inventoryRelation.targetInventoryItemId) && targetInventoryIds.has(inventoryRelation.sourceInventoryItemId);
      return !direct && !(reversed && relationAllowsReversedInventoryEndpoints(inventoryRelation.normalizedRelation, semanticRelation.relationType));
    });
    if (!hasUnsupportedCitation || collectivelyGrounded) return true;
    removedRelationIds.push(semanticRelation.clientRelationId);
    return false;
  });

  const filteredElementsById = new Map(stabilized.elements.map((element) => [element.clientElementId, element]));
  const directCarriers = stabilized.relations.filter((relation) => {
    const source = filteredElementsById.get(relation.sourceClientElementId);
    const target = filteredElementsById.get(relation.targetClientElementId);
    return source && target && !["SCIENTIFIC_INTENT", "OPERATION"].includes(source.type) && !["SCIENTIFIC_INTENT", "OPERATION"].includes(target.type);
  });
  stabilized.relations = stabilized.relations.filter((relation) => {
    const source = filteredElementsById.get(relation.sourceClientElementId);
    const target = filteredElementsById.get(relation.targetClientElementId);
    if (!source || !target || ![source.type, target.type].some((type) => ["SCIENTIFIC_INTENT", "OPERATION"].includes(type))) return true;
    const redundant = directCarriers.some((carrier) => semanticRelationFamily(carrier.relationType) === semanticRelationFamily(relation.relationType)
      && carrier.inventoryRelationIds.some((inventoryRelationId) => relation.inventoryRelationIds.includes(inventoryRelationId)));
    if (!redundant) return true;
    removedRelationIds.push(relation.clientRelationId);
    return false;
  });

  if (removedRelationIds.length) stabilized.semanticWarnings = [...new Set([
    ...stabilized.semanticWarnings,
    ...removedRelationIds.map((relationId) => `RELATION_OWNERSHIP_DROPPED_UNGROUNDED_OR_REDUNDANT_RELATION:${relationId}`),
  ])];

  return { candidate: stabilized, adjustments, removedRelationIds: [...new Set(removedRelationIds)] };
};
