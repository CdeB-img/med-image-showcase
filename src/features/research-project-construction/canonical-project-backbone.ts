import { logicalDigest } from "../knowledge-engine/canonical.js";
import type { HumanDecisionEnvelope } from "../protocol-designer/human-decision.js";
import type {
  ScientificContributionItem,
  ScientificInterpretationContributionEnvelope,
} from "../scientific-interpretation/contracts.js";
import type {
  ContributionProjectChangeSet,
  ResearchProjectElement,
  ResearchProjectOwnerProjection,
  ResearchProjectSection,
  SpecializedResponsibility,
} from "./contribution-owner-boundary.js";
import {
  projectSectionForGovernedStudyRole,
  type ResearchProjectSectionId,
} from "./project-section-projection.js";

export const CANONICAL_RESEARCH_PROJECT_STATE_CONTRACT = "PRJ001_CANONICAL_RESEARCH_PROJECT_STATE" as const;
export const CANONICAL_RESEARCH_PROJECT_STATE_VERSION = "0.2.0" as const;

export const CANONICAL_PROJECT_OBJECT_TYPES = [
  "SCIENTIFIC_QUESTION",
  "OBJECTIVE",
  "HYPOTHESIS",
  "CONDITION",
  "POPULATION",
  "ELIGIBILITY_CRITERION",
  "STUDY_DESIGN",
  "GROUP",
  "INTERVENTION_OR_EXPOSURE",
  "ENDPOINT",
  "CANONICAL_VARIABLE",
  "IMAGING_MODALITY",
  "ACQUISITION",
  "VISIT",
  "CONSTRAINT",
  "ANALYSIS_SPECIFICATION",
  "DATA_NEED",
  "UNCERTAINTY",
  "CONTRADICTION",
  "PROJECT_INFORMATION",
] as const;

export type CanonicalProjectObjectType = typeof CANONICAL_PROJECT_OBJECT_TYPES[number];
export type CanonicalProjectActuality = "CURRENT" | "SUPERSEDED";
export type CanonicalProjectEpistemicState = "KNOWN" | "ASSUMED" | "UNKNOWN" | "WITHHELD";

export const CANONICAL_PROJECT_TEMPORAL_ROLES = [
  "ACQUISITION_TIME",
  "COLLECTION_TIME",
  "PROCESSING_TIME",
  "TRANSFORMATION_TIME",
  "ANALYSIS_TIME",
] as const;

export type CanonicalProjectTemporalRole = typeof CANONICAL_PROJECT_TEMPORAL_ROLES[number];
export type CanonicalTemporalAnchorKind = "TIMEPOINT" | "RELATIVE_EVENT" | "WINDOW" | "INTERVAL";
export type CanonicalTemporalDirection = "BEFORE" | "AT" | "AFTER" | "UNKNOWN";

export type CanonicalTemporalReference =
  | {
    status: "KNOWN";
    referenceProjectRef: string;
    relationType: "ANCHORED_TO";
  }
  | {
    status: "UNKNOWN";
    unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" | "REFERENCE_EVENT_AMBIGUOUS" | "LEGACY_MAPPING_REQUIRED";
  };

export type CanonicalProjectProvenance = {
  sourcePlan: "USER" | "ASSISTANT_PROPOSAL" | "OWNER_CONTRIBUTION" | "LEGACY_BRIDGE_STATE";
  assertionKind: "USER_STATED" | "USER_ADOPTED_PROPOSAL" | "OWNER_SUPPORTED" | "LEGACY_MIGRATED";
  sourceTurnRefs: string[];
  sourceText: string | null;
  proposalSourceTurnRefs: string[];
  adoptionSourceTurnRefs: string[];
  evidenceRefs: string[];
  evidenceQualification: "NOT_EVALUATED" | "REFERENCES_PRESENT_NOT_VERIFIED";
};

/**
 * PD-003 V2 value object. It has no autonomous Project lifecycle: its history
 * is governed by the qualification or expected occasion that owns it.
 */
export type CanonicalTemporalAnchorValue = {
  valueType: "TEMPORAL_ANCHOR_VALUE";
  kind: CanonicalTemporalAnchorKind;
  direction: CanonicalTemporalDirection;
  unit: string;
  offset: number | null;
  lowerBound: number | null;
  upperBound: number | null;
  relativeEventLabel: string | null;
  tolerance: null | {
    lower: number | null;
    upper: number | null;
    unit: string;
  };
  reference: CanonicalTemporalReference;
  provenance: CanonicalProjectProvenance;
};

export type CanonicalTemporalQualificationVersion = {
  qualificationId: string;
  qualificationVersionId: string;
  version: number;
  subjectProjectRef: string;
  temporalRole: CanonicalProjectTemporalRole;
  anchor: CanonicalTemporalAnchorValue;
  adoptionStatus: "ADOPTED_BY_HUMAN_DECISION";
  actuality: CanonicalProjectActuality;
  supersedesVersionRef: string | null;
  supersededByVersionRef: string | null;
  provenance: CanonicalProjectProvenance;
  decisionRefs: string[];
  sourceContributionRef: string;
  adoptedAt: string;
};

export type CanonicalExpectedVariableOccasionVersion = {
  occasionId: string;
  occasionVersionId: string;
  version: number;
  relationType: "EXPECTED_AT";
  variableProjectRef: string;
  anchor: CanonicalTemporalAnchorValue;
  studyUnitOrGroupRef: string | null;
  applicableContext: string | null;
  expectedStatus: "EXPECTED_NOT_REALIZED";
  adoptionStatus: "ADOPTED_BY_HUMAN_DECISION";
  actuality: CanonicalProjectActuality;
  supersedesVersionRef: string | null;
  supersededByVersionRef: string | null;
  provenance: CanonicalProjectProvenance;
  decisionRefs: string[];
  sourceContributionRef: string;
  adoptedAt: string;
};

export type LegacyTemporalProjectObject = {
  legacyObject: Omit<CanonicalProjectObjectVersion, "objectType"> & { objectType: "TEMPORAL_ANCHOR" };
  mappingStatus: "NEW_MAPPING_REQUIRED";
  reason: "LEGACY_TEMPORAL_ROOT_OBJECT_HAS_NO_SAFE_AUTOMATIC_OWNER_MAPPING";
};

export type CanonicalProjectObjectVersion = {
  objectId: string;
  objectVersionId: string;
  version: number;
  objectType: CanonicalProjectObjectType;
  sectionId: ResearchProjectSectionId;
  content: string;
  scientificRole: string | null;
  semanticKey: string;
  epistemicState: CanonicalProjectEpistemicState;
  adoptionStatus: "ADOPTED_BY_HUMAN_DECISION";
  actuality: CanonicalProjectActuality;
  coherence: "CONSISTENT" | "CONFLICTING";
  supersedesVersionRef: string | null;
  supersededByVersionRef: string | null;
  provenance: CanonicalProjectProvenance;
  decisionRefs: string[];
  sourceContributionRef: string;
  sourceItemRefs: string[];
  adoptedAt: string;
  projection: ResearchProjectElement;
};

export type CanonicalProjectRelationVersion = {
  relationId: string;
  relationVersionId: string;
  version: number;
  relationType: string;
  sourceObjectRef: string;
  targetObjectRef: string;
  polarity: string | null;
  epistemicState: CanonicalProjectEpistemicState;
  adoptionStatus: "ADOPTED_BY_HUMAN_DECISION";
  actuality: CanonicalProjectActuality;
  coherence: "CONSISTENT" | "CONFLICTING";
  supersedesVersionRef: string | null;
  supersededByVersionRef: string | null;
  provenance: CanonicalProjectProvenance;
  decisionRefs: string[];
  sourceContributionRef: string;
  adoptedAt: string;
};

export type CanonicalProjectConflict = {
  conflictId: string;
  code:
    | "CONFLICTING_ADOPTED_STATE"
    | "PROJECT_RELATION_ENDPOINT_NOT_FOUND"
    | "TEMPORAL_SUBJECT_NOT_FOUND"
    | "TEMPORAL_QUALIFICATION_NOT_FOUND"
    | "TEMPORAL_REFERENCE_NOT_FOUND"
    | "TEMPORAL_ANCHOR_INVALID"
    | "TEMPORAL_ROLE_SUBJECT_MISMATCH"
    | "EXPECTED_AT_SOURCE_NOT_CANONICAL_VARIABLE"
    | "EXPECTED_VARIABLE_OCCASION_NOT_FOUND"
    | "EXPECTED_OCCASION_CONTEXT_REF_NOT_FOUND";
  message: string;
  existingRefs: string[];
  candidateRefs: string[];
  status: "BLOCKING";
};

export type CanonicalProjectObjectChange = {
  changeRef: string;
  operation: "ADD" | "REMOVE" | "REPLACE";
  objectId: string;
  previousVersionRef: string | null;
  candidate: Omit<CanonicalProjectObjectVersion,
    "objectVersionId" | "version" | "adoptionStatus" | "actuality" | "coherence" |
    "supersedesVersionRef" | "supersededByVersionRef" | "decisionRefs" | "adoptedAt"> | null;
};

export type CanonicalProjectRelationChange = {
  changeRef: string;
  operation: "ADD" | "REMOVE" | "REPLACE";
  relationId: string;
  previousVersionRef: string | null;
  candidate: Omit<CanonicalProjectRelationVersion,
    "relationVersionId" | "version" | "adoptionStatus" | "actuality" | "coherence" |
    "supersedesVersionRef" | "supersededByVersionRef" | "decisionRefs" | "adoptedAt"> | null;
};

export type CanonicalTemporalQualificationChange = {
  changeRef: string;
  operation: "ADD" | "REMOVE" | "REPLACE";
  qualificationId: string;
  previousVersionRef: string | null;
  candidate: Omit<CanonicalTemporalQualificationVersion,
    "qualificationVersionId" | "version" | "adoptionStatus" | "actuality" |
    "supersedesVersionRef" | "supersededByVersionRef" | "decisionRefs" | "adoptedAt"> | null;
};

export type CanonicalExpectedVariableOccasionChange = {
  changeRef: string;
  operation: "ADD" | "REMOVE" | "REPLACE";
  occasionId: string;
  previousVersionRef: string | null;
  candidate: Omit<CanonicalExpectedVariableOccasionVersion,
    "occasionVersionId" | "version" | "adoptionStatus" | "actuality" |
    "supersedesVersionRef" | "supersededByVersionRef" | "decisionRefs" | "adoptedAt"> | null;
};

export type LegacyTemporalProjectChange = {
  changeRef: string;
  operation: "ADD" | "REMOVE" | "REPLACE";
  legacyObjectId: string;
  previousVersionRef: string | null;
  candidate: Omit<LegacyTemporalProjectObject["legacyObject"],
    "objectVersionId" | "version" | "adoptionStatus" | "actuality" | "coherence" |
    "supersedesVersionRef" | "supersededByVersionRef" | "decisionRefs" | "adoptedAt"> | null;
};

export type CanonicalTemporalQualificationProposal = {
  operation: "ADD" | "REMOVE" | "REPLACE";
  qualificationId: string;
  subjectProjectRef: string;
  temporalRole: CanonicalProjectTemporalRole;
  anchor: CanonicalTemporalAnchorValue | null;
  provenance: CanonicalProjectProvenance;
  sourceContributionRef: string;
};

export type CanonicalExpectedVariableOccasionProposal = {
  operation: "ADD" | "REMOVE" | "REPLACE";
  occasionId: string;
  variableProjectRef: string;
  anchor: CanonicalTemporalAnchorValue | null;
  studyUnitOrGroupRef: string | null;
  applicableContext: string | null;
  provenance: CanonicalProjectProvenance;
  sourceContributionRef: string;
};

export type CanonicalProjectChangeSet = {
  contract: "PRJ001_CANONICAL_PROJECT_CHANGESET";
  contractVersion: typeof CANONICAL_RESEARCH_PROJECT_STATE_VERSION;
  sourceContributionRef: string;
  baseProjectVersion: string | null;
  status: "READY_FOR_HUMAN_DECISION" | "NO_NET_CHANGE" | "BLOCKED_BY_STRUCTURAL_CONFLICT";
  objectChanges: CanonicalProjectObjectChange[];
  relationChanges: CanonicalProjectRelationChange[];
  temporalQualificationChanges: CanonicalTemporalQualificationChange[];
  expectedVariableOccasionChanges: CanonicalExpectedVariableOccasionChange[];
  legacyTemporalChanges: LegacyTemporalProjectChange[];
  conflicts: CanonicalProjectConflict[];
};

