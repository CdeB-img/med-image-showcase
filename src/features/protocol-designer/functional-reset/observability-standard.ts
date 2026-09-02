import { logicalDigest } from "@/features/knowledge-engine";
import type { ObservabilityMeasurementResult } from "@/features/observability-measurement";
import {
  canonicalizeScientificContribution,
  type ScientificInterpretationContributionEnvelope,
  type ScientificInterpretationTurn,
} from "@/features/scientific-interpretation";
import type { FunctionalResetQueryNavigation } from "@/features/query-navigation";
import {
  buildProjectContextSnapshot,
  ensureCanonicalProjectState,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import {
  createScientificRunTraceRecorder,
  type ScientificExecutionTraceLedger,
} from "@/features/protocol-designer/scientific-execution-trace";
import { invokeObservabilityForProjectSnapshot } from "@/features/protocol-designer/product-observability-owner-runtime";
import type { ProductOwnerResultLedger } from "@/features/protocol-designer/product-owner-result-ledger";

export const STANDARD_OBSERVABILITY_INTERACTION_VERSION = "1.0.0" as const;

export type StandardObservabilityOptionPresentation = {
  optionRef: string;
  propertyLabel: string;
  measurementLabel: string;
  rationale: string;
  limitations: readonly string[];
  valueNature: string;
};

export type StandardObservabilityPresentation = {
  presentationId: string;
  resultRef: string;
  title: string;
  introduction: string;
  properties: readonly { propertyRef: string; label: string; rationale: string }[];
  options: readonly StandardObservabilityOptionPresentation[];
  informationNeeds: readonly string[];
  plainText: string;
};

export type StandardObservabilityInteraction = {
  contract: "FUNCTIONAL_RESET_OBSERVABILITY_INTERACTION";
  contractVersion: typeof STANDARD_OBSERVABILITY_INTERACTION_VERSION;
  owner: "OBSERVABILITY_MEASUREMENT";
  capabilityId: "OBSERVABILITY_QUALIFICATION";
  ownerResultRef: string;
  ownerResultVersion: string;
  sourceActionRef: string;
  sourceProjectRef: string;
  sourceProjectVersion: string;
  sourceProjectDigest: string;
  presentationTurnRef: string;
  traceRunId: string | null;
  status: "ACTIVE" | "PENDING_HUMAN_REVIEW" | "ADOPTED" | "REJECTED" | "STALE";
  selectedMeasurementRef: string | null;
  pendingContributionRef: string | null;
  adoptedProjectVersion: string | null;
  staleReason: string | null;
  projectWriteAuthorized: false;
};

export type ObservabilityConversationResolution =
  | { kind: "SELECT_MEASUREMENT"; measurementRef: string }
  | { kind: "DISCUSS"; response: string }
  | { kind: "DEFER"; response: string }
  | { kind: "FALLTHROUGH" };

const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
const folded = (value: string) => value.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr-FR").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export const isObservabilityQueryDispatch = (navigation: Readonly<FunctionalResetQueryNavigation>) => {
  const action = navigation.currentAction;
  const selected = navigation.selection.selected;
  return Boolean(action
    && action.owner === "OBSERVABILITY_MEASUREMENT"
    && action.affectedDecisionRefs.length === 1
    && action.affectedDecisionRefs[0] === "project-section:MEASUREMENTS"
    && selected?.capabilityRef === "OBSERVABILITY_QUALIFICATION"
    && action.affectedBranchRefs.includes("project-facet:MEASUREMENTS:MEASUREMENT_SET")
    && navigation.projectVersion === action.projectVersion);
};

