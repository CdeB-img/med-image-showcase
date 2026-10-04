import { afterEach, describe, expect, it } from 'vitest';
import { logicalDigest } from '@/features/knowledge-engine/canonical';
import { createProjectSession, readProjectSessions, saveProjectSession } from '@/features/protocol-designer/functional-reset/project-workspace-storage';
import { drciDraftPackFiles, openParentCoveredByDetails } from '../drci-draft-pack';
import { applyDrciHumanRevisionEntries, drciProseWordCount, materializeDrciDraftPack, prepareDrciDraftPack } from '../drci-draft-contract';
import { portableDrciFixture } from './portable-drci-fixture';
const fixture=portableDrciFixture();
const {polished:parent,cleaned:candidate,ancestor,project}=fixture;
const packet=prepareDrciDraftPack(project,fixture.source);
const data=()=>structuredClone({documents:candidate.documents,crfRows:candidate.crfRows});
const admit=(record=candidate.humanRevision!,ancestors=[ancestor])=>materializeDrciDraftPack(data(),{project,packet,generatedAt:candidate.generatedAt,
 reusedProtocolEvidenceRef:parent.reusedProtocolEvidenceRef,humanRevision:{parentPack:parent,record,ancestorPacks:ancestors}});
afterEach(()=>localStorage.clear());
describe('Exact final human document cleanup',()=>{
 it('aligns only the authorized synopsis definition and retains every citation at 747 words',()=>{
  const before=parent.documents.find(d=>d.kind==='PROTOCOL_SYNOPSIS')!;const after=candidate.documents.find(d=>d.kind==='PROTOCOL_SYNOPSIS')!;
  const old='Il quantifie la présence interstitielle de gadolinium relativement au plasma, sans constituer une mesure spécifique de fibrose.';
  const revised='Il estime la fraction de volume extracellulaire myocardique à partir du coefficient de partition du contraste entre le myocarde et le sang, corrigé par l’hématocrite, sans constituer une mesure histologique spécifique de fibrose.';
  expect(after.sections[0].paragraphs[0]).toBe(before.sections[0].paragraphs[0].replace(old,revised));
  expect(after.sections.slice(1)).toEqual(before.sections.slice(1));expect(after.sections[0].sourceRefs).toEqual(before.sections[0].sourceRefs);
  const cite=(doc:typeof before)=>doc.sections.flatMap(s=>s.paragraphs).join(' ').match(/\[\[CITE:[^\]]+\]\]/gu);
  expect(cite(after)).toEqual(cite(before));expect(drciProseWordCount(after.sections.flatMap(s=>s.paragraphs))).toBe(747);
  expect(candidate.humanRevision!.entries[0].revisionOrigin).toBe('HUMAN_REVIEW');
 });
 it('does not render an empty OPEN heading or checklist notice in any document, and preserves the review footer',()=>{
  const doc={kind:'PROTOCOL_SYNOPSIS' as const,title:'Étude de reproductibilité',sections:[{title:'Limites et éléments ouverts',paragraphs:['Un calendrier de lecture reste à préciser.'],sourceRefs:[]}],missingElements:[]};
  const pack={...candidate,documents:[doc],sourceFacts:[],evidenceContent:undefined};const file=drciDraftPackFiles(pack)[0];
  expect(file.markdown).not.toContain('## À définir avant gel');expect(file.html).not.toContain('class="open-checklist');
  expect(file.html).not.toContain('Chaque entrée ci-dessous');expect(file.markdown).toContain('Revue scientifique, réglementaire et institutionnelle requise.');
  expect(file.html).toContain('Un calendrier de lecture reste à préciser.');
  const nonempty={...pack,documents:[{...doc,missingElements:['Institution: contact à préciser']}]};
  const other=drciDraftPackFiles(nonempty)[0];expect(other.html).toContain('class="open-checklist');expect(other.markdown).toContain('☐ Contact à préciser');
 });
 it('requires every parent component to be exactly covered by distinct details, without fuzzy matching',()=>{
  expect(openParentCoveredByDetails('Stockage et durée de conservation',['Support de stockage des données','Durée de conservation des données'])).toBe(true);
  expect(openParentCoveredByDetails('Stockage et durée de conservation',['Support de stockage des données'])).toBe(false);
  expect(openParentCoveredByDetails('Stockage chiffré et durée de conservation',['Support de stockage des données','Durée de conservation des données'])).toBe(false);
  expect(openParentCoveredByDetails('Stockage et durée de conservation',['Stockage et durée de conservation'])).toBe(false);
  expect(openParentCoveredByDetails('Stockage',['Support de stockage des données'])).toBe(false);
  expect(openParentCoveredByDetails('Stockage et durée de conservation',['Stockages des données','Durées de conservation des données'])).toBe(false);
 });
 it('renders generic parent/details OPEN projections once while preserving an incompletely covered parent',()=>{
  const doc={kind:'CRF' as const,title:'Recueil méthodologique',sections:[{title:'Organisation',paragraphs:['Recueil à documenter.'],sourceRefs:[]}],missingElements:['Stockage et durée de conservation']};
  const fact=(ref:string,content:string)=>({ref,type:'PROJECT_INFORMATION',content,polarity:'AFFIRMED',epistemicState:'UNKNOWN'});
  const details=[fact('open:storage','Support de stockage des données'),fact('open:retention','Durée de conservation des données')];
  const pack={...candidate,documents:[doc],crfRows:[],sourceFacts:details,evidenceContent:undefined};const file=drciDraftPackFiles(pack)[0];
  expect(file.markdown).not.toContain('☐ Stockage et durée de conservation');
  expect(file.markdown).toContain('☐ Support de stockage des données');expect(file.markdown).toContain('☐ Durée de conservation des données');
  expect(drciDraftPackFiles({...pack,sourceFacts:details.slice(0,1)})[0].markdown).toContain('☐ Stockage et durée de conservation');
 });
 it('keeps protocol and recruitment HTML/Markdown byte-identical, and changes the CRF only by the two OPEN entries',()=>{
  // Synthetic native ancestors replace private historical exports. Compare the
  // actual renderer byte-for-byte; historical human evidence is not rewritten.
  const files=drciDraftPackFiles(candidate), parentFiles=drciDraftPackFiles(parent);
  for(const kind of ['PROTOCOL_FULL','RECRUITMENT'] as const){const file=files.find(f=>f.kind===kind)!;
   expect(file.html).toBe(parentFiles.find(f=>f.kind===kind)!.html);
   expect(file.markdown).toBe(parentFiles.find(f=>f.kind===kind)!.markdown);
   expect(candidate.documents.find(d=>d.kind===kind)).toEqual(parent.documents.find(d=>d.kind===kind));
  }
  const current=files.find(f=>f.kind==='CRF')!;const oldHtml=parentFiles.find(f=>f.kind==='CRF')!.html;const oldMd=parentFiles.find(f=>f.kind==='CRF')!.markdown;
  expect(current.html).toBe(oldHtml.replace('<li>☐ Procédure PA</li>','').replace('<li>☐ Contraste et critères rénaux</li>',''));
  expect(current.markdown).toBe(oldMd.replace('- ☐ Procédure PA\n\n','').replace('- ☐ Contraste et critères rénaux\n\n',''));
  expect(candidate.crfRows).toEqual(parent.crfRows);expect(candidate.crfRows).toHaveLength(fixture.source.crf.fields.length);
  expect(candidate.crfRows.map(r=>r.variableRef)).toEqual(fixture.source.crf.fields.map(f=>f.canonicalVariableId));
  expect(current.html.match(/class="process-field"/gu)).toHaveLength(8);
  expect(current.markdown.match(/☐ Procédure de mesure de la pression artérielle/gu)).toHaveLength(1);
  expect(current.markdown).toContain('☐ Agent et dose de contraste');expect(current.markdown).toContain('☐ Critères rénaux locaux');
 });
 it('admits the exact pack and verifies both human revisions plus the original native ancestor',()=>{
  expect(admit()).toEqual(candidate);expect(candidate.humanRevision!.priorHumanRevision).toEqual(parent.humanRevision);
  expect(candidate.sourceFacts).toEqual(parent.sourceFacts);expect(candidate.evidenceContent).toEqual(parent.evidenceContent);expect(candidate.project).toEqual(parent.project);
  expect(applyDrciHumanRevisionEntries(parent,candidate.humanRevision!.entries)).toEqual(data());
 });
 it('fails closed on missing/tampered ancestry, prior provenance and any CRF scientific-paragraph edit',()=>{
  expect(()=>admit(undefined,[])).toThrow('DRCI_HUMAN_REVISION_ANCESTOR_REQUIRED');
  const bad={...structuredClone(ancestor),packDigest:'ke1-invalid'};expect(()=>admit(undefined,[bad])).toThrow();
  const record=structuredClone(candidate.humanRevision!);record.priorHumanRevision!.entries[0].reason='drift';expect(()=>admit(record)).toThrow('DRCI_HUMAN_REVISION_PROVENANCE_MISMATCH');
  const crf=candidate.documents.find(d=>d.kind==='CRF')!;const entry=structuredClone(candidate.humanRevision!.entries[0]);
  entry.document='CRF';entry.section=crf.sections[0].title;entry.originalText=crf.sections[0].paragraphs[0];entry.originalDigest=logicalDigest(entry.originalText);entry.revisedText='Un changement scientifique interdit.';entry.revisedDigest=logicalDigest(entry.revisedText);
  expect(()=>applyDrciHumanRevisionEntries(parent,[entry])).toThrow('DRCI_HUMAN_REVISION_ANCHOR_INVALID');
 });
 it('persists and reloads the full native pack while retaining ancestors, Project and the four export hashes',()=>{
  const saved=createProjectSession(localStorage,'Final DRCI');saved.session.projectId=project.projectId;
  saveProjectSession(localStorage,saved,{...saved.session,project,drciDraftPacks:[ancestor,parent]});const existing=readProjectSessions(localStorage).projects[0];
  saveProjectSession(localStorage,existing,{...existing.session,drciDraftPacks:[ancestor,parent,candidate]});
  const session=readProjectSessions(localStorage).projects[0].session;
  expect(session.project).toEqual(project);expect(session.drciDraftPacks).toEqual([ancestor,parent,candidate]);
  expect(drciDraftPackFiles(session.drciDraftPacks!.at(-1)!).map(f=>logicalDigest(f.html))).toEqual(drciDraftPackFiles(candidate).map(f=>logicalDigest(f.html)));
 });
});
