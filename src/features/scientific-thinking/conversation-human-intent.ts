import { z } from "zod/v4";
import { logicalDigest } from "../knowledge-engine/canonical.js";
import type { ProductBridgeRequest } from "../protocol-designer/product-bridge.js";

/** Interpretation from the ordinary ST call, never PRJ authorization. */
export const conversationHumanIntentSchema = z.object({
  contractVersion: z.literal("1.0.0"), inputDigest: z.string().min(1),
  acts: z.array(z.enum(["ACCEPT", "REJECT", "PARTIAL_ACCEPT", "CORRECTION", "ADDITIONAL_INFORMATION",
    "CONTINUE_OR_EXPLAIN", "DOCUMENT_REQUEST", "AMBIGUOUS", "CONDITIONAL"])).min(1),
  referentRef: z.string().min(1).nullable(),
  acceptedChangeRefs: z.array(z.string().min(1)), rejectedChangeRefs: z.array(z.string().min(1)),
  correctedChangeRefs: z.array(z.string().min(1)), unresolved: z.boolean(),
  clarification: z.string().min(1).nullable(),
  documentAction: z.enum(["OPEN_CURRENT_PROTOCOL", "CREATE_PROTOCOL", "REGENERATE_PROTOCOL",
    "DOWNLOAD_PROTOCOL", "OPEN_STUDY_DELIVERABLES", "OPEN_EDC_EXPORT"]).nullable(),
}).strict();
export type ConversationHumanIntent = z.infer<typeof conversationHumanIntentSchema>;

/** Existing QRY projection; no duplicated source/adopted prose. */
export const buildConversationHumanIntentContext = (request: Pick<ProductBridgeRequest,
  "conversation" | "currentProject" | "boundedReferentContext">) => {
  const referent = request.boundedReferentContext;
  const index = request.conversation.turns.map(turn => turn.role).lastIndexOf("USER");
  const user = request.conversation.turns[index];
  if (!referent || !user) return null;
  const response = request.conversation.turns.slice(0, index).filter(turn => turn.role === "NOXIA").at(-1);
  const scope = referent.decisionScope;
  const context = {
    contract: "CONVERSATION_HUMAN_INTENT_CONTEXT_V1" as const,
    conversationId: request.conversation.conversationId,
    userTurnRef: user.turnId, userMessageDigest: logicalDigest(user.content),
    project: request.currentProject ? { projectId: request.currentProject.projectId,
      versionId: request.currentProject.versionId, projectDigest: request.currentProject.projectDigest } : null,
    referentContextDigest: logicalDigest(referent), resolution: referent.resolution,
    presentation: referent.candidateRef ? {
      kind: "NATIVE_CANDIDATE" as const, ref: referent.candidateRef,
      sourceTurnRef: referent.sourceTurnRef, sourceDigest: referent.sourceDigest,
      presented: scope?.presented === true, presentationDigest: scope?.presentationDigest ?? null,
      items: scope?.reviewItems.map(item => ({ changeRef: item.changeRef, content: item.content })) ?? [],
      scopeGroups: scope?.scopeGroups ?? [],
    } : referent.visibleProposal ? {
      kind: "VISIBLE_PROPOSAL" as const, ref: referent.visibleProposal.sourceResponseRef,
      displayDigest: referent.visibleProposal.displayDigest,
      optionRefs: referent.visibleProposal.options.map(option => option.ref),
    } : response ? { kind: "CONVERSATION_RESPONSE" as const, ref: response.turnId,
      displayDigest: logicalDigest(response.content) } : null,
  };
  return Object.freeze({ ...context, inputDigest: logicalDigest(context) });
};
export type ConversationHumanIntentContext = NonNullable<ReturnType<typeof buildConversationHumanIntentContext>>;

export const CONVERSATION_HUMAN_INTENT_INSTRUCTION = `
INTERPRÉTATION HUMAINE NATIVE, contrat 1.0.0 : humanIntent est une lecture sémantique non autoritaire du dernier USER dans HUMAN_DECISION_CONTEXT. Retourne null seulement si ce contexte manque. Copie son inputDigest exactement; n'invente ni digest ni référence.
Identifie les actes par leur sens et référent : ACCEPT, REJECT, PARTIAL_ACCEPT, CORRECTION, ADDITIONAL_INFORMATION, CONTINUE_OR_EXPLAIN, DOCUMENT_REQUEST, AMBIGUOUS, CONDITIONAL. Combine les actes réellement distincts. Une négation, un accord conditionnel ou une invitation à expliquer n'est pas un accord inconditionnel. Confirmer un fait n'autorise pas l'adoption d'une proposition. Si référent, portée ou condition sont incertains, unresolved=true et AMBIGUOUS/CONDITIONAL; demande une clarification ciblée dans reply sans ID technique.
referentRef identifie exactement la présentation visée, sinon null. Pour NATIVE_CANDIDATE, les tableaux acceptedChangeRefs/rejectedChangeRefs/correctedChangeRefs ne contiennent que des changeRef des items fournis. Un accord partiel n'autorise pas ses siblings. ACCEPT sur l'ensemble énumère chaque référence; PARTIAL_ACCEPT sélectionne uniquement les éléments concernés. Ne complète jamais une sélection avec des dépendances non autorisées; si les scopeGroups empêchent la séparation, unresolved=true. Refus et correction restent distincts des confirmations. Pour une proposition textuelle ou réponse, ces tableaux sont vides : aucun changeSet natif n'est adoptable.
documentAction reste null sauf demande documentaire explicite et suffisamment précise; utilise alors l'action Product Entry existante correspondante. Une mention documentaire n'est pas une commande. Une demande de génération ne confirme aucune proposition scientifique.
QRY/PRJ vérifient présentation, références, scope, Project, source, fraîcheur et autorité humaine. L'interprétation n'adopte rien. N'annonce aucun choix enregistré avant un reçu Project. Réponds aux explications et informations nouvelles dans le même appel, sans les absorber dans une confirmation.`;
