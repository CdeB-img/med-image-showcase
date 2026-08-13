import { comparableScientificText, logicalDigest } from "@/features/knowledge-engine/canonical";
import { parseSemanticReconstructionCandidate } from "./schema";
import {
  relationAllowsReversedInventoryEndpoints,
  semanticRelationFamily,
  stabilizeRelationOwnership,
} from "./relation-ownership";
import type {
  ExplicitCoverageReport,
  RelationCoverageReport,
  ScientificSemanticProvider,
  SemanticCriticRepair,
  SemanticCriticResult,
  SemanticIntegrityReport,
  SemanticProviderAttempt,
  SemanticReconstructionCandidate,
  SemanticReconstructionRequest,
  SemanticTaxonomyReport,
} from "./types";

export class SemanticCoverageError extends Error {
  constructor(public readonly reason: string) {
    super(`SEMANTIC_COVERAGE_FAILED:${reason}`);
  }
}

const normalizedTaxonomyText = (value: string) => value.toLocaleLowerCase("fr-FR")
  .normalize("NFD")
  .replace(/\p{Diacritic}/gu, "");

const explicitlyNamesProductionMethod = (element: SemanticReconstructionCandidate["elements"][number]) => {
  const expressed = normalizedTaxonomyText(`${element.sourceText ?? ""} ${element.canonicalMeaning}`);
  return /\b(?:mapping|cartograph\w*|tracking|computation|calcul\w*|quantification|processing|traitement|acquisition|sequence|assay|dosage|analysis|analyse|segmentation|radiomi\w*|labeling|marquage|elastograph\w*|tomograph\w*|imaging|imagerie)\b/i.test(expressed);
};

const relationUsesElementAsQuantitativeObservable = (
  candidate: SemanticReconstructionCandidate,
  clientElementId: string,
) => candidate.relations.some((relation) => {
  if (relation.sourceClientElementId !== clientElementId || !/predict|prognos|announ|associ|correl|relat|indicat/i.test(relation.relationType)) return false;
  const target = candidate.elements.find((element) => element.clientElementId === relation.targetClientElementId);
  return Boolean(target && ["OUTCOME", "CONDITION", "PHENOMENON", "SCIENTIFIC_OBJECT"].includes(target.type));
});

export const preserveContextualMeasurementAmbiguities = (
  request: SemanticReconstructionRequest,
  candidate: SemanticReconstructionCandidate,
): SemanticReconstructionCandidate => {
  const additions = candidate.elements.flatMap((element) => {
    if (element.type !== "METHOD"
      || !explicitlyNamesProductionMethod(element)
      || !relationUsesElementAsQuantitativeObservable(candidate, element.clientElementId)) return [];
    const hasNamedObservable = candidate.relations.some((relation) => {
      if (![relation.sourceClientElementId, relation.targetClientElementId].includes(element.clientElementId)) return false;
      const otherId = relation.sourceClientElementId === element.clientElementId ? relation.targetClientElementId : relation.sourceClientElementId;
      const other = candidate.elements.find((item) => item.clientElementId === otherId);
      return Boolean(other && ["BIOMARKER", "ENDPOINT"].includes(other.type)
        && /measur|produce|derive|quantif|observ/i.test(relation.relationType));
    });
    if (hasNamedObservable) return [];
    const label = element.sourceText ?? element.canonicalMeaning;
    return [request.language === "fr"
      ? `La mesure quantitative produite par la méthode « ${label} » et utilisée comme prédicteur n'est pas explicitement nommée.`
      : `The quantitative measurement produced by the method “${label}” and used as a predictor is not explicitly named.`];
  });
  if (!additions.length) return candidate;
  return parseSemanticReconstructionCandidate({
    ...candidate,
    ambiguities: [...new Set([...candidate.ambiguities, ...additions])],
  });
};

const exactUserSpan = (request: SemanticReconstructionRequest, messageId: string, sourceText: string) => {
  const message = request.messages.find((item) => item.role === "USER" && item.messageId === messageId);
  return Boolean(message && message.content.includes(sourceText));
};

export const buildSemanticIntegrityReport = (
  request: SemanticReconstructionRequest,
  candidate: SemanticReconstructionCandidate,
): SemanticIntegrityReport => {
  const findings: SemanticIntegrityReport["findings"] = [];
  const inventoryById = new Map(candidate.semanticInventory.explicitFragments.map((item) => [item.inventoryItemId, item]));
  const elementsById = new Map(candidate.elements.map((item) => [item.clientElementId, item]));

  candidate.semanticInventory.explicitFragments.forEach((fragment) => {
    if (!exactUserSpan(request, fragment.sourceMessageId, fragment.sourceText)) findings.push({
      code: "INVENTORY_FRAGMENT_SOURCE_NOT_CONTIGUOUS",
      inventoryItemId: fragment.inventoryItemId,
      inventoryRelationId: null,
      clientElementId: null,
      clientRelationId: null,
      reason: "Every explicit inventory fragment must quote one exact contiguous span from its declared USER message; reconstructed or ellipsis-marked text belongs only in normalizedLabel.",
    });
  });
  candidate.semanticInventory.explicitRelations.forEach((relation) => {
    if (!exactUserSpan(request, relation.sourceMessageId, relation.sourceText)) findings.push({
      code: "INVENTORY_RELATION_SOURCE_NOT_CONTIGUOUS",
      inventoryItemId: null,
      inventoryRelationId: relation.inventoryRelationId,
      clientElementId: null,
      clientRelationId: null,
      reason: "Every explicit inventory relation must quote one exact contiguous clause from its declared USER message.",
    });
  });
  candidate.elements.forEach((element) => {
    if (element.epistemicStatus === "EXPLICIT_USER_STATED" && (!element.sourceMessageId || !element.sourceText || !exactUserSpan(request, element.sourceMessageId, element.sourceText))) findings.push({
      code: "EXPLICIT_ELEMENT_SOURCE_NOT_CONTIGUOUS",
      inventoryItemId: element.inventoryItemIds[0] ?? null,
      inventoryRelationId: null,
      clientElementId: element.clientElementId,
      clientRelationId: null,
      reason: "An explicit Semantic Element must retain an exact contiguous USER span; a reconstructed shared head or omitted token may appear only in canonicalMeaning.",
    });
  });

  candidate.relations.filter((relation) => relation.epistemicStatus === "EXPLICIT_USER_STATED").forEach((relation) => {
    const source = elementsById.get(relation.sourceClientElementId);
    const target = elementsById.get(relation.targetClientElementId);
    if (!source || !target) return;
    const sourceInventoryIds = new Set(source.inventoryItemIds);
    const targetInventoryIds = new Set(target.inventoryItemIds);
    relation.inventoryRelationIds.forEach((inventoryRelationId) => {
      const inventoryRelation = candidate.semanticInventory.explicitRelations.find((item) => item.inventoryRelationId === inventoryRelationId);
      if (!inventoryRelation) return;
      const direct = sourceInventoryIds.has(inventoryRelation.sourceInventoryItemId) && targetInventoryIds.has(inventoryRelation.targetInventoryItemId);
      const reversed = sourceInventoryIds.has(inventoryRelation.targetInventoryItemId) && targetInventoryIds.has(inventoryRelation.sourceInventoryItemId);
      const endpointsCompatible = direct || reversed && relationAllowsReversedInventoryEndpoints(inventoryRelation.normalizedRelation, relation.relationType);
      if (!endpointsCompatible) findings.push({
        code: "RELATION_INVENTORY_ENDPOINT_MISMATCH",
        inventoryItemId: null,
        inventoryRelationId,
        clientElementId: null,
        clientRelationId: relation.clientRelationId,
        reason: "The direct Semantic Relation endpoints must be grounded by the source and target inventory fragments of the relation it cites; operator, constraint or intent fragments cannot silently replace a scientific endpoint.",
      });
      if (relation.polarity !== inventoryRelation.polarity) findings.push({
        code: "RELATION_POLARITY_MISMATCH",
        inventoryItemId: null,
        inventoryRelationId,
        clientElementId: null,
        clientRelationId: relation.clientRelationId,
        reason: "An explicit Semantic Relation must preserve the polarity of its grounded inventory relation.",
      });
    });

    const toolTypes = new Set(["METHOD", "MODALITY"]);
    const measurementTargetTypes = new Set(["SCIENTIFIC_OBJECT", "ANATOMICAL_CONTEXT", "PHENOMENON", "BIOMARKER", "ENDPOINT", "OUTCOME"]);
    const passiveMeasurementInverted = /MEASURED_BY|OBSERVED_BY|DETECTED_BY|QUANTIFIED_BY/i.test(relation.relationType)
      && toolTypes.has(source.type) && measurementTargetTypes.has(target.type);
    const activeMeasurementInverted = /^(MEASURES|OBSERVES|DETECTS|QUANTIFIES)$/i.test(relation.relationType)
      && measurementTargetTypes.has(source.type) && toolTypes.has(target.type);
    const repetitionAnchorInvalid = semanticRelationFamily(relation.relationType) === "REPETITION"
      && (["STUDY_DESIGN", "SCIENTIFIC_INTENT", "OPERATION"].includes(source.type) || !["TIMING", "STUDY_DESIGN"].includes(target.type));
    if (passiveMeasurementInverted || activeMeasurementInverted || repetitionAnchorInvalid) findings.push({
      code: "RELATION_DIRECTION_OR_ROLE_MISMATCH",
      inventoryItemId: null,
      inventoryRelationId: relation.inventoryRelationIds[0] ?? null,
      clientElementId: null,
      clientRelationId: relation.clientRelationId,
      reason: repetitionAnchorInvalid
        ? "A repetition relation is anchored from the repeated observable or method to its explicit TIMING or test-retest STUDY_DESIGN context, not from an intent or operation wrapper."
        : "The active/passive measurement label, endpoint direction and scientific roles are inconsistent.",
    });
  });

  for (const finding of findings) {
    if (finding.inventoryItemId && !inventoryById.has(finding.inventoryItemId)) finding.inventoryItemId = null;
  }
  return { status: findings.length ? "INCOMPLETE" : "COMPLETE", findings };
};

