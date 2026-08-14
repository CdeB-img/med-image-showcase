import { activeSemanticElements } from "@/features/scientific-semantic-reconstruction/canonical";
import type { ScientificSemanticModel } from "@/features/scientific-semantic-reconstruction/types";
import { canonicalizeScientificContribution } from "./canonical";
import { applyDeterministicAudit } from "./audit";
import {
  SCIENTIFIC_INTERPRETATION_CONTRIBUTION_CONTRACT,
  SCIENTIFIC_INTERPRETATION_CONTRIBUTION_VERSION,
  type ScientificContributionItem,
  type ScientificInterpretationContributionEnvelope,
  type ScientificInterpretationConversation,
  type ScientificInterpretationRuntime,
} from "./contracts";

export type LegacySemanticModelInput = ScientificSemanticModel;

const itemFromLegacy = (element: ScientificSemanticModel["elements"][number]): ScientificContributionItem => ({
  itemId: element.semanticElementId,
  semanticIdentity: element.semanticElementId,
  proposedType: element.type,
  content: element.canonicalMeaning,
  polarity: element.polarity,
  studyRole: element.studyRole,
  confidence: element.confidence,
  previousItemIds: element.supersedesElementIds,
  evidenceRefs: [
    ...element.inventoryItemIds,
    ...(element.knowledgeSupport.resultRef ? [element.knowledgeSupport.resultRef] : []),
    ...element.knowledgeSupport.assertionRefs,
  ],
  epistemicBoundary: {
    ownership: element.provenance.source === "USER_LANGUAGE" || element.provenance.source === "USER_CORRECTION" ? "USER" : "RUNTIME",
    epistemicStatus: element.epistemicStatus,
    adoptionStatus: element.epistemicStatus === "CONFIRMED_BY_USER" ? "CONFIRMED_BY_USER" : "NOT_ADOPTED",
    activeState: element.epistemicStatus !== "REJECTED_BY_USER",
    sourceTurnIds: element.sourceSpan?.messageId ? [element.sourceSpan.messageId] : [],
    sourceText: element.sourceSpan?.text ?? null,
  },
});

const textItem = (prefix: string, content: string, index: number, proposedType: string): ScientificContributionItem => ({
  itemId: `legacy:${prefix}:${index}`,
  semanticIdentity: null,
  proposedType,
  content,
  polarity: proposedType === "CONTRADICTION" ? "UNCERTAIN" : null,
  studyRole: null,
  confidence: null,
  previousItemIds: [],
  evidenceRefs: [],
  epistemicBoundary: {
    ownership: "USER",
    epistemicStatus: proposedType === "AMBIGUITY" ? "AMBIGUOUS" : proposedType === "UNKNOWN" || proposedType === "MISSING_CONCEPT" ? "UNKNOWN" : null,
    adoptionStatus: "NOT_ADOPTED",
    activeState: true,
    sourceTurnIds: [],
    sourceText: null,
  },
});

