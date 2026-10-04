import type { TerraScientificResult } from "../contribution-discussion-retention";
import { emptyScientificDiscussionRetention } from "../contribution-discussion-retention";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { buildScientificDiscussionContext } from "../contribution-discussion-context";
import type { ProductBridgeRequest } from "../../product-bridge";

/** Mechanics fixture, not a semantic qualification of the source. Deliberately
 * PARTIAL by default: no test may infer old-source eviction from this mock. */
export const terraResultFixture = (reply: string): TerraScientificResult => ({
  reply, userContribution: { coverage: "PARTIAL", nonPersistentReason: null, elements: [] },
  assistantContribution: { coverage: "PARTIAL", nonPersistentReason: null, elements: [] },
  dispositions: [], candidateBindings: [],
});

/** Explicit first-owner declaration for purely technical byte-count fixtures.
 * Never use this for a scientific source or derive it from absent candidates. */
export const declaredNonScientificRetentionFixture = (conversation: ProductBridgeRequest["conversation"]) => ({
  ...emptyScientificDiscussionRetention(conversation.conversationId),
  sourceCoverage: conversation.turns.map(t => ({ turnRef: t.turnId, sourceDigest: logicalDigest(t.content),
    coverage: "COMPLETE" as const, elementRefs: [], nonPersistentReason: "NO_SCIENTIFIC_MEANING" as const })),
});
export const declaredNonScientificDiscussionFixture = (request: ProductBridgeRequest) => buildScientificDiscussionContext({
  conversationId: request.conversation.conversationId, runtimeTurns: request.conversation.turns,
  currentProject: request.currentProject, retained: [], retention: declaredNonScientificRetentionFixture(request.conversation),
});
