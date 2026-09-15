import {expect,it,afterEach} from 'vitest';
import {render,screen,cleanup,fireEvent} from '@testing-library/react';
import FunctionalContributionReview from '../../src/features/protocol-designer/functional-reset/ContributionReview';
import {adoptInitial,extraction} from './live-evidence';
import {contributionFromPersistentDelta} from '../../src/features/protocol-designer/product-bridge';
import {confirmResearchProjectContribution,ensureCanonicalProjectState,prepareResearchProjectContributionCandidate} from '../../src/features/research-project-construction';
afterEach(cleanup);
it('shows S1 omission in an update, permits explicit partial adoption and never adopts the warning',()=>{
 const {project}=adoptInitial(1); const turn=extraction(2,project);
 let confirmed=false;
 render(<FunctionalContributionReview contribution={turn.contribution} candidate={turn.prepared} currentProject={project} status="PENDING" onConfirm={()=>{confirmed=true}} onCorrect={()=>{}} onReject={()=>{}} />);
 expect(screen.getByText(/Compréhension partielle/)).toBeVisible();
 expect(screen.getByText(/Interprétation complète du passage.*adultes avec une myocardite aiguë récente/)).toBeVisible();
 fireEvent.click(screen.getByRole('button',{name:'Cela correspond à mon projet'}));expect(confirmed).toBe(true);
 const adopted=confirmResearchProjectContribution({contribution:turn.contribution,current:project,projectId:project.projectId,authority:{actorRef:'researcher',mandateRef:'PROJECT_OWNER'},confirmedAt:'2026-09-15T12:00:00Z'});
 expect(ensureCanonicalProjectState(adopted).objects.some(o=>o.content.includes('Interprétation complète du passage'))).toBe(false);
 expect(ensureCanonicalProjectState(adopted).objects.filter(o=>o.actuality==='CURRENT').some(o=>/adultes avec une myocardite aiguë/.test(o.content))).toBe(false);
});
it.each(['cardiaque','neurologique','clinique','écologique'])('covers omitted spans without domain-specific rules: %s', domain=>{
 const base=extraction(2,adoptInitial(1).project);
 const raw=`Une population ${domain} adulte. Un suivi de six mois.`;
 const conversation={...base.conversation,turns:[{...base.conversation.turns[0],content:raw}]};
 for(const sourceText of ['Un suivi de six mois.',raw]){
  const candidate={...base.checked.candidate!,changes:[{...base.checked.candidate!.changes[0],content:'Un suivi de six mois.',sourceText}]};
  const contribution=contributionFromPersistentDelta({candidate,conversation,currentProject:null})!;
  expect(contribution.scientificContent.clarificationNeeds.some(i=>i.content.includes(`population ${domain} adulte`))).toBe(true);
  expect(prepareResearchProjectContributionCandidate(contribution,null).status).toBe('CANDIDATE_PENDING_HUMAN_CONFIRMATION');
 }
});
it('a fully represented literal source needs no omission warning',()=>{
 const base=extraction(2,adoptInitial(1).project);
 const raw='Une population adulte. Un suivi de six mois.';
 const conversation={...base.conversation,turns:[{...base.conversation.turns[0],content:raw}]};
 const candidate={...base.checked.candidate!,changes:['Une population adulte.','Un suivi de six mois.'].map((content,i)=>({...base.checked.candidate!.changes[0],candidateRef:`complete:${i}`,content,sourceText:content}))};
 const contribution=contributionFromPersistentDelta({candidate,conversation,currentProject:null})!;
 expect(contribution.scientificContent.clarificationNeeds).toEqual([]);
});
it('does not certify an omitted fact inside a single selected source span',()=>{
 const base=extraction(2,adoptInitial(1).project);const raw='Adultes atteints de myocardite aiguë récente.';
 const conversation={...base.conversation,turns:[{...base.conversation.turns[0],content:raw}]};
 const candidate={...base.checked.candidate!,changes:[{...base.checked.candidate!.changes[0],content:'Myocardite',sourceText:raw}]};
 const contribution=contributionFromPersistentDelta({candidate,conversation,currentProject:null})!;
 const surfaced=contribution.scientificContent.clarificationNeeds.some(i=>i.epistemicBoundary.sourceText===raw);
 expect(surfaced).toBe(process.env.NOXIA_EXPECT_COARSE_RED!=='1');
});
