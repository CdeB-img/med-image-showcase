import { describe, expect, it } from "vitest";
import { logicalDigest } from "@/features/knowledge-engine";
import type {
  ScientificContributionItem,
  ScientificInterpretationContributionEnvelope,
  ScientificInterpretationTurn,
} from "@/features/scientific-interpretation";
import {
  confirmResearchProjectContribution,
  ensureCanonicalProjectState,
  prepareResearchProjectContributionCandidate,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import {
  buildFunctionalResetQueryNavigation,
  buildFunctionalResetQuerySourceState,
} from "@/features/query-navigation";
import { createProductOwnerResultLedger } from "@/features/protocol-designer/product-owner-result-ledger";
import { createScientificExecutionTraceLedger } from "@/features/protocol-designer/scientific-execution-trace";
import {
  dispatchStudyDesignFromQuery,
  isStudyDesignQueryDispatch,
  resolveStudyDesignConversation,
} from "../study-design-standard";
import { makeFunctionalReset03A1Contribution } from "./functional-reset-03a1-fixtures";

const AT = "2026-09-03T08:00:00.000Z";
const authority = {
  actorRef: "researcher:p1-rde-04",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const turn = (suffix: string, content: string, createdAt = AT): ScientificInterpretationTurn => ({
  turnId: `turn:p1-rde-04:${suffix}`,
  role: "USER",
  content,
  createdAt,
});

const item = (input: {
  itemId: string;
  proposedType: string;
  content: string;
  sourceTurn: ScientificInterpretationTurn;
  studyRole?: string;
  epistemicState?: "KNOWN" | "UNKNOWN";
}): ScientificContributionItem => ({
  itemId: input.itemId,
  semanticIdentity: input.itemId,
  proposedType: input.proposedType,
  content: input.content,
  polarity: input.epistemicState === "UNKNOWN" ? "UNKNOWN" : "AFFIRMED",
  studyRole: input.studyRole ?? input.proposedType,
  confidence: input.epistemicState === "UNKNOWN" ? null : 1,
  previousItemIds: [],
  epistemicBoundary: {
    ownership: "SCIENTIFIC_INTERPRETATION",
    epistemicState: input.epistemicState ?? "KNOWN",
    epistemicStatus: "EXPLICIT_USER_STATED",
    adoptionStatus: "CANDIDATE",
    activeState: true,
    sourceTurnIds: [input.sourceTurn.turnId],
    sourceText: input.sourceTurn.content,
  },
});

const contribution = (
  suffix: string,
  sourceTurn: ScientificInterpretationTurn,
  candidateObjects: ScientificContributionItem[],
): ScientificInterpretationContributionEnvelope => {
  const base = makeFunctionalReset03A1Contribution([sourceTurn]);
  return {
    ...structuredClone(base),
    identity: {
      ...base.identity,
      contributionId: `contribution:p1-rde-04:${suffix}`,
      contributionDigest: logicalDigest({ suffix, source: sourceTurn.content, items: candidateObjects.map((candidate) => candidate.itemId) }),
    },
    source: {
      ...base.source,
      originalRequest: sourceTurn.content,
      turns: [sourceTurn],
      sourceRefs: [sourceTurn.turnId],
    },
    scientificContent: {
      ...structuredClone(base.scientificContent),
      explicitStatements: [],
      candidateObjects,
      candidateRelations: [],
      unknowns: [],
      ambiguities: [],
      temporalElements: [],
    },
  };
};

const witnessContribution = (designState: "KNOWN" | "UNKNOWN" = "UNKNOWN") => {
  const sourceTurn = turn(
    `witness-${designState.toLocaleLowerCase("en-US")}`,
    `Je veux étudier longitudinalement l’évolution des mesures en IRM et en échocardiographie. Des données d’imagerie historiques sont disponibles et une inclusion prospective est possible. ${designState === "UNKNOWN" ? "Je n’ai pas encore décidé du design de l’étude." : "J’ai retenu une cohorte longitudinale ambispective."}`,
  );
  return contribution(`witness-${designState.toLocaleLowerCase("en-US")}`, sourceTurn, [
    item({ itemId: `question:${designState}`, proposedType: "SCIENTIFIC_QUESTION", content: "Comment les mesures évoluent-elles longitudinalement en IRM et en échocardiographie ?", sourceTurn, studyRole: "SCIENTIFIC_QUESTION" }),
    item({ itemId: `objective:${designState}`, proposedType: "OBJECTIVE", content: "Caractériser l’évolution longitudinale des mesures", sourceTurn, studyRole: "PRIMARY" }),
    item({ itemId: `population:${designState}`, proposedType: "POPULATION", content: "Patients disposant d’une imagerie historique et pouvant être inclus prospectivement", sourceTurn }),
    item({ itemId: `eligibility:${designState}`, proposedType: "ELIGIBILITY_CRITERION", content: "Inclusion prospective possible", sourceTurn }),
    item({ itemId: `design:${designState}`, proposedType: "STUDY_DESIGN", content: designState === "UNKNOWN" ? "Design de l’étude non encore décidé" : "Cohorte longitudinale ambispective", sourceTurn, epistemicState: designState }),
    item({ itemId: `imaging:mri:${designState}`, proposedType: "IMAGING_MODALITY", content: "IRM", sourceTurn }),
    item({ itemId: `imaging:echo:${designState}`, proposedType: "IMAGING_MODALITY", content: "Échocardiographie", sourceTurn }),
    item({ itemId: `measurement:${designState}`, proposedType: "CANONICAL_VARIABLE", content: "Évolution longitudinale des mesures", sourceTurn, studyRole: "PRIMARY_OUTCOME" }),
    item({ itemId: `temporality:${designState}`, proposedType: "VISIT", content: "Données historiques puis suivi prospectif", sourceTurn }),
  ]);
};

const confirm = (
  material: ScientificInterpretationContributionEnvelope,
  projectId: string,
  current: ResearchProjectOwnerProjection | null = null,
  confirmedAt = AT,
) => confirmResearchProjectContribution({
  contribution: material,
  current,
  projectId,
  authority,
  confirmedAt,
});

const dispatch = (project: ResearchProjectOwnerProjection) => {
  const navigation = buildFunctionalResetQueryNavigation({ project, recordedAt: AT });
  return {
    navigation,
    result: dispatchStudyDesignFromQuery({
      project,
      navigation,
      ownerResultLedger: createProductOwnerResultLedger("session:p1-rde-04"),
      traceLedger: createScientificExecutionTraceLedger("session:p1-rde-04"),
      sessionId: "session:p1-rde-04",
      conversationId: "conversation:p1-rde-04",
      presentationTurnRef: "turn:p1-rde-04:presentation",
      startedAt: AT,
      completedAt: "2026-09-03T08:00:01.000Z",
    }),
  };
};

describe("P1-RDE-04 — UNKNOWN Study Design remains an open governed need", () => {
  it("A/C/E — preserves adopted UNKNOWN design while Project and QRY keep DESIGN unresolved", () => {
    const material = witnessContribution();
    const candidate = prepareResearchProjectContributionCandidate(material, null);
    expect(candidate.proposedSections.find((section) => section.sectionId === "DESIGN")?.state).toBe("TO_CLARIFY");

    const project = confirm(material, "research-project:p1-rde-04:witness");
    const designObject = ensureCanonicalProjectState(project).objects.find((object) => object.objectType === "STUDY_DESIGN" && object.actuality === "CURRENT");
    expect(designObject).toMatchObject({
      epistemicState: "UNKNOWN",
      adoptionStatus: "ADOPTED_BY_HUMAN_DECISION",
      actuality: "CURRENT",
      projection: expect.objectContaining({ sourcePolarity: "UNKNOWN" }),
    });
    expect(project.sections.find((section) => section.sectionId === "DESIGN")).toMatchObject({ state: "TO_CLARIFY" });

    const sourceState = buildFunctionalResetQuerySourceState(project);
    expect(sourceState.projectUnknowns).toEqual(expect.arrayContaining([
      expect.objectContaining({ decisionRefs: ["project-section:DESIGN"] }),
    ]));
  });

  it("B/I — a known adopted design resolves DESIGN and does not create a redundant design need", () => {
    const project = confirm(witnessContribution("KNOWN"), "research-project:p1-rde-04:known");
    expect(ensureCanonicalProjectState(project).objects.find((object) => object.objectType === "STUDY_DESIGN")).toMatchObject({ epistemicState: "KNOWN" });
    expect(project.sections.find((section) => section.sectionId === "DESIGN")?.state).toBe("DEFINED");
    expect(buildFunctionalResetQuerySourceState(project).projectUnknowns.some((need) => need.decisionRefs.includes("project-section:DESIGN"))).toBe(false);
    expect(buildFunctionalResetQueryNavigation({ project, recordedAt: AT }).currentAction?.affectedDecisionRefs).not.toContain("project-section:DESIGN");
  });

  it("D — applies the same unresolved completeness rule to a non-DESIGN section", () => {
    const sourceTurn = turn("unknown-intervention", "L’exposition étudiée n’est pas encore définie.");
    const material = contribution("unknown-intervention", sourceTurn, [
      item({ itemId: "intervention:unknown", proposedType: "INTERVENTION", content: "Exposition étudiée non encore définie", sourceTurn, epistemicState: "UNKNOWN" }),
    ]);
    const project = confirm(material, "research-project:p1-rde-04:unknown-intervention");
    expect(ensureCanonicalProjectState(project).objects.find((object) => object.sectionId === "INTERVENTION")).toMatchObject({ epistemicState: "UNKNOWN" });
    expect(project.sections.find((section) => section.sectionId === "INTERVENTION")?.state).toBe("TO_CLARIFY");
  });

  it("F/G/H/K — QRY selects the existing Study Design owner; discussion remains read-only", () => {
    const project = confirm(witnessContribution(), "research-project:p1-rde-04:dispatch");
    const before = structuredClone(project);
    const { navigation, result } = dispatch(project);

    expect(navigation.standardQuestion?.scopeSectionIds).toEqual(["DESIGN"]);
    expect(navigation.currentAction).toMatchObject({ owner: "STUDY_DESIGN" });
    expect(navigation.selection.selected?.capabilityRef).toBe("STUDY_DESIGN_COHERENCE");
    expect(isStudyDesignQueryDispatch(navigation)).toBe(true);
    expect(result.interaction).toMatchObject({ status: "ACTIVE", projectWriteAuthorized: false });
    expect(result.proposal.options.length).toBeGreaterThan(0);
    expect(result).toMatchObject({ providerCalls: 0, projectWrites: 0, humanDecisionCreated: false });
    expect(resolveStudyDesignConversation({
      raw: "quelle est concrètement la différence entre ces options dans mon cas ?",
      proposal: result.proposal,
    })).toMatchObject({ kind: "DISCUSS" });
    expect(project).toEqual(before);
  });

  it("J — UNKNOWN and KNOWN stay distinct across Project versioning", () => {
    const projectV1 = confirm(witnessContribution(), "research-project:p1-rde-04:versioning");
    const sourceTurn = turn("revision", "Ajouter une contrainte logistique explicite.", "2026-09-03T08:01:00.000Z");
    const revision = contribution("revision", sourceTurn, [
      item({ itemId: "constraint:logistics", proposedType: "CONSTRAINT", content: "Contrainte logistique explicite", sourceTurn }),
    ]);
    const projectV2 = confirm(revision, projectV1.projectId, projectV1, sourceTurn.createdAt);
    const currentDesign = ensureCanonicalProjectState(projectV2).objects.find((object) => object.objectType === "STUDY_DESIGN" && object.actuality === "CURRENT");
    expect(currentDesign).toMatchObject({ epistemicState: "UNKNOWN", adoptionStatus: "ADOPTED_BY_HUMAN_DECISION" });
    expect(projectV2.sections.find((section) => section.sectionId === "DESIGN")?.state).toBe("TO_CLARIFY");
  });
});
