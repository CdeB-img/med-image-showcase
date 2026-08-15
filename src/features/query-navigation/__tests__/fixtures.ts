import type { QueryNavigationSourceState } from "../contracts";
import { buildQueryNavigationContext } from "../adapters";

export const EMPTY_SOURCE_STATE: QueryNavigationSourceState = {
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
};

export const makeSourceState = (overrides: Partial<QueryNavigationSourceState> = {}): QueryNavigationSourceState => ({
  ...structuredClone(EMPTY_SOURCE_STATE),
  ...structuredClone(overrides),
});

export const makeContext = (sourceState: QueryNavigationSourceState = makeSourceState(), overrides: Partial<Parameters<typeof buildQueryNavigationContext>[0]> = {}) => buildQueryNavigationContext({
  projectRef: "project:fixture",
  projectVersion: "v1",
  sourceState,
  currentUsageRef: "PROTOCOL_DESIGN",
  ...overrides,
});

export const USER_UNKNOWN_STATE = makeSourceState({
  projectUnknowns: [{
    ref: "project:unknown:population",
    version: "v1",
    intent: "Préciser la population étudiée.",
    owner: "RESEARCH_PROJECT",
    decisionRefs: ["decision:population"],
    branchRefs: ["branch:design"],
  }],
});

export const TWO_OPTIONS_STATE = makeSourceState({
  planningDecisionRequirements: [{
    ref: "planning:decision:strategy",
    version: "1.0.0",
    domain: "BIOSTATISTICS",
    owner: "BIOSTATISTICS-001",
    intent: "Choisir la stratégie d'analyse.",
    decisionRefs: ["decision:strategy"],
    branchRefs: ["branch:analysis"],
    blockingLevel: "BLOCKING_FOR_PRIMARY_ANALYSIS",
    knownOptions: ["option:a", "option:b"],
  }],
});

export const NOT_EVALUABLE_STATE = makeSourceState({
  validationGates: [{
    gateId: "PROJECT_FREEZE",
    status: "NOT_EVALUABLE",
    runRefs: [],
    findingRefs: [],
    reviewRequestRefs: [],
    affectedBranchRefs: ["branch:freeze"],
    owner: "VAL-001",
    reason: "Aucun ValidationRun transverse persisté.",
  }],
});

export const SEMANTIC_REVIEW_STATE = makeSourceState({
  validationSemanticReviews: [{
    ref: "val:semantic-review:1",
    version: "1.0.0",
    owner: "VAL-001",
    reason: "Équivalence sémantique à revoir.",
    blocking: true,
    providerPolicy: "DISABLED_BY_DEFAULT",
    decisionRefs: [],
    branchRefs: ["branch:interpretation"],
  }],
});

export const HUMAN_REVIEW_STATE = makeSourceState({
  validationHumanReviews: [{
    ref: "val:human-review:1",
    version: "1.0.0",
    owner: "SCIENTIFIC_OWNER",
    reason: "Arbitrage humain requis.",
    blocking: true,
    decisionRefs: ["decision:review"],
    branchRefs: ["branch:project"],
  }],
});
