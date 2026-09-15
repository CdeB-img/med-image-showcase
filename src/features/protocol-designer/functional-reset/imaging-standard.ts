import { logicalDigest } from "@/features/knowledge-engine";
import type { ImagingDesignResult } from "@/features/imaging-study-designer";
import {
  canonicalizeScientificContribution,
  type ScientificInterpretationContributionEnvelope,
  type ScientificInterpretationTurn,
} from "@/features/scientific-interpretation";
import type { FunctionalResetQueryNavigation } from "@/features/query-navigation";
import {
  buildProjectContextSnapshot,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import {
  createScientificRunTraceRecorder,
  type ScientificExecutionTraceLedger,
} from "@/features/protocol-designer/scientific-execution-trace";
import { invokeImagingForProjectSnapshot } from "@/features/protocol-designer/product-imaging-owner-runtime";
import type { ProductOwnerResultLedger } from "@/features/protocol-designer/product-owner-result-ledger";

export const STANDARD_IMAGING_INTERACTION_VERSION = "1.0.0" as const;

export type StandardImagingOptionPresentation = {
  optionRef: string;
  modalityRef: string;
  modalityLabel: string;
  acquisitionLabel: string | null;
  rationale: string;
  requirements: readonly string[];
  limitations: readonly string[];
  projectCandidateType: "ACQUISITION" | null;
};

export type StandardImagingPresentation = {
  presentationId: string;
  resultRef: string;
  title: string;
  introduction: string;
  options: readonly StandardImagingOptionPresentation[];
  unresolvedQuestions: readonly string[];
  commonRequirements: readonly string[];
  downstreamHandoffs: readonly string[];
  plainText: string;
};

export type StandardImagingInteraction = {
  contract: "FUNCTIONAL_RESET_IMAGING_INTERACTION";
  contractVersion: typeof STANDARD_IMAGING_INTERACTION_VERSION;
  owner: "IMAGING";
  capabilityId: "IMAGING_STUDY_DESIGN";
  ownerResultRef: string;
  ownerResultVersion: string;
  sourceActionRef: string;
  sourceProjectRef: string;
  sourceProjectVersion: string;
  sourceProjectDigest: string;
  presentationTurnRef: string;
  traceRunId: string | null;
  status: "ACTIVE" | "PENDING_HUMAN_REVIEW" | "ADOPTED" | "REJECTED" | "STALE";
  selectedOptionRef: string | null;
  pendingContributionRef: string | null;
  adoptedProjectVersion: string | null;
  staleReason: string | null;
  projectWriteAuthorized: false;
};

export type ImagingConversationResolution =
  | { kind: "SELECT_OPTION"; optionRef: string }
  | { kind: "DISCUSS"; response: string }
  | { kind: "DEFER"; response: string }
  | { kind: "FALLTHROUGH" };

const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
const folded = (value: string) => value.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr-FR").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export const isImagingQueryDispatch = (navigation: Readonly<FunctionalResetQueryNavigation>) => {
  const action = navigation.currentAction;
  const selected = navigation.selection.selected;
  return Boolean(action
    && action.owner === "IMAGING"
    && action.affectedDecisionRefs.length === 1
    && action.affectedDecisionRefs[0] === "project-section:IMAGING"
    && action.affectedBranchRefs.includes("project-facet:IMAGING:IMAGING_ROLE")
    && selected?.capabilityRef === "IMAGING_STUDY_DESIGN"
    && navigation.projectVersion === action.projectVersion);
};

