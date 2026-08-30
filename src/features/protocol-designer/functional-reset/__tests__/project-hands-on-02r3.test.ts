import { describe, expect, it } from "vitest";
import { buildPersistentDeltaPayload } from "../../../../../api/protocol-designer-bridge-provider";
import {
  PERSISTENT_PROJECT_STUDY_ROLES,
  contributionFromPersistentDelta,
  validatePersistentProjectDelta,
  validatePersistentProviderContract,
  type PersistentProjectDeltaWireCandidate,
  type ProductBridgeRequest,
} from "@/features/protocol-designer/product-bridge";
import {
  prepareResearchProjectContributionCandidate,
  validateHumanReviewProjectionCoverage,
} from "@/features/research-project-construction";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation/contracts";
import c3Historical from "../../../../../validation/project-hands-on-02r1/c3-population-provider-evidence.json";
import c1Historical from "../../../../../validation/project-hands-on-02r2/project-hands-on-02r2-c1-001-provider-exact.json";

const raw = "Le traitement est comparé au contrôle, avec une mesure à M3.";
const conversation = (content = raw): ScientificInterpretationConversation => ({
  conversationId: "conversation:project-hands-on-02r3",
  language: "fr",
  turns: [{ turnId: "turn:project-hands-on-02r3", role: "USER", content }],
  interactionContext: {
    interactionRef: "qry:presentation:1",
    sourceActionRef: "qry:action:1",
    owner: "QUERY_NAVIGATION",
    purpose: "Préciser la portée du critère d'éligibilité.",
    expectedResponseKind: "QRY_INFORMATION_RESPONSE",
    targetRefs: ["project-section:POPULATION"],
    informationNeedRefs: ["need:antecedent-scope"],
    projectRef: null,
    projectVersion: null,
    projectDigest: null,
  },
});

const change = (input: {
  candidateRef: string;
  proposedType: string;
  content: string;
  sourceText?: string;
  studyRole?: string | null;
  epistemicState?: "KNOWN" | "ASSUMED" | "UNKNOWN" | "WITHHELD";
  operation?: "ADD" | "REMOVE" | "REPLACE";
  targetProjectRef?: string | null;
}) => ({
  operation: input.operation ?? "ADD",
  sourceText: input.sourceText ?? raw,
  ...(input.targetProjectRef === undefined ? {} : { targetProjectRef: input.targetProjectRef }),
  candidateRef: input.candidateRef,
  proposedType: input.proposedType,
  content: input.content,
  polarity: "AFFIRMED" as const,
  ...(input.studyRole === undefined ? {} : { studyRole: input.studyRole }),
  epistemicStatus: "EXPLICIT_USER_STATED" as const,
  epistemicState: input.epistemicState ?? "KNOWN" as const,
  assertionKind: "USER_STATED" as const,
  evidenceRefs: [],
});

const candidate = (changes: PersistentProjectDeltaWireCandidate["changes"], relations: PersistentProjectDeltaWireCandidate["relations"] = []): PersistentProjectDeltaWireCandidate => ({
  changes,
  relations,
  temporalQualifications: [],
  expectedVariableOccasions: [],
});

