import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { executeKnowledgeEngine } from "@/features/knowledge-engine";
import ProductUnderstandResponse from "../ProductUnderstandResponse";
import {
  executeProductUnderstandInteraction,
  routeProductEntry,
} from "../product-entry-routing";

const CASE_A = "Je voudrais comprendre la différence entre le no-reflow et l’obstruction microvasculaire après angioplastie avec pose de stent dans un STEMI, et comment on peut les étudier en IRM cardiaque.";
const CASE_B = "Je voudrais comprendre dans quelles situations l’ECV mesuré en IRM cardiaque et l’ECV mesuré en CT cardiaque sont réellement comparables pour étudier une fibrose myocardique diffuse";

const interactionFor = (raw: string) => {
  const decision = routeProductEntry({
    raw,
    sourceTurnRef: "turn:01g:test",
    routedAt: "2026-08-27T13:00:00.000Z",
  });
  return executeProductUnderstandInteraction({
    raw,
    decision,
    createdAt: "2026-08-27T13:00:01.000Z",
  });
};

describe("PRODUCT-CHECKPOINT-01G — governed UNDERSTAND synthesis", () => {
  afterEach(cleanup);

  it("A — answers Case B from the governed synthesis while preserving every requested dimension", () => {
    const interaction = interactionFor(CASE_B);
    const projection = interaction.presentation!.projection;
    expect(interaction.presentation!.contractVersion).toBe("1.1.0");
    expect(projection.answer).toMatch(/ECV myocardique mesuré en IRM/u);
    expect(projection.answer).toMatch(/ECV myocardique mesuré en CT/u);
    expect(projection.answer).toMatch(/méthode distincte/u);
    expect(projection.answer).toMatch(/dépendance à la méthode/u);
    expect(projection.answer).toMatch(/Aucune comparaison générale directe/u);
    expect(projection.requestSummary).toMatch(/fibrose myocardique diffuse/u);
    expect(projection.answer).not.toMatch(/universellement (?:équivalent|interchangeable)|seuil(?:s)? commun/iu);
    expect(interaction).toMatchObject({ projectWrites: 0, protocolProjections: 0, externalCalls: 0 });
  });

  it("B — keeps every substantive answer statement reconstructible from items, sources, gaps or contradictions", () => {
    const projection = interactionFor(CASE_B).presentation!.projection;
    expect(projection.answerStatements.length).toBeGreaterThanOrEqual(4);
    for (const statement of projection.answerStatements) {
      const supportCount = statement.support.knowledgeItemRefs.length
        + statement.support.sourceRefs.length
        + statement.support.gapRefs.length
        + statement.support.contradictionRefs.length
        + statement.support.coverageRefs.length;
      expect(supportCount, statement.text).toBeGreaterThan(0);
      if (["DIRECT_ANSWER", "SUPPORTING_CONTEXT"].includes(statement.role)) {
        expect(statement.support.knowledgeItemRefs.length, statement.text).toBeGreaterThan(0);
        expect(statement.support.sourceRefs.length, statement.text).toBeGreaterThan(0);
        expect(statement.support.locatorRefs.length, statement.text).toBeGreaterThan(0);
      }
    }
  });

  it("C — prioritizes answer-linked evidence without deleting the atomic Knowledge register", () => {
    const presentation = interactionFor(CASE_B).presentation!;
    expect(presentation.assertions.length).toBeGreaterThan(presentation.projection.supportedItems.length);
    expect(presentation.projection.supportedItems.length).toBeGreaterThan(0);
    expect(presentation.projection.supportedItems.every((item) => presentation.assertions.some((assertion) => assertion.assertionRef === item.id))).toBe(true);
    const unrelated = presentation.assertions.find((assertion) => !presentation.projection.supportedItems.some((item) => item.id === assertion.assertionRef));
    expect(unrelated).toBeTruthy();
    render(<ProductUnderstandResponse presentation={presentation} />);
    expect(screen.getByText(`Éléments reliés à la réponse (${presentation.projection.supportedItems.length})`)).toBeInTheDocument();
    expect(screen.queryByText(unrelated!.text)).not.toBeInTheDocument();
  });

  it("D — keeps Case A honest while exposing only its supported partial branch", () => {
    const result = executeKnowledgeEngine({ originalQuestion: CASE_A, createdAt: "2026-08-27T13:00:01.000Z" });
    const interaction = interactionFor(CASE_A);
    expect(result.synthesis.responseProfile.state).toBe("PARTIAL_ANSWER");
    expect(result.applicableAssertions.length).toBeGreaterThan(0);
    expect(result.documentaryStatements).toHaveLength(0);
    expect(interaction.presentation!.projection.coverageLabel).toBe("Réponse partielle");
    expect(interaction.assistantReply).toMatch(/no-reflow/u);
    expect(interaction.assistantReply).toMatch(/obstruction microvasculaire/u);
    expect(interaction.assistantReply).toMatch(/IRM/u);
    expect(interaction.assistantReply).not.toMatch(/différence scientifique (?:est|réside)/iu);
  });

  it("E — distinguishes a true no-applicable result from a partial scientific answer", () => {
    const raw = "Je voudrais comprendre la relation entre NX-UNMAPPED-77 et un phénomène scientifique non documenté.";
    const result = executeKnowledgeEngine({ originalQuestion: raw, createdAt: "2026-08-27T13:00:01.000Z" });
    const interaction = interactionFor(raw);
    expect(result.synthesis.responseProfile.state).toBe("NO_APPLICABLE_KNOWLEDGE");
    expect(interaction.presentation!.projection.answerStatements).toHaveLength(1);
    expect(interaction.presentation!.projection.answerStatements[0].support.gapRefs.length).toBeGreaterThan(0);
    expect(interaction.assistantReply).not.toMatch(/recherche externe (?:effectuée|lancée)/iu);
  });

  it("F — records direct, supporting, limiting, contradiction and gap channels deterministically", () => {
    const first = executeKnowledgeEngine({ originalQuestion: CASE_B, createdAt: "2026-08-27T13:00:01.000Z" });
    const second = executeKnowledgeEngine({ originalQuestion: CASE_B, createdAt: "2026-08-27T13:00:01.000Z" });
    expect(first.synthesis.digest).toBe(second.synthesis.digest);
    expect(first.synthesis.responseProfile).toMatchObject({
      state: "PARTIAL_ANSWER",
      directConclusionIds: expect.arrayContaining([expect.any(String)]),
      contextualLimitConclusionIds: expect.arrayContaining([expect.any(String)]),
      contradictionIds: expect.arrayContaining([expect.any(String)]),
      blockingGapIds: expect.arrayContaining([expect.any(String)]),
    });
    expect(first.synthesis.conclusions.find((item) => item.role === "DIRECT_RESPONSE")).toMatchObject({
      assertionId: expect.stringContaining("mr-ct-ecv-formulas-distinct"),
      sourceIds: expect.arrayContaining([expect.any(String)]),
      locator: expect.any(String),
    });
  });
});
