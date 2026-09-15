import { logicalDigest, stableStringify } from "@/features/knowledge-engine/canonical";
import { readableKnowledgeConclusion } from "@/features/knowledge-engine/understand-projection";
import { sourceShortReference, type ProjectSource, type ProjectSourceLibrary } from "@/features/knowledge-engine/project-source-library";
import type { RuntimeAssertion } from "@/features/knowledge-engine/types";
import { diffProjections } from "./diff";
import { buildStandardProtocolPresentation } from "./standard-protocol-presentation";
import { buildScientificNarrative, type DocumentNarrativeProjectContext, type DocumentScientificNarrative } from "./scientific-narrative";
import type { DocumentProjection, DocumentSectionInstance } from "./types";

export type DocumentEvidenceParagraph = { paragraphId: string; text: string; assertionRefs: string[]; sourceRefs: string[]; limitations: string[] };
export type DocumentEvidenceContent = {
  owner: "KNOWLEDGE";
  libraryDigest: string;
  paragraphs: DocumentEvidenceParagraph[];
  sources: ProjectSource[];
  excludedSourceRefs: string[];
  emphasisSourceRef: string | null;
  depth: "SHORT" | "EXPANDED";
  caution: boolean;
  notices: string[];
  scope: "SCIENTIFIC_BACKGROUND_NOT_PROJECT_DECISION";
  narrative?: DocumentScientificNarrative;
};
export type DocumentRevisionRecord = {
  instruction: string;
  turnRef: string;
  timestamp: string;
  parentProjectionId: string;
  sourceProjectVersion: string;
  sourceProjectDigest: string;
  scientificImpact: "DOCUMENT_ONLY";
  changedSectionIds: string[];
  addedSourceRefs: string[];
  removedSourceRefs: string[];
  restoredFromProjectionId: string | null;
  validation?: {
    scope: "DOCUMENT_REVISION_ONLY";
    evidenceContentDigest: string;
    citationAssertionConsistency: "PASS";
    preservedSectionDigests: Record<string, string>;
  };
};
export type DocumentaryTransformation = "EXPAND" | "SHORTEN" | "FOCUS_SOURCE" | "ADD_SOURCE" | "REMOVE_SOURCE" | "CAUTION";
const unique = <T>(values: T[]) => [...new Set(values)];
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const admissible = (source: ProjectSource, assertion: RuntimeAssertion) => source.scientificWeight.assessment === "OWNER_QUALIFIED_ASSERTIONS"
  && !/RETRACT|SUPERSEDED|CORRECTED|UNKNOWN|CANDIDATE/.test(source.source.status)
  && assertion.status === "OFFICIAL_EFFECTIVE"
  && ["APPLICABLE_EXACT", "APPLICABLE_WITH_LIMITATIONS", "PARTIALLY_APPLICABLE"].includes(assertion.applicability)
  && source.evidence.some((link) => link.assertionId === assertion.revision && ["SUPPORTS", "QUALIFIES"].includes(link.relation))
  && !source.evidence.some((link) => link.assertionId === assertion.revision && ["REFUTES", "RETRACTS", "CORRECTS"].includes(link.relation));
const contested = (source: ProjectSource, assertion: RuntimeAssertion) => source.conflicts?.some((conflict) => ["CONTRADICTION", "CONTROVERSY"].includes(conflict.state)
  && conflict.positionIds.some((id) => [assertion.stableId, assertion.revision].includes(id))) ?? false;
const supported = (source: ProjectSource, assertion: RuntimeAssertion) => admissible(source, assertion) && !contested(source, assertion);
const assertionText = (assertion: RuntimeAssertion) => {
  const atomic = assertion.atomicContent as { subject?: unknown; predicate?: unknown; object?: unknown } | null;
  const semanticRelation = atomic && typeof atomic.subject === "string" && typeof atomic.predicate === "string" && typeof atomic.object === "string"
    ? { subject: atomic.subject, predicate: atomic.predicate, object: atomic.object } : undefined;
  return readableKnowledgeConclusion({ text: assertion.text, semanticRelation });
};