export type CanonicalProjectDecisionLedgerEntry = {
  ledgerEntryId: string;
  sourceContributionRef: string;
  sourceTurnRefs: string[];
  candidateChangeRefs: string[];
  operationSummary: Array<"ADD" | "REMOVE" | "REPLACE">;
  objectRefs: string[];
  relationRefs: string[];
  temporalQualificationRefs: string[];
  expectedVariableOccasionRefs: string[];
  legacyTemporalRefs: string[];
  previousRefs: string[];
  temporalChanges: Array<{
    changeRef: string;
    subjectProjectRef: string;
    temporalRole: CanonicalProjectTemporalRole;
    previousVersionRef: string | null;
    candidateAnchor: CanonicalTemporalAnchorValue | null;
    resultingVersionRef: string | null;
  }>;
  expectedOccasionChanges: Array<{
    changeRef: string;
    variableProjectRef: string;
    previousVersionRef: string | null;
    candidateAnchor: CanonicalTemporalAnchorValue | null;
    resultingVersionRef: string | null;
  }>;
  humanDecisionRef: string;
  humanActorRef: string;
  humanMandateRef: string;
  resultingProjectVersion: string;
  decidedAt: string;
};

export type CanonicalProjectVersionRecord = {
  versionId: string;
  previousVersionId: string | null;
  revision: number;
  objectVersionRefs: string[];
  relationVersionRefs: string[];
  temporalQualificationVersionRefs: string[];
  expectedVariableOccasionVersionRefs: string[];
  legacyTemporalVersionRefs: string[];
  decisionRefs: string[];
  sourceContributionRef: string;
  createdAt: string;
  stateDigest: string;
};

export type CanonicalResearchProjectState = {
  contract: typeof CANONICAL_RESEARCH_PROJECT_STATE_CONTRACT;
  contractVersion: typeof CANONICAL_RESEARCH_PROJECT_STATE_VERSION;
  contractNature: "PRJ_OWNED_MATERIALIZED_PD003_PROJECT_AGGREGATE";
  owner: "RESEARCH_PROJECT";
  projectId: string;
  currentVersionId: string;
  revision: number;
  objects: CanonicalProjectObjectVersion[];
  relations: CanonicalProjectRelationVersion[];
  temporalQualifications: CanonicalTemporalQualificationVersion[];
  expectedVariableOccasions: CanonicalExpectedVariableOccasionVersion[];
  legacyTemporalObjects: LegacyTemporalProjectObject[];
  decisionLedger: CanonicalProjectDecisionLedgerEntry[];
  versionHistory: CanonicalProjectVersionRecord[];
  activeConflicts: CanonicalProjectConflict[];
};

const normalized = (value: string) => value.normalize("NFKC").toLocaleLowerCase("fr-FR").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const typeText = (item: Pick<ScientificContributionItem, "proposedType" | "studyRole">) => `${item.proposedType ?? ""} ${item.studyRole ?? ""}`.toLocaleUpperCase("en-US");
const temporalValueItem = (item: Pick<ScientificContributionItem, "proposedType" | "studyRole">) => {
  const type = typeText(item);
  return ["TEMPORAL", "TIMING", "TIMEPOINT", "WINDOW", "INTERVAL"].some((token) => type.includes(token))
    && !type.includes("VISIT");
};

export const canonicalProjectObjectType = (item: Pick<ScientificContributionItem, "proposedType" | "studyRole">): CanonicalProjectObjectType => {
  const type = typeText(item);
  if (/QUESTION/.test(type)) return "SCIENTIFIC_QUESTION";
  if (/OBJECTIVE|GOAL/.test(type)) return "OBJECTIVE";
  if (/HYPOTHESIS/.test(type)) return "HYPOTHESIS";
  if (/ELIGIBILITY|CRITERION|INCLUSION|EXCLUSION/.test(type)) return "ELIGIBILITY_CRITERION";
  if (/CONDITION|DISEASE|PATHOLOGY/.test(type)) return "CONDITION";
  if (/POPULATION/.test(type)) return "POPULATION";
  if (/STUDY_DESIGN|DESIGN|RANDOM/.test(type)) return "STUDY_DESIGN";
  if (/INTERVENTION|EXPOSURE|TREATMENT/.test(type)) return "INTERVENTION_OR_EXPOSURE";
  if (/GROUP|ARM|COMPARATOR|CONTROL/.test(type)) return "GROUP";
  if (/ENDPOINT|OUTCOME/.test(type)) return "ENDPOINT";
  if (/VARIABLE|MEASUREMENT|BIOMARKER|QUANTITATIVE_TARGET|SCIENTIFIC_OBJECT/.test(type)) return "CANONICAL_VARIABLE";
  if (/VISIT/.test(type)) return "VISIT";
  if (/MODALITY/.test(type)) return "IMAGING_MODALITY";
  if (/ACQUISITION|METHOD|SEQUENCE/.test(type)) return "ACQUISITION";
  if (/ANALYSIS|ESTIMAND|STATISTICAL/.test(type)) return "ANALYSIS_SPECIFICATION";
  if (/DATA_NEED/.test(type)) return "DATA_NEED";
  if (/CONTRADICTION/.test(type)) return "CONTRADICTION";
  if (/UNKNOWN|AMBIGU|UNCERTAINT/.test(type)) return "UNCERTAINTY";
  if (/CONSTRAINT|NEGATION/.test(type)) return "CONSTRAINT";
  return "PROJECT_INFORMATION";
};

const legacyEpistemicState = (value: string | null): CanonicalProjectEpistemicState => {
  if (value === "UNKNOWN" || value === "AMBIGUOUS") return "UNKNOWN";
  if (value === "WITHHELD") return "WITHHELD";
  if (value?.startsWith("INFERRED") || value === "SUPPORTED_CANDIDATE" || value === "UNSUPPORTED_CANDIDATE") return "ASSUMED";
  return "KNOWN";
};

const epistemicState = (boundary: ScientificContributionItem["epistemicBoundary"]): CanonicalProjectEpistemicState => (
  boundary.epistemicState ?? legacyEpistemicState(boundary.epistemicStatus)
);

const provenanceFrom = (
  item: ScientificContributionItem,
  contribution?: ScientificInterpretationContributionEnvelope,
): CanonicalProjectProvenance => {
  const ownership = item.epistemicBoundary.ownership?.toLocaleUpperCase("en-US") ?? "USER";
  const originType = item.epistemicBoundary.originType?.toLocaleUpperCase("en-US") ?? "";
  const adoptedProposal = item.epistemicBoundary.epistemicStatus === "CONFIRMED_BY_USER"
    && (ownership === "NOXIA" || originType.includes("ASSISTANT"));
  const ownerSupported = !adoptedProposal && (item.evidenceRefs?.length || !["USER", "RESEARCHER"].includes(ownership));
  const sourcePlan = adoptedProposal ? "ASSISTANT_PROPOSAL" as const : ownerSupported ? "OWNER_CONTRIBUTION" as const : "USER" as const;
  const assertionKind = adoptedProposal ? "USER_ADOPTED_PROPOSAL" as const : ownerSupported ? "OWNER_SUPPORTED" as const : "USER_STATED" as const;
  const proposalSourceTurnRefs = adoptedProposal
    ? item.epistemicBoundary.sourceTurnIds.filter((ref) => contribution?.source.turns.find((turn) => turn.turnId === ref)?.role === "NOXIA")
    : [];
  const adoptionSourceTurnRefs = adoptedProposal
    ? item.epistemicBoundary.sourceTurnIds.filter((ref) => contribution?.source.turns.find((turn) => turn.turnId === ref)?.role === "USER")
    : [];
  return {
    sourcePlan,
    assertionKind,
    sourceTurnRefs: [...item.epistemicBoundary.sourceTurnIds],
    sourceText: item.epistemicBoundary.sourceText,
    proposalSourceTurnRefs,
    adoptionSourceTurnRefs,
    evidenceRefs: [...(item.evidenceRefs ?? [])],
    evidenceQualification: item.evidenceRefs?.length ? "REFERENCES_PRESENT_NOT_VERIFIED" : "NOT_EVALUATED",
  };
};

const temporalProvenanceFrom = (
  candidate: {
    sourceText: string;
    assertionKind: "USER_STATED" | "USER_ADOPTED_PROPOSAL" | "OWNER_SUPPORTED";
    evidenceRefs: string[];
  },
  contribution: ScientificInterpretationContributionEnvelope,
): CanonicalProjectProvenance => {
  const sourceTurns = contribution.source.turns.filter((turn) => turn.content.includes(candidate.sourceText));
  const userTurns = sourceTurns.filter((turn) => turn.role === "USER");
  const noxiaTurns = sourceTurns.filter((turn) => turn.role === "NOXIA");
  return {
    sourcePlan: candidate.assertionKind === "USER_ADOPTED_PROPOSAL"
      ? "ASSISTANT_PROPOSAL"
      : candidate.assertionKind === "OWNER_SUPPORTED" ? "OWNER_CONTRIBUTION" : "USER",
    assertionKind: candidate.assertionKind === "USER_ADOPTED_PROPOSAL"
      ? "USER_ADOPTED_PROPOSAL"
      : candidate.assertionKind === "OWNER_SUPPORTED" ? "OWNER_SUPPORTED" : "USER_STATED",
    sourceTurnRefs: sourceTurns.map((turn) => turn.turnId),
    sourceText: candidate.sourceText,
    proposalSourceTurnRefs: candidate.assertionKind === "USER_ADOPTED_PROPOSAL" ? noxiaTurns.map((turn) => turn.turnId) : [],
    adoptionSourceTurnRefs: candidate.assertionKind === "USER_ADOPTED_PROPOSAL" ? userTurns.map((turn) => turn.turnId) : [],
    evidenceRefs: [...candidate.evidenceRefs],
    evidenceQualification: candidate.evidenceRefs.length ? "REFERENCES_PRESENT_NOT_VERIFIED" : "NOT_EVALUATED",
  };
};

const temporalAnchorFrom = (
  anchor: NonNullable<NonNullable<ScientificInterpretationContributionEnvelope["scientificContent"]["temporalQualifications"]>[number]["anchor"]>,
  provenance: CanonicalProjectProvenance,
): CanonicalTemporalAnchorValue => ({
  valueType: "TEMPORAL_ANCHOR_VALUE",
  kind: anchor.kind,
  direction: anchor.direction,
  unit: anchor.unit,
  offset: anchor.offset,
  lowerBound: anchor.lowerBound,
  upperBound: anchor.upperBound,
  relativeEventLabel: anchor.relativeEventLabel,
  tolerance: anchor.tolerance,
  reference: anchor.reference.status === "KNOWN"
    ? { status: "KNOWN", referenceProjectRef: anchor.reference.referenceProjectRef, relationType: "ANCHORED_TO" }
    : { status: "UNKNOWN", unresolvedReason: anchor.reference.unresolvedReason },
  provenance,
});

const activeObjects = (state: CanonicalResearchProjectState | null) => (state?.objects ?? []).filter((object) => object.actuality === "CURRENT");
const activeRelations = (state: CanonicalResearchProjectState | null) => (state?.relations ?? []).filter((relation) => relation.actuality === "CURRENT");
const activeTemporalQualifications = (state: CanonicalResearchProjectState | null) => (state?.temporalQualifications ?? []).filter((qualification) => qualification.actuality === "CURRENT");
const activeExpectedVariableOccasions = (state: CanonicalResearchProjectState | null) => (state?.expectedVariableOccasions ?? []).filter((occasion) => occasion.actuality === "CURRENT");

const structuralSlot = (object: Pick<CanonicalProjectObjectVersion, "objectType" | "scientificRole">) => {
  if (object.objectType === "SCIENTIFIC_QUESTION") return "SCIENTIFIC_QUESTION";
  if (object.objectType === "STUDY_DESIGN") return "STUDY_DESIGN";
  if (object.objectType === "ENDPOINT" && /PRIMARY|PRINCIPAL/.test(object.scientificRole?.toLocaleUpperCase("en-US") ?? "")) return "PRIMARY_ENDPOINT";
  return null;
};

const itemBySourceRef = (contribution: ScientificInterpretationContributionEnvelope) => {
  const items = [...new Map([
    ...contribution.scientificContent.candidateObjects,
    ...contribution.scientificContent.temporalElements,
  ].map((item) => [item.itemId, item])).values()];
  return new Map(items.flatMap((item) => [item.itemId, item.semanticIdentity].filter((ref): ref is string => Boolean(ref)).map((ref) => [ref, item] as const)));
};

const sectionForCanonicalType = (
  type: CanonicalProjectObjectType,
  scientificRole?: string | null,
): ResearchProjectSectionId => {
  const governedRoleSection = projectSectionForGovernedStudyRole(scientificRole);
  if (governedRoleSection) return governedRoleSection;
  if (["SCIENTIFIC_QUESTION", "OBJECTIVE"].includes(type)) return "QUESTION";
  if (["CONDITION", "POPULATION", "ELIGIBILITY_CRITERION"].includes(type)) return "POPULATION";
  if (type === "STUDY_DESIGN") return "DESIGN";
  if (type === "GROUP") return "COMPARATOR";
  if (type === "INTERVENTION_OR_EXPOSURE") return "INTERVENTION";
  if (["IMAGING_MODALITY", "ACQUISITION"].includes(type)) return "IMAGING";
  if (["ENDPOINT", "CANONICAL_VARIABLE"].includes(type)) return "MEASUREMENTS";
  if (type === "VISIT") return "TEMPORALITY";
  return "ANALYSIS";
};

