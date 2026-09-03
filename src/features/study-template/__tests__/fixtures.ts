import { DOCUMENTARY_PATTERN_CATALOG } from "@/features/documentary-knowledge/catalog";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { resolveRegulatoryRequirements } from "@/features/regulatory-resolution";
import { makeBaseInput, phrcStage2Input } from "@/features/regulatory-resolution/__tests__/fixtures";
import { executeResearchProjectConstruction } from "@/features/research-project-construction";
import { makeProjectInput } from "@/features/research-project-construction/__tests__/fixtures";
import type { ProjectContextSnapshot } from "@/features/research-project-construction/canonical-project-backbone";
import {
  studyTemplateProjectInputFromLegacyResearchProject,
  studyTemplateProjectInputFromProjectSnapshot,
} from "../project-input.ts";
import type { StudyTemplateCompositionInput, TemplateHumanDecision } from "../types.ts";

export const makeTemplateDecision = (
  decisionId: string,
  targetNodeIds: string[],
  outcome: TemplateHumanDecision["outcome"],
  version = 1,
): TemplateHumanDecision => ({
  decisionId,
  actor: "Template steward fixture",
  mandate: "mandate:tmp-001:test",
  targetNodeIds,
  outcome,
  reason: `Décision de fixture explicite: ${outcome}.`,
  version,
  timestamp: `2026-08-11T10:${String(version).padStart(2, "0")}:00.000Z`,
  provenance: ["TMP-001:TEST_FIXTURE", decisionId],
});

export const makeTemplateInput = (options: {
  projectOptions?: Parameters<typeof makeProjectInput>[0];
  phrc?: boolean;
  humanDecisions?: TemplateHumanDecision[];
  declaredUnknowns?: StudyTemplateCompositionInput["declaredUnknowns"];
  projectTransform?: (project: ReturnType<typeof executeResearchProjectConstruction>) => ReturnType<typeof executeResearchProjectConstruction>;
} = {}): StudyTemplateCompositionInput => {
  const rawProject = executeResearchProjectConstruction(makeProjectInput(options.projectOptions));
  const project = options.projectTransform?.(rawProject) ?? rawProject;
  const rawRegulatory = options.phrc ? phrcStage2Input() : makeBaseInput();
  const regulatory = resolveRegulatoryRequirements({
    ...rawRegulatory,
    researchProjectId: project.documentHandoff.projectId,
    researchProjectVersion: project.candidateVersion.versionId,
    researchProjectDigest: project.resultDigest,
  });
  return {
    researchProject: studyTemplateProjectInputFromLegacyResearchProject(project),
    applicableRequirementSet: regulatory,
    documentaryPatternGraph: DOCUMENTARY_PATTERN_CATALOG,
    humanDecisions: options.humanDecisions,
    declaredUnknowns: options.declaredUnknowns,
    compositionAsOf: "2026-08-11T12:00:00.000Z",
    requestedDetailLevel: "FULL",
  };
};