export const availableDocumentEvidence = (library: ProjectSourceLibrary): DocumentEvidenceParagraph[] => {
  const claims = new Map<string, DocumentEvidenceParagraph>();
  for (const source of library.sources) for (const assertion of source.assertions) {
    if (!supported(source, assertion)) continue;
    if (library.sources.some((other) => other.scientificWeight.assessment === "OWNER_QUALIFIED_ASSERTIONS"
      && other.evidence.some((link) => link.assertionId === assertion.revision && ["REFUTES", "RETRACTS", "CORRECTS"].includes(link.relation)))) continue;
    const text = assertionText(assertion);
    // Machine-only relations are preserved in the library, never passed off as scientific prose.
    if (/noxia:|[A-Z][A-Z0-9]+_[A-Z]| — /.test(text) || text.length < 25) continue;
    const existing = claims.get(assertion.revision);
    claims.set(assertion.revision, { paragraphId: `document-claim:${logicalDigest(assertion.revision)}`, text,
      assertionRefs: [assertion.revision], sourceRefs: unique([...(existing?.sourceRefs ?? []), source.source.sourceId]),
      limitations: unique([...(existing?.limitations ?? []), ...assertion.limitations, ...assertion.applicabilityReasons]),
    });
  }
  return [...claims.values()];
};

export const contradictoryDocumentEvidence = (library: ProjectSourceLibrary): DocumentEvidenceParagraph[] => {
  const claims = new Map<string, DocumentEvidenceParagraph>();
  for (const source of library.sources) for (const assertion of source.assertions) {
    if (!admissible(source, assertion) || !contested(source, assertion)) continue;
    const text = assertionText(assertion);
    if (/noxia:|[A-Z][A-Z0-9]+_[A-Z]| — /.test(text) || text.length < 25) continue;
    const conflictLimitations = source.conflicts?.filter((conflict) => conflict.positionIds.some((id) => [assertion.stableId, assertion.revision].includes(id))).map((conflict) => conflict.explanation) ?? [];
    const existing = claims.get(assertion.revision);
    claims.set(assertion.revision, { paragraphId: `document-conflict:${logicalDigest(assertion.revision)}`, text,
      assertionRefs: [assertion.revision], sourceRefs: unique([...(existing?.sourceRefs ?? []), source.source.sourceId]),
      limitations: unique([...(existing?.limitations ?? []), ...assertion.limitations, ...assertion.applicabilityReasons, ...conflictLimitations]),
    });
  }
  return [...claims.values()];
};

const evidenceWithNarrative = (library: ProjectSourceLibrary, content: DocumentEvidenceContent, projectContext: DocumentNarrativeProjectContext) => {
  const paragraphs = buildScientificNarrativeSelection(library, content.paragraphs, content.depth, content.emphasisSourceRef);
  const contradictoryEvidence = contradictoryDocumentEvidence(library);
  const ids = new Set([...paragraphs, ...contradictoryEvidence].flatMap((paragraph) => paragraph.sourceRefs));
  const withSources = { ...content, libraryDigest: library.digest, paragraphs, sources: copy(library.sources.filter((source) => ids.has(source.source.sourceId))) };
  return { ...withSources, narrative: buildScientificNarrative({ library, paragraphs: withSources.paragraphs, contradictoryEvidence,
    projectContext, depth: withSources.depth, emphasisSourceRef: withSources.emphasisSourceRef }) };
};

