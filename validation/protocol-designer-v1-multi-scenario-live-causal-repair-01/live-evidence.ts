// Test-only loader. Historical bytes stay immutable; no network fallback exists.
import { buildPersistentSourceCatalog, materializePersistentSourceAnchors, constrainPersistentRelationsToCanonicalSignatures, validatePersistentProjectDelta, contributionFromPersistentDelta } from '../../src/features/protocol-designer/product-bridge';
import { confirmResearchProjectContribution, prepareResearchProjectContributionCandidate, type ResearchProjectOwnerProjection } from '../../src/features/research-project-construction';
import type { ScientificInterpretationConversation } from '../../src/features/scientific-interpretation/contracts';

import {recorded} from './recorded-exchanges';
export {live,mission,baseline,rows,findings,hash,recorded} from './recorded-exchanges';
export const extraction = (call: number, project: ResearchProjectOwnerProjection | null) => {
  const saved = recorded(call);
  const raw = saved.request.input.split("DERNIER MESSAGE UTILISATEUR (source de l'assertion ou de l'adoption) :\n")[1].split('\n\nPROJECTION DE TRAVAIL FRANÇAISE')[0];
  const conversation: ScientificInterpretationConversation = { conversationId: saved.row.conversation, language: 'fr', turns: [{ turnId: saved.row.turn, role: 'USER', content: raw, createdAt: saved.row.started_at }] };
  const catalog = buildPersistentSourceCatalog(conversation);
  const wire = JSON.parse(saved.text);
  const materialized = materializePersistentSourceAnchors({ value: wire, catalog, currentUserTurn: {turnId: saved.row.turn, content: raw} });
  if (!materialized.valid || !materialized.value) throw new Error('RECORDED_SOURCE_NOT_MATERIALIZABLE');
  const constrained = constrainPersistentRelationsToCanonicalSignatures(materialized.value, project);
  const checked = validatePersistentProjectDelta(constrained.value, raw, project, conversation);
  if (!checked.validation.valid || !checked.candidate) throw new Error(JSON.stringify(checked.validation));
  const contribution = contributionFromPersistentDelta({ candidate: checked.candidate, conversation, currentProject: project, createdAt: saved.row.started_at });
  if (!contribution) throw new Error('RECORDED_CONTRIBUTION_MISSING');
  const prepared = prepareResearchProjectContributionCandidate(contribution, project);
  return { saved, raw, conversation, catalog, wire, materialized, checked, contribution, prepared };
};
export const adoptInitial = (call: number) => {
  const loaded = extraction(call, null);
  const sid = loaded.saved.row.session;
  const project = confirmResearchProjectContribution({ contribution: loaded.contribution, current: null, projectId: `${sid}:research-project`, authority: {actorRef: `${sid}:CURRENT_RESEARCHER`, mandateRef: 'PROJECT_OWNER'}, confirmedAt: loaded.saved.row.completed_at });
  return { ...loaded, project };
};
