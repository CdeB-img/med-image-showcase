import { describe, expect, it } from "vitest";
import { stableTemplateStringify } from "../canonical.ts";
import { composeStudyTemplateInstance } from "../composition.ts";
import { TEMPLATE_BLOCK_STATUSES, TEMPLATE_NODE_KINDS, TEMPLATE_RELATION_TYPES } from "../types.ts";
import { makeTemplateDecision, makeTemplateInput } from "./fixtures.ts";

const node = (instance: ReturnType<typeof composeStudyTemplateInstance>, nodeId: string) => instance.nodes.find((item) => item.nodeId === nodeId)!;

describe("TMP-001 composition cases A–G", () => {
  it("A — compose une structure de base sans document ni protocole", () => {
    const instance = composeStudyTemplateInstance(makeTemplateInput());
    expect(instance.boundary).toBe("LOGICAL_STRUCTURE_ONLY_NOT_A_DOCUMENT_NOT_A_PROTOCOL_NOT_A_DECISION");
    expect(instance.documents.length).toBeGreaterThanOrEqual(20);
    expect(instance).not.toHaveProperty("projectionId");
    expect(instance).not.toHaveProperty("content");
    expect(node(instance, "TMP-NODE:PROJECT_IDENTITY").status).toBe("REQUIRED");
  });

  it("B — conserve un axe Imaging explicitement non applicable avec preuve d’exclusion", () => {
    const instance = composeStudyTemplateInstance(makeTemplateInput());
    const imaging = node(instance, "TMP-NODE:IMAGING_CONTRIBUTION");
    expect(imaging.status).toBe("NOT_APPLICABLE");
    expect(imaging.supports.some((support) => support.supportLevel === "EXCLUSION")).toBe(true);
    expect(instance.familyProfiles.find((family) => family.familyId === "IMAGING")?.status).toBe("NOT_APPLICABLE");
  });

  it("C — active plusieurs axes simultanément sans branche unique", () => {
    const instance = composeStudyTemplateInstance(makeTemplateInput({
      phrc: true,
      projectTransform: (project) => ({
        ...project,
        imagingContribution: { ...project.imagingContribution, applicability: "APPLICABLE", resultRef: "img:fixture", projectHandoffReadiness: "PROJECT_HANDOFF_READY" },
      }),
    }));
    const applicable = instance.familyProfiles.filter((family) => family.status === "APPLICABLE").map((family) => family.familyId);
    expect(applicable).toEqual(expect.arrayContaining(["CLINICAL_STUDY", "OBSERVATIONAL", "IMAGING", "PHRC"]));
  });

  it("D — ne renforce jamais un bloc sur la seule base d’un pattern", () => {
    const input = makeTemplateInput();
    const emptyRequirements = {
      ...input.applicableRequirementSet,
      applicableRequirements: [], potentiallyApplicableRequirements: [], notApplicableRequirements: [], unresolvedRequirements: [], regulatoryMandatoryRequirements: [],
      fundingRequirements: [], documentRequirements: [], submissionRequirements: [], approvalRequirements: [], methodologicalGuidance: [], reportingGuidance: [],
    };
    const instance = composeStudyTemplateInstance({ ...input, applicableRequirementSet: emptyRequirements });
    const synopsis = node(instance, "TMP-DOC:SYNOPSIS");
    expect(synopsis.supports.some((support) => support.kind === "DOCUMENTARY_SUPPORT")).toBe(true);
    expect(synopsis.status).not.toBe("REQUIRED");
    expect(synopsis.supports.filter((support) => support.kind === "DOCUMENTARY_SUPPORT").every((support) => support.supportLevel === "REFERENCE_ONLY")).toBe(true);
  });

  it("E — conserve une inconnue comme UNKNOWN et la rend traçable", () => {
    const instance = composeStudyTemplateInstance(makeTemplateInput({ declaredUnknowns: [{ unknownId: "unknown:endpoint", field: "endpoint.primary", reason: "Critère principal non arrêté.", provenance: ["human:fixture"] }] }));
    const endpoints = node(instance, "TMP-NODE:ENDPOINTS");
    expect(endpoints.status).toBe("UNKNOWN");
    expect(endpoints.unknownRefs.length).toBeGreaterThan(0);
  });

  it("F — expose un conflit ouvert et ne l’arbitre pas", () => {
    const decisions = [
      makeTemplateDecision("decision:one", ["TMP-DOC:RISK_PLAN"], "REQUIRED"),
      makeTemplateDecision("decision:two", ["TMP-DOC:RISK_PLAN"], "OPTIONAL"),
    ];
    const instance = composeStudyTemplateInstance(makeTemplateInput({ humanDecisions: decisions }));
    expect(node(instance, "TMP-DOC:RISK_PLAN").status).toBe("CONFLICTING");
    expect(instance.conflicts).toHaveLength(1);
    expect(instance.conflicts[0].humanDecisionRequired).toBe(true);
    expect(instance.relations.some((relation) => relation.type === "CONFLICTS_WITH")).toBe(true);
  });

  it("G — conserve les blocs futurs même en vue minimale", () => {
    const input = { ...makeTemplateInput(), requestedDetailLevel: "MINIMAL" as const };
    const instance = composeStudyTemplateInstance(input);
    const futureDefinitions = instance.nodes.filter((item) => item.kind === "FUTURE_BLOCK");
    expect(futureDefinitions.length).toBeGreaterThan(0);
    expect(futureDefinitions.every((item) => ["FUTURE", "BLOCKED", "UNKNOWN", "CONFLICTING", "NOT_APPLICABLE"].includes(item.status))).toBe(true);
  });
});

