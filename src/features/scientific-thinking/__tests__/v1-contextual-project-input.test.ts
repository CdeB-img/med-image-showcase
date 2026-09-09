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

describe("V1 contextual Project input to Scientific Thinking", () => {
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
