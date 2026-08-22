import { logicalDigest } from "@/features/knowledge-engine/canonical";
import {
  createHumanDecisionCandidate,
  engageHumanDecision,
  type HumanDecisionEnvelope,
} from "@/features/protocol-designer/human-decision";
import type {
  ScientificContributionItem,
  ScientificInterpretationContributionEnvelope,
} from "@/features/scientific-interpretation/contracts";
import { RESEARCH_PROJECT_CONSTRUCTION_VERSION } from "./types";

export const RESEARCH_PROJECT_CONTRIBUTION_BOUNDARY = "PRJ_001_CONTRIBUTION_INTAKE_ADAPTER" as const;
export const PRJ001_CONTRIBUTION_INTAKE_GAP = {
  existingContractGap: "PRJ001_V1_REQUIRES_SCIENTIFIC_THINKING_HANDOFF_AND_CANNOT_REPRESENT_EXPLICIT_IMAGING_PENDING_OWNER_WITHOUT_FALSE_NOT_APPLICABLE_FALSE_FROZEN_OR_REFUSAL",
  adaptationScope: "USER_CONFIRMED_PROJECT_INFORMATION_ONLY_NO_DESIGN_FREEZE_NO_PD003_V2_CANONICAL_PROMOTION",
} as const;

export type ResearchProjectSectionId =
  | "QUESTION"
  | "POPULATION"
  | "DESIGN"
  | "INTERVENTION"
  | "COMPARATOR"
  | "IMAGING"
  | "MEASUREMENTS"
  | "TEMPORALITY"
  | "ANALYSIS";

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
  semanticRoles?: string[];
  semanticBasis?: "EXPLICIT" | "CONTEXTUAL" | "AMBIGUOUS" | "NOT_SPECIFIED";
  quantitativeBounds?: { lower: number | null; upper: number | null; unit: string | null } | null;
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
  status: "CANDIDATE_PENDING_HUMAN_CONFIRMATION" | "NO_NET_CHANGE";
  projectWriteAuthorized: false;
  contributionRef: string;
  contributionDigest: string;
  changeSet: ContributionProjectChangeSet;
  proposedSections: ResearchProjectSection[];
  specializedResponsibilities: SpecializedResponsibility[];
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
};

const SECTION_LABELS: Record<ResearchProjectSectionId, string> = {
  QUESTION: "Question",
  POPULATION: "Population",
  DESIGN: "Design",
  INTERVENTION: "Intervention",
  COMPARATOR: "Comparateur",
  IMAGING: "Imagerie",
  MEASUREMENTS: "Mesures / biomarqueurs",
  TEMPORALITY: "Temporalité",
  ANALYSIS: "Analyse",
};

export const RESEARCH_PROJECT_SECTION_ORDER = Object.keys(SECTION_LABELS) as ResearchProjectSectionId[];

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

const semanticRolesForItem = (item: ScientificContributionItem) => [...new Set([
  item.studyRole,
  ...(item.semanticFunction === "EXCLUSION" ? ["EXCLUSION"] : []),
  ...(item.semanticFunction === "INCLUSION" ? ["INCLUSION"] : []),
].filter((value): value is string => Boolean(value)))];

const rolePresentation = (role: string) => {
  const normalizedRole = folded(role);
  if (/primary.*endpoint|endpoint.*primary|critere.*principal/.test(normalizedRole)) return "Critère de jugement principal";
  if (/exclusion/.test(normalizedRole)) return "Exclusion";
  if (/inclusion/.test(normalizedRole)) return "Inclusion";
  return role.replace(/_/g, " ").toLocaleLowerCase("fr-FR");
};

