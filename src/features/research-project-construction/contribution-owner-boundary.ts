import { logicalDigest } from "../knowledge-engine/canonical.js";
import {
  createHumanDecisionCandidate,
  engageHumanDecision,
  type HumanDecisionEnvelope,
} from "../protocol-designer/human-decision.js";
import type {
  ScientificContributionItem,
  ScientificInterpretationContributionEnvelope,
} from "../scientific-interpretation/contracts.js";
import {
  applyCanonicalProjectChangeSet,
  buildCanonicalProjectChangeSet,
  ensureCanonicalProjectState,
  projectSectionsFromCanonicalState,
  type CanonicalProjectChangeSet,
  type CanonicalResearchProjectState,
} from "./canonical-project-backbone.js";
import {
  projectSectionForGovernedStudyRole,
  RESEARCH_PROJECT_SECTION_LABELS as SECTION_LABELS,
  RESEARCH_PROJECT_SECTION_ORDER,
  type ResearchProjectSectionId,
} from "./project-section-projection.js";
import { RESEARCH_PROJECT_CONSTRUCTION_VERSION } from "./types.js";

export const RESEARCH_PROJECT_CONTRIBUTION_BOUNDARY = "PRJ_001_CONTRIBUTION_INTAKE_ADAPTER" as const;
export const PRJ001_CONTRIBUTION_INTAKE_GAP = {
  existingContractGap: "PRJ001_V1_REQUIRES_SCIENTIFIC_THINKING_HANDOFF_AND_CANNOT_REPRESENT_EXPLICIT_IMAGING_PENDING_OWNER_WITHOUT_FALSE_NOT_APPLICABLE_FALSE_FROZEN_OR_REFUSAL",
  adaptationScope: "USER_CONFIRMED_PROJECT_INFORMATION_ONLY_NO_DESIGN_FREEZE_NO_PD003_V2_CANONICAL_PROMOTION",
} as const;

export type ResearchProjectSectionState = "DEFINED" | "PARTIAL" | "TO_CLARIFY";

export type ResearchProjectElement = {
  elementId: string;
  semanticKey?: string;
  content: string;
  sourceItemIds: string[];
  sourceTurnIds: string[];
  sourceProposedType?: string | null;
  sourceStudyRole?: string | null;
  sourcePolarity?: string | null;
  disposition: "USER_CONFIRMED_PROJECT_INFORMATION";
  canonicalPromotion: "NOT_PERFORMED";
};

export type ResearchProjectSection = {
  sectionId: ResearchProjectSectionId;
  label: string;
  state: ResearchProjectSectionState;
  elements: ResearchProjectElement[];
};

export type ResearchProjectOwnerAuthority = {
  actorRef: string;
  mandateRef: "PROJECT_OWNER";
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION";
  verification: "DEMO_SESSION_NOT_AUTHENTICATED";
};

export type SpecializedResponsibility = {
  owner: "SCIENTIFIC_THINKING" | "IMAGING" | "OBSERVABILITY_MEASUREMENT" | "BIOSTATISTICS";
  state: "RETAINED_OUTSIDE_NOMINAL_UX" | "PENDING_SPECIALIST_CONTRIBUTION" | "NOT_TRIGGERED";
  retainedResponsibility: string;
  sourceItemIds: string[];
};

export type ResearchProjectContributionCandidate = {
  boundary: typeof RESEARCH_PROJECT_CONTRIBUTION_BOUNDARY;
  status: "CANDIDATE_PENDING_HUMAN_CONFIRMATION" | "NO_NET_CHANGE" | "BLOCKED_BY_STRUCTURAL_CONFLICT" | "REVIEW_PROJECTION_INCOMPLETE";
  projectWriteAuthorized: false;
  contributionRef: string;
  contributionDigest: string;
  changeSet: ContributionProjectChangeSet;
  canonicalChangeSet: CanonicalProjectChangeSet;
  humanReviewProjection: HumanReviewProjection;
  proposedSections: ResearchProjectSection[];
  specializedResponsibilities: SpecializedResponsibility[];
};

export type HumanReviewChangeKind = "OBJECT" | "RELATION" | "TEMPORAL_QUALIFICATION" | "EXPECTED_VARIABLE_OCCASION" | "LEGACY_TEMPORAL";

export type HumanReviewProjectionItem = {
  reviewItemRef: string;
  changeRef: string;
  changeKind: HumanReviewChangeKind;
  operation: "ADD" | "REMOVE" | "REPLACE";
  content: string;
  statusLabel?: "Déclaré" | "Reformulé" | "Interprété — à confirmer" | "À préciser";
  specificationLabel?: "Détails à préciser";
  projectSectionId?: ResearchProjectSectionId;
};

export type HumanReviewOpenPoint = {
  openPointRef: string;
  projectSectionId: ResearchProjectSectionId;
  content: string;
  source: "OBJECT_SPECIFICATION" | "SECTION_COMPLETENESS";
  sectionState: ResearchProjectSectionState;
  knownContentPresent: boolean;
  sourceChangeRefs: string[];
};

export type HumanReviewProjectionSection = {
  sectionRef: string;
  label: string;
  items: HumanReviewProjectionItem[];
};

export const HUMAN_REVIEW_PROJECTION_VERSION = "1.1.0" as const;

export type HumanReviewProjection = {
  contract: "PRJ001_HUMAN_REVIEW_PROJECTION";
  contractVersion: typeof HUMAN_REVIEW_PROJECTION_VERSION;
  sourceChangeSetRef: string;
  status: "COMPLETE" | "INCOMPLETE" | "NOT_APPLICABLE";
  sections: HumanReviewProjectionSection[];
  openPoints: HumanReviewOpenPoint[];
  expectedChangeRefs: string[];
  coveredChangeRefs: string[];
  missingChangeRefs: string[];
  unexpectedChangeRefs: string[];
  duplicateChangeRefs: string[];
};

export type ContributionProjectChangeOperation = "ADD" | "REMOVE" | "REPLACE" | "NO_CHANGE";

export type ContributionProjectChange = {
  changeId: string;
  operation: ContributionProjectChangeOperation;
  targetSectionId: ResearchProjectSectionId;
  semanticIdentity: string;
  semanticKey: string;
  previousElement: ResearchProjectElement | null;
  proposedElement: ResearchProjectElement | null;
  sourceContributionRef: string;
  sourceObjectRefs: string[];
  rationale: string;
  presentation: string;
  status: "PROPOSED";
};

/**
 * PRJ-owned Level 3 implementation contract. It is not a PD-003 root and only
 * describes the atomic delta awaiting the existing human confirmation.
 */
export type ContributionProjectChangeSet = {
  contract: "CONTRIBUTION_PROJECT_CHANGESET";
  contractVersion: "1.0.0";
  contractNature: "PRJ001_LEVEL_3_IMPLEMENTATION_NOT_CANONICAL_OBJECT";
  boundary: typeof RESEARCH_PROJECT_CONTRIBUTION_BOUNDARY;
  sourceContributionRef: string;
  sourceContributionDigest: string;
  baseProjectVersion: string | null;
  status: "PENDING_HUMAN_CONFIRMATION" | "NO_NET_CHANGE";
  changes: ContributionProjectChange[];
  effectiveChangeCount: number;
  noChangeExplanation: string | null;
};

/**
 * PRJ-owned runtime projection of the ResearchProject/Dossier aggregate.
 * It is deliberately not a new PD-003 root and does not claim V2 canonical adoption.
 */
export type ResearchProjectOwnerProjection = {
  contract: "RESEARCH_PROJECT_CONSTRUCTION_OWNER_PROJECTION";
  contractVersion: typeof RESEARCH_PROJECT_CONSTRUCTION_VERSION;
  contractNature: "PRJ001_MINIMAL_OWNER_ADAPTER_NOT_PD003_V2_ROOT";
  boundary: typeof RESEARCH_PROJECT_CONTRIBUTION_BOUNDARY;
  pd003V2Compatibility: "COMPATIBLE_IN_PRINCIPLE_ADAPTATION_REQUIRED";
  canonicalV2Status: "NO_SCIENTIFIC_OBJECT_PROMOTION_CLAIMED";
  canonicalBackboneStatus?: "PRJ_OWNED_CANONICAL_PROJECT_BACKBONE_ACTIVE";
  contractAdaptation: typeof PRJ001_CONTRIBUTION_INTAKE_GAP;
  projectId: string;
  versionId: string;
  projectDigest: string;
  revision: number;
  contributionRef: string;
  contributionDigest: string;
  previousVersionId: string | null;
  adoptedAt: string;
  owner: "RESEARCH_PROJECT";
  confirmationDecision: HumanDecisionEnvelope;
  llmProjectWrites: 0;
  sections: ResearchProjectSection[];
  specializedResponsibilities: SpecializedResponsibility[];
  appliedChangeSet?: ContributionProjectChangeSet;
  canonicalState?: CanonicalResearchProjectState;
};

const active = (item: ScientificContributionItem) => item.epistemicBoundary.activeState !== false;
const positiveProjectValue = (item: ScientificContributionItem) => active(item) && item.polarity !== "NEGATED";

const structuredProjectItems = (contribution: ScientificInterpretationContributionEnvelope) => {
  const content = contribution.scientificContent;
  return [
    ...content.candidateObjects,
    ...content.temporalElements,
  ];
};

export const contributionItems = (contribution: ScientificInterpretationContributionEnvelope) => {
  return [...new Map(structuredProjectItems(contribution)
    .filter(positiveProjectValue)
    .map((item) => [item.itemId, item])).values()];
};