const rawObjectCandidateFrom = (
  item: ScientificContributionItem,
  contribution: ScientificInterpretationContributionEnvelope,
  objectId: string,
) => {
  const objectType = canonicalProjectObjectType(item);
  const sectionId = sectionForCanonicalType(objectType, item.studyRole);
  const projection: ResearchProjectElement = {
    elementId: objectId,
    semanticKey: `${sectionId}:${objectType}:${normalized(item.semanticIdentity ?? item.content)}`,
    content: item.content.trim(),
    sourceItemIds: [item.itemId],
    sourceTurnIds: [...item.epistemicBoundary.sourceTurnIds],
    sourceProposedType: item.proposedType,
    sourceStudyRole: item.studyRole,
    sourcePolarity: item.polarity,
    disposition: "USER_CONFIRMED_PROJECT_INFORMATION",
    canonicalPromotion: "NOT_PERFORMED",
  };
  return {
    objectId,
    objectType,
    sectionId,
    content: item.content.trim(),
    scientificRole: item.studyRole,
    semanticKey: projection.semanticKey!,
    epistemicState: epistemicState(item.epistemicBoundary),
    provenance: provenanceFrom(item, contribution),
    sourceContributionRef: contribution.identity.contributionId,
    sourceItemRefs: [item.itemId],
    projection,
  };
};

const objectCandidateFrom = (
  change: ContributionProjectChangeSet["changes"][number],
  item: ScientificContributionItem | null,
  contribution: ScientificInterpretationContributionEnvelope,
) => {
  const element = change.proposedElement;
  if (!element) return null;
  const fallbackItem: ScientificContributionItem = item ?? {
    itemId: element.sourceItemIds[0] ?? element.elementId,
    semanticIdentity: element.elementId,
    proposedType: element.sourceProposedType ?? "PROJECT_INFORMATION",
    content: element.content,
    polarity: element.sourcePolarity ?? "AFFIRMED",
    studyRole: element.sourceStudyRole ?? null,
    confidence: null,
    previousItemIds: change.previousElement ? [change.previousElement.elementId] : [],
    evidenceRefs: [],
    epistemicBoundary: {
      ownership: "USER",
      epistemicStatus: "EXPLICIT_USER_STATED",
      adoptionStatus: "CANDIDATE",
      activeState: true,
      sourceTurnIds: element.sourceTurnIds,
      sourceText: null,
    },
  };
  const objectType = canonicalProjectObjectType(fallbackItem);
  const sectionId = sectionForCanonicalType(objectType, fallbackItem.studyRole);
  return {
    objectId: element.elementId,
    objectType,
    sectionId,
    content: element.content,
    scientificRole: fallbackItem.studyRole,
    semanticKey: `${sectionId}:${objectType}:${normalized(fallbackItem.semanticIdentity ?? fallbackItem.content)}`,
    epistemicState: epistemicState(fallbackItem.epistemicBoundary),
    provenance: provenanceFrom(fallbackItem, contribution),
    sourceContributionRef: contribution.identity.contributionId,
    sourceItemRefs: [...element.sourceItemIds],
    projection: element,
  };
};

export const buildCanonicalProjectChangeSet = (input: {
  contribution: ScientificInterpretationContributionEnvelope;
  sectionChangeSet: ContributionProjectChangeSet;
  current: CanonicalResearchProjectState | null;
}): CanonicalProjectChangeSet => {
  const items = itemBySourceRef(input.contribution);
  const currentObjects = activeObjects(input.current);
  const objectChanges: CanonicalProjectObjectChange[] = input.sectionChangeSet.changes
    .filter((change) => change.operation !== "NO_CHANGE"
      && ![change.proposedElement?.sourceProposedType, change.previousElement?.sourceProposedType]
        .some((type) => type === "COMPARATIVE_RELATION" || type === "CANONICAL_PROJECT_RELATION")
      && ![change.proposedElement, change.previousElement].some((element) => element && temporalValueItem({
        proposedType: element.sourceProposedType ?? null,
        studyRole: element.sourceStudyRole ?? null,
      })))
    .map((change) => {
      const sourceItem = change.sourceObjectRefs.map((ref) => items.get(ref)).find(Boolean) ?? null;
      const candidate = objectCandidateFrom(change, sourceItem, input.contribution);
      const previous = change.previousElement
        ? currentObjects.find((object) => object.objectId === change.previousElement?.elementId) ?? null
        : null;
      return {
        changeRef: change.changeId,
        operation: change.operation as "ADD" | "REMOVE" | "REPLACE",
        objectId: candidate?.objectId ?? previous?.objectId ?? change.semanticIdentity,
        previousVersionRef: previous?.objectVersionId ?? null,
        candidate,
      };
    });

  const representedItemRefs = new Set(input.sectionChangeSet.changes.flatMap((change) => change.sourceObjectRefs));
  for (const change of objectChanges) {
    for (const ref of change.candidate?.sourceItemRefs ?? []) representedItemRefs.add(ref);
  }
  const distinctItems = [...new Map([...items.values()].map((item) => [item.itemId, item])).values()];
  for (const item of distinctItems) {
    if (representedItemRefs.has(item.itemId)) continue;
    if (temporalValueItem(item)) continue;
    const refs = [item.semanticIdentity, item.itemId, ...(item.previousItemIds ?? [])].filter((ref): ref is string => Boolean(ref));
    const previous = currentObjects.find((object) => refs.includes(object.objectId)
      || refs.some((ref) => object.sourceItemRefs.includes(ref))) ?? null;
    if (item.epistemicBoundary.activeState === false) {
      if (previous) objectChanges.push({
        changeRef: `canonical-object-change:${logicalDigest({ contribution: input.contribution.identity.contributionId, item: item.itemId, operation: "REMOVE" })}`,
        operation: "REMOVE",
        objectId: previous.objectId,
        previousVersionRef: previous.objectVersionId,
        candidate: null,
      });
      continue;
    }
    if (previous && !(item.previousItemIds?.length)) continue;
    const objectId = previous?.objectId ?? item.semanticIdentity ?? `project-object:${logicalDigest({ type: item.proposedType, role: item.studyRole, content: normalized(item.content) })}`;
    const candidate = rawObjectCandidateFrom(item, input.contribution, objectId);
    const noChange = previous
      && normalized(previous.content) === normalized(candidate.content)
      && previous.objectType === candidate.objectType
      && normalized(previous.scientificRole ?? "") === normalized(candidate.scientificRole ?? "");
    if (noChange) continue;
    objectChanges.push({
      changeRef: `canonical-object-change:${logicalDigest({ contribution: input.contribution.identity.contributionId, item: item.itemId, operation: previous ? "REPLACE" : "ADD" })}`,
      operation: previous ? "REPLACE" : "ADD",
      objectId,
      previousVersionRef: previous?.objectVersionId ?? null,
      candidate,
    });
  }

  const candidateObjectRefs = new Map<string, string>();
  for (const change of objectChanges) {
    const itemRefs = change.candidate?.sourceItemRefs ?? [];
    for (const ref of itemRefs) candidateObjectRefs.set(ref, change.objectId);
    candidateObjectRefs.set(change.objectId, change.objectId);
  }
  for (const object of currentObjects) {
    candidateObjectRefs.set(object.objectId, object.objectId);
    for (const sourceRef of object.sourceItemRefs) candidateObjectRefs.set(sourceRef, object.objectId);
  }

  const relationChanges: CanonicalProjectRelationChange[] = input.contribution.scientificContent.candidateRelations
    .flatMap<CanonicalProjectRelationChange>((relation): CanonicalProjectRelationChange[] => {
      const sourceObjectRef = candidateObjectRefs.get(relation.sourceItemId) ?? relation.sourceItemId;
      const targetObjectRef = candidateObjectRefs.get(relation.targetItemId) ?? relation.targetItemId;
      const relationId = relation.relationId || `project-relation:${logicalDigest({ sourceObjectRef, targetObjectRef, type: relation.relationType })}`;
      const previous = activeRelations(input.current).find((candidate) => candidate.relationId === relationId) ?? null;
      if (relation.epistemicBoundary.activeState === false) return previous ? [{
        changeRef: `relation-change:${logicalDigest({ contribution: input.contribution.identity.contributionId, relationId, operation: "REMOVE" })}`,
        operation: "REMOVE" as const,
        relationId,
        previousVersionRef: previous.relationVersionId,
        candidate: null,
      }] : [];
      if (previous
        && previous.relationType === relation.relationType
        && previous.sourceObjectRef === sourceObjectRef
        && previous.targetObjectRef === targetObjectRef
        && previous.polarity === relation.polarity
        && previous.epistemicState === epistemicState(relation.epistemicBoundary)) return [];
      return [{
        changeRef: `relation-change:${logicalDigest({ contribution: input.contribution.identity.contributionId, relationId })}`,
        operation: previous ? "REPLACE" as const : "ADD" as const,
        relationId,
        previousVersionRef: previous?.relationVersionId ?? null,
        candidate: {
          relationId,
          relationType: relation.relationType,
          sourceObjectRef,
          targetObjectRef,
          polarity: relation.polarity,
          epistemicState: epistemicState(relation.epistemicBoundary),
          provenance: provenanceFrom({
            itemId: relation.relationId,
            semanticIdentity: relation.relationId,
            proposedType: "RELATION",
            content: relation.relationType,
            polarity: relation.polarity,
            studyRole: null,
            confidence: relation.confidence,
            evidenceRefs: relation.evidenceRefs ?? [],
            epistemicBoundary: relation.epistemicBoundary,
          }, input.contribution),
          sourceContributionRef: input.contribution.identity.contributionId,
        },
      }];
    });

  // Historical Functional Reset contributions represented timing as section
  // objects. Preserve those records only in the explicit legacy compartment;
  // never promote them to a V2 Project root or infer a temporal owner.
  const currentLegacyTemporal = input.current?.legacyTemporalObjects ?? [];
  const legacyTemporalChanges: LegacyTemporalProjectChange[] = input.sectionChangeSet.changes
    .filter((change) => change.operation !== "NO_CHANGE"
      && [change.proposedElement, change.previousElement].some((element) => element && temporalValueItem({
        proposedType: element.sourceProposedType ?? null,
        studyRole: element.sourceStudyRole ?? null,
      })))
    .map((change) => {
      const sourceItem = change.sourceObjectRefs.map((ref) => items.get(ref)).find(Boolean) ?? null;
      const candidate = objectCandidateFrom(change, sourceItem, input.contribution);
      const previous = change.previousElement
        ? currentLegacyTemporal.find(({ legacyObject }) => legacyObject.objectId === change.previousElement?.elementId) ?? null
        : null;
      return {
        changeRef: `legacy-temporal-change:${change.changeId}`,
        operation: change.operation as "ADD" | "REMOVE" | "REPLACE",
        legacyObjectId: candidate?.objectId ?? previous?.legacyObject.objectId ?? change.semanticIdentity,
        previousVersionRef: previous?.legacyObject.objectVersionId ?? null,
        candidate: candidate ? { ...candidate, objectType: "TEMPORAL_ANCHOR" as const } : null,
      };
    });

  const conflicts: CanonicalProjectConflict[] = [];
  for (const change of objectChanges.filter((candidate) => candidate.operation === "ADD" && candidate.candidate)) {
    const slot = structuralSlot(change.candidate!);
    if (!slot) continue;
    const existing = currentObjects.filter((object) => {
      if (structuralSlot(object) !== slot || object.objectId === change.objectId) return false;
      const explicitRelease = objectChanges.find((candidate) => candidate.objectId === object.objectId
        && (candidate.operation === "REMOVE" || (candidate.operation === "REPLACE" && structuralSlot(candidate.candidate!) !== slot)));
      return !explicitRelease;
    });
    if (!existing.length) continue;
    conflicts.push({
      conflictId: `project-conflict:${logicalDigest({ slot, existing: existing.map((item) => item.objectVersionId), candidate: change.objectId })}`,
      code: "CONFLICTING_ADOPTED_STATE",
      message: `${slot} possède déjà un état adopté. Une supersession explicite doit identifier l'état remplacé.`,
      existingRefs: existing.map((object) => object.objectVersionId),
      candidateRefs: [change.objectId],
      status: "BLOCKING",
    });
  }
  const knownObjectRefs = new Set([
    ...currentObjects.map((object) => object.objectId),
    ...objectChanges.filter((change) => change.operation !== "REMOVE").map((change) => change.objectId),
  ]);
  for (const change of relationChanges) {
    if (!change.candidate) continue;
    const missing = [change.candidate.sourceObjectRef, change.candidate.targetObjectRef].filter((ref) => !knownObjectRefs.has(ref));
    if (!missing.length) continue;
    conflicts.push({
      conflictId: `project-conflict:${logicalDigest({ relation: change.relationId, missing })}`,
      code: "PROJECT_RELATION_ENDPOINT_NOT_FOUND",
      message: "Une relation candidate référence un objet absent du Project ou de la Contribution.",
      existingRefs: [],
      candidateRefs: missing,
      status: "BLOCKING",
    });
  }
  const hasChanges = objectChanges.length > 0 || relationChanges.length > 0 || legacyTemporalChanges.length > 0;
  const baseChangeSet: CanonicalProjectChangeSet = {
    contract: "PRJ001_CANONICAL_PROJECT_CHANGESET",
    contractVersion: CANONICAL_RESEARCH_PROJECT_STATE_VERSION,
    sourceContributionRef: input.contribution.identity.contributionId,
    baseProjectVersion: input.current?.currentVersionId ?? null,
    status: conflicts.length ? "BLOCKED_BY_STRUCTURAL_CONFLICT" : hasChanges ? "READY_FOR_HUMAN_DECISION" : "NO_NET_CHANGE",
    objectChanges,
    relationChanges,
    temporalQualificationChanges: [],
    expectedVariableOccasionChanges: [],
    legacyTemporalChanges,
    conflicts,
  };
  const temporalQualifications = (input.contribution.scientificContent.temporalQualifications ?? []).map((candidate) => {
    const provenance = temporalProvenanceFrom(candidate, input.contribution);
    const subjectProjectRef = candidateObjectRefs.get(candidate.subjectProjectRef) ?? candidate.subjectProjectRef;
    const anchor = candidate.anchor
      ? {
        ...candidate.anchor,
        reference: candidate.anchor.reference.status === "KNOWN"
          ? {
            ...candidate.anchor.reference,
            referenceProjectRef: candidateObjectRefs.get(candidate.anchor.reference.referenceProjectRef)
              ?? candidate.anchor.reference.referenceProjectRef,
          }
          : candidate.anchor.reference,
      }
      : null;
    return {
      operation: candidate.operation,
      qualificationId: candidate.qualificationId,
      subjectProjectRef,
      temporalRole: candidate.temporalRole,
      anchor: anchor ? temporalAnchorFrom(anchor, provenance) : null,
      provenance,
      sourceContributionRef: input.contribution.identity.contributionId,
    } satisfies CanonicalTemporalQualificationProposal;
  });
  const expectedVariableOccasions = (input.contribution.scientificContent.expectedVariableOccasions ?? []).map((candidate) => {
    const provenance = temporalProvenanceFrom(candidate, input.contribution);
    const variableProjectRef = candidateObjectRefs.get(candidate.variableProjectRef) ?? candidate.variableProjectRef;
    const studyUnitOrGroupRef = candidate.studyUnitOrGroupRef
      ? candidateObjectRefs.get(candidate.studyUnitOrGroupRef) ?? candidate.studyUnitOrGroupRef
      : null;
    const anchor = candidate.anchor
      ? {
        ...candidate.anchor,
        reference: candidate.anchor.reference.status === "KNOWN"
          ? {
            ...candidate.anchor.reference,
            referenceProjectRef: candidateObjectRefs.get(candidate.anchor.reference.referenceProjectRef)
              ?? candidate.anchor.reference.referenceProjectRef,
          }
          : candidate.anchor.reference,
      }
      : null;
    return {
      operation: candidate.operation,
      occasionId: candidate.occasionId,
      variableProjectRef,
      anchor: anchor ? temporalAnchorFrom(anchor, provenance) : null,
      studyUnitOrGroupRef,
      applicableContext: candidate.applicableContext,
      provenance,
      sourceContributionRef: input.contribution.identity.contributionId,
    } satisfies CanonicalExpectedVariableOccasionProposal;
  });
  return withCanonicalTemporalChanges({
    changeSet: baseChangeSet,
    current: input.current,
    temporalQualifications,
    expectedVariableOccasions,
  });
};

