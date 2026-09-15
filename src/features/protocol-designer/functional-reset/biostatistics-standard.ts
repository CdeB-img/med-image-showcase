import type { BiostatisticsReasoningResult } from "@/features/data-analysis-planning";
import { logicalDigest } from "@/features/knowledge-engine";
import type { FunctionalResetQueryNavigation } from "@/features/query-navigation";
import {
  canonicalizeScientificContribution,
  type ScientificInterpretationContributionEnvelope,
  type ScientificInterpretationTurn,
} from "@/features/scientific-interpretation";
import {
  buildProjectContextSnapshot,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import { invokeBiostatisticsForProjectSnapshot } from "@/features/protocol-designer/product-biostatistics-owner-runtime";
import type { ProductOwnerResultLedger } from "@/features/protocol-designer/product-owner-result-ledger";
import {
  createScientificRunTraceRecorder,
  type ScientificExecutionTraceLedger,
} from "@/features/protocol-designer/scientific-execution-trace";

export const STANDARD_BIOSTATISTICS_INTERACTION_VERSION = "1.0.0" as const;

export type StandardBiostatisticsOptionPresentation = {
  optionRef: string;
  label: string;
  rationale: string;
  prerequisites: readonly string[];
  assumptions: readonly string[];
  tradeOffs: readonly string[];
};

export type StandardBiostatisticsPresentation = {
  presentationId: string;
  resultRef: string;
  title: string;
  introduction: string;
  options: readonly StandardBiostatisticsOptionPresentation[];
  informationNeeds: readonly string[];
  limitations: readonly string[];
  plainText: string;
};

export type StandardBiostatisticsInteraction = {
  contract: "FUNCTIONAL_RESET_BIOSTATISTICS_INTERACTION";
  contractVersion: typeof STANDARD_BIOSTATISTICS_INTERACTION_VERSION;
  owner: "BIOSTATISTICS";
  capabilityId: "BIOSTATISTICS_PLANNING";
  ownerResultRef: string;
  ownerResultVersion: string;
  sourceActionRef: string;
  sourceProjectRef: string;
  sourceProjectVersion: string;
  sourceProjectDigest: string;
  presentationTurnRef: string;
  traceRunId: string | null;
  status: "ACTIVE" | "PENDING_HUMAN_REVIEW" | "ADOPTED" | "REJECTED" | "STALE";
  selectedStrategyRef: string | null;
  pendingContributionRef: string | null;
  adoptedProjectVersion: string | null;
  staleReason: string | null;
  projectWriteAuthorized: false;
};

export type BiostatisticsConversationResolution =
  | { kind: "SELECT_STRATEGY"; strategyRef: string }
  | { kind: "DISCUSS"; response: string }
  | { kind: "DEFER"; response: string }
  | { kind: "FALLTHROUGH" };

const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
const folded = (value: string) => value.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr-FR").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export const isBiostatisticsQueryDispatch = (navigation: Readonly<FunctionalResetQueryNavigation>) => {
  const action = navigation.currentAction;
  const selected = navigation.selection.selected;
  return Boolean(action
    && action.owner === "BIOSTATISTICS"
    && action.affectedDecisionRefs.length === 1
    && action.affectedDecisionRefs[0] === "project-section:ANALYSIS"
    && action.affectedBranchRefs.includes("project-facet:ANALYSIS:ANALYSIS_OBJECTIVE")
    && selected?.capabilityRef === "BIOSTATISTICS_PLANNING"
    && navigation.projectVersion === action.projectVersion);
};

