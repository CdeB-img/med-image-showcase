import type { ProductEntryRoutingDecision } from "@/features/protocol-designer/functional-reset/product-entry-routing";
import { buildQueryNavigationContext } from "./adapters";
import { makeQueryNavigationId } from "./canonical";
import type { NavigationSelection, QueryNavigationSourceState } from "./contracts";
import { selectNextAction } from "./engine";

export const PRE_PROJECT_QUERY_NAVIGATION_CONTRACT = "PRE_PROJECT_QUERY_NAVIGATION" as const;
export const PRE_PROJECT_QUERY_NAVIGATION_VERSION = "1.0.0" as const;

export type PreProjectNavigationAction = "ASK_QUESTION" | "PROPOSE" | "RESPOND";

export type PreProjectNavigationDecision = Readonly<{
  contract: typeof PRE_PROJECT_QUERY_NAVIGATION_CONTRACT;
  contractVersion: typeof PRE_PROJECT_QUERY_NAVIGATION_VERSION;
  owner: "QUERY_NAVIGATION";
  sourceTurnRef: string;
  action: PreProjectNavigationAction;
  selection: NavigationSelection;
  selectedInformationNeed: string | null;
  selectedInformationNeedRef: string | null;
  scientificReason: string;
  expectedInformationGain: string;
  alreadyProvidedInformationRefs: readonly string[];
  explicitDimensions: readonly Readonly<{ dimensionRef: string; sourceText: string }>[];
  candidateAlternatives: readonly string[];
  rejectedAlternatives: readonly string[];
  rejectionReasons: readonly Readonly<{ alternativeRef: string; reasonCode: string }>[];
  realizationDirective: string;
  valueOfInformationGate: "PASS" | "NOT_APPLICABLE";
  providerCalls: 0;
  projectWriteAuthorized: false;
  projectAdoptionAuthorized: false;
  scientificDecisionAuthorized: false;
}>;

export type PreProjectRealizationResult = Readonly<{
  assistantReply: string;
  executor: "GEMINI_CONVERSATION_MODEL" | "LOCAL_DETERMINISTIC_REALIZATION";
  provider: string;
  model: string;
  providerReplyAccepted: boolean;
  conformanceReason: string;
  representedDimensionRefs: readonly string[];
  missingDimensionRefs: readonly string[];
  providerCallsPerformedByRealizer: 0;
  projectWriteAuthorized: false;
}>;

export type PreProjectVisibleStructuredUnderstanding = Readonly<{
  source: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION";
  visibleToUser: true;
  representedDimensionRefs: readonly string[];
  projectWriteAuthorized: false;
}>;