describe("PROJECT-HANDS-ON-02R3 — provider contract and epistemic axes", () => {
  it("corrects the Level-3 diagnosis without rewriting historical evidence", () => {
    const c1Args = c1Historical.exactStructuredProviderArgs;
    const serializedC1 = JSON.stringify(c1Args);
    expect(serializedC1).toContain("médicament");
    expect(serializedC1).toContain("placebo");
    expect(serializedC1).toContain("COMPARES_WITH");
    expect(serializedC1).toContain("réduction des plaques carotiennes");
    expect(serializedC1).toContain("IRM");
    expect(serializedC1).toContain('"offset":3');
    expect(serializedC1).toContain('"targetProjectRef":"null"');
    expect(serializedC1).toContain("PRIMARY_INTERVENTION");
    expect(serializedC1).toContain("PRIMARY_OBJECTIVE");

    const noHistory = c3Historical.extraction.providerArtifact.structuredArgsExact.changes
      .find((item) => item.sourceText === "sans antécédent");
    expect(noHistory).toMatchObject({
      epistemicStatus: "EXPLICIT_USER_STATED",
      content: "sans antécédent",
    });
    expect(noHistory).not.toHaveProperty("epistemicState");
  });

  it("N01–N02 function declaration makes targetProjectRef and studyRole honestly optional", () => {
    const request: ProductBridgeRequest = {
      apiVersion: "1.0.0",
      requestKind: "USER_TURN",
      conversation: conversation(),
      currentProject: null,
      evaluatePersistentDelta: true,
    };
    const schema = buildPersistentDeltaPayload(request).tools[0].functionDeclarations[0].parametersJsonSchema;
    const item = schema.properties.changes.items;
    expect(item.required).not.toContain("targetProjectRef");
    expect(item.required).not.toContain("studyRole");
    expect(item.properties.targetProjectRef.type).toBe("string");
    expect(item.properties.studyRole.type).toEqual(["string", "null"]);
    expect(item.properties.studyRole.enum).toEqual([...PERSISTENT_PROJECT_STUDY_ROLES, null]);
    expect(validatePersistentProviderContract(candidate([
      change({ candidateRef: "candidate:no-role", proposedType: "SCIENTIFIC_OBJECT", content: "cible", studyRole: null }),
    ]))).toEqual({ valid: true, blocks: [] });
  });

  it("N03–N05 validates ADD without a target, requires a REPLACE ref, and accepts candidate-local relations", () => {
    const added = candidate([
      change({ candidateRef: "candidate:intervention", proposedType: "INTERVENTION", content: "traitement", studyRole: "INTERVENTION_ARM" }),
      change({ candidateRef: "candidate:comparator", proposedType: "COMPARATOR", content: "contrôle", studyRole: "COMPARATOR_ARM" }),
    ], [{
      relationRef: "relation:comparison",
      sourceText: raw,
      relationType: "COMPARES_WITH",
      sourceObjectRef: "candidate:intervention",
      targetObjectRef: "candidate:comparator",
      polarity: "AFFIRMED",
      epistemicStatus: "EXPLICIT_USER_STATED",
      epistemicState: "KNOWN",
      assertionKind: "USER_STATED",
      proposalSourceText: null,
      evidenceRefs: [],
    }]);
    expect(validatePersistentProviderContract(added)).toEqual({ valid: true, blocks: [] });
    expect(validatePersistentProjectDelta(added, raw, null, conversation()).validation).toMatchObject({ valid: true, blocks: [] });

    const replaceWithoutRef = candidate([change({
      candidateRef: "candidate:replacement",
      proposedType: "INTERVENTION",
      content: "traitement modifié",
      operation: "REPLACE",
    })]);
    expect(validatePersistentProjectDelta(replaceWithoutRef, raw, null, conversation()).validation.blocks).toContain("change:0:PROJECT_REF_INVALID");
  });

  it("N06–N08 separates semantic type from source-grounded roles and forbids unsupported PRIMARY promotions", () => {
    const grounded = candidate([
      change({ candidateRef: "candidate:intervention", proposedType: "INTERVENTION", content: "traitement", studyRole: "INTERVENTION_ARM" }),
      change({ candidateRef: "candidate:comparator", proposedType: "COMPARATOR", content: "contrôle", studyRole: "COMPARATOR_ARM" }),
      change({ candidateRef: "candidate:purpose", proposedType: "SCIENTIFIC_OBJECT", content: "réduction", epistemicState: "UNKNOWN" }),
      change({ candidateRef: "candidate:objective", proposedType: "OBJECTIVE", content: "démontrer l'efficacité" }),
    ]);
    expect(validatePersistentProviderContract(grounded)).toEqual({ valid: true, blocks: [] });
    expect(grounded.changes.find((item) => item.candidateRef === "candidate:purpose")?.studyRole).toBeUndefined();
    expect(grounded.changes.find((item) => item.candidateRef === "candidate:objective")?.studyRole).toBeUndefined();

    for (const unsupported of ["PRIMARY_INTERVENTION", "PRIMARY_OBJECTIVE", "null"]) {
      const invalid = candidate([change({ candidateRef: `candidate:${unsupported}`, proposedType: "OBJECTIVE", content: "objectif", studyRole: unsupported })]);
      expect(validatePersistentProviderContract(invalid).valid).toBe(false);
    }
  });

  it("N09–N12 preserves explicit linguistic provenance beside UNKNOWN scope", () => {
    const source = "Population sans antécédent.";
    const underSpecified = candidate([change({
      candidateRef: "candidate:no-history",
      proposedType: "ELIGIBILITY_CRITERION",
      content: "Absence d'antécédent, portée non spécifiée",
      sourceText: source,
      epistemicState: "UNKNOWN",
    })]);
    const checked = validatePersistentProjectDelta(underSpecified, source, null, conversation(source));
    expect(checked.validation).toMatchObject({ valid: true, blocks: [] });
    const contribution = contributionFromPersistentDelta({ candidate: checked.candidate!, conversation: conversation(source), currentProject: null })!;
    const item = contribution.scientificContent.candidateObjects[0]!;
    expect(item.epistemicBoundary).toMatchObject({ epistemicStatus: "EXPLICIT_USER_STATED", epistemicState: "UNKNOWN" });

    const prepared = prepareResearchProjectContributionCandidate(contribution, null);
    expect(prepared.canonicalChangeSet.objectChanges[0]?.candidate).toMatchObject({
      epistemicState: "UNKNOWN",
      provenance: { sourcePlan: "USER", sourceText: source },
    });
    const reviewItem = prepared.humanReviewProjection.sections
      .flatMap((section) => section.items)
      .find((review) => review.content.includes("Absence d'antécédent"));
    expect(reviewItem).toMatchObject({
      content: "Absence d'antécédent, portée non spécifiée",
      statusLabel: "Reformulé",
      specificationLabel: "Détails à préciser",
    });
  });

  it("N13 rejects textual null sentinels instead of repairing them", () => {
    const targetSentinel = candidate([change({ candidateRef: "candidate:target-null", proposedType: "INTERVENTION", content: "traitement", targetProjectRef: "null" })]);
    expect(validatePersistentProviderContract(targetSentinel)).toMatchObject({ valid: false, blocks: ["change:0:TARGET_PROJECT_REF_SENTINEL_FORBIDDEN"] });
    expect(validatePersistentProjectDelta(targetSentinel, raw, null, conversation()).validation.blocks).toContain("change:0:ADD_MUST_NOT_TARGET_EXISTING_REF");
  });

  it("N14 preserves every explicit change in a multi-object turn", () => {
    const value = candidate([
      change({ candidateRef: "candidate:intervention", proposedType: "INTERVENTION", content: "traitement", studyRole: "INTERVENTION_ARM" }),
      change({ candidateRef: "candidate:comparator", proposedType: "COMPARATOR", content: "contrôle", studyRole: "COMPARATOR_ARM" }),
      change({ candidateRef: "candidate:timing", proposedType: "SCIENTIFIC_OBJECT", content: "M3", epistemicState: "UNKNOWN" }),
    ]);
    const checked = validatePersistentProjectDelta(value, raw, null, conversation());
    expect(checked.validation.acceptedChanges).toHaveLength(3);
    expect(checked.candidate?.changes.map((item) => item.candidateRef)).toEqual([
      "candidate:intervention",
      "candidate:comparator",
      "candidate:timing",
    ]);
  });

  it("N15 keeps Human Review fail-closed when one engaging change is hidden", () => {
    const value = candidate([
      change({ candidateRef: "candidate:intervention", proposedType: "INTERVENTION", content: "traitement" }),
      change({ candidateRef: "candidate:comparator", proposedType: "COMPARATOR", content: "contrôle" }),
    ]);
    const checked = validatePersistentProjectDelta(value, raw, null, conversation());
    const contribution = contributionFromPersistentDelta({ candidate: checked.candidate!, conversation: conversation(), currentProject: null })!;
    const prepared = prepareResearchProjectContributionCandidate(contribution, null);
    expect(prepared.humanReviewProjection.status).toBe("COMPLETE");
    const incomplete = {
      ...prepared.humanReviewProjection,
      sections: prepared.humanReviewProjection.sections.map((section, index) => index === 0 ? { ...section, items: section.items.slice(1) } : section),
    };
    expect(validateHumanReviewProjectionCoverage(prepared.canonicalChangeSet, incomplete).status).toBe("INCOMPLETE");
  });

  it("N16 leaves the QRY interaction context untouched", () => {
    const value = candidate([change({ candidateRef: "candidate:intervention", proposedType: "INTERVENTION", content: "traitement" })]);
    const context = conversation();
    const before = structuredClone(context.interactionContext);
    validatePersistentProjectDelta(value, raw, null, context);
    expect(context.interactionContext).toEqual(before);
  });
});