const scopedInitialContribution = (contribution: ScientificInterpretationContributionEnvelope) => {
  const scope = logicalDigest({
    contributionId: contribution.identity.contributionId,
    contributionDigest: contribution.identity.contributionDigest,
  });
  const itemCollections = [
    contribution.scientificContent.explicitStatements,
    contribution.scientificContent.candidateObjects,
    contribution.scientificContent.inferredContext,
    contribution.scientificContent.contextualCandidates,
    contribution.scientificContent.negationsAndConstraints,
    contribution.scientificContent.temporalElements,
    contribution.scientificContent.ambiguities,
    contribution.scientificContent.unknowns,
    contribution.scientificContent.missingInformation,
    contribution.scientificContent.correctionsAndSupersessions,
    contribution.scientificContent.openDecisions,
    contribution.scientificContent.clarificationNeeds,
  ];
  const itemRefs = new Map(itemCollections
    .flat()
    .map((item) => [item.itemId, `initial-stage:${scope}:${item.itemId}`] as const));
  const ref = (value: string) => itemRefs.get(value) ?? value;
  const item = (value: ScientificContributionItem): ScientificContributionItem => ({
    ...value,
    itemId: ref(value.itemId),
    semanticIdentity: value.semanticIdentity ? ref(value.semanticIdentity) : null,
    previousItemIds: value.previousItemIds?.map(ref),
    evidenceRefs: value.evidenceRefs ? [...value.evidenceRefs] : undefined,
    epistemicBoundary: {
      ...value.epistemicBoundary,
      sourceTurnIds: [...value.epistemicBoundary.sourceTurnIds],
    },
  });
  const temporalQualifications = contribution.scientificContent.temporalQualifications?.map((qualification) => ({
    ...qualification,
    qualificationId: `initial-stage:${scope}:${qualification.qualificationId}`,
    subjectProjectRef: ref(qualification.subjectProjectRef),
    evidenceRefs: [...qualification.evidenceRefs],
    anchor: qualification.anchor?.reference.status === "KNOWN" ? {
      ...qualification.anchor,
      reference: {
        ...qualification.anchor.reference,
        referenceProjectRef: ref(qualification.anchor.reference.referenceProjectRef),
      },
    } : qualification.anchor ? structuredClone(qualification.anchor) : null,
  }));
  const expectedVariableOccasions = contribution.scientificContent.expectedVariableOccasions?.map((occasion) => ({
    ...occasion,
    occasionId: `initial-stage:${scope}:${occasion.occasionId}`,
    variableProjectRef: ref(occasion.variableProjectRef),
    studyUnitOrGroupRef: occasion.studyUnitOrGroupRef ? ref(occasion.studyUnitOrGroupRef) : null,
    evidenceRefs: [...occasion.evidenceRefs],
    anchor: occasion.anchor?.reference.status === "KNOWN" ? {
      ...occasion.anchor,
      reference: {
        ...occasion.anchor.reference,
        referenceProjectRef: ref(occasion.anchor.reference.referenceProjectRef),
      },
    } : occasion.anchor ? structuredClone(occasion.anchor) : null,
  }));
  return {
    ...contribution,
    scientificContent: {
      ...contribution.scientificContent,
      explicitStatements: contribution.scientificContent.explicitStatements.map(item),
      candidateObjects: contribution.scientificContent.candidateObjects.map(item),
      candidateRelations: contribution.scientificContent.candidateRelations.map((relation) => ({
        ...relation,
        relationId: `initial-stage:${scope}:${relation.relationId}`,
        sourceItemId: ref(relation.sourceItemId),
        targetItemId: ref(relation.targetItemId),
        evidenceRefs: relation.evidenceRefs ? [...relation.evidenceRefs] : undefined,
        epistemicBoundary: {
          ...relation.epistemicBoundary,
          sourceTurnIds: [...relation.epistemicBoundary.sourceTurnIds],
        },
      })),
      inferredContext: contribution.scientificContent.inferredContext.map(item),
      contextualCandidates: contribution.scientificContent.contextualCandidates.map(item),
      negationsAndConstraints: contribution.scientificContent.negationsAndConstraints.map(item),
      temporalElements: contribution.scientificContent.temporalElements.map(item),
      ambiguities: contribution.scientificContent.ambiguities.map(item),
      unknowns: contribution.scientificContent.unknowns.map(item),
      missingInformation: contribution.scientificContent.missingInformation.map(item),
      correctionsAndSupersessions: contribution.scientificContent.correctionsAndSupersessions.map(item),
      openDecisions: contribution.scientificContent.openDecisions.map(item),
      clarificationNeeds: contribution.scientificContent.clarificationNeeds.map(item),
      temporalQualifications,
      expectedVariableOccasions,
    },
    mapping: contribution.mapping.map((mapping) => ({ ...mapping, sourceItemId: ref(mapping.sourceItemId) })),
  };
};

/**
 * Combines successive, still-unadopted contributions while the first Project
 * version is being described. It only composes already validated scientific
 * payloads; it neither interprets text nor authorizes a Project write.
 */
export const mergeInitialResearchProjectContributions = (
  previous: ScientificInterpretationContributionEnvelope,
  latest: ScientificInterpretationContributionEnvelope,
): ScientificInterpretationContributionEnvelope => {
  if (previous.source.conversationId !== latest.source.conversationId) {
    throw new Error("INITIAL_PROJECT_CONTRIBUTION_CONVERSATION_MISMATCH");
  }
  const earlier = scopedInitialContribution(previous);
  const current = scopedInitialContribution(latest);
  const mergedContributionId = `initial-project-contribution:${logicalDigest({
    previous: previous.identity.contributionId,
    latest: latest.identity.contributionId,
  })}`;
  const turns = [...new Map([...earlier.source.turns, ...current.source.turns]
    .map((turn) => [turn.turnId, turn])).values()];
  const sourceRefs = [...new Set([
    ...earlier.source.sourceRefs,
    ...current.source.sourceRefs,
    earlier.source.rawOutputRef,
    current.source.rawOutputRef,
    earlier.source.rawOutputDigest ? `raw-output-digest:${earlier.source.rawOutputDigest}` : null,
    current.source.rawOutputDigest ? `raw-output-digest:${current.source.rawOutputDigest}` : null,
  ].filter((value): value is string => Boolean(value)))];
  const mergeItems = (a: ScientificContributionItem[], b: ScientificContributionItem[]) => [...a, ...b];
  const scientificContent = {
    ...current.scientificContent,
    normalizedUnderstanding: [earlier.scientificContent.normalizedUnderstanding, current.scientificContent.normalizedUnderstanding]
      .filter((value): value is string => Boolean(value)).join("\n") || null,
    routeProposal: null,
    explicitStatements: mergeItems(earlier.scientificContent.explicitStatements, current.scientificContent.explicitStatements),
    candidateObjects: mergeItems(earlier.scientificContent.candidateObjects, current.scientificContent.candidateObjects),
    candidateRelations: [...earlier.scientificContent.candidateRelations, ...current.scientificContent.candidateRelations],
    inferredContext: mergeItems(earlier.scientificContent.inferredContext, current.scientificContent.inferredContext),
    contextualCandidates: mergeItems(earlier.scientificContent.contextualCandidates, current.scientificContent.contextualCandidates),
    negationsAndConstraints: mergeItems(earlier.scientificContent.negationsAndConstraints, current.scientificContent.negationsAndConstraints),
    temporalElements: mergeItems(earlier.scientificContent.temporalElements, current.scientificContent.temporalElements),
    ambiguities: mergeItems(earlier.scientificContent.ambiguities, current.scientificContent.ambiguities),
    unknowns: mergeItems(earlier.scientificContent.unknowns, current.scientificContent.unknowns),
    missingInformation: mergeItems(earlier.scientificContent.missingInformation, current.scientificContent.missingInformation),
    correctionsAndSupersessions: mergeItems(earlier.scientificContent.correctionsAndSupersessions, current.scientificContent.correctionsAndSupersessions),
    openDecisions: mergeItems(earlier.scientificContent.openDecisions, current.scientificContent.openDecisions),
    clarificationNeeds: mergeItems(earlier.scientificContent.clarificationNeeds, current.scientificContent.clarificationNeeds),
    temporalQualifications: [...(earlier.scientificContent.temporalQualifications ?? []), ...(current.scientificContent.temporalQualifications ?? [])],
    expectedVariableOccasions: [...(earlier.scientificContent.expectedVariableOccasions ?? []), ...(current.scientificContent.expectedVariableOccasions ?? [])],
  };
  const contributionDigest = logicalDigest({
    mergedContributionId,
    previousDigest: previous.identity.contributionDigest,
    latestDigest: latest.identity.contributionDigest,
    sourceRefs,
    scientificContent,
  });
  return {
    ...current,
    identity: {
      ...current.identity,
      contributionId: mergedContributionId,
      previousContributionId: previous.identity.contributionId,
      runtimeId: "MINIMAL_PRODUCT_BRIDGE_INITIAL_PROJECT_STAGING",
      runtimeVersion: "1.0.0",
      contributionDigest,
    },
    source: {
      ...current.source,
      originalRequest: [earlier.source.originalRequest, current.source.originalRequest].filter(Boolean).join("\n"),
      turns,
      sourceRefs,
      rawOutputRef: current.source.rawOutputRef,
      rawOutputDigest: current.source.rawOutputDigest,
    },
    runtimeEvidence: {
      ...current.runtimeEvidence,
      validationErrors: [...earlier.runtimeEvidence.validationErrors, ...current.runtimeEvidence.validationErrors],
    },
    scientificContent,
    mapping: [...earlier.mapping, ...current.mapping],
    audit: {
      deterministicFindings: [...earlier.audit.deterministicFindings, ...current.audit.deterministicFindings],
      semanticAuditFindings: [...earlier.audit.semanticAuditFindings, ...current.audit.semanticAuditFindings],
      unresolvedFindings: [...earlier.audit.unresolvedFindings, ...current.audit.unresolvedFindings],
    },
    epistemicBoundary: {
      candidateIsAdopted: false,
      knowledgeSupportIsProjectDecision: false,
      projectOwnershipTransferred: false,
      humanDecisionEnvelopeRef: null,
    },
    decisionBoundary: {
      ...current.decisionBoundary,
      decisionRequired: true,
      decisionEnvelopeRef: null,
      projectWriteAuthorized: false,
    },
  };
};

const typeOf = (item: ScientificContributionItem) => `${item.proposedType ?? ""} ${item.studyRole ?? ""}`.toLocaleUpperCase("fr-FR");
const normalized = (value: string) => value.normalize("NFKC").toLocaleLowerCase("fr-FR").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const folded = (value: string) => normalized(value).normalize("NFD").replace(/\p{Diacritic}/gu, "");
const foldedWithSeparators = (value: string) => value
  .normalize("NFKC")
  .normalize("NFD")
  .replace(/\p{Diacritic}/gu, "")
  .toLocaleLowerCase("fr-FR")
  .replace(/\s+/g, " ")
  .trim();
const capitalize = (value: string) => value ? `${value.charAt(0).toLocaleUpperCase("fr-FR")}${value.slice(1)}` : value;

