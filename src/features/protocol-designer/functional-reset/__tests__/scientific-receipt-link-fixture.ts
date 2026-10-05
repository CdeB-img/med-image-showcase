import type { TerraScientificResult } from "../contribution-discussion-retention";

/** CURRENT_STRUCTURAL_INVARIANT: local contribution reference closure.
 * SOURCE_CLASS = SANITIZED_HISTORICAL_REPLAY; SANITIZATION = YES.
 * SOURCE_FAMILY = GPT-6.1 simple conversation, 2026-10-05, operation 510e11cc.
 * Only the observed IDs, link graph, cardinalities and enum states are replayed.
 * Scientific prose/condition below is synthetic and is NOT the original reply.
 * No claim of scientific-semantic fidelity or live generation qualification.
 */
export const scientificReceiptLinkFixture = (links: readonly [string[], string[], string[]]): TerraScientificResult => ({
  reply: "Un projet en IRM cardiaque pourrait étudier une association ; le critère principal reste à définir.",
  userContribution: { coverage: "COMPLETE", nonPersistentReason: null, elements: [{
    id: "u1", content: "Discuter d’un projet de recherche en IRM cardiaque", epistemicState: "USER_STATED",
    polarity: "AFFIRMED", conditions: [], linkedIds: [],
  }] },
  assistantContribution: { coverage: "COMPLETE", nonPersistentReason: null, elements: [{
    id: "a1", content: "Une étude d’association pourrait être proposée si la question est précisée",
    epistemicState: "PROPOSED_NOT_ADOPTED", polarity: "CONDITIONAL",
    conditions: ["Si la question scientifique est précisée"], linkedIds: [...links[0]],
  }, {
    id: "a2", content: "L’IRM cardiaque est une modalité envisagée, pas un protocole adopté",
    epistemicState: "PROPOSED_NOT_ADOPTED", polarity: "AFFIRMED", conditions: [], linkedIds: [...links[1]],
  }, {
    id: "a3", content: "Le critère principal demeure ouvert", epistemicState: "OPEN_UNKNOWN",
    polarity: "UNKNOWN", conditions: [], linkedIds: [...links[2]],
  }] },
  dispositions: [], candidateBindings: [],
});

// Exact observed invalid reference graph; not normalized/repaired on acceptance.
export const failedScientificReceiptLinkFixture = () => scientificReceiptLinkFixture([["u1"], ["u1"], ["u1", "a1"]]);

// Separately authored valid producer output, NOT an automatic repair of a reply.
export const validScientificReceiptLinkFixture = () => scientificReceiptLinkFixture([[], [], ["a1", "a2"]]);
