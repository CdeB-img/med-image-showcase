import { writeFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import ProtocolDesignerWorkspace from '../ProtocolDesignerWorkspace';
import { createFunctionalResetSession, type FunctionalResetSession } from '../session';
import { contributionFromPersistentDelta, parseProductBridgeRequest, validatePersistentProjectDelta, type ProductBridgeRequest, type ProductBridgeResponse } from '../../product-bridge';
import { prepareResearchProjectContributionCandidate } from '../../../research-project-construction/contribution-owner-boundary';
import { buildCurrentTurnNavigation } from '../../../query-navigation/current-turn-navigation';
import { realizeGovernedConversation } from '../../../query-navigation/governed-conversation-realization';
const bridge=vi.hoisted(()=>vi.fn());
vi.mock('../../product-bridge-client',async original=>({...await original<object>(),requestProtocolDesignerBridge:bridge}));
const seed="je veux faire une étude de l'infarctus a l'irm";
afterEach(()=>{cleanup();vi.unstubAllGlobals();bridge.mockReset();localStorage.clear();});
it('Standard actually presents one high-value scientific question with a native explicit-only review, no auto Project and no network',async()=>{
  const network=vi.fn(()=>{throw new Error('LIVE_FORBIDDEN');});vi.stubGlobal('fetch',network);
  bridge.mockImplementation(async(r:ProductBridgeRequest):Promise<ProductBridgeResponse>=>{
    expect(parseProductBridgeRequest({...r,apiVersion:'1.0.0'})).not.toBeNull();
    const turn=r.conversation.turns.at(-1)!;
    const checked=validatePersistentProjectDelta({changes:[
      {operation:'ADD',candidateRef:'ctx:condition',proposedType:'CONDITION',content:'infarctus',sourceText:'infarctus',epistemicState:'KNOWN',assertionKind:'USER_STATED'},
      {operation:'ADD',candidateRef:'ctx:mri',proposedType:'IMAGING_MODALITY',content:'IRM',sourceText:'irm',epistemicState:'KNOWN',assertionKind:'USER_STATED'},
    ],relations:[],temporalQualifications:[],expectedVariableOccasions:[]},turn.content,r.currentProject,r.conversation);
    expect(checked.validation.valid).toBe(true);
    const contribution=contributionFromPersistentDelta({candidate:checked.candidate!,conversation:r.conversation,currentProject:r.currentProject,createdAt:'2026-09-17T10:00:00Z'})!;
    const candidate=prepareResearchProjectContributionCandidate(contribution,r.currentProject);
    const nav=buildCurrentTurnNavigation({sourceTurnRef:turn.turnId,sourceText:turn.content,contribution,candidate,validation:checked.validation,currentProject:r.currentProject,preProjectNavigation:r.preProjectNavigation});
    const realization=realizeGovernedConversation({envelope:nav.envelope,localWhatText:nav.localWhatText});
    return {apiVersion:'1.0.0',assistantReply:realization.assistantReply,assistantTurn:{turnId:'ctx:noxia',role:'NOXIA',content:realization.assistantReply},currentTurnNavigation:nav,governedRealization:realization,
      persistentExtraction:{called:true,status:'CANDIDATE',contribution,candidate:checked.candidate,wireCandidate:checked.wireCandidate,validation:checked.validation,providerArtifact:null},
      observability:{provider:'GOOGLE_GEMINI',model:'LOCAL_SYNTHETIC_NO_PROVIDER',calls:0,conversationCalls:0,conversationLatencyMs:0,extractionLatencyMs:0,projectWrites:0,providerCalls:[]}};
  });
  let latest:FunctionalResetSession;
  const base=createFunctionalResetSession();const initial={...base,conversationLanguageGateway:{...base.conversationLanguageGateway,conversationLanguage:'fr' as const}};
  render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={initial} onSessionChange={s=>{latest=s;}} /></HelmetProvider>);
  fireEvent.change(screen.getByRole('textbox'),{target:{value:seed}});fireEvent.click(screen.getByRole('button',{name:'Envoyer'}));
  await waitFor(()=>expect(bridge).toHaveBeenCalledTimes(1),{timeout:8000});
  await waitFor(()=>expect(latest?.entries.some(e=>e.kind==='TEXT' && e.role==='NOXIA' && e.content.includes('Que cherchez-vous d’abord à comprendre')),
    JSON.stringify(latest?.entries.map(e=>({kind:e.kind,role:e.role,content:'content' in e?e.content:null})))).toBe(true),{timeout:8000});
  expect(bridge).toHaveBeenCalledTimes(1);expect(network).not.toHaveBeenCalled();expect(latest!.project).toBeNull();
  expect(latest!.pendingContribution?.scientificContent.candidateObjects.map(o=>o.content)).toEqual(expect.arrayContaining(['infarctus','IRM']));
  expect(latest!.pendingContribution?.scientificContent.candidateObjects).toHaveLength(2);
  const noxia=latest!.entries.flatMap(e=>e.kind==='TEXT' && e.role==='NOXIA' && !initial.entries.some(old=>old.entryId===e.entryId)?[e.content]:[]).join('\n');
  expect((noxia.match(/\?/g)??[]).length).toBe(1);expect(noxia).toContain('aucun choix n’est fixé');
  writeFileSync('validation/protocol-designer-v1-contextual-scientific-implications-01/standard-idm-response.json',JSON.stringify({provenance:'ACTUAL_STANDARD_HANDLER_LOCAL_SYNTHETIC_BRIDGE_CURRENT_NATIVE_N1_PRJ_NO_LIVE',user:seed,assistant:noxia,project:latest!.project,providerCalls:0,bridgeCalls:bridge.mock.calls.length,pendingExplicitObjects:latest!.pendingContribution?.scientificContent.candidateObjects.map(o=>o.content)},null,2)+'\n');
  expect(noxia).not.toMatch(/FEVG|STEMI|NSTEMI|50 %|40–80|MVO|INFERRED|UNKNOWN/);
},15000);