export const buildStandardObservabilityPresentation = (
  result: Readonly<ObservabilityMeasurementResult>,
): StandardObservabilityPresentation => {
  const propertyByRef = new Map(result.observableProperties.map((property) => [property.propertyRef, property]));
  const properties = result.observableProperties.map((property) => ({ propertyRef: property.propertyRef, label: property.label, rationale: property.rationale }));
  const options = result.measurementDefinitions.map((measurement) => ({
    optionRef: measurement.measurementRef,
    propertyLabel: propertyByRef.get(measurement.propertyRef)?.label ?? "Propriété observable",
    measurementLabel: measurement.label,
    rationale: measurement.rationale,
    limitations: unique(measurement.limitations),
    valueNature: measurement.valueNature,
  }));
  const informationNeeds = result.informationNeeds.map((need) => need.informationNeeded);
  const introduction = options.length > 1
    ? "Plusieurs définitions de mesure restent défendables. Elles sont conservées comme alternatives et aucune n’est adoptée."
    : options.length === 1
      ? "Une définition de mesure est étayée par le contexte fourni. Elle reste une proposition non adoptée."
      : properties.length
        ? "La propriété à observer est explicitée, mais sa définition de mesure reste à qualifier."
        : "Le concept reste trop large pour constituer à lui seul une propriété observable ou une définition de mesure.";
  const plainText = [
    introduction,
    ...properties.map((property) => `Propriété observable proposée\n${property.label}\n${property.rationale}`),
    ...options.map((option, index) => [
      `Définition de mesure ${index + 1}\n${option.measurementLabel}`,
      `Propriété visée : ${option.propertyLabel}`,
      option.rationale,
      option.limitations[0] ? `Limite principale : ${option.limitations[0]}` : null,
    ].filter(Boolean).join("\n")),
    informationNeeds.length ? `Point à préciser\n${informationNeeds.map((need) => `– ${need}`).join("\n")}` : null,
    options.length ? "Vous pouvez discuter ces alternatives ou en retenir une pour revue humaine." : null,
  ].filter((value): value is string => Boolean(value)).join("\n\n");
  return {
    presentationId: `observability-standard-presentation:${logicalDigest({ result: result.resultId, digest: result.resultDigest })}`,
    resultRef: result.resultId,
    title: options.length ? "Mesures à discuter" : "Définition de l’observation à préciser",
    introduction,
    properties,
    options,
    informationNeeds,
    plainText,
  };
};

export const readObservabilityResultFromLedger = (input: {
  ledger: Readonly<ProductOwnerResultLedger>;
  resultRef: string;
}): Readonly<ObservabilityMeasurementResult> | null => {
  const result = [...input.ledger.entries].reverse().find((entry) => entry.result?.resultId === input.resultRef
    && entry.request.owner === "OBSERVABILITY_MEASUREMENT"
    && entry.request.capabilityId === "OBSERVABILITY_QUALIFICATION")?.result;
  const payload = result?.nativePayload as ObservabilityMeasurementResult | null | undefined;
  return payload?.contract === "OBSERVABILITY_MEASUREMENT_RESULT"
    && payload.owner === "OBSERVABILITY_MEASUREMENT"
    && payload.projectWriteAuthorized === false
    ? payload
    : null;
};

