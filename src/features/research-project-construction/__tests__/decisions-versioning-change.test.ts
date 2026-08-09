import { describe, expect, it } from "vitest";
import { answerProjectQuestion, createResearchProjectConstructionSession, decideProjectChange, decideProjectGate, proposeEndpointRole, proposeStudyDesign, requestProjectChange } from "../session";
import { makeProjectInput } from "./fixtures";

const approveProject = () => {
  let session = createResearchProjectConstructionSession(makeProjectInput({ question: "Décrire un marqueur dans une Population définie.", outcomes: ["marqueur quantitatif"] }));
  session = proposeStudyDesign(session, session.result.studyDesignCandidates[0].designId);
  session = proposeEndpointRole(session, session.result.endpointCandidates[0].endpointId, "PRIMARY_CANDIDATE");
  for (let index = 0; index < 30; index += 1) {
    const gate = session.result.decisionsRequired.find((item) => item.status === "PENDING" && item.gateId !== "PRJ-GATE-DOCUMENT-HANDOFF");
    if (!gate) break;
    session = decideProjectGate(session, gate.gateId, "APPROVED", "Décision humaine justifiée dans le test.", "Investigateur responsable", null, `2026-08-10T12:${String(index).padStart(2, "0")}:00.000Z`);
  }
  return session;
};

describe("PRJ-001 — décisions humaines, versioning et propagation", () => {
  it("n’adopte un design qu’après proposition et décision humaine traçable", () => {
    let session = createResearchProjectConstructionSession(makeProjectInput());
    expect(session.result.selectedStudyDesignCandidate).toBeNull();
    const designId = session.result.studyDesignCandidates[0].designId;
    session = proposeStudyDesign(session, designId);
    session = decideProjectGate(session, "PRJ-GATE-STUDY-DESIGN", "APPROVED", "Ce plan répond à la Question sous les limites affichées.", "Responsable scientifique", "mandat:test", "2026-08-10T12:00:00.000Z");
    expect(session.result.selectedStudyDesignCandidate).toEqual(expect.objectContaining({ designId, humanSelected: true }));
    expect(session.result.selectedStudyDesignCandidate?.decisionRecordId).toBe(session.controls.studyDesignDecisionId);
    expect(session.decisionHistory.at(-1)).toEqual(expect.objectContaining({ actor: "Responsable scientifique", mandateRef: "mandat:test" }));
  });

  it("gèle une version seulement après toutes les portes structurantes puis autorise un handoff Document distinct", () => {
    let session = approveProject();
    expect(session.result.candidateVersion.status).toBe("FROZEN_BY_HUMAN");
    expect(session.versionHistory).toHaveLength(1);
    expect(session.result.documentHandoff.status).toBe("READY_FOR_HUMAN_AUTHORIZATION");
    const frozenId = session.result.candidateVersion.versionId;
    session = decideProjectGate(session, "PRJ-GATE-DOCUMENT-HANDOFF", "APPROVED", "Projection documentaire autorisée depuis la version gelée.", "Investigateur responsable", null, "2026-08-10T13:00:00.000Z");
    expect(session.result.documentHandoff.status).toBe("AUTHORIZED");
    expect(session.result.candidateVersion.versionId).toBe(frozenId);
    expect(session.versionHistory).toHaveLength(1);
  });

  it("préserve une version gelée et ouvre une nouvelle candidate après changement majeur confirmé", () => {
    let session = approveProject();
    const frozenId = session.result.candidateVersion.versionId;
    const endpointId = session.result.endpointCandidates[0].endpointId;
    session = requestProjectChange(session, { eventType: "EndpointChanged", description: "Réouverture du Critère candidat.", sourceIds: [endpointId], targetIds: [endpointId] });
    const changeId = session.result.impactGraph.changes[0].changeId;
    expect(session.result.candidateVersion.status).toBe("FROZEN_BY_HUMAN");
    session = decideProjectChange(session, changeId, "CONFIRMED");
    expect(session.result.candidateVersion.status).toBe("CANDIDATE_NOT_FROZEN");
    expect(session.result.candidateVersion.priorVersion).toBe(frozenId);
    expect(session.result.candidateVersion.versionId).not.toBe(frozenId);
    expect(session.versionHistory.map((item) => item.versionId)).toContain(frozenId);
    expect(session.result.decisionsRequired).toContainEqual(expect.objectContaining({ gateId: "PRJ-GATE-FREEZE", status: "PENDING" }));
    expect(session.result.documentHandoff.status).toBe("NOT_READY");
  });

  it("un changement rejeté préserve les objets et la version courante", () => {
    let session = approveProject();
    const frozenId = session.result.candidateVersion.versionId;
    session = requestProjectChange(session, { eventType: "TimingChanged", description: "Modifier le timing.", sourceIds: ["project-temporal"] });
    const changeId = session.result.impactGraph.changes[0].changeId;
    session = decideProjectChange(session, changeId, "REJECTED");
    expect(session.result.candidateVersion.versionId).toBe(frozenId);
    expect(session.result.impactGraph.impacts.filter((item) => item.changeId === changeId).every((item) => item.state === "PRESERVED")).toBe(true);
  });

  it("une réponse adaptative alimente réellement la Population ou le Critère candidat", () => {
    let session = createResearchProjectConstructionSession(makeProjectInput({ population: [], pathology: [], outcomes: [], objectives: false, hypotheses: false }));
    session = answerProjectQuestion(session, "PRJ-Q-POPULATION", "adultes suivis en consultation spécialisée");
    session = answerProjectQuestion(session, "PRJ-Q-OUTCOME", "variation du score fonctionnel");
    expect(session.result.populationDesign.populationConcept.clinicalContext).toContain("adultes suivis en consultation spécialisée");
    expect(session.result.variables).toContainEqual(expect.objectContaining({ definition: "variation du score fonctionnel" }));
    expect(session.result.endpointCandidates).toContainEqual(expect.objectContaining({ label: expect.stringContaining("variation du score fonctionnel") }));
  });
});