export const initialDocumentEvidence = (library: ProjectSourceLibrary, projectContext?: DocumentNarrativeProjectContext): DocumentEvidenceContent => {
  const paragraphs = projectContext ? buildScientificNarrativeSelection(library, availableDocumentEvidence(library), "SHORT", null) : availableDocumentEvidence(library).slice(0, 3);
  const content: DocumentEvidenceContent = { owner: "KNOWLEDGE", libraryDigest: library.digest, paragraphs, sources: [], excludedSourceRefs: [], emphasisSourceRef: null,
    depth: "SHORT", caution: false, notices: paragraphs.length ? [] : ["Aucune assertion rédigée et suffisamment soutenue n’est disponible pour ce contexte dans le corpus local."],
    scope: "SCIENTIFIC_BACKGROUND_NOT_PROJECT_DECISION" };
  return projectContext ? evidenceWithNarrative(library, content, projectContext) : evidenceWithSources(library, content);
};
/** Rebind retained editorial choices to current owner evidence; regeneration never resets exclusions. */
export const regenerateDocumentEvidence = (library: ProjectSourceLibrary, previous?: DocumentEvidenceContent, projectContext?: DocumentNarrativeProjectContext): DocumentEvidenceContent => {
  if (!previous) return initialDocumentEvidence(library, projectContext);
  const current = availableDocumentEvidence(library);
  const paragraphs = previous.paragraphs.flatMap((paragraph) => {
    const qualified = current.find((candidate) => stableStringify(candidate.assertionRefs) === stableStringify(paragraph.assertionRefs));
    if (!qualified) return [];
    const sourceRefs = qualified.sourceRefs.filter((ref) => paragraph.sourceRefs.includes(ref) && !previous.excludedSourceRefs.includes(ref));
    return sourceRefs.length ? [{ ...qualified, sourceRefs }] : [];
  });
  const removed = previous.paragraphs.length - paragraphs.length;
  const base = { ...copy(previous), paragraphs,
    notices: removed ? [`${removed} affirmation(s) retirée(s) : leur support antérieur n’est plus qualifié dans le contexte courant.`] : [...previous.notices] };
  const context = projectContext ?? previous.narrative?.projectContext;
  const content = context ? evidenceWithNarrative(library, base, context) : evidenceWithSources(library, base);
  validateDocumentEvidence(content);
  return content;
};
const evidenceWithSources = (library: ProjectSourceLibrary, content: DocumentEvidenceContent): DocumentEvidenceContent => {
  const ids = new Set([...content.paragraphs, ...(content.narrative?.contradictoryEvidence ?? [])].flatMap((paragraph) => paragraph.sourceRefs));
  return { ...content, libraryDigest: library.digest, sources: copy(library.sources.filter((source) => ids.has(source.source.sourceId))) };
};

const buildScientificNarrativeSelection = (library: ProjectSourceLibrary, paragraphs: DocumentEvidenceParagraph[], depth: "SHORT" | "EXPANDED", emphasisSourceRef: string | null) => {
  const ordered = buildScientificNarrative({ library, paragraphs, contradictoryEvidence: [], projectContext: {
    sourceProjectVersion: "SELECTION_ONLY", sourceProjectDigest: "SELECTION_ONLY", question: "Sélection documentaire", population: [], objectives: [], design: null, measurements: [],
  }, depth, emphasisSourceRef });
  const selected = new Set(ordered.blocks.flatMap((block) => block.assertionRefs));
  return paragraphs.filter((paragraph) => paragraph.assertionRefs.some((ref) => selected.has(ref)));
};

const section = (id: string, title: string, order: number, items: string[], refs: string[], templateNode: string): DocumentSectionInstance => {
  const material: Omit<DocumentSectionInstance, "contentDigest"> = {
    sectionId: id, title, order, intent: "INFORM", pattern: "SYNTHESIS", applicability: "APPLICABLE",
    status: items.length ? "PARTIALLY_GENERATABLE" : "UNKNOWN", statusReasons: [],
    blocks: items.length ? [{ blockId: `doc-block:${logicalDigest([id, items, refs])}`, kind: "PARAGRAPH", label: null, items, commitment: "CANDIDATE", provenanceRefs: refs }] : [],
    unknowns: [], limitations: [], contradictions: [], humanDecisionIds: [], provenanceRefs: refs,
    templateNodeIds: ["TMP-DOC:PROTOCOL", templateNode], templateSectionIds: ["TMP-SECTION-DEF:PROTOCOL:PRIMARY"], templateBlockIds: [templateNode.replace("TMP-NODE:", "TMP-BLOCK-DEF:")],
    projectObjectIds: [], requirementIds: [], patternIds: [], sourceEngine: "KNOWLEDGE", templateStatus: items.length ? "CONDITIONAL" : "UNKNOWN",
    templateReadiness: "PARTIAL", futureReason: null, conflicts: [],
  };
  return { ...material, contentDigest: logicalDigest(material) };
};
const citationFor = (content: DocumentEvidenceContent, sourceId: string) => sourceShortReference(content.sources.find((source) => source.source.sourceId === sourceId)!);
const documentarySentence = (text: string) => {
  const translated = text
    .replace("cardiac motion peut limiter", "Les mouvements cardiaques peuvent limiter")
    .replace("post contrast myocardial t1 ne suffit pas comme substitut autonome de l’ECV DEPENDENT ON CONTRAST DOSE REGION AND SEX IN SELECTED STUDY", "Le T1 myocardique après contraste ne suffit pas comme substitut autonome de l’ECV ; dans l’étude citée, il dépend de la dose de contraste, de la région et du sexe");
  return translated.charAt(0).toLocaleUpperCase("fr-FR") + translated.slice(1);
};
export const documentEvidenceSections = (content: DocumentEvidenceContent): DocumentSectionInstance[] => {
  const refs = unique([...(content.narrative?.blocks ?? []), ...content.paragraphs].flatMap((paragraph) => [...paragraph.assertionRefs, ...paragraph.sourceRefs]));
  const paragraphs = content.paragraphs.map((paragraph) => `${content.caution ? "Dans les limites des références citées : " : ""}${documentarySentence(paragraph.text).replace(/[.\s]+$/u, "")}. (${paragraph.sourceRefs.map((id) => citationFor(content, id)).join(" ; ")})`);
  return [
    section("scientific-background", "Contexte et justification scientifique", 2.5,
      content.narrative?.blocks.length ? content.narrative.blocks.map((block) => `${content.caution && block.basis !== "PROJECT" ? "Dans les limites des références citées : " : ""}${block.text}`)
        : paragraphs.length ? ["Les éléments ci-dessous décrivent le contexte scientifique et méthodologique documenté. Leur applicabilité au protocole proposé doit être distinguée des résultats obtenus dans les populations étudiées par ces références.", ...paragraphs] : ["Le contexte scientifique reste à documenter à partir de preuves applicables."],
      refs, "TMP-NODE:SCIENTIFIC_BACKGROUND"),
    section("scientific-references", "Références bibliographiques", 18,
      content.sources.map((entry) => `${sourceShortReference(entry)}. ${entry.source.title}.${entry.source.doi ? ` DOI : ${entry.source.doi}.` : ""}${entry.source.pmid ? ` PMID : ${entry.source.pmid}.` : ""}${entry.url ? ` ${entry.url}` : ""}`),
      content.sources.map((entry) => entry.source.sourceId), "TMP-NODE:SCIENTIFIC_REFERENCES"),
  ];
};

