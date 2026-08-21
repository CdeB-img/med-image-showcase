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
    ...content.unknowns,
    ...content.missingInformation,
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
const capitalize = (value: string) => value ? `${value.charAt(0).toLocaleUpperCase("fr-FR")}${value.slice(1)}` : value;

export const sectionForContributionItem = (
  item: ScientificContributionItem,
  _contribution: ScientificInterpretationContributionEnvelope,
): ResearchProjectSectionId | null => {
  const type = typeOf(item);
  if (/POPULATION|ELIGIBILITY|CRITERION|CONDITION|DISEASE/.test(type)) return "POPULATION";
  if (/STUDY_DESIGN|DESIGN|SETTING|CENTER/.test(type)) return "DESIGN";
  if (/COMPARATOR|CONTROL_ARM|REFERENCE_ARM/.test(type)) return "COMPARATOR";
  if (/INTERVENTION|TREATMENT|EXPOSURE_ARM/.test(type)) return "INTERVENTION";
  if (/TIMING|TEMPORAL|TIMEPOINT|WINDOW|VISIT/.test(type)) return "TEMPORALITY";
  if (/MODALITY|IMAGING_METHOD|ACQUISITION/.test(type)) return "IMAGING";
  if (/BIOMARKER|MEASURED_VARIABLE|MEASUREMENT|ENDPOINT|OUTCOME|QUANTITATIVE_TARGET|SCIENTIFIC_OBJECT/.test(type)) return "MEASUREMENTS";
  if (/ANALYSIS|ESTIMAND|STATISTICAL/.test(type)) return "ANALYSIS";
  return null;
};

const itemContext = (item: ScientificContributionItem, contribution: ScientificInterpretationContributionEnvelope) => [
  item.semanticIdentity,
  item.content,
  item.epistemicBoundary.sourceText,
  ...contribution.source.turns
    .filter((turn) => item.epistemicBoundary.sourceTurnIds.includes(turn.turnId))
    .map((turn) => turn.content),
].filter((value): value is string => Boolean(value)).join(" ");

const ageCriterion = (item: ScientificContributionItem, sectionId: ResearchProjectSectionId, contribution: ScientificInterpretationContributionEnvelope) => {
  const context = folded(itemContext(item, contribution));
  if (sectionId !== "POPULATION" || !/ELIGIBILITY|CRITERION/.test(typeOf(item)) || !/\bage\b/.test(context)) return null;
  const value = context.match(/\b(\d{1,3}(?:[.,]\d+)?)\s*ans?\b/)?.[1]?.replace(",", ".") ?? null;
  const direction = /\b(?:maxim\w*|au plus|limiter|limite superieure|moins de)\b/.test(context)
    ? "max"
    : /\b(?:minim\w*|au moins|a partir de|limite inferieure)\b/.test(context)
      ? "min"
      : "criterion";
  const label = direction === "max" ? "Âge maximal" : direction === "min" ? "Âge minimal" : "Âge";
  return {
    semanticKey: `POPULATION:ELIGIBILITY:AGE:${direction.toLocaleUpperCase("fr-FR")}`,
    content: value ? `${label} : ${value} ans` : capitalize(item.content.trim()),
  };
};

