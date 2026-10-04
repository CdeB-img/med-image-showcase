import { logicalDigest } from '@/features/knowledge-engine/canonical';
import { executeKnowledgeEngine } from '@/features/knowledge-engine';
import { collectProjectKnowledgeSources, emptyProjectSourceLibrary } from '@/features/knowledge-engine/project-source-library';
import { authorizeResearchProjectDocumentHandoff } from '@/features/research-project-construction';
import { adoptBehaviorContribution, behaviorAuthority, behaviorContribution, behaviorItem, behaviorTurn } from '@/features/protocol-designer/functional-reset/__tests__/p1-behavior-01a-contract-fixtures';
import { refreshFunctionalResetDocumentPortfolio } from '../functional-reset-boundary';
import { buildCanonicalCrfPackage } from '../study-deliverable-portfolio';
import { applyDrciHumanRevisionEntries, drciProseWordCount, materializeDrciDraftPack, pragmaticDimensioningOpenItems, prepareDrciDraftPack, prepareDrciGenerationBatches, type DrciDraftPack, type DrciHumanPackRevision, type DrciHumanRevisionEntry, type RetainedDrciProtocol } from '../drci-draft-contract';
import { materializeSynopsisRevision, prepareSynopsisRevision, SYNOPSIS_OBLIGATIONS, type SynopsisRevisionInput } from '../synopsis-revision';

