import type {
  ContributionEpistemicBoundary,
  ScientificContributionItem,
  ScientificInterpretationContributionEnvelope,
  ScientificInterpretationTurn,
} from "@/features/scientific-interpretation/contracts";
import { HYBRID_PRIMARY_RUNTIME_VERSION } from "@/features/scientific-interpretation/hybrid-primary";
import type { ProductBridgeResponse } from "@/features/protocol-designer/product-bridge";

export const COLCHICINE_INITIAL = "Je veux étudier l’effet de la colchicine après infarctus du myocarde, notamment sur l’inflammation et les lésions en IRM, dans une étude multicentrique comparant colchicine et placebo. Je veux également prévoir des biomarqueurs sanguins et mesurer la taille de l’infarctus à l’IRM.";
export const COLCHICINE_MODIFICATION = "Je veux faire l’IRM entre J3 et J5 et limiter l’âge à 75 ans.";
export const COLCHICINE_LATER_MODIFICATION = "Finalement je veux faire l’IRM entre J5 et J7.";
export const COLCHICINE_03A_INITIAL = "Je veux étudier l'effet de la colchicine après infarctus du myocarde, notamment sur l'inflammation et les lésions en IRM, dans une étude multicentrique comparant colchicine et placebo.";
export const COLCHICINE_03A_MODIFICATION = "L'âge maximal sera 75 ans et je préfère une IRM entre J3 et J5.";

const boundary = (turnId: string): ContributionEpistemicBoundary => ({
  ownership: "SCIENTIFIC_INTERPRETATION",
  epistemicStatus: "EXPLICIT_USER_STATED",
  adoptionStatus: "CANDIDATE",
  activeState: true,
  sourceTurnIds: [turnId],
  sourceText: null,
});

const item = (itemId: string, proposedType: string, content: string, turnId: string, studyRole: string | null = null): ScientificContributionItem => ({
  itemId,
  semanticIdentity: itemId,
  proposedType,
  content,
  polarity: "AFFIRMED",
  studyRole,
  confidence: 1,
  epistemicBoundary: boundary(turnId),
});

