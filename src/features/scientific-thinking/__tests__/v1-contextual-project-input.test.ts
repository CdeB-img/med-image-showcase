import { describe, expect, it } from "vitest";
import {
  adoptBehaviorContribution,
  behaviorContribution,
  behaviorItem,
  behaviorRelation,
  behaviorTurn,
} from "@/features/protocol-designer/functional-reset/__tests__/p1-behavior-01a-contract-fixtures";
import {
  buildProjectContextSnapshot,
  buildScientificThinkingInputFromProjectSnapshot,
} from "@/features/research-project-construction";
import { executeScientificThinkingEngine } from "../engine";
import { makeThinkingInput } from "./fixtures";

const INITIAL_MESSAGE = "je veux faire une étude évaluant l'effet de méthodes de reperfusion post IDM avec mise en place immédiate ou différée d'un stent afin d'évaluer l'efficacité sur la viabilité myocardique. avec donc deux groupes en double aveugle, une IRM a J3-6 évaluant la cinétique segmentaire, le strain, le T1/T2, le précoce et tardif le critere de jugement principale étant la taille des lésions microvasculaire a 3min post injection";
const QRY_PURPOSE = "Formuler ou préciser la question scientifique à partir du contenu adopté.";
const EXPLICIT_OBJECTIVE = "Évaluer l'efficacité des stratégies de reperfusion sur la viabilité myocardique";

const adoptedInitialProject = () => {
  const turn = behaviorTurn("turn:v1-contextual-understanding:initial", INITIAL_MESSAGE);
  const contribution = behaviorContribution({
    contributionId: "contribution:v1-contextual-understanding:initial",
    turns: [turn],
    candidateObjects: [
      behaviorItem({ itemId: "objective:reperfusion", proposedType: "OBJECTIVE", content: EXPLICIT_OBJECTIVE, turnId: turn.turnId }),
      behaviorItem({ itemId: "condition:post-idm", proposedType: "CONDITION", content: "Contexte post-infarctus du myocarde (IDM)", turnId: turn.turnId }),
      behaviorItem({ itemId: "intervention:stent-immediate", proposedType: "INTERVENTION", content: "Mise en place immédiate d'un stent", turnId: turn.turnId, studyRole: "INTERVENTION_ARM" }),
      behaviorItem({ itemId: "comparator:stent-delayed", proposedType: "COMPARATOR", content: "Mise en place différée d'un stent", turnId: turn.turnId, studyRole: "COMPARATOR_ARM" }),
      behaviorItem({ itemId: "design:two-groups-blind", proposedType: "STUDY_DESIGN", content: "Deux groupes en double aveugle", turnId: turn.turnId }),
      behaviorItem({ itemId: "modality:mri", proposedType: "MODALITY", content: "Imagerie par résonance magnétique (IRM)", turnId: turn.turnId }),
      behaviorItem({ itemId: "acquisition:mri-j3-j6", proposedType: "ACQUISITION", content: "Acquisition IRM planifiée entre J3 et J6", turnId: turn.turnId }),
      behaviorItem({ itemId: "variable:motion", proposedType: "MEASURED_VARIABLE", content: "Cinétique segmentaire", turnId: turn.turnId }),
      behaviorItem({ itemId: "variable:strain", proposedType: "MEASURED_VARIABLE", content: "Strain", turnId: turn.turnId }),
      behaviorItem({ itemId: "variable:t1-t2", proposedType: "MEASURED_VARIABLE", content: "T1/T2", turnId: turn.turnId }),
      behaviorItem({ itemId: "endpoint:microvascular-lesions", proposedType: "ENDPOINT", content: "Taille des lésions microvasculaires à 3 min post-injection", turnId: turn.turnId, studyRole: "PRIMARY_ENDPOINT" }),
    ],
    relations: [
      behaviorRelation({
        relationId: "relation:stent-immediate-vs-delayed",
        relationType: "COMPARES_WITH",
        sourceItemId: "intervention:stent-immediate",
        targetItemId: "comparator:stent-delayed",
        turnId: turn.turnId,
      }),
    ],
  });
  return adoptBehaviorContribution(contribution, null, 41);
};