export const dispatchObservabilityFromQuery = (input: {
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
  if (!isObservabilityQueryDispatch(input.navigation)) throw new Error("QRY_ACTION_NOT_OWNED_BY_OBSERVABILITY");
  if (input.navigation.projectRef !== input.project.projectId
    || input.navigation.projectVersion !== input.project.versionId
    || input.navigation.projectDigest !== input.project.projectDigest) throw new Error("QRY_OBSERVABILITY_PROJECT_BINDING_STALE");
  const snapshot = buildProjectContextSnapshot({ project: input.project });
  const traceRunId = input.traceEnabled === false ? null : `scientific-observability-trace:${logicalDigest({
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
    status: "OBSERVABILITY_SCOPE_SELECTED",
    sourceRefs: [input.navigation.currentAction!.selectedActionId, ...input.navigation.currentAction!.navigationNeedRefs],
    diagnostic: { stage: "PROJECT_CONTEXT", code: "QRY_OBSERVABILITY_SCOPE_SELECTED" },
  });
  const invocation = invokeObservabilityForProjectSnapshot({
    projectSnapshot: snapshot,
    ledger: input.ownerResultLedger,
    callerRef: input.navigation.currentAction!.selectedActionId,
    purpose: input.navigation.currentAction!.reason,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    trace,
  });
  const result = invocation.result?.nativePayload;
  if (!result) {
    trace?.fail(input.completedAt, invocation.observation.failureCode ?? "OBS_RESULT_MISSING", "OBSERVABILITY_MEASUREMENT_ENGINE");
    throw new Error(invocation.observation.failureCode ?? "OBS_RESULT_MISSING");
  }
  const presentation = buildStandardObservabilityPresentation(result);
  trace?.append({
    eventType: "UI_PROJECTION",
    timestamp: input.completedAt,
    owner: "UI",
    status: result.measurementDefinitions.length ? "OBS_MEASUREMENT_OPTIONS_PRESENTED" : "OBS_INFORMATION_NEED_PRESENTED",
    sourceRefs: [result.resultId, ...result.measurementDefinitions.map((item) => item.measurementRef)],
    diagnostic: { stage: "OBSERVABILITY_MEASUREMENT_ENGINE", code: result.measurementDefinitions.length ? "OBS_OPTIONS_PROJECTED" : "OBS_INFORMATION_NEED_PROJECTED" },
  });
  const interaction: StandardObservabilityInteraction = {
    contract: "FUNCTIONAL_RESET_OBSERVABILITY_INTERACTION",
    contractVersion: STANDARD_OBSERVABILITY_INTERACTION_VERSION,
    owner: "OBSERVABILITY_MEASUREMENT",
    capabilityId: "OBSERVABILITY_QUALIFICATION",
    ownerResultRef: invocation.result!.resultId,
    ownerResultVersion: invocation.result!.resultVersion,
    sourceActionRef: input.navigation.currentAction!.selectedActionId,
    sourceProjectRef: input.project.projectId,
    sourceProjectVersion: input.project.versionId,
    sourceProjectDigest: input.project.projectDigest,
    presentationTurnRef: input.presentationTurnRef,
    traceRunId,
    status: "ACTIVE",
    selectedMeasurementRef: null,
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

export const resolveObservabilityConversation = (input: {
  raw: string;
  result: Readonly<ObservabilityMeasurementResult>;
}): ObservabilityConversationResolution => {
  const value = folded(input.raw);
  if (/\b(?:je ne sais pas|pas encore|plus tard|a discuter)\b/.test(value)) return {
    kind: "DEFER",
    response: "Aucune définition de mesure n’est adoptée. Le Research Project reste inchangé.",
  };
  const selectionIntent = /\b(?:je|nous)\s+(?:prefer\w*|chois\w*|reti\w*)|\b(?:retenir|choisir|selectionner|adopter)\b/.test(value);
  if (selectionIntent) {
    const indexed = value.match(/\b(?:mesure|definition|option)\s*(?:numero\s*)?([123])\b/)?.[1];
    if (indexed && input.result.measurementDefinitions[Number(indexed) - 1]) return {
      kind: "SELECT_MEASUREMENT",
      measurementRef: input.result.measurementDefinitions[Number(indexed) - 1]!.measurementRef,
    };
    const matches = input.result.measurementDefinitions.filter((item) => folded(item.label).split(" ").filter((token) => token.length >= 6).some((token) => value.includes(token)));
    if (matches.length === 1) return { kind: "SELECT_MEASUREMENT", measurementRef: matches[0]!.measurementRef };
  }
  if (/\b(?:pourquoi|explique|difference|comparer|compare|avantage|limite)\b/.test(value) || input.raw.trim().endsWith("?")) {
    const options = input.result.measurementDefinitions;
    const response = options.length ? options.map((item) => [
      item.label,
      item.rationale,
      item.limitations[0] ? `Limite : ${item.limitations[0]}` : null,
    ].filter(Boolean).join("\n")).join("\n\n") : input.result.informationNeeds.map((need) => `${need.informationNeeded}\n${need.scientificReason}`).join("\n\n");
    return { kind: "DISCUSS", response };
  }
  return { kind: "FALLTHROUGH" };
};

export const buildObservabilityMeasurementContribution = (input: {
  conversationId: string;
  project: Readonly<ResearchProjectOwnerProjection>;
  result: Readonly<ObservabilityMeasurementResult>;
  measurementRef: string;
  proposalTurn: ScientificInterpretationTurn;
  selectionTurn: ScientificInterpretationTurn;
  createdAt: string;
}): ScientificInterpretationContributionEnvelope => {
  if (input.result.sourceProject.projectId !== input.project.projectId
    || input.result.sourceProject.projectVersion !== input.project.versionId
    || input.result.sourceProject.projectDigest !== input.project.projectDigest) throw new Error("OBS_RESULT_STALE_PROJECT_VERSION");
  const measurement = input.result.measurementDefinitions.find((candidate) => candidate.measurementRef === input.measurementRef);
  if (!measurement) throw new Error("OBS_MEASUREMENT_NOT_FOUND");
  const property = input.result.observableProperties.find((candidate) => candidate.propertyRef === measurement.propertyRef);
  if (!property) throw new Error("OBS_PROPERTY_NOT_FOUND");
  const currentVariable = ensureCanonicalProjectState(input.project).objects.find((object) => object.actuality === "CURRENT"
    && object.objectType === "CANONICAL_VARIABLE"
    && folded(object.content) === folded(measurement.label)) ?? null;
  const itemId = `observability-selection:${logicalDigest({ result: input.result.resultId, measurement: measurement.measurementRef, turn: input.selectionTurn.turnId })}`;
  const contribution = canonicalizeScientificContribution({
    contract: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ENVELOPE",
    contractNature: "RUNTIME_CONTRIBUTION_NOT_PD003_ROOT",
    identity: {
      contributionId: `observability-contribution:${logicalDigest({ result: input.result.resultId, measurement: measurement.measurementRef, turn: input.selectionTurn.turnId })}`,
      previousContributionId: input.project.contributionRef,
      contractVersion: "1.0.0",
      runtimeId: "STANDARD_OBSERVABILITY_PROJECT_CONSEQUENCE_ADAPTER",
      runtimeVersion: STANDARD_OBSERVABILITY_INTERACTION_VERSION,
      createdAt: input.createdAt,
    },
    source: {
      conversationId: input.conversationId,
      originalRequest: input.selectionTurn.content,
      turns: [input.proposalTurn, input.selectionTurn],
      sourceRefs: unique([input.result.resultId, input.result.resultDigest, property.propertyRef, measurement.measurementRef, input.proposalTurn.turnId, input.selectionTurn.turnId]),
      rawOutputRef: input.result.resultId,
      rawOutputDigest: input.result.resultDigest,
    },
    runtimeEvidence: {
      provider: null, model: null, promptDigest: null,
      schemaDigest: logicalDigest("OBSERVABILITY_MEASUREMENT_RESULT"),
      configurationDigest: logicalDigest({ runtime: "STANDARD_OBSERVABILITY_PROJECT_CONSEQUENCE_ADAPTER", version: STANDARD_OBSERVABILITY_INTERACTION_VERSION }),
      technicalStatus: "LOCAL_OBS_MEASUREMENT_SELECTED_PENDING_HUMAN_REVIEW",
      parseStatus: "NOT_REQUIRED",
      validationErrors: [],
    },
    scientificContent: {
      normalizedUnderstanding: `Définition de mesure retenue pour proposer une CanonicalVariable de Project : ${measurement.label}`,
      routeProposal: null,
      explicitStatements: [],
      candidateObjects: [{
        itemId,
        semanticIdentity: currentVariable?.objectId ?? `${input.project.projectId}:canonical-variable:${logicalDigest(measurement.label)}`,
        proposedType: "CANONICAL_VARIABLE",
        content: measurement.label,
        polarity: "AFFIRMED",
        studyRole: "OBS_QUALIFIED_MEASUREMENT_CONSEQUENCE",
        confidence: null,
        previousItemIds: currentVariable ? [currentVariable.objectId, ...currentVariable.sourceItemRefs] : [],
        evidenceRefs: unique([input.result.resultId, input.result.resultDigest, property.propertyRef, measurement.measurementRef, ...measurement.provenanceRefs]),
        epistemicBoundary: {
          ownership: "OBSERVABILITY_MEASUREMENT",
          epistemicStatus: "OWNER_SUPPORTED_CANDIDATE",
          adoptionStatus: "CANDIDATE_PENDING_HUMAN_CONFIRMATION",
          originType: "OWNER_RESULT",
          originStatus: "OBS_MEASUREMENT_PROJECT_CONSEQUENCE",
          activeState: true,
          sourceTurnIds: [input.proposalTurn.turnId, input.selectionTurn.turnId],
          sourceText: input.selectionTurn.content,
        },
      }],
      candidateRelations: [], inferredContext: [], contextualCandidates: [], negationsAndConstraints: [], temporalElements: [], ambiguities: [], unknowns: [], missingInformation: [], correctionsAndSupersessions: [], openDecisions: [], clarificationNeeds: [], temporalQualifications: [], expectedVariableOccasions: [],
    },
    epistemicBoundary: { candidateIsAdopted: false, knowledgeSupportIsProjectDecision: false, projectOwnershipTransferred: false, humanDecisionEnvelopeRef: null },
    mapping: [{
      sourceItemId: itemId,
      proposedTargetDomain: "RESEARCH_PROJECT",
      proposedTargetTypes: ["CANONICAL_VARIABLE"],
      mappingStatus: "DOMAIN_REVIEW_REQUIRED",
      qualificationOwnerRequired: "RESEARCH_PROJECT",
      mappingLimitations: ["HUMAN_CONFIRMATION_REQUIRED", "OBS_PROPERTY_AND_MEASUREMENT_REMAIN_EXTERNAL_OWNER_RESULT"],
    }],
    audit: { deterministicFindings: [], semanticAuditFindings: [], unresolvedFindings: [] },
    decisionBoundary: {
      decisionRequired: true,
      decisionEnvelopeRef: null,
      permittedHumanDispositions: ["ACCEPT_WORKING_BASIS", "REJECT", "DEFER", "REOPEN", "PARTIAL_SELECTION", "ROUTE_TO_SPECIALIST"],
      projectWriteAuthorized: false,
    },
  });
  return contribution;
};

export const observabilityInteractionMatchesCurrentProject = (
  interaction: Readonly<StandardObservabilityInteraction>,
  project: Readonly<ResearchProjectOwnerProjection>,
) => interaction.sourceProjectRef === project.projectId
  && interaction.sourceProjectVersion === project.versionId
  && interaction.sourceProjectDigest === project.projectDigest;