export const makeFunctionalResetContribution = (turns: ScientificInterpretationTurn[]): ScientificInterpretationContributionEnvelope => {
  const firstTurn = turns[0]!.turnId;
  const firstSource = turns[0]!.content;
  const lastTurn = turns.at(-1)!.turnId;
  const secondSource = turns[1]?.content ?? "";
  const lastSource = turns.at(-1)!.content;
  const initialItems = [
    item("condition:idm", "CONDITION", "infarctus du myocarde", firstTurn),
    item("intervention:colchicine", "INTERVENTION", "colchicine", firstTurn, "INTERVENTION_ARM"),
    item("comparator:placebo", "COMPARATOR", "placebo", firstTurn, "COMPARATOR_ARM"),
    item("design:multicentric", "STUDY_DESIGN", "étude multicentrique", firstTurn),
    item("modality:mri", "MODALITY", "IRM", firstTurn),
    item("measure:inflammation", "MEASURED_VARIABLE", "inflammation", firstTurn),
    item("measure:lesions", "MEASURED_VARIABLE", "lésions myocardiques", firstTurn),
    ...(/biomarqueurs?\s+sanguins?/i.test(firstSource) ? [item("biomarker:blood", "BIOMARKER", "biomarqueurs sanguins", firstTurn)] : []),
    ...(/taille\s+de\s+l[’']infarctus/i.test(firstSource) ? [item("endpoint:infarct-size", "ENDPOINT", "taille de l’infarctus", firstTurn)] : []),
  ];
  const firstModificationItems = turns.length > 1 ? [
    ...(turns.length === 2 && /J3\s+(?:et|à|-)\s+J5/i.test(secondSource) ? [item("timing:mri", "TEMPORAL_ELEMENT", "IRM entre J3 et J5", turns[1]!.turnId)] : []),
    ...(/âge[^.]*75|75\s+ans/i.test(secondSource) ? [item("criterion:age", "POPULATION_CRITERION", "âge maximal 75 ans", turns[1]!.turnId)] : []),
  ] : [];
  const laterModification = turns.length > 2 && /J5\s+(?:et|à|-)\s+J7/i.test(lastSource) ? [
    item("timing:mri-v2", "TEMPORAL_ELEMENT", "IRM entre J5 et J7", lastTurn),
  ] : [];
  const allItems = [...initialItems, ...firstModificationItems, ...laterModification];
  const contributionId = turns.length > 2 ? "contribution:colchicine-v3" : turns.length > 1 ? "contribution:colchicine-v2" : "contribution:colchicine-v1";
  return {
    contract: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ENVELOPE",
    contractNature: "RUNTIME_CONTRIBUTION_NOT_PD003_ROOT",
    identity: {
      contributionId,
      previousContributionId: turns.length > 1 ? `contribution:colchicine-v${turns.length - 1}` : null,
      contractVersion: "1.0.0",
      runtimeId: "HYBRID_PRIMARY_STRUCTURED",
      runtimeVersion: HYBRID_PRIMARY_RUNTIME_VERSION,
      createdAt: "2026-08-19T10:00:00.000Z",
      contributionDigest: `${contributionId}:digest`,
    },
    source: {
      conversationId: "conversation:test",
      originalRequest: turns.at(-1)!.content,
      turns,
      sourceRefs: turns.map((turn) => turn.turnId),
      rawOutputRef: "raw:test",
      rawOutputDigest: "raw:digest",
    },
    runtimeEvidence: {
      provider: "TEST",
      model: "TEST",
      promptDigest: "prompt",
      schemaDigest: "schema",
      configurationDigest: "configuration",
      technicalStatus: "STRUCTURED_CONTRACT_VALID",
      parseStatus: "PARSED",
      validationErrors: [],
    },
    scientificContent: {
      normalizedUnderstanding: turns.length > 2
        ? "Conserver le projet confirmé et modifier la fenêtre IRM entre J5 et J7."
        : turns.length > 1
          ? "Conserver l’étude confirmée et ajouter une IRM entre J3 et J5 avec un âge maximal de 75 ans."
          : /biomarqueurs?\s+sanguins?/i.test(firstSource)
            ? "Évaluer l’effet de la colchicine après infarctus du myocarde, dans une étude multicentrique versus placebo, avec mesures IRM et biologiques."
            : "Évaluer l’effet de la colchicine après infarctus du myocarde, dans une étude multicentrique versus placebo, avec inflammation et lésions en IRM.",
      routeProposal: null,
      explicitStatements: [],
      candidateObjects: allItems.filter((value) => value.proposedType !== "TEMPORAL_ELEMENT"),
      candidateRelations: [{
        relationId: "relation:comparison",
        relationType: "COMPARES_WITH",
        sourceItemId: "intervention:colchicine",
        targetItemId: "comparator:placebo",
        polarity: "AFFIRMED",
        confidence: 1,
        epistemicBoundary: boundary(firstTurn),
      }],
      inferredContext: [],
      contextualCandidates: [],
      negationsAndConstraints: [],
      temporalElements: allItems.filter((value) => value.proposedType === "TEMPORAL_ELEMENT"),
      ambiguities: [],
      unknowns: [],
      missingInformation: [],
      correctionsAndSupersessions: [],
      openDecisions: [],
      clarificationNeeds: [],
    },
    epistemicBoundary: {
      candidateIsAdopted: false,
      knowledgeSupportIsProjectDecision: false,
      projectOwnershipTransferred: false,
      humanDecisionEnvelopeRef: null,
    },
    mapping: [],
    audit: { deterministicFindings: [], semanticAuditFindings: [], unresolvedFindings: [] },
    decisionBoundary: {
      decisionRequired: true,
      decisionEnvelopeRef: null,
      permittedHumanDispositions: ["ACCEPT_WORKING_BASIS", "REJECT", "DEFER", "REOPEN", "PARTIAL_SELECTION", "ROUTE_TO_SPECIALIST"],
      projectWriteAuthorized: false,
    },
  };
};

export const makeFunctionalResetBridgeResponse = (
  turns: ScientificInterpretationTurn[],
  contribution: ScientificInterpretationContributionEnvelope | null | undefined = undefined,
  assistantReply = "Je comprends votre proposition. Je vous la présente séparément pour confirmation.",
): ProductBridgeResponse => {
  const effectiveContribution = contribution === undefined
    ? makeFunctionalResetContribution(turns.filter((turn) => turn.role === "USER"))
    : contribution;
  return ({
  apiVersion: "1.0.0",
  assistantReply,
  assistantTurn: {
    turnId: `noxia:${turns.at(-1)?.turnId ?? "test"}`,
    role: "NOXIA",
    content: assistantReply,
    createdAt: "2026-08-20T09:00:01.000Z",
  },
  persistentExtraction: {
    called: effectiveContribution !== null,
    status: effectiveContribution ? "CANDIDATE" : "NOT_REQUESTED",
    candidate: null,
    validation: null,
    contribution: effectiveContribution,
  },
  observability: {
    provider: "GOOGLE_GEMINI",
    model: "gemini-3.5-flash-lite",
    conversationLatencyMs: 10,
    extractionLatencyMs: effectiveContribution ? 10 : null,
    calls: effectiveContribution ? 2 : 1,
    projectWrites: 0,
  },
  });
};
