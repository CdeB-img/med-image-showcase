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

export const stabilizeRelationOwnership = (
  candidate: SemanticReconstructionCandidate,
): { candidate: SemanticReconstructionCandidate; adjustments: RelationOwnershipAdjustment[] } => {
  const stabilized = structuredClone(candidate);
  const elementsById = new Map(stabilized.elements.map((element) => [element.clientElementId, element]));
  const relationsById = new Map(stabilized.semanticInventory.explicitRelations.map((relation) => [relation.inventoryRelationId, relation]));
  const adjustments: RelationOwnershipAdjustment[] = [];

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

  return { candidate: stabilized, adjustments };
};
