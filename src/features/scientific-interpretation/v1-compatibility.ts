import { createEmptyInterpretation } from "../protocol-designer/intake/schema.js";
import type { ConfidenceLevel, EvidenceOrigin, HumanFieldReview, InterpretedFieldKey, RoutingIntent, ScientificSessionContext, ValidatedScientificIntent } from "../protocol-designer/intake/types.js";
import type { ScientificContributionItem, ScientificInterpretationContributionEnvelope } from "./contracts.js";

export type LegacyProjectionLoss = {
  code: "LEGACY_PROJECTION_LOSS";
  itemId: string;
  reason: string;
  critical: boolean;
};

export type V1ScientificInterpretationProjection = {
  contractNature: "LEGACY_V1_TRANSITIONAL_PROJECTION_NOT_PD003_V2";
  validatedIntent: ValidatedScientificIntent;
  scientificSessionContext: ScientificSessionContext;
  losses: LegacyProjectionLoss[];
};

export type ScientificInterpretationProjectionDisposition = "ACCEPTED_FOR_V1_PROJECTION" | "NEEDS_REVIEW" | "NEEDS_CLARIFICATION" | "FAIL_CLOSED";

export const scientificInterpretationProjectionDisposition = (contribution: ScientificInterpretationContributionEnvelope): ScientificInterpretationProjectionDisposition => {
  if (contribution.runtimeEvidence.technicalStatus === "RAW_PERSISTENCE_FAILURE") return "FAIL_CLOSED";
  if (contribution.audit.unresolvedFindings.some((item) => item.status === "OPEN" && item.severity === "CRITICAL")) return "NEEDS_REVIEW";
  if (contribution.scientificContent.clarificationNeeds.length || contribution.scientificContent.ambiguities.length || contribution.scientificContent.unknowns.length) return "NEEDS_CLARIFICATION";
  return "ACCEPTED_FOR_V1_PROJECTION";
};

export const projectScientificContributionToV1IfAllowed = (
  contribution: ScientificInterpretationContributionEnvelope,
  previous?: ScientificSessionContext,
): { disposition: ScientificInterpretationProjectionDisposition; projection: V1ScientificInterpretationProjection | null } => {
  const disposition = scientificInterpretationProjectionDisposition(contribution);
  if (disposition === "NEEDS_REVIEW" || disposition === "FAIL_CLOSED") return { disposition, projection: null };
  return { disposition, projection: projectScientificContributionToV1(contribution, previous) };
};

const V1_TYPE_MAP: Record<string, InterpretedFieldKey> = {
  SCIENTIFIC_INTENT: "scientificPurpose",
  OPERATION: "scientificPurpose",
  GOAL: "scientificPurpose",
  ANATOMICAL_CONTEXT: "clinicalContext",
  CLINICAL_CONTEXT: "clinicalContext",
  CONDITION: "pathologyOrCondition",
  CLINICAL_CONDITION: "pathologyOrCondition",
  POPULATION: "population",
  SCIENTIFIC_OBJECT: "phenomenaOfInterest",
  PHENOMENON: "phenomenaOfInterest",
  MECHANISM: "phenomenaOfInterest",
  INTERVENTION: "interventionsOrGroups",
  COMPARATOR: "interventionsOrGroups",
  ENDPOINT: "outcomesMentioned",
  OUTCOME: "outcomesMentioned",
  STUDY_DESIGN: "studyDesign",
  STUDY_SETTING: "centers",
  MODALITY: "availableEquipment",
  IMAGING_MODALITY: "availableEquipment",
  METHOD: "availableEquipment",
  CONSTRAINT: "constraints",
  TIMING: "declaredTimings",
  TEMPORAL_ELEMENT: "declaredTimings",
};

const confidence = (value: number | null): ConfidenceLevel => value === null ? "UNKNOWN" : value >= 0.85 ? "HIGH" : value >= 0.6 ? "MEDIUM" : value > 0 ? "LOW" : "UNKNOWN";
const origin = (items: ScientificContributionItem[]): EvidenceOrigin => items.every((item) => item.epistemicBoundary.epistemicStatus === "EXPLICIT_USER_STATED")
  ? "EXPLICIT_USER_STATEMENT"
  : items.every((item) => item.epistemicBoundary.epistemicStatus === "CONFIRMED_BY_USER") ? "NORMALIZED_FROM_USER_TERM" : "TENTATIVE_INTERPRETATION";
const routeMap: Record<string, RoutingIntent> = {
  UNDERSTAND: "UNDERSTAND",
  FORMALIZE_IDEA: "FORMALIZE_IDEA",
  DESIGN_STUDY: "DESIGN_STUDY",
  DOCUMENT: "DOCUMENT",
  REVIEW_REROUTE: "FORMALIZE_IDEA",
};

const allItems = (contribution: ScientificInterpretationContributionEnvelope) => {
  const items = [
    ...contribution.scientificContent.explicitStatements,
    ...contribution.scientificContent.candidateObjects,
    ...contribution.scientificContent.inferredContext,
    ...contribution.scientificContent.contextualCandidates,
    ...contribution.scientificContent.negationsAndConstraints,
    ...contribution.scientificContent.temporalElements,
  ];
  return [...new Map(items.map((item) => [item.itemId, item])).values()];
};