export const legacySemanticModelToContribution = (model: ScientificSemanticModel): ScientificInterpretationContributionEnvelope => {
  const items = model.elements.map(itemFromLegacy);
  const active = activeSemanticElements(model);
  const explicitStatements = active.filter((item) => ["EXPLICIT_USER_STATED", "CONFIRMED_BY_USER"].includes(item.epistemicStatus)).map(itemFromLegacy);
  const candidateObjects = items;
  const ambiguities = model.ambiguities.map((item, index) => textItem("ambiguity", item, index, "AMBIGUITY"));
  const unknowns = model.unknowns.map((item, index) => textItem("unknown", item, index, "UNKNOWN"));
  const missingInformation = [...model.missingConcepts, ...model.ellipses].map((item, index) => textItem("missing", item, index, "MISSING_CONCEPT"));
  const contradictions = model.contradictions.map((item, index) => textItem("contradiction", item, index, "CONTRADICTION"));
  const clarificationNeeds = model.clarificationCandidates.map((item, index) => textItem("clarification", item.question, index, "CLARIFICATION"));
  const mappedItems = [...candidateObjects, ...ambiguities, ...unknowns, ...missingInformation, ...contradictions, ...clarificationNeeds];
  return applyDeterministicAudit(canonicalizeScientificContribution({
    contract: SCIENTIFIC_INTERPRETATION_CONTRIBUTION_CONTRACT,
    contractNature: "RUNTIME_CONTRIBUTION_NOT_PD003_ROOT",
    identity: {
      contributionId: `legacy-sem-contribution:${model.semanticModelId}:${model.revision}`,
      contractVersion: SCIENTIFIC_INTERPRETATION_CONTRIBUTION_VERSION,
      runtimeId: "LEGACY_SEM_FULL",
      runtimeVersion: model.semanticModelVersion,
      createdAt: model.updatedAt,
    },
    source: {
      conversationId: model.semanticModelId,
      originalRequest: model.originalRequest,
      turns: model.conversationMessageIds.map((messageId, index) => ({
        turnId: messageId,
        role: "USER" as const,
        content: index === model.conversationMessageIds.length - 1 ? model.originalRequest : "",
      })),
      sourceRefs: model.conversationMessageIds,
      rawOutputRef: model.executionSnapshot?.reconstructionCallId ?? null,
      rawOutputDigest: model.executionSnapshot ? model.digest : null,
    },
    runtimeEvidence: {
      provider: model.executionSnapshot?.provider ?? null,
      model: model.executionSnapshot?.model ?? null,
      promptDigest: model.executionSnapshot?.reconstructionPromptVersion ?? null,
      schemaDigest: model.executionSnapshot?.schemaVersion ?? null,
      configurationDigest: model.digest,
      technicalStatus: model.status,
      parseStatus: model.executionSnapshot ? "PARSED" : "NOT_REQUIRED",
      validationErrors: [],
    },
    scientificContent: {
      normalizedUnderstanding: model.normalizedMeaning,
      routeProposal: { route: model.routeProposal.route, confidence: model.routeProposal.confidence, reason: model.routeProposal.reason },
      explicitStatements,
      candidateObjects,
      candidateRelations: model.relations.map((relation) => ({
        relationId: relation.semanticRelationId,
        relationType: relation.relationType,
        sourceItemId: relation.sourceElementId,
        targetItemId: relation.targetElementId,
        polarity: relation.polarity,
        confidence: relation.confidence,
        epistemicBoundary: {
          ownership: "RUNTIME",
          epistemicStatus: relation.epistemicStatus,
          adoptionStatus: relation.epistemicStatus === "CONFIRMED_BY_USER" ? "CONFIRMED_BY_USER" : "NOT_ADOPTED",
          activeState: relation.epistemicStatus !== "REJECTED_BY_USER",
          sourceTurnIds: [],
          sourceText: null,
        },
      })),
      inferredContext: items.filter((item) => item.epistemicBoundary.epistemicStatus?.startsWith("INFERRED")),
      contextualCandidates: items.filter((item) => item.epistemicBoundary.epistemicStatus?.includes("CANDIDATE")),
      negationsAndConstraints: items.filter((item) => item.polarity === "NEGATED" || item.proposedType === "CONSTRAINT"),
      temporalElements: items.filter((item) => item.proposedType === "TIMING"),
      ambiguities,
      unknowns,
      missingInformation,
      correctionsAndSupersessions: items.filter((item) => (item.previousItemIds?.length ?? 0) > 0 || item.epistemicBoundary.epistemicStatus === "REJECTED_BY_USER"),
      openDecisions: contradictions,
      clarificationNeeds,
    },
    epistemicBoundary: {
      candidateIsAdopted: false,
      knowledgeSupportIsProjectDecision: false,
      projectOwnershipTransferred: false,
      humanDecisionEnvelopeRef: null,
    },
    mapping: mappedItems.map((item) => ({
      sourceItemId: item.itemId,
      proposedTargetDomain: null,
      proposedTargetTypes: item.proposedType ? [item.proposedType] : [],
      mappingStatus: "LEGACY_COMPATIBILITY_ONLY",
      qualificationOwnerRequired: null,
      mappingLimitations: ["Legacy SEM type preserved; no PD-003 V2 claim."],
    })),
    audit: { deterministicFindings: [], semanticAuditFindings: [], unresolvedFindings: [] },
    decisionBoundary: {
      decisionRequired: model.status !== "ACCEPTED",
      decisionEnvelopeRef: null,
      permittedHumanDispositions: ["ACCEPT_WORKING_BASIS", "REJECT", "DEFER", "REOPEN", "PARTIAL_SELECTION", "ROUTE_TO_SPECIALIST"],
      projectWriteAuthorized: false,
    },
  }));
};

export class LegacySemRuntimeAdapter implements ScientificInterpretationRuntime {
  readonly runtimeId = "LEGACY_SEM_FULL";
  readonly runtimeVersion = "1.1";

  constructor(private readonly execute: (conversation: ScientificInterpretationConversation) => Promise<ScientificSemanticModel>) {}

  async interpret(conversation: ScientificInterpretationConversation) {
    return legacySemanticModelToContribution(await this.execute(conversation));
  }
}