// Fresh synthetic owner inputs, never a copy of a human Project or provider run.
export const OLD_DEFINITION = 'Il quantifie la présence interstitielle de gadolinium relativement au plasma, sans constituer une mesure spécifique de fibrose.';
export const NEW_DEFINITION = 'Il estime la fraction de volume extracellulaire myocardique à partir du coefficient de partition du contraste entre le myocarde et le sang, corrigé par l’hématocrite, sans constituer une mesure histologique spécifique de fibrose.';
const at = '2026-09-18T18:00:00.000Z';
const words = (text: string, count: number) => {
  const remaining = count - drciProseWordCount([text]);
  if (remaining < 0) throw new Error('PORTABLE_FIXTURE_WORD_TARGET_INVALID');
  return `${text} ${Array(remaining).fill('qualification').join(' ')}`.trim();
};
export const portableDrciFixture = () => {
  const turn = behaviorTurn('portable-doc-source', 'Étude synthétique de reproductibilité, sans participant réel.');
  const item = (id: string, type: string, content: string, extra: Partial<Parameters<typeof behaviorItem>[0]> = {}) =>
    behaviorItem({ itemId: id, proposedType: type, content, turnId: turn.turnId, ...extra });
  const project = adoptBehaviorContribution(behaviorContribution({ contributionId: 'portable-doc-contribution', turns: [turn], candidateObjects: [
    item('question', 'SCIENTIFIC_QUESTION', 'Évaluer la reproductibilité d’une mesure quantitative.'),
    item('measure-a', 'MEASUREMENT', 'Mesure quantitative A'), item('measure-b', 'MEASUREMENT', 'Mesure quantitative B'),
    item('eligibility', 'ELIGIBILITY_CRITERION', 'Consentement requis avant la procédure.'),
    item('visit', 'VISIT', 'Visite de mesure unique'),
    item('quality', 'PROJECT_INFORMATION', 'Qualité : mesures interprétables nécessaires à l’évaluabilité.'),
    item('analysis', 'PROJECT_INFORMATION', 'Analyse principale : participants avec critère évaluable.'),
    item('size', 'PROJECT_INFORMATION', 'Cible pragmatique de faisabilité de 90 participants, non calculée.'),
    item('open-policy', 'UNCERTAINTY', 'Politique de découvertes fortuites et de restitution à définir', { epistemicState: 'UNKNOWN' }),
    item('open-pressure', 'UNCERTAINTY', 'Procédure de mesure de la pression artérielle', { epistemicState: 'UNKNOWN' }),
    item('open-agent', 'UNCERTAINTY', 'Agent et dose de contraste', { epistemicState: 'UNKNOWN' }),
    item('open-renal', 'UNCERTAINTY', 'Critères rénaux locaux', { epistemicState: 'UNKNOWN' }),
    item('negation', 'PROJECT_INFORMATION', 'Aucune interaction n’est imposée.', { polarity: 'NEGATED' }),
  ] }), null, 1);
  const handoffDecision = authorizeResearchProjectDocumentHandoff({ project, authority: behaviorAuthority, confirmedAt: at });
  const knowledge = executeKnowledgeEngine({ originalQuestion: 'ECV myocardique et fibrose en IRM',
    scientificObjectTerms: [{ term: 'ECV myocardique', role: 'SUBJECT' }], context: {}, externalSearchPolicy: 'INTERNAL_ONLY',
    researchProjectId: project.projectId, researchProjectVersion: project.versionId, researchProjectDigest: project.projectDigest, createdAt: at });
  const library = collectProjectKnowledgeSources(emptyProjectSourceLibrary(project.projectId), knowledge);
  const projection = refreshFunctionalResetDocumentPortfolio({ project, handoffDecision, requestedAt: at, generateProtocol: true, knowledgeLibrary: library }).projections.at(-1)!;
  const source = { handoffDecision, protocolProjection: projection, crf: buildCanonicalCrfPackage(project) };
  const packet = prepareDrciDraftPack(project, source);
  const cite = packet.sourceFacts[0].ref;
  const evidenceRefs = projection.evidenceContent!.sources.map(s => s.source.sourceId);
  const citationText = evidenceRefs.map(ref => `Contexte scientifique synthétique [[CITE:${ref}]].`).join(' ');
  const protectedRefs = packet.sourceFacts.filter(f => f.epistemicState === 'UNKNOWN' || f.polarity === 'NEGATED').map(f => f.ref);
  const paragraphs = [OLD_DEFINITION, citationText, 'Cadre éditorial pour revue humaine.', packet.sourceFacts.filter(f => protectedRefs.includes(f.ref)).map(f => f.content).join(' ')];
  paragraphs[0] = words(paragraphs[0], 731 - drciProseWordCount(paragraphs.slice(1)));
  const synopsis: DrciDraftPack['documents'][number] = { kind: 'PROTOCOL_SYNOPSIS', title: 'Synopsis synthétique de qualification',
    sections: [{ title: 'Principe', paragraphs: paragraphs.slice(0, 3), sourceRefs: [cite] },
      { title: 'Incertitudes et contraintes', paragraphs: paragraphs.slice(3), sourceRefs: protectedRefs }], missingElements: [] };
  const full: DrciDraftPack['documents'][number] = { kind: 'PROTOCOL_FULL', title: 'Protocole synthétique',
    sections: Array.from({ length: 15 }, (_, i) => ({ title: `${i + 1}. Partie ${i + 1}`, paragraphs: [i === 0 ? citationText : i === 1 ? NEW_DEFINITION : i === 2 ? packet.sourceFacts.find(f=>f.content.startsWith('Cible pragmatique'))!.content : 'Texte synthétique sans décision supplémentaire.'], sourceRefs: [] })), missingElements: ['Institution: contact à définir', ...pragmaticDimensioningOpenItems(packet.sourceFacts)] };
  const crf: DrciDraftPack['documents'][number] = { kind: 'CRF', title: 'Recueil synthétique',
    sections: [{ title: 'Collecte', paragraphs: ['Recueil documenté selon les décisions adoptées.'], sourceRefs: [cite] }], missingElements: ['Procédure PA', 'Contraste et critères rénaux'] };
  const recruitment: DrciDraftPack['documents'][number] = { kind: 'RECRUITMENT', title: 'Information synthétique',
    sections: [{ title: 'Information candidate', paragraphs: ['L’étude ne vise pas à délivrer systématiquement des résultats individuels ; la politique de découvertes fortuites reste à définir.'], sourceRefs: [] }], missingElements: [] };
  const crfRows: DrciDraftPack['crfRows'] = source.crf.fields.map((field, i) => ({ variableRef: field.canonicalVariableId, variableId: `MEASURE_${i}`, label: field.label,
    visit: 'Visite unique', condition: null, derivedFrom: [], analysisImpact: null, domain: 'Mesures', definition: field.label, entryType: 'Nombre',
    unit: field.unit, categories: null, dataOrigin: 'SITE_RECORDED', source: 'Recueil synthétique', required: 'Selon Project', derivation: null, controls: [], specificationStatus: 'ADOPTED_PROJECT' }));
  const original = structuredClone(synopsis);
  original.sections[0].paragraphs.push('Contexte éditorial optionnel. '.repeat(100).trim());
  const fragments = synopsis.sections.flatMap((s, sectionIndex) => s.paragraphs.map((text, paragraphIndex) => ({ ref: `fragment-${sectionIndex}-${paragraphIndex}`, sectionIndex, paragraphIndex, text,
    obligations: sectionIndex === 0 && paragraphIndex === 0 ? [...SYNOPSIS_OBLIGATIONS] : [], sourceFactRefs: sectionIndex === 1 ? protectedRefs : [] })));
  const frozenCompanion = { documents: [crf, recruitment], crfRows };
  const revision: SynopsisRevisionInput = { original, originalRawRef: 'scientific-interpretation-raw:portable-original', originalProviderStatus: 'completed',
    projectBinding: packet.projectBinding, evidenceDigest: logicalDigest(projection.evidenceContent), sourceFactsDigest: logicalDigest(packet.sourceFacts), fragments,
    priorAttemptOriginalDigests: [], attemptNumber: 1, frozenCompanion, frozenDigest: logicalDigest(frozenCompanion), frozenProtocolDigest: logicalDigest(full) };
  const selection = { paragraphs: fragments.map(f => ({ sectionIndex: f.sectionIndex, fragmentRefs: [f.ref] })) };
  if (fragments.some(f => !f.text.trim())) throw new Error(`PORTABLE_FIXTURE_EMPTY_FRAGMENT:${protectedRefs.length}`);
  const repaired = materializeSynopsisRevision(selection, prepareSynopsisRevision(packet, revision), { providerStatus: 'completed', rawProviderResponseRef: 'scientific-interpretation-raw:portable-revised', createdAt: at });
  const ancestor = materializeDrciDraftPack({ documents: [repaired.document, full, crf, recruitment], crfRows }, { project, packet, generatedAt: at, synopsisRevision: repaired.provenance });
  const humanRevise = (parent: DrciDraftPack, edits: { document: DrciHumanRevisionEntry['document']; field: DrciHumanRevisionEntry['field']; sectionIndex: number | null; index: number; text: string | null }[], timestamp: string, ancestors?: DrciDraftPack[]) => {
    let value = { documents: structuredClone(parent.documents), crfRows: structuredClone(parent.crfRows) };
    const entries: DrciHumanRevisionEntry[] = [];
    for (const edit of edits) {
      const doc = value.documents.find(d => d.kind === edit.document)!;
      const section = edit.sectionIndex === null ? null : doc.sections[edit.sectionIndex];
      const originalText = (edit.field === 'PARAGRAPH' ? section!.paragraphs : doc.missingElements)[edit.index] ?? null;
      const entry: DrciHumanRevisionEntry = { document: edit.document, field: edit.field, sectionIndex: edit.sectionIndex, section: section?.title ?? 'missingElements', index: edit.index,
        originalText, revisedText: edit.text, originalDigest: logicalDigest(originalText), revisedDigest: logicalDigest(edit.text), revisionOrigin: 'HUMAN_REVIEW', reason: 'Révision éditoriale synthétique explicitement autorisée', projectBinding: parent.project, documentPackBinding: parent.packDigest };
      entries.push(entry); value = applyDrciHumanRevisionEntries(parent, entries);
    }
    const record: DrciHumanPackRevision = { kind: 'HUMAN_DOCUMENT_REVISION', scientificImpact: 'DOCUMENT_ONLY', reviewRef: `portable-review:${timestamp}`, createdAt: timestamp,
      parentPackDigest: parent.packDigest, projectBinding: parent.project, evidenceDigest: logicalDigest(parent.evidenceContent ?? null),
      ...(parent.synopsisRevision ? { priorSynopsisRevision: parent.synopsisRevision } : {}), ...(parent.humanRevision ? { priorHumanRevision: parent.humanRevision } : {}), entries };
    return materializeDrciDraftPack(value, { project, packet, generatedAt: timestamp, humanRevision: { parentPack: parent, record, ancestorPacks: ancestors } });
  };
  const polished = humanRevise(ancestor, [{ document: 'PROTOCOL_SYNOPSIS', field: 'PARAGRAPH', sectionIndex: 0, index: 2, text: 'Présentation éditoriale pour revue humaine.' }], '2026-09-18T18:01:00.000Z');
  const cleaned = humanRevise(polished, [
    { document: 'PROTOCOL_SYNOPSIS', field: 'PARAGRAPH', sectionIndex: 0, index: 0, text: polished.documents[0].sections[0].paragraphs[0].replace(OLD_DEFINITION, NEW_DEFINITION) },
    { document: 'CRF', field: 'MISSING_ELEMENT', sectionIndex: null, index: 0, text: null },
    { document: 'CRF', field: 'MISSING_ELEMENT', sectionIndex: null, index: 0, text: null },
  ], '2026-09-18T18:02:00.000Z', [ancestor]);
  // Retained transport is derived from the actual batches, including native aliases.
  const batches = prepareDrciGenerationBatches(packet);
  const encode = (documents: DrciDraftPack['documents'], rows: DrciDraftPack['crfRows']) => {
    const facts = new Map(packet.sourceFacts.map((f, i) => [f.ref, `f${i}`]));
    const sources = new Map(evidenceRefs.map((ref, i) => [ref, `s${i}`]));
    return { documents: documents.map(d => ({ ...d, sections: d.sections.map(s => ({ ...s, sourceRefs: s.sourceRefs.map(ref => facts.get(ref)!), paragraphs: s.paragraphs.map(p => p.replace(/\[\[CITE:([^\]]+)\]\]/gu, (_, ref) => `[[CITE:${sources.get(ref)}]]`)) })) })), crfRows: rows.map(r => ({ ...r, variableRef: facts.get(r.variableRef)! })) };
  };
  const retained: RetainedDrciProtocol = { requestContext: batches[0].context, value: encode([full], []), rawOutputRef: 'scientific-interpretation-raw:portable-full',
    remainingScope: { requestContext: batches[1].context, value: encode([original, crf, recruitment], crfRows), rawOutputRef: 'scientific-interpretation-raw:portable-companion' }, synopsisRevision: revision };
  return { project, source, packet, ancestor, polished, cleaned, retained, selection };
};
