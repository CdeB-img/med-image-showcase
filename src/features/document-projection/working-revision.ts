import { z } from "zod";
import { logicalDigest, stableStringify } from "../knowledge-engine/canonical.js";
import { documentNativeIdentity, documentNativeProject, type DocumentGenerationBody, type DocumentGenerationRef } from "./generation-persistence.js";

export const DOCUMENT_WORKING_REVISION_CONTRACT = "DOCUMENT_WORKING_REVISION_V1" as const;
const text = z.string().max(1_000_000).refine(value => !value.includes("\u0000"));
const ref = z.string().min(1).max(600).refine(value => !value.includes("\u0000"));
const binding = z.object({ projectId: ref, projectVersion: ref, projectDigest: ref }).strict();
const node = z.object({ nodeId: ref, nativeAnchor: ref, text,
  nativeDigest: ref, provenanceRefs: z.array(ref), factRefs: z.array(ref), citationRefs: z.array(ref) }).strict();
export const editableDocumentContentSchema = z.object({ title: text,
  sections: z.array(z.object({ nodeId: ref, nativeAnchor: ref, title: text, provenanceRefs: z.array(ref),
    blocks: z.array(node) }).strict()) }).strict();
export type EditableDocumentContent = { title: string; sections: {
  nodeId: string; nativeAnchor: string; title: string; provenanceRefs: string[];
  blocks: { nodeId: string; nativeAnchor: string; text: string; nativeDigest: string; provenanceRefs: string[]; factRefs: string[]; citationRefs: string[] }[];
}[] };
export const workingRevisionSchema = z.object({
  contract: z.literal(DOCUMENT_WORKING_REVISION_CONTRACT), revisionId: ref,
  logicalDocumentRef: ref, identitySource: z.object({ seriesId: ref, documentDefinitionId: ref.nullable(), nativeDocumentRef: ref }).strict(),
  baseGenerationId: ref, baseGenerationBodyDigest: z.string().regex(/^[a-f0-9]{64}$/u),
  project: binding, content: editableDocumentContentSchema, contentDigest: ref,
  saveSequence: z.number().int().positive().safe(), status: z.enum(["ACTIVE", "ABANDONED"]),
  createdAt: z.string().datetime(), updatedAt: z.string().datetime(),
  provenance: z.object({ origin: z.literal("ARCHIVED_NATIVE_DOCUMENT"), sessionRef: ref,
    lastAction: z.enum(["CREATE", "USER_TEXT_EDIT", "USER_ABANDON", "FINALIZE"]), finalizationRef: ref.optional(), semanticImpact: z.literal("UNASSESSED") }).strict(),
  boundary: z.literal("NOT_PROJECT_TRUTH_NOT_GENERATED_DOCUMENT"),
}).strict();
export type DocumentWorkingRevision = {
  contract: typeof DOCUMENT_WORKING_REVISION_CONTRACT; revisionId: string; logicalDocumentRef: string;
  identitySource: { seriesId: string; documentDefinitionId: string | null; nativeDocumentRef: string };
  baseGenerationId: string; baseGenerationBodyDigest: string;
  project: { projectId: string; projectVersion: string; projectDigest: string };
  content: EditableDocumentContent; contentDigest: string; saveSequence: number; status: "ACTIVE" | "ABANDONED";
  createdAt: string; updatedAt: string; provenance: { origin: "ARCHIVED_NATIVE_DOCUMENT"; sessionRef: string;
    lastAction: "CREATE" | "USER_TEXT_EDIT" | "USER_ABANDON" | "FINALIZE"; finalizationRef?: string; semanticImpact: "UNASSESSED" };
  boundary: "NOT_PROJECT_TRUTH_NOT_GENERATED_DOCUMENT";
};
export const workingRevisionResultSchema = z.object({ revision: workingRevisionSchema,
  baseState: z.object({ sourceVerified: z.literal(true), projectCurrent: z.boolean(), generationCurrent: z.boolean(), stale: z.boolean() }).strict(),
}).strict();
export type DocumentWorkingRevisionResult = { revision: DocumentWorkingRevision;
  baseState: { sourceVerified: true; projectCurrent: boolean; generationCurrent: boolean; stale: boolean } };
