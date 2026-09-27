import { describe, expect, it } from "vitest";
import { createFunctionalResetSession, persistFunctionalResetSession, loadFunctionalResetSession, type FunctionalResetSession } from "../session";
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
  it("does not dispatch from a local adoption acknowledgement without server Chat proof", () => {
    const s = source(); s.runtimeTurns[1] = { ...s.runtimeTurns[1], turnId: "local-adoption-confirmation" };
    expect(() => captureProjectPreparation(s)).toThrow("PREPARATION_CHAT_RESPONSE_REQUIRED");
  });
  it("reads legacy interrupted sessions honestly without inventing a checkpoint", () => {
    const s=source();s.workingDraftPreparations=[{sourceTurnRef:s.runtimeTurns[0].turnId,status:"PREPARING",code:null,updatedAt:s.updatedAt}];
    persistFunctionalResetSession(localStorage,s);const restored=loadFunctionalResetSession(localStorage);
    expect(restored.workingDraftPreparations![0].status).toBe("UNKNOWN/INTERRUPTED");
    expect(restored.workingDraftPreparations![0].checkpoint).toBeUndefined();
    expect(activeProjectPreparation(restored)).toBeUndefined();
    expect(restored.runtimeTurns).toEqual(s.runtimeTurns);
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

// Scientific construction and canonical adoption stay in their real owners.
import {acceptWorkingDraftUpdate, workingDraftInputDigest} from "../continuous-project-build";
import {projectPreparationReview} from "../project-preparation-lifecycle";
import {controlledStudyProposal,DOMAINS} from "./study-proposal-fixtures";
import {confirmResearchProjectContribution} from "../../../research-project-construction";
const ready = () => {
 const s=source();const p=captureProjectPreparation(s);const req=p.checkpoint!.request;
 const response=acceptWorkingDraftUpdate({requestType:"STUDY_UPDATE",proposal:controlledStudyProposal(workingDraftInputDigest(req),DOMAINS[0]),
  explicitDecisions:[],inferredAtomRefs:[],rejectedAtomRefs:[]},req);
 return consumeProjectPreparation(addProjectPreparation(s,p),p.checkpoint!.preparationId,
  {workingDraftUpdate:response.update,workingStudyProposal:response.composition});
};
describe("checkpoint / real review / canonical Project frontier",()=>{
 it("creates one logical review from repeat durable reads",()=>{
  const s=ready(), p=s.workingDraftPreparations![0];
  expect(projectPreparationReview(s)?.applicable).toBe(true);
  expect(s.entries.filter(e=>e.reviewInvitation)).toHaveLength(1);
  expect(consumeProjectPreparation(s,p.checkpoint!.preparationId,{workingDraftUpdate:null,workingStudyProposal:null})).toBe(s);
 });
 it("keeps an earlier review after a later NO_CHANGE",()=>{
  const s=ready(), before=s.workingDraftPreparations![0].result;
  const later={...s,runtimeTurns:[...s.runtimeTurns,{turnId:"turn:next",role:"USER" as const,content:"Question bibliographique",createdAt:s.updatedAt},
   {turnId:"noxia-turn:22222222-2222-4222-8222-222222222222",role:"NOXIA" as const,content:"Discussion bibliographique",createdAt:s.updatedAt}]};
  const p=captureProjectPreparation(later);
  const result=consumeProjectPreparation(addProjectPreparation(later,p),p.checkpoint!.preparationId,{workingDraftUpdate:{requestType:"INSUFFICIENT",proposal:null,explicitDecisions:[],inferredAtomRefs:[],rejectedAtomRefs:[]},workingStudyProposal:null});
  expect(result.workingDraftPreparations!.at(-1)!.status).toBe("NO_CHANGE");
  expect(projectPreparationReview(result)?.preparation.result).toBe(before);
 });
 it("preserves the exact result but blocks adoption after a canonical base change",()=>{
  const s=ready(),review=projectPreparationReview(s)!;
  const project=confirmResearchProjectContribution({contribution:review.prepared.contribution,current:null,projectId:s.projectId,
   authority:s.projectAuthority,confirmedAt:s.updatedAt,reviewedProjection:review.prepared.candidate.humanReviewProjection});
  const after={...s,project};
  expect(projectPreparationReview(after)).toMatchObject({applicable:false,blocker:"PROJECT_BASE_CHANGED"});
  expect(after.workingDraftPreparations![0].result).toBe(s.workingDraftPreparations![0].result);
  const next={...after,runtimeTurns:[...after.runtimeTurns,{turnId:"turn:next",role:"USER" as const,content:"Nouvelle précision",createdAt:s.updatedAt},
   {turnId:"noxia-turn:22222222-2222-4222-8222-222222222222",role:"NOXIA" as const,content:"Réponse",createdAt:s.updatedAt}]};
  const p=captureProjectPreparation(next);
  expect(p.checkpoint!.request.currentProject?.projectDigest).toBe(project.projectDigest);
  expect(p.checkpoint!.previousDraftDigest).toBeTruthy();
 });
});
