import type { WorkspaceInteractionHandoff } from "@/features/adaptive-research-workspace/interactions";
import type {
  ScientificContributionItem,
  ScientificContributionRelation,
  ScientificInterpretationContributionEnvelope,
} from "@/features/scientific-interpretation/contracts";

export const CONVERSATIONAL_HANDOFF_VERSION = "1.0.0" as const;

export const CONVERSATIONAL_OWNER_TARGETS = [
  "SCIENTIFIC_INTERPRETATION",
  "SCIENTIFIC_THINKING",
  "IMAGING",
  "KNOWLEDGE",
  "RESEARCH_PROJECT",
  "HUMAN_DECISION",
  "QUERY_NAVIGATION",
  "VALIDATION",
  "DOCUMENT",
  "STUDY_TEMPLATE",
  "DATA_ANALYSIS",
  "DATA_MANAGEMENT",
  "BIOSTATISTICS",
] as const;

export type ConversationalOwnerTarget = (typeof CONVERSATIONAL_OWNER_TARGETS)[number];
export type ConversationalHandoffFreshness = "CURRENT" | "STALE" | "SUPERSEDED" | "INVALIDATED";

const CONVERSATIONAL_OWNER_ALIASES: Readonly<Record<string, ConversationalOwnerTarget>> = {
  "SI-001": "SCIENTIFIC_INTERPRETATION",
  "ST-001": "SCIENTIFIC_THINKING",
  "IMG-001": "IMAGING",
  "KE-001": "KNOWLEDGE",
  "PRJ-001": "RESEARCH_PROJECT",
  "HD-001": "HUMAN_DECISION",
  "QRY-001": "QUERY_NAVIGATION",
  "VAL-001": "VALIDATION",
  "DOC-001": "DOCUMENT",
  "TMP-001": "STUDY_TEMPLATE",
  "DAI-001": "DATA_ANALYSIS",
  "DM-001": "DATA_MANAGEMENT",
  "BIOSTAT-001": "BIOSTATISTICS",
};

export const resolveConversationalOwnerTarget = (ownerRef: string): ConversationalOwnerTarget | null => {
  if (CONVERSATIONAL_OWNER_TARGETS.includes(ownerRef as ConversationalOwnerTarget)) return ownerRef as ConversationalOwnerTarget;
  return CONVERSATIONAL_OWNER_ALIASES[ownerRef] ?? null;
};

export type ConversationalSemanticKind =
  | "SCIENTIFIC_INTENT"
  | "DISEASE_CONDITION"
  | "INTERVENTION"
  | "COMPARATOR"
  | "POPULATION"
  | "STUDY_DESIGN"
  | "IMAGING_MODALITY"
  | "IMAGING_METHOD"
  | "BIOLOGICAL_MEASUREMENT"
  | "QUANTITATIVE_TARGET"
  | "OUTCOME"
  | "TEMPORAL_ELEMENT"
  | "CONSTRAINT"
  | "UNCLASSIFIED_CANDIDATE";

export type ConversationalSemanticElement = {
  itemId: string;
  semanticIdentity: string | null;
  semanticKind: ConversationalSemanticKind;
  sourceType: string | null;
  content: string;
  polarity: string | null;
  studyRole: string | null;
  epistemicStatus: string | null;
  adoptionStatus: string | null;
  activeState: boolean | null;
  sourceTurnIds: string[];
  provenanceRefs: string[];
};

export type ConversationalTypedSemanticHandoff = {
  handoffVersion: typeof CONVERSATIONAL_HANDOFF_VERSION;
  contractNature: "CONVERSATIONAL_TYPED_HANDOFF_NOT_SOURCE_OF_TRUTH";
  contributionRef: string;
  contributionVersion: string;
  contributionDigest: string;
  scientificElements: ConversationalSemanticElement[];
  relations: Array<{
    relationId: string;
    relationType: string;
    sourceItemId: string;
    targetItemId: string;
    polarity: string | null;
    activeState: boolean | null;
    sourceTurnIds: string[];
  }>;
  provenanceRefs: string[];
  unknownRefs: string[];
  contradictionRefs: string[];
  correctionRefs: string[];
  legacyProjectionRef: string | null;
  sourceOfTruth: false;
  projectWriteAuthorized: false;
  ownershipTransferred: false;
};

