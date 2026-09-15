import {expect,it} from 'vitest';
import {adoptBehaviorContribution,behaviorContribution,behaviorItem,behaviorTurn} from '../../src/features/protocol-designer/functional-reset/__tests__/p1-behavior-01a-contract-fixtures';
import {buildScientificThinkingInputFromProjectSnapshot} from '../../src/features/research-project-construction';
import {executeScientificThinkingEngine} from '../../src/features/scientific-thinking/engine';
const domains=['thrombus IRM et échographie','myocardite','suivi clinique et hospitalisation','neuro et cognition','stress et croissance végétale'];
it.each(domains)('does not turn objectives into operands: %s',domain=>{
 const turn=behaviorTurn(`turn:${domain}`,`Comparer ${domain}. Comprendre les différences.`);
 const contribution=behaviorContribution({contributionId:`contribution:${domain}`,turns:[turn],candidateObjects:[
  behaviorItem({itemId:'obj:a',proposedType:'OBJECTIVE',content:`Comparer ${domain}`,turnId:turn.turnId}),
  behaviorItem({itemId:'obj:b',proposedType:'OBJECTIVE',content:'Comprendre les différences',turnId:turn.turnId}),
 ]});
 const project=adoptBehaviorContribution(contribution,null,1);const before=JSON.stringify(project);
 const input=buildScientificThinkingInputFromProjectSnapshot({project});const output=executeScientificThinkingEngine(input);
 expect(input.scientificObjectTerms).toEqual([]);expect(input.scientificPurpose).toHaveLength(2);
 expect(output.questions.some(q=>q.text.startsWith('Existe-t-il une association entre'))).toBe(false);
 expect(output.questions.some(q=>q.testability==='NEEDS_CLARIFICATION')).toBe(true);
 expect(JSON.stringify(project)).toBe(before);
});
it.each(domains)('retains useful variable association candidates: %s',domain=>{
 const turn=behaviorTurn(`turn:positive:${domain}`,`Explorer une association dans ${domain}`);
 const contribution=behaviorContribution({contributionId:`positive:${domain}`,turns:[turn],candidateObjects:[
  behaviorItem({itemId:'obj',proposedType:'OBJECTIVE',content:`Explorer une association dans ${domain}`,turnId:turn.turnId}),
  behaviorItem({itemId:'var:a',proposedType:'MEASURED_VARIABLE',content:'Variable A',turnId:turn.turnId}),
  behaviorItem({itemId:'var:b',proposedType:'MEASURED_VARIABLE',content:'Variable B',turnId:turn.turnId}),
 ]});
 const project=adoptBehaviorContribution(contribution,null,2);
 const input=buildScientificThinkingInputFromProjectSnapshot({project});const output=executeScientificThinkingEngine(input);
 expect(input.scientificObjectTerms).toEqual(['Variable A','Variable B']);
 expect(output.questions.some(q=>q.text.includes('association entre Variable A et Variable B'))).toBe(true);
 expect(output.questions.every(q=>q.reviewState==='PENDING')).toBe(true);
});