describe("TMP-001 statuses, provenance and determinism", () => {
  it("supporte explicitement les huit statuts et les quatorze relations", () => {
    const decisions = [
      makeTemplateDecision("decision:required", ["TMP-DOC:PROTOCOL"], "REQUIRED"),
      makeTemplateDecision("decision:optional", ["TMP-NODE:REVIEW_NOTES"], "OPTIONAL"),
      makeTemplateDecision("decision:not-applicable", ["TMP-DOC:PATIENT_INFORMATION"], "NOT_APPLICABLE"),
      makeTemplateDecision("decision:blocked", ["TMP-DOC:CORE_LAB_MANUAL"], "BLOCKED"),
      makeTemplateDecision("decision:conditional", ["TMP-DOC:SYNOPSIS"], "CONDITIONAL"),
      makeTemplateDecision("decision:conflict-a", ["TMP-DOC:RISK_PLAN"], "REQUIRED"),
      makeTemplateDecision("decision:conflict-b", ["TMP-DOC:RISK_PLAN"], "OPTIONAL"),
    ];
    const instance = composeStudyTemplateInstance(makeTemplateInput({
      humanDecisions: decisions,
      declaredUnknowns: [{ unknownId: "unknown:endpoint", field: "endpoint.primary", reason: "Unknown fixture.", provenance: ["fixture"] }],
    }));
    const statuses = new Set(instance.nodes.map((item) => item.status));
    TEMPLATE_BLOCK_STATUSES.forEach((status) => expect(statuses.has(status)).toBe(true));
    const relations = new Set(instance.relations.map((item) => item.type));
    TEMPLATE_RELATION_TYPES.forEach((type) => expect(relations.has(type)).toBe(true));
    const kinds = new Set(instance.nodes.map((item) => item.kind));
    TEMPLATE_NODE_KINDS.forEach((kind) => expect(kinds.has(kind)).toBe(true));
  });

  it("OPTIONAL n’est jamais le statut par défaut", () => {
    const instance = composeStudyTemplateInstance(makeTemplateInput());
    expect(node(instance, "TMP-NODE:REVIEW_NOTES").status).toBe("CONDITIONAL");
  });

  it("réutilise les blocs partagés par référence sans dupliquer leur définition", () => {
    const instance = composeStudyTemplateInstance(makeTemplateInput());
    expect(instance.nodes.filter((item) => item.nodeId === "TMP-NODE:PROJECT_IDENTITY")).toHaveLength(1);
    expect(instance.documents.filter((document) => document.blockIds.includes("TMP-BLOCK-DEF:PROJECT_IDENTITY")).length).toBe(instance.documents.length);
  });

  it("ne mute aucune entrée et rejoue exactement la même instance", () => {
    const input = makeTemplateInput();
    const before = stableTemplateStringify(input);
    const first = composeStudyTemplateInstance(input);
    const second = composeStudyTemplateInstance(input);
    expect(first).toEqual(second);
    expect(first.digest).toBe(second.digest);
    expect(stableTemplateStringify(input)).toBe(before);
    expect(first.inputMutationChecks).toEqual({ researchProjectUnchanged: true, reg001Unchanged: true, doc002Unchanged: true });
    expect(first.nodes.map((item) => item.nodeId)).toEqual([...first.nodes.map((item) => item.nodeId)].sort());
  });
});