const elementsMappedToInventoryItem = (
  candidate: SemanticReconstructionCandidate,
  inventoryItemId: string,
) => {
  const directlyMapped = candidate.elements.filter((element) => element.inventoryItemIds.includes(inventoryItemId));
  const fragment = candidate.semanticInventory.explicitFragments.find((item) => item.inventoryItemId === inventoryItemId);
  if (!fragment || !/objective|objectif|composite|scope|strategy|strategie/i.test(fragment.localRole)) return directlyMapped;
  const compositeConstituents = candidate.elements.filter((element) => element.sourceMessageId === fragment.sourceMessageId
    && element.sourceText
    && fragment.sourceText.toLocaleLowerCase("fr-FR").includes(element.sourceText.toLocaleLowerCase("fr-FR")));
  return compositeConstituents.length >= 2
    ? [...new Map([...directlyMapped, ...compositeConstituents].map((element) => [element.clientElementId, element])).values()]
    : directlyMapped;
};

const relationIdsCoveringFunctionalFragment = (
  candidate: SemanticReconstructionCandidate,
  fragment: SemanticReconstructionCandidate["semanticInventory"]["explicitFragments"][number],
) => {
  const functionalRole = /action|operation|predicate|verb|relation|operator|op[ée]rateur|connector|connecteur|comparison|comparaison|comparator.?marker/i.test(fragment.localRole);
  if (!functionalRole) return [];

  const linkedIds = new Set(fragment.linkedInventoryItemIds);
  const purelyRelationalRole = /relation|operator|op[ée]rateur|connector|connecteur|comparison|comparaison|comparator.?marker/i.test(fragment.localRole);
  const fragmentText = fragment.sourceText.toLocaleLowerCase("fr-FR");
  return [...new Set(candidate.semanticInventory.explicitRelations.flatMap((inventoryRelation) => {
    const sameSource = inventoryRelation.sourceMessageId === fragment.sourceMessageId;
    const exactFragmentInsideRelation = inventoryRelation.sourceText.toLocaleLowerCase("fr-FR").includes(fragmentText);
    const linkedToEndpoint = linkedIds.has(inventoryRelation.sourceInventoryItemId)
      || linkedIds.has(inventoryRelation.targetInventoryItemId)
      || inventoryRelation.sourceInventoryItemId === fragment.inventoryItemId
      || inventoryRelation.targetInventoryItemId === fragment.inventoryItemId;
    if (!sameSource || !exactFragmentInsideRelation || (!linkedToEndpoint && !purelyRelationalRole)) return [];
    return candidate.relations
      .filter((relation) => relation.inventoryRelationIds.includes(inventoryRelation.inventoryRelationId)
        && relation.epistemicStatus === "EXPLICIT_USER_STATED"
        && relation.polarity === inventoryRelation.polarity)
      .map((relation) => relation.clientRelationId);
  }))].sort();
};

const relationIdsCoveringLinkedRelationalFragment = (
  candidate: SemanticReconstructionCandidate,
  fragment: SemanticReconstructionCandidate["semanticInventory"]["explicitFragments"][number],
) => {
  const relationalRole = /relation|link|connector|connecteur|operator|op[ée]rateur|association|comparison|comparaison/i.test(`${fragment.localRole} ${fragment.normalizedLabel}`);
  if (!relationalRole || fragment.linkedInventoryItemIds.length < 2) return [];
  const linkedIds = new Set(fragment.linkedInventoryItemIds);
  return candidate.relations.filter((relation) => relation.epistemicStatus === "EXPLICIT_USER_STATED" && relation.polarity === fragment.polarity).filter((relation) => {
    const source = candidate.elements.find((element) => element.clientElementId === relation.sourceClientElementId);
    const target = candidate.elements.find((element) => element.clientElementId === relation.targetClientElementId);
    if (!source || !target) return false;
    return source.inventoryItemIds.some((inventoryItemId) => linkedIds.has(inventoryItemId))
      && target.inventoryItemIds.some((inventoryItemId) => linkedIds.has(inventoryItemId));
  }).map((relation) => relation.clientRelationId).sort();
};

const unaryStateTransitionIds = (
  candidate: SemanticReconstructionCandidate,
  fragment: SemanticReconstructionCandidate["semanticInventory"]["explicitFragments"][number] | undefined,
) => {
  if (!fragment) return [];
  const action = `${fragment.localRole} ${fragment.normalizedLabel} ${fragment.sourceText}`
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr-FR");
  const retention = /retain|keep|preserv|maintain|conserv|gard/.test(action);
  const addition = /\badd|ajout|include|inclu|insert/.test(action);
  const removal = /remov|retir|exclud|exclu|reject|supprim|drop|withdraw/.test(action);
  if (!retention && !addition && !removal) return [];
  const linkedIds = new Set(fragment.linkedInventoryItemIds);
  return candidate.elements.filter((element) => element.epistemicStatus === "EXPLICIT_USER_STATED"
    && element.inventoryItemIds.some((inventoryItemId) => linkedIds.has(inventoryItemId))
    && (retention ? element.polarity === "AFFIRMED" && element.supersedesElementIds.length > 0 : true)
    && (addition ? element.polarity === "AFFIRMED" && element.supersedesElementIds.length === 0 : true)
    && (removal ? element.polarity === "NEGATED" && element.supersedesElementIds.length > 0 : true))
    .map((element) => `state-transition:${element.clientElementId}`)
    .sort();
};

const relationIdsCarryingFramedFunctionalEndpoint = (
  candidate: SemanticReconstructionCandidate,
  inventoryRelation: SemanticReconstructionCandidate["semanticInventory"]["explicitRelations"][number],
  sourceElementIds: Set<string>,
  targetElementIds: Set<string>,
) => {
  const normalizedRelation = inventoryRelation.normalizedRelation
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
  const isFramingRelation = /^(?:AIMS?_TO|INTENDS?_TO|WANTS?_TO|SEEKS?_TO|REQUESTS?_TO|PROPOSES?_TO|HAS_(?:PURPOSE|GOAL)_TO)(?:_.+)?$/.test(normalizedRelation)
    || /^(?:INTENDED|WANTED|SOUGHT|REQUESTED|PROPOSED|AIMED)_BY(?:_.+)?$/.test(normalizedRelation);
  if (!isFramingRelation) return [];

  const isFramingEndpoint = (elementIds: Set<string>) => candidate.elements.some((element) =>
    elementIds.has(element.clientElementId) && ["SCIENTIFIC_INTENT", "OPERATION"].includes(element.type));
  const sourceFragment = candidate.semanticInventory.explicitFragments.find((fragment) =>
    fragment.inventoryItemId === inventoryRelation.sourceInventoryItemId);
  const targetFragment = candidate.semanticInventory.explicitFragments.find((fragment) =>
    fragment.inventoryItemId === inventoryRelation.targetInventoryItemId);
  const functionalFragment = isFramingEndpoint(sourceElementIds) && targetElementIds.size === 0
    ? targetFragment
    : isFramingEndpoint(targetElementIds) && sourceElementIds.size === 0
      ? sourceFragment
      : undefined;
  if (!functionalFragment) return [];

  return relationIdsCoveringFunctionalFragment(candidate, functionalFragment).filter((relationId) => {
    const carrier = candidate.relations.find((relation) => relation.clientRelationId === relationId);
    if (!carrier) return false;
    const source = candidate.elements.find((element) => element.clientElementId === carrier.sourceClientElementId);
    const target = candidate.elements.find((element) => element.clientElementId === carrier.targetClientElementId);
    return Boolean(source && target
      && !["SCIENTIFIC_INTENT", "OPERATION", "MISSING_CONCEPT"].includes(source.type)
      && !["SCIENTIFIC_INTENT", "OPERATION", "MISSING_CONCEPT"].includes(target.type));
  });
};

export const buildExplicitCoverageReport = (
  request: SemanticReconstructionRequest,
  candidate: SemanticReconstructionCandidate,
): ExplicitCoverageReport => {
  const entries = candidate.semanticInventory.explicitFragments.map((fragment) => {
    const inventorySpanExact = exactUserSpan(request, fragment.sourceMessageId, fragment.sourceText);
    const mappedElements = elementsMappedToInventoryItem(candidate, fragment.inventoryItemId)
      .filter((element) => element.epistemicStatus !== "EXPLICIT_USER_STATED"
        || inventorySpanExact
        || Boolean(element.sourceMessageId && element.sourceText && exactUserSpan(request, element.sourceMessageId, element.sourceText)));
    const mappedClientElementIds = mappedElements
      .map((element) => element.clientElementId)
      .sort();
    const mappedClientRelationIds = mappedClientElementIds.length === 0
      ? [...new Set([...relationIdsCoveringFunctionalFragment(candidate, fragment), ...relationIdsCoveringLinkedRelationalFragment(candidate, fragment), ...unaryStateTransitionIds(candidate, fragment)])].sort()
      : [];
    const mapped = mappedClientElementIds.length > 0 || mappedClientRelationIds.length > 0;
    return {
      inventoryItemId: fragment.inventoryItemId,
      sourceMessageId: fragment.sourceMessageId,
      sourceText: fragment.sourceText,
      normalizedMeaning: fragment.normalizedLabel,
      mappedClientElementIds,
      mappedClientRelationIds,
      coverageStatus: mapped ? "MAPPED" as const : "UNRESOLVED_EXPLICIT_FRAGMENT" as const,
      reason: mapped
        ? mappedClientRelationIds.length && mappedClientElementIds.length === 0
          ? "The explicit functional fragment is represented by its source-grounded direct Semantic Relation rather than by a false object node."
          : inventorySpanExact
          ? "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment."
          : "The inventory label is non-contiguous, but a mapped Semantic Element supplies an exact source-grounded span."
        : inventorySpanExact
          ? "The exact inventory fragment has no source-grounded typed Semantic Element mapping."
          : "Neither the inventory label nor a mapped Semantic Element supplies an exact source-grounded span.",
    };
  });
  return { status: entries.every((item) => item.coverageStatus === "MAPPED") ? "COMPLETE" : "INCOMPLETE", entries };
};

