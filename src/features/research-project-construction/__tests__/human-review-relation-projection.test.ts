import { describe, expect, it } from "vitest";
import {
  buildHumanReviewProjection,
  type CanonicalProjectChangeSet,
} from "@/features/research-project-construction";

const RELATION_CASES = [
  ["COMPARES_WITH", "comparaison avec"],
  ["COMPARED_WITH", "comparaison avec"],
  ["MOTIVATES_DATA_NEED", "motive ce besoin de données"],
  ["COVERS_DATA_NEED", "couvre ce besoin de données"],
  ["OPERATIONALIZES", "met en œuvre"],
  ["UNMAPPED_INTERNAL_RELATION", "relation avec"],
] as const;

const changeSetFixture = (): CanonicalProjectChangeSet => ({
  contract: "PRJ001_CANONICAL_PROJECT_CHANGESET",
  contractVersion: "0.2.0",
  sourceContributionRef: "contribution:human-review-relation-projection",
  baseProjectVersion: null,
  status: "READY_FOR_HUMAN_DECISION",
  objectChanges: RELATION_CASES.flatMap((_relationCase, index) => ([
    {
      changeRef: `object-change:source:${index}`,
      operation: "ADD",
      objectId: `source:${index}`,
      previousVersionRef: null,
      candidate: {
        objectId: `source:${index}`,
        objectType: "PROJECT_INFORMATION",
        sectionId: "ANALYSIS",
        content: `Source ${index + 1}`,
        scientificRole: null,
        semanticKey: `ANALYSIS:SOURCE:${index}`,
        epistemicState: "KNOWN",
        provenance: {
          sourcePlan: "USER",
          assertionKind: "USER_STATED",
          sourceTurnRefs: ["turn:relation-projection"],
          sourceText: `Source ${index + 1}`,
          proposalSourceTurnRefs: [],
          adoptionSourceTurnRefs: [],
          evidenceRefs: [],
          evidenceQualification: "NOT_EVALUATED",
        },
        sourceContributionRef: "contribution:human-review-relation-projection",
        sourceItemRefs: [`source-item:${index}`],
        projection: {
          elementId: `source:${index}`,
          semanticKey: `ANALYSIS:SOURCE:${index}`,
          content: `Source ${index + 1}`,
          sourceItemIds: [`source-item:${index}`],
          sourceTurnIds: ["turn:relation-projection"],
          disposition: "USER_CONFIRMED_PROJECT_INFORMATION",
          canonicalPromotion: "NOT_PERFORMED",
        },
      },
    },
    {
      changeRef: `object-change:target:${index}`,
      operation: "ADD",
      objectId: `target:${index}`,
      previousVersionRef: null,
      candidate: {
        objectId: `target:${index}`,
        objectType: "DATA_NEED",
        sectionId: "ANALYSIS",
        content: `Cible ${index + 1}`,
        scientificRole: null,
        semanticKey: `ANALYSIS:TARGET:${index}`,
        epistemicState: "KNOWN",
        provenance: {
          sourcePlan: "USER",
          assertionKind: "USER_STATED",
          sourceTurnRefs: ["turn:relation-projection"],
          sourceText: `Cible ${index + 1}`,
          proposalSourceTurnRefs: [],
          adoptionSourceTurnRefs: [],
          evidenceRefs: [],
          evidenceQualification: "NOT_EVALUATED",
        },
        sourceContributionRef: "contribution:human-review-relation-projection",
        sourceItemRefs: [`target-item:${index}`],
        projection: {
          elementId: `target:${index}`,
          semanticKey: `ANALYSIS:TARGET:${index}`,
          content: `Cible ${index + 1}`,
          sourceItemIds: [`target-item:${index}`],
          sourceTurnIds: ["turn:relation-projection"],
          disposition: "USER_CONFIRMED_PROJECT_INFORMATION",
          canonicalPromotion: "NOT_PERFORMED",
        },
      },
    },
  ])),
  relationChanges: RELATION_CASES.map(([relationType], index) => ({
    changeRef: `relation-change:${index}`,
    operation: "ADD",
    relationId: `relation:${index}`,
    previousVersionRef: null,
    candidate: {
      relationId: `relation:${index}`,
      relationType,
      sourceObjectRef: `source:${index}`,
      targetObjectRef: `target:${index}`,
      polarity: "AFFIRMED",
      epistemicState: "KNOWN",
      provenance: {
        sourcePlan: "USER",
        assertionKind: "USER_STATED",
        sourceTurnRefs: ["turn:relation-projection"],
        sourceText: `Relation ${index + 1}`,
        proposalSourceTurnRefs: [],
        adoptionSourceTurnRefs: [],
        evidenceRefs: [],
        evidenceQualification: "NOT_EVALUATED",
      },
      sourceContributionRef: "contribution:human-review-relation-projection",
    },
  })),
  temporalQualificationChanges: [],
  expectedVariableOccasionChanges: [],
  legacyTemporalChanges: [],
  conflicts: [],
});

describe("HumanReviewProjection relation vocabulary", () => {
  it("humanizes every current product relation and never exposes an unknown token", () => {
    const changeSet = changeSetFixture();
    const canonicalBefore = structuredClone(changeSet);

    const projection = buildHumanReviewProjection(changeSet, null);
    const relationText = projection.sections
      .find((section) => section.label === "Relations")!
      .items.map((item) => item.content)
      .join("\n");

    for (const [relationType, humanLabel] of RELATION_CASES) {
      expect(relationText).toContain(humanLabel);
      expect(relationText).not.toContain(relationType);
    }
    expect(projection.status).toBe("COMPLETE");
    expect(changeSet).toEqual(canonicalBefore);
    expect(changeSet.relationChanges.map((change) => change.candidate?.relationType)).toEqual(
      RELATION_CASES.map(([relationType]) => relationType),
    );
  });
});