const semanticKindFor = (item: ScientificContributionItem, runtimeId: string): ConversationalSemanticKind => ({
  SCIENTIFIC_INTENT: "SCIENTIFIC_INTENT",
  OPERATION: "SCIENTIFIC_INTENT",
  GOAL: "SCIENTIFIC_INTENT",
  CONDITION: "DISEASE_CONDITION",
  CLINICAL_CONDITION: "DISEASE_CONDITION",
  DISEASE_CONDITION: "DISEASE_CONDITION",
  INTERVENTION: "INTERVENTION",
  DRUG: "INTERVENTION",
  COMPARATOR: "COMPARATOR",
  POPULATION: "POPULATION",
  STUDY_DESIGN: "STUDY_DESIGN",
  MODALITY: "IMAGING_MODALITY",
  IMAGING_MODALITY: "IMAGING_MODALITY",
  METHOD: runtimeId === "LEGACY_SEM_FULL" ? "IMAGING_METHOD" : "UNCLASSIFIED_CANDIDATE",
  IMAGING_METHOD: "IMAGING_METHOD",
  BIOMARKER: "BIOLOGICAL_MEASUREMENT",
  BIOLOGICAL_BIOMARKER: "BIOLOGICAL_MEASUREMENT",
  BIOLOGICAL_MEASUREMENT: "BIOLOGICAL_MEASUREMENT",
  SCIENTIFIC_OBJECT: "QUANTITATIVE_TARGET",
  QUANTITATIVE_IMAGING_TARGET: "QUANTITATIVE_TARGET",
  ENDPOINT: "OUTCOME",
  OUTCOME: "OUTCOME",
  TIMING: "TEMPORAL_ELEMENT",
  TEMPORAL_ELEMENT: "TEMPORAL_ELEMENT",
  CONSTRAINT: "CONSTRAINT",
}[item.proposedType ?? ""] as ConversationalSemanticKind | undefined) ?? "UNCLASSIFIED_CANDIDATE";

const uniqueItems = (contribution: ScientificInterpretationContributionEnvelope) => [...new Map([
  ...contribution.scientificContent.explicitStatements,
  ...contribution.scientificContent.candidateObjects,
  ...contribution.scientificContent.inferredContext,
  ...contribution.scientificContent.contextualCandidates,
  ...contribution.scientificContent.negationsAndConstraints,
  ...contribution.scientificContent.temporalElements,
  ...contribution.scientificContent.correctionsAndSupersessions,
].map((item) => [item.itemId, item])).values()];

const relationProjection = (relation: ScientificContributionRelation) => ({
  relationId: relation.relationId,
  relationType: relation.relationType,
  sourceItemId: relation.sourceItemId,
  targetItemId: relation.targetItemId,
  polarity: relation.polarity,
  activeState: relation.epistemicBoundary.activeState,
  sourceTurnIds: [...relation.epistemicBoundary.sourceTurnIds],
});

export const buildConversationalSemanticHandoff = (
  contribution: ScientificInterpretationContributionEnvelope,
  legacyProjectionRef: string | null = null,
): ConversationalTypedSemanticHandoff => ({
  handoffVersion: CONVERSATIONAL_HANDOFF_VERSION,
  contractNature: "CONVERSATIONAL_TYPED_HANDOFF_NOT_SOURCE_OF_TRUTH",
  contributionRef: contribution.identity.contributionId,
  contributionVersion: contribution.identity.contractVersion,
  contributionDigest: contribution.identity.contributionDigest,
  scientificElements: uniqueItems(contribution).map((item) => ({
    itemId: item.itemId,
    semanticIdentity: item.semanticIdentity,
    semanticKind: semanticKindFor(item, contribution.identity.runtimeId),
    sourceType: item.proposedType,
    content: item.content,
    polarity: item.polarity,
    studyRole: item.studyRole,
    epistemicStatus: item.epistemicBoundary.epistemicStatus,
    adoptionStatus: item.epistemicBoundary.adoptionStatus,
    activeState: item.epistemicBoundary.activeState,
    sourceTurnIds: [...item.epistemicBoundary.sourceTurnIds],
    provenanceRefs: [...new Set([...item.epistemicBoundary.sourceTurnIds, ...(item.evidenceRefs ?? [])])],
  })),
  relations: contribution.scientificContent.candidateRelations.map(relationProjection),
  provenanceRefs: [...new Set([
    ...contribution.source.sourceRefs,
    contribution.source.rawOutputRef,
    contribution.source.rawOutputDigest,
  ].filter((ref): ref is string => Boolean(ref)))],
  unknownRefs: contribution.scientificContent.unknowns.map((item) => item.itemId),
  contradictionRefs: contribution.scientificContent.openDecisions.filter((item) => item.proposedType === "CONTRADICTION").map((item) => item.itemId),
  correctionRefs: contribution.scientificContent.correctionsAndSupersessions.map((item) => item.itemId),
  legacyProjectionRef,
  sourceOfTruth: false,
  projectWriteAuthorized: false,
  ownershipTransferred: false,
});