export class DocumentWorkingRevisionError extends Error {
  constructor(readonly code: string, readonly status: 400 | 403 | 404 | 409 | 413 | 503 = 409) { super(code); }
}
export const workingRevisionContentDigest = (content: unknown) => logicalDigest(content);
export const assertWorkingRevision = (value: unknown): DocumentWorkingRevision => {
  const parsed = workingRevisionSchema.safeParse(value);
  if (!parsed.success || parsed.data.contentDigest !== workingRevisionContentDigest(parsed.data.content))
    throw new DocumentWorkingRevisionError("DOC_REVISION_STATE_INVALID", 503);
  return parsed.data as DocumentWorkingRevision;
};

type ArchivedSource = { ref: DocumentGenerationRef; body: DocumentGenerationBody };
/** Shared native adapter for archived bodies and validated, not-yet-committed packs. */
export const editableDrciDocumentContent = (logicalDocumentRef: string, document: import("./drci-draft-contract.js").DrciDraftPack["documents"][number]): EditableDocumentContent => ({
  title: document.title, sections: document.sections.map((section, index) => ({
    nodeId: `document-section:${logicalDigest([logicalDocumentRef, index])}`, nativeAnchor: `documents/${document.kind}/sections/${index}`,
    title: section.title, provenanceRefs: [...section.sourceRefs], blocks: section.paragraphs.map((text, paragraphIndex) => {
      const anchor = `documents/${document.kind}/sections/${index}/paragraphs/${paragraphIndex}`;
      return { nodeId: `document-text:${logicalDigest([logicalDocumentRef, anchor])}`, nativeAnchor: anchor, text,
        nativeDigest: logicalDigest(text), provenanceRefs: [...section.sourceRefs],
        factRefs: [...text.matchAll(/\[\[FACT:([^\]]+)\]\]/gu)].map(match => match[1]),
        citationRefs: [...text.matchAll(/\[\[CITE:([^\]]+)\]\]/gu)].map(match => match[1]) };
    }),
  })),
});
/** Native adapters only. The open string is a selector of an existing document,
 * not an ontology/portfolio registry or a filename-derived identity. */
export const editableArchivedDocument = (source: ArchivedSource, nativeDocumentRef: string, projectionSource?: ArchivedSource) => {
  const { ref: generation, body } = source;
  const native = body.native, sourceProject = documentNativeProject(native);
  const project = binding.parse({ projectId: sourceProject.projectId, projectVersion: sourceProject.projectVersion, projectDigest: sourceProject.projectDigest });
  const refProject = generation.project;
  if (documentNativeIdentity(native) !== generation.generationId || project.projectId !== refProject.projectId
    || project.projectVersion !== refProject.projectVersion || project.projectDigest !== refProject.projectDigest)
    throw new DocumentWorkingRevisionError("DOC_REVISION_SOURCE_BINDING_INVALID", 403);
  const projection = native.family === "TEMPLATE" ? native.value : projectionSource?.body.native.family === "TEMPLATE" ? projectionSource.body.native.value : null;
  if (!projection || native.family === "DRCI" && (projection.projectionId !== native.value.protocolProjectionId
    || projectionSource?.ref.generationId !== projection.projectionId || projectionSource.ref.family !== "TEMPLATE"
    || stableStringify(projection.source && { projectId: projection.source.projectId, projectVersion: projection.source.projectVersion,
      projectDigest: projection.source.projectDigest }) !== stableStringify(project)
    || !projection.humanDecisions.some(decision => logicalDigest(decision) === native.value.handoffDecisionDigest)))
    throw new DocumentWorkingRevisionError("DOC_REVISION_LOGICAL_SOURCE_INVALID", 403);
  const identitySource = { seriesId: projection.seriesId, documentDefinitionId: projection.documentDefinition?.documentId ?? null, nativeDocumentRef };
  const logicalDocumentRef = `document-logical:${logicalDigest(identitySource)}`;
  const block = (value: string, anchor: string, provenanceRefs: readonly string[]) => ({
    nodeId: `document-text:${logicalDigest([logicalDocumentRef, anchor])}`, nativeAnchor: anchor,
    // Keep native FACT/CITE tokens losslessly and protect their ordered bindings.
    // Their presence never certifies the meaning of subsequently edited prose.
    text: value, nativeDigest: logicalDigest(value), provenanceRefs: [...provenanceRefs],
    factRefs: [...value.matchAll(/\[\[FACT:([^\]]+)\]\]/gu)].map(match => match[1]),
    citationRefs: [...value.matchAll(/\[\[CITE:([^\]]+)\]\]/gu)].map(match => match[1]),
  });
  let content: EditableDocumentContent;
  if (native.family === "DRCI") {
    const document = native.value.documents.find(item => item.kind === nativeDocumentRef);
    if (!document) throw new DocumentWorkingRevisionError("DOC_REVISION_DOCUMENT_NOT_FOUND", 404);
    content = editableDrciDocumentContent(logicalDocumentRef, document);
  } else {
    if (nativeDocumentRef !== (projection.documentDefinition?.documentId ?? projection.projectionType))
      throw new DocumentWorkingRevisionError("DOC_REVISION_DOCUMENT_NOT_FOUND", 404);
    content = { title: projection.title, sections: projection.sections.map(section => ({
      nodeId: section.sectionId, nativeAnchor: `sections/${section.sectionId}`, title: section.title, provenanceRefs: [...section.provenanceRefs],
      blocks: section.blocks.flatMap(item => item.items.map((value, index) => ({ ...block(value,
        `sections/${section.sectionId}/blocks/${item.blockId}/items/${index}`, item.provenanceRefs), nodeId: `${item.blockId}:item:${index}` }))),
    })) };
  }
  return { logicalDocumentRef, identitySource, project: project as DocumentWorkingRevision["project"], content: editableDocumentContentSchema.parse(content) as EditableDocumentContent };
};