export const buildStandardBiostatisticsPresentation = (
  result: Readonly<BiostatisticsReasoningResult>,
): StandardBiostatisticsPresentation => {
  const options = result.methodCandidates.map((method) => ({
    optionRef: method.strategyRef,
    label: method.label,
    rationale: method.rationale,
    prerequisites: unique(method.prerequisites),
    assumptions: unique(method.assumptions),
    tradeOffs: unique(method.tradeOffs),
  }));
  const informationNeeds = unique(result.informationNeeds
    .filter((item) => item.targetOwner !== "DATA_MANAGEMENT")
    .map((item) => `${item.informationNeeded} — ${item.scientificReason}`));
  const limitations = unique(result.limitations.filter((item) => !/AnalysisExecution|AnalysisResult|Project/i.test(item)));
  const introduction = options.length > 1
    ? "Plusieurs stratégies analytiques restent défendables. Elles sont conservées comme alternatives : aucune n’est sélectionnée ni ajoutée au projet."
    : options.length === 1
      ? "Une stratégie analytique est cohérente avec la structure actuellement adoptée, mais son modèle exact et ses hypothèses restent à qualifier."
      : "Le contexte ne permet pas encore de construire une stratégie analytique crédible sans redéfinir en aval la question, l’endpoint ou les variables.";
  const plainText = result.scopeExplanation ?? [
    introduction,
    ...options.map((option, index) => [
      `${options.length > 1 ? `Option ${index + 1} — ` : ""}${option.label}`,
      option.rationale,
      option.prerequisites.length ? `Prérequis : ${option.prerequisites.join(" ; ")}` : null,
      option.assumptions.length ? `Hypothèses à vérifier : ${option.assumptions.join(" ; ")}` : null,
      option.tradeOffs[0] ? `Arbitrage : ${option.tradeOffs[0]}` : null,
    ].filter(Boolean).join("\n")),
    informationNeeds.length ? `Informations encore nécessaires\n${informationNeeds.map((item) => `– ${item}`).join("\n")}` : null,
    result.dimensioningCalculation
      ? `Dimensionnement calculable sous les seules hypothèses explicitement sourcées : ${result.dimensioningCalculation.totalSampleSize} participants au total. Ce résultat reste un candidat à examiner.`
      : "Aucun effectif n’est calculé tant que les hypothèses numériques nécessaires ne sont pas explicitement sourcées.",
    options.length ? "Vous pouvez discuter ces options ou en retenir une pour revue humaine." : null,
  ].filter((value): value is string => Boolean(value)).join("\n\n");
  return {
    presentationId: `biostatistics-standard-presentation:${logicalDigest({ result: result.resultId, digest: result.resultDigest })}`,
    resultRef: result.resultId,
    title: options.length ? "Stratégie analytique à discuter" : "Analyse à préciser",
    introduction: result.scopeExplanation ?? introduction,
    options,
    // The scoped native explanation already specifies the usable next action.
    // Other downstream needs remain in the native result, not a competing
    // questionnaire about sample size or data management in this discussion.
    informationNeeds: result.scopeExplanation ? [] : informationNeeds,
    limitations,
    plainText,
  };
};

export const readBiostatisticsResultFromLedger = (input: {
  ledger: Readonly<ProductOwnerResultLedger>;
  resultRef: string;
}): Readonly<BiostatisticsReasoningResult> | null => {
  const result = [...input.ledger.entries].reverse().find((entry) => entry.result?.resultId === input.resultRef
    && entry.request.owner === "BIOSTATISTICS"
    && entry.request.capabilityId === "BIOSTATISTICS_PLANNING")?.result;
  const payload = result?.nativePayload as BiostatisticsReasoningResult | null | undefined;
  return payload?.contract === "BIOSTATISTICS_REASONING_RESULT"
    && payload.owner === "BIOSTATISTICS"
    && payload.projectWriteAuthorized === false
    && payload.analysisExecutionCreated === false
    && payload.analysisResultCreated === false
    ? payload
    : null;
};

