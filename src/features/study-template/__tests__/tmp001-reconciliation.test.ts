import { describe, expect, it } from "vitest";
import { DOCUMENTARY_PATTERN_CATALOG } from "@/features/documentary-knowledge/catalog";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import type { ProjectContextSnapshot } from "@/features/research-project-construction/canonical-project-backbone";
import { CLINICAL_STUDY_TEMPLATE } from "../definitions.ts";
import { composeStudyTemplateInstance } from "../composition.ts";
import {
  studyTemplateProjectInputFromLegacyResearchProject,
  studyTemplateProjectInputFromProjectSnapshot,
} from "../project-input.ts";
import type { StudyTemplateProjectInput } from "../types.ts";
import { makeTemplateInput } from "./fixtures.ts";

const provenance = (source: string) => ({
  sourcePlan: "USER" as const,
  assertionKind: "USER_STATED" as const,
  sourceTurnRefs: [source],
  sourceText: source,
  proposalSourceTurnRefs: [],
  adoptionSourceTurnRefs: [source],
  evidenceRefs: [],
  evidenceQualification: "NOT_EVALUATED" as const,
});

const projectSnapshot = (input: {
  version?: string;
  objects?: Array<{
    id: string;
    type: ProjectContextSnapshot["objects"][number]["type"];
    content: string;
    role?: string | null;
    epistemicState?: ProjectContextSnapshot["objects"][number]["epistemicState"];
  }>;
} = {}): ProjectContextSnapshot => {
  const version = input.version ?? "project:tmp001:v1";
  const projectObjects = input.objects ?? [
    { id: "question:tmp", type: "SCIENTIFIC_QUESTION", content: "Quelle trajectoire est observée ?" },
    { id: "objective:tmp", type: "OBJECTIVE", content: "Décrire la trajectoire", role: "PRIMARY" },
    { id: "population:tmp", type: "POPULATION", content: "Population explicitement définie" },
    { id: "design:tmp", type: "STUDY_DESIGN", content: "Cohorte observationnelle prospective", role: "PROSPECTIVE_LONGITUDINAL_COHORT" },
    { id: "endpoint:tmp", type: "ENDPOINT", content: "Critère quantitatif", role: "PRIMARY_ENDPOINT" },
    { id: "variable:tmp", type: "CANONICAL_VARIABLE", content: "Mesure quantitative" },
    { id: "data-need:tmp", type: "DATA_NEED", content: "Valeur de la mesure" },
    { id: "visit:tmp", type: "VISIT", content: "Visite de suivi", role: "FOLLOW_UP" },
  ] satisfies NonNullable<typeof input.objects>;
  const sourceProjectDigest = logicalDigest({ version, projectObjects });
  const objects = projectObjects.map((object) => ({
    stableId: object.id,
    versionRef: `${object.id}@${version}`,
    version: 1,
    type: object.type,
    content: object.content,
    scientificRole: object.role ?? null,
    semanticKey: `${object.type}:${object.id}`,
    epistemicState: object.epistemicState ?? "KNOWN" as const,
    provenanceKind: "USER_STATED" as const,
    provenance: provenance(`turn:${object.id}`),
    decisionRefs: [`decision:${object.id}`],
    sourceContributionRef: `contribution:${version}`,
    sourceItemRefs: [`source:${object.id}`],
  }));
  const base = {
    contract: "PROJECT_CONTEXT_SNAPSHOT" as const,
    contractVersion: "0.3.0" as const,
    owner: "RESEARCH_PROJECT" as const,
    sourceProjectRef: "project:tmp001",
    sourceProjectVersion: version,
    sourceProjectDigest,
    sourceProjectRevision: Number(version.match(/\d+$/)?.[0] ?? 1),
    previousProjectVersion: version.endsWith("v1") ? null : "project:tmp001:v1",
    sourceContributionRef: `contribution:${version}`,
    sourceContributionDigest: logicalDigest({ contribution: version }),
    objects,
    relations: [],
    temporalQualifications: [],
    expectedVariableOccasions: [],
    historicalObjectVersions: [],
    historicalRelationVersions: [],
    historicalTemporalQualificationVersions: [],
    historicalExpectedVariableOccasionVersions: [],
    legacyTemporalMappings: [],
    openConflicts: [],
    openIssues: objects.filter((object) => object.epistemicState === "UNKNOWN").map((object) => ({
      issueRef: `${object.stableId}:unknown`,
      kind: "UNKNOWN" as const,
      reason: `${object.type} explicitement inconnu`,
      sourceRefs: [object.versionRef],
    })),
    humanDecisions: [],
    decisionLedger: [],
    versionHistory: [],
    specializedResponsibilities: [],
    pendingVerificationRefs: [],
    activeQryNeed: null,
    readOnly: true as const,
  };
  return { ...base, snapshotDigest: logicalDigest(base) };
};