export const buildStandardImagingPresentation = (
  result: Readonly<ImagingDesignResult>,
): StandardImagingPresentation => {
  const acquisitionByModality = new Map(result.acquisitionStrategies.map((item) => [item.modalityId, item]));
  const options = result.modalityCandidates.map((modality): StandardImagingOptionPresentation => {
    const acquisition = acquisitionByModality.get(modality.modalityId) ?? null;
    return {
      optionRef: acquisition?.acquisitionId ?? modality.modalityId,
      modalityRef: modality.modalityId,
      modalityLabel: modality.label,
      acquisitionLabel: acquisition?.level2.acquisitionFamily ?? null,
      rationale: acquisition?.level1.scientificReason
        ?? "La modalité est conservée, mais la chaîne mesure–acquisition n’est pas encore suffisamment établie.",
      requirements: unique([
        ...(acquisition?.level2.timingRequirements ?? []),
        ...(acquisition?.level2.qualityRequirements ?? []),
        ...result.timingStrategy.filter((item) => item.linkedIds.includes(acquisition?.acquisitionId ?? "")).map((item) => item.value),
      ]),
      limitations: unique([
        ...modality.limitations,
        ...(acquisition ? [acquisition.level3.reason] : ["La stratégie d’acquisition reste à qualifier."]),
      ]),
      projectCandidateType: acquisition ? "ACQUISITION" : null,
    };
  });
  const unresolvedQuestions = unique([
    ...result.adaptiveQuestions.filter((item) => !item.answeredValue).map((item) => item.label),
    ...result.missingInformation,
  ]);
  const commonRequirements = unique([
    ...result.harmonizationStrategy.commonCore,
    ...result.harmonizationStrategy.additionalQualityControls,
    ...result.qualityStrategy.slice(0, 4).map((item) => item.acceptanceConcept),
  ]);
  const downstreamHandoffs = unique((result.downstreamHandoffs ?? []).map((handoff) =>
    handoff.targetOwner === "BIOSTATISTICS"
      ? "Les conséquences analytiques restent à qualifier par Biostatistics."
      : "Les métadonnées et la provenance opérationnelle restent à qualifier par Data Management."));
  const introduction = options.length > 1
    ? "Plusieurs modalités sont conservées sans classement automatique. Leurs rôles peuvent être complémentaires et leurs acquisitions doivent être qualifiées séparément."
    : options.length === 1
      ? "La modalité déjà présente dans le projet ne suffit pas à définir l’acquisition, la qualité, la comparabilité ou la faisabilité."
      : "Le besoin d’imagerie est identifié, mais le contexte ne permet pas encore une spécialisation défendable.";
  const plainText = result.scopeExplanation ?? [
    introduction,
    ...options.map((option) => [
      option.modalityLabel,
      option.acquisitionLabel,
      option.rationale,
      option.requirements.length ? `Exigences à discuter : ${option.requirements.join(" ; ")}` : null,
      option.limitations[0] ? `Limite principale : ${option.limitations[0]}` : null,
    ].filter(Boolean).join("\n")),
    unresolvedQuestions.length ? `Points à préciser :\n${unresolvedQuestions.slice(0, 4).map((item) => `– ${item}`).join("\n")}` : null,
    downstreamHandoffs.join("\n") || null,
  ].filter((value): value is string => Boolean(value)).join("\n\n");
  return {
    presentationId: `imaging-standard-presentation:${logicalDigest({ result: result.resultId, digest: result.resultDigest })}`,
    resultRef: result.resultId,
    title: result.scopeExplanation ? "Acquisition à qualifier" : options.length ? "Stratégie d’imagerie à discuter" : "Spécialisation Imaging à préciser",
    // The native scoped abstention is the visible service response. A retained
    // modality without a qualified acquisition is not a proposed alternative.
    introduction: result.scopeExplanation ?? introduction,
    options: result.scopeExplanation ? [] : options,
    unresolvedQuestions: result.scopeExplanation ? [] : unresolvedQuestions,
    commonRequirements,
    downstreamHandoffs,
    plainText,
  };
};

export const readImagingResultFromLedger = (input: {
  ledger: Readonly<ProductOwnerResultLedger>;
  resultRef: string;
}): Readonly<ImagingDesignResult> | null => {
  const result = [...input.ledger.entries].reverse().find((entry) => entry.result?.resultId === input.resultRef
    && entry.request.owner === "IMAGING"
    && entry.request.capabilityId === "IMAGING_STUDY_DESIGN")?.result;
  const payload = result?.nativePayload as ImagingDesignResult | null | undefined;
  return payload?.projectWriteAuthorized === false
    && payload.candidateIsAdopted === false
    && payload.sourceProject ? payload : null;
};

