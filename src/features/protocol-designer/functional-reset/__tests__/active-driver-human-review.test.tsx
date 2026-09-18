import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import ContributionReview from '../ContributionReview';
import { contributionDecisionScopeGroups, prepareResearchProjectContributionCandidate } from '@/features/research-project-construction';
import { prepareTerraConversation } from '@/features/scientific-thinking/scientific-collaborator-conversation';
import { behaviorItem, richStudyContribution } from './p1-behavior-01a-contract-fixtures';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const fixture = () => {
 const contribution=richStudyContribution();
 contribution.scientificContent.clarificationNeeds=[behaviorItem({itemId:'open-analysis',proposedType:'UNCERTAINTY',content:'La mesure principale reste à préciser.',turnId:contribution.source.turns[0].turnId,epistemicState:'UNKNOWN'})];
 return {contribution,candidate:prepareResearchProjectContributionCandidate(contribution,null)};
};
const callbacks=()=>({onConfirm:vi.fn(),onConfirmScope:vi.fn(),onCorrect:vi.fn(),onReject:vi.fn()});

describe('active driver and a single scientific Human Review projection',()=>{
 it('uses one domain-independent active-decision rule without forcing questions or claiming unavailable consultations',()=>{
  const instructions=['essai pharmacologique','reproductibilité industrielle','question ciblée'].map(content=>prepareTerraConversation({apiVersion:'1.0.0',conversation:{conversationId:'generic',language:'fr',turns:[{turnId:'u',role:'USER',content}]},currentProject:null,evaluatePersistentDelta:false},true).instruction);
  expect(new Set(instructions).size).toBe(1);
  expect(instructions[0]).toContain('dans cette même réponse');
  expect(instructions[0]).toContain('Ne prétends jamais avoir consulté');
  expect(instructions[0]).toContain('ne force pas une question finale');
  expect(instructions[0]).not.toMatch(/colchicine|myocardite|ultratrail/iu);
 });
 it('shows scientific choices once and keeps relations and native IDs out of the default view',()=>{
  const data=fixture(),before=JSON.stringify(data),cb=callbacks();
  render(<ContributionReview {...data} {...cb} status="PENDING"/>);
  const summary=screen.getByTestId('standard-initial-review-summary');
  const objects=data.candidate.humanReviewProjection.sections.flatMap(s=>s.items).filter(i=>i.changeKind!=='RELATION'&&i.objectType!=='UNCERTAINTY');
  expect(within(summary).getAllByTestId('human-review-decision-row')).toHaveLength(objects.length);
  for(const item of objects) expect(summary.textContent?.toLocaleLowerCase()).toContain(item.content.replace(/^\+\s+/u,'').toLocaleLowerCase());
  expect(summary.textContent).not.toMatch(/relation avec|→|review-item:|canonical-change:/u);
  expect(screen.queryByTestId('review-full-scientific-delta')).toBeNull();
  expect(screen.getByText(`${objects.length} choix proposés · 1 points ouverts`)).toBeVisible();
  expect(screen.getByTestId('human-review-open-points')).toHaveTextContent('La mesure principale reste à préciser.');
  expect(summary).not.toHaveTextContent('La mesure principale reste à préciser.');
  expect(JSON.stringify(data)).toBe(before);expect(cb.onConfirm).not.toHaveBeenCalled();
 });
 it('preserves the exact native graph in requested technical details without a second scientific review',()=>{
  const data=fixture(),before=JSON.stringify(data);render(<ContributionReview {...data} {...callbacks()} status="PENDING"/>);
  expect(screen.queryByTestId('review-audit-detail')).toBeNull();fireEvent.click(screen.getByTestId('functional-review-details'));
  expect(screen.getByRole('dialog')).toHaveTextContent('Détails techniques de la revue');
  const audit=screen.getByTestId('review-audit-detail');
  const relations=data.candidate.humanReviewProjection.sections.flatMap(s=>s.items).filter(i=>i.changeKind==='RELATION');
  for(const relation of relations)expect(audit).toHaveTextContent(relation.content);
  expect(screen.queryByTestId('review-full-scientific-delta')).toBeNull();
  expect(JSON.stringify(data)).toBe(before);
 });
 it('maps a partial selection to unchanged native dependency groups, including relation targets',()=>{
  const data=fixture(),before=JSON.stringify(data),cb=callbacks(),groups=contributionDecisionScopeGroups(data.candidate,null);
  expect(groups.length).toBeGreaterThan(1);render(<ContributionReview {...data} {...cb} status="PENDING"/>);
  const checkboxes=screen.getAllByRole('checkbox',{hidden:true});expect(checkboxes).toHaveLength(groups.length);
  const decisions=data.candidate.humanReviewProjection.sections.flatMap(s=>s.items).filter(i=>i.changeKind!=='RELATION'&&i.objectType!=='UNCERTAINTY');
  for(const checkbox of checkboxes) expect(checkbox.closest('label')).toHaveTextContent(/Choix \d/u);
  expect(screen.getAllByTestId('human-review-decision-row')).toHaveLength(decisions.length);
  fireEvent.click(checkboxes.at(-1)!);fireEvent.click(screen.getByRole('button',{name:'Enregistrer la sélection',hidden:true}));
  expect(cb.onConfirmScope).toHaveBeenCalledWith(groups.slice(0,-1).flat());
  expect(cb.onConfirm).not.toHaveBeenCalled();expect(JSON.stringify(data)).toBe(before);
 });
 it('keeps explicit confirm, correct and reject callbacks and disables actions for a read-only or historical review',()=>{
  const data=fixture(),cb=callbacks();const view=render(<ContributionReview {...data} {...cb} status="PENDING"/>);
  fireEvent.click(screen.getByRole('button',{name:'Confirmer les choix et enregistrer'}));expect(cb.onConfirm).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button',{name:'Décrire une correction'}));expect(cb.onCorrect).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button',{name:'Refuser cette proposition'}));expect(cb.onReject).toHaveBeenCalledTimes(1);
  view.rerender(<ContributionReview {...data} {...cb} status="PENDING" readOnly/>);
  expect(screen.queryByRole('button',{name:'Confirmer les choix et enregistrer'})).toBeNull();
  view.rerender(<ContributionReview {...data} {...cb} status="PENDING" actionable={false}/>);
  expect(screen.queryByRole('button',{name:'Confirmer les choix et enregistrer'})).toBeNull();
 });
});