export const sectionForContributionItem = (
  item: ScientificContributionItem,
  contribution: ScientificInterpretationContributionEnvelope,
): ResearchProjectSectionId | null => {
  const governedRoleSection = projectSectionForGovernedStudyRole(item.studyRole);
  if (governedRoleSection) return governedRoleSection;
  const type = typeOf(item);
  const local = foldedWithSeparators(itemLocalContext(item));
  const source = foldedWithSeparators(contribution.source.turns
    .filter((turn) => item.epistemicBoundary.sourceTurnIds.includes(turn.turnId) && turn.role === "USER")
    .map((turn) => turn.content)
    .join(" "));
  const explicitEligibilityWindow = /TEMPORAL|TIMEPOINT|WINDOW|DURATION/.test(type)
    && /\b(?:moins de|less than|under|within|dans les)\s*\d+(?:[.,]\d+)?\s*(?:jours?|days?|semaines?|weeks?|mois|months?|ans?|years?)\b/.test(local)
    && /\b(?:inclu\w*|eligib\w*)\b/.test(source);
  if (explicitEligibilityWindow) return "POPULATION";
  if (/POPULATION|ELIGIBILITY|CRITERION/.test(type)) return "POPULATION";
  if (/STUDY_DESIGN|DESIGN|SETTING|CENTER/.test(type)) return "DESIGN";
  if (/COMPARATOR|CONTROL_ARM|REFERENCE_ARM/.test(type)) return "COMPARATOR";
  if (/INTERVENTION|TREATMENT|EXPOSURE_ARM/.test(type)) return "INTERVENTION";
  if (/TIMING|TEMPORAL|TIMEPOINT|WINDOW|VISIT/.test(type)) return "TEMPORALITY";
  if (/MODALITY|IMAGING_METHOD|ACQUISITION/.test(type)) return "IMAGING";
  if (/ANALYSIS|ESTIMAND|STATISTICAL/.test(type)) return "ANALYSIS";
  if (/OBJECTIVE|SCIENTIFIC_QUESTION/.test(type)) return "QUESTION";
  if (/HYPOTHESIS|CONDITION|DISEASE|DATA_NEED|PROJECT_INFORMATION|PROJECT_CONTEXT|CONTEXT/.test(type)) return null;
  if (/BIOMARKER|MEASURED_VARIABLE|MEASUREMENT|ENDPOINT|OUTCOME|QUANTITATIVE_TARGET|SCIENTIFIC_OBJECT/.test(type)) return "MEASUREMENTS";
  return null;
};

const itemLocalContext = (item: ScientificContributionItem) => [
  item.semanticIdentity,
  item.content,
  item.epistemicBoundary.sourceText,
  item.proposedType,
  item.studyRole,
].filter((value): value is string => Boolean(value)).join(" ");

const itemScientificValueContext = (item: ScientificContributionItem) => [
  item.content,
  item.epistemicBoundary.sourceText,
  item.proposedType,
  item.studyRole,
].filter((value): value is string => Boolean(value)).join(" ");

const itemContext = (item: ScientificContributionItem, contribution: ScientificInterpretationContributionEnvelope) => [
  itemLocalContext(item),
  ...contribution.source.turns
    .filter((turn) => item.epistemicBoundary.sourceTurnIds.includes(turn.turnId))
    .map((turn) => turn.content),
].filter((value): value is string => Boolean(value)).join(" ");

type SpecializedProjectElement = { semanticKey: string; content: string };

const populationEventWindow = (
  item: ScientificContributionItem,
  sectionId: ResearchProjectSectionId,
): SpecializedProjectElement | null => {
  if (sectionId !== "POPULATION") return null;
  const context = foldedWithSeparators(itemScientificValueContext(item));
  const bound = context.match(/\b(?:moins de|less than|under|within|dans les)\s*(\d+(?:[.,]\d+)?)\s*(jours?|days?|semaines?|weeks?|mois|months?|ans?|years?)\b/);
  if (!bound?.[1] || !bound[2]) return null;
  const unit = /^(?:jour|day)/.test(bound[2]) ? "DAY"
    : /^(?:semaine|week)/.test(bound[2]) ? "WEEK"
      : /^(?:mois|month)/.test(bound[2]) ? "MONTH"
        : "YEAR";
  const value = bound[1].replace(",", ".");
  return {
    semanticKey: `POPULATION:ELIGIBILITY:EVENT_WINDOW:LT:${value}:${unit}`,
    content: capitalize(item.content.trim()),
  };
};

const ageCriteria = (item: ScientificContributionItem, sectionId: ResearchProjectSectionId, contribution: ScientificInterpretationContributionEnvelope): SpecializedProjectElement[] => {
  const localContext = folded(itemScientificValueContext(item));
  const identityAwareContext = folded(itemLocalContext(item));
  const fallbackContext = folded(itemContext(item, contribution));
  const localWithSeparators = foldedWithSeparators(itemScientificValueContext(item));
  const ageSignal = /\bage\b/.test(localContext)
    || /\b\d{1,3}(?:[.,]\d+)?\s*(?:ans?|years?)\b/.test(localWithSeparators);
  if (sectionId !== "POPULATION" || !/ELIGIBILITY|CRITERION|LOWER_BOUND|UPPER_BOUND/.test(typeOf(item)) || !ageSignal) return [];
  const range = localWithSeparators.match(/\b(\d{1,3}(?:[.,]\d+)?)\s*(?:a|au|to|-|–)\s*(\d{1,3}(?:[.,]\d+)?)\s*(?:ans?|years?)\b/);
  if (range?.[1] && range[2]) return [
    { semanticKey: "POPULATION:ELIGIBILITY:AGE:MIN", content: `Âge minimal : ${range[1].replace(",", ".")} ans` },
    { semanticKey: "POPULATION:ELIGIBILITY:AGE:MAX", content: `Âge maximal : ${range[2].replace(",", ".")} ans` },
  ];
  const directionIn = (value: string) => /\b(?:maxim\w*|upper bound|au plus|ou moins|jusqu a|limiter|limite superieure|moins de)\b/.test(value)
    ? "max" as const
    : /\b(?:minim\w*|lower bound|au moins|ou plus|a partir de|limite inferieure)\b/.test(value)
      ? "min" as const
      : null;
  const localValues = [...localContext.matchAll(/\b(\d{1,3}(?:[.,]\d+)?)\s*(?:ans?|years?)\b/g)]
    .map((match) => match[1]?.replace(",", "."))
    .filter((value): value is string => Boolean(value));
  const fallbackValues = [...fallbackContext.matchAll(/\b(\d{1,3}(?:[.,]\d+)?)\s*(?:ans?|years?)\b/g)]
    .map((match) => match[1]?.replace(",", "."))
    .filter((value): value is string => Boolean(value));
  const localDirection = directionIn(identityAwareContext);
  const roleDirection = directionIn(folded(typeOf(item)));
  const direction = localDirection ?? roleDirection ?? directionIn(fallbackContext) ?? "criterion";
  const values = localValues.length ? localValues : fallbackValues;
  const value = direction === "max" ? values.at(-1) ?? null : values[0] ?? null;
  const label = direction === "max" ? "Âge maximal" : direction === "min" ? "Âge minimal" : "Âge";
  return [{
    semanticKey: `POPULATION:ELIGIBILITY:AGE:${direction.toLocaleUpperCase("fr-FR")}`,
    content: value ? `${label} : ${value} ans` : capitalize(item.content.trim()),
  }];
};

type TemporalOccurrenceRole = "INITIAL" | "FOLLOW_UP" | "WINDOW";

const temporalOccurrenceRole = (
  item: ScientificContributionItem,
  contribution: ScientificInterpretationContributionEnvelope,
): TemporalOccurrenceRole => {
  const userSource = foldedWithSeparators(contribution.source.turns
    .filter((turn) => item.epistemicBoundary.sourceTurnIds.includes(turn.turnId) && turn.role === "USER")
    .map((turn) => turn.content)
    .join(" "));
  const bareTemporalAnswer = /^(?:(?:j|jour)\s*\d+\s*(?:et|a|au|to|-|–)\s*(?:(?:j|jour)\s*)?\d+|[jmw]\s*\d+|\d+(?:[.,]\d+)?\s*(?:mois|months?|semaines?|weeks?|jours?|days?|ans?|years?))$/.test(userSource);
  if (bareTemporalAnswer) return "WINDOW";
  const localSource = foldedWithSeparators(itemScientificValueContext(item));
  const temporalSignature = localSource.match(/(?:j|jour)\s*\d+\s*(?:et|a|au|to|-|–)\s*(?:(?:j|jour)\s*)?\d+|\b[jmw]\s*\d+\b|\d+(?:[.,]\d+)?\s*(?:mois|months?|semaines?|weeks?|jours?|days?|ans?|years?)/)?.[0] ?? null;
  const sourceClause = temporalSignature
    ? userSource.split(/\b(?:puis|ensuite|then|followed by)\b/).find((clause) => clause.includes(temporalSignature)) ?? ""
    : "";
  const context = folded(`${itemScientificValueContext(item)} ${sourceClause}`);
  if (/\b(?:follow up|suivi|controle|control|subsequent|repeat)\b/.test(context)) return "FOLLOW_UP";
  if (/\b(?:initial(?:e|es|s)?|baseline|aigu|acute|depart|origine)\b/.test(context)) return "INITIAL";
  return "WINDOW";
};

const temporalModality = (context: string) => {
  if (/\b(?:irm|mri)\b/.test(context)) return "IRM";
  if (/\b(?:ct|scanner)\b/.test(context)) return "CT";
  if (/\b(?:tep|pet)\b/.test(context)) return "TEP";
  if (/\b(?:echograph|ultrasound)\b/.test(context)) return "Échographie";
  return "Mesure";
};

const timingCriterion = (item: ScientificContributionItem, sectionId: ResearchProjectSectionId, contribution: ScientificInterpretationContributionEnvelope) => {
  if (sectionId !== "TEMPORALITY") return null;
  const context = folded(itemContext(item, contribution));
  const localContext = folded(itemScientificValueContext(item));
  const localWithSeparators = foldedWithSeparators(itemScientificValueContext(item));
  const contextWithSeparators = foldedWithSeparators(itemContext(item, contribution));
  const dayRange = (value: string) => value.match(/\b(?:j|jour)\s*(\d+)\s*(?:et|a|au|to|-|–)\s*(?:(?:j|jour)\s*)?(\d+)\b/);
  const localRange = dayRange(localWithSeparators);
  const codedPoint = localWithSeparators.match(/\b([jmw])\s*(\d+)\b/);
  const duration = localContext.match(/\b(\d+(?:[.,]\d+)?)\s*(mois|month(?:s)?|semaines?|weeks?|jours?|days?|ans?|years?)\b/);
  const range = localRange ?? (duration || codedPoint ? null : dayRange(contextWithSeparators));
  if (!range && !duration && !codedPoint) return null;
  const modality = temporalModality(context);
  const modalityKey = modality === "Mesure" ? "MEASURE" : folded(modality).toLocaleUpperCase("fr-FR");
  const role = temporalOccurrenceRole(item, contribution);
  const label = role === "INITIAL" ? `${modality} initiale`
    : role === "FOLLOW_UP" ? `${modality} de suivi`
      : modality;
  const value = range
    ? `J${range[1]}–J${range[2]}`
    : duration
      ? `${duration[1]!.replace(",", ".")} ${duration[2]!.toLocaleLowerCase("fr-FR")}`
      : `${codedPoint![1]!.toLocaleUpperCase("fr-FR")}${codedPoint![2]}`;
  return {
    semanticKey: `TEMPORALITY:${modalityKey}:${role}`,
    content: `${label} : ${value}`,
  };
};