const normalized = (value: string) => value
  .normalize("NFKD")
  .replace(/\p{M}/gu, "")
  .toLocaleLowerCase("fr-FR")
  .replace(/[’']/gu, " ")
  .replace(/[^\p{L}\p{N}]+/gu, " ")
  .replace(/\s+/gu, " ")
  .trim();

const emptySourceState = (): QueryNavigationSourceState => ({
  projectUnknowns: [],
  projectAmbiguities: [],
  projectContradictions: [],
  dataNeeds: [],
  planningDecisionRequirements: [],
  validationFindings: [],
  validationHumanReviews: [],
  validationSemanticReviews: [],
  validationGates: [],
  readiness: [],
  documentGenerability: [],
  knowledgeGaps: [],
  dependencies: [],
});

const AMBIGUITY_MARKER = /\b(?:je\s+ne\s+sais\s+pas|nous\s+ne\s+savons\s+pas|j['’]?h[ée]site|nous\s+h[ée]sitons|ambigu(?:ë|e|ïté)|ind[ée]termin[ée]?|reste\s+[àa]\s+(?:choisir|d[ée]finir|pr[ée]ciser)|pas\s+encore\s+(?:choisi|choisie|d[ée]fini|d[ée]finie)|lequel|laquelle|lesquels|lesquelles)\b/iu;

const declaredAmbiguity = (routing: Readonly<ProductEntryRoutingDecision>) =>
  routing.explicitScientificDimensions.find((dimension) => AMBIGUITY_MARKER.test(dimension.sourceText)) ?? null;

const knownOptionsFrom = (value: string): string[] => {
  const match = value.match(/\b(?:entre|soit|doit\s+[êe]tre)\s+([^,;.!?]+?)\s+(?:et|ou|soit)\s+([^,;.!?]+?)(?:[.,;!?]|$)/iu);
  return match ? [match[1].trim(), match[2].trim()].filter(Boolean) : [];
};

const buildSourceState = (
  routing: Readonly<ProductEntryRoutingDecision>,
  ambiguity: ReturnType<typeof declaredAmbiguity>,
): QueryNavigationSourceState => {
  const state = emptySourceState();
  if (!ambiguity) return state;
  state.projectAmbiguities = [{
    ref: `${ambiguity.dimensionRef}:material-ambiguity`,
    version: PRE_PROJECT_QUERY_NAVIGATION_VERSION,
    intent: `Préciser le choix explicitement laissé indéterminé dans « ${ambiguity.sourceText} »`,
    owner: "QUERY_NAVIGATION",
    decisionRefs: ["pre-project-decision:scientific-structure"],
    branchRefs: [`pre-project-branch:${ambiguity.dimensionRef}`],
    knownOptions: knownOptionsFrom(ambiguity.sourceText),
  }];
  return state;
};

export const buildPreProjectNavigationDecision = (input: {
  routing: Readonly<ProductEntryRoutingDecision>;
}): PreProjectNavigationDecision => {
  const ambiguity = declaredAmbiguity(input.routing);
  const providedRefs = input.routing.explicitScientificDimensions.map((dimension) => dimension.dimensionRef);
  const context = buildQueryNavigationContext({
    projectRef: `pre-project:${input.routing.sourceTurnRef}`,
    projectVersion: "PRE_PROJECT_NOT_ADOPTED",
    sourceState: buildSourceState(input.routing, ambiguity),
    currentUsageRef: "PRE_PROJECT_NATURAL_CONVERSATION",
    sufficiencyEvidenceRefs: ambiguity ? [] : providedRefs,
    limitations: [
      "PRE_PROJECT_ADAPTER_REUSES_PD009_SELECTION_WITHOUT_PROJECT_ADOPTION",
      "QRY_SELECTS_WHAT_REALIZATION_ONLY_FORMULATES_HOW",
    ],
  });
  const selection = selectNextAction(context);
  const candidate = selection.selected;
  const askHasMaterialInformationValue = candidate?.actionCategory === "CLARIFY_BY_ADAPTIVE_EXCHANGE"
    && candidate.informationValue.discrimination !== "NO_DECISION_EFFECT"
    && candidate.informationValue.discrimination !== "UNKNOWN"
    && (candidate.affectedDecisionRefs.length > 0 || candidate.affectedBranchRefs.length > 0);
  const action: PreProjectNavigationAction = askHasMaterialInformationValue ? "ASK_QUESTION" : "PROPOSE";
  const selectedInformationNeed = action === "ASK_QUESTION" ? candidate?.explanation ?? null : null;
  const selectedInformationNeedRef = action === "ASK_QUESTION" ? candidate?.navigationNeedRefs[0] ?? null : null;
  const scientificReason = action === "ASK_QUESTION"
    ? "Une ambiguïté explicitement déclarée peut modifier la structure scientifique du projet."
    : "Les dimensions explicitement fournies suffisent pour poursuivre par une structuration réversible sans imposer de clarification.";
  const expectedInformationGain = action === "ASK_QUESTION"
    ? `MAY_CHANGE_DECISION:${candidate?.affectedDecisionRefs.join(",") || "pre-project-scientific-structure"}`
    : "NO_ADDITIONAL_INFORMATION_REQUIRED_FOR_REVERSIBLE_PROPOSAL";
  const realizationDirective = action === "ASK_QUESTION"
    ? `Formuler une seule question portant exclusivement sur ce besoin gouverné : ${selectedInformationNeed}. Ne pas sélectionner un autre besoin.`
    : "Poursuivre sans poser de question. Structurer ensemble toutes les dimensions explicitement fournies, sans les hiérarchiser, les opposer ni les adopter dans un Project.";
  const candidateAlternatives = selection.candidates.map((item) => item.candidateId);
  const rejectedAlternatives = action === "ASK_QUESTION" ? ["PROPOSE_WITHOUT_RESOLVING_MATERIAL_AMBIGUITY"] : ["ASK_WITHOUT_MATERIAL_INFORMATION_GAIN"];

  return Object.freeze({
    contract: PRE_PROJECT_QUERY_NAVIGATION_CONTRACT,
    contractVersion: PRE_PROJECT_QUERY_NAVIGATION_VERSION,
    owner: "QUERY_NAVIGATION",
    sourceTurnRef: input.routing.sourceTurnRef,
    action,
    selection,
    selectedInformationNeed,
    selectedInformationNeedRef,
    scientificReason,
    expectedInformationGain,
    alreadyProvidedInformationRefs: Object.freeze([...providedRefs]),
    explicitDimensions: Object.freeze(input.routing.explicitScientificDimensions.map((dimension) => Object.freeze({
      dimensionRef: dimension.dimensionRef,
      sourceText: dimension.sourceText,
    }))),
    candidateAlternatives: Object.freeze(candidateAlternatives),
    rejectedAlternatives: Object.freeze(rejectedAlternatives),
    rejectionReasons: Object.freeze(rejectedAlternatives.map((alternativeRef) => Object.freeze({
      alternativeRef,
      reasonCode: action === "ASK_QUESTION" ? "MATERIAL_AMBIGUITY_REQUIRES_CLARIFICATION" : "NO_MATERIAL_INFORMATION_GAIN",
    }))),
    realizationDirective,
    valueOfInformationGate: action === "ASK_QUESTION" ? "PASS" : "NOT_APPLICABLE",
    providerCalls: 0,
    projectWriteAuthorized: false,
    projectAdoptionAuthorized: false,
    scientificDecisionAuthorized: false,
  });
};

const providerQuestionConforms = (decision: PreProjectNavigationDecision, providerReply: string) => {
  if ((providerReply.match(/\?/gu) ?? []).length !== 1 || !decision.selectedInformationNeed) return false;
  const governedOptions = decision.selection.selected?.knownOptionRefs ?? [];
  if (governedOptions.length < 2) return false;
  const question = normalized(providerReply);
  return governedOptions.every((option) => question.includes(normalized(option)));
};

const PROPOSAL_REALIZATION_MARKER = /\b(?:propos|structur|organis|comprehension|objectif|vise|pouvons|pourrions|peut|pourrait|etude|projet|continu)\w*\b/u;
const UNAUTHORIZED_WHAT_SHIFT = /\b(?:au\s+lieu\s+de|plutot\s+que|choisir\s+entre|ecarter|abandonner|remplacer)\b/u;
const UNAUTHORIZED_ADOPTION = /\b(?:(?:le|votre)\s+(?:projet|etude)\s+(?:est|a\s+ete)\s+(?:cree|adopte|valide|enregistre)|j\s+ai\s+(?:cree|adopte|valide|enregistre)\s+(?:le|votre)\s+(?:projet|etude))\b/u;

const providerProposalConformance = (
  decision: PreProjectNavigationDecision,
  providerReply: string,
  structuredUnderstanding?: PreProjectVisibleStructuredUnderstanding | null,
) => {
  const reply = normalized(providerReply);
  const structurallyRepresented = structuredUnderstanding?.source === "SCIENTIFIC_INTERPRETATION_CONTRIBUTION"
    && structuredUnderstanding.visibleToUser
    && structuredUnderstanding.projectWriteAuthorized === false
    ? new Set(structuredUnderstanding.representedDimensionRefs)
    : new Set<string>();
  const representedDimensionRefs = decision.explicitDimensions
    .filter((dimension) => reply.includes(normalized(dimension.sourceText)) || structurallyRepresented.has(dimension.dimensionRef))
    .map((dimension) => dimension.dimensionRef);
  const represented = new Set(representedDimensionRefs);
  const missingDimensionRefs = decision.explicitDimensions
    .filter((dimension) => !represented.has(dimension.dimensionRef))
    .map((dimension) => dimension.dimensionRef);
  if (providerReply.includes("?")) return {
    conforms: false,
    reason: "PROVIDER_PROPOSAL_REJECTED_UNAUTHORIZED_QUESTION",
    representedDimensionRefs,
    missingDimensionRefs,
  } as const;
  if (UNAUTHORIZED_ADOPTION.test(reply)) return {
    conforms: false,
    reason: "PROVIDER_PROPOSAL_REJECTED_UNAUTHORIZED_ADOPTION",
    representedDimensionRefs,
    missingDimensionRefs,
  } as const;
  if (UNAUTHORIZED_WHAT_SHIFT.test(reply)) return {
    conforms: false,
    reason: "PROVIDER_PROPOSAL_REJECTED_QRY_WHAT_SHIFT",
    representedDimensionRefs,
    missingDimensionRefs,
  } as const;
  if (!PROPOSAL_REALIZATION_MARKER.test(reply)) return {
    conforms: false,
    reason: "PROVIDER_PROPOSAL_REJECTED_ACTION_MISMATCH",
    representedDimensionRefs,
    missingDimensionRefs,
  } as const;
  if (missingDimensionRefs.length) return {
    conforms: false,
    reason: "PROVIDER_PROPOSAL_REJECTED_MATERIAL_DIMENSION_OMISSION",
    representedDimensionRefs,
    missingDimensionRefs,
  } as const;
  return {
    conforms: true,
    reason: "PROVIDER_REALIZATION_CONFORMS_TO_QRY_ACTION_AND_STRUCTURED_WHAT",
    representedDimensionRefs,
    missingDimensionRefs,
  } as const;
};

const GENERIC_DETERMINISTIC_PROPOSAL = "J’ai bien pris en compte les éléments scientifiques de votre demande. Je vous propose de les organiser dans une première compréhension structurée, que vous pourrez préciser avant toute confirmation.";

const deterministicProposal = (decision: Readonly<PreProjectNavigationDecision>) => {
  const explicitDimensions = decision.explicitDimensions
    .map((dimension) => dimension.sourceText.trim().replace(/[.!?;:,]+$/gu, ""))
    .filter(Boolean);
  if (explicitDimensions.length < 2) return GENERIC_DETERMINISTIC_PROPOSAL;
  return `J’ai bien pris en compte les éléments scientifiques de votre demande. Je vous propose de les organiser dans une première compréhension structurée : ${explicitDimensions.join(" ; ")}. Vous pourrez la préciser avant toute confirmation.`;
};

const deterministicQuestion = (decision: PreProjectNavigationDecision) => {
  const need = decision.selectedInformationNeed?.replace(/[?.!]+$/gu, "") ?? "le choix qui reste explicitement indéterminé";
  return `Pour lever uniquement l’ambiguïté susceptible de modifier la structure du projet : ${need} ?`;
};

/**
 * Realizes HOW under the QRY decision. It performs no provider call. A supplied
 * provider wording is accepted only when it conforms to the selected action
 * and WHAT; otherwise the bounded deterministic wording keeps QRY in control.
 */
export const realizePreProjectNavigationDecision = (input: {
  decision: Readonly<PreProjectNavigationDecision>;
  providerReply?: string | null;
  provider?: string;
  model?: string;
  structuredUnderstanding?: PreProjectVisibleStructuredUnderstanding | null;
}): PreProjectRealizationResult => {
  const providerReply = input.providerReply?.trim() ?? "";
  const proposalConformance = input.decision.action === "ASK_QUESTION"
    ? null
    : providerProposalConformance(input.decision, providerReply, input.structuredUnderstanding);
  const providerConforms = Boolean(providerReply) && (input.decision.action === "ASK_QUESTION"
    ? providerQuestionConforms(input.decision, providerReply)
    : proposalConformance?.conforms === true);
  const representedDimensionRefs = proposalConformance?.representedDimensionRefs ?? [];
  const missingDimensionRefs = proposalConformance?.missingDimensionRefs ?? [];
  if (providerConforms) return Object.freeze({
    assistantReply: providerReply,
    executor: "GEMINI_CONVERSATION_MODEL",
    provider: input.provider ?? "GOOGLE_GEMINI",
    model: input.model ?? "UNKNOWN",
    providerReplyAccepted: true,
    conformanceReason: proposalConformance?.reason ?? "PROVIDER_REALIZATION_CONFORMS_TO_QRY_ACTION_AND_WHAT",
    representedDimensionRefs: Object.freeze([...representedDimensionRefs]),
    missingDimensionRefs: Object.freeze([...missingDimensionRefs]),
    providerCallsPerformedByRealizer: 0,
    projectWriteAuthorized: false,
  });
  return Object.freeze({
    assistantReply: input.decision.action === "ASK_QUESTION"
      ? deterministicQuestion(input.decision)
      : deterministicProposal(input.decision),
    executor: "LOCAL_DETERMINISTIC_REALIZATION",
    provider: "NONE",
    model: "QRY_PRE_PROJECT_REALIZATION_1.0.0",
    providerReplyAccepted: false,
    conformanceReason: providerReply
      ? proposalConformance?.reason ?? "PROVIDER_REALIZATION_REJECTED_OUTSIDE_QRY_ACTION_OR_WHAT"
      : "LOCAL_QUALIFICATION_NO_PROVIDER_REPLY",
    representedDimensionRefs: Object.freeze([...representedDimensionRefs]),
    missingDimensionRefs: Object.freeze([...missingDimensionRefs]),
    providerCallsPerformedByRealizer: 0,
    projectWriteAuthorized: false,
  });
};

export const preProjectNavigationDecisionDigest = (decision: PreProjectNavigationDecision) => makeQueryNavigationId(
  "qry-pre-project-decision",
  {
    sourceTurnRef: decision.sourceTurnRef,
    action: decision.action,
    selectedInformationNeedRef: decision.selectedInformationNeedRef,
    alreadyProvidedInformationRefs: decision.alreadyProvidedInformationRefs,
    selectionTraceRef: decision.selection.trace.traceId,
  },
);
