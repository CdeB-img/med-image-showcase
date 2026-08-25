import { beforeAll, describe, expect, it } from "vitest";
import { DOCUMENTARY_PATTERN_CATALOG } from "@/features/documentary-knowledge/catalog";
import { logicalDigest, stableStringify } from "@/features/knowledge-engine/canonical";
import { resolveRegulatoryRequirements } from "@/features/regulatory-resolution";
import { makeBaseInput } from "@/features/regulatory-resolution/__tests__/fixtures";
import {
  contributionFromPersistentDelta,
  validatePersistentProjectDelta,
  type PersistentExpectedVariableOccasion,
  type PersistentProjectDeltaChange,
  type PersistentProjectRelation,
  type PersistentTemporalQualification,
} from "@/features/protocol-designer/product-bridge";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation/contracts";
import {
  buildProjectContextSnapshot,
  confirmResearchProjectContribution,
  createSpecializedOwnerHandoffRequest,
  type ProjectContextSnapshot,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import {
  buildBiostatisticsPlanningInput,
  buildDataAnalysisPlanningContext,
  buildDataManagementPlanningInput,
  buildStudyDataPlanContribution,
} from "@/features/data-analysis-planning";
import { composeStudyTemplateInstance } from "@/features/study-template";
import { projectDocumentSourceFromFunctionalProject } from "@/features/document-projection/functional-reset-boundary";
import { projectCanonicalSnapshotForLegacyConsumers } from "../canonical-project-consumer-adapter";

const authority = {
  actorRef: "w0-project-01:researcher",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const change = (input: Partial<PersistentProjectDeltaChange> & Pick<PersistentProjectDeltaChange, "candidateRef" | "proposedType" | "content" | "sourceText">): PersistentProjectDeltaChange => ({
  operation: "ADD",
  targetSectionId: "MEASUREMENTS",
  targetProjectRef: null,
  semanticIdentity: input.candidateRef,
  polarity: "AFFIRMED",
  studyRole: null,
  epistemicStatus: "EXPLICIT_USER_STATED",
  assertionKind: "USER_STATED",
  proposalSourceText: null,
  evidenceRefs: [],
  ...input,
});

const contributionFor = (input: {
  raw: string;
  current: ResearchProjectOwnerProjection | null;
  changes?: PersistentProjectDeltaChange[];
  relations?: PersistentProjectRelation[];
  temporalQualifications?: PersistentTemporalQualification[];
  expectedVariableOccasions?: PersistentExpectedVariableOccasion[];
}) => {
  const conversation: ScientificInterpretationConversation = {
    conversationId: `w0-project-01:${input.raw}`,
    language: "fr",
    turns: [{ turnId: `w0-project-01-turn:${input.raw}`, role: "USER", content: input.raw, createdAt: "2026-08-25T08:00:00.000Z" }],
  };
  const checked = validatePersistentProjectDelta({
    changes: input.changes ?? [],
    relations: input.relations ?? [],
    temporalQualifications: input.temporalQualifications ?? [],
    expectedVariableOccasions: input.expectedVariableOccasions ?? [],
  }, input.raw, input.current, conversation);
  expect(checked.validation.blocks).toEqual([]);
  expect(checked.candidate).not.toBeNull();
  const contribution = contributionFromPersistentDelta({
    candidate: checked.candidate!,
    conversation,
    currentProject: input.current,
    createdAt: "2026-08-25T08:00:01.000Z",
  });
  expect(contribution).not.toBeNull();
  return contribution!;
};

const adopt = (contribution: ReturnType<typeof contributionFor>, current: ResearchProjectOwnerProjection | null, confirmedAt: string) => confirmResearchProjectContribution({
  contribution,
  current,
  projectId: current?.projectId ?? "project:w0-project-01",
  authority,
  confirmedAt,
});

const knownAnchor = {
  kind: "RELATIVE_EVENT" as const,
  direction: "AFTER" as const,
  unit: "day",
  offset: 3,
  lowerBound: null,
  upperBound: null,
  relativeEventLabel: "index event",
  tolerance: { lower: 0, upper: 2, unit: "day" },
  reference: { status: "KNOWN" as const, referenceProjectRef: "intervention:index" },
};

const unknownAnchor = {
  kind: "WINDOW" as const,
  direction: "UNKNOWN" as const,
  unit: "day",
  offset: null,
  lowerBound: 5,
  upperBound: 7,
  relativeEventLabel: null,
  tolerance: null,
  reference: { status: "UNKNOWN" as const, unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" as const },
};

const representativeProject = () => {
  const raw = "Une étude comparative évalue une intervention par imagerie dans une population définie. La question, l'objectif, le critère, la variable, le besoin de données et une limite sont explicitement conservés.";
  const projectV1 = adopt(contributionFor({
    current: null,
    raw,
    changes: [
      change({ candidateRef: "question:effect", proposedType: "SCIENTIFIC_QUESTION", targetSectionId: "ANALYSIS", content: "Quel effet différencie les deux stratégies ?", sourceText: raw }),
      change({ candidateRef: "objective:effect", proposedType: "OBJECTIVE", targetSectionId: "ANALYSIS", content: "Comparer les deux stratégies", sourceText: raw }),
      change({ candidateRef: "condition:index", proposedType: "CONDITION", targetSectionId: "POPULATION", content: "Condition index", sourceText: raw }),
      change({ candidateRef: "population:eligible", proposedType: "POPULATION", targetSectionId: "POPULATION", content: "Population éligible", sourceText: raw }),
      change({ candidateRef: "criterion:adult", proposedType: "ELIGIBILITY_CRITERION", targetSectionId: "POPULATION", content: "Population adulte", sourceText: raw }),
      change({ candidateRef: "design:comparative", proposedType: "STUDY_DESIGN", targetSectionId: "DESIGN", content: "Étude comparative", sourceText: raw }),
      change({ candidateRef: "intervention:index", proposedType: "INTERVENTION", targetSectionId: "INTERVENTION", content: "Stratégie index", sourceText: raw }),
      change({ candidateRef: "comparator:reference", proposedType: "COMPARATOR", targetSectionId: "COMPARATOR", content: "Stratégie de référence", sourceText: raw }),
      change({ candidateRef: "modality:imaging", proposedType: "IMAGING_MODALITY", targetSectionId: "IMAGING", content: "Imagerie quantitative", sourceText: raw }),
      change({ candidateRef: "acquisition:imaging", proposedType: "ACQUISITION", targetSectionId: "IMAGING", content: "Acquisition quantitative", sourceText: raw }),
      change({ candidateRef: "endpoint:response", proposedType: "ENDPOINT", targetSectionId: "MEASUREMENTS", content: "Réponse quantitative", sourceText: raw, studyRole: "PRIMARY_ENDPOINT" }),
      change({ candidateRef: "variable:response", proposedType: "CANONICAL_VARIABLE", targetSectionId: "MEASUREMENTS", content: "Mesure quantitative de réponse", sourceText: raw }),
      change({ candidateRef: "data-need:response", proposedType: "DATA_NEED", targetSectionId: "ANALYSIS", content: "Donnée quantitative nécessaire pour évaluer la réponse", sourceText: raw }),
      change({ candidateRef: "uncertainty:method", proposedType: "UNCERTAINTY", targetSectionId: "ANALYSIS", content: "La méthode exacte reste ambiguë", sourceText: raw, epistemicStatus: "UNKNOWN", polarity: "UNKNOWN" }),
      change({ candidateRef: "constraint:generalizability", proposedType: "CONSTRAINT", targetSectionId: "ANALYSIS", content: "Généralisabilité à qualifier", sourceText: raw, epistemicStatus: "UNKNOWN", polarity: "UNKNOWN" }),
    ],
    relations: [
      {
        relationRef: "relation:comparison",
        sourceText: raw,
        relationType: "COMPARES_WITH",
        sourceObjectRef: "intervention:index",
        targetObjectRef: "comparator:reference",
        polarity: "AFFIRMED",
        epistemicStatus: "EXPLICIT_USER_STATED",
        assertionKind: "USER_STATED",
        proposalSourceText: null,
        evidenceRefs: [],
      },
      {
        relationRef: "relation:variable-data-need",
        sourceText: raw,
        relationType: "COVERS_DATA_NEED",
        sourceObjectRef: "variable:response",
        targetObjectRef: "data-need:response",
        polarity: "AFFIRMED",
        epistemicStatus: "EXPLICIT_USER_STATED",
        assertionKind: "USER_STATED",
        proposalSourceText: null,
        evidenceRefs: [],
      },
    ],
  }), null, "2026-08-25T08:01:00.000Z");

  const temporalRaw = "L'acquisition est prévue trois jours après l'événement index ; la mesure est attendue entre J5 et J7 mais le référentiel de cette fenêtre reste inconnu.";
  const projectV2 = adopt(contributionFor({
    current: projectV1,
    raw: temporalRaw,
    temporalQualifications: [{
      operation: "ADD",
      qualificationId: "timing:acquisition",
      sourceText: temporalRaw,
      subjectProjectRef: "acquisition:imaging",
      temporalRole: "ACQUISITION_TIME",
      anchor: knownAnchor,
      assertionKind: "USER_STATED",
      proposalSourceText: null,
      evidenceRefs: [],
    }],
    expectedVariableOccasions: [{
      operation: "ADD",
      occasionId: "occasion:response",
      sourceText: temporalRaw,
      variableProjectRef: "variable:response",
      anchor: unknownAnchor,
      studyUnitOrGroupRef: null,
      applicableContext: "fenêtre de mesure",
      assertionKind: "USER_STATED",
      proposalSourceText: null,
      evidenceRefs: [],
    }],
  }), projectV1, "2026-08-25T08:02:00.000Z");

  const correctionRaw = "L'objectif est désormais de comparer la réponse quantitative des deux stratégies.";
  return adopt(contributionFor({
    current: projectV2,
    raw: correctionRaw,
    changes: [change({
      operation: "REPLACE",
      candidateRef: "candidate:objective:effect:v2",
      semanticIdentity: "objective:effect",
      targetProjectRef: "objective:effect",
      proposedType: "OBJECTIVE",
      targetSectionId: "ANALYSIS",
      content: "Comparer la réponse quantitative des deux stratégies",
      sourceText: correctionRaw,
    })],
  }), projectV2, "2026-08-25T08:03:00.000Z");
};

const handoff = (project: ResearchProjectOwnerProjection, owner: Parameters<typeof createSpecializedOwnerHandoffRequest>[0]["owner"], capabilityId: string) => createSpecializedOwnerHandoffRequest({
  handoffId: `w0-project-01:${owner}`,
  owner,
  capabilityId,
  purpose: "W0 canonical snapshot convergence proof",
  project,
  nativeInputType: "W0_PROJECT_01_PROOF_INPUT",
  nativeInputVersion: "1.0.0",
  nativeInput: { proofOnly: true },
});

const redigest = (snapshot: ProjectContextSnapshot): ProjectContextSnapshot => {
  const { snapshotDigest: _ignored, ...base } = snapshot;
  return { ...base, snapshotDigest: logicalDigest(base) };
};

describe("W0-PROJECT-01 — canonical Project consumer adapter", () => {
  let project: ResearchProjectOwnerProjection;
  let snapshot: ProjectContextSnapshot;
  let result: ReturnType<typeof projectCanonicalSnapshotForLegacyConsumers>;
  let legacy: NonNullable<typeof result.projection>;
  let cdmContext: ReturnType<typeof buildDataAnalysisPlanningContext>;
  let cdm: ReturnType<typeof buildStudyDataPlanContribution>;
  let dmInput: ReturnType<typeof buildDataManagementPlanningInput>;
  let bioInput: ReturnType<typeof buildBiostatisticsPlanningInput>;
  let tmp: ReturnType<typeof composeStudyTemplateInstance>;
  let currentHandoffs: ReturnType<typeof handoff>[];

  beforeAll(() => {
    project = representativeProject();
    snapshot = buildProjectContextSnapshot({ project });
    result = projectCanonicalSnapshotForLegacyConsumers({
      snapshot,
      consumers: ["CDM_PLANNING", "DATA_MANAGEMENT_PLANNING", "BIOSTATISTICS_PLANNING", "TEMPLATE_ENGINE", "DOCUMENT_ENGINE"],
      expectedProjectVersion: project.versionId,
      expectedProjectDigest: project.projectDigest,
    });
    expect(result.status).toBe("READY");
    expect(result.projection).not.toBeNull();
    legacy = result.projection!;
    cdmContext = buildDataAnalysisPlanningContext(legacy);
    cdm = buildStudyDataPlanContribution(cdmContext);
    dmInput = buildDataManagementPlanningInput(cdmContext);
    bioInput = buildBiostatisticsPlanningInput(cdmContext, "dm:proof");
    const regulatory = resolveRegulatoryRequirements(makeBaseInput({
      researchProjectId: legacy.documentHandoff.projectId,
      researchProjectVersion: legacy.candidateVersion.versionId,
      researchProjectDigest: legacy.resultDigest,
    }));
    tmp = composeStudyTemplateInstance({
      researchProject: legacy,
      applicableRequirementSet: regulatory,
      documentaryPatternGraph: DOCUMENTARY_PATTERN_CATALOG,
      upstreamHumanDecisions: legacy.documentHandoff.humanDecisions,
      declaredUnknowns: legacy.missingInformation.map((reason, index) => ({ unknownId: `w0:unknown:${index}`, field: "project", reason, provenance: [snapshot.snapshotDigest] })),
      declaredLimitations: legacy.limitations.map((reason, index) => ({ limitationId: `w0:limitation:${index}`, reason, provenance: [snapshot.snapshotDigest] })),
      compositionAsOf: "2026-08-25T08:10:00.000Z",
    });
    currentHandoffs = [
      handoff(project, "KNOWLEDGE", "KNOWLEDGE_EVIDENCE"),
      handoff(project, "REGULATORY_RESOLUTION", "REGULATORY_REQUIREMENT_RESOLUTION"),
      handoff(project, "SCIENTIFIC_THINKING", "SCIENTIFIC_THINKING_PROPOSAL"),
      handoff(project, "IMAGING", "IMAGING_STUDY_DESIGN"),
    ];
  });

  it("W0P01-01 canonical Project produces one owner snapshot", () => { expect(result.contractNature).toBe("READ_ONLY_CONSUMER_PROJECTION_NOT_PROJECT_CONTRACT"); expect(new Set(currentHandoffs.map((item) => item.sourceProject.snapshotDigest))).toEqual(new Set([snapshot.snapshotDigest])); expect(stableStringify(projectCanonicalSnapshotForLegacyConsumers({ snapshot, consumers: result.consumers }))).toBe(stableStringify(result)); });
  it("W0P01-02 Project ID preserved", () => expect([result.sourceSnapshot.projectId, cdmContext.projectRef.objectId, tmp.inputRefs.researchProjectId]).toEqual([project.projectId, project.projectId, project.projectId]));
  it("W0P01-03 Project version preserved", () => expect([result.sourceSnapshot.projectVersion, cdmContext.projectRef.objectVersion, tmp.inputRefs.researchProjectVersion]).toEqual([project.versionId, project.versionId, project.versionId]));
  it("W0P01-04 Project digest preserved", () => expect([result.sourceSnapshot.projectDigest, legacy.resultDigest, tmp.inputRefs.researchProjectDigest]).toEqual([project.projectDigest, project.projectDigest, project.projectDigest]));
  it("W0P01-05 canonical identities preserved", () => { expect(result.canonicalIdentityMap.map((item) => item.stableId)).toEqual(snapshot.objects.map((item) => item.stableId)); expect(legacy.dataManagementRequirements).toContainEqual(expect.objectContaining({ requirementId: "data-need:response", kind: "CANONICAL_DATA_NEED_REFERENCE" })); });
  it("W0P01-06 relations preserved", () => expect(result.canonicalRelationMap).toEqual(snapshot.relations.map((relation) => ({ stableId: relation.stableId, versionRef: relation.versionRef, type: relation.type, sourceProjectRef: relation.sourceProjectRef, targetProjectRef: relation.targetProjectRef }))));
  it("W0P01-07 unknowns preserved", () => expect(legacy.missingInformation.join(" ")).toContain("REFERENCE_EVENT_NOT_SUPPLIED"));
  it("W0P01-08 ambiguities/limitations preserved", () => { expect(legacy.missingInformation).toContain("La méthode exacte reste ambiguë"); expect(snapshot.specializedResponsibilities.length).toBeGreaterThan(0); expect(legacy.limitations).toEqual(expect.arrayContaining(snapshot.specializedResponsibilities.filter((item) => item.state === "PENDING_SPECIALIST_CONTRIBUTION").map((item) => item.retainedResponsibility))); });
  it("W0P01-09 temporal role preserved", () => expect(legacy.visits.find((visit) => visit.visitId === "timing:acquisition")?.label).toBe("ACQUISITION_TIME"));
  it("W0P01-10 unknown temporal reference preserved", () => expect(legacy.visits.find((visit) => visit.visitId === "occasion:response")).toMatchObject({ timingStatus: "SCIENTIFIC_WINDOW_TO_DEFINE", temporalRole: "SINGLE_ASSESSMENT" }));
  it("W0P01-11 no J0/baseline invented", () => { const text = stableStringify(legacy.visits.find((visit) => visit.visitId === "occasion:response")); expect(text).not.toMatch(/J0|baseline|inclusion|randomization/i); });
  it("W0P01-12 provenance preserved", () => expect(legacy.provenance.sourceRefs).toEqual(expect.arrayContaining([snapshot.snapshotDigest, "variable:response"])));
  it("W0P01-13 Human Decision references preserved where required", () => expect(legacy.documentHandoff.decisionRecordIds).toEqual(expect.arrayContaining(snapshot.decisionLedger.map((entry) => entry.humanDecisionRef))));
  it("W0P01-14 current Knowledge input derives from canonical snapshot", () => expect(currentHandoffs[0].sourceProject).toMatchObject({ sourceProjectRef: result.sourceSnapshot.projectId, sourceProjectVersion: result.sourceSnapshot.projectVersion, sourceProjectDigest: result.sourceSnapshot.projectDigest, snapshotDigest: result.sourceSnapshot.snapshotDigest }));
  it("W0P01-15 REG input derives from same snapshot", () => expect(currentHandoffs[1].sourceProject.snapshotDigest).toBe(snapshot.snapshotDigest));
  it("W0P01-16 ST input derives from same snapshot", () => expect(currentHandoffs[2].sourceProject.snapshotDigest).toBe(snapshot.snapshotDigest));
  it("W0P01-17 Imaging input derives from same snapshot", () => expect(currentHandoffs[3].sourceProject.snapshotDigest).toBe(snapshot.snapshotDigest));
  it("W0P01-18 legacy CDM input derives from same snapshot", () => expect(cdm.sourceProjectDigest).toBe(snapshot.sourceProjectDigest));
  it("W0P01-19 legacy DM input derives from same snapshot", () => expect(dmInput.context.project.resultDigest).toBe(snapshot.sourceProjectDigest));
  it("W0P01-20 legacy Biostatistics input derives from same snapshot", () => expect(bioInput.context.project.resultDigest).toBe(snapshot.sourceProjectDigest));
  it("W0P01-21 TMP input derives from same snapshot", () => expect(tmp.inputRefs).toMatchObject({ researchProjectId: snapshot.sourceProjectRef, researchProjectVersion: snapshot.sourceProjectVersion, researchProjectDigest: snapshot.sourceProjectDigest }));
  it("W0P01-22 legacy projection cannot mutate Project", () => { const before = stableStringify(project); expect(Object.isFrozen(snapshot)).toBe(true); expect(Object.isFrozen(snapshot.objects[0])).toBe(true); expect(Object.isFrozen(result)).toBe(true); expect(Object.isFrozen(result.canonicalIdentityMap[0])).toBe(true); expect(Object.isFrozen(result.projection)).toBe(true); expect("onProjectChange" in result).toBe(false); expect(() => { (legacy.variables as unknown as Array<unknown>).push({}); }).toThrow(); expect(() => { (snapshot.objects as unknown as Array<unknown>).push({}); }).toThrow(); expect(stableStringify(project)).toBe(before); });
  it("W0P01-23 representation gap blocks rather than invents", () => { const unsafe = redigest({ ...snapshot, legacyTemporalMappings: [{ legacyObjectRef: "legacy:time", legacyVersionRef: "legacy:time:v1", mappingStatus: "NEW_MAPPING_REQUIRED" }] }); const blocked = projectCanonicalSnapshotForLegacyConsumers({ snapshot: unsafe, consumers: ["TEMPLATE_ENGINE"] }); expect(blocked).toMatchObject({ status: "BLOCKED", projection: null, diagnostics: [expect.objectContaining({ code: "LEGACY_PROJECTION_TEMPORAL_SEMANTICS_GAP" })] }); });
  it("W0P01-24 legacy historical reader remains readable", () => expect(projectDocumentSourceFromFunctionalProject(project, null)).toMatchObject({ resultDigest: project.projectDigest, projectionNotice: "RUNTIME_PROJECT_PROJECTION_DOES_NOT_OWN_CANONICAL_TRUTH" }));
  it("W0P01-25 stale snapshot/version mismatch rejected", () => expect(projectCanonicalSnapshotForLegacyConsumers({ snapshot, consumers: ["CDM_PLANNING"], expectedProjectVersion: `${project.versionId}:stale` })).toMatchObject({ status: "BLOCKED", projection: null, diagnostics: [expect.objectContaining({ code: "LEGACY_PROJECTION_VERSION_MISMATCH" })] }));
});