const stableSemanticIdentity = (item: ScientificContributionItem) => {
  const identity = folded(item.semanticIdentity ?? item.itemId)
    .replace(/\bj\s*\d+\b/g, " ")
    .replace(/\b\d+(?:[.,]\d+)?\b/g, " ")
    .replace(/\b(?:ans?|years?|jours?|days?)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return identity || folded(`${item.proposedType ?? "ITEM"} ${item.studyRole ?? ""}`);
};

const elementsFrom = (
  item: ScientificContributionItem,
  contribution: ScientificInterpretationContributionEnvelope,
): ResearchProjectElement[] => {
  const sectionId = sectionForContributionItem(item, contribution);
  if (!sectionId) return [];
  const age = ageCriteria(item, sectionId, contribution);
  const eventWindow = populationEventWindow(item, sectionId);
  const timing = timingCriterion(item, sectionId, contribution);
  const specialized = age.length ? age : eventWindow ? [eventWindow] : timing ? [timing] : [null];
  return specialized.map((value, index) => ({
    elementId: value && specialized.length > 1
      ? `${item.semanticIdentity ?? item.itemId}:${value.semanticKey.split(":").at(-1)?.toLocaleLowerCase("fr-FR") ?? index}`
      : item.semanticIdentity ?? item.itemId,
    semanticKey: value?.semanticKey ?? `${sectionId}:${folded(item.proposedType ?? item.studyRole ?? "ITEM")}:${stableSemanticIdentity(item)}`,
    content: value?.content ?? item.content.trim(),
    sourceItemIds: [item.itemId],
    sourceTurnIds: item.epistemicBoundary.sourceTurnIds,
    sourceProposedType: item.proposedType,
    sourceStudyRole: item.studyRole,
    sourcePolarity: item.polarity,
    disposition: "USER_CONFIRMED_PROJECT_INFORMATION",
    canonicalPromotion: "NOT_PERFORMED",
  }));
};

const elementFrom = (item: ScientificContributionItem, contribution: ScientificInterpretationContributionEnvelope) =>
  elementsFrom(item, contribution)[0] ?? null;

const semanticKeyForElement = (sectionId: ResearchProjectSectionId, element: ResearchProjectElement) => {
  if (element.semanticKey) return element.semanticKey;
  const context = folded(`${element.elementId} ${element.content} ${element.sourceProposedType ?? ""} ${element.sourceStudyRole ?? ""}`);
  if (sectionId === "POPULATION" && /\bage\b/.test(context) && /\b\d{1,3}\s*ans?\b/.test(context)) {
    const direction = /maxim|au plus/.test(context) ? "MAX" : /minim|au moins/.test(context) ? "MIN" : "CRITERION";
    return `POPULATION:ELIGIBILITY:AGE:${direction}`;
  }
  if (sectionId === "TEMPORALITY" && /\bj\s*\d+/.test(context)) {
    const role = /\b(?:follow up|suivi|controle|control)\b/.test(context) ? "FOLLOW_UP"
      : /\b(?:initial|baseline|aigu|acute)\b/.test(context) ? "INITIAL" : "WINDOW";
    return `TEMPORALITY:${/\b(?:irm|mri)\b/.test(context) ? "IRM" : "MEASURE"}:${role}`;
  }
  return `${sectionId}:${folded(element.sourceProposedType ?? element.sourceStudyRole ?? "ITEM")}:${folded(element.elementId)}`;
};

const elementValueKey = (sectionId: ResearchProjectSectionId, element: ResearchProjectElement) => {
  const context = folded(element.content);
  if (sectionId === "POPULATION" && /\bage\b/.test(context)) return context.match(/\b\d{1,3}(?:[.,]\d+)?\b/)?.[0] ?? context;
  if (sectionId === "POPULATION" && element.semanticKey?.startsWith("POPULATION:ELIGIBILITY:EVENT_WINDOW:")) {
    return element.semanticKey.split(":").slice(-3).join(":");
  }
  if (sectionId === "TEMPORALITY") {
    const range = context.match(/\bj\s*(\d+)\s*(?:et|a|-|–)\s*j\s*(\d+)\b/);
    if (range) return `j${range[1]}-j${range[2]}`;
    const duration = context.match(/\b(\d+(?:[.,]\d+)?)\s*(mois|month(?:s)?|semaines?|weeks?|jours?|days?|ans?|years?)\b/);
    if (duration) return `${duration[1]!.replace(",", ".")}-${duration[2]}`;
    const codedPoint = context.match(/\b([jmw])\s*(\d+)\b/);
    if (codedPoint) return `${codedPoint[1]}${codedPoint[2]}`;
  }
  return context;
};

const uniqueElements = (sectionId: ResearchProjectSectionId, elements: ResearchProjectElement[]) => {
  const bySemanticKey = new Map<string, ResearchProjectElement>();
  for (const element of elements) {
    const key = semanticKeyForElement(sectionId, element);
    const previous = bySemanticKey.get(key);
    bySemanticKey.set(key, previous && elementValueKey(sectionId, previous) === elementValueKey(sectionId, element) ? {
      ...previous,
      semanticKey: key,
      sourceItemIds: [...new Set([...previous.sourceItemIds, ...element.sourceItemIds])],
      sourceTurnIds: [...new Set([...previous.sourceTurnIds, ...element.sourceTurnIds])],
    } : { ...element, semanticKey: key });
  }
  return [...bySemanticKey.values()];
};

const relationElements = (contribution: ScientificInterpretationContributionEnvelope): ResearchProjectElement[] => {
  const items = new Map(contributionItems(contribution).map((item) => [item.itemId, item]));
  return contribution.scientificContent.candidateRelations
    .filter((relation) => relation.epistemicBoundary.activeState !== false && /COMPARE|COMPARISON|VERSUS/i.test(relation.relationType))
    .flatMap((relation) => {
      const source = items.get(relation.sourceItemId);
      const target = items.get(relation.targetItemId);
      if (!source || !target) return [];
      return [{
        elementId: relation.relationId,
        semanticKey: `ANALYSIS:RELATION:${folded(relation.relationId)}`,
        content: `Comparaison entre ${source.content} et ${target.content}`,
        sourceItemIds: [relation.sourceItemId, relation.targetItemId],
        sourceTurnIds: relation.epistemicBoundary.sourceTurnIds,
        sourceProposedType: "COMPARATIVE_RELATION",
        sourceStudyRole: null,
        sourcePolarity: relation.polarity,
        disposition: "USER_CONFIRMED_PROJECT_INFORMATION" as const,
        canonicalPromotion: "NOT_PERFORMED" as const,
      }];
    });
};

const projectValueElements = (contribution: ScientificInterpretationContributionEnvelope) => [
  ...contributionItems(contribution).flatMap((item) => elementsFrom(item, contribution)),
];

const sectionForElement = (element: ResearchProjectElement, contribution: ScientificInterpretationContributionEnvelope): ResearchProjectSectionId | null => {
  if (element.sourceProposedType === "COMPARATIVE_RELATION") return "ANALYSIS";
  const item = structuredProjectItems(contribution).find((candidate) => element.sourceItemIds.includes(candidate.itemId));
  return item ? sectionForContributionItem(item, contribution) : null;
};

export const researchProjectQuestionPresentation = (sections: ResearchProjectSection[]) => {
  const elements = (sectionId: ResearchProjectSectionId) => sections.find((section) => section.sectionId === sectionId)?.elements ?? [];
  const explicitQuestion = elements("QUESTION").find((element) => /SCIENTIFIC_QUESTION|RESEARCH_QUESTION/i.test(element.sourceProposedType ?? ""));
  return explicitQuestion?.content ?? "Question de recherche à préciser.";
};

const stateFor = (
  sectionId: ResearchProjectSectionId,
  elements: ResearchProjectElement[],
  contribution: ScientificInterpretationContributionEnvelope,
): ResearchProjectSectionState => {
  if (!elements.length) return "TO_CLARIFY";
  const items = contributionItems(contribution);
  if (sectionId === "ANALYSIS" && !items.some((item) => sectionForContributionItem(item, contribution) === "ANALYSIS")) return "PARTIAL";
  if (sectionId === "IMAGING") return "PARTIAL";
  if (sectionId === "BIOSPECIMENS") return "PARTIAL";
  if (sectionId === "MEASUREMENTS") return "PARTIAL";
  if (sectionId === "TEMPORALITY") return "PARTIAL";
  if (sectionId === "POPULATION") {
    const hasCriterion = items.some((item) => sectionForContributionItem(item, contribution) === "POPULATION" && /POPULATION|ELIGIBILITY|CRITERION/.test(typeOf(item)));
    return hasCriterion ? "DEFINED" : "PARTIAL";
  }
  return "DEFINED";
};

const changePresentation = (
  operation: ContributionProjectChangeOperation,
  previous: ResearchProjectElement | null,
  proposed: ResearchProjectElement | null,
) => {
  if (operation === "ADD" && proposed) return `+ ${capitalize(proposed.content)}`;
  if (operation === "REMOVE" && previous) return `− ${capitalize(previous.content)}`;
  if (operation === "REPLACE" && previous && proposed) {
    const previousParts = previous.content.split(":").map((part) => part.trim());
    const proposedParts = proposed.content.split(":").map((part) => part.trim());
    if (previousParts.length === 2 && proposedParts.length === 2 && folded(previousParts[0]) === folded(proposedParts[0])) {
      return `${proposedParts[0]} : ${previousParts[1]} → ${proposedParts[1]}`;
    }
    return `${previous.content} → ${proposed.content}`;
  }
  return proposed?.content ?? previous?.content ?? "Aucun changement";
};

const projectChange = (input: {
  operation: ContributionProjectChangeOperation;
  sectionId: ResearchProjectSectionId;
  previous: ResearchProjectElement | null;
  proposed: ResearchProjectElement | null;
  contribution: ScientificInterpretationContributionEnvelope;
  rationale: string;
}): ContributionProjectChange => {
  const semanticIdentity = input.proposed?.elementId ?? input.previous?.elementId ?? "unresolved";
  const semanticKey = input.proposed
    ? semanticKeyForElement(input.sectionId, input.proposed)
    : input.previous
      ? semanticKeyForElement(input.sectionId, input.previous)
      : `${input.sectionId}:unresolved`;
  const sourceObjectRefs = [...new Set([
    ...(input.proposed?.sourceItemIds ?? []),
    ...(input.previous?.sourceItemIds ?? []),
  ])];
  return {
    changeId: `contribution-project-change:${logicalDigest({
      operation: input.operation,
      semanticKey,
      previous: input.previous?.content ?? null,
      proposed: input.proposed?.content ?? null,
      contribution: input.contribution.identity.contributionId,
    })}`,
    operation: input.operation,
    targetSectionId: input.sectionId,
    semanticIdentity,
    semanticKey,
    previousElement: input.previous,
    proposedElement: input.proposed,
    sourceContributionRef: input.contribution.identity.contributionId,
    sourceObjectRefs,
    rationale: input.rationale,
    presentation: changePresentation(input.operation, input.previous, input.proposed),
    status: "PROPOSED",
  };
};

const latestUserTurnId = (contribution: ScientificInterpretationContributionEnvelope) => [...contribution.source.turns]
  .reverse()
  .find((turn) => turn.role === "USER")?.turnId ?? null;

const currentElements = (current: ResearchProjectOwnerProjection | null) => {
  if (!current) return [];
  const indexed = new Map<string, { sectionId: ResearchProjectSectionId; element: ResearchProjectElement }>();
  current.sections.forEach((section) => section.elements.forEach((element) => {
    indexed.set(element.elementId, { sectionId: section.sectionId, element });
  }));
  ensureCanonicalProjectState(current).objects
    .filter((object) => object.actuality === "CURRENT")
    .forEach((object) => indexed.set(object.objectId, {
      sectionId: object.sectionId,
      element: {
        ...object.projection,
        elementId: object.objectId,
        sourceProposedType: object.projection.sourceProposedType ?? object.objectType,
        sourceStudyRole: object.scientificRole,
      },
    }));
  return [...indexed.values()];
};

const temporalSemanticParts = (sectionId: ResearchProjectSectionId, element: ResearchProjectElement) => {
  if (sectionId !== "TEMPORALITY") return null;
  const match = semanticKeyForElement(sectionId, element).match(/^TEMPORALITY:([^:]+):(INITIAL|FOLLOW_UP|WINDOW)$/);
  return match ? { modality: match[1]!, role: match[2]! as TemporalOccurrenceRole } : null;
};

const sameTemporalOccurrence = (
  previous: { sectionId: ResearchProjectSectionId; element: ResearchProjectElement },
  proposed: { sectionId: ResearchProjectSectionId; element: ResearchProjectElement },
) => {
  const previousParts = temporalSemanticParts(previous.sectionId, previous.element);
  const proposedParts = temporalSemanticParts(proposed.sectionId, proposed.element);
  if (!previousParts || !proposedParts || previousParts.modality !== proposedParts.modality) return false;
  if (previousParts.role === proposedParts.role) return true;
  return previousParts.role === "WINDOW" && proposedParts.role === "INITIAL";
};

const removalTargetMatchesProjectElement = (input: {
  target: ScientificContributionItem;
  targetElement: ResearchProjectElement | null;
  targetSection: ResearchProjectSectionId | null;
  sectionId: ResearchProjectSectionId;
  element: ResearchProjectElement;
}) => {
  const refs = [input.target.itemId, input.target.semanticIdentity, ...(input.target.previousItemIds ?? [])]
    .filter((value): value is string => Boolean(value))
    .map(folded);
  const directRefs = [input.element.elementId, ...input.element.sourceItemIds].map(folded);
  if (refs.some((ref) => directRefs.includes(ref))) return true;
  if (input.targetSection !== null && input.targetSection !== input.sectionId) return false;
  if (!input.targetElement) return false;

  const targetSemanticKey = semanticKeyForElement(input.sectionId, input.targetElement);
  const projectSemanticKey = semanticKeyForElement(input.sectionId, input.element);
  if (targetSemanticKey === projectSemanticKey) return true;

  return folded(input.targetElement.content) === folded(input.element.content);
};

const buildContributionProjectChangeSet = (
  contribution: ScientificInterpretationContributionEnvelope,
  current: ResearchProjectOwnerProjection | null,
): ContributionProjectChangeSet => {
  const lastTurnId = latestUserTurnId(contribution);
  const rawSnapshot = projectValueElements(contribution)
    .flatMap((element) => {
      const sectionId = sectionForElement(element, contribution);
      return sectionId ? [{ sectionId, element: { ...element, semanticKey: semanticKeyForElement(sectionId, element) } }] : [];
    });
  const snapshot = RESEARCH_PROJECT_SECTION_ORDER.flatMap((sectionId) => uniqueElements(
    sectionId,
    rawSnapshot.filter((entry) => entry.sectionId === sectionId).map((entry) => entry.element),
  ).map((element) => ({ sectionId, element })));
  const previous = currentElements(current).map(({ sectionId, element }) => ({
    sectionId,
    element: { ...element, semanticKey: semanticKeyForElement(sectionId, element) },
  }));
  const proposedThisTurn = current
    ? snapshot.filter(({ sectionId, element }) => {
      if (lastTurnId && element.sourceTurnIds.includes(lastTurnId)) return true;
      const semanticKey = semanticKeyForElement(sectionId, element);
      return !previous.some((candidate) => candidate.sectionId === sectionId
        && semanticKeyForElement(candidate.sectionId, candidate.element) === semanticKey);
    })
    : snapshot;
  const changes: ContributionProjectChange[] = [];

  for (const proposed of proposedThisTurn) {
    const exactMatch = previous.find((candidate) => candidate.sectionId === proposed.sectionId
      && semanticKeyForElement(candidate.sectionId, candidate.element) === semanticKeyForElement(proposed.sectionId, proposed.element));
    const compatibleTemporalMatches = exactMatch ? [] : previous.filter((candidate) => sameTemporalOccurrence(candidate, proposed));
    const match = exactMatch ?? (compatibleTemporalMatches.length === 1 ? compatibleTemporalMatches[0] : undefined);
    if (!match) {
      changes.push(projectChange({ operation: "ADD", sectionId: proposed.sectionId, previous: null, proposed: proposed.element, contribution, rationale: "Nouvel objet structuré explicite absent du Project courant." }));
      continue;
    }
    const unchanged = elementValueKey(proposed.sectionId, match.element) === elementValueKey(proposed.sectionId, proposed.element)
      && folded(match.element.sourceStudyRole ?? "") === folded(proposed.element.sourceStudyRole ?? "")
      && folded(match.element.sourceProposedType ?? "") === folded(proposed.element.sourceProposedType ?? "")
      && folded(match.element.sourcePolarity ?? "") === folded(proposed.element.sourcePolarity ?? "");
    changes.push(projectChange({
      operation: unchanged ? "NO_CHANGE" : "REPLACE",
      sectionId: proposed.sectionId,
      previous: match.element,
      proposed: proposed.element,
      contribution,
      rationale: unchanged ? "La valeur sémantique est déjà active dans le Project courant." : "Une nouvelle valeur remplace la valeur active du même champ sémantique.",
    }));
  }

  if (current && lastTurnId) {
    const removalEvidence = [
      ...contribution.scientificContent.correctionsAndSupersessions,
      ...contribution.scientificContent.negationsAndConstraints,
    ].filter((item) => item.epistemicBoundary.sourceTurnIds.includes(lastTurnId));
    const removalRefs = new Set(removalEvidence.flatMap((item) => [
      item.itemId,
      item.semanticIdentity,
      ...(item.previousItemIds ?? []),
    ].filter((value): value is string => Boolean(value)).map(folded)));
    const inactiveStructured = structuredProjectItems(contribution).filter((item) => !active(item));

    const targetCandidates = inactiveStructured.filter((item) => {
      const identities = [item.itemId, item.semanticIdentity].filter((value): value is string => Boolean(value)).map(folded);
      return item.epistemicBoundary.sourceTurnIds.includes(lastTurnId)
        || identities.some((identity) => removalRefs.has(identity))
        || removalEvidence.some((evidence) => (evidence.previousItemIds ?? []).some((ref) => identities.includes(folded(ref))));
    });

    for (const evidence of removalEvidence) {
      const refs = [evidence.semanticIdentity, ...(evidence.previousItemIds ?? [])]
        .filter((value): value is string => Boolean(value))
        .map(folded);
      const direct = previous.find(({ sectionId, element }) => refs.some((ref) =>
        ref === folded(element.elementId)
        || element.sourceItemIds.some((sourceRef) => ref === folded(sourceRef))
        || ref === folded(semanticKeyForElement(sectionId, element))));
      if (direct && !targetCandidates.some((item) => direct.element.sourceItemIds.includes(item.itemId))) {
        const pseudo: ScientificContributionItem = { ...evidence, proposedType: direct.element.sourceProposedType ?? evidence.proposedType, studyRole: direct.element.sourceStudyRole ?? evidence.studyRole };
        targetCandidates.push(pseudo);
      }
    }

    for (const target of targetCandidates) {
      const targetElement = elementFrom(target, contribution);
      const targetSection = targetElement ? sectionForContributionItem(target, contribution) : null;
      const match = previous.find(({ sectionId, element }) => removalTargetMatchesProjectElement({
        target,
        targetElement,
        targetSection,
        sectionId,
        element,
      }));
      if (!match) continue;
      const alreadyReplaced = changes.some((change) => change.operation === "REPLACE" && change.previousElement?.elementId === match.element.elementId);
      const alreadyRemoved = changes.some((change) => change.operation === "REMOVE" && change.previousElement?.elementId === match.element.elementId);
      if (alreadyReplaced || alreadyRemoved) continue;
      changes.push(projectChange({ operation: "REMOVE", sectionId: match.sectionId, previous: match.element, proposed: null, contribution, rationale: "Une correction ou négation structurée retire explicitement cet élément actif." }));
    }
  }

  const effectiveChangeCount = changes.filter((change) => change.operation !== "NO_CHANGE").length;
  return {
    contract: "CONTRIBUTION_PROJECT_CHANGESET",
    contractVersion: "1.0.0",
    contractNature: "PRJ001_LEVEL_3_IMPLEMENTATION_NOT_CANONICAL_OBJECT",
    boundary: RESEARCH_PROJECT_CONTRIBUTION_BOUNDARY,
    sourceContributionRef: contribution.identity.contributionId,
    sourceContributionDigest: contribution.identity.contributionDigest,
    baseProjectVersion: current?.versionId ?? null,
    status: effectiveChangeCount ? "PENDING_HUMAN_CONFIRMATION" : "NO_NET_CHANGE",
    changes,
    effectiveChangeCount,
    noChangeExplanation: effectiveChangeCount ? null : "Cette précision ne change pas le projet actuel.",
  };
};

const applyContributionProjectChangeSet = (
  changeSet: ContributionProjectChangeSet,
  contribution: ScientificInterpretationContributionEnvelope,
  current: ResearchProjectOwnerProjection | null,
): ResearchProjectSection[] => {
  const grouped = new Map<ResearchProjectSectionId, ResearchProjectElement[]>();
  for (const id of RESEARCH_PROJECT_SECTION_ORDER) grouped.set(id, [...(current?.sections.find((section) => section.sectionId === id)?.elements ?? [])]);

  for (const change of changeSet.changes.filter((candidate) => candidate.operation !== "NO_CHANGE")) {
    const elements = grouped.get(change.targetSectionId) ?? [];
    const previousId = change.previousElement?.elementId ?? null;
    if (change.operation === "ADD") {
      if (!change.proposedElement || change.previousElement) throw new Error("PRJ_CHANGESET_INVALID_ADD");
      grouped.set(change.targetSectionId, [...elements, change.proposedElement]);
    } else if (change.operation === "REMOVE") {
      if (!change.previousElement || change.proposedElement || !elements.some((element) => element.elementId === previousId)) throw new Error("PRJ_CHANGESET_INVALID_REMOVE");
      grouped.set(change.targetSectionId, elements.filter((element) => element.elementId !== previousId));
    } else if (change.operation === "REPLACE") {
      if (!change.previousElement || !change.proposedElement || !elements.some((element) => element.elementId === previousId)) throw new Error("PRJ_CHANGESET_INVALID_REPLACE");
      grouped.set(change.targetSectionId, [...elements.filter((element) => element.elementId !== previousId), change.proposedElement]);
    }
  }

  const sections = RESEARCH_PROJECT_SECTION_ORDER.map((sectionId) => {
    const elements = uniqueElements(sectionId, grouped.get(sectionId) ?? []);
    return { sectionId, label: SECTION_LABELS[sectionId], state: stateFor(sectionId, elements, contribution), elements };
  });
  const questionIndex = sections.findIndex((section) => section.sectionId === "QUESTION");
  const explicitQuestionElements = sections[questionIndex]?.elements.filter((element) => (
    /SCIENTIFIC_QUESTION|RESEARCH_QUESTION/i.test(element.sourceProposedType ?? "")
  )) ?? [];
  sections[questionIndex] = {
    sectionId: "QUESTION",
    label: SECTION_LABELS.QUESTION,
    state: explicitQuestionElements.length ? "DEFINED" : "TO_CLARIFY",
    elements: explicitQuestionElements,
  };
  return sections;
};

const specializedResponsibilities = (
  contribution: ScientificInterpretationContributionEnvelope,
): SpecializedResponsibility[] => {
  const items = contributionItems(contribution);
  const sourceIdsFor = (sectionId: ResearchProjectSectionId) => items
    .filter((item) => sectionForContributionItem(item, contribution) === sectionId)
    .map((item) => item.itemId);
  const imagingIds = sourceIdsFor("IMAGING");
  const measurementIds = sourceIdsFor("MEASUREMENTS");
  const analysisIds = sourceIdsFor("ANALYSIS");
  return [
    {
      owner: "SCIENTIFIC_THINKING",
      state: "RETAINED_OUTSIDE_NOMINAL_UX",
      retainedResponsibility: "Questions, hypothèses et ScientificModels restent candidats tant qu’une Contribution spécialisée et une adoption mandatée ne les qualifient pas.",
      sourceItemIds: [],
    },
    {
      owner: "IMAGING",
      state: imagingIds.length ? "PENDING_SPECIALIST_CONTRIBUTION" : "NOT_TRIGGERED",
      retainedResponsibility: "Imaging conserve les MeasurementDefinitions spécialisées, l’acquisition, la qualité, la lecture, la faisabilité et les limites.",
      sourceItemIds: imagingIds,
    },
    {
      owner: "OBSERVABILITY_MEASUREMENT",
      state: measurementIds.length ? "PENDING_SPECIALIST_CONTRIBUTION" : "NOT_TRIGGERED",
      retainedResponsibility: "OBS et les domaines compétents conservent ObservableProperties, MeasurementDefinitions et BiomarkerRoles ; le Project ne les déduit pas du texte confirmé.",
      sourceItemIds: measurementIds,
    },
    {
      owner: "BIOSTATISTICS",
      state: analysisIds.length ? "PENDING_SPECIALIST_CONTRIBUTION" : "NOT_TRIGGERED",
      retainedResponsibility: "Biostatistics conserve AnalysisSpecifications, estimands, méthodes et dimensionnement.",
      sourceItemIds: analysisIds,
    },
  ];
};

const reviewOperationPrefix = (operation: "ADD" | "REMOVE" | "REPLACE") => operation === "ADD" ? "+" : operation === "REMOVE" ? "−" : "Modifier";

const HUMAN_REVIEW_RELATION_LABELS: Readonly<Record<string, string>> = Object.freeze({
  COMPARES_WITH: "comparaison avec",
  COMPARED_WITH: "comparaison avec",
  MOTIVATES_DATA_NEED: "motive ce besoin de données",
  COVERS_DATA_NEED: "couvre ce besoin de données",
  OPERATIONALIZES: "met en œuvre",
});

const humanReviewRelationLabel = (relationType: string) => HUMAN_REVIEW_RELATION_LABELS[relationType] ?? "relation avec";

const reviewReplacement = (previous: string, proposed: string) => {
  const previousParts = previous.split(":").map((part) => part.trim());
  const proposedParts = proposed.split(":").map((part) => part.trim());
  if (previousParts.length === 2 && proposedParts.length === 2 && folded(previousParts[0]!) === folded(proposedParts[0]!)) {
    return `${proposedParts[0]} : ${previousParts[1]} → ${proposedParts[1]}`;
  }
  return `${previous} → ${proposed}`;
};

const reviewObjectLabel = (object: { objectType: string; content: string; provenance: { sourceText: string | null } } | null | undefined) => {
  if (!object) return null;
  const source = object.provenance.sourceText?.trim();
  if (object.objectType === "OBJECTIVE" && source && folded(source) !== folded(object.content)) {
    return `${object.content} — formulation d’origine : ${source}`;
  }
  return object.content;
};

const humanReviewObjectSectionLabel = (objectType: string, fallback: ResearchProjectSectionId) => {
  if (objectType === "SCIENTIFIC_QUESTION") return "Question";
  if (objectType === "OBJECTIVE") return "Objectif";
  if (objectType === "HYPOTHESIS") return "Hypothèse de départ";
  if (objectType === "CONDITION") return "Pathologie / condition";
  if (["POPULATION", "ELIGIBILITY_CRITERION"].includes(objectType)) return "Population";
  if (objectType === "PROJECT_INFORMATION") return "Contexte du projet";
  if (objectType === "INTERVENTION_OR_EXPOSURE") return "Intervention / exposition";
  if (objectType === "DATA_NEED") return "Besoin de données";
  if (["ENDPOINT", "CANONICAL_VARIABLE"].includes(objectType)) return "Éléments à observer ou mesurer";
  if (objectType === "ANALYSIS_SPECIFICATION") return "Analyse";
  return SECTION_LABELS[fallback];
};

const humanReviewObjectStatus = (object: {
  content: string;
  provenance: { assertionKind: string; sourceText: string | null };
}): HumanReviewProjectionItem["statusLabel"] => {
  if (object.provenance.assertionKind === "USER_STATED") {
    const source = object.provenance.sourceText?.trim();
    return source && folded(source) !== folded(object.content) ? "Reformulé" : "Déclaré";
  }
  return "Interprété — à confirmer";
};

const humanReviewObjectSpecification = (object: {
  epistemicState: "KNOWN" | "ASSUMED" | "UNKNOWN" | "WITHHELD";
}): HumanReviewProjectionItem["specificationLabel"] => (
  object.epistemicState === "UNKNOWN" || object.epistemicState === "WITHHELD"
    ? "Détails à préciser"
    : undefined
);

const reviewTemporalAnchor = (anchor: NonNullable<CanonicalProjectChangeSet["temporalQualificationChanges"][number]["candidate"]>["anchor"]) => {
  const normalizedUnit = anchor.unit.trim().toLocaleUpperCase("fr-FR");
  const unitForms: Record<string, readonly [string, string]> = {
    DAY: ["jour", "jours"], DAYS: ["jour", "jours"], JOUR: ["jour", "jours"], JOURS: ["jour", "jours"],
    WEEK: ["semaine", "semaines"], WEEKS: ["semaine", "semaines"], SEMAINE: ["semaine", "semaines"], SEMAINES: ["semaine", "semaines"],
    MONTH: ["mois", "mois"], MONTHS: ["mois", "mois"], MOIS: ["mois", "mois"],
    YEAR: ["an", "ans"], YEARS: ["an", "ans"], AN: ["an", "ans"], ANS: ["an", "ans"],
    HOUR: ["heure", "heures"], HOURS: ["heure", "heures"], HEURE: ["heure", "heures"], HEURES: ["heure", "heures"],
    MINUTE: ["minute", "minutes"], MINUTES: ["minute", "minutes"],
  };
  const unitFor = (value: number | null) => {
    const forms = unitForms[normalizedUnit];
    return forms ? forms[value === 1 ? 0 : 1] : anchor.unit.toLocaleLowerCase("fr-FR");
  };
  const referenceLabel = anchor.reference.status === "UNKNOWN"
    ? null
    : anchor.relativeEventLabel
      ?? (anchor.reference.status === "KNOWN" ? `réf. ${anchor.reference.referenceProjectRef}` : null);
  const reference = referenceLabel
    ? `${anchor.direction === "BEFORE" ? "avant" : anchor.direction === "AFTER" ? "après" : "au moment de"} ${referenceLabel}`
    : "référentiel à préciser";
  if (anchor.kind === "WINDOW" || anchor.kind === "INTERVAL") return `${anchor.lowerBound} à ${anchor.upperBound} ${unitFor(anchor.upperBound)} (${reference})`;
  if (anchor.kind === "RELATIVE_EVENT") {
    const direction = anchor.direction === "BEFORE" ? "avant" : anchor.direction === "AFTER" ? "après" : "au moment de";
    return `${direction} ${anchor.relativeEventLabel ?? referenceLabel ?? "référentiel à préciser"}`;
  }
  const codedUnit = anchor.unit === "DAY" ? "J" : anchor.unit === "WEEK" ? "S" : anchor.unit === "MONTH" ? "M" : anchor.unit === "YEAR" ? "A" : `${anchor.unit} `;
  return `${codedUnit}${anchor.offset ?? "?"} (${reference})`;
};

const engagingCanonicalChangeRefs = (changeSet: CanonicalProjectChangeSet) => [
  ...changeSet.objectChanges.map((change) => change.changeRef),
  ...changeSet.relationChanges.map((change) => change.changeRef),
  ...changeSet.temporalQualificationChanges.map((change) => change.changeRef),
  ...changeSet.expectedVariableOccasionChanges.map((change) => change.changeRef),
  ...changeSet.legacyTemporalChanges.map((change) => change.changeRef),
];

export const validateHumanReviewProjectionCoverage = (
  changeSet: CanonicalProjectChangeSet,
  projection: Pick<HumanReviewProjection, "sections">,
): Omit<HumanReviewProjection, "contract" | "contractVersion" | "sourceChangeSetRef" | "sections" | "openPoints"> => {
  const expectedChangeRefs = engagingCanonicalChangeRefs(changeSet);
  const coveredChangeRefs = projection.sections.flatMap((section) => section.items.map((item) => item.changeRef));
  const expected = new Set(expectedChangeRefs);
  const counts = new Map<string, number>();
  coveredChangeRefs.forEach((ref) => counts.set(ref, (counts.get(ref) ?? 0) + 1));
  const missingChangeRefs = expectedChangeRefs.filter((ref) => !counts.has(ref));
  const unexpectedChangeRefs = [...counts.keys()].filter((ref) => !expected.has(ref));
  const duplicateChangeRefs = [...counts.entries()].filter(([, count]) => count !== 1).map(([ref]) => ref);
  const applicable = changeSet.status === "READY_FOR_HUMAN_DECISION" && expectedChangeRefs.length > 0;
  return {
    status: !applicable ? "NOT_APPLICABLE" : missingChangeRefs.length || unexpectedChangeRefs.length || duplicateChangeRefs.length ? "INCOMPLETE" : "COMPLETE",
    expectedChangeRefs,
    coveredChangeRefs,
    missingChangeRefs,
    unexpectedChangeRefs,
    duplicateChangeRefs,
  };
};

const INITIAL_HUMAN_REVIEW_OPEN_SECTIONS = new Set<ResearchProjectSectionId>([
  "QUESTION",
  "POPULATION",
  "DESIGN",
  "IMAGING",
  "MEASUREMENTS",
  "TEMPORALITY",
  "ANALYSIS",
]);

const HUMAN_REVIEW_OPEN_POINT_LABELS: Readonly<Partial<Record<ResearchProjectSectionId, string>>> = Object.freeze({
  QUESTION: "question de recherche",
  POPULATION: "population précise",
  DESIGN: "design de l’étude",
  IMAGING: "imagerie",
  MEASUREMENTS: "mesures et critère principal",
  TEMPORALITY: "temporalité",
  ANALYSIS: "analyse",
});

const lowerInitial = (value: string) => value.length ? `${value[0]!.toLocaleLowerCase("fr-FR")}${value.slice(1)}` : value;

const buildHumanReviewOpenPoints = (
  sections: readonly HumanReviewProjectionSection[],
  proposedSections: readonly ResearchProjectSection[],
): HumanReviewOpenPoint[] => {
  const sectionState = new Map(proposedSections.map((section) => [section.sectionId, section] as const));
  const specific = sections.flatMap((section) => section.items.flatMap((item): HumanReviewOpenPoint[] => {
    if (!item.specificationLabel || !item.projectSectionId) return [];
    const projectSection = sectionState.get(item.projectSectionId);
    return [{
      openPointRef: `open-point:${item.changeRef}`,
      projectSectionId: item.projectSectionId,
      content: `${item.content} — ${item.specificationLabel.toLocaleLowerCase("fr-FR")}`,
      source: "OBJECT_SPECIFICATION",
      sectionState: projectSection?.state ?? "PARTIAL",
      knownContentPresent: true,
      sourceChangeRefs: [item.changeRef],
    }];
  }));
  const specificallyRepresentedSections = new Set(specific.map((point) => point.projectSectionId));
  const broad = proposedSections.flatMap((section): HumanReviewOpenPoint[] => {
    if (!INITIAL_HUMAN_REVIEW_OPEN_SECTIONS.has(section.sectionId) || section.state === "DEFINED") return [];
    if (specificallyRepresentedSections.has(section.sectionId)) return [];
    const knownContentPresent = section.elements.length > 0 || sections.some((reviewSection) => (
      reviewSection.items.some((item) => item.projectSectionId === section.sectionId)
    ));
    const sectionLabel = HUMAN_REVIEW_OPEN_POINT_LABELS[section.sectionId] ?? lowerInitial(section.label);
    return [{
      openPointRef: `open-point:section:${section.sectionId.toLocaleLowerCase("fr-FR")}`,
      projectSectionId: section.sectionId,
      content: knownContentPresent
        ? `${sectionLabel} — éléments compris, détails à préciser`
        : sectionLabel,
      source: "SECTION_COMPLETENESS",
      sectionState: section.state,
      knownContentPresent,
      sourceChangeRefs: [],
    }];
  });
  return [...new Map([...specific, ...broad].map((point) => [point.openPointRef, point])).values()];
};

export const buildHumanReviewProjection = (
  changeSet: CanonicalProjectChangeSet,
  current: ResearchProjectOwnerProjection | null,
  proposedSections: readonly ResearchProjectSection[] = [],
): HumanReviewProjection => {
  const currentState = current ? ensureCanonicalProjectState(current) : null;
  const objectLabels = new Map<string, string>(currentState?.objects
    .filter((object) => object.actuality === "CURRENT")
    .map((object) => [object.objectId, object.content] as const) ?? []);
  changeSet.objectChanges.forEach((change) => {
    if (change.candidate) objectLabels.set(change.objectId, change.candidate.content);
  });
  const grouped = new Map<string, HumanReviewProjectionItem[]>();
  const add = (label: string, item: HumanReviewProjectionItem) => grouped.set(label, [...(grouped.get(label) ?? []), item]);
  const previousObject = (objectId: string) => currentState?.objects.find((object) => object.objectId === objectId && object.actuality === "CURRENT") ?? null;
  const previousRelation = (relationId: string) => currentState?.relations.find((relation) => relation.relationId === relationId && relation.actuality === "CURRENT") ?? null;
  const previousTemporal = (qualificationId: string) => currentState?.temporalQualifications.find((item) => item.qualificationId === qualificationId && item.actuality === "CURRENT") ?? null;
  const previousOccasion = (occasionId: string) => currentState?.expectedVariableOccasions.find((item) => item.occasionId === occasionId && item.actuality === "CURRENT") ?? null;
  const previousLegacyTemporal = (objectId: string, versionRef: string | null) => currentState?.legacyTemporalObjects.find((item) => (
    versionRef ? item.legacyObject.objectVersionId === versionRef : item.legacyObject.objectId === objectId && item.legacyObject.actuality === "CURRENT"
  ))?.legacyObject ?? null;
  const initialStructure = changeSet.baseProjectVersion === null;

  changeSet.objectChanges.forEach((change) => {
    const previous = previousObject(change.objectId);
    const sectionId = change.candidate?.sectionId ?? previous?.sectionId ?? "ANALYSIS";
    const next = change.candidate;
    const previousLabel = reviewObjectLabel(previous) ?? change.objectId;
    const nextLabel = reviewObjectLabel(next) ?? change.objectId;
    const content = change.operation === "REMOVE"
      ? `${reviewOperationPrefix(change.operation)} ${capitalize(previousLabel)}`
      : change.operation === "REPLACE" && previous
        ? `${reviewReplacement(previousLabel, nextLabel)}${previous.scientificRole !== next?.scientificRole ? ` (rôle : ${previous.scientificRole ?? "aucun"} → ${next?.scientificRole ?? "aucun"})` : ""}`
        : `${initialStructure ? "" : `${reviewOperationPrefix(change.operation)} `}${initialStructure ? nextLabel : capitalize(nextLabel)}${!initialStructure && next?.scientificRole ? ` (rôle : ${next.scientificRole})` : ""}`;
    const representedObject = next ?? previous;
    add(humanReviewObjectSectionLabel(representedObject?.objectType ?? "", sectionId), {
      reviewItemRef: `review:${change.changeRef}`,
      changeRef: change.changeRef,
      changeKind: "OBJECT",
      operation: change.operation,
      content,
      statusLabel: representedObject ? humanReviewObjectStatus(representedObject) : undefined,
      specificationLabel: representedObject ? humanReviewObjectSpecification(representedObject) : undefined,
      projectSectionId: sectionId,
    });
  });

  changeSet.relationChanges.forEach((change) => {
    const relation = change.candidate ?? previousRelation(change.relationId);
    const content = relation
      ? `${reviewOperationPrefix(change.operation)} ${objectLabels.get(relation.sourceObjectRef) ?? relation.sourceObjectRef} — ${humanReviewRelationLabel(relation.relationType)} → ${objectLabels.get(relation.targetObjectRef) ?? relation.targetObjectRef}`
      : `${reviewOperationPrefix(change.operation)} relation ${change.relationId}`;
    add("Relations", { reviewItemRef: `review:${change.changeRef}`, changeRef: change.changeRef, changeKind: "RELATION", operation: change.operation, content });
  });

  changeSet.temporalQualificationChanges.forEach((change) => {
    const qualification = change.candidate ?? previousTemporal(change.qualificationId);
    const content = qualification
      ? `${reviewOperationPrefix(change.operation)} ${objectLabels.get(qualification.subjectProjectRef) ?? qualification.subjectProjectRef} : ${reviewTemporalAnchor(qualification.anchor)}`
      : `${reviewOperationPrefix(change.operation)} temporalité ${change.qualificationId}`;
    add("Temporalité", { reviewItemRef: `review:${change.changeRef}`, changeRef: change.changeRef, changeKind: "TEMPORAL_QUALIFICATION", operation: change.operation, content, projectSectionId: "TEMPORALITY" });
  });

  changeSet.expectedVariableOccasionChanges.forEach((change) => {
    const occasion = change.candidate ?? previousOccasion(change.occasionId);
    const content = occasion
      ? `${reviewOperationPrefix(change.operation)} ${objectLabels.get(occasion.variableProjectRef) ?? occasion.variableProjectRef} attendu : ${reviewTemporalAnchor(occasion.anchor)}`
      : `${reviewOperationPrefix(change.operation)} occasion attendue ${change.occasionId}`;
    add("Temporalité", { reviewItemRef: `review:${change.changeRef}`, changeRef: change.changeRef, changeKind: "EXPECTED_VARIABLE_OCCASION", operation: change.operation, content, projectSectionId: "TEMPORALITY" });
  });

  changeSet.legacyTemporalChanges.forEach((change) => {
    const previous = previousLegacyTemporal(change.legacyObjectId, change.previousVersionRef);
    const proposed = change.candidate?.projection.content ?? change.candidate?.content ?? null;
    const content = change.operation === "REMOVE"
      ? `${reviewOperationPrefix(change.operation)} ${capitalize(previous?.projection.content ?? previous?.content ?? change.legacyObjectId)}`
      : change.operation === "REPLACE" && previous && proposed
        ? reviewReplacement(previous.projection.content, proposed)
        : `${reviewOperationPrefix(change.operation)} ${capitalize(proposed ?? change.legacyObjectId)}`;
    add("Temporalité", {
      reviewItemRef: `review:${change.changeRef}`,
      changeRef: change.changeRef,
      changeKind: "LEGACY_TEMPORAL",
      operation: change.operation,
      content,
      projectSectionId: "TEMPORALITY",
    });
  });

  const sections = [...grouped.entries()].map(([label, items]) => ({ sectionRef: `review-section:${folded(label)}`, label, items }));
  const coverage = validateHumanReviewProjectionCoverage(changeSet, { sections });
  return {
    contract: "PRJ001_HUMAN_REVIEW_PROJECTION",
    contractVersion: HUMAN_REVIEW_PROJECTION_VERSION,
    sourceChangeSetRef: changeSet.sourceContributionRef,
    sections,
    openPoints: buildHumanReviewOpenPoints(sections, proposedSections),
    ...coverage,
  };
};

export const emptyResearchProjectSections = (): ResearchProjectSection[] => RESEARCH_PROJECT_SECTION_ORDER.map((sectionId) => ({
  sectionId,
  label: SECTION_LABELS[sectionId],
  state: "TO_CLARIFY",
  elements: [],
}));

export const prepareResearchProjectContributionCandidate = (
  contribution: ScientificInterpretationContributionEnvelope,
  current: ResearchProjectOwnerProjection | null,
): ResearchProjectContributionCandidate => {
  const changeSet = buildContributionProjectChangeSet(contribution, current);
  const canonicalChangeSet = buildCanonicalProjectChangeSet({
    contribution,
    sectionChangeSet: changeSet,
    current: current ? ensureCanonicalProjectState(current) : null,
  });
  const proposedSections = applyContributionProjectChangeSet(changeSet, contribution, current);
  const humanReviewProjection = buildHumanReviewProjection(canonicalChangeSet, current, proposedSections);
  const status: ResearchProjectContributionCandidate["status"] = canonicalChangeSet.status === "NO_NET_CHANGE"
    ? "NO_NET_CHANGE"
    : canonicalChangeSet.status === "BLOCKED_BY_STRUCTURAL_CONFLICT"
      ? "BLOCKED_BY_STRUCTURAL_CONFLICT"
      : humanReviewProjection.status === "COMPLETE"
        ? "CANDIDATE_PENDING_HUMAN_CONFIRMATION"
        : "REVIEW_PROJECTION_INCOMPLETE";
  return {
    boundary: RESEARCH_PROJECT_CONTRIBUTION_BOUNDARY,
    status,
    projectWriteAuthorized: false,
    contributionRef: contribution.identity.contributionId,
    contributionDigest: contribution.identity.contributionDigest,
    changeSet,
    canonicalChangeSet,
    humanReviewProjection,
    proposedSections,
    specializedResponsibilities: specializedResponsibilities(contribution),
  };
};

export const confirmResearchProjectContribution = (input: {
  contribution: ScientificInterpretationContributionEnvelope;
  current: ResearchProjectOwnerProjection | null;
  projectId: string;
  authority: ResearchProjectOwnerAuthority;
  confirmedAt: string;
  reviewedProjection?: HumanReviewProjection;
}): ResearchProjectOwnerProjection => {
  const candidate = prepareResearchProjectContributionCandidate(input.contribution, input.current);
  if (candidate.changeSet.effectiveChangeCount === 0 && candidate.canonicalChangeSet.status === "NO_NET_CHANGE") {
    if (input.current) return input.current;
    throw new Error("PRJ_CONTRIBUTION_NO_PROJECT_CHANGE");
  }
  if (candidate.canonicalChangeSet.status === "BLOCKED_BY_STRUCTURAL_CONFLICT") {
    throw new Error("PRJ_CONFLICTING_ADOPTED_STATE_REQUIRES_EXPLICIT_REPLACEMENT");
  }
  const reviewedProjection = input.reviewedProjection ?? candidate.humanReviewProjection;
  const reviewCoverage = validateHumanReviewProjectionCoverage(candidate.canonicalChangeSet, reviewedProjection);
  if (reviewCoverage.status !== "COMPLETE") throw new Error("REVIEW_PROJECTION_INCOMPLETE");
  const revision = (input.current?.revision ?? 0) + 1;
  const versionId = `${input.projectId}:version:${revision}`;
  const pendingDecision = createHumanDecisionCandidate({
    decisionId: `project-contribution-decision:${logicalDigest({ projectId: input.projectId, contributionRef: candidate.contributionRef, revision })}`,
    gateId: "PRJ-CONTRIBUTION-INTAKE",
    scope: ["RESEARCH_PROJECT", "USER_CONFIRMED_PROJECT_INFORMATION"],
    targets: [candidate.contributionRef, ...candidate.changeSet.changes
      .filter((change) => change.operation !== "NO_CHANGE")
      .flatMap((change) => change.sourceObjectRefs)],
    reason: "Confirmation explicite de la Contribution comme information de travail du Research Project, sans promotion d’objet scientifique V2.",
    provenance: [candidate.contributionRef, input.contribution.identity.contributionDigest, ...input.contribution.source.sourceRefs],
    engineSource: "RESEARCH_PROJECT",
    projectVersion: versionId,
  });
  const confirmationDecision = engageHumanDecision(pendingDecision, {
    status: "ADOPTED",
    actor: input.authority.actorRef,
    mandate: input.authority.mandateRef,
    reason: "L’utilisateur a activé « Cela correspond à mon projet » dans la session de travail courante.",
    timestamp: input.confirmedAt,
  });
  if (confirmationDecision.status !== "ADOPTED") throw new Error("PRJ_CONTRIBUTION_CONFIRMATION_AUTHORITY_REQUIRED");

  const canonicalState = applyCanonicalProjectChangeSet({
    current: input.current ? ensureCanonicalProjectState(input.current) : null,
    changeSet: candidate.canonicalChangeSet,
    projectId: input.projectId,
    versionId,
    revision,
    contribution: input.contribution,
    decision: confirmationDecision,
    decidedAt: input.confirmedAt,
  });
  const projectedSections = projectSectionsFromCanonicalState(canonicalState, candidate.proposedSections);

  const projectDigest = logicalDigest({
    projectId: input.projectId,
    versionId,
    previousVersionId: input.current?.versionId ?? null,
    contributionDigest: candidate.contributionDigest,
    changeSet: candidate.changeSet,
    canonicalState,
    sections: projectedSections,
    decisionId: confirmationDecision.decisionId,
  });
  return {
    contract: "RESEARCH_PROJECT_CONSTRUCTION_OWNER_PROJECTION",
    contractVersion: RESEARCH_PROJECT_CONSTRUCTION_VERSION,
    contractNature: "PRJ001_MINIMAL_OWNER_ADAPTER_NOT_PD003_V2_ROOT",
    boundary: RESEARCH_PROJECT_CONTRIBUTION_BOUNDARY,
    pd003V2Compatibility: "COMPATIBLE_IN_PRINCIPLE_ADAPTATION_REQUIRED",
    canonicalV2Status: "NO_SCIENTIFIC_OBJECT_PROMOTION_CLAIMED",
    canonicalBackboneStatus: "PRJ_OWNED_CANONICAL_PROJECT_BACKBONE_ACTIVE",
    contractAdaptation: PRJ001_CONTRIBUTION_INTAKE_GAP,
    projectId: input.projectId,
    versionId,
    projectDigest,
    revision,
    contributionRef: candidate.contributionRef,
    contributionDigest: candidate.contributionDigest,
    previousVersionId: input.current?.versionId ?? null,
    adoptedAt: input.confirmedAt,
    owner: "RESEARCH_PROJECT",
    confirmationDecision,
    llmProjectWrites: 0,
    sections: projectedSections,
    specializedResponsibilities: candidate.specializedResponsibilities,
    appliedChangeSet: candidate.changeSet,
    canonicalState,
  };
};

export const rejectResearchProjectContribution = (input: {
  contribution: ScientificInterpretationContributionEnvelope;
  current: ResearchProjectOwnerProjection | null;
  authority: ResearchProjectOwnerAuthority;
  rejectedAt: string;
}): HumanDecisionEnvelope => {
  const candidate = prepareResearchProjectContributionCandidate(input.contribution, input.current);
  const pendingDecision = createHumanDecisionCandidate({
    decisionId: `project-contribution-decision:${logicalDigest({
      contributionRef: candidate.contributionRef,
      baseProjectVersion: candidate.changeSet.baseProjectVersion,
      disposition: "REJECTED",
    })}`,
    gateId: "PRJ-CONTRIBUTION-INTAKE",
    scope: ["RESEARCH_PROJECT", "USER_CONFIRMED_PROJECT_INFORMATION"],
    targets: [candidate.contributionRef, ...candidate.changeSet.changes
      .filter((change) => change.operation !== "NO_CHANGE")
      .flatMap((change) => change.sourceObjectRefs)],
    reason: "Rejet explicite de la Contribution candidate. Le Research Project reste inchangé.",
    provenance: [candidate.contributionRef, input.contribution.identity.contributionDigest, ...input.contribution.source.sourceRefs],
    engineSource: "RESEARCH_PROJECT",
    projectVersion: input.current?.versionId ?? null,
  });
  const decision = engageHumanDecision(pendingDecision, {
    status: "REJECTED",
    actor: input.authority.actorRef,
    mandate: input.authority.mandateRef,
    reason: "L’utilisateur a refusé la proposition dans la session de travail courante.",
    timestamp: input.rejectedAt,
  });
  if (decision.status !== "REJECTED") throw new Error("PRJ_CONTRIBUTION_REJECTION_AUTHORITY_REQUIRED");
  return decision;
};

/**
 * PRJ-owned authorization for a passive document projection of one exact Project version.
 * It does not freeze or mutate the adopted Project; the consumer adapter may only use it
 * to satisfy the historical PRJ-001 document handoff contract for this immutable snapshot.
 */
export const authorizeResearchProjectDocumentHandoff = (input: {
  project: ResearchProjectOwnerProjection;
  authority: ResearchProjectOwnerAuthority;
  confirmedAt: string;
}): HumanDecisionEnvelope => {
  const candidate = createHumanDecisionCandidate({
    decisionId: `project-document-handoff:${logicalDigest({
      projectId: input.project.projectId,
      versionId: input.project.versionId,
      projectDigest: input.project.projectDigest,
    })}`,
    gateId: "PRJ-GATE-DOCUMENT-WORKING-PROJECTION",
    scope: ["RESEARCH_PROJECT", "DOCUMENT_HANDOFF", "PROTOCOL_WORKING_PROJECTION"],
    targets: [input.project.projectId, input.project.versionId, input.project.projectDigest],
    reason: "Autorisation explicite d’utiliser cette version du Research Project pour produire une projection documentaire de travail en lecture seule.",
    provenance: [
      input.project.projectId,
      input.project.versionId,
      input.project.projectDigest,
      `decision:${input.project.confirmationDecision.decisionId}`,
    ],
    engineSource: "RESEARCH_PROJECT",
    projectVersion: input.project.versionId,
  });
  const decision = engageHumanDecision(candidate, {
    status: "ADOPTED",
    actor: input.authority.actorRef,
    mandate: input.authority.mandateRef,
    reason: "L’utilisateur a choisi de produire une version de travail du protocole depuis la version courante du Project.",
    timestamp: input.confirmedAt,
  });
  if (decision.status !== "ADOPTED") throw new Error("PRJ_DOCUMENT_HANDOFF_AUTHORITY_REQUIRED");
  return decision;
};
