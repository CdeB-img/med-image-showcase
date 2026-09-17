import { contributionDecisionScopeGroups } from "../research-project-construction/contribution-owner-boundary.js";
import { requestsAssistedProposal } from "./conversation-proposal-request.js";
import { logicalDigest } from "../knowledge-engine/canonical.js";
import {
  buildProjectContextSnapshot,
  type ProjectContextSnapshot,
} from "../research-project-construction/canonical-project-backbone.js";
import type { ResearchProjectOwnerProjection } from "../research-project-construction/contribution-owner-boundary.js";
import {
  ownerResultNativeDigest,
  rehydrateProductOwnerResultLedger,
  type ProductOwnerResultLedger,
  type ProductOwnerResultLedgerEntry,
} from "../protocol-designer/product-owner-result-ledger.js";
import type { RetainedContributionCandidate } from "../protocol-designer/functional-reset/contribution-lifecycle.js";
import { buildScientificDiscussionContext } from "../protocol-designer/functional-reset/contribution-discussion-context.js";
import type { StudyDesignProposalContribution } from "../study-design/contracts.js";
import type { NavigationNeed, QueryNavigationSourceState } from "./contracts.js";
import { makeQueryNavigationId, queryNavigationDigest } from "./canonical.js";
import type {
  BoundedConversationInteraction,
  BoundedConversationReferentContext,
} from "./current-turn-navigation.js";
import type { GovernedRealizationContent, GovernedVisibleObligation } from "./governed-conversation-realization.js";
import type { CurrentProjectImpactProjection } from "./current-project-context.js";
import { canonicalFrenchTemporalUnit } from "../research-project-construction/temporal-presentation.js";
import { isOnlyConversationStyleFeedback, isUnqualifiedWholeCandidateDecisionWithStyleFeedback, readNaturalCandidateDecision } from "../protocol-designer/functional-reset/natural-conversation-policy.js";

/** Explicit consumer scope, not a recency rule and not a new result store. */
export type CurrentNavigationOwnerResultRef = Readonly<{
  owner: ProductOwnerResultLedgerEntry["request"]["owner"];
  resultId: string;
  resultVersion: string;
  resultDigest: string;
  scopeRefs: readonly string[];
  disposition: "ACTIVE" | "REJECTED" | "DEFERRED" | "STALE" | "SUPERSEDED";
  applicability: "APPLICABLE" | "NOT_APPLICABLE" | "UNKNOWN";
}>;

type ProjectBinding = Readonly<{
  projectId: string;
  versionId: string;
  projectDigest: string;
  snapshotDigest: string;
}>;

export type CurrentNavigationEvidence = Readonly<{
  owner: "QUERY_NAVIGATION";
  currentTurn: Readonly<{ ref: string; sourceDigest: string }>;
  candidate: null | Readonly<{
    ref: string;
    digest: string;
    contributionDigest: string;
    sourceTurnRef: string;
    baseProject: RetainedContributionCandidate["baseProject"];
    status: "VALIDATED_NON_ADOPTED_CANDIDATE";
    objectChanges: RetainedContributionCandidate["candidate"]["canonicalChangeSet"]["objectChanges"];
    relationChanges: RetainedContributionCandidate["candidate"]["canonicalChangeSet"]["relationChanges"];
    temporalQualificationChanges: RetainedContributionCandidate["candidate"]["canonicalChangeSet"]["temporalQualificationChanges"];
    expectedVariableOccasionChanges: RetainedContributionCandidate["candidate"]["canonicalChangeSet"]["expectedVariableOccasionChanges"];
    conflicts: RetainedContributionCandidate["candidate"]["canonicalChangeSet"]["conflicts"];
    dependencyBindings: RetainedContributionCandidate["dependencyBindings"];
    validatorRef: string;
    projectWriteAuthorized: false;
  }>;
  adoptedProject: ProjectBinding | null;
  ownerResults: readonly Readonly<{
    owner: string;
    ref: string;
    version: string;
    digest: string;
    snapshotDigest: string;
    scopeRefs: readonly string[];
    sourceRefs: readonly string[];
    dependencyRefs: readonly string[];
    limitations: readonly string[];
    options: StudyDesignProposalContribution["options"];
    tradeOffs: StudyDesignProposalContribution["tradeOffs"];
    epistemicStatus: StudyDesignProposalContribution["epistemicStatus"];
    humanDecisionRequired: true;
  }>[];
  sourceState: QueryNavigationSourceState & { governedNeeds: NavigationNeed[] };
  alreadyProvidedInformationRefs: readonly string[];
  closedBranchRefs: readonly string[];
  resolvedNeedRefs: readonly string[];
  // Diagnostic-only exclusions do not participate in the active context digest.
  excludedReferences: readonly Readonly<{ ref: string; reason: string }>[];
  contextDigest: string;
  projectionOnly: true;
  sourceOfTruth: false;
  projectWriteAuthorized: false;
}>;

const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))].sort();
const same = (left: unknown, right: unknown) => logicalDigest(left) === logicalDigest(right);
const currentQuestionTargetText = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed.endsWith("?") || [...trimmed.matchAll(/\?/gu)].length !== 1) return trimmed;
  const mark = trimmed.lastIndexOf("?");
  const preceding = trimmed.slice(0, mark);
  const boundary = Math.max(preceding.lastIndexOf("."), preceding.lastIndexOf("!"), preceding.lastIndexOf("\n"));
  return trimmed.slice(boundary + 1).trim();
};
const emptyState = (): CurrentNavigationEvidence["sourceState"] => ({
  projectUnknowns: [], projectAmbiguities: [], projectContradictions: [], dataNeeds: [],
  planningDecisionRequirements: [], validationFindings: [], validationHumanReviews: [],
  validationSemanticReviews: [], validationGates: [], readiness: [], documentGenerability: [],
  knowledgeGaps: [], dependencies: [], governedNeeds: [],
});

const candidateReferentContent = (record: Readonly<RetainedContributionCandidate>): GovernedRealizationContent[] => {
  const changes = record.candidate.canonicalChangeSet.objectChanges.filter((change) => change.candidate && change.operation !== "REMOVE");
  const objectives = changes.filter((change) => ["OBJECTIVE", "SCIENTIFIC_QUESTION"].includes(change.candidate!.objectType));
  const comparisonRefs = new Set(record.candidate.canonicalChangeSet.relationChanges
    .filter((relation) => relation.candidate?.relationType === "COMPARES_WITH")
    .flatMap((relation) => relation.candidate ? [relation.candidate.sourceObjectRef, relation.candidate.targetObjectRef] : []));
  const comparisons = changes.filter((change) => comparisonRefs.has(change.objectId));
  return (objectives.length ? objectives : comparisons.length ? comparisons : changes).map((change) => ({
    ref: change.objectId,
    text: change.candidate!.content,
    status: change.candidate!.epistemicState,
  }));
};

