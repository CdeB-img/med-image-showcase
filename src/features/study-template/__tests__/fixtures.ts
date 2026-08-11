import { DOCUMENTARY_PATTERN_CATALOG } from "@/features/documentary-knowledge/catalog";
import { resolveRegulatoryRequirements } from "@/features/regulatory-resolution";
import { makeBaseInput, phrcStage2Input } from "@/features/regulatory-resolution/__tests__/fixtures";
import { executeResearchProjectConstruction } from "@/features/research-project-construction";
import { makeProjectInput } from "@/features/research-project-construction/__tests__/fixtures";
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
    researchProject: project,
    applicableRequirementSet: regulatory,
    documentaryPatternGraph: DOCUMENTARY_PATTERN_CATALOG,
    humanDecisions: options.humanDecisions,
    declaredUnknowns: options.declaredUnknowns,
    compositionAsOf: "2026-08-11T12:00:00.000Z",
    requestedDetailLevel: "FULL",
  };
};
