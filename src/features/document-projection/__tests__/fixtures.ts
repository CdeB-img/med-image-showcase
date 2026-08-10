import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { createResearchProjectConstructionSession, decideProjectGate, proposeEndpointRole, proposeStudyDesign } from "@/features/research-project-construction";
import { makeFrozenImagingResult, makeProjectInput } from "@/features/research-project-construction/__tests__/fixtures";
import type { ResearchProjectConstructionInput, ResearchProjectConstructionSession, ResearchProjectDesignResult } from "@/features/research-project-construction/types";

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
  question: "Chez les adultes atteints de maladie de Fabry, comment l’ECV évolue-t-il longitudinalement en IRM cardiaque ?",
  outcomes: ["évolution longitudinale de l’ECV"],
  imagingResult: makeFrozenImagingResult(),
  imagingStatus: "FROZEN_BY_HUMAN",
  timings: ["mesure initiale", "suivi à définir scientifiquement"],
}));

export const reviseProject = (source: ResearchProjectDesignResult, patch: Partial<ResearchProjectDesignResult>): ResearchProjectDesignResult => {
  const clone = structuredClone(source);
  const revised = { ...clone, ...patch };
  revised.resultDigest = logicalDigest({ prior: source.resultDigest, patch });
  return revised;
};

