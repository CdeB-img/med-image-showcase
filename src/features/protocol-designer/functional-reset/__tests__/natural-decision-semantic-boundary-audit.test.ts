import { describe, expect, it, vi } from "vitest";
import { executeProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { confirmResearchProjectContribution } from "@/features/research-project-construction";
import { buildBoundedConversationReferentContext, selectBoundedConversationInteraction } from "@/features/query-navigation/current-navigation-evidence";
import { terraScientificResultSchema } from "../contribution-discussion-retention";
import { readNaturalCandidateDecision } from "../natural-conversation-policy";
import { createFunctionalResetSession } from "../session";
import { behaviorAuthority, richStudyContribution } from "./p1-behavior-01a-contract-fixtures";
import type { ProductBridgeRequest, ProductBridgeResponse } from "../../product-bridge";

// CURRENT_GAP_CHARACTERIZATION: synthetic provider witnesses, not a language
// dictionary, semantic competence qualification or authority to adopt. These
// examples vary the input to the same existing ST call; no real network call.
const cases = [
  ["novel confirmation", "Cette proposition correspond exactement à mon choix ; vous avez mon accord pour la retenir.", "AFFIRMED"],
  ["novel refusal", "Cette option ne correspond pas à ce que je veux ; écartons-la.", "NEGATED"],
  ["partial correction", "Je garde la population proposée, mais pas le calendrier annoncé.", "AFFIRMED"],
  ["new information", "Notre recrutement s'effectuera dans deux services du même établissement.", "AFFIRMED"],
  ["continue only", "Avançons dans la discussion sans rien enregistrer pour l'instant.", "NEGATED"],
  ["document request", "Faites-moi parvenir un protocole à partir du projet actuel, sans le modifier.", "AFFIRMED"],
  ["conditional confirmation", "Mon accord dépend encore de l'obtention du financement.", "CONDITIONAL"],
  ["mixed acts", "Votre population me convient ; réduisez cependant le suivi à trois mois et expliquez le calcul d'effectif.", "AFFIRMED"],
] as const;

describe("natural decision — actual semantic boundary audit, no new recognizer", () => {
  it.each(cases)("%s: existing same-call scientific meaning is non-adopting, not a decision receipt", async (name, text, polarity) => {
    const session = createFunctionalResetSession("2026-10-09T00:00:00Z");
    const project = confirmResearchProjectContribution({ contribution: richStudyContribution(), current: null,
      projectId: session.projectId, authority: behaviorAuthority, confirmedAt: "2026-10-09T00:00:00Z" });
    const before = logicalDigest(project);
    const witness = { reply: `LOCAL_SYNTHETIC — ${name}, sans adoption.`,
      userContribution: { coverage: "COMPLETE", nonPersistentReason: null, elements: [
        { id: "user-meaning", content: text, epistemicState: "USER_STATED", polarity,
          conditions: polarity === "CONDITIONAL" ? ["obtention du financement"] : [], linkedIds: [] },
      ] },
      assistantContribution: { coverage: "PARTIAL", nonPersistentReason: null, elements: [] },
      dispositions: [], candidateBindings: [] };
    const request: ProductBridgeRequest = { apiVersion: "1.0.0", requestKind: "USER_TURN", currentProject: project,
      evaluatePersistentDelta: false,
      conversation: { conversationId: session.conversationId, language: "fr", turns: [
        { turnId: "human-audit", role: "USER", content: text, createdAt: "2026-10-09T00:01:00Z" },
      ] } };
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      id: "LOCAL_SYNTHETIC_ONLY", model: "gpt-5.6-terra", status: "completed",
      output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(witness) }] }],
    })));
    const result = await executeProtocolDesignerBridge({ body: request, apiKey: null, openAiApiKey: "LOCAL_SYNTHETIC_ONLY",
      chatRuntime: "TERRA", fetchImpl, providerAttemptPolicy: "SINGLE_ATTEMPT_FAIL_CLOSED" });
    expect(result.status).toBe(200);
    const body = result.body as ProductBridgeResponse;
    expect(body.scientificConversation?.retainedScientificResult).toEqual(witness);
    expect(body.scientificConversation).toMatchObject({ owner: "SCIENTIFIC_THINKING", responseOwner: "LLM",
      projectWriteAuthorized: false, projectWrites: 0 });
    expect(body.persistentExtraction.called).toBe(false);
    expect(logicalDigest(project)).toBe(before);
    expect(fetchImpl).toHaveBeenCalledTimes(1); // mocked existing call, no additional classifier call
    const schema = JSON.parse(String(fetchImpl.mock.calls[0]![1]!.body)).text.format.schema;
    expect(schema.properties).toHaveProperty("userContribution");
    expect(schema.properties).not.toHaveProperty("decisionInterpretation");
    expect(schema.properties).not.toHaveProperty("selectedChangeRefs");
  });

  it("rejects an invented decision field instead of silently treating prose as an authorization receipt", () => {
    const result = { reply: "LOCAL_SYNTHETIC — accord reconnu, sans adoption.",
      userContribution: { coverage: "PARTIAL", nonPersistentReason: null, elements: [] },
      assistantContribution: { coverage: "PARTIAL", nonPersistentReason: null, elements: [] }, dispositions: [], candidateBindings: [] };
    expect(terraScientificResultSchema.safeParse(result).success).toBe(true);
    expect(terraScientificResultSchema.safeParse({ ...result,
      decisionInterpretation: { act: "CONFIRM", selectedChangeRefs: ["unbound:change"] } }).success).toBe(false);
  });

  it.each(["vas-y", "Avançons sans changer le projet.", "Mon accord dépend encore du financement."])(
    "does not grant adoption when the scope is absent or uncertain: %s", sourceText => {
      const context = buildBoundedConversationReferentContext({ retained: [], currentProject: null,
        conversationId: "audit:no-presented-candidate", runtimeTurns: [] });
      expect(selectBoundedConversationInteraction({ sourceText, correctionMode: false, referentContext: context })?.kind)
        .not.toBe("USER_CONFIRMS_CURRENT_CANDIDATE");
      expect(readNaturalCandidateDecision(sourceText)).toBeNull();
    });
});