export const buildRelationCoverageReport = (
  request: SemanticReconstructionRequest,
  candidate: SemanticReconstructionCandidate,
): RelationCoverageReport => {
  const inventoryEntries = candidate.semanticInventory.explicitRelations.map((inventoryRelation) => {
    const inventorySpanExact = exactUserSpan(request, inventoryRelation.sourceMessageId, inventoryRelation.sourceText);
    const relationSourceElements = new Set(elementsMappedToInventoryItem(candidate, inventoryRelation.sourceInventoryItemId).map((element) => element.clientElementId));
    const relationTargetElements = new Set(elementsMappedToInventoryItem(candidate, inventoryRelation.targetInventoryItemId).map((element) => element.clientElementId));
    const symmetric = /compar|versus|oppos|associ|relat|distingu|concern|about|porte.?sur/i.test(inventoryRelation.normalizedRelation);
    const toolTypes = new Set(["MODALITY", "METHOD"]);
    const directionCompatible = (relation: SemanticReconstructionCandidate["relations"][number]) => {
      const source = candidate.elements.find((element) => element.clientElementId === relation.sourceClientElementId);
      const target = candidate.elements.find((element) => element.clientElementId === relation.targetClientElementId);
      if (!source || !target) return false;
      const sourceTool = toolTypes.has(source.type);
      const targetTool = toolTypes.has(target.type);
      if (/MEASURED_BY|OBSERVED_BY|DETECTED_BY/i.test(relation.relationType) && sourceTool && !targetTool) return false;
      const sourceIsMeasuredTarget = ["SCIENTIFIC_OBJECT", "ANATOMICAL_CONTEXT", "PHENOMENON", "BIOMARKER", "ENDPOINT", "OUTCOME"].includes(source.type);
      if (/^(MEASURES|OBSERVES|DETECTS)$/i.test(relation.relationType) && targetTool && !sourceTool && sourceIsMeasuredTarget) return false;
      return true;
    };
    const coalescedElementIds = [...relationSourceElements].filter((elementId) => relationTargetElements.has(elementId)).map((elementId) => `coalesced:${elementId}`);
    const supersededEndpointIds = [...relationSourceElements, ...relationTargetElements].filter((elementId) => {
      const endpoint = candidate.elements.find((element) => element.clientElementId === elementId);
      if (!endpoint || endpoint.polarity !== "NEGATED") return false;
      const canonicalEndpointId = `sem-element:${logicalDigest({ type: endpoint.type, meaning: comparableScientificText(endpoint.canonicalMeaning) })}`;
      return endpoint.supersedesElementIds.includes(canonicalEndpointId)
        || candidate.elements.some((element) => element.supersedesElementIds.includes(elementId));
    }).map((elementId) => `superseded:${elementId}`);
    const directlyMappedClientRelationIds = candidate.relations
      .filter((relation) => relation.inventoryRelationIds.includes(inventoryRelation.inventoryRelationId))
      .filter(directionCompatible)
      .filter((relation) => relationSourceElements.has(relation.sourceClientElementId) && relationTargetElements.has(relation.targetClientElementId)
        || (symmetric || /measur|quantif|observ|detect|exclud|constrain|without|sans|timing|tempor|repeated|assessed|follow.?up/i.test(inventoryRelation.normalizedRelation))
          && relationSourceElements.has(relation.targetClientElementId) && relationTargetElements.has(relation.sourceClientElementId))
      .map((relation) => relation.clientRelationId)
      .sort();
    const sourceIsIntent = candidate.elements.some((element) => relationSourceElements.has(element.clientElementId) && (element.type === "SCIENTIFIC_INTENT" || element.type === "OPERATION"));
    const comparisonSiblings = sourceIsIntent && /compar|versus|oppos/i.test(inventoryRelation.normalizedRelation)
      ? candidate.semanticInventory.explicitRelations.filter((item) => item.inventoryRelationId !== inventoryRelation.inventoryRelationId
        && item.sourceInventoryItemId === inventoryRelation.sourceInventoryItemId
        && /compar|versus|oppos/i.test(item.normalizedRelation))
      : [];
    const directComparisonFromIntentTargetIds = sourceIsIntent && /compar|versus|oppos/i.test(inventoryRelation.normalizedRelation)
      ? candidate.relations.filter((relation) => /compar|versus|oppos/i.test(relation.relationType)
        && (relationTargetElements.has(relation.sourceClientElementId) || relationTargetElements.has(relation.targetClientElementId)))
        .map((relation) => relation.clientRelationId)
      : [];
    const bridgedClientRelationIds = comparisonSiblings.flatMap((sibling) => {
      const siblingTargets = new Set(candidate.elements.filter((element) => element.inventoryItemIds.includes(sibling.targetInventoryItemId)).map((element) => element.clientElementId));
      return candidate.relations.filter((relation) => /compar|versus|oppos/i.test(relation.relationType)
        && (relationTargetElements.has(relation.sourceClientElementId) && siblingTargets.has(relation.targetClientElementId)
          || relationTargetElements.has(relation.targetClientElementId) && siblingTargets.has(relation.sourceClientElementId))).map((relation) => relation.clientRelationId);
    });
    const sourceIntentItems = new Set(candidate.elements.filter((element) => (element.type === "SCIENTIFIC_INTENT" || element.type === "OPERATION") && element.inventoryItemIds.includes(inventoryRelation.sourceInventoryItemId)).map(() => inventoryRelation.sourceInventoryItemId));
    const targetIntentItems = new Set(candidate.elements.filter((element) => (element.type === "SCIENTIFIC_INTENT" || element.type === "OPERATION") && element.inventoryItemIds.includes(inventoryRelation.targetInventoryItemId)).map(() => inventoryRelation.targetInventoryItemId));
    const intentInventoryItemId = [...sourceIntentItems, ...targetIntentItems][0];
    const neighborInventoryItemId = intentInventoryItemId === inventoryRelation.sourceInventoryItemId ? inventoryRelation.targetInventoryItemId : inventoryRelation.sourceInventoryItemId;
    const actionBridgeIds = intentInventoryItemId ? candidate.semanticInventory.explicitRelations.flatMap((sibling) => {
      if (sibling.inventoryRelationId === inventoryRelation.inventoryRelationId || ![sibling.sourceInventoryItemId, sibling.targetInventoryItemId].includes(intentInventoryItemId)) return [];
      const siblingNeighborId = sibling.sourceInventoryItemId === intentInventoryItemId ? sibling.targetInventoryItemId : sibling.sourceInventoryItemId;
      const neighbors = new Set(candidate.elements.filter((element) => element.inventoryItemIds.includes(neighborInventoryItemId)).map((element) => element.clientElementId));
      const siblingNeighbors = new Set(candidate.elements.filter((element) => element.inventoryItemIds.includes(siblingNeighborId)).map((element) => element.clientElementId));
      return candidate.relations.filter((relation) => directionCompatible(relation) && (neighbors.has(relation.sourceClientElementId) && siblingNeighbors.has(relation.targetClientElementId)
        || neighbors.has(relation.targetClientElementId) && siblingNeighbors.has(relation.sourceClientElementId))).map((relation) => relation.clientRelationId);
    }) : [];
    const framedFunctionalCarrierIds = relationIdsCarryingFramedFunctionalEndpoint(
      candidate,
      inventoryRelation,
      relationSourceElements,
      relationTargetElements,
    );
    const sourceFragment = candidate.semanticInventory.explicitFragments.find((fragment) => fragment.inventoryItemId === inventoryRelation.sourceInventoryItemId);
    const targetFragment = candidate.semanticInventory.explicitFragments.find((fragment) => fragment.inventoryItemId === inventoryRelation.targetInventoryItemId);
    const compositeEndpointTopologyIds = (() => {
      if (semanticRelationFamily(inventoryRelation.normalizedRelation) !== "COMPARISON") return [];
      const resolve = (
        composite: typeof sourceFragment,
        otherInventoryItemId: string,
      ) => {
        if (!composite || composite.linkedInventoryItemIds.length < 2) return [];
        const constituentGroups = composite.linkedInventoryItemIds.map((inventoryItemId) => new Set(
          elementsMappedToInventoryItem(candidate, inventoryItemId).map((element) => element.clientElementId),
        ));
        const otherElementIds = new Set(elementsMappedToInventoryItem(candidate, otherInventoryItemId).map((element) => element.clientElementId));
        if (constituentGroups.some((group) => group.size === 0) || otherElementIds.size === 0) return [];
        const comparisonCarriers = candidate.relations.filter((relation) => semanticRelationFamily(relation.relationType) === "COMPARISON"
          && constituentGroups.some((left, leftIndex) => constituentGroups.some((right, rightIndex) => leftIndex < rightIndex
            && (left.has(relation.sourceClientElementId) && right.has(relation.targetClientElementId)
              || left.has(relation.targetClientElementId) && right.has(relation.sourceClientElementId)))));
        const targetCarriers = constituentGroups.map((group) => candidate.relations.filter((relation) =>
          group.has(relation.sourceClientElementId) && otherElementIds.has(relation.targetClientElementId)
          || group.has(relation.targetClientElementId) && otherElementIds.has(relation.sourceClientElementId)));
        if (comparisonCarriers.length === 0 || targetCarriers.some((relations) => relations.length === 0)) return [];
        return [...new Set([...comparisonCarriers, ...targetCarriers.flat()].map((relation) => relation.clientRelationId))].sort();
      };
      return [
        ...resolve(sourceFragment, inventoryRelation.targetInventoryItemId),
        ...resolve(targetFragment, inventoryRelation.sourceInventoryItemId),
      ];
    })();
    const unaryTransitionIds = relationSourceElements.size === 0 && relationTargetElements.size > 0
      ? unaryStateTransitionIds(candidate, sourceFragment)
      : relationTargetElements.size === 0 && relationSourceElements.size > 0
        ? unaryStateTransitionIds(candidate, targetFragment)
        : [];
    const mappedClientRelationIds = [...new Set([...coalescedElementIds, ...supersededEndpointIds, ...directlyMappedClientRelationIds, ...bridgedClientRelationIds, ...directComparisonFromIntentTargetIds, ...actionBridgeIds, ...framedFunctionalCarrierIds, ...compositeEndpointTopologyIds, ...unaryTransitionIds])].sort();
    return {
      inventoryRelationId: inventoryRelation.inventoryRelationId,
      sourceInventoryItemId: inventoryRelation.sourceInventoryItemId,
      targetInventoryItemId: inventoryRelation.targetInventoryItemId,
      normalizedRelation: inventoryRelation.normalizedRelation,
      mappedClientRelationIds,
      coverageStatus: mappedClientRelationIds.length ? "MAPPED" as const : "EXPLICIT_RELATION_UNMAPPED" as const,
      reason: mappedClientRelationIds.length
        ? supersededEndpointIds.length && directlyMappedClientRelationIds.length === 0
          ? "The prior explicit relation belongs to an element now explicitly negated and superseded by a correction; retaining it as an active affirmed relation would reverse the user's correction."
          : coalescedElementIds.length && directlyMappedClientRelationIds.length === 0
          ? "Both inventory fragments are explicitly preserved inside one typed Semantic Element; a redundant self-relation is not required."
          : framedFunctionalCarrierIds.length && directlyMappedClientRelationIds.length === 0
          ? "The framing intent-to-functional-operator construction is preserved by the source-grounded direct scientific relation between its explicit endpoints; a redundant relation-as-node edge is not required."
          : unaryTransitionIds.length && directlyMappedClientRelationIds.length === 0
          ? "The unary retain/add/remove construction is preserved by the explicit state transition of its uniquely linked scientific object; a redundant self-relation is forbidden."
          : compositeEndpointTopologyIds.length && directlyMappedClientRelationIds.length === 0
          ? "The composite comparison fragment is preserved by the comparison between all grounded constituents and their explicit relations to the shared scientific target."
          : (bridgedClientRelationIds.length || directComparisonFromIntentTargetIds.length || actionBridgeIds.length) && directlyMappedClientRelationIds.length === 0
          ? "The action spokes are semantically preserved by a direct explicit relation between their scientific endpoints."
          : inventorySpanExact
          ? "At least one direct Semantic Relation explicitly references this exact relational span."
          : "At least one direct Semantic Relation references the inventory relation; its exact endpoint spans remain source-grounded."
        : "The explicit relational construction has no mapped direct Semantic Relation between elements grounded to its inventory endpoints.",
    };
  });
  const targetTypes = new Set(["SCIENTIFIC_OBJECT", "ANATOMICAL_CONTEXT", "PHENOMENON", "BIOMARKER", "ENDPOINT", "OUTCOME"]);
  const toolTypes = new Set(["MODALITY", "METHOD"]);
  const structuralEntries = candidate.elements.filter((element) => element.type === "SCIENTIFIC_INTENT" || element.type === "OPERATION").flatMap((intent) => {
    const incident = candidate.relations.filter((relation) => relation.sourceClientElementId === intent.clientElementId || relation.targetClientElementId === intent.clientElementId);
    const neighborIds = new Set(incident.flatMap((relation) => relation.sourceClientElementId === intent.clientElementId ? [relation.targetClientElementId] : [relation.sourceClientElementId]));
    const targets = candidate.elements.filter((element) => neighborIds.has(element.clientElementId) && targetTypes.has(element.type));
    const tools = candidate.elements.filter((element) => neighborIds.has(element.clientElementId) && toolTypes.has(element.type));
    return tools.flatMap((tool) => targets.map((target) => {
      const mappedClientRelationIds = candidate.relations.filter((relation) => relation.sourceClientElementId === tool.clientElementId && relation.targetClientElementId === target.clientElementId
        || relation.sourceClientElementId === target.clientElementId && relation.targetClientElementId === tool.clientElementId).map((relation) => relation.clientRelationId).sort();
      return {
        inventoryRelationId: `structural:${intent.clientElementId}:${tool.clientElementId}:${target.clientElementId}`,
        sourceInventoryItemId: tool.inventoryItemIds[0] ?? `element:${tool.clientElementId}`,
        targetInventoryItemId: target.inventoryItemIds[0] ?? `element:${target.clientElementId}`,
        normalizedRelation: "DIRECT_SCIENTIFIC_RELATION_REQUIRED_FROM_INTENT_SPOKES",
        mappedClientRelationIds,
        coverageStatus: mappedClientRelationIds.length ? "MAPPED" as const : "EXPLICIT_RELATION_UNMAPPED" as const,
        reason: mappedClientRelationIds.length
          ? "The scientific tool/method and target connected through an intent also have a direct scientific relation."
          : "Intent/action spokes connect a scientific tool or modality and a target, but their direct scientific relation is absent.",
      };
    }));
  });
  const coordinatedScientificTypes = new Set(["SCIENTIFIC_OBJECT", "PHENOMENON", "BIOMARKER", "ENDPOINT", "OUTCOME"]);
  const inventoryCoordinationEntries = candidate.semanticInventory.explicitFragments.flatMap((hubFragment) => {
    const changeOrJointSubject = /change|evol|progress|follow|suivi|delta|variation|differen|compar/i.test(`${hubFragment.localRole} ${hubFragment.normalizedLabel}`);
    if (!changeOrJointSubject) return [];
    const incomingInventoryRelations = candidate.semanticInventory.explicitRelations.filter((relation) => relation.targetInventoryItemId === hubFragment.inventoryItemId);
    const sourceInventoryIds = [...new Set(incomingInventoryRelations.map((relation) => relation.sourceInventoryItemId))];
    const sourceElements = sourceInventoryIds.flatMap((inventoryItemId) => candidate.elements.filter((element) => coordinatedScientificTypes.has(element.type) && element.inventoryItemIds.includes(inventoryItemId)));
    return sourceElements.flatMap((source, index) => sourceElements.slice(index + 1).map((other) => {
      const mappedClientRelationIds = candidate.relations.filter((relation) => relation.sourceClientElementId === source.clientElementId && relation.targetClientElementId === other.clientElementId
        || relation.sourceClientElementId === other.clientElementId && relation.targetClientElementId === source.clientElementId).map((relation) => relation.clientRelationId).sort();
      const groundingRelationIds = incomingInventoryRelations.filter((relation) => [source.inventoryItemIds[0], other.inventoryItemIds[0]].includes(relation.sourceInventoryItemId)).map((relation) => relation.inventoryRelationId).sort();
      return {
        inventoryRelationId: `structural:inventory-coordinated:${source.clientElementId}:${other.clientElementId}`,
        sourceInventoryItemId: source.inventoryItemIds[0] ?? `element:${source.clientElementId}`,
        targetInventoryItemId: other.inventoryItemIds[0] ?? `element:${other.clientElementId}`,
        normalizedRelation: `DIRECT_RELATED_TO_REQUIRED_FOR_COORDINATED_SCIENTIFIC_SUBJECTS_GROUNDED_BY_${groundingRelationIds.join("+")}`,
        mappedClientRelationIds,
        coverageStatus: mappedClientRelationIds.length ? "MAPPED" as const : "EXPLICIT_RELATION_UNMAPPED" as const,
        reason: mappedClientRelationIds.length
          ? "Scientific subjects coordinated through the same explicit requested change/outcome retain a direct relationship."
          : "The inventory coordinates scientific subjects through the same requested change/outcome; their direct scientific relationship must be preserved even when the shared hub fragment is not yet classified.",
      };
    }));
  });
  const sharedHubEntries = candidate.elements.flatMap((hub) => {
    const changeLikeTiming = hub.type === "TIMING" && /evol|chang|progress|suivi|follow/i.test(`${hub.sourceText ?? ""} ${hub.canonicalMeaning}`);
    if (!["EXPECTED_DIRECTION", "SCIENTIFIC_INTENT", "OPERATION"].includes(hub.type) && !changeLikeTiming) return [];
    const incoming = candidate.relations.filter((relation) => relation.targetClientElementId === hub.clientElementId);
    const sources = candidate.elements.filter((element) => coordinatedScientificTypes.has(element.type) && incoming.some((relation) => relation.sourceClientElementId === element.clientElementId));
    return sources.flatMap((source, index) => sources.slice(index + 1).map((other) => {
      const mappedClientRelationIds = candidate.relations.filter((relation) => relation.sourceClientElementId === source.clientElementId && relation.targetClientElementId === other.clientElementId
        || relation.sourceClientElementId === other.clientElementId && relation.targetClientElementId === source.clientElementId).map((relation) => relation.clientRelationId).sort();
      const groundingRelationIds = incoming.filter((relation) => [source.clientElementId, other.clientElementId].includes(relation.sourceClientElementId)).flatMap((relation) => relation.inventoryRelationIds).sort();
      return {
        inventoryRelationId: `structural:coordinated:${source.clientElementId}:${other.clientElementId}`,
        sourceInventoryItemId: source.inventoryItemIds[0] ?? `element:${source.clientElementId}`,
        targetInventoryItemId: other.inventoryItemIds[0] ?? `element:${other.clientElementId}`,
        normalizedRelation: `DIRECT_RELATED_TO_REQUIRED_FOR_COORDINATED_SCIENTIFIC_SUBJECTS_GROUNDED_BY_${groundingRelationIds.join("+")}`,
        mappedClientRelationIds,
        coverageStatus: mappedClientRelationIds.length ? "MAPPED" as const : "EXPLICIT_RELATION_UNMAPPED" as const,
        reason: mappedClientRelationIds.length
          ? "Scientific subjects coordinated through the same requested change/outcome retain a direct relationship."
          : "Two scientific subjects are coordinated through the same explicit requested change/outcome, but their direct RELATED_TO relation is absent.",
      };
    }));
  });
  const aggregateComparisonEntries = candidate.relations.filter((relation) => relation.sourceClientElementId === relation.targetClientElementId && /compar|versus|oppos/i.test(relation.relationType)).flatMap((selfComparison) => {
    const aggregate = candidate.elements.find((element) => element.clientElementId === selfComparison.sourceClientElementId);
    if (!aggregate) return [];
    const measuredVariables = candidate.elements.filter((element) => ["BIOMARKER", "SCIENTIFIC_OBJECT", "OUTCOME", "ENDPOINT"].includes(element.type)
      && candidate.relations.some((relation) => relation.clientRelationId !== selfComparison.clientRelationId
        && [relation.sourceClientElementId, relation.targetClientElementId].includes(aggregate.clientElementId)
        && [relation.sourceClientElementId, relation.targetClientElementId].includes(element.clientElementId)));
    return measuredVariables.map((variable) => {
      const mappedClientRelationIds = candidate.relations.filter((relation) => relation.clientRelationId !== selfComparison.clientRelationId
        && /compar|across|intersite|inter.?scanner/i.test(relation.relationType)
        && [relation.sourceClientElementId, relation.targetClientElementId].includes(aggregate.clientElementId)
        && [relation.sourceClientElementId, relation.targetClientElementId].includes(variable.clientElementId)).map((relation) => relation.clientRelationId).sort();
      return {
        inventoryRelationId: `structural:aggregate-comparison:${variable.clientElementId}:${aggregate.clientElementId}`,
        sourceInventoryItemId: variable.inventoryItemIds[0] ?? `element:${variable.clientElementId}`,
        targetInventoryItemId: aggregate.inventoryItemIds[0] ?? `element:${aggregate.clientElementId}`,
        normalizedRelation: `COMPARED_ACROSS_REQUIRED_GROUNDED_BY_${[...selfComparison.inventoryRelationIds, ...candidate.relations.filter((relation) => [relation.sourceClientElementId, relation.targetClientElementId].includes(aggregate.clientElementId) && [relation.sourceClientElementId, relation.targetClientElementId].includes(variable.clientElementId)).flatMap((relation) => relation.inventoryRelationIds)].sort().join("+")}`,
        mappedClientRelationIds,
        coverageStatus: mappedClientRelationIds.length ? "MAPPED" as const : "EXPLICIT_RELATION_UNMAPPED" as const,
        reason: mappedClientRelationIds.length
          ? "The measured variable is directly compared across the aggregate comparator."
          : "An aggregate comparator cannot compare with itself; the measured variable needs a direct COMPARED_ACROSS relation to the aggregate.",
      };
    });
  });
  const entries = [...inventoryEntries, ...structuralEntries, ...inventoryCoordinationEntries, ...sharedHubEntries, ...aggregateComparisonEntries];
  return { status: entries.every((item) => item.coverageStatus === "MAPPED") ? "COMPLETE" : "INCOMPLETE", entries };
};