export const dispatchBiostatisticsFromQuery = (input: {
  project: Readonly<ResearchProjectOwnerProjection>;
  navigation: Readonly<FunctionalResetQueryNavigation>;
  ownerResultLedger: Readonly<ProductOwnerResultLedger>;
  traceLedger: Readonly<ScientificExecutionTraceLedger>;
  sessionId: string;
  conversationId: string;
  presentationTurnRef: string;
  startedAt: string;
  completedAt: string;
  traceEnabled?: boolean;
}) => {
  if (!isBiostatisticsQueryDispatch(input.navigation)) throw new Error("QRY_ACTION_NOT_OWNED_BY_BIOSTATISTICS");
  if (input.navigation.projectRef !== input.project.projectId
    || input.navigation.projectVersion !== input.project.versionId
    || input.navigation.projectDigest !== input.project.projectDigest) throw new Error("QRY_BIOSTATISTICS_PROJECT_BINDING_STALE");
  const snapshot = buildProjectContextSnapshot({ project: input.project });
  const traceRunId = input.traceEnabled === false ? null : `scientific-biostatistics-trace:${logicalDigest({
    sessionId: input.sessionId,
    conversationId: input.conversationId,
    action: input.navigation.currentAction!.selectedActionId,
    projectVersion: input.project.versionId,
    projectDigest: input.project.projectDigest,
    startedAt: input.startedAt,
  })}`;
  const trace = traceRunId ? createScientificRunTraceRecorder({
    ledger: input.traceLedger,
    runId: traceRunId,
    projectSnapshot: snapshot,
    initiatorContext: { kind: "EXPLICIT_PRODUCT_CALL", initiatorRef: input.navigation.currentAction!.selectedActionId },
    startedAt: input.startedAt,
  }) : undefined;
  trace?.append({
    eventType: "QRY_ACTION_SELECTED",
    timestamp: input.startedAt,
    owner: "QUERY_NAVIGATION",
    status: "BIOSTATISTICS_SCOPE_SELECTED",
    sourceRefs: [input.navigation.currentAction!.selectedActionId, ...input.navigation.currentAction!.navigationNeedRefs],
    diagnostic: { stage: "PROJECT_CONTEXT", code: "QRY_BIOSTATISTICS_SCOPE_SELECTED" },
  });
  const invocation = invokeBiostatisticsForProjectSnapshot({
    projectSnapshot: snapshot,
    ledger: input.ownerResultLedger,
    callerRef: input.navigation.currentAction!.selectedActionId,
    purpose: input.navigation.currentAction!.reason,
    selectedNeed: {
      needRef: input.navigation.currentAction!.navigationNeedRefs[0]!,
      purpose: input.navigation.requestedService?.sourceText ?? input.navigation.currentAction!.reason,
      affectedDecisionRefs: input.navigation.currentAction!.affectedDecisionRefs,
      affectedBranchRefs: input.navigation.currentAction!.affectedBranchRefs,
      owner: "QUERY_NAVIGATION",
    },
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    trace,
  });
  const result = invocation.result?.nativePayload;
  if (!result) {
    trace?.fail(input.completedAt, invocation.observation.failureCode ?? "BIOSTATISTICS_RESULT_MISSING", "BIOSTATISTICS_ENGINE");
    throw new Error(invocation.observation.failureCode ?? "BIOSTATISTICS_RESULT_MISSING");
  }
  const presentation = buildStandardBiostatisticsPresentation(result);
  trace?.append({
    eventType: "UI_PROJECTION",
    timestamp: input.completedAt,
    owner: "UI",
    status: result.methodCandidates.length ? "BIOSTATISTICS_ALTERNATIVES_PRESENTED" : "BIOSTATISTICS_INFORMATION_NEED_PRESENTED",
    sourceRefs: [result.resultId, ...result.methodCandidates.map((item) => item.strategyRef)],
    diagnostic: { stage: "BIOSTATISTICS_ENGINE", code: result.methodCandidates.length ? "BIOSTATISTICS_OPTIONS_PROJECTED" : "BIOSTATISTICS_INFORMATION_NEED_PROJECTED" },
  });
  const interaction: StandardBiostatisticsInteraction = {
    contract: "FUNCTIONAL_RESET_BIOSTATISTICS_INTERACTION",
    contractVersion: STANDARD_BIOSTATISTICS_INTERACTION_VERSION,
    owner: "BIOSTATISTICS",
    capabilityId: "BIOSTATISTICS_PLANNING",
    ownerResultRef: invocation.result!.resultId,
    ownerResultVersion: invocation.result!.resultVersion,
    sourceActionRef: input.navigation.currentAction!.selectedActionId,
    sourceProjectRef: input.project.projectId,
    sourceProjectVersion: input.project.versionId,
    sourceProjectDigest: input.project.projectDigest,
    presentationTurnRef: input.presentationTurnRef,
    traceRunId,
    status: "ACTIVE",
    selectedStrategyRef: null,
    pendingContributionRef: null,
    adoptedProjectVersion: null,
    staleReason: null,
    projectWriteAuthorized: false,
  };
  return {
    result,
    presentation,
    interaction,
    ownerResultLedger: invocation.ledger,
    traceLedger: trace?.getLedger() ?? input.traceLedger,
    downstreamHandoffs: result.downstreamHandoffs,
    providerCalls: 0 as const,
    projectWrites: 0 as const,
    humanDecisionCreated: false as const,
  };
};

