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
  status: "CANDIDATE_PENDING_HUMAN_CONFIRMATION";
  projectWriteAuthorized: false;
  contributionRef: string;
  contributionDigest: string;
  proposedSections: ResearchProjectSection[];
  specializedResponsibilities: SpecializedResponsibility[];
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

export const contributionItems = (contribution: ScientificInterpretationContributionEnvelope) => {
  const content = contribution.scientificContent;
  return [...new Map([
    ...content.candidateObjects,
    ...content.temporalElements,
    ...content.negationsAndConstraints,
    ...content.unknowns,
    ...content.missingInformation,
    ...content.explicitStatements,
  ].filter(active).map((item) => [item.itemId, item])).values()];
};

const typeOf = (item: ScientificContributionItem) => `${item.proposedType ?? ""} ${item.studyRole ?? ""}`.toLocaleUpperCase("fr-FR");
const normalized = (value: string) => value.normalize("NFKC").toLocaleLowerCase("fr-FR").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export const sectionForContributionItem = (
  item: ScientificContributionItem,
  contribution: ScientificInterpretationContributionEnvelope,
): ResearchProjectSectionId | null => {
  const type = typeOf(item);
  if (/POPULATION|ELIGIBILITY|CRITERION|CONDITION|DISEASE/.test(type)) return "POPULATION";
  if (/STUDY_DESIGN|DESIGN|SETTING|CENTER/.test(type)) return "DESIGN";
  if (/COMPARATOR|CONTROL_ARM|REFERENCE_ARM/.test(type)) return "COMPARATOR";
  if (/INTERVENTION|TREATMENT|EXPOSURE_ARM/.test(type)) return "INTERVENTION";
  if (/TIMING|TEMPORAL/.test(type)) return "TEMPORALITY";
  if (/MODALITY|IMAGING_METHOD|ACQUISITION/.test(type)) return "IMAGING";
  if (/BIOMARKER|MEASURED_VARIABLE|MEASUREMENT|ENDPOINT|OUTCOME|QUANTITATIVE_TARGET|SCIENTIFIC_OBJECT/.test(type)) return "MEASUREMENTS";
  if (/ANALYSIS|ESTIMAND|STATISTICAL/.test(type)) return "ANALYSIS";
  return null;
};

const elementFrom = (item: ScientificContributionItem): ResearchProjectElement => ({
  elementId: item.semanticIdentity ?? item.itemId,
  content: item.content.trim(),
  sourceItemIds: [item.itemId],
  sourceTurnIds: item.epistemicBoundary.sourceTurnIds,
  sourceProposedType: item.proposedType,
  sourceStudyRole: item.studyRole,
  sourcePolarity: item.polarity,
  disposition: "USER_CONFIRMED_PROJECT_INFORMATION",
  canonicalPromotion: "NOT_PERFORMED",
});

const uniqueElements = (elements: ResearchProjectElement[]) => {
  const byContent = new Map<string, ResearchProjectElement>();
  for (const element of elements) {
    const key = normalized(element.content);
    const previous = byContent.get(key);
    byContent.set(key, previous ? {
      ...previous,
      sourceItemIds: [...new Set([...previous.sourceItemIds, ...element.sourceItemIds])],
      sourceTurnIds: [...new Set([...previous.sourceTurnIds, ...element.sourceTurnIds])],
    } : element);
  }
  return [...byContent.values()];
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

const buildSections = (
  contribution: ScientificInterpretationContributionEnvelope,
  current: ResearchProjectOwnerProjection | null,
): ResearchProjectSection[] => {
  const grouped = new Map<ResearchProjectSectionId, ResearchProjectElement[]>();
  for (const id of RESEARCH_PROJECT_SECTION_ORDER) grouped.set(id, []);

  grouped.set("QUESTION", [{
    elementId: `question:${contribution.identity.contributionId}`,
    content: contribution.scientificContent.normalizedUnderstanding?.trim() || contribution.source.originalRequest.trim(),
    sourceItemIds: [],
    sourceTurnIds: contribution.source.turns.filter((turn) => turn.role === "USER").map((turn) => turn.turnId),
    sourceProposedType: "SCIENTIFIC_QUESTION_WORKING_FORMULATION",
    sourceStudyRole: null,
    sourcePolarity: "AFFIRMED",
    disposition: "USER_CONFIRMED_PROJECT_INFORMATION",
    canonicalPromotion: "NOT_PERFORMED",
  }]);

  for (const item of contributionItems(contribution)) {
    const sectionId = sectionForContributionItem(item, contribution);
    if (sectionId) grouped.get(sectionId)?.push(elementFrom(item));
  }
  grouped.get("ANALYSIS")?.push(...relationElements(contribution));

  const sections = RESEARCH_PROJECT_SECTION_ORDER.map((sectionId) => {
    const elements = uniqueElements(grouped.get(sectionId) ?? []);
    return { sectionId, label: SECTION_LABELS[sectionId], state: stateFor(sectionId, elements, contribution), elements };
  });

  const previousQuestion = current?.sections.find((section) => section.sectionId === "QUESTION");
  const lastUserTurnId = [...contribution.source.turns].reverse().find((turn) => turn.role === "USER")?.turnId;
  const questionExplicitlyCorrected = contribution.scientificContent.correctionsAndSupersessions.some((item) =>
    item.epistemicBoundary.activeState !== false
    && Boolean(lastUserTurnId && item.epistemicBoundary.sourceTurnIds.includes(lastUserTurnId)),
  );
  if (previousQuestion && !questionExplicitlyCorrected) {
    const questionIndex = sections.findIndex((section) => section.sectionId === "QUESTION");
    sections[questionIndex] = previousQuestion;
  }
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
): ResearchProjectContributionCandidate => ({
  boundary: RESEARCH_PROJECT_CONTRIBUTION_BOUNDARY,
  status: "CANDIDATE_PENDING_HUMAN_CONFIRMATION",
  projectWriteAuthorized: false,
  contributionRef: contribution.identity.contributionId,
  contributionDigest: contribution.identity.contributionDigest,
  proposedSections: buildSections(contribution, current),
  specializedResponsibilities: specializedResponsibilities(contribution),
});

export const confirmResearchProjectContribution = (input: {
  contribution: ScientificInterpretationContributionEnvelope;
  current: ResearchProjectOwnerProjection | null;
  projectId: string;
  authority: ResearchProjectOwnerAuthority;
  confirmedAt: string;
}): ResearchProjectOwnerProjection => {
  const candidate = prepareResearchProjectContributionCandidate(input.contribution, input.current);
  const revision = (input.current?.revision ?? 0) + 1;
  const versionId = `${input.projectId}:version:${revision}`;
  const pendingDecision = createHumanDecisionCandidate({
    decisionId: `project-contribution-decision:${logicalDigest({ projectId: input.projectId, contributionRef: candidate.contributionRef, revision })}`,
    gateId: "PRJ-CONTRIBUTION-INTAKE",
    scope: ["RESEARCH_PROJECT", "USER_CONFIRMED_PROJECT_INFORMATION"],
    targets: [candidate.contributionRef, ...candidate.proposedSections.flatMap((section) => section.elements.flatMap((element) => element.sourceItemIds))],
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