/** V1 edits text only. Nodes, ordering, cardinalities and native bindings cannot
 * be changed through SAVE. Other native objects remain in the immutable base. */
export const validateWorkingRevisionContent = (value: unknown, base: EditableDocumentContent): EditableDocumentContent => {
  const parsed = editableDocumentContentSchema.safeParse(value);
  const structure = (content: EditableDocumentContent) => ({ ...content, title: null,
    sections: content.sections.map(section => ({ ...section, title: null, blocks: section.blocks.map(block => ({ ...block, text: null })) })) });
  if (!parsed.success || stableStringify(structure(parsed.data as EditableDocumentContent)) !== stableStringify(structure(base)))
    throw new DocumentWorkingRevisionError("DOC_REVISION_PROTECTED_STRUCTURE_CHANGED", 400);
  const tokens = (value: string) => [...value.matchAll(/\[\[(?:FACT|CITE):[^\]]+\]\]/gu)].map(match => match[0]);
  const invalidTokens = (value: string, original: string) => stableStringify(tokens(value)) !== stableStringify(tokens(original))
    || (value.match(/\[\[(?:FACT|CITE):/gu)?.length ?? 0) !== tokens(value).length;
  if (invalidTokens(parsed.data.title, base.title)
    || parsed.data.sections.some((section, index) => invalidTokens(section.title, base.sections[index].title)
      || section.blocks.some((block, blockIndex) => invalidTokens(block.text, base.sections[index].blocks[blockIndex].text))))
    throw new DocumentWorkingRevisionError("DOC_REVISION_BINDING_IN_EDITABLE_TEXT", 400);
  return parsed.data as EditableDocumentContent;
};

export type CreateWorkingRevision = { revisionId: string; baseGenerationId: string; baseGenerationBodyDigest: string; nativeDocumentRef: string };
export type OpenWorkingRevision = Omit<CreateWorkingRevision, "revisionId">;
export type SaveWorkingRevision = { revisionId: string; expectedSaveSequence: number; content: EditableDocumentContent };
export type AbandonWorkingRevision = { revisionId: string; expectedSaveSequence: number };
export type DocumentWorkingRevisionClient = Readonly<{
  open(input: OpenWorkingRevision): Promise<DocumentWorkingRevisionResult>;
  create(input: CreateWorkingRevision): Promise<DocumentWorkingRevisionResult>;
  get(revisionId: string): Promise<DocumentWorkingRevisionResult>;
  getSave?(input: { revisionId: string; saveSequence: number; contentDigest: string }): Promise<DocumentWorkingRevisionResult>;
  save(input: SaveWorkingRevision): Promise<DocumentWorkingRevisionResult>;
  abandon(input: AbandonWorkingRevision): Promise<DocumentWorkingRevisionResult>;
}>;