const anchorValidationError = (
  anchor: CanonicalTemporalAnchorValue,
  knownObjectRefs: Set<string>,
) => {
  if (!anchor.unit.trim()) return "TEMPORAL_ANCHOR_UNIT_REQUIRED";
  if ((anchor.kind === "WINDOW" || anchor.kind === "INTERVAL")
    && (!Number.isFinite(anchor.lowerBound) || !Number.isFinite(anchor.upperBound)
      || anchor.lowerBound! > anchor.upperBound!)) return "TEMPORAL_ANCHOR_BOUNDS_INVALID";
  if (anchor.kind === "TIMEPOINT" && !Number.isFinite(anchor.offset)) return "TEMPORAL_ANCHOR_OFFSET_REQUIRED";
  if (anchor.reference.status === "KNOWN" && !knownObjectRefs.has(anchor.reference.referenceProjectRef)) {
    return "TEMPORAL_REFERENCE_NOT_FOUND";
  }
  return null;
};

const temporalConflict = (
  code: CanonicalProjectConflict["code"],
  candidateRefs: string[],
  message: string,
  existingRefs: string[] = [],
): CanonicalProjectConflict => ({
  conflictId: `project-conflict:${logicalDigest({ code, candidateRefs, existingRefs, message })}`,
  code,
  message,
  existingRefs,
  candidateRefs,
  status: "BLOCKING",
});

/**
 * Adds PD-003 temporal value/subresource changes to an existing candidate
 * change set. This helper validates owner identity and never interprets text.
 */
export const withCanonicalTemporalChanges = (input: {
  changeSet: CanonicalProjectChangeSet;
  current: CanonicalResearchProjectState | null;
  temporalQualifications?: CanonicalTemporalQualificationProposal[];
  expectedVariableOccasions?: CanonicalExpectedVariableOccasionProposal[];
}): CanonicalProjectChangeSet => {
  const currentObjects = activeObjects(input.current);
  const knownObjectRefs = new Set([
    ...currentObjects.map((object) => object.objectId),
    ...input.changeSet.objectChanges.filter((change) => change.operation !== "REMOVE").map((change) => change.objectId),
  ]);
  const objectTypeByRef = new Map(currentObjects.map((object) => [object.objectId, object.objectType] as const));
  for (const change of input.changeSet.objectChanges) {
    if (change.operation !== "REMOVE" && change.candidate) objectTypeByRef.set(change.objectId, change.candidate.objectType);
  }
  const conflicts = [...input.changeSet.conflicts];
  const temporalQualificationChanges: CanonicalTemporalQualificationChange[] = [];
  const expectedVariableOccasionChanges: CanonicalExpectedVariableOccasionChange[] = [];

  for (const proposal of input.temporalQualifications ?? []) {
    const previous = activeTemporalQualifications(input.current).find((item) => item.qualificationId === proposal.qualificationId) ?? null;
    const subjectType = objectTypeByRef.get(proposal.subjectProjectRef) ?? null;
    if (!subjectType) {
      conflicts.push(temporalConflict("TEMPORAL_SUBJECT_NOT_FOUND", [proposal.subjectProjectRef], "La qualification temporelle référence un objet Project absent."));
      continue;
    }
    if (proposal.temporalRole === "ACQUISITION_TIME" && subjectType !== "ACQUISITION") {
      conflicts.push(temporalConflict("TEMPORAL_ROLE_SUBJECT_MISMATCH", [proposal.qualificationId, proposal.subjectProjectRef], "AcquisitionTime doit qualifier une Acquisition existante."));
      continue;
    }
    if (proposal.temporalRole === "ANALYSIS_TIME" && subjectType !== "ANALYSIS_SPECIFICATION") {
      conflicts.push(temporalConflict("TEMPORAL_ROLE_SUBJECT_MISMATCH", [proposal.qualificationId, proposal.subjectProjectRef], "AnalysisTime doit qualifier une AnalysisSpecification existante."));
      continue;
    }
    if (proposal.operation !== "ADD" && !previous) {
      conflicts.push(temporalConflict("TEMPORAL_QUALIFICATION_NOT_FOUND", [proposal.qualificationId], "La qualification temporelle à modifier n'existe pas."));
      continue;
    }
    if (previous && (previous.subjectProjectRef !== proposal.subjectProjectRef || previous.temporalRole !== proposal.temporalRole)) {
      conflicts.push(temporalConflict("TEMPORAL_ROLE_SUBJECT_MISMATCH", [proposal.qualificationId], "Une correction temporelle ne peut changer silencieusement de sujet ou de rôle.", [previous.qualificationVersionId]));
      continue;
    }
    if (proposal.operation === "REMOVE") {
      temporalQualificationChanges.push({
        changeRef: `temporal-change:${logicalDigest(proposal)}`,
        operation: "REMOVE",
        qualificationId: proposal.qualificationId,
        previousVersionRef: previous!.qualificationVersionId,
        candidate: null,
      });
      continue;
    }
    if (!proposal.anchor) {
      conflicts.push(temporalConflict("TEMPORAL_ANCHOR_INVALID", [proposal.qualificationId], "Une qualification temporelle ajoutée ou remplacée exige un TemporalAnchor."));
      continue;
    }
    const anchorError = anchorValidationError(proposal.anchor, knownObjectRefs);
    if (anchorError) {
      conflicts.push(temporalConflict(anchorError === "TEMPORAL_REFERENCE_NOT_FOUND" ? "TEMPORAL_REFERENCE_NOT_FOUND" : "TEMPORAL_ANCHOR_INVALID", [proposal.qualificationId], anchorError));
      continue;
    }
    if (proposal.operation === "ADD" && previous) {
      if (logicalDigest(previous.anchor) === logicalDigest(proposal.anchor)) continue;
      conflicts.push(temporalConflict("CONFLICTING_ADOPTED_STATE", [proposal.qualificationId], "Une qualification temporelle existante exige REPLACE pour être corrigée.", [previous.qualificationVersionId]));
      continue;
    }
    if (previous && logicalDigest(previous.anchor) === logicalDigest(proposal.anchor)) continue;
    temporalQualificationChanges.push({
      changeRef: `temporal-change:${logicalDigest(proposal)}`,
      operation: previous ? "REPLACE" : "ADD",
      qualificationId: proposal.qualificationId,
      previousVersionRef: previous?.qualificationVersionId ?? null,
      candidate: {
        qualificationId: proposal.qualificationId,
        subjectProjectRef: proposal.subjectProjectRef,
        temporalRole: proposal.temporalRole,
        anchor: proposal.anchor,
        provenance: proposal.provenance,
        sourceContributionRef: proposal.sourceContributionRef,
      },
    });
  }

  for (const proposal of input.expectedVariableOccasions ?? []) {
    const previous = activeExpectedVariableOccasions(input.current).find((item) => item.occasionId === proposal.occasionId) ?? null;
    if (objectTypeByRef.get(proposal.variableProjectRef) !== "CANONICAL_VARIABLE") {
      conflicts.push(temporalConflict("EXPECTED_AT_SOURCE_NOT_CANONICAL_VARIABLE", [proposal.occasionId, proposal.variableProjectRef], "EXPECTED_AT exige une CanonicalVariable comme source."));
      continue;
    }
    if (proposal.studyUnitOrGroupRef && !knownObjectRefs.has(proposal.studyUnitOrGroupRef)) {
      conflicts.push(temporalConflict("EXPECTED_OCCASION_CONTEXT_REF_NOT_FOUND", [proposal.occasionId, proposal.studyUnitOrGroupRef], "L'unité ou le groupe de l'occasion attendue est absent du Project."));
      continue;
    }
    if (proposal.operation !== "ADD" && !previous) {
      conflicts.push(temporalConflict("EXPECTED_VARIABLE_OCCASION_NOT_FOUND", [proposal.occasionId], "L'ExpectedVariableOccasion à modifier n'existe pas."));
      continue;
    }
    if (previous && previous.variableProjectRef !== proposal.variableProjectRef) {
      conflicts.push(temporalConflict("EXPECTED_AT_SOURCE_NOT_CANONICAL_VARIABLE", [proposal.occasionId], "Une occasion attendue ne peut changer silencieusement de CanonicalVariable.", [previous.occasionVersionId]));
      continue;
    }
    if (proposal.operation === "REMOVE") {
      expectedVariableOccasionChanges.push({
        changeRef: `expected-occasion-change:${logicalDigest(proposal)}`,
        operation: "REMOVE",
        occasionId: proposal.occasionId,
        previousVersionRef: previous!.occasionVersionId,
        candidate: null,
      });
      continue;
    }
    if (!proposal.anchor) {
      conflicts.push(temporalConflict("TEMPORAL_ANCHOR_INVALID", [proposal.occasionId], "Une ExpectedVariableOccasion exige un TemporalAnchor."));
      continue;
    }
    const anchorError = anchorValidationError(proposal.anchor, knownObjectRefs);
    if (anchorError) {
      conflicts.push(temporalConflict(anchorError === "TEMPORAL_REFERENCE_NOT_FOUND" ? "TEMPORAL_REFERENCE_NOT_FOUND" : "TEMPORAL_ANCHOR_INVALID", [proposal.occasionId], anchorError));
      continue;
    }
    if (proposal.operation === "ADD" && previous) {
      if (logicalDigest(previous.anchor) === logicalDigest(proposal.anchor)) continue;
      conflicts.push(temporalConflict("CONFLICTING_ADOPTED_STATE", [proposal.occasionId], "Une occasion attendue existante exige REPLACE pour être corrigée.", [previous.occasionVersionId]));
      continue;
    }
    if (previous && logicalDigest(previous.anchor) === logicalDigest(proposal.anchor)
      && previous.studyUnitOrGroupRef === proposal.studyUnitOrGroupRef
      && previous.applicableContext === proposal.applicableContext) continue;
    expectedVariableOccasionChanges.push({
      changeRef: `expected-occasion-change:${logicalDigest(proposal)}`,
      operation: previous ? "REPLACE" : "ADD",
      occasionId: proposal.occasionId,
      previousVersionRef: previous?.occasionVersionId ?? null,
      candidate: {
        occasionId: proposal.occasionId,
        relationType: "EXPECTED_AT",
        variableProjectRef: proposal.variableProjectRef,
        anchor: proposal.anchor,
        studyUnitOrGroupRef: proposal.studyUnitOrGroupRef,
        applicableContext: proposal.applicableContext,
        expectedStatus: "EXPECTED_NOT_REALIZED",
        provenance: proposal.provenance,
        sourceContributionRef: proposal.sourceContributionRef,
      },
    });
  }

  const hasChanges = input.changeSet.objectChanges.length > 0
    || input.changeSet.relationChanges.length > 0
    || temporalQualificationChanges.length > 0
    || expectedVariableOccasionChanges.length > 0
    || input.changeSet.legacyTemporalChanges.length > 0;
  return {
    ...input.changeSet,
    status: conflicts.length ? "BLOCKED_BY_STRUCTURAL_CONFLICT" : hasChanges ? "READY_FOR_HUMAN_DECISION" : "NO_NET_CHANGE",
    temporalQualificationChanges,
    expectedVariableOccasionChanges,
    conflicts,
  };
};

