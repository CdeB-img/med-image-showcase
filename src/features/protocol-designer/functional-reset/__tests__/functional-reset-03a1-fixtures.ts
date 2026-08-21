import type {
  ContributionEpistemicBoundary,
  ScientificContributionItem,
  ScientificInterpretationContributionEnvelope,
  ScientificInterpretationTurn,
} from "@/features/scientific-interpretation/contracts";
import { COLCHICINE_INITIAL } from "./functional-reset-fixtures";

export const CHANGESET_INITIAL = COLCHICINE_INITIAL;
export const CHANGESET_AGE_TIMING = "L’âge maximal sera 75 ans et je préfère faire l’IRM entre J3 et J5.";
export const CHANGESET_SCOPE = "l’âge maximal est de 75 ans, pas l’ensemble de la population";
export const CHANGESET_REMOVE = "Finalement je ne veux plus utiliser les biomarqueurs sanguins.";
export const CHANGESET_REPEAT_REMOVE = "Je ne veux plus utiliser les biomarqueurs sanguins.";
export const CHANGESET_READD = "Finalement je veux remettre les biomarqueurs sanguins.";
export const CHANGESET_REPLACE_AGE = "Mets plutôt 80 ans maximum.";

const boundary = (turnId: string, activeState = true, epistemicStatus = "EXPLICIT_USER_STATED"): ContributionEpistemicBoundary => ({
  ownership: "SCIENTIFIC_INTERPRETATION",
  epistemicStatus,
  adoptionStatus: "CANDIDATE",
  activeState,
  sourceTurnIds: [turnId],
  sourceText: null,
});

const item = (input: {
  itemId: string;
  semanticIdentity: string;
  proposedType: string | null;
  content: string;
  turnId: string;
  studyRole?: string | null;
  polarity?: string | null;
  activeState?: boolean;
  previousItemIds?: string[];
}): ScientificContributionItem => ({
  itemId: input.itemId,
  semanticIdentity: input.semanticIdentity,
  proposedType: input.proposedType,
  content: input.content,
  polarity: input.polarity ?? "AFFIRMED",
  studyRole: input.studyRole ?? input.proposedType,
  confidence: 1,
  previousItemIds: input.previousItemIds ?? [],
  epistemicBoundary: boundary(input.turnId, input.activeState ?? true, input.polarity === "NEGATED" ? "REJECTED_BY_USER" : "EXPLICIT_USER_STATED"),
});

const baselineItems = (firstTurnId: string, biomarkerActive: boolean, biomarkerTurnId = firstTurnId) => [
  item({ itemId: "condition:idm", semanticIdentity: "myocardial-infarction", proposedType: "CONDITION", content: "infarctus du myocarde", turnId: firstTurnId }),
  item({ itemId: "intervention:colchicine", semanticIdentity: "colchicine", proposedType: "INTERVENTION", content: "colchicine", turnId: firstTurnId, studyRole: "INTERVENTION_ARM" }),
  item({ itemId: "comparator:placebo", semanticIdentity: "placebo", proposedType: "COMPARATOR", content: "placebo", turnId: firstTurnId, studyRole: "COMPARATOR_ARM" }),
  item({ itemId: "design:multicentric", semanticIdentity: "multicenter-study", proposedType: "STUDY_DESIGN", content: "étude multicentrique", turnId: firstTurnId }),
  item({ itemId: "modality:mri", semanticIdentity: "mri", proposedType: "MODALITY", content: "IRM", turnId: firstTurnId }),
  item({ itemId: "measure:inflammation", semanticIdentity: "inflammation", proposedType: "MEASURED_VARIABLE", content: "inflammation", turnId: firstTurnId }),
  item({ itemId: "measure:lesions", semanticIdentity: "mri-lesions", proposedType: "MEASURED_VARIABLE", content: "lésions en IRM", turnId: firstTurnId }),
  item({ itemId: "biomarker:blood", semanticIdentity: "blood-biomarkers", proposedType: "BIOMARKER", content: "biomarqueurs sanguins", turnId: biomarkerTurnId, activeState: biomarkerActive }),
  item({ itemId: "endpoint:infarct-size", semanticIdentity: "infarct-size", proposedType: "ENDPOINT", content: "taille de l’infarctus", turnId: firstTurnId }),
];