const adoptedGenericComparisonInput = (question: string) => {
  const turn = behaviorTurn("turn:structured-comparison", question);
  const contribution = behaviorContribution({
    contributionId: "contribution:structured-comparison",
    turns: [turn],
    candidateObjects: [
      behaviorItem({ itemId: "question:function", proposedType: "SCIENTIFIC_QUESTION", content: question, turnId: turn.turnId }),
      behaviorItem({ itemId: "objective:function", proposedType: "OBJECTIVE", content: "Décrire la capacité de marche", turnId: turn.turnId }),
      behaviorItem({ itemId: "condition:function", proposedType: "CONDITION", content: "Limitation fonctionnelle", turnId: turn.turnId }),
      behaviorItem({ itemId: "intervention:remote", proposedType: "INTERVENTION", content: "Suivi à distance", turnId: turn.turnId }),
      behaviorItem({ itemId: "comparator:onsite", proposedType: "COMPARATOR", content: "Suivi en consultation", turnId: turn.turnId }),
      behaviorItem({ itemId: "acquisition:walking", proposedType: "ACQUISITION", content: "Test de marche", turnId: turn.turnId }),
      behaviorItem({ itemId: "endpoint:walking", proposedType: "ENDPOINT", content: "Distance de marche", turnId: turn.turnId, studyRole: "PRIMARY_ENDPOINT" }),
    ],
    relations: [behaviorRelation({
      relationId: "relation:followup-comparison", relationType: "COMPARES_WITH",
      sourceItemId: "intervention:remote", targetItemId: "comparator:onsite", turnId: turn.turnId,
    })],
  });
  const project = adoptBehaviorContribution(contribution, null, 42);
  return buildScientificThinkingInputFromProjectSnapshot({ project });
};