export const validateDocumentEvidence = (content: DocumentEvidenceContent) => {
  const refs = new Set<string>();
  for (const paragraph of [...content.paragraphs, ...(content.narrative?.contradictoryEvidence ?? [])]) {
    if (!paragraph.assertionRefs.length || !paragraph.sourceRefs.length) throw new Error("DOCUMENT_ORPHAN_ASSERTION");
    for (const sourceId of paragraph.sourceRefs) {
      const source = content.sources.find((candidate) => candidate.source.sourceId === sourceId);
      if (!source || content.excludedSourceRefs.includes(sourceId)) throw new Error("DOCUMENT_CITATION_SOURCE_MISSING");
      const contradictory = paragraph.paragraphId.startsWith("document-conflict:");
      if (!paragraph.assertionRefs.every((ref) => source.assertions.some((assertion) => assertion.revision === ref && (contradictory ? admissible(source, assertion) && contested(source, assertion) : supported(source, assertion)) && assertionText(assertion) === paragraph.text))) throw new Error("DOCUMENT_CITATION_ASSERTION_MISMATCH");
      refs.add(sourceId);
    }
  }
  if (content.sources.some((source) => !refs.has(source.source.sourceId))) throw new Error("DOCUMENT_DECORATIVE_REFERENCE");
  if (content.narrative) {
    const library: ProjectSourceLibrary = { contract: "KNOWLEDGE_PROJECT_SOURCE_LIBRARY", version: "1.0.0", projectId: content.narrative.projectContext.sourceProjectDigest,
      sources: content.sources, unresolvedMentions: [], digest: content.libraryDigest };
    const expected = buildScientificNarrative({ library, paragraphs: content.paragraphs, contradictoryEvidence: content.narrative.contradictoryEvidence,
      projectContext: content.narrative.projectContext, depth: content.depth, emphasisSourceRef: content.emphasisSourceRef });
    if (stableStringify(expected) !== stableStringify(content.narrative)) throw new Error("DOCUMENT_NARRATIVE_DERIVATION_MISMATCH");
  }
  return true;
};