export const projectScientificContributionToV1 = (
  contribution: ScientificInterpretationContributionEnvelope,
  previous?: ScientificSessionContext,
): V1ScientificInterpretationProjection => {
  const interpretation = createEmptyInterpretation({
    question: contribution.source.originalRequest,
    language: contribution.identity.runtimeId === "LEGACY_SEM_FULL" ? "fr" : contribution.source.turns.some((turn) => /\b(the|with|and|versus)\b/i.test(turn.content)) ? "en" : "fr",
    schemaVersion: "1.0",
  });
  interpretation.reformulatedQuestion = contribution.scientificContent.normalizedUnderstanding ?? contribution.source.originalRequest;
  const active = allItems(contribution).filter((item) => item.epistemicBoundary.activeState !== false && item.epistemicBoundary.epistemicStatus !== "REJECTED_BY_USER");
  const eligible = active.filter((item) => ["EXPLICIT_USER_STATED", "CONFIRMED_BY_USER"].includes(item.epistemicBoundary.epistemicStatus ?? ""));
  const grouped = new Map<InterpretedFieldKey, ScientificContributionItem[]>();
  eligible.forEach((item) => {
    const key = item.proposedType ? V1_TYPE_MAP[item.proposedType] : undefined;
    if (key) grouped.set(key, [...(grouped.get(key) ?? []), item]);
  });
  const decisionComplete = !contribution.decisionBoundary.decisionRequired;
  const reviews: Partial<Record<InterpretedFieldKey, HumanFieldReview>> = {};
  grouped.forEach((items, key) => {
    const values = [...new Set(items.map((item) => item.content).filter(Boolean))];
    if (!values.length || key === "userExpertise") return;
    (interpretation as unknown as Record<string, unknown>)[key] = {
      value: values,
      origin: origin(items),
      confidence: confidence(Math.min(...items.map((item) => item.confidence ?? 0))),
      sourceText: items.length === 1 ? items[0].epistemicBoundary.sourceText ?? undefined : undefined,
      userValidated: decisionComplete,
    };
    reviews[key] = { state: decisionComplete ? "CONFIRMED" : "NOT_REVIEWED", reviewedAt: decisionComplete ? contribution.identity.createdAt : undefined };
  });
  interpretation.termsNeedingClarification = contribution.scientificContent.ambiguities.map((item) => item.content).filter(Boolean);
  interpretation.missingInformation = [...new Set([
    ...contribution.scientificContent.unknowns.map((item) => item.content),
    ...contribution.scientificContent.missingInformation.map((item) => item.content),
  ].filter(Boolean))];
  interpretation.contradictions = contribution.scientificContent.openDecisions.filter((item) => item.proposedType === "CONTRADICTION").map((item) => item.content).filter(Boolean);
  interpretation.unsupportedInferences = contribution.scientificContent.contextualCandidates
    .filter((item) => item.epistemicBoundary.epistemicStatus?.includes("CANDIDATE") || item.epistemicBoundary.adoptionStatus !== "ADOPTED")
    .map((item) => item.content).filter(Boolean);

  const losses: LegacyProjectionLoss[] = [];
  allItems(contribution).forEach((item) => {
    if (!item.proposedType || !V1_TYPE_MAP[item.proposedType]) losses.push({ code: "LEGACY_PROJECTION_LOSS", itemId: item.itemId, reason: `V1 has no field for runtime type ${item.proposedType ?? "ABSENT"}; source remains in interpretationTrace.`, critical: false });
    if (item.epistemicBoundary.activeState === false || item.epistemicBoundary.epistemicStatus === "REJECTED_BY_USER" || (item.previousItemIds?.length ?? 0) > 0) losses.push({ code: "LEGACY_PROJECTION_LOSS", itemId: item.itemId, reason: "Rejected or superseded state cannot be expressed in V1 fields; it remains reconstructible in interpretationTrace.", critical: false });
    if (item.availabilityClaim || item.availabilityScope) losses.push({ code: "LEGACY_PROJECTION_LOSS", itemId: item.itemId, reason: "Fine-grained availability is not expressible in V1 fields; source values remain in interpretationTrace.", critical: false });
  });
  contribution.scientificContent.candidateRelations.forEach((relation) => {
    losses.push({ code: "LEGACY_PROJECTION_LOSS", itemId: relation.relationId, reason: "V1 stores a traceable relation label but not the complete typed relation contract.", critical: false });
  });

  const relationLabels = contribution.scientificContent.candidateRelations.map((relation) => {
    const source = allItems(contribution).find((item) => item.itemId === relation.sourceItemId)?.content ?? relation.sourceItemId;
    const target = allItems(contribution).find((item) => item.itemId === relation.targetItemId)?.content ?? relation.targetItemId;
    return contribution.identity.runtimeId === "LEGACY_SEM_FULL"
      ? `${source} ${relation.relationType} ${target}`
      : `${source} ${relation.relationType} ${target} [${relation.polarity ?? "POLARITY_UNAVAILABLE"}]`;
  });
  const rejectedOrSuperseded = allItems(contribution)
    .filter((item) => item.epistemicBoundary.activeState === false || item.epistemicBoundary.epistemicStatus === "REJECTED_BY_USER" || (item.previousItemIds?.length ?? 0) > 0)
    .map((item) => item.itemId);
  const central = eligible.find((item) => ["SCIENTIFIC_OBJECT", "PHENOMENON", "CLINICAL_CONDITION", "CONDITION"].includes(item.proposedType ?? "")) ?? eligible[0];
  const route = contribution.scientificContent.routeProposal ? routeMap[contribution.scientificContent.routeProposal.route] ?? null : previous?.routeIntent ?? null;
  const context: ScientificSessionContext = {
    routeIntent: route,
    routeConfidence: confidence(contribution.scientificContent.routeProposal?.confidence ?? null),
    routeReasons: contribution.scientificContent.routeProposal?.reason ? [contribution.scientificContent.routeProposal.reason] : [],
    centralScientificObject: central?.content ?? contribution.scientificContent.normalizedUnderstanding ?? contribution.source.originalRequest,
    preservedScientificTerms: [...new Set(eligible.filter((item) => ["SCIENTIFIC_OBJECT", "PHENOMENON", "CONDITION", "CLINICAL_CONDITION", "BIOMARKER", "MODALITY", "IMAGING_MODALITY", "METHOD", "INTERVENTION", "COMPARATOR"].includes(item.proposedType ?? "")).map((item) => item.content))],
    detectedRelationships: relationLabels,
    workingHypotheses: active.filter((item) => ["ASSUMPTION", "EXPECTED_DIRECTION"].includes(item.proposedType ?? "")).map((item) => item.content),
    missingInformation: interpretation.missingInformation,
    contextVersion: (previous?.contextVersion ?? 0) + 1,
    transitions: previous?.transitions ?? [],
    currentProjectStage: previous?.currentProjectStage ?? 1,
    activeDesignSurface: previous?.activeDesignSurface ?? "SCIENTIFIC_THINKING",
    interpretationTrace: {
      contributionId: contribution.identity.contributionId,
      relations: relationLabels,
      polarities: allItems(contribution).map((item) => `${item.itemId}:${item.polarity ?? "UNAVAILABLE"}`),
      corrections: contribution.scientificContent.correctionsAndSupersessions.map((item) => item.content),
      unknowns: interpretation.missingInformation,
      ambiguities: interpretation.termsNeedingClarification,
      rejectedOrSuperseded,
      provenanceRefs: [...new Set([contribution.source.rawOutputRef, contribution.source.rawOutputDigest, ...contribution.source.sourceRefs].filter((item): item is string => Boolean(item)))],
      legacyProjectionLosses: losses,
    },
  };
  return {
    contractNature: "LEGACY_V1_TRANSITIONAL_PROJECTION_NOT_PD003_V2",
    validatedIntent: {
      schemaVersion: "1.0",
      originalQuestion: contribution.source.originalRequest,
      validatedReformulation: interpretation.reformulatedQuestion,
      language: interpretation.language,
      interpretation,
      reviews,
      ambiguityResolutions: Object.fromEntries(interpretation.termsNeedingClarification.map((item) => [item, "Conservée comme ambiguïté dans la Contribution."])),
      contradictionResolutions: Object.fromEntries(interpretation.contradictions.map((item) => [item, "KEPT_FOR_HUMAN_REVIEW" as const])),
      confirmedAt: decisionComplete ? contribution.identity.createdAt : null,
      interpretationContributionSnapshot: {
        contributionId: contribution.identity.contributionId,
        contributionContractVersion: contribution.identity.contractVersion,
        runtimeId: contribution.identity.runtimeId,
        runtimeVersion: contribution.identity.runtimeVersion,
        contributionDigest: contribution.identity.contributionDigest,
        rawOutputRef: contribution.source.rawOutputRef,
        rawOutputDigest: contribution.source.rawOutputDigest,
        contractNature: contribution.contractNature,
        projectWriteAuthorized: false,
      },
      ...(contribution.identity.runtimeId === "LEGACY_SEM_FULL" ? {
        semanticSnapshot: {
          semanticModelId: contribution.source.conversationId,
          semanticModelVersion: contribution.identity.runtimeVersion,
          semanticModelRevision: Number(contribution.identity.contributionId.split(":").at(-1)) || 0,
          semanticModelDigest: contribution.runtimeEvidence.configurationDigest ?? contribution.identity.contributionDigest,
          provider: contribution.runtimeEvidence.provider ?? "UNAVAILABLE",
          model: contribution.runtimeEvidence.model ?? "UNAVAILABLE",
          promptVersion: contribution.runtimeEvidence.promptDigest ?? "UNAVAILABLE",
          schemaVersion: contribution.runtimeEvidence.schemaDigest ?? "UNAVAILABLE",
        },
      } : {}),
    },
    scientificSessionContext: context,
    losses,
  };
};
