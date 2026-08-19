import type {
  ContributionEpistemicBoundary,
  ScientificContributionItem,
  ScientificInterpretationContributionEnvelope,
  ScientificInterpretationTurn,
} from "@/features/scientific-interpretation/contracts";

export const COLCHICINE_INITIAL = "Je veux étudier l’effet de la colchicine après infarctus du myocarde, notamment sur l’inflammation et les lésions en IRM, dans une étude multicentrique comparant colchicine et placebo. Je veux également prévoir des biomarqueurs sanguins et mesurer la taille de l’infarctus à l’IRM.";
export const COLCHICINE_MODIFICATION = "Je veux faire l’IRM entre J3 et J5 et limiter l’âge à 75 ans.";
export const COLCHICINE_LATER_MODIFICATION = "Finalement je veux faire l’IRM entre J5 et J7.";

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
  const lastTurn = turns.at(-1)!.turnId;
  const initialItems = [
    item("condition:idm", "CONDITION", "infarctus du myocarde", firstTurn),
    item("intervention:colchicine", "INTERVENTION", "colchicine", firstTurn, "INTERVENTION_ARM"),
    item("comparator:placebo", "COMPARATOR", "placebo", firstTurn, "COMPARATOR_ARM"),
    item("design:multicentric", "STUDY_DESIGN", "étude multicentrique", firstTurn),
    item("modality:mri", "MODALITY", "IRM", firstTurn),
    item("measure:inflammation", "MEASURED_VARIABLE", "inflammation", firstTurn),
    item("measure:lesions", "MEASURED_VARIABLE", "lésions myocardiques", firstTurn),
    item("biomarker:blood", "BIOMARKER", "biomarqueurs sanguins", firstTurn),
    item("endpoint:infarct-size", "ENDPOINT", "taille de l’infarctus", firstTurn),
  ];
  const firstModificationItems = turns.length > 1 ? [
    ...(turns.length === 2 ? [item("timing:mri", "TEMPORAL_ELEMENT", "IRM entre J3 et J5", turns[1]!.turnId)] : []),
    item("criterion:age", "POPULATION_CRITERION", "âge maximal 75 ans", turns[1]!.turnId),
  ] : [];
  const laterModification = turns.length > 2 ? [
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
      runtimeVersion: "1.3.6",
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
          : "Évaluer l’effet de la colchicine après infarctus du myocarde, dans une étude multicentrique versus placebo, avec mesures IRM et biologiques.",
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