export const dispatchImagingFromQuery = (input: {
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
  if (!isImagingQueryDispatch(input.navigation)) throw new Error("QRY_ACTION_NOT_OWNED_BY_IMAGING");
  if (input.navigation.projectRef !== input.project.projectId
    || input.navigation.projectVersion !== input.project.versionId
    || input.navigation.projectDigest !== input.project.projectDigest) throw new Error("QRY_IMAGING_PROJECT_BINDING_STALE");
  const snapshot = buildProjectContextSnapshot({ project: input.project });
  const traceRunId = input.traceEnabled === false ? null : `scientific-imaging-trace:${logicalDigest({
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
    status: "IMAGING_SCOPE_SELECTED",
    sourceRefs: [input.navigation.currentAction!.selectedActionId, ...input.navigation.currentAction!.navigationNeedRefs],
    diagnostic: { stage: "PROJECT_CONTEXT", code: "QRY_IMAGING_SCOPE_SELECTED" },
  });
  const invocation = invokeImagingForProjectSnapshot({
    projectSnapshot: snapshot,
    ledger: input.ownerResultLedger,
    callerRef: input.navigation.currentAction!.selectedActionId,
    purpose: input.navigation.currentAction!.reason,
    sourceNeed: {
      id: input.navigation.currentAction!.navigationNeedRefs[0]!,
      purpose: input.navigation.requestedService?.sourceText ?? input.navigation.currentAction!.reason,
    },
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    trace,
  });
  const result = invocation.result?.nativePayload;
  if (!result) {
    trace?.fail(input.completedAt, invocation.observation.failureCode ?? "IMAGING_RESULT_MISSING", "IMAGING_ENGINE");
    throw new Error(invocation.observation.failureCode ?? "IMAGING_RESULT_MISSING");
  }
  const presentation = buildStandardImagingPresentation(result);
  trace?.append({
    eventType: "UI_PROJECTION",
    timestamp: input.completedAt,
    owner: "UI",
    status: result.acquisitionStrategies.length ? "IMAGING_ALTERNATIVES_PRESENTED" : "IMAGING_INFORMATION_NEED_PRESENTED",
    sourceRefs: [result.resultId, ...result.modalityCandidates.map((item) => item.modalityId)],
    diagnostic: { stage: "IMAGING_ENGINE", code: result.acquisitionStrategies.length ? "IMAGING_OPTIONS_PROJECTED" : "IMAGING_INFORMATION_NEED_PROJECTED" },
  });
  const interaction: StandardImagingInteraction = {
    contract: "FUNCTIONAL_RESET_IMAGING_INTERACTION",
    contractVersion: STANDARD_IMAGING_INTERACTION_VERSION,
    owner: "IMAGING",
    capabilityId: "IMAGING_STUDY_DESIGN",
    ownerResultRef: invocation.result!.resultId,
    ownerResultVersion: invocation.result!.resultVersion,
    sourceActionRef: input.navigation.currentAction!.selectedActionId,
    sourceProjectRef: input.project.projectId,
    sourceProjectVersion: input.project.versionId,
    sourceProjectDigest: input.project.projectDigest,
    presentationTurnRef: input.presentationTurnRef,
    traceRunId,
    status: "ACTIVE",
    selectedOptionRef: null,
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
    downstreamHandoffs: result.downstreamHandoffs ?? [],
    providerCalls: 0 as const,
    projectWrites: 0 as const,
    humanDecisionCreated: false as const,
  };
};

export const resolveImagingConversation = (input: {
  raw: string;
  result: Readonly<ImagingDesignResult>;
}): ImagingConversationResolution => {
  const value = folded(input.raw);
  if (/\b(?:je ne sais pas|pas encore|plus tard|a discuter)\b/.test(value)) return {
    kind: "DEFER",
    response: "Aucune stratégie d’imagerie n’est adoptée. Le projet reste inchangé.",
  };
  const selectionIntent = /\b(?:je|nous)\s+(?:prefer\w*|chois\w*|reti\w*)|\b(?:retenir|choisir|selectionner|adopter)\b/.test(value);
  if (selectionIntent) {
    const matches = input.result.acquisitionStrategies.filter((acquisition) => {
      const modality = input.result.modalityCandidates.find((item) => item.modalityId === acquisition.modalityId);
      return [acquisition.level2.acquisitionFamily, modality?.label ?? ""].some((label) =>
        folded(label).split(" ").filter((token) => token.length >= 3).some((token) => value.includes(token)));
    });
    if (matches.length === 1) return { kind: "SELECT_OPTION", optionRef: matches[0]!.acquisitionId };
  }
  if (/\b(?:pourquoi|explique|difference|comparer|compare|avantage|limite|complement)\b/.test(value) || input.raw.trim().endsWith("?")) {
    const modalities = input.result.modalityCandidates.map((item) => item.label);
    return {
      kind: "DISCUSS",
      response: modalities.length > 1
        ? `${modalities.join(" et ")} restent conservées sans hiérarchie automatique : leurs rôles peuvent être complémentaires, mais chacune porte ses propres contraintes d’acquisition, de qualité et de comparabilité. Le choix dépend du besoin de mesure, de la répétabilité attendue et de la faisabilité encore à documenter.`
        : `La modalité ${modalities[0] ?? "envisagée"} est conservée, mais sa présence ne résout pas à elle seule l’acquisition, la qualité, la comparabilité ni la faisabilité. Le Research Project reste inchangé pendant cette discussion.`,
    };
  }
  return { kind: "FALLTHROUGH" };
};

export const prepareImagingAcquisitionContribution = (input: {
  conversationId: string;
  project: Readonly<ResearchProjectOwnerProjection>;
  result: Readonly<ImagingDesignResult>;
  optionRef: string;
  proposalTurn: ScientificInterpretationTurn;
  selectionTurn: ScientificInterpretationTurn;
  createdAt: string;
}): ScientificInterpretationContributionEnvelope => {
  if (input.result.sourceProject?.projectId !== input.project.projectId
    || input.result.sourceProject.projectVersion !== input.project.versionId
    || input.result.sourceProject.projectDigest !== input.project.projectDigest) throw new Error("IMAGING_PROPOSAL_STALE_PROJECT_VERSION");
  const acquisition = input.result.acquisitionStrategies.find((item) => item.acquisitionId === input.optionRef);
  if (!acquisition) throw new Error("IMAGING_ACQUISITION_OPTION_NOT_FOUND");
  const modality = input.result.modalityCandidates.find((item) => item.modalityId === acquisition.modalityId);
  if (!modality) throw new Error("IMAGING_MODALITY_FOR_ACQUISITION_NOT_FOUND");
  const itemId = `imaging-project-candidate:${logicalDigest({ result: input.result.resultId, acquisition: acquisition.acquisitionId })}`;
  return canonicalizeScientificContribution({
    contract: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ENVELOPE",
    contractNature: "RUNTIME_CONTRIBUTION_NOT_PD003_ROOT",
    identity: {
      contributionId: `scientific-contribution:${logicalDigest({ result: input.result.resultId, option: input.optionRef, turn: input.selectionTurn.turnId })}`,
      previousContributionId: input.project.contributionRef,
      contractVersion: "1.0.0",
      runtimeId: "STANDARD_IMAGING_CONTRIBUTION_ADAPTER",
      runtimeVersion: STANDARD_IMAGING_INTERACTION_VERSION,
      createdAt: input.createdAt,
    },
    source: {
      conversationId: input.conversationId,
      originalRequest: input.selectionTurn.content,
      turns: [input.proposalTurn, input.selectionTurn],
      sourceRefs: unique([input.result.resultId, input.result.resultDigest, modality.modalityId, acquisition.acquisitionId, input.proposalTurn.turnId, input.selectionTurn.turnId]),
      rawOutputRef: input.result.resultId,
      rawOutputDigest: input.result.resultDigest,
    },
    runtimeEvidence: {
      provider: null,
      model: null,
      promptDigest: null,
      schemaDigest: logicalDigest("IMAGING_ACQUISITION_PROJECT_CONSEQUENCE"),
      configurationDigest: logicalDigest({ runtime: "STANDARD_IMAGING_CONTRIBUTION_ADAPTER", version: STANDARD_IMAGING_INTERACTION_VERSION }),
      technicalStatus: "LOCAL_IMAGING_ACQUISITION_SELECTED_PENDING_HUMAN_REVIEW",
      parseStatus: "NOT_REQUIRED",
      validationErrors: [],
    },
    scientificContent: {
      normalizedUnderstanding: `Stratégie d’acquisition Imaging retenue pour revue : ${acquisition.level2.acquisitionFamily}`,
      routeProposal: null,
      explicitStatements: [],
      candidateObjects: [{
        itemId,
        semanticIdentity: `${input.project.projectId}:acquisition:${logicalDigest(acquisition.level2.acquisitionFamily)}`,
        proposedType: "ACQUISITION",
        content: acquisition.level2.acquisitionFamily,
        polarity: "AFFIRMED",
        studyRole: "IMAGING_ACQUISITION_CANDIDATE",
        confidence: null,
        previousItemIds: [],
        evidenceRefs: unique([input.result.resultId, input.result.resultDigest, modality.modalityId, acquisition.acquisitionId, ...modality.evidenceRefs]),
        epistemicBoundary: {
          ownership: "IMAGING",
          epistemicStatus: "OWNER_SUPPORTED_CANDIDATE",
          adoptionStatus: "CANDIDATE_PENDING_HUMAN_CONFIRMATION",
          originType: "OWNER_RESULT",
          originStatus: "IMAGING_ACQUISITION_PROJECT_CONSEQUENCE",
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
      unknowns: input.result.missingInformation.map((content, index) => ({
        itemId: `${itemId}:unknown:${index + 1}`,
        semanticIdentity: `${itemId}:unknown:${logicalDigest(content)}`,
        proposedType: "UNKNOWN",
        content,
        polarity: "UNKNOWN",
        studyRole: "IMAGING_UNRESOLVED_INFORMATION",
        confidence: null,
        previousItemIds: [],
        evidenceRefs: [input.result.resultId],
        epistemicBoundary: {
          ownership: "IMAGING",
          epistemicStatus: "UNKNOWN",
          adoptionStatus: "CANDIDATE_PENDING_HUMAN_CONFIRMATION",
          originType: "OWNER_RESULT",
          originStatus: "IMAGING_RESULT_UNKNOWN",
          activeState: true,
          sourceTurnIds: [input.proposalTurn.turnId, input.selectionTurn.turnId],
          sourceText: null,
        },
      })),
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
      proposedTargetTypes: ["ACQUISITION"],
      mappingStatus: "DOMAIN_REVIEW_REQUIRED",
      qualificationOwnerRequired: "RESEARCH_PROJECT",
      mappingLimitations: ["IMAGING_RESULT_REQUIRES_PROJECT_VALIDATION_AND_HUMAN_CONFIRMATION", "OBS_MEASUREMENT_DEFINITION_NOT_TRANSFERRED"],
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

export const imagingInteractionMatchesCurrentProject = (
  interaction: Readonly<StandardImagingInteraction>,
  project: Readonly<ResearchProjectOwnerProjection>,
) => interaction.sourceProjectRef === project.projectId
  && interaction.sourceProjectVersion === project.versionId
  && interaction.sourceProjectDigest === project.projectDigest;