const supersedeObject = (objects: CanonicalProjectObjectVersion[], versionRef: string, supersededBy: string | null) => objects.map((object) =>
  object.objectVersionId === versionRef ? { ...object, actuality: "SUPERSEDED" as const, supersededByVersionRef: supersededBy } : object);
const supersedeRelation = (relations: CanonicalProjectRelationVersion[], versionRef: string, supersededBy: string | null) => relations.map((relation) =>
  relation.relationVersionId === versionRef ? { ...relation, actuality: "SUPERSEDED" as const, supersededByVersionRef: supersededBy } : relation);
const supersedeTemporalQualification = (qualifications: CanonicalTemporalQualificationVersion[], versionRef: string, supersededBy: string | null) => qualifications.map((qualification) =>
  qualification.qualificationVersionId === versionRef ? { ...qualification, actuality: "SUPERSEDED" as const, supersededByVersionRef: supersededBy } : qualification);
const supersedeExpectedOccasion = (occasions: CanonicalExpectedVariableOccasionVersion[], versionRef: string, supersededBy: string | null) => occasions.map((occasion) =>
  occasion.occasionVersionId === versionRef ? { ...occasion, actuality: "SUPERSEDED" as const, supersededByVersionRef: supersededBy } : occasion);
const supersedeLegacyTemporal = (entries: LegacyTemporalProjectObject[], versionRef: string, supersededBy: string | null) => entries.map((entry) =>
  entry.legacyObject.objectVersionId === versionRef ? {
    ...entry,
    legacyObject: { ...entry.legacyObject, actuality: "SUPERSEDED" as const, supersededByVersionRef: supersededBy },
  } : entry);

export const applyCanonicalProjectChangeSet = (input: {
  current: CanonicalResearchProjectState | null;
  changeSet: CanonicalProjectChangeSet;
  projectId: string;
  versionId: string;
  revision: number;
  contribution: ScientificInterpretationContributionEnvelope;
  decision: HumanDecisionEnvelope;
  decidedAt: string;
}): CanonicalResearchProjectState => {
  if (input.changeSet.status === "BLOCKED_BY_STRUCTURAL_CONFLICT") throw new Error("PRJ_CONFLICTING_ADOPTED_STATE_REQUIRES_EXPLICIT_REPLACEMENT");
  if (input.changeSet.status === "NO_NET_CHANGE") throw new Error("PRJ_CANONICAL_CHANGESET_NO_NET_CHANGE");
  let objects = [...(input.current?.objects ?? [])];
  let relations = [...(input.current?.relations ?? [])];
  let temporalQualifications = [...(input.current?.temporalQualifications ?? [])];
  let expectedVariableOccasions = [...(input.current?.expectedVariableOccasions ?? [])];
  let legacyTemporalObjects = [...(input.current?.legacyTemporalObjects ?? [])];

  for (const change of input.changeSet.objectChanges) {
    const previous = change.previousVersionRef
      ? objects.find((object) => object.objectVersionId === change.previousVersionRef) ?? null
      : null;
    if (change.operation === "REMOVE") {
      if (!previous) throw new Error("PRJ_CANONICAL_REMOVE_TARGET_MISSING");
      objects = supersedeObject(objects, previous.objectVersionId, null);
      continue;
    }
    if (!change.candidate) throw new Error("PRJ_CANONICAL_OBJECT_CANDIDATE_MISSING");
    const nextVersion = previous ? previous.version + 1 : Math.max(0, ...objects.filter((object) => object.objectId === change.objectId).map((object) => object.version)) + 1;
    const objectVersionId = `${change.objectId}:version:${nextVersion}`;
    if (previous) objects = supersedeObject(objects, previous.objectVersionId, objectVersionId);
    objects.push({
      ...change.candidate,
      objectVersionId,
      version: nextVersion,
      adoptionStatus: "ADOPTED_BY_HUMAN_DECISION",
      actuality: "CURRENT",
      coherence: "CONSISTENT",
      supersedesVersionRef: previous?.objectVersionId ?? null,
      supersededByVersionRef: null,
      decisionRefs: [input.decision.decisionId],
      adoptedAt: input.decidedAt,
    });
  }

  for (const change of input.changeSet.relationChanges) {
    const previous = change.previousVersionRef
      ? relations.find((relation) => relation.relationVersionId === change.previousVersionRef) ?? null
      : null;
    if (change.operation === "REMOVE") {
      if (!previous) throw new Error("PRJ_CANONICAL_RELATION_REMOVE_TARGET_MISSING");
      relations = supersedeRelation(relations, previous.relationVersionId, null);
      continue;
    }
    if (!change.candidate) throw new Error("PRJ_CANONICAL_RELATION_CANDIDATE_MISSING");
    const nextVersion = previous ? previous.version + 1 : Math.max(0, ...relations.filter((relation) => relation.relationId === change.relationId).map((relation) => relation.version)) + 1;
    const relationVersionId = `${change.relationId}:version:${nextVersion}`;
    if (previous) relations = supersedeRelation(relations, previous.relationVersionId, relationVersionId);
    relations.push({
      ...change.candidate,
      relationVersionId,
      version: nextVersion,
      adoptionStatus: "ADOPTED_BY_HUMAN_DECISION",
      actuality: "CURRENT",
      coherence: "CONSISTENT",
      supersedesVersionRef: previous?.relationVersionId ?? null,
      supersededByVersionRef: null,
      decisionRefs: [input.decision.decisionId],
      adoptedAt: input.decidedAt,
    });
  }

  for (const change of input.changeSet.temporalQualificationChanges) {
    const previous = change.previousVersionRef
      ? temporalQualifications.find((qualification) => qualification.qualificationVersionId === change.previousVersionRef) ?? null
      : null;
    if (change.operation === "REMOVE") {
      if (!previous) throw new Error("PRJ_TEMPORAL_QUALIFICATION_REMOVE_TARGET_MISSING");
      temporalQualifications = supersedeTemporalQualification(temporalQualifications, previous.qualificationVersionId, null);
      continue;
    }
    if (!change.candidate) throw new Error("PRJ_TEMPORAL_QUALIFICATION_CANDIDATE_MISSING");
    const nextVersion = previous ? previous.version + 1 : Math.max(0, ...temporalQualifications.filter((qualification) => qualification.qualificationId === change.qualificationId).map((qualification) => qualification.version)) + 1;
    const qualificationVersionId = `${change.qualificationId}:version:${nextVersion}`;
    if (previous) temporalQualifications = supersedeTemporalQualification(temporalQualifications, previous.qualificationVersionId, qualificationVersionId);
    temporalQualifications.push({
      ...change.candidate,
      qualificationVersionId,
      version: nextVersion,
      adoptionStatus: "ADOPTED_BY_HUMAN_DECISION",
      actuality: "CURRENT",
      supersedesVersionRef: previous?.qualificationVersionId ?? null,
      supersededByVersionRef: null,
      decisionRefs: [input.decision.decisionId],
      adoptedAt: input.decidedAt,
    });
  }

  for (const change of input.changeSet.expectedVariableOccasionChanges) {
    const previous = change.previousVersionRef
      ? expectedVariableOccasions.find((occasion) => occasion.occasionVersionId === change.previousVersionRef) ?? null
      : null;
    if (change.operation === "REMOVE") {
      if (!previous) throw new Error("PRJ_EXPECTED_OCCASION_REMOVE_TARGET_MISSING");
      expectedVariableOccasions = supersedeExpectedOccasion(expectedVariableOccasions, previous.occasionVersionId, null);
      continue;
    }
    if (!change.candidate) throw new Error("PRJ_EXPECTED_OCCASION_CANDIDATE_MISSING");
    const nextVersion = previous ? previous.version + 1 : Math.max(0, ...expectedVariableOccasions.filter((occasion) => occasion.occasionId === change.occasionId).map((occasion) => occasion.version)) + 1;
    const occasionVersionId = `${change.occasionId}:version:${nextVersion}`;
    if (previous) expectedVariableOccasions = supersedeExpectedOccasion(expectedVariableOccasions, previous.occasionVersionId, occasionVersionId);
    expectedVariableOccasions.push({
      ...change.candidate,
      occasionVersionId,
      version: nextVersion,
      adoptionStatus: "ADOPTED_BY_HUMAN_DECISION",
      actuality: "CURRENT",
      supersedesVersionRef: previous?.occasionVersionId ?? null,
      supersededByVersionRef: null,
      decisionRefs: [input.decision.decisionId],
      adoptedAt: input.decidedAt,
    });
  }

  for (const change of input.changeSet.legacyTemporalChanges) {
    const previous = change.previousVersionRef
      ? legacyTemporalObjects.find(({ legacyObject }) => legacyObject.objectVersionId === change.previousVersionRef) ?? null
      : null;
    if (change.operation === "REMOVE") {
      if (!previous) throw new Error("PRJ_LEGACY_TEMPORAL_REMOVE_TARGET_MISSING");
      legacyTemporalObjects = supersedeLegacyTemporal(legacyTemporalObjects, previous.legacyObject.objectVersionId, null);
      continue;
    }
    if (!change.candidate) throw new Error("PRJ_LEGACY_TEMPORAL_CANDIDATE_MISSING");
    const nextVersion = previous ? previous.legacyObject.version + 1 : Math.max(0, ...legacyTemporalObjects
      .filter(({ legacyObject }) => legacyObject.objectId === change.legacyObjectId)
      .map(({ legacyObject }) => legacyObject.version)) + 1;
    const objectVersionId = `${change.legacyObjectId}:version:${nextVersion}`;
    if (previous) legacyTemporalObjects = supersedeLegacyTemporal(legacyTemporalObjects, previous.legacyObject.objectVersionId, objectVersionId);
    legacyTemporalObjects.push({
      legacyObject: {
        ...change.candidate,
        objectVersionId,
        version: nextVersion,
        adoptionStatus: "ADOPTED_BY_HUMAN_DECISION",
        actuality: "CURRENT",
        coherence: "CONSISTENT",
        supersedesVersionRef: previous?.legacyObject.objectVersionId ?? null,
        supersededByVersionRef: null,
        decisionRefs: [input.decision.decisionId],
        adoptedAt: input.decidedAt,
      },
      mappingStatus: "NEW_MAPPING_REQUIRED",
      reason: "LEGACY_TEMPORAL_ROOT_OBJECT_HAS_NO_SAFE_AUTOMATIC_OWNER_MAPPING",
    });
  }

  const activeObjectVersions = objects.filter((object) => object.actuality === "CURRENT").map((object) => object.objectVersionId).sort();
  const activeRelationVersions = relations.filter((relation) => relation.actuality === "CURRENT").map((relation) => relation.relationVersionId).sort();
  const activeTemporalQualificationVersions = temporalQualifications.filter((qualification) => qualification.actuality === "CURRENT").map((qualification) => qualification.qualificationVersionId).sort();
  const activeExpectedOccasionVersions = expectedVariableOccasions.filter((occasion) => occasion.actuality === "CURRENT").map((occasion) => occasion.occasionVersionId).sort();
  const activeLegacyTemporalVersions = legacyTemporalObjects.filter(({ legacyObject }) => legacyObject.actuality === "CURRENT").map(({ legacyObject }) => legacyObject.objectVersionId).sort();
  const stateDigest = logicalDigest({
    projectId: input.projectId,
    versionId: input.versionId,
    objects: activeObjectVersions,
    relations: activeRelationVersions,
    temporalQualifications: activeTemporalQualificationVersions,
    expectedVariableOccasions: activeExpectedOccasionVersions,
    legacyTemporalObjects: activeLegacyTemporalVersions,
    decision: input.decision.decisionId,
  });
  const versionRecord: CanonicalProjectVersionRecord = {
    versionId: input.versionId,
    previousVersionId: input.current?.currentVersionId ?? null,
    revision: input.revision,
    objectVersionRefs: activeObjectVersions,
    relationVersionRefs: activeRelationVersions,
    temporalQualificationVersionRefs: activeTemporalQualificationVersions,
    expectedVariableOccasionVersionRefs: activeExpectedOccasionVersions,
    legacyTemporalVersionRefs: activeLegacyTemporalVersions,
    decisionRefs: [input.decision.decisionId],
    sourceContributionRef: input.contribution.identity.contributionId,
    createdAt: input.decidedAt,
    stateDigest,
  };
  const ledger: CanonicalProjectDecisionLedgerEntry = {
    ledgerEntryId: `project-ledger:${logicalDigest({ project: input.projectId, version: input.versionId, decision: input.decision.decisionId })}`,
    sourceContributionRef: input.contribution.identity.contributionId,
    sourceTurnRefs: input.contribution.source.turns.filter((turn) => turn.role === "USER").map((turn) => turn.turnId),
    candidateChangeRefs: [
      ...input.changeSet.objectChanges.map((change) => change.changeRef),
      ...input.changeSet.relationChanges.map((change) => change.changeRef),
      ...input.changeSet.temporalQualificationChanges.map((change) => change.changeRef),
      ...input.changeSet.expectedVariableOccasionChanges.map((change) => change.changeRef),
      ...input.changeSet.legacyTemporalChanges.map((change) => change.changeRef),
    ],
    operationSummary: [...new Set([
      ...input.changeSet.objectChanges,
      ...input.changeSet.relationChanges,
      ...input.changeSet.temporalQualificationChanges,
      ...input.changeSet.expectedVariableOccasionChanges,
      ...input.changeSet.legacyTemporalChanges,
    ].map((change) => change.operation))],
    objectRefs: input.changeSet.objectChanges.map((change) => change.objectId),
    relationRefs: input.changeSet.relationChanges.map((change) => change.relationId),
    temporalQualificationRefs: input.changeSet.temporalQualificationChanges.map((change) => change.qualificationId),
    expectedVariableOccasionRefs: input.changeSet.expectedVariableOccasionChanges.map((change) => change.occasionId),
    legacyTemporalRefs: input.changeSet.legacyTemporalChanges.map((change) => change.legacyObjectId),
    previousRefs: [
      ...input.changeSet.objectChanges.map((change) => change.previousVersionRef),
      ...input.changeSet.relationChanges.map((change) => change.previousVersionRef),
      ...input.changeSet.temporalQualificationChanges.map((change) => change.previousVersionRef),
      ...input.changeSet.expectedVariableOccasionChanges.map((change) => change.previousVersionRef),
      ...input.changeSet.legacyTemporalChanges.map((change) => change.previousVersionRef),
    ].filter((ref): ref is string => Boolean(ref)),
    temporalChanges: input.changeSet.temporalQualificationChanges.map((change) => ({
      changeRef: change.changeRef,
      subjectProjectRef: change.candidate?.subjectProjectRef
        ?? temporalQualifications.find((qualification) => qualification.qualificationId === change.qualificationId)?.subjectProjectRef
        ?? "UNKNOWN_SUBJECT",
      temporalRole: change.candidate?.temporalRole
        ?? temporalQualifications.find((qualification) => qualification.qualificationId === change.qualificationId)?.temporalRole
        ?? "ACQUISITION_TIME",
      previousVersionRef: change.previousVersionRef,
      candidateAnchor: change.candidate?.anchor ?? null,
      resultingVersionRef: change.operation === "REMOVE" ? null
        : temporalQualifications.find((qualification) => qualification.qualificationId === change.qualificationId && qualification.actuality === "CURRENT")?.qualificationVersionId ?? null,
    })),
    expectedOccasionChanges: input.changeSet.expectedVariableOccasionChanges.map((change) => ({
      changeRef: change.changeRef,
      variableProjectRef: change.candidate?.variableProjectRef
        ?? expectedVariableOccasions.find((occasion) => occasion.occasionId === change.occasionId)?.variableProjectRef
        ?? "UNKNOWN_VARIABLE",
      previousVersionRef: change.previousVersionRef,
      candidateAnchor: change.candidate?.anchor ?? null,
      resultingVersionRef: change.operation === "REMOVE" ? null
        : expectedVariableOccasions.find((occasion) => occasion.occasionId === change.occasionId && occasion.actuality === "CURRENT")?.occasionVersionId ?? null,
    })),
    humanDecisionRef: input.decision.decisionId,
    humanActorRef: input.decision.actor!,
    humanMandateRef: input.decision.mandate!,
    resultingProjectVersion: input.versionId,
    decidedAt: input.decidedAt,
  };
  return {
    contract: CANONICAL_RESEARCH_PROJECT_STATE_CONTRACT,
    contractVersion: CANONICAL_RESEARCH_PROJECT_STATE_VERSION,
    contractNature: "PRJ_OWNED_MATERIALIZED_PD003_PROJECT_AGGREGATE",
    owner: "RESEARCH_PROJECT",
    projectId: input.projectId,
    currentVersionId: input.versionId,
    revision: input.revision,
    objects,
    relations,
    temporalQualifications,
    expectedVariableOccasions,
    legacyTemporalObjects,
    decisionLedger: [...(input.current?.decisionLedger ?? []), ledger],
    versionHistory: [...(input.current?.versionHistory ?? []), versionRecord],
    activeConflicts: [],
  };
};