export const reviseScientificDocument = (input: {
  projection: DocumentProjection; library: ProjectSourceLibrary; transformation: DocumentaryTransformation; sourceId?: string;
  instruction: string; turnRef: string; timestamp: string;
}): { projection: DocumentProjection; message: string } => {
  const { projection, library } = input;
  if (projection.source.projectId !== library.projectId || !projection.evidenceContent) throw new Error("DOCUMENT_EVIDENCE_CONTEXT_REQUIRED");
  let content = copy(projection.evidenceContent);
  const all = availableDocumentEvidence(library);
  const sourceId = input.sourceId;
  if (["FOCUS_SOURCE", "ADD_SOURCE", "REMOVE_SOURCE"].includes(input.transformation) && !sourceId) throw new Error("DOCUMENT_SOURCE_RESOLUTION_REQUIRED");
  if (["FOCUS_SOURCE", "ADD_SOURCE"].includes(input.transformation)) content.excludedSourceRefs = content.excludedSourceRefs.filter((ref) => ref !== sourceId);
  const eligible = all.filter((paragraph) => paragraph.sourceRefs.some((ref) => !content.excludedSourceRefs.includes(ref)));
  let message = "L’introduction et ses références ont été révisées ; les décisions du Project et les autres sections sont conservées.";
  if (input.transformation === "REMOVE_SOURCE") {
    const previousCount = content.paragraphs.length;
    content.excludedSourceRefs = unique([...content.excludedSourceRefs, sourceId!]);
    content.paragraphs = content.paragraphs.map((paragraph) => ({ ...paragraph, sourceRefs: paragraph.sourceRefs.filter((ref) => ref !== sourceId) })).filter((paragraph) => paragraph.sourceRefs.length);
    if (content.emphasisSourceRef === sourceId) content.emphasisSourceRef = null;
    const removedCount = previousCount - content.paragraphs.length;
    content.notices = removedCount ? [`${removedCount} affirmation(s) ont été retirées faute de support restant après le retrait de cette référence.`] : [];
    message = removedCount ? `La référence est retirée ; ${removedCount} affirmation(s) sans autre preuve ont également été retirées. Aucune affirmation orpheline n’est conservée.` : "La référence est retirée. Les affirmations conservées disposent encore de leurs autres supports.";
  } else if (input.transformation === "SHORTEN") {
    content.depth = "SHORT";
  } else if (input.transformation === "CAUTION") content.caution = true;
  else {
    const target = sourceId ? eligible.filter((paragraph) => paragraph.sourceRefs.includes(sourceId)) : eligible;
    if (!target.length) throw new Error("SOURCE_WITHOUT_APPLICABLE_DOCUMENTARY_ASSERTION");
    content.excludedSourceRefs = content.excludedSourceRefs.filter((ref) => ref !== sourceId);
    const extra = target.slice(0, input.transformation === "ADD_SOURCE" ? 2 : 8);
    content.paragraphs = [...new Map([...(input.transformation === "FOCUS_SOURCE" ? extra : content.paragraphs), ...extra, ...content.paragraphs].map((paragraph) => [paragraph.paragraphId, paragraph])).values()];
    content.depth = "EXPANDED"; content.notices = [];
    if (sourceId && input.transformation === "FOCUS_SOURCE") content.emphasisSourceRef = sourceId;
  }
  content.paragraphs = content.paragraphs.map((paragraph) => ({ ...paragraph, sourceRefs: paragraph.sourceRefs.filter((ref) => !content.excludedSourceRefs.includes(ref)) })).filter((paragraph) => paragraph.sourceRefs.length);
  const context = content.narrative?.projectContext;
  content = context ? evidenceWithNarrative(library, content, context) : evidenceWithSources(library, content);
  validateDocumentEvidence(content);
  if (stableStringify(content) === stableStringify(projection.evidenceContent)) return { projection, message: "Cette demande ne produit aucun changement supplémentaire avec les éléments actuellement soutenus. Aucune version identique n’est ajoutée." };
  return { projection: revisedProjection(projection, content, input), message };
};

