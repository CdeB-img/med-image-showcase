import { describe, expect, it } from "vitest";
import { buildPersistentDeltaPayload } from "../../../../../api/protocol-designer-bridge-provider";
import {
  PERSISTENT_DELTA_SYSTEM_INSTRUCTION,
  PERSISTENT_PROJECT_RELATION_TYPES,
  contributionFromPersistentDelta,
  relevantProjectContext,
  validatePersistentProjectDelta,
  validatePersistentProviderContract,
  type PersistentProjectDeltaWireCandidate,
  type ProductBridgeRequest,
} from "@/features/protocol-designer/product-bridge";
import {
  prepareResearchProjectContributionCandidate,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation/contracts";
import adoptedA from "../../../../../validation/project-hands-on-02r3/a-adopted-state.json";
import historicalB from "../../../../../validation/project-hands-on-02r3/b-provider-exact.json";

const project = adoptedA.project as unknown as ResearchProjectOwnerProjection;
const RAW_B = "Oui, je veux démontrer l'efficacité du traitement sur la disparition totale de la plaque.";

const conversation = (raw: string): ScientificInterpretationConversation => ({
  conversationId: "conversation:project-hands-on-02r4",
  language: "fr",
  turns: [{ turnId: "turn:project-hands-on-02r4", role: "USER", content: raw }],
  interactionContext: {
    interactionRef: "qry:interaction:02r4",
    sourceActionRef: "qry:action:02r4",
    owner: "QUERY_NAVIGATION",
    purpose: "Préciser une information encore ouverte.",
    expectedResponseKind: "QRY_INFORMATION_RESPONSE",
    targetRefs: ["cand_objective_1"],
    informationNeedRefs: ["need:02r4"],
    projectRef: project.projectId,
    projectVersion: project.versionId,
    projectDigest: project.projectDigest,
  },
});

const change = (input: {
  operation?: "ADD" | "REMOVE" | "REPLACE";
  sourceText: string;
  candidateRef: string;
  targetProjectRef?: string;
  proposedType: string;
  content: string;
  epistemicState?: "KNOWN" | "ASSUMED" | "UNKNOWN" | "WITHHELD";
}) => ({
  operation: input.operation ?? "ADD",
  sourceText: input.sourceText,
  ...(input.targetProjectRef ? { targetProjectRef: input.targetProjectRef } : {}),
  candidateRef: input.candidateRef,
  proposedType: input.proposedType,
  content: input.content,
  polarity: "AFFIRMED" as const,
  epistemicStatus: "EXPLICIT_USER_STATED" as const,
  epistemicState: input.epistemicState ?? "KNOWN" as const,
  assertionKind: "USER_STATED" as const,
  evidenceRefs: [],
});

const relation = (input: {
  sourceText: string;
  relationType: string;
  sourceObjectRef: string;
  targetObjectRef: string;
}) => ({
  relationRef: `relation:${input.relationType.toLocaleLowerCase("en-US")}`,
  sourceText: input.sourceText,
  relationType: input.relationType,
  sourceObjectRef: input.sourceObjectRef,
  targetObjectRef: input.targetObjectRef,
  polarity: "AFFIRMED" as const,
  epistemicStatus: "EXPLICIT_USER_STATED" as const,
  epistemicState: "KNOWN" as const,
  assertionKind: "USER_STATED" as const,
  evidenceRefs: [],
});

const wire = (
  changes: PersistentProjectDeltaWireCandidate["changes"],
  relations: PersistentProjectDeltaWireCandidate["relations"] = [],
  temporalQualifications: PersistentProjectDeltaWireCandidate["temporalQualifications"] = [],
): PersistentProjectDeltaWireCandidate => ({ changes, relations, temporalQualifications, expectedVariableOccasions: [] });

describe("PROJECT-HANDS-ON-02R4 — source-grounded mutation and references", () => {
  it("audits immutable B evidence without treating it as corrected output", () => {
    const snapshot = historicalB.requestSnapshot.currentProject.canonicalState;
    const stableRefs = snapshot.objects.filter((object) => object.actuality === "CURRENT").map((object) => object.objectId);
    expect(stableRefs).toEqual(expect.arrayContaining([
      "cand_objective_1",
      "cand_intervention_1",
      "cand_comparator_1",
      "cand_modality_1",
    ]));

    const exact = historicalB.exactStructuredProviderArgs as PersistentProjectDeltaWireCandidate;
    expect(exact.changes[1]).toMatchObject({
      operation: "REMOVE",
      sourceText: "réduction des plaques carotiennes",
      targetProjectRef: "cand_objective_1",
    });
    expect(RAW_B).not.toContain(exact.changes[1]!.sourceText);
    expect(exact.relations[0]).toMatchObject({
      relationType: "TARGETS",
      sourceObjectRef: "obj_objective_new_1",
      targetObjectRef: "cand_objective_1",
    });
    expect(PERSISTENT_PROJECT_RELATION_TYPES).not.toContain("TARGETS");
    expect(validatePersistentProviderContract(exact).blocks).toContain("relation:0:RELATION_TYPE_OUTSIDE_PROVIDER_VOCABULARY");

    const replay = validatePersistentProjectDelta(exact, RAW_B, project, conversation(RAW_B));
    expect(replay.validation.blocks).toEqual(expect.arrayContaining([
      "change:1:SOURCE_TEXT_NOT_IN_USER_TURN",
      "relation:0:RELATION_TYPE_OUTSIDE_PROVIDER_VOCABULARY",
    ]));
    expect(replay.candidate).toBeNull();
  });

  it("R01–R05/R12 separates current source, mutation target and previous Project state", () => {
    const oldProjectText = "réduction des plaques carotiennes";
    const invalidRemove = wire([change({
      operation: "REMOVE",
      sourceText: oldProjectText,
      candidateRef: "candidate:remove-old-objective",
      targetProjectRef: "cand_objective_1",
      proposedType: "OBJECTIVE",
      content: oldProjectText,
    })]);
    const invalidReplace = wire([change({
      operation: "REPLACE",
      sourceText: oldProjectText,
      candidateRef: "candidate:replace-old-objective",
      targetProjectRef: "cand_objective_1",
      proposedType: "OBJECTIVE",
      content: "nouvel objectif",
    })]);
    expect(validatePersistentProjectDelta(invalidRemove, RAW_B, project, conversation(RAW_B)).validation.blocks)
      .toContain("change:0:SOURCE_TEXT_NOT_IN_USER_TURN");
    expect(validatePersistentProjectDelta(invalidReplace, RAW_B, project, conversation(RAW_B)).validation.blocks)
      .toContain("change:0:SOURCE_TEXT_NOT_IN_USER_TURN");

    const refinement = wire([change({
      sourceText: RAW_B,
      candidateRef: "candidate:objective:efficacy",
      proposedType: "OBJECTIVE",
      content: "Démontrer l'efficacité du traitement sur la disparition totale de la plaque",
    })]);
    const checkedRefinement = validatePersistentProjectDelta(refinement, RAW_B, project, conversation(RAW_B));
    expect(checkedRefinement.validation).toMatchObject({ valid: true, blocks: [] });
    expect(checkedRefinement.candidate?.changes).toHaveLength(1);
    expect(checkedRefinement.candidate?.changes.some((item) => item.operation === "REMOVE")).toBe(false);

    const correctionRaw = "Finalement, remplace cet objectif par la disparition complète de la plaque.";
    const explicitCorrection = wire([change({
      operation: "REPLACE",
      sourceText: correctionRaw,
      candidateRef: "candidate:objective:replacement",
      targetProjectRef: "cand_objective_1",
      proposedType: "OBJECTIVE",
      content: "Disparition complète de la plaque",
    })]);
    expect(validatePersistentProjectDelta(explicitCorrection, correctionRaw, project, conversation(correctionRaw)).validation)
      .toMatchObject({ valid: true, blocks: [] });
  });

  it("R06–R10 uses only Project-stable or candidate-local relation endpoints", () => {
    const raw = "Cet objectif motive la collecte d'une information complémentaire.";
    const dataNeed = change({
      sourceText: raw,
      candidateRef: "candidate:data-need:complement",
      proposedType: "DATA_NEED",
      content: "Information complémentaire",
    });
    const projectToCandidate = wire([dataNeed], [relation({
      sourceText: raw,
      relationType: "MOTIVATES_DATA_NEED",
      sourceObjectRef: "cand_objective_1",
      targetObjectRef: "candidate:data-need:complement",
    })]);
    expect(validatePersistentProjectDelta(projectToCandidate, raw, project, conversation(raw)).validation)
      .toMatchObject({ valid: true, blocks: [] });

    const candidateRaw = "Le traitement est comparé au placebo.";
    const candidateLocal = wire([
      change({ sourceText: candidateRaw, candidateRef: "candidate:intervention", proposedType: "INTERVENTION", content: "traitement" }),
      change({ sourceText: candidateRaw, candidateRef: "candidate:comparator", proposedType: "COMPARATOR", content: "contrôle" }),
    ], [relation({
      sourceText: candidateRaw,
      relationType: "COMPARES_WITH",
      sourceObjectRef: "candidate:intervention",
      targetObjectRef: "candidate:comparator",
    })]);
    expect(validatePersistentProjectDelta(candidateLocal, candidateRaw, project, conversation(candidateRaw)).validation.valid).toBe(true);

    for (const invalidRef of ["invented:objective", "réduction des plaques carotiennes", "QUESTION"]) {
      const invalid = wire([dataNeed], [relation({
        sourceText: raw,
        relationType: "MOTIVATES_DATA_NEED",
        sourceObjectRef: invalidRef,
        targetObjectRef: "candidate:data-need:complement",
      })]);
      const result = validatePersistentProjectDelta(invalid, raw, project, conversation(raw));
      expect(result.validation.blocks).toContain("relation:0:PROJECT_RELATION_ENDPOINT_INVALID");
      expect(result.candidate).toBeNull();
    }
  });

  it("R11–R15 preserves reference continuity and exposes mutations and relations in Human Review", () => {
    const correctionRaw = "Finalement, remplace cet objectif par la disparition complète de la plaque.";
    const replacement = wire([change({
      operation: "REPLACE",
      sourceText: correctionRaw,
      candidateRef: "candidate:objective:replacement-review",
      targetProjectRef: "cand_objective_1",
      proposedType: "OBJECTIVE",
      content: "Disparition complète de la plaque",
    })]);
    const checked = validatePersistentProjectDelta(replacement, correctionRaw, project, conversation(correctionRaw));
    const contribution = contributionFromPersistentDelta({
      candidate: checked.candidate!,
      conversation: conversation(correctionRaw),
      currentProject: project,
    })!;
    const prepared = prepareResearchProjectContributionCandidate(contribution, project);
    expect(prepared.canonicalChangeSet.objectChanges).toEqual(expect.arrayContaining([
      expect.objectContaining({ operation: "REPLACE", objectId: "cand_objective_1" }),
    ]));
    expect(prepared.humanReviewProjection.status).toBe("COMPLETE");
    const mutationReview = prepared.humanReviewProjection.sections.flatMap((section) => section.items.map((item) => item.content)).join("\n");
    expect(mutationReview).toContain("réduction des plaques carotiennes");
    expect(mutationReview).toMatch(/disparition complète de la plaque/i);

    const relationRaw = "Cet objectif motive la collecte d'une information complémentaire.";
    const related = wire([change({
      sourceText: relationRaw,
      candidateRef: "candidate:data-need:review",
      proposedType: "DATA_NEED",
      content: "Information complémentaire",
    })], [relation({
      sourceText: relationRaw,
      relationType: "MOTIVATES_DATA_NEED",
      sourceObjectRef: "cand_objective_1",
      targetObjectRef: "candidate:data-need:review",
    })]);
    const relatedChecked = validatePersistentProjectDelta(related, relationRaw, project, conversation(relationRaw));
    const relatedContribution = contributionFromPersistentDelta({ candidate: relatedChecked.candidate!, conversation: conversation(relationRaw), currentProject: project })!;
    const relatedPrepared = prepareResearchProjectContributionCandidate(relatedContribution, project);
    expect(relatedPrepared.humanReviewProjection.status).toBe("COMPLETE");
    const relationReview = relatedPrepared.humanReviewProjection.sections.flatMap((section) => section.items.map((item) => item.content)).join("\n");
    expect(relationReview).toContain("motive ce besoin de données");
    expect(relationReview).not.toContain("MOTIVATES_DATA_NEED");
    expect(relatedPrepared.canonicalChangeSet.relationChanges).toEqual(expect.arrayContaining([
      expect.objectContaining({ candidate: expect.objectContaining({ relationType: "MOTIVATES_DATA_NEED" }) }),
    ]));
  });

  it("R16–R18 leaves QRY, epistemic axes and temporal semantics unchanged", () => {
    const raw = "Une acquisition IRM est prévue à M3.";
    const context = conversation(raw);
    const qryBefore = structuredClone(context.interactionContext);
    const temporalCandidate = wire([
      change({
        sourceText: raw,
        candidateRef: "candidate:acquisition:mri",
        proposedType: "ACQUISITION",
        content: "Acquisition IRM",
        epistemicState: "UNKNOWN",
      }),
    ], [], [{
      operation: "ADD",
      qualificationId: "candidate:timing:m3",
      sourceText: "M3",
      subjectProjectRef: "candidate:acquisition:mri",
      temporalRole: "ACQUISITION_TIME",
      anchor: {
        kind: "TIMEPOINT",
        direction: "AT",
        unit: "MONTH",
        offset: 3,
        lowerBound: 3,
        upperBound: 3,
        relativeEventLabel: "M3",
        tolerance: null,
        reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" },
      },
      assertionKind: "USER_STATED",
      evidenceRefs: [],
    }]);
    const checked = validatePersistentProjectDelta(temporalCandidate, raw, project, context);
    expect(checked.validation).toMatchObject({ valid: true, blocks: [] });
    expect(checked.candidate?.changes[0]).toMatchObject({ epistemicStatus: "EXPLICIT_USER_STATED", epistemicState: "UNKNOWN" });
    expect(checked.candidate?.temporalQualifications[0]?.anchor).toMatchObject({
      offset: 3,
      reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" },
    });
    expect(context.interactionContext).toEqual(qryBefore);
  });

  it("the provider declaration exposes the stable/candidate namespaces and bounded relation vocabulary", () => {
    const request: ProductBridgeRequest = {
      apiVersion: "1.0.0",
      requestKind: "USER_TURN",
      conversation: conversation(RAW_B),
      currentProject: project,
      evaluatePersistentDelta: true,
    };
    const payload = buildPersistentDeltaPayload(request);
    const schema = payload.tools[0].functionDeclarations[0].parametersJsonSchema;
    expect(schema.properties.relations.items.properties.relationType.enum).toEqual(PERSISTENT_PROJECT_RELATION_TYPES);
    expect(schema.properties.changes.items.properties.sourceAnchorId.description).toContain("current-user source catalog");
    expect(schema.properties.changes.items.properties.targetProjectRef.description).toContain("Project Context Snapshot objects inventory");
    expect(schema.properties.relations.items.properties.sourceObjectRef.description).toContain("candidateRef");
    expect(PERSISTENT_DELTA_SYSTEM_INSTRUCTION).toContain("Project Context Snapshot est une mémoire en lecture seule");
    expect(PERSISTENT_DELTA_SYSTEM_INSTRUCTION).toContain("Une précision, un enrichissement ou un fait plus spécifique n'autorise pas");
    expect(relevantProjectContext(project)?.objects.map((object) => object.stableId)).toContain("cand_objective_1");
  });
});