export const projectSectionsFromCanonicalState = (
  state: CanonicalResearchProjectState,
  sectionTemplate: ResearchProjectSection[],
): ResearchProjectSection[] => {
  const currentObjects = state.objects.filter((object) => object.actuality === "CURRENT");
  const byObjectRef = new Map(currentObjects.map((object) => [object.objectId, object]));
  const relationProjections: ResearchProjectElement[] = state.relations
    .filter((relation) => relation.actuality === "CURRENT")
    .map((relation) => ({
      elementId: relation.relationId,
      semanticKey: `ANALYSIS:RELATION:${relation.relationType}:${relation.sourceObjectRef}:${relation.targetObjectRef}`,
      content: `${relation.relationType} : ${byObjectRef.get(relation.sourceObjectRef)?.content ?? relation.sourceObjectRef} → ${byObjectRef.get(relation.targetObjectRef)?.content ?? relation.targetObjectRef}`,
      sourceItemIds: [relation.sourceObjectRef, relation.targetObjectRef],
      sourceTurnIds: [...relation.provenance.sourceTurnRefs],
      sourceProposedType: "CANONICAL_PROJECT_RELATION",
      sourceStudyRole: null,
      sourcePolarity: relation.polarity,
      disposition: "USER_CONFIRMED_PROJECT_INFORMATION",
      canonicalPromotion: "NOT_PERFORMED",
    }));
  const anchorLabel = (anchor: CanonicalTemporalAnchorValue) => {
    const prefix = anchor.unit === "DAY" ? "J" : anchor.unit === "HOUR" ? "H" : `${anchor.unit} `;
    const value = anchor.kind === "WINDOW" || anchor.kind === "INTERVAL"
      ? `${prefix}${anchor.lowerBound}–${prefix}${anchor.upperBound}`
      : anchor.offset === null
        ? anchor.relativeEventLabel
          ? `${anchor.direction === "BEFORE" ? "avant" : anchor.direction === "AFTER" ? "après" : "au moment de"} ${anchor.relativeEventLabel}`
          : "temps relatif"
        : `${prefix}${anchor.offset}`;
    const reference = anchor.reference.status === "KNOWN"
      ? `référence ${byObjectRef.get(anchor.reference.referenceProjectRef)?.content ?? anchor.reference.referenceProjectRef}`
      : "référence inconnue";
    return `${value} (${reference})`;
  };
  const temporalProjections: ResearchProjectElement[] = state.temporalQualifications
    .filter((qualification) => qualification.actuality === "CURRENT")
    .map((qualification) => ({
      elementId: qualification.qualificationId,
      semanticKey: `TEMPORALITY:QUALIFICATION:${qualification.subjectProjectRef}:${qualification.temporalRole}`,
      content: `${byObjectRef.get(qualification.subjectProjectRef)?.content ?? qualification.subjectProjectRef} — ${qualification.temporalRole} : ${anchorLabel(qualification.anchor)}`,
      sourceItemIds: [qualification.subjectProjectRef],
      sourceTurnIds: [...qualification.provenance.sourceTurnRefs],
      sourceProposedType: "TEMPORAL_QUALIFICATION_VALUE",
      sourceStudyRole: qualification.temporalRole,
      sourcePolarity: "AFFIRMED",
      disposition: "USER_CONFIRMED_PROJECT_INFORMATION",
      canonicalPromotion: "NOT_PERFORMED",
    }));
  const expectedOccasionProjections: ResearchProjectElement[] = state.expectedVariableOccasions
    .filter((occasion) => occasion.actuality === "CURRENT")
    .map((occasion) => ({
      elementId: occasion.occasionId,
      semanticKey: `TEMPORALITY:EXPECTED_AT:${occasion.variableProjectRef}:${occasion.occasionId}`,
      content: `${byObjectRef.get(occasion.variableProjectRef)?.content ?? occasion.variableProjectRef} — EXPECTED_AT : ${anchorLabel(occasion.anchor)}`,
      sourceItemIds: [occasion.variableProjectRef],
      sourceTurnIds: [...occasion.provenance.sourceTurnRefs],
      sourceProposedType: "EXPECTED_VARIABLE_OCCASION_SUBRESOURCE",
      sourceStudyRole: null,
      sourcePolarity: "AFFIRMED",
      disposition: "USER_CONFIRMED_PROJECT_INFORMATION",
      canonicalPromotion: "NOT_PERFORMED",
    }));
  const legacyTemporalProjections = state.legacyTemporalObjects
    .filter(({ legacyObject }) => legacyObject.actuality === "CURRENT")
    .map(({ legacyObject }) => legacyObject.projection);
  return sectionTemplate.map((section) => {
    const canonicalObjects = currentObjects
      .filter((object) => object.sectionId === section.sectionId)
      .map((object) => object.projection);
    if (section.sectionId === "QUESTION") {
      const existingRefs = new Set(section.elements.map((element) => element.elementId));
      return {
        ...section,
        elements: [
          ...section.elements,
          ...canonicalObjects.filter((element) => !existingRefs.has(element.elementId)),
        ],
      };
    }
    return {
      ...section,
      elements: [
        ...canonicalObjects,
        ...(section.sectionId === "ANALYSIS" ? relationProjections : []),
        ...(section.sectionId === "TEMPORALITY" ? [...temporalProjections, ...expectedOccasionProjections, ...legacyTemporalProjections] : []),
      ],
    };
  });
};