const timingCriterion = (item: ScientificContributionItem, sectionId: ResearchProjectSectionId, contribution: ScientificInterpretationContributionEnvelope) => {
  if (sectionId !== "TEMPORALITY") return null;
  const context = folded(itemContext(item, contribution));
  const range = context.match(/\bj\s*(\d+)\s*(?:et|a|-)\s*j\s*(\d+)\b/);
  if (!range) return null;
  const modality = /\b(?:irm|mri)\b/.test(context) ? "IRM" : "Fenêtre";
  return {
    semanticKey: `TEMPORALITY:${modality.toLocaleUpperCase("fr-FR")}:WINDOW`,
    content: `${modality} : J${range[1]}–J${range[2]}`,
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

const elementFrom = (
  item: ScientificContributionItem,
  contribution: ScientificInterpretationContributionEnvelope,
): ResearchProjectElement | null => {
  const sectionId = sectionForContributionItem(item, contribution);
  if (!sectionId) return null;
  const specialized = ageCriterion(item, sectionId, contribution) ?? timingCriterion(item, sectionId, contribution);
  return {
    elementId: item.semanticIdentity ?? item.itemId,
    semanticKey: specialized?.semanticKey ?? `${sectionId}:${folded(item.proposedType ?? item.studyRole ?? "ITEM")}:${stableSemanticIdentity(item)}`,
    content: specialized?.content ?? item.content.trim(),
    sourceItemIds: [item.itemId],
    sourceTurnIds: item.epistemicBoundary.sourceTurnIds,
    sourceProposedType: item.proposedType,
    sourceStudyRole: item.studyRole,
    sourcePolarity: item.polarity,
    disposition: "USER_CONFIRMED_PROJECT_INFORMATION",
    canonicalPromotion: "NOT_PERFORMED",
  };
};

const semanticKeyForElement = (sectionId: ResearchProjectSectionId, element: ResearchProjectElement) => {
  if (element.semanticKey) return element.semanticKey;
  const context = folded(`${element.elementId} ${element.content} ${element.sourceProposedType ?? ""} ${element.sourceStudyRole ?? ""}`);
  if (sectionId === "POPULATION" && /\bage\b/.test(context) && /\b\d{1,3}\s*ans?\b/.test(context)) {
    const direction = /maxim|au plus/.test(context) ? "MAX" : /minim|au moins/.test(context) ? "MIN" : "CRITERION";
    return `POPULATION:ELIGIBILITY:AGE:${direction}`;
  }
  if (sectionId === "TEMPORALITY" && /\bj\s*\d+/.test(context)) {
    return `TEMPORALITY:${/\b(?:irm|mri)\b/.test(context) ? "IRM" : "WINDOW"}:WINDOW`;
  }
  return `${sectionId}:${folded(element.sourceProposedType ?? element.sourceStudyRole ?? "ITEM")}:${folded(element.elementId)}`;
};

const elementValueKey = (sectionId: ResearchProjectSectionId, element: ResearchProjectElement) => {
  const context = folded(element.content);
  if (sectionId === "POPULATION" && /\bage\b/.test(context)) return context.match(/\b\d{1,3}(?:[.,]\d+)?\b/)?.[0] ?? context;
  if (sectionId === "TEMPORALITY") {
    const range = context.match(/\bj\s*(\d+)\s*(?:et|a|-|–)\s*j\s*(\d+)\b/);
    if (range) return `j${range[1]}-j${range[2]}`;
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
  ...contributionItems(contribution).flatMap((item) => {
    const element = elementFrom(item, contribution);
    return element ? [element] : [];
  }),
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

const buildContributionProjectChangeSet = (
  contribution: ScientificInterpretationContributionEnvelope,
  current: ResearchProjectOwnerProjection | null,
): ContributionProjectChangeSet => {
  const lastTurnId = latestUserTurnId(contribution);
  const snapshot = projectValueElements(contribution)
    .flatMap((element) => {
      const sectionId = sectionForElement(element, contribution);
      return sectionId ? [{ sectionId, element: { ...element, semanticKey: semanticKeyForElement(sectionId, element) } }] : [];
    });
  const previous = currentElements(current).map(({ sectionId, element }) => ({
    sectionId,
    element: { ...element, semanticKey: semanticKeyForElement(sectionId, element) },
  }));
  const proposedThisTurn = current
    ? snapshot.filter(({ element }) => Boolean(lastTurnId && element.sourceTurnIds.includes(lastTurnId)))
    : snapshot;
  const changes: ContributionProjectChange[] = [];

  for (const proposed of proposedThisTurn) {
    const match = previous.find((candidate) => candidate.sectionId === proposed.sectionId
      && semanticKeyForElement(candidate.sectionId, candidate.element) === semanticKeyForElement(proposed.sectionId, proposed.element));
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
      const match = previous.find(({ sectionId, element }) =>
        (targetSection === null || targetSection === sectionId)
        && (element.sourceItemIds.includes(target.itemId)
          || Boolean(target.semanticIdentity && folded(element.elementId) === folded(target.semanticIdentity))
          || (target.previousItemIds ?? []).some((ref) => element.sourceItemIds.includes(ref) || folded(element.elementId) === folded(ref))));
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
