import { describe, expect, it, vi } from "vitest";
import { executeProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import { prepareTerraConversation, SCIENTIFIC_COLLABORATOR_INSTRUCTION } from "@/features/scientific-thinking/scientific-collaborator-conversation";
import { retainScientificDiscussionResult, terraScientificResultJsonSchema, terraScientificResultSchema,
  scientificDiscussionRetentionFailureDiagnostic, type TerraScientificResult } from "../contribution-discussion-retention";
import { behaviorTurn, behaviorItem, behaviorContribution, adoptBehaviorContribution } from "./p1-behavior-01a-contract-fixtures";
import type { ProductBridgeRequest, ProductBridgeResponse } from "../../product-bridge";

// CURRENT_SEMANTIC_INVARIANT: preserve materially unresolved procedure intent,
// provisional clinical suggestions and clear user facts. The classifications
// below are an explicit test oracle, not live model-quality evidence.
const element = (id: string, content: string, epistemicState: "USER_STATED" | "PROPOSED_NOT_ADOPTED" | "OPEN_UNKNOWN") =>
  ({ id, content, epistemicState, polarity: "CONDITIONAL" as const, conditions: [], linkedIds: [] });
const receipt = (kind: NonNullable<TerraScientificResult["contributionOutcome"]>): TerraScientificResult => ({
  contributionOutcome: kind,
  reply: kind === "ASK_CLARIFICATION" ? "La biopsie remplace-t-elle l’IRM ou s’ajoute-t-elle pour un sous-groupe ?"
    : kind === "PROPOSE_INTERPRETATION" ? "Je peux proposer une liste provisoire, à vérifier cliniquement avant de l’utiliser comme critère d’exclusion."
      : "Je retiens votre indication : monocentrique, adultes de 20 à 89 ans. L’effectif reste ouvert.",
  userContribution: { coverage: "COMPLETE", nonPersistentReason: null, elements: [
    element("intent", kind === "ASK_CLARIFICATION" ? "Biopsie envisagée ; remplacement de l’IRM ou ajout non précisé"
      : kind === "PROPOSE_INTERPRETATION" ? "Demande de proposition de médicaments à exclure"
        : "Étude monocentrique, population de 20 à 89 ans", "USER_STATED"),
  ] },
  assistantContribution: { coverage: "COMPLETE", nonPersistentReason: null, elements: [
    element("remaining", kind === "ASK_CLARIFICATION" ? "Rôle de la biopsie par rapport à l’IRM à clarifier"
      : kind === "PROPOSE_INTERPRETATION" ? "Liste médicamenteuse provisoire soumise à vérification clinique"
        : "Effectif non déterminé", kind === "PROPOSE_INTERPRETATION" ? "PROPOSED_NOT_ADOPTED" : "OPEN_UNKNOWN"),
  ] },
  dispositions: [], candidateBindings: [],
});
const adoptedMri = () => {
  const source = behaviorTurn("adopted-source", "Une IRM cardiaque est prévue.");
  return adoptBehaviorContribution(behaviorContribution({ contributionId: "mri-adoption", turns: [source],
    candidateObjects: [behaviorItem({ itemId: "mri", turnId: source.turnId, proposedType: "ACQUISITION", content: source.content })],
  }), null, 0);
};
const request = (text = "On fera une biopsie", evaluatePersistentDelta = false): ProductBridgeRequest => ({
  apiVersion: "1.0.0", conversation: { conversationId: "clarification-test", language: "fr",
    turns: [behaviorTurn("new-intent", text)] }, currentProject: adoptedMri(), evaluatePersistentDelta,
});

describe("conversational clarification before Project candidates", () => {
  it.each(["ACCEPT_AS_CLEAR", "PROPOSE_INTERPRETATION", "ASK_CLARIFICATION"] as const)(
    "retains %s as a successful scientific outcome without adoption or semantic loss", kind => {
      const value = receipt(kind), userTurn = behaviorTurn("u", value.userContribution.elements[0].content);
      const assistantTurn = { ...behaviorTurn("a", value.reply), role: "NOXIA" as const };
      const state = retainScientificDiscussionResult({ conversationId: "outcome-test",
        runtimeTurns: [userTurn, assistantTurn], userTurn, assistantTurn, result: value, retained: [] });
      expect(state.elements).toHaveLength(2);
      expect(state.elements[1]).toMatchObject({ content: value.assistantContribution.elements[0].content,
        status: kind === "PROPOSE_INTERPRETATION" ? "PROPOSED_NOT_ADOPTED" : "OPEN_UNKNOWN",
        candidateBinding: null, dispositionSourceRef: null });
      expect(state.elements.some(e => e.status === "ADOPTED")).toBe(false);
      expect(state.sourceCoverage.every(source => source.coverage === "COMPLETE")).toBe(true);
    });
  it("requires an explicit outcome for new structured outputs while reading historical receipts unchanged", () => {
    const schema = terraScientificResultJsonSchema();
    expect(schema.required).toContain("contributionOutcome");
    expect(schema.properties.contributionOutcome).toMatchObject({ enum: ["ACCEPT_AS_CLEAR", "PROPOSE_INTERPRETATION", "ASK_CLARIFICATION"] });
    const { contributionOutcome: _kind, ...legacy } = receipt("ACCEPT_AS_CLEAR");
    expect(terraScientificResultSchema.parse(legacy)).toEqual(legacy);
  });
  it("makes material clarification, clear intent and provisional clinical interpretation explicit upstream", () => {
    const prepared = prepareTerraConversation(request(), true);
    for (const mandate of [prepared.instruction, SCIENTIFIC_COLLABORATOR_INSTRUCTION]) {
      expect(mandate).toContain("ASK_CLARIFICATION");
      expect(mandate).toContain("Une question de clarification est une réponse scientifique réussie");
      expect(mandate).toContain("bornes de population explicitement donnés");
      expect(mandate).toContain("pas une liste validée");
      expect(mandate).toContain("remplacement ou ajout");
      expect(mandate).not.toMatch(/\b(?:IRM|biopsie)\b|20–89/u);
    }
    expect(JSON.parse(prepared.context).CURRENT_PROJECT.decisions.some((d: { content: string }) => d.content.includes("IRM"))).toBe(true);
  });
  it("delivers clarification-only text without failed conversation, candidate extraction or extra dispatch", async () => {
    const source = request("On fera une biopsie", true), before = JSON.stringify(source.currentProject);
    const value = receipt("ASK_CLARIFICATION");
    const provider = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ status: "completed",
      model: "LOCAL_SYNTHETIC", output_text: JSON.stringify(value),
      usage: { input_tokens: 100, output_tokens: 100, total_tokens: 200 } })));
    const result = await executeProtocolDesignerBridge({ body: source, apiKey: null,
      openAiApiKey: "OFFLINE_ONLY", chatRuntime: "TERRA", fetchImpl: provider });
    const body = result.body as ProductBridgeResponse;
    expect(result.status).toBe(200);
    expect(body.conversationFailure).toBeNull();
    expect(body.assistantReply).toBe(value.reply);
    expect(body.persistentExtraction).toMatchObject({ called: false, status: "NOT_REQUESTED", contribution: null });
    expect(body.observability.projectWrites).toBe(0);
    expect(provider).toHaveBeenCalledOnce();
    expect(JSON.stringify(source.currentProject)).toBe(before);
  });
  it.each(["NO_OPEN_MEANING", "CANDIDATE_BINDING", "DISPOSITION"] as const)(
    "rejects invalid clarification effects upstream: %s", branch => {
      const value = receipt("ASK_CLARIFICATION");
      if (branch === "NO_OPEN_MEANING") value.assistantContribution.elements[0].epistemicState = "PROPOSED_NOT_ADOPTED";
      if (branch === "CANDIDATE_BINDING") value.candidateBindings = [{ elementRef: "ref", candidateRef: "candidate", changeRef: "change" }];
      if (branch === "DISPOSITION") value.dispositions = [{ elementRef: "ref", status: "CLOSED", replacementId: null, explicitUserDirection: true }];
      const userTurn = behaviorTurn("u", "Biopsie envisagée, portée à clarifier.");
      const assistantTurn = { ...behaviorTurn("a", value.reply), role: "NOXIA" as const };
      try {
        retainScientificDiscussionResult({ conversationId: "invalid-outcome", runtimeTurns: [userTurn, assistantTurn],
          userTurn, assistantTurn, result: value, retained: [] });
        throw new Error("EXPECTED_REJECTION");
      } catch (error) {
        expect(scientificDiscussionRetentionFailureDiagnostic(error)?.firstFailedBranch)
          .toBe(branch === "NO_OPEN_MEANING" ? "CLARIFICATION_OPEN_MEANING" : "CLARIFICATION_DECISION_EFFECT");
      }
    });
});
