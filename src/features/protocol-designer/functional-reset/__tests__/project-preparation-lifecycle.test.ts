import { describe, expect, it } from "vitest";
import { createFunctionalResetSession, type FunctionalResetSession } from "../session";
import { activeProjectPreparation, addProjectPreparation, captureProjectPreparation, consumeProjectPreparation,
  preparationCheckpointValid, transitionProjectPreparation } from "../project-preparation-lifecycle";
const source = (): FunctionalResetSession => ({ ...createFunctionalResetSession(), runtimeTurns: [
  { role: "USER", turnId: "turn:one", content: "Étude synthétique", createdAt: "2026-09-27T00:00:00Z" },
  { role: "NOXIA", turnId: "noxia-turn:11111111-1111-4111-8111-111111111111", content: "Proposition synthétique", createdAt: "2026-09-27T00:00:01Z" },
] });
describe("session-owned immutable checkpoint transitions", () => {
  it("captures actual consumed inputs once and refuses an unfinished response", () => {
    const s = source(); const p = captureProjectPreparation(s); const state = addProjectPreparation(s,p);
    expect(captureProjectPreparation(state)).toBe(p);
    expect(addProjectPreparation(state,p)).toBe(state);
    expect(preparationCheckpointValid(s,p.checkpoint!)).toBe(true);
    expect(() => captureProjectPreparation({ ...s, runtimeTurns: s.runtimeTurns.slice(0,1) })).toThrow("PREPARATION_CHAT_RESPONSE_REQUIRED");
  });
  it.each(["Question bibliographique", "Je précise deux centres", "non", "Je corrige l'âge à 40 ans"])("never mutates checkpoint for later turn: %s", text => {
    const s=source(), p=captureProjectPreparation(s), before=JSON.stringify(p.checkpoint);
    const after={...addProjectPreparation(s,p),runtimeTurns:[...s.runtimeTurns,{role:"USER" as const,turnId:"turn:new",content:text,createdAt:"2026-09-27T00:00:02Z"}]};
    expect(preparationCheckpointValid(after,p.checkpoint!)).toBe(true);
    expect(JSON.stringify(activeProjectPreparation(after)?.checkpoint)).toBe(before);
    expect(after.project).toBeNull();
  });
  it("detects forged or edited inputs instead of reconstructing them", () => {
    const s=source(), p=captureProjectPreparation(s);
    expect(preparationCheckpointValid({...s,sessionId:"other"},p.checkpoint!)).toBe(false);
    p.checkpoint!.request.conversation.turns[0] = {...p.checkpoint!.request.conversation.turns[0],content:"changed"};
    expect(preparationCheckpointValid(s,p.checkpoint!)).toBe(false);
  });
  it.each(["FAILED","NO_CHANGE","UNKNOWN/INTERRUPTED"] as const)("keeps explicit outcome and leaves Project untouched: %s", status => {
    const s=source(), p=captureProjectPreparation(s), id=p.checkpoint!.preparationId;
    const next=transitionProjectPreparation(addProjectPreparation(s,p),id,status,"SYNTHETIC");
    expect(next.workingDraftPreparations![0].status).toBe(status);
    expect(next.project).toBe(s.project); expect(next.runtimeTurns).toBe(s.runtimeTurns);
    if(status!=="UNKNOWN/INTERRUPTED") expect(consumeProjectPreparation(next,id,{workingDraftUpdate:null,workingStudyProposal:null})).toBe(next);
  });
  it("rejects a missing owner result without declaring supersession", () => {
    const s=source(),p=captureProjectPreparation(s);
    expect(consumeProjectPreparation(addProjectPreparation(s,p),p.checkpoint!.preparationId,
      {workingDraftUpdate:null,workingStudyProposal:null}).workingDraftPreparations![0]).toMatchObject({status:"FAILED",code:"WORKING_DRAFT_PROPOSAL_MISSING"});
  });
});
