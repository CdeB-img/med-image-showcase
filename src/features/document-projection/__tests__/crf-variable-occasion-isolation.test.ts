import { describe, expect, it } from 'vitest';
import { buildCanonicalCrfPackage } from '..';
import { behaviorContribution, behaviorItem, behaviorTurn, adoptBehaviorContribution } from '@/features/protocol-designer/functional-reset/__tests__/p1-behavior-01a-contract-fixtures';

const fixture = (labels: string[], explicit: boolean) => {
  const turn=behaviorTurn('turn:collection-isolation', labels.join(' ; '));
  const contribution=behaviorContribution({ contributionId:'contribution:collection-isolation',turns:[turn],candidateObjects:[
    ...labels.map((content,i)=>behaviorItem({itemId:`variable:${i}`,proposedType:'CANONICAL_VARIABLE',content,turnId:turn.turnId})),
    behaviorItem({itemId:'visit:later',proposedType:'VISIT',content:'Visite de suivi',turnId:turn.turnId}),
  ] });
  const source={...contribution,scientificContent:{...contribution.scientificContent,expectedVariableOccasions:explicit ? [0,1].map(i=>({
    operation:'ADD' as const,occasionId:`occasion:${i}`,variableProjectRef:`variable:${i}`,
    anchor:{kind:'TIMEPOINT' as const,direction:'AFTER' as const,unit:'DAYS',offset:i*30,lowerBound:null,upperBound:null,relativeEventLabel:null,tolerance:null,
      reference:{status:'UNKNOWN' as const,unresolvedReason:'REFERENCE_EVENT_NOT_SUPPLIED' as const}},
    studyUnitOrGroupRef:null,applicableContext:null,sourceText:turn.content,assertionKind:'USER_STATED' as const,evidenceRefs:[],
  })) : []}};
  return adoptBehaviorContribution(source, null, 0);
};

describe('CRF collection occasions are scoped to the canonical variable', () => {
  it.each([
    ['Concentration avant traitement','Concentration au suivi','Tolérance'],
    ['Mesure initiale','Mesure répétée','Qualité de mesure'],
    ['Fonction initiale','Fonction au contrôle','Événement intercurrent'],
  ])('does not assign every variable to the sole visit: %s', (...labels) => {
    const project=fixture(labels,false);
    const before=JSON.stringify(project);
    const crf=buildCanonicalCrfPackage(project);
    expect(crf.fields).toHaveLength(3);
    expect(crf.fields.every(f=>f.expectedOccasionRefs.length===0)).toBe(true);
    expect(JSON.stringify(project)).toBe(before);
  });

  it('preserves both explicit occasions separately and leaves the third variable unbound', () => {
    const project=fixture(['Mesure initiale','Mesure au suivi','Autre donnée'],true);
    const crf=buildCanonicalCrfPackage(project);
    const occasions=project.canonicalState!.expectedVariableOccasions.filter(o=>o.actuality==='CURRENT');
    expect(occasions).toHaveLength(2);
    for(const field of crf.fields) {
      const bound=occasions.filter(o=>o.variableProjectRef===field.canonicalVariableId);
      expect(field.expectedOccasionRefs).toHaveLength(bound.length);
      for(const other of occasions.filter(o=>o.variableProjectRef!==field.canonicalVariableId))
        expect(field.expectedOccasionRefs.some(ref=>ref.endsWith('@'+other.occasionId))).toBe(false);
      for(const own of bound) expect(field.expectedOccasionRefs.some(ref=>ref.endsWith('@'+own.occasionId))).toBe(true);
    }
  });
});