export const makeFunctionalReset03A1Contribution = (turns: ScientificInterpretationTurn[]): ScientificInterpretationContributionEnvelope => {
  const firstTurnId = turns[0]!.turnId;
  const stage = turns.length;
  const lastTurnId = turns.at(-1)!.turnId;
  const biomarkerActive = stage < 4 || stage >= 6;
  const biomarkerTurnId = stage >= 6 ? turns[5]!.turnId : firstTurnId;
  const age75 = stage >= 2 ? item({
    itemId: "criterion:age:max:75",
    semanticIdentity: "age-75-years",
    proposedType: "ELIGIBILITY_CRITERION",
    content: "75 ans",
    turnId: turns[1]!.turnId,
    studyRole: "ELIGIBILITY_CRITERION",
    activeState: stage < 7,
  }) : null;
  const age80 = stage >= 7 ? item({
    itemId: "criterion:age:max:80",
    semanticIdentity: "age-80-years",
    proposedType: "ELIGIBILITY_CRITERION",
    content: "80 ans maximum",
    turnId: lastTurnId,
    studyRole: "ELIGIBILITY_CRITERION",
    previousItemIds: ["criterion:age:max:75"],
  }) : null;
  const timing = stage >= 2 ? item({
    itemId: "timing:mri:j3-j5",
    semanticIdentity: "mri-timing-j3-j5",
    proposedType: "TIMEPOINT",
    content: "entre J3 et J5",
    turnId: turns[1]!.turnId,
    studyRole: "TIMEPOINT",
  }) : null;
  const removal = stage === 4 || stage === 5;
  const negation = removal ? item({
    itemId: `negation:biomarker:${stage}`,
    semanticIdentity: "blood-biomarkers-removal",
    proposedType: "CONSTRAINT",
    content: "ne plus utiliser les biomarqueurs sanguins",
    turnId: lastTurnId,
    studyRole: "BIOMARKER",
    polarity: "NEGATED",
    previousItemIds: ["biomarker:blood"],
  }) : null;
  const correction = removal ? item({
    itemId: `correction:biomarker:${stage}`,
    semanticIdentity: "blood-biomarkers-removal",
    proposedType: null,
    content: "retirer les biomarqueurs sanguins",
    turnId: lastTurnId,
    polarity: "NEGATED",
    previousItemIds: ["biomarker:blood"],
  }) : stage >= 7 ? item({
    itemId: "correction:age:80",
    semanticIdentity: "age-maximum-replacement",
    proposedType: null,
    content: "remplacer l’âge maximal de 75 par 80 ans",
    turnId: lastTurnId,
    previousItemIds: ["criterion:age:max:75"],
  }) : null;
  const scopeNegation = stage === 3 ? item({
    itemId: "negation:population-scope",
    semanticIdentity: "not-the-entire-population",
    proposedType: "CONSTRAINT",
    content: "pas l’ensemble de la population",
    turnId: lastTurnId,
    studyRole: "POPULATION",
    polarity: "NEGATED",
  }) : null;

  const candidateObjects = [
    ...baselineItems(firstTurnId, biomarkerActive, biomarkerTurnId),
    ...(age75 ? [age75] : []),
    ...(age80 ? [age80] : []),
  ];
  const explicitStatements = [
    item({ itemId: "statement:initial", semanticIdentity: "initial-study-statement", proposedType: "STATEMENT", content: CHANGESET_INITIAL, turnId: firstTurnId, studyRole: "DESIGN" }),
    ...(stage === 2 ? [item({ itemId: "statement:age-timing", semanticIdentity: "age-timing-statement", proposedType: "STATEMENT", content: CHANGESET_AGE_TIMING, turnId: lastTurnId, studyRole: "POPULATION" })] : []),
    ...(stage === 3 ? [item({ itemId: "statement:scope", semanticIdentity: "scope-statement", proposedType: "STATEMENT", content: CHANGESET_SCOPE, turnId: lastTurnId, studyRole: "POPULATION" })] : []),
  ];

  const contributionId = `contribution:changeset:${stage}`;
  return {
    contract: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ENVELOPE",
    contractNature: "RUNTIME_CONTRIBUTION_NOT_PD003_ROOT",
    identity: {
      contributionId,
      previousContributionId: stage > 1 ? `contribution:changeset:${stage - 1}` : null,
      contractVersion: "1.0.0",
      runtimeId: "HYBRID_PRIMARY_STRUCTURED",
      runtimeVersion: "1.3.6",
      createdAt: "2026-08-20T10:00:00.000Z",
      contributionDigest: `${contributionId}:digest`,
    },
    source: {
      conversationId: "conversation:changeset",
      originalRequest: turns.at(-1)!.content,
      turns,
      sourceRefs: turns.map((turn) => turn.turnId),
      rawOutputRef: `raw:${stage}`,
      rawOutputDigest: `raw:${stage}:digest`,
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
      normalizedUnderstanding: "The user wants to study colchicine after myocardial infarction.",
      routeProposal: null,
      explicitStatements,
      candidateObjects,
      candidateRelations: [{
        relationId: "relation:colchicine-placebo",
        relationType: "COMPARES_WITH",
        sourceItemId: "intervention:colchicine",
        targetItemId: "comparator:placebo",
        polarity: "AFFIRMED",
        confidence: 1,
        epistemicBoundary: boundary(firstTurnId),
      }],
      inferredContext: [],
      contextualCandidates: [],
      negationsAndConstraints: [negation, scopeNegation].filter((value): value is ScientificContributionItem => Boolean(value)),
      temporalElements: timing ? [timing] : [],
      ambiguities: [],
      unknowns: [],
      missingInformation: [],
      correctionsAndSupersessions: correction ? [correction] : [],
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