export const resolveBiostatisticsConversation = (input: {
  raw: string;
  result: Readonly<BiostatisticsReasoningResult>;
}): BiostatisticsConversationResolution => {
  const value = folded(input.raw);
  if (/\b(?:je ne sais pas|pas encore|plus tard|a discuter)\b/.test(value)) return {
    kind: "DEFER",
    response: "Aucune stratégie analytique n’est adoptée. Le Research Project reste inchangé.",
  };
  const selectionIntent = /\b(?:je|nous)\s+(?:prefer\w*|chois\w*|reti\w*)|\b(?:retenir|choisir|selectionner|adopter)\b/.test(value);
  if (selectionIntent) {
    const indexed = value.match(/\b(?:strategie|option)\s*(?:numero\s*)?([123])\b/)?.[1];
    if (indexed && input.result.methodCandidates[Number(indexed) - 1]) return {
      kind: "SELECT_STRATEGY",
      strategyRef: input.result.methodCandidates[Number(indexed) - 1]!.strategyRef,
    };
    const matches = input.result.methodCandidates.filter((item) => folded(item.label).split(" ").filter((token) => token.length >= 7).some((token) => value.includes(token)));
    if (matches.length === 1) return { kind: "SELECT_STRATEGY", strategyRef: matches[0]!.strategyRef };
  }
  if (/\b(?:pourquoi|explique|difference|comparer|compare|avantage|limite|hypothese|modele)\b/.test(value) || input.raw.trim().endsWith("?")) {
    const response = input.result.methodCandidates.length
      ? input.result.methodCandidates.map((item) => [item.label, item.rationale, item.tradeOffs[0] ? `Arbitrage : ${item.tradeOffs[0]}` : null].filter(Boolean).join("\n")).join("\n\n")
      : input.result.informationNeeds.map((item) => `${item.informationNeeded}\n${item.scientificReason}`).join("\n\n");
    return { kind: "DISCUSS", response };
  }
  return { kind: "FALLTHROUGH" };
};