export type ConversationalHandoffRoute = {
  routeVersion: typeof CONVERSATIONAL_HANDOFF_VERSION;
  routeId: string;
  interactionRef: string;
  responseRef: string;
  contributionRef: string;
  sourceOwner: "SCIENTIFIC_INTERPRETATION";
  targetOwner: ConversationalOwnerTarget;
  currentProjectRef: string | null;
  currentProjectVersion: string | null;
  targetRef: string;
  freshness: ConversationalHandoffFreshness;
  status: "READY_FOR_OWNER" | "STALE_BLOCKED";
  ownerInputRefs: string[];
  typedHandoff: ConversationalTypedSemanticHandoff;
  rawResponsePreserved: true;
  scientificDecisionMade: false;
  humanDecisionCreated: false;
  ownershipTransferred: false;
  projectWriteAuthorized: false;
};

export type ConversationalHandoffRouteInput = {
  interaction: WorkspaceInteractionHandoff;
  contribution: ScientificInterpretationContributionEnvelope;
  ownerTarget: ConversationalOwnerTarget;
  currentProjectRef: string | null;
  currentProjectVersion: string | null;
  freshness: ConversationalHandoffFreshness;
};

export type ConversationalOwnerProcessingResult = {
  status: "SUCCESS" | "PARTIAL" | "FAILURE" | "STALE";
  ownerRef: ConversationalOwnerTarget;
  ownerResultRef: string | null;
  projectRef: string | null;
  projectVersion: string | null;
  projectDigest: string | null;
  qryMemoryRef: string | null;
  qryActionRef: string | null;
  feedbackText: string;
  recoveryText?: string;
};

export const routeConversationalHandoff = (input: ConversationalHandoffRouteInput): ConversationalHandoffRoute => {
  if (!CONVERSATIONAL_OWNER_TARGETS.includes(input.ownerTarget)) throw new Error("CONVERSATIONAL_CONTRACTUAL_OWNER_REQUIRED");
  const typedHandoff = buildConversationalSemanticHandoff(input.contribution);
  return {
    routeVersion: CONVERSATIONAL_HANDOFF_VERSION,
    routeId: `conversational-route:${input.interaction.handoffId}:${input.contribution.identity.contributionId}:${input.ownerTarget}`,
    interactionRef: input.interaction.handoffId,
    responseRef: input.interaction.response.responseId,
    contributionRef: input.contribution.identity.contributionId,
    sourceOwner: "SCIENTIFIC_INTERPRETATION",
    targetOwner: input.ownerTarget,
    currentProjectRef: input.currentProjectRef,
    currentProjectVersion: input.currentProjectVersion,
    targetRef: input.interaction.targetRef,
    freshness: input.freshness,
    status: input.freshness === "CURRENT" ? "READY_FOR_OWNER" : "STALE_BLOCKED",
    ownerInputRefs: [...new Set([
      input.interaction.response.responseId,
      input.contribution.identity.contributionId,
      input.interaction.sourceActionRef,
      ...input.interaction.response.provenanceRefs,
    ])],
    typedHandoff,
    rawResponsePreserved: true,
    scientificDecisionMade: false,
    humanDecisionCreated: false,
    ownershipTransferred: false,
    projectWriteAuthorized: false,
  };
};