describe("V1 contextual Project input to Scientific Thinking", () => {
  it.each([
    "Le format du suivi change-t-il la distance de marche des participants ?",
    "La distance de marche varie-t-elle selon le format du suivi ?",
  ])("preserves an adopted structured comparison without lexical or Knowledge support: %s", (question) => {
    const input = adoptedGenericComparisonInput(question);
    const before = JSON.stringify(input);
    const output = executeScientificThinkingEngine(input);

    expect(output.questions[0]).toMatchObject({ text: question, testability: "TESTABLE_CANDIDATE", scope: "BALANCED", reviewState: "PENDING", support: "UNAVAILABLE" });
    expect(output.hypotheses.length).toBeGreaterThan(0);
    expect(output.hypotheses.every((hypothesis) => hypothesis.reviewState === "PENDING")).toBe(true);
    expect(output.sourceProject?.projectDigest).toBe(input.researchContext.researchProjectDigest);
    expect(JSON.stringify(input)).toBe(before);
  });

  it.each(["NO_RELATION", "UNRESOLVED_REF", "NO_ADOPTED_PROVENANCE", "NO_ENDPOINT", "UNKNOWN_ENDPOINT", "NO_ADAPTER_PROVENANCE", "STALE_BINDING"] as const)(
    "does not infer a complete comparison when structural evidence is missing: %s", (gap) => {
      const question = "Le format du suivi change-t-il la distance de marche des participants ?";
      const input = adoptedGenericComparisonInput(question);
      if (gap === "NO_RELATION") input.relations = [];
      if (gap === "UNRESOLVED_REF") input.resolvedConcepts = input.resolvedConcepts.filter((item) => item.conceptId !== "intervention:remote");
      if (gap === "NO_ADOPTED_PROVENANCE") input.information.explicit = [];
      if (gap === "NO_ENDPOINT") input.outcomes = [];
      if (gap === "UNKNOWN_ENDPOINT") input.projectUnknowns.push({ objectRef: "endpoint:walking", objectType: "ENDPOINT", text: "Distance de marche" });
      if (gap === "NO_ADAPTER_PROVENANCE") input.information.interpreted = [];
      if (gap === "STALE_BINDING") input.scientificIntent.semanticModelDigest = "different-project-digest";

      const output = executeScientificThinkingEngine(input);
      expect(output.questions.some((item) => item.text === question && item.testability === "TESTABLE_CANDIDATE")).toBe(false);
    },
  );

  it("uses the explicit intervention comparison and primary endpoint instead of re-asking the phenomenon", () => {
    const project = adoptedInitialProject();
    const input = buildScientificThinkingInputFromProjectSnapshot({
      projectSnapshot: buildProjectContextSnapshot({ project }),
      projectRevision: project.revision,
      purpose: QRY_PURPOSE,
    });
    const output = executeScientificThinkingEngine(input);

    expect(input.scientificPurpose).toEqual([EXPLICIT_OBJECTIVE]);
    expect(input.validatedReformulation).toContain("Mise en place immédiate d'un stent");
    expect(input.validatedReformulation).toContain("Mise en place différée d'un stent");
    expect(input.validatedReformulation).toContain("Taille des lésions microvasculaires à 3 min post-injection");
    expect(output.questions).toHaveLength(1);
    expect(output.questions[0]).toMatchObject({
      questionId: "ST-Q-PROJECT-CONTEXT-001",
      kind: "PRIMARY",
      testability: "TESTABLE_CANDIDATE",
      sourceTerms: expect.arrayContaining([
        "Mise en place immédiate d'un stent",
        "Mise en place différée d'un stent",
        "Taille des lésions microvasculaires à 3 min post-injection",
        "Contexte post-infarctus du myocarde (IDM)",
      ]),
    });
    expect(output.questions[0].text).toBe("Observe-t-on une différence entre « Mise en place immédiate d'un stent » et « Mise en place différée d'un stent » pour le critère principal « Taille des lésions microvasculaires à 3 min post-injection », dans le contexte « post-infarctus du myocarde (IDM) » ?");
    expect(output.questions[0].text).not.toMatch(/Quel phénomène relatif à|indépendamment de la préférence déclarée/i);
    expect(output.questions[0].text).not.toMatch(/comparaison entre Imagerie par résonance magnétique.*Acquisition IRM/i);
  });

  it("does not infer a method comparison from two method-level objects and an unrelated 'ou'", () => {
    const input = makeThinkingInput({
      originalExpression: QRY_PURPOSE,
      validatedReformulation: QRY_PURPOSE,
      scientificObjectTerms: ["lésions microvasculaires"],
      pathologyOrCondition: ["infarctus du myocarde"],
      phenomena: ["lésions microvasculaires"],
      outcomes: ["taille des lésions microvasculaires"],
      methodsMentioned: ["Imagerie par résonance magnétique (IRM)", "Acquisition IRM planifiée"],
      relations: [],
    });

    const output = executeScientificThinkingEngine(input);
    expect(output.questions).toHaveLength(1);
    expect(output.questions.some((question) => question.kind === "METHODOLOGICAL_BRANCH")).toBe(false);
  });

  it("still recognizes an explicit comparison between two methods", () => {
    const input = makeThinkingInput({
      originalExpression: "Je veux comparer CT et IRM pour quantifier la fibrose.",
      validatedReformulation: "Je veux comparer CT et IRM pour quantifier la fibrose.",
      scientificObjectTerms: ["fibrose"],
      phenomena: ["fibrose"],
      outcomes: ["quantification de la fibrose"],
      methodsMentioned: ["CT", "IRM"],
      relations: ["comparaison méthodologique"],
    });

    const output = executeScientificThinkingEngine(input);
    expect(output.questions.some((question) => question.kind === "METHODOLOGICAL_BRANCH")).toBe(true);
  });
});
