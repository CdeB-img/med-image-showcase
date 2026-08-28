import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { DOCUMENTARY_PATTERN_CATALOG } from "@/features/documentary-knowledge/catalog";
import type { PatternCatalog } from "@/features/documentary-knowledge/types";
import { resolveRegulatoryRequirements } from "@/features/regulatory-resolution";
import { phrcStage2Input } from "@/features/regulatory-resolution/__tests__/fixtures";
import type { RegulatoryResolutionResult } from "@/features/regulatory-resolution/types";
import { createResearchProjectConstructionSession, decideProjectGate, proposeEndpointRole, proposeStudyDesign } from "@/features/research-project-construction";
import { makeProjectInput, readGovernedImagingReferenceResult } from "@/features/research-project-construction/__tests__/fixtures";
import type { ResearchProjectConstructionInput, ResearchProjectConstructionSession, ResearchProjectDesignResult } from "@/features/research-project-construction/types";
import { CLINICAL_STUDY_TEMPLATE, composeStudyTemplateInstance } from "@/features/study-template";
import type { DocumentProjectionRequest } from "../types";

export const authorizeProject = (input: ResearchProjectConstructionInput): ResearchProjectConstructionSession => {
  let session = createResearchProjectConstructionSession(input);
  if (session.result.studyDesignCandidates[0]) session = proposeStudyDesign(session, session.result.studyDesignCandidates[0].designId);
  if (session.result.endpointCandidates[0]) session = proposeEndpointRole(session, session.result.endpointCandidates[0].endpointId, "PRIMARY_CANDIDATE");
  for (let index = 0; index < 40; index += 1) {
    const gate = session.result.decisionsRequired.find((item) => item.status === "PENDING" && item.gateId !== "PRJ-GATE-DOCUMENT-HANDOFF");
    if (!gate) break;
    session = decideProjectGate(session, gate.gateId, "APPROVED", "Décision humaine explicite pour fixture DOC-001.", "Responsable scientifique", "mandate:doc-001-test", `2026-08-10T14:${String(index).padStart(2, "0")}:00.000Z`);
  }
  session = decideProjectGate(session, "PRJ-GATE-DOCUMENT-HANDOFF", "APPROVED", "Projection documentaire explicitement autorisée.", "Responsable scientifique", "mandate:doc-001-test", "2026-08-10T15:00:00.000Z");
  if (session.result.documentHandoff.status !== "AUTHORIZED") throw new Error("DOC_001_TEST_PROJECT_NOT_AUTHORIZED");
  return session;
};

export const makeAuthorizedProject = () => authorizeProject(makeProjectInput({ question: "Décrire un marqueur dans une Population définie.", outcomes: ["marqueur quantitatif"] }));

export const makeAuthorizedImagingProject = () => authorizeProject(makeProjectInput({
  question: "Dans le sous-ensemble de validation par transplantation cardiaque décrit par la source, comment l’ECV IRM est-elle associée à l’espace extracellulaire histologique ?",
  outcomes: ["association bornée entre ECV IRM et espace extracellulaire histologique"],
  population: ["sous-ensemble sélectionné de validation par transplantation cardiaque décrit par la source"],
  pathology: ["UNKNOWN"],
  imagingResult: readGovernedImagingReferenceResult(),
  imagingStatus: "FROZEN_BY_HUMAN",
  timings: ["UNKNOWN_EXPLICITLY_RECORDED"],
}));

export const reviseProject = (source: ResearchProjectDesignResult, patch: Partial<ResearchProjectDesignResult>): ResearchProjectDesignResult => {
  const clone = structuredClone(source);
  const revised = { ...clone, ...patch };
  revised.resultDigest = logicalDigest({ prior: source.resultDigest, patch });
  return revised;
};

export const makeTemplateProjectionSources = (
  project: Readonly<ResearchProjectDesignResult>,
  options: {
    regulatory?: RegulatoryResolutionResult;
    patterns?: PatternCatalog;
    compositionAsOf?: string;
    declaredUnknowns?: Parameters<typeof composeStudyTemplateInstance>[0]["declaredUnknowns"];
    templateHumanDecisions?: Parameters<typeof composeStudyTemplateInstance>[0]["humanDecisions"];
  } = {},
): Pick<DocumentProjectionRequest, "templateContext" | "regulatoryResolutionRef" | "documentaryPatternSnapshotRef"> => {
  const regulatory = options.regulatory ?? resolveRegulatoryRequirements({
    ...phrcStage2Input(),
    researchProjectId: project.documentHandoff.projectId,
    researchProjectVersion: project.candidateVersion.versionId,
    researchProjectDigest: project.resultDigest,
  });
  const patterns = options.patterns ?? DOCUMENTARY_PATTERN_CATALOG;
  const instance = composeStudyTemplateInstance({
    researchProject: project,
    applicableRequirementSet: regulatory,
    documentaryPatternGraph: patterns,
    upstreamHumanDecisions: project.documentHandoff.humanDecisions,
    humanDecisions: options.templateHumanDecisions,
    declaredUnknowns: options.declaredUnknowns,
    compositionAsOf: options.compositionAsOf ?? "2026-08-11T15:00:00.000Z",
    requestedDetailLevel: "FULL",
  });
  return {
    templateContext: { definition: CLINICAL_STUDY_TEMPLATE, instance },
    regulatoryResolutionRef: {
      resolutionId: regulatory.resolutionId,
      corpusVersion: regulatory.corpusVersion,
      corpusDigest: regulatory.corpusDigest,
    },
    documentaryPatternSnapshotRef: {
      catalogId: patterns.catalogId,
      catalogVersion: patterns.version,
      catalogDigest: patterns.digest,
    },
  };
};

export const makeTemplateProjectionRequest = (
  session: ResearchProjectConstructionSession,
  options: Partial<DocumentProjectionRequest> & {
    project?: ResearchProjectDesignResult;
    regulatory?: RegulatoryResolutionResult;
    patterns?: PatternCatalog;
    compositionAsOf?: string;
    declaredUnknowns?: Parameters<typeof composeStudyTemplateInstance>[0]["declaredUnknowns"];
    templateHumanDecisions?: Parameters<typeof composeStudyTemplateInstance>[0]["humanDecisions"];
  } = {},
): DocumentProjectionRequest => {
  const project = options.project ?? session.result;
  const sources = makeTemplateProjectionSources(project, options);
  return {
    project,
    decisionRecords: options.decisionRecords ?? session.decisionHistory,
    projectionType: options.projectionType ?? "PROTOCOL",
    profile: options.profile ?? "RESEARCH_PROTOCOL",
    usage: options.usage ?? "SCIENTIFIC_REVIEW",
    audience: options.audience ?? "RESEARCH_TEAM",
    requestedAt: options.requestedAt ?? "2026-08-11T16:00:00.000Z",
    priorProjection: options.priorProjection,
    definitions: options.definitions,
    versions: options.versions,
    humanDecisions: options.humanDecisions,
    unknowns: options.unknowns,
    limitations: options.limitations,
    provenance: options.provenance,
    ...sources,
  };
};