export const makeNativeTemplateInput = (options: {
  imaging?: boolean;
  phrc?: boolean;
  humanDecisions?: TemplateHumanDecision[];
  declaredUnknowns?: StudyTemplateCompositionInput["declaredUnknowns"];
} = {}): StudyTemplateCompositionInput => {
  const objectSpecs: Array<{
    id: string;
    type: ProjectContextSnapshot["objects"][number]["type"];
    content: string;
    role: string | null;
  }> = [
    { id: "fixture:question", type: "SCIENTIFIC_QUESTION", content: "Question scientifique de fixture à structurer, sans usage clinique.", role: null },
    { id: "fixture:objective", type: "OBJECTIVE", content: "Structurer l'objectif de fixture.", role: "PRIMARY" },
    { id: "fixture:population", type: "POPULATION", content: "Population de fixture.", role: null },
    { id: "fixture:design", type: "STUDY_DESIGN", content: "Cohorte observationnelle prospective.", role: "PROSPECTIVE_LONGITUDINAL_COHORT" },
    { id: "fixture:endpoint", type: "ENDPOINT", content: "Outcome de fixture.", role: "PRIMARY_ENDPOINT" },
    { id: "fixture:variable", type: "CANONICAL_VARIABLE", content: "Mesure de fixture.", role: null },
    { id: "fixture:data-need", type: "DATA_NEED", content: "Donnée de fixture nécessaire.", role: null },
    { id: "fixture:visit", type: "VISIT", content: "Visite de fixture.", role: "FOLLOW_UP" },
    ...(options.imaging ? [{ id: "fixture:imaging", type: "IMAGING_MODALITY" as const, content: "Modalité d'imagerie de fixture.", role: null }] : []),
  ];
  const projectVersion = options.imaging ? "project:tmp-generator:v2" : "project:tmp-generator:v1";
  const projectDigest = logicalDigest({ projectVersion, objectSpecs });
  const sourceContributionRef = `contribution:${projectVersion}`;
  const provenance = (id: string) => ({
    sourcePlan: "USER" as const,
    assertionKind: "USER_STATED" as const,
    sourceTurnRefs: [`turn:${id}`],
    sourceText: null,
    proposalSourceTurnRefs: [],
    adoptionSourceTurnRefs: [`turn:${id}`],
    evidenceRefs: [],
    evidenceQualification: "NOT_EVALUATED" as const,
  });
  const snapshotBase = {
    contract: "PROJECT_CONTEXT_SNAPSHOT" as const,
    contractVersion: "0.3.0" as const,
    owner: "RESEARCH_PROJECT" as const,
    sourceProjectRef: "project:tmp-generator",
    sourceProjectVersion: projectVersion,
    sourceProjectDigest: projectDigest,
    sourceProjectRevision: options.imaging ? 2 : 1,
    previousProjectVersion: options.imaging ? "project:tmp-generator:v1" : null,
    sourceContributionRef,
    sourceContributionDigest: logicalDigest({ sourceContributionRef }),
    objects: objectSpecs.map((object) => ({
      stableId: object.id,
      versionRef: `${object.id}@${projectVersion}`,
      version: 1,
      type: object.type,
      content: object.content,
      scientificRole: object.role,
      semanticKey: `${object.type}:${object.id}`,
      epistemicState: "KNOWN" as const,
      provenanceKind: "USER_STATED" as const,
      provenance: provenance(object.id),
      decisionRefs: [`decision:${object.id}`],
      sourceContributionRef,
      sourceItemRefs: [`source:${object.id}`],
    })),
    relations: [],
    temporalQualifications: [],
    expectedVariableOccasions: [],
    historicalObjectVersions: [],
    historicalRelationVersions: [],
    historicalTemporalQualificationVersions: [],
    historicalExpectedVariableOccasionVersions: [],
    legacyTemporalMappings: [],
    openConflicts: [],
    openIssues: [],
    humanDecisions: [],
    decisionLedger: [],
    versionHistory: [],
    specializedResponsibilities: [],
    pendingVerificationRefs: [],
    activeQryNeed: null,
    readOnly: true as const,
  };
  const snapshot: ProjectContextSnapshot = { ...snapshotBase, snapshotDigest: logicalDigest(snapshotBase) };
  const project = studyTemplateProjectInputFromProjectSnapshot(snapshot);
  const rawRegulatory = options.phrc ? phrcStage2Input() : makeBaseInput();
  const regulatory = resolveRegulatoryRequirements({
    ...rawRegulatory,
    researchProjectId: project.projectId,
    researchProjectVersion: project.projectVersion,
    researchProjectDigest: project.projectDigest,
  });
  return {
    researchProject: project,
    applicableRequirementSet: regulatory,
    documentaryPatternGraph: DOCUMENTARY_PATTERN_CATALOG,
    humanDecisions: options.humanDecisions,
    declaredUnknowns: options.declaredUnknowns,
    compositionAsOf: "2026-09-04T00:00:00.000Z",
    requestedDetailLevel: "FULL",
  };
};