/** Lifecycle and explicit review-selection projection; recency is never a selection. */
export const buildBoundedConversationReferentContext = (input: {
  retained: readonly RetainedContributionCandidate[];
  currentProject: Readonly<ResearchProjectOwnerProjection> | null;
  conversationId: string;
  runtimeTurns: readonly Readonly<{ turnId: string; role: "USER" | "NOXIA"; content: string }>[];
  selectedReviewRef?: string | null;
  requestingTurnRef?: string;
}): BoundedConversationReferentContext => {
  const expectedBase = input.currentProject ? {
    projectId: input.currentProject.projectId,
    versionId: input.currentProject.versionId,
    projectDigest: input.currentProject.projectDigest,
  } : null;
  // Current refusal/correction is the act to handle, not a prior disposition.
  // Only earlier human turns can make a formerly presented payload obsolete.
  const historyTurns = input.runtimeTurns.filter(turn => turn.turnId !== input.requestingTurnRef);
  const discussion = buildScientificDiscussionContext({ ...input, runtimeTurns: historyTurns });
  if (discussion.boundary !== "COMPLETE") return Object.freeze({
    resolution: "NONE", candidateRef: null, sourceTurnRef: null, sourceDigest: null, content: [],
    reason: "DISCUSSION_DECISION_SCOPE_UNAVAILABLE", projectWriteAuthorized: false,
  });
  const closedCandidates = new Set(discussion.history.filter(item => {
    const candidate = input.retained.find(record => record.candidateRef === item.element.candidateRef);
    const reason = discussion.sources.find(source => source.ref === item.reasonSourceRef);
    return candidate && reason && historyTurns.findIndex(turn => turn.turnId === reason.turnRef)
      > historyTurns.findIndex(turn => turn.turnId === candidate.sourceTurnRef);
  }).map(item => item.element.candidateRef));
  for (const record of input.retained) {
    const sourceIndex = historyTurns.findIndex(turn => turn.turnId === record.sourceTurnRef);
    if (sourceIndex < 0) continue;
    for (const turn of historyTurns.slice(sourceIndex + 1).filter(turn => turn.role === "USER")) {
      const scopedTime = turn.content.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
        .match(/^(?:le |la |l')(\p{L}+(?: \p{L}+){0,3}) est (?:a )?([jma]\+?\d+)\b/u);
      if (!scopedTime) continue;
      const matches = record.candidate.humanReviewProjection.sections.flatMap(section => section.items).filter(item =>
        item.content.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().includes(scopedTime[1]!));
      if (matches.length === 1) {
        const times = matches[0]!.content.toLowerCase().match(/\b[jma]\+?\d+\b/gu) ?? [];
        if (times.length === 1 && times[0] !== scopedTime[2]) closedCandidates.add(record.candidateRef);
      }
    }
  }
  const eligible = input.retained.filter((record) => {
    const source = input.runtimeTurns.find((turn) => turn.role === "USER" && turn.turnId === record.sourceTurnRef);
    return record.actuality === "CURRENT" && !record.humanDecision
      && !closedCandidates.has(record.candidateRef)
      && record.validation.valid && !record.validation.blocks.length
      && record.dependencyBindings.every(binding => binding.actuality === "CURRENT")
      && record.contribution.source.conversationId === input.conversationId
      && source && logicalDigest(source.content) === record.sourceDigest
      && same(record.baseProject, expectedBase)
      && same(record.candidateDigest, logicalDigest({ contribution: record.contribution, candidate: record.candidate }));
  });
  if (eligible.length > 1) return Object.freeze({
    resolution: "AMBIGUOUS", candidateRef: null, sourceTurnRef: null, sourceDigest: null, content: [],
    reason: "MULTIPLE_CURRENT_NON_ADOPTED_CANDIDATES", projectWriteAuthorized: false,
  });
  const record = eligible.find(record => input.selectedReviewRef === undefined || record.candidateRef === input.selectedReviewRef);
  const numberedPoints = record ? input.runtimeTurns.slice(input.runtimeTurns.findIndex(turn => turn.turnId === record.sourceTurnRef) + 1)
    .filter(turn => turn.role === "NOXIA").flatMap(turn => [...turn.content.matchAll(/(?:^|\n)\s*(\d+)[.)]\s*([^\n]+)/gu)].flatMap(match => {
      const matches = record.candidate.humanReviewProjection.sections.flatMap(section => section.items)
        .filter(item => item.content.replace(/^\+\s*/u, "").trim() === match[2]!.trim());
      return matches.length === 1 ? [{ ordinal: Number(match[1]), changeRefs: [matches[0]!.changeRef], sourceTurnRef: turn.turnId }] : [];
    })) : [];
  if (record) return Object.freeze({
    resolution: "UNIQUE_CURRENT", candidateRef: record.candidateRef, sourceTurnRef: record.sourceTurnRef,
    sourceDigest: record.sourceDigest, content: Object.freeze(candidateReferentContent(record)),
    decisionScope: Object.freeze({
      selectedReviewRef: record.candidateRef,
      presented: record.downstreamState === "PRESENTED" && Boolean(record.presentedAt),
      changedObjectRefs: Object.freeze(unique(record.candidate.canonicalChangeSet.objectChanges.map(change => change.objectId))),
      candidateTexts: Object.freeze(record.candidate.canonicalChangeSet.objectChanges
        .flatMap(change => change.candidate ? [change.candidate.content] : [])),
      candidateKinds: Object.freeze(unique([
        ...record.candidate.canonicalChangeSet.objectChanges.flatMap(change => change.candidate ? [change.candidate.objectType] : []),
        ...(record.candidate.canonicalChangeSet.temporalQualificationChanges.length ? ["TEMPORAL_QUALIFICATION"] : []),
      ])),
      sourceText: input.runtimeTurns.find(turn => turn.turnId === record.sourceTurnRef)!.content,
      adoptedTexts: Object.freeze(input.currentProject?.sections.flatMap(section => section.elements.map(item => item.content)) ?? []),
      reviewItems: Object.freeze(record.candidate.humanReviewProjection.sections.flatMap(section => section.items)),
      numberedPoints: Object.freeze(numberedPoints),
      scopeGroups: Object.freeze(contributionDecisionScopeGroups(record.candidate, input.currentProject)),
      independentAddScope: record.candidate.canonicalChangeSet.objectChanges.every(change => change.operation === "ADD"),
      objectOnlyScope: !record.candidate.canonicalChangeSet.relationChanges.length
        && !record.candidate.canonicalChangeSet.temporalQualificationChanges.length
        && !record.candidate.canonicalChangeSet.expectedVariableOccasionChanges.length
        && !record.candidate.canonicalChangeSet.legacyTemporalChanges.length,
    }),
    reason: input.selectedReviewRef ? "EXACT_PRESENTED_REVIEW_SELECTION_BINDING" : "EXACT_CURRENT_RETAINED_CANDIDATE_BINDING",
    projectWriteAuthorized: false,
  });
  const nonCurrentExists = input.retained.some((record) => record.actuality !== "CURRENT" || Boolean(record.humanDecision) || closedCandidates.has(record.candidateRef));
  return Object.freeze({
    resolution: nonCurrentExists ? "STALE_OR_SUPERSEDED" : "NONE",
    candidateRef: null, sourceTurnRef: null, sourceDigest: null, content: [],
    reason: nonCurrentExists ? "ONLY_NON_CURRENT_OR_DECIDED_CANDIDATES_AVAILABLE" : "NO_RETAINED_CANDIDATE",
    projectWriteAuthorized: false,
  });
};

// The act grammar works on clauses, while reference resolution remains the
// lifecycle projection above. Quoted, hypothetical and interrogative decisions
// never become a human authorization merely because a decision verb is present.
const interactionClauses = (source: string) => {
  const clauses: string[] = [];
  let clause = "";
  let closingQuote: string | null = null;
  for (const character of source) {
    clause += character;
    if (closingQuote) {
      if (character === closingQuote) closingQuote = null;
    } else if (character === '"' || character === "«" || character === "“") {
      closingQuote = character === "«" ? "»" : character === "“" ? "”" : '"';
    } else if (/[.!?;\n]/u.test(character)) {
      if (clause.trim()) clauses.push(clause.trim());
      clause = "";
    }
  }
  if (clause.trim()) clauses.push(clause.trim());
  return clauses;
};

const nonAssertedDecision = (clause: string) => /\?|\b(?:si|peut-être|éventuellement|exemple|supposons|imaginons|dirais|dirions)\b/u.test(clause)
  || /\b(?:ne|n')\s*(?:\w+\s+){0,3}(?:confirme|confirmons|valide|validons|accepte|acceptons|refuse|refusons|rejette|rejetons)\b/u.test(clause)
  || /\b(?:confirme|confirmons|valide|validons|accepte|acceptons|refuse|refusons|rejette|rejetons)\s+(?:pas|jamais|plus)\b/u.test(clause);

const candidateDecision = (clauses: readonly string[]): "CONFIRM" | "REFUSE" | null => {
  // A qualified/partial decision is not authorization for the whole candidate.
  if (clauses.some((clause) => /["«»“”]|\b(?:sauf|excepté|hormis|seulement|uniquement|partiellement|à condition|si|peut-être|éventuellement|exemple|supposons|imaginons|dirais|dirions)\b/u.test(clause)
    || /\b(?:ne|n'|sans)\s*(?:\w+\s+){0,3}(?:confirm\w*|valid\w*|accept\w*|adopt\w*|refus\w*|rejet\w*|décision)\b/u.test(clause)
    || /\b(?:pas|aucune?)\s+(?:de\s+)?(?:décision|confirmation|validation|adoption)\b/u.test(clause)
    || /\b(?:annul\w*|retir\w*)\b.{0,60}\b(?:accord|confirmation|validation|décision)\b/u.test(clause)
    || /\b(?:remplace[rz]?|modifie[rz]?|corrige[rz]?|ajoute[rz]?|change[rz]?)\b/u.test(clause))) return null;
  const decisions = new Set<"CONFIRM" | "REFUSE">();
  for (const clause of clauses) {
    if (nonAssertedDecision(clause)) return null;
    const shortConfirmation = clauses.length === 1 && /^(?:(?:oui[, ]+)?c[' ]est bon|je valide|garde (?:ça|cela)|ça me va|cela me va|d[' ]accord|ok)(?:[.!])?$/u.test(clause);
    const shortRefusal = clauses.length === 1 && /^(?:non|je refuse|je rejette|rejette (?:ça|cela)|ne (?:garde|retiens) pas (?:ça|cela))(?:[.!])?$/u.test(clause);
    if (shortConfirmation) decisions.add("CONFIRM");
    if (shortRefusal) decisions.add("REFUSE");
    // A performative is insufficient: its object must denote the current
    // candidate, never a fact ("je confirme que…") or one of its attributes.
    const acts = [...clause.matchAll(/(?:^|[,;]\s*|\bet\s+|^finalement\s+)(?:je|nous)\s+(?:(la|le|l'|les)\s*)?(confirme|confirmons|valide|validons|accepte|acceptons|refuse|refusons|rejette|rejetons)\b/gu)];
    // The local decision handler consumes the entire turn. An unrelated
    // assertion or request must therefore stay in the full governed corridor.
    const preservesProject = /^(?:le reste|le projet|les autres éléments)\s+(?:reste|restent|demeure|demeurent)\s+inchangée?s?[.!]?$/u.test(clause);
    if (!acts.length && !shortConfirmation && !shortRefusal && !preservesProject) return null;
    for (const act of acts) {
      const tail = clause.slice(act.index! + act[0].length).replace(/[.!;]+$/u, "").trim();
      const prefix = clause.slice(0, act.index!).trim();
      const decision = /^(?:refus|rejet)/u.test(act[2]) ? "REFUSE" : "CONFIRM";
      const neutralPrefix = /^(?:(?:oui|non|finalement)|après (?:relecture|réflexion|examen))?$/u.test(prefix);
      const presentedAntecedent = /^(?:oui[, ]+)?(?:ce|cet|cette)\s+(?:(?:candidate|contribution|proposition)|[^,;:.!?]+\s+(?:comme|telle? que)\s+présentée?)\s+(?:me|nous)\s+convient$/u.test(prefix);
      const currentObject = /^(?:cette?|cet|la|le|l')\s*(?:candidate|contribution|proposition|ajout|modification|changement)(?:[- ]là)?(?![\p{L}\p{N}\p{M}_])/u.exec(tail);
      const qualifier = currentObject ? tail.slice(currentObject[0].length).trim() : "";
      const boundedQualifier = /^(?:(?:courante?|actuelle?|présentée?|en cours|dans son ensemble|en l'état|telle? que présentée?|sans modification))?$/u.test(qualifier)
        || /^(?:que (?:tu viens|vous venez) de (?:présenter|proposer)|,?\s*celle que (?:tu viens|vous venez) de (?:présenter|proposer))$/u.test(qualifier);
      const scoped = (neutralPrefix || presentedAntecedent) && (tail === ""
        || !act[1] && Boolean(currentObject) && boundedQualifier);
      if (!scoped) return null;
      decisions.add(decision);
    }
  }
  return decisions.size === 1 ? [...decisions][0]! : null;
};

// Normalize only quantities and inflection for reference comparison. This is
// not a scientific interpretation: unproved descriptors still require review.
const decisionQuantityWords = (() => {
  const small = ["zero", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize"];
  const french = (n: number): string => {
    if (n < 17) return small[n]!;
    if (n < 20) return `dix ${small[n - 10]}`;
    if (n < 70) {
      const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"][Math.floor(n / 10)];
      return `${tens}${n % 10 === 1 ? " et un" : n % 10 ? ` ${small[n % 10]}` : ""}`;
    }
    if (n < 80) return `soixante${n === 71 ? " et" : ""} ${french(n - 60)}`;
    return n === 80 ? "quatre vingts" : `quatre vingt ${french(n - 80)}`;
  };
  return [...Array.from({ length: 100 }, (_, n) => [french(n), String(n)] as const), ["quatre vingt", "80"] as const]
    .sort((left, right) => right[0].length - left[0].length);
})();
const decisionWords = (source: string) => {
  let text = source.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr-FR")
    .replace(/(\d)[.,](\d)/gu, "$1decimal$2")
    .replace(/[-−]\s*(\d)/gu, "moins$1").replace(/\+\s*(\d)/gu, "plus$1")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  for (const [words, value] of decisionQuantityWords) {
    // Articles are not quantities. An isolated un/une is deliberately left
    // lexical; explicit digits remain exact.
    if (words === "un") continue;
    text = text.replace(new RegExp(`\\b${words}\\b`, "gu"), value);
  }
  for (const [unit, multiplier] of [["cents?", 100], ["mille", 1000], ["millions?", 1000000]] as const) {
    text = text.replace(new RegExp(`\\b(?:(\\d+) )?${unit}(?: (\\d+))?\\b`, "gu"),
      (_match, factor: string | undefined, remainder: string | undefined) => String(Number(factor ?? 1) * multiplier + Number(remainder ?? 0)));
  }
  return text.split(/\s+/u).filter(Boolean).map(word => word.replace(/ement$/u, "").replace(/(?:ees|es|e|s)$/u, ""));
};
const decisionReferenceGrounded = (reference: string, scope: NonNullable<BoundedConversationReferentContext["decisionScope"]>) => {
  const candidateWords = new Set(decisionWords(scope.candidateTexts.join(" ")));
  const grammar = new Set(decisionWords("ce cet cette ces le la les l de du des d un une a au aux en et pour par sur son sa ses me m nous tu vous il elle je qui que qu vient viens venez venir tel telle comme exactement bien uniquement seulement courant actuelle presente presentee presenter affiche affiches afficher propose proposee proposer etre convient conviennent va avec candidate contribution proposition ajout modification changement remplacement retrait passage deplacement correction restriction raccourcissement ensemble etat celle celui ca cela la"));
  // Vocabulary is licensed by native candidate kinds or explicit units, not
  // by arbitrary words in the original request (which can include old values).
  const temporal = scope.candidateKinds.includes("TEMPORAL_QUALIFICATION")
    || scope.candidateTexts.some(text => (text.match(/\p{L}+/gu) ?? []).some(word => canonicalFrenchTemporalUnit(word)));
  const labels = new Set(decisionWords([
    ...(temporal ? ["calendrier moment creneau"] : []),
    ...(scope.candidateKinds.includes("CANONICAL_VARIABLE") ? ["variable", /\bcovariable\b/iu.test(scope.sourceText) ? "covariable" : ""] : []),
    ...(scope.candidateKinds.includes("ENDPOINT") ? ["critere mesure"] : []),
    ...(scope.candidateTexts.some(text => /\bCelsius\b|°\s*C\b/u.test(text)) ? ["temperature"] : []),
    // A participant count may be rendered as a count of persons. License the
    // human's count label only when that label occurs in its own source and
    // the native candidate explicitly describes a human sample size. Numeric
    // qualifiers still have to match the candidate, never an old source value.
    ...(scope.candidateTexts.some(text => /\beffectif\b.*\bpersonnes?\b/iu.test(text))
      && /\b(?:nombre|effectif)\s+de\s+participants?\b/iu.test(scope.sourceText) ? ["participant"] : []),
    // A source-introduced object name is a reference label, not all the facts
    // of that source. Old quantities and unselected examples remain excluded.
    ...[...scope.sourceText.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
      .matchAll(/\b(?:propose|proposer|soumettre|soumets|ajouter|ajoute)\s+(?:le|la|un|une|l')\s*(\p{L}+)\b/gu)]
      .filter(match => !/\b(?:pas|jamais|sans|ne)\s*$/u.test(scope.sourceText.slice(Math.max(0, match.index! - 12), match.index!).toLowerCase()))
      .map(match => match[1]!),
  ].join(" ")));
  const descriptors = decisionWords(reference).filter(word => !grammar.has(word));
  return descriptors.every(word => /\d/u.test(word) ? candidateWords.has(word)
    : candidateWords.has(word) || labels.has(word)
      || word.length >= 6 && [...candidateWords].some(candidate => candidate.startsWith(word)
        && /^(?:i|ir|li|lir|l|ant|ante)$/u.test(candidate.slice(word.length))));
};

/**
 * A broader act can be resolved only against the actual selected review.
 * This stage binds a deictic whole-candidate reference; it does not interpret
 * scientific facts or infer consent from an isolated decision verb.
 */
const contextualCandidateDecision = (
  clauses: readonly string[], context: BoundedConversationReferentContext,
): "CONFIRM" | "REFUSE" | "CLARIFY" | null => {
  const text = clauses.join(" ").normalize("NFD").replace(/\p{M}/gu, "");
  if (/["«»“”]/u.test(text)) return null;
  // A bare act can use the existing grammar only after the caller proves a
  // unique, presented review. It does not make the newest pending card unique.
  if (clauses.length === 1 && /^(?:je|nous) (?:confirme|confirmons|valide|validons|accepte|acceptons|refuse|refusons|rejette|rejetons)[.!;]?$/u.test(text)) return null;
  // These are selection/new-material acts. Their existing owner must resolve
  // them; a pending review is not permission to adopt a different proposition.
  if (/\b(?:je|nous) (?:retiens|retenons) (?:la question|l'hypothese|l'option|la strategie)\s+\d+\b/u.test(text)
    || /\b(?:je|nous) (?:retiens|retenons)\b.{0,50}\bcomme (?:objectif|critere|endpoint|hypothese|design|population|analyse|mesure|visite)\b/u.test(text)
    || /\b(?:une?|de|des) nouvelle?s? (?:proposition|contribution)s?\s*:/u.test(text)
    || /^(?:je|nous) (?:rejette|rejetons|refuse|refusons) toutes? (?:ces|les) (?:options|propositions|alternatives)[.!;]?$/u.test(text)) return null;
  const actPattern = /(?:^|[,;:]\s*|\bet\s+)(?:(?:je|nous)\s+|j')(?:(ne|n')\s*)?(?:(la|le|les|l')\s*)?(confirme|confirmons|valide|validons|accepte|acceptons|adopte|adoptons|refuse|refusons|rejette|rejetons|retiens|retenons|prefere refuser)\b/gu;
  const acts = clauses.flatMap((clause, index) => {
    const value = clause.normalize("NFD").replace(/\p{M}/gu, "")
      .replace(/^(non[, ]+)?retirons\b/u, "$1nous refusons");
    return [...value.matchAll(actPattern)].map(match => ({ index, value, match }));
  });
  if (!acts.length) return null;
  if (acts.every(({ value, match }) => /^\s+qu[e']\b/u.test(value.slice(match.index! + match[0].length)))) return null;
  const onlyRefusal = acts.every(({ match }) => /refus|rejet/u.test(match[3]) || Boolean(match[1]) && /retiens|retenons/u.test(match[3]));
  for (let index = 0; index < clauses.length; index++) {
    if (acts.some(act => act.index === index)) continue;
    const value = clauses[index].normalize("NFD").replace(/\p{M}/gu, "");
    const preservation = /\b(?:gardons|garde|gardez|conserve|conservons|conservez|restons|reste|restent|demeure|demeurent|ne remet pas en cause)\b/u.test(value)
      || /\btoujours\b/u.test(value) && /\b(?:pas|inconnu|inconnue|non choisi)\b/u.test(value);
    if (preservation) {
      const genericUnchanged = /^(?:le reste|le projet|les autres elements) (?:reste|restent|demeure|demeurent) inchangee?s?[.!]?$/u.test(value);
      // Retention accompanying a refusal cannot modify Project. A conflicting
      // quantity still needs clarification. A named retention accompanying an
      // adoption is a separate scope restriction, not blanket consent.
      if (!onlyRefusal && !genericUnchanged) return "CLARIFY";
      const adopted = new Set(decisionWords(context.decisionScope?.adoptedTexts.join(" ") ?? ""));
      if (decisionWords(value).some(word => /\d/u.test(word) && !adopted.has(word))) return "CLARIFY";
      continue;
    }
    // Independent payload must still reach the reversible owner corridor.
    if (!preservation) {
      // A stated retention of the adopted state belongs to the decision scope.
      // Unproved retention is clarified, never silently discarded as payload.
      if (/\b(?:gardons|restons|reste|restent|demeure|demeurent|conserve|conservons|conservez|retirons|toujours|ne remet pas en cause)\b/u.test(value)) return "CLARIFY";
      return null;
    }
  }
  // Questions, examples, conditions and partial decisions never acquire the
  // authority of a complete current-candidate confirmation through this path.
  if (/\?|\b(?:si|supposons|imaginons|exemple|dirais|dirions|peut-etre|eventuellement|sauf|excepte|hormis|partiellement|a condition)\b/u.test(text)) return "CLARIFY";
  if (/\b(?:sans adopter|sans adoption|pas de decision|aucune autorisation|retire mon accord|annule)\b/u.test(text)) return "CLARIFY";
  if (/\b(?:ancien(?:ne)?|precedent(?:e)?|premier(?:e)?|deuxieme|troisieme)\b/u.test(acts.map(act => act.value).join(" "))
    && !/\b(?:comme|tel(?:le)? que) presentee?\b/u.test(text)) return "CLARIFY";
  const scope = context.decisionScope;
  if (context.resolution !== "UNIQUE_CURRENT" || !context.candidateRef || !context.sourceTurnRef || !context.sourceDigest
    || !scope?.presented || scope.selectedReviewRef !== context.candidateRef) return "CLARIFY";
  const decisions = new Set<"CONFIRM" | "REFUSE">();
  for (const { value, match } of acts) {
    const verb = match[3];
    const negativeRetention = /^(?:retiens|retenons)$/u.test(verb) && Boolean(match[1]);
    if (match[1] && !negativeRetention) return "CLARIFY";
    const decision = /refus|rejet/u.test(verb) || negativeRetention ? "REFUSE" : "CONFIRM";
    let tail = value.slice(match.index! + match[0].length).replace(/[.!;]+$/u, "").trim();
    if (negativeRetention) {
      if (!/^pas\b/u.test(tail)) return "CLARIFY";
      tail = tail.replace(/^pas\s*/u, "");
    } else if (/^(?:pas|jamais|plus)\b/u.test(tail)) return "CLARIFY";
    const prefix = value.slice(0, match.index!).trim();
    const neutral = /^(?:(?:oui|non|finalement|c'est bien ca|cette fois|a la relecture|apres relecture|apres reflexion|apres examen|en revanche|donc|alors|bien|exactement)[,: ]*)*$/u.test(prefix);
    const antecedent = prefix.replace(/^(?:oui|non)[, ]+/u, "").replace(/[, ]+$/u, "");
    const deicticAntecedent = /^(?:ce|cet|cette)\b/u.test(antecedent) && Boolean(match[2]);
    if (!neutral && !deicticAntecedent) return "CLARIFY";
    const restricted = /^(?:uniquement|seulement)\s+/u.test(tail);
    tail = tail.replace(/^(?:uniquement|seulement)\s+/u, "");
    const reference = tail || (deicticAntecedent ? antecedent : "");
    if (!reference && !match[2]) return "CLARIFY";
    if (reference && !/^(?:ce|cet|cette|la|le|l')(?=\s|\p{L})/u.test(reference)) return "CLARIFY";
    if (/\b(?:mais|remplace|modifie|corrige|ajoute|change|une partie|uniquement|seulement)\b/u.test(reference)) return "CLARIFY";
    const presentationPointer = /\b(?:presentee?|affichee?|proposee?|presenter|afficher|proposer)\b/u.test(reference)
      && /\b(?:viens|venez|vient|comme|tel|telle|que)\b/u.test(reference);
    const wholeChange = /^(?:ce|cet|cette|la|le|l')\s*(?:candidate|contribution|proposition|ajout|modification|changement|remplacement|retrait|passage|deplacement|correction|raccourcissement)(?:-la)?(?=$|[\s,.!?])/u.test(reference)
      || !scope.adoptedTexts.length && /^(?:ce|cet|cette|la|le|l')\s*(?:projet|plan|etude|essai|benchmark)\b/u.test(reference);
    if (!decisionReferenceGrounded(reference, scope)) return "CLARIFY";
    // A named part of a multi-object candidate cannot authorize its siblings.
    // A single-object scope still requires the explicit displayed-review link
    // when the human limits their approval with "uniquement" / "seulement".
    if (restricted && (scope.changedObjectRefs.length !== 1 || !presentationPointer && !wholeChange)) return "CLARIFY";
    if (!wholeChange && scope.changedObjectRefs.length > 1) {
      const referenceWords = new Set(decisionWords(reference));
      // Every changed object must participate in a named, non-whole decision.
      // A shared grammatical word is not evidence of scope coverage.
      if (!scope.candidateTexts.every(candidate => decisionWords(candidate)
        .some(word => word.length > 3 && referenceWords.has(word)))) return "CLARIFY";
    }
    if (!presentationPointer && !wholeChange && scope.changedObjectRefs.length !== 1) return "CLARIFY";
    decisions.add(decision);
  }
  return decisions.size === 1 ? [...decisions][0]! : "CLARIFY";
};

const requestsPastProposalReference = (text: string) => !/["«»“”]/u.test(text)
  && (/\b(?:je (?:selectionne|choisis)|c'est celle-la que je selectionne|nous (?:selectionnons|choisissons)|reprenons)\b/u.test(text)
    && /\b(?:premiere|premier|deuxieme|troisieme|ancienne?|precedent|precedente|historique|liste|reference)\b/u.test(text)
    || /\balternatives? a (?:cette|la|une) (?:premiere|deuxieme|troisieme|ancienne)\b/u.test(text));

const naturalDecisionInteraction = (source: string, context: BoundedConversationReferentContext): BoundedConversationInteraction | undefined => {
  const text = source.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[\u2018\u2019]/gu, "'").replace(/\s+/gu, " ").trim();
  const act = readNaturalCandidateDecision(source);
  const partial = /^(?:oui pour .+ mais (?:pas|non) (?:pour )?.+|(?:le )?premier(?: point)? oui[,; ]+(?:le )?(?:deuxieme|second)(?: point)? non)[.!]?$/u.test(text);
  const optionSelection = /^(?:la premiere|le premier|les deux)[.!]?$/u.test(text);
  const partition = /^oui pour (.+) mais je changerais (.+?)[.!]?$/u.exec(text)
    ?? /^(.+?) oui[,; ]+(.+?) non[.!]?$/u.exec(text)
    ?? /^garde (.+?) mais pas (.+?)[.!]?$/u.exec(text);
  const scopedRefusal = /^je retire (.+?),? le reste reste comme avant[.!]?$/u.exec(text);
  if (!act && !partial && !optionSelection && !partition && !scopedRefusal) return undefined;
  if (act && /^qu[e']\b/u.test(act.remainder)) return undefined;
  const clarify = (clarificationText: string): BoundedConversationInteraction => Object.freeze({
    kind: "CLARIFY_CANDIDATE_REFERENCE", evidenceRefs: Object.freeze([]), clarificationReason: "DECISION_SCOPE", clarificationText,
  });
  const scope = context.decisionScope;
  if (context.resolution !== "UNIQUE_CURRENT" || !context.candidateRef || !context.sourceTurnRef || !context.sourceDigest
    || !scope?.presented || scope.selectedReviewRef !== context.candidateRef) {
    return clarify(context.resolution === "AMBIGUOUS" ? "Quelle proposition souhaitez-vous confirmer ou refuser ?" : "Quelle proposition souhaitez-vous reprendre pour confirmation ?");
  }
  const evidenceRefs = Object.freeze([context.candidateRef, context.sourceTurnRef]);
  if (optionSelection) {
    const points = scope.numberedPoints ?? [];
    const first = points.filter(point => point.ordinal === 1);
    const second = points.filter(point => point.ordinal === 2);
    if (first.length !== 1 || second.length !== 1) return clarify("Quels sont les deux points parmi lesquels vous choisissez ?");
    const both = [...first[0]!.changeRefs, ...second[0]!.changeRefs];
    const all = scope.reviewItems?.map(item => item.changeRef) ?? [];
    if (text.startsWith("les deux") && all.length === both.length && all.every(ref => both.includes(ref))) {
      return Object.freeze({ kind: "USER_CONFIRMS_CURRENT_CANDIDATE", evidenceRefs });
    }
    // Choosing an alternative is not consent to its unselected siblings. The
    // existing corridor prepares the selected proposal for its native review.
    return Object.freeze({ kind: "ACKNOWLEDGE_USER_DIRECTION", evidenceRefs: Object.freeze([...evidenceRefs, ...first[0]!.changeRefs]) });
  }
  const numbered = (ordinal: number) => {
    const matches = scope.numberedPoints?.filter(point => point.ordinal === ordinal) ?? [];
    return matches.length === 1 ? matches[0]!.changeRefs : [];
  };
  const bind = (raw: string) => {
    const label = raw.replace(/[.!]+$/u, "").replace(/^(?:le |la |l')/u, "").trim();
    if (/^premier(?:e)?(?: point)?$/u.test(label)) return numbered(1);
    if (/^(?:deuxieme|second(?:e)?)(?: point)?$/u.test(label)) return numbered(2);
    const type = label === "population" ? "POPULATION" : label === "critere principal" ? "ENDPOINT" : null;
    if (type) return scope.reviewItems?.filter(item => item.objectType === type
      && (type !== "ENDPOINT" || /PRIMARY|PRINCIPAL/u.test(item.scientificRole ?? ""))).map(item => item.changeRef) ?? [];
    const token = label === "calendrier" ? /\b(?:j\+?\d+|m\d+|suivi|calendrier)\b/u
      : label === "irm" ? /\birm\b/u : label === "prelevement" ? /\bprelevement\b/u
      : label === "analyse avec seuil" ? /\b(?:analyse|seuil)\b.*\bseuil\b|\banalyse avec seuil\b/u : null;
    return token ? scope.reviewItems?.filter(item => token.test(item.content.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase())).map(item => item.changeRef) ?? [] : [];
  };
  if (partial || partition || scopedRefusal) {
    const named = /^oui pour (.+) mais (?:pas|non) (?:pour )?(.+?)[.!]?$/u.exec(text);
    const selected = scopedRefusal ? [] : named ? bind(named[1]!) : partition ? bind(partition[1]!) : numbered(1);
    const refused = scopedRefusal ? bind(scopedRefusal[1]!) : named ? bind(named[2]!) : partition ? bind(partition[2]!) : numbered(2);
    const correction = Boolean(partition && /mais je changerais/u.test(text));
    const separable = (refs: readonly string[]) => (scope.scopeGroups ?? []).every(group => !group.some(ref => refs.includes(ref)) || group.every(ref => refs.includes(ref)));
    if ((!scopedRefusal && !selected.length) || !refused.length || selected.some(ref => refused.includes(ref))
      || !scope.scopeGroups || !separable(selected) || !separable(refused)) {
      return clarify("Quels éléments présentés souhaitez-vous retenir ou modifier séparément ?");
    }
    return Object.freeze({ kind: scopedRefusal ? "USER_REFUSES_CURRENT_CANDIDATE" : "USER_CONFIRMS_CURRENT_CANDIDATE", evidenceRefs,
      selectedChangeRefs: Object.freeze(scopedRefusal ? [...refused] : [...selected]),
      ...(correction ? { correctionChangeRefs: Object.freeze([...refused]) } : scopedRefusal ? {} : { refusedChangeRefs: Object.freeze([...refused]) }) });
  }
  // Only an unqualified confirmation followed by an explicit addition splits
  // adoption from preparation. A 'yes, but' correction never adopts first.
  const addition = /^(.*?)\s*,?\s+et\s+(?:(?:on|nous)\s+)?(?:ajoute|ajoutons|ajouter)\b/u.exec(text);
  if (addition && readNaturalCandidateDecision(addition[1]!.replace(/[, ]+$/u, ""))?.qualified === false
    && act?.act === "CONFIRM") return Object.freeze({ kind: "USER_CONFIRMS_CURRENT_CANDIDATE", evidenceRefs, prepareRemainingTurn: true });
  if (!act) return undefined;
  if (!act.qualified) return Object.freeze({ kind: act.act === "CONFIRM" ? "USER_CONFIRMS_CURRENT_CANDIDATE" : "USER_REFUSES_CURRENT_CANDIDATE", evidenceRefs });
  if (act.act === "REFUSE" && /^on garde l'ancien (?:critere|objectif)[.!]?$/u.test(act.remainder)
    && scope.adoptedTexts.length) return Object.freeze({ kind: "USER_REFUSES_CURRENT_CANDIDATE", evidenceRefs });
  const feedback = act.remainder.replace(/^(?:mais|meme si)[, ]*/u, "");
  if (isOnlyConversationStyleFeedback(feedback)) return Object.freeze({
    kind: act.act === "CONFIRM" ? "USER_CONFIRMS_CURRENT_CANDIDATE" : "USER_REFUSES_CURRENT_CANDIDATE", evidenceRefs,
  });
  const literalScience = (value: string) => decisionWords(value)
    .filter(word => !new Set(["le", "la", "l", "de", "d", "du", "des", "en", "comme"]).has(word)).join(" ");
  const clauses = interactionClauses(text);
  const currentRestatement = clauses.every(clause => {
    const clauseAct = readNaturalCandidateDecision(clause);
    if (!clauseAct || clauseAct.act !== "CONFIRM") return false;
    if (!clauseAct.qualified) return true;
    const restatement = clauseAct.remainder.replace(/^(?:le projet avec cette formulation|cette formulation)[, ]*/u, "");
    if (!/^en gardant\s/u.test(restatement)) return false;
    return restatement.replace(/^en gardant\s+/u, "").split(/\s+et\s+/u).every(part => {
      const literal = literalScience(part);
      return literal.length > 8 && scope.candidateTexts.some(candidate => literalScience(candidate) === literal);
    });
  });
  if (currentRestatement) return Object.freeze({ kind: "USER_CONFIRMS_CURRENT_CANDIDATE", evidenceRefs });
  if (/\ben gardant\b/u.test(act.remainder)) return Object.freeze({ kind: "ACKNOWLEDGE_USER_DIRECTION", evidenceRefs });
  // Material qualifiers go through the existing candidate corridor. In
  // particular, a 'yes, but' never confirms the old value before correction.
  if (/^(?:mais|et)\b/u.test(act.remainder)) {
    const temporalCorrection = /^mais (?:finalement )?(?:a )?[jma]\+?\d+(?: et pas [jma]\+?\d+)?$/u.test(act.remainder);
    const targets = temporalCorrection ? scope.reviewItems?.filter(item => /\b[jma]\+?\d+\b/iu.test(item.content)) ?? [] : [];
    if (temporalCorrection && targets.length !== 1) return clarify("Quel temps de mesure souhaitez-vous remplacer par cette nouvelle valeur ?");
    return Object.freeze({ kind: "ACKNOWLEDGE_USER_DIRECTION", evidenceRefs,
      ...(targets.length === 1 ? { correctionChangeRefs: Object.freeze([targets[0]!.changeRef]) } : {}) });
  }
  // Named scopes and restatements retain the existing conservative grounding
  // rules below rather than acquiring whole-candidate authority from 'yes'.
  return undefined;
};



/** Bounded interaction acts; no scientific target or Project state is inferred. */
export const selectBoundedConversationInteraction = (input: {
  sourceText: string;
  correctionMode: boolean;
  referentContext: Readonly<BoundedConversationReferentContext>;
}): BoundedConversationInteraction | undefined => {
  if (input.correctionMode) return Object.freeze({
    kind: "ACKNOWLEDGE_USER_DIRECTION", evidenceRefs: Object.freeze([input.referentContext.candidateRef].filter((ref): ref is string => Boolean(ref))),
  });
  const normalized = input.sourceText.normalize("NFKC").replace(/[\u2018\u2019\u02bc\uff07]/gu, "'")
    .toLocaleLowerCase("fr-FR").replace(/\s+/gu, " ").trim();
  const clauses = interactionClauses(normalized);
  if (/^(?:ok|d'accord)(?:[, ]+(?:je vois|j'ai compris|merci))?[.!]?$/u.test(normalized)) return Object.freeze({ kind: "ACKNOWLEDGE_USER_DIRECTION", evidenceRefs: Object.freeze([]) });
  if (requestsPastProposalReference(normalized.normalize("NFD").replace(/\p{M}/gu, ""))) return Object.freeze({
    kind: "CLARIFY_CANDIDATE_REFERENCE", evidenceRefs: Object.freeze([]), clarificationReason: "PAST_PROPOSAL_REFERENCE",
  });
  const naturalDecision = naturalDecisionInteraction(input.sourceText, input.referentContext);
  if (naturalDecision) return naturalDecision;
  const scopedTime = normalized.normalize("NFD").replace(/\p{M}/gu, "")
    .match(/^(?:le |la |l')(\p{L}+(?: \p{L}+){0,3}) est (?:a )?[jma]\+?\d+\b/u);
  if (scopedTime && input.referentContext.resolution === "UNIQUE_CURRENT" && input.referentContext.decisionScope?.presented) {
    const matches = input.referentContext.decisionScope.reviewItems?.filter(item =>
      item.content.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().includes(scopedTime[1]!)) ?? [];
    if (matches.length === 1) return Object.freeze({ kind: "ACKNOWLEDGE_USER_DIRECTION",
      evidenceRefs: Object.freeze([input.referentContext.candidateRef!, input.referentContext.sourceTurnRef!, matches[0]!.changeRef]),
      correctionChangeRefs: Object.freeze([matches[0]!.changeRef]) });
  }
  const decisionWithStyleFeedback = isUnqualifiedWholeCandidateDecisionWithStyleFeedback(input.sourceText);
  if (decisionWithStyleFeedback) {
    const scope = input.referentContext.decisionScope;
    if (input.referentContext.resolution !== "UNIQUE_CURRENT"
      || !input.referentContext.candidateRef || !input.referentContext.sourceTurnRef
      || !input.referentContext.sourceDigest || !scope?.presented
      || scope.selectedReviewRef !== input.referentContext.candidateRef) {
      return Object.freeze({ kind: "CLARIFY_CANDIDATE_REFERENCE", evidenceRefs: Object.freeze([]), clarificationReason: "DECISION_SCOPE" });
    }
    const evidenceRefs = Object.freeze([input.referentContext.candidateRef, input.referentContext.sourceTurnRef]);
    return Object.freeze({
      kind: decisionWithStyleFeedback === "CONFIRM"
        ? "USER_CONFIRMS_CURRENT_CANDIDATE" as const
        : "USER_REFUSES_CURRENT_CANDIDATE" as const,
      evidenceRefs,
    });
  }
  const contextualDecision = contextualCandidateDecision(clauses, input.referentContext);
  if (input.referentContext.decisionScope && !input.referentContext.decisionScope.presented
    && (contextualDecision || candidateDecision(clauses))) return Object.freeze({
    kind: "CLARIFY_CANDIDATE_REFERENCE", evidenceRefs: Object.freeze([]), clarificationReason: "DECISION_SCOPE",
  });
  const decision = contextualDecision === "CLARIFY" ? input.referentContext.decisionScope ? null : candidateDecision(clauses)
    : contextualDecision ?? candidateDecision(clauses);
  if (!decision && contextualDecision === "CLARIFY") return Object.freeze({
    kind: "CLARIFY_CANDIDATE_REFERENCE", evidenceRefs: Object.freeze([]), clarificationReason: "DECISION_SCOPE",
  });
  if (decision && (input.referentContext.resolution !== "UNIQUE_CURRENT"
    || !input.referentContext.candidateRef || !input.referentContext.sourceTurnRef || !input.referentContext.sourceDigest)) {
    return Object.freeze({ kind: "CLARIFY_CANDIDATE_REFERENCE", evidenceRefs: Object.freeze([]) });
  }
  if (decision && input.referentContext.resolution === "UNIQUE_CURRENT") {
    const decisionEvidence = Object.freeze([
      input.referentContext.candidateRef,
      input.referentContext.sourceTurnRef,
    ].filter((ref): ref is string => Boolean(ref)));
    if (decision === "CONFIRM") return Object.freeze({
      kind: "USER_CONFIRMS_CURRENT_CANDIDATE",
      evidenceRefs: decisionEvidence,
    });
    if (decision === "REFUSE") return Object.freeze({
      kind: "USER_REFUSES_CURRENT_CANDIDATE",
      evidenceRefs: decisionEvidence,
    });
  }
  const asksToExplain = /^(?:explique|expliquez|expliquer|discutons|discuter)\b/u.test(normalized);
  const hasDeicticReference = /\b(?:ce|cet|cette|ces|celui|celle|ceux|celles)\b/u.test(normalized);
  if (asksToExplain && hasDeicticReference) return Object.freeze({
    kind: "EXPLAIN_REFERENCED_CONTENT",
    evidenceRefs: Object.freeze([input.referentContext.candidateRef, input.referentContext.sourceTurnRef].filter((ref): ref is string => Boolean(ref))),
  });
  if (clauses.some(requestsAssistedProposal)) return Object.freeze({
    kind: "USER_REQUESTS_ASSISTED_PROPOSAL",
    evidenceRefs: Object.freeze([]),
  });
  return undefined;
};

export const requestsScientificExplanation = (raw: string) => {
  const text = raw.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr-FR").replace(/[’']/gu, " ");
  if (/\b(?:redaction|formulation|tournure|francais|mots)\b/u.test(text)
    && /\b(?:juste|seulement)\b/u.test(text) && !/\b(?:explique|expliquez|pourquoi)\b/u.test(text)) return false;
  // An invitation to discuss is a current request. A participle or a reference
  // to what was discussed previously does not create another Knowledge call.
  return /\b(?:pourquoi|explique\w*|distinguer|difference|arguments|qu est ce qui|compren\w*|comprends?|parlons|discutons|discutez|hypothese de discussion)\b/u.test(text)
    || /\b(?:je|nous) (?:voudrais|voudrions|souhaite|souhaitons|veux|voulons) (?:en )?(?:parler|discuter)\b/u.test(text);
};

export const requestsOwnerProposalExplanation = (raw: string) => requestsScientificExplanation(raw)
  && /\b(?:premier\w*|deuxieme|troisieme|proposition\w*|alternatives?|ces hypotheses|cette hypothese)\b/u
    .test(raw.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr-FR"));

/** A reference to what is displayed now cannot resolve through an older owner card. */
export const requiresCurrentOwnerPresentation = (raw: string) => requestsOwnerProposalExplanation(raw)
  || /\b(?:ces (?:options|propositions|alternatives)|(?:tu viens|vous venez) (?:de|d') (?:donner|afficher|presenter|proposer)|(?:tu viens|vous venez) d'(?:afficher))\b/u
    .test(raw.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr-FR").replace(/[’]/gu, "'"));

/** Read-only Project/lifecycle projection. A user's recall is not authority. */
export const buildCurrentProjectDecisionReadback = (input: {
  raw: string;
  project: Readonly<ResearchProjectOwnerProjection>;
  retained: readonly RetainedContributionCandidate[];
}): { text: string; sourceRefs: string[] } | null => {
  const text = input.raw.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr-FR");
  if (!/\b(?:rappelle\w*|redire|retenu\w*|statut|ce qui a change|n a pas bouge|restes? inchanges?|toujours|delais? est vise|par rapport a quoi)\b/u.test(text)) return null;
  const sections = /\b(?:population|age|exclusion|renal)\w*/u.test(text) ? ["POPULATION"]
    : /\b(?:composite|deces|critere)\w*/u.test(text) ? ["MEASUREMENTS"]
      : /\b(?:randomisation|unite)\w*/u.test(text) ? ["DESIGN", "POPULATION"]
        : /\b(?:semaine|delai|tardive|relecture|injection|infarctus)\w*/u.test(text) ? ["TEMPORALITY", "IMAGING", "MEASUREMENTS", "ANALYSIS"] : [];
  const relevant = input.project.sections.filter((section) => !sections.length || sections.includes(section.sectionId));
  const current = relevant.flatMap((section) => section.elements.map((element) => ({
    ref: element.elementId, text: `${section.label} : ${element.content}`,
  })));
  const history = input.retained.filter((record) => record.humanDecision
    && (record.baseProject?.projectId === input.project.projectId || record.baseProject === null))
    .flatMap((record) => {
      const items = record.candidate.humanReviewProjection.sections.flatMap((section) => section.items)
        .filter((item) => !sections.length || Boolean(item.projectSectionId && sections.includes(item.projectSectionId)))
        .map((item) => item.content);
      return items.length ? [{ ref: record.humanDecision!.decisionId,
        text: `${record.humanDecision!.status === "ADOPTED" ? "Confirmation historique (ne remplace pas l’état courant ci-dessus)" : "Proposition refusée, sans adoption"} : ${items.join(" ; ")}` }] : [];
    });
  return {
    text: ["État effectivement retenu dans la version courante du projet :",
      ...current.map((item) => `– ${item.text}`),
      history.length ? "Historique des décisions explicites pertinentes :" : null,
      ...history.map((item) => `– ${item.text}`),
      "Les informations absentes restent inconnues. Ce rappel n’applique aucune modification et ne transforme pas une proposition discutée en décision.",
    ].filter(Boolean).join("\n"),
    sourceRefs: [input.project.versionId, input.project.projectDigest, ...current.map((item) => item.ref), ...history.map((item) => item.ref)],
  };
};

const snapshotReasons = (entry: Readonly<ProductOwnerResultLedgerEntry>, snapshot: Readonly<ProjectContextSnapshot>) => {
  const result = entry.result;
  if (!result) return ["OWNER_RESULT_MISSING"];
  return [
    ...(result.sourceProjectRef === snapshot.sourceProjectRef && entry.request.sourceProject.sourceProjectRef === snapshot.sourceProjectRef ? [] : ["OTHER_PROJECT_RESULT"]),
    ...(result.sourceProjectVersion === snapshot.sourceProjectVersion && entry.request.sourceProject.sourceProjectVersion === snapshot.sourceProjectVersion ? [] : ["PROJECT_VERSION_CHANGED"]),
    ...(result.sourceProjectDigest === snapshot.sourceProjectDigest && entry.request.sourceProject.sourceProjectDigest === snapshot.sourceProjectDigest ? [] : ["PROJECT_DIGEST_CHANGED"]),
    ...(result.sourceSnapshotDigest === snapshot.snapshotDigest && entry.request.sourceProject.snapshotDigest === snapshot.snapshotDigest ? [] : ["SNAPSHOT_DIGEST_CHANGED"]),
  ];
};

const dependencyReasons = (
  entry: Readonly<ProductOwnerResultLedgerEntry>,
  ledger: Readonly<ProductOwnerResultLedger>,
  snapshot: Readonly<ProjectContextSnapshot>,
  excludedResultRefs: ReadonlySet<string>,
  visited = new Set<string>(),
): string[] => {
  if (visited.has(entry.entryId)) return ["OWNER_DEPENDENCY_CYCLE"];
  const nextVisited = new Set([...visited, entry.entryId]);
  return entry.dependencies.flatMap((dependency) => {
    const retained = ledger.entries.find((candidate) => candidate.result?.owner === dependency.owner
      && candidate.result.resultId === dependency.resultId
      && candidate.result.resultVersion === dependency.resultVersion
      && ownerResultNativeDigest(candidate.result) === dependency.nativeResultDigest);
    if (!retained || excludedResultRefs.has(dependency.resultId)) return ["OWNER_DEPENDENCY_NOT_CURRENT"];
    return [...snapshotReasons(retained, snapshot), ...dependencyReasons(retained, ledger, snapshot, excludedResultRefs, nextVisited)];
  });
};

/**
 * Pure projection from exact current bindings. It records no candidate, does not
 * invoke an owner, and cannot reinterpret the candidate as an adopted Project.
 * The bounded owner adapter currently consumes the already governed RDE output.
 */
export const buildCurrentNavigationEvidence = (input: {
  sourceTurnRef: string;
  sourceText: string;
  currentProject: Readonly<ResearchProjectOwnerProjection> | null;
  validatedCandidate?: Readonly<RetainedContributionCandidate> | null;
  ownerResultLedger?: Readonly<ProductOwnerResultLedger> | null;
  activeOwnerResultRefs?: readonly CurrentNavigationOwnerResultRef[];
  closedBranchRefs?: readonly string[];
  resolvedNeedRefs?: readonly string[];
  invalidatedSourceTurnRefs?: readonly string[];
  currentProjectImpact?: Readonly<CurrentProjectImpactProjection> | null;
}): CurrentNavigationEvidence => {
  const sourceState = emptyState();
  const snapshot = input.currentProject ? buildProjectContextSnapshot({ project: input.currentProject }) : null;
  const adoptedProject: ProjectBinding | null = snapshot ? {
    projectId: snapshot.sourceProjectRef, versionId: snapshot.sourceProjectVersion,
    projectDigest: snapshot.sourceProjectDigest, snapshotDigest: snapshot.snapshotDigest,
  } : null;
  const closedBranchRefs = unique(input.closedBranchRefs ?? []);
  const resolvedNeedRefs = unique(input.resolvedNeedRefs ?? []);
  const excludedReferences: { ref: string; reason: string }[] = [];
  let candidate: CurrentNavigationEvidence["candidate"] = null;
  const record = input.validatedCandidate;
  if (record) {
    const baseProject = adoptedProject ? {
      projectId: adoptedProject.projectId, versionId: adoptedProject.versionId, projectDigest: adoptedProject.projectDigest,
    } : null;
    const reasons = [
      ...(record.actuality === "CURRENT" && !record.humanDecision ? [] : ["CANDIDATE_NOT_CURRENT_NON_ADOPTED"]),
      ...(record.validation.valid && !record.validation.blocks.length && record.validatorRef ? [] : ["VALIDATED_CANDIDATE_REQUIRED"]),
      ...(record.candidate.status === "CANDIDATE_PENDING_HUMAN_CONFIRMATION" ? [] : ["CANDIDATE_NOT_NAVIGABLE"]),
      ...(record.sourceTurnRef === input.sourceTurnRef && record.sourceDigest === logicalDigest(input.sourceText) ? [] : ["CANDIDATE_SOURCE_TURN_MISMATCH"]),
      ...((input.invalidatedSourceTurnRefs ?? []).includes(record.sourceTurnRef) ? ["CANDIDATE_SOURCE_INVALIDATED"] : []),
      ...(same(record.baseProject, baseProject) ? [] : ["CANDIDATE_BASE_PROJECT_CHANGED"]),
      ...(same(record.candidateDigest, logicalDigest({ contribution: record.contribution, candidate: record.candidate })) ? [] : ["CANDIDATE_DIGEST_CHANGED"]),
      ...(record.dependencyBindings.every((dependency) => dependency.actuality === "CURRENT") ? [] : ["CANDIDATE_DEPENDENCY_NOT_CURRENT"]),
    ];
    if (reasons.length) reasons.forEach((reason) => excludedReferences.push({ ref: record.candidateRef, reason }));
    else {
      const changes = record.candidate.canonicalChangeSet;
      candidate = structuredClone({
        ref: record.candidateRef, digest: record.candidateDigest,
        contributionDigest: record.contribution.identity.contributionDigest,
        sourceTurnRef: record.sourceTurnRef, baseProject: record.baseProject,
        status: "VALIDATED_NON_ADOPTED_CANDIDATE" as const,
        objectChanges: changes.objectChanges, relationChanges: changes.relationChanges,
        temporalQualificationChanges: changes.temporalQualificationChanges,
        expectedVariableOccasionChanges: changes.expectedVariableOccasionChanges,
        conflicts: changes.conflicts, dependencyBindings: record.dependencyBindings,
        validatorRef: record.validatorRef, projectWriteAuthorized: false as const,
      });
    }
  }

  const impact = input.currentProjectImpact;
  if (impact) {
    const impactReasons = [
      ...(adoptedProject
        && impact.sourceProject.projectId === adoptedProject.projectId
        && impact.sourceProject.projectVersion === adoptedProject.versionId
        && impact.sourceProject.projectDigest === adoptedProject.projectDigest ? [] : ["CURRENT_PROJECT_IMPACT_PROJECT_BINDING_CHANGED"]),
      ...(candidate
        && impact.sourceCandidate.candidateRef === candidate.ref
        && impact.sourceCandidate.candidateDigest === candidate.digest
        && impact.sourceCandidate.sourceTurnRef === candidate.sourceTurnRef ? [] : ["CURRENT_PROJECT_IMPACT_CANDIDATE_BINDING_CHANGED"]),
      ...(impact.owner === "QUERY_NAVIGATION" && impact.projectionOnly === true
        && impact.sourceOfTruth === false && impact.projectWriteAuthorized === false ? [] : ["CURRENT_PROJECT_IMPACT_BOUNDARY_INVALID"]),
    ];
    if (impactReasons.length) impactReasons.forEach((reason) => excludedReferences.push({ ref: impact.projectionId, reason }));
    else sourceState.governedNeeds.push(structuredClone(impact.qryNeed));
  }

  const ownerResults: CurrentNavigationEvidence["ownerResults"][number][] = [];
  const ledger = input.ownerResultLedger ? rehydrateProductOwnerResultLedger(input.ownerResultLedger) : null;
  const excludedResultRefs = new Set((input.activeOwnerResultRefs ?? [])
    .filter((ref) => ref.disposition !== "ACTIVE" || ref.applicability !== "APPLICABLE").map((ref) => ref.resultId));
  const currentProjectRefs = new Set(snapshot ? [
    ...snapshot.objects.flatMap((object) => [object.stableId, object.versionRef]),
    ...snapshot.relations.flatMap((relation) => [relation.stableId, relation.versionRef]),
  ] : []);
  for (const selected of [...(input.activeOwnerResultRefs ?? [])].sort((a, b) => a.resultId.localeCompare(b.resultId) || a.resultVersion.localeCompare(b.resultVersion))) {
    const reject = (reason: string) => excludedReferences.push({ ref: selected.resultId, reason });
    if (selected.disposition !== "ACTIVE") { reject(`OWNER_RESULT_${selected.disposition}`); continue; }
    if (selected.applicability !== "APPLICABLE") { reject("OWNER_RESULT_NOT_APPLICABLE_OR_UNKNOWN"); continue; }
    if (!snapshot) { reject("PROJECT_BOUND_OWNER_RESULT_REQUIRES_ADOPTED_PROJECT"); continue; }
    if (!selected.scopeRefs.some((ref) => currentProjectRefs.has(ref))) { reject("OWNER_RESULT_NO_CURRENT_SCOPE_REF"); continue; }
    const entry = ledger?.entries.find((item) => item.result?.owner === selected.owner
      && item.result.resultId === selected.resultId && item.result.resultVersion === selected.resultVersion
      && ownerResultNativeDigest(item.result) === selected.resultDigest);
    if (!entry?.result || !ledger) { reject("OWNER_RESULT_EXACT_BINDING_NOT_FOUND"); continue; }
    const reasons = [...snapshotReasons(entry, snapshot), ...dependencyReasons(entry, ledger, snapshot, excludedResultRefs)];
    if (reasons.length) { reasons.forEach(reject); continue; }
    if (!["COMPLETED", "COMPLETED_WITH_LIMITATIONS"].includes(entry.result.status)) { reject("OWNER_RESULT_NOT_COMPLETED"); continue; }
    if (entry.result.owner !== "STUDY_DESIGN") { reject("OWNER_RESULT_OUTSIDE_BOUNDED_ADAPTER"); continue; }
    const payload = entry.result.nativePayload as StudyDesignProposalContribution | null;
    if (!payload || payload.contract !== "STUDY_DESIGN_PROPOSAL_CONTRIBUTION"
      || payload.owner !== "STUDY_DESIGN" || payload.validation.status !== "PASS"
      || payload.projectWriteAuthorized !== false || payload.candidateIsAdopted !== false
      || payload.sourceProject.snapshotDigest !== snapshot.snapshotDigest) { reject("OWNER_NATIVE_CONTRACT_NOT_APPLICABLE"); continue; }
    const needs = payload.informationNeeds.filter((need) => need.status === "OPEN_NOT_RESOLVED"
      && need.intendedResolutionPath === "FUTURE_QRY_HANDOFF" && need.sourceRefs.length && need.reason.trim() && need.question.trim());
    // No abstract UNKNOWN-only question. A sourced owner has explicitly supplied
    // both the information need and why it changes the current design reasoning.
    const activeNeeds = needs.filter((need) => !resolvedNeedRefs.includes(need.needId)
      && !selected.scopeRefs.some((ref) => closedBranchRefs.includes(ref)));
    if (!activeNeeds.length && !payload.options.length && !payload.tradeOffs.length) { reject("OWNER_RESULT_NO_ACTIVE_NAVIGATION_CONTENT"); continue; }
    ownerResults.push(structuredClone({
      owner: entry.result.owner, ref: entry.result.resultId, version: entry.result.resultVersion,
      digest: selected.resultDigest, snapshotDigest: entry.result.sourceSnapshotDigest,
      scopeRefs: unique(selected.scopeRefs), sourceRefs: unique([...entry.result.evidenceRefs, ...entry.result.provenance, ...payload.provenanceRefs]),
      dependencyRefs: unique(entry.dependencies.map((dependency) => `${dependency.owner}:${dependency.resultId}@${dependency.resultVersion}:${dependency.nativeResultDigest}`)),
      limitations: unique([...entry.result.limitations, ...payload.limitations]),
      options: payload.options, tradeOffs: payload.tradeOffs,
      epistemicStatus: payload.epistemicStatus, humanDecisionRequired: true as const,
    }));
    for (const need of activeNeeds) sourceState.governedNeeds.push({
      needId: need.needId, sourceRef: entry.result.resultId,
      sourceType: "DOMAIN_READINESS", sourceVersion: `${entry.result.resultVersion}:${selected.resultDigest}`,
      sourceObjectKind: "StudyDesignInformationNeed", owner: entry.result.owner,
      informationIntent: need.question, affectedDecisionRefs: [], affectedBranchRefs: unique(selected.scopeRefs),
      blocking: "UNKNOWN", actionability: "USER_ANSWERABLE", status: "OPEN",
      availableFromOwner: need.targetOwner, knownOptions: [],
      provenance: { sourceRefs: unique([entry.result.resultId, need.needId, ...need.sourceRefs]), owner: entry.result.owner,
        evidence: [need.question, need.reason], limitations: unique([...entry.result.limitations, ...payload.limitations]) },
      limitations: ["CURRENT_OWNER_INFORMATION_NEED_NOT_ADOPTED_PROJECT_UNKNOWN", "OWNER_REASON_IS_A_GOVERNED_CLAIM_NOT_INDEPENDENT_SCIENTIFIC_PROOF"],
      projectionOnly: true, sourceOfTruth: false, projectWriteAuthorized: false,
    });
    for (const tradeOff of payload.tradeOffs.filter((item) => item.decisionRequired && item.optionRefs.length > 1)) {
      const options = payload.options.filter((option) => tradeOff.optionRefs.includes(option.optionId));
      if (options.length !== tradeOff.optionRefs.length || closedBranchRefs.some((ref) => selected.scopeRefs.includes(ref))
        || resolvedNeedRefs.includes(tradeOff.tradeOffId)) continue;
      sourceState.governedNeeds.push({
        needId: tradeOff.tradeOffId, sourceRef: entry.result.resultId,
        sourceType: "DOMAIN_READINESS", sourceVersion: `${entry.result.resultVersion}:${selected.resultDigest}`,
        sourceObjectKind: "StudyDesignTradeOff", owner: "STUDY_DESIGN",
        informationIntent: options.map((option) => option.label).join(" / "),
        affectedDecisionRefs: [tradeOff.tradeOffId], affectedBranchRefs: unique(selected.scopeRefs),
        blocking: "UNKNOWN", actionability: "HUMAN_EXPERT_REVIEW", status: "OPEN",
        availableFromOwner: "STUDY_DESIGN", knownOptions: [...tradeOff.optionRefs],
        provenance: { sourceRefs: unique([entry.result.resultId, tradeOff.tradeOffId, ...tradeOff.optionRefs, ...options.flatMap((option) => option.provenanceRefs)]),
          owner: "STUDY_DESIGN", evidence: [...tradeOff.gains, ...tradeOff.losses], limitations: [...payload.limitations] },
        limitations: ["OWNER_TRADEOFF_DECISION_REQUIRED_NOT_AUTOMATICALLY_ADOPTED"],
        projectionOnly: true, sourceOfTruth: false, projectWriteAuthorized: false,
      });
    }
  }
  sourceState.governedNeeds.sort((left, right) => left.sourceRef.localeCompare(right.sourceRef) || left.needId.localeCompare(right.needId));
  const alreadyProvidedInformationRefs = unique([
    ...(candidate?.objectChanges.flatMap((change) => change.candidate && change.candidate.epistemicState !== "UNKNOWN"
      ? [change.changeRef, ...change.candidate.sourceItemRefs] : []) ?? []),
    ...(snapshot?.objects.filter((object) => object.epistemicState === "KNOWN").map((object) => object.stableId) ?? []),
  ]);
  const material = { owner: "QUERY_NAVIGATION" as const,
    currentTurn: { ref: input.sourceTurnRef, sourceDigest: logicalDigest(input.sourceText) },
    candidate, adoptedProject, ownerResults, sourceState, alreadyProvidedInformationRefs, closedBranchRefs, resolvedNeedRefs,
    projectionOnly: true as const, sourceOfTruth: false as const, projectWriteAuthorized: false as const };
  return { ...material, excludedReferences, contextDigest: queryNavigationDigest(material) };
};

export const currentNavigationEvidenceRef = (evidence: CurrentNavigationEvidence) => makeQueryNavigationId("current-navigation-evidence", { digest: evidence.contextDigest });

const currentStudyDesignDecisionSupport = (input: {
  project: Readonly<ResearchProjectOwnerProjection>;
  navigation: Readonly<import("./functional-reset-progression").FunctionalResetQueryNavigation>;
  ownerResultLedger?: Readonly<ProductOwnerResultLedger> | null;
}): Readonly<{
  authorizedContent: readonly GovernedRealizationContent[];
  requiredContentRefs: readonly string[];
  requiredVisibleObligations: readonly GovernedVisibleObligation[];
}> | null => {
  const selected = input.navigation.selection.selected;
  if (selected?.actionCategory !== "COMPARE_OPTIONS" || !input.ownerResultLedger) return null;
  const sourceRefs = input.navigation.selection.needs
    .filter((need) => selected.navigationNeedRefs.includes(need.needId))
    .map((need) => need.sourceRef);
  if (new Set(sourceRefs).size !== 1) return null;
  const sourceRef = sourceRefs[0];
  const ledger = rehydrateProductOwnerResultLedger(input.ownerResultLedger);
  const entry = ledger.entries.find((item) => item.result?.owner === "STUDY_DESIGN"
    && item.result.resultId === sourceRef);
  const result = entry?.result;
  const payload = result?.nativePayload as StudyDesignProposalContribution | null | undefined;
  if (!result || !payload || payload.contract !== "STUDY_DESIGN_PROPOSAL_CONTRIBUTION"
    || payload.validation.status !== "PASS" || payload.projectWriteAuthorized !== false
    || payload.candidateIsAdopted !== false || payload.sourceProject.projectId !== input.project.projectId
    || payload.sourceProject.projectVersion !== input.project.versionId
    || payload.sourceProject.projectDigest !== input.project.projectDigest
    || result.sourceProjectRef !== input.project.projectId || result.sourceProjectVersion !== input.project.versionId
    || result.sourceProjectDigest !== input.project.projectDigest
    || !selected.sourceRefs.includes(result.resultId) || !ownerResultNativeDigest(result)) return null;
  const options = payload.options.filter((option) => selected.knownOptionRefs.includes(option.optionId));
  if (options.length !== selected.knownOptionRefs.length || options.length < 2) return null;
  const optionContent = options.map((option): GovernedRealizationContent => ({
    ref: option.optionId,
    text: [
      `Option : ${option.label}.`, option.conciseDescription,
      `Justification : ${option.rationale.statement}.`,
      option.advantages.length ? `Avantages : ${option.advantages.join(" ; ")}.` : "",
      option.limitations.length ? `Limites : ${option.limitations.join(" ; ")}.` : "",
      option.prerequisites.length ? `Prérequis : ${option.prerequisites.join(" ; ")}.` : "",
      option.consequences.length ? `Conséquences : ${option.consequences.join(" ; ")}.` : "",
    ].filter(Boolean).join(" "),
    status: option.epistemicStatus,
  }));
  const tradeOff = payload.tradeOffs.find((item) => item.decisionRequired
    && item.optionRefs.length === options.length && item.optionRefs.every((ref) => selected.knownOptionRefs.includes(ref)));
  const tradeOffContent: GovernedRealizationContent[] = tradeOff ? [{
    ref: tradeOff.tradeOffId,
    text: "Le choix met en balance les avantages et les limites propres à chaque option.",
    status: payload.epistemicStatus,
  }] : [];
  // The first owner limitation is the primary interpretation boundary. Later
  // control summaries remain available in the OwnerResult but are not recited.
  const primaryLimitation: GovernedRealizationContent[] = payload.limitations[0] ? [{
    ref: `${payload.proposalId}:limitation:1`, text: payload.limitations[0], status: payload.epistemicStatus,
  }] : [];
  const authorizedContent = [...optionContent, ...tradeOffContent, ...primaryLimitation];
  const obligations: GovernedVisibleObligation[] = options.flatMap((option) => [
    { obligationId: `${option.optionId}:identity`, sourceRef: option.optionId, role: "OPTION_IDENTITY", exactText: option.label },
    { obligationId: `${option.optionId}:discriminant`, sourceRef: option.optionId, role: "OPTION_DISCRIMINANT", exactText: option.conciseDescription || option.rationale.statement },
    ...(option.limitations[0] ? [{ obligationId: `${option.optionId}:material-limit`, sourceRef: option.optionId,
      role: "MATERIAL_LIMIT" as const, exactText: option.limitations[0] }] : []),
  ]);
  if (payload.limitations[0]) obligations.push({
    obligationId: `${payload.proposalId}:global-material-limit`, sourceRef: `${payload.proposalId}:limitation:1`,
    role: "MATERIAL_LIMIT", exactText: payload.limitations[0],
  });
  if (tradeOffContent[0]) obligations.push({
    obligationId: `${tradeOffContent[0].ref}:decision-tradeoff`, sourceRef: tradeOffContent[0].ref,
    role: "DECISION_TRADEOFF", exactText: tradeOffContent[0].text,
  });
  obligations.push({
    obligationId: `${payload.proposalId}:human-decision-boundary`, sourceRef: result.resultId,
    role: "HUMAN_DECISION_BOUNDARY", exactText: "Aucune option n’est adoptée ; la décision vous revient.",
  });
  return Object.freeze({
    authorizedContent: Object.freeze(authorizedContent),
    requiredContentRefs: Object.freeze(options.map((item) => item.optionId)),
    requiredVisibleObligations: Object.freeze(obligations),
  });
};

/** Bounded HOW transport of an action already selected by QRY. */
export const currentGovernedNavigationInput = (input: {
  project: Readonly<ResearchProjectOwnerProjection>;
  navigation: Readonly<import("./functional-reset-progression").FunctionalResetQueryNavigation> | null;
  ownerResultLedger?: Readonly<ProductOwnerResultLedger> | null;
}): import("./current-turn-navigation").CurrentGovernedNavigationInput | undefined => {
  const navigation = input.navigation;
  const selected = navigation?.selection.selected;
  const action = navigation?.currentAction;
  if (!navigation || !selected || !action || navigation.projectRef !== input.project.projectId
    || navigation.projectVersion !== input.project.versionId || navigation.projectDigest !== input.project.projectDigest
    || action.actionCandidateRef !== selected.candidateId) return undefined;
  const snapshot = buildProjectContextSnapshot({ project: input.project });
  const scope = new Set([selected.targetRef, ...selected.sourceRefs, ...selected.affectedBranchRefs, ...selected.knownOptionRefs]);
  const decisionSupport = currentStudyDesignDecisionSupport({
    project: input.project, navigation, ownerResultLedger: input.ownerResultLedger,
  });
  const authorizedContent = decisionSupport?.authorizedContent ?? [
    { ref: selected.targetRef,
      text: currentQuestionTargetText(navigation.standardQuestion?.text ?? selected.explanation), status: null },
    ...snapshot.objects.filter((object) => scope.has(object.stableId) || scope.has(object.versionRef))
      .map((object) => ({ ref: object.stableId, text: object.content, status: object.epistemicState })),
  ];
  return {
    projectId: input.project.projectId, projectVersion: input.project.versionId, projectDigest: input.project.projectDigest,
    selectedActionRef: action.selectedActionId, sourceStateDigest: navigation.sourceStateDigest,
    selected: structuredClone(selected), authorizedContent,
    ...(decisionSupport ? {
      requiredContentRefs: decisionSupport.requiredContentRefs,
      requiredVisibleObligations: decisionSupport.requiredVisibleObligations,
    } : {}),
    informationNeedScopes: navigation.selection.needs
      .filter((need) => selected.navigationNeedRefs.includes(need.needId))
      .map((need) => ({ needRef: need.needId, sourceRef: need.sourceRef,
        affectedBranchRefs: [...need.affectedBranchRefs] })),
    alreadyProvidedInformationRefs: snapshot.objects.filter((object) => object.epistemicState === "KNOWN")
      .flatMap((object) => [object.stableId, object.versionRef]),
  };
};
