import { describe, expect, it } from "vitest";
import {
  behaviorContribution,
  behaviorItem,
  behaviorTurn,
} from "@/features/protocol-designer/functional-reset/__tests__/p1-behavior-01a-contract-fixtures";
import { projectScientificContributionToV1IfAllowed } from "@/features/scientific-interpretation/v1-compatibility";
import {
  buildPreProjectNavigationDecision,
  realizePreProjectNavigationDecision,
} from "@/features/query-navigation";
import { routeProductEntry } from "@/features/protocol-designer/functional-reset/product-entry-routing";
import { buildPreProjectScientificThinkingIntervention } from "@/features/protocol-designer/functional-reset/scientific-thinking-standard";
import { buildScientificThinkingInput } from "../input";
import { executeScientificThinkingEngine } from "../engine";

const source = "je souhaite étudier les thrombus intraventriculaires gauches post IDM. ils sont souvent ratés a l'échographies et plus visibles à l'IRM. je voudrais donc faire un double protocole. évaluer le nombre de thrombus manqués à l'écho et detectés à l'IRM et évaluer le devenir clinique des patientss atteints de thrombus intra VG. pour cela nous allons nous concentrer sur les sus décalage ST antérieur";
const firstObjective = "Évaluer les thrombus manqués à l’échographie et détectés à l’IRM";
const secondObjective = "Évaluer le devenir clinique des patients atteints de thrombus intra-VG";

const projectInput = (includeUnknown = false) => {
  const turn = behaviorTurn("turn:pass3b:thrombus", source);
  const contribution = behaviorContribution({
    contributionId: "contribution:pass3b:thrombus",
    turns: [turn],
    candidateObjects: [
      behaviorItem({ itemId: "objective:detection", proposedType: "OBJECTIVE", content: firstObjective, turnId: turn.turnId }),
      behaviorItem({ itemId: "objective:clinical-outcome", proposedType: "OBJECTIVE", content: secondObjective, turnId: turn.turnId }),
      behaviorItem({ itemId: "population:anterior-st-elevation", proposedType: "POPULATION", content: "Patients avec sus-décalage ST antérieur", turnId: turn.turnId }),
      ...(includeUnknown ? [behaviorItem({
        itemId: "objective:unknown",
        proposedType: "OBJECTIVE",
        content: "Objectif non encore connu",
        turnId: turn.turnId,
        epistemicState: "UNKNOWN",
      })] : []),
    ],
  });
  const result = projectScientificContributionToV1IfAllowed(contribution);
  expect(result.projection).not.toBeNull();
  const projection = result.projection!;
  const input = buildScientificThinkingInput(
    projection.validatedIntent,
    projection.scientificSessionContext.preservedScientificTerms,
    projection.scientificSessionContext.detectedRelationships,
    null,
    { sessionId: "conversation:pass3b:thrombus", contextVersion: 1, sourceJourney: "DESIGN_STUDY" },
  );
  return { contribution, projection, input };
};

describe("PASS3B — OBJECTIVE candidate to Scientific Thinking input", () => {
  it("preserves explicit known objectives 1:1, verbatim and in source order", () => {
    const { contribution, projection, input } = projectInput();

    expect(input.scientificPurpose).toEqual([firstObjective, secondObjective]);
    expect(input.scientificObjectTerms).toEqual([]);
    expect(input.population).toEqual(["Patients avec sus-décalage ST antérieur"]);
    expect(input.methodsMentioned).toEqual(["échographie", "IRM"]);
    expect(input.researchContext.researchProjectId).toBeNull();
    expect(projection.validatedIntent.interpretationContributionSnapshot?.projectWriteAuthorized).toBe(false);
    expect(contribution.epistemicBoundary.candidateIsAdopted).toBe(false);
    expect(projection.losses).not.toContainEqual(expect.objectContaining({ itemId: "objective:detection" }));
    expect(projection.losses).not.toContainEqual(expect.objectContaining({ itemId: "objective:clinical-outcome" }));

    const output = executeScientificThinkingEngine(input);
    expect(output.adaptiveQuestions).toEqual([expect.objectContaining({
      questionId: "ST-AQ-OBJECTIVE-STRUCTURE",
      decisionBlock: "SCOPE",
      blocking: true,
      label: expect.stringContaining(firstObjective),
    })]);
    expect(output.adaptiveQuestions[0]?.label).toContain(secondObjective);
    expect(output.adaptiveQuestions[0]?.suggestedAnswers.map((answer) => answer.value)).toEqual(["coordinated-study", "distinct-studies"]);
    expect(output.projectWriteAuthorized).toBe(false);
    expect(output.candidateIsAdopted).toBe(false);
  });

  it("does not promote an UNKNOWN objective into scientificPurpose", () => {
    const { projection, input } = projectInput(true);

    expect(input.scientificPurpose).toEqual([firstObjective, secondObjective]);
    expect(input.scientificObjectTerms).toEqual([]);
    expect(projection.losses).toContainEqual(expect.objectContaining({
      code: "LEGACY_PROJECTION_LOSS",
      itemId: "objective:unknown",
    }));
  });

  it("lets QRY select the useful Scientific Thinking scope question while HOW stays local", () => {
    const { contribution } = projectInput();
    const routing = routeProductEntry({
      raw: source,
      sourceTurnRef: "turn:pass3b:thrombus",
      routedAt: "2026-09-09T12:00:00.000Z",
    });
    const intervention = buildPreProjectScientificThinkingIntervention({
      contribution,
      sessionId: "session:pass3b:thrombus",
      sourceJourney: "DESIGN_STUDY",
    });
    expect(intervention).not.toBeNull();
    const decision = buildPreProjectNavigationDecision({
      routing,
      scientificContribution: intervention!.navigationContribution,
    });
    const realized = realizePreProjectNavigationDecision({ decision });

    expect(decision.owner).toBe("QUERY_NAVIGATION");
    expect(decision.action).toBe("ASK_QUESTION");
    expect(decision.selection.selected).toMatchObject({
      owner: "QUERY_NAVIGATION",
      provenance: { owner: "SCIENTIFIC_THINKING" },
      projectWriteAuthorized: false,
    });
    expect(decision.selectedInformationNeed).toContain(firstObjective);
    expect(decision.selectedInformationNeed).toContain(secondObjective);
    expect(decision.alreadyProvidedInformationRefs).toEqual(routing.explicitScientificDimensions.map((dimension) => dimension.dimensionRef));
    expect(realized).toMatchObject({
      executor: "LOCAL_DETERMINISTIC_REALIZATION",
      provider: "NONE",
      providerCallsPerformedByRealizer: 0,
      projectWriteAuthorized: false,
    });
    expect(realized.assistantReply).toBe(decision.selectedInformationNeed);
  });
});
