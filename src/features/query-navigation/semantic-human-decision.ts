import { conversationHumanIntentSchema, type ConversationHumanIntentContext } from "../scientific-thinking/conversation-human-intent.js";
import type { BoundedConversationInteraction } from "./current-turn-navigation.js";
import { logicalDigest } from "../knowledge-engine/canonical.js";

/** QRY validates ST meaning against native presentation. No language matching,
 * scientific equivalence, write, provider call or new navigation engine. */
export const bindSemanticHumanDecision = (context: ConversationHumanIntentContext, result: unknown): Readonly<{
  action: "CONFIRM" | "REFUSE" | "CORRECT" | "CLARIFY" | "NONE"; interaction?: BoundedConversationInteraction;
}> => {
  if (result === null || result === undefined) return { action: "NONE" };
  const parsed = conversationHumanIntentSchema.safeParse(result);
  if (!parsed.success) throw new Error("SEMANTIC_HUMAN_DECISION_SCHEMA_INVALID");
  const intent = parsed.data;
  const { inputDigest, ...binding } = context;
  if (logicalDigest(binding) !== inputDigest) throw new Error("SEMANTIC_HUMAN_DECISION_CONTEXT_INVALID");
  if (intent.inputDigest !== context.inputDigest) throw new Error("SEMANTIC_HUMAN_DECISION_BINDING_INVALID");
  if (intent.documentAction && !intent.acts.includes("DOCUMENT_REQUEST")) throw new Error("SEMANTIC_HUMAN_DECISION_SCOPE_INVALID");
  const partitions = [intent.acceptedChangeRefs, intent.rejectedChangeRefs, intent.correctedChangeRefs];
  const refs = partitions.flat();
  if (new Set(intent.acts).size !== intent.acts.length || new Set(refs).size !== refs.length)
    throw new Error("SEMANTIC_HUMAN_DECISION_SCOPE_INVALID");
  const presentation = context.presentation;
  const clarify = (): ReturnType<typeof bindSemanticHumanDecision> => ({ action: "CLARIFY", interaction: {
    kind: "CLARIFY_CANDIDATE_REFERENCE", evidenceRefs: [], clarificationReason: "DECISION_SCOPE",
    clarificationText: intent.clarification ?? "Quels éléments présentés souhaitez-vous retenir ou modifier ?",
  } });
  if (intent.unresolved || intent.acts.some(act => act === "AMBIGUOUS" || act === "CONDITIONAL")) return clarify();
  const decision = intent.acts.some(act => ["ACCEPT", "PARTIAL_ACCEPT", "REJECT"].includes(act));
  if (intent.referentRef !== null && intent.referentRef !== presentation?.ref)
    throw new Error("SEMANTIC_HUMAN_DECISION_REFERENT_INVALID");
  if (!presentation || !intent.referentRef || context.resolution === "AMBIGUOUS"
    || context.resolution === "STALE_OR_SUPERSEDED") return decision ? clarify() : { action: "NONE" };
  if (presentation.kind !== "NATIVE_CANDIDATE") {
    if (refs.length) throw new Error("SEMANTIC_HUMAN_DECISION_SCOPE_INVALID");
    return { action: "NONE" }; // conversational assent is not PRJ adoption
  }
  if (!presentation.presented || !presentation.presentationDigest || context.resolution !== "UNIQUE_CURRENT")
    return decision ? clarify() : { action: "NONE" };
  const allowed = presentation.items.map(item => item.changeRef);
  if (!allowed.length || new Set(allowed).size !== allowed.length || refs.some(ref => !allowed.includes(ref))
    || partitions.some(partition => presentation.scopeGroups.some(group => group.some(ref => partition.includes(ref))
      && !group.every(ref => partition.includes(ref))))) throw new Error("SEMANTIC_HUMAN_DECISION_SCOPE_INVALID");
  if (refs.length && (!presentation.scopeGroups.length
    || allowed.some(ref => !presentation.scopeGroups.some(group => group.includes(ref)))))
    throw new Error("SEMANTIC_HUMAN_DECISION_SCOPE_INVALID");
  if (intent.acceptedChangeRefs.length && !intent.acts.some(act => act === "ACCEPT" || act === "PARTIAL_ACCEPT")
    || intent.rejectedChangeRefs.length && !intent.acts.includes("REJECT")
    || intent.correctedChangeRefs.length && !intent.acts.includes("CORRECTION"))
    throw new Error("SEMANTIC_HUMAN_DECISION_SCOPE_INVALID");
  if (intent.acts.includes("ACCEPT") && (intent.acceptedChangeRefs.length !== allowed.length
    || !allowed.every(ref => intent.acceptedChangeRefs.includes(ref)))
    || intent.acts.includes("PARTIAL_ACCEPT") && !intent.acceptedChangeRefs.length
    || intent.acts.includes("REJECT") && !intent.rejectedChangeRefs.length)
    throw new Error("SEMANTIC_HUMAN_DECISION_SCOPE_INVALID");
  const evidenceRefs = [presentation.ref, presentation.sourceTurnRef!];
  if (intent.acceptedChangeRefs.length) return { action: "CONFIRM", interaction: {
    kind: "USER_CONFIRMS_CURRENT_CANDIDATE", evidenceRefs,
    selectedChangeRefs: intent.acceptedChangeRefs, refusedChangeRefs: intent.rejectedChangeRefs,
    correctionChangeRefs: intent.correctedChangeRefs,
  } };
  if (intent.rejectedChangeRefs.length && !intent.correctedChangeRefs.length) return { action: "REFUSE", interaction: {
    kind: "USER_REFUSES_CURRENT_CANDIDATE", evidenceRefs, selectedChangeRefs: intent.rejectedChangeRefs,
  } };
  if (intent.correctedChangeRefs.length) return { action: "CORRECT", interaction: {
    kind: "ACKNOWLEDGE_USER_DIRECTION", evidenceRefs,
    correctionChangeRefs: intent.correctedChangeRefs, refusedChangeRefs: intent.rejectedChangeRefs,
  } };
  return { action: "NONE" };
};