export const buildBiostatisticsStrategyContribution = (input: {
  conversationId: string;
  project: Readonly<ResearchProjectOwnerProjection>;
  result: Readonly<BiostatisticsReasoningResult>;
  strategyRef: string;
  proposalTurn: ScientificInterpretationTurn;
  selectionTurn: ScientificInterpretationTurn;
  createdAt: string;
}): ScientificInterpretationContributionEnvelope => {
  if (input.result.sourceProject.projectId !== input.project.projectId
    || input.result.sourceProject.projectVersion !== input.project.versionId
    || input.result.sourceProject.projectDigest !== input.project.projectDigest) throw new Error("BIOSTATISTICS_RESULT_STALE_PROJECT_VERSION");
  const strategy = input.result.methodCandidates.find((candidate) => candidate.strategyRef === input.strategyRef);
  if (!strategy) throw new Error("BIOSTATISTICS_STRATEGY_NOT_FOUND");
  const itemId = `biostatistics-selection:${logicalDigest({ result: input.result.resultId, strategy: strategy.strategyRef, turn: input.selectionTurn.turnId })}`;
  const content = `${strategy.label}. ${strategy.rationale}`;
  return canonicalizeScientificContribution({
    contract: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ENVELOPE",
    contractNature: "RUNTIME_CONTRIBUTION_NOT_PD003_ROOT",
    identity: {
      contributionId: `biostatistics-contribution:${logicalDigest({ result: input.result.resultId, strategy: strategy.strategyRef, turn: input.selectionTurn.turnId })}`,
      previousContributionId: input.project.contributionRef,
      contractVersion: "1.0.0",
      runtimeId: "STANDARD_BIOSTATISTICS_PROJECT_CONSEQUENCE_ADAPTER",
      runtimeVersion: STANDARD_BIOSTATISTICS_INTERACTION_VERSION,
      createdAt: input.createdAt,
    },
    source: {
      conversationId: input.conversationId,
      originalRequest: input.selectionTurn.content,
      turns: [input.proposalTurn, input.selectionTurn],
      sourceRefs: unique([input.result.resultId, input.result.resultDigest, strategy.strategyRef, input.proposalTurn.turnId, input.selectionTurn.turnId]),
      rawOutputRef: input.result.resultId,
      rawOutputDigest: input.result.resultDigest,
    },
    runtimeEvidence: {
      provider: null,
      model: null,
      promptDigest: null,
      schemaDigest: logicalDigest("BIOSTATISTICS_REASONING_RESULT"),
      configurationDigest: logicalDigest({ runtime: "STANDARD_BIOSTATISTICS_PROJECT_CONSEQUENCE_ADAPTER", version: STANDARD_BIOSTATISTICS_INTERACTION_VERSION }),
      technicalStatus: "LOCAL_BIOSTATISTICS_STRATEGY_SELECTED_PENDING_HUMAN_REVIEW",
      parseStatus: "NOT_REQUIRED",
      validationErrors: [],
    },
    scientificContent: {
      normalizedUnderstanding: `Stratégie analytique retenue pour revue humaine : ${strategy.label}`,
      routeProposal: null,
      explicitStatements: [],
      candidateObjects: [{
        itemId,
        semanticIdentity: `${input.project.projectId}:analysis-specification:${logicalDigest(strategy.strategyRef)}`,
        proposedType: "ANALYSIS_SPECIFICATION",
        content,
        polarity: "AFFIRMED",
        studyRole: "ANALYSIS_SPECIFICATION",
        confidence: null,
        previousItemIds: [],
        evidenceRefs: unique([input.result.resultId, input.result.resultDigest, strategy.strategyRef, ...input.result.sourceOwnerLineage.flatMap((item) => item.provenanceRefs)]),
        epistemicBoundary: {
          ownership: "BIOSTATISTICS",
          epistemicStatus: "OWNER_SUPPORTED_CANDIDATE",
          adoptionStatus: "CANDIDATE_PENDING_HUMAN_CONFIRMATION",
          originType: "OWNER_RESULT",
          originStatus: "BIOSTATISTICS_STRATEGY_PROJECT_CONSEQUENCE",
          activeState: true,
          sourceTurnIds: [input.proposalTurn.turnId, input.selectionTurn.turnId],
          sourceText: input.selectionTurn.content,
        },
      }],
      candidateRelations: [],
      inferredContext: [],
      contextualCandidates: [],
      negationsAndConstraints: [],
      temporalElements: [],
      ambiguities: [],
      unknowns: [],
      missingInformation: [],
      correctionsAndSupersessions: [],
      openDecisions: [],
      clarificationNeeds: [],
      temporalQualifications: [],
      expectedVariableOccasions: [],
    },
    epistemicBoundary: {
      candidateIsAdopted: false,
      knowledgeSupportIsProjectDecision: false,
      projectOwnershipTransferred: false,
      humanDecisionEnvelopeRef: null,
    },
    mapping: [{
      sourceItemId: itemId,
      proposedTargetDomain: "RESEARCH_PROJECT",
      proposedTargetTypes: ["ANALYSIS_SPECIFICATION"],
      mappingStatus: "DOMAIN_REVIEW_REQUIRED",
      qualificationOwnerRequired: "RESEARCH_PROJECT",
      mappingLimitations: ["HUMAN_CONFIRMATION_REQUIRED", "BIOSTATISTICS_SPECIFICATION_REMAINS_EXTERNAL_OWNER_RESULT"],
    }],
    audit: { deterministicFindings: [], semanticAuditFindings: [], unresolvedFindings: [] },
    decisionBoundary: {
      decisionRequired: true,
      decisionEnvelopeRef: null,
      permittedHumanDispositions: ["ACCEPT_WORKING_BASIS", "REJECT", "DEFER", "REOPEN", "PARTIAL_SELECTION", "ROUTE_TO_SPECIALIST"],
      projectWriteAuthorized: false,
    },
  });
};

export const biostatisticsInteractionMatchesCurrentProject = (
  interaction: Readonly<StandardBiostatisticsInteraction>,
  project: Readonly<ResearchProjectOwnerProjection>,
) => interaction.sourceProjectRef === project.projectId
  && interaction.sourceProjectVersion === project.versionId
  && interaction.sourceProjectDigest === project.projectDigest;
