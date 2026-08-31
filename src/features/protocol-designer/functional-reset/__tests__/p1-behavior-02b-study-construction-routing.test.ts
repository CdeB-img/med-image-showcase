import { describe, expect, it } from "vitest";
import { buildPreProjectNavigationDecision, realizePreProjectNavigationDecision } from "@/features/query-navigation";
import { prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import { executeProductUnderstandInteraction, routeProductEntry } from "../product-entry-routing";
import {
  behaviorContribution,
  behaviorItem,
  behaviorTurn,
} from "./p1-behavior-01a-contract-fixtures";

const OBSERVED_AT = "2026-08-31T16:00:00.000Z";
const THROMBUS_INPUT = "je souhaite étudier les thrombus intraventriculaires gauches post IDM. ils sont souvent ratés a l'échographies et plus visibles à l'IRM. je voudrais donc faire un double protocole. évaluer le nombre de thrombus manqués à l'écho et detectés à l'IRM et évaluer le devenir clinique des patientss atteints de thrombus intra VG. pour cela nous allons nous concentrer sur les sus décalage ST antérieur";

const routed = (raw: string, id: string) => {
  const routing = routeProductEntry({
    raw,
    sourceTurnRef: `turn:p1-behavior-02b:${id}`,
    routedAt: OBSERVED_AT,
  });
  const decision = buildPreProjectNavigationDecision({ routing });
  return { routing, decision };
};

describe("P1-BEHAVIOR-02B — generic study-construction routing", () => {
  it.each([
    ["R-A", "Je veux créer une étude sur la réponse alpha.", "DESIGN_STUDY"],
    ["R-B", "Je voudrais conduire une étude pour évaluer la réponse alpha dans deux groupes.", "DESIGN_STUDY"],
    ["R-C", "Nous souhaitons définir un protocole de recherche sur la réponse alpha.", "DESIGN_STUDY"],
    ["R-D", "Nous allons recruter deux populations, comparer leurs résultats et recueillir la mesure gamma pour répondre à notre objectif de recherche.", "DESIGN_STUDY"],
    ["R-E", "Je veux comprendre pourquoi le phénomène alpha est associé au phénomène bêta.", "UNDERSTAND"],
    ["R-F", "Quelles sont les différences entre la méthode alpha et la méthode bêta ?", "UNDERSTAND"],
    ["R-G", "J’aimerais peut-être travailler sur le phénomène alpha.", "FORMALIZE_IDEA"],
    ["R-H", "Je souhaite construire un protocole de recherche sur le phénomène alpha.", "DESIGN_STUDY"],
  ] as const)("%s routes to %s", (id, raw, expected) => {
    const { routing } = routed(raw, id);
    expect(routing.routeIntent).toBe(expected);
    expect(routing.projectConstructionEligible).toBe(expected === "DESIGN_STUDY");
    expect(routing.projectWriteAuthorized).toBe(false);
  });

  it.each([
    "Je veux comprendre le fonctionnement d’un protocole de recherche publié.",
    "Quelles différences existe-t-il entre une cohorte et un essai randomisé ?",
    "Je souhaite comparer la méthode alpha et la méthode bêta sans construire d’étude ni de protocole.",
  ])("does not treat a knowledge comparison or explicit exclusion as study construction: %s", (raw) => {
    const { routing } = routed(raw, `negative:${raw}`);
    expect(routing.routeIntent).toBe("UNDERSTAND");
    expect(routing.projectConstructionEligible).toBe(false);
  });

  it("routes the fresh thrombus witness to the existing governed construction corridor", () => {
    const { routing, decision } = routed(THROMBUS_INPUT, "thrombus");
    const realization = realizePreProjectNavigationDecision({ decision });

    expect(routing).toMatchObject({
      routeIntent: "DESIGN_STUDY",
      routeConfidence: "HIGH",
      projectConstructionEligible: true,
      projectWriteAuthorized: false,
    });
    expect(routing.explicitScientificDimensions).toHaveLength(8);
    expect(decision).toMatchObject({
      owner: "QUERY_NAVIGATION",
      action: "PROPOSE",
      providerCalls: 0,
      projectWriteAuthorized: false,
      projectAdoptionAuthorized: false,
    });
    expect(realization.assistantReply).toMatch(/thrombus.*post IDM/iu);
    expect(realization.assistantReply).toMatch(/rat[ée]s.*[ée]chograph.*IRM/iu);
    expect(realization.assistantReply).toMatch(/thrombus manqu[ée]s.*[ée]cho.*IRM/iu);
    expect(realization.assistantReply).toMatch(/devenir clinique/iu);
    expect(realization.assistantReply).toMatch(/sus d[ée]calage ST ant[ée]rieur/iu);
    expect(realization.assistantReply).not.toMatch(/connaissance interne absente/iu);
  });

  it("keeps a structurally unknown topic in DESIGN_STUDY once construction intent is explicit", () => {
    const raw = "Je souhaite construire un protocole de recherche sur le phénomène oméga non documenté.";
    const { routing, decision } = routed(raw, "knowledge-gap");

    expect(routing).toMatchObject({ routeIntent: "DESIGN_STUDY", projectConstructionEligible: true });
    expect(decision).toMatchObject({ owner: "QUERY_NAVIGATION", action: "PROPOSE" });
    expect(() => executeProductUnderstandInteraction({ raw, decision: routing, createdAt: OBSERVED_AT }))
      .toThrow("PRODUCT_UNDERSTAND_ROUTE_REQUIRED");
  });

  it("keeps the thrombus candidate and Human Review corridor reachable without adopting a Project", () => {
    const turn = behaviorTurn("turn:p1-behavior-02b:thrombus-candidate", THROMBUS_INPUT);
    const candidateObjects = [
      behaviorItem({ itemId: "design:double-protocol", proposedType: "STUDY_DESIGN", content: "Double protocole de recherche", turnId: turn.turnId, sourceText: "faire un double protocole" }),
      behaviorItem({ itemId: "condition:post-idm-lv-thrombus", proposedType: "CONDITION", content: "Thrombus intraventriculaires gauches post-IDM", turnId: turn.turnId, sourceText: "thrombus intraventriculaires gauches post IDM" }),
      behaviorItem({ itemId: "modality:echo", proposedType: "IMAGING_MODALITY", content: "Échographie", turnId: turn.turnId, sourceText: "ratés a l'échographies" }),
      behaviorItem({ itemId: "modality:mri", proposedType: "IMAGING_MODALITY", content: "IRM", turnId: turn.turnId, sourceText: "plus visibles à l'IRM" }),
      behaviorItem({ itemId: "objective:detection", proposedType: "OBJECTIVE", content: "Évaluer les thrombus manqués à l’échographie et détectés à l’IRM", turnId: turn.turnId, sourceText: "évaluer le nombre de thrombus manqués à l'écho et detectés à l'IRM" }),
      behaviorItem({ itemId: "objective:clinical-outcome", proposedType: "OBJECTIVE", content: "Évaluer le devenir clinique des patients atteints de thrombus intra-VG", turnId: turn.turnId, sourceText: "évaluer le devenir clinique des patientss atteints de thrombus intra VG" }),
      behaviorItem({ itemId: "population:anterior-st-elevation", proposedType: "POPULATION", content: "Patients avec sus-décalage ST antérieur", turnId: turn.turnId, sourceText: "sus décalage ST antérieur" }),
    ];
    const contribution = behaviorContribution({
      contributionId: "contribution:p1-behavior-02b:thrombus",
      turns: [turn],
      candidateObjects,
    });
    const candidate = prepareResearchProjectContributionCandidate(contribution, null);
    const reviewContent = candidate.humanReviewProjection.sections
      .flatMap((section) => section.items.map((item) => item.content))
      .join("\n");

    expect(candidate).toMatchObject({
      status: "CANDIDATE_PENDING_HUMAN_CONFIRMATION",
      projectWriteAuthorized: false,
    });
    expect(candidate.changeSet).toMatchObject({ baseProjectVersion: null, status: "PENDING_HUMAN_CONFIRMATION" });
    expect(candidate.humanReviewProjection.status).toBe("COMPLETE");
    expect(reviewContent).toMatch(/thrombus intraventriculaires gauches post-IDM/iu);
    expect(reviewContent).toMatch(/[ée]chographie/iu);
    expect(reviewContent).toMatch(/IRM/iu);
    expect(reviewContent).toMatch(/devenir clinique/iu);
    expect(reviewContent).toMatch(/sus-d[ée]calage ST ant[ée]rieur/iu);
  });
});