export const migrateLegacyProjectToCanonicalState = (project: Omit<ResearchProjectOwnerProjection, "canonicalState">): CanonicalResearchProjectState => {
  const adoptedAt = project.adoptedAt;
  const entries = project.sections
    .filter((section) => section.sectionId !== "QUESTION")
    .flatMap((section) => section.elements.map((element) => ({ section, element })));
  const objectFromLegacyElement = ({ section, element }: typeof entries[number]) => {
      const item: ScientificContributionItem = {
        itemId: element.sourceItemIds[0] ?? element.elementId,
        semanticIdentity: element.elementId,
        proposedType: element.sourceProposedType ?? "PROJECT_INFORMATION",
        content: element.content,
        polarity: element.sourcePolarity ?? "AFFIRMED",
        studyRole: element.sourceStudyRole ?? null,
        confidence: null,
        evidenceRefs: [],
        epistemicBoundary: {
          ownership: "USER",
          epistemicStatus: "EXPLICIT_USER_STATED",
          adoptionStatus: "CONFIRMED_BY_USER",
          originType: "LEGACY_BRIDGE_STATE",
          originStatus: "MIGRATED_WITHOUT_RELATION_RECONSTRUCTION",
          activeState: true,
          sourceTurnIds: element.sourceTurnIds,
          sourceText: null,
        },
      };
      const objectId = element.elementId;
      return {
        objectId,
        objectVersionId: `${objectId}:version:1`,
        version: 1,
        objectType: canonicalProjectObjectType(item),
        sectionId: section.sectionId,
        content: element.content,
        scientificRole: element.sourceStudyRole ?? null,
        semanticKey: element.semanticKey ?? `${section.sectionId}:${normalized(element.content)}`,
        epistemicState: "KNOWN" as const,
        adoptionStatus: "ADOPTED_BY_HUMAN_DECISION" as const,
        actuality: "CURRENT" as const,
        coherence: "CONSISTENT" as const,
        supersedesVersionRef: null,
        supersededByVersionRef: null,
        provenance: {
          sourcePlan: "LEGACY_BRIDGE_STATE" as const,
          assertionKind: "LEGACY_MIGRATED" as const,
          sourceTurnRefs: [...element.sourceTurnIds],
          sourceText: null,
          proposalSourceTurnRefs: [],
          adoptionSourceTurnRefs: [],
          evidenceRefs: [],
          evidenceQualification: "NOT_EVALUATED" as const,
        },
        decisionRefs: [project.confirmationDecision.decisionId],
        sourceContributionRef: project.contributionRef,
        sourceItemRefs: [...element.sourceItemIds],
        adoptedAt,
        projection: element,
      };
  };
  const requiresTemporalMapping = ({ section, element }: typeof entries[number]) => {
    const item = { proposedType: element.sourceProposedType ?? null, studyRole: element.sourceStudyRole ?? null };
    return (section.sectionId === "TEMPORALITY" || temporalValueItem(item)) && !typeText(item).includes("VISIT");
  };
  const objects = entries.filter((entry) => !requiresTemporalMapping(entry)).map(objectFromLegacyElement);
  const legacyTemporalObjects: LegacyTemporalProjectObject[] = entries.filter(requiresTemporalMapping).map((entry) => ({
    legacyObject: { ...objectFromLegacyElement(entry), objectType: "TEMPORAL_ANCHOR" },
    mappingStatus: "NEW_MAPPING_REQUIRED",
    reason: "LEGACY_TEMPORAL_ROOT_OBJECT_HAS_NO_SAFE_AUTOMATIC_OWNER_MAPPING",
  }));
  const stateDigest = logicalDigest({
    projectId: project.projectId,
    versionId: project.versionId,
    objectVersions: objects.map((object) => object.objectVersionId).sort(),
    legacyTemporalVersions: legacyTemporalObjects.map(({ legacyObject }) => legacyObject.objectVersionId).sort(),
  });
  return {
    contract: CANONICAL_RESEARCH_PROJECT_STATE_CONTRACT,
    contractVersion: CANONICAL_RESEARCH_PROJECT_STATE_VERSION,
    contractNature: "PRJ_OWNED_MATERIALIZED_PD003_PROJECT_AGGREGATE",
    owner: "RESEARCH_PROJECT",
    projectId: project.projectId,
    currentVersionId: project.versionId,
    revision: project.revision,
    objects,
    relations: [],
    temporalQualifications: [],
    expectedVariableOccasions: [],
    legacyTemporalObjects,
    decisionLedger: [{
      ledgerEntryId: `project-ledger:legacy:${logicalDigest({ project: project.projectId, version: project.versionId })}`,
      sourceContributionRef: project.contributionRef,
      sourceTurnRefs: [...new Set([
        ...objects.flatMap((object) => object.provenance.sourceTurnRefs),
        ...legacyTemporalObjects.flatMap(({ legacyObject }) => legacyObject.provenance.sourceTurnRefs),
      ])],
      candidateChangeRefs: project.appliedChangeSet?.changes.map((change) => change.changeId) ?? [],
      operationSummary: project.appliedChangeSet?.changes.filter((change) => change.operation !== "NO_CHANGE").map((change) => change.operation as "ADD" | "REMOVE" | "REPLACE") ?? ["ADD"],
      objectRefs: objects.map((object) => object.objectId),
      relationRefs: [],
      temporalQualificationRefs: [],
      expectedVariableOccasionRefs: [],
      legacyTemporalRefs: legacyTemporalObjects.map(({ legacyObject }) => legacyObject.objectId),
      previousRefs: project.previousVersionId ? [project.previousVersionId] : [],
      temporalChanges: [],
      expectedOccasionChanges: [],
      humanDecisionRef: project.confirmationDecision.decisionId,
      humanActorRef: project.confirmationDecision.actor ?? "LEGACY_ACTOR_UNKNOWN",
      humanMandateRef: project.confirmationDecision.mandate ?? "LEGACY_MANDATE_UNKNOWN",
      resultingProjectVersion: project.versionId,
      decidedAt: adoptedAt,
    }],
    versionHistory: [{
      versionId: project.versionId,
      previousVersionId: project.previousVersionId,
      revision: project.revision,
      objectVersionRefs: objects.map((object) => object.objectVersionId).sort(),
      relationVersionRefs: [],
      temporalQualificationVersionRefs: [],
      expectedVariableOccasionVersionRefs: [],
      legacyTemporalVersionRefs: legacyTemporalObjects.map(({ legacyObject }) => legacyObject.objectVersionId).sort(),
      decisionRefs: [project.confirmationDecision.decisionId],
      sourceContributionRef: project.contributionRef,
      createdAt: adoptedAt,
      stateDigest,
    }],
    activeConflicts: [],
  };
};

const normalizeCanonicalProjectState = (state: CanonicalResearchProjectState): CanonicalResearchProjectState => {
  type LegacyCanonicalState = Omit<CanonicalResearchProjectState,
    "contractVersion" | "objects" | "temporalQualifications" | "expectedVariableOccasions" | "legacyTemporalObjects"> & {
    contractVersion?: string;
    objects: Array<CanonicalProjectObjectVersion | LegacyTemporalProjectObject["legacyObject"]>;
    temporalQualifications?: CanonicalTemporalQualificationVersion[];
    expectedVariableOccasions?: CanonicalExpectedVariableOccasionVersion[];
    legacyTemporalObjects?: LegacyTemporalProjectObject[];
  };
  const raw = state as unknown as LegacyCanonicalState;
  const temporalRoots = raw.objects.filter((object): object is LegacyTemporalProjectObject["legacyObject"] => object.objectType === "TEMPORAL_ANCHOR");
  const objects = raw.objects.filter((object): object is CanonicalProjectObjectVersion => object.objectType !== "TEMPORAL_ANCHOR");
  return {
    ...raw,
    contractVersion: CANONICAL_RESEARCH_PROJECT_STATE_VERSION,
    objects,
    temporalQualifications: raw.temporalQualifications ?? [],
    expectedVariableOccasions: raw.expectedVariableOccasions ?? [],
    legacyTemporalObjects: [
      ...(raw.legacyTemporalObjects ?? []),
      ...temporalRoots.map((legacyObject) => ({
        legacyObject,
        mappingStatus: "NEW_MAPPING_REQUIRED" as const,
        reason: "LEGACY_TEMPORAL_ROOT_OBJECT_HAS_NO_SAFE_AUTOMATIC_OWNER_MAPPING" as const,
      })),
    ],
    decisionLedger: raw.decisionLedger.map((entry) => ({
      ...entry,
      temporalQualificationRefs: entry.temporalQualificationRefs ?? [],
      expectedVariableOccasionRefs: entry.expectedVariableOccasionRefs ?? [],
      legacyTemporalRefs: entry.legacyTemporalRefs ?? [],
      temporalChanges: entry.temporalChanges ?? [],
      expectedOccasionChanges: entry.expectedOccasionChanges ?? [],
    })),
    versionHistory: raw.versionHistory.map((version) => ({
      ...version,
      temporalQualificationVersionRefs: version.temporalQualificationVersionRefs ?? [],
      expectedVariableOccasionVersionRefs: version.expectedVariableOccasionVersionRefs ?? [],
      legacyTemporalVersionRefs: version.legacyTemporalVersionRefs ?? [],
    })),
  };
};

export const ensureCanonicalProjectState = (project: ResearchProjectOwnerProjection): CanonicalResearchProjectState =>
  project.canonicalState
    ? normalizeCanonicalProjectState(project.canonicalState)
    : migrateLegacyProjectToCanonicalState(project as Omit<ResearchProjectOwnerProjection, "canonicalState">);

export type ProjectContextSnapshot = {
  contract: "PROJECT_CONTEXT_SNAPSHOT";
  contractVersion: "0.3.0";
  owner: "RESEARCH_PROJECT";
  sourceProjectRef: string;
  sourceProjectVersion: string;
  sourceProjectDigest: string;
  sourceProjectRevision: number;
  previousProjectVersion: string | null;
  sourceContributionRef: string;
  sourceContributionDigest: string;
  objects: Array<{
    stableId: string;
    versionRef: string;
    version: number;
    type: CanonicalProjectObjectType;
    content: string;
    scientificRole: string | null;
    semanticKey: string;
    epistemicState: CanonicalProjectEpistemicState;
    provenanceKind: CanonicalProjectProvenance["assertionKind"];
    provenance: CanonicalProjectProvenance;
    decisionRefs: string[];
    sourceContributionRef: string;
    sourceItemRefs: string[];
  }>;
  relations: Array<{
    stableId: string;
    versionRef: string;
    type: string;
    sourceProjectRef: string;
    targetProjectRef: string;
    polarity: string | null;
    epistemicState: CanonicalProjectEpistemicState;
    provenance: CanonicalProjectProvenance;
    decisionRefs: string[];
    sourceContributionRef: string;
  }>;
  temporalQualifications: Array<{
    stableId: string;
    versionRef: string;
    subjectProjectRef: string;
    temporalRole: CanonicalProjectTemporalRole;
    anchor: CanonicalTemporalAnchorValue;
    provenanceKind: CanonicalProjectProvenance["assertionKind"];
    provenance: CanonicalProjectProvenance;
    decisionRefs: string[];
    sourceContributionRef: string;
  }>;
  expectedVariableOccasions: Array<{
    stableId: string;
    versionRef: string;
    relationType: "EXPECTED_AT";
    variableProjectRef: string;
    anchor: CanonicalTemporalAnchorValue;
    studyUnitOrGroupRef: string | null;
    applicableContext: string | null;
    provenanceKind: CanonicalProjectProvenance["assertionKind"];
    provenance: CanonicalProjectProvenance;
    decisionRefs: string[];
    sourceContributionRef: string;
  }>;
  historicalObjectVersions: Array<{
    stableId: string;
    versionRef: string;
    version: number;
    type: CanonicalProjectObjectType;
    content: string;
    scientificRole: string | null;
    supersededByVersionRef: string | null;
    provenance: CanonicalProjectProvenance;
    decisionRefs: string[];
  }>;
  historicalRelationVersions: Array<{
    stableId: string;
    versionRef: string;
    version: number;
    type: string;
    sourceProjectRef: string;
    targetProjectRef: string;
    supersededByVersionRef: string | null;
    provenance: CanonicalProjectProvenance;
    decisionRefs: string[];
  }>;
  historicalTemporalQualificationVersions: Array<{
    stableId: string;
    versionRef: string;
    version: number;
    subjectProjectRef: string;
    temporalRole: CanonicalProjectTemporalRole;
    anchor: CanonicalTemporalAnchorValue;
    supersededByVersionRef: string | null;
    provenance: CanonicalProjectProvenance;
    decisionRefs: string[];
  }>;
  historicalExpectedVariableOccasionVersions: Array<{
    stableId: string;
    versionRef: string;
    version: number;
    variableProjectRef: string;
    anchor: CanonicalTemporalAnchorValue;
    supersededByVersionRef: string | null;
    provenance: CanonicalProjectProvenance;
    decisionRefs: string[];
  }>;
  legacyTemporalMappings: Array<{
    legacyObjectRef: string;
    legacyVersionRef: string;
    mappingStatus: "NEW_MAPPING_REQUIRED";
  }>;
  openConflicts: CanonicalProjectConflict[];
  openIssues: Array<{
    issueRef: string;
    kind: "UNKNOWN" | "AMBIGUITY" | "LIMITATION" | "CONTRADICTION";
    reason: string;
    sourceRefs: string[];
  }>;
  humanDecisions: HumanDecisionEnvelope[];
  decisionLedger: CanonicalProjectDecisionLedgerEntry[];
  versionHistory: CanonicalProjectVersionRecord[];
  specializedResponsibilities: SpecializedResponsibility[];
  pendingVerificationRefs: string[];
  activeQryNeed: null | { id: string; purpose: string; targetRefs: string[] };
  snapshotDigest: string;
  readOnly: true;
};

const deepFreezeProjectContext = <T>(value: T): Readonly<T> => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach((nested) => deepFreezeProjectContext(nested));
    Object.freeze(value);
  }
  return value;
};