const revisedProjection = (prior: DocumentProjection, content: DocumentEvidenceContent, input: { instruction: string; turnRef: string; timestamp: string }) => {
  validateDocumentEvidence(content);
  const sections = [...prior.sections.filter((item) => !["scientific-background", "scientific-references"].includes(item.sectionId)), ...documentEvidenceSections(content)].sort((a, b) => a.order - b.order);
  const sourceRefs = (value: DocumentEvidenceContent) => value.sources.map((entry) => entry.source.sourceId);
  const before = sourceRefs(prior.evidenceContent!); const after = sourceRefs(content);
  const revision: DocumentRevisionRecord = { instruction: input.instruction, turnRef: input.turnRef, timestamp: input.timestamp,
    parentProjectionId: prior.projectionId, sourceProjectVersion: prior.source.projectVersion, sourceProjectDigest: prior.source.projectDigest, scientificImpact: "DOCUMENT_ONLY",
    changedSectionIds: sections.filter((item) => prior.sections.find((old) => old.sectionId === item.sectionId)?.contentDigest !== item.contentDigest).map((item) => item.sectionId),
    addedSourceRefs: after.filter((ref) => !before.includes(ref)), removedSourceRefs: before.filter((ref) => !after.includes(ref)), restoredFromProjectionId: null,
    validation: { scope: "DOCUMENT_REVISION_ONLY", evidenceContentDigest: logicalDigest(content), citationAssertionConsistency: "PASS",
      preservedSectionDigests: Object.fromEntries(prior.sections.filter((section) => !["scientific-background", "scientific-references"].includes(section.sectionId)).map((section) => [section.sectionId, section.contentDigest])) } };
  const [major, minor, patch] = prior.projectionVersion.split(".").map(Number);
  const material = { priorProjectionId: prior.projectionId, source: prior.source, sections, evidenceContent: content, documentaryRevision: revision };
  const digest = logicalDigest(material);
  return { ...prior, projectionId: `document-projection:${digest}`, projectionDigest: digest, projectionVersion: `${major}.${minor}.${patch + 1}`,
    priorProjectionId: prior.projectionId, requestedAt: input.timestamp, sections, evidenceContent: content, documentaryRevision: revision,
    // The new evidence-aware audit is separate from the prior immutable projection's receipt.
    audit: undefined, provenanceRefs: unique([...prior.provenanceRefs, libraryRef(content), input.turnRef]),
  };
};
const libraryRef = (content: DocumentEvidenceContent) => `knowledge-library:${content.libraryDigest}`;
export const readableDocumentDiff = (previous: DocumentProjection, current: DocumentProjection) => {
  const diff = diffProjections(previous, current);
  const before = buildStandardProtocolPresentation(previous).sections;
  const after = buildStandardProtocolPresentation(current).sections;
  const content = (section: typeof before[number] | undefined) => section?.entries.map(({ label, value }) => ({ label, value })) ?? [];
  const changed = unique([...before.map((section) => section.sectionId), ...after.map((section) => section.sectionId)]).flatMap((id) => {
    const old = before.find((section) => section.sectionId === id); const next = after.find((section) => section.sectionId === id);
    return stableStringify(content(old)) === stableStringify(content(next)) ? [] : [`${next?.title ?? old!.title} : ${!old ? "ajoutée" : !next ? "retirée" : "modifiée"}`];
  });
  const administrationChanged = previous.source.administrationDigest !== current.source.administrationDigest;
  return `Version ${previous.projectionVersion} → ${current.projectionVersion}. ${changed.join(" ; ") || "Contenu des sections inchangé"}.${administrationChanged ? " Informations administratives modifiées." : ""} ${diff.sourceVersionChanged ? "La version scientifique du Project a changé." : "La version scientifique du Project est inchangée."}`;
};

export const restoreDocumentRevision = (current: DocumentProjection, previous: DocumentProjection, input: { instruction: string; turnRef: string; timestamp: string }) => {
  if (current.seriesId !== previous.seriesId || current.source.projectVersion !== previous.source.projectVersion
    || current.source.projectDigest !== previous.source.projectDigest || current.source.administrationDigest !== previous.source.administrationDigest
    || !previous.evidenceContent || !current.evidenceContent) throw new Error("DOCUMENT_RESTORE_SOURCE_CHANGED");
  validateDocumentEvidence(previous.evidenceContent);
  const restored = revisedProjection(current, copy(previous.evidenceContent), input);
  const sections = [...current.sections.filter((section) => !["scientific-background", "scientific-references"].includes(section.sectionId)),
    ...copy(previous.sections.filter((section) => ["scientific-background", "scientific-references"].includes(section.sectionId)))].sort((a, b) => a.order - b.order);
  const revision = { ...restored.documentaryRevision!, restoredFromProjectionId: previous.projectionId,
    changedSectionIds: sections.filter((section) => current.sections.find((old) => old.sectionId === section.sectionId)?.contentDigest !== section.contentDigest).map((section) => section.sectionId) };
  const digest = logicalDigest({ priorProjectionId: current.projectionId, source: restored.source, sections, evidenceContent: restored.evidenceContent, documentaryRevision: revision });
  return { ...restored, sections, documentaryRevision: revision, projectionId: `document-projection:${digest}`, projectionDigest: digest };
};