export const sectionForContributionItem = (
  item: ScientificContributionItem,
  contribution: ScientificInterpretationContributionEnvelope,
): ResearchProjectSectionId | null => {
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
  if (/POPULATION|ELIGIBILITY|CRITERION|CONDITION|DISEASE/.test(type)) return "POPULATION";
  if (/STUDY_DESIGN|DESIGN|SETTING|CENTER/.test(type)) return "DESIGN";
  if (/COMPARATOR|CONTROL_ARM|REFERENCE_ARM/.test(type)) return "COMPARATOR";
  if (/INTERVENTION|TREATMENT|EXPOSURE_ARM/.test(type)) return "INTERVENTION";
  if (/TIMING|TEMPORAL|TIMEPOINT|WINDOW|VISIT/.test(type)) return "TEMPORALITY";
  if (/MODALITY|IMAGING_METHOD|ACQUISITION/.test(type)) return "IMAGING";
  if (/ANALYSIS|ESTIMAND|STATISTICAL/.test(type)) return "ANALYSIS";
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

const itemContext = (item: ScientificContributionItem, contribution: ScientificInterpretationContributionEnvelope) => [
  itemLocalContext(item),
  ...contribution.source.turns
    .filter((turn) => item.epistemicBoundary.sourceTurnIds.includes(turn.turnId))
    .map((turn) => turn.content),
].filter((value): value is string => Boolean(value)).join(" ");

type SpecializedProjectElement = {
  semanticKey: string;
  content: string;
  quantitativeBounds?: { lower: number | null; upper: number | null; unit: string | null } | null;
};

const populationEventWindow = (
  item: ScientificContributionItem,
  sectionId: ResearchProjectSectionId,
): SpecializedProjectElement | null => {
  if (sectionId !== "POPULATION") return null;
  const context = foldedWithSeparators(itemLocalContext(item));
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
  const localContext = folded(itemLocalContext(item));
  const fallbackContext = folded(itemContext(item, contribution));
  const localWithSeparators = foldedWithSeparators(itemLocalContext(item));
  const context = /\bage\b/.test(localContext) ? localContext : fallbackContext;
  const ageSignal = /\bage\b/.test(localContext)
    || /\b\d{1,3}(?:[.,]\d+)?\s*(?:ans?|years?)\b/.test(localWithSeparators);
  if (sectionId !== "POPULATION" || !/ELIGIBILITY|CRITERION|LOWER_BOUND|UPPER_BOUND/.test(typeOf(item)) || !ageSignal) return [];
  const structuredLower = item.quantitativeBounds?.lower ?? null;
  const structuredUpper = item.quantitativeBounds?.upper ?? null;
  if (structuredLower !== null || structuredUpper !== null) return [
    ...(structuredLower !== null ? [{ semanticKey: "POPULATION:ELIGIBILITY:AGE:MIN", content: `Âge minimal : ${structuredLower} ans`, quantitativeBounds: { lower: structuredLower, upper: null, unit: "ans" } }] : []),
    ...(structuredUpper !== null ? [{ semanticKey: "POPULATION:ELIGIBILITY:AGE:MAX", content: `Âge maximal : ${structuredUpper} ans`, quantitativeBounds: { lower: null, upper: structuredUpper, unit: "ans" } }] : []),
  ];
  const range = localWithSeparators.match(/\b(\d{1,3}(?:[.,]\d+)?)\s*(?:a|au|to|et|and|-|–)\s*(\d{1,3}(?:[.,]\d+)?)\s*(?:ans?|years?)\b/);
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
  const localDirection = directionIn(localContext);
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

const quantitativeCriterion = (
  item: ScientificContributionItem,
  sectionId: ResearchProjectSectionId,
): SpecializedProjectElement | null => {
  const bounds = item.quantitativeBounds;
  if (!bounds || (bounds.lower === null && bounds.upper === null)) return null;
  const unit = bounds.unit ? ` ${bounds.unit}` : "";
  const direction = bounds.lower !== null && bounds.upper !== null ? "RANGE"
    : bounds.lower !== null ? "MIN" : "MAX";
  const value = direction === "RANGE" ? `${bounds.lower}–${bounds.upper}${unit}`
    : direction === "MIN" ? `minimum : ${bounds.lower}${unit}`
      : `maximum : ${bounds.upper}${unit}`;
  const explicitValues = [bounds.lower, bounds.upper].filter((bound): bound is number => bound !== null);
  const contentAlreadyCarriesValues = explicitValues.every((bound) => new RegExp(`\\b${String(bound).replace(".", "[.,]")}\\b`).test(item.content));
  return {
    semanticKey: `${sectionId}:QUANTITATIVE:${stableSemanticIdentity(item)}:${direction}`,
    content: contentAlreadyCarriesValues ? capitalize(item.content.trim()) : `${capitalize(item.content.trim())} ${value}`,
    quantitativeBounds: { ...bounds },
  };
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
  const localSource = foldedWithSeparators(`${item.epistemicBoundary.sourceText ?? ""} ${item.content}`);
  const temporalSignature = localSource.match(/(?:j|jour)\s*\d+\s*(?:et|a|au|to|-|–)\s*(?:(?:j|jour)\s*)?\d+|\b[jmw]\s*\d+\b|\d+(?:[.,]\d+)?\s*(?:mois|months?|semaines?|weeks?|jours?|days?|ans?|years?)/)?.[0] ?? null;
  const sourceClause = temporalSignature
    ? userSource.split(/\b(?:puis|ensuite|then|followed by)\b/).find((clause) => clause.includes(temporalSignature)) ?? ""
    : "";
  const context = folded(`${itemLocalContext(item)} ${sourceClause}`);
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
  const localContext = folded(itemLocalContext(item));
  const localWithSeparators = foldedWithSeparators(itemLocalContext(item));
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
  const quantitative = quantitativeCriterion(item, sectionId);
  const specialized: Array<SpecializedProjectElement | null> = age.length ? age : eventWindow ? [eventWindow] : timing ? [timing] : quantitative ? [quantitative] : [null];
  const semanticRoles = semanticRolesForItem(item);
  return specialized.map((value, index) => {
    const quantitativeRoles = value?.semanticKey.endsWith(":MIN") ? ["LOWER_BOUND"]
      : value?.semanticKey.endsWith(":MAX") ? ["UPPER_BOUND"]
        : [
          ...(item.quantitativeBounds?.lower !== null && item.quantitativeBounds?.lower !== undefined ? ["LOWER_BOUND"] : []),
          ...(item.quantitativeBounds?.upper !== null && item.quantitativeBounds?.upper !== undefined ? ["UPPER_BOUND"] : []),
        ];
    const elementRoles = [...new Set([...semanticRoles, ...quantitativeRoles])];
    return {
    elementId: value && specialized.length > 1
      ? `${item.semanticIdentity ?? item.itemId}:${value.semanticKey.split(":").at(-1)?.toLocaleLowerCase("fr-FR") ?? index}`
      : item.semanticIdentity ?? item.itemId,
    semanticKey: value?.semanticKey ?? `${sectionId}:${folded(item.proposedType ?? item.studyRole ?? "ITEM")}:${stableSemanticIdentity(item)}`,
    content: value?.content ?? (elementRoles.includes("EXCLUSION")
      ? `Exclusion : ${capitalize(item.content.trim())}`
      : elementRoles.includes("INCLUSION")
        ? `Inclusion : ${capitalize(item.content.trim())}`
        : item.content.trim()),
    sourceItemIds: [item.itemId],
    sourceTurnIds: item.epistemicBoundary.sourceTurnIds,
    sourceProposedType: item.proposedType,
    sourceStudyRole: item.studyRole,
    sourcePolarity: item.polarity,
    semanticRoles: elementRoles,
    semanticBasis: item.evidenceBasis,
    quantitativeBounds: value?.quantitativeBounds ?? item.quantitativeBounds ?? null,
    disposition: "USER_CONFIRMED_PROJECT_INFORMATION",
    canonicalPromotion: "NOT_PERFORMED",
    };
  });
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
  return `${context}|roles:${[...(element.semanticRoles ?? [])].sort().join(",")}`;
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
  ...contributionItems(contribution)
    .filter((item) => !(item.referencedProjectElementIds?.length && ["ROLE_ASSIGNMENT", "REFERENCE"].includes(item.semanticFunction ?? "")))
    .flatMap((item) => elementsFrom(item, contribution)),
  ...relationElements(contribution),
];

const sectionForElement = (element: ResearchProjectElement, contribution: ScientificInterpretationContributionEnvelope): ResearchProjectSectionId | null => {
  if (element.sourceProposedType === "COMPARATIVE_RELATION") return "ANALYSIS";
  const item = structuredProjectItems(contribution).find((candidate) => element.sourceItemIds.includes(candidate.itemId));
  return item ? sectionForContributionItem(item, contribution) : null;
};

export const researchProjectQuestionPresentation = (sections: ResearchProjectSection[]) => {
  const elements = (sectionId: ResearchProjectSectionId) => sections.find((section) => section.sectionId === sectionId)?.elements ?? [];
  const condition = elements("POPULATION").find((element) => /CONDITION|DISEASE/i.test(`${element.sourceProposedType ?? ""} ${element.sourceStudyRole ?? ""}`))?.content;
  const intervention = elements("INTERVENTION")[0]?.content;
  const comparator = elements("COMPARATOR")[0]?.content;
  const measurement = elements("MEASUREMENTS")[0]?.content;
  if (condition && intervention && comparator) return `Projet sur ${condition}, avec ${intervention} comme intervention et ${comparator} comme comparateur.`;
  if (condition && intervention) return `Projet sur ${condition}, avec ${intervention} comme intervention.`;
  if (condition) return `Projet portant sur ${condition}.`;
  if (measurement) return `Projet portant sur ${measurement}.`;
  return "Projet de recherche à préciser.";
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
    const addedRoles = (proposed.semanticRoles ?? []).filter((role) => !(previous.semanticRoles ?? []).includes(role));
    if (previous.content === proposed.content && addedRoles.length > 0) {
      return `${rolePresentation(addedRoles[0]!)} : ${proposed.content}`;
    }
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

const currentElements = (current: ResearchProjectOwnerProjection | null) => (current?.sections ?? [])
  .filter((section) => section.sectionId !== "QUESTION")
  .flatMap((section) => section.elements.map((element) => ({ sectionId: section.sectionId, element })));

const roleAssignmentTarget = (
  assignment: ScientificContributionItem,
  candidates: Array<{ sectionId: ResearchProjectSectionId; element: ResearchProjectElement }>,
) => {
  const referenced = candidates.filter(({ sectionId, element }) => (assignment.referencedProjectElementIds ?? []).some((ref) =>
    ref === element.elementId || ref === semanticKeyForElement(sectionId, element) || element.sourceItemIds.includes(ref)));
  if (referenced.length <= 1) return referenced[0];
  const role = typeOf(assignment);
  const expectedSection: ResearchProjectSectionId | null = /ENDPOINT|OUTCOME|MEASURED_VARIABLE|MEASUREMENT|BIOMARKER/.test(role) ? "MEASUREMENTS"
    : /EXCLUSION|INCLUSION|ELIGIBILITY|POPULATION/.test(role) ? "POPULATION"
      : /COMPARATOR|CONTROL_ARM|REFERENCE_ARM/.test(role) ? "COMPARATOR"
        : /INTERVENTION|TREATMENT|EXPOSURE/.test(role) ? "INTERVENTION"
          : /MODALITY|IMAGING|ACQUISITION/.test(role) ? "IMAGING"
            : /ANALYSIS|ESTIMAND|STATISTICAL/.test(role) ? "ANALYSIS"
              : null;
  if (!expectedSection) return undefined;
  const compatible = referenced.filter((candidate) => candidate.sectionId === expectedSection);
  return compatible.length === 1 ? compatible[0] : undefined;
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
  if (input.targetSection !== null && input.targetSection !== input.sectionId) return false;
  const refs = [input.target.itemId, input.target.semanticIdentity, ...(input.target.previousItemIds ?? [])]
    .filter((value): value is string => Boolean(value))
    .map(folded);
  const directRefs = [input.element.elementId, ...input.element.sourceItemIds].map(folded);
  if (refs.some((ref) => directRefs.includes(ref))) return true;
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

  const roleAssignments = (contribution.cognitiveBoundary?.semanticUnderstanding.elements ?? [])
    .filter((item) => item.epistemicBoundary.activeState !== false)
    .filter((item) => item.projectDisposition === "PROJECT_CANDIDATE")
    .filter((item) => item.referencedProjectElementIds?.length)
    .filter((item) => ["ROLE_ASSIGNMENT", "REFERENCE"].includes(item.semanticFunction ?? ""));
  for (const assignment of roleAssignments) {
    const target = roleAssignmentTarget(assignment, previous);
    if (!target) continue;
    const assignedRoles = semanticRolesForItem(assignment);
    if (!assignedRoles.length) continue;
    const proposed: ResearchProjectElement = {
      ...target.element,
      sourceItemIds: [...new Set([...target.element.sourceItemIds, assignment.itemId])],
      sourceTurnIds: [...new Set([...target.element.sourceTurnIds, ...assignment.epistemicBoundary.sourceTurnIds])],
      semanticRoles: [...new Set([...(target.element.semanticRoles ?? []), ...assignedRoles])],
      semanticBasis: assignment.evidenceBasis,
    };
    const unchanged = assignedRoles.every((role) => (target.element.semanticRoles ?? []).includes(role));
    changes.push(projectChange({
      operation: unchanged ? "NO_CHANGE" : "REPLACE",
      sectionId: target.sectionId,
      previous: target.element,
      proposed,
      contribution,
      rationale: unchanged
        ? "Le rôle sémantique demandé est déjà actif sur l’objet Project référencé."
        : "Un rôle explicitement demandé est appliqué à l’objet Project existant sans créer de concept dupliqué.",
    }));
  }

  for (const proposed of proposedThisTurn) {
    const exactMatch = previous.find((candidate) => candidate.sectionId === proposed.sectionId
      && semanticKeyForElement(candidate.sectionId, candidate.element) === semanticKeyForElement(proposed.sectionId, proposed.element));
    const compatibleTemporalMatches = exactMatch ? [] : previous.filter((candidate) => sameTemporalOccurrence(candidate, proposed));
    const match = exactMatch ?? (compatibleTemporalMatches.length === 1 ? compatibleTemporalMatches[0] : undefined);
    if (!match) {
      changes.push(projectChange({ operation: "ADD", sectionId: proposed.sectionId, previous: null, proposed: proposed.element, contribution, rationale: "Nouvel objet structuré explicite absent du Project courant." }));
      continue;
    }
    const unchanged = elementValueKey(proposed.sectionId, match.element) === elementValueKey(proposed.sectionId, proposed.element);
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
  const question = researchProjectQuestionPresentation(sections);
  const questionIndex = sections.findIndex((section) => section.sectionId === "QUESTION");
  sections[questionIndex] = {
    sectionId: "QUESTION",
    label: SECTION_LABELS.QUESTION,
    state: "DEFINED",
    elements: [{
      elementId: current?.sections.find((section) => section.sectionId === "QUESTION")?.elements[0]?.elementId ?? `question:${contribution.identity.contributionId}`,
      semanticKey: "QUESTION:STRUCTURED_PROJECT_SUMMARY",
      content: question,
      sourceItemIds: [],
      sourceTurnIds: contribution.source.turns.filter((turn) => turn.role === "USER").map((turn) => turn.turnId),
      sourceProposedType: "SCIENTIFIC_QUESTION_WORKING_FORMULATION",
      sourceStudyRole: null,
      sourcePolarity: "AFFIRMED",
      semanticRoles: [],
      semanticBasis: "CONTEXTUAL",
      disposition: "USER_CONFIRMED_PROJECT_INFORMATION",
      canonicalPromotion: "NOT_PERFORMED",
    }],
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

export const emptyResearchProjectSections = (): ResearchProjectSection[] => RESEARCH_PROJECT_SECTION_ORDER.map((sectionId) => ({
  sectionId,
  label: SECTION_LABELS[sectionId],
  state: "TO_CLARIFY",
  elements: [],
}));

export const projectContextForScientificInterpretation = (project: ResearchProjectOwnerProjection | null) => project ? ({
  projectRef: project.projectId,
  projectVersion: project.versionId,
  projectDigest: project.projectDigest,
  elements: project.sections
    .filter((section) => section.sectionId !== "QUESTION")
    .flatMap((section) => section.elements.map((element) => ({
      elementId: element.elementId,
      sectionId: section.sectionId,
      semanticKey: element.semanticKey ?? null,
      content: element.content,
      semanticRoles: [...(element.semanticRoles ?? [])],
    }))),
}) : undefined;

export const prepareResearchProjectContributionCandidate = (
  contribution: ScientificInterpretationContributionEnvelope,
  current: ResearchProjectOwnerProjection | null,
): ResearchProjectContributionCandidate => {
  const changeSet = buildContributionProjectChangeSet(contribution, current);
  return {
    boundary: RESEARCH_PROJECT_CONTRIBUTION_BOUNDARY,
    status: changeSet.status === "NO_NET_CHANGE" ? "NO_NET_CHANGE" : "CANDIDATE_PENDING_HUMAN_CONFIRMATION",
    projectWriteAuthorized: false,
    contributionRef: contribution.identity.contributionId,
    contributionDigest: contribution.identity.contributionDigest,
    changeSet,
    proposedSections: applyContributionProjectChangeSet(changeSet, contribution, current),
    specializedResponsibilities: specializedResponsibilities(contribution),
  };
};

export const repairResearchProjectContributionCandidate = (
  contribution: ScientificInterpretationContributionEnvelope,
  current: ResearchProjectOwnerProjection | null,
): ResearchProjectContributionCandidate => prepareResearchProjectContributionCandidate(contribution, current);

export const confirmResearchProjectContribution = (input: {
  contribution: ScientificInterpretationContributionEnvelope;
  current: ResearchProjectOwnerProjection | null;
  projectId: string;
  authority: ResearchProjectOwnerAuthority;
  confirmedAt: string;
}): ResearchProjectOwnerProjection => {
  const candidate = prepareResearchProjectContributionCandidate(input.contribution, input.current);
  if (candidate.changeSet.effectiveChangeCount === 0) {
    if (input.current) return input.current;
    throw new Error("PRJ_CONTRIBUTION_NO_PROJECT_CHANGE");
  }
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

  const projectDigest = logicalDigest({
    projectId: input.projectId,
    versionId,
    previousVersionId: input.current?.versionId ?? null,
    contributionDigest: candidate.contributionDigest,
    changeSet: candidate.changeSet,
    sections: candidate.proposedSections,
    decisionId: confirmationDecision.decisionId,
  });
  return {
    contract: "RESEARCH_PROJECT_CONSTRUCTION_OWNER_PROJECTION",
    contractVersion: RESEARCH_PROJECT_CONSTRUCTION_VERSION,
    contractNature: "PRJ001_MINIMAL_OWNER_ADAPTER_NOT_PD003_V2_ROOT",
    boundary: RESEARCH_PROJECT_CONTRIBUTION_BOUNDARY,
    pd003V2Compatibility: "COMPATIBLE_IN_PRINCIPLE_ADAPTATION_REQUIRED",
    canonicalV2Status: "NO_SCIENTIFIC_OBJECT_PROMOTION_CLAIMED",
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
    sections: candidate.proposedSections,
    specializedResponsibilities: candidate.specializedResponsibilities,
    appliedChangeSet: candidate.changeSet,
  };
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