export const buildProjectContextSnapshot = (input: {
  project: ResearchProjectOwnerProjection;
  activeQryNeed?: { id: string; purpose: string; targetRefs: string[] } | null;
}): ProjectContextSnapshot => {
  const state = ensureCanonicalProjectState(input.project);
  const objects = state.objects.filter((object) => object.actuality === "CURRENT").map((object) => ({
    stableId: object.objectId,
    versionRef: object.objectVersionId,
    version: object.version,
    type: object.objectType,
    content: object.content,
    scientificRole: object.scientificRole,
    semanticKey: object.semanticKey,
    epistemicState: object.epistemicState,
    provenanceKind: object.provenance.assertionKind,
    provenance: {
      ...object.provenance,
      sourceTurnRefs: [...object.provenance.sourceTurnRefs],
      proposalSourceTurnRefs: [...object.provenance.proposalSourceTurnRefs],
      adoptionSourceTurnRefs: [...object.provenance.adoptionSourceTurnRefs],
      evidenceRefs: [...object.provenance.evidenceRefs],
    },
    decisionRefs: [...object.decisionRefs],
    sourceContributionRef: object.sourceContributionRef,
    sourceItemRefs: [...object.sourceItemRefs],
  }));
  const relations = state.relations.filter((relation) => relation.actuality === "CURRENT").map((relation) => ({
    stableId: relation.relationId,
    versionRef: relation.relationVersionId,
    type: relation.relationType,
    sourceProjectRef: relation.sourceObjectRef,
    targetProjectRef: relation.targetObjectRef,
    polarity: relation.polarity,
    epistemicState: relation.epistemicState,
    provenance: { ...relation.provenance,
      sourceTurnRefs: [...relation.provenance.sourceTurnRefs],
      proposalSourceTurnRefs: [...relation.provenance.proposalSourceTurnRefs],
      adoptionSourceTurnRefs: [...relation.provenance.adoptionSourceTurnRefs],
      evidenceRefs: [...relation.provenance.evidenceRefs] },
    decisionRefs: [...relation.decisionRefs],
    sourceContributionRef: relation.sourceContributionRef,
  }));
  const temporalQualifications = state.temporalQualifications
    .filter((qualification) => qualification.actuality === "CURRENT")
    .map((qualification) => ({
      stableId: qualification.qualificationId,
      versionRef: qualification.qualificationVersionId,
      subjectProjectRef: qualification.subjectProjectRef,
      temporalRole: qualification.temporalRole,
      anchor: qualification.anchor,
      provenanceKind: qualification.provenance.assertionKind,
      provenance: { ...qualification.provenance,
        sourceTurnRefs: [...qualification.provenance.sourceTurnRefs],
        proposalSourceTurnRefs: [...qualification.provenance.proposalSourceTurnRefs],
        adoptionSourceTurnRefs: [...qualification.provenance.adoptionSourceTurnRefs],
        evidenceRefs: [...qualification.provenance.evidenceRefs] },
      decisionRefs: [...qualification.decisionRefs],
      sourceContributionRef: qualification.sourceContributionRef,
    }));
  const expectedVariableOccasions = state.expectedVariableOccasions
    .filter((occasion) => occasion.actuality === "CURRENT")
    .map((occasion) => ({
      stableId: occasion.occasionId,
      versionRef: occasion.occasionVersionId,
      relationType: occasion.relationType,
      variableProjectRef: occasion.variableProjectRef,
      anchor: occasion.anchor,
      studyUnitOrGroupRef: occasion.studyUnitOrGroupRef,
      applicableContext: occasion.applicableContext,
      provenanceKind: occasion.provenance.assertionKind,
      provenance: { ...occasion.provenance,
        sourceTurnRefs: [...occasion.provenance.sourceTurnRefs],
        proposalSourceTurnRefs: [...occasion.provenance.proposalSourceTurnRefs],
        adoptionSourceTurnRefs: [...occasion.provenance.adoptionSourceTurnRefs],
        evidenceRefs: [...occasion.provenance.evidenceRefs] },
      decisionRefs: [...occasion.decisionRefs],
      sourceContributionRef: occasion.sourceContributionRef,
    }));
  const historicalObjectVersions = state.objects.filter((object) => object.actuality === "SUPERSEDED").map((object) => ({
    stableId: object.objectId,
    versionRef: object.objectVersionId,
    version: object.version,
    type: object.objectType,
    content: object.content,
    scientificRole: object.scientificRole,
    supersededByVersionRef: object.supersededByVersionRef,
    provenance: { ...object.provenance,
      sourceTurnRefs: [...object.provenance.sourceTurnRefs],
      proposalSourceTurnRefs: [...object.provenance.proposalSourceTurnRefs],
      adoptionSourceTurnRefs: [...object.provenance.adoptionSourceTurnRefs],
      evidenceRefs: [...object.provenance.evidenceRefs] },
    decisionRefs: [...object.decisionRefs],
  }));
  const historicalRelationVersions = state.relations.filter((relation) => relation.actuality === "SUPERSEDED").map((relation) => ({
    stableId: relation.relationId,
    versionRef: relation.relationVersionId,
    version: relation.version,
    type: relation.relationType,
    sourceProjectRef: relation.sourceObjectRef,
    targetProjectRef: relation.targetObjectRef,
    supersededByVersionRef: relation.supersededByVersionRef,
    provenance: { ...relation.provenance,
      sourceTurnRefs: [...relation.provenance.sourceTurnRefs],
      proposalSourceTurnRefs: [...relation.provenance.proposalSourceTurnRefs],
      adoptionSourceTurnRefs: [...relation.provenance.adoptionSourceTurnRefs],
      evidenceRefs: [...relation.provenance.evidenceRefs] },
    decisionRefs: [...relation.decisionRefs],
  }));
  const historicalTemporalQualificationVersions = state.temporalQualifications.filter((qualification) => qualification.actuality === "SUPERSEDED").map((qualification) => ({
    stableId: qualification.qualificationId,
    versionRef: qualification.qualificationVersionId,
    version: qualification.version,
    subjectProjectRef: qualification.subjectProjectRef,
    temporalRole: qualification.temporalRole,
    anchor: qualification.anchor,
    supersededByVersionRef: qualification.supersededByVersionRef,
    provenance: { ...qualification.provenance,
      sourceTurnRefs: [...qualification.provenance.sourceTurnRefs],
      proposalSourceTurnRefs: [...qualification.provenance.proposalSourceTurnRefs],
      adoptionSourceTurnRefs: [...qualification.provenance.adoptionSourceTurnRefs],
      evidenceRefs: [...qualification.provenance.evidenceRefs] },
    decisionRefs: [...qualification.decisionRefs],
  }));
  const historicalExpectedVariableOccasionVersions = state.expectedVariableOccasions.filter((occasion) => occasion.actuality === "SUPERSEDED").map((occasion) => ({
    stableId: occasion.occasionId,
    versionRef: occasion.occasionVersionId,
    version: occasion.version,
    variableProjectRef: occasion.variableProjectRef,
    anchor: occasion.anchor,
    supersededByVersionRef: occasion.supersededByVersionRef,
    provenance: { ...occasion.provenance,
      sourceTurnRefs: [...occasion.provenance.sourceTurnRefs],
      proposalSourceTurnRefs: [...occasion.provenance.proposalSourceTurnRefs],
      adoptionSourceTurnRefs: [...occasion.provenance.adoptionSourceTurnRefs],
      evidenceRefs: [...occasion.provenance.evidenceRefs] },
    decisionRefs: [...occasion.decisionRefs],
  }));
  const legacyTemporalMappings = state.legacyTemporalObjects.map((entry) => ({
    legacyObjectRef: entry.legacyObject.objectId,
    legacyVersionRef: entry.legacyObject.objectVersionId,
    mappingStatus: entry.mappingStatus,
  }));
  const openIssues: ProjectContextSnapshot["openIssues"] = [
    ...objects.filter((object) => object.epistemicState === "UNKNOWN").map((object) => ({
      issueRef: object.stableId,
      kind: object.type === "UNCERTAINTY" && object.scientificRole?.toLocaleUpperCase("en-US").includes("AMBIGU") ? "AMBIGUITY" as const : "UNKNOWN" as const,
      reason: object.content,
      sourceRefs: [object.versionRef, object.sourceContributionRef, ...object.sourceItemRefs],
    })),
    ...objects.filter((object) => object.type === "CONSTRAINT" && object.scientificRole?.toLocaleUpperCase("en-US").includes("LIMITATION")).map((object) => ({
      issueRef: object.stableId,
      kind: "LIMITATION" as const,
      reason: object.content,
      sourceRefs: [object.versionRef, object.sourceContributionRef, ...object.sourceItemRefs],
    })),
    ...objects.filter((object) => object.type === "CONTRADICTION").map((object) => ({
      issueRef: object.stableId,
      kind: "CONTRADICTION" as const,
      reason: object.content,
      sourceRefs: [object.versionRef, object.sourceContributionRef, ...object.sourceItemRefs],
    })),
    ...temporalQualifications.flatMap((qualification) => qualification.anchor.reference.status === "UNKNOWN" ? [{
      issueRef: `${qualification.stableId}:reference`,
      kind: "UNKNOWN" as const,
      reason: qualification.anchor.reference.unresolvedReason,
      sourceRefs: [qualification.versionRef, qualification.sourceContributionRef],
    }] : []),
    ...expectedVariableOccasions.flatMap((occasion) => occasion.anchor.reference.status === "UNKNOWN" ? [{
      issueRef: `${occasion.stableId}:reference`,
      kind: "UNKNOWN" as const,
      reason: occasion.anchor.reference.unresolvedReason,
      sourceRefs: [occasion.versionRef, occasion.sourceContributionRef],
    }] : []),
    ...state.activeConflicts.map((conflict) => ({
      issueRef: conflict.conflictId,
      kind: "CONTRADICTION" as const,
      reason: conflict.message,
      sourceRefs: [...conflict.existingRefs, ...conflict.candidateRefs],
    })),
  ];
  const base = {
    contract: "PROJECT_CONTEXT_SNAPSHOT" as const,
    contractVersion: "0.3.0" as const,
    owner: "RESEARCH_PROJECT" as const,
    sourceProjectRef: input.project.projectId,
    sourceProjectVersion: input.project.versionId,
    sourceProjectDigest: input.project.projectDigest,
    sourceProjectRevision: input.project.revision,
    previousProjectVersion: input.project.previousVersionId,
    sourceContributionRef: input.project.contributionRef,
    sourceContributionDigest: input.project.contributionDigest,
    objects,
    relations,
    temporalQualifications,
    expectedVariableOccasions,
    historicalObjectVersions,
    historicalRelationVersions,
    historicalTemporalQualificationVersions,
    historicalExpectedVariableOccasionVersions,
    legacyTemporalMappings,
    openConflicts: [...state.activeConflicts],
    openIssues,
    humanDecisions: [{ ...input.project.confirmationDecision, provenance: [...input.project.confirmationDecision.provenance] }],
    decisionLedger: state.decisionLedger.map((entry) => ({
      ...entry,
      sourceTurnRefs: [...entry.sourceTurnRefs],
      candidateChangeRefs: [...entry.candidateChangeRefs],
      operationSummary: [...entry.operationSummary],
      objectRefs: [...entry.objectRefs],
      relationRefs: [...entry.relationRefs],
      temporalQualificationRefs: [...entry.temporalQualificationRefs],
      expectedVariableOccasionRefs: [...entry.expectedVariableOccasionRefs],
      legacyTemporalRefs: [...entry.legacyTemporalRefs],
      previousRefs: [...entry.previousRefs],
      temporalChanges: entry.temporalChanges.map((change) => ({ ...change })),
      expectedOccasionChanges: entry.expectedOccasionChanges.map((change) => ({ ...change })),
    })),
    versionHistory: state.versionHistory.map((version) => ({
      ...version,
      objectVersionRefs: [...version.objectVersionRefs],
      relationVersionRefs: [...version.relationVersionRefs],
      temporalQualificationVersionRefs: [...version.temporalQualificationVersionRefs],
      expectedVariableOccasionVersionRefs: [...version.expectedVariableOccasionVersionRefs],
      legacyTemporalVersionRefs: [...version.legacyTemporalVersionRefs],
      decisionRefs: [...version.decisionRefs],
    })),
    specializedResponsibilities: input.project.specializedResponsibilities.map((responsibility) => ({
      ...responsibility,
      sourceItemIds: [...responsibility.sourceItemIds],
    })),
    pendingVerificationRefs: [
      ...state.objects.filter((object) => object.actuality === "CURRENT" && object.provenance.evidenceQualification === "NOT_EVALUATED").map((object) => object.objectId),
      ...state.temporalQualifications.filter((qualification) => qualification.actuality === "CURRENT" && qualification.provenance.evidenceQualification === "NOT_EVALUATED").map((qualification) => qualification.qualificationId),
      ...state.expectedVariableOccasions.filter((occasion) => occasion.actuality === "CURRENT" && occasion.provenance.evidenceQualification === "NOT_EVALUATED").map((occasion) => occasion.occasionId),
    ],
    activeQryNeed: input.activeQryNeed ?? null,
    readOnly: true as const,
  };
  const detached = JSON.parse(JSON.stringify(base)) as typeof base;
  return deepFreezeProjectContext({ ...detached, snapshotDigest: logicalDigest(detached) }) as ProjectContextSnapshot;
};