export const buildSemanticTaxonomyReport = (
  request: SemanticReconstructionRequest,
  candidate: SemanticReconstructionCandidate,
): SemanticTaxonomyReport => {
  const findings: SemanticTaxonomyReport["findings"] = [];
  const subordinateTechnique = (element: SemanticReconstructionCandidate["elements"][number]) => /mapping|radiomi|segment|perfusion|inspir|expir|dual.?energy|photon.?count|sequence|asl|dsc|lge|spectro|psma|fdg|amyloid|dotat|tracer|traceur/i
    .test(`${element.sourceText ?? ""} ${element.canonicalMeaning}`);
  const comparisonRelations = candidate.relations.filter((relation) => /compar|versus|oppos/i.test(relation.relationType));
  const comparisonElementIds = new Set(comparisonRelations.flatMap((relation) => [relation.sourceClientElementId, relation.targetClientElementId]));
  candidate.elements.forEach((element) => {
    const literal = element.sourceText?.trim() ?? "";
    const normalizedLiteral = literal.toLocaleLowerCase("fr-FR").normalize("NFD").replace(/\p{Diacritic}/gu, "");
    const sourceMessage = request.messages.find((message) => message.role === "USER" && message.messageId === element.sourceMessageId);
    const normalizedMessage = sourceMessage?.content.toLocaleLowerCase("fr-FR").normalize("NFD").replace(/\p{Diacritic}/gu, "") ?? "";
    const inventoryRoles = candidate.semanticInventory.explicitFragments.filter((fragment) => element.inventoryItemIds.includes(fragment.inventoryItemId)).map((fragment) => fragment.localRole.toLocaleLowerCase("fr-FR"));
    const incomingModification = candidate.relations.some((relation) => {
      if (relation.targetClientElementId !== element.clientElementId || !/influenc|modif|aims.?to.?modify|redu|chang/i.test(relation.relationType)) return false;
      const sourceElement = candidate.elements.find((candidateElement) => candidateElement.clientElementId === relation.sourceClientElementId);
      const inventoryRelationText = candidate.semanticInventory.explicitRelations
        .filter((inventoryRelation) => relation.inventoryRelationIds.includes(inventoryRelation.inventoryRelationId))
        .map((inventoryRelation) => inventoryRelation.sourceText)
        .join(" ");
      const groundedAction = `${sourceElement?.sourceText ?? ""} ${sourceElement?.canonicalMeaning ?? ""} ${inventoryRelationText}`
        .toLocaleLowerCase("fr-FR").normalize("NFD").replace(/\p{Diacritic}/gu, "");
      return !/\b(?:suiv\w*|follow\w*|monitor\w*|observ\w*|mesur\w*|quantif\w*|evalu\w*|assess\w*)\b/i.test(groundedAction);
    });
    const directlyMeasured = candidate.relations.some((relation) => relation.sourceClientElementId === element.clientElementId && /measured.?by|observed.?by|quantif/i.test(relation.relationType));
    const usedAsQuantitativeObservable = relationUsesElementAsQuantitativeObservable(candidate, element.clientElementId);
    const explicitEndpointSelection = normalizedLiteral.length > 0
      && normalizedMessage.includes(normalizedLiteral)
      && /(?:doit|devrait|shall|should|must)\s+(?:compter|count)|(?:retenu|retenue|selected|chosen)\s+(?:comme|as)\s+(?:critere|endpoint)|(?:critere|endpoint)\s+(?:principal|primary)/i.test(normalizedMessage);
    const comparedArms = candidate.elements.filter((item) => ["INTERVENTION_ARM", "COMPARATOR_ARM"].includes(item.studyRole));
    const comparedArmIds = new Set(comparedArms.map((item) => item.clientElementId));
    const directArmComparison = comparisonRelations.some((relation) => comparedArmIds.has(relation.sourceClientElementId) && comparedArmIds.has(relation.targetClientElementId));
    const armStarts = comparedArms.flatMap((item) => item.sourceMessageId === element.sourceMessageId && item.sourceText ? [normalizedMessage.indexOf(normalizedTaxonomyText(item.sourceText))] : []).filter((index) => index >= 0);
    const intentStarts = candidate.elements.filter((item) => ["SCIENTIFIC_INTENT", "OPERATION"].includes(item.type) && item.sourceMessageId === element.sourceMessageId && item.sourceText)
      .map((item) => normalizedMessage.indexOf(normalizedTaxonomyText(item.sourceText!))).filter((index) => index >= 0);
    const elementStart = normalizedLiteral ? normalizedMessage.indexOf(normalizedLiteral) : -1;
    const unambiguouslyPlacedAsArmJudgingVariable = directArmComparison && armStarts.length > 1 && intentStarts.length > 0
      && elementStart > Math.min(...intentStarts) && elementStart < Math.min(...armStarts);
    const supersedesPriorEndpoint = element.supersedesElementIds.some((semanticElementId) => request.previousModel?.elements.some((prior) => prior.semanticElementId === semanticElementId && prior.type === "ENDPOINT"));
    const endpointSelectionClause = sourceMessage?.content.match(/(?:mais|but)\s+(?:c['’]est|it is)?\s*([^.;!?]+?)\s+(?:plut[oô]t que|rather than)\s+([^.;!?]+)/i);
    const selectedClauseText = endpointSelectionClause?.[1] ? normalizedTaxonomyText(endpointSelectionClause[1]) : null;
    const selectedAsJudgingVariable = ["BIOMARKER", "OUTCOME", "SCIENTIFIC_OBJECT"].includes(element.type) && explicitEndpointSelection
      && (!selectedClauseText || normalizedLiteral.includes(selectedClauseText) || selectedClauseText.includes(normalizedLiteral));
    if (selectedAsJudgingVariable) findings.push({
      code: "SELECTED_JUDGING_VARIABLE_NOT_ENDPOINT",
      clientElementId: element.clientElementId,
      currentType: element.type,
      expectedType: "ENDPOINT",
      expectedStudyRole: "OUTCOME_ROLE",
      reason: "A variable explicitly selected as what must count to judge the study is an ENDPOINT role in this context; its underlying observable nature must not erase that expressed project role.",
    });
    const outcomeLikeInventoryRole = inventoryRoles.some((role) => /outcome|result|response|resultat|reponse/.test(normalizedTaxonomyText(role)));
    const resultContextOfArmComparison = directArmComparison
      && !comparisonElementIds.has(element.clientElementId)
      && candidate.relations.some((relation) => comparedArmIds.has(relation.sourceClientElementId)
        && relation.targetClientElementId === element.clientElementId
        && /observ|evaluat|measur|quantif|assess/i.test(relation.relationType));
    if (element.type === "ENDPOINT" && element.epistemicStatus === "EXPLICIT_USER_STATED" && element.studyRole === "OUTCOME_ROLE"
      && (outcomeLikeInventoryRole || resultContextOfArmComparison) && !explicitEndpointSelection && !unambiguouslyPlacedAsArmJudgingVariable && !supersedesPriorEndpoint) findings.push({
      code: "UNSUPPORTED_OUTCOME_ENDPOINT_PROMOTION",
      clientElementId: element.clientElementId,
      currentType: element.type,
      expectedType: "OUTCOME",
      expectedStudyRole: "OUTCOME_ROLE",
      reason: "A result mentioned while methods, modalities or other study components are compared remains OUTCOME unless the user explicitly selects it as the criterion by which the comparison or objective will be judged.",
    });
    const settingOnly = /^(?:(?:un|une|deux|trois|quatre|plusieurs|multiple|one|two|three|four|several|\d+)\s+)?(?:sites?|centres?|centers?|hopitaux|hospitals?|cliniques?|clinics?|institutions?|laboratoires?|laboratories)$/i.test(normalizedLiteral);
    if (element.type === "POPULATION" && settingOnly) findings.push({
      code: "STUDY_SETTING_TYPED_AS_POPULATION",
      clientElementId: element.clientElementId,
      currentType: element.type,
      expectedType: "STUDY_DESIGN",
      expectedStudyRole: "NONE",
      reason: "A count or set of sites, centres or institutions describes the study setting/design; it is not the participant population unless people are explicitly named.",
    });
    const comparatorNotChosen = element.type === "COMPARATOR"
      && /(?:pas|non|not)\s+(?:encore\s+)?(?:choisi|choisie|selectionne|selectionnee|selected|chosen)|(?:a|to)\s+(?:definir|choose|select)|(?:indefini|undetermined|unknown)/i.test(`${normalizedLiteral} ${normalizedTaxonomyText(element.canonicalMeaning)}`);
    if (comparatorNotChosen) findings.push({
      code: "UNSELECTED_COMPARATOR_NOT_UNKNOWN",
      clientElementId: element.clientElementId,
      currentType: element.type,
      expectedType: "UNKNOWN",
      expectedStudyRole: "COMPARATOR_ARM",
      expectedPolarity: "UNCERTAIN",
      reason: "An explicitly unselected comparator is a known missing choice, not an affirmed or negated comparator entity; preserve its future comparator role as UNKNOWN and its uncertainty.",
    });
    const participantCollective = element.type === "CONDITION"
      && /\b(?:patients?|participants?|subjects?|personnes?|volontaires?)\b/i.test(normalizedLiteral);
    if (participantCollective) findings.push({
      code: "PARTICIPANT_GROUP_TYPED_AS_CONDITION",
      clientElementId: element.clientElementId,
      currentType: element.type,
      expectedType: "POPULATION",
      expectedStudyRole: "SUBJECT",
      reason: "When the phrase denotes people included through a condition, the expressed object is the participant POPULATION; the condition may remain separately represented only if its own source span is explicit.",
    });
    if (element.type === "METHOD" && ["INTERVENTION_ARM", "COMPARATOR_ARM"].includes(element.studyRole)
      && candidate.relations.some((relation) => relation.sourceClientElementId === element.clientElementId && /influenc|modif|aims.?to.?modify|chang/i.test(relation.relationType))) findings.push({
      code: "INTERVENTION_ROLE_TYPED_AS_METHOD", clientElementId: element.clientElementId, currentType: element.type, expectedType: "INTERVENTION", expectedStudyRole: element.studyRole,
      reason: "A technical process explicitly installed as a study arm to modify or compare a result retains semantic type INTERVENTION; its arm role does not erase its action nature.",
    });
    if (["BIOMARKER", "SCIENTIFIC_OBJECT", "PHENOMENON"].includes(element.type) && element.studyRole === "OUTCOME_ROLE" && incomingModification) findings.push({
      code: "MODIFICATION_TARGET_NOT_OUTCOME", clientElementId: element.clientElementId, currentType: element.type, expectedType: "OUTCOME", expectedStudyRole: "OUTCOME_ROLE",
      reason: "The explicit result targeted for modification by the studied action is an OUTCOME, without promoting it to a formal ENDPOINT.",
    });
    if (element.type === "PHENOMENON" && inventoryRoles.some((role) => /target|subject|objet|cible/.test(role)) && directlyMeasured && !/evol|chang|progress|mechanis|process/i.test(normalizedLiteral)) findings.push({
      code: "MEASURED_TARGET_TYPED_AS_PHENOMENON", clientElementId: element.clientElementId, currentType: element.type, expectedType: "SCIENTIFIC_OBJECT", expectedStudyRole: element.studyRole,
      reason: "The phrase is used as the named target of direct observation or measurement, not as a process whose mechanism is being explained.",
    });
    const quantitativeShortLabel = /^[A-Za-zÀ-ÖØ-öø-ÿ]\d(?:[A-Za-zÀ-ÖØ-öø-ÿ0-9*+-]*)$/u.test(literal);
    if (element.type === "METHOD" && quantitativeShortLabel && comparisonElementIds.has(element.clientElementId)) findings.push({
      code: "QUANTITATIVE_COMPARAND_TYPED_AS_METHOD",
      clientElementId: element.clientElementId,
      currentType: element.type,
      expectedType: "BIOMARKER",
      expectedStudyRole: element.studyRole,
      reason: "A short alphanumeric quantitative parameter is itself compared without explicit sequence, acquisition or procedure wording; the operational precedence requires BIOMARKER.",
    });
    if (element.type === "METHOD" && element.studyRole === "MEASUREMENT" && usedAsQuantitativeObservable && !explicitlyNamesProductionMethod(element)) findings.push({
      code: "QUANTITATIVE_COMPARAND_TYPED_AS_METHOD",
      clientElementId: element.clientElementId,
      currentType: element.type,
      expectedType: "BIOMARKER",
      expectedStudyRole: element.studyRole,
      reason: "The explicit phrase functions as the quantitative observable or predictor in the stated relation and does not name the procedure that produces it; the runtime SEM contract requires BIOMARKER while preserving the relation and source span.",
    });
    const explicitImagingFamily = /^(?:le |la |l'|les )?(?:ct|tdm|irm|mri|scanner|pet|tep|radiographie|radio|echographie|ultrasound)\b/i.test(normalizedLiteral);
    const techniqueQualifier = subordinateTechnique(element);
    if (element.type === "METHOD" && explicitImagingFamily && !techniqueQualifier) findings.push({
      code: "IMAGING_FAMILY_TYPED_AS_METHOD", clientElementId: element.clientElementId, currentType: element.type, expectedType: "MODALITY", expectedStudyRole: element.studyRole,
      reason: "The exact source names a broad imaging family without a sequence, acquisition or processing qualifier; the operational taxonomy requires MODALITY.",
    });
    if (element.type === "METHOD" && /^\d(?:[,.]\d+)?\s*t$/i.test(normalizedLiteral)) findings.push({
      code: "FIELD_STRENGTH_TYPED_AS_METHOD", clientElementId: element.clientElementId, currentType: element.type, expectedType: "CONSTRAINT", expectedStudyRole: "NONE",
      reason: "A field-strength value bounds acquisition context and is a CONSTRAINT, not a method.",
    });
    if (element.type === "BIOMARKER" && /mapping|radiomi|segment|sequence|acquisition|analyse|analysis/i.test(normalizedLiteral)) findings.push({
      code: "MAPPING_TECHNIQUE_TYPED_AS_BIOMARKER", clientElementId: element.clientElementId, currentType: element.type, expectedType: "METHOD", expectedStudyRole: "MEASUREMENT",
      reason: "The exact phrase denotes a mapping, acquisition or analysis technique that produces information; the operational taxonomy requires METHOD.",
    });
    const atMessageStart = request.messages.some((message) => message.role === "USER" && element.sourceMessageId === message.messageId && element.sourceText && message.content.trimStart().startsWith(element.sourceText));
    const governedByExplicitIntent = candidate.semanticInventory.explicitRelations.some((relation) => element.inventoryItemIds.includes(relation.targetInventoryItemId)
      && candidate.elements.some((source) => source.inventoryItemIds.includes(relation.sourceInventoryItemId) && ["SCIENTIFIC_INTENT", "OPERATION"].includes(source.type)));
    if (["OUTCOME", "BIOMARKER", "SCIENTIFIC_OBJECT"].includes(element.type) && (atMessageStart || governedByExplicitIntent) && /reproductib|repeatab|repetabil|validation|harmonis/i.test(normalizedLiteral)) findings.push({
      code: "METHODOLOGICAL_OBJECTIVE_TYPED_AS_OUTCOME", clientElementId: element.clientElementId, currentType: element.type, expectedType: "SCIENTIFIC_INTENT", expectedStudyRole: "NONE",
      reason: "A sentence-leading methodological property governing the requested work is the scientific intent, not an observed result.",
    });
    const explicitQuantitativeMarker = /index|indice|fraction|volume|diamet|taux|rate|ratio|concentration|score|coefficient|ecv|adc|t1|t2|oef|cmro|cbf|cbv/i.test(`${normalizedLiteral} ${element.canonicalMeaning}`);
    const explicitlyStudiedTarget = directlyMeasured || governedByExplicitIntent || element.studyRole === "SUBJECT";
    if (element.type === "BIOMARKER" && !incomingModification && explicitlyStudiedTarget && inventoryRoles.some((role) => /target|subject|objet|cible|outcome|result|phenomen/.test(role)) && !explicitQuantitativeMarker) findings.push({
      code: "TARGET_TYPED_AS_BIOMARKER", clientElementId: element.clientElementId, currentType: element.type, expectedType: "SCIENTIFIC_OBJECT", expectedStudyRole: element.studyRole,
      reason: "The inventory and relational role identify this phrase as the studied material/physiological target itself and no quantitative value, index or parameter is expressed; the operational taxonomy requires SCIENTIFIC_OBJECT.",
    });
    const aggregateComparator = /^(?:deux|trois|plusieurs|multiple|two|three|multiple)\b/i.test(normalizedLiteral)
      && candidate.relations.some((relation) => relation.sourceClientElementId === element.clientElementId && relation.targetClientElementId === element.clientElementId && /compar|versus|oppos/i.test(relation.relationType));
    if (aggregateComparator && element.studyRole !== "COMPARATOR_ARM") findings.push({
      code: "AGGREGATE_COMPARATOR_ROLE_MISSING", clientElementId: element.clientElementId, currentType: element.type, expectedType: element.type, expectedStudyRole: "COMPARATOR_ARM",
      reason: "The explicit aggregate is the comparison context and must preserve COMPARATOR_ARM even though its ontological type remains unchanged.",
    });
    const hasConcreteTimingMarker = /\d|jour|mois|an|heure|avant|apres|baseline|follow.?up|week|month|year|day/i.test(normalizedLiteral);
    if (["TIMING", "PHENOMENON"].includes(element.type) && /\b(?:evol\w*|chang\w*|progression|suivi|follow\w*)\b/i.test(normalizedLiteral) && !hasConcreteTimingMarker) findings.push({
      code: "CHANGE_REQUEST_TYPED_AS_TIMING", clientElementId: element.clientElementId, currentType: element.type, expectedType: "SCIENTIFIC_INTENT", expectedStudyRole: "NONE",
      reason: "A bare request for evolution/change without a time point or interval is the scientific intent, not a timing value.",
    });
  });

  const broadFamilyCanonical = (element: SemanticReconstructionCandidate["elements"][number]) => /\bct\b|\bmri\b|computed tomography|magnetic resonance imaging|tomodensitometr|radiograph|ultrasound|echograph/i.test(element.canonicalMeaning);
  const modalityCandidates = new Set(candidate.elements.filter((element) => element.type === "MODALITY" || findings.some((finding) => finding.clientElementId === element.clientElementId && finding.expectedType === "MODALITY")).map((element) => element.clientElementId));
  comparisonRelations.forEach((relation) => {
    const source = candidate.elements.find((element) => element.clientElementId === relation.sourceClientElementId);
    const target = candidate.elements.find((element) => element.clientElementId === relation.targetClientElementId);
    if (!source || !target) return;
    for (const [candidateElement, counterpart] of [[source, target], [target, source]] as const) {
      if (candidateElement.type === "METHOD" && broadFamilyCanonical(candidateElement) && !subordinateTechnique(candidateElement) && modalityCandidates.has(counterpart.clientElementId)
        && !findings.some((finding) => finding.clientElementId === candidateElement.clientElementId)) findings.push({
        code: "IMAGING_FAMILY_TYPED_AS_METHOD", clientElementId: candidateElement.clientElementId, currentType: candidateElement.type, expectedType: "MODALITY", expectedStudyRole: candidateElement.studyRole,
        reason: "This compared element denotes a whole imaging family and its counterpart is a modality; no source qualifier identifies a subordinate technique.",
      });
    }
  });

  const comparedArms = candidate.elements.filter((element) => ["INTERVENTION_ARM", "COMPARATOR_ARM"].includes(element.studyRole));
  const armIds = new Set(comparedArms.map((element) => element.clientElementId));
  const directArmComparison = comparisonRelations.some((relation) => armIds.has(relation.sourceClientElementId) && armIds.has(relation.targetClientElementId));
  if (comparedArms.length >= 2 && directArmComparison) {
    for (const message of request.messages.filter((item) => item.role === "USER")) {
      const armStarts = comparedArms.flatMap((element) => element.sourceMessageId === message.messageId && element.sourceText ? [message.content.indexOf(element.sourceText)] : []).filter((index) => index >= 0);
      const intentStarts = candidate.elements.filter((element) => ["SCIENTIFIC_INTENT", "OPERATION"].includes(element.type) && element.sourceMessageId === message.messageId && element.sourceText)
        .map((element) => message.content.indexOf(element.sourceText!)).filter((index) => index >= 0);
      if (!armStarts.length || !intentStarts.length) continue;
      const firstArm = Math.min(...armStarts);
      const firstIntent = Math.min(...intentStarts);
      candidate.elements.filter((element) => ["BIOMARKER", "OUTCOME"].includes(element.type) && element.sourceMessageId === message.messageId && element.sourceText).forEach((element) => {
        const variableStart = message.content.indexOf(element.sourceText!);
        if (variableStart > firstIntent && variableStart < firstArm) findings.push({
          code: "ARM_JUDGING_VARIABLE_NOT_ENDPOINT",
          clientElementId: element.clientElementId,
          currentType: element.type,
          expectedType: "ENDPOINT",
          expectedStudyRole: "OUTCOME_ROLE",
          reason: "The explicit variable is placed as the variable being compared before two explicit study arms; the operational precedence requires ENDPOINT with OUTCOME_ROLE.",
        });
      });
    }
  }
  return { status: findings.length ? "INCOMPLETE" : "COMPLETE", findings };
};

export const buildSemanticCoverage = (request: SemanticReconstructionRequest, candidate: SemanticReconstructionCandidate) => ({
  explicit: buildExplicitCoverageReport(request, candidate),
  relations: buildRelationCoverageReport(request, candidate),
  taxonomy: buildSemanticTaxonomyReport(request, candidate),
  integrity: buildSemanticIntegrityReport(request, candidate),
});

const repairPayloadMatchesAction = (repair: SemanticCriticRepair) => {
  const hasElement = Boolean(repair.elementClientElementId);
  const hasRelation = Boolean(repair.relationClientRelationId);
  const hasRoute = Boolean(repair.route);
  const hasInventoryItem = Boolean(repair.inventoryItemId);
  const hasInventoryRelation = Boolean(repair.inventoryRelationId);
  if (repair.action === "UPSERT_INVENTORY_FRAGMENT") return hasInventoryItem && !hasInventoryRelation && !hasElement && !hasRelation && !repair.ambiguity && !hasRoute;
  if (repair.action === "UPSERT_INVENTORY_RELATION") return hasInventoryRelation && !hasInventoryItem && !hasElement && !hasRelation && !repair.ambiguity && !hasRoute;
  if (repair.action === "UPSERT_ELEMENT") return hasElement && !hasRelation && !repair.ambiguity && !hasRoute;
  if (repair.action === "UPSERT_RELATION") return hasRelation && !hasElement && !repair.ambiguity && !hasRoute;
  if (repair.action === "ADD_AMBIGUITY") return Boolean(repair.ambiguity) && !hasElement && !hasRelation && !hasRoute;
  return hasRoute && !hasElement && !hasRelation && !repair.ambiguity;
};

export type CriticRepairDiagnostic = {
  repairId: string;
  status: "ACCEPTED" | "REJECTED";
  reason: string;
};

export const applyCriticRepairs = (
  request: SemanticReconstructionRequest,
  candidate: SemanticReconstructionCandidate,
  repairs: SemanticCriticRepair[],
): { candidate: SemanticReconstructionCandidate; diagnostics: CriticRepairDiagnostic[] } => {
  const knownInventoryItems = new Set(candidate.semanticInventory.explicitFragments.map((item) => item.inventoryItemId));
  const knownInventoryRelations = new Set(candidate.semanticInventory.explicitRelations.map((item) => item.inventoryRelationId));
  let repaired: SemanticReconstructionCandidate = structuredClone(candidate);
  const diagnostics: CriticRepairDiagnostic[] = [];

  for (const repair of repairs) {
    const reject = (reason: string) => diagnostics.push({ repairId: repair.repairId, status: "REJECTED", reason });
    if (!repairPayloadMatchesAction(repair)) { reject("REPAIR_ACTION_PAYLOAD_MISMATCH"); continue; }
    if (repair.sourceInventoryItemIds.some((id) => !knownInventoryItems.has(id)) || repair.sourceInventoryRelationIds.some((id) => !knownInventoryRelations.has(id))) {
      reject("REPAIR_SOURCE_INVENTORY_UNKNOWN"); continue;
    }

    const beforeRepair = structuredClone(repaired);
    if (repair.action === "UPSERT_INVENTORY_FRAGMENT") {
      if (!repair.inventoryItemId || !repair.inventorySourceMessageId || !repair.inventorySourceText || !repair.inventoryNormalizedLabel || !repair.inventoryLocalRole || !repair.inventoryPolarity) {
        reject("REPAIR_ACTION_PAYLOAD_INCOMPLETE"); continue;
      }
      if (!exactUserSpan(request, repair.inventorySourceMessageId, repair.inventorySourceText)) {
        reject("INVENTORY_FRAGMENT_REPAIR_NOT_SOURCE_GROUNDED"); continue;
      }
      const linkedInventoryItemIds = repair.inventoryLinkedItemIds ?? [];
      if (linkedInventoryItemIds.some((id) => !knownInventoryItems.has(id))) {
        reject("INVENTORY_FRAGMENT_LINK_UNKNOWN"); continue;
      }
      const fragment = {
        inventoryItemId: repair.inventoryItemId,
        sourceMessageId: repair.inventorySourceMessageId,
        sourceText: repair.inventorySourceText,
        normalizedLabel: repair.inventoryNormalizedLabel,
        localRole: repair.inventoryLocalRole,
        polarity: repair.inventoryPolarity,
        modifiers: repair.inventoryModifiers ?? [],
        linkedInventoryItemIds,
      };
      repaired.semanticInventory.explicitFragments = [
        ...repaired.semanticInventory.explicitFragments.filter((item) => item.inventoryItemId !== fragment.inventoryItemId),
        fragment,
      ];
      knownInventoryItems.add(fragment.inventoryItemId);
    } else if (repair.action === "UPSERT_INVENTORY_RELATION") {
      if (!repair.inventoryRelationId || !repair.inventoryRelationSourceItemId || !repair.inventoryRelationTargetItemId || !repair.inventoryRelationSourceMessageId || !repair.inventoryRelationSourceText || !repair.inventoryNormalizedRelation || !repair.inventoryRelationPolarity) {
        reject("REPAIR_ACTION_PAYLOAD_INCOMPLETE"); continue;
      }
      if (!knownInventoryItems.has(repair.inventoryRelationSourceItemId) || !knownInventoryItems.has(repair.inventoryRelationTargetItemId)) {
        reject("INVENTORY_RELATION_ENDPOINT_UNKNOWN"); continue;
      }
      if (!exactUserSpan(request, repair.inventoryRelationSourceMessageId, repair.inventoryRelationSourceText)) {
        reject("INVENTORY_RELATION_REPAIR_NOT_SOURCE_GROUNDED"); continue;
      }
      const relation = {
        inventoryRelationId: repair.inventoryRelationId,
        sourceInventoryItemId: repair.inventoryRelationSourceItemId,
        targetInventoryItemId: repair.inventoryRelationTargetItemId,
        sourceMessageId: repair.inventoryRelationSourceMessageId,
        sourceText: repair.inventoryRelationSourceText,
        normalizedRelation: repair.inventoryNormalizedRelation,
        polarity: repair.inventoryRelationPolarity,
      };
      repaired.semanticInventory.explicitRelations = [
        ...repaired.semanticInventory.explicitRelations.filter((item) => item.inventoryRelationId !== relation.inventoryRelationId),
        relation,
      ];
      knownInventoryRelations.add(relation.inventoryRelationId);
    } else if (repair.action === "UPSERT_ELEMENT") {
      if (!repair.elementClientElementId || !repair.elementType || !repair.elementCanonicalMeaning || !repair.elementStudyRole || !repair.elementPolarity || !repair.elementEpistemicStatus || repair.elementConfidence === null || repair.elementRequiresConfirmation === null) {
        reject("REPAIR_ACTION_PAYLOAD_INCOMPLETE"); continue;
      }
      const element = {
        clientElementId: repair.elementClientElementId,
        type: repair.elementType,
        canonicalMeaning: repair.elementCanonicalMeaning,
        studyRole: repair.elementStudyRole,
        polarity: repair.elementPolarity,
        inventoryItemIds: repair.elementInventoryItemIds,
        sourceMessageId: repair.elementSourceMessageId,
        sourceText: repair.elementSourceText,
        epistemicStatus: repair.elementEpistemicStatus,
        confidence: repair.elementConfidence,
        inferenceReason: repair.elementInferenceReason,
        requiresConfirmation: repair.elementRequiresConfirmation,
        supersedesElementIds: repair.elementSupersedesElementIds,
      };
      const sourceGrounded = element.epistemicStatus !== "EXPLICIT_USER_STATED" || Boolean(
        element.sourceMessageId
        && element.sourceText
        && exactUserSpan(request, element.sourceMessageId, element.sourceText)
        && element.inventoryItemIds.length
        && element.inventoryItemIds.every((id) => repair.sourceInventoryItemIds.includes(id)),
      );
      if (!sourceGrounded) { reject("ELEMENT_REPAIR_NOT_SOURCE_GROUNDED"); continue; }
      repaired.elements = [...repaired.elements.filter((item) => item.clientElementId !== element.clientElementId), element];
    } else if (repair.action === "UPSERT_RELATION") {
      if (!repair.relationClientRelationId || !repair.relationSourceClientElementId || !repair.relationTargetClientElementId || !repair.relationType || !repair.relationPolarity || !repair.relationEpistemicStatus || repair.relationConfidence === null || repair.relationRequiresConfirmation === null) {
        reject("REPAIR_ACTION_PAYLOAD_INCOMPLETE"); continue;
      }
      const relation = {
        clientRelationId: repair.relationClientRelationId,
        sourceClientElementId: repair.relationSourceClientElementId,
        targetClientElementId: repair.relationTargetClientElementId,
        relationType: repair.relationType,
        polarity: repair.relationPolarity,
        inventoryRelationIds: repair.relationInventoryRelationIds,
        epistemicStatus: repair.relationEpistemicStatus,
        confidence: repair.relationConfidence,
        inferenceReason: repair.relationInferenceReason,
        requiresConfirmation: repair.relationRequiresConfirmation,
      };
      const endpoints = new Set(repaired.elements.map((item) => item.clientElementId));
      if (!endpoints.has(relation.sourceClientElementId) || !endpoints.has(relation.targetClientElementId)) { reject("RELATION_REPAIR_ENDPOINT_UNKNOWN"); continue; }
      const sourceGrounded = relation.epistemicStatus !== "EXPLICIT_USER_STATED" || Boolean(
        relation.inventoryRelationIds.length
        && relation.inventoryRelationIds.every((id) => repair.sourceInventoryRelationIds.includes(id)),
      );
      if (!sourceGrounded) { reject("RELATION_REPAIR_NOT_SOURCE_GROUNDED"); continue; }
      repaired.relations = [...repaired.relations.filter((item) => item.clientRelationId !== relation.clientRelationId), relation];
    } else if (repair.action === "ADD_AMBIGUITY" && repair.ambiguity) {
      repaired.ambiguities = [...new Set([...repaired.ambiguities, repair.ambiguity])];
    } else if (repair.action === "SET_ROUTE") {
      if (!repair.route || repair.routeConfidence === null || !repair.routeReason) {
        reject("REPAIR_ACTION_PAYLOAD_INCOMPLETE"); continue;
      }
      repaired.routeProposal = { route: repair.route, confidence: repair.routeConfidence, reason: repair.routeReason, expectedCapabilities: repair.routeExpectedCapabilities };
    }

    try {
      repaired = parseSemanticReconstructionCandidate(repaired);
      diagnostics.push({ repairId: repair.repairId, status: "ACCEPTED", reason: "SCHEMA_AND_SOURCE_GROUNDING_PASSED" });
    } catch {
      repaired = beforeRepair;
      reject("REPAIRED_CANDIDATE_SCHEMA_INVALID");
    }
  }

  return { candidate: stabilizeRelationOwnership(repaired).candidate, diagnostics };
};

export const criticAcceptIsConsistent = (
  critic: SemanticCriticResult,
  coverage: ReturnType<typeof buildSemanticCoverage>,
) => critic.verdict !== "ACCEPT" || (
  critic.checklist.every((item) => item.result !== "FAIL")
  && critic.missingExplicitSourceFragments.length === 0
  && !critic.issues.some((item) => item.severity === "CRITICAL" && !item.resolved)
  && coverage.explicit.status === "COMPLETE"
  && coverage.relations.status === "COMPLETE"
  && coverage.taxonomy.status === "COMPLETE"
  && coverage.integrity.status === "COMPLETE"
);

export type SemanticCriticCycleResult = {
  candidate: SemanticReconstructionCandidate;
  critics: SemanticCriticResult[];
  callIds: string[];
  attempts: SemanticProviderAttempt[];
  cycleAttempts: SemanticProviderAttempt[][];
  repairDiagnostics: CriticRepairDiagnostic[];
  accepted: boolean;
  terminalReason: string;
};

export const runSemanticCriticCycles = async (
  provider: ScientificSemanticProvider,
  request: SemanticReconstructionRequest,
  initialCandidate: SemanticReconstructionCandidate,
): Promise<SemanticCriticCycleResult> => {
  let candidate = stabilizeRelationOwnership(preserveContextualMeasurementAmbiguities(request, initialCandidate)).candidate;
  const critics: SemanticCriticResult[] = [];
  const callIds: string[] = [];
  const attempts: SemanticProviderAttempt[] = [];
  const cycleAttempts: SemanticProviderAttempt[][] = [];
  const repairDiagnostics: CriticRepairDiagnostic[] = [];

  for (const cycle of [1, 2] as const) {
    const coverage = buildSemanticCoverage(request, candidate);
    const result = await provider.critique(request, candidate, { ...coverage, cycle });
    critics.push(result.critic);
    callIds.push(result.callId);
    const currentAttempts = result.attempts ?? [];
    cycleAttempts.push(currentAttempts);
    attempts.push(...currentAttempts);

    if (result.critic.verdict === "ACCEPT" && criticAcceptIsConsistent(result.critic, coverage)) {
      return { candidate, critics, callIds, attempts, cycleAttempts, repairDiagnostics, accepted: true, terminalReason: "CRITIC_ACCEPTED_AFTER_COMPLETE_AUDIT" };
    }
    if (result.critic.verdict === "CLARIFICATION_REQUIRED") {
      return { candidate, critics, callIds, attempts, cycleAttempts, repairDiagnostics, accepted: false, terminalReason: "CRITIC_CLARIFICATION_REQUIRED" };
    }
    if (result.critic.verdict !== "REVISE") {
      return { candidate, critics, callIds, attempts, cycleAttempts, repairDiagnostics, accepted: false, terminalReason: "CRITIC_ACCEPT_INCONSISTENT_WITH_COVERAGE" };
    }

    const beforeRepair = JSON.stringify(candidate);
    const repaired = applyCriticRepairs(request, candidate, result.critic.proposedRepairs);
    candidate = repaired.candidate;
    repairDiagnostics.push(...repaired.diagnostics);
    if (!repaired.diagnostics.some((item) => item.status === "ACCEPTED")) {
      return { candidate, critics, callIds, attempts, cycleAttempts, repairDiagnostics, accepted: false, terminalReason: "CRITIC_REPAIR_REJECTED" };
    }
    if (cycle === 2) {
      const postRepairCoverage = buildSemanticCoverage(request, candidate);
      const deterministicFailureChecks = new Set([
        "EVERY_EXPLICIT_OBJECT_REPRESENTED",
        "EVERY_COMPARATOR_REPRESENTED",
        "EVERY_INTERVENTION_REPRESENTED",
        "EVERY_MODALITY_REPRESENTED",
        "EVERY_EXPLICIT_RELATION_REPRESENTED",
        "NO_INCOMPATIBLE_OBJECT_TYPE",
        "NO_EXPLICIT_RELATION_WEAKENED",
        "NO_TIMING_LOST",
        "NO_UNSUPPORTED_OUTCOME_ENDPOINT_PROMOTION",
        "NO_IMPORTANT_FRAGMENT_UNREPRESENTED",
      ]);
      const onlyDeterministicallyAuditableFailures = result.critic.checklist.filter((item) => item.result === "FAIL").every((item) => deterministicFailureChecks.has(item.check));
      const allRepairsAccepted = repaired.diagnostics.every((item) => item.status === "ACCEPTED");
      const madeMaterialProgress = beforeRepair !== JSON.stringify(candidate);
      if (onlyDeterministicallyAuditableFailures && allRepairsAccepted && madeMaterialProgress
        && postRepairCoverage.explicit.status === "COMPLETE"
        && postRepairCoverage.relations.status === "COMPLETE"
        && postRepairCoverage.taxonomy.status === "COMPLETE"
        && postRepairCoverage.integrity.status === "COMPLETE") {
        return { candidate, critics, callIds, attempts, cycleAttempts, repairDiagnostics, accepted: true, terminalReason: "CRITIC_SECOND_REPAIR_DETERMINISTIC_AUDIT_PASSED" };
      }
    }
  }

  return { candidate, critics, callIds, attempts, cycleAttempts, repairDiagnostics, accepted: false, terminalReason: "CRITIC_MAX_CYCLES_EXHAUSTED" };
};
