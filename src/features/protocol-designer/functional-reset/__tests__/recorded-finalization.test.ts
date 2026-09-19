import { describe, expect, it } from 'vitest';
import recorded from './fixtures/recorded-preview-finalization.json';
import { createFunctionalResetSession } from '../session';
import { prepareContinuousWorkingDraft, type WorkingDraftUpdate } from '../continuous-project-build';
import type { StudyProposalComposition } from '@/features/scientific-thinking/contextual-study-proposal';
import { confirmResearchProjectContribution, buildProjectContextSnapshot, authorizeResearchProjectDocumentHandoff } from '@/features/research-project-construction';
import { canonicalProjectObjectType, temporalValueItem } from '@/features/research-project-construction/canonical-project-backbone';
import { acquireDocumentKnowledge } from '../documentary-conversation';
import { refreshFunctionalResetDocumentPortfolio, buildCanonicalCrfPackage } from '@/features/document-projection';
import { prepareDrciDraftSource, prepareDrciDraftPack } from '@/features/document-projection/drci-draft-contract';

describe('paid Preview capture: deterministic finalization, not a new provider qualification', () => {
  it('preserves full eligibility and the intercurrent-event constraint without manufacturing a timing from its source turn', () => {
    const s = createFunctionalResetSession();
    const composition = recorded.composition as StudyProposalComposition;
    s.runtimeTurns = [{turnId:composition.sourceTurnRef,role:'USER',content:recorded.user,createdAt:s.createdAt},
      {turnId:composition.sourceResponseRef,role:'NOXIA',content:recorded.assistant,createdAt:s.createdAt}];
    const working = prepareContinuousWorkingDraft(s,composition,recorded.update as WorkingDraftUpdate,composition.proposal.contextDigest);
    expect(working.failure).toBeNull();
    const ready=working.readyReview!;
    const project=confirmResearchProjectContribution({contribution:ready.contribution,current:null,projectId:s.projectId,
      authority:s.projectAuthority,confirmedAt:s.updatedAt,reviewedProjection:ready.candidate.humanReviewProjection,
      selectedChangeRefs:ready.candidate.humanReviewProjection.coveredChangeRefs,confirmationSourceRefs:[composition.sourceTurnRef]});
    const snapshot=buildProjectContextSnapshot({project});
    for(const ref of ['a_eligibility','a_pregnancy_handling','a_index_mri','a_m6_mri']) {
      const atom=composition.proposal.atoms.find(a=>a.ref===ref)!;
      expect(snapshot.objects.some(o=>o.content===atom.content),ref).toBe(true);
    }
    expect(JSON.stringify(ready.candidate.humanReviewProjection)).not.toContain('IRM initiale : M6');
    expect(snapshot.objects.find(o=>o.content===composition.proposal.atoms.find(a=>a.ref==='a_pregnancy_handling')!.content)?.type).toBe('CONSTRAINT');
    const evidence=acquireDocumentKnowledge({...s,project},s.updatedAt);
    const handoffDecision=authorizeResearchProjectDocumentHandoff({project,authority:s.projectAuthority,confirmedAt:s.updatedAt});
    const documents=refreshFunctionalResetDocumentPortfolio({project,previous:s.documents,handoffDecision,requestedAt:s.updatedAt,generateProtocol:true,knowledgeLibrary:evidence.sourceLibrary});
    expect(documents.lastFailure).toBeNull();
    const source=prepareDrciDraftSource({handoffDecision,protocolProjection:documents.projections.at(-1)!,crf:buildCanonicalCrfPackage(project)});
    const packet=prepareDrciDraftPack(project,source);
    for(const ref of ['a_eligibility','a_pregnancy_handling']) expect(packet.sourceFacts.some(f=>f.content===composition.proposal.atoms.find(a=>a.ref===ref)!.content)).toBe(true);
    // A scalar/constraint is not silently invented as a CanonicalVariable.
    expect(source.crf.fields.every(f=>snapshot.objects.some(o=>o.stableId===f.canonicalVariableId && o.type==='CANONICAL_VARIABLE'))).toBe(true);
  });
  it.each([
    ['CONSTRAINT','TIMING'], ['IMAGING_MODALITY','MEASUREMENTS'], ['ACQUISITION','MEASUREMENTS'],
    ['CONSTRAINT','ENDPOINTS'], ['ELIGIBILITY_CRITERION','POPULATION'], ['ANALYSIS_SPECIFICATION','CONFOUNDERS'],
  ])('preserves explicit %s independently of the %s discussion area', (proposedType,studyRole) => {
    expect(canonicalProjectObjectType({proposedType,studyRole})).toBe(proposedType);
    expect(temporalValueItem({proposedType,studyRole})).toBe(false);
  });
});