const compositionInputFor = (project: Readonly<StudyTemplateProjectInput>) => {
  const base = makeTemplateInput();
  return {
    ...base,
    researchProject: project,
    applicableRequirementSet: {
      ...base.applicableRequirementSet,
      researchProjectId: project.projectId,
      researchProjectVersion: project.projectVersion,
      researchProjectDigest: project.projectDigest,
    },
  };
};

describe("TMP001_RECONCILIATION_01 — Project V2, legacy, knowledge and states", () => {
  it("CASE A — composes natively from the current Project V2 snapshot", () => {
    const snapshot = projectSnapshot();
    const project = studyTemplateProjectInputFromProjectSnapshot(snapshot);
    const instance = composeStudyTemplateInstance(compositionInputFor(project));
    expect(project.sourceKind).toBe("PROJECT_CONTEXT_SNAPSHOT");
    expect(instance.inputRefs).toMatchObject({
      researchProjectId: snapshot.sourceProjectRef,
      researchProjectVersion: snapshot.sourceProjectVersion,
      researchProjectDigest: snapshot.sourceProjectDigest,
    });
    expect(instance.inputMutationChecks.researchProjectUnchanged).toBe(true);
  });

  it("CASE B — retains legacy replay only through the explicit compatibility adapter", () => {
    const legacyInput = makeTemplateInput();
    expect(legacyInput.researchProject.sourceKind).toBe("LEGACY_RESEARCH_PROJECT_DESIGN_RESULT_COMPATIBILITY");
    const instance = composeStudyTemplateInstance(legacyInput);
    expect(instance.templateId).toBe(CLINICAL_STUDY_TEMPLATE.templateId);
    expect(studyTemplateProjectInputFromLegacyResearchProject).toBeTypeOf("function");
  });

  it("CASE C — UNKNOWN study design remains unresolved and is never false NOT_APPLICABLE", () => {
    const project = studyTemplateProjectInputFromProjectSnapshot(projectSnapshot({ objects: [
      { id: "question:unknown-design", type: "SCIENTIFIC_QUESTION", content: "Quel plan d'étude ?" },
      { id: "population:unknown-design", type: "POPULATION", content: "Population définie" },
      { id: "design:unknown", type: "STUDY_DESIGN", content: "Plan non encore qualifié", epistemicState: "UNKNOWN" },
    ] }));
    const instance = composeStudyTemplateInstance(compositionInputFor(project));
    expect(instance.familyProfiles.find((family) => family.familyId === "OBSERVATIONAL")?.status).toBe("UNKNOWN");
    expect(instance.nodes.find((node) => node.nodeId === "TMP-NODE:STUDY_DESIGN")?.status).not.toBe("NOT_APPLICABLE");
    expect(instance.unknowns.some((unknown) => unknown.reason.includes("STUDY_DESIGN"))).toBe(true);
  });

  it("CASE D — consumes the DOC-002 detail boundary as reference-only structure", () => {
    const instance = composeStudyTemplateInstance(compositionInputFor(studyTemplateProjectInputFromProjectSnapshot(projectSnapshot())));
    const mapping = instance.patternMapping.find((item) => item.patternId === "DKP-E6BCFE9EAAEA");
    expect(mapping).toMatchObject({ boundary: "REFERENCE_ONLY_NEVER_MAKES_REQUIRED" });
    expect(mapping?.nodeIds).toEqual(expect.arrayContaining(["TMP-DOC:PROTOCOL", "TMP-DOC:SAP"]));
    expect(instance.nodes.flatMap((node) => node.supports).filter((support) => support.sourceRefs.includes("DKP-E6BCFE9EAAEA")).every((support) => support.supportLevel === "REFERENCE_ONLY")).toBe(true);
  });

  it("CASE E — keeps documentary omission uninterpreted and never creates a deferral", () => {
    const instance = composeStudyTemplateInstance(compositionInputFor(studyTemplateProjectInputFromProjectSnapshot(projectSnapshot())));
    const omission = instance.patternMapping.find((item) => item.patternId === "DKP-999F6F6E3C80");
    expect(omission).toMatchObject({ nodeIds: [], boundary: "REFERENCE_ONLY_NEVER_MAKES_REQUIRED" });
    expect(instance.humanDecisions).toEqual([]);
    expect(JSON.stringify(instance)).not.toContain("INTENTIONAL_DEFERRAL");
  });

  it("CASE F — preserves a REG-001 conditional result without increasing certainty", () => {
    const input = compositionInputFor(studyTemplateProjectInputFromProjectSnapshot(projectSnapshot()));
    const source = [
      ...input.applicableRequirementSet.applicableRequirements,
      ...input.applicableRequirementSet.notApplicableRequirements,
      ...input.applicableRequirementSet.unresolvedRequirements,
    ][0]!;
    const conditional = { ...source, status: "CONDITIONALLY_APPLICABLE" as const, conditions: source.conditions ?? [] };
    const instance = composeStudyTemplateInstance({
      ...input,
      applicableRequirementSet: {
        ...input.applicableRequirementSet,
        applicableRequirements: [],
        potentiallyApplicableRequirements: [conditional],
        notApplicableRequirements: [],
        unresolvedRequirements: [],
      },
    });
    const mapping = instance.requirementMapping.find((item) => item.requirementId === conditional.requirementId)!;
    expect(mapping.status).toBe("CONDITIONALLY_APPLICABLE");
    expect(mapping.nodeIds.map((nodeId) => instance.nodes.find((node) => node.nodeId === nodeId)?.status)).not.toContain("REQUIRED");
  });

  it("CASE G — changes TMP identity and lineage when Project version/digest changes", () => {
    const v1 = composeStudyTemplateInstance(compositionInputFor(studyTemplateProjectInputFromProjectSnapshot(projectSnapshot({ version: "project:tmp001:v1" }))));
    const v2 = composeStudyTemplateInstance(compositionInputFor(studyTemplateProjectInputFromProjectSnapshot(projectSnapshot({ version: "project:tmp001:v2" }))));
    expect(v2.inputRefs.researchProjectVersion).not.toBe(v1.inputRefs.researchProjectVersion);
    expect(v2.inputRefs.researchProjectDigest).not.toBe(v1.inputRefs.researchProjectDigest);
    expect(v2.instanceId).not.toBe(v1.instanceId);
  });

  it("CASE H — consumes DOC-002 1.1.0 without changing the 13 existing family identities", () => {
    const instance = composeStudyTemplateInstance(compositionInputFor(studyTemplateProjectInputFromProjectSnapshot(projectSnapshot())));
    expect(instance.inputRefs.documentaryCatalogVersion).toBe("1.1.0");
    expect(DOCUMENTARY_PATTERN_CATALOG.patterns).toHaveLength(132);
    expect(instance.familyProfiles.map((family) => family.familyId)).toEqual(CLINICAL_STUDY_TEMPLATE.familyIds);
  });

  it("preserves withheld, candidate, rejected and superseded states without applying them", () => {
    const project = structuredClone(studyTemplateProjectInputFromProjectSnapshot(projectSnapshot()));
    project.objects.push(
      { ...project.objects[0]!, stableId: "design:withheld", versionRef: "design:withheld:v1", type: "STUDY_DESIGN", content: "secret", epistemicState: "WITHHELD" },
      { ...project.objects[0]!, stableId: "design:candidate", versionRef: "design:candidate:v1", type: "STUDY_DESIGN", content: "Cohorte observationnelle", adoptionState: "CANDIDATE" },
      { ...project.objects[0]!, stableId: "design:rejected", versionRef: "design:rejected:v1", type: "STUDY_DESIGN", content: "Cohorte observationnelle", adoptionState: "REJECTED" },
      { ...project.objects[0]!, stableId: "design:superseded", versionRef: "design:superseded:v1", type: "STUDY_DESIGN", content: "Cohorte observationnelle", actuality: "SUPERSEDED" },
    );
    project.issues.push({ issueRef: "design:withheld:withheld", kind: "WITHHELD", reason: "Valeur explicitement retenue.", sourceRefs: ["design:withheld:v1"] });
    const instance = composeStudyTemplateInstance(compositionInputFor(project));
    expect(instance.familyProfiles.find((family) => family.familyId === "OBSERVATIONAL")?.status).toBe("APPLICABLE");
    const supportRefs = instance.nodes.flatMap((node) => node.supports).flatMap((support) => support.sourceRefs);
    expect(supportRefs).not.toEqual(expect.arrayContaining(["design:withheld:v1", "design:candidate:v1", "design:rejected:v1", "design:superseded:v1"]));
    expect(instance.unknowns).toEqual(expect.arrayContaining([expect.objectContaining({ unknownId: expect.stringContaining("WITHHELD") })]));
  });

  it("PLATFORM STRUCTURAL — reuses common blocks, conditional nodes and shared dependencies", () => {
    expect(CLINICAL_STUDY_TEMPLATE.familyIds.some((family) => /PLATFORM|ARM|COHORT/.test(family))).toBe(false);
    expect(CLINICAL_STUDY_TEMPLATE.documents.every((document) => document.sharedBlockIds.includes("TMP-BLOCK-DEF:PROJECT_IDENTITY"))).toBe(true);
    expect(CLINICAL_STUDY_TEMPLATE.graph.nodes.some((node) => node.kind === "CONDITIONAL_BLOCK")).toBe(true);
    expect(CLINICAL_STUDY_TEMPLATE.graph.relations.some((relation) => relation.type === "DEPENDS_ON")).toBe(true);
  });
});
