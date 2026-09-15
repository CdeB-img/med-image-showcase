import {expect,it,afterEach} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import Review from '../../src/features/protocol-designer/functional-reset/ContributionReview';
import {adoptBehaviorContribution,behaviorContribution,behaviorItem,behaviorTurn} from '../../src/features/protocol-designer/functional-reset/__tests__/p1-behavior-01a-contract-fixtures';
import {buildHumanReviewProjection,prepareResearchProjectContributionCandidate,ensureCanonicalProjectState} from '../../src/features/research-project-construction';
afterEach(cleanup);
const types=['ELIGIBILITY_CRITERION','INTERVENTION','CONDITION','PROJECT_INFORMATION'];
const prepare=(type:string,polarity:string)=>{
 const turn=behaviorTurn(`polarity:${type}:${polarity}`,'Une qualification explicite.');
 const contribution=behaviorContribution({contributionId:`contribution:${turn.turnId}`,turns:[turn],candidateObjects:[behaviorItem({itemId:'qualified',proposedType:type,content:'Événement étudié',turnId:turn.turnId,polarity})]});
 return {contribution,prepared:prepareResearchProjectContributionCandidate(contribution,null)};
};
it.each(types)('preserves negation for %s in initial review and canonical adoption',type=>{
 const {contribution,prepared}=prepare(type,'NEGATED');const before=JSON.stringify(prepared.canonicalChangeSet);
 const items=prepared.humanReviewProjection.sections.flatMap(s=>s.items);
 expect(items[0].content).toBe('Exclusion / absence : Événement étudié');
 render(<Review contribution={contribution} candidate={prepared} status="PENDING" onConfirm={()=>{}} onCorrect={()=>{}} onReject={()=>{}} />);
 expect(screen.getByText(/Exclusion \/ absence : Événement étudié/)).toBeVisible();
 const project=adoptBehaviorContribution(contribution,null,1);
 expect(ensureCanonicalProjectState(project).objects[0].projection.sourcePolarity).toBe('NEGATED');
 expect(JSON.stringify(prepared.canonicalChangeSet)).toBe(before);
});
it.each([['AFFIRMED','Événement étudié'],['UNCERTAIN','Incertain : Événement étudié'],['CONDITIONAL','Sous condition : Événement étudié']])('preserves %s', (polarity,label)=>{
 const {prepared}=prepare('CONDITION',polarity);
 expect(prepared.humanReviewProjection.sections.flatMap(s=>s.items)[0].content).toBe(label);
});
it('keeps the old negation explicit on removal and both polarities on replacement',()=>{
 const {contribution}=prepare('CONDITION','NEGATED');const current=adoptBehaviorContribution(contribution,null,1);
 const old=ensureCanonicalProjectState(current).objects[0];
 const {prepared}=prepare('CONDITION','AFFIRMED');const base=prepared.canonicalChangeSet; const candidate=base.objectChanges[0].candidate!;
 const change={...base.objectChanges[0],objectId:old.objectId,previousVersionRef:old.objectVersionId};
 const removal=buildHumanReviewProjection({...base,baseProjectVersion:current.versionId,objectChanges:[{...change,operation:'REMOVE',candidate:null}]},current);
 expect(removal.sections.flatMap(s=>s.items)[0].content).toMatch(/^− Exclusion \/ absence : Événement étudié/);
 const replacement=buildHumanReviewProjection({...base,baseProjectVersion:current.versionId,objectChanges:[{...change,operation:'REPLACE',candidate:{...candidate,objectId:old.objectId}}]},current);
 expect(replacement.sections.flatMap(s=>s.items)[0].content).toContain('Exclusion / absence : Événement étudié → Événement étudié');
});
